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
  [GB.sip[0] - 0.2, 'sitSip', 0.55],
  [GB.sip[1] - 0.1, 'sitRelax', 0.6],
  [GB.lift - 0.05, 'sitSip', 0.5],
  [GB.g, 'sitCollapse', 0.26, 'outQuad'],      // impact: the weight lands
  [GB.g + 1.15, 'sitStrain', 1.0, 'inOutCubic'],  // he tries to sit up…
  [GB.g + 2.35, 'sitHeavy', 0.7, 'inOutSine'],    // …and sags back
  [GB.room + 1.4, 'sitLookUp', 0.7],           // looks up at the bouncing lamp
  [GB.close - 0.6, 'sitHeavy', 0.5],
  // the struggle: brace → anticipation → pull (attempt 1) → it drops back → lean in, two hands → head down to meet it → back
  [GB.try[0], 'sitBrace', 0.45],
  [GB.a1[0] - 0.22, 'sitBraceDip', 0.2],
  [GB.a1[0], 'sitLift1', 0.55, 'outQuad'],
  [GB.a1[1], 'sitFail', 0.22, 'outQuad'],
  [GB.a2[0] - 0.3, 'sitLean', 0.7, 'inOutCubic'],
  [GB.a2[0] + 1.25, 'sitLeanSip', 0.5],
  [GB.a2[0] + 2.0, 'sitLean', 0.4],
  [GB.a2[1] - 0.05, 'sitHeavy', 0.45],
  [GB.push - 0.05, 'sitStare', 0.4],
];
const GB_HERO_FACES = [
  [0, 'content', 0.01],
  [GB.sip[0] + 0.05, 'sip', 0.25], [GB.sip[1] - 0.05, 'content', 0.35],
  [GB.lift, 'neutral', 0.3],
  [GB.g + 0.02, 'surprise', 0.07, 'outQuad'],
  [GB.g + 0.65, 'shock', 0.35],
  [GB.g + 1.2, 'strain', 0.35],
  [GB.g + 2.35, 'worried', 0.4],
  [GB.room + 1.4, 'awe', 0.4],
  [GB.close - 0.6, 'worried', 0.4],
  [GB.try[0], 'brace', 0.3],
  [GB.a1[0], 'strain', 0.3], [GB.a1[0] + 0.55, 'strainHard', 0.5],
  [GB.a1[1], 'exhausted', 0.2],
  [GB.a2[0] - 0.25, 'brace', 0.4],
  [GB.a2[0] + 0.4, 'strain', 0.4],
  [GB.a2[0] + 1.35, 'sip', 0.25],
  [GB.a2[0] + 2.0, 'relief', 0.35],
  [GB.push - 0.05, 'worried', 0.4],
];
const GB_HERO_BLINKS = [2.2, GB.g + 2.6, GB.close + 0.15, GB.a1[1] + 0.55, GB.a2[1] + 0.05];
// pupils: [t, x, y] (−1…1; x + = his left)
const GB_HERO_LOOK = [[0, 0.55, -0.1], [GB.sip[0] - 0.1, 0.0, -0.4], [GB.sip[1], 0.6, 0.0], [GB.lift, 0.1, -0.5], [GB.g + 0.05, 0.0, -0.75], [GB.g + 0.7, -0.2, -0.3],
  [GB.g + 1.4, 0.0, -0.6], [GB.room + 0.3, -0.5, 0.1], [GB.room + 1.45, 0.0, 0.95], [GB.close - 0.6, -0.4, -0.3], [GB.try[0], 0.1, -0.8], [GB.a2[0] + 1.3, 0.0, -0.5],
  [GB.a2[0] + 2.0, 0.0, -0.2], [GB.push, 0.0, 0.0]];

const GB_WAITER_POSES = [[0, 'tray', 0.01], [GB.g + 0.12, 'trayBuckle', 0.34, 'outQuad'], [GB.g + 0.95, 'trayKneel', 0.9, 'inOutCubic']];
const GB_TOFF = GB.waiter + 0.75;   // V3: the cup goes over the tray's edge (scene time)

// V3: where the wrist sits (in the cup's local frame) when the fingers are through the handle — tuned in close-up stills
const GB_GRIP_WRIST = new THREE.Vector3(-0.095, 0.04, 0.092);

