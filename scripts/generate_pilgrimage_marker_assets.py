r"""Generate pilgrimage marker WebP assets from one or more source images.

Examples:

    python scripts/generate_pilgrimage_marker_assets.py ^
      "C:\Users\daili\Desktop\milet_marker_blank_h256.webp"

    python scripts/generate_pilgrimage_marker_assets.py ^
      "D:\assets\marker-a.png" "D:\assets\marker-b.png" ^
      --output-dir public/pilgrimage/markers --height 256 --prefix character

The script keeps aspect ratio, preserves source transparency by default, trims
transparent edges, pads the result, and writes WebP files that can be referenced
from pilgrimageMapConfig.personalizedMarkers.skins. Use --remove-light-bg only
for sources that really have a removable checker/white background; marker art
often contains intentional white label areas.
"""

from __future__ import annotations

import argparse
import glob
import re
from collections import deque
from pathlib import Path

try:
    from PIL import Image
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Pillow is required. Install it with: python -m pip install pillow"
    ) from exc


def slugify(value: str) -> str:
    value = re.sub(r"[^\w\s-]", "", value, flags=re.UNICODE).strip().lower()
    value = re.sub(r"[-\s]+", "-", value)
    return value or "marker"


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
            if a <= alpha_cutoff or (
                min(r, g, b) >= threshold and channel_range <= tolerance
            ):
                pixels[x, y] = (r, g, b, 0)

    return rgba


def is_removable_edge_pixel(
    pixel: tuple[int, int, int, int],
    threshold: int,
    tolerance: int,
    alpha_cutoff: int,
) -> bool:
    r, g, b, a = pixel
    if a <= alpha_cutoff:
        return True
    channel_range = max(r, g, b) - min(r, g, b)
    return min(r, g, b) >= threshold and channel_range <= tolerance


def remove_edge_background(
    image: Image.Image,
    threshold: int,
    tolerance: int,
    alpha_cutoff: int,
) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or y < 0 or x >= width or y >= height:
            continue
        visited.add((x, y))
        if not is_removable_edge_pixel(
            pixels[x, y],
            threshold=threshold,
            tolerance=tolerance,
            alpha_cutoff=alpha_cutoff,
        ):
            continue

        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

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


def resize_to_height(image: Image.Image, height: int) -> Image.Image:
    if height <= 0 or image.height == height:
        return image
    width = max(1, round(image.width * (height / image.height)))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def fit_to_box(image: Image.Image, width: int, height: int) -> Image.Image:
    frame = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    fitted = image.copy()
    fitted.thumbnail((width, height), Image.Resampling.LANCZOS)
    x = (width - fitted.width) // 2
    y = (height - fitted.height) // 2
    frame.alpha_composite(fitted, (x, y))
    return frame


def output_name(input_path: Path, args: argparse.Namespace, index: int, total: int) -> str:
    if args.name:
        if total > 1:
            return f"{slugify(args.name)}-{index + 1}.webp"
        return f"{slugify(args.name)}.webp"

    stem = slugify(input_path.stem)
    parts = [part for part in [args.prefix, stem, args.suffix] if part]
    return f"{'-'.join(slugify(part) for part in parts)}.webp"


def process_marker(input_path: Path, output_path: Path, args: argparse.Namespace) -> None:
    image = Image.open(input_path)
    if args.remove_edge_bg:
        prepared = remove_edge_background(
            image,
            threshold=args.bg_threshold,
            tolerance=args.bg_tolerance,
            alpha_cutoff=args.alpha_cutoff,
        )
    elif args.remove_light_bg:
        prepared = remove_light_background(
            image,
            threshold=args.bg_threshold,
            tolerance=args.bg_tolerance,
            alpha_cutoff=args.alpha_cutoff,
        )
    else:
        prepared = image.convert("RGBA")

    if not args.no_trim:
        prepared = trim_alpha(prepared, padding=args.padding)

    if args.box:
        prepared = fit_to_box(prepared, width=args.box[0], height=args.box[1])
    else:
        prepared = resize_to_height(prepared, height=args.height)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    prepared.save(
        output_path,
        "WEBP",
        lossless=args.lossless,
        quality=args.quality,
        method=6,
    )


