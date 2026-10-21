"""MakeHuman (CC0) data layer for Project Immortal: base mesh, macro targets, skeleton, skin weights, face pose units.

Pure Python + numpy (no bpy), so the asset fetcher can use it too. Everything is in MakeHuman's own frame
(Y up, +Z forward, decimetres) until `to_blender()` converts a point array to Blender's (Z up, -Y forward, metres).

The assets are the CC0 part of MakeHuman 1.x (https://github.com/makehumancommunity/makehuman, LICENSE.ASSETS.md),
vendored under immortal/assets/makehuman/ by immortal/tools/fetch_makehuman.py.
"""
import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, '..', '..', 'assets', 'makehuman'))
RAW = 'https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/'

BASE_FILES = [
    'data/3dobjs/base.obj',
    'data/rigs/default.mhskel',
    'data/rigs/default_weights.mhw',
    'data/poseunits/face-poseunits.bvh',
    'data/poseunits/face-poseunits.json',
]


def asset(rel):
    return os.path.join(ASSETS, rel)


# ---------------------------------------------------------------------------------------------- macro targets
AGES = [('baby', 0.0), ('child', 0.1875), ('young', 0.5), ('old', 1.0)]


def years_to_age(years):
    """MakeHuman's age slider: 0 -> 1 y, 0.1875 -> 11 y, 0.5 -> 25 y, 1 -> 90 y (piecewise linear)."""
    if years <= 11:
        return (years - 1) / 10 * 0.1875
    if years <= 25:
        return 0.1875 + (years - 11) / 14 * 0.3125
    return 0.5 + (years - 25) / 65 * 0.5


def _age_weights(a):
    out = {}
    for (n0, v0), (n1, v1) in zip(AGES, AGES[1:]):
        if v0 <= a <= v1:
            t = (a - v0) / (v1 - v0)
            out[n0] = 1 - t
            out[n1] = t
            break
    return {k: v for k, v in out.items() if v > 1e-4}


def _tri(v, lo, mid, hi):
    if v < 0.5:
        return {lo: 1 - v * 2, mid: v * 2}
    return {mid: 1 - (v - 0.5) * 2, hi: (v - 0.5) * 2}


def macro_targets(m):
    """m: {'gender': 0..1 (1 = male), 'years': age, 'muscle': 0..1, 'weight': 0..1, 'height': 0..1,
    'races': {'african': w, 'asian': w, 'caucasian': w}} -> [(target relpath, weight)]."""
    g = {'female': 1 - m['gender'], 'male': m['gender']}
    g = {k: v for k, v in g.items() if v > 1e-4}
    a = _age_weights(years_to_age(m['years']))
    mu = {k: v for k, v in _tri(m.get('muscle', 0.5), 'minmuscle', 'averagemuscle', 'maxmuscle').items() if v > 1e-4}
    we = {k: v for k, v in _tri(m.get('weight', 0.5), 'minweight', 'averageweight', 'maxweight').items() if v > 1e-4}
    races = m.get('races', {'caucasian': 1})
    tot = sum(races.values())
    out = []
    for rk, rv in races.items():
        for gk, gv in g.items():
            for ak, av in a.items():
                out.append((f'data/targets/macrodetails/{rk}-{gk}-{ak}.target', rv / tot * gv * av))
    for gk, gv in g.items():
        for ak, av in a.items():
            for mk, mv in mu.items():
                for wk, wv in we.items():
                    w = gv * av * mv * wv
                    if mk == 'averagemuscle' and wk == 'averageweight':
                        continue  # the identity target (empty file)
                    out.append((f'data/targets/macrodetails/universal-{gk}-{ak}-{mk}-{wk}.target', w))
    h = m.get('height', 0.5)
    if abs(h - 0.5) > 1e-4:
        hk, hv = ('maxheight', (h - 0.5) * 2) if h > 0.5 else ('minheight', (0.5 - h) * 2)
        for gk, gv in g.items():
            for ak, av in a.items():
                for mk, mv in mu.items():
                    for wk, wv in we.items():
                        out.append((f'data/targets/macrodetails/height/{gk}-{ak}-{mk}-{wk}-{hk}.target', gv * av * mv * wv * hv))
    return [(p, w) for p, w in out if w > 1e-4]


def modifier_targets(mods):
    """mods: {'eyes/r-eye-scale-incr': 0.4, 'head/head-oval': 0.5} -> [(relpath, weight)]. Keys are MakeHuman target
    file stems under data/targets/ (see data/modifiers/modeling_modifiers.json for the names); weights 0..1."""
    return [(f'data/targets/{k}.target', v) for k, v in mods.items() if v > 1e-5]


