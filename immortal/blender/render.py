"""Render frames of a built scene .blend (PNG sequence, resumable, splittable across processes or machines).

  python render.py --blend build/village_return.blend --out renders/frames            # full film, 1920x1080
  python render.py --blend ... --out ... --width 640 --samples 16 --step 2              # quick preview
  python render.py --blend ... --out ... --times 12-26.5                                # a time range (seconds)
  python render.py --blend ... --out ... --stills 14.5,21.6,24.8 --width 960            # single frames
  python render.py ... --part 0/3                                                       # every 3rd frame from 0

Frames after the cut to black are not rendered (the encoder fills them with black). Existing PNGs are skipped, so an
interrupted render continues where it stopped.
"""
import argparse
import os
import sys
import time

import bpy

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--blend', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--width', type=int, default=1920)
ap.add_argument('--samples', type=int, default=64)
ap.add_argument('--times', default=None, help='a-b seconds')
ap.add_argument('--stills', default=None, help='comma separated seconds')
ap.add_argument('--step', type=int, default=1)
ap.add_argument('--part', default='0/1')
ap.add_argument('--black', type=float, default=44.4)
ap.add_argument('--motion-blur', action='store_true')
ap.add_argument('--gpu', action='store_true', help='EEVEE always uses the GPU when there is one; kept for scripts')
ap.add_argument('--fast', action='store_true', help='cheaper shadows/volumes/no ray tracing (CPU previews)')
a = ap.parse_args(argv)
a.out = os.path.abspath(a.out)  # Blender resolves a relative render path against the .blend, not the working folder

bpy.ops.wm.open_mainfile(filepath=os.path.abspath(a.blend))
sc = bpy.context.scene
fps = sc.render.fps
sc.render.resolution_x = a.width
sc.render.resolution_y = int(round(a.width * 9 / 16 / 2)) * 2
sc.render.resolution_percentage = 100
sc.eevee.taa_render_samples = a.samples
sc.render.use_motion_blur = a.motion_blur
if a.fast:
    ee = sc.eevee
    ee.use_raytracing = False
    ee.volumetric_tile_size = '16'
    ee.volumetric_samples = 32
    ee.use_volumetric_shadows = False
    ee.shadow_resolution_scale = 0.5
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGB'
os.makedirs(a.out, exist_ok=True)

markers = sorted([(m.frame, m.camera) for m in sc.timeline_markers if m.camera], key=lambda x: x[0])


def cam_for(f):
    cam = markers[0][1]
    for mf, c in markers:
        if f >= mf:
            cam = c
    return cam


if a.stills:
    frames = [int(round(float(x) * fps)) + 1 for x in a.stills.split(',')]
else:
    f0, f1 = sc.frame_start, sc.frame_end
    if a.times:
        t0, t1 = (float(x) for x in a.times.split('-'))
        f0, f1 = int(round(t0 * fps)) + 1, int(round(t1 * fps))
    frames = list(range(f0, f1 + 1, a.step))
frames = [f for f in frames if (f - 1) / fps < a.black]
k, n = (int(x) for x in a.part.split('/'))
frames = frames[k::n]
t_start = time.time()
done = 0
for i, f in enumerate(frames):
    path = os.path.join(a.out, f'f{f:04d}.png')
    if os.path.exists(path) and not a.stills:
        continue
    sc.frame_set(f)
    sc.camera = cam_for(f)
    sc.render.filepath = path[:-4] + '.part.png'  # renamed when complete, so a stopped render never leaves half a PNG
    t = time.time()
    bpy.ops.render.render(write_still=True)
    os.replace(sc.render.filepath, path)
    done += 1
    el = time.time() - t_start
    left = (len(frames) - i - 1) * el / done
    print(f'frame {f} ({(f - 1) / fps:.2f}s) {time.time() - t:.1f}s  [{i + 1}/{len(frames)}, ~{left / 60:.0f} min left]',
          flush=True)
print('done', len(frames), 'frames', f'{(time.time() - t_start) / 60:.1f} min')
