/* =====================================================================
   FACILITY — the one contained place: your side of the glass, the
   holding cell (CELL 07) with its lifting glass wall and two back doors,
   the hazard corridor (left), the corridor to the blast door (right), the
   core hall (supply case, the core, server racks, catwalks, the drone
   dock, the escape hatch). Panel walls, pipes, cable trays, wall
   controls, stencils, emergency beacons. Two shadow-casting key lights
   follow the action; the alarm turns the place red.
   ===================================================================== */

installFog({ bankScale: 0.08, bankAmount: 0.4, lowHeight: 1.2, lowAmount: 0.5, cap: 0.75 });

class Facility {
  constructor(scene, renderer) {
    this.scene = scene; this.renderer = renderer;
    this.root = new THREE.Group(); this.root.name = 'facility'; scene.add(this.root);
    this.batch = new Batcher();
    this.r = new RNG(707);
    this.v = new THREE.Vector3();
    this.blink = [];                       // emissive bits that blink (racks, panels)
  }

  build() {
    this._materials();
    this._viewSide();
    this._cell();
    this._corrL();
    this._corrB();
    this._hall();
    this._lights();
    this.batch.build(this.root, 'fac');
    this._envMap();
    this.scene.fog = new THREE.FogExp2('#101317', 0.018);
  }

