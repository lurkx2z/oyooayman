/* =====================================================================
   WIND — what the moving air pushes, on story time S.
   Before NR.loss: a 40 km/h breeze pushes everything (flags fly, the
   awning billows, umbrellas lean and shake, paper and leaves stream past).
   At NR.loss the air stops pushing solids: flags fall limp and swing,
   umbrellas and the hanging sign ring down, every leaf and sheet in flight
   keeps the velocity it had and falls on a short arc (still spinning: no
   air to stop that either). The air itself keeps moving: the steam from
   the manhole (water droplets) streaks on with the wind, faster in the
   100 km/h storm, past a street that doesn't react.
   Static set pieces copied from the Air film: the billboard, the scaffold.
   ===================================================================== */

const NR_WIND_DIR = new THREE.Vector3(-0.86, 0, -0.5).normalize();
const NR_STEAM = { x: 7.75, z: -11.5 };  // a steam grate in the pavement by the kerb, in front of you: in the hook, the storm and the last shot

class NrWind {
  constructor(app) {
    this.app = app; const scene = app.scene;
    this.m = {
      steel: Mat.std('#5d6268', { roughness: 0.45, metalness: 0.6 }), dark: Mat.std('#2a2d30', { roughness: 0.5, metalness: 0.5 }),
      white: Mat.std('#efece4', { roughness: 0.7 }), ply: Mat.std('#c49a62', { roughness: 0.85 }), galv: Mat.std('#a7adb2', { roughness: 0.45, metalness: 0.6 }),
      bin: Mat.std('#3a5a40', { roughness: 0.6 }),
    };
    this.add = (o, p = scene) => { o.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); p.add(o); return o; };
    this._billboard(); this._scaffold(); this._umbrellas(); this._awning(); this._bladeSign(); this._bins(); this._flags(); this._litter(); this._steam();
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

