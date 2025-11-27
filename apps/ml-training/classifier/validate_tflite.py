#!/usr/bin/env python
"""Validate TFLite model performance and compatibility."""
import argparse
import json
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from dataset_utils import get_canonical_classes


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--tflite-path", help="Path to TFLite model (default: latest)")
    p.add_argument("--labels-path", help="Path to labels (default: from model dir)")
    p.add_argument("--test-images", nargs="*", help="Paths to test images")
    p.add_argument(
        "--merged-dir", default="merged_dataset", help="Merged dataset directory for validation"
    )
    p.add_argument("--num-samples", type=int, default=100, help="Number of samples to test")
    p.add_argument("--model-dir", default="models", help="Directory containing model runs")
    return p.parse_args()


def find_latest_tflite_model(model_dir: str) -> str:
    """Find the latest TFLite model file."""
    import glob

    # Look for .tflite files in current directory first
    tflite_files = glob.glob("*.tflite")
    if tflite_files:
        # Return the most recently modified
        tflite_files.sort(key=os.path.getmtime, reverse=True)
        return tflite_files[0]

    # If no .tflite files in current dir, look in model runs
    if os.path.exists(model_dir):
        for item in os.listdir(model_dir):
            run_dir = os.path.join(model_dir, item)
            if os.path.isdir(run_dir) and item.startswith("run_"):
                tflite_files = glob.glob(os.path.join(run_dir, "*.tflite"))
                if tflite_files:
                    tflite_files.sort(key=os.path.getmtime, reverse=True)
                    return tflite_files[0]

    raise SystemExit("No TFLite model files found")


def load_labels(labels_path: str) -> list[str]:
    """Load class labels."""
    if labels_path and os.path.exists(labels_path):
        with open(labels_path, "r") as f:
            return json.load(f)
    else:
        # Fallback to canonical classes
        return get_canonical_classes()


def load_tflite_model(tflite_path: str):
    """Load TFLite model and create interpreter."""
    with open(tflite_path, "rb") as f:
        tflite_model = f.read()

    interpreter = tf.lite.Interpreter(model_content=tflite_model)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print(f"TFLite Model: {tflite_path}")
    print(f"Input shape: {input_details[0]['shape']}")
    print(f"Input type: {input_details[0]['dtype']}")
    print(f"Output shape: {output_details[0]['shape']}")
    print(f"Output type: {output_details[0]['dtype']}")

    return interpreter, input_details, output_details


def preprocess_image(image_path: str, input_shape: tuple, input_type: np.dtype) -> np.ndarray:
    """Preprocess image for TFLite model."""
    # Load and decode image
    img = tf.io.read_file(image_path)
    img = tf.image.decode_image(img, channels=3, expand_animations=False)

    # Resize to model input size
    target_size = (input_shape[1], input_shape[2])  # (height, width)
    img = tf.image.resize(img, target_size)

    # Convert to float32 (keep in [0,255] range)
    img = tf.cast(img, tf.float32)

    # Apply MobileNetV3 preprocessing (matches training!)
    img = tf.keras.applications.mobilenet_v3.preprocess_input(img)

    # Convert to expected input type
    if input_type == np.uint8:
        # For int8 quantized models, scale to 0-255 range
        img = (img + 1.0) * 127.5  # MobileNetV2 preprocess scales to [-1, 1], convert to [0, 255]
        img = tf.clip_by_value(img, 0, 255)
        img = tf.cast(img, np.uint8)

    return img.numpy()


def run_inference(interpreter, input_details, output_details, input_data: np.ndarray) -> np.ndarray:
    """Run inference on TFLite model."""
    interpreter.set_tensor(input_details[0]["index"], input_data)
    interpreter.invoke()
    output_data = interpreter.get_tensor(output_details[0]["index"])
    return output_data


