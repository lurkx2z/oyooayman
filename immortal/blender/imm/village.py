"""Prehistoric village at dawn: ground, forest edge, hide shelters, dying fires, props, mist, light.

Layout (metres, +Y = north, toward the forest Aren comes out of). The father's fire is at FIRE, his shelter at
SHELTER; Aren's path ends between the village centre and the fire. Cameras stay south of the Aren-father line
(y < 0), so Aren is always screen-left and his father screen-right.
"""
import math

import bpy
import bmesh
import numpy as np
from mathutils import Euler, Matrix, Vector

from . import materials as M

FIRE = Vector((1.45, -0.6, 0))
SHELTER = Vector((3.9, 2.3, 0))
FIRE2 = Vector((-4.6, 3.6, 0))
SUN_DIR = Vector((0.86, 0.42, 0.21)).normalized()   # direction TO the sun: low in the east-north-east, through a gap in the trees


def _rng(seed):
    return np.random.default_rng(seed)


def _obj(name, me, coll, mat=None):
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    if mat is not None:
        ob.data.materials.append(mat)
    return ob


def _mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def _smooth(me):
    for p in me.polygons:
        p.use_smooth = True


# ------------------------------------------------------------------------------------------------ materials
def ground_material():
    m, n, l = M._new('ground')
    b = n.get('Principled BSDF')
    M._set(b, rough=0.92, spec=0.2)
    tc = n.new('ShaderNodeTexCoord')
    big = n.new('ShaderNodeTexNoise')
    big.inputs['Scale'].default_value = 0.35
    big.inputs['Detail'].default_value = 6
    l.new(tc.outputs['Object'], big.inputs['Vector'])
    fine = n.new('ShaderNodeTexNoise')
    fine.inputs['Scale'].default_value = 9
    fine.inputs['Detail'].default_value = 10
    fine.inputs['Roughness'].default_value = 0.7
    l.new(tc.outputs['Object'], fine.inputs['Vector'])
    # grass vs dirt from big noise + distance from the village centre (trodden earth in the middle)
    dist = n.new('ShaderNodeVectorMath')
    dist.operation = 'LENGTH'
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(tc.outputs['Object'], sep.inputs['Vector'])
    comb = n.new('ShaderNodeCombineXYZ')
    l.new(sep.outputs['X'], comb.inputs['X'])
    sub = n.new('ShaderNodeMath')
    sub.operation = 'SUBTRACT'
    sub.inputs[1].default_value = 1.5
    l.new(sep.outputs['Y'], sub.inputs[0])
    l.new(sub.outputs[0], comb.inputs['Y'])
    l.new(comb.outputs['Vector'], dist.inputs[0])
    dr = n.new('ShaderNodeMapRange')
    dr.inputs['From Min'].default_value = 5.0
    dr.inputs['From Max'].default_value = 13.0
    l.new(dist.outputs['Value'], dr.inputs['Value'])
    add = n.new('ShaderNodeMath')
    add.operation = 'ADD'
    l.new(dr.outputs['Result'], add.inputs[0])
    bm_ = n.new('ShaderNodeMath')
    bm_.operation = 'MULTIPLY_ADD'
    bm_.inputs[1].default_value = 0.9
    bm_.inputs[2].default_value = -0.45
    l.new(big.outputs['Fac'], bm_.inputs[0])
    l.new(bm_.outputs[0], add.inputs[1])
    grass_ramp = n.new('ShaderNodeValToRGB')
    e = grass_ramp.color_ramp.elements
    e[0].position = 0.35
    e[0].color = (0.085, 0.06, 0.04, 1)     # trodden dirt
    e[1].position = 0.75
    e[1].color = (0.06, 0.075, 0.03, 1)     # dewy grass
    e.new(0.55).color = (0.08, 0.07, 0.04, 1)
    l.new(add.outputs[0], grass_ramp.inputs['Fac'])
    detail = n.new('ShaderNodeMix')
    detail.data_type = 'RGBA'
    detail.blend_type = 'OVERLAY'
    detail.inputs['Factor'].default_value = 0.55
    l.new(grass_ramp.outputs['Color'], detail.inputs[6])
    l.new(fine.outputs['Color'], detail.inputs[7])
    l.new(detail.outputs[2], b.inputs['Base Color'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.35
    l.new(fine.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def bark_material(name='bark', color=(0.07, 0.05, 0.035)):
    m, n, l = M._new(name)
    b = n.get('Principled BSDF')
    M._set(b, rough=0.9, spec=0.15)
    tc = n.new('ShaderNodeTexCoord')
    w = n.new('ShaderNodeTexWave')
    w.inputs['Scale'].default_value = 3.0
    w.inputs['Distortion'].default_value = 12.0
    w.inputs['Detail'].default_value = 6.0
    w.bands_direction = 'Z'
    l.new(tc.outputs['Object'], w.inputs['Vector'])
    r = n.new('ShaderNodeValToRGB')
    r.color_ramp.elements[0].color = M.rgba([c * 0.6 for c in color])
    r.color_ramp.elements[1].color = M.rgba([c * 1.5 for c in color])
    l.new(w.outputs['Fac'], r.inputs['Fac'])
    l.new(r.outputs['Color'], b.inputs['Base Color'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.6
    l.new(w.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def foliage_material(name, color):
    m, n, l = M._new(name)
    b = n.get('Principled BSDF')
    M._set(b, rough=0.75, spec=0.25, sss=0.15, sss_radius=(0.6, 1.0, 0.3), sss_scale=0.05)
    tc = n.new('ShaderNodeTexCoord')
    v = n.new('ShaderNodeTexVoronoi')
    v.inputs['Scale'].default_value = 7.0
    l.new(tc.outputs['Object'], v.inputs['Vector'])
    r = n.new('ShaderNodeValToRGB')
    r.color_ramp.elements[0].color = M.rgba([c * 0.55 for c in color])
    r.color_ramp.elements[1].color = M.rgba([min(1, c * 1.4) for c in color])
    l.new(v.outputs['Distance'], r.inputs['Fac'])
    l.new(r.outputs['Color'], b.inputs['Base Color'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.8
    l.new(v.outputs['Distance'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def stone_material():
    m, n, l = M._new('stone')
    b = n.get('Principled BSDF')
    M._set(b, rough=0.85, spec=0.2)
    tc = n.new('ShaderNodeTexCoord')
    nz = n.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 6
    nz.inputs['Detail'].default_value = 8
    l.new(tc.outputs['Object'], nz.inputs['Vector'])
    r = n.new('ShaderNodeValToRGB')
    r.color_ramp.elements[0].color = (0.05, 0.048, 0.045, 1)
    r.color_ramp.elements[1].color = (0.16, 0.15, 0.13, 1)
    l.new(nz.outputs['Fac'], r.inputs['Fac'])
    l.new(r.outputs['Color'], b.inputs['Base Color'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.5
    l.new(nz.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def ember_material():
    m, n, l = M._new('embers')
    b = n.get('Principled BSDF')
    M._set(b, base=(0.02, 0.015, 0.012, 1), rough=0.9)
    tc = n.new('ShaderNodeTexCoord')
    v = n.new('ShaderNodeTexVoronoi')
    v.inputs['Scale'].default_value = 28
    l.new(tc.outputs['Object'], v.inputs['Vector'])
    r = n.new('ShaderNodeValToRGB')
    e = r.color_ramp.elements
    e[0].position = 0.0
    e[0].color = (1.0, 0.35, 0.06, 1)
    e[1].position = 0.35
    e[1].color = (0.0, 0.0, 0.0, 1)
    l.new(v.outputs['Distance'], r.inputs['Fac'])
    l.new(r.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = 6.0
    return m


def charred_wood_material():
    m, n, l = M._new('charred')
    b = n.get('Principled BSDF')
    M._set(b, base=(0.03, 0.025, 0.02, 1), rough=0.95)
    tc = n.new('ShaderNodeTexCoord')
    v = n.new('ShaderNodeTexVoronoi')
    v.inputs['Scale'].default_value = 40
    l.new(tc.outputs['Object'], v.inputs['Vector'])
    r = n.new('ShaderNodeValToRGB')
    e = r.color_ramp.elements
    e[0].color = (1.0, 0.25, 0.03, 1)
    e[1].position = 0.12
    e[1].color = (0, 0, 0, 1)
    l.new(v.outputs['Distance'], r.inputs['Fac'])
    l.new(r.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = 2.5
    return m


# ------------------------------------------------------------------------------------------------ pieces
def ground(coll, size=120, res=160):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=res, y_segments=res, size=size / 2)
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        r = math.hypot(x, y - 1.5)
        h = 0.18 * math.sin(x * 0.21) * math.sin(y * 0.17) + 0.1 * math.sin(x * 0.53 + y * 0.31)
        h *= min(1.0, max(0.0, (r - 7) / 10))       # flat village floor, gentle rolls outside
        h += max(0.0, r - 24) * 0.06                 # the land rises a little into the forest
        v.co.z = h
    me = _mesh_from_bm('ground', bm)
    _smooth(me)
    return _obj('ground', me, coll, ground_material())


def ground_height(x, y):
    r = math.hypot(x, y - 1.5)
    h = 0.18 * math.sin(x * 0.21) * math.sin(y * 0.17) + 0.1 * math.sin(x * 0.53 + y * 0.31)
    h *= min(1.0, max(0.0, (r - 7) / 10))
    h += max(0.0, r - 24) * 0.06
    return h


def _cone_tree(name, rng, mats):
    """Conifer: tapered trunk + 6-9 stacked drooping cones, slightly irregular."""
    bm = bmesh.new()
    h = rng.uniform(9, 16)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=9, radius1=rng.uniform(0.18, 0.3), radius2=0.03, depth=h,
                          matrix=Matrix.Translation((0, 0, h / 2)))
    trunk_faces = list(bm.faces)
    for f in trunk_faces:
        f.material_index = 0
    layers = rng.integers(6, 10)
    for k in range(layers):
        u = k / layers
        z = h * (0.28 + 0.68 * u)
        rad = (1 - u) * rng.uniform(2.0, 2.8) + 0.35
        depth = h * 0.24 * (1 - 0.4 * u)
        ret = bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=rad, radius2=0.05, depth=depth,
                                    matrix=Matrix.Translation((rng.normal(0, 0.1), rng.normal(0, 0.1), z)))
        for v in ret['verts']:
            v.co.x += rng.normal(0, 0.08) * rad
            v.co.y += rng.normal(0, 0.08) * rad
            if v.co.z < z - depth * 0.3:
                v.co.z -= 0.15 * rad
        for f in {f for v in ret['verts'] for f in v.link_faces}:
            f.material_index = 1
    me = _mesh_from_bm(name, bm)
    _smooth(me)
    for mm in mats:
        me.materials.append(mm)
    return me


def _broad_tree(name, rng, mats):
    bm = bmesh.new()
    h = rng.uniform(5, 9)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=rng.uniform(0.2, 0.35), radius2=0.08, depth=h,
                          matrix=Matrix.Translation((0, 0, h / 2)))
    for k in range(rng.integers(5, 9)):
        c = Vector((rng.normal(0, 1.2), rng.normal(0, 1.2), h * rng.uniform(0.7, 1.05)))
        ret = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=rng.uniform(1.0, 1.8), matrix=Matrix.Translation(c))
        for v in ret['verts']:
            v.co += (v.co - c).normalized() * rng.normal(0, 0.12)
            v.co.z = c.z + (v.co.z - c.z) * 0.8
        for f in {f for v in ret['verts'] for f in v.link_faces}:
            f.material_index = 1
    me = _mesh_from_bm(name, bm)
    _smooth(me)
    for mm in mats:
        me.materials.append(mm)
    return me


def forest(coll, seed=5):
    rng = _rng(seed)
    bark = bark_material()
    pine = foliage_material('pine', (0.022, 0.04, 0.025))
    leaf = foliage_material('leaf', (0.05, 0.065, 0.025))
    protos = [_cone_tree(f'pine_{i}', rng, [bark, pine]) for i in range(4)] + \
             [_broad_tree(f'broad_{i}', rng, [bark, leaf]) for i in range(3)]
    placed = []
    for i in range(300):
        ang = rng.uniform(0, 2 * math.pi)
        # denser and closer behind the village (north), where Aren comes from
        north = max(0.0, math.sin(ang))
        r = rng.uniform(21, 55) - 5.0 * north
        x, y = r * math.cos(ang), 1.5 + r * math.sin(ang)
        if y < -14 and abs(x) < 25:      # keep the camera side (south) open
            continue
        sun_az = math.atan2(SUN_DIR.y, SUN_DIR.x)
        if abs(((ang - sun_az + math.pi) % (2 * math.pi)) - math.pi) < math.radians(13):
            continue                     # a gap toward the rising sun so its light crosses the clearing
        if any((x - px) ** 2 + (y - py) ** 2 < 4.0 for px, py in placed):
            continue
        placed.append((x, y))
        me = protos[int(rng.integers(0, len(protos)))]
        ob = _obj(f'tree_{i}', me, coll)
        ob.location = (x, y, ground_height(x, y) - 0.1)
        ob.rotation_euler = (rng.normal(0, 0.03), rng.normal(0, 0.03), rng.uniform(0, 6.28))
        s = rng.uniform(0.8, 1.25)
        ob.scale = (s, s, s * rng.uniform(0.9, 1.15))
    # a tongue of forest reaching toward the village behind Aren's entry point (north-west)
    for i, (x, y) in enumerate([(-8.6, 9.4), (-7.0, 11.2), (-10.4, 8.0), (-5.6, 12.6), (-9.6, 11.8), (-11.8, 10.2),
                                (-6.8, 13.8), (-4.4, 14.4), (-12.6, 7.0), (-8.2, 14.6)]):
        me = protos[i % 4]
        ob = _obj(f'tree_edge_{i}', me, coll)
        ob.location = (x, y, ground_height(x, y) - 0.1)
        ob.rotation_euler = (0, 0, rng.uniform(0, 6.28))
        s = rng.uniform(0.75, 1.0)
        ob.scale = (s, s, s)
        placed.append((x, y))
    return placed


def shelter(coll, name, pos, yaw, rng, hide_mat, pole_mat, radius=1.8, height=2.0, opening=True):
    """Low dome hut: bent-pole frame under overlapping hide panels, door gap facing local -Y rotated by yaw."""
    grp = []
    bm = bmesh.new()
    n_arcs = 7
    for k in range(n_arcs):
        a = math.pi * k / n_arcs + rng.normal(0, 0.04)
        pts = []
        for j in range(13):
            u = j / 12
            th = math.pi * u
            r = radius * math.cos(th - math.pi / 2) if False else radius
            x = math.cos(th) * radius
            z = math.sin(th) * height * 1.04
            pts.append(Vector((x * math.cos(a), x * math.sin(a), z)))
        for p0, p1 in zip(pts, pts[1:]):
            d = p1 - p0
            bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.03, radius2=0.03, depth=d.length * 1.05,
                                  matrix=Matrix.Translation(p0 + d / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4())
    poles = _obj(name + '_poles', _mesh_from_bm(name + '_poles', bm), coll, pole_mat)
    bm = bmesh.new()
    seg, rings = 48, 14
    verts = []
    door = -math.pi / 2
    for j in range(rings + 1):
        u = j / rings
        th = (math.pi / 2) * u
        row = []
        for k in range(seg):
            a = 2 * math.pi * k / seg
            da = abs(((a - door + math.pi) % (2 * math.pi)) - math.pi)
            if opening and da < 0.38 and u < 0.5:
                row.append(None)
                continue
            r = radius * math.cos(th) * 0.98 + 0.04
            z = height * math.sin(th)
            # panel seams and sag between the arcs
            r += 0.03 * math.cos(a * n_arcs * 2) * math.cos(th) + rng.normal(0, 0.008)
            z += rng.normal(0, 0.006)
            row.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, z)))
        verts.append(row)
    for j in range(rings):
        for k in range(seg):
            q = [verts[j][k], verts[j][(k + 1) % seg], verts[j + 1][(k + 1) % seg], verts[j + 1][k]]
            if all(q):
                bm.faces.new(q)
    cover = _obj(name + '_cover', _mesh_from_bm(name + '_cover', bm), coll, hide_mat)
    _smooth(cover.data)
    s = cover.modifiers.new('Solidify', 'SOLIDIFY')
    s.thickness = 0.015
    for ob in (poles, cover):
        ob.location = pos
        ob.rotation_euler = (0, 0, yaw)
        grp.append(ob)
    return grp


def fire(coll, name, pos, rng, stone, charred, embers, scale=1.0):
    objs = []
    bm = bmesh.new()
    for k in range(11):
        a = 2 * math.pi * k / 11 + rng.normal(0, 0.08)
        c = Vector((math.cos(a) * 0.48 * scale, math.sin(a) * 0.48 * scale, 0.05))
        ret = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=rng.uniform(0.09, 0.14) * scale, matrix=Matrix.Translation(c))
        for v in ret['verts']:
            v.co.z = max(v.co.z, -0.02)
            v.co += (v.co - c) * rng.uniform(-0.15, 0.25)
    st = _obj(name + '_stones', _mesh_from_bm(name + '_stones', bm), coll, stone)
    _smooth(st.data)
    bm = bmesh.new()
    for k in range(5):
        a = 2 * math.pi * k / 5 + rng.normal(0, 0.2)
        d = Vector((math.cos(a), math.sin(a), 0.18 + rng.normal(0, 0.05))).normalized()
        L = rng.uniform(0.45, 0.65) * scale
        c = d * (L / 2) * 0.55 + Vector((0, 0, 0.04))
        bmesh.ops.create_cone(bm, cap_ends=True, segments=7, radius1=0.045 * scale, radius2=0.03 * scale, depth=L,
                              matrix=Matrix.Translation(c) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4())
    logs = _obj(name + '_logs', _mesh_from_bm(name + '_logs', bm), coll, charred)
    _smooth(logs.data)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=0.26 * scale)
    for v in bm.verts:
        v.co.z = max(-0.01, v.co.z * 0.22)
    em = _obj(name + '_embers', _mesh_from_bm(name + '_embers', bm), coll, embers)
    _smooth(em.data)
    for ob in (st, logs, em):
        ob.location = pos
        objs.append(ob)
    L = bpy.data.lights.new(name + '_glow', 'POINT')
    L.energy = 55 * scale
    L.color = (1.0, 0.45, 0.15)
    L.shadow_soft_size = 0.25
    lo = bpy.data.objects.new(name + '_glow', L)
    coll.objects.link(lo)
    lo.location = pos + Vector((0, 0, 0.25))
    objs.append(lo)
    return objs, lo


def smoke(coll, name, pos, height=3.5):
    """Thin rising smoke as a volume column (noise density, drifting with time via the W input)."""
    m, n, l = M._new(name + '_mat')
    out = n.get('Material Output')
    b = n.get('Principled BSDF')
    n.remove(b)
    vol = n.new('ShaderNodeVolumePrincipled')
    vol.inputs['Color'].default_value = (0.55, 0.55, 0.58, 1)
    vol.inputs['Anisotropy'].default_value = 0.5
    tc = n.new('ShaderNodeTexCoord')
    nz = n.new('ShaderNodeTexNoise')
    nz.noise_dimensions = '4D'
    nz.inputs['Scale'].default_value = 2.2
    nz.inputs['Detail'].default_value = 4
    l.new(tc.outputs['Object'], nz.inputs['Vector'])
    drv = nz.inputs['W'].driver_add('default_value')
    drv.driver.expression = 'frame / 48'
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(tc.outputs['Object'], sep.inputs['Vector'])
    # narrow column that widens and thins with height
    rr = n.new('ShaderNodeMath')
    rr.operation = 'MULTIPLY'
    sq = n.new('ShaderNodeVectorMath')
    sq.operation = 'LENGTH'
    cxy = n.new('ShaderNodeCombineXYZ')
    l.new(sep.outputs['X'], cxy.inputs['X'])
    l.new(sep.outputs['Y'], cxy.inputs['Y'])
    l.new(cxy.outputs['Vector'], sq.inputs[0])
    mr = n.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 0.0
    mr.inputs['From Max'].default_value = 0.6
    mr.inputs['To Min'].default_value = 1.0
    mr.inputs['To Max'].default_value = 0.0
    l.new(sq.outputs['Value'], mr.inputs['Value'])
    fz = n.new('ShaderNodeMapRange')
    fz.inputs['From Min'].default_value = 0.0
    fz.inputs['From Max'].default_value = 1.0
    fz.inputs['To Min'].default_value = 0.35
    fz.inputs['To Max'].default_value = 0.0
    l.new(sep.outputs['Z'], fz.inputs['Value'])
    l.new(mr.outputs['Result'], rr.inputs[0])
    l.new(fz.outputs['Result'], rr.inputs[1])
    d2 = n.new('ShaderNodeMath')
    d2.operation = 'MULTIPLY'
    l.new(rr.outputs[0], d2.inputs[0])
    nm = n.new('ShaderNodeMapRange')
    nm.inputs['From Min'].default_value = 0.45
    nm.inputs['From Max'].default_value = 0.75
    l.new(nz.outputs['Fac'], nm.inputs['Value'])
    l.new(nm.outputs['Result'], d2.inputs[1])
    l.new(d2.outputs[0], vol.inputs['Density'])
    l.new(vol.outputs[0], out.inputs['Volume'])
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    me = _mesh_from_bm(name, bm)
    ob = _obj(name, me, coll, m)
    ob.scale = (1.6, 1.6, height)
    ob.location = pos + Vector((0.15, 0.25, height / 2 + 0.2))
    # lean the column with the breeze
    ob.rotation_euler = (math.radians(-6), math.radians(8), 0)
    return ob


def props(coll, rng, hide_mat, pole_mat, stone):
    """Drying rack with hides, log seats, firewood, a basket, a spear rack: enough to read as lived-in."""
    out = []
    # drying rack by the father's shelter
    bm = bmesh.new()
    for x in (-0.9, 0.9):
        for y in (-0.05, 0.05):
            pass
    for x in (-0.9, 0.9):
        bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.035, radius2=0.03, depth=1.7,
                              matrix=Matrix.Translation((x, 0, 0.85)))
    bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.03, radius2=0.03, depth=2.0,
                          matrix=Matrix.Translation((0, 0, 1.62)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    rack = _obj('rack', _mesh_from_bm('rack', bm), coll, pole_mat)
    rack.location = (5.4, 0.2, 0)
    rack.rotation_euler = (0, 0, 1.2)
    out.append(rack)
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=10, y_segments=8, size=0.5)
    for v in bm.verts:
        v.co = Vector((v.co.x * 1.4, 0.03 * math.sin(v.co.x * 9) + rng.normal(0, 0.006), 1.6 - (v.co.y + 0.5) * 1.1))
    hide_ob = _obj('hanging_hide', _mesh_from_bm('hanging_hide', bm), coll, hide_mat)
    hide_ob.location = rack.location
    hide_ob.rotation_euler = rack.rotation_euler
    hide_ob.modifiers.new('Solidify', 'SOLIDIFY').thickness = 0.008
    out.append(hide_ob)
    # log seats and firewood
    bark = bpy.data.materials.get('bark')
    for i, (p, yaw, L) in enumerate([((3.2, -1.6, 0.14), 0.4, 1.3), ((0.9, 0.9, 0.13), 1.9, 1.1),
                                     ((-4.0, 2.4, 0.14), 0.2, 1.4), ((-5.6, 4.6, 0.12), 2.2, 1.0)]):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.15, radius2=0.14, depth=L,
                              matrix=Matrix.Rotation(math.pi / 2, 4, 'Y'))
        lg = _obj(f'log_{i}', _mesh_from_bm(f'log_{i}', bm), coll, bark)
        _smooth(lg.data)
        lg.location = p
        lg.rotation_euler = (0, 0, yaw)
        out.append(lg)
    bm = bmesh.new()
    for k in range(9):
        a = rng.uniform(-0.2, 0.2)
        bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.04, radius2=0.035, depth=rng.uniform(0.7, 1.0),
                              matrix=Matrix.Translation((rng.normal(0, 0.03), (k % 3) * 0.08, 0.05 + (k // 3) * 0.075))
                              @ Matrix.Rotation(math.pi / 2 + a, 4, 'Y'))
    wood = _obj('firewood', _mesh_from_bm('firewood', bm), coll, bark)
    wood.location = (3.1, 1.0, 0)
    wood.rotation_euler = (0, 0, 0.5)
    out.append(wood)
    # spear rack near the hunters' shelter
    bm = bmesh.new()
    for k in range(4):
        a = -0.25 + k * 0.15
        bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.018, radius2=0.012, depth=2.1,
                              matrix=Matrix.Translation((k * 0.12, 0, 1.0)) @ Matrix.Rotation(a, 4, 'Y'))
        bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.025, radius2=0.0, depth=0.14,
                              matrix=Matrix.Translation((k * 0.12 + math.sin(a) * 1.05, 0, 2.1 + 0.07)) @ Matrix.Rotation(a, 4, 'Y'))
    spears = _obj('spears', _mesh_from_bm('spears', bm), coll, pole_mat)
    spears.location = (-1.6, 5.3, 0)
    spears.rotation_euler = (0, 0, 0.3)
    out.append(spears)
    # scattered stones
    bm = bmesh.new()
    for k in range(40):
        ang = rng.uniform(0, 6.28)
        r = rng.uniform(1, 12)
        c = Vector((math.cos(ang) * r, 1.5 + math.sin(ang) * r, 0))
        ret = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rng.uniform(0.04, 0.16), matrix=Matrix.Translation(c))
        for v in ret['verts']:
            v.co.z = max(v.co.z * 0.6, -0.02)
    stones = _obj('stones', _mesh_from_bm('stones', bm), coll, stone)
    out.append(stones)
    return out


def sky_world(sc, sun_dir=SUN_DIR, mist=0.012):
    """Dawn sky gradient (warm at the horizon toward the sun, cool overhead) + thin world mist."""
    w = bpy.data.worlds.new('dawn')
    sc.world = w
    n = w.node_tree.nodes
    l = w.node_tree.links
    bg = n.get('Background')
    tc = n.new('ShaderNodeTexCoord')
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(tc.outputs['Generated'], sep.inputs['Vector'])
    dot = n.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    dot.inputs[1].default_value = sun_dir
    l.new(tc.outputs['Generated'], dot.inputs[0])
    hr = n.new('ShaderNodeValToRGB')
    e = hr.color_ramp.elements
    e[0].position = 0.0
    e[0].color = (0.16, 0.14, 0.14, 1)
    e[1].position = 0.15
    e[1].color = (0.13, 0.17, 0.24, 1)
    e.new(0.5).color = (0.05, 0.08, 0.15, 1)
    l.new(sep.outputs['Z'], hr.inputs['Fac'])
    glow = n.new('ShaderNodeMapRange')
    glow.inputs['From Min'].default_value = 0.6
    glow.inputs['From Max'].default_value = 1.0
    glow.inputs['To Max'].default_value = 1.0
    l.new(dot.outputs['Value'], glow.inputs['Value'])
    mix = n.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'ADD'
    l.new(glow.outputs['Result'], mix.inputs['Factor'])
    l.new(hr.outputs['Color'], mix.inputs[6])
    mix.inputs[7].default_value = (0.9, 0.5, 0.22, 1)
    l.new(mix.outputs[2], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 0.8
    return w   # no world volume: EEVEE treats it as infinite and it swallows the sky; mist is a volume box instead


def ground_mist(coll, center=Vector((0, 6, 0)), size=(110, 100, 7.0), density=0.022):
    """Low mist lying on the ground: a volume box whose density falls off with height."""
    m, n, l = M._new('ground_mist')
    out = n.get('Material Output')
    n.remove(n.get('Principled BSDF'))
    vol = n.new('ShaderNodeVolumePrincipled')
    vol.inputs['Color'].default_value = (0.72, 0.78, 0.88, 1)
    vol.inputs['Anisotropy'].default_value = 0.6
    tc = n.new('ShaderNodeTexCoord')
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(tc.outputs['Generated'], sep.inputs['Vector'])
    fz = n.new('ShaderNodeMapRange')
    fz.inputs['From Min'].default_value = 0.0
    fz.inputs['From Max'].default_value = 1.0
    fz.inputs['To Min'].default_value = density
    fz.inputs['To Max'].default_value = 0.0
    l.new(sep.outputs['Z'], fz.inputs['Value'])
    nz = n.new('ShaderNodeTexNoise')
    nz.noise_dimensions = '4D'
    nz.inputs['Scale'].default_value = 3.0
    drv = nz.inputs['W'].driver_add('default_value')
    drv.driver.expression = 'frame / 400'
    l.new(tc.outputs['Generated'], nz.inputs['Vector'])
    mul = n.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    l.new(fz.outputs['Result'], mul.inputs[0])
    nm = n.new('ShaderNodeMapRange')
    nm.inputs['From Min'].default_value = 0.3
    nm.inputs['From Max'].default_value = 0.7
    nm.inputs['To Min'].default_value = 0.3
    nm.inputs['To Max'].default_value = 1.3
    l.new(nz.outputs['Fac'], nm.inputs['Value'])
    l.new(nm.outputs['Result'], mul.inputs[1])
    l.new(mul.outputs[0], vol.inputs['Density'])
    l.new(vol.outputs[0], out.inputs['Volume'])
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    ob = _obj('ground_mist', _mesh_from_bm('ground_mist', bm), coll, m)
    ob.scale = size
    ob.location = center + Vector((0, 0, size[2] / 2 - 0.05))
    return ob


def lights(coll, sun_dir=SUN_DIR):
    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy = 5.5
    sun.color = (1.0, 0.62, 0.36)
    sun.angle = math.radians(1.5)
    so = bpy.data.objects.new('sun', sun)
    coll.objects.link(so)
    so.rotation_euler = (-sun_dir).to_track_quat('-Z', 'Y').to_euler()
    return so


def build(sc, coll):
    rng = _rng(21)
    ground(coll)
    trees = forest(coll)
    hide_a = M.hide('tent_hide_a', (0.25, 0.17, 0.1), seed=1.0, worn=0.7)
    hide_b = M.hide('tent_hide_b', (0.2, 0.13, 0.08), seed=2.0, worn=0.7)
    pole = bark_material('pole', (0.09, 0.065, 0.045))
    stone = stone_material()
    charred = charred_wood_material()
    embers = ember_material()
    shelters = [
        shelter(coll, 'shelter_father', SHELTER, math.radians(150), rng, hide_a, pole, 2.0, 2.1),
        shelter(coll, 'shelter_w', Vector((-7.2, 6.0, 0)), math.radians(-120), rng, hide_b, pole, 1.8, 1.9),
        shelter(coll, 'shelter_nw', Vector((-2.6, 9.0, 0)), math.radians(170), rng, hide_a, pole, 1.7, 1.8),
        shelter(coll, 'shelter_ne', Vector((5.2, 8.0, 0)), math.radians(160), rng, hide_b, pole, 2.1, 2.2),
        shelter(coll, 'shelter_far', Vector((-10.5, 0.8, 0)), math.radians(-80), rng, hide_a, pole, 1.8, 1.9),
    ]
    f1, glow1 = fire(coll, 'fire_father', FIRE, rng, stone, charred, embers, 1.0)
    f2, glow2 = fire(coll, 'fire_west', FIRE2, rng, stone, charred, embers, 0.8)
    smoke(coll, 'smoke_father', FIRE, 3.2)
    smoke(coll, 'smoke_west', FIRE2, 3.0)
    props(coll, rng, hide_a, pole, stone)
    sky_world(sc)
    ground_mist(coll)
    sun = lights(coll)
    return dict(sun=sun, glow=[glow1, glow2], trees=trees)
