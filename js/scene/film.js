/* =====================================================================
   FILM — "What if oxygen suddenly disappeared?"
   The film-specific half of the engine: which systems the world is made of,
   how they update, which scene is on screen, and the colour grade.
   The shared SceneManager (js/main.js) calls these hooks.
   ===================================================================== */

const FILM = {
  build(app) {
    const { scene, camera, renderer, rng } = app;
    app.env = new Environment(scene, renderer, rng);
    app.env.camera = camera;
    app.env.build();
    app.peds = new PedestrianSystem(scene);
    app.traffic = new TrafficSystem(scene);
    app.hands = new ViewerHands(camera);
    app.fx = new ParticleSystem(scene, app.env, app.traffic, app.peds, app.hands);
    Look.apply(scene, camera);     // matte, slightly dirty older-game materials
    app.aircraft = new AircraftSystem(scene);
    app.earth = new EarthScene();
    app.hud = new HUD(document.getElementById('hud'), app.tl);
    app.audio = new AudioManager(app.tl, app.traffic);
  },

  update(app, t, tl) {
    app.hands.update(t);
    app.env.update(t, tl);
    app.traffic.update(t, tl);
    app.peds.update(t);
    app.aircraft.update(t);
    if (t >= SCRIPT.earth.from) app.earth.update(t);
    app.fx.update(t, tl, app.camera);
  },

  // which scene + camera is on screen
  view(app, t) { return t >= SCRIPT.earth.from ? [app.earth.scene, app.earth.camera] : [app.scene, app.camera]; },

  // per-frame film look
  grade(t, p, tl) {
    const hyp = SCRIPT_TRACKS.hypoxia.value(t);
    // muted, cold overcast look. While the fire burns it is the only warm thing in frame;
    // once the flames die the whole image drifts a little colder and greyer.
    const cold = MathX.smooth(t, tl.at('flames_out'), tl.at('o2_zero') + 1.0);
    p.tunnel = MathX.lerp(1.15, 0.36, hyp);
    p.tunnelSoft = MathX.lerp(0.55, 0.42, hyp);
    p.tunnelDark = 0.97 * MathX.smooth(hyp, 0.2, 0.9);          // mild while you hold your breath, total at the blackout
    p.edgeBlur = Math.min(1, hyp * 1.5);
    p.saturation = MathX.lerp(MathX.lerp(1.22, 1.04, cold), 0.62, hyp);
    p.warmth = MathX.lerp(MathX.lerp(0.05, -0.35, cold), -0.5, Math.min(1, hyp * 1.5));
    // the big pressure step: a brief exposure dip instead of any flashy effect
    const tPop = 2.05;
    const pop = MathX.impulse(t, tPop + 0.02, 0.16);
    p.chroma = 0;
    // story fades: black (lost moment, blackout, end) and the white-out through the haze into space
    p.fade = SCRIPT_TRACKS.fade.value(t);
    p.flash = 0.92 * SCRIPT_TRACKS.whiteout.value(t);
    p.exposure = CONFIG.render.exposure * 1.22 * (1 - 0.1 * pop) * (1 - 0.14 * hyp);   // midtones ≈ the references (docs/art-direction.md)
    p.contrast = 1.06 + 0.05 * hyp;
    p.soft = 0.1 + 0.05 * hyp;
    // space: a cleaner, slightly richer grade
    if (t >= SCRIPT.earth.from) { p.saturation = 1.25; p.warmth = 0; p.contrast = 1.1; p.exposure = CONFIG.render.exposure * 1.15; p.soft = 0.06; }
  },

  // world positions for optional HUD labels
  anchor(app, target, t) {
    const [kind, id] = target.split(':');
    if (kind === 'veh') return app.traffic.anchor(id, t);
    if (kind === 'fx') return app.env.anchors[id] || null;
    if (kind === 'hand') return app.hands.nozzleWorld(new THREE.Vector3());
    if (kind === 'person') { const p = app.peds.byId[id]; return p ? p.root.position.clone().setY(1.9) : null; }
    return null;
  },

  debug(app, t) { return `O₂ ${SCRIPT_TRACKS.oxygen.value(t).toFixed(2)}% · hypoxia ${SCRIPT_TRACKS.hypoxia.value(t).toFixed(2)}`; },
};
