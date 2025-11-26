#!/bin/bash
# Quick Start Guide for Object Detection Model

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   ReUseIt - Object Detection Model Quick Start           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

PYTHON="/Users/pranavraut/.pyenv/versions/3.10.14/bin/python"

# Check if Python is available
if ! command -v $PYTHON &> /dev/null; then
    echo "❌ Python not found at $PYTHON"
    echo "Please update the PYTHON variable in this script"
    exit 1
fi

echo "✅ Python configured: $PYTHON"
echo ""

# Check dependencies
echo "Checking dependencies..."
$PYTHON -c "
import sys
missing = []
try:
    import tensorflow
except ImportError:
    missing.append('tensorflow')
try:
    import cv2
except ImportError:
    missing.append('opencv-python')
try:
    import matplotlib
except ImportError:
    missing.append('matplotlib')
try:
    import numpy
    if int(numpy.__version__.split('.')[0]) >= 2:
        print('⚠️  NumPy 2.x detected - please downgrade to numpy<2')
        missing.append('numpy<2')
except ImportError:
    missing.append('numpy')

if missing:
    print('❌ Missing dependencies:', ', '.join(missing))
    print('Install with: pip install ' + ' '.join(missing))
    sys.exit(1)
else:
    print('✅ All dependencies installed')
"

if [ $? -ne 0 ]; then
    echo ""
    echo "Please install missing dependencies first."
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Available Commands:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Train a new model:"
echo "   $PYTHON train_detector.py --dataset ../merged_dataset --epochs 50"
echo ""
echo "2️⃣  Export to TFLite (after training):"
echo "   $PYTHON export_tflite.py models/detector_run_*/best_model.keras --quantize"
echo ""
echo "3️⃣  Test on a single image:"
echo "   $PYTHON test_visualize.py models/detector_run_*/best_model.keras --image /path/to/image.jpg"
echo ""
echo "4️⃣  Test on a directory:"
echo "   $PYTHON test_visualize.py models/detector_run_*/best_model.keras --dir ../merged_dataset/plastic"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Prompt user
read -p "Would you like to start training now? (y/N): " response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting training..."
    $PYTHON train_detector.py --dataset ../merged_dataset --epochs 50 --batch-size 16
else
    echo ""
    echo "Setup complete! You can run any of the commands above when ready."
fi
