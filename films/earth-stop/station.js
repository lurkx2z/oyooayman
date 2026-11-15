/* =====================================================================
   STATION — everything LOOSE that isn't a vehicle (layout.js): the station building and its clock tower, the two
   platform canopies, the footbridge, the benches, lamps, signs and luggage, the people, the pigeons, the town's
   buildings, the palms' tops, the signal box, the water tower, the depot's shed, the quay's crane. From 5:42:00 to
   5:42:01 all of it keeps going east at 465 m/s (the group `root` is at ESP.X(s)); each thing's own fate (sliding,
   tripping forward, falling off the platform's end, reaching the rock) is a pure function of story time s.
     esBuildStation(S) → { root, people, woman, emit, update(s, t) }
   ===================================================================== */

// one bay of a plastered wall with a shuttered window (3.2 m × 3.2 m)
function esFacadeCanvas(seed, base, o = {}) {
  const r = new RNG(seed), w = 256, h = 256;
  return esCanvas(w, h, (g) => {
    g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},${r.range(0.02, 0.07)})`; g.fillRect(r.range(0, w), r.range(0, h), r.range(2, 9), r.range(2, 5)); }
    const gr = g.createLinearGradient(0, h * 0.8, 0, h); gr.addColorStop(0, 'rgba(60,40,24,0)'); gr.addColorStop(1, 'rgba(60,40,24,0.28)'); g.fillStyle = gr; g.fillRect(0, h * 0.8, w, h * 0.2);
    // the window: a frame, shutters, dark glass
    const x0 = 78, x1 = 178, y0 = o.arch ? 60 : 64, y1 = 190;
    g.fillStyle = o.trim || '#e9e2d0'; g.fillRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 18);
    if (o.arch) { g.beginPath(); g.arc((x0 + x1) / 2, y0, (x1 - x0) / 2 + 8, Math.PI, 0); g.fill(); }
    g.fillStyle = '#1c2630'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (o.arch) { g.beginPath(); g.arc((x0 + x1) / 2, y0, (x1 - x0) / 2, Math.PI, 0); g.fill(); }
    g.fillStyle = 'rgba(255,190,110,0.22)'; g.fillRect(x0, y0, (x1 - x0) * 0.45, y1 - y0);
    g.fillStyle = o.trim || '#e9e2d0'; g.fillRect((x0 + x1) / 2 - 2, y0 - (o.arch ? 50 : 0), 4, y1 - y0 + (o.arch ? 50 : 0)); g.fillRect(x0, (y0 + y1) / 2 - 2, x1 - x0, 4);
    if (o.shutter) { g.fillStyle = o.shutter; g.fillRect(x0 - 34, y0, 26, y1 - y0); g.fillRect(x1 + 8, y0, 26, y1 - y0); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = y0 + 6; y < y1; y += 9) { g.fillRect(x0 - 34, y, 26, 2); g.fillRect(x1 + 8, y, 26, 2); } }
    if (o.band) { g.fillStyle = o.band; g.fillRect(0, 0, w, 14); }
  });
}
// a box whose side faces repeat a facade bay (bay m wide, floor m high); materials [side, top]
function esBayBox(w, h, d, bay = 3.2, floor = 3.2) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, nf = Math.max(1, Math.round(h / floor));
  const sc = (i0, nu) => { for (let i = i0; i < i0 + 4; i++) uv.setXY(i, uv.getX(i) * nu, uv.getY(i) * nf); };
  sc(0, Math.max(1, Math.round(d / bay))); sc(4, Math.max(1, Math.round(d / bay))); sc(16, Math.max(1, Math.round(w / bay))); sc(20, Math.max(1, Math.round(w / bay)));
  return g;
}
// a gable roof: ridge along x, w × d footprint, rise rh, sitting on y = 0
function esGableGeo(w, d, rh) {
  const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, rh); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(-w / 2, 0, 0); g.computeVertexNormals(); return g;
}
// corrugated sheet / tiles: stripes across
function esStripeCanvas(c0, c1, n = 16, seed = 1) {
  const r = new RNG(seed);
  return esCanvas(256, 256, (g, w, h) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c0 : c1; g.fillRect(0, i * h / n, w, h / n + 1); } for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${r.range(0.03, 0.1)})`; g.fillRect(r.range(0, w), r.range(0, h), r.range(4, 30), 2); } });
}
// a palm's crown: eight drooping fronds as flat tapered blades
function esPalmCrownGeo() {
  const pos = [], idx = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.3 * Math.sin(k * 2.1), ca = Math.cos(a), sa = Math.sin(a), L = 3.6 + 0.8 * Math.sin(k * 1.7), base = pos.length / 3, N = 5;
    for (let i = 0; i <= N; i++) {
      const u = i / N, rr = L * u, y = 0.9 * Math.sin(u * 1.9) - 1.5 * u * u, wd = 0.55 * Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.1));
      pos.push(ca * rr - sa * wd, y, sa * rr + ca * wd, ca * rr + sa * wd, y, sa * rr - ca * wd, ca * rr, y + 0.18, sa * rr);
    }
    for (let i = 0; i < N; i++) { const p = base + i * 3, q = p + 3; idx.push(p, q, p + 2, p + 2, q, q + 2, p + 2, q + 2, p + 1, p + 1, q + 2, q + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function esClockDraw(g, w, h, st) {
  g.fillStyle = '#f2ecdc'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 7); g.fill(); g.lineWidth = 10; g.strokeStyle = '#2a2a2c'; g.stroke();
  g.fillStyle = '#1a1a1c';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.save(); g.translate(w / 2, h / 2); g.rotate(a); g.fillRect(-4, -w / 2 + 16, 8, i % 3 ? 16 : 30); g.restore(); }
  const hand = (a, L, wd, c) => { g.save(); g.translate(w / 2, h / 2); g.rotate(a); g.fillStyle = c; g.fillRect(-wd / 2, -L, wd, L + 12); g.restore(); };
  const sec = st.sec, min = 41 + sec / 60 + (sec >= 60 ? 0 : 0), hr = 5 + min / 60;
  hand(hr * Math.PI / 6, w * 0.25, 12, '#1a1a1c'); hand(min * Math.PI / 30, w * 0.38, 8, '#1a1a1c'); hand(sec * Math.PI / 30, w * 0.4, 3, '#c0281c');
}

