#!/usr/bin/env python
"""Test and visualize waste classification model performance."""
import argparse
import json
import os
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow import keras

AUTOTUNE = tf.data.AUTOTUNE


def find_latest_model(model_dir: str) -> tuple[str, str]:
    """Find the latest trained model and its labels."""
    if not os.path.exists(model_dir):
        raise SystemExit(f"Model directory {model_dir} does not exist")

    # Check for latest symlink
    latest_link = os.path.join(model_dir, "latest")
    if os.path.islink(latest_link):
        latest_run = os.readlink(latest_link)
    else:
        # Find the most recent run directory
        runs = []
        for item in os.listdir(model_dir):
            run_dir = os.path.join(model_dir, item)
            if os.path.isdir(run_dir) and item.startswith("run_"):
                runs.append((item, os.path.getmtime(run_dir)))

        if not runs:
            raise SystemExit(f"No training runs found in {model_dir}")

        runs.sort(key=lambda x: x[1], reverse=True)
        latest_run = runs[0][0]

    run_dir = os.path.join(model_dir, latest_run)

    # Try different model file names
    possible_models = [
        "waste_classifier.keras",
        "waste_classifier.h5",
        "waste_classifier_best.keras",
    ]
    model_path = None
    for model_file in possible_models:
        candidate = os.path.join(run_dir, model_file)
        if os.path.exists(candidate):
            model_path = candidate
            break

    if model_path is None:
        raise SystemExit(f"Could not find model file in {run_dir}")

    # Try to find labels
    labels_path = os.path.join(run_dir, "labels.json")
    if not os.path.exists(labels_path):
        # Fallback to canonical classes
        labels_path = None

    return model_path, labels_path


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--model-path", help="Path to model (default: latest)")
    p.add_argument("--labels-path", help="Path to labels (default: from model dir)")
    p.add_argument("--merged-dir", default="merged_dataset", help="Merged dataset directory")
    p.add_argument("--output-dir", default="results", help="Output directory for plots")
    p.add_argument(
        "--num-samples", type=int, default=10, help="Number of sample predictions to visualize"
    )
    p.add_argument("--batch-size", type=int, default=32, help="Batch size for evaluation")
    p.add_argument("--model-dir", default="models", help="Directory containing model runs")
    return p.parse_args()


def load_model_and_labels(model_path: str, labels_path: str):
    """Load model and class labels."""
    model = keras.models.load_model(model_path, compile=False)
    # Compile the model for evaluation
    model.compile(loss="categorical_crossentropy", metrics=["accuracy"])

    if labels_path and os.path.exists(labels_path):
        with open(labels_path, "r") as f:
            class_names = json.load(f)
    else:
        # Use canonical classes if labels.json not found
        from dataset_utils import get_canonical_classes

        class_names = get_canonical_classes()

    return model, class_names


