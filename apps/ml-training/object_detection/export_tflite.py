#!/usr/bin/env python
"""Export trained object detection model to TFLite format.

Converts the Keras model to TensorFlow Lite for mobile deployment.
Supports both float32 and quantized int8 models.
"""

import argparse
import os
import json
from pathlib import Path
import numpy as np
import tensorflow as tf
from tensorflow import keras
from rich import print

# Add parent directory to path
import sys

sys.path.append(str(Path(__file__).parent.parent))
from dataset_utils import get_canonical_classes


def get_representative_dataset(dataset_dir: str = "merged_dataset", num_samples: int = 100):
    """Generate representative dataset for quantization."""

    classes = get_canonical_classes()
    image_paths = []

    # Collect sample images from each class
    samples_per_class = num_samples // len(classes)

    for class_name in classes:
        class_dir = os.path.join(dataset_dir, class_name)
        if not os.path.exists(class_dir):
            continue

        class_images = [
            os.path.join(class_dir, f)
            for f in os.listdir(class_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ][:samples_per_class]

        image_paths.extend(class_images)

    print(f"[cyan]Using {len(image_paths)} representative samples for quantization[/cyan]")

    def representative_data_gen():
        for img_path in image_paths:
            # Load and preprocess image
            img = tf.io.read_file(img_path)
            img = tf.image.decode_jpeg(img, channels=3)
            img = tf.image.resize(img, [224, 224])
            img = tf.cast(img, tf.float32) / 255.0
            img = tf.expand_dims(img, 0)

            yield [img]

    return representative_data_gen


def export_tflite(
    model_path: str, output_path: str, quantize: bool = False, dataset_dir: str = "merged_dataset"
):
    """Export Keras model to TFLite format.

    Args:
        model_path: Path to saved Keras model (.keras or .h5)
        output_path: Output path for .tflite file
        quantize: Whether to apply int8 quantization
        dataset_dir: Dataset directory for representative samples
    """

    print(f"[cyan]Loading model from {model_path}...[/cyan]")
    model = keras.models.load_model(model_path)

    print("[cyan]Converting to TFLite...[/cyan]")

    # Get input shape
    input_shape = model.input.shape
    batch_size = 1
    input_spec = tf.TensorSpec(
        shape=[batch_size, input_shape[1], input_shape[2], input_shape[3]], dtype=tf.float32
    )

    # Create concrete function
    print("[cyan]Creating concrete function...[/cyan]")

    @tf.function(input_signature=[input_spec])
    def model_fn(x):
        return model(x, training=False)

    concrete_func = model_fn.get_concrete_function()

    # Create converter from concrete function
    converter = tf.lite.TFLiteConverter.from_concrete_functions([concrete_func])

    if quantize:
        print("[yellow]Applying INT8 quantization...[/yellow]")

        # Enable optimizations
        converter.optimizations = [tf.lite.Optimize.DEFAULT]

        # Set representative dataset for full integer quantization
        converter.representative_dataset = get_representative_dataset(dataset_dir)

        # Ensure inputs/outputs are float32 (for easier mobile integration)
        converter.target_spec.supported_ops = [
            tf.lite.OpsSet.TFLITE_BUILTINS_INT8,
            tf.lite.OpsSet.TFLITE_BUILTINS,
        ]
        converter.inference_input_type = tf.float32
        converter.inference_output_type = tf.float32

        print("[yellow]Note: Model will use INT8 internally but accept float32 inputs[/yellow]")
    else:
        print("[cyan]Using FLOAT32 model (no quantization)[/cyan]")

        # For float32, still apply default optimizations
        converter.optimizations = [tf.lite.Optimize.DEFAULT]

    # Allow TensorFlow ops as fallback for compatibility
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS,
        tf.lite.OpsSet.SELECT_TF_OPS,
    ]

    # Convert model
    try:
        tflite_model = converter.convert()
        print("[green]✓ Conversion successful[/green]")
    except Exception as e:
        print(f"[red]Error during conversion: {e}[/red]")
        raise

    # Save the model
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(tflite_model)

    # Get file size
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[green]✓ Model saved to {output_path} ({size_mb:.2f} MB)[/green]")

    # Verify the model
    print("[cyan]Verifying TFLite model...[/cyan]")
    verify_tflite_model(output_path)

    return output_path


