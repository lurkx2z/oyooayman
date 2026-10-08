/* =====================================================================
   FILM — "What if the speed of sound became 10× slower?"
   One afternoon in a football stadium, six shots (hard cuts; the story clock never jumps). The world is built by
   stadium.js / crowd.js / cast.js / waves.js; every time comes from script.js.
     build(app)        create the world, crowd, cast, effects, hands, HUD and soundtrack (runs once)
     update(app, t)    pose everything for STORY time t (pure function of t)
     grade(t, p)       the sunny grade, the lightning, the thunder's hit (reset every param you use, every frame)
     debug(app, t)     text for the D debug panel
   ===================================================================== */

const SND_HAND_POSES = Object.assign({}, HAND_POSES);
const SND_HAND_BLEND = Object.assign({}, HAND_BLEND, { ear: 0.12 });
// where the sun's shadow map is aimed in each shot [centre x, centre z, half-size] (sharp where you look)
const SND_SHADOW = [[3, 0, 46], [-15, 43, 24], [-34, 12, 50], [43, 2, 26], [-10, -42, 46], [0, 0, 74]];

const FILM = {
  build(app) {
    const { scene, camera, renderer, rng } = app;
    FILM._app = app;
    camera.near = 0.05; camera.far = 4000; camera.updateProjectionMatrix();
    app.env = new SndStadium(scene, renderer, rng);
    app.env.camera = camera;
    app.env.build();
    app.crowd = new SndCrowd(scene);
    app.cast = new SndCast(app);
    app.ripples = new SndRipples(scene);
    app.shells = new SndShells(scene);
    app.puffs = new SndPuffs(scene);
    app.birds = new SndBirds(scene, app.env.city);
    // muted sleeve, skin-tone nails, long slim sleeves (docs/STYLE_BIBLE.md § 11)
    app.hands = new ViewerHands(camera, { scale: 1.04, sleeve: '#3a4652', nail: '#c99c84', sleeveLen: 1.1, sleeveFit: 0.78,
      poses: SND_HAND_POSES, blends: SND_HAND_BLEND });
    Look.apply(scene, camera);                         // selective gloss + world-space grime (after the world is built)
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.hud.readouts.forEach((r) => { if (r.R.tag) r.el.classList.add('snd-tag'); });   // (the small thunder tag: page CSS)
    app.audio = new SndAudio(app.tl, app);
  },

  update(app, t) {
    const fog = app.scene.fog, sh = SND_SHADOW[sndShotAt(t)];
    app.env.aimShadow(sh[0], sh[1], sh[2]);
    app.env.update(t);
    app.crowd.update(t);
    app.cast.update(t);
    app.ripples.update(t, fog);
    app.shells.update(t, fog);
    app.puffs.update(t, fog);
    app.birds.update(t, fog);
    app.hands.update(t);
  },

  grade(t, p) {
    const I = MathX.impulse, H = SND.heard;
    // sunny afternoon (docs/STYLE_BIBLE.md § 2b): set everything every frame
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0.7; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.08; p.saturation = 1.12; p.contrast = 1.08; p.warmth = 0.04; p.blackLift = 0.0;
    p.vignette = 0.5; p.soft = 0.015; p.bloom = 0.16; p.bloomThreshold = 1.3; p.grain = 0.022;
    // shot 2 looks up into the shade under the main stand's roof: open it up so it matches the sunny shots
    const sh = sndShotAt(t);
    if (sh === 1) { p.exposure = 1.42; p.blackLift = 0.02; p.contrast = 1.04; }
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.smear.set(0, 0);
    // a smear when your head turns fast (never across a cut)
    const app = FILM._app, dt = 1 / 30;
    if (app && app.cam && !sndCutBetween(t - dt, t)) {
      const C = app.cam, vf = C.tfov.value(t), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.0025, -0.01, 0.01), MathX.clamp(-pr / vf * 0.0025, -0.01, 0.01));
    }
    // the lightning: a cold flicker over everything (it is 2 km away: the sky carries most of it)
    const fl = Math.max(sndFlashLevel(t, SND.flash.t), sndFlashLevel(t, SND.flash2.t));
    if (fl > 0) { p.flash = 0.06 * fl; p.flashColor.setRGB(0.82, 0.86, 1.0); }
    // the kick's crack, then the thunder: a pressure hit you feel — a white jolt, then two muffled seconds
    // (your hands up; the world dulls with the sound, see audio.js)
    const tT = H.thunder, muf = MathX.smooth(t, tT + 0.05, tT + 0.3) * (1 - MathX.smooth(t, tT + 2.3, tT + 3.2));
    p.chroma = 0.003 * I(t, H.kick, 0.15) + 0.016 * I(t, tT, 0.45);
    p.edgeBlur = 0.55 * I(t, tT, 0.7) + 0.3 * muf;
    if (t >= tT && t < tT + 0.2) { p.flash = Math.max(p.flash, 0.42 * Math.exp(-(t - tT) / 0.05)); p.flashColor.setRGB(1, 1, 1); }
    p.vignette += 0.18 * I(t, tT, 1.5) + 0.25 * muf;
    p.saturation -= 0.3 * muf; p.contrast -= 0.06 * muf;
    p.fade = MathX.smooth(t, SND.black - 0.4, SND.black);
  },

  debug(app, t) {
    const H = SND.heard;
    return `shot ${sndShotAt(t) + 1} · c ${sndC(t).toFixed(1)} m/s · gun heard ${H.gun.toFixed(2)} · ball crack ${H.ball.toFixed(2)} · goal ${SND_BALL.tGoal.toFixed(2)} · kick heard ${H.kick.toFixed(2)} · thunder ${H.thunder.toFixed(2)}`;
  },
};
