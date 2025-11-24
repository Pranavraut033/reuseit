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
from dataset_utils import ensure_kaggle_download, consolidate_datasets, get_canonical_classes

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
    p.add_argument("--fine-tune-from", type=int, default=None)
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
    return p.parse_args()


def build_datasets(merged_dir: str, cfg: TrainConfig):
    # Extract values to avoid issues with TensorFlow autograph
    image_size = cfg.image_size
    batch_size = cfg.batch_size
    seed = cfg.seed

    img_size = (image_size, image_size)
    class_names = get_canonical_classes()

    # Group files by class and dataset
    class_files = {}
    for class_name in class_names:
        class_dir = Path(merged_dir) / class_name
        if not class_dir.exists():
            continue
        class_files[class_name] = {}
        for file in class_dir.glob("*"):
            if not file.is_file():
                continue
            # Filename format: dataset_slug_class_original.jpg
            # e.g., mostafaabla_garbage-classification_cardboard_xxx.jpg
            parts = file.name.split("_", 2)
            if len(parts) < 3:
                continue
            dataset_slug = f"{parts[0]}/{parts[1]}"  # Reconstruct slug
            if dataset_slug not in class_files[class_name]:
                class_files[class_name][dataset_slug] = []
            class_files[class_name][dataset_slug].append(str(file))

    # Split files into train/val/test per dataset
    train_files = []
    val_files = []
    test_files = []
    train_labels = []
    val_labels = []
    test_labels = []

    for class_idx, class_name in enumerate(class_names):
        if class_name not in class_files:
            continue
        for dataset, files in class_files[class_name].items():
            n = len(files)
            train_end = int(0.7 * n)
            val_end = train_end + int(0.15 * n)
            train_files.extend(files[:train_end])
            val_files.extend(files[train_end:val_end])
            test_files.extend(files[val_end:])
            train_labels.extend([class_idx] * len(files[:train_end]))
            val_labels.extend([class_idx] * len(files[train_end:val_end]))
            test_labels.extend([class_idx] * len(files[val_end:]))

    # Balance dataset by undersampling majority classes
    max_samples_per_class = 3000  # Limit each class to 3000 samples
    balanced_train_files = []
    balanced_train_labels = []
    balanced_val_files = []
    balanced_val_labels = []
    balanced_test_files = []
    balanced_test_labels = []

    for class_idx, class_name in enumerate(class_names):
        class_train_files = [f for f, l in zip(train_files, train_labels) if l == class_idx]
        class_val_files = [f for f, l in zip(val_files, val_labels) if l == class_idx]
        class_test_files = [f for f, l in zip(test_files, test_labels) if l == class_idx]

        # Undersample to max_samples_per_class
        import random

        random.seed(cfg.seed)
        class_train_files = random.sample(
            class_train_files, min(len(class_train_files), max_samples_per_class)
        )
        class_val_files = random.sample(
            class_val_files, min(len(class_val_files), max_samples_per_class // 3)
        )
        class_test_files = random.sample(
            class_test_files, min(len(class_test_files), max_samples_per_class // 3)
        )

        balanced_train_files.extend(class_train_files)
        balanced_train_labels.extend([class_idx] * len(class_train_files))
        balanced_val_files.extend(class_val_files)
        balanced_val_labels.extend([class_idx] * len(class_val_files))
        balanced_test_files.extend(class_test_files)
        balanced_test_labels.extend([class_idx] * len(class_test_files))

        print(
            f"Class {class_name}: {len(class_train_files)} train, {len(class_val_files)} val, {len(class_test_files)} test"
        )

    # Update with balanced datasets
    train_files, train_labels = balanced_train_files, balanced_train_labels
    val_files, val_labels = balanced_val_files, balanced_val_labels
    test_files, test_labels = balanced_test_files, balanced_test_labels

    # Enhanced Augmentation for waste classification (reduced intensity)
    aug = keras.Sequential(
        [
            keras.layers.RandomFlip("horizontal"),  # Only horizontal flip, not vertical
            keras.layers.RandomRotation(0.1),  # Reduced from 0.2
            keras.layers.RandomZoom(0.1),  # Reduced from 0.2
            keras.layers.RandomContrast(0.2),  # Reduced from 0.3
            keras.layers.RandomBrightness(0.2),  # Reduced from 0.3
            keras.layers.RandomTranslation(0.05, 0.05),  # Reduced from 0.1
        ]
    )

    @tf.autograph.experimental.do_not_convert
    def load_train_image(file_path, label):
        img = tf.io.read_file(file_path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, img_size)
        img = aug(img)
        # Use MobileNetV2 preprocessing instead of simple /255
        img = keras.applications.mobilenet_v2.preprocess_input(img)
        return img, tf.one_hot(label, len(class_names))

    @tf.autograph.experimental.do_not_convert
    def load_val_image(file_path, label):
        img = tf.io.read_file(file_path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, img_size)
        # Use MobileNetV2 preprocessing for validation too
        img = keras.applications.mobilenet_v2.preprocess_input(img)
        return img, tf.one_hot(label, len(class_names))

    # Create datasets
    train_ds = tf.data.Dataset.from_tensor_slices((train_files, train_labels))
    train_ds = train_ds.map(load_train_image, num_parallel_calls=None)
    train_ds = train_ds.shuffle(buffer_size=1000, seed=seed)
    train_ds = train_ds.batch(batch_size).prefetch(AUTOTUNE)

    val_ds = tf.data.Dataset.from_tensor_slices((val_files, val_labels))
    val_ds = val_ds.map(load_val_image, num_parallel_calls=None)
    val_ds = val_ds.batch(batch_size).prefetch(AUTOTUNE)

    test_ds = tf.data.Dataset.from_tensor_slices((test_files, test_labels))
    test_ds = test_ds.map(load_val_image, num_parallel_calls=None)
    test_ds = test_ds.batch(batch_size).prefetch(AUTOTUNE)

    return train_ds, val_ds, test_ds, class_names, train_labels


def build_model(cfg: TrainConfig, class_names: list[str]):
    if cfg.mixed_precision:
        from tensorflow.keras import mixed_precision

        mixed_precision.set_global_policy("mixed_float16")

    base = keras.applications.MobileNetV2(
        input_shape=(cfg.image_size, cfg.image_size, 3), include_top=False, weights="imagenet"
    )
    # Fine-tune more layers for better performance
    if cfg.fine_tune_from is not None:
        base.trainable = True
        for layer in base.layers[: cfg.fine_tune_from]:
            layer.trainable = False
        lr = 1e-4  # Increased from 5e-6 for better fine-tuning
    else:
        base.trainable = False
        lr = 2e-4  # Slightly higher learning rate for better convergence

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
    model.compile(optimizer=opt, loss="categorical_crossentropy", metrics=["accuracy"])
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


def main():
    args = parse_args()

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
    )

    # Create versioned model directory
    base_model_dir = cfg.model_dir
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    versioned_model_dir = os.path.join(base_model_dir, f"run_{timestamp}")
    cfg.model_dir = versioned_model_dir

    print(f"[bold green]Training Run:[/bold green] {timestamp}")
    print(f"[bold green]Model Directory:[/bold green] {versioned_model_dir}")

    raw_dir = "raw_datasets"
    merged_dir = "merged_dataset"

    print(f"[bold cyan]Datasets:[/bold cyan] {cfg.datasets}")
    extracted = ensure_kaggle_download(cfg.datasets, raw_dir)
    merged = consolidate_datasets(extracted, merged_dir)

    train_ds, val_ds, test_ds, class_names, train_labels = build_datasets(merged, cfg)

    # Print dataset statistics
    print(f"Dataset statistics:")
    print(f"  Classes: {class_names}")
    print(f"  Training samples: {len(train_labels)}")
    val_cardinality = tf.data.experimental.cardinality(val_ds).numpy()
    test_cardinality = tf.data.experimental.cardinality(test_ds).numpy()
    print(f"  Validation samples: {val_cardinality}")
    print(f"  Test samples: {test_cardinality}")

    # Compute class weights for imbalanced data (dataset is now balanced, so use mild weights)
    if cfg.no_class_weights:
        print("Skipping class weights (disabled by --no-class-weights)")
        class_weight = None
    else:
        print("Computing mild class weights for balanced dataset...")
        from collections import Counter

        label_counts = Counter(train_labels)
        total = sum(label_counts.values())
        num_classes = len(class_names)
        # Mild weighting since dataset is balanced
        raw_weights = {i: (total / (num_classes * count)) for i, count in label_counts.items()}
        # Light smoothing (clamp between 0.8 and 1.2)
        class_weight = {i: max(0.8, min(w, 1.2)) for i, w in raw_weights.items()}
        print(f"Balanced dataset weights: {class_weight}")

    model = build_model(cfg, class_names)
    print(model.summary())

    callbacks = [
        keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),  # Increased patience
        keras.callbacks.ModelCheckpoint(
            os.path.join(cfg.model_dir, "waste_classifier_best.keras"), save_best_only=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_accuracy",
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1,  # Increased patience from 3 to 5
        ),
        keras.callbacks.TensorBoard(log_dir=os.path.join(cfg.model_dir, "logs"), histogram_freq=1),
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
            "balanced_dataset": True,
            "max_samples_per_class": 3000,
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
