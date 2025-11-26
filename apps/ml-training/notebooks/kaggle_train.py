#!/usr/bin/env python
"""Train waste classification model on Kaggle Kernels.
Datasets are pre-loaded as input data.
"""

import argparse
import os
from pathlib import Path
import json
from datetime import datetime
import shutil

import tensorflow as tf
from tensorflow import keras

from rich import print

# Import local modules (upload these files to Kaggle)
from config import TrainConfig
from dataset_utils import consolidate_datasets, get_canonical_classes

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
            "garbage-classification",  # asdasdasasdas
            "new-trash-classfication-dataset",  # glhdamar
            "realwaste",  # joebeachcapital
            "garbage-classification",  # mostafaabla
            "garbage-classification",  # karansolanki01
            "garbage-classification-v2",  # sumn2u
        ],
        help="Dataset folder names in /kaggle/input/",
    )
    p.add_argument("--image-size", type=int, default=224)
    p.add_argument("--epochs", type=int, default=15)
    p.add_argument("--batch-size", type=int, default=64)  # Higher for GPU
    p.add_argument("--validation-split", type=float, default=0.2)
    p.add_argument("--fine-tune-from", type=int, default=100)
    p.add_argument("--mixed-precision", action="store_true")
    p.add_argument("--model-dir", default="/kaggle/working/models")
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
    return p.parse_args()


