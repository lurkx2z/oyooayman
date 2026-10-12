/* =====================================================================
   SCENE 6 — "What does an echo actually reveal?" (the practice room, weeks later).
     F1   she walks in from the corridor, confident now (reality, wide)
     F2   "…isn't like suddenly gaining a second pair of eyes." her, front; one click
     F3   "You don't see colors, read signs, or recognize someone's face": three things that are there in reality and
          NOT in sound: the mural's colours, the words on the board, the coach's face. Each starts real, then the click
          comes back from it: a flat plane, a flat panel, a rounded form. Nothing more.
     F4   "different surfaces…": the steel panel (strong, sharp return) and the blanket-covered block (faint, dull)
     F5   "…incomplete information … not a perfect picture … a collection of useful clues": from above, the room
          returns in fragments; for a moment the full picture (what sight gives) and back; then the clues are named
     F6   (no narration) three directions, three answers: the steel panel, the open door, the soft block
   ===================================================================== */

BE.s7 = BN_SC[7].start;
BE.f2 = bnF(6, 'echolocation').start - 0.25;
BE.f3a = bnE(6, 'you').start - 0.1;
BE.f3b = bnE(6, 'read').start - 0.12;
BE.f3c = bnE(6, 'or').start - 0.1;
BE.f4 = bnE(6, 'and').start - 0.1;
BE.f4b = bnE(6, 'some').start - 0.1;
BE.f4c = bnE(6, 'others').start - 0.1;
BE.f5 = bnE(6, 'so').start - 0.1;
BE.f5full = bnE(6, 'perfect').start - 0.25;
BE.f5clues = bnE(6, 'collection').start;
BE.f6 = BN_CLIP[6].speechEnd + 0.35;
const BE_F_SPOT = _V(1.1, 0, 0.6);
const _beYawTo = (p) => Math.atan2(p.x - BE_F_SPOT.x, p.z - BE_F_SPOT.z);
const BE_YAW_METAL = _beYawTo(BE_CTR.metal), BE_YAW_SOFT = _beYawTo(BE_CTR.soft), BE_YAW_DOOR = _beYawTo(_V(2.9, 0, 4.0));
BE.f6Clicks = [BE.f6 + 0.5, BE.f6 + 2.3, BE.f6 + 4.1];
BE.f5Clicks = [0.45, 2.0, 3.55, 5.1].map((o) => BE.f5 + o).concat([BE.f5clues - 0.45, BE.f5clues + 1.1]);
function BE_S6_CLICKS() { const B = BE; return [B.f2 + 2.9, B.f3a + 0.15, B.f3c + 0.6, B.f4b + 0.4, B.f4c + 0.4].concat(B.f5Clicks, B.f6Clicks); }

// her blocking in scene 6 (appended to scene 5's)
BE_HERO_CTR.push(
  { t0: BE.s6, t1: BE.f2 - 0.2, p0: _V(2.9, 0, 3.6), p1: BE_F_SPOT, cane: true, step: 0.5, face: 'calm' },
  { t0: BE.f2 - 0.2, p0: BE_F_SPOT, yaw: Math.PI, cane: true, face: 'calm' },
  { t0: BE.f3a - 0.01, p0: BE_F_SPOT, yaw: -Math.PI / 2, cane: true, face: 'focus' },
  { t0: BE.f3b - 0.01, p0: BE_F_SPOT, yaw: _beYawTo(_V(-5, 0, 2.0)), cane: true, face: 'focus' },
  { t0: BE.f3c - 0.01, p0: BE_F_SPOT, yaw: _beYawTo(_V(0.0, 0, -0.75)), cane: true, face: 'calm', smile: 0.12 },
  { t0: BE.f4 - 0.01, p0: BE_F_SPOT, yaw: (t) => MathX.lerp(BE_YAW_SOFT + 2 * Math.PI, BE_YAW_METAL, Ease.inOutSine(MathX.ramp(t, BE.f4 + 0.6, BE.f4 + 2.6))), cane: true, face: 'focus' },
  { t0: BE.f4b - 0.01, p0: BE_F_SPOT, yaw: BE_YAW_METAL, cane: true, face: 'focus' },
  { t0: BE.f4c - 0.01, p0: BE_F_SPOT, yaw: BE_YAW_SOFT, cane: true, face: 'focus' },
  { t0: BE.f5 - 0.01, p0: BE_F_SPOT, yaw: (t) => BE_YAW_SOFT + 0.6 * Math.sin((t - BE.f5) * 0.55) + 0.9, cane: true, face: 'focus' },
  { t0: BE.f6 - 0.01, p0: BE_F_SPOT, cane: true, face: 'focus',
    yaw: (t) => new Track([[BE.f6, BE_YAW_METAL], [BE.f6 + 1.1, BE_YAW_METAL], [BE.f6 + 1.8, BE_YAW_DOOR], [BE.f6 + 2.9, BE_YAW_DOOR], [BE.f6 + 3.6, BE_YAW_SOFT], [BE.s7, BE_YAW_SOFT]]).value(t) },
);
BE_COACH_CTR.push(
  { t0: BE.s6, p0: _V(-1.0, 0, -2.7), yaw: 0.55, pose: 'coachWatch', face: 'calm' },
  { t0: BE.f3c - 0.01, p0: _V(0.0, 0, -0.75), yaw: Math.atan2(1.1, 1.35), pose: 'coachWatch', face: 'calm', smile: 0.25 },
  { t0: BE.f4 - 0.01, p0: _V(-1.4, 0, -2.8), yaw: 0.5, pose: 'coachWatch', face: 'calm' },
);

