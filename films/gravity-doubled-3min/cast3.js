/* =====================================================================
   CAST3 — the 3-minute film's people (pure functions of t). Built on cast.js (poses, gbPlant), rig.js (GbCharacter)
   and motion.js (footholds + leg IK).
   Inside:  the HERO (holds his cup when gravity doubles; the arm sinks; the re-lift; the hologram; stands up from the
            chair; walks to the stairs, takes one step, tries the second, stops), two REGULARS chatting at the next
            table, the WAITER, the CLIMBER on the stairs (a slow climb, a hand to her chest; later she sits and rests).
   Outside: two WALKERS seen through the windows before the change; the CYCLIST (lifts her bicycle off the rack, pushes
            it up the ramp); the LEANER against the café front; the BENCH MAN; the SHOPPER and the JOGGER (who is helped
            up at the end); the ENGINEER under the loaded balcony; the HERO again at the edge of the square and by the
            fountain; pigeons; the parked car.
   ===================================================================== */

Object.assign(GB_LOOKS, {
  climber: { skin: '#7a4e3c', lip: '#3e2020', top: '#a3485a', topDark: '#82384a', pants: '#3a3448', shoes: '#4a3530', sole: '#1a1414', hair: '#d8d0c6',
    hairStyle: 'bun', build: 0.95, head: 0.98 },
  patronA: { skin: '#b07a5a', lip: '#5a2f2a', top: '#5a6a8e', topDark: '#48577a', pants: '#2e2a3a', shoes: '#3a2f2a', sole: '#1a1414', hair: '#3a2a22',
    hairStyle: 'short', build: 1.02, head: 1.0 },
  patronB: { skin: '#6a4434', lip: '#3a1c1a', top: '#c48a4a', topDark: '#a2703a', pants: '#2a2836', shoes: '#2b2224', sole: '#151214', hair: '#1a1214',
    hairStyle: 'pony', build: 0.9, head: 0.96 },
  cyclist: { skin: '#a46d4f', lip: '#5a2f2a', top: '#4f8a6e', topDark: '#3c6e56', pants: '#2a2a3c', shoes: '#d8d0c4', sole: '#6a5a4a', hair: '#2a1a14',
    hairStyle: 'pony', build: 0.92, head: 0.96 },
  leaner: { skin: '#8a5a43', lip: '#4a2622', top: '#6e5a8a', topDark: '#5a4872', pants: '#2e2a3a', shoes: '#3b2e2a', sole: '#1a1414', hair: '#2a1e1a',
    hairStyle: 'short', build: 1.0, head: 1.0 },
  engineer: { skin: '#5e3c2f', lip: '#2c1719', top: '#e39a2e', topDark: '#c27c22', pants: '#2c3446', shoes: '#3a2f2a', sole: '#1b1615', hair: '#1a1214',
    hairStyle: 'short', build: 1.06, head: 1.0 },
});

// extra poses for this film
(function () {
  const T = GB_POSES.stand, S = GB_POSES.sit, P = (o) => Object.assign({}, S, o), Q = (o) => Object.assign({}, T, o);
  Object.assign(GB_POSES, {
    // the hero holding his cup before the change (the IK arm does the cup; the body is relaxed, leaning in a little)
    sitCup: P({ spX: 4, chX: 1, nkX: 0, hdX: 8, hdY: 2, LShX: -34, LElX: -64, LShAbd: 10, RShX: -30, RElX: -70, RShAbd: 8 }),
    sitStare2: P({ rootY: -0.385, pelX: 3, spX: 12, chX: 8, nkX: 6, hdX: 16, LShX: -34, RShX: -32, LElX: -58, RElX: -60, LShrug: -0.02, RShrug: -0.02 }),
    // up from the chair: braced on the table with both hands, knees soft
    heroUp: { pelX: 12, LHipX: -20, RHipX: -18, LKnX: 22, RKnX: 20, LAnX: -4, RAnX: -4, LHipAbd: 7, RHipAbd: 6, spX: 16, chX: 10, nkX: -4, hdX: 6,
      LShX: -40, RShX: -40, LElX: -10, RElX: -10, LShrug: 0.02, RShrug: 0.02, LFing: 0.1, RFing: 0.1, LThumb: 0.2, RThumb: 0.2 },
    // walking heavy (upper body only; the legs come from the footholds)
    walkHeavy: Q({ pelX: 8, spX: 12, chX: 6, nkX: -4, hdX: 4, LShX: -6, RShX: -6, LShAbd: 10, RShAbd: 10, LElX: -22, RElX: -22, LShrug: -0.02, RShrug: -0.02 }),
    climbHeavy: Q({ pelX: 14, spX: 18, chX: 10, nkX: -10, hdX: -2, LShX: -10, LShAbd: 12, LElX: -30, RShX: -30, RShAbd: 22, RElX: -30, LShrug: 0.0, RShrug: 0.02 }),
    climbRest: Q({ pelX: 10, spX: 22, chX: 14, nkX: 2, hdX: 14, LShX: -14, LShAbd: 10, LElX: -40, RShX: -26, RShAbd: 24, RElX: -36, LShrug: -0.03, RShrug: 0.0 }),
    standLook: Q({ pelX: 4, spX: 6, chX: 2, nkX: -8, hdX: -14, LShAbd: 9, RShAbd: 9, LElX: -14, RElX: -14, LShrug: -0.02, RShrug: -0.02 }),
    standTired: Q({ pelX: 6, spX: 10, chX: 8, nkX: 4, hdX: 8, LShAbd: 9, RShAbd: 9, LElX: -18, RElX: -18, LShrug: -0.03, RShrug: -0.03 }),
    // leaning back against a wall: hips forward, shoulders back on the wall, knees soft, head tipped back
    wallLean: Q({ pelX: -6, spX: -6, chX: -4, nkX: -6, hdX: -10, LShAbd: 14, RShAbd: 12, LShX: 8, RShX: 6, LElX: -12, RElX: -14, LFing: 0.5, RFing: 0.5, LShrug: -0.03, RShrug: -0.03 }),
    // seated on a stair, elbows on the knees
    stairSit: P({ rootY: 0, spX: 18, chX: 14, nkX: 4, hdX: 6, LShX: -40, RShX: -40, LElX: -70, RElX: -70, LShAbd: 14, RShAbd: 14, LShrug: -0.02, RShrug: -0.02 }),
    // the regulars at their table: chatting, then sagging
    chatA: P({ spX: 2, chX: -2, hdX: 4, hdY: 6, LShX: -40, LElX: -70, LShAbd: 14, RShX: -46, RElX: -84, RShAbd: 16 }),
    chatB: P({ spX: 6, chX: 2, hdX: 2, hdY: -8, LShX: -36, LElX: -76, LShAbd: 10, RShX: -38, RElX: -76, RShAbd: 10 }),
    // the engineer looking up at the bracket, tablet in the left hand, the right hand pointing a torch
    engLook: Q({ pelX: -2, spX: -4, chX: -8, nkX: -16, hdX: -24, hdY: 6, LShX: -50, LShAbd: 8, LElX: -80, RShX: -112, RShAbd: 16, RElX: -14, RFing: 0.8, RThumb: 0.7, LFing: 0.6 }),
    engNote: Q({ pelX: 2, spX: 6, chX: 4, nkX: 6, hdX: 18, LShX: -52, LShAbd: 8, LElX: -84, RShX: -40, RShAbd: 10, RElX: -74, RFing: 0.7, LFing: 0.6 }),
    // pushing a bicycle uphill: leaning into it, both arms forward
    bikePush: Q({ pelX: 16, spX: 18, chX: 8, nkX: -12, hdX: -6, LShX: -50, LShAbd: 6, LElX: -24, RShX: -50, RShAbd: 6, RElX: -24, LShrug: 0.02, RShrug: 0.02 }),
    bikeLift: Q({ pelX: 20, spX: 18, chX: 8, nkX: -12, hdX: -4, LShX: -60, LShAbd: 8, LElX: -16, RShX: -40, RShAbd: 18, RElX: -40, LShrug: 0.035, RShrug: 0.035 }),
    // helping someone up: leaning back, both arms out
    helpPull: Q({ pelX: -4, spX: -6, chX: -4, nkX: 4, hdX: 12, LShX: -70, LShAbd: 4, LElX: -6, RShX: -64, RShAbd: 4, RElX: -8, LFing: 0.8, RFing: 0.8, LShrug: 0.02, RShrug: 0.02 }),
  });
})();

// hero cup beats (scenes 1–2): the cup's height above the saucer
const GB_CUP_UP = 0.16, GB_CUP_LIFT = 0.055;

