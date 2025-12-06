import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { type Frame } from 'react-native-vision-camera';
import { makeShareable } from 'react-native-worklets';

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
export const IMAGE_SIZE = 640; // Model expects 640x640 input for YOLO
const NUM_CLASSES = 8; // Number of waste categories
const CONFIDENCE_THRESHOLD = 0.3; // Minimum confidence to include detection

let model: TensorflowModel | null = null;

function preprocessFrame(frame: Frame): number[] {
  const buffer = frame.toArrayBuffer();
  const data = new Uint8Array(buffer);

  // Frame dimensions
  const frameWidth = frame.width;
  const frameHeight = frame.height;

  // Scale factors for downsampling
  const scaleX = frameWidth / IMAGE_SIZE;
  const scaleY = frameHeight / IMAGE_SIZE;

  // Convert RGBA to RGB and normalize, with downsampling
  const input: number[] = [];
  for (let i = 0; i < IMAGE_SIZE * IMAGE_SIZE; i++) {
    const x = Math.floor((i % IMAGE_SIZE) * scaleX);
    const y = Math.floor((i / IMAGE_SIZE) * scaleY);
    const idx = (y * frameWidth + x) * 4;
    if (idx + 2 < data.length) {
      input.push(data[idx] / 255.0); // R
      input.push(data[idx + 1] / 255.0); // G
      input.push(data[idx + 2] / 255.0); // B
    }
  }

  return input;
}

async function loadModel() {
  if (model) return model;

  await initTensorflow();

  try {
    // Load the object detection TFLite model from assets
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const modelSource = require('@/assets/model/best_float16.tflite');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    model = await loadTensorflowModel(modelSource);
    // Make model shareable for worklets
    model = makeShareable(model);
    if (__DEV__) console.warn('Object detection TFLite model loaded successfully');
  } catch (error) {
    console.error('Failed to load object detection TFLite model:', error);
    throw new Error('Model loading failed');
  }

  return model;
}

async function preprocessImage(imageUri: string): Promise<Float32Array> {
  try {
    const result = await ImageManipulator.manipulate(imageUri)
      .resize({ width: IMAGE_SIZE, height: IMAGE_SIZE })
      .renderAsync();

    const savedImage = await result.saveAsync({
      format: SaveFormat.JPEG,
      compress: 1.0,
      base64: true,
    });

    // Read the resized image as base64
    const base64 = savedImage.base64;

    if (__DEV__) console.warn('Preprocessed image base64 length:', base64?.length);
    if (!base64) {
      throw new Error('Failed to convert image to base64');
    }

    // Decode JPEG
    const rawData = Buffer.from(base64, 'base64');
    const jpegData = jpeg.decode(rawData, { useTArray: true });

    if (__DEV__) console.warn('JPEG decoded - width:', jpegData.width, 'height:', jpegData.height);

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

    if (__DEV__) console.warn('First 10 preprocessed values:', Array.from(data.slice(0, 30)));

    // Find min/max for validation
    let min = data[0];
    let max = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    if (__DEV__) console.warn('Preprocessed image - min:', min, 'max:', max);
    return data;
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    throw error;
  }
}

interface Detection {
  bbox: [number, number, number, number];
  confidence: number;
  classId: number;
}

function postprocessOutput(
  output: number[][][],
  confThreshold = 0.25,
  iouThreshold = 0.5,
): Detection[] {
  const detections: Detection[] = [];

  if (output.length === 0 || output[0].length < 5) return detections;

  // YOLOv8 format: [1, num_classes+4, num_anchors]
  const predictions = output[0]; // [num_classes+4, num_anchors]

  // Transpose to [num_anchors, num_classes+4]
  const numAnchors = predictions[0].length;
  const numClasses = predictions.length - 4;

  const transposed = Array.from({ length: numAnchors }, () =>
    Array.from({ length: numClasses + 4 }, () => 0),
  );

  for (let i = 0; i < predictions.length; i++) {
    for (let j = 0; j < numAnchors; j++) {
      transposed[j][i] = predictions[i][j];
    }
  }

  const allBoxes: number[][] = [];
  const allScores: number[] = [];
  const allClasses: number[] = [];

  for (const pred of transposed) {
    if (pred.length < 4 + numClasses) continue;

    // Extract bbox (center x, center y, width, height) - normalized
    const cx = pred[0];
    const cy = pred[1];
    const w = pred[2];
    const h = pred[3];
    const classScores = pred.slice(4, 4 + numClasses);

    // Find best class
    const classId = classScores.indexOf(Math.max(...classScores));
    const confidence = classScores[classId];

    if (confidence > confThreshold) {
      // Convert bbox to x1,y1,x2,y2
      const x1 = (cx - w / 2) * IMAGE_SIZE;
      const y1 = (cy - h / 2) * IMAGE_SIZE;
      const x2 = (cx + w / 2) * IMAGE_SIZE;
      const y2 = (cy + h / 2) * IMAGE_SIZE;

      // Clip to image bounds
      const clippedX1 = Math.max(0, Math.min(x1, IMAGE_SIZE));
      const clippedY1 = Math.max(0, Math.min(y1, IMAGE_SIZE));
      const clippedX2 = Math.max(0, Math.min(x2, IMAGE_SIZE));
      const clippedY2 = Math.max(0, Math.min(y2, IMAGE_SIZE));

      allBoxes.push([clippedX1, clippedY1, clippedX2, clippedY2]);
      allScores.push(confidence);
      allClasses.push(classId);
    }
  }

  // Apply NMS
  if (allBoxes.length > 0) {
    const keepIndices = nms(allBoxes, allScores, iouThreshold);
    for (const idx of keepIndices) {
      detections.push({
        bbox: allBoxes[idx] as [number, number, number, number],
        confidence: allScores[idx],
        classId: allClasses[idx],
      });
    }
  }

  return detections;
}

