/* =====================================================================
   SCENE 4 — "How a human can echolocate" (the science space: VOID, void.js).
     D1  "Some human echolocators produce sharp clicks using their tongue.": her mouth, very close: two clicks
     D2  "Sound travels through air at roughly 343 m/s.": THE NEXT CLICK, slowed ≈ 900× (live readout of the real
         time): the air between her and a wall 2 m away (thousands of particles) is pushed by the front
     D3  "If a wall is two meters away … about twelve milliseconds.": the front reaches the wall (5.8 ms), reflects
         (image source) and is back at her ear after 11.7 ms; the arithmetic: 4 m ÷ 343 m/s ≈ 12 ms
     D4  "That's incredibly fast.": one click in REAL time (the whole round trip fits inside one video frame);
         a one-second bar with its 12 ms sliver, an eye blink for scale
     D5  "Your brain doesn't need to hear a completely separate echo…": SCIENCE: a far wall gives a click + a faint
         echo; a near wall's echo is back before the click has died away and blends into it
     D6  "Small differences in timing, loudness and sound quality…": three cues, one per word
     D7  (no narration) three clicks, three surfaces: a hard panel ahead, a heavy curtain on her left, an open
         doorway on her right; each answers differently (and is heard differently)
   Numbers: 2 m there and back = 4 m; 4 / 343 = 0.01166 s ≈ 12 ms. The slowed clock runs at one constant rate, so the
   front's speed on screen never changes.
   ===================================================================== */

BE.s5 = BN_SC[5].start;
BE.d1Clicks = [BE.s4 + 0.85, bnF(4, 'clicks').start + 0.3];
BE.dClick = bnF(4, 'tongue').start + 0.55;              // ★ the click that is slowed
BE.d1b = bnF(4, 'sharp').start - 0.15;
BE.d2 = BE.dClick + 0.05;
BE.d3 = bnF(4, 'if').start - 0.1;
BE.d4 = bnF(4, "that's").start - 0.1;
BE.d5 = bnF(4, 'your').start - 0.15;
BE.d6 = bnF(4, 'small').start - 0.2;
BE.d7 = BN_CLIP[4].speechEnd + 0.35;
BE.dFast = BE.d4 + 0.55;                                 // the real-time click
BE.d7Clicks = [BE.d7 + 0.55, BE.d7 + 2.15, BE.d7 + 3.75];
// the slowed clock: film time → real seconds after the click; one constant rate (the echo is home on "milliseconds")
BE.dBack = bnF(4, 'milliseconds').start + 0.15;
const BE_C4_RT = 4 / 343;
const BE_C4CLOCK = new Track([[BE.dClick, 0], [BE.dClick + 0.45, 0.00008, 'inQuad'], [BE.dBack, BE_C4_RT, 'linear'], [BE.dBack + 2, BE_C4_RT + 0.00003, 'linear']]);
BE.dWall = (() => { for (let t = BE.dClick; t < BE.dBack; t += 0.005) if (BE_C4CLOCK.value(t) >= BE_C4_RT / 2) return t; return BE.dBack; })();

// ---- the set
BE_SET_BUILDERS.push((app, cast) => {
  const vd = app.sets.void = new BeVoid().build();
  vd.scene.environment = beEnvFor(app.renderer, '#28344c', '#10141c', '#06080c');
  vd.hero = cast.heroIn(vd.scene, 'noorC');
  vd.air = new BeAir(vd.scene, [-0.25, 2.1, 0.15, 2.5, -1.4, 1.4], 9000, 41);
  vd.frame = beVoidFrame; vd.fx = beVoidFx;
  vd.update = function (t, L, cam, shot) { const k = shot.dim ?? 1; this.lights[0].intensity = 2.6 * k; this.lights[1].intensity = 2.2 * k; this.lights[2].intensity = (shot.id === 'D1' || shot.id === 'D6' ? 1.1 : 0.3) * k; };
});

