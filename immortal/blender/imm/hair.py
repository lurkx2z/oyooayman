"""Stylized hair, brows, beard and fur as tapered clump meshes (animated-film style locks, not strands).

Every clump is grown from a root on the skin along a flow field, kept off the surface with a BVH, and skinned by
copying the skin weights of its root vertex, so brows ride the brow bones and the beard rides the jaw. Seeded RNG:
the same character always gets the same hair.
"""
import math

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree


def _rng(seed):
    return np.random.default_rng(seed)


def body_bvh(body):
    """BVH of the rest-pose body (no modifiers) + its vertex normals."""
    me = body.data
    verts = [v.co.copy() for v in me.vertices]
    polys = [tuple(p.vertices) for p in me.polygons if p.material_index == 0]
    return BVHTree.FromPolygons(verts, polys)


class ClumpBuilder:
    """Accumulates clumps into one mesh. Each clump: polyline points, widths, flatten ratio, colour jitter,
    and the body vertex it is rooted at (for weights)."""

    def __init__(self, name):
        self.name = name
        self.verts, self.faces, self.root_of_vert, self.shade = [], [], [], []

    def add(self, pts, widths, root_vid, normal, flat=0.55, sides=6, shade=0.0):
        n = len(pts)
        base = len(self.verts)
        prev_side = None
        for i in range(n):
            t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
            side = normal.cross(t)
            if side.length < 1e-6:
                side = t.orthogonal()
            side.normalize()
            if prev_side is not None and side.dot(prev_side) < 0:
                side = -side
            prev_side = side
            up = t.cross(side).normalized()
            w = widths[i]
            for k in range(sides):
                a = 2 * math.pi * k / sides
                off = side * (math.cos(a) * w) + up * (math.sin(a) * w * flat)
                self.verts.append(pts[i] + off)
                self.root_of_vert.append(root_vid)
                self.shade.append(shade)
        for i in range(n - 1):
            for k in range(sides):
                a = base + i * sides + k
                b = base + i * sides + (k + 1) % sides
                self.faces.append((a, b, b + sides, a + sides))
        # cap the root
        self.faces.append(tuple(base + k for k in reversed(range(sides))))

    def build(self, coll, material, body, rig, smooth_levels=1):
        me = bpy.data.meshes.new(self.name)
        me.from_pydata([tuple(v) for v in self.verts], [], self.faces)
        for p in me.polygons:
            p.use_smooth = True
        a = me.attributes.new('shade', 'FLOAT', 'POINT')
        a.data.foreach_set('value', np.array(self.shade, dtype=np.float32))
        ob = bpy.data.objects.new(self.name, me)
        coll.objects.link(ob)
        ob.data.materials.append(material)
        copy_weights(body, ob, self.root_of_vert)
        ob.parent = rig
        m = ob.modifiers.new('Armature', 'ARMATURE')
        m.object = rig
        if smooth_levels:
            s = ob.modifiers.new('Subdivision', 'SUBSURF')
            s.levels = 0
            s.render_levels = smooth_levels
        return ob


def copy_weights(body, ob, src_vids):
    """Give each vertex of `ob` the full weight set of body vertex src_vids[i]."""
    groups = {g.index: g.name for g in body.vertex_groups}
    per_src = {}
    for vid in set(src_vids):
        per_src[vid] = [(groups[g.group], g.weight) for g in body.data.vertices[vid].groups if g.weight > 1e-3]
    vgs = {}
    for i, vid in enumerate(src_vids):
        for gname, w in per_src[vid]:
            vg = vgs.get(gname) or ob.vertex_groups.get(gname) or ob.vertex_groups.new(name=gname)
            vgs[gname] = vg
            vg.add([i], w, 'REPLACE')


def nearest_vertex_ids(body, points):
    from mathutils.kdtree import KDTree
    me = body.data
    kd = KDTree(len(me.vertices))
    for v in me.vertices:
        kd.insert(v.co, v.index)
    kd.balance()
    return [kd.find(p)[1] for p in points]


