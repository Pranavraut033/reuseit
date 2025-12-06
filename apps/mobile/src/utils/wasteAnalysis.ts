import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

export interface Detection {
  bbox: [number, number, number, number]; // x1, y1, x2, y2 in pixels
  confidence: number;
  classId: number;
}

export const CLASS_NAMES = [
  'paper_cardboard',
  'glass',
  'recyclables',
  'bio_waste',
  'textile_reuse',
  'electronics',
  'battery',
  'residual_waste',
];

const INPUT_SIZE = 640;
const CONF_THRESHOLD = 0.25;
const IOU_THRESHOLD = 0.5;

export function nms(boxes: number[][], scores: number[], iouThreshold = IOU_THRESHOLD): number[] {
  if (boxes.length === 0) return [];

  const boxesArr = boxes.map((b) => [...b]);
  const scoresArr = [...scores];

  const order = scoresArr.map((_, i) => i).sort((a, b) => scoresArr[b] - scoresArr[a]);
  const keep: number[] = [];

  while (order.length > 0) {
    const i = order.shift()!;
    keep.push(i);

    const remaining: number[] = [];
    for (const j of order) {
      const iou = calculateIoU(boxesArr[i], boxesArr[j]);
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

export async function preprocessImage(uri: string): Promise<Float32Array> {
  // Resize to INPUT_SIZE x INPUT_SIZE with letterboxing
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
    { format: SaveFormat.JPEG },
  );

  // Convert to RGB array
  const base64 = await fetch(manipulated.uri).then((r) => r.arrayBuffer());
  const jpegData = jpeg.decode(new Uint8Array(base64), { useTArray: true });

  // Create canvas with gray padding (114)
  const canvas = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3).fill(114 / 255);

  const scale = Math.min(INPUT_SIZE / jpegData.width, INPUT_SIZE / jpegData.height);
  const newW = Math.floor(jpegData.width * scale);
  const newH = Math.floor(jpegData.height * scale);
  const offsetX = Math.floor((INPUT_SIZE - newW) / 2);
  const offsetY = Math.floor((INPUT_SIZE - newH) / 2);

  // Copy resized image to canvas
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const srcIdx = (y * jpegData.width + x) * 4;
      const dstIdx = ((offsetY + y) * INPUT_SIZE + (offsetX + x)) * 3;
      canvas[dstIdx] = jpegData.data[srcIdx] / 255; // R
      canvas[dstIdx + 1] = jpegData.data[srcIdx + 1] / 255; // G
      canvas[dstIdx + 2] = jpegData.data[srcIdx + 2] / 255; // B
    }
  }

  return canvas;
}

export function postprocessOutput(
  output: number[],
  origWidth: number,
  origHeight: number,
): Detection[] {
  const detections: Detection[] = [];

  if (output.length < 4) return detections;

  // Assuming YOLOv8 output format: [1, num_classes+4, num_anchors]
  const predictions = output.slice(4).map((_, i) => [
    output[i * 4], // cx
    output[i * 4 + 1], // cy
    output[i * 4 + 2], // w
    output[i * 4 + 3], // h
    ...output.slice(4 + i * 8, 4 + (i + 1) * 8), // classes
  ]);

  const numClasses = output.length - 4;

  for (const pred of predictions) {
    if (pred.length < 4 + numClasses) continue;

    const [cx, cy, w, h] = pred.slice(0, 4);
    const classScores = pred.slice(4, 4 + numClasses);

    const classId = classScores.indexOf(Math.max(...classScores));
    const confidence = classScores[classId];

    if (confidence > CONF_THRESHOLD) {
      // Convert to x1,y1,x2,y2
      let x1 = (cx - w / 2) * INPUT_SIZE;
      let y1 = (cy - h / 2) * INPUT_SIZE;
      let x2 = (cx + w / 2) * INPUT_SIZE;
      let y2 = (cy + h / 2) * INPUT_SIZE;

      // Clip to input size
      x1 = Math.max(0, Math.min(x1, INPUT_SIZE));
      y1 = Math.max(0, Math.min(y1, INPUT_SIZE));
      x2 = Math.max(0, Math.min(x2, INPUT_SIZE));
      y2 = Math.max(0, Math.min(y2, INPUT_SIZE));

      // Scale back to original image size
      const scaleX = origWidth / INPUT_SIZE;
      const scaleY = origHeight / INPUT_SIZE;
      x1 *= scaleX;
      y1 *= scaleY;
      x2 *= scaleX;
      y2 *= scaleY;

      detections.push({
        bbox: [x1, y1, x2, y2],
        confidence,
        classId,
      });
    }
  }

  // Apply NMS
  const boxes = detections.map((d) => d.bbox);
  const scores = detections.map((d) => d.confidence);
  const keepIndices = nms(boxes, scores);

  return keepIndices.map((i) => detections[i]);
}
