# ReUseIt ML Training Pipeline

This directory contains the machine learning training pipeline for the waste classification model used in the ReUseIt mobile application.

## 🎯 Overview

The ML training pipeline:
- Downloads and consolidates multiple Kaggle datasets
- Trains a MobileNetV3 model for waste classification
- Exports optimized TFLite models for mobile deployment
- Validates model accuracy and performance

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

### Training

```bash
# List available training runs
python train.py --list-runs

# Train with default settings (15 epochs, MobileNetV3Large)
python train.py

# Train with custom settings
python train.py --epochs 20 --batch-size 32 --fine-tune-from 100

# Train with specific datasets
python train.py --datasets asdasdasasdas/garbage-classification glhdamar/new-trash-classfication-dataset
```

### Export to TFLite

```bash
# Export latest trained model (recommended - uses concrete function method)
python export_tflite.py

# Export specific model
python export_tflite.py --model-path models/run_20251124_232532/waste_classifier_best.keras

# Export with INT8 quantization (requires representative samples)
python export_tflite.py --int8 --repr-dir repr_samples
```

### Validation

```bash
# Validate TFLite model
python validate_tflite.py --tflite-path waste_classifier_best_dynamic.tflite

# Test on specific images
python validate_tflite.py --test-images path/to/image1.jpg path/to/image2.jpg
```

## 📁 Directory Structure

```
apps/ml-training/
├── config.py                  # Training configuration
├── dataset_utils.py           # Dataset download and preprocessing
├── train.py                   # Main training script
├── export_tflite.py          # TFLite conversion (concrete function method) ✅
├── export_tflite_old.py      # Old conversion method (deprecated)
├── validate_tflite.py        # Model validation
├── test.py                   # Quick testing utilities
├── requirements.txt          # Python dependencies
├── .python-version           # Python 3.10.x
├── pyproject.toml            # Python project metadata
├── models/                   # Trained models (gitignored)
│   ├── run_YYYYMMDD_HHMMSS/  # Training run directory
│   │   ├── waste_classifier_best.keras
│   │   ├── training_metadata.json
│   │   └── logs/             # TensorBoard logs
│   └── latest -> run_XXX     # Symlink to latest run
├── merged_dataset/           # Consolidated dataset (gitignored)
├── raw_datasets/             # Downloaded Kaggle datasets (gitignored)
└── repr_samples/             # Representative samples for quantization
```

## 🔧 Configuration Options

### Training Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--epochs` | 15 | Number of training epochs |
| `--batch-size` | 32 | Training batch size |
| `--image-size` | 224 | Input image size (224x224) |
| `--validation-split` | 0.2 | Validation data percentage |
| `--fine-tune-from` | 0 | Layer to start fine-tuning from (0 = all layers) |
| `--mixed-precision` | False | Enable mixed precision training |
| `--no-class-weights` | False | Disable class weighting for imbalanced data |
| `--brightness-factor` | 0.1 | Brightness augmentation factor |
| `--contrast-factor` | 0.1 | Contrast augmentation factor |

### Export Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--model-path` | Latest | Path to .keras model to convert |
| `--output` | Auto-generated | Output TFLite file path |
| `--int8` | False | Enable INT8 quantization |
| `--repr-dir` | repr_samples | Directory with representative samples |

## 🐛 Known Issues & Solutions

### Issue: TFLite Export LLVM Error

**Problem:** Original export script failed with `LLVM ERROR: Failed to infer result type(s)` on MobileNetV3 models.

**Solution:** ✅ Fixed! The new `export_tflite.py` uses the concrete function conversion method instead of direct Keras model conversion. This provides better compatibility with MobileNetV3 architecture.

**Technical Details:**
- Old method: `TFLiteConverter.from_keras_model()` → Failed with LLVM error
- New method: `TFLiteConverter.from_concrete_functions()` → Works correctly
- Model size reduced from 15MB to 2.7MB with dynamic range quantization

### Issue: Training Segfault on M1/M2 Macs

**Problem:** Training crashes with segmentation fault due to TensorFlow/Metal compatibility issues.

**Workaround:**
1. Use CPU-only mode (slower but stable):
   ```bash
   CUDA_VISIBLE_DEVICES="" python train.py
   ```
2. Train on Linux/Windows with CUDA
3. Use Google Colab for training

## 📊 Model Performance

Latest model (`waste_classifier_best_dynamic.tflite`):
- **Size:** 2.7 MB
- **Quantization:** Dynamic range (float32 → int8 weights)
- **Input:** 224x224x3 float32 images
- **Output:** 8-class probabilities (float32)
- **Inference Speed:** ~50-100ms on mobile devices

## 🔄 Deployment

After training and export:

```bash
# Copy model to all required locations
cp waste_classifier_best_dynamic.tflite ../../../waste_classifier.tflite
cp waste_classifier_best_dynamic.tflite ../../backend/waste_classifier.tflite
cp waste_classifier_best_dynamic.tflite ../../mobile/assets/waste_classifier.tflite
```

Or use the automated script:
```bash
# From monorepo root
./scripts/update-tflite-model.sh apps/ml-training/waste_classifier_best_dynamic.tflite
```

## 📚 Resources

- [TensorFlow Lite Guide](https://www.tensorflow.org/lite/guide)
- [MobileNetV3 Paper](https://arxiv.org/abs/1905.02244)
- [Model Optimization Toolkit](https://www.tensorflow.org/model_optimization)

## 🛠️ Troubleshooting

### Kaggle API Not Working

Ensure `kaggle.json` is in the correct location:
```bash
mkdir -p ~/.kaggle
cp kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

### Out of Memory During Training

Reduce batch size:
```bash
python train.py --batch-size 16
```

### Model Not Converging

Try these adjustments:
1. Increase epochs: `--epochs 25`
2. Fine-tune more layers: `--fine-tune-from 50`
3. Adjust learning rate in `train.py`
4. Enable mixed precision: `--mixed-precision`

## 📝 Notes

- The concrete function export method (`export_tflite.py`) is recommended over the old method
- Representative samples are generated during training for potential INT8 quantization
- Training metadata is saved in each run directory for reproducibility
- TensorBoard logs are available in `models/run_XXX/logs/`

---

**Last Updated:** November 25, 2025
**Model Version:** v1.0 (2.7MB optimized)
