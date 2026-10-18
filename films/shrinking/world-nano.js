/* =====================================================================
   WORLD · NANO (232 → 292 s, nanometres) — too small for light, so it is drawn the way an electron microscope sees:
   grey, with glowing edges. Origin = where you stand on your skin flake; the axes are the bedroom's.
     your hands, in grey · a bacterium beside you; a virus (a T4 phage) lands on its back and injects · more of them
     the air turns to grit: molecules streaking past · a strand of DNA, close · the DNA is made of balls (atoms)
   ===================================================================== */

const SH_NA = { bact: [0, 320, -1100], bactR: 320, bactL: 1700, land: [0, 597.4, -940.5], landN: [0, 0.867, 0.498], dnaZ: -18 };
// where you are: [t, x, z] (nm)
const SH_NA_POS = [[232.2, 0, 0], [243, 0, 0], [249, 0, -260], [258, 0, -300], [263, -2, -260], [272, -6, -3], [278, -11, -8], [284, -15.6, -13.6], [288, -17.0, -16.4], [292.5, -17.4, -17.3]];
// look keys [t, yaw, pitch] (where no aim overrides them)
const SH_NA_DIR = [[232.2, 0.25, 0.12], [236.5, 0.1, 0.2], [239.4, 0.0, -0.05], [240.5, 0.0, -0.32], [244.6, 0.02, -0.2],
  [258.5, -0.15, 0.42], [261.0, -0.55, 0.38], [264.0, -0.2, 0.12], [268.0, 0.35, 0.04], [271.5, 0.15, -0.02], [292.5, 0.1, 0.0]];
// the DNA's axis: an arch over the flake (x in nm)
const shDnaPath = (x) => [x, 1.0 + 3.5 * Math.exp(-Math.pow(x / 12, 2)), SH_NA.dnaZ + 2 * Math.sin(x / 15)];
// the phage's landing: [t, height of the baseplate above the surface (nm)], and the sheath's contraction
const SH_NA_PH = { fall: 244.6, touch: 249.2, seat: 251.0, fire: 252.0, fired: 252.5 };

function shNanoCam(t, h) {
  const [x, z] = shSpline(SH_NA_POS, t);
  let [yw, pt] = shKey(SH_NA_DIR, t);
  let roll = 0;
  const p = [x, 0.93 * h, z];
  // the shoves go on (Brownian), and from 262 the molecules' hits jolt you
  const bk = 0.8 + 0.6 * shWin(t, 262, 286, 2, 3);
  const kick = (sd) => noise1(t * 2.6, sd) * 0.18 + noise1(t * 6.1, sd + 3) * 0.08 + Math.max(0, noise1(t * 1.3, sd + 9)) * 0.2 * Math.sin(t * 9 + sd);
  p[0] += kick(1) * h * bk; p[1] += kick(4) * h * bk * 0.4; p[2] += kick(7) * h * bk;
  yw += kick(11) * 0.07 * bk; pt += kick(13) * 0.05 * bk; roll += kick(17) * 0.06 * bk;
  // hail: sharp jolts at hashed moments
  if (t > 262 && t < 287) {
    const k = Math.floor(t * 5), u = t * 5 - k;
    if (hash1(k * 13 + 1) > 0.6) { const a = Math.exp(-u * 9) * (0.5 + hash1(k * 13 + 2)) * shWin(t, 262, 287, 1.5, 2); p[0] += (hash1(k * 13 + 3) - 0.5) * 0.12 * h * a; p[1] += (hash1(k * 13 + 4) - 0.5) * 0.08 * h * a; yw += (hash1(k * 13 + 5) - 0.5) * 0.05 * a; pt += (hash1(k * 13 + 6) - 0.5) * 0.04 * a; }
  }
  return { p, yaw: yw, pitch: pt, roll };
}

