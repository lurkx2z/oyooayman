/* =====================================================================
   CAFÉ — the set: a corner café interior at sunrise, its facade, and the small plaza outside.
   Authored shapes (bentwood chairs, pedestal tables, brass pendants, mullioned windows, a striped awning,
   a stone fountain, string lights, a tree, a bench, townhouses) with soft canvas textures.
   Everything that reacts to gravity is posed in update(t) as a pure function of time:
   pendant lamps (drop, bounce, faster swing), the hero's chair (creak + sink), the plant and the flower,
   the awning and string lights (more sag, bounce), the fountain (jets at half height), the tree, dust.
   World: interior x −5…5, z −3.5…3.5 (window wall at z = −3.5), floor y = 0; plaza toward −Z; sun low at −Z.
   ===================================================================== */

const GB_SET = {
  heroChair: [-2.75, -2.78],     // hero's chair (he faces +X)
  heroTable: [-2.12, -2.74, 0.36],
  tables: [[-2.12, -2.74, 0.36], [-0.25, -2.55, 0.36], [1.95, -2.6, 0.36], [0.55, 0.7, 0.4], [-2.4, 1.1, 0.4], [3.0, 1.6, 0.36]],
  lamps: [[-2.12, -2.62], [-0.25, -2.5], [1.95, -2.5], [0.7, 0.9], [-2.4, 1.2]],
  ceil: 3.2, tableH: 0.74, lampLen: 1.22,
  fountain: [-1.5, -13.5], fr: 2.5,
  sunDir: new THREE.Vector3(0.1, 0.085, -1).normalize(),     // toward the sun (low, beyond the plaza)
};

function gbCanvasTex(w, h, draw, repeat = true, srgb = true) {
  const c = Tex.canvas(w, h), x = c.getContext('2d');
  draw(x, w, h);
  return Tex.tex(c, { srgb, repeat });
}

class GbCafe {
  constructor(scene) { this.scene = scene; this.root = new THREE.Group(); this.root.name = 'gbCafe'; scene.add(this.root); this.rng = new RNG(CONFIG.seed + 5); }

  build() {
    this._textures();
    this._lights();
    this._sky();
    this._interior();
    this._windows();
    this._furniture();
    this._lamps();
    this._counter();
    this._decor();
    this._facade();
    this._plaza();
    this._fountain();
    this._stringLights();
    this._townhouses();
    this._dust();
  }

