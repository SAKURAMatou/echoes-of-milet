"""Build Jean runtime WebP sheets from generated source sheets.

Place temporary source PNG/WebP files in designs/jean-motion/assets/source while
building. The cleaned demo keeps only sheet/static WebP outputs and manifests.
Requires Pillow and numpy. No network or model calls.
"""
from collections import deque
from pathlib import Path
import argparse
import json

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / 'designs' / 'jean-motion'
ASSETS = ROOT / 'assets'
SOURCE = ASSETS / 'source'
FRAME = 256
ANCHOR_X = 128
BASELINE_Y = 232
ASSET_VERSION = 8

ACTION_SPECS = {
    'idle': {
        'columns': 4, 'rows': 2, 'fps': 7, 'loop': True,
        'durations': [900, 300, 110, 130, 110, 300, 260, 900],
    },
    'sit': {
        'columns': 4, 'rows': 3, 'fps': 11, 'loop': False,
        'durations': [100, 90, 90, 90, 100, 120, 170, 100, 90, 90, 90, 140],
    },
    'happy': {
        'columns': 4, 'rows': 3, 'fps': 13, 'loop': False,
        'durations': [110, 80, 80, 80, 80, 80, 80, 80, 80, 80, 90, 140],
    },
    'curious': {
        'columns': 4, 'rows': 3, 'fps': 11, 'loop': False,
        'durations': [100, 85, 85, 85, 85, 110, 180, 110, 85, 85, 85, 130],
    },
    'excited': {
        'columns': 4, 'rows': 4, 'fps': 14, 'loop': False,
        'durations': [90, 75, 70, 75, 70, 65, 65, 80, 65, 70, 75, 85, 75, 75, 80, 110],
    },
    'sniff': {
        'columns': 4, 'rows': 3, 'fps': 12, 'loop': False,
        'durations': [100, 90, 90, 90, 100, 140, 90, 100, 140, 90, 90, 130],
    },
    'look': {
        'columns': 5, 'rows': 2, 'fps': 9, 'loop': False,
        'durations': [120, 100, 100, 100, 100, 180, 180, 100, 100, 140],
    },
    'lookLeft': {
        'slug': 'look-left', 'columns': 3, 'rows': 2, 'fps': 11, 'loop': False,
        'durations': [90, 70, 70, 80, 90, 110], 'staticFrame': -1,
    },
    'lookLeftUp': {
        'slug': 'look-left-up', 'columns': 3, 'rows': 2, 'fps': 11, 'loop': False,
        'durations': [90, 70, 70, 80, 90, 110], 'staticFrame': -1,
    },
    'lookUp': {
        'slug': 'look-up', 'columns': 3, 'rows': 2, 'fps': 11, 'loop': False,
        'durations': [90, 70, 70, 80, 90, 110], 'staticFrame': -1,
    },
    'lookRightUp': {
        'slug': 'look-right-up', 'columns': 3, 'rows': 2, 'fps': 11, 'loop': False,
        'durations': [90, 70, 70, 80, 90, 110], 'staticFrame': -1,
    },
    'lookRight': {
        'slug': 'look-right', 'columns': 3, 'rows': 2, 'fps': 11, 'loop': False,
        'durations': [90, 70, 70, 80, 90, 110], 'staticFrame': -1,
    },
    'drag': {
        'columns': 4, 'rows': 2, 'fps': 9, 'loop': True,
        'durations': [120, 100, 100, 100, 100, 100, 100, 120],
    },
    'sleep': {
        'columns': 4, 'rows': 4, 'fps': 10, 'loop': False,
        'durations': [120, 110, 110, 120, 130, 140, 160, 400, 650, 650, 180, 140, 130, 120, 110, 160],
        # The generated dogs in the final row extend their heads above the
        # nominal cell boundary. Read upward, then let component isolation drop
        # the disconnected dog from the preceding row.
        'topOverscan': {12: 96, 13: 96, 14: 96, 15: 96},
    },
}

