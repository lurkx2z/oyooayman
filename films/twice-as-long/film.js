/* =====================================================================
   FILM — "What If Every Step You Took Was Twice as Long?"
     build(app)    every set (each its own THREE.Scene + camera), the HUD, the soundtrack
     update(app,t) the shot's set and camera (shots.js), the HUD (hud.js)
     view(app,t)   [the shot's scene, its camera]
     grade(t,p)    per set; the cuts (a 1-frame dip), the end on the question
   Sets register themselves in TW_SETS: name → (app) => { scene, camera, frame(t, shot, app), grade?(t, p, shot), labels?(t) }.
     nyc     Brooklyn Heights to Central Park: your street, the harbour, the bridge, Manhattan (street.js on nyc.js)
     sky     from the Bronx to orbit: New England from low down, Boston, the Earth, the Space Station, the Moon (sky.js)
     space   the light barrier and the planets: Mars, the Sun, Jupiter, Saturn, Pluto, Voyager 1 (space.js)
     deep    the stars, Proxima, the Milky Way, Andromeda, the galaxies, the cosmic web, the universe (deep.js)
   (The 16:9 resize is the long-form films' own.)
   ===================================================================== */

const TW_SETS = {};

// 16:9: the shared SceneManager sizes the stage 9:16, so this film installs its own resize(); --u is one design
// pixel of a 1920-wide frame
function twResize() {
  let sw, sh;
  if (CONFIG.captureMode) { sw = CONFIG.captureWidth; sh = CONFIG.captureHeight; }
  else { const W = window.innerWidth, H = window.innerHeight - (this.recording ? 0 : 118); sw = Math.min(W, H * 16 / 9); sh = sw * 9 / 16; }
  this.stage.style.width = sw + 'px'; this.stage.style.height = sh + 'px';
  document.documentElement.style.setProperty('--u', (sw / 1920) + 'px');
  let rw, rh;
  const res = CONFIG.render.resolution;
  if (CONFIG.captureMode) { rw = sw; rh = sh; }
  else if (res === 'auto') { const dpr = Math.min(window.devicePixelRatio || 1, 2); rw = Math.min(1920, Math.round(sw * dpr)); rh = Math.round(rw * 9 / 16); }
  else { const f = parseFloat(res) || 1; rw = Math.round(1920 * f); rh = Math.round(1080 * f); }
  this.renderer.setPixelRatio(1); this.renderer.setSize(rw, rh, false);
  this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
  this.post.setSize(rw, rh);
  this.camera.aspect = rw / rh; this.camera.updateProjectionMatrix();
  this.renderH = rh;
  for (const s of Object.values(this.sets || {})) { s.camera.aspect = rw / rh; s.camera.updateProjectionMatrix(); }
}

const FILM = {
  build(app) {
    FILM._app = app;
    app.resize = twResize.bind(app);
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.sets = {};
    for (const [name, f] of Object.entries(TW_SETS)) app.sets[name] = f(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.twHud = new TwHud(document.getElementById('hud'));
    app.audio = new TwAudio(app.tl, app);
  },

  update(app, t) {
    const shot = twShotAt(t);
    FILM._shot = shot;
    const set = app.sets[shot.set];
    set.frame(t, shot, app);
    FILM._set = set;
    app.twHud.update(t, shot, set, app);
  },

  view(app, t) {
    const set = FILM._set || app.sets.nyc;
    if (set.prerender) set.prerender(app);
    return set.view ? set.view() : [set.scene, set.camera];
  },

  grade(t, p) {
    const shot = FILM._shot || TW_SHOTS[0];
    if (!FILM._cuts) FILM._cuts = twCutTimes();
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0; p.smear.set(0, 0);
    p.exposure = 1.0; p.saturation = 1.12; p.contrast = 1.08; p.warmth = 0.0; p.blackLift = 0.004;
    p.vignette = 0.38; p.soft = 0.04; p.bloom = 0.3; p.bloomThreshold = 0.92; p.grain = 0.018;
    p.tunnel = 1.4; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.keepWarm = 0; p.uneven = 0;
    p.flashColor.setRGB(1, 1, 1);
    const set = FILM._set;
    if (set && set.grade) set.grade(t, p, shot);
    // every cut: a 1-frame dip (bright cuts stay bright: the new recipe cuts hard)
    for (const c of FILM._cuts) if (Math.abs(t - c) < 0.04) p.fade = Math.max(p.fade, 0.12 * (1 - Math.abs(t - c) / 0.04));
  },

  debug(app, t) { const s = FILM._shot, st = twStepAt(t); return `shot ${s ? s.id : '-'} · ${s ? s.set + '/' + s.mode : '-'} · step ${st.n} u ${st.u.toFixed(2)} · dist ${twDist(t).toFixed(1)} m · earth ${twSpan(twEarthS(t))}`; },
};
