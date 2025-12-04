#!/usr/bin/env python
"""Test and visualize object detection model predictions.

Loads a trained model (Keras or TFLite) and visualizes:
- Detected bounding boxes
- Classification results
- Edge detection masks
"""

import argparse
import os
import json
from pathlib import Path
import numpy as np
import tensorflow as tf
from tensorflow import keras
import cv2
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from typing import Dict, Tuple, List
from rich import print

# Add parent directory to path
import sys

sys.path.append(str(Path(__file__).parent.parent))
from dataset_utils import get_canonical_classes
from object_detection.train_detector import apply_classwise_nms, focal_loss


class ObjectDetector:
    """Wrapper for object detection model inference."""

    def __init__(
        self,
        model_path: str,
        is_tflite: bool = False,
        iou_threshold: float = 0.5,
        score_threshold: float = 0.3,
        max_output_per_class: int = 10,
    ):
        self.is_tflite = is_tflite
        self.classes = get_canonical_classes()
        self.iou_threshold = iou_threshold
        self.score_threshold = score_threshold
        self.max_output_per_class = max_output_per_class

        if is_tflite:
            self._load_tflite(model_path)
        else:
            self._load_keras(model_path)

    def _load_keras(self, model_path: str):
        """Load Keras model."""
        print(f"[cyan]Loading Keras model from {model_path}...[/cyan]")
        try:
            # For inference, avoid deserializing the compile() config which
            # can reference custom losses/optimizers not needed for predict.
            self.model = keras.models.load_model(model_path, compile=False)
        except Exception as e:
            # Fallback: some models may reference custom loss functions (e.g. focal_loss).
            # Try loading with a minimal custom_objects mapping for compatibility.
            try:
                self.model = keras.models.load_model(
                    model_path, compile=False, custom_objects={"focal_loss_fixed": focal_loss()}
                )
            except Exception:
                raise
        self.input_size = self.model.input_shape[1]
        print(f"[green]✓ Model loaded (input size: {self.input_size}x{self.input_size})[/green]")

    def _load_tflite(self, model_path: str):
        """Load TFLite model."""
        print(f"[cyan]Loading TFLite model from {model_path}...[/cyan]")
        self.interpreter = tf.lite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()

        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        self.input_size = self.input_details[0]["shape"][1]

        print(
            f"[green]✓ TFLite model loaded (input size: {self.input_size}x{self.input_size})[/green]"
        )

    def preprocess_image(self, image_path: str) -> Tuple[np.ndarray, np.ndarray]:
        """Load and preprocess image for inference."""
        # Load image
        image = cv2.imread(image_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        original_shape = image.shape[:2]

        # Resize for model
        resized = cv2.resize(image, (self.input_size, self.input_size))
        preprocessed = resized.astype(np.float32) / 255.0

        return preprocessed, image

    def predict(self, image: np.ndarray) -> Dict[str, np.ndarray]:
        """Run inference on preprocessed image."""
        # Add batch dimension
        input_tensor = np.expand_dims(image, axis=0)

        if self.is_tflite:
            return self._predict_tflite(input_tensor)
        else:
            return self._predict_keras(input_tensor)

    def _predict_keras(self, input_tensor: np.ndarray) -> Dict[str, np.ndarray]:
        """Run Keras model inference."""
        predictions = self.model.predict(input_tensor, verbose=0)

        raw_bboxes = np.asarray(predictions["bbox"])
        raw_class = np.asarray(predictions["class"])
        raw_obj = np.asarray(predictions.get("obj")) if "obj" in predictions else None
        if raw_bboxes.ndim == 3 and raw_bboxes.shape[0] == 1:
            raw_bboxes = raw_bboxes[0]
        if raw_class.ndim == 3 and raw_class.shape[0] == 1:
            raw_class = raw_class[0]
        if raw_obj is not None and raw_obj.ndim == 2 and raw_obj.shape[0] == 1:
            raw_obj = raw_obj[0]
        # Model no longer outputs 'edges' in this codepath — ignore any extra outputs
        # If the model also outputs objectness scores, use them to re-weight class probs.
        # This helps when the softmax per-box yields low max-class probabilities but the
        # network is confident there is an object (high obj score).
        if raw_obj is not None:
            if raw_obj.ndim == 2 and raw_obj.shape[0] == 1:
                raw_obj = raw_obj[0]
            # expand to (num_boxes, 1) and multiply with class probs
            try:
                class_probs_scaled = raw_class * np.expand_dims(raw_obj, axis=-1)
            except Exception:
                class_probs_scaled = raw_class
        else:
            class_probs_scaled = raw_class

        # Apply NMS to multi-box predictions using scaled class probabilities
        selected_boxes, selected_labels, selected_scores = apply_classwise_nms(
            raw_bboxes,
            class_probs_scaled,
            iou_threshold=self.iou_threshold,
            score_threshold=self.score_threshold,
            max_output_per_class=self.max_output_per_class,
        )

        # If NMS filtered out everything, try a relaxed fallback:
        # pick the box with highest (obj * max_class_prob) if it exceeds a small threshold.
        if (selected_boxes is None) or (getattr(selected_boxes, "shape", (0,))[0] == 0):
            # compute per-box max class prob
            per_box_max = (
                np.max(raw_class, axis=1)
                if raw_class is not None
                else np.zeros((raw_bboxes.shape[0],))
            )
            obj_scores = raw_obj if raw_obj is not None else np.ones_like(per_box_max)
            try:
                rel_scores = obj_scores * per_box_max
            except Exception:
                # shapes mismatch -> fallback to per_box_max
                rel_scores = per_box_max

            best_idx = int(np.argmax(rel_scores))
            best_score = float(rel_scores[best_idx])
            # fallback threshold: allow low scores but not pure noise
            fallback_threshold = max(0.01, self.score_threshold * 0.5)
            if best_score >= fallback_threshold and raw_bboxes.shape[0] > 0:
                selected_boxes = np.expand_dims(raw_bboxes[best_idx], axis=0)
                selected_labels = np.array([int(np.argmax(raw_class[best_idx]))], dtype=np.int32)
                selected_scores = np.array([best_score], dtype=np.float32)

        # If still no boxes, fallback to highest obj box (ignoring class confidence)
        if (selected_boxes is None) or (getattr(selected_boxes, "shape", (0,))[0] == 0):
            if raw_obj is not None and raw_bboxes.shape[0] > 0:
                best_obj_idx = int(np.argmax(raw_obj))
                best_obj_score = float(raw_obj[best_obj_idx])
                if best_obj_score > 0.1:  # arbitrary threshold for some objectness
                    selected_boxes = np.expand_dims(raw_bboxes[best_obj_idx], axis=0)
                    selected_labels = np.array(
                        [int(np.argmax(raw_class[best_obj_idx]))], dtype=np.int32
                    )
                    selected_scores = np.array([best_obj_score], dtype=np.float32)

        # Filter out invalid boxes (zero area)
        if selected_boxes is not None and getattr(selected_boxes, "shape", (0,))[0] > 0:
            valid_mask = []
            for i, box in enumerate(selected_boxes):
                x_min, y_min, x_max, y_max = box
                area = (x_max - x_min) * (y_max - y_min)
                # Skip invalid (zero area)
                if area > 0 and x_min >= 0 and y_min >= 0 and x_max <= 1 and y_max <= 1:
                    valid_mask.append(i)
            if valid_mask:
                selected_boxes = selected_boxes[valid_mask]
                selected_labels = selected_labels[valid_mask]
                selected_scores = selected_scores[valid_mask]
            else:
                selected_boxes = np.zeros((0, 4), dtype=np.float32)
                selected_labels = np.array([], dtype=np.int32)
                selected_scores = np.array([], dtype=np.float32)

        return {
            "bboxes": selected_boxes,
            "labels": selected_labels,
            "scores": selected_scores,
            "class_probs": raw_class,
            "obj": raw_obj,
        }

    def _predict_tflite(self, input_tensor: np.ndarray) -> Dict[str, np.ndarray]:
        """Run TFLite model inference."""
        # Ensure correct dtype for interpreter input
        input_tensor = np.asarray(input_tensor)
        target_dtype = self.input_details[0]["dtype"]
        if input_tensor.dtype != target_dtype:
            input_tensor = input_tensor.astype(target_dtype)

        # Set input tensor
        self.interpreter.set_tensor(self.input_details[0]["index"], input_tensor)

        # Run inference
        self.interpreter.invoke()

        # Get outputs
        outputs = {}
        for detail in self.output_details:
            output_data = self.interpreter.get_tensor(detail["index"])
            name = detail["name"].split("/")[-1].replace(":0", "")
            outputs[name] = output_data[0]

        # Get outputs by index: assume [0]=bbox, [1]=class, [2]=obj
        raw_bboxes = np.asarray(outputs[0])
        raw_class = np.asarray(outputs[1])
        raw_obj = np.asarray(outputs[2]) if len(outputs) > 2 else None
        if raw_bboxes.ndim == 3 and raw_bboxes.shape[0] == 1:
            raw_bboxes = raw_bboxes[0]
        if raw_class.ndim == 3 and raw_class.shape[0] == 1:
            raw_class = raw_class[0]
        if raw_obj is not None and raw_obj.ndim == 2 and raw_obj.shape[0] == 1:
            raw_obj = raw_obj[0]
        # Use objectness to scale class probabilities when available
        if raw_obj is not None:
            if raw_obj.ndim == 2 and raw_obj.shape[0] == 1:
                raw_obj = raw_obj[0]
            try:
                class_probs_scaled = raw_class * np.expand_dims(raw_obj, axis=-1)
            except Exception:
                class_probs_scaled = raw_class
        else:
            class_probs_scaled = raw_class

        selected_boxes, selected_labels, selected_scores = apply_classwise_nms(
            raw_bboxes,
            class_probs_scaled,
            iou_threshold=self.iou_threshold,
            score_threshold=self.score_threshold,
            max_output_per_class=self.max_output_per_class,
        )

        # relaxed fallback similar to Keras path
        if (selected_boxes is None) or (getattr(selected_boxes, "shape", (0,))[0] == 0):
            per_box_max = (
                np.max(raw_class, axis=1)
                if raw_class is not None
                else np.zeros((raw_bboxes.shape[0],))
            )
            obj_scores = raw_obj if raw_obj is not None else np.ones_like(per_box_max)
            try:
                rel_scores = obj_scores * per_box_max
            except Exception:
                rel_scores = per_box_max

            best_idx = int(np.argmax(rel_scores))
            best_score = float(rel_scores[best_idx])
            fallback_threshold = max(0.01, self.score_threshold * 0.5)
            if best_score >= fallback_threshold and raw_bboxes.shape[0] > 0:
                selected_boxes = np.expand_dims(raw_bboxes[best_idx], axis=0)
                selected_labels = np.array([int(np.argmax(raw_class[best_idx]))], dtype=np.int32)
                selected_scores = np.array([best_score], dtype=np.float32)

        # If still no boxes, fallback to highest obj box
        if (selected_boxes is None) or (getattr(selected_boxes, "shape", (0,))[0] == 0):
            if raw_obj is not None and raw_bboxes.shape[0] > 0:
                best_obj_idx = int(np.argmax(raw_obj))
                best_obj_score = float(raw_obj[best_obj_idx])
                if best_obj_score > 0.1:
                    selected_boxes = np.expand_dims(raw_bboxes[best_obj_idx], axis=0)
                    selected_labels = np.array(
                        [int(np.argmax(raw_class[best_obj_idx]))], dtype=np.int32
                    )
                    selected_scores = np.array([best_obj_score], dtype=np.float32)

        # Filter out invalid boxes
        if selected_boxes is not None and getattr(selected_boxes, "shape", (0,))[0] > 0:
            valid_mask = []
            for i, box in enumerate(selected_boxes):
                x_min, y_min, x_max, y_max = box
                area = (x_max - x_min) * (y_max - y_min)
                if area > 0 and x_min >= 0 and y_min >= 0 and x_max <= 1 and y_max <= 1:
                    valid_mask.append(i)
            if valid_mask:
                selected_boxes = selected_boxes[valid_mask]
                selected_labels = selected_labels[valid_mask]
                selected_scores = selected_scores[valid_mask]
            else:
                selected_boxes = np.zeros((0, 4), dtype=np.float32)
                selected_labels = np.array([], dtype=np.int32)
                selected_scores = np.array([], dtype=np.float32)

        return {
            "bboxes": selected_boxes,
            "labels": selected_labels,
            "scores": selected_scores,
            "class_probs": raw_class,
            "obj": raw_obj,
        }

    def detect(self, image_path: str) -> Tuple[Dict[str, np.ndarray], np.ndarray]:
        """Run full detection pipeline on image."""
        preprocessed, original = self.preprocess_image(image_path)
        predictions = self.predict(preprocessed)
        return predictions, original


def visualize_predictions(
    image: np.ndarray,
    predictions: Dict[str, np.ndarray],
    classes: List[str],
    save_path: str = None,
    show: bool = True,
):
    """Visualize detection results with bounding box, class, and edges."""
    # Simple single-panel visualization: original image with boxes and labels
    fig, ax = plt.subplots(1, 1, figsize=(8, 8))
    ax.imshow(image)

    h, w = image.shape[:2]
    bboxes = predictions.get("bboxes")
    labels = predictions.get("labels")
    scores = predictions.get("scores")

    if bboxes is not None and getattr(bboxes, "shape", (0,))[0] > 0:
        for i, box in enumerate(bboxes):
            x_min, y_min, x_max, y_max = box
            # Skip invalid / zero-area boxes (often padding)
            if x_max <= x_min or y_max <= y_min:
                continue
            x_min = int(x_min * w)
            y_min = int(y_min * h)
            x_max = int(x_max * w)
            y_max = int(y_max * h)
            rect = patches.Rectangle(
                (x_min, y_min),
                x_max - x_min,
                y_max - y_min,
                linewidth=2,
                edgecolor="lime",
                facecolor="none",
            )
            ax.add_patch(rect)
            class_idx = int(labels[i]) if labels is not None and len(labels) > i else -1
            # Map background/unknown indices safely
            if class_idx >= 0 and class_idx < len(classes):
                class_name = classes[class_idx]
            elif class_idx == len(classes):
                class_name = "background"
            else:
                class_name = f"unknown({class_idx})"
                conf = float(scores[i]) if scores is not None and len(scores) > i else 0.0
                label = f"{class_name} ({conf:.2%})"
                ax.text(
                    x_min,
                    max(0, y_min - 10),
                    label,
                    color="white",
                    fontsize=12,
                    bbox=dict(facecolor="lime", alpha=0.8, pad=5),
                )

    ax.set_title("Detection Result", fontsize=14, fontweight="bold")
    ax.axis("off")

    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches="tight")
        print(f"[green]✓ Visualization saved to {save_path}[/green]")

    if show:
        plt.show()
    else:
        plt.close()

    return fig