// V4: balloon climb height (m) u seconds after release at g (in g units). Terminal speed 1.6 m/s at 1 g, ×√g;
// time constant τ = v/a with the net acceleration ∝ g → τ = 0.5 s / √g.
function gbBalloonRise(u, gg) { const v = 1.6 * Math.sqrt(gg), tau = 0.5 / Math.sqrt(gg); return v * (u - tau * (1 - Math.exp(-u / tau))); }

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
    const china = gbMat('#cbc1b2', { rough: 0.62, name: 'gbChina', env: 0.3 });
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
    for (let i = 0; i < 16; i++) {
      const r = 0.012 + 0.016 * hash1(i * 3), geo = new THREE.TetrahedronGeometry(r); geo.scale(1, 0.35 + 0.3 * hash1(i * 13), 1.3);
      this.shards.push(gbAdd(S, geo, china, 0, -5, 0, { cast: true }));
    }
    // V3: the handle snaps off whole (a recognisable piece), the base stays as a ring
    this.shardHandle = gbAdd(S, new THREE.TorusGeometry(0.022, 0.0065, 8, 18, Math.PI * 1.25), china, 0, -5, 0);
    this.shardBase = gbAdd(S, gbLathe([[0.025, 0.0], [0.034, 0.0], [0.04, 0.006], [0.043, 0.03], [0.038, 0.012], [0.025, 0.012]], 24), china, 0, -5, 0);
    // coffee drops on the floor (instanced) and the contact shadow under the falling cup
    this.fdrops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), gbMat('#4a2a18', { rough: 0.2, env: 1.0 }), 40);
    this.fdrops.frustumCulled = false; S.add(this.fdrops);
    const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d');
    const gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
    this.blobM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, opacity: 0 });
    this.blob = gbAdd(S, new THREE.PlaneGeometry(1, 1), this.blobM, 0, 0.004, 0, { rx: -Math.PI / 2, cast: false, receive: false });
    // the strobe trail (where the cup was every 1/20 s of its fall) and the 1 g ghost beside it
    this.trailM = gbMat('#e9dccb', { rough: 0.6, transparent: true, opacity: 0.3, depthWrite: false, name: 'gbTrail' });
    this.trail = []; for (let i = 0; i < 9; i++) { const c = this._cup(this.trailM, this.trailM); c.traverse((o) => { o.castShadow = false; o.renderOrder = 5; }); c.visible = false; S.add(c); this.trail.push(c); }
    
    this.puddle = gbAdd(S, new THREE.CircleGeometry(1, 24), gbMat('#3a2014', { rough: 0.35, env: 0.35 }), 0, 0.002, 0, { rx: -Math.PI / 2, cast: false });
  }

  _balloons() {
    // V3: teardrop balloons (lathe) with a tied knot and a soft sheen; strings are 16-point curves
    const S = this.app.scene, cols = ['#e2614f', '#f0b54a', '#4fa3a5', '#f4e6cf', '#d9708f', '#6f7fd6', '#ef8a3c'];
    const prof = []; for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI; const r = Math.sin(a) * (1 - 0.32 * Math.pow(Math.max(0, Math.cos(a)), 1) * 0) * (0.86 + 0.14 * Math.sin(a)); prof.push([Math.max(0.0001, r * (i > 12 ? 1 - 0.55 * ((i - 12) / 6) ** 1.3 : 1)), -Math.cos(a)]); }
    prof.reverse();
    const geo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);
    geo.scale(0.2, 0.25, 0.2);
    this.balloons = cols.map((c, i) => {
      const g = new THREE.Group(); S.add(g);
      gbAdd(g, geo, gbMat(c, { rough: 0.28, rim: 0.6, env: 0.9, name: 'gbBalloon' }), 0, 0, 0);
      gbAdd(g, new THREE.CylinderGeometry(0.012, 0.028, 0.035, 10), gbMat(c, { rough: 0.5 }), 0, -0.262, 0);
      gbAdd(g, new THREE.TorusGeometry(0.014, 0.006, 6, 12), gbMat(c, { rough: 0.5 }), 0, -0.285, 0, { rx: Math.PI / 2 });
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3));
      const str = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: '#efe6d6', transparent: true, opacity: 0.8 })); str.frustumCulled = false; S.add(str);
      return { g, str, i, off: [Math.cos(i * 2.4) * 0.3 * (i ? 1 : 0), 1.5 + 0.22 * hash1(i * 7), Math.sin(i * 2.4) * 0.3 * (i ? 1 : 0)] };
    });
    // V4: the 1 g ghost balloon (same shape as the lead balloon, faint) and the height scale
    this.ghostBalloonM = gbMat('#f0a090', { rough: 0.5, transparent: true, opacity: 0, emissive: '#e2614f', emi: 0.25, depthWrite: false, name: 'gbGhostBalloon' });
    { const g = new THREE.Group(); S.add(g); gbAdd(g, geo, this.ghostBalloonM, 0, 0, 0, { cast: false });
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3));
      const str = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: '#fff2dc', transparent: true, opacity: 0 })); str.frustumCulled = false; S.add(str);
      g.visible = false; str.visible = false; this.ghostBalloon = { g, str }; }
    { const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 12.2, 0)];
      for (let m = 2; m <= 12; m += 2) { const w = m % 4 ? 0.12 : 0.22; pts.push(new THREE.Vector3(-w, m, 0), new THREE.Vector3(w, m, 0)); }
      this.rulerM = new THREE.LineBasicMaterial({ color: '#fff6e8', transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false });
      this.ruler = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), this.rulerM); this.ruler.frustumCulled = false; this.ruler.visible = false; this.ruler.renderOrder = 8; S.add(this.ruler); }
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
    return out.set(0, -0.066, 0.165).applyMatrix4(hc.matrixWorld);
  }

  // the cup's world position and tilt (rad toward his mouth) at t; held = the right hand is on it
  cupState(t, restP, mouthP) {
    const out = { p: new THREE.Vector3().copy(restP), tilt: 0, held: 0, slosh: 0, clasp: -1 };
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
    // the struggle (close-up). Attempt 1: anticipation dip, a slow 3 cm lift with a growing tremble, then it drops
    // back (free fall in 2 g, a clink, slosh). Attempt 2: both hands; the cup rises to his lowered mouth, a sip, set down.
    const T = GB.try, A1 = GB.a1, A2 = GB.a2;
    if (t >= GB.reach[0] && t < T[1] + 0.4) {
      // V3: the hand travels to the handle (reach), the fingers close (grip) BEFORE the cup moves; it lets go after the set-down
      out.held = Ease.inOutSine(MathX.ramp(t, GB.reach[0], GB.reach[1])) * (1 - Ease.inOutSine(MathX.ramp(t, A2[1] + 0.16, T[1] + 0.2)));
      out.clasp = MathX.smooth(t, GB.grip, GB.grip + 0.18) * (1 - MathX.smooth(t, A2[1] + 0.02, A2[1] + 0.16));
      const tr = (amp) => amp * (0.55 * Math.sin(t * 57) + 0.45 * Math.sin(t * 83 + 1));
      if (t >= A1[0] - 0.3 && t < A2[0]) {
        // it sticks for a beat (the pull builds, the saucer rattles), then breaks free 5 cm, trembling
        const h1 = 0.05 * Ease.inOutSine(MathX.ramp(t, A1[0] + 0.22, A1[1] - 0.15)), grow = MathX.ramp(t, A1[0], A1[1]);
        let y = h1;
        if (t >= A1[1]) { const u = t - A1[1], hTop = 0.05, tf = Math.sqrt(2 * hTop / 19.62); y = u < tf ? hTop - 0.5 * 19.62 * u * u : Math.abs(Math.sin((u - tf) * 40)) * 0.004 * Math.exp(-(u - tf) * 14); }
        out.p.y = restP.y + Math.max(0, y + (t < A1[1] && y > 0.003 ? tr(0.002 + 0.004 * grow) : 0));
        out.p.x += t < A1[1] ? tr(0.0025 * grow) : 0;
        if (t >= A1[0] && t < A1[0] + 0.24) out.p.y += 0.0008 * Math.max(0, Math.sin(t * 90));
        out.tilt = t < A1[1] ? 0.05 * Math.sin(t * 9) * grow : 0;
        out.slosh = t < A1[1] ? 0.5 * Math.sin(t * 9) * grow : Math.exp(-(t - A1[1]) * 3) * Math.sin((t - A1[1]) * 15);
      }
      if (t >= A2[0]) {
        const up = Ease.inOutSine(MathX.ramp(t, A2[0] + 0.1, A2[0] + 1.3)), down = Ease.inOutQuad(MathX.ramp(t, A2[0] + 2.05, A2[1] - 0.05));
        const k = up * (1 - down);
        lerpP(restP, sipP, k);
        out.p.y += tr(0.0035) * k; out.p.x += tr(0.002) * k;
        out.tilt = 0.6 * MathX.smooth(t, A2[0] + 1.3, A2[0] + 1.6) * (1 - MathX.smooth(t, A2[0] + 1.85, A2[0] + 2.1));
        out.slosh = 0.4 * Math.sin(t * 9) * k + (t > A2[1] ? Math.exp(-(t - A2[1]) * 3) * Math.sin((t - A2[1]) * 15) * 0.5 : 0);
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
    const eff = MathX.window(t, GB.g + 1.15, GB.g + 2.35, 0.3, 0.3) + MathX.window(t, GB.a1[0] + 0.1, GB.a1[1], 0.3, 0.1) + 0.8 * MathX.window(t, GB.a2[0] + 0.1, GB.a2[1] - 0.2, 0.3, 0.3);
    for (const k of ['RShX', 'RElX', 'LShX', 'spX', 'hdZ']) P[k] = (P[k] || 0) + eff * (1.2 * Math.sin(t * 53 + k.length) + 0.8 * Math.sin(t * 71 + k.length * 2));
    // V3 acting: the reach leans him in; the pull hunches the right shoulder; after the failed lift a small frustrated
    // head shake; after the sip the shoulders drop on the exhale (relief)
    const rch = MathX.window(t, GB.reach[0], GB.a1[0] + 0.1, 0.35, 0.3);
    P.chX = (P.chX || 0) + 4 * rch; P.hdX = (P.hdX || 0) + 3 * rch;
    P.RShrug = (P.RShrug || 0) + 0.02 * MathX.window(t, GB.a1[0], GB.a1[1], 0.3, 0.12) + 0.012 * MathX.window(t, GB.a2[0], GB.a2[1] - 0.3, 0.3, 0.3);
    P.LShrug = (P.LShrug || 0) + 0.008 * MathX.window(t, GB.a1[0], GB.a1[1], 0.3, 0.12);
    P.hdY = (P.hdY || 0) + 7 * Math.sin(Math.PI * 2 * 2.1 * (t - GB.a1[1] - 0.4)) * MathX.window(t, GB.a1[1] + 0.4, GB.a1[1] + 1.15, 0.12, 0.25);
    const rel = MathX.window(t, GB.a2[1] + 0.02, GB.push + 0.2, 0.3, 0.3);
    P.LShrug -= 0.016 * rel; P.RShrug -= 0.016 * rel; P.chX -= 3 * rel; P.hdX += 4 * rel;
    // V4 whole-body effort: as the cup breaks free he leans back against it (counterweight) and the bracing arm pushes
    // down (left shoulder rises); when it slips the sudden load jerks his torso and head forward; on attempt 2 he
    // leans in to meet the cup halfway and the effort tremble moves into the shoulders
    const pull = MathX.window(t, GB.a1[0] + 0.15, GB.a1[1], 0.35, 0.08);
    P.chX -= 6 * pull; P.spX = (P.spX || 0) - 3 * pull; P.LShrug += 0.012 * pull; P.hdZ = (P.hdZ || 0) + 4 * pull;
    P.chX += gbSpring(t, GB.a1[1] + 0.03, 5, 2.6, 5); P.hdX += gbSpring(t, GB.a1[1] + 0.05, 7, 2.4, 4.5);
    P.RShrug -= 0.01 * MathX.window(t, GB.a1[1], GB.a1[1] + 0.5, 0.05, 0.3);
    const lift2 = MathX.window(t, GB.a2[0] + 0.1, GB.a2[0] + 1.3, 0.3, 0.2);
    P.LShrug += 0.01 * lift2; P.RShrug += 0.006 * lift2 * Math.sin(t * 61);
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
    // V3 grip: the wrist target and the hand's orientation come from the cup's own frame, so the fingers meet the
    // handle exactly (palm facing the cup, fingers through the handle, index on top) and stay on it while it moves.
    this.cup.updateMatrixWorld(true);
    const cq = this.cup.getWorldQuaternion(new THREE.Quaternion());
    const gripW = v[3].copy(GB_GRIP_WRIST).applyMatrix4(this.cup.matrixWorld);
    const Fg = new THREE.Vector3(1, 0, 0).applyQuaternion(cq), Ng = new THREE.Vector3(0, 0, -1).applyQuaternion(cq);
    const hdir = new THREE.Vector3(0, 0, 1).applyQuaternion(cq);
    const restR = new THREE.Vector3(tx - 0.3, GB_SET.tableH + 0.05, tz + 0.2);
    // the reach: an arc (up and round, from the outside of the handle), slowing into contact
    const w = C.held;
    const pre = gripW.clone().addScaledVector(hdir, 0.05).add(new THREE.Vector3(0, 0.035, 0));
    let wristT;
    if (w < 0.72) { const k = w / 0.72, mid = restR.clone().lerp(pre, 0.5).add(new THREE.Vector3(0, 0.08, 0));
      wristT = new THREE.Vector3().copy(restR).multiplyScalar((1 - k) * (1 - k)).addScaledVector(mid, 2 * k * (1 - k)).addScaledVector(pre, k * k); }
    else wristT = pre.clone().lerp(gripW, Ease.outCubic((w - 0.72) / 0.28));
    const Lrest = new THREE.Vector3(tx - 0.2, GB_SET.tableH + 0.045, tz - 0.18);
    // left hand: rest → brace (palm pressed flat beside the saucer) → support (against the cup's far side, both hands)
    const wB = MathX.smooth(t, GB.try[0], GB.try[0] + 0.35) * (1 - MathX.smooth(t, GB.a2[0] - 0.35, GB.a2[0] - 0.05));
    const wS = MathX.smooth(t, GB.a2[0] - 0.3, GB.a2[0] + 0.05) * (1 - MathX.smooth(t, GB.a2[1] - 0.1, GB.a2[1] + 0.25));
    // brace: palm flat on the table, fingers forward (+X); wrist = contact − 5 cm along the fingers, just above the top
    const FB = new THREE.Vector3(1, 0, -0.25).normalize(), NB = new THREE.Vector3(0, -1, 0);
    const Lb = new THREE.Vector3(tx - 0.22, GB_SET.tableH + 0.03 - 0.004 * MathX.window(t, GB.a1[0], GB.a1[1], 0.2, 0.1), tz - 0.05).addScaledVector(FB, -0.05);
    // support: palm against the cup's far side (−Z), fingers forward and up round it
    const FS = new THREE.Vector3(0.75, 0.35, 0.3).normalize(), NS = new THREE.Vector3(0.1, 0, 1).normalize();
    const Ls = new THREE.Vector3().copy(C.p).add(new THREE.Vector3(0, 0.045, -0.058)).addScaledVector(FS, -0.05).addScaledVector(NS, -0.012);
    const Lw = Lrest.clone().lerp(Lb, wB).lerp(Ls, wS);
    // the right arm: IK to the wrist target (elbow down and out)
    H.solveArm('R', wristT, new THREE.Vector3(-0.35, -1, 0.45).normalize(), opts.seated ? 1 : 0);
    H.solveArm('L', Lw, new THREE.Vector3(0.2, -1, -0.8 + 0.6 * wB).normalize(), opts.seated ? 0.85 + 0.15 * Math.max(wB, wS) : 0);
    // fingers: relaxed at rest, OPEN on the way in, closing round the handle at contact (before the cup moves)
    const open = MathX.smooth(w, 0.05, 0.4), clasp = C.clasp >= 0 ? C.clasp : MathX.smooth(w, 0.88, 1.0);
    const curl = MathX.lerp(MathX.lerp(0.35, 0.04, open), 0.62, clasp), thumb = MathX.lerp(MathX.lerp(0.3, 0.05, open), 0.6, clasp);
    H.handR.fingers.forEach(([f1, f2], i) => { const k = curl * (1 + i * 0.06); f1.rotation.z = -H.handR.pn * k * 1.45; f2.rotation.z = -H.handR.pn * k * 1.5; });
    H.handR.t1.rotation.set(0.2, 0, -H.handR.pn * (0.35 + thumb * 0.6)); H.handR.t2.rotation.z = -H.handR.pn * thumb * 0.9;
    H.J.RWr.rotation.set(0.15, 0, 0.2);
    H.orientHand('R', Fg, Ng, MathX.smooth(w, 0.25, 0.9));
    H.J.LWr.rotation.set(0.25, -0.2, -0.15);
    if (wB > 0.001) H.orientHand('L', FB, NB, wB);
    if (wS > 0.001) H.orientHand('L', FS, NS, wS);
    H.handL.fingers.forEach(([f1, f2], i) => { const k = (0.35 - 0.3 * wB + 0.15 * wS) * (1 + i * 0.06); f1.rotation.z = -H.handL.pn * k * 1.45; f2.rotation.z = -H.handL.pn * k * 1.5; });
    // face
    const F = gbEvalTrack(GB_HERO_FACES, GB_FACES, t);
    F.blink = GB_HERO_BLINKS.reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
    F.glassesDrop = -0.007 * gbSettle(t, GB.g + 0.03, 0.35, 0.4, 3);
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
    return C;
  }

  // ------------------------------------------------------------------------------------------ waiter
  // V3: she has been kneeling under the doubled weight since the drop, the tray held in front of her. At GB.waiter
  // her arms start to give: the tremble grows, the tray tips, a cup slides to the edge and goes over (GB_TOFF).
  // She over-corrects, the tray swings back level, her head and eyes follow the cup down; at the smash she winces.
  // All times here are SCENE times (S5b runs on gbScene(t): slow motion around the fall).
  _poseWaiter(t) {
    const W = this.waiter, v = this.tmp, tOff = GB_TOFF;
    // walks in with the tray, stops beside the next table, facing him (−X)
    const x = gbTrack('wx', [[0, 0.6], [0.2, 0.6], [2.6, -1.0, 'outSine'], [30, -1.0]]).value(t), z = gbTrack('wz', [[0, -1.4], [0.2, -1.4], [2.6, -1.72, 'outSine'], [30, -1.72]]).value(t);
    W.place(x, 0, z, -2.1);
    const P = gbEvalTrack(GB_WAITER_POSES, GB_POSES, t);
    const walking = MathX.window(t, 0.1, 2.65, 0.2, 0.35);
    if (walking > 0) { const c = gbCycle((t - 0.1) * 0.95, 'walk'); for (const k of ['LHipX', 'RHipX', 'LKnX', 'RKnX', 'LAnX', 'RAnX', 'rootY', 'pelY']) P[k] = (P[k] || 0) * (1 - walking) + c[k] * walking; }
    P.spX += gbSpring(t, GB.g + 0.1, 6, 2.2, 4);
    // V3: she fights her way up from the kneel to set the tray on the table (half-standing) — and at the top her arms give;
    // after the smash she sinks back down
    const tSm0 = this._smashScene || tOff + 0.3;
    const rise = Ease.inOutCubic(MathX.ramp(t, GB.waiter - 0.4, GB.waiter + 0.5)) * (1 - Ease.inOutSine(MathX.ramp(t, tSm0 + 0.25, tSm0 + 1.1)));
    if (rise > 0) { const B = GB_POSES.trayBuckle; for (const k of new Set([...Object.keys(P), ...Object.keys(B)])) P[k] = (P[k] || 0) * (1 - rise) + (B[k] || 0) * rise; }
    const eff = MathX.smooth(t, GB.g + 0.8, GB.g + 1.4);
    const give = Ease.inQuad(MathX.ramp(t, GB.waiter, tOff));                 // her arms giving way
    const tSm = this._smashScene || tOff + 0.3;
    const follow = Ease.inOutSine(MathX.ramp(t, tOff, tSm + 0.1));            // head + eyes follow the cup down
    const wince = MathX.window(t, tSm, tSm + 0.9, 0.06, 0.5);
    const trem = eff * (1 + 2.2 * give * (1 - MathX.smooth(t, tOff + 0.3, tOff + 0.9)));
    P.spX += 6 * give + 8 * follow; P.chX = (P.chX || 0) + 5 * follow; P.hdX = (P.hdX || 0) + 18 * follow - 6 * wince; P.hdY = (P.hdY || 0) + 12 * wince;
    P.LShrug = (P.LShrug || 0) + 0.015 * give; P.RShrug = (P.RShrug || 0) + 0.015 * give;
    for (const k of ['LShX', 'RShX', 'LElX', 'RElX']) P[k] += trem * 1.3 * Math.sin(t * 47 + k.length * 3);
    W.applyPose(P);
    // the tray: in front of her chest, held by both hands (IK). It sinks and tips as her arms give, then she catches it
    W.root.updateMatrixWorld(true);
    const ch = W.J.ch;
    const tp = v[0].set(0, -0.06 - 0.06 * eff * (1 - rise) - 0.03 * give + 0.03 * MathX.smooth(t, tOff, tOff + 0.4), 0.36).applyMatrix4(ch.matrixWorld);
    const fq = new THREE.Quaternion(); W.root.getWorldQuaternion(fq);
    this.tray.position.copy(tp); this.tray.quaternion.copy(fq);
    const tipK = t < tOff ? give : 1 - Ease.outBack(MathX.ramp(t, tOff + 0.02, tOff + 0.5), 2.2);
    const tilt = -0.03 * eff + 0.025 * Math.sin(t * 13) * trem * 0.5 + gbSpring(t, GB.g + 0.12, 0.08, 3.5, 4) + 0.3 * tipK;
    this.tray.rotateZ(tilt); this.tray.rotateX(0.05 * tipK);
    this.tray.updateMatrixWorld(true);
    const hl = v[1].set(0.17, -0.03, -0.02).applyMatrix4(this.tray.matrixWorld), hr = v[2].set(-0.17, -0.03, -0.02).applyMatrix4(this.tray.matrixWorld);
    W.solveArm('L', hl, new THREE.Vector3(0.6, -1, -0.3).normalize(), 1);
    W.solveArm('R', hr, new THREE.Vector3(-0.6, -1, -0.3).normalize(), 1);
    W.J.LWr.rotation.set(-1.2, 0.3, 0.6); W.J.RWr.rotation.set(-1.2, -0.3, -0.6);
    // the cup slides toward the low edge, accelerating (tray-local −X)
    const slide = Ease.inQuad(MathX.ramp(t, GB.waiter + 0.25, tOff));
    return { eff, slide, follow, wince };
  }

  _cupBLocal(slide, out) { return out.set(0.06 - 0.21 * slide, 0.006, 0.07); }

  // the falling cup at scene time ts (seconds after it leaves the tray: u), gravity g (m/s²)
  _fallP(p0, vh, u, g, out) { return out.set(p0.x + vh.x * u, p0.y - 0.5 * g * u * u, p0.z + vh.z * u); }

  updateWaiter(t) {
    const W = this.waiter, v = this.tmp, tOff = GB_TOFF;
    // where cup B leaves the tray, and how fast it is sliding (pose the scene at tOff first: a pure function of t)
    this._poseWaiter(tOff - 0.02);
    const pa = this._cupBLocal(Ease.inQuad(MathX.ramp(tOff - 0.02, GB.waiter + 0.25, tOff)), new THREE.Vector3()).applyMatrix4(this.tray.matrixWorld);
    this._poseWaiter(tOff);
    const p0 = this._cupBLocal(1, new THREE.Vector3()).applyMatrix4(this.tray.matrixWorld);
    const vh = p0.clone().sub(pa).multiplyScalar(1 / 0.02); vh.y = 0; if (vh.length() > 0.6) vh.setLength(0.6);
    const G2 = 19.62, G1 = 9.81, h = Math.max(0.05, p0.y - 0.042);
    const fallT = Math.sqrt(2 * h / G2), fallT1 = Math.sqrt(2 * h / G1), tSm = tOff + fallT;
    this._smashScene = tSm; this.smashT = gbStory(tSm); this.fallT = fallT; this.fallT1 = fallT1; this.fallH = h;
    const ps = this._fallP(p0, vh, fallT, G2, new THREE.Vector3()); ps.y = 0;
    this.smashP = ps; this.fallP0 = p0;
    const { eff, slide, follow, wince } = this._poseWaiter(t);
    const F = gbEvalTrack([[0, 'content', 0.01], [GB.g + 0.1, 'surprise', 0.1], [GB.g + 0.8, 'strain', 0.5], [GB.waiter, 'strainHard', 0.3],
      [tOff - 0.05, 'shock', 0.1], [tSm, 'strainHard', 0.06], [tSm + 0.7, 'worried', 0.5]], GB_FACES, t);
    F.blink = Math.max([1.5, 6.0, 9.5].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0), 0.85 * wince);
    W.applyFace(F, { x: eff * 0.2 - 0.15 * follow, y: -0.3 * eff - 0.6 * follow });
    // cup B: slides to the tray's edge (tipping as it goes over), then free fall in 2 g, tumbling
    const u = t - tOff, cupQ = new THREE.Quaternion();
    if (t < tOff) {
      this.trayCupB.position.copy(this._cupBLocal(slide, v[3])).applyMatrix4(this.tray.matrixWorld);
      this.trayCupB.quaternion.copy(this.tray.quaternion);
      this.trayCupB.rotateZ(0.5 * slide * slide * slide);
      this.trayCupB.visible = true;
    } else {
      this.trayCupB.visible = u < fallT;
      this._fallP(p0, vh, Math.min(u, fallT), G2, this.trayCupB.position); this.trayCupB.position.y = Math.max(0.042, this.trayCupB.position.y);
      this.trayCupB.quaternion.copy(this.tray.quaternion); this.trayCupB.rotateZ(0.5 + Math.min(u, fallT) * 5.5); this.trayCupB.rotateX(Math.min(u, fallT) * 2.2);
    }
    // the strobe trail: where the cup was every 1/20 s of its fall (the gaps grow: it is accelerating), and the 1 g
    // ghost released at the same instant beside it (it falls only half as fast). Both fade after the impact.
    const side = new THREE.Vector3(vh.z, 0, -vh.x).normalize();
    const camSide = this._fallSide || new THREE.Vector3(-0.5, 0, 0.86);
    if (side.dot(new THREE.Vector3(-camSide.z, 0, camSide.x)) < 0) side.negate();
    const g0 = p0.clone().addScaledVector(side, 0.36);
    const tf = Math.max(0, 1 - MathX.smooth(t, tSm + 0.45, tSm + 0.9));
    for (let i = 0; i < this.trail.length; i++) {
      const ti = (i + 1) * 0.06, c = this.trail[i];
      c.visible = u > ti && ti < fallT && tf > 0.01;
      if (!c.visible) continue;
      this._fallP(p0, vh, ti, G2, c.position);
      c.quaternion.copy(this.tray.quaternion); c.rotateZ(0.5 + ti * 5.5); c.rotateX(ti * 2.2);
    }
    this.trailM.opacity = 0.26 * tf;
    const gu = Math.min(u, fallT1), gv = u > 0 && tf > 0.01;
    this.ghost.visible = gv; this.ghostM.opacity = 0.42 * tf * (1 - MathX.smooth(u, fallT1 + 0.25, fallT1 + 0.6));
    if (gv) { this._fallP(g0, vh, gu, G1, this.ghost.position); this.ghost.position.y = Math.max(0.042, this.ghost.position.y);
      this.ghost.quaternion.copy(this.tray.quaternion); this.ghost.rotateZ(0.5 + gu * 3.9); this.ghost.rotateX(gu * 1.55); }
    // contact shadow: grows darker and tighter as the cup nears the floor
    const cy = this.trayCupB.visible && u > -0.6 ? this.trayCupB.position.y : -1;
    this.blob.visible = cy > 0;
    if (cy > 0) { const k = MathX.clamp(1 - cy / 1.1, 0, 1); this.blob.position.set(this.trayCupB.position.x, 0.004, this.trayCupB.position.z); this.blob.scale.setScalar(0.22 - 0.1 * k); this.blobM.opacity = 0.15 + 0.6 * k * k; }
    // the impact: shards (a few big pieces + chips) bounce in 2 g; the handle and base land intact; coffee splashes
    const ua = t - tSm, dt = 1 / 240;
    for (let i = 0; i < this.shards.length + 2; i++) {
      const sh = i < this.shards.length ? this.shards[i] : i === this.shards.length ? this.shardHandle : this.shardBase;
      if (ua < 0) { sh.visible = false; continue; }
      sh.visible = true;
      const big = i >= this.shards.length;
      const a = hash1(i * 5 + 1) * Math.PI * 2, sp = big ? 0.25 + 0.2 * hash1(i * 7) : 0.45 + 1.1 * hash1(i * 9);
      let px = 0, py = 0.03, pz = 0, vx = Math.cos(a) * sp + vh.x * 0.6, vy = big ? 0.5 + 0.3 * hash1(i) : 0.7 + 1.3 * hash1(i * 4), vz = Math.sin(a) * sp + vh.z * 0.6;
      const n = Math.min(Math.round(ua / dt), 480);
      for (let k = 0; k < n; k++) {
        vy -= G2 * dt; px += vx * dt; py += vy * dt; pz += vz * dt;
        if (py < 0.006) { py = 0.006; if (vy < -0.25) { vy = -vy * 0.32; vx *= 0.6; vz *= 0.6; } else { vy = 0; vx *= 0.93; vz *= 0.93; } }
      }
      sh.position.set(ps.x + px, py + (big ? 0.0 : 0.0), ps.z + pz);
      const spin = Math.min(ua, 0.4) * 14 * hash1(i * 3);
      if (big && i === this.shards.length) sh.rotation.set(Math.PI / 2 * Math.min(1, ua * 4), a, spin * 0.3);
      else if (big) sh.rotation.set(0.25 * Math.max(0, 1 - ua * 3) * Math.sin(ua * 30), a, 0.6 * Math.max(0, 1 - ua * 2));
      else sh.rotation.set(hash1(i) * 6 + spin, hash1(i * 2) * 6, spin * 0.5);
    }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pp = new THREE.Vector3();
    for (let i = 0; i < 40; i++) {
      const uu = ua - hash1(i * 3 + 2) * 0.03;
      const a = hash1(i * 7 + 3) * Math.PI * 2, sp = 0.3 + 1.0 * hash1(i * 11 + 1), vy = 0.6 + 1.4 * hash1(i * 13 + 5);
      const y = 0.04 + vy * uu - 0.5 * G2 * uu * uu;
      if (uu < 0 || y < 0.003) { m.makeScale(0, 0, 0); this.fdrops.setMatrixAt(i, m); continue; }
      pp.set(ps.x + Math.cos(a) * sp * uu, y, ps.z + Math.sin(a) * sp * uu);
      const r = 0.004 + 0.005 * hash1(i * 17); sc.set(r, r * 1.7, r); m.compose(pp, q, sc); this.fdrops.setMatrixAt(i, m);
    }
    this.fdrops.instanceMatrix.needsUpdate = true;
    const pk = Ease.outCubic(MathX.ramp(t, tSm + 0.02, tSm + 0.6));
    this.puddle.visible = pk > 0.01; this.puddle.position.set(ps.x + vh.x * 0.08, 0.003, ps.z + vh.z * 0.08); this.puddle.scale.set(0.22 * pk + 0.001, 0.15 * pk + 0.001, 1);
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
    const poseV = (tt) => {
      const VP = gbEvalTrack([[0, 'vendorHold', 0.01], [GB.g, 'vendorSag', 0.35, 'outQuad'], [GB.release, 'vendorLookUp', 0.5, 'outBack']], GB_POSES, tt);
      VP.RShX += gbSpring(tt, GB.release, 14, 2.4, 4); VP.chX = (VP.chX || 0) + Math.sin(tt * 1.6) * 1.2;
      VP.RFing = MathX.lerp(0.85, 0.05, MathX.smooth(tt, GB.release - 0.08, GB.release + 0.12)); VP.RThumb = MathX.lerp(0.7, 0.1, MathX.smooth(tt, GB.release - 0.08, GB.release + 0.12));
      VP.RShX -= 6 * MathX.window(tt, GB.release - 0.9, GB.release - 0.05, 0.5, 0.05);   // his arm sinks under the pull before the grip goes
      V.applyPose(VP);
      V.applyFace(gbEvalTrack([[0, 'content', 0.01], [GB.g, 'strain', 0.3], [GB.release, 'surprise', 0.15], [GB.release + 0.8, 'awe', 0.4]], GB_FACES, tt), { x: 0, y: tt > GB.release ? 0.9 : 0.1 });
    return V.worldOf('RWr', new THREE.Vector3()).add(new THREE.Vector3(0, -0.05, 0));
    };
    // V4: the balloons leave from where his hand was at the release (pose that instant first: still a pure function of t)
    const hand0 = t > GB.release ? poseV(GB.release) : null;
    const hand = poseV(t);
    // balloons (V3): held, they bob and jostle on taut strings; when gravity doubles, buoyancy doubles too and the bunch
    // jerks upward (strings snap taut). At the release the vendor's fingers open and they climb ~√2 faster than at 1 g,
    // strings trailing and swinging; the breeze carries them out over the square.
    const jerk = gbSpring(t, GB.g, 0.12, 2.6, 3.5);
    for (const B of this.balloons) {
      const k = B.i, u = t - GB.release - 0.035 * k;
      const sw = 1 - 0.55 * after;
      const heldAt = (tt, h) => {
        const af = MathX.smooth(tt, GB.g, GB.g + 0.3), w = 1 - 0.55 * af, jk = gbSpring(tt, GB.g, 0.12, 2.6, 3.5);
        return new THREE.Vector3(h.x + B.off[0] * (1 - 0.2 * af) + Math.sin(tt * 1.1 + k) * 0.07 * w + Math.sin(tt * 2.7 + k * 3) * 0.015,
          h.y + B.off[1] + 0.1 * af + Math.sin(tt * 1.4 + k * 2) * 0.035 * w + jk * (0.6 + 0.4 * hash1(k)),
          h.z + B.off[2] * (1 - 0.2 * af) + Math.cos(tt * 0.9 + k) * 0.07 * w);
      };
      let p = u <= 0 ? heldAt(t, hand) : null;
      if (u > 0) {
        // V4 physics: lift = weight of displaced air (ρ·V·g) and the balloon's weight (m·g) BOTH double, so the net
        // upward force doubles; drag (½ρCdAv²) does not change with g. Terminal climb speed ∝ √(net force) → ×√2
        // (≈1.6 m/s at 1 g → ≈2.3 m/s at 2 g), and it gets there sooner (net acceleration doubles: τ ÷ √2).
        const rise = gbBalloonRise(u, 2), start = heldAt(GB.release + 0.035 * k, hand0);
        p = start.add(new THREE.Vector3(Math.sin(u * 0.8 + k) * 0.08 * u * (k ? 1 : 0.3) + 0.06 * u, rise, Math.cos(u * 0.7 + k * 2) * 0.06 * u * (k ? 1 : 0.3) - 0.22 * u));
      }
      B.g.position.copy(p);
      // tilt with motion (rising balloons lean into the breeze) + a slow spin
      B.g.rotation.set(Math.sin(t * 2 + k) * 0.08 + (u > 0 ? -0.15 : 0), k + t * 0.3, Math.cos(t * 1.7 + k) * 0.1 + (u > 0 ? 0.12 : 0));
      const knot = new THREE.Vector3(0, -0.29, 0).applyEuler(B.g.rotation).add(p);
      const pos = B.str.geometry.attributes.position;
      for (let j = 0; j < 16; j++) {
        const s = j / 15;
        let q;
        if (u <= 0) {      // held: a nearly straight taut line with a slight bow that swings
          q = new THREE.Vector3().lerpVectors(knot, hand, s);
          const bow = Math.sin(Math.PI * s) * (0.04 * sw + 0.01);
          q.x += bow * Math.sin(t * 1.3 + k); q.z += bow * Math.cos(t * 1.1 + k);
        } else {           // free: it trails below, lagging and swinging (a travelling wave down the string)
          const L = 1.45;
          q = new THREE.Vector3(knot.x, knot.y - s * L, knot.z);
          q.x += Math.sin(s * 4 - u * 7 + k) * 0.09 * s + 0.12 * s * s; q.z += Math.cos(s * 3.5 - u * 6 + k) * 0.07 * s + 0.25 * s * s;
          q.y += 0.15 * s * s * Math.exp(-u * 1.5);
        }
        pos.setXYZ(j, q.x, q.y, q.z);
      }
      pos.needsUpdate = true;
    }
    // V4 — the experiment: a faint 1 g ghost of the lead balloon released at the same instant beside it, and a height
    // scale (2 m ticks) between them. Same breeze for both; only the vertical motion differs.
    const rk = MathX.smooth(t, GB.release - 0.4, GB.release);
    const G = this.ghostBalloon, Ldr = this.balloons[0];
    G.g.visible = show && t > GB.release - 0.4; G.str.visible = G.g.visible;
    if (hand0 || t > GB.release - 0.4) {
      const h0 = hand0 || hand, u = Math.max(0, t - GB.release);
      const base = new THREE.Vector3(h0.x + 1.0, h0.y + Ldr.off[1], h0.z + 0.25);
      G.g.position.copy(base).add(new THREE.Vector3(0.06 * u, gbBalloonRise(u, 1), -0.22 * u));
      G.g.rotation.set(0, t * 0.3, 0); this.ghostBalloonM.opacity = 0.62 * rk;
      const kn = new THREE.Vector3(0, -0.29, 0).add(G.g.position), pos = G.str.geometry.attributes.position;
      for (let j = 0; j < 16; j++) { const s = j / 15; pos.setXYZ(j, kn.x + Math.sin(s * 4 - u * 7) * 0.08 * s, kn.y - s * 1.45 * Math.min(1, 0.3 + u), kn.z + 0.2 * s * s); }
      pos.needsUpdate = true; G.str.material.opacity = 0.35 * rk;
      // the scale: a vertical line from the release height with ticks every 2 m (labels are HUD tags in film.js)
      this.ruler.visible = show && rk > 0.01; this.rulerM.opacity = 0.9 * rk;
      this.ruler.position.set(h0.x + 0.5, h0.y + Ldr.off[1], h0.z + 0.1 - 0.0);
      this.raceBase = this.ruler.position.clone();
      this.raceH2 = u > 0 ? gbBalloonRise(u, 2) : 0; this.raceH1 = u > 0 ? gbBalloonRise(u, 1) : 0;
      this.raceLead = Ldr.g.position; this.raceGhost = G.g.position;
    } else { this.ruler.visible = false; this.raceBase = null; }
    // jogger: jogs across, drops to her knees when gravity doubles
    const J = this.jogger;
    const jx = gbTrack('jx', [[0, -6.0], [GB.g, 4.4, 'linear'], [30, 4.4]]).value(t), jz = gbTrack('jz', [[0, -8.0], [GB.g, -12.4, 'linear'], [30, -12.4]]).value(t);
    J.place(jx, 0, jz, Math.atan2(10.4, -4.4));
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
      const i = P.i, fly = i < 2 && t > GB.out - 0.5;
      if (!fly) {
        const px = -1.5 + i * 0.8 + Math.sin(i * 3) * 0.6, pz = -8.0 - (i % 3) * 0.7;
        const peck = t < GB.g ? Math.max(0, Math.sin(t * 5 + i * 2)) : 0;
        P.g.position.set(px, 0.09 - 0.03 * after, pz); P.g.rotation.set(0.5 * peck + 0.15 * after, i * 1.3, 0); P.g.scale.set(1 + 0.12 * after, 1 - 0.18 * after, 1);
        P.wl.rotation.z = 0.05; P.wr.rotation.z = -0.05;
      } else {
        const u = t - (GB.out - 0.5) - i * 0.6;
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
