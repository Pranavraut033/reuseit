#!/usr/bin/env python
"""Convert existing SavedModel to TensorFlow.js format using Python API."""
import os
import sys

# Disable Metal plugin to avoid compatibility issues
os.environ["TF_ENABLE_METAL_PLUGIN"] = "0"

import tensorflow as tf
import tensorflowjs as tfjs


def convert_keras_to_tfjs(keras_model_path: str, output_dir: str):
    """
    Convert Keras model (.h5) to TensorFlow.js format.

    Args:
        keras_model_path: Path to the Keras model file
        output_dir: Directory to save the TFJS model
    """
    print(f"Converting Keras model at {keras_model_path} to TensorFlow.js format...")

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Load the Keras model
        print("Loading Keras model...")
        model = tf.keras.models.load_model(keras_model_path)

        # Convert to TensorFlow.js
        print(f"Saving to TensorFlow.js format in {output_dir}...")
        tfjs.converters.save_keras_model(model, output_dir)

        print("Conversion successful!")
        print(f"Model saved to: {output_dir}")

        # List the output files
        if os.path.exists(output_dir):
            files = os.listdir(output_dir)
            print("Output files:")
            for file in files:
                file_path = os.path.join(output_dir, file)
                size = os.path.getsize(file_path) if os.path.isfile(file_path) else "directory"
                print(
                    f"  - {file} ({size} bytes)"
                    if isinstance(size, int)
                    else f"  - {file} ({size})"
                )

        return True

    except Exception as e:
        print(f"Error during conversion: {e}")
        return False


def convert_saved_model_to_tfjs(saved_model_path: str, output_dir: str):
    """
    Convert SavedModel to TensorFlow.js format using tfjs Python API.

    Args:
        saved_model_path: Path to the SavedModel directory
        output_dir: Directory to save the TFJS model
    """
    print(f"Converting SavedModel at {saved_model_path} to TensorFlow.js format...")

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Inspect the SavedModel
        print("Inspecting SavedModel...")
        model = tf.saved_model.load(saved_model_path)
        print("Signatures:", list(model.signatures.keys()))

        # Convert SavedModel to TensorFlow.js directly
        print(f"Converting SavedModel to TensorFlow.js format in {output_dir}...")
        tfjs.converters.convert_tf_saved_model(saved_model_path, output_dir)

        print("Conversion successful!")
        print(f"Model saved to: {output_dir}")

        # List the output files
        if os.path.exists(output_dir):
            files = os.listdir(output_dir)
            print("Output files:")
            for file in files:
                file_path = os.path.join(output_dir, file)
                size = os.path.getsize(file_path) if os.path.isfile(file_path) else "directory"
                print(
                    f"  - {file} ({size} bytes)"
                    if isinstance(size, int)
                    else f"  - {file} ({size})"
                )

        return True

    except Exception as e:
        print(f"Error during conversion: {e}")
        return False


if __name__ == "__main__":
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    keras_model_path = os.path.join(script_dir, "models", "waste_classifier.h5")
    saved_model_path = os.path.join(script_dir, "models", "saved_model")
    output_dir = os.path.join(script_dir, "tfjs_model")

    if os.path.exists(keras_model_path):
        print(f"Found Keras model at: {keras_model_path}")
        success = convert_keras_to_tfjs(keras_model_path, output_dir)
        if not success:
            print("Keras conversion failed, trying SavedModel...")
            if os.path.exists(saved_model_path):
                success = convert_saved_model_to_tfjs(saved_model_path, output_dir)
    elif os.path.exists(saved_model_path):
        print(f"Found SavedModel at: {saved_model_path}")
        success = convert_saved_model_to_tfjs(saved_model_path, output_dir)
    else:
        print("Error: No model found (neither Keras .h5 nor SavedModel)")
        sys.exit(1)

    if success:
        print("\n✅ Conversion completed successfully!")
        print(f"📁 TensorFlow.js model saved to: {output_dir}")

        # Copy to mobile assets
        mobile_assets_dir = os.path.join(script_dir, "..", "mobile", "src", "assets", "ml")
        os.makedirs(mobile_assets_dir, exist_ok=True)

        import shutil

        mobile_model_dir = os.path.join(mobile_assets_dir, "waste_classifier_tfjs")
        if os.path.exists(mobile_model_dir):
            shutil.rmtree(mobile_model_dir)
        shutil.copytree(output_dir, mobile_model_dir)

        print(f"📱 Model also copied to mobile assets: {mobile_model_dir}")
        print("\nNext steps:")
        print("1. Update classifier.ts to load the TFJS model from assets")
        print("2. Test the classification in the mobile app")
    else:
        print("\n❌ Conversion failed!")
        sys.exit(1)
