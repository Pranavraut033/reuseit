#!/usr/bin/env python
"""Train object detection model for waste items with edge detection.

This model uses MobileNetV2 as backbone with custom detection head that outputs:
- Bounding boxes (x, y, width, height)
- Class probabilities
- Edge masks for detected objects
"""

import argparse
import os
import json
from pathlib import Path
from datetime import datetime
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import cv2
from typing import Tuple, List, Dict
from rich import print
from rich.progress import track

# Add parent directory to path for imports
import sys

sys.path.append(str(Path(__file__).parent.parent))
from dataset_utils import get_canonical_classes, prepare_datasets
from object_detection.config import ObjectDetectionConfig


def create_synthetic_bboxes(image_shape: Tuple[int, int], num_boxes: int = 1) -> np.ndarray:
    """Create synthetic bounding boxes for images (as we don't have real annotations).

    This generates random bounding boxes that will be refined during training.
    In production, you'd use actual annotated data.
    """
    boxes = []
    h, w = image_shape[:2]

    for _ in range(num_boxes):
        # Generate random box
        box_w = np.random.randint(int(w * 0.3), int(w * 0.8))
        box_h = np.random.randint(int(h * 0.3), int(h * 0.8))
        x = np.random.randint(0, w - box_w)
        y = np.random.randint(0, h - box_h)

        # Normalize coordinates
        boxes.append(
            [x / w, y / h, (x + box_w) / w, (y + box_h) / h]  # x_min  # y_min  # x_max  # y_max
        )

    return np.array(boxes, dtype=np.float32)


def detect_edges_canny(image: np.ndarray) -> np.ndarray:
    """Detect edges using Canny edge detector.

    Ensures input is uint8 (required by OpenCV Canny). Accepts float32 arrays in [0,1]
    or other numeric dtypes and safely converts them.
    """
    # Ensure contiguous array
    if not image.flags["C_CONTIGUOUS"]:
        image = np.ascontiguousarray(image)

    # Convert dtype to uint8 expected by Canny
    if image.dtype != np.uint8:
        # If values look like normalized floats, scale; else clip to [0,255]
        if image.dtype in (np.float32, np.float64):
            # Assume range [0,1] or already [0,255]; detect max to decide.
            max_val = image.max()
            if max_val <= 1.5:  # treat as normalized
                image = (np.clip(image, 0.0, 1.0) * 255.0).astype(np.uint8)
            else:
                image = np.clip(image, 0.0, 255.0).astype(np.uint8)
        else:
            image = np.clip(image, 0, 255).astype(np.uint8)

    # Convert to grayscale if needed
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray = image

    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 1.4)

    # Canny edge detection (guard against OpenCV assertion failures)
    try:
        edges = cv2.Canny(blurred, threshold1=50, threshold2=150)
    except cv2.error:
        # Fallback: return zeros if Canny fails
        edges = np.zeros_like(gray, dtype=np.uint8)

    # Normalize to [0, 1]
    return edges.astype(np.float32) / 255.0


def create_edge_mask(image: np.ndarray, bbox: np.ndarray = None) -> np.ndarray:
    """Create edge mask for the entire image or within bbox."""
    edges = detect_edges_canny(image)

    if bbox is not None and len(bbox) == 4:
        # Create mask only within bbox
        h, w = edges.shape
        x_min, y_min, x_max, y_max = bbox

        # Denormalize
        x_min = int(x_min * w)
        y_min = int(y_min * h)
        x_max = int(x_max * w)
        y_max = int(y_max * h)

        mask = np.zeros_like(edges)
        mask[y_min:y_max, x_min:x_max] = edges[y_min:y_max, x_min:x_max]
        return mask

    return edges


