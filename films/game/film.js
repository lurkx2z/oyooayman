/* =====================================================================
   FILM — "POV: This video is a game. Don't die."
   Wires the facility, the two people, the world effects, the game and
   system HUDs and the screen effects together; freezes the world for the
   RESET— glitch; composites the cracked picture over the void; grades.
   ===================================================================== */

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    FILM._app = app;
    app.stage = document.getElementById('stage');
    camera.near = 0.02; camera.far = 200; camera.updateProjectionMatrix();
    app.fac = new Facility(scene, renderer); app.fac.build();
    for (const L of [app.fac.hemi, app.fac.key, app.fac.top, app.fac.pView, app.fac.pCell, app.fac.pRoute, app.fac.pB, app.fac.pHall, app.fac.pCore]) L.layers.enable(1);
    app.aware = new GmAware(scene);
    app.tech = new GmTech(scene);
    Look.apply(scene, camera);
    app.cam = app.cam || new CameraController(camera, CONFIG.camera);     // (the touch FX needs the camera's pose at the contact)
    app.touchFx = new GmGlassTouch(app);
    app.blast = new GmBlast(app);
    app.drone = new GmDrone(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.gm = new GmHud(document.getElementById('hud'));
    app.rippleW = new GmRipple('gmRippleW', document.getElementById('gl'), { rings: 3.5 });
    app.rippleS = new GmRipple('gmRippleS', app.stage, { rings: 4.5 });
    app.crack = new GmCrack(app);
    if (URLP.has('safe')) new GmSafe(document.getElementById('hud'));
    app.audio = typeof GmAudio !== 'undefined' ? new GmAudio(app.tl, app) : new AudioEngine(app.tl);
  },

  // the world's clock: film time, except RESET— (it freezes, then runs back a little)
  world(t) {
    const R = GM.reach, a = R.glitch[0], b = a + 0.25, c = R.override;
    if (t < a || t >= R.cancelled) return t;
    if (t < b) return a;
    if (t < c) return a - (t - b) * 1.4;
    return a - (c - b) * 1.4;
  },

  update(app, t) {
    const cam = app.camera, tw = this.world(t);
    app.fac.update(tw);
    app.tech.update(tw, cam, app.aware);
    app.aware.techHead = app.tech.p.root.visible ? app.tech.j.head.getWorldPosition(new THREE.Vector3()) : null;
    app.aware.droneP = app.drone.g.visible ? app.drone.p : null;
    app.aware.update(tw, cam);
    app.touchFx.update(tw);
    app.blast.update(tw);
    app.drone.update(tw, cam, app.aware);
    app.gm.update(t, app);
    // the glass ripple (the canvas only: a world effect) and the screen ripples (the whole stage: HUD and subtitles bend too)
    const T = GM_TARGETS;
    app.rippleW.update(t, [{ t0: GM.touch.contact, x: T.palm.x, y: T.palm.y, R: 520, amp: 46, dur: 1.4 }]);
    app.rippleS.update(t, [
      { t0: GM.reset.press, x: T.screen.x, y: T.screen.y, R: 2100, amp: 170, dur: 1.9 },
      { t0: GM.reset.hit, x: T.crack.x, y: T.crack.y, R: 900, amp: 70, dur: 0.5 },
      { t0: GM.reach.contact, x: T.finger.x, y: T.finger.y, R: 1500, amp: 90, dur: 1.2 },
    ]);
    app.crack.update(t);
  },

  view(app, t) {
    if (app.crack.active(t)) { app.crack.render(t, app); return [app.crack.scene, app.crack.cam]; }
    return [app.scene, app.camera];
  },

  grade(t, p) {
    const fac = FILM._app && FILM._app.fac;
    p.time = t; p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.8; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.08; p.saturation = 1.0; p.contrast = 1.1; p.warmth = -0.02; p.blackLift = 0.012;
    p.vignette = 0.62; p.soft = 0.03; p.bloom = 0.24; p.bloomThreshold = 1.15; p.grain = 0.026;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    // the alarm: warmer, punchier
    const al = fac ? fac.alarm(t) : 0;
    p.saturation += 0.06 * al; p.contrast += 0.04 * al; p.warmth += 0.04 * al;
    // the system notices you: colder, greyer, heavier at the edges
    const sys = MathX.smooth(t, GM.sys.flicker, GM.sys.flicker + 0.3) * (1 - MathX.smooth(t, GM.drone.drop, GM.drone.drop + 0.5));
    p.saturation -= 0.22 * sys; p.warmth -= 0.06 * sys; p.vignette += 0.2 * sys; p.exposure -= 0.06 * sys;
    if (t >= GM.sys.flicker && t < GM.sys.flicker + 1.4) p.chroma += 0.012;
    // the first touch, the blast, the shot, the palm on your screen, the hit, the contact, the cancel
    p.flash += 0.07 * MathX.impulse(t, GM.touch.contact, 0.25) * (t >= GM.touch.contact ? 1 : 0);
    const shot = t >= GM.drone.fire + 0.14 ? MathX.impulse(t, GM.drone.fire + 0.14, 0.18) : 0;
    if (shot > 0.01) { p.flash = Math.max(p.flash, 0.55 * shot); p.flashColor.setRGB(1, 0.32, 0.25); }
    p.chroma += 0.05 * (t >= GM.reset.press ? MathX.impulse(t, GM.reset.press, 0.2) : 0);
    p.chroma += 0.16 * (t >= GM.reset.hit ? MathX.impulse(t, GM.reset.hit, 0.16) : 0);
    p.flash += 0.3 * (t >= GM.reset.hit ? MathX.impulse(t, GM.reset.hit, 0.06) : 0);
    p.flash += 0.22 * (t >= GM.reach.contact ? MathX.impulse(t, GM.reach.contact, 0.15) : 0);
    // RESET—: fringing, a vertical smear while the world runs back
    const rs = t >= GM.reach.glitch[0] && t < GM.reach.override ? 1 : 0;
    p.chroma += 0.06 * rs; p.edgeBlur = 0.35 * rs; p.smear.set(0, 0.01 * rs * (t > GM.reach.glitch[0] + 0.25 ? 1 : 0));
    p.flash += 0.12 * (t >= GM.reach.cancelled ? MathX.impulse(t, GM.reach.cancelled, 0.3) : 0);
    // the end: calm and a little warm
    const calm = t >= GM.end.cut ? 1 : 0;
    p.warmth += 0.05 * calm; p.saturation += 0.04 * calm; p.vignette += 0.05 * calm;
    if (t >= GM.end.black) p.fade = 1;
  },

  anchor() { return null; },
  debug(app, t) { return `t ${t.toFixed(2)} · world ${this.world(t).toFixed(2)}`; },
};
