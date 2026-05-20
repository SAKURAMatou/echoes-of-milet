"""Generate the pilgrimage route actor sprite sheet.

Default input/output matches the current project:

    python scripts/generate_pilgrimage_route_spritesheet.py

The source images are sorted by filename and packed into one horizontal sprite
sheet. The current generated images have a light checker/white background
instead of alpha, so light low-saturation pixels are made transparent by
default. Tune --bg-threshold / --bg-tolerance if the outline is cut too much.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable

try:
    from PIL import Image
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Pillow is required. Install it with: python -m pip install pillow"
    ) from exc


IMAGE_EXTENSIONS = {".png", ".webp", ".jpg", ".jpeg"}


def natural_key(path: Path) -> list[object]:
    parts = re.split(r"(\d+)", path.name)
    return [int(part) if part.isdigit() else part.casefold() for part in parts]


def source_images(source_dir: Path) -> list[Path]:
    images = [
        path
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    ]
    return sorted(images, key=natural_key)


def remove_light_background(
    image: Image.Image,
    threshold: int,
    tolerance: int,
    alpha_cutoff: int,
) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
      for x in range(width):
        r, g, b, a = pixels[x, y]
        channel_range = max(r, g, b) - min(r, g, b)
        if a <= alpha_cutoff or (min(r, g, b) >= threshold and channel_range <= tolerance):
          pixels[x, y] = (r, g, b, 0)

    return rgba


def trim_alpha(image: Image.Image, padding: int) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def fit_into_frame(image: Image.Image, frame_size: int) -> Image.Image:
    frame = Image.new("RGBA", (frame_size, frame_size), (255, 255, 255, 0))
    fitted = image.copy()
    fitted.thumbnail((frame_size, frame_size), Image.Resampling.LANCZOS)

    x = (frame_size - fitted.width) // 2
    y = (frame_size - fitted.height) // 2
    frame.alpha_composite(fitted, (x, y))
    return frame


def save_sheet(frames: Iterable[Image.Image], output: Path, quality: int) -> None:
    frame_list = list(frames)
    if not frame_list:
        raise SystemExit("No frames to save.")

    frame_width, frame_height = frame_list[0].size
    sheet = Image.new(
        "RGBA",
        (frame_width * len(frame_list), frame_height),
        (255, 255, 255, 0),
    )

    for index, frame in enumerate(frame_list):
        sheet.alpha_composite(frame, (index * frame_width, 0))

    output.parent.mkdir(parents=True, exist_ok=True)
    suffix = output.suffix.lower()
    if suffix == ".webp":
        sheet.save(output, "WEBP", lossless=True, quality=quality, method=6)
    else:
        sheet.save(output, "PNG", optimize=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the pilgrimage route actor horizontal sprite sheet."
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(r"D:\CODE\PYTHON\spritesheet"),
        help="Directory containing ordered frame images.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/pilgrimage/route/walker-sprite-v1.png"),
        help="Output sprite sheet path.",
    )
    parser.add_argument(
        "--frame-px",
        type=int,
        default=192,
        help="Pixel size of each square frame in the generated sheet.",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=24,
        help="Transparent padding kept around the trimmed subject before fitting.",
    )
    parser.add_argument(
        "--keep-background",
        action="store_true",
        help="Do not key out the light checker/white background.",
    )
    parser.add_argument(
        "--bg-threshold",
        type=int,
        default=232,
        help="Minimum RGB channel value considered background.",
    )
    parser.add_argument(
        "--bg-tolerance",
        type=int,
        default=18,
        help="Maximum RGB channel spread considered low-saturation background.",
    )
    parser.add_argument(
        "--alpha-cutoff",
        type=int,
        default=2,
        help="Existing alpha values at or below this become fully transparent.",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=95,
        help="WebP quality when output path ends with .webp.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source = args.source.resolve()
    output = args.output.resolve()

    if not source.exists():
        raise SystemExit(f"Source directory does not exist: {source}")

    images = source_images(source)
    if not images:
        raise SystemExit(f"No image frames found in: {source}")

    frames: list[Image.Image] = []
    for image_path in images:
        image = Image.open(image_path)
        if args.keep_background:
            prepared = image.convert("RGBA")
        else:
            prepared = remove_light_background(
                image,
                threshold=args.bg_threshold,
                tolerance=args.bg_tolerance,
                alpha_cutoff=args.alpha_cutoff,
            )
        prepared = trim_alpha(prepared, padding=args.padding)
        frames.append(fit_into_frame(prepared, frame_size=args.frame_px))

    save_sheet(frames, output=output, quality=args.quality)

    print(f"Generated: {output}")
    print(f"Frames: {len(frames)}")
    print(f"Frame pixels: {args.frame_px}x{args.frame_px}")
    print(f"Sheet pixels: {args.frame_px * len(frames)}x{args.frame_px}")
    print()
    print("Current project config should use:")
    print("routeAnimation: {")
    print("  actor: {")
    print(f"    imageUrl: '/pilgrimage/route/{output.name}',")
    print("    frameSize: [56, 56],")
    print(f"    frameCount: {len(frames)},")
    print("    fps: 8,")
    print("    anchor: [28, 28],")
    print("    rotateWithRoute: true,")
    print("  },")
    print("}")


if __name__ == "__main__":
    main()
