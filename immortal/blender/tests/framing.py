"""Framing check: where key points land in the active shot camera (0..1 screen coords, z = depth in metres).

  python framing.py --blend build/village_return.blend --times 18.6,20.5,21.8
"""
import argparse
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--blend', required=True)
ap.add_argument('--times', required=True)
a = ap.parse_args(argv)
bpy.ops.wm.open_mainfile(filepath=a.blend)
sc = bpy.context.scene
markers = sorted([(m.frame, m.camera, m.name) for m in sc.timeline_markers if m.camera], key=lambda x: x[0])
for t in (float(x) for x in a.times.split(',')):
    f = int(round(t * sc.render.fps)) + 1
    sc.frame_set(f)
    cam, name = markers[0][1], markers[0][2]
    for mf, c, n in markers:
        if f >= mf:
            cam, name = c, n
    sc.camera = cam
    dg = bpy.context.evaluated_depsgraph_get()
    print(f'{t:6.2f}s {name}  lens {cam.data.lens:.0f}')
    for rid in ('aren', 'father', 'villager_woman', 'villager_elder', 'villager_hunter'):
        ob = bpy.data.objects.get(rid + '_rig') or next((o for o in bpy.data.objects if o.type == 'ARMATURE' and o.name.startswith(rid)), None)
        if ob is None:
            continue
        ev = ob.evaluated_get(dg)
        pts = {'eye': ev.matrix_world @ ev.pose.bones['eye.L'].head, 'hip': ev.matrix_world @ ev.pose.bones['root'].head,
               'footL': ev.matrix_world @ ev.pose.bones['toe1-1.L'].head if 'toe1-1.L' in ev.pose.bones else ev.matrix_world @ ev.pose.bones['foot.L'].tail}
        s = '  '.join(f'{k}=({v.x:.2f},{v.y:.2f},{v.z:.1f})' for k, v in ((k, world_to_camera_view(sc, cam, p)) for k, p in pts.items()))
        print(f'    {rid:16s} {s}')
