#!/usr/bin/env python
"""Test YOLOv8 model inference on images or camera feed."""

import os
import argparse
import cv2
from pathlib import Path
from ultralytics import YOLO
import torch


def load_model(model_path: str):
    """
    Load YOLO model with safe globals handling for PyTorch 2.6+.

    Args:
        model_path: Path to the model weights file

    Returns:
        Loaded YOLO model
    """
    print(f"Loading model from {model_path}")

    try:
        model = YOLO(model_path)
        print("Model loaded successfully!")
        return model
    except Exception as e:
        error_msg = str(e)
        if "weights_only" in error_msg and "DetectionModel" in error_msg:
            print("PyTorch 2.6+ detected, attempting to load with safe globals...")
            try:
                import torch.serialization
                from ultralytics.nn.tasks import DetectionModel

                # Add safe globals
                torch.serialization.add_safe_globals([DetectionModel])
                model = YOLO(model_path)
                print("Model loaded successfully with safe globals!")
                return model
            except Exception as e2:
                print(f"Failed to load model with safe globals: {e2}")
                return None
        else:
            print(f"Failed to load model: {e}")
            return None


def predict_on_image(model, image_path: str, conf: float = 0.25, save: bool = False):
    """
    Run inference on a single image.

    Args:
        model: Loaded YOLO model
        image_path: Path to the image file
        conf: Confidence threshold
        save: Whether to save the result
    """
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        return

    print(f"Running inference on image: {image_path}")

    # Run prediction
    results = model.predict(source=image_path, conf=conf, save=save, show=False)

    # Display results
    for result in results:
        print(f"Detections: {len(result.boxes)} objects")
        if len(result.boxes) > 0:
            for box in result.boxes:
                cls = int(box.cls.item())
                conf_val = box.conf.item()
                class_name = model.names[cls]
                print(f"  - {class_name}: {conf_val:.2f}")

        # Show image with detections
        img = result.plot()
        cv2.imshow("YOLO Detection", img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()


def predict_on_camera(model, conf: float = 0.25):
    """
    Run real-time inference on camera feed.

    Args:
        model: Loaded YOLO model
        conf: Confidence threshold
    """
    print("Starting camera inference... Press 'q' to quit")

    # Open camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Cannot open camera")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        # Run inference
        results = model.predict(source=frame, conf=conf, show=False, verbose=False)

        # Draw detections on frame
        for result in results:
            annotated_frame = result.plot()

        # Display the frame
        cv2.imshow("YOLO Camera Detection", annotated_frame)

        # Break loop on 'q' key
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Camera inference stopped")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test YOLOv8 model inference on images or camera",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolo_training/yolo_training_results/waste_detector2/weights/best.pt",
        help="Path to trained model weights",
    )
    parser.add_argument(
        "--image",
        type=str,
        help="Path to image file for testing",
    )
    parser.add_argument(
        "--camera",
        action="store_true",
        help="Test on camera feed",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.25,
        help="Confidence threshold for detections",
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Save prediction results (for image mode)",
    )

    args = parser.parse_args()

    # Load model
    model = load_model(args.model)
    if model is None:
        return

    # Run inference
    if args.image:
        predict_on_image(model, args.image, args.conf, args.save)
    elif args.camera:
        predict_on_camera(model, args.conf)
    else:
        print("Please specify --image <path> or --camera")


if __name__ == "__main__":
    main()
