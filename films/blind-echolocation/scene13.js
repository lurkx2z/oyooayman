/* =====================================================================
   SCENE 13 — "A different way to understand part of it". The camera rises out of the hall; the room dissolves into
   sound, and the sound opens onto the city around it: a metaphor, drawn only by what is heard, and only while it lasts.
     N1   "Think about how extraordinary that is.": she walks out of the passage into the open hall; the camera rises
          away from her (the picture)
     N2   "You began by losing one way… information you once ignored.": she clicks, the picture gives way to the sound
          view; up through the roof (it dissolves): the hall from above, its walls lit only when her clicks reach them;
          on "information you once ignored" the instructor's steps, small and amber
     C1   "Not every blind person uses echolocation. And learning it doesn't give anyone supernatural abilities.": the
          rise goes on and the city appears around the hall, as sound: traffic (amber) along the streets, footsteps on
          the pavements, the fountain in the square, the weir on the river. Most of it stays dark
     C2   "But for some people, reflected sound… navigating space.": down to a woman with a cane at the corner by the
          square: her clicks find the parked cars, the lamp post, the building's corner, the kerb under her cane
     C3   "The world hasn't become visible again. You've simply learned a different way to understand part of it.": up
          and over to the bridge: a man with a cane crossing; his clicks answer from the rails and the water
     G    (no narration, 6 s) three measured clicks: hers in the hall, the corner, the bridge; the music peaks; the
          picture goes to black
   ===================================================================== */
BE.n2 = bnE(13, 'is').start + 0.07;
BE.nCl = [BE.n2, bnE(13, 'losing').start + 0.3, bnE(13, 'time').start + 0.12, bnE(13, 'support').start + 0.5, bnE(13, 'ignored').start + 0.12];
BE.nIgn = [bnE(13, 'information').start, bnE(13, 'ignored').start + 0.6];
BE.n3 = bnE(13, 'not').start - 0.3;
BE.n4 = bnE(13, 'for').start - 0.3;
BE.n5 = bnE(13, "hasn't").start - 0.55;
BE.ng = BN_CLIP[13].speechEnd;
BE.s14 = BN_SC[14].start;
BE.nG = [BE.ng + 0.4, BE.ng + 1.9, BE.ng + 3.4];
BE.nA = { walk: [BE.n3 - 6, bnE(13, 'reflected').start - 0.35], clicks: [bnE(13, 'reflected').start + 0.1, bnE(13, 'useful').start + 0.05, bnE(13, 'space').start + 0.05, BE.nG[1]], tap: bnE(13, 'genuinely').start + 0.1 };
BE.nB = { walk: [BE.n3 - 4, BE.s14 + 2], clicks: [bnE(13, 'visible').start + 0.1, bnE(13, 'different').start + 0.1, BE.nG[2]] };

const _beN = (x, z) => new THREE.Vector3(x, 0, z);
const BE_N = { A0: _beN(96, -30.4), A1: _beN(78.6, -30.4), B0: _beN(77.4, 112), B1: _beN(77.4, 150) };
// the people on the pavements (their footsteps are the small rings): [along 'x' | 'z', line, speed, phase]
const BE_SF_PEDS = (() => { const r = new RNG(1302), out = [];
  for (const [z, w] of BE_SF.roadsZ) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) out.push(['x', z + s * (w / 2 + 1.6), r.range(1.1, 1.5) * (r.next() < 0.5 ? -1 : 1), r.range(0, 660)]);
  for (const [x, w] of BE_SF.roadsX) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) out.push(['z', x + s * (w / 2 + 1.6), r.range(1.1, 1.5) * (r.next() < 0.5 ? -1 : 1), r.range(0, 600)]);
  return out; })();
function beSfPedAt(i, t) {
  const [k, line, v, ph] = BE_SF_PEDS[i], E = BE_SF.ext, L0 = k === 'x' ? E.x0 : E.z0, span = k === 'x' ? E.x1 - E.x0 : E.z1 - E.z0, u = L0 + (((ph + v * t) % span) + span) % span;
  return k === 'x' ? new THREE.Vector3(u, 0.05, line) : new THREE.Vector3(line, 0.05, u);
}

