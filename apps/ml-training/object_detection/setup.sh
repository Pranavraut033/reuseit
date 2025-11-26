#!/bin/bash
# Setup script for object detection model

set -e

echo "🚀 Setting up Object Detection Model..."

# Check if we're in the right directory
if [ ! -f "train_detector.py" ]; then
    echo "❌ Error: Please run this script from the object_detection directory"
    exit 1
fi

# Install additional dependencies
echo "📦 Installing additional dependencies..."
pip install -r requirements.txt

# Create output directories
echo "📁 Creating output directories..."
mkdir -p models
mkdir -p test_results

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Train the model:"
echo "   python train_detector.py --dataset ../merged_dataset --epochs 50"
echo ""
echo "2. Export to TFLite:"
echo "   python export_tflite.py models/detector_run_TIMESTAMP/best_model.keras --quantize"
echo ""
echo "3. Test the model:"
echo "   python test_visualize.py models/detector_run_TIMESTAMP/best_model.keras --dir ../merged_dataset/plastic"
