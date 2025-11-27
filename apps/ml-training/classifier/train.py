#!/usr/bin/env python
"""Train waste classification model using Kaggle datasets.
Generates Keras + TFLite models.
"""

import argparse
import os
from pathlib import Path
import json
from datetime import datetime

import tensorflow as tf
from tensorflow import keras

from rich import print
from config import TrainConfig
from dataset_utils import prepare_datasets, get_canonical_classes

AUTOTUNE = tf.data.AUTOTUNE


def list_training_runs(base_dir="models"):
    """List all training runs with their metadata."""
    if not os.path.exists(base_dir):
        print(f"No training runs found in {base_dir}")
        return

    runs = []
    for item in os.listdir(base_dir):
        run_dir = os.path.join(base_dir, item)
        if os.path.isdir(run_dir) and item.startswith("run_"):
            metadata_file = os.path.join(run_dir, "training_metadata.json")
            if os.path.exists(metadata_file):
                try:
                    with open(metadata_file, "r") as f:
                        metadata = json.load(f)
                    runs.append((item, metadata))
                except Exception as e:
                    print(f"Could not read metadata for {item}: {e}")

    if not runs:
        print(f"No training runs with metadata found in {base_dir}")
        return

    # Sort by timestamp (newest first)
    runs.sort(key=lambda x: x[1]["timestamp"], reverse=True)

    print(f"[bold cyan]Training Runs in {base_dir}:[/bold cyan]")
    for run_name, metadata in runs:
        acc = metadata.get("final_accuracy", "N/A")
        loss = metadata.get("final_loss", "N/A")
        timestamp = metadata.get("timestamp", "N/A")
        epochs = metadata.get("config", {}).get("epochs", "N/A")
        print(f"  {run_name} - {timestamp} - Acc: {acc:.4f} - Loss: {loss:.4f} - Epochs: {epochs}")


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument(
        "--datasets",
        nargs="*",
        default=[
            "asdasdasasdas/garbage-classification",
            "glhdamar/new-trash-classfication-dataset",
            "joebeachcapital/realwaste",
            "mostafaabla/garbage-classification",
            "karansolanki01/garbage-classification",
            "sumn2u/garbage-classification-v2",
        ],
        help="Kaggle dataset slugs",
    )
    p.add_argument("--image-size", type=int, default=224)
    p.add_argument("--epochs", type=int, default=15)
    p.add_argument("--batch-size", type=int, default=32)
    p.add_argument("--validation-split", type=float, default=0.2)
    p.add_argument(
        "--fine-tune-from",
        type=int,
        default=0,
        help="Layer to start fine-tuning from (default: 0 - train all layers)",
    )
    p.add_argument("--mixed-precision", action="store_true")
    p.add_argument("--model-dir", default="models")
    p.add_argument(
        "--no-class-weights",
        action="store_true",
        help="Disable class weighting for imbalanced data",
    )
    p.add_argument(
        "--list-runs",
        action="store_true",
        help="List all training runs and their metadata",
    )
    p.add_argument(
        "--repr-samples",
        type=int,
        default=100,
        help="Number of representative samples for TFLite quantization",
    )
    p.add_argument(
        "--brightness-factor",
        type=float,
        default=0.1,
        help="Brightness jitter factor for augmentation",
    )
    p.add_argument(
        "--contrast-factor", type=float, default=0.1, help="Contrast jitter factor for augmentation"
    )
    p.add_argument(
        "--max-images-per-class",
        type=int,
        default=None,
        help="Limit number of images loaded per class (None = no limit)",
    )
    return p.parse_args()


