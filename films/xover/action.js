/* =====================================================================
   ACTION — who is where, doing what, at every WORLD time (w = xW(t), so
   slow motion slows everything). Keys are written in FILM seconds and
   converted with W(): "at the drop" means W(XB.shot).
   Killua: stations he is seen at, joined by dashes too fast to see
   (a streak and a crack mark them). Eren: on the road until he bites his
   hand; then the Titan. Tanks: T1 (the squad's tank), T2–T4 (the field),
   T5–T7 (the column in the village), T8–T9 (the last push). Soldiers in
   squads. Every explosion, bolt, steam cloud and dust ring is spawned
   once, at build, at its world time.
   ===================================================================== */

const W = (t) => xW(t);
// Killua's own movements
(() => {
  const P = basePose;
  Object.assign(ACTIONS, {
    kPockets(τ, c) { const p = ACTIONS.idle(τ, c); p.lSh = [-0.18, 0.16]; p.rSh = [-0.18, 0.16]; p.lEl = 0.55; p.rEl = 0.55; p.spine = -0.02; p.headYaw *= 0.3; p.lKnee = 0.05; p.rKnee = 0.08; p.rHip = [0.05, 0.08]; return p; },
    kWalk(τ, c) { const p = ACTIONS.walk(τ, c); p.lSh = [-0.18, 0.16]; p.rSh = [-0.18, 0.16]; p.lEl = 0.55; p.rEl = 0.55; p.spine = 0.0; p.pelvisYaw *= 0.6; p.spineYaw *= 0.4; p.headYaw = 0; return p; },
    kCrouch(τ, c) { const p = P(); p.hipY = 0.5; p.lHip = [1.5, 0.25]; p.rHip = [0.9, 0.2]; p.lKnee = 2.2; p.rKnee = 1.9; p.lFoot = -0.6; p.rFoot = 0.4; p.spine = 0.45; p.neck = -0.25;
      p.rSh = [0.9, 0.1]; p.rEl = 0.3; p.lSh = [0.25, 0.2]; p.lEl = 1.4; return p; },
    kRun(τ, c) { const p = ACTIONS.jog(τ, c); p.spine = 0.55; p.neck = -0.35; p.lSh = [-0.9, 0.15]; p.rSh = [-0.9, 0.15]; p.lEl = 0.2; p.rEl = 0.2; p.hipY = 0.82; return p; },
    kLand(τ, c) { const p = ACTIONS.kCrouch(τ, c), k = 1 - MathX.smooth(τ, 0, 0.5); p.hipY = MathX.lerp(0.9, 0.55, k); return p; },
    kStand(τ, c) { const p = ACTIONS.kPockets(τ, c); return p; },
    kStrike(τ, c) { const p = P(); p.hipY = 0.78; p.lHip = [0.75, 0.15]; p.rHip = [-0.35, 0.1]; p.lKnee = 0.9; p.rKnee = 0.35; p.spine = 0.35; p.spineYaw = -0.4; p.neck = -0.2;
      p.rSh = [1.45, 0.05]; p.rEl = 0.05; p.lSh = [-0.6, 0.3]; p.lEl = 0.9; return p; },
  });
  Object.assign(BLEND, { kPockets: 0.4, kWalk: 0.35, kCrouch: 0.05, kRun: 0.05, kLand: 0.05, kStand: 0.3, kStrike: 0.02 });
})();

