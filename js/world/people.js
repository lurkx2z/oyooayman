/* =====================================================================
   PEOPLE — stylised low-poly humans with a simple joint rig and
   procedural poses (walk, idle, stumble, kneel, sit, lie…).
   Poses blend smoothly and are a pure function of time.
   ===================================================================== */

const SKIN = ['#f1c9a5', '#e0ac85', '#c68863', '#8d5b3e', '#5e3b28', '#f6d7bd'];
const LOOKS = {
  vendor:  { skin: 2, shirt: '#f2efe8', sleeves: 'short', pants: '#2b2b30', shoes: '#1a1a1a', hair: '#1f1611', apron: '#a2342a', hat: { type: 'cap', color: '#a2342a' } },
  worker:  { skin: 1, shirt: '#3d5c7c', sleeves: 'long', pants: '#3a3f46', shoes: '#5a4330', hair: '#3a2a1e', vest: '#ff7a1a', hat: { type: 'hard', color: '#f2c21b' }, gloves: '#6b5a3a' },
  rider:   { skin: 0, shirt: '#1e2124', sleeves: 'long', pants: '#1d2a3a', shoes: '#111', hair: '#222', hat: { type: 'helmet', color: '#e9e9e9' }, gloves: '#111' },
  casual1: { skin: 0, shirt: '#2e6fa8', sleeves: 'short', pants: '#2f3a4a', shoes: '#eeeeee', hair: '#5a3a22' },
  casual2: { skin: 3, shirt: '#e6e1d6', sleeves: 'long', pants: '#585048', shoes: '#3a2a20', hair: '#141010', bag: '#5a3a2a' },
  casual3: { skin: 5, shirt: '#b8433a', sleeves: 'long', pants: '#22262c', shoes: '#222', hair: '#c79a5a', long: true },
  casual4: { skin: 4, shirt: '#f0c419', sleeves: 'short', pants: '#3b4a6b', shoes: '#f4f4f4', hair: '#111' },
  casual5: { skin: 1, shirt: '#3e6b4f', sleeves: 'long', pants: '#b9ad94', shoes: '#4a3424', hair: '#6b4a2e' },
  casual6: { skin: 2, shirt: '#7d4b8c', sleeves: 'long', pants: '#1f1f24', shoes: '#111', hair: '#2a1a12', long: true },
  casual7: { skin: 0, shirt: '#d9d4c7', sleeves: 'short', pants: '#4b5563', shoes: '#ddd', hair: '#8a6a4a' },
  casual8: { skin: 3, shirt: '#1f2a44', sleeves: 'long', pants: '#6b6155', shoes: '#2a2018', hair: '#0e0b09', long: true },
};

const PersonGeo = {
  ready: false,
  init() {
    if (this.ready) return;
    this.pelvis = new THREE.RoundedBoxGeometry(0.34, 0.2, 0.21, 2, 0.06);
    this.chest = new THREE.RoundedBoxGeometry(0.37, 0.5, 0.22, 2, 0.08);
    this.neck = new THREE.CylinderGeometry(0.05, 0.055, 0.1, 8);
    this.head = new THREE.SphereGeometry(0.105, 14, 10); this.head.scale(0.95, 1.12, 1.02);
    this.hair = new THREE.SphereGeometry(0.112, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55); this.hair.scale(0.97, 1.08, 1.06);
    this.hairLong = new THREE.CylinderGeometry(0.1, 0.12, 0.22, 10, 1, true, Math.PI * 0.2, Math.PI * 1.6);
    this.nose = new THREE.BoxGeometry(0.03, 0.04, 0.03);
    this.upperArm = new THREE.CapsuleGeometry(0.05, 0.22, 4, 8);
    this.foreArm = new THREE.CapsuleGeometry(0.042, 0.2, 4, 8);
    this.hand = new THREE.SphereGeometry(0.045, 8, 6); this.hand.scale(0.8, 1.15, 0.65);
    this.thigh = new THREE.CapsuleGeometry(0.075, 0.32, 4, 8);
    this.shin = new THREE.CapsuleGeometry(0.058, 0.34, 4, 8);
    this.shoe = new THREE.RoundedBoxGeometry(0.11, 0.075, 0.27, 2, 0.03);
    this.cap = new THREE.SphereGeometry(0.118, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.42);
    this.brim = new THREE.BoxGeometry(0.17, 0.015, 0.1);
    this.hard = new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.hardBrim = new THREE.CylinderGeometry(0.16, 0.16, 0.015, 14);
    this.helmet = new THREE.SphereGeometry(0.15, 14, 10);
    this.apron = new THREE.BoxGeometry(0.34, 0.55, 0.02);
    this.vest = new THREE.RoundedBoxGeometry(0.39, 0.42, 0.24, 2, 0.07);
    this.stripe = new THREE.BoxGeometry(0.4, 0.035, 0.245);
    this.phone = new THREE.BoxGeometry(0.075, 0.14, 0.012);
    this.grinder = new THREE.BoxGeometry(0.08, 0.08, 0.32);
    this.disc = new THREE.CylinderGeometry(0.065, 0.065, 0.012, 16);
    this.tongs = new THREE.BoxGeometry(0.015, 0.015, 0.32);
    this.bag = new THREE.BoxGeometry(0.08, 0.3, 0.32);
    this.ready = true;
  },
};