// her yaw in D7: ahead (the panel), left (the curtain), right (the doorway), back to the panel
const BE_D7YAW = new Track([[BE.d7, Math.PI / 2], [BE.d7 + 1.05, Math.PI / 2], [BE.d7 + 1.75, Math.PI * 0.98], [BE.d7 + 2.6, Math.PI * 0.98], [BE.d7 + 3.45, 0.04], [BE.d7 + 4.5, 0.04], [BE.d7 + 5.2, Math.PI / 2]]);

function beHeroS4(H, t, set) {
  const B = BE, sh = FILM._shot ? FILM._shot.id : '';
  H.root.visible = true;
  const yaw = sh === 'D7' ? BE_D7YAW.value(t) : Math.PI / 2;
  H.place(0, 0, 0, yaw);
  const breath = 1.3 * Math.sin(t * 2 * Math.PI * 0.24);
  const P = Object.assign({}, GB_POSES.standListen, { hdY: 0, hdZ: 3 });
  if (sh === 'D7') { const turn = Math.abs(BE_D7YAW.value(t + 0.12) - BE_D7YAW.value(t)); P.hdY = MathX.clamp(turn * 60, -12, 12); P.spY = 0; }
  P.chX -= breath; P.LShrug = breath * 0.002; P.RShrug = breath * 0.002;
  gbStandOn(H, P, { L: { p: H.root.localToWorld(new THREE.Vector3(0.1, 0, 0.02)), swing: 0 }, R: { p: H.root.localToWorld(new THREE.Vector3(-0.1, 0, -0.03)), swing: 0 } }, { bend: 0.03 });
  H.applyPose(P);
  const F = Object.assign({}, GB_FACES.focus);
  const clicks = B.d1Clicks.concat([B.dClick, B.dFast], B.d7Clicks);
  const cl = clicks.reduce((m, c) => Math.max(m, MathX.window(t, c - 0.12, c + 0.1, 0.08, 0.1)), 0);
  F.open = 0.12 * cl; F.width = 0.85;
  F.blink = [B.s4 + 2.4, B.d5 + 1.0, B.d7 + 1.4].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
  H.applyFace(F, { x: 0, y: -0.15 });
}

// per frame: pose, visibility of the experiment's props
function beVoidFrame(app, t, shot) {
  const set = this, id = shot.id;
  beHeroS4(set.hero, t, set);
  set.ruler.visible = /^D[234]$/.test(id);
  set.curtain.visible = set.door.visible = id === 'D7';
  set.air.pts.visible = id === 'D2' || id === 'D3';
}

