"""Assemble a complete character from its spec file (immortal/blender/characters/<id>.json):
body + rig + eyes + skin look + hair + brows + outfit. One call, deterministic."""
import json
import math
import os

import bpy
import numpy as np
from mathutils import Vector

from . import character as C
from . import clothes as K
from . import hair as H
from . import materials as M

CHAR_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'characters')


def load_spec(cid):
    return json.load(open(os.path.join(CHAR_DIR, cid + '.json')))


def _gauss(p, c, s):
    d2 = ((p - c) ** 2).sum(axis=1)
    return np.exp(-d2 / (2 * s * s))


def landmarks(v, joints):
    """Face landmarks from the shaped mesh (Blender coords): eye centres, interpupillary distance, nose tip, lips."""
    B = C.base()[0]
    body = B.group_verts('body')
    eL, eR = np.array(joints['eye.L____head']), np.array(joints['eye.R____head'])
    em = (eL + eR) / 2
    ipd = float(np.linalg.norm(eL - eR))
    p = v[body]
    mid = np.abs(p[:, 0]) < 0.08 * ipd
    nose_band = mid & (p[:, 2] < em[2] - 0.3 * ipd) & (p[:, 2] > em[2] - 1.2 * ipd)
    nose = p[nose_band][np.argmin(p[nose_band][:, 1])]
    lip_band = mid & (p[:, 2] < em[2] - 1.25 * ipd) & (p[:, 2] > em[2] - 2.0 * ipd) & (p[:, 1] < em[1])
    lips = p[lip_band][np.argmin(p[lip_band][:, 1])]
    return dict(eL=eL, eR=eR, em=em, ipd=ipd, nose=nose, lips=lips)


def paint_skin_attributes(body, v, joints, spec):
    """Float attributes read by the skin material: flush (cheeks, nose, ears, lids, lips), dirt (where grime may sit)."""
    me = body.data
    idx = np.zeros(len(me.vertices), dtype=np.int32)
    me.attributes['mh_index'].data.foreach_get('value', idx)
    p = v[idx]
    L = landmarks(v, joints)
    s = L['ipd']
    flush = np.zeros(len(p))
    for sx in (1, -1):
        e = L['eL'] if sx > 0 else L['eR']
        cheek = e + np.array([sx * 0.18 * s, -0.35 * s, -0.8 * s])
        flush += 0.55 * _gauss(p, cheek, 0.38 * s)
        ear = e + np.array([sx * 1.32 * s, 0.9 * s, -0.25 * s])
        flush += 0.6 * _gauss(p, ear, 0.35 * s)
        flush += spec['skin'].get('lid_flush', 0.35) * _gauss(p, e + np.array([0, -0.12 * s, 0]), 0.3 * s)
    flush += 0.55 * _gauss(p, L['nose'] + np.array([0, 0.05 * s, 0.02 * s]), 0.22 * s)
    flush += 0.45 * _gauss(p, L['lips'], 0.28 * s)
    flush = np.clip(flush, 0, 0.85)
    # dirt: stronger on limbs and torso, light on the face centre
    face_c = L['em'] + np.array([0, -0.3 * s, -0.8 * s])
    dirt = 1.0 - 0.75 * _gauss(p, face_c, 1.1 * s)
    for name, data in (('flush', flush), ('dirt', dirt)):
        a = me.attributes.get(name) or me.attributes.new(name, 'FLOAT', 'POINT')
        a.data.foreach_set('value', data.astype(np.float32))
    return L


def character(cid, coll, subdiv=1):
    spec = load_spec(cid)
    rig, body, v, joints = C.build_body(spec, coll)
    sk = spec['skin']
    seed = (sum(map(ord, cid)) % 97) * 0.37
    body.data.materials.append(M.skin(f'{cid}_skin', sk['base'], sk['flush'], sk.get('dirt', 0), seed,
                                      hair_color=spec['hair']['color']))
    body.data.materials.append(M.simple(f'{cid}_teeth', (0.72, 0.66, 0.55), 0.35, 0.4))
    body.data.materials.append(M.simple(f'{cid}_mouth', (0.22, 0.06, 0.06), 0.45, 0.3))
    body.data.materials.append(M.simple(f'{cid}_lash', spec['hair']['color'], 0.7, 0.2))
    L = paint_skin_attributes(body, v, joints, spec)
    eyem = M.eye(f'{cid}_eye', spec['eyes']['iris'])
    eyes = []
    for side, bone in (('l', 'eye.L'), ('r', 'eye.R')):
        c, r = C.eye_geometry(v, side)
        e = C.build_eye(f'{cid}_eye_{side}', c, Vector((0, -1, 0)), r, coll, rig, bone)
        e.data.materials.append(eyem)
        eyes.append(e)
    if subdiv:
        sub = body.modifiers.new('Subdivision', 'SUBSURF')
        sub.levels = 1
        sub.render_levels = subdiv
    ch = C.Character(spec, rig, body, eyes, v, {k: Vector(x) for k, x in joints.items()})
    ch.landmarks = L
    hs = spec['hair']
    hm = M.hair(f'{cid}_hair', hs['color'])
    cap_mat = M.hair(f'{cid}_hair_cap', [c * 0.8 for c in hs['color']], rough=0.8, sheen=0.0)
    ch.extras += H.scalp_hair(ch, coll, hm, kind=hs['style'], n=hs.get('n', 170), length=tuple(hs.get('length', (0.05, 0.085))),
                              width=tuple(hs.get('width', (0.012, 0.019))), curl=hs.get('curl', 0.08),
                              jitter=hs.get('jitter', 0.0), flat=hs.get('flat', 0.38), seed=seed_int(cid, 1),
                              cap_mat=cap_mat)
    ch.extras.append(H.brows(ch, coll, hm, thickness=hs.get('brow_thickness', 1.0), arch=hs.get('brow_arch', 1.0),
                             seed=seed_int(cid, 2)))
    paint = np.zeros(len(body.data.vertices), dtype=np.float32)
    co = np.array([vv.co[:] for vv in body.data.vertices])
    paint = np.maximum(paint, H.soft_mask(co, H.scalp_mask(co, L, front_el=21.0, temple_el=6.0, ear_el=-4.0,
                                                            back_el=-36.0), co))
    if hs.get('beard'):
        objs, jaw = H.beard(ch, coll, hm, seed=seed_int(cid, 3), n=hs.get('beard_n', 1100),
                            length=tuple(hs.get('beard_length', (0.005, 0.012))))
        ch.extras += objs
        paint = np.maximum(paint, 0.9 * H.soft_mask(co, jaw, co, radius=0.01))
    a = body.data.attributes.get('hairpaint') or body.data.attributes.new('hairpaint', 'FLOAT', 'POINT')
    a.data.foreach_set('value', paint)
    OUTFITS[spec['outfit']](ch, coll, seed)
    return ch


