/* =====================================================================
   WORLD — the film's one set: your kitchen on the fifth floor (room.js; its window looks south over the street and the
   park), the street and the park (street.js), what was moving out there (things.js), the people and the dog (cast.js),
   your cat (animals.js), you, and the Sunday afternoon sky (late October, 2 PM, the sun in the south-south-west).
   Every shot (shots.js) is a mode: story time s comes from the one clock (script.js: saStoryAt), the world is posed
   with it (pure), and the mode places the camera.
   At 2:00 you sit at the table pouring water from a jug into a glass (your right hand); your tea steams by it; the
   radio plays on the sill; your cat jumps off the table. Seen from outside you are a person in a chair (cast rig, its
   right hand on the jug's handle); through your own eyes, your hands (ViewerHands, posed onto the jug every frame).
   ===================================================================== */

const saAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ---------------------------------------------------------------------------------------------------------------------
// YOU, THE JUG, THE STREAM (room-local)
// ---------------------------------------------------------------------------------------------------------------------
const SA_YOU = { x: -0.1, z: 0.57, eye: [-0.1, 1.17, 0.43] };            // in the chair on the near side of the table
const SA_JUG = { base: [0.335, 1.052, 0.17], tilt: 1.0, v0: 0.35, lip: [0.078, 0.19, 0], grip: [-0.108, 0.112, 0] };
// the jug's quaternion: its lip (local +x) turned to the west wall's opposite (−x) and dipped by the tilt
const saJugQ = () => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -SA_JUG.tilt));
const saJugPt = (p) => new THREE.Vector3(...p).applyQuaternion(saJugQ()).add(new THREE.Vector3(...SA_JUG.base)).toArray();
const SA_LIP = saJugPt(SA_JUG.lip), SA_GRIP = saJugPt(SA_JUG.grip);
const SA_LIPV = (() => { const d = new THREE.Vector3(1, 0, 0).applyQuaternion(saJugQ()).multiplyScalar(SA_JUG.v0); return [d.x, d.y, d.z]; })();
// the stream: where water that left the lip τ seconds of flight ago is (room-local)
const saStreamPt = (tau) => [SA_LIP[0] + SA_LIPV[0] * tau, SA_LIP[1] + SA_LIPV[1] * tau - 4.905 * tau * tau, SA_LIP[2] + SA_LIPV[2] * tau];
// the glass sits where the stream comes down (its middle under the stream at the water's surface)
const SA_GLASS_AT = (() => { let tau = 0.2; for (let k = 0; k < 30; k++) { const y = saStreamPt(tau)[1] - (SA_GLASS.at[1] + 0.065); tau -= y / (-SA_LIPV[1] + 9.81 * tau) * -1; } const p = saStreamPt(tau); return [p[0] + 0.004, SA_GLASS.at[1], p[2]]; })();
// the water in the glass: its height (m above the glass's base) — rising while you pour, held for the three seconds
function saGlassLevel(s) { const e = s < 0 ? s : s < SAP.T ? 0 : s - SAP.T; return MathX.clamp(0.052 + 0.016 * e + (s >= SAP.T ? 0.004 * saSm(e, 0.12, 0.4) : 0), 0.012, 0.1); }
// how long a drop takes from the lip down to the water in the glass
const saStreamFall = (s) => { const top = SA_GLASS_AT[1] + 0.012 + saGlassLevel(s); let tau = 0.2; for (let k = 0; k < 30; k++) { const f = saStreamPt(tau)[1] - top; tau -= f / (SA_LIPV[1] - 9.81 * tau); } return tau; };

// ---------------------------------------------------------------------------------------------------------------------
// YOUR CAT (room-local): it sits on the far side of the table, crouches and jumps for the floor at SA.sJump; at 2:00 the
// air holds it 46 cm up (3 m/s: physics.js SA_SPD.cat); at 2:00:03 it drops from rest and lands on its feet.
// ---------------------------------------------------------------------------------------------------------------------
Object.assign(SA_CATP, { sit: [-0.3, 0.75, -0.28], v0: [-1.6, 0.5, -0.5], hc: 0.2 });
SA_CATP.yaw = Math.atan2(SA_CATP.v0[0], SA_CATP.v0[2]);
const SA_CAT_LOCK = (() => { const P = SA_CATP, u = -SA.sJump; return { p: [P.sit[0] + P.v0[0] * u, P.sit[1] + P.v0[1] * u - 4.905 * u * u, P.sit[2] + P.v0[2] * u], v: [P.v0[0], P.v0[1] - 9.81 * u, P.v0[2]] }; })();
SA_CAT_LOCK.speed = Math.hypot(...SA_CAT_LOCK.v);
const _saCx2 = new THREE.Vector3(1, 0, 0);
function saCatState(s) {
  const P = SA_CATP, s0 = SA.sJump, qOf = (yaw, pitch = 0) => new THREE.Quaternion().setFromAxisAngle(_saCy, yaw).multiply(new THREE.Quaternion().setFromAxisAngle(_saCx2, pitch));
  if (s < s0) { const k = saSm(s, s0 - 0.45, s0 - 0.05);
    return { p: P.sit.slice(), q: qOf(P.yaw + 0.5 * (1 - k)), pose: saQuadPose({ crouch: 0.15 + 0.6 * k, head: [0.2 - 0.5 * k, 0.4 * (1 - k) * Math.sin(s * 0.8)], tail: [0.5, 0.5 * Math.sin(s * 1.4)] }) }; }
  const L = SA_CAT_LOCK, u = Math.min(s, 0) - s0;
  if (s < SAP.T) {                                                                 // in the air (held from 2:00)
    const p = [P.sit[0] + P.v0[0] * u, P.sit[1] + P.v0[1] * u - 4.905 * u * u, P.sit[2] + P.v0[2] * u], pitch = 0.35 * saSm(u, 0.05, 0.3);
    return { p, q: qOf(P.yaw, pitch), pose: saQuadPose({ stretch: 0.75 * saSm(u, 0.0, 0.18), head: [-0.15, 0], tail: [0.05, 0.6], crouch: 0 }), air: true };
  }
  const r = s - SAP.T, tf = Math.sqrt(2 * L.p[1] / SAP.g);
  if (r < tf) return { p: [L.p[0], L.p[1] - 4.905 * r * r, L.p[2]], q: qOf(P.yaw, 0.35 * (1 - r / tf)), pose: saQuadPose({ stretch: 0.75, head: [-0.15, 0], tail: [0.05, 0.6] }), air: true };
  const v = r - tf;                                                                // on the floor: it crouches, then trots off
  const d = 0.5 * saSm(v, 1.2, 3.5), dir = [Math.sin(P.yaw - 0.8), Math.cos(P.yaw - 0.8)];
  return { p: [L.p[0] + dir[0] * d, 0, L.p[2] + dir[1] * d], q: qOf(P.yaw - 0.8 * saSm(v, 0.6, 1.4)), pose: saQuadPose({ crouch: 0.85 * Math.exp(-v / 0.25) + 0.1, gait: v > 1.2 && v < 3.5 ? v * 10 : null, head: [0.3 * Math.exp(-v / 0.5), 0.5 * Math.sin(v * 1.4)], tail: [0.7, 0.4 * Math.sin(v * 4)] }) };
}

