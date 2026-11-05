/* =====================================================================
   TRANSPORT — down in the valley: the railway on the east bank (a level embankment, the rails, the sleepers drawn
   into the ballast's texture, the catenary masts and wire) and its train (four cars, southbound; its driver gone, the
   safety system brakes it); the river barge (86 m, on its autopilot, heading held straight while the river bends).
     mgBuildRail(S) → RL (RL.update(s)) · mgBuildBarge(S) → BG (BG.update(s), BG.fx(s, puffs))
   Rail-local: the line runs along z at x = MG_V.railX; the train's front is at MGP.trainZ(s) (southbound, +z).
   ===================================================================== */

const MG_RAIL = { y: 1.55, gauge: 1.435, z: [-3200, 3400], carL: 24, gap: 0.8, w: 2.9, h: 3.9 };

function mgBallastCanvas() {
  return mgCanvas(256, 512, (g, w, h) => {
    const r = new RNG(14); g.fillStyle = '#6e6a62'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const v = 70 + r.next() * 70; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(r.next() * w, r.next() * h, 2 + r.next() * 3, 2 + r.next() * 3); }
    // the sleepers (every 0.6 m: 512 px = 4.8 m)
    for (let y = 0; y < h; y += 64) { g.fillStyle = '#4a4440'; g.fillRect(w * 0.18, y + 4, w * 0.64, 20); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(w * 0.18, y + 22, w * 0.64, 3); }
  });
}
function mgTrainCanvas(front) {
  return mgCanvas(1024, 256, (g, w, h) => {
    g.fillStyle = '#e9e7e2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b5232c'; g.fillRect(0, h * 0.74, w, h * 0.16); g.fillStyle = '#2b2f36'; g.fillRect(0, h * 0.9, w, h * 0.1);
    // the windows (a dark band with frames), the doors
    g.fillStyle = '#20262e'; g.fillRect(0, h * 0.3, w, h * 0.3);
    g.fillStyle = 'rgba(233,231,226,0.95)'; for (let x = 40; x < w; x += 82) g.fillRect(x, h * 0.3, 8, h * 0.3);
    for (const x of [w * 0.22, w * 0.72]) { g.fillStyle = '#c9c6bf'; g.fillRect(x - 34, h * 0.24, 68, h * 0.66); g.fillStyle = '#20262e'; g.fillRect(x - 26, h * 0.3, 22, h * 0.32); g.fillRect(x + 4, h * 0.3, 22, h * 0.32); }
    if (front) { g.fillStyle = '#b5232c'; g.fillRect(w * 0.88, 0, w * 0.12, h * 0.9); }
    g.fillStyle = '#b5232c'; g.font = '700 30px sans-serif'; g.fillText('VALLEY RAIL', w * 0.36, h * 0.2);
  });
}