def _paint(ob, name, fn):
    me = ob.data
    vals = np.array([fn(Vector(vv.co)) for vv in me.vertices], dtype=np.float32)
    a = me.attributes.get(name) or me.attributes.new(name, 'FLOAT', 'POINT')
    a.data.foreach_set('value', vals)


def _tunic_outfit(ch, coll, seed, color, hem, tears=(), stains=(), mantle=False, sleeve=0.25, belt_color=(0.12, 0.08, 0.05)):
    hm = M.hide(f'{ch.id}_hide', color, seed=seed)
    parts, waist = K.tunic(ch, coll, hm, hem=hem, tears=tears, seed=seed, sleeve=sleeve)
    ht = max(vv[2] for vv in ch.verts[:13380])
    for ob in parts:
        _paint(ob, 'mud', lambda p: max(0.0, 1.0 - (p.z - hem * ht) / 0.18))
        _paint(ob, 'stain', lambda p: min(1.0, sum(w * math.exp(-((p - c).length / r) ** 2) for c, r, w in stains)))
    belt = K.band(ch, coll, M.rope(f'{ch.id}_rope', belt_color), waist, 0.035, 0.016, f'{ch.id}_belt')
    ch.extras += parts + [belt]
    K.covered_group(ch, (hem * ht, ch.joints['neck01____head'].z - 0.05), tears)
    if mantle:
        fm = M.fur(f'{ch.id}_fur', (0.16, 0.12, 0.085), seed)
        man = K.mantle(ch, coll, fm)
        ch.extras.append(man)
        ch.extras.append(H_fur(ch, man, coll, fm, seed))
    return parts


def H_fur(ch, src, coll, mat, seed, n=900):
    rng = np.random.default_rng(int(seed * 1000) + 99)
    me = src.data
    cb = H.ClumpBuilder(f'{ch.id}_fur_tufts')
    from mathutils.bvhtree import BVHTree
    verts = [vv.co.copy() for vv in me.vertices]
    bvh = BVHTree.FromPolygons(verts, [tuple(p.vertices) for p in me.polygons])
    ids = rng.choice(len(verts), size=min(n, len(verts)), replace=True)
    for vid in ids:
        root = verts[vid] + Vector(rng.normal(0, 0.006, 3))
        nrm = me.vertices[vid].normal.copy()
        d = (Vector((0, 0, -1)) * 0.9 + nrm * 0.25).normalized()
        pts = H.grow(bvh, root, nrm, d, rng.uniform(0.014, 0.03), 4, 0.8, 0.15, rng, 0.003)
        w = rng.uniform(0.007, 0.012)
        cb.add(pts, H.taper(len(pts), w, tip=w * 0.1), int(vid), nrm, flat=0.5, sides=5, shade=float(rng.uniform(-1, 1)))
    return cb.build(coll, mat, src, ch.rig, smooth_levels=0)


def _aren_outfit(ch, coll, seed):
    j = ch.joints
    shL = j['shoulder01.L____head']
    tears = [(np.array(shL) + np.array([-0.015, -0.03, -0.03]), 0.032),          # arrow wound, left shoulder front
             (np.array([-0.13, -0.02, j['spine02____head'].z - 0.04]), 0.028),  # right side ribs
             (np.array([0.07, -0.08, 0.62]), 0.03)]                              # left thigh
    stains = [(Vector(t) + Vector((0, 0, -0.02)), r * 2.6, 1.0) for t, r in tears]
    stains.append((Vector((0.04, -0.12, j['spine03____head'].z)), 0.06, 0.6))
    _tunic_outfit(ch, coll, seed, (0.30, 0.20, 0.115), hem=0.43, tears=tears, stains=stains)


def _father_outfit(ch, coll, seed):
    _tunic_outfit(ch, coll, seed, (0.19, 0.12, 0.07), hem=0.33, mantle=True, sleeve=0.3)


def _villager_outfit(ch, coll, seed):
    o = ch.spec.get('outfit_params', {})
    _tunic_outfit(ch, coll, seed, tuple(o.get('color', (0.24, 0.16, 0.09))), hem=o.get('hem', 0.36),
                  mantle=o.get('mantle', False), sleeve=o.get('sleeve', 0.3))


OUTFITS = {'aren_torn_tunic': _aren_outfit, 'father_fur': _father_outfit, 'villager': _villager_outfit}


def seed_int(cid, k):
    return (sum(ord(c) * (i + 1) for i, c in enumerate(cid)) * 7919 + k * 104729) % (2 ** 31)
