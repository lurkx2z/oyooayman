/* =====================================================================
   VALLEY — what you see from the hilltop's eastern edge (layout.js NB_F): the motorway along the valley floor, the
   market town on the far slope, the airport to the south-east and a plane on its final approach.
     nbBuildValley(S, W) → { traffic, cars, plane, lamps(L, s), update(s, cam), heroCar, drvEye(s), drvLook(s) }
   THE TRAFFIC is simulated once, at load (nbTrafficSim: a pure function of the seed), from story time −40 s to +40 s
   and sampled every 0.1 s: before 3:30 every car follows the one ahead (the intelligent driver model); from 3:30 each
   driver, blind, reacts after 0.7–1.7 s: most brake hard, some gently, a few just lift off; nobody can see the car
   ahead, so faster cars run into slower ones (equal masses: they share their speed); in the dark they drift across
   their lanes. At 3:30:10 everyone can see again and stops. After 40 s the jam stays where it is (the motorway is shut
   for hours; at 4:42 the emergency services' blue lights are there).
   Lights: every car's daytime running lights; the automatic headlights switch on in the dark (their sensors see
   night) — and light up nothing; brake lights; hazards.
   ===================================================================== */

const NB_MW = (() => {
  const M = NB_F.motorway, lanes = [];
  for (let i = 0; i < 3; i++) lanes.push({ x: M.x - 11.0 + i * 3.65, dir: -1, v0: [25.5, 29.5, 32.5][i] });   // northbound (heading −z): the west carriageway (UK: keep left), lane 1 westmost
  for (let i = 0; i < 3; i++) lanes.push({ x: M.x + 11.0 - i * 3.65, dir: 1, v0: [25.5, 29.5, 32.5][i] });    // southbound: the east carriageway
  return { lanes, y: M.y, u0: -4000, u1: 2700, S0: -40, S1: 40, DT: 0.02, SAMPLE: 0.1, vis: 2600 };
})();
const NB_CAR_TYPES = ['sedan', 'hatch', 'suv', 'hatch', 'sedan', 'van', 'suv', 'pickup', 'hatch', 'sedan'];
const NB_CAR_COLS = ['#d8d8d4', '#1c1e22', '#8a9096', '#2a3a5a', '#7a1e1e', '#e8e6e0', '#3a4a3a', '#5a5f66', '#c8b89a', '#2a5aa8', '#101012', '#9aa0a8'];

function nbTrafficSim() {
  const P = NB_MW, r = new RNG(611), cars = [];
  P.lanes.forEach((ln, li) => {
    for (let u = P.u0 + r.range(0, 40); u < P.u1; u += r.range(30, 78)) {
      const k = cars.length, type = NB_CAR_TYPES[r.int(0, NB_CAR_TYPES.length - 1)];
      cars.push({
        k, lane: li, u, v: ln.v0 * r.range(0.95, 1.04), v0: ln.v0 * r.range(0.95, 1.05), type, col: NB_CAR_COLS[r.int(0, NB_CAR_COLS.length - 1)],
        len: type === 'van' ? 5.3 : type === 'pickup' ? 5.5 : 4.5,
        react: r.range(0.7, 1.7), mode: r.next() < 0.52 ? 'hard' : r.next() < 0.7 ? 'soft' : 'coast',
        lit: r.next() < 0.35, auto: r.range(1.2, 3.2), haz: r.next() < 0.45 ? r.range(2.5, 7) : 99, latA: r.range(0.3, 1.15) * (r.next() < 0.5 ? -1 : 1),
        hit: 99, yaw: 0, yawK: r.range(0.5, 1.25) * (r.next() < 0.5 ? -1 : 1), stopS: 99,
      });
    }
  });
  // the car you ride in (lane 1, about 60 m north of the fence's line at 3:30:04), at 110 km/h: one car 70 m ahead at
  // the same speed (it brakes hard, blind), then a clear lane for half a kilometre, so nothing slows them before 3:30.
  // Its driver only lifts off (the speedometer stays near 110 km/h while the car ahead brakes blind)
  { const V0 = 30.6; let best = null, bd = 1e9; for (const c of cars) if (c.lane === 1) { const d = Math.abs(c.u + V0 * (4.4 - P.S0) - 60); if (d < bd) { bd = d; best = c; } }
    best.mode = 'coast'; best.react = 1.7; best.drv = true; best.v = best.v0 = V0;
    let lead = null, ld = 1e9; for (const c of cars) { const ah = c.u - best.u; if (c.lane === 1 && ah > 0 && Math.abs(ah - 70) < ld) { ld = Math.abs(ah - 70); lead = c; } }
    for (let i = cars.length - 1; i >= 0; i--) { const c = cars[i], ah = c.u - best.u; if (c.lane === 1 && c !== lead && ah > 0 && ah < 600) cars.splice(i, 1); }
    lead.u = best.u + 70; lead.v = lead.v0 = V0; lead.mode = 'hard'; lead.react = 1.0; }
  const n = Math.round((P.S1 - P.S0) / P.SAMPLE) + 1, every = Math.round(P.SAMPLE / P.DT);
  for (const c of cars) { c.U = new Float32Array(n); c.V = new Float32Array(n); }
  const byLane = P.lanes.map((_, li) => cars.filter((c) => c.lane === li).sort((a, b) => b.u - a.u));   // leader first
  const idm = (c, lead, v0) => { const a = 1.3, b = 2.2, s0 = 2.5, T = 1.3; const vv = c.v; if (!lead) return a * (1 - Math.pow(vv / v0, 4));
    const gap = Math.max(0.1, lead.u - lead.len - c.u), ss = s0 + vv * T + vv * (vv - lead.v) / (2 * Math.sqrt(a * b)); return a * (1 - Math.pow(vv / v0, 4) - (ss / gap) ** 2); };
  let step = 0;
  for (let s = P.S0; step < (n - 1) * every + 1; s += P.DT, step++) {
    if (step % every === 0) { const i = step / every; for (const c of cars) { c.U[i] = c.u; c.V[i] = c.v; } }
    for (const L of byLane) L.forEach((c, j) => {
      const lead = j ? L[j - 1] : null; let acc;
      if (s < c.react) acc = c.drv ? 0 : idm(c, lead, c.v0);                       // seeing (or not yet reacting; your driver holds 110)
      else if (s < NBP.T + 0.7) acc = c.mode === 'hard' ? -7.2 : c.mode === 'soft' ? -2.6 : -0.5;   // blind
      else acc = Math.min(-4.5, idm(c, lead, 0.1));                                // seeing again: stop
      if (s >= NBP.T + 0.7 && lead) acc = Math.max(-9, Math.min(acc, idm(c, lead, 0.1)));
      c.acc = acc;
    });
    for (const c of cars) { c.v = Math.max(0, c.v + c.acc * P.DT); c.u += c.v * P.DT; if (c.v < 0.05 && c.stopS > 90 && s > 0) c.stopS = s; }
    // collisions: nobody can see the car ahead; equal masses, the two share their speed
    for (const L of byLane) for (let j = 1; j < L.length; j++) { const a = L[j - 1], c = L[j];
      if (c.u > a.u - a.len - 0.15) { c.u = a.u - a.len - 0.15; if (c.v > a.v + 0.3) { const m = (c.v + a.v) / 2; c.v = m * 0.8; a.v = m * 0.9; if (c.hit > 90) c.hit = s; if (a.hit > 90) a.hit = s; } } }
  }
  return cars;
}