def validate_on_test_images(args, interpreter, input_details, output_details, class_names):
    """Validate model on a set of test images."""
    if not args.test_images:
        print("No test images provided, skipping individual image validation")
        return

    print("\n=== Individual Image Validation ===")
    for img_path in args.test_images:
        if not os.path.exists(img_path):
            print(f"Warning: Test image not found: {img_path}")
            continue

        # Preprocess image
        input_data = preprocess_image(
            img_path, input_details[0]["shape"], input_details[0]["dtype"]
        )
        input_data = np.expand_dims(input_data, axis=0)  # Add batch dimension

        # Run inference
        predictions = run_inference(interpreter, input_details, output_details, input_data)

        # Get top prediction
        pred_idx = np.argmax(predictions[0])
        confidence = predictions[0][pred_idx]

        print(f"Image: {img_path}")
        print(f"  Predicted: {class_names[pred_idx]} (confidence: {confidence:.4f})")
        print()


def validate_on_dataset(args, interpreter, input_details, output_details, class_names):
    """Validate model on a subset of the dataset."""
    print("\n=== Dataset Validation ===")

    merged_path = Path(args.merged_dir)
    if not merged_path.exists():
        print(f"Merged dataset directory not found: {args.merged_dir}")
        return

    # Collect test samples
    test_samples = []
    for class_idx, class_name in enumerate(class_names):
        class_dir = merged_path / class_name
        if not class_dir.exists():
            continue

        # Get all images in this class
        images = (
            list(class_dir.glob("*.jpg"))
            + list(class_dir.glob("*.jpeg"))
            + list(class_dir.glob("*.png"))
        )
        for img_path in images[
            : args.num_samples // len(class_names)
        ]:  # Distribute samples across classes
            test_samples.append((str(img_path), class_idx))

    if not test_samples:
        print("No test samples found")
        return

    # Shuffle and limit samples
    np.random.shuffle(test_samples)
    test_samples = test_samples[: args.num_samples]

    print(f"Testing on {len(test_samples)} samples...")

    correct = 0
    total = len(test_samples)
    class_correct = {i: 0 for i in range(len(class_names))}
    class_total = {i: 0 for i in range(len(class_names))}

    for img_path, true_label in test_samples:
        # Preprocess image
        input_data = preprocess_image(
            img_path, input_details[0]["shape"], input_details[0]["dtype"]
        )
        input_data = np.expand_dims(input_data, axis=0)

        # Run inference
        predictions = run_inference(interpreter, input_details, output_details, input_data)

        # Get prediction
        pred_idx = np.argmax(predictions[0])

        # Update statistics
        if pred_idx == true_label:
            correct += 1
            class_correct[true_label] += 1
        class_total[true_label] += 1

    # Print results
    accuracy = correct / total
    print(".4f")

    print("\nPer-class accuracy:")
    for i, class_name in enumerate(class_names):
        if class_total[i] > 0:
            class_acc = class_correct[i] / class_total[i]
            print(".4f")
        else:
            print(f"  {class_name}: No samples")


def main():
    args = parse_args()

    # Find TFLite model path if not specified
    if args.tflite_path is None:
        tflite_path = find_latest_tflite_model(args.model_dir)
        print(f"Using latest TFLite model: {tflite_path}")
    else:
        tflite_path = args.tflite_path

    # Find labels path if not specified
    if args.labels_path is None:
        # Try to find labels in the same directory as the TFLite model
        tflite_dir = os.path.dirname(tflite_path) if os.path.dirname(tflite_path) else "."
        labels_path = os.path.join(tflite_dir, "labels.json")
        if not os.path.exists(labels_path):
            # Try in model runs
            if os.path.exists(args.model_dir):
                for item in os.listdir(args.model_dir):
                    run_dir = os.path.join(args.model_dir, item)
                    if os.path.isdir(run_dir) and item.startswith("run_"):
                        candidate = os.path.join(run_dir, "labels.json")
                        if os.path.exists(candidate):
                            labels_path = candidate
                            break
        if not os.path.exists(labels_path) if labels_path else True:
            labels_path = None
    else:
        labels_path = args.labels_path

    # Load labels
    class_names = load_labels(labels_path)
    print(f"Loaded {len(class_names)} classes: {class_names}")

    # Load TFLite model
    interpreter, input_details, output_details = load_tflite_model(tflite_path)

    # Validate on individual test images
    validate_on_test_images(args, interpreter, input_details, output_details, class_names)

    # Validate on dataset
    validate_on_dataset(args, interpreter, input_details, output_details, class_names)

    print("\nTFLite model validation complete!")


if __name__ == "__main__":
    main()
