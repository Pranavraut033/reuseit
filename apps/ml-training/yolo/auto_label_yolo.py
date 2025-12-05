#!/usr/bin/env python
"""Auto-label images using Ultralytics YOLOv8 for bounding box generation and YOLO dataset preparation.

This script uses pretrained YOLO models to automatically generate bounding boxes
for objects in images, then converts them to YOLO format .txt files and splits into train/val/test.
"""

import os
import argparse
import csv
import random
import logging
import json
from pathlib import Path
import sys
from typing import List, Dict, Optional, Tuple
from contextlib import contextmanager
import shutil
from sklearn.model_selection import train_test_split
from collections import defaultdict
import torch
import torch.serialization

# Import from local utils
from dataset_utils_yolo import CANONICAL_CLASSES, CLASS_TO_ID, validate_yolo_labels

# Import ultralytics
from ultralytics import YOLO
from rich import print

# Folder name to waste class ID mapping
FOLDER_TO_WASTE_CLASS = {
    "paper_cardboard": 0,
    "glass": 1,
    "recyclables": 2,
    "bio_waste": 3,
    "textile_reuse": 4,
    "electronics": 5,
    "battery": 6,
    "residual_waste": 7,
}


def map_folder_to_waste_class(folder_name: str) -> int:
    """Map folder name to waste class ID."""
    return FOLDER_TO_WASTE_CLASS.get(folder_name, 7)  # Default to residual_waste (7)


# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@contextmanager
def allow_unsafe_torch_load():
    """Context manager to temporarily disable weights_only for trusted YOLO models."""
    original_load = torch.load

    def unsafe_load(*args, **kwargs):
        kwargs["weights_only"] = False
        return original_load(*args, **kwargs)

    torch.load = unsafe_load
    try:
        yield
    finally:
        torch.load = original_load


def collect_image_paths(input_folder: str) -> List[str]:
    """Collect all image file paths from input folder."""
    if not os.path.exists(input_folder):
        raise FileNotFoundError(f"Input folder not found: {input_folder}")

    image_paths = []
    valid_extensions = (".jpg", ".jpeg", ".png")

    for root, _, files in os.walk(input_folder):
        for file in files:
            if file.lower().endswith(valid_extensions):
                image_paths.append(os.path.join(root, file))

    # Shuffle to get better distribution across categories
    random.shuffle(image_paths)
    return image_paths


