/* =====================================================================
   FILM — "What if you realized you were in a simulation?"
   Wires the street, the people, the man who notices, the glitches and the
   interface together; freezes your body in the fake pause, replays the
   opening exactly after the reset, composites the broken picture over the
   void, and grades the picture.
   ===================================================================== */

// your right hand: on the wall (fingers sink a little into it), and reaching up when you look at the sky
const SX_HAND_POSES = {
  touchR:  { p: [0.2, -0.2, -0.45], F: [0, 1, 0], N: [1, 0, 0], curl: [0.08, 0.06, 0.1, 0.16], thumb: [0.5, 0.15], aim: [0, 0.085, 0.022] },
  touchRx: { p: [0.2, -0.2, -0.45], F: [0, 1, 0], N: [1, 0, 0], curl: [0.08, 0.06, 0.1, 0.16], thumb: [0.5, 0.15], aim: [0, 0.085, 0.022] },
};
const SX_HAND_BLEND = { touchR: 0.42, touchRx: 0.02, hidden: 0.4, reach: 0.6 };
const _sxAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
function sxAimHand(name, camera, world, Fw, Nw) {
  const P = SX_HAND_POSES[name], A = _sxAim;
  A.q.copy(camera.quaternion).invert();
  A.y.copy(Fw).normalize().applyQuaternion(A.q); P.F = [A.y.x, A.y.y, A.y.z];
  A.z.copy(Nw).normalize().applyQuaternion(A.q); P.N = [A.z.x, A.z.y, A.z.z];
  A.y.set(...P.F).normalize(); A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize(); A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse);
  const l = P.aim; for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}
// the hand's own clock: it sticks for a moment while reaching up (a stutter), and stops in the pause
function sxHandT(t) {
  if (t >= 38.62 && t < 38.9) return 38.62;
  if (t >= SX.pause[0] && t < SX.pause[1]) return SX.pause[0];
  return t;
}