function mgBuildRail(S) {
  const R = MG_RAIL, X = MG_V.railX, RL = {};
  // ---- the embankment: a trapezoid along z (top 7 m wide at y = R.y, its toes 1.5 m under the valley floor)
  { const s = new THREE.Shape(); s.moveTo(-8.5, -1.6); s.lineTo(8.5, -1.6); s.lineTo(3.5, R.y); s.lineTo(-3.5, R.y); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: R.z[1] - R.z[0], bevelEnabled: false }); g.translate(0, 0, R.z[0]); g.translate(X, 0, 0); g.computeVertexNormals();
    // (the top's uv: x across, z along; the side faces: the same texture, darker)
    const tex = mgTex(mgBallastCanvas(), { aniso: 8 }); tex.repeat.set(1, 1);
    const pos = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - X + 3.5) / 7, pos.getZ(i) / 4.8); uv.needsUpdate = true;
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.97 })); m.receiveShadow = true; S.scene.add(m); RL.bank = m; }
  // ---- the rails (two steel bars just proud of the ballast: 14 cm, no shared plane), the catenary
  const steel = mgStd('#8a8580', 0.35, 0.8), B = mgBatch();
  for (const sd of [-1, 1]) B.box(0.07, 0.14, R.z[1] - R.z[0], steel, X + sd * R.gauge / 2, R.y + 0.07, (R.z[0] + R.z[1]) / 2);
  const mast = mgStd('#6e7378', 0.5, 0.6);
  for (let z = R.z[0] + 20; z < R.z[1]; z += 50) {
    if (Math.abs(z) < 30) continue;                                                   // (under the viaduct: the wire hangs from its girder)
    B.box(0.28, 7.6, 0.28, mast, X + 3.9, R.y + 3.8, z); B.box(3.6, 0.1, 0.1, mast, X + 2.1, R.y + 6.9, z); B.box(0.06, 0.9, 0.06, mast, X + 0.2, R.y + 6.45, z);
  }
  B.box(0.03, 0.03, R.z[1] - R.z[0], mgStd('#3a3530', 0.5, 0.7), X + 0.2, R.y + 6.0, (R.z[0] + R.z[1]) / 2);      // the contact wire
  B.box(0.02, 0.02, R.z[1] - R.z[0], mgStd('#3a3530', 0.5, 0.7), X + 0.2, R.y + 7.05, (R.z[0] + R.z[1]) / 2);     // the catenary above it
  B.build(S.scene);
  // ---- the train: four cars (z-local: the front car's nose at +12)
  const T = new THREE.Group(); S.scene.add(T); RL.train = T;
  const body = (front) => new THREE.MeshStandardMaterial({ map: mgTex(mgTrainCanvas(front), { repeat: false }), roughness: 0.45, metalness: 0.1 });
  const Mt = { white: mgStd('#e9e7e2', 0.5, 0.1), red: mgStd('#b5232c', 0.45, 0.1), dark: mgStd('#24282e', 0.6, 0.3), bogie: mgStd('#2a2b2d', 0.7, 0.4), glass: mgStd('#1a222a', 0.06, 0.6, { envMapIntensity: 1.6 }), seat: mgStd('#3a4a6a', 0.9), desk: mgStd('#30343a', 0.7), head: new THREE.MeshStandardMaterial({ color: '#fff', emissive: new THREE.Color('#fff4e0'), emissiveIntensity: 1.4 }) };
  RL.cars = [];
  for (let i = 0; i < MGP.train.cars; i++) {
    const c = new THREE.Group(); T.add(c); c.position.z = -i * (R.carL + R.gap); RL.cars.push(c);
    const front = i === 0, L = R.carL, bodyL = front ? L - 3.2 : L;
    const mats = [body(false), body(false), Mt.white, Mt.dark, Mt.white, Mt.white];
    const bx = new THREE.Mesh(new THREE.BoxGeometry(R.w, R.h - 0.9, bodyL), [mats[0], mats[1], mats[2], mats[3], mats[4], mats[5]]);
    // (the side faces are ±x: a box's uv reads unmirrored from outside on both)
    bx.position.set(0, R.y + 0.9 + (R.h - 0.9) / 2 + 0.25, front ? -1.6 : 0); c.add(bx);
    for (const z of [-L / 2 + 3, L / 2 - 3]) { const bg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 2.8), Mt.bogie); bg.position.set(0, R.y + 0.7, z); c.add(bg);
      for (const dz of [-0.95, 0.95]) for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 14).rotateZ(Math.PI / 2), Mt.bogie); w.position.set(sd * 0.72, R.y + 0.56, z + dz); c.add(w); } }
    if (front) {
      // the cab: the nose (a sloped front), the windscreen, the side windows open (you can see in: the empty seat, the desk)
      const cz = L / 2 - 3.2, n = new THREE.Group(); n.position.z = cz; c.add(n);
      const Bn = (w, h, d, m, x, y, z, rx = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.x = rx; o.castShadow = true; n.add(o); return o; };
      Bn(R.w, 1.25, 3.2, Mt.red, 0, R.y + 1.15 + 0.63, 1.6);                         // below the windows
      Bn(R.w, 0.9, 1.0, Mt.red, 0, R.y + 2.55, 3.05, -0.35);                         // the nose's slope under the windscreen
      Bn(R.w, 0.55, 3.0, Mt.white, 0, R.y + 3.95, 1.4);                              // the roof
      Bn(0.12, 1.1, 0.12, Mt.white, -R.w / 2 + 0.06, R.y + 3.15, 2.9); Bn(0.12, 1.1, 0.12, Mt.white, R.w / 2 - 0.06, R.y + 3.15, 2.9);
      Bn(0.08, 1.1, 1.0, Mt.white, -R.w / 2 + 0.04, R.y + 3.15, 0.6); Bn(0.08, 1.1, 1.0, Mt.white, R.w / 2 - 0.04, R.y + 3.15, 0.6);
      Bn(R.w - 0.3, 0.06, 0.06, Mt.dark, 0, R.y + 2.62, 3.12); Bn(R.w - 0.3, 0.06, 0.06, Mt.dark, 0, R.y + 3.68, 2.92);
      Bn(R.w - 0.1, 0.06, 2.9, Mt.dark, 0, R.y + 2.08, 1.5);                         // the cab's floor
      Bn(1.2, 0.55, 0.6, Mt.desk, -0.5, R.y + 2.4, 2.45); Bn(0.5, 0.12, 0.5, Mt.seat, -0.55, R.y + 2.55, 1.45); Bn(0.5, 0.7, 0.12, Mt.seat, -0.55, R.y + 2.95, 1.15, 0.15);
      const lever = Bn(0.05, 0.3, 0.05, Mt.dark, -0.3, R.y + 2.8, 2.3, 0.6); n.lever = lever;
      const ped = Bn(0.18, 0.04, 0.26, Mt.dark, -0.55, R.y + 2.16, 2.0, 0.25); c.pedal = ped;   // the driver's safety pedal (released)
      for (const sd of [-1, 1]) Bn(0.22, 0.14, 0.06, Mt.head, sd * 0.95, R.y + 1.9, 3.21);
      // the pantograph on the roof of the first car (a frame up to the wire)
      const pm = mgStd('#6e7378', 0.5, 0.6); mgBeam([0.2, R.y + R.h + 0.1, -4], [0.2, R.y + 5.2, -3.0], 0.06, 0.06, pm, c); mgBeam([0.2, R.y + 5.2, -3.0], [0.2, R.y + 6.0, -4.2], 0.05, 0.05, pm, c);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.12), pm); head.position.set(0.2, R.y + 5.98, -4.2); c.add(head);
    }
    c.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }
  T.position.x = X;
  // ---- the sparks under the wheels while it brakes (drawn by the set into its additive puffs)
  RL.update = (s) => { T.position.z = MGP.trainZ(s) - R.carL / 2; };
  RL.fx = (s, fx) => {
    const v = MGP.trainV(s); if (s < MGP.train.sWarn || v < 0.3) return;
    for (let i = 0; i < MGP.train.cars; i++) for (const zz of [-R.carL / 2 + 3, R.carL / 2 - 3]) for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) {
      const j = i * 100 + (zz > 0 ? 50 : 0) + (sd > 0 ? 25 : 0) + k, life = 0.25, ph = ((s / life + mgR(j, 7)) % 1 + 1) % 1, u = ph * life;
      const z = T.position.z - i * (R.carL + R.gap) + zz - v * 0.3 * u, x = X + sd * (0.72 + 0.4 * u), y = R.y + 0.18 + 1.2 * u - 4.9 * u * u;
      fx.add(x, y, z, 0.05, 0.8 * (1 - ph) * Math.min(1, v / 8), 1, 0.65, 0.3);
    }
  };
  return RL;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE BARGE (barge-local: z forward (its bow at +L/2), y up from the water, x to port… here simply ±x). Its skipper