def augment_image(image: tf.Tensor, config: ObjectDetectionConfig) -> tf.Tensor:
    """Apply stable data augmentation for robust training."""
    # Random horizontal flip
    if tf.random.uniform([]) < 0.5:
        image = tf.image.flip_left_right(image)

    # Random brightness
    image = tf.image.random_brightness(image, config.brightness_range)

    # Random contrast
    image = tf.image.random_contrast(image, *config.contrast_range)

    # Random saturation (small range)
    image = tf.image.random_saturation(image, *config.saturation_range)

    # Random hue (very small range)
    image = tf.image.random_hue(image, config.hue_range)

    # Add light Gaussian noise
    if config.gaussian_noise_std > 0:
        noise = tf.random.normal(tf.shape(image), mean=0.0, stddev=config.gaussian_noise_std)
        image = tf.clip_by_value(image + noise, 0.0, 1.0)

    # Ensure values are in valid range
    image = tf.clip_by_value(image, 0.0, 1.0)

    return image


def load_and_preprocess_image(
    image_path: str, label: int, config: ObjectDetectionConfig, is_training: bool = True
) -> Tuple[tf.Tensor, Dict]:
    """Load image and create detection targets."""
    # Load image
    image = tf.io.read_file(image_path)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, [config.image_size, config.image_size])
    image = tf.cast(image, tf.float32) / 255.0

    # Apply augmentation during training
    if is_training and tf.random.uniform([]) < config.augment_prob:
        image = augment_image(image, config)

    # Create synthetic bbox (in real scenario, load from annotations)
    # For simplicity, using center crop as bbox
    bbox = tf.constant([[0.1, 0.1, 0.9, 0.9]], dtype=tf.float32)

    # Create edge mask using numpy operations
    edge_mask = tf.numpy_function(
        func=lambda img: create_edge_mask(img), inp=[image], Tout=tf.float32
    )
    edge_mask = tf.reshape(edge_mask, [config.image_size, config.image_size, 1])

    # One-hot encode class
    num_classes = len(get_canonical_classes())
    class_label = tf.one_hot(label, num_classes)

    targets = {"bbox": bbox, "class": class_label, "edges": edge_mask}

    return image, targets


def build_detection_model(config: ObjectDetectionConfig, num_classes: int) -> keras.Model:
    """Build object detection model with edge detection and regularization.

    Architecture:
    - MobileNetV2 backbone (feature extraction)
    - Detection head (bounding boxes + classification)
    - Edge detection head (edge masks)
    - L2 regularization and dropout for overfitting prevention
    """

    # Input
    inputs = keras.Input(shape=(config.image_size, config.image_size, 3), name="image")

    # Backbone: MobileNetV2
    # Use fixed backbone input size for pretrained weights; resize input if different.
    BACKBONE_SIZE = 224
    if config.image_size != BACKBONE_SIZE:
        backbone_input = layers.Resizing(BACKBONE_SIZE, BACKBONE_SIZE, name="backbone_resize")(
            inputs
        )
    else:
        backbone_input = inputs

    backbone = keras.applications.MobileNetV2(include_top=False, weights="imagenet")
    backbone.trainable = config.backbone_trainable

    # Extract features
    x = backbone(backbone_input, training=config.backbone_trainable)

    # Global features for classification and bbox
    global_pool = layers.GlobalAveragePooling2D()(x)

    # === Bounding Box Head ===
    bbox_dense = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="bbox_dense1",
    )(global_pool)
    bbox_dense = layers.Dropout(config.dropout_rate)(bbox_dense)
    bbox_dense = layers.Dense(
        128,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="bbox_dense2",
    )(bbox_dense)
    bbox_dense = layers.Dropout(config.dropout_rate)(bbox_dense)
    bbox_output = layers.Dense(4, activation="sigmoid", name="bbox")(bbox_dense)

    # === Classification Head ===
    class_dense = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="class_dense1",
    )(global_pool)
    class_dense = layers.Dropout(config.dropout_rate)(class_dense)
    class_dense = layers.Dense(
        128,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="class_dense2",
    )(class_dense)
    class_dense = layers.Dropout(config.dropout_rate)(class_dense)
    class_output = layers.Dense(num_classes, activation="softmax", name="class")(class_dense)

    # === Edge Detection Head ===
    # Upsample features for pixel-wise edge prediction
    edge_features = layers.Conv2D(
        128,
        1,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="edge_conv1",
    )(x)
    edge_features = layers.Dropout(config.dropout_rate)(edge_features)
    edge_features = layers.UpSampling2D(size=(2, 2), name="edge_up1")(edge_features)
    edge_features = layers.Conv2D(
        64,
        3,
        padding="same",
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="edge_conv2",
    )(edge_features)
    edge_features = layers.Dropout(config.dropout_rate)(edge_features)
    edge_features = layers.UpSampling2D(size=(2, 2), name="edge_up2")(edge_features)
    edge_features = layers.Conv2D(
        32,
        3,
        padding="same",
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="edge_conv3",
    )(edge_features)
    edge_features = layers.Dropout(config.dropout_rate)(edge_features)
    edge_features = layers.UpSampling2D(size=(2, 2), name="edge_up3")(edge_features)
    edge_features = layers.Conv2D(
        16,
        3,
        padding="same",
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="edge_conv4",
    )(edge_features)
    edge_features = layers.Dropout(config.dropout_rate)(edge_features)
    edge_features = layers.UpSampling2D(size=(2, 2), name="edge_up4")(edge_features)
    edge_features = layers.Conv2D(
        8,
        3,
        padding="same",
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="edge_conv5",
    )(edge_features)
    edge_features = layers.Dropout(config.dropout_rate)(edge_features)
    edge_features = layers.UpSampling2D(size=(2, 2), name="edge_up5")(edge_features)

    # Final edge prediction at backbone-derived spatial resolution (BACKBONE_SIZE x BACKBONE_SIZE)
    edge_output = layers.Conv2D(1, 1, activation="sigmoid", name="edges")(edge_features)

    # If requested image_size differs from backbone size, resize edge map to match targets
    if config.image_size != BACKBONE_SIZE:
        edge_output = layers.Resizing(config.image_size, config.image_size, name="edges_resize")(
            edge_output
        )

    # Build model
    model = keras.Model(
        inputs=inputs,
        outputs={"bbox": bbox_output, "class": class_output, "edges": edge_output},
        name="waste_object_detector",
    )

    return model