class XAction {
  constructor(app) {
    this.app = app; const S = app.scene;
    this.killua = new XKillua(S); this.eren = new XEren(S); this.titan = new XTitan(S);
    // Killua's afterimage: a second rig drawn in pale additive blue where he just was
    this.ghost = new XKillua(S); this.ghostMat = new THREE.MeshBasicMaterial({ color: '#9ed4ff', transparent: true, opacity: 0, depthWrite: false });
    this.ghost.p.root.traverse((o) => { if (o.isMesh) { o.material = this.ghostMat; o.castShadow = false; } }); this.ghost.p.root.visible = false;
    this.titan.root.traverse((o) => o.layers.enable(1));
    // tanks
    this.tanks = {}; for (const id of ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9']) this.tanks[id] = new XTank(S);
    // soldiers: the squad (A), field (F), MG crew (M), trench (R), battery (B), retreat (Q)
    this.sol = []; let n = 0;
    const mk = (group, count, look) => { const out = []; for (let i = 0; i < count; i++) { const s = new XSoldier(S, `${group}${i}`, i % 3 === 2 ? 'xSoldier2' : look || 'xSoldier'); s.group = group; s.i = i; this.sol.push(s); out.push(s); n++; } return out; };
    this.A = mk('A', 9); this.officer = mk('O', 1, 'xOfficer')[0]; this.F = mk('F', 6); this.M = mk('M', 2); this.R = mk('R', 8); this.Bt = mk('B', 6); this.Q = mk('Q', 8);
    this.sparks = new XSpark(S);
    this.wbolt = new XRibbon(S, 1200, '#ffc27a'); this.wcore = new XRibbon(S, 600, '#fff6e6');
    this._v = new THREE.Vector3(); this._u = new THREE.Vector3();
    this._fx(S);
  }

  /* ---------------- effects, spawned once at their world times ---------------- */
  _fx(S) {
    const E = this.ev = [];                                     // [w, kind, x, y, z] for lights / sound / shakes
    const ex = (tf, x, y, z, big = 1, warm = true) => E.push([W(tf), warm ? 'boom' : 'zap', x, y, z, big]);
    // the muzzle flash (the shot at Killua), the casing; the T1 hit; Killua's cracks
    E.push([W(XB.shot), 'muzzle', 0, 0, 0, 1]);
    E.push([W(XB.onTank - 0.05), 'zap', 0, 0, 0, 1], [W(XB.cut[0]), 'zap', 0, 0, 0, 1.5], [W(XB.gone), 'zap', 0, 0, 0, 1]);
    // the arrival: two strikes in the road, smoke that parts on two figures
    this.arrB = new XRibbon(S, 600, '#d6eeff'); this.arrW = new XRibbon(S, 600, '#ffcf98');
    this.arrFlash = new XBill(S, { n: 1, seed: 43, kind: 'glow', color: '#a8d8ff', additive: true, alpha: 0.9, fadeIn: 0.02, fadeOut: 0.15, spawn: () => ({ p: new THREE.Vector3(0.9, 1.4, -22), v: new THREE.Vector3(), t0: W(XB.arrive), life: 0.45, s0: 5, s1: 8, rot: 0 }) });
    this.arrFlashW = new XBill(S, { n: 1, seed: 44, kind: 'glow', color: '#ffb46a', additive: true, alpha: 0.9, fadeIn: 0.02, fadeOut: 0.15, spawn: () => ({ p: new THREE.Vector3(-0.9, 1.4, -22), v: new THREE.Vector3(), t0: W(XB.arrive), life: 0.45, s0: 5, s1: 8, rot: 1 }) });
    this.arrSmoke = new XBill(S, { n: 70, seed: 47, kind: 'soft', color: '#b9ae9e', alpha: 0.7, drag: 1.4, fadeIn: 0.04, fadeOut: 0.45, spawn: (i, r) => { const a = r.range(-0.3, Math.PI + 0.3), rr = r.range(0.6, 1.6); return { p: new THREE.Vector3(Math.cos(a) * rr * 1.6, r.range(0.2, 2.6), -21.2 + Math.sin(a) * rr), v: new THREE.Vector3(Math.cos(a) * r.range(3, 7), r.range(0.3, 1.5), Math.sin(a) * r.range(2, 5)), rise: 0.4, t0: W(XB.arrive) + r.range(0, 0.08), life: r.range(2.0, 3.4), s0: r.range(1.5, 2.5), s1: r.range(4.5, 7.5), rot: r.range(0, 6) }; } });
    E.push([W(XB.arrive), 'zap', 0.9, 1.2, -22, 3], [W(XB.arrive), 'arrive', -0.9, 1.2, -22, 2]);
    this.deadSmoke = new XBill(S, { n: 30, seed: 53, kind: 'soft', color: '#2c2926', alpha: 0.7, drag: 0.2, fadeIn: 0.1, fadeOut: 0.5, spawn: (i, r) => ({ p: new THREE.Vector3(0.4 + r.range(-0.4, 0.4), 2.2, -47.6 + r.range(-0.4, 0.4)), v: new THREE.Vector3(0.6, r.range(1.0, 1.8), -1.4), t0: W(XB.dead) + 0.2 + i * 0.12, life: 3.6, s0: 1.0, s1: 5.5, rot: r.range(0, 6), loop: 3.6 }) });
    // the transformation: lightning, ring, steam
    const TX = -2, TZ = -23;
    E.push([W(XB.bolt), 'bolt', TX, 0, TZ, 3]);
    this.steam = new XBill(S, { n: 110, seed: 3, kind: 'soft', color: '#e8e0d2', alpha: 0.46, mod: (o, p) => { const c = this.app.camera.position, dt = this._titanCamD; if (!dt || p.y < 2.2) return 1; return 0.04 + 0.96 * MathX.smooth(p.distanceTo(c) - dt, -3.0, 0.5); }, drag: 0.5, fadeIn: 0.05, fadeOut: 0.55,
      spawn: (i, r) => { const a = r.range(0, 6.28), rr = r.range(0, 4), late = i > 70; return { p: new THREE.Vector3(TX + Math.cos(a) * rr * (late ? 2 : 1), late ? r.range(0.3, 2.2) : r.range(0.5, 6), TZ + Math.sin(a) * rr * (late ? 2 : 1)), v: new THREE.Vector3(Math.cos(a) * r.range(2, 7), r.range(0.4, 2), Math.sin(a) * r.range(2, 7)), rise: r.range(0.2, 0.8),
        t0: W(XB.bolt) + r.range(0.0, 1.0) + (late ? r.range(1.2, 5) : 0), life: late ? r.range(2.5, 4) : r.range(2.2, 3.4), s0: r.range(3, 6), s1: r.range(9, 15), rot: r.range(0, 6), spin: r.range(-0.2, 0.2) }; } });
    this.ring = new XBill(S, { n: 70, seed: 5, kind: 'soft', color: '#7c6a52', alpha: 0.8, drag: 1.2, fadeOut: 0.45,
      spawn: (i, r) => { const a = i / 70 * 6.28 + r.range(-0.05, 0.05); return { p: new THREE.Vector3(TX + Math.cos(a) * 2, 0.8, TZ + Math.sin(a) * 2), v: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(r.range(22, 30)), rise: 0.3, t0: W(XB.ring) + r.range(0, 0.08), life: r.range(1.6, 2.6), s0: 2, s1: r.range(6, 9), rot: r.range(0, 6) }; } });
    this.flash = new XBill(S, { n: 6, seed: 7, kind: 'glow', color: '#ffd9a0', additive: true, alpha: 0.75, fadeIn: 0.01, fadeOut: 0.2,
      spawn: (i, r) => ({ p: new THREE.Vector3(TX + r.range(-1, 1), r.range(2, 12), TZ + r.range(-1, 1)), v: new THREE.Vector3(), t0: W(XB.bolt) + i * 0.02, life: 0.4, s0: 12, s1: 20, rot: r.range(0, 6) }) });
    // the titan's skin steams for the rest of the film (thin plumes)
    this.tsteam = new XBill(S, { n: 140, seed: 9, kind: 'soft', color: '#ece6dc', alpha: 0.24, drag: 0.2, fadeOut: 0.6, spawn: (i, r) => ({ p: new THREE.Vector3(), v: new THREE.Vector3(r.range(-0.6, 0.6), r.range(0.8, 2), r.range(-0.6, 0.6)), rise: 0.5, t0: W(XB.reveal) + (i / 140) * (W(XB.black) - W(XB.reveal)), life: 2.2, s0: 1.2, s1: 4.5, rot: r.range(0, 6), part: Math.floor(r.range(0, 5)) }) });
    // explosions: shells on the titan, the thrown tank, the stomp, the aura-walk blast, the barrage, the final break
    const booms = [[XB.fire1 + 0.25, 'chest'], [XB.fire2 + 0.25, 'shoulder'], [XB.throw + 0.9, [-24, 0.5, -73.5]], [XB.stomp, [5, 0.4, -60]], [XB.auraBlast, [-3.2, 0.6, -80]],
      [XB.barrage + 0.5, 'chest'], [XB.barrage + 0.7, 'shoulder'], [XB.barrage + 0.9, [-8, 0.2, -86]], [XB.barrage + 1.1, 'head'], [XB.barrage + 1.3, [2, 0.2, -82]], [XB.barrage + 1.6, 'chest'], [XB.barrage + 1.9, [-12, 0.2, -88]],
      [XB.push + 0.3, 'chest'], [XB.push + 0.9, 'shoulder'], [XB.break, [-8, 0.6, -100]], [XB.break + 0.25, [3, 0.8, -108.5]], [43.4, [16, 1, -84]], [XB.crush, [-6, 0.4, -79.5]],
      [0.12, [-4, 0.3, -12]], [0.55, [-14, 0.3, -61]], [1.3, [17, 0.3, -53]], [1.95, [-23, 0.3, -76]], [2.7, [13, 0.3, -90]], [3.4, [-11, 0.3, -12]], [4.1, [9, 0.3, -6]], [7.0, [-38, 0.3, -118]], [9.0, [36, 0.3, -104]]];
    this.booms = booms.map(([tf, at]) => ({ w: W(tf), at }));
    this.fire = new XBill(S, { n: booms.length * 6, seed: 11, kind: 'glow', color: '#ff9a3a', additive: true, alpha: 0.9, mod: (o, p) => MathX.clamp(p.distanceTo(this.app.camera.position) / 28, 0.3, 1), fadeIn: 0.02, fadeOut: 0.3, spawn: (i, r) => ({ p: new THREE.Vector3(), v: new THREE.Vector3(r.range(-3, 3), r.range(1, 6), r.range(-3, 3)), t0: 1e9, life: r.range(0.35, 0.7), s0: r.range(2, 4), s1: r.range(5, 9), rot: r.range(0, 6), b: Math.floor(i / 6) }) });
    this.smoke = new XBill(S, { n: booms.length * 8, seed: 13, kind: 'soft', color: '#3c3833', alpha: 0.85, drag: 0.8, fadeOut: 0.6, spawn: (i, r) => ({ p: new THREE.Vector3(), v: new THREE.Vector3(r.range(-2, 2), r.range(2, 6), r.range(-2, 2)), rise: 0.6, t0: 1e9, life: r.range(2.5, 4.5), s0: r.range(3, 5), s1: r.range(9, 14), rot: r.range(0, 6), b: Math.floor(i / 8) }) });
    // the final smoke wall after the break
    this.wall = new XBill(S, { n: 60, seed: 17, kind: 'soft', color: '#4a4540', alpha: 0.6, mod: (o, p) => { const dt = this._titanCamD; if (!dt) return 1; return 0.05 + 0.95 * MathX.smooth(p.distanceTo(this.app.camera.position) - dt, -1.0, 3.5); }, drag: 0.3, fadeIn: 0.1, fadeOut: 0.85, spawn: (i, r) => ({ p: new THREE.Vector3(r.range(-28, 22), r.range(1, 8), r.range(-101, -86)), v: new THREE.Vector3(r.range(-1, 1), r.range(0.15, 0.6), r.range(-1, 1)), rise: 0.05, t0: W(XB.break) + r.range(0, 0.6), life: 14, s0: r.range(6, 10), s1: r.range(14, 22), rot: r.range(0, 6) }) });
    // battlefield atmosphere: smoke columns, fires, embers, foreground motes
    const cols = [[-40, -60], [35, -95], [-60, -120], [55, -40], [-25, 10], [20, -140], [70, -80], [-75, -30], [-19, -66], [22, -60], [-30, -32], [12, -100]];
    this.columns = new XBill(S, { n: cols.length * 14, seed: 19, kind: 'soft', color: '#2e2b28', alpha: 0.75, drag: 0, fadeIn: 0.1, fadeOut: 0.5,
      spawn: (i, r) => { const c = cols[i % cols.length]; return { p: new THREE.Vector3(c[0] + r.range(-2, 2), 2, c[1] + r.range(-2, 2)), v: new THREE.Vector3(1.2, 2.6, 0.4), rise: 0, t0: -14 + (Math.floor(i / cols.length)) * 1.0 + r.range(0, 0.8), life: 14, s0: 5, s1: 22, rot: r.range(0, 6), loop: 14 }; } });
    const fires = [[-25, 10], [55, -40], [35, -95], [-6, 14], [-5.6, 12.5], [18, -55], [-19, -66], [22, -60], [9, 4], [-12, -2]];
    this.fires = new XBill(S, { n: fires.length * 8, seed: 23, kind: 'glow', color: '#ff7a24', additive: true, alpha: 0.8, flicker: true, fadeIn: 0.15, fadeOut: 0.5,
      spawn: (i, r) => { const f = fires[i % fires.length]; return { p: new THREE.Vector3(f[0] + r.range(-1, 1), xGround(f[0], f[1]) + 0.4, f[1] + r.range(-1, 1)), v: new THREE.Vector3(0, r.range(1.2, 2.4), 0), t0: -2 + (Math.floor(i / fires.length)) * 0.13, life: 1.0, s0: r.range(1.2, 2), s1: 0.6, rot: r.range(0, 6), loop: 1.0 }; } });
    this.embers = new XBill(S, { n: 160, seed: 29, kind: 'flash', color: '#ffab55', additive: true, alpha: 0.9, flicker: true, fadeOut: 0.6,
      spawn: (i, r) => ({ p: new THREE.Vector3(r.range(-40, 40), r.range(0, 3), r.range(-110, 20)), v: new THREE.Vector3(r.range(0.5, 2), r.range(1, 3), r.range(-0.5, 0.5)), t0: -6 + r.range(0, 6), life: r.range(3, 6), s0: 0.12, s1: 0.06, loop: 6 }) });
    // the trench flash: soldiers drop one after another as the light runs along it
    this.trenchW = [W(XB.trench), W(XB.trench) + 0.5];
  }

  /* ---------------- where everyone is ---------------- */
  _tankStates(w) {
    const S = {}, R = (a, b, k) => a + (b - a) * k, k01 = (a, b) => MathX.clamp((w - a) / (b - a), 0, 1);
    // T1: rolls south down the road behind the squad, stops; dead after the cut
    { const k = Ease.outQuad(k01(0, W(9.0))); S.T1 = { x: 0.4, z: R(-72, -45, k), yaw: 0, dist: 27 * k, turret: 0, elev: 0.02, hatch: 1, commander: w < W(XB.cut[1]), cmLook: w > W(XB.onTank - 0.6) && w < W(XB.cut[0]) ? [0.1, 2.6 * MathX.smooth(w, W(XB.onTank - 0.6), W(XB.onTank - 0.2))] : [0, 0], lights: w < W(XB.cut[1]) ? 1.2 : 0 }; }
    // T2–T4: the field; T2 is thrown, T3 reverses and is stomped, T4 stares then is destroyed in the aura walk
    { const k = k01(W(22), W(XB.grab)); S.T2 = { x: R(-6, -4, k), z: R(-82, -57.5, k), yaw: Math.PI * 0.02, dist: 25 * k, turret: 0, elev: 0.12, recoil: Math.exp(-Math.max(0, w - W(XB.fire1)) * 6) * (w > W(XB.fire1) ? 1 : 0), hatch: 0 };
      if (w > W(XB.grab + 0.45)) { const u = Math.max(0, w - W(XB.throw)); const lift = w < W(XB.throw) ? 3 * MathX.smooth(w, W(XB.grab + 0.45), W(XB.throw)) : 0;
        if (w < W(XB.throw)) { S.T2.lift = lift + 2; S.T2.pitch = -0.4 * MathX.smooth(w, W(XB.grab + 0.45), W(XB.throw)); }
        else { const T = 0.55, f = Math.min(1, u / T); S.T2.x = R(-4, -24, f); S.T2.z = R(-57.5, -73.5, f); S.T2.lift = Math.max(0, 5 + 16 * f - 21 * f * f); S.T2.roll = 3.1 * Ease.outCubic(f); S.T2.spin = 0.8 * f; S.T2.pitch = -0.4 + 0.3 * f; S.T2.broken = f >= 1; }
      } }
    { const k = k01(W(22), W(XB.grab + 0.4)), back = k01(W(XB.stomp - 0.9), W(XB.stomp)); S.T3 = { x: 5, z: R(-86, -61, k) - 2.5 * Ease.outQuad(back), yaw: 0.05, dist: 25 * k - 2.5 * back, turret: 0.2, elev: 0.1, recoil: Math.exp(-Math.max(0, w - W(XB.fire2)) * 6) * (w > W(XB.fire2) ? 1 : 0), crush: MathX.smooth(w, W(XB.stomp), W(XB.stomp) + 0.12) }; }
    { const k = k01(W(23), W(XB.stare - 1.0)); S.T4 = { x: -3.2, z: R(-96, -79.5, k), yaw: 0.0, dist: 18 * k, turret: -0.3, elev: 0.15, hatch: MathX.smooth(w, W(XB.stare - 0.3), W(XB.stare + 0.1)), commander: w > W(XB.stare - 0.2) && w < W(XB.auraBlast), cmUp: 1, cmLook: [-0.55, 0.3] };
      if (w > W(XB.auraBlast)) { const f = MathX.clamp((w - W(XB.auraBlast)) / 0.8, 0, 1); S.T4.lift = Math.max(0, 9 * f - 9 * f * f); S.T4.roll = 2.0 * Ease.outCubic(f); S.T4.z -= 4 * f; S.T4.broken = true; S.T4.hatch = 1; } }
    // T5–T7: the column heading south through the village at 5 m/s
    { const t0 = W(XB.run - 1.4), v = 5, stop1 = W(XB.stop), base = (dz, stopAt) => { const ws = Math.min(w, stopAt); return -34 + v * Math.max(0, ws - t0) + dz; };
      const d1 = (stopAt) => v * Math.max(0, Math.min(w, stopAt) - t0);
      S.T5 = { x: 0.5, z: base(0, stop1), yaw: 0, dist: d1(stop1), turret: 0, lights: w < W(XB.touch) ? 1.2 : (Math.floor(w * 20) % 3 ? 0.2 : 1.4) * (w < W(XB.touch + 0.8) ? 1 : 0) };
      S.T6 = { x: 0.5, z: base(-12, W(XB.stop + 0.6)), yaw: 0, dist: d1(W(XB.stop + 0.6)), turret: w < W(XB.stop) ? 0.3 * Math.sin(w * 1.5) : 0.3 * Math.sin(W(XB.stop) * 1.5), lights: w < W(XB.leap) ? 1.2 : 0 };
      S.T7 = { x: 0.5, z: base(-24, W(XB.fire3)), yaw: 0, dist: d1(W(XB.fire3)), turret: MathX.lerp(0, 0.06, MathX.smooth(w, W(XB.fire3 - 0.5), W(XB.fire3 - 0.1))), elev: 0.04, recoil: w > W(XB.fire3) ? Math.exp(-(w - W(XB.fire3)) * 6) : 0, hatch: 0 }; }
    // T8–T9: the last push from the ridge; smashed at the break; T8's wreck is Killua's stage at the end
    { const k = k01(W(55), W(XB.break)); S.T8 = { x: 3, z: R(-121, -109, k), yaw: 0.02, dist: 12 * k, turret: -0.15, elev: 0.18, recoil: w > W(XB.push) ? Math.exp(-(w - W(XB.push)) * 6) : 0 };
      S.T9 = { x: -8, z: R(-115, -100, k), yaw: -0.05, dist: 15 * k, turret: 0.1, elev: 0.2, recoil: w > W(XB.push + 0.6) ? Math.exp(-(w - W(XB.push + 0.6)) * 6) : 0 };
      if (w > W(XB.break)) { const f = MathX.clamp((w - W(XB.break)) / 0.5, 0, 1); S.T9.crush = f; S.T9.pitch = 0.2 * f; S.T8.roll = 0.22 * f; S.T8.turret = -0.15 - 0.9 * f; S.T8.elev = -0.2 * f; S.T8.broken = true; } }
    return S;
  }

  // the titan: [w, x, z, yaw] path and actions
  _titanKeys() {
    if (this._tk) return this._tk;
    const pos = [[W(XB.bolt), -2, -23], [W(26.0), -2, -23], [W(XB.grab), -4, -53], [W(XB.stomp), 2, -56], [W(XB.stare + 0.2), 2, -57], [W(XB.crush), -6, -78.5], [W(XB.crush + 0.6), -5.5, -79], [W(42.8), 10, -80], [W(44.3), 18, -88], [W(45.2), 10, -84], [W(46.4), -1.5, -87],
      [W(XB.auraBlast), -1.8, -85.5], [W(49), -6, -78], [W(XB.barrage), -4, -84], [W(57), -6, -88], [W(XB.push), -6, -90], [W(XB.break), -6, -96], [W(61.6), -6, -95], [W(63.5), -4.5, -90], [W(XB.final), -4.2, -92], [W(XB.titanUp), -3.8, -95], [W(72), -3.6, -96]];
    const yaw = [[0, Math.PI], [W(XB.reveal), Math.PI], [W(XB.roar), Math.PI + 0.25], [W(26.0), Math.PI], [W(XB.grab), Math.PI], [W(XB.throw), Math.PI + 0.9], [W(XB.throw + 0.5), Math.PI - 0.4], [W(XB.stomp), Math.PI - 0.3], [W(XB.stare + 0.3), Math.PI + 0.35], [W(XB.crush + 0.5), Math.PI + 0.35], [W(XB.crush + 1.4), Math.PI - 1.4], [W(42.8), Math.PI - 1.5],
      [W(44.3), Math.PI - 0.6], [W(45.2), Math.PI + 0.6], [W(46.4), 0.25], [W(XB.auraBlast), 0.05], [W(49), Math.PI], [W(XB.break), Math.PI], [W(62), Math.PI], [W(XB.final), Math.PI], [W(72), Math.PI - 0.05]];
    const acts = [[0, 'tStand'], [W(XB.roar), 'tRoar'], [W(26.0), 'tWalk'], [W(XB.grab), 'tGrab'], [W(XB.throw), 'tThrow'], [W(XB.throw + 0.6), 'tStand'], [W(XB.stomp - 0.6), 'tStomp'], [W(XB.stomp + 0.35), 'tStand'], [W(XB.stare + 0.25), 'tWalk'], [W(XB.crush - 0.6), 'tStomp'], [W(XB.crush + 0.25), 'tWalk'],
      [W(45.2), 'tRoar'], [W(46.2), 'tWalk'], [W(XB.auraBlast - 0.5), 'tPunch'], [W(48.6), 'tWalk'], [W(57), 'tStand'], [W(XB.push), 'tWalk'], [W(XB.break - 0.5), 'tPunch'], [W(61.5), 'tStand'], [W(XB.final), 'tWalk'], [W(XB.titanUp + 0.6), 'tRoar'], [W(70.5), 'tStand']];
    return (this._tk = new HeroKeys(pos, yaw, acts));
  }

  // killua: where, how, and what is around his hands
  _killua(w) {
    const K = { show: true, x: 0.9, y: 0, z: -22, yaw: Math.PI, act: 'kPockets', τ: w, gaze: null, crawl: 0.15, streak: null };
    const at = (tf) => W(tf), T = this.tankS;
    if (w < at(XB.appear)) { K.show = false; return K; }
    if (w < at(XB.shot) + 0.012) { if (w > at(XB.spark - 0.2) && w < at(XB.spark + 1.0)) K.crawl = 0.8; if (w > at(8.5) && w < at(8.95)) K.gaze = new THREE.Vector3(-0.9, 1.62, -22); return K; }
    if (w < at(XB.onTank - 0.05)) {
      const men = [[-1.2, -38.2], [-0.3, -38.2], [1.8, -38.2]];
      for (let di = 0; di < 3; di++) { const td = at(XB.drop[di]), [mx, mz] = men[di];
        if (w > td - 0.075 && w < td + 0.03) { Object.assign(K, { x: mx + 0.62, z: mz + 0.15, yaw: -Math.PI / 2, act: 'kStrike', τ: 0.3, crawl: 1, flashIn: td - 0.075 }); return K; }
        const prev = di === 2 ? [0.9, -22] : men[di + 1]; if (w > td - 0.2 && w < td - 0.075) { K.show = false; K.streak = [[prev[0] + 0.6, 1.0, prev[1]], [(prev[0] + mx) / 2 + 0.6, 1.2, (prev[1] + mz) / 2], [mx + 0.62, 1.1, mz + 0.15]]; K.streakK = 1; K.streakW = 0.3; return K; } }
      K.show = false; K.streak = [[0.9, 1.1, -22], [1.6, 1.3, -26], [3.5, 2.6, -36], [1.0, 2.9, -46]]; K.streakK = 1 - MathX.smooth(w, at(XB.shot) + 0.06, at(XB.shot) + 0.3); K.residue = 1 - MathX.smooth(w, at(XB.shot) + 0.1, at(XB.shot) + 0.35); return K; }
    if (w < at(XB.cut[0])) { const p = this.tanks.T1.deck(this._v, 0.0, -1.4); Object.assign(K, { x: p.x, y: p.y, z: p.z, yaw: 0.05, act: 'kCrouch', τ: 0, crawl: 1 }); return K; }
    if (w < at(XB.gone)) { const p = this.tanks.T1.turretTop(this._v); Object.assign(K, { x: p.x, y: p.y, z: p.z, yaw: 0.1, act: 'kPockets', τ: w, crawl: 0.35 }); K.headYaw = w > at(16.6) ? -0.5 * MathX.smooth(w, at(16.6), at(17.4)) : 0; return K; }
    if (w < at(XB.run)) { K.show = false; const p = this.tanks.T1.turretTop(this._v); Object.assign(K, { x: p.x, y: p.y, z: p.z }); return K; }   // (unseen, but the close-up's lens stays where he was)
    // the column: alongside T5, a hand on the hull; the leap to T6; behind T7
    if (w < at(XB.leap)) { const t5 = T.T5, run = w < at(XB.touch); Object.assign(K, { x: -1.55, z: t5.z + 0.6, yaw: 0, act: 'kRun', τ: w, crawl: run ? 0.5 : 1, run: true }); if (!run) K.touch = true; return K; }
    if (w < at(XB.stop + 0.3)) { const p = this.tanks.T6.deck(this._v, 0, 0.4); Object.assign(K, { x: p.x, y: p.y, z: p.z, yaw: 0.2, act: 'kCrouch', τ: 0, crawl: 1, flashIn: at(XB.leap) });
      const u = w - at(XB.leap); if (u < 0.3) { const z5 = T.T5.z + 0.6; K.streak = [[-1.55, 1.0, z5], [-0.8, 3.6, (z5 + p.z) / 2], [p.x, p.y + 0.8, p.z]]; K.streakK = 1 - u / 0.3; K.streakW = 0.35; } return K; }
    if (w < at(XB.behind)) { K.show = false; return K; }
    if (w < at(XB.mg)) { const t7 = T.T7; Object.assign(K, { x: 0.8, z: t7.z - 5.2, yaw: Math.PI, act: 'kPockets', τ: w, crawl: 0.5, flashIn: at(XB.behind) }); return K; }
    // the machine gun: behind the gunner
    if (w < at(XB.mg + 0.35)) { K.show = false; return K; }
    if (w < at(XB.trench)) { const m = XW.mg[0], ts = at(XB.mg + 0.95), strike = w > ts - 0.12 && w < ts + 0.12; Object.assign(K, { x: m[0] + (strike ? 0.25 : 0.6), z: m[1] - (strike ? 0.55 : 2.0), yaw: 0, act: strike ? 'kStrike' : 'kPockets', τ: strike ? 0.3 : w, crawl: strike ? 1 : 0.4, flashIn: strike ? ts - 0.12 : at(XB.mg + 0.35) }); return K; }
    if (w < at(XB.trench) + 0.5) { K.show = false; const f = (w - at(XB.trench)) / 0.5, x = -40 + 80 * f; K.streak = [[x - 10, 1.0, XW.trench.z], [x - 5, 1.1, XW.trench.z + 1], [x, 1.2, XW.trench.z]]; K.streakK = 1; K.streakW = 0.4; return K; }
    // montage: behind the MG again (42–43), across the falling wall (44.2–45.2)
    if (w < at(42.0)) { K.show = false; return K; }
    if (w < at(43.0)) { const m = XW.mg[1]; Object.assign(K, { x: m[0] - 0.6, z: m[1] + 2.6, yaw: 0.15, act: 'kPockets', τ: w, crawl: 0.6, flashIn: at(42.0) }); return K; }
    if (w < at(44.2)) { K.show = false; return K; }
    if (w < at(45.2)) { const f = (w - at(44.2)) / (at(45.2) - at(44.2)); Object.assign(K, { x: -9 + 1.5 * f, y: 3.2, z: 6 - 12 * f, yaw: Math.PI, act: 'kRun', τ: w, crawl: 0.6, run: true }); return K; }
    // the aura walk: toward the camera down the road, hands in pockets
    if (w < at(XB.aura)) { K.show = false; return K; }
    if (w < at(49.0)) { const f = (w - at(XB.aura)) / (at(49) - at(XB.aura)); Object.assign(K, { x: 0.6, z: -66 + 3.4 * f, yaw: 0.02, act: 'kWalk', τ: w, crawl: 0.35, walkD: 3.4 * f }); return K; }
    // the crossing: flashes over the field under the barrage
    if (w < at(XB.cross)) { K.show = false; return K; }
    if (w < at(XB.size)) { K.show = false; const f = (w - at(XB.cross)) / (at(XB.size) - at(XB.cross)), x = -30 + 60 * f; K.streak = [[x - 8, 1, -92], [x - 4, 1.2, -93], [x, 1.1, -94]]; K.streakK = (Math.floor(w * 12) % 2) ? 1 : 0.4; K.streakW = 0.45; return K; }
    // size contrast: on the road, facing the giant
    if (w < at(XB.silent)) { Object.assign(K, { x: 0.6, z: -60, yaw: Math.PI, act: 'kPockets', τ: w, crawl: 0.3 }); return K; }
    // the battery goes silent
    if (w < at(XB.silent) + 1.6) { const i = Math.min(3, Math.floor((w - at(XB.silent)) / 0.4)), g = this.app.world.guns[i], down = at(XB.silent) + i * 0.4 + 0.1; K.zapAt = [g.x, g.y + 1.2, g.z];
      if (w > down - 0.1 && w < down + 0.04) { Object.assign(K, { x: g.x + 0.85, y: g.y, z: g.z - 1.4, yaw: Math.PI / 2, act: 'kStrike', τ: 0.3, crawl: 1, flashIn: down - 0.1 }); return K; } K.show = false; return K; }
    if (w < at(XB.final)) { K.show = false; return K; }
    // the end: standing on T8's wreck, facing the camera; the titan behind him
    { const p = this.tanks.T8.turretTop(this._v); Object.assign(K, { x: p.x, y: p.y, z: p.z, yaw: Math.PI - 0.2, act: 'kPockets', τ: w, crawl: 0.45 }); K.headYaw = 0; return K; }
  }

  // the moments he leaves a place (his afterimage stays there a quarter of a second)
  _vanishes() { if (this._van) return this._van; const at = (tf) => W(tf);
    return (this._van = [at(XB.shot) + 0.012, ...XB.drop.map((d) => at(d) + 0.03), ...[0, 1, 2, 3].map((i) => at(XB.silent) + i * 0.4 + 0.14), at(XB.gone), at(XB.leap), at(XB.stop + 0.3), at(XB.mg), at(XB.mg + 0.35) + 0.0, at(XB.trench), at(43.0), at(45.2), at(49.0), at(XB.silent)]); }
  _ghost(w, cam) {
    const G = this.ghost, gp = G.p; let ve = null; for (const v of this._vanishes()) if (w - v > 0 && w - v < 0.3) ve = v;
    if (ve === null) { gp.root.visible = false; return; }
    const K = this._killua(ve - 0.003); if (!K.show) { gp.root.visible = false; return; }
    const f = (w - ve) / 0.3; gp.root.visible = true; this.ghostMat.opacity = 0.8 * Math.pow(1 - f, 1.5);
    gp.root.position.set(K.x, K.y || xGround(K.x, K.z), K.z); gp.root.rotation.set(0, K.yaw, 0); gp.root.scale.setScalar(1 + 0.12 * f);
    gp.apply((ACTIONS[K.act] || ACTIONS.kPockets)(K.τ, { seed: gp.seed, seedI: gp.seedI, walkPhase: ((K.walkD ?? ve * (K.run ? 5.5 : 1.2)) / 1.0) * Math.PI * 2 })); gp.root.updateMatrixWorld(true);
    G.pockets(/^k(Pockets|Walk|Stand)$/.test(K.act) ? 1 : 0);
    const c = new THREE.Vector3(K.x, (K.y || xGround(K.x, K.z)) + 0.9, K.z); if (f < 0.5) for (let i = 0; i < 3; i++) this.sparks.arc(c, c.clone().add(new THREE.Vector3(hash1(i * 5 + ve) - 0.5, hash1(i * 7 + ve) - 0.2, hash1(i * 11 + ve) - 0.5).multiplyScalar(1.6)), w, 1 - f, 0.025, i + 91, 1);
  }

  update(t, cam) {
    const w = xW(t), app = this.app, at0 = (tf) => W(tf);
    this.w = w;
    // tanks
    const TS = this.tankS = this._tankStates(w);
    for (const id in this.tanks) this.tanks[id].set(TS[id]);
    for (const id of ['T5', 'T6', 'T7']) this.tanks[id].root.visible = w > W(XB.run - 0.6);
    // killua
    const K = this._killua(w), kp = this.killua.p;
    kp.root.visible = K.show;
    kp.root.position.set(K.x, K.y || xGround(K.x, K.z), K.z);   // (kept where he is even unseen: his light flashes follow it)
    this.sparks.begin(cam);
    // posed even when unseen (a lens that follows his head needs it where it would be)
    kp.root.rotation.set(0, K.yaw, 0);
    { const pose = (ACTIONS[K.act] || ACTIONS.kPockets)(K.τ, { seed: kp.seed, seedI: kp.seedI, walkPhase: ((K.walkD ?? w * (K.run ? 5.5 : 1.2)) / 1.0) * Math.PI * 2 });
      if (K.headYaw) pose.headYaw = K.headYaw;
      kp.apply(pose); kp.root.updateMatrixWorld(true); }
    if (K.show) {
      const look = K.gaze || cam.position;
      this.killua._aimHead(look, K.act === 'kPockets' ? 0.35 : 0.2); kp.root.updateMatrixWorld(true);
      this.killua.pockets(/^k(Pockets|Walk|Stand)$/.test(K.act) && !K.touch ? 1 : 0);
      if (K.touch) { const hp = this.tanks.T5.deck(this._u, -1.45, 0.6); hp.y -= 0.65; this.killua.place(1, 'palm', hp, new THREE.Vector3(0, 0.3, 1), new THREE.Vector3(1, 0, 0), 1); }
      this.killua.hands.L.pose(K.touch ? 'flat' : K.act === 'kCrouch' ? 'relax' : 'fist'); this.killua.hands.R.pose(K.act === 'kCrouch' ? 'flat' : 'fist');
      kp.root.updateMatrixWorld(true);
      this.killua.face.aimEyes(look, 1); this.killua.face.set({ blink: 0, brow: -0.1, frown: 0.15, wide: 0, mouth: 0, smile: 0.05 });
      // electricity: crawling at his hands (and over the hull when he touches it)
      for (const side of [this.killua.j.la, this.killua.j.ra]) this.sparks.crawl(side.hand.getWorldPosition(this._u), t, K.crawl, 0.14, 3, side === this.killua.j.la ? 1 : 2);
      if (K.touch) { const T5 = this.tanks.T5; for (let i = 0; i < 5; i++) { const a = T5.deck(new THREE.Vector3(), -1.4, 0.6), b = T5.deck(new THREE.Vector3(), (hash1(i + Math.floor(t * 20)) - 0.5) * 2.6, (hash1(i * 7 + Math.floor(t * 20)) - 0.5) * 5); this.sparks.arc(a, b, t, 0.9, 0.025, i + 3, 1); } }
      if (K.flashIn !== undefined && w - K.flashIn < 0.12) { const c = this._u.set(K.x, K.y + 0.9, K.z); for (let i = 0; i < 4; i++) this.sparks.arc(c, c.clone().add(new THREE.Vector3(hash1(i * 3) - 0.5, hash1(i * 5 + 1) - 0.2, hash1(i * 7 + 2) - 0.5).multiplyScalar(2.2)), t, 1, 0.04, i + 9, 2); }
    }
    this._ghost(w, cam);
    if (K.residue > 0) { const c = this._u.set(0.9, 1.0, -22); for (let i = 0; i < 6; i++) { const a = c.clone().add(new THREE.Vector3(hash1(i * 3 + 1) - 0.5, hash1(i * 5 + 2) * 1.2 - 0.6, hash1(i * 7 + 3) - 0.5).multiplyScalar(0.7)); this.sparks.arc(a, a.clone().add(new THREE.Vector3(hash1(i + Math.floor(t * 24)) - 0.5, hash1(i * 2 + Math.floor(t * 24)) - 0.5, hash1(i * 9 + Math.floor(t * 24)) - 0.5).multiplyScalar(0.45)), t, K.residue, 0.02, i + 41, 1); } }
    if (K.run && K.show) { const b = kp.root.position, dx = -Math.sin(K.yaw), dz = -Math.cos(K.yaw), P = (d, h) => new THREE.Vector3(b.x + dx * d, b.y + h, b.z + dz * d); this.sparks.streak([P(4.5, 0.9), P(2, 0.95), P(0.3, 1.0)], 0.8, 0.5); }
    if (K.streak) this.sparks.streak(K.streak.map((a) => new THREE.Vector3(...a)), K.streakK ?? 1, K.streakW || 0.16);
    if (K.zapAt) { const c = new THREE.Vector3(...K.zapAt); for (let i = 0; i < 5; i++) this.sparks.arc(c, c.clone().add(new THREE.Vector3(hash1(i * 3 + Math.floor(t * 30)) - 0.5, hash1(i * 5) * 0.8, hash1(i * 7 + 1) - 0.5).multiplyScalar(3)), t, 1, 0.05, i + 21, 2); }
    // the trench flash: a bolt running along the trench line
    if (w > this.trenchW[0] && w < this.trenchW[1] + 0.15) { const f = MathX.clamp((w - this.trenchW[0]) / 0.5, 0, 1), x = -40 + 80 * f, z = XW.trench.z; for (let k = 0; k < 3; k++) this.sparks.arc(new THREE.Vector3(x - 9 + k * 2, 1.0, z), new THREE.Vector3(x + k * 0.5, 1.4, z), t, 1, 0.55 - k * 0.12, 31 + k, 3); this.trenchAt = new THREE.Vector3(x, 1.4, z); } else this.trenchAt = null;
    // the shot's lightning (the transformation): a warm bolt from the clouds
    this._eren(w, t, cam);
    this._soldiers(w, t, cam);
    this.sparks.end();
    // effects
    for (const b of [this.steam, this.ring, this.flash, this.columns, this.fires, this.embers, this.wall, this.arrFlash, this.arrFlashW, this.arrSmoke]) b.update(w);
    this.deadSmoke.update(w > W(XB.dead) + 0.2 && w < W(XB.bite) ? w : -1e9);
    // the two strikes: re-struck every couple of frames for a quarter of a second
    this.arrB.begin(cam); this.arrW.begin(cam);
    { const u = w - at0(XB.arrive); if (u > 0 && u < 0.26) { const fr = Math.floor(u * 45), k = (fr % 3 === 2 ? 0.45 : 1) * (1 - MathX.smooth(u, 0.16, 0.26));
      for (const pl of xBolt(new THREE.Vector3(0.9 + hash1(fr) * 4 - 2, 70, -26), new THREE.Vector3(0.9, 0.2, -22), fr * 5 + 1, 0.09, 3)) { this.arrB.poly(pl, 1.4, k); }
      for (const pl of xBolt(new THREE.Vector3(-0.9 + hash1(fr + 9) * 4 - 2, 70, -18), new THREE.Vector3(-0.9, 0.2, -22), fr * 7 + 2, 0.09, 3)) { this.arrW.poly(pl, 1.4, k); } } }
    this.arrB.end(); this.arrW.end();
    this._booms(w);
    this._titanSteam(w);
  }

  _eren(w, t, cam) {
    const E = this.eren, ep = E.p, T = this.titan, at = (tf) => W(tf);
    // eren on the road until the bolt; the hand to his mouth for the bite
    ep.root.visible = w < at(XB.bolt) && w >= at(XB.appear);
    if (ep.root.visible) {
      ep.root.position.set(-0.9, 0, -22); ep.root.rotation.set(0, Math.PI, 0);
      const pose = ACTIONS.idle(w, { seed: ep.seed, seedI: ep.seedI }); pose.lSh = [0.05, 0.1]; pose.rSh = [0.05, 0.1]; ep.apply(pose); ep.root.updateMatrixWorld(true);
      const kl = w > at(8.9) && w < at(9.3), lookE = kl ? new THREE.Vector3(0.9, 1.35, -22) : cam.position; E._aimHead(lookE, kl ? 0.55 : 0.25); ep.root.updateMatrixWorld(true);
      const b = MathX.smooth(w, at(XB.bite - 0.5), at(XB.bite));
      if (b > 0) { const m = E.j.head.localToWorld(new THREE.Vector3(0, -0.05, 0.14)); E.place(-1, 'palm', m.clone().add(new THREE.Vector3(0.0, -0.02, 0.0)), new THREE.Vector3(-0.6, 0.2, 0.8), new THREE.Vector3(0, -0.3, -1), b); E.hands.R.pose('fist'); }
      E.face.aimEyes(lookE, 1); E.face.set({ brow: -0.35, frown: 0.9, wide: 0.1, mouth: w > at(XB.bite - 0.1) && w < at(XB.bite + 0.4) ? 0.7 : 0 });
      ep.root.updateMatrixWorld(true);
      if (E.cloak) E.cloak.rotation.x = 0.08 * Math.sin(w * 2.1) + 0.06;
    }
    // the titan from the bolt on
    // the bolt: a jagged warm column from the clouds onto him, re-struck every few frames
    this.wbolt.begin(cam); this.wcore.begin(cam);
    const bw = w - at(XB.bolt);
    if (bw > 0 && bw < 0.32) { const fr = Math.floor(bw * 40), k = (fr % 3 === 2 ? 0.5 : 1) * (1 - MathX.smooth(bw, 0.22, 0.32));
      for (const pl of xBolt(new THREE.Vector3(-1.5 + hash1(fr) * 3 - 1.5, 90, -22.5), new THREE.Vector3(-1, 0.5, -22.5), fr * 7 + 3, 0.07, 4)) { this.wbolt.poly(pl, 3.2, 0.9 * k); this.wcore.poly(pl, 0.9, k); } }
    this.wbolt.end(); this.wcore.end();
    const show = w >= at(21.6);
    T.root.visible = show;
    if (!show) { this._titanCamD = 0; return; }
    const K = this._titanKeys(), L = K.at(w);
    T.root.position.set(L.x, xGround(L.x, L.z), L.z); T.root.rotation.set(0, K.yaw.value(w), 0);
    const pose = K.pose(w, { seed: 0.4, seedI: 5, walkPhase: (L.dist / 9.5) * Math.PI * 2 });
    // rising out of the steam: it grows from a crouch in the first second
    const g = MathX.smooth(w, at(XB.bolt) + 0.05, at(XB.rise));
    if (g < 1) { pose.hipY *= 0.45 + 0.55 * g; pose.spine += 0.7 * (1 - g); pose.lKnee += 1.2 * (1 - g); pose.rKnee += 1.2 * (1 - g); }
    const roar = Math.max(MathX.smooth(w, at(XB.roar), at(XB.roar) + 0.2) * (1 - MathX.smooth(w, at(XB.roar) + 1.2, at(XB.roar) + 1.6)), MathX.smooth(w, at(45.2), at(45.4)) * (1 - MathX.smooth(w, at(46.0), at(46.3))), MathX.smooth(w, at(XB.titanUp + 0.6), at(XB.titanUp + 0.8)) * (1 - MathX.smooth(w, at(69.5), at(70))));
    T.apply(pose, roar);
    { const g = MathX.smooth(w, at(55.0), at(55.6)) * (1 - MathX.smooth(w, at(56.7), at(57.2))); if (g > 0) { T.root.updateMatrixWorld(true); const kp = this.killua.p.root.position, tp = T.root.position, yaw = T.root.rotation.y;
      let a = Math.atan2(kp.x - tp.x, kp.z - tp.z) - yaw; a = Math.atan2(Math.sin(a), Math.cos(a)); T.j.neck.rotation.y += MathX.clamp(a, -1.1, 1.1) * 0.5 * g; T.j.head.rotation.y += MathX.clamp(a, -1.1, 1.1) * 0.4 * g; T.j.head.rotation.x += 0.45 * g; } }
    T.setHeat(MathX.smooth(w, at(23.6), at(XB.reveal)) * Math.exp(-Math.max(0, w - at(XB.reveal)) / 2.5));
    T.setShade(1 - MathX.smooth(w, at(23.2), at(XB.reveal + 0.2)));
    T.root.updateMatrixWorld(true);
    this._titanCamD = T.j.spine.getWorldPosition(this._v).distanceTo(cam.position);
    // the grabbed tank rides in the hands until the throw
    if (w > at(XB.grab + 0.45) && w < at(XB.throw)) { const h = T.j.ra.hand.getWorldPosition(this._u), T2 = this.tanks.T2; T2.root.position.set(h.x, h.y - 2.2, h.z); T2.root.rotation.set(0, 0.3, 0); }
  }

  _titanSteam(w) {
    const T = this.titan, B = this.tsteam; if (!T.root.visible) { B.update(-1e9); return; }
    const parts = [T.j.la.sh, T.j.ra.sh, T.j.la.el, T.j.ra.el, T.j.la.sh];
    for (const o of B.P) { const part = parts[o.part]; if (o._set !== part) { o._set = part; } part.getWorldPosition(o.p); o.p.y += 1.0; }
    B.update(w);
  }

  _booms(w) {
    const T = this.titan;
    for (const [list, n] of [[this.fire, 6], [this.smoke, 8]]) list.P.forEach((o) => {
      const b = this.booms[o.b]; if (!b) return;
      o.t0 = b.w;
      if (!o._p) { let p; if (Array.isArray(b.at)) p = new THREE.Vector3(...b.at); else { const part = b.at === 'chest' ? T.j.spine : b.at === 'shoulder' ? T.j.la.sh : T.j.head; p = null; o._part = part; } o._p = p || new THREE.Vector3(); }
      if (o._part && T.root.visible) { o._part.getWorldPosition(o._p); o._p.z += 1.6; o._p.y += o._part === T.j.spine ? 3.7 : 0; }
      o.p.copy(o._p);
      void n;
    });
    this.fire.update(w); this.smoke.update(w);
  }

  _soldiers(w, t, cam) {
    const at = (tf) => W(tf), TS = this.tankS;
    const show = (s, on) => { s.p.root.visible = on; s.rifle.visible = on; return on; };
    // squad A: advance down the road, halt, aim at Killua, fire; look around; thrown by the transformation; flee
    this.A.forEach((s, i) => {
      if (!show(s, w < at(30))) return;
      const lane = (i % 3 - 1) * 1.5 + (i % 2 ? 0.3 : -0.3), row = Math.floor(i / 3), x = lane, z0 = -46 - row * 2.2, z1 = -36 - row * 2.2;
      const k = Ease.outQuad(MathX.clamp(w / at(XB.halt), 0, 1)), z = z0 + (z1 - z0) * k;
      const di = i - 3, dropped = di >= 0 && di < 3 && w > at(XB.drop[di]);
      if (dropped) { s.keys = new HeroKeys([[0, x, z1]], [[0, 0.3 * (di - 1)]], [[0, 'idle'], [at(XB.drop[di]), 'xCollapse']]); s.update(w, null, null); s.rifle.visible = false;
        if (w - at(XB.drop[di]) < 0.1) { const c = s.p.j.spine.getWorldPosition(new THREE.Vector3()); for (let k = 0; k < 4; k++) this.sparks.arc(c, c.clone().add(new THREE.Vector3(hash1(k * 3 + di) - 0.5, hash1(k * 5 + di) - 0.3, hash1(k * 7 + di) - 0.5).multiplyScalar(1.4)), t, 1, 0.03, k + 51 + di * 7, 2); }
        return; }
      const thrown = w > at(XB.ring) + 0.05 && row === 0, fleeing = w > at(XB.reveal);
      let pos = [[0, x, z0], [at(XB.halt), x, z1]], yaw = [[0, 0]], acts = [[0, 'walk'], [at(XB.halt), 'idle'], [at(XB.order + 0.3 + i * 0.07), 'xAim']];
      if (i === 0) acts.push([at(XB.shot), 'xRecoil'], [at(XB.shot) + 0.3, 'xAim']);
      if (w > at(XB.shot) + 0.25) acts.push([at(XB.shot) + 0.25 + i * 0.05, 'idle']);
      if (thrown) { const f = MathX.clamp((w - at(XB.ring)) / 0.6, 0, 1); pos = [[0, x, z1], [at(XB.ring), x, z1], [at(XB.ring) + 0.6, x * 1.4, z1 - 7 - (i % 3)]]; acts = [[0, 'idle'], [at(XB.ring), 'xThrown']]; void f; }
      else if (fleeing) { pos = [[0, x, z1], [at(XB.reveal), x, z1], [at(30), x * 2.5 + (i % 2 ? 6 : -6), z1 - 30]]; yaw = [[0, 0], [at(XB.reveal), 0], [at(XB.reveal) + 0.3, Math.PI + (i % 2 ? 0.4 : -0.4)]]; acts = [[0, 'idle'], [at(XB.reveal) + i * 0.1, 'xFlee']]; }
      s.keys = new HeroKeys(pos, yaw, acts);
      const stance = fleeing || thrown ? 'port' : w > at(XB.order + 0.3 + i * 0.07) && w < at(XB.shot) + 0.25 + i * 0.05 ? 'aim' : w < at(XB.halt) ? 'port' : 'low';
      s.update(w, null, thrown ? null : stance, i === 0 ? new THREE.Vector3(0.9, 1.25, -22) : new THREE.Vector3(0, 1.3, -22));
      if (thrown) { const f = MathX.clamp((w - at(XB.ring)) / 0.6, 0, 1); s.p.root.position.y += Math.max(0, 2.2 * f - 2.2 * f * f) * 2; }
    });
    // the officer: halts the squad, orders fire, tries the radio
    { const s = this.officer; if (show(s, w < at(XB.reveal + 3))) { s.keys = new HeroKeys([[0, -2.6, -42], [at(XB.halt), -2.6, -34]], [[0, 0]], [[0, 'walk'], [at(XB.halt - 0.2), 'xHalt'], [at(XB.halt + 0.9), 'idle'], [at(XB.order - 0.15), 'xPoint'], [at(XB.order + 1.1), 'idle'], [at(XB.ring), 'xThrown']]); s.update(w, null, null);
      if (s.face) { const shout = (w > at(XB.halt - 0.3) && w < at(XB.halt + 0.5)) || (w > at(XB.order - 0.1) && w < at(XB.order + 0.7)); s.face.aimEyes(new THREE.Vector3(0, 1.3, -22), 1);
        s.face.set({ blink: 0, brow: -0.3, frown: 0.7, wide: 0.25, mouth: shout ? 0.55 + 0.25 * Math.abs(Math.sin(w * 13)) : 0.05, smile: 0 }); } } }
    // the field: soldiers around T2–T4 who scatter from the titan
    this.F.forEach((s, i) => {
      if (w > at(XB.size - 0.5) && w < at(XB.silent + 0.2)) { show(s, true); const z = -71 - (i % 3) * 2.5, x0 = (i % 2 ? -1 : 1) * (1.2 + i * 0.9), d = i % 2 ? -1 : 1;
        s.keys = new HeroKeys([[at(XB.size - 0.5), x0, z], [at(XB.silent + 0.2), x0 + d * 16, z + 3]], [[0, d > 0 ? Math.PI / 2 - 0.2 : -Math.PI / 2 + 0.2]], [[0, i === 4 ? 'xTrip' : 'xFlee']]); s.update(w, null, 'port'); return; }
      if (!show(s, w > at(26) && w < at(34))) return;
      const x0 = -14 + i * 5, z0 = -66 - (i % 2) * 4;
      const fl = XB.fire2 + 0.5 + i * 0.1; s.keys = new HeroKeys([[0, x0, z0], [at(fl - 0.2), x0, z0 + 2], [at(fl + 5.5), x0 + (i % 2 ? 8 : -8), z0 - 16]], [[0, 0], [at(fl - 0.2), 0], [at(fl + 0.2), i % 2 ? Math.PI - 0.6 : Math.PI + 0.6]], [[0, 'xAim'], [at(fl), i === 2 ? 'xTrip' : 'xFlee']]);
      s.update(w, null, w < at(fl) ? 'aim' : 'port', new THREE.Vector3(-2, 8, -40));
    });
    // the machine-gun crew: the gunner swings the gun, the rifleman lowers his rifle
    const mg = this.app.world.mgs[0];
    this.M.forEach((s, i) => {
      if (!show(s, w > at(XB.mg - 0.7) && w < at(XB.trench + 0.6))) return;
      const x = mg.x + (i ? 1.4 : 0), z = mg.z + 0.2;
      s.keys = new HeroKeys([[0, x, z]], [[0, 0.0], [at(XB.mg + 0.2), -0.5], [at(XB.mg + 0.5), 0.6]], i ? [[0, 'xAim'], [at(XB.lower), 'xLower']] : [[0, 'xCrouch'], [at(XB.mg + 0.95), 'xCollapse']]);
      s.update(w, null, i ? (w < at(XB.lower) ? 'aim' : 'low') : null, new THREE.Vector3(x + 3, 1.2, z + 20));
      if (!i) { mg.gun.rotation.y = w < at(XB.mg + 0.2) ? 0 : -0.5 * MathX.smooth(w, at(XB.mg + 0.2), at(XB.mg + 0.45)) + 1.1 * MathX.smooth(w, at(XB.mg + 0.45), at(XB.mg + 0.7)); if (w > at(XB.mg + 0.95) && w - at(XB.mg + 0.95) < 0.1) { const c = s.p.j.spine.getWorldPosition(new THREE.Vector3()); for (let k = 0; k < 4; k++) this.sparks.arc(c, c.clone().add(new THREE.Vector3(hash1(k * 3) - 0.5, hash1(k * 5) - 0.3, hash1(k * 7) - 0.5).multiplyScalar(1.4)), t, 1, 0.03, k + 71, 2); } }
    });
    // the trench: they drop as the flash runs past
    this.R.forEach((s, i) => {
      if (!show(s, w > at(XB.crush - 1.0) && w < at(XB.trench + 2.6))) return;
      const x = -32 + i * 9, z = XW.trench.z + 0.4, hit = this.trenchW[0] + (x + 40) / 80 * 0.5, near = Math.abs(x + 6) < 9.5;
      if (near) {   // the titan's foot comes down on the trench: they are thrown out of it
        const d = Math.sign(x + 6) || 1, tc = at(XB.crush); s.keys = new HeroKeys([[0, x, z], [tc, x, z], [tc + 0.7, x + d * 6, z + 3]], [[0, 0]], [[0, 'xCrouch'], [tc, 'xThrown']]);
        s.update(w, null, w < tc ? 'hip' : null, null); const f = MathX.clamp((w - tc) / 0.7, 0, 1); s.p.root.position.y = xGround(s.p.root.position.x, s.p.root.position.z) - 0.1 + Math.max(0, 3 * f - 3 * f * f) * 2; return; }
      s.keys = new HeroKeys([[0, x, z]], [[0, 0]], [[0, 'xCrouch'], [hit, 'xCollapse']]);
      s.update(w, null, w < hit ? 'hip' : null, null);
      s.p.root.position.y = xGround(x, z) - 0.1;
    });
    // the battery crews: load, fire; fall as the guns go silent
    this.Bt.forEach((s, i) => {
      if (!show(s, w > at(XB.radio - 0.6) && w < at(59.5))) return;
      const g = this.app.world.guns[i % 4], x = g.x + (i < 4 ? 1.4 : -1.4), z = g.z - 1.2, down = at(XB.silent) + (i % 4) * 0.4 + 0.1;
      s.keys = new HeroKeys([[0, x, z]], [[0, 0]], i === 0 ? [[0, 'idle'], [at(XB.radio - 0.3), 'xRadio'], [at(XB.battery + 0.2), 'xCrouch'], [down, 'xCollapse']] : [[0, 'idle'], [at(XB.battery), 'xCrouch'], [down, 'xCollapse']]);
      s.update(w, null, null); s.p.root.position.y = g.y;
    });
    for (const g of this.app.world.guns) { const k = w > at(XB.barrage) && w < at(XB.silent) ? Math.exp(-((w - at(XB.barrage)) % 1.2) * 5) : 0; g.brl.position.z = 0.1 - 0.4 * k; }
    // the retreat: soldiers running north past the camera at the end
    this.Q.forEach((s, i) => {
      if (!show(s, w > at(XB.retreat) - 0.5)) return;
      // four run at the retreat camera (through its narrow frame and past it), four through the foreground of the final frame
      const late = i >= 4, j = i % 4, x = late ? 4.6 + j * 1.3 : -0.9 + j * 1.2, z0 = late ? -103 - j * 1.6 : -99.5 - j * 2.4, t0 = late ? at(64.2) : at(XB.retreat) - 0.5;
      if (late && w < t0) { show(s, false); return; }
      s.keys = new HeroKeys([[t0, x, z0], [t0 + 9, x + (j % 2 ? 1.5 : -1.5), z0 - 43]], [[0, Math.PI + (j % 2 ? -0.06 : 0.06)]], [[0, i === 1 ? 'xTrip' : 'xFlee']]);
      s.update(w, null, i % 3 === 0 ? null : 'port');
    });
  }
}