def build_datasets(merged_dir: str, cfg: TrainConfig):
    # Extract values to avoid issues with TensorFlow autograph
    image_size = cfg.image_size
    batch_size = cfg.batch_size
    seed = cfg.seed

    img_size = (image_size, image_size)
    class_names = get_canonical_classes()

    # Collect all files and labels
    all_files = []
    all_labels = []

    for class_idx, class_name in enumerate(class_names):
        class_dir = Path(merged_dir) / class_name
        if not class_dir.exists():
            continue
        # Collect files, optionally limit
        files = [f for f in class_dir.glob("*") if f.is_file()]
        if cfg.max_images_per_class is not None:
            files = files[: cfg.max_images_per_class]
        for file in files:
            all_files.append(str(file))
            all_labels.append(class_idx)

    # Global stratified split to ensure all classes are represented
    from sklearn.model_selection import train_test_split
    from collections import Counter

    label_counts = Counter(all_labels)
    min_samples_per_class = 10  # Minimum samples needed for stratification

    # Check which classes have enough samples for stratification
    stratify_labels = [
        label if label_counts[label] >= min_samples_per_class else -1 for label in all_labels
    ]

    # Use stratified split where possible, fallback to random for small classes
    try:
        train_files, temp_files, train_labels, temp_labels = train_test_split(
            all_files, all_labels, test_size=0.3, stratify=stratify_labels, random_state=seed
        )
        val_files, test_files, val_labels, test_labels = train_test_split(
            temp_files,
            temp_labels,
            test_size=0.5,
            stratify=[
                label if label_counts[label] >= min_samples_per_class else -1
                for label in temp_labels
            ],
            random_state=seed,
        )
        print(
            f"Stratified split: {len(train_files)} train, {len(val_files)} val, {len(test_files)} test"
        )
    except ValueError:
        # Fallback to random split if stratification fails
        print("Stratification failed, using random split")
        train_files, temp_files, train_labels, temp_labels = train_test_split(
            all_files, all_labels, test_size=0.3, random_state=seed
        )
        val_files, test_files, val_labels, test_labels = train_test_split(
            temp_files, temp_labels, test_size=0.5, random_state=seed
        )
        print(
            f"Random split: {len(train_files)} train, {len(val_files)} val, {len(test_files)} test"
        )

    # Configurable augmentation parameters
    brightness_factor = cfg.brightness_factor
    contrast_factor = cfg.contrast_factor

    # Enhanced Augmentation for waste classification (configurable intensity)
    aug = keras.Sequential(
        [
            keras.layers.Resizing(image_size, image_size),  # Resize first
            keras.layers.RandomFlip("horizontal"),
            keras.layers.RandomRotation(0.1),
            keras.layers.RandomZoom(0.1),
            keras.layers.RandomContrast(contrast_factor),
            keras.layers.RandomBrightness(brightness_factor),
            keras.layers.RandomTranslation(0.05, 0.05),
        ]
    )

    @tf.autograph.experimental.do_not_convert
    def load_train_image(file_path, label):
        img = tf.io.read_file(file_path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = aug(img)
        # Apply MobileNetV3 preprocessing after augmentation
        img = keras.applications.mobilenet_v3.preprocess_input(img)
        return img, tf.one_hot(label, len(class_names))

    @tf.autograph.experimental.do_not_convert
    def load_val_image(file_path, label):
        img = tf.io.read_file(file_path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, img_size)
        img = tf.cast(img, tf.float32)  # Keep in [0,255]
        img = keras.applications.mobilenet_v3.preprocess_input(img)
        return img, tf.one_hot(label, len(class_names))

    # Create datasets with balanced parallelism
    train_ds = tf.data.Dataset.from_tensor_slices((train_files, train_labels))
    train_ds = train_ds.shuffle(
        buffer_size=min(2000, len(train_files)), seed=seed
    )  # Moderate shuffle buffer
    train_ds = train_ds.map(load_train_image, num_parallel_calls=4)
    train_ds = train_ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    val_ds = tf.data.Dataset.from_tensor_slices((val_files, val_labels))
    val_ds = val_ds.map(load_val_image, num_parallel_calls=4)
    val_ds = val_ds.batch(batch_size).cache().prefetch(tf.data.AUTOTUNE)

    test_ds = tf.data.Dataset.from_tensor_slices((test_files, test_labels))
    test_ds = test_ds.map(load_val_image, num_parallel_calls=4)
    test_ds = test_ds.batch(batch_size).cache().prefetch(tf.data.AUTOTUNE)

    return train_ds, val_ds, test_ds, class_names, train_labels, val_labels, test_labels


def build_model(cfg: TrainConfig, class_names: list[str]):
    if cfg.mixed_precision:
        from tensorflow.keras import mixed_precision

        mixed_precision.set_global_policy("mixed_float16")

    base = keras.applications.MobileNetV3Large(
        input_shape=(cfg.image_size, cfg.image_size, 3), include_top=False, weights="imagenet"
    )
    # Fine-tune more layers for better performance
    if cfg.fine_tune_from is not None:
        base.trainable = True
        for layer in base.layers[: cfg.fine_tune_from]:
            layer.trainable = False
        lr = 1e-4  # Lower learning rate when fine-tuning more layers
    else:
        base.trainable = False
        lr = 1e-3  # Increased for better convergence

    inputs = keras.Input(shape=(cfg.image_size, cfg.image_size, 3))
    # Remove preprocess_input since we do it in data loading
    x = base(inputs, training=True)
    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.Dropout(0.5)(x)  # Increased dropout
    x = keras.layers.Dense(256, activation="relu", kernel_regularizer=keras.regularizers.l2(0.01))(
        x
    )  # Add L2 regularization
    x = keras.layers.Dropout(0.3)(x)
    outputs = keras.layers.Dense(len(class_names), activation="softmax", dtype="float32")(x)

    model = keras.Model(inputs, outputs)
    # Use legacy Adam optimizer for M1/M2 Macs with gradient clipping
    try:
        opt = keras.optimizers.legacy.Adam(learning_rate=lr, clipnorm=1.0)
    except Exception:
        opt = keras.optimizers.Adam(learning_rate=lr, clipnorm=1.0)

    # Per-class metrics
    metrics = ["accuracy"]

    model.compile(optimizer=opt, loss="categorical_crossentropy", metrics=metrics)
    return model


def create_repr_dataset(train_ds, sample_count: int, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    taken = 0
    for batch_x, _ in train_ds.take(sample_count):
        for i in range(batch_x.shape[0]):
            if taken >= sample_count:
                break
            arr = batch_x[i].numpy()
            path = Path(out_dir) / f"sample_{taken}.npy"
            import numpy as np

            np.save(path, arr)
            taken += 1
        if taken >= sample_count:
            break
    print(f"Saved {taken} representative samples to {out_dir}")


class ConfusionMatrixCallback(keras.callbacks.Callback):
    def __init__(self, val_ds, class_names, log_dir):
        super().__init__()
        self.val_ds = val_ds
        self.class_names = class_names
        self.log_dir = log_dir
        self.file_writer = tf.summary.create_file_writer(log_dir)

    def on_epoch_end(self, epoch, logs=None):
        # Compute confusion matrix at end of training
        if epoch == self.params["epochs"] - 1:  # Only at the end
            y_true = []
            y_pred = []
            for x, y in self.val_ds:
                pred = self.model.predict(x, verbose=0)
                y_true.extend(tf.argmax(y, axis=1).numpy())
                y_pred.extend(tf.argmax(pred, axis=1).numpy())

            cm = tf.math.confusion_matrix(y_true, y_pred, num_classes=len(self.class_names))
            cm = cm.numpy()

            # Log to TensorBoard
            with self.file_writer.as_default():
                tf.summary.image(
                    "confusion_matrix", cm.reshape(1, cm.shape[0], cm.shape[1], 1), step=epoch
                )

            # Print to console
            print(f"\nConfusion Matrix (epoch {epoch}):")
            print(cm)


def main():
    args = parse_args()

    # Force CPU-only execution to avoid Metal/GPU issues on Mac
    import os

    os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

    # Disable GPU devices to prevent Metal backend errors
    tf.config.set_visible_devices([], "GPU")

    # Increase CPU threads for better performance (balance speed vs memory)
    tf.config.threading.set_intra_op_parallelism_threads(4)
    tf.config.threading.set_inter_op_parallelism_threads(4)

    # Set seeds for reproducibility
    tf.random.set_seed(42)
    import numpy as np

    np.random.seed(42)

    # Handle list-runs command
    if args.list_runs:
        list_training_runs(args.model_dir)
        return

    cfg = TrainConfig(
        image_size=args.image_size,
        batch_size=args.batch_size,
        epochs=args.epochs,
        validation_split=args.validation_split,
        fine_tune_from=args.fine_tune_from,
        mixed_precision=args.mixed_precision,
        model_dir=args.model_dir,
        datasets=args.datasets,
        no_class_weights=args.no_class_weights,
        repr_samples=args.repr_samples,
        brightness_factor=args.brightness_factor,
        contrast_factor=args.contrast_factor,
        max_images_per_class=args.max_images_per_class,
    )
    # Create versioned model directory
    base_model_dir = cfg.model_dir
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    versioned_model_dir = os.path.join(base_model_dir, f"run_{timestamp}")
    cfg.model_dir = versioned_model_dir

    print(f"[bold cyan]Config:[/bold cyan]")
    for key, value in vars(cfg).items():
        if key != "datasets":
            print(f"  {key}: {value}")

    print(f"  [bold green]Training Run:[/bold green] {timestamp}")
    print(f"  [bold green]Model Directory:[/bold green] {versioned_model_dir}")
    print(f"  [bold cyan]Datasets:[/bold cyan] {cfg.datasets}")

    raw_dir = "raw_datasets"
    merged_dir = "merged_dataset"

    merged = prepare_datasets(raw_dir, merged_dir, cfg.datasets)

    train_ds, val_ds, test_ds, class_names, train_labels, val_labels, test_labels = build_datasets(
        merged, cfg
    )

    # Print dataset statistics
    print(f"Dataset statistics:")
    print(f"  Classes: {class_names}")
    print(f"  Training samples: {len(train_labels)}")
    val_cardinality = len(val_labels)
    test_cardinality = len(test_labels)
    print(f"  Validation samples: {val_cardinality}")
    print(f"  Test samples: {test_cardinality}")

    # Compute class weights for imbalanced data
    if cfg.no_class_weights:
        print("Skipping class weights (disabled by --no-class-weights)")
        class_weight = None
    else:
        print("Computing class weights for imbalanced data...")
        from collections import Counter

        label_counts = Counter(train_labels)
        total = sum(label_counts.values())
        num_classes = len(class_names)
        # Use inverse frequency weighting, include all classes even if count is 0
        class_weight = {}
        for i in range(num_classes):
            count = label_counts.get(i, 0)
            if count > 0:
                class_weight[i] = total / (num_classes * count)
            else:
                # For classes with no training samples, set a high weight to discourage misclassification
                class_weight[i] = 10.0  # High penalty for unseen classes
        print(f"Class weights: {class_weight}")

    model = build_model(cfg, class_names)
    print(model.summary())

    callbacks = [
        keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
        keras.callbacks.ModelCheckpoint(
            os.path.join(cfg.model_dir, "waste_classifier_best.keras"), save_best_only=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_accuracy",
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1,
        ),
        keras.callbacks.TensorBoard(log_dir=os.path.join(cfg.model_dir, "logs"), histogram_freq=1),
        # Confusion matrix callback (logs at end of training)
        ConfusionMatrixCallback(val_ds, class_names, log_dir=os.path.join(cfg.model_dir, "logs")),
    ]
    os.makedirs(cfg.model_dir, exist_ok=True)
    # Persist class weights mapping (class name -> weight) for reproducibility
    weights_path = os.path.join(cfg.model_dir, "class_weights.json")
    try:
        import json as _json

        with open(weights_path, "w") as f:
            if class_weight is not None:
                _json.dump({class_names[i]: w for i, w in class_weight.items()}, f, indent=2)
            else:
                _json.dump({"disabled": True}, f, indent=2)
        print(f"Saved class weights to {weights_path}")
    except Exception as e:
        print(f"[red]Failed to save class weights: {e}[/red]")

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=cfg.epochs,
        callbacks=callbacks,
        class_weight=class_weight,  # Will be None if disabled
        verbose=1,
    )

    # Save final model
    h5_path = os.path.join(cfg.model_dir, "waste_classifier.h5")
    model.save(h5_path)
    model.save(os.path.join(cfg.model_dir, "waste_classifier.keras"))
    print(f"Saved model to {h5_path}")

    # Evaluate on test set
    print("Evaluating on test set...")
    test_loss, test_acc = model.evaluate(test_ds, verbose=1)
    print(f"Test Loss: {test_loss:.4f}, Test Accuracy: {test_acc:.4f}")

    # Export labels
    labels_path = os.path.join(cfg.model_dir, "labels.json")
    with open(labels_path, "w") as f:
        json.dump(class_names, f)
    print(f"Saved labels to {labels_path}")

    # Representative dataset
    repr_dir = "repr_samples"
    create_repr_dataset(train_ds, args.repr_samples, repr_dir)

    # Create symlink to latest model for easy access
    latest_link = os.path.join(base_model_dir, "latest")
    try:
        if os.path.exists(latest_link) or os.path.islink(latest_link):
            os.remove(latest_link)
        os.symlink(os.path.basename(versioned_model_dir), latest_link)
        print(f"Created symlink: {latest_link} -> {versioned_model_dir}")
    except Exception as e:
        print(f"[yellow]Could not create latest symlink: {e}[/yellow]")

    # Save training metadata
    metadata = {
        "timestamp": timestamp,
        "version": os.path.basename(versioned_model_dir),
        "config": {
            "image_size": cfg.image_size,
            "batch_size": cfg.batch_size,
            "epochs": cfg.epochs,
            "fine_tune_from": cfg.fine_tune_from,
            "mixed_precision": cfg.mixed_precision,
            "datasets": cfg.datasets,
            "no_class_weights": cfg.no_class_weights,
            "repr_samples": args.repr_samples,
            "brightness_factor": args.brightness_factor,
            "contrast_factor": args.contrast_factor,
            "merged_classes": True,
        },
        "final_accuracy": float(test_acc),
        "final_loss": float(test_loss),
        "class_names": class_names,
        "num_classes": len(class_names),
        "training_samples": len(train_labels),
        "validation_samples": int(val_cardinality),
        "test_samples": int(test_cardinality),
    }

    metadata_path = os.path.join(versioned_model_dir, "training_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"Saved training metadata to {metadata_path}")

    print(f"Training complete. Run export_tflite.py for TFLite conversion.")
    print(f"Model saved in: {versioned_model_dir}")
    print(f"Latest model accessible via: {latest_link}")


if __name__ == "__main__":
    main()