class DetectionLoss(keras.losses.Loss):
    """Custom loss combining bbox, classification, and edge losses with label smoothing."""

    def __init__(self, config: ObjectDetectionConfig, **kwargs):
        super().__init__(**kwargs)
        self.config = config
        self.bbox_loss = keras.losses.MeanSquaredError()
        self.class_loss = keras.losses.CategoricalCrossentropy(
            label_smoothing=config.label_smoothing
        )
        self.edge_loss = keras.losses.BinaryCrossentropy()

    def call(self, y_true, y_pred):
        # y_true and y_pred are tuples: (bbox_true, class_true, edges_true)
        # and (bbox_pred, class_pred, edges_pred)
        bbox_true, class_true, edges_true = y_true
        bbox_pred, class_pred, edges_pred = y_pred

        # Calculate individual losses
        bbox_loss = self.bbox_loss(bbox_true, bbox_pred)
        class_loss = self.class_loss(class_true, class_pred)
        edge_loss = self.edge_loss(edges_true, edges_pred)

        # Weighted combination
        total_loss = (
            self.config.bbox_weight * bbox_loss
            + self.config.class_weight * class_loss
            + self.config.edge_weight * edge_loss
        )

        return total_loss


def cosine_learning_rate(epoch, initial_lr, total_epochs, min_lr):
    """Cosine learning rate schedule with warmup."""
    if epoch < 5:  # Warmup for first 5 epochs
        return initial_lr * (epoch + 1) / 5
    else:
        progress = (epoch - 5) / (total_epochs - 5)
        cosine_decay = 0.5 * (1 + np.cos(np.pi * progress))
        return min_lr + (initial_lr - min_lr) * cosine_decay