// ---- a T4 bacteriophage: a faceted head, a collar, a ribbed tail sheath around a tube, a hexagonal baseplate and six
// jointed tail fibres. Origin = the baseplate's underside; +y = up the tail. ~200 nm tall.
function shBuildPhage(parent, M) {
  const g = new THREE.Group(); parent.add(g);
  const base = shAddMesh(g, new THREE.CylinderGeometry(26, 30, 10, 6).translate(0, 5, 0), M);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; shAddMesh(g, new THREE.ConeGeometry(3.2, 12, 6).rotateX(Math.PI).translate(0, -4, 0), M, Math.cos(a) * 22, 0, Math.sin(a) * 22); }
  // the sheath: 24 rings (helical ribs read as rings at this size), from y 0 to 98 before it contracts
  const prof = [];
  for (let i = 0; i <= 96; i++) { const y = i / 96 * 98, r = 11.5 + 1.6 * Math.pow(Math.abs(Math.sin(y / 98 * 24 * Math.PI)), 0.6); prof.push(new THREE.Vector2(r, y)); }
  const sheathP = new THREE.Group(); sheathP.position.y = 10; g.add(sheathP);
  const sheath = shAddMesh(sheathP, new THREE.LatheGeometry(prof, 28), M);
  // the head end (collar, head, the tube hanging inside the sheath): moves down as the sheath shortens
  const top = new THREE.Group(); g.add(top);
  shAddMesh(top, new THREE.CylinderGeometry(19, 15, 6, 18).translate(0, 3, 0), M);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.5; const w = shAddMesh(top, new THREE.CylinderGeometry(1.1, 1.1, 30, 4).translate(0, -15, 0), M, Math.cos(a) * 17, 3, Math.sin(a) * 17); w.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); }
  const tf = (1 + Math.sqrt(5)) / 2, hg = new THREE.IcosahedronGeometry(1, 0).rotateZ(Math.atan(1 / tf));
  hg.scale(44, 58, 44); hg.translate(0, 6 + 58 * Math.sqrt(1 + tf * tf) / Math.sqrt(1 + tf * tf), 0);
  const head = shAddMesh(top, hg, M);
  const tube = shAddMesh(top, new THREE.CylinderGeometry(4.6, 4.6, 104, 12).translate(0, -52, 0), M);
  // fibres: proximal and distal struts per leg
  const unit = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0);
  const legs = [];
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; legs.push({ a, s1: shAddMesh(g, unit, M), s2: shAddMesh(g, unit, M), kn: shAddMesh(g, new THREE.SphereGeometry(2.8, 8, 6), M) }); }
  return {
    g, head, top, sheath, tube,
    // land: 0 = fibres hanging (in the air) … 1 = fibres spread on the surface; fire: 0 … 1 = sheath contracted
    pose(land, fire, t) {
      const L = 98 - 61 * fire;
      sheath.scale.set(1 + 0.35 * fire, L / 98, 1 + 0.35 * fire);
      top.position.y = 10 + L;
      legs.forEach((lg, i) => {
        const wob = Math.sin(t * 2.3 + i * 1.7) * 6 * (1 - land);
        const tr = shLerp(62 + wob, 128, land), ty = shLerp(-112, -6, land);
        const [kx, ky] = shIK2(tr - 26, ty - 6, 72, 76);
        const c = Math.cos(lg.a), s = Math.sin(lg.a);
        const P0 = [c * 26, 6, s * 26], P1 = [c * (26 + kx), 6 + ky, s * (26 + kx)], P2 = [c * tr, ty, s * tr];
        shStrut(lg.s1, P0, P1, 2.3); shStrut(lg.s2, P1, P2, 2.0); lg.kn.position.set(...P1);
      });
    },
  };
}

