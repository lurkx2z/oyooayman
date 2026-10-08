/* =====================================================================
   WIND — what the moving air pushes in the street below the roof, on
   story time S. Before NR.loss the 50 km/h wind pushes everything (the
   café's awning billows, its umbrellas lean and shake). At NR.loss the air
   stops pushing solids: they spring back and ring down, and stay still in
   the 110 km/h storm. The rooftop billboard (static) on the corner block.
   The roof's own laundry, bunting and smoke are in roof.js.
   ===================================================================== */

const NR_WIND_DIR = new THREE.Vector3(-0.6, 0, -0.8).normalize();   // towards the street and down the avenue

class NrWind {
  constructor(app) {
    this.app = app; const scene = app.scene;
    this.m = {
      steel: Mat.std('#5d6268', { roughness: 0.45, metalness: 0.6 }), dark: Mat.std('#2a2d30', { roughness: 0.5, metalness: 0.5 }),
      white: Mat.std('#efece4', { roughness: 0.7 }), ply: Mat.std('#c49a62', { roughness: 0.85 }), galv: Mat.std('#a7adb2', { roughness: 0.45, metalness: 0.6 }),
      bin: Mat.std('#3a5a40', { roughness: 0.6 }),
    };
    this.add = (o, p = scene) => { o.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); p.add(o); return o; };
    this._billboard(); this._umbrellas(); this._awning();
  }

  /* ---------------- the rooftop billboard (static here) ---------------- */
  _billboard() {
    const B = NR_CITY.billboard, roof = 4.4 + NR_CITY.corner.floors * FACADE_STYLES[NR_CITY.corner.style].floorH, m = this.m;
    const g = new THREE.Group(); g.position.set(B.x, 0, B.z); g.rotation.y = B.yaw;
    for (const dz of [-5, 0, 5]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, B.base + B.h - roof, 0.3), m.steel); post.position.set(0.6, (roof + B.base + B.h) / 2, dz); g.add(post);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.14, Math.hypot(2.6, B.base + B.h - roof - 1), 0.14), m.steel); br.position.set(1.9, (roof + B.base + B.h) / 2 - 0.4, dz); br.rotation.z = Math.atan2(2.6, B.base + B.h - roof - 1); g.add(br);
    }
    const c = Tex.canvas(1024, 384), x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, '#9fc6de'); gr.addColorStop(0.6, '#e9d7b8'); gr.addColorStop(1, '#5b7f6a');
    x.fillStyle = gr; x.fillRect(0, 0, 1024, 384);
    x.fillStyle = '#2f4b5e'; x.beginPath(); x.moveTo(560, 384); x.lineTo(700, 230); x.lineTo(760, 280); x.lineTo(880, 170); x.lineTo(1024, 300); x.lineTo(1024, 384); x.fill();
    x.fillStyle = '#ffffff'; x.font = `800 84px ${Tex.fontCond}`; x.textAlign = 'left'; x.fillText('SKYLINE AIR', 48, 150);
    x.font = `500 38px ${Tex.fontSans}`; x.fillText('Weekend flights from 49', 52, 210);
    const face = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, B.h, B.w), m.dark); body.position.set(0.15, B.base + B.h / 2, 0); g.add(body);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(B.w, B.h), face); front.rotation.y = -Math.PI / 2; front.position.set(-0.005, B.base + B.h / 2, 0); g.add(front);
    this.add(g);
  }

  /* ---------------- the café terrace: umbrellas and the striped awning ---------------- */
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
      const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 14), m.white); tbl.position.set(0, 0.74, 0); g.add(tbl);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6), m.dark); leg.position.y = 0.37; g.add(leg);
      for (const dz of [-0.7, 0.7]) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), m.dark); ch.position.set(0.1, 0.45, dz); g.add(ch); }
      this.add(g);
      return { g, top, can, x, z, i };
    });
  }
  _awning() {
    const F = NR_CITY.cafe, len = F.z1 - F.z0 - 0.8, run = 1.5, g = new THREE.PlaneGeometry(len, run, 24, 6);
    const c = Tex.canvas(256, 64), x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f1ece0' : '#7a2f2a'; x.fillRect(i * 32, 0, 32, 64); }
    const tex = Tex.tex(c); tex.repeat.set(len / 2.2, 1);
    this.awnU = { uLoad: { value: 0 }, uRip: { value: 0 }, uT: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide }), U = this.awnU;
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLoad, uRip, uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { float out01 = (position.y + ${(run / 2).toFixed(3)}) / ${run.toFixed(3)}; float w = sin(position.x * 2.2 - uT * 11.0) * 0.5 + sin(position.x * 4.7 + uT * 17.0) * 0.3;
        transformed.z += (uLoad * 0.3 * out01 * out01 + w * 0.07 * uRip * out01); }`); };
    mat.customProgramCacheKey = () => 'nrAwn';
    const aw = new THREE.Mesh(g, mat), sl = 0.35;
    const X = new THREE.Vector3(0, 0, -1), Y = new THREE.Vector3(-Math.cos(sl), -Math.sin(sl), 0), Z = new THREE.Vector3().crossVectors(X, Y);
    aw.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    aw.position.set(LAYOUT.frontage, 3.75, (F.z0 + F.z1) / 2).addScaledVector(Y, run / 2);
    aw.castShadow = true; aw.receiveShadow = true;
    this.app.scene.add(aw); this.awning = aw;
  }
  /* ---------------- per frame ---------------- */
  update(t, S, cam) {
    const L = nrLoad(S), a = nrAero(S), q = Math.sqrt(L), D = NR_WIND_DIR, after = S >= NR.loss, u = S - NR.loss;
    // umbrellas: lean and shake in the breeze; at the change they spring back and ring down
    for (const Um of this.umbrellas) {
      Um.g.position.set(Um.x, LAYOUT.curbH, Um.z);
      const lean = 0.32 * nrSpring(S, Um.z, 1.4, 0.08) + 0.06 * q * noise1(S * 7 + Um.i * 3, 9);
      Um.g.rotation.set(D.z * lean * 0.2, 0, -D.x * lean * 0.2);
      Um.top.rotation.set(D.z * lean, noise1(S * 3 + Um.i, 2) * 0.1 * q, -D.x * lean);
      Um.can.scale.set(1, 1 - 0.18 * Math.min(1, L), 1);
    }
    // awning: billows out and ripples; then it settles (a few slow swings)
    const aw = after ? nrLoadAtLoss() * Math.exp(-1.6 * u) * Math.cos(5.0 * u) : L;
    this.awnU.uLoad.value = aw; this.awnU.uRip.value = q * a + (after ? 0.6 * Math.exp(-2.2 * u) : 0); this.awnU.uT.value = Math.min(S, NR.loss + 1.5);
  }
}
