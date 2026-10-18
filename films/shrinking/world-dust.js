/* =====================================================================
   WORLD · DUST (122.4 → 233 s, micrometres) — the floor next to your phone, from a quarter of a millimetre to below
   the wavelength of light. Origin = where you land; the axes are the bedroom's (−z towards the window wall).
     the end of the fall · look up: the phone is a metal cliff, the bedroom a sky · skin flakes, grit, fibres
     a dust mite comes · the spilled water arrives and the mite is caught in it · a hair · the air turns to syrup
     pollen lands · you stand on a flake of your own skin; bacteria live on it · Brownian shoves · colour fades
   ===================================================================== */

const SH_DU = { flake: [-262, 0, -122], col: [-250, 3.2, -128], hairX: -430, cliffZ: -4200, flakeTop: 3.2 };
// where you are (µm): floor position keys [t, x, z]; look keys [t, yaw, pitch] (yaw 0 = towards the phone, + = left)
const SH_DU_POS = [[121.1, 0, 0], [160, 0, 0], [168, 0, 0], [174, -40, -20], [178, -110, -50], [186, -190, -95], [190, -228, -115], [194, -243, -124],
  [200, -248.5, -126.5], [215, -249.6, -127.6], [233, -250, -128]];
const SH_DU_DIR = [
  [121.1, 0.4, -1.05], [124.4, 0.2, -1.38], [125.6, 0.35, -0.6], [127.6, 0.3, -0.05], [129.0, 0.2, 0.15], [131.5, 0.12, 0.92], [133.2, 0.6, 0.85],
  [135.6, 2.3, 0.42], [137.4, 3.0, 0.3], [139.4, 3.05, -0.22], [142.0, 2.75, -0.42], [144.5, 2.6, -0.35], [147.0, 3.25, -0.05],
  [160.0, 3.4, -0.1], [161.5, 4.75, -0.12], [173.5, 4.7, -0.1], [175.0, 7.7, -0.05], [178.5, 7.75, -0.05], [180.0, 7.45, 0.02],
  [186.0, 7.2, -0.05], [188.5, 7.0, 0.32], [191.5, 7.05, 0.05], [194.0, 7.0, -0.95], [197.0, 7.1, -0.5], [200.0, 6.85, -0.38], [204.5, 6.4, -0.3],
  [209.0, 7.3, -0.25], [214.0, 7.0, -0.2], [223.0, 6.6, -0.25], [233.0, 6.55, -0.2],
];
// the mite: [t, x, z] (it faces the way it walks)
const SH_DU_MITE = [[140, 700, 4200], [145, 560, 3000], [152, 270, 1050], [156.5, 150, 570], [158.5, 175, 478], [163, 430, 470], [166, 590, 470], [233, 605, 470]];
// the water's front (µm along +x; the line wanders by shDuFront(z))
const SH_DU_WATER = [[150, 6500], [157, 2200], [161, 900], [164, 520], [166, 410], [172, 300], [180, 250], [233, 235]];
const shDuFrontOff = (z) => 250 * Math.sin(z / 2600) + 120 * Math.sin(z / 900 + 1);

function shDustCam(t, h) {
  const [x, z] = shSpline(SH_DU_POS, t);
  let ground = SH_DU.flakeTop * shE(t, 187.0, 189.8);
  let y;
  if (t < SH.floor) {
    // the last of the fall (slow motion): from 5.4 mm up to your feet
    const u = MathX.clamp((t - 121.1) / (SH.floor - 121.1), 0, 1);
    y = 0.93 * h + (5400 - 0.93 * h) * (1 - (u * u * 0.75 + u * 0.25));
  } else {
    const land = MathX.impulse(t, SH.floor, 0.4) * 0.45;
    y = ground + h * (0.93 - land);
  }
  let [yw, pt] = shKey(SH_DU_DIR, t);
  let roll = t < SH.floor + 0.5 ? Math.sin((t - 117.6) * 0.66) * 0.18 * (1 - shE(t, 123.5, 125)) : 0;
  const p = [x, y, z];
  // Brownian shoves: the air's molecules hit you unevenly (stronger as you shrink)
  const bk = shE(t, SH.brown - 0.5, SH.brown + 2.5) * (1 + 0.6 * shE(t, 222, 233));
  if (bk > 0) {
    const kick = (sd) => noise1(t * 2.6, sd) * 0.22 + noise1(t * 6.1, sd + 3) * 0.1 + Math.max(0, noise1(t * 1.3, sd + 9)) * 0.25 * Math.sin(t * 9 + sd);
    p[0] += kick(1) * h * bk; p[1] += kick(4) * h * bk * 0.5; p[2] += kick(7) * h * bk;
    yw += kick(11) * 0.09 * bk; pt += kick(13) * 0.06 * bk; roll += kick(17) * 0.08 * bk;
  }
  return { p, yaw: yw, pitch: pt, roll };
}

