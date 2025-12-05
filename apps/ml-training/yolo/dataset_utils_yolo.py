import os
import shutil
import csv
import random
from pathlib import Path
from typing import List, Dict, Tuple
from sklearn.model_selection import train_test_split

# Import from parent directory
import sys

sys.path.append(str(Path(__file__).parent.parent))
from dataset_utils import CANONICAL_CLASSES, normalize_label

# Class mapping for YOLO (0-7)
CLASS_TO_ID = {cls: idx for idx, cls in enumerate(CANONICAL_CLASSES)}


def prepare_yolo_dataset(
    input_dir: str,
    output_dir: str,
    train_ratio: float = 0.7,
    val_ratio: float = 0.2,
    test_ratio: float = 0.1,
    csv_file: str = None,
) -> str:
    """
    Prepare YOLO-format dataset from classification dataset or CSV annotations.

    Args:
        input_dir: Directory containing images (in class folders) or path to images if using CSV
        output_dir: Output directory for YOLO dataset
        train_ratio: Ratio of data for training
        val_ratio: Ratio of data for validation
        test_ratio: Ratio of data for testing
        csv_file: Path to CSV file with annotations (filename, x_center, y_center, width, height, confidence, class_id)
                  If None, assumes classification dataset and creates full-image bounding boxes

    Returns:
        Path to the prepared dataset directory
    """
    output_path = Path(output_dir)
    images_dir = output_path / "images"
    labels_dir = output_path / "labels"

    # Create directories
    for split in ["train", "val", "test"]:
        (images_dir / split).mkdir(parents=True, exist_ok=True)
        (labels_dir / split).mkdir(parents=True, exist_ok=True)

    if csv_file and Path(csv_file).exists():
        # Use CSV annotations
        return _prepare_from_csv(
            csv_file, input_dir, output_dir, train_ratio, val_ratio, test_ratio
        )
    else:
        # Assume classification dataset, create full-image bounding boxes
        return _prepare_from_classification(
            input_dir, output_dir, train_ratio, val_ratio, test_ratio
        )