  // ------------------------------------------------------------------------------------------ textures
  _textures() {
    const r = new RNG(77);
    this.tx = {};
    this.tx.wood = gbCanvasTex(512, 512, (x, w, h) => {      // warm plank floor
      const n = 8;
      for (let i = 0; i < n; i++) {
        const v = r.range(-12, 12);
        x.fillStyle = `rgb(${120 + v},${78 + v * 0.7},${52 + v * 0.5})`; x.fillRect(0, (i * h) / n, w, h / n);
        for (let k = 0; k < 26; k++) { x.strokeStyle = `rgba(60,34,20,${r.range(0.05, 0.16)})`; x.lineWidth = r.range(0.6, 1.6); const yy = (i * h) / n + r.range(2, h / n - 2); x.beginPath(); x.moveTo(0, yy); x.bezierCurveTo(w * 0.3, yy + r.range(-3, 3), w * 0.6, yy + r.range(-3, 3), w, yy + r.range(-2, 2)); x.stroke(); }
        x.fillStyle = 'rgba(30,16,10,0.55)'; x.fillRect(0, (i * h) / n, w, 2);
        const cut = r.range(0.1, 0.9) * w; x.fillRect(cut, (i * h) / n, 2, h / n);
      }
    });
    this.tx.wood.repeat.set(3, 3);
    this.tx.plaster = gbCanvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#806070'; x.fillRect(0, 0, w, h);
      Tex.blotches(x, w, h, 40, 20, 70, (q) => `rgba(${q.next() < 0.5 ? '50,30,45' : '150,120,130'},${q.range(0.04, 0.1)})`, r);
      Tex.noise(x, w, h, 10, r);
    });
    this.tx.stone = gbCanvasTex(512, 512, (x, w, h) => {      // plaza setts
      x.fillStyle = '#7d7470'; x.fillRect(0, 0, w, h);
      const n = 8;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const v = r.range(-16, 16), off = (j % 2) * 0.5;
        x.fillStyle = `rgb(${128 + v},${118 + v},${112 + v * 0.8})`;
        x.fillRect(((i + off) % n) * w / n + 2, j * h / n + 2, w / n - 4, h / n - 4);
      }
      Tex.blotches(x, w, h, 40, 20, 90, (q) => `rgba(${q.next() < 0.6 ? '40,36,40' : '180,170,160'},${q.range(0.04, 0.12)})`, r);
      Tex.noise(x, w, h, 12, r);
    });
    this.tx.stone.repeat.set(14, 14);
    this.tx.stripes = gbCanvasTex(256, 64, (x, w, h) => {
      const n = 10;
      for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? '#e9dcc4' : '#b2483a'; x.fillRect((i * w) / n, 0, w / n + 1, h); }
      Tex.noise(x, w, h, 10, r);
    });
    this.tx.stripes.repeat.set(4, 1);
    this.tx.brick = gbCanvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#8a6a5c'; x.fillRect(0, 0, w, h);
      const rows = 24, cols = 8;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols + 1; i++) {
        const v = r.range(-14, 14), off = (j % 2) * 0.5;
        x.fillStyle = `rgb(${168 + v},${120 + v * 0.7},${98 + v * 0.6})`;
        x.fillRect((i - off) * w / cols + 2, j * h / rows + 2, w / cols - 4, h / rows - 3);
      }
      Tex.blotches(x, w, h, 50, 30, 120, (q) => `rgba(${q.next() < 0.6 ? '50,36,40' : '200,170,150'},${q.range(0.05, 0.14)})`, r);
    });
    this.tx.brick.repeat.set(3, 3);
    this.tx.sign = gbCanvasTex(1024, 128, (x, w, h) => {
      x.fillStyle = '#1d2a27'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#c9a25a'; x.lineWidth = 4; x.strokeRect(12, 12, w - 24, h - 24);
      x.fillStyle = '#e2bf72'; x.font = '600 70px "Lora", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('C A F É   ·   B A K E R Y', w / 2, h / 2 + 4);
    }, false);
    this.tx.board = gbCanvasTex(256, 320, (x, w, h) => {     // chalkboard menu (generic squiggles, no words)
      x.fillStyle = '#20262a'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(235,228,214,0.75)'; x.lineWidth = 3;
      for (let i = 0; i < 7; i++) { const y = 40 + i * 38; x.beginPath(); x.moveTo(30, y); for (let k = 0; k < 8; k++) x.lineTo(30 + k * 18 + r.range(0, 8), y + r.range(-4, 4)); x.stroke(); x.beginPath(); x.arc(w - 50, y, 6, 0, 7); x.stroke(); }
    }, false);
  }

  // ------------------------------------------------------------------------------------------ lights
  _lights() {
    const S = this.scene;
    this.hemi = new THREE.HemisphereLight('#7c78c8', '#4a2c26', 0.55);
    S.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight('#ffb070', 3.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    S.add(sun); S.add(sun.target);
    this.focusShadow(-1.5, -3, 9);
    // interior: a cool violet bounce from the room + the warm pendants (point lights, no shadows)
    this.fill = new THREE.DirectionalLight('#8f86d8', 0.5);
    this.fill.position.set(6, 5, 8); S.add(this.fill);
    this.pend = GB_SET.lamps.map(([x, z]) => { const L = new THREE.PointLight('#ffb36b', 2.6, 6.5, 1.6); L.position.set(x, 2.0, z); S.add(L); return L; });
    // the window's sky glow into the room (soft, from −Z)
    this.winGlow = new THREE.SpotLight('#ffbf8a', 6, 14, 0.9, 0.9, 1.4);
    this.winGlow.position.set(-1, 2.6, -6.5); this.winGlow.target.position.set(-1, 0.8, 0); S.add(this.winGlow); S.add(this.winGlow.target);
  }

  // shadow box follows the shot (sharp where it matters)
  focusShadow(x, z, r) {
    const s = this.sun, d = GB_SET.sunDir;
    s.position.set(x + d.x * 60, d.y * 60, z + d.z * 60);
    s.target.position.set(x, 0, z);
    const c = s.shadow.camera;
    c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 20; c.far = 110;
    c.updateProjectionMatrix();
  }

  _sky() {
    this.skyMat = gbSkyMaterial();
    // the visible disc sits a little higher than the light so it clears the rooftops in the townhouse gap
    this.skyMat.uniforms.uSun.value.set(0.13, 0.16, -1).normalize();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), this.skyMat);
    sky.frustumCulled = false; sky.renderOrder = -10;
    this.root.add(sky);
    // soft cloud streaks near the horizon (camera-facing cards)
    const cm = new THREE.MeshBasicMaterial({ color: '#f6b38e', transparent: true, opacity: 0.55, depthWrite: false, fog: false });
    const cm2 = new THREE.MeshBasicMaterial({ color: '#b98aa8', transparent: true, opacity: 0.45, depthWrite: false, fog: false });
    const cloudTex = gbCanvasTex(256, 64, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.save(); x.scale(1, 0.25); x.fillRect(0, 0, w, h * 4); x.restore(); }, false);
    cm.map = cloudTex; cm2.map = cloudTex;
    const r = new RNG(9);
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + r.range(-1.3, 1.3) + (i % 3 === 0 ? Math.PI : 0), el = r.range(0.04, 0.2), R = 330;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r.range(60, 140), r.range(5, 12)), i % 2 ? cm : cm2);
      m.position.set(Math.cos(a) * R * Math.cos(el), Math.sin(el) * R, Math.sin(a) * R * Math.cos(el));
      m.lookAt(0, m.position.y * 0.6, 0);
      m.renderOrder = -9; this.root.add(m);
    }
  }

  // ------------------------------------------------------------------------------------------ interior shell
  _interior() {
    const R = this.root, C = GB_SET.ceil;
    const floorM = new THREE.MeshStandardMaterial({ map: this.tx.wood, roughness: 0.62, color: '#d8c0ad', envMapIntensity: 0.4, name: 'gbFloor' });
    gbAdd(R, new THREE.PlaneGeometry(10.2, 7.4), floorM, 0, 0, 0, { rx: -Math.PI / 2, cast: false });
    const wallM = new THREE.MeshStandardMaterial({ map: this.tx.plaster, color: '#9f7f95', roughness: 0.95, name: 'gbWall' });
    const wainM = gbMat('#4b2a34', { rough: 0.7, name: 'gbWainscot' });
    const railM = gbMat('#2d1a20', { rough: 0.55, name: 'gbRail' });
    const ceilM = gbMat('#3a2836', { rough: 0.95, name: 'gbCeil' });
    gbAdd(R, new THREE.PlaneGeometry(10.2, 7.4), ceilM, 0, C, 0, { rx: Math.PI / 2, cast: false });
    // back wall (z = +3.5), side walls (x = ±5)
    const walls = [[0, 3.5, Math.PI, 10.2], [-5.0, 0, Math.PI / 2, 7.4], [5.0, 0, -Math.PI / 2, 7.4]];
    for (const [x, z, ry, w] of walls) {
      gbAdd(R, new THREE.PlaneGeometry(w, C), wallM, x, C / 2, z, { ry });
      const n = new THREE.Vector3(-Math.sin(ry), 0, -Math.cos(ry)).multiplyScalar(-0.02);
      gbAdd(R, new THREE.BoxGeometry(w, 1.0, 0.04), wainM, x + n.x * -1, 0.5, z + n.z * -1, { ry });
      gbAdd(R, new THREE.BoxGeometry(w, 0.05, 0.07), railM, x + n.x * -1.5, 1.02, z + n.z * -1.5, { ry });
      gbAdd(R, new THREE.BoxGeometry(w, 0.12, 0.05), railM, x + n.x * -1.2, 0.06, z + n.z * -1.2, { ry });
      gbAdd(R, new THREE.BoxGeometry(w, 0.14, 0.12), railM, x + n.x * -2, C - 0.07, z + n.z * -2, { ry });   // cornice
    }
    // ceiling beams
    for (let i = -2; i <= 2; i++) gbAdd(R, new THREE.BoxGeometry(0.18, 0.22, 7.4), railM, i * 2.2, C - 0.11, 0);
  }

  // the window wall (z = −3.5): wall pieces around three big windows and a door, muntins, glass, sill
  _windows() {
    const R = this.root, C = GB_SET.ceil, z0 = -3.5, th = 0.22;
    const wallM = new THREE.MeshStandardMaterial({ map: this.tx.plaster, color: '#9f7f95', roughness: 0.95, name: 'gbWall2' });
    const frameM = gbMat('#1d2a27', { rough: 0.6, rim: 0.25, name: 'gbFrame' });
    const glassM = new THREE.MeshStandardMaterial({ color: '#cfd8f0', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false, name: 'gbWindowGlass', envMapIntensity: 1.0 });
    const sill = 0.62, top = 2.62;
    const bays = [[-4.85, -2.45], [-2.25, -0.35], [-0.15, 1.85], [2.15, 2.95, 'door'], [3.15, 4.85]];
    // solid pieces: under the sills, above the tops, posts between bays
    const box = (x0, x1, y0, y1, m = wallM) => gbAdd(R, new THREE.BoxGeometry(x1 - x0, y1 - y0, th), m, (x0 + x1) / 2, (y0 + y1) / 2, z0 - th / 2 + 0.0);
    box(-5.1, 5.1, top, C + 0.05);
    let px = -5.1;
    for (const [a, b, kind] of bays) {
      box(px, a, 0, top);
      if (kind !== 'door') box(a, b, 0, sill);
      px = b;
      // frame + muntins (outer frame, a transom at 2.05, verticals)
      const y0 = kind === 'door' ? 0 : sill, w = b - a, cx = (a + b) / 2;
      const fr = (x, y, ww, hh) => gbAdd(R, new THREE.BoxGeometry(ww, hh, 0.07), frameM, x, y, z0 + 0.02, { cast: true });
      fr(cx, y0 + 0.03, w, 0.06); fr(cx, top - 0.03, w, 0.06); fr(a + 0.03, (y0 + top) / 2, 0.06, top - y0); fr(b - 0.03, (y0 + top) / 2, 0.06, top - y0);
      fr(cx, 2.05, w, 0.05);
      if (kind !== 'door') { const nv = Math.round(w / 0.7); for (let k = 1; k < nv; k++) fr(a + (w * k) / nv, (sill + 2.05) / 2, 0.04, 2.05 - sill); for (let k = 1; k < 3; k++) fr(a + (w * k) / 3, 2.34, 0.035, 0.55); }
      else { fr(cx, 1.0, w, 0.12); gbAdd(R, new THREE.BoxGeometry(0.04, 0.3, 0.04), gbMat('#c9a25a', { rough: 0.3, metal: 0.8 }), b - 0.12, 1.1, z0 + 0.08); }
      const gl = gbAdd(R, new THREE.PlaneGeometry(w, top - y0), glassM, cx, (y0 + top) / 2, z0 - 0.01, { cast: false, receive: false });
      gl.renderOrder = 2;
      // interior sill board
      if (kind !== 'door') gbAdd(R, new THREE.BoxGeometry(w + 0.1, 0.04, 0.26), gbMat('#3c2329', { rough: 0.6 }), cx, sill + 0.02, z0 + 0.1);
    }
    box(px, 5.1, 0, top);
  }

  // ------------------------------------------------------------------------------------------ furniture
  _table(x, z, r, parent = this.root) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const topM = gbMat('#3b2420', { rough: 0.42, rim: 0.2, name: 'gbTableTop', env: 0.6 }), metM = gbMat('#1c1a1e', { rough: 0.45, metal: 0.6, name: 'gbIron' });
    gbAdd(g, new THREE.CylinderGeometry(r, r, 0.035, 40), topM, 0, GB_SET.tableH - 0.018, 0);
    gbAdd(g, new THREE.TorusGeometry(r, 0.012, 6, 40), gbMat('#c09a5a', { rough: 0.3, metal: 0.7 }), 0, GB_SET.tableH - 0.018, 0, { rx: Math.PI / 2 });
    gbAdd(g, gbLathe([[0.0, 0], [0.24, 0.0], [0.22, 0.03], [0.05, 0.08], [0.028, 0.2], [0.024, 0.6], [0.05, 0.68], [0.09, 0.72], [0, 0.72]], 24), metM, 0, 0, 0);
    return g;
  }

  _chair(x, z, yaw, parent = this.root) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; parent.add(g);
    const wM = gbMat('#2a1a18', { rough: 0.5, rim: 0.3, name: 'gbBentwood' }), sM = gbMat('#6a3a2c', { rough: 0.75, name: 'gbSeat' });
    const seat = new THREE.Group(); seat.position.y = 0.46; g.add(seat);
    gbAdd(seat, new THREE.CylinderGeometry(0.21, 0.2, 0.04, 28), sM, 0, 0, 0);
    gbAdd(seat, new THREE.TorusGeometry(0.205, 0.016, 8, 32), wM, 0, -0.02, 0, { rx: Math.PI / 2 });
    // back hoop (behind the sitter: local −Z)
    gbAdd(seat, gbTube([[-0.17, 0, -0.16], [-0.19, 0.25, -0.2], [-0.12, 0.47, -0.23], [0, 0.5, -0.24], [0.12, 0.47, -0.23], [0.19, 0.25, -0.2], [0.17, 0, -0.16]], 0.014, 32, 6), wM);
    gbAdd(seat, gbTube([[-0.15, 0.3, -0.21], [0, 0.33, -0.225], [0.15, 0.3, -0.21]], 0.011, 12, 6), wM);
    const legs = [];
    for (const [lx, lz] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) {
      const L = gbAdd(seat, gbTube([[0, 0, 0], [lx * 0.12, -0.24, lz * 0.12], [lx * 0.32, -0.46, lz * 0.32]], 0.013, 10, 6), wM, lx, -0.01, lz);
      legs.push(L);
    }
    gbAdd(seat, new THREE.TorusGeometry(0.19, 0.009, 6, 28), wM, 0, -0.27, 0, { rx: Math.PI / 2 });
    return { g, seat, legs };
  }

  _furniture() {
    const T = GB_SET.tables;
    this.tables = T.map(([x, z, r]) => this._table(x, z, r));
    // the hero's chair (faces +X) and the other chairs
    const [hx, hz] = GB_SET.heroChair;
    this.heroChair = this._chair(hx, hz, Math.PI / 2);
    const chairs = [[0.4, -2.55, -Math.PI / 2], [-0.25, -1.85, Math.PI], [1.3, -2.6, Math.PI / 2], [2.6, -2.6, -Math.PI / 2], [0.55, 1.4, Math.PI], [-0.05, 0.6, Math.PI / 2],
      [-2.4, 1.8, Math.PI], [-3.1, 1.0, Math.PI / 2], [3.0, 2.3, Math.PI], [-1.5, -2.74, -Math.PI / 2]];
    for (const [x, z, y] of chairs) this._chair(x, z, y);
    // the hero's breakfast: saucer, cup (posed by cast.js), a plate with a croissant, a little vase with a flower
    const [tx, tz] = GB_SET.heroTable, y = GB_SET.tableH;
    const china = gbMat('#efe6d8', { rough: 0.38, rim: 0.35, name: 'gbChina', env: 0.7 });
    this.saucer = gbAdd(this.root, gbLathe([[0, 0], [0.07, 0.0], [0.082, 0.008], [0.078, 0.012], [0.03, 0.006], [0, 0.007]], 32), china, tx - 0.22, y, tz + 0.12);
    gbAdd(this.root, gbLathe([[0, 0], [0.11, 0.0], [0.125, 0.012], [0.12, 0.016], [0.05, 0.008], [0, 0.009]], 36), china, tx + 0.06, y, tz + 0.14);
    const crois = gbMat('#c7843e', { rough: 0.7, rim: 0.4, name: 'gbCroissant' });
    const cr = new THREE.Group(); cr.position.set(tx + 0.06, y + 0.03, tz + 0.14); cr.rotation.y = 0.5; this.root.add(cr);
    for (let k = -3; k <= 3; k++) { const a = k * 0.36; gbAdd(cr, new THREE.SphereGeometry(1, 12, 8), crois, Math.sin(a) * 0.075, 0, Math.cos(a) * 0.075 - 0.075, { s: [0.03 + 0.008 * (1 - Math.abs(k) / 3), 0.018 + 0.014 * (1 - Math.abs(k) / 3), 0.02 + 0.016 * (1 - Math.abs(k) / 3)], ry: a }); }
    this.croissant = cr;
    const vase = gbAdd(this.root, gbLathe([[0, 0], [0.028, 0], [0.034, 0.03], [0.02, 0.08], [0.012, 0.1], [0.016, 0.115], [0, 0.115]], 20), gbMat('#5d7f9e', { rough: 0.2, rim: 0.3, env: 0.8 }), tx + 0.17, y, tz - 0.14);
    this.flower = new THREE.Group(); this.flower.position.set(tx + 0.17, y + 0.11, tz - 0.14); this.root.add(this.flower);
    this.stem = gbAdd(this.flower, new THREE.CylinderGeometry(0.003, 0.004, 0.16, 6), gbMat('#3f6b3a', { rough: 0.8 }), 0, 0.08, 0);
    this.bloom = new THREE.Group(); this.bloom.position.y = 0.16; this.flower.add(this.bloom);
    for (let k = 0; k < 6; k++) gbAdd(this.bloom, new THREE.SphereGeometry(1, 10, 6), gbMat('#e8706a', { rough: 0.7, rim: 0.5 }), Math.cos(k) * 0.016, 0, Math.sin(k * 1.05) * 0.016, { s: [0.018, 0.008, 0.012], ry: k });
    gbAdd(this.bloom, new THREE.SphereGeometry(0.009, 8, 6), gbMat('#f2c14e', { rough: 0.6 }), 0, 0.004, 0);
    this.vase = vase;
    // other tables' cups
    for (const [x, z] of [[1.95, -2.6], [0.55, 0.7], [3.0, 1.6]]) { gbAdd(this.root, gbLathe([[0, 0], [0.06, 0], [0.07, 0.008], [0, 0.008]], 24), china, x + 0.05, y, z); gbAdd(this.root, gbLathe([[0, 0], [0.032, 0], [0.04, 0.07], [0.036, 0.075], [0, 0.075]], 20), china, x + 0.05, y + 0.008, z); }
  }

  // ------------------------------------------------------------------------------------------ pendant lamps
  _lamps() {
    const shadeM = gbMat('#1f3a33', { rough: 0.5, rim: 0.35, name: 'gbShade', side: THREE.DoubleSide });
    const brass = gbMat('#c9a25a', { rough: 0.3, metal: 0.8, name: 'gbBrass', env: 0.8 });
    const bulbM = new THREE.MeshStandardMaterial({ color: '#ffe0b0', emissive: '#ffbf75', emissiveIntensity: 6, name: 'gbBulb' });
    const innerM = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ffb062', emissiveIntensity: 1.4, side: THREE.BackSide, name: 'gbShadeIn' });
    const cordM = gbMat('#151215', { rough: 0.6, name: 'gbCord' });
    this.lamps = GB_SET.lamps.map(([x, z], i) => {
      const piv = new THREE.Group(); piv.position.set(x, GB_SET.ceil, z); this.root.add(piv);
      gbAdd(this.root, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 18), brass, x, GB_SET.ceil - 0.015, z);
      const cord = gbAdd(piv, new THREE.CylinderGeometry(0.006, 0.006, 1, 6), cordM, 0, -0.5, 0, { cast: false });
      const body = new THREE.Group(); piv.add(body);
      gbAdd(body, new THREE.CylinderGeometry(0.025, 0.025, 0.07, 12), brass, 0, 0.02, 0);
      const shade = gbLathe([[0.03, 0.0], [0.05, -0.02], [0.12, -0.12], [0.2, -0.24], [0.205, -0.25]], 32);
      gbAdd(body, shade, shadeM, 0, 0, 0);
      gbAdd(body, gbLathe([[0.03, -0.005], [0.05, -0.025], [0.118, -0.12], [0.196, -0.24], [0.2, -0.25]], 32), innerM, 0, 0, 0, { cast: false });
      gbAdd(body, new THREE.TorusGeometry(0.203, 0.006, 6, 32), brass, 0, -0.25, 0, { rx: Math.PI / 2, cast: false });
      gbAdd(body, new THREE.SphereGeometry(0.045, 14, 10), bulbM, 0, -0.17, 0, { cast: false });
      return { piv, cord, body, i };
    });
  }

  // ------------------------------------------------------------------------------------------ counter, shelves, machine (x = +5 wall)
  _counter() {
    const R = this.root, g = new THREE.Group(); R.add(g);
    const woodM = gbMat('#4a2a24', { rough: 0.6, rim: 0.2, name: 'gbCounter' }), topM = gbMat('#d9cdb8', { rough: 0.35, name: 'gbMarble', env: 0.6 });
    const tileM = new THREE.MeshStandardMaterial({ color: '#7fa39a', roughness: 0.4, name: 'gbTiles', map: gbCanvasTex(256, 256, (x, w, h) => { x.fillStyle = '#c8d8d0'; x.fillRect(0, 0, w, h); x.fillStyle = '#a9c2b8'; for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) x.fillRect(i * 64 + 2 + (j % 2) * 32, j * 32 + 2, 60, 28); }) });
    tileM.map.repeat.set(3, 2);
    gbAdd(g, new THREE.PlaneGeometry(4.4, 1.6), tileM, 4.97, 1.85, 0.6, { ry: -Math.PI / 2, cast: false });
    gbAdd(g, gbRoundBox(0.7, 1.0, 3.8, 0.03, 2), woodM, 4.15, 0.5, 0.7);
    for (let k = 0; k < 6; k++) gbAdd(g, new THREE.BoxGeometry(0.02, 0.8, 0.5), gbMat('#3a201c', { rough: 0.6 }), 3.79, 0.48, -0.9 + k * 0.62);
    gbAdd(g, gbRoundBox(0.82, 0.05, 3.9, 0.02, 2), topM, 4.12, 1.02, 0.7);
    // shelves with cups and jars
    const shelfM = gbMat('#3a2420', { rough: 0.6 }), china = gbMat('#efe6d8', { rough: 0.38, rim: 0.2 }), jarM = gbMat('#c78a4a', { rough: 0.3, rim: 0.3, env: 0.8 });
    for (const y of [1.75, 2.25]) {
      gbAdd(g, new THREE.BoxGeometry(0.3, 0.04, 3.2), shelfM, 4.82, y, 0.7);
      for (let k = 0; k < 9; k++) { const z = -0.7 + k * 0.33; if (y > 2) gbAdd(g, gbLathe([[0, 0], [0.05, 0], [0.055, 0.14], [0.04, 0.16], [0.02, 0.18], [0, 0.18]], 16), k % 2 ? jarM : gbMat('#8a9a6a', { rough: 0.3, rim: 0.3 }), 4.82, y + 0.02, z); else gbAdd(g, gbLathe([[0, 0], [0.034, 0], [0.042, 0.075], [0.038, 0.08], [0, 0.08]], 16), china, 4.82, y + 0.02, z); }
    }
    // espresso machine
    const mach = new THREE.Group(); mach.position.set(4.3, 1.045, 0.2); g.add(mach);
    gbAdd(mach, gbRoundBox(0.5, 0.42, 0.7, 0.05, 3), gbMat('#b7b2ad', { rough: 0.25, metal: 0.85, env: 1.0, rim: 0.3 }), 0, 0.21, 0);
    gbAdd(mach, gbRoundBox(0.52, 0.06, 0.72, 0.02, 2), gbMat('#7c2f2a', { rough: 0.4, rim: 0.3 }), 0, 0.44, 0);
    for (const z of [-0.15, 0.15]) gbAdd(mach, new THREE.CylinderGeometry(0.035, 0.03, 0.08, 12), gbMat('#2a2a2e', { rough: 0.4, metal: 0.6 }), -0.27, 0.12, z, { rz: Math.PI / 2 });
    // chalkboard
    gbAdd(g, new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshStandardMaterial({ map: this.tx.board, roughness: 0.9 }), 4.96, 2.4, -1.35, { ry: -Math.PI / 2, cast: false });
    gbAdd(g, new THREE.BoxGeometry(0.04, 1.18, 0.98), shelfM, 4.98, 2.4, -1.35);
  }

  // ------------------------------------------------------------------------------------------ decor: plants, frames, hanging plant
  _decor() {
    const R = this.root, potM = gbMat('#b0603e', { rough: 0.8, rim: 0.3 }), leafM = gbMat('#3e6a45', { rough: 0.75, rim: 0.45, side: THREE.DoubleSide, name: 'gbLeaf' });
    const leafG = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.09, 0.1, 0, 0.3); s.quadraticCurveTo(-0.09, 0.1, 0, 0); return new THREE.ShapeGeometry(s, 6); })();
    // a big potted plant in the window corner (leaves droop with gravity)
    this.plants = [];
    const plant = (x, z, n, sc, hang = false) => {
      const g = new THREE.Group(); g.position.set(x, hang ? 2.3 : 0, z); R.add(g);
      if (!hang) gbAdd(g, gbLathe([[0, 0], [0.16, 0], [0.2, 0.36], [0.21, 0.4], [0, 0.4]], 20), potM, 0, 0, 0);
      else { gbAdd(g, gbLathe([[0, -0.15], [0.12, -0.12], [0.16, 0.02], [0, 0.02]], 18), gbMat('#d8c8b0', { rough: 0.8 }), 0, 0, 0); gbAdd(g, new THREE.CylinderGeometry(0.004, 0.004, 0.9, 4), gbMat('#a08060'), 0, 0.45, 0, { cast: false }); }
      const leaves = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + hash1(k + x * 10) * 0.6, piv = new THREE.Group();
        piv.position.set(0, hang ? 0.0 : 0.38, 0); piv.rotation.y = a; g.add(piv);
        const tilt = new THREE.Group(); piv.add(tilt);
        const base = hang ? 1.9 + hash1(k) * 0.6 : 0.35 + hash1(k * 3) * 0.6;
        tilt.rotation.x = base;
        gbAdd(tilt, leafG, leafM, 0, 0, 0, { s: sc * (0.8 + hash1(k * 7) * 0.5), cast: true });
        leaves.push({ tilt, base, k });
      }
      this.plants.push({ g, leaves, hang });
    };
    plant(-4.55, -3.05, 14, 1.4);
    plant(4.55, -3.05, 12, 1.2);
    plant(-4.2, -2.9, 10, 0.9, true);
    plant(3.6, -3.0, 9, 0.9, true);
    // framed pictures (abstract sunrise shapes) on the left wall
    const frM = gbMat('#c9a25a', { rough: 0.35, metal: 0.6 });
    const art = (c1, c2) => new THREE.MeshStandardMaterial({ roughness: 0.9, map: gbCanvasTex(128, 160, (x, w, h) => { x.fillStyle = c1; x.fillRect(0, 0, w, h); x.fillStyle = c2; x.beginPath(); x.arc(w / 2, h * 0.62, w * 0.3, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, h * 0.7, w, h * 0.3); }, false) });
    for (const [z, y, c1, c2] of [[-1.6, 1.9, '#3b3a6a', '#f0a060'], [-0.4, 2.05, '#6a3a4a', '#f2d080'], [0.9, 1.85, '#2f5a5a', '#e07a5a']]) {
      gbAdd(R, new THREE.BoxGeometry(0.04, 0.62, 0.5), frM, -4.97, y, z);
      gbAdd(R, new THREE.PlaneGeometry(0.42, 0.54), art(c1, c2), -4.94, y, z, { ry: Math.PI / 2, cast: false });
    }
  }

  // ------------------------------------------------------------------------------------------ the facade (outside face of the window wall)
  _facade() {
    const R = this.root, z0 = -3.72;
    const frontM = gbMat('#1d2a27', { rough: 0.55, rim: 0.2, name: 'gbShopfront' });
    const brickM = new THREE.MeshStandardMaterial({ map: this.tx.brick, color: '#e0c8b8', roughness: 0.92, name: 'gbBrick' });
    // shopfront: pilasters + stall risers + fascia (sign)
    for (const x of [-5.1, -2.35, -0.25, 2.05, 3.05, 5.1]) gbAdd(R, gbRoundBox(0.24, 2.7, 0.14, 0.02, 2), frontM, x, 1.35, z0 + 0.02);
    for (const [a, b] of [[-4.85, -2.45], [-2.25, -0.35], [-0.15, 1.85], [3.15, 4.85]]) gbAdd(R, gbRoundBox(b - a, 0.62, 0.1, 0.02, 2), frontM, (a + b) / 2, 0.31, z0 + 0.04);
    const sign = gbAdd(R, new THREE.PlaneGeometry(9.6, 0.5), new THREE.MeshStandardMaterial({ map: this.tx.sign, roughness: 0.55, emissive: '#3a2a10', emissiveIntensity: 0.4 }), 0, 3.3, z0 - 0.01, { ry: Math.PI, cast: false });
    gbAdd(R, new THREE.BoxGeometry(10.6, 0.7, 0.18), frontM, 0, 3.3, z0 + 0.1);
    // upper floors: brick, sash windows (some lit), cornice
    gbAdd(R, new THREE.PlaneGeometry(10.8, 7.4), brickM, 0, 7.35, z0 + 0.05, { ry: Math.PI, cast: true });
    gbAdd(R, new THREE.BoxGeometry(10.8, 7.6, 0.3), gbMat('#4a3438', { rough: 0.9 }), 0, 7.3, z0 + 0.25);
    gbAdd(R, gbRoundBox(11.2, 0.35, 0.5, 0.05, 2), gbMat('#d8c8b0', { rough: 0.8, rim: 0.2 }), 0, 11.1, z0 - 0.1);
    const winDark = gbMat('#2a2438', { rough: 0.15, env: 1.0, name: 'gbUpperGlass' }), winLit = new THREE.MeshStandardMaterial({ color: '#ffcf8a', emissive: '#ffa860', emissiveIntensity: 1.5, name: 'gbLitWin' });
    const sashM = gbMat('#e8dcc8', { rough: 0.7, rim: 0.2 });
    for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) {
      const x = -3.9 + i * 2.6, y = 5.4 + row * 3.0;
      gbAdd(R, new THREE.BoxGeometry(1.2, 1.7, 0.08), sashM, x, y, z0 - 0.02);
      gbAdd(R, new THREE.PlaneGeometry(1.0, 1.5), hash1(i * 5 + row * 11) > 0.6 ? winLit : winDark, x, y, z0 - 0.07, { ry: Math.PI, cast: false });
      gbAdd(R, new THREE.BoxGeometry(1.0, 0.04, 0.05), sashM, x, y, z0 - 0.09);
      gbAdd(R, gbRoundBox(1.4, 0.1, 0.25, 0.02, 2), sashM, x, y - 0.92, z0 - 0.1);
    }
    // the striped awning (dynamic: it sags more under 2 g) + a scalloped valance
    const aw = new THREE.PlaneGeometry(9.8, 1.25, 24, 6);
    aw.rotateX(-Math.PI / 2);
    this.awBase = aw.attributes.position.array.slice();
    const awM = new THREE.MeshStandardMaterial({ map: this.tx.stripes, roughness: 0.9, side: THREE.DoubleSide, name: 'gbAwning' });
    this.awning = gbAdd(R, aw, awM, 0, 0, 0);
    this.awningV = gbAdd(R, new THREE.PlaneGeometry(9.8, 0.22, 24, 1), awM, 0, 0, 0);
    this.awVBase = this.awningV.geometry.attributes.position.array.slice();
    gbAdd(R, new THREE.CylinderGeometry(0.025, 0.025, 9.9, 8), frontM, 0, 2.98, z0 - 0.05, { rz: Math.PI / 2 });
    // the hanging blade sign + side buildings
    const sideM1 = gbMat('#6a5a7a', { rough: 0.9, rim: 0.15 }), sideM2 = gbMat('#8a6a52', { rough: 0.9, rim: 0.15 });
    gbAdd(R, new THREE.BoxGeometry(7, 9.5, 8), sideM1, -8.7, 4.75, -0.3);
    gbAdd(R, new THREE.BoxGeometry(7, 12.5, 8), sideM2, 8.7, 6.25, -0.6);
    for (const [x, zz, h, m] of [[-8.7, -4.35, 9.5, sideM1], [8.7, -4.65, 12.5, sideM2]]) for (let r2 = 0; r2 < 3; r2++) for (let i = 0; i < 3; i++) {
      const lit = hash1(x + r2 * 3 + i) > 0.62;
      gbAdd(R, new THREE.PlaneGeometry(0.9, 1.3), lit ? winLit : winDark, x - 2.2 + i * 2.2, 2.0 + r2 * 3.2, zz - 0.01, { ry: Math.PI, cast: false });
    }
  }

  // ------------------------------------------------------------------------------------------ plaza: ground, tree, bench, lamp posts, planters
  _plaza() {
    const R = this.root;
    const gm = new THREE.MeshStandardMaterial({ map: this.tx.stone, color: '#c8b4a8', roughness: 0.82, name: 'gbSetts' });
    gbAdd(R, new THREE.PlaneGeometry(90, 70), gm, 0, -0.005, -36, { rx: -Math.PI / 2, cast: false });
    // a sidewalk band along the facade
    gbAdd(R, new THREE.BoxGeometry(24, 0.06, 2.6), gbMat('#9a8f88', { rough: 0.85 }), 0, 0.0, -5.0, { cast: false });
    // tree (faceted crown clusters; they droop under 2 g)
    const trunkM = gbMat('#3a2a26', { rough: 0.9, rim: 0.3 }), leafM = gbMat('#3d5c3a', { rough: 0.85, rim: 0.4, flat: true, name: 'gbCrown' }), leafM2 = gbMat('#4d6e3e', { rough: 0.85, rim: 0.45, flat: true });
    this.tree = new THREE.Group(); this.tree.position.set(-9.4, 0, -10.6); R.add(this.tree);
    gbAdd(this.tree, gbLathe([[0.3, 0], [0.2, 0.3], [0.17, 2.4], [0.12, 3.4], [0, 3.5]], 10), trunkM);
    this.treePuffs = [];
    const r = new RNG(31);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2, rr = k === 0 ? 0 : r.range(0.9, 1.6), y = k === 0 ? 4.6 : r.range(3.4, 4.8);
      const piv = new THREE.Group(); piv.position.set(0, 2.6, 0); this.tree.add(piv);
      const m = gbAdd(piv, new THREE.IcosahedronGeometry(r.range(0.8, 1.15), 1), k % 2 ? leafM : leafM2, Math.cos(a) * rr, y - 2.6, Math.sin(a) * rr, { s: [1, 0.8, 1] });
      this.treePuffs.push({ piv, m, k, rr });
      if (k) gbAdd(this.tree, gbTube([[0, 2.4, 0], [Math.cos(a) * rr * 0.5, 3.0, Math.sin(a) * rr * 0.5], [Math.cos(a) * rr * 0.9, y - 0.4, Math.sin(a) * rr * 0.9]], 0.06, 8, 5), trunkM);
    }
    gbAdd(R, new THREE.CylinderGeometry(1.1, 1.1, 0.25, 24), gbMat('#5a4a44', { rough: 0.9 }), -9.4, 0.12, -10.6);
    // bench
    const bM = gbMat('#4a3026', { rough: 0.7, rim: 0.3 }), iron = gbMat('#1c1a1e', { rough: 0.5, metal: 0.5 });
    const bench = new THREE.Group(); bench.position.set(5.6, 0, -11.2); bench.rotation.y = -Math.PI / 2 + 0.35; R.add(bench);
    for (let k = 0; k < 4; k++) gbAdd(bench, gbRoundBox(1.8, 0.04, 0.09, 0.015, 2), bM, 0, 0.46, -0.16 + k * 0.1);
    for (let k = 0; k < 3; k++) gbAdd(bench, gbRoundBox(1.8, 0.09, 0.035, 0.012, 2), bM, 0, 0.62 + k * 0.12, -0.22, { rx: -0.2 });
    for (const x of [-0.8, 0.8]) gbAdd(bench, gbRoundBox(0.06, 0.46, 0.5, 0.01, 2), iron, x, 0.23, -0.05);
    this.bench = bench;
    // two iron lamp posts that hold the string lights (by the fountain)
    this.posts = [[-7.7, -15.8], [4.7, -15.8]];
    for (const [x, z] of this.posts) {
      gbAdd(R, gbLathe([[0.14, 0], [0.12, 0.3], [0.06, 0.4], [0.05, 4.3], [0.08, 4.4], [0, 4.45]], 12), iron, x, 0, z);
      gbAdd(R, new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshStandardMaterial({ color: '#ffe2b8', emissive: '#ffc07a', emissiveIntensity: 2.5 }), x, 4.6, z, { cast: false });
    }
    // planters along the facade
    for (const x of [-4.2, 4.2]) {
      gbAdd(R, gbRoundBox(1.4, 0.5, 0.5, 0.04, 2), gbMat('#3a3236', { rough: 0.8 }), x, 0.25, -4.4);
      for (let k = 0; k < 5; k++) gbAdd(R, new THREE.IcosahedronGeometry(0.25, 1), leafM2, x - 0.5 + k * 0.25, 0.62, -4.4 + (k % 2) * 0.1, { s: [1, 0.8, 1] });
    }
  }

  // ------------------------------------------------------------------------------------------ fountain (water drawn as instanced droplets on ballistic arcs)
  _fountain() {
    const R = this.root, [fx, fz] = GB_SET.fountain, rr = GB_SET.fr;
    const stoneM = gbMat('#b8a89a', { rough: 0.8, rim: 0.35, name: 'gbFountainStone' }), darkM = gbMat('#857468', { rough: 0.85 });
    const g = this.fountainG = new THREE.Group(); g.position.set(fx, 0, fz); R.add(g);
    gbAdd(g, gbLathe([[rr + 0.25, 0], [rr + 0.3, 0.45], [rr + 0.18, 0.55], [rr - 0.05, 0.55], [rr - 0.08, 0.1], [0, 0.1]], 48), stoneM);
    this.waterM = new THREE.MeshStandardMaterial({ color: '#2e3f55', roughness: 0.06, metalness: 0.2, envMapIntensity: 1.8, name: 'gbFountainWater', emissive: '#2a2240', emissiveIntensity: 0.25 });
    gbAdd(g, new THREE.CircleGeometry(rr - 0.06, 48), this.waterM, 0, 0.42, 0, { rx: -Math.PI / 2, cast: false });
    gbAdd(g, gbLathe([[0.4, 0.4], [0.28, 0.6], [0.2, 1.1], [0.32, 1.25], [0.75, 1.32], [0.8, 1.42], [0.7, 1.45], [0.18, 1.4], [0.12, 1.6], [0.08, 1.75], [0, 1.78]], 32), stoneM);
    gbAdd(g, new THREE.CircleGeometry(0.72, 32), this.waterM, 0, 1.43, 0, { rx: -Math.PI / 2, cast: false });
    // droplets
    const N = this.dropN = 1500;
    const dg = new THREE.SphereGeometry(1, 6, 4);
    this.dropM = new THREE.MeshStandardMaterial({ color: '#dfeeff', roughness: 0.15, emissive: '#ffd8a8', emissiveIntensity: 0.55, transparent: true, opacity: 0.85, depthWrite: false, name: 'gbDroplet' });
    this.drops = new THREE.InstancedMesh(dg, this.dropM, N);
    this.drops.frustumCulled = false; this.drops.castShadow = false;
    g.add(this.drops);
    // the central jet's glassy core (scaled to the current height)
    this.jetM = new THREE.MeshStandardMaterial({ color: '#e8f2ff', roughness: 0.1, emissive: '#ffd2a0', emissiveIntensity: 0.45, transparent: true, opacity: 0.55, depthWrite: false, name: 'gbJet' });
    this.jet = gbAdd(g, new THREE.CylinderGeometry(0.03, 0.07, 1, 14, 1, true), this.jetM, 0, 1.78, 0, { cast: false });
    // the old (1 g) jet height marker, dashed, shown in the wide reveal
    const dash = new THREE.LineDashedMaterial({ color: '#ffe6c2', dashSize: 0.12, gapSize: 0.09, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.1, 0, 0), new THREE.Vector3(1.1, 0, 0)]);
    this.oldLine = new THREE.Line(lg, dash); this.oldLine.computeLineDistances(); this.oldLine.renderOrder = 5; g.add(this.oldLine);
    this.oldLineM = dash;
    this._m4 = new THREE.Matrix4(); this._q4 = new THREE.Quaternion(); this._v4 = new THREE.Vector3(); this._s4 = new THREE.Vector3(); this._up = new THREE.Vector3(0, 1, 0);
  }

  // ------------------------------------------------------------------------------------------ string lights (catenaries from the facade to the two posts)
  _stringLights() {
    const z0 = -3.75, y0 = 3.62;
    const ends = [[[-4.6, y0, z0], [-7.7, 4.4, -15.8]], [[-1.6, y0, z0], [-7.7, 4.3, -15.8]], [[1.6, y0, z0], [4.7, 4.3, -15.8]], [[4.6, y0, z0], [4.7, 4.4, -15.8]],
      [[-7.7, 4.42, -15.8], [4.7, 4.42, -15.8]]];
    this.strands = ends.map(([a, b], i) => {
      const nb = Math.round(new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b)) / 0.75);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(41 * 3), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#141016' })); line.frustumCulled = false; this.root.add(line);
      return { a: new THREE.Vector3(...a), b: new THREE.Vector3(...b), nb, line, i, sag0: i === 4 ? 0.55 : 0.6 };
    });
    const total = this.strands.reduce((s, S) => s + S.nb, 0);
    this.bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffe3b5', emissive: '#ffb763', emissiveIntensity: 4.0, name: 'gbStringBulb' }), total);
    this.bulbs.frustumCulled = false; this.root.add(this.bulbs);
  }

  // ------------------------------------------------------------------------------------------ townhouses beyond the plaza (backlit by the sunrise)
  _townhouses() {
    const R = this.root, r = new RNG(55);
    const cols = ['#5a4a6e', '#6e4e5e', '#4e4a68', '#7a5a5c', '#5e5470'];
    const lit = new THREE.MeshStandardMaterial({ color: '#ffc88a', emissive: '#ff9f50', emissiveIntensity: 1.7, name: 'gbFarLit' });
    let x = -26;
    while (x < 26) {
      if (x > -1.5 && x < 6) { x = 6; continue; }       // a street opening where the sun comes up
      const w = r.range(4.5, 7.5), h = r.range(7, 14), z = -30 - r.range(0, 3);
      const m = gbMat(cols[Math.floor(r.next() * cols.length)], { rough: 0.95, rim: 0.25 });
      gbAdd(R, new THREE.BoxGeometry(w, h, 6), m, x + w / 2, h / 2, z - 3);
      // a gable or a flat roof
      if (r.next() > 0.5) { const roof = gbAdd(R, new THREE.CylinderGeometry(0.01, w * 0.72, 2.2, 4, 1), gbMat('#3a2e42', { rough: 0.9 }), x + w / 2, h + 1.1, z - 3, { ry: Math.PI / 4, s: [1, 1, 0.6] }); }
      for (let fl = 0; fl < Math.floor(h / 3); fl++) for (let k = 0; k < Math.floor(w / 1.8); k++) {
        const on = r.next() > 0.55;
        gbAdd(R, new THREE.PlaneGeometry(0.8, 1.2), on ? lit : gbMat('#2a2236', { rough: 0.3 }), x + 1.0 + k * 1.8, 1.6 + fl * 3, z + 0.01, { cast: false });
      }
      x += w + r.range(0.1, 0.6);
    }
  }

  // floating dust in the window light (they settle faster in 2 g)
  _dust() {
    this.dust = new BillboardSystem(this.scene, 220, true);
  }

  // ------------------------------------------------------------------------------------------ per-frame (pure function of t)
  update(t, camera) {
    const g = gbG(t), u = gbSince(t), on = u > 0 ? 1 : 0;
    // ---- pendant lamps: drop + bounce on the cord at the switch, then swing at the new (faster) period
    for (const L of this.lamps) {
      const ph = L.i * 1.7;
      const len0 = GB_SET.lampLen, stretch = on * (0.07 * MathX.smooth(u, 0, 0.12) + gbSpring(t, GB.g, 0.06, 2.2, 2.0));
      const len = len0 + stretch;
      const w1 = Math.sqrt(9.81 / len0), w2 = Math.sqrt(19.62 / len0);
      const pre = 0.018 * Math.sin(w1 * t + ph);
      const post = on * (0.17 + 0.03 * L.i) * Math.exp(-0.16 * u) * Math.sin(w2 * u + 0.3 * L.i);
      const ax = pre * (1 - MathX.smooth(u, 0, 0.3)) + post, az = 0.6 * post * Math.cos(L.i) + 0.012 * Math.sin(w1 * t * 0.9 + ph);
      L.piv.rotation.set(az, 0, ax);
      L.cord.scale.y = len; L.cord.position.y = -len / 2;
      L.body.position.y = -len;
      const light = this.pend[L.i];
      L.body.getWorldPosition(light.position); light.position.y -= 0.15;
      light.intensity = 2.6 * (1 + 0.04 * Math.sin(t * 13 + L.i));
    }
    // ---- the hero's chair: creak and sink (the legs splay a little, the seat drops 1.5 cm with a bounce)
    {
      const C = this.heroChair, d = on * (0.012 * MathX.smooth(u, 0, 0.1) + gbSpring(t, GB.g + 0.04, 0.01, 6, 5));
      C.seat.position.y = 0.46 - d;
      C.legs.forEach((L, i) => { L.scale.y = 1 - d * 1.2; L.rotation.z = (i % 2 ? -1 : 1) * d * 0.6; });
      C.g.rotation.z = gbSpring(t, GB.g + 0.04, 0.012, 5, 4) * on;
    }
    // ---- plants and the flower: leaves droop under the new weight, with a springy settle
    const droop = on * gbSettle(t, GB.g, 0.7, 0.25, 2.4);
    for (const P of this.plants) for (const L of P.leaves) {
      const sway = 0.04 * Math.sin(t * 1.3 + L.k * 1.7) * (1 - 0.5 * droop);
      L.tilt.rotation.x = L.base + (P.hang ? 0.25 : 0.55) * droop * (0.7 + 0.6 * hash1(L.k * 13)) + sway;
    }
    this.flower.rotation.z = -0.03 * Math.sin(t * 1.1) - 0.9 * droop;
    this.flower.rotation.x = 0.25 * droop;
    this.bloom.rotation.z = -0.6 * droop;
    // ---- awning sag (+ a wobble), valance follows its front edge
    {
      const sag = 0.06 + on * (0.16 * gbSettle(t, GB.g, 0.6, 0.3, 2.0) + gbSpring(t, GB.g, 0.03, 3.1, 1.6)), z0 = -3.72;
      const p = this.awning.geometry.attributes.position, B = this.awBase;
      for (let i = 0; i < p.count; i++) {
        const x = B[i * 3], zz = B[i * 3 + 2];       // zz −0.625…0.625 across the depth (front = +0.625 after rotateX(−90°): local z)
        const k = (zz + 0.625) / 1.25;                   // 0 at the wall … 1 at the front
        const across = Math.sin(Math.PI * (x / 9.8 + 0.5)) * 0.6 + 0.4;
        const y = 3.0 - k * 0.5 - sag * Math.sin(Math.PI * Math.min(1, k * 1.15)) * across - 0.02 * Math.sin(x * 3 + t * 2) * k;
        p.setXYZ(i, x, y, z0 - k * 1.2);
      }
      p.needsUpdate = true; this.awning.geometry.computeVertexNormals();
      const v = this.awningV.geometry.attributes.position, VB = this.awVBase;
      for (let i = 0; i < v.count; i++) {
        const x = VB[i * 3], yy = VB[i * 3 + 1];
        const across = Math.sin(Math.PI * (x / 9.8 + 0.5)) * 0.6 + 0.4;
        const top = 3.0 - 0.5 - sag * Math.sin(Math.PI * 1) * 0 - sag * 0.15 * across;
        const scal = yy < 0 ? -0.04 * (1 - Math.abs(Math.cos(x * 5.2))) : 0;
        v.setXYZ(i, x, top + (yy - 0.11) + scal - 0.02 * Math.sin(x * 3 + t * 2), z0 - 1.2);
      }
      v.needsUpdate = true;
    }
    // ---- string lights: catenary sag grows (0.6 → ~0.95 m), with a bounce and a slow swing
    {
      const P = this.bulbs, m = this._m4, q = this._q4, s = this._s4.set(1, 1, 1), pt = this._v4;
      let bi = 0;
      for (const S of this.strands) {
        const sag = S.sag0 + on * (0.34 * gbSettle(t, GB.g + 0.03 * S.i, 0.9, 0.35, 1.3)) + 0.02 * Math.sin(t * 0.7 + S.i);
        const swing = on * gbSpring(t, GB.g + 0.03 * S.i, 0.22, 0.55, 0.35) + 0.03 * Math.sin(t * 0.6 + S.i * 2);
        const pos = S.line.geometry.attributes.position;
        const at = (k, out) => {
          out.lerpVectors(S.a, S.b, k);
          const d = 4 * k * (1 - k);
          out.y -= sag * d; out.x += swing * d * 0.4 * (S.i % 2 ? 1 : -1); out.z += swing * d * 0.25;
          return out;
        };
        for (let i = 0; i <= 40; i++) { at(i / 40, pt); pos.setXYZ(i, pt.x, pt.y, pt.z); }
        pos.needsUpdate = true;
        for (let k = 0; k < S.nb; k++) { at((k + 0.5) / S.nb, pt); pt.y -= 0.07; m.compose(pt, q, s); P.setMatrixAt(bi++, m); }
      }
      P.instanceMatrix.needsUpdate = true;
    }
    // ---- the tree: crown clusters droop a little and bounce
    for (const T of this.treePuffs) {
      const d = on * (0.1 * gbSettle(t, GB.g + 0.05 * T.k, 0.8, 0.3, 1.8)) * (T.rr / 1.6);
      T.piv.rotation.z = (T.k % 2 ? 1 : -1) * d * 0.4 + 0.012 * Math.sin(t * 0.9 + T.k);
      T.piv.position.y = 2.6 - d * 1.5;
    }
    // ---- fountain (only computed when it can be seen)
    this._updateFountain(t, g);
    // ---- dust motes in the window light (drift; they settle faster in 2 g)
    const D = this.dust; D.begin(this.scene.fog);
    if (camera && camera.position.z > -3.6) {
      for (let i = 0; i < 200; i++) {
        const fall = 0.02 + 0.03 * (g - 1), life = 9;
        const ph = (t / life + hash1(i * 3)) % 1;
        const x = -4.6 + hash1(i * 7) * 9.2, z = -3.3 + hash1(i * 11) * 2.4;
        const y = 0.5 + hash1(i * 13) * 2.3 - ph * life * fall + 0.06 * Math.sin(t * 0.4 + i);
        const a = 0.22 * Math.sin(Math.PI * ph) * (0.4 + 0.6 * hash1(i * 17));
        D.push(x + 0.05 * Math.sin(t * 0.3 + i), y, z, 0.012 + 0.012 * hash1(i * 19), 0, a, 1, 1.0, 0.8, 0.55);
      }
    }
    D.end();
  }

  // droplets on ballistic arcs: v0 is fixed by the pump (unchanged), so the arc height is v0²/2g — half in 2 g
  _updateFountain(t, gNow) {
    const g = 9.81 * gNow, N = this.dropN, m = this._m4, q = this._q4, s = this._s4, p = this._v4, up = this._up;
    const H1 = 3.1, v0c = Math.sqrt(2 * 9.81 * H1), vr = Math.sqrt(2 * 9.81 * 1.25);
    const Hc = v0c * v0c / (2 * g);
    this.jet.scale.y = Hc * 0.92; this.jet.position.y = 1.78 + Hc * 0.46;
    const vel = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      let x0, y0, z0, vx, vy, vz;
      const central = i < 900;
      if (central) {      // the central jet: an umbrella falling into the upper bowl and over its rim
        const a = hash1(i * 3.1) * Math.PI * 2, spread = 0.12 + 0.6 * Math.pow(hash1(i * 5.7), 1.5);
        x0 = 0; y0 = 1.78; z0 = 0; vx = Math.cos(a) * spread; vz = Math.sin(a) * spread; vy = v0c * (0.97 + 0.03 * hash1(i * 7.3));
      } else {            // eight ring jets arcing inward from the basin
        const j = (i - 900) % 8, a = (j / 8) * Math.PI * 2, r0 = 1.85;
        x0 = Math.cos(a) * r0; z0 = Math.sin(a) * r0; y0 = 0.45;
        const inward = 0.95 + 0.15 * hash1(i * 2.3);
        vx = -Math.cos(a) * inward; vz = -Math.sin(a) * inward; vy = vr * (0.95 + 0.05 * hash1(i * 4.1));
        const sp = 0.06 * (hash1(i * 9.1) - 0.5); vx += sp; vz += sp;
      }
      const T = 2 * vy / g * (central ? 1.0 : 1.0);
      const tau = ((t / T) + hash1(i * 13.7)) % 1 * T;
      p.set(x0 + vx * tau, y0 + vy * tau - 0.5 * g * tau * tau, z0 + vz * tau);
      vel.set(vx, vy - g * tau, vz);
      const sp2 = vel.length();
      q.setFromUnitVectors(up, vel.normalize());
      const r = central ? 0.014 : 0.012;
      s.set(r, r * (1 + sp2 * 0.35), r);
      if (p.y < 0.43) s.set(0, 0, 0);
      m.compose(p, q, s); this.drops.setMatrixAt(i, m);
    }
    this.drops.instanceMatrix.needsUpdate = true;
    this.H1 = H1; this.Hc = Hc;
    this.oldLine.position.set(0, 1.78 + H1, 0);
  }
}
