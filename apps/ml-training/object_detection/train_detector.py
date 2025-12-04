#!/usr/bin/env python
"""Train object detection model for waste items.

This model uses MobileNetV2 as backbone with custom detection head that outputs:
- Bounding boxes (x, y, width, height)
- Class probabilities
"""

import argparse
import csv
import os
import json
from pathlib import Path
from datetime import datetime
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from typing import Tuple, List, Dict
from rich import print

# Add parent directory to path for imports
import sys

sys.path.append(str(Path(__file__).parent.parent))
from dataset_utils import get_canonical_classes, prepare_datasets
from object_detection.config import ObjectDetectionConfig, BACKBONE_DEFAULT_INPUT_SIZES

BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_BBOX = np.array([0.1, 0.1, 0.9, 0.9], dtype=np.float32)
MAX_BOXES = 10  # Maximum number of bounding boxes per image

_BACKBONE_REGISTRY = {
    "MobileNetV2": keras.applications.MobileNetV2,
    "EfficientNetB0": keras.applications.EfficientNetB0,
    "EfficientNetV2B0": keras.applications.EfficientNetV2B0,
    "EfficientNetV2S": keras.applications.EfficientNetV2S,
}


def _resolve_path(path: str | Path) -> Path:
    p = Path(path)
    return p if p.is_absolute() else (BASE_DIR / p).resolve()


def _safe_float(value: str | float | None) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, float):
        return value
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _normalize_image_key(path: str | Path) -> str:
    return os.path.normpath(str(path))


def _build_backbone_features(
    config: ObjectDetectionConfig, inputs: tf.Tensor
) -> Tuple[keras.Model, tf.Tensor]:
    backbone_cls = _BACKBONE_REGISTRY.get(config.backbone)
    if backbone_cls is None:
        supported = ", ".join(sorted(_BACKBONE_REGISTRY))
        raise ValueError(f"Unsupported backbone {config.backbone}. Choose from: {supported}")

    input_size = config.backbone_input_size or BACKBONE_DEFAULT_INPUT_SIZES.get(
        config.backbone, 224
    )

    if config.image_size != input_size:
        backbone_input = layers.Resizing(input_size, input_size, name="backbone_resize")(inputs)
    else:
        backbone_input = inputs

    backbone_model = backbone_cls(
        include_top=False,
        weights=config.backbone_weights,
        input_tensor=backbone_input,
    )
    backbone_model.trainable = config.backbone_trainable
    return backbone_model, backbone_model.output


def _collect_backbone_layers(
    model: keras.Model, config: ObjectDetectionConfig
) -> list[keras.layers.Layer]:
    if hasattr(model, "backbone_model") and isinstance(model.backbone_model, keras.Model):
        return list(model.backbone_model.layers)

    # For loaded models, find the backbone sub-model
    for layer in model.layers:
        if isinstance(layer, keras.Model):
            return list(layer.layers)

    # Fallback to keyword search
    keyword = config.backbone.lower()
    candidates = [layer for layer in model.layers if keyword in layer.name.lower()]
    if candidates:
        # If it's a Model, return its layers
        if isinstance(candidates[0], keras.Model):
            return list(candidates[0].layers)
        else:
            return candidates
    return []


