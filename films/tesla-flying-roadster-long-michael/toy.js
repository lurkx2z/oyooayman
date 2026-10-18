/* =====================================================================
   SET · TOY — "Think of a toy car on a loop." A warm desk at night under a lamp: an orange plastic track with a
   spring launcher, one full vertical loop (R = 0.22 m; a slight helix, 7 cm sideways across the loop, so the track
   never crosses itself) and an exit straight that ends in a bumper. The toy car is the hero Roadster at 1:40.
   Physics (one run, integrated once at load with fixed steps): the launcher flicks it to ≈ 3.6 m/s; in the loop
   v² = v₀² − 2gh, so at the top v ≈ 2.1 m/s and v²/R ≈ 2 g > g: the car presses into the track even upside down.
   Shots (cuts inside the set: trToyCuts):
     A  TR.toy → 167.25     the push-in from wide: the desk, the lamp, the loop; the launch (166.55), easing into …
     B  167.25 → 172.9      … slow motion (≈ 1/40): side-on; the dashed STRAIGHT ON line from the car
     C  172.9 → TR.toyRun   closer on the top half: straight on runs up into the track (a ghost car slides along it);
                            amber arrows: the car PRESSES INTO THE TRACK; FAST ENOUGH; it is PINNED (still slow motion)
     D  TR.toyRun → end     real time, low and close: launched again, round the loop, past the lens into the bumper
   ===================================================================== */

const TR_TOY = { R: 0.22, W: 0.07, y0: 0.004, LX: 1.45, v0: 3.6, g: 9.81, k: 0.025, tw: 0.028, sL: -0.70, mu: 0.5 };
TR_TOY.LOOP = 2 * Math.PI * TR_TOY.R;
TR_TOY.L1 = trRemap(166.55);                 // launch 1 (film s): eases into the slow-motion explanation
TR_TOY.L2 = trRemap(179.95);                 // launch 2: the real-time run
TR_TOY.cB = trRemap(167.25); TR_TOY.cC = trRemap(172.9);

// the track surface's centre line at arc length s: { p, fwd, up } (up = towards the car: the loop's centre in the loop)
function trToyAt(s, out = {}) {
  const T = TR_TOY, p = out.p || (out.p = new THREE.Vector3()), fwd = out.fwd || (out.fwd = new THREE.Vector3()), up = out.up || (out.up = new THREE.Vector3());
  if (s < 0) { p.set(s, T.y0, 0); fwd.set(1, 0, 0); up.set(0, 1, 0); }
  else if (s <= T.LOOP) {
    const a = s / T.R, u = a / (2 * Math.PI), sm = u * u * (3 - 2 * u), dsm = 6 * u * (1 - u);
    p.set(T.R * Math.sin(a), T.y0 + T.R - T.R * Math.cos(a), T.W * sm);
    fwd.set(Math.cos(a), Math.sin(a), T.W * dsm / (2 * Math.PI * T.R)).normalize();
    up.set(-Math.sin(a), Math.cos(a), 0); up.addScaledVector(fwd, -up.dot(fwd)).normalize();
  } else { p.set(s - T.LOOP, T.y0, T.W); fwd.set(1, 0, 0); up.set(0, 1, 0); }
  return out;
}
const trToyH = (s) => (s < 0 || s > TR_TOY.LOOP ? 0 : TR_TOY.R - TR_TOY.R * Math.cos(s / TR_TOY.R));