// ---- the shots
(function () {
  const V = _V, B = BE;
  const ct = () => FILM._app.sets.centre;
  const head = () => ct().hero.worldOf('hd').add(V(0, 0.08, 0));
  const dark = (w = 0.012, h = 0.25) => ({ ac: 1, world: w, hero: h, glow: 0.03 });
  // reality → sound: the picture drains and the click's return remains
  const drain = (t0) => (t) => { const k = MathX.smooth(t, t0, t0 + 0.55); return { ac: k, world: MathX.lerp(1, 0.012, k), hero: MathX.lerp(1, 0.04, k), glow: MathX.lerp(1, 0.03, k) }; };
  const lab = (p, html, a, cls) => ({ p, html, a, cls });
  const S = [
    { id: 'F1', t0: B.s6, t1: B.f2, set: 'centre', look: () => BE_REAL,
      cam: beMove(B.s6, B.f2, [V(-3.8, 2.9, -2.9), V(2.0, 0.9, 2.2), 46], [V(-3.4, 2.5, -2.4), V(1.3, 0.9, 1.2), 42], { dof: 0.3 }) },
    { id: 'F2', t0: B.f2, t1: B.f3a, set: 'centre', look: () => BE_REAL,
      cam: (t) => { const h = head(), k = Ease.inOutSine(MathX.ramp(t, B.f2, B.f3a)); return { pos: V(h.x + 0.35, h.y + 0.02, h.z - 1.9 + 0.5 * k), at: V(h.x, h.y - 0.12, h.z), fov: 32, focus: 1.6, dof: 0.8 }; } },
    { id: 'F3a', t0: B.f3a, t1: B.f3c, set: 'centre', tag: true, look: drain(B.f3a + 0.45), decay: 2.2, gain: 1.4,
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.f3a + 0.6, B.f3b + 0.25)); return { pos: V(-2.0 - 0.3 * k, 1.7, MathX.lerp(-0.7, 1.5, k)), at: V(-5, MathX.lerp(1.7, 1.5, k), MathX.lerp(-1.2, 2.0, k)), fov: 52, focus: 3, dof: 0 }; },
      labels: (t) => [lab(V(-4.9, 2.75, -1.2), '<div class="k">COLOURS</div><div class="s">NOT IN THE ECHO</div>', MathX.smooth(t, B.f3a + 0.7, B.f3a + 1.0)),
        lab(V(-4.9, 2.35, 2.0), '<div class="k">WORDS</div><div class="s">NOT IN THE ECHO</div>', MathX.smooth(t, B.f3b + 0.2, B.f3b + 0.45))] },
    { id: 'F3c', t0: B.f3c, t1: B.f4, set: 'centre', tag: true, look: drain(B.f3c + 0.7), decay: 0.6, gain: 1.4, heroGain: 1.2,
      cam: (t) => { const h = ct().coach.worldOf('hd').add(V(0, 0.08, 0)), k = MathX.ramp(t, B.f3c, B.f4); return { pos: V(h.x + 0.62 - 0.08 * k, h.y + 0.02, h.z + 0.52 - 0.06 * k), at: V(h.x, h.y - 0.04, h.z), fov: 30, focus: 0.8, dof: 0.8 }; },
      labels: (t) => [lab(ct().coach.worldOf('hd').add(V(0, 0.42, 0)), '<div class="k">A FACE</div><div class="s">ONLY A ROUNDED SHAPE</div>', MathX.smooth(t, B.f3c + 1.1, B.f3c + 1.4))] },
    { id: 'F4', t0: B.f4, t1: B.f4b, set: 'centre', look: () => BE_REAL,
      cam: beMove(B.f4, B.f4b, [V(-0.4, 3.4, -3.4), V(0.9, 0.7, 0.3), 50], [V(0.2, 3.5, -3.6), V(0.9, 0.7, 0.3), 50], { dof: 0.2 }) },
    { id: 'F4b', t0: B.f4b, t1: B.f4c, set: 'centre', tag: true, decay: 0.7, gain: 1.4, look: () => dark(),
      cam: beMove(B.f4b, B.f4c, [V(-0.3, 1.8, 1.0), V(3.1, 1.1, -1.8), 50], [V(-0.1, 1.75, 0.8), V(3.1, 1.1, -1.8), 48], { dof: 0 }) },
    { id: 'F4c', t0: B.f4c, t1: B.f5, set: 'centre', tag: true, decay: 0.7, gain: 1.4, look: () => dark(),
      cam: beMove(B.f4c, B.f5, [V(1.9, 1.6, 1.6), V(-1.4, 0.6, 2.3), 50], [V(1.7, 1.6, 1.5), V(-1.4, 0.6, 2.3), 48], { dof: 0 }) },
    { id: 'F5', t0: B.f5, t1: B.f6, set: 'centre', tag: true, plan: true, decay: 0.75, gain: 1.5, heroGain: 0.9,
      // "…a perfect picture": for a moment the room as SIGHT gives it (the real picture, labelled), then back to the clues
      look: (t) => { const k = MathX.window(t, B.f5full, B.f5full + 1.1, 0.35, 0.45); return { ac: 1 - k, world: MathX.lerp(0.012, 1, k), hero: MathX.lerp(0.25, 1, k), glow: MathX.lerp(0.03, 1, k) }; },
      cam: (t) => { const a = MathX.lerp(-2.5, -1.6, MathX.ramp(t, B.f5, B.f6)); return { pos: V(0.6 + 7.2 * Math.sin(a), 6.4, 0.3 + 7.2 * Math.cos(a)), at: V(0.4, 0.4, 0.2), fov: 48, focus: 8, dof: 0 }; },
      labels: (t) => { const k = (i) => MathX.smooth(t, B.f5clues + 0.25 + i * 0.35, B.f5clues + 0.6 + i * 0.35) * (1 - MathX.smooth(t, B.f6 - 0.4, B.f6));
        const kf = MathX.window(t, B.f5full, B.f5full + 1.1, 0.3, 0.35);
        return [lab(V(0.4, 3.6, 0.2), '<div class="k">WHAT SIGHT GIVES</div><div class="s">NOT WHAT AN ECHO GIVES</div>', kf, 'w'), lab(V(-0.6, 3.0, -4.0), '<div class="k">A WALL</div>', k(0)), lab(V(2.9, 2.6, 4.0), '<div class="k">AN OPENING</div>', k(1)),
          lab(V(3.2, 2.6, -1.9), '<div class="k">SOMETHING HARD</div>', k(2)), lab(V(-1.4, 1.75, 2.3), '<div class="k">SOMETHING SOFT</div>', k(3))]; } },
    { id: 'F6', t0: B.f6, t1: B.s7, set: 'centre', tag: true, plan: true, decay: 0.8, gain: 1.6, heroGain: 1.0, look: () => dark(0.012, 0.35),
      cam: beMove(B.f6, B.s7, [V(0.9, 8.2, 3.6), V(0.9, 0, 0.7), 54], [V(0.9, 7.6, 3.3), V(0.9, 0, 0.7), 54], { dof: 0, ease: Ease.outSine }) },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s7;
})();

// ---- pulses (scene 6)
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, B = BE, set = app.sets.centre, H = set.hero;
  const add = (t, sh, o = {}) => { FILM._shot = beShotAt(t + 0.01); beActor(H, t + 0.01, BE_HERO_CTR, { cane: set.cane }); const m = beMouth(H);
    P.add(Object.assign({ t, p: m, kind: 0, speed: 4.0, w: 0.09, life: 2.4, str: 1.5, set: 'centre', shot: sh, click: true }, o)); return m; };
  add(B.f2 + 2.9, 'F2', { str: 0 });
  add(B.f3a + 0.15, 'F3a', { speed: 12, life: 3.5 }); add(B.f3c + 0.6, 'F3c', { speed: 3.5 });
  add(B.f4b + 0.4, 'F4b', { str: 1.8 }); add(B.f4c + 0.4, 'F4c', { str: 1.8 });
  for (const t of B.f5Clicks) add(t, 'F5', { speed: 3.6, life: 2.6 });
  for (const t of B.f6Clicks) add(t, 'F6', { speed: 3.8, life: 2.4, str: 1.7 });
  FILM._shot = null;
});