def _prepare_from_csv(
    csv_file: str,
    images_dir: str,
    output_dir: str,
    train_ratio: float,
    val_ratio: float,
    test_ratio: float,
) -> str:
    """Prepare dataset from CSV annotations file."""
    output_path = Path(output_dir)
    images_out_dir = output_path / "images"
    labels_out_dir = output_path / "labels"

    # Read CSV and group by filename
    annotations = {}
    with open(csv_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row["filename"]
            if filename not in annotations:
                annotations[filename] = []
            annotations[filename].append(
                {
                    "class_id": int(row["class_id"]),
                    "x_center": float(row["x_center"]),
                    "y_center": float(row["y_center"]),
                    "width": float(row["width"]),
                    "height": float(row["height"]),
                    "confidence": float(row["confidence"]),
                }
            )

    # Get all image files
    image_files = []
    for ext in [".jpg", ".jpeg", ".png"]:
        image_files.extend(Path(images_dir).rglob(f"*{ext}"))

    # Filter to only images that have annotations
    annotated_images = []
    for img_path in image_files:
        filename = img_path.name
        if filename in annotations:
            annotated_images.append(img_path)

    # Split into train/val/test
    train_files, temp_files = train_test_split(
        annotated_images, test_size=(val_ratio + test_ratio), random_state=42
    )
    val_files, test_files = train_test_split(
        temp_files, test_size=(test_ratio / (val_ratio + test_ratio)), random_state=42
    )

    # Copy images and create label files
    _copy_images_and_labels(
        train_files, annotations, images_out_dir / "train", labels_out_dir / "train"
    )
    _copy_images_and_labels(val_files, annotations, images_out_dir / "val", labels_out_dir / "val")
    _copy_images_and_labels(
        test_files, annotations, images_out_dir / "test", labels_out_dir / "test"
    )

    print(
        f"Prepared YOLO dataset with {len(train_files)} train, {len(val_files)} val, {len(test_files)} test images"
    )
    return str(output_path)


def _prepare_from_classification(
    input_dir: str, output_dir: str, train_ratio: float, val_ratio: float, test_ratio: float
) -> str:
    """Prepare dataset from classification folders, creating full-image bounding boxes."""
    output_path = Path(output_dir)
    images_out_dir = output_path / "images"
    labels_out_dir = output_path / "labels"

    all_images = []

    # Collect images from class folders
    for class_name in CANONICAL_CLASSES:
        class_dir = Path(input_dir) / class_name
        if not class_dir.exists():
            continue

        class_id = CLASS_TO_ID[class_name]

        for img_path in class_dir.glob("*"):
            if img_path.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                all_images.append((img_path, class_id))

    # Split into train/val/test
    train_files, temp_files = train_test_split(
        all_images, test_size=(val_ratio + test_ratio), random_state=42
    )
    val_files, test_files = train_test_split(
        temp_files, test_size=(test_ratio / (val_ratio + test_ratio)), random_state=42
    )

    # Copy images and create label files with full-image bounding boxes
    _copy_classification_images(train_files, images_out_dir / "train", labels_out_dir / "train")
    _copy_classification_images(val_files, images_out_dir / "val", labels_out_dir / "val")
    _copy_classification_images(test_files, images_out_dir / "test", labels_out_dir / "test")

    print(
        f"Prepared YOLO dataset from classification with {len(train_files)} train, {len(val_files)} val, {len(test_files)} test images"
    )
    return str(output_path)


def _copy_images_and_labels(
    image_files: List[Path], annotations: Dict, images_dest: Path, labels_dest: Path
):
    """Copy images and create corresponding YOLO label files."""
    for img_path in image_files:
        filename = img_path.name
        stem = img_path.stem

        # Copy image
        shutil.copy2(img_path, images_dest / filename)

        # Create label file
        label_file = labels_dest / f"{stem}.txt"
        with open(label_file, "w") as f:
            for ann in annotations[filename]:
                # YOLO format: class x_center y_center width height
                line = "04d"
                f.write(line)


def _copy_classification_images(
    image_class_pairs: List[Tuple[Path, int]], images_dest: Path, labels_dest: Path
):
    """Copy images and create label files with full-image bounding boxes."""
    for img_path, class_id in image_class_pairs:
        filename = img_path.name
        stem = img_path.stem

        # Copy image
        shutil.copy2(img_path, images_dest / filename)

        # Create label file with full-image bbox (normalized coordinates)
        label_file = labels_dest / f"{stem}.txt"
        with open(label_file, "w") as f:
            # Full image bounding box: class 0.5 0.5 1.0 1.0
            f.write(f"{class_id} 0.5 0.5 1.0 1.0\n")


def validate_yolo_labels(labels_dir: str) -> bool:
    """Validate YOLO label files for correct format and class IDs."""
    valid = True
    for txt_file in Path(labels_dir).rglob("*.txt"):
        with open(txt_file, "r") as f:
            for line_num, line in enumerate(f, 1):
                parts = line.strip().split()
                if len(parts) != 5:
                    print(
                        f"Invalid format in {txt_file}:{line_num} - expected 5 values, got {len(parts)}"
                    )
                    valid = False
                    continue

                try:
                    class_id = int(parts[0])
                    x, y, w, h = map(float, parts[1:])

                    if class_id < 0 or class_id >= len(CANONICAL_CLASSES):
                        print(f"Invalid class_id {class_id} in {txt_file}:{line_num}")
                        valid = False

                    if not all(0 <= val <= 1 for val in [x, y, w, h]):
                        print(f"Coordinates out of range [0,1] in {txt_file}:{line_num}")
                        valid = False

                except ValueError as e:
                    print(f"Parse error in {txt_file}:{line_num}: {e}")
                    valid = False

    return valid


# Export functions
__all__ = ["prepare_yolo_dataset", "validate_yolo_labels", "CANONICAL_CLASSES", "CLASS_TO_ID"]