/* ---- pose helpers ---- */
function basePose() {
  return {
    hipY: 0.93, pelvisPitch: 0, pelvisYaw: 0, rootRoll: 0, rootX: 0, rootZ: 0,
    spine: 0.03, spineYaw: 0, spineRoll: 0, neck: 0.04, headYaw: 0, headRoll: 0,
    lSh: [0.05, 0.08], rSh: [0.05, 0.08], lEl: 0.18, rEl: 0.18,
    lHip: [0, 0.03], rHip: [0, 0.03], lKnee: 0.04, rKnee: 0.04, lFoot: 0, rFoot: 0,
  };
}
function lerpPose(a, b, w) {
  const o = {};
  for (const k in a) {
    if (Array.isArray(a[k])) o[k] = [a[k][0] + (b[k][0] - a[k][0]) * w, a[k][1] + (b[k][1] - a[k][1]) * w];
    else o[k] = a[k] + (b[k] - a[k]) * w;
  }
  return o;
}

// each action: (τ = seconds since the action started, ctx) → pose
const ACTIONS = {
  idle(τ, c) {
    const p = basePose();
    const br = Math.sin((τ + c.seed * 5) * 1.6);
    p.spine += br * 0.012; p.lSh[1] += br * 0.01; p.rSh[1] += br * 0.01;
    p.headYaw = noise1(τ * 0.35, c.seedI) * 0.25;
    p.spineRoll = noise1(τ * 0.25, c.seedI + 3) * 0.02;
    return p;
  },
  walk(τ, c) {
    const p = basePose();
    const φ = c.walkPhase;
    const s = Math.sin(φ), co = Math.cos(φ);
    p.lHip = [0.42 * s, 0.03]; p.rHip = [-0.42 * s, 0.03];
    p.lKnee = 0.08 + 0.65 * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * Math.max(0, -co) ** 1.5;
    p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
    p.lSh = [-0.34 * s, 0.07]; p.rSh = [0.34 * s, 0.07];
    p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
    p.hipY = 0.93 - 0.032 * s * s;
    p.pelvisYaw = 0.09 * s; p.spineYaw = -0.12 * s;
    p.spine = 0.06;
    p.headYaw = noise1(τ * 0.3, c.seedI) * 0.2;
    return p;
  },
  grill(τ, c) {
    const p = ACTIONS.idle(τ, c);
    const f = Math.sin(τ * 2.2 + c.seed * 4);
    p.spine = 0.18; p.neck = 0.45;
    p.rSh = [0.9 + f * 0.12, 0.1]; p.rEl = 0.9 + f * 0.25;
    p.lSh = [0.55, 0.1]; p.lEl = 1.1;
    p.headYaw = 0.05;
    return p;
  },
  phone(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.rSh = [0.55, 0.12]; p.rEl = 1.95; p.neck = 0.42; p.spine = 0.06; p.headYaw = 0;
    p.lSh = [0.06, 0.06]; p.lEl = 0.2;
    return p;
  },
  grind(τ, c) {
    const p = basePose();
    const j = Math.sin(τ * 47) * 0.012;
    p.spine = 0.22 + j; p.neck = 0.35;
    p.lSh = [1.05 + j, 0.32]; p.lEl = 0.85; p.rSh = [0.95 - j, 0.08]; p.rEl = 0.65;
    p.lHip = [0.18, 0.08]; p.rHip = [-0.12, 0.06]; p.lKnee = 0.22; p.rKnee = 0.12; p.hipY = 0.9;
    return p;
  },
  lowerTool(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.rSh = [0.35, 0.08]; p.rEl = 0.5; p.lSh = [0.25, 0.1]; p.lEl = 0.45; p.neck = 0.15;
    return p;
  },
  recoil(τ, c) {
    const p = basePose();
    const k = Math.min(1, τ / 0.25);
    p.spine = -0.1 * k; p.neck = -0.12 * k;
    p.lSh = [0.7, 0.25]; p.lEl = 1.5; p.rSh = [0.7, 0.25]; p.rEl = 1.5;
    p.lHip = [-0.1, 0.05]; p.rKnee = 0.12;
    return p;
  },
  look(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.headYaw = Math.sin(τ * 0.85 + c.seed * 6) * 0.75 + noise1(τ * 0.6, c.seedI) * 0.2;
    p.spineYaw = p.headYaw * 0.35;
    p.neck = 0.02 + noise1(τ * 0.4, c.seedI + 9) * 0.12;
    p.lSh = [0.12, 0.12]; p.rSh = [0.12 + Math.max(0, Math.sin(τ * 0.6)) * 0.3, 0.12];
    return p;
  },
  handHead(τ, c) {
    const p = ACTIONS.idle(τ, c);
    const sw = Math.sin(τ * 1.7 + c.seed * 3);
    p.rSh = [2.15, 0.15]; p.rEl = 2.15; p.neck = 0.32; p.spine = 0.12;
    p.spineRoll = sw * 0.06; p.lKnee = 0.12; p.rKnee = 0.12; p.hipY = 0.91;
    p.lSh = [0.15, 0.3]; p.lEl = 0.3; p.headYaw = 0;
    return p;
  },
  stumble(τ, c) {
    const p = basePose();
    const a = Math.sin(τ * 2.3 + c.seed * 5), b = Math.sin(τ * 3.7 + 1.3);
    p.spine = 0.25 + b * 0.05; p.spineRoll = a * 0.16; p.neck = 0.35 + b * 0.08;
    p.lSh = [0.4, 0.55 + a * 0.2]; p.lEl = 0.35; p.rSh = [0.5, 0.35 - a * 0.2]; p.rEl = 0.6;
    p.lHip = [0.2 * a, 0.1]; p.rHip = [-0.18 * a, 0.12]; p.lKnee = 0.35; p.rKnee = 0.3;
    p.hipY = 0.86; p.rootX = a * 0.08;
    return p;
  },
  lean(τ, c) {
    const p = basePose();
    const br = Math.sin(τ * 2.4) * 0.03;
    p.spine = 0.7 + br; p.neck = 0.25; p.headYaw = 0;
    p.lSh = [1.05, 0.15]; p.lEl = 0.2; p.rSh = [1.05, 0.15]; p.rEl = 0.2;
    p.lKnee = 0.22; p.rKnee = 0.18; p.hipY = 0.89; p.rootZ = -0.08;
    return p;
  },
  kneel(τ, c) {
    const p = basePose();
    const sw = Math.sin(τ * 1.5 + c.seed * 3);
    p.hipY = 0.53; p.lHip = [0.02, 0.06]; p.rHip = [0.0, 0.06]; p.lKnee = 1.55; p.rKnee = 1.55;
    p.lFoot = 0.4; p.rFoot = 0.4;
    p.spine = 0.38 + sw * 0.05; p.spineRoll = sw * 0.08; p.neck = 0.45;
    p.lSh = [0.55, 0.12]; p.lEl = 0.35; p.rSh = [0.6, 0.12]; p.rEl = 0.3;
    return p;
  },
  sit(τ, c) {
    const p = basePose();
    p.hipY = c.seat ? c.seat + 0.05 : 0.5; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5;
    p.spine = -0.05 + Math.sin(τ * 1.5) * 0.01; p.neck = 0.1;
    p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1;
    p.headYaw = noise1(τ * 0.3, c.seedI) * 0.4;
    return p;
  },
  sitSlump(τ, c) {
    const p = ACTIONS.sit(τ, c);
    p.spine = 0.55; p.spineRoll = 0.16; p.neck = 0.65; p.headYaw = 0.1; p.headRoll = 0.2;
    p.lSh = [0.1, 0.15]; p.lEl = 0.15; p.rSh = [0.25, 0.1]; p.rEl = 0.3;
    return p;
  },
  sitGround(τ, c) {
    const p = basePose();
    p.hipY = 0.14; p.lHip = [1.95, 0.18]; p.rHip = [1.85, 0.12]; p.lKnee = 1.1; p.rKnee = 1.25;
    p.lFoot = -0.3; p.rFoot = -0.3;
    p.spine = -0.12 + MathX.smooth(τ, 1.5, 3.5) * 0.35; p.spineRoll = 0.08;
    p.neck = 0.25 + MathX.smooth(τ, 1, 3) * 0.45;
    p.lSh = [0.15, 0.25]; p.lEl = 0.25; p.rSh = [0.25, 0.2]; p.rEl = 0.4;
    return p;
  },
  lie(τ, c) {
    const p = basePose();
    p.hipY = 0.16; p.rootRoll = 1.48;
    p.lHip = [0.55, 0.05]; p.rHip = [0.25, 0.05]; p.lKnee = 0.8; p.rKnee = 0.35;
    p.spine = 0.2; p.neck = 0.25; p.headRoll = -0.2;
    p.lSh = [0.9, 0.1]; p.lEl = 0.6; p.rSh = [0.6, 0.1]; p.rEl = 0.4;
    return p;
  },
  ride(τ, c) {
    const p = basePose();
    p.hipY = 0.86; p.lHip = [1.2, 0.18]; p.rHip = [1.2, 0.18]; p.lKnee = 1.55; p.rKnee = 1.55;
    p.lFoot = 0.2; p.rFoot = 0.2;
    p.spine = 0.42; p.neck = -0.15;
    p.lSh = [1.25, 0.22]; p.lEl = 0.45; p.rSh = [1.25, 0.22]; p.rEl = 0.45;
    return p;
  },
};
const BLEND = { recoil: 0.2, lie: 1.1, kneel: 0.85, sitGround: 1.3, stumble: 0.6, sitSlump: 1.2, lean: 0.8, look: 0.6, handHead: 0.5, walk: 0.5, idle: 0.6 };

