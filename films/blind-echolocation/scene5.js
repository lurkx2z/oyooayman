/* =====================================================================
   SCENE 5 — "Building a world from sound" (the training centre, centre.js). Weeks pass.
     E1   WEEK 1  (reality, wide) she stands at the partition with her cane, the coach beside her; two hesitant clicks
     E2   WEEK 2 → 4  (acoustic, over her shoulder) early clicks return only scattered, confused fragments; then one
                     clean click on "openings": two panels and, between them, a dark gap
     E2c  WEEK 6  "nearby obstacles": a column one metre ahead answers as a narrow vertical sliver
     E2d  WEEK 7  "differences between certain shapes": the broad flat panel vs the round column, one click each
     E3   WEEK 8 → 10  the study (a card over her practice): blind AND sighted adults, ten weeks, both improved
     E4   the corridor: "Now imagine…" her face, ready
     E5   the walk down the corridor (acoustic, over her shoulder): the wall ENDS · an opening BEGINS · room to move
     E6   (no narration) first person in the lobby: click → a nearby wall; she turns; click → a doorway; she stops,
          checks with the cane, goes on
   ===================================================================== */

BE.s6 = BN_SC[6].start;
BE.e2 = bnF(5, 'but').start - 0.08;
BE.e2open = bnF(5, 'openings').start - 0.1;
BE.e2c = bnF(5, 'nearby').start - 0.1;
BE.e2d = bnF(5, 'even').start - 0.05;
BE.e3 = bnF(5, 'researchers').start - 0.1;
BE.e4 = bnF(5, 'now').start - 0.15;
BE.e5 = bnF(5, 'hallway').start - 0.15;
BE.e6 = BN_CLIP[5].speechEnd + 0.25;
BE.e1Clicks = [BE.s5 + 1.1, BE.s5 + 2.5];
BE.e2Clicks = [BE.e2 + 0.45, BE.e2 + 1.55];                  // early, confused
BE.e2Clean = BE.e2open + 0.25;                               // ★ the gap
BE.e2cClick = BE.e2c + 0.3;
BE.e2dClicks = [BE.e2d + 0.55, BE.e2d + 1.75];
BE.e3Clicks = [BE.e3 + 1.2, BE.e3 + 3.6, BE.e3 + 6.0];
BE.e4Click = BE.e5 - 0.45;
BE.e5Walk = [BE.e5 + 0.15, BE.e6 - 0.3];
BE.e5Clicks = [0.75, 2.3, 3.8, 5.3, 6.4, 7.6, 9.2].map((o) => BE.e5 + o);
BE.e6Clicks = [BE.e6 + 0.45, BE.e6 + 2.0];

GB_POSES.coachWatch = Object.assign({}, GB_POSES.stand, { spX: 2, hdX: 4, LShX: -20, LElX: -62, LShAbd: 10, RShX: -20, RElX: -62, RShAbd: 10, LFing: 0.5, RFing: 0.5 });

// ---- the set, the cast
BE_SET_BUILDERS.push((app, cast) => {
  const ct = app.sets.centre = new BeCentre().build();
  ct.scene.environment = beEnvFor(app.renderer, '#cfe0f4', '#f2e2cc', '#8a6a4c');
  ct.scene.fog = new THREE.FogExp2('#d8d2c8', 0.012);
  ct.hero = cast.heroIn(ct.scene, 'noorC');
  ct.cane = beCane(ct.scene);
  ct.coach = new GbCharacter(ct.scene, 'coach', { name: 'coach' }); beAcousticScene(ct.coach.root, 'hero');
  ct.coach.J.hc.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
  ct.frame = beCentreFrame; ct.fx = beCentreFx;
  const old = ct.update; ct.update = function (t, L, cam, shot) {
    old.call(this, t, L, cam, shot);
    for (const m of this.ceilings) m.visible = !shot.plan;
    for (const m of this.daylight) m.visible = L.ac < 0.5;
    this.courtLines.visible = L.ac < 0.5;
    const F = this.scene.fog; F.color.set('#d8d2c8').multiplyScalar(MathX.lerp(1, L.world, L.ac));
  };
});