def create_test_dataset(merged_dir: str, class_names: list[str], batch_size: int = 32):
    """Create test dataset from merged directory with stratified sampling."""
    merged_path = Path(merged_dir)
    if not merged_path.exists():
        raise FileNotFoundError(f"Merged directory not found: {merged_dir}")

    # Collect all image files and labels
    image_files = []
    labels = []

    for class_idx, class_name in enumerate(class_names):
        class_dir = merged_path / class_name
        if not class_dir.exists():
            continue

        for ext in ["*.jpg", "*.jpeg", "*.png"]:
            for img_file in class_dir.glob(ext):
                image_files.append(str(img_file))
                labels.append(class_idx)

    # Use stratified sampling to maintain class distribution
    from collections import Counter
    import numpy as np
    from sklearn.model_selection import train_test_split

    label_counts = Counter(labels)
    min_samples_per_class = 10  # Minimum samples needed for stratification

    # Check which classes have enough samples for stratification
    stratify_labels = [
        label if label_counts[label] >= min_samples_per_class else -1 for label in labels
    ]

    # Take a subset for testing (e.g., 20% of data, max 1000 samples)
    total_samples = len(image_files)
    test_size = min(1000, max(100, total_samples // 5))

    try:
        # Stratified split to maintain class distribution
        _, test_files, _, test_labels = train_test_split(
            image_files, labels, test_size=test_size, stratify=stratify_labels, random_state=42
        )
        print(f"Stratified test split: {len(test_files)} samples")
    except ValueError:
        # Fallback to random split if stratification fails
        _, test_files, _, test_labels = train_test_split(
            image_files, labels, test_size=test_size, random_state=42
        )
        print(f"Random test split: {len(test_files)} samples")

    def load_image(file_path, label):
        img = tf.io.read_file(file_path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, (224, 224))  # Assuming 224x224 input size
        img = tf.cast(img, tf.float32)  # Keep in [0,255] range
        # Apply MobileNetV3 preprocessing to match training (NOT V2!)
        img = keras.applications.mobilenet_v3.preprocess_input(img)
        return img, tf.one_hot(label, len(class_names))

    # Create dataset
    test_ds = tf.data.Dataset.from_tensor_slices((test_files, test_labels))
    test_ds = test_ds.map(load_image, num_parallel_calls=AUTOTUNE)
    test_ds = test_ds.batch(batch_size).prefetch(AUTOTUNE)

    return test_ds


def evaluate_model(model, test_ds, class_names):
    """Evaluate model on test dataset."""
    print("Evaluating model on test set...")
    test_loss, test_acc = model.evaluate(test_ds, verbose=1)

    # Get predictions and true labels
    y_true = []
    y_pred = []
    y_pred_probs = []

    for batch_x, batch_y in test_ds:
        preds = model.predict(batch_x, verbose=0)
        y_pred_probs.extend(preds)
        y_pred.extend(np.argmax(preds, axis=1))
        y_true.extend(np.argmax(batch_y.numpy(), axis=1))

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    y_pred_probs = np.array(y_pred_probs)

    return test_loss, test_acc, y_true, y_pred, y_pred_probs


def plot_confusion_matrix(y_true, y_pred, class_names, output_dir):
    """Plot and save confusion matrix."""
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues", xticklabels=class_names, yticklabels=class_names
    )
    plt.title("Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.xticks(rotation=45)
    plt.yticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "confusion_matrix.png"), dpi=300, bbox_inches="tight")
    plt.show()


def plot_sample_predictions(model, test_ds, class_names, num_samples, output_dir):
    """Plot sample predictions with images."""
    # Create grid that can accommodate up to num_samples, but limit to reasonable size
    max_plots = min(num_samples, 20)  # Limit to 20 samples max for readability
    cols = min(5, max_plots)
    rows = (max_plots + cols - 1) // cols  # Ceiling division

    fig, axes = plt.subplots(rows, cols, figsize=(15, 3 * rows))
    axes = axes.ravel()

    sample_count = 0
    for batch_x, batch_y in test_ds:
        for i in range(batch_x.shape[0]):
            if sample_count >= max_plots:
                break

            img = batch_x[i].numpy()
            true_label = np.argmax(batch_y[i].numpy())
            pred_probs = model.predict(np.expand_dims(img, 0), verbose=0)[0]
            pred_label = np.argmax(pred_probs)

            # Denormalize image for display
            img_display = (img * 255).astype(np.uint8)

            axes[sample_count].imshow(img_display)
            color = "green" if true_label == pred_label else "red"
            axes[sample_count].set_title(".2f", color=color, fontsize=8)
            axes[sample_count].axis("off")

            sample_count += 1
        if sample_count >= max_plots:
            break

    # Hide unused axes
    for i in range(sample_count, len(axes)):
        axes[i].axis("off")

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "sample_predictions.png"), dpi=300, bbox_inches="tight")
    plt.show()


def print_classification_report(y_true, y_pred, class_names):
    """Print detailed classification report."""
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=class_names))


def main():
    args = parse_args()

    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)

    # Find model and labels paths if not specified
    if args.model_path is None:
        model_path, labels_path = find_latest_model(args.model_dir)
        print(f"Using latest model: {model_path}")
        if labels_path:
            print(f"Using labels: {labels_path}")
        else:
            print("Using canonical class labels")
    else:
        model_path = args.model_path
        labels_path = args.labels_path

    # Load model and labels
    model, class_names = load_model_and_labels(model_path, labels_path)
    print(f"Loaded model with {len(class_names)} classes: {class_names}")

    # Create test dataset
    test_ds = create_test_dataset(args.merged_dir, class_names, args.batch_size)

    # Evaluate model
    test_loss, test_acc, y_true, y_pred, y_pred_probs = evaluate_model(model, test_ds, class_names)

    # Generate visualizations
    plot_confusion_matrix(y_true, y_pred, class_names, args.output_dir)
    plot_sample_predictions(model, test_ds, class_names, args.num_samples, args.output_dir)

    # Print detailed report
    print_classification_report(y_true, y_pred, class_names)

    print(f"\nResults saved to {args.output_dir}/")


if __name__ == "__main__":
    main()