// per frame: the shells, the air, the mouth rings
function beVoidFx(app, t, shot) {
  const set = this, W = set.waves, R = set.rings, m = set._m, wall = set.walls[0];
  if (!m) return;
  if (shot.id === 'D2' || shot.id === 'D3') {
    const T = shot.clock.value(t), Rr = 343 * T, img = set._img;
    const aOut = 0.16 * (1 - MathX.smooth(Rr, 2.2, 3.0));
    W.push(m, Rr, aOut, '#9ff6ff', [wall.p, wall.n], null, 0);
    if (Rr > 2.0) W.push(img, Rr, 0.2 * (1 - MathX.smooth(Rr, 4.4, 5.2)), '#7f8cff', [wall.p, wall.n], null, 0);
    const u = set.air.u; u.uM.value.copy(m); u.uI.value.copy(img); u.uWx.value = wall.p.x; u.uR.value = T > 0 ? Rr : -1;
    u.uA.value = MathX.smooth(t, shot.t0 - 0.2, shot.t0 + 0.6); u.uH.value = app.renderer.getDrawingBufferSize(new THREE.Vector2()).y;
    R.source(m, [BE.dClick], t, { r: 0.05, a: 0.6, dur: 0.5, col: '#9ff6ff' });
  }
  if (shot.id === 'D1') R.source(m, BE.d1Clicks, t, { r: 0.06, a: 0.7, dur: 0.5, col: '#9ff6ff', th: 0.05 });
  if (shot.id === 'D4') R.source(m, [BE.dFast], t, { r: 0.09, a: 0.8, dur: 0.5, col: '#9ff6ff' });
  if (shot.id === 'D7') {
    const objs = set._d7;
    BE.d7Clicks.forEach((c, i) => {
      if (t < c || t > c + 2.4) return;
      const mm = objs[i].m, age = t - c, Rr = 4.2 * age, o = objs[i];
      if (o.wall) { const d = mm.clone().sub(o.wall.p).dot(o.wall.n); if (Rr > d) W.push(mm.clone().addScaledVector(o.wall.n, -2 * d), Rr, 0.4 * o.wall.refl * (1 - MathX.smooth(age, 1.0, 1.9)), o.wall.col, [o.wall.p, o.wall.n], null, 0); }
      R.source(mm, [c], t, { r: 0.07, a: 0.8, dur: 0.45, col: '#9ff6ff' });
    });
  }
}

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE;
  const vd = () => FILM._app.sets.void;
  const mouth = () => vd()._m || V(0.12, 1.5, 0);
  const sci = (k = 1) => ({ ac: 1, world: 0.12 * k, hero: 0.3 * k, glow: 0.1 });
  const lab = (p, html, a, cls, dx, dy) => ({ p, html, a, cls, dx, dy });
  const S = [
    // D1a: her, in the science space (medium, three-quarter front); the first click
    { id: 'D1', t0: B.s4, t1: B.d1b, set: 'void', look: () => BE_REAL,
      cam: beMove(B.s4, B.d1b, [V(1.75, 1.5, -1.05), V(0.05, 1.32, 0), 34], [V(1.45, 1.52, -0.82), V(0.05, 1.38, 0), 30], { dof: 0.6 }) },
    // D1b: SCIENCE: how the click is made (a cut-away of the mouth: the tongue seals against the palate, snaps down)
    { id: 'D1b', t0: B.d1b, t1: B.d2, set: 'void', look: () => BE_DARK,
      cam: () => ({ pos: V(0, 30, 0), at: V(0, 40, 0.01), fov: 40, focus: 1, dof: 0 }),
      draw: (cv, t) => beDrawTongue(cv, t) },
    // D2: side-on: her, the air, the wall 2 m away; the front leaves her mouth
    { id: 'D2', t0: B.d2, t1: B.d3, set: 'void', tag: true, clock: BE_C4CLOCK, clockId: 'c4', decay: 0.0006, gain: 1.4, heroGain: 1.0, look: () => sci(),
      cam: (t) => { const m = mouth(), k = Ease.inOutSine(MathX.ramp(t, B.d2, B.d3)); return { pos: V(m.x + 0.75 + 0.35 * k, 1.55 - 0.1 * k, 3.6 - 0.35 * k), at: V(m.x + 1.05 + 0.15 * k, 1.2, 0), fov: 50, focus: 3.5, dof: 0 }; },
      labels: (t) => { const T = BE_C4CLOCK.value(t), m = mouth(), x = Math.min(m.x + 343 * T, m.x + 1.95);
        return [lab(V(x, 2.35, 0), '<div class="k">SPEED OF SOUND IN AIR</div><div class="v">343 <small>m/s</small></div>', StoryHUD.win(t, bnF(4, 'three').start - 0.3, B.d3 + 0.1, 0.3, 0.3))]; } },
    // D3: the wall: the front arrives, reflects, and is followed back to her
    { id: 'D3', t0: B.d3, t1: B.d4, set: 'void', tag: true, clock: BE_C4CLOCK, clockId: 'c4', decay: 0.0006, gain: 1.4, heroGain: 1.1, look: () => sci(),
      cam: (t) => { const m = mouth(), k = Ease.inOutSine(MathX.ramp(t, B.d3, B.d4)); return { pos: V(m.x + MathX.lerp(2.75, 0.95, k), MathX.lerp(1.25, 1.6, k), MathX.lerp(2.3, 2.9, k)), at: V(m.x + MathX.lerp(1.75, 0.95, k), 1.25, 0), fov: MathX.lerp(46, 52, k), focus: 2.5, dof: 0 }; },
      labels: (t) => { const T = BE_C4CLOCK.value(t), m = mouth(), w = vd().walls[0].p.x;
        return [
          lab(V(m.x + 1.0, 0.85, 0.35), '<div class="v">2 <small>m</small></div>', StoryHUD.win(t, bnF(4, 'two').start - 0.15, B.d4, 0.3, 0.3)),
          lab(V(w, 1.9, 0), '<div class="k">AT THE WALL</div><div class="v">5.8 <small>ms</small></div>', T >= BE_C4_RT / 2 ? StoryHUD.win(t, B.dWall, B.dBack - 0.3, 0.2, 0.3) : 0, '', 7, 0),
          lab(V(m.x, 2.0, 0), '<div class="k">BACK AT HER EARS</div><div class="v">11.7 <small>ms</small></div>', T >= BE_C4_RT * 0.999 ? StoryHUD.win(t, B.dBack - 0.05, B.d4, 0.2, 0.3) : 0),
          lab(null, '<div class="k">THERE AND BACK: 4 m</div><div class="v">4 m ÷ 343 m/s ≈ 12 <small>ms</small></div>', StoryHUD.win(t, bnF(4, 'twelve').start - 0.1, B.d4, 0.35, 0.3), 'w', 18, -34),
        ]; } },
    // D4: real time; the whole trip inside one video frame
    { id: 'D4', t0: B.d4, t1: B.d5, set: 'void', decay: 0.5, gain: 1.5, heroGain: 1.0, look: () => sci(1.2),
      cam: beMove(B.d4, B.d5, [V(1.0, 1.7, 4.4), V(1.0, 1.15, 0), 50], [V(1.05, 1.75, 4.9), V(1.0, 1.15, 0), 50], { dof: 0 }),
      draw: (cv, t) => beDrawFast(cv, t) },
    // D5: science: a click and its echo, far and near
    { id: 'D5', t0: B.d5, t1: B.d6, set: 'void', look: () => BE_DARK,
      cam: () => ({ pos: V(0, 30, 0), at: V(0, 40, 0.01), fov: 40, focus: 1, dof: 0 }),
      draw: (cv, t) => beDrawFused(cv, MathX.ramp(t, B.d5 + 0.15, B.d6 - 0.8)) },
    // D6: three cues over her, listening
    { id: 'D6', t0: B.d6, t1: B.d7, set: 'void', dim: 0.7, look: () => BE_REAL,
      cam: beMove(B.d6, B.d7, [V(1.55, 1.62, -1.2), V(0.1, 1.45, 0), 34], [V(1.2, 1.58, -0.95), V(0.1, 1.48, 0), 30], { dof: 0.6 }),
      draw: (cv, t) => beDrawCues(cv, t) },
    // D7: three clicks, three surfaces (from above and behind her)
    { id: 'D7', t0: B.d7, t1: B.s5, set: 'void', tag: true, decay: 0.7, gain: 1.5, heroGain: 1.0, look: () => ({ ac: 1, world: 0.3, hero: 0.45, glow: 0.2 }),
      cam: beMove(B.d7, B.s5, [V(-3.7, 4.6, 0.5), V(0.6, 0.35, 0), 58], [V(-3.6, 4.4, -0.5), V(0.6, 0.35, 0), 58], { dof: 0 }),
      labels: (t) => { const o = vd()._d7; if (!o) return [];
        return o.map((q, i) => lab(q.lab, q.html, StoryHUD.win(t, B.d7Clicks[i] + 0.35, B.s5 - 0.3, 0.3, 0.3), 'small')); } },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s5;
})();

