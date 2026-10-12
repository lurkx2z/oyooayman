/* =====================================================================
   APARTMENT — the protagonist's home (scenes 1, 2, 3 and 14): the BEDROOM at sunrise and the HALLWAY outside it.
   Its own THREE.Scene (the film switches scenes per shot). Authored shapes with canvas textures; every material has a
   descriptive name, so the acoustic view (acoustic.js) knows how strongly each surface reflects sound.
   World (metres): bedroom x −2.3…2.3, z −2.1…2.1, floor y 0, ceiling 2.65. The bed's headboard is on the north wall
   (z = −2.1); she sleeps on its right half (x ≈ −0.38) facing +Z. Window on the east wall (x = +2.3, her left), the
   door on the south wall (x −1.62…−0.72), the dresser on legs against the west wall (her right): the phone ends up under it.
   Hallway: z 2.22…3.62 along X (x −5…7); the door opens into it.
   ===================================================================== */

const BE_APT = {
  W: 2.3, D: 2.1, H: 2.65, th: 0.12,
  bed: { x0: -0.8, x1: 0.8, z0: -2.05, z1: 0.05, top: 0.56 },
  win: { z0: -1.6, z1: 0.1, y0: 0.78, y1: 2.32 },
  door: { x0: -1.62, x1: -0.72, h: 2.06 },
  nightR: [-1.22, -1.78], nightL: [1.2, -1.78], nightH: 0.6,      // bedside tables (centre x, z) and top height
  dresser: { x0: -2.3, x1: -1.78, z0: -0.95, z1: 0.35, legs: 0.13, top: 0.86 },
  chair: [1.55, 1.35, 0.74],          // facing the corner: its back (with the sweater) toward the room
  phone0: new THREE.Vector3(-1.13, 0.6 + 0.0045, -1.7),          // on the right bedside table
  hall: { z0: 2.22, z1: 3.62, x0: -5.0, x1: 7.0, H: 2.6 },
  sunDir: new THREE.Vector3(0.8, 0.5, -0.33).normalize(),         // toward the morning sun (through the window)
};

function beCanvasTex(w, h, draw, rep = [1, 1], srgb = true) {
  const c = Tex.canvas(w, h), x = c.getContext('2d');
  draw(x, w, h);
  const t = Tex.tex(c, { srgb, repeat: true });
  t.repeat.set(rep[0], rep[1]);
  return t;
}

// a soft draped sheet: a subdivided box whose top bulges and edges fall (duvets, cushions, mattresses)
function beSoftBox(w, h, d, o = {}) {
  const g = gbRoundBox(w, h, d, o.r ?? Math.min(h, 0.06) * 0.48, 4);
  const p = g.attributes.position, v = new THREE.Vector3(), r = new RNG(o.seed || 5);
  const ph = [r.range(0, 6), r.range(0, 6), r.range(0, 6)];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const u = v.x / (w / 2), q = v.z / (d / 2), top = v.y > 0 ? 1 : 0;
    // a puffy top, wrinkles along the length, a slight sag at the edges
    const puff = (o.puff ?? 0.02) * (1 - u * u * 0.8) * (1 - q * q * 0.6) * top;
    const wr = (o.wrinkle ?? 0.006) * (Math.sin(v.x * 9 + ph[0] + Math.sin(v.z * 3 + ph[1]) * 2) + 0.6 * Math.sin(v.z * 13 + ph[2])) * top;
    v.y += puff + wr;
    if (o.drape && top === 0 && Math.abs(u) > 0.95) v.x *= 1.0 + 0.02 * (1 - (v.y + h / 2) / h);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// a curtain panel with soft vertical folds (hangs from y1 down to y0, folded along local X)
function beCurtain(width, height, folds, gather = 0.6, seed = 3) {
  const nx = folds * 8, ny = 14, g = new THREE.PlaneGeometry(width * gather, height, nx, ny), p = g.attributes.position, r = new RNG(seed);
  const amp = (width * (1 - gather)) / folds * 0.45, ph = r.range(0, 6);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), k = (x / (width * gather) + 0.5) * folds * Math.PI * 2;
    const bot = 1 - (y / height + 0.5);
    p.setZ(i, amp * Math.sin(k + ph) * (1 + 0.35 * bot) + 0.01 * Math.sin(y * 7 + x * 3));
  }
  g.computeVertexNormals();
  return g;
}