def alpha_summary(image: Image.Image) -> tuple[int, int, int]:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    histogram = alpha.histogram()
    transparent = histogram[0]
    opaque = histogram[255]
    partial = rgba.width * rgba.height - transparent - opaque
    return transparent, partial, opaque


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate pilgrimage marker WebP assets from selected images."
    )
    parser.add_argument(
        "inputs",
        nargs="*",
        type=Path,
        help="One or more marker source images. Omit inputs to start interactive mode.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("public/pilgrimage/markers"),
        help="Directory for generated WebP marker assets.",
    )
    parser.add_argument(
        "--name",
        help="Output name for a single marker, or base name for multiple markers.",
    )
    parser.add_argument("--prefix", default="", help="Optional output filename prefix.")
    parser.add_argument("--suffix", default="", help="Optional output filename suffix.")
    parser.add_argument(
        "--height",
        type=int,
        default=256,
        help="Output height when --box is not provided.",
    )
    parser.add_argument(
        "--box",
        nargs=2,
        type=int,
        metavar=("WIDTH", "HEIGHT"),
        help="Fit each marker into a fixed transparent box.",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=0,
        help="Transparent padding kept around the trimmed subject.",
    )
    parser.add_argument(
        "--no-trim",
        action="store_true",
        help="Do not trim transparent edges after background processing.",
    )
    parser.add_argument(
        "--remove-light-bg",
        action="store_true",
        help="Key out light checker/white backgrounds. Use carefully for marker art.",
    )
    parser.add_argument(
        "--remove-edge-bg",
        action="store_true",
        help="Remove only edge-connected light/checker backgrounds. Safer for marker art with white label areas.",
    )
    parser.add_argument(
        "--bg-threshold",
        type=int,
        default=245,
        help="Minimum RGB channel value considered removable background.",
    )
    parser.add_argument(
        "--bg-tolerance",
        type=int,
        default=12,
        help="Maximum RGB channel spread considered low-saturation background.",
    )
    parser.add_argument(
        "--alpha-cutoff",
        type=int,
        default=2,
        help="Existing alpha values at or below this become transparent.",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=92,
        help="WebP quality when --lossless is not used.",
    )
    parser.add_argument(
        "--lossless",
        action="store_true",
        help="Write lossless WebP. Recommended for transparent marker art.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow overwriting existing output files.",
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Start an interactive command loop instead of processing immediately.",
    )
    return parser


def parse_args() -> argparse.Namespace:
    return build_parser().parse_args()


def split_command_line(value: str) -> list[str]:
    tokens: list[str] = []
    current: list[str] = []
    quote: str | None = None

    for char in value.strip():
        if char in {'"', "'"}:
            if quote == char:
                quote = None
            elif quote is None:
                quote = char
            else:
                current.append(char)
            continue

        if char.isspace() and quote is None:
            if current:
                tokens.append("".join(current))
                current = []
            continue

        current.append(char)

    if current:
        tokens.append("".join(current))

    return tokens


def expand_input_tokens(tokens: list[str]) -> list[Path]:
    paths: list[Path] = []
    for token in tokens:
        matches = sorted(glob.glob(token))
        if not matches and "\\" in token:
            matches = sorted(glob.glob(token.replace("\\", "/")))
        if matches:
            paths.extend(Path(match) for match in matches)
        else:
            paths.append(Path(token))
    return paths


def bool_value(value: str) -> bool:
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False
    raise ValueError(f"Expected on/off, got: {value}")


def set_option(args: argparse.Namespace, key: str, values: list[str]) -> None:
    if key == "output-dir":
        if len(values) != 1:
            raise ValueError("Usage: set output-dir <path>")
        args.output_dir = Path(values[0])
    elif key == "name":
        args.name = values[0] if values else None
    elif key == "prefix":
        args.prefix = values[0] if values else ""
    elif key == "suffix":
        args.suffix = values[0] if values else ""
    elif key == "height":
        if len(values) != 1:
            raise ValueError("Usage: set height <number>")
        args.height = int(values[0])
    elif key == "box":
        if len(values) == 1 and values[0].lower() in {"none", "off"}:
            args.box = None
        elif len(values) == 2:
            args.box = [int(values[0]), int(values[1])]
        else:
            raise ValueError("Usage: set box <width> <height> OR set box off")
    elif key == "padding":
        if len(values) != 1:
            raise ValueError("Usage: set padding <number>")
        args.padding = int(values[0])
    elif key == "no-trim":
        if len(values) != 1:
            raise ValueError("Usage: set no-trim on|off")
        args.no_trim = bool_value(values[0])
    elif key == "remove-light-bg":
        if len(values) != 1:
            raise ValueError("Usage: set remove-light-bg on|off")
        args.remove_light_bg = bool_value(values[0])
        if args.remove_light_bg:
            args.remove_edge_bg = False
    elif key == "remove-edge-bg":
        if len(values) != 1:
            raise ValueError("Usage: set remove-edge-bg on|off")
        args.remove_edge_bg = bool_value(values[0])
        if args.remove_edge_bg:
            args.remove_light_bg = False
    elif key == "bg-threshold":
        if len(values) != 1:
            raise ValueError("Usage: set bg-threshold <number>")
        args.bg_threshold = int(values[0])
    elif key == "bg-tolerance":
        if len(values) != 1:
            raise ValueError("Usage: set bg-tolerance <number>")
        args.bg_tolerance = int(values[0])
    elif key == "alpha-cutoff":
        if len(values) != 1:
            raise ValueError("Usage: set alpha-cutoff <number>")
        args.alpha_cutoff = int(values[0])
    elif key == "quality":
        if len(values) != 1:
            raise ValueError("Usage: set quality <number>")
        args.quality = int(values[0])
    elif key == "lossless":
        if len(values) != 1:
            raise ValueError("Usage: set lossless on|off")
        args.lossless = bool_value(values[0])
    elif key == "overwrite":
        if len(values) != 1:
            raise ValueError("Usage: set overwrite on|off")
        args.overwrite = bool_value(values[0])
    else:
        raise ValueError(f"Unknown option: {key}")


