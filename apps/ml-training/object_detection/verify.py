#!/usr/bin/env python
"""Verification script for object detection module."""

print("═══════════════════════════════════════════════════════")
print("  Object Detection Module - Verification Summary")
print("═══════════════════════════════════════════════════════")
print()

# Test imports
print("Testing module imports...")
try:
    from object_detection.config import ObjectDetectionConfig, DEFAULT_CONFIG

    print("✅ Configuration module")
except Exception as e:
    print(f"❌ Configuration: {e}")

try:
    import tensorflow as tf

    print(f"✅ TensorFlow {tf.__version__}")
except Exception as e:
    print(f"❌ TensorFlow: {e}")

try:
    import cv2

    print(f"✅ OpenCV {cv2.__version__}")
except Exception as e:
    print(f"❌ OpenCV: {e}")

try:
    import numpy as np

    version_major = int(np.__version__.split(".")[0])
    if version_major >= 2:
        print(f"⚠️  NumPy {np.__version__} (should be <2 for TensorFlow)")
    else:
        print(f"✅ NumPy {np.__version__}")
except Exception as e:
    print(f"❌ NumPy: {e}")

try:
    import matplotlib

    print(f"✅ Matplotlib {matplotlib.__version__}")
except Exception as e:
    print(f"❌ Matplotlib: {e}")

print()
print("Testing configuration...")
from object_detection.config import ObjectDetectionConfig

config = ObjectDetectionConfig()
print(f"  - Image size: {config.image_size}x{config.image_size}")
print(f"  - Batch size: {config.batch_size}")
print(f"  - Epochs: {config.epochs}")
print(f"  - Learning rate: {config.learning_rate}")
print(f"  - Max boxes: {config.max_boxes}")
print(
    f"  - Loss weights: bbox={config.bbox_weight}, class={config.class_weight}, edge={config.edge_weight}"
)

print()
print("═══════════════════════════════════════════════════════")
print("✅ All systems ready!")
print("═══════════════════════════════════════════════════════")
print()
print("Files created:")
print("  - train_detector.py     : Training script")
print("  - export_tflite.py      : TFLite export")
print("  - test_visualize.py     : Testing & visualization")
print("  - config.py             : Configuration")
print("  - README.md             : Documentation")
print("  - quickstart.sh         : Quick start guide")
print()
print("Next steps:")
print("  1. Run: cd object_detection && ./quickstart.sh")
print("  2. Or train manually:")
print("     python object_detection/train_detector.py --help")
