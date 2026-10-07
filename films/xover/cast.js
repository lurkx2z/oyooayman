/* =====================================================================
   CAST — Killua, Eren (before he transforms) and the soldiers.
     Killua   small, pale, a mop of spiky white hair, sharp blue eyes; a
              white tee over a navy long-sleeve shirt, navy shorts, white
              and purple trainers. Hands in his pockets when he walks.
     Eren     dark hair, green eyes; a short brown jacket over a white
              shirt, harness straps, pale trousers, boots, a green cloak.
     Soldiers a generic WWII-era army (no real insignia): grey-green field
              uniforms, steel helmets, rifles held by two-hand IK; they
              aim, fire, run, freeze, lower their rifles, trip, retreat,
              are thrown by blasts.
   ===================================================================== */

LOOKS.xKillua = { skin: 5, build: 'slim', shirt: '#cfd0cf', sleeves: 'short', pants: '#232838', shoes: '#ece9f2', sole: '#7a5aa6', hair: '#e9eaf0', collar: false };
LOOKS.xEren = { skin: 1, build: 'avg', shirt: '#6e4a30', sleeves: 'long', pants: '#d6d0c2', shoes: '#33251a', sole: '#1c140e', hair: '#2a1c13', jacket: true, collar: false, inner: '#b9b2a4' };
LOOKS.xSoldier = { skin: 1, build: 'avg', shirt: '#59604e', sleeves: 'long', pants: '#4f5546', shoes: '#2a2620', sole: '#1a1714', hair: '#3a2a1e', jacket: true, collar: true, inner: '#4a503f' };
LOOKS.xSoldier2 = { skin: 2, build: 'broad', shirt: '#565c4b', sleeves: 'long', pants: '#4c5243', shoes: '#28241e', sole: '#181512', hair: '#221810', jacket: true, collar: true, inner: '#474c3d' };
LOOKS.xOfficer = { skin: 0, build: 'avg', shirt: '#4d5345', sleeves: 'long', pants: '#454b3e', shoes: '#1e1b17', sole: '#121010', hair: '#5a4630', coat: true, collar: true, inner: '#585d4e' };

// a generic steel helmet (rounded dome, short flared rim) and a rifle
const XGEO = {
  init() {
    if (this.ready) return;
    const h = new THREE.SphereGeometry(0.135, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52); h.scale(1, 0.92, 1.08);
    this.helmet = h;
    this.rim = new THREE.CylinderGeometry(0.152, 0.165, 0.035, 16, 1, true);
    // rifle: stock, body, barrel, sling (along +Z: butt at 0, muzzle at 1.12)
    const r = new THREE.Group(), wood = Mat.std('#5a3a22', { roughness: 0.7 }), metal = Mat.std('#2b2d30', { roughness: 0.4, metalness: 0.6 });
    const add = (g, m, x, y, z, rx = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.x = rx; o.castShadow = true; r.add(o); return o; };
    add(new THREE.BoxGeometry(0.04, 0.11, 0.3), wood, 0, -0.025, 0.15);
    add(new THREE.BoxGeometry(0.038, 0.06, 0.52), wood, 0, 0.0, 0.52);
    add(new THREE.BoxGeometry(0.03, 0.04, 0.16), metal, 0, 0.035, 0.38);
    add(new THREE.CylinderGeometry(0.011, 0.012, 0.5, 6), metal, 0, 0.015, 0.86, Math.PI / 2);
    add(new THREE.BoxGeometry(0.012, 0.03, 0.012), metal, 0, -0.03, 0.42);
    this.rifle = r;
    this.ready = true;
  },
};