// the people the camera meets: Noor (still in the hall), the instructor, the woman at the corner, the man on the bridge
const BE_SF_CAST = (() => {
  const B = BE, K = BE_M, N = BE_N, yE = Math.atan2(K.E.x - K.R.x, K.E.z - K.R.z);
  return {
    noor: [{ t0: 0, p0: K.E, cane: true, face: 'calm', yaw: yE, hdY: (t) => 6 * Math.sin((t - B.n3) * 0.4) }],
    coach: [{ t0: 0, p0: K.c2, pose: 'coachWatch', face: 'calm', yaw: Math.atan2(K.E.x - K.c2.x, K.E.z - K.c2.z) }],
    A: [{ t0: B.nA.walk[0], t1: B.nA.walk[1], p0: N.A0, p1: N.A1, cane: true, step: 0.42, face: 'calm' },
      { t0: B.nA.walk[1], p0: N.A1, cane: true, face: 'focus', yaw: -Math.PI / 2,
        sweep: (t) => -0.7 * MathX.window(t, B.nA.tap - 0.35, B.nA.tap + 0.3, 0.2, 0.25), hdY: (t) => -25 * MathX.window(t, B.nA.clicks[1] - 0.4, B.nA.clicks[1] + 1.2, 0.3, 0.4) }],
    B: [{ t0: B.nB.walk[0], t1: B.nB.walk[1], p0: N.B0, p1: N.B1, cane: true, step: 0.44, face: 'calm' }],
  };
})();

BE_SET_BUILDERS.push((app, cast) => {
  const sf = app.sets.sfield = new BeSoundCity().build();
  sf.noor = cast.heroIn(sf.scene, 'noorC'); sf.noorCane = beCane(sf.scene);
  sf.coach = new GbCharacter(sf.scene, 'coach', { name: 'coachSf' }); beAcousticScene(sf.coach.root, 'world');
  sf.A = new GbCharacter(sf.scene, 'rainA', { name: 'walkerA' }); beAcousticScene(sf.A.root, 'hero'); sf.caneA = beCane(sf.scene);
  sf.B = new GbCharacter(sf.scene, 'rainC', { name: 'walkerB' }); beAcousticScene(sf.B.root, 'hero'); sf.caneB = beCane(sf.scene);
  sf.frame = beSfFrame; sf.fx = beSfFx;
  // the arena's roof dissolves as the camera rises through it (scene 13)
  const ar = app.sets.arena, up0 = ar.update;
  ar.update = function (t, L, cam, shot) { up0.call(this, t, L, cam, shot); const nr = !!(shot && shot.noRoof); if (this._nr !== nr) { this.top.forEach((m) => { m.visible = !nr; }); this._nr = nr; } };
});

function beSfFrame(app, t, shot) {
  const set = this, C = BE_SF_CAST;
  beActor(set.noor, t, C.noor, { cane: set.noorCane, clicks: [BE.nG[0]].concat(BE.nCl) });
  beActor(set.coach, t, C.coach, {});
  set._A = beActor(set.A, t, C.A, { cane: set.caneA, clicks: BE.nA.clicks });
  set._B = beActor(set.B, t, C.B, { cane: set.caneB, clicks: BE.nB.clicks });
}
// the city's rings: footsteps on the pavements, birds in the park's trees, the canes' taps; the clicks' shells
const _beSfBirds = (() => { const r = new RNG(1303), out = []; for (let k = 0; k < 40; k++) out.push([r.int(0, 50), BE.s13 + r.range(10, 38)]); return out; })();
function beSfFx(app, t, shot, L) {
  const set = this, R = set.rings, Wv = set.waves;
  if (L.ac < 0.5) return;
  const fade = shot.fadeOut ? 1 - MathX.smooth(t, shot.fadeOut[0], shot.fadeOut[1]) : 1, amber = '#ffb05a';
  // footsteps (a step every ≈ 0.55 s; a ring lasts 0.9 s)
  for (let i = 0; i < BE_SF_PEDS.length; i++) { const ph = (i * 0.137) % 0.55, s0 = Math.floor((t - ph) / 0.55) * 0.55 + ph;
    for (const s of [s0, s0 - 0.55]) if (t - s < 0.9) R.source(beSfPedAt(i, s), [s], t, { r: 2.0, a: 0.55 * fade, dur: 0.9, col: amber, th: 0.09, squash: 0.35 }); }
  // the birds (only in the park)
  for (const [k, tb] of _beSfBirds) if (t > tb && t < tb + 0.8 && set.trees[k]) R.source(set.trees[k].clone().setY(set.trees[k].y + 2), [tb], t, { r: 2.2, a: 0.6 * fade, dur: 0.8, col: amber, th: 0.06 });
  // the canes' taps at the tip
  for (const [W, act] of [['A', set._A], ['B', set._B]]) {
    if (act && act.tip && act.walking > 0.3) { const ph = W === 'A' ? 0.1 : 0.3, s0 = Math.floor((t - ph) / 0.84) * 0.84 + ph; if (t - s0 < 0.5) R.source(act.tip.clone().setY(0.05), [s0], t, { r: 0.6, a: 0.7 * fade, dur: 0.5, col: '#9ff6ff', th: 0.1, squash: 0.35 }); } }
  if (set._A && set._A.tip) { const tp = set._A.tip.clone().setY(0.05); R.source(tp, [BE.nA.tap], t, { r: 0.9, a: 0.9 * fade, dur: 0.7, col: '#9ff6ff', th: 0.1, squash: 0.35 }); }
  // the clicks: an outgoing shell over the ground
  const ground = [{ p: new THREE.Vector3(0, 0, 0), n: new THREE.Vector3(0, 1, 0), refl: 0.6, floor: true }];
  for (const q of app.pulses.list) {
    if (q.set !== 'sfield' || !q.click || (q.shot && q.shot !== shot.id)) continue;
    if (t > q.t && t < q.t + q.life) Wv.click(q, t, q.noGround ? [] : ground, { speed: q.speed, life: q.life, a: (q.shellA || 0.1) * fade, clip: q.beam ? [q.p, q.beam] : null });
  }
}

