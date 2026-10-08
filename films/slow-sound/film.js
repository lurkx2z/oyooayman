/* =====================================================================
   FILM — "What if the speed of sound became 10× slower?"
   One place, no cuts: you stand at the corner of a parking lot on a sunny avenue. The world is built by
   city.js / cast.js / waves.js, the airliner by js/world/aircraft.js; every sound time comes from script.js.
     build(app)        create the world, cast, effects, hands, HUD and soundtrack (runs once)
     update(app, t)    pose everything for STORY time t (pure function of t)
     grade(t, p)       the sunny grade + the shocks (reset every param you use, every frame)
     debug(app, t)     text for the D debug panel
   ===================================================================== */

// 'shield': both hands flung up as the police car's shock hits (only the fingers rise into the bottom corners, so the glass stays in view)
const SND_HAND_POSES = Object.assign({}, HAND_POSES, {
  shield: { p: [0.15, -0.27, -0.4], F: [-0.4, 1, 0.25], N: [0.25, 0.1, -1], curl: [0.2, 0.22, 0.28, 0.34], thumb: [0.7, 0.12] },
});
const SND_HAND_BLEND = Object.assign({}, HAND_BLEND, { ear: 0.12, shield: 0.07 });
for (const k of Object.keys(SND_HAND_POSES)) { SND_HAND_POSES[k + '!'] = SND_HAND_POSES[k]; SND_HAND_BLEND[k + '!'] = 0.02; }

const FILM = {
  build(app) {
    const { scene, camera, renderer, rng } = app;
    FILM._app = app;
    camera.near = 0.05; camera.far = 3000; camera.updateProjectionMatrix();
    app.env = new SndCity(scene, renderer, rng);
    app.env.camera = camera;                           // (haze cards need it before build)
    app.env.build();
    app.cast = new SndCast(app);
    app.aircraft = new AircraftSystem(scene);
    app.planeFx = new SndPlaneFx(scene, app.aircraft);
    app.ripples = new SndRipples(scene);
    app.dust = new SndDust(scene);
    app.glass = new SndGlass(scene, app.env, app.dust);
    // muted sleeve, skin-tone nails, long slim sleeves (docs/STYLE_BIBLE.md § 11)
    app.hands = new ViewerHands(camera, { scale: 1.04, sleeve: '#3a4652', nail: '#c99c84', sleeveLen: 1.1, sleeveFit: 0.78,
      poses: SND_HAND_POSES, blends: SND_HAND_BLEND });
    Look.apply(scene, camera);                         // selective gloss + world-space grime (after the world is built)
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new SndAudio(app.tl, app);
  },

  update(app, t) {
    const fog = app.scene.fog;
    app.env.update(t);
    app.cast.update(t);
    app.aircraft.update(t);
    app.planeFx.update(t, fog);
    app.ripples.update(t, fog);
    app.glass.update(t);
    app.dust.update(t, fog);
    app.hands.update(t);
  },

  grade(t, p) {
    const B = SND.boom, I = MathX.impulse;
    // sunny afternoon (docs/STYLE_BIBLE.md § 2b): set everything every frame
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0.7; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.1; p.saturation = 1.14; p.contrast = 1.08; p.warmth = 0.04; p.blackLift = 0.0;
    p.vignette = 0.5; p.soft = 0.04; p.bloom = 0.16; p.bloomThreshold = 1.3; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.smear.set(0, 0);
    // a whip-pan smear when your head turns fast (following the cars)
    const app = FILM._app;
    if (app && app.cam) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.0025, -0.01, 0.01), MathX.clamp(-pr / vf * 0.0025, -0.01, 0.01));
    }
    // the shocks: a pressure hit you feel (a 2–3 frame lift, a jolt of chroma and edge blur), strongest last
    p.flash = 0.1 * I(t, B.sport, 0.07) + 0.16 * I(t, B.plane, 0.09) + 0.22 * I(t, B.police, 0.08);
    p.chroma = 0.004 * I(t, B.sport, 0.2) + 0.008 * I(t, B.plane, 0.35) + 0.01 * I(t, B.police, 0.3);
    p.edgeBlur = 0.25 * I(t, B.plane, 0.5) + 0.35 * I(t, B.police, 0.45);
    p.vignette += 0.12 * I(t, B.police, 1.2);
    p.fade = MathX.smooth(t, SND.black - 0.4, SND.black);
  },

  debug(app, t) {
    const c = sndC(t), B = SND.boom;
    return `c ${c.toFixed(1)} m/s · booms: car ${B.sport.toFixed(2)} · airliner ${B.plane.toFixed(2)} · police ${B.police.toFixed(2)}`;
  },
};