class XPerson {
  // a person on the shared rig, with keyed motion (HeroKeys) and optional gear
  constructor(scene, id, look, opts = {}) {
    PersonGeo.init(); XGEO.init();
    this.p = new Person({ id, look, states: [[0, 'idle']] }, scene);
    this.p.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.j = this.p.j; this.opts = opts;
    if (opts.scale) this.j.body.scale.setScalar(opts.scale);
    this.v = { a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Quaternion() };
  }
  // two-bone reach (wrist onto a world point)
  reach(side, target, w = 1) { HeroActor.prototype._reach.call(this, side, target, w); }
}

/* ---------------- Killua ---------------- */
class XKillua extends HeroActor {
  constructor(scene) {
    super(scene, 'killua', 'xKillua', { skin: SKIN[5], hair: '#e3e5ec', brow: '#c9cbd4', iris: [70, 120, 190], seed: 13, wide: 0.78, jaw: 0.32, nose: 0.016, chin: 0.004, lip: '#c4867a' });
    this.j.body.scale.setScalar(0.86);
    const navy = Mat.std('#1f2433', { roughness: 0.85 }), skin = this.face.skinMat;
    // navy long sleeves under the white tee; shorts (knees and shins bare)
    for (const arm of [this.j.la, this.j.ra]) {
      arm.sh.children.forEach((o, i) => { if (o.isMesh && i > 0) o.material = navy; });
      arm.el.children.forEach((o) => { if (o.isMesh) o.material = navy; });
    }
    for (const leg of [this.j.ll, this.j.rl]) leg.kn.children.forEach((o, i) => { if (o.isMesh && i < 2) o.material = skin; });
    this.j.head.scale.setScalar(1.12);
    // the hair: a big mop of soft white spikes over the hero head's cap, flaring up and out
    const hm = new THREE.MeshStandardMaterial({ color: '#cfd2da', roughness: 0.9, flatShading: true, name: 'killuaHair' }), r = new RNG(77), H = this.j.head;
    for (let i = 0; i < 34; i++) {
      const u = r.next(), v = r.range(0.0, 0.9), th = u * Math.PI * 2, ph = v * Math.PI * 0.6;
      const dir = new THREE.Vector3(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th) * (Math.cos(th) > 0 ? 0.6 : 1));
      if (dir.z > 0.5 && dir.y < 0.5) continue;                                                       // keep the face clear
      const len = r.range(0.1, 0.17) * (dir.z > 0.3 ? 0.7 : 1), g = new THREE.ConeGeometry(r.range(0.032, 0.048), len, 5); g.translate(0, len / 2, 0);
      const m = new THREE.Mesh(g, hm); m.position.copy(dir.clone().multiplyScalar(0.075)).add(new THREE.Vector3(0, 0.035, -0.012));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().add(new THREE.Vector3(r.range(-0.35, 0.35), 0.35, r.range(-0.3, 0.05))).normalize());
      m.castShadow = true; H.add(m);
    }
    // a fringe over the forehead
    for (let i = 0; i < 9; i++) { const L = r.range(0.045, 0.08), g = new THREE.ConeGeometry(r.range(0.016, 0.026), L, 4); g.translate(0, -L / 2, 0); const m = new THREE.Mesh(g, hm);
      m.position.set((i - 4) * 0.019 + r.range(-0.006, 0.006), 0.085 + r.range(-0.008, 0.01), 0.068); m.rotation.set(-r.range(0.6, 1.2), r.range(-0.3, 0.3), (i - 4) * 0.14 + r.range(-0.25, 0.25)); m.castShadow = true; H.add(m); }
    this.layer(1);
  }
  // hands in the pockets: the wrists IK'd to the front pockets, the hands hidden inside
  pockets(w = 1) {
    if (w <= 0) { this.j.la.hand.visible = this.j.ra.hand.visible = true; return; }
    for (const side of [1, -1]) { const P = this.j.hips.localToWorld(new THREE.Vector3(side * 0.125, -0.02, 0.075)); this._reach(side, P, w); }
    this.p.root.updateMatrixWorld(true);
    this.j.la.hand.visible = this.j.ra.hand.visible = w < 0.6;
  }
}