class GbCast3 {
  constructor(app, cafe) {
    this.app = app; this.cafe = cafe;
    const S = app.scene, mk = (look) => new GbCharacter(S, look);
    this.hero = mk('hero'); this.waiter = mk('waiter'); this.climber = mk('climber');
    this.patA = mk('patronA'); this.patB = mk('patronB');
    this.benchMan = mk('sitter'); this.shopper = mk('shopper'); this.jogger = mk('jogger');
    this.cyclist = mk('cyclist'); this.leaner = mk('leaner'); this.engineer = mk('engineer');
    this.inside = [this.waiter, this.climber, this.patA, this.patB];
    this.outside = [this.benchMan, this.shopper, this.jogger, this.cyclist, this.leaner, this.engineer];
    this._props();
    this._pigeons();
    this._helmet();
    this.car = new GbCar(S, { color: '#7fa392' });
    this.car.place(...GB_SET.car);
    this.bike = this._bike(); S.add(this.bike.g);
    this.tmp = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    this._plans();
  }

  // ------------------------------------------------------------------------------------------ props
  _cup(china, coffee) {
    const g = new THREE.Group();
    gbAdd(g, gbLathe([[0, 0.0], [0.034, 0.0], [0.04, 0.006], [0.044, 0.04], [0.046, 0.082], [0.042, 0.084], [0.039, 0.05], [0.036, 0.012], [0, 0.012]], 32), china);
    gbAdd(g, new THREE.TorusGeometry(0.022, 0.0065, 8, 18, Math.PI * 1.25), china, 0, 0.045, 0.048, { rz: -Math.PI * 0.62, ry: Math.PI / 2 });
    const surf = gbAdd(g, new THREE.CircleGeometry(0.039, 24), coffee, 0, 0.066, 0, { rx: -Math.PI / 2, cast: false });
    g.userData.surf = surf;
    return g;
  }

  _props() {
    const S = this.app.scene;
    this.china = gbMat('#cbc1b2', { rough: 0.62, name: 'gbChina', env: 0.3 });
    const coffee = gbMat('#3a2014', { rough: 0.15, name: 'gbCoffee', env: 1.0 });
    this.cup = this._cup(this.china, coffee); S.add(this.cup);
    this.steam = new BillboardSystem(S, 48, false);
    this.steam.uniforms.uLight.value = 1.0;
    // his phone on the table (lit by the hologram in scene 3)
    const [tx, tz] = GB_SET.heroTable, y = GB_SET.tableH;
    this.phone = new THREE.Group(); this.phone.position.set(tx - 0.02, y + 0.005, tz - 0.2); this.phone.rotation.y = 0.35; S.add(this.phone);
    gbAdd(this.phone, gbRoundBox(0.075, 0.009, 0.15, 0.008, 2), gbMat('#1d1b22', { rough: 0.3, metal: 0.4, env: 1.0 }), 0, 0, 0);
    this.phoneScreenM = new THREE.MeshStandardMaterial({ color: '#141a24', emissive: '#7fb8ff', emissiveIntensity: 0.0, roughness: 0.1, name: 'gbPhoneScreen' });
    gbAdd(this.phone, new THREE.PlaneGeometry(0.066, 0.14), this.phoneScreenM, 0, 0.0047, 0, { rx: -Math.PI / 2, cast: false });
    // the passer-by's bag
    const bagM = gbMat('#c9a06a', { rough: 0.9, rim: 0.2, name: 'gbBag' });
    this.bag = new THREE.Group(); S.add(this.bag);
    gbAdd(this.bag, gbRoundBox(0.26, 0.3, 0.12, 0.03, 2), bagM, 0, -0.17, 0);
    for (const sx of [-1, 1]) gbAdd(this.bag, new THREE.TorusGeometry(0.06, 0.006, 6, 16, Math.PI), gbMat('#7a5636', { rough: 0.8 }), sx * 0.045, -0.02, 0, { rz: 0 });
    gbAdd(this.bag, new THREE.SphereGeometry(0.07, 10, 8), gbMat('#d9c45a', { rough: 0.6 }), 0.05, -0.02, 0.0);
    gbAdd(this.bag, gbCapsule(0.035, 0.16, 4, 8), gbMat('#c8874a', { rough: 0.7 }), -0.06, 0.02, 0, { rz: 0.3 });
    // the engineer's tablet and torch
    this.tablet = new THREE.Group(); S.add(this.tablet);
    gbAdd(this.tablet, gbRoundBox(0.2, 0.012, 0.27, 0.01, 2), gbMat('#26242c', { rough: 0.4 }), 0, 0, 0);
    gbAdd(this.tablet, new THREE.PlaneGeometry(0.18, 0.25), new THREE.MeshStandardMaterial({ color: '#1c2430', emissive: '#9fd0ff', emissiveIntensity: 0.6, roughness: 0.2 }), 0, 0.007, 0, { rx: -Math.PI / 2, cast: false });
    this.torch = new THREE.Group(); S.add(this.torch);
    gbAdd(this.torch, new THREE.CylinderGeometry(0.018, 0.015, 0.16, 10), gbMat('#2a2a30', { rough: 0.4, metal: 0.5 }), 0, 0, 0);
    gbAdd(this.torch, new THREE.CircleGeometry(0.017, 12), new THREE.MeshStandardMaterial({ color: '#fff4dd', emissive: '#fff0d0', emissiveIntensity: 3 }), 0, 0.081, 0, { rx: -Math.PI / 2, cast: false });
  }

  _helmet() {
    const E = this.engineer, hc = E.face.hc, [a, bb] = E.headR;
    const hm = gbMat('#f2f0e8', { rough: 0.35, rim: 0.3, env: 0.8, name: 'gbHelmet' });
    gbAdd(hc, new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hm, 0, 0.03, -0.006, { s: [a * 1.18, bb * 1.02, bb * 1.12] });
    gbAdd(hc, new THREE.CylinderGeometry(a * 1.32, a * 1.32, 0.01, 28), hm, 0, 0.032, 0.004, { s: [1, 1, 1.12] });
    // reflective stripes on the vest
    const st = gbMat('#e8e4da', { rough: 0.25, env: 1.4 });
    gbAdd(E.J.sp, gbRoundBox(0.29, 0.03, 0.22, 0.01, 2), st, 0, 0.04, 0.0);
    gbAdd(E.J.ch, gbRoundBox(0.33, 0.03, 0.22, 0.01, 2), st, 0, 0.06, 0.0);
  }

  _bike() {
    const iron = gbMat('#1c1a1e', { rough: 0.5, metal: 0.5 }), bikeM = gbMat('#2f5f63', { rough: 0.45, metal: 0.4, rim: 0.3, name: 'gbBike' }), tyre = gbMat('#1a1618', { rough: 0.8 });
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const wheels = [];
    for (const x of [-0.52, 0.52]) {
      const w = new THREE.Group(); w.position.set(x, 0.34, 0); body.add(w);
      gbAdd(w, new THREE.TorusGeometry(0.33, 0.025, 8, 28), tyre, 0, 0, 0);
      gbAdd(w, new THREE.TorusGeometry(0.3, 0.006, 4, 24), iron, 0, 0, 0);
      for (let k = 0; k < 8; k++) gbAdd(w, new THREE.CylinderGeometry(0.002, 0.002, 0.6, 3), iron, 0, 0, 0, { rz: k * Math.PI / 8, cast: false });
      wheels.push(w);
    }
    gbAdd(body, gbTube([[-0.52, 0.34, 0], [-0.05, 0.36, 0], [0.38, 0.72, 0], [-0.2, 0.72, 0], [-0.05, 0.36, 0]], 0.022, 20, 6), bikeM, 0, 0, 0);
    gbAdd(body, gbTube([[0.52, 0.34, 0], [0.38, 0.72, 0], [0.42, 0.95, 0]], 0.02, 10, 6), bikeM, 0, 0, 0);
    gbAdd(body, gbTube([[-0.2, 0.72, 0], [-0.24, 0.8, 0]], 0.016, 4, 6), bikeM, 0, 0, 0);
    gbAdd(body, gbTube([[0.42, 0.96, -0.26], [0.4, 0.97, 0], [0.42, 0.96, 0.26]], 0.014, 10, 6), iron, 0, 0, 0);
    gbAdd(body, gbRoundBox(0.24, 0.05, 0.1, 0.02, 2), gbMat('#3a2620', { rough: 0.7 }), -0.24, 0.82, 0);
    // a front basket with a few groceries (it is heavy)
    gbAdd(body, gbRoundBox(0.3, 0.2, 0.32, 0.02, 2), gbMat('#8a6a42', { rough: 0.9 }), 0.64, 0.86, 0);
    gbAdd(body, new THREE.SphereGeometry(0.06, 10, 8), gbMat('#d9c45a', { rough: 0.6 }), 0.6, 0.98, 0.05);
    gbAdd(body, gbCapsule(0.035, 0.18, 4, 8), gbMat('#c8874a', { rough: 0.7 }), 0.68, 1.0, -0.06, { rz: 0.5 });
    gbAdd(body, gbTube([[-0.05, 0.36, 0.06], [0.0, 0.34, 0.12]], 0.008, 4, 4), iron, 0, 0, 0);
    return { g, body, wheels, bar: new THREE.Vector3(0.42, 0.97, 0), saddle: new THREE.Vector3(-0.24, 0.85, 0) };
  }

