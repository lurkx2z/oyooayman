/* =====================================================================
   SCENE 9 — "The city becomes a wall of sound" (city.js). A busy afternoon street; she walks the south pavement.
     I1  "Now take that ability outside.": aerial: the street from high above, the camera comes down toward her
     I2  "A city is completely different from a quiet hallway.": street level, she walks toward us (a tracking shot)
     I3  "Traffic. Conversations. Footsteps. Engines. Reflections bouncing between buildings.": the sound view from above
         and behind her; each word lights its sources (cars; the two people talking at the café; footsteps; the bus's
         engine; its sound reflected between the two building lines)
     I4  "Some of those sounds help you understand what's happening.": close on her listening as the street goes by
     I5  "Others can mask the quiet echoes…": the sound view: her click, swamped; a card: echo vs street noise (masked)
     I6  "…real navigation skills, mobility tools, and experience matter.": low on the cane: it finds the tactile
         paving at the corner; she stops a step back from the kerb
     I7  "Echolocation can contribute information.": the sound view: a click; the building beside her answers, and
         then stops: where the wall ends, the side street opens
     I8  "It isn't a replacement for a cane, accessible signals, or…": her hand finds the accessible signal's button
         (a raised arrow, a locator tone); then wider: the corner, the traffic going by in front of her
     I9  (no narration) the sound view: the noise separates into layers; the signal's walk tone; reality: the walk
         lamp, she and another pedestrian cross the side street on the raised crosswalk
   ===================================================================== */

Object.assign(GB_LOOKS, {
  cityA: { skin: '#c08b6c', lip: '#7a4a40', top: '#4a5d7a', topDark: '#3c4c64', pants: '#3a3438', shoes: '#2b2622', sole: '#141212', hair: '#5a4030', hairStyle: 'short', build: 1.02, head: 1.0 },
  cityC: { skin: '#e0b496', lip: '#8a5048', top: '#6e7178', topDark: '#585b62', pants: '#2c2e36', shoes: '#3a3430', sole: '#141212', hair: '#3a2c24', hairStyle: 'short', build: 1.04, head: 1.0 },
  cityB: { skin: '#6b4433', lip: '#3a2220', top: '#a35a3a', topDark: '#87482e', pants: '#2a2c3a', shoes: '#d6cfc4', sole: '#6a5a4c', hair: '#140e0c', hairStyle: 'pony', build: 0.92, head: 0.97 },
});

BE.s9 = BN_SC[9].start;
BE.i2 = bnE(9, 'a').start - 0.3;
BE.i3 = bnE(9, 'traffic').start - 0.35;
BE.i4 = bnE(9, 'some').start - 0.3;
BE.i5 = bnE(9, 'others').start - 0.3;
BE.i6 = bnE(9, 'and').start - 0.3;
BE.i7 = bnE(9, 'echolocation').start - 0.35;
BE.i8 = bnE(9, 'it').start - 0.3;
BE.i8b = bnE(9, 'or').start - 0.25;
BE.i9 = BN_CLIP[9].speechEnd + 0.25;
BE.i9b = BE.i9 + 2.5;
BE.s10 = BN_SC[10].start;
BE.iW = { traffic: bnE(9, 'traffic').start, voices: bnE(9, 'conversations').start, steps: bnE(9, 'footsteps').start, engines: bnE(9, 'engines').start, refl: bnE(9, 'reflections').start };
BE.iStop = BE.i6 + 1.75;                                // she stops at the tactile paving
BE.iReach = [bnE(9, 'cane').start - 0.4, bnE(9, 'accessible').start];
BE.iWalkSig = BE.i9 + 1.1;                             // the walk phase (the signal's rapid tick)
BE.iCross = [BE.iWalkSig + 0.9, BE.iWalkSig + 0.9 + 11.6];   // she crosses the side street, kerb to kerb and past the far tactile paving
BE.iWalkEnd = BE.iWalkSig + 12.5;
const BE_CROSS_EASE = beEaseWalk(0.08, 0.12);
BE.i5Clicks = [BE.i5 + 0.35, bnE(9, 'trying').start - 0.1];
BE.i7Clicks = [BE.i7 + 0.15, bnE(9, 'contribute').start + 0.2];
const BE_CITY_W1 = { t0: BE.s9 - 1.0, x0: 3.0 };
// her x while walking the pavement (she reaches the corner at iStop)
function beCityHerX(t) { const k = MathX.ramp(t, BE_CITY_W1.t0, BE.iStop); return MathX.lerp(BE_CITY_W1.x0, 28.6, k); }
BE_CITY.busX = (t) => beCityHerX(BE.iW.engines) - 7 + 11.5 * (t - BE.iW.engines);