function nbBuildValley(S, W) {
  const scene = S.scene, P = NB_MW, out = {};
  // ---- the far land (beyond the main ground's edge: a low ring of hills on every horizon)
  {
    const g = new THREE.PlaneGeometry(26000, 26000, 70, 70); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + 700, z = p.getZ(i) + 300, r = Math.hypot((x - 700) / 1.25, (z - 300) / 1.1);
      const inner = -70 + (x > 470 ? Math.min(45, (x - 470) * 0.03) : 0) - 3.5;
      const hill = 40 + 70 * noise1(x * 0.0006 + z * 0.0004, 21) + 30 * noise1(x * 0.0019 - z * 0.0013, 22);
      p.setXYZ(i, x, nbLerp(inner, hill, MathX.smooth(r, 2600, 6500)), z);
      c.set(noise1(x * 0.002 + z * 0.003, 31) > 0 ? '#6f8a46' : '#7a8a52'); col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = W.M.grass.clone(); m.vertexColors = true; m.map = null;
    const far = new THREE.Mesh(g, m); far.receiveShadow = false; scene.add(far);
  }

  // ---- the motorway: two carriageways (markings in the texture), the central barrier, the verges
  {
    const M = NB_F.motorway, len = P.vis * 2 + 400;
    const tex = nbTex(nbCanvas(256, 1024, (g, w, h) => {
      g.fillStyle = '#3a3c3e'; g.fillRect(0, 0, w, h);
      const r = new RNG(3); for (let i = 0; i < 4000; i++) { const v = 48 + r.next() * 22; g.fillStyle = `rgba(${v},${v},${v + 2},0.5)`; g.fillRect(r.next() * w, r.next() * h, 2, 2); }
      const X = (m) => (m + 13) / 26 * w;   // metres across the road (−13 west … 13 east)
      g.fillStyle = '#e8e4d8';
      for (const e of [-12.9, -1.6, 1.6, 12.9]) g.fillRect(X(e) - 2, 0, 4, h);                        // edge lines
      for (const lx of [-9.15, -5.5, 5.5, 9.15]) for (let y = 0; y < h; y += 128) g.fillRect(X(lx) - 2, y, 4, 54);   // lane lines (dashes)
      g.fillStyle = '#5a5a58'; g.fillRect(X(-1.4), 0, X(1.4) - X(-1.4), h);                        // the central reservation
    }), { repeat: true }); tex.repeat.set(1, len / 60);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(26, len), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    road.rotation.x = -Math.PI / 2; road.position.set(M.x, M.y + 0.02, 0); road.receiveShadow = true; scene.add(road);
    const bar = nbStd('#a8aeb2', 0.45, 0.6);
    nbBox(0.12, 0.35, len, bar, M.x, M.y + 0.62, 0).castShadow = false;
    for (let z = -P.vis; z <= P.vis; z += 4) nbBox(0.1, 0.6, 0.1, bar, M.x, M.y + 0.32, z).castShadow = false;
    // a footbridge over it (near the hill: something for the eye to measure the road by)
    { const z = -330, y = M.y; nbBox(3.0, 0.6, 1, nbStd('#b8b2a8', 0.8), M.x, y + 6.6, z).scale.set(1, 1, 1);
      nbBox(42, 0.6, 3.0, nbStd('#b8b2a8', 0.8), M.x, y + 6.6, z); for (const x of [-14.5, 0, 14.5]) nbBox(1.2, 6.6, 1.6, nbStd('#a8a296', 0.85), M.x + x, y + 3.3, z);
      for (const sz of [-1.4, 1.4]) nbBox(42, 1.1, 0.08, nbStd('#6a7076', 0.5, 0.5), M.x, y + 7.45, z + sz); }
  }

  // ---- the traffic
  const cars = out.cars = nbTrafficSim();
  const iAt = (s) => MathX.clamp((s - P.S0) / P.SAMPLE, 0, (cars[0].U.length - 1) - 1e-6);
  const carU = (c, s) => { const x = iAt(s), i = Math.floor(x), f = x - i; return c.U[i] + (c.U[i + 1] - c.U[i]) * f; };
  const carV = (c, s) => { const x = iAt(s), i = Math.floor(x), f = x - i; return c.V[i] + (c.V[i + 1] - c.V[i]) * f; };
  // where a car is: its lane, the drift across it in the dark, a twist when it was hit
  const carPose = (c, s) => {
    const ln = P.lanes[c.lane], u = carU(c, s), sd = Math.min(s, NBP.T + 0.7);
    const lat = c.latA * noise1(sd * 0.21 + c.k * 1.7, 9) * nbEase(sd, c.react, c.react + 4.5) * 1.6;
    const yaw = c.hit < 90 ? c.yawK * nbEase(s, c.hit, c.hit + 0.6) : 0.02 * c.latA * Math.cos(sd * 0.21 + c.k);
    const push = c.hit < 90 ? 0.7 * c.yawK * nbEase(s, c.hit, c.hit + 0.8) : 0;   // (a shunt knocks it sideways as it spins)
    return { x: ln.x + (lat + push) * -ln.dir, z: ln.dir * u, yaw: (ln.dir < 0 ? Math.PI / 2 : -Math.PI / 2) + yaw, dir: ln.dir };
  };
  out.carPose = carPose; out.carV = carV;
  // the cars you see close up get full bodies; the rest are simple blocks (far below you)
  const VF = new VehicleFactory(), hero = [];
  cars.forEach((c) => { const z5 = P.lanes[c.lane].dir * carU(c, 5); c.hero = z5 > -420 && z5 < 260; });
  // the car you ride in (the driver's view): northbound, the middle lane, near z −60 at 3:30:04
  { const best = cars.find((c) => c.drv); out.drv = best; best.hero = false; }
  for (const c of cars) if (c.hero) { const v = VF.build(c.type, c.col); v.c = c; c.bodyL = v.L; scene.add(v.group); hero.push(v); }
  const blocks = cars.filter((c) => !c.hero && c !== out.drv);
  const bodyG = new THREE.BoxGeometry(4.4, 0.75, 1.8); bodyG.translate(0, 0.62, 0);
  const cabG = new THREE.BoxGeometry(2.3, 0.62, 1.6); cabG.translate(-0.2, 1.3, 0);
  const iBody = new THREE.InstancedMesh(bodyG, nbStd('#ffffff', 0.4, 0.3), blocks.length), iCab = new THREE.InstancedMesh(cabG, nbStd('#1a1d22', 0.25, 0.4), blocks.length);
  blocks.forEach((c, i) => iBody.setColorAt(i, new THREE.Color(c.col)));
  for (const m of [iBody, iCab]) { m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; scene.add(m); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  out.updateCars = (s) => {
    for (const v of hero) { const c = v.c, p = carPose(c, s); v.group.position.set(p.x, P.y + 0.02, p.z); v.group.rotation.y = p.yaw;
      const sp = carU(c, s) / v.r; for (const w of v.wheels) w.rotation.z = -sp; v.tail.emissiveIntensity = 0.0; }
    blocks.forEach((c, i) => { const p = carPose(c, s); e3.set(0, p.yaw, 0); q.setFromEuler(e3); v3.set(p.x, P.y + 0.02, p.z); m4.compose(v3, q, one); iBody.setMatrixAt(i, m4); iCab.setMatrixAt(i, m4); });
    iBody.instanceMatrix.needsUpdate = iCab.instanceMatrix.needsUpdate = true;
  };
  // their lights (points: a car 400 m away is still a pair of dots)
  out.carLamps = (Lm, s, near) => {
    const blink = (Math.floor(s * 2.8) % 2) === 0;
    for (const c of cars) {
      const p = carPose(c, s); if (Math.abs(p.z) > P.vis) continue;
      if (near && Math.hypot(p.x - near.x, p.z - near.z) > near.r) continue;
      const h = Math.max(c.len, c.bodyL || 0) / 2 + 0.06, fx = -Math.sin(p.yaw - Math.PI / 2) * 0 + Math.cos(p.yaw), fz = -Math.sin(p.yaw), sx = -fz, sz = fx;   // forward (the car's +x), side
      const y = P.y, v = carV(c, s), dark = s >= 0 && s < NBP.T;
      const head = c.lit || s > c.auto || s > 600;                                // the auto headlights see night at 3:30 (and dusk at 4:42)
      const braking = (s >= c.react && s < NBP.T + 0.7 && c.mode !== 'coast' && v > 0.2) || (s >= NBP.T + 0.7 && v > 0.2) || (s < c.react && c.acc < -1.5);
      const haz = (s > c.haz || (s > NBP.T && c.hit < 90) || (s > c.stopS + 1.5 && s < 600)) && blink;
      for (const side of [-1, 1]) {
        const ox = sx * side * 0.66, oz = sz * side * 0.66;
        // front: running light / headlight
        const fxp = p.x + fx * h + ox, fzp = p.z + fz * h + oz;
        // (a headlight is a bulb in a mirror: while nothing bounces it is a bare bulb, far dimmer)
        if (head) { if (dark) Lm.add(fxp, y + 0.68, fzp, 0.15, 2.4, 2.3, 2.1); else Lm.add(fxp, y + 0.68, fzp, 0.24, 4.6, 4.4, 4.0); } else Lm.add(fxp, y + 0.7, fzp, 0.11, 2.4, 2.4, 2.4);
        // rear: tail / brake
        const rxp = p.x - fx * h + ox * 1.02, rzp = p.z - fz * h + oz * 1.02;
        if (braking) Lm.add(rxp, y + 0.86, rzp, 0.2, 5.2, 0.4, 0.22); else if (head) Lm.add(rxp, y + 0.86, rzp, 0.13, 2.6, 0.22, 0.12);
        if (haz) { Lm.add(rxp, y + 0.74, rzp, 0.13, 4.4, 2.0, 0.25); Lm.add(fxp + fx * 0.02, y + 0.6, fzp + fz * 0.02, 0.11, 4.4, 2.0, 0.25); }
      }
      if (braking) Lm.add(p.x - fx * (h - 0.6), y + 1.32, p.z - fz * (h - 0.6), 0.06, 3.6, 0.3, 0.2);       // the high brake light
    }
    // the emergency services, later (the crash sites: blue lights)
    if (s > 300) { const sites = out.sites || (out.sites = cars.filter((c) => c.hit < 90 && Math.abs(P.lanes[c.lane].dir * carU(c, 40)) < 900).slice(0, 4).map((c) => carPose(c, 40)));
      sites.forEach((p, i) => { for (let j = 0; j < 2; j++) { const on = Math.sin(s * 9.5 + i + j * 3.1) > 0.2; if (on) Lm.add(p.x + 4 + j * 1.2, P.y + 2.0, p.z + 9 + i, 0.12, 0.6, 1.4, 5.0); } }); }
  };
  out.updateCars(-5);

  // ---- the car you ride in: its dashboard (the instruments light themselves), the wheel, the pillars
  {
    const c = out.drv, g = new THREE.Group(); scene.add(g); out.drvG = g;
    const dash = nbStd('#1c1d20', 0.8), trim = nbStd('#2a2c30', 0.7);
    nbBox(0.62, 0.22, 1.7, dash, 0.85, 0.92, 0, g);                                         // the dashboard (x forward, z right … left)
    nbBox(0.08, 0.95, 0.08, trim, 0.62, 1.42, 0.78, g).rotation.x = 0; nbBox(0.08, 0.95, 0.08, trim, 0.62, 1.42, -0.78, g);
    nbBox(1.6, 0.06, 1.5, trim, -0.1, 1.68, 0, g);                                          // the roof
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 8, 32), dash); wheel.position.set(0.48, 1.0, 0.37); wheel.rotation.y = Math.PI / 2; wheel.rotation.x = 0; wheel.rotation.z = 0.0; g.add(wheel);
    { const w2 = nbCyl(0.02, 0.02, 0.4, dash, 0.62, 0.92, 0.37, g, 8); w2.rotation.z = Math.PI / 2 - 0.4; }
    // the instrument cluster and the centre screen (canvas textures: sources)
    out.cluster = nbCanvasTex(512, 200, (gg, w, h, st) => {
      gg.fillStyle = '#000'; gg.fillRect(0, 0, w, h);
      const kmh = Math.round(st.v * 3.6), cx = w * 0.3, cy = h * 0.58, R = h * 0.42;
      gg.strokeStyle = '#d8e8ff'; gg.lineWidth = 3;
      for (let k = 0; k <= 12; k++) { const a = Math.PI * (0.8 + 1.4 * k / 12); gg.beginPath(); gg.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); gg.lineTo(cx + Math.cos(a) * R * 0.84, cy + Math.sin(a) * R * 0.84); gg.stroke(); }
      const a = Math.PI * (0.8 + 1.4 * Math.min(1, kmh / 240)); gg.strokeStyle = '#ff4a2a'; gg.lineWidth = 5; gg.beginPath(); gg.moveTo(cx, cy); gg.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9); gg.stroke();
      gg.fillStyle = '#ffffff'; gg.font = '700 64px Arial, sans-serif'; gg.textAlign = 'center'; gg.fillText(String(kmh), w * 0.68, h * 0.55);
      gg.font = '600 24px Arial, sans-serif'; gg.fillStyle = '#9ab8d8'; gg.fillText('km/h', w * 0.68, h * 0.75);
      if (st.head) { gg.fillStyle = '#3aff6a'; gg.font = '700 26px Arial'; gg.fillText('◐ AUTO', w * 0.9, h * 0.25); }
    });
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.133), new THREE.MeshBasicMaterial({ map: out.cluster.tex, color: new THREE.Color(1.3, 1.3, 1.3) }));
    cl.position.set(0.58, 1.06, 0.37); cl.rotation.y = -Math.PI / 2; cl.rotation.x = 0; g.add(cl);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.14), new THREE.MeshBasicMaterial({ map: nbTex(nbCanvas(256, 150, (gg, w, h) => {
      gg.fillStyle = '#0e1a14'; gg.fillRect(0, 0, w, h); gg.strokeStyle = '#d8d0b0'; gg.lineWidth = 9; gg.beginPath(); gg.moveTo(w * 0.5, h); gg.lineTo(w * 0.52, 0); gg.stroke();
      gg.strokeStyle = '#4a8aff'; gg.lineWidth = 5; gg.beginPath(); gg.moveTo(w * 0.5, h); gg.lineTo(w * 0.52, 0); gg.stroke(); gg.fillStyle = '#ffffff'; gg.beginPath(); gg.moveTo(w * 0.5, h * 0.6); gg.lineTo(w * 0.46, h * 0.75); gg.lineTo(w * 0.54, h * 0.75); gg.fill();
      gg.fillStyle = '#e8e8e8'; gg.font = '600 15px Arial'; gg.fillText('NEXT EXIT  3 km', 8, 20); }), { repeat: false }), color: new THREE.Color(0.9, 0.9, 0.9) }));
    scr.position.set(0.66, 1.03, -0.02); scr.rotation.y = -Math.PI / 2 - 0.12; g.add(scr); out.lcd = [scr];   // (an LCD: its backlight is bounced through a light guide: dark while nothing bounces)
    out.drvPose = (s) => { const p = carPose(c, s); g.position.set(p.x, P.y + 0.02, p.z); g.rotation.y = p.yaw; return p; };
    out.drvUpdate = (s) => { out.drvPose(s); for (const m of out.lcd) m.visible = NBP.bounce(s) > 0; out.cluster.update({ v: Math.round(carV(c, s) * 3.6) / 3.6, head: s > c.auto || c.lit }); };
    // the driver's eye (right-hand drive), and a point ahead along the road
    out.drvEye = (s) => { const p = carPose(c, s), fx = Math.cos(p.yaw), fz = -Math.sin(p.yaw), sx = -fz, sz = fx; return [p.x + fx * 0.05 + sx * 0.37, P.y + 1.22, p.z + fz * 0.05 + sz * 0.37]; };
    out.drvAt = (s, d = 60) => { const p = carPose(c, s), fx = Math.cos(p.yaw), fz = -Math.sin(p.yaw), sx = -fz, sz = fx; return [p.x + fx * d + sx * 0.37, P.y + 0.9, p.z + fz * d + sz * 0.37]; };
  }

  // ---- the town on the far slope: houses (lit windows are their own light), blocks of flats, the church
  {
    const T = NB_F.town, r = new RNG(808), H = [], B = [];
    const facade = (seed, lit, fl) => nbCanvas(256, 256, (g, w, h) => {
      g.fillStyle = lit ? '#000' : ['#9a6a52', '#b8a890', '#d8d0c0', '#8a5a48'][seed % 4]; g.fillRect(0, 0, w, h);
      const rr = new RNG(seed), nx = 4, ny = fl;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = 18 + i * (w - 36) / nx, y = 20 + j * (h - 30) / ny, ww = (w - 36) / nx - 22, hh = (h - 30) / ny - 26;
        const on = rr.next() < 0.3; g.fillStyle = lit ? (on ? ['#ffd890', '#ffe8c0', '#fff0d8', '#c8d8ff'][rr.int(0, 3)] : '#000') : '#2a3038'; g.fillRect(x, y, ww, hh); }
    });
    const mk = (seed, fl) => { const m = new THREE.MeshStandardMaterial({ map: nbTex(facade(seed, false, fl), { repeat: false }), emissiveMap: nbTex(facade(seed, true, fl), { repeat: false }), emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1.4, roughness: 0.85 }); return m; };
    const houseM = [mk(1, 2), mk(2, 2), mk(3, 2)], blockM = [mk(11, 6), mk(12, 7)];
    for (let i = 0; i < 900; i++) {
      const x = r.range(T.x[0], T.x[1]), z = r.range(T.z[0], T.z[1]); if (Math.abs(z - (-120)) < 14 || Math.abs(x - 900) < 12 || Math.abs(x - 1300) < 12) continue;   // (the main roads)
      if (noise1(x * 0.004 + z * 0.006, 41) < -0.25) continue;                                 // (parks and fields)
      const big = r.next() < 0.04, y = nbGroundY(x, z), ry = 0.15 + (r.next() < 0.5 ? 0 : Math.PI / 2);
      (big ? B : H).push({ x, y, z, w: big ? r.range(14, 22) : r.range(6, 9), d: big ? r.range(12, 16) : r.range(7, 10), h: big ? r.range(16, 26) : r.range(5, 6.5), ry, m: r.int(0, big ? 1 : 2) });
    }
    const inst = (list, mats, roof) => mats.forEach((mat, mi) => { const L = list.filter((b) => b.m === mi); if (!L.length) return;
      const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); const im = new THREE.InstancedMesh(g, mat, L.length);
      const rf = roof ? new THREE.InstancedMesh((() => { const c = new THREE.ConeGeometry(0.72, 1, 4, 1); c.rotateY(Math.PI / 4); c.translate(0, 0.5, 0); return c; })(), nbStd('#5a3a32', 0.85), L.length) : null;
      L.forEach((b, i) => { e3.set(0, b.ry, 0); q.setFromEuler(e3); m4.compose(v3.set(b.x, b.y - 1, b.z), q, new THREE.Vector3(b.w, b.h + 1, b.d)); im.setMatrixAt(i, m4);
        if (rf) { m4.compose(v3.set(b.x, b.y + b.h, b.z), q, new THREE.Vector3(b.w, 2.6, b.d)); rf.setMatrixAt(i, m4); } });
      for (const m of [im, rf]) if (m) { m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); } });
    inst(H, houseM, true); inst(B, blockM, false);
    out.houses = H;
    // the church: a tower, a spire, a lit clock face
    { const x = 980, z = -60, y = nbGroundY(x, z), st = nbStd('#b8ae98', 0.9);
      nbBox(24, 12, 10, st, x - 14, y + 6, z); nbBox(7, 22, 7, st, x, y + 11, z); const sp = nbMesh(new THREE.ConeGeometry(4.6, 18, 4), nbStd('#6a6a6e', 0.8), x, y + 31, z); sp.rotation.y = Math.PI / 4;
      const face = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), new THREE.MeshBasicMaterial({ map: nbTex(nbCanvas(128, 128, (g, w) => { g.fillStyle = '#fff4d8'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill(); g.strokeStyle = '#2a2018'; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 - 30, 64 + 22); g.moveTo(64, 64); g.lineTo(64 + 0, 64 - 44); g.stroke(); }), { repeat: false }), color: new THREE.Color(1.6, 1.5, 1.3) }));
      face.position.set(x - 3.53, y + 17, z); face.rotation.y = -Math.PI / 2; scene.add(face); }
    // the streets' lamps (off: their sensors wait for real dusk), the shops' signs and a few early Christmas lights
    out.townLamps = []; for (let i = 0; i < 160; i++) { const b = H[r.int(0, H.length - 1)]; if (!b) continue; const n = 8 + r.int(0, 10), c = NB_BULB_SET[r.int(0, 7)];
      for (let k = 0; k < n; k++) out.townLamps.push([b.x + (k / n - 0.5) * b.w * Math.cos(b.ry), b.y + b.h + 0.1, b.z - (k / n - 0.5) * b.w * Math.sin(b.ry), 0.06, NB_BULB[r.next() < 0.5 ? c : 'warm']]); }
    out.streets = []; for (let z = T.z[0]; z <= T.z[1]; z += 32) { out.streets.push([900, nbGroundY(900, z) + 8, z]); out.streets.push([1300, nbGroundY(1300, z) + 8, z]); }
    for (let x = T.x[0]; x <= T.x[1]; x += 32) out.streets.push([x, nbGroundY(x, -120) + 8, -120]);
  }

  // ---- the airport: the runway (east–west; planes land westward), its lights, the tower, the radar, the terminal
  const R = NB_F.runway, ry = R.y;
  {
    const len = R.x[1] - R.x[0], tex = nbTex(nbCanvas(2048, 64, (g, w, h) => {
      g.fillStyle = '#34363a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e6e0';
      for (let x = 60; x < w - 60; x += 36) g.fillRect(x, h / 2 - 1, 18, 2);                       // the centreline
      for (const x0 of [6, w - 36]) for (let k = 0; k < 8; k++) g.fillRect(x0, 6 + k * 7, 30, 4);  // the threshold bars
      g.fillRect(0, 2, w, 1.5); g.fillRect(0, h - 3.5, w, 1.5);
    }), { repeat: false });
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(len, 45), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })); rw.rotation.x = -Math.PI / 2; rw.position.set((R.x[0] + R.x[1]) / 2, ry + 0.05, R.z); rw.receiveShadow = true; scene.add(rw);
    const tw = new THREE.Mesh(new THREE.PlaneGeometry(len, 23), nbStd('#3e4044', 0.9)); tw.rotation.x = -Math.PI / 2; tw.position.set((R.x[0] + R.x[1]) / 2, ry + 0.05, R.z - 190); scene.add(tw);
    const ap = new THREE.Mesh(new THREE.PlaneGeometry(700, 160), nbStd('#4a4c50', 0.9)); ap.rotation.x = -Math.PI / 2; ap.position.set(1600, ry + 0.04, R.z - 300); scene.add(ap);
    nbBox(420, 18, 46, nbStd('#c8ccd0', 0.4, 0.3), 1600, ry + 9, R.z - 410);                        // the terminal
    const tg = nbStd('#d8d4cc', 0.6); nbCyl(4.0, 5.5, 38, tg, 2050, ry + 19, R.z - 390); nbCyl(9, 7, 6, nbStd('#26323d', 0.15, 0.5), 2050, ry + 41, R.z - 390, null, 12); nbCyl(9.6, 9.6, 1.2, tg, 2050, ry + 44.6, R.z - 390, null, 12);
    out.radar = new THREE.Group(); out.radar.position.set(2350, ry + 26, R.z - 330); scene.add(out.radar); nbCyl(0.8, 1.4, 26, tg, 2350, ry + 13, R.z - 330);
    nbBox(14, 4, 1.2, nbStd('#e8e8e4', 0.5), 0, 2.4, 0, out.radar);
    // the parked planes on the apron (blocks: far away)
    out.apronPlanes = []; for (let i = 0; i < 4; i++) { const g = nbBuildPlane(scene, 0.9); g.position.set(1450 + i * 80, ry + 0.1, R.z - 345); g.rotation.y = -Math.PI / 2; out.apronPlanes.push(g); }
  }
  // the plane on final approach (westward, a 3° glide path; it touches down at 3:30:34, after it's all over)
  out.plane = nbBuildPlane(scene, 1);
  // ---- its flight deck (in the plane's frame: the nose is −x, the captain sits on the left, +z). Everything in it is
  // black now except its screens: the glare shield, the window posts and the roof only hide the lights outside
  {
    const P = out.plane, blk = nbStd('#1a1c20', 0.6), E = [-16.3, 1.0, 0.55];
    out.deckEye = E;
    nbBox(0.4, 0.06, 2.5, blk, E[0] - 0.76, E[1] - 0.21, 0, P);                                         // the glare shield
    nbBox(0.08, 0.45, 2.5, blk, E[0] - 0.86, E[1] - 0.47, 0, P);                                         // the panel
    for (const z of [0, 1.12, -1.12]) nbBox(0.06, 0.75, z ? 0.12 : 0.07, blk, E[0] - 0.92, E[1] + 0.12, z, P);   // the window posts
    nbBox(1.3, 0.06, 2.6, blk, E[0] - 0.4, E[1] + 0.5, 0, P);                                           // the roof (the overhead panel)
    const scr = (draw, w, h, x, y, z, sw, sh, ry = Math.PI / 2, tilt = 0.12) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: nbTex(nbCanvas(w, h, draw), { repeat: false }), color: new THREE.Color(0.9, 0.9, 0.9) }));
      m.position.set(x, y, z); m.rotation.set(0, ry, 0); m.rotateX(-tilt); P.add(m); return m; };
    const pfd = (g, w, h) => { g.fillStyle = '#2d6fd8'; g.fillRect(0, 0, w, h * 0.55); g.fillStyle = '#7a4a22'; g.fillRect(0, h * 0.55, w, h); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h * 0.55); g.lineTo(w, h * 0.55); g.stroke();
      g.lineWidth = 2; for (const k of [-2, -1, 1, 2]) { g.beginPath(); g.moveTo(w * 0.4, h * 0.55 - k * 22); g.lineTo(w * 0.6, h * 0.55 - k * 22); g.stroke(); }
      g.fillStyle = '#ffd400'; g.fillRect(w * 0.3, h * 0.55 - 3, w * 0.14, 6); g.fillRect(w * 0.56, h * 0.55 - 3, w * 0.14, 6); g.fillRect(w / 2 - 4, h * 0.55 - 4, 8, 8);
      g.fillStyle = 'rgba(20,20,24,0.85)'; g.fillRect(0, 0, w * 0.17, h); g.fillRect(w * 0.83, 0, w * 0.17, h); g.fillStyle = '#fff'; g.font = '700 22px Arial'; g.fillText('136', 6, h * 0.55 + 8); g.fillText('350', w * 0.84, h * 0.55 + 8);
      g.fillStyle = '#ff40ff'; g.beginPath(); g.moveTo(w / 2, h - 18); g.lineTo(w / 2 + 9, h - 9); g.lineTo(w / 2, h); g.lineTo(w / 2 - 9, h - 9); g.fill(); g.beginPath(); g.moveTo(w * 0.79, h * 0.55 - 9); g.lineTo(w * 0.81, h * 0.55); g.lineTo(w * 0.79, h * 0.55 + 9); g.lineTo(w * 0.77, h * 0.55); g.fill(); };
    const nd = (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, h * 0.88, h * 0.7, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
      g.strokeStyle = '#ff40ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h * 0.88); g.lineTo(w / 2 + 6, h * 0.2); g.stroke(); g.fillStyle = '#3aff6a'; g.font = '700 18px Arial'; g.fillText('RW27', w / 2 + 12, h * 0.24); g.fillStyle = '#fff'; g.fillText('GS136  TAS138', 8, 22);
      g.fillStyle = '#ffd400'; g.beginPath(); g.moveTo(w / 2, h * 0.84); g.lineTo(w / 2 + 9, h * 0.94); g.lineTo(w / 2 - 9, h * 0.94); g.fill(); };
    const eic = (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 3; for (const cx of [w * 0.3, w * 0.7]) { g.beginPath(); g.arc(cx, h * 0.3, h * 0.17, Math.PI * 0.8, Math.PI * 2.2); g.stroke(); g.strokeStyle = '#3aff6a'; g.beginPath(); g.moveTo(cx, h * 0.3); g.lineTo(cx + h * 0.12, h * 0.22); g.stroke(); g.strokeStyle = '#fff'; }
      g.fillStyle = '#3aff6a'; g.font = '700 18px Arial'; g.fillText('N1  54.2   54.0', 12, h * 0.62); g.fillStyle = '#00e0ff'; g.fillText('FLAPS 30  GEAR DOWN', 12, h * 0.8); };
    const X = E[0] - 0.8, Y = E[1] - 0.47;
    // the five display units are LCDs (backlight spread by a light guide: by bouncing): dark while nothing bounces
    out.lcd.push(scr(pfd, 256, 256, X, Y, 0.72, 0.19, 0.19), scr(nd, 256, 256, X, Y, 0.48, 0.19, 0.19), scr(eic, 256, 320, X, Y - 0.02, 0, 0.17, 0.21), scr(nd, 256, 256, X, Y, -0.48, 0.19, 0.19), scr(pfd, 256, 256, X, Y, -0.72, 0.19, 0.19));
    // the autopilot panel along the glare shield's face: amber digits
    scr((g, w, h) => { g.fillStyle = '#060606'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffb02a'; g.font = '700 30px monospace'; g.fillText('136      270      V/S -700      2000', 24, h * 0.72); }, 1024, 48, E[0] - 0.555, E[1] - 0.21, 0, 0.9, 0.042, Math.PI / 2, 0);
  }
  // ---- the control tower's cab (40 m up): its consoles' screens, a controller (black against the lights outside), the
  // window posts
  {
    const c = [2050, ry + 38.0, R.z - 390], eye = [c[0] - 4.6, c[1] + 1.65, c[2] + 3.2], at = [eye[0] + 766, ry - 200, eye[2] + 643]; out.cab = { eye, at };   // (tilted down: the scope and the strips clear of the captions)
    const blk = nbStd('#1a1c20', 0.6), d = new THREE.Vector3(at[0] - eye[0], 0, at[2] - eye[2]).normalize(), rgt = new THREE.Vector3(-d.z, 0, d.x), yaw = Math.atan2(d.x, d.z);
    const P = (f, r, y) => [eye[0] + d.x * f + rgt.x * r, y, eye[2] + d.z * f + rgt.z * r];
    for (let a = 0; a < 12; a++) { const q = a / 12 * Math.PI * 2; nbBox(0.12, 5.6, 0.12, blk, c[0] + 8.7 * Math.cos(q), c[1] + 3, c[2] + 8.7 * Math.sin(q)); }
    { const p = P(1.25, 0, c[1] + 0.5); nbBox(4.2, 1.0, 0.9, blk, p[0], p[1], p[2], null, yaw); }                   // the desk
    out.cabScope = nbCanvasTex(384, 384, (g, w, h, st) => { g.fillStyle = '#020a04'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,255,120,0.45)'; g.lineWidth = 2;
      for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(w / 2, h / 2, k * w * 0.11, 0, 7); g.stroke(); }
      const a = st.a, grd = g.createConicGradient ? g.createConicGradient(a - 0.6, w / 2, h / 2) : null;
      if (grd) { grd.addColorStop(0, 'rgba(60,255,110,0)'); grd.addColorStop(0.095, 'rgba(60,255,110,0.35)'); grd.addColorStop(0.0955, 'rgba(60,255,110,0)'); grd.addColorStop(1, 'rgba(60,255,110,0)'); g.fillStyle = grd; g.beginPath(); g.arc(w / 2, h / 2, w * 0.45, 0, 7); g.fill(); }
      g.strokeStyle = '#7aff9a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a) * w * 0.45, h / 2 + Math.sin(a) * w * 0.45); g.stroke();
      g.fillStyle = '#9affb0'; g.fillRect(w * 0.78, h * 0.47, 8, 8); g.font = '700 18px Arial'; g.fillText('FLT271', w * 0.74, h * 0.44); g.fillText('002  136', w * 0.74, h * 0.56);
      g.fillStyle = '#ffd04a'; g.fillText('PRIMARY: NO RETURNS', 14, h - 16); });
    const sm = (tex, f, r, y, w, h) => { const p = P(f, r, y), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.95, 0.95, 0.95) })); m.position.set(...p); m.rotation.set(0, yaw + Math.PI, 0); m.rotateX(-0.45); scene.add(m); return m; };
    sm(out.cabScope.tex, 0.95, -0.62, c[1] + 1.26, 0.46, 0.46);
    sm(nbTex(nbCanvas(512, 256, (g, w, h) => { g.fillStyle = '#05080c'; g.fillRect(0, 0, w, h); g.font = '700 24px Arial'; ['FLT271  A320  27  LDG', 'FLT84P  A319  27  HOLD', 'FLT3GK  B738  STAND 14'].forEach((t, i) => { g.fillStyle = i ? '#cfd8e0' : '#ffd04a'; g.fillRect(10, 18 + i * 76, w - 20, 60); g.fillStyle = '#06080a'; g.fillText(t, 22, 56 + i * 76); }); }), { repeat: false }), 0.95, 0.42, c[1] + 1.16, 0.5, 0.25);
    // the controller, on the right of the desk, looking out (a dark shape) with a headset's tiny green light
    { const p = P(0.75, 0.95, c[1]); nbCyl(0.2, 0.24, 0.75, blk, p[0], c[1] + 0.95, p[2]); nbMesh(new THREE.SphereGeometry(0.12, 12, 10), blk, p[0], c[1] + 1.5, p[2]); out.cabLed = [p[0] - rgt.x * 0.13, c[1] + 1.52, p[2] - rgt.z * 0.13]; }
  }
  const PL = out.PL = { sTD: 24, v: 70, xTD: R.x[1] - 300, y: ry };
  out.planePos = (s) => { const d = Math.max(0, (PL.sTD - s) * PL.v); const x = PL.xTD + d; return [x, ry + 2.6 + Math.max(0, d * Math.tan(MathX.deg(3))), R.z]; };
  out.updatePlane = (s) => { const p = out.planePos(Math.min(s, PL.sTD)), g = out.plane; if (s > PL.sTD) { const dd = 70 * (s - PL.sTD) - 2.2 * (s - PL.sTD) ** 2; p[0] = PL.xTD - Math.max(0, Math.min(dd, 1500)); } g.position.set(p[0], p[1], p[2]); g.rotation.set(0, 0, s < PL.sTD ? -0.05 : 0); };
  out.planeLamps = (Lm, s, cp) => {
    const p = out.plane.position, x = p.x, y = p.y, z = p.z;
    // nav lights: red on the left wingtip (south when flying west), green on the right, white on the tail
    Lm.add(x + 1, y + 1.2, z + 17.0, 0.12, 4.0, 0.3, 0.2); Lm.add(x + 1, y + 1.2, z - 17.0, 0.12, 0.3, 4.0, 0.8); Lm.add(x + 19, y + 3.4, z, 0.09, 3.2, 3.2, 3.0);
    // the landing lights (forward, bright), the anti-collision beacon (red) and strobes (white, double flash)
    // (they shine forward: dim from the side or behind)
    { const dx = cp ? cp.x - x : -1, dy = cp ? cp.y - y : 0, dz = cp ? cp.z - z : 0, dl = Math.hypot(dx, dy, dz) || 1, fw = Math.max(0, -dx / dl), k = 0.04 + 0.96 * Math.pow(fw, 6);
      if (s < PL.sTD + 30) for (const sz of [-4.5, 4.5]) Lm.add(x - 4, y - 0.2, z + sz, 1.1, 30 * k, 30 * k, 28 * k); }
    const beacon = Math.max(0, Math.sin(s * 2 * Math.PI * 1.0)) ** 8; if (beacon > 0.05) { Lm.add(x - 2, y + 2.3, z, 0.16, 4 * beacon, 0.25 * beacon, 0.1 * beacon); Lm.add(x - 2, y - 1.9, z, 0.16, 4 * beacon, 0.25 * beacon, 0.1 * beacon); }
    const ph = ((s % 1.1) + 1.1) % 1.1, st = ph < 0.05 || (ph > 0.14 && ph < 0.19); if (st) { for (const sz of [-17, 17]) Lm.add(x + 1.2, y + 1.2, z + sz, 0.3, 9, 9, 9); Lm.add(x + 20, y + 4.2, z, 0.25, 9, 9, 9); }
    // the cabin: through each window, the lamps along its ceiling (and here and there a seat-back screen)
    for (let i = 0; i < 44; i++) { const wx = x - 11.5 + i * 0.53, wy = y + 0.45 - 0.026 * (i * 0.53 - 11.5) * 0.05; for (const sz of [-1, 1]) { Lm.add(wx, wy + 0.08, z + sz * 1.97, 0.07, 1.6, 1.45, 1.15); if (hash1(i * 3 + (sz > 0 ? 1 : 0)) < 0.3) Lm.add(wx + 0.1, wy - 0.12, z + sz * 1.96, 0.05, 0.7, 1.2, 2.0); } }
    // the cab's headset LED (the tower) and the plane's MCP lights
    if (out.cabLed) Lm.add(out.cabLed[0], out.cabLed[1], out.cabLed[2], 0.006, 0.4, 3.0, 0.6);
  };
  out.airportLamps = (Lm, s) => {
    const x0 = R.x[0], x1 = R.x[1], z = R.z, y = ry + 0.5;
    for (let x = x0; x <= x1; x += 30) { Lm.add(x, y, z - 23.5, 0.55, 6.4, 6.0, 5.3); Lm.add(x, y, z + 23.5, 0.55, 6.4, 6.0, 5.3); }        // the edges
    for (let x = x1 - 900; x <= x1; x += 30) for (const k of [-1, 1]) for (let j = 0; j < 3; j++) Lm.add(x, y - 0.4, z + k * (5 + j * 1.5), 0.13, 2.8, 2.8, 2.5);   // the touchdown zone's bars
    for (let x = x0 + 15; x <= x1; x += 15) Lm.add(x, y - 0.4, z, 0.3, 4.8, 4.8, 4.3);                                                  // the centreline
    for (let k = -22; k <= 22; k += 3) { Lm.add(x1 + 1, y, z + k, 0.2, 0.4, 3.6, 0.8); Lm.add(x0 - 1, y, z + k, 0.2, 3.6, 0.3, 0.2); }   // threshold green, end red
    // the approach lights: bars of five every 30 m out to 900 m, a crossbar at 300 m; the "rabbit" racing in, twice a second
    for (let d = 30; d <= 900; d += 30) { const ya = ry + 0.6 + d * 0.004; for (let k = -2; k <= 2; k++) Lm.add(x1 + d, ya, z + k * 1.0, 0.4, 6.0, 5.7, 4.9); if (d === 300) for (let k = -15; k <= 15; k += 1.5) Lm.add(x1 + d, ya, z + k, 0.15, 3.2, 3.0, 2.6); }
    const ra = ((s * 2) % 1 + 1) % 1, rd = 900 - ra * 870; Lm.add(x1 + rd, ry + 1.2 + rd * 0.004, z, 0.6, 9, 9, 9);
    // the PAPI (left of the runway, 300 m in): two red, two white: on the glide path
    for (let k = 0; k < 4; k++) Lm.add(x1 - 300, y, z + 32 + k * 9, 0.28, k < 2 ? 4.2 : 4.2, k < 2 ? 0.4 : 4.0, k < 2 ? 0.3 : 3.6);
    // the taxiway's blue edges, the terminal's windows and floodlights, the tower's cab, red lights on the masts
    for (let x = x0; x <= x1; x += 45) { Lm.add(x, y, z - 178, 0.12, 0.5, 0.9, 3.8); Lm.add(x, y, z - 202, 0.12, 0.5, 0.9, 3.8); }
    for (let x = 1400; x <= 1800; x += 50) Lm.add(x, ry + 24, z - 330, 0.6, 3.6, 3.2, 2.4);
    for (let x = 1395; x <= 1805; x += 6) Lm.add(x, ry + 7, z - 386.8, 0.35, 2.4, 2.2, 1.7);
    Lm.add(2050, ry + 46, z - 390, 0.3, 4.0, 0.3, 0.2); Lm.add(2350, ry + 31, z - 330, 0.3, 4.0, 0.3, 0.2);
  };
  out.townLampsAdd = (Lm, s, dusk) => {
    for (const b of out.townLamps) Lm.add(b[0], b[1], b[2], b[3], b[4][0], b[4][1], b[4][2]);
    if (dusk > 0.3) for (const p of out.streets) Lm.add(p[0], p[1], p[2], 0.35, 3.4, 1.9, 0.6);
  };
  out.update = (s) => { out.updateCars(s); out.updatePlane(s); out.radar.rotation.y = s * 2 * Math.PI / 4.0; out.drvUpdate(s); out.cabScope.update({ a: Math.round((s * 2 * Math.PI / 4.0) * 200) / 200 }); };
  return out;
}

