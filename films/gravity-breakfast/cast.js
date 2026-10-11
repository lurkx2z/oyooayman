/* =====================================================================
   CAST — who does what, when (pure functions of t): the hero at his breakfast, the waiter with her tray,
   the plaza (balloon vendor + balloons, a jogger, a man on the bench, pigeons), and the props they touch
   (his cup — authored as a weighted path the hand follows by IK — the tray cups, the falling cup, the shards).
   ===================================================================== */

// walk / jog cycle: pose overrides for a phase (0…1 per stride pair)
function gbCycle(phase, kind = 'walk') {
  const a = Math.sin(phase * Math.PI * 2), b = Math.cos(phase * Math.PI * 2), jog = kind === 'jog';
  const hip = jog ? 34 : 22, kn = jog ? 70 : 38, arm = jog ? 32 : 18;
  return {
    LHipX: -hip * a - (jog ? 10 : 2), RHipX: hip * a - (jog ? 10 : 2),
    LKnX: Math.max(0, -b) * kn + 6, RKnX: Math.max(0, b) * kn + 6,
    LAnX: 8 * a, RAnX: -8 * a,
    LShX: arm * a, RShX: -arm * a, LElX: jog ? -85 : -20, RElX: jog ? -85 : -20, LShAbd: 8, RShAbd: 8,
    rootY: -Math.abs(b) * (jog ? 0.05 : 0.02), spX: jog ? 8 : 3, chY: 6 * a, pelY: -5 * a, hdX: jog ? -4 : 0,
    LFing: 0.5, RFing: 0.5,
  };
}

// aim a first-person hand so a palm point lands on a world point (copied pattern of frAimHand, film-side)
const _gbAim = { q: new THREE.Quaternion(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), c: new THREE.Vector3() };
function gbAimHand(P, camera, world, Fw, Nw, side = 1) {
  const A = _gbAim;
  camera.updateMatrixWorld(true);
  A.q.copy(camera.quaternion).invert();
  A.y.copy(Fw).normalize().applyQuaternion(A.q); A.y.x *= side; P.F = [A.y.x, A.y.y, A.y.z];
  A.z.copy(Nw).normalize().applyQuaternion(A.q); A.z.x *= side; P.N = [A.z.x, A.z.y, A.z.z];
  A.y.set(...P.F).normalize();
  A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize();
  A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse);
  A.c.x *= side;
  const l = P.aim;
  for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}

// keyed scalar helper: [[t, v, ease?], …] → Track (cached)
const _gbTr = new Map();
function gbTrack(id, keys) { if (!_gbTr.has(id)) _gbTr.set(id, new Track(keys)); return _gbTr.get(id); }

const GB_HERO_POSES = [
  [0, 'sitRelax', 0.01],
  [3.05, 'sitSip', 0.55],
  [4.3, 'sitRelax', 0.6],
  [5.0, 'sitSip', 0.5],
  [GB.g, 'sitCollapse', 0.26, 'outQuad'],      // impact: the weight lands
  [6.75, 'sitStrain', 1.0, 'inOutCubic'],      // he tries to sit up…
  [7.95, 'sitHeavy', 0.7, 'inOutSine'],        // …and sags back
  [8.55, 'sitLookUp', 0.7],                    // looks up at the bouncing lamp
  [9.6, 'sitHeavy', 0.5],
  [11.25, 'sitStrain', 0.5],                   // the lift attempt
  [14.35, 'sitHeavy', 0.4, 'outQuad'],
  [14.95, 'sitStare', 0.5],
];
const GB_HERO_FACES = [
  [0, 'content', 0.01],
  [3.25, 'sip', 0.25], [4.25, 'content', 0.35],
  [5.05, 'neutral', 0.3],
  [GB.g + 0.02, 'surprise', 0.07, 'outQuad'],
  [6.25, 'shock', 0.35],
  [6.8, 'strain', 0.35],
  [7.95, 'worried', 0.4],
  [8.55, 'awe', 0.4],
  [9.6, 'worried', 0.4],
  [11.3, 'strain', 0.3], [12.6, 'strainHard', 0.6],
  [14.35, 'exhausted', 0.35],
  [15.0, 'worried', 0.35],
];
const GB_HERO_BLINKS = [1.4, 4.95, 7.45, 9.25, 10.7, 14.6];
// pupils: [t, x, y] (−1…1; x + = his left)
const GB_HERO_LOOK = [[0, 0.55, -0.1], [2.4, 0.5, -0.2], [3.2, 0.0, -0.4], [4.3, 0.6, 0.0], [5.05, 0.1, -0.5], [GB.g + 0.05, 0.0, -0.75], [6.3, -0.2, -0.3],
  [7.0, 0.0, -0.6], [8.0, -0.5, 0.1], [8.6, 0.0, 0.95], [9.6, -0.4, -0.3], [11.2, 0.15, -0.8], [14.4, 0.0, -0.4], [15.0, 0.0, 0.0]];

