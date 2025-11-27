#!/usr/bin/env python
"""Alternative TFLite converter with concrete function approach.

This version uses tf.function and concrete functions instead of direct Keras model
conversion, which provides better compatibility with MobileNetV3 architecture.

Previous Issue:
- Direct Keras model conversion failed with LLVM error on MobileNetV3
- Error: "missing attribute 'value'" in ReadVariableOp

Solution:
- Use concrete function method with explicit input signature
- Falls back to SavedModel conversion if concrete function fails
- Results in 2.7MB optimized model (vs 15MB with old method)

Date Fixed: November 25, 2025
"""
import argparse
import os
import shutil
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--model-path", help="Path to .keras model")
    p.add_argument("--output", help="TFLite output file path")
    p.add_argument("--int8", action="store_true", help="Enable full int8 quantization")
    p.add_argument("--repr-dir", default="repr_samples", help="Representative samples dir")
    p.add_argument("--model-dir", default="models", help="Directory containing model runs")
    return p.parse_args()


def representative_dataset_gen(repr_dir: str):
    files = [f for f in os.listdir(repr_dir) if f.endswith(".npy")]
    for f in files:
        arr = np.load(os.path.join(repr_dir, f))
        arr = np.expand_dims(arr, 0).astype(np.float32)
        yield [arr]


def find_latest_model(model_dir: str) -> str:
    """Find the latest trained model."""
    if not os.path.exists(model_dir):
        raise SystemExit(f"Model directory {model_dir} does not exist")

    runs = []
    for item in os.listdir(model_dir):
        run_dir = os.path.join(model_dir, item)
        if os.path.isdir(run_dir) and item.startswith("run_"):
            runs.append((item, os.path.getmtime(run_dir)))

    if not runs:
        raise SystemExit(f"No training runs found in {model_dir}")

    runs.sort(key=lambda x: x[1], reverse=True)
    return runs[0][0]


def convert_with_concrete_function(
    model_path, output_path, labels_path, use_int8=False, repr_dir=None
):
    """Convert using concrete function method - better for problematic models."""
    print(f"Loading model: {model_path}")
    model = tf.keras.models.load_model(model_path, compile=False)

    # Get input shape
    input_shape = model.input.shape
    batch_size = 1
    input_spec = tf.TensorSpec(
        shape=[batch_size, input_shape[1], input_shape[2], input_shape[3]], dtype=tf.float32
    )

    # Create concrete function
    print("Creating concrete function...")

    @tf.function(input_signature=[input_spec])
    def model_fn(x):
        return model(x, training=False)

    concrete_func = model_fn.get_concrete_function()

    # Convert via concrete function
    print("Converting via concrete function...")
    converter = tf.lite.TFLiteConverter.from_concrete_functions([concrete_func])

    if use_int8:
        if not os.path.isdir(repr_dir):
            raise SystemExit(f"Representative dir {repr_dir} missing for int8 quantization")
        print(f"Using representative dataset from: {repr_dir}")
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.representative_dataset = lambda: representative_dataset_gen(repr_dir)
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.uint8
        converter.inference_output_type = tf.uint8
    else:
        # Dynamic range quantization
        converter.optimizations = [tf.lite.Optimize.DEFAULT]

    # Settings for better compatibility
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS,
        tf.lite.OpsSet.SELECT_TF_OPS,  # Allow TensorFlow ops as fallback
    ]

    print("Performing conversion...")
    tflite_model = converter.convert()

    with open(output_path, "wb") as f:
        f.write(tflite_model)

    model_size = len(tflite_model) / (1024 * 1024)
    print(f"Model size: {model_size:.2f} MB")
    print(f"✓ Saved TFLite model to {output_path}")

    # Export model info
    export_model_info(model_path, labels_path, os.path.dirname(output_path))

    return True


