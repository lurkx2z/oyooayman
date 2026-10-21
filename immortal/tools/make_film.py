"""One command from code to the finished film: build the scene, render every frame, make the sound, encode the MP4.

  python immortal/tools/make_film.py --blender "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe"
  python immortal/tools/make_film.py --blender blender --preview          # quick 640-wide check at 12 fps
  python immortal/tools/make_film.py --blender blender --check            # 960-wide, 24 fps, cheaper lighting

Run it from the repository root. Output goes to renders/immortal-village-return/ (or --out):
  village_return.blend          the editable scene (open it in Blender; cameras are bound to timeline markers)
  frames/                       PNG frames (resumable: re-running skips frames that exist)
  audio/                        stems + mix.wav + loudness.json
  aren_village_return.mp4       1920x1080, 24 fps, H.264 + AAC, under 30 MiB, subtitles burned in
  aren_village_return_clean.mp4 the same without subtitles
  contact_sheet.jpg             one frame per second

Needs: Blender 5.2 (EEVEE), Python 3.10+ with numpy scipy pyloudnorm soundfile pillow, and ffmpeg on PATH
(or `pip install imageio-ffmpeg`, which is used automatically when ffmpeg is missing).
"""
import argparse
import hashlib
import os
import shutil
import subprocess
import sys
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
IMM = os.path.join(ROOT, 'immortal')


def run(cmd, **kw):
    print('>', ' '.join(str(c) for c in cmd), flush=True)
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def stamp(*extra):
    """Fingerprint of the scene code and render settings: frames from an older version are never mixed in."""
    h = hashlib.sha256(repr(extra).encode())
    for dp, dn, fn in os.walk(os.path.join(IMM, 'blender')):
        dn[:] = sorted(d for d in dn if d != '__pycache__')
        for n in sorted(fn):
            if n.endswith(('.py', '.json')):
                with open(os.path.join(dp, n), 'rb') as fh:
                    h.update(n.encode() + fh.read().replace(b'\r\n', b'\n'))
    return h.hexdigest()[:16]


def ffmpeg_dir():
    if shutil.which('ffmpeg'):
        return None
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        d = os.path.join(os.path.dirname(exe), '_ffmpeg_shim')
        os.makedirs(d, exist_ok=True)
        dst = os.path.join(d, 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
        if not os.path.exists(dst):
            shutil.copy(exe, dst)
        return d
    except ImportError:
        raise SystemExit('ffmpeg not found: install it or `pip install imageio-ffmpeg`')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--blender', default='blender')
    ap.add_argument('--out', default=os.path.join(ROOT, 'renders', 'immortal-village-return'))
    ap.add_argument('--preview', action='store_true')
    ap.add_argument('--check', action='store_true', help='960 wide, every frame, cheaper lighting (motion check)')
    ap.add_argument('--width', type=int, default=None)
    ap.add_argument('--samples', type=int, default=None)
    ap.add_argument('--skip-build', action='store_true')
    a = ap.parse_args()
    out = os.path.abspath(a.out)
    os.makedirs(out, exist_ok=True)
    blend = os.path.join(out, 'village_return.blend')
    events = os.path.join(out, 'village_return_events.json')
    mode = 'preview' if a.preview else 'check' if a.check else 'final'
    width = a.width or {'preview': 640, 'check': 960, 'final': 1920}[mode]
    samples = a.samples or {'preview': 8, 'check': 16, 'final': 64}[mode]
    step = 2 if mode == 'preview' else 1
    frames = os.path.join(out, 'frames' if mode == 'final' else 'frames_' + mode)
    st = stamp(width, samples, step, mode)
    st_file = os.path.join(frames, 'STAMP.txt')
    if os.path.isdir(frames) and (not os.path.exists(st_file) or open(st_file).read().strip() != st):
        print(f'the scene changed since {frames} was rendered: starting those frames again', flush=True)
        shutil.rmtree(frames)
    os.makedirs(frames, exist_ok=True)
    with open(st_file, 'w') as fh:
        fh.write(st)
    t0 = time.time()
    if not (a.skip_build and os.path.exists(blend)):
        run([a.blender, '-b', '--factory-startup', '--python-exit-code', '1', '-P',
             os.path.join(IMM, 'blender', 'scenes', 'village_return.py'), '--', '--out', blend])
    render = [a.blender, '-b', '--factory-startup', '--python-exit-code', '1', '-P', os.path.join(IMM, 'blender', 'render.py'),
              '--', '--blend', blend, '--out', frames, '--width', width, '--samples', samples, '--step', step]
    if mode != 'final':
        render.append('--fast')
    else:
        render.append('--motion-blur')
    run(render)
    audio = os.path.join(out, 'audio')
    run([sys.executable, os.path.join(IMM, 'audio', 'sound_design.py'), '--events', events, '--out', audio])
    env = dict(os.environ)
    d = ffmpeg_dir()
    if d:
        env['PATH'] = d + os.pathsep + env['PATH']
    name = 'aren_village_return' + ('' if mode == 'final' else '_' + mode)
    enc = [sys.executable, os.path.join(IMM, 'tools', 'encode.py'), '--frames', frames, '--audio',
           os.path.join(audio, 'mix.wav'), '--events', events, '--step', step]
    run(enc + ['--subs', '--out', os.path.join(out, name + '.mp4')], env=env)
    run(enc + ['--out', os.path.join(out, name + '_clean.mp4')], env=env)
    run([sys.executable, os.path.join(IMM, 'tools', 'contact_sheet.py'), '--frames', frames, '--out',
         os.path.join(out, name.replace('aren_village_return', 'contact_sheet') + '.jpg'), '--events', events, '--every', 24 // step, '--cols', 5, '--width', 384])
    print(f'finished in {(time.time() - t0) / 60:.0f} min: {out}')


if __name__ == '__main__':
    main()