def verify_tflite_model(tflite_path: str):
    """Verify TFLite model by running inference on a test image."""

    # Load the TFLite model
    interpreter = tf.lite.Interpreter(model_path=tflite_path)
    interpreter.allocate_tensors()

    # Get input and output details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print(f"[cyan]Model input details:[/cyan]")
    for detail in input_details:
        print(f"  - {detail['name']}: shape={detail['shape']}, dtype={detail['dtype']}")

    print(f"[cyan]Model output details:[/cyan]")
    for detail in output_details:
        print(f"  - {detail['name']}: shape={detail['shape']}, dtype={detail['dtype']}")

    # Test with random input
    input_shape = input_details[0]["shape"]
    test_input = np.random.random(input_shape).astype(np.float32)

    interpreter.set_tensor(input_details[0]["index"], test_input)
    interpreter.invoke()

    print("[green]✓ Model verification successful[/green]")

    # Print output shapes
    outputs = {}
    for detail in output_details:
        output_data = interpreter.get_tensor(detail["index"])
        outputs[detail["name"]] = output_data
        print(f"  - {detail['name']}: {output_data.shape}")

    return outputs


def export_model_info(model_path: str, output_dir: str):
    """Export model architecture and metadata."""

    model = keras.models.load_model(model_path)

    # Save model summary
    summary_path = os.path.join(output_dir, "model_summary.txt")
    with open(summary_path, "w") as f:
        model.summary(print_fn=lambda x: f.write(x + "\n"))

    print(f"[green]Model summary saved to {summary_path}[/green]")

    # Save metadata
    metadata = {
        "input_shape": model.input_shape,
        "output_names": list(model.output_names),
        "num_parameters": model.count_params(),
        "classes": get_canonical_classes(),
    }

    metadata_path = os.path.join(output_dir, "model_info.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[green]Model metadata saved to {metadata_path}[/green]")


def main():
    parser = argparse.ArgumentParser(description="Export object detection model to TFLite")
    parser.add_argument("model_path", type=str, help="Path to trained Keras model (.keras or .h5)")
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output path for TFLite model (default: same dir as input)",
    )
    parser.add_argument("--quantize", action="store_true", help="Apply INT8 quantization")
    parser.add_argument(
        "--dataset",
        type=str,
        default="merged_dataset",
        help="Dataset directory for representative samples",
    )
    parser.add_argument(
        "--export-info", action="store_true", help="Export model architecture and metadata"
    )

    args = parser.parse_args()

    # Determine output path
    if args.output is None:
        model_dir = os.path.dirname(args.model_path)
        model_name = os.path.splitext(os.path.basename(args.model_path))[0]
        quantize_suffix = "_quantized" if args.quantize else ""
        args.output = os.path.join(model_dir, f"{model_name}{quantize_suffix}.tflite")

    # Export to TFLite
    tflite_path = export_tflite(
        model_path=args.model_path,
        output_path=args.output,
        quantize=args.quantize,
        dataset_dir=args.dataset,
    )

    # Export model info if requested
    if args.export_info:
        export_model_info(args.model_path, os.path.dirname(tflite_path))

    print(f"\n[bold green]Export complete![/bold green]")
    print(f"[cyan]TFLite model: {tflite_path}[/cyan]")

    # Print usage instructions
    print("\n[bold cyan]Usage in mobile app:[/bold cyan]")
    print(f"1. Copy {os.path.basename(tflite_path)} to your mobile app's assets")
    print("2. Load the model using TensorFlow Lite interpreter")
    print("3. Input: Image tensor of shape (1, 224, 224, 3) with float32 values [0, 1]")
    print("4. Outputs:")
    print("   - bbox: Bounding box coordinates [x_min, y_min, x_max, y_max]")
    print("   - class: Class probabilities for each waste category")
    print("   - edges: Edge detection mask")


if __name__ == "__main__":
    main()