function nms(boxes: number[][], scores: number[], iouThreshold = 0.5): number[] {
  if (boxes.length === 0) return [];

  const order = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  const keep: number[] = [];

  while (order.length > 0) {
    const i = order.shift()!;
    keep.push(i);

    const remaining: number[] = [];
    for (const j of order) {
      const iou = calculateIoU(boxes[i], boxes[j]);
      if (iou <= iouThreshold) {
        remaining.push(j);
      }
    }
    order.length = 0;
    order.push(...remaining);
  }

  return keep;
}

function calculateIoU(box1: number[], box2: number[]): number {
  const [x1, y1, x2, y2] = box1;
  const [x1b, y1b, x2b, y2b] = box2;

  const interX1 = Math.max(x1, x1b);
  const interY1 = Math.max(y1, y1b);
  const interX2 = Math.min(x2, x2b);
  const interY2 = Math.min(y2, y2b);

  const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  const box1Area = (x2 - x1) * (y2 - y1);
  const box2Area = (x2b - x1b) * (y2b - y1b);

  return interArea / (box1Area + box2Area - interArea);
}

export async function detectObjects(uri: string): Promise<ObjectDetectionResult> {
  const loadedModel = await loadModel();

  if (!loadedModel) {
    throw new Error('Model not loaded');
  }

  try {
    // Preprocess image
    const inputData = await preprocessImage(uri);

    if (__DEV__)
      console.warn('Input data shape:', inputData.length, 'Expected:', IMAGE_SIZE * IMAGE_SIZE * 3);
    if (__DEV__) console.warn('Input data first 10:', Array.from(inputData.slice(0, 10)));

    // Check if image is almost all black (or white) to avoid meaningless detections
    const mean = inputData.reduce((sum, val) => sum + val, 0) / inputData.length;
    if (mean < 0.01 || mean > 0.99) {
      return { detections: [], confidence: 0 };
    }

    // Run inference
    const outputs = await loadedModel.run([inputData]);

    // YOLOv8 format: [1, num_classes+4, num_anchors]
    if (outputs.length !== 1) {
      throw new Error(`Expected 1 output, got ${outputs.length}`);
    }

    const outputArray = outputs[0] as Float32Array;
    const numClasses = NUM_CLASSES;
    const numAnchors = outputArray.length / (numClasses + 4);

    // Reshape to [1, num_classes+4, num_anchors]
    const output: number[][][] = [[]];
    for (let i = 0; i < numClasses + 4; i++) {
      output[0][i] = [];
      for (let j = 0; j < numAnchors; j++) {
        output[0][i][j] = outputArray[i * numAnchors + j];
      }
    }

    // Postprocess
    const detections = postprocessOutput(output, CONFIDENCE_THRESHOLD);

    const maxConfidence =
      detections.length > 0 ? Math.max(...detections.map((d) => d.confidence)) : 0;

    const result: ObjectDetectionResult = {
      detections: detections.map((d) => ({
        bbox: d.bbox,
        class: Array(NUM_CLASSES)
          .fill(0)
          .map((_, i) => (i === d.classId ? d.confidence : 0)),
      })),
      confidence: maxConfidence,
    };

    if (__DEV__)
      console.warn(
        `Parsed ${detections.length} detections above threshold ${CONFIDENCE_THRESHOLD}`,
      );

    return result;
  } catch (error) {
    console.error('Object detection failed:', error);
    throw new Error('Object detection failed');
  }
}

export function createFrameProcessor(onDetections?: (detections: Detection[]) => void) {
  return (frame: Frame) => {
    'worklet';
    if (!model) return;

    // Preprocess frame
    const input = preprocessFrame(frame);

    // Run inference
    const typedInput = new Float32Array(input);
    const outputs = model.runSync([typedInput]);

    // Convert output
    const outputArray = outputs[0] as Float32Array;
    const numClasses = NUM_CLASSES;
    const numAnchors = outputArray.length / (numClasses + 4);

    const output: number[][][] = [[]];
    for (let i = 0; i < numClasses + 4; i++) {
      output[0][i] = [];
      for (let j = 0; j < numAnchors; j++) {
        output[0][i][j] = outputArray[i * numAnchors + j];
      }
    }

    // Postprocess
    const detections = postprocessOutput(output, CONFIDENCE_THRESHOLD);
    console.log({ detections });

    // Call callback if provided
    if (onDetections) {
      onDetections(detections);
    }
  };
}

export async function warmup() {
  await loadModel();
}

export function getModel(): TensorflowModel | null {
  return model;
}