def keep_off(bvh, p, offset):
    loc, nrm, _, dist = bvh.find_nearest(p)
    if loc is None:
        return p
    d = (p - loc).dot(nrm)
    if d < offset:
        return loc + nrm * offset + (p - loc - nrm * d)
    return p


def grow(bvh, root, normal, direction, length, segs, gravity, curl, rng, offset):
    pts = [root + normal * offset * 0.6]
    dirv = direction.normalized()
    step = length / segs
    for i in range(segs):
        dirv = (dirv + Vector((0, 0, -gravity * (i + 1) / segs)) + Vector(rng.normal(0, curl, 3))).normalized()
        p = pts[-1] + dirv * step
        p = keep_off(bvh, p, offset * (1.0 + 0.6 * i / segs))
        pts.append(p)
    return pts


def taper(n, w0, tip=0.0, belly=0.25, root=0.55):
    out = []
    for i in range(n):
        t = i / (n - 1)
        bulge = 1 + belly * math.sin(math.pi * min(1, t * 1.6))
        grow_in = root + (1 - root) * min(1.0, t / 0.3)
        out.append(max(tip, w0 * (1 - t) ** 0.85 * bulge * grow_in))
    return out


# ------------------------------------------------------------------------------------------------ scalp mask
def head_frame(L):
    em = Vector(L['em'])
    s = L['ipd']
    center = em + Vector((0, 0.95 * s, 0.55 * s))
    return center, s


def scalp_mask(p, L, front_el=26.0, temple_el=9.0, ear_el=13.0, back_el=-32.0):
    """True where hair grows: by elevation/azimuth around the head centre, with a hairline that is high at the
    forehead, dips at the temples, clears the ears and drops to the nape."""
    c, s = head_frame(L)
    rel = p - np.array(c)
    r = np.linalg.norm(rel, axis=1) + 1e-9
    el = np.degrees(np.arcsin(rel[:, 2] / r))
    az = np.degrees(np.abs(np.arctan2(rel[:, 0], -rel[:, 1])))
    thr = np.interp(az, [0, 35, 60, 85, 105, 130, 180], [front_el, front_el - 4, temple_el, ear_el, ear_el + 2, -5, back_el])
    near = r < 3.2 * s
    return near & (el > thr)


def _flow(kind, p, center, normal, rng):
    rel = p - center
    back = Vector((0, 1, 0))
    down = Vector((0, 0, -1))
    if kind == 'messy':
        # whorl at the crown, locks fall forward over the brow, out and down at the sides, down at the back
        crown = center + Vector((0, 0.35, 1.0)) * rel.length * 0.8
        out = (p - crown)
        out.z *= 0.35
        d = out.normalized() * 0.9 + down * 0.55 + normal * 0.18
        if rel.y < 0 and rel.z > 0:  # front: fringe, swept to one side
            d = Vector((rel.x * 2.5 + 0.35, -0.3, -0.75)).normalized() + normal * 0.15
    elif kind == 'long':
        d = down * 1.0 + back * 0.45 + normal * 0.15
        if rel.y < 0 and rel.z > 0:  # parted at the centre, swept to the sides and back
            d = Vector((math.copysign(1.0, rel.x + 1e-4) * 0.9, 0.6, -0.4)).normalized() + normal * 0.1
    elif kind == 'swept_back':
        d = back * 1.0 + down * 0.35 + normal * 0.25
        if rel.y > 0.02:
            d = down * 1.0 + back * 0.25 + normal * 0.2
    else:
        d = normal
    return d.normalized()


