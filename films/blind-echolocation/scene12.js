/* =====================================================================
   SCENE 12 — "The final experiment" (arena.js: the old drill hall at dusk). Months later.
     M1   "Months ago, even finding your way across a bedroom felt unfamiliar.": she comes in through the big doors
          with her instructor and crosses the floor to the start, steady (MONTHS LATER)
     M2   "Now, you've learned to recognize patterns in reflected sound.": two clicks; the hall answers (the sound view
          from above: the shells reach walls 11 m off and the roof, the answers come back late and long)
     M3   "So let's try one last experiment.": the instructor's hand on her shoulder, a step back; the lamps go out bank
          by bank, from the far end toward them
     M4   "A large room. An obstacle ahead. Two possible passages.": the sweep: a crane over the course (labels)
     M5a  "No visual information.": close on her face; the picture goes dark
     M5b  "Just the tools and skills you've practiced.": low, her cane; she sets off; each tap a small ring
     M6   "Could you work out where the open route begins?": behind her, in the dark, walking
     G1   (no narration, 9.6 s) click: the camera follows the wave; the obstacle's face answers, broad and strong
     G23  click to the left: the bay rings with close echoes (enclosed); click to the right: the sound carries on into
          the open passage (open)
     G4   she turns right; the cane finds the obstacle's end; she goes through the passage, and the picture comes back
   ===================================================================== */
BE.m2 = bnE(12, 'now').start - 0.3;
BE.m3 = bnE(12, 'so').start - 0.3;
BE.m4 = bnE(12, 'large').start - 0.45;
BE.m5 = bnE(12, 'no').start - 0.3;
BE.m5b = bnE(12, 'just').start - 0.25;
BE.m6 = bnE(12, 'could').start - 0.3;
BE.m7 = BN_CLIP[12].speechEnd + 0.15;
BE.m7b = BE.m7 + 1.95;
BE.m8 = BE.m7 + 6.1;
BE.s13 = BN_SC[13].start;
BE.mL2 = [bnE(12, 'learned').start + 0.05, bnE(12, 'reflected').start + 0.62];
BE.mC = [BE.m7 + 0.55, BE.m7 + 2.2, BE.m7 + 4.3];
BE.mDim = BE.m3 + 0.55;
BE.mTouch = [BE.m3 + 0.25, BE.m3 + 1.5];
BE.mWalk = [BE.m5b + 0.45, BE.m7 + 0.55];
BE.mGo = [BE.m8 + 0.05, BE.m8 + 1.6];
BE.mTap = BE.m8 + 1.8;
BE.mThru = [BE.m8 + 2.05, BE.s13 + 0.8];
BE.mRet = BE.mThru[0] + 0.6;
BE.mOut = [BE.s13 + 0.8, BE.s13 + 5.2];

// the lamps go out from the far end toward her (each bank 0.25 s; the whole hall in ≈ 1.6 s); a few stay faintly on
function beArenaDim(x, t) { const t0 = BE.mDim + (32 - x) / 36 * 1.6; return 1 - 0.93 * MathX.smooth(t, t0, t0 + 0.22); }

const _beM = (x, z) => new THREE.Vector3(x, 0, z);
const BE_M = { door: _beM(-6.3, 0.35), S: _beM(0, 0), P: _beM(5.0, 0.8), Q: _beM(6.1, 2.75), R: _beM(8.7, 4.0), E: _beM(13.0, 3.1),
  cDoor: _beM(-6.5, -0.65), c0: _beM(-0.55, -0.7), c1: _beM(-1.6, -2.1), c2: _beM(3.0, -1.7) };

BE_SET_BUILDERS.push((app, cast) => {
  const ar = app.sets.arena = new BeArena().build();
  ar.scene.environment = beEnvFor(app.renderer, '#5a6a90', '#a08a78', '#3a2e28');
  ar.scene.fog = new THREE.FogExp2('#1a2030', 0.012);
  ar.hero = cast.heroIn(ar.scene, 'noorC');
  ar.cane = beCane(ar.scene);
  ar.coach = new GbCharacter(ar.scene, 'coach', { name: 'coachArena' }); beAcousticScene(ar.coach.root, 'world');
  ar.coach.J.hc.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
  ar.frame = beArenaFrame; ar.fx = beArenaFx;
  ar.update = function (t, L) { const lit = L.ac > 0.5 ? L.world : 1; this.light((x) => beArenaDim(x, t), lit); this.scene.fog.density = L.ac > 0.5 ? 0 : 0.012; };
});