// ---- pulses; also places the wall exactly 2.00 m from her mouth
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, B = BE, set = app.sets.void, H = set.hero;
  FILM._shot = beShotAt(B.d2 + 0.5); beHeroS4(H, B.d2 + 0.5, set);
  const m = set._m = beMouth(H);
  const wx = m.x + 2.0;
  set.wall.position.x = wx + 0.04; set.walls[0].p.x = wx;
  set.ruler.position.set(m.x - 0.05, 0, 0.35);
  set._img = m.clone(); set._img.x = 2 * wx - m.x;
  // the slowed click (clock c4: t = 0 is the click, real speed) and its reflection from the image source
  P.add({ t: 0, p: m, kind: 0, speed: 343, w: 0.06, life: 1, str: 1.4, set: 'void', clock: 'c4' });
  P.add({ t: 0, p: set._img, kind: 0, speed: 343, w: 0.06, life: 1, str: 0.75, set: 'void', clock: 'c4', echo: true });
  // D4: one click in real time (film clock)
  P.add({ t: B.dFast, p: m, kind: 0, speed: 343, w: 0.07, life: 1.5, str: 1.5, set: 'void', shot: 'D4' });
  P.add({ t: B.dFast, p: set._img, kind: 0, speed: 343, w: 0.07, life: 1.5, str: 0.6, set: 'void', shot: 'D4', echo: true });
  // D7: the three surfaces around her
  set.curtain.position.set(m.x - 0.1, 0, -1.7);
  set.door.position.set(m.x - 0.1, 0, 1.75);
  const objs = set._d7 = [
    { wall: { p: new THREE.Vector3(wx, 0, 0), n: new THREE.Vector3(-1, 0, 0), refl: 0.9, col: '#62f3ff' }, lab: new THREE.Vector3(wx, 2.2, 0), html: '<div class="k">HARD PANEL</div><div class="s">STRONG, SHARP ECHO</div>' },
    { wall: { p: new THREE.Vector3(0, 0, -1.62), n: new THREE.Vector3(0, 0, 1), refl: 0.22, col: '#7a5cff' }, lab: new THREE.Vector3(m.x - 0.1, 2.3, -1.7), html: '<div class="k">HEAVY CURTAIN</div><div class="s">WEAK, DULL ECHO</div>' },
    { wall: null, lab: new THREE.Vector3(m.x - 0.1, 2.55, 1.75), html: '<div class="k">OPEN DOORWAY</div><div class="s">THE SOUND GOES THROUGH</div>' },
  ];
  B.d7Clicks.forEach((c, i) => {
    FILM._shot = beShotAt(c + 0.01); beHeroS4(H, c + 0.01, set);
    const mm = objs[i].m = beMouth(H);
    P.add({ t: c, p: mm, kind: 0, speed: 4.2, w: 0.08, life: 2.3, str: 1.6, set: 'void', shot: 'D7' });
  });
  FILM._shot = null;
});