def load_yolo_annotations(csv_path: str | Path, dataset_dir: Path) -> Dict[str, List[np.ndarray]]:
    annotations: Dict[str, List[np.ndarray]] = {}
    csv_file = _resolve_path(csv_path)
    if not csv_file.exists():
        print(f"[yellow]YOLO CSV not found at {csv_file}; falling back to default bbox[/yellow]")
        return annotations

    dataset_dir = _resolve_path(dataset_dir)
    with open(csv_file, newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            filename = row.get("filename")
            if not filename:
                continue
            rel_path = os.path.normpath(filename)
            abs_path = (dataset_dir / rel_path).resolve(strict=False)
            if not abs_path.exists():
                continue

            x_center = _safe_float(row.get("x_center"))
            y_center = _safe_float(row.get("y_center"))
            width = _safe_float(row.get("width"))
            height = _safe_float(row.get("height"))
            if x_center is None or y_center is None or width is None or height is None:
                continue

            image_width = _safe_float(row.get("image_width"))
            image_height = _safe_float(row.get("image_height"))

            if image_width and image_width > 0:
                x_center /= image_width
                width /= image_width
            if image_height and image_height > 0:
                y_center /= image_height
                height /= image_height

            half_w = width / 2.0
            half_h = height / 2.0
            x_min = x_center - half_w
            x_max = x_center + half_w
            y_min = y_center - half_h
            y_max = y_center + half_h

            x_min = float(np.clip(x_min, 0.0, 1.0))
            x_max = float(np.clip(x_max, 0.0, 1.0))
            y_min = float(np.clip(y_min, 0.0, 1.0))
            y_max = float(np.clip(y_max, 0.0, 1.0))

            if x_max <= x_min or y_max <= y_min:
                continue

            key = _normalize_image_key(abs_path)
            annotations.setdefault(key, []).append(
                np.array([x_min, y_min, x_max, y_max], dtype=np.float32)
            )

    return annotations


def _select_multiple_bboxes(boxes: List[np.ndarray], max_boxes: int = MAX_BOXES) -> np.ndarray:
    """Select up to max_boxes bounding boxes, padding with default boxes if needed."""
    if not boxes:
        # Return max_boxes default boxes
        return np.tile(DEFAULT_BBOX, (max_boxes, 1))

    valid_boxes = [box for box in boxes if box[2] > box[0] and box[3] > box[1]]
    if not valid_boxes:
        return np.tile(DEFAULT_BBOX, (max_boxes, 1))

    # Take up to max_boxes boxes
    selected_boxes = valid_boxes[:max_boxes]

    # Pad with default boxes if needed
    while len(selected_boxes) < max_boxes:
        selected_boxes.append(DEFAULT_BBOX.copy())

    return np.array(selected_boxes, dtype=np.float32)


def _get_bbox_target(
    image_path: str, annotations: Dict[str, List[np.ndarray]]
) -> Tuple[np.ndarray, np.ndarray]:
    """Get bboxes and obj_mask: obj=1 for real/default, obj=0 for pads."""
    key = _normalize_image_key(image_path)
    boxes = annotations.get(key, [])
    valid_boxes = [box for box in boxes if box[2] > box[0] and box[3] > box[1]]

    if not valid_boxes:
        # No annotations: use single default object
        real_boxes = [DEFAULT_BBOX]
    else:
        real_boxes = valid_boxes[:MAX_BOXES]

    num_real = len(real_boxes)
    pad_num = MAX_BOXES - num_real
    pad_bboxes = np.zeros((pad_num, 4), dtype=np.float32)
    bboxes = np.vstack((real_boxes, pad_bboxes))

    obj_mask = np.zeros(MAX_BOXES, dtype=np.float32)
    obj_mask[:num_real] = 1.0

    return bboxes, obj_mask


def _apply_gaussian_blur(image: tf.Tensor) -> tf.Tensor:
    kernel = tf.constant([[1.0, 2.0, 1.0], [2.0, 4.0, 2.0], [1.0, 2.0, 1.0]], dtype=tf.float32)
    kernel = kernel / tf.reduce_sum(kernel)
    kernel = tf.reshape(kernel, [3, 3, 1, 1])
    kernel = tf.tile(kernel, [1, 1, 3, 1])
    blurred = tf.nn.depthwise_conv2d(
        tf.expand_dims(image, axis=0), kernel, strides=[1, 1, 1, 1], padding="SAME"
    )
    return tf.squeeze(blurred, axis=0)


def _simulate_jpeg_compression(image: tf.Tensor, quality_range: tuple[int, int]) -> tf.Tensor:
    min_q, max_q = quality_range

    def _compress(img: tf.Tensor) -> tf.Tensor:
        quality = np.random.randint(min_q, max_q + 1)
        img_uint8 = tf.image.convert_image_dtype(img, tf.uint8)
        encoded = tf.io.encode_jpeg(img_uint8, quality=int(quality))
        decoded = tf.image.decode_jpeg(encoded, channels=3)
        return tf.image.convert_image_dtype(decoded, tf.float32)

    compressed = tf.py_function(_compress, [image], tf.float32)
    compressed.set_shape(image.shape)
    return compressed


def augment_image_and_bboxes(
    image: tf.Tensor, bboxes: tf.Tensor, obj_mask: tf.Tensor, config: ObjectDetectionConfig
) -> Tuple[tf.Tensor, tf.Tensor, tf.Tensor]:
    """Apply augmentation; flip bboxes conditionally on obj=1."""

    # Horizontal flip
    flip_prob = config.flip_prob
    do_flip = tf.random.uniform(()) < flip_prob
    image = tf.cond(do_flip, lambda: tf.image.flip_left_right(image), lambda: image)
    bboxes_flip = tf.stack(
        [
            1.0 - bboxes[:, 2],  # x_min = 1 - x_max
            bboxes[:, 1],  # y_min
            1.0 - bboxes[:, 0],  # x_max = 1 - x_min
            bboxes[:, 3],  # y_max
        ],
        axis=1,
    )
    obj_selector = tf.expand_dims(obj_mask > 0, -1)
    bboxes = tf.cond(do_flip, lambda: tf.where(obj_selector, bboxes_flip, bboxes), lambda: bboxes)
    # obj_mask unchanged

    # Image-only augmentations (unchanged)
    image = tf.image.random_brightness(image, config.brightness_range)
    image = tf.image.random_contrast(image, *config.contrast_range)
    image = tf.image.random_saturation(image, *config.saturation_range)
    image = tf.image.random_hue(image, config.hue_range)

    if config.gaussian_noise_std > 0:
        noise = tf.random.normal(tf.shape(image), 0.0, config.gaussian_noise_std)
        image = tf.clip_by_value(image + noise, 0.0, 1.0)

    if tf.random.uniform(()) < config.blur_prob:
        image = _apply_gaussian_blur(image)

    if tf.random.uniform(()) < config.compression_prob:
        image = _simulate_jpeg_compression(image, config.compression_quality_range)

    image = tf.clip_by_value(image, 0.0, 1.0)
    return image, bboxes, obj_mask


def load_and_preprocess_image(
    image_path: str,
    label: int,
    bboxes: np.ndarray,
    obj_mask: np.ndarray,
    config: ObjectDetectionConfig,
    num_waste_classes: int,
    is_training: bool = True,
) -> Tuple[tf.Tensor, Dict]:
    """Load image and create detection targets."""
    image = tf.io.read_file(image_path)
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, [config.image_size, config.image_size])
    image = tf.cast(image, tf.float32) / 255.0

    bbox_tensor = tf.reshape(tf.cast(bboxes, tf.float32), [MAX_BOXES, 4])
    obj_tensor = tf.cast(obj_mask, tf.float32)

    bg_class = num_waste_classes
    class_ids = tf.where(obj_tensor > 0, tf.cast(label, tf.int32), tf.cast(bg_class, tf.int32))
    class_labels = tf.one_hot(class_ids, bg_class + 1)

    # Apply augmentation
    if is_training and tf.random.uniform(()) < config.augment_prob:
        image, bbox_tensor, obj_tensor = augment_image_and_bboxes(
            image, bbox_tensor, obj_tensor, config
        )

    bbox_tensor = tf.clip_by_value(bbox_tensor, 0.0, 1.0)
    image.set_shape((config.image_size, config.image_size, 3))

    targets = {"bbox": bbox_tensor, "obj": obj_tensor, "class": class_labels}
    return image, targets