// her blocking: in from the doors to the start; the clicks; the careful walk to the obstacle; the test; through
const BE_HERO_ARENA = (() => {
  const B = BE, K = BE_M, yawPQ = Math.atan2(K.Q.x - K.P.x, K.Q.z - K.P.z);
  return [
    { t0: B.s12 - 0.3, t1: B.m2 + 0.5, p0: K.door, p1: K.S, cane: true, step: 0.5, face: 'calm' },
    { t0: B.m2 + 0.5, p0: K.S, cane: true, face: 'focus', yaw: (t) => MathX.lerp(Math.atan2(-K.door.x, -K.door.z), Math.PI / 2, MathX.smooth(t, B.m2 + 0.5, B.m2 + 1.4)),
      hdY: (t) => 14 * MathX.window(t, B.mTouch[0], B.mTouch[1] + 0.4, 0.3, 0.5) + 4 * Math.sin((t - B.m2) * 0.7) * MathX.smooth(t, B.m4, B.m5),
      adjust: (P, t) => { const k = MathX.window(t, B.m5 + 0.3, B.m5b + 0.6, 0.5, 0.6); P.hdX = (P.hdX || 0) - 3 * k; } },
    { t0: B.mWalk[0], t1: B.mWalk[1], p0: K.S, p1: K.P, cane: true, step: 0.36, face: 'focus' },
    // at the obstacle: a click ahead; head to the left, a click; to the right, a click; then she turns right
    { t0: B.mWalk[1], p0: K.P, cane: true, face: 'focus',
      yaw: (t) => MathX.lerp(Math.atan2(K.P.x - K.S.x, K.P.z - K.S.z), yawPQ, MathX.smooth(t, B.m8 - 0.35, B.m8 + 0.1)),
      hdY: (t) => 58 * MathX.window(t, B.mC[1] - 0.5, B.mC[1] + 0.9, 0.35, 0.35) - 58 * MathX.window(t, B.mC[2] - 0.5, B.mC[2] + 0.8, 0.35, 0.3),
      adjust: (P, t) => { const k = MathX.window(t, B.mC[0] - 0.3, B.mC[0] + 0.9, 0.2, 0.4); P.hdX = (P.hdX || 0) - 4 * k; } },
    { t0: B.mGo[0], t1: B.mGo[1], p0: K.P, p1: K.Q, cane: true, step: 0.38, face: 'focus' },
    // the check: the cane reaches left and finds the obstacle's end (its edge at x 7, z 3)
    { t0: B.mGo[1], p0: K.Q, cane: true, face: 'focus', yaw: (t) => MathX.lerp(yawPQ, Math.atan2(K.R.x - K.Q.x, K.R.z - K.Q.z), MathX.smooth(t, B.mTap + 0.1, B.mThru[0])),
      sweep: (t) => -0.95 * MathX.window(t, B.mGo[1] + 0.02, B.mTap + 0.15, 0.15, 0.12), lift: (t) => 0.03 * MathX.window(t, B.mTap - 0.04, B.mTap + 0.1, 0.03, 0.05),
      hdY: (t) => 10 * MathX.window(t, B.mGo[1], B.mTap + 0.3, 0.2, 0.3), tipStop: { c: new THREE.Vector3(BE_ARENA.O.x + 0.06, 0, BE_ARENA.O.z1 - 0.06), r: 0.12 } },
    { t0: B.mThru[0], t1: B.mThru[1], p0: K.Q, p1: K.R, cane: true, step: 0.42, face: 'calm' },
    { t0: B.mOut[0], t1: B.mOut[1], p0: K.R, p1: K.E, cane: true, step: 0.46, face: 'calm' },
    { t0: B.mOut[1], p0: K.E, cane: true, face: 'calm', yaw: Math.atan2(K.E.x - K.R.x, K.E.z - K.R.z) },
  ];
})();
const BE_COACH_ARENA = (() => {
  const B = BE, K = BE_M, toN = (p) => (t) => { const h = FILM._app.sets.arena.hero.root.position; return Math.atan2(h.x - p.x, h.z - p.z); };
  return [
    { t0: B.s12 - 0.3, t1: B.m2 + 0.4, p0: K.cDoor, p1: K.c0, pose: 'stand', step: 0.52, face: 'calm' },
    { t0: B.m2 + 0.4, p0: K.c0, pose: 'stand', face: 'content', yaw: toN(K.c0),
      after: (H, t) => { const w = MathX.window(t, B.mTouch[0], B.mTouch[1], 0.35, 0.4); if (w > 0.001) { const N = FILM._app.sets.arena.hero; H.solveArm('L', N.worldOf('LSh').add(new THREE.Vector3(0, 0.03, 0)), new THREE.Vector3(0, -1, -0.4), w); } } },
    { t0: B.mTouch[1] + 0.15, t1: B.mTouch[1] + 1.5, p0: K.c0, p1: K.c1, pose: 'stand', step: 0.4, face: 'calm' },
    { t0: B.mTouch[1] + 1.5, p0: K.c1, pose: 'coachWatch', face: 'calm', yaw: toN(K.c1) },
    { t0: B.m7 - 1.0, t1: B.m7 + 2.4, p0: K.c1, p1: K.c2, pose: 'stand', step: 0.5, face: 'calm' },
    { t0: B.m7 + 2.4, p0: K.c2, pose: 'coachWatch', face: 'calm', yaw: toN(K.c2), hdY: (t) => 6 * Math.sin((t - B.m7) * 0.5) },
  ];
})();
function beArenaClicks() { return BE.mL2.concat(BE.mC); }