const FILM = {
  build(app) {
    const { scene, camera, renderer, rng } = app;
    FILM._app = app;
    app.stage = document.getElementById('stage');
    camera.near = 0.02; camera.far = 3000; camera.updateProjectionMatrix();
    app.env = new SimCity(scene, renderer, rng);
    app.env.camera = camera;
    app.env.build();
    app.traffic = new SxTraffic(scene);
    app.cyclist = new SxCyclist(scene);
    app.people = new SxPeople(scene);
    app.pigeons = new SxPigeons(scene);
    app.ball = new SxBall(scene);
    app.cloud = new SxCloud(scene);
    app.aware = new SxAware(scene);
    Look.apply(scene, camera);
    app.hands = new ViewerHands(camera, { scale: 1.0, skin: '#c99a7c', nail: '#dcbcae', sleeve: '#3a4048', cuff: '#2a2f36', watch: true, poses: SX_HAND_POSES, blends: SX_HAND_BLEND });
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const hud = document.getElementById('hud');
    const mk = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.ui = {
      title: mk('story-title big sx-title', '<div class="main"><span class="kick l1">WHAT IF YOU REALIZED</span><span class="kick l2">YOU WERE IN</span><span class="hero l3">A SIMULATION?</span></div>'),
      status: mk('readout story-readout sx-status', '<div class="label">REALITY STATUS</div><div class="value"><span class="v">NORMAL</span></div>'),
      cap: mk('story-caption sx-cap'),
      sys: mk('sx-sys'),
      count: mk('sx-count'),
      play: mk('sx-play', '<div class="l">PLAYBACK POSITION</div><div class="v"></div>'),
    };
    app.ui.lines = [...app.ui.title.querySelectorAll('span')];
    app.wire = new SxWire(scene);
    app.labels = new SxLabels(hud);
    app.breaks = new SxBreaks(app);
    app.ripple = new SxRipple(app.stage);
    app.crack = new SxCrack(app);
    app.audio = typeof SxAudio !== 'undefined' ? new SxAudio(app.tl, app) : new AudioEngine(app.tl);
    // (capture: the ripple's map must be decoded before the first frame that needs it)
    const cf = window.SIM && window.SIM.captureFrame;
    void cf;
  },

  // the camera's pose for a time on the script's tracks (the controller writes the camera; we read it back)
  _camAt(app, t, out) {
    app.cam.update(t);
    const c = app.camera; out.p.copy(c.position); out.q.copy(c.quaternion); out.fov = c.fov; return out;
  },

  update(app, t, tl) {
    const cam = app.camera;
    // the fake pause: your head, your breath, your hands stop with everything else
    if (t >= SX.pause[0] && t < SX.pause[1]) app.cam.update(SX.pause[0]);
    // after the reset: exactly the opening; then your eyes stop on him and the view narrows
    if (t >= SX.restart) {
      const A = this._A || (this._A = { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 66 }), B = this._B || (this._B = { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 66 });
      const u = t - SX.restart, w = MathX.smooth(t, SX.failed.turn, SX.failed.turn + 0.8);
      this._camAt(app, u, A);
      if (w > 0) {
        this._camAt(app, t, B);
        cam.position.lerpVectors(A.p, B.p, w); cam.quaternion.slerpQuaternions(A.q, B.q, w); cam.fov = MathX.lerp(A.fov, B.fov, w);
      } else { cam.position.copy(A.p); cam.quaternion.copy(A.q); cam.fov = A.fov; }
      cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    }
    // the world
    app.env.update(t);
    app.traffic.update(t);
    app.cyclist.update(t);
    app.people.update(t);
    app.pigeons.update(t);
    app.ball.update(t);
    app.cloud.update(t, cam);
    app.aware.update(t, cam);
    // your hand on the wall (aimed at the wall every frame)
    const V = this._hv || (this._hv = { w: new THREE.Vector3(), f: new THREE.Vector3(0, 0.82, -0.57), n: new THREE.Vector3(1, 0, 0) });
    V.w.set(SX.wall.p[0] + 0.03, SX.wall.p[1], SX.wall.p[2]);
    for (const k of ['touchR', 'touchRx']) sxAimHand(k, cam, V.w, V.f, V.n);
    app.hands.update(sxHandT(t));
    // the glitches
    app.wire.update(t);
    app.breaks.update(t, cam);
    app.labels.update(t, app);
    app.ripple.update(t);
    app.crack.update(t);
    FILM.crackNDC = { x: SX_CRACK.x / 540 - 1, y: 1 - SX_CRACK.y / 960 };
    this._overlays(app, t);
  },

  view(app, t) {
    if (app.crack.active(t)) { app.crack.render(t, app); return [app.crack.scene, app.crack.cam]; }
    return [app.scene, app.camera];
  },

  /* ---------------- the interface ---------------- */
  _overlays(app, t) {
    const U = app.ui, W = StoryHUD.win, fr = Math.floor(t * 30 + 1e-6);
    const set = (el, k, v) => { if (el['_' + k] !== v) { el.style[k] = v; el['_' + k] = v; } };
    const html = (el, v) => { if (el._h !== v) { el.innerHTML = v; el._h = v; } };
    // the title: line by line; after the reset it starts again — and stops
    const L = U.lines, R = SX.restart;
    if (t < R) {
      [0.15, 0.45, 0.75].forEach((t0, i) => set(L[i], 'opacity', (W(t, t0, 3.85, 0.3, 0.45)).toFixed(3)));
      if (L[1]._t !== 'a') { L[1].textContent = 'YOU WERE IN'; L[1]._t = 'a'; }
      set(U.title, 'opacity', t < 4.0 ? '1' : '0');
    } else {
      const cut = t >= R + 2.05;
      [0.15, 0.45].forEach((t0, i) => set(L[i], 'opacity', cut ? '0' : MathX.smooth(t, R + t0, R + t0 + 0.3).toFixed(3)));
      set(L[2], 'opacity', '0');
      if (L[1]._t !== 'b') { L[1].textContent = 'YOU WERE IN—'; L[1]._t = 'b'; }
      set(U.title, 'opacity', cut ? '0' : '1');
    }
    // REALITY STATUS (the channel's usual readout) — NOR— at the ball, UNSTABLE for one frame, gone when you look up
    const st = t >= 4.4 && t < SX.up.hud;
    set(U.status, 'opacity', st ? MathX.smooth(t, 4.4, 4.9).toFixed(3) : '0');
    let v = 'NORMAL', red = false;
    if (t >= 18.9 && t < 19.4) v = [0, 1, 2, 4, 5, 7, 8].includes(fr % 9) ? 'NOR—' : 'NORMAL';
    if (t >= SX.brk.unstable && t < SX.brk.unstable + 1 / 30) { v = 'UNSTABLE'; red = true; }
    html(U.status.querySelector('.v'), v); U.status.classList.toggle('red', red);
    // the caption that turns: it is read, then answers back
    const C = SX.cap;
    if (t >= C.t && t < C.end) {
      let s = 'You begin to realize something is wrong.', cls = '';
      const garble = (txt, n) => txt.split('').map((ch, i) => (ch !== ' ' && hash2(i, n) < 0.35 ? '▒░▓#%'.charAt(Math.floor(hash2(i, n + 7) * 5)) : ch)).join('');
      if (t >= C.wait - 0.1 && t < C.wait) s = garble(s, fr);
      else if (t >= C.wait && t < C.sees) { s = 'Wait.'; cls = 'turned'; }
      else if (t >= C.sees - 0.07 && t < C.sees) { s = garble('HE CAN SEE THIS.', fr); cls = 'turned'; }
      else if (t >= C.sees) { s = 'HE CAN SEE THIS.'; cls = 'turned loud'; }
      html(U.cap, s); U.cap.className = 'story-caption sx-cap ' + cls;
      set(U.cap, 'opacity', (t < C.wait ? MathX.smooth(t, C.t, C.t + 0.4) : 1).toFixed(3));
    } else set(U.cap, 'opacity', '0');
    // the system's own text (hard cuts; a two-frame flicker as each line arrives)
    const sysLines = [];
    const on = (a, b) => t >= a && t < b && !(t - a < 0.07 && fr % 2 === 1);
    if (on(SX.up.detected, SX.up.end)) sysLines.push('<div class="a">VIEWER DETECTED</div>');
    if (on(SX.up.observer, SX.up.end)) sysLines.push('<div class="b">ACTIVE OBSERVER: 1</div>');
    if (on(SX.session[0], SX.session[1])) sysLines.push('<div class="b top">VIEWER SESSION ACTIVE</div>');
    if (on(SX.alarm, SX.alarm + 2.4)) sysLines.push('<div class="alarm">SYSTEM: UNAUTHORIZED AWARENESS</div>');
    if (on(SX.rewind[0] - 0.2, SX.rewind[1])) sysLines.push(`<div class="a">RESETTING${'.'.repeat(1 + (fr >> 3) % 3)}</div>`);
    if (on(SX.failed.text, SX.failed.textEnd)) sysLines.push('<div class="a">RESET FAILED</div>');
    html(U.sys, sysLines.join('')); set(U.sys, 'opacity', sysLines.length ? '1' : '0');
    U.sys.classList.toggle('session', on(SX.session[0], SX.session[1]) && !on(SX.alarm, SX.alarm + 2.4));
    // RESET IN 3 · 2 · 1
    const K = SX.count; let n = '';
    if (t >= K[0] && t < K[3]) n = `<div class="l">RESET IN</div><div class="n">${t < K[1] ? 3 : t < K[2] ? 2 : 1}</div>`;
    html(U.count, n); set(U.count, 'opacity', n ? '1' : '0');
    // PLAYBACK POSITION: the video's real timestamp, live
    const pb = t >= SX.playback[0] && t < SX.playback[1];
    set(U.play, 'opacity', pb && !(t - SX.playback[0] < 0.07 && fr % 2) ? '1' : '0');
    if (pb) html(U.play.querySelector('.v'), sxClock(t));
    // the channel's interface goes with the system's arrival
    set(document.querySelector('#hud .story-say'), 'visibility', 'visible');
  },

  /* ---------------- grade ---------------- */
  grade(t, p) {
    const T = (t >= SX.pause[0] && t < SX.pause[1]) ? SX.pause[0] : t;
    p.time = T;
    p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.7; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.12; p.saturation = 1.12; p.contrast = 1.07; p.warmth = 0.04; p.blackLift = 0.01;
    p.vignette = 0.55; p.soft = 0.04; p.bloom = 0.16; p.bloomThreshold = 1.3; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    // the first look: the colour drains a little while he stares
    const look = MathX.smooth(t, SX.look.turn, SX.look.lock + 0.3) * (1 - MathX.smooth(t, SX.look.snap - 0.02, SX.look.snap));
    p.saturation -= 0.25 * look; p.vignette += 0.35 * look;
    // from the moment the system notices you: cooler, a little heavier
    const sys = MathX.smooth(t, SX.up.t, SX.up.detected) * (t < SX.restart ? 1 : 0);
    p.warmth -= 0.08 * sys; p.saturation -= 0.08 * sys; p.vignette += 0.2 * sys;
    // the alarm and the countdown
    const al = MathX.smooth(t, SX.alarm, SX.alarm + 0.2) * (t < SX.rewind[0] ? 1 : 0);
    p.contrast += 0.05 * al; p.warmth += 0.04 * al; p.chroma = 0.012 * al;
    // the hit: a jolt of colour fringing
    p.chroma += 0.12 * MathX.impulse(t, SX.hit, 0.15);
    // the reset: the world runs back (fringing, a vertical smear), white, black
    const rw = MathX.smooth(t, SX.rewind[0], SX.rewind[0] + 0.3) * (t < SX.white[0] ? 1 : 0);
    p.chroma += 0.08 * rw; p.edgeBlur = 0.5 * rw; p.smear.set(0, 0.012 * rw * MathX.smooth(t, SX.rewind[0], SX.rewind[1]));
    if (t >= SX.white[0] && t < SX.white[1]) { p.flash = 1 - 0.3 * MathX.smooth(t, SX.white[0], SX.white[1]); }
    if (t >= SX.white[1] && t < SX.restart) p.fade = 1;
    // the end: cut to black
    if (t >= SX.black) p.fade = 1;
  },

  anchor() { return null; },
  debug(app, t) { return `W ${sxW(t).toFixed(2)} · R ${sxR(t).toFixed(2)} · N ${sxN(t).toFixed(2)}`; },
};