// ---- the air's molecules: pairs of atoms streaking past, re-drawn every frame (far too fast to follow)
function shMolecules(parent, N) {
  const pos = new Float32Array(N * 2 * 3), line = new Float32Array(N * 2 * 3);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.ShaderMaterial({
    uniforms: { uS: { value: 1 }, uPx: { value: 540 }, uOp: { value: 0 }, uSz: { value: 0.3 } }, transparent: true, depthWrite: false, fog: false,
    vertexShader: /* glsl */`uniform float uS, uPx, uSz; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = -mv.z; gl_PointSize = clamp(uSz * uS * uPx / max(d, 1e-4), 0.0, 46.0);
        vA = smoothstep(0.25, 0.8, d) * smoothstep(1.0, 2.5, gl_PointSize); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform float uOp; varying float vA;
      void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
        float l = 0.42 + 0.3 * sqrt(max(0.0, 1.0 - r)) + 0.35 * pow(r, 3.0); gl_FragColor = vec4(vec3(l), uOp * vA * smoothstep(1.0, 0.8, r)); }`,
  });
  const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; pts.renderOrder = 6; parent.add(pts);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(line, 3));
  const lm = new THREE.LineBasicMaterial({ color: '#ffffff', vertexColors: true, transparent: true, opacity: 0, depthWrite: false });
  const lc = new Float32Array(N * 2 * 3); for (let i = 0; i < N; i++) lc.set([0.75, 0.75, 0.75, 0, 0, 0], i * 6); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  const lines = new THREE.LineSegments(lg, lm); lines.frustumCulled = false; lines.renderOrder = 5; parent.add(lines);
  return {
    pts, lines,
    update(t, c, h, s, px, k) {
      pm.uniforms.uS.value = s; pm.uniforms.uPx.value = px; pm.uniforms.uOp.value = 0.8 * k; lm.opacity = 0.5 * k;
      pts.visible = lines.visible = k > 0.001;
      if (!pts.visible) return;
      const f = Math.floor(t * 30), R = 2.6 * h;
      // air holds one molecule per ~37 nm³ (3.3 nm apart): show that many in the box around you, at most N
      const n = Math.min(N, Math.round(Math.pow(2 * R / 3.3, 3)));
      pg.setDrawRange(0, n * 2); lg.setDrawRange(0, n * 2);
      for (let i = 0; i < n; i++) {
        const q = (j) => hash1(i * 17 + j + f * 7919);
        const x = c[0] + (q(1) * 2 - 1) * R, y = Math.max(0.2, c[1] + (q(2) * 2 - 1) * R * 0.7), z = c[2] + (q(3) * 2 - 1) * R;
        // the bond (0.11 nm) and a random direction of travel (the streak is where it was a moment ago)
        const u = q(4) * 2 - 1, a = q(5) * 6.283, w = Math.sqrt(1 - u * u), b = [w * Math.cos(a), u, w * Math.sin(a)];
        const u2 = q(6) * 2 - 1, a2 = q(7) * 6.283, w2 = Math.sqrt(1 - u2 * u2), v = [w2 * Math.cos(a2), u2, w2 * Math.sin(a2)], sl = h * (0.06 + 0.16 * q(8));
        pos.set([x - b[0] * 0.055, y - b[1] * 0.055, z - b[2] * 0.055, x + b[0] * 0.055, y + b[1] * 0.055, z + b[2] * 0.055], i * 6);
        line.set([x, y, z, x - v[0] * sl, y - v[1] * sl, z - v[2] * sl], i * 6);
      }
      pg.attributes.position.needsUpdate = true; lg.attributes.position.needsUpdate = true;
    },
  };
}