def load_target(rel):
    """-> (indices int array, deltas (n,3) float array) in MakeHuman units."""
    idx, d = [], []
    with open(asset(rel)) as f:
        for line in f:
            if not line.strip() or line[0] == '#':
                continue
            p = line.split()
            idx.append(int(p[0]))
            d.append((float(p[1]), float(p[2]), float(p[3])))
    return np.array(idx, dtype=np.int64), np.array(d, dtype=np.float64).reshape(-1, 3)


# ---------------------------------------------------------------------------------------------- base mesh
class BaseMesh:
    def __init__(self):
        cache = asset('base_cache.npz')
        src = asset('data/3dobjs/base.obj')
        if os.path.exists(cache) and os.path.getmtime(cache) >= os.path.getmtime(src):
            z = np.load(cache, allow_pickle=True)
            self.verts, self.uvs = z['verts'], z['uvs']
            self.faces, self.face_uvs, self.face_group = z['faces'], z['face_uvs'], z['face_group']
            self.groups = list(z['groups'])
            return
        verts, uvs, faces, fuv, fgrp, groups = [], [], [], [], [], []
        g = -1
        with open(src) as f:
            for line in f:
                if line.startswith('v '):
                    verts.append([float(x) for x in line.split()[1:4]])
                elif line.startswith('vt '):
                    uvs.append([float(x) for x in line.split()[1:3]])
                elif line.startswith('g '):
                    name = line.split(None, 1)[1].strip()
                    if name not in groups:
                        groups.append(name)
                    g = groups.index(name)
                elif line.startswith('f '):
                    p = [x.split('/') for x in line.split()[1:]]
                    if len(p) == 3:
                        p.append(p[2])  # store triangles as degenerate quads, flagged by equal last index
                    faces.append([int(x[0]) - 1 for x in p])
                    fuv.append([int(x[1]) - 1 if len(x) > 1 and x[1] else -1 for x in p])
                    fgrp.append(g)
        self.verts = np.array(verts)
        self.uvs = np.array(uvs)
        self.faces = np.array(faces, dtype=np.int64)
        self.face_uvs = np.array(fuv, dtype=np.int64)
        self.face_group = np.array(fgrp, dtype=np.int64)
        self.groups = groups
        np.savez_compressed(cache, verts=self.verts, uvs=self.uvs, faces=self.faces, face_uvs=self.face_uvs,
                            face_group=self.face_group, groups=np.array(groups, dtype=object))

    def group_faces(self, *names):
        ids = [self.groups.index(n) for n in names if n in self.groups]
        return np.nonzero(np.isin(self.face_group, ids))[0]

    def group_verts(self, *names):
        return np.unique(self.faces[self.group_faces(*names)])

    def shaped(self, targets):
        v = self.verts.copy()
        for rel, w in targets:
            idx, d = load_target(rel)
            if len(idx):
                v[idx] += d * w
        return v


def to_blender(p):
    """MakeHuman (x, y up, z fwd) decimetres -> Blender (x, -z, y) metres."""
    p = np.asarray(p, dtype=np.float64)
    return np.stack([p[..., 0], -p[..., 2], p[..., 1]], axis=-1) * 0.1


# ---------------------------------------------------------------------------------------------- skeleton
def load_skeleton():
    return json.load(open(asset('data/rigs/default.mhskel')))


def joint_positions(skel, verts):
    return {j: verts[np.array(ix)].mean(axis=0) for j, ix in skel['joints'].items()}


def load_weights():
    return json.load(open(asset('data/rigs/default_weights.mhw')))['weights']


# ---------------------------------------------------------------------------------------------- face pose units
def load_face_units():
    """-> (unit names, {bone: [ (rx, ry, rz) degrees per unit ]}) from face-poseunits.bvh (Blender-oriented BVH)."""
    names = json.load(open(asset('data/poseunits/face-poseunits.json')))['framemapping']
    joints, chans = [], []
    lines = open(asset('data/poseunits/face-poseunits.bvh')).read().split('\n')
    i = 0
    while not lines[i].strip().startswith('MOTION'):
        s = lines[i].strip().split()
        if s and s[0] in ('ROOT', 'JOINT'):
            joints.append(s[1])
        elif s and s[0] == 'CHANNELS':
            chans.append(s[2:])
        i += 1
    nframes = int(lines[i + 1].split()[1])
    data = [list(map(float, l.split())) for l in lines[i + 3:i + 3 + nframes]]
    out = {}
    for f, row in enumerate(data):
        k = 0
        for j, ch in zip(joints, chans):
            vals = dict(zip(ch, row[k:k + len(ch)]))
            k += len(ch)
            out.setdefault(j, []).append((vals.get('Xrotation', 0.0), vals.get('Yrotation', 0.0), vals.get('Zrotation', 0.0),
                                          [c for c in ch if c.endswith('rotation')]))
    return names, out
