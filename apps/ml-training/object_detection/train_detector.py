#!/usr/bin/env python
"""Train object detection model for waste items.

This model uses MobileNetV2 as backbone with custom detection head that outputs:
- Bounding boxes (x, y, width, height)
- Class probabilities
"""

import argparse
import csv
import os
import json
from pathlib import Path
from datetime import datetime
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from typing import Tuple, List, Dict
from rich import print
from rich.progress import track

# Add parent directory to path for imports
import sys

sys.path.append(str(Path(__file__).parent.parent))
from dataset_utils import get_canonical_classes, prepare_datasets
from object_detection.config import ObjectDetectionConfig, BACKBONE_DEFAULT_INPUT_SIZES

BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_BBOX = np.array([0.1, 0.1, 0.9, 0.9], dtype=np.float32)

_BACKBONE_REGISTRY = {
    "MobileNetV2": keras.applications.MobileNetV2,
    "EfficientNetB0": keras.applications.EfficientNetB0,
    "EfficientNetV2B0": keras.applications.EfficientNetV2B0,
    "EfficientNetV2S": keras.applications.EfficientNetV2S,
}


def _resolve_path(path: str | Path) -> Path:
    p = Path(path)
    return p if p.is_absolute() else (BASE_DIR / p).resolve()


def _safe_float(value: str | float | None) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, float):
        return value
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _normalize_image_key(path: str | Path) -> str:
    return os.path.normpath(str(path))


def _build_backbone_features(
    config: ObjectDetectionConfig, inputs: tf.Tensor
) -> Tuple[keras.Model, tf.Tensor]:
    backbone_cls = _BACKBONE_REGISTRY.get(config.backbone)
    if backbone_cls is None:
        supported = ", ".join(sorted(_BACKBONE_REGISTRY))
        raise ValueError(f"Unsupported backbone {config.backbone}. Choose from: {supported}")

    input_size = config.backbone_input_size or BACKBONE_DEFAULT_INPUT_SIZES.get(
        config.backbone, 224
    )

    if config.image_size != input_size:
        backbone_input = layers.Resizing(input_size, input_size, name="backbone_resize")(inputs)
    else:
        backbone_input = inputs

    backbone_model = backbone_cls(
        include_top=False,
        weights=config.backbone_weights,
        input_tensor=backbone_input,
    )
    backbone_model.trainable = config.backbone_trainable
    return backbone_model, backbone_model.output


def _collect_backbone_layers(
    model: keras.Model, config: ObjectDetectionConfig
) -> list[keras.layers.Layer]:
    if hasattr(model, "backbone_model") and isinstance(model.backbone_model, keras.Model):
        return list(model.backbone_model.layers)

    keyword = config.backbone.lower()
    return [layer for layer in model.layers if keyword in layer.name.lower()]


