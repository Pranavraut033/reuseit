#!/usr/bin/env python
"""Train YOLOv8 object detection model for waste classification."""

import os
import argparse
from pathlib import Path
from ultralytics import YOLO
from rich import print
import torch


def train_yolo_detector(
    data_yaml: str = "data.yaml",
    model_name: str = "yolov8n.pt",
    epochs: int = 100,
    imgsz: int = 640,
    batch: int = 16,
    project: str = "yolo_training_results",
    name: str = "waste_detector",
    save: bool = True,
    **kwargs,
):
    """
    Train YOLOv8 model for waste object detection.

    Args:
        data_yaml: Path to data.yaml configuration file
        model_name: YOLO model to use (yolov8n.pt, yolov8s.pt, etc.)
        epochs: Number of training epochs
        imgsz: Image size for training
        batch: Batch size
        project: Project directory for saving results
        name: Experiment name
        save: Whether to save the model
        **kwargs: Additional arguments for YOLO training
    """
    print(f"[cyan]Starting YOLO training with {model_name}[/cyan]")
    print(f"[cyan]Data config: {data_yaml}[/cyan]")
    print(f"[cyan]Epochs: {epochs}, Image size: {imgsz}, Batch size: {batch}[/cyan]")

    # Check if data.yaml exists
    if not os.path.exists(data_yaml):
        print(f"[red]Error: data.yaml not found at {data_yaml}[/red]")
        return None

    # Load model
    try:
        model = YOLO(model_name)
        print("[green]Model loaded successfully![/green]")
    except Exception as e:
        error_msg = str(e)
        if "weights_only" in error_msg:
            print(
                "[yellow]PyTorch 2.6+ detected, attempting to load with comprehensive safe globals...[/yellow]"
            )
            try:
                # Handle PyTorch 2.6+ weights_only issue by allowing comprehensive set of classes
                import torch.serialization
                import torch.nn as nn
                from ultralytics.nn.tasks import DetectionModel

                # Add comprehensive list of PyTorch and ultralytics classes
                safe_classes = [
                    DetectionModel,
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
                    nn.Concat,
                    nn.Concatenate,
                ]

                # Use context manager for safe loading
                with torch.serialization.safe_globals(safe_classes):
                    model = YOLO(model_name)
                print("[green]Model loaded successfully with safe globals![/green]")
            except Exception as e2:
                print(f"[red]Failed to load model with safe globals: {e2}[/red]")
                print(
                    "[yellow]This may be due to Ultralytics library compatibility. Consider updating Ultralytics:[/yellow]"
                )
                print("[cyan]pip install --upgrade ultralytics[/cyan]")
                return None
        else:
            print(f"[red]Failed to load model {model_name}: {e}[/red]")
            return None

    # Train the model
    try:
        results = model.train(
            data=data_yaml,
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            project=project,
            name=name,
            save=save,
            **kwargs,
        )
        print("[green]Training completed successfully![/green]")

        # Print results summary
        if hasattr(results, "best"):
            best_model_path = results.best
            print(f"[green]Best model saved at: {best_model_path}[/green]")

        return results

    except Exception as e:
        print(f"[red]Training failed: {e}[/red]")
        return None


def evaluate_model(model_path: str, data_yaml: str = "data.yaml"):
    """
    Evaluate trained YOLO model.

    Args:
        model_path: Path to trained model weights
        data_yaml: Path to data configuration
    """
    print(f"[cyan]Evaluating model: {model_path}[/cyan]")

    try:
        model = YOLO(model_path)

        # Run validation
        results = model.val(data=data_yaml)

        print("[green]Evaluation completed![/green]")
        print(f"[cyan]Results: {results}[/cyan]")

        return results

    except Exception as e:
        error_msg = str(e)
        if "weights_only" in error_msg and "DetectionModel" in error_msg:
            print(
                "[yellow]PyTorch 2.6+ detected, attempting evaluation with safe globals...[/yellow]"
            )
            try:
                import torch.serialization
                from ultralytics.nn.tasks import DetectionModel

                torch.serialization.add_safe_globals([DetectionModel])
                model = YOLO(model_path)
                results = model.val(data=data_yaml)
                print("[green]Evaluation completed with safe globals![/green]")
                print(f"[cyan]Results: {results}[/cyan]")
                return results
            except Exception as e2:
                print(f"[red]Evaluation failed even with safe globals: {e2}[/red]")
                return None
        else:
            print(f"[red]Evaluation failed: {e}[/red]")
            return None