// ---- the set, the cast
BE_SET_BUILDERS.push((app, cast) => {
  const c = app.sets.city = new BeCity().build();
  c.scene.environment = beEnvFor(app.renderer, '#93abc6', '#b9ae9d', '#4c463f');
  c.hero = cast.heroIn(c.scene, 'noorC');
  c.cane = beCane(c.scene);
  c.peds = {};
  for (const [id, look] of [['p1', 'jogger'], ['p2', 'shopper'], ['p3', 'vendor'], ['p4', 'cityC'], ['s1', 'sitter'], ['s2', 'cityB'], ['p5', 'cityA']]) {
    const P = c.peds[id] = new GbCharacter(c.scene, look, { name: id }); beAcousticScene(P.root, 'hero'); P.J.hc.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
  }
  beAcousticScene(c.hero.root, 'hero');
  c.frame = beCityFrame; c.fx = beCityFx;
  c.update = function (t, L, cam, shot) {
    const lit = L.ac > 0.5 ? L.world : 1;
    this.aim(FILM._S ? FILM._S.at : new THREE.Vector3(beCityHerX(t), 0, 9));
    this.sun.intensity = (this._sun ?? 3.6) * lit; this.hemi.intensity = (this._hemi ?? 0.5) * lit;
    this.skyU.uT.value = t;
    this.sky.visible = L.ac < 0.5;
    const F = this.scene.fog; F.density = typeof shot.fogD === 'function' ? shot.fogD(t) : (shot.fogD ?? this._fogD ?? 0.005); F.color.set(this._fogCol || '#c9d3dc').multiplyScalar(MathX.lerp(1, L.world, L.ac));
    this.scene.background.set(this._fogCol || '#b9c8d6').multiplyScalar(MathX.lerp(1, 0.0, L.ac));
    // the pedestrian signal: wait (orange hand) → walk (white figure)
    const walk = t >= BE.iWalkSig && t < BE.iWalkEnd;
    this.walkM.emissiveIntensity = walk ? 2.4 : 0; this.waitM.emissiveIntensity = walk ? 0 : 2.2;
    if (this.extra) this.extra(t, L, cam, shot);
  };
});