// the pulses: her clicks in the hall (both sets: the cut from the hall to the city falls inside one); the city's own
// the two walkers' clicks; the three clicks of the gap (the traffic, the fountain and the weir glow steadily: sfield.js)
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, B = BE, K = BE_M, sf = app.sets.sfield, ar = app.sets.arena;
  const mouthE = () => K.E.clone().setY(1.55);
  for (const t of B.nCl) for (const set of ['arena', 'sfield']) P.add({ t, p: mouthE(), kind: 0, speed: 9, w: 0.35, life: 3.0, str: 2.6, set, click: true, planes: ['floor', 'north', 'south', 'far', 'obstacle', 'bayA'], shellA: 0.12 });
  // "information you once ignored": the instructor's steps (she shifts her weight, a few steps nearer), amber
  for (let k = 0; k < 4; k++) P.add({ t: B.nIgn[0] + k * 0.5, p: new THREE.Vector3(K.c2.x + 0.3 * k, 0.05, K.c2.z + 0.25 * k), kind: 1, speed: 4.5, w: 0.12, life: 1.4, str: 0.9, set: 'arena' });
  // the walkers' clicks (where their mouths are at the click): small, near; the gap's three clicks (hers in the hall,
  // the corner, the bridge) carry over the city
  const mouthOf = (H, segs, t) => { beActor(H, t, segs, {}); return beMouth(H); };
  const big = { kind: 0, speed: 26, w: 2.2, life: 4.4, str: 7, set: 'sfield', click: true, shellA: 0.035 };
  for (const t of B.nA.clicks) P.add(t === B.nG[1] ? Object.assign({ t, p: mouthOf(sf.A, BE_SF_CAST.A, t) }, big)
    : { t, p: mouthOf(sf.A, BE_SF_CAST.A, t), kind: 0, speed: 7, w: 0.45, life: 1.5, str: 2.2, set: 'sfield', click: true, shellA: 0.05, beam: new THREE.Vector3(-1, 0, 0), beamK: 0.75 });
  for (const t of B.nB.clicks) P.add(t === B.nG[2] ? Object.assign({ t, p: mouthOf(sf.B, BE_SF_CAST.B, t) }, big)
    : { t, p: mouthOf(sf.B, BE_SF_CAST.B, t), kind: 0, speed: 8, w: 0.5, life: 1.4, str: 2.2, set: 'sfield', click: true, shellA: 0.05, noGround: true });
  P.add(Object.assign({ t: B.nG[0], p: mouthE() }, big));
  void ar;
});

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE;
  const hp = () => FILM._app.sets.arena.hero.root.position;
  const ac = (w = 0.03, h = 0.3) => ({ ac: 1, world: w, hero: h, glow: 0.04 });
  const S = [
    // N1: she walks out into the open hall; the camera rises away from her
    { id: 'N1', t0: B.s13, t1: B.n2, set: 'arena', look: () => BE_REAL,
      cam: beMove(B.s13, B.n2, [V(16.5, 1.7, 6.5), V(9.5, 1.0, 3.6), 46], [V(20.5, 6.2, 8.0), V(12.2, 0.8, 2.8), 50], { dof: 0.1, focus: (t, pos) => pos.distanceTo(hp()), ease: Ease.inOutSine }) },
    // N2: her click; the sound view; up through the roof (dissolved): the hall from above
    { id: 'N2', t0: B.n2, t1: B.n3, set: 'arena', tag: true, noRoof: true, decay: 0.9, gain: 1.4, heroGain: 0.7, shells: false, fall: 0.025,
      look: (t) => { const k = MathX.smooth(t, B.n2, B.n2 + 0.7); return k > 0.98 ? ac(0.02, 0.5) : { ac: 1, world: MathX.lerp(1, 0.02, k), hero: MathX.lerp(1, 0.5, k), glow: MathX.lerp(1, 0.04, k) }; },
      cam: beMove(B.n2, B.n3, [V(20.5, 6.2, 8.0), V(12.2, 0.8, 2.8), 50], [V(26, 58, 30), V(12, 0, 0.5), 46], { dof: 0, ease: Ease.inOutSine }) },
    // C1: the city appears around the hall, as sound (outward from it)
    { id: 'C1', t0: B.n3, t1: B.n4, set: 'sfield', tag: 'VISUALIZATION · A METAPHOR', look: () => ac(0.0, 0.5), decay: 0.9, gain: 1.5, heroGain: 0.7,
      fall: (t) => MathX.lerp(0.025, 0.0016, MathX.smooth(t, B.n3, B.n3 + 2.5)),
      csGain: (t) => MathX.smooth(t, B.n3 + 0.3, B.n3 + 2.0), reveal: (t) => MathX.lerp(12, 560, Ease.inOutSine(MathX.ramp(t, B.n3 + 0.3, B.n4 + 0.4))),
      cam: beMove(B.n3, B.n4, [V(26, 58, 30), V(12, 0, 0.5), 46], [V(60, 135, 120), V(30, 0, 10), 52], { dof: 0, ease: Ease.inOutSine }) },
    // C2: down to the woman at the corner (she faces the crossing; behind her the lamp post, the parked cars, the corner)
    { id: 'C2', t0: B.n4, t1: B.n5, set: 'sfield', tag: 'VISUALIZATION · A METAPHOR', look: () => ac(0.0, 0.8), decay: 1.3, gain: 1.5, heroGain: 0.7, fall: 0.0016,
      csGain: (t) => MathX.lerp(1, 0.6, MathX.smooth(t, B.n4 + 1.5, B.n4 + 3.2)),
      cam: ((a, b) => (t) => (t < B.n4 + 3.2 ? a(t) : b(t)))(
        beMove(B.n4, B.n4 + 3.2, [V(112, 30, -52), V(84, 0, -31), 50], [V(74.6, 1.55, -28.0), V(78.6, 1.15, -30.6), 40], { dof: 0, ease: Ease.inOutCubic }),
        beMove(B.n4 + 3.2, B.n5, [V(74.6, 1.55, -28.0), V(78.6, 1.15, -30.6), 40], [V(74.2, 1.5, -28.9), V(78.8, 1.15, -30.9), 38], { dof: 0, ease: Ease.linear })) },
    // C3: on the bridge: the man with the cane crossing; his clicks answer from the rails and the water
    { id: 'C3', t0: B.n5, t1: B.ng, set: 'sfield', tag: 'VISUALIZATION · A METAPHOR', look: () => ac(0.0, 0.7), decay: 0.9, gain: 1.5, heroGain: 0.7, fall: 0.0016, csGain: () => 0.6,
      cam: (() => { const m = beMove(B.n5, B.ng, [V(86.5, 11, 127), V(77.4, 0.3, 136), 46], [V(86, 10, 146), V(77.4, 0.3, 143), 44], { dof: 0, ease: Ease.inOutSine });
        return (t) => { const c = m(t), h = FILM._app.sets.sfield.B.root.position; c.at.set(MathX.lerp(c.at.x, h.x, 0.6), c.at.y, MathX.lerp(c.at.z, h.z, 0.6)); return c; }; })() },
    // G: three measured clicks over the city; the music peaks; to black
    { id: 'G13', t0: B.ng, t1: B.s14, set: 'sfield', tag: 'VISUALIZATION · A METAPHOR', look: (t) => ac(0.0, 0.5 * (1 - MathX.smooth(t, B.s14 - 1.1, B.s14 - 0.1))), decay: 1.0, heroGain: 0.7, fall: 0.0016,
      gainAt: (t) => 1.5 * (1 - MathX.smooth(t, B.s14 - 1.1, B.s14 - 0.1)), fadeOut: [B.s14 - 1.1, B.s14 - 0.1],
      csGain: (t) => 0.7 * (1 - MathX.smooth(t, B.s14 - 1.1, B.s14 - 0.1)),
      cam: beMove(B.ng, B.s14, [V(20, 160, 215), V(50, 0, 55), 50], [V(85, 165, 225), V(52, 0, 55), 50], { dof: 0 }) },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s14;
})();
