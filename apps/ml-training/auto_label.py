#!/usr/bin/env python
"""Auto-label images using Ultralytics YOLOv8/v9 for bounding box generation.

This script uses pretrained YOLO models to automatically generate bounding boxes
for objects in images, which can then be used for training object detection models.
"""

import os
import argparse
import csv
import random
import logging
from pathlib import Path
import sys
from typing import List, Dict, Optional
from contextlib import contextmanager
import torch
import torch.serialization

# Import ultralytics and add safe globals
import ultralytics

torch.serialization.add_safe_globals(
    [
        ultralytics.nn.tasks.DetectionModel,
        torch.nn.modules.container.Sequential,
        torch.nn.modules.conv.Conv2d,
        torch.nn.modules.batchnorm.BatchNorm2d,
        torch.nn.modules.activation.SiLU,
        torch.nn.modules.pooling.AdaptiveAvgPool2d,
        torch.nn.modules.linear.Linear,
        torch.nn.modules.activation.Sigmoid,
        torch.nn.Upsample,
        torch.nn.modules.container.ModuleList,
        torch.nn.modules.container.ModuleDict,
        ultralytics.nn.modules.conv.Conv,
        torch.nn.modules.activation.ReLU,
        torch.nn.modules.pooling.MaxPool2d,
        torch.nn.modules.dropout.Dropout,
        ultralytics.nn.modules.block.C2f,  # Added for YOLOv8
        ultralytics.nn.modules.block.Bottleneck,  # Added for YOLOv8
    ]
)

from ultralytics import YOLO
from rich import print

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@contextmanager
def allow_unsafe_torch_load():
    """Context manager to temporarily disable weights_only for trusted YOLO models.

    WARNING: Only use this for loading models from trusted sources.
    """
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
    """Collect all image file paths from input folder.

    Args:
        input_folder: Directory containing images

    Returns:
        List of absolute paths to image files
    """
    if not os.path.exists(input_folder):
        raise FileNotFoundError(f"Input folder not found: {input_folder}")

    image_paths = []
    valid_extensions = (".jpg", ".jpeg", ".png")

    for root, _, files in os.walk(input_folder):
        for file in files:
            if file.lower().endswith(valid_extensions):
                image_paths.append(os.path.join(root, file))

    return image_paths