def main():
    args = parse_args()

    # Find model path if not specified
    if args.model_path is None:
        latest_run = find_latest_model(args.model_dir)
        run_dir = os.path.join(args.model_dir, latest_run)
        possible_models = [
            "waste_classifier_best.keras",
            "waste_classifier.keras",
            "waste_classifier.h5",
        ]
        model_path = None
        for model_file in possible_models:
            candidate = os.path.join(run_dir, model_file)
            if os.path.exists(candidate):
                model_path = candidate
                break
        if model_path is None:
            raise SystemExit(f"Could not find model in {run_dir}. Tried: {possible_models}")
        print(f"Using latest model: {model_path}")
    else:
        model_path = args.model_path

    # Find labels path
    labels_path = os.path.join(os.path.dirname(model_path), "labels.json")

    # Set default output path (same directory as input model)
    if args.output is None:
        model_dir = os.path.dirname(model_path)
        base_name = os.path.splitext(os.path.basename(model_path))[0]
        quant_type = "int8" if args.int8 else "dynamic"
        output_path = os.path.join(model_dir, f"{base_name}_{quant_type}.tflite")
    else:
        output_path = args.output

    print(f"Output: {output_path}")

    try:
        # Try concrete function method
        if convert_with_concrete_function(
            model_path, output_path, labels_path, args.int8, args.repr_dir
        ):
            return
    except Exception as e:
        print(f"Concrete function method failed: {e}")
        print("\nTrying alternative method...")

    # Fallback: Try via SavedModel
    try:
        print("Loading model...")
        model = tf.keras.models.load_model(model_path, compile=False)

        temp_dir = "temp_saved_model_export"
        print(f"Exporting to SavedModel: {temp_dir}")
        tf.saved_model.save(model, temp_dir)

        print("Converting from SavedModel...")
        converter = tf.lite.TFLiteConverter.from_saved_model(temp_dir)

        if args.int8:
            if not os.path.isdir(args.repr_dir):
                raise SystemExit(f"Representative dir {args.repr_dir} missing")
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            converter.representative_dataset = lambda: representative_dataset_gen(args.repr_dir)
            converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
            converter.inference_input_type = tf.uint8
            converter.inference_output_type = tf.uint8
        else:
            converter.optimizations = [tf.lite.Optimize.DEFAULT]

        converter.target_spec.supported_ops = [
            tf.lite.OpsSet.TFLITE_BUILTINS,
            tf.lite.OpsSet.SELECT_TF_OPS,
        ]

        tflite_model = converter.convert()

        with open(output_path, "wb") as f:
            f.write(tflite_model)

        # Cleanup
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

        model_size = len(tflite_model) / (1024 * 1024)
        print(f"Model size: {model_size:.2f} MB")
        print(f"✓ Saved TFLite model to {output_path}")

        # Export model info
        export_model_info(model_path, labels_path, os.path.dirname(output_path))

    except Exception as e:
        # Cleanup
        if os.path.exists("temp_saved_model_export"):
            shutil.rmtree("temp_saved_model_export")
        raise SystemExit(f"All conversion methods failed: {e}")


def export_model_info(model_path: str, labels_path: str, output_dir: str):
    """Export model architecture and metadata."""
    model = keras.models.load_model(model_path)

    # Save model summary
    summary_path = os.path.join(output_dir, "model_summary.txt")
    with open(summary_path, "w") as f:
        model.summary(print_fn=lambda x: f.write(x + "\n"))

    print(f"✓ Model summary saved to {summary_path}")

    # Load labels
    if labels_path and os.path.exists(labels_path):
        with open(labels_path, "r") as f:
            classes = json.load(f)
    else:
        from dataset_utils import get_canonical_classes

        classes = get_canonical_classes()

    # Save metadata
    metadata = {
        "input_shape": model.input_shape,
        "output_shape": model.output_shape,
        "num_parameters": model.count_params(),
        "classes": classes,
        "num_classes": len(classes),
    }

    metadata_path = os.path.join(output_dir, "model_info.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ Model metadata saved to {metadata_path}")


if __name__ == "__main__":
    main()
