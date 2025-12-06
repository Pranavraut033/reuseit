#!/usr/bin/env python3
"""
Test TFLite YOLO model with camera interface
"""

import cv2
import numpy as np
import tensorflow as tf
import argparse
import os
import time

# Class names for waste detection (from data.yaml)
CLASS_NAMES = [
    "paper_cardboard",
    "glass",
    "recyclables",
    "bio_waste",
    "textile_reuse",
    "electronics",
    "battery",
    "residual_waste",
]


def nms(boxes, scores, iou_threshold=0.5):
    """Apply Non-Maximum Suppression to filter overlapping boxes"""
    if len(boxes) == 0:
        return []

    # Convert to numpy arrays
    boxes = np.array(boxes)
    scores = np.array(scores)

    # Get coordinates
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]

    # Calculate areas
    areas = (x2 - x1) * (y2 - y1)

    # Sort by scores
    order = scores.argsort()[::-1]

    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)

        # Calculate IoU with remaining boxes
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])

        w = np.maximum(0, xx2 - xx1)
        h = np.maximum(0, yy2 - yy1)
        inter = w * h

        iou = inter / (areas[i] + areas[order[1:]] - inter)

        # Keep boxes with IoU less than threshold
        inds = np.where(iou <= iou_threshold)[0]
        order = order[inds + 1]

    return keep


def load_tflite_model(model_path):
    """Load TFLite model"""
    print(f"Loading TFLite model: {model_path}")
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    return interpreter


