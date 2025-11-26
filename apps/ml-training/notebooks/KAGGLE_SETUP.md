# Kaggle Kernels Training Setup for Waste Classification

## Setup Instructions

### 1. Create Kaggle Account & API Key
- Go to [kaggle.com](https://kaggle.com) and create account
- Go to Account → Create New API Token
- Download `kaggle.json`
- Keep this file safe (contains your credentials)

### 2. Create New Kaggle Notebook
- Click "New Notebook" on Kaggle
- Name it "Waste Classification Training"
- Set accelerator to GPU (P100 available - 16GB VRAM)

### 3. Add Datasets as Input
In the notebook, click "Add Data" and search for:
- `garbage-classification` (by asdasdasasdas)
- `new-trash-classfication-dataset` (by glhdamar)  
- `realwaste` (by joebeachcapital)
- `garbage-classification` (by mostafaabla)
- `garbage-classification` (by karansolanki01)
- `garbage-classification-v2` (by sumn2u)

Add all these datasets to your notebook. They will be available at `/kaggle/input/`

### 4. Setup Code
Create cells in your notebook:

#### Cell 1: Install dependencies
```python
!pip install rich scikit-learn tensorflow-addons
```

#### Cell 2: Upload code files
Upload `kaggle_train.py`, `config.py`, `dataset_utils.py` to your Kaggle notebook (use the upload button)

#### Cell 3: Run training
```python
# Run with GPU acceleration
!python kaggle_train.py --epochs 15 --batch-size 64
```

## Advantages of Kaggle
- **Free P100 GPU** (16GB VRAM - better than Colab's T4)
- **30 hours/week** of GPU time
- **Datasets pre-loaded** - no download time
- **Easy sharing** of trained models
- **Competitions integration** if you want to compete later

## Expected Performance
- 15 epochs should complete in ~20-40 minutes
- First epoch accuracy should be >0.3 (much better than 0.14)
- Final accuracy should reach 0.7-0.8

## Downloading Results
After training completes:
- Go to the Output tab in your notebook
- Download the `models/` folder containing your trained model
- The model files will be in `run_YYYYMMDD_HHMMSS/` subfolder

## Troubleshooting
- If you get memory errors, reduce batch_size to 32
- If datasets don't load, check the exact names in `/kaggle/input/`
- GPU should be automatically enabled when you set accelerator to GPU

The script will automatically copy datasets from `/kaggle/input/` to working directory and train with all our optimizations!