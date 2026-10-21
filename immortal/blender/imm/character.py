"""Character builder: MakeHuman CC0 body -> Blender mesh + armature (163 bones, face included) + skin weights + eyes.

build_character(spec) returns a Character with .rig, .body, .eyes and a face-control API (see face.py).
Everything is deterministic: the same spec always gives the same character, so Aren looks identical in every shot
and every future episode.
"""
import math

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector

from . import mh

_BASE = None
_SKEL = None
_WEIGHTS = None

KEEP_GROUPS = ['body', 'helper-upper-teeth', 'helper-lower-teeth', 'helper-tongue',
               'helper-l-eyelashes-1', 'helper-l-eyelashes-2', 'helper-r-eyelashes-1', 'helper-r-eyelashes-2']
SLOT_OF_GROUP = {'body': 0, 'helper-upper-teeth': 1, 'helper-lower-teeth': 1, 'helper-tongue': 2,
                 'helper-l-eyelashes-1': 3, 'helper-l-eyelashes-2': 3, 'helper-r-eyelashes-1': 3, 'helper-r-eyelashes-2': 3}


def base():
    global _BASE, _SKEL, _WEIGHTS
    if _BASE is None:
        _BASE = mh.BaseMesh()
        _SKEL = mh.load_skeleton()
        _WEIGHTS = mh.load_weights()
    return _BASE, _SKEL, _WEIGHTS


class Character:
    def __init__(self, spec, rig, body, eyes, verts, joints):
        self.spec = spec
        self.id = spec['id']
        self.rig = rig
        self.body = body
        self.eyes = eyes
        self.verts = verts          # rest-pose vertex positions (Blender metres), original MakeHuman indexing
        self.joints = joints        # joint name -> Vector (rest, armature space)
        self.extras = []            # hair, brows, clothes ... (objects deformed by the rig)

    def bone_head(self, name):
        return self.rig.data.bones[name].head_local.copy()

    @property
    def eye_center(self):
        return (self.joints['eye.L____head'] + self.joints['eye.R____head']) * 0.5


def _link(obj, coll):
    coll.objects.link(obj)
    return obj


def build_body(spec, coll, name=None):
    B, skel, weights = base()
    name = name or spec['id']
    targets = mh.macro_targets(spec['macro']) + mh.modifier_targets(spec.get('modifiers', {}))
    v = mh.to_blender(B.shaped(targets))
    body_v = B.group_verts('body')
    for grp in ('helper-upper-teeth', 'helper-lower-teeth'):
        ids = B.group_verts(grp)
        c = v[ids].mean(axis=0)
        v[ids] = c + (v[ids] - c) * np.array([0.9, 0.95, 0.92]) + np.array([0, 0.0012, 0])
    v[:, 2] -= v[body_v, 2].min()
    v[:, 0] -= v[body_v, 0].mean()
    v[:, 1] -= v[body_v, 1].mean()
    joints = {j: Vector(p) for j, p in mh.joint_positions(skel, v).items()}

    # --- mesh (all vertices kept for now so MakeHuman indices stay valid for weights; loose ones removed after)
    fids = B.group_faces(*KEEP_GROUPS)
    me = bpy.data.meshes.new(name + '_body')
    faces = []
    for f in B.faces[fids]:
        faces.append(list(f[:3]) if f[3] == f[2] and len(set(f)) == 3 else list(f))
    me.from_pydata(v.tolist(), [], faces)
    uvl = me.uv_layers.new(name='UVMap')
    loop_uv = []
    for fi, f in zip(fids, faces):
        loop_uv.extend(B.face_uvs[fi][:len(f)])
    loop_uv = np.array(loop_uv)
    uv = B.uvs[np.clip(loop_uv, 0, None)]
    uvl.data.foreach_set('uv', uv.ravel())
    slots = np.array([SLOT_OF_GROUP[B.groups[g]] for g in B.face_group[fids]], dtype=np.int32)
    me.polygons.foreach_set('material_index', slots)
    me.polygons.foreach_set('use_smooth', np.ones(len(faces), dtype=bool))
    body = _link(bpy.data.objects.new(name + '_body', me), coll)
    # store original MakeHuman index (survives the loose-vertex cleanup)
    attr = me.attributes.new('mh_index', 'INT', 'POINT')
    attr.data.foreach_set('value', np.arange(len(v), dtype=np.int32))

    # --- armature
    arm = bpy.data.armatures.new(name + '_rig')
    rig = _link(bpy.data.objects.new(name + '_rig', arm), coll)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    for bn, b in skel['bones'].items():
        eb = arm.edit_bones.new(bn)
        eb.head = joints[b['head']]
        tail = joints[b['tail']]
        if (tail - eb.head).length < 1e-4:
            tail = eb.head + Vector((0, 0, 0.01))
        eb.tail = tail
    for bn, b in skel['bones'].items():
        if b['parent']:
            arm.edit_bones[bn].parent = arm.edit_bones[b['parent']]
    for bn, b in skel['bones'].items():
        pl = skel['planes'].get(b['rotation_plane'])
        if pl:
            p1, p2, p3 = (joints[j] for j in pl)
            n = (p2 - p1).cross(p3 - p2)
            if n.length > 1e-8:
                arm.edit_bones[bn].align_roll(n.normalized())
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.display_type = 'STICK'

    # --- weights
    for bn, lst in weights.items():
        vg = body.vertex_groups.new(name=bn)
        by_w = {}
        for i, w in lst:
            by_w.setdefault(round(w, 4), []).append(i)
        for w, ids in by_w.items():
            vg.add(ids, w, 'REPLACE')
    body.parent = rig
    mod = body.modifiers.new('Armature', 'ARMATURE')
    mod.object = rig
    mod.use_deform_preserve_volume = True

    # drop loose verts (helpers we did not keep)
    bm = bmesh.new()
    bm.from_mesh(me)
    loose = [vv for vv in bm.verts if not vv.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.to_mesh(me)
    bm.free()
    return rig, body, v, joints


def build_eye(name, center, forward, radius, coll, rig, bone, segs=40):
    """Eyeball as its own object, skinned 100% to the eye bone. UV: v = 1 at the pupil centre, 0 at the back,
    u = azimuth around the gaze axis (the eye material draws the iris from v)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=segs // 2 + 4, radius=radius)
    rot = Vector((0, 0, 1)).rotation_difference(forward).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ rot, verts=bm.verts)
    uvl = bm.loops.layers.uv.new('UVMap')
    fwd = forward.normalized()
    side = fwd.orthogonal().normalized()
    up = fwd.cross(side)
    for f in bm.faces:
        f.smooth = True
        for lp in f.loops:
            d = (lp.vert.co - center).normalized()
            polar = math.acos(max(-1.0, min(1.0, d.dot(fwd))))
            az = math.atan2(d.dot(up), d.dot(side))
            lp[uvl].uv = ((az / (2 * math.pi)) % 1.0, 1.0 - polar / math.pi)
    bm.to_mesh(me)
    bm.free()
    ob = _link(bpy.data.objects.new(name, me), coll)
    vg = ob.vertex_groups.new(name=bone)
    vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    ob.parent = rig
    m = ob.modifiers.new('Armature', 'ARMATURE')
    m.object = rig
    return ob


def eye_geometry(v, side):
    B, _, _ = base()
    ids = B.group_verts(f'helper-{side}-eye')
    p = v[ids]
    c = p.mean(axis=0)
    r = np.linalg.norm(p - c, axis=1).mean()
    return Vector(c), float(r)
