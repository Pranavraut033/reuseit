# YOLOv8 Waste Object Detection Training Pipeline

This directory contains a complete pipeline for training YOLOv8 object detection models for waste classification, optimized for mobile deployment.

## 🚀 Quick Start

```bash
# 1. Prepare dataset
python auto_label_yolo.py --input ../merged_dataset --output-dataset dataset

# 2. Train model
python train_yolo_detector.py --epochs 100 --batch 16

# 3. Export to TFLite
python export_to_tflite.py --weights training_results/waste_detector/weights/best.pt
```

## 📁 Dataset Preparation

### Option 1: Auto-labeling with Pre-trained YOLO

Generate bounding boxes automatically using a pre-trained YOLO model:

```bash
python auto_label_yolo.py \
  --input ../merged_dataset \
  --output-csv yolo_labels.csv \
  --output-dataset dataset \
  --model yolov8n.pt \
  --confidence-threshold 0.5
```

**CSV Format:** The generated CSV includes relative paths from the input directory:

```
filename,x_center,y_center,width,height,confidence,class_id
paper_cardboard/image1.jpg,0.5,0.5,0.8,0.6,0.85,39
glass/image2.jpg,0.3,0.7,0.4,0.5,0.72,41
```

### Option 2: Convert Existing Annotations

If you have existing CSV or JSON annotations:

```bash
# From CSV
python auto_label_yolo.py \
  --convert-csv existing_labels.csv \
  --input ../merged_dataset \
  --output-dataset dataset

# From JSON (COCO format)
python auto_label_yolo.py \
  --convert-json annotations.json \
  --input ../merged_dataset \
  --output-dataset dataset
```

### Option 3: Classification to Detection

Convert classification dataset to detection format (full-image bounding boxes):

```bash
python -c "
from dataset_utils_yolo import prepare_yolo_dataset
prepare_yolo_dataset('../merged_dataset', 'dataset')
"
```

## 🏃 Training

Train YOLOv8n model with default settings:

```bash
python train_yolo_detector.py
```

### Advanced Training Options

```bash
python train_yolo_detector.py \
  --model yolov8s.pt \
  --epochs 200 \
  --imgsz 640 \
  --batch 32 \
  --project my_training \
  --name experiment_1 \
  --evaluate \
  --confusion-matrix
```

### Resume Training

```bash
python train_yolo_detector.py --resume training_results/waste_detector/weights/last.pt
```

## 📱 Export to TFLite

Export trained model for mobile deployment:

```bash
python export_to_tflite.py --weights training_results/waste_detector/weights/best.pt
```

### Step-by-Step Export

```bash
# Export to ONNX only
python export_to_tflite.py --weights best.pt --onnx-only

# Convert ONNX to SavedModel
python export_to_tflite.py --onnx model.onnx --savedmodel-only

# Convert SavedModel to TFLite
python export_to_tflite.py --savedmodel model_savedmodel --tflite-only
```

## 🧪 Testing TFLite Model

### Python Testing

```python
import tensorflow as tf
import numpy as np
from PIL import Image

# Load model
interpreter = tf.lite.Interpreter(model_path="model_fp16.tflite")
interpreter.allocate_tensors()

# Get input/output details
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Load and preprocess image
image = Image.open("test_image.jpg").resize((640, 640))
input_data = np.array(image, dtype=np.float32) / 255.0
input_data = np.expand_dims(input_data, axis=0)

# Run inference
interpreter.set_tensor(input_details[0]['index'], input_data)
interpreter.invoke()

# Get results
output_data = interpreter.get_tensor(output_details[0]['index'])
print("Detections:", output_data.shape)
```

## 📊 Visualization

### Visualize CSV Labels

After running auto-labeling, visualize the generated bounding boxes:

```bash
# Visualize CSV labels on original images (shows COCO class names like 'bottle', 'person')
python visualize_yolo_labels.py --csv yolo_labels.csv --images ../merged_dataset --output visualized_csv

# Visualize with confidence threshold
python visualize_yolo_labels.py --csv yolo_labels.csv --images ../merged_dataset --min-confidence 0.5 --max-images 20

# Show images during processing
python visualize_yolo_labels.py --csv yolo_labels.csv --images ../merged_dataset --show
```

**Note:** CSV files now store filenames with relative paths (e.g., `paper_cardboard/image1.jpg`) to preserve folder structure information.

### Visualize Prepared Dataset

After preparing the YOLO dataset, visualize the final labels:

```bash
# Visualize training set (shows waste class names: paper_cardboard, glass, etc.)
python visualize_yolo_labels.py --dataset yolo_dataset --split train --output visualized_train

# Visualize validation set
python visualize_yolo_labels.py --dataset yolo_dataset --split val --output visualized_val

# Visualize test set
python visualize_yolo_labels.py --dataset yolo_dataset --split test --output visualized_test
```

### Visualization Features

- **Class name mapping**: CSV files show COCO class names (YOLO detections like 'bottle', 'person'), dataset files show waste class names
- **Color-coded bounding boxes** for different classes
- **Confidence scores** displayed on boxes (for CSV data)
- **Batch processing** with progress indication
- **Interactive display** option for inspection
- **Output directory** organization

