#!/usr/bin/env python
"""Export trained YOLO model to TFLite format for mobile deployment."""

import os
import argparse
from pathlib import Path
import subprocess
import sys
from typing import Optional
from ultralytics import YOLO
from rich import print
import tensorflow as tf
import onnxruntime as ort
import numpy as np


def export_onnx(weights_path: str, output_path: str = None) -> Optional[str]:
    """
    Export YOLO model to ONNX format.

    Args:
        weights_path: Path to YOLO weights (.pt file)
        output_path: Output path for ONNX file (optional)

    Returns:
        Path to exported ONNX file or None if failed
    """
    print(f"[cyan]Exporting {weights_path} to ONNX[/cyan]")

    if output_path is None:
        output_path = str(Path(weights_path).parent / f"{Path(weights_path).stem}.onnx")

    try:
        model = YOLO(weights_path)
        results = model.export(format="onnx", dynamic=True, simplify=True)

        if results:
            print(f"[green]ONNX export successful: {output_path}[/green]")
            return output_path
        else:
            print("[red]ONNX export failed[/red]")
            return None

    except Exception as e:
        print(f"[red]ONNX export error: {e}[/red]")
        return None


def export_savedmodel(onnx_path: str, output_path: str = None) -> Optional[str]:
    """
    Convert ONNX model to TensorFlow SavedModel format using onnx-tf.

    Args:
        onnx_path: Path to ONNX model
        output_path: Output path for SavedModel directory (optional)

    Returns:
        Path to SavedModel directory or None if failed
    """
    print(f"[cyan]Converting {onnx_path} to TensorFlow SavedModel[/cyan]")

    if output_path is None:
        output_path = str(Path(onnx_path).parent / f"{Path(onnx_path).stem}_savedmodel")

    try:
        from onnx_tf.backend import prepare

        # Load ONNX model
        onnx_model = ort.InferenceSession(onnx_path)

        # Convert to TensorFlow
        tf_rep = prepare(onnx_model)
        tf_rep.export_graph(output_path)

        if os.path.exists(output_path):
            print(f"[green]SavedModel export successful: {output_path}[/green]")
            return output_path
        else:
            print("[red]SavedModel export failed - output not found[/red]")
            return None

    except Exception as e:
        print(f"[red]SavedModel export error: {e}[/red]")
        return None


def export_tflite(
    savedmodel_path: str, output_path: str = None, quantize: bool = True
) -> Optional[str]:
    """
    Convert TensorFlow SavedModel to TFLite format with FP16 quantization.

    Args:
        savedmodel_path: Path to SavedModel directory
        output_path: Output path for TFLite file (optional)
        quantize: Whether to apply FP16 quantization

    Returns:
        Path to TFLite file or None if failed
    """
    print(f"[cyan]Converting {savedmodel_path} to TFLite (FP16 quantized: {quantize})[/cyan]")

    if output_path is None:
        output_path = str(Path(savedmodel_path).parent / "model_fp16.tflite")

    try:
        # Load SavedModel
        converter = tf.lite.TFLiteConverter.from_saved_model(savedmodel_path)

        if quantize:
            # Apply FP16 quantization for better performance on mobile
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            converter.target_spec.supported_types = [tf.float16]

        # Convert to TFLite
        tflite_model = converter.convert()

        # Save TFLite model
        with open(output_path, "wb") as f:
            f.write(tflite_model)

        print(f"[green]TFLite export successful: {output_path}[/green]")
        print(f"[cyan]Model size: {os.path.getsize(output_path) / (1024*1024):.2f} MB[/cyan]")

        return output_path

    except Exception as e:
        print(f"[red]TFLite export error: {e}[/red]")
        return None


def validate_tflite_model(tflite_path: str, input_shape: tuple = (1, 640, 640, 3)) -> bool:
    """
    Validate TFLite model by running inference on dummy input.

    Args:
        tflite_path: Path to TFLite model
        input_shape: Expected input shape

    Returns:
        True if validation successful, False otherwise
    """
    print(f"[cyan]Validating TFLite model: {tflite_path}[/cyan]")

    try:
        # Load TFLite model
        interpreter = tf.lite.Interpreter(model_path=tflite_path)
        interpreter.allocate_tensors()

        # Get input/output details
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        print(f"[cyan]Input shape: {input_details[0]['shape']}[/cyan]")
        print(f"[cyan]Output shapes: {[out['shape'] for out in output_details]}[/cyan]")

        # Create dummy input
        dummy_input = np.random.random(input_shape).astype(np.float32)

        # Run inference
        interpreter.set_tensor(input_details[0]["index"], dummy_input)
        interpreter.invoke()

        # Get outputs
        outputs = []
        for output_detail in output_details:
            output = interpreter.get_tensor(output_detail["index"])
            outputs.append(output)

        print(f"[green]TFLite validation successful![/green]")
        print(f"[cyan]Output shapes: {[out.shape for out in outputs]}[/cyan]")

        return True

    except Exception as e:
        print(f"[red]TFLite validation failed: {e}[/red]")
        return False