// ---- the dust mite: an oval body with fine ridges, mouthparts, eight short legs, long hairs
function shBuildMite(parent) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mat = shProcStd({ key: 'mite', mat: { color: '#e6d6b6', roughness: 0.5, emissive: '#3a2a18', emissiveIntensity: 0.25 }, glsl: /* glsl */`
    float procH(vec3 p, float pix){ float r = length(p.xz * vec2(1.0, 0.62)) + p.y * 0.35;
      return (0.8 * sin(r * 0.42 + shVN(p.xz * 0.02) * 7.0) + 0.3 * sin(r * 1.3 + p.x * 0.2)) * shLod(7.0, pix); }
    vec3 procC(vec3 p, float pix, vec3 b){ float r = length(p.xz * vec2(1.0, 0.62)); return b * (0.92 + 0.08 * sin(r * 0.42 + shVN(p.xz * 0.02) * 7.0)) * (0.9 + 0.1 * shVN(p.xz * 0.05)); }` });
  const legM = shStd('#c9ad86', 0.55);
  // body (half-sizes 100 × 72 × 150 µm), a waist groove a third of the way back
  const bg = new THREE.SphereGeometry(1, 48, 32), bp = bg.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    let x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
    const waist = 1 - 0.07 * Math.exp(-Math.pow((z - 0.32) * 7, 2));
    if (y < 0) y *= 0.6;
    bp.setXYZ(i, x * 100 * waist, y * 72 * waist + 6, z * 150);
  }
  bg.computeVertexNormals();
  const bm = new THREE.Mesh(bg, mat); bm.castShadow = bm.receiveShadow = true; body.add(bm);
  // the mouthparts: a blunt snout with two chelicerae and palps
  const snout = new THREE.Mesh(new THREE.SphereGeometry(30, 20, 14).scale(1, 0.75, 1.3), mat); snout.position.set(0, -6, 160); snout.castShadow = true; body.add(snout);
  for (const sx of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.CapsuleGeometry(9, 30, 4, 10).rotateX(Math.PI / 2), legM); c.position.set(sx * 11, -4, 190); body.add(c);
    const pl = new THREE.Mesh(new THREE.CapsuleGeometry(7, 34, 4, 8).rotateX(Math.PI / 2 - 0.4), legM); pl.position.set(sx * 30, -16, 180); pl.rotation.y = sx * 0.4; body.add(pl);
  }
  // legs: [x, y, z attach, base yaw (outward/forward), lengths]
  const L = [[0.8, -26, 105, 0.55], [0.85, -28, 62, 0.95], [0.85, -28, -30, 2.0], [0.75, -26, -80, 2.45]];
  const legs = [];
  for (const [ax, ay, az, yaw] of L) for (const sx of [-1, 1]) {
    const base = new THREE.Group(); base.position.set(sx * ax * 100, ay, az); base.rotation.order = 'YZX'; body.add(base);
    const segs = [], lens = [44, 40, 34, 30], rads = [14, 11.5, 9.5, 7.5];
    let par = base;
    lens.forEach((ln, k) => {
      const j = new THREE.Group(); if (k) j.position.x = lens[k - 1]; par.add(j);
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(rads[k], ln, 4, 10).rotateZ(Math.PI / 2).translate(ln / 2, 0, 0), k ? legM : mat); m.castShadow = true; j.add(m);
      // a few stiff hairs on each segment
      if (k > 0) for (let q = 0; q < 2; q++) { const hs = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.4, 40, 4).translate(0, 20, 0), legM); hs.position.x = ln * (0.4 + q * 0.4); hs.rotation.set(0.3 * (q ? 1 : -1), 0, -0.9); j.add(hs); }
      segs.push(j); par = j;
    });
    // the leg's sucker
    const pv = new THREE.Mesh(new THREE.SphereGeometry(7, 10, 8).scale(1, 0.5, 1), legM); pv.position.x = 30; segs[3].add(pv);
    base.userData = { sx, yaw: sx > 0 ? Math.PI / 2 - yaw : -(Math.PI / 2 - yaw), seg: segs };
    legs.push(base);
  }
  // long hairs on the back and the rear
  const hairM = shStd('#d8c8a8', 0.5);
  const hr = new RNG(23);
  for (let k = 0; k < 12; k++) {
    const a = hr.range(-1, 1), z0 = hr.range(-140, 40), side = k % 2 ? 1 : -1;
    const pts = [], len = hr.range(120, 260);
    for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new THREE.Vector3(side * (40 + u * len * 0.5) * Math.abs(a) + side * 10, 60 + u * len * 0.25 - u * u * len * 0.3, z0 - u * len * 0.8)); }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 1.8, 5), hairM); m.castShadow = true; body.add(m);
  }
  parent.add(g);
  return {
    g, body, legs,
    // walk (phase in cycles; amount 0..1) and struggle (0..1, front legs held in the water, the rest flailing)
    pose(t, phase, walk, stuck) {
      legs.forEach((b, i) => {
        const { sx, yaw, seg } = b.userData, pair = i >> 1, odd = (pair + (sx > 0 ? 0 : 1)) % 2;
        const ph = phase * Math.PI * 2 + odd * Math.PI;
        let swing = Math.sin(ph) * 0.38 * walk, lift = Math.max(0, Math.cos(ph)) * 0.35 * walk;
        if (stuck > 0) {
          const fl = pair < 2 ? 0.15 : 1;
          swing = swing * (1 - stuck) + stuck * fl * 0.5 * Math.sin(t * (7 + i) + i * 1.7);
          lift = lift * (1 - stuck) + stuck * fl * Math.max(0, Math.sin(t * (5 + i * 0.7) + i)) * 0.6;
        }
        b.rotation.set(0, yaw + swing * (sx > 0 ? 1 : -1), 0);
        b.rotation.z = 0.35 + lift;
        seg[1].rotation.z = -0.75 - lift * 0.4; seg[2].rotation.z = -0.55; seg[3].rotation.z = -0.35;
        if (sx < 0) { b.rotation.z = Math.PI - (0.35 + lift); seg[1].rotation.z = 0.75 + lift * 0.4; seg[2].rotation.z = 0.55; seg[3].rotation.z = 0.35; }
      });
    },
  };
}

