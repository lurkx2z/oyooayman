"""Shared materials (EEVEE and Cycles). Soft stylized skin, wet eyes, matte hide, hair. All procedural, no textures."""
import bpy


def _new(name):
    m = bpy.data.materials.get(name)
    if m:
        bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


def _bsdf(nodes):
    return nodes.get('Principled BSDF')


def _set(b, **kw):
    alias = {'base': 'Base Color', 'rough': 'Roughness', 'metal': 'Metallic', 'spec': 'Specular IOR Level',
             'sss': 'Subsurface Weight', 'sss_radius': 'Subsurface Radius', 'sss_scale': 'Subsurface Scale',
             'coat': 'Coat Weight', 'coat_rough': 'Coat Roughness', 'sheen': 'Sheen Weight', 'sheen_rough': 'Sheen Roughness',
             'sheen_tint': 'Sheen Tint', 'alpha': 'Alpha', 'emit': 'Emission Color', 'emit_strength': 'Emission Strength',
             'normal': 'Normal', 'ior': 'IOR'}
    for k, v in kw.items():
        inp = b.inputs[alias.get(k, k)]
        inp.default_value = v


def rgba(c, a=1.0):
    return (c[0], c[1], c[2], a)


def skin(name, base, flush, dirt=0.0, seed=0.0, hair_color=None):
    """Soft skin: subsurface, mid roughness, colour variation from a flush mask (vertex colour 'flush' when present),
    fine mottling noise and optional dirt patches. Not glossy, not plastic."""
    m, n, l = _new(name)
    b = _bsdf(n)
    _set(b, rough=0.52, spec=0.32, sss=0.18, sss_radius=(1.0, 0.35, 0.18), sss_scale=0.012, sheen=0.15,
         sheen_rough=0.6, sheen_tint=(0.9, 0.75, 0.7, 1))
    tc = n.new('ShaderNodeTexCoord')
    # mottling
    noise = n.new('ShaderNodeTexNoise')
    noise.noise_dimensions = '4D'
    noise.inputs['Scale'].default_value = 180.0
    noise.inputs['Detail'].default_value = 3.0
    noise.inputs['W'].default_value = seed
    l.new(tc.outputs['Object'], noise.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = rgba([c * 0.93 for c in base])
    ramp.color_ramp.elements[1].position = 0.7
    ramp.color_ramp.elements[1].color = rgba([c * 1.04 for c in base])
    l.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    # flush (cheeks, nose, ears, lids) from the 'flush' colour attribute
    attr = n.new('ShaderNodeAttribute')
    attr.attribute_name = 'flush'
    mixf = n.new('ShaderNodeMix')
    mixf.data_type = 'RGBA'
    l.new(attr.outputs['Fac'], mixf.inputs['Factor'])
    l.new(col, mixf.inputs[6])
    mixf.inputs[7].default_value = rgba(flush)
    col = mixf.outputs[2]
    # dark lash line / brows-on-skin from the 'ink' attribute
    ink = n.new('ShaderNodeAttribute')
    ink.attribute_name = 'ink'
    mixi = n.new('ShaderNodeMix')
    mixi.data_type = 'RGBA'
    l.new(ink.outputs['Fac'], mixi.inputs['Factor'])
    l.new(col, mixi.inputs[6])
    mixi.inputs[7].default_value = (0.05, 0.03, 0.025, 1)
    col = mixi.outputs[2]
    if hair_color is not None:
        hp = n.new('ShaderNodeAttribute')
        hp.attribute_name = 'hairpaint'
        dots = n.new('ShaderNodeTexNoise')
        dots.inputs['Scale'].default_value = 900.0
        dots.inputs['Detail'].default_value = 1.0
        l.new(tc.outputs['Object'], dots.inputs['Vector'])
        dr2 = n.new('ShaderNodeMapRange')
        dr2.inputs['From Min'].default_value = 0.35
        dr2.inputs['From Max'].default_value = 0.65
        l.new(dots.outputs['Fac'], dr2.inputs['Value'])
        hm = n.new('ShaderNodeMath')
        hm.operation = 'MULTIPLY'
        l.new(hp.outputs['Fac'], hm.inputs[0])
        l.new(dr2.outputs['Result'], hm.inputs[1])
        hm2 = n.new('ShaderNodeMath')
        hm2.operation = 'MULTIPLY_ADD'
        hm2.inputs[1].default_value = 0.55
        l.new(hm.outputs[0], hm2.inputs[0])
        hm3 = n.new('ShaderNodeMath')
        hm3.operation = 'MULTIPLY'
        hm3.inputs[1].default_value = 0.45
        l.new(hp.outputs['Fac'], hm3.inputs[0])
        l.new(hm3.outputs[0], hm2.inputs[2])
        mixh = n.new('ShaderNodeMix')
        mixh.data_type = 'RGBA'
        l.new(hm2.outputs[0], mixh.inputs['Factor'])
        l.new(col, mixh.inputs[6])
        mixh.inputs[7].default_value = rgba(hair_color)
        col = mixh.outputs[2]
    if dirt > 0:
        dn = n.new('ShaderNodeTexNoise')
        dn.noise_dimensions = '4D'
        dn.inputs['Scale'].default_value = 9.0
        dn.inputs['Detail'].default_value = 6.0
        dn.inputs['Roughness'].default_value = 0.65
        dn.inputs['W'].default_value = seed + 3.1
        l.new(tc.outputs['Object'], dn.inputs['Vector'])
        dr = n.new('ShaderNodeMapRange')
        dr.inputs['From Min'].default_value = 0.52
        dr.inputs['From Max'].default_value = 0.72
        dr.inputs['To Max'].default_value = dirt
        l.new(dn.outputs['Fac'], dr.inputs['Value'])
        dattr = n.new('ShaderNodeAttribute')
        dattr.attribute_name = 'dirt'
        dm = n.new('ShaderNodeMath')
        dm.operation = 'MULTIPLY'
        l.new(dr.outputs['Result'], dm.inputs[0])
        l.new(dattr.outputs['Fac'], dm.inputs[1])
        mixd = n.new('ShaderNodeMix')
        mixd.data_type = 'RGBA'
        mixd.blend_type = 'MULTIPLY'
        l.new(dm.outputs[0], mixd.inputs['Factor'])
        l.new(col, mixd.inputs[6])
        mixd.inputs[7].default_value = (0.45, 0.36, 0.3, 1)
        col = mixd.outputs[2]
    l.new(col, b.inputs['Base Color'])
    # subtle pore bump
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.04
    bump.inputs['Distance'].default_value = 0.0005
    l.new(noise.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def eye(name, iris):
    """Eyeball with sclera, radial-fibre iris, limbal ring, pupil and a clear wet coat. Uses the sphere's UV (v = 1 at
    the front pole)."""
    m, n, l = _new(name)
    b = _bsdf(n)
    _set(b, rough=0.35, spec=0.5, coat=1.0, coat_rough=0.03, sss=0.05)
    uv = n.new('ShaderNodeUVMap')
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(uv.outputs['UV'], sep.inputs['Vector'])
    # polar distance from front pole, 0 at pupil centre
    d = n.new('ShaderNodeMath')
    d.operation = 'SUBTRACT'
    d.inputs[0].default_value = 1.0
    l.new(sep.outputs['Y'], d.inputs[1])
    # radial fibres from u
    fib = n.new('ShaderNodeTexNoise')
    fib.inputs['Scale'].default_value = 3.0
    fib.inputs['Detail'].default_value = 4.0
    comb = n.new('ShaderNodeCombineXYZ')
    mulu = n.new('ShaderNodeMath')
    mulu.operation = 'MULTIPLY'
    mulu.inputs[1].default_value = 60.0
    l.new(sep.outputs['X'], mulu.inputs[0])
    l.new(mulu.outputs[0], comb.inputs['X'])
    l.new(d.outputs[0], comb.inputs['Y'])
    l.new(comb.outputs['Vector'], fib.inputs['Vector'])
    ir = n.new('ShaderNodeValToRGB')
    e = ir.color_ramp.elements
    e[0].position = 0.0
    e[0].color = (0.0, 0.0, 0.0, 1)             # pupil
    e[1].position = 0.085
    e[1].color = (0.0, 0.0, 0.0, 1)
    e.new(0.097).color = rgba([c * 0.8 for c in iris])
    e.new(0.17).color = rgba([min(1, c * 1.8) for c in iris])
    e.new(0.235).color = rgba([c * 0.55 for c in iris])
    e.new(0.255).color = (0.02, 0.015, 0.012, 1)  # limbal ring
    e.new(0.28).color = (0.62, 0.57, 0.53, 1)    # sclera (kept below white so it never glows)
    e.new(0.6).color = (0.60, 0.50, 0.46, 1)
    e.new(0.85).color = (0.55, 0.35, 0.32, 1)    # back of the eye, never seen
    l.new(d.outputs[0], ir.inputs['Fac'])
    mixc = n.new('ShaderNodeMix')
    mixc.data_type = 'RGBA'
    mixc.blend_type = 'MULTIPLY'
    mixc.inputs['Factor'].default_value = 0.35
    l.new(ir.outputs['Color'], mixc.inputs[6])
    l.new(fib.outputs['Color'], mixc.inputs[7])
    l.new(mixc.outputs[2], b.inputs['Base Color'])
    return m


def simple(name, base, rough=0.8, spec=0.2, sheen=0.0, sss=0.0, alpha=1.0):
    m, n, l = _new(name)
    b = _bsdf(n)
    _set(b, base=rgba(base), rough=rough, spec=spec, sheen=sheen, sss=sss, alpha=alpha)
    return m


def hair(name, color, rough=0.62, sheen=0.25):
    """Dark hair with per-clump value jitter (attribute 'shade' in -1..1) and a soft sheen."""
    m, n, l = _new(name)
    b = _bsdf(n)
    _set(b, rough=rough, spec=0.3, sheen=sheen, sheen_rough=0.4, sheen_tint=(0.7, 0.55, 0.45, 1))
    attr = n.new('ShaderNodeAttribute')
    attr.attribute_name = 'shade'
    mr = n.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = -1
    mr.inputs['From Max'].default_value = 1
    mr.inputs['To Min'].default_value = 0.8
    mr.inputs['To Max'].default_value = 1.25
    l.new(attr.outputs['Fac'], mr.inputs['Value'])
    mul = n.new('ShaderNodeMix')
    mul.data_type = 'RGBA'
    mul.blend_type = 'MULTIPLY'
    mul.inputs['Factor'].default_value = 1.0
    mul.inputs[6].default_value = rgba(color)
    comb = n.new('ShaderNodeCombineColor')
    for k in ('Red', 'Green', 'Blue'):
        l.new(mr.outputs['Result'], comb.inputs[k])
    l.new(comb.outputs['Color'], mul.inputs[7])
    l.new(mul.outputs[2], b.inputs['Base Color'])
    return m


def hide(name, color, seed=0.0, stain_color=(0.11, 0.035, 0.025), mud_color=(0.12, 0.09, 0.06), worn=0.5):
    """Tanned hide / leather: blotchy value variation, creases (bump), matte with a faint sheen. Reads float
    attributes 'stain' (old blood) and 'mud' (hem grime) when the mesh has them."""
    m, n, l = _new(name)
    b = _bsdf(n)
    _set(b, rough=0.78, spec=0.25, sheen=0.25, sheen_rough=0.6, sheen_tint=(0.8, 0.7, 0.6, 1))
    tc = n.new('ShaderNodeTexCoord')
    nz = n.new('ShaderNodeTexNoise')
    nz.noise_dimensions = '4D'
    nz.inputs['Scale'].default_value = 14.0
    nz.inputs['Detail'].default_value = 8.0
    nz.inputs['Roughness'].default_value = 0.6
    nz.inputs['W'].default_value = seed
    l.new(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.3
    ramp.color_ramp.elements[0].color = rgba([c * (1 - 0.35 * worn) for c in color])
    ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[1].color = rgba([min(1, c * (1 + 0.3 * worn)) for c in color])
    l.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    for attr_name, c, sharp in (('mud', mud_color, 0.25), ('stain', stain_color, 0.15)):
        at = n.new('ShaderNodeAttribute')
        at.attribute_name = attr_name
        sn = n.new('ShaderNodeTexNoise')
        sn.inputs['Scale'].default_value = 22.0
        sn.inputs['Detail'].default_value = 6.0
        l.new(tc.outputs['Object'], sn.inputs['Vector'])
        mm = n.new('ShaderNodeMath')
        mm.operation = 'MULTIPLY_ADD'
        mm.inputs[1].default_value = 1.4
        mm.inputs[2].default_value = -0.45
        l.new(sn.outputs['Fac'], mm.inputs[0])
        mul = n.new('ShaderNodeMath')
        mul.operation = 'MULTIPLY'
        mul.use_clamp = True
        l.new(at.outputs['Fac'], mul.inputs[0])
        l.new(mm.outputs[0], mul.inputs[1])
        mix = n.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        l.new(mul.outputs[0], mix.inputs['Factor'])
        l.new(col, mix.inputs[6])
        mix.inputs[7].default_value = rgba(c)
        col = mix.outputs[2]
    l.new(col, b.inputs['Base Color'])
    crease = n.new('ShaderNodeTexWave')
    crease.wave_type = 'BANDS'
    crease.inputs['Scale'].default_value = 9.0
    crease.inputs['Distortion'].default_value = 9.0
    crease.inputs['Detail'].default_value = 4.0
    l.new(tc.outputs['Object'], crease.inputs['Vector'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.25
    bump.inputs['Distance'].default_value = 0.002
    l.new(crease.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def fur(name, color, seed=0.0):
    m, n, l = _new(name)
    b = _bsdf(n)
    _set(b, rough=0.85, spec=0.2, sheen=0.8, sheen_rough=0.45, sheen_tint=(0.9, 0.8, 0.7, 1))
    tc = n.new('ShaderNodeTexCoord')
    nz = n.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 40.0
    nz.inputs['Detail'].default_value = 10.0
    l.new(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = rgba([c * 0.55 for c in color])
    ramp.color_ramp.elements[1].color = rgba([min(1, c * 1.35) for c in color])
    l.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    attr = n.new('ShaderNodeAttribute')
    attr.attribute_name = 'shade'
    mix = n.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 0.4
    l.new(ramp.outputs['Color'], mix.inputs[6])
    l.new(attr.outputs['Color'], mix.inputs[7])
    l.new(ramp.outputs['Color'], b.inputs['Base Color'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.6
    bump.inputs['Distance'].default_value = 0.003
    l.new(nz.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def rope(name, color):
    m, n, l = _new(name)
    b = _bsdf(n)
    _set(b, base=rgba(color), rough=0.9, spec=0.15, sheen=0.4)
    tc = n.new('ShaderNodeTexCoord')
    w = n.new('ShaderNodeTexWave')
    w.inputs['Scale'].default_value = 60.0
    w.inputs['Distortion'].default_value = 2.0
    l.new(tc.outputs['Object'], w.inputs['Vector'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.5
    l.new(w.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m
