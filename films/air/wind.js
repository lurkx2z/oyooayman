/* =====================================================================
   WIND — everything the moving air pushes, on story time S.
   One wind vector (from your buildings toward the road and on down the
   street); its push is the dynamic pressure ½ρU² (airLoad, physics.js),
   so the same 60 km/h hits ten times harder in the dense air. Responses
   go by area, mass and anchoring: leaves and paper first, then fabric,
   then loose objects, then branches and signs, then structures.
   Scripted hero failures (same every playback): the bin, the umbrella,
   the pole sign, the hanging sign, the branch, the hut's roof sheet, the
   billboard. Background debris is procedural, on the same wind.
   ===================================================================== */

const AIR_WIND_DIR = new THREE.Vector3(-0.86, 0, -0.5).normalize();

// a scripted flight: keys [S, x, y, z, rx, ry, rz] → position + rotation (smooth between keys)
function airFlight(keys) {
  const tr = [1, 2, 3, 4, 5, 6].map((c) => new SmoothTrack(keys.map((k) => [k[0], k[c]])));
  return (S, o) => { o.position.set(tr[0].value(S), tr[1].value(S), tr[2].value(S)); o.rotation.set(tr[3].value(S), tr[4].value(S), tr[5].value(S)); };
}

class AirWind {
  constructor(app) {
    this.app = app; const scene = app.scene;
    this.m = {
      steel: Mat.std('#5d6268', { roughness: 0.45, metalness: 0.6 }), dark: Mat.std('#2a2d30', { roughness: 0.5, metalness: 0.5 }),
      white: Mat.std('#efece4', { roughness: 0.7 }), ply: Mat.std('#c49a62', { roughness: 0.85 }), galv: Mat.std('#a7adb2', { roughness: 0.45, metalness: 0.6 }),
      green: Mat.std('#2d6a48', { roughness: 0.7 }), bin: Mat.std('#3a5a40', { roughness: 0.6 }), roofSheet: Mat.std('#9aa3a8', { roughness: 0.4, metalness: 0.6 }),
    };
    const add = (o, p = scene) => { o.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); p.add(o); return o; };
    this.add = add;
    this._billboard(); this._scaffold(); this._umbrellas(); this._awning(); this._bladeSign(); this._poleSign(); this._bins(); this._branch(); this._roofSheet(); this._flag(); this._debris();
    this._o = new THREE.Object3D();
  }

  /* ---------------- the rooftop billboard ---------------- */
  _billboard() {
    const B = AIR_CITY.billboard, roof = 4.4 + AIR_CITY.corner.floors * FACADE_STYLES[AIR_CITY.corner.style].floorH, m = this.m;
    const g = new THREE.Group(); g.position.set(B.x, 0, B.z); g.rotation.y = B.yaw;
    // the frame stays on the roof: posts, braces, a catwalk
    for (const dz of [-5, 0, 5]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, B.base + B.h - roof, 0.3), m.steel); post.position.set(0.6, (roof + B.base + B.h) / 2, dz); g.add(post);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.14, Math.hypot(2.6, B.base + B.h - roof - 1), 0.14), m.steel); br.position.set(1.9, (roof + B.base + B.h) / 2 - 0.4, dz); br.rotation.z = Math.atan2(2.6, B.base + B.h - roof - 1); g.add(br);
    }
    const walk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, B.w), m.galv); walk.position.set(-0.6, B.base - 0.1, 0); g.add(walk);
    this.add(g);
    // the panel: an ad on a steel box; it pivots on its bottom front edge (a group placed there)
    const c = Tex.canvas(1024, 384), x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, '#f2a35e'); gr.addColorStop(0.55, '#e8735a'); gr.addColorStop(1, '#3a4f7a');
    x.fillStyle = gr; x.fillRect(0, 0, 1024, 384);
    x.fillStyle = 'rgba(255,240,215,0.9)'; x.beginPath(); x.arc(760, 210, 70, 0, 7); x.fill();
    x.fillStyle = '#23324f'; x.beginPath(); x.moveTo(520, 384); x.lineTo(640, 250); x.lineTo(700, 300); x.lineTo(820, 190); x.lineTo(1024, 330); x.lineTo(1024, 384); x.fill();
    x.fillStyle = '#ffffff'; x.font = `800 86px ${Tex.fontCond}`; x.textAlign = 'left'; x.fillText('HARBOR VIEW', 48, 150);
    x.font = `500 38px ${Tex.fontSans}`; x.fillText('Apartments · now selling', 52, 210);
    const face = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.6 });
    const pivot = new THREE.Group(); pivot.rotation.order = 'YXZ'; this.add(pivot);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, B.h, B.w), [m.dark, m.dark, m.dark, m.dark, m.dark, m.dark]);
    body.position.set(0.15, B.h / 2, 0); pivot.add(body);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(B.w, B.h), face); front.rotation.y = -Math.PI / 2; front.position.set(-0.005, B.h / 2, 0); pivot.add(front);
    pivot.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } });
    this.bill = { pivot, roof, flight: null };
    // its bolts (they let go one by one)
    this.bolts = [[-5, 0.2], [5, 0.2], [0, 0.3], [-5, 4.6]].map(([dz, y], i) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 6), m.galv); b.rotation.z = Math.PI / 2; this.app.scene.add(b); return { b, dz, y, t: AR.bill.bolts + i * 0.5 }; });
    // its flight: tips forward off the frame, then the wind carries it across the street onto the far bus shelter
    const L = LAYOUT.busStop;
    this.bill.flight = airFlight([
      [AR.bill.tear + 0.5, B.x - 1.5, B.base + 0.6, B.z, 0, 0, 1.35], [AR.bill.tear + 0.85, B.x - 5, B.base - 1.0, B.z - 0.6, 0.08, 0.05, 1.9],
      [AR.bill.tear + 1.1, 4.5, 12.5, B.z - 0.6, 0.15, 0.12, 2.4], [AR.bill.tear + 1.35, -2.0, 6.5, B.z + 0.2, 0.22, 0.18, 2.75],
      [AR.bill.glass, L.x + 3.0, 2.6, L.z + 1.0, 0.25, 0.2, 2.95], [AR.bill.glass + 0.35, L.x + 3.4, 2.2, L.z + 1.2, 0.25, 0.2, 2.98], [AR.bill.glass + 4, L.x + 3.4, 2.2, L.z + 1.2, 0.25, 0.2, 2.98],
    ]);
  }

  /* ---------------- the scaffold tower, its sheet and clamp ---------------- */
  _scaffold() {
    const S = AIR_CITY.scaffold, h = LAYOUT.curbH, m = this.m, g = new THREE.Group();
    for (const x of [S.x0, S.x1]) for (const z of [S.z0, S.z1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, S.top + 1.1, 6), m.galv); p.position.set(x, h + (S.top + 1.1) / 2, z); g.add(p); }
    for (let y = 2; y <= S.top + 0.01; y += 2) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(S.x1 - S.x0, 0.05, S.z1 - S.z0), m.ply); deck.position.set((S.x0 + S.x1) / 2, h + y, (S.z0 + S.z1) / 2); g.add(deck);
      for (const x of [S.x0, S.x1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, S.z1 - S.z0, 5), m.galv); r.rotation.x = Math.PI / 2; r.position.set(x, h + y + 1.0, (S.z0 + S.z1) / 2); g.add(r); }
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, Math.hypot(2, S.z1 - S.z0), 5), m.galv); d.position.set(S.x0, h + y - 1, (S.z0 + S.z1) / 2); d.rotation.x = Math.atan2(S.z1 - S.z0, 2); g.add(d);
    }
    this.add(g);
    // the sheet (lying across the top deck's outer edge, half off it) and the clamp beside it
    this.sheet = this.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.018, 2.4), m.ply));
    const cl = new THREE.Group(); const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.07), m.galv); cl.add(c1);
    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8), m.galv); c2.position.x = 0.07; cl.add(c2);
    this.clamp = this.add(cl);
  }

  /* ---------------- the café terrace's umbrellas and awning ---------------- */
  _umbrellas() {
    const m = this.m, cloth = [Mat.std('#e9e2d0', { roughness: 0.85, side: THREE.DoubleSide }), Mat.std('#2c5a46', { roughness: 0.85, side: THREE.DoubleSide })];
    this.umbrellas = [[11.0, -14.7], [11.0, -17.0], [11.0, -19.3]].map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, LAYOUT.curbH, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 6), m.galv); pole.position.y = 1.2; g.add(pole);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.08, 10), m.dark); base.position.y = 0.04; g.add(base);
      const top = new THREE.Group(); top.position.y = 2.25; g.add(top);
      const cg = new THREE.ConeGeometry(1.35, 0.55, 8, 1, true); cg.translate(0, 0.2, 0);
      const can = new THREE.Mesh(cg, cloth[i % 2]); top.add(can);
      for (let k = 0; k < 8; k++) { const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.42, 4), m.galv); const a = (k + 0.5) / 8 * Math.PI * 2; rib.position.set(Math.cos(a) * 0.68, 0.2, Math.sin(a) * 0.68); rib.rotation.set(0, -a, Math.PI / 2 + 0.38); top.add(rib); }
      // a table under it
      const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 14), m.white); tbl.position.set(0, 0.74, 0); g.add(tbl);
      for (const dz of [-0.7, 0.7]) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), m.dark); ch.position.set(0.1, 0.45, dz); g.add(ch); }
      this.add(g);
      return { g, top, can, x, z, i };
    });
    const U = this.umbrellas[1];
    U.flight = airFlight([[AR.brk.umbrella, U.x, LAYOUT.curbH, U.z, 0, 0, 0], [AR.brk.umbrella + 0.35, U.x - 0.6, 1.4, U.z - 0.4, 0.2, 0.3, 0.5], [AR.brk.umbrella + 0.8, U.x - 3.5, 4.2, U.z - 2.0, 0.6, 1.2, 1.6],
      [AR.brk.umbrella + 1.4, 0.0, 4.5, U.z - 5.0, 1.4, 2.6, 2.4], [AR.brk.umbrella + 2.1, -8.0, 2.5, U.z - 8.5, 2.5, 3.8, 3.4], [AR.brk.umbrella + 2.6, -10.5, 0.6, U.z - 10.5, 3.1, 4.4, 1.57], [AR.brk.umbrella + 5.4, -13.0, 0.6, U.z - 13.5, 3.1, 5.4, 1.57], [AR.brk.umbrella + 30, -13.0, 0.6, U.z - 13.5, 3.1, 5.4, 1.57]]);
  }
  _awning() {
    const F = AIR_CITY.cafe, len = F.z1 - F.z0 - 0.8, run = 1.5, g = new THREE.PlaneGeometry(len, run, 24, 6);
    const c = Tex.canvas(256, 64), x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f1ece0' : '#7a2f2a'; x.fillRect(i * 32, 0, 32, 64); }
    const tex = Tex.tex(c); tex.repeat.set(len / 2.2, 1);
    this.awnU = { uLoad: { value: 0 }, uT: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide });
    const U = this.awnU;
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLoad, uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { float out01 = (position.y + ${(run / 2).toFixed(3)}) / ${run.toFixed(3)}; float w = sin(position.x * 2.2 - uT * 11.0) * 0.5 + sin(position.x * 4.7 + uT * 17.0) * 0.3;
        transformed.z += (uLoad * 0.55 * out01 * out01 + w * 0.06 * sqrt(uLoad) * out01); }`); };
    mat.customProgramCacheKey = () => 'awn';
    const aw = new THREE.Mesh(g, mat), sl = 0.35;
    // plane x → along the facade (−z), plane y → out from the wall and down, plane normal → up
    const X = new THREE.Vector3(0, 0, -1), Y = new THREE.Vector3(-Math.cos(sl), -Math.sin(sl), 0), Z = new THREE.Vector3().crossVectors(X, Y);
    aw.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    aw.position.set(LAYOUT.frontage, 3.75, (F.z0 + F.z1) / 2).addScaledVector(Y, run / 2);
    aw.castShadow = true; aw.receiveShadow = true;
    this.app.scene.add(aw); this.awning = aw;
  }

  /* ---------------- signs ---------------- */
  _bladeSign() {
    const P = AIR_CITY.blade.sign, m = this.m, g = new THREE.Group(); g.position.set(P[0], P[1], P[2]);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.04), m.dark); arm.position.set(0.25, 0.35, 0); g.add(arm);
    const hang = new THREE.Group(); hang.position.set(-0.05, 0.33, 0); g.add(hang);
    const c = Tex.label([['THE', 34], ['KETTLE', 52], ['tea room', 28]], { w: 256, h: 192, bg: '#1f3a4a', fg: '#f3e9d2', border: '#c9a24a' });
    const face = new THREE.MeshStandardMaterial({ map: c, roughness: 0.6 });
    const sgn = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.05), [m.dark, m.dark, m.dark, m.dark, face, face]); sgn.position.set(0, -0.36, 0); hang.add(sgn);
    for (const dx of [-0.38, 0.38]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4), m.dark); ch.position.set(dx, -0.03, 0); hang.add(ch); }
    this.add(g); this.blade = { g, hang, sgn };
  }
  _poleSign() {
    const m = this.m, g = new THREE.Group(); g.position.set(7.72, LAYOUT.curbH, -7.4);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.7, 6), m.galv); pole.position.y = 1.35; g.add(pole);
    const pl = new THREE.Group(); pl.position.y = 2.3; g.add(pl);
    const t = Tex.label([['NO', 40], ['STOPPING', 44], ['ANY TIME', 30]], { w: 192, h: 256, bg: '#f4f4f0', fg: '#c0392b', border: '#c0392b' });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.64), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide })); plate.rotation.y = Math.PI / 2 - 0.25; pl.add(plate);
    this.add(g); this.pole = { g, pl, plate };
  }
  _bins() {
    const m = this.m;
    this.bins = [[8.75, -13.2], [8.75, -14.0]].map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, LAYOUT.curbH, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.0, 0.7), m.bin); body.position.set(0, 0.52, 0); g.add(body);
      const lid = new THREE.Group(); lid.position.set(0.29, 1.03, 0); g.add(lid);
      const lm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.74), m.bin); lm.position.x = -0.31; lid.add(lm);
      for (const dz of [-0.28, 0.28]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 10), m.dark); w.rotation.x = Math.PI / 2; w.position.set(0.28, 0.1, dz); g.add(w); }
      this.add(g); return { g, lid, x, z };
    });
    const B = this.bins[1];
    B.flight = airFlight([[AR.brk.bin, B.x, LAYOUT.curbH, B.z, 0, 0, 0], [AR.brk.bin + 0.45, B.x - 0.25, LAYOUT.curbH, B.z - 0.1, 0, 0.1, 1.5], [AR.brk.bin + 0.9, B.x - 1.2, 0.3, B.z - 0.8, 0.2, 0.5, 1.6],
      [AR.brk.bin + 1.4, B.x - 2.3, 0.35, B.z - 1.6, 0.6, 1.1, 1.55], [AR.brk.bin + 1.9, B.x - 3.3, 0.3, B.z - 2.3, 0.9, 1.5, 1.57], [AR.brk.bin + 2.6, B.x - 3.8, 0.3, B.z - 2.7, 1.0, 1.6, 1.57], [AR.brk.bin + 30, B.x - 3.8, 0.3, B.z - 2.7, 1.0, 1.6, 1.57]]);
  }

  /* ---------------- the branch (on the tree just ahead of you) and the hut's roof sheet ---------------- */
  _branch() {
    const [tx, tz] = AIR_CITY.branchTree, g = new THREE.Group(); g.position.set(tx + 0.12, 3.15, tz);
    const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 2.1, 6), this.app.env.m.bark); wood.geometry.translate(0, 1.05, 0); wood.rotation.z = -1.05; g.add(wood);
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), this.app.env.m.foliage); leaves.position.set(1.65, 1.0, 0); leaves.scale.set(1, 0.75, 0.9); g.add(leaves);
    const col = new Float32Array(leaves.geometry.attributes.position.count * 3).fill(0); for (let i = 0; i < col.length; i += 3) { col[i] = 0.16; col[i + 1] = 0.2; col[i + 2] = 0.11; }
    leaves.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.add(g); this.branch = { g, x: tx + 0.12, z: tz };
    this.branch.flight = airFlight([[AR.brk.branch, tx + 0.12, 3.15, tz, 0, 0, 0], [AR.brk.branch + 0.25, tx - 0.2, 3.0, tz - 0.3, 0.1, 0.1, 0.5], [AR.brk.branch + 0.6, tx - 1.8, 1.9, tz - 1.3, 0.3, 0.5, 1.4],
      [AR.brk.branch + 0.9, tx - 3.0, 0.4, tz - 2.0, 0.5, 0.7, 1.9], [AR.brk.branch + 1.3, tx - 3.8, 0.35, tz - 2.6, 0.5, 0.8, 1.95], [AR.brk.branch + 30, tx - 3.8, 0.35, tz - 2.6, 0.5, 0.8, 1.95]]);
  }
  _roofSheet() {
    const H = AIR_CITY.hut, g = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.BoxGeometry(H.w + 0.2, 0.04, H.d + 0.2), this.m.roofSheet); g.add(sh);
    for (let i = -5; i <= 5; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, H.d + 0.2), this.m.roofSheet); r.position.set(i * 0.55, 0.03, 0); g.add(r); }
    this.add(g); this.roof = { g, y: 4.25 + 0.02 };
    const R = AR.brk.roof;
    this.roof.flight = airFlight([[R, H.x, this.roof.y, H.z, 0, 0, 0], [R + 0.3, H.x - 0.4, this.roof.y + 0.5, H.z, 0, 0, 0.45], [R + 0.7, H.x - 3.5, 7.5, H.z - 1.5, 0.3, 0.4, 1.4],
      [R + 1.2, 6.5, 9.5, H.z - 4.5, 0.8, 1.0, 2.6], [R + 1.8, -4.0, 8.5, H.z - 9.0, 1.4, 1.6, 3.6], [R + 2.6, -16.0, 6.0, H.z - 14.0, 2.0, 2.1, 4.9], [R + 30, -16.0, -30.0, H.z - 14.0, 2.0, 2.1, 4.9]]);
  }
  _flag() {
    const g = new THREE.PlaneGeometry(1.4, 0.9, 16, 6); g.translate(0.7, 0, 0);
    this.flagU = { uLoad: { value: 0 }, uT: { value: 0 } };
    const c = Tex.canvas(128, 80), x = c.getContext('2d'); x.fillStyle = '#1f4f8f'; x.fillRect(0, 0, 128, 80); x.fillStyle = '#f4f0e6'; x.fillRect(0, 34, 128, 12); x.fillRect(44, 0, 12, 80);
    const mat = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.8, side: THREE.DoubleSide }), U = this.flagU;
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLoad, uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { float u = position.x / 1.4; float a = mix(1.2, 0.08, clamp(uLoad * 3.0, 0.0, 1.0));
        transformed.y -= u * a * 0.9; transformed.z += sin(position.x * 5.0 - uT * (5.0 + 14.0 * sqrt(uLoad))) * 0.12 * u * (0.3 + sqrt(uLoad)); }`); };
    mat.customProgramCacheKey = () => 'flag';
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), this.m.galv); pole.rotation.z = -Math.PI / 2 + 0.6; pole.position.set(12.0, 12.2, -35.5); this.add(pole);
    const fl = new THREE.Mesh(g, mat); fl.position.set(11.2, 12.7, -35.5); fl.castShadow = true; this.app.scene.add(fl); this.flag = fl;
  }

  /* ---------------- debris: leaves, paper and grit streaming on the wind ---------------- */
  _debris() {
    const N = 760, g = new THREE.PlaneGeometry(1, 1), mat = new THREE.MeshLambertMaterial({ vertexColors: false, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCol; varying vec3 vCol;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCol = aCol;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCol;').replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( vCol, opacity );'); };
    const im = new THREE.InstancedMesh(g, mat, N), col = new Float32Array(N * 3), rng = new RNG(2626);
    this.deb = [];
    for (let i = 0; i < N; i++) {
      const kind = rng.next() < 0.55 ? 0 : rng.next() < 0.6 ? 1 : 2;   // leaf, paper, grit
      const c = kind === 0 ? new THREE.Color().setHSL(rng.range(0.08, 0.24), 0.45, rng.range(0.22, 0.38)) : kind === 1 ? new THREE.Color().setHSL(0, 0, rng.range(0.78, 0.95)) : new THREE.Color('#8a8072');
      col.set([c.r, c.g, c.b], i * 3);
      this.deb.push({ kind, s: kind === 2 ? rng.range(0.025, 0.05) : kind === 0 ? rng.range(0.06, 0.11) : rng.range(0.12, 0.3), u: rng.next(), v: rng.next(), w: rng.next(), ph: rng.range(0, 6.28), sp: rng.range(0.6, 1.3), th: rng.next() });
    }
    im.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 3));
    im.frustumCulled = false; im.castShadow = false;
    this.app.scene.add(im); this.debM = im;
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
  }

  /* ---------------- per frame ---------------- */
  update(t, S, cam) {
    const L = airLoad(S), q = Math.sqrt(L), o = this._o, D = AIR_WIND_DIR, rest = (g, x, y, z) => { g.position.set(x, y, z); g.rotation.set(0, 0, 0); };
    // the billboard: shudders with the gusts; strains; bolts go; it tips off and sails across the street
    const B = this.bill, A = AR.bill;
    const strain = MathX.smooth(S, A.look, A.tear) * MathX.smooth(L, 0.6, 1);
    if (S < A.tear + 0.5) {
      const tip = S < A.tear ? 0.012 * L + 0.006 * L * noise1(S * 9, 3) + 0.07 * strain * (0.7 + 0.3 * noise1(S * 5, 4)) : 0.08 + 1.27 * Ease.inQuad(MathX.clamp((S - A.tear) / 0.5, 0, 1));
      const BB = AIR_CITY.billboard;
      B.pivot.position.set(BB.x - 0.15 * Math.cos(BB.yaw), BB.base, BB.z + 0.15 * Math.sin(BB.yaw));
      B.pivot.rotation.set(0.004 * L * noise1(S * 23, 5), BB.yaw, tip);
    } else { B.flight(S, B.pivot); B.pivot.rotation.y += AIR_CITY.billboard.yaw; }
    for (const b of this.bolts) {
      const u = S - b.t;
      if (u < 0 || S < 30) b.b.position.set(AIR_CITY.billboard.x + 0.2, AIR_CITY.billboard.base + b.y, AIR_CITY.billboard.z + b.dz);
      else b.b.position.set(AIR_CITY.billboard.x + 0.2 - 6 * u, AIR_CITY.billboard.base + b.y + 2 * u - 4.9 * u * u, AIR_CITY.billboard.z + b.dz - 3 * u);
      b.b.visible = u < 3;
    }
    // the scaffold's sheet and clamp: lying on the top deck; at the slip they fall (physics.js tables)
    const Sc = AIR_CITY.scaffold, top = LAYOUT.curbH + Sc.top + 0.05, u = S - AR.fall;
    const zs = (Sc.z0 + Sc.z1) / 2 - 0.4, zc = (Sc.z0 + Sc.z1) / 2 + 0.6;
    if (u < 0) { this.sheet.position.set(Sc.x0 + 0.15, top + 0.01, zs); this.sheet.rotation.set(0, 0, 0.02 * L); this.clamp.position.set(Sc.x0 + 0.1, top + 0.04, zc); this.clamp.rotation.set(0, 0.4, 0); }
    else {
      const sh = AIR_FALL.sheet.at(u), cl = AIR_FALL.clamp.at(u), land = sh.y <= 0.001;
      const sway = Math.sin(u * 2.3) * Math.min(1, u * 1.2);
      this.sheet.position.set(Sc.x0 - 0.75 - 0.6 * Math.min(u, 3.8) / 3.8 + 0.45 * sway * (land ? 0 : 1), LAYOUT.curbH + 0.01 + sh.y, zs - 0.4 * Math.min(u, 3.8) / 3.8);
      this.sheet.rotation.set(land ? 0.02 : 0.55 * Math.cos(u * 2.3) * Math.min(1, u * 1.5), 0.3 * u, land ? 0.03 : 0.5 * sway);
      this.clamp.position.set(Sc.x0 - 0.2 - 0.1 * Math.min(u, 1.7), LAYOUT.curbH + 0.04 + Math.max(0, cl.y) + (cl.y <= 0 ? Math.max(0, 0.25 * Math.sin(Math.min(Math.PI, (u - 1.66) * 9))) : 0), zc);
      this.clamp.rotation.set(u * 9, u * 4, u * 6);
      if (cl.y <= 0 && u > 2.1) this.clamp.rotation.set(0, 0.4, Math.PI / 2);
    }
    // umbrellas: the canopies lean and shake; one is torn away
    for (const U of this.umbrellas) {
      if (U.flight && S >= AR.brk.umbrella && S < 70) { U.flight(S, U.g); U.top.rotation.set(0, 0, 0); continue; }
      rest(U.g, U.x, LAYOUT.curbH, U.z);
      const lean = Math.min(0.5, 0.42 * L) + 0.05 * q * noise1(S * 7 + U.i * 3, 9);
      U.g.rotation.set(D.z * lean * 0.25, 0, -D.x * lean * 0.25);
      U.top.rotation.set(D.z * lean, noise1(S * 3 + U.i, 2) * 0.1 * q, -D.x * lean);
      U.can.scale.set(1, 1 - 0.35 * Math.min(1, L), 1);
    }
    // awning, flag
    this.awnU.uLoad.value = Math.min(1.3, L); this.awnU.uT.value = S; this.flagU.uLoad.value = Math.min(1.2, L); this.flagU.uT.value = S;
    // the hanging sign: swings with the push; at the tear it hangs off one hook and spins
    const H = this.blade.hang, bt = S - AR.brk.blade;
    if (bt < 0 || S > 70) { H.position.set(-0.05, 0.33, 0); H.rotation.set(-D.z * 0.9 * Math.min(1, L) + 0.25 * q * Math.sin(S * 4.1), 0, 0); }
    else { H.position.set(-0.43, 0.33, 0); H.rotation.set(-0.9 + 0.5 * Math.sin(bt * 6.5) * Math.exp(-bt * 0.15), 0.3 * Math.sin(bt * 4), 1.15 + 0.25 * Math.sin(bt * 7.3)); }
    // the pole sign: bends; then its mount fails and it goes down into the bike lane
    const P = this.pole, pt = S - AR.brk.sign;
    const fall = pt < 0 || S > 70 ? 0.05 * L + 0.02 * q * noise1(S * 8, 6) : Math.min(1.45, 0.05 + 1.4 * Ease.inQuad(MathX.clamp(pt / 0.55, 0, 1)));
    P.g.rotation.set(D.z * fall * 0.6, 0, -D.x * fall);
    P.pl.rotation.y = 0.3 * q * Math.sin(S * 9);
    // bins: rock, then one goes over and slides off the kerb
    for (const [i, Bn] of this.bins.entries()) {
      if (Bn.flight && S >= AR.brk.bin && S < 70) { Bn.flight(S, Bn.g); Bn.lid.rotation.z = -0.4 - 0.6 * Math.abs(Math.sin(S * 7)); continue; }
      rest(Bn.g, Bn.x, LAYOUT.curbH, Bn.z);
      Bn.g.rotation.z = 0.06 * L * (0.6 + 0.4 * noise1(S * 6 + i, 12)); Bn.lid.rotation.z = -Math.max(0, 0.5 * L + 0.3 * q * noise1(S * 9 + i, 13));
    }
    // the branch: bends with its tree, then snaps
    const Br = this.branch;
    if (S >= AR.brk.branch && S < 70) Br.flight(S, Br.g);
    else { rest(Br.g, Br.x, 3.15, Br.z); Br.g.rotation.set(0.15 * L * D.z, 0, 0.25 * L + 0.05 * q * Math.sin(S * 3.7)); Br.g.position.x += -0.5 * L; }
    // the hut's roof sheet: rattles, peels, flies
    const Rf = this.roof;
    if (S >= AR.brk.roof && S < 70) Rf.flight(S, Rf.g);
    else { rest(Rf.g, AIR_CITY.hut.x, Rf.y, AIR_CITY.hut.z); Rf.g.rotation.z = 0.01 * L * Math.sin(S * 23); Rf.g.position.y += 0.012 * L * Math.abs(Math.sin(S * 17)); }
    // debris around you: more and faster as the push grows; light things lift first
    const U = airWindKmh(S) / 3.6 * airGust(S), act = MathX.smooth(L, 0.03, 0.5), box = 34;
    let n = 0;
    for (const d of this.deb) {
      if (d.th > act * (d.kind === 2 ? 0.7 : 1.0) || U < 3) continue;
      const speed = U * d.sp * (d.kind === 1 ? 0.9 : d.kind === 0 ? 0.8 : 1.0), along = ((d.u * box + speed * S) % box) - box / 2;
      const across = (d.v - 0.5) * box, up = d.kind === 2 ? 0.05 + 0.6 * d.w : 0.1 + (d.kind === 1 ? 4 : 6) * d.w * d.w * (0.4 + L);
      const px = cam.position.x + D.x * along - D.z * across * 0.5, pz = cam.position.z - 6 + D.z * along + D.x * across * -0.5;
      this._p.set(px, LAYOUT.curbH * 0.5 + up + 0.4 * Math.sin(S * 3 * d.sp + d.ph) * (d.kind === 2 ? 0.1 : 1), pz);
      this._e.set(S * 7 * d.sp + d.ph, S * 5 * d.sp, S * 9 * d.sp); this._q.setFromEuler(this._e);
      const s = d.s * (d.kind === 2 ? 1 : 1); this._s.set(s * (d.kind === 2 ? 3.5 : 1), s, s);
      this._m4.compose(this._p, this._q, this._s); this.debM.setMatrixAt(n++, this._m4);
    }
    this.debM.count = n; this.debM.instanceMatrix.needsUpdate = true;
  }

  // world positions for the HUD tags
  sheetPos(out) { return out.copy(this.sheet.position); }
  clampPos(out) { return out.copy(this.clamp.position); }
}
