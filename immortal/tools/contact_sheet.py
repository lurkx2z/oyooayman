"""Contact sheet: a labelled grid of rendered frames.

  python3 immortal/tools/contact_sheet.py --frames DIR --out sheet.jpg [--cols 4] [--width 480] [--fps 24]
                                         [--events build/village_return_events.json]

Labels show the time and, when the events file is given, the shot name.
"""
import argparse
import glob
import json
import os
import re

from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--frames', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--cols', type=int, default=4)
ap.add_argument('--width', type=int, default=480)
ap.add_argument('--fps', type=float, default=24)
ap.add_argument('--events', default=None)
ap.add_argument('--every', type=int, default=1)
a = ap.parse_args()

shots = []
if a.events:
    shots = json.load(open(a.events))['shots']
files = sorted(glob.glob(os.path.join(a.frames, '*.png')))[::a.every]
ims = []
for p in files:
    m = re.search(r'(\d+)\.png$', p)
    f = int(m.group(1))
    t = (f - 1) / a.fps
    im = Image.open(p).convert('RGB')
    h = int(im.height * a.width / im.width)
    im = im.resize((a.width, h), Image.LANCZOS)
    name = next((s['name'] for s in shots if s['start'] <= t < s['end']), '')
    ims.append((im, f'{t:5.2f}s  {name}'))
if not ims:
    raise SystemExit('no frames')
cols = min(a.cols, len(ims))
rows = (len(ims) + cols - 1) // cols
W, H = a.width, ims[0][0].height
pad = 22
sheet = Image.new('RGB', (cols * W, rows * (H + pad)), (14, 14, 14))
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except OSError:
    font = ImageFont.load_default()
for i, (im, label) in enumerate(ims):
    x, y = (i % cols) * W, (i // cols) * (H + pad)
    sheet.paste(im, (x, y + pad))
    draw.text((x + 6, y + 3), label, fill=(220, 220, 220), font=font)
sheet.save(a.out, quality=90)
print(a.out, sheet.size)