## 📱 Mobile Integration

### React Native (Expo)

1. **Install dependencies:**

```bash
npx expo install expo-gl expo-gl-cpp tensorflow/tfjs @tensorflow/tfjs-tflite
```

2. **Load model:**

```typescript
import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const model = await tflite.loadTFLiteModel(
  bundleResourceIO(require('./assets/model_fp16.tflite'), 'model_fp16.tflite'),
);
```

3. **Run inference:**

```typescript
const imageTensor = tf.browser
  .fromPixels(imageData)
  .resizeBilinear([640, 640])
  .div(255.0)
  .expandDims(0);
const predictions = await model.predict(imageTensor);
const results = await predictions.data();
```

### Android (Java/Kotlin)

1. **Add to build.gradle:**

```gradle
dependencies {
    implementation 'org.tensorflow:tensorflow-lite:2.12.0'
    implementation 'org.tensorflow:tensorflow-lite-gpu:2.12.0'  // Optional GPU acceleration
}
```

2. **Load model:**

```kotlin
val tflite = Interpreter(FileUtil.loadMappedFile(context, "model_fp16.tflite"))
```

3. **Run inference:**

```kotlin
val inputBuffer = ByteBuffer.allocateDirect(4 * 640 * 640 * 3).order(ByteOrder.nativeOrder())
val outputBuffer = Array(1) { Array(25200) { FloatArray(8) } }  // Adjust based on model output

tflite.run(inputBuffer, outputBuffer)
```

### iOS (Swift)

1. **Add TensorFlow Lite pod:**

```ruby
pod 'TensorFlowLiteSwift'
```

2. **Load model:**

```swift
let modelPath = Bundle.main.path(forResource: "model_fp16", ofType: "tflite")!
let interpreter = try Interpreter(modelPath: modelPath)
```

3. **Run inference:**

```swift
let inputData = Data(bytes: imageBuffer, count: 640 * 640 * 3 * 4)
try interpreter.allocateTensors()
try interpreter.copy(inputData, toInputAt: 0)
try interpreter.invoke()
let outputTensor = try interpreter.output(at: 0)
```

## 📊 Model Classes

The model detects 8 waste categories:

| Class ID | Category        | Description                |
| -------- | --------------- | -------------------------- |
| 0        | paper_cardboard | Paper, cardboard, cartons  |
| 1        | glass           | Glass bottles, jars        |
| 2        | recyclables     | Metal, plastic containers  |
| 3        | bio_waste       | Food waste, organic matter |
| 4        | textile_reuse   | Clothes, fabrics           |
| 5        | electronics     | Electronic waste           |
| 6        | battery         | Batteries                  |
| 7        | residual_waste  | Non-recyclable waste       |

## 🔧 Configuration

### data.yaml

```yaml
path: .
train: images/train
val: images/val
test: images/test

names:
  0: paper_cardboard
  1: glass
  2: recyclables
  3: bio_waste
  4: textile_reuse
  5: electronics
  6: battery
  7: residual_waste
```

### Training Parameters

- **Model:** YOLOv8n (nano) - fastest, smallest
- **Image Size:** 640x640 pixels
- **Batch Size:** 16 (adjust based on GPU memory)
- **Epochs:** 100-200 (monitor validation loss)
- **Optimizer:** SGD with momentum
- **Learning Rate:** Auto-scaling

## 🚀 Performance Optimization

### Model Size Reduction

1. **Use smaller model:** yolov8n.pt instead of yolov8x.pt
2. **FP16 quantization:** Reduces size by ~50%
3. **Post-training quantization:** Additional size reduction

### Inference Optimization

1. **GPU acceleration:** Enable GPU delegate on mobile
2. **Input preprocessing:** Resize and normalize efficiently
3. **Batch processing:** Process multiple images together
4. **Model pruning:** Remove unused operations

## 🐛 Troubleshooting

### Common Issues

1. **Out of memory during training:**
   - Reduce batch size
   - Use smaller image size (416 instead of 640)
   - Enable mixed precision training

2. **Poor detection accuracy:**
   - Increase epochs
   - Use larger model (yolov8s.pt)
   - Improve dataset quality
   - Add more data augmentation

3. **TFLite export fails:**
   - Ensure TensorFlow 2.x is installed
   - Check model compatibility
   - Try different export options

4. **Mobile inference slow:**
   - Use FP16 quantized model
   - Enable GPU acceleration
   - Optimize input preprocessing

### Validation

Check model performance:

```bash
python train_yolo_detector.py --evaluate --confusion-matrix
```

## 📈 Expected Results

- **Training time:** 2-4 hours on GPU, 8-12 hours on CPU
- **Model size:** ~5-15 MB (FP16 quantized)
- **mAP@0.5:** 0.7-0.9 (depending on dataset quality)
- **Inference time:** 50-200ms on mobile GPU

## 🤝 Contributing

1. Test changes on sample data first
2. Update documentation for new features
3. Validate mobile compatibility
4. Follow existing code style

## 📄 License

This pipeline is part of the ReUseIt project. See main project license for details.
