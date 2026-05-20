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
from collections import deque
from typing import Iterable

try:
    from PIL import Image
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Pillow is required. Install it with: python -m pip install pillow"
    ) from exc


IMAGE_EXTENSIONS = {".png", ".webp", ".jpg", ".jpeg"}

WALK_MOTION = [
    {"x": -2, "y": 3, "rotation": -2.0},
    {"x": -1, "y": 0, "rotation": -1.0},
    {"x": 0, "y": -3, "rotation": 0.0},
    {"x": 1, "y": 0, "rotation": 1.0},
    {"x": 2, "y": 3, "rotation": 2.0},
    {"x": 1, "y": 0, "rotation": 1.0},
    {"x": 0, "y": -3, "rotation": 0.0},
    {"x": -1, "y": 0, "rotation": -1.0},
]


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


def parse_hex_color(value: str) -> tuple[int, int, int]:
    normalized = value.strip().removeprefix("#")
    if len(normalized) != 6:
        raise argparse.ArgumentTypeError("Color must be a 6-digit hex value, e.g. #00ff00.")
    try:
        return (
            int(normalized[0:2], 16),
            int(normalized[2:4], 16),
            int(normalized[4:6], 16),
        )
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Color must be a 6-digit hex value.") from exc


def remove_chroma_background(
    image: Image.Image,
    key_color: tuple[int, int, int],
    tolerance: int,
    alpha_cutoff: int,
) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    key_r, key_g, key_b = key_color

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            distance = ((r - key_r) ** 2 + (g - key_g) ** 2 + (b - key_b) ** 2) ** 0.5
            green_screen = g > 120 and g > r * 1.35 and g > b * 1.35
            light_background = min(r, g, b) >= 232 and max(r, g, b) - min(r, g, b) <= 24
            if a <= alpha_cutoff or distance <= tolerance or green_screen or light_background:
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


def split_source_sheet(source_sheet: Path, frame_count: int) -> list[Image.Image]:
    sheet = Image.open(source_sheet).convert("RGBA")
    frame_width = sheet.width // frame_count
    if frame_width <= 0:
        raise SystemExit("Source sheet is too narrow for the requested frame count.")

    frames: list[Image.Image] = []
    for index in range(frame_count):
        left = index * frame_width
        right = sheet.width if index == frame_count - 1 else (index + 1) * frame_width
        frames.append(sheet.crop((left, 0, right, sheet.height)))
    return frames


def split_source_sheet_by_content(
    source_sheet: Path,
    frame_count: int,
    key_color: tuple[int, int, int],
    tolerance: int,
    alpha_cutoff: int,
    padding: int,
    min_column_alpha: int,
) -> list[Image.Image]:
    sheet = remove_chroma_background(
        Image.open(source_sheet),
        key_color=key_color,
        tolerance=tolerance,
        alpha_cutoff=alpha_cutoff,
    )
    alpha = sheet.getchannel("A")
    columns: list[bool] = []
    for x in range(sheet.width):
        count = 0
        for y in range(sheet.height):
            if alpha.getpixel((x, y)) > alpha_cutoff:
                count += 1
                if count >= min_column_alpha:
                    break
        columns.append(count >= min_column_alpha)

    runs: list[tuple[int, int]] = []
    start: int | None = None
    for index, occupied in enumerate(columns):
        if occupied and start is None:
            start = index
        elif not occupied and start is not None:
            runs.append((start, index))
            start = None
    if start is not None:
        runs.append((start, len(columns)))

    runs = [(left, right) for left, right in runs if right - left >= 8]
    if len(runs) != frame_count:
        raise SystemExit(
            f"Expected {frame_count} content frames, but detected {len(runs)}. "
            "Tune --sheet-split-padding, --min-column-alpha, or use --sheet-split-mode equal."
        )

    frames: list[Image.Image] = []
    for left, right in runs:
        crop_left = max(0, left - padding)
        crop_right = min(sheet.width, right + padding)
        frames.append(sheet.crop((crop_left, 0, crop_right, sheet.height)))
    return frames


