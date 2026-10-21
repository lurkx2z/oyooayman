"""Encode rendered frames + the sound mix into the delivery MP4 (H.264, AAC), with optional burned-in subtitles.

  python3 immortal/tools/encode.py --frames renders/frames --audio build/audio/mix.wav \
      --events build/village_return_events.json --out aren_village_return.mp4 [--step 1] [--subs] [--max-mib 30]

- Frames are f0001.png ... ; with --step N only every Nth frame exists and the video runs at 24/N fps.
- Frames after the cut to black (events file) are written black. Missing frames before it are an error.
- The bitrate is chosen so the file stays under --max-mib (two-pass), capped at a high quality ceiling.
"""
import argparse
import json
import os
import shutil
import subprocess
import tempfile

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('--frames', required=True)
ap.add_argument('--audio', required=True)
ap.add_argument('--events', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--step', type=int, default=1)
ap.add_argument('--subs', action='store_true', help='burn in the dialogue as subtitles')
ap.add_argument('--dialogue', default=os.path.join(HERE, '..', 'blender', 'scenes', 'dialogue.json'))
ap.add_argument('--max-mib', type=float, default=30.0)
ap.add_argument('--max-kbps', type=int, default=14000)
a = ap.parse_args()

ev = json.load(open(a.events))
fps, nf, black = ev['fps'], ev['frames'], ev['black']
tmp = tempfile.mkdtemp(prefix='enc_')
seq = os.path.join(tmp, 'seq')
os.makedirs(seq)
size = None
blank = None
k = 0
missing = []
for f in range(1, nf + 1, a.step):
    t = (f - 1) / fps
    src = os.path.join(a.frames, f'f{f:04d}.png')
    dst = os.path.join(seq, f'{k:05d}.png')
    if t >= black:
        if blank is None:
            if size is None:
                any_png = next(p for p in sorted(os.listdir(a.frames)) if p.endswith('.png'))
                size = Image.open(os.path.join(a.frames, any_png)).size
            blank = os.path.join(tmp, 'black.png')
            Image.new('RGB', size, (0, 0, 0)).save(blank)
        os.symlink(blank, dst)
    elif os.path.exists(src):
        if size is None:
            size = Image.open(src).size
        os.symlink(os.path.abspath(src), dst)
    else:
        missing.append(f)
    k += 1
if missing:
    raise SystemExit(f'missing {len(missing)} frames, first {missing[:5]}')
out_fps = fps / a.step
dur = k / out_fps

vf = []
if a.subs:
    W, H = size
    lines = json.load(open(a.dialogue))['lines']
    fs = int(H * 0.045)

    def ts(x):
        h, r = divmod(x, 3600)
        m, s = divmod(r, 60)
        return f'{int(h)}:{int(m):02d}:{s:05.2f}'
    ass = os.path.join(tmp, 'subs.ass')
    with open(ass, 'w') as fh:
        fh.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Line,Liberation Serif,{fs},&H00F2F2F2,&H00F2F2F2,&H00101010,&H64000000,0,1,0,0,100,100,1,0,1,{max(1, fs // 22)},{max(1, fs // 18)},2,40,40,{int(H * 0.075)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""")
        for L in lines:
            fh.write(f"Dialogue: 0,{ts(L['start'] - 0.05)},{ts(L['end'] + 0.55)},Line,,0,0,0,,{{\\fad(120,180)}}{L['text']}\n")
    vf.append(f'ass={ass}')
vf.append('format=yuv420p')

audio_kbps = 192
video_kbps = int((a.max_mib * 1024 * 1024 * 8 * 0.96) / dur / 1000) - audio_kbps
video_kbps = max(800, min(a.max_kbps, video_kbps))
base = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-framerate', str(out_fps), '-i', os.path.join(seq, '%05d.png')]
common = ['-vf', ','.join(vf), '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{video_kbps}k',
          '-maxrate', f'{int(video_kbps * 1.6)}k', '-bufsize', f'{int(video_kbps * 2)}k', '-profile:v', 'high',
          '-pix_fmt', 'yuv420p', '-r', str(out_fps)]
passlog = os.path.join(tmp, 'pass')
subprocess.run(base + common + ['-pass', '1', '-passlogfile', passlog, '-an', '-f', 'mp4', os.devnull], check=True)
subprocess.run(base + ['-i', a.audio] + common + ['-pass', '2', '-passlogfile', passlog, '-c:a', 'aac', '-b:a',
               f'{audio_kbps}k', '-ar', '48000', '-t', f'{dur:.3f}', '-movflags', '+faststart', a.out], check=True)
shutil.rmtree(tmp)
mib = os.path.getsize(a.out) / 1024 / 1024
print(f'{a.out}: {dur:.2f} s, {size[0]}x{size[1]} @ {out_fps:g} fps, video {video_kbps} kbps, {mib:.1f} MiB')