// the run, from the launch (τ = 0): a flick to speed, energy round the loop (a little rolling friction), the bumper
const TR_TOY_RUN = (() => {
  const T = TR_TOY, dt = 1 / 4000, S = [], V = [], sF = T.sL + 0.035, sEnd = T.LOOP + T.LX - 0.075;
  const vL2 = T.v0 * T.v0 + 2 * T.mu * (0 - sF);           // so it is v0 at the foot of the loop
  let s = T.sL, v = 0, ph = 0, vb = 0, τb = 0, τ = 0;
  while (τ < 4) {
    if (ph === 0) {
      if (s < sF) v = Math.min(Math.sqrt(vL2), v + 260 * dt);
      else v = Math.sqrt(Math.max(0.01, vL2 - 2 * T.g * trToyH(s) - 2 * T.mu * (s - sF)));
      s += v * dt;
      if (s >= sEnd) { ph = 1; vb = -0.28 * v; τb = τ; }
    } else {
      // the bounce off the bumper: back a little, friction stops it
      const u = τ - τb; v = Math.min(0, vb + 2.2 * u); s += v * dt;
    }
    S.push(s); V.push(v); τ += dt;
  }
  return { S, V, dt, τBump: τb };
})();
function trToyS(τ) {
  const R = TR_TOY_RUN; if (τ <= 0) return { s: TR_TOY.sL, v: 0 };
  const f = Math.min(R.S.length - 2, τ / R.dt), i = Math.floor(f), u = f - i;
  return { s: MathX.lerp(R.S[i], R.S[i + 1], u), v: MathX.lerp(R.V[i], R.V[i + 1], u) };
}
// the run's time at which it reaches s (before the bumper)
function trToyTau(s) {
  const R = TR_TOY_RUN, n = Math.floor(R.τBump / R.dt); let a = 0, b = n;
  while (b - a > 1) { const m = (a + b) >> 1; if (R.S[m] < s) a = m; else b = m; }
  return a * R.dt;
}

