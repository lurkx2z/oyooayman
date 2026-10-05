/* =====================================================================
   PEOPLE — stylised low-poly humans with a simple joint rig and
   procedural poses (walk, idle, stumble, kneel, sit, lie…).
   Poses blend smoothly and are a pure function of time.
   ===================================================================== */

const SKIN = ['#f1c9a5', '#e0ac85', '#c68863', '#8d5b3e', '#5e3b28', '#f6d7bd'];
// muted clothing; build = body silhouette (see BUILDS). Clothing layers / accessories:
// jacket (hem over hips), coat (longer hem), collar, hood, backpack, shoulderBag, scarf, hairStyle (short|long|bun|pony)
const LOOKS = {
  vendor:  { skin: 2, build: 'broad', shirt: '#d6d0c3', sleeves: 'short', pants: '#2b2b30', shoes: '#1a1a1a', sole: '#3a3a3a', hair: '#1f1611', apron: '#7c3b32', hat: { type: 'cap', color: '#7c3b32' } },
  worker:  { skin: 1, build: 'avg', shirt: '#3b4a58', sleeves: 'long', pants: '#3a3f46', shoes: '#4a3a2c', sole: '#22201c', hair: '#3a2a1e', vest: '#b8662e', hat: { type: 'hard', color: '#c4a03c' }, gloves: '#5b4e36' },
  rider:   { skin: 0, build: 'avg', shirt: '#1e2124', sleeves: 'long', pants: '#1d2a3a', shoes: '#111', hair: '#222', hat: { type: 'helmet', color: '#c9c9c4' }, gloves: '#111', jacket: true, collar: true },
  // commuter: zipped jacket with a collar, backpack
  casual1: { skin: 0, build: 'avg', shirt: '#30475e', sleeves: 'long', pants: '#2a2f38', shoes: '#3a3633', sole: '#c9c4b8', hair: '#4a3220', jacket: true, collar: true, backpack: '#2b2e30' },
  // heavy coat, beanie and scarf
  casual2: { skin: 3, build: 'broad', shirt: '#8f8778', sleeves: 'long', pants: '#3f3a34', shoes: '#2a1f18', sole: '#1a1612', hair: '#141010', coat: true, collar: true, scarf: '#6b2f2a', hat: { type: 'beanie', color: '#3b3f44' } },
  // runner: fitted top, ponytail
  casual3: { skin: 5, build: 'slim', shirt: '#74403a', sleeves: 'long', pants: '#22262c', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#9c7a4a', hairStyle: 'pony' },
  // t-shirt and cap
  casual4: { skin: 4, build: 'avg', shirt: '#a8934e', sleeves: 'short', pants: '#39435a', shoes: '#cfcac0', sole: '#e8e4dc', hair: '#111', hat: { type: 'cap', color: '#2c3138' } },
  // hoodie
  casual5: { skin: 1, build: 'broad', shirt: '#3f5243', sleeves: 'long', pants: '#857c68', shoes: '#4a3424', sole: '#2a1e14', hair: '#5b3f28', jacket: true, hood: true },
  // fitted jacket, bun, shoulder bag
  casual6: { skin: 2, build: 'slim', shirt: '#56465e', sleeves: 'long', pants: '#1f1f24', shoes: '#111', sole: '#2a2a2a', hair: '#2a1a12', hairStyle: 'bun', jacket: true, shoulderBag: '#5a3e2c' },
  casual7: { skin: 0, build: 'avg', shirt: '#aaa598', sleeves: 'short', pants: '#454d58', shoes: '#c8c3b8', sole: '#e6e2da', hair: '#7a5c40', backpack: '#4a3b2e' },
  // long coat, long hair, scarf
  casual8: { skin: 3, build: 'slim', shirt: '#242a38', sleeves: 'long', pants: '#5a5248', shoes: '#2a2018', sole: '#14100c', hair: '#0e0b09', hairStyle: 'long', coat: true, collar: true, scarf: '#9a8a6a' },
};

// body silhouettes. sh = width across the shoulders INCLUDING the arms (bideltoid), the rest is the torso.
const BUILDS = {
  avg:   { sh: 0.47, chest: 0.34, waist: 0.3, hip: 0.34, depth: 0.22, limb: 1.0, head: 0.95 },
  broad: { sh: 0.53, chest: 0.4, waist: 0.38, hip: 0.38, depth: 0.27, limb: 1.14, head: 0.97 },
  slim:  { sh: 0.41, chest: 0.3, waist: 0.26, hip: 0.35, depth: 0.19, limb: 0.86, head: 0.93 },
};

// faceted loft through horizontal rings [y, halfWidth, halfDepth, zOffset] (flat-shaded low-poly)
function loftGeo(rings, sides = 8) {
  const pos = [];
  const R = rings.map(([y, hw, hd, zo = 0]) => {
    const pts = [];
    for (let k = 0; k < sides; k++) { const a = ((k + 0.5) / sides) * Math.PI * 2; pts.push([Math.sin(a) * hw, y, Math.cos(a) * hd + zo]); }
    return pts;
  });
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let r = 0; r < R.length - 1; r++) for (let k = 0; k < sides; k++) {
    const k2 = (k + 1) % sides;
    tri(R[r][k], R[r][k2], R[r + 1][k2]); tri(R[r][k], R[r + 1][k2], R[r + 1][k]);
  }
  const b = [0, rings[0][0], 0], t = [0, rings[rings.length - 1][0], 0], last = R[R.length - 1];
  for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides; tri(b, R[0][k2], R[0][k]); tri(t, last[k], last[k2]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// faceted sphere (flat shading) for heads, joint caps, shoulder caps
function facetBall(r, sx = 1, sy = 1, sz = 1, detail = 1) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  g.scale(sx, sy, sz);
  g.computeVertexNormals();
  return g;
}
// loft along +Z (toe direction) from rings [z, halfWidth, halfHeight, yOffset] — shoes, hands seen side-on
function loftZ(rings, sides = 8) {
  const g = loftGeo(rings.map(([z, hw, hh, yo = 0]) => [z, hw, hh, -yo]), sides);
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

const PersonGeo = {
  ready: false,
  init() {
    if (this.ready) return;
    this.pelvis = new THREE.RoundedBoxGeometry(0.34, 0.2, 0.21, 2, 0.06);
    this.chest = new THREE.RoundedBoxGeometry(0.37, 0.5, 0.22, 2, 0.08);
    this.neck = new THREE.CylinderGeometry(0.052, 0.062, 0.16, 10);
    this.head = facetBall(0.105, 0.9, 1.1, 1.0, 1);
    this.jaw = facetBall(0.07, 1.05, 0.7, 0.95, 0);
    this.hair = new THREE.SphereGeometry(0.112, 9, 5, 0, Math.PI * 2, 0, Math.PI * 0.6); this.hair.scale(0.96, 1.06, 1.08); this.hair = this.hair.toNonIndexed(); this.hair.computeVertexNormals();
    this.bun = facetBall(0.045, 1, 0.9, 1, 0);
    this.pony = loftGeo([[-0.2, 0.018, 0.016], [-0.08, 0.032, 0.028], [0.0, 0.026, 0.022]], 6);
    this.hairLong = new THREE.CylinderGeometry(0.1, 0.125, 0.24, 9, 1, true, Math.PI * 0.25, Math.PI * 1.5);
    this.nose = new THREE.BoxGeometry(0.026, 0.038, 0.03);
    this.beanie = new THREE.SphereGeometry(0.118, 9, 5, 0, Math.PI * 2, 0, Math.PI * 0.5); this.beanie.scale(1, 1.15, 1.05);
    this.beanieBand = new THREE.CylinderGeometry(0.121, 0.121, 0.04, 9);
    this.collar = new THREE.CylinderGeometry(0.078, 0.098, 0.075, 8);
    this.hood = facetBall(0.1, 1.35, 0.62, 0.85, 1);
    this.scarf = new THREE.TorusGeometry(0.078, 0.032, 5, 9); this.scarf.rotateX(Math.PI / 2);
    this.scarfTail = new THREE.BoxGeometry(0.06, 0.22, 0.025);
    this.pack = loftGeo([[-0.17, 0.13, 0.055], [0.1, 0.14, 0.065], [0.17, 0.11, 0.05], [0.19, 0.06, 0.03]], 8);
    this.strap = new THREE.BoxGeometry(0.035, 0.3, 0.012);
    this.sBag = loftGeo([[-0.11, 0.13, 0.04], [0.09, 0.14, 0.045], [0.11, 0.12, 0.035]], 6);
    this.sBagStrap = new THREE.BoxGeometry(0.03, 0.62, 0.012);
    this.upperArm = new THREE.CapsuleGeometry(0.05, 0.22, 4, 8);
    this.foreArm = new THREE.CapsuleGeometry(0.042, 0.2, 4, 8);
    this.hand = new THREE.SphereGeometry(0.045, 8, 6); this.hand.scale(0.8, 1.15, 0.65);
    this.thigh = new THREE.CapsuleGeometry(0.075, 0.32, 4, 8);
    this.shin = new THREE.CapsuleGeometry(0.058, 0.34, 4, 8);
    this.shoe = new THREE.RoundedBoxGeometry(0.11, 0.075, 0.27, 2, 0.03);
    this.cap = new THREE.SphereGeometry(0.118, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.42);
    this.brim = new THREE.BoxGeometry(0.17, 0.015, 0.1);
    this.hard = new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.hardBrim = new THREE.CylinderGeometry(0.16, 0.16, 0.015, 14);
    this.helmet = new THREE.SphereGeometry(0.15, 14, 10);
    this.apron = new THREE.BoxGeometry(0.34, 0.55, 0.02);
    this.vest = new THREE.RoundedBoxGeometry(0.39, 0.42, 0.24, 2, 0.07);
    this.stripe = new THREE.BoxGeometry(0.4, 0.035, 0.245);
    this.phone = new THREE.BoxGeometry(0.075, 0.14, 0.012);
    this.grinder = new THREE.BoxGeometry(0.08, 0.08, 0.32);
    this.disc = new THREE.CylinderGeometry(0.065, 0.065, 0.012, 16);
    this.tongs = new THREE.BoxGeometry(0.015, 0.015, 0.32);
    this.bag = new THREE.BoxGeometry(0.08, 0.3, 0.32);
    this.eye = new THREE.SphereGeometry(0.0125, 8, 6);
    this.brow = new THREE.BoxGeometry(0.034, 0.008, 0.012);
    this.mouth = new THREE.BoxGeometry(0.036, 0.007, 0.012);
    this.ear = new THREE.SphereGeometry(0.022, 8, 6); this.ear.scale(0.5, 1, 0.8);
    this.lighter = new THREE.BoxGeometry(0.022, 0.07, 0.012);
    this.thumb = new THREE.CapsuleGeometry(0.016, 0.04, 3, 6);
    this.builds = {};
    this.ready = true;
  },
  // authored low-poly parts for one body build + clothing flags, cached
  forBuild(name, L) {
    const key = [name, L.jacket ? 'j' : '', L.coat ? 'c' : '', L.sleeves].join('|');
    if (this.builds[key]) return this.builds[key];
    const B = BUILDS[name] || BUILDS.avg, d = B.depth, K = B.limb;
    // torso: waist → ribcage → shoulder line → trapezius → neck base; a jacket/coat adds a hem over the hips
    const rings = [
      [-0.03, B.waist * 0.5, d * 0.46], [0.15, B.waist * 0.5, d * 0.45], [0.33, B.chest * 0.5, d * 0.5, 0.01],
      [0.44, B.sh * 0.5 - 0.07 * K, d * 0.45], [0.5, B.sh * 0.5 - 0.115 * K, d * 0.37], [0.545, 0.068, 0.06],
    ];
    if (L.coat) rings.unshift([-0.36, B.hip * 0.6, d * 0.6], [-0.2, B.hip * 0.56, d * 0.56], [-0.08, B.hip * 0.53, d * 0.52]);
    else if (L.jacket) rings.unshift([-0.18, B.hip * 0.545, d * 0.55], [-0.09, B.hip * 0.52, d * 0.5]);
    const sleeveLong = L.sleeves !== 'short';
    const o = {
      B,
      torso: loftGeo(rings),
      pelvis: loftGeo([[-0.12, B.hip * 0.44, d * 0.42], [-0.04, B.hip * 0.5, d * 0.5], [0.1, B.waist * 0.5, d * 0.46]]),
      deltoid: facetBall(0.072 * K, 1, 1, 1, 1),
      upperArm: loftGeo([[-0.31, 0.05 * K, 0.052 * K], [-0.12, 0.062 * K, 0.064 * K], [0.03, 0.066 * K, 0.07 * K]], 7),
      elbow: facetBall(0.05 * K, 1, 1, 1, 0),
      foreArm: sleeveLong
        ? loftGeo([[-0.25, 0.048 * K, 0.05 * K], [-0.22, 0.044 * K, 0.046 * K], [0.02, 0.052 * K, 0.054 * K]], 7)
        : loftGeo([[-0.25, 0.031 * K, 0.028 * K], [0.02, 0.043 * K, 0.04 * K]], 7),
      // hand hangs palm-in: broad side along Z, thumb in front
      hand: loftGeo([[-0.12, 0.014, 0.03], [-0.085, 0.02, 0.042], [-0.04, 0.022, 0.045], [0.0, 0.02, 0.031]], 6),
      thumb: loftGeo([[-0.055, 0.011, 0.011], [0.0, 0.015, 0.016]], 5),
      thigh: loftGeo([[-0.47, 0.059 * K, 0.062 * K], [-0.42, 0.064 * K, 0.068 * K], [-0.2, 0.083 * K, 0.086 * K], [0.04, 0.092 * K, 0.096 * K]], 7),
      knee: facetBall(0.064 * K, 1, 1, 1, 0),
      shin: loftGeo([[-0.41, 0.058 * K, 0.06 * K], [-0.37, 0.052 * K, 0.054 * K], [-0.12, 0.058 * K, 0.064 * K], [0.03, 0.062 * K, 0.064 * K]], 7),
      // shoe: heel → instep → toe, on a separate sole
      shoe: loftZ([[-0.075, 0.04, 0.032, 0.035], [-0.02, 0.046, 0.044, 0.042], [0.06, 0.05, 0.03, 0.03], [0.14, 0.044, 0.022, 0.022], [0.17, 0.03, 0.014, 0.016]], 8),
      sole: loftZ([[-0.08, 0.042, 0.009, 0.004], [0.06, 0.052, 0.009, 0.004], [0.16, 0.042, 0.009, 0.004], [0.178, 0.026, 0.007, 0.006]], 8),
    };
    this.builds[key] = o;
    return o;
  },
};

/* ---- pose helpers ---- */
function basePose() {
  return {
    hipY: 0.93, pelvisPitch: 0, pelvisYaw: 0, rootRoll: 0, rootX: 0, rootZ: 0,
    spine: 0.03, spineYaw: 0, spineRoll: 0, neck: 0.04, headYaw: 0, headRoll: 0,
    lSh: [0.05, 0.08], rSh: [0.05, 0.08], lEl: 0.18, rEl: 0.18,
    lHip: [0, 0.03], rHip: [0, 0.03], lKnee: 0.04, rKnee: 0.04, lFoot: 0, rFoot: 0,
  };
}
function lerpPose(a, b, w) {
  const o = {};
  for (const k in a) {
    if (Array.isArray(a[k])) o[k] = [a[k][0] + (b[k][0] - a[k][0]) * w, a[k][1] + (b[k][1] - a[k][1]) * w];
    else o[k] = a[k] + (b[k] - a[k]) * w;
  }
  return o;
}

// each action: (τ = seconds since the action started, ctx) → pose
const ACTIONS = {
  idle(τ, c) {
    const p = basePose();
    const br = Math.sin((τ + c.seed * 5) * 1.6);
    p.spine += br * 0.012; p.lSh[1] += br * 0.01; p.rSh[1] += br * 0.01;
    p.headYaw = noise1(τ * 0.35, c.seedI) * 0.25;
    p.spineRoll = noise1(τ * 0.25, c.seedI + 3) * 0.02;
    return p;
  },
  walk(τ, c) {
    const p = basePose();
    const φ = c.walkPhase;
    const s = Math.sin(φ), co = Math.cos(φ);
    p.lHip = [0.42 * s, 0.03]; p.rHip = [-0.42 * s, 0.03];
    p.lKnee = 0.08 + 0.65 * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * Math.max(0, -co) ** 1.5;
    p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
    p.lSh = [-0.34 * s, 0.07]; p.rSh = [0.34 * s, 0.07];
    p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
    p.hipY = 0.93 - 0.032 * s * s;
    p.pelvisYaw = 0.09 * s; p.spineYaw = -0.12 * s;
    p.spine = 0.06;
    p.headYaw = noise1(τ * 0.3, c.seedI) * 0.2;
    return p;
  },
  jog(τ, c) {
    const p = ACTIONS.walk(τ, c);
    const φ = c.walkPhase, s = Math.sin(φ), co = Math.cos(φ);
    p.lHip = [0.62 * s, 0.03]; p.rHip = [-0.62 * s, 0.03];
    p.lKnee = 0.25 + 1.0 * Math.max(0, co) ** 1.3; p.rKnee = 0.25 + 1.0 * Math.max(0, -co) ** 1.3;
    p.lSh = [-0.6 * s, 0.1]; p.rSh = [0.6 * s, 0.1]; p.lEl = 1.35; p.rEl = 1.35;
    p.spine = 0.16; p.hipY = 0.9 + 0.035 * Math.abs(co);
    return p;
  },
  grill(τ, c) {
    const p = ACTIONS.idle(τ, c);
    const f = Math.sin(τ * 2.2 + c.seed * 4);
    p.spine = 0.18; p.neck = 0.45;
    p.rSh = [0.9 + f * 0.12, 0.1]; p.rEl = 0.9 + f * 0.25;
    p.lSh = [0.55, 0.1]; p.lEl = 1.1;
    p.headYaw = 0.05;
    return p;
  },
  phone(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.rSh = [0.55, 0.12]; p.rEl = 1.95; p.neck = 0.42; p.spine = 0.06; p.headYaw = 0;
    p.lSh = [0.06, 0.06]; p.lEl = 0.2;
    return p;
  },
  grind(τ, c) {
    const p = basePose();
    const j = Math.sin(τ * 47) * 0.012;
    p.spine = 0.22 + j; p.neck = 0.35;
    p.lSh = [1.05 + j, 0.32]; p.lEl = 0.85; p.rSh = [0.95 - j, 0.08]; p.rEl = 0.65;
    p.lHip = [0.18, 0.08]; p.rHip = [-0.12, 0.06]; p.lKnee = 0.22; p.rKnee = 0.12; p.hipY = 0.9;
    return p;
  },
  lowerTool(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.rSh = [0.35, 0.08]; p.rEl = 0.5; p.lSh = [0.25, 0.1]; p.lEl = 0.45; p.neck = 0.15;
    return p;
  },
  recoil(τ, c) {
    const p = basePose();
    const k = Math.min(1, τ / 0.25);
    p.spine = -0.1 * k; p.neck = -0.12 * k;
    p.lSh = [0.7, 0.25]; p.lEl = 1.5; p.rSh = [0.7, 0.25]; p.rEl = 1.5;
    p.lHip = [-0.1, 0.05]; p.rKnee = 0.12;
    return p;
  },
  look(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.headYaw = Math.sin(τ * 0.85 + c.seed * 6) * 0.75 + noise1(τ * 0.6, c.seedI) * 0.2;
    p.spineYaw = p.headYaw * 0.35;
    p.neck = 0.02 + noise1(τ * 0.4, c.seedI + 9) * 0.12;
    p.lSh = [0.12, 0.12]; p.rSh = [0.12 + Math.max(0, Math.sin(τ * 0.6)) * 0.3, 0.12];
    return p;
  },
  handHead(τ, c) {
    const p = ACTIONS.idle(τ, c);
    const sw = Math.sin(τ * 1.7 + c.seed * 3);
    p.rSh = [2.15, 0.15]; p.rEl = 2.15; p.neck = 0.32; p.spine = 0.12;
    p.spineRoll = sw * 0.06; p.lKnee = 0.12; p.rKnee = 0.12; p.hipY = 0.91;
    p.lSh = [0.15, 0.3]; p.lEl = 0.3; p.headYaw = 0;
    return p;
  },
  stumble(τ, c) {
    const p = basePose();
    const a = Math.sin(τ * 2.3 + c.seed * 5), b = Math.sin(τ * 3.7 + 1.3);
    p.spine = 0.25 + b * 0.05; p.spineRoll = a * 0.16; p.neck = 0.35 + b * 0.08;
    p.lSh = [0.35, 0.28 + a * 0.1]; p.lEl = 0.45; p.rSh = [0.45, 0.2 - a * 0.08]; p.rEl = 0.7;
    p.lHip = [0.2 * a, 0.1]; p.rHip = [-0.18 * a, 0.12]; p.lKnee = 0.35; p.rKnee = 0.3;
    p.hipY = 0.86; p.rootX = a * 0.08;
    return p;
  },
  lean(τ, c) {
    const p = basePose();
    const br = Math.sin(τ * 2.4) * 0.03;
    p.spine = 0.7 + br; p.neck = 0.25; p.headYaw = 0;
    p.lSh = [1.05, 0.15]; p.lEl = 0.2; p.rSh = [1.05, 0.15]; p.rEl = 0.2;
    p.lKnee = 0.22; p.rKnee = 0.18; p.hipY = 0.89; p.rootZ = -0.08;
    return p;
  },
  kneel(τ, c) {
    const p = basePose();
    const sw = Math.sin(τ * 1.5 + c.seed * 3);
    p.hipY = 0.53; p.lHip = [0.02, 0.06]; p.rHip = [0.0, 0.06]; p.lKnee = 1.55; p.rKnee = 1.55;
    p.lFoot = 0.4; p.rFoot = 0.4;
    p.spine = 0.38 + sw * 0.05; p.spineRoll = sw * 0.08; p.neck = 0.45;
    p.lSh = [0.55, 0.12]; p.lEl = 0.35; p.rSh = [0.6, 0.12]; p.rEl = 0.3;
    return p;
  },
  sit(τ, c) {
    const p = basePose();
    p.hipY = c.seat ? c.seat + 0.05 : 0.5; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5;
    p.spine = -0.05 + Math.sin(τ * 1.5) * 0.01; p.neck = 0.1;
    p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1;
    p.headYaw = noise1(τ * 0.3, c.seedI) * 0.4;
    return p;
  },
  sitSlump(τ, c) {
    const p = ACTIONS.sit(τ, c);
    p.spine = 0.55; p.spineRoll = 0.16; p.neck = 0.65; p.headYaw = 0.1; p.headRoll = 0.2;
    p.lSh = [0.1, 0.15]; p.lEl = 0.15; p.rSh = [0.25, 0.1]; p.rEl = 0.3;
    return p;
  },
  sitGround(τ, c) {
    const p = basePose();
    p.hipY = 0.14; p.lHip = [1.95, 0.18]; p.rHip = [1.85, 0.12]; p.lKnee = 1.1; p.rKnee = 1.25;
    p.lFoot = -0.3; p.rFoot = -0.3;
    p.spine = -0.12 + MathX.smooth(τ, 1.5, 3.5) * 0.35; p.spineRoll = 0.08;
    p.neck = 0.25 + MathX.smooth(τ, 1, 3) * 0.45;
    p.lSh = [0.15, 0.25]; p.lEl = 0.25; p.rSh = [0.25, 0.2]; p.rEl = 0.4;
    return p;
  },
  lie(τ, c) {
    const p = basePose();
    p.hipY = 0.16; p.rootRoll = 1.48;
    p.lHip = [0.55, 0.05]; p.rHip = [0.25, 0.05]; p.lKnee = 0.8; p.rKnee = 0.35;
    p.spine = 0.2; p.neck = 0.25; p.headRoll = -0.2;
    p.lSh = [0.9, 0.1]; p.lEl = 0.6; p.rSh = [0.6, 0.1]; p.rEl = 0.4;
    return p;
  },
  earPop(τ, c) {
    // ears pop as air pressure drops 23 %: flinch, hands to ears
    const p = basePose();
    const k = Math.min(1, τ / 0.18);
    p.lSh = [1.0 * k + 0.05, 0.55 * k + 0.08]; p.rSh = [1.0 * k + 0.05, 0.55 * k + 0.08];
    p.lEl = 0.18 + 2.25 * k; p.rEl = 0.18 + 2.25 * k;
    p.spine = 0.03 + 0.16 * k; p.neck = 0.04 + 0.25 * k; p.headRoll = 0.08 * Math.sin(τ * 7) * k;
    p.lKnee = 0.04 + 0.22 * k; p.rKnee = 0.04 + 0.22 * k; p.hipY = 0.93 - 0.06 * k;
    p.headYaw = Math.sin(τ * 2.5 + c.seed * 4) * 0.3 * k;
    return p;
  },
  earPopSit(τ, c) {
    const p = ACTIONS.sit(τ, c), e = ACTIONS.earPop(τ, c);
    p.lSh = e.lSh; p.rSh = e.rSh; p.lEl = e.lEl; p.rEl = e.rEl; p.neck = e.neck; p.spine = 0.12; p.headYaw = e.headYaw;
    return p;
  },
  flinch(τ, c) {
    const p = ACTIONS.grind(τ, c);
    const k = Math.min(1, τ / 0.12) * Math.exp(-τ / 0.6);
    p.spine -= 0.12 * k; p.neck = 0.35 - 0.5 * k; p.lSh[0] -= 0.4 * k; p.rSh[0] -= 0.3 * k;
    return p;
  },
  lighter(τ, c) {
    // tries to relight the grill: left hand at the coals, thumb flicking every ~0.5 s — nothing catches
    const p = ACTIONS.idle(τ, c);
    const flick = Math.max(0, Math.sin(τ * Math.PI * 2 / 0.5)) ** 6;
    p.spine = 0.42; p.neck = 0.55; p.headYaw = 0;
    p.lSh = [1.05, 0.05]; p.lEl = 0.55 + flick * 0.12;
    p.rSh = [0.55, 0.18]; p.rEl = 0.85;
    p.lKnee = 0.18; p.rKnee = 0.18; p.hipY = 0.9;
    return p;
  },
  collapse(τ, c) {
    // sudden hypoxic collapse: knees buckle, torso folds, lands on the side with a knee bent, brief twitch
    const A = basePose();
    A.lSh = [0.15, 0.12]; A.rSh = [0.15, 0.12]; A.lEl = 0.25; A.rEl = 0.25; A.neck = 0.35;
    const B = Object.assign(basePose(), {
      hipY: 0.6, lHip: [0.65, 0.08], rHip: [0.55, 0.08], lKnee: 1.25, rKnee: 1.15, spine: 0.45, neck: 0.65,
      lSh: [0.25, 0.25], rSh: [0.2, 0.2], lEl: 0.2, rEl: 0.15, rootZ: 0.08,
    });
    const C = Object.assign(basePose(), {
      hipY: 0.33, lHip: [0.45, 0.1], rHip: [0.35, 0.1], lKnee: 1.7, rKnee: 1.6, spine: 0.7, spineRoll: 0.25, rootRoll: 0.55,
      neck: 0.6, lSh: [0.6, 0.35], rSh: [0.35, 0.25], lEl: 0.3, rEl: 0.2, rootZ: 0.2,
    });
    const D = Object.assign(basePose(), {
      hipY: 0.17, rootRoll: 1.42, lHip: [0.95, 0.12], rHip: [0.35, 0.05], lKnee: 1.25, rKnee: 0.55,
      spine: 0.38, spineRoll: 0.1, neck: 0.35, headRoll: -0.35, headYaw: 0.2,
      lSh: [1.15, 0.15], lEl: 0.95, rSh: [0.35, 0.1], rEl: 0.35, lFoot: 0.2, rFoot: 0.1, rootZ: 0.35,
    });
    let p;
    if (τ < 0.3) p = lerpPose(A, B, Ease.inQuad(τ / 0.3));
    else if (τ < 0.65) p = lerpPose(B, C, Ease.inQuad((τ - 0.3) / 0.35));
    else if (τ < 1.05) p = lerpPose(C, D, Ease.inQuad((τ - 0.65) / 0.4));
    else {
      p = Object.assign({}, D, { lSh: D.lSh.slice(), rSh: D.rSh.slice(), lHip: D.lHip.slice(), rHip: D.rHip.slice() });
      const tw = Math.exp(-(τ - 1.05) / 0.45) * Math.sin((τ - 1.05) * 31);
      p.lEl += tw * 0.12; p.rKnee += tw * 0.1; p.neck += tw * 0.05; p.lSh[0] += tw * 0.06;
    }
    return p;
  },
  railSlump(τ, c) {
    // passes out on his feet and folds over the lift railing
    const A = basePose(), k = Ease.inQuad(Math.min(1, τ / 0.55));
    const p = lerpPose(A, Object.assign(basePose(), {
      hipY: 0.78, lHip: [0.35, 0.08], rHip: [0.3, 0.08], lKnee: 0.65, rKnee: 0.55, spine: 1.15, spineRoll: 0.12,
      neck: 0.7, headRoll: 0.25, lSh: [0.35, 0.18], rSh: [0.55, 0.12], lEl: 0.15, rEl: 0.25, rootZ: 0.12,
    }), k);
    if (τ > 0.55) { const tw = Math.exp(-(τ - 0.55) / 0.4) * Math.sin((τ - 0.55) * 28); p.neck += tw * 0.06; p.rEl += tw * 0.1; }
    return p;
  },
  ride(τ, c) {
    const p = basePose();
    p.hipY = 0.86; p.lHip = [1.2, 0.18]; p.rHip = [1.2, 0.18]; p.lKnee = 1.55; p.rKnee = 1.55;
    p.lFoot = 0.2; p.rFoot = 0.2;
    p.spine = 0.42; p.neck = -0.15;
    p.lSh = [1.25, 0.22]; p.lEl = 0.45; p.rSh = [1.25, 0.22]; p.rEl = 0.45;
    return p;
  },
};
const BLEND = { recoil: 0.2, lie: 1.1, kneel: 0.85, sitGround: 1.3, stumble: 0.6, sitSlump: 1.2, lean: 0.8, look: 0.6, handHead: 0.5, walk: 0.5, idle: 0.6, earPop: 0.08, earPopSit: 0.08, flinch: 0.06, collapse: 0.12, railSlump: 0.1, lighter: 0.5, phone: 0.5, grind: 0.35, jog: 0.4 };

// a person's whole performance from scenes (used by the films' casts): [from, to, { path | at, act | states, face, y, seat, stride }]
// → one path (with instant moves between scenes), states, and per-scene facing, height, seat and visibility
const PARLOUR_SEAT = { x: 2.0, z: 199.95 };   // (the parlour itself: films/before-screens/parlour.js)

function perf(id, look, scenes, extra = {}) {
  const path = [], states = [], faces = [], ys = [], seats = [], show = [], strides = [];
  let stride = 1.32;
  const push = (t, x, z) => { if (path.length && t <= path[path.length - 1][0]) t = path[path.length - 1][0] + 0.001; path.push([t, x, z]); };
  for (const [t0, t1, S] of scenes) {
    const P = S.path || [[t0, S.at[0], S.at[1]]];
    if (P[0][0] > t0) push(t0, P[0][1], P[0][2]);
    for (const k of P) push(k[0], k[1], k[2]);
    const last = P[P.length - 1];
    if (last[0] < t1) push(t1, last[1], last[2]);
    for (const st of S.states || [[t0, S.act || 'idle']]) states.push(st);
    faces.push([t0, S.face === undefined ? null : S.face]);
    ys.push([t0, S.y || 0]); seats.push([t0, S.seat]);
    show.push([t0, t1]);
    if (S.stride) stride = S.stride;
    strides.push([t0, S.stride || 1.32]);
  }
  states.sort((a, b) => a[0] - b[0]);
  return Object.assign({ id, look, path, states, faces, ys, seats, show, stride, strides }, extra);
}

class Person {
  constructor(spec, scene) {
    PersonGeo.init();
    this.spec = spec;
    this.seed = hash1((spec.id || 'p').split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
    this.seedI = Math.floor(this.seed * 1000);
    this.look = LOOKS[spec.look] || LOOKS.casual1;
    this.scale = 0.94 + this.seed * 0.12;
    this._build();
    if (scene) scene.add(this.root);
    if (spec.path) this._preparePath();
    this.states = spec.states || [[0, 'idle']];
  }

  _mat(c, rough = 0.85) { return Mat.std(c, { roughness: rough }); }

  _build() {
    const G = PersonGeo, L = this.look, BG = G.forBuild(L.build || 'avg', L), B = BG.B, K = B.limb;
    const skin = this._mat(SKIN[L.skin % SKIN.length], 0.7);
    const shirt = this._mat(L.shirt), pants = this._mat(L.pants), shoes = this._mat(L.shoes, 0.55), hair = this._mat(L.hair, 0.9);
    const sole = this._mat(L.sole || '#2a2a2a', 0.8);
    // only the big body parts cast shadows (keeps the shadow pass cheap)
    const casters = new Set([BG.pelvis, BG.torso, G.head, BG.thigh, BG.shin, BG.upperArm, G.vest, G.helmet, G.hard, G.pack]);
    const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = casters.has(g); o.receiveShadow = true; parent.add(o); return o; };
    const root = new THREE.Group();
    root.name = 'person:' + (this.spec.id || '');
    const body = new THREE.Group(); body.scale.setScalar(this.scale); root.add(body);
    const hips = new THREE.Group(); body.add(hips);
    mesh(BG.pelvis, pants, hips, 0, 0, 0);
    const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine);
    mesh(BG.torso, shirt, spine, 0, 0.0, 0);
    const front = B.depth * 0.5;
    if (L.jacket || L.coat) {
      // open front: a strip of the shirt underneath breaks up the block of colour
      const inner = this._mat(L.inner || (new THREE.Color(L.shirt).getHSL({}).l > 0.4 ? '#2a2c30' : '#b9b3a6'), 0.9);
      mesh(new THREE.BoxGeometry(0.08, L.coat ? 0.34 : 0.38, 0.01), inner, spine, 0, 0.3, front + 0.004);
    } else {
      mesh(new THREE.BoxGeometry(B.waist * 1.02, 0.035, B.depth * 0.95), this._mat('#1d1d1f', 0.6), hips, 0, 0.085, 0);   // belt
    }
    if (L.collar) mesh(G.collar, shirt, spine, 0, 0.555, -0.005);
    if (L.hood) mesh(G.hood, shirt, spine, 0, 0.53, -0.085);
    if (L.scarf) {
      const sm = this._mat(L.scarf, 0.95);
      mesh(G.scarf, sm, spine, 0, 0.545, 0.0).scale.set(1.0, 1.0, 0.95);
      mesh(G.scarfTail, sm, spine, 0.045, 0.42, front + 0.02).rotation.z = 0.12;
    }
    if (L.backpack) {
      const pm = this._mat(L.backpack, 0.85);
      mesh(G.pack, pm, spine, 0, 0.29, -(front + 0.055));
      for (const sx of [-1, 1]) mesh(G.strap, pm, spine, sx * 0.075, 0.33, front + 0.006).rotation.z = sx * 0.06;
    }
    if (L.shoulderBag) {
      const bm = this._mat(L.shoulderBag, 0.8);
      mesh(G.sBagStrap, bm, spine, 0.0, 0.27, front + 0.008).rotation.z = 0.62;
      mesh(G.sBag, bm, spine, -(B.waist * 0.5 + 0.03), -0.02, 0.02);
    }
    if (L.vest) {
      mesh(G.vest, this._mat(L.vest, 0.6), spine, 0, 0.3, 0).scale.set(B.chest / 0.37 * 1.08, 1, B.depth / 0.22 * 1.06);
      const st = new THREE.MeshStandardMaterial({ color: '#d8d8d0', emissive: '#555', roughness: 0.3 });
      mesh(G.stripe, st, spine, 0, 0.22, 0).scale.set(B.chest / 0.37 * 1.1, 1, B.depth / 0.22 * 1.08);
      mesh(G.stripe, st, spine, 0, 0.36, 0).scale.set(B.chest / 0.37 * 1.1, 1, B.depth / 0.22 * 1.08);
    }
    if (L.apron) mesh(G.apron, this._mat(L.apron), spine, 0, 0.1, front + 0.012).scale.x = B.waist / 0.33;
    if (L.bag) mesh(G.bag, this._mat(L.bag), spine, -(B.waist * 0.5 + 0.06), 0.05, 0);
    const neck = new THREE.Group(); neck.position.y = 0.52; spine.add(neck);
    mesh(G.neck, skin, neck, 0, 0.0, 0);
    const head = new THREE.Group(); head.position.y = 0.14; head.scale.setScalar(B.head); neck.add(head);
    mesh(G.head, skin, head, 0, 0, 0);
    mesh(G.jaw, skin, head, 0, -0.055, 0.018);
    mesh(G.nose, skin, head, 0, -0.012, 0.1);
    // no painted faces: at this style and distance they read as cartoon dots
    for (const sx of [-1, 1]) mesh(G.ear, skin, head, sx * 0.095, -0.005, -0.005);
    const hatType = L.hat && L.hat.type;
    if (!hatType || hatType === 'cap' || hatType === 'beanie') mesh(G.hair, hair, head, 0, 0.016, -0.014).rotation.x = -0.85;   // hairline high enough that a face reads from the front
    if (L.hairStyle === 'long' || L.long) mesh(G.hairLong, hair, head, 0, -0.1, -0.02);
    if (L.hairStyle === 'bun') mesh(G.bun, hair, head, 0, 0.08, -0.1);
    if (L.hairStyle === 'pony') { const pn = mesh(G.pony, hair, head, 0, 0.03, -0.11); pn.rotation.x = -0.35; }
    if (L.hat) {
      const hm = this._mat(L.hat.color, 0.5);
      if (hatType === 'cap') { mesh(G.cap, hm, head, 0, 0.03, 0); mesh(G.brim, hm, head, 0, 0.045, 0.12); }
      if (hatType === 'beanie') { mesh(G.beanie, this._mat(L.hat.color, 0.95), head, 0, 0.025, -0.005); mesh(G.beanieBand, this._mat(L.hat.color, 0.95), head, 0, 0.03, -0.005); }
      if (hatType === 'hard') { mesh(G.hard, hm, head, 0, 0.04, 0); mesh(G.hardBrim, hm, head, 0, 0.045, 0.01); }
      if (hatType === 'helmet') { mesh(G.helmet, this._mat(L.hat.color, 0.25), head, 0, 0.02, -0.005); mesh(new THREE.BoxGeometry(0.2, 0.07, 0.02), this._mat('#101418', 0.1), head, 0, 0.01, 0.14); }
    }
    const sleeve = L.sleeves === 'long' ? shirt : skin;
    const handMat = L.gloves ? this._mat(L.gloves) : skin;
    const arm = (side) => {
      const sh = new THREE.Group(); sh.position.set(side * (B.sh * 0.5 - 0.062 * K), 0.45, 0); spine.add(sh);
      mesh(BG.deltoid, shirt, sh, -side * 0.006, 0.0, 0);
      mesh(BG.upperArm, shirt, sh, 0, 0, 0);
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      mesh(BG.elbow, shirt, el, 0, 0, 0);
      mesh(BG.foreArm, sleeve, el, 0, 0, 0);
      const hand = new THREE.Group(); hand.position.y = -0.26; el.add(hand);
      mesh(BG.hand, handMat, hand, 0, 0.0, 0);
      mesh(BG.thumb, handMat, hand, -side * 0.01, -0.028, 0.036).rotation.set(-0.45, 0, 0);
      return { sh, el, hand };
    };
    const leg = (side) => {
      const hp = new THREE.Group(); hp.position.set(side * (B.hip * 0.5 - 0.085 * K), -0.04, 0); hips.add(hp);
      mesh(BG.thigh, pants, hp, 0, 0, 0);
      const kn = new THREE.Group(); kn.position.y = -0.45; hp.add(kn);
      mesh(BG.knee, pants, kn, 0, 0, 0.004);
      mesh(BG.shin, pants, kn, 0, 0, 0);
      const ft = new THREE.Group(); ft.position.y = -0.43; kn.add(ft);
      mesh(BG.shoe, shoes, ft, 0, -0.026, 0.03);
      mesh(BG.sole, sole, ft, 0, -0.03, 0.03);
      return { hp, kn, ft };
    };
    const la = arm(1), ra = arm(-1), ll = leg(1), rl = leg(-1);
    // props
    if (this.spec.look === 'worker') {
      const tool = new THREE.Group();
      mesh(G.grinder, this._mat('#2b6cb0', 0.5), tool, 0, 0, 0.12);
      const disc = mesh(G.disc, this._mat('#9aa0a6', 0.3), tool, 0.05, 0, 0.26);
      disc.rotation.z = Math.PI / 2;
      ra.hand.add(tool); tool.position.set(0, -0.04, 0); tool.rotation.x = -Math.PI / 2;
      this.tool = tool;
    }
    if (this.spec.look === 'vendor') {
      const t = mesh(G.tongs, this._mat('#aab0b6', 0.3), ra.hand, 0, -0.05, 0.1); t.rotation.x = -1.2;
      this.lighterMesh = mesh(G.lighter, this._mat('#d22a1e', 0.4), la.hand, 0, -0.045, 0.02);
    }
    if (this.spec.id === 'customer') { const ph = mesh(G.phone, this._mat('#111418', 0.2), ra.hand, 0, -0.03, 0.04); ph.rotation.x = -0.4; this.phone = ph; }
    this.root = root;
    this.j = { body, hips, spine, neck, head, la, ra, ll, rl };
  }

  _preparePath() {
    const P = this.spec.path;
    this.pathPts = P;
    this.cumDist = [0];
    for (let i = 1; i < P.length; i++) this.cumDist.push(this.cumDist[i - 1] + Math.hypot(P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]));
  }

  // position, travelled distance and facing at time t
  locate(t) {
    const P = this.pathPts;
    if (P.length === 1 || t <= P[0][0]) {
      return { x: P[0][1], z: P[0][2], dist: 0, moving: false, dir: this._dirOf(0, t) };
    }
    for (let i = 1; i < P.length; i++) {
      if (t <= P[i][0]) {
        const f = (t - P[i - 1][0]) / (P[i][0] - P[i - 1][0]);
        return {
          x: P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f, z: P[i - 1][2] + (P[i][2] - P[i - 1][2]) * f,
          dist: this.cumDist[i - 1] + (this.cumDist[i] - this.cumDist[i - 1]) * f, moving: true, dir: this._dirOf(i - 1, t),
        };
      }
    }
    const n = P.length - 1;
    return { x: P[n][1], z: P[n][2], dist: this.cumDist[n], moving: false, dir: this._dirOf(n - 1, t) };
  }
  _dirOf(i, t = 0) {
    if (this.spec.face !== undefined && !(this.spec.faceUntil !== undefined && t >= this.spec.faceUntil)) return Math.PI + MathX.deg(this.spec.face);
    const P = this.pathPts;
    if (P.length < 2) return Math.PI;
    for (let k = Math.min(i, P.length - 2); k >= 0; k--) {
      const a = P[k], b = P[k + 1];
      if (Math.hypot(b[1] - a[1], b[2] - a[2]) > 1e-3) return Math.atan2(b[1] - a[1], b[2] - a[2]);
    }
    for (let k = 0; k < P.length - 1; k++) { const a = P[k], b = P[k + 1]; if (Math.hypot(b[1] - a[1], b[2] - a[2]) > 1e-3) return Math.atan2(b[1] - a[1], b[2] - a[2]); }
    return Math.PI;
  }

  poseAt(t, ctx) {
    const S = this.states;
    let i = 0;
    while (i + 1 < S.length && S[i + 1][0] <= t) i++;
    const [t0, name] = S[i];
    const cur = (ACTIONS[name] || ACTIONS.idle)(t - t0, ctx);
    const blend = BLEND[name] || 0.6;
    if (i > 0 && t - t0 < blend) {
      const [tp, pn] = S[i - 1];
      const prev = (ACTIONS[pn] || ACTIONS.idle)(t - tp, ctx);
      return lerpPose(prev, cur, Ease.inOutSine((t - t0) / blend));
    }
    return cur;
  }

  apply(P) {
    const j = this.j;
    j.hips.position.set(P.rootX, P.hipY, P.rootZ);
    j.hips.rotation.set(P.pelvisPitch, P.pelvisYaw, P.rootRoll);
    j.spine.rotation.set(P.spine, P.spineYaw, P.spineRoll);
    j.neck.rotation.set(P.neck * 0.4, P.headYaw * 0.4, 0);
    j.head.rotation.set(P.neck * 0.6, P.headYaw * 0.6, P.headRoll);
    j.la.sh.rotation.set(-P.lSh[0], 0, P.lSh[1]);
    j.ra.sh.rotation.set(-P.rSh[0], 0, -P.rSh[1]);
    j.la.el.rotation.x = -P.lEl; j.ra.el.rotation.x = -P.rEl;
    j.ll.hp.rotation.set(-P.lHip[0], 0, P.lHip[1]);
    j.rl.hp.rotation.set(-P.rHip[0], 0, -P.rHip[1]);
    j.ll.kn.rotation.x = P.lKnee; j.rl.kn.rotation.x = P.rKnee;
    j.ll.ft.rotation.x = P.lFoot; j.rl.ft.rotation.x = P.rFoot;
  }

  update(t) {
    const loc = this.locate(t);
    const ctx = { seed: this.seed, seedI: this.seedI, walkPhase: (loc.dist / (this.spec.stride || 1.32)) * Math.PI * 2, seat: this.spec.seat };
    this.root.position.set(loc.x, this.spec.y || 0, loc.z);
    this.root.rotation.y = loc.dir;
    this.apply(this.poseAt(t, ctx));
    this.root.updateMatrixWorld(true);
  }

  // world positions used by contact shadows / FX
  worldOf(part, out) { return this.j[part].getWorldPosition(out); }
  handWorld(side, out) { return (side < 0 ? this.j.ra : this.j.la).hand.getWorldPosition(out); }

  // used by the motorcycle
  setRide(t, footDown, slump) {
    const ctx = { seed: this.seed, seedI: this.seedI };
    let p = ACTIONS.ride(t, ctx);
    if (footDown > 0) {
      const f = basePose();
      Object.assign(f, p);
      f.lHip = [0.35, 0.32]; f.lKnee = 0.25; f.lFoot = -0.1;
      p = lerpPose(p, f, footDown);
    }
    if (slump > 0) {
      const s = Object.assign({}, p);
      s.spine = 0.85; s.neck = 0.6; s.lSh = [0.4, 0.3]; s.rSh = [0.5, 0.2]; s.lEl = 0.2; s.rEl = 0.2; s.spineRoll = -0.15;
      p = lerpPose(p, s, slump);
    }
    this.apply(p);
  }
}