/* ---------------- Eren ---------------- */
class XEren extends HeroActor {
  constructor(scene) {
    super(scene, 'eren', 'xEren', { skin: SKIN[1], hair: '#2a1c13', brow: '#22170f', iris: [70, 140, 100], seed: 29, nose: 0.02 });
    const strap = Mat.std('#2c1f15', { roughness: 0.7 }), cloakM = new THREE.MeshStandardMaterial({ color: '#2f4f36', roughness: 0.9, side: THREE.DoubleSide, flatShading: true, name: 'cloak' });
    const S = this.j.spine, front = BUILDS.avg.depth * 0.5;
    // short dark hair falling over the forehead
    const hm = heroHairMat('#2a1c13', 31), r = new RNG(29);
    for (let i = 0; i < 12; i++) { const L = r.range(0.05, 0.09), g = new THREE.ConeGeometry(r.range(0.014, 0.022), L, 4); g.translate(0, -L / 2, 0); const m = new THREE.Mesh(g, hm);
      const a = (i - 5.5) / 5.5; m.position.set(a * 0.065, 0.092 - Math.abs(a) * 0.02, 0.06 - Math.abs(a) * 0.02); m.rotation.set(-r.range(0.35, 0.8), a * 0.5, a * 0.35 + r.range(-0.15, 0.15)); m.castShadow = true; this.j.head.add(m); }
    for (let i = 0; i < 16; i++) { const side = i < 8 ? 1 : -1, k = (i % 8) / 7, L = r.range(0.07, 0.11), g = new THREE.ConeGeometry(r.range(0.02, 0.03), L, 4); g.translate(0, -L / 2, 0); const m = new THREE.Mesh(g, hm);
      const a = -0.25 + k * 2.2; m.position.set(side * Math.cos(a) * 0.088, 0.075 - k * 0.012, Math.sin(-a) * 0.06 - 0.01); m.rotation.set(r.range(-0.2, 0.25) + k * 0.35, 0, side * r.range(0.15, 0.35)); m.castShadow = true; this.j.head.add(m); }
    // harness: two straps over the chest, a belt
    for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.012), strap); b.position.set(s * 0.09, 0.25, front + 0.01); b.rotation.z = s * 0.12; S.add(b); }
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.24), strap); belt.position.set(0, -0.02, 0); S.add(belt);
    // the cloak: from the shoulders down the back, slightly flared
    const cg = new THREE.CylinderGeometry(0.22, 0.4, 1.0, 12, 4, true, Math.PI * 0.42, Math.PI * 1.16); cg.translate(0, -0.5, 0);
    const cl = new THREE.Mesh(cg, cloakM); cl.position.set(0, 0.52, -0.02); cl.castShadow = true; S.add(cl); this.cloak = cl;
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.45), cloakM); hood.position.set(0, 0.5, -0.12); hood.scale.set(1.1, 0.8, 0.8); S.add(hood);
    this.layer(1);
  }
}

