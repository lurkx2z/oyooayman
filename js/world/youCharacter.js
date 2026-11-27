/* =====================================================================
   YOU — the channel's reusable "you" character: the person the narrator talks to, seen from outside, with a
   face that reads at a distance. First made for films/twice-as-long; built so later films reuse it as it is.
   Additive: it only uses the shared rig (js/world/people.js: Person, basePose, LOOKS) and the hero face and
   hands (js/world/heroes.js: HeroFace, HeroHand). Load it after both.

     const you = new YouCharacter(scene, { look: {…overrides}, head: 1.18, hands: true, seed: 3 })
     you.place(x, y, z, yaw)                    feet at (x, y, z), facing yaw (0 = +z)
     you.pose(YOU_POSES.leap(u, o))             any pose object (basePose() fields), or a blend: YouCharacter.mix(a, b, w)
     you.expr('shock', t, k)                    a named expression (YOU_FACES) at strength k, with blinking from t
     you.face.set({ … })                        or the raw HeroFace controls (blink, brow, frown, worry, wide, mouth, pucker, smile)
     you.look(worldPoint, w)                    aim the eyes (w: how far the eyes turn)
     you.headWorld(out) / you.footWorld(side, out)
     you.cup(on) / you.phone(on)                the props in the right hand
   Every pose is a pure function of its arguments (phase u = 0…1, or a cycle phase in radians).
   ===================================================================== */

// the look: bright enough to read against a street, a city from the air, the black of space
const YOU_LOOK = {
  skin: 2, build: 'avg', shirt: '#ff6a1f', sleeves: 'long', pants: '#2f4f8f', shoes: '#f3f1ea', sole: '#ffffff',
  hair: '#2b1b12', jacket: true, collar: true, inner: '#f4ead8', backpack: '#1f8f8c',
};

// expressions (HeroFace controls); 'blink' is added on top by expr()
const YOU_FACES = {
  neutral: {},
  smile: { smile: 0.7, brow: 0.15 },
  grin: { smile: 1, brow: 0.35, wide: 0.2, mouth: 0.25 },
  surprise: { brow: 1, wide: 0.9, mouth: 0.45 },
  shock: { brow: 1, wide: 1, mouth: 0.85, worry: 0.4 },
  scream: { brow: 0.7, wide: 1, mouth: 1, worry: 0.8, frown: 0.2 },
  worry: { worry: 1, brow: 0.2, mouth: 0.1 },
  wince: { frown: 1, worry: 0.4, mouth: 0.3, blink: 0.55 },
  determined: { frown: 0.55, smile: 0.1, mouth: 0.05 },
  awe: { brow: 0.8, wide: 0.6, mouth: 0.5, worry: 0.2 },
  sad: { worry: 1, frown: 0.1, mouth: 0.08, blink: 0.25 },
  calm: { brow: 0.1, smile: 0.2, blink: 0.15 },
};

