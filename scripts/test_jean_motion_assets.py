"""Regression checks for Jean's processed runtime assets."""
import json
from pathlib import Path
import unittest

import numpy as np
from PIL import Image, ImageDraw

from build_jean_motion_assets import isolate_subject


ROOT = Path(__file__).resolve().parents[1] / 'designs' / 'jean-motion'
EXPECTED = {
    'idle': (8, 4, 2),
    'sit': (12, 4, 3),
    'happy': (12, 4, 3),
    'curious': (12, 4, 3),
    'excited': (16, 4, 4),
    'sniff': (12, 4, 3),
    'look': (10, 5, 2),
    'drag': (8, 4, 2),
    'sleep': (16, 4, 4),
}


def asset_path(value):
    return ROOT / value.split('?', 1)[0]


class AssetsTest(unittest.TestCase):
    def test_isolation_removes_neighbor_without_clipping_own_tail(self):
        image = Image.new('RGBA', (160, 100))
        draw = ImageDraw.Draw(image)
        draw.rectangle((35, 20, 110, 85), fill=(245, 210, 150, 255))
        draw.rectangle((100, 40, 150, 55), fill=(245, 210, 150, 255))
        draw.rectangle((0, 40, 12, 55), fill=(245, 210, 150, 255))
        isolated, removed = isolate_subject(image)
        self.assertGreater(removed, 0)
        self.assertEqual(isolated.getpixel((4, 45))[3], 0)
        self.assertEqual(isolated.getpixel((148, 45))[3], 255)

    def test_runtime_sheets_match_variable_frame_manifest(self):
        manifest = json.loads((ROOT / 'assets/manifest.json').read_text(encoding='utf-8'))
        self.assertEqual(manifest['version'], 3)
        self.assertEqual(set(manifest['animations']), set(EXPECTED))
        for action, (count, columns, rows) in EXPECTED.items():
            clip = manifest['animations'][action]
            self.assertEqual((clip['frameCount'], clip['columns'], clip['rows']),
                             (count, columns, rows))
            self.assertEqual(len(clip['durations']), count)
            sheet = Image.open(asset_path(clip['src'])).convert('RGBA')
            self.assertEqual(sheet.size, (columns * 256, rows * 256))
            for index in range(count):
                x, y = index % columns * 256, index // columns * 256
                alpha = np.asarray(sheet.crop((x, y, x + 256, y + 256)).getchannel('A'))
                self.assertGreater(np.count_nonzero(alpha > 32), 1_000, f'{action} frame {index + 1}')
                self.assertEqual(np.count_nonzero(alpha[:2]), 0, f'{action} frame {index + 1} top')
                self.assertEqual(np.count_nonzero(alpha[:, :2]), 0, f'{action} frame {index + 1} left')
                self.assertEqual(np.count_nonzero(alpha[:, -2:]), 0, f'{action} frame {index + 1} right')
            static = Image.open(asset_path(clip['staticSrc'])).convert('RGBA')
            self.assertEqual(static.size, (256, 256))

    def test_final_images_are_webp(self):
        unexpected = [
            str(path) for path in (ROOT / 'assets').rglob('*')
            if path.suffix.lower() in ('.png', '.jpg', '.jpeg', '.gif')
        ]
        self.assertEqual(unexpected, [])

    def test_only_runtime_image_files_remain(self):
        images = sorted(path.name for path in (ROOT / 'assets').glob('*.webp'))
        expected = sorted(
            f'{name}.{kind}.webp'
            for name in EXPECTED
            for kind in ('sheet', 'static')
        )
        self.assertEqual(images, expected)

    def test_sleep_final_frames_have_natural_head_contours(self):
        """A grid-boundary cut creates an unnaturally wide flat alpha top."""
        manifest = json.loads((ROOT / 'assets/manifest.json').read_text(encoding='utf-8'))
        clip = manifest['animations']['sleep']
        sheet = Image.open(asset_path(clip['src'])).convert('RGBA')
        for index in range(12, 16):
            x, y = index % clip['columns'] * 256, index // clip['columns'] * 256
            alpha = np.asarray(sheet.crop((x, y, x + 256, y + 256)).getchannel('A'))
            occupied_rows = np.where(np.any(alpha > 32, axis=1))[0]
            first_row = occupied_rows[0]
            self.assertLessEqual(
                np.count_nonzero(alpha[first_row] > 32),
                20,
                f'sleep frame {index + 1} has a flat clipped head contour',
            )


if __name__ == '__main__':
    unittest.main(verbosity=2)