/* ---------------- soldiers ---------------- */
// a soldier's stances: where the rifle sits relative to the chest, and where the hands grip it
const X_STANCE = {
  aim:  { p: [-0.05, 0.42, 0.12], dir: [0, 0, 1], up: [0, 1, 0] },          // shouldered, pointing forward
  port: { p: [0.02, 0.1, 0.22], dir: [0.62, 0.52, 0.32], up: [0, 0, 1] },     // across the chest (running)
  low:  { p: [-0.12, 0.05, 0.2], dir: [0.15, -0.55, 0.8], up: [0, 1, 0] },   // lowered
  hip:  { p: [-0.12, 0.12, 0.22], dir: [0, -0.05, 1], up: [0, 1, 0] },       // from the hip
};
(() => {
  const P = basePose;
  Object.assign(ACTIONS, {
    xAim(τ, c) { const p = P(); p.spine = 0.12; p.spineYaw = 0.15; p.neck = 0.12; p.headYaw = -0.12; p.lHip = [0.15, 0.08]; p.rHip = [-0.12, 0.1]; p.lKnee = 0.18; p.rKnee = 0.08; p.hipY = 0.91; return p; },
    xRecoil(τ, c) { const p = ACTIONS.xAim(τ, c), k = Math.exp(-τ / 0.08) * Math.min(1, τ / 0.02); p.spine -= 0.06 * k; p.neck -= 0.08 * k; return p; },
    xRun(τ, c) { const p = ACTIONS.jog(τ, c); p.spine = 0.22; return p; },
    xStare(τ, c) { const p = ACTIONS.idle(τ, c); p.spine = -0.05; p.neck = -0.25; p.lKnee = 0.06; return p; },
    xLower(τ, c) { const p = ACTIONS.xAim(0, c), k = MathX.smooth(τ, 0, 1.2); p.spine = MathX.lerp(0.12, -0.02, k); p.neck = MathX.lerp(0.12, 0.02, k); return p; },
    xCrouch(τ, c) { const p = P(); p.hipY = 0.62; p.lHip = [1.2, 0.1]; p.rHip = [0.6, 0.15]; p.lKnee = 1.7; p.rKnee = 1.5; p.lFoot = -0.3; p.spine = 0.35; p.neck = -0.1; return p; },
    xTrip(τ, c) { const p = ACTIONS.jog(τ, c), k = MathX.smooth(τ, 0, 0.35); p.spine = 0.22 + 0.9 * k; p.hipY = 0.9 - 0.45 * k; p.lSh = [1.2 * k, 0.3]; p.rSh = [1.3 * k, 0.3]; p.lEl = 0.4; p.rEl = 0.4; p.lKnee = 0.5 + 0.8 * k; p.rKnee = 0.3 + 1.0 * k; return p; },
    // thrown back by a blast: a short arc, flat on the back (the root's motion is keyed by the caller)
    xThrown(τ, c) { const p = P(), k = MathX.smooth(τ, 0, 0.5); p.spine = -0.4 * k; p.neck = -0.3 * k; p.lSh = [1.6, 0.6]; p.rSh = [1.4, 0.7]; p.lEl = 0.3; p.rEl = 0.5; p.lHip = [0.7 * k, 0.2]; p.rHip = [0.4 * k, 0.15]; p.lKnee = 0.6; p.rKnee = 0.9; p.hipY = 0.93 - 0.75 * k; p.pelvisPitch = -1.25 * k; return p; },
    xRadio(τ, c) { const p = ACTIONS.idle(τ, c); p.lSh = [0.4, 0.55]; p.lEl = 2.3; p.neck = 0.05; return p; },
    xHalt(τ, c) { const p = ACTIONS.idle(τ, c), k = MathX.smooth(τ, 0, 0.25); p.lSh = [2.6 * k, 0.25]; p.lEl = 0.25; p.neck = 0.04; p.spine = -0.04; return p; },
    xPoint(τ, c) { const p = ACTIONS.idle(τ, c), k = MathX.smooth(τ, 0, 0.2); p.rSh = [1.55 * k, 0.12]; p.rEl = 0.08; p.spine = 0.08 * k; p.spineYaw = -0.12 * k; p.lKnee = 0.12; return p; },
    // knocked out: the knees go, the body folds and drops to the side
    xCollapse(τ, c) { const p = P(), k = MathX.smooth(τ, 0, 0.55), f = MathX.smooth(τ, 0.25, 0.75); p.lKnee = 1.6 * k; p.rKnee = 1.3 * k; p.lHip = [1.1 * k, 0.1]; p.rHip = [0.8 * k, 0.15]; p.hipY = 0.93 - 0.72 * k;
      p.spine = 0.5 * k - 0.2 * f; p.neck = 0.4 * k; p.lSh = [0.3, 0.25 + 0.5 * f]; p.rSh = [0.2, 0.3 + 0.4 * f]; p.lEl = 0.4; p.rEl = 0.6; p.pelvisPitch = -1.2 * f; p.rootRoll = 0.4 * f; return p; },
    xFlee(τ, c) { const p = ACTIONS.jog(τ, c); p.spine = 0.3; p.lSh = [-0.4 + 0.3 * Math.sin(c.walkPhase), 0.2]; return p; },
  });
  Object.assign(BLEND, { xHalt: 0.25, xPoint: 0.2, xCollapse: 0.06, xAim: 0.3, xRecoil: 0.02, xRun: 0.3, xStare: 0.5, xLower: 0.3, xCrouch: 0.4, xTrip: 0.15, xThrown: 0.05, xRadio: 0.4, xFlee: 0.3 });
})();

