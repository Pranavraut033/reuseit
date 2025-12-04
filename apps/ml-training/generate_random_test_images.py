#!/usr/bin/env python
"""Generate a random set of test images from the merged_dataset.

This script samples images from class subfolders and writes them to an
output directory. It can balance samples per class or sample globally.
It can also optionally resize images to a specified size and apply simple
augmentations (horizontal flip, JPEG compression) for variety.

Usage examples:

# Sample 50 images randomly from the dataset
python generate_random_test_images.py --dataset merged_dataset --output test_images --num 50

# Sample 10 images per class (balanced)
python generate_random_test_images.py --dataset merged_dataset --output test_images --per-class --num 10

# Sample 20 images and resize to 224x224
python generate_random_test_images.py --dataset merged_dataset --output test_images --num 20 --resize 224

"""

from pathlib import Path
import argparse
import random
import shutil
import json
from PIL import Image
import os

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def collect_images(dataset_dir: Path):
    """Collect images grouped by immediate subfolder (class).

    Returns dict[class_name] = [Path,...]
    """
    classes = {}
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")

    for child in sorted(dataset_dir.iterdir()):
        if child.is_dir():
            imgs = [p for p in child.rglob("*") if p.suffix.lower() in IMAGE_EXTENSIONS]
            if imgs:
                classes[child.name] = imgs
    # Also include any images in root by using key '__root__'
    root_imgs = [
        p
        for p in dataset_dir.rglob("*")
        if p.parent == dataset_dir and p.suffix.lower() in IMAGE_EXTENSIONS
    ]
    if root_imgs:
        classes.setdefault("__root__", []).extend(root_imgs)
    return classes


def sample_images(classes_dict, num: int, per_class: bool, seed: int):
    random.seed(seed)
    sampled = []  # list of tuples (path, class_name)

    if per_class:
        for cls, imgs in classes_dict.items():
            k = min(num, len(imgs))
            chosen = random.sample(imgs, k)
            sampled.extend([(p, cls) for p in chosen])
    else:
        all_imgs = []
        for cls, imgs in classes_dict.items():
            all_imgs.extend([(p, cls) for p in imgs])
        if not all_imgs:
            return []
        k = min(num, len(all_imgs))
        sampled = random.sample(all_imgs, k)

    return sampled


def process_and_copy(
    path: Path,
    out_path: Path,
    resize: int | None = None,
    augment: bool = False,
    jpeg_quality: int | None = None,
):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if resize is None and not augment and jpeg_quality is None:
        # Simple copy
        shutil.copy2(path, out_path)
        return

    # Open and process via PIL
    try:
        im = Image.open(path).convert("RGB")
    except Exception:
        # Fallback to copying if PIL fails
        shutil.copy2(path, out_path)
        return

    if resize is not None:
        im = im.resize((resize, resize), Image.LANCZOS)

    if augment:
        # Simple augmentation: random horizontal flip
        if random.random() < 0.5:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)

    save_kwargs = {}
    if jpeg_quality is not None:
        save_kwargs["quality"] = int(jpeg_quality)
        save_kwargs["subsampling"] = 0

    # Always save as JPEG for consistency
    out_path_jpg = out_path.with_suffix(".jpg")
    im.save(out_path_jpg, format="JPEG", **save_kwargs)


def main():
    parser = argparse.ArgumentParser(description="Generate random test images from merged_dataset")
    parser.add_argument(
        "--dataset", type=str, default="merged_dataset", help="Path to dataset directory"
    )
    parser.add_argument(
        "--output", type=str, required=True, help="Output directory for sampled images"
    )
    parser.add_argument(
        "--num",
        type=int,
        default=50,
        help="Number of images to sample (global) or per class when --per-class is set",
    )
    parser.add_argument(
        "--per-class", action="store_true", help="Sample --num images per class instead of globally"
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument(
        "--resize", type=int, default=None, help="Resize images to SIZE x SIZE (optional)"
    )
    parser.add_argument(
        "--augment", action="store_true", help="Apply simple augmentation (random horizontal flip)"
    )
    parser.add_argument(
        "--jpeg-quality",
        type=int,
        default=None,
        help="If set, save outputs as JPEG with this quality (1-95)",
    )
    parser.add_argument(
        "--manifest",
        type=str,
        default="manifest.json",
        help="Filename for manifest saved inside output dir",
    )

    args = parser.parse_args()

    dataset_dir = Path(args.dataset).resolve()
    out_dir = Path(args.output).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    classes = collect_images(dataset_dir)
    if not classes:
        print(f"No images found under {dataset_dir}")
        return

    sampled = sample_images(classes, args.num, args.per_class, args.seed)
    if not sampled:
        print("No images sampled (check --num and dataset size)")
        return

    manifest = []
    for idx, (src, cls) in enumerate(sampled, start=1):
        # Create a filename with index to avoid collisions
        fname = f"img_{idx:04d}_{src.stem}.jpg"
        cls_dir = out_dir / cls
        cls_dir.mkdir(parents=True, exist_ok=True)
        dst = cls_dir / fname
        process_and_copy(
            src, dst, resize=args.resize, augment=args.augment, jpeg_quality=args.jpeg_quality
        )
        manifest.append({"original": str(src), "class": cls, "output": str(dst)})

    # Save manifest
    manifest_path = out_dir / args.manifest
    with open(manifest_path, "w") as fh:
        json.dump(manifest, fh, indent=2)

    print(f"Saved {len(manifest)} images to {out_dir}")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