def print_predictions(predictions: Dict[str, np.ndarray], classes: List[str]):
    """Print prediction details."""
    print("\n[bold cyan]Detection Results:[/bold cyan]")

    # Bounding boxes
    bboxes = predictions.get("bboxes")
    labels = predictions.get("labels")
    scores = predictions.get("scores")
    if bboxes is not None and len(bboxes) > 0:
        print(f"\n[yellow]Detected Boxes (normalized):[/yellow]")
        for i, box in enumerate(bboxes):
            # Skip invalid boxes
            if box[2] <= box[0] or box[3] <= box[1]:
                continue
            print(
                f"  Box {i+1}: x_min={box[0]:.3f}, y_min={box[1]:.3f}, x_max={box[2]:.3f}, y_max={box[3]:.3f}"
            )
            if labels is not None and len(labels) > i:
                li = int(labels[i])
                if li >= 0 and li < len(classes):
                    cname = classes[li]
                elif li == len(classes):
                    cname = "background"
                else:
                    cname = f"unknown({li})"
                score_val = scores[i] if scores is not None and len(scores) > i else 0.0
                print(f"    Class: {cname} (score: {score_val:.3%})")

    # Top class distributions per selected box (optional)
    class_probs = predictions.get("class_probs")
    if class_probs is not None:
        # For each selected box (if any), print top-3 classes
        print(f"\n[yellow]Per-box Top Classes:[/yellow]")
        # If labels exist (selected), report them; else we use top of class_probs per box
        bboxes = predictions.get("bboxes")
        if bboxes is not None and bboxes.shape[0] > 0:
            for i in range(bboxes.shape[0]):
                probs = class_probs[i]
                top = np.argsort(probs)[::-1][:3]
                entries = []
                for t in top:
                    if t >= 0 and t < len(classes):
                        label_name = classes[t]
                    elif t == len(classes):
                        label_name = "background"
                    else:
                        label_name = f"unknown({t})"
                    entries.append(f"{label_name}: {probs[t]:.2%}")
                line = ", ".join(entries)
                print(f"  Box {i+1}: {line}")

    # Edge statistics
    # Edge outputs removed — no edge data available
    print(f"\n[yellow]Edge Detection:[/yellow]")
    print(f"  Edge outputs removed from visualization")