SH_WORLDS.nano = (app) => {
  const W = shMakeWorld(60), R = W.root;
  W.scene.background = new THREE.Color('#1c1c1c');
  W.scene.fog = new THREE.FogExp2('#262626', 0.0035);
  W.scene.environment = shEnv(app.renderer, '#9a9a9a', '#5a5a5a', '#262626');
  W.scene.environmentIntensity = 0.35;
  const procMats = [];
  const semProc = (key, color, glsl, k = 0.9, rough = 0.55) => { const m = shSemify(shProcStd({ key, mat: { color, roughness: rough }, glsl }), k, key); procMats.push(m); return m; };

  // ---- the flake: dead skin's surface, ridged plates, lumps of protein and fat down to a fraction of a nanometre
  const groundM = semProc('naGround', '#a8a8a8', /* glsl */`
    float procH(vec3 p, float pix){
      vec2 c = shCell(p.xz / 900.0); float h = (1.0 - smoothstep(0.0, 0.1, c.y - c.x)) * 40.0 * shLod(90.0, pix);
      float a = 18.0, f = 1.0 / 260.0;
      for (int i = 0; i < 12; i++) { h += a * (shVN(p.xz * f + float(i) * 3.7) - 0.5) * shLod(0.6 / f, pix); f *= 2.1; a *= 0.5; }
      h += 0.12 * smoothstep(0.55, 0.85, shVN(p.xz * 4.0)) * shLod(0.08, pix);
      return h;
    }
    vec3 procC(vec3 p, float pix, vec3 b){ return b * (0.86 + 0.18 * shVN(p.xz / 400.0)); }`, 0.8, 0.7);
  const ground = new THREE.Mesh(shPolarGround(400000, 0.4, -12, -12), groundM);   // (centred where the DNA scenes happen)
  ground.receiveShadow = true; R.add(ground);

  // ---- the bacterium beside you (and more behind): rods with a softly wrinkled wall
  const bactM = semProc('naBact', '#b4b4b4', /* glsl */`
    float procH(vec3 p, float pix){
      float h = (shVN3(p * 0.004) - 0.5) * 16.0 * shLod(60.0, pix) + (shVN3(p * 0.02) - 0.5) * 5.0 * shLod(12.0, pix);
      h += (shVN3(p * 0.11) - 0.5) * 1.6 * shLod(2.5, pix) + (shVN3(p * 0.6) - 0.5) * 0.35 * shLod(0.5, pix) + (shVN3(p * 3.0) - 0.5) * 0.08 * shLod(0.1, pix);
      return h;
    }
    vec3 procC(vec3 p, float pix, vec3 b){ return b * (0.92 + 0.1 * shVN3(p * 0.003)); }`, 1.0, 0.5);
  const rodG = new THREE.CapsuleGeometry(SH_NA.bactR, SH_NA.bactL, 24, 72).rotateZ(Math.PI / 2);
  const bact = shAddMesh(R, rodG, bactM, ...SH_NA.bact);
  for (const [x, z, ry, sc] of [[-2300, -2600, 0.6, 1.1], [2100, -2300, -0.4, 0.9], [-3400, 300, 1.3, 1.0], [3000, 900, 2.0, 1.15], [600, -4200, 0.2, 1.0]]) {
    const m = shAddMesh(R, rodG, bactM, x, SH_NA.bactR * sc, z); m.rotation.y = ry; m.scale.setScalar(sc);
  }
  { const cocG = new THREE.SphereGeometry(480, 48, 32), r = new RNG(5);
    for (const [cx, cz] of [[-1500, -1700], [1700, 600], [-900, 2200]]) for (let i = 0; i < 7; i++) shAddMesh(R, cocG, bactM, cx + r.gauss() * 700, 470 + Math.abs(r.gauss()) * 200, cz + r.gauss() * 700); }
  // soot: little chains of fused spheres lying around you
  const sootM = shSemify(shStd('#9c9c9c', 0.7), 1.1, 'soot');
  { const r = new RNG(9), sg = new THREE.SphereGeometry(1, 14, 10);
    for (let k = 0; k < 26; k++) {
      let x = r.range(-900, 900), z = r.range(-650, 500), y = 0; if (Math.hypot(x, z) < 160) continue;
      const rr = r.range(10, 26);
      for (let i = 0; i < r.int(5, 16); i++) { const m = shAddMesh(R, sg, sootM, x, y + rr * 0.8, z); m.scale.setScalar(rr * r.range(0.8, 1.15)); x += r.gauss() * rr * 1.4; z += r.gauss() * rr * 1.4; y = Math.max(0, y + r.gauss() * rr * 0.6); }
    } }

  // ---- the phage that lands, and the others already there (and more still falling)
  const phM = shSemify(shStd('#c6c6c6', 0.42), 1.0, 'phage');
  const ph = shBuildPhage(R, phM);
  const others = [];
  { const r = new RNG(31), C = SH_NA.bact;
    for (let i = 0; i < 16; i++) {
      // a spot on the rod's upper surface: along it (x) and round it (angle from straight up, + towards you)
      const x = r.range(-1050, 1050), ang = r.range(-1.25, 1.35);
      if (Math.abs(x) < 170 && Math.abs(ang - 0.52) < 0.4) continue;
      const n = [0, Math.cos(ang), Math.sin(ang)], q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...n));
      const o = shBuildPhage(R, phM); o.g.position.set(x, C[1] + n[1] * SH_NA.bactR, C[2] + n[2] * SH_NA.bactR); o.g.quaternion.copy(q); o.g.rotateY(r.range(0, 6.283));
      o.pose(1, r.chance(0.7) ? 1 : 0, 0); o.g.visible = false; others.push(o);
    }
    for (let i = 0; i < 4; i++) { const o = shBuildPhage(R, phM); o.fall = [r.range(-900, 900), r.range(1600, 2600), r.range(-1500, -700), r.range(0, 6.3)]; o.g.visible = false; others.push(o); }
  }

  // ---- the DNA: a double helix along an arch (two backbones and the base pairs), and the atoms it is made of
  const dna = new THREE.Group(); R.add(dna);
  const dnaU = { uIn: { value: 0 }, uGrow: { value: 1 } };
  const shrinkIn = (m, key, k) => { const prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { prev(sh, r); sh.uniforms.uIn = dnaU.uIn; sh.vertexShader = 'uniform float uIn;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed -= objectNormal * uIn * ${k.toFixed(3)};`); }; const pk = m.customProgramCacheKey; m.customProgramCacheKey = () => pk() + key; return m; };
  const bbM = shrinkIn(shSemify(shStd('#a8a8a8', 0.45), 0.7, 'dnabb'), 'bbIn', 0.30);
  const rungM = shrinkIn(shSemify(new THREE.MeshStandardMaterial({ color: '#c8c8c8', roughness: 0.5 }), 0.7, 'dnarung'), 'rungIn', 0.85);
  const atomM = shSemify(new THREE.MeshStandardMaterial({ color: '#c0c0c0', roughness: 0.45 }), 0.7, 'dnaatom');
  { const prev = atomM.onBeforeCompile; atomM.onBeforeCompile = (sh, r) => { prev(sh, r); sh.uniforms.uGrow = dnaU.uGrow; sh.vertexShader = 'uniform float uGrow;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed *= uGrow;'); }; const pk = atomM.customProgramCacheKey; atomM.customProgramCacheKey = () => pk() + 'grow'; }
  const BP = 0.338, TW = 2 * Math.PI / 10.5, GAP = 2.4;
  // arc-length table along the arch
  const xs = [], ss = []; { let s = 0, prev = shDnaPath(-95); for (let x = -95; x <= 95; x += 0.05) { const p = shDnaPath(x); s += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]); xs.push(x); ss.push(s); prev = p; } }
  const atS = (s) => { let lo = 0, hi = ss.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ss[m] < s) lo = m; else hi = m; } const u = (s - ss[lo]) / Math.max(1e-9, ss[hi] - ss[lo]); return xs[lo] + (xs[hi] - xs[lo]) * u; };
  const frameAt = (s) => {
    const x = atS(s), p = shDnaPath(x), p2 = shDnaPath(x + 0.05), T = shN3([p2[0] - p[0], p2[1] - p[1], p2[2] - p[2]]);
    const U = shN3([T[2], 0, -T[0]]), V = [U[1] * T[2] - U[2] * T[1], U[2] * T[0] - U[0] * T[2], U[0] * T[1] - U[1] * T[0]];
    return { p, T, U, V };
  };
  const at = (F, r, th, ax = 0) => [F.p[0] + (F.U[0] * Math.cos(th) + F.V[0] * Math.sin(th)) * r + F.T[0] * ax, F.p[1] + (F.U[1] * Math.cos(th) + F.V[1] * Math.sin(th)) * r + F.T[1] * ax, F.p[2] + (F.U[2] * Math.cos(th) + F.V[2] * Math.sin(th)) * r + F.T[2] * ax];
  const nbp = Math.floor(ss[ss.length - 1] / BP) - 1, bbA = [], bbB = [];
  const rungs = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0), rungM, nbp * 2);
  const greys = [0.95, 0.72, 0.55, 0.38].map((g) => new THREE.Color(g, g, g));      // the four letters, four greys
  const atoms = []; const dum = new THREE.Object3D(), rr = new RNG(44);
  for (let i = 0; i < nbp; i++) {
    const s = (i + 0.5) * BP, F = frameAt(s), th = i * TW;
    for (let q = 0; q < 3; q++) { const F2 = frameAt(s + q * BP / 3), th2 = th + q * TW / 3; bbA.push(new THREE.Vector3(...at(F2, 0.93, th2))); bbB.push(new THREE.Vector3(...at(F2, 0.93, th2 + GAP))); }
    // the base pair: from each sugar (r 0.7) to the middle of the chord between them
    const sa = at(F, 0.7, th + 0.22, 0.1), sb = at(F, 0.7, th + GAP - 0.22, 0.1), mid = shMix3(sa, sb, 0.5);
    const L = rr.int(0, 3), Lp = 3 - L;                 // A–T, G–C pairs
    dum.position.set(...sa); shStrut(dum, sa, mid, 0.21); dum.updateMatrix(); rungs.setMatrixAt(i * 2, dum.matrix); rungs.setColorAt(i * 2, greys[L]);
    shStrut(dum, sb, mid, 0.21); dum.updateMatrix(); rungs.setMatrixAt(i * 2 + 1, dum.matrix); rungs.setColorAt(i * 2 + 1, greys[Lp]);
    // atoms, only for the stretch you get close to
    if (F.p[0] > -42 && F.p[0] < 6) for (const [st, sug, base, sgn] of [[th, sa, mid, 1], [th + GAP, sb, mid, -1]]) {
      const P = at(F, 0.93, st); atoms.push([P, 0.19, 0.82]);
      for (const [dr, dth, dax] of [[0.14, 0, 0], [0, 0.17, 0.05], [0, -0.17, 0.05], [0.02, 0, 0.15]]) atoms.push([at(F, 0.93 + dr, st + dth, dax), 0.15, 0.95]);
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; atoms.push([at(F, 0.7 + Math.cos(a) * 0.12, st + sgn * 0.22 + Math.sin(a) * 0.15, 0.1 + Math.sin(a) * 0.05), 0.165, 0.7]); }
      const ch = [base[0] - sug[0], base[1] - sug[1], base[2] - sug[2]], side = shN3([ch[1] * F.T[2] - ch[2] * F.T[1], ch[2] * F.T[0] - ch[0] * F.T[2], ch[0] * F.T[1] - ch[1] * F.T[0]]);
      const gl = sgn > 0 ? greys[L].r : greys[Lp].r;
      for (let k = 0; k < 8; k++) { const f = 0.18 + k * 0.1, o = (k % 2 ? 1 : -1) * 0.11; atoms.push([[sug[0] + ch[0] * f + side[0] * o, sug[1] + ch[1] * f + side[1] * o, sug[2] + ch[2] * f + side[2] * o], 0.158, gl]); }
    }
  }
  rungs.instanceMatrix.needsUpdate = true; rungs.instanceColor.needsUpdate = true; rungs.castShadow = rungs.receiveShadow = true; dna.add(rungs);
  for (const pts of [bbA, bbB]) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.32, 10), bbM); m.castShadow = m.receiveShadow = true; dna.add(m); }
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), atomM, atoms.length);
  atoms.forEach(([p, r, g], i) => { dum.position.set(...p); dum.quaternion.identity(); dum.scale.setScalar(r * 0.96); dum.updateMatrix(); balls.setMatrixAt(i, dum.matrix); balls.setColorAt(i, new THREE.Color(g, g, g)); });
  balls.instanceMatrix.needsUpdate = true; balls.instanceColor.needsUpdate = true; balls.castShadow = balls.receiveShadow = true; balls.visible = false; dna.add(balls);

  // ---- the air's molecules
  const mol = shMolecules(R, 2600);

  // ---- your hands, in grey
  const hands = new ViewerHands(W.camera, {
    skin: '#b0b0b0', sleeve: '#6a6a6a', cuff: '#555555', watch: true,
    poses: { shield: { p: [0.085, -0.05, -0.3], F: [-0.3, 1, 0.12], N: [-0.15, 0.1, -1], curl: [0.1, 0.12, 0.14, 0.18], thumb: [0.5, 0.1] } },
    blends: { shield: 0.35 },
    script: { right: [[0, 'hidden'], [239.6, 'look'], [245.0, 'hidden'], [268.9, 'shield'], [272.8, 'hidden']], left: [[0, 'hidden'], [239.9, 'look'], [244.8, 'hidden'], [269.1, 'shield'], [272.6, 'hidden']] },
  });
  hands.root.scale.setScalar(1 / 1.75);
  for (const m of Object.values(hands.mats)) shSemify(m, 1.0, 'hand' + m.name);

  // ---- light: the 'detector' above your left shoulder, a soft grey fill
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; R.add(key, key.target);
  const hemi = new THREE.HemisphereLight('#bdbdbd', '#3a3a3a', 0.6); R.add(hemi);
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion();

  const api = {
    scene: W.scene, camera: W.camera, W, hands, ph, others, dna, balls, mol,
    frame(t, h, app) {
      const hN = h * 1e9, s = W.setH(hN), cam = shNanoCam(t, hN);
      // the phage: drifts down, its fibres touch, the baseplate settles, the sheath fires
      const L = SH_NA.land, N = SH_NA.landN, P = SH_NA_PH;
      const fallU = shE(t, P.fall, P.touch, (x) => 1 - Math.pow(1 - x, 2.2));
      const land = shE(t, P.touch - 0.3, P.seat), fire = shE(t, P.fire, P.fired, (x) => x * x * (3 - 2 * x));
      const hover = (1 - fallU) * 1500 + 112 * (1 - land);
      const drift = [Math.sin(t * 0.9) * 40 * (1 - fallU) + noise1(t * 1.4, 3) * 25 * (1 - land), 0, Math.cos(t * 0.7) * 30 * (1 - fallU)];
      ph.g.position.set(L[0] + N[0] * hover + drift[0], L[1] + N[1] * hover, L[2] + N[2] * hover + drift[2]);
      ph.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _v.set(N[0] + 0.25 * (1 - land) * Math.sin(t * 1.1), N[1], N[2] + 0.2 * (1 - land) * Math.cos(t * 0.8)).normalize());
      ph.g.rotateY(0.4 + 0.3 * (1 - land) * Math.sin(t * 0.5));
      ph.pose(land, fire, t);
      ph.g.visible = t > P.fall - 0.2;
      // after firing the head is a little darker (its DNA has gone into the cell)
      phM.userData.semK.value = 1.0;
      // the others: appear as you look along the rod; a few still falling from above
      for (const o of others) {
        o.g.visible = t > 253.5;
        if (o.fall) { const [fx, fy, fz, ph0] = o.fall, u = (t - 253.5) * 0.06; o.g.position.set(fx + Math.sin(t * 0.8 + ph0) * 60, fy - u * 900, fz + Math.cos(t * 0.6 + ph0) * 50); o.g.rotation.set(Math.sin(t * 0.7 + ph0) * 0.3, t * 0.3 + ph0, Math.cos(t * 0.5 + ph0) * 0.3); o.pose(0, 0, t + ph0); }
      }
      // look: keys, with aims at the phage and then the DNA
      let dir = shDir(cam.yaw, cam.pitch);
      const aimAt = (p, k) => { if (k > 0) dir = shN3(shMix3(dir, shN3([p[0] - cam.p[0], p[1] - cam.p[1], p[2] - cam.p[2]]), Math.min(1, k))); };
      const hp = [ph.g.position.x + N[0] * 90, ph.g.position.y + N[1] * 90, ph.g.position.z + N[2] * 90];
      aimAt(hp, 0.92 * shWin(t, 245.4, 257.8, 1.4, 1.6));
      const dk = shWin(t, 272.4, 293, 1.6, 0.5);
      if (dk > 0) { const dx = shLerp(-1.5, -17.2, shE(t, 273, 289)), dp = shDnaPath(dx); aimAt([dp[0], dp[1] + 0.3, dp[2]], 0.9 * dk); }
      W.lookDir(cam.p, dir, cam.roll);
      W.camera.fov = 60; shClip(W.camera, 0.04, 4000);
      // the DNA: the smooth model gives way to its atoms
      const bk = shE(t, 286.0, 288.6);
      balls.visible = bk > 0; dnaU.uGrow.value = 0.55 + 0.45 * bk; dnaU.uIn.value = shE(t, 287.4, 289.0);
      dna.children.forEach((c) => { if (c !== balls) c.visible = dnaU.uIn.value < 0.999; });
      dna.visible = t > 262;
      // the molecules
      const mk = shE(t, 259.6, 262.5) * (1 - 0.6 * shE(t, 285, 289));
      mol.update(t, cam.p, hN, s, app.renderer.getDrawingBufferSize(_v).y / 2 / Math.tan(THREE.MathUtils.degToRad(30)), mk);
      // the light comes from above your left shoulder (camera space), shadows around where you look
      _q.copy(W.camera.quaternion); const ld = _v.set(-0.45, 0.75, 0.35).applyQuaternion(_q); ld.y = Math.abs(ld.y) + 0.3; ld.normalize();
      const tg = [cam.p[0] + dir[0] * 3 * hN, Math.max(0, cam.p[1] + dir[1] * 3 * hN), cam.p[2] + dir[2] * 3 * hN];
      key.target.position.set(...tg); key.position.set(tg[0] + ld.x * 60 * hN, tg[1] + ld.y * 60 * hN, tg[2] + ld.z * 60 * hN);
      shShadowBox(key, 14 * hN, 1 * hN, 140 * hN, s); key.shadow.normalBias = 0.02;
      for (const m of procMats) m.userData.uS.value = s;
      hands.update(t);
      if (window.SH_DBG && SH_DBG.nano) SH_DBG.nano(api, t, h);
    },
    grade(t, p) {
      p.saturation = 0.0; p.contrast = 1.16; p.grain = 0.065; p.soft = 0.1; p.vignette = 0.62; p.bloom = 0.28; p.bloomThreshold = 0.9;
      p.warmth = 0.0; p.exposure = 1.0; p.edgeBlur = 0.2; p.blackLift = 0.02; p.ao = 0.6;
    },
  };
  return api;
};
