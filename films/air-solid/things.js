/* =====================================================================
   THINGS — what falls up out of doors (physics.js SA_FLY: the flights, with the thinning air). Each starts where it is
   let go of (world.js works out where your hand or a passer-by's hand is at that moment: o.rel) and climbs from there:
     the apple from your window (3:01:30), the keys, the coffee and the phone in the street (3:02:11–15), the leaves
     (every one that lets go of a tree, all ten minutes long), the fountain's water, a carp, a kicked football, a scoop of
     ice cream, the coat thrown to the runner in the tree, the dog's stick.
   At 3:10 they all start to come back down. Pure: posed by update(s, o).
     saBuildThings(S, T) → X
   ===================================================================== */

// the rise of a light thing in sea-level air (terminal speed vt): exact for quadratic drag, height after τ seconds
const saRise = (tau, vt) => (tau <= 0 ? 0 : (vt * vt / SAP.g) * Math.log(Math.cosh(Math.min(40, SAP.g * tau / vt))) + (SAP.g * tau / vt > 40 ? vt * (tau - 40 * vt / SAP.g) : 0));
// a leaf's (or a drop's) height above where it let go, falling up until 3:10 and back down at vt after
function saLeafH(s, s0, vt) {
  if (s0 >= SAP.T) return -vt * Math.max(0, s - s0);                           // (let go after 3:10: it just falls)
  if (s < SAP.T) return saRise(s - s0, vt);
  const top = saRise(SAP.T - s0, vt), u = s - SAP.T, up = vt * vt / (2 * SAP.g);  // it coasts up a little, then falls at vt
  return u < 2 * vt / SAP.g ? top + up * (1 - (1 - u / (vt / SAP.g)) ** 2) : top + up - vt * (u - 2 * vt / SAP.g);
}