function esBuildStation(S) {
  const scene = S.scene, F = ES_F, P = ESP, Pl = F.plat, out = {};
  const root = new THREE.Group(); scene.add(root); out.root = root;
  const emit = []; out.emit = emit;                                  // dust: [x0 (east edge), x1 (west edge), z0, z1, strength]
  const lean = [];                                                   // [object, tilt at s = 1 (rad), sink at s = 1 (m), hit s | null]
  const hitOf = (kind) => { const h = ES_HITS.find((q) => q.kind === kind); return h ? h.s : null; };
  const grp = (x, y, z, parent = root) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // ------------------------------------------------------------------ the town
  {
    const cols = [[226, 212, 186], [214, 180, 140], [196, 150, 120], [232, 224, 208], [170, 190, 196], [222, 196, 128]];
    const sh = ['#3a6a5a', '#7a3a2a', '#2f4a6a', '#5a5a3a', '#6a3a4a', '#2a5a4a'];
    const walls = cols.map((c, i) => new THREE.MeshStandardMaterial({ map: esTex(esFacadeCanvas(100 + i, c, { shutter: sh[i] })), roughness: 0.9 }));
    const roofs = [esStd('#b0aa9c', 0.9), new THREE.MeshStandardMaterial({ map: (() => { const t = esTex(esStripeCanvas('#a8543a', '#96482f', 16, 4)); t.repeat.set(1, 3); return t; })(), roughness: 0.85 }), new THREE.MeshStandardMaterial({ map: (() => { const t = esTex(esStripeCanvas('#7d8a8c', '#6c787a', 24, 5)); t.repeat.set(1, 3); return t; })(), roughness: 0.6, metalness: 0.4 })];
    ES_TOWN.forEach(([x, z, w, d, h, ck, rk], i) => {
      const g = grp(x, 0, z), r = hash1(i * 31 + 7);
      const m = new THREE.Mesh(esBayBox(w, h, d), [walls[ck], walls[ck], roofs[0], roofs[0], walls[ck], walls[ck]]); m.position.y = h / 2; m.castShadow = m.receiveShadow = true; g.add(m);
      if (rk > 0) { const rf = new THREE.Mesh(esGableGeo(w + 0.8, d + 0.8, 1.2 + 0.12 * d), roofs[rk]); rf.position.y = h; rf.castShadow = true; g.add(rf); }
      else { const pr = esBox(w + 0.1, 0.5, d + 0.1, esStd('#cfc6b4', 0.9), 0, h + 0.25, 0, g); pr.scale.set(1, 1, 1); esBox(w - 0.6, 0.52, d - 0.6, roofs[0], 0, h + 0.25, 0, g); }
      lean.push([g, 0.03 + 0.012 * h * (0.6 + 0.8 * r), 0.5 + 0.11 * h * r, null, [w, d]]);
      emit.push([x + w / 2, x - w / 2, z - d / 2, z + d / 2, 0.5 + h / 12]);
    });
  }
  // ------------------------------------------------------------------ the palms (instanced: trunks, crowns)
  {
    const N = ES_PALMS.length, tg = new THREE.CylinderGeometry(0.13, 0.22, 1, 7); tg.translate(0, 0.5, 0);
    const trunks = new THREE.InstancedMesh(tg, esStd('#7a684e', 0.95), N), crowns = new THREE.InstancedMesh(esPalmCrownGeo(), new THREE.MeshStandardMaterial({ color: '#4a6a2a', roughness: 0.85, side: THREE.DoubleSide }), N);
    trunks.castShadow = crowns.castShadow = true; trunks.frustumCulled = crowns.frustumCulled = false; root.add(trunks); root.add(crowns);
    const hits = ES_PALMS.map((p) => { const s = (esHillX(p[1]) - p[0]) / P.v; return s > 0 && s < P.T ? s : null; });
    const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), ps = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3();
    out.palms = (s) => {
      for (let i = 0; i < N; i++) {
        const [x, z, h, r] = ES_PALMS[i], gone = hits[i] != null && s >= hits[i];
        const th = -(0.25 + 0.5 * r) * Math.min(1.3, Math.max(0, s)) ** 2, y0 = 0.5 - Math.min(0.5, P.fall(s));
        e.set(0.12 * Math.sin(r * 40), r * 6.28, th + 0.1 * Math.sin(r * 23)); q.setFromEuler(e);
        ps.set(x, y0, z); sc.set(gone ? 0 : 1, gone ? 0 : h, gone ? 0 : 1); mt.compose(ps, q, sc); trunks.setMatrixAt(i, mt);
        up.set(0, h, 0).applyQuaternion(q); ps.set(x + up.x, y0 + up.y, z + up.z); sc.setScalar(gone ? 0 : 0.8 + 0.4 * r); mt.compose(ps, q, sc); crowns.setMatrixAt(i, mt);
      }
      trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = true;
    };
  }
  // ------------------------------------------------------------------ the station building (in eight lengths) and its clock tower
  {
    const B = F.bldg, L = B.x[1] - B.x[0], d = B.z[1] - B.z[0], n = 8, y0 = Pl.h + 0.04, zc = (B.z[0] + B.z[1]) / 2;
    const wall = new THREE.MeshStandardMaterial({ map: esTex(esFacadeCanvas(31, [236, 226, 204], { arch: true, trim: '#c98a4a', band: '#c98a4a' })), roughness: 0.9 });
    const tile = new THREE.MeshStandardMaterial({ map: (() => { const t = esTex(esStripeCanvas('#b05a3c', '#9c4c30', 16, 6)); t.repeat.set(1, 4); return t; })(), roughness: 0.85 });
    const inner = esStd('#d8ccb4', 0.95);
    out.bldg = [];
    for (let i = 0; i < n; i++) {
      const w = L / n, g = grp(B.x[0] + (i + 0.5) * w, y0, zc);
      const m = new THREE.Mesh(esBayBox(w - 0.02, B.h, d, w / 2, B.h / 2), [inner, inner, inner, inner, wall, wall]); m.position.y = B.h / 2; m.castShadow = m.receiveShadow = true; g.add(m);
      const rf = new THREE.Mesh(esGableGeo(w + (i === 0 || i === n - 1 ? 0.6 : 0), d + 1.4, B.roof - B.h), tile); rf.position.y = B.h; rf.castShadow = true; g.add(rf);
      out.bldg.push([g, hash1(i * 13 + 3)]);
    }
    for (const x of [B.x[0], B.x[1]]) { const e = new THREE.Mesh(esBayBox(0.3, B.h, d, 3.2, B.h / 2), wall); e.position.set(x - (B.x[0] + (x === B.x[0] ? 0.5 : n - 0.5) * L / n), B.h / 2, 0); out.bldg[x === B.x[0] ? 0 : n - 1][0].add(e); }
    emit.push([B.x[1], B.x[0], B.z[0], B.z[1], 2.2]);
    // the name along the platform side
    const nameT = esTex(esCanvas(1024, 96, (g, w, h) => { g.fillStyle = '#23324a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2ecdc'; g.font = '700 64px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EQUATOR QUAY', w / 2, h / 2 + 4); }), { repeat: false });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.2), new THREE.MeshStandardMaterial({ map: nameT, roughness: 0.7 })); sign.position.set(L / n / 2, B.h - 1.0, d / 2 + 0.03); out.bldg[3][0].add(sign);
    // the tower
    const T = B.tower, tg = grp(T.x, y0, T.z), tw = new THREE.MeshStandardMaterial({ map: esTex(esFacadeCanvas(32, [240, 232, 212], { arch: true, trim: '#c98a4a' })), roughness: 0.9 });
    const body = new THREE.Mesh(esBayBox(T.w, T.h, T.w, T.w, T.h / 5), [tw, tw, inner, inner, tw, tw]); body.position.y = T.h / 2; body.castShadow = true; tg.add(body);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(T.w * 0.78, 4.2, 4), tile); cap.rotation.y = Math.PI / 4; cap.position.y = T.h + 2.1; cap.castShadow = true; tg.add(cap);
    esBox(T.w + 0.7, 0.5, T.w + 0.7, esStd('#c98a4a', 0.9), 0, T.h - 0.1, 0, tg);
    const CK = esCanvasTex(256, 256, esClockDraw); out.clockTex = CK;
    const cm = new THREE.MeshStandardMaterial({ map: CK.tex, roughness: 0.6 });
    for (const [dx, dz, ry] of [[0, T.w / 2 + 0.04, 0], [0, -T.w / 2 - 0.04, Math.PI], [T.w / 2 + 0.04, 0, Math.PI / 2], [-T.w / 2 - 0.04, 0, -Math.PI / 2]]) { const c = new THREE.Mesh(new THREE.CircleGeometry(1.7, 28), cm); c.position.set(dx, T.h - 3.2, dz); c.rotation.y = ry; tg.add(c); }
    out.tower = tg;
  }
  // ------------------------------------------------------------------ the platform canopies
  {
    const roofM = new THREE.MeshStandardMaterial({ map: (() => { const t = esTex(esStripeCanvas('#6f8a80', '#5f7a70', 32, 8)); t.repeat.set(1, 12); return t; })(), roughness: 0.55, metalness: 0.45, side: THREE.DoubleSide });
    const iron = esStd('#2f5a4a', 0.6, 0.5), cols = [];
    out.canopies = [F.can1, F.can2].map((C, ci) => {
      const L = C.x[1] - C.x[0], d = C.z[1] - C.z[0], xc = (C.x[0] + C.x[1]) / 2, zc = (C.z[0] + C.z[1]) / 2, g = grp(xc, C.y, zc);
      const rf = esBox(L, 0.12, d, roofM, 0, -0.06, 0, g); rf.rotation.x = (ci ? -1 : 1) * 0.05;
      esBox(L, 0.34, 0.1, iron, 0, -0.3, d / 2 * (ci ? -1 : 1), g); esBox(L, 0.2, 0.2, iron, 0, -0.32, C.colZ - zc, g);
      const cs = [];
      for (let x = C.x[0] + 2; x <= C.x[1] - 1; x += C.step) {
        const pv = grp(x - xc, -0.3, C.colZ - zc, g), hgt = C.y - 0.3 - Pl.h;
        const c = esCyl(0.09, 0.12, hgt, iron, 0, -hgt / 2, 0, pv, 10); void c;
        esBox(0.4, 0.03, 0.4, iron, 0, -hgt + 0.015, 0, pv);
        for (const sgn of [-1, 1]) { const br = esBox(0.07, 0.07, 1.9, iron, 0, -0.75, sgn * 0.75, pv); br.rotation.x = sgn * 0.8; }
        cs.push(pv); cols.push([x, C.colZ]);
      }
      // hanging lamps and, under canopy 1, the platform clock
      for (let x = C.x[0] + 8; x < C.x[1] - 4; x += 19) { esBox(0.04, 0.9, 0.04, iron, x - xc, -0.75, 0.8 * (ci ? -1 : 1), g); const l = esMesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshStandardMaterial({ color: '#fff4d8', emissive: '#ffd89a', emissiveIntensity: 0.9 }), x - xc, -1.3, 0.8 * (ci ? -1 : 1), g); l.castShadow = false; }
      return { g, cs, C };
    });
    out.colFeet = cols;
    const c1 = out.canopies[0], ck = grp(-36 - (F.can1.x[0] + F.can1.x[1]) / 2, -1.5, 1.6, c1.g);
    esBox(0.9, 0.9, 0.22, esStd('#2a2a2c', 0.5, 0.4), 0, 0, 0, ck); esBox(0.05, 0.7, 0.05, iron, 0, 0.75, 0, ck);
    const cf = new THREE.MeshStandardMaterial({ map: out.clockTex.tex, roughness: 0.5 });
    for (const sgn of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), cf); c.position.set(sgn * 0.0, 0, 0); c.rotation.y = sgn * Math.PI / 2; c.position.x = sgn * 0.46; ck.add(c); esBox(0.02, 0.9, 0.9, esStd('#2a2a2c', 0.5), sgn * 0.45, 0, 0, ck); }
  }
  // ------------------------------------------------------------------ the footbridge at the platforms' east end
  {
    const Br = F.bridge, iron = esStd('#3a4a5a', 0.6, 0.5), deckM = esStd('#8a7a62', 0.85), g = grp(Br.x, 0, 0), zc = (Br.z[0] + Br.z[1]) / 2, L = Br.z[1] - Br.z[0];
    esBox(Br.w, 0.22, L, deckM, 0, Br.y - 0.11, zc, g);
    for (const sx of [-1, 1]) { esBox(0.06, 0.06, L, iron, sx * Br.w / 2, Br.y + 1.1, zc, g); esBox(0.05, 0.05, L, iron, sx * Br.w / 2, Br.y + 0.55, zc, g); for (let z = Br.z[0]; z <= Br.z[1] + 0.01; z += 1.9) esBox(0.06, 1.1, 0.06, iron, sx * Br.w / 2, Br.y + 0.55, z, g); }
    for (const z of [Br.z[0] + 0.6, Br.z[1] - 0.6]) for (const sx of [-1, 1]) esBox(0.22, Br.y - Pl.h, 0.22, iron, sx * (Br.w / 2 - 0.2), (Br.y + Pl.h) / 2 - 0.1, z, g);
    // a stair down to each platform (westward)
    for (const z of [Br.z[0] + 1.0, Br.z[1] - 1.0]) for (let i = 0; i < 16; i++) esBox(0.36, 0.08, 1.7, deckM, -Br.w / 2 - 0.2 - i * 0.36, Br.y - 0.2 - i * 0.3, z, g);
    out.bridge = g;
  }
  // ------------------------------------------------------------------ platform furniture (each falls off the platform's end in its turn)
  const things = [];                                                 // [group, x0, base y]
  {
    const wood = esStd('#7a5a3a', 0.8), iron = esStd('#2a2e30', 0.6, 0.5);
    const bench = (x, z, ry) => { const g = grp(x, Pl.h, z); g.rotation.y = ry; esBox(1.9, 0.07, 0.5, wood, 0, 0.46, 0, g); esBox(1.9, 0.45, 0.06, wood, 0, 0.78, -0.24, g); for (const sx of [-0.8, 0.8]) esBox(0.07, 0.46, 0.5, iron, sx, 0.23, 0, g); things.push([g, x, Pl.h]); return g; };
    for (const x of [-170, -148, -118, -92, -66, -44]) bench(x, -6.6, 0);
    for (const x of [-140, -110, -80]) bench(x, 9.9, Math.PI);
    // bins, a luggage trolley with cases, a kiosk, the name boards
    for (const [x, z] of [[-158, -6.4], [-100, -6.4], [-54, -6.4], [-125, 9.6]]) { const g = grp(x, Pl.h, z); esCyl(0.26, 0.22, 0.8, esStd('#3a6a4a', 0.6, 0.3), 0, 0.4, 0, g, 12); things.push([g, x, Pl.h]); }
    { const g = grp(-74, Pl.h, -3.4); esBox(2.0, 0.08, 1.0, iron, 0, 0.32, 0, g); for (const [dx, dz] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) esCyl(0.1, 0.1, 0.06, iron, dx, 0.1, dz, g, 10).rotation.x = Math.PI / 2; esBox(0.05, 0.9, 0.9, iron, -0.98, 0.78, 0, g);
      [['#8a3a2a', 0.7, 0.5, 0.45, -0.5], ['#2f4a6a', 0.8, 0.55, 0.5, 0.25], ['#c8a03a', 0.55, 0.4, 0.4, 0.05]].forEach(([c, w, h, d, dx], i) => esBox(w, h, d, esStd(c, 0.7), dx, 0.36 + h / 2 + (i === 2 ? 0.55 : 0), i === 2 ? 0.1 : 0, g));
      things.push([g, -74, Pl.h]); }
    { const g = grp(-150, Pl.h, -6.2); esBox(2.6, 2.4, 1.5, esStd('#d8c8a0', 0.8), 0, 1.2, 0, g); esBox(3.0, 0.12, 2.0, esStd('#b8462e', 0.7), 0, 2.5, 0.1, g); esBox(2.2, 0.9, 0.05, esStd('#1c2630', 0.3), 0, 1.5, 0.77, g); things.push([g, -150, Pl.h]); }
    const board = esTex(esCanvas(512, 96, (g, w, h) => { g.fillStyle = '#23324a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2ecdc'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#f2ecdc'; g.font = '700 54px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EQUATOR QUAY', w / 2, h / 2 + 3); }), { repeat: false });
    const bm = new THREE.MeshStandardMaterial({ map: board, roughness: 0.7, side: THREE.DoubleSide });
    for (const [x, z] of [[-20, -6.9], [-190, -6.9], [-30, 10.4], [-180, 10.4]]) { const g = grp(x, Pl.h, z); for (const sx of [-1.2, 1.2]) esBox(0.08, 2.3, 0.08, iron, sx, 1.15, 0, g); const b = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), bm); b.position.y = 2.0; b.castShadow = true; g.add(b); things.push([g, x, Pl.h]); }
    // lamp posts beyond the canopies
    for (const [x, z] of [[-200, -5.2], [-12, -5.2], [-190, 8.4], [-40, 8.4], [-16, 8.4]]) { const g = grp(x, Pl.h, z); esCyl(0.06, 0.09, 4.4, iron, 0, 2.2, 0, g, 8); esBox(0.9, 0.06, 0.06, iron, 0.4, 4.4, 0, g); const l = esMesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff4d8', emissive: '#ffd89a', emissiveIntensity: 0.9 }), 0.85, 4.3, 0, g); l.castShadow = false; things.push([g, x, Pl.h]); }
    // the buffer stops (bolted to the rails: their bolts sheared too)
    for (const z of [F.track.z1, F.track.z2]) { const g = grp(F.buffers + 0.6, F.rail, z); esBox(0.3, 1.1, 2.4, esStd('#b8322a', 0.6, 0.3), 0, 1.0, 0, g); for (const sz of [-0.72, 0.72]) { const b = esBox(1.6, 0.14, 0.14, iron, 0.6, 0.55, sz, g); b.rotation.z = 0.6; } things.push([g, 9999, F.rail]); }
  }
  // ------------------------------------------------------------------ the signal gantry, the crossing's gates, the signal box, the water tower, the shed
  const east = [];                                                   // [group, hit s | null, tilt]
  {
    const iron = esStd('#3a3f44', 0.6, 0.5), wh = esStd('#e8e4d8', 0.7), red = esStd('#c0281c', 0.6);
    { const g = grp(34, 0, 2.2); for (const z of [-5.2, 5.2]) esBox(0.25, 7.2, 0.25, iron, 0, 3.6, z, g); esBox(0.3, 0.5, 10.9, iron, 0, 7.0, 0, g); for (const z of [-2.2, 2.2]) { esBox(0.4, 1.3, 0.5, esStd('#1a1a1c', 0.5), 0.1, 6.0, z, g); const l = esMesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: '#30ff60', emissive: '#30ff60', emissiveIntensity: 2 }), -0.12, 5.7, z, g); l.castShadow = false; } east.push([g, null, 0.12]); }
    for (const sgn of [-1, 1]) { const g = grp(F.crossing.x - sgn * 2.2, 0, sgn * 5.2 + 2.2 * (sgn < 0 ? 0 : 0)); esBox(0.3, 1.2, 0.3, wh, 0, 0.6, 0, g); const arm = esBox(0.1, 0.1, 6.4, wh, 0, 1.05, -sgn * 3.2, g); void arm; for (let i = 0; i < 4; i++) esBox(0.11, 0.11, 0.7, red, 0, 1.05, -sgn * (0.8 + i * 1.5), g); east.push([g, hitOf('truck'), 0.2]); }
    { const g = grp(F.sigbox.x, 0, F.sigbox.z), wm = new THREE.MeshStandardMaterial({ map: esTex(esFacadeCanvas(71, [150, 60, 44], { trim: '#e9e2d0' })), roughness: 0.9 });
      const b = new THREE.Mesh(esBayBox(6, 3, 4), [wm, wm, wh, wh, wm, wm]); b.position.y = 1.5; b.castShadow = true; g.add(b);
      const u = new THREE.Mesh(esBayBox(6.4, 2.6, 4.4, 1.6, 2.6), [wm, wm, wh, wh, wm, wm]); u.position.y = 4.3; u.castShadow = true; g.add(u);
      const rf = new THREE.Mesh(esGableGeo(7.2, 5.4, 1.4), esStd('#4a4e52', 0.7)); rf.position.y = 5.6; rf.castShadow = true; g.add(rf); east.push([g, hitOf('box'), 0.1]); emit.push([F.sigbox.x + 3, F.sigbox.x - 3, F.sigbox.z - 2, F.sigbox.z + 2, 0.7]); }
    { const g = grp(F.wtower.x, 0, F.wtower.z); for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) esBox(0.22, 8, 0.22, iron, dx, 4, dz, g); for (const y of [2.6, 5.4]) { esBox(3.4, 0.12, 0.12, iron, 0, y, -1.6, g); esBox(3.4, 0.12, 0.12, iron, 0, y, 1.6, g); esBox(0.12, 0.12, 3.4, iron, -1.6, y, 0, g); esBox(0.12, 0.12, 3.4, iron, 1.6, y, 0, g); }
      esCyl(2.6, 2.6, 3.4, esStd('#7a4a36', 0.7, 0.3), 0, 9.7, 0, g, 16); const c = esMesh(new THREE.ConeGeometry(2.8, 1.2, 16), esStd('#5a3a2c', 0.7, 0.3), 0, 12, 0, g); void c; east.push([g, hitOf('tower'), 0.16]); }
    { const Sh = F.shed, g = grp(Sh.x, 0, Sh.z), wm = new THREE.MeshStandardMaterial({ map: (() => { const t = esTex(esStripeCanvas('#9aa3a6', '#8a9396', 32, 11)); t.repeat.set(8, 1); t.rotation = Math.PI / 2; return t; })(), roughness: 0.6, metalness: 0.4 });
      esBox(Sh.w, Sh.h, Sh.d, wm, 0, Sh.h / 2, 0, g); const rf = new THREE.Mesh(esGableGeo(Sh.w + 0.6, Sh.d + 0.8, 2.2), esStd('#6a5a52', 0.6, 0.4)); rf.position.y = Sh.h; rf.castShadow = true; g.add(rf);
      esBox(0.1, 4.2, 5, esStd('#3a3f44', 0.6), Sh.w / 2 + 0.03, 2.1, 0, g); east.push([g, hitOf('shed'), 0.08]); emit.push([Sh.x + Sh.w / 2, Sh.x - Sh.w / 2, Sh.z - Sh.d / 2, Sh.z + Sh.d / 2, 1.0]);
      // the fuel stand beside the siding: two upright tanks and pipes
      for (const dx of [-16, -10]) { const t = grp(Sh.x + dx, 0, Sh.z + 9.5); esCyl(1.5, 1.5, 5.2, esStd('#d8d4c8', 0.5, 0.3), 0, 2.9, 0, t, 16); esCyl(1.52, 1.52, 0.3, red, 0, 4.4, 0, t, 16); east.push([t, (esHillX(Sh.z + 9.5) - (Sh.x + dx + 1.5)) / P.v, 0.1]); } }
    // the quay's crane and crates, lamp posts along the apron
    { const g = grp(F.quay.x + 16, 0, 58), ye = esStd('#d8a82a', 0.6, 0.3);
      for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) esBox(0.5, 11, 0.5, ye, dx, 5.5, dz, g); esBox(9, 0.6, 9, ye, 0, 11, 0, g); esBox(3.4, 3, 3.4, esStd('#e8e4d8', 0.6), 0, 12.8, 0, g);
      const jib = esBox(26, 0.7, 0.7, ye, -9, 17, 0, g); jib.rotation.z = -0.5; esBox(0.5, 6, 0.5, ye, 0, 16, 0, g); east.push([g, null, 0.14]); emit.push([F.quay.x + 20, F.quay.x + 12, 54, 62, 0.4]); }
    const crateC = ['#b8462e', '#2f5a8a', '#3a7a4a', '#c8a03a', '#7a7a7a'];
    for (let i = 0; i < 14; i++) { const r = hash1(i * 17 + 5), x = F.quay.x + 6 + 22 * hash1(i * 7 + 1), z = -120 + 220 * hash1(i * 11 + 2), g = grp(x, 0, z); esBox(6.1, 2.6, 2.44, esStd(crateC[i % 5], 0.6, 0.3), 0, 1.3, 0, g); if (r > 0.6) esBox(6.1, 2.6, 2.44, esStd(crateC[(i + 2) % 5], 0.6, 0.3), 0, 3.9, 0, g); g.rotation.y = (r - 0.5) * 0.3 + (i % 3 ? 0 : Math.PI / 2); east.push([g, null, 0.05]); }
  }
  // ------------------------------------------------------------------ the people
  {
    const mk = (look, x, z, yaw, pose, o = {}) => { const p = esPerson(look, root, { id: o.id || '' }); return Object.assign({ p, x, z, yaw, pose, y: Pl.h }, o); };
    // the passengers stand where the platform's end is 12 to 30 m ahead when "it ends in 20 metres" comes up
    const sCap = esStoryAt(esC('people', 2)), xl = -(12 + P.v * sCap);
    out.leadX = xl;
    out.people = [
      mk('esMaster', -24, -3.4, Math.PI / 2, 'flag'),
      mk('esP1', xl, -3.6, Math.PI / 2 + 0.5, 'stand'), mk('esP2', xl - 3.2, -4.6, Math.PI / 2 - 0.3, 'phone'), mk('esP3', xl - 6.0, -3.2, 0.3, 'lookAround'),
      mk('esP4', xl - 8.4, -5.4, Math.PI / 2 + 0.9, 'talk'), mk('esP5', xl - 9.6, -4.6, -Math.PI / 2 + 0.6, 'stand'), mk('esP6', xl - 18, -6.5, 0.1, 'sit', { seat: true }),
      mk('esP7', -52, 8.0, -0.4, 'stand'), mk('esP2', -120, 8.6, Math.PI, 'phone', { id: 'b' }),
      mk('esP3', -41, -5.6, Math.PI / 2 - 0.5, 'stand', { id: 'c' }), mk('esP5', -47.5, -3.9, -Math.PI / 2 + 0.3, 'phone', { id: 'c' }), mk('esP4', -58, -5.2, 0.5, 'lookAround', { id: 'c' }),
    ];
    out.woman = mk('esWoman', F.bridge.x, 2.4, Math.PI / 2, 'rail', { bridge: true });
  }
  // ------------------------------------------------------------------ the pigeons (in the air: nothing happens to them)
  {
    const body = new THREE.SphereGeometry(0.11, 8, 6); body.scale(1.7, 0.9, 0.9);
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.16, 0, 0.36, -0.14, 0, 0.3], 3)); wg.computeVertexNormals();
    const bm = esStd('#8a8f98', 0.8), wm = new THREE.MeshStandardMaterial({ color: '#70757e', roughness: 0.8, side: THREE.DoubleSide });
    out.birds = [];
    for (let i = 0; i < 11; i++) {
      // (the first four fly together, where the pigeons' shot looks; the rest are scattered along the platforms)
      const r = esRand(i * 91 + 7), g = i < 4 ? grp(-66 - i * 1.5 - 0.6 * r(), 5.0 + 0.9 * r(), -2.4 + 2.6 * r()) : grp(-30 - 80 * r(), 2.6 + 5.5 * r(), -6.5 + 9 * r()); g.rotation.y = -0.4 + 0.8 * r();
      const b = new THREE.Mesh(body, bm); b.castShadow = true; g.add(b);
      const wl = new THREE.Mesh(wg, wm), wr = new THREE.Mesh(wg, wm); wr.scale.z = -1; g.add(wl); g.add(wr);
      out.birds.push({ g, wl, wr, ph: r() * 6.28, x: g.position.x, y: g.position.y, z: g.position.z, v: 6 + 3 * r() });
    }
  }

  // ------------------------------------------------------------------ every frame
  const POSE = {
    stand: () => ES_POSES.standStill(), phone: () => ES_POSES.phone(), lookAround: () => ES_POSES.lookAround(), talk: () => ES_POSES.talk(), sit: () => ES_POSES.sit(),
    flag: () => { const p = basePose(); p.rSh = [2.6, 0.25]; p.rEl = 0.15; p.lSh = [0.2, 0.12]; p.neck = -0.05; return p; },
    rail: () => { const p = basePose(); p.lSh = [0.9, 0.25]; p.rSh = [0.9, 0.25]; p.lEl = 0.5; p.rEl = 0.5; p.spine = 0.12; return p; },
  };
  out.update = (s, t) => {
    const X = P.X(s), sc = Math.max(0, Math.min(s, 1.6)), k1 = Math.min(1, sc);
    root.position.x = X;
    // the town: sliding on its base, sinking as the ground grinds it away, tripping forward (east)
    for (const [g, tilt, sink] of lean) { g.rotation.z = -tilt * sc * sc; g.position.y = -sink * k1 - (s > 1 ? 2.2 * (s - 1) : 0); }
    out.palms(s);
    // the station building: its eight lengths slide, sink and part; the tower trips forward
    out.bldg.forEach(([g, r], i) => { g.rotation.z = -(0.03 + 0.09 * r) * sc * sc; g.rotation.x = (r - 0.5) * 0.06 * sc; g.position.y = F.plat.h + 0.04 - (0.5 + 0.9 * r) * k1 - (s > 1 ? 3 * (s - 1) : 0); g.position.x = F.bldg.x[0] + (i + 0.5) * (F.bldg.x[1] - F.bldg.x[0]) / 8 + (i - 3.5) * 0.22 * sc; });
    out.tower.rotation.z = -0.2 * sc * sc; out.tower.position.y = F.plat.h + 0.04 - 0.8 * k1;
    // the canopies: carried on their sliding columns, then falling; the columns fold back once their feet catch the ground
    const sFold = P.roofFree + Math.sqrt(2 * Pl.h / P.g);
    out.canopies.forEach(({ g, cs, C }, ci) => {
      g.position.y = C.y + (P.roofY(s) - F.can1.y) + 0.05 * MathX.smooth(s, 0, 0.002); g.rotation.z = -0.035 * MathX.smooth(s, P.roofFree, 1.0); g.rotation.x = (ci ? -1 : 1) * 0.03 * MathX.smooth(s, P.roofFree, 1.1);
      cs.forEach((pv, i) => { const f = MathX.smooth(s, sFold + 0.03 * (i % 4), P.roofLand + 0.02); pv.rotation.z = -1.25 * f * (0.8 + 0.4 * hash1(i * 7 + ci)); pv.rotation.x = 0.5 * f * (hash1(i * 3 + ci * 5) - 0.5); });
    });
    // the footbridge: in free fall once it has left the platforms
    out.bridge.position.y = P.womanY(s) - F.bridge.y; out.bridge.rotation.z = -0.05 * MathX.smooth(s, 0.1, 1); out.bridge.rotation.x = 0.03 * MathX.smooth(s, 0.2, 1);
    // furniture: each thing falls off the platform's end in its turn (and trips forward on the way)
    for (const [g, x0, y0] of things) { const sEnd = x0 > 9000 ? 0.004 : (Pl.x[1] - x0) / P.v, dy = Math.min(y0 - 0.02, P.fall(s, sEnd)); g.position.y = y0 - dy; g.rotation.z = -Math.min(1.4, 2.4 * sc * sc); }
    for (const [g, hit, tilt] of east) { g.visible = !(hit != null && s >= hit); g.rotation.z = -tilt * sc * sc; }
    // the people: standing still at 1,670 km/h; the platform drags their feet back, so they tip forward; then its end
    for (const q of out.people) {
      const sEnd = (Pl.x[1] - q.x) / P.v, dy = P.fall(s, sEnd), gone = dy > q.y - 0.1;
      q.p.root.visible = !gone;
      if (gone) continue;
      const pose = POSE[q.pose](); esFidget(pose, Math.min(s, 0) + (s > 0 ? 0 : 0), q.x, 1);
      esPose(q.p, pose, q.x, q.y - dy + (q.seat ? 0 : 0), q.z, q.yaw);
      q.p.root.rotation.order = 'ZYX'; q.p.root.rotation.z = -Math.min(1.35, 3.05 * sc * sc);
    }
    { const q = out.woman, y = P.womanY(s), k = MathX.smooth(s, 0.05, 0.4), pose = lerpPose(POSE.rail(), ES_POSES.jump(), k * 0.8);
      esPose(q.p, pose, q.x, y, q.z, q.yaw); q.p.root.rotation.order = 'ZYX'; q.p.root.rotation.z = -0.25 * k; q.p.root.visible = s < P.womanLand + 0.01; }
    // the pigeons: flying on (wings at 8 beats a second)
    for (const b of out.birds) { const a = Math.sin(b.ph + s * 8 * 6.283) * 0.9; b.wl.rotation.x = -a; b.wr.rotation.x = a; b.g.position.set(b.x + Math.max(-3, Math.min(s, 2)) * b.v, b.y + 0.4 * Math.sin(b.ph + s * 1.3), b.z); }
    // the clocks: 5:41:57 … 5:42:00 (and there they stay: nobody is left to read them)
    out.clockTex.update({ sec: Math.floor(Math.min(0, s) + 60) % 60 === 0 && s >= 0 ? 60 : Math.floor(60 + Math.min(0, s)) });
  };
  return out;
}