def preprocess_frame(frame, input_shape):
    """Preprocess camera frame for TFLite model with letterboxing"""
    # Convert BGR to RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Get target size
    target_h, target_w = input_shape[1], input_shape[2]

    # Get original dimensions
    orig_h, orig_w = rgb.shape[:2]

    # Calculate scale to fit the image inside the target size
    scale = min(target_w / orig_w, target_h / orig_h)
    new_w = int(orig_w * scale)
    new_h = int(orig_h * scale)

    # Resize maintaining aspect ratio
    resized = cv2.resize(rgb, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    # Create square canvas
    canvas = np.full((target_h, target_w, 3), 114, dtype=np.uint8)  # Gray padding like Ultralytics

    # Center the resized image on the canvas
    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2
    canvas[y_offset : y_offset + new_h, x_offset : x_offset + new_w] = resized

    # Normalize to [0, 1]
    normalized = canvas.astype(np.float32) / 255.0

    # Add batch dimension
    input_tensor = np.expand_dims(normalized, axis=0)

    return input_tensor


def postprocess_output(output, conf_threshold=0.25, input_shape=(640, 640), iou_threshold=0.5):
    """Postprocess YOLOv8 TFLite output to get detections"""
    detections = []

    if (
        output.shape[1] > 4 and len(output.shape) == 3
    ):  # YOLOv8 format: [1, num_classes+4, num_anchors]
        # Reshape to [num_anchors, num_classes+4]
        predictions = output[0].T  # Transpose to [num_anchors, num_classes+4]

        num_classes = output.shape[1] - 4  # Subtract 4 for bbox coordinates
        img_h, img_w = input_shape

        all_boxes = []
        all_scores = []
        all_classes = []

        for pred in predictions:
            if len(pred) >= 4 + num_classes:  # 4 bbox + num_classes
                # Extract bbox (center x, center y, width, height) - normalized
                cx, cy, w, h = pred[0:4]
                class_scores = pred[4 : 4 + num_classes]  # num_classes scores

                # Find best class
                class_id = int(np.argmax(class_scores))
                confidence = class_scores[class_id]

                if confidence > conf_threshold:
                    # Convert bbox to x1,y1,x2,y2
                    x1 = (cx - w / 2) * img_w
                    y1 = (cy - h / 2) * img_h
                    x2 = (cx + w / 2) * img_w
                    y2 = (cy + h / 2) * img_h

                    # Clip to image bounds
                    x1 = max(0, min(x1, img_w))
                    y1 = max(0, min(y1, img_h))
                    x2 = max(0, min(x2, img_w))
                    y2 = max(0, min(y2, img_h))

                    all_boxes.append([x1, y1, x2, y2])
                    all_scores.append(confidence)
                    all_classes.append(class_id)

        # Apply NMS
        if all_boxes:
            keep_indices = nms(all_boxes, all_scores, iou_threshold)
            for idx in keep_indices:
                detections.append(
                    {
                        "bbox": [
                            int(all_boxes[idx][0]),
                            int(all_boxes[idx][1]),
                            int(all_boxes[idx][2]),
                            int(all_boxes[idx][3]),
                        ],
                        "confidence": float(all_scores[idx]),
                        "class_id": all_classes[idx],
                    }
                )

    return detections


def draw_detections(frame, detections):
    """Draw bounding boxes on frame"""
    for det in detections:
        bbox = det["bbox"]
        conf = det["confidence"]
        class_id = det["class_id"]

        x1, y1, x2, y2 = bbox

        # Draw rectangle
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Draw label
        class_name = CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else f"Class {class_id}"
        label = f"{class_name}: {conf:.2f}"
        cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    return frame


def predict_on_image(interpreter, image_path, conf_threshold=0.25):
    """Run inference on a single image"""
    # Get input details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    input_shape = input_details[0]["shape"]

    # Load and preprocess image
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Could not load image: {image_path}")
        return None

    orig_h, orig_w = frame.shape[:2]
    model_h, model_w = input_shape[1], input_shape[2]

    input_tensor = preprocess_frame(frame, input_shape)

    # Run inference
    interpreter.set_tensor(input_details[0]["index"], input_tensor)
    interpreter.invoke()

    # Get output
    output = interpreter.get_tensor(output_details[0]["index"])

    # Postprocess
    detections = postprocess_output(output, conf_threshold, (model_w, model_h))

    # Scale detections back to original image size
    scale_x = orig_w / model_w
    scale_y = orig_h / model_h
    for det in detections:
        bbox = det["bbox"]
        det["bbox"] = [
            int(bbox[0] * scale_x),
            int(bbox[1] * scale_y),
            int(bbox[2] * scale_x),
            int(bbox[3] * scale_y),
        ]

    # Draw detections
    result_frame = draw_detections(frame.copy(), detections)

    return result_frame, detections


def predict_on_camera(interpreter, conf_threshold=0.25):
    """Run real-time inference on camera feed"""
    print("Starting TFLite camera inference... Press 'q' to quit")

    # Get input details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    input_shape = input_details[0]["shape"]

    print(f"Model input shape: {input_shape}")

    # Open camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Cannot open camera")
        return

    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    fps_counter = 0
    fps_start_time = time.time()
    fps = 0.0  # Initialize fps

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        # Preprocess frame
        input_tensor = preprocess_frame(frame, input_shape)

        # Run inference
        interpreter.set_tensor(input_details[0]["index"], input_tensor)
        interpreter.invoke()

        # Get output
        output = interpreter.get_tensor(output_details[0]["index"])

        # Postprocess
        detections = postprocess_output(output, conf_threshold, (input_shape[1], input_shape[2]))

        # Draw detections
        annotated_frame = draw_detections(frame.copy(), detections)

        # Calculate and display FPS
        fps_counter += 1
        if time.time() - fps_start_time > 1.0:
            fps = fps_counter / (time.time() - fps_start_time)
            fps_counter = 0
            fps_start_time = time.time()

        # Add FPS and detection count to frame
        cv2.putText(
            annotated_frame,
            f"FPS: {fps:.1f}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )
        cv2.putText(
            annotated_frame,
            f"Detections: {len(detections)}",
            (10, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )

        # Display the frame
        cv2.imshow("TFLite YOLO Camera Detection", annotated_frame)

        # Break loop on 'q' key
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Camera inference stopped")


def main():
    parser = argparse.ArgumentParser(description="Test TFLite YOLO model")
    parser.add_argument("--model", required=True, help="Path to TFLite model")
    parser.add_argument("--image", help="Path to test image (optional)")
    parser.add_argument("--camera", action="store_true", help="Use camera for real-time inference")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold")

    args = parser.parse_args()

    if not os.path.exists(args.model):
        print(f"Error: Model file not found: {args.model}")
        return

    try:
        interpreter = load_tflite_model(args.model)

        if args.camera:
            predict_on_camera(interpreter, args.conf)
        elif args.image:
            if not os.path.exists(args.image):
                print(f"Error: Image file not found: {args.image}")
                return

            result_frame, detections = predict_on_image(interpreter, args.image, args.conf)

            if result_frame is not None:
                # Save result
                output_path = args.image.replace(".jpg", "_tflite_result.jpg").replace(
                    ".png", "_tflite_result.png"
                )
                cv2.imwrite(output_path, result_frame)
                print(f"Result saved to: {output_path}")
                print(f"Detections found: {len(detections)}")

                # Display result
                cv2.imshow("TFLite Detection Result", result_frame)
                cv2.waitKey(0)
                cv2.destroyAllWindows()
            else:
                print("Failed to process image")
        else:
            print("Please specify --image <path> or --camera")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