// ---- SCIENCE drawings (HUD canvas, 1920×1080)
function _beTxt(x, s, X, Y, o = {}) { x.font = o.font || '600 26px Inter, sans-serif'; x.fillStyle = o.col || 'rgba(220, 240, 255, 0.9)'; x.textAlign = o.align || 'left'; x.textBaseline = 'middle'; x.fillText(s, X, Y); x.textAlign = 'left'; }
function _bePanel(x, X, Y, W, H, a = 0.78) { x.fillStyle = `rgba(5, 10, 18, ${a})`; x.beginPath(); x.roundRect(X, Y, W, H, 18); x.fill(); x.strokeStyle = 'rgba(98, 243, 255, 0.28)'; x.lineWidth = 2; x.stroke(); }

// D4: a one-second bar; the 12 ms round trip is a sliver at its start; an eye blink (≈ 100–400 ms) for scale
function beDrawFast(cv, t) {
  const x = cv.getContext('2d'), B = BE, k = Ease.outCubic(MathX.ramp(t, B.d4 + 0.1, B.d4 + 0.8));
  x.clearRect(0, 0, cv.width, cv.height);
  const X0 = 300, X1 = 1620, W = X1 - X0;
  _bePanel(x, X0 - 60, 110, W + 120, 270);
  _beTxt(x, 'ONE SECOND', X0, 160, { col: 'rgba(220, 240, 255, 0.75)' });
  x.fillStyle = 'rgba(255, 255, 255, 0.12)'; x.fillRect(X0, 190, W * k, 34);
  // the blink
  const kb = MathX.smooth(t, B.d4 + 0.7, B.d4 + 1.1);
  x.fillStyle = `rgba(255, 190, 120, ${0.22 * kb})`; x.fillRect(X0 + W * 0.1, 250, W * 0.3 * kb, 22);
  _beTxt(x, 'AN EYE BLINK ≈ 100–400 ms', X0 + W * 0.1, 300, { col: `rgba(255, 211, 154, ${0.9 * kb})`, font: '600 24px Inter, sans-serif' });
  // the round trip
  const ks = MathX.smooth(t, B.dFast - 0.05, B.dFast + 0.1), pulse = 0.6 + 0.4 * Math.exp(-(t - B.dFast) * 3);
  x.shadowColor = '#62f3ff'; x.shadowBlur = 18 * ks; x.fillStyle = `rgba(98, 243, 255, ${ks * pulse})`; x.fillRect(X0, 186, Math.max(3, W * 0.012), 42); x.shadowBlur = 0;
  _beTxt(x, '12 ms: THERE AND BACK', X0 + 26, 252, { col: `rgba(159, 246, 255, ${ks})`, font: '700 28px Inter, sans-serif' });
  _beTxt(x, 'ALL OF IT HAPPENS INSIDE ONE FRAME OF THIS VIDEO (33 ms)', X1, 340, { col: `rgba(220, 240, 255, ${0.7 * MathX.smooth(t, B.dFast + 0.3, B.dFast + 0.7)})`, font: '500 22px Inter, sans-serif', align: 'right' });
}