class BeApartment {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.name = 'apartment';
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.r = new RNG(CONFIG.seed + 11);
  }

  build() {
    this._textures();
    this._lights();
    this._room();
    this._window();
    this._bed();
    this._furniture();
    this._decor();
    this._door();
    this._hallway();
    this._dust();
    // walls the click reflects from (image sources for BeWaves): point + unit normal INTO the room
    const A = BE_APT;
    this.walls = [
      { p: new THREE.Vector3(0, 0, -A.D), n: new THREE.Vector3(0, 0, 1), refl: 0.75 },
      { p: new THREE.Vector3(0, 0, A.D), n: new THREE.Vector3(0, 0, -1), refl: 0.75 },
      { p: new THREE.Vector3(A.W, 0, 0), n: new THREE.Vector3(-1, 0, 0), refl: 0.8 },
      { p: new THREE.Vector3(-A.W, 0, 0), n: new THREE.Vector3(1, 0, 0), refl: 0.75 },
      { p: new THREE.Vector3(0, 0, 0), n: new THREE.Vector3(0, 1, 0), refl: 0.6 },
      { p: new THREE.Vector3(0, A.H, 0), n: new THREE.Vector3(0, -1, 0), refl: 0.7 },
    ];
    beAcousticScene(this.root);
    return this;
  }

  // ------------------------------------------------------------------------------------------ textures
  _textures() {
    const r = new RNG(91);
    this.tx = {};
    this.tx.floor = beCanvasTex(1024, 1024, (x, w, h) => {      // oak boards, staggered joints
      const n = 10;
      for (let i = 0; i < n; i++) {
        const y0 = (i * h) / n;
        let xx = -r.range(0, w * 0.6);
        while (xx < w) {
          const L = r.range(w * 0.35, w * 0.8), v = r.range(-14, 14);
          x.fillStyle = `rgb(${176 + v},${128 + v * 0.8},${86 + v * 0.6})`; x.fillRect(xx, y0, L, h / n);
          for (let k = 0; k < 14; k++) {
            x.strokeStyle = `rgba(${r.next() < 0.5 ? '90,56,32' : '210,170,120'},${r.range(0.05, 0.16)})`; x.lineWidth = r.range(0.6, 1.8);
            const yy = y0 + r.range(3, h / n - 3); x.beginPath(); x.moveTo(xx, yy);
            x.bezierCurveTo(xx + L * 0.3, yy + r.range(-4, 4), xx + L * 0.6, yy + r.range(-4, 4), xx + L, yy + r.range(-3, 3)); x.stroke();
          }
          x.fillStyle = 'rgba(52,30,18,0.5)'; x.fillRect(xx, y0, 2, h / n);
          xx += L;
        }
        x.fillStyle = 'rgba(52,30,18,0.55)'; x.fillRect(0, y0, w, 2.5);
      }
      Tex.noise(x, w, h, 8, r);
    }, [2.4, 2.4]);
    this.tx.plaster = beCanvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#e4d6c6'; x.fillRect(0, 0, w, h);
      Tex.blotches(x, w, h, 70, 30, 110, (q) => `rgba(${q.next() < 0.5 ? '170,150,135' : '255,248,235'},${q.range(0.03, 0.07)})`, r);
      Tex.noise(x, w, h, 7, r);
    }, [2, 2]);
    this.tx.linen = beCanvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#eee6da'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < h; i += 2) { x.fillStyle = `rgba(150,130,110,${r.range(0.02, 0.07)})`; x.fillRect(0, i, w, 1); }
      for (let i = 0; i < w; i += 2) { x.fillStyle = `rgba(150,130,110,${r.range(0.02, 0.06)})`; x.fillRect(i, 0, 1, h); }
    }, [3, 3]);
    this.tx.knit = beCanvasTex(256, 256, (x, w, h) => {          // the throw blanket: a chunky rib
      x.fillStyle = '#b4583e'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 16) { const g = x.createLinearGradient(i, 0, i + 16, 0); g.addColorStop(0, 'rgba(60,20,10,0.35)'); g.addColorStop(0.5, 'rgba(255,200,170,0.12)'); g.addColorStop(1, 'rgba(60,20,10,0.35)'); x.fillStyle = g; x.fillRect(i, 0, 16, h); }
      Tex.noise(x, w, h, 10, r);
    }, [4, 2]);
    this.tx.rug = beCanvasTex(512, 512, (x, w, h) => {           // a flat-weave rug: border, a soft geometric field
      x.fillStyle = '#3f4d5c'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#c9b493'; x.fillRect(18, 18, w - 36, h - 36);
      x.fillStyle = '#56697a'; x.fillRect(34, 34, w - 68, h - 68);
      x.strokeStyle = 'rgba(214,190,150,0.55)'; x.lineWidth = 6;
      for (let i = 0; i < 6; i++) { x.beginPath(); const y = 70 + i * 74; for (let k = 0; k <= 8; k++) x.lineTo(40 + k * (w - 80) / 8, y + (k % 2 ? 22 : -22)); x.stroke(); }
      Tex.noise(x, w, h, 16, r);
    });
  }

  // ------------------------------------------------------------------------------------------ lights
  _lights() {
    const S = this.scene, A = BE_APT;
    this.hemi = new THREE.HemisphereLight('#aab4d8', '#6a4a3a', 0.55); S.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight('#ffcf98', 5.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025; sun.shadow.radius = 2;
    sun.position.copy(A.sunDir).multiplyScalar(30); sun.target.position.set(0, 0.3, -0.8);
    const c = sun.shadow.camera; c.left = -4.2; c.right = 4.2; c.top = 4.2; c.bottom = -4.2; c.near = 18; c.far = 45;
    S.add(sun); S.add(sun.target);
    // bounce from the sunlit duvet and floor (no shadow): warm, low
    this.bounce = new THREE.PointLight('#ffb98a', 2.4, 6, 1.5); this.bounce.position.set(0.3, 0.9, -0.6); S.add(this.bounce);
    // the window's sky light into the room
    this.sky = new THREE.SpotLight('#cfe0ff', 9, 9, 0.95, 1.0, 1.3); this.sky.position.set(4.2, 2.0, -0.8); this.sky.target.position.set(-1.5, 0.6, -0.5);
    S.add(this.sky); S.add(this.sky.target);
    // the hallway light that leaks under the door (and lights the hall in scene 3)
    this.hallL = new THREE.PointLight('#ffd7a8', 3.0, 7, 1.6); this.hallL.position.set(0.5, 2.3, 2.9); S.add(this.hallL);
    this.hallL2 = new THREE.PointLight('#ffd7a8', 2.4, 7, 1.6); this.hallL2.position.set(4.6, 2.3, 2.9); S.add(this.hallL2);
  }

  // ------------------------------------------------------------------------------------------ shell
  _room() {
    const R = this.root, A = BE_APT, th = A.th;
    const wall = this.wallM = new THREE.MeshStandardMaterial({ map: this.tx.plaster, color: '#f2e6d8', roughness: 0.93, name: 'beWallPlaster', envMapIntensity: 0.25 });
    const box = (w, h, d, x, y, z, m = wall) => gbAdd(R, new THREE.BoxGeometry(w, h, d), m, x, y, z);
    // floor + ceiling
    const fl = gbAdd(R, new THREE.PlaneGeometry(2 * A.W, 2 * A.D), new THREE.MeshStandardMaterial({ map: this.tx.floor, color: '#d8b48c', roughness: 0.62, name: 'beFloorWood', envMapIntensity: 0.4 }), 0, 0, 0, { rx: -Math.PI / 2, cast: false });
    gbAdd(R, new THREE.PlaneGeometry(2 * A.W, 2 * A.D), gbMat('#efe6da', { rough: 0.95, name: 'beCeilingPlaster' }), 0, A.H, 0, { rx: Math.PI / 2, cast: false });
    // north wall (behind the bed)
    box(2 * A.W + 2 * th, A.H, th, 0, A.H / 2, -A.D - th / 2);
    // west wall (the dresser)
    box(th, A.H, 2 * A.D, -A.W - th / 2, A.H / 2, 0);
    // east wall with the window opening
    const W = A.win, ex = A.W + th / 2;
    box(th, A.H, W.z0 + A.D, ex, A.H / 2, (-A.D + W.z0) / 2);
    box(th, A.H, A.D - W.z1, ex, A.H / 2, (W.z1 + A.D) / 2);
    box(th, W.y0, W.z1 - W.z0, ex, W.y0 / 2, (W.z0 + W.z1) / 2);
    box(th, A.H - W.y1, W.z1 - W.z0, ex, (A.H + W.y1) / 2, (W.z0 + W.z1) / 2);
    // south wall with the door opening
    const Dr = A.door, sz = A.D + th / 2;
    box(Dr.x0 + A.W + th, A.H, th, (-A.W - th + Dr.x0) / 2, A.H / 2, sz);
    box(A.W + th - Dr.x1, A.H, th, (Dr.x1 + A.W + th) / 2, A.H / 2, sz);
    box(Dr.x1 - Dr.x0, A.H - Dr.h, th, (Dr.x0 + Dr.x1) / 2, (A.H + Dr.h) / 2, sz);
    // skirting boards
    const sk = gbMat('#efe7dc', { rough: 0.7, name: 'beSkirtingWood' });
    box(2 * A.W, 0.09, 0.02, 0, 0.045, -A.D + 0.01, sk);
    box(0.02, 0.09, 2 * A.D, -A.W + 0.01, 0.045, 0, sk);
    box(0.02, 0.09, A.D + W.z0, A.W - 0.01, 0.045, (-A.D + W.z0) / 2, sk); box(0.02, 0.09, A.D - W.z1, A.W - 0.01, 0.045, (W.z1 + A.D) / 2, sk);
    box(Dr.x0 + A.W, 0.09, 0.02, (-A.W + Dr.x0) / 2, 0.045, A.D - 0.01, sk); box(A.W - Dr.x1, 0.09, 0.02, (Dr.x1 + A.W) / 2, 0.045, A.D - 0.01, sk);
    // a cornice line
    box(2 * A.W, 0.05, 0.05, 0, A.H - 0.03, -A.D + 0.02, sk); box(0.05, 0.05, 2 * A.D, -A.W + 0.02, A.H - 0.03, 0, sk);
    box(0.05, 0.05, 2 * A.D, A.W - 0.02, A.H - 0.03, 0, sk); box(2 * A.W, 0.05, 0.05, 0, A.H - 0.03, A.D - 0.02, sk);
    // rug
    gbAdd(R, gbRoundBox(1.9, 0.012, 1.3, 0.005, 2), new THREE.MeshStandardMaterial({ map: this.tx.rug, roughness: 1, name: 'beRugFabric', envMapIntensity: 0.1 }), 0.05, 0.006, 0.75);
  }

  _window() {
    const R = this.root, A = BE_APT, W = A.win, x = A.W;
    const frameM = gbMat('#f4efe6', { rough: 0.55, name: 'beWindowFrameWood' });
    const glassM = new THREE.MeshStandardMaterial({ color: '#dfe9ff', roughness: 0.03, transparent: true, opacity: 0.08, depthWrite: false, name: 'beWindowGlass', envMapIntensity: 1.2 });
    const zc = (W.z0 + W.z1) / 2, yc = (W.y0 + W.y1) / 2, wz = W.z1 - W.z0, hy = W.y1 - W.y0;
    const fr = (y, z, hh, ww, d = 0.06) => gbAdd(R, new THREE.BoxGeometry(d, hh, ww), frameM, x - 0.03, y, z);
    fr(W.y0 + 0.035, zc, 0.07, wz); fr(W.y1 - 0.035, zc, 0.07, wz); fr(yc, W.z0 + 0.035, hy, 0.07); fr(yc, W.z1 - 0.035, hy, 0.07);
    fr(yc, zc, hy, 0.05); fr(W.y0 + hy * 0.62, zc, 0.045, wz);                      // mullion + transom: the pane shadows
    for (const z of [W.z0 + wz * 0.25, W.z0 + wz * 0.75]) fr(W.y0 + hy * 0.81, z, hy * 0.38, 0.03, 0.04);
    const gl = gbAdd(R, new THREE.PlaneGeometry(wz, hy), glassM, x + 0.005, yc, zc, { ry: -Math.PI / 2, cast: false, receive: false }); gl.renderOrder = 2;
    // sill
    gbAdd(R, gbRoundBox(0.3, 0.04, wz + 0.16, 0.012, 2), gbMat('#f1ebe2', { rough: 0.5, name: 'beSillWood' }), x - 0.12, W.y0 - 0.01, zc);
    // the view: a bright morning sky, roofs and a tree (far, unlit, emissive; in the acoustic view it is a 'glow' surface)
    const skyM = new THREE.ShaderMaterial({
      fog: false, depthWrite: true, name: 'beSkyGlow',
      uniforms: { uReal: BE_AC.real.glow, uAc: BE_AC.uBeAc },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`uniform float uReal, uAc; varying vec2 vUv;
        void main(){ vec3 lo = vec3(1.9, 1.45, 1.0), hi = vec3(0.75, 0.95, 1.5);
          vec3 c = mix(lo, hi, smoothstep(0.05, 0.9, vUv.y));
          c += vec3(1.6, 1.1, 0.6) * exp(-pow(length((vUv - vec2(0.35, 0.42)) * vec2(1.4, 1.0)) / 0.18, 2.0));
          gl_FragColor = vec4(c * mix(1.0, uReal, uAc), 1.0); }`,
    });
    gbAdd(R, new THREE.PlaneGeometry(26, 14), skyM, x + 9, 3.5, -1.0, { ry: -Math.PI / 2, cast: false, receive: false });
    // silhouettes outside: rooftops and a tree, dark against the glow (lit by nothing: dark blue-grey)
    const silM = gbMat('#4a4f68', { rough: 1, name: 'beOutsideBrick', emissive: '#4a4f68', emi: 0.15 });
    const sr = new RNG(41);
    for (let i = 0; i < 9; i++) { const z = -9 + i * 2.3 + sr.range(-0.5, 0.5), h = sr.range(1.0, 3.8); gbAdd(R, new THREE.BoxGeometry(1, h, sr.range(1.6, 2.4)), silM, x + 7.5, -1.2 + h / 2, z, { cast: false }); }
    const treeM = gbMat('#33443f', { rough: 1, name: 'beOutsideLeaves', emissive: '#33443f', emi: 0.1, flat: true });
    for (let i = 0; i < 6; i++) gbAdd(R, new THREE.IcosahedronGeometry(sr.range(0.7, 1.2), 1), treeM, x + 4.5 + sr.range(-0.3, 0.3), 2.3 + sr.range(-0.4, 1.0), 1.0 + sr.range(-1.3, 1.3), { cast: true });
    gbAdd(R, new THREE.CylinderGeometry(0.08, 0.12, 3, 8), treeM, x + 4.5, 0.6, 1.0);
    // curtains: sheer linen, drawn to the sides (they cast soft shadows)
    const cM = new THREE.MeshStandardMaterial({ map: this.tx.linen, color: '#f6efe4', roughness: 0.95, side: THREE.DoubleSide, name: 'beCurtainFabric', transparent: true, opacity: 0.92, envMapIntensity: 0.2 });
    const cH = A.H - 0.12;
    for (const [z, s] of [[W.z0 - 0.12, 3], [W.z1 + 0.14, 4]]) gbAdd(R, beCurtain(0.75, cH, 5, 0.5, s), cM, x - 0.12, cH / 2 + 0.02, z, { ry: -Math.PI / 2 });
    gbAdd(R, new THREE.CylinderGeometry(0.013, 0.013, wz + 1.0, 10), gbMat('#3a3330', { rough: 0.4, metal: 0.6, name: 'beRodMetal' }), x - 0.12, A.H - 0.08, zc, { rx: Math.PI / 2 });
    this.glassM = glassM;
  }

  _bed() {
    const R = this.root, A = BE_APT, B = A.bed, cx = (B.x0 + B.x1) / 2, w = B.x1 - B.x0, len = B.z1 - B.z0, cz = (B.z0 + B.z1) / 2;
    const woodM = gbMat('#8a5a3c', { rough: 0.55, name: 'beBedFrameWood', rim: 0.1 });
    const g = new THREE.Group(); R.add(g); this.bedG = g;
    // frame + legs
    gbAdd(g, gbRoundBox(w + 0.08, 0.2, len + 0.04, 0.02, 2), woodM, cx, 0.24, cz);
    for (const [x, z] of [[B.x0, B.z0], [B.x1, B.z0], [B.x0, B.z1], [B.x1, B.z1]]) gbAdd(g, new THREE.CylinderGeometry(0.025, 0.02, 0.16, 8), woodM, x + Math.sign(cx - x) * 0.04, 0.08, z + Math.sign(cz - z) * 0.03);
    // upholstered headboard (fabric, two soft panels)
    const hbM = gbMat('#5f7183', { rough: 0.95, name: 'beHeadboardFabric', rim: 0.12 });
    gbAdd(g, beSoftBox(w + 0.14, 1.0, 0.1, { puff: 0.012, wrinkle: 0.002, r: 0.045, seed: 2 }), hbM, cx, 0.82, B.z0 - 0.02, { rx: Math.PI / 2 });
    // mattress
    gbAdd(g, gbRoundBox(w, 0.22, len - 0.04, 0.05, 3), gbMat('#ece8e0', { rough: 0.9, name: 'beMattressFabric' }), cx, 0.44, cz + 0.01);
    // fitted sheet + duvet: the duvet is folded back on the left side (her side is open: she sits up there)
    const sheetM = new THREE.MeshStandardMaterial({ map: this.tx.linen, color: '#f4efe8', roughness: 0.95, name: 'beSheetFabric', envMapIntensity: 0.2 });
    gbAdd(g, beSoftBox(w + 0.02, 0.03, len - 0.02, { puff: 0.004, wrinkle: 0.003, seed: 4 }), sheetM, cx, 0.555, cz + 0.01);
    const duvM = new THREE.MeshStandardMaterial({ map: this.tx.linen, color: '#dfe6ee', roughness: 0.96, name: 'beDuvetFabric', envMapIntensity: 0.2 });
    this.duvet = gbAdd(g, beSoftBox(w + 0.16, 0.12, len * 0.7, { puff: 0.05, wrinkle: 0.012, seed: 7, drape: true, r: 0.05 }), duvM, cx, 0.6, B.z1 - len * 0.35);
    // a fold at the top edge
    gbAdd(g, beSoftBox(w + 0.16, 0.1, 0.32, { puff: 0.03, wrinkle: 0.01, seed: 9, r: 0.045 }), duvM, cx, 0.64, B.z1 - len * 0.7 - 0.08, { rx: -0.15 });
    // the knitted throw at the foot
    gbAdd(g, beSoftBox(w + 0.2, 0.05, 0.5, { puff: 0.015, wrinkle: 0.012, seed: 12, r: 0.024 }), new THREE.MeshStandardMaterial({ map: this.tx.knit, roughness: 1, name: 'beThrowFabric', envMapIntensity: 0.15 }), cx, 0.68, B.z1 - 0.3, { ry: 0.04 });
    // pillows: two big, one small
    const pM = new THREE.MeshStandardMaterial({ map: this.tx.linen, color: '#f8f4ec', roughness: 0.95, name: 'bePillowFabric', envMapIntensity: 0.2 });
    for (const [x, ry, s] of [[cx - 0.38, 0.06, 7], [cx + 0.38, -0.05, 8]]) gbAdd(g, beSoftBox(0.66, 0.16, 0.42, { puff: 0.05, wrinkle: 0.008, r: 0.075, seed: s }), pM, x, 0.66, B.z0 + 0.26, { ry, rx: 0.32 });
    gbAdd(g, beSoftBox(0.42, 0.12, 0.3, { puff: 0.03, r: 0.055, seed: 13 }), gbMat('#c9a35e', { rough: 0.95, name: 'beCushionFabric' }), cx + 0.25, 0.72, B.z0 + 0.4, { ry: -0.2, rx: 0.5 });
  }

  _furniture() {
    const R = this.root, A = BE_APT;
    const oak = gbMat('#a7744c', { rough: 0.5, name: 'beNightstandWood', rim: 0.08 }), knob = gbMat('#c8a466', { rough: 0.3, metal: 0.85, name: 'beHandleBrass' });
    // bedside tables: a drawer, a shelf, slim legs
    for (const [x, z] of [A.nightR, A.nightL]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); R.add(g);
      gbAdd(g, gbRoundBox(0.46, 0.035, 0.4, 0.01, 2), oak, 0, A.nightH - 0.0175, 0);
      gbAdd(g, gbRoundBox(0.44, 0.18, 0.38, 0.008, 2), oak, 0, A.nightH - 0.13, 0);
      gbAdd(g, new THREE.BoxGeometry(0.4, 0.012, 0.005), gbMat('#5a3a26', { rough: 0.8, name: 'beGapWood' }), 0, A.nightH - 0.13, 0.192, { cast: false });
      gbAdd(g, new THREE.SphereGeometry(0.014, 10, 8), knob, 0, A.nightH - 0.125, 0.2);
      gbAdd(g, gbRoundBox(0.42, 0.02, 0.36, 0.006, 2), oak, 0, 0.16, 0);
      for (const [lx, lz] of [[-0.2, -0.17], [0.2, -0.17], [-0.2, 0.17], [0.2, 0.17]]) gbAdd(g, new THREE.CylinderGeometry(0.014, 0.011, A.nightH - 0.05, 8), oak, lx, (A.nightH - 0.05) / 2, lz);
    }
    // lamps (ceramic base, linen shade): the right one off, the left one off too (it is morning)
    const lampBase = gbMat('#d8cbb8', { rough: 0.35, name: 'beLampCeramic', env: 0.6 }), shade = gbMat('#efe2cc', { rough: 0.95, name: 'beLampShadeFabric', side: THREE.DoubleSide });
    for (const [x, z] of [[A.nightR[0] - 0.08, A.nightR[1] - 0.06], [A.nightL[0] + 0.06, A.nightL[1] - 0.06]]) {
      gbAdd(R, gbLathe([[0, 0], [0.07, 0], [0.085, 0.05], [0.07, 0.16], [0.03, 0.22], [0.012, 0.3], [0, 0.3]], 24), lampBase, x, A.nightH, z);
      gbAdd(R, new THREE.CylinderGeometry(0.1, 0.15, 0.18, 24, 1, true), shade, x, A.nightH + 0.36, z);
    }
    // on the right table: the PHONE (cast.js animates it), a book, a glass of water
    gbAdd(R, gbRoundBox(0.15, 0.03, 0.22, 0.006, 2), gbMat('#4b6a68', { rough: 0.8, name: 'beBookCover' }), A.nightR[0] + 0.08, A.nightH + 0.015, A.nightR[1] - 0.08, { ry: 0.3 });
    // the dresser on legs (west wall): three drawers, brass pulls; the gap under it is where the phone goes
    const D = A.dresser, dw = D.z1 - D.z0, dd = D.x1 - D.x0, dcz = (D.z0 + D.z1) / 2, dcx = (D.x0 + D.x1) / 2, bodyH = D.top - D.legs;
    const dM = gbMat('#7f5a40', { rough: 0.5, name: 'beDresserWood', rim: 0.08 });
    const dr = new THREE.Group(); dr.position.set(dcx, 0, dcz); R.add(dr); this.dresserG = dr;
    gbAdd(dr, gbRoundBox(dd, bodyH, dw, 0.012, 2), dM, 0, D.legs + bodyH / 2, 0);
    gbAdd(dr, gbRoundBox(dd + 0.03, 0.03, dw + 0.03, 0.01, 2), dM, 0, D.top + 0.015, 0);
    for (let i = 0; i < 3; i++) {
      const y = D.legs + 0.06 + i * (bodyH - 0.08) / 3 + (bodyH - 0.08) / 6;
      gbAdd(dr, new THREE.BoxGeometry(0.006, 0.01, dw - 0.06), gbMat('#3a271b', { rough: 0.9, name: 'beGapWood' }), dd / 2 + 0.001, y + (bodyH - 0.08) / 6 - 0.005, 0, { cast: false });
      for (const s of [-1, 1]) gbAdd(dr, new THREE.TorusGeometry(0.022, 0.006, 6, 14, Math.PI), knob, dd / 2 + 0.012, y + 0.01, s * dw * 0.25, { ry: Math.PI / 2, rz: Math.PI });
    }
    for (const [lx, lz] of [[-dd / 2 + 0.04, -dw / 2 + 0.04], [dd / 2 - 0.04, -dw / 2 + 0.04], [-dd / 2 + 0.04, dw / 2 - 0.04], [dd / 2 - 0.04, dw / 2 - 0.04]])
      gbAdd(dr, new THREE.CylinderGeometry(0.018, 0.012, D.legs, 8), dM, lx, D.legs / 2, lz);
    // on the dresser: the carafe and a glass (scene 2), a small plant, a framed photo
    const glassM = new THREE.MeshStandardMaterial({ color: '#e8f2ff', roughness: 0.05, transparent: true, opacity: 0.32, name: 'beCarafeGlass', envMapIntensity: 1.4, depthWrite: false });
    this.carafe = gbAdd(R, gbLathe([[0, 0], [0.055, 0], [0.065, 0.02], [0.068, 0.12], [0.045, 0.19], [0.025, 0.24], [0.028, 0.26], [0, 0.26]], 24), glassM, dcx + 0.02, D.top + 0.03, dcz - 0.35);
    this.glass = gbAdd(R, gbLathe([[0, 0], [0.032, 0], [0.036, 0.1], [0, 0.1]], 20), glassM, dcx + 0.08, D.top + 0.03, dcz - 0.12);
    const potM = gbMat('#c97a55', { rough: 0.7, name: 'bePotCeramic' }), leafM = gbMat('#5d8a5a', { rough: 0.8, name: 'beLeafPlant', flat: true, rim: 0.15 });
    gbAdd(R, gbLathe([[0, 0], [0.06, 0], [0.075, 0.12], [0.07, 0.13], [0, 0.13]], 18), potM, dcx, D.top + 0.03, dcz + 0.4);
    const lr = new RNG(23);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; gbAdd(R, new THREE.SphereGeometry(0.06, 6, 4), leafM, dcx + Math.cos(a) * 0.05, D.top + 0.2 + lr.range(0, 0.1), dcz + 0.4 + Math.sin(a) * 0.05, { s: [0.5, 1.2, 0.25], ry: a, rz: lr.range(-0.5, 0.5) }); }
    // the chair (with the sweater on its back: she finds it by touch in scene 2)
    const [chx, chz, chy] = A.chair, ch = new THREE.Group(); ch.position.set(chx, 0, chz); ch.rotation.y = chy; R.add(ch); this.chairG = ch;
    const cw = gbMat('#4d5b52', { rough: 0.6, name: 'beChairWood', rim: 0.1 });
    gbAdd(ch, gbRoundBox(0.44, 0.04, 0.42, 0.012, 2), cw, 0, 0.46, 0);
    for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) gbAdd(ch, new THREE.CylinderGeometry(0.018, 0.014, 0.46, 8), cw, lx, 0.23, lz);
    for (const lx of [-0.19, 0.19]) gbAdd(ch, new THREE.CylinderGeometry(0.016, 0.016, 0.5, 8), cw, lx, 0.72, -0.19);
    gbAdd(ch, gbRoundBox(0.42, 0.1, 0.025, 0.01, 2), cw, 0, 0.92, -0.19);
    this.sweater = gbAdd(ch, beSoftBox(0.46, 0.05, 0.36, { puff: 0.02, wrinkle: 0.015, r: 0.022, seed: 31 }), gbMat('#c98f3a', { rough: 1, name: 'beSweaterFabric', rim: 0.15 }), 0, 0.86, -0.19, { rx: Math.PI / 2 - 0.12 });
  }

  _decor() {
    const R = this.root, A = BE_APT;
    // framed prints over the bed (abstract warm shapes, no text), a wall clock (ticks in scene 2), a shelf of books
    const frM = gbMat('#2f2a28', { rough: 0.5, name: 'beFrameWood' });
    const mk = (w, h, x, y, z, ry, seed) => {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; R.add(g);
      gbAdd(g, gbRoundBox(w, h, 0.03, 0.006, 2), frM, 0, 0, 0);
      const rr = new RNG(seed);
      const tex = beCanvasTex(256, 256 * h / w, (c, W, H) => {
        c.fillStyle = '#efe5d4'; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 5; i++) { c.fillStyle = ['#c6683f', '#e2b25c', '#5d7d8a', '#8b9c78', '#d48c6a'][i]; c.beginPath(); c.arc(rr.range(0.2, 0.8) * W, rr.range(0.2, 0.8) * H, rr.range(0.12, 0.3) * W, 0, 7); c.globalAlpha = 0.8; c.fill(); c.globalAlpha = 1; }
      });
      gbAdd(g, new THREE.PlaneGeometry(w - 0.06, h - 0.06), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, name: 'bePrintPaper' }), 0, 0, 0.017, { cast: false });
    };
    mk(0.5, 0.65, -0.32, 1.72, -A.D + 0.02, 0, 3); mk(0.5, 0.65, 0.32, 1.72, -A.D + 0.02, 0, 9);
    mk(0.42, 0.55, A.W - 0.02, 1.6, 1.25, -Math.PI / 2, 15);
    // the clock on the south wall (her front-left)
    const ck = this.clock = new THREE.Group(); ck.position.set(0.55, 1.95, A.D - 0.02); ck.rotation.y = Math.PI; R.add(ck);
    gbAdd(ck, new THREE.CylinderGeometry(0.16, 0.16, 0.035, 32), gbMat('#2c2c30', { rough: 0.4, metal: 0.5, name: 'beClockMetal' }), 0, 0, 0, { rx: Math.PI / 2 });
    gbAdd(ck, new THREE.CircleGeometry(0.145, 32), gbMat('#f3eee4', { rough: 0.6, name: 'beClockFace' }), 0, 0, 0.019, { cast: false });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; gbAdd(ck, new THREE.BoxGeometry(0.008, i % 3 ? 0.014 : 0.026, 0.002), gbMat('#2c2c30', { rough: 0.6, name: 'beClockMetal' }), Math.sin(a) * 0.125, Math.cos(a) * 0.125, 0.02, { rz: -a, cast: false }); }
    this.hands = [0.1, 0.075, 0.13].map((L, i) => { const h = new THREE.Group(); h.position.z = 0.022 + i * 0.002; ck.add(h); gbAdd(h, new THREE.BoxGeometry(i === 2 ? 0.003 : 0.008, L, 0.002), gbMat(i === 2 ? '#c0503a' : '#2c2c30', { rough: 0.6, name: 'beClockMetal' }), 0, L / 2 - 0.01, 0, { cast: false }); return h; });
    // a wall shelf with books over the chair corner
    const sh = gbMat('#a7744c', { rough: 0.55, name: 'beShelfWood' });
    gbAdd(R, gbRoundBox(0.9, 0.03, 0.22, 0.008, 2), sh, 1.6, 1.42, A.D - 0.11);
    const br = new RNG(7); let bx = 1.22;
    for (let i = 0; i < 9; i++) { const w = br.range(0.025, 0.05), h = br.range(0.17, 0.25); gbAdd(R, gbRoundBox(w, h, 0.16, 0.004, 1), gbMat(br.pick(['#7d4a3a', '#3f5a6a', '#c9a45c', '#5e6e4a', '#8a6b8c', '#d8cdb8']), { rough: 0.8, name: 'beBookCover' }), bx + w / 2, 1.435 + h / 2, A.D - 0.12, { rz: i === 8 ? 0.25 : 0 }); bx += w + 0.004; }
    // ceiling pendant (off)
    this.pendant = [gbAdd(R, new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4), gbMat('#2a2a2a', { name: 'beCordFabric' }), 0, A.H - 0.25, 0)];
    this.pendant.push(gbAdd(R, gbLathe([[0.0, 0], [0.2, -0.02], [0.24, -0.16], [0.03, -0.02], [0, 0]], 28), gbMat('#d9c9a8', { rough: 0.6, name: 'bePendantMetal', side: THREE.DoubleSide }), 0, A.H - 0.48, 0, { rx: Math.PI }));
  }

  _door() {
    const R = this.root, A = BE_APT, Dr = A.door, w = Dr.x1 - Dr.x0;
    const trimM = gbMat('#f2ece2', { rough: 0.55, name: 'beDoorFrameWood' });
    gbAdd(R, new THREE.BoxGeometry(0.07, Dr.h + 0.04, 0.16), trimM, Dr.x0 - 0.035, Dr.h / 2, A.D);
    gbAdd(R, new THREE.BoxGeometry(0.07, Dr.h + 0.04, 0.16), trimM, Dr.x1 + 0.035, Dr.h / 2, A.D);
    gbAdd(R, new THREE.BoxGeometry(w + 0.14, 0.07, 0.16), trimM, (Dr.x0 + Dr.x1) / 2, Dr.h + 0.035, A.D);
    // the door leaf: hinged at x1, opens into the hallway; panels; a lever handle (metal)
    const pivot = this.doorPivot = new THREE.Group(); pivot.position.set(Dr.x1 - 0.01, 0, A.D + 0.02); R.add(pivot);
    const leafM = gbMat('#ece5d8', { rough: 0.5, name: 'beDoorWood', rim: 0.06 });
    const leaf = new THREE.Group(); leaf.position.x = -w / 2 + 0.01; pivot.add(leaf);
    gbAdd(leaf, gbRoundBox(w - 0.02, Dr.h - 0.015, 0.04, 0.006, 2), leafM, 0, (Dr.h - 0.015) / 2 + 0.012, 0);
    for (const [y, h] of [[0.55, 0.7], [1.45, 0.7]]) for (const s of [-1, 1]) gbAdd(leaf, gbRoundBox(w - 0.18, h, 0.01, 0.004, 1), gbMat('#e3dbcc', { rough: 0.55, name: 'beDoorWood' }), 0, y, s * 0.023, { cast: false });
    const hM = gbMat('#b9b4ad', { rough: 0.25, metal: 0.9, name: 'beHandleMetal', env: 1.2 });
    this.handleP = new THREE.Vector3();
    for (const s of [-1, 1]) {
      gbAdd(leaf, gbRoundBox(0.04, 0.14, 0.012, 0.005, 1), hM, -w / 2 + 0.08, 1.0, s * 0.027);
      gbAdd(leaf, gbCapsule(0.009, 0.1, 4, 8), hM, -w / 2 + 0.12, 1.02, s * 0.05, { rz: Math.PI / 2 });
    }
    this.doorLeaf = leaf;
    // light leaking under the door from the hallway (a thin bright strip on the floor; in the acoustic view it is a source)
    this.leak = gbAdd(R, new THREE.PlaneGeometry(w - 0.04, 0.16), new THREE.MeshBasicMaterial({ color: '#ffd9a8', transparent: true, opacity: 0.22, depthWrite: false, name: 'beLeakGlow' }), (Dr.x0 + Dr.x1) / 2, 0.002, A.D - 0.08, { rx: -Math.PI / 2, cast: false, receive: false });
    this.leak.userData.beSkip = true;
  }

  // the hallway outside the door (scene 3 builds on it)
  _hallway() {
    const R = this.root, Hh = BE_APT.hall, A = BE_APT;
    const wall = new THREE.MeshStandardMaterial({ map: this.tx.plaster, color: '#e9ddd0', roughness: 0.93, name: 'beHallWallPlaster', envMapIntensity: 0.25 });
    const len = Hh.x1 - Hh.x0, cx = (Hh.x0 + Hh.x1) / 2, cz = (Hh.z0 + Hh.z1) / 2, wz = Hh.z1 - Hh.z0;
    gbAdd(R, new THREE.PlaneGeometry(len, wz), new THREE.MeshStandardMaterial({ map: this.tx.floor, color: '#cfa985', roughness: 0.6, name: 'beHallFloorWood' }), cx, 0, cz, { rx: -Math.PI / 2, cast: false });
    gbAdd(R, new THREE.PlaneGeometry(len, wz), gbMat('#efe6da', { rough: 0.95, name: 'beHallCeilingPlaster' }), cx, Hh.H, cz, { rx: Math.PI / 2, cast: false });
    gbAdd(R, new THREE.BoxGeometry(len, Hh.H, 0.12), wall, cx, Hh.H / 2, Hh.z1 + 0.06);
    gbAdd(R, new THREE.BoxGeometry(0.12, Hh.H, wz), wall, Hh.x1 + 0.06, Hh.H / 2, cz);
    gbAdd(R, new THREE.BoxGeometry(0.12, Hh.H, wz), wall, Hh.x0 - 0.06, Hh.H / 2, cz);
    // the bedroom-side wall of the hall continues beyond the bedroom
    gbAdd(R, new THREE.BoxGeometry(Hh.x1 - A.W - 0.12, Hh.H, 0.12), wall, (A.W + 0.12 + Hh.x1) / 2, Hh.H / 2, A.D + 0.06);
    gbAdd(R, new THREE.BoxGeometry(-A.W - 0.12 - Hh.x0, Hh.H, 0.12), wall, (Hh.x0 - A.W - 0.12) / 2, Hh.H / 2, A.D + 0.06);
    // a runner rug and two ceiling lights
    gbAdd(R, gbRoundBox(len * 0.7, 0.01, 0.8, 0.004, 2), new THREE.MeshStandardMaterial({ map: this.tx.rug, roughness: 1, name: 'beRunnerFabric' }), cx, 0.005, cz);
    for (const x of [0.5, 4.6]) gbAdd(R, new THREE.CylinderGeometry(0.16, 0.18, 0.06, 20), new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffe3b8', emissiveIntensity: 2.5, name: 'beCeilingLampGlow' }), x, Hh.H - 0.03, cz);
  }

  // dust in the sunbeam (BillboardSystem, posed per frame)
  _dust() {
    this.dust = new BillboardSystem(this.scene, 160, true);
    this.dust.mesh.userData.beSkip = true;
    // the sunbeams: a few soft additive slabs from the window panes into the room
    const beamM = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uA: { value: 0.08 }, uT: { value: 0 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */`uniform float uA, uT; varying vec2 vUv; varying vec3 vW;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){ float along = vUv.y; float across = abs(vUv.x - 0.5) * 2.0;
          float k = (1.0 - smoothstep(0.55, 1.0, across)) * smoothstep(0.0, 0.12, along) * (1.0 - smoothstep(0.55, 1.0, along));
          float n = 0.75 + 0.25 * sin(vW.y * 3.0 + vW.z * 2.0 + uT * 0.3);
          gl_FragColor = vec4(vec3(1.0, 0.8, 0.55) * k * n * uA, 1.0); }`,
    });
    this.beamM = beamM;
    const A = BE_APT, W = A.win, d = A.sunDir.clone().negate(), L = 4.2;
    this.beams = [];
    for (const [z, y] of [[W.z0 + 0.42, W.y0 + 0.45], [W.z1 - 0.42, W.y0 + 0.45], [W.z0 + 0.42, W.y1 - 0.35], [W.z1 - 0.42, W.y1 - 0.35]]) {
      const g = new THREE.PlaneGeometry(0.75, L); g.translate(0, L / 2, 0);
      const m = new THREE.Mesh(g, beamM); m.position.set(A.W - 0.05, y, z);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      m.rotateY(0.6);
      m.renderOrder = 5; m.userData.beSkip = true; m.frustumCulled = false;
      this.root.add(m); this.beams.push(m);
      const m2 = m.clone(); m2.rotateY(Math.PI / 2); this.root.add(m2); this.beams.push(m2);
    }
  }

  // per frame: sun beams, dust motes, the clock, the light under the door (lit = 1 in reality, 0 in the dark)
  update(t, lit, cam) {
    this.beamM.uniforms.uT.value = t; this.beamM.uniforms.uA.value = 0.07 * lit;
    for (const b of this.beams) b.visible = lit > 0.01;
    const D = this.dust; D.begin(null);
    if (lit > 0.01) {
      const A = BE_APT, d = A.sunDir;
      for (let i = 0; i < 150; i++) {
        // motes drift slowly inside the sun-lit wedge between the window and the bed
        const u = hash1(i * 13 + 1), v = hash1(i * 7 + 3), w = hash1(i * 5 + 11);
        const s = 0.4 + 3.2 * u;
        const x = A.W - s * Math.abs(d.x) * 0.95 + 0.06 * Math.sin(t * 0.21 + i);
        const y = A.win.y0 + (A.win.y1 - A.win.y0) * v - s * d.y * 0.95 + 0.05 * Math.sin(t * 0.17 + i * 2.1) + 0.02 * t * (hash1(i) - 0.5);
        const z = A.win.z0 + (A.win.z1 - A.win.z0) * w + s * Math.abs(d.z) * 0.95 + 0.06 * Math.cos(t * 0.19 + i * 1.3);
        const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + hash1(i * 3)) + i);
        D.push(x, y, z, 0.006 + 0.008 * hash1(i * 17), 0, 0.5 * tw * lit, 1, 1.0, 0.86, 0.66);
      }
    }
    D.end();
    // the clock: a real clock (seconds tick)
    const sec = Math.floor(t), sm = sec + Math.min(1, (t - sec) / 0.08);
    this.hands[2].rotation.z = -(sm / 60) * Math.PI * 2 - 1.1;
    this.hands[1].rotation.z = -((7 * 60 + 12 + t / 60) / 60) * Math.PI * 2;
    this.hands[0].rotation.z = -((7 + 12 / 60) / 12) * Math.PI * 2;
    this.leak.material.opacity = 0.22 * lit;
  }
}