  /* ---------------- materials ---------------- */
  _materials() {
    const r = this.r, std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
    // wall panels: a 2.4 m tile of four 1.2 m panels with seams, rivets and a little wear
    const W = 512, wc = Tex.canvas(W, W), w = wc.getContext('2d'), wb = Tex.canvas(W, W), b = wb.getContext('2d');
    w.fillStyle = '#b8bab6'; w.fillRect(0, 0, W, W); b.fillStyle = '#808080'; b.fillRect(0, 0, W, W);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = i * 256, y = j * 256, v = r.range(-7, 7);
      const g = w.createLinearGradient(x, y, x, y + 256); g.addColorStop(0, `rgb(${190 + v},${192 + v},${188 + v})`); g.addColorStop(1, `rgb(${176 + v},${178 + v},${174 + v})`);
      w.fillStyle = g; w.fillRect(x + 3, y + 3, 250, 250);
      w.fillStyle = 'rgba(40,44,48,0.85)'; w.fillRect(x, y, 256, 3); w.fillRect(x, y, 3, 256);
      w.fillStyle = 'rgba(255,255,255,0.35)'; w.fillRect(x + 3, y + 3, 250, 1.5); w.fillRect(x + 3, y + 3, 1.5, 250);
      b.fillStyle = '#202020'; b.fillRect(x, y, 256, 4); b.fillRect(x, y, 4, 256);
      for (const [px, py] of [[14, 14], [242, 14], [14, 242], [242, 242], [128, 14], [128, 242]]) {
        w.fillStyle = '#8d908d'; w.beginPath(); w.arc(x + px, y + py, 3.2, 0, 7); w.fill(); w.fillStyle = 'rgba(255,255,255,0.5)'; w.beginPath(); w.arc(x + px - 0.8, y + py - 0.8, 1.3, 0, 7); w.fill();
        b.fillStyle = '#c0c0c0'; b.beginPath(); b.arc(x + px, y + py, 3.2, 0, 7); b.fill();
      }
      // a recessed horizontal groove in each panel
      w.fillStyle = 'rgba(60,64,66,0.35)'; w.fillRect(x + 20, y + 180, 216, 2); b.fillStyle = '#4a4a4a'; b.fillRect(x + 20, y + 180, 216, 2);
    }
    for (let i = 0; i < 90; i++) { w.fillStyle = `rgba(70,64,56,${r.range(0.015, 0.05)})`; w.beginPath(); w.arc(r.range(0, W), r.range(0, W), r.range(6, 40), 0, 7); w.fill(); }
    for (let i = 0; i < 160; i++) { w.fillStyle = `rgba(50,50,50,${r.range(0.03, 0.09)})`; w.fillRect(r.range(0, W), r.range(0, W), r.range(4, 30), 1); }
    Tex.noise(w, W, W, 8, r);
    const wallT = Tex.tex(wc), wallB = Tex.tex(wb, { srgb: false });
    this.mWall = std('#ffffff', { map: wallT, bumpMap: wallB, bumpScale: 1.6, roughness: 0.72, name: 'wallPanel' });
    // floor: dark sealed concrete, 1 m slabs, scuffs, a few drips
    const fc = Tex.canvas(W, W), f = fc.getContext('2d');
    f.fillStyle = '#3f4246'; f.fillRect(0, 0, W, W);
    for (let i = 0; i < 260; i++) { f.fillStyle = `rgba(${r.chance(0.5) ? '90,92,94' : '20,22,24'},${r.range(0.03, 0.08)})`; f.beginPath(); f.arc(r.range(0, W), r.range(0, W), r.range(4, 50), 0, 7); f.fill(); }
    for (let i = 0; i < 120; i++) { f.strokeStyle = `rgba(16,16,18,${r.range(0.08, 0.2)})`; f.lineWidth = r.range(0.6, 2); f.beginPath(); const x = r.range(0, W), y = r.range(0, W); f.moveTo(x, y); f.lineTo(x + r.range(-40, 40), y + r.range(-8, 8)); f.stroke(); }
    f.fillStyle = 'rgba(14,15,16,0.7)'; f.fillRect(0, 0, W, 2); f.fillRect(0, 256, W, 2); f.fillRect(0, 0, 2, W); f.fillRect(256, 0, 2, W);
    Tex.noise(f, W, W, 10, r);
    const floorT = Tex.tex(fc);
    this.mFloor = std('#ffffff', { map: floorT, roughness: 0.42, metalness: 0.0, name: 'floor' });
    // ceiling: dark, a grid of tiles
    const cc = Tex.canvas(256, 256), c = cc.getContext('2d');
    c.fillStyle = '#2c2f33'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#1b1d20'; c.fillRect(0, 0, 256, 4); c.fillRect(0, 0, 4, 256); c.fillRect(0, 128, 256, 3); c.fillRect(128, 0, 3, 256);
    Tex.noise(c, 256, 256, 8, r);
    this.mCeil = std('#ffffff', { map: Tex.tex(cc), roughness: 0.9, name: 'ceiling' });
    this.mSteel = std('#4b5158', { roughness: 0.42, metalness: 0.65, name: 'steel' });
    this.mDark = std('#24272b', { roughness: 0.55, metalness: 0.4, name: 'darkSteel' });
    this.mKick = std('#2e3236', { roughness: 0.6, metalness: 0.3, name: 'kick' });
    this.mPipe = std('#6c7178', { roughness: 0.38, metalness: 0.7, name: 'pipe' });
    this.mPipeY = std('#b88a22', { roughness: 0.5, metalness: 0.3, name: 'pipeY' });
    this.mPipeR = std('#7d2a22', { roughness: 0.5, metalness: 0.3, name: 'pipeR' });
    this.mRubber = std('#1a1b1d', { roughness: 0.9, name: 'rubber' });
    // hazard stripes
    const hc = Tex.canvas(128, 32), h = hc.getContext('2d');
    h.fillStyle = '#d4a20e'; h.fillRect(0, 0, 128, 32); h.fillStyle = '#16171a';
    for (let x = -32; x < 160; x += 32) { h.beginPath(); h.moveTo(x, 32); h.lineTo(x + 16, 32); h.lineTo(x + 32, 0); h.lineTo(x + 16, 0); h.fill(); }
    Tex.noise(h, 128, 32, 18, r);
    const hz = Tex.tex(hc); this.mHaz = std('#ffffff', { map: hz, roughness: 0.6, name: 'hazard' });
    // light fixtures (bloom above the threshold)
    this.mLamp = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f4f6ff', emissiveIntensity: 2.4, roughness: 0.4, name: 'lamp' });
    this.mLampWarm = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffd9a8', emissiveIntensity: 2.0, roughness: 0.4, name: 'lampWarm' });
    this.mRedLamp = new THREE.MeshStandardMaterial({ color: '#3a0a08', emissive: '#ff2a1a', emissiveIntensity: 0.0, roughness: 0.4, name: 'redLamp' });
    this.mAmber = new THREE.MeshStandardMaterial({ color: '#3a2508', emissive: '#ffa31a', emissiveIntensity: 1.6, roughness: 0.4, name: 'amber' });
  }

  // a stencil / sign texture
  _sign(lines, { w = 512, h = 256, bg = null, fg = '#e9e6dc', font = 120, weight = 700, family = Tex.fontCond, stroke = null, align = 'center' } = {}) {
    const cv = Tex.canvas(w, h), x = cv.getContext('2d');
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    x.fillStyle = fg; x.textAlign = align; x.textBaseline = 'middle';
    const L = Array.isArray(lines) ? lines : [lines];
    L.forEach((s, i) => {
      const sz = typeof s === 'object' ? s.size : font, txt = typeof s === 'object' ? s.text : s;
      x.font = `${weight} ${sz}px ${family}`;
      const y = h / 2 + (i - (L.length - 1) / 2) * (font * 1.1);
      x.fillText(txt, align === 'center' ? w / 2 : 24, y);
    });
    if (stroke) { x.strokeStyle = stroke; x.lineWidth = 8; x.strokeRect(6, 6, w - 12, h - 12); }
    return Tex.tex(cv, { repeat: false });
  }
  _decal(tex, w, h, x, y, z, ry, opts = {}) {
    const m = new THREE.MeshStandardMaterial(Object.assign({ map: tex, transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }, opts));
    const d = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); d.position.set(x, y, z); d.rotation.y = ry; d.receiveShadow = true; this.root.add(d); return d;
  }

  /* ---------------- geometry helpers ---------------- */
  // a vertical wall quad from (x0, z0) to (x1, z1), y0..y1, facing to the left of the direction of travel; world-scaled UVs
  _wall(x0, z0, x1, z1, y0, y1, mat = this.mWall, tile = 2.4, opts) {
    const L = Math.hypot(x1 - x0, z1 - z0), g = new THREE.PlaneGeometry(L, y1 - y0), uv = g.attributes.uv;
    const u0 = (Math.abs(x0) + Math.abs(z0)) / tile;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * L / tile, (y0 + uv.getY(i) * (y1 - y0)) / tile);
    const ang = Math.atan2(x1 - x0, z1 - z0) - Math.PI / 2;
    this.batch.add(g, mat, Geo.matrix((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, ang, 0), opts);
  }
  _floor(x0, x1, z0, z1, y, mat, tile, down = false) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * (x1 - x0)) / tile, (z0 + uv.getY(i) * (z1 - z0)) / tile);
    this.batch.add(g, mat, Geo.matrix((x0 + x1) / 2, y, (z0 + z1) / 2, down ? Math.PI / 2 : -Math.PI / 2, 0, 0), { noShadow: true });
  }
  _box(w, h, d, x, y, z, mat, ry = 0, opts) { this.batch.box(w, h, d, x, y, z, mat, ry, opts); }
  _cyl(r, len, x, y, z, axis, mat, seg = 12) {
    const g = new THREE.CylinderGeometry(r, r, len, seg);
    const rx = axis === 'z' ? Math.PI / 2 : 0, rz = axis === 'x' ? Math.PI / 2 : 0;
    this.batch.add(g, mat, Geo.matrix(x, y, z, rx, 0, rz));
  }
  // a run of pipes with brackets
  _pipes(axis, a0, a1, pos, list) {
    for (const [dy, dw, r, mat] of list) {
      const len = Math.abs(a1 - a0), mid = (a0 + a1) / 2;
      if (axis === 'z') this._cyl(r, len, pos[0] + dw, pos[1] + dy, mid, 'z', mat);
      else this._cyl(r, len, mid, pos[1] + dy, pos[0] + dw, 'x', mat);
    }
    for (let a = Math.min(a0, a1) + 0.4; a < Math.max(a0, a1); a += 1.6) {
      if (axis === 'z') this._box(0.04, 0.32, 0.05, pos[0], pos[1] + 0.06, a, this.mDark);
      else this._box(0.05, 0.32, 0.04, a, pos[1] + 0.06, pos[0], this.mDark);
    }
  }
  // a strip light on the ceiling
  _strip(x, y, z, len, axis = 'z', mat = this.mLamp) {
    if (axis === 'z') { this._box(0.16, 0.05, len + 0.06, x, y - 0.02, z, this.mDark); this._box(0.11, 0.02, len, x, y - 0.05, z, mat, 0, { noShadow: true }); }
    else { this._box(len + 0.06, 0.05, 0.16, x, y - 0.02, z, this.mDark); this._box(len, 0.02, 0.11, x, y - 0.05, z, mat, 0, { noShadow: true }); }
  }
  // a wall control panel: housing, a small screen (canvas), a row of lit buttons
  _control(x, y, z, ry, { w = 0.42, h = 0.32, screen = 'status', lit = '#57d6c0' } = {}) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; this.root.add(g);
    const hs = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), this.mSteel); hs.position.z = 0.035; hs.castShadow = true; hs.receiveShadow = true; g.add(hs);
    const cv = Tex.canvas(256, 160), c = cv.getContext('2d');
    c.fillStyle = '#071012'; c.fillRect(0, 0, 256, 160);
    c.strokeStyle = 'rgba(120,220,210,0.55)'; c.lineWidth = 2; c.strokeRect(8, 8, 240, 144);
    c.fillStyle = 'rgba(150,235,225,0.9)'; c.font = `600 18px ${Tex.fontSans}`; c.fillText(screen === 'door' ? 'DOOR B-2' : 'CELL 07', 18, 34);
    c.font = `500 13px ${Tex.fontSans}`; c.fillStyle = 'rgba(150,235,225,0.6)';
    for (let i = 0; i < 5; i++) { c.fillRect(18, 52 + i * 18, 60 + ((i * 37) % 120), 5); }
    c.fillStyle = 'rgba(255,170,60,0.9)'; c.fillRect(190, 120, 44, 18);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.66, h * 0.52), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: Tex.tex(cv, { repeat: false }), emissiveIntensity: 1.1, roughness: 0.2, name: 'screen' }));
    scr.position.set(-w * 0.08, h * 0.12, 0.072); g.add(scr);
    for (let i = 0; i < 4; i++) {
      const bm = new THREE.MeshStandardMaterial({ color: '#111', emissive: i === 3 ? '#ff5a3a' : lit, emissiveIntensity: 1.4, roughness: 0.3 });
      const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 10), bm); bt.rotation.x = Math.PI / 2; bt.position.set(-w * 0.32 + i * 0.05, -h * 0.32, 0.075); g.add(bt);
      this.blink.push({ m: bm, base: 1.4, ph: this.r.range(0, 6), rate: this.r.range(0.4, 1.6) });
    }
    return g;
  }
  // a rotating emergency beacon (a dome with a lamp; the light itself is shared, see _lights)
  _beacon(x, y, z, down = true) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.root.add(g);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.05, 14), this.mDark); base.position.y = down ? -0.025 : 0.025; g.add(base);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.mRedLamp);
    if (down) dome.rotation.x = Math.PI; dome.position.y = down ? -0.05 : 0.05; g.add(dome);
    // a soft light cone that sweeps round (additive)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#ff2a1a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    cone.geometry.translate(0, -1.1, 0); cone.geometry.rotateZ(Math.PI / 2 - 0.35);
    const piv = new THREE.Group(); piv.position.y = down ? -0.05 : 0.05; piv.add(cone); g.add(piv);
    (this.beacons || (this.beacons = [])).push({ g, piv, cone, ph: this.r.range(0, 6) });
    return g;
  }

  /* ---------------- your side of the glass ---------------- */
  _viewSide() {
    const V = GF.view, G = GF.glassZ, h = V.h;
    this._floor(V.x0, V.x1, G, V.z1, 0, this.mFloor, 2.0);
    this._floor(V.x0, V.x1, G - 0.3, V.z1, h, this.mCeil, 1.2, true);
    this._wall(V.x0, V.z1, V.x0, G, 0, h); this._wall(V.x1, G, V.x1, V.z1, 0, h); this._wall(V.x1, V.z1, V.x0, V.z1, 0, h);
    // the wall either side of the glass (facing you)
    this._wall(V.x0, G, -2.6, G, 0, h); this._wall(2.6, G, V.x1, G, 0, h);
    this._wall(-2.6, G, 2.6, G, 3.0, h);
    // the glass's ceiling housing (a dark slot the glass lifts into)
    this._box(5.4, 0.18, 0.4, 0, 2.99, G, this.mDark);
    this._box(5.4, 0.04, 0.12, 0, 2.89, G + 0.16, this.mHaz, 0, { noShadow: true });
    // floor: a yellow line where the glass stands, a hazard band
    this._box(5.2, 0.006, 0.12, 0, 0.003, G + 0.2, this.mHaz, 0, { noShadow: true });
    for (const s of [-1, 1]) this._box(0.06, 0.004, 3.6, s * 1.9, 0.002, 0.9, Mat.std('#c9a227', { roughness: 0.7 }), 0, { noShadow: true });
    // kick plates
    for (const x of [V.x0 + 0.01, V.x1 - 0.01]) this._box(0.02, 0.18, V.z1 - G, x, 0.09, (V.z1 + G) / 2, this.mKick);
    // pipes along the ceiling at both sides
    this._pipes('z', G - 0.1, V.z1, [V.x0 + 0.25, h - 0.28], [[0, 0, 0.06, this.mPipe], [-0.02, 0.17, 0.04, this.mPipeY]]);
    this._pipes('z', G - 0.1, V.z1, [V.x1 - 0.25, h - 0.28], [[0, 0, 0.07, this.mPipe], [0.03, -0.17, 0.035, this.mPipeR]]);
    this._strip(0, h, 1.2, 2.4, 'x');
    // the observation desk to your left, a control panel on the wall right of the glass
    this._control(2.0, 1.35, G + 0.005, 0, { screen: 'status' });
    this._decal(this._sign('CELL 07', { w: 512, h: 160, font: 120, fg: '#e8e3d4' }), 1.1, 0.34, -1.95, 2.45, G + 0.01, 0);
    this._beacon(-2.4, h, 0.2);
    this._beacon(2.4, h, -0.6);
    // the glass wall: three panes between steel mullions (it lifts into the slot at the alarm)
    const gl = new THREE.Group(); gl.position.set(0, 0, G); this.root.add(gl); this.glass = gl;
    const sm = Tex.canvas(256, 256), s = sm.getContext('2d');
    s.fillStyle = 'rgb(18,18,18)'; s.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) { s.fillStyle = `rgba(255,255,255,${this.r.range(0.02, 0.06)})`; s.beginPath(); s.ellipse(this.r.range(0, 256), this.r.range(60, 256), this.r.range(4, 22), this.r.range(3, 14), this.r.range(0, 3), 0, 7); s.fill(); }
    const sg = s.createLinearGradient(0, 0, 256, 256); sg.addColorStop(0.3, 'rgba(255,255,255,0)'); sg.addColorStop(0.45, 'rgba(255,255,255,0.12)'); sg.addColorStop(0.52, 'rgba(255,255,255,0)'); sg.addColorStop(0.62, 'rgba(255,255,255,0.07)'); sg.addColorStop(0.7, 'rgba(255,255,255,0)');
    s.fillStyle = sg; s.fillRect(0, 0, 256, 256);
    const smT = Tex.tex(sm, { srgb: false, repeat: false });
    this.mGlass = new THREE.MeshStandardMaterial({ color: '#d8e8ee', transparent: true, opacity: 0.09, roughness: 0.04, metalness: 0.1, envMapIntensity: 2.2, depthWrite: false, name: 'glass' });
    this.mSheen = new THREE.MeshBasicMaterial({ color: '#ffffff', map: smT, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, name: 'glassSheen' });
    for (const [x0, x1] of [[-2.6, -1.3], [-1.3, 1.3], [1.3, 2.6]]) {
      const pw = x1 - x0 - 0.06, p = new THREE.Mesh(new THREE.PlaneGeometry(pw, 2.92), this.mGlass); p.position.set((x0 + x1) / 2, 1.5, 0); p.renderOrder = 3; gl.add(p);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(pw, 2.92), this.mSheen); sh.position.set((x0 + x1) / 2, 1.5, 0.004); sh.renderOrder = 4; gl.add(sh);
    }
    const ml = (w, h2, d, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), this.mSteel); m.position.set(x, y, 0); m.castShadow = true; m.receiveShadow = true; gl.add(m); };
    for (const x of [-2.6, -1.3, 1.3, 2.6]) ml(0.07, 2.96, 0.09, x, 1.5);
    ml(5.27, 0.07, 0.1, 0, 0.035); ml(5.27, 0.06, 0.1, 0, 2.95);
    // a speaking grille and a pass-through slot in the centre pane
    const gr = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), Mat.std('#5a6068', { roughness: 0.5, metalness: 0.6 })); gr.position.set(0, 1.42, 0.005); gl.add(gr);
  }

  /* ---------------- the cell ---------------- */
  _cell() {
    const C = GF.cell, h = C.h, DL = GF.doorL, DR = GF.doorR;
    this._floor(C.x0, C.x1, C.z0, C.z1, 0, this.mFloor, 2.0);
    this._floor(C.x0, C.x1, C.z0, C.z1, h, this.mCeil, 1.2, true);
    this._wall(C.x0, C.z1, C.x0, C.z0, 0, h); this._wall(C.x1, C.z0, C.x1, C.z1, 0, h);
    // back wall with two door openings
    const z = C.z0, dw = DL.w, dh = DL.h;
    this._wall(C.x0, z, DL.x - dw / 2, z, 0, h); this._wall(DL.x + dw / 2, z, DR.x - dw / 2, z, 0, h); this._wall(DR.x + dw / 2, z, C.x1, z, 0, h);
    for (const D of [DL, DR]) this._wall(D.x - dw / 2, z, D.x + dw / 2, z, dh, h);
    for (const x of [C.x0 + 0.01, C.x1 - 0.01]) this._box(0.02, 0.18, C.z1 - C.z0, x, 0.09, (C.z0 + C.z1) / 2, this.mKick);
    // a bench along the left wall, a light panel in the ceiling, a dome camera, a floor drain, the cell number
    this._box(0.45, 0.06, 1.8, C.x0 + 0.26, 0.46, -2.9, this.mSteel); this._box(0.4, 0.44, 0.06, C.x0 + 0.26, 0.22, -2.1, this.mDark); this._box(0.4, 0.44, 0.06, C.x0 + 0.26, 0.22, -3.7, this.mDark);
    this._box(1.6, 0.04, 0.9, 0, h - 0.02, -3.0, this.mDark); this._box(1.5, 0.02, 0.8, 0, h - 0.045, -3.0, this.mLamp, 0, { noShadow: true });
    const cam = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), Mat.std('#1a1c20', { roughness: 0.2, metalness: 0.4 })); cam.position.set(C.x1 - 0.2, h - 0.02, C.z0 + 0.2); this.root.add(cam);
    const drain = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), Mat.std('#1d1f22', { roughness: 0.5, metalness: 0.6 })); drain.rotation.x = -Math.PI / 2; drain.position.set(0.9, 0.004, -3.6); this.root.add(drain);
    this._decal(this._sign('07', { w: 256, h: 256, font: 210, fg: 'rgba(30,32,36,0.8)' }), 0.9, 0.9, 1.75, 1.85, C.z0 + 0.012, 0);
    this._decal(this._sign(['SUBJECT', 'HOLDING'], { w: 512, h: 256, font: 72, fg: 'rgba(30,32,36,0.65)' }), 0.9, 0.45, -1.7, 2.3, C.z0 + 0.012, 0);
    // door frames (steel, with edge lights that change at the choice) and the doors that slide into the wall
    this.doors = {};
    for (const [k, D, dir] of [['L', DL, -1], ['R', DR, 1]]) {
      for (const sx of [-1, 1]) this._box(0.08, dh + 0.08, 0.14, D.x + sx * (dw / 2 + 0.04), dh / 2, z + 0.02, this.mSteel);
      this._box(dw + 0.24, 0.08, 0.14, D.x, dh + 0.04, z + 0.02, this.mSteel);
      this._box(dw + 0.16, 0.03, 0.06, D.x, dh + 0.25, z + 0.03, this.mHaz, 0, { noShadow: true });
      // the edge light: a thin emissive frame just inside the opening
      const em = new THREE.MeshStandardMaterial({ color: '#111', emissive: '#e9eef2', emissiveIntensity: 0.25, roughness: 0.4, name: 'edge' + k });
      const eg = new THREE.Group(); eg.position.set(D.x, 0, z + 0.095); this.root.add(eg);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.018, dh, 0.012), em); e.position.set(sx * (dw / 2 + 0.005), dh / 2, 0); eg.add(e); }
      const et = new THREE.Mesh(new THREE.BoxGeometry(dw + 0.03, 0.018, 0.012), em); et.position.set(0, dh + 0.005, 0); eg.add(et);
      // the leaf
      const leaf = new THREE.Group(); leaf.position.set(D.x, 0, z - 0.03); this.root.add(leaf);
      const lm = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.06), this.mDark); lm.position.y = dh / 2; lm.castShadow = true; lm.receiveShadow = true; leaf.add(lm);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.7), new THREE.MeshStandardMaterial({ color: '#0d1114', roughness: 0.1, metalness: 0.4 })); win.position.set(0, 1.45, 0.031); leaf.add(win);
      const st = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), new THREE.MeshStandardMaterial({ map: this._sign(k === 'L' ? 'A-1' : 'A-2', { w: 256, h: 128, font: 96, fg: '#d9d5c8' }), transparent: true, roughness: 0.7 }));
      st.position.set(0, 0.95, 0.031); leaf.add(st);
      this.doors[k] = { leaf, em, D, dir };
    }
  }

  /* ---------------- the hazard corridor (left) ---------------- */
  _corrL() {
    const L = GF.corrL, z1 = GF.cell.z0, h = L.h;
    this._floor(L.x0, L.x1, L.z0, z1, 0, this.mFloor, 2.0);
    this._floor(L.x0, L.x1, L.z0, z1, h, this.mCeil, 1.2, true);
    this._wall(L.x0, z1, L.x0, L.z0, 0, h); this._wall(L.x1, L.z0, L.x1, z1, 0, h); this._wall(L.x0, L.z0, L.x1, L.z0, 0, h);
    const DL = GF.doorL; this._wall(L.x1, z1, DL.x + DL.w / 2, z1, 0, h); this._wall(DL.x - DL.w / 2, z1, L.x0, z1, 0, h); this._wall(DL.x + DL.w / 2, z1, DL.x - DL.w / 2, z1, DL.h, h);
    // steam pipes everywhere, a hazard floor, warning signs
    this._pipes('z', z1, L.z0, [L.x0 + 0.18, 2.25], [[0, 0, 0.09, this.mPipeR], [0.3, 0.06, 0.05, this.mPipe], [-0.35, 0.02, 0.06, this.mPipeY]]);
    this._pipes('z', z1, L.z0, [L.x1 - 0.18, 2.4], [[0, 0, 0.07, this.mPipe], [-0.5, 0, 0.05, this.mPipeR]]);
    this._floor(L.x0 + 0.1, L.x1 - 0.1, L.z0 + 0.5, z1 - 0.6, 0.004, this.mHaz, 0.6);
    this._decal(this._sign(['DANGER', { text: 'HIGH PRESSURE STEAM', size: 46 }], { w: 512, h: 256, bg: '#c8261c', fg: '#fff', font: 96, stroke: '#fff' }), 0.6, 0.3, L.x1 - 0.012, 1.6, -7.2, -Math.PI / 2);
    this.lampL = []; for (let zz = -6.6; zz > L.z0; zz -= 1.6) this._beaconSmall(( L.x0 + L.x1) / 2, h, zz);
  }
  _beaconSmall(x, y, z) { this._box(0.24, 0.04, 0.12, x, y - 0.02, z, this.mDark); this._box(0.2, 0.03, 0.08, x, y - 0.05, z, this.mRedLamp, 0, { noShadow: true }); }

  /* ---------------- the corridor to the blast door (right) ---------------- */
  _corrB() {
    const B = GF.corrB, z1 = GF.cell.z0, h = B.h, D = GF.doorB;
    this._floor(B.x0, B.x1, B.z0, z1, 0, this.mFloor, 2.0);
    this._floor(B.x0, B.x1, B.z0, z1, h, this.mCeil, 1.2, true);
    this._wall(B.x0, z1, B.x0, B.z0, 0, h); this._wall(B.x1, B.z0, B.x1, z1, 0, h);
    const DR = GF.doorR; this._wall(B.x1, z1, DR.x + DR.w / 2, z1, 0, h); this._wall(DR.x - DR.w / 2, z1, B.x0, z1, 0, h); this._wall(DR.x + DR.w / 2, z1, DR.x - DR.w / 2, z1, DR.h, h);
    for (const x of [B.x0 + 0.01, B.x1 - 0.01]) this._box(0.02, 0.18, z1 - B.z0, x, 0.09, (B.z0 + z1) / 2, this.mKick);
    // the end wall around the blast door
    const z = B.z0;
    this._wall(B.x0, z, D.x - D.w / 2, z, 0, h); this._wall(D.x + D.w / 2, z, B.x1, z, 0, h); this._wall(D.x - D.w / 2, z, D.x + D.w / 2, z, D.h, h);
    // pipes and a cable tray on the right wall, strip lights, a floor arrow
    this._pipes('z', z1, z + 0.1, [B.x1 - 0.14, 2.3], [[0, 0, 0.065, this.mPipe], [-0.2, 0.0, 0.045, this.mPipeY], [0.22, -0.05, 0.035, this.mPipe]]);
    this._box(0.3, 0.04, z1 - z, B.x0 + 0.2, h - 0.25, (z + z1) / 2, this.mDark);
    for (let zz = -6.8; zz > z; zz -= 2.0) this._strip(B.ax, h, zz, 1.2, 'z');
    for (let zz = -7.0; zz > z + 1.5; zz -= 1.4) { const a = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshStandardMaterial({ map: this._sign('▲', { w: 128, h: 128, font: 110, fg: 'rgba(220,200,120,0.55)', family: Tex.fontSans }), transparent: true, depthWrite: false, roughness: 0.7 })); a.rotation.x = -Math.PI / 2; a.position.set(B.ax, 0.004, zz); this.root.add(a); }
    this._control(B.x1 - 0.005, 1.4, -8.1, -Math.PI / 2, { screen: 'door' });
    this._decal(this._sign(['SECTOR B', { text: 'CORE ACCESS →', size: 50 }], { w: 512, h: 256, font: 90, fg: '#e3dfd2' }), 0.8, 0.4, B.x1 - 0.012, 2.15, -9.6, -Math.PI / 2);
    // the blast door: two heavy leaves (they lift together), hazard frame, the HOLD pad, the scanner on the left wall
    for (const sx of [-1, 1]) this._box(0.12, D.h + 0.12, 0.2, D.x + sx * (D.w / 2 + 0.06), D.h / 2, z + 0.06, this.mHaz);
    this._box(D.w + 0.36, 0.14, 0.2, D.x, D.h + 0.07, z + 0.06, this.mHaz);
    const door = new THREE.Group(); door.position.set(D.x, 0, z - 0.04); this.root.add(door); this.blast = door;
    const dm = new THREE.Mesh(new THREE.BoxGeometry(D.w, D.h, 0.14), this.mSteel); dm.position.y = D.h / 2; dm.castShadow = true; dm.receiveShadow = true; door.add(dm);
    for (let i = 0; i < 5; i++) { const rb = new THREE.Mesh(new THREE.BoxGeometry(D.w - 0.1, 0.05, 0.03), this.mDark); rb.position.set(0, 0.3 + i * 0.48, 0.08); door.add(rb); }
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.012, D.h - 0.04, 0.02), Mat.std('#0b0c0e')); seam.position.set(0, D.h / 2, 0.08); door.add(seam);
    // energy lines along the door (lit while you hold)
    this.mEnergy = new THREE.MeshBasicMaterial({ color: '#9ff0ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.energy = [];
    for (const [w2, h2, x, y] of [[0.012, D.h - 0.2, 0, D.h / 2], [D.w - 0.2, 0.012, 0, GF.pad.y], [D.w - 0.2, 0.012, 0, 0.3 + 4 * 0.48], [D.w - 0.2, 0.012, 0, 0.3]]) {
      const e = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), this.mEnergy.clone()); e.position.set(x, y, 0.1); door.add(e); this.energy.push(e);
    }
    const pad = new THREE.Group(); pad.position.set(GF.pad.x - D.x, GF.pad.y, 0.075); door.add(pad); this.pad = pad;
    const pr = new THREE.Mesh(new THREE.CylinderGeometry(GF.pad.r + 0.03, GF.pad.r + 0.03, 0.03, 40), this.mDark); pr.rotation.x = Math.PI / 2; pad.add(pr);
    this.mPad = new THREE.MeshStandardMaterial({ color: '#0b1416', emissive: '#7fe6f2', emissiveIntensity: 0.35, roughness: 0.25, metalness: 0.2 });
    const pf = new THREE.Mesh(new THREE.CylinderGeometry(GF.pad.r, GF.pad.r, 0.036, 40), this.mPad); pf.rotation.x = Math.PI / 2; pad.add(pf);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: this._sign('☝', { w: 128, h: 128, font: 96, fg: 'rgba(210,250,255,0.85)', family: Tex.fontSans }), transparent: true, depthWrite: false })); pl.position.z = 0.02; pad.add(pl);
    // the scanner: a palm plate on the wall
    const S = GF.scanner, sc = new THREE.Group(); sc.position.set(S.x + 0.005, S.y, S.z); sc.rotation.y = Math.PI / 2; this.root.add(sc);
    const sb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.04), this.mSteel); sb.position.z = 0.02; sb.castShadow = true; sc.add(sb);
    this.mScan = new THREE.MeshStandardMaterial({ color: '#0b1416', emissive: '#7fe6f2', emissiveIntensity: 0.5, roughness: 0.2 });
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), this.mScan); sp.position.z = 0.041; sc.add(sp);
  }

  /* ---------------- the core hall ---------------- */
  _hall() {
    const H = GF.hall, z1 = GF.corrB.z0, h = H.h, D = GF.doorB;
    this._floor(H.x0, H.x1, H.z0, z1, 0, this.mFloor, 2.0);
    this._floor(H.x0, H.x1, H.z0, z1, h, this.mCeil, 1.6, true);
    this._wall(H.x0, z1, H.x0, H.z0, 0, h); this._wall(H.x1, H.z0, H.x1, z1, 0, h); this._wall(H.x0, H.z0, H.x1, H.z0, 0, h);
    this._wall(D.x - D.w / 2, z1, H.x0, z1, 0, h); this._wall(H.x1, z1, D.x + D.w / 2, z1, 0, h); this._wall(D.x + D.w / 2, z1, D.x - D.w / 2, z1, D.h, h);
    for (const x of [H.x0 + 0.01, H.x1 - 0.01]) this._box(0.02, 0.18, z1 - H.z0, x, 0.09, (H.z0 + z1) / 2, this.mKick);
    // catwalks along both sides (2.6 m up), with railings and a grille floor
    for (const [x, s] of [[H.x0 + 0.6, 1], [H.x1 - 0.6, -1]]) {
      this._box(1.2, 0.06, z1 - H.z0 - 0.4, x, 2.6, (H.z0 + z1) / 2, this.mDark);
      for (let zz = z1 - 0.8; zz > H.z0 + 0.4; zz -= 1.6) { this._box(0.05, 1.0, 0.05, x + s * 0.57, 3.13, zz, this.mSteel); this._box(0.06, 2.6, 0.06, x + s * 0.57, 1.3, zz, this.mDark); }
      this._box(0.04, 0.04, z1 - H.z0 - 0.5, x + s * 0.57, 3.62, (H.z0 + z1) / 2, this.mPipeY);
      this._box(0.03, 0.03, z1 - H.z0 - 0.5, x + s * 0.57, 3.15, (H.z0 + z1) / 2, this.mSteel);
    }
    // server racks along the walls below the catwalks, with blinking LEDs
    const rc = Tex.canvas(128, 256), rx = rc.getContext('2d'); rx.fillStyle = '#15171a'; rx.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 16; i++) { rx.fillStyle = '#22252a'; rx.fillRect(6, 6 + i * 15.5, 116, 12); rx.fillStyle = '#0b0c0d'; for (let k = 0; k < 9; k++) rx.fillRect(40 + k * 9, 9 + i * 15.5, 6, 6); }
    const rackM = new THREE.MeshStandardMaterial({ map: Tex.tex(rc, { repeat: false }), roughness: 0.5, metalness: 0.3, name: 'rack' });
    const ledM = new THREE.MeshStandardMaterial({ color: '#111', emissive: '#6fe0c8', emissiveIntensity: 1.6, name: 'leds' }); this.blink.push({ m: ledM, base: 1.6, ph: 0, rate: 3.1 });
    const ledM2 = new THREE.MeshStandardMaterial({ color: '#111', emissive: '#ffb04a', emissiveIntensity: 1.2, name: 'leds2' }); this.blink.push({ m: ledM2, base: 1.2, ph: 1, rate: 1.7 });
    for (const [x, ry] of [[H.x0 + 0.35, Math.PI / 2], [H.x1 - 0.35, -Math.PI / 2]]) for (let zz = z1 - 2.2; zz > H.z0 + 1.5; zz -= 0.75) {
      if (x > 0 && zz > -16.4 && zz < -13.8) continue;                          // room for the supply case
      this._box(0.6, 2.2, 0.7, x, 1.1, zz, this.mDark, ry);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 2.1), rackM); f.position.set(x + (ry > 0 ? 0.305 : -0.305), 1.1, zz); f.rotation.y = ry; this.root.add(f);
      for (let k = 0; k < 6; k++) this._box(0.02, 0.015, 0.015, x + (ry > 0 ? 0.31 : -0.31), 0.4 + k * 0.29, zz + this.r.range(-0.2, 0.2), this.r.chance(0.7) ? ledM : ledM2, 0, { noShadow: true });
    }
    // the core: a tall glass column with lit rods and rings
    const [cx, cz] = GF.core;
    this._cyl(0.95, 0.3, cx, 0.15, cz, 'y', this.mDark, 28); this._cyl(0.95, 0.3, cx, h - 0.15, cz, 'y', this.mDark, 28);
    this.mCore = new THREE.MeshStandardMaterial({ color: '#0a1416', emissive: '#64d6e8', emissiveIntensity: 1.6, roughness: 0.3, name: 'core' });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; this._cyl(0.035, h - 0.6, cx + Math.cos(a) * 0.45, h / 2, cz + Math.sin(a) * 0.45, 'y', this.mCore, 8); }
    this._cyl(0.12, h - 0.6, cx, h / 2, cz, 'y', this.mCore, 12);
    const coreGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, h - 0.6, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#bfe8f0', transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide, name: 'glassCore' }));
    coreGlass.position.set(cx, h / 2, cz); this.root.add(coreGlass);
    for (let y = 0.8; y < h - 0.5; y += 1.1) this._cyl(0.88, 0.06, cx, y, cz, 'y', this.mSteel, 28);
    // the supply case on a pedestal (its lid pops for the roulette)
    const [kx, kz] = GF.caseP;
    this._box(0.7, 0.75, 0.55, kx, 0.375, kz, this.mDark);
    this._box(0.72, 0.03, 0.57, kx, 0.765, kz, this.mHaz, 0, { noShadow: true });
    const cs = new THREE.Group(); cs.position.set(kx, 0.78, kz); this.root.add(cs);
    const cb = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.4), Mat.std('#6b6f46', { roughness: 0.6, metalness: 0.2 })); cb.position.y = 0.11; cb.castShadow = true; cs.add(cb);
    const lidP = new THREE.Group(); lidP.position.set(0, 0.22, -0.2); cs.add(lidP);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.4), Mat.std('#5d613c', { roughness: 0.6, metalness: 0.2 })); lid.position.set(0, 0.03, 0.2); lid.castShadow = true; lidP.add(lid);
    const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.14), new THREE.MeshStandardMaterial({ map: this._sign('✚', { w: 128, h: 128, font: 110, fg: '#e8e2cf', family: Tex.fontSans }), transparent: true })); cross.position.set(0, 0.11, 0.201); cs.add(cross);
    this.mCaseGlow = new THREE.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.34), this.mCaseGlow); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.225; cs.add(glow);
    this.caseLid = lidP;
    // the escape hatch (far wall), the drone dock (ceiling), signs
    const [hx, hz] = GF.hatch;
    const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 36), this.mSteel); hatch.rotation.x = Math.PI / 2; hatch.position.set(hx, 1.25, hz + 0.06); hatch.castShadow = true; this.root.add(hatch);
    const hr = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.06, 8, 40), this.mHaz); hr.position.set(hx, 1.25, hz + 0.06); this.root.add(hr);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 24), this.mDark); wheel.position.set(hx, 1.25, hz + 0.14); this.root.add(wheel);
    this._decal(this._sign(['EXIT', { text: 'EMERGENCY HATCH', size: 40 }], { w: 512, h: 256, bg: '#1c6b3a', fg: '#fff', font: 110 }), 0.7, 0.35, hx, 2.45, H.z0 + 0.012, 0);
    const [dx, dy, dz] = GF.dock;
    this._box(1.4, 0.3, 1.4, dx, dy + 0.1, dz, this.mDark); this._box(1.2, 0.04, 1.2, dx, dy - 0.06, dz, this.mHaz, 0, { noShadow: true });
    this._decal(this._sign(['SECTOR C', { text: 'CORE', size: 70 }], { w: 512, h: 256, font: 110, fg: '#e3dfd2' }), 1.4, 0.7, -0.6, 3.6, z1 - 0.012, Math.PI);
    // big pipes overhead, strip lights
    this._pipes('x', H.x0, H.x1, [-14.0, h - 0.5], [[0, 0, 0.14, this.mPipe], [0, 0.4, 0.09, this.mPipeY]]);
    this._pipes('x', H.x0, H.x1, [-21.0, h - 0.5], [[0, 0, 0.12, this.mPipeR], [0, -0.35, 0.08, this.mPipe]]);
    for (const zz of [-14.8, -17.4, -20.6]) for (const xx of [-0.4, 2.6]) this._strip(xx, h, zz, 1.8, 'z');
    this._control(H.x0 + 0.005, 1.4, -14.3, Math.PI / 2, { screen: 'status' });
    this._beacon(H.x0 + 0.2, h, -13.4); this._beacon(H.x1 - 0.2, h, -18.6);
  }

  /* ---------------- lights ---------------- */
  _lights() {
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight('#c2ccd6', '#2b2826', 0.55); s.add(this.hemi);
    const spot = (c, i, ang, pen, dist) => { const l = new THREE.SpotLight(c, i, dist, ang, pen, 1.6); l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.bias = -0.0006; l.shadow.normalBias = 0.02; l.shadow.camera.near = 0.2; s.add(l); s.add(l.target); return l; };
    this.key = spot('#fff2e4', 30, 0.62, 0.55, 14);
    this.top = spot('#e8f0ff', 26, 1.0, 0.65, 12);
    const pt = (c, d) => { const l = new THREE.PointLight(c, 0, d, 1.6); s.add(l); return l; };
    this.pView = pt('#dfe6ee', 6); this.pCell = pt('#e8eef6', 7); this.pRoute = pt('#ff5a3a', 7); this.pB = pt('#e8f0ff', 8); this.pHall = pt('#d8e6f2', 14); this.pCore = pt('#64d6e8', 9);
    this.pView.position.set(0, 2.7, 1.8); this.pCell.position.set(0, 2.6, -3.0); this.pRoute.position.set(-0.9, 2.2, -7.2);
    this.pB.position.set(GF.corrB.ax, 2.6, -8.4); this.pHall.position.set(1.4, 4.4, -16.5); this.pCore.position.set(GF.core[0], 2.2, GF.core[1] + 1.4);
  }

  _envMap() {
    // reflections for the glass, steel and the floor: a dim box room with a few bright light panels, in a PMREM
    const pm = new THREE.PMREMGenerator(this.renderer), es = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 20), new THREE.MeshBasicMaterial({ color: '#2a2e33', side: THREE.BackSide })); room.position.y = 2; es.add(room);
    const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4.2) });
    for (const [x, z] of [[0, 0], [4, -3], [-4, 3], [3, 4], [-3, -4]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3), lamp); p.rotation.x = Math.PI / 2; p.position.set(x, 4.9, z); es.add(p); }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: '#1a1c1f' })); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.9; es.add(fl);
    const rt = pm.fromScene(es, 0.03, 0.1, 100);
    this.scene.environment = rt.texture; this.scene.environmentIntensity = 0.5;
    pm.dispose();
  }

  /* ---------------- per frame ---------------- */
  // which part of the facility the action is in (positions the two shadow-casting lights)
  _keyLights(t) {
    const K = this.key, T = this.top;
    const set = (L, p, q, i, ang) => { L.position.set(...p); L.target.position.set(...q); L.intensity = i; if (ang) L.angle = ang; L.target.updateMatrixWorld(); };
    if (t < GM.hold.arrive - 0.6) {
      set(K, [0.7, 2.95, 0.5], [-0.05, 1.45, -1.8], 34, 0.6);              // through the glass, onto his face
      set(T, [0.1, 2.95, -3.1], [0, 0, -3.4], 30, 1.05);                    // the cell's ceiling panel
    } else if (t < GM.hold.open[1] + 0.3) {
      set(K, [GF.corrB.ax + 0.2, 2.85, -10.6], [0.55, 0.9, -12.1], 30, 0.7);
      set(T, [GF.corrB.ax, 2.85, -7.4], [GF.corrB.ax, 0, -8.0], 22, 1.0);
    } else if (t < GM.end.cut) {
      set(K, [2.6, 4.95, -13.0], [1.2, 1.3, -15.2], 46, 0.55);
      set(T, [1.07, 5.1, -18.2], [1.07, 0, -18.6], 30, 1.0);
    } else {
      set(K, [2.2, 3.6, -12.4], [1.07, 1.5, -14.6], 40, 0.5);
      set(T, [1.07, 5.1, -18.2], [1.07, 0, -18.6], 18, 1.0);
    }
  }

  update(t) {
    this._keyLights(t);
    const al = this.alarm(t), red = al > 0 ? 0.5 + 0.5 * Math.sin(t * 7.5) : 0;
    // the alarm: red beacons spin, fill lights turn red and pulse, the key lights dim a little
    this.mRedLamp.emissiveIntensity = al * (1.2 + 2.2 * red);
    for (const B of this.beacons || []) { B.piv.rotation.y = t * 6.5 + B.ph; B.cone.material.opacity = 0.11 * al; B.cone.visible = al > 0.01; }
    const sys = this.sysDim(t);
    const calm = t >= GM.end.cut ? 1 : 0;
    this.hemi.intensity = (0.55 - 0.18 * al) * (1 - 0.45 * sys) + 0.1 * calm;
    this.hemi.color.set(al > 0.01 ? '#c9a9a4' : '#c2ccd6');
    this.key.intensity *= (1 - 0.2 * al) * (1 - 0.35 * sys) * this.flicker(t);
    this.top.intensity *= (1 - 0.35 * al) * (1 - 0.5 * sys) * this.flicker(t + 0.37);
    this.pView.intensity = 2.2 * (1 - 0.6 * al) + 6 * al * red; this.pView.color.set(al > 0.01 ? '#ff3a24' : '#dfe6ee');
    this.pCell.intensity = 3.0 * (1 - 0.5 * al) + 5 * al * red; this.pCell.color.set(al > 0.01 ? '#ff4a30' : '#e8eef6');
    this.pRoute.intensity = t > GM.doors[0] ? 3.5 + 2.5 * red + 30 * MathX.impulse(t, GM.choice.blast, 0.25) : 0;
    this.pB.intensity = t > GM.doors[0] && t < GM.roul.ui + 1 ? 4.5 * (1 - 0.3 * al) + 3 * al * red : 0;
    this.pHall.intensity = t > GM.hold.open[0] ? 6.5 * (1 - 0.5 * sys) * this.flicker(t + 0.71) : 0;
    this.pCore.intensity = t > GM.hold.open[0] ? (3.2 + 0.4 * Math.sin(t * 2.1)) * (1 - 0.6 * sys) : 0;
    this.mCore.emissiveIntensity = (1.6 + 0.25 * Math.sin(t * 2.1)) * (1 - 0.5 * sys);
    this.mLamp.emissiveIntensity = 2.4 * this.flicker(t) * (1 - 0.45 * sys);
    for (const b of this.blink) b.m.emissiveIntensity = b.base * (0.25 + 0.75 * (Math.sin(t * b.rate * 6.283 + b.ph) > -0.2 ? 1 : 0)) * (1 - 0.6 * sys);
    // the glass lifts; the back doors slide into the wall; their edge lights
    const gk = Ease.inOutCubic(MathX.clamp((t - GM.glass[0]) / (GM.glass[1] - GM.glass[0]), 0, 1));
    this.glass.position.y = 3.05 * gk; this.glass.visible = gk < 0.995;
    const dk = Ease.inOutCubic(MathX.clamp((t - GM.doors[0]) / (GM.doors[1] - GM.doors[0]), 0, 1));
    const ch = t >= GM.choice.ui && t < GM.choice.zero + 0.6 ? 1 : 0;
    for (const k of ['L', 'R']) {
      const D = this.doors[k];
      D.leaf.position.x = D.D.x + D.dir * (GF.doorL.w + 0.04) * dk;
      D.em.emissive.set(k === 'L' ? (ch ? '#ff6a4a' : '#e9eef2') : (ch ? '#bff5df' : '#e9eef2'));
      D.em.emissiveIntensity = ch ? 1.4 + 0.8 * Math.sin(t * 9) : 0.25 + 0.4 * dk;
    }
    // the blast door: energy while you hold, a heavy lift
    const H = GM.hold, prog = this.holdProgress(t);
    const ek = t >= H.start && t < H.open[0] ? 1 : 0;
    this.energy.forEach((e, i) => { e.material.opacity = ek * MathX.clamp(prog * 1.6 - i * 0.25, 0, 1) * (0.55 + 0.45 * Math.sin(t * 23 + i * 2)); });
    this.mPad.emissiveIntensity = t < H.ui ? 0.35 : t < H.open[0] ? 0.8 + 1.6 * prog + 0.4 * Math.sin(t * 10) : 0.4;
    this.mPad.emissive.set(prog >= 1 ? '#9bf5c4' : '#7fe6f2');
    this.mScan.emissiveIntensity = t > H.palm && t < H.open[0] ? 1.4 + 0.6 * Math.sin(t * 14) : 0.5;
    const ok = Ease.inOutCubic(MathX.clamp((t - H.open[0]) / (H.open[1] - H.open[0]), 0, 1));
    this.blast.position.y = (GF.doorB.h + 0.05) * ok;
    // the supply case
    const R = GM.roul, lid = Ease.outBack(MathX.clamp((t - (R.ui - 0.15)) / 0.4, 0, 1));
    this.caseLid.rotation.x = -1.9 * lid;
    this.mCaseGlow.opacity = t > R.ui ? (t < R.land ? 0.55 + 0.45 * (Math.floor(t * 5) % 2) : 0.5) * (t < GM.sys.flicker ? 1 : 0.4) : 0;
  }

  // 0..1: the alarm (from the alarm until the hall door opens; again for the reset)
  alarm(t) { return MathX.smooth(t, GM.alarm, GM.alarm + 0.15) * (1 - MathX.smooth(t, GM.hold.open[0], GM.hold.open[1])) + (t > GM.reset.n5 && t < GM.reach.cancelled ? MathX.smooth(t, GM.reset.n5, GM.reset.n5 + 0.2) : 0); }
  // 0..1: the system's attention (the place goes quiet and dim)
  sysDim(t) { const S = GM.sys; return MathX.smooth(t, S.flicker, S.flicker + 0.4) * (1 - MathX.smooth(t, GM.drone.drop, GM.drone.drop + 0.6)) * 0.8 + (t > GM.reset.hit && t < GM.reach.cancelled ? 0.5 : 0); }
  // the lights stutter when the system notices you
  flicker(t) {
    const S = GM.sys.flicker; if (t < S || t > S + 1.4) return 1;
    const u = t - S, f = Math.floor(u * 30);
    return [0, 1, 4, 5, 9, 15, 16, 24].includes(f) ? 0.15 : 1;
  }
  holdProgress(t) {
    const H = GM.hold; if (t < H.start) return 0;
    const s = H.steps, v = [0.21, 0.43, 0.68, 0.91, 1.0];
    if (t >= s[4]) return 1;
    let a = H.start, va = 0;
    for (let i = 0; i < 5; i++) { if (t < s[i]) return MathX.lerp(va, v[i], (t - a) / (s[i] - a)); a = s[i]; va = v[i]; }
    return 1;
  }
}
