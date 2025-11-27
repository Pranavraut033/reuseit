import os
import zipfile
import json
from pathlib import Path
from typing import List, Dict
from kaggle.api.kaggle_api_extended import KaggleApi

# ---------------------------------------------------------------------------
# Canonical Label System (German Waste-Sorting Alignment)
# ---------------------------------------------------------------------------
# Streams (informational): Papier, Glas, Metall, Kunststoff, Bio, Restmüll,
# Sonderabfall, Textilien. We keep finer-grain splits helpful for ML.
# ---------------------------------------------------------------------------

# Canonical class set (German-aligned, merged for cleaner categories)
CANONICAL_CLASSES = [
    "paper_cardboard",
    "glass",
    "recyclables",
    "bio_waste",
    "textile_reuse",
    "electronics",
    "battery",
    "residual_waste",
]

GERMAN_LABEL_INFO = {
    "paper_cardboard": {"de": "Papier/Pappe", "stream": "Papier"},
    "glass": {"de": "Glas", "stream": "Glas"},
    "recyclables": {"de": "Wertstoffe", "stream": "Wertstoffe"},
    "bio_waste": {"de": "Bioabfall", "stream": "Bio"},
    "textile_reuse": {"de": "Textilien", "stream": "Textilien"},
    "electronics": {"de": "Elektroschrott", "stream": "Sonderabfall"},
    "battery": {"de": "Batterien", "stream": "Sonderabfall"},
    "residual_waste": {"de": "Restmüll", "stream": "Restmüll"},
}

# Raw label mapping across datasets -> canonical label (case-insensitive via lowercasing)
RAW_CLASS_MAP: Dict[str, str] = {
    # Direct matches and merges
    "cardboard": "paper_cardboard",
    "paper": "paper_cardboard",
    "glass": "glass",
    "brown-glass": "glass",
    "green-glass": "glass",
    "white-glass": "glass",
    "metal": "recyclables",
    "plastic": "recyclables",
    "biological": "bio_waste",
    "organic": "bio_waste",
    "food organics": "bio_waste",
    "vegetation": "bio_waste",
    "clothes": "textile_reuse",
    "textile": "textile_reuse",
    "textile trash": "textile_reuse",
    "shoes": "textile_reuse",
    "e-waste": "electronics",
    "ewaste": "electronics",
    "battery": "battery",
    "batteries": "battery",
    "trash": "residual_waste",
    "miscellaneous trash": "residual_waste",
}


def normalize_label(raw: str) -> str | None:
    if raw is None:
        return None
    return RAW_CLASS_MAP.get(raw.strip().lower())


IMAGE_EXTS = {".jpg", ".jpeg", ".png"}  # Only allow JPEG/PNG for training

DATASET_SLUGS = [
    "mostafaabla/garbage-classification",
    "karansolanki01/garbage-classification",
    "sumn2u/garbage-classification-v2",
    "glhdamar/new-trash-classfication-dataset",
    "joebeachcapital/realwaste",
]

# Define dataset configurations with their paths and class mappings
DATASET_CONFIGS = [
    {
        "name": "asdasdasasdas/garbage-classification",
        "slug": "asdasdasasdas_garbage-classification",
        "path": "Garbage classification/Garbage classification",
        "class_mappings": {
            "cardboard": "paper_cardboard",
            "glass": "glass",
            "metal": "recyclables",
            "paper": "paper_cardboard",
            "plastic": "recyclables",
            "trash": "residual_waste",
        },
    },
    {
        "name": "glhdamar/new-trash-classfication-dataset",
        "slug": "glhdamar_new-trash-classfication-dataset",
        "path": "new-dataset-trash-type-v2",
        "class_mappings": {
            "cardboard": "paper_cardboard",
            "glass": "glass",
            "metal": "recyclables",
            "paper": "paper_cardboard",
            "plastic": "recyclables",
            "trash": "residual_waste",
            "e-waste": "electronics",  # Map e-waste to electronics
            "organic": "bio_waste",  # Map organic to bio_waste
            "textile": "textile_reuse",  # Map textile to textile_reuse
        },
    },
    {
        "name": "joebeachcapital/realwaste",
        "slug": "joebeachcapital_realwaste",
        "path": "realwaste-main/RealWaste",
        "class_mappings": {
            "Cardboard": "paper_cardboard",
            "Glass": "glass",
            "Metal": "recyclables",
            "Paper": "paper_cardboard",
            "Plastic": "recyclables",
            "Miscellaneous Trash": "residual_waste",
            "Food Organics": "bio_waste",  # Map to bio_waste
            "Textile Trash": "textile_reuse",  # Map to textile_reuse
            "Vegetation": "bio_waste",  # Map to bio_waste
        },
    },
    {
        "name": "mostafaabla/garbage-classification",
        "slug": "mostafaabla_garbage-classification",
        "path": "garbage_classification",
        "class_mappings": {
            "cardboard": "paper_cardboard",
            "metal": "recyclables",
            "paper": "paper_cardboard",
            "plastic": "recyclables",
            "trash": "residual_waste",
            "battery": "battery",  # Map battery to battery
            "biological": "bio_waste",  # Map biological to bio_waste
            "clothes": "textile_reuse",  # Map clothes to textile_reuse
            "shoes": "textile_reuse",  # Map shoes to textile_reuse
            "brown-glass": "glass",  # Map glass variants to glass
            "green-glass": "glass",
            "white-glass": "glass",
        },
    },
    {
        "name": "karansolanki01/garbage-classification",
        "slug": "karansolanki01_garbage-classification",
        "path": "Data/Garbage_Classification",
        "class_mappings": {
            "Cardboard": "paper_cardboard",
            "Glass": "glass",
            "Metal": "recyclables",
            "Paper": "paper_cardboard",
            "Plastic": "recyclables",
            "Battery": "battery",  # Map Battery to battery
            "Clothes": "textile_reuse",  # Map Clothes to textile_reuse
        },
    },
    {
        "name": "sumn2u/garbage-classification-v2",
        "slug": "sumn2u_garbage-classification-v2",
        "path": "garbage-dataset",
        "class_mappings": {
            "cardboard": "paper_cardboard",
            "glass": "glass",
            "metal": "recyclables",
            "paper": "paper_cardboard",
            "plastic": "recyclables",
            "trash": "residual_waste",
            "battery": "battery",  # Map battery to battery
            "biological": "bio_waste",  # Map biological to bio_waste
            "clothes": "textile_reuse",  # Map clothes to textile_reuse
            "shoes": "textile_reuse",  # Map shoes to textile_reuse
        },
    },
]


