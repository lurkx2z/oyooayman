"""Prehistoric outfits cut from MakeHuman's fitting helpers (helper-tights for the torso, helper-skirt for the lower
tunic), so the cloth carries the same skin weights as the body and deforms with it. Ragged hems, tears and stains
are seeded and therefore identical every build.
"""
import math

import bpy
import bmesh
import numpy as np
from mathutils import Vector

from . import character as C
from . import mh

ARM = ('upperarm01', 'upperarm02', 'lowerarm01', 'lowerarm02', 'wrist', 'finger', 'metacarpal')
NECK = ('neck01', 'neck02', 'neck03', 'head')


def _weight_table(ids):
    W = C.base()[2]
    s = set(int(i) for i in ids)
    out = {}
    for b, lst in W.items():
        for i, w in lst:
            if i in s:
                out.setdefault(i, []).append((b, w))
    return out


def _sum(wt, i, prefixes):
    return sum(w for b, w in wt.get(i, []) if b.startswith(prefixes))


def _noise(p, seed, freq=18.0):
    x, y, z = p
    return (math.sin(x * freq * 1.7 + seed) * math.sin(y * freq * 1.3 + seed * 2.1) * 0.5
            + math.sin(z * freq * 2.9 + seed * 0.7 + x * 5) * 0.5)


def part(ch, name, groups, keep_face, offset, coll, mat, solidify=0.003):
    """Mesh from MakeHuman helper faces passing keep_face(face_vertex_ids, centroid), pushed `offset` out along
    normals, skinned with the helper's own weights."""
    B, _, _ = C.base()
    v = ch.verts
    fids = B.group_faces(*groups)
    faces = []
    for fi in fids:
        f = B.faces[fi]
        f = list(f[:3]) if f[3] == f[2] else list(f)
        c = v[f].mean(axis=0)
        if keep_face(f, c):
            faces.append(f)
    used = sorted(set(i for f in faces for i in f))
    remap = {o: n for n, o in enumerate(used)}
    me = bpy.data.meshes.new(name)
    me.from_pydata(v[used].tolist(), [], [[remap[i] for i in f] for f in faces])
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # outward = away from the body's centre line at that height
    cen = np.array([0.0, 0.0])
    flip = 0
    for f in bm.faces:
        c = f.calc_center_median()
        if f.normal.dot(Vector((c.x, c.y, 0))) < 0:
            flip += 1
    if flip > len(bm.faces) / 2:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.normal_update()
    for vv in bm.verts:
        vv.co += vv.normal * offset
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    ob.data.materials.append(mat)
    wt = _weight_table(used)
    vgs = {}
    for o, n in remap.items():
        for b, w in wt.get(o, []):
            vg = vgs.get(b) or ob.vertex_groups.new(name=b)
            vgs[b] = vg
            vg.add([n], w, 'REPLACE')
    src = ob.data.attributes.new('mh_index', 'INT', 'POINT')
    src.data.foreach_set('value', np.array(used, dtype=np.int32))
    ob.parent = ch.rig
    if solidify:
        s = ob.modifiers.new('Solidify', 'SOLIDIFY')
        s.thickness = solidify
        s.offset = 1.0
        s.use_rim = True
    a = ob.modifiers.new('Armature', 'ARMATURE')
    a.object = ch.rig
    sub = ob.modifiers.new('Subdivision', 'SUBSURF')
    sub.levels = 0
    sub.render_levels = 1
    return ob


def tunic(ch, coll, mat, hem=0.42, top_cut=0.0, tears=(), seed=3, offset=0.006, ragged=0.03, sleeve=0.25):
    """Sleeveless hide tunic from shoulders to `hem` (fraction of leg length below the crotch... expressed as
    height above the ground in body heights). tears: [(Vector centre, radius)] holes."""
    B, _, _ = C.base()
    v = ch.verts
    H = v[B.group_verts('body'), 2].max()
    waist = ch.joints['spine04____head'].z if 'spine04____head' in ch.joints else 0.55 * H
    hem_z = hem * H
    tids = B.group_verts('helper-tights', 'helper-skirt')
    wt = _weight_table(tids)

    def keep_upper(f, c):
        if c[2] < waist - 0.03:
            return False
        for i in f:
            if _sum(wt, i, ARM) > sleeve or _sum(wt, i, NECK) > 0.25:
                return False
        return not _torn(c, tears)

    def keep_lower(f, c):
        if c[2] > waist + 0.03:
            return False
        z = hem_z + ragged * _noise(c, seed) + ragged * 0.6 * _noise(c, seed + 5, 47)
        return c[2] > z and not _torn(c, tears)

    up = part(ch, f'{ch.id}_tunic_top', ['helper-tights'], keep_upper, offset, coll, mat)
    lo = part(ch, f'{ch.id}_tunic_skirt', ['helper-skirt'], keep_lower, offset + 0.004, coll, mat)
    return [up, lo], waist


def _torn(c, tears):
    for t, r in tears:
        if np.linalg.norm(np.asarray(c) - np.asarray(t)) < r:
            return True
    return False


def band(ch, coll, mat, z, height, offset, name, groups=('helper-tights',)):
    """A belt / wrap: helper faces in a horizontal band around height z."""
    B, _, _ = C.base()
    ids = B.group_verts(*groups)
    wt = _weight_table(ids)

    def keep(f, c):
        return abs(c[2] - z) < height / 2 and all(_sum(wt, i, ARM) < 0.2 for i in f)
    return part(ch, name, list(groups), keep, offset, coll, mat, solidify=0.008)


def mantle(ch, coll, mat, depth=0.16, offset=0.018, name=None):
    """Fur shoulder mantle: the top of the torso helper from the neck out over the shoulders, down `depth`."""
    B, _, _ = C.base()
    ids = B.group_verts('helper-tights')
    wt = _weight_table(ids)
    sh = ch.joints['shoulder01.L____head'].z if 'shoulder01.L____head' in ch.joints else 1.3

    def keep(f, c):
        if c[2] < sh - depth:
            return False
        for i in f:
            if _sum(wt, i, NECK) > 0.5 or _sum(wt, i, ('lowerarm',)) > 0.1 or _sum(wt, i, ('upperarm02',)) > 0.3:
                return False
        return True
    return part(ch, name or f'{ch.id}_mantle', ['helper-tights'], keep, offset, coll, mat, solidify=0.012)


def covered_group(ch, objs_z, tears=(), name='covered'):
    """Vertex group of body vertices hidden under the tunic (for a Mask modifier), excluding tear holes."""
    z0, z1 = objs_z
    body = ch.body
    me = body.data
    idx = np.zeros(len(me.vertices), dtype=np.int32)
    me.attributes['mh_index'].data.foreach_get('value', idx)
    wt = _weight_table(idx)
    vg = body.vertex_groups.new(name=name)
    ids = []
    for vi, mi in enumerate(idx):
        p = ch.verts[mi]
        if z0 + 0.04 < p[2] < z1 and _sum(wt, mi, ARM) < 0.05 and _sum(wt, mi, NECK) < 0.05 and not _torn(p, [(t, r + 0.02) for t, r in tears]):
            ids.append(vi)
    vg.add(ids, 1.0, 'REPLACE')
    m = body.modifiers.new('HideCovered', 'MASK')
    m.vertex_group = name
    m.invert_vertex_group = True
    # mask before the armature
    while body.modifiers.find('HideCovered') > 0:
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.modifier_move_up(modifier='HideCovered')
    return vg