function saBuildApple(r = 0.04) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(r, 20, 14), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / r, k = 1 - 0.18 * Math.exp(-((y - 1) ** 2) / 0.05) - 0.12 * Math.exp(-((y + 1) ** 2) / 0.08); p.setXYZ(i, p.getX(i) * (1.04 + 0.04 * y) * k, p.getY(i) * 0.92, p.getZ(i) * (1.04 + 0.04 * y) * k); }
  geo.computeVertexNormals();
  const c = saCanvas(128, 64, (gg, w, h) => { const gr = gg.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#b0221a'); gr.addColorStop(0.5, '#d6402a'); gr.addColorStop(0.62, '#e8a03a'); gr.addColorStop(1, '#b0221a'); gg.fillStyle = gr; gg.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { gg.fillStyle = `rgba(255,220,120,${0.1 + 0.1 * hash1(i)})`; gg.fillRect(hash1(i * 3.1) * w, hash1(i * 7.3) * h, 1.2, 2.5); } });
  const mat = saStd('#ffffff', 0.35, 0, { map: saTex(c), envMapIntensity: 1.3 });
  saMesh(geo, mat, 0, 0, 0, g); g.userData.mat = mat;
  saCyl(0.003, 0.002, 0.025, saStd('#4a3420', 0.8), 0, r * 0.95, 0, g, 5);
  const lf = saMesh(new THREE.SphereGeometry(0.012, 8, 6).scale(1.6, 0.25, 0.8), saStd('#4f7a2a', 0.7), 0.012, r * 1.02, 0, g); lf.rotation.z = 0.5;
  return g;
}
function saBuildKeys() { const g = new THREE.Group(), st = saStd('#c9ccce', 0.25, 0.9), br = saStd('#c8a24a', 0.3, 0.85);
  saMesh(new THREE.TorusGeometry(0.016, 0.0025, 6, 18), st, 0, 0, 0, g);
  [[st, 0.4], [br, -0.2], [st, -0.8]].forEach(([m, a], k) => { const kg = new THREE.Group(); kg.rotation.z = a; g.add(kg); saBox(0.014, 0.055, 0.003, m, 0, -0.045, 0, kg); saCyl(0.012, 0.012, 0.004, m, 0, -0.016, 0, kg, 12).rotation.x = Math.PI / 2; void k; });
  saBox(0.03, 0.04, 0.01, saStd('#1a1a1c', 0.4), 0.02, -0.03, 0, g); return g; }
function saBuildCup() { const g = new THREE.Group(); saCyl(0.042, 0.032, 0.12, saStd('#f2efe8', 0.7), 0, 0, 0, g, 18); saCyl(0.044, 0.044, 0.012, saStd('#2a2c30', 0.5), 0, 0.064, 0, g, 18); saCyl(0.043, 0.036, 0.05, saStd('#9a6a3a', 0.8), 0, -0.005, 0, g, 18).scale.set(1.02, 1, 1.02); return g; }
function saBuildPhone() { const g = new THREE.Group(); saMesh(saRoundBox(0.072, 0.008, 0.15, 0.008, 0.002), saStd('#1b1d22', 0.3, 0.4), 0, -0.004, 0, g);
  const sc = saMesh(new THREE.PlaneGeometry(0.066, 0.142), new THREE.MeshBasicMaterial({ map: saTex(saCanvas(64, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a6ab8'); gr.addColorStop(1, '#8a5ab8'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(6, 20, w - 12, 10); c.fillRect(6, 40, w - 24, 10); c.fillRect(6, 60, w - 16, 10); }), { repeat: false }), toneMapped: false }), 0, 0.0045, 0, g); sc.rotation.x = -Math.PI / 2; return g; }
function saBuildBall() { const m = saStd('#ffffff', 0.5, 0, { map: saTex(saCanvas(128, 64, (g, w, h) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 6; i++) { const x = (i * 23 + 8) % w, y = i % 2 ? 18 : 44; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); } g.fill(); } }), { repeat: false }) });
  const g = new THREE.Group(); saMesh(new THREE.SphereGeometry(0.11, 18, 14), m, 0, 0, 0, g); return g; }
function saBuildScoop() { const g = new THREE.Group(); saMesh(new THREE.SphereGeometry(0.032, 14, 10).scale(1, 0.9, 1), saStd('#f0c8d0', 0.75), 0, 0, 0, g); saMesh(new THREE.TorusGeometry(0.03, 0.006, 6, 18).rotateX(Math.PI / 2), saStd('#ecc0c8', 0.75), 0, -0.012, 0, g); return g; }
function saBuildStick() { const g = new THREE.Group(); const m = saStd('#6a4a2e', 0.9); const a = saCyl(0.012, 0.015, 0.5, m, 0, 0, 0, g, 6); a.rotation.z = Math.PI / 2; const b = saCyl(0.007, 0.01, 0.14, m, 0.08, 0.04, 0, g, 5); b.rotation.z = 0.6; return g; }
// the coat: a cloth (a grid that flaps), its sleeves trailing
function saBuildCoat() {
  const geo = new THREE.PlaneGeometry(0.62, 0.8, 10, 12), m = saStd('#3a4a3a', 0.92, 0, { side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, m); mesh.castShadow = true; const g = new THREE.Group(); g.add(mesh);
  const sl = []; for (const sd of [-1, 1]) { const s = saCyl(0.06, 0.05, 0.55, m, sd * 0.36, 0.12, 0, g, 8); sl.push(s); }
  g.userData = { geo, base: Float32Array.from(geo.attributes.position.array), sl }; return g;
}

function saBuildThings(S, T) {
  const scene = S.scene, X = {};
  X.apple = saBuildApple(); scene.add(X.apple);
  X.keys = saBuildKeys(); X.cup = saBuildCup(); X.phone = saBuildPhone(); X.ball = saBuildBall(); X.scoop = saBuildScoop(); X.stick = saBuildStick(); X.coat = saBuildCoat(); X.fish = saBuildFish();
  for (const k of ['keys', 'cup', 'phone', 'ball', 'scoop', 'stick', 'coat', 'fish']) { scene.add(X[k]); X[k].visible = false; X[k].traverse((o) => { if (o.isMesh) o.castShadow = true; }); }
  X.coffee = Array.from({ length: 9 }, (_, i) => { const m = saMesh(new THREE.SphereGeometry(0.012 + 0.012 * saR(i, 3), 10, 8), saStd('#5a3418', 0.08, 0.1, { envMapIntensity: 1.6 }), 0, 0, 0, scene); m.visible = false; return m; });
  // ---- the leaves: each tree lets its leaves go at its own rate (the plane tree by the path most); one instanced mesh
  { const trees = [];
    const P = SA_ST.plane; for (const [x, y, z, r] of T.planeCrown) trees.push({ x: P.x + x, y, z: P.z + z, r, rate: 2.4 });
    for (const t of T.trees) trees.push({ x: t.x, y: t.h * 0.5 / 3 * 3 + t.cr * 0.8, z: t.z, r: t.cr * 0.9, rate: 0.75 });
    const L = [], rr = new RNG(907);
    trees.forEach((tr, k) => { for (let s0 = rr.range(0, 1 / tr.rate); s0 < 640; s0 += rr.range(0.3, 1.7) / tr.rate) {
      const a = rr.range(0, 6.283), e = rr.range(-0.2, 1.0), q = Math.sqrt(1 - e * e);
      L.push({ s0, x: tr.x + Math.cos(a) * q * tr.r, y: tr.y + e * tr.r * 0.9, z: tr.z + Math.sin(a) * q * tr.r, ph: rr.range(0, 6.283), w: rr.range(1.5, 3.5), vt: rr.range(1.0, 1.6), c: rr.int(0, 3), ax: rr.range(-1, 1), k }); } });
    const geo = new THREE.PlaneGeometry(0.17, 0.12); geo.translate(0, 0, 0);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75, side: THREE.DoubleSide }), L.length); im.frustumCulled = false; im.castShadow = false;
    const cols = ['#d9a63a', '#c8742c', '#b8862e', '#a8502a'].map((c) => new THREE.Color(c)); L.forEach((l, i) => im.setColorAt(i, cols[l.c])); scene.add(im);
    X.leaves = { L, im }; }
  // ---- the fountain's column far up: a tapering tube of spray (rebuilt each frame to its height), fading out at the top
  { const alpha = saTex(saCanvas(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.75, '#9a9a9a'); gr.addColorStop(1, '#000000'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), { repeat: false, srgb: false });
    const m = new THREE.MeshBasicMaterial({ color: '#eef6ff', transparent: true, opacity: 0.5, alphaMap: alpha, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m); mesh.frustumCulled = false; mesh.renderOrder = 4; scene.add(mesh); X.column = mesh; X.columnKey = null; }
  X.update = (s, o) => saThingsUpdate(X, s, o || {});
  return X;
}

// the fountain's water: where a drop that left the nozzle at s0 is at story time s (above the nozzle, m)
function saWaterH(s0, s) {
  const W = SA_STREAM.water, h0 = 1.8;
  if (s0 >= SAP.T) { const u = s - s0; return 6 * u - 4.905 * u * u; }        // after 3:10: an ordinary fountain
  if (s <= SAP.T) return W(s0, s) - h0;
  const top = W(s0, SAP.T) - h0, u = s - SAP.T;                                 // after 3:10 it coasts up (~3 m) and falls at 8 m/s
  return u < 1.6 ? top + 8 * u - 2.5 * u * u : top + 6.4 - 8 * (u - 1.6);
}

function saThingsUpdate(X, s, o) {
  const rel = o.rel || {}, out = o.drops, m = o.mode || '', cam = o.cam;
  const put = (obj, p, rot) => { obj.visible = true; obj.position.set(p[0], p[1], p[2]); if (rot) obj.rotation.set(rot[0], rot[1], rot[2]); };
  // ---- the apple (from your window): straight up from where your hand let it go
  { const A = X.apple, F = SA_FLY.apple;
    if (rel.apple && s >= F.s0 && (m === 'apple' || m === 'appleUp')) { const y = rel.apple[1] + F(s) - F.s0 * 0 - F(F.s0); const tau = s - F.s0; put(A, [rel.apple[0] + 0.02 * tau, y, rel.apple[2] - 0.01 * tau], [0.7 * tau, 0.4 * tau, 0.2 * tau]);
      if (out && cam) { const d = cam.position.distanceTo(A.position); if (d > 6) out.push([A.position.x, A.position.y, A.position.z, Math.min(2, 0.0035 * d), Math.min(1, (d - 6) / 6), 1.0, 0.35, 0.28]); } }
    else A.visible = false; }
  // ---- in the street: keys, coffee, the phone (from the people's hands: o.rel), tumbling
  const fly = (obj, key, F, spin, vis) => { const r = rel[key]; if (!r || s < F.s0 || !vis) { obj.visible = false; return null; } const tau = s - F.s0, y = r[1] + F(s) - F(F.s0); put(obj, [r[0], y, r[2]], [spin[0] * tau, spin[1] * tau, spin[2] * tau]); return obj; };
  const street = m === 'street';
  fly(X.keys, 'keys', SA_FLY.keys, [5, 3, 7], street); fly(X.phone, 'phone', SA_FLY.phone, [2.5, 1.2, 4], street); fly(X.cup, 'cup', SA_FLY.cup, [1.5, 0.6, 2.2], street);
  X.coffee.forEach((b, i) => { const r = rel.cup, F = SA_FLY.coffee; if (!r || s < F.s0 || !street) { b.visible = false; return; } const tau = s - F.s0, sp = 0.06 * tau;
    put(b, [r[0] + sp * Math.cos(i * 2.3) + 0.02 * Math.sin(tau * 6 + i), r[1] + 0.05 + F(s) - F(F.s0) + 0.05 * Math.sin(i * 1.7) * Math.min(1, tau * 3), r[2] + sp * Math.sin(i * 2.3)]); b.scale.set(1 + 0.3 * Math.sin(tau * 9 + i), 1 - 0.2 * Math.sin(tau * 9 + i), 1); });
  // ---- the football: kicked at 3:03:40 from the lawn
  { const F = SA_FLY.ball, B = X.ball, b0 = SA_SPOT.ball;
    if (m === 'ball') { if (s < F.s0) put(B, [b0[0], 0.11, b0[1]], [0, 0, 0]); else { const tau = s - F.s0, hd = 4 * 2.5 * (1 - Math.exp(-tau / 2.5)); put(B, [b0[0] + hd * SA_SPOT.ballDir[0], 0.11 + F(s) - F(F.s0), b0[1] + hd * SA_SPOT.ballDir[1]], [-6 * tau, 0, 1.5 * tau]); } }
    else B.visible = false; }
  // ---- the scoop of ice cream, the stick, the coat
  fly(X.scoop, 'scoop', SA_FLY.scoop, [0.8, 0.5, 0.3], m === 'scoop');
  { const S = X.stick, F = SA_FLY.stick, r = rel.stick; if (r && s >= F.s0 && m === 'dog') { const tau = s - F.s0, hd = 2.0 * 1.5 * (1 - Math.exp(-tau / 1.5)); put(S, [r[0] + hd * SA_SPOT.dogDir[0], r[1] + F(s) - F(F.s0), r[2] + hd * SA_SPOT.dogDir[1]], [0.3 * tau, 2.5 * tau, 4 * tau]); } else S.visible = false; }
  { const Cc = X.coat, F = SA_FLY.coat, r = rel.coat;
    if (r && s >= F.s0 && (m === 'rope' || m === 'pigeons' || m === 'hold2' || m === 'count')) { const tau = s - F.s0, hd = 1.6 * 0.9 * (1 - Math.exp(-tau / 0.9)), D = SA_SPOT.coatDir;
      put(Cc, [r[0] + hd * D[0], r[1] + F(s) - F(F.s0), r[2] + hd * D[1]], [0.4 * Math.sin(tau * 1.3), 0.9 * tau, 0.3 + 0.5 * Math.sin(tau * 0.8)]);
      const U = Cc.userData, P = U.geo.attributes.position, open = Math.min(1, tau / 0.6);
      for (let i = 0; i < P.count; i++) { const x = U.base[i * 3], y = U.base[i * 3 + 1]; P.setXYZ(i, x * (0.4 + 0.6 * open), y, (0.1 * Math.sin(x * 9 + tau * 11) + 0.08 * Math.sin(y * 7 + tau * 8)) * (0.3 + open) - 0.15 * (1 - open) * Math.cos(x * 5)); }
      P.needsUpdate = true; U.geo.computeVertexNormals(); U.sl.forEach((sl, k) => { sl.rotation.set(0.6 * Math.sin(tau * 7 + k), 0, (k ? 1 : -1) * (0.4 + 0.5 * open)); }); }
    else Cc.visible = false; }
  // ---- the carp: out of the pond at 3:03:31, nose up, tail beating, and up
  { const F = SA_FLY.fish, Fh = X.fish, p0 = SA_SPOT.fish;
    if (m === 'fish' && s >= F.s0 - 0.01) { const tau = s - F.s0, y = F(s), hd = 0.9 * (1 - Math.exp(-tau / 0.5)), pitch = -Math.PI / 2 * Math.min(1, 0.35 + tau * 1.2) + 0.25 * Math.sin(tau * 3);
      put(Fh, [p0[0] + hd * 0.6, y, p0[1] - hd * 0.8], null); Fh.rotation.set(pitch, 0.5 + 0.4 * tau, 0.15 * Math.sin(tau * 5)); Fh.userData.tail.rotation.y = 0.6 * Math.sin(tau * 18);
      // spray: water lifted off the surface by the jump falls up behind it
      if (out) for (let i = 0; i < 90; i++) { const d0 = saR(i, 71) * 0.25, u = tau - d0; if (u < 0) continue; const a = saR(i, 72) * 6.283, r = 0.1 + 0.5 * saR(i, 73) * Math.min(1, u * 2);
        out.push([p0[0] + Math.cos(a) * r, -0.03 + saRise(u, 4 + 3 * saR(i, 74)) + 1.2 * u * saR(i, 75), p0[1] + Math.sin(a) * r, 0.01 + 0.02 * saR(i, 76), 0.75 * Math.exp(-u / 3), 0.85, 0.92, 0.97]); } }
    else Fh.visible = false; }
  // ---- the leaves
  { const { L, im } = X.leaves, M4 = _fuTM, q = _fuTQ, v = _fuTV, e = _fuTE, sc = _fuTS, zero = _fuT0, park = m && 'leaves fountain fish ball scoop walk jogger hold rope dog pigeons warn hold2 count down question window appleUp street'.includes(m);
    im.visible = !!park;
    if (park && X._leafS !== s) { X._leafS = s;
      for (let i = 0; i < L.length; i++) { const l = L[i], tau = s - l.s0;
        if (tau < 0) { im.setMatrixAt(i, M4.makeScale(0, 0, 0)); continue; }
        const h = saLeafH(s, l.s0, l.vt), y = l.y + h;
        if (y < 0.02) { im.setMatrixAt(i, M4.makeScale(0, 0, 0)); continue; }
        const fl = Math.min(1, tau * 0.8), wx = 0.22 * Math.min(tau, 400), x = l.x + wx + fl * 0.35 * Math.sin(tau * l.w * 0.5 + l.ph), z = l.z + fl * 0.3 * Math.cos(tau * l.w * 0.43 + l.ph);
        e.set(l.ph + tau * l.w * 0.7, l.ax * tau * 2.1, tau * l.w * 0.9); q.setFromEuler(e); v.set(x, y, z);
        im.setMatrixAt(i, M4.compose(v, q, sc)); }
      im.instanceMatrix.needsUpdate = true; } }
  // ---- the fountain: the near drops (o.drops), the column far up
  { const Fn = SA_ST.fountain, nz = [Fn.x, Fn.h + 0.16, Fn.z], col = X.column;
    const parkView = m && ['window', 'fountain', 'fish', 'ball', 'walk', 'leaves', 'jogger', 'hold', 'rope', 'dog', 'pigeons', 'warn', 'count', 'down', 'question'].includes(m);
    col.visible = !!parkView && s > 0;
    if (col.visible) {
      // the column: from the bottom (the nozzle; after 3:10, the pond, as it all comes back) to the top
      const top = Math.max(0.5, saWaterH(0, s)), bot = s < SAP.T ? 0.5 : Math.max(0, Math.min(top - 1, saWaterH(Math.min(599.9, SAP.T - 0.1), s) + 0.0));
      const key = Math.round(top * 2) + '|' + Math.round(bot * 4);
      if (X.columnKey !== key) { X.columnKey = key;
        const pts = [], n = 40; for (let i = 0; i <= n; i++) { const u = i / n, h = bot + (top - bot) * u ** 1.6; pts.push(new THREE.Vector2(0.06 + 0.0024 * h + 0.012 * Math.sin(h * 0.7), h)); }
        col.geometry.dispose(); col.geometry = new THREE.LatheGeometry(pts, 14); }
      col.position.set(nz[0], nz[1], nz[2]); col.material.opacity = s < SAP.T ? 0.42 : 0.5;
      if (out) {
        // drops near the bottom: one stream from the nozzle; each drop left it at s0 = s − k·dτ
        const dT = 0.03;
        for (let k = 0; k < 420; k++) { const s0 = s - k * dT; if (s0 < 0) break; const h = saWaterH(s0, s); if (h < -0.2) continue; if (h > 90) break;
          const sp = 0.015 + 0.012 * Math.min(40, s - s0), a = saR(k + Math.floor(s0 / dT), 81) * 6.283, r = sp * Math.sqrt(saR(k + Math.floor(s0 / dT), 82));
          out.push([nz[0] + Math.cos(a) * r, nz[1] + h, nz[2] + Math.sin(a) * r, 0.025 + 0.004 * Math.min(30, s - s0), 0.55, 0.9, 0.95, 1.0]); }
        // after 3:10: the water from up there pouring back into the pond, and the ordinary fountain again
        if (s > SAP.T) { const u = s - SAP.T;
          for (let k = 0; k < 360; k++) { const a = saR(k, 91) * 6.283, r = 0.3 + 2.4 * Math.sqrt(saR(k, 92)), h = (saR(k, 93) * 40 - (u * 8) % 40 + 40) % 40;
            if (bot > h) continue; out.push([nz[0] + Math.cos(a) * r, h, nz[2] + Math.sin(a) * r, 0.03, 0.5, 0.88, 0.94, 1.0]); }
          for (let k = 0; k < 80; k++) { const s0 = SAP.T + ((s - SAP.T) % 2) - k * 0.025; if (s0 < SAP.T) continue; const uu = s - s0 - Math.floor((s - SAP.T) / 2) * 0; const h = 6 * uu - 4.905 * uu * uu; if (h < -0.5) continue; const a = saR(k, 95) * 6.283;
            out.push([nz[0] + Math.cos(a) * 0.6 * uu, nz[1] + h, nz[2] + Math.sin(a) * 0.6 * uu, 0.03, 0.6, 0.9, 0.95, 1.0]); } }
      }
    }
  }
}
const _fuTM = new THREE.Matrix4(), _fuTQ = new THREE.Quaternion(), _fuTV = new THREE.Vector3(), _fuTE = new THREE.Euler(), _fuTS = new THREE.Vector3(1, 1, 1), _fuT0 = new THREE.Vector3(0, 0, 0);

// where things happen in the park (world x, z)
const SA_SPOT = {
  ball: [-28.0, -46.0], ballDir: [0.15, -0.99],          // the kick (towards the south)
  fish: [4.0, -46.3],                                      // the carp breaks the surface near the north bank
  dogDir: [0.3, -0.95], coatDir: [-0.55, -0.6],
};
