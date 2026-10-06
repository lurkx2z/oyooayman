/* =====================================================================
   TANK — a generic WWII medium tank (no insignia), ~6 m long: a sloped
   glacis, fenders, six road wheels a side with sprocket and idler, track
   runs whose treads crawl, a turret with mantlet, a long gun with a muzzle
   brake, a commander's cupola whose hatch opens, a hull machine gun,
   tools, spare track links, mud on the lower hull.
   State per frame: position, yaw, speed (treads and wheels), turret yaw,
   gun elevation and recoil, hatch, lights, smoke; and damage — tracks
   broken, crushed (squashed and buckled), overturned, thrown (any pose).
   ===================================================================== */

const XTANK = {
  _geo: null,
  geo() {
    if (this._geo) return this._geo;
    const G = {};
    // tread texture (crawls along U)
    const c = Tex.canvas(64, 16), x = c.getContext('2d'); x.fillStyle = '#1b1c1d'; x.fillRect(0, 0, 64, 16);
    for (let i = 0; i < 8; i++) { x.fillStyle = '#3a3b3c'; x.fillRect(i * 8 + 1, 1, 5, 14); x.fillStyle = '#121212'; x.fillRect(i * 8 + 6, 0, 2, 16); }
    G.tread = Tex.tex(c); G.tread.repeat.set(9, 1);
    // hull paint with mud toward the bottom (a vertical gradient texture)
    const pc = Tex.canvas(64, 128), px = pc.getContext('2d'), gr = px.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#5a6048'); gr.addColorStop(0.55, '#4f5440'); gr.addColorStop(0.8, '#4a4232'); gr.addColorStop(1, '#3a3022'); px.fillStyle = gr; px.fillRect(0, 0, 64, 128);
    const r = new RNG(5); for (let i = 0; i < 300; i++) { px.fillStyle = `rgba(${r.chance(0.5) ? '30,24,16' : '120,120,100'},${r.range(0.04, 0.14)})`; px.fillRect(r.range(0, 64), r.range(0, 128), r.range(1, 5), r.range(1, 4)); }
    G.paint = Tex.tex(pc);
    this._geo = G; return G;
  },
};