class XSoldier extends XPerson {
  constructor(scene, id, look = 'xSoldier') {
    super(scene, id, look);
    const steel = Mat.std('#4b5045', { roughness: 0.55, metalness: 0.3 }), H = this.j.head;
    for (const c of H.children) if (c.geometry === PersonGeo.hair) c.visible = false;
    // the officer is seen close: a real face under the helmet
    if (look === 'xOfficer') this.face = new HeroFace(H, { skin: SKIN[0], hair: '#5a4630', brow: '#3a2a1e', iris: [95, 80, 60], seed: 8, jaw: 0.3, nose: 0.022, lip: '#a86a5e' });
    const h = new THREE.Mesh(XGEO.helmet, steel); h.position.set(0, 0.03, -0.006); h.castShadow = true; H.add(h);
    const rim = new THREE.Mesh(XGEO.rim, steel); rim.position.set(0, 0.026, -0.006); H.add(rim);
    this.rifle = XGEO.rifle.clone(); scene.add(this.rifle);
    this.keys = null;
  }
  // stance: aim | port | low | hip | none; w: how firmly the hands are on it
  update(t, keys, stance = 'aim', aimAt = null) {
    const p = this.p, K = keys || this.keys, L = K.at(t), V = this.v;
    p.root.position.set(L.x, xGround(L.x, L.z), L.z); p.root.rotation.set(0, K.yaw.value(t), 0);
    p.apply(K.pose(t, { seed: p.seed, seedI: p.seedI, walkPhase: (L.dist / 1.3) * Math.PI * 2 })); p.root.updateMatrixWorld(true);
    const st = X_STANCE[stance];
    this.rifle.visible = !!st;
    if (!st) return;
    // the rifle in chest space, pointed at the target when there is one; both hands on it
    const S = this.j.spine, m = new THREE.Matrix4();
    const pos = new THREE.Vector3(...st.p).applyMatrix4(S.matrixWorld);
    let dir = new THREE.Vector3(...st.dir).transformDirection(S.matrixWorld);
    if (aimAt && stance === 'aim') dir = aimAt.clone().sub(pos).normalize();
    const up = new THREE.Vector3(...st.up).transformDirection(S.matrixWorld), X = new THREE.Vector3().crossVectors(up, dir).normalize(), Y = new THREE.Vector3().crossVectors(dir, X);
    m.makeBasis(X, Y, dir); m.setPosition(stance === 'aim' ? pos.clone().addScaledVector(dir, -0.18) : pos);
    this.rifle.matrixAutoUpdate = false; this.rifle.matrix.copy(m); this.rifle.matrixWorldNeedsUpdate = true;
    const grip = new THREE.Vector3(0, -0.02, 0.36).applyMatrix4(m), fore = new THREE.Vector3(0, -0.02, 0.66).applyMatrix4(m);
    HeroActor.prototype._reach.call(this, -1, grip, 1); HeroActor.prototype._reach.call(this, 1, fore, 1);
    p.root.updateMatrixWorld(true);
  }
  muzzle(out) { return out.set(0, 0.015, 1.12).applyMatrix4(this.rifle.matrix); }
}