def connected_component_bboxes(
    alpha: Image.Image,
    alpha_cutoff: int,
    min_pixels: int,
) -> list[tuple[int, int, int, int, int, list[tuple[int, int]]]]:
    width, height = alpha.size
    visited = bytearray(width * height)
    bboxes: list[tuple[int, int, int, int, int, list[tuple[int, int]]]] = []

    for start_y in range(height):
        for start_x in range(width):
            start_index = start_y * width + start_x
            if visited[start_index] or alpha.getpixel((start_x, start_y)) <= alpha_cutoff:
                continue

            visited[start_index] = 1
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            left = right = start_x
            top = bottom = start_y
            count = 0
            pixels: list[tuple[int, int]] = []

            while queue:
                x, y = queue.popleft()
                count += 1
                pixels.append((x, y))
                left = min(left, x)
                right = max(right, x)
                top = min(top, y)
                bottom = max(bottom, y)

                for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if next_x < 0 or next_x >= width or next_y < 0 or next_y >= height:
                        continue
                    next_index = next_y * width + next_x
                    if visited[next_index] or alpha.getpixel((next_x, next_y)) <= alpha_cutoff:
                        continue
                    visited[next_index] = 1
                    queue.append((next_x, next_y))

            if count >= min_pixels:
                bboxes.append((left, top, right + 1, bottom + 1, count, pixels))

    return bboxes