class ProgressiveUnfreezingCallback(keras.callbacks.Callback):
    """Callback for progressive unfreezing of backbone layers."""

    def __init__(self, backbone_model, backbone, unfreeze_schedule):
        super().__init__()
        self.backbone_model = backbone_model
        self.backbone = backbone
        self.unfreeze_schedule = unfreeze_schedule
        self.unfrozen_layers = 0

    def on_epoch_begin(self, epoch, logs=None):
        """Unfreeze layers according to schedule."""
        if epoch in self.unfreeze_schedule:
            layers_to_unfreeze = self.unfreeze_schedule[epoch]

            # Get backbone layers (excluding the first few which are input processing)
            backbone_layers = [
                layer for layer in self.backbone.layers if "conv" in layer.name.lower()
            ]

            # Unfreeze the specified number of layers from the end
            for i in range(min(layers_to_unfreeze, len(backbone_layers))):
                layer_idx = len(backbone_layers) - 1 - i
                if layer_idx >= 0:
                    backbone_layers[layer_idx].trainable = True

            self.unfrozen_layers = min(
                self.unfrozen_layers + layers_to_unfreeze, len(backbone_layers)
            )
            print(
                f"[cyan]Epoch {epoch}: Unfroze {layers_to_unfreeze} layers. Total unfrozen: {self.unfrozen_layers}/{len(backbone_layers)}[/cyan]"
            )


