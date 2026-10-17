/* =====================================================================
   SET · TRACK — the race cars: chapter 2's downforce and chapter 4's fan cars. One scene, five places, shown one at a
   time by shot.mode (everything generic: no liveries, logos or team colours):
     race    a modern single-seater on a floodlit circuit at dusk. Its wings are upside down: they throw the air UP
             (ribbons, blue arrow) so the air pushes the car DOWN (amber arrows), more than its weight
     theory  the same car on the ceiling of a lit road tunnel at 300 km/h (an idea nobody has tried)
     catch   it slows; downforce ∝ v²: DF = (v / 55)² of its weight. When DF drops below 1 it peels off the ceiling
             (y'' = −g·(1 − DF): gently at first, then it drops) and lands on the tunnel floor, sliding, in sparks
     chap70  a 1970-style fan car: two fans in a square tail suck it down; a black flag, it pulls off: banned
     fan78   a 1978-style fan F1 car: one big fan, a chequered flag, then into a dark garage and the door comes down
     mcm     a tiny fan car on a rotating test rig: flat → upside down, wheels still, held by its fans
   The cars stay at the origin and the world streams past (the circuits repeat, the tunnel never ends), as in the sky set.
   Everything is a pure function of film time; the speed / fall tables are integrated once from constants.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE CATCH — speed, downforce and the fall (the HUD's readout reads trTrackCatchV / trTrackCatchDF)
// ---------------------------------------------------------------------------------------------------------------------
const TR_TK = { v0: 300 / 3.6, v1: 30, ceil: 6.4, top: 1.05, g: 9.81, z: -2.2 };
// "Slow down": the speed falls from 300 km/h on "Slow", most of it by "disappears"
function trTkSlowWin() { const a = trW(17, 'slow').start - 0.12; return [a, a + 1.85]; }
function trTkVs(t) { const [a, b] = trTkSlowWin(); return MathX.lerp(TR_TK.v0, TR_TK.v1, MathX.smooth(t, a, b)); }
// the moment DF crosses 1 (bisection), then the fall integrated once: y'' = −g (1 − DF)
function trTkDrop() {
  if (TR_TK.td != null) return TR_TK;
  const [a, b] = trTkSlowWin(); let lo = a, hi = b;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (trTkVs(m) > 55) lo = m; else hi = m; }
  const td = (lo + hi) / 2, dt = 1 / 480, ys = [TR_TK.ceil];
  let y = TR_TK.ceil, vy = 0, t = td;
  while (y > TR_TK.top && ys.length < 6000) { const df = Math.pow(trTkVs(t) / 55, 2); vy -= TR_TK.g * Math.max(0, 1 - df) * dt; y += vy * dt; t += dt; ys.push(Math.max(y, TR_TK.top)); }
  Object.assign(TR_TK, { td, tl: t, ys, dt, vLand: vy });
  return TR_TK;
}
// the car's root height (upside down: the wheels touch the ceiling at y = ceil; it lands on its airbox at y = top)
function trTkY(t) {
  const D = trTkDrop();
  if (t <= D.td) return D.ceil;
  if (t >= D.tl) { const u = t - D.tl; return D.top + 0.16 * Math.exp(-u / 0.16) * Math.abs(Math.sin(u * 15)); }
  const f = (t - D.td) / D.dt, i = Math.min(Math.floor(f), D.ys.length - 2);
  return MathX.lerp(D.ys[i], D.ys[i + 1], f - i);
}
function trTrackCatchV(t) {
  const D = trTkDrop(); let v = trTkVs(t);
  if (t > D.tl) v = Math.max(0, v - 8 * (t - D.tl));          // sliding on its back: friction
  return v;
}
function trTrackCatchDF(t) { const v = trTrackCatchV(t); return (v / 55) * (v / 55); }

// distance travelled by a speed function, integrated once per key (trapezoids), linear outside the table
const TR_TK_TAB = {};
function trTkInteg(key, vf, t0, t1, t) {
  let T = TR_TK_TAB[key];
  if (!T) {
    const dt = 1 / 120, n = Math.ceil((t1 - t0) / dt), xs = new Float64Array(n + 1);
    for (let i = 1; i <= n; i++) xs[i] = xs[i - 1] + 0.5 * (vf(t0 + (i - 1) * dt) + vf(t0 + i * dt)) * dt;
    T = TR_TK_TAB[key] = { t0, t1: t0 + n * dt, dt, xs, n, vf };
  }
  if (t <= T.t0) return (t - T.t0) * T.vf(T.t0);
  if (t >= T.t1) return T.xs[T.n] + (t - T.t1) * T.vf(T.t1);
  const f = (t - T.t0) / T.dt, i = Math.floor(f);
  return MathX.lerp(T.xs[i], T.xs[i + 1], f - i);
}
const trTkTunnelX = (t) => trTkInteg('tunnel', trTrackCatchV, TR.theory - 1, TR.toy + 1, t);

// 1970: flat out, then it pulls off and stops after the black flag
function trTkChapV(t) { const a = trW(27, 'track').start - 0.1; return 46 * (1 - MathX.smooth(t, a, a + 2.25)); }
const trTkChapX = (t) => trTkInteg('chap', trTkChapV, TR.old - 1, TR.brabham + 1, t);
const trTkChapStop = () => trTkChapX(TR.brabham + 0.5);
// 1978: flat out over the line on "won", easing off after
const trTkFinT = () => trW(28, 'won').start + 0.15;
function trTkBtV(t) { return MathX.lerp(52, 30, MathX.smooth(t, trTkFinT() + 0.2, trTkFinT() + 1.6)); }
const trTkBtX = (t) => trTkInteg('bt', trTkBtV, TR.brabham - 1, TR.mcm + 1, t);

// the internal cuts of every mode (film seconds)
function trTkCutT() {
  if (TR_TK.cuts) return TR_TK.cuts;
  const c = {
    raceB: trW(16, 'upside').start - 0.2, raceC: trW(16, 'engineers').start - 0.25,
    chapB: trW(27, 'raced').start - 0.1, chapC: trW(27, 'was').start - 0.35,
    btB: trW(28, 'formula').start - 0.2, btC: trW(28, 'then').start - 0.2,
    mcmB: trW(29, 'mcmurtry').start - 0.3, mcmC: trW(29, 'grip').start - 0.4,
  };
  c.rot0 = trW(29, 'used').start - 0.3; c.rot1 = trW(29, 'down').start + 0.25;
  c.door0 = trW(28, 'withdrawn').start - 0.15; c.door1 = c.door0 + 0.8;
  c.banned = trW(27, 'banned').start;
  return (TR_TK.cuts = c);
}
// the rig's angle about its long axis (0 flat → π upside down), a little overshoot and settle
function trTkRigAng(t) {
  const C = trTkCutT(), k = MathX.smooth(t, C.rot0, C.rot1), u = Math.max(0, t - C.rot1);
  return Math.PI * k + (t > C.rot1 ? 0.05 * Math.exp(-u / 0.35) * Math.sin(u * 9) : 0);
}

// ---------------------------------------------------------------------------------------------------------------------
// BUILDING BLOCKS
// ---------------------------------------------------------------------------------------------------------------------
const _tkM4 = new THREE.Matrix4(), _tkQ = new THREE.Quaternion(), _tkE = new THREE.Euler(), _tkV = new THREE.Vector3(), _tkS = new THREE.Vector3();
const _tkUp = new THREE.Vector3(0, 1, 0);

function trTkTex(w, h, draw, rep = true) { const c = Tex.canvas(w, h), x = c.getContext('2d'); draw(x, w, h); return Tex.tex(c, { repeat: rep, srgb: true }); }

// a side profile (x, y points) extruded across the car (z), bevelled; taper(x, y) scales the width
function trTkProfile(pts, depth, mat, parent, o = {}) {
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
  const bev = o.bevel ?? 0.04, d = Math.max(0.005, depth - 2 * bev);
  const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -d / 2);
  if (o.taper) { const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, P.getZ(i) * o.taper(P.getX(i), P.getY(i))); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; m.position.z = o.z || 0; parent.add(m); return m;
}
function trTkBox(w, h, d, mat, parent, x, y, z, rz = 0, ry = 0, rad = 0) {
  const g = rad > 0 ? new THREE.RoundedBoxGeometry(w, h, d, 2, rad) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.set(0, ry, rz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
// a wheel: a lathed tyre with rounded shoulders, a rim, spokes on both faces; spin.rotation.z turns it
function trTkWheel(parent, M, r, w, x, y, z, spokes = 5) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const spin = new THREE.Group(); g.add(spin);
  const pts = [[r * 0.64, -w / 2], [r - 0.035, -w / 2], [r, -w / 2 + 0.05], [r, w / 2 - 0.05], [r - 0.035, w / 2], [r * 0.64, w / 2]].map(([a, b]) => new THREE.Vector2(a, b));
  const tyre = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.tyre); tyre.rotation.x = Math.PI / 2; tyre.castShadow = true; spin.add(tyre);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.64, r * 0.64, w * 0.86, 20), M.rim); rim.rotation.x = Math.PI / 2; spin.add(rim);
  for (const s of [-1, 1]) {
    for (let k = 0; k < spokes; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(r * 1.16, 0.035, 0.02), M.spoke); b.rotation.z = k * Math.PI / spokes; b.position.z = s * w * 0.44; spin.add(b); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.13, r * 0.13, 0.03, 12), M.hub); hub.rotation.x = Math.PI / 2; hub.position.z = s * w * 0.45; spin.add(hub);
  }
  return { g, spin, r };
}
// a fan seen from behind: a shroud ring, a dark duct, blades (spin.rotation.x), a faint blur disc
function trTkFan(parent, M, r, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.12, 8, 28), M.carbon); ring.rotation.y = Math.PI / 2; g.add(ring);
  const duct = new THREE.Mesh(new THREE.CircleGeometry(r, 24), M.duct); duct.rotation.y = -Math.PI / 2; duct.position.x = 0.03; g.add(duct);
  const spin = new THREE.Group(); spin.position.x = -0.02; g.add(spin);
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, r * 0.92, r * 0.22), M.blade); b.position.y = r * 0.46; const p = new THREE.Group(); p.rotation.x = k * Math.PI / 3; b.rotation.y = 0.5; p.add(b); spin.add(p); }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(r * 0.2, 12, 8), M.rim); hub.scale.x = 0.6; spin.add(hub);
  const blur = new THREE.Mesh(new THREE.CircleGeometry(r * 0.95, 24), M.blur); blur.rotation.y = -Math.PI / 2; blur.position.x = -0.04; g.add(blur);
  return { g, spin, blur };
}
// a strip of ground (or wall / ceiling) whose texture streams by: set(X) slides the texture by the distance travelled
function trTkStrip(parent, L, W, draw, cw, ch, texLen, repV, matO, place) {
  const tex = trTkTex(cw, ch, draw); tex.repeat.set(L / texLen, repV);
  const { alpha, ...mo } = matO || {};
  const mat = new THREE.MeshStandardMaterial(Object.assign({ map: tex, roughness: 0.9, metalness: 0 }, mo));
  if (alpha) { mat.alphaTest = 0.3; mat.side = THREE.DoubleSide; }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(L, W), mat); m.receiveShadow = true; place(m); parent.add(m);
  return { m, tex, sign: 1, set(X) { const o = (X * this.sign) / texLen; tex.offset.x = o - Math.floor(o); } };
}
// repeated things along the track (instanced), wrapped around the car: items [x0, y, z, sx, sy, sz, ry]
function trTkRep(parent, geo, mat, items, span, o = {}) {
  const im = new THREE.InstancedMesh(geo, mat, items.length); im.frustumCulled = false; im.castShadow = !!o.cast; im.receiveShadow = !!o.recv; parent.add(im);
  if (o.colors) { const c = new THREE.Color(); items.forEach((it, i) => im.setColorAt(i, c.set(o.colors(i)))); im.instanceColor.needsUpdate = true; }
  return {
    im, update(X, stretch = 1) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i], x = ((it[0] - X) % span + span * 1.5) % span - span / 2;
        _tkM4.compose(_tkV.set(x, it[1], it[2]), _tkQ.setFromEuler(_tkE.set(0, it[6] || 0, 0)), _tkS.set((it[3] || 1) * stretch, it[4] || 1, it[5] || 1));
        im.setMatrixAt(i, _tkM4);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
}
// a person (marshal, flagman): legs, overalls, a head; the right arm is a pivot holding a flag on a stick
function trTkPerson(parent, M, suit, flagTex) {
  const g = new THREE.Group(); parent.add(g);
  const sm = new THREE.MeshStandardMaterial({ color: suit, roughness: 0.85 });
  for (const s of [-1, 1]) trTkBox(0.15, 0.82, 0.17, sm, g, 0, 0.41, s * 0.1, 0, 0, 0.04);
  trTkBox(0.26, 0.62, 0.44, sm, g, 0, 1.12, 0, 0, 0, 0.08);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), M.skin); head.position.set(0, 1.58, 0); g.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), sm); cap.position.set(0, 1.6, 0); g.add(cap);
  trTkBox(0.11, 0.56, 0.11, sm, g, 0, 1.1, -0.29, 0.05, 0, 0.03);
  const arm = new THREE.Group(); arm.position.set(0, 1.38, 0.28); g.add(arm);
  trTkBox(0.11, 0.6, 0.11, sm, arm, 0, 0.28, 0, 0, 0, 0.03);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 6), M.rim); stick.position.set(0, 0.95, 0); arm.add(stick);
  const fg = new THREE.PlaneGeometry(0.95, 0.68, 12, 6); fg.translate(0.475, 0, 0);
  const flag = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.8, side: THREE.DoubleSide }));
  flag.position.set(0, 1.15, 0); flag.rotation.y = -Math.PI / 2; arm.add(flag);
  const base = Float32Array.from(fg.attributes.position.array);
  return {
    g, arm, flag,
    wave(t, k) {
      arm.rotation.z = (0.25 + 0.75 * k * Math.sin(t * 7.5)) * (0.3 + 0.7 * k);
      arm.rotation.x = -0.15;
      const P = fg.attributes.position;
      for (let i = 0; i < P.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; P.setZ(i, (0.06 + 0.16 * k) * x * Math.sin(x * 5 - t * (9 + 6 * k) + y * 1.5)); }
      P.needsUpdate = true; fg.computeVertexNormals();
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CARS (x forward, y up, z to the right; wheels on y = 0)
// ---------------------------------------------------------------------------------------------------------------------
function trTkSusp(parent, mat, pairs) { for (const [a, b] of pairs) trBeam(new THREE.Vector3(...a), new THREE.Vector3(...b), 0.035, mat, parent); }

// a modern single-seater: graphite tub, white engine cover, carbon wings, a halo; the wings are upside down
function trTkF1(M) {
  const root = new THREE.Group(), b = new THREE.Group(); root.add(b);
  const paint = M.f1, white = M.white, carbon = M.carbon;
  // the tub and the nose (narrowing to the tip)
  trTkProfile([[2.95, 0.14], [3.02, 0.24], [2.4, 0.4], [1.2, 0.57], [0.45, 0.65], [0.3, 0.59], [-0.45, 0.59], [-0.62, 0.66], [-0.62, 0.12]], 0.74, paint, b,
    { bevel: 0.05, taper: (x) => MathX.lerp(1, 0.3, MathX.clamp((x - 0.9) / 2.1, 0, 1)) });
  // a white flash along the nose top
  trTkProfile([[2.6, 0.37], [1.3, 0.56], [0.9, 0.6], [0.9, 0.57], [1.3, 0.53], [2.6, 0.34]], 0.3, white, b, { bevel: 0.02, taper: (x) => MathX.lerp(1, 0.4, MathX.clamp((x - 0.9) / 1.7, 0, 1)) });
  // sidepods (coke-bottle at the back), dark inlets
  trTkProfile([[0.55, 0.14], [0.55, 0.5], [0.3, 0.57], [-0.6, 0.54], [-1.5, 0.38], [-1.95, 0.22], [-1.95, 0.14]], 1.56, paint, b,
    { bevel: 0.07, taper: (x) => MathX.lerp(1, 0.4, MathX.clamp((-x - 0.1) / 1.85, 0, 1)) });
  for (const s of [-1, 1]) trTkBox(0.05, 0.17, 0.3, M.duct, b, 0.58, 0.4, s * 0.6);
  // the engine cover and airbox (white), a fin, the intake
  trTkProfile([[-0.38, 0.5], [-0.4, 0.98], [-0.62, 1.05], [-1.0, 0.93], [-1.8, 0.62], [-2.25, 0.44], [-2.25, 0.3], [-0.38, 0.3]], 0.56, white, b,
    { bevel: 0.05, taper: (x, y) => MathX.lerp(1, 0.5, MathX.clamp((-x - 0.6) / 1.6, 0, 1)) * MathX.lerp(1, 0.6, MathX.clamp((y - 0.7) / 0.35, 0, 1)) });
  trTkBox(0.05, 0.15, 0.2, M.duct, b, -0.4, 0.88, 0);
  trTkProfile([[-0.85, 0.96], [-2.1, 0.86], [-2.3, 0.62], [-1.6, 0.66]], 0.025, paint, b, { bevel: 0 });
  trTkBox(0.9, 0.012, 0.03, M.accent, b, -1.6, 0.87, 0, -0.1);
  // floor, plank, diffuser
  trTkBox(3.6, 0.04, 1.5, carbon, b, -0.25, 0.07, 0);
  trTkBox(0.55, 0.05, 1.0, carbon, b, -2.25, 0.16, 0, -0.32);
  // the front wing: a main plane and two flaps per side, trailing edges UP (an upside-down wing)
  trTkBox(0.52, 0.025, 1.9, carbon, b, 2.82, 0.11, 0, -0.06);
  for (const s of [-1, 1]) {
    trTkBox(0.28, 0.02, 0.72, white, b, 2.62, 0.18, s * 0.58, -0.38);
    trTkBox(0.22, 0.02, 0.72, carbon, b, 2.48, 0.27, s * 0.58, -0.62);
    trTkBox(0.66, 0.3, 0.025, carbon, b, 2.74, 0.24, s * 0.96, 0, 0, 0.008);
    trTkBox(0.6, 0.02, 0.03, M.accent, b, 2.76, 0.39, s * 0.96);
  }
  // the rear wing: main plane + a steep flap above and behind it (upside down), endplates, a pylon, the beam wing
  trTkBox(0.44, 0.03, 1.0, carbon, b, -2.48, 0.92, 0, -0.16);
  trTkBox(0.26, 0.025, 1.0, white, b, -2.74, 1.04, 0, -0.62);
  for (const s of [-1, 1]) { trTkBox(0.78, 0.76, 0.025, carbon, b, -2.58, 0.72, s * 0.52, 0, 0, 0.008); trTkBox(0.76, 0.03, 0.03, M.accent, b, -2.58, 1.1, s * 0.52); }
  trTkBox(0.14, 0.42, 0.04, carbon, b, -2.38, 0.64, 0);
  trTkBox(0.24, 0.02, 0.9, carbon, b, -2.45, 0.42, 0, -0.3);
  trTkBox(0.03, 0.08, 0.12, M.redLamp, b, -2.62, 0.52, 0);
  // the halo, the driver's helmet, mirrors
  const halo = new THREE.CatmullRomCurve3([[-0.38, 0.6, -0.31], [-0.33, 0.84, -0.29], [0.05, 0.89, -0.22], [0.32, 0.86, 0], [0.05, 0.89, 0.22], [-0.33, 0.84, 0.29], [-0.38, 0.6, 0.31]].map((p) => new THREE.Vector3(...p)));
  b.add(Object.assign(new THREE.Mesh(new THREE.TubeGeometry(halo, 24, 0.032, 8), carbon), { castShadow: true }));
  trBeam(new THREE.Vector3(0.32, 0.86, 0), new THREE.Vector3(0.55, 0.62, 0), 0.05, carbon, b);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), M.helmet); helm.position.set(-0.08, 0.72, 0); b.add(helm);
  trTkBox(0.06, 0.06, 0.2, M.visor, b, 0.04, 0.74, 0, 0, 0, 0.02);
  for (const s of [-1, 1]) trTkBox(0.08, 0.05, 0.14, carbon, b, 0.38, 0.74, s * 0.44);
  // suspension
  const W = [];
  for (const [x, z0, s] of [[1.85, 0.3, -1], [1.85, 0.3, 1], [-1.78, 0.42, -1], [-1.78, 0.42, 1]]) {
    trTkSusp(b, carbon, [[[x + 0.25, 0.36, s * z0], [x, 0.4, s * 0.66]], [[x - 0.25, 0.3, s * z0], [x, 0.3, s * 0.66]], [[x + 0.1, 0.5, s * z0], [x, 0.44, s * 0.64]]]);
  }
  W.push(trTkWheel(b, M, 0.36, 0.36, 1.85, 0.36, -0.8), trTkWheel(b, M, 0.36, 0.36, 1.85, 0.36, 0.8), trTkWheel(b, M, 0.36, 0.42, -1.78, 0.36, -0.78), trTkWheel(b, M, 0.36, 0.42, -1.78, 0.36, 0.78));
  return { root, body: b, wheels: W };
}

// a 1970-style sports-racing fan car: a white box, skirts to the road, two fans in the square tail
function trTkChap(M) {
  const root = new THREE.Group(), b = new THREE.Group(); root.add(b);
  trTkProfile([[2.2, 0.12], [2.26, 0.36], [1.7, 0.56], [0.9, 0.66], [-2.1, 0.7], [-2.2, 0.66], [-2.2, 0.12]], 1.5, M.chap, b, { bevel: 0.08 });
  // fenders over the wheels
  for (const x of [1.35, -1.2]) for (const s of [-1, 1]) trTkProfile([[x + 0.56, 0.3], [x + 0.5, 0.56], [x + 0.3, 0.65], [x - 0.35, 0.65], [x - 0.52, 0.56], [x - 0.56, 0.3]], 0.36, M.chap, b, { bevel: 0.04, z: s * 0.82 });
  // a dark stripe low on the flanks, the cockpit, a roll hoop
  for (const s of [-1, 1]) trTkBox(4.0, 0.05, 0.02, M.carbon, b, 0, 0.3, s * 0.77);
  trTkProfile([[1.05, 0.66], [0.55, 0.93], [-0.25, 0.95], [-0.5, 0.66]], 0.92, M.glass, b, { bevel: 0.06 });
  // skirts down to the road
  for (const s of [-1, 1]) trTkBox(1.6, 0.13, 0.03, M.duct, b, 0.05, 0.075, s * 0.74);
  trTkBox(0.03, 0.12, 1.4, M.duct, b, 2.15, 0.075, 0);
  // the tail: the two fans
  trTkBox(0.06, 0.58, 1.48, M.carbon, b, -2.2, 0.4, 0, 0, 0, 0.02);
  const F = [trTkFan(b, M, 0.27, -2.26, 0.42, -0.38), trTkFan(b, M, 0.27, -2.26, 0.42, 0.38)];
  trTkBox(0.04, 0.05, 0.25, M.redLamp, b, -2.24, 0.62, -0.6); trTkBox(0.04, 0.05, 0.25, M.redLamp, b, -2.24, 0.62, 0.6);
  // the small engine for the fans, on top of the tail
  trTkBox(0.5, 0.14, 0.5, M.carbon, b, -1.75, 0.76, 0, 0, 0, 0.03);
  const W = [trTkWheel(b, M, 0.34, 0.32, 1.35, 0.34, -0.83, 4), trTkWheel(b, M, 0.34, 0.32, 1.35, 0.34, 0.83, 4), trTkWheel(b, M, 0.35, 0.36, -1.2, 0.35, -0.83, 4), trTkWheel(b, M, 0.35, 0.36, -1.2, 0.35, 0.83, 4)];
  return { root, body: b, wheels: W, fans: F };
}

// a 1978-style fan F1 car: a wedge nose, a big flat engine cover, one large fan at the very back
function trTkBt(M) {
  const root = new THREE.Group(), b = new THREE.Group(); root.add(b);
  trTkProfile([[2.2, 0.13], [2.2, 0.2], [0.9, 0.46], [0.3, 0.57], [-0.25, 0.57], [-0.25, 0.13]], 0.66, M.bt, b, { bevel: 0.04, taper: (x) => MathX.lerp(1, 0.45, MathX.clamp((x - 0.3) / 1.9, 0, 1)) });
  trTkProfile([[2.05, 0.21], [0.9, 0.47], [0.9, 0.44], [2.05, 0.18]], 0.3, M.white, b, { bevel: 0.015 });
  for (const s of [-1, 1]) { trTkBox(0.42, 0.03, 0.55, M.bt, b, 1.95, 0.17, s * 0.5, -0.14); trTkBox(0.44, 0.16, 0.02, M.carbon, b, 1.95, 0.22, s * 0.78); }
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), M.helmet); helm.position.set(0.0, 0.7, 0); b.add(helm);
  trTkBox(0.06, 0.06, 0.18, M.visor, b, 0.11, 0.71, 0, 0, 0, 0.02);
  trTkBox(0.04, 0.16, 0.42, M.glass, b, 0.42, 0.66, 0, -0.5);
  trTkBox(0.06, 0.34, 0.06, M.rim, b, -0.32, 0.74, 0);
  // the big flat engine cover, an amber pinstripe
  trTkProfile([[-0.25, 0.14], [-0.25, 0.6], [-0.65, 0.7], [-1.85, 0.67], [-2.0, 0.56], [-2.0, 0.14]], 1.12, M.bt, b, { bevel: 0.05, taper: (x) => MathX.lerp(0.55, 1, MathX.clamp((-x - 0.25) / 0.6, 0, 1)) });
  trTkBox(1.3, 0.014, 0.9, M.white, b, -1.25, 0.705, 0, 0.02);
  for (const s of [-1, 1]) trTkBox(3.6, 0.03, 0.02, M.accent, b, 0.0, 0.36, s * (0.33 + 0.0));
  // the fan, at the very back
  trTkBox(0.1, 0.64, 0.86, M.carbon, b, -2.02, 0.42, 0, 0, 0, 0.03);
  const F = [trTkFan(b, M, 0.33, -2.1, 0.43, 0)];
  // a small rear wing above the fan
  trTkBox(0.3, 0.025, 0.95, M.carbon, b, -1.9, 0.88, 0, -0.12); for (const s of [-1, 1]) trTkBox(0.38, 0.26, 0.02, M.carbon, b, -1.9, 0.82, s * 0.48);
  for (const [x, s] of [[1.55, -1], [1.55, 1], [-1.15, -1], [-1.15, 1]]) trTkSusp(b, M.carbon, [[[x + 0.25, 0.32, s * 0.25], [x, 0.34, s * 0.6]], [[x - 0.25, 0.26, s * 0.25], [x, 0.28, s * 0.6]]]);
  const W = [trTkWheel(b, M, 0.31, 0.28, 1.55, 0.31, -0.78, 4), trTkWheel(b, M, 0.31, 0.28, 1.55, 0.31, 0.78, 4), trTkWheel(b, M, 0.36, 0.46, -1.15, 0.36, -0.84, 4), trTkWheel(b, M, 0.36, 0.46, -1.15, 0.36, 0.84, 4)];
  return { root, body: b, wheels: W, fans: F };
}

// a tiny closed single-seat fan car: a low pearl-white wedge, a bubble canopy, wheel pods, glowing side vents
function trTkMcm(M) {
  const root = new THREE.Group(), b = new THREE.Group(); root.add(b);
  trTkProfile([[1.5, 0.1], [1.58, 0.22], [1.05, 0.36], [0.25, 0.48], [-0.75, 0.6], [-1.42, 0.58], [-1.48, 0.1]], 1.0, M.mcm, b, { bevel: 0.07, taper: (x) => MathX.lerp(1, 0.75, MathX.clamp((x - 0.3) / 1.3, 0, 1)) });
  for (const x of [0.98, -0.92]) for (const s of [-1, 1]) trTkProfile([[x + 0.42, 0.12], [x + 0.36, 0.4], [x + 0.12, 0.52], [x - 0.22, 0.52], [x - 0.4, 0.4], [x - 0.42, 0.12]], 0.3, M.mcm, b, { bevel: 0.05, z: s * 0.6 });
  const can = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.glass); can.scale.set(0.72, 0.3, 0.38); can.position.set(0.05, 0.5, 0); b.add(can);
  trTkBox(2.9, 0.08, 1.06, M.carbon, b, 0, 0.07, 0, 0, 0, 0.03);
  for (const s of [-1, 1]) { trTkBox(0.5, 0.15, 0.03, M.vent, b, -0.25, 0.3, s * 0.51); trTkBox(2.0, 0.03, 0.02, M.accent, b, 0.15, 0.17, s * 0.51); }
  trTkBox(0.03, 0.05, 0.8, M.redLamp, b, -1.5, 0.48, 0);
  const W = [trTkWheel(b, M, 0.26, 0.24, 0.98, 0.26, -0.6, 4), trTkWheel(b, M, 0.26, 0.24, 0.98, 0.26, 0.6, 4), trTkWheel(b, M, 0.26, 0.24, -0.92, 0.26, -0.6, 4), trTkWheel(b, M, 0.26, 0.24, -0.92, 0.26, 0.6, 4)];
  return { root, body: b, wheels: W };
}

// the air: ribbons (strips) with dashes moving along them; per-vertex alpha so each can fade in and out
function trTkRibbons(scene, NS, NP) {
  const g = new THREE.BufferGeometry(), P = new Float32Array(NS * NP * 2 * 3), U = new Float32Array(NS * NP * 2 * 2), A = new Float32Array(NS * NP * 2), idx = [];
  for (let s = 0; s < NS; s++) for (let i = 0; i < NP - 1; i++) { const a = (s * NP + i) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setAttribute('aA', new THREE.BufferAttribute(A, 1)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 }, uA: { value: 0 } },
    vertexShader: 'attribute float aA; varying vec2 vU; varying float vA; void main(){ vU = uv; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uA; varying vec2 vU; varying float vA;
      void main(){ float d = fract(vU.x * 0.45 - uT); float dash = smoothstep(0.0, 0.1, d) * (1.0 - smoothstep(0.5, 0.75, d));
        float edge = 1.0 - pow(abs(vU.y * 2.0 - 1.0), 2.0);
        gl_FragColor = vec4(mix(vec3(0.62, 0.84, 1.0), vec3(1.0), 0.35 * dash), uA * vA * (0.3 + 0.7 * dash) * edge * 0.9); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; scene.add(mesh);
  return {
    mesh, mat,
    // point i of ribbon s at (x, y, z), half-width w (across y), distance along the ribbon u, alpha a
    pt(s, i, x, y, z, w, u, a) { const k = (s * NP + i) * 2; P.set([x, y - w, z, x, y + w, z], k * 3); U.set([u, 0, u, 1], k * 2); A[k] = A[k + 1] = a; },
    done() { g.attributes.position.needsUpdate = g.attributes.uv.needsUpdate = g.attributes.aA.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------------------------------------------------
TR_SET_BUILDERS.track = (app) => {
  const S = trSet(app, { sky: '#1b2638', fog: 0.004, fogColor: '#2a3346', fov: 40, sun: [20, 40, 25], sunColor: '#f2f4ff', sunI: 2.4,
    hemi: ['#5d7398', '#2a241e', 0.8], shadow: 1024, shadowR: 14, shadowFar: 200, far: 3000, env: ['#3a4c6c', '#b58a6a', '#1a1714'] });
  const { scene, camera, sun, hemi } = S;
  scene.environmentIntensity = 0.7;
  const sky = trSky(scene, '#0d1a36', '#d9875a', '#1a1a1e', { r: 2400, sunDir: [-0.6, 0.06, -0.8], sunGlow: '#ff9a50', hw: 0.18 });
  const SU = sky.material.uniforms;
  const phys = (c, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color: c, roughness: 0.32, metalness: 0.15, clearcoat: 0.9, clearcoatRoughness: 0.12 }, o));
  const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, metalness: 0 }, o));
  const M = {
    f1: phys('#2b2f36'), white: phys('#ece8e0'), carbon: std('#15171b', { roughness: 0.45, metalness: 0.3 }), accent: std('#ffb066', { emissive: new THREE.Color('#ff9a40'), emissiveIntensity: 0.6 }),
    chap: phys('#f1efe8', { roughness: 0.38 }), bt: phys('#34454f'), mcm: phys('#e7eae6', { roughness: 0.28 }),
    tyre: std('#151618', { roughness: 0.9, side: THREE.DoubleSide }), rim: std('#3a3d42', { roughness: 0.35, metalness: 0.7 }), spoke: std('#5a5e66', { roughness: 0.35, metalness: 0.7 }), hub: std('#ffb066', { roughness: 0.4 }),
    duct: std('#060708', { roughness: 0.9 }), blade: std('#2a2c30', { roughness: 0.5, metalness: 0.4 }), blur: new THREE.MeshBasicMaterial({ color: '#30343a', transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }),
    glass: phys('#121a22', { roughness: 0.05, metalness: 0.4, clearcoat: 1 }), helmet: phys('#f2efe8'), visor: std('#0d1014', { roughness: 0.1, metalness: 0.6 }),
    redLamp: std('#ff3020', { emissive: new THREE.Color('#ff2010'), emissiveIntensity: 2.5 }), vent: std('#10151c', { emissive: new THREE.Color('#3d8fff'), emissiveIntensity: 1.2 }),
    skin: std('#c89a7a'),
  };
  const ambM = new THREE.MeshStandardMaterial({ color: '#ffb066', emissive: new THREE.Color('#ff9a40'), emissiveIntensity: 2.2 });
  const bluM = new THREE.MeshStandardMaterial({ color: '#6ab4ff', emissive: new THREE.Color('#3d8fff'), emissiveIntensity: 2.0 });
  const whiM = new THREE.MeshStandardMaterial({ color: '#f4f0e8', emissive: new THREE.Color('#d8d4cc'), emissiveIntensity: 1.2 });
  const G = {}; for (const k of ['circuit', 'tunnel', 'period', 'garage', 'rig']) { G[k] = new THREE.Group(); scene.add(G[k]); }
  const L = 640;                                                       // length of every streaming strip

  // ================= the floodlit circuit (race)
  const C = {};
  {
    const g = G.circuit;
    C.road = trTkStrip(g, L, 14, (x, w, h) => {
      x.fillStyle = '#2a2c30'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const v = 30 + Math.floor(hash1(i * 3.1) * 30); x.fillStyle = `rgba(${v},${v + 1},${v + 4},0.8)`; x.fillRect(hash1(i * 7.7) * w, hash1(i * 1.3) * h, 6 + hash1(i * 2.2) * 40, 1.5); }
      x.fillStyle = 'rgba(14,14,16,0.45)'; x.fillRect(0, h * 0.38, w, h * 0.24);            // the rubbered racing line
      x.fillStyle = '#e6e2d8'; x.fillRect(0, 5, w, 7); x.fillRect(0, h - 12, w, 7);
    }, 1024, 256, 32, 1, { roughness: 0.82 }, (m) => { m.rotation.x = -Math.PI / 2; });
    const kerb = (x, w, h) => { for (let k = 0; k < 2; k++) { x.fillStyle = k ? '#e8e4dc' : '#c8322a'; x.fillRect(k * w / 2, 0, w / 2, h); } x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, h * 0.8, w, h * 0.2); };
    C.kerbs = [-1, 1].map((s) => trTkStrip(g, L, 1.2, kerb, 128, 16, 3.2, 1, { roughness: 0.6 }, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, 0.02, s * 7.6); }));
    C.grass = trTkStrip(g, L, 6, (x, w, h) => { x.fillStyle = '#28361f'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = hash1(i) < 0.5 ? 'rgba(60,80,40,0.6)' : 'rgba(20,28,16,0.6)'; x.fillRect(hash1(i * 3.3) * w, hash1(i * 5.1) * h, 8, 2); } }, 512, 64, 20, 1, {}, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, 0.01, 11.2); });
    C.runoff = trTkStrip(g, L, 7, (x, w, h) => { x.fillStyle = '#3a3c40'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2000; i++) { const v = 50 + Math.floor(hash1(i * 9.1) * 20); x.fillStyle = `rgb(${v},${v},${v + 3})`; x.fillRect(hash1(i * 1.7) * w, hash1(i * 4.3) * h, 3, 2); } x.fillStyle = '#2f5aa0'; x.fillRect(0, h * 0.55, w, h * 0.45); }, 512, 64, 20, 1, {}, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, 0.01, -11.7); });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), std('#1b2016', { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; g.add(ground);
    // walls (static: they look the same all along), the catch fence (texture streams), posts
    for (const z of [-15.3, 14.3]) { trTkBox(L, 1.05, 0.4, std('#c9c6be', { roughness: 0.8 }), g, 0, 0.52, z); trTkBox(L, 0.12, 0.42, std('#c8322a'), g, 0, 1.06, z); }
    C.fence = trTkStrip(g, L, 3.6, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(200,205,210,0.55)'; x.lineWidth = 1.5; for (let i = -h; i < w + h; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke(); } }, 256, 128, 2, 7, { metalness: 0.6, roughness: 0.4, alpha: true }, (m) => { m.position.set(0, 2.9, -15.5); });
    C.fence.tex.repeat.set(L / 2, 7); Object.assign(C.fence.m.material, { transparent: true, opacity: 0.55, alphaTest: 0.02, depthWrite: false });
    const posts = []; for (let i = 0; i < 80; i++) posts.push([i * 5, 2.4, -15.5]);
    C.posts = trTkRep(g, new THREE.CylinderGeometry(0.06, 0.06, 4.8, 6), std('#8a8e94', { metalness: 0.6, roughness: 0.4 }), posts, 400);
    // light poles both sides, the lamp heads bright (they bloom)
    const poles = [], heads = [];
    for (let i = 0; i < 9; i++) for (const s of [-1, 1]) { const x = i * 44 + (s > 0 ? 22 : 0), z = s > 0 ? 17.5 : -18.5; poles.push([x, 11, z]); heads.push([x, 22.4, z - s * 0.8, 1, 1, 1, 0]); }
    C.poles = trTkRep(g, new THREE.CylinderGeometry(0.22, 0.32, 22, 8), std('#4a4d52', { metalness: 0.5, roughness: 0.5 }), poles, 396);
    C.heads = trTkRep(g, new THREE.BoxGeometry(3.2, 1.4, 0.5), std('#fff6e4', { emissive: new THREE.Color('#fff1d8'), emissiveIntensity: 6 }), heads, 396);
    // grandstands on the far side: a raked tier with a crowd, a roof, a back wall
    const crowd = trTkTex(512, 128, (x, w, h) => { x.fillStyle = '#1a1c22'; x.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { const c = ['#8a7a6a', '#5a6a8a', '#9a8a5a', '#6a4a4a', '#cfc6b6', '#3a4a5a'][Math.floor(hash1(i * 13) * 6)]; x.globalAlpha = 0.55; x.fillStyle = c; x.fillRect(hash1(i * 3.7) * w, hash1(i * 6.1) * h, 2.5, 3); x.globalAlpha = 1; } for (let r = 0; r < h; r += 10) { x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(0, r, w, 2); } });
    crowd.repeat.set(6, 1);
    C.stands = [];
    for (let k = 0; k < 2; k++) {
      const s = new THREE.Group(); g.add(s);
      const tier = new THREE.Mesh(new THREE.BoxGeometry(80, 0.4, 16), std('#6e6c6a', { map: crowd, emissive: new THREE.Color('#1a1614'), emissiveIntensity: 0.2 })); tier.rotation.x = 0.55; tier.position.set(0, 6, -30); s.add(tier);
      trTkBox(80, 14, 0.6, std('#22252c'), s, 0, 7, -37.5);
      trTkBox(82, 0.5, 13, std('#30343c', { metalness: 0.3 }), s, 0, 14.5, -31.5);
      for (let i = 0; i < 6; i++) trTkBox(0.4, 14, 0.4, std('#30343c'), s, -38 + i * 15.2, 7, -37);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(80, 0.18, 0.18), std('#fff2dc', { emissive: new THREE.Color('#ffe8c8'), emissiveIntensity: 3 })); strip.position.set(0, 14.1, -25.3); s.add(strip);
      C.stands.push({ g: s, x0: k * 200 + 60 });
    }
    // the city far off, against the orange horizon
    const city = []; for (let i = 0; i < 70; i++) city.push([(trR(i, 41) - 0.5) * 2600, 0, -700 - trR(i, 42) * 260, 24 + trR(i, 43) * 40, 16 + Math.pow(trR(i, 44), 2) * 90, 20 + trR(i, 45) * 30]);
    const cityM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), std('#141720', { roughness: 1, emissive: new THREE.Color('#2a2018'), emissiveIntensity: 0.4 }), city.length);
    city.forEach((c, i) => cityM.setMatrixAt(i, _tkM4.compose(_tkV.set(c[0], 0, c[2]), _tkQ.identity(), _tkS.set(c[3], c[4], c[5]))));
    g.add(cityM);
  }

  // ================= the tunnel (theory, catch): 14 m wide, 6.4 m high, lit by strip lights on the upper walls
  const T = {};
  {
    const g = G.tunnel, H = TR_TK.ceil, Wd = 7;
    T.floor = trTkStrip(g, L, 2 * Wd, (x, w, h) => {
      x.fillStyle = '#26282c'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 2000; i++) { const v = 30 + Math.floor(hash1(i * 5.1) * 26); x.fillStyle = `rgb(${v},${v},${v + 3})`; x.fillRect(hash1(i * 7.3) * w, hash1(i * 1.9) * h, 4 + hash1(i) * 20, 1.5); }
      x.fillStyle = '#d8d4ca'; x.fillRect(0, 8, w, 6); x.fillRect(0, h - 14, w, 6);
      for (const r of [h / 3, 2 * h / 3]) for (let k = 0; k < w; k += 256) x.fillRect(k, r - 3, 140, 6);
    }, 1024, 256, 24, 1, { roughness: 0.75 }, (m) => { m.rotation.x = -Math.PI / 2; });
    T.ceil = trTkStrip(g, L, 2 * Wd, (x, w, h) => {
      x.fillStyle = '#8a8a86'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 2500; i++) { const v = 110 + Math.floor(hash1(i * 2.3) * 40); x.fillStyle = `rgba(${v},${v},${v - 4},0.5)`; x.fillRect(hash1(i * 5.7) * w, hash1(i * 3.1) * h, 3, 3); }
      x.fillStyle = 'rgba(40,40,42,0.8)'; for (let k = 0; k < w; k += 128) x.fillRect(k, 0, 4, h);
      x.fillStyle = 'rgba(30,30,32,0.35)'; x.fillRect(0, h * 0.62, w, h * 0.16);           // the tyre marks where the car runs
    }, 1024, 256, 20, 1, { roughness: 0.85 }, (m) => { m.rotation.x = Math.PI / 2; m.position.y = H; });
    const wall = (x, w, h) => {
      x.fillStyle = '#5a5e64'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#d9d4c6'; x.fillRect(0, h * 0.5, w, h * 0.5);                            // tiles low down
      x.strokeStyle = 'rgba(120,118,110,0.7)'; x.lineWidth = 1; for (let k = 0; k < w; k += 16) { x.beginPath(); x.moveTo(k, h * 0.5); x.lineTo(k, h); x.stroke(); } for (let r = h * 0.5; r < h; r += 16) { x.beginPath(); x.moveTo(0, r); x.lineTo(w, r); x.stroke(); }
      x.fillStyle = '#e8b030'; x.fillRect(0, h * 0.5 - 6, w, 4);
      x.fillStyle = '#20232a'; for (let k = 0; k < w; k += 256) x.fillRect(k + 60, h * 0.56, 70, h * 0.36);     // doors / niches
      x.fillStyle = '#3fbf6a'; for (let k = 0; k < w; k += 256) x.fillRect(k + 70, h * 0.52, 50, 10);
    };
    T.walls = [-1, 1].map((s) => { const st = trTkStrip(g, L, H, wall, 1024, 128, 30, 1, { roughness: 0.6 }, (m) => { m.position.set(0, H / 2, s * Wd); m.rotation.y = s > 0 ? Math.PI : 0; }); st.sign = s > 0 ? -1 : 1; return st; });
    const fx = []; for (let i = 0; i < 100; i++) for (const s of [-1, 1]) fx.push([i * 6.5 + (s > 0 ? 3.2 : 0), H - 0.35, s * (Wd - 0.35), 1, 1, 1]);
    T.lights = trTkRep(g, new THREE.BoxGeometry(2.0, 0.14, 0.32), std('#e8f0ff', { emissive: new THREE.Color('#dce8ff'), emissiveIntensity: 5 }), fx, 650);
    const gl = []; for (let i = 0; i < 60; i++) for (const s of [-1, 1]) gl.push([i * 12 + (s > 0 ? 6 : 0), 0.95, s * (Wd - 0.04), 1, 1, 1]);
    T.guide = trTkRep(g, new THREE.BoxGeometry(0.5, 0.08, 0.05), std('#bfe0ff', { emissive: new THREE.Color('#8fc4ff'), emissiveIntensity: 3 }), gl, 720);
    T.pl = [new THREE.PointLight('#dfe8ff', 0, 30, 1.4), new THREE.PointLight('#dfe8ff', 0, 30, 1.4), new THREE.PointLight('#ffd9b0', 0, 30, 1.4)];
    T.pl.forEach((p) => scene.add(p));
  }

  // ================= the period circuit (chap70, fan78): golden afternoon, grass, straw bales, armco, trees
  const P = {};
  {
    const g = G.period;
    P.road = trTkStrip(g, L, 10, (x, w, h) => {
      x.fillStyle = '#4a4a4a'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) { const v = 60 + Math.floor(hash1(i * 4.1) * 30); x.fillStyle = `rgba(${v},${v - 1},${v - 3},0.8)`; x.fillRect(hash1(i * 3.3) * w, hash1(i * 8.1) * h, 3 + hash1(i) * 24, 1.6); }
      for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(30,30,30,0.35)'; x.fillRect(hash1(i * 77) * w, hash1(i * 31) * h, 60 + hash1(i * 5) * 200, 8 + hash1(i * 9) * 30); }   // patches
      x.fillStyle = '#e4e0d4'; x.fillRect(0, 6, w, 5); x.fillRect(0, h - 11, w, 5);
    }, 1024, 256, 30, 1, { roughness: 0.85 }, (m) => { m.rotation.x = -Math.PI / 2; });
    const grass = (x, w, h) => { for (let k = 0; k < 2; k++) { x.fillStyle = k ? '#5d7a34' : '#4f6c2c'; x.fillRect(k * w / 2, 0, w / 2, h); } for (let i = 0; i < 4000; i++) { x.fillStyle = hash1(i * 2) < 0.5 ? 'rgba(110,140,60,0.5)' : 'rgba(40,60,24,0.5)'; x.fillRect(hash1(i * 3.9) * w, hash1(i * 7.7) * h, 6, 2); } };
    P.grass = [-1, 1].map((s) => trTkStrip(g, L, 140, grass, 256, 128, 14, 10, { roughness: 1 }, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, -0.01, s * 75); }));
    const bales = []; for (let i = 0; i < 220; i++) { if (Math.floor(i / 7) % 3 === 2) continue; for (const s of [-1, 1]) bales.push([i * 1.18, 0.26, s * 6.4, 1, 1, 1, (trR(i, s + 5) - 0.5) * 0.08]); }
    P.bales = trTkRep(g, new THREE.RoundedBoxGeometry(1.1, 0.5, 0.55, 2, 0.08), std('#c9a85a', { roughness: 1 }), bales, 260, { recv: true });
    trTkBox(L, 0.32, 0.06, std('#b8bcc0', { metalness: 0.7, roughness: 0.35 }), g, 0, 0.62, -9);
    const ap = []; for (let i = 0; i < 70; i++) ap.push([i * 4, 0.4, -9.08]);
    P.armco = trTkRep(g, new THREE.BoxGeometry(0.1, 0.8, 0.1), std('#6a6e72', { metalness: 0.5 }), ap, 280);
    const trees = []; for (let i = 0; i < 110; i++) { const s = trR(i, 51) < 0.55 ? -1 : 1; trees.push([trR(i, 52) * 600, 0, s * (24 + trR(i, 53) * 70), 1, 1, 1, trR(i, 54) * 6]); }
    P.trunks = trTkRep(g, new THREE.CylinderGeometry(0.25, 0.35, 5, 6).translate(0, 2.5, 0), std('#4a3a2a'), trees, 600);
    P.crowns = trTkRep(g, new THREE.IcosahedronGeometry(3.4, 1).scale(1, 1.25, 1).translate(0, 7.5, 0), std('#3e5a2a', { flatShading: true, roughness: 1 }), trees.map((t, i) => [t[0], 0, t[2], 0.8 + trR(i, 55) * 0.7, 0.8 + trR(i, 56) * 0.7, 0.8 + trR(i, 57) * 0.7, t[6]]), 600, { colors: (i) => ['#3e5a2a', '#4a6a30', '#566e34', '#35502a'][Math.floor(trR(i, 58) * 4)] });
    const tents = []; for (let i = 0; i < 8; i++) tents.push([i * 70 + 20, 0, -18 - trR(i, 61) * 6, 1, 1, 1]);
    P.tents = trTkRep(g, new THREE.BoxGeometry(6, 2.6, 4).translate(0, 1.3, 0), std('#ece6d8'), tents, 560);
    P.roofs = trTkRep(g, new THREE.ConeGeometry(4.4, 2, 4).rotateY(Math.PI / 4).scale(1.0, 1, 0.68).translate(0, 3.6, 0), std('#e8e0cc'), tents, 560, { colors: (i) => ['#e9e2d0', '#d9b46a', '#e9e2d0', '#a8c0c8'][i % 4] });
    const flags = []; for (let i = 0; i < 16; i++) flags.push([i * 35 + 8, 0, -11.5]);
    P.fpoles = trTkRep(g, new THREE.CylinderGeometry(0.05, 0.05, 6, 6).translate(0, 3, 0), std('#d8d8d0'), flags, 560);
    P.flags = trTkRep(g, new THREE.PlaneGeometry(1.6, 1.0).translate(0.8, 5.4, 0), std('#ffffff', { side: THREE.DoubleSide }), flags, 560, { colors: (i) => ['#e8c43a', '#2f7a4a', '#e9e6dc', '#3a68b0', '#d04a3a'][i % 5] });
    // the marshal post with the black flag (1970) and the finish line with the chequered flag (1978)
    const blackF = trTkTex(64, 48, (x, w, h) => { x.fillStyle = '#0a0a0c'; x.fillRect(0, 0, w, h); });
    const chq = trTkTex(64, 48, (x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { x.fillStyle = (i + j) % 2 ? '#f2f0ea' : '#121214'; x.fillRect(i * 8, j * 8, 8, 8); } }, false);
    P.post = new THREE.Group(); g.add(P.post);
    trTkBox(1.5, 2.2, 0.9, std('#e8e2d4'), P.post, 0.4, 1.1, 1.0); trTkBox(1.8, 0.12, 1.2, std('#c8322a'), P.post, 0.4, 2.26, 1.0);
    P.marshal = trTkPerson(P.post, M, '#e8742a', blackF); P.marshal.g.position.set(0, 0, 0); P.marshal.g.rotation.y = 0.4;
    P.fin = new THREE.Group(); g.add(P.fin);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 10), std('#ffffff', { map: trTkTex(64, 512, (x, w, h) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 20; j++) { x.fillStyle = (i + j) % 2 ? '#efece4' : '#151517'; x.fillRect(i * 32, j * 25.6, 32, 25.6); } }, false) }));
    line.rotation.x = -Math.PI / 2; line.position.y = 0.012; P.fin.add(line);
    trTkBox(1.6, 1.3, 1.6, std('#d8d2c4'), P.fin, 0, 0.65, 7.6); trTkBox(1.8, 0.08, 1.8, std('#5a5048'), P.fin, 0, 1.32, 7.6);
    for (const z of [-6.2, 6.2]) trTkBox(0.3, 5.2, 0.3, std('#e8e4dc'), P.fin, 0, 2.6, z);
    trTkBox(0.12, 0.9, 12.6, std('#ffffff', { map: trTkTex(512, 32, (x, w, h) => { x.fillStyle = '#efece4'; x.fillRect(0, 0, w, h); for (let i = 0; i < 64; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#efece4' : '#151517'; x.fillRect(i * 8, j * 8, 8, 8); } }, false) }), P.fin, 0, 5.3, 0);
    P.flagman = trTkPerson(P.fin, M, '#e9e6dc', chq); P.flagman.g.position.set(0, 1.36, 7.2); P.flagman.g.rotation.y = 0.5;
  }

  // ================= the garage (fan78's ending): dark inside, the pit lane bright outside, a roll-up door
  const GR = {};
  {
    const g = G.garage, X0 = -6, X1 = 3, Z = 3.6, Hh = 3.4;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 2 * Z), std('#55585c', { roughness: 0.35, metalness: 0.1 })); floor.rotation.x = -Math.PI / 2; floor.position.set((X0 + X1) / 2, 0.005, 0); floor.receiveShadow = true; g.add(floor);
    const wallM = std('#3a3d42', { roughness: 0.9 });
    trTkBox(0.3, Hh, 2 * Z + 0.6, std('#2c2f34', { map: trTkTex(256, 128, (x, w, h) => { x.fillStyle = '#2c2f34'; x.fillRect(0, 0, w, h); x.fillStyle = '#25282c'; for (let i = 0; i < w; i += 6) for (let j = 0; j < h; j += 6) x.fillRect(i, j, 2, 2); }) }), g, X0 - 0.15, Hh / 2, 0);
    for (const s of [-1, 1]) trTkBox(X1 - X0 + 0.3, Hh, 0.3, wallM, g, (X0 + X1) / 2, Hh / 2, s * (Z + 0.15));
    trTkBox(X1 - X0 + 0.3, 0.3, 2 * Z + 0.6, wallM, g, (X0 + X1) / 2, Hh + 0.15, 0);
    trTkBox(0.4, 0.6, 2 * Z + 0.6, std('#d8d4ca'), g, X1 + 0.05, Hh - 0.1, 0);              // the lintel
    for (const s of [-1, 1]) trTkBox(0.4, Hh, 0.5, std('#d8d4ca'), g, X1 + 0.05, Hh / 2, s * (Z - 0.05));
    // tool chests, tyre stacks, strip lights
    for (let i = 0; i < 3; i++) { trTkBox(0.6, 1.05, 1.2, std('#4a4e56', { metalness: 0.4, roughness: 0.4 }), g, X0 + 0.45, 0.53, -2.4 + i * 1.35, 0, 0, 0.03); trTkBox(0.02, 0.03, 0.9, M.accent, g, X0 + 0.76, 0.9, -2.4 + i * 1.35); }
    for (let k = 0; k < 2; k++) for (let j = 0; j < 4; j++) { const ty = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.13, 8, 18), M.tyre); ty.rotation.x = Math.PI / 2; ty.position.set(-3.6 + k * 0.85, 0.13 + j * 0.26, -Z + 0.5); ty.castShadow = true; g.add(ty); }
    GR.strip = std('#f4f6ff', { emissive: new THREE.Color('#e8eeff'), emissiveIntensity: 3 });
    for (const x of [-4, -1]) trTkBox(1.6, 0.06, 0.16, GR.strip, g, x, Hh - 0.05, 0);
    // the door: ribbed, it rolls down
    const doorTex = trTkTex(64, 256, (x, w, h) => { for (let j = 0; j < h; j += 8) { x.fillStyle = '#8a8e94'; x.fillRect(0, j, w, 6); x.fillStyle = '#5a5e64'; x.fillRect(0, j + 6, w, 2); } });
    doorTex.repeat.set(4, 4);
    GR.door = trTkBox(0.08, Hh - 0.4, 2 * Z - 0.4, std('#8a8e94', { map: doorTex, metalness: 0.5, roughness: 0.45 }), g, X1 - 0.12, Hh / 2, 0);
    // outside: the pit lane, the pit wall, a far grandstand silhouette
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(80, 120), std('#8a8680', { roughness: 0.8 })); pit.rotation.x = -Math.PI / 2; pit.position.set(X1 + 40, 0, 0); pit.receiveShadow = true; g.add(pit);
    trTkBox(0.6, 1.1, 120, std('#d8d4ca'), g, X1 + 11, 0.55, 0);
    trTkBox(0.2, 0.15, 120, std('#c8322a'), g, X1 + 11, 1.15, 0);
    trTkBox(14, 10, 90, std('#3a3e46'), g, X1 + 60, 5, 0);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), std('#5a6a40', { roughness: 1 })); outer.rotation.x = -Math.PI / 2; outer.position.set(150, -0.02, 0); g.add(outer);
    GR.X1 = X1; GR.H = Hh;
  }

  // ================= the test rig (mcm): a road section on a steel frame that turns upside down
  const RG = {};
  {
    const g = G.rig, AY = 3.4;
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std('#ffffff', { map: (() => { const t = trTkTex(512, 512, (x, w, h) => { x.fillStyle = '#6a6762'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8000; i++) { const v = 85 + Math.floor(hash1(i * 1.3) * 40); x.fillStyle = `rgba(${v},${v - 2},${v - 6},0.5)`; x.fillRect(hash1(i * 5.9) * w, hash1(i * 2.1) * h, 2, 2); } x.strokeStyle = 'rgba(30,28,26,0.6)'; x.lineWidth = 3; for (let k = 0; k <= w; k += 128) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, h); x.stroke(); x.beginPath(); x.moveTo(0, k); x.lineTo(w, k); x.stroke(); } }); t.repeat.set(25, 25); return t; })(), roughness: 0.85 }));
    pad.rotation.x = -Math.PI / 2; pad.receiveShadow = true; g.add(pad);
    const steel = std('#d89a2a', { metalness: 0.5, roughness: 0.45 }), dark = std('#2a2d32', { metalness: 0.6, roughness: 0.4 });
    // two A-frame towers on plinths, the axle through them, a motor with a big ring gear
    for (const s of [-1, 1]) {
      const x = s * 3.2;
      trTkBox(0.9, 0.3, 3.2, std('#9a968e'), g, x, 0.15, 0);
      for (const z of [-1.3, 1.3]) trBeam(new THREE.Vector3(x, 0.3, z), new THREE.Vector3(x, AY + 0.1, 0), 0.22, steel, g);
      trBeam(new THREE.Vector3(x, 1.4, -0.95), new THREE.Vector3(x, 1.4, 0.95), 0.16, steel, g);
      trTkBox(0.5, 0.6, 0.6, dark, g, x, AY, 0, 0, 0, 0.05);
    }
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.2, 12), dark); axle.rotation.z = Math.PI / 2; axle.position.y = AY; g.add(axle);
    trTkBox(0.8, 1.0, 1.0, std('#3a3e46', { metalness: 0.4, roughness: 0.5 }), g, -3.95, AY, 0, 0, 0, 0.06);
    trTkBox(0.02, 0.06, 0.4, M.accent, g, -4.36, AY + 0.3, 0);
    RG.pivot = new THREE.Group(); RG.pivot.position.y = AY; g.add(RG.pivot);
    const gear = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.09, 8, 40), dark); gear.rotation.y = Math.PI / 2; gear.position.x = -2.85; RG.pivot.add(gear);
    for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.6, 0.08), dark); sp.position.x = -2.85; sp.rotation.x = k * Math.PI / 4; RG.pivot.add(sp); }
    // the road section: asphalt on top, a steel deck under it, hazard edges
    const asph = trTkTex(256, 256, (x, w, h) => { x.fillStyle = '#2c2e32'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { const v = 34 + Math.floor(hash1(i * 3.7) * 30); x.fillStyle = `rgb(${v},${v + 1},${v + 3})`; x.fillRect(hash1(i * 6.1) * w, hash1(i * 2.7) * h, 2, 2); } x.fillStyle = '#e4e0d4'; x.fillRect(0, 4, w, 5); x.fillRect(0, h - 9, w, 5); });
    asph.repeat.set(2, 1);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.14, 2.8), [dark, dark, std('#ffffff', { map: asph, roughness: 0.85 }), dark, dark, dark]); plate.castShadow = plate.receiveShadow = true; RG.pivot.add(plate);
    const haz = trTkTex(256, 16, (x, w, h) => { for (let i = -2; i < 20; i++) { x.fillStyle = i % 2 ? '#e8b030' : '#151517'; x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 + 16, 0); x.lineTo(i * 16 + 8, h); x.lineTo(i * 16 - 8, h); x.fill(); } });
    haz.repeat.set(3, 1);
    for (const s of [-1, 1]) trTkBox(5.4, 0.16, 0.04, std('#ffffff', { map: haz }), RG.pivot, 0, 0, s * 1.42);
    for (const z of [-1.1, 0, 1.1]) trTkBox(5.6, 0.3, 0.16, steel, RG.pivot, 0, -0.24, z);
    for (const x of [-2.5, -1.25, 0, 1.25, 2.5]) trTkBox(0.16, 0.3, 2.6, steel, RG.pivot, x, -0.24, 0);
    // floodlights on stands, a barrier, a few people watching
    for (const [x, z] of [[-9, -7], [9, -7], [-10, 6]]) { trBeam(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, 6, z), 0.12, dark, g); const h = trTkBox(1.2, 0.8, 0.3, std('#fff4e0', { emissive: new THREE.Color('#fff0d8'), emissiveIntensity: 5 }), g, x, 6.2, z); h.lookAt(0, 2, 0); }
    const rail = std('#d8d4ca', { metalness: 0.3 });
    for (const z of [-8, 8]) trTkBox(22, 0.08, 0.08, rail, g, 0, 1.0, z);
    const rp = []; for (let i = 0; i < 12; i++) for (const z of [-8, 8]) rp.push([-11 + i * 2, 0.5, z]);
    trTkRep(g, new THREE.BoxGeometry(0.08, 1.0, 0.08), rail, rp, 1e6).update(0);
    RG.AY = AY;
  }

  // ================= the cars, the arrows, the air
  const car = { f1: trTkF1(M), chap: trTkChap(M), bt: trTkBt(M), mcm: trTkMcm(M) };
  for (const k of ['f1', 'chap', 'bt']) scene.add(car[k].root);
  RG.pivot.add(car.mcm.root); car.mcm.root.position.y = 0.07;
  const arrows = { amb: [0, 1, 2].map(() => trArrow(1, 0.09, ambM)), blu: [0, 1].map(() => trArrow(1, 0.08, bluM)), whi: trArrow(1, 0.08, whiM) };
  for (const a of [...arrows.amb, ...arrows.blu, arrows.whi]) scene.add(a);
  const mcmArr = [0, 1].map(() => { const a = trArrow(1, 0.07, ambM); car.mcm.root.add(a); return a; });
  // an arrow from `from` along `dir`, length Ln, grown in by a (0…1)
  const arrow = (A, from, dir, Ln, a) => {
    A.visible = a > 0.01 && Ln > 0.05; if (!A.visible) return;
    const s = 0.35 + 0.65 * a; A.position.copy(from); A.quaternion.setFromUnitVectors(_tkUp, dir.clone().normalize()); A.scale.set(s, Ln * a, s);
  };
  // an arrow whose TIP is at `tip`
  const arrowTip = (A, tip, dir, Ln, a) => { const d = dir.clone().normalize(); arrow(A, tip.clone().addScaledVector(d, -Ln * a), d, Ln, a); };
  const NS = 18, NP = 56, rib = trTkRibbons(scene, NS, NP);
  const puffs = trPuffs(scene, 5000), sparks = trPuffs(scene, 2500, { additive: true });

  const show = (env) => { for (const k in G) G[k].visible = k === env; };
  const showCar = (k) => { for (const c in car) car[c].root.visible = c === k; };
  const hideArrows = () => { for (const a of [...arrows.amb, ...arrows.blu, arrows.whi, ...mcmArr]) a.visible = false; };
  const spinWheels = (c, X) => { for (const w of c.wheels) w.spin.rotation.z = -X / w.r; };
  const spinFans = (c, ang, blur) => { for (const f of c.fans) { f.spin.rotation.x = ang; f.blur.material.opacity = 0.35 * blur; } };
  const look = (env) => {
    // sky, fog, sun and fill per place
    const L0 = {
      circuit: { top: '#0d1a36', hor: '#d9875a', low: '#1a1a1e', glow: '#ff9a50', sd: [-0.6, 0.06, -0.8], fog: '#3a3846', fd: 0.0035, sun: [18, 40, 22], sc: '#f2f4ff', si: 2.4, h: ['#4a5f8a', '#2a2420', 0.75], env: 0.7 },
      tunnel: { top: '#1a2230', hor: '#1a2230', low: '#1a2230', glow: '#000000', sd: [0, 1, 0], fog: '#141a24', fd: 0.012, sun: [5, 40, 5], sc: '#000000', si: 0, h: ['#6a7a98', '#5a5c62', 0.7], env: 0.9 },
      period: { top: '#4d79b8', hor: '#f2c890', low: '#7a7458', glow: '#ffcf8a', sd: [-0.5, 0.14, -0.86], fog: '#d8c8a8', fd: 0.0011, sun: [30, 24, 34], sc: '#ffd8a8', si: 2.9, h: ['#a9c0e0', '#6a5a38', 0.85], env: 0.9 },
      garage: { top: '#5a86c0', hor: '#f0d0a0', low: '#7a7458', glow: '#ffcf8a', sd: [0.8, 0.2, 0.2], fog: '#d8c8a8', fd: 0.002, sun: [40, 30, 14], sc: '#ffe2b8', si: 3.2, h: ['#9ab0d0', '#5a5040', 0.35], env: 0.5 },
      rig: { top: '#13224a', hor: '#e09060', low: '#24201e', glow: '#ff9a50', sd: [-0.7, 0.08, -0.7], fog: '#3a3640', fd: 0.006, sun: [-14, 22, 26], sc: '#ffd2a0', si: 2.6, h: ['#5d7398', '#2a241e', 0.8], env: 0.8 },
    }[env];
    SU.a.value.set(L0.top); SU.b.value.set(L0.hor); SU.c.value.set(L0.low); SU.sc.value.set(L0.glow); SU.sd.value.set(...L0.sd).normalize();
    sky.visible = env !== 'tunnel';
    scene.background.set(L0.fog); scene.fog = scene.fog || new THREE.FogExp2('#000', 0.01); scene.fog.color.set(L0.fog); scene.fog.density = L0.fd;
    sun.position.set(...L0.sun); sun.color.set(L0.sc); sun.intensity = L0.si;
    hemi.color.set(L0.h[0]); hemi.groundColor.set(L0.h[1]); hemi.intensity = L0.h[2];
    scene.environmentIntensity = L0.env;
    for (const p of T.pl) p.intensity = 0;
  };
  const vib = (t, k = 1) => k * (0.004 * Math.sin(t * 53) + 0.003 * Math.sin(t * 71 + 1));

  // ---------------------------------------------------------------- the modes
  const MODES = {
    // ★ downforce: the wings throw the air up, the air pushes the car down
    race(t) {
      show('circuit'); look('circuit'); showCar('f1');
      const V = 78, X = 900 + V * (t - TR.race), c = car.f1, CT = trTkCutT();
      c.root.position.set(0, vib(t), 0); c.root.quaternion.identity(); c.body.rotation.set(0, 0, 0.004 * Math.sin(t * 3.1));
      spinWheels(c, X);
      for (const s of [C.road, ...C.kerbs, C.grass, C.runoff, C.fence]) s.set(X);
      C.posts.update(X); C.poles.update(X); C.heads.update(X);
      for (const s of C.stands) s.g.position.x = ((s.x0 - X) % 400 + 600) % 400 - 200;
      // the ribbons: over the rear wing (bent UP behind it) and over the front wing; ahead of a wing the air dips a little
      const kU = MathX.smooth(t, trW(16, 'wings').start - 0.3, trW(16, 'throw').start + 0.5);
      rib.mat.uniforms.uT.value = t * 2.4; rib.mat.uniforms.uA.value = MathX.smooth(t, CT.raceB + 0.2, CT.raceB + 1.0);
      let s = 0;
      for (const zz of [-0.32, 0.32]) for (const h0 of [-0.22, 0.02, 0.26, 0.55, 0.95]) {
        const near = Math.exp(-Math.pow((h0 - 0.05) / 0.55, 2));
        for (let i = 0; i < NP; i++) {
          const x = MathX.lerp(0.5, -13, i / (NP - 1));
          const dy = -0.12 * near * Math.exp(-Math.pow((x + 2.1) / 0.6, 2)) + (0.25 + 1.7 * kU) * near * MathX.smooth(-x, 2.4, 7.5) + 0.2 * kU * MathX.smooth(-x, 2.4, 12) * (1 - near);
          const a = MathX.smooth(x, 0.5, -0.4) * MathX.smooth(x, -13, -9) * (h0 < 0 ? MathX.smooth(x, -1.0, -2.2) : 1);
          rib.pt(s, i, x, 0.96 + h0 + dy, zz + 0.04 * h0, 0.035, -x, a);
        }
        s++;
      }
      for (const zz of [-0.62, -0.4, 0.4, 0.62]) for (const h0 of [0.2, 0.42]) {
        const near = h0 < 0.3 ? 1 : 0.5;
        for (let i = 0; i < NP; i++) {
          const x = MathX.lerp(9, 0.9, i / (NP - 1));
          const dy = -0.06 * near * Math.exp(-Math.pow((x - 3.1) / 0.4, 2)) + (0.12 + 0.55 * kU) * near * MathX.smooth(-x, -2.6, -0.9);
          const a = MathX.smooth(x, 9, 7) * MathX.smooth(x, 0.9, 1.7);
          rib.pt(s, i, x, h0 + dy, zz, 0.03, 9 - x, a);
        }
        s++;
      }
      rib.done(); rib.mesh.visible = true;
      // the arrows: blue = the air thrown up (behind each wing), amber = the push down on the wings; then downforce vs weight
      hideArrows();
      const aThrow = MathX.smooth(t, trW(16, 'throw').start - 0.2, trW(16, 'throw').start + 0.4) * (1 - MathX.smooth(t, CT.raceC - 0.3, CT.raceC));
      arrow(arrows.blu[0], new THREE.Vector3(-3.2, 1.25, 0.6), new THREE.Vector3(-0.55, 1, 0), 1.7, aThrow);
      arrow(arrows.blu[1], new THREE.Vector3(2.15, 0.45, 0.6), new THREE.Vector3(-0.6, 1, 0), 0.9, aThrow);
      const aPush = MathX.smooth(t, trW(16, 'pushes').start - 0.2, trW(16, 'pushes').start + 0.4) * (1 - MathX.smooth(t, CT.raceC - 0.3, CT.raceC));
      arrowTip(arrows.amb[0], new THREE.Vector3(-2.5, 1.2, 0), new THREE.Vector3(0, -1, 0), 1.6, aPush);
      arrowTip(arrows.amb[1], new THREE.Vector3(2.8, 0.42, 0), new THREE.Vector3(0, -1, 0), 1.2, aPush);
      const aDF = MathX.smooth(t, CT.raceC + 0.3, CT.raceC + 1.0), aW = MathX.smooth(t, CT.raceC + 1.0, CT.raceC + 1.6);
      arrowTip(arrows.amb[2], new THREE.Vector3(0.3, 1.18, 0), new THREE.Vector3(0, -1, 0), 2.6, aDF);
      arrowTip(arrows.whi, new THREE.Vector3(-1.2, 1.12, 0), new THREE.Vector3(0, -1, 0), 1.15, aW);
      // three set-ups: low at the front quarter, then side-on at the rear wing, then wide alongside for downforce vs weight
      const cam = camera;
      if (t < CT.raceB) {
        const k = trK(t, TR.race, CT.raceB);
        trCamD(cam, [trLerp(8.6, 6.6, k), trLerp(0.5, 0.62, k), trLerp(3.6, 4.6, k)], [trLerp(0.4, 0.0, k), 0.5, 0], trLerp(32, 34, k), t, 0.5);
      } else if (t < CT.raceC) {
        const k = trK(t, CT.raceB, CT.raceC);
        trCamD(cam, [trLerp(-3.3, -1.5, k), trLerp(1.5, 1.75, k), trLerp(7.6, 9.6, k)], [trLerp(-3.0, -1.6, k), trLerp(1.25, 1.1, k), 0], trLerp(42, 44, k), t, 0.4);
      } else {
        const k = trK(t, CT.raceC, TR.theory);
        trCamD(cam, [trLerp(5.5, 2.4, k), trLerp(1.1, 1.6, k), trLerp(8.2, 9.6, k)], [trLerp(0.2, -0.3, k), trLerp(1.25, 1.35, k), 0], 40, t, 0.4);
      }
      cam.position.y += vib(t + 0.3, 1.5);
      puffs.begin(); puffs.end(); sparks.begin(); sparks.end();
    },
    // ★ the same car on the ceiling of a tunnel at 300 km/h
    theory(t) { MODES.tunnel(t, 'theory'); },
    catch(t) { MODES.tunnel(t, 'catch'); },
    tunnel(t, m) {
      show('tunnel'); look('tunnel'); showCar('f1'); rib.mesh.visible = false;
      const D = trTkDrop(), c = car.f1, X = 3000 + trTkTunnelX(t), v = trTrackCatchV(t), DF = trTrackCatchDF(t);
      for (const s of [T.floor, T.ceil, ...T.walls]) s.set(X);
      T.lights.update(X, 1 + 0.03 * v); T.guide.update(X, 1 + 0.02 * v);
      // the car: upside down (rolled about its length), wheels on the ceiling; it peels off, falls, lands on its back
      const y = trTkY(t), fall = MathX.smooth(t, D.td, D.tl), land = t > D.tl ? t - D.tl : -1;
      const pitch = 0.07 * fall * (land > 0 ? Math.exp(-land / 0.25) : 1) + (land > 0 ? 0.03 * Math.exp(-land / 0.3) * Math.sin(land * 18) : 0);
      const yaw = land > 0 ? 0.12 * MathX.smooth(land, 0, 0.9) : 0;
      c.root.position.set(0, y + (t < D.td ? -vib(t, 0.8) : 0), TR_TK.z + (land > 0 ? 0.6 * MathX.smooth(land, 0, 1.0) : 0));
      c.root.quaternion.setFromEuler(_tkE.set(0, yaw, -pitch, 'YZX')).multiply(_tkQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI + 0.06 * fall * Math.sin((t - D.td) * 3)));
      c.body.rotation.set(0, 0, 0);
      spinWheels(c, land > 0 ? trTkTunnelX(D.tl) + 2 * (1 - Math.exp(-land)) : trTkTunnelX(t));
      // lights near the car (they pass overhead)
      T.pl[0].position.set(3, TR_TK.ceil - 0.8, 2.5); T.pl[1].position.set(-5, TR_TK.ceil - 0.8, -1); T.pl[2].position.set(2.0, 2.2, 1.5);
      T.pl[0].intensity = 26; T.pl[1].intensity = 22; T.pl[2].intensity = 16; T.pl[2].color.set('#cfdcff');
      c.root.updateMatrixWorld(true);
      // the forces: downforce (amber) pushes it UP into the ceiling, ∝ v²; the weight (white) stays; they fade on the landing
      hideArrows();
      const aF = (m === 'theory' ? MathX.smooth(t, trW(16, 'theory').start - 0.2, trW(16, 'theory').start + 0.4) : 1) * (1 - MathX.smooth(t, D.tl - 0.25, D.tl + 0.1));
      const under = y - 1.12;
      arrowTip(arrows.amb[2], new THREE.Vector3(0.9, under, TR_TK.z), new THREE.Vector3(0, 1, 0), 1.7 * DF, aF);
      arrow(arrows.whi, new THREE.Vector3(-0.9, under, TR_TK.z), new THREE.Vector3(0, -1, 0), 1.7, aF);
      // the cameras: theory — low at the front quarter looking up; catch — alongside, tilting down with the fall
      const cam = camera;
      if (m === 'theory') {
        const k = trK(t, TR.theory, TR.catch);
        trCamD(cam, [trLerp(11.5, 7.5, k), trLerp(1.3, 1.8, k), trLerp(1.2, 4.2, k)], [trLerp(0.3, -0.5, k), trLerp(5.3, 5.1, k), TR_TK.z], trLerp(40, 46, k), t, 0.5);
      } else {
        const k = trK(t, TR.catch, D.td), ly = Math.min(4.8, Math.max(0.9, y - 1.6)), kf = MathX.smooth(t, D.td, D.tl + 0.3);
        trCamD(cam, [trLerp(8.0, 6.0, k) - 0.8 * kf, trLerp(2.5, 2.3, k) - 0.6 * kf, trLerp(5.4, 6.0, k)], [trLerp(-1.4, -1.6, k), ly, TR_TK.z + 1.0], trLerp(50, 52, k), t, 0.45);
        if (land > 0) cam.position.y += 0.06 * Math.exp(-land / 0.2) * Math.sin(land * 55);
      }
      cam.position.y += vib(t + 0.7, 0.6 * v / 83);
      // sparks and dust where it scrapes the floor
      puffs.begin(); sparks.begin();
      if (land > -0.01 && m === 'catch') {
        const M4 = c.root.matrixWorld, pts = [[-0.6, 1.0, 0], [0.1, 0.88, 0.2], [-2.6, 1.08, 0.45], [-2.6, 1.08, -0.45]].map((p) => new THREE.Vector3(...p).applyMatrix4(M4));
        const dt = 1 / 160, life = 0.5;
        for (let i = Math.ceil((Math.max(D.tl, t - life) - D.tl) / dt); ; i++) {
          const tb = D.tl + i * dt; if (tb > t) break;
          const age = t - tb, u = age / life, vb = trTrackCatchV(tb), k = Math.min(1, vb / 25);
          for (let j = 0; j < 3; j++) {
            const h1 = hash1(i * 31 + j * 7), h2 = hash1(i * 17 + j * 3 + 5), h3 = hash1(i * 13 + j * 11 + 9), p0 = pts[(i + j) % 4];
            const x = p0.x - (0.25 + 0.5 * h1) * vb * age, yy = Math.max(0.02, 0.02 + (1.2 + 3.5 * h2) * age - 4.9 * age * age), z = p0.z + (h3 - 0.5) * 5 * age;
            sparks.add(x, yy, z, 0.05 + 0.04 * h2, 1.4 * k * (1 - u), 1.0, 0.72 + 0.2 * h1, 0.35);
          }
        }
        trRing(puffs, t, D.tl, D.tl + 0.5, () => 1, new THREE.Vector3(-0.8, 0, c.root.position.z), { speed: 6, life: 1.2, color: [0.6, 0.6, 0.62], alpha: 0.22, per: 4, size: 0.5 });
      }
      puffs.end(); sparks.end();
    },
    // ★ 1970: two fans in the tail suck it down; black flag; it pulls off: banned
    chap70(t) {
      show('period'); look('period'); showCar('chap'); rib.mesh.visible = false;
      const CT = trTkCutT(), c = car.chap, X = trTkChapX(t), v = trTkChapV(t), Xs = trTkChapStop();
      for (const s of [P.road, ...P.grass]) s.set(X);
      for (const r of [P.bales, P.armco, P.trunks, P.crowns, P.tents, P.roofs, P.fpoles, P.flags]) r.update(X);
      // pulling off to the right, toward the marshal post
      const zf = (tt) => 2.6 * MathX.smooth(tt, CT.chapC - 0.6, CT.chapC + 1.3), z = zf(t), dz = (zf(t + 0.05) - zf(t - 0.05)) / 0.1;
      c.root.position.set(0, vib(t, v / 46), z); c.root.quaternion.setFromEuler(_tkE.set(0, -Math.atan2(dz, Math.max(v, 2)), 0)); c.body.rotation.set(0, 0, 0);
      spinWheels(c, X);
      const ts = trW(27, 'track').start + 1.6, fanA = t < ts ? t * 40 : ts * 40 + 40 * 0.6 * (1 - Math.exp(-(t - ts) / 0.6)), fanK = t < ts ? 1 : Math.exp(-(t - ts) / 0.5);
      spinFans(c, fanA, fanK);
      P.post.position.set(Xs + 4.5 - X, 0, -7.3); P.post.rotation.y = Math.PI; P.post.visible = true; P.fin.visible = false;
      P.marshal.g.position.set(-0.2, 0, 0.2);
      P.marshal.wave(t, MathX.smooth(t, CT.chapC - 0.1, CT.chapC + 0.3));
      // the air blown out of the fans (blue), and the push down (amber) on "sucking"
      puffs.begin(); sparks.begin();
      const kf = (tb) => (tb < ts ? 1 : Math.exp(-(tb - ts) / 0.5)) * MathX.smooth(tb, TR.old, TR.old + 0.3);
      for (const zz of [-0.38, 0.38]) trJet(puffs, t, TR.old, t, kf, () => [new THREE.Vector3(-2.35, 0.42, zz + z), new THREE.Vector3(-1, 0.06, zz * 0.3).normalize()], { speed: 22, life: 0.55, size: 0.12, grow: 0.9, alpha: 0.4, dt: 1 / 70, seed: zz > 0 ? 7 : 8, color: [0.45, 0.72, 1.0], rise: 0.1, spread: 0.12 });
      puffs.end(); sparks.end();
      hideArrows();
      const aS = MathX.smooth(t, trW(27, 'sucking').start - 0.2, trW(27, 'sucking').start + 0.35) * (1 - MathX.smooth(t, CT.chapC + 0.2, CT.chapC + 0.6));
      arrowTip(arrows.amb[0], new THREE.Vector3(0.9, 0.95, z), new THREE.Vector3(0, -1, 0), 1.3, aS);
      arrowTip(arrows.amb[1], new THREE.Vector3(-1.1, 0.97, z), new THREE.Vector3(0, -1, 0), 1.3, aS);
      const aB = MathX.smooth(t, CT.chapB + 0.6, CT.chapB + 1.1) * (1 - MathX.smooth(t, CT.chapC - 0.3, CT.chapC));
      arrow(arrows.blu[0], new THREE.Vector3(-2.5, 0.8, z - 0.38), new THREE.Vector3(-1, 0.08, 0), 1.3, aB);
      arrow(arrows.blu[1], new THREE.Vector3(-2.5, 0.8, z + 0.38), new THREE.Vector3(-1, 0.08, 0), 1.3, aB);
      // cameras: low at the front quarter, then close behind on the fans, then wide on the marshal as it stops
      const cam = camera;
      if (t < CT.chapB) {
        const k = trK(t, TR.old, CT.chapB);
        trCamD(cam, [trLerp(7.6, 4.2, k), trLerp(0.7, 1.0, k), trLerp(3.6, 6.0, k)], [trLerp(0.4, -0.2, k), 0.5, 0], trLerp(34, 38, k), t, 0.5);
      } else if (t < CT.chapC) {
        const k = trK(t, CT.chapB, CT.chapC);
        trCamD(cam, [trLerp(-6.4, -5.2, k), trLerp(1.5, 1.25, k), trLerp(3.4, 4.4, k)], [trLerp(-1.6, -1.2, k), 0.55, z * 0.5], 40, t, 0.4);
      } else {
        // from the near verge ahead: the marshal on the far side waves the black flag, the car pulls off toward us and stops
        const k = trK(t, CT.chapC, TR.brabham), Wc = Xs + 10.5;
        trCamD(cam, [Wc - X, trLerp(1.5, 1.4, k), trLerp(11.0, 10.4, k)], [trLerp(-3, 1.6, MathX.smooth(t, CT.chapC, CT.chapC + 1.4)), 1.0, trLerp(-1.0, 0.0, k)], trLerp(38, 33, k), t, 0.4);
      }
    },
    // ★ 1978: one big fan; it wins (chequered flag); withdrawn: into a dark garage, the door comes down
    fan78(t) {
      const CT = trTkCutT(), c = car.bt, cam = camera; rib.mesh.visible = false;
      showCar('bt'); hideArrows();
      if (t < CT.btC) {
        show('period'); look('period');
        const X = trTkBtX(t), Xf = trTkBtX(trTkFinT());
        for (const s of [P.road, ...P.grass]) s.set(X);
        for (const r of [P.bales, P.armco, P.trunks, P.crowns, P.tents, P.roofs, P.fpoles, P.flags]) r.update(X);
        c.root.position.set(0, vib(t), 0); c.root.quaternion.identity();
        spinWheels(c, X); spinFans(c, t * 45, 1);
        P.post.visible = false; P.fin.visible = true; P.fin.position.set(Xf - X, 0, 0);
        P.flagman.wave(t, MathX.smooth(t, trTkFinT() - 0.9, trTkFinT() - 0.5));
        puffs.begin(); sparks.begin();
        trJet(puffs, t, TR.brabham, t, () => 1, () => [new THREE.Vector3(-2.2, 0.43, 0), new THREE.Vector3(-1, 0.05, 0)], { speed: 24, life: 0.5, size: 0.14, grow: 1.0, alpha: 0.4, dt: 1 / 80, seed: 21, color: [0.45, 0.72, 1.0], rise: 0.1, spread: 0.12 });
        puffs.end(); sparks.end();
        const aF = MathX.smooth(t, trW(28, 'fan').start - 0.2, trW(28, 'fan').start + 0.3) * (1 - MathX.smooth(t, CT.btB - 0.2, CT.btB));
        arrowTip(arrows.amb[0], new THREE.Vector3(-0.9, 0.74, 0), new THREE.Vector3(0, -1, 0), 1.3, aF);
        arrowTip(arrows.amb[1], new THREE.Vector3(0.9, 0.52, 0), new THREE.Vector3(0, -1, 0), 1.3, aF);
        arrow(arrows.blu[0], new THREE.Vector3(-2.35, 0.95, 0), new THREE.Vector3(-1, 0.05, 0), 1.3, MathX.smooth(t, TR.brabham + 0.8, TR.brabham + 1.3) * (1 - MathX.smooth(t, CT.btB - 0.2, CT.btB)));
        if (t < CT.btB) {
          const k = trK(t, TR.brabham, CT.btB);
          trCamD(cam, [trLerp(-6.4, -4.6, k), trLerp(1.6, 1.05, k), trLerp(3.2, 4.8, k)], [trLerp(-1.4, -0.6, k), 0.5, 0], 38, t, 0.45);
        } else {
          // low beside the line, the car comes at us and crosses it on "won"; then we hold on the flag
          // low at the edge of the track past the line, looking back: the flag, the line, the car coming at us; it flashes past
          // trackside before the line: it comes at us, flashes past (a pan), crosses under the flag and goes away
          const k = trK(t, CT.btB, CT.btC), Wc = Xf - 22, pass = t - (trTkFinT() - 22 / 52);
          trCamD(cam, [Wc - X, 1.4, 10], [0.6 + 1.5 * MathX.smooth(pass, 0, 0.8), 0.7 + 0.5 * MathX.smooth(pass, 0, 1), 0], trLerp(30, 26, k), t, 0.3);
          if (pass > 0) cam.position.y += 0.04 * Math.exp(-pass / 0.25) * Math.sin(pass * 50);
        }
      } else {
        // the garage: it rolls in toward us, stops; the door comes down behind it
        show('garage'); look('garage');
        const u = trK(t, CT.btC, CT.door0 + 0.05, (x) => 1 - Math.pow(1 - x, 2.2)), x = MathX.lerp(GR.X1 + 4.5, -0.4, u);
        c.root.position.set(x, 0, 0); c.root.quaternion.setFromAxisAngle(_tkUp, Math.PI);
        spinWheels(c, -x); spinFans(c, 0, 0);
        const d = MathX.smooth(t, CT.door0, CT.door1);
        const ds = 0.02 + 0.98 * d; GR.door.scale.y = ds; GR.door.position.y = (GR.H - 0.2) - (GR.H - 0.4) * ds / 2;
        const dark = d;
        sun.intensity = 3.2 * (1 - 0.92 * dark); hemi.intensity = 0.35 * (1 - 0.7 * dark);
        GR.strip.emissiveIntensity = 3 * (1 - 0.6 * dark) * (1 - 0.8 * MathX.smooth(t, CT.door1 + 0.2, CT.door1 + 0.25));
        T.pl[2].position.set(-2.5, 2.9, 0); T.pl[2].intensity = 3 * (1 - MathX.smooth(t, CT.door1 + 0.2, CT.door1 + 0.25)) + 0.6;
        const k = trK(t, CT.btC, TR.mcm);
        trCamD(cam, [trLerp(-5.0, -4.6, k), trLerp(0.85, 1.1, k), trLerp(2.4, 2.0, k)], [trLerp(1.6, -0.6, k), trLerp(0.9, 0.7, k), 0], 46, t, 0.3);
        puffs.begin(); puffs.end(); sparks.begin(); sparks.end();
      }
    },
    // ★ 2025: a tiny fan car on a rig that turns it upside down; wheels still
    mcm(t) {
      show('rig'); look('rig'); showCar('mcm'); rib.mesh.visible = false; hideArrows();
      const CT = trTkCutT(), c = car.mcm, ang = trTkRigAng(t);
      RG.pivot.rotation.set(ang, 0, 0); RG.pivot.updateMatrixWorld(true);
      spinWheels(c, 0);
      const fanOn = (tb) => MathX.smooth(tb, TR.mcm + 1.2, TR.mcm + 2.2);
      // the suction arrows ride with the car (local: pointing at the road)
      const aS = MathX.smooth(t, trW(29, 'fans').start - 0.2, trW(29, 'fans').start + 0.4);
      mcmArr.forEach((A, i) => { const s = 0.35 + 0.65 * aS; A.visible = aS > 0.01; A.position.set(i ? 0.7 : -0.6, 2.05, 0); A.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI); A.scale.set(s, 1.3 * aS, s); });
      // air blown out of the side vents (in the rig's frame at each puff's birth)
      puffs.begin(); sparks.begin();
      const AY = RG.AY;
      for (const sd of [-1, 1]) trJet(puffs, t, TR.mcm + 1.0, t, fanOn, (tb) => {
        const a = trTkRigAng(tb), ca = Math.cos(a), sa = Math.sin(a), px = -0.25, py = 0.07 + 0.3, pz = sd * 0.54, dx = -0.35, dy = 0.1, dz = sd;
        return [new THREE.Vector3(px, AY + py * ca - pz * sa, py * sa + pz * ca), new THREE.Vector3(dx, dy * ca - dz * sa, dy * sa + dz * ca).normalize()];
      }, { speed: 7, life: 0.9, size: 0.1, grow: 0.9, alpha: 0.35, dt: 1 / 50, seed: sd > 0 ? 31 : 32, color: [0.5, 0.75, 1.0], rise: 0.05, spread: 0.2 });
      puffs.end(); sparks.end();
      const cam = camera;
      if (t < CT.mcmB) {
        const k = trK(t, TR.mcm, CT.mcmB);
        trCamD(cam, [trLerp(6.4, 4.6, k), trLerp(3.9, 3.6, k), trLerp(5.6, 4.4, k)], [trLerp(0.4, 0, k), 3.25, 0], 38, t, 0.4);
      } else if (t < CT.mcmC) {
        const k = trK(t, CT.mcmB, CT.mcmC);
        trCamD(cam, [trLerp(6.6, 5.6, k), trLerp(3.0, 3.1, k), trLerp(4.4, 3.4, k)], [0.3, trLerp(3.45, 3.1, k), 0.3], 40, t, 0.35);
      } else {
        const k = trK(t, CT.mcmC, TR.surface);
        trCamD(cam, [trLerp(5.6, 2.2, k), trLerp(1.2, 1.0, k), trLerp(5.8, 6.8, k)], [trLerp(0.3, -0.2, k), 2.6, 0], 40, t, 0.3);
      }
    },
  };

  return {
    scene, camera,
    frame(t, shot) {
      (MODES[shot.mode] || MODES.race)(t);
      scene.updateMatrixWorld(true);
    },
    labels(t, shot) {
      const out = [], CT = trTkCutT(), m = shot.mode;
      const blu = '<span class="d" style="box-shadow:0 0 0 calc(var(--u) * 3) #6ab4ff"></span>', amb = '<span class="d"></span>';
      const whi = '<span class="d" style="box-shadow:0 0 0 calc(var(--u) * 3) #f4f0e8"></span>', red = '<span class="d" style="background:#ff6a5a;box-shadow:0 0 0 calc(var(--u) * 3) #ff6a5a"></span>';
      const gry = '<span class="d" style="box-shadow:0 0 0 calc(var(--u) * 3) #9aa0a8"></span>';
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      if (m === 'race') {
        const w = trW(16, 'upside').start;
        trLab(out, camera, V(-2.6, 1.55, 0), amb + 'WING · UPSIDE DOWN<small>LIKE A PLANE\'S, FLIPPED</small>', MathX.smooth(t, w, w + 0.3) * (1 - MathX.smooth(t, trW(16, 'throw').start - 0.3, trW(16, 'throw').start)));
        trLab(out, camera, V(-4.3, 2.5, 0.6), blu + 'AIR THROWN UP', MathX.smooth(t, trW(16, 'throw').start, trW(16, 'throw').start + 0.3) * (1 - MathX.smooth(t, CT.raceC - 0.3, CT.raceC)));
        trLab(out, camera, V(-2.5, 2.95, 0), amb + 'DOWNFORCE<small>AIR PUSHES THE CAR DOWN</small>', MathX.smooth(t, trW(16, 'pushes').start, trW(16, 'pushes').start + 0.3) * (1 - MathX.smooth(t, CT.raceC - 0.3, CT.raceC)));
        trLab(out, camera, V(0.4, 3.85, 0), amb + 'DOWNFORCE', MathX.smooth(t, CT.raceC + 0.6, CT.raceC + 1.0));
        trLab(out, camera, V(-1.1, 2.4, 0), whi + 'WEIGHT', MathX.smooth(t, CT.raceC + 1.3, CT.raceC + 1.7));
      } else if (m === 'catch') {
        const D = trTkDrop(), y = trTkY(t), a = MathX.smooth(t, TR.catch + 0.4, TR.catch + 0.8) * (1 - MathX.smooth(t, D.tl - 0.3, D.tl));
        trLab(out, camera, V(1.1, y - 1.12 - 1.7 * trTrackCatchDF(t) * 0.5, TR_TK.z), amb + 'DOWNFORCE<small>∝ SPEED²</small>', a);
        trLab(out, camera, V(-0.8, y - 1.12 - 1.9, TR_TK.z), whi + 'WEIGHT', a);
        trLab(out, camera, V(-0.4, 2.2, TR_TK.z + 0.6), red + 'GRIP GONE', MathX.smooth(t, D.tl - 0.1, D.tl + 0.2) * (1 - MathX.smooth(t, TR.toy - 0.3, TR.toy)));
      } else if (m === 'chap70') {
        const c = car.chap.root.position;
        trLab(out, camera, V(-2.5, 1.15, c.z), blu + 'TWO FANS<small>AIR OUT OF THE BACK</small>', MathX.smooth(t, CT.chapB + 0.6, CT.chapB + 1.0) * (1 - MathX.smooth(t, CT.chapC - 0.3, CT.chapC)));
        trLab(out, camera, V(-0.1, 2.25, c.z), amb + 'SUCKED TO THE TRACK', MathX.smooth(t, trW(27, 'sucking').start, trW(27, 'sucking').start + 0.3) * (1 - MathX.smooth(t, CT.chapC - 0.3, CT.chapC)));
        trLab(out, camera, V(-0.6, 1.9, c.z), red + 'BANNED', MathX.smooth(t, CT.banned - 0.05, CT.banned + 0.25));
      } else if (m === 'fan78') {
        if (t < CT.btB) trLab(out, camera, V(-2.3, 1.25, 0), amb + 'ONE BIG FAN<small>SUCKS THE CAR DOWN</small>', MathX.smooth(t, trW(28, 'fan').start - 0.2, trW(28, 'fan').start + 0.15) * (1 - MathX.smooth(t, CT.btB - 0.2, CT.btB)));
        else if (t < CT.btC) trLab(out, camera, P.fin.position.clone().add(V(0.3, 4.4, 6.8)), amb + 'FIRST RACE · WON', MathX.smooth(t, trTkFinT(), trTkFinT() + 0.3) * (1 - MathX.smooth(t, CT.btC - 0.2, CT.btC)));
        else trLab(out, camera, car.bt.root.position.clone().add(V(0, 1.5, 0)), gry + 'WITHDRAWN', MathX.smooth(t, CT.door0 + 0.1, CT.door0 + 0.4));
      } else if (m === 'mcm') {
        const W = (x, y, z) => V(x, y, z).applyMatrix4(car.mcm.root.matrixWorld);
        trLab(out, camera, W(-0.3, 2.3, 0), amb + 'FANS<small>SUCK IT TO THE ROAD</small>', MathX.smooth(t, trW(29, 'fans').start, trW(29, 'fans').start + 0.3) * (1 - MathX.smooth(t, CT.rot1 - 1.0, CT.rot1 - 0.6)));
        trLab(out, camera, V(1.8, 2.1, 0.4), amb + 'UPSIDE DOWN', MathX.smooth(t, trW(29, 'upside').start + 0.4, trW(29, 'upside').start + 0.7) * (1 - MathX.smooth(t, CT.mcmC - 0.3, CT.mcmC)));
        trLab(out, camera, W(0.98, -0.25, 0.75), whi + 'STANDING STILL<small>WHEELS NOT TURNING</small>', MathX.smooth(t, trW(29, 'standing').start - 0.2, trW(29, 'standing').start + 0.2));
        trLab(out, camera, W(-0.6, 1.45, 0.2), amb + 'SUCTION', MathX.smooth(t, CT.mcmC + 0.3, CT.mcmC + 0.7));
      }
      return out;
    },
    grade(t, p, shot) {
      const m = shot && shot.mode;
      if (m === 'race') { p.saturation = 1.12; p.contrast = 1.08; p.warmth = 0.03; p.bloom = 0.42; p.vignette = 0.52; }
      else if (m === 'theory' || m === 'catch') { p.saturation = 1.0; p.contrast = 1.12; p.warmth = -0.04; p.bloom = 0.45; p.vignette = 0.6; }
      else if (m === 'chap70' || m === 'fan78') {
        p.saturation = 1.04; p.contrast = 1.05; p.warmth = 0.08; p.bloom = 0.3; p.grain = 0.035;
        if (m === 'fan78' && t > trTkCutT().btC) { p.vignette = 0.7; p.exposure = MathX.lerp(1.0, 0.8, MathX.smooth(t, trTkCutT().door1, TR.mcm - 0.1)); p.warmth = 0.02; }
      } else if (m === 'mcm') { p.saturation = 1.08; p.contrast = 1.06; p.bloom = 0.36; p.vignette = 0.52; }
    },
    cuts() { const C = trTkCutT(); return [C.raceB, C.raceC, C.chapB, C.chapC, C.btB, C.btC, C.mcmB, C.mcmC]; },
  };
};
