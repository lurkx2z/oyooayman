/* =====================================================================
   FILM — "What if air became 10× denser?"
   Maps film time onto the story clock (the cold open, the rewind), runs
   the street, the wind and the people on it, draws the HUD (density,
   wind, the live speeds, the one big comparison) and grades the picture.
   ===================================================================== */

const AIR_HAND_POSES = {
  shieldL: { p: [0.13, -0.06, -0.3], F: [-0.25, 0.96, -0.1], N: [0.1, 0.1, -1], curl: [0.15, 0.18, 0.22, 0.28], thumb: [0.4, 0.15] },
  shieldR: { p: [0.17, -0.14, -0.33], F: [-0.35, 0.92, -0.15], N: [0.1, 0.1, -1], curl: [0.3, 0.35, 0.4, 0.45], thumb: [0.4, 0.25] },
};
const AIR_HAND_BLEND = { shieldL: 0.22, shieldR: 0.2, hidden: 0.5 };

const FILM = {
  build(app) {
    const { scene, camera, renderer, rng } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 3000; camera.updateProjectionMatrix();
    app.env = new AirCity(scene, renderer, rng); app.env.camera = camera; app.env.build();
    app.people = new AirPeople(scene);
    app.ball = new AirBall(scene, app.people);
    app.cyclists = new AirCyclists(scene);
    app.traffic = new AirTraffic(scene);
    app.wind = new AirWind(app);
    Look.apply(scene, camera);
    app.hands = new ViewerHands(camera, { scale: 1.0, skin: '#c99a7c', nail: '#dcbcae', sleeve: '#4a4f45', cuff: '#33362f', watch: true, poses: AIR_HAND_POSES, blends: AIR_HAND_BLEND });
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const hud = document.getElementById('hud');
    const mk = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.ui = {
      title: mk('story-title big center ar-title', '<div class="main"><span class="kick">WHAT IF AIR</span><span class="hero">BECAME 10× DENSER?</span></div>'),
      dens: mk('readout story-readout ar-dens', '<div class="label">AIR DENSITY</div><div class="value"><span class="v">1.0×</span></div>'),
      wind: mk('readout story-readout ar-wind', '<div class="label">WIND</div><div class="value"><span class="v">60 KM/H</span></div>'),
      rewind: mk('ar-rewind', '33 SECONDS EARLIER'),
      tagA: mk('ar-tag'), tagB: mk('ar-tag left'), tagC: mk('ar-tag ghost'),
      line: mk('ar-line'),
      big: mk('ar-big', '<div class="l">NORMAL-AIR EQUIVALENT</div><div class="v">≈ 190 KM/H</div>'),
      force: mk('ar-force', '10× DENSITY ≈ 10× THE FORCE<br><span>AT THE SAME SPEED</span>'),
    };
    // the last frame: a dark sheet of plywood whips across the lens
    app.sweep = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 2.0), Mat.std('#3a3128', { roughness: 0.9 })); app.sweep.frustumCulled = false; scene.add(app.sweep);
    app.audio = typeof AirAudio !== 'undefined' ? new AirAudio(app.tl, app) : new AudioEngine(app.tl);
  },

  update(app, t) {
    const S = airStory(t), cam = app.camera;
    app.S = S;
    // the gale shakes you a little
    const L = airLoad(S);
    if (L > 0.3) { const k = (L - 0.3) * 0.9, D = MathX.deg; cam.rotation.z += noise1(t * 11, 71) * D(0.5) * k; cam.rotation.x += noise1(t * 9, 72) * D(0.4) * k; cam.position.x += noise1(t * 7, 73) * 0.02 * k; cam.updateMatrixWorld(true); }
    app.env.update(t, S);
    app.people.update(S);
    app.ball.update(S);
    app.cyclists.update(S);
    app.traffic.update(S);
    app.wind.update(t, S, cam);
    app.hands.update(t);
    const k = (t - AR.sweep) / (AR.black - AR.sweep), sw = app.sweep;
    sw.visible = k > -0.2 && k < 1.2;
    if (sw.visible) { const v = this._sv || (this._sv = new THREE.Vector3()); v.set(MathX.lerp(2.2, -1.6, k), MathX.lerp(0.3, -0.1, k), MathX.lerp(-1.2, -0.35, k)).applyMatrix4(cam.matrixWorld); sw.position.copy(v); sw.quaternion.copy(cam.quaternion); sw.rotateX(1.35); sw.rotateZ(0.4 + 0.8 * k); }
    this._overlays(app, t, S);
  },

  // a screen position (design px) for a world point; null if behind you
  _proj(app, p) { const v = this._pv || (this._pv = new THREE.Vector3()); v.copy(p).project(app.camera); if (v.z > 1) return null; return [(v.x + 1) * 540, (1 - v.y) * 960]; },
  _tag(el, xy, html, on) {
    if (!on || !xy || xy[0] < 20 || xy[0] > 1060 || xy[1] < 60 || xy[1] > 1860) { el.style.opacity = '0'; return; }
    if (el._h !== html) { el.innerHTML = html; el._h = html; }
    el.style.opacity = '1'; el.style.left = `calc(var(--u) * ${MathX.clamp(xy[0], 90, 990).toFixed(1)})`; el.style.top = `calc(var(--u) * ${MathX.clamp(xy[1], 160, 1700).toFixed(1)})`;
  },

  _overlays(app, t, S) {
    const U = app.ui, W = StoryHUD.win, set = (el, k, v) => { if (el['_' + k] !== v) { el.style[k] = v; el['_' + k] = v; } }, html = (el, v) => { if (el._hh !== v) { el.innerHTML = v; el._hh = v; } };
    set(U.title, 'opacity', (1 - MathX.smooth(t, 2.55, 2.95)).toFixed(3));
    set(U.rewind, 'opacity', W(t, 3.1, 5.0, 0.15, 0.35).toFixed(3));
    // AIR DENSITY: from the change on (and in the cold open); WIND: once it matters
    const d = airDensity(S), showD = t < AR.rewind[0] || S >= AR.density[0] - 0.2;
    set(U.dens, 'opacity', showD ? (t < AR.rewind[0] ? 1 : MathX.smooth(S, AR.density[0] - 0.2, AR.density[0] + 0.1)).toFixed(3) : '0');
    html(U.dens.querySelector('.v'), `${d >= 9.95 ? '10' : d.toFixed(1)}×`);
    U.dens.classList.toggle('small', S > 9 && S < AR.final && t > AR.rewind[1]);
    const showW = t < AR.rewind[0] || S >= AR.wind;
    set(U.wind, 'opacity', showW ? (t < AR.rewind[0] ? 1 : MathX.smooth(S, AR.wind, AR.wind + 0.3)).toFixed(3) : '0');
    html(U.wind.querySelector('.v'), `${Math.round(airWindKmh(S) / 5) * 5} KM/H`);
    // tags pinned to things
    const V = this._tv || (this._tv = new THREE.Vector3());
    let a = null, b = null, c = null;
    if (S > AR.throwT + 0.1 && S < 11.8) a = [this._proj(app, V.copy(app.ball.m.position).add({ x: 0, y: 0.5, z: 0 })), 'AIR DRAG ↑ ~10×'];
    if (S > AR.throwT + 0.6 && S < 11.8) c = [this._proj(app, V.copy(app.ball.ghostPts[app.ball.ghostPts.length - 1]).add({ x: 0, y: 0.6, z: 0 })), 'NORMAL AIR'];
    if (S > 12.6 && S < 16.0) a = [this._proj(app, V.set(4.35, 2.3, app.cyclists.a.g.position.z)), `${Math.round(app.cyclists.speedA(S) * 3.6)} KM/H`];
    if (S > 15.9 && S < 20.8) { const z = app.traffic.heroZ(S); a = [this._proj(app, V.set(1.75, 2.0, z)), `SPEED <b>${Math.round(app.traffic.heroSpeed(S) * 3.6)}</b> KM/H`]; }
    if (S > AR.fall + 0.15 && S < AR.fall + 1.7) { a = [this._proj(app, V.copy(app.wind.clamp.position).add({ x: 0, y: 0.15, z: 0 })), 'STEEL CLAMP · 1.2 kg']; this._right = true; b = [this._proj(app, V.copy(app.wind.sheet.position).add({ x: -0.6, y: 0.2, z: 0 })), 'PLYWOOD · 18 kg']; }
    U.tagA.classList.toggle('right', !!this._right); this._right = false;
    this._tag(U.tagA, a && a[0], a && a[1], !!a); this._tag(U.tagB, b && b[0], b && b[1], !!b); this._tag(U.tagC, c && c[0], c && c[1], !!c);
    // one-line notes
    let line = '';
    if (S > 20.0 && S < 20.85) line = 'TO HOLD 90 KM/H: ≈ 7× THE POWER';
    html(U.line, line); set(U.line, 'opacity', line ? '1' : '0');
    set(U.force, 'opacity', W(S, 27.6, 29.4, 0.25, 0.3).toFixed(3));
    set(U.big, 'opacity', (t > AR.rewind[1] ? W(S, AR.eq, 34.0, 0.3, 0.4) : 0).toFixed(3));
  },

  grade(t, p) {
    const S = airStory(t), L = airLoad(S);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.7; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.12 - 0.05 * Math.min(1, L); p.saturation = 1.12 - 0.12 * Math.min(1, L); p.contrast = 1.07 + 0.04 * Math.min(1, L); p.warmth = 0.04 - 0.05 * Math.min(1, L); p.blackLift = 0.01;
    p.vignette = 0.5 + 0.25 * Math.min(1, L); p.soft = 0.04; p.bloom = 0.16; p.bloomThreshold = 1.3; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    // the rewind
    const rw = StoryHUD.win(t, AR.rewind[0], AR.rewind[1], 0.12, 0.3);
    p.chroma = 0.06 * rw; p.edgeBlur = 0.5 * rw;
    const app = FILM._app;
    if (app && app.cam) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.005, -0.02, 0.02), MathX.clamp(-pr / vf * 0.005, -0.02, 0.02));
    }
    // the dust the gale carries: a little haze
    if (app && app.scene.fog) app.scene.fog.density = 0.0012 + 0.0018 * Math.min(1, L);
    // the impact, the final sweep, black
    p.flash = 0.25 * MathX.impulse(t, AR.bill.glass, 0.12);
    if (t >= AR.black) p.fade = 1;
  },

  anchor() { return null; },
  debug(app, t) { const S = airStory(t); return `S ${S.toFixed(2)} · ρ ${airDensity(S).toFixed(1)}× · wind ${airWindKmh(S).toFixed(0)} km/h · load ${airLoad(S).toFixed(2)}`; },
};
