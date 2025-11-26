from dataclasses import dataclass


@dataclass
class TrainConfig:
    image_size: int = 224
    batch_size: int = 32
    epochs: int = 15  # Increased default epochs
    validation_split: float = 0.2
    seed: int = 42
    fine_tune_from: int | None = 0  # Fine-tune all layers for better performance
    mixed_precision: bool = False  # Disabled by default for Metal compatibility
    model_dir: str = "models"
    datasets: list[str] = None
    no_class_weights: bool = False  # Option to disable class weighting
    repr_samples: int = 100
    brightness_factor: float = 0.1
    contrast_factor: float = 0.1
    max_images_per_class: int | None = None  # Limit number of images loaded per class

    def __post_init__(self):
        if self.datasets is None:
            self.datasets = []
