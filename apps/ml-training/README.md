# Waste Classification Model Training

This module trains a TensorFlow / TensorFlow Lite model for waste classification aligned with German waste-sorting standards. It consolidates multiple Kaggle datasets into canonical classes mapped to common German waste streams (Papier, Glas, Metall, Kunststoff, Bio, Restmüll, Sonderabfall, Textilien).

## Datasets

Consolidated from these Kaggle datasets:

1. `mostafaabla/garbage-classification` - Includes split glass types and extra categories (biological, battery, shoes, clothes)
2. `karansolanki01/garbage-classification` - Battery, Cardboard, Clothes, Glass, Metal, Paper, Plastic
3. `sumn2u/garbage-classification-v2` - Metal, Glass, Biological, Paper, Battery, Trash, Cardboard, Shoes, Clothes, Plastic
4. `glhdamar/new-trash-classfication-dataset` - Plastic, Paper, Metal, Glass, Organic, E-waste, Textile, Trash
5. `joebeachcapital/realwaste` - Cardboard, Food Organics, Glass, Metal, Miscellaneous Trash, Paper, Plastic, Textile Trash, Vegetation

## Canonical Classes (German-Aligned)

Mapped to German waste streams while preserving ML-useful distinctions:

- `cardboard` → Papier/Pappe (Papier stream)
- `paper` → Papier/Pappe (Papier stream, kept separate for granularity)
- `glass` → Glas (Glas stream, aggregates brown/green/white variants)
- `metal` → Metall (Metall stream)
- `plastic` → Kunststoff (Kunststoff stream)
- `biological` → Bioabfall (Bio stream, includes organic/vegetation/food organics)
- `trash` → Restmüll (Restmüll stream, includes miscellaneous trash)
- `battery` → Batterien (Sonderabfall stream)
- `e_waste` → Elektroschrott (Sonderabfall stream)
- `clothes` → Textilien (Textilien stream, includes textile trash)
- `shoes` → Schuhe (Textilien stream)

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
- Keras model: `models/waste_classifier.h5`
- SavedModel: `models/waste_classifier/`
- Quantized TFLite (dynamic range): `models/waste_classifier_dynamic.tflite`
- Quantized TFLite (int8 full, if representative dataset generated): `models/waste_classifier_int8.tflite`

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
For dynamic range TFLite (recommended for mixed precision models):
```bash
python train.py --datasets mostafaabla/garbage-classification karansolanki01/garbage-classification sumn2u/garbage-classification-v2 glhdamar/new-trash-classfication-dataset joebeachcapital/realwaste asdasdasasdas/garbage-classification\
  --image-size 224 --epochs 25 --batch-size 32 --model-dir models \
  --mixed-precision --fine-tune-from 50
```

For full int8 TFLite (train WITHOUT --mixed-precision):
```bash
python train.py --datasets mostafaabla/garbage-classification karansolanki01/garbage-classification sumn2u/garbage-classification-v2 glhdamar/new-trash-classfication-dataset joebeachcapital/realwaste asdasdasasdas/garbage-classification\
  --image-size 224 --epochs 25 --batch-size 32 --model-dir models \
  --fine-tune-from 50
```

**Note**: Mixed precision is disabled by default for Apple Silicon compatibility. Enable with `--mixed-precision` if you encounter no Metal plugin issues.

## Troubleshooting
- **Metal Plugin Errors**: If you see MPS/Metal assertion failures, disable mixed precision and reduce batch size
- **Memory Issues**: Try smaller batch sizes (16 or 8) if training crashes
- **Slow Training**: Ensure `tensorflow-metal` is installed for GPU acceleration

## Convert to TFLite
Dynamic range only:
```bash
python export_tflite.py --model-path models/waste_classifier.h5 --output models/waste_classifier_dynamic.tflite
```
Full int8 (requires model trained WITHOUT --mixed-precision flag):
```bash
python export_tflite.py --model-path models/waste_classifier.h5 \
  --output models/waste_classifier_int8.tflite --int8 --repr-dir repr_samples
```

## Test and Visualize Model
Evaluate model performance and generate visualizations:
```bash
python test_and_visualize.py --model-path models/waste_classifier.h5 \
  --merged-dir merged_dataset --output-dir results --num-samples 10
```

This will:
- Evaluate accuracy on test set (subset of merged dataset)
- Generate confusion matrix plot (`results/confusion_matrix.png`)
- Show sample predictions with images (`results/sample_predictions.png`)
- Print detailed classification report with precision/recall/f1 scores

**Note:** Uses canonical class labels from `dataset_utils.py` (may differ from `labels.json`).

## Integration (Mobile App)
Copy `models/waste_classifier_int8.tflite` into `apps/mobile/assets/model/` and load with TensorFlow Lite interpreter on-device. Ensure `labels.json` alongside model for index->class mapping (now includes German stream metadata).

## Notes
- Python version requirement: 3.10.x (see `.python-version` and `pyproject.toml`).
- Training can be GPU accelerated (Apple Silicon via `tensorflow-metal`).
- Adjust `--fine-tune-from` to unfreeze more layers for better accuracy (default: 50 layers).
- Early stopping and checkpointing are enabled by default.
- Classes are aligned with German waste-sorting standards for practical deployment.
- Use `dataset_index.json` to inspect dataset composition and class distributions.
- Raw labels are normalized case-insensitively (e.g., "Food Organics" → "biological").
- **Accuracy Improvements**: Enhanced augmentation, class weighting, deeper fine-tuning, and learning rate scheduling are implemented for better performance.
- **Class Imbalance**: Some classes (e.g., e_waste) have fewer samples. Consider collecting additional data for underrepresented classes.

## License & Data
Respect dataset licenses on Kaggle. Do not redistribute raw images in the repo.