def scalp_hair(ch, coll, mat, kind='messy', n=170, length=(0.05, 0.085), width=(0.012, 0.019), seed=1,
               offset=0.004, cap=True):
    body = ch.body
    L = ch.landmarks
    me = body.data
    co = np.array([v.co[:] for v in me.vertices])
    nrm = np.array([v.normal[:] for v in me.vertices])
    mask = scalp_mask(co, L)
    ids = np.nonzero(mask)[0]
    rng = _rng(seed)
    bvh = body_bvh(body)
    center, s = head_frame(L)
    cb = ClumpBuilder(f'{ch.id}_hair')
    pick = rng.choice(ids, size=min(n, len(ids)), replace=False)
    # sort by height so the top layer is built last (only matters for shading order)
    pick = sorted(pick, key=lambda i: co[i][2])
    for vid in pick:
        root = Vector(co[vid])
        normal = Vector(nrm[vid])
        d = _flow(kind, root, center, normal, rng)
        ln = rng.uniform(*length)
        if kind == 'messy' and rng.random() < 0.1:
            ln *= 0.6  # a few short tufts lifting off the crown
            d = (d + normal * 0.5).normalized()
        rel = root - center
        if kind == 'messy' and rel.y < 0 and rel.z > 0:
            ln = min(ln, 0.9 * (root.z - (L['em'][2] + 0.55 * s)) + 0.012) * rng.uniform(0.55, 1.0)  # fringe stops above the brows, uneven
        segs = 7
        pts = grow(bvh, root, normal, d, max(ln, 0.015), segs, gravity=0.5 if kind == 'messy' else (1.2 if kind == 'long' else 0.7), curl=0.08,
                   rng=rng, offset=offset)
        w = rng.uniform(*width)
        cb.add(pts, taper(len(pts), w, tip=w * 0.12), int(vid), normal, flat=0.38, shade=float(rng.uniform(-1, 1)))
    hair = cb.build(coll, mat, body, ch.rig)
    objs = [hair]
    if cap:
        inner = scalp_mask(co, L, front_el=34.0, temple_el=22.0, ear_el=32.0, back_el=-22.0)
        objs.append(shell(ch, coll, mat, inner, f'{ch.id}_hair_cap', offset * 0.7))
    return objs


