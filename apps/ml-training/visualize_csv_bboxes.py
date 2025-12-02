#!/usr/bin/env python
"""Visualize YOLO-format CSV bounding boxes on images.

This script reads a CSV file with columns:
    filename,x_center,y_center,width,height,confidence,class_id

And overlays bounding boxes (YOLO normalized xywh) on the corresponding images
(lookup by basename under a provided images directory, searching nested
subdirectories when necessary). Saves visualizations to the output directory and
optionally displays them.

Usage examples:
    python visualize_csv_bboxes.py --csv yolo_labels.csv --images merged_dataset --output visualized
    python visualize_csv_bboxes.py --csv yolo_labels.csv --images merged_dataset --output visualized --min-confidence 0.3 --max-images 100

"""

from __future__ import annotations

import argparse
import csv
import os
from pathlib import Path
from typing import Dict, List, Tuple
import cv2
import numpy as np
from rich import print

# Add project root import to find dataset_utils if needed
import sys

sys.path.append(str(Path(__file__).parent))

try:
    # dataset_utils is at apps/ml-training/dataset_utils.py, try import by name
    from dataset_utils import get_canonical_classes
except Exception:
    try:
        # fallback to object_detection subpackage if available
        from object_detection.dataset_utils import get_canonical_classes
    except Exception:
        # final fallback: simple mapping for class ids
        def get_canonical_classes():
            return [f"class_{i}" for i in range(100)]