class Person {
  constructor(spec, scene) {
    PersonGeo.init();
    this.spec = spec;
    this.seed = hash1((spec.id || 'p').split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
    this.seedI = Math.floor(this.seed * 1000);
    this.look = LOOKS[spec.look] || LOOKS.casual1;
    this.scale = 0.94 + this.seed * 0.12;
    this._build();
    if (scene) scene.add(this.root);
    if (spec.path) this._preparePath();
    this.states = spec.states || [[0, 'idle']];
  }

  _mat(c, rough = 0.85) { return Mat.std(c, { roughness: rough }); }

  _build() {
    const G = PersonGeo, L = this.look;
    const skin = this._mat(SKIN[L.skin % SKIN.length], 0.7);
    const shirt = this._mat(L.shirt), pants = this._mat(L.pants), shoes = this._mat(L.shoes, 0.6), hair = this._mat(L.hair, 0.9);
    const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
    const root = new THREE.Group();
    root.name = 'person:' + (this.spec.id || '');
    const body = new THREE.Group(); body.scale.setScalar(this.scale); root.add(body);
    const hips = new THREE.Group(); body.add(hips);
    mesh(G.pelvis, pants, hips, 0, 0, 0);
    const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine);
    mesh(G.chest, shirt, spine, 0, 0.27, 0);
    if (L.vest) {
      mesh(G.vest, this._mat(L.vest, 0.6), spine, 0, 0.3, 0);
      const st = new THREE.MeshStandardMaterial({ color: '#d8d8d0', emissive: '#555', roughness: 0.3 });
      mesh(G.stripe, st, spine, 0, 0.22, 0); mesh(G.stripe, st, spine, 0, 0.36, 0);
    }
    if (L.apron) mesh(G.apron, this._mat(L.apron), spine, 0, 0.1, 0.115);
    if (L.bag) mesh(G.bag, this._mat(L.bag), spine, -0.22, 0.05, 0);
    const neck = new THREE.Group(); neck.position.y = 0.52; spine.add(neck);
    mesh(G.neck, skin, neck, 0, 0.03, 0);
    const head = new THREE.Group(); head.position.y = 0.15; neck.add(head);
    mesh(G.head, skin, head, 0, 0, 0);
    mesh(G.nose, skin, head, 0, -0.01, 0.105);
    if (!L.hat || L.hat.type === 'cap') mesh(G.hair, hair, head, 0, 0.014, -0.012).rotation.x = -0.5;
    if (L.long) mesh(G.hairLong, hair, head, 0, -0.1, -0.02);
    if (L.hat) {
      const hm = this._mat(L.hat.color, 0.5);
      if (L.hat.type === 'cap') { mesh(G.cap, hm, head, 0, 0.03, 0); mesh(G.brim, hm, head, 0, 0.045, 0.12); }
      if (L.hat.type === 'hard') { mesh(G.hard, hm, head, 0, 0.04, 0); mesh(G.hardBrim, hm, head, 0, 0.045, 0.01); }
      if (L.hat.type === 'helmet') { const h = mesh(G.helmet, this._mat(L.hat.color, 0.25), head, 0, 0.02, -0.005); mesh(new THREE.BoxGeometry(0.2, 0.07, 0.02), this._mat('#101418', 0.1), head, 0, 0.01, 0.14); }
    }
    const sleeve = L.sleeves === 'long' ? shirt : skin;
    const handMat = L.gloves ? this._mat(L.gloves) : skin;
    const arm = (side) => {
      const sh = new THREE.Group(); sh.position.set(side * 0.215, 0.47, 0); spine.add(sh);
      mesh(G.upperArm, shirt, sh, 0, -0.15, 0);
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      mesh(G.foreArm, sleeve, el, 0, -0.13, 0);
      const hand = new THREE.Group(); hand.position.y = -0.28; el.add(hand);
      mesh(G.hand, handMat, hand, 0, 0, 0);
      return { sh, el, hand };
    };
    const leg = (side) => {
      const hp = new THREE.Group(); hp.position.set(side * 0.095, -0.04, 0); hips.add(hp);
      mesh(G.thigh, pants, hp, 0, -0.225, 0);
      const kn = new THREE.Group(); kn.position.y = -0.45; hp.add(kn);
      mesh(G.shin, pants, kn, 0, -0.2, 0);
      const ft = new THREE.Group(); ft.position.y = -0.43; kn.add(ft);
      mesh(G.shoe, shoes, ft, 0, -0.005, 0.06);
      return { hp, kn, ft };
    };
    const la = arm(1), ra = arm(-1), ll = leg(1), rl = leg(-1);
    // props
    if (this.spec.look === 'worker') {
      const tool = new THREE.Group();
      mesh(G.grinder, this._mat('#2b6cb0', 0.5), tool, 0, 0, 0.12);
      const disc = mesh(G.disc, this._mat('#9aa0a6', 0.3), tool, 0.05, 0, 0.26);
      disc.rotation.z = Math.PI / 2;
      ra.hand.add(tool); tool.position.set(0, -0.04, 0); tool.rotation.x = -Math.PI / 2;
      this.tool = tool;
    }
    if (this.spec.look === 'vendor') { const t = mesh(G.tongs, this._mat('#aab0b6', 0.3), ra.hand, 0, -0.05, 0.1); t.rotation.x = -1.2; }
    if (this.spec.id === 'customer') { const ph = mesh(G.phone, this._mat('#111418', 0.2), ra.hand, 0, -0.03, 0.04); ph.rotation.x = -0.4; this.phone = ph; }
    this.root = root;
    this.j = { body, hips, spine, neck, head, la, ra, ll, rl };
  }