def ensure_kaggle_download(datasets: List[str], raw_dir: str) -> list[str]:
    os.makedirs(raw_dir, exist_ok=True)
    api = KaggleApi()
    api.authenticate()
    extracted_dirs = []
    for ds in datasets:
        slug = ds.replace("/", "_")
        zip_name = ds.split("/")[-1] + ".zip"
        target_zip = Path(raw_dir) / zip_name
        target_dir = Path(raw_dir) / slug
        # If already extracted, skip everything
        if target_dir.exists():
            print(f"[SKIP] Already extracted: {target_dir}")
            extracted_dirs.append(str(target_dir))
            continue
        # If zip exists, skip download
        if not target_zip.exists():
            print(f"Downloading {ds} -> {target_zip} ...")
            api.dataset_download_files(ds, path=raw_dir, quiet=False, unzip=False)
        else:
            print(f"[SKIP] Zip already exists: {target_zip}")
        print(f"Extracting {target_zip} ...")
        with zipfile.ZipFile(target_zip, "r") as zf:
            zf.extractall(target_dir)
        extracted_dirs.append(str(target_dir))
    return extracted_dirs


def consolidate_datasets(extracted_dirs: list[str], merged_dir: str) -> str:
    os.makedirs(merged_dir, exist_ok=True)
    for cls in CANONICAL_CLASSES:
        os.makedirs(os.path.join(merged_dir, cls), exist_ok=True)

    count = 0
    for ed in extracted_dirs:
        for root, dirs, files in os.walk(ed):
            leaf = Path(root).name.lower()
            canonical = normalize_label(leaf)
            if canonical is None:
                continue
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in IMAGE_EXTS:
                    src = os.path.join(root, f)
                    # Strict validation: open and load image, only allow JPEG/PNG
                    try:
                        from PIL import Image

                        with Image.open(src) as im:
                            im.load()  # Actually load image data
                            if im.format not in ("JPEG", "PNG"):
                                print(f"[WARN] Skipping unsupported format: {src} ({im.format})")
                                continue
                    except Exception:
                        print(f"[WARN] Skipping invalid image: {src}")
                        continue
                    dst = os.path.join(merged_dir, canonical, f"{Path(ed).name}_{leaf}_{f}")
                    if not os.path.exists(dst):
                        try:
                            os.link(src, dst)  # hard link to save space
                        except OSError:
                            import shutil

                            shutil.copy2(src, dst)
                        count += 1
    print(f"Consolidated {count} images into {merged_dir}")
    return merged_dir