  /* ---------------- the scaffold tower (static) ---------------- */
  _scaffold() {
    const S = NR_CITY.scaffold, h = LAYOUT.curbH, m = this.m, g = new THREE.Group();
    for (const x of [S.x0, S.x1]) for (const z of [S.z0, S.z1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, S.top + 1.1, 6), m.galv); p.position.set(x, h + (S.top + 1.1) / 2, z); g.add(p); }
    for (let y = 2; y <= S.top + 0.01; y += 2) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(S.x1 - S.x0, 0.05, S.z1 - S.z0), m.ply); deck.position.set((S.x0 + S.x1) / 2, h + y, (S.z0 + S.z1) / 2); g.add(deck);
      for (const x of [S.x0, S.x1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, S.z1 - S.z0, 5), m.galv); r.rotation.x = Math.PI / 2; r.position.set(x, h + y + 1.0, (S.z0 + S.z1) / 2); g.add(r); }
    }
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
  _bladeSign() {
    const P = NR_CITY.blade.sign, m = this.m, g = new THREE.Group(); g.position.set(P[0], P[1], P[2]);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.04), m.dark); arm.position.set(0.25, 0.35, 0); g.add(arm);
    const hang = new THREE.Group(); hang.position.set(-0.05, 0.33, 0); g.add(hang);
    const c = Tex.label([['THE', 34], ['KETTLE', 52], ['tea room', 28]], { w: 256, h: 192, bg: '#1f3a4a', fg: '#f3e9d2', border: '#c9a24a' });
    const face = new THREE.MeshStandardMaterial({ map: c, roughness: 0.6 });
    const sgn = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.05), [m.dark, m.dark, m.dark, m.dark, face, face]); sgn.position.set(0, -0.36, 0); hang.add(sgn);
    for (const dx of [-0.38, 0.38]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4), m.dark); ch.position.set(dx, -0.03, 0); hang.add(ch); }
    this.add(g); this.blade = { g, hang, sgn };
  }
  _bins() {
    const m = this.m;
    this.bins = [[8.75, -13.2], [8.75, -14.0]].map(([x, z]) => {
      const g = new THREE.Group(); g.position.set(x, LAYOUT.curbH, z);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.0, 0.7), m.bin); body.position.set(0, 0.52, 0); g.add(body);
      const lid = new THREE.Group(); lid.position.set(0.29, 1.03, 0); g.add(lid);
      const lm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.74), m.bin); lm.position.x = -0.31; lid.add(lm);
      this.add(g); return { g, lid };
    });
  }

  /* ---------------- flags: three on the café's wall, one on the corner building, one at the kerb ---------------- */
  _flags() {
    const designs = [
      (x) => { x.fillStyle = '#2c5e3f'; x.fillRect(0, 0, 160, 100); x.fillStyle = '#f2ede2'; x.fillRect(0, 38, 160, 24); x.fillStyle = '#d8a93a'; x.beginPath(); x.arc(40, 50, 14, 0, 7); x.fill(); },
      (x) => { x.fillStyle = '#23466e'; x.fillRect(0, 0, 160, 100); x.fillStyle = '#e9e4d8'; for (let i = 0; i < 3; i++) x.fillRect(0, 12 + i * 30, 160, 9); },
      (x) => { x.fillStyle = '#8f2a26'; x.fillRect(0, 0, 160, 100); x.fillStyle = '#efe9dc'; x.beginPath(); x.moveTo(0, 0); x.lineTo(70, 50); x.lineTo(0, 100); x.fill(); },
      (x) => { x.fillStyle = '#e8e2d4'; x.fillRect(0, 0, 160, 100); x.fillStyle = '#2b5f8a'; x.fillRect(0, 0, 160, 34); x.fillRect(0, 66, 160, 34); },
    ];
    this.flags = [];
    // three on the café's wall poles, one on the corner building, and a big one on a tall pole on the pavement in front of you
    // (against open sky, above the title: the first thing you see drop)
    const spots = NR_CITY.flags.map(([x, y, z]) => ({ x, y, z, type: 'wall', Lf: 2.1, Hf: 1.3 }))
      .concat([{ x: 11.4, y: 12.85, z: -35.5, type: 'corner', Lf: 2.1, Hf: 1.3 }, { x: 7.9, y: 7.0, z: -7.0, type: 'ground', Lf: 3.0, Hf: 1.9 }]);
    spots.forEach((sp, i) => {
      const { Lf, Hf } = sp, g = new THREE.PlaneGeometry(Lf, Hf, 22, 8); g.translate(Lf / 2, -Hf / 2, 0);
      const U = { uLoad: { value: 0 }, uLimp: { value: 0 }, uRip: { value: 0 }, uT: { value: 0 }, uPh: { value: i * 1.7 } };
      const c = Tex.canvas(160, 100), x = c.getContext('2d'); designs[i % designs.length](x);
      const mat = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.8, side: THREE.DoubleSide });
      mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLoad, uLimp, uRip, uT, uPh;').replace('#include <begin_vertex>', `#include <begin_vertex>
        { float u = position.x / ${Lf.toFixed(2)}, v = -position.y / ${Hf.toFixed(2)};
          // flying: out along +x, drooping a little at low push; a travelling ripple
          float droop = mix(0.55, 0.06, clamp(uLoad, 0.0, 1.0));
          vec3 fly = vec3(position.x, position.y - u * droop, sin(position.x * 4.2 - uT * (6.0 + 6.0 * sqrt(uLoad)) + uPh) * 0.13 * u * uRip + sin(position.x * 9.0 - uT * 15.0) * 0.03 * u * uRip);
          // limp: hanging down the pole in loose folds, the fly end lowest and swung out a little, across the street (world −x:
          // local (0.86, −0.5) for a flag turned to this wind), so it reads from the pavement
          float sp = 0.06 + 0.5 * u + 0.08 * sin(u * 9.0 + v * 2.2) * u, fo = 0.15 * sin(u * 7.5 + v * 3.0 + uPh) * u + 0.05 * sin(v * 9.0) * u;
          vec3 limp = vec3(0.864 * sp + 0.503 * fo, -v * ${Hf.toFixed(2)} * (1.0 - 0.25 * u) - u * ${(Lf * 0.62).toFixed(2)}, -0.503 * sp + 0.864 * fo);
          transformed = mix(fly, limp, uLimp); }`); };
      mat.customProgramCacheKey = () => `nrFlag${Lf}x${Hf}`;
      const fl = new THREE.Mesh(g, mat); fl.position.set(sp.x, sp.y, sp.z); fl.rotation.y = Math.atan2(-NR_WIND_DIR.z, NR_WIND_DIR.x);
      fl.castShadow = true; this.app.scene.add(fl);
      if (sp.type === 'ground') {
        // a tall pole on the pavement; the flag flies from its top
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, sp.y + 0.05 - LAYOUT.curbH, 8), this.m.galv); pole.position.set(sp.x - 0.04, (sp.y + 0.05 + LAYOUT.curbH) / 2, sp.z); pole.castShadow = true; this.add(pole);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), this.m.galv); knob.position.set(sp.x - 0.04, sp.y + 0.1, sp.z); this.add(knob);
      } else {
        // a short pole angled up and out from the wall; the flag hangs from its tip
        const wx = sp.type === 'wall' ? LAYOUT.frontage - 0.05 : 12.6, wy = sp.y - 0.95, len = Math.hypot(wx - sp.x, sp.y + 0.05 - wy);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, len, 6), this.m.galv); pole.position.set((wx + sp.x) / 2, (wy + sp.y + 0.05) / 2, sp.z);
        pole.rotation.z = Math.atan2(wx - sp.x, sp.y + 0.05 - wy); this.add(pole);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), this.m.galv); knob.position.set(sp.x, sp.y + 0.06, sp.z); this.add(knob);
      }
      this.flags.push({ fl, U, z: sp.z, i });
    });
  }

  /* ---------------- litter: leaves and paper streaming on the breeze; at the change they keep their velocity and fall ---------------- */
  _litter() {
    const N = 420, g = new THREE.PlaneGeometry(1, 1), mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aCol; varying vec3 vCol;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCol = aCol;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCol;').replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( vCol, opacity );'); };
    const im = new THREE.InstancedMesh(g, mat, N), col = new Float32Array(N * 3), rng = new RNG(5151);
    this.lit = [];
    for (let i = 0; i < N; i++) {
      const kind = rng.next() < 0.6 ? 0 : 1;   // leaf, paper
      const c = kind === 0 ? new THREE.Color().setHSL(rng.range(0.08, 0.24), 0.45, rng.range(0.22, 0.38)) : new THREE.Color().setHSL(0.1, 0.06, rng.range(0.8, 0.94));
      col.set([c.r, c.g, c.b], i * 3);
      this.lit.push({ kind, s: kind === 0 ? rng.range(0.06, 0.1) : rng.range(0.14, 0.32), u: rng.next(), v: rng.next(), w: rng.next(), ph: rng.range(0, 6.28), sp: rng.range(0.6, 1.2) });
    }
    im.geometry.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 3));
    im.frustumCulled = false; im.castShadow = false;
    this.app.scene.add(im); this.litM = im;
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
    // the stream is centred where you stand during the hook
    this.litC = { x: NR_CAM.x - 4, z: NR_CAM.z0 - 9 };
  }
  // one piece in the breeze at time S: position, velocity, spin angles
  _litAt(d, S, o) {
    const U = 11.1 * d.sp * (d.kind ? 0.95 : 0.85), box = 36, D = NR_WIND_DIR, s = S;
    const along = ((d.u * box + U * s) % box) - box / 2, across = (d.v - 0.5) * box;
    const up = 0.15 + (d.kind ? 3.2 : 5.0) * d.w * d.w + 0.35 * Math.sin(s * 3 * d.sp + d.ph);
    o.x = this.litC.x + D.x * along - D.z * across * 0.6; o.z = this.litC.z + D.z * along + D.x * across * 0.6; o.y = LAYOUT.curbH * 0.5 + up;
    o.vx = D.x * U; o.vz = D.z * U; o.vy = 0.35 * 3 * d.sp * Math.cos(s * 3 * d.sp + d.ph);
    o.rx = s * 7 * d.sp + d.ph; o.ry = s * 5 * d.sp; o.rz = s * 9 * d.sp;
    return o;
  }

  /* ---------------- steam from a manhole: water droplets ride the moving air ---------------- */
  _steam() {
    this.steam = new BillboardSystem(this.app.scene, 420, false);
    this.steam.uniforms.uLight.value = 0.95;
    // the grate: a dark frame with slats, flush with the pavement
    const gr = new THREE.Group(); gr.position.set(NR_STEAM.x, LAYOUT.curbH + 0.006, NR_STEAM.z);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 1.0), Mat.std('#1c1e20', { roughness: 0.7, metalness: 0.4 })); fr.receiveShadow = true; gr.add(fr);
    for (let i = 0; i < 7; i++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.014, 0.05), this.m.steel); sl.position.set(0, 0.004, -0.4 + i * 0.133); gr.add(sl); }
    this.app.scene.add(gr);
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
    // flags: fly; at the change they drop and swing against their poles (only gravity now)
    for (const F of this.flags) {
      const lz = nrLoad(S, F.z);
      F.U.uLoad.value = Math.min(1.2, lz); F.U.uT.value = after ? NR.loss + (1 - Math.exp(-3 * u)) / 3 : S;
      F.U.uRip.value = after ? Math.exp(-3.5 * u) : 1;
      F.U.uLimp.value = after ? MathX.clamp(1 - Math.exp(-3.2 * u) * Math.cos(4.6 * u + 0.15 * F.i), 0, 1.12) : 0;
    }
    // the hanging sign: pushed out at an angle by the breeze; then it swings back like a pendulum
    const H = this.blade.hang, th0 = -D.z * 0.55;
    if (!after) H.rotation.set(th0 * Math.min(1, L) + 0.15 * q * Math.sin(S * 4.1), 0, 0);
    else H.rotation.set(th0 * nrLoadAtLoss() * Math.exp(-0.18 * u) * Math.cos(3.9 * u), 0, 0);
    // bin lids: lifted by gusts, then they drop shut
    for (const [i, Bn] of this.bins.entries()) Bn.lid.rotation.z = -Math.max(0, (0.25 * L + 0.2 * q * noise1(S * 9 + i, 13)) * a);
    // litter: streaming; after the change, each piece keeps the velocity it had and falls (and keeps spinning) until it lands
    const o = this._lo || (this._lo = {});
    let n = 0;
    for (const d of this.lit) {
      if (!after) { this._litAt(d, S, o); this._p.set(o.x, o.y, o.z); this._e.set(o.rx, o.ry, o.rz); }
      else {
        this._litAt(d, NR.loss, o);
        const tl = (o.vy + Math.sqrt(o.vy * o.vy + 2 * NR_G * Math.max(0, o.y - 0.012))) / NR_G, w = Math.min(u, tl);
        this._p.set(o.x + o.vx * w, Math.max(0.012, o.y + o.vy * w - 0.5 * NR_G * w * w), o.z + o.vz * w);
        const fx = d.ph > 3.14 ? 0 : Math.PI;
        if (u < tl) this._e.set(o.rx + 7 * d.sp * w, o.ry + 5 * d.sp * w, o.rz + 9 * d.sp * w);
        else this._e.set(Math.PI / 2 + fx * 0, d.ph, 0);
        if (u >= tl && (this._p.x < -7.1 && this._p.x > -7.4)) this._p.x -= 0.3;
      }
      if (Math.abs(this._p.x) < 7.0 && this._p.y < 0.2) this._p.y = Math.max(this._p.y, 0.012);
      else if (this._p.y < LAYOUT.curbH + 0.012) this._p.y = Math.max(this._p.y, LAYOUT.curbH + 0.012);
      this._q.setFromEuler(this._e); this._s.set(d.s, d.s * (d.kind ? 1.3 : 1), d.s);
      this._m4.compose(this._p, this._q, this._s); this.litM.setMatrixAt(n++, this._m4);
    }
    this.litM.count = n; this.litM.instanceMatrix.needsUpdate = true;
    // steam: wisps born at the grate, carried off at the wind's speed (it never stopped), torn apart and thinning as they go
    const St = this.steam, Uw = nrWindKmh(S) / 3.6, life = 1.6, rate = 44;
    St.begin(this.app.scene.fog);
    const i0 = Math.floor((S - life) * rate), i1 = Math.floor(S * rate);
    for (let i = i0; i <= i1; i++) {
      const born = i / rate + hash1(i * 3 + 1) * 0.03, age = S - born;
      if (age < 0 || age > life) continue;
      const k = age / life, drift = nrWindDist(S) - nrWindDist(born);
      const x = NR_STEAM.x + D.x * drift * 0.92 + (hash1(i * 3 + 2) - 0.5) * (0.3 + 3.2 * k);
      const z = NR_STEAM.z + D.z * drift * 0.92 + (hash1(i * 7 + 5) - 0.5) * (0.3 + 3.2 * k);
      const y = LAYOUT.curbH + 0.1 + (1.4 * age + 0.8 * k * k) * (11.1 / Math.max(11.1, Uw)) ** 0.5 + (hash1(i * 11 + 3) - 0.5) * (0.1 + 1.6 * k) + 0.25 * Math.sin(age * 2.1 + i) * k;
      const size = 0.45 + 2.5 * Math.sqrt(k) + Uw * 0.02 * k;
      St.push(x, Math.max(LAYOUT.curbH + 0.1, y), z, size, i * 1.3 + age * 0.4, 0.22 * (1 - k) ** 1.5 * Math.min(1, age * 6), 1.0, 0.95, 0.96, 0.97);
    }
    St.end();
  }
}
