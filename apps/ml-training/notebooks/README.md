# Waste Classification Model Training

This module trains a TensorFlow / TensorFlow Lite model for waste classification aligned with German waste-sorting standards. It consolidates multiple Kaggle datasets into 8 canonical classes optimized for both ML performance and practical recycling/donation categories.

## Datasets

Consolidated from these Kaggle datasets:

1. `mostafaabla/garbage-classification` - Includes split glass types and extra categories
2. `karansolanki01/garbage-classification` - Battery, Cardboard, Clothes, Glass, Metal, Paper, Plastic
3. `sumn2u/garbage-classification-v2` - Metal, Glass, Biological, Paper, Battery, Trash, Cardboard, Shoes, Clothes, Plastic
4. `glhdamar/new-trash-classfication-dataset` - Plastic, Paper, Metal, Glass, Organic, E-waste, Textile, Trash
5. `joebeachcapital/realwaste` - Cardboard, Food Organics, Glass, Metal, Miscellaneous Trash, Paper, Plastic, Textile Trash, Vegetation
6. `asdasdasasdas/garbage-classification` - Additional dataset for broader coverage

## Canonical Classes (German-Aligned, Merged)

Optimized 8-class system for better ML performance and practical deployment:

- `paper_cardboard` → Papier/Pappe (Papier stream) - paper + cardboard
- `glass` → Glas (Glas stream) - all glass variants (brown/green/white)
- `recyclables` → Wertstoffe (Wertstoffe stream) - plastic + metal
- `bio_waste` → Bioabfall (Bio stream) - organic/biological/vegetation/food organics
- `textile_reuse` → Textilien (Textilien stream) - clothes + shoes (donation perspective)
- `electronics` → Elektroschrott (Sonderabfall stream) - e-waste only
- `battery` → Batterien (Sonderabfall stream) - batteries only
- `residual_waste` → Restmüll (Restmüll stream) - everything else (trash + miscellaneous)

**Key Improvements:**
- Merged similar classes for better ML performance
- Clear recycling vs. donation distinction for textiles
- Separate electronics and battery categories for proper hazardous waste handling
- Reduced class count from 11 to 8 for improved accuracy

## Dataset Preparation

### Download & Consolidate
```bash
python -c "
from dataset_utils import ensure_kaggle_download, consolidate_datasets, DATASET_SLUGS
raw_dir = 'raw_datasets'
merged_dir = 'merged_dataset'
eds = ensure_kaggle_download(DATASET_SLUGS, raw_dir)
consolidate_datasets(eds, merged_dir)
"
```

### Build Dataset Index
Creates `dataset_index.json` for easy dataset inspection and updates:
```bash
python -c "
from dataset_utils import build_dataset_index
build_dataset_index('merged_dataset', 'dataset_index.json')
"
```

The index JSON includes per-image metadata (source dataset, original label, German mapping) and class statistics.

## Output
- Keras model: `models/run_YYYYMMDD_HHMMSS/waste_classifier.keras`
- Best checkpoint: `models/run_YYYYMMDD_HHMMSS/waste_classifier_best.keras`
- SavedModel: `models/run_YYYYMMDD_HHMMSS/waste_classifier/`
- TFLite (dynamic range): `waste_classifier_dynamic.tflite`
- TFLite (int8 full): `waste_classifier_int8.tflite` (requires representative dataset)
- Training metadata: `training_metadata.json`
- Class weights: `class_weights.json`
- Labels: `labels.json`

## Setup
```bash
cd apps/ml-training
pyenv local 3.10.14   # or ensure system Python 3.10.x
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Kaggle Credentials
Place `kaggle.json` in `~/.kaggle/` with API key (https://www.kaggle.com/docs/api). Then:
```bash
chmod 600 ~/.kaggle/kaggle.json
```

## Train

### Basic Training
```bash
python train.py --epochs 20 --batch-size 32
```

### Advanced Training with Fine-tuning
```bash
python train.py \
  --datasets mostafaabla/garbage-classification karansolanki01/garbage-classification sumn2u/garbage-classification-v2 glhdamar/new-trash-classfication-dataset joebeachcapital/realwaste asdasdasasdas/garbage-classification \
  --image-size 224 --epochs 25 --batch-size 32 \
  --fine-tune-from 100 --mixed-precision \
  --repr-samples 100 \
  --brightness-factor 0.1 --contrast-factor 0.1