// an airliner (≈ 37 m): fuselage, wings, tail, engines (lit materials: black while nothing bounces)
function nbBuildPlane(scene, k = 1) {
  const g = new THREE.Group(), white = nbStd('#eceef0', 0.4, 0.2), grey = nbStd('#9aa0a8', 0.45, 0.4), dark = nbStd('#2a3040', 0.5, 0.2);
  const f = nbMesh(new THREE.CylinderGeometry(1.95, 1.95, 30, 20), white, 0, 0, 0, g); f.rotation.z = Math.PI / 2;
  const nose = nbMesh(new THREE.SphereGeometry(1.95, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), white, -15, 0, 0, g); nose.rotation.z = Math.PI / 2; nose.scale.set(1, 2.0, 1);
  const tailc = nbMesh(new THREE.ConeGeometry(1.95, 8, 20), white, 19, 0.6, 0, g); tailc.rotation.z = -Math.PI / 2; tailc.scale.set(1, 1, 0.9);
  const wing = new THREE.Shape([new THREE.Vector2(-3.5, 0), new THREE.Vector2(3.0, 0), new THREE.Vector2(5.5, 17), new THREE.Vector2(3.6, 17)].map((v) => v));
  for (const sz of [-1, 1]) { const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.35, bevelEnabled: false }); const w = nbMesh(wg, grey, 0, -1.1, 0, g); w.rotation.x = sz * Math.PI / 2; w.scale.set(1, 1, 1);
    const e = nbMesh(new THREE.CylinderGeometry(1.0, 0.9, 4.2, 14), dark, -2.5, -2.0, sz * 5.6, g); e.rotation.z = Math.PI / 2;
    const tp = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(3.6, 0), new THREE.Vector2(4.6, 6.2), new THREE.Vector2(3.2, 6.2)]), { depth: 0.2, bevelEnabled: false }); const t = nbMesh(tp, grey, 16, 0.8, 0, g); t.rotation.x = sz * Math.PI / 2; }
  const fin = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(5.5, 0), new THREE.Vector2(8.5, 7.5), new THREE.Vector2(6.2, 7.5)]), { depth: 0.3, bevelEnabled: false });
  nbMesh(fin, nbStd('#1e3a7a', 0.45, 0.2), 14.5, 1.6, -0.15, g);
  g.scale.setScalar(k); scene.add(g); return g;
}