def prepare_kaggle_datasets(datasets, raw_dir):
    """Copy datasets from /kaggle/input/ to working directory."""
    input_dir = "/kaggle/input"
    os.makedirs(raw_dir, exist_ok=True)

    for dataset in datasets:
        src = os.path.join(input_dir, dataset)
        dst = os.path.join(raw_dir, dataset)
        if os.path.exists(src):
            print(f"Copying {dataset}...")
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            print(f"Warning: {src} not found")

    return [os.path.join(raw_dir, d) for d in datasets if os.path.exists(os.path.join(raw_dir, d))]


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
        for file in class_dir.glob("*"):
            if file.is_file() and file.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                all_files.append(str(file))
                all_labels.append(class_idx)

    print(f"Found {len(all_files)} images across {len(class_names)} classes")

    # Global stratified split
    from sklearn.model_selection import train_test_split
    from collections import Counter

    label_counts = Counter(all_labels)
    min_samples_per_class = 10

    stratify_labels = [
        label if label_counts[label] >= min_samples_per_class else -1 for label in all_labels
    ]

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
        train_files, temp_files, train_labels, temp_labels = train_test_split(
            all_files, all_labels, test_size=0.3, random_state=seed
        )
        val_files, test_files, val_labels, test_labels = train_test_split(
            temp_files, temp_labels, test_size=0.5, random_state=seed
        )
        print(
            f"Random split: {len(train_files)} train, {len(val_files)} val, {len(test_files)} test"
        )

    # Configurable augmentation
    args = parse_args()
    brightness_factor = getattr(args, "brightness_factor", 0.1)
    contrast_factor = getattr(args, "contrast_factor", 0.1)

    aug = keras.Sequential(
        [
            keras.layers.Resizing(image_size, image_size),
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
        img = keras.applications.mobilenet_v2.preprocess_input(img)
        return img, tf.one_hot(label, len(class_names))

    @tf.autograph.experimental.do_not_convert
    def load_val_image(file_path, label):
        img = tf.io.read_file(file_path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, img_size)
        img = tf.cast(img, tf.float32)
        img = keras.applications.mobilenet_v2.preprocess_input(img)
        return img, tf.one_hot(label, len(class_names))

    train_ds = tf.data.Dataset.from_tensor_slices((train_files, train_labels))
    train_ds = train_ds.map(load_train_image, num_parallel_calls=AUTOTUNE)
    train_ds = train_ds.shuffle(buffer_size=len(train_files), seed=seed)
    train_ds = train_ds.batch(batch_size).prefetch(AUTOTUNE)

    val_ds = tf.data.Dataset.from_tensor_slices((val_files, val_labels))
    val_ds = val_ds.map(load_val_image, num_parallel_calls=AUTOTUNE)
    val_ds = val_ds.batch(batch_size).prefetch(AUTOTUNE)

    test_ds = tf.data.Dataset.from_tensor_slices((test_files, test_labels))
    test_ds = test_ds.map(load_val_image, num_parallel_calls=AUTOTUNE)
    test_ds = test_ds.batch(batch_size).prefetch(AUTOTUNE)

    return train_ds, val_ds, test_ds, class_names, train_labels, val_labels, test_labels


def build_model(cfg: TrainConfig, class_names: list[str]):
    if cfg.mixed_precision:
        from tensorflow.keras import mixed_precision

        mixed_precision.set_global_policy("mixed_float16")

    base = keras.applications.MobileNetV2(
        input_shape=(cfg.image_size, cfg.image_size, 3), include_top=False, weights="imagenet"
    )

    if cfg.fine_tune_from is not None:
        base.trainable = True
        for layer in base.layers[: cfg.fine_tune_from]:
            layer.trainable = False
        lr = 1e-3
    else:
        base.trainable = False
        lr = 1e-3

    inputs = keras.Input(shape=(cfg.image_size, cfg.image_size, 3))
    x = base(inputs, training=True)
    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.Dropout(0.5)(x)
    x = keras.layers.Dense(256, activation="relu", kernel_regularizer=keras.regularizers.l2(0.01))(
        x
    )
    x = keras.layers.Dropout(0.3)(x)
    outputs = keras.layers.Dense(len(class_names), activation="softmax", dtype="float32")(x)

    model = keras.Model(inputs, outputs)

    try:
        opt = keras.optimizers.legacy.Adam(learning_rate=lr, clipnorm=1.0)
    except Exception:
        opt = keras.optimizers.Adam(learning_rate=lr, clipnorm=1.0)

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
        if epoch == self.params["epochs"] - 1:
            y_true = []
            y_pred = []
            for x, y in self.val_ds:
                pred = self.model.predict(x, verbose=0)
                y_true.extend(tf.argmax(y, axis=1).numpy())
                y_pred.extend(tf.argmax(pred, axis=1).numpy())

            cm = tf.math.confusion_matrix(y_true, y_pred, num_classes=len(self.class_names))
            cm = cm.numpy()

            with self.file_writer.as_default():
                tf.summary.image(
                    "confusion_matrix", cm.reshape(1, cm.shape[0], cm.shape[1], 1), step=epoch
                )

            print(f"\nConfusion Matrix (epoch {epoch}):")
            print(cm)


def main():
    args = parse_args()

    tf.random.set_seed(42)
    import numpy as np

    np.random.seed(42)

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
    )

    print(f"[bold cyan]Config:[/bold cyan]")
    for key, value in vars(cfg).items():
        print(f"  {key}: {value}")

    base_model_dir = cfg.model_dir
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    versioned_model_dir = os.path.join(base_model_dir, f"run_{timestamp}")
    cfg.model_dir = versioned_model_dir

    print(f"[bold green]Training Run:[/bold green] {timestamp}")
    print(f"[bold green]Model Directory:[/bold green] {versioned_model_dir}")

    # Kaggle-specific: prepare datasets
    raw_dir = "/kaggle/working/raw_datasets"
    merged_dir = "/kaggle/working/merged_dataset"

    print(f"[bold cyan]Preparing datasets from /kaggle/input/[/bold cyan]")
    extracted = prepare_kaggle_datasets(cfg.datasets, raw_dir)
    merged = consolidate_datasets(extracted, merged_dir)

    train_ds, val_ds, test_ds, class_names, train_labels, val_labels, test_labels = build_datasets(
        merged, cfg
    )

    print(f"Dataset statistics:")
    print(f"  Classes: {class_names}")
    print(f"  Training samples: {len(train_labels)}")
    print(f"  Validation samples: {len(val_labels)}")
    print(f"  Test samples: {len(test_labels)}")

    if cfg.no_class_weights:
        print("Skipping class weights")
        class_weight = None
    else:
        print("Computing class weights...")
        from collections import Counter

        label_counts = Counter(train_labels)
        total = sum(label_counts.values())
        num_classes = len(class_names)
        class_weight = {}
        for i in range(num_classes):
            count = label_counts.get(i, 0)
            if count > 0:
                class_weight[i] = total / (num_classes * count)
            else:
                class_weight[i] = 10.0
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
            min_lr=1e-7,
            verbose=1,
        ),
        keras.callbacks.TensorBoard(log_dir=os.path.join(cfg.model_dir, "logs"), histogram_freq=1),
        ConfusionMatrixCallback(val_ds, class_names, log_dir=os.path.join(cfg.model_dir, "logs")),
    ]
    os.makedirs(cfg.model_dir, exist_ok=True)

    weights_path = os.path.join(cfg.model_dir, "class_weights.json")
    try:
        with open(weights_path, "w") as f:
            if class_weight is not None:
                json.dump({class_names[i]: w for i, w in class_weight.items()}, f, indent=2)
            else:
                json.dump({"disabled": True}, f, indent=2)
        print(f"Saved class weights to {weights_path}")
    except Exception as e:
        print(f"Failed to save class weights: {e}")

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=cfg.epochs,
        callbacks=callbacks,
        class_weight=class_weight,
        verbose=2,
    )

    h5_path = os.path.join(cfg.model_dir, "waste_classifier.h5")
    model.save(h5_path)
    model.save(os.path.join(cfg.model_dir, "waste_classifier.keras"))
    print(f"Saved model to {h5_path}")

    print("Evaluating on test set...")
    test_loss, test_acc = model.evaluate(test_ds, verbose=1)
    print(f"Test Loss: {test_loss:.4f}, Test Accuracy: {test_acc:.4f}")

    labels_path = os.path.join(cfg.model_dir, "labels.json")
    with open(labels_path, "w") as f:
        json.dump(class_names, f)
    print(f"Saved labels to {labels_path}")

    repr_dir = "/kaggle/working/repr_samples"
    create_repr_dataset(train_ds, args.repr_samples, repr_dir)

    latest_link = os.path.join(base_model_dir, "latest")
    try:
        if os.path.exists(latest_link) or os.path.islink(latest_link):
            os.remove(latest_link)
        os.symlink(os.path.basename(versioned_model_dir), latest_link)
        print(f"Created symlink: {latest_link} -> {versioned_model_dir}")
    except Exception as e:
        print(f"Could not create latest symlink: {e}")

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
        "validation_samples": len(val_labels),
        "test_samples": len(test_labels),
    }

    metadata_path = os.path.join(versioned_model_dir, "training_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"Saved training metadata to {metadata_path}")

    print(f"Training complete!")
    print(f"Model saved in: {versioned_model_dir}")
    print(f"Download the model files from the Output tab")


if __name__ == "__main__":
    main()