class XTank {
  constructor(scene, opts = {}) {
    const G = XTANK.geo();
    this.scene = scene;
    const paint = new THREE.MeshStandardMaterial({ map: G.paint, roughness: 0.75, metalness: 0.25, name: 'tankPaint' });
    const dark = Mat.std('#2a2c28', { roughness: 0.6, metalness: 0.5 }), steel = Mat.std('#3d4038', { roughness: 0.5, metalness: 0.6 });
    const treadM = new THREE.MeshStandardMaterial({ map: G.tread.clone(), roughness: 0.9, metalness: 0.2, name: 'tread' }); treadM.map.needsUpdate = true;
    this.treadM = treadM;
    const root = new THREE.Group(); root.name = 'veh:tank'; scene.add(root);
    const body = new THREE.Group(); root.add(body); this.body = body;              // (damage poses rotate this)
    const add = (g, m, p, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
    // the hull runs along +Z (front); width along X
    const L = 6.0, W = 2.9;
    add(new THREE.BoxGeometry(2.0, 0.85, 5.2), paint, body, 0, 0.95, 0);                        // lower hull between the tracks
    const up = add(new THREE.BoxGeometry(2.9, 0.62, 4.3), paint, body, 0, 1.62, -0.35);           // upper hull over the tracks
    add(new THREE.BoxGeometry(2.6, 0.12, 1.5), paint, body, 0, 1.38, 2.35, -0.62);                // glacis
    add(new THREE.BoxGeometry(2.0, 0.6, 0.12), paint, body, 0, 0.9, 2.62, 0.35);                  // lower front plate
    add(new THREE.BoxGeometry(2.7, 0.5, 0.12), paint, body, 0, 1.55, -2.52, -0.2);                // rear plate
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.62, 0.05, L), steel, body, s * 1.15, 1.32, 0);   // fenders
    // tracks and running gear
    this.wheels = [];
    for (const s of [-1, 1]) {
      const tr = new THREE.Group(); tr.position.x = s * 1.15; body.add(tr);
      const run = add(new THREE.BoxGeometry(0.5, 0.08, 5.6), treadM, tr, 0, 0.04, 0);             // bottom run
      add(new THREE.BoxGeometry(0.5, 0.08, 4.9), treadM, tr, 0, 1.22, 0);                          // top run
      add(new THREE.BoxGeometry(0.5, 0.08, 1.2), treadM, tr, 0, 0.62, 2.85, 1.05);                 // front climb
      add(new THREE.BoxGeometry(0.5, 0.08, 1.0), treadM, tr, 0, 0.62, -2.85, -1.05);
      void run;
      for (let i = 0; i < 6; i++) { const wh = add(new THREE.CylinderGeometry(0.34, 0.34, 0.36, 14), dark, tr, 0, 0.38, -2.0 + i * 0.8, 0, 0, Math.PI / 2); this.wheels.push(wh); }
      for (const [z, r] of [[2.7, 0.36], [-2.7, 0.32]]) { const sp = add(new THREE.CylinderGeometry(r, r, 0.4, 10), steel, tr, 0, 0.72, z, 0, 0, Math.PI / 2); this.wheels.push(sp); }
      for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), dark, tr, 0, 1.05, -1.6 + i * 1.6, 0, 0, Math.PI / 2);   // return rollers
    }
    // details: tools, spare links, exhausts, the hull MG, headlights
    add(new THREE.BoxGeometry(0.08, 0.08, 1.6), Mat.std('#5a3d24', { roughness: 0.8 }), body, 1.25, 1.95, -0.9);
    for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.42, 0.06, 0.16), treadM, body, -0.7 + i * 0.46, 1.62, 2.55, -0.62);
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), dark, body, s * 0.7, 1.35, -2.75, Math.PI / 2);
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), dark, body, 0.6, 1.6, 2.45, Math.PI / 2 - 0.3);
    this.mLight = new THREE.MeshStandardMaterial({ color: '#333', emissive: '#ffe6b0', emissiveIntensity: 0, roughness: 0.3 });
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 10), this.mLight, body, s * 1.15, 1.55, 2.62, Math.PI / 2);
    // turret: a faceted body on a ring, mantlet, the gun on a trunnion, the cupola and its hatch
    const tur = new THREE.Group(); tur.position.set(0, 1.93, 0.05); body.add(tur); this.turret = tur;
    add(new THREE.CylinderGeometry(0.95, 1.05, 0.12, 16), dark, tur, 0, 0.0, 0);
    const tg = new THREE.CylinderGeometry(0.88, 1.08, 0.78, 8); tg.scale(1, 1, 1.25); add(tg, paint, tur, 0, 0.42, -0.15, 0, Math.PI / 8);
    add(new THREE.BoxGeometry(0.95, 0.55, 0.3), steel, tur, 0, 0.42, 1.12);                       // mantlet
    const gun = new THREE.Group(); gun.position.set(0, 0.42, 1.2); tur.add(gun); this.gun = gun;
    const barrel = new THREE.Group(); gun.add(barrel); this.barrel = barrel;
    add(new THREE.CylinderGeometry(0.075, 0.09, 3.3, 10), steel, barrel, 0, 0, 1.65, Math.PI / 2);
    add(new THREE.CylinderGeometry(0.12, 0.12, 0.32, 10), dark, barrel, 0, 0, 3.35, Math.PI / 2);   // muzzle brake
    const cup = new THREE.Group(); cup.position.set(-0.4, 0.82, -0.45); tur.add(cup);
    add(new THREE.CylinderGeometry(0.32, 0.34, 0.24, 12), paint, cup, 0, 0.12, 0);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.25, -0.3); cup.add(hinge); this.hatch = hinge;
    add(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12), dark, hinge, 0, 0, 0.3);
    this.cupola = cup;
    // a crewman's head and shoulders for the open hatch (the commander)
    const cm = new THREE.Group(); cm.position.set(0, 0.0, 0); cup.add(cm); this.commander = cm;
    const uni = Mat.std('#4f5546', { roughness: 0.85 }), skn = Mat.std(SKIN[1], { roughness: 0.65 }), cap = Mat.std('#3f4438', { roughness: 0.8 });
    add(new THREE.CylinderGeometry(0.22, 0.2, 0.42, 8), uni, cm, 0, 0.3, 0);
    const hd = add(new THREE.SphereGeometry(0.12, 10, 8), skn, cm, 0, 0.62, 0.02); this.cmHead = hd;
    add(new THREE.SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), cap, hd, 0, 0.02, -0.01);
    cm.visible = false;
    this.root = root; this.L = L; this.W = W;
    this.dist = 0; this.mud = 0;
    // damage pieces
    this.loose = add(new THREE.BoxGeometry(0.5, 0.06, 3.2), treadM, root, 1.6, 0.03, 0.5, 0, 0.15); this.loose.visible = false;   // a broken track run lying on the ground
  }

  // s: { x, z, yaw, dist (m travelled), turret, elev, recoil (0..1), hatch (0..1), commander (bool), lights,
  //      crush (0..1), roll (rad, overturned), pitch, lift (m), spin (rad), broken (bool) }
  set(s) {
    const r = this.root;
    r.position.set(s.x, s.lift || 0, s.z); r.rotation.set(0, s.yaw || 0, 0);
    const b = this.body;
    b.rotation.set(s.pitch || 0, s.spin || 0, s.roll || 0, 'YXZ');
    b.position.y = (s.roll ? Math.abs(Math.sin(s.roll)) * 1.4 : 0);
    const cr = s.crush || 0; b.scale.set(1 + 0.06 * cr, 1 - 0.38 * cr, 1 - 0.05 * cr);
    this.turret.rotation.set(0.12 * cr, s.turret || 0, -0.18 * cr);
    this.gun.rotation.x = -(s.elev || 0) + 0.35 * cr;
    this.barrel.position.z = -0.45 * (s.recoil || 0);
    this.hatch.rotation.x = -1.9 * (s.hatch || 0);
    this.commander.visible = !!s.commander; this.commander.position.y = s.commander ? 0.25 * (s.cmUp ?? 1) : 0;
    if (s.cmLook !== undefined) this.cmHead.rotation.set(s.cmLook[0], s.cmLook[1], 0);
    this.mLight.emissiveIntensity = s.lights || 0;
    const d = s.dist || 0;
    this.treadM.map.offset.x = (-d / 0.62) % 1;
    for (const w of this.wheels) w.rotation.x = d / 0.34;
    this.loose.visible = !!s.broken;
  }
  // world points: the muzzle, the hatch, the deck (for someone to stand on)
  muzzle(out) { this.barrel.updateMatrixWorld(true); return out.set(0, 0, 3.55).applyMatrix4(this.barrel.matrixWorld); }
  deck(out, dx = 0, dz = 0) { this.body.updateMatrixWorld(true); return out.set(dx, 2.0, dz).applyMatrix4(this.body.matrixWorld); }
  turretTop(out) { this.turret.updateMatrixWorld(true); return out.set(0.25, 0.85, 0.1).applyMatrix4(this.turret.matrixWorld); }
}