def load_yolo_annotations(csv_path: str | Path, dataset_dir: Path) -> Dict[str, List[np.ndarray]]:
    annotations: Dict[str, List[np.ndarray]] = {}
    csv_file = _resolve_path(csv_path)
    if not csv_file.exists():
        print(f"[yellow]YOLO CSV not found at {csv_file}; falling back to default bbox[/yellow]")
        return annotations

    dataset_dir = _resolve_path(dataset_dir)
    with open(csv_file, newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            filename = row.get("filename")
            if not filename:
                continue
            rel_path = os.path.normpath(filename)
            abs_path = (dataset_dir / rel_path).resolve(strict=False)
            if not abs_path.exists():
                continue

            x_center = _safe_float(row.get("x_center"))
            y_center = _safe_float(row.get("y_center"))
            width = _safe_float(row.get("width"))
            height = _safe_float(row.get("height"))
            if x_center is None or y_center is None or width is None or height is None:
                continue

            image_width = _safe_float(row.get("image_width"))
            image_height = _safe_float(row.get("image_height"))

            if image_width and image_width > 0:
                x_center /= image_width
                width /= image_width
            if image_height and image_height > 0:
                y_center /= image_height
                height /= image_height

            half_w = width / 2.0
            half_h = height / 2.0
            x_min = x_center - half_w
            x_max = x_center + half_w
            y_min = y_center - half_h
            y_max = y_center + half_h

            x_min = float(np.clip(x_min, 0.0, 1.0))
            x_max = float(np.clip(x_max, 0.0, 1.0))
            y_min = float(np.clip(y_min, 0.0, 1.0))
            y_max = float(np.clip(y_max, 0.0, 1.0))

            if x_max <= x_min or y_max <= y_min:
                continue

            key = _normalize_image_key(abs_path)
            annotations.setdefault(key, []).append(
                np.array([x_min, y_min, x_max, y_max], dtype=np.float32)
            )

    return annotations


def _aggregate_bboxes(boxes: List[np.ndarray]) -> np.ndarray:
    stack = np.vstack(boxes)
    x_min = float(np.clip(np.min(stack[:, 0]), 0.0, 1.0))
    y_min = float(np.clip(np.min(stack[:, 1]), 0.0, 1.0))
    x_max = float(np.clip(np.max(stack[:, 2]), 0.0, 1.0))
    y_max = float(np.clip(np.max(stack[:, 3]), 0.0, 1.0))
    return np.array([x_min, y_min, x_max, y_max], dtype=np.float32)


def _get_bbox_target(image_path: str, annotations: Dict[str, List[np.ndarray]]) -> np.ndarray:
    key = _normalize_image_key(image_path)
    boxes = annotations.get(key)
    if not boxes:
        return DEFAULT_BBOX
    valid = [box for box in boxes if box[2] > box[0] and box[3] > box[1]]
    if not valid:
        return DEFAULT_BBOX
    return _aggregate_bboxes(valid)


def _apply_gaussian_blur(image: tf.Tensor) -> tf.Tensor:
    kernel = tf.constant([[1.0, 2.0, 1.0], [2.0, 4.0, 2.0], [1.0, 2.0, 1.0]], dtype=tf.float32)
    kernel = kernel / tf.reduce_sum(kernel)
    kernel = tf.reshape(kernel, [3, 3, 1, 1])
    kernel = tf.tile(kernel, [1, 1, 3, 1])
    blurred = tf.nn.depthwise_conv2d(
        tf.expand_dims(image, axis=0), kernel, strides=[1, 1, 1, 1], padding="SAME"
    )
    return tf.squeeze(blurred, axis=0)


def _simulate_jpeg_compression(image: tf.Tensor, quality_range: tuple[int, int]) -> tf.Tensor:
    min_q, max_q = quality_range

    def _compress(img: tf.Tensor) -> tf.Tensor:
        quality = np.random.randint(min_q, max_q + 1)
        img_uint8 = tf.image.convert_image_dtype(img, tf.uint8)
        encoded = tf.io.encode_jpeg(img_uint8, quality=int(quality))
        decoded = tf.image.decode_jpeg(encoded, channels=3)
        return tf.image.convert_image_dtype(decoded, tf.float32)

    compressed = tf.py_function(_compress, [image], tf.float32)
    compressed.set_shape(image.shape)
    return compressed


def augment_image_and_bbox(
    image: tf.Tensor, bbox: tf.Tensor, config: ObjectDetectionConfig
) -> Tuple[tf.Tensor, tf.Tensor]:
    """Apply light augmentation while keeping bbox targets in sync."""

    flip = tf.random.uniform([]) < config.flip_prob
    image = tf.cond(flip, lambda: tf.image.flip_left_right(image), lambda: image)
    bbox = tf.cond(
        flip,
        lambda: tf.stack([1.0 - bbox[2], bbox[1], 1.0 - bbox[0], bbox[3]]),
        lambda: bbox,
    )

    image = tf.image.random_brightness(image, config.brightness_range)
    image = tf.image.random_contrast(image, *config.contrast_range)
    image = tf.image.random_saturation(image, *config.saturation_range)
    image = tf.image.random_hue(image, config.hue_range)

    if config.gaussian_noise_std > 0:
        noise = tf.random.normal(tf.shape(image), mean=0.0, stddev=config.gaussian_noise_std)
        image = tf.clip_by_value(image + noise, 0.0, 1.0)

    if tf.random.uniform([]) < config.blur_prob:
        image = _apply_gaussian_blur(image)

    if tf.random.uniform([]) < config.compression_prob:
        image = _simulate_jpeg_compression(image, config.compression_quality_range)

    image = tf.clip_by_value(image, 0.0, 1.0)
    return image, bbox


def load_and_preprocess_image(
    image_path: str,
    label: int,
    bbox: np.ndarray,
    config: ObjectDetectionConfig,
    is_training: bool = True,
) -> Tuple[tf.Tensor, Dict]:
    """Load image and create detection targets."""
    image = tf.io.read_file(image_path)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, [config.image_size, config.image_size])
    image = tf.cast(image, tf.float32) / 255.0

    bbox_tensor = tf.reshape(tf.cast(bbox, tf.float32), [4])
    if is_training and tf.random.uniform([]) < config.augment_prob:
        image, bbox_tensor = augment_image_and_bbox(image, bbox_tensor, config)

    bbox_tensor = tf.clip_by_value(bbox_tensor, 0.0, 1.0)
    image.set_shape((config.image_size, config.image_size, 3))

    num_classes = len(get_canonical_classes())
    class_label = tf.one_hot(label, num_classes)

    targets = {"bbox": bbox_tensor, "class": class_label}
    return image, targets