function beArenaFrame(app, t, shot) {
  const set = this;
  set.doors.forEach((d, i) => { d.rotation.y = (i ? -1 : 1) * 1.3 * (1 - MathX.smooth(t, BE.s12 + 1.2, BE.s12 + 3.2)); });
  set._act = beActor(set.hero, t, BE_HERO_ARENA, { cane: set.cane, clicks: beArenaClicks(), blinks: [BE.s12 + 1.8, BE.m3 + 1.4, BE.m5 + 1.6, BE.m6 + 1.2, BE.m8 + 1.0] });
  beActor(set.coach, t, BE_COACH_ARENA, { blinks: [BE.s12 + 2.4, BE.m4 + 1.2, BE.m7 + 0.8] });
  if (shot.fp) set.hero.root.visible = false;
}
// her cane's taps (small rings where the tip lands)
const _beArenaTaps = () => { if (!BE._arenaTaps) { BE._arenaTaps = []; for (const sg of BE_HERO_ARENA) for (const t of beCaneTaps(sg)) BE._arenaTaps.push(t); BE._arenaTaps.push(BE.mTap); } return BE._arenaTaps; };
function beArenaFx(app, t, shot, L) {
  const set = this, R = set.rings, Wv = set.waves, Pl = set.planes;
  if (L.ac < 0.5) return;
  for (const q of app.pulses.list) {
    if (q.set !== 'arena' || !q.click || (q.shot && q.shot !== shot.id)) continue;
    if (t > q.t && t < q.t + 0.45 && !shot.fp) R.source(q.p, [q.t], t, { r: 0.07, a: 0.8, dur: 0.45, col: '#9ff6ff' });
    if (t > q.t && t < q.t + q.life) Wv.click(q, t, q.planes.map((k) => Pl[k]), { speed: q.speed, life: q.life, a: q.shellA || 0.12, clip: q.beam ? [q.p, q.beam] : null });
  }
  if (set._tips) for (const [tt, p] of set._tips) if (t > tt && t < tt + 0.6) R.source(p, [tt], t, { r: 0.18, a: 0.7, dur: 0.6, col: '#9ff6ff', th: 0.1, squash: 0.35 });
}