const _V = (x, y, z) => new THREE.Vector3(x, y, z);
const BE_PART_SPOT = _V(-2.2, 0, 0.45), BE_COL_SPOT = _V(0.2, 0, 1.85), BE_SHAPE_SPOT = _V(1.4, 0, 0.6);
const BE_COR_A = _V(-2.5, 0, 5.02), BE_COR_B = _V(6.6, 0, 5.02);
const BE_LOBBY_DOOR = _V(8.1, 0, 9);
// her blocking (scene 5); scene 6 appends its own
const BE_HERO_CTR = [
  { t0: -1, p0: BE_PART_SPOT, yaw: Math.PI, cane: true, face: 'focus', hdY: (t) => 8 * Math.sin((t - BE.s5) * 0.9) },
  { t0: BE.e2c - 0.01, p0: BE_COL_SPOT, yaw: 0, cane: true, face: 'focus' },
  { t0: BE.e2d - 0.01, p0: BE_SHAPE_SPOT, yaw: (t) => new Track([[BE.e2d, 2.52], [BE.e2d + 0.35, 2.52], [BE.e2d + 1.25, -0.48], [BE.e3, -0.48]]).value(t), cane: true, face: 'focus' },
  { t0: BE.e3 - 0.01, t1: BE.e4 - 0.1, p0: _V(-3.6, 0, 0.3), p1: _V(3.0, 0, 0.3), cane: true, ease: (k) => k, face: 'calm' },
  { t0: BE.e4 - 0.01, p0: BE_COR_A, yaw: Math.PI / 2, cane: true, face: 'focus' },
  { t0: BE.e5Walk[0], t1: BE.e5Walk[1], p0: BE_COR_A, p1: BE_COR_B, cane: true, ease: (k) => k, step: 0.48, face: 'focus' },
  { t0: BE.e6 - 0.01, p0: BE_COR_B, cane: true, face: 'focus', yaw: (t) => new Track([[BE.e6, Math.PI / 2], [BE.e6 + 0.9, Math.PI / 2], [BE.e6 + 1.7, 0.42], [BE.s6, 0.42]]).value(t),
    lift: (t) => 0.05 * (MathX.window(t, BE.e6 + 2.55, BE.e6 + 2.85, 0.1, 0.15) + MathX.window(t, BE.e6 + 3.05, BE.e6 + 3.35, 0.1, 0.15)),
    sweep: (t) => -0.5 * MathX.window(t, BE.e6 + 2.4, BE.e6 + 2.9, 0.15, 0.2) + 0.5 * MathX.window(t, BE.e6 + 2.95, BE.e6 + 3.45, 0.15, 0.2) },
  { t0: BE.e6 + 3.7, t1: BE.s6 + 0.6, p0: BE_COR_B, p1: _V(7.5, 0, 7.4), cane: true, step: 0.45, face: 'focus' },
];
const BE_COACH_CTR = [
  { t0: -1, p0: _V(-3.5, 0, 1.0), yaw: 2.2, pose: 'coachWatch', face: 'calm' },
  { t0: BE.e2c - 0.01, p0: _V(0.0, 0, 3.2), yaw: 2.3, pose: 'coachWatch', face: 'calm' },
  { t0: BE.e3 - 0.01, t1: BE.e4 - 0.1, p0: _V(-4.4, 0, -0.5), p1: _V(2.0, 0, -0.5), ease: (k) => k, face: 'calm', smile: 0.2 },
  { t0: BE.e4 - 0.01, p0: _V(-40, 0, 0), yaw: 0 },
];
function beClicksCtr() { const B = BE; return B.e1Clicks.concat(B.e2Clicks, [B.e2Clean, B.e2cClick], B.e2dClicks, B.e3Clicks, [B.e4Click], B.e5Clicks, B.e6Clicks, typeof BE_S6_CLICKS === 'function' ? BE_S6_CLICKS() : []); }

function beCentreFrame(app, t, shot) {
  const set = this;
  set._act = beActor(set.hero, t, BE_HERO_CTR, { cane: set.cane, clicks: beClicksCtr(), blinks: [BE.s5 + 2.0, BE.e3 + 3.0, BE.e4 + 1.2] });
  beActor(set.coach, t, BE_COACH_CTR, { blinks: [BE.s5 + 1.4, BE.e3 + 2.0] });
  set.coach.root.visible = set.coach.root.position.x > -30;
  // scene 6 (F3c): once the sound view has taken over, the coach's face is only a rounded shape (no eyes, brows, mouth)
  beFaceShown(set.coach, !(shot.id === 'F3c' && t > BE.f3c + 1.1));
  if (shot.fp) set.hero.root.visible = false;
}

