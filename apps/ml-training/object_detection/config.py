"""Configuration file for object detection model training."""

from dataclasses import dataclass, field
from typing import List


@dataclass
class ObjectDetectionConfig:
    """Configuration for object detection model training and inference."""

    # Model architecture
    image_size: int = 224  # Use 224 for optimal MobileNetV2 pre-trained weights
    backbone: str = "MobileNetV2"  # Options: MobileNetV2, MobileNetV3, EfficientNet

    # Training parameters
    batch_size: int = 16
    epochs: int = 50
    learning_rate: float = 1e-4
    validation_split: float = 0.2
    seed: int = 42

    # Loss weights
    bbox_weight: float = 1.0
    class_weight: float = 1.0
    edge_weight: float = 0.3

    # Detection parameters
    max_boxes: int = 10
    iou_threshold: float = 0.5
    confidence_threshold: float = 0.5

    # Data augmentation
    augment_prob: float = 0.5
    brightness_range: float = 0.2
    contrast_range: tuple = (0.8, 1.2)
    saturation_range: tuple = (0.8, 1.2)
    hue_range: float = 0.1

    # Edge detection
    edge_detection_method: str = "canny"  # Options: canny, sobel, learned
    canny_threshold1: int = 50
    canny_threshold2: int = 150
    canny_blur_kernel: int = 5

    # Callbacks
    early_stopping_patience: int = 10
    reduce_lr_patience: int = 5
    reduce_lr_factor: float = 0.5
    min_learning_rate: float = 1e-7

    # Paths
    dataset_dir: str = "merged_dataset"
    output_dir: str = "object_detection/models"

    # Export settings
    tflite_quantize: bool = True
    representative_samples: int = 100
    max_images_per_class: int | None = None  # Limit images per class during training

    def __post_init__(self):
        """Validate configuration."""
        assert self.image_size > 0, "Image size must be positive"
        assert 0 < self.validation_split < 1, "Validation split must be between 0 and 1"
        assert self.batch_size > 0, "Batch size must be positive"
        assert self.epochs > 0, "Epochs must be positive"
        assert self.learning_rate > 0, "Learning rate must be positive"


# Default configuration
DEFAULT_CONFIG = ObjectDetectionConfig()

# Fast training configuration (for testing)
FAST_CONFIG = ObjectDetectionConfig(image_size=224, batch_size=32, epochs=10, learning_rate=1e-3)

# High accuracy configuration (for production)
HIGH_ACCURACY_CONFIG = ObjectDetectionConfig(
    image_size=416,
    batch_size=8,
    epochs=100,
    learning_rate=5e-5,
    early_stopping_patience=15,
    edge_weight=0.5,
)

# Mobile-optimized configuration
MOBILE_CONFIG = ObjectDetectionConfig(
    image_size=224,
    batch_size=16,
    epochs=50,
    tflite_quantize=True,
    edge_weight=0.2,  # Lower weight for faster inference
)