def print_status(args: argparse.Namespace) -> None:
    print("Current marker generation settings:")
    print(f"  inputs ({len(args.inputs)}):")
    for path in args.inputs:
        print(f"    - {path}")
    print(f"  output-dir: {args.output_dir}")
    print(f"  name: {args.name or ''}")
    print(f"  prefix: {args.prefix}")
    print(f"  suffix: {args.suffix}")
    print(f"  height: {args.height}")
    print(f"  box: {args.box or ''}")
    print(f"  padding: {args.padding}")
    print(f"  no-trim: {args.no_trim}")
    print(f"  remove-light-bg: {args.remove_light_bg}")
    print(f"  remove-edge-bg: {args.remove_edge_bg}")
    print(f"  bg-threshold: {args.bg_threshold}")
    print(f"  bg-tolerance: {args.bg_tolerance}")
    print(f"  alpha-cutoff: {args.alpha_cutoff}")
    print(f"  quality: {args.quality}")
    print(f"  lossless: {args.lossless}")
    print(f"  overwrite: {args.overwrite}")


def print_interactive_help() -> None:
    print(
        """
Commands:
  inputs <path/glob> [...]       Replace the input list.
  add <path/glob> [...]          Append to the input list.
  clear                          Clear the input list.
  set <option> <value>           Update an option.
  run                            Generate marker assets with current settings.
  status                         Show current settings.
  help                           Show this help.
  quit                           Exit.

Common setup:
  inputs public/pilgrimage/markers/input/*.png
  set output-dir public/pilgrimage/markers
  set name pilgrimage-marker
  set box 256 256
  set remove-edge-bg on
  set bg-threshold 232
  set bg-tolerance 18
  set lossless on
  set overwrite on
  run
""".strip()
    )


def run_generation(args: argparse.Namespace) -> None:
    output_dir = args.output_dir.resolve()
    total = len(args.inputs)

    if total == 0:
        raise ValueError("No inputs configured. Use: inputs <path/glob> [...]")

    for index, raw_input in enumerate(args.inputs):
        input_path = raw_input.resolve()
        if not input_path.exists():
            raise ValueError(f"Input image does not exist: {input_path}")

        output_path = output_dir / output_name(input_path, args, index, total)
        if output_path.exists() and not args.overwrite:
            raise ValueError(
                f"Output already exists: {output_path}\n"
                "Use: set overwrite on"
            )

        process_marker(input_path, output_path, args)
        with Image.open(output_path) as result:
            transparent, partial, opaque = alpha_summary(result)
            print(f"Generated: {output_path}")
            print(f"  size: {result.width}x{result.height}")
            print(
                f"  alpha: transparent={transparent}, partial={partial}, opaque={opaque}"
            )
            if transparent == 0 and partial == 0:
                print(
                    "  warning: output is fully opaque. If the marker still shows a "
                    "checker/white background, enable remove-edge-bg or lower "
                    "bg-threshold/bg-tolerance."
                )


def interactive_loop(args: argparse.Namespace) -> None:
    print("Pilgrimage marker asset generator")
    print("Type 'help' for commands, 'quit' to exit.")

    while True:
        try:
            line = input("marker> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not line:
            continue

        tokens = split_command_line(line)
        if not tokens:
            continue

        command = tokens[0].lower()
        values = tokens[1:]

        try:
            if command in {"quit", "exit"}:
                break
            if command == "help":
                print_interactive_help()
            elif command == "status":
                print_status(args)
            elif command == "inputs":
                args.inputs = expand_input_tokens(values)
                print(f"Configured {len(args.inputs)} input(s).")
            elif command == "add":
                added = expand_input_tokens(values)
                args.inputs.extend(added)
                print(f"Added {len(added)} input(s); total {len(args.inputs)}.")
            elif command == "clear":
                args.inputs = []
                print("Cleared inputs.")
            elif command == "set":
                if not values:
                    raise ValueError("Usage: set <option> <value>")
                set_option(args, values[0].lower(), values[1:])
            elif command == "run":
                run_generation(args)
            else:
                raise ValueError(f"Unknown command: {command}")
        except Exception as exc:
            print(f"Error: {exc}")


def main() -> None:
    args = parse_args()
    if args.interactive or not args.inputs:
        interactive_loop(args)
        return

    try:
        run_generation(args)
    except Exception as exc:
        raise SystemExit(str(exc)) from exc


if __name__ == "__main__":
    main()