// poses. u: 0…1 through one step (push off → flight → land); ph: a cycle phase (radians). o: options.
const YOU_POSES = {
  stand(u = 0, o = {}) {
    const p = basePose(); p.spine += Math.sin(u * 1.3) * 0.01; p.headYaw = o.headYaw || 0; p.neck = o.neck ?? p.neck;
    p.lSh = [0.06, 0.1]; p.rSh = o.cup ? [0.55, 0.12] : [0.06, 0.1]; p.rEl = o.cup ? 1.35 : 0.2;
    return p;
  },
  // walking / running cycle; k 0 (walk) … 1 (sprint)
  run(ph, k = 0, o = {}) {
    const p = basePose(), s = Math.sin(ph), co = Math.cos(ph), A = MathX.lerp(0.42, 0.78, k);
    p.lHip = [A * s, 0.03]; p.rHip = [-A * s, 0.03];
    p.lKnee = MathX.lerp(0.08, 0.3, k) + MathX.lerp(0.65, 1.35, k) * Math.max(0, co) ** 1.4; p.rKnee = MathX.lerp(0.08, 0.3, k) + MathX.lerp(0.65, 1.35, k) * Math.max(0, -co) ** 1.4;
    p.lFoot = -0.25 * Math.max(0, co); p.rFoot = -0.25 * Math.max(0, -co);
    const aA = MathX.lerp(0.34, 0.85, k);
    p.lSh = [-aA * s, 0.08]; p.rSh = o.cup ? [0.55, 0.12] : [aA * s, 0.08];
    p.lEl = MathX.lerp(0.3, 1.45, k); p.rEl = o.cup ? 1.35 : MathX.lerp(0.3, 1.45, k);
    p.spine = MathX.lerp(0.06, 0.26, k); p.hipY = MathX.lerp(0.93, 0.9, k) - 0.03 * s * s + 0.04 * k * Math.abs(co);
    p.pelvisYaw = 0.09 * s; p.spineYaw = -0.12 * s; p.neck = -0.08 * k;
    p.headYaw = o.headYaw || 0;
    return p;
  },
  // one long step as a leap: crouch and push (u 0…0.14), the split in the air (…0.86), the landing (…1).
  // o.lead: +1 the left leg forward, −1 the right; o.reach: how wide the split is (0…1); o.arms: 'up' | 'swing' | 'flail'
  leap(u, o = {}) {
    const p = basePose(), L = o.lead ?? 1, R = o.reach ?? 1, k0 = MathX.smooth(u, 0.0, 0.14), k1 = MathX.smooth(u, 0.78, 1.0);
    const air = k0 * (1 - k1), crouch = Math.max(1 - k0 * 4, 0) * 0 + Math.exp(-(((u - 0.04) / 0.06) ** 2)) * 0.8 + Math.exp(-(((u - 0.97) / 0.05) ** 2)) * 0.9;
    const fwd = (0.95 * air) * R, back = (0.75 * air) * R;
    const lf = L > 0 ? fwd : -back, rf = L > 0 ? -back : fwd;
    p.lHip = [lf + 0.5 * crouch, 0.05]; p.rHip = [rf + 0.5 * crouch, 0.05];
    p.lKnee = (L > 0 ? 0.25 : 0.7) * air + 0.9 * crouch + 0.06; p.rKnee = (L > 0 ? 0.7 : 0.25) * air + 0.9 * crouch + 0.06;
    p.lFoot = L > 0 ? 0.2 * air : -0.35 * air; p.rFoot = L > 0 ? -0.35 * air : 0.2 * air;
    p.hipY = 0.93 - 0.2 * crouch; p.spine = 0.12 + 0.25 * crouch - 0.05 * air;
    const arms = o.arms || 'swing', t = u * Math.PI * 2;
    if (arms === 'up') { p.lSh = [2.3 * air + 0.2, 0.25]; p.rSh = [2.3 * air + 0.2, 0.25]; p.lEl = 0.3; p.rEl = 0.3; }
    else if (arms === 'flail') { p.lSh = [1.2 + 1.1 * Math.sin(t * 2.2), 0.5 + 0.3 * Math.sin(t * 1.7)]; p.rSh = [1.2 + 1.1 * Math.sin(t * 2.2 + 2.4), 0.5 + 0.3 * Math.cos(t * 1.9)]; p.lEl = 0.5; p.rEl = 0.5; }
    else { p.lSh = [(L > 0 ? -0.9 : 1.2) * air, 0.35 * air + 0.08]; p.rSh = o.cup ? [0.6, 0.15] : [(L > 0 ? 1.2 : -0.9) * air, 0.35 * air + 0.08]; p.lEl = 0.4 + 0.5 * air; p.rEl = o.cup ? 1.3 : 0.4 + 0.5 * air; }
    p.neck = -0.12 * air + 0.2 * crouch; p.headYaw = o.headYaw || 0;
    return p;
  },
  // a hard landing: deep crouch, one hand down (u 0 → 1 back up)
  land(u, o = {}) {
    const p = basePose(), k = 1 - MathX.smooth(u, 0.15, 1.0);
    p.hipY = 0.93 - 0.42 * k; p.lHip = [1.25 * k, 0.12]; p.rHip = [0.4 * k, 0.12]; p.lKnee = 0.06 + 1.9 * k; p.rKnee = 0.06 + 1.5 * k;
    p.lFoot = -0.5 * k; p.rFoot = 0.2 * k; p.spine = 0.05 + 0.55 * k; p.neck = -0.3 * k;
    p.lSh = [0.9 * k, 0.3]; p.rSh = o.cup ? [0.6, 0.2] : [0.6 * k + 0.05, 0.55 * k]; p.lEl = 0.3; p.rEl = o.cup ? 1.3 : 0.2;
    return p;
  },
  // arms windmilling for balance, knees soft (u: seconds)
  flail(u) {
    const p = basePose(); p.lSh = [1.3 + 1.0 * Math.sin(u * 9), 0.6]; p.rSh = [1.3 + 1.0 * Math.sin(u * 9 + 2.6), 0.6]; p.lEl = 0.4; p.rEl = 0.4;
    p.lKnee = 0.25; p.rKnee = 0.25; p.hipY = 0.89; p.spine = -0.05 + 0.06 * Math.sin(u * 4); p.spineRoll = 0.08 * Math.sin(u * 3);
    return p;
  },
  // looking back over a shoulder (side: +1 left, −1 right), k 0…1
  lookBack(u, k = 1, side = 1) { const p = basePose(); p.spineYaw = side * 0.45 * k; p.headYaw = side * 1.1 * k; p.lSh = [0.05, 0.12]; p.rSh = [0.05, 0.12]; p.spine += 0.01 * Math.sin(u); return p; },
  // running through nothing: a sprint with the body flat-out, hair-trigger arms (ph: cycle phase)
  void(ph, o = {}) { const p = YOU_POSES.run(ph, 1, o); p.spine = 0.32; p.neck = -0.25 + (o.neck || 0); return p; },
  // drifting, arms open (u: seconds)
  drift(u) { const p = basePose(); p.lSh = [0.4, 0.9 + 0.08 * Math.sin(u * 0.9)]; p.rSh = [0.4, 0.9 + 0.08 * Math.sin(u * 0.9 + 1)]; p.lEl = 0.35; p.rEl = 0.35; p.lHip = [0.15, 0.12]; p.rHip = [-0.1, 0.12]; p.lKnee = 0.4; p.rKnee = 0.2; p.spine = 0.05; return p; },
};