def prepare_dataset(config: ObjectDetectionConfig, dataset_dir: str = "merged_dataset"):
    """Prepare training and validation datasets."""
    # Check if dataset exists, if not prepare it
    if not os.path.exists(dataset_dir) or not os.listdir(dataset_dir):
        print(f"[yellow]Dataset not found at {dataset_dir}, preparing datasets...[/yellow]")
        prepare_datasets("raw_datasets", dataset_dir)
        print(f"[green]Dataset prepared at {dataset_dir}[/green]")

    # Get class names
    classes = get_canonical_classes()
    num_classes = len(classes)

    print(f"[cyan]Loading dataset from {dataset_dir}...[/cyan]")
    print(f"[cyan]Classes: {classes}[/cyan]")

    # Collect all image paths and labels
    image_paths = []
    labels = []

    for class_idx, class_name in enumerate(classes):
        class_dir = os.path.join(dataset_dir, class_name)
        if not os.path.exists(class_dir):
            print(f"[yellow]Warning: Class directory {class_dir} not found[/yellow]")
            continue

        class_images = [
            os.path.join(class_dir, f)
            for f in os.listdir(class_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]

        if config.max_images_per_class is not None:
            class_images = class_images[: config.max_images_per_class]

        image_paths.extend(class_images)
        labels.extend([class_idx] * len(class_images))

    print(f"[green]Found {len(image_paths)} images across {num_classes} classes[/green]")

    # Convert to numpy arrays
    image_paths = np.array(image_paths)
    labels = np.array(labels)

    # Shuffle dataset
    np.random.seed(config.seed)
    indices = np.random.permutation(len(image_paths))
    image_paths = image_paths[indices]
    labels = labels[indices]

    # Split into train/val
    split_idx = int(len(image_paths) * (1 - config.validation_split))
    train_paths, val_paths = image_paths[:split_idx], image_paths[split_idx:]
    train_labels, val_labels = labels[:split_idx], labels[split_idx:]

    print(f"[green]Training: {len(train_paths)} images[/green]")
    print(f"[green]Validation: {len(val_paths)} images[/green]")

    # Create TensorFlow datasets
    train_dataset = tf.data.Dataset.from_tensor_slices((train_paths, train_labels))
    train_dataset = train_dataset.map(
        lambda path, label: load_and_preprocess_image(path, label, config, is_training=True),
        num_parallel_calls=tf.data.AUTOTUNE,
    )
    train_dataset = train_dataset.batch(config.batch_size).prefetch(tf.data.AUTOTUNE)

    val_dataset = tf.data.Dataset.from_tensor_slices((val_paths, val_labels))
    val_dataset = val_dataset.map(
        lambda path, label: load_and_preprocess_image(path, label, config, is_training=False),
        num_parallel_calls=tf.data.AUTOTUNE,
    )
    val_dataset = val_dataset.batch(config.batch_size).prefetch(tf.data.AUTOTUNE)

    return train_dataset, val_dataset, num_classes


def train_detector(
    config: ObjectDetectionConfig,
    dataset_dir: str = "merged_dataset",
    output_dir: str = "object_detection/models",
    resume_model_path: str = None,
):
    """Train object detection model."""

    # Handle resume logic
    initial_epoch = 0
    if resume_model_path:
        if not os.path.exists(resume_model_path):
            raise ValueError(f"Resume model path does not exist: {resume_model_path}")

        # Try to determine initial epoch from training log
        log_path = os.path.join(resume_model_path, "training_log.csv")
        if os.path.exists(log_path):
            try:
                with open(log_path, "r") as f:
                    lines = f.readlines()
                    # Skip header, count data lines (each line is an epoch)
                    initial_epoch = len(lines) - 1
                print(f"[yellow]Resuming from epoch {initial_epoch}[/yellow]")
            except Exception as e:
                print(f"[red]Could not parse training log: {e}. Starting from epoch 0.[/red]")
                initial_epoch = 0
        else:
            print(f"[yellow]No training log found. Starting from epoch 0.[/yellow]")

        # Use the resume directory as output directory
        run_dir = resume_model_path
        print(f"[yellow]Resuming training in directory: {run_dir}[/yellow]")
    else:
        # Create new output directory
        os.makedirs(output_dir, exist_ok=True)
        run_name = f"detector_run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        run_dir = os.path.join(output_dir, run_name)
        os.makedirs(run_dir, exist_ok=True)

    print(f"[bold cyan]Starting Object Detection Training[/bold cyan]")
    print(f"[cyan]Output directory: {run_dir}[/cyan]")

    # Prepare datasets
    train_dataset, val_dataset, num_classes = prepare_dataset(config, dataset_dir)

    # Build or load model
    if resume_model_path:
        model_path = os.path.join(resume_model_path, "best_model.keras")
        if os.path.exists(model_path):
            print(f"[cyan]Loading model from {model_path}...[/cyan]")
            model = keras.models.load_model(model_path)
            print("[green]Model loaded successfully![/green]")

            # Validate that critical parameters match the loaded model
            expected_input_shape = model.input_shape[1:3]  # (height, width)
            if config.image_size != expected_input_shape[0]:
                print(
                    f"[red]Warning: Loaded model expects input size {expected_input_shape[0]}x{expected_input_shape[1]}, but config specifies {config.image_size}x{config.image_size}[/red]"
                )
                print(
                    f"[yellow]Using model's expected input size: {expected_input_shape[0]}[/yellow]"
                )
                config.image_size = expected_input_shape[0]
        else:
            raise ValueError(f"Saved model not found at {model_path}")
    else:
        print("[cyan]Building new model...[/cyan]")
        model = build_detection_model(config, num_classes)
        model.summary()

    # Compile model (always recompile to apply new config parameters)
    optimizer = keras.optimizers.AdamW(
        learning_rate=config.learning_rate, weight_decay=config.weight_decay
    )

    model.compile(
        optimizer=optimizer,
        loss={
            "bbox": keras.losses.MeanSquaredError(),
            "class": keras.losses.CategoricalCrossentropy(label_smoothing=config.label_smoothing),
            "edges": keras.losses.BinaryCrossentropy(),
        },
        loss_weights={
            "bbox": config.bbox_weight,
            "class": config.class_weight,
            "edges": config.edge_weight,
        },
        metrics={"class": ["accuracy"], "bbox": ["mae"], "edges": ["binary_accuracy"]},
    )

    # Enhanced callbacks
    callbacks = [
        keras.callbacks.ModelCheckpoint(
            os.path.join(run_dir, "best_model.keras"),
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=config.early_stopping_patience,
            restore_best_weights=True,
            verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=config.lr_reduce_factor,
            patience=config.lr_reduce_patience,
            min_lr=config.min_learning_rate,
            verbose=1,
        ),
        keras.callbacks.CSVLogger(os.path.join(run_dir, "training_log.csv")),
        keras.callbacks.TensorBoard(
            log_dir=os.path.join(run_dir, "logs"), histogram_freq=1, update_freq="epoch"
        ),
    ]

    # Add progressive unfreezing callback if enabled
    if config.use_progressive_unfreezing:
        callbacks.append(
            ProgressiveUnfreezingCallback(
                backbone_model=model,
                backbone=model.get_layer("mobilenetv2_1.00_224"),
                unfreeze_schedule=config.unfreeze_schedule,
            )
        )

    # Add cosine learning rate scheduler if enabled
    if config.use_cosine_lr:
        callbacks.append(
            keras.callbacks.LearningRateScheduler(
                lambda epoch: cosine_learning_rate(
                    epoch, config.learning_rate, config.epochs, config.min_learning_rate
                )
            )
        )

    # Train
    print("[bold green]Training started...[/bold green]")
    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=config.epochs,
        initial_epoch=initial_epoch,
        callbacks=callbacks,
        verbose=1,
    )

    # Save final model
    final_model_path = os.path.join(run_dir, "final_model.keras")
    model.save(final_model_path)
    print(f"[green]Model saved to {final_model_path}[/green]")

    # Save metadata
    metadata = {
        "timestamp": datetime.now().isoformat(),
        "config": {
            "image_size": config.image_size,
            "batch_size": config.batch_size,
            "epochs": config.epochs,
            "learning_rate": config.learning_rate,
            "num_classes": num_classes,
        },
        "final_metrics": {
            "loss": float(history.history["loss"][-1]),
            "val_loss": float(history.history["val_loss"][-1]),
            "class_accuracy": float(history.history["class_accuracy"][-1]),
            "val_class_accuracy": float(history.history["val_class_accuracy"][-1]),
        },
    }

    with open(os.path.join(run_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[bold green]Training complete! Model saved in {run_dir}[/bold green]")
    return model, run_dir


def main():
    parser = argparse.ArgumentParser(description="Train object detection model for waste items")
    parser.add_argument(
        "--dataset", type=str, default="merged_dataset", help="Path to dataset directory"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="object_detection/models",
        help="Output directory for trained models",
    )
    parser.add_argument("--epochs", type=int, default=None, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=None, help="Batch size")
    parser.add_argument("--image-size", type=int, default=None, help="Input image size")
    parser.add_argument("--learning-rate", type=float, default=None, help="Learning rate")
    parser.add_argument(
        "--max-images-per-class",
        type=int,
        default=None,
        help="Limit number of images loaded per class (None = no limit)",
    )
    parser.add_argument(
        "--backbone-trainable",
        action="store_true",
        default=None,
        help="Make backbone trainable from start",
    )
    parser.add_argument(
        "--progressive-unfreezing",
        action="store_true",
        default=None,
        help="Use progressive unfreezing during training",
    )
    parser.add_argument(
        "--resume",
        type=str,
        default=None,
        help="Path to saved model directory to resume training from",
    )

    args = parser.parse_args()

    # Create config with defaults from ObjectDetectionConfig
    config = ObjectDetectionConfig()

    # Override with command line arguments if provided
    if args.epochs is not None:
        config.epochs = args.epochs
    if args.batch_size is not None:
        config.batch_size = args.batch_size
    if args.image_size is not None:
        config.image_size = args.image_size
    if args.learning_rate is not None:
        config.learning_rate = args.learning_rate
    if args.max_images_per_class is not None:
        config.max_images_per_class = args.max_images_per_class
    if args.backbone_trainable is not None:
        config.backbone_trainable = args.backbone_trainable
    if args.progressive_unfreezing is not None:
        config.use_progressive_unfreezing = args.progressive_unfreezing

    # Train model
    model, run_dir = train_detector(
        config=config,
        dataset_dir=args.dataset,
        output_dir=args.output,
        resume_model_path=args.resume,
    )

    print(f"[bold cyan]Training complete! Results saved to: {run_dir}[/bold cyan]")


if __name__ == "__main__":
    main()
