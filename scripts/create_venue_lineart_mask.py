#!/usr/bin/env python3
"""Convert a generated venue line-art source image into a themeable alpha-mask asset.

The output is intended for CSS mask-image usage in the Live Archive venue module:
RGB is neutral black, and the alpha channel carries the linework strength.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


LIGHT_BG = (246, 244, 239, 255)
DARK_BG = (9, 18, 32, 255)
LIGHT_LINE = (31, 55, 82)
DARK_LINE = (220, 235, 255)


def is_chroma_green(r: int, g: int, b: int) -> bool:
    return g > 150 and r < 120 and b < 135


def line_alpha(r: int, g: int, b: int, source_alpha: int, threshold: int, max_alpha: int) -> int:
    if source_alpha < 8 or is_chroma_green(r, g, b):
        return 0

    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    blue_bias = max(0, b - r) * 0.9 + max(0, b - g) * 0.35
    score = max(0, 235 - luma) + blue_bias

    if score < threshold:
        return 0

    return max(28, min(max_alpha, int((score - 26) * 1.8)))


def build_mask(source: Path, output: Path, threshold: int, max_alpha: int) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    pixels: list[tuple[int, int, int, int]] = []

    for r, g, b, a in image.getdata():
        alpha = line_alpha(r, g, b, a, threshold, max_alpha)
        pixels.append((0, 0, 0, alpha))

    image.putdata(pixels)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "WEBP", lossless=True, method=6)
    return image


def render_preview(mask: Image.Image, output: Path, background: tuple[int, int, int, int], line: tuple[int, int, int]) -> None:
    alpha = mask.getchannel("A")
    canvas = Image.new("RGBA", mask.size, background)
    line_layer = Image.new("RGBA", mask.size, (*line, 0))
    line_layer.putalpha(alpha)
    canvas.alpha_composite(line_layer)
    canvas.convert("RGB").save(output)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a transparent WebP venue line-art mask.")
    parser.add_argument("--input", required=True, type=Path, help="Generated source image path.")
    parser.add_argument("--out", required=True, type=Path, help="Output transparent WebP path.")
    parser.add_argument("--preview", action="store_true", help="Also write light/dark PNG previews beside the output.")
    parser.add_argument("--threshold", type=int, default=42, help="Line extraction threshold. Increase to remove faint fills.")
    parser.add_argument("--max-alpha", type=int, default=220, help="Maximum alpha for extracted linework.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    mask = build_mask(args.input, args.out, args.threshold, args.max_alpha)
    alpha_min, alpha_max = mask.getchannel("A").getextrema()

    print(f"Wrote {args.out}")
    print(f"Mode: {mask.mode}")
    print(f"Size: {mask.size[0]}x{mask.size[1]}")
    print(f"Alpha: {alpha_min}-{alpha_max}")

    if args.preview:
        light_out = args.out.with_name(f"{args.out.stem}-preview-light.png")
        dark_out = args.out.with_name(f"{args.out.stem}-preview-dark.png")
        render_preview(mask, light_out, LIGHT_BG, LIGHT_LINE)
        render_preview(mask, dark_out, DARK_BG, DARK_LINE)
        print(f"Wrote {light_out}")
        print(f"Wrote {dark_out}")


if __name__ == "__main__":
    main()