// ---- blocking
const _CV = (x, z) => new THREE.Vector3(x, 0, z);
const BE_HERO_CITY = [
  { t0: BE_CITY_W1.t0, t1: BE.iStop, p0: _CV(BE_CITY_W1.x0, BE_CITY.path), p1: _CV(28.6, BE_CITY.path), cane: true, step: 0.5, ease: (k) => k, face: 'focus',
    hdY: (t) => 10 * MathX.window(t, BE.iW.traffic - 0.2, BE.iW.voices - 0.3, 0.3, 0.4) - 14 * MathX.window(t, BE.iW.voices, BE.iW.steps, 0.3, 0.4) + 12 * MathX.window(t, BE.iW.engines - 0.3, BE.iW.engines + 1.6, 0.3, 0.6) },
  { t0: BE.iStop, p0: _CV(28.6, BE_CITY.path), yaw: Math.PI / 2, cane: true, face: 'focus',
    hdY: (t) => 22 * MathX.window(t, BE.iStop + 0.8, BE.i7 - 0.2, 0.5, 0.5) - 8 * MathX.window(t, BE.i7, BE.i8, 0.4, 0.4),
    sweep: (t) => 0.55 * MathX.window(t, BE.iStop - 0.1, BE.iStop + 0.5, 0.2, 0.2) - 0.45 * MathX.window(t, BE.iStop + 0.5, BE.iStop + 1.1, 0.2, 0.2) },
  // to the signal pole: two short steps toward it, then her left hand finds the button box
  { t0: BE.iReach[0] - 1.1, t1: BE.iReach[0] - 0.05, p0: _CV(28.6, BE_CITY.path), p1: _CV(29.0, 9.18), cane: true, step: 0.3, face: 'focus' },
  { t0: BE.iReach[0] - 0.05, p0: _CV(29.0, 9.18), cane: true, face: 'focus',
    yaw: (t) => new Track([[BE.iReach[0], Math.atan2(0.4, -0.32)], [BE.iReach[0] + 0.6, 2.25], [BE.iWalkSig + 0.2, 2.25], [BE.iWalkSig + 0.9, Math.PI / 2]]).value(t),
    hdY: (t) => 14 * MathX.window(t, BE.i9, BE.iWalkSig + 0.3, 0.4, 0.3),
    after: (H, t) => { const w = MathX.window(t, BE.iReach[0] + 0.1, BE.iWalkSig, 0.6, 0.5); if (w > 0.001) { const set = FILM._app.sets.city, p = set.apsBtn(0); H.solveArm('L', p.clone().add(new THREE.Vector3(-0.02, 0.0, 0.05)), new THREE.Vector3(0, -1, 0.3), w); } } },
  // the crossing (and on, into scene 10)
  { t0: BE.iCross[0], t1: BE.iCross[1], p0: _CV(29.0, 9.18), p1: _CV(41.6, 9.5), cane: true, step: 0.5, face: 'focus', ease: BE_CROSS_EASE },
];
// the other people: a woman walking toward her (p1), two on the far pavement (p2, p3), a man who overtakes her and
// waits at the corner, then crosses with her (p4), two talking at a café table (s1, s2), one waiting at the far corner (p5)
const BE_PEDS_CITY = {
  p1: [{ t0: BE.s9 + 2.4, t1: BE.s9 + 30, p0: _CV(32, 8.9), p1: _CV(-9, 8.9), pose: 'stand', step: 0.62, face: 'neutral', ease: (k) => k }],
  p2: [{ t0: BE.s9 - 2, t1: BE.s9 + 44, p0: _CV(-24, -9.6), p1: _CV(42, -9.6), pose: 'stand', step: 0.6, face: 'neutral', ease: (k) => k }],
  p3: [{ t0: BE.s9 - 2, t1: BE.s9 + 44, p0: _CV(62, -10.4), p1: _CV(-2, -10.4), pose: 'stand', step: 0.58, face: 'neutral', ease: (k) => k }],
  p4: [{ t0: BE.s9 - 1, t1: BE.iStop - 1.2, p0: _CV(-9, 10.3), p1: _CV(28.2, 10.35), pose: 'stand', step: 0.66, face: 'neutral', ease: (k) => k },
    { t0: BE.iStop - 1.2, p0: _CV(28.2, 10.35), yaw: Math.PI / 2 - 0.15, pose: 'stand', face: 'neutral', hdY: (t) => -18 * MathX.window(t, BE.iStop, BE.i8, 0.6, 0.6) },
    { t0: BE.iWalkSig + 0.5, t1: BE.iWalkSig + 6.5, p0: _CV(28.2, 10.35), p1: _CV(38.4, 10.6), pose: 'stand', step: 0.64, face: 'neutral' },
    { t0: BE.iWalkSig + 6.5, t1: BE.iWalkSig + 30, p0: _CV(38.4, 10.6), p1: _CV(70, 10.6), pose: 'stand', step: 0.64, face: 'neutral', ease: (k) => k }],
  p5: [{ t0: -1, p0: _CV(41.4, 9.6), yaw: -Math.PI / 2 + 0.2, pose: 'stand', face: 'neutral' },
    { t0: BE.iWalkSig + 0.3, t1: BE.iWalkSig + 7.5, p0: _CV(41.4, 9.6), p1: _CV(31.6, 8.4), pose: 'stand', step: 0.6, face: 'neutral' },
    { t0: BE.iWalkSig + 7.5, t1: BE.iWalkSig + 30, p0: _CV(31.6, 8.4), p1: _CV(8, 8.4), pose: 'stand', step: 0.6, face: 'neutral', ease: (k) => k }],
  s1: [{ t0: -1, p0: _CV(14.62, 11.15), yaw: Math.PI / 2, pose: 'sitRelax', face: 'content', hdY: (t) => 6 * Math.sin(t * 0.7) }],
  s2: [{ t0: -1, p0: _CV(15.78, 11.15), yaw: -Math.PI / 2, pose: 'sitRelax', face: 'content', hdY: (t) => -5 * Math.sin(t * 0.5 + 1) }],
};
// the café pair's talk: alternating phrases (syllable times), for the mouths, the rings and the murmur in the sound
const BE_CITY_TALK = (() => { const r = new RNG(944), out = []; let t = BE.s9 - 2, who = 0;
  while (t < BE.s10 + 40) { const n = Math.floor(r.range(5, 14)); for (let i = 0; i < n; i++) { out.push({ t, who }); t += r.range(0.13, 0.24); } t += r.range(0.25, 0.7); who = 1 - who; } return out; })();