def build_detection_model(config: ObjectDetectionConfig, num_classes: int) -> keras.Model:
    """Build object detection model with multiple bbox and classification heads.

    Architecture:
    - EfficientNet backbone (better feature extraction)
    - Enhanced detection heads with more capacity
    - Better regularization and normalization
    """

    # Input
    inputs = keras.Input(shape=(config.image_size, config.image_size, 3), name="image")
    backbone_model, x = _build_backbone_features(config, inputs)

    # Enhanced global features with additional processing
    global_pool = layers.GlobalAveragePooling2D()(x)

    # Add batch normalization for better training stability
    global_pool = layers.BatchNormalization()(global_pool)
    global_pool = layers.Dropout(config.dropout_rate)(global_pool)

    # === Enhanced Bounding Box Head ===
    bbox_dense = layers.Dense(
        512,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="bbox_dense1",
    )(global_pool)
    bbox_dense = layers.BatchNormalization()(bbox_dense)
    bbox_dense = layers.Dropout(config.dropout_rate)(bbox_dense)

    bbox_dense = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="bbox_dense2",
    )(bbox_dense)
    bbox_dense = layers.BatchNormalization()(bbox_dense)
    bbox_dense = layers.Dropout(config.dropout_rate)(bbox_dense)

    bbox_dense = layers.Dense(
        128,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="bbox_dense3",
    )(bbox_dense)
    bbox_dense = layers.Dropout(config.dropout_rate)(bbox_dense)

    bbox_output = layers.Dense(MAX_BOXES * 4, activation="sigmoid", name="bbox")(bbox_dense)
    bbox_output = layers.Reshape((MAX_BOXES, 4))(bbox_output)

    # === Enhanced Classification Head ===
    class_dense = layers.Dense(
        512,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="class_dense1",
    )(global_pool)
    class_dense = layers.BatchNormalization()(class_dense)
    class_dense = layers.Dropout(config.dropout_rate)(class_dense)

    class_dense = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="class_dense2",
    )(class_dense)
    class_dense = layers.BatchNormalization()(class_dense)
    class_dense = layers.Dropout(config.dropout_rate)(class_dense)

    class_dense = layers.Dense(
        128,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="class_dense3",
    )(class_dense)
    class_dense = layers.Dropout(config.dropout_rate)(class_dense)

    class_output = layers.Dense(MAX_BOXES * num_classes, activation="softmax", name="class")(
        class_dense
    )
    class_output = layers.Reshape((MAX_BOXES, num_classes))(class_output)

    # === Objectness Head ===
    obj_dense = layers.Dense(
        512,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="obj_dense1",
    )(global_pool)
    obj_dense = layers.BatchNormalization()(obj_dense)
    obj_dense = layers.Dropout(config.dropout_rate)(obj_dense)

    obj_dense = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="obj_dense2",
    )(obj_dense)
    obj_dense = layers.BatchNormalization()(obj_dense)
    obj_dense = layers.Dropout(config.dropout_rate)(obj_dense)

    obj_dense = layers.Dense(
        128,
        activation="relu",
        kernel_regularizer=keras.regularizers.l2(config.l2_regularization),
        name="obj_dense3",
    )(obj_dense)
    obj_dense = layers.Dropout(config.dropout_rate)(obj_dense)

    obj_output = layers.Dense(MAX_BOXES, activation="sigmoid", name="obj")(obj_dense)

    # Build model
    model = keras.Model(
        inputs=inputs,
        outputs={"bbox": bbox_output, "class": class_output, "obj": obj_output},
        name="waste_object_detector",
    )
    model.backbone_model = backbone_model
    model.backbone_keyword = config.backbone.lower()

    return model