// the pulses: the hall's answer (M2); the cane's taps; the three clicks of the test and what comes back
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, a = app.sets.arena, B = BE, mouth = (t, sh) => { FILM._shot = BE_SHOTS.find((s) => s.id === sh); beActor(a.hero, t, BE_HERO_ARENA, { cane: a.cane }); return beMouth(a.hero); };
  for (const t of B.mL2) P.add({ t, p: mouth(t, 'M2'), kind: 0, speed: 7.0, w: 0.28, life: 3.8, str: 3.2, set: 'arena', shot: 'M2', click: true, planes: ['floor', 'north', 'south', 'far', 'roof', 'obstacle'], shellA: 0.16 });
  // the cane's taps (the tip's position at each tap)
  a._tips = [];
  for (const t of _beArenaTaps()) { if (t < B.m5b) continue; FILM._shot = BE_SHOTS.find((s) => s.t0 <= t && s.t1 > t) || null; const r = beActor(a.hero, t, BE_HERO_ARENA, { cane: a.cane }); if (r.tip) { const p = r.tip.clone(); p.y = 0.02; a._tips.push([t, p]);
    for (const sh of ['M5b', 'M6', 'G23', 'G4']) P.add({ t, p, kind: 0, speed: 2.2, w: 0.05, life: 0.9, str: t === B.mTap ? 1.0 : 0.45, set: 'arena', shot: sh }); } }
  // G1: ahead. The obstacle's face 2 m off answers broad and strong (the image source behind it sends the return back)
  { const t = B.mC[0], p = mouth(t, 'G1'), O = BE_ARENA.O, img = p.clone(); img.x = 2 * O.x - p.x;
    P.add({ t, p, kind: 0, speed: 3.4, w: 0.11, life: 2.0, str: 1.1, set: 'arena', shot: 'G1', click: true, planes: ['obstacle', 'floor'], shellA: 0.2 });
    P.add({ t, p: img, kind: 0, speed: 3.4, w: 0.1, life: 1.6, str: 0.7, set: 'arena', shot: 'G1' }); }
  // G23 left: the bay. Its walls are close on every side: the returns pile up (violet, quick repeats)
  { const t = B.mC[1], p = mouth(t, 'G23');
    P.add({ t, p, kind: 0, speed: 4.5, w: 0.1, life: 1.1, str: 0.75, set: 'arena', shot: 'G23', click: true, planes: ['bayA', 'bayBack', 'floor'], shellA: 0.08, beam: new THREE.Vector3(0.6, 0, -0.8) });
    const pts = [[6.6, 1.3, -4.4], [8.4, 1.2, -5.15], [10.9, 1.2, -4.1], [9.2, 1.4, -3.05], [7.2, 1.0, -3.3]];
    pts.forEach(([x, y, z], k) => { const q = new THREE.Vector3(x, y, z), d = q.distanceTo(p) / 4.5;
      for (let j = 0; j < 4; j++) P.add({ t: t + d + j * 0.16 + k * 0.03, p: q, kind: 2, speed: 2.6, w: 0.07, life: 0.9, str: 0.85 * Math.pow(0.62, j), set: 'arena', shot: 'G23' }); }); }
  // G23 right: the passage. Nothing close answers; the sound goes on into the open hall, fainter and fainter
  { const t = B.mC[2], p = mouth(t, 'G23');
    P.add({ t, p, kind: 0, speed: 4.5, w: 0.1, life: 2.0, str: 0.75, set: 'arena', shot: 'G23', click: true, planes: [], shellA: 0.1, beam: new THREE.Vector3(0.5, 0, 0.87) });
    [[7.1, 1.1, 4.0, 1.0], [9.6, 1.0, 4.4, 0.8], [12.8, 1.0, 4.6, 0.6], [16.5, 1.0, 4.8, 0.42], [21.0, 1.0, 5.0, 0.28]].forEach(([x, y, z, s]) => { const q = new THREE.Vector3(x, y, z);
      P.add({ t: t + q.distanceTo(p) / 4.5, p: q, kind: 0, speed: 3.0, w: 0.09, life: 1.1, str: s, set: 'arena', shot: 'G23' }); }); }
  FILM._shot = null;
});

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE, K = BE_M;
  const ar = () => FILM._app.sets.arena, hp = () => ar().hero.root.position, head = () => ar().hero.worldOf('hd');
  const ac = (w = 0.03, h = 0.3) => ({ ac: 1, world: w, hero: h, glow: 0.04 });
  const lab = (p, html, a, cls, dx, dy) => ({ p, html, a, cls, dx, dy });
  const win = (t, a, b, i = 0.3, o = 0.35) => MathX.smooth(t, a, a + i) * (1 - MathX.smooth(t, b - o, b));
  const g4cam = beMove(B.m8, B.s13, [V(13.6, 1.85, 5.25), V(6.3, 0.95, 3.0), 42], [V(13.2, 1.75, 5.0), V(7.8, 1.0, 3.6), 40], { dof: 0.1, focus: (t, pos) => pos.distanceTo(hp()) });
  const S = [
    // M1: low, near the start, looking back at the doors: they come in and cross the floor toward us
    { id: 'M1', t0: B.s12, t1: B.m2, set: 'arena', look: () => BE_REAL, week: () => '<span>MONTHS</span> LATER',
      cam: beMove(B.s12, B.m2, [V(6.4, 3.1, 5.4), V(-6.2, 2.3, -0.4), 50], [V(4.4, 2.4, 4.3), V(-2.6, 1.45, -0.3), 45], { dof: 0.12, focus: (t, pos) => pos.distanceTo(hp()) }) },
    // M2: the hall answers: from high behind, the click's shell grows through the dark hall; the walls answer late
    { id: 'M2', t0: B.m2, t1: B.m3, set: 'arena', tag: true, look: () => ac(0.025, 0.4), decay: 0.6, gain: 1.4, heroGain: 0.6, shells: false,
      cam: beMove(B.m2, B.m3, [V(21.5, 8.6, 3.6), V(0.6, 0.7, -0.7), 50], [V(20.0, 8.5, 3.3), V(0.4, 0.7, -0.6), 48], { dof: 0 }),
      labels: (t) => [lab(V(2.5, 2.6, -10.5), '<div class="k">THE FAR WALLS ANSWER LATE</div><div class="s">≈ 65 ms · A LARGE ROOM</div>', win(t, B.mL2[0] + 1.6, B.m3, 0.4, 0.4))] },
    // M3: behind the pair, down the hall: the instructor's hand on her shoulder; the lamps go out, far end first
    { id: 'M3', t0: B.m3, t1: B.m4, set: 'arena', look: () => BE_REAL,
      cam: beMove(B.m3, B.m4, [V(-4.6, 2.3, 2.6), V(8, 2.9, -1.2), 50], [V(-4.9, 2.45, 2.75), V(8, 3.2, -1.2), 52], { dof: 0.12, focus: (t, pos) => pos.distanceTo(hp()) }) },
    // M4: the sweep: up from behind her, forward over the obstacle; the course from above
    { id: 'M4', t0: B.m4, t1: B.m5, set: 'arena', look: () => BE_REAL,
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.m4, B.m5)), u = Math.sin(k * Math.PI);   // a crane up behind her, the course opening out below
        const pos = V(MathX.lerp(-3.8, -1.4, k), MathX.lerp(2.5, 7.9, k), MathX.lerp(0.9, 1.0, k) + 0.6 * u);
        const at = V(MathX.lerp(7.0, 8.0, k), MathX.lerp(1.3, 0.0, k), MathX.lerp(0.1, 0.5, k)); return { pos, at, fov: MathX.lerp(48, 58, k), focus: pos.distanceTo(at), dof: 0 }; },
      labels: (t) => [
        lab(V(18, 4.5, 0), '<div class="k">A LARGE ROOM</div><div class="s">42 × 22 m</div>', win(t, bnE(12, 'large').start - 0.1, bnE(12, 'obstacle').start - 0.1, 0.3, 0.4)),
        lab(V(BE_ARENA.O.x, 3.35, 0), '<div class="k">OBSTACLE</div>', win(t, bnE(12, 'obstacle').start - 0.05, B.m5, 0.3, 0.4)),
        lab(V(7.0, 2.0, -4.1), '<div class="k">PASSAGE ?</div>', win(t, bnE(12, 'two').start, B.m5, 0.3, 0.4)),
        lab(V(7.0, 2.0, 4.0), '<div class="k">PASSAGE ?</div>', win(t, bnE(12, 'passages').start - 0.1, B.m5, 0.3, 0.4)),
        lab(V(-0.4, 0.1, 0), '<div class="k">START</div>', win(t, B.m4 + 0.3, bnE(12, 'obstacle').start, 0.3, 0.4))] },
    // M5a: close on her face; "no visual information": the picture goes dark around her
    { id: 'M5a', t0: B.m5, t1: B.m5b, set: 'arena', tag: false,
      look: (t) => { const k = MathX.smooth(t, B.m5 + 0.35, B.m5 + 1.25); return k < 0.02 ? BE_REAL : { ac: 1, world: MathX.lerp(0.6, 0.02, k), hero: MathX.lerp(0.9, 0.5, k), glow: 0.03 }; },
      decay: 0.5, gain: 1.2, heroGain: 0.8, shells: false,
      cam: (t) => { const h = head(), k = Ease.inOutSine(MathX.ramp(t, B.m5, B.m5b)); return { pos: V(h.x + 0.95 - 0.12 * k, h.y + 0.02, h.z + 0.7 - 0.08 * k), at: V(h.x, h.y - 0.05, h.z), fov: 34, focus: 1.15, dof: 0.6 }; } },
    // M5b: low beside her: the cane; she sets off, each tap a small ring
    { id: 'M5b', t0: B.m5b, t1: B.m6, set: 'arena', tag: true, look: () => ac(0.02, 0.45), decay: 0.5, gain: 1.3, heroGain: 0.7, shells: false,
      cam: (t) => { const h = hp(); return { pos: V(h.x + 0.35, 0.42, h.z - 1.75), at: V(h.x + 1.0, 0.32, h.z), fov: 50, focus: 1.8, dof: 0 }; } },
    // M6: behind her, in the dark, as she walks toward what she cannot see
    { id: 'M6', t0: B.m6, t1: B.m7, set: 'arena', tag: true, look: () => ac(0.018, 0.4), decay: 0.5, gain: 1.3, heroGain: 0.7, shells: false,
      cam: (t) => { const h = hp(); return { pos: V(h.x - 1.6, 1.78, h.z + 0.55), at: V(h.x + 4, 1.05, h.z - 0.1), fov: 52, focus: 2, dof: 0 }; } },
    // G1: click; the camera goes with the wave; the obstacle's face answers broad
    { id: 'G1', t0: B.m7, t1: B.m7b, set: 'arena', tag: true, look: () => ac(0.02, 0.35), decay: 0.5, gain: 1.5, heroGain: 0.6, shells: false,
      cam: beMove(B.mC[0] - 0.2, B.mC[0] + 1.0, [V(3.4, 1.72, 1.35), V(7.0, 1.3, 0.6), 54], [V(4.9, 1.66, 1.4), V(7.0, 1.3, 0.5), 60], { dof: 0, ease: Ease.inOutCubic }),
      labels: (t) => [lab(V(BE_ARENA.O.x - 0.1, 2.25, 0.2), '<div class="k">A BROAD, STRONG ECHO</div><div class="s">SOMETHING LARGE, CLOSE AHEAD</div>', win(t, B.mC[0] + 0.6, B.m7b, 0.25, 0.25))] },
    // G23: high behind her, both ways in frame: left, the bay rings (enclosed); right, the sound carries on (open)
    // (high above and behind her, the course as the sweep showed it: the bay on her left, the passage on her right)
    { id: 'G23', t0: B.m7b, t1: B.m8 + 1.3, set: 'arena', tag: true, look: () => ac(0.022, 0.4), decay: 0.5, gain: 1.5, heroGain: 0.6, shells: false,
      cam: beMove(B.m7b, B.m8 + 1.3, [V(0.5, 7.7, 0.3), V(8.2, 0.0, 0.2), 56], [V(1.3, 7.5, 0.5), V(8.4, 0.0, 0.4), 54], { dof: 0 }),
      labels: (t) => [lab(V(8.6, 1.7, -4.15), '<div class="k">ENCLOSED</div><div class="s">ECHOES CLOSE ON EVERY SIDE</div>', win(t, B.mC[1] + 0.75, B.m8 + 1.3, 0.3, 0.3)),
        lab(V(9.6, 1.7, 4.2), '<div class="k">OPEN</div><div class="s">THE SOUND CARRIES ON</div>', win(t, B.mC[2] + 0.75, B.m8 + 1.3, 0.25, 0.25))] },
    // G4: from the open side of the passage: she turns, the cane finds the obstacle's end, she comes through;
    // G4r: the same move, the picture back (the route was hers before the light was)
    { id: 'G4', t0: B.m8 + 1.3, t1: B.mRet, set: 'arena', tag: true, cam: (t) => g4cam(t),
      look: (t) => ac(MathX.lerp(0.025, 0.3, MathX.smooth(t, B.mThru[0] - 0.2, B.mRet)), MathX.lerp(0.62, 0.8, MathX.smooth(t, B.mThru[0] - 0.2, B.mRet))),
      decay: 0.5, gain: 1.4, heroGain: 0.7, shells: false,
      labels: (t) => [lab(V(BE_ARENA.O.x, 0.75, BE_ARENA.O.z1), '<div class="k">THE CANE CONFIRMS THE EDGE</div>', win(t, B.mTap + 0.05, B.mRet, 0.2, 0.2))] },
    { id: 'G4r', t0: B.mRet, t1: B.s13, set: 'arena', look: () => BE_REAL, cam: (t) => g4cam(t) },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s13;
})();