// the acoustic layer per frame: a small ring at her mouth on each click; the corridor's wavefronts
function beCentreFx(app, t, shot) {
  const set = this, R = set.rings, W = set.waves;
  if (!shot.fp) for (const q of app.pulses.list) if (q.set === 'centre' && q.click && (!q.shot || q.shot === shot.id) && t > q.t && t < q.t + 0.45) R.source(q.p, [q.t], t, { r: 0.07, a: 0.8, dur: 0.45, col: '#9ff6ff' });
  if (shot.id === 'E5') for (const q of app.pulses.list) if (q.set === 'centre' && q.click && q.shot === shot.id && t > q.t && t < q.t + 1.6) W.click(q, t, set.corWalls, { speed: q.speed, life: 1.6, a: 0.14 });
}

// ---- the shots
(function () {
  const V = _V, B = BE;
  const ct = () => FILM._app.sets.centre;
  const head = () => ct().hero.worldOf('hd').add(V(0, 0.08, 0));
  const ac = (w = 0.015, h = 0.22) => ({ ac: 1, world: w, hero: h, glow: 0.03 });
  const week = (keys) => (t) => { let n = keys[0][1]; for (const [a, v] of keys) if (t >= a) n = v; return n; };
  const S = [
    { id: 'E1', t0: B.s5, t1: B.e2, set: 'centre', look: () => BE_REAL, week: () => 1,
      cam: beMove(B.s5, B.e2, [V(3.6, 2.3, 3.4), V(-2.0, 1.0, -0.6), 44], [V(3.0, 2.1, 3.0), V(-2.2, 1.0, -0.7), 40], { dof: 0.3 }) },
    { id: 'E2', t0: B.e2, t1: B.e2c, set: 'centre', tag: true, decay: 0.5, gain: 1.3, look: () => ac(0.015, 0.25), week: week([[B.e2, 2], [B.e2open - 0.4, 4]]),
      cam: beMove(B.e2, B.e2c, [V(-1.25, 1.85, 1.95), V(-2.3, 1.0, -1.3), 52], [V(-1.4, 1.8, 1.75), V(-2.25, 1.0, -1.3), 50], { dof: 0 }) },
    { id: 'E2c', t0: B.e2c, t1: B.e2d, set: 'centre', tag: true, decay: 0.6, gain: 1.4, look: () => ac(0.015, 0.25), week: () => 6,
      cam: beMove(B.e2c, B.e2d, [V(1.9, 1.5, 1.2), V(0.15, 1.2, 2.5), 50], [V(1.8, 1.55, 1.0), V(0.15, 1.2, 2.5), 48], { dof: 0 }) },
    { id: 'E2d', t0: B.e2d, t1: B.e3, set: 'centre', tag: true, plan: true, decay: 0.6, gain: 1.4, look: () => ac(0.015, 0.25), week: () => 7,
      cam: beMove(B.e2d, B.e3, [V(4.6, 3.8, 2.0), V(1.4, 0.6, 0.5), 54], [V(4.5, 3.7, 2.6), V(1.3, 0.6, 0.6), 54], { dof: 0 }) },
    { id: 'E3', t0: B.e3, t1: B.e4, set: 'centre', look: () => BE_REAL, week: week([[B.e3, 8], [B.e3 + 2.6, 9], [bnF(5, 'ten').start, 10]]),
      cam: (t) => { const h = head(), k = MathX.ramp(t, B.e3, B.e4); return { pos: V(h.x + 1.5, 2.6, 2.6 + 0.2 * k), at: V(h.x - 0.2, 0.9, 0.0), fov: 46, focus: 3.2, dof: 0.3 }; },
      draw: (cv, t) => beDrawStudy(cv, t) },
    { id: 'E4', t0: B.e4, t1: B.e5, set: 'centre', look: () => BE_REAL,
      cam: (t) => { const h = head(), k = Ease.inOutSine(MathX.ramp(t, B.e4, B.e5)); return { pos: V(h.x + 1.25 - 0.25 * k, h.y + 0.05, h.z - 0.62 + 0.12 * k), at: V(h.x, h.y - 0.05, h.z), fov: 30, focus: 1.3, dof: 0.8 }; } },
    { id: 'E5', t0: B.e5, t1: B.e6, set: 'centre', tag: true, decay: 0.55, gain: 1.35, heroGain: 0.6, look: () => ac(0.012, 0.3),
      cam: (t) => { const h = head(); return { pos: V(h.x - 1.55, h.y + 0.32, h.z - 0.42), at: V(h.x + 3.0, h.y - 0.45, h.z + 0.1), fov: 58, focus: 3, dof: 0 }; } },
    { id: 'E6', t0: B.e6, t1: B.s6, set: 'centre', fp: true, tag: true, decay: 0.55, gain: 1.4, look: () => ac(0.01, 0.3),
      cam: (t) => { const H = ct().hero, h = H.worldOf('hd').add(V(0, 0.1, 0)), y = H.root.rotation.y, f = V(Math.sin(y), 0, Math.cos(y));
        return { pos: h.clone().addScaledVector(f, 0.12), at: h.clone().addScaledVector(f, 2).add(V(0, -0.5, 0)), fov: 62, focus: 2, dof: 0 }; } },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s6;
})();

// ---- pulses
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, B = BE, set = app.sets.centre, H = set.hero, r = new RNG(515);
  const mouthAt = (t) => { FILM._shot = beShotAt(t); beActor(H, t, BE_HERO_CTR, { cane: set.cane }); return beMouth(H); };
  const add = (t, sh, o = {}) => { const m = mouthAt(t + 0.01); P.add(Object.assign({ t, p: m, kind: 0, speed: 4.0, w: 0.09, life: 2.4, str: 1.4, set: 'centre', shot: sh, click: true }, o)); return m; };
  // E1 (reality: the rings only)
  for (const t of B.e1Clicks) add(t, 'E1', { str: 0 });
  // E2: early clicks → scattered, confused fragments (several weak fronts from jittered origins, as if smeared)
  for (const t of B.e2Clicks) {
    const m = add(t, 'E2', { str: 0.35, w: 0.05 });
    for (let k = 0; k < 4; k++) P.add({ t: t + r.range(0.02, 0.35), p: m.clone().add(_V(r.range(-1.2, 1.2), r.range(-0.6, 0.6), r.range(-1.2, 0.4))), kind: 0, speed: r.range(2.5, 5), w: 0.04, life: 1.2, str: 0.45, set: 'centre', shot: 'E2' });
  }
  add(B.e2Clean, 'E2', { str: 1.6 });
  add(B.e2cClick, 'E2c', { str: 1.6 });
  for (const t of B.e2dClicks) add(t, 'E2d', { str: 1.6, speed: 3.6 });
  for (const t of B.e3Clicks) add(t, 'E3', { str: 0 });
  add(B.e4Click, 'E4', { str: 0 });
  for (const t of B.e5Clicks) add(t, 'E5', { speed: 4.5, life: 2.2, str: 1.5 });
  for (const t of B.e6Clicks) add(t, 'E6', { speed: 4.5, life: 2.2, str: 1.6 });
  // the cane's taps in the corridor (tiny amber contacts at the tip)
  for (const sg of BE_HERO_CTR) for (const t of beCaneTaps(sg)) { FILM._shot = beShotAt(t); const a = beActor(H, t, BE_HERO_CTR, { cane: set.cane }); if (a.tip) P.add({ t, p: a.tip.clone(), kind: 1, speed: 1.6, w: 0.03, life: 0.6, str: 0.5, set: 'centre', tap: true }); }
  FILM._shot = null;
});