const BE_CITY_CLICKS = () => BE.i5Clicks.concat(BE.i7Clicks);

function beCityFrame(app, t, shot) {
  const set = this;
  set.updateTraffic(t);
  set._act = beActor(set.hero, t, BE_HERO_CITY, { cane: set.cane, clicks: BE_CITY_CLICKS(), blinks: [BE.s9 + 3, BE.i4 + 1.2, BE.i6 + 2.0, BE.i8 + 1.0] });
  for (const id in BE_PEDS_CITY) {
    const P = set.peds[id], segs = (set._pedSegs && set._pedSegs[id]) || BE_PEDS_CITY[id];
    beActor(P, t, segs, { blinks: [BE.s9 + 1 + id.charCodeAt(1) * 0.7, BE.s9 + 9 + id.charCodeAt(1)] });
    if (id[0] === 's') { const talk = BE_CITY_TALK.some((q) => q.who === (id === 's1' ? 0 : 1) && t > q.t && t < q.t + 0.12); if (talk) P.applyFace(Object.assign({}, GB_FACES.content, { open: 0.25, width: 0.8 }), { x: 0, y: 0 }); }
  }
  if (shot.fp) set.hero.root.visible = false;
}

// the sound view's overlays: rings at the sources (cars, the bus, the café pair, footsteps, the signal), wavefronts
function beCityFx(app, t, shot, L) {
  const set = this, R = set.rings, Wv = set.waves, C = BE_CITY;
  for (const q of app.pulses.list) {
    if (q.set !== 'city' || !q.click || (q.shot && q.shot !== shot.id)) continue;
    if (t > q.t && t < q.t + 0.45 && !shot.fp) R.source(q.p, [q.t], t, { r: 0.07, a: 0.8, dur: 0.45, col: '#9ff6ff' });
    if (L.ac > 0.5 && shot.shells !== false && t > q.t && t < q.t + 1.5) Wv.click(q, t, [], { speed: q.speed, life: 1.5, a: 0.08 });
  }
  if (L.ac < 0.5) return;
  const layered = shot.layers ? shot.layers(t) : 0;           // I9: the jumble separates into coloured layers
  const col = (c) => layered > 0.01 ? c : '#ffb05a';
  // traffic: each car near her rumbles (low, wide rings)
  for (const c of set.cars) {
    const x = set.carX(c, t), hx = beCityHerX(t); if (Math.abs(x - hx) > 70) continue;
    const ln = C.lanes[c.lane], p = new THREE.Vector3(x, 0.55, ln.z), per = c.bus ? 0.16 : 0.32;
    const k = Math.floor(t / per); R.source(p, [k * per, (k - 1) * per, (k - 2) * per], t, { r: c.bus ? 2.6 : 1.4, a: (c.bus ? 0.6 : 0.42) * (shot.noise ?? 1), dur: per * 3, col: col('#8c6cff'), th: 0.05, squash: 0.45 });
  }
  // the café pair: small, quick rings at their mouths
  for (const q of BE_CITY_TALK) if (t > q.t && t < q.t + 0.6) { const P = set.peds[q.who ? 's2' : 's1'], p = P.worldOf('hd').add(new THREE.Vector3(0, 0.02, 0)); R.source(p, [q.t], t, { r: 0.35, a: 0.55 * (shot.noise ?? 1), dur: 0.6, col: col('#ffb05a'), th: 0.08 }); }
  // footsteps of the walkers (tiny rings at the ground)
  for (const id of ['p1', 'p4', 'p2', 'p3', 'p5']) { const plan = set._stepCache && set._stepCache[id]; if (!plan) continue; for (const h of plan) if (t > h.t && t < h.t + 0.5) R.source(h.p, [h.t], t, { r: 0.28, a: 0.5 * (shot.noise ?? 1), dur: 0.5, col: col('#ffd9a0'), th: 0.1, squash: 0.35 }); }
  // the signal: locator tone (once a second) and the walk phase (a rapid tick)
  for (const [i, P] of [[0, set.apsBtn(0)], [1, set.apsBtn(1)]]) {
    const ticks = []; const walk = t >= BE.iWalkSig && t < BE.iWalkEnd, per = walk ? 0.12 : 1.0; const k = Math.floor(t / per); ticks.push(k * per, (k - 1) * per, (k - 2) * per);
    R.source(P, ticks, t, { r: walk ? 0.5 : 0.3, a: (walk ? 0.9 : 0.6) * (i ? 0.7 : 1), dur: walk ? 0.36 : 0.8, col: walk ? '#e9fff4' : '#ffd27a', th: 0.08 });
  }
  if (shot.id === 'I3' && t > BE.iW.refl - 0.1 && t < BE.iW.refl + 2.6) {
    // the bus's sound reflected between the two building lines (image sources across each facade)
    const q = { t: BE.iW.refl - 0.05, p: new THREE.Vector3(BE_CITY.busX(BE.iW.refl - 0.05), 1.4, 5.25), speed: 14 };
    Wv.click(q, t, set.walls.map((w) => Object.assign({}, w, { refl: 0.85 })), { speed: 14, life: 2.6, a: 0.16, ecol: '#b59cff', col: '#ffb05a' });
  }
}