class PedestrianSystem {
  constructor(scene) {
    this.people = SCRIPT.people.map((spec) => new Person(spec, scene));
    this.byId = {};
    for (const p of this.people) this.byId[p.spec.id] = p;
    this.blobs = new BlobShadows(scene, this.people.length * 3);
    this._v = new THREE.Vector3();
  }
  update(t) {
    this.blobs.begin();
    for (const p of this.people) {
      p.update(t);
      // soft contact shadows under pelvis, chest and head (follow the pose, so lying bodies get grounded too)
      const gy = p.spec.y || 0;
      for (const [part, r] of [['hips', 0.42], ['neck', 0.34], ['head', 0.22]]) {
        const w = p.worldOf(part, this._v);
        const hgt = Math.max(0, w.y - gy);
        const k = MathX.clamp(1 - hgt / 1.4, 0, 1);
        if (k > 0.02) this.blobs.push(w.x, gy + 0.012, w.z, r * (1.4 - k * 0.5), 0.5 * k);
      }
    }
    this.blobs.end();
  }
}

/* soft dark ground blobs (one instanced draw call) */
class BlobShadows {
  constructor(scene, max) {
    const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2);
    const tex = Tex.softDot();
    this.uOpacity = new Float32Array(max);
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x000000, transparent: true, opacity: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aOpacity; varying float vOpacity;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOpacity = aOpacity;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vOpacity;').replace('#include <map_fragment>', 'vec4 sampledDiffuseColor = texture2D( map, vMapUv ); diffuseColor.a *= sampledDiffuseColor.r * vOpacity;');
    };
    this.mesh = new THREE.InstancedMesh(g, mat, max);
    this.attr = new THREE.InstancedBufferAttribute(this.uOpacity, 1).setUsage(THREE.DynamicDrawUsage);
    this.mesh.geometry.setAttribute('aOpacity', this.attr);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    scene.add(this.mesh);
    this.max = max; this.n = 0;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
    this._e = new THREE.Euler();
  }
  begin() { this.n = 0; }
  push(x, y, z, sx, op, sz = sx, rotY = 0) {
    if (this.n >= this.max) return;
    this._q.setFromEuler(this._e.set(0, rotY, 0));
    this._m.compose(this._p.set(x, y, z), this._q, this._s.set(sx, 1, sz));
    this.mesh.setMatrixAt(this.n, this._m);
    this.uOpacity[this.n] = op;
    this.n++;
  }
  end() { this.mesh.count = this.n; this.mesh.instanceMatrix.needsUpdate = true; this.attr.needsUpdate = true; }
}
