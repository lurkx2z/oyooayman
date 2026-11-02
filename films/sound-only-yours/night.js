/* =====================================================================
   NIGHT — what this film adds to the falls-up street at night in the rain:
     the flats across the park (their windows one by one: soBuildFlats), the tower block 170 m beyond the middle of the
     park, pools of lamplight, the rain (streaks round the camera, pure), the lightning 2 km away, the bats round the
     park lamp, the cars that move (the silent car, the ambulance), your laptop and the phones' screens.
   All posed from film time t / story time s, pure.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE FLATS ACROSS THE PARK: six floors facing yours; each window is an instance (dark, lit, or lit with someone
// standing in it). At "One by one, the windows across the park light up" they come on, nearest-first in time order, and a
// silhouette steps into each, facing your window
// ---------------------------------------------------------------------------------------------------------------------
const SO_FLATS = (() => {
  const F = SO_ST.blockS, r = new RNG(515), out = [];
  for (let f = 0; f < F.floors; f++) for (let x = F.x[0] + 3; x <= F.x[1] - 3; x += F.pitch) {
    const lit0 = r.next() < 0.18, warm = r.next();
    out.push({ x, y: f * 3 + 1.75, f, lit0, warm, on: lit0 ? -99 : null, who: null, k: r.next() });
  }
  return out;
})();
// the order they light up in (film t): spread over the beat, closest to the middle of your view first
function soFlatsSchedule() {
  const t0 = soC('faces', 0) + 0.3, t1 = soC('faces', 1) + 1.0, r = new RNG(77);
  const order = SO_FLATS.map((w, i) => ({ i, d: Math.hypot(w.x - 6, (w.y - 9) * 2) + 22 * r.next() })).sort((a, b) => a.d - b.d);
  const n = Math.round(SO_FLATS.length * 0.62);
  order.slice(0, n).forEach((o, k) => { const w = SO_FLATS[o.i], u = Math.pow(k / n, 1.6); if (w.on == null) w.on = t0 + (t1 - t0) * u; w.who = w.on + 0.5 + 1.2 * r.next(); });
  SO_FLATS.forEach((w) => { if (w.lit0 && w.who == null && r.next() < 0.7) w.who = t0 + (t1 - t0) * r.next(); });
}
function soBuildFlats(root) {
  const F = SO_ST.blockS, B = new Batcher(), z = F.z[1];                  // (its north face: towards you)
  const conc = soStd('#ffffff', 0.92, 0, { map: soTex(soBlockFacade(31, F.x[1] - F.x[0], F.h, { cols: [], x0: F.x[0], floors: F.floors, base: '#b7b0a3' }), { repeat: false }) });
  const side = soStd('#a8a296', 0.95);
  const m = new THREE.Mesh(new THREE.BoxGeometry(F.x[1] - F.x[0], F.h, F.z[1] - F.z[0]), [side, side, soStd('#3a3836', 0.95), side, conc, side]);
  m.position.set((F.x[0] + F.x[1]) / 2, F.h / 2, (F.z[0] + F.z[1]) / 2); m.receiveShadow = true; root.add(m);
  // balconies' slabs and frames round every window
  for (const w of SO_FLATS) { B.box(F.win[0] + 0.3, 0.12, 0.3, w.x, w.y - F.win[1] / 2 - 0.12, z + 0.15, soStd('#cfc9bd', 0.9)); B.box(F.win[0] + 0.3, 0.1, 0.1, w.x, w.y + F.win[1] / 2 + 0.05, z + 0.05, soStd('#d8d2c6', 0.9)); }
  B.build(root, 'flats');
  // the windows (an instance each: colour = dark glass or lamplight) and the people standing in them
  const geo = new THREE.PlaneGeometry(F.win[0], F.win[1]);
  const win = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), SO_FLATS.length); win.frustumCulled = false;
  const M4 = new THREE.Matrix4();
  SO_FLATS.forEach((w, i) => { win.setMatrixAt(i, M4.makeTranslation(w.x, w.y, z + 0.02)); win.setColorAt(i, new THREE.Color('#0b0f14')); });
  root.add(win);
  // a person's silhouette, head and shoulders (black, alpha-cut), standing back from the glass
  const sil = soTex(soCanvas(128, 160, (g, W, H) => { g.fillStyle = '#000'; g.beginPath(); g.ellipse(64, 46, 21, 26, 0, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(14, 160); g.quadraticCurveTo(18, 92, 64, 84); g.quadraticCurveTo(110, 92, 114, 160); g.closePath(); g.fill(); g.fillRect(52, 64, 24, 26); }), { repeat: false });
  const who = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.95, 1.2), new THREE.MeshBasicMaterial({ map: sil, transparent: true, alphaTest: 0.5, color: '#06070a' }), SO_FLATS.length); who.frustumCulled = false;
  root.add(who);
  return { win, who, update: (t) => soFlatsUpdate(win, who, t) };
}
const _soFc = new THREE.Color(), _soFm = new THREE.Matrix4();
function soFlatsUpdate(win, who, t) {
  const z = SO_ST.blockS.z[1], F = SO_ST.blockS;
  SO_FLATS.forEach((w, i) => {
    const k = w.on == null ? 0 : MathX.clamp((t - w.on) / 0.12, 0, 1);
    const lit = w.warm < 0.6 ? [1.0, 0.78, 0.48] : w.warm < 0.85 ? [1.0, 0.64, 0.32] : [0.78, 0.86, 1.0], dark = [0.04, 0.05, 0.07], b = 0.85 + 0.15 * w.k;
    _soFc.setRGB(dark[0] + (lit[0] * b - dark[0]) * k, dark[1] + (lit[1] * b - dark[1]) * k, dark[2] + (lit[2] * b - dark[2]) * k);
    win.setColorAt(i, _soFc);
    const s = w.who == null ? 0 : soEase(t, w.who, w.who + 0.8);
    _soFm.makeScale(1, Math.max(0.001, s), 1).setPosition(w.x + (w.k - 0.5) * 0.7, w.y - F.win[1] / 2 + 0.6 * s, z + 0.04);
    who.setMatrixAt(i, s > 0.002 && k > 0.5 ? _soFm : _soFm.makeScale(0, 0, 0));
  });
  win.instanceColor.needsUpdate = true; who.instanceMatrix.needsUpdate = true;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE TOWER BLOCK (170 m beyond the middle of the park: the echo that comes back after a second)
// ---------------------------------------------------------------------------------------------------------------------
function soBuildTower(root) {
  const T = SO_ST.tower, w = T.x[1] - T.x[0], d = T.z[1] - T.z[0];
  const fc = soBlockFacade(41, w, T.h, { cols: Array.from({ length: 6 }, (_, i) => T.x[0] + 3 + i * 5.2), x0: T.x[0], floors: T.floors, base: '#9d978c' });
  const fm = soFacadeMat(fc); fm.emissiveIntensity = 1.0; fm.userData.keep = true;
  const sd = soFacadeMat(soBlockFacade(42, d, T.h, { cols: [T.z[0] + 4, T.z[0] + 10], x0: T.z[0], floors: T.floors, base: '#9d978c' })); sd.emissiveIntensity = 1.0; sd.userData.keep = true;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, T.h, d), [sd, sd, soStd('#3a3836', 0.95), sd, fm, soStd('#8d877c', 0.95)]);    // (its windows face the park: +z)
  m.position.set((T.x[0] + T.x[1]) / 2, T.h / 2, (T.z[0] + T.z[1]) / 2); root.add(m);
  // a red aircraft light on the roof
  const red = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false })); red.position.set((T.x[0] + T.x[1]) / 2, T.h + 1.2, (T.z[0] + T.z[1]) / 2); root.add(red);
  return { red };
}

// ---------------------------------------------------------------------------------------------------------------------
// LAMPLIGHT: soft pools on the ground under every lamp (additive), and a few real lights moved to the lamps nearest the
// camera each frame (they light the people and the wet road)
// ---------------------------------------------------------------------------------------------------------------------
function soLampSpots(T) {
  const L = [];
  for (const [x, z, f] of T.posts) L.push([x, 5.9, z + f * 0.85, 1]);
  for (const [x, z] of [[-45, -15.5], [0, -15.5], [45, -15.5], [-20, -80], [24, -80]]) L.push([x, 4.1, z + 1.4, 0.8]);
  L.push([SO_BATLAMP[0], SO_BATLAMP[1], SO_BATLAMP[2], 0.9]);
  return L;
}
const SO_BATLAMP = [33.0, 4.15, -45.0];
function soBuildLampPools(scene, spots) {
  const tex = soTex(soCanvas(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,214,150,0.9)'); gr.addColorStop(0.35, 'rgba(255,190,120,0.42)'); gr.addColorStop(1, 'rgba(255,170,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); }), { repeat: false });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  const im = new THREE.InstancedMesh(geo, mat, spots.length), M4 = new THREE.Matrix4();
  spots.forEach(([x, y, z], i) => { const R = y * 2.6; im.setMatrixAt(i, M4.compose(new THREE.Vector3(x, 0.135, z), new THREE.Quaternion(), new THREE.Vector3(R, 1, R))); });
  im.renderOrder = 2; scene.add(im);
  // a glow sprite round every lamp head (for the bloom)
  const glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: soDotTex(0.25), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffcf96', opacity: 0.8 }), spots.length);
  glow.frustumCulled = false; scene.add(glow);
  return { pools: im, glow, spots };
}
// the camera-facing lamp glows; the real lights onto the nearest lamps
function soLampsUpdate(L, lights, cam, k = 1) {
  const M4 = new THREE.Matrix4(), q = cam.quaternion, v = new THREE.Vector3(), sc = new THREE.Vector3();
  L.spots.forEach(([x, y, z, s], i) => { sc.setScalar(1.6 * s * k); L.glow.setMatrixAt(i, M4.compose(v.set(x, y - 0.12, z), q, sc)); });
  L.glow.instanceMatrix.needsUpdate = true;
  const c = cam.position, near = L.spots.map((p) => [p, (p[0] - c.x) ** 2 + (p[2] - c.z) ** 2]).sort((a, b) => a[1] - b[1]);
  lights.forEach((l, i) => { const p = near[i] && near[i][0]; if (!p) { l.intensity = 0; return; } l.position.set(p[0], p[1] - 0.3, p[2]); l.intensity = 22 * k * (p[3] || 1); });
}

// ---------------------------------------------------------------------------------------------------------------------
// RAIN: streaks in a box round the camera, falling at 7 m/s with a little wind; none inside your block (a pure function
// of t and where the camera is). Seen from inside, through the window
// ---------------------------------------------------------------------------------------------------------------------
function soBuildRain(scene, n = 7000) {
  const pos = new Float32Array(n * 6), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
  const mat = new THREE.LineBasicMaterial({ color: '#a9b8c8', transparent: true, opacity: 0.32, depthWrite: false, fog: true });
  const ls = new THREE.LineSegments(geo, mat); ls.frustumCulled = false; ls.renderOrder = 7; scene.add(ls);
  const R = [], r = new RNG(4401); for (let i = 0; i < n; i++) R.push([r.next(), r.next(), r.next(), 0.8 + 0.4 * r.next()]);
  return { ls, mat, update(t, cam, o = {}) {
    const B = o.box || 26, Hb = o.h || 18, cx = cam.position.x, cy = cam.position.y, cz = cam.position.z, v = 7.0, wind = 0.9, len = o.len || 0.32, A = SO_ST.blockA;
    let k = 0;
    for (let i = 0; i < n; i++) {
      const [a, b, c, sp] = R[i];
      const y = cy - Hb / 2 + ((((b * Hb) - t * v * sp) % Hb) + Hb) % Hb;
      const x = cx - B / 2 + ((((a * B) + t * wind) % B) + B) % B, z = cz - B / 2 + ((c * B) % B);
      const inside = (z > -0.25 && x > A.x[0] && x < A.x[1] && y < A.h + 0.5) || y < 0;
      if (inside) { pos.fill(0, k * 6, k * 6 + 6); k++; continue; }
      pos[k * 6] = x; pos[k * 6 + 1] = y; pos[k * 6 + 2] = z; pos[k * 6 + 3] = x - wind / v * len; pos[k * 6 + 4] = y + len * sp; pos[k * 6 + 5] = z; k++;
    }
    geo.attributes.position.needsUpdate = true; ls.visible = o.on !== false;
  } };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE LIGHTNING, 2 km off over the rooftops south of the park: a jagged bolt (unfogged) and the sky lit; three flickers
// ---------------------------------------------------------------------------------------------------------------------
function soBuildBolt(scene) {
  const r = new RNG(2061), pts = []; let x = -380, y = 900;
  while (y > 0) { pts.push(new THREE.Vector3(x, y, -SOP.bolt + 40)); x += r.range(-55, 55); y -= r.range(40, 110); }
  pts.push(new THREE.Vector3(x, 0, -SOP.bolt + 40));
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#e8e4ff', fog: false, toneMapped: false, transparent: true });
  const main = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 120, 5, 6, false), m); g.add(main);
  for (let b = 0; b < 3; b++) { const i0 = 2 + b * 3, p0 = pts[Math.min(i0, pts.length - 2)], bp = [p0.clone()]; let q = p0.clone(); for (let k = 0; k < 4; k++) { q = q.clone().add(new THREE.Vector3(r.range(30, 90) * (b % 2 ? 1 : -1), -r.range(40, 90), 0)); bp.push(q); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp), 30, 2.5, 5, false), m)); }
  g.visible = false; g.renderOrder = -5; scene.add(g);
  return { g, m };
}
// the flash at film t: 0…1 (three flickers over 0.45 s, from SO.tBolt)
function soBoltAt(t) { const u = t - SO.tBolt; if (u < 0 || u > 0.7) return 0; return Math.max(Math.exp(-u / 0.05), 0.8 * Math.exp(-Math.max(0, u - 0.16) / 0.04) * (u > 0.16 ? 1 : 0), 0.6 * Math.exp(-Math.max(0, u - 0.33) / 0.08) * (u > 0.33 ? 1 : 0)); }

// ---------------------------------------------------------------------------------------------------------------------
// THE BATS round the lamp in the middle of the park: they can't hear their own calls. They flutter in jerky loops, too
// close to the light; two hit the lamp and drop into the grass
// ---------------------------------------------------------------------------------------------------------------------
function soBuildBats(scene) {
  const m = soStd('#16130f', 0.8, 0, { side: THREE.DoubleSide }), bats = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group(); soMesh(new THREE.SphereGeometry(0.035, 8, 6).scale(1, 0.9, 1.6), m, 0, 0, 0, g);
    const wing = (sd) => { const p = new THREE.Group(); g.add(p); const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(sd * 0.17, 0.03); sh.lineTo(sd * 0.15, -0.02); sh.lineTo(sd * 0.11, 0.0); sh.lineTo(sd * 0.08, -0.04); sh.lineTo(sd * 0.04, -0.05); sh.closePath();
      const w = new THREE.Mesh(new THREE.ShapeGeometry(sh), m); w.rotation.x = -Math.PI / 2; p.add(w); return p; };
    g.userData.w = [wing(-1), wing(1)]; g.scale.setScalar(1.5); g.visible = false; scene.add(g); bats.push(g);
  }
  return bats;
}
// bat i at film t (relative to the beat's start t0): position, heading, flap; hits: the two that strike the lamp
function soBatsUpdate(bats, t, t0, on) {
  const L = SO_BATLAMP;
  bats.forEach((b, i) => {
    b.visible = on; if (!on) return;
    const u = t - t0, ph = i * 1.7, R = 1.2 + 0.9 * fuzz(i), w = 2.3 + 0.6 * fuzz(i + 9);
    let x = L[0] + R * Math.cos(u * w + ph) + 0.6 * noise1(u * 1.7, i + 3), y = L[1] - 0.3 + 0.8 * Math.sin(u * w * 0.7 + ph) + 0.4 * noise1(u * 2.1, i + 7), z = L[2] + R * Math.sin(u * w * 1.3 + ph) + 0.6 * noise1(u * 1.5, i + 5);
    // the two that hit the lamp: they fly straight into the glass, then fall, tumbling
    const hit = i === 1 ? soC('bats', 1) + 0.5 - t0 : i === 4 ? soC('bats', 1) + 2.6 - t0 : null;
    let flap = Math.sin(u * 38 + i * 2);
    if (hit != null && u > hit - 0.5) {
      const pre = MathX.clamp((u - hit + 0.5) / 0.5, 0, 1), from = [x, y, z];
      if (u < hit) { x = from[0] + (L[0] - from[0]) * pre; y = from[1] + (L[1] - from[1]) * pre; z = from[2] + (L[2] - from[2]) * pre; }
      else { const v = u - hit; x = L[0] + 0.25 * v; z = L[2] + 0.15 * v; y = Math.max(0.05, L[1] - 4.9 * v * v); flap = 0.6 * Math.sin(v * 9); b.rotation.set(v * 7, v * 3, v * 5); }
    }
    b.position.set(x, y, z);
    if (!(hit != null && u > hit)) { const dx = -R * w * Math.sin(u * w + ph), dz = R * w * 1.3 * Math.cos(u * w * 1.3 + ph); b.rotation.set(0.2 * Math.sin(u * 5 + i), Math.atan2(dx, dz), 0.4 * Math.sin(u * 7 + i)); }
    b.userData.w[0].rotation.z = 0.9 * flap; b.userData.w[1].rotation.z = -0.9 * flap;
  });
}
function fuzz(i) { return hash1(i * 131 + 7); }

// ---------------------------------------------------------------------------------------------------------------------
// THE CARS THAT MOVE: the one that glides past you at the kerb (an EV, 30 km/h: you never hear it), the ambulance
// (blue lights, no siren), a parked car whose alarm is going off (its hazard lights flash; nothing else)
// ---------------------------------------------------------------------------------------------------------------------
function soBuildMovers(root, T) {
  const VF = new VehicleFactory(), out = {};
  const car = VF.build('ev', '#3a3f46'); const g = new THREE.Group(); car.group.position.x = -2.36; g.add(car.group); root.add(g); out.ev = { g, o: car };
  const amb = VF.build('van', '#eceae2'); const ga = new THREE.Group(); amb.group.position.x = -2.65; ga.add(amb.group); root.add(ga); out.amb = { g: ga, o: amb };
  // the ambulance's markings and its light bar (blue, flashing)
  { const chk = soTex(soCanvas(256, 32, (c, w, h) => { for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 16) { c.fillStyle = ((x + y) / 16) % 2 ? '#1f8a3a' : '#e8d23a'; c.fillRect(x, y, 32, 16); } }));
    for (const sd of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.4), soStd('#ffffff', 0.5, 0, { map: chk })); p.position.set(0, 0.95, sd * 1.01); if (sd < 0) p.rotation.y = Math.PI; ga.add(p); }
    out.amb.blue = [-0.5, 0.5].map((z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.32), new THREE.MeshBasicMaterial({ color: '#1a3cff', toneMapped: false })); m.position.set(1.4, 2.42, z); ga.add(m); return m; });
    out.amb.light = new THREE.PointLight('#3a5cff', 0, 30, 1.6); out.amb.light.position.set(1.4, 3.0, 0); ga.add(out.amb.light); }
  // the car alarm (the parked hatch along your side: car3)
  out.alarm = T.cars.find((c) => c.b.id === 'car9');
  if (out.alarm) { const parts = []; out.alarm.g.traverse((o) => { if (o.isMesh && o.material && o.material.emissive && o.material.color && o.material.color.getHexString() === '7a4a10') parts.push(o.material); }); out.alarm.haz = [...new Set(parts)]; }
  return out;
}
// the EV: along the near lane (z −4.7), east to west (+x) at 30 km/h; it passes the kerb where you step out at SO.tCar
const SO_EV = { z: -4.75, v: 8.33 };
const SO_AMB = { z: -7.1, v: 11.1, x0: -70 };                 // (the far lane: west, +x)
function soMoversUpdate(M, t, mode) {
  const K = SO_ST.you.kerb;
  M.ev.g.visible = mode === 'car';
  // (the near lane carries traffic east, −x: it comes at you from your right)
  if (M.ev.g.visible) { const x = K[0] - SO_EV.v * (t - SO.tCar); M.ev.g.position.set(x, 0, SO_EV.z); M.ev.g.rotation.y = Math.PI; }
  M.amb.g.visible = mode === 'warn';
  if (M.amb.g.visible) {
    const x = SO_AMB.x0 + SO_AMB.v * (t - soS('warn')); M.amb.g.position.set(x, 0, SO_AMB.z); M.amb.g.rotation.y = 0;
    const ph = (t * 2.6) % 1; M.amb.blue[0].visible = ph < 0.25 || (ph > 0.5 && ph < 0.6); M.amb.blue[1].visible = (ph > 0.25 && ph < 0.4) || ph > 0.75;
    M.amb.light.intensity = (M.amb.blue[0].visible || M.amb.blue[1].visible) ? 60 : 0;
  }
  if (M.alarm && M.alarm.haz) { const on = Math.floor(t * 1.6) % 2 === 0 && (mode === 'street' || mode === 'car' || mode === 'warn' || mode === 'heads'); for (const m of M.alarm.haz) m.emissiveIntensity = on ? 4.0 : 0.0; }
}

// ---------------------------------------------------------------------------------------------------------------------
// SCREENS: your laptop (the news, the presenter talking: you can't hear a word), your phone (the call, the texts)
// ---------------------------------------------------------------------------------------------------------------------
function soBuildLaptop(R) {
  const g = new THREE.Group(), P = SO_K.laptop; g.position.set(P[0], P[1], P[2]); g.rotation.y = -0.45; R.room.add(g);   // (its screen towards where you stand)
  const al = soStd('#9ea3a8', 0.35, 0.7);
  soBox(0.32, 0.014, 0.22, al, 0, 0.007, 0, g);
  const lid = new THREE.Group(); lid.position.set(0, 0.014, -0.11); lid.rotation.x = -0.22; g.add(lid);
  soBox(0.32, 0.21, 0.008, al, 0, 0.105, 0, lid);
  const scr = soCanvasTex(512, 320, soDrawNews);
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.295, 0.184), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false })); sm.position.set(0, 0.107, 0.0045); lid.add(sm);
  const glow = new THREE.PointLight('#9fb8ff', 0.5, 2.2, 1.6); glow.position.set(0, 0.15, 0.2); lid.add(glow);
  return { g, scr, glow };
}
// the news: a studio, a presenter (mouth moving), a ticker. st = { t, talk }
function soDrawNews(g, w, h, st) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#16324e'); gr.addColorStop(1, '#0b1626'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(80,140,200,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(40 + i * 80, 30, 40, 160);
  // the presenter
  g.fillStyle = '#26303a'; g.beginPath(); g.moveTo(170, h); g.quadraticCurveTo(180, 205, 256, 196); g.quadraticCurveTo(332, 205, 342, h); g.fill();
  g.fillStyle = '#e8eef4'; g.fillRect(244, 196, 24, 30);
  g.fillStyle = '#c9967a'; g.beginPath(); g.ellipse(256, 150, 38, 48, 0, 0, 6.283); g.fill();
  g.fillStyle = '#2a1c14'; g.beginPath(); g.ellipse(256, 118, 41, 26, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#1a1210'; g.fillRect(240, 142, 8, 4); g.fillRect(264, 142, 8, 4);
  g.fillStyle = '#5a2a24'; const mo = 2 + 9 * st.talk; g.beginPath(); g.ellipse(256, 176, 11, mo / 2, 0, 0, 6.283); g.fill();
  // the lower third and the ticker
  g.fillStyle = '#b8222a'; g.fillRect(0, 238, 96, 32); g.fillStyle = '#fff'; g.font = '700 20px Arial'; g.fillText('LIVE', 22, 262);
  g.fillStyle = 'rgba(245,245,245,0.94)'; g.fillRect(96, 238, w - 96, 32); g.fillStyle = '#111'; g.font = '700 18px Arial'; g.fillText(st.late ? 'SOUND LOSS REPORTED ACROSS THE CITY' : 'EVENING NEWS · WEATHER: RAIN ALL NIGHT', 110, 261);
  g.fillStyle = '#0b1626'; g.fillRect(0, 270, w, 50); g.fillStyle = '#cfd8e2'; g.font = '600 16px Arial'; g.fillText('9:41 PM  ·  ' + (st.late ? 'PEOPLE ARE ASKED TO STAY INDOORS AND USE TEXT MESSAGES' : 'TRAFFIC: M25 SLOW BETWEEN J10 AND J12'), 16 - (st.tick % 1) * 0, 300);
}
// your phone: a group with a body and a screen (canvas). st = { mode: 'call' | 'mum' | 'unknown', t (film), k }
function soBuildPhone(parent) {
  const g = new THREE.Group(); parent.add(g);
  soMesh(soRoundBox(0.072, 0.009, 0.152, 0.009, 0.002), soStd('#15171b', 0.3, 0.4), 0, 0, 0, g);
  const scr = soCanvasTex(360, 760, soDrawPhone);
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.142), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false })); sm.rotation.x = -Math.PI / 2; sm.position.y = 0.0095; g.add(sm);
  return { g, scr };
}
function soDrawPhone(g, w, h, st) {
  g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8ecf2'; g.font = '600 26px Arial'; g.fillText('9:4' + (st.min || 2), 28, 46);
  if (st.mode === 'call') {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d2a3a'); gr.addColorStop(1, '#0a0e14'); g.fillStyle = gr; g.fillRect(0, 60, w, h - 60);
    g.fillStyle = '#5a6a7e'; g.beginPath(); g.arc(w / 2, 220, 70, 0, 6.283); g.fill(); g.fillStyle = '#fff'; g.font = '700 64px Arial'; g.textAlign = 'center'; g.fillText('M', w / 2, 244);
    g.font = '600 44px Arial'; g.fillText('Mum', w / 2, 350); g.fillStyle = '#9fe0a8'; g.font = '500 30px Arial'; g.fillText(st.secs > 0 ? `connected · 0:${String(st.secs).padStart(2, '0')}` : 'calling…', w / 2, 400);
    // her voice level: a flat line (nothing coming in)
    g.strokeStyle = 'rgba(159,224,168,0.8)'; g.lineWidth = 4; g.beginPath(); g.moveTo(60, 470); g.lineTo(w - 60, 470); g.stroke();
    g.fillStyle = '#c8322a'; g.beginPath(); g.arc(w / 2, 650, 46, 0, 6.283); g.fill();
    g.textAlign = 'left';
    return;
  }
  // a note he types to you (the notes app: big letters, a blinking cursor)
  if (st.mode === 'note') {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 60, w, h - 60); g.fillStyle = '#c9a54a'; g.fillRect(0, 60, w, 70); g.fillStyle = '#2a2418'; g.font = '700 30px Arial'; g.fillText('Notes', 24, 106);
    g.fillStyle = '#141414'; g.font = '800 64px Arial'; const L1 = soWrap(g, st.a + (st.b ? '' : (st.cur ? '|' : '')), 310); L1.forEach((l, i) => g.fillText(l, 26, 230 + i * 74));
    if (st.b) { g.font = '600 40px Arial'; const L2 = soWrap(g, st.b + (st.cur ? '|' : ''), 310); L2.forEach((l, i) => g.fillText(l, 26, 250 + L1.length * 74 + i * 50)); }
    return;
  }
  // a message thread
  const who = st.mode === 'mum' ? 'Mum' : '+44 7700 900461';
  g.fillStyle = '#10141a'; g.fillRect(0, 60, w, 90); g.fillStyle = '#e8ecf2'; g.font = '700 32px Arial'; g.textAlign = 'center'; g.fillText(who, w / 2, 118); g.textAlign = 'left';
  const msgs = st.mode === 'mum' ? [['in', 'I can\'t hear you.', 0], ['in', 'I can\'t hear ANYTHING', 1.2], ['in', 'not even my own tv', 2.4]] : [['in', 'was that you?', 0], ['in', 'saying hello?', 0.9], ['in', 'you\'re the only sound I can hear', 2.3]];
  let y = 200;
  for (const [, text, d] of msgs) {
    if (st.k < d) break;
    g.font = '500 30px Arial'; const lines = soWrap(g, text, 250);
    const bh = 22 + lines.length * 38; g.fillStyle = '#2a3340'; soRR(g, 26, y, 290, bh, 22); g.fill();
    g.fillStyle = '#f2f4f8'; lines.forEach((l, i) => g.fillText(l, 46, y + 44 + i * 38)); y += bh + 18;
  }
}
function soWrap(g, text, max) { const out = []; let cur = ''; for (const w of text.split(' ')) { const tr = cur ? cur + ' ' + w : w; if (g.measureText(tr).width > max && cur) { out.push(cur); cur = w; } else cur = tr; } if (cur) out.push(cur); return out; }