// WEEK n (a small serif card, top left) is drawn by film.js from shot.week(t)

// SCIENCE (E3): the ten-week study. Illustrative curves (no data values): both groups improved.
function beDrawStudy(cv, t) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height, B = BE;
  x.clearRect(0, 0, W, H);
  const X0 = 1040, Y0 = 120, PW = 780, PH = 560;
  _bePanel(x, X0, Y0, PW, PH, 0.86);
  const a0 = MathX.smooth(t, B.e3, B.e3 + 0.5);
  x.globalAlpha = a0;
  _beTxt(x, 'A TEN-WEEK TRAINING STUDY', X0 + 40, Y0 + 52, { font: '700 30px Inter, sans-serif', col: '#9ff6ff' });
  _beTxt(x, 'Durham University, 2021 · click-based echolocation', X0 + 40, Y0 + 94, { font: '500 23px Inter, sans-serif', col: 'rgba(220, 240, 255, 0.75)' });
  // who: blind and sighted adults
  const aw = MathX.smooth(t, bnF(5, 'blind').start - 0.1, bnF(5, 'blind').start + 0.3), as = MathX.smooth(t, bnF(5, 'sighted').start - 0.1, bnF(5, 'sighted').start + 0.3);
  _beTxt(x, '● BLIND ADULTS', X0 + 40, Y0 + 150, { font: '700 24px Inter, sans-serif', col: `rgba(255, 176, 90, ${aw})` });
  _beTxt(x, '● SIGHTED ADULTS', X0 + 300, Y0 + 150, { font: '700 24px Inter, sans-serif', col: `rgba(98, 243, 255, ${as})` });
  // the weeks axis fills on "ten weeks"
  const gx0 = X0 + 70, gx1 = X0 + PW - 50, gy0 = Y0 + PH - 90, gy1 = Y0 + 200;
  const kw = MathX.smooth(t, bnF(5, 'ten').start - 0.3, bnF(5, 'weeks').start + 0.5);
  x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(gx0, gy1); x.lineTo(gx0, gy0); x.lineTo(gx1, gy0); x.stroke();
  for (let w = 1; w <= 10; w++) { const X = gx0 + (gx1 - gx0) * (w - 0.5) / 10, on = kw * 10 >= w ? 1 : 0.25; x.fillStyle = `rgba(220, 240, 255, ${0.8 * on})`; x.font = '500 20px Inter, sans-serif'; x.textAlign = 'center'; x.fillText(String(w), X, gy0 + 30); x.textAlign = 'left'; }
  _beTxt(x, 'WEEK', gx1 - 60, gy0 + 62, { font: '600 18px Inter, sans-serif', col: 'rgba(220, 240, 255, 0.6)' });
  _beTxt(x, 'SKILL', gx0 - 20, gy1 - 26, { font: '600 18px Inter, sans-serif', col: 'rgba(220, 240, 255, 0.6)' });
  // both groups improve (illustrative shapes only)
  const ki = MathX.ramp(t, bnF(5, 'ten').start - 0.2, bnF(5, 'improved').start + 0.6);
  const curve = (f, col, a) => { x.strokeStyle = col; x.globalAlpha = a0 * a; x.lineWidth = 5; x.shadowColor = col; x.shadowBlur = 10; x.beginPath();
    const n = Math.floor(100 * ki); for (let j = 0; j <= n; j++) { const u = j / 100, X = gx0 + (gx1 - gx0) * u, Y = gy0 - (gy0 - gy1) * f(u); if (j) x.lineTo(X, Y); else x.moveTo(X, Y); } x.stroke(); x.shadowBlur = 0; x.globalAlpha = a0; };
  // the two groups' curves cross and end together: neither group is "better" (the study: neither age nor blindness limited learning)
  curve((u) => 0.15 + 0.6 * (1 - Math.exp(-u * 2.4)) / (1 - Math.exp(-2.4)) + 0.025 * Math.sin(u * 7.0), '#ffb05a', aw);
  curve((u) => 0.15 + 0.6 * (1 - Math.exp(-u * 2.0)) / (1 - Math.exp(-2.0)) - 0.025 * Math.sin(u * 6.0 + 0.6), '#62f3ff', as);
  const kb = MathX.smooth(t, bnF(5, 'both').start - 0.1, bnF(5, 'both').start + 0.4);
  _beTxt(x, 'BOTH GROUPS IMPROVED', X0 + PW / 2, Y0 + 245, { align: 'center', font: '700 34px Inter, sans-serif', col: `rgba(255, 240, 220, ${kb})` });
  _beTxt(x, 'NEITHER AGE NOR BLINDNESS LIMITED LEARNING', X0 + PW / 2, Y0 + 288, { align: 'center', font: '600 21px Inter, sans-serif', col: `rgba(255, 220, 180, ${0.85 * kb})` });
  _beTxt(x, 'curves illustrative', gx1, gy0 - 14, { align: 'right', font: 'italic 500 18px Inter, sans-serif', col: 'rgba(220, 240, 255, 0.45)' });
  x.globalAlpha = 1;
}