def focal_loss(alpha=0.25, gamma=2.0):
    """Focal loss for better handling of class imbalance."""

    def focal_loss_fixed(y_true, y_pred):
        # Clip predictions to prevent log(0)
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1.0)

        # Calculate focal loss
        cross_entropy = -y_true * tf.math.log(y_pred)
        weight = alpha * tf.pow(1 - y_pred, gamma)
        focal = weight * cross_entropy

        return tf.reduce_mean(focal)

    return focal_loss_fixed


def apply_classwise_nms(
    bboxes: np.ndarray,
    class_probs: np.ndarray,
    iou_threshold: float = 0.5,
    score_threshold: float = 0.3,
    max_output_per_class: int = 10,
):
    """Apply per-class non-maximum suppression (NMS) on multi-box predictions.

    Args:
        bboxes: Array of shape (num_boxes, 4) with [x_min, y_min, x_max, y_max]
        class_probs: Array of shape (num_boxes, num_classes) with class probabilities
        iou_threshold: IoU threshold for suppression
        score_threshold: Minimum class score to consider
        max_output_per_class: Maximum boxes to keep per class

    Returns:
        (selected_boxes, selected_labels, selected_scores)
    """
    if bboxes is None or class_probs is None:
        return (
            np.zeros((0, 4), dtype=np.float32),
            np.array([], dtype=np.int32),
            np.array([], dtype=np.float32),
        )

    num_boxes = int(bboxes.shape[0])
    num_classes = int(class_probs.shape[1])

    def iou_matrix(box, boxes):
        # box: (4,), boxes: (N,4)
        x1 = np.maximum(box[0], boxes[:, 0])
        y1 = np.maximum(box[1], boxes[:, 1])
        x2 = np.minimum(box[2], boxes[:, 2])
        y2 = np.minimum(box[3], boxes[:, 3])
        inter_w = np.maximum(0.0, x2 - x1)
        inter_h = np.maximum(0.0, y2 - y1)
        inter = inter_w * inter_h
        area_box = (box[2] - box[0]) * (box[3] - box[1])
        area_boxes = (boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1])
        union = area_box + area_boxes - inter
        iou = inter / (union + 1e-8)
        return iou

    selected_boxes = []
    selected_labels = []
    selected_scores = []

    for cls in range(num_classes):
        scores = class_probs[:, cls]
        # Select indices above threshold
        idxs = np.where(scores > score_threshold)[0]
        if idxs.size == 0:
            continue

        # Sort by score desc
        idxs = idxs[np.argsort(scores[idxs])[::-1]]

        keep = []
        for idx in idxs:
            box = bboxes[idx]
            if len(keep) == 0:
                keep.append(idx)
            else:
                kept_boxes = bboxes[np.array(keep)]
                ious = iou_matrix(box, kept_boxes)
                if np.max(ious) <= iou_threshold:
                    keep.append(idx)
            if len(keep) >= max_output_per_class:
                break

        for k in keep:
            selected_boxes.append(bboxes[k])
            selected_labels.append(int(cls))
            selected_scores.append(float(scores[k]))

    if len(selected_boxes) == 0:
        return (
            np.zeros((0, 4), dtype=np.float32),
            np.array([], dtype=np.int32),
            np.array([], dtype=np.float32),
        )

    # Convert to arrays and sort by score desc globally
    selected_boxes = np.stack(selected_boxes, axis=0)
    selected_labels = np.array(selected_labels, dtype=np.int32)
    selected_scores = np.array(selected_scores, dtype=np.float32)

    order = np.argsort(selected_scores)[::-1]
    selected_boxes = selected_boxes[order]
    selected_labels = selected_labels[order]
    selected_scores = selected_scores[order]

    return selected_boxes, selected_labels, selected_scores


