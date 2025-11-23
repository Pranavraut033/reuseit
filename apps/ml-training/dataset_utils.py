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

# Canonical class set (German-aligned)
CANONICAL_CLASSES = [
    "cardboard",
    "paper",
    "glass",
    "metal",
    "plastic",
    "biological",
    "trash",
    "battery",
    "e_waste",
    "clothes",
    "shoes",
]

GERMAN_LABEL_INFO = {
    "cardboard": {"de": "Papier/Pappe", "stream": "Papier"},
    "paper": {"de": "Papier/Pappe", "stream": "Papier"},
    "glass": {"de": "Glas", "stream": "Glas"},
    "metal": {"de": "Metall", "stream": "Metall"},
    "plastic": {"de": "Kunststoff", "stream": "Kunststoff"},
    "biological": {"de": "Bioabfall", "stream": "Bio"},
    "trash": {"de": "Restmüll", "stream": "Restmüll"},
    "battery": {"de": "Batterien", "stream": "Sonderabfall"},
    "e_waste": {"de": "Elektroschrott", "stream": "Sonderabfall"},
    "clothes": {"de": "Textilien", "stream": "Textilien"},
    "shoes": {"de": "Schuhe", "stream": "Textilien"},
}

# Raw label mapping across datasets -> canonical label (case-insensitive via lowercasing)
RAW_CLASS_MAP: Dict[str, str] = {
    # Direct matches
    "cardboard": "cardboard",
    "paper": "paper",
    "glass": "glass",
    "metal": "metal",
    "plastic": "plastic",
    "trash": "trash",
    "biological": "biological",
    "organic": "biological",
    "food organics": "biological",
    "vegetation": "biological",
    "battery": "battery",
    "batteries": "battery",
    "e-waste": "e_waste",
    "ewaste": "e_waste",
    "clothes": "clothes",
    "textile": "clothes",
    "textile trash": "clothes",
    "shoes": "shoes",
    # Split glass variants
    "brown-glass": "glass",
    "green-glass": "glass",
    "white-glass": "glass",
    # Other multi-word labels
    "miscellaneous trash": "trash",
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
    "build_dataset_index",
    "get_canonical_classes",
    "get_german_label_info",
    "normalize_label",
    "DATASET_SLUGS",
]