// your hands (first person: only in your own eyes' shots)
function saHandScript() { return { right: [[-9, 'jug']], left: [[-9, 'rest']] }; }
const SA_HAND_MODES = new Set(['you', 'countB', 'release']);
// the eye shots: you see through your own eyes (your body hidden)
const SA_EYE_MODES = SA_HAND_MODES;

// ---------------------------------------------------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------------------------------------------------
SA_SETS.world = (app) => {
  const S = saSet(app, { sky: '#9fbcd8', fov: 50, near: 0.02, far: 30000, hemi: ['#d6e2ef', '#6f6252', 0.6], sun: SA_SUN.map((x) => x * 60), sunI: 3.4, sunColor: '#ffe6c4',
    shadow: 2048, shadowR: 10, shadowFar: 340, env: ['#8db4dc', '#ead8c0', '#6c6256'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  scene.fog = new THREE.FogExp2('#cdd8e2', 0.0011);
  const sky = saGradSky(scene, '#3a74c0', '#cfdde8', '#7a766c', { sunDir: SA_SUN, sunGlow: '#ffd9a8', hw: 0.3, r: 20000 });
  const R = saBuildRoom(S), T = saBuildStreet(S), X = saBuildThings(S, T), C = saBuildCast(S, T, X);
  const RL = (x, y, z) => R.toWorld(x, y, z).toArray();
  // ---- the jug (posed once: it doesn't move while you pour), the glass under the stream
  R.jug.position.set(...SA_JUG.base); R.jug.quaternion.copy(saJugQ()); R.jugWater.visible = false;
  R.glassG.position.set(...SA_GLASS_AT);
  // ---- your cat
  const cat = saBuildQuad(SA_CAT); R.room.add(cat.root);
  // ---- you: in the chair, your right hand on the jug's handle, your left hand on the table by your tea
  const you = new Person({ id: 'saYou', look: 'casual3' }, null); R.room.add(you.root);
  you.root.position.set(SA_YOU.x, 0, SA_YOU.z); you.root.rotation.y = Math.PI;
  { const p = SA_POSES.sit(); p.neck = 0.42; p.spine = 0.12; p.headYaw = -0.15; p.lSh = [0.75, 0.05]; p.lEl = 1.0; p.rSh = [1.0, -0.1]; p.rEl = 0.8;
    // reach: a small search for the arm angles that put the right wrist at the jug's handle, the left on the table
    const tgtR = new THREE.Vector3(...RL(SA_GRIP[0] + 0.02, SA_GRIP[1] - 0.02, SA_GRIP[2] + 0.05)), tgtL = new THREE.Vector3(...RL(-0.36, 0.8, 0.22)), w = new THREE.Vector3();
    const err = (side) => { you.apply(p); you.root.updateMatrixWorld(true); (side > 0 ? you.j.ra : you.j.la).hand.getWorldPosition(w); return w.distanceTo(side > 0 ? tgtR : tgtL); };
    for (const side of [1, -1]) { const sh = side > 0 ? 'rSh' : 'lSh', el = side > 0 ? 'rEl' : 'lEl';
      let st = 0.3; for (let it = 0; it < 120; it++) { let best = err(side), moved = false;
        for (const [k, i] of [[sh, 0], [sh, 1], [el, -1]]) for (const d of [st, -st]) {
          if (i < 0) p[k] += d; else p[k] = [i === 0 ? p[k][0] + d : p[k][0], i === 1 ? p[k][1] + d : p[k][1]];
          const e = err(side); if (e < best - 1e-5) { best = e; moved = true; } else if (i < 0) p[k] -= d; else p[k] = [i === 0 ? p[k][0] - d : p[k][0], i === 1 ? p[k][1] - d : p[k][1]]; }
        if (!moved) st *= 0.6; if (st < 0.002) break; } }
    you.apply(p); you.pose = p; }
  // your hands (first person)
  const hands = new ViewerHands(cam, { script: saHandScript(), poses: {}, blends: {}, skin: '#c9967a', nail: '#e2bba8', sleeve: '#5a6a5a', cuff: '#4a5a4a', watch: true, sleeveLen: 0.34 });
  // the light that bounces round your kitchen
  const fillA = new THREE.PointLight('#fff1dc', 0, 7, 1.4), fillB = new THREE.PointLight('#dce8f6', 0, 7, 1.4), fillC = new THREE.PointLight('#ffe8cc', 0, 5, 1.6);
  R.room.add(fillA, fillB, fillC); fillA.position.set(0.2, 0.9, -0.4); fillB.position.set(0.3, 1.9, -1.5); fillC.position.set(-1.6, 1.4, 0.3);
  const drops = saPuffs(scene, 9000, { soft: 1.2, near: [0.06, 0.22] });
  const glow = saPuffs(scene, 2400, { soft: 2.2, additive: true, near: [0.05, 0.18] });
  const set = {
    scene, camera: cam, R, T, C, X, hands, cat, you,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = saStoryAt(t), rate = saRateAt(t), k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._s = s; this._shot = shot; this._rate = rate; this._t = t;
      // ------------------------------------------------------------------ pose the world first (cameras follow some things)
      T.update(s, { t, mode: m });
      T.M.water.opacity = m === 'carp' ? 0.6 : 0.92;
      const roomDrops = [], worldDrops = [];
      X.update(s, { mode: m, drops: worldDrops, smoke: SA_SMOKE_MODES.has(m) });
      C.update(s);
      const cs = saCatState(s); cat.root.position.set(cs.p[0], cs.p[1], cs.p[2]); cat.root.quaternion.copy(cs.q); saPoseQuad(cat, cs.pose); this._cat = cs;
      R.update(s, {});
      this.stream(s, roomDrops);
      const eye = SA_EYE_MODES.has(m); you.root.visible = !eye;
      // ------------------------------------------------------------------ the camera
      const v = { p: [0, 2, -5], at: [0, 1, 0], fov: 50, drift: 0.004, sh: { f: null, R: 14 }, inside: false, far: 30000, near: 0.05, roll: 0 };
      saShotCam(this, m, s, t, k, shot, v, RL);
      const dr = v.drift ? saDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 71) * Math.sin(t * 13.3); dr[1] += j * 0.6 * Math.sin(t * 57 + 1); dr[2] += j * Math.sin(t * 63 + 2) * Math.sin(t * 9.1); }
      if (cam.near !== v.near) cam.near = v.near;
      if (cam.far !== v.far) cam.far = v.far;
      saCam(cam, saAdd(v.p, dr), saAdd(v.at, dr), v.fov, v.roll || 0);
      this._inside = v.inside; this._expo = v.expo || 0;
      // ------------------------------------------------------------------ your hands (posed onto the jug)
      hands.root.visible = eye;
      if (eye) { this.posHands(RL); hands.update(t); }
      // ------------------------------------------------------------------ the steam over your tea, the dust in the sun
      if (v.inside) { this.steam(s, roomDrops, m); this.dust(s, roomDrops, m); }
      // ------------------------------------------------------------------ the light
      const inside = v.inside;
      sun.intensity = 3.4; S.hemi.intensity = inside ? 0.42 : 0.62;
      scene.environmentIntensity = inside ? 0.5 : 0.85;
      fillA.intensity = inside ? 2.2 : 0; fillB.intensity = inside ? 1.4 : 0; fillC.intensity = inside ? 0.9 : 0;
      scene.fog.density = (inside ? 0.0005 : 0.0011) * (v.fogK ?? 1);
      const f = v.sh.f || v.at, D = 160;
      sun.position.set(f[0] + SA_SUN[0] * D, f[1] + SA_SUN[1] * D, f[2] + SA_SUN[2] * D); sun.target.position.set(f[0], f[1], f[2]); sun.target.updateMatrixWorld();
      { const c = sun.shadow.camera; if (c.right !== v.sh.R) { c.left = -v.sh.R; c.right = v.sh.R; c.top = v.sh.R; c.bottom = -v.sh.R; c.updateProjectionMatrix(); } }
      sun.shadow.bias = v.sh.R > 20 ? -0.0006 : -0.0003; sun.shadow.normalBias = v.sh.R > 20 ? 0.06 : 0.02;
      // ------------------------------------------------------------------ the soft points: the room's, then the world's
      drops.begin(); glow.begin();
      const o = R.room.position;
      for (const d of roomDrops) (d[8] ? glow : drops).add(d[0] + o.x, d[1] + o.y, d[2] + o.z, d[3], d[4], d[5], d[6], d[7]);
      for (const d of worldDrops) drops.add(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7]);
      drops.end(); glow.end();
      void sky;
    },
    // the water from the jug's lip into the glass: a tube along the path of the water between the drop that left last and
    // the one that's lowest (held at 2:00; at 2:00:03 the whole stream drops from rest, and the jug starts again from rest)
    stream(s, out) {
      const fall = saStreamFall(s), top = SA_GLASS_AT[1] + 0.012 + saGlassLevel(s), mesh = R.stream, mesh2 = R.stream2;
      // before 2:03: the full stream from the lip to the water (steady); after: the old stream falls as one (every part of it
      // from rest, so it keeps its shape) and a new one starts from the lip at rest
      const build = (M, pts, rad) => {
        const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), geo = new THREE.TubeGeometry(curve, 36, 1, 10, false);
        const pa = geo.attributes.position, nrm = geo.attributes.normal, segs = 37;
        for (let i = 0; i < pa.count; i++) { const j = Math.floor(i / 11), u = Math.min(1, j / (segs - 1)), r = rad(u), cp = curve.getPointAt(u); pa.setXYZ(i, cp.x + nrm.getX(i) * r, cp.y + nrm.getY(i) * r, cp.z + nrm.getZ(i) * r); }
        pa.needsUpdate = true; geo.computeVertexNormals(); if (M.geometry) M.geometry.dispose(); M.geometry = geo; M.visible = true; };
      // the radius: the same flow through a smaller section as it speeds up (r ∝ 1/√v), with a slight ripple
      const rOf = (tau) => { const vv = Math.hypot(SA_JUG.v0, 9.81 * tau); return Math.max(0.0022, 0.0062 * Math.sqrt(SA_JUG.v0 / vv)) * (1 + 0.08 * Math.sin(tau * 90)); };
      const n = 24;
      if (s < SAP.T) { const pts = []; for (let i = 0; i <= n; i++) pts.push(saStreamPt(fall * i / n)); build(mesh, pts, (u) => rOf(fall * u)); mesh2.visible = false; }
      else {
        const r = s - SAP.T, dy = 4.905 * r * r, pts = [];
        // the old stream, dropping as one; the part below the water surface is gone into the glass
        let lo = fall; const a = []; for (let i = 0; i <= n; i++) { const p = saStreamPt(fall * i / n); p[1] -= dy; if (p[1] > top) a.push([p, fall * i / n]); }
        if (a.length > 2) { for (const [p] of a) pts.push(p); build(mesh, pts, (u) => rOf(a[0][1] + (a[a.length - 1][1] - a[0][1]) * u)); } else mesh.visible = false;
        void lo;
        // the new stream: from the lip, water starting from rest (accelerating out of the jug again)
        const L = Math.min(fall, Math.max(0, r * 0.9));
        if (r > 0.04 && L > 0.01) { const p2 = []; for (let i = 0; i <= n; i++) { const tau = L * i / n, sp = Math.min(1, r / 0.25); p2.push([SA_LIP[0] + SA_LIPV[0] * sp * tau, SA_LIP[1] + SA_LIPV[1] * sp * tau - 4.905 * tau * tau, SA_LIP[2] + SA_LIPV[2] * sp * tau]); }
          build(mesh2, p2, (u) => 0.75 * rOf(L * u)); } else mesh2.visible = false;
      }
      // the splash where it meets the water in the glass: a crown of drops and bubbles (held at 2:00 like everything else)
      const G = SA_GLASS_AT, e = s < 0 ? s : s < SAP.T ? 0 : s - SAP.T;
      for (let i = 0; i < 46; i++) { const ph = ((e * 2.6 + saR(i, 61)) % 1), a = saR(i, 62) * 6.283, vh = 0.12 + 0.25 * saR(i, 63), vu = 0.35 + 0.5 * saR(i, 64), uu = ph * 0.14;
        const h = vu * uu - 4.905 * uu * uu; if (h < 0) continue; const off = s >= SAP.T ? 0 : 0;
        out.push([G[0] + Math.cos(a) * vh * uu, top + h - off, G[2] + Math.sin(a) * vh * uu, 0.0035 + 0.004 * saR(i, 65), 0.8, 0.82, 0.9, 0.96]); }
      for (let i = 0; i < 26; i++) { const ph = ((e * 0.7 + saR(i, 66)) % 1), a = saR(i, 67) * 6.283, r = 0.026 * Math.sqrt(saR(i, 68));
        out.push([G[0] + Math.cos(a) * r, SA_GLASS_AT[1] + 0.02 + (top - SA_GLASS_AT[1] - 0.02) * ph, G[2] + Math.sin(a) * r, 0.003 + 0.003 * saR(i, 69), 0.55, 0.95, 0.98, 1.0]); }
    },
    // the steam over your tea: thin ribbons rising and curling (each bit is where it was when the air set)
    steam(s, out, m) {
      // (about 25 cm of it: steam over a cup thins out to nothing a hand's width above the rim)
      const M = SA_MUG, e = s < 0 ? s : s < SAP.T ? 0 : s - SAP.T, top = M[1] + 0.09, K = m === 'steam' ? 2.2 : 1;
      for (let rb = 0; rb < 3; rb++) for (let i = 0; i < 110; i++) {
        const age = i * 0.016, s0 = e - age, h = 0.12 * age + 0.03 * age * age;
        const sw = 0.008 + 0.03 * age, x = M[0] + 0.018 * Math.cos(rb * 2.1) + sw * Math.sin(s0 * (1.9 + 0.3 * rb) + rb * 2.1 + age * 3.4), z = M[2] + 0.018 * Math.sin(rb * 2.1) + sw * Math.cos(s0 * (1.3 + 0.2 * rb) + rb + age * 2.9);
        const a = K * 0.07 * Math.min(1, age * 8) * Math.exp(-age / 0.8);
        out.push([x, top + h, z, 0.006 + 0.012 * age, a, 0.97, 0.97, 0.99]); }
    },
    // dust in the sunlight from the window (glowing specks, only inside the patch of sun)
    dust(s, out, m) {
      const e = s < 0 ? s : s < SAP.T ? 0 : s - SAP.T, d = SA_SUN, n = m === 'dust' ? 1600 : 380;
      for (let i = 0; i < n; i++) {
        const wx = -0.95 + 2.3 * saR(i, 41), wy = 0.9 + 1.35 * saR(i, 42), tt = 0.15 + 2.3 * saR(i, 43);
        const x = wx - d[0] * tt + 0.02 * Math.sin(e * 0.3 + i), y = wy - d[1] * tt + 0.01 * Math.sin(e * 0.21 + i * 1.3) - 0.004 * e, z = -2.0 - d[2] * tt;
        if (y < 0.05 || z > 1.9) continue;
        const big = m === 'dust' ? 2.4 : 1; out.push([x, y, z, big * (0.0016 + 0.0026 * saR(i, 44)), 0.55 + 0.4 * saR(i, 45), 1.0, 0.92, 0.75, 1]); }
    },
    // your hands onto the jug (first person) and on the table
    posHands(RL) {
      const P = hands.poses; R.jug.updateMatrixWorld(true);
      const g = R.jug.localToWorld(new THREE.Vector3(...SA_JUG.grip)).toArray(), qk = R.jug.getWorldQuaternion(new THREE.Quaternion());
      const F = new THREE.Vector3(0, 0, 1).applyQuaternion(qk).toArray(), N = new THREE.Vector3(1, 0, 0).applyQuaternion(qk).toArray();
      P.jug = saGripPose(cam, g, F, N, [0.0, 0.07, 0.022], 1, [1.15, 1.2, 1.25, 1.3], [0.35, 0.85]);
      P.rest = saGripPose(cam, RL(-0.33, 0.775, 0.24), [0.25, -0.05, -0.97], [0, -1, 0], [0.0, 0.07, 0.02], -1, [0.25, 0.3, 0.35, 0.4], [0.5, 0.2]);
    },
    labels(t) { return saLabels(this, t); },
    grade(t, p, shot) {
      p.exposure = (this._inside ? 1.22 : 1.0) * (this._expo || 1);
      p.saturation = 1.05; p.warmth = 0.03; p.vignette = 0.5; p.bloom = 0.3; p.bloomThreshold = 0.92;
      // during the three seconds: the world a little colder and stiller (a touch less colour, a little more contrast)
      const s = this._s, lk = saLocked(s) ? 1 : 0;
      p.saturation -= 0.1 * lk; p.contrast += 0.05 * lk; p.warmth -= 0.03 * lk;
      if (shot && shot.mode === 'release') { const r = s - SAP.T; if (r > 0 && r < 0.12) p.chroma = Math.max(p.chroma || 0, 0.02 * Math.sin(Math.PI * r / 0.12)); }
    },
  };
  return set;
};
// the hands' grip (from the falls-up film): a world pose → ViewerHands pose for the current camera
const _saGq = new THREE.Quaternion(), _saGf = new THREE.Vector3(), _saGn = new THREE.Vector3(), _saGx = new THREE.Vector3(), _saGw = new THREE.Vector3();
function saGripPose(cam, g, F, N, off, side, curl, thumb) {
  const f = _saGf.set(F[0], F[1], F[2]).normalize(), n = _saGn.set(N[0], N[1], N[2]); n.addScaledVector(f, -n.dot(f)).normalize();
  const x = _saGx.crossVectors(f, n);
  const w = _saGw.set(g[0], g[1], g[2]).addScaledVector(x, -off[0] * side).addScaledVector(f, -off[1]).addScaledVector(n, -off[2]);
  cam.updateMatrixWorld(true);
  const pc = cam.worldToLocal(w.clone()), qi = _saGq.copy(cam.quaternion).invert();
  const fc = f.clone().applyQuaternion(qi), nc = n.clone().applyQuaternion(qi);
  return { p: [pc.x * side, pc.y, pc.z], F: [fc.x * side, fc.y, fc.z], N: [nc.x * side, nc.y, nc.z], curl, thumb, trem: 0.0 };
}
// the shots that see the chimney smoke on the terrace
const SA_SMOKE_MODES = new Set(['window', 'wind', 'windUp', 'stillA', 'stillB', 'echo', 'planes', 'question', 'stallB', 'countA', 'fallA', 'leaves']);

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, drift, sh: { f, R }, inside, far, near, fogK, expo, shake, roll }.
// RL(x, y, z): room → world. The kitchen's window is in its south wall (z −2); you sit at the table facing it.
// Outdoors: your block's front is z = 0, the street z −9…−2, the park from z −12.35 (railings), the path z −15.5, the
// plane tree at (−9, −19.2), the pond (and its fountain) at (0, −52), the climbing frame (34, −30), the swings (46, −24),
// the main road along x 76…84, the church tower (86…95, −25…−16), the terrace across the park (z −104).
// ---------------------------------------------------------------------------------------------------------------------
function saShotCam(set, m, s, t, k, shot, v, RL) {
  const E = Ease.inOutSine, into = (a, b, u) => saV(a, b, E(u));
  const room = (R = 5) => { v.inside = true; v.sh = { f: RL(0, 1.2, -0.6), R }; v.drift = 0.0012; v.near = 0.012; };
  const G = SA_GLASS_AT, L = SA_LIP, Y = SA_YOU.eye, cat = set._cat, cc = RL(cat.p[0], cat.p[1] + 0.2, cat.p[2]);
  const orbit = (c, r, h, a0, a1, u) => { const a = saLerp(a0, a1, E(u)); return [c[0] + r * Math.sin(a), c[1] + h, c[2] + r * Math.cos(a)]; };
  const X = set.X, C = set.C;
  switch (m) {
    // ---- 1: your kitchen
    // the title: low over the table from your left: the stream, the cat jumping (slow motion), the lock
    case 'title': { room(); v.p = into(RL(1.3, 1.5, -1.62), RL(1.08, 1.42, -1.38), MathX.clamp((t + 1) / 5, 0, 1)); v.at = RL(-0.22, 0.86, 0.02); v.fov = 54; break; }
    // the stream from the jug held in the air: round it, close
    case 'start': { room(); const c = RL(G[0], 0.86, G[2]); v.p = orbit(c, 0.66, 0.0, 2.75, 2.45, k); v.at = saV(RL(G[0] + 0.03, 1.0, G[2]), RL(G[0] - 0.02, 1.02, G[2] + 0.05), E(saSm(k, 0.5, 1))); v.fov = 48; v.drift = 0.0006; break; }
    // the whole kitchen, still (from by the door): you, the jug, the cat in the air, the window
    case 'stop': { room(); v.p = into(RL(1.95, 1.62, 1.75), RL(1.75, 1.58, 1.55), k); v.at = RL(-0.15, 0.95, -0.35); v.fov = 58; break; }
    case 'stopW': { room(); v.p = into(RL(0.5, 0.9, G[2] + 0.2), RL(0.44, 0.9, G[2] + 0.18), k); v.at = RL(0.11, 0.9, G[2]); v.fov = 46; v.near = 0.01; v.drift = 0.0003; break; }
    case 'stopC': { room(); v.p = into(RL(cat.p[0] + 0.48, cat.p[1] + 0.3, cat.p[2] - 1.02), RL(cat.p[0] + 0.4, cat.p[1] + 0.26, cat.p[2] - 0.86), k); v.at = cc; v.fov = 50; v.near = 0.01; v.drift = 0.0004; break; }
    // through your own eyes: not a flicker (no drift at all)
    case 'you': { room(); v.p = RL(...Y); v.at = RL(G[0] + 0.08, 1.0, G[2] - 0.08); v.fov = 62; v.drift = 0; break; }
    // the window: the sunny city through the glass
    case 'real': { room(); v.p = into(RL(0.2, 1.5, -0.6), RL(0.22, 1.52, -1.1), k); v.at = RL(0.25, 1.35, -3.5); v.fov = 54; v.drift = 0.0008; break; }
    case 'silence': { room(); const r = SA_RADIO; v.p = into(RL(r[0] - 0.42, r[1] + 0.16, r[2] + 0.55), RL(r[0] - 0.3, r[1] + 0.12, r[2] + 0.42), k); v.at = RL(r[0], r[1] + 0.06, r[2]); v.fov = 34; v.near = 0.01; break; }
    case 'steam': { room(); const M = SA_MUG; v.p = into(RL(M[0] + 0.04, M[1] + 0.15, M[2] - 0.44), RL(M[0] + 0.03, M[1] + 0.16, M[2] - 0.35), k); v.at = RL(M[0], M[1] + 0.17, M[2]); v.fov = 38; v.near = 0.01; v.drift = 0.0004; break; }
    case 'dust': { room(); v.p = into(RL(1.0, 1.55, -1.7), RL(0.86, 1.5, -1.52), k); v.at = RL(-0.4, 1.05, 0.5); v.fov = 50; v.drift = 0.0005; break; }
    case 'clock': { room(); const ck = SA_ROOM.clock; v.p = into(RL(ck.x - 0.55, ck.y - 0.05, ck.z - 0.15), RL(ck.x - 0.42, ck.y - 0.03, ck.z - 0.1), k); v.at = RL(ck.x, ck.y, ck.z); v.fov = 32; v.near = 0.01; break; }
    case 'catfine': { room(); const c = RL(cat.p[0], cat.p[1] + 0.15, cat.p[2]); v.p = orbit(c, 0.95, 0.25, -2.0, -1.4, k); v.at = saAdd(c, [0.12, -0.05, 0]); v.fov = 44; break; }
    // ---- 2: outdoors
    // from your window: the street below, the park beyond
    case 'window': case 'countA': case 'question': { room(); v.p = into(RL(0.82, 1.6, -1.42), RL(0.84, 1.6, -1.6), k); v.at = m === 'question' ? [9, 2.5, -40] : [3, 0.5, -20]; v.fov = m === 'question' ? 50 : 62; v.sh = { f: [4, 0, -14], R: 30 }; v.drift = 0.0012; break; }
    // every car in the city where the air stopped it: the main road from a roof
    case 'stallB': { v.p = into([64, 20, 4], [65, 19.4, 0], k); v.at = [80, 0.5, -36]; v.fov = 50; v.sh = { f: [80, 0, -30], R: 40 }; break; }
    case 'pigeon': { const P = SA_WINPIG; v.p = into([P[0] - 0.9, P[1] - 0.1, P[2] - 1.35], [P[0] - 0.7, P[1] - 0.05, P[2] - 1.0], k); v.at = [P[0] + 0.1, P[1] + 0.02, P[2]]; v.fov = 38; v.near = 0.02; v.sh = { f: P, R: 3 }; v.fogK = 0.3; break; }
    case 'walkers': { const W = SA_CP.w1; v.p = into([W.x - 3.6, 0.95, W.z - 2.3], [W.x - 3.1, 1.0, W.z - 1.95], k); v.at = [W.x + 0.4, 0.95, W.z + 0.1]; v.fov = 48; v.sh = { f: [W.x, 0.5, W.z], R: 6 }; break; }
    case 'cyclist': { const B = SA_BIKE, c = [B.x, 1.0, B.z]; v.p = orbit(c, 3.2, 0.35, 1.25, 0.55, k); v.at = [B.x + 0.1, 0.95, B.z]; v.fov = 46; v.sh = { f: c, R: 6 }; break; }
    case 'car': { const Cr = X.car.g.position, c = [Cr.x, 1.0, Cr.z], w = E(saSm(t, saC('car', 1) - 0.8, saC('car', 1) + 3.0));
      v.p = saV(saV([c[0] - 4.6, 1.05, c[2] - 2.6], [c[0] - 4.2, 1.1, c[2] - 2.0], E(saSm(k, 0, 0.5))), [c[0] - 2.4, 1.32, c[2] + 0.42], w); v.at = saV([c[0], 0.85, c[2]], [c[0] + 0.25, 1.15, c[2] + 0.4], w); v.fov = 48; v.sh = { f: c, R: 7 }; break; }
    case 'leaves': { const P = SA_ST.plane; v.p = into([P.x + 4.6, 2.3, P.z + 3.6], [P.x + 3.7, 2.5, P.z + 2.7], k); v.at = [P.x + 1.5, 2.6, P.z - 5.0]; v.fov = 56; v.sh = { f: [P.x, 3, P.z], R: 12 }; break; }
    case 'fountain': { const F = SA_ST.fountain, c = [F.x, F.h + 1.4, F.z]; v.p = orbit(c, 2.7, 0.15, -0.35, 0.25, k); v.at = [F.x, F.h + 1.2, F.z]; v.fov = 42; v.sh = { f: c, R: 6 }; break; }
    case 'carp': { const P = X.fish.position, c = [P.x, -0.1, P.z]; v.p = into([c[0] + 1.0, 0.62, c[2] + 1.15], [c[0] + 0.8, 0.5, c[2] + 0.9], k); v.at = c; v.fov = 44; v.sh = { f: c, R: 5 }; break; }
    case 'jumper': { const P = SA_CP.girl, c = [P.x, P.y + 0.5, P.z]; v.p = orbit(c, 3.3, -0.25, 1.9, 2.6, k); v.at = c; v.fov = 44; v.sh = { f: c, R: 6 }; break; }
    case 'swing': { const Sw = SA_ST.swings, c = [Sw.x - 1.6 + SA_SWING.i * 1.6, 1.2, Sw.z]; v.p = into([c[0] + 2.4, 1.3, c[2] - 5.8], [c[0] + 2.0, 1.35, c[2] - 5.2], k); v.at = [c[0], 1.55, c[2] - 1.2]; v.fov = 44; v.sh = { f: c, R: 6 }; break; }
    case 'ball': { const B = SA_BALL.p; v.p = into([B[0] - 2.4, 3.0, B[2] + 1.8], [B[0] - 2.0, 3.1, B[2] + 1.45], k); v.at = [B[0] + 1.6, 2.9, B[2] - 1.0]; v.fov = 48; v.sh = { f: [B[0] + 2, 1, B[2] - 1], R: 10 }; break; }
    case 'dog': { const D = SA_CP.dog, c = [D.x - 0.2, D.y + 0.45, D.z]; v.p = into([c[0] - 0.6, 0.8, c[2] - 2.4], [c[0] - 0.5, 0.85, c[2] - 1.9], k); v.at = c; v.fov = 44; v.sh = { f: c, R: 5 }; break; }
    case 'flock': { v.p = into([-6.5, 0.6, -14.2], [-6.0, 0.75, -14.4], k); v.at = [-2.0, 1.1, -16.6]; v.fov = 56; v.sh = { f: [-3, 1, -16], R: 7 }; break; }
    case 'runner': { const P = SA_RUNP; v.p = into([P.x + 0.4, 0.22, P.z - 3.4], [P.x + 0.2, 0.28, P.z - 2.9], k); v.at = [P.x, 0.55, P.z]; v.fov = 50; v.sh = { f: [P.x, 1, P.z], R: 5 }; break; }
    case 'wind': { const F = SA_FLAG; v.p = into([F.x + 3.8, 1.5, F.z + 4.2], [F.x + 3.5, 1.6, F.z + 3.8], k); v.at = [F.x - 0.6, F.h - 0.6, F.z - 3]; v.fov = 54; v.sh = { f: [F.x, 4, F.z], R: 12 }; break; }
    case 'windUp': { v.p = into([10, 46, 30], [14, 58, 36], k); v.at = [-20, 30, -260]; v.fov = 60; v.sh = { f: [0, 0, -40], R: 80 }; v.fogK = 0.6; break; }
    case 'road': { const w = E(saSm(t, saC('road', 1) - 0.6, saC('road', 1) + 3.5)); v.p = saV(into([70.5, 1.6, -44], [71.2, 1.6, -42], k), [76.4, 1.45, -30.5], w); v.at = saV([80, 1.4, -26], [79, 1.2, -22.5], w); v.fov = 52; v.sh = { f: [80, 1, -28], R: 22 }; break; }
    case 'motorway': { v.p = into([80.6, 4.2, -2.5], [80.6, 4.4, -4.5], k); v.at = [80, 0.8, -140]; v.fov = 26; v.sh = { f: [80, 0, -60], R: 60 }; break; }
    // ---- 3: the last second; the release (through your eyes)
    case 'countB': { room(); v.p = RL(...Y); v.at = RL(G[0] - 0.12, 0.84, G[2] - 0.3); v.fov = 66; v.drift = 0; break; }
    case 'release': { room(); const r = s - SAP.T; v.p = saAdd(RL(...Y), [0, r > 0 ? 0.012 * saSm(r, 0.02, 0.14) - 0.02 * saSm(r, 0.14, 0.33) : 0, 0]); v.at = RL(G[0] - 0.22, 0.75 - 0.05 * saSm(r, 0.1, 0.33), G[2] - 0.38); v.fov = 70; v.drift = r > 0 ? 0.0012 : 0; break; }
    // ---- the park, from rest (slow motion)
    case 'fallA': { v.p = into([24.5, 1.5, -21.0], [25.0, 1.55, -21.6], k); v.at = [30.5, 1.4, -33.0]; v.fov = 58; v.sh = { f: [30, 1, -32], R: 14 }; break; }
    case 'fallRun': { const P = SA_RUNP; v.p = into([P.x + 1.8, 0.7, P.z - 3.6], [P.x + 1.6, 0.65, P.z - 3.3], k); v.at = [P.x + 0.8, 0.55, P.z]; v.fov = 50; v.sh = { f: [P.x, 1, P.z], R: 5 }; break; }
    case 'fallBike': { const B = SA_BIKE; v.p = into([B.x + 2.2, 1.05, B.z + 3.3], [B.x + 2.0, 1.0, B.z + 3.0], k); v.at = [B.x, 0.6, B.z]; v.fov = 48; v.sh = { f: [B.x, 1, B.z], R: 6 }; break; }
    case 'fallSwing': { const Sw = SA_ST.swings, c = [Sw.x, 1.2, Sw.z]; v.p = into([c[0] + 5.2, 1.3, c[2] - 3.5], [c[0] + 4.9, 1.3, c[2] - 3.2], k); v.at = [c[0], 1.3, c[2] - 0.4]; v.fov = 50; v.sh = { f: c, R: 7 }; break; }
    // ---- after: the bell tower, 20 s, 40 s, a minute, two minutes later
    case 'echo': { const Tw = SA_ST.church.tower; v.p = into([58, 1.6, -36], [59, 1.6, -35.4], k); v.at = [(Tw.x[0] + Tw.x[1]) / 2, Tw.h + 4, (Tw.z[0] + Tw.z[1]) / 2]; v.fov = 46; v.sh = { f: [80, 4, -24], R: 30 }; break; }
    case 'fineA': { v.p = into([0.8, 1.4, -4.2], [1.3, 1.42, -3.8], k); v.at = [4.6, 1.0, -1.1]; v.fov = 50; v.sh = { f: [4, 1, -2], R: 8 }; break; }
    case 'fineB': { const B = SA_BIKE; v.p = into([B.x - 3.4, 1.3, B.z + 2.3], [B.x - 3.0, 1.32, B.z + 2.0], k); v.at = [B.x + 0.4, 0.5, B.z + 0.4]; v.fov = 46; v.sh = { f: [B.x, 1, B.z], R: 6 }; break; }
    case 'stallA': { const Cr = X.car.g.position, c = [Cr.x, 1.0, Cr.z]; v.p = into([c[0] - 4.4, 1.25, c[2] + 0.2], [c[0] - 3.6, 1.25, c[2] + 0.35], k); v.at = [c[0] + 0.3, 1.05, c[2] + 0.35]; v.fov = 44; v.sh = { f: c, R: 7 }; break; }
    case 'sirens': { v.p = into([74.6, 1.55, -50], [74.3, 1.55, -48], k); v.at = [80.5, 1.3, -10]; v.fov = 44; v.sh = { f: [80, 1, -30], R: 26 }; break; }
    case 'stillA': { v.p = into([8, 1.6, -64], [8, 1.7, -66], k); v.at = [5, 14, -108]; v.fov = 46; v.sh = { f: [0, 3, -90], R: 30 }; break; }
    case 'stillB': { const F = SA_FLAG; v.p = into([F.x - 1.9, 4.4, F.z + 3.9], [F.x - 1.6, 4.6, F.z + 3.3], k); v.at = [F.x, 5.9, F.z]; v.fov = 40; v.sh = { f: [F.x, 5, F.z], R: 8 }; break; }
    case 'planes': { v.p = into([2, 1.6, -30], [2, 1.6, -30.5], k); v.at = [-800, 3600 + 900 * E(k), -9000]; v.fov = 58; v.sh = { f: [0, 0, -40], R: 30 }; v.drift = 0.002; break; }
  }
  void L; void C; void cc;
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function saLabels(set, t) {
  const shot = saShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = set._s, X = set.X, sp = SA_SPD, RL = (x, y, z) => set.R.toWorld(x, y, z).toArray();
  const lab = (p, text, sub, a0 = 0.8, side) => out.push({ p, text, sub, a: W(t, shot.t0 + a0, shot.t1 - 0.25, 0.35, 0.3), side });
  const cat = set._cat;
  if (m === 'catfine') lab(RL(cat.p[0], cat.p[1] + 0.32, cat.p[2]), 'YOUR CAT', `3 m/s · ${saHt(sp.cat.h)}`, 0.9);
  if (m === 'pigeon') lab(saAdd(SA_WINPIG, [0, 0.25, 0]), 'PIGEON', `36 km/h · ${saHt(sp.pigeon.h)}`, 1.0);
  if (m === 'walkers') lab(saAdd([SA_CP.w1.x, 0, SA_CP.w1.z], [0, 1.85, 0]), 'WALKING', `5 km/h · ${saHt(sp.walk.h)}`, 1.0);
  if (m === 'cyclist') lab([SA_BIKE.x, 1.95, SA_BIKE.z], 'CYCLING', `20 km/h · ${saHt(sp.bike.h)}`, 1.0);
  if (m === 'car') { const c = X.car.g.position; lab([c.x, 1.75, c.z], 'THE CAR', `30 km/h · ${saHt(sp.car.h)}`, 1.0); }
  if (m === 'runner') lab([SA_RUNP.x, 2.0, SA_RUNP.z], 'RUNNING', `11 km/h · ${saHt(sp.run.h)}`, 1.0);
  if (m === 'dog') lab(saAdd(SA_FRIS.p, [0, 0.22, 0]), '30 cm', '', 1.0, 'r');
  if (m === 'road') { const a = X.traffic.find((c) => c.z === -22), b = X.traffic.find((c) => c.z === -14); if (a) lab([a.g.position.x, 2.2, a.g.position.z], '50 km/h', saHt(sp.road.h), 1.2); void b; }
  if (m === 'clock') { const ck = SA_ROOM.clock; lab(RL(ck.x - 0.02, ck.y + 0.2, ck.z), 'STUCK AT 2:00:00', '', 1.2); }
  void s;
  return out;
}