# A generated sheet centers each pose inside its cell, so row placement is not
# motion data. These offsets reintroduce only the small vertical hop described by
# the excited sequence; every ground-contact pose stays on one baseline.
EXCITED_Y_OFFSETS = [0, 0, 0, 0, -2, -14, -30, -44, -34, -18, 0, 0, -8, -2, 0, 0]


def neutral_matte(image, matte=None):
    """Convert a neutral bright matte to a soft, dematted alpha channel."""
    rgb = np.asarray(image.convert('RGB'), dtype=np.float32)
    border = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]))
    pure_white_source = float(border.mean()) > 248 and float(border.std()) < 2.5
    border_chroma = border.max(axis=1) - border.min(axis=1)
    neutral_checker_source = matte == 'checker' or float(np.median(border_chroma)) < 4
    if pure_white_source:
        background = np.median(border, axis=0)
        distance = np.linalg.norm(rgb - background, axis=2)
        alpha = np.clip((distance - 1.5) / 16, 0, 1)
    elif neutral_checker_source:
        # Image generators sometimes draw a grey checkerboard instead of
        # returning real alpha. Its pixels are neutral while every Jean color,
        # including the navy details, has measurable chroma. Dematte against
        # the local grey value so antialiased fur edges remain warm.
        chroma = rgb.max(axis=2) - rgb.min(axis=2)
        # Generated checkerboards sometimes pick up small coloured ripples near
        # the subject. Start alpha above that noise floor; the largest-component
        # pass below then preserves Jean while dropping detached remnants.
        alpha = np.clip((chroma - 6) / 20, 0, 1)
        local_grey = rgb.mean(axis=2, keepdims=True)
        background = np.repeat(local_grey, 3, axis=2)
    else:
        # Kept for rebuilding the older neutral-checkerboard studies.
        chroma = rgb.max(axis=2) - rgb.min(axis=2)
        alpha = np.clip((chroma - 7) / 13, 0, 1)
        alpha[rgb.max(axis=2) < 190] = 1
        background = np.full(3, 245, dtype=np.float32)
    rim = (alpha > 0) & (alpha < 1)
    safe_alpha = np.maximum(alpha[rim, None], .25)
    rim_background = background[rim] if background.ndim == 3 else background
    rgb[rim] = np.clip((rgb[rim] - (1 - safe_alpha) * rim_background) / safe_alpha, 0, 255)
    rgba = np.dstack((rgb.astype(np.uint8), np.round(alpha * 255).astype(np.uint8)))
    rgba[alpha == 0, :3] = 0
    return Image.fromarray(rgba)


def foreground_components(mask):
    """Return eight-connected foreground components from largest to smallest."""
    height, width = mask.shape
    remaining = bytearray(mask.astype(np.uint8).tobytes())
    components = []
    for start in range(len(remaining)):
        if not remaining[start]:
            continue
        remaining[start] = 0
        queue = deque([start])
        pixels = []
        while queue:
            current = queue.popleft()
            pixels.append(current)
            x, y = current % width, current // width
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    target = next_y * width + next_x
                    if remaining[target]:
                        remaining[target] = 0
                        queue.append(target)
        components.append(pixels)
    return sorted(components, key=len, reverse=True)


def isolate_subject(cell):
    """Keep the current dog while excluding matte noise or a neighboring tail."""
    rgba = np.array(cell.convert('RGBA'))
    strong = rgba[:, :, 3] > 64
    components = foreground_components(strong)
    if not components:
        raise ValueError('No foreground subject in cell')
    keep = np.zeros(rgba.shape[:2], dtype=bool)
    keep.flat[components[0]] = True
    for _ in range(3):
        padded = np.pad(keep, 1)
        keep = np.logical_or.reduce([
            padded[y:y + keep.shape[0], x:x + keep.shape[1]]
            for y in range(3) for x in range(3)
        ])
    keep &= rgba[:, :, 3] > 0
    removed = int(np.count_nonzero((rgba[:, :, 3] > 0) & ~keep))
    rgba[~keep] = 0
    return Image.fromarray(rgba), removed