// D5: what reaches the ear: far wall → click + a separate faint echo; near wall → the echo is back while the click
// still rings, and the two blend (the click itself sounds different). Shapes illustrative; delays from the distances.
function beDrawFused(cv, k) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height;
  x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(4, 8, 14, 0.94)'; x.fillRect(0, 0, W, H);
  const x0 = 470, x1 = 1700, msMax = 16;
  const click = (ms) => (ms < 0 ? 0 : Math.exp(-ms / 0.9));
  const rows = [
    ['WALL 2 m AWAY', 'echo after 11.7 ms', (ms) => click(ms) + 0.38 * click(ms - 11.66), '#62f3ff', 'a click … then a faint echo'],
    ['WALL 0.5 m AWAY', 'echo after 2.9 ms', (ms) => click(ms) + 0.6 * click(ms - 2.92), '#ffb05a', 'the echo blends into the click: it changes how the click sounds'],
  ];
  _beTxt(x, 'ONE CLICK  →  WHAT REACHES THE EAR', x0, 110, { font: '600 26px Inter, sans-serif' });
  rows.forEach(([name, sub, f, col, cap], i) => {
    const y0 = 330 + i * 330, kk = MathX.clamp(k * 1.6 - i * 0.55, 0, 1);
    _beTxt(x, name, 120, y0 - 30, { col, font: '600 30px Inter, sans-serif' });
    _beTxt(x, sub, 120, y0 + 14, { col: 'rgba(220, 240, 255, 0.7)', font: '500 24px Inter, sans-serif' });
    x.strokeStyle = 'rgba(255,255,255,0.15)'; x.lineWidth = 2; x.beginPath(); x.moveTo(x0, y0 + 60); x.lineTo(x1, y0 + 60); x.stroke();
    x.strokeStyle = col; x.lineWidth = 3; x.shadowColor = col; x.shadowBlur = 12; x.beginPath();
    const n = 1100, upto = Math.floor(n * kk);
    for (let j = 0; j <= upto; j++) { const ms = (j / n) * msMax, v = f(ms) * Math.cos(ms * 26); const X = x0 + (x1 - x0) * (j / n), Y = y0 + 60 - v * 150; if (j) x.lineTo(X, Y); else x.moveTo(X, Y); }
    x.stroke(); x.shadowBlur = 0;
    _beTxt(x, cap, x0, y0 + 115, { col: `rgba(220, 240, 255, ${0.85 * MathX.smooth(kk, 0.85, 1)})`, font: '500 26px Inter, sans-serif' });
  });
  x.fillStyle = 'rgba(220, 240, 255, 0.6)'; x.font = '500 22px Inter, sans-serif';
  for (const ms of [0, 4, 8, 12, 16]) x.fillText(ms + ' ms', x0 + (x1 - x0) * ms / msMax - 22, 1000);
}