def build_detection_model(config: ObjectDetectionConfig, num_classes: int) -> keras.Model:
    """Build object detection model with bbox and classification heads.

    Architecture:
    - MobileNetV2 backbone (feature extraction)
    - Detection heads for bounding boxes and class probabilities
    - L2 regularization and dropout for overfitting prevention
    """

    # Input
    inputs = keras.Input(shape=(config.image_size, config.image_size, 3), name="image")
    backbone_model, x = _build_backbone_features(config, inputs)

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

    # Build model
    model = keras.Model(
        inputs=inputs,
        outputs={"bbox": bbox_output, "class": class_output},
        name="waste_object_detector",
    )
    model.backbone_model = backbone_model
    model.backbone_keyword = config.backbone.lower()

    return model


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

    def __init__(self, backbone_layers, unfreeze_schedule, compile_kwargs=None, backbone_name=None):
        super().__init__()
        self.backbone_layers = backbone_layers or []
        self.unfreeze_schedule = unfreeze_schedule or {}
        self.compile_kwargs = compile_kwargs or {}
        self.backbone_name = backbone_name or "backbone"
        self.unfrozen_layers = sum(1 for layer in self.backbone_layers if layer.trainable)
        self._cursor = len(self.backbone_layers)

    def on_epoch_begin(self, epoch, logs=None):
        """Unfreeze layers according to schedule."""
        if not self.backbone_layers:
            return

        layers_to_unfreeze = self.unfreeze_schedule.get(epoch, 0)
        if layers_to_unfreeze <= 0:
            return

        unfrozen = 0
        while layers_to_unfreeze > 0 and self._cursor > 0:
            self._cursor -= 1
            layer = self.backbone_layers[self._cursor]
            if layer.trainable:
                continue
            layer.trainable = True
            unfrozen += 1
            layers_to_unfreeze -= 1

        self.unfrozen_layers += unfrozen
        if unfrozen:
            print(
                f"[cyan]Epoch {epoch}: Unfroze {unfrozen} layers. Total unfrozen: {self.unfrozen_layers}/{len(self.backbone_layers)} ({self.backbone_name})[/cyan]"
            )


