from dataclasses import dataclass


@dataclass
class TrainConfig:
    image_size: int = 224
    batch_size: int = 32
    epochs: int = 25  # Increased default epochs
    validation_split: float = 0.2
    seed: int = 42
    fine_tune_from: int | None = 100  # Fine-tune fewer layers to reduce overfitting
    mixed_precision: bool = False  # Disabled by default for Metal compatibility
    model_dir: str = "models"
    datasets: list[str] = None
    no_class_weights: bool = False  # Option to disable class weighting

    def __post_init__(self):
        if self.datasets is None:
            self.datasets = []