def cosine_learning_rate(epoch, initial_lr, total_epochs, min_lr):
    """Cosine learning rate schedule with warmup."""
    if epoch < 5:  # Warmup for first 5 epochs
        return initial_lr * (epoch + 1) / 5
    else:
        progress = (epoch - 5) / (total_epochs - 5)
        cosine_decay = 0.5 * (1 + np.cos(np.pi * progress))
        return min_lr + (initial_lr - min_lr) * cosine_decay


class ProgressiveUnfreezingCallback(keras.callbacks.Callback):
    """Callback for progressive unfreezing of backbone layers."""

    def __init__(self, backbone_layers, unfreeze_schedule, compile_kwargs=None, backbone_name=None):
        super().__init__()
        self.backbone_layers = backbone_layers or []
        self.unfreeze_schedule = unfreeze_schedule or {}
        self.compile_kwargs = compile_kwargs or {}
        self.backbone_name = backbone_name or "backbone"
        self.unfrozen_layers = sum(1 for layer in self.backbone_layers if layer.trainable)
        self._cursor = len(self.backbone_layers)

    def on_epoch_begin(self, epoch, logs=None):
        """Unfreeze layers according to schedule."""
        if not self.backbone_layers:
            return

        layers_to_unfreeze = self.unfreeze_schedule.get(epoch, 0)
        if layers_to_unfreeze <= 0:
            return

        unfrozen = 0
        while layers_to_unfreeze > 0 and self._cursor > 0:
            self._cursor -= 1
            layer = self.backbone_layers[self._cursor]
            if layer.trainable:
                continue
            layer.trainable = True
            unfrozen += 1
            layers_to_unfreeze -= 1

        self.unfrozen_layers += unfrozen
        if unfrozen:
            print(
                f"[cyan]Epoch {epoch}: Unfroze {unfrozen} layers. Total unfrozen: {self.unfrozen_layers}/{len(self.backbone_layers)} ({self.backbone_name})[/cyan]"
            )
            # # Recompile model after unfreezing layers
            # self.model.compile(**self.compile_kwargs)