def split_source_sheet_by_components(
    source_sheet: Path,
    frame_count: int,
    key_color: tuple[int, int, int],
    tolerance: int,
    alpha_cutoff: int,
    padding: int,
    min_component_pixels: int,
) -> list[Image.Image]:
    sheet = remove_chroma_background(
        Image.open(source_sheet),
        key_color=key_color,
        tolerance=tolerance,
        alpha_cutoff=alpha_cutoff,
    )
    components = connected_component_bboxes(
        sheet.getchannel("A"),
        alpha_cutoff=alpha_cutoff,
        min_pixels=min_component_pixels,
    )
    if not components:
        raise SystemExit("No content components detected in source sheet.")

    slot_width = sheet.width / frame_count
    groups: list[dict[str, object] | None] = [None] * frame_count
    for left, top, right, bottom, _count, pixels in components:
        center_x = (left + right) / 2
        slot = min(frame_count - 1, max(0, int(center_x // slot_width)))
        if groups[slot] is None:
            groups[slot] = {
                "bbox": [left, top, right, bottom],
                "pixels": list(pixels),
            }
        else:
            group = groups[slot]
            assert group is not None
            bbox = group["bbox"]
            group_pixels = group["pixels"]
            assert isinstance(bbox, list)
            assert isinstance(group_pixels, list)
            bbox[0] = min(bbox[0], left)
            bbox[1] = min(bbox[1], top)
            bbox[2] = max(bbox[2], right)
            bbox[3] = max(bbox[3], bottom)
            group_pixels.extend(pixels)

    if any(group is None for group in groups):
        missing = [str(index + 1) for index, group in enumerate(groups) if group is None]
        raise SystemExit(f"No content detected for frame slot(s): {', '.join(missing)}.")

    frames: list[Image.Image] = []
    sheet_pixels = sheet.load()
    for group in groups:
        assert group is not None
        bbox = group["bbox"]
        pixels = group["pixels"]
        assert isinstance(bbox, list)
        assert isinstance(pixels, list)
        left, top, right, bottom = bbox
        crop_left = max(0, left - padding)
        crop_top = max(0, top - padding)
        crop_right = min(sheet.width, right + padding)
        crop_bottom = min(sheet.height, bottom + padding)
        frame = Image.new(
            "RGBA",
            (crop_right - crop_left, crop_bottom - crop_top),
            (255, 255, 255, 0),
        )
        frame_pixels = frame.load()
        for x, y in pixels:
            if crop_left <= x < crop_right and crop_top <= y < crop_bottom:
                frame_pixels[x - crop_left, y - crop_top] = sheet_pixels[x, y]
        frames.append(frame)
    return frames


def crop_focus_region(image: Image.Image, focus: str, person_crop_ratio: float) -> Image.Image:
    if focus == "full":
        return image

    width, height = image.size
    crop_right = max(1, min(width, round(width * person_crop_ratio)))
    return image.crop((0, 0, crop_right, height))


def apply_walk_motion(image: Image.Image, index: int, enabled: bool) -> Image.Image:
    if not enabled:
        return image

    motion = WALK_MOTION[index % len(WALK_MOTION)]
    rotated = image.rotate(
        motion["rotation"],
        resample=Image.Resampling.BICUBIC,
        expand=True,
    )
    frame = Image.new(
        "RGBA",
        (
            rotated.width + abs(motion["x"]) * 2 + 8,
            rotated.height + abs(motion["y"]) * 2 + 8,
        ),
        (255, 255, 255, 0),
    )
    x = (frame.width - rotated.width) // 2 + motion["x"]
    y = (frame.height - rotated.height) // 2 + motion["y"]
    frame.alpha_composite(rotated, (x, y))
    return frame


def fit_into_frame(image: Image.Image, frame_width: int, frame_height: int) -> Image.Image:
    frame = Image.new("RGBA", (frame_width, frame_height), (255, 255, 255, 0))
    fitted = image.copy()
    fitted.thumbnail((frame_width, frame_height), Image.Resampling.LANCZOS)

    x = (frame_width - fitted.width) // 2
    y = (frame_height - fitted.height) // 2
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
        "--source-sheet",
        type=Path,
        help="Horizontal sprite sheet to split into frames before processing.",
    )
    parser.add_argument(
        "--sheet-frame-count",
        type=int,
        default=8,
        help="Frame count used when --source-sheet is provided.",
    )
    parser.add_argument(
        "--sheet-split-mode",
        choices=["equal", "auto", "components"],
        default="equal",
        help="Split --source-sheet by equal columns, occupied columns, or connected content components.",
    )
    parser.add_argument(
        "--sheet-split-padding",
        type=int,
        default=12,
        help="Horizontal padding added to content-detected source sheet frames.",
    )
    parser.add_argument(
        "--min-column-alpha",
        type=int,
        default=8,
        help="Minimum non-transparent pixels for a source sheet column to count as content.",
    )
    parser.add_argument(
        "--min-component-pixels",
        type=int,
        default=160,
        help="Minimum connected pixels for a source sheet component to count as frame content.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/pilgrimage/route/walker-dog-sprite.png"),
        help="Output sprite sheet path.",
    )
    parser.add_argument(
        "--frame-px",
        type=int,
        default=192,
        help="Pixel size of each square frame in the generated sheet.",
    )
    parser.add_argument(
        "--frame-width",
        type=int,
        help="Output frame width. Defaults to --frame-px.",
    )
    parser.add_argument(
        "--frame-height",
        type=int,
        help="Output frame height. Defaults to --frame-px.",
    )
    parser.add_argument(
        "--display-width",
        type=int,
        help="Suggested CSS/display width for each frame in project config.",
    )
    parser.add_argument(
        "--display-height",
        type=int,
        help="Suggested CSS/display height for each frame in project config.",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=18,
        help="Transparent padding kept around the trimmed subject before fitting.",
    )
    parser.add_argument(
        "--focus",
        choices=["person", "full"],
        default="person",
        help="Use only the left character area, or keep the full person-and-dog source.",
    )
    parser.add_argument(
        "--person-crop-ratio",
        type=float,
        default=0.5,
        help="Source width ratio kept when --focus person is used.",
    )
    parser.add_argument(
        "--motion",
        choices=["walk", "none"],
        default="walk",
        help="Add small frame-by-frame bob/sway to emphasize the walking cycle.",
    )
    parser.add_argument(
        "--keep-background",
        action="store_true",
        help="Do not key out the light checker/white background.",
    )
    parser.add_argument(
        "--chroma-key",
        type=parse_hex_color,
        help="Remove a chroma-key background such as #00ff00.",
    )
    parser.add_argument(
        "--chroma-tolerance",
        type=int,
        default=88,
        help="RGB distance tolerance for --chroma-key.",
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
    frame_width = args.frame_width or args.frame_px
    frame_height = args.frame_height or args.frame_px
    display_width = args.display_width or frame_width
    display_height = args.display_height or frame_height

    if args.source_sheet:
        sheet = args.source_sheet.resolve()
        if not sheet.exists():
            raise SystemExit(f"Source sheet does not exist: {sheet}")
        if args.sheet_split_mode == "components":
            if not args.chroma_key:
                raise SystemExit("--sheet-split-mode components requires --chroma-key.")
            source_frames = split_source_sheet_by_components(
                sheet,
                frame_count=args.sheet_frame_count,
                key_color=args.chroma_key,
                tolerance=args.chroma_tolerance,
                alpha_cutoff=args.alpha_cutoff,
                padding=args.sheet_split_padding,
                min_component_pixels=args.min_component_pixels,
            )
        elif args.sheet_split_mode == "auto":
            if not args.chroma_key:
                raise SystemExit("--sheet-split-mode auto requires --chroma-key.")
            source_frames = split_source_sheet_by_content(
                sheet,
                frame_count=args.sheet_frame_count,
                key_color=args.chroma_key,
                tolerance=args.chroma_tolerance,
                alpha_cutoff=args.alpha_cutoff,
                padding=args.sheet_split_padding,
                min_column_alpha=args.min_column_alpha,
            )
        else:
            source_frames = split_source_sheet(sheet, frame_count=args.sheet_frame_count)
    else:
        if not source.exists():
            raise SystemExit(f"Source directory does not exist: {source}")

        images = source_images(source)
        if not images:
            raise SystemExit(f"No image frames found in: {source}")
        source_frames = [Image.open(image_path) for image_path in images]

    frames: list[Image.Image] = []
    for index, image in enumerate(source_frames):
        if args.keep_background:
            prepared = image.convert("RGBA")
        elif args.chroma_key:
            prepared = remove_chroma_background(
                image,
                key_color=args.chroma_key,
                tolerance=args.chroma_tolerance,
                alpha_cutoff=args.alpha_cutoff,
            )
        else:
            prepared = remove_light_background(
                image,
                threshold=args.bg_threshold,
                tolerance=args.bg_tolerance,
                alpha_cutoff=args.alpha_cutoff,
            )
        prepared = crop_focus_region(
            prepared,
            focus=args.focus,
            person_crop_ratio=args.person_crop_ratio,
        )
        prepared = trim_alpha(prepared, padding=args.padding)
        prepared = apply_walk_motion(prepared, index=index, enabled=args.motion == "walk")
        frames.append(fit_into_frame(prepared, frame_width=frame_width, frame_height=frame_height))

    save_sheet(frames, output=output, quality=args.quality)

    print(f"Generated: {output}")
    print(f"Frames: {len(frames)}")
    print(f"Frame pixels: {frame_width}x{frame_height}")
    print(f"Sheet pixels: {frame_width * len(frames)}x{frame_height}")
    print()
    print("Current project config should use:")
    print("routeAnimation: {")
    print("  actor: {")
    print(f"    imageUrl: '/pilgrimage/route/{output.name}',")
    print(f"    frameSize: [{display_width}, {display_height}],")
    print(f"    frameCount: {len(frames)},")
    print("    fps: 8,")
    print(f"    anchor: [{display_width // 2}, {display_height // 2}],")
    print("    rotateWithRoute: true,")
    print("  },")
    print("}")


if __name__ == "__main__":
    main()