  _preparePath() {
    const P = this.spec.path;
    this.pathPts = P;
    this.cumDist = [0];
    for (let i = 1; i < P.length; i++) this.cumDist.push(this.cumDist[i - 1] + Math.hypot(P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]));
  }

  // position, travelled distance and facing at time t
  locate(t) {
    const P = this.pathPts;
    if (P.length === 1 || t <= P[0][0]) {
      return { x: P[0][1], z: P[0][2], dist: 0, moving: false, dir: this._dirOf(0) };
    }
    for (let i = 1; i < P.length; i++) {
      if (t <= P[i][0]) {
        const f = (t - P[i - 1][0]) / (P[i][0] - P[i - 1][0]);
        return {
          x: P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f, z: P[i - 1][2] + (P[i][2] - P[i - 1][2]) * f,
          dist: this.cumDist[i - 1] + (this.cumDist[i] - this.cumDist[i - 1]) * f, moving: true, dir: this._dirOf(i - 1),
        };
      }
    }
    const n = P.length - 1;
    return { x: P[n][1], z: P[n][2], dist: this.cumDist[n], moving: false, dir: this._dirOf(n - 1) };
  }
  _dirOf(i) {
    if (this.spec.face !== undefined) return Math.PI + MathX.deg(this.spec.face);
    const P = this.pathPts;
    if (P.length < 2) return Math.PI;
    const a = P[Math.max(0, i)], b = P[Math.min(P.length - 1, Math.max(1, i + 1))];
    return Math.atan2(b[1] - a[1], b[2] - a[2]);
  }

  poseAt(t, ctx) {
    const S = this.states;
    let i = 0;
    while (i + 1 < S.length && S[i + 1][0] <= t) i++;
    const [t0, name] = S[i];
    const cur = (ACTIONS[name] || ACTIONS.idle)(t - t0, ctx);
    const blend = BLEND[name] || 0.6;
    if (i > 0 && t - t0 < blend) {
      const [tp, pn] = S[i - 1];
      const prev = (ACTIONS[pn] || ACTIONS.idle)(t - tp, ctx);
      return lerpPose(prev, cur, Ease.inOutSine((t - t0) / blend));
    }
    return cur;
  }

  apply(P) {
    const j = this.j;
    j.hips.position.set(P.rootX, P.hipY, P.rootZ);
    j.hips.rotation.set(P.pelvisPitch, P.pelvisYaw, P.rootRoll);
    j.spine.rotation.set(P.spine, P.spineYaw, P.spineRoll);
    j.neck.rotation.set(P.neck * 0.4, P.headYaw * 0.4, 0);
    j.head.rotation.set(P.neck * 0.6, P.headYaw * 0.6, P.headRoll);
    j.la.sh.rotation.set(-P.lSh[0], 0, P.lSh[1]);
    j.ra.sh.rotation.set(-P.rSh[0], 0, -P.rSh[1]);
    j.la.el.rotation.x = -P.lEl; j.ra.el.rotation.x = -P.rEl;
    j.ll.hp.rotation.set(-P.lHip[0], 0, P.lHip[1]);
    j.rl.hp.rotation.set(-P.rHip[0], 0, -P.rHip[1]);
    j.ll.kn.rotation.x = P.lKnee; j.rl.kn.rotation.x = P.rKnee;
    j.ll.ft.rotation.x = P.lFoot; j.rl.ft.rotation.x = P.rFoot;
  }

  update(t) {
    const loc = this.locate(t);
    const ctx = { seed: this.seed, seedI: this.seedI, walkPhase: (loc.dist / 1.32) * Math.PI * 2, seat: this.spec.seat };
    this.root.position.set(loc.x, this.spec.y || 0, loc.z);
    this.root.rotation.y = loc.dir;
    this.apply(this.poseAt(t, ctx));
    if (this.tool) this.tool.visible = true;
  }

  // used by the motorcycle
  setRide(t, footDown, slump) {
    const ctx = { seed: this.seed, seedI: this.seedI };
    let p = ACTIONS.ride(t, ctx);
    if (footDown > 0) {
      const f = basePose();
      Object.assign(f, p);
      f.lHip = [0.35, 0.32]; f.lKnee = 0.25; f.lFoot = -0.1;
      p = lerpPose(p, f, footDown);
    }
    if (slump > 0) {
      const s = Object.assign({}, p);
      s.spine = 0.85; s.neck = 0.6; s.lSh = [0.4, 0.3]; s.rSh = [0.5, 0.2]; s.lEl = 0.2; s.rEl = 0.2; s.spineRoll = -0.15;
      p = lerpPose(p, s, slump);
    }
    this.apply(p);
  }
}

class PedestrianSystem {
  constructor(scene) {
    this.people = SCRIPT.people.map((spec) => new Person(spec, scene));
    this.byId = {};
    for (const p of this.people) this.byId[p.spec.id] = p;
  }
  update(t) { for (const p of this.people) p.update(t); }
}
