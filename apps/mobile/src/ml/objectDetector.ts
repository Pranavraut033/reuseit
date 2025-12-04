import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

import { initTensorflow } from './tensorflow';

export interface DetectionResult {
  bbox: number[]; // [x1, y1, x2, y2] normalized coordinates
  class: number[]; // Class probabilities for waste categories
}

export interface ObjectDetectionResult {
  detections: DetectionResult[];
  confidence: number;
}

// Labels matching the trained model (8 canonical waste classes)
// Note: Currently not used in object detection output, but kept for reference
const _labels = [
  'paper_cardboard',
  'glass',
  'recyclables',
  'bio_waste',
  'textile_reuse',
  'electronics',
  'battery',
  'residual_waste',
];

// Image preprocessing constants for object detection model
export const IMAGE_SIZE = 224; // Model expects 224x224 input (matches training config)
const MAX_BOXES = 10; // Maximum number of detections per image
const NUM_CLASSES = 8; // Number of waste categories
const CONFIDENCE_THRESHOLD = 0.3; // Minimum confidence to include detection

let model: TensorflowModel | null = null;

async function loadModel() {
  if (model) return model;

  await initTensorflow();

  try {
    // Load the object detection TFLite model from assets
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const modelSource = require('@/assets/model/waste_object_detector_model.tflite');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    model = await loadTensorflowModel(modelSource);
    console.warn('Object detection TFLite model loaded successfully');
  } catch (error) {
    console.error('Failed to load object detection TFLite model:', error);
    throw new Error('Model loading failed');
  }

  return model;
}

async function preprocessImage(imageUri: string): Promise<Float32Array> {
  try {
    // Resize image to 320x320 using expo-image-manipulator
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: IMAGE_SIZE, height: IMAGE_SIZE } }],
      { format: SaveFormat.JPEG, compress: 1.0 },
    );

    // Read the resized image as base64
    const base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: 'base64',
    });

    console.warn('Preprocessed image base64 length:', base64?.length);
    if (!base64) {
      throw new Error('Failed to convert image to base64');
    }

    // Decode JPEG
    const rawData = Buffer.from(base64, 'base64');
    const jpegData = jpeg.decode(rawData, { useTArray: true });

    console.warn('JPEG decoded - width:', jpegData.width, 'height:', jpegData.height);

    // Convert RGBA to RGB and normalize to [0, 1]
    // Model expects: pixel values normalized to [0, 1]
    // Format: [batch=1, height, width, channels]
    const data = new Float32Array(1 * IMAGE_SIZE * IMAGE_SIZE * 3);
    const pixels = jpegData.data; // Uint8Array RGBA

    for (let i = 0; i < IMAGE_SIZE * IMAGE_SIZE; i++) {
      // Extract RGB, normalize to [0, 1]
      const r = pixels[i * 4] / 255.0;
      const g = pixels[i * 4 + 1] / 255.0;
      const b = pixels[i * 4 + 2] / 255.0;
      data[i * 3] = r;
      data[i * 3 + 1] = g;
      data[i * 3 + 2] = b;
    }

    console.warn('First 10 preprocessed values:', Array.from(data.slice(0, 30)));

    // Find min/max for validation
    let min = data[0];
    let max = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    console.warn('Preprocessed image - min:', min, 'max:', max);
    return data;
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    throw error;
  }
}

export async function detectObjects(uri: string): Promise<ObjectDetectionResult> {
  const loadedModel = await loadModel();

  if (!loadedModel) {
    throw new Error('Model not loaded');
  }

  try {
    // Preprocess image
    const inputData = await preprocessImage(uri);

    console.warn('Input data shape:', inputData.length, 'Expected:', IMAGE_SIZE * IMAGE_SIZE * 3);
    console.warn('Input data first 10:', Array.from(inputData.slice(0, 10)));

    // Check if image is almost all black (or white) to avoid meaningless detections
    const mean = inputData.reduce((sum, val) => sum + val, 0) / inputData.length;
    if (mean < 0.01 || mean > 0.99) {
      return { detections: [], confidence: 0 };
    }

    // Run inference
    const outputs = await loadedModel.run([inputData]);

    // The model outputs two tensors: bbox, class
    // bbox: [MAX_BOXES, 4], class: [MAX_BOXES, NUM_CLASSES]
    if (outputs.length !== 2) {
      throw new Error(`Expected 2 outputs, got ${outputs.length}`);
    }

    const bboxOutput = outputs[0]; // Bounding boxes
    const classOutput = outputs[1]; // Class probabilities

    console.warn('bbox output length:', bboxOutput.length);
    console.warn('class output length:', classOutput.length);

    // Convert outputs to arrays
    const bboxArray: number[] = Array.from(bboxOutput as unknown as ArrayLike<number>);
    const classArray: number[] = Array.from(classOutput as unknown as ArrayLike<number>);

    console.warn('bbox values (first 10):', bboxArray.slice(0, 10));
    console.warn('class probabilities (first 10):', classArray.slice(0, 10));

    // Parse multiple detections
    const detections: DetectionResult[] = [];
    let maxConfidence = 0;

    for (let i = 0; i < MAX_BOXES; i++) {
      const bboxStart = i * 4;
      const classStart = i * NUM_CLASSES;

      // Extract bbox [x1, y1, x2, y2]
      const bbox = bboxArray.slice(bboxStart, bboxStart + 4);

      // Extract class probabilities
      const classProbs = classArray.slice(classStart, classStart + NUM_CLASSES);

      // Calculate confidence as max class probability
      const confidence = Math.max(...classProbs);

      // Only include detections above confidence threshold
      if (confidence >= CONFIDENCE_THRESHOLD) {
        detections.push({
          bbox,
          class: classProbs,
        });

        if (confidence > maxConfidence) {
          maxConfidence = confidence;
        }
      }
    }

    const result: ObjectDetectionResult = {
      detections,
      confidence: maxConfidence,
    };

    console.warn(`Parsed ${detections.length} detections above threshold ${CONFIDENCE_THRESHOLD}`);

    return result;
  } catch (error) {
    console.error('Object detection failed:', error);
    throw new Error('Object detection failed');
  }
}

export async function warmup() {
  await loadModel();
}