// the slow-motion clock (film t → the run's τ): a smooth monotone curve through keys pinned to the words
let TR_TOY_CK = null;
function trToyClock() {
  if (TR_TOY_CK) return TR_TOY_CK;
  const R = TR_TOY.R;
  const K = [[TR_TOY.L1, null], [TR_TOY.cB + 0.05, -0.09], [trW(19, 'curve').start, R * 0.35], [trW(19, 'straight').start - 0.2, R * 1.25],
    [trW(19, 'top').start, R * 2.05], [trW(19, 'straight', 12).start, R * 2.32], [trW(19, 'into').start + 0.3, R * 2.52], [trW(19, 'fast').start + 0.2, R * 2.95],
    [trW(19, 'pins').start, R * 3.38], [TR.toyRun, R * 3.78]];
  const x = K.map((k) => k[0]), y = K.map((k) => (k[1] == null ? 0 : trToyTau(k[1]))), n = x.length;
  const d = []; for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  const m = [0.55]; for (let i = 1; i < n - 1; i++) m.push((d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b; if (h > 9) { const q = 3 / Math.sqrt(h); m[i] = q * a * d[i]; m[i + 1] = q * b * d[i]; } }
  TR_TOY_CK = (t) => {
    if (t <= x[0]) return 0;
    if (t >= x[n - 1]) return y[n - 1] + (t - x[n - 1]) * m[n - 1];
    let i = 0; while (t > x[i + 1]) i++;
    const h = x[i + 1] - x[i], u = (t - x[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * y[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * y[i + 1] + (u3 - u2) * h * m[i + 1];
  };
  return TR_TOY_CK;
}
// the car at film time t: { s, v, τ, run }
function trToyCar(t) {
  if (t < TR.toyRun) { const τ = trToyClock()(t); return Object.assign(trToyS(τ), { τ, run: 1 }); }
  const τ = Math.max(0, t - TR_TOY.L2); return Object.assign(trToyS(τ), { τ, run: 2 });
}
// slow-motion factor (film seconds per second of the run), for the HUD / sound
function trToySlow(t) { const c = trToyClock(); return t < TR.toyRun ? (c(t + 0.01) - c(t - 0.01)) / 0.02 : 1; }
function trToyCuts() { return [TR_TOY.cB, TR_TOY.cC, TR.toyRun]; }

// a swept U-channel (base and two low rails) along the track from s0 to s1
function trToyTrackGeo(s0, s1, n) {
  const T = TR_TOY, w = T.tw, r = 0.0035, th = 0.0035, h = 0.008;
  const prof = [[-w - r, -th], [w + r, -th], [w + r, h], [w, h], [w, 0], [-w, 0], [-w, h], [-w - r, h]], E = prof.length;
  const pos = [], idx = [], F = {}, B = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    trToyAt(s0 + (s1 - s0) * i / n, F); B.crossVectors(F.fwd, F.up).normalize();
    for (let e = 0; e < E; e++) for (const pp of [prof[e], prof[(e + 1) % E]]) { q.copy(F.p).addScaledVector(B, pp[0]).addScaledVector(F.up, pp[1]); pos.push(q.x, q.y, q.z); }
  }
  for (let i = 0; i < n; i++) for (let e = 0; e < E; e++) { const a = (i * E + e) * 2, b = ((i + 1) * E + e) * 2; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function trToyWoodTex() {
  const W = 1024, H = 512, c = Tex.canvas(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), D = img.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const n = trN2(i / 260, j / 22), g = Math.sin((j + 26 * n + 6 * trN2(i / 40, j / 6)) * 0.42) * 0.5 + 0.5, f = 0.82 + 0.18 * g * g + 0.06 * (trN2(i / 8, j / 1.5) - 0.5);
    const k = (j * W + i) * 4; D[k] = 118 * f; D[k + 1] = 74 * f; D[k + 2] = 44 * f; D[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return Tex.tex(c, { repeat: true, srgb: true });
}

TR_SET_BUILDERS.toy = (app) => {
  const S = trSet(app, { sky: '#120d0a', fog: 0.16, fogColor: '#1a120d', fov: 38, near: 0.01, far: 40, sun: null,
    hemi: ['#5a4a52', '#22160e', 0.42], env: ['#2a2230', '#c99a6a', '#1a110a'] });
  const { scene, camera } = S;
  scene.environmentIntensity = 0.7;
  const T = TR_TOY;
  // ---- the desk, the wall behind
  const wood = trToyWoodTex(); wood.repeat.set(1.6, 1);
  const desk = trBox(2.8, 0.04, 1.15, new THREE.MeshStandardMaterial({ map: wood, roughness: 0.42, metalness: 0, envMapIntensity: 0.6 }), 0.3, -0.02, -0.12);
  desk.castShadow = false;
  trBox(6, 3, 0.05, trMat('#2e241e', { roughness: 0.95 }), 0.3, 0.6, -0.75).castShadow = false;
  // ---- the lamp: weighted base, two arms, a shade with a hot bulb, a warm spot on the loop
  const metal = new THREE.MeshStandardMaterial({ color: '#2a2b2e', roughness: 0.35, metalness: 0.8 });
  const lb = new THREE.Vector3(-0.52, 0, -0.34), le = new THREE.Vector3(-0.5, 0.42, -0.4), lh = new THREE.Vector3(-0.28, 0.58, -0.2), lt = new THREE.Vector3(0.0, 0.2, 0.04);
  trCyl(0.075, 0.085, 0.022, metal, lb.x, 0.011, lb.z, null, 28);
  trBeam(lb.clone().setY(0.02), le, 0.014, metal, scene); trBeam(le, lh, 0.012, metal, scene);
  trCyl(0.018, 0.018, 0.03, metal, le.x, le.y, le.z, null, 12).rotation.x = Math.PI / 2;
  {
    const head = new THREE.Group(); head.position.copy(lh); scene.add(head);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), lt.clone().sub(lh).normalize());
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.11, 28, 1, true), new THREE.MeshStandardMaterial({ color: '#2f3a33', roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide }));
    shade.position.y = -0.03; shade.castShadow = true; head.add(shade);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), shade.material); cap.position.y = 0.025; head.add(cap);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: new THREE.Color('#ffd6a0'), emissiveIntensity: 5 })); bulb.position.y = -0.055; head.add(bulb);
    const spot = new THREE.SpotLight('#ffcf96', 4.2, 0, 0.95, 0.7, 1.6);
    spot.position.copy(lh).add(lt.clone().sub(lh).normalize().multiplyScalar(0.1)); spot.target.position.copy(lt);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.camera.near = 0.05; spot.shadow.camera.far = 3; spot.shadow.bias = -0.0004; spot.shadow.normalBias = 0.002;
    scene.add(spot, spot.target);
  }
  // a cool fill from the laptop's screen
  { const fill = new THREE.PointLight('#8fb0ff', 0.12, 0, 1.2); fill.position.set(0.75, 0.25, -0.2); scene.add(fill);
    const warm = new THREE.PointLight('#ffb27a', 0.3, 0, 1.4); warm.position.set(0.05, 0.24, 0.42); scene.add(warm); }
  // ---- desk things: a mug, a pencil cup, a notebook, a laptop at the edge of frame, an eraser
  {
    const mugM = new THREE.MeshPhysicalMaterial({ color: '#2f5d6a', roughness: 0.3, clearcoat: 0.6 });
    const mug = trCyl(0.043, 0.04, 0.1, mugM, 0.42, 0.05, -0.3, null, 28);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 8, 18), mugM); hd.position.set(0.47, 0.055, -0.3); hd.castShadow = true; scene.add(hd);
    trCyl(0.038, 0.038, 0.004, trMat('#2a1a10', { roughness: 0.2 }), 0.42, 0.097, -0.3, null, 24);
    const cupM = new THREE.MeshStandardMaterial({ color: '#3a3c40', roughness: 0.5, metalness: 0.5 });
    trCyl(0.035, 0.033, 0.095, cupM, -0.66, 0.0475, -0.12, null, 20);
    const pc = ['#e7b531', '#e7b531', '#c9452f', '#3a6fb0'];
    for (let i = 0; i < 4; i++) {
      const p = trCyl(0.0045, 0.0045, 0.19, trMat(pc[i], { roughness: 0.5 }), -0.66 + 0.014 * Math.cos(i * 1.7), 0.1 + 0.01 * i, -0.12 + 0.014 * Math.sin(i * 1.7), null, 6);
      p.rotation.set(0.12 * Math.sin(i * 2.3), 0, 0.14 * Math.cos(i * 2.3));
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.014, 6), trMat('#d8b48a')); tip.position.y = 0.102; p.add(tip);
    }
    const nb = new THREE.Group(); nb.position.set(0.3, 0, 0.3); nb.rotation.y = 0.25; scene.add(nb);
    trBox(0.22, 0.012, 0.16, trMat('#efe6d2', { roughness: 0.9 }), 0, 0.007, 0, nb);
    trBox(0.225, 0.003, 0.165, trMat('#7a2a24', { roughness: 0.6 }), 0, 0.0145, 0, nb);
    trBox(0.006, 0.003, 0.165, trMat('#c9a36a', { roughness: 0.5 }), 0.06, 0.0165, 0, nb);
    // a pencil lying on the notebook
    const pl = trCyl(0.004, 0.004, 0.17, trMat('#e7b531', { roughness: 0.5 }), 0.26, 0.022, 0.27, null, 6); pl.rotation.set(Math.PI / 2, 0, 0.9); pl.rotation.order = 'ZXY';
    const lap = new THREE.Group(); lap.position.set(0.95, 0, -0.38); lap.rotation.y = -0.45; scene.add(lap);
    const lapM = new THREE.MeshStandardMaterial({ color: '#8d9096', roughness: 0.35, metalness: 0.7 });
    trBox(0.34, 0.012, 0.24, lapM, 0, 0.006, 0, lap);
    const scr = new THREE.Group(); scr.position.set(0, 0.012, -0.12); scr.rotation.x = -0.32; lap.add(scr);
    trBox(0.34, 0.22, 0.008, lapM, 0, 0.11, 0, scr);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.19), new THREE.MeshStandardMaterial({ color: '#0b1220', emissive: new THREE.Color('#5d86d8'), emissiveIntensity: 0.55 })); glow.position.set(0, 0.11, 0.0045); scr.add(glow);
    trBox(0.05, 0.02, 0.025, trMat('#e9e2d6', { roughness: 0.8 }), -0.3, 0.01, 0.22, null, 0.4);   // an eraser
  }
  // ---- the track: launcher, entry straight, the loop, exit straight, bumper; connectors
  const trackM = new THREE.MeshPhysicalMaterial({ color: '#ff6516', roughness: 0.32, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.2, side: THREE.DoubleSide, emissive: new THREE.Color('#3a0e00'), emissiveIntensity: 0.25 });
  for (const [a, b, n] of [[-0.86, 0, 2], [0, T.LOOP, 220], [T.LOOP, T.LOOP + T.LX, 2]]) {
    const m = new THREE.Mesh(trToyTrackGeo(a, b, n), trackM); m.castShadow = m.receiveShadow = true; scene.add(m);
  }
  const clipM = new THREE.MeshStandardMaterial({ color: '#3b3f6e', roughness: 0.45 });
  for (const s of [-0.43, T.LOOP + 0.36, T.LOOP + 0.82]) { const F = trToyAt(s); trBox(0.03, 0.006, 0.072, clipM, F.p.x, 0.002, F.p.z); }
  trBox(0.14, 0.008, 0.17, clipM, 0, 0.002, T.W / 2);                       // the loop's foot, both lanes
  for (const sx of [-1, 1]) trBox(0.02, 0.012, 0.17, clipM, sx * 0.06, 0.006, T.W / 2);
  // launcher: a dark box with a spring plunger (the knob is pulled back, then snaps forward)
  const lchM = new THREE.MeshStandardMaterial({ color: '#23262c', roughness: 0.4, metalness: 0.3 });
  trBox(0.13, 0.03, 0.09, lchM, T.sL - 0.14, 0.015, 0);
  trBox(0.04, 0.012, 0.075, lchM, T.sL - 0.075, 0.006, 0);
  const plunger = new THREE.Group(); scene.add(plunger);
  trBox(0.11, 0.008, 0.008, metal, 0.0, 0, 0, plunger);
  trBox(0.008, 0.016, 0.03, trMat('#c9452f', { roughness: 0.4 }), 0.055, 0, 0, plunger);   // the pusher
  const knob = trCyl(0.012, 0.012, 0.02, trMat('#c9452f', { roughness: 0.4 }), -0.06, 0, 0, plunger, 16); knob.rotation.z = Math.PI / 2;
  // bumper at the end of the exit straight
  { const e = T.LOOP + T.LX; trBox(0.03, 0.03, 0.09, lchM, e - 0.015 - T.LOOP, 0.015, T.W); trBox(0.008, 0.016, 0.06, trMat('#151515', { roughness: 0.9 }), e - 0.034 - T.LOOP, 0.014, T.W); }
  // ---- the toy car (and its ghost, which slides along the straight-on line)
  const car = trRoadster(scene); car.root.scale.setScalar(T.k);
  const ghost = trRoadster(scene); ghost.root.scale.setScalar(T.k);
  const ghostM = new THREE.MeshBasicMaterial({ color: '#ffe9cc', transparent: true, opacity: 0.25, depthWrite: false });
  ghost.root.traverse((o) => { if (o.isMesh) { o.material = ghostM; o.castShadow = false; o.receiveShadow = false; } });
  // ---- the straight-on line (dashes), the force arrows
  const ND = 18, dashM = new THREE.MeshBasicMaterial({ color: '#fff3df', transparent: true, depthTest: false, depthWrite: false });
  const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), dashM, ND); dashes.renderOrder = 8; dashes.frustumCulled = false; scene.add(dashes);
  const tipDot = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.02, 12), dashM); tipDot.renderOrder = 8; scene.add(tipDot);
  const ambM = new THREE.MeshStandardMaterial({ color: '#ffb066', emissive: new THREE.Color('#ff9a40'), emissiveIntensity: 2.4, transparent: true, depthTest: false });
  const arrows = [0, 1, 2].map(() => { const a = trArrow(1, 0.0026, ambM); a.traverse((o) => { o.renderOrder = 9; }); scene.add(a); return a; });
  // ---- bokeh: soft warm lights on the wall behind (a string of fairy lights, out of focus), a blue window glow
  const bokeh = trPuffs(scene, 64, { additive: true });
  const BK = []; for (let i = 0; i < 26; i++) { const u = i / 25; BK.push([-0.9 + 2.4 * u + 0.05 * (trR(i, 3) - 0.5), 0.62 - 0.12 * Math.sin(u * Math.PI * 2.2) + 0.03 * trR(i, 4), -0.72, 0.035 + 0.03 * trR(i, 5), trR(i, 6) < 0.8]); }
  const puffs = trPuffs(scene, 400);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const F = {}, F2 = {}, st = {};
  const showArrow = (A, from, dir, L, a) => { A.visible = a > 0.01 && L > 0.002; A.position.copy(from); A.quaternion.setFromUnitVectors(Y, dir); A.scale.set(1, Math.max(0.001, L), 1); };
  // state for labels
  const L = { tip: new THREE.Vector3(), arrowTip: new THREE.Vector3(), car: new THREE.Vector3(), inner: new THREE.Vector3() };

  const set = {
    scene, camera,
    cuts: trToyCuts,
    frame(t) {
      const C = trToyCar(t);
      // the car: on the surface, its up the track's normal (lifted a hair: the loop curves up under its ends)
      trToyAt(C.s, F);
      trPlace(car, F.p.clone().addScaledVector(F.up, 0.0012), F.fwd, F.up);
      car.roll(C.s / T.k);
      const cc = F.p.clone().addScaledVector(F.up, 0.014);
      L.car.copy(cc); L.inner.copy(F.p).addScaledVector(F.up, 0.075);
      // the plunger: pulled back before each launch, snaps forward on it
      const pull = (t0) => MathX.smooth(t, t0 - 1.3, t0 - 0.35) * (t < t0 ? 1 : Math.max(0, 1 - (t - t0) / 0.03));
      const pk = t < TR.toyRun ? pull(T.L1) : pull(T.L2);
      plunger.position.set(T.sL - 0.075 - 0.045 * pk, 0.022, 0);
      // the straight-on line: from the car's nose along its heading (marching dashes)
      const dA = t < TR.toyRun ? MathX.smooth(t, trW(19, 'trying').start - 0.1, trW(19, 'carry').start) * (1 - MathX.smooth(t, trW(19, 'if').start - 0.3, trW(19, 'if').start + 0.3)) : 0;
      const len0 = 0.2 * MathX.smooth(t, trW(19, 'trying').start - 0.1, trW(19, 'carry').start + 0.4), d0 = 0.06;
      const yCap = (t < T.cC ? 0.43 : 0.62) - cc.y;
      const len = F.fwd.y > 0.05 ? Math.min(len0, Math.max(0.06, yCap / F.fwd.y - d0)) : len0;
      dashM.opacity = 0.92 * dA;
      const ph = (t * 0.03) % 0.022;
      q4.setFromUnitVectors(new THREE.Vector3(1, 0, 0), F.fwd);
      for (let i = 0; i < ND; i++) {
        const dd = d0 + ph + i * 0.022, on = dA > 0.01 && dd < d0 + len;
        v4.copy(cc).addScaledVector(F.fwd, dd);
        const fade = on ? 1 - MathX.smooth(dd, d0 + len - 0.06, d0 + len) * 0.6 : 0;
        dashes.setMatrixAt(i, m4.compose(v4, q4, s4.set(on ? 0.012 : 0, on ? 0.0032 * fade + 0.0008 : 0, on ? 0.0032 * fade + 0.0008 : 0)));
      }
      dashes.instanceMatrix.needsUpdate = true;
      L.tip.copy(cc).addScaledVector(F.fwd, d0 + len + 0.015);
      tipDot.visible = dA > 0.01; tipDot.position.copy(L.tip); tipDot.quaternion.setFromUnitVectors(Y, F.fwd);
      // the ghost: "straight on means up" — it slides on along the straight line, out through the track
      const gA = t < TR.toyRun ? MathX.smooth(t, trW(19, 'straight', 12).start - 0.1, trW(19, 'straight', 12).start + 0.25) * (1 - MathX.smooth(t, trW(19, 'track', 14).start + 0.5, trW(19, 'if').start + 0.1)) : 0;
      ghost.root.visible = gA > 0.01; ghostM.opacity = 0.32 * gA;
      if (gA > 0.01) {
        const gd = 0.2 * MathX.smooth(t, trW(19, 'straight', 12).start, trW(19, 'track', 14).start + 0.3);
        trPlace(ghost, F.p.clone().addScaledVector(F.up, 0.0012).addScaledVector(F.fwd, gd), F.fwd, F.up);
      }
      // the amber arrows: the car presses into the track (∝ the normal force N/mg = v²/(gR) + cos θ), a pulse on "pins"
      const aA = t < TR.toyRun ? MathX.smooth(t, trW(19, 'into').start - 0.15, trW(19, 'into').start + 0.25) : 0;
      const pins = trW(19, 'pins').start, pulse = 1 + (t > pins ? 0.45 * Math.exp(-(t - pins) / 0.5) : 0);
      const a = C.s / T.R, N = C.s > 0 && C.s < T.LOOP ? (C.v * C.v) / (T.g * T.R) + Math.cos(a) : 1;
      ambM.opacity = aA;
      arrows.forEach((A, j) => {
        trToyAt(C.s + (j - 1) * 0.04, F2);
        const Lr = (0.032 + 0.016 * MathX.clamp(N, 0, 3)) * pulse * MathX.smooth(t, trW(19, 'into').start - 0.15 + j * 0.06, trW(19, 'into').start + 0.3 + j * 0.06);
        showArrow(A, F2.p.clone().addScaledVector(F2.up, -0.006), F2.up.clone().negate(), Lr, aA);
        if (j === 1) L.arrowTip.copy(F2.p).addScaledVector(F2.up, -0.006 - Lr - 0.012);
      });
      // bokeh on the wall
      bokeh.begin();
      for (const [x, y, z, r, warm] of BK) bokeh.add(x, y, z, r, 0.16, warm ? 1.0 : 0.5, warm ? 0.66 : 0.7, warm ? 0.32 : 1.0);
      bokeh.add(1.05, 0.55, -0.7, 0.22, 0.06, 0.4, 0.55, 1.0);
      bokeh.end();
      // a puff of dust off the bumper when it hits (run 2)
      puffs.begin();
      if (C.run === 2 && C.τ > TR_TOY_RUN.τBump) {
        const e = T.LOOP + T.LX - T.LOOP - 0.04, u = C.τ - TR_TOY_RUN.τBump;
        for (let i = 0; i < 14; i++) { const k = u / 0.9; if (k > 1) break; puffs.add(e - 0.02 - 0.05 * k * trR(i, 7), 0.012 + 0.03 * k * trR(i, 8), T.W + (trR(i, 9) - 0.5) * 0.08 * (0.3 + k), 0.006 + 0.02 * k, 0.25 * (1 - k), 0.85, 0.78, 0.68); }
      }
      puffs.end();
      // ---- the cameras
      const cam = camera, D = (p, at, fov, amt = 0.08) => trCamD(cam, p, at, fov, t, amt);
      if (t < T.cB) {
        const k = trK(t, TR.toy, T.cB, Ease.inOutSine);
        D(trV([0.62, 0.56, 1.5], [0.18, 0.2, 0.98], k), trV([0.05, 0.12, -0.05], [-0.14, 0.2, 0.03], k), trLerp(40, 34, k));
      } else if (t < T.cC) {
        const k = trK(t, T.cB, T.cC, Ease.inOutSine);
        D(trV([-0.14, 0.22, 1.16], [0.1, 0.26, 1.06], k), trV([-0.1, 0.23, 0.03], [0.0, 0.25, 0.03], k), 33);
      } else if (t < TR.toyRun) {
        const k = trK(t, T.cC, TR.toyRun, Ease.inOutSine);
        D(trV([0.2, 0.28, 0.86], [0.06, 0.31, 0.74], k), trV([0.01, 0.41, 0.03], [-0.03, 0.41, 0.03], k), trLerp(34, 33, k));
      } else {
        // real time: low beside the exit; we look up into the loop, then whip round as it shoots past us
        const k = trK(t, TR.toyRun, TR.numbers, Ease.inOutSine), ex = T.L2 + trToyTau(T.LOOP) - 0.05;
        const w = MathX.smooth(t, ex, ex + 0.35);
        const w2 = MathX.smooth(t, ex + 0.1, ex + 0.9);
        const at = trV([-0.02, 0.21, 0.04], [Math.min(1.3, F.p.x + 0.05), 0.03, T.W], w);
        D(trV([trLerp(-0.04, 0.02, k), 0.075, trLerp(0.66, 0.62, k)], [0.62, 0.065, 0.36], w2), at, trLerp(48, 40, w), 0.12);
      }
    },
    labels(t) {
      const out = [];
      if (t >= TR.toyRun) return out;
      const ifT = trW(19, 'if').start, pins = trW(19, 'pins').start;
      trLab(out, camera, L.tip, '<span class="d"></span>STRAIGHT ON<small>WHERE IT WANTS TO GO</small>', MathX.smooth(t, trW(19, 'carry').start - 0.1, trW(19, 'carry').start + 0.3) * (1 - MathX.smooth(t, ifT - 0.4, ifT)));
      trLab(out, camera, L.arrowTip, '<span class="d"></span>PRESSES INTO THE TRACK', MathX.smooth(t, trW(19, 'into').start, trW(19, 'into').start + 0.35));
      trLab(out, camera, L.inner, '<span class="d"></span>FAST ENOUGH<small>≈ 2 m/s OVER THE TOP</small>', MathX.smooth(t, trW(19, 'fast').start - 0.05, trW(19, 'fast').start + 0.3) * (1 - MathX.smooth(t, pins - 0.3, pins)));
      trLab(out, camera, L.inner, '<span class="d"></span>PINNED<small>UPSIDE DOWN, IT STAYS ON</small>', MathX.smooth(t, pins, pins + 0.3));
      return out;
    },
    grade(t, p) {
      p.saturation = 1.1; p.contrast = 1.1; p.warmth = 0.1; p.bloom = 0.42; p.bloomThreshold = 0.9; p.vignette = 0.72; p.grain = 0.028;
      if (t < TR.toy + 0.5) p.fade = Math.max(p.fade, 0);
    },
  };
  return set;
};