def garment_anchor(image):
    """Locate the teal shirt trim, a stable horizontal torso landmark."""
    rgba = np.asarray(image.convert('RGBA'))
    rgb, alpha = rgba[:, :, :3].astype(np.int16), rgba[:, :, 3]
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    teal = (alpha > 96) & (green - red > 12) & (blue - red > 12) & (green > 105)
    ys, xs = np.where(teal)
    if len(xs) < 12:
        return image.width * .52, image.height * .45
    return float(np.median(xs)), float(np.median(ys))


def extract_frames(image, columns, rows, frame_count, top_overscan=None, matte=None):
    expected_ratio = columns / rows
    actual_ratio = image.width / image.height
    if abs(actual_ratio / expected_ratio - 1) > .015:
        raise ValueError(
            f'Unexpected source ratio {image.width}x{image.height} for {columns}x{rows}'
        )
    clean = neutral_matte(image, matte)
    frames = []
    for index in range(frame_count):
        col, row = index % columns, index // columns
        overscan = (top_overscan or {}).get(index, 0)
        box = (
            round(col * image.width / columns),
            max(0, round(row * image.height / rows) - overscan),
            round((col + 1) * image.width / columns),
            round((row + 1) * image.height / rows),
        )
        cell, removed_pixels = isolate_subject(clean.crop(box))
        mask = np.asarray(cell.getchannel('A')) > 100
        ys, xs = np.where(mask)
        if not len(xs):
            raise ValueError(f'No foreground in frame {index + 1}')
        bbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        crop = cell.crop(bbox)
        anchor_x, anchor_y = garment_anchor(crop)
        frames.append({
            'image': crop,
            'anchor_x': anchor_x,
            'anchor_y': anchor_y,
            'sourceBox': list(box),
            'foregroundBox': list(bbox),
            'removedNoisePixels': removed_pixels,
        })
    return frames


def normalize_frames(name, records):
    """Give each clip a stable apparent scale, torso x position and ground line."""
    reference = records[0]
    max_left = max(record['anchor_x'] for record in records)
    max_right = max(record['image'].width - record['anchor_x'] for record in records)
    max_height = max(record['image'].height for record in records)
    scale = min(
        196 / reference['image'].height,
        232 / max(1, max_height),
        116 / max(1, max_left),
        116 / max(1, max_right),
    )
    normalized = []
    for index, record in enumerate(records):
        crop = record['image']
        width, height = round(crop.width * scale), round(crop.height * scale)
        x = round(ANCHOR_X - record['anchor_x'] * scale)
        if name == 'drag':
            # The page owns drag translation. Keep the shirt/torso stable while
            # legs, ears and tail make the suspended sway.
            y = round(122 - record['anchor_y'] * scale)
        else:
            offset = EXCITED_Y_OFFSETS[index] if name == 'excited' else 0
            y = BASELINE_Y - height + offset
        if x < 0 or y < 0 or x + width > FRAME or y + height > FRAME:
            raise ValueError(f'{name} frame {index + 1} exceeds the {FRAME}px runtime cell')
        output = Image.new('RGBA', (FRAME, FRAME))
        resized = crop.resize((width, height), Image.Resampling.LANCZOS)
        output.alpha_composite(resized, (x, y))
        normalized.append(output)
    return normalized