// a cloud of floating specks in size bands (each band spread wider the bigger its specks), so there are always
// specks around you of about your size: a speck stays its real size as you shrink past it
function shMotes(parent, bands, o = {}) {
  const N = o.n || 220, total = bands.length * N;
  const pos = new Float32Array(total * 3), size = new Float32Array(total), seed = new Float32Array(total);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uS: { value: 1 }, uPx: { value: 540 }, uOp: { value: o.opacity ?? 0.6 }, uCol: { value: new THREE.Color(o.color || '#f2e2c8') }, uFar: { value: 60 } },
    transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */`
      attribute float size; attribute float seed; uniform float uS, uPx, uFar; varying float vA; varying float vSeed;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = -mv.z;
        gl_PointSize = clamp(size * uS * uPx / max(d, 1e-4), 0.0, 220.0);
        vA = smoothstep(0.25, 0.9, d) * (1.0 - smoothstep(uFar * 0.5, uFar, d)) * smoothstep(0.6, 2.0, gl_PointSize);
        vSeed = seed; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform float uOp; uniform vec3 uCol; varying float vA; varying float vSeed;
      void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
        float a = (1.0 - r) * (1.0 - r) * uOp * vA; gl_FragColor = vec4(uCol * (0.75 + 0.5 * vSeed), a); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 5; parent.add(pts);
  const base = [];
  bands.forEach((b, k) => { for (let i = 0; i < N; i++) { const j = k * N + i; base.push([hash1(j * 7 + 1), hash1(j * 7 + 2), hash1(j * 7 + 3), hash1(j * 7 + 4)]); size[j] = b.s * (0.6 + 0.8 * hash1(j * 7 + 5)); seed[j] = hash1(j * 7 + 6); } });
  return {
    pts, mat,
    // c = the centre (world units), h = your height; each band fills a box ±R around c that drifts with the air
    update(t, c, h, s, px, extra) {
      mat.uniforms.uS.value = s; mat.uniforms.uPx.value = px;
      bands.forEach((b, k) => {
        const R = b.R, wind = [t * b.v, t * b.v * 0.3, -t * b.v * 0.6];
        for (let i = 0; i < N; i++) {
          const j = k * N + i, q = base[j];
          const wrap = (u, w, cc) => { const span = 2 * R; let x = (u * span + w - (cc - R)) % span; if (x < 0) x += span; return cc - R + x; };
          let x = wrap(q[0], wind[0], c[0]), y = Math.abs(wrap(q[1], wind[1], c[1])), z = wrap(q[2], wind[2], c[2]);
          if (b.brown) { const a = b.brown; x += noise1(t * 3.1 + j, 1) * a; y += noise1(t * 2.7 + j, 2) * a * 0.6; z += noise1(t * 3.3 + j, 3) * a; }
          if (extra) { const d = extra(x, y, z, j); x += d[0]; y += d[1]; z += d[2]; }
          pos[j * 3] = x; pos[j * 3 + 1] = Math.max(b.s * 0.5, y); pos[j * 3 + 2] = z;
        }
      });
      g.attributes.position.needsUpdate = true;
    },
  };
}

// the bedroom seen from the floor where you land: the room world set to that moment and rendered into a cube map
// (without the phone, which this world builds as a metal cliff). The axes are shared, so it needs no turning.
function shRoomBackdrop(app) {
  const room = app.worlds.room, t0 = SH.floor - 0.01;
  room.frame(t0, shH(t0), app);
  const pv = room.phone.g.visible, hv = room.hands.root.visible;
  room.phone.g.visible = false; room.hands.root.visible = false;
  const rt = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const cc = new THREE.CubeCamera(0.3, 60000, rt);
  cc.position.copy(room.camera.position); room.scene.add(cc);
  // the lamp's light bouncing off the floor: lets you see the furniture's undersides from down here
  const bounce = new THREE.HemisphereLight('#1c1c26', '#b8835c', 2.2); room.scene.add(bounce);
  cc.update(app.renderer, room.scene);
  room.scene.remove(cc, bounce); bounce.dispose();
  room.phone.g.visible = pv; room.hands.root.visible = hv;
  const pm = new THREE.PMREMGenerator(app.renderer), env = pm.fromCubemap(rt.texture).texture; pm.dispose();
  return { bg: rt.texture, env };
}

SH_WORLDS.dust = (app) => {
  const W = shMakeWorld(60), R = W.root, rng = new RNG(1234);
  W.scene.fog = new THREE.FogExp2('#3a2e28', 0.0022);
  W.scene.environment = shEnv(app.renderer, '#4a4250', '#6e5442', '#2a1c14');
  W.scene.environmentIntensity = 0.6;
  // ---- the sky: your bedroom itself, rendered once from where you land (see shRoomBackdrop)
  let backdrop = null;

  // ---- the floor: varnished oak, procedural down to a fraction of a micrometre
  const groundM = shProcStd({ key: 'dustGround', mat: { color: '#94704f', roughness: 0.36, envMapIntensity: 0.7 }, glsl: /* glsl */`
    float procH(vec3 p, float pix){
      float h = 0.0, a = 9.0, f = 1.0 / 160.0;
      for (int i = 0; i < 11; i++) { vec2 q = p.xz * f; if (i < 5) q.y *= 0.22; h += a * (shVN(q + float(i) * 7.1) - 0.5) * shLod(0.5 / f, pix); f *= 2.03; a *= 0.52; }
      return h;
    }
    vec3 procC(vec3 p, float pix, vec3 b){
      float fib = shVN(p.xz * vec2(1.0 / 60.0, 1.0 / 900.0)), pore = smoothstep(0.78, 0.92, shVN(p.xz * vec2(1.0 / 25.0, 1.0 / 140.0)));
      // where the spilled water has soaked in: darker, glossier wood
      float wx = uWX + 250.0 * sin(p.z / 2600.0) + 120.0 * sin(p.z / 900.0 + 1.0), wet = smoothstep(wx - 3.0, wx + 14.0, p.x);
      return b * (0.82 + 0.3 * fib) * (1.0 - 0.35 * pore) * (0.93 + 0.07 * shVN(p.xz * 0.3)) * mix(1.0, 0.55, wet);
    }`, uniforms: { uWX: { value: 1e9 } } });
  const ground = new THREE.Mesh(shPolarGround(600000, 0.3, SH_DU.col[0], SH_DU.col[2]), groundM);   // (finest where you end up)
  ground.receiveShadow = true; R.add(ground);

  // ---- the phone: a metal cliff 7.8 mm high, 4.2 mm away, with the buttons and the screen's glow over the top
  const metal = shProcStd({ key: 'dustMetal', mat: { color: '#7a7d84', roughness: 0.3, metalness: 0.9 }, glsl: /* glsl */`
    float procH(vec3 p, float pix){ return (shVN(vec2(p.x * 0.002, p.y * 0.9)) - 0.5) * 2.0 * shLod(2.0, pix) + (shVN(vec2(p.x * 0.01, p.y * 6.0)) - 0.5) * 0.4 * shLod(0.3, pix); }
    vec3 procC(vec3 p, float pix, vec3 b){ return b * (0.9 + 0.12 * shVN(vec2(p.x * 0.0005, p.y * 0.4))); }` });
  const cz = SH_DU.cliffZ, cliff = new THREE.Group(); R.add(cliff);
  { const wall = new THREE.Mesh(new THREE.BoxGeometry(160000, 7000, 3000), metal); wall.position.set(0, 3500, cz - 1500); wall.receiveShadow = true; cliff.add(wall);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(900, 900, 160000, 40, 1).rotateZ(Math.PI / 2), metal); rim.position.set(0, 6950, cz - 900); cliff.add(rim);
    for (const [x, w] of [[-5200, 6000], [2600, 6000], [16000, 9000]]) { const b = new THREE.Mesh(shRoundBox(w, 2600, 700, 300, 120, 2), metal); b.position.set(x, 2300, cz + 50); cliff.add(b); }
    // the screen's light spilling over the edge (green while it rings)
    const glowM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { c: { value: new THREE.Color('#58ff9a') }, k: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 c; uniform float k; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 2.2) * smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x); gl_FragColor = vec4(c * a * k, 1.0); }' });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(160000, 9000), glowM); glow.position.set(0, 7800 + 4500, cz - 1200); cliff.add(glow); cliff.userData.glow = glowM; }

  // ---- skin flakes, grit and fibres on the floor
  const flakeM = shProcStd({ key: 'flake', mat: { color: '#efe2cc', roughness: 0.62, emissive: '#3b2e22', emissiveIntensity: 0.35 }, glsl: /* glsl */`
    float procH(vec3 p, float pix){
      vec2 c = shCell(p.xz / 28.0); float edge = 1.0 - smoothstep(0.0, 0.12, c.y - c.x);
      float h = edge * 0.6 * shLod(3.0, pix);
      h += (shVN(p.xz * 0.35) - 0.5) * 0.25 * shLod(1.5, pix) + (shVN(p.xz * 2.2) - 0.5) * 0.06 * shLod(0.25, pix) + (shVN(p.xz * 9.0) - 0.5) * 0.02 * shLod(0.06, pix);
      return h;
    }
    vec3 procC(vec3 p, float pix, vec3 b){ vec2 c = shCell(p.xz / 28.0); float edge = 1.0 - smoothstep(0.0, 0.1, c.y - c.x);
      return b * (0.9 + 0.12 * shHash(floor(p.xz / 28.0 + 0.5))) * (1.0 - 0.18 * edge); }` });
  const flakeGeo = (Rr, seed, thick) => {
    const r = new RNG(seed), sh = new THREE.Shape(), n = 16;
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, rr = Rr * (0.75 + 0.45 * r.next()) * (1 + 0.15 * Math.sin(a * 3 + seed)); const x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.8; if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y); }
    const gg = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.25, bevelSize: thick * 0.4, bevelSegments: 2, curveSegments: 4 });
    gg.rotateX(-Math.PI / 2);
    const p = gg.attributes.position, curl = r.range(0.0006, 0.002);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, p.getY(i) + curl * (x * x + z * z) / Rr * 2); }
    gg.computeVertexNormals();
    return gg;
  };
  const flakes = new Batcher();
  for (let i = 0; i < 70; i++) {
    const a = rng.range(0, 6.283), d = 220 + Math.pow(rng.next(), 0.7) * 3200, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < cz + 400) continue;
    const Rr = rng.range(25, 75) * (d > 1500 ? 1.4 : 1);
    flakes.add(flakeGeo(Rr, i + 10, rng.range(2, 4)), flakeM, Geo.matrix(x, 0.5, z, rng.range(-0.08, 0.08), rng.range(0, 6.3), rng.range(-0.08, 0.08)));
  }
  flakes.build(R, 'flakes').forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  // the big flake you will stand on
  const myFlake = new THREE.Mesh(flakeGeo(92, 999, 2.6), flakeM); myFlake.position.set(SH_DU.flake[0], 0.3, SH_DU.flake[2]); myFlake.rotation.y = 0.6; myFlake.castShadow = myFlake.receiveShadow = true; R.add(myFlake);
  // grit: angular grains
  const gritM = shProcStd({ key: 'grit', mat: { color: '#9a8f82', roughness: 0.8 }, glsl: /* glsl */`
    float procH(vec3 p, float pix){ return (shVN3(p * 0.15) - 0.5) * 3.0 * shLod(4.0, pix) + (shVN3(p * 0.8) - 0.5) * 0.6 * shLod(0.8, pix) + (shVN3(p * 4.0) - 0.5) * 0.1 * shLod(0.15, pix); }
    vec3 procC(vec3 p, float pix, vec3 b){ return b * (0.75 + 0.45 * shVN3(p * 0.05)); }` });
  const grits = new Batcher();
  for (let i = 0; i < 90; i++) {
    const a = rng.range(0, 6.283), d = 160 + Math.pow(rng.next(), 0.8) * 3500, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < cz + 300) continue;
    if (Math.hypot(x - SH_DU.col[0], z - SH_DU.col[2]) < 140) continue;
    const s = rng.range(6, 45) * (d > 1500 ? 1.6 : 1), gg = new THREE.DodecahedronGeometry(s, 0), p = gg.attributes.position;
    for (let k = 0; k < p.count; k++) { const f = 0.8 + 0.4 * hash1(Math.round(p.getX(k) * 13 + p.getY(k) * 7 + p.getZ(k) * 3) + i); p.setXYZ(k, p.getX(k) * f, p.getY(k) * f * 0.7, p.getZ(k) * f); }
    gg.computeVertexNormals();
    grits.add(gg, gritM, Geo.matrix(x, s * 0.3, z, rng.range(0, 3), rng.range(0, 3), rng.range(0, 3)), { color: new THREE.Color().setHSL(0.08 + rng.range(-0.03, 0.04), rng.range(0.05, 0.3), rng.range(0.35, 0.7)) });
  }
  gritM.vertexColors = true;
  grits.build(R, 'grit').forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  // fibres: flat twisted ribbons (cotton), blue, white and red
  for (const [x0, z0, a0, len, col] of [[900, 1600, 2.4, 5200, '#3c6db3'], [-1500, 900, 0.5, 4200, '#ebe6dc'], [400, -1800, 1.1, 3800, '#b94848'], [-800, 2600, 2.9, 4600, '#ebe6dc'], [2200, 400, 1.9, 3600, '#3c6db3']]) {
    const rings = [], n = 90;
    for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + Math.sin(u * 3 + x0) * 0.6, tw = u * 26; rings.push([x0 + Math.cos(a) * u * len, 6 + 4 * Math.abs(Math.sin(tw)), z0 + Math.sin(a) * u * len, 4 + 8 * Math.abs(Math.cos(tw)), 2 + 3 * Math.abs(Math.sin(tw))]); }
    const m = new THREE.Mesh(shLoft(rings, 8, 0.5), shStd(col, 0.7)); m.castShadow = m.receiveShadow = true; R.add(m);
  }
  // a hair: a 70 µm log lying across the floor, its surface overlapping scales
  const hairM = shProcStd({ key: 'hair', mat: { color: '#6b4a30', roughness: 0.34, envMapIntensity: 1.0 }, glsl: /* glsl */`
    float procH(vec3 p, float pix){ float e = fract((p.z + 1.6 * sin(p.y * 0.18) + 1.6 * sin(p.x * 0.17)) / 7.5); return 0.9 * smoothstep(0.0, 0.85, e) * shLod(2.0, pix) + (shVN(p.yz * vec2(0.4, 0.05)) - 0.5) * 0.3 * shLod(1.0, pix); }
    vec3 procC(vec3 p, float pix, vec3 b){ float e = fract((p.z + 1.6 * sin(p.y * 0.18) + 1.6 * sin(p.x * 0.17)) / 7.5); return b * (0.85 + 0.25 * smoothstep(0.7, 1.0, e)); }` });
  { const hg = new THREE.CylinderGeometry(35, 35, 50000, 48, 260, true).rotateX(Math.PI / 2), p = hg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + SH_DU.hairX + 400 * Math.sin(p.getZ(i) / 9000)), p.setY(i, p.getY(i) + 35);
    hg.computeVertexNormals();
    const hm = new THREE.Mesh(hg, hairM); hm.castShadow = hm.receiveShadow = true; R.add(hm); }

  // ---- the spilled water: a glassy hill with a rounded front, creeping in from the right
  const waterM = new THREE.MeshPhysicalMaterial({ color: '#f2faff', roughness: 0.05, metalness: 0, transmission: 1, thickness: 900, ior: 1.33, attenuationColor: new THREE.Color('#7fb6d0'), attenuationDistance: 3500, envMapIntensity: 3.0, specularIntensity: 1 });
  // a glassy rim where the surface turns away from you (reads as liquid against the floor)
  waterM.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float nv = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0); totalEmissiveRadiance += vec3(0.42, 0.52, 0.62) * pow(1.0 - nv, 2.2) + vec3(0.03, 0.05, 0.07); }`); };
  waterM.customProgramCacheKey = () => 'shwater';
  const water = new THREE.Group(); R.add(water);
  { const xs = [0, 12, 30, 60, 100, 160, 240, 340, 470, 640, 860, 1150, 1550, 2100, 3000, 4500, 7000, 12000, 24000], nz = 121, Z0 = -24000, Z1 = 24000;
    const pos = [], idx = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < xs.length; i++) {
      const z = Z0 + (Z1 - Z0) * j / (nz - 1), x = xs[i] + shDuFrontOff(z);
      pos.push(x, 1300 * (1 - Math.exp(-xs[i] / 750)) * (1 - 0.15 * Math.exp(-xs[i] / 60)) + 0.5, z);
    }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < xs.length - 1; i++) { const a = j * xs.length + i, b = a + 1, c = a + xs.length + 1, d = a + xs.length; idx.push(a, d, b, b, d, c); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setIndex(idx); wg.computeVertexNormals();
    const wm = new THREE.Mesh(wg, waterM); wm.receiveShadow = true; water.add(wm);
    // the waterline: the meniscus at the edge catches the light in a bright thread
    const line = []; for (let j = 0; j <= 400; j++) { const z = -9000 + 18000 * j / 400; line.push(new THREE.Vector3(shDuFrontOff(z) + 2.5, 2.2, z)); }
    const ml = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line), 1600, 2.6, 6), new THREE.MeshBasicMaterial({ color: '#fff3e0', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    water.add(ml); }

  // ---- the mite
  const mite = shBuildMite(R);
  // ---- pollen: a spiky ball (sunflower-like), 30 µm, drifting down from the room's air
  const pollen = new THREE.Group(); R.add(pollen);
  { const pm = shProcStd({ key: 'pollen', mat: { color: '#eab53e', roughness: 0.55, emissive: '#3a2400', emissiveIntensity: 0.3 }, glsl: /* glsl */`
      float procH(vec3 p, float pix){ vec2 c = shCell(vec2(atan(p.z, p.x) * 6.0, p.y * 0.5)); return (c.x * 0.5) * shLod(1.0, pix); }
      vec3 procC(vec3 p, float pix, vec3 b){ return b * (0.9 + 0.15 * shVN3(p * 0.3)); }` });
    const parts = [new THREE.IcosahedronGeometry(12.5, 4)];
    const n = 80;
    for (let i = 0; i < n; i++) {
      const yy = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - yy * yy), a = i * 2.39996, d = new THREE.Vector3(Math.cos(a) * r, yy, Math.sin(a) * r);
      const c = new THREE.ConeGeometry(1.7, 5.2, 8).translate(0, 12.5 + 2.2, 0);
      c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d)); parts.push(c);
    }
    const gm = THREE.mergeGeometries(parts.map((q) => { const nq = q.index ? q.toNonIndexed() : q; nq.deleteAttribute('uv'); return nq; }));
    const m = new THREE.Mesh(gm, pm); m.castShadow = m.receiveShadow = true; pollen.add(m); }

  // ---- bacteria on your flake: rods (some in chains, some with whip-like flagella) and grape-like clusters of spheres
  const bactM = new THREE.MeshPhysicalMaterial({ color: '#c2cf92', roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, emissive: '#2a3410', emissiveIntensity: 0.35, sheen: 0.4, sheenColor: new THREE.Color('#e8f0c0') });
  const cocM = new THREE.MeshPhysicalMaterial({ color: '#e0c890', roughness: 0.3, clearcoat: 0.5, emissive: '#3a2a10', emissiveIntensity: 0.3 });
  const flagM = shStd('#d8dcc0', 0.5);
  const bact = new THREE.Group(); R.add(bact);
  const flagella = [], bugs = [];
  { const r = new RNG(77), C = SH_DU.col, rod = new THREE.CapsuleGeometry(0.32, 1.45, 6, 16), coc = new THREE.SphereGeometry(0.5, 20, 14);
    const place = (x, z, ry, len = 1) => { const m = new THREE.Mesh(rod, bactM); m.scale.set(1, len, 1); m.rotation.set(Math.PI / 2, 0, ry, 'YXZ'); m.rotation.order = 'YXZ'; m.rotation.y = ry; m.position.set(x, C[1] + 0.33, z); m.castShadow = m.receiveShadow = true; bact.add(m); bugs.push({ m, x, z, ry, k: bugs.length }); return m; };
    // one big rod right beside where you end up (it fills the frame when the colours go), then the colony
    const big = place(C[0] + 1.4, C[2] - 2.6, 0.5, 1.1);
    for (let i = 0; i < 46; i++) {
      const a = r.range(0, 6.283), d = 2.5 + Math.pow(r.next(), 0.8) * 30, x = C[0] + Math.cos(a) * d, z = C[2] + Math.sin(a) * d - 4;
      if (Math.hypot(x - C[0], z - C[2]) < 2.0) continue;
      const ry = r.range(0, 6.283), chain = r.chance(0.25) ? r.int(2, 4) : 1;
      for (let k = 0; k < chain; k++) {
        const m = place(x + Math.sin(ry) * k * 2.05, z + Math.cos(ry) * k * 2.05, ry + r.range(-0.15, 0.15), r.range(0.8, 1.25));
        if (k === 0 && r.chance(0.35)) {
          const pts = []; for (let q = 0; q <= 40; q++) { const u = q / 40; pts.push(new THREE.Vector3(Math.sin(u * 14) * 0.18 * u, -1.1 - u * 7, Math.cos(u * 14) * 0.18 * u)); }
          const f = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.022, 4), flagM); m.add(f); flagella.push({ f, w: r.range(9, 16) });
        }
      }
    }
    for (let k = 0; k < 6; k++) {
      const a = r.range(0, 6.283), d = 4 + r.next() * 22, cx = C[0] + Math.cos(a) * d, cz2 = C[2] + Math.sin(a) * d - 4, n = r.int(7, 14);
      for (let i = 0; i < n; i++) { const m = new THREE.Mesh(coc, cocM); m.position.set(cx + r.gauss() * 0.9, C[1] + 0.5 + Math.abs(r.gauss()) * 0.7, cz2 + r.gauss() * 0.9); m.castShadow = m.receiveShadow = true; bact.add(m); bugs.push({ m, x: m.position.x, z: m.position.z, ry: null, k: bugs.length }); }
    }
    bact.userData.big = big; }

  // ---- floating specks (dust, soot, spores): bands from half a micrometre to a tenth of a millimetre
  const motes = shMotes(R, [0.5, 1.1, 2.4, 5.2, 11, 24, 52, 110].map((s, k) => ({ s, R: Math.max(30, s * 55), v: s * 0.04, brown: s < 3 ? s * 1.8 : 0 })), { n: 120, opacity: 0.3, color: '#d8ccbc' });

  // ---- your hands (for the syrup)
  const hands = new ViewerHands(W.camera, {
    skin: '#c08f74', sleeve: '#3b4a5c', cuff: '#2c3846', watch: true,
    poses: {
      pushA: { p: [0.2, -0.17, -0.42], F: [-0.25, 0.35, -1], N: [-0.9, 0.1, -0.3], curl: [0.12, 0.14, 0.18, 0.24], thumb: [0.5, 0.15] },
      pushB: { p: [-0.02, -0.15, -0.44], F: [-0.45, 0.3, -1], N: [-0.9, 0.1, -0.2], curl: [0.12, 0.14, 0.18, 0.24], thumb: [0.5, 0.15] },
    },
    blends: { pushA: 0.8, pushB: 1.1 },
    script: { right: [[0, 'hidden'], [179.4, 'pushA'], [181.4, 'pushB'], [184.4, 'pushB'], [186.0, 'hidden']], left: [[0, 'hidden']] },
  });
  hands.root.scale.setScalar(1 / 1.75);

  // ---- lights: warm key from the lamp (shadows that follow you), a soft blue-violet sky fill
  const key = new THREE.DirectionalLight('#ffd6b0', 2.4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; R.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#8a86c4', '#4a3022', 0.7); R.add(hemi);
  const glowL = new THREE.PointLight('#5dff9c', 0, 0, 2); R.add(glowL);
  const KD = new THREE.Vector3(-0.25, 0.62, -0.85).normalize();   // from the lamp (over the phone)
  const _v = new THREE.Vector3();

  const api = {
    scene: W.scene, camera: W.camera, W, hands, mite, water, pollen, bact, motes,
    frame(t, h, app) {
      const hU = h * 1e6, s = W.setH(hU);
      const cam = shDustCam(t, hU);
      // the mite's place and walk
      const [mx, mz] = shSpline(SH_DU_MITE, t), [mx2, mz2] = shSpline(SH_DU_MITE, t + 0.15);
      const moving = Math.hypot(mx2 - mx, mz2 - mz) > 0.5;
      const myaw = moving ? Math.atan2(mx2 - mx, mz2 - mz) : (t > 163 ? Math.PI / 2 : Math.atan2(-mx, -mz));
      mite.g.position.set(mx, 112, mz); mite.g.rotation.y = myaw;
      const stuck = shE(t, 166.0, 167.2);
      mite.g.rotation.x = 0.22 * stuck + Math.sin(t * 3.1) * 0.03 * stuck; mite.g.position.y = 112 - 30 * stuck;
      mite.pose(t, (t - 140) * 1.6, moving ? 1 : 0.15, stuck);
      mite.g.visible = t > 139 && t < 200;
      // look: keys, then turned towards the mite while it comes and while it is stuck; up at the pollen
      let dir = shDir(cam.yaw, cam.pitch);
      const aimAt = (p, k) => { if (k > 0) dir = shN3(shMix3(dir, shN3([p[0] - cam.p[0], p[1] - cam.p[1], p[2] - cam.p[2]]), k)); };
      aimAt([mx, 90, mz], 0.85 * shWin(t, 147.6, 160.2, 1.2, 1.3) + 0.8 * shWin(t, 164.5, 173.6, 1.0, 0.9));
      // the pollen: drifts down from high up, lands on your flake at 192.2
      const pT = [[186, -150, 480, -175], [192.2, -212, 15.2, -150]];
      const pu = shE(t, 186, 192.2, (x) => 1 - Math.pow(1 - x, 1.6));
      const pp = [shLerp(pT[0][1], pT[1][1], pu), shLerp(pT[0][2], pT[1][2], pu) + Math.sin(t * 1.3) * 3 * (1 - pu), shLerp(pT[0][3], pT[1][3], pu)];
      pollen.position.set(...pp); pollen.rotation.set(t * 0.3 * (1 - pu), t * 0.2 * (1 - pu), 0); pollen.visible = t > 185;
      aimAt(pp, 0.7 * shWin(t, 188.6, 193.0, 0.8, 1.0));
      W.lookDir(cam.p, dir, cam.roll);
      W.camera.fov = 60; shClip(W.camera, 0.04, Math.min(90000 * s, 4000));
      if (!backdrop) { backdrop = shRoomBackdrop(app); W.scene.background = backdrop.bg; W.scene.environment = backdrop.env; W.scene.environmentIntensity = 1.2; }
      W.scene.backgroundIntensity = 1.0 * (1 - 0.85 * shE(t, 205, 228));
      // the water: front position; its thickness for refraction is in world units
      water.position.x = shSpline(SH_DU_WATER, t)[0]; waterM.thickness = 900; waterM.attenuationDistance = 1600 * s;
      groundM.userData.U.uWX.value = t < 200 ? water.position.x : 1e9;   // (thickness is scaled by the mesh; the distance is not)
      water.visible = t < 200;
      // the call: the green light over the edge goes out when it stops ringing
      const ring = 1 - shE(t, 126.0, 127.5);
      cliff.userData.glow.uniforms.c.value.set(ring > 0.01 ? '#58ff9a' : '#ffffff');
      cliff.userData.glow.uniforms.k.value = 0.9 * ring + 0.0;
      glowL.position.set(cam.p[0], 8200, SH_DU.cliffZ - 600); glowL.intensity = 4.5e7 * ring * s * s;   // ~0.5 lux-ish at 9.5 mm, scaled with the world
      cliff.visible = t < 200;
      // bacteria flagella turning (a rotating corkscrew reads as a travelling wave)
      for (const F of flagella) F.f.rotation.y = t * F.w;
      // nothing here is still: a slow twitch, then the same uneven air that shoves you shoves them (µm)
      const jig = 0.05 + 0.16 * shE(t, 208, 215);
      for (const B of bugs) {
        const k = B.k * 1.618;
        B.m.position.x = B.x + jig * (Math.sin(t * 1.9 + k) + 0.6 * Math.sin(t * 3.7 + k * 2.3));
        B.m.position.z = B.z + jig * (Math.sin(t * 2.3 + k * 1.7) + 0.6 * Math.sin(t * 4.1 + k * 0.6));
        if (B.ry !== null) B.m.rotation.y = B.ry + jig * 0.9 * Math.sin(t * 1.3 + k * 0.9);
      }
      bact.visible = t > 192;
      // the key light and its shadow box follow you
      const tg = [cam.p[0] + dir[0] * 4 * hU, Math.max(0, cam.p[1] - hU), cam.p[2] + dir[2] * 4 * hU];
      key.target.position.set(...tg); key.position.set(tg[0] + KD.x * 60 * hU, tg[1] + KD.y * 60 * hU, tg[2] + KD.z * 60 * hU);
      shShadowBox(key, 16 * hU, 1 * hU, 140 * hU, s); key.shadow.normalBias = 0.02;
      key.intensity = 2.4 * (1 - 0.7 * shE(t, 205, 230));
      // floating specks, gently pushed by your hand in the syrup
      const handK = shWin(t, 179.4, 186.0, 0.6, 0.6);
      const hx = hands.right.g.position.x;
      motes.update(t, [cam.p[0], cam.p[1], cam.p[2]], hU, s, app.renderer.getDrawingBufferSize(_v).y / 2 / Math.tan(THREE.MathUtils.degToRad(30)) * 0.5, handK > 0 ? (x, y, z) => {
        const dx = x - cam.p[0], dz = z - cam.p[2], d = Math.hypot(dx, dz) / hU;
        const k = handK * Math.exp(-Math.pow((d - 0.6) / 0.35, 2)) * 0.8;
        return [k * hx * hU * Math.cos(cam.yaw), 0, -k * hx * hU * Math.sin(cam.yaw)];
      } : null);
      for (const m of [groundM, flakeM, gritM, hairM, metal, mite.body.children[0].material]) if (m.userData.uS) m.userData.uS.value = s;
      W.scene.fog.density = 0.006 + 0.004 * shE(t, 200, 225);
      hands.update(t);
      if (window.SH_DBG && SH_DBG.dust) SH_DBG.dust(api, t, h);
    },
    grade(t, p) {
      p.warmth = 0.07; p.bloom = 0.35; p.vignette = 0.6; p.ao = 0.5;
      // too small for light: the colours drain and the picture softens
      const f = shE(t, SH.fade - 0.5, SH.sem - 1.0);
      p.saturation = shLerp(0.98, 0.12, f); p.soft = shLerp(0.08, 0.45, f); p.edgeBlur = 0.6 * f; p.bloom = shLerp(0.35, 0.7, f); p.contrast = shLerp(1.05, 0.95, f);
    },
  };
  return api;
};