def prepare_dataset(config: ObjectDetectionConfig, dataset_dir: str = "merged_dataset"):
    """Prepare training and validation datasets using YOLO annotations."""
    dataset_path = _resolve_path(dataset_dir)
    if not dataset_path.exists() or not any(dataset_path.iterdir()):
        print(f"[yellow]Dataset not found at {dataset_path}, preparing datasets...[/yellow]")
        prepare_datasets("raw_datasets", str(dataset_path))
        print(f"[green]Dataset prepared at {dataset_path}[/green]")

    classes = get_canonical_classes()
    num_classes = len(classes)

    print(f"[cyan]Loading dataset from {dataset_path}...[/cyan]")
    print(f"[cyan]Classes: {classes}[/cyan]")

    image_paths: list[str] = []
    labels: list[int] = []

    for class_idx, class_name in enumerate(classes):
        class_dir = dataset_path / class_name
        if not class_dir.exists():
            print(f"[yellow]Warning: Class directory {class_dir} not found[/yellow]")
            continue

        class_files = [
            file.resolve()
            for file in class_dir.iterdir()
            if file.is_file() and file.suffix.lower() in (".jpg", ".jpeg", ".png")
        ]

        if config.max_images_per_class is not None:
            class_files = class_files[: config.max_images_per_class]

        resolved_files = [str(p) for p in class_files]
        image_paths.extend(resolved_files)
        labels.extend([class_idx] * len(resolved_files))

    print(f"[green]Found {len(image_paths)} images across {num_classes} classes[/green]")
    if not image_paths:
        raise ValueError("No training images found in dataset directory")

    annotations = load_yolo_annotations(config.csv_labels_path, dataset_path)
    bbox_and_obj_list = [_get_bbox_target(path, annotations) for path in image_paths]
    bbox_targets = np.stack([item[0] for item in bbox_and_obj_list], axis=0)  # (N, 10, 4)
    obj_targets = np.stack([item[1] for item in bbox_and_obj_list], axis=0)  # (N, 10)

    image_paths = np.array(image_paths)
    labels = np.array(labels, dtype=np.int32)

    np.random.seed(config.seed)
    indices = np.random.permutation(len(image_paths))
    image_paths = image_paths[indices]
    labels = labels[indices]
    bbox_targets = bbox_targets[indices]
    obj_targets = obj_targets[indices]

    split_idx = int(len(image_paths) * (1 - config.validation_split))
    train_paths, val_paths = image_paths[:split_idx], image_paths[split_idx:]
    train_labels, val_labels = labels[:split_idx], labels[split_idx:]
    train_bboxes, val_bboxes = bbox_targets[:split_idx], bbox_targets[split_idx:]
    train_objs, val_objs = obj_targets[:split_idx], obj_targets[split_idx:]

    print(f"[green]Training: {len(train_paths)} images[/green]")
    print(f"[green]Validation: {len(val_paths)} images[/green]")

    num_waste_classes = num_classes

    def make_preprocess_fn(num_waste_classes_local):
        def preprocess(path, label, bboxes, obj_mask):
            return load_and_preprocess_image(
                path, label, bboxes, obj_mask, config, num_waste_classes_local, is_training=True
            )

        return preprocess

    train_dataset = tf.data.Dataset.from_tensor_slices(
        (train_paths, train_labels, train_bboxes, train_objs)
    )
    train_dataset = (
        train_dataset.map(
            make_preprocess_fn(num_waste_classes),
            num_parallel_calls=tf.data.AUTOTUNE,
        )
        .batch(config.batch_size)
        .prefetch(tf.data.AUTOTUNE)
    )

    val_preprocess = lambda path, label, bboxes, obj_mask: load_and_preprocess_image(
        path, label, bboxes, obj_mask, config, num_waste_classes, is_training=False
    )
    val_dataset = tf.data.Dataset.from_tensor_slices((val_paths, val_labels, val_bboxes, val_objs))
    val_dataset = (
        val_dataset.map(
            val_preprocess,
            num_parallel_calls=tf.data.AUTOTUNE,
        )
        .batch(config.batch_size)
        .prefetch(tf.data.AUTOTUNE)
    )

    return train_dataset, val_dataset, num_waste_classes