def consolidate_datasets_explicit(raw_dir: str, merged_dir: str, datasets: List[str] = None) -> str:
    """Consolidate datasets using explicit configurations for precise control.

    Args:
        raw_dir: Directory containing extracted datasets
        merged_dir: Directory to consolidate images into
        datasets: List of dataset names to process (defaults to all in DATASET_CONFIGS)

    Returns:
        Path to merged directory
    """
    if datasets is None:
        datasets = [config["name"] for config in DATASET_CONFIGS]

    os.makedirs(merged_dir, exist_ok=True)
    for cls in CANONICAL_CLASSES:
        os.makedirs(os.path.join(merged_dir, cls), exist_ok=True)

    count = 0
    for config in DATASET_CONFIGS:
        if config["name"] not in datasets:
            continue

        dataset_dir = Path(raw_dir) / config["slug"]
        if not dataset_dir.exists():
            print(f"[SKIP] Dataset not found: {dataset_dir}")
            continue

        data_path = dataset_dir / config["path"]
        if not data_path.exists():
            print(f"[WARN] Data path not found: {data_path}")
            continue

        print(f"Processing dataset: {config['name']}")

        # Process each class mapping
        for original_label, canonical in config["class_mappings"].items():
            class_dir = data_path / original_label
            if not class_dir.exists():
                print(f"[WARN] Class directory not found: {class_dir}")
                continue

            for f in class_dir.iterdir():
                if not f.is_file():
                    continue
                ext = f.suffix.lower()
                if ext not in IMAGE_EXTS:
                    continue

                # Validate image
                try:
                    from PIL import Image

                    with Image.open(f) as im:
                        im.load()
                        if im.format not in ("JPEG", "PNG"):
                            print(f"[WARN] Skipping unsupported format: {f} ({im.format})")
                            continue
                except Exception:
                    print(f"[WARN] Skipping invalid image: {f}")
                    continue

                dst = os.path.join(
                    merged_dir, canonical, f"{config['slug']}_{original_label}_{f.name}"
                )
                if not os.path.exists(dst):
                    try:
                        os.link(str(f), dst)  # hard link to save space
                    except OSError:
                        import shutil

                        shutil.copy2(str(f), dst)
                    count += 1

    print(f"Consolidated {count} images into {merged_dir} using explicit configs")
    return merged_dir


def prepare_datasets(
    raw_dir: str = "raw_datasets",
    merged_dir: str = "merged_dataset",
    datasets: List[str] = None,
    use_explicit: bool = True,
) -> str:
    """Prepare datasets by downloading and consolidating them.

    Args:
        raw_dir: Directory for raw/extracted datasets
        merged_dir: Directory for consolidated dataset
        datasets: List of dataset names to process
        use_explicit: Whether to use explicit configurations (recommended)

    Returns:
        Path to merged dataset directory
    """
    if datasets is None:
        datasets = DATASET_SLUGS

    print(f"Preparing datasets: {datasets}")
    print(f"Raw directory: {raw_dir}")
    print(f"Merged directory: {merged_dir}")

    # Download and extract datasets
    extracted_dirs = ensure_kaggle_download(datasets, raw_dir)

    # Consolidate datasets
    if use_explicit:
        return consolidate_datasets_explicit(raw_dir, merged_dir, datasets)
    else:
        return consolidate_datasets(extracted_dirs, merged_dir)


def get_canonical_classes() -> list[str]:
    return CANONICAL_CLASSES


def get_german_label_info() -> Dict[str, Dict[str, str]]:
    return GERMAN_LABEL_INFO


def build_dataset_index(merged_dir: str, output_json: str) -> str:
    """Build a JSON index of consolidated dataset for easy consumption.

    Structure:
    {
      "version": 1,
      "root": "merged_dataset",
      "classes": [...],
      "items": [
         {"path": "paper/slug_label_filename.jpg", "canonical": "paper", "german": {..}, "source_dataset": "user/dataset", "original_label": "paper"}
      ],
      "stats": {"total_images": N, "per_class": {"paper": M, ...}}
    }
    """
    merged_path = Path(merged_dir)
    if not merged_path.exists():
        raise FileNotFoundError(f"Merged directory not found: {merged_dir}")
    items = []
    for canonical in CANONICAL_CLASSES:
        class_dir = merged_path / canonical
        if not class_dir.exists():
            continue
        for f in class_dir.iterdir():
            if not f.is_file():
                continue
            if f.suffix.lower() not in IMAGE_EXTS:
                continue
            parts = f.name.split("_")
            source_slug = parts[0] if parts else "unknown"
            original_label = parts[1] if len(parts) > 1 else canonical
            # Attempt to recover original dataset slug from prefix (first underscore replaced by /)
            source_dataset = (
                source_slug.replace("_", "/", 1)
                if "/" not in source_slug and source_slug.count("_") >= 1
                else source_slug
            )
            items.append(
                {
                    "path": str(f.relative_to(merged_path)),
                    "canonical": canonical,
                    "german": GERMAN_LABEL_INFO.get(canonical, {}),
                    "source_dataset": source_dataset,
                    "original_label": original_label,
                }
            )
    index = {
        "version": 1,
        "root": merged_path.name,
        "classes": CANONICAL_CLASSES,
        "items": items,
        "stats": {"total_images": len(items), "per_class": {c: 0 for c in CANONICAL_CLASSES}},
    }
    for it in items:
        index["stats"]["per_class"][it["canonical"]] += 1
    with open(output_json, "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, indent=2)
    print(f"[INDEX] Wrote dataset index: {output_json} ({len(items)} images)")
    return output_json


__all__ = [
    "ensure_kaggle_download",
    "consolidate_datasets",
    "consolidate_datasets_explicit",
    "prepare_datasets",
    "build_dataset_index",
    "get_canonical_classes",
    "get_german_label_info",
    "normalize_label",
    "DATASET_SLUGS",
    "DATASET_CONFIGS",
]