// ---- the pulses (the shader's contours: what each source paints onto surfaces) and the clicks
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, B = BE, set = app.sets.city, H = set.hero, C = BE_CITY;
  const mouthAt = (t) => { FILM._shot = beShotAt(t); beActor(H, t, BE_HERO_CITY, { cane: set.cane }); return beMouth(H); };
  for (const t of B.i5Clicks) P.add({ t, p: mouthAt(t + 0.01), kind: 0, speed: 4.0, w: 0.09, life: 1.8, str: 0.5, set: 'city', shot: 'I5', click: true });
  for (const t of B.i7Clicks) P.add({ t, p: mouthAt(t + 0.01), kind: 0, speed: 6.0, w: 0.12, life: 2.0, str: 1.8, set: 'city', shot: 'I7', click: true });
  // the walkers' steps (cached for the rings and the sound)
  set._stepCache = {};
  for (const id of ['p1', 'p4', 'p2', 'p3', 'p5']) { const out = []; for (const sg of BE_PEDS_CITY[id]) if (sg.p1) for (const h of beActPlan(sg)) if (h.t0 > sg.t0 && h.t0 < sg.t1) out.push({ t: h.t0, p: new THREE.Vector3(h.p.x, 0.03, h.p.z) }); set._stepCache[id] = out; }
  // sources paint the street (amber), traffic (violet: broad and diffuse); only in the sound-view shots
  for (const id of ['I3', 'I5', 'I7', 'I9a']) {
    const S = BE_SHOTS.find((s) => s.id === id); if (!S) continue;
    for (const c of set.cars) for (let t = S.t0 - 1; t < S.t1; t += c.bus ? 0.35 : 0.7) {
      const x = set.carX(c, t); if (Math.abs(x - beCityHerX(t)) > 45) continue;
      P.add({ t, p: new THREE.Vector3(x, 0.6, C.lanes[c.lane].z), kind: 2, speed: 9, w: 0.5, life: 1.2, str: (c.bus ? 1.6 : 0.9) * (id === 'I7' ? 0.3 : 1), set: 'city', shot: id });
    }
  }
  FILM._shot = null;
});

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE, C = BE_CITY;
  const ct = () => FILM._app.sets.city;
  const head = () => ct().hero.worldOf('hd').add(V(0, 0.08, 0));
  const ac = (w = 0.035, h = 0.3) => ({ ac: 1, world: w, hero: h, glow: 0.05 });
  const lab = (p, html, a, cls, dx, dy) => ({ p, html, a, cls, dx, dy });
  const hx = (t) => beCityHerX(t);
  const S = [
    // I1: aerial: high above the street, coming down toward her (a long crane move)
    { id: 'I1', t0: B.s9, t1: B.i2, set: 'city', look: () => BE_REAL, fogD: (t) => MathX.lerp(0.0022, 0.005, MathX.ramp(t, B.s9, B.i2)),
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.s9, B.i2 + 0.4)), x = hx(t); return { pos: V(x - 34 + 22 * k, MathX.lerp(52, 5.5, k), MathX.lerp(-2, 3.2, k)), at: V(x + MathX.lerp(14, 2, k), MathX.lerp(0, 1.0, k), MathX.lerp(4, 9.2, k)), fov: 46, focus: 12, dof: 0 }; } },
    // I2: street level: she walks toward us; the street and traffic behind her
    { id: 'I2', t0: B.i2, t1: B.i3, set: 'city', look: () => BE_REAL,
      cam: (t) => { const x = hx(t), k = MathX.ramp(t, B.i2, B.i3); return { pos: V(x + 4.6 - 0.6 * k, 1.45, 8.35), at: V(x - 0.4, 1.15, 9.6), fov: 40, focus: 4.6, dof: 0.45 }; } },
    // I3: the sound view: high behind her, down the street; each word lights its sources
    { id: 'I3', t0: B.i3, t1: B.i4, set: 'city', tag: true, decay: 0.5, gain: 1.2, heroGain: 0.5, look: () => ac(0.03, 0.4),
      cam: (t) => { const x = hx(t), k = Ease.inOutSine(MathX.ramp(t, B.i3, B.i4)); return { pos: V(x - 6.5 + 1.5 * k, 4.0 - 0.4 * k, 10.9), at: V(x + 9, 0.4, 5.6), fov: 56, focus: 10, dof: 0 }; },
      labels: (t) => { const W = B.iW, set = ct(), a = (w0, w1) => MathX.smooth(t, w0 - 0.05, w0 + 0.25) * (1 - MathX.smooth(t, w1, w1 + 0.4));
        const car = set.cars.filter((c) => !c.bus && c.lane === 1).map((c) => set.carX(c, t)).filter((x) => x > hx(t) + 2).sort((p, q) => p - q)[0] ?? hx(t) + 12;
        return [
          lab(V(car, 1.9, 1.75), '<div class="k">TRAFFIC</div>', a(W.traffic, B.i4 - 0.5)),
          lab(V(15.2, 1.9, 11.15), '<div class="k">CONVERSATIONS</div>', a(W.voices, B.i4 - 0.5)),
          lab(V(beCityHerX(t) + 4, 0.6, 8.9), '<div class="k">FOOTSTEPS</div>', a(W.steps, B.i4 - 0.5)),
          lab(V(BE_CITY.busX(t) + 2, 3.6, 5.25), '<div class="k">ENGINES</div>', a(W.engines, B.i4 - 0.5)),
          lab(V(beCityHerX(t) + 14, 9, 12), '<div class="k">REFLECTIONS</div><div class="s">BETWEEN THE BUILDINGS</div>', a(W.refl, B.i4 - 0.4)),
        ]; } },
    // I4: close on her listening (front-left, the traffic beyond)
    { id: 'I4', t0: B.i4, t1: B.i5, set: 'city', look: () => BE_REAL,
      cam: (t) => { const h = head(), k = MathX.ramp(t, B.i4, B.i5); return { pos: V(h.x + 1.5 - 0.1 * k, h.y - 0.05, h.z - 1.0), at: V(h.x, h.y - 0.1, h.z), fov: 32, focus: 1.8, dof: 0.7 }; } },
    // I5: the sound view, close behind her: her click is swamped; the masking card
    { id: 'I5', t0: B.i5, t1: B.i6, set: 'city', tag: true, decay: 0.45, gain: 1.4, heroGain: 0.5, noise: 1.6, look: () => ac(0.025, 0.4),
      cam: (t) => { const h = head(); return { pos: V(h.x - 2.4, h.y + 0.7, h.z + 1.3), at: V(h.x + 3, h.y - 0.6, h.z - 1.4), fov: 52, focus: 2.5, dof: 0 }; },
      draw: (cv, t) => beDrawMasking(cv, t) },
    // I6: low on the cane: the tactile paving at the corner; she stops (the camera rises to show the corner)
    { id: 'I6', t0: B.i6, t1: B.i7, set: 'city', look: () => BE_REAL,
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.i6 + 1.8, B.i7)); return { pos: V(30.6 + 0.8 * k, MathX.lerp(0.32, 1.5, k), MathX.lerp(8.7, 7.9, k)), at: V(MathX.lerp(29.4, 28.8, k), MathX.lerp(0.05, 1.0, k), 9.55), fov: 46, focus: 1.6, dof: 0.6 * (1 - k) }; } },
    // I7: the sound view over her right shoulder, along the building line: the wall answers until it ends
    { id: 'I7', t0: B.i7, t1: B.i8, set: 'city', tag: true, decay: 0.8, gain: 1.7, heroGain: 0.5, noise: 0.5, shells: false, look: () => ac(0.022, 0.35),
      cam: (t) => { const k = MathX.ramp(t, B.i7, B.i8); return { pos: V(23.2 + 0.5 * k, 2.4, 10.4), at: V(30.5, 1.3, 11.6), fov: 56, focus: 4, dof: 0 }; },
      labels: (t) => [lab(V(26.9, 2.4, 12.0), '<div class="k">THE WALL ENDS HERE</div>', MathX.smooth(t, B.i7Clicks[0] + 0.5, B.i7Clicks[0] + 0.9)),
        lab(V(33.5, 1.4, 13.5), '<div class="k">OPEN SPACE</div><div class="s">THE SIDE STREET</div>', MathX.smooth(t, B.i7Clicks[1] + 0.3, B.i7Clicks[1] + 0.7))] },
    // I8: her hand finds the signal's button box (the raised arrow); then the corner, the traffic in front of her
    { id: 'I8', t0: B.i8, t1: B.i8b, set: 'city', look: () => BE_REAL,
      cam: (t) => { const p = ct().apsBtn(0), k = MathX.ramp(t, B.i8, B.i8b); return { pos: V(p.x - 0.62 - 0.08 * k, p.y + 0.16, p.z - 0.5 + 0.05 * k), at: V(p.x - 0.05, p.y - 0.03, p.z + 0.1), fov: 36, focus: 0.8, dof: 0.9 }; } },
    { id: 'I8b', t0: B.i8b, t1: B.i9, set: 'city', look: () => BE_REAL,
      cam: beMove(B.i8b, B.i9, [V(25.2, 1.6, 12.2), V(31, 1.0, 6.5), 46], [V(25.0, 2.0, 12.6), V(31, 1.0, 6.0), 46], { dof: 0.2 }) },
    // I9a: (no narration) the sound view: the noise falls into layers; the walk tone
    { id: 'I9a', t0: B.i9, t1: B.i9b, set: 'city', tag: true, decay: 0.45, gain: 1.2, heroGain: 0.5, noise: 1.0, shells: false, look: () => ac(0.025, 0.38),
      layers: (t) => MathX.smooth(t, B.i9 + 0.2, B.i9 + 1.4),
      cam: beMove(B.i9, B.i9b, [V(25.4, 3.2, 12.4), V(36, 0.8, 7.0), 52], [V(25.8, 3.0, 12.2), V(36, 0.8, 7.5), 50], { dof: 0 }),
      labels: (t) => { const a = MathX.smooth(t, B.i9 + 0.6, B.i9 + 1.2), set = ct(); return [
        lab(V(31, 0.3, 3), '<div class="k" style="color:#c9b8ff">TRAFFIC</div>', a), lab(V(28.2, 2.3, 10.35), '<div class="k" style="color:#ffd9a0">STEPS · VOICES</div>', a * 0.9),
        lab(set.apsBtn(1).add(V(0, 0.45, 0)), '<div class="k" style="color:#e9fff4">WALK SIGNAL</div>', MathX.smooth(t, B.iWalkSig + 0.1, B.iWalkSig + 0.5))]; } },
    // I9b: reality from the far corner: the walk lamp; she and the man beside her cross on the raised crosswalk
    { id: 'I9b', t0: B.i9b, t1: B.s10, set: 'city', look: () => BE_REAL,
      cam: beMove(B.i9b, B.s10, [V(37.2, 1.45, 7.7), V(30.6, 1.1, 9.4), 46], [V(37.6, 1.45, 7.6), V(32.0, 1.1, 9.5), 44], { dof: 0.3 }) },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s10;
})();

