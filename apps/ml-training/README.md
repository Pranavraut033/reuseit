# ReUseIt ML Training Pipeline

This directory contains the machine learning training pipelines for the ReUseIt mobile application.

## 🎯 Overview

The ML training includes:

- **Waste Classification Model** (deprecated): MobileNetV3-based image classification for waste categories
- **Object Detection Model** (active): MobileNetV2-based object detection with edge detection for waste items
- **Shared Utilities**: Dataset downloading, preprocessing, and canonical class mappings

**Note:** The classification model is deprecated. The active model is the object detector in `object_detection/`.

## 📦 Model Details

- **Architecture:** MobileNetV3-Large (transfer learning)
- **Input Size:** 224x224x3
- **Classes:** 8 waste categories
  - cardboard
  - glass
  - metal
  - paper
  - plastic
  - trash
  - biological
  - battery

- **Export Format:** TFLite (dynamic range quantization)
- **Model Size:** ~2.7 MB (optimized for mobile)

## 🚀 Quick Start

### Prerequisites

- Python 3.10.x (specified in `.python-version`)
- Virtual environment (venv or conda)

### Setup

```bash
# Create and activate virtual environment
python3.10 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up Kaggle API credentials
# Place your kaggle.json in ~/.kaggle/ or current directory
```

### Auto-Labeling with YOLO

Before training the object detection model, you can generate real bounding box annotations using YOLO:

```bash
# Activate virtual environment
source .venv/bin/activate

# Generate bounding boxes for all images in merged_dataset
python auto_label.py --input merged_dataset --output yolo_labels.csv

# Use a different YOLO model (default: yolov8n.pt)
python auto_label.py --input merged_dataset --output yolo_labels.csv --model yolov8x.pt

# Enable verbose logging
python auto_label.py --input merged_dataset --output yolo_labels.csv --verbose

# Show help
python auto_label.py --help
```

**Features:**

- Automatically loads YOLO model with safe weights handling
- Processes images with streaming for memory efficiency
- Progress indication for large datasets (48K+ images)
- Outputs CSV with: `filename, x_center, y_center, width, height, confidence, class_id`
- Falls back to dummy labels if YOLO fails to load

**CSV Output Format:**

```csv
filename,x_center,y_center,width,height,confidence,class_id
image1.jpg,0.5,0.5,0.3,0.4,0.95,39
image2.jpg,0.4,0.6,0.2,0.3,0.87,44
```

Coordinates are normalized (0-1 range) in YOLO format.

### Training the Object Detection Model

The object detection model uses real YOLO-generated bounding boxes or automatically prepares datasets if they don't exist.

1. **Generate Real Bounding Boxes** (recommended):

   ```bash
   python auto_label.py --input merged_dataset --output yolo_labels.csv
   ```

2. **Train Object Detector**:

   ```bash
   cd object_detection
   python train_detector.py

   # With custom settings
   python train_detector.py --epochs 50 --batch-size 16 --max-images-per-class 1000
   ```

3. **Export to TFLite**:
   ```bash
   cd object_detection
   python export_tflite.py
   ```

### Training the Classifier Model (Deprecated)

The classifier model also prepares datasets automatically:

```bash
cd classifier
python train.py
```

### Standalone Dataset Preparation

You can prepare datasets independently using the provided script:

```bash
# Prepare datasets (downloads ~2GB of data)
./prepare_datasets.sh

# Clean existing datasets before preparing (with confirmation)
./prepare_datasets.sh --clean

# Clear raw datasets after successful preparation
./prepare_datasets.sh --clear

# Combine flags: clean existing and clear raw afterwards
./prepare_datasets.sh --clean --clear

# Show help
./prepare_datasets.sh --help
```

Or manually with the virtual environment:

```bash
source .venv/bin/activate
python -c "from dataset_utils import prepare_datasets; prepare_datasets()"
```

This will download and consolidate all configured datasets using explicit configurations for precise control.

## 📁 Directory Structure

```
apps/ml-training/
├── auto_label.py             # YOLO auto-labeling script for bounding boxes
├── classifier/               # Deprecated classification model
│   ├── config.py             # Training configuration
│   ├── train.py              # Main training script
│   ├── export_tflite.py      # TFLite conversion
│   ├── validate_tflite.py    # Model validation
│   ├── test_and_visualize.py # Testing utilities
│   ├── waste_classifier_best_dynamic.tflite # Exported model
│   └── models/               # Trained models (gitignored)
├── object_detection/         # Active object detection model
│   ├── README.md             # Detailed documentation
│   ├── config.py             # Detection configuration
│   ├── train_detector.py     # Training script
│   ├── export_tflite.py      # TFLite export
│   ├── test_visualize.py     # Testing and visualization
│   └── models/               # Trained detection models
├── dataset_utils.py          # Shared dataset utilities
├── requirements.txt          # Python dependencies
├── pyproject.toml            # Python project metadata
├── prepare_datasets.sh       # Dataset preparation script
├── merged_dataset/           # Consolidated dataset (generated)
├── raw_datasets/             # Downloaded Kaggle datasets
├── repr_samples/             # Representative samples for quantization
├── yolo_labels.csv           # Generated bounding box annotations
└── notebooks/                # Jupyter notebooks for exploration
```

## 📚 Resources

- [Object Detection README](./object_detection/README.md)
- [TensorFlow Lite Guide](https://www.tensorflow.org/lite/guide)
- [MobileNetV3 Paper](https://arxiv.org/abs/1905.02244)
- [Model Optimization Toolkit](https://www.tensorflow.org/model_optimization)

---

**Last Updated:** December 1, 2025