def export_pipeline(weights_path: str, output_dir: str = None) -> Optional[str]:
    """
    Export YOLO model directly to TFLite using Ultralytics built-in export.

    Args:
        weights_path: Path to YOLO weights
        output_dir: Output directory (optional, defaults to weights directory)

    Returns:
        Path to TFLite model or None if failed
    """
    if output_dir is None:
        output_dir = str(Path(weights_path).parent)

    print(f"[bold cyan]Exporting {weights_path} to TFLite using Ultralytics[/bold cyan]")

    try:
        model = YOLO(weights_path)
        results = model.export(format="tflite", int8=False, half=True)  # FP16 quantization

        if results:
            # Ultralytics saves TFLite files inside the SavedModel directory
            saved_model_dir = str(
                Path(weights_path).parent / f"{Path(weights_path).stem}_saved_model"
            )
            tflite_path = str(Path(saved_model_dir) / "best_float16.tflite")

            if os.path.exists(tflite_path):
                print(f"[bold green]TFLite export successful: {tflite_path}[/bold green]")
                print(
                    f"[cyan]Model size: {os.path.getsize(tflite_path) / (1024*1024):.2f} MB[/cyan]"
                )
                return tflite_path
            else:
                print(f"[red]TFLite file not found at expected location: {tflite_path}[/red]")
                # Try alternative locations
                alt_path = str(Path(weights_path).parent / f"{Path(weights_path).stem}.tflite")
                if os.path.exists(alt_path):
                    print(f"[green]Found TFLite file at alternative location: {alt_path}[/green]")
                    return alt_path
                print("[red]TFLite file not found after export[/red]")
                return None
        else:
            print("[red]TFLite export failed[/red]")
            return None

    except Exception as e:
        print(f"[red]TFLite export error: {e}[/red]")
        return None


def main():
    """Main entry point for export script."""
    parser = argparse.ArgumentParser(
        description="Export YOLO model to TFLite format for mobile deployment",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--weights",
        type=str,
        required=True,
        help="Path to YOLO weights file (.pt)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        help="Output directory for exported models",
    )
    parser.add_argument(
        "--onnx-only",
        action="store_true",
        help="Export to ONNX only",
    )
    parser.add_argument(
        "--savedmodel-only",
        action="store_true",
        help="Export to SavedModel only (requires --onnx)",
    )
    parser.add_argument(
        "--tflite-only",
        action="store_true",
        help="Export to TFLite only (requires --savedmodel)",
    )
    parser.add_argument(
        "--onnx",
        type=str,
        help="Path to ONNX file (for savedmodel-only or tflite-only)",
    )
    parser.add_argument(
        "--savedmodel",
        type=str,
        help="Path to SavedModel directory (for tflite-only)",
    )
    parser.add_argument(
        "--no-quantize",
        action="store_true",
        help="Skip FP16 quantization for TFLite",
    )

    args = parser.parse_args()

    # Validate inputs
    if not os.path.exists(args.weights):
        print(f"[red]Weights file not found: {args.weights}[/red]")
        return

    if args.output_dir:
        os.makedirs(args.output_dir, exist_ok=True)
    else:
        args.output_dir = str(Path(args.weights).parent)

    # Handle different export modes
    if args.onnx_only:
        export_onnx(args.weights, args.output_dir)
    elif args.savedmodel_only:
        if not args.onnx:
            print("[red]--onnx is required for --savedmodel-only[/red]")
            return
        export_savedmodel(args.onnx, args.output_dir)
    elif args.tflite_only:
        if not args.savedmodel:
            print("[red]--savedmodel is required for --tflite-only[/red]")
            return
        export_tflite(args.savedmodel, args.output_dir, not args.no_quantize)
    else:
        # Full pipeline
        export_pipeline(args.weights, args.output_dir)

    print("\n[bold green]Export workflow complete![/bold green]")
    print("[cyan]Next steps:[/cyan]")
    print("1. Test the TFLite model in your mobile app")
    print("2. Optimize model size if needed")
    print("3. Deploy to production")


if __name__ == "__main__":
    main()
