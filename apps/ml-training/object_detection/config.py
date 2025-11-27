"""Configuration file for object detection model training."""

from dataclasses import dataclass, field
from typing import List


@dataclass
class ObjectDetectionConfig:
    """Configuration for object detection model training and inference."""

    # Model architecture
    image_size: int = 224  # Use 224 for optimal MobileNetV2 pre-trained weights
    backbone: str = "MobileNetV2"  # Options: MobileNetV2, MobileNetV3, EfficientNet
    backbone_trainable: bool = False  # Whether to train backbone initially

    # Training parameters
    batch_size: int = 16
    epochs: int = 100  # Increased for better convergence
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

    # Enhanced data augmentation
    augment_prob: float = 0.8  # Increased augmentation probability
    brightness_range: float = 0.3
    contrast_range: tuple = (0.7, 1.3)
    saturation_range: tuple = (0.8, 1.2)  # Smaller saturation range
    hue_range: float = 0.05  # Very small hue range
    gaussian_noise_std: float = 0.02  # Lighter Gaussian noise

    # Regularization
    dropout_rate: float = 0.4  # Increased dropout
    l2_regularization: float = 1e-4  # L2 regularization
    label_smoothing: float = 0.1  # Label smoothing for classification

    # Edge detection
    edge_detection_method: str = "canny"  # Options: canny, sobel, learned
    canny_threshold1: int = 50
    canny_threshold2: int = 150
    canny_blur_kernel: int = 5

    # Advanced training techniques
    use_mixed_precision: bool = True  # Enable mixed precision training
    use_progressive_unfreezing: bool = True  # Gradually unfreeze layers
    unfreeze_schedule: dict = field(
        default_factory=lambda: {10: 10, 20: 20, 30: 30}
    )  # Epoch -> layers to unfreeze
    warmup_epochs: int = 5  # Warmup period for stable training

    # Callbacks - enhanced for overfitting prevention
    early_stopping_patience: int = 15  # More patient early stopping
    reduce_lr_patience: int = 7
    reduce_lr_factor: float = 0.3  # More aggressive LR reduction
    lr_reduce_factor: float = 0.3  # Alias for backward compatibility
    lr_reduce_patience: int = 7  # Alias for backward compatibility
    min_learning_rate: float = 1e-7

    # Optimizer settings
    optimizer: str = "adamw"  # Use AdamW for better generalization
    weight_decay: float = 1e-4  # Weight decay for regularization
    use_lookahead: bool = False  # Optional: Lookahead optimizer wrapper

    # Learning rate schedule
    lr_schedule: str = "cosine"  # Options: cosine, exponential, step
    use_cosine_lr: bool = True  # Use cosine learning rate schedule
    cosine_warmup_steps: int = 1000

    # Monitoring and logging
    log_tensorboard: bool = True
    save_best_only: bool = True
    monitor_metric: str = "val_loss"  # Primary metric for model selection

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
