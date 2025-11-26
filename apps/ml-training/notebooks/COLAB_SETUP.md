# Google Colab Training Setup for Waste Classification

## Setup Instructions

1. **Open Google Colab**: Go to [colab.research.google.com](https://colab.research.google.com)

2. **Create New Notebook**: Click "New Notebook"

3. **Change Runtime to GPU**: 
   - Runtime → Change runtime type
   - Hardware accelerator: GPU
   - Save

4. **Upload Files**:
   - Upload `colab_train.py`, `config.py`, `dataset_utils.py` to Colab
   - Or copy the code into cells

5. **Setup Kaggle API**:
   ```python
   # Install dependencies
   !pip install kaggle rich scikit-learn tensorflow-addons

   # Upload kaggle.json
   from google.colab import files
   files.upload()  # Upload your kaggle.json file

   # Setup Kaggle
   !mkdir -p ~/.kaggle
   !cp kaggle.json ~/.kaggle/
   !chmod 600 ~/.kaggle/kaggle.json
   ```

6. **Optional: Mount Google Drive** (for saving models):
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```

7. **Run Training**:
   ```python
   # Upload the Python files first, then:
   !python colab_train.py --epochs 10 --batch-size 64
   ```

## Notes

- Colab has 12GB RAM limit, so use batch_size=32-64
- Training will be much faster with GPU (T4/P100)
- Models will be saved in `models/` folder
- You can download the trained model files after training

## Alternative: Kaggle Kernels

If you prefer Kaggle:

1. Go to [kaggle.com](https://kaggle.com)
2. Create new Notebook
3. Add the datasets as input data
4. Copy the code and adjust paths to `/kaggle/input/`

Kaggle also provides free GPU time.