def test_on_directory(
    detector: ObjectDetector, input_dir: str, output_dir: str, max_images: int = 10
):
    """Test model on multiple images from a directory."""

    os.makedirs(output_dir, exist_ok=True)

    # Get image files
    image_files = [
        f for f in os.listdir(input_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ][:max_images]

    print(f"[cyan]Testing on {len(image_files)} images...[/cyan]")

    results = []

    for i, img_file in enumerate(image_files, 1):
        print(f"\n[bold cyan]Processing {i}/{len(image_files)}: {img_file}[/bold cyan]")

        img_path = os.path.join(input_dir, img_file)

        # Run detection
        predictions, original_image = detector.detect(img_path)

        # If debug mode requested, print raw outputs for the first image to help diagnose
        if getattr(detector, "debug", False) and i == 1:
            class_probs = predictions.get("class_probs")
            raw_bboxes = predictions.get("bboxes")
            obj = predictions.get("obj")
            print("\n[magenta]DEBUG: Raw model outputs for first image[/magenta]")
            if class_probs is not None:
                print(f"  class_probs shape: {getattr(class_probs, 'shape', None)}")
                per_box_max = np.max(class_probs, axis=1)
                per_box_arg = np.argmax(class_probs, axis=1)
                print(f"  per-box max class probs (first 10): {per_box_max[:10]}")
                print(f"  per-box argmax classes (first 10): {per_box_arg[:10]}")
            else:
                print("  class_probs: None")
            if obj is not None:
                print(f"  obj shape: {getattr(obj, 'shape', None)}")
                print(f"  obj scores (first 10): {obj[:10]}")
            else:
                print("  obj: None")
            if raw_bboxes is not None:
                print(f"  raw_bboxes shape: {getattr(raw_bboxes, 'shape', None)}")
                print(f"  raw_bboxes (first 3): {raw_bboxes[:3]}")
            else:
                print("  raw_bboxes: None")
            # If both available, show obj * per_box_max
            if class_probs is not None:
                try:
                    rel_scores = (
                        obj if obj is not None else np.ones_like(per_box_max)
                    ) * per_box_max
                    print(f"  rel_scores (obj * max_class) first 10: {rel_scores[:10]}")
                except Exception as e:
                    print(f"  Could not compute rel_scores: {e}")

        # Print results
        print_predictions(predictions, detector.classes)

        # Visualize
        save_path = os.path.join(output_dir, f"result_{img_file}")
        visualize_predictions(
            original_image, predictions, detector.classes, save_path=save_path, show=False
        )

        # Store results (choose top-scoring detection if any)
        if (
            "scores" in predictions
            and predictions["scores"] is not None
            and len(predictions["scores"]) > 0
        ):
            best_idx = int(np.argmax(predictions["scores"]))
            # Guard against mismatched arrays
            labels_arr = predictions.get("labels")
            bboxes_arr = predictions.get("bboxes")
            class_idx = (
                int(labels_arr[best_idx])
                if (labels_arr is not None and len(labels_arr) > best_idx)
                else -1
            )
            confidence = float(predictions["scores"][best_idx])
            bbox_out = (
                bboxes_arr[best_idx].tolist()
                if (bboxes_arr is not None and bboxes_arr.shape[0] > best_idx)
                else []
            )
            # Treat all-zero boxes as empty
            if isinstance(bbox_out, list) and all(abs(x) < 1e-6 for x in bbox_out):
                bbox_out = []
        elif (
            "class_probs" in predictions
            and predictions["class_probs"] is not None
            and predictions["class_probs"].shape[0] > 0
        ):
            # fallback by selecting the highest-scoring class in the first box (if available)
            first_probs = predictions["class_probs"][0]
            class_idx = int(np.argmax(first_probs))
            confidence = float(np.max(first_probs))
            bboxes_arr = predictions.get("bboxes")
            bbox_out = (
                bboxes_arr[0].tolist()
                if (bboxes_arr is not None and bboxes_arr.shape[0] > 0)
                else []
            )
        else:
            class_idx = -1
            confidence = 0.0
            bbox_out = []
        # Map class index safely to class name (handle background/out-of-range)
        if class_idx >= 0 and class_idx < len(detector.classes):
            pred_name = detector.classes[class_idx]
        elif class_idx == len(detector.classes):
            pred_name = "background"
        else:
            pred_name = "unknown"

        results.append(
            {
                "image": img_file,
                "predicted_class": pred_name,
                "confidence": confidence,
                "bbox": bbox_out,
            }
        )

    # Save summary
    summary_path = os.path.join(output_dir, "test_results.json")
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n[bold green]Testing complete! Results saved to {output_dir}[/bold green]")
    print(f"[green]Summary: {summary_path}[/green]")


def main():
    parser = argparse.ArgumentParser(description="Test and visualize object detection model")
    parser.add_argument("model_path", type=str, help="Path to model (.keras or .tflite)")
    parser.add_argument("--image", type=str, help="Path to single test image")
    parser.add_argument("--dir", type=str, help="Directory containing test images")
    parser.add_argument(
        "--output",
        type=str,
        default="object_detection/test_results",
        help="Output directory for visualizations",
    )
    parser.add_argument(
        "--max-images", type=int, default=10, help="Maximum number of images to test from directory"
    )
    parser.add_argument(
        "--debug", action="store_true", help="Print raw model outputs for first image"
    )
    parser.add_argument(
        "--no-show", action="store_true", help="Do not display visualizations (only save)"
    )
    parser.add_argument("--iou-threshold", type=float, default=0.5, help="IoU threshold for NMS")
    parser.add_argument(
        "--score-threshold", type=float, default=0.3, help="Score threshold for NMS"
    )
    parser.add_argument(
        "--max-output-per-class",
        type=int,
        default=10,
        help="Max boxes per class to return from NMS",
    )

    args = parser.parse_args()

    # Determine model type
    is_tflite = args.model_path.endswith(".tflite")

    # Load detector
    detector = ObjectDetector(
        args.model_path,
        is_tflite=is_tflite,
        iou_threshold=args.iou_threshold,
        score_threshold=args.score_threshold,
        max_output_per_class=args.max_output_per_class,
    )
    # attach debug flag to detector so test_on_directory can access it
    detector.debug = args.debug

    if args.image:
        # Test single image
        print(f"[cyan]Testing on single image: {args.image}[/cyan]")
        predictions, original_image = detector.detect(args.image)

        # Print results
        print_predictions(predictions, detector.classes)

        # Visualize
        os.makedirs(args.output, exist_ok=True)
        save_path = os.path.join(args.output, f"result_{Path(args.image).name}")
        visualize_predictions(
            original_image,
            predictions,
            detector.classes,
            save_path=save_path,
            show=not args.no_show,
        )

    elif args.dir:
        # Test directory
        test_on_directory(detector, args.dir, args.output, max_images=args.max_images)
    else:
        print("[red]Error: Specify either --image or --dir[/red]")
        parser.print_help()
        return

    print("\n[bold green]Done![/bold green]")


if __name__ == "__main__":
    main()
