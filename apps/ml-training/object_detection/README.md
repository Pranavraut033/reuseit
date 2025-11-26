# Object Detection Model for Waste Classification

This folder contains an object detection model that identifies recyclable waste items with edge detection capabilities.

## Features

- **Object Detection**: Detects waste items in images with bounding box localization
- **Classification**: Classifies detected objects into waste categories (plastic, glass, metal, etc.)
- **Edge Detection**: Provides edge masks for detected objects using Canny edge detection
- **Mobile-Ready**: Exports to TensorFlow Lite for deployment on mobile devices

## Model Architecture

The model uses a multi-task learning approach with three output heads:

1. **Bounding Box Head**: Predicts object location (x_min, y_min, x_max, y_max)
2. **Classification Head**: Predicts waste category with softmax activation
3. **Edge Detection Head**: Generates pixel-wise edge masks using U-Net style upsampling

**Backbone**: MobileNetV2 (pre-trained on ImageNet)

## Files

- `train_detector.py`: Training script for the object detection model
- `export_tflite.py`: Export trained model to TensorFlow Lite format
- `test_visualize.py`: Test and visualize model predictions

## Installation

Ensure you have the required dependencies:

```bash
pip install tensorflow opencv-python matplotlib rich numpy
```

## Usage

### 1. Train the Model

Train on the existing waste classification dataset:

```bash
cd apps/ml-training
python object_detection/train_detector.py \
    --dataset merged_dataset \
    --output object_detection/models \
    --epochs 50 \
    --batch-size 16
```

**Arguments**:
- `--dataset`: Path to dataset directory (default: `merged_dataset`)
- `--output`: Output directory for trained models (default: `object_detection/models`)
- `--epochs`: Number of training epochs (default: 50)
- `--batch-size`: Batch size (default: 16)
- `--image-size`: Input image size (default: 320)
- `--learning-rate`: Learning rate (default: 1e-4)

The model will be saved in `object_detection/models/detector_run_TIMESTAMP/`:
- `best_model.keras`: Best model based on validation loss
- `final_model.keras`: Final model after all epochs
- `metadata.json`: Training metadata and metrics
- `training_log.csv`: Training history

### 2. Export to TensorFlow Lite

Convert the trained model to TFLite for mobile deployment:

```bash
python object_detection/export_tflite.py \
    object_detection/models/detector_run_TIMESTAMP/best_model.keras \
    --quantize \
    --export-info
```

**Arguments**:
- `model_path`: Path to trained Keras model (required)
- `--output`: Output path for TFLite model (default: same directory as input)
- `--quantize`: Apply INT8 quantization for smaller model size
- `--dataset`: Dataset directory for representative samples (default: `merged_dataset`)
- `--export-info`: Export model architecture and metadata

This generates:
- `.tflite` file (quantized or float32)
- `model_summary.txt`: Model architecture
- `model_info.json`: Model metadata

### 3. Test and Visualize

Test the model on images:

**Single image**:
```bash
python object_detection/test_visualize.py \
    object_detection/models/detector_run_TIMESTAMP/best_model.keras \
    --image path/to/test_image.jpg \
    --output object_detection/test_results
```

**Directory of images**:
```bash
python object_detection/test_visualize.py \
    object_detection/models/detector_run_20251125_190926/best_model.keras \
    --dir merged_dataset/plastic \
    --output object_detection/test_results \
    --max-images 10
```

**Test TFLite model**:
```bash
python object_detection/test_visualize.py \
    object_detection/models/detector_run_TIMESTAMP/best_model_quantized.tflite \
    --image path/to/test_image.jpg
```

**Arguments**:
- `model_path`: Path to model (.keras or .tflite)
- `--image`: Path to single test image
- `--dir`: Directory containing test images
- `--output`: Output directory for visualizations (default: `object_detection/test_results`)
- `--max-images`: Maximum images to test from directory (default: 10)
- `--no-show`: Don't display visualizations, only save

## Model Outputs

The model produces three outputs:

1. **bbox**: Bounding box coordinates `[x_min, y_min, x_max, y_max]` (normalized 0-1)
2. **class**: Class probabilities for all waste categories (softmax)
3. **edges**: Edge detection mask (H x W x 1) with values 0-1

## Mobile Integration

To use the TFLite model in the ReUseIt mobile app:

1. Copy the `.tflite` file to `apps/mobile/assets/models/`
2. Load the model using TensorFlow Lite interpreter
3. Preprocess images to shape `(1, 320, 320, 3)` with float32 values [0, 1]
4. Run inference and get the three outputs
5. Post-process results:
   - Denormalize bounding box coordinates
   - Get predicted class from argmax of class probabilities
   - Threshold edge mask at 0.5

Example React Native code:
```javascript
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Load model
const model = await tf.loadLayersModel(
  bundleResourceIO(modelJson, modelWeights)
);

// Preprocess image
const imageTensor = tf.browser.fromPixels(image)
  .resizeBilinear([320, 320])
  .div(255.0)
  .expandDims(0);

// Run inference
const predictions = model.predict(imageTensor);

// Get outputs
const bbox = predictions['bbox'].dataSync();
const classes = predictions['class'].dataSync();
const edges = predictions['edges'].dataSync();
```

## Training Notes

### Synthetic Bounding Boxes

Since the original dataset doesn't have bounding box annotations, the training script generates synthetic boxes. For production use, you should:

1. Use a proper annotation tool (like LabelImg or CVAT) to annotate bounding boxes
2. Store annotations in COCO or PASCAL VOC format
3. Modify the data loading pipeline to read real annotations

### Model Performance

The model is trained with:
- **Input size**: 320x320 (optimized for mobile)
- **Multi-task loss**: Combination of bbox MSE, classification cross-entropy, and edge BCE
- **Augmentation**: Random flips, brightness, contrast, saturation, and hue adjustments

Expected performance metrics:
- Classification accuracy: ~85-90% (similar to base classifier)
- Bounding box IoU: Depends on annotation quality
- Edge detection: Good for objects with clear boundaries

## Limitations

1. **Synthetic bboxes**: Current implementation uses synthetic bounding boxes for demonstration
2. **Single object**: Model predicts one bounding box per image (can be extended to multi-object)
3. **Edge detection**: Simple Canny-based approach (could be improved with learned edges)

## Future Improvements

- [ ] Add support for multi-object detection (e.g., using anchor boxes or YOLO-style grid)
- [ ] Implement proper dataset with real bounding box annotations
- [ ] Use focal loss for better classification with class imbalance
- [ ] Add non-maximum suppression (NMS) for overlapping detections
- [ ] Implement attention mechanisms for better edge detection
- [ ] Add instance segmentation for precise object boundaries

## References

- MobileNetV2: https://arxiv.org/abs/1801.04381
- U-Net for edge detection: https://arxiv.org/abs/1505.04597
- TensorFlow Lite: https://www.tensorflow.org/lite

## License

Part of the ReUseIt project.
