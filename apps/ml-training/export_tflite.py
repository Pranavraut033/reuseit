#!/usr/bin/env python
"""Convert Keras model to TFLite (dynamic range or int8)."""
import argparse
import os
import numpy as np
import tensorflow as tf


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--model-path", required=True, help="Path to .h5 or SavedModel directory")
    p.add_argument("--output", required=True, help="TFLite output file path")
    p.add_argument("--int8", action="store_true", help="Enable full int8 quantization")
    p.add_argument(
        "--repr-dir", default="repr_samples", help="Directory with representative .npy samples"
    )
    return p.parse_args()


def representative_dataset_gen(repr_dir: str):
    files = [f for f in os.listdir(repr_dir) if f.endswith(".npy")]
    for f in files:
        arr = np.load(os.path.join(repr_dir, f))
        arr = np.expand_dims(arr, 0).astype(np.float32)
        yield [arr]


def main():
    args = parse_args()
    if os.path.isdir(args.model_path):
        converter = tf.lite.TFLiteConverter.from_saved_model(args.model_path)
    else:
        model = tf.keras.models.load_model(args.model_path)
        converter = tf.lite.TFLiteConverter.from_keras_model(model)

    if args.int8:
        if not os.path.isdir(args.repr_dir):
            raise SystemExit(f"Representative dir {args.repr_dir} missing for int8 quantization")
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.representative_dataset = lambda: representative_dataset_gen(args.repr_dir)
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.uint8
        converter.inference_output_type = tf.uint8
    else:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        # Enable TF Select ops for mixed precision models
        converter.target_spec.supported_ops = [
            tf.lite.OpsSet.TFLITE_BUILTINS,
            tf.lite.OpsSet.SELECT_TF_OPS,
        ]

    tflite_model = converter.convert()
    with open(args.output, "wb") as f:
        f.write(tflite_model)
    print(f"Saved TFLite model to {args.output}")


if __name__ == "__main__":
    main()