// D6: three cues, each appears on its word: timing (near/far), loudness (strong/weak), quality (bright/dull)
function beDrawCues(cv, t) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height;
  x.clearRect(0, 0, W, H);
  const cues = [
    ['TIMING', bnF(4, 'timing').start, 'later = farther', (ms, i) => Math.exp(-Math.pow((ms - (i ? 7 : 2.5)) / 0.18, 2))],
    ['LOUDNESS', bnF(4, 'loudness').start, 'stronger = bigger or harder', (ms, i) => (i ? 0.35 : 1) * Math.exp(-Math.pow((ms - 4.5) / 0.18, 2))],
    ['SOUND QUALITY', bnF(4, 'quality').start - 0.3, 'duller = softer surface', (ms, i) => i ? 0.55 * Math.exp(-Math.pow((ms - 4.5) / 0.9, 2)) : Math.exp(-Math.pow((ms - 4.5) / 0.14, 2))],
  ];
  const cw = 500, gap = 40, X0 = (W - (3 * cw + 2 * gap)) / 2, Y0 = 90, ch = 330;
  cues.forEach(([name, t0, cap, f], c) => {
    const a = MathX.smooth(t, t0 - 0.1, t0 + 0.35); if (a <= 0) return;
    x.globalAlpha = a;
    const X = X0 + c * (cw + gap) + 30 * (1 - a);
    _bePanel(x, X, Y0, cw, ch, 0.8);
    _beTxt(x, name, X + 30, Y0 + 44, { font: '700 28px Inter, sans-serif', col: '#9ff6ff' });
    [0, 1].forEach((i) => {
      const y = Y0 + 130 + i * 95, col = i ? '#7a5cff' : '#62f3ff';
      x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 2; x.beginPath(); x.moveTo(X + 30, y + 30); x.lineTo(X + cw - 30, y + 30); x.stroke();
      x.strokeStyle = col; x.lineWidth = 3; x.beginPath();
      for (let j = 0; j <= 300; j++) { const ms = j / 300 * 10, v = f(ms, i) * (c === 2 && !i ? Math.cos(ms * 60) : Math.cos(ms * 22)); const XX = X + 30 + (cw - 60) * j / 300, YY = y + 30 - Math.abs(v) * 70; if (j) x.lineTo(XX, YY); else x.moveTo(XX, YY); }
      x.stroke();
    });
    _beTxt(x, cap, X + 30, Y0 + ch - 26, { font: '500 23px Inter, sans-serif', col: 'rgba(220, 240, 255, 0.8)' });
    x.globalAlpha = 1;
  });
  const ka = MathX.smooth(t, bnF(4, 'spatial').start - 0.1, bnF(4, 'spatial').start + 0.4);
  if (ka > 0) _beTxt(x, 'CLUES ABOUT DISTANCE, SIZE AND SURFACE', W / 2, Y0 + ch + 60, { align: 'center', font: '700 30px Inter, sans-serif', col: `rgba(255, 211, 154, ${ka})` });
}