  _pigeons() {
    const S = this.app.scene, body = gbMat('#7f8296', { rough: 0.8, rim: 0.6, name: 'gbPigeon' }), dark = gbMat('#4b4d5e', { rough: 0.8, rim: 0.5 }), beak = gbMat('#d9a05a', { rough: 0.6 });
    const wingG = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.2, -0.03); s.lineTo(0.27, -0.09); s.lineTo(0.1, -0.11); s.lineTo(0, -0.08); return new THREE.ShapeGeometry(s); })();
    this.pigeons = [];
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group(); S.add(g);
      gbAdd(g, new THREE.SphereGeometry(1, 12, 8), body, 0, 0, 0, { s: [0.075, 0.075, 0.13] });
      gbAdd(g, new THREE.SphereGeometry(1, 10, 8), dark, 0, 0.07, 0.1, { s: [0.045, 0.045, 0.05] });
      gbAdd(g, new THREE.ConeGeometry(0.012, 0.03, 6), beak, 0, 0.065, 0.155, { rx: Math.PI / 2 });
      gbAdd(g, new THREE.ConeGeometry(0.05, 0.12, 6), dark, 0, 0.01, -0.15, { rx: -Math.PI / 2, s: [1, 1, 0.4] });
      const wl = new THREE.Group(), wr = new THREE.Group(); g.add(wl, wr);
      gbAdd(wl, wingG, dark, 0, 0, 0, { rx: Math.PI / 2 }).material = gbMat('#5e6174', { rough: 0.8, rim: 0.5, side: THREE.DoubleSide });
      gbAdd(wr, wingG, dark, 0, 0, 0, { rx: Math.PI / 2, s: [-1, 1, 1] }).material = gbMat('#5e6174', { rough: 0.8, rim: 0.5, side: THREE.DoubleSide });
      wl.position.set(0.04, 0.03, 0.03); wr.position.set(-0.04, 0.03, 0.03);
      this.pigeons.push({ g, wl, wr, i });
    }
  }

  // ------------------------------------------------------------------------------------------ foothold plans (built once)
  _plans() {
    const S = GB_SET.stairs, cafe = this.cafe, z = 2.95, flat = () => 0;
    // the hero: the last heavy steps to the foot of the stairs, then one step up; the second attempt is posed in update
    const xa = 3.35, xb = S.x0 + 0.42;
    this.heroX = (t) => {
      let x = xa + (xb - xa) * Ease.inOutSine(MathX.ramp(t, GB.walk[0], GB.walk[1]));
      x += (S.x0 - S.run * 0.5 + 0.06 - xb) * Ease.inOutSine(MathX.ramp(t, GB.step1[0] + 0.15, GB.step1[1]));
      x -= 0.07 * MathX.window(t, GB.step2[0], GB.back[1], 0.5, 0.5);
      return x;
    };
    const walk = gbWalkPlan((u) => new THREE.Vector3(xa + (xb - xa) * u, 0, z), flat, GB.walk[0], GB.walk[1], 0.42, { first: 'R', lat: 0.1, ease: Ease.inOutSine });
    // the walk ends with both feet at the stair foot; they lift for the climb
    const lastR = walk.filter((h) => h.side === 'R').pop(), lastL = walk.filter((h) => h.side === 'L').pop();
    lastR.t1 = GB.step1[0]; lastL.t1 = GB.step1[0] + 0.85;
    const t1 = cafe.stairP(1, 0.5, 0.5);
    walk.push({ side: 'R', t0: GB.step1[0] + 0.7, t1: 1e9, p: new THREE.Vector3(t1.x, t1.y, z - 0.1) });
    walk.push({ side: 'L', t0: GB.step1[1] - 0.15, t1: 1e9, p: new THREE.Vector3(t1.x + 0.03, t1.y, z + 0.1) });
    this.heroPlan = walk;
    // the climber: step-together, one riser at a time, slower and slower; she stops on step 5 with a hand to her chest
    const c0 = GB.heart - 1.6, cp = [];
    const sp = (n, side) => { const p = cafe.stairP(n, 0.5, 0.5); p.z = z + (side === 'R' ? -0.1 : 0.1); return p; };
    cp.push({ side: 'R', t0: -1e3, t1: c0, p: sp(2, 'R') }, { side: 'L', t0: -1e3, t1: c0 + 0.75, p: sp(2, 'L') });
    const times = [c0, c0 + 1.9, c0 + 4.1, GB.chest + 2.6];   // lead foot lifts for steps 3, 4, 5, 6
    for (let i = 0; i < 4; i++) {
      const n = 3 + i, ta = times[i], tn = times[i + 1] ?? 1e9;
      cp.push({ side: 'R', t0: ta + 0.8, t1: tn, p: sp(n, 'R') });
      cp.push({ side: 'L', t0: ta + 1.45, t1: tn + 0.75, p: sp(n, 'L') });
    }
    this.climbPlan = cp;
    this.climbX = (t) => { const f = gbFeetAt(cp, t); return (f.L.p.x + f.R.p.x) / 2 - 0.05; };
    // the cyclist up the ramp (scene 9): short, heavy steps; she stops once halfway to get her breath
    const R = GB_SET.ramp, rz0 = R.z0 - 0.4, rz1 = R.z1 + 1.0, rx = 10.62;
    const pace = (k) => { const a = 0.5, h = 0.18; if (k < a - h / 2) return Ease.inOutSine(k / (a - h / 2)) * 0.5; if (k < a + h / 2) return 0.5; return 0.5 + 0.5 * Ease.inOutSine((k - a - h / 2) / (1 - a - h / 2)); };
    this.rampPace = pace; this.rampZ = (t) => rz0 + (rz1 - rz0) * pace(MathX.ramp(t, GB.ramp[0], GB.ramp[1]));
    this.rampPlan = gbWalkPlan((u) => new THREE.Vector3(rx, 0, rz0 + (rz1 - rz0) * u), (x, zz) => cafe.rampY(x, zz), GB.ramp[0], GB.ramp[1], 0.36, { first: 'L', lat: 0.1, ease: pace });
    this.rampX = rx;
  }

  // ------------------------------------------------------------------------------------------ the hero's cup
  cupState(t, restP) {
    const out = { p: new THREE.Vector3().copy(restP), tilt: 0, held: 0, slosh: 0, clasp: 0, h: 0 };
    const tr = (amp, k = 1) => amp * (0.55 * Math.sin(t * 57 * k) + 0.45 * Math.sin(t * 83 * k + 1));
    out.held = 1 - Ease.inOutSine(MathX.ramp(t, GB.letGo, GB.letGo + 0.55));
    out.clasp = (0.75 - 0.25 * MathX.window(t, GB.cupDown1 + 0.2, GB.grip, 0.3, 0.25) + 0.12 * MathX.smooth(t, GB.grip, GB.grip + 0.25)) * (1 - MathX.smooth(t, GB.letGo - 0.05, GB.letGo + 0.15));
    let h = 0, trem = 0;
    if (t < GB.g) h = GB_CUP_UP + 0.008 * Math.sin(t * 1.1);
    else if (t < GB.cupDown1) {
      // the arm sinks under the doubled weight and catches ~10 cm lower (a damped overshoot), then he lets it down
      const u = t - GB.g, sinkTo = GB_CUP_UP - 0.1;
      h = GB_CUP_UP - 0.1 * Ease.outQuad(MathX.clamp(u / 0.32, 0, 1)) - gbSpring(t, GB.g + 0.3, 0.025, 3.2, 6);
      const k = MathX.ramp(t, GB.cupDown1 - 0.5, GB.cupDown1);
      h = h * (1 - k) + 0 * k - (k > 0 ? 0 : 0);
      h = Math.max(0, h * (1 - Ease.inQuad(k)) + 0 * sinkTo);
      trem = 0.0045 * MathX.window(t, GB.g + 0.25, GB.cupDown1 - 0.1, 0.2, 0.1);
    } else {
      const H = GB_CUP_LIFT;
      if (t >= GB.lift + 0.35 && t < GB.top) h = H * Ease.outSine(MathX.ramp(t, GB.lift + 0.35, GB.top));
      else if (t >= GB.top && t < GB.lower) h = H - 0.004 * Math.sin(Math.PI * MathX.ramp(t, GB.top, GB.lower));
      else if (t >= GB.lower && t < GB.down) h = H * (1 - Ease.inOutSine(MathX.ramp(t, GB.lower, GB.down)));
      const grow = MathX.ramp(t, GB.lift, GB.top) * 0.6 + 0.4 * MathX.ramp(t, GB.top, GB.lower);
      trem = h > 0.001 ? (0.0018 + 0.0042 * grow) * Math.max(0.35, 1 - MathX.smooth(t, GB.down - 0.35, GB.down)) : 0;
      if (t >= GB.lift && t < GB.lift + 0.35) out.p.y += 0.0009 * Math.max(0, Math.sin(t * 90));
      out.tilt = h > 0.001 ? 0.04 * Math.sin(t * 7) * grow : 0;
      out.slosh = (h > 0.001 ? 0.45 * Math.sin(t * 9) * grow : 0) + (t > GB.down ? 0.6 * Math.exp(-(t - GB.down) * 3) * Math.sin((t - GB.down) * 15) : 0);
      if (t >= GB.down) out.p.y += Math.abs(Math.sin((t - GB.down) * 40)) * 0.0015 * Math.exp(-(t - GB.down) * 16);
    }
    // the clack of the first set-down (scene 1): a tiny bounce, coffee jumps
    if (t >= GB.cupDown1 && t < GB.lift) { out.p.y += Math.abs(Math.sin((t - GB.cupDown1) * 38)) * 0.003 * Math.exp(-(t - GB.cupDown1) * 12); out.slosh += 0.9 * Math.exp(-(t - GB.cupDown1) * 3) * Math.sin((t - GB.cupDown1) * 16); }
    if (t < GB.cupDown1 && t >= GB.g) out.slosh += 0.8 * Math.exp(-(t - GB.g) * 2.5) * Math.sin((t - GB.g) * 14);
    out.p.y += h + tr(trem); out.p.x += h > 0.001 ? tr(trem * 0.7, 1.13) : 0;
    out.h = h;
    // held up before the change, the cup sits a little closer to him (toward −X) and higher
    const up = MathX.clamp(h / GB_CUP_UP, 0, 1) * (t < GB.cupDown1 ? 1 : 0);
    out.p.x -= 0.1 * up; out.p.z -= 0.02 * up;
    return out;
  }

  // the hero seated → standing at his table (scenes 1–6); returns the cup state
  _heroTable(t) {
    const H = this.hero, [cx, cz] = GB_SET.heroChair, chair = this.cafe.heroChair;
    const st0 = GB.stand[0], slide = 0.22 * Ease.inOutSine(MathX.ramp(t, st0 - 0.55, st0 + 0.25));
    chair.g.position.x = cx - slide;
    const sink = chair.seat.position.y - 0.46;
    H.place(cx - slide, sink, cz, Math.PI / 2);
    const keys = [
      [0, 'sitCup', 0.01],
      [GB.g, 'sitSettle', 0.35, 'outQuad'],
      [GB.s2 + 0.1, 'sitBrace', 0.6],
      [GB.lift - 0.28, 'sitBraceDip', 0.24],
      [GB.lift + 0.12, 'sitLift1', 0.7, 'outQuad'],
      [GB.top - 0.3, 'sitHold', 0.5],
      [GB.lower, 'sitLower', 0.9, 'inOutSine'],
      [GB.down + 0.15, 'sitHeavy', 0.45],
      [GB.letGo + 0.25, 'sitRelief', 0.8],
      [GB.s3 + 1.0, 'sitHeavy', 1.4],
      [GB.you - 0.2, 'sitStare2', 0.8],
      [st0 - 0.9, 'benchSit', 0.7],
      [st0 - 0.15, 'benchLean', 0.55],
      [st0 + 0.45, 'benchPush', 0.8, 'inOutCubic'],
      [st0 + 1.45, 'benchHalf', 1.0, 'inOutSine'],
      [st0 + 2.6, 'heroUp', 1.1, 'inOutSine'],
    ];
    const P = gbEvalTrack(keys, GB_POSES, t);
    // planted feet once he starts to get up (the bench poses have legs built for a 0.46 m seat, like the chair)
    const wPlant = MathX.smooth(t, st0 - 0.9, st0 - 0.3);
    if (wPlant > 0) { const Q = gbPlant(Object.assign({}, P), 0.42); P.rootY = P.rootY * (1 - wPlant) + Q.rootY * wPlant; P.rootZ = (P.rootZ || 0) * (1 - wPlant) + Q.rootZ * wPlant; }
    const after = MathX.smooth(t, GB.g, GB.g + 0.6);
    const br = Math.sin(t * Math.PI * 2 * (0.24 + 0.08 * after + 0.1 * MathX.smooth(t, GB.stand[1] - 0.5, GB.stand[1] + 0.5))) * (1.0 + 0.9 * after);
    P.chX = (P.chX || 0) - br * 0.8; P.hdX = (P.hdX || 0) + br * 0.4; P.LShrug = (P.LShrug || 0) + br * 0.002; P.RShrug = (P.RShrug || 0) + br * 0.002;
    // the doubling: a sink into the chair, the head nods with it (springs, not a collapse)
    P.spX += gbSpring(t, GB.g + 0.02, 3.5, 2.4, 4.5); P.hdX += gbSpring(t, GB.g + 0.06, 4.5, 2.2, 3.6);
    P.rootY += -gbSpring(t, GB.g, 0.008, 4, 5);
    const eff = MathX.window(t, GB.lift, GB.down, 0.3, 0.3) + 0.7 * MathX.window(t, GB.g + 0.1, GB.cupDown1, 0.1, 0.2);
    for (const k of ['RShX', 'RElX', 'LShX', 'spX', 'hdZ']) P[k] = (P[k] || 0) + eff * (1.0 * Math.sin(t * 53 + k.length) + 0.7 * Math.sin(t * 71 + k.length * 2));
    P.RShrug += 0.016 * eff; P.LShrug += 0.01 * eff;
    // standing up: the legs tremble while the knees extend; once up, small wobbles
    const legs = MathX.window(t, st0 + 0.3, GB.stand[1] + 1.2, 0.3, 0.6);
    for (const k of ['LKnX', 'RKnX', 'LHipX', 'RHipX']) P[k] = (P[k] || 0) + legs * 2.2 * Math.sin(t * 43 + k.length * 3);
    P.spX += legs * 1.2 * Math.sin(t * 31);
    H.applyPose(P);
    // ---- the cup and the hands
    const v = this.tmp, [tx, tz] = GB_SET.heroTable, rest = v[0].set(tx - 0.22, GB_SET.tableH + 0.008, tz + 0.12);
    const C = this.cupState(t, rest);
    this.cup.position.copy(C.p);
    this.cup.rotation.set(0, -0.3, 0);
    this.cup.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), C.tilt);
    this.cup.userData.surf.rotation.set(-Math.PI / 2 + C.slosh * 0.2, 0, C.slosh * 0.1);
    this.cup.updateMatrixWorld(true);
    const cq = this.cup.getWorldQuaternion(new THREE.Quaternion());
    const gripW = v[3].copy(GB_GRIP_WRIST).applyMatrix4(this.cup.matrixWorld);
    const Fg = new THREE.Vector3(1, 0, 0).applyQuaternion(cq), Ng = new THREE.Vector3(0, 0, -1).applyQuaternion(cq);
    const hdir = new THREE.Vector3(0, 0, 1).applyQuaternion(cq);
    const restR = new THREE.Vector3(tx - 0.3, GB_SET.tableH + 0.05, tz + 0.2);
    const w = C.held;
    const pre = gripW.clone().addScaledVector(hdir, 0.05).add(new THREE.Vector3(0, 0.035, 0));
    let wristT;
    if (w > 0.999) wristT = gripW.clone();
    else { const k = w; wristT = restR.clone().lerp(pre, Ease.inOutSine(k)).lerp(gripW, Math.max(0, (k - 0.7) / 0.3)); }
    // the table edge where his hands push when he stands (both), and the left hand's rest / brace
    const edgeX = tx - 0.36 + 0.02;
    const Lrest = new THREE.Vector3(tx - 0.2, GB_SET.tableH + 0.045, tz - 0.18);
    const wB = MathX.smooth(t, GB.brace - 0.3, GB.brace + 0.2) * (1 - MathX.smooth(t, GB.letGo + 0.2, GB.letGo + 0.8));
    const FB = new THREE.Vector3(1, 0, -0.25).normalize(), NB = new THREE.Vector3(0, -1, 0);
    const press = 0.004 * eff;
    const Lb = new THREE.Vector3(tx - 0.22, GB_SET.tableH + 0.03 - press, tz - 0.05).addScaledVector(FB, -0.05);
    let Lw = Lrest.clone().lerp(Lb, wB);
    // standing: both palms on the table edge (they take his weight while he rises)
    const wT = MathX.smooth(t, st0 - 0.5, st0 - 0.05);
    const edgeL = new THREE.Vector3(edgeX + 0.04, GB_SET.tableH + 0.035, tz - 0.2), edgeR = new THREE.Vector3(edgeX + 0.04, GB_SET.tableH + 0.035, tz + 0.2);
    if (wT > 0) { Lw = Lw.lerp(edgeL, wT); wristT = wristT.lerp(edgeR, wT); }
    H.solveArm('R', wristT, new THREE.Vector3(-0.35, -1, 0.45).normalize(), 1);
    H.solveArm('L', Lw, new THREE.Vector3(0.2, -1, -0.8 + 0.6 * wB).normalize(), 0.85 + 0.15 * Math.max(wB, wT));
    const open = MathX.smooth(w, 0.05, 0.4), clasp = C.clasp;
    const curl = MathX.lerp(MathX.lerp(0.35, 0.04, open), 0.66, clasp) * (1 - wT) + 0.12 * wT, thumb = MathX.lerp(MathX.lerp(0.3, 0.05, open), 0.62, clasp) * (1 - wT) + 0.2 * wT;
    const curl2 = curl + 0.05 * eff;
    H.handR.fingers.forEach(([f1, f2], i) => { const k = curl2 * (1 + i * 0.06); f1.rotation.z = -H.handR.pn * k * 1.45; f2.rotation.z = -H.handR.pn * k * 1.5; });
    H.handR.t1.rotation.set(0.2, 0, -H.handR.pn * (0.35 + thumb * 0.6)); H.handR.t2.rotation.z = -H.handR.pn * thumb * 0.9;
    H.J.RWr.rotation.set(0.15, 0, 0.2);
    H.orientHand('R', Fg, Ng, MathX.smooth(w, 0.25, 0.9) * (1 - wT));
    H.J.LWr.rotation.set(0.25, -0.2, -0.15);
    if (wB > 0.001) H.orientHand('L', FB, NB, wB * (1 - wT));
    if (wT > 0.001) { H.orientHand('L', new THREE.Vector3(1, 0, 0), NB, wT); H.orientHand('R', new THREE.Vector3(1, 0, 0), NB, wT); }
    H.handL.fingers.forEach(([f1, f2], i) => { const k = (0.35 - 0.3 * Math.max(wB, wT)) * (1 + i * 0.06); f1.rotation.z = -H.handL.pn * k * 1.45; f2.rotation.z = -H.handL.pn * k * 1.5; });
    // face + eyes
    const F = gbEvalTrack([
      [0, 'content', 0.01], [GB.g + 0.03, 'surprise', 0.12, 'outQuad'], [GB.g + 0.7, 'strain', 0.3], [GB.cupDown1, 'shock', 0.2],
      [GB.s2, 'brace', 0.4], [GB.lift, 'strain', 0.3], [GB.lift + 0.6, 'strainHard', 0.6], [GB.top + 0.4, 'strain', 0.5],
      [GB.lower + 0.5, 'brace', 0.5], [GB.down, 'exhausted', 0.25], [GB.letGo + 0.3, 'relief', 0.5], [GB.s3, 'worried', 0.8],
      [GB.pull, 'worried', 0.5], [GB.s6, 'worried', 0.5], [GB.you, 'shock', 0.3], [GB.you + 0.8, 'worried', 0.5],
      [st0, 'brace', 0.3], [st0 + 0.6, 'strainHard', 0.4], [GB.stand[1] - 0.4, 'strain', 0.5], [GB.upCut + 0.8, 'exhausted', 0.6]], GB_FACES, t);
    const blinks = [1.6, 4.9, 8.3, GB.g + 0.55, GB.s2 + 0.3, GB.down + 0.15, GB.letGo + 0.7, GB.s3 + 1.5, GB.pull - 0.4, GB.s6 + 0.6, GB.stand[1] + 0.2];
    F.blink = blinks.reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
    F.glassesDrop = -0.004 * gbSettle(t, GB.g + 0.03, 0.35, 0.4, 3);
    let look;
    if (t < GB.g) look = { x: 0.45, y: -0.15 };                 // out of the window
    else if (t < GB.s3 + 1) look = H.lookAt(this.cup.position);
    else if (t < GB.you) look = H.lookAt(this.cup.position);
    else look = { x: 0, y: -0.55 + 0.4 * MathX.smooth(t, st0 + 1.5, st0 + 2.5) };
    H.applyFace(F, look);
    return C;
  }

  // the hero at the stairs (scene 7)
  _heroStairs(t) {
    const H = this.hero, S = GB_SET.stairs, z = 2.95;
    const x = this.heroX(t);
    H.place(x, 0, z, -Math.PI / 2);
    const P = gbEvalTrack([[0, 'walkHeavy', 0.01], [GB.rail - 0.3, 'climbHeavy', 0.6], [GB.step1[1] + 0.2, 'climbRest', 0.8], [GB.step2[0] - 0.3, 'climbHeavy', 0.5], [GB.back[1] + 0.1, 'climbRest', 0.9]], GB_POSES, t);
    const feet = gbFeetAt(this.heroPlan, t, 0.06);
    // the second step: the right foot lifts toward step 2, hovers, and comes back down to step 1
    const k2 = MathX.window(t, GB.step2[0], GB.back[1], 0.55, 0.7);
    if (k2 > 0) { const s2 = this.cafe.stairP(2, 0.5, 0.2); const lift = new THREE.Vector3(s2.x + 0.08, s2.y + 0.07, z - 0.1); feet.R.p.lerp(lift, k2); feet.R.swing = k2; }
    // walking: arms swing a little, the torso rocks with the steps
    const walking = MathX.window(t, GB.walk[0], GB.walk[1], 0.3, 0.3), ph = (t - GB.walk[0]) * Math.PI / 0.62;
    P.LShX += 10 * walking * Math.sin(ph); P.RShX -= 10 * walking * Math.sin(ph) * (1 - MathX.smooth(t, GB.rail - 0.6, GB.rail));
    P.pelZ = (P.pelZ || 0) + 3 * walking * Math.sin(ph); P.chY = (P.chY || 0) + 4 * walking * Math.sin(ph);
    const br = Math.sin(t * Math.PI * 2 * 0.55) * (1.6 + 1.6 * MathX.smooth(t, GB.step1[1], GB.step1[1] + 1));
    P.chX -= br; P.hdX += br * 0.5; P.LShrug = (P.LShrug || 0) + br * 0.003; P.RShrug = (P.RShrug || 0) + br * 0.003;
    gbStandOn(H, P, feet, { bend: 0.05 });
    // knees tremble on the step
    const tr = MathX.window(t, GB.step1[0], GB.handCU + 3, 0.4, 0.5);
    for (const k of ['LKnX', 'RKnX']) P[k] += tr * 1.6 * Math.sin(t * 47 + k.length);
    H.applyPose(P);
    // right hand on the rail from GB.rail (a fixed grip point), left hand on the left thigh while he climbs
    const railX = S.x0 - 0.06, grip = new THREE.Vector3(railX, this.cafe.railY(railX) + 0.045, S.z0 + 0.04);
    this.railGrip = grip;
    const wr = MathX.smooth(t, GB.rail - 0.45, GB.rail);
    H.solveArm('R', grip, new THREE.Vector3(0.3, -1, -0.6).normalize(), wr);
    H.orientHand('R', new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0.2).normalize(), wr);
    const sq = wr * (0.62 + 0.08 * MathX.window(t, GB.step2[0], GB.back[1] + 2, 0.3, 0.5) + 0.02 * Math.sin(t * 37));
    H.handR.fingers.forEach(([f1, f2], i) => { const k = (0.2 + sq) * (1 + i * 0.05); f1.rotation.z = -H.handR.pn * k * 1.3; f2.rotation.z = -H.handR.pn * k * 1.4; });
    H.handR.t1.rotation.set(0.2, 0, -H.handR.pn * 0.8); H.handR.t2.rotation.z = -H.handR.pn * 0.6;
    const thigh = H.worldOf('LKn', new THREE.Vector3()).add(new THREE.Vector3(0.12, 0.1, 0));
    H.solveArm('L', thigh, new THREE.Vector3(0, -0.3, 1).normalize(), 0.75 * MathX.smooth(t, GB.step1[0] - 0.2, GB.step1[0] + 0.3));
    const F = gbEvalTrack([[0, 'exhausted', 0.01], [GB.step1[0], 'strainHard', 0.4], [GB.step1[1], 'exhausted', 0.4], [GB.step2[0], 'strain', 0.3], [GB.back[0], 'worried', 0.4], [GB.back[1] + 0.5, 'exhausted', 0.6]], GB_FACES, t);
    F.blink = [GB.s7 + 0.8, GB.step1[1] + 0.2, GB.back[1] + 0.6, GB.handCU + 1.4].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
    H.applyFace(F, { x: 0, y: t < GB.back[1] ? -0.5 : 0.35 });
  }

  // the hero outside (scenes 9–12): at the edge of the square, then by the fountain
  _heroOutside(t) {
    const H = this.hero;
    let P, x, z, yaw, look;
    if (t < GB.s10) {      // scene 9: at the edge of the square, one hand on a bollard, watching
      x = 1.05; z = -6.1; yaw = Math.PI * 0.93;
      H.place(x, 0, z, yaw);
      P = gbEvalTrack([[0, 'standTired', 0.01], [GB.s9c + 1.2, 'standLook', 1.4]], GB_POSES, t);
      gbPlant(P, 0);
      H.applyPose(P);
      H.solveArm('L', new THREE.Vector3(1.0 + 0.03, 0.86, -6.5), new THREE.Vector3(1, -1, 0).normalize(), 0.9);
      look = { x: 0.3 * Math.sin(t * 0.3), y: 0.1 };
    } else {               // scenes 10–12: near the fountain, facing the sun and the skyline
      x = -3.9; z = -10.2; yaw = Math.PI * 0.97;
      H.place(x, 0, z, yaw);
      P = gbEvalTrack([[0, 'standTired', 0.01], [GB.sky, 'standLook', 1.6], [GB.back10 + 1.5, 'standTired', 1.5], [GB.s11 + 2, 'standLook', 2.0], [GB.s12, 'standTired', 2.0]], GB_POSES, t);
      gbPlant(P, 0);
      H.applyPose(P);
      look = { x: 0, y: 0.25 };
    }
    const br = Math.sin(t * Math.PI * 2 * 0.4) * 1.6;
    H.J.ch.rotation.x -= br * Math.PI / 180;
    const F = gbEvalTrack([[0, 'exhausted', 0.01], [GB.s9c + 1, 'worried', 0.8], [GB.sky, 'awe', 1.0], [GB.back10, 'worried', 0.8], [GB.s11 + 1, 'exhausted', 1], [GB.s12, 'awe', 1.2]], GB_FACES, t);
    F.blink = [GB.s9c + 2.1, GB.s10 + 1.0, GB.back10 + 1.3, GB.s11 + 3.0, GB.s12 + 1.8].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
    H.applyFace(F, look);
  }

  // ------------------------------------------------------------------------------------------ the café's other people
  _insidePeople(t) {
    // the waiter behind the counter
    const W = this.waiter;
    W.place(4.62, 0, 0.35, -Math.PI / 2);
    const WP = gbEvalTrack([[0, 'counterLean', 0.01], [GB.g + 0.05, 'counterSag', 0.45, 'outQuad']], GB_POSES, t);
    WP.spX += gbSpring(t, GB.g + 0.08, 4, 2.2, 4); WP.chX = (WP.chX || 0) + Math.sin(t * 1.4) * 1.2;
    W.applyPose(WP);
    W.applyFace(gbEvalTrack([[0, 'content', 0.01], [GB.g + 0.1, 'surprise', 0.12], [GB.g + 0.8, 'worried', 0.5]], GB_FACES, t), { x: 0.2, y: -0.2 });
    // the regulars: chatting (nods, a gesture), then the change: they sag and look around
    const A = this.patA, B = this.patB;
    A.place(1.3, -0.006, -2.6, Math.PI / 2); B.place(2.6, -0.006, -2.6, -Math.PI / 2);
    for (const [C, base, ph] of [[A, 'chatA', 0], [B, 'chatB', 1.7]]) {
      const P = gbEvalTrack([[0, base, 0.01], [GB.g + 0.05, 'sitHeavy', 0.4, 'outQuad'], [GB.g + 2.5, 'sitLookUp', 1.2], [GB.g + 5, 'sitHeavy', 1.5]], GB_POSES, t);
      const chat = 1 - MathX.smooth(t, GB.g, GB.g + 0.3);
      P.hdX += chat * 4 * Math.sin(t * 2.3 + ph); P.hdY += chat * 6 * Math.sin(t * 0.9 + ph);
      P.RShX += chat * 10 * Math.max(0, Math.sin(t * 1.6 + ph * 2)); P.RElX += chat * 12 * Math.sin(t * 2.1 + ph);
      P.spX += gbSpring(t, GB.g + 0.03, 3, 2.3, 4);
      C.applyPose(P);
      const talk = chat * Math.max(0, Math.sin(t * 7 + ph * 3)) * (Math.sin(t * 0.8 + ph) > 0 ? 1 : 0.2);
      const F = gbEvalTrack([[0, 'content', 0.01], [GB.g + 0.08, 'surprise', 0.12], [GB.g + 0.9, 'worried', 0.6]], GB_FACES, t);
      F.open = (F.open || 0) + 0.35 * talk;
      F.blink = [2.2 + ph, 6.1 + ph, GB.g + 0.7].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
      C.applyFace(F, { x: C === A ? 0.6 : -0.6, y: -0.1 });
    }
    // the climber: up the stairs (scene 6), then sitting on step 9 to rest (scene 7)
    const Cl = this.climber, S = GB_SET.stairs;
    if (t < GB.s7 - 0.5) {
      const x = this.climbX(t);
      Cl.place(x, 0, 2.95, -Math.PI / 2);
      const P = gbEvalTrack([[0, 'climbHeavy', 0.01], [GB.chest - 0.3, 'climbRest', 0.7], [GB.chest + 2.2, 'climbHeavy', 0.6]], GB_POSES, t);
      const br = Math.sin(t * Math.PI * 2 * 0.6) * 2.2;
      P.chX -= br; P.hdX += br * 0.5;
      gbStandOn(Cl, P, gbFeetAt(this.climbPlan, t, 0.06), { bend: 0.06 });
      Cl.applyPose(P);
      const rx = x - 0.12, grip = new THREE.Vector3(rx, this.cafe.railY(rx) + 0.045, S.z0 + 0.04);
      Cl.solveArm('R', grip, new THREE.Vector3(0.3, -1, -0.6).normalize(), 1);
      Cl.orientHand('R', new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0.2).normalize(), 1);
      Cl.handR.fingers.forEach(([f1, f2], i) => { const k = 0.78 * (1 + i * 0.05); f1.rotation.z = -Cl.handR.pn * k * 1.3; f2.rotation.z = -Cl.handR.pn * k * 1.4; });
      // a hand to her chest while she gets her breath (the heart line)
      const hc = MathX.window(t, GB.chest - 0.2, GB.chest + 2.4, 0.5, 0.6);
      if (hc > 0) { Cl.root.updateMatrixWorld(true); const c = Cl.J.ch.localToWorld(new THREE.Vector3(0.05, 0.12, 0.13)); Cl.solveArm('L', c, new THREE.Vector3(1, -1, 0).normalize(), hc); }
      const F = gbEvalTrack([[0, 'strain', 0.01], [GB.chest - 0.3, 'exhausted', 0.5], [GB.chest + 2.2, 'strain', 0.6]], GB_FACES, t);
      F.blink = [GB.heart + 0.4, GB.chest + 0.9].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
      Cl.applyFace(F, { x: 0, y: 0.5 });
    } else {
      const seat = this.cafe.stairP(9, 0.5, 0.65);
      Cl.place(seat.x, seat.y, 2.95, Math.PI / 2);
      const P = Object.assign({}, GB_POSES.stairSit);
      P.rootY = 0.06 - 0.86; P.rootZ = -0.02;
      const br = Math.sin(t * Math.PI * 2 * 0.5) * 2.4; P.chX -= br; P.hdX += br * 0.6;
      const f7 = this.cafe.stairP(7, 0.5, 0.45);
      Cl.root.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(Cl.root.matrixWorld).invert();
      const fl = f7.clone().setZ(3.05).applyMatrix4(inv), fr = f7.clone().setZ(2.85).applyMatrix4(inv);
      gbLegIK(P, 'L', fl.y, fl.z); gbLegIK(P, 'R', fr.y, fr.z);
      Cl.applyPose(P);
      Cl.applyFace(GB_FACES.exhausted, { x: 0, y: -0.3 });
    }
  }

  // ------------------------------------------------------------------------------------------ outside
  _outsidePeople(t) {
    const v = this.tmp, after = MathX.smooth(t, GB.g, GB.g + 0.3);
    // ---- the car: parked; it sank at the doubling and stays low
    this.carState = this.car.update(t, { pushSteps: [], refAlpha: this.carRef || 0 });
    // ---- the bench man: slumped on the bench, breathing hard
    const M = this.benchMan, [bx, bz, by] = GB_SET.bench;
    M.place(bx, 0.0, bz, by);
    const MP = gbEvalTrack([[0, 'benchSit', 0.01], [GB.g + 0.1, 'benchSlump', 0.6]], GB_POSES, t);
    const mb = Math.sin(t * Math.PI * 2 * 0.42) * 2.2; MP.chX -= mb; MP.hdX += mb * 0.5;
    gbPlant(MP, 0.43); MP.rootY = Math.min(MP.rootY, -0.4);
    M.applyPose(MP);
    M.applyFace(GB_FACES.exhausted, { x: 0, y: -0.3 });
    // ---- the walkers before the change (seen through the windows): the leaner and the engineer cross the square
    const L = this.leaner, E = this.engineer;
    if (t < GB.s2 + 1) {
      for (const [C, x0, z0, dir, sp, ph] of [[L, -8.2, -7.4, 1, 1.15, 0], [E, 2.4, -9.6, -1, 1.0, 0.4]]) {
        const tStop = GB.g + 0.15, tt = Math.min(t, tStop) + 0.35 * MathX.smooth(t, tStop, tStop + 0.8);
        const x = x0 + dir * sp * tt;
        C.place(x, 0, z0, dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        const moving = 1 - MathX.smooth(t, tStop, tStop + 0.7);
        const P = Object.assign({}, GB_POSES.stand);
        if (moving > 0.01) { const cyc = gbCycle((tt * sp) / 1.4 + ph); for (const k in cyc) P[k] = (P[k] || 0) + cyc[k] * moving; }
        const sag = gbEvalTrack([[0, 'stand', 0.01], [tStop, 'shopDip', 0.5, 'inQuad'], [tStop + 0.8, 'standTired', 1.0]], GB_POSES, t);
        for (const k in sag) P[k] = P[k] * moving + sag[k] * (1 - moving);
        gbPlant(P, 0);
        C.applyPose(P);
        C.applyFace(gbEvalTrack([[0, 'neutral', 0.01], [GB.g + 0.1, 'shock', 0.2]], GB_FACES, t), { x: 0, y: 0 });
      }
    } else {
      // ---- the leaner: back against the café's pilaster, knees soft, getting his breath
      L.place(-2.35, 0, -4.12, Math.PI);
      const LP = Object.assign({}, GB_POSES.wallLean);
      const lb = Math.sin(t * Math.PI * 2 * 0.45) * 2.4; LP.chX -= lb; LP.hdX += lb * 0.5;
      gbPlant(LP, 0.28); LP.rootZ += 0.0;
      L.applyPose(LP);
      L.applyFace(GB_FACES.exhausted, { x: 0, y: 0.1 });
      // ---- the engineer under the loaded balcony (scene 10): torch up at the gauge, then a note on his tablet
      const [ex, ez] = [-7.18, -5.95];
      E.place(ex, 0, ez, Math.PI * 1.22);
      const EP = gbEvalTrack([[0, 'engLook', 0.01], [GB.gaugeUp[1] - 0.6, 'engNote', 0.9]], GB_POSES, t);
      EP.hdY += 6 * Math.sin(t * 0.7);
      gbPlant(EP, 0);
      E.applyPose(EP);
      E.applyFace(gbEvalTrack([[0, 'brace', 0.01], [GB.gaugeUp[0] + 2.4, 'worried', 0.6]], GB_FACES, t), { x: 0, y: 0.7 });
      const lh = E.worldOf('LWr', v[0]); this.tablet.position.copy(lh).add(new THREE.Vector3(0.02, 0.03, 0)); this.tablet.rotation.set(-0.9, E.root.rotation.y, 0);
      const rh = E.worldOf('RWr', v[1]); E.J.RWr.updateMatrixWorld(true);
      this.torch.position.copy(rh).add(new THREE.Vector3(0, -0.06, 0).applyQuaternion(E.J.RWr.getWorldQuaternion(new THREE.Quaternion())));
      this.torch.quaternion.copy(E.J.RWr.getWorldQuaternion(new THREE.Quaternion())); this.torch.rotateX(Math.PI);
    }
    // the balcony gauge: 1 g load before the change; at 2 g the needle sits at 2× (inside the amber margin)
    this.cafe.setGauge(1 + after + 0.03 * Math.sin(t * 9) * after);
    // ---- the shopper: bag in hand, knees bending and catching (scene 8); she helps the jogger up (scene 11)
    const W = this.shopper, J = this.jogger;
    if (t < GB.s10) {
      const [wx, wz, wy] = GB_SET.shopper;
      W.place(wx, 0, wz, wy);
      const dipT = [GB.out + 1.5, GB.carry + 0.6, GB.half + 0.5, GB.s9b + 1.2];
      const WP = gbEvalTrack([[0, 'shopBrace', 0.01], ...dipT.flatMap((d) => [[d, 'shopDip', 0.55, 'inQuad'], [d + 0.65, 'shopBrace', 0.9, 'outBack']])], GB_POSES, t);
      WP.pelZ = (WP.pelZ || 0) + 4 * Math.sin(t * 1.3); WP.spZ = (WP.spZ || 0) - 3 * Math.sin(t * 1.3 + 0.4);
      gbPlant(WP, 0.0);
      W.applyPose(WP);
      W.applyFace(gbEvalTrack([[0, 'strain', 0.01], ...dipT.flatMap((d) => [[d, 'shock', 0.2], [d + 0.7, 'strain', 0.5]])], GB_FACES, t), { x: 0.2, y: -0.2 });
      const hand = W.worldOf('LWr', v[1]);
      this.bag.position.copy(hand).add(new THREE.Vector3(0, -0.07, 0)); this.bag.rotation.set(0.05 * Math.sin(t * 2), wy, 0.06 * Math.sin(t * 1.7));
      // the jogger resting on the ground
      J.place(...GB_SET.jogger);
      const JP = Object.assign({}, GB_POSES.jogKneel); JP.chX += Math.sin(t * Math.PI * 2 * 0.55) * 3;
      J.applyPose(JP); J.applyFace(GB_FACES.exhausted, { x: 0, y: -0.4 });
    } else {
      // scene 11: the shopper (bag set down) takes the jogger's hands and pulls her up
      const jx = -5.4, jz = -11.6, wx = jx + 0.95, wz = jz + 0.25;
      const yawW = Math.atan2(jx - wx, jz - wz);
      W.place(wx, 0, wz, yawW); J.place(jx, 0, jz, yawW + Math.PI);
      // scene 12 (on the cut): both have turned to look across the square with him, a little apart
      if (t >= GB.s12) { W.place(wx + 0.3, 0, wz - 0.1, Math.PI * 0.95); J.place(jx - 0.15, 0, jz, Math.PI * 1.03); }
      const h = GB.help;
      const WP = gbEvalTrack([[0, 'shopBrace', 0.01], [h[0] - 0.8, 'helpPull', 0.8], [h[0] + 1.0, 'helpPull', 0.4], [h[1] - 0.6, 'standTired', 1.0]], GB_POSES, t);
      WP.pelX -= 6 * MathX.window(t, h[0] + 0.6, h[0] + 2.6, 0.5, 0.5);
      gbPlant(WP, 0.0);
      W.applyPose(WP);
      const k = Ease.inOutSine(MathX.ramp(t, h[0] + 0.7, h[0] + 3.2));
      const JP = gbEvalTrack([[0, 'jogKneel', 0.01], [h[0] + 0.5, 'benchPush', 1.2], [h[0] + 1.8, 'benchHalf', 1.2], [h[0] + 3.0, 'standTired', 1.2]], GB_POSES, t);
      if (t < h[0] + 0.5) J.applyPose(JP); else { gbPlant(JP, 0.3 * (1 - k)); if (t < h[0] + 0.9) JP.rootY = MathX.lerp(GB_POSES.jogKneel.rootY, JP.rootY, MathX.ramp(t, h[0] + 0.5, h[0] + 0.9)); J.applyPose(JP); }
      // hands joined between them while she pulls
      const wj = MathX.window(t, h[0] - 0.2, h[1] - 0.6, 0.6, 0.8);
      if (wj > 0) {
        const mid = new THREE.Vector3((wx + jx) / 2, 0.75 + 0.35 * k, (wz + jz) / 2);
        for (const s of ['L', 'R']) { const o = new THREE.Vector3(s === 'L' ? 0.07 : -0.07, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawW); W.solveArm(s, mid.clone().add(o), new THREE.Vector3(0, -1, 0), wj); J.solveArm(s, mid.clone().sub(o), new THREE.Vector3(0, -1, 0), wj); }
      }
      W.applyFace(gbEvalTrack([[0, 'brace', 0.01], [h[0] + 0.8, 'strain', 0.4], [h[1] - 0.5, 'relief', 0.8]], GB_FACES, t), { x: 0, y: -0.3 + 0.3 * k });
      J.applyFace(gbEvalTrack([[0, 'exhausted', 0.01], [h[0] + 0.8, 'strainHard', 0.4], [h[1] - 0.5, 'relief', 0.8]], GB_FACES, t), { x: 0, y: 0.3 * (1 - k) });
      this.bag.position.set(wx + 0.3, 0.17, wz + 0.25); this.bag.rotation.set(0, 0.4, 0);
    }
    // ---- the cyclist and her bicycle
    this._cyclist(t);
    // ---- pigeons: flattened on the paving; two labour across low
    for (const Pg of this.pigeons) {
      const i = Pg.i, fly = i < 2;
      if (!fly) {
        const px = -2.5 + i * 0.9 + Math.sin(i * 3) * 0.6, pz = -8.6 - (i % 3) * 0.7;
        Pg.g.position.set(px, 0.09 - 0.03 * after, pz); Pg.g.rotation.set(0.15 * after + 0.1 * Math.max(0, Math.sin(t * 0.7 + i * 2)), i * 1.3, 0); Pg.g.scale.set(1 + 0.12 * after, 1 - 0.18 * after, 1);
        Pg.wl.rotation.z = 0.05; Pg.wr.rotation.z = -0.05;
      } else {
        const u = ((t + i * 4.5) % 9);
        const x0 = -9 + i * 2, y = 2.4 + i * 0.5 - 0.2 * u - 0.012 * u * u;
        Pg.g.position.set(x0 + 1.9 * u, Math.max(0.4, y) + 0.06 * Math.sin(t * 30), -12.5 - i * 1.5);
        Pg.g.rotation.set(0.2, Math.PI / 2, 0); Pg.g.scale.set(1, 1, 1);
        const fl = Math.sin(t * 34 + i) * 1.1;
        Pg.wl.rotation.z = fl; Pg.wr.rotation.z = -fl;
      }
    }
  }

  // the cyclist: lifts her bicycle out of the rack (scene 8), pushes it up the ramp (scene 9), rests at the top (10–12)
  _cyclist(t) {
    const C = this.cyclist, B = this.bike, cafe = this.cafe;
    const bar = B.bar.clone(), saddle = B.saddle.clone();
    if (t < GB.s9 - 3.2) {
      // at the rack: the bike stands in it (6.4, −6.2, yaw 0.25); she lifts it out: the front first, then the whole bike
      const yawB = 0.25, bx = 6.4, bz = -6.2;
      const L2 = GB.lift2, up = Ease.inOutSine(MathX.ramp(t, L2[0] + 0.3, L2[0] + 1.6)) * (1 - Ease.inOutSine(MathX.ramp(t, L2[1] - 0.6, L2[1] + 0.4)));
      const tr = 0.006 * MathX.window(t, L2[0] + 0.6, L2[1] - 0.2, 0.3, 0.3) * Math.sin(t * 61);
      const backOut = 0.45 * Ease.inOutSine(MathX.ramp(t, L2[0] + 1.4, L2[1] - 0.4));
      B.g.position.set(bx - Math.cos(yawB) * 0 + Math.sin(yawB) * backOut, 0.13 * up + tr, bz + Math.cos(yawB) * backOut);
      B.g.rotation.set(0, yawB, 0); B.body.rotation.set(0, 0, 0.05 * up);
      // she stands at the bike's left side (local +Z), facing it
      const side = new THREE.Vector3(0, 0, 0.55).applyAxisAngle(new THREE.Vector3(0, 1, 0), yawB);
      const cx = B.g.position.x + side.x - 0.02, cz = B.g.position.z + side.z;
      C.place(cx, 0, cz, yawB + Math.PI);
      const P = gbEvalTrack([[0, 'standTired', 0.01], [L2[0] - 0.4, 'bikeLift', 0.6], [L2[1] - 0.2, 'standTired', 0.9]], GB_POSES, t);
      const eff = MathX.window(t, L2[0], L2[1], 0.4, 0.4);
      for (const k of ['LKnX', 'RKnX', 'spX', 'LShX', 'RShX']) P[k] = (P[k] || 0) + eff * 1.6 * Math.sin(t * 49 + k.length * 2);
      P.LKnX += 14 * eff; P.RKnX += 14 * eff;
      gbPlant(P, 0.0);
      C.applyPose(P);
      B.g.updateMatrixWorld(true);
      const wH = MathX.smooth(t, L2[0] - 0.4, L2[0]) * (1 - MathX.smooth(t, L2[1] + 0.2, L2[1] + 0.7));
      C.solveArm('L', bar.clone().add(new THREE.Vector3(0, 0.02, 0.2)).applyMatrix4(B.body.matrixWorld), new THREE.Vector3(0, -1, 0), wH);
      C.solveArm('R', saddle.clone().add(new THREE.Vector3(0, 0.03, 0.03)).applyMatrix4(B.body.matrixWorld), new THREE.Vector3(0, -1, 0), wH);
      C.applyFace(gbEvalTrack([[0, 'exhausted', 0.01], [L2[0], 'strainHard', 0.4], [L2[1], 'exhausted', 0.6]], GB_FACES, t), { x: 0, y: -0.4 });
      for (const w of B.wheels) w.rotation.z = 0;
    } else {
      // the ramp (and resting at the top afterwards): she walks on the bike's left, both hands on it, leaning in
      const z = this.rampZ(t), x = this.rampX, gy = cafe.rampY(x + 0.5, z);
      const bzF = z - 0.25, ang = Math.atan2(cafe.rampY(x + 0.52, bzF - 0.52) - cafe.rampY(x + 0.52, bzF + 0.52), 1.04);   // the bike pitches with the slope
      B.g.position.set(x + 0.52, cafe.rampY(x + 0.52, bzF), bzF);
      B.g.rotation.set(0, Math.PI / 2, 0); B.body.rotation.set(0, 0, ang);
      const dist = (z - this.rampZ(GB.ramp[0]));
      for (const w of B.wheels) w.rotation.z = dist / 0.34;
      C.place(x, gy, z, Math.PI);
      const P = gbEvalTrack([[0, 'bikePush', 0.01], [GB.ramp[1] + 0.3, 'standTired', 1.2]], GB_POSES, t);
      const resting = 1 - MathX.smooth(t, GB.ramp[0] + 0.5 * (GB.ramp[1] - GB.ramp[0]) - 1.2, GB.ramp[0] + 0.5 * (GB.ramp[1] - GB.ramp[0]) - 0.6) * (1 - MathX.smooth(t, GB.ramp[0] + 0.5 * (GB.ramp[1] - GB.ramp[0]) + 0.4, GB.ramp[0] + 0.5 * (GB.ramp[1] - GB.ramp[0]) + 1.0));
      P.hdX += 10 * (1 - resting); P.spX += 4 * (1 - resting);
      const br = Math.sin(t * Math.PI * 2 * 0.6) * 2.4; P.chX -= br; P.hdX += br * 0.5;
      const feet = gbFeetAt(this.rampPlan, t, 0.05);
      gbStandOn(C, P, feet, { bend: 0.06 });
      C.applyPose(P);
      B.g.updateMatrixWorld(true);
      C.solveArm('R', bar.clone().add(new THREE.Vector3(0, 0.02, 0.22)).applyMatrix4(B.body.matrixWorld), new THREE.Vector3(0.3, -1, 0), 1);
      C.solveArm('L', saddle.clone().add(new THREE.Vector3(0.0, 0.03, 0.05)).applyMatrix4(B.body.matrixWorld), new THREE.Vector3(0, -1, 0.3), 0.9);
      C.applyFace(gbEvalTrack([[0, 'strain', 0.01], [GB.ramp[1] - 0.2, 'exhausted', 0.8]], GB_FACES, t), { x: 0, y: -0.2 });
    }
  }

  update(t, opts) {
    const inside = !opts.outside && !opts.exp, H = this.hero;
    // who is visible
    for (const p of this.inside) p.root.visible = inside;
    for (const p of this.outside) p.root.visible = !!opts.outside;
    for (const pg of this.pigeons) pg.g.visible = !!opts.outside;
    this.car.g.visible = !!opts.outside; this.bag.visible = !!opts.outside; this.bike.g.visible = !!opts.outside;
    this.tablet.visible = this.torch.visible = !!opts.outside && t >= GB.s2 + 1;
    this.cup.visible = !opts.exp; this.phone.visible = !opts.exp;
    let C = null;
    if (inside) {
      this._insidePeople(t);
      if (t < GB.s7 - 0.3) { H.root.visible = true; C = this._heroTable(t); }
      else {
        H.root.visible = true; this._heroStairs(t);
        // his cup waits on the table
        const [tx, tz] = GB_SET.heroTable; this.cup.position.set(tx - 0.22, GB_SET.tableH + 0.008, tz + 0.12); this.cup.rotation.set(0, -0.3, 0);
        this.cafe.heroChair.g.position.x = GB_SET.heroChair[0] - 0.22;
      }
    } else if (opts.outside) {
      this._outsidePeople(t);
      H.root.visible = t >= GB.s9c - 0.5;
      if (H.root.visible) this._heroOutside(t);
    } else H.root.visible = false;
    // steam off the coffee (only in the café)
    const St = this.steam; St.begin(this.app.scene.fog);
    if (inside) {
      const sp = this.cup.userData.surf.getWorldPosition(this.tmp[1]), hh = C ? C.h : 0;
      const rate = 1 + 0.4 * MathX.smooth(t, GB.g, GB.g + 1.0), fade = 1 - 0.7 * MathX.smooth(t, GB.s6, GB.s7);
      for (let i = 0; i < 40; i++) {
        const life = 2.2, ph = ((t * rate) / life + hash1(i * 7)) % 1;
        const yy = ph * 0.2, sw = 0.008 + 0.028 * ph;
        const x = sp.x + Math.sin(t * 1.3 + i * 2.1 + ph * 5) * sw + 0.015 * ph, z = sp.z + Math.cos(t * 1.1 + i * 1.7 + ph * 4) * sw;
        const a = 0.085 * fade * Math.sin(Math.PI * ph) * (0.5 + 0.5 * hash1(i * 3)) * (1 - 0.6 * Math.min(1, hh * 8));
        St.push(x, sp.y + 0.01 + yy, z, 0.016 + 0.045 * ph, hash1(i) * 6 + t * 0.4, a, 1, 1.0, 0.95, 0.9);
      }
    }
    St.end();
    return C;
  }
}
