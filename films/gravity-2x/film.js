/* =====================================================================
   FILM — the episode's half of the engine (see js/main.js):
     build(app)        create the world, cast, hands, HUD and soundtrack (runs once)
     update(app, t)    pose everything for STORY time t (pure function of t)
     grade(t, p)       the colour grade and story effects for time t (reset every param you use, every frame)
     view(app, t)      optional: [scene, camera] to show (for other worlds: an Earth scene, a cut-away…)
     debug(app, t)     optional: text for the D debug panel
   ===================================================================== */

// first-person hands: the shared poses (hidden · ear · reach · look · brace) + film poses you add here, each with a
// '!' snap twin (a 0.02 s blend) for use on hard cuts. Camera-space pose = { p, F, N, curl[4], thumb[2], trem? }.
// To aim a hand at a world point every frame (grip a pole, press glass), copy frAimHand from films/friction/film.js.
const GV_HAND_POSES = Object.assign({}, HAND_POSES, {});
const GV_HAND_BLEND = Object.assign({}, HAND_BLEND, {});
for (const k of Object.keys(GV_HAND_POSES)) { GV_HAND_POSES[k + '!'] = GV_HAND_POSES[k]; GV_HAND_BLEND[k + '!'] = 0.02; }

const FILM = {
  build(app) {
    FILM._app = app;
    app.env = new GvCity(app.scene, app.renderer, app.rng);
    app.env.camera = app.camera;                       // (haze cards need it before build)
    app.env.build();
    app.cast = new GvCast(app);
    // muted sleeve, skin-tone nails (pale nails read as fake), long slim sleeves (docs/STYLE_BIBLE.md § 11)
    app.hands = new ViewerHands(app.camera, { scale: 1.04, sleeve: '#2f3a46', nail: '#c99c84', sleeveLen: 1.1, sleeveFit: 0.78,
      poses: GV_HAND_POSES, blends: GV_HAND_BLEND });
    Look.apply(app.scene, app.camera);                 // selective gloss + world-space grime (after the world is built)
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new GvAudio(app.tl, app);
  },

  update(app, t) {
    app.env.update(t);
    app.cast.update(t);
    app.hands.update(t);
  },

  grade(t, p) {
    const T = GV, changed = 1 - gvRule(t);
    // overcast channel look (docs/STYLE_BIBLE.md § 8): set everything every frame
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0.7;
    p.exposure = 1.08; p.saturation = 1.05; p.contrast = 1.06; p.warmth = 0.02; p.blackLift = 0.01;
    p.vignette = 0.55; p.soft = 0.05; p.bloom = 0.22; p.bloomThreshold = 1.4; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0;
    p.flashColor.setRGB(1, 1, 1);
    // the world cools a little once the rule has changed (colour as storytelling)
    p.warmth -= 0.08 * changed; p.saturation -= 0.08 * changed;
    // the payoff: a 2–3 frame white hit and a jolt of chroma; then black at the very end
    p.flash = 0.6 * MathX.impulse(t, T.payoff, 0.06);
    p.chroma = 0.005 * MathX.impulse(t, T.payoff, 0.25);
    p.fade = MathX.smooth(t, T.end - 0.6, T.end);
  },

  debug(app, t) { return `rule ${gvRule(t).toFixed(2)} · people ${app.cast.people.length}`; },
};