def generate_confusion_matrix(
    model_path: str, data_yaml: str = "data.yaml", save_dir: str = "confusion_matrix"
):
    """
    Generate confusion matrix for the trained model.

    Args:
        model_path: Path to trained model
        data_yaml: Data configuration
        save_dir: Directory to save confusion matrix
    """
    print(f"[cyan]Generating confusion matrix for {model_path}[/cyan]")

    try:
        model = YOLO(model_path)

        # Run validation with confusion matrix
        results = model.val(data=data_yaml, conf=0.25, iou=0.6, save_json=True, plots=True)

        # Confusion matrix is automatically saved during validation
        print(f"[green]Confusion matrix saved to results directory[/green]")

        return results

    except Exception as e:
        error_msg = str(e)
        if "weights_only" in error_msg and "DetectionModel" in error_msg:
            print(
                "[yellow]PyTorch 2.6+ detected, attempting confusion matrix generation with safe globals...[/yellow]"
            )
            try:
                import torch.serialization
                from ultralytics.nn.tasks import DetectionModel

                torch.serialization.add_safe_globals([DetectionModel])
                model = YOLO(model_path)
                results = model.val(data=data_yaml, conf=0.25, iou=0.6, save_json=True, plots=True)
                print(f"[green]Confusion matrix saved to results directory[/green]")
                return results
            except Exception as e2:
                print(
                    f"[red]Failed to generate confusion matrix even with safe globals: {e2}[/red]"
                )
                return None
        else:
            print(f"[red]Failed to generate confusion matrix: {e}[/red]")
            return None


def main():
    """Main entry point for training script."""
    import torch

    parser = argparse.ArgumentParser(
        description="Train YOLOv8 model for waste object detection",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--data",
        type=str,
        default="data.yaml",
        help="Path to data.yaml configuration file",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="YOLO model to use (yolov8n.pt, yolov8s.pt, yolov8m.pt, etc.)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Number of training epochs",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Image size for training",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size",
    )
    parser.add_argument(
        "--project",
        type=str,
        default="yolo_training_results",
        help="Project directory for saving results",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="waste_detector",
        help="Experiment name",
    )
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="Run evaluation after training",
    )
    parser.add_argument(
        "--confusion-matrix",
        action="store_true",
        help="Generate confusion matrix after training",
    )
    parser.add_argument(
        "--resume",
        type=str,
        help="Resume training from checkpoint",
    )

    args = parser.parse_args()

    # Check for MPS (Metal Performance Shaders) availability on Apple Silicon
    device = 'cpu'
    if torch.backends.mps.is_available():
        device = 'mps'
        print("[green]MPS (GPU) available - using Metal Performance Shaders[/green]")
    else:
        print("[yellow]MPS not available - using CPU[/yellow]")

    # Train the model
    if args.resume:
        print(f"[cyan]Resuming training from {args.resume}[/cyan]")
        try:
            model = YOLO(args.resume)
            results = model.train(resume=True, device=device)
        except Exception as e:
            error_msg = str(e)
            if "weights_only" in error_msg and "DetectionModel" in error_msg:
                print(
                    "[yellow]PyTorch 2.6+ detected, attempting resume with safe globals...[/yellow]"
                )
                try:
                    import torch.serialization
                    from ultralytics.nn.tasks import DetectionModel

                    torch.serialization.add_safe_globals([DetectionModel])
                    model = YOLO(args.resume)
                    results = model.train(resume=True, device=device)
                except Exception as e2:
                    print(f"[red]Failed to resume training even with safe globals: {e2}[/red]")
                    return
            else:
                print(f"[red]Failed to resume training: {e}[/red]")
                return
    else:
        results = train_yolo_detector(
            data_yaml=args.data,
            model_name=args.model,
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            project=args.project,
            name=args.name,
            device=device,
        )

    if results is None:
        return

    # Find the best model path
    if hasattr(results, "save_dir"):
        best_model_path = Path(results.save_dir) / "weights" / "best.pt"
    else:
        # Fallback: look in project/name/weights/
        best_model_path = Path(args.project) / args.name / "weights" / "best.pt"

    if not best_model_path.exists():
        print(f"[yellow]Best model not found at expected location: {best_model_path}[/yellow]")
        # Try to find any .pt file in the results
        pt_files = list(Path(args.project).rglob("*.pt"))
        if pt_files:
            best_model_path = pt_files[0]
            print(f"[cyan]Using model: {best_model_path}[/cyan]")
        else:
            print("[red]No trained model found![/red]")
            return

    # Run evaluation if requested
    if args.evaluate:
        evaluate_model(str(best_model_path), args.data)

    # Generate confusion matrix if requested
    if args.confusion_matrix:
        generate_confusion_matrix(str(best_model_path), args.data)

    print("\n[bold green]Training workflow complete![/bold green]")
    print(f"[cyan]Best model: {best_model_path}[/cyan]")
    print("[cyan]Next steps:[/cyan]")
    print("1. Review training results and metrics")
    print("2. Run export_to_tflite.py to export for mobile deployment")
    print("3. Test the exported model")


if __name__ == "__main__":
    main()