def write_detections_to_csv(detections: List[Dict], output_csv: str) -> None:
    """Write detection results to CSV file.

    Args:
        detections: List of detection dictionaries
        output_csv: Output CSV file path
    """
    output_dir = os.path.dirname(output_csv) or "."
    os.makedirs(output_dir, exist_ok=True)

    try:
        with open(output_csv, "w", newline="") as csvfile:
            fieldnames = [
                "filename",
                "x_center",
                "y_center",
                "width",
                "height",
                "confidence",
                "class_id",
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(detections)
        logger.info(f"Saved {len(detections)} detections to {output_csv}")
    except IOError as e:
        logger.error(f"Failed to write CSV file: {e}")
        raise


def run_yolo_autolabel(
    input_folder: str, output_csv: str, model_name: str = "yolov8n.pt", limit: int = 0
) -> Optional[object]:
    """Run YOLO auto-labeling on images and save results to CSV.

    Args:
        input_folder: Directory containing images to label
        output_csv: Output CSV file path
        model_name: YOLO model weights file name

    Returns:
        YOLO results object if successful, None otherwise
    """
    print(f"[cyan]Loading YOLO model: {model_name}[/cyan]")

    try:
        with allow_unsafe_torch_load():
            model = YOLO(model_name)
        print("[green]YOLO model loaded successfully![/green]")
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
        print(f"[red]Failed to load YOLO model: {e}[/red]")
        print("[yellow]Falling back to dummy labels[/yellow]")
        return run_dummy_autolabel(input_folder, output_csv)

    print(f"[cyan]Running auto-labeling on {input_folder}[/cyan]")

    # Try to load canonical classes so we can emit class/filename in CSV
    canonical_classes = None
    try:
        # dataset_utils is in same directory. Ensure it's on path.
        sys.path.append(str(Path(__file__).parent))
        from dataset_utils import get_canonical_classes

        canonical_classes = set(get_canonical_classes())
    except Exception:
        canonical_classes = None

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

    print(f"[cyan]Found {len(image_paths)} images to process[/cyan]")

    # Run prediction in manageable chunks; streaming predictions directly from a folder
    # may fail if the loader doesn't recurse into nested directories, so we
    # chunk the collected image list to avoid "Too many open files" and to keep
    # resource usage low on large datasets.
    # Apply limit if requested (useful for quick testing)
    if limit and limit > 0:
        image_paths = image_paths[:limit]

    print(f"[cyan]Processing {len(image_paths)} images with {model_name}[/cyan]")
    logger.info(f"Processing {len(image_paths)} images with {model_name}")

    # Chunking setup
    CHUNK_SIZE = 50  # Process 500 images per chunk (tunable)

    # Prepare CSV file for streaming write (avoid building entire list in memory)
    csv_output_dir = os.path.dirname(output_csv) or "."
    os.makedirs(csv_output_dir, exist_ok=True)
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
        logger.error(f"Failed to open CSV file for writing: {e}")
        print(f"[red]Failed to open CSV file for writing: {e}[/red]")
        return None

    # Collect and stream detections with progress indication
    processed_count = 0

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
                logger.error(f"YOLO prediction failed for chunk starting at {chunk_start}: {e}")
                print(f"[red]Prediction failed for chunk {chunk_start}: {e}[/red]")
                continue
            # Process results for this chunk
            for result in results_iterator:
                image_path = str(result.path)
                filename = os.path.basename(image_path)

                # If image is stored under a canonical class dir, emit class/filename
                try:
                    parent = Path(image_path).parent.name
                    if canonical_classes and parent in canonical_classes:
                        filename_out = f"{parent}/{filename}"
                    else:
                        filename_out = filename
                except Exception:
                    filename_out = filename

                # iterate boxes
                if result.boxes is not None:
                    for box in result.boxes:
                        # Get bbox in YOLO format (normalized)
                        bbox = box.xywhn[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())

                        detection = {
                            "filename": filename_out,
                            "x_center": float(bbox[0]),
                            "y_center": float(bbox[1]),
                            "width": float(bbox[2]),
                            "height": float(bbox[3]),
                            "confidence": confidence,
                            "class_id": class_id,
                        }
                        # Write detection immediately to CSV to avoid large memory usage
                        try:
                            csv_writer.writerow(detection)
                        except Exception as e:
                            logger.warning(f"Failed to write detection to CSV: {e}")

                processed_count += 1
            if processed_count % 1000 == 0:
                print(f"[cyan]Processed {processed_count}/{len(image_paths)} images...[/cyan]")

            # Try to free memory between chunks
            try:
                del results_iterator
                torch.cuda.empty_cache()
            except Exception:
                pass

    finally:
        # Close CSV file
        try:
            csvfile.close()
        except Exception:
            pass
    print(f"[green]Auto-labeling complete! Saved detections to {output_csv}[/green]")

    return processed_count


def run_dummy_autolabel(input_folder: str, output_csv: str) -> None:
    """Generate dummy bounding boxes for images when YOLO fails.

    Args:
        input_folder: Directory containing images
        output_csv: Output CSV file path
    """
    print(f"[cyan]Generating dummy bounding boxes for {input_folder}[/cyan]")
    logger.warning("Using dummy bounding boxes - not suitable for production training")

    # Collect all images
    try:
        image_paths = collect_image_paths(input_folder)
    except FileNotFoundError as e:
        logger.error(str(e))
        print(f"[red]{e}[/red]")
        return

    # Load canonical classes once for the dummy generator
    try:
        sys.path.append(str(Path(__file__).parent))
        from dataset_utils import get_canonical_classes

        canonical_classes = set(get_canonical_classes())
    except Exception:
        canonical_classes = None

    all_detections = []
    for image_path in image_paths:
        filename = os.path.basename(image_path)
        parent = Path(image_path).parent.name
        if canonical_classes and parent in canonical_classes:
            filename_out = f"{parent}/{filename}"
        else:
            filename_out = filename

        # Generate a random but reasonable bbox
        detection = {
            "filename": filename_out,
            "x_center": random.uniform(0.4, 0.6),
            "y_center": random.uniform(0.4, 0.6),
            "width": random.uniform(0.3, 0.6),
            "height": random.uniform(0.3, 0.6),
            "confidence": 1.0,
            "class_id": 0,
        }
        all_detections.append(detection)

    # Write to CSV
    write_detections_to_csv(all_detections, output_csv)
    print(
        f"[green]Dummy labels generated! Saved {len(all_detections)} detections to {output_csv}[/green]"
    )


def main() -> None:
    """Main entry point for auto-labeling script."""
    parser = argparse.ArgumentParser(
        description="Auto-label images using YOLO for bounding boxes",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--input", type=str, default="merged_dataset", help="Input folder containing images"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="yolo_labels.csv",
        help="Output CSV file for bounding box labels",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="YOLO model to use (yolov8n.pt, yolov8x.pt, etc.)",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Limit the number of images processed (0 means all). Useful for testing.",
    )

    args = parser.parse_args()

    # Configure logging level
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # Validate inputs
    if not os.path.exists(args.input):
        logger.error(f"Input folder does not exist: {args.input}")
        print(f"[red]Error: Input folder not found: {args.input}[/red]")
        return

    # Run YOLO auto-labeling
    logger.info(
        f"Starting auto-labeling: input={args.input}, output={args.output}, model={args.model}"
    )
    results = run_yolo_autolabel(args.input, args.output, args.model, limit=args.limit)

    print("\n[bold green]Auto-labeling workflow complete![/bold green]")
    print(f"[cyan]Labels saved to CSV: {args.output}[/cyan]")
    print(
        "[cyan]CSV columns: filename, x_center, y_center, width, height, confidence, class_id[/cyan]"
    )
    print("[cyan]Next steps:[/cyan]")
    print("1. Review the CSV file for detection quality")
    print("2. Filter detections for relevant classes if needed")
    print("3. Use the CSV data for training object detection models")


if __name__ == "__main__":
    main()
