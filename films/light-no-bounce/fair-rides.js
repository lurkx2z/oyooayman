/* =====================================================================
   FAIR RIDES — the Ferris wheel, the rollercoaster, the carousel and the dodgems. Each runs by itself as a pure function
   of story time s (they don't stop for the dark: their motors and controls don't need light).
     nbBuildWheel(S, W)    16 gondolas, bulbs on its spokes and rims; one turn in 220 s
     nbBuildCoaster(S, W)  a steel coaster: lift hill, drop, turnaround, hump, helix; LEDs along both rails; a three-car
                           train whose speed comes from the height it has fallen (v² = v₀² + 2gΔh, less rolling losses)
     nbBuildCarousel(S, W) horses on brass poles, a mirrored centre, a canopy rimmed with bulbs; one turn in 21 s
     nbBuildDodgems(S, W)  a pavilion with bulbs round its roof; ten cars; sparks where their poles touch the ceiling
   Each: { update(s), lamps(L, s) } (L = nbLamps, filled every frame)
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE FERRIS WHEEL
// ---------------------------------------------------------------------------------------------------------------------
function nbBuildWheel(S, W) {
  const scene = S.scene, F = NB_F.wheel, M = W.M, R = F.R;
  const base = new THREE.Group(); base.position.set(F.c[0], 0, F.c[2]);
  base.rotation.y = Math.atan2(-F.c[0], NB_F.you[2] - F.c[2]); scene.add(base);       // its face turned to the path
  const steel = nbStd('#e8e4dc', 0.45, 0.35), frameM = nbStd('#c8324a', 0.5, 0.25), hubM = nbStd('#3a3f46', 0.4, 0.6);
  // the A-frames (front and back) from the ground to the hub
  for (const zz of [-1.6, 1.6]) for (const sx of [-1, 1]) { const m = nbMesh(new THREE.CylinderGeometry(1, 1, 1, 10), frameM, 0, 0, 0, base); nbStrut(m, [sx * 7.5, 0, zz * 1.8], [0, F.hub, zz * 0.9], 0.28); }
  for (const zz of [-1.6, 1.6]) { const m = nbMesh(new THREE.CylinderGeometry(1, 1, 1, 8), frameM, 0, 0, 0, base); nbStrut(m, [-5.2, 5.5, zz * 1.55], [5.2, 5.5, zz * 1.55], 0.14); }
  nbBox(18, 0.4, 5, nbStd('#5a5048', 0.85), 0, 0.2, 0, base);                                  // the platform
  const axle = nbCyl(0.55, 0.55, 3.0, hubM, 0, F.hub, 0, base, 16); axle.rotation.x = Math.PI / 2;
  // the rotating part
  const rot = new THREE.Group(); rot.position.set(0, F.hub, 0); base.add(rot);
  for (const zz of [-1.15, 1.15]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.13, 8, 96), steel); rim.position.z = zz; rim.castShadow = true; rot.add(rim);
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(R * 0.72, 0.08, 6, 72), steel); rim2.position.z = zz; rot.add(rim2);
    for (let k = 0; k < F.n; k++) { const a = k / F.n * Math.PI * 2, m = nbMesh(new THREE.CylinderGeometry(1, 1, 1, 6), steel, 0, 0, 0, rot); nbStrut(m, [0, 0, zz * 0.5], [R * Math.cos(a), R * Math.sin(a), zz], 0.07); }
  }
  for (let k = 0; k < F.n; k++) { const a = (k + 0.5) / F.n * Math.PI * 2, m = nbMesh(new THREE.CylinderGeometry(1, 1, 1, 6), steel, 0, 0, 0, rot); nbStrut(m, [R * Math.cos(a), R * Math.sin(a), -1.15], [R * Math.cos(a), R * Math.sin(a), 1.15], 0.06); }
  // the gondolas: hung from pins on the rim, always upright
  const cols = ['#d8263a', '#2a5aa8', '#e8b82a', '#2e7a4a', '#e86a2a', '#7a3aa8', '#2aa8b8', '#e8e0d0'];
  const gond = [];
  for (let k = 0; k < F.n; k++) {
    const g = new THREE.Group(); base.add(g);
    const cm = nbStd(cols[k % cols.length], 0.45, 0.15);
    nbMesh(nbRoundBox(1.7, 1.0, 1.5, 0.25, 0.05), cm, 0, -2.25, 0, g);                       // the tub
    nbBox(1.8, 0.08, 1.6, nbStd('#f0ece4', 0.5), 0, -0.55, 0, g);                             // the roof
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.68, 0.68]) nbBox(0.05, 1.05, 0.05, steel, sx, -0.9, sz, g);
    nbBox(0.12, 0.5, 0.12, steel, 0, -0.25, 0, g);
    gond.push(g);
  }
  // riders in a few gondolas (simple seated figures)
  const riders = [];
  for (const k of [1, 4, 6, 9, 12, 14]) { const p = nbPerson(['nbP1', 'nbP2', 'nbP3', 'nbP4', 'nbP5', 'nbP6'][k % 6], gond[k], { id: 'w' + k }); nbPose(p, NB_POSES.sit(), 0, -2.75 - 0.0, 0.1, k % 2 ? 0 : Math.PI); riders.push(p); }
  const toWorld = new THREE.Vector3();
  const O = {
    base, rot, gond,
    angle: (s) => -2 * Math.PI * (s + 40) / F.period,
    update(s) {
      const a = O.angle(s); rot.rotation.z = a;
      gond.forEach((g, k) => { const b = a + k / F.n * Math.PI * 2; g.position.set(R * Math.cos(b), F.hub + R * Math.sin(b), 0); g.rotation.z = 0.04 * Math.sin(s * 0.7 + k); });
    },
    // bulbs: along each spoke (front face), round both rims, a star at the hub; the colours chase round slowly
    lamps(L, s) {
      const a = O.angle(s), m = base.matrixWorld, ch = Math.floor(s * 2.5);
      base.updateMatrixWorld();
      const add = (x, y, z, size, c, k = 1) => { toWorld.set(x, F.hub + y, z).applyMatrix4(m); L.add(toWorld.x, toWorld.y, toWorld.z, size, c[0] * k, c[1] * k, c[2] * k); };
      for (let k = 0; k < F.n; k++) { const b = a + k / F.n * Math.PI * 2, c = NB_BULB[NB_BULB_SET[((k + ch) % 8 + 8) % 8]];
        for (let j = 2; j <= 11; j++) { const rr = R * j / 11.4; add(rr * Math.cos(b), rr * Math.sin(b), 1.3, 0.07, c); } }
      for (let k = 0; k < 96; k++) { const b = a + k / 96 * Math.PI * 2, c = k % 2 ? NB_BULB.warm : NB_BULB.white; add(R * Math.cos(b), R * Math.sin(b), 1.3, 0.06, c); add(R * Math.cos(b), R * Math.sin(b), -1.3, 0.06, c, 0.8); }
      for (let k = 0; k < 12; k++) { const b = a + k / 12 * Math.PI * 2; add(1.2 * Math.cos(b), 1.2 * Math.sin(b), 1.6, 0.09, NB_BULB.yellow); }
    },
  };
  return O;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE ROLLERCOASTER
// ---------------------------------------------------------------------------------------------------------------------
// the centreline (closed): the station (south-west corner) → the lift along the north side → the drop at the east end
// → round to the south → a hump and a climb back west → a helix down → the station
const NB_CO_PTS = [
  [18, 1.6, 22], [24, 1.6, 22], [30, 2.4, 22], [36, 6.0, 22], [42, 10.0, 22], [48, 14.2, 22], [53, 17.4, 22], [56.5, 18.0, 22.6],
  [59.5, 16.2, 24.2], [61.6, 11.5, 27.4], [62.4, 6.4, 31.5], [61.4, 3.0, 36.5], [58.0, 2.6, 41.0], [53.0, 4.8, 44.5], [47.0, 9.5, 46.8],
  [41.5, 11.0, 47.6], [36.0, 8.2, 48.2], [30.5, 4.6, 48.4], [25.0, 6.8, 47.0], [20.5, 9.6, 43.4], [18.6, 9.2, 38.6], [20.6, 7.6, 34.6],
  [25.0, 6.6, 33.4], [28.4, 5.4, 36.4], [27.6, 4.2, 40.8], [23.2, 3.4, 42.4], [18.4, 2.8, 39.4], [15.6, 2.2, 33.4], [15.2, 1.8, 27.0],
];
function nbBuildCoaster(S, W) {
  const scene = S.scene, curve = new THREE.CatmullRomCurve3(NB_CO_PTS.map((p) => new THREE.Vector3(...p)), true, 'centripetal', 0.5);
  const L = curve.getLength(), NS = 1400;
  // sample frames: position, tangent, a banked normal (lean into the turns), the side vector
  const fr = [];
  for (let i = 0; i <= NS; i++) {
    const u = i / NS, p = curve.getPointAt(u), t = curve.getTangentAt(u), t2 = curve.getTangentAt((u + 0.004) % 1);
    const turn = new THREE.Vector3().crossVectors(t, t2).y;                       // + = turning left
    const bank = MathX.clamp(turn * 40, -0.75, 0.75);
    const side0 = new THREE.Vector3(-t.z, 0, t.x).normalize(), up0 = new THREE.Vector3().crossVectors(side0, t).normalize();
    if (up0.y < 0) { side0.negate(); up0.negate(); }
    const up = up0.clone().applyAxisAngle(t, -bank), side = new THREE.Vector3().crossVectors(t, up).normalize();
    fr.push({ p, t, up, side, y: p.y });
  }
  const at = (d) => { const x = ((d % L) + L) % L / L * NS, i = Math.floor(x), f = x - i, a = fr[i], b = fr[Math.min(NS, i + 1)]; return { p: a.p.clone().lerp(b.p, f), t: a.t.clone().lerp(b.t, f).normalize(), up: a.up.clone().lerp(b.up, f).normalize(), side: a.side.clone().lerp(b.side, f).normalize(), y: a.y + (b.y - a.y) * f }; };
  // the train's run: the lift (from the station's end to the crest) at 2.6 m/s; after the crest v² = v_c² + 2g(y_c − y) − losses;
  // the brakes in the station hold it to 2 m/s. Integrated once (dt 0.01), one lap; then it repeats (no wait in the station)
  const dLiftA = L * 0.07, dCrest = (() => { let best = 0, by = -1; for (let i = 0; i <= NS; i++) if (fr[i].y > by) { by = fr[i].y; best = i; } return best / NS * L; })();
  const yC = at(dCrest).y, run = [[0, 0]]; let d = 0, tt = 0, v = 2.0;
  while (d < L && tt < 400) {
    const y = at(d).y;
    if (d >= dLiftA && d < dCrest) v = 2.6;
    else if (d >= dCrest) v = Math.max(1.6, Math.sqrt(Math.max(0, 2.6 * 2.6 + 2 * 9.81 * (yC - y) - 0.06 * 9.81 * (d - dCrest))));
    else v = 2.0;
    if (d > L - 22) v = Math.min(v, 2.0 + (L - d) * 0.5);
    d += v * 0.01; tt += 0.01; run.push([tt, Math.min(d, L)]);
  }
  const lap = tt;
  const distAt = (s) => { const T = ((s + O.phase) % lap + lap) % lap; let a = 0, b = run.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (run[m][0] < T) a = m; else b = m; } const r0 = run[a], r1 = run[b]; return r0[1] + (r1[1] - r0[1]) * (T - r0[0]) / Math.max(1e-6, r1[0] - r0[0]); };
  // ---- the track: two rails and a spine (tubes), ties, columns to the ground
  const railM = nbStd('#e8e8e2', 0.4, 0.5), spineM = nbStd('#d84a2a', 0.5, 0.3), colM = nbStd('#c8c2b6', 0.55, 0.4);
  const tube = (off, r, m) => { const pts = []; for (let i = 0; i <= NS; i += 2) { const f = fr[i]; pts.push(f.p.clone().addScaledVector(f.side, off[0]).addScaledVector(f.up, off[1])); }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), NS, r, 6, true); const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; scene.add(o); return o; };
  tube([-0.52, 0], 0.055, railM); tube([0.52, 0], 0.055, railM); tube([0, -0.42], 0.16, spineM);
  { const tieG = new THREE.BoxGeometry(1.14, 0.08, 0.12), n = Math.floor(L / 1.3), ties = new THREE.InstancedMesh(tieG, spineM, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), bx = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const f = at(i * 1.3); bx.makeBasis(f.side, f.up, f.t); q.setFromRotationMatrix(bx); m4.compose(f.p.clone().addScaledVector(f.up, -0.16), q, new THREE.Vector3(1, 1, 1)); ties.setMatrixAt(i, m4); }
    ties.castShadow = true; scene.add(ties); }
  for (let dd = 0; dd < L; dd += 5.5) { const f = at(dd); if (f.p.y < 1.4) continue; const m = nbMesh(new THREE.CylinderGeometry(1, 1, 1, 8), colM, 0, 0, 0); const top = f.p.clone().addScaledVector(f.up, -0.5); nbStrut(m, [top.x, 0, top.z], [top.x, top.y, top.z], 0.16); nbBox(0.6, 0.12, 0.6, colM, top.x, 0.06, top.z); }
  // the station: a roofed platform at the start
  { const g = new THREE.Group(); scene.add(g); nbBox(10, 1.1, 3.0, nbStd('#6a6058', 0.85), 21, 0.55, 19.6, g); nbBox(10.4, 0.15, 6.4, nbStd('#c8324a', 0.5), 21, 4.3, 21.6, g);
    for (const x of [16.4, 25.6]) for (const z of [18.6, 24.6]) nbCyl(0.1, 0.1, 4.2, colM, x, 2.1, z, g, 8);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), nbSign('THE TWISTER', { neon: true, color: '#3ad0ff', k: 2.4, w: 1024, h: 190, italic: true })); sg.position.set(21, 4.95, 18.35); sg.rotation.y = Math.PI; g.add(sg);
    nbBox(6.4, 1.3, 0.1, nbStd('#18161a', 0.6), 21, 4.95, 18.45, g); }
  // ---- the train: three cars; your friend in the front row of the front car
  const carM = [nbStd('#d8263a', 0.35, 0.3), nbStd('#e8b82a', 0.35, 0.3), nbStd('#2a5aa8', 0.35, 0.3)], seatM = nbStd('#1c1c20', 0.7), barM = nbStd('#c8c8c8', 0.35, 0.7);
  const cars = [], riders = [];
  const looks = [['nbFriend', 'nbP4'], ['nbP1', 'nbP6'], ['nbP3', 'nbP5']];
  for (let c = 0; c < 3; c++) {
    const g = new THREE.Group(); scene.add(g);
    nbMesh(nbRoundBox(1.5, 0.75, 2.3, 0.3, 0.06), carM[c], 0, 0.05, 0, g);
    nbBox(1.3, 0.5, 0.25, seatM, 0, 0.75, -0.45, g); nbBox(1.3, 0.5, 0.25, seatM, 0, 0.75, 0.55, g);
    if (c === 0) { const nose = nbMesh(new THREE.SphereGeometry(0.75, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), carM[0], 0, 0.42, 1.15, g); nose.rotation.x = Math.PI / 2; nose.scale.set(1, 0.6, 0.55); }
    for (const zz of [0.0, 1.0]) { const b = nbMesh(new THREE.TorusGeometry(0.42, 0.035, 6, 18, Math.PI), barM, 0, 0.92, zz - 0.15, g); b.rotation.y = 0; }
    // two riders side by side, front seat only (the back seat of each car is empty but for the first)
    const pr = []; for (let k = 0; k < 2; k++) { const p = nbPerson(looks[c][k], g, { id: 'co' + c + k }); nbPose(p, NB_POSES.ride(), (k ? 0.33 : -0.33), 0.18, 0.15, 0); pr.push(p); }
    riders.push(pr); cars.push(g);
  }
  const O = {
    curve, L, lap, at, cars, riders, phase: 0, distAt, dCrest,
    // the front car's position (d: distance along the track) at story time s
    frontD: (s) => distAt(s) + 2.6 * 2,
    update(s) {
      const d0 = O.frontD(s);
      cars.forEach((g, c) => { const f = at(d0 - c * 2.6); const bx = new THREE.Matrix4().makeBasis(f.side, f.up, f.t); g.position.copy(f.p).addScaledVector(f.up, 0.12); g.quaternion.setFromRotationMatrix(bx); });
      // the riders: arms up on the drops, holding the bar on the climbs; heads back with the fall
      const v = O.speed(s);
      riders.forEach((pr, c) => pr.forEach((p, k) => { const pose = NB_POSES.ride(); const up = MathX.smooth(v, 6, 12) * (c + k > 0 ? 1 : 0.6);
        pose.lSh = [MathX.lerp(1.0, 2.7, up), 0.25]; pose.rSh = [MathX.lerp(1.0, 2.6, up), 0.25]; pose.lEl = MathX.lerp(0.9, 0.2, up); pose.rEl = MathX.lerp(0.9, 0.2, up); pose.neck = -0.15 - 0.2 * up; pose.mouth = up;
        nbPose(p, pose, k ? 0.33 : -0.33, 0.18, 0.15, 0); }));
    },
    speed(s) { return Math.abs(distAt(s + 0.05) - distAt(s - 0.05)) / 0.1; },
    // LEDs along both rails (every metre, cyan and white), a headlight pair on the front car, the station's bulbs
    lamps(Lm, s) {
      for (let dd = 0, i = 0; dd < L; dd += 1.0, i++) { const f = fr[Math.floor(dd / L * NS)], c = i % 2 ? NB_BULB.cyan : NB_BULB.white;
        for (const sx of [-0.62, 0.62]) Lm.add(f.p.x + f.side.x * sx, f.p.y + f.side.y * sx + 0.05, f.p.z + f.side.z * sx, 0.035, c[0] * 0.8, c[1] * 0.8, c[2] * 0.8); }
      const fc = cars[0]; fc.updateMatrixWorld();
      for (const sx of [-0.45, 0.45]) { const p = new THREE.Vector3(sx, 0.45, 1.55).applyMatrix4(fc.matrixWorld); Lm.add(p.x, p.y, p.z, 0.06, 3.2, 3.0, 2.6); }
      for (let x = 16.4; x <= 25.6; x += 0.46) Lm.add(x, 4.2, 18.6, 0.04, ...NB_BULB.amber);
    },
  };
  // the phase: the train crests the lift at story −1.4 s (the drop under the title)
  { let best = 0; for (let T = 0; T < lap; T += 0.01) { const dd = run[Math.min(run.length - 1, Math.round(T * 100))][1]; if (Math.abs(dd + 5.2 - dCrest) < Math.abs(run[Math.min(run.length - 1, Math.round(best * 100))][1] + 5.2 - dCrest)) best = T; } O.phase = best + 1.4; }
  return O;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CAROUSEL
// ---------------------------------------------------------------------------------------------------------------------
function nbBuildCarousel(S, W) {
  const scene = S.scene, F = NB_F.carousel, R = F.R;
  const base = new THREE.Group(); base.position.set(F.c[0], 0, F.c[2]); scene.add(base);
  const rot = new THREE.Group(); base.add(rot);
  const gold = nbStd('#d8b04a', 0.3, 0.8), red = nbStd('#b8202e', 0.5, 0.1), cream = nbStd('#f2e8d0', 0.6);
  nbCyl(R, R + 0.1, 0.42, nbStd('#7a4a2a', 0.8), 0, 0.21, 0, rot, 48);
  nbBox(R * 2 + 0.6, 0.12, R * 2 + 0.6, nbStd('#4a4038', 0.9), 0, 0.06, 0, base);                     // (a square stage under it)
  nbCyl(1.5, 1.5, 4.2, nbStd('#c8ccd0', 0.12, 0.95), 0, 2.52, 0, rot, 12);                             // the mirrored centre
  nbCyl(1.62, 1.62, 0.3, red, 0, 0.57, 0, rot, 12); nbCyl(1.62, 1.62, 0.3, red, 0, 4.47, 0, rot, 12);
  // the canopy: a shallow cone, a scalloped valance
  const cone = nbMesh(new THREE.ConeGeometry(R + 0.6, 1.8, 24, 1, true), nbStd('#e8dcc0', 0.7), 0, 5.6, 0, rot); cone.material.side = THREE.DoubleSide;
  const val = nbMesh(new THREE.CylinderGeometry(R + 0.6, R + 0.6, 0.9, 48, 1, true), red, 0, 4.25, 0, rot); val.material.side = THREE.DoubleSide;
  nbMesh(new THREE.SphereGeometry(0.35, 12, 8), gold, 0, 6.65, 0, rot);
  // the horses: three rings, on brass poles, rising and falling
  const horses = [];
  const horseGeo = (() => { const body = nbLoft([[-0.65, 0, 0, 0.16, 0.2], [-0.3, 0.02, 0, 0.22, 0.26], [0.2, 0.03, 0, 0.22, 0.26], [0.55, 0.12, 0, 0.17, 0.2], [0.75, 0.42, 0, 0.11, 0.13], [0.85, 0.62, 0, 0.1, 0.12], [1.02, 0.6, 0, 0.08, 0.09]], 10, 0.8); return body; })();
  const legG = new THREE.CylinderGeometry(0.045, 0.035, 0.62, 6);
  const hc = ['#f4eee2', '#3a2a22', '#c8a070', '#f4eee2', '#8a5a3a', '#e8e0d4'].map((c) => nbStd(c, 0.45, 0.1)), saddle = nbStd('#2a5aa8', 0.5);
  for (const [rr, n] of [[R - 0.9, 14], [R - 2.3, 12], [R - 3.7, 10]]) for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2 + rr, g = new THREE.Group(); rot.add(g); g.position.set(rr * Math.cos(a), 0, rr * Math.sin(a)); g.rotation.y = -a;
    nbCyl(0.035, 0.035, 4.0, gold, 0, 2.4, 0, g, 6);
    const h = new THREE.Group(); g.add(h);
    nbMesh(horseGeo, hc[(k + Math.round(rr)) % hc.length], 0, 0, 0, h).rotation.y = 0;
    for (const [lx, lz, rx] of [[-0.45, 0.12, 0.5], [-0.45, -0.12, 0.2], [0.35, 0.12, -0.6], [0.35, -0.12, -0.3]]) { const l = nbMesh(legG, hc[(k + Math.round(rr)) % hc.length], lx, -0.32, lz, h); l.rotation.z = rx; }
    nbBox(0.36, 0.06, 0.42, saddle, -0.05, 0.27, 0, h);
    h.rotation.y = Math.PI / 2;
    horses.push({ h, ph: k * 1.3 + rr });
  }
  const O = {
    base, rot, horses,
    angle: (s) => 2 * Math.PI * (s + 3) / 21,
    update(s) { rot.rotation.y = O.angle(s); for (const x of horses) x.h.position.y = 1.15 + 0.32 * Math.sin(O.angle(s) * 3 + x.ph); },
    lamps(L, s) {
      const a = O.angle(s), cx = F.c[0], cz = F.c[2], ch = Math.floor(s * 3);
      for (let k = 0; k < 120; k++) { const b = a + k / 120 * Math.PI * 2, c = NB_BULB[(k + ch) % 3 === 0 ? 'white' : 'warm']; L.add(cx + (R + 0.62) * Math.cos(b), 3.82, cz - (R + 0.62) * Math.sin(b), 0.045, ...c); L.add(cx + (R + 0.62) * Math.cos(b), 4.68, cz - (R + 0.62) * Math.sin(b), 0.045, ...c); }
      for (let k = 0; k < 24; k++) { const b = a + k / 24 * Math.PI * 2; for (let j = 1; j <= 6; j++) { const rr = 1.7 + j * (R - 1.4) / 6.4; L.add(cx + rr * Math.cos(b), 6.5 - rr * 0.21, cz - rr * Math.sin(b), 0.04, ...NB_BULB.warm); } }
      for (let k = 0; k < 16; k++) { const b = a + k / 16 * Math.PI * 2; L.add(cx + 1.66 * Math.cos(b), 4.7, cz - 1.66 * Math.sin(b), 0.05, ...NB_BULB.yellow); L.add(cx + 1.66 * Math.cos(b), 0.8, cz - 1.66 * Math.sin(b), 0.05, ...NB_BULB.yellow); }
    },
  };
  return O;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE DODGEMS
// ---------------------------------------------------------------------------------------------------------------------
function nbBuildDodgems(S, W) {
  const scene = S.scene, F = NB_F.dodgems, hw = F.w / 2, hd = F.d / 2, H = 4.2;
  const g = new THREE.Group(); g.position.set(F.c[0], 0, F.c[2]); scene.add(g);
  nbBox(F.w, 0.3, F.d, nbStd('#5a5e62', 0.35, 0.7), 0, 0.15, 0, g);                                   // the steel floor
  nbBox(F.w + 0.4, 0.25, F.d + 0.4, nbStd('#2a2d33', 0.5, 0.5), 0, H + 0.12, 0, g);                    // the roof (its underside is the live mesh)
  nbBox(F.w + 0.6, 0.9, 0.12, nbStd('#e8b82a', 0.5), 0, H + 0.7, hd + 0.26, g);
  for (const x of [-hw, -hw / 3, hw / 3, hw]) for (const z of [-hd, hd]) nbCyl(0.12, 0.12, H, nbStd('#c8324a', 0.5, 0.3), x, H / 2, z, g, 10);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.8), nbSign('DODGEMS', { neon: true, color: '#ff8a2a', k: 2.4, w: 1024, h: 120 })); sg.position.set(0, H + 0.7, hd + 0.34); g.add(sg);
  const cols = ['#d8263a', '#2a5aa8', '#e8b82a', '#2e7a4a', '#e86a2a', '#7a3aa8', '#2aa8b8', '#d85aa8', '#e8e0d0', '#5a8a2a'];
  const cars = [];
  for (let k = 0; k < 10; k++) {
    const c = new THREE.Group(); g.add(c);
    nbMesh(nbRoundBox(1.3, 0.55, 2.0, 0.45, 0.08), nbStd(cols[k], 0.3, 0.3), 0, 0.3, 0, c);
    const bump = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.11, 6, 24), nbStd('#1a1a1a', 0.9)); bump.rotation.x = Math.PI / 2; bump.scale.set(0.85, 1.25, 1); bump.position.y = 0.42; c.add(bump);
    const pole = nbCyl(0.025, 0.025, H - 0.9, nbStd('#c8c8c8', 0.4, 0.6), 0, 0.85 + (H - 0.9) / 2, -0.75, c, 6);
    void pole;
    const p = nbPerson(['nbP1', 'nbP2', 'nbP5', 'nbP6', 'nbP3'][k % 5], c, { id: 'dg' + k }); nbPose(p, NB_POSES.drive(), 0, 0.05, 0.1, 0);
    cars.push(c);
  }
  // each car runs its own loop round the floor (seeded Lissajous paths; they bang into each other in the dark)
  const posAt = (k, s) => { const a = 0.21 + 0.05 * nbR(k, 3), b = 0.17 + 0.05 * nbR(k, 4), ph = 6.28 * nbR(k, 5); const dark = s > 0.6 && s < NBP.T ? 1 : 0;
    const x = (hw - 1.6) * Math.sin(a * s * 2.2 + ph), z = (hd - 1.6) * Math.sin(b * s * 2.2 + ph * 1.7); return [x * (1 - 0.3 * dark * nbR(k, 7)), z]; };
  const O = {
    g, cars,
    update(s) { cars.forEach((c, k) => { const p = posAt(k, s), q = posAt(k, s + 0.15); c.position.set(p[0], 0.3, p[1]); c.rotation.y = Math.atan2(q[0] - p[0], q[1] - p[1]); }); },
    lamps(L, s) {
      for (let x = -hw; x <= hw; x += 0.5) { L.add(F.c[0] + x, H + 0.3, F.c[2] + hd + 0.34, 0.04, ...NB_BULB_SET.map((n) => NB_BULB[n])[Math.round(x * 2 + 40) % 8]); L.add(F.c[0] + x, H - 0.05, F.c[2] - hd - 0.2, 0.04, ...NB_BULB.warm); }
      for (let z = -hd; z <= hd; z += 0.5) { L.add(F.c[0] - hw - 0.2, H - 0.05, F.c[2] + z, 0.04, ...NB_BULB.warm); L.add(F.c[0] + hw + 0.2, H - 0.05, F.c[2] + z, 0.04, ...NB_BULB.warm); }
      // the sparks where the poles touch the ceiling's mesh: blue-white, a few at a time, a little bigger in the dark
      cars.forEach((c, k) => { const fl = hash1(Math.floor(s * 18) * 31 + k * 7); if (fl < 0.45) return; c.updateMatrixWorld(); const p = new THREE.Vector3(0, H - 0.32, -0.75).applyMatrix4(c.matrixWorld); const e = (fl - 0.45) * 2.2;
        L.add(p.x, p.y, p.z, 0.06 + 0.1 * e, 3 + 6 * e, 3.6 + 6 * e, 5 + 8 * e); });
    },
  };
  return O;
}
