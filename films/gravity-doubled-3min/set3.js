/* =====================================================================
   SET3 — what the 3-minute film adds to the café and the square (extends GbCafe; built after plaza.js):
   - the STAIRCASE in the café's back corner: 17 oak steps rising toward −X along the back wall (z 2.45…3.45) to the
     floor above, a wall stringer, an open stringer with turned balusters, a newel post and a handrail (scenes 6–7);
     the stairwell opening in the ceiling (cafe.js) looks into a dim upstairs landing with a warm wall lamp.
   - the LOADED BALCONY on the side house left of the café: a stone slab on two steel cantilever brackets, heavy planters
     on it, a clamp-on load gauge on the near bracket (scene 10).
   - the RAMP and TERRACE on the right of the square: a raised paved terrace with a low stone wall in front of the
     right-hand houses, reached by a gentle ramp (0.45 m over 6 m, 7.5 %) (scenes 8–9).
   All static (the gauge needle is posed by film.js). Geometry is merged per material where it is static.
   ===================================================================== */

Object.assign(GbCafe.prototype, {
  stairTop(n) { const S = GB_SET.stairs; return { y: S.rise * n, x0: S.x0 - S.run * n, x1: S.x0 - S.run * (n - 1) }; },
  // the world point on the centre of tread n (n = 0 → the floor in front of the first step), at depth zz across the flight
  stairP(n, zz = 0.5, along = 0.5) {
    const S = GB_SET.stairs;
    if (n <= 0) return new THREE.Vector3(S.x0 + 0.35 - 0.35 * along, 0, S.z0 + (S.z1 - S.z0) * zz);
    return new THREE.Vector3(S.x0 - S.run * (n - 1) - S.run * along, S.rise * n, S.z0 + (S.z1 - S.z0) * zz);
  },
  // the handrail's height above the floor at world x (on the open side)
  railY(x) { const S = GB_SET.stairs, k = (S.x0 + 0.12 - x) / S.run; return 0.92 + S.rise * MathX.clamp(k, 0, S.n); },

  _stairs() {
    const S = GB_SET.stairs, R = this.root, g = new THREE.Group();
    const oak = gbMat('#7a4a30', { rough: 0.55, rim: 0.25, name: 'gbStairOak', env: 0.5 });
    const riserM = gbMat('#e6dccb', { rough: 0.8, name: 'gbRiser' });
    const darkW = gbMat('#2d1a20', { rough: 0.55, rim: 0.25, name: 'gbStairDark' });
    const brass = gbMat('#c9a25a', { rough: 0.3, metal: 0.8 });
    const W = S.z1 - S.z0, zc = (S.z0 + S.z1) / 2;
    for (let n = 1; n <= S.n; n++) {
      const T = this.stairTop(n);
      // the tread (with a small nosing) and the painted riser under it
      gbAdd(g, gbRoundBox(S.run + 0.025, 0.035, W, 0.008, 2), oak, (T.x0 + T.x1) / 2 + 0.012, T.y - 0.0175, zc);
      gbAdd(g, new THREE.BoxGeometry(0.02, S.rise - 0.035, W - 0.02), riserM, T.x1 - 0.01, T.y - S.rise / 2 - 0.017, zc);
      // a filled block under each step (the stair is closed underneath: no see-through gaps)
      gbAdd(g, new THREE.BoxGeometry(S.run, T.y - 0.035, W - 0.06), darkW, (T.x0 + T.x1) / 2, (T.y - 0.035) / 2, zc + 0.03, { cast: false });
      // balusters on the open side (two per tread)
      for (const k of [0.3, 0.75]) {
        const bx = T.x1 - S.run * k;
        gbAdd(g, gbLathe([[0.018, 0], [0.018, 0.05], [0.012, 0.09], [0.016, 0.3], [0.01, 0.55], [0.014, 0.78], [0.014, 0.9]], 8), darkW, bx, T.y, S.z0 + 0.04);
      }
    }
    // the open stringer (a sloped board along z0) and the wall stringer
    const len = Math.hypot(S.run * S.n, S.rise * S.n), ang = Math.atan2(S.rise, S.run);
    const midX = S.x0 - S.run * S.n / 2, midY = S.rise * S.n / 2;
    gbAdd(g, new THREE.BoxGeometry(len + 0.1, 0.24, 0.05), darkW, midX, midY - 0.05, S.z0 + 0.02, { rz: -ang });
    gbAdd(g, new THREE.BoxGeometry(len + 0.1, 0.26, 0.04), darkW, midX, midY + 0.04, S.z1 + 0.02, { rz: -ang });
    // the handrail: from the newel post up into the stairwell (follows railY), with a brass end cap
    const rail = [];
    for (let k = 0; k <= 12; k++) { const x = S.x0 + 0.1 - (S.run * S.n + 0.1) * (k / 12); rail.push([x, this.railY(x), S.z0 + 0.04]); }
    gbAdd(g, gbTube(rail, 0.03, 48, 8), oak, 0, 0, 0);
    // the newel post at the foot (turned, with a ball top)
    gbAdd(g, gbLathe([[0.07, 0], [0.07, 0.12], [0.05, 0.16], [0.045, 0.9], [0.06, 0.95], [0.06, 1.02], [0.03, 1.08], [0.055, 1.13], [0.04, 1.2], [0, 1.21]], 16), oak, S.x0 + 0.1, 0, S.z0 + 0.04);
    gbAdd(g, new THREE.SphereGeometry(0.035, 12, 8), brass, S.x0 + 0.1, 1.22, S.z0 + 0.04);
    // a wall handrail on brackets along the back wall
    const wr = [];
    for (let k = 0; k <= 8; k++) { const x = S.x0 - 0.2 - (S.run * (S.n - 2)) * (k / 8); wr.push([x, this.railY(x) - 0.02, S.z1 + 0.02]); }
    gbAdd(g, gbTube(wr, 0.022, 32, 6), darkW, 0, 0, 0);
    // a stair runner (a woven strip down the middle) for warmth
    const runM = gbMat('#7d3a30', { rough: 0.9, name: 'gbRunner' });
    for (let n = 1; n <= S.n; n++) { const T = this.stairTop(n); gbAdd(g, new THREE.BoxGeometry(S.run - 0.02, 0.006, 0.56), runM, (T.x0 + T.x1) / 2, T.y + 0.003, zc + 0.02, { cast: false }); }
    // upstairs: the landing, dim walls and a warm sconce (seen through the opening only)
    const upM = new THREE.MeshStandardMaterial({ color: '#4a3040', roughness: 0.95, side: THREE.BackSide, name: 'gbUpstairs' });
    const [hx0, hx1, hz0] = GB_SET.stairHole;
    gbAdd(g, new THREE.BoxGeometry(hx1 - hx0 + 1.6, 2.6, 3.7 - hz0 + 1.2), upM, (hx0 + hx1) / 2 - 0.4, GB_SET.ceil + 1.3, (hz0 + 3.7) / 2 - 0.3, { cast: false });
    gbAdd(g, new THREE.BoxGeometry(1.4, 0.06, 1.25), oak, hx0 - 0.1, GB_SET.ceil + 0.01, (S.z0 + S.z1) / 2);
    gbAdd(g, new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffe0b0', emissive: '#ffb062', emissiveIntensity: 3 }), hx0 - 0.5, GB_SET.ceil + 1.6, 3.55, { cast: false });
    // the stairwell's edge trim
    gbAdd(g, new THREE.BoxGeometry(hx1 - hx0, 0.2, 0.06), darkW, (hx0 + hx1) / 2, GB_SET.ceil - 0.1, hz0);
    R.add(gbMergeGroup(g, { cast: true }));
    this.upLight = new THREE.PointLight('#ffb36b', 1.2, 4, 1.6); this.upLight.position.set(hx0 - 0.4, GB_SET.ceil + 1.3, 3.2); this.scene.add(this.upLight);
    // a little framed picture and a coat hook on the back wall by the foot of the stairs
    gbAdd(R, new THREE.BoxGeometry(0.5, 0.62, 0.04), brass, 2.0, 1.75, 3.47);
    gbAdd(R, new THREE.PlaneGeometry(0.42, 0.54), new THREE.MeshStandardMaterial({ roughness: 0.9, map: gbCanvasTex(128, 160, (x, w, h) => { x.fillStyle = '#4a3a6a'; x.fillRect(0, 0, w, h); x.fillStyle = '#f2b46a'; x.fillRect(0, h * 0.55, w, h * 0.06); x.fillStyle = 'rgba(255,220,170,0.8)'; x.beginPath(); x.arc(w * 0.5, h * 0.55, w * 0.18, Math.PI, 0); x.fill(); }, false) }), 2.0, 1.75, 3.445, { ry: Math.PI, cast: false });
  },

  // ---------------------------------------------------------------------------------------- the loaded balcony (scene 10)
  _balcony() {
    const [bx, bz, by] = GB_SET.balcony, R = this.root, g = new THREE.Group(); g.position.set(bx, by, bz); R.add(g);
    // the side house's front is at z = bz (it faces −Z, toward the square); the balcony juts out toward −Z
    const stone = gbMat('#c9b8a2', { rough: 0.85, rim: 0.3, name: 'gbBalcStone' }), steel = gbMat('#3a3d44', { rough: 0.45, metal: 0.7, rim: 0.4, env: 0.9, name: 'gbBracket' });
    const iron = gbMat('#1c1a1e', { rough: 0.5, metal: 0.5 });
    gbAdd(g, gbRoundBox(2.6, 0.16, 1.05, 0.02, 2), stone, 0, 0, -0.52);
    gbAdd(g, new THREE.BoxGeometry(2.64, 0.05, 1.08), gbMat('#a8967f', { rough: 0.85 }), 0, -0.1, -0.52);
    // the railing
    gbAdd(g, gbTube([[-1.28, 0.95, -0.02], [-1.28, 0.95, -1.0], [1.28, 0.95, -1.0], [1.28, 0.95, -0.02]], 0.022, 24, 6), iron, 0, 0, 0);
    for (let k = 0; k <= 16; k++) gbAdd(g, new THREE.CylinderGeometry(0.008, 0.008, 0.87, 5), iron, -1.28 + k * 0.16, 0.5, -1.0);
    for (const x of [-1.28, 1.28]) for (let k = 0; k <= 5; k++) gbAdd(g, new THREE.CylinderGeometry(0.008, 0.008, 0.87, 5), iron, x, 0.5, -0.04 - k * 0.19);
    // heavy planters and a stack of terracotta pots (the load)
    const pot = gbMat('#a0603e', { rough: 0.85, rim: 0.3 }), leaf = gbMat('#4d6e3e', { rough: 0.85, flat: true });
    for (const [x, s] of [[-0.85, 1.0], [0.05, 1.15], [0.9, 0.95]]) {
      gbAdd(g, gbRoundBox(0.62 * s, 0.5 * s, 0.42, 0.03, 2), pot, x, 0.08 + 0.25 * s, -0.5);
      for (let k = 0; k < 6; k++) gbAdd(g, new THREE.IcosahedronGeometry(0.16 + 0.05 * hash1(k + x * 9), 1), leaf, x + (hash1(k * 3 + x) - 0.5) * 0.45 * s, 0.1 + 0.55 * s + 0.12 * hash1(k * 7), -0.5 + (hash1(k * 5) - 0.5) * 0.25);
    }
    // the two cantilever brackets: a triangle of steel plate (web) with flanges, bolted to the wall
    this.brackets = [];
    for (const x of [-0.9, 0.9]) {
      const b = new THREE.Group(); b.position.set(x, -0.08, 0); g.add(b);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-0.95, 0); sh.quadraticCurveTo(-0.5, -0.2, 0, -0.85); sh.lineTo(0, 0);
      const web = new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: false }); web.rotateY(-Math.PI / 2); web.translate(0.011, 0, 0);
      gbAdd(b, web, steel, 0, 0, 0);
      gbAdd(b, new THREE.BoxGeometry(0.1, 0.02, 0.96), steel, 0, -0.01, -0.48);                 // top flange
      gbAdd(b, gbTube([[0, -0.85, -0.01], [0, -0.42, -0.62], [0, -0.02, -0.95]], 0.016, 16, 6), steel, 0, 0, 0);   // curved strut edge
      gbAdd(b, new THREE.BoxGeometry(0.14, 0.95, 0.02), steel, 0, -0.42, -0.01);              // wall plate
      for (const y of [-0.15, -0.45, -0.75]) gbAdd(b, new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8), gbMat('#8a8d94', { rough: 0.3, metal: 0.9 }), 0.03 * Math.sign(x), y, -0.03, { rx: Math.PI / 2 });
      this.brackets.push(b);
    }
    // the clamp-on load gauge on the near (right) bracket: a small dial whose needle film.js turns
    const gauge = this.gauge = new THREE.Group(); gauge.position.set(0.9 + 0.035, -0.36, -0.42); g.add(gauge);
    gbAdd(gauge, new THREE.CylinderGeometry(0.075, 0.075, 0.04, 24), gbMat('#d9a23a', { rough: 0.5, rim: 0.3 }), 0.02, 0, 0, { rz: Math.PI / 2 });
    const face = gbCanvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#f2ead8'; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill();
      // bands: normal (green) to the 1 g load, the safety margin (amber), the limit (red); 7 o'clock → 5 o'clock
      const arc = (a0, a1, c) => { x.strokeStyle = c; x.lineWidth = 26; x.beginPath(); x.arc(128, 128, 92, a0, a1); x.stroke(); };
      const A = (v) => Math.PI * (0.75 + 1.5 * v / 3);     // 0…3× the 1 g load
      arc(A(0), A(1), '#5f9a5a'); arc(A(1), A(2.5), '#e0a83a'); arc(A(2.5), A(3), '#c2453a');
      x.fillStyle = '#2a2226'; x.font = 'bold 30px Inter, sans-serif'; x.textAlign = 'center';
      for (const v of [0, 1, 2, 3]) { const a = A(v); x.fillText(v + '×', 128 + Math.cos(a) * 58, 138 + Math.sin(a) * 58); }
      x.font = 'bold 22px Inter, sans-serif'; x.fillText('LOAD', 128, 196);
    }, false);
    const fm = new THREE.MeshStandardMaterial({ map: face, roughness: 0.6 });
    gbAdd(gauge, new THREE.CircleGeometry(0.068, 32), fm, 0.042, 0, 0, { ry: Math.PI / 2, cast: false });
    this.gaugeNeedle = new THREE.Group(); this.gaugeNeedle.position.set(0.045, 0, 0); gauge.add(this.gaugeNeedle);
    gbAdd(this.gaugeNeedle, new THREE.BoxGeometry(0.003, 0.055, 0.006), gbMat('#c2453a', { rough: 0.4 }), 0, 0.024, 0, { cast: false });
    gbAdd(gauge, new THREE.SphereGeometry(0.008, 8, 6), iron, 0.046, 0, 0);
    // a cable from the gauge clamp down the wall (it has been fitted today)
    gbAdd(g, gbTube([[0.95, -0.4, -0.42], [0.98, -0.7, -0.08], [0.98, -1.6, -0.03], [0.9, -3.3, -0.03]], 0.006, 16, 4), iron, 0, 0, 0);
    this.balconyG = g;
  },
  // set the load gauge (in multiples of the 1 g load)
  setGauge(v) { if (!this.gaugeNeedle) return; const A = Math.PI * (0.75 + 1.5 * MathX.clamp(v, 0, 3) / 3); this.gaugeNeedle.rotation.x = Math.atan2(-Math.cos(A), -Math.sin(A)); },

  // ---------------------------------------------------------------------------------------- the ramp and the terrace (scenes 8–9)
  _ramp() {
    const P = GB_SET.ramp, R = this.root, g = new THREE.Group();
    const pave = new THREE.MeshStandardMaterial({ map: this.tx.stone, color: '#cbb8aa', roughness: 0.82, name: 'gbTerrace' });
    const edge = gbMat('#b3a292', { rough: 0.85, rim: 0.25, name: 'gbKerb' });
    const tx0 = P.x1, tx1 = 14.45, tz0 = -7.2, tz1 = -23.5, H = P.h;
    // the terrace: a raised slab in front of the right-hand houses
    gbAdd(g, new THREE.BoxGeometry(tx1 - tx0, H, tz0 - tz1), pave, (tx0 + tx1) / 2, H / 2, (tz0 + tz1) / 2);
    // the ramp: a sloped slab from the square (z0, y = 0) up to the landing (z1, y = H), beside the terrace
    const L = Math.hypot(P.z0 - P.z1, H), a = Math.atan2(H, P.z0 - P.z1);
    const rampG = new THREE.BoxGeometry(P.x1 - P.x0, 0.12, L);
    gbAdd(g, rampG, pave, (P.x0 + P.x1) / 2, H / 2 - 0.06, (P.z0 + P.z1) / 2, { rx: a });
    // a solid wedge under it (no gap at the side)
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(P.z0 - P.z1, 0); sh.lineTo(P.z0 - P.z1, H); sh.lineTo(0, 0);
    const wedge = new THREE.ExtrudeGeometry(sh, { depth: P.x1 - P.x0, bevelEnabled: false }); wedge.rotateY(Math.PI / 2); wedge.translate(P.x0, 0, P.z0);
    gbAdd(g, wedge, edge, 0, -0.001, 0, { cast: false });
    // the landing at the top of the ramp joins the terrace
    gbAdd(g, new THREE.BoxGeometry(P.x1 - P.x0, H, 2.5), pave, (P.x0 + P.x1) / 2, H / 2, P.z1 - 1.25);
    // kerbs: along the ramp's outer edge and the terrace front (with a gap where the landing joins)
    gbAdd(g, new THREE.BoxGeometry(0.14, 0.14, L), edge, P.x0 + 0.07, H / 2 + 0.05, (P.z0 + P.z1) / 2, { rx: a });
    // the low stone wall along the terrace front (people lean and sit on it); stops at the landing
    const wallTop = gbMat('#d6c6b2', { rough: 0.8, rim: 0.3 });
    gbAdd(g, new THREE.BoxGeometry(0.36, 0.5, P.z0 - P.z1 + 1.8), edge, P.x1 + 0.18, H + 0.25, (P.z0 + P.z1) / 2 + 0.9);
    gbAdd(g, gbRoundBox(0.44, 0.07, P.z0 - P.z1 + 1.9, 0.02, 2), wallTop, P.x1 + 0.18, H + 0.53, (P.z0 + P.z1) / 2 + 0.9);
    gbAdd(g, new THREE.BoxGeometry(0.36, 0.5, (P.z1 - 2.5) - tz1), edge, P.x0 + 0.18, H + 0.25, ((P.z1 - 2.5) + tz1) / 2);
    gbAdd(g, gbRoundBox(0.44, 0.07, (P.z1 - 2.5) - tz1 + 0.1, 0.02, 2), wallTop, P.x0 + 0.18, H + 0.53, ((P.z1 - 2.5) + tz1) / 2);
    // a handrail up the ramp (iron posts)
    const iron = gbMat('#1c1a1e', { rough: 0.5, metal: 0.5 });
    const hr = []; for (let k = 0; k <= 6; k++) { const z = P.z0 - (P.z0 - P.z1) * k / 6; hr.push([P.x0 + 0.07, H * k / 6 + 0.92, z]); gbAdd(g, new THREE.CylinderGeometry(0.02, 0.02, 0.92, 6), iron, P.x0 + 0.07, H * k / 6 + 0.46, z); }
    gbAdd(g, gbTube(hr, 0.022, 24, 6), iron, 0, 0, 0);
    R.add(gbMergeGroup(g, { cast: true }));
  },
  // the ground height on the ramp at (x, z) (0 elsewhere on the square)
  rampY(x, z) { const P = GB_SET.ramp; if (x < P.x0 - 0.05 || x > P.x1 + 0.05) return 0; return P.h * MathX.clamp((P.z0 - z) / (P.z0 - P.z1), 0, 1); },
});

(function () {
  const build0 = GbCafe.prototype.build;
  GbCafe.prototype.build = function () { build0.call(this); this._stairs(); this._balcony(); this._ramp(); };
})();
