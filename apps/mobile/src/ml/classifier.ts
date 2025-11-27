import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite'; // From react-native-fast-tflite

import { initTensorflow } from './tensorflow';

export interface ClassificationResult {
  label: string;
  confidence: number; // 0..1
}

let model: TensorflowModel | null = null;

// Labels matching the trained model (8 canonical waste classes)
const labels = [
  'paper_cardboard',
  'glass',
  'recyclables',
  'bio_waste',
  'textile_reuse',
  'electronics',
  'battery',
  'residual_waste',
];

// Image preprocessing constants (adjust based on your model's training)
const IMAGE_SIZE = 224; // Common size for mobile models

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((logit) => Math.exp(logit - maxLogit));
  const sumExps = exps.reduce((sum, exp) => sum + exp, 0);
  return exps.map((exp) => exp / sumExps);
}

async function loadModel() {
  if (model) return model;

  await initTensorflow();

  try {
    // Load the TFLite model from assets
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
    const modelSource = require('@/assets/model/waste_classifier_model.tflite');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    model = await loadTensorflowModel(modelSource);
    console.warn('TFLite model loaded successfully');
  } catch (error) {
    console.error('Failed to load TFLite model:', error);
    throw new Error('Model loading failed');
  }

  return model;
}

async function preprocessImage(imageUri: string): Promise<Float32Array> {
  try {
    // Resize image to 224x224 using expo-image-manipulator
    const manipulatedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: IMAGE_SIZE, height: IMAGE_SIZE } }],
      { format: SaveFormat.JPEG, compress: 1.0 }, // No compression to preserve image quality
    );

    // Read the resized image as base64
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: 'base64',
    });

    // Decode JPEG
    const rawData = Buffer.from(base64 as string, 'base64');
    const jpegData = jpeg.decode(rawData, { useTArray: true });

    console.warn('JPEG decoded - width:', jpegData.width, 'height:', jpegData.height);
    console.warn('First 10 raw pixels (RGBA):', Array.from(jpegData.data.slice(0, 40)));

    // Convert RGBA to RGB and apply MobileNetV3 preprocessing
    // MobileNetV3 expects: pixel values in [0, 255] then normalized to [-1, 1]
    // Format: [batch=1, height, width, channels]
    const data = new Float32Array(1 * IMAGE_SIZE * IMAGE_SIZE * 3);
    const pixels = jpegData.data; // Uint8Array RGBA

    for (let i = 0; i < IMAGE_SIZE * IMAGE_SIZE; i++) {
      // Extract RGB, normalize to [-1, 1] (MobileNetV3 preprocessing)
      const r = pixels[i * 4] / 127.5 - 1;
      const g = pixels[i * 4 + 1] / 127.5 - 1;
      const b = pixels[i * 4 + 2] / 127.5 - 1;
      data[i * 3] = r;
      data[i * 3 + 1] = g;
      data[i * 3 + 2] = b;
    }

    console.warn('First 10 preprocessed values:', Array.from(data.slice(0, 30)));

    // Find min/max without spreading (avoid stack overflow)
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

export async function classifyImage(uri: string): Promise<ClassificationResult[]> {
  const loadedModel = await loadModel();

  if (!loadedModel) {
    throw new Error('Model not loaded');
  }

  try {
    // Preprocess image
    const inputData = await preprocessImage(uri);

    console.warn('Input data shape:', inputData.length, 'Expected:', IMAGE_SIZE * IMAGE_SIZE * 3);

    // Run inference
    const output = await loadedModel.run([inputData]);

    // The output is TypedArray[], take the first one
    const predictionData = output[0];

    console.warn('Raw output length:', predictionData.length);

    // Convert TypedArray to number array (these are logits)
    const logits: number[] = [];
    for (let i = 0; i < predictionData.length; i++) {
      logits.push(predictionData[i] as number);
    }
    console.warn('Model output (logits):', logits);

    // Apply softmax to convert logits to probabilities
    const probabilities = softmax(logits);
    console.warn(
      'Model output (probabilities):',
      probabilities.map((p: number) => Math.round(p * 100)),
    );

    // Convert to results
    const results: ClassificationResult[] = [];
    for (let i = 0; i < labels.length; i++) {
      results.push({
        label: labels[i],
        confidence: probabilities[i],
      });
    }

    // Sort by confidence (highest first)
    results.sort((a, b) => b.confidence - a.confidence);

    console.warn('Top 3 predictions:', results.slice(0, 3));

    return results;
  } catch (error) {
    console.error('Classification failed:', error);
    throw new Error('Classification failed');
  }
}

export async function warmup() {
  await loadModel();
}
