"""Configuration file for object detection model training."""

from dataclasses import dataclass, field
from typing import Tuple

BACKBONE_DEFAULT_INPUT_SIZES = {
    "MobileNetV2": 224,
    "EfficientNetB0": 224,
    "EfficientNetV2B0": 224,
    "EfficientNetV2S": 384,
}


@dataclass
class ObjectDetectionConfig:
    """Configuration for object detection model training and inference."""

    # Model architecture
    image_size: int = 224  # Use 224 for optimal pre-trained weights
    backbone: str = "EfficientNetV2S"  # Upgrade to EfficientNetV2S for richer real-world features
    backbone_input_size: int | None = None
    backbone_weights: str | None = "imagenet"
    backbone_trainable: bool = False  # Whether to train backbone initially

    # Training parameters
    batch_size: int = 16
    epochs: int = 100  # Increased for better convergence
    learning_rate: float = 1e-4
    validation_split: float = 0.2
    seed: int = 42

    # Loss weights - re-enable bbox if real annotations available
    bbox_weight: float = 1.0  # Re-enabled for real bounding boxes
    class_weight: float = 1.0
    edge_weight: float = 0.0  # Disabled for simplicity

    # Detection parameters
    max_boxes: int = 10
    iou_threshold: float = 0.5
    confidence_threshold: float = 0.5

    # Enhanced data augmentation for mobile generalization
    augment_prob: float = 0.9  # Increased augmentation probability
    brightness_range: float = 0.4  # Increased range
    contrast_range: tuple = (0.6, 1.4)  # Wider range
    saturation_range: tuple = (0.7, 1.3)  # Wider range
    hue_range: float = 0.1  # Increased hue range
    gaussian_noise_std: float = 0.05  # Increased noise
    rotation_range: float = 15.0  # Legacy rotation support
    zoom_range: tuple = (0.8, 1.2)  # Legacy zoom support
    crop_prob: float = 0.5  # Legacy crop support
    flip_prob: float = 0.5  # Keep bbox-safe horizontal flips
    blur_prob: float = 0.25  # Probability of applying mild blur
    compression_prob: float = 0.2  # JPEG compression mimic
    compression_quality_range: Tuple[int, int] = (70, 95)

    # Regularization - increased for overfitting prevention
    dropout_rate: float = 0.5  # Increased dropout
    l2_regularization: float = 5e-4  # Increased L2 regularization
    label_smoothing: float = 0.2  # Increased label smoothing
    use_batch_norm: bool = True  # New: add batch normalization

    # Advanced training techniques
    use_mixed_precision: bool = True
    use_progressive_unfreezing: bool = True
    unfreeze_schedule: dict = field(
        default_factory=lambda: {epoch: 51 for epoch in range(5, 100, 6)}
    )
    warmup_epochs: int = 5

    # Callbacks - enhanced for overfitting prevention
    early_stopping_patience: int = 20  # More patient
    reduce_lr_patience: int = 10
    reduce_lr_factor: float = 0.5  # Less aggressive reduction
    lr_reduce_factor: float = 0.5
    lr_reduce_patience: int = 10
    min_learning_rate: float = 1e-7

    # Optimizer settings
    optimizer: str = "adamw"
    weight_decay: float = 2e-4  # Increased weight decay
    use_lookahead: bool = False

    # Learning rate schedule
    lr_schedule: str = "cosine"
    use_cosine_lr: bool = True
    cosine_warmup_steps: int = 1000

    # Augmentation behavior
    use_arbitrary_rotation: bool = False  # prefer rot90 unless explicitly enabled

    # Monitoring and logging
    log_tensorboard: bool = True
    save_best_only: bool = True
    monitor_metric: str = "val_loss"

    # Paths
    dataset_dir: str = "merged_dataset"
    output_dir: str = "object_detection/models"
    csv_labels_path: str = "yolo_labels.csv"  # Path to CSV file with YOLO labels

    # Export settings
    tflite_quantize: bool = True
    representative_samples: int = 100
    max_images_per_class: int | None = None
    cache_dataset: bool = False

    def __post_init__(self):
        """Validate configuration."""
        assert self.image_size > 0, "Image size must be positive"
        assert 0 < self.validation_split < 1, "Validation split must be between 0 and 1"
        assert self.batch_size > 0, "Batch size must be positive"
        assert self.epochs > 0, "Epochs must be positive"
        assert self.learning_rate > 0, "Learning rate must be positive"

        # Validate augmentation ranges to prevent extreme params that harm training
        if self.brightness_range > 0.5:
            print(f"[WARN] brightness_range {self.brightness_range} is large; clamping to 0.5")
            self.brightness_range = 0.5
        if self.hue_range > 0.25:
            print(f"[WARN] hue_range {self.hue_range} is large; clamping to 0.25")
            self.hue_range = 0.25
        # Contrast clamp
        if self.contrast_range[0] < 0.2 or self.contrast_range[1] > 3.0:
            low = max(0.2, self.contrast_range[0])
            high = min(3.0, self.contrast_range[1])
            print(f"[WARN] contrast_range adjusted to ({low},{high})")
            self.contrast_range = (low, high)
        # Limit gaussian noise
        if self.gaussian_noise_std > 0.2:
            print(f"[WARN] gaussian_noise_std {self.gaussian_noise_std} high; clamping to 0.2")
            self.gaussian_noise_std = 0.2

        self.flip_prob = max(0.0, min(1.0, self.flip_prob))
        self.blur_prob = max(0.0, min(1.0, self.blur_prob))
        self.compression_prob = max(0.0, min(1.0, self.compression_prob))

        min_q, max_q = sorted(
            (int(self.compression_quality_range[0]), int(self.compression_quality_range[1]))
        )
        min_q = max(10, min(100, min_q))
        max_q = max(min_q, min(100, max_q))
        self.compression_quality_range = (min_q, max_q)

        default_backbone_size = BACKBONE_DEFAULT_INPUT_SIZES.get(self.backbone, 224)
        self.backbone_input_size = self.backbone_input_size or default_backbone_size

        self.flip_prob = max(0.0, min(1.0, self.flip_prob))
        self.blur_prob = max(0.0, min(1.0, self.blur_prob))
        self.compression_prob = max(0.0, min(1.0, self.compression_prob))

        min_q, max_q = sorted(
            (int(self.compression_quality_range[0]), int(self.compression_quality_range[1]))
        )
        min_q = max(10, min(100, min_q))
        max_q = max(min_q, min(100, max_q))
        self.compression_quality_range = (min_q, max_q)


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
