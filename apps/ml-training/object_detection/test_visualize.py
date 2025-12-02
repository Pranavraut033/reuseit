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
from object_detection.train_detector import apply_classwise_nms


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
        self.model = keras.models.load_model(model_path)
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
        if raw_bboxes.ndim == 3 and raw_bboxes.shape[0] == 1:
            raw_bboxes = raw_bboxes[0]
        if raw_class.ndim == 3 and raw_class.shape[0] == 1:
            raw_class = raw_class[0]
        raw_edges = predictions.get("edges")
        edges = raw_edges[0] if raw_edges is not None else None

        # Apply NMS to multi-box predictions
        selected_boxes, selected_labels, selected_scores = apply_classwise_nms(
            raw_bboxes,
            raw_class,
            iou_threshold=self.iou_threshold,
            score_threshold=self.score_threshold,
            max_output_per_class=self.max_output_per_class,
        )

        return {
            "bboxes": selected_boxes,
            "labels": selected_labels,
            "scores": selected_scores,
            "class_probs": raw_class,
            "edges": edges,
        }

    def _predict_tflite(self, input_tensor: np.ndarray) -> Dict[str, np.ndarray]:
        """Run TFLite model inference."""
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

        raw_bboxes = np.asarray(outputs.get("bbox"))
        raw_class = np.asarray(outputs.get("class"))
        if raw_bboxes.ndim == 3 and raw_bboxes.shape[0] == 1:
            raw_bboxes = raw_bboxes[0]
        if raw_class.ndim == 3 and raw_class.shape[0] == 1:
            raw_class = raw_class[0]
        raw_edges = outputs.get("edges")
        if raw_bboxes is None or raw_class is None:
            return outputs
        selected_boxes, selected_labels, selected_scores = apply_classwise_nms(
            raw_bboxes,
            raw_class,
            iou_threshold=self.iou_threshold,
            score_threshold=self.score_threshold,
            max_output_per_class=self.max_output_per_class,
        )
        return {
            "bboxes": selected_boxes,
            "labels": selected_labels,
            "scores": selected_scores,
            "class_probs": raw_class,
            "edges": raw_edges,
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

    fig, axes = plt.subplots(1, 3, figsize=(18, 6))

    # Original image with bounding boxes and class
    ax1 = axes[0]
    ax1.imshow(image)

    # Draw bounding boxes (multiple) if present
    h, w = image.shape[:2]
    bboxes = predictions.get("bboxes")
    labels = predictions.get("labels")
    scores = predictions.get("scores")
    if bboxes is not None and labels is not None:
        for i, box in enumerate(bboxes):
            x_min, y_min, x_max, y_max = box
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
            ax1.add_patch(rect)
            class_idx = int(labels[i]) if labels is not None and len(labels) > i else -1
            if class_idx >= 0:
                class_name = classes[class_idx]
                conf = float(scores[i]) if scores is not None and len(scores) > i else 0.0
                label = f"{class_name} ({conf:.2%})"
                ax1.text(
                    x_min,
                    y_min - 10,
                    label,
                    color="white",
                    fontsize=12,
                    bbox=dict(facecolor="lime", alpha=0.8, pad=5),
                )

    ax1.set_title("Detection Result", fontsize=14, fontweight="bold")
    ax1.axis("off")

    # Edge detection mask
    ax2 = axes[1]
    edges = predictions.get("edges")
    # If edges are missing, create an empty mask
    if edges is None:
        edges_resized = np.zeros((h, w), dtype=np.float32)
    else:
        edges_arr = np.asarray(edges)
        # Remove channel dim if present
        if edges_arr.ndim == 3 and edges_arr.shape[2] == 1:
            edges_arr = edges_arr[:, :, 0]
        # If edges include a batch dimension, squeeze it
        if edges_arr.ndim == 3 and edges_arr.shape[0] == 1:
            edges_arr = edges_arr[0]
        edges_resized = cv2.resize(edges_arr, (w, h))

    ax2.imshow(edges_resized, cmap="gray")
    ax2.set_title("Edge Detection", fontsize=14, fontweight="bold")
    ax2.axis("off")

    # Overlay edges on image
    ax3 = axes[2]
    # Create colored edge overlay
    edge_overlay = image.copy()
    edge_mask = (edges_resized > 0.5).astype(np.uint8) * 255
    edge_color = np.zeros_like(image)
    edge_color[:, :, 1] = edge_mask  # Green edges

    # Blend images
    alpha = 0.6
    edge_overlay = cv2.addWeighted(edge_overlay, 1, edge_color, alpha, 0)

    ax3.imshow(edge_overlay)
    ax3.set_title("Image + Edges Overlay", fontsize=14, fontweight="bold")
    ax3.axis("off")

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
            print(
                f"  Box {i+1}: x_min={box[0]:.3f}, y_min={box[1]:.3f}, x_max={box[2]:.3f}, y_max={box[3]:.3f}"
            )
            if labels is not None and len(labels) > i:
                li = int(labels[i])
                print(f"    Class: {classes[li]} (score: {scores[i]:.3%})")

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
                line = ", ".join([f"{classes[t]}: {probs[t]:.2%}" for t in top])
                print(f"  Box {i+1}: {line}")

    # Edge statistics
    edges = predictions.get("edges")
    if edges is not None:
        edges_arr = np.asarray(edges)
        if edges_arr.ndim == 3 and edges_arr.shape[2] == 1:
            edges_arr = edges_arr[:, :, 0]
        if edges_arr.ndim == 3 and edges_arr.shape[0] == 1:
            edges_arr = edges_arr[0]
        edge_coverage = np.mean(edges_arr > 0.5)
        print(f"\n[yellow]Edge Detection:[/yellow]")
        print(f"  Edge coverage: {edge_coverage:.2%}")
        print(f"  Edge intensity (mean): {np.mean(edges_arr):.3f}")
    else:
        print(f"\n[yellow]Edge Detection:[/yellow]")
        print(f"  No edge data available")


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

        # Print results
        print_predictions(predictions, detector.classes)

        # Visualize
        save_path = os.path.join(output_dir, f"result_{img_file}")
        visualize_predictions(
            original_image, predictions, detector.classes, save_path=save_path, show=False
        )

        # Store results (choose top-scoring detection if any)
        if "scores" in predictions and len(predictions["scores"]) > 0:
            best_idx = int(np.argmax(predictions["scores"]))
            class_idx = int(predictions["labels"][best_idx])
            confidence = float(predictions["scores"][best_idx])
            bbox_out = predictions["bboxes"][best_idx].tolist()
        elif "class_probs" in predictions and predictions["class_probs"].shape[0] > 0:
            # fallback by selecting the highest-scoring class in the first box
            class_idx = int(np.argmax(predictions["class_probs"][0]))
            confidence = float(np.max(predictions["class_probs"][0]))
            bbox_out = predictions.get("bboxes", np.zeros((1, 4)))[0].tolist()
        else:
            class_idx = -1
            confidence = 0.0
            bbox_out = []
        results.append(
            {
                "image": img_file,
                "predicted_class": detector.classes[class_idx] if class_idx >= 0 else "unknown",
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
