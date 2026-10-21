"""Face lab: renders a character's head under a neutral three-point light with a list of expressions, for tuning
EXPRESSIONS and the character look. Usage (bpy module or blender -b -P ... --):
  python face_lab.py --char aren --exprs neutral,hope_smile,fear --out /tmp/lab [--res 400] [--angle 25]"""
import argparse
import math
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from imm import build, face as F  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--char', default='aren')
ap.add_argument('--exprs', default='neutral')
ap.add_argument('--out', default='/tmp/face_lab')
ap.add_argument('--res', type=int, default=400)
ap.add_argument('--angle', type=float, default=25)
ap.add_argument('--full', action='store_true')
a = ap.parse_args(argv)
os.makedirs(a.out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
ch = build.character(a.char, sc.collection)
eye = ch.eye_center + Vector((0, 0, -0.025))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
sc.collection.objects.link(cam)
sc.camera = cam
ang = math.radians(a.angle)
if a.full:
    cam.data.lens = 40
    tgt = Vector((0, 0, ch.eye_center.z * 0.55))
    cam.location = tgt + Vector((math.sin(ang) * 3.2, -math.cos(ang) * 3.2, 0.2))
else:
    cam.data.lens = 85
    tgt = eye
    cam.location = eye + Vector((math.sin(ang) * 0.85, -math.cos(ang) * 0.85, 0.04))
cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()


def light(name, typ, energy, size, color, offset):
    L = bpy.data.lights.new(name, typ)
    L.energy = energy
    if typ == 'AREA':
        L.size = size
    L.color = color
    o = bpy.data.objects.new(name, L)
    sc.collection.objects.link(o)
    o.location = eye + Vector(offset)
    o.rotation_euler = (eye - o.location).to_track_quat('-Z', 'Y').to_euler()


light('key', 'AREA', 18, 0.7, (1.0, 0.86, 0.7), (0.7, -0.8, 0.45))
light('fill', 'AREA', 5, 1.5, (0.65, 0.75, 1.0), (-0.9, -0.6, 0.0))
light('rim', 'AREA', 14, 0.5, (1.0, 0.8, 0.6), (-0.4, 0.8, 0.5))
w = bpy.data.worlds.new('w')
sc.world = w
w.node_tree.nodes['Background'].inputs[0].default_value = (0.09, 0.1, 0.12, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 0.35
sc.render.engine = 'BLENDER_EEVEE'
sc.eevee.taa_render_samples = 16
sc.render.resolution_x = a.res
sc.render.resolution_y = a.res
face = F.FaceRig(ch.rig)
for i, e in enumerate(a.exprs.split(',')):
    face.apply(F.EXPRESSIONS[e])
    t = time.time()
    sc.render.filepath = os.path.join(a.out, f'{a.char}_{i:02d}_{e}.png')
    bpy.ops.render.render(write_still=True)
    print(e, round(time.time() - t, 1), 's')