def shell(ch, coll, mat, vmask, name, offset):
    """Copy of the body faces whose vertices are all in vmask, pushed out along normals; same weights."""
    body = ch.body
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bm.verts.ensure_lookup_table()
    keep = [f for f in bm.faces if f.material_index == 0 and all(vmask[v.index] for v in f.verts)]
    drop = [f for f in bm.faces if f not in set(keep)]
    bmesh.ops.delete(bm, geom=drop, context='FACES_ONLY')
    loose = [v for v in bm.verts if not v.link_faces]
    src = [v.index for v in bm.verts if v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.verts.ensure_lookup_table()
    for v in bm.verts:
        v.co += v.normal * offset
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    ob.data.materials.append(mat)
    copy_weights(body, ob, src)
    ob.parent = ch.rig
    m = ob.modifiers.new('Armature', 'ARMATURE')
    m.object = ch.rig
    return ob


# ------------------------------------------------------------------------------------------------ brows
def brows(ch, coll, mat, thickness=1.0, seed=7, arch=1.0, length=1.0):
    """Short flat clumps along an arc above each eye, lying on the skin and following the brow bones."""
    body = ch.body
    L = ch.landmarks
    s = L['ipd']
    bvh = body_bvh(body)
    rng = _rng(seed)
    cb = ClumpBuilder(f'{ch.id}_brows')
    roots, normals, dirs, widths, lens = [], [], [], [], []
    for sx, e in ((1, L['eL']), (-1, L['eR'])):
        e = Vector(e)
        n = int(26 * thickness)
        for i in range(n):
            t = i / (n - 1)
            x = e.x + sx * s * (-0.3 + 0.75 * t * length)
            z = e.z + s * (0.42 + 0.12 * arch * math.sin(math.pi * min(1, t * 1.15)) - 0.06 * t)
            z += rng.normal(0, 0.012) * s
            probe = Vector((x, e.y - 2 * s, z))
            hit, nrm, _, _ = bvh.ray_cast(probe, Vector((0, 1, 0)))
            if hit is None:
                continue
            # hairs point outward along the arc; the inner ones stand more upward
            along = Vector((sx * 1.0, 0, 0.25 - 0.35 * t))
            up = Vector((sx * 0.25, 0, 1.0))
            d = (up * max(0, 0.6 - t) * 1.6 + along).normalized()
            d = (d - nrm * d.dot(nrm)).normalized()
            roots.append(hit)
            normals.append(nrm)
            dirs.append(d)
            widths.append(s * (0.055 - 0.02 * t) * thickness ** 0.5 * rng.uniform(0.85, 1.15))
            lens.append(s * (0.2 + 0.08 * math.sin(math.pi * t)) * rng.uniform(0.85, 1.2))
    vids = nearest_vertex_ids(body, roots)
    for r, nrm, d, w, ln, vid in zip(roots, normals, dirs, widths, lens, vids):
        pts = [r + nrm * 0.0008]
        for k in range(1, 5):
            p = pts[-1] + d * (ln / 4)
            p = keep_off(bvh, p, 0.0009 + 0.0003 * k)
            pts.append(p)
        cb.add(pts, taper(len(pts), w, belly=0.1), vid, nrm, flat=0.35, sides=5, shade=float(rng.uniform(-1, 1)))
    return cb.build(coll, mat, body, ch.rig, smooth_levels=0)


# ------------------------------------------------------------------------------------------------ beard
def beard(ch, coll, mat, n=320, length=(0.007, 0.016), seed=11, offset=0.0018):
    body = ch.body
    L = ch.landmarks
    s = L['ipd']
    me = body.data
    co = np.array([v.co[:] for v in me.vertices])
    nrm = np.array([v.normal[:] for v in me.vertices])
    em = L['em']
    rel = co - em
    # below the cheekbones, in front of the ears, above the neck crease; upper lip moustache included
    jaw = (rel[:, 2] < -0.75 * s) & (rel[:, 2] > -2.45 * s) & (np.abs(rel[:, 0]) < 1.3 * s) & (rel[:, 1] < 0.55 * s)
    jaw &= ~((np.abs(rel[:, 0]) < 0.42 * s) & (rel[:, 2] > -1.12 * s))      # keep the nostrils clear
    lips = (np.abs(rel[:, 0]) < 0.42 * s) & (rel[:, 2] < -1.32 * s) & (rel[:, 2] > -1.72 * s) & (rel[:, 1] < -0.6 * s)
    jaw &= ~lips
    ids = np.nonzero(jaw)[0]
    rng = _rng(seed)
    bvh = body_bvh(body)
    cb = ClumpBuilder(f'{ch.id}_beard')
    for vid in rng.choice(ids, size=min(n, len(ids)), replace=False):
        root = Vector(co[vid])
        normal = Vector(nrm[vid])
        d = (Vector((0, 0, -1)) * 1.0 + normal * 0.2).normalized()
        pts = grow(bvh, root, normal, d, rng.uniform(*length), 4, gravity=0.5, curl=0.08, rng=rng, offset=offset)
        w = rng.uniform(0.005, 0.0085)
        cb.add(pts, taper(len(pts), w, tip=w * 0.2, root=0.8), int(vid), normal, flat=0.4, sides=5,
               shade=float(rng.uniform(-1, 1)))
    return [cb.build(coll, mat, body, ch.rig, smooth_levels=1)], jaw


def soft_mask(co, mask, _co=None, radius=0.006):
    """Blur a boolean vertex mask into a 0..1 float with a soft edge (radius in metres)."""
    from mathutils.kdtree import KDTree
    pts = co[mask]
    if not len(pts):
        return np.zeros(len(co), dtype=np.float32)
    kd = KDTree(len(pts))
    for i, p in enumerate(pts):
        kd.insert(p, i)
    kd.balance()
    out = np.zeros(len(co), dtype=np.float32)
    for i, p in enumerate(co):
        if mask[i]:
            out[i] = 1.0
        else:
            _, _, d = kd.find(p)
            out[i] = max(0.0, 1.0 - d / radius)
    return out