// was a man; its autopilot holds the heading. A gravel cargo, the wheelhouse at the stern, a small car on its deck.
// ---------------------------------------------------------------------------------------------------------------------
function mgBuildBarge(S) {
  const Bp = MGP.barge, G = new THREE.Group(), K = new THREE.Group(); S.scene.add(G); G.add(K);
  const M = { hull: mgStd('#2a2f36', 0.6, 0.3), red: mgStd('#7a2420', 0.7), deck: mgStd('#4a4a48', 0.85), hold: mgStd('#3a3a3c', 0.8), gravel: mgStd('#a39684', 1.0), white: mgStd('#e6e4de', 0.6), glass: mgStd('#24303a', 0.08, 0.6, { envMapIntensity: 1.5 }), wood: mgStd('#6a4a2a', 0.8) };
  const L = Bp.len, W = Bp.beam, y0 = -1.25;
  const Bx = (w, h, d, m, x, y, z, ry = 0, rx = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.castShadow = o.receiveShadow = true; K.add(o); return o; };
  // the hull: a long box (draft 2.4 m, 1.6 m freeboard), the bow raked; the red boot-top at the waterline
  Bx(W, 4.0, L - 6, M.hull, 0, y0 + 0.4 - 1.0 + 0.8, -3);
  { const s = new THREE.Shape(); s.moveTo(-W / 2, -2.4); s.lineTo(W / 2, -2.4); s.lineTo(W / 2, 1.6); s.lineTo(-W / 2, 1.6); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 6, bevelEnabled: false }); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const z = p.getZ(i), y = p.getY(i), k = z / 6; p.setX(i, p.getX(i) * (1 - 0.35 * k * k)); if (y < 0) p.setZ(i, z * (0.45 + 0.55 * (y + 2.4) / 2.4)); }
    g.computeVertexNormals(); g.translate(0, y0 + 0.2, L / 2 - 6); const m = new THREE.Mesh(g, M.hull); m.castShadow = true; K.add(m); }
  Bx(W + 0.04, 0.3, L - 6, M.red, 0, y0 + 0.02, -3);
  // the hold (a sunken deck with the gravel heaped in it), the coamings, the side decks
  Bx(W - 2.0, 0.5, L - 22, M.hold, 0, y0 + 2.05, 2);
  for (const sd of [-1, 1]) Bx(0.25, 0.6, L - 22, M.deck, sd * (W / 2 - 1.0), y0 + 2.3, 2);
  { const g = new THREE.CylinderGeometry(1, 1, 1, 6, 1).scale((W - 2.4) / 2, 1.3, (L - 24) / 2); g.translate(0, y0 + 2.6, 2); K.add(new THREE.Mesh(g, M.gravel)); }
  // the wheelhouse at the stern: raised, glazed all round; the accommodation under it; a car on the aft deck; the flag
  Bx(W - 0.6, 2.4, 9, M.white, 0, y0 + 3.0, -L / 2 + 6.5);
  const wh = Bx(4.2, 2.2, 3.2, M.white, 0, y0 + 5.3, -L / 2 + 8.5);
  Bx(4.25, 0.9, 3.25, M.glass, 0, y0 + 5.55, -L / 2 + 8.5);
  Bx(4.6, 0.15, 3.6, M.red, 0, y0 + 6.45, -L / 2 + 8.5);
  Bx(1.7, 1.1, 3.8, mgStd('#4a6a8a', 0.4, 0.4), 0, y0 + 2.75, -L / 2 + 2.6);
  Bx(0.05, 2.5, 0.05, M.wood, 0, y0 + 3.1, -L / 2 + 0.3); Bx(0.02, 0.5, 0.8, mgStd('#d23a2a', 0.8), 0, y0 + 4.1, -L / 2 - 0.1);
  void wh;
  G.position.x = Bp.x;
  const BG = { G, K,
    update(s) {
      const z = MGP.bargeBow(s) - L / 2, hit = s > Bp.sHit, u = hit ? 1 - Math.exp(-(s - Bp.sHit) / 1.4) : 0;
      G.position.set(Bp.x + (hit ? 1.2 * u : 0), 0, z); G.rotation.y = MGP.bargeYaw(s);
      // ploughing into the bank: the bow rides up the mud and the hull pitches; the stern settles a little
      K.rotation.x = -0.035 * u; K.position.y = 0.55 * u + 0.04 * Math.sin(s * 0.9);
    },
    // the bow wave while it moves; the mud and the spray where it hits
    fx(s, puffs) {
      const bow = MGP.bargeBow(s), v = s < Bp.sHit ? Bp.v : 0, hit = s > Bp.sHit;
      if (v > 0) for (let i = 0; i < 40; i++) { const ph = ((s * 0.5 + mgR(i, 3)) % 1), sd = i % 2 ? 1 : -1; puffs.add(Bp.x + sd * (W / 2 + 0.5 + 6 * ph), -1.1, bow - 2 - 10 * ph, 0.8 + 1.6 * ph, 0.35 * (1 - ph), 0.92, 0.94, 0.95); }
      if (hit) { const a = s - Bp.sHit; for (let i = 0; i < 60; i++) { const life = 2 + 2 * mgR(i, 5), ph = a / life; if (ph > 1) continue; const an = mgR(i, 6) * 3.14;
        puffs.add(Bp.x + 2 + Math.cos(an) * 6 * ph, 0.5 + 3.5 * ph * (1 - ph) * 2 + mgR(i, 7), bow + 2 + Math.sin(an) * 5 * ph, 1.2 + 2.5 * ph, 0.5 * (1 - ph), 0.42, 0.36, 0.28); } }
    },
  };
  return BG;
}