def convert_csv_to_yolo_txt(
    csv_file: str, images_dir: str, output_labels_dir: str, confidence_threshold: float = 0.5
) -> Dict[str, List[Dict]]:
    """
    Convert CSV annotations to YOLO .txt format files.

    Args:
        csv_file: Path to CSV file with detections
        images_dir: Directory containing images
        output_labels_dir: Directory to save .txt label files
        confidence_threshold: Minimum confidence to include detection

    Returns:
        Dictionary mapping image filenames to their annotations
    """
    os.makedirs(output_labels_dir, exist_ok=True)

    # Collect all image files with relative paths from images_dir
    image_files = set()
    images_path = Path(images_dir)
    for ext in [".jpg", ".jpeg", ".png"]:
        for img_path in images_path.glob(f"**/*{ext}"):
            try:
                rel_path = img_path.relative_to(images_path)
                image_files.add(str(rel_path))
            except ValueError:
                # If relative_to fails, use the full path as fallback
                image_files.add(str(img_path))

    annotations = {}
    with open(csv_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row["filename"]
            confidence = float(row["confidence"])

            if confidence < confidence_threshold:
                continue

            # Extract folder name from filename (e.g., "glass/image.jpg" -> "glass")
            folder_name = Path(filename).parent.name if Path(filename).parent.name else ""
            waste_class_id = map_folder_to_waste_class(folder_name)

            if filename not in annotations:
                annotations[filename] = []

            annotations[filename].append(
                {
                    "class_id": waste_class_id,
                    "x_center": float(row["x_center"]),
                    "y_center": float(row["y_center"]),
                    "width": float(row["width"]),
                    "height": float(row["height"]),
                    "confidence": confidence,
                }
            )

    # Create .txt files for images that have annotations
    for filename, anns in annotations.items():
        if filename in image_files:
            # filename is already like "paper_cardboard/image.jpg", so stem is "paper_cardboard/image"
            # But we want just "image" for the .txt filename
            image_stem = Path(filename).stem  # This gives "image" from "paper_cardboard/image.jpg"
            txt_file = Path(output_labels_dir) / f"{image_stem}.txt"
            with open(txt_file, "w") as f:
                for ann in anns:
                    line = f"{ann['class_id']} {ann['x_center']:.6f} {ann['y_center']:.6f} {ann['width']:.6f} {ann['height']:.6f}\n"
                    f.write(line)

    print(f"Converted {len(annotations)} images with annotations to YOLO format")
    return annotations


def convert_json_to_yolo_txt(
    json_file: str, images_dir: str, output_labels_dir: str
) -> Dict[str, List[Dict]]:
    """
    Convert JSON annotations to YOLO .txt format files.

    Args:
        json_file: Path to JSON file with annotations
        images_dir: Directory containing images
        output_labels_dir: Directory to save .txt label files

    Returns:
        Dictionary mapping image filenames to their annotations
    """
    os.makedirs(output_labels_dir, exist_ok=True)

    # Collect all image files with relative paths from images_dir
    image_files = set()
    images_path = Path(images_dir)
    for ext in [".jpg", ".jpeg", ".png"]:
        for img_path in images_path.glob(f"**/*{ext}"):
            try:
                rel_path = img_path.relative_to(images_path)
                image_files.add(str(rel_path))
            except ValueError:
                # If relative_to fails, use the full path as fallback
                image_files.add(str(img_path))

    with open(json_file, "r") as f:
        data = json.load(f)

    annotations = {}

    # Assuming COCO-like format or simple structure
    for item in data.get("annotations", data):
        filename = item.get("filename", item.get("image_id", ""))
        if not filename:
            continue

        # Extract folder name from filename (e.g., "glass/image.jpg" -> "glass")
        folder_name = Path(filename).parent.name if Path(filename).parent.name else ""
        waste_class_id = map_folder_to_waste_class(folder_name)

        if filename not in annotations:
            annotations[filename] = []

        # Convert bbox format if needed (assuming normalized or converting from COCO)
        bbox = item.get("bbox", [])
        if len(bbox) == 4:
            # Convert COCO [x,y,w,h] to YOLO normalized if needed
            # This is a simplified conversion - adjust based on your JSON format
            x, y, w, h = bbox
            annotations[filename].append(
                {
                    "class_id": waste_class_id,
                    "x_center": (x + w / 2)
                    / item.get("image_width", 1),  # Normalize if not already
                    "y_center": (y + h / 2) / item.get("image_height", 1),
                    "width": w / item.get("image_width", 1),
                    "height": h / item.get("image_height", 1),
                    "confidence": item.get("confidence", 1.0),
                }
            )

    # Create .txt files
    for filename, anns in annotations.items():
        if filename in image_files:
            # filename is like "paper_cardboard/image.jpg", stem gives "image"
            image_stem = Path(filename).stem
            txt_file = Path(output_labels_dir) / f"{image_stem}.txt"
            with open(txt_file, "w") as f:
                for ann in anns:
                    line = f"{ann['class_id']} {ann['x_center']:.6f} {ann['y_center']:.6f} {ann['width']:.6f} {ann['height']:.6f}\n"
                    f.write(line)

    print(f"Converted JSON annotations for {len(annotations)} images to YOLO format")

    return annotations


def split_dataset(
    images_dir: str,
    labels_dir: str,
    output_dir: str,
    train_ratio: float = 0.7,
    val_ratio: float = 0.2,
    test_ratio: float = 0.1,
    balanced: bool = False,
):
    """
    Split dataset into train/val/test sets.

    Args:
        images_dir: Directory containing all images
        labels_dir: Directory containing all label .txt files
        output_dir: Output directory for split dataset
        train_ratio: Ratio for training set
        val_ratio: Ratio for validation set
        test_ratio: Ratio for test set
    """
    output_path = Path(output_dir)
    images_out = output_path / "images"
    labels_out = output_path / "labels"

    # Get all image files
    image_files = []
    for ext in [".jpg", ".jpeg", ".png"]:
        image_files.extend(list(Path(images_dir).glob(f"**/*{ext}")))

    # Filter to images that have corresponding label files
    labeled_images = []
    for img_path in image_files:
        label_path = Path(labels_dir) / f"{img_path.stem}.txt"
        if label_path.exists():
            labeled_images.append(img_path)

    if not labeled_images:
        print("[yellow]No labeled images found for splitting[/yellow]")
        return

    if balanced:
        # Balanced split: group by class and split proportionally
        class_images = defaultdict(list)
        for img_path in labeled_images:
            label_path = Path(labels_dir) / f"{img_path.stem}.txt"
            try:
                with open(label_path, "r") as f:
                    first_line = f.readline().strip()
                    if first_line:
                        class_id = int(first_line.split()[0])
                        class_images[class_id].append(img_path)
            except (ValueError, IndexError, FileNotFoundError):
                continue

        train_files, val_files, test_files = [], [], []
        for class_id, imgs in class_images.items():
            if len(imgs) < 3:  # Need at least one for each split
                # If too few, put all in train
                train_files.extend(imgs)
                continue
            # Split this class
            class_train, temp = train_test_split(
                imgs, test_size=(val_ratio + test_ratio), random_state=42
            )
            class_val, class_test = train_test_split(
                temp, test_size=(test_ratio / (val_ratio + test_ratio)), random_state=42
            )
            train_files.extend(class_train)
            val_files.extend(class_val)
            test_files.extend(class_test)
    else:
        # Original random split
        train_files, temp_files = train_test_split(
            labeled_images, test_size=(val_ratio + test_ratio), random_state=42
        )
        val_files, test_files = train_test_split(
            temp_files, test_size=(test_ratio / (val_ratio + test_ratio)), random_state=42
        )

    # Copy files
    for split_name, files in [("train", train_files), ("val", val_files), ("test", test_files)]:
        img_dest = images_out / split_name
        label_dest = labels_out / split_name
        img_dest.mkdir(parents=True, exist_ok=True)
        label_dest.mkdir(parents=True, exist_ok=True)

        for img_path in files:
            # Copy image
            shutil.copy2(img_path, img_dest / img_path.name)
            # Copy label
            label_path = Path(labels_dir) / f"{img_path.stem}.txt"
            if label_path.exists():
                shutil.copy2(label_path, label_dest / label_path.name)

    print(
        f"Split dataset ({'balanced' if balanced else 'random'}): {len(train_files)} train, {len(val_files)} val, {len(test_files)} test images"
    )


def run_yolo_autolabel(
    input_folder: str,
    output_csv: str,
    model_name: str = "yolov8n.pt",
    limit: int = 0,
    confidence_threshold: float = 0.5,
    labels_dir: Optional[str] = None,
) -> Optional[int]:
    """Run YOLO auto-labeling on images and save results to CSV."""
    print(f"[cyan]Loading YOLO model: {model_name}[/cyan]")

    try:
        model = YOLO(model_name)
        print("[green]YOLO model loaded successfully![/green]")
    except Exception as e:
        error_msg = str(e)
        if "weights_only" in error_msg:
            print("[yellow]PyTorch 2.6+ detected, attempting to load with safe globals...[/yellow]")
            try:
                # Handle PyTorch 2.6+ weights_only issue by allowing comprehensive set of classes
                import torch.serialization
                import torch.nn as nn

                # Add comprehensive list of PyTorch classes
                safe_classes = [
                    nn.Sequential,
                    nn.Conv2d,
                    nn.BatchNorm2d,
                    nn.ReLU,
                    nn.Linear,
                    nn.AdaptiveAvgPool2d,
                    nn.MaxPool2d,
                    nn.Upsample,
                    nn.ModuleList,
                    nn.ModuleDict,
                    nn.SiLU,
                    nn.Identity,
                    nn.Dropout,
                    nn.Flatten,
                    nn.Concatenate,
                ]

                # Use context manager for safe loading
                with torch.serialization.safe_globals(safe_classes):
                    model = YOLO(model_name)
                print("[green]YOLO model loaded successfully with safe globals![/green]")
            except Exception as e2:
                print(f"[red]Failed to load model with safe globals: {e2}[/red]")
                return None
        else:
            print(f"[red]Failed to load YOLO model: {e}[/red]")
            return None

    print(f"[cyan]Running auto-labeling on {input_folder}[/cyan]")

    # Collect all image paths
    try:
        image_paths = collect_image_paths(input_folder)
    except FileNotFoundError as e:
        logger.error(str(e))
        print(f"[red]{e}[/red]")
        return None

    if not image_paths:
        logger.warning(f"No images found in {input_folder}")
        print(f"[yellow]No images found in {input_folder}[/yellow]")
        return None

    # Apply limit if requested
    if limit and limit > 0:
        image_paths = image_paths[:limit]

    print(f"[cyan]Processing {len(image_paths)} images with {model_name}[/cyan]")

    # Prepare CSV file or labels dir
    if labels_dir is None:
        os.makedirs(os.path.dirname(output_csv) or ".", exist_ok=True)
        try:
            csvfile = open(output_csv, "w", newline="")
            csv_writer = csv.DictWriter(
                csvfile,
                fieldnames=[
                    "filename",
                    "x_center",
                    "y_center",
                    "width",
                    "height",
                    "confidence",
                    "class_id",
                ],
            )
            csv_writer.writeheader()
        except IOError as e:
            logger.error(f"Failed to open CSV file: {e}")
            return None
    else:
        os.makedirs(labels_dir, exist_ok=True)
        detections = []  # List to collect detections

    processed_count = 0
    CHUNK_SIZE = 50

    try:
        for chunk_start in range(0, len(image_paths), CHUNK_SIZE):
            chunk_paths = image_paths[chunk_start : chunk_start + CHUNK_SIZE]
            try:
                results_iterator = model.predict(
                    chunk_paths,
                    save=False,
                    save_conf=True,
                    verbose=False,
                    stream=True,
                    workers=0,
                    batch=1,
                )
            except Exception as e:
                logger.error(f"YOLO prediction failed for chunk: {e}")
                continue

            for result in results_iterator:
                image_path = str(result.path)
                # Store relative path from input folder instead of just basename
                try:
                    filename = os.path.relpath(image_path, input_folder)
                except ValueError:
                    # Fallback to basename if relpath fails
                    filename = os.path.basename(image_path)

                if result.boxes is not None:
                    for box in result.boxes:
                        bbox = box.xywhn[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())

                        if confidence >= confidence_threshold:
                            # Extract folder name from filename (e.g., "glass/image.jpg" -> "glass")
                            folder_name = (
                                Path(filename).parent.name if Path(filename).parent.name else ""
                            )
                            waste_class_id = map_folder_to_waste_class(folder_name)
                            detection = {
                                "filename": filename,
                                "x_center": float(bbox[0]),
                                "y_center": float(bbox[1]),
                                "width": float(bbox[2]),
                                "height": float(bbox[3]),
                                "confidence": confidence,
                                "class_id": waste_class_id,
                            }
                            if labels_dir is None:
                                csv_writer.writerow(detection)
                            else:
                                detections.append(detection)

                processed_count += 1

            if processed_count % 1000 == 0:
                print(f"[cyan]Processed {processed_count}/{len(image_paths)} images...[/cyan]")

    finally:
        if labels_dir is None:
            csvfile.close()

    # If writing to labels_dir, create .txt files
    if labels_dir is not None:
        annotations = defaultdict(list)
        for det in detections:
            annotations[det["filename"]].append(det)

        for filename, anns in annotations.items():
            image_stem = Path(filename).stem
            txt_file = Path(labels_dir) / f"{image_stem}.txt"
            with open(txt_file, "w") as f:
                for ann in anns:
                    line = f"{ann['class_id']} {ann['x_center']:.6f} {ann['y_center']:.6f} {ann['width']:.6f} {ann['height']:.6f}\n"
                    f.write(line)
        print(f"Created YOLO .txt files for {len(annotations)} images directly")

    print(
        f"[green]Auto-labeling complete! {'Saved detections to ' + output_csv if labels_dir is None else 'Created YOLO labels directly'}[/green]"
    )
    return processed_count


def validate_labels(labels_dir: str) -> bool:
    """Validate YOLO label files."""
    print("[cyan]Validating YOLO labels...[/cyan]")
    valid = validate_yolo_labels(labels_dir)
    if valid:
        print("[green]All labels are valid![/green]")
    else:
        print("[red]Some labels have errors![/red]")
    return valid


def main() -> None:
    """Main entry point for auto-labeling script."""
    parser = argparse.ArgumentParser(
        description="Auto-label images using YOLO for bounding boxes and prepare YOLO dataset",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--input", type=str, default="../merged_dataset", help="Input folder containing images"
    )
    parser.add_argument(
        "--output-csv",
        type=str,
        default="yolo_labels.csv",
        help="Output CSV file for bounding box labels",
    )
    parser.add_argument(
        "--output-dataset",
        type=str,
        default="yolo_dataset",
        help="Output directory for prepared YOLO dataset",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="YOLO model to use",
    )
    parser.add_argument(
        "--convert-csv",
        type=str,
        help="Convert existing CSV to YOLO format instead of running auto-labeling",
    )
    parser.add_argument(
        "--convert-json",
        type=str,
        help="Convert existing JSON to YOLO format instead of running auto-labeling",
    )
    parser.add_argument(
        "--confidence-threshold",
        type=float,
        default=0.5,
        help="Minimum confidence threshold for detections",
    )
    parser.add_argument(
        "--train-ratio",
        type=float,
        default=0.7,
        help="Ratio of data for training",
    )
    parser.add_argument(
        "--val-ratio",
        type=float,
        default=0.2,
        help="Ratio of data for validation",
    )
    parser.add_argument(
        "--test-ratio",
        type=float,
        default=0.1,
        help="Ratio of data for testing",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Limit images processed (0 means all)",
    )
    parser.add_argument(
        "--no-csv",
        action="store_true",
        help="Skip CSV generation and create YOLO .txt files directly",
    )
    parser.add_argument(
        "--balanced",
        action="store_true",
        help="Create balanced dataset by ensuring proportional class distribution in train/val/test splits",
    )

    args = parser.parse_args()

    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # Validate inputs
    if not os.path.exists(args.input):
        logger.error(f"Input folder does not exist: {args.input}")
        return

    # Either run auto-labeling or convert existing annotations
    if args.convert_csv:
        print(f"[cyan]Converting CSV {args.convert_csv} to YOLO format[/cyan]")
        annotations = convert_csv_to_yolo_txt(
            args.convert_csv, args.input, f"{args.output_dataset}/labels", args.confidence_threshold
        )
        split_dataset(
            args.input,
            f"{args.output_dataset}/labels",
            args.output_dataset,
            args.train_ratio,
            args.val_ratio,
            args.test_ratio,
            args.balanced,
        )
    elif args.convert_json:
        print(f"[cyan]Converting JSON {args.convert_json} to YOLO format[/cyan]")
        annotations = convert_json_to_yolo_txt(
            args.convert_json, args.input, f"{args.output_dataset}/labels"
        )
        split_dataset(
            args.input,
            f"{args.output_dataset}/labels",
            args.output_dataset,
            args.train_ratio,
            args.val_ratio,
            args.test_ratio,
            args.balanced,
        )
    else:
        # Run auto-labeling
        labels_output_dir = f"{args.output_dataset}/labels" if args.no_csv else None
        results = run_yolo_autolabel(
            args.input,
            args.output_csv,
            args.model,
            args.limit,
            args.confidence_threshold,
            labels_output_dir,
        )
        if results:
            if not args.no_csv:
                # Convert the generated CSV to YOLO format
                annotations = convert_csv_to_yolo_txt(
                    args.output_csv,
                    args.input,
                    f"{args.output_dataset}/labels",
                    args.confidence_threshold,
                )
            split_dataset(
                args.input,
                f"{args.output_dataset}/labels",
                args.output_dataset,
                args.train_ratio,
                args.val_ratio,
                args.test_ratio,
                args.balanced,
            )

    # Validate labels
    if os.path.exists(f"{args.output_dataset}/labels"):
        validate_labels(f"{args.output_dataset}/labels")

    print("\n[bold green]YOLO dataset preparation complete![/bold green]")
    print(f"[cyan]Dataset saved to: {args.output_dataset}[/cyan]")
    print("[cyan]Next steps:[/cyan]")
    print("1. Review the label files for quality")
    print("2. Run train_yolo_detector.py to train the model")
    print("3. Use export_to_tflite.py for mobile deployment")


if __name__ == "__main__":
    main()