def load_csv(csv_path: str, min_confidence: float = 0.0) -> Dict[str, List[Dict]]:
    """Read the CSV and return a mapping of image basenames -> list of detection dicts.

    Each detection dict contains xywh (normalized), confidence, class_id.
    """
    detections: Dict[str, List[Dict]] = {}

    with open(csv_path, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        # Normalize header names
        for row in reader:
            # Some writers insert whitespace - strip keys/values
            filename = row.get("filename") or row.get("file") or row.get("image")
            if filename is None:
                continue
            filename = filename.strip()

            try:
                x_center = float(str(row.get("x_center", "0")).strip())
                y_center = float(str(row.get("y_center", "0")).strip())
                w = float(str(row.get("width", "0")).strip())
                h = float(str(row.get("height", "0")).strip())
                confidence = float(str(row.get("confidence", "1.0")).strip())
                class_id = int(str(row.get("class_id", "0")).strip())
            except Exception as e:
                print(f"[yellow]Skipping invalid CSV row: {row} ({e})[/yellow]")
                continue

            if confidence < min_confidence:
                continue

            det = {
                "x_center": x_center,
                "y_center": y_center,
                "width": w,
                "height": h,
                "confidence": confidence,
                "class_id": class_id,
            }
            detections.setdefault(filename, []).append(det)

    return detections


def find_image_paths(images_root: str) -> Dict[str, str]:
    """Create a mapping from filename basename -> full path (first match wins).

    This helps when the CSV only contains basenames and images are nested.
    """
    root = Path(images_root)
    mapping: Dict[str, str] = {}
    if not root.exists():
        raise FileNotFoundError(f"Images folder not found: {images_root}")

    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            mapping.setdefault(p.name, str(p))
    return mapping


def yolo_to_pixels(
    x_center: float, y_center: float, w: float, h: float, img_w: int, img_h: int
) -> Tuple[int, int, int, int]:
    """Convert normalized YOLO xywh to pixel x1,y1,x2,y2 coordinates.

    Keep coordinates clamped to image dimensions.
    """
    x1 = (x_center - w / 2.0) * img_w
    y1 = (y_center - h / 2.0) * img_h
    x2 = (x_center + w / 2.0) * img_w
    y2 = (y_center + h / 2.0) * img_h

    x1 = int(round(max(0, x1)))
    y1 = int(round(max(0, y1)))
    x2 = int(round(min(img_w - 1, x2)))
    y2 = int(round(min(img_h - 1, y2)))

    return x1, y1, x2, y2


def draw_box(
    image: np.ndarray,
    box: Tuple[int, int, int, int],
    label: str,
    color=(0, 255, 0),
    thickness: int = 2,
) -> np.ndarray:
    """Draw a rectangle and label on the image (RGB order expected by cv2 after conversion)."""
    x1, y1, x2, y2 = box
    # Draw rectangle (OpenCV uses BGR)
    cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness)

    # Label background
    (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
    cv2.rectangle(image, (x1, max(0, y1 - text_h - 6)), (x1 + text_w + 6, y1), color, -1)

    # Put label text (white over colored bg)
    cv2.putText(
        image,
        label,
        (x1 + 3, y1 - 4),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        1,
        cv2.LINE_AA,
    )

    return image


def visualize_csv_on_images(
    csv_path: str,
    images_root: str,
    output_dir: str,
    min_confidence: float = 0.0,
    max_images: int = 0,
    show: bool = False,
):
    classes = get_canonical_classes()

    detections_map = load_csv(csv_path, min_confidence=min_confidence)

    if not detections_map:
        print(
            f"[yellow]No detections found in CSV {csv_path} (or none above min_confidence).[/yellow]"
        )
        return

    img_paths = find_image_paths(images_root)

    os.makedirs(output_dir, exist_ok=True)

    processed = 0

    for filename, dets in detections_map.items():
        if max_images and processed >= max_images:
            break

        # If the CSV contains a path-like filename, try direct resolution first
        if os.path.sep in filename or "/" in filename:
            abs_candidate = os.path.join(images_root, filename)
            if os.path.exists(abs_candidate):
                path = abs_candidate
            elif os.path.exists(filename):
                path = filename
            else:
                # fallback to name-based lookup
                if filename not in img_paths:
                    print(f"[yellow]Image not found for filename: {filename} (skipping)[/yellow]")
                    continue
                path = img_paths[filename]
        else:
            if filename not in img_paths:
                print(f"[yellow]Image not found for filename: {filename} (skipping)[/yellow]")
                continue
            path = img_paths[filename]
        img = cv2.imread(path)
        if img is None:
            print(f"[red]Failed to load image: {path} (skipping)[/red]")
            continue

        # Convert BGR -> RGB for consistency with other code
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img.shape[:2]

        # Draw boxes
        for det in dets:
            x1, y1, x2, y2 = yolo_to_pixels(
                det["x_center"], det["y_center"], det["width"], det["height"], w, h
            )
            label = (
                f"{classes[det['class_id']]}:{det['confidence']:.2f}"
                if det["class_id"] < len(classes)
                else f"{det['class_id']}:{det['confidence']:.2f}"
            )

            # Convert RGB back to BGR for drawing using cv2
            img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            img_bgr = draw_box(img_bgr, (x1, y1, x2, y2), label)
            # convert back to RGB for saving/viewing with matplotlib etc.
            img = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        out_path = os.path.join(output_dir, filename)
        # Ensure output folder mirrors nested structure if necessary
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        # Save as RGB using cv2 (BGR write) so convert back
        img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        cv2.imwrite(out_path, img_bgr)

        if show:
            # Use OpenCV window (BGR)
            cv2.imshow("visualization", img_bgr)
            cv2.waitKey(0)
            cv2.destroyAllWindows()

        processed += 1

    print(f"[green]Visualization complete - saved {processed} images to {output_dir}[/green]")


def main():
    parser = argparse.ArgumentParser(description="Visualize CSV YOLO bounding boxes on images")
    parser.add_argument("--csv", type=str, required=True, help="Path to CSV file with detections")
    parser.add_argument(
        "--images",
        type=str,
        required=True,
        help="Root images folder (nested) to search for filenames",
    )
    parser.add_argument("--output", type=str, default="visualized", help="Output directory")
    parser.add_argument(
        "--min-confidence", type=float, default=0.0, help="Minimum confidence to visualize"
    )
    parser.add_argument(
        "--max-images", type=int, default=0, help="Limit number of images to visualize (0=all)"
    )
    parser.add_argument("--show", action="store_true", help="Show images in a window")

    args = parser.parse_args()

    visualize_csv_on_images(
        args.csv,
        args.images,
        args.output,
        min_confidence=args.min_confidence,
        max_images=args.max_images,
        show=args.show,
    )


if __name__ == "__main__":
    main()