def prepare_dataset(config: ObjectDetectionConfig, dataset_dir: str = "merged_dataset"):
    """Prepare training and validation datasets using YOLO annotations."""
    dataset_path = _resolve_path(dataset_dir)
    if not dataset_path.exists() or not any(dataset_path.iterdir()):
        print(f"[yellow]Dataset not found at {dataset_path}, preparing datasets...[/yellow]")
        prepare_datasets("raw_datasets", str(dataset_path))
        print(f"[green]Dataset prepared at {dataset_path}[/green]")

    classes = get_canonical_classes()
    num_classes = len(classes)

    print(f"[cyan]Loading dataset from {dataset_path}...[/cyan]")
    print(f"[cyan]Classes: {classes}[/cyan]")

    image_paths: list[str] = []
    labels: list[int] = []

    for class_idx, class_name in enumerate(classes):
        class_dir = dataset_path / class_name
        if not class_dir.exists():
            print(f"[yellow]Warning: Class directory {class_dir} not found[/yellow]")
            continue

        class_files = [
            file.resolve()
            for file in class_dir.iterdir()
            if file.is_file() and file.suffix.lower() in (".jpg", ".jpeg", ".png")
        ]

        if config.max_images_per_class is not None:
            class_files = class_files[: config.max_images_per_class]

        resolved_files = [str(p) for p in class_files]
        image_paths.extend(resolved_files)
        labels.extend([class_idx] * len(resolved_files))

    print(f"[green]Found {len(image_paths)} images across {num_classes} classes[/green]")
    if not image_paths:
        raise ValueError("No training images found in dataset directory")

    annotations = load_yolo_annotations(config.csv_labels_path, dataset_path)
    bbox_targets = np.stack([_get_bbox_target(path, annotations) for path in image_paths], axis=0)

    image_paths = np.array(image_paths)
    labels = np.array(labels, dtype=np.int32)

    np.random.seed(config.seed)
    indices = np.random.permutation(len(image_paths))
    image_paths = image_paths[indices]
    labels = labels[indices]
    bbox_targets = bbox_targets[indices]

    split_idx = int(len(image_paths) * (1 - config.validation_split))
    train_paths, val_paths = image_paths[:split_idx], image_paths[split_idx:]
    train_labels, val_labels = labels[:split_idx], labels[split_idx:]
    train_bboxes, val_bboxes = bbox_targets[:split_idx], bbox_targets[split_idx:]

    print(f"[green]Training: {len(train_paths)} images[/green]")
    print(f"[green]Validation: {len(val_paths)} images[/green]")

    train_dataset = tf.data.Dataset.from_tensor_slices((train_paths, train_labels, train_bboxes))
    train_dataset = train_dataset.map(
        lambda path, label, bbox: load_and_preprocess_image(
            path, label, bbox, config, is_training=True
        ),
        num_parallel_calls=tf.data.AUTOTUNE,
    )
    train_dataset = train_dataset.batch(config.batch_size).prefetch(tf.data.AUTOTUNE)

    val_dataset = tf.data.Dataset.from_tensor_slices((val_paths, val_labels, val_bboxes))
    val_dataset = val_dataset.map(
        lambda path, label, bbox: load_and_preprocess_image(
            path, label, bbox, config, is_training=False
        ),
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

    compile_kwargs = {
        "optimizer": optimizer,
        "loss": {
            "bbox": keras.losses.MeanSquaredError(),
            "class": keras.losses.CategoricalCrossentropy(label_smoothing=config.label_smoothing),
        },
        "loss_weights": {"bbox": config.bbox_weight, "class": config.class_weight},
        "metrics": {"class": ["accuracy"], "bbox": ["mae"]},
    }

    model.compile(**compile_kwargs)

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
        backbone_layers = _collect_backbone_layers(model, config)
        callbacks.append(
            ProgressiveUnfreezingCallback(
                backbone_layers,
                config.unfreeze_schedule,
                compile_kwargs=compile_kwargs,
                backbone_name=config.backbone,
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
            "bbox_mae": float(history.history["bbox_mae"][-1]),
            "val_bbox_mae": float(history.history["val_bbox_mae"][-1]),
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