// D1b: a cut-away of the mouth in profile (illustrative): the tongue seals against the roof of the mouth, then snaps
// down; the sudden release is the click (an outward burst from the lips)
function beDrawTongue(cv, t) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height, B = BE;
  x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(4, 8, 14, 0.96)'; x.fillRect(0, 0, W, H);
  const clicks = [B.d1Clicks[1], B.dClick];
  // pressed (1) → released (0): presses over 0.35 s before each click, snaps down in 0.05 s
  let k = 0; for (const c of clicks) k = Math.max(k, MathX.smooth(t, c - 0.45, c - 0.12) * (1 - MathX.smooth(t, c - 0.01, c + 0.05)));
  const ox = 60, oy = -170, S = 1.0, P = (a, b) => [ox + a * S, oy + b * S];
  // the head in profile (facing right)
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  x.beginPath();
  const pts = [[560, 250], [700, 205], [860, 240], [930, 330], [955, 430], [985, 505], [1040, 588], [990, 618], [1004, 650], [992, 672], [1000, 698], [972, 772], [880, 805], [860, 960], [600, 960], [560, 800], [500, 560], [520, 380]];
  const n = pts.length, mid = (a, b) => P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  x.moveTo(...mid(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) x.quadraticCurveTo(...P(...pts[i]), ...mid(pts[i], pts[(i + 1) % n]));
  x.closePath(); x.fillStyle = 'rgba(138, 90, 66, 0.22)'; x.fill(); x.strokeStyle = 'rgba(255, 214, 170, 0.75)'; x.lineWidth = 4; x.stroke();
  // the roof of the mouth (hard palate) and the teeth ridge
  x.beginPath(); x.moveTo(...P(700, 640)); x.quadraticCurveTo(...P(830, 585), ...P(962, 636)); x.strokeStyle = 'rgba(255, 230, 200, 0.85)'; x.lineWidth = 6; x.stroke();
  // the tongue (pressed: its top seals the palate; released: it drops, the air pocket collapses)
  const top = MathX.lerp(705, 610, k), tipY = MathX.lerp(708, 646, k);
  x.beginPath(); x.moveTo(...P(690, 800)); x.bezierCurveTo(...P(680, 720), ...P(760, top - 10), ...P(845, top)); x.bezierCurveTo(...P(905, top), ...P(950, tipY - 10), ...P(958, tipY));
  x.bezierCurveTo(...P(950, tipY + 30), ...P(900, 760), ...P(850, 800)); x.closePath();
  x.fillStyle = 'rgba(214, 112, 112, 0.85)'; x.fill(); x.strokeStyle = 'rgba(255, 190, 180, 0.9)'; x.lineWidth = 3; x.stroke();
  // the burst at each release: arcs leaving the lips
  for (const c of clicks) {
    const age = t - c; if (age < 0 || age > 1.2) continue;
    for (let i = 0; i < 4; i++) { const r = 30 + 900 * Math.max(0, age - i * 0.06), a = Math.max(0, 1 - age / 1.2) * (1 - i * 0.2);
      x.beginPath(); x.arc(...P(1000, 676), r, -0.75, 0.75); x.strokeStyle = `rgba(159, 246, 255, ${a})`; x.lineWidth = 5 - i; x.shadowColor = '#62f3ff'; x.shadowBlur = 16; x.stroke(); }
    x.shadowBlur = 0;
  }
  x.restore();
  // the steps
  const a1 = MathX.smooth(t, B.d1b + 0.1, B.d1b + 0.5), a2 = MathX.smooth(t, clicks[0], clicks[0] + 0.3);
  _beTxt(x, 'HOW A TONGUE CLICK IS MADE', 1440, 250, { font: '700 30px Inter, sans-serif', col: `rgba(159, 246, 255, ${a1})` });
  _beTxt(x, '1   the tongue seals against', 1440, 330, { font: '500 30px Inter, sans-serif', col: `rgba(230, 245, 255, ${a1})` });
  _beTxt(x, '     the roof of the mouth', 1440, 372, { font: '500 30px Inter, sans-serif', col: `rgba(230, 245, 255, ${a1})` });
  _beTxt(x, '2   it snaps down: the sudden', 1440, 450, { font: '500 30px Inter, sans-serif', col: `rgba(230, 245, 255, ${a2})` });
  _beTxt(x, '     release is a sharp click', 1440, 492, { font: '500 30px Inter, sans-serif', col: `rgba(230, 245, 255, ${a2})` });
}