```

### Key Features
- **Global Random Split**: 70% train, 15% validation, 15% test across all data (avoids per-dataset bias)
- **Class Weights**: Automatic inverse-frequency weighting for imbalanced classes (preferred over undersampling)
- **Enhanced Augmentation**: Configurable brightness/contrast jitter, proper MobileNetV2 preprocessing
- **Per-class Metrics**: Precision, recall, and F1 scores for each class
- **Early Stopping**: Patience-based with best model restoration
- **Reproducibility**: Fixed seeds, shuffle buffer > dataset size
- **TensorBoard**: Real-time monitoring at `models/run_*/logs/`

### Command Line Options
- `--epochs`: Number of training epochs (default: 15)
- `--batch-size`: Training batch size (default: 32)
- `--fine-tune-from`: Layer to start fine-tuning from (default: None, use 100 for better accuracy)
- `--mixed-precision`: Enable mixed precision training (default: False)
- `--repr-samples`: Number of representative samples for TFLite quantization (default: 100)
- `--brightness-factor`: Brightness augmentation factor (default: 0.1)
- `--contrast-factor`: Contrast augmentation factor (default: 0.1)
- `--no-class-weights`: Disable automatic class weighting
- `--list-runs`: List all previous training runs

## Troubleshooting
- **Metal Plugin Errors**: If you see MPS/Metal assertion failures, disable mixed precision and reduce batch size
- **Memory Issues**: Try smaller batch sizes (16 or 8) if training crashes
- **Slow Training**: Ensure `tensorflow-metal` is installed for GPU acceleration
- **Class Imbalance**: Automatic class weighting handles this, but very rare classes may need additional data

## Export to TFLite

### Auto-detect Latest Model
```bash
python export_tflite.py
```

### Dynamic Range Quantization
```bash
python export_tflite.py --model-path models/latest/waste_classifier.keras --output waste_classifier_dynamic.tflite
```

### Full INT8 Quantization
```bash
python export_tflite.py --model-path models/latest/waste_classifier.h5 \
  --output waste_classifier_int8.tflite --int8 --repr-dir repr_samples
```

## Test and Validate Models

### Keras Model Evaluation
```bash
python test_and_visualize.py --model-path models/latest/waste_classifier.keras \
  --merged-dir merged_dataset --output-dir results --num-samples 10
```

Generates:
- Confusion matrix plot (`results/confusion_matrix.png`)
- Sample predictions (`results/sample_predictions.png`)
- Detailed classification report with per-class metrics

### TFLite Model Validation
```bash
python validate_tflite.py --tflite-path waste_classifier_dynamic.tflite \
  --merged-dir merged_dataset --num-samples 50
```

Validates:
- Model loading and inference
- Per-class accuracy on dataset samples
- Individual image predictions
- Quantization compatibility

## Integration (Mobile App)

1. Copy `waste_classifier_int8.tflite` to `apps/mobile/assets/model/`
2. Copy `labels.json` alongside for class mapping
3. Load with TensorFlow Lite interpreter on-device
4. Use MobileNetV2 preprocessing: resize → normalize to [0,1] → `preprocess_input()`

## Performance Improvements

- **Preprocessing**: Resize first, augment on [0,1], then MobileNetV2 preprocess_input
- **Data Pipeline**: AUTOTUNE everywhere, shuffle buffer > dataset size
- **Augmentation**: Reduced aggressive jitter, configurable parameters
- **Training**: Class weights, early stopping, learning rate scheduling
- **Metrics**: Per-class precision/recall, confusion matrix logging

## Notes

- **Python Version**: 3.10.x required (see `.python-version` and `pyproject.toml`)
- **GPU Acceleration**: Apple Silicon via `tensorflow-metal`, NVIDIA via CUDA
- **Class Mapping**: Automatic remapping from 11 original classes to 8 canonical classes
- **Reproducibility**: Fixed random seeds ensure consistent results
- **Model Versioning**: Automatic timestamped directories with metadata
- **Dataset Bias**: Global random split prevents per-dataset overfitting
- **Memory Efficient**: No aggressive undersampling, uses class weights instead

## License & Data

Respect dataset licenses on Kaggle. Do not redistribute raw images in the repo.