def train_detector(
    config: ObjectDetectionConfig,
    dataset_dir: str = "merged_dataset",
    output_dir: str = "object_detection/models",
    resume_model_path: str = None,
):
    """Train object detection model."""

    # Handle resume logic
    initial_epoch = 0
    if resume_model_path:
        if not os.path.exists(resume_model_path):
            raise ValueError(f"Resume model path does not exist: {resume_model_path}")

        # Try to determine initial epoch from training log
        log_path = os.path.join(resume_model_path, "training_log.csv")
        if os.path.exists(log_path):
            try:
                with open(log_path, "r") as f:
                    lines = f.readlines()
                    # Skip header, count data lines (each line is an epoch)
                    initial_epoch = len(lines) - 1
                print(f"[yellow]Resuming from epoch {initial_epoch}[/yellow]")
            except Exception as e:
                print(f"[red]Could not parse training log: {e}. Starting from epoch 0.[/red]")
                initial_epoch = 0
        else:
            print(f"[yellow]No training log found. Starting from epoch 0.[/yellow]")

        # Use the resume directory as output directory
        run_dir = resume_model_path
        print(f"[yellow]Resuming training in directory: {run_dir}[/yellow]")
    else:
        # Create new output directory
        os.makedirs(output_dir, exist_ok=True)
        run_name = f"detector_run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        run_dir = os.path.join(output_dir, run_name)
        os.makedirs(run_dir, exist_ok=True)

    print(f"[bold cyan]Starting Object Detection Training[/bold cyan]")
    print(f"[cyan]Output directory: {run_dir}[/cyan]")

    # Prepare datasets
    train_dataset, val_dataset, num_waste_classes = prepare_dataset(config, dataset_dir)
    total_classes = num_waste_classes + 1

    # Build or load model
    if resume_model_path:
        model_path = os.path.join(resume_model_path, "best_model.keras")
        if os.path.exists(model_path):
            print(f"[cyan]Loading model from {model_path}...[/cyan]")
            model = keras.models.load_model(
                model_path, custom_objects={"focal_loss_fixed": focal_loss()}
            )
            print("[green]Model loaded successfully![/green]")

            # Validate that critical parameters match the loaded model
            expected_input_shape = model.input_shape[1:3]  # (height, width)
            if config.image_size != expected_input_shape[0]:
                print(
                    f"[red]Warning: Loaded model expects input size {expected_input_shape[0]}x{expected_input_shape[1]}, but config specifies {config.image_size}x{config.image_size}[/red]"
                )
                print(
                    f"[yellow]Using model's expected input size: {expected_input_shape[0]}[/yellow]"
                )
                config.image_size = expected_input_shape[0]
        else:
            raise ValueError(f"Saved model not found at {model_path}")
    else:
        print("[cyan]Building new model...[/cyan]")
        model = build_detection_model(config, total_classes)
        model.summary()

    # Compile model (always recompile to apply new config parameters)
    optimizer = keras.optimizers.AdamW(
        learning_rate=config.learning_rate, weight_decay=config.weight_decay
    )

    compile_kwargs = {
        "optimizer": optimizer,
        "loss": {
            "bbox": keras.losses.MeanSquaredError(),
            "class": focal_loss(alpha=0.25, gamma=2.0),
            "obj": keras.losses.BinaryCrossentropy(),
        },
        "loss_weights": {"bbox": config.bbox_weight, "class": config.class_weight, "obj": 1.0},
        "metrics": {
            "class": ["accuracy"],
            "bbox": ["mae"],
            "obj": ["accuracy"],
        },
    }

    model.compile(**compile_kwargs)

    # Enhanced callbacks
    callbacks = [
        keras.callbacks.ModelCheckpoint(
            os.path.join(run_dir, "best_model.keras"),
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=config.early_stopping_patience,
            restore_best_weights=True,
            verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=config.lr_reduce_factor,
            patience=config.lr_reduce_patience,
            min_lr=config.min_learning_rate,
            verbose=1,
        ),
        keras.callbacks.CSVLogger(os.path.join(run_dir, "training_log.csv")),
        keras.callbacks.TensorBoard(
            log_dir=os.path.join(run_dir, "logs"), histogram_freq=1, update_freq="epoch"
        ),
    ]

    # Add progressive unfreezing callback if enabled
    if config.use_progressive_unfreezing:
        backbone_layers = _collect_backbone_layers(model, config)
        print(
            f"[cyan]Collected {len(backbone_layers)} backbone layers for progressive unfreezing[/cyan]"
        )
        callbacks.append(
            ProgressiveUnfreezingCallback(
                backbone_layers,
                config.unfreeze_schedule,
                compile_kwargs=compile_kwargs,
                backbone_name=config.backbone,
            )
        )

    # Add cosine learning rate scheduler if enabled
    if config.use_cosine_lr:
        callbacks.append(
            keras.callbacks.LearningRateScheduler(
                lambda epoch: cosine_learning_rate(
                    epoch, config.learning_rate, config.epochs, config.min_learning_rate
                )
            )
        )

    # Train
    print("[bold green]Training started...[/bold green]")
    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=config.epochs,
        initial_epoch=initial_epoch,
        callbacks=callbacks,
        verbose=1,
    )

    # Save final model
    final_model_path = os.path.join(run_dir, "final_model.keras")
    model.save(final_model_path)
    print(f"[green]Model saved to {final_model_path}[/green]")

    # Save metadata
    metadata = {
        "timestamp": datetime.now().isoformat(),
        "config": {
            "image_size": config.image_size,
            "batch_size": config.batch_size,
            "epochs": config.epochs,
            "learning_rate": config.learning_rate,
            "num_classes": total_classes,
        },
        "final_metrics": {
            "loss": float(history.history["loss"][-1]),
            "val_loss": float(history.history["val_loss"][-1]),
            "class_accuracy": float(history.history["class_accuracy"][-1]),
            "val_class_accuracy": float(history.history["val_class_accuracy"][-1]),
            "bbox_mae": float(history.history["bbox_mae"][-1]),
            "val_bbox_mae": float(history.history["val_bbox_mae"][-1]),
            "obj_accuracy": (
                float(history.history["obj_accuracy"][-1])
                if "obj_accuracy" in history.history
                else 0
            ),
            "val_obj_accuracy": (
                float(history.history["val_obj_accuracy"][-1])
                if "val_obj_accuracy" in history.history
                else 0
            ),
        },
    }

    with open(os.path.join(run_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[bold green]Training complete! Model saved in {run_dir}[/bold green]")
    return model, run_dir


def main():
    parser = argparse.ArgumentParser(description="Train object detection model for waste items")
    parser.add_argument(
        "--dataset", type=str, default="merged_dataset", help="Path to dataset directory"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="object_detection/models",
        help="Output directory for trained models",
    )
    parser.add_argument("--epochs", type=int, default=None, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=None, help="Batch size")
    parser.add_argument("--image-size", type=int, default=None, help="Input image size")
    parser.add_argument("--learning-rate", type=float, default=None, help="Learning rate")
    parser.add_argument(
        "--max-images-per-class",
        type=int,
        default=None,
        help="Limit number of images loaded per class (None = no limit)",
    )
    parser.add_argument(
        "--backbone-trainable",
        action="store_true",
        default=None,
        help="Make backbone trainable from start",
    )
    parser.add_argument(
        "--progressive-unfreezing",
        action="store_true",
        default=True,
        help="Use progressive unfreezing during training",
    )
    parser.add_argument(
        "--resume",
        type=str,
        default=None,
        help="Path to saved model directory to resume training from",
    )

    args = parser.parse_args()

    # Create config with defaults from ObjectDetectionConfig
    config = ObjectDetectionConfig()

    # Override with command line arguments if provided
    if args.epochs is not None:
        config.epochs = args.epochs
    if args.batch_size is not None:
        config.batch_size = args.batch_size
    if args.image_size is not None:
        config.image_size = args.image_size
    if args.learning_rate is not None:
        config.learning_rate = args.learning_rate
    if args.max_images_per_class is not None:
        config.max_images_per_class = args.max_images_per_class
    if args.backbone_trainable is not None:
        config.backbone_trainable = args.backbone_trainable
    if args.progressive_unfreezing is not None:
        config.use_progressive_unfreezing = args.progressive_unfreezing

    # Train model
    model, run_dir = train_detector(
        config=config,
        dataset_dir=args.dataset,
        output_dir=args.output,
        resume_model_path=args.resume,
    )

    print(f"[bold cyan]Training complete! Results saved to: {run_dir}[/bold cyan]")


if __name__ == "__main__":
    main()
