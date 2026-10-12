/* =====================================================================
   LAB — the acoustic test room (scene 8): a supervised, hemi-anechoic chamber.
     The room      x −3…3, z −2.5…2.5, 3 m high: bare painted walls and ceiling at first (a bright, hard, ringing box),
                   a sealed concrete floor, a heavy acoustic door (south, x −2.2…−1.2), an observation window (east)
                   with the control room behind it, where the coach watches. Lamps hang on rods below the ceiling.
     The foam      ≈ 280 blocks of grey-blue foam WEDGES (0.6 × 0.6 m, three ridges each, 0.43 m deep, alternate blocks
                   turned 90°: the classic anechoic pattern) that grow out of the walls and ceiling in a wave (u = 0…1).
                   The FLOOR stays hard: a hemi-anechoic room, so the floor's reflection is the one that survives.
   ===================================================================== */
const BE_LAB = { W: 3, D: 2.5, H: 3, wedge: 0.43, block: 0.6, door: { x0: -2.4, x1: -1.2, h: 2.4 }, win: { z0: -0.7, z1: 1.1, y0: 0.6, y1: 1.8 } };

class BeLab {
  constructor() { this.scene = new THREE.Scene(); this.scene.name = 'lab'; this.root = new THREE.Group(); this.scene.add(this.root); }
  build() {
    const S = this.scene, R = this.root, C = BE_LAB, r = new RNG(808), W = C.W, D = C.D, H = C.H;
    S.background = new THREE.Color('#0b0c10');
    const plaster = beCanvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#ecebe6'; x.fillRect(0, 0, w, h); Tex.noise(x, w, h, 5, r);
      x.strokeStyle = 'rgba(120, 118, 110, 0.35)'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2);   // panel joints
    }, [5, 3]);
    const wallM = new THREE.MeshStandardMaterial({ map: plaster, color: '#f2f1ec', roughness: 0.55, name: 'beLabWallPlaster', envMapIntensity: 0.4 });
    const ceilM = new THREE.MeshStandardMaterial({ map: plaster, color: '#efeee9', roughness: 0.6, name: 'beLabCeilingPlaster', envMapIntensity: 0.3 });
    const floorTx = beCanvasTex(1024, 1024, (x, w, h) => {
      x.fillStyle = '#8d8f90'; x.fillRect(0, 0, w, h); Tex.noise(x, w, h, 10, r);
      for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(60, 62, 64, ${r.range(0.03, 0.08)})`; x.beginPath(); x.ellipse(r.range(0, w), r.range(0, h), r.range(20, 90), r.range(10, 50), r.range(0, 3), 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(50, 52, 54, 0.4)'; x.lineWidth = 2; for (let i = 1; i < 3; i++) { x.beginPath(); x.moveTo(i * w / 3, 0); x.lineTo(i * w / 3, h); x.stroke(); }
    }, [2, 2]);
    gbAdd(R, new THREE.PlaneGeometry(2 * W + 4, 2 * D + 4), new THREE.MeshStandardMaterial({ map: floorTx, color: '#a9abad', roughness: 0.32, name: 'beLabFloorConcrete', envMapIntensity: 0.6 }), 1.5, 0, 0, { rx: -Math.PI / 2, cast: false });
    this.ceiling = gbAdd(R, new THREE.PlaneGeometry(2 * W, 2 * D), ceilM, 0, H, 0, { rx: Math.PI / 2, cast: false });
    const th = 0.15, box = (w, h, d, x, y, z, m, o) => beBox(R, w, h, d, x, y, z, m, Object.assign({ cast: false }, o || {}));
    // north and west: plain; south: the door gap; east: the window gap (the control room beyond)
    box(2 * W + 2 * th, H, th, 0, H / 2, -D - th / 2, wallM);
    box(th, H, 2 * D + 2 * th, -W - th / 2, H / 2, 0, wallM);
    const Dr = C.door, sz = D + th / 2;
    box(Dr.x0 + W + th, H, th, (-W - th + Dr.x0) / 2, H / 2, sz, wallM);
    box(W + th - Dr.x1, H, th, (Dr.x1 + W + th) / 2, H / 2, sz, wallM);
    box(Dr.x1 - Dr.x0, H - Dr.h, th, (Dr.x0 + Dr.x1) / 2, (H + Dr.h) / 2, sz, wallM);
    const Wn = C.win, ex = W + th / 2;
    box(th, H, Wn.z0 + D + th, ex, H / 2, (-D - th + Wn.z0) / 2, wallM);
    box(th, H, D + th - Wn.z1, ex, H / 2, (Wn.z1 + D + th) / 2, wallM);
    box(th, Wn.y0, Wn.z1 - Wn.z0, ex, Wn.y0 / 2, (Wn.z0 + Wn.z1) / 2, wallM);
    box(th, H - Wn.y1, Wn.z1 - Wn.z0, ex, (H + Wn.y1) / 2, (Wn.z0 + Wn.z1) / 2, wallM);
    // the observation window: a deep steel frame, double glass
    const steel = gbMat('#6d7379', { rough: 0.35, metal: 0.7, name: 'beLabWindowFrameMetal' });
    const glass = new THREE.MeshStandardMaterial({ color: '#cfe0ea', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, name: 'beLabWindowGlass', envMapIntensity: 1.4 });
    for (const dx of [-0.02, 0.1]) box(0.012, Wn.y1 - Wn.y0, Wn.z1 - Wn.z0, W + dx, (Wn.y0 + Wn.y1) / 2, (Wn.z0 + Wn.z1) / 2, glass);
    for (const [y, h] of [[Wn.y0, 0.06], [Wn.y1, 0.06]]) box(0.3, h, Wn.z1 - Wn.z0 + 0.1, W + 0.06, y, (Wn.z0 + Wn.z1) / 2, steel);
    for (const z of [Wn.z0, Wn.z1]) box(0.3, Wn.y1 - Wn.y0 + 0.1, 0.06, W + 0.06, (Wn.y0 + Wn.y1) / 2, z, steel);
    // the control room: a warm, ordinary little office (desk, screens, a lamp)
    const ctl = this.control = new THREE.Group(); R.add(ctl);
    const ofM = gbMat('#d9cdb8', { rough: 0.9, name: 'beLabCtlWallPlaster' });
    beBox(ctl, th, H, 4, W + 2.6, H / 2, 0, ofM, { cast: false }); beBox(ctl, 2.6, H, th, W + 1.3, H / 2, -2, ofM, { cast: false }); beBox(ctl, 2.6, H, th, W + 1.3, H / 2, 2, ofM, { cast: false });
    beBox(ctl, 2.6, 0.05, 4, W + 1.3, H, 0, ofM, { cast: false });
    beBox(ctl, 0.7, 0.05, 1.6, W + 0.65, 0.76, 0, gbMat('#8a6a4c', { rough: 0.6, name: 'beLabCtlDeskWood' }));
    for (const z of [-0.4, 0.35]) {
      beBox(ctl, 0.04, 0.32, 0.5, W + 0.9, 1.0, z, gbMat('#1c1e22', { rough: 0.5, name: 'beLabCtlScreenFrame' }));
      beBox(ctl, 0.01, 0.28, 0.46, W + 0.875, 1.0, z, gbMat('#5fb6d8', { rough: 0.3, emissive: '#3c9cc4', emi: 0.9, name: 'beLabCtlScreenGlow' }), { cast: false });
    }
    const cl = new THREE.PointLight('#ffd7a8', 4.5, 6, 1.4); cl.position.set(W + 1.6, 2.4, 0.4); S.add(cl);
    // the heavy door (a steel slab with a deep seal) on a pivot at x0
    const dp = this.doorPivot = new THREE.Group(); dp.position.set(Dr.x0, 0, D); R.add(dp);
    gbAdd(dp, gbRoundBox(Dr.x1 - Dr.x0 - 0.02, Dr.h - 0.02, 0.12, 0.01, 1), gbMat('#9aa1a6', { rough: 0.45, metal: 0.5, name: 'beLabDoorSteel' }), (Dr.x1 - Dr.x0) / 2, Dr.h / 2, 0.02);
    gbAdd(dp, new THREE.CylinderGeometry(0.018, 0.018, 0.3, 10), gbMat('#c8ccd0', { rough: 0.25, metal: 0.9, name: 'beLabDoorHandleMetal' }), Dr.x1 - Dr.x0 - 0.12, 1.05, -0.08, { rz: Math.PI / 2 });
    for (const x of [Dr.x0 - 0.05, Dr.x1 + 0.05]) box(0.1, Dr.h, th + 0.06, x, Dr.h / 2, sz, steel);
    box(Dr.x1 - Dr.x0 + 0.2, 0.1, th + 0.06, (Dr.x0 + Dr.x1) / 2, Dr.h + 0.05, sz, steel);
    // beyond the door: a lit corridor (only a glimpse)
    beBox(R, 4, H, th, (Dr.x0 + Dr.x1) / 2, H / 2, D + 2.2, gbMat('#d8d4cc', { rough: 0.9, name: 'beLabCorWallPlaster' }), { cast: false });
    // hanging lamps: four bars on rods (below where the wedge tips will be)
    const lampM = new THREE.MeshStandardMaterial({ color: '#fffaf0', emissive: '#fff3e0', emissiveIntensity: 2.0, name: 'beLabLampGlow' });
    const rodM = gbMat('#45494e', { rough: 0.4, metal: 0.7, name: 'beLabRodMetal' });
    this.lamps = [];
    for (const [x, z] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]]) {
      this.lamps.push(beBox(R, 0.9, 0.04, 0.12, x, 2.45, z, lampM));
      for (const dx of [-0.35, 0.35]) gbAdd(R, new THREE.CylinderGeometry(0.006, 0.006, 0.55, 6), rodM, x + dx, 2.725, z, { cast: false });
    }
    this._wedges();
    this._lights();
    beAcousticScene(R, 'world', { beLabLampGlow: { refl: 0.2, crisp: 0.3 }, beLabRodMetal: { refl: 0.15 } });
    // the reflecting planes (wavefront shells): the bare room's walls and ceiling; with foam they return ~nothing
    this.walls = [
      { p: new THREE.Vector3(0, 0, -D), n: new THREE.Vector3(0, 0, 1), refl: 0.8 }, { p: new THREE.Vector3(-W, 0, 0), n: new THREE.Vector3(1, 0, 0), refl: 0.8 },
      { p: new THREE.Vector3(W, 0, 0), n: new THREE.Vector3(-1, 0, 0), refl: 0.8 }, { p: new THREE.Vector3(0, 0, D), n: new THREE.Vector3(0, 0, -1), refl: 0.8 },
      { p: new THREE.Vector3(0, H, 0), n: new THREE.Vector3(0, -1, 0), refl: 0.7 }, { p: new THREE.Vector3(0, 0, 0), n: new THREE.Vector3(0, 1, 0), refl: 0.75, floor: true },
    ];
    // the dimension lines (scene 8: "the walls haven't moved"): drawn over everything
    const dm = new THREE.MeshBasicMaterial({ color: '#9ff6ff', transparent: true, opacity: 0, depthTest: false, name: 'beLabDimGlow' });
    this.dims = new THREE.Group(); R.add(this.dims); this.dimM = dm;
    const dl = (w, h, d, x, y, z) => { const m = gbAdd(this.dims, new THREE.BoxGeometry(w, h, d), dm, x, y, z, { cast: false, receive: false }); m.renderOrder = 9; m.userData.beSkip = true; };
    dl(2 * W, 0.012, 0.012, 0, 0.03, -D + 0.6); for (const x of [-W, W]) dl(0.012, 0.2, 0.012, x, 0.1, -D + 0.6);
    dl(0.012, 0.012, 2 * D, -W + 0.6, 0.03, 0); for (const z of [-D, D]) dl(0.012, 0.2, 0.012, -W + 0.6, 0.1, z);
    dl(0.012, H, 0.012, -W + 0.6, H / 2, -D + 0.6);
    this.dims.visible = false;
    return this;
  }
  // the foam: one instanced mesh; every block has a slot (position, facing, a 90° turn) and a growth delay
  _wedges() {
    const C = BE_LAB, W = C.W, D = C.D, H = C.H, B = C.block, dep = C.wedge, base = 0.08, r = new RNG(809);
    // one block: a base slab plus three ridges, extruded across the block (local: x across, y out of the wall, z along)
    const sh = new THREE.Shape(); sh.moveTo(-B / 2, 0);
    for (let i = 0; i < 3; i++) { const x0 = -B / 2 + i * B / 3; sh.lineTo(x0, base); sh.lineTo(x0 + B / 6, dep); sh.lineTo(x0 + B / 3, base); }
    sh.lineTo(B / 2, 0); sh.lineTo(-B / 2, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: B, bevelEnabled: false }); g.translate(0, 0, -B / 2); g.computeVertexNormals();
    const tx = beCanvasTex(256, 256, (x, w, h) => { x.fillStyle = '#6a7180'; x.fillRect(0, 0, w, h); for (let k = 0; k < 2600; k++) { const v = r.range(-1, 1); x.fillStyle = v > 0 ? `rgba(255,255,255,${0.08 * v})` : `rgba(0,0,0,${-0.18 * v})`; x.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3), r.range(1, 3)); } }, [1, 1]);
    const m = this.foamM = new THREE.MeshStandardMaterial({ map: tx, color: '#5b6474', roughness: 1, name: 'beLabFoamWedge', envMapIntensity: 0.15 });
    const slots = [], up = new THREE.Vector3(0, 1, 0);
    const add = (p, n, along) => slots.push({ p, n, along, turn: (slots.length + Math.floor(slots.length / 7)) % 2 });
    const nx = Math.round(2 * W / B), nz = Math.round(2 * D / B), ny = Math.round(H / B);
    const Dr = C.door, Wn = C.win;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = -W + (i + 0.5) * B, y = (j + 0.5) * B;
      add(new THREE.Vector3(x, y, -D), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));
      add(new THREE.Vector3(x, y, D), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));   // the closed door gets its foam too
    }
    for (let i = 0; i < nz; i++) for (let j = 0; j < ny; j++) {
      const z = -D + (i + 0.5) * B, y = (j + 0.5) * B;
      add(new THREE.Vector3(-W, y, z), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
      if (!(z > Wn.z0 && z < Wn.z1 && y > Wn.y0 && y < Wn.y1)) add(new THREE.Vector3(W, y, z), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0));
    }
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) add(new THREE.Vector3(-W + (i + 0.5) * B, H, -D + (k + 0.5) * B), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1));
    // growth order: a wave from the far upper corner (north-west ceiling) across the room
    const o = new THREE.Vector3(-W, H, -D);
    let dmax = 0; for (const s of slots) { s.d = s.p.distanceTo(o) + r.range(0, 0.5); dmax = Math.max(dmax, s.d); }
    for (const s of slots) {
      s.delay = s.d / dmax;
      // basis: local y → the wall normal, local z → along, local x → their cross
      const x = new THREE.Vector3().crossVectors(s.n, s.along).normalize();
      s.q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, s.n, s.along));
      if (s.turn) s.q.multiply(new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 2));
    }
    this.slots = slots;
    const im = this.foam = new THREE.InstancedMesh(g, m, slots.length); im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false;
    this.root.add(im); this._u = -1; this.grow(0);
  }
  // u: 0 = bare room, 1 = fully treated. Each block grows over 18 % of the sweep (a slight overshoot as it settles)
  grow(u) {
    if (u === this._u) return; this._u = u;
    const M = new THREE.Matrix4(), s = new THREE.Vector3();
    this.slots.forEach((S, i) => {
      const k = MathX.clamp((u * 1.18 - S.delay) / 0.18, 0, 1), e = k <= 0 ? 0.001 : Ease.outBack ? Ease.outBack(k) : Ease.outCubic(k);
      s.set(Math.max(0.001, Math.min(1.03, k * 1.6)), Math.max(0.001, e), Math.max(0.001, Math.min(1.03, k * 1.6)));
      M.compose(S.p, S.q, s); this.foam.setMatrixAt(i, M);
    });
    this.foam.instanceMatrix.needsUpdate = true; this.foam.visible = u > 0;
  }
  _lights() {
    const S = this.scene;
    S.add(this.hemi = new THREE.HemisphereLight('#e8eef4', '#7a7066', 0.7));
    const key = this.key = new THREE.DirectionalLight('#fff6ea', 1.6); key.position.set(1.2, 9, 1.5); key.target.position.set(0, 0, 0); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.03; key.shadow.radius = 4;
    const c = key.shadow.camera; c.left = -4; c.right = 4; c.top = 4; c.bottom = -4; c.near = 1; c.far = 14;
    S.add(key); S.add(key.target);
    this.fill = []; for (const [x, z] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]]) { const p = new THREE.PointLight('#fff4e4', 3.0, 8, 1.4); p.position.set(x, 2.3, z); S.add(p); this.fill.push(p); }
  }
}