// SCIENCE (I5): masking. A level-vs-time trace: the street's noise (a fluctuating band), her click, and the echo from
// the shopfronts 2.5 m away (2 × 2.5 m / 343 m/s ≈ 14.6 ms later), weaker than the noise around it: masked. Ghost: the same echo in a quiet
// hallway, clear above a low noise floor.
const BE_CITY_ECHO_MS = 2 * (BE_CITY.walk - BE_CITY.path) / 343 * 1000;
function beDrawMasking(cv, t) {
  const x = cv.getContext('2d'), B = BE;
  x.clearRect(0, 0, cv.width, cv.height);
  const X0 = 1150, Y0 = 120, PW = 680, PH = 360, gx0 = X0 + 50, gx1 = X0 + PW - 30, gy = Y0 + 270, amp = 170;
  const a0 = MathX.smooth(t, B.i5 + 0.05, B.i5 + 0.5);
  x.globalAlpha = a0; _bePanel(x, X0, Y0, PW, PH, 0.84);
  _beTxt(x, 'HER ECHO vs THE STREET', X0 + 30, Y0 + 40, { font: '700 24px Inter, sans-serif', col: '#9ff6ff' });
  const ms = (m) => gx0 + (m / 40) * (gx1 - gx0);
  x.strokeStyle = 'rgba(200, 230, 255, 0.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(gx0, gy); x.lineTo(gx1, gy); x.stroke();
  for (let m = 0; m <= 40; m += 10) _beTxt(x, m + ' ms', ms(m), gy + 22, { font: '500 17px Inter, sans-serif', col: 'rgba(200, 230, 255, 0.6)', align: 'center' });
  // the quiet hallway (ghost): a low noise floor, the echo standing clear
  const ag = MathX.smooth(t, B.i5 + 0.3, B.i5 + 0.8);
  x.globalAlpha = a0 * ag * 0.8; x.fillStyle = 'rgba(190, 200, 215, 0.25)'; x.fillRect(gx0, gy - 0.06 * amp, gx1 - gx0, 0.06 * amp);
  x.strokeStyle = 'rgba(190, 200, 215, 0.8)'; x.setLineDash([6, 5]); x.lineWidth = 3; x.beginPath(); x.moveTo(ms(BE_CITY_ECHO_MS), gy); x.lineTo(ms(BE_CITY_ECHO_MS), gy - 0.42 * amp); x.stroke(); x.setLineDash([]);
  _beTxt(x, '┅ QUIET HALLWAY', X0 + 30, Y0 + 80, { font: '700 18px Inter, sans-serif', col: 'rgba(200, 210, 225, 0.85)' });
  // the street: a loud, fluctuating noise band that rises over the echo
  const an = MathX.smooth(t, B.i5Clicks[0] - 0.1, B.i5Clicks[0] + 0.4);
  x.globalAlpha = a0 * an;
  const r = new RNG(77 + Math.floor(t * 12)); x.fillStyle = 'rgba(255, 176, 90, 0.42)'; x.beginPath(); x.moveTo(gx0, gy);
  for (let m = 0; m <= 40; m += 0.5) x.lineTo(ms(m), gy - (0.38 + 0.2 * r.next()) * amp); x.lineTo(gx1, gy); x.closePath(); x.fill();
  x.strokeStyle = '#ffffff'; x.lineWidth = 4; x.beginPath(); x.moveTo(ms(0.3), gy); x.lineTo(ms(0.3), gy - 0.95 * amp); x.stroke();
  x.strokeStyle = '#62f3ff'; x.lineWidth = 4; x.beginPath(); x.moveTo(ms(BE_CITY_ECHO_MS), gy); x.lineTo(ms(BE_CITY_ECHO_MS), gy - 0.42 * amp); x.stroke();
  _beTxt(x, '━ BUSY STREET', X0 + 260, Y0 + 80, { font: '700 18px Inter, sans-serif', col: '#ffb05a' });
  x.globalAlpha = a0 * MathX.smooth(t, B.i5Clicks[0] + 0.5, B.i5Clicks[0] + 0.9);
  _beTxt(x, 'the echo is still there, but the noise covers it', ms(BE_CITY_ECHO_MS) + 16, gy - 0.72 * amp, { font: '500 18px Inter, sans-serif', col: 'rgba(159, 246, 255, 0.9)' });
  x.globalAlpha = 1;
}