const GB_WAITER_POSES = [[0, 'tray', 0.01], [GB.g + 0.12, 'trayBuckle', 0.34, 'outQuad'], [6.55, 'trayKneel', 0.9, 'inOutCubic']];
const GB_WAITER_FACES = [[0, 'content', 0.01], [GB.g + 0.1, 'surprise', 0.1], [6.4, 'strain', 0.5], [20.7, 'shock', 0.2], [21.4, 'worried', 0.4]];

class GbCast {
  constructor(app, cafe) {
    this.app = app; this.cafe = cafe;
    const S = app.scene;
    this.hero = new GbCharacter(S, 'hero');
    this.waiter = new GbCharacter(S, 'waiter');
    this.vendor = new GbCharacter(S, 'vendor');
    this.jogger = new GbCharacter(S, 'jogger');
    this.sitter = new GbCharacter(S, 'sitter');
    this.people = [this.hero, this.waiter, this.vendor, this.jogger, this.sitter];
    this._props();
    this._balloons();
    this._pigeons();
    this.tmp = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
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
    const china = gbMat('#efe6d8', { rough: 0.38, rim: 0.45, name: 'gbChina', env: 0.7 });
    const coffee = gbMat('#3a2014', { rough: 0.15, name: 'gbCoffee', env: 1.0 });
    this.cup = this._cup(china, coffee); S.add(this.cup);
    // the 1 g ghost of his cup (close-up comparison)
    const ghostM = gbMat('#fff2dc', { rough: 0.5, transparent: true, opacity: 0.0, emissive: '#ffd8a8', emi: 0.6, depthWrite: false, name: 'gbGhost' });
    this.ghostM = ghostM;
    this.ghost = this._cup(ghostM, ghostM); this.ghost.traverse((o) => { o.castShadow = false; o.renderOrder = 6; }); S.add(this.ghost);
    // splash drops (instanced)
    this.splash = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), gbMat('#4a2a18', { rough: 0.2, env: 1.0 }), 26);
    this.splash.frustumCulled = false; S.add(this.splash);
    this.spill = gbAdd(S, new THREE.CircleGeometry(1, 28), gbMat('#3a2014', { rough: 0.12, env: 1.0, name: 'gbSpill' }), 0, 0, 0, { rx: -Math.PI / 2, cast: false });
    // the waiter's tray (+ two cups on it), a falling cup and its shards
    const trayM = gbMat('#b9b2a8', { rough: 0.3, metal: 0.7, rim: 0.4, env: 0.9, name: 'gbTray' });
    this.tray = new THREE.Group(); S.add(this.tray);
    gbAdd(this.tray, new THREE.CylinderGeometry(0.2, 0.19, 0.012, 32), trayM, 0, 0, 0);
    gbAdd(this.tray, new THREE.TorusGeometry(0.2, 0.008, 6, 32), trayM, 0, 0.006, 0, { rx: Math.PI / 2 });
    this.trayCupA = this._cup(china, coffee); this.tray.add(this.trayCupA); this.trayCupA.position.set(-0.07, 0.006, 0.04);
    this.trayCupB = this._cup(china, coffee); S.add(this.trayCupB);
    this.plate2 = gbAdd(this.tray, gbLathe([[0, 0], [0.08, 0], [0.09, 0.01], [0, 0.008]], 24), china, 0.06, 0.006, -0.08);
    this.shards = [];
    for (let i = 0; i < 9; i++) this.shards.push(gbAdd(S, new THREE.TetrahedronGeometry(0.018 + 0.012 * hash1(i * 3)), china, 0, -5, 0, { cast: false }));
    this.puddle = gbAdd(S, new THREE.CircleGeometry(1, 24), gbMat('#3a2014', { rough: 0.1, env: 1.0 }), 0, 0.002, 0, { rx: -Math.PI / 2, cast: false });
  }

  _balloons() {
    const S = this.app.scene, cols = ['#e2614f', '#f0b54a', '#4fa3a5', '#f4e6cf', '#d9708f', '#6f7fd6', '#ef8a3c'];
    const geo = new THREE.SphereGeometry(1, 20, 16);
    this.balloons = cols.map((c, i) => {
      const g = new THREE.Group(); S.add(g);
      gbAdd(g, geo, gbMat(c, { rough: 0.32, rim: 0.7, env: 0.9, name: 'gbBalloon' }), 0, 0, 0, { s: [0.2, 0.24, 0.2] });
      gbAdd(g, new THREE.ConeGeometry(0.03, 0.05, 8), gbMat(c, { rough: 0.5 }), 0, -0.25, 0, { rx: Math.PI });
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9 * 3), 3));
      const str = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: '#e8e0d0', transparent: true, opacity: 0.85 })); str.frustumCulled = false; S.add(str);
      return { g, str, i, off: [Math.cos(i * 2.4) * 0.28 * (i ? 1 : 0), 1.55 + 0.18 * hash1(i * 7), Math.sin(i * 2.4) * 0.28 * (i ? 1 : 0)] };
    });
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

  // ------------------------------------------------------------------------------------------ hero
  _mouthPoint(out) {
    const hc = this.hero.face.hc; hc.updateMatrixWorld(true);
    return out.set(0, -0.07, 0.19).applyMatrix4(hc.matrixWorld);
  }

  // the cup's world position and tilt (rad toward his mouth) at t; held = the right hand is on it
  cupState(t, restP, mouthP) {
    const out = { p: new THREE.Vector3().copy(restP), tilt: 0, held: 0, slosh: 0 };
    const lerpP = (a, b, k) => out.p.lerpVectors(a, b, k);
    const lift = new THREE.Vector3().copy(restP).add(new THREE.Vector3(0.0, 0.17, 0.0));
    const sipP = new THREE.Vector3().copy(mouthP).add(new THREE.Vector3(-0.02, -0.115, 0.01));
    const S = GB.sip;
    if (t >= S[0] - 0.25 && t < S[1] + 0.3) out.held = MathX.smooth(t, S[0] - 0.25, S[0]) * (1 - MathX.smooth(t, S[1] + 0.05, S[1] + 0.3));
    if (t >= S[0] && t < S[1]) {
      const up = Ease.inOutCubic(MathX.ramp(t, S[0], S[0] + 0.45)), down = Ease.inOutCubic(MathX.ramp(t, S[1] - 0.5, S[1]));
      const k = up * (1 - down);
      const ant = -0.012 * Math.sin(Math.PI * MathX.ramp(t, S[0], S[0] + 0.12));       // tiny anticipation dip
      lerpP(restP, sipP, k); out.p.y += ant;
      out.tilt = 0.75 * MathX.smooth(t, S[0] + 0.3, S[0] + 0.6) * (1 - MathX.smooth(t, S[1] - 0.6, S[1] - 0.3));
    }
    // the second lift… and gravity doubles
    if (t >= GB.lift - 0.25) out.held = Math.max(out.held, MathX.smooth(t, GB.lift - 0.25, GB.lift));
    if (t >= GB.lift && t < GB.g) lerpP(restP, lift, Ease.inOutCubic(MathX.ramp(t, GB.lift, GB.g - 0.08)));
    if (t >= GB.g) {
      const u = t - GB.g, h0 = 0.17, tHit = Math.sqrt(2 * h0 / 19.62);
      if (u < tHit) { out.p.copy(lift); out.p.y -= 0.5 * 19.62 * u * u; }
      else out.p.y = restP.y + Math.abs(Math.sin((u - tHit) * 40)) * 0.008 * Math.exp(-(u - tHit) * 14);
      out.slosh = Math.exp(-(u - tHit) * 3.2) * Math.sin((u - tHit) * 15) * (u > tHit ? 1 : 0);
      out.held = Math.max(0, 1 - MathX.smooth(t, GB.g + 0.6, GB.g + 1.1));
    }
    // the close-up: he tries to lift it — slow, shaky, a few centimetres
    const T = GB.try;
    if (t >= T[0] - 0.3 && t < T[1] + 0.4) {
      out.held = MathX.smooth(t, T[0] - 0.3, T[0]) * (1 - MathX.smooth(t, T[1] + 0.05, T[1] + 0.4));
      if (t >= T[0]) {
        let y = 0.05 * Ease.inOutSine(MathX.ramp(t, T[0] + 0.2, T[0] + 1.6)) + 0.04 * Ease.inOutSine(MathX.ramp(t, T[0] + 1.6, T[0] + 2.4));
        y *= 1 - Ease.inQuad(MathX.ramp(t, T[1] - 0.45, T[1] - 0.05));
        const shake = (0.0035 * Math.sin(t * 57) + 0.0025 * Math.sin(t * 83 + 1)) * MathX.smooth(t, T[0] + 0.2, T[0] + 0.6);
        out.p.y = restP.y + Math.max(0, y + shake * (y > 0.005 ? 1 : 0));
        out.p.x += 0.004 * Math.sin(t * 41);
        out.tilt = 0.06 * Math.sin(t * 9) * MathX.smooth(t, T[0] + 0.5, T[0] + 1.0);
        out.slosh = 0.6 * Math.sin(t * 9) * MathX.smooth(t, T[0] + 0.5, T[0] + 1.0) + (t > T[1] ? Math.exp(-(t - T[1]) * 3) * Math.sin((t - T[1]) * 15) : 0);
      }
    }
    return out;
  }

  updateHero(t, opts) {
    const H = this.hero, [cx, cz] = GB_SET.heroChair, sink = this.cafe.heroChair.seat.position.y - 0.46;
    H.place(cx, sink, cz, Math.PI / 2);
    H.root.visible = !opts.pov;
    const P = gbEvalTrack(GB_HERO_POSES, GB_POSES, t);
    // additive layers: breathing (slow before, heavy after), impact springs, effort tremble
    const after = MathX.smooth(t, GB.g, GB.g + 0.4);
    const br = Math.sin(t * Math.PI * 2 * (0.24 + 0.2 * after)) * (1.0 + 1.6 * after);
    P.chX = (P.chX || 0) - br * 0.8; P.hdX = (P.hdX || 0) + br * 0.4; P.LShrug = (P.LShrug || 0) + br * 0.002; P.RShrug = (P.RShrug || 0) + br * 0.002;
    P.spX += gbSpring(t, GB.g + 0.02, 4, 2.4, 4.5); P.chX += gbSpring(t, GB.g + 0.06, 3, 2.6, 4.2);
    P.hdX += gbSpring(t, GB.g + 0.08, 6, 2.2, 3.6); P.hdZ = (P.hdZ || 0) + gbSpring(t, GB.g + 0.1, 3, 1.8, 3);
    P.rootY += -gbSpring(t, GB.g, 0.012, 4, 5);
    const eff = MathX.window(t, 6.75, 7.95, 0.3, 0.3) + MathX.window(t, GB.try[0], GB.try[1], 0.3, 0.3);
    for (const k of ['RShX', 'RElX', 'LShX', 'spX', 'hdZ']) P[k] = (P[k] || 0) + eff * (1.2 * Math.sin(t * 53 + k.length) + 0.8 * Math.sin(t * 71 + k.length * 2));
    H.applyPose(P);
    // the cup and the hands (IK): right hand on the cup handle when held; left hand resting on the table
    const v = this.tmp, [tx, tz] = GB_SET.heroTable, rest = v[0].set(tx - 0.22, GB_SET.tableH + 0.008, tz + 0.12);
    const mouth = this._mouthPoint(v[1]);
    const C = this.cupState(t, rest, mouth);
    this.cup.position.copy(C.p);
    this.cup.rotation.set(0, -0.3, 0);
    // tilt toward his mouth (about the world Z axis: he faces +X)
    this.cup.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), C.tilt);
    const surf = this.cup.userData.surf; surf.rotation.set(-Math.PI / 2 + C.slosh * 0.25, 0, C.slosh * 0.12);
    // handle point (world): the handle sits on the cup's local +Z… find it from the cup's matrix
    this.cup.updateMatrixWorld(true);
    const handle = v[2].set(0, 0.045, 0.072).applyMatrix4(this.cup.matrixWorld);
    // the hand comes in along the handle: wrist ~11 cm out from it, fingers pointing back at the cup
    const hdir = new THREE.Vector3(0, 0, 1).transformDirection(this.cup.matrixWorld);
    const wrist = v[3].copy(handle).addScaledVector(hdir, 0.072).add(new THREE.Vector3(0, 0.008, 0));
    const R = { p: wrist, pole: new THREE.Vector3(-0.35, -1, 0.45).normalize(), w: C.held };
    const restR = new THREE.Vector3(tx - 0.3, GB_SET.tableH + 0.05, tz + 0.2);
    const Lw = new THREE.Vector3(tx - 0.2, GB_SET.tableH + 0.045, tz - 0.18);
    // the right hand rests on the table when not holding
    H.solveArm('R', R.w > 0.01 ? new THREE.Vector3().lerpVectors(restR, wrist, R.w) : restR, R.pole, opts.seated ? 1 : 0);
    H.solveArm('L', Lw, new THREE.Vector3(0.2, -1, -0.8).normalize(), opts.seated ? 0.85 : 0);
    // grip: fingers curl round the handle when holding
    const Pf = { RFing: 0.35 + 0.5 * C.held, RThumb: 0.3 + 0.4 * C.held };
    H.hR = H.handR; H.handR.fingers.forEach(([f1, f2], i) => { const k = Pf.RFing * (1 + i * 0.06); f1.rotation.z = -H.handR.pn * k * 1.45; f2.rotation.z = -H.handR.pn * k * 1.5; });
    H.J.RWr.rotation.set(0.15 * (1 - C.held), -1.2 * C.held, 0.2 * (1 - C.held) - 0.15 * C.held);
    H.J.LWr.rotation.set(0.25, -0.2, -0.15);
    // face
    const F = gbEvalTrack(GB_HERO_FACES, GB_FACES, t);
    F.blink = GB_HERO_BLINKS.reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
    F.glassesDrop = -0.012 * gbSettle(t, GB.g + 0.03, 0.35, 0.4, 3) * (1 - MathX.smooth(t, 14.9, 15.3));
    const lx = gbTrack('hlx', GB_HERO_LOOK.map(([a, x]) => [a, x])).value(t), ly = gbTrack('hly', GB_HERO_LOOK.map(([a, , y]) => [a, y])).value(t);
    H.applyFace(F, { x: lx, y: ly });
    // the splash and spill when the cup lands
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const tHit = GB.g + Math.sqrt(2 * 0.17 / 19.62);
    for (let i = 0; i < 26; i++) {
      const u = t - tHit - hash1(i * 3) * 0.04;
      if (u < 0 || u > 0.5) { m.makeScale(0, 0, 0); this.splash.setMatrixAt(i, m); continue; }
      const a = hash1(i * 7) * Math.PI * 2, sp = 0.25 + 0.45 * hash1(i * 11), vy = 0.5 + 0.7 * hash1(i * 13);
      p.set(rest.x + Math.cos(a) * sp * u, rest.y + 0.075 + vy * u - 0.5 * 19.62 * u * u, rest.z + Math.sin(a) * sp * u);
      if (p.y < GB_SET.tableH + 0.004) { m.makeScale(0, 0, 0); this.splash.setMatrixAt(i, m); continue; }
      const r = 0.004 + 0.004 * hash1(i * 17);
      s.set(r, r * 1.6, r); m.compose(p, q, s); this.splash.setMatrixAt(i, m);
    }
    this.splash.instanceMatrix.needsUpdate = true;
    const sp = MathX.smooth(t, tHit, tHit + 0.25);
    this.spill.visible = sp > 0.01;
    this.spill.position.set(rest.x + 0.03, GB_SET.tableH + 0.0015, rest.z - 0.02); this.spill.scale.set(0.11 * sp + 0.001, 0.07 * sp + 0.001, 1);
    // the 1 g ghost (close-up only): it rises easily — what the same effort used to do
    const gk = MathX.window(t, GB.try[0] + 0.1, GB.try[1] - 0.2, 0.3, 0.4) * (opts.ghost ? 1 : 0);
    this.ghostM.opacity = 0.32 * gk; this.ghost.visible = gk > 0.01;
    this.ghost.position.copy(rest).add(new THREE.Vector3(0, 0.2 * Ease.outCubic(MathX.ramp(t, GB.try[0] + 0.25, GB.try[0] + 1.0)), 0));
    this.ghost.rotation.copy(this.cup.rotation);
    return C;
  }

  // ------------------------------------------------------------------------------------------ waiter
  // pose the waiter + her tray for time t (FK + IK); returns the slide amount and effort
  _poseWaiter(t) {
    const W = this.waiter, v = this.tmp;
    // walks in with the tray (3.0 → 5.3), stops beside the next table, facing him (−X)
    const x = gbTrack('wx', [[0, 1.4], [3.0, 1.4], [5.3, -1.0, 'outSine'], [30, -1.0]]).value(t), z = gbTrack('wz', [[0, -1.2], [3.0, -1.2], [5.3, -1.72, 'outSine'], [30, -1.72]]).value(t);
    W.place(x, 0, z, -2.1);
    const P = gbEvalTrack(GB_WAITER_POSES, GB_POSES, t);
    const walking = MathX.window(t, 2.9, 5.35, 0.2, 0.35);
    if (walking > 0) { const c = gbCycle((t - 2.9) * 0.95, 'walk'); for (const k of ['LHipX', 'RHipX', 'LKnX', 'RKnX', 'LAnX', 'RAnX', 'rootY', 'pelY']) P[k] = (P[k] || 0) * (1 - walking) + c[k] * walking; }
    P.spX += gbSpring(t, GB.g + 0.1, 6, 2.2, 4);
    const eff = MathX.smooth(t, 6.4, 7.0);
    for (const k of ['LShX', 'RShX', 'LElX', 'RElX']) P[k] += eff * 1.3 * Math.sin(t * 47 + k.length * 3);
    W.applyPose(P);
    // the tray: in front of her chest, held by both hands (IK)
    W.root.updateMatrixWorld(true);
    const ch = W.J.ch;
    const tp = v[0].set(0, -0.06 - 0.06 * eff, 0.36).applyMatrix4(ch.matrixWorld);
    const fq = new THREE.Quaternion(); W.root.getWorldQuaternion(fq);
    this.tray.position.copy(tp); this.tray.quaternion.copy(fq);
    const tilt = -0.09 * eff + 0.025 * Math.sin(t * 13) * eff + gbSpring(t, GB.g + 0.12, 0.08, 3.5, 4);
    this.tray.rotateX(tilt * 0.4); this.tray.rotateZ(tilt);
    this.tray.updateMatrixWorld(true);
    const hl = v[1].set(0.17, -0.03, -0.02).applyMatrix4(this.tray.matrixWorld), hr = v[2].set(-0.17, -0.03, -0.02).applyMatrix4(this.tray.matrixWorld);
    W.solveArm('L', hl, new THREE.Vector3(0.6, -1, -0.3).normalize(), 1);
    W.solveArm('R', hr, new THREE.Vector3(-0.6, -1, -0.3).normalize(), 1);
    W.J.LWr.rotation.set(-1.2, 0.3, 0.6); W.J.RWr.rotation.set(-1.2, -0.3, -0.6);
    const slide = Ease.inQuad(MathX.ramp(t, GB.waiter + 0.05, GB.waiter + 0.5));
    return { eff, slide };
  }

  _cupBLocal(slide, out) { return out.set(0.06 - 0.19 * slide, 0.006, 0.07); }

  updateWaiter(t) {
    const W = this.waiter, v = this.tmp, tOff = GB.waiter + 0.5;
    // where cup B leaves the tray (pose the scene at tOff first, so this stays a pure function of t)
    const R = this._poseWaiter(tOff);
    const p0 = this._cupBLocal(R.slide, new THREE.Vector3()).applyMatrix4(this.tray.matrixWorld);
    const { eff, slide } = this._poseWaiter(t);
    const F = gbEvalTrack(GB_WAITER_FACES, GB_FACES, t);
    F.blink = [2.2, 8.1, 12.5, 18.6].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
    W.applyFace(F, { x: eff * 0.2, y: -0.3 * eff });
    // cup B slides to the tray's edge and falls (free fall in 2 g) → shards + puddle
    const fallT = Math.sqrt(2 * Math.max(0.05, p0.y - 0.04) / 19.62), tSm = tOff + fallT;
    this.smashT = tSm;
    if (t < tOff) {
      this.trayCupB.position.copy(this._cupBLocal(slide, v[3])).applyMatrix4(this.tray.matrixWorld);
      this.trayCupB.quaternion.copy(this.tray.quaternion);
      this.trayCupB.rotateZ(-0.6 * slide * slide);
      this.trayCupB.visible = true;
    } else {
      const u = t - tOff, y = p0.y - 0.5 * 19.62 * u * u;
      this.trayCupB.visible = u < fallT;
      this.trayCupB.position.set(p0.x - 0.3 * u, Math.max(0.04, y), p0.z + 0.12 * u);
      this.trayCupB.rotation.set(u * 7, 0.4, -0.6 - u * 9);
    }
    const ps = new THREE.Vector3(p0.x - 0.3 * fallT, 0, p0.z + 0.12 * fallT);
    this.smashP = ps;
    for (let i = 0; i < this.shards.length; i++) {
      const sh = this.shards[i], u = t - tSm;
      if (u < 0) { sh.visible = false; continue; }
      sh.visible = true;
      const a = hash1(i * 5) * Math.PI * 2, d = (0.12 + 0.35 * hash1(i * 9)) * (1 - Math.exp(-u * 7));
      sh.position.set(ps.x + Math.cos(a) * d, 0.012 + Math.max(0, 0.1 * Math.sin(Math.min(u * 14, Math.PI)) * hash1(i * 4)), ps.z + Math.sin(a) * d);
      sh.rotation.set(hash1(i) * 6 + u * 5 * Math.exp(-u * 3), hash1(i * 2) * 6, 0);
    }
    const pk = MathX.smooth(t, tSm, tSm + 0.4);
    this.puddle.visible = pk > 0.01; this.puddle.position.set(ps.x, 0.003, ps.z); this.puddle.scale.set(0.2 * pk + 0.001, 0.14 * pk + 0.001, 1);
    // cup A rattles on the tray
    this.trayCupA.position.x = -0.07 + 0.004 * Math.sin(t * 31) * eff;
  }

  // ------------------------------------------------------------------------------------------ plaza
  updatePlaza(t, show) {
    for (const p of [this.vendor, this.jogger, this.sitter]) p.root.visible = show;
    for (const b of this.balloons) { b.g.visible = show; b.str.visible = show; }
    for (const pg of this.pigeons) pg.g.visible = show;
    if (!show) return;
    const after = MathX.smooth(t, GB.g, GB.g + 0.3);
    // vendor: holds the bunch high; in 2 g his arm sags; at the release his grip fails and he looks up
    const V = this.vendor;
    V.place(1.4, 0, -9.2, 0.15);
    const VP = gbEvalTrack([[0, 'vendorHold', 0.01], [GB.g, 'vendorSag', 0.35, 'outQuad'], [GB.release, 'vendorLookUp', 0.5, 'outBack']], GB_POSES, t);
    VP.RShX += gbSpring(t, GB.release, 14, 2.4, 4); VP.chX = (VP.chX || 0) + Math.sin(t * 1.6) * 1.2;
    V.applyPose(VP);
    V.applyFace(gbEvalTrack([[0, 'content', 0.01], [GB.g, 'strain', 0.3], [GB.release, 'surprise', 0.15], [GB.release + 0.8, 'awe', 0.4]], GB_FACES, t), { x: 0, y: t > GB.release ? 0.9 : 0.1 });
    const hand = V.worldOf('RWr', new THREE.Vector3()); hand.y -= 0.05;
    // balloons: bob when held (pulling harder in 2 g: strings taut), then rise faster than they ever did
    for (const B of this.balloons) {
      const k = B.i, u = t - GB.release - 0.04 * k;
      const bob = new THREE.Vector3(Math.sin(t * 1.1 + k) * 0.06 * (1 - 0.6 * after), Math.sin(t * 1.4 + k * 2) * 0.04 * (1 - 0.7 * after), Math.cos(t * 0.9 + k) * 0.06 * (1 - 0.6 * after));
      const held = new THREE.Vector3(hand.x + B.off[0] * (1 - 0.25 * after), hand.y + B.off[1] + 0.12 * after, hand.z + B.off[2] * (1 - 0.25 * after)).add(bob);
      let p = held;
      if (u > 0) {
        // buoyancy − weight doubled; drag the same → about √2 faster climb (plus a quick start)
        // (party balloon ≈ 1.6 m/s at 1 g → ≈ 2.3 m/s at 2 g); the morning breeze carries them out over the plaza
        const vUp = 1.6 * 1.414, rise = vUp * u - (vUp / 1.6) * (1 - Math.exp(-1.6 * u)) * 0.6;
        p = held.clone().add(new THREE.Vector3(Math.sin(u * 0.8 + k) * 0.5 * u * 0.4 - 0.2 * u, rise, Math.cos(u * 0.7 + k * 2) * 0.3 * u * 0.4 - 0.85 * u));
      }
      B.g.position.copy(p); B.g.rotation.set(Math.sin(t * 2 + k) * 0.1, k, Math.cos(t * 1.7 + k) * 0.12);
      // string: from the knot down to the hand (held) or trailing (free)
      const pos = B.str.geometry.attributes.position;
      for (let j = 0; j < 9; j++) {
        const s = j / 8;
        let q;
        if (u <= 0) q = new THREE.Vector3().lerpVectors(new THREE.Vector3(p.x, p.y - 0.26, p.z), hand, s);
        else { q = new THREE.Vector3(p.x, p.y - 0.26 - s * 1.5, p.z); q.x += Math.sin(s * 3 + t * 3 + k) * 0.08 * s; }
        pos.setXYZ(j, q.x, q.y, q.z);
      }
      pos.needsUpdate = true;
    }
    // jogger: jogs across (S1), drops to her knees when gravity doubles
    const J = this.jogger;
    const jx = gbTrack('jx', [[0, -9.8], [GB.g, -1.6, 'linear'], [30, -1.6]]).value(t), jz = gbTrack('jz', [[0, -7.6], [GB.g, -9.6, 'linear'], [30, -9.6]]).value(t);
    J.place(jx, 0, jz, Math.atan2(8.2, -2.0));
    let JP = gbEvalTrack([[0, 'stand', 0.01], [GB.g, 'jogKneel', 0.45, 'outQuad']], GB_POSES, t);
    if (t < GB.g + 0.3) { const c = gbCycle(t * 1.45, 'jog'), w = 1 - MathX.smooth(t, GB.g, GB.g + 0.3); for (const k of Object.keys(c)) JP[k] = (JP[k] || 0) * (1 - w) + c[k] * w; }
    JP.chX += Math.sin(t * Math.PI * 2 * 0.6) * 3 * after;
    J.applyPose(JP);
    J.applyFace(gbEvalTrack([[0, 'neutral', 0.01], [GB.g, 'exhausted', 0.3]], GB_FACES, t), { x: 0, y: -0.4 });
    // the man on the bench: reading posture → slumped
    const Sx = this.sitter;
    Sx.place(5.5, 0.0, -11.35, -Math.PI / 2 + 0.35 + Math.PI);
    const SP = gbEvalTrack([[0, 'sit', 0.01], [GB.g, 'benchSlump', 0.4, 'outQuad']], GB_POSES, t);
    SP.rootY = -0.37 + (SP.rootY + 0.36) * 0.5;
    Sx.applyPose(SP);
    Sx.applyFace(gbEvalTrack([[0, 'content', 0.01], [GB.g, 'exhausted', 0.4]], GB_FACES, t), { x: 0.3, y: -0.2 });
    // pigeons: pecking before; afterwards most sit flattened, two labour across low and sink
    for (const P of this.pigeons) {
      const i = P.i, fly = i < 2 && t > GB.wide - 1;
      if (!fly) {
        const px = -1.5 + i * 0.8 + Math.sin(i * 3) * 0.6, pz = -8.0 - (i % 3) * 0.7;
        const peck = t < GB.g ? Math.max(0, Math.sin(t * 5 + i * 2)) : 0;
        P.g.position.set(px, 0.09 - 0.03 * after, pz); P.g.rotation.set(0.5 * peck + 0.15 * after, i * 1.3, 0); P.g.scale.set(1 + 0.12 * after, 1 - 0.18 * after, 1);
        P.wl.rotation.z = 0.05; P.wr.rotation.z = -0.05;
      } else {
        const u = t - (GB.wide - 1) - i * 0.6;
        const x0 = -6 + i * 2, y = 2.6 + i * 0.6 - 0.22 * u - 0.05 * u * u;
        P.g.position.set(x0 + 1.8 * u, Math.max(0.3, y) + 0.06 * Math.sin(t * 30), -9.5 - i * 1.5);
        P.g.rotation.set(0.2, Math.PI / 2, 0); P.g.scale.set(1, 1, 1);
        const fl = Math.sin(t * 34 + i) * 1.1;
        P.wl.rotation.z = fl; P.wr.rotation.z = -fl;
      }
    }
  }

  update(t, opts) {
    this.updateHero(t, opts);
    this.updateWaiter(t);
    this.updatePlaza(t, opts.outside);
  }
}
