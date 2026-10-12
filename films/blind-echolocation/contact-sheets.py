"""CONTACT SHEETS — one labelled sheet per scene of "What If You Went Blind?" from tools/stills.cjs output.
    python3 films/blind-echolocation/contact-sheets.py <stills dir> <timeline.json> <out dir>
The stills (t_<seconds>.jpg, 16:9) are grouped by the scene windows in timeline.json (export-docs.cjs) and tiled four
across, each labelled with its film time; each sheet is titled with the scene."""
import glob
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

src, tl_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
TL = json.load(open(tl_path))
stills = sorted(((float(os.path.basename(f)[2:-4]), f) for f in glob.glob(os.path.join(src, 't_*.jpg'))))
W, H, COLS, HEAD = 480, 270, 4, 56


def font(size):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


F1, F2 = font(26), font(16)
for sc in TL['scenes']:
    fs = [(t, f) for t, f in stills if sc['start'] <= t < sc['end'] + (1 if sc is TL['scenes'][-1] else 0)]
    if not fs:
        continue
    rows = (len(fs) + COLS - 1) // COLS
    im = Image.new('RGB', (W * COLS, HEAD + H * rows), (16, 17, 20))
    d = ImageDraw.Draw(im)
    m, s = divmod(sc['start'], 60)
    m2, s2 = divmod(sc['end'], 60)
    d.text((12, 14), f"{sc['title']}   {int(m)}:{s:04.1f}–{int(m2)}:{s2:04.1f}", fill=(235, 235, 235), font=F1)
    for i, (t, f) in enumerate(fs):
        a = Image.open(f).convert('RGB').resize((W - 4, H - 4))
        da = ImageDraw.Draw(a)
        mm, ss = divmod(t, 60)
        lab = f'{int(mm)}:{ss:04.1f}'
        da.rectangle((4, 4, 12 + 9 * len(lab), 26), fill=(0, 0, 0))
        da.text((8, 6), lab, fill=(255, 220, 90), font=F2)
        im.paste(a, ((i % COLS) * W + 2, HEAD + (i // COLS) * H + 2))
    name = os.path.join(out, f"scene{sc['n']:02d}.jpg")
    im.save(name, quality=86)
    print(name, len(fs), 'frames')