class YouCharacter {
  // blend two pose objects
  static mix(a, b, w) { return lerpPose(a, b, MathX.clamp(w, 0, 1)); }

  constructor(parent, o = {}) {
    const name = 'you' + (o.id || '');
    LOOKS[name] = Object.assign({}, YOU_LOOK, o.look || {});
    const P = new Person({ id: name, look: name }, null);
    this.person = P; this.root = P.root; this.j = P.j; this.style = P.look;   // (the look data; look() aims the eyes)
    P.j.body.scale.setScalar(o.scale || 1.0);                             // (no random height: the same you in every film)
    YouCharacter._noZ(P);
    // a bigger head reads from further away (the channel's "you" is a little stylised)
    P.j.head.scale.multiplyScalar(o.head || 1.18);
    const L = P.look;
    this.face = new HeroFace(P.j.head, { skin: SKIN[L.skin % SKIN.length], hair: L.hair, hairStyle: L.hairStyle, seed: o.seed || 11,
      iris: o.iris || [92, 64, 40], jaw: o.jaw ?? 0.28, brow: o.brow || '#22170f', lip: o.lip || '#9e5f52', nose: o.nose, wide: o.wide });
    this._seed = (o.seed || 11) * 0.37;
    if (o.hands !== false) this.hands = [new HeroHand(P.j.ra.hand, -1, this.face.skinMat), new HeroHand(P.j.la.hand, 1, this.face.skinMat)];
    // props
    const cupM = new THREE.MeshStandardMaterial({ color: '#f4efe4', roughness: 0.6 }), lidM = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.5 }), sleeveM = new THREE.MeshStandardMaterial({ color: '#b07a48', roughness: 0.9 });
    this._cup = new THREE.Group();
    const cg = new THREE.CylinderGeometry(0.042, 0.032, 0.13, 16), c = new THREE.Mesh(cg, cupM); this._cup.add(c);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.044, 0.016, 16), lidM); lid.position.y = 0.073; this._cup.add(lid);
    const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.0405, 0.0352, 0.05, 16, 1, true), sleeveM); sl.scale.setScalar(1.035); sl.position.y = -0.005; this._cup.add(sl);
    this._cup.position.set(0.0, -0.07, 0.045); this._cup.rotation.x = -0.15; this._cup.visible = false; P.j.ra.hand.add(this._cup);
    for (const m of this._cup.children) { m.castShadow = true; m.receiveShadow = true; }
    this._phone = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.15, 0.008), new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.25, metalness: 0.3 }));
    this._phone.position.set(0, -0.08, 0.035); this._phone.rotation.x = -0.25; this._phone.visible = false; P.j.ra.hand.add(this._phone);
    (parent || null) && parent.add(this.root);
  }

  // (the shared rig has a few surfaces that share a plane: nudged so nothing flickers)
  static _noZ(p) {
    const L = p.look, BG = PersonGeo.forBuild(L.build || 'avg', L);
    p.root.traverse((m) => {
      if (!m.isMesh) return; const g = m.geometry, q = g.parameters;
      if (g.type === 'BoxGeometry' && q.height === 0.035 && Math.abs(q.width - BG.B.waist * 1.02) < 1e-6) m.scale.set(1, 1.6, 1.08);
      else if (g.type === 'BoxGeometry' && q.width === 0.08 && q.depth === 0.01) m.position.z += L.shoulderBag ? 0.0015 : 0.004;
      else if (g.type === 'BoxGeometry' && q.width === 0.03 && q.depth === 0.012) m.position.z += 0.003;
      else if (L.coat && (g === BG.pelvis || g === BG.thigh)) m.scale.set(0.98, 1, 0.98);
    });
  }

  place(x, y, z, yaw = 0, roll = 0, pitch = 0) { const r = this.root; r.position.set(x, y, z); r.rotation.order = 'YXZ'; r.rotation.set(pitch, yaw, roll); r.visible = true; return this; }
  pose(p, hands = 'relax') {
    this.person.apply(p); this._p = p;
    if (this.hands) { const hp = typeof hands === 'string' ? [hands, hands] : hands; this.hands[0].pose(hp[0]); this.hands[1].pose(hp[1]); }
    this.root.updateMatrixWorld(true); return this;
  }
  // a named expression at strength k (0…1), with a natural blink (t: seconds)
  expr(name, t, k = 1, extra = {}) {
    const F = YOU_FACES[name] || {}, per = 3.3 + (this._seed % 1.6), ph = (t + this._seed * 5.3) % per, bl = ph < 0.15 ? Math.sin(ph / 0.15 * Math.PI) : 0;
    const o = {}; for (const key of ['brow', 'frown', 'worry', 'wide', 'mouth', 'pucker', 'smile']) o[key] = (F[key] || 0) * k + (extra[key] || 0);
    o.blink = Math.max(bl, (F.blink || 0) * k, extra.blink || 0);
    this.face.set(o); return this;
  }
  look(target, w = 1) { if (target) this.face.aimEyes(target.isVector3 ? target : new THREE.Vector3(...target), w); else this.face.rest(); return this; }
  headWorld(out = new THREE.Vector3()) { this.root.updateMatrixWorld(true); return this.j.head.getWorldPosition(out); }
  footWorld(side, out = new THREE.Vector3()) { this.root.updateMatrixWorld(true); return (side < 0 ? this.j.rl : this.j.ll).ft.getWorldPosition(out); }
  cup(on) { this._cup.visible = !!on; return this; }
  phone(on) { this._phone.visible = !!on; return this; }
  visible(on) { this.root.visible = !!on; return this; }
}