def find_source(name, spec):
    slug = spec.get('slug', name)
    for suffix in ('png', 'webp'):
        path = SOURCE / f'{slug}-generated.{suffix}'
        if path.exists():
            return path
    raise FileNotFoundError(f'Missing {slug}-generated.png/webp in {SOURCE}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        'actions', nargs='*', choices=ACTION_SPECS,
        help='Only rebuild these actions. With no names, rebuild every source currently present.',
    )
    args = parser.parse_args()
    ASSETS.mkdir(exist_ok=True)
    manifest_path = ASSETS / 'manifest.json'
    if manifest_path.exists():
        animations = json.loads(manifest_path.read_text(encoding='utf-8')).get('animations', {})
    else:
        animations = {}
    requested = set(args.actions)
    selected = []
    for name, spec in ACTION_SPECS.items():
        if requested:
            if name in requested:
                selected.append((name, spec))
        else:
            slug = spec.get('slug', name)
            if any((SOURCE / f'{slug}-generated.{suffix}').exists() for suffix in ('png', 'webp')):
                selected.append((name, spec))
    if requested - {name for name, _ in selected}:
        raise ValueError('Unknown requested action')
    if not selected:
        raise FileNotFoundError(f'No generated PNG/WebP sources found in {SOURCE}')

    idle_reference_path = ASSETS / 'idle.static.webp'
    idle_reference = Image.open(idle_reference_path).convert('RGBA') if idle_reference_path.exists() else None
    report = {}
    for name, spec in selected:
        source_path = find_source(name, spec)
        original = Image.open(source_path)
        frame_count = len(spec['durations'])
        records = extract_frames(
            original,
            spec['columns'],
            spec['rows'],
            frame_count,
            spec.get('topOverscan'),
            spec.get('matte'),
        )
        normalized = normalize_frames(name, records)
        if name.startswith('look') and name != 'look' and idle_reference is not None:
            normalized[0] = idle_reference.copy()

        sheet = Image.new('RGBA', (FRAME * spec['columns'], FRAME * spec['rows']))
        for index, frame in enumerate(normalized):
            sheet.alpha_composite(frame, ((index % spec['columns']) * FRAME,
                                          (index // spec['columns']) * FRAME))
        slug = spec.get('slug', name)
        sheet_path = ASSETS / f'{slug}.sheet.webp'
        static_path = ASSETS / f'{slug}.static.webp'
        sheet.save(sheet_path, 'WEBP', quality=88, method=6, exact=True)
        normalized[spec.get('staticFrame', 0)].save(static_path, 'WEBP', quality=88, method=6, exact=True)

        animations[name] = {
            'src': f'assets/{slug}.sheet.webp?v={ASSET_VERSION}',
            'staticSrc': f'assets/{slug}.static.webp?v={ASSET_VERSION}',
            'frameCount': frame_count,
            'columns': spec['columns'],
            'rows': spec['rows'],
            'frameWidth': FRAME,
            'frameHeight': FRAME,
            'fps': spec['fps'],
            'durations': spec['durations'],
            'loop': spec['loop'],
            'anchor': {'x': ANCHOR_X, 'y': BASELINE_Y},
            'bytes': sheet_path.stat().st_size,
        }
        alpha = np.asarray(Image.open(sheet_path).convert('RGBA'))[:, :, 3]
        report[name] = {
            'source': source_path.name,
            'sourceSize': list(original.size),
            'grid': [spec['columns'], spec['rows']],
            'frames': frame_count,
            'sheetBytes': sheet_path.stat().st_size,
            'transparentPercent': round(float(np.mean(alpha == 0)) * 100, 2),
            'partialAlphaPixels': int(np.sum((alpha > 0) & (alpha < 255))),
            'removedNoisePixels': sum(r['removedNoisePixels'] for r in records),
            'overscannedFrames': [index + 1 for index in (spec.get('topOverscan') or {})],
        }

    manifest = {
        'version': 3,
        'character': 'Jean',
        'status': 'motion-study-v3-variable-frames-and-directional-look',
        'notes': 'Generated production pose sequences plus five directional look transitions; processed to transparent WebP runtime sheets.',
        'animations': animations,
    }
    data = json.dumps(manifest, ensure_ascii=False, indent=2)
    (ASSETS / 'manifest.json').write_text(data + '\n', encoding='utf-8')
    (ASSETS / 'manifest.js').write_text('window.JEAN_MANIFEST = ' + data + ';\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
