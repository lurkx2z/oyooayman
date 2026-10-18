/* =====================================================================
   FILM — "What if light kept getting slower and couldn't stop?"
     build(app)    every set (each its own THREE.Scene + camera), the HUD, the soundtrack
     update(app,t) the shot's set and camera (shots.js), the HUD (hud.js)
     view(app,t)   [the shot's scene, its camera]
     grade(t,p)    per set; the cuts (a 2-frame dip), the fade at the stop, the final cut to black
   Sets register themselves in SL_SETS: name → (app) => { scene, camera, frame(t, shot, app), grade?(t, p, shot), labels? }.
   ===================================================================== */

const SL_SETS = {};

// 16:9: the shared SceneManager sizes the stage 9:16, so this film installs its own resize() (film-side, as in the
// other long-form films); --u is one design pixel of a 1920-wide frame
function slResize() {
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
  for (const s of Object.values(this.sets || {})) { s.camera.aspect = rw / rh; s.camera.updateProjectionMatrix(); }
}

const FILM = {
  build(app) {
    FILM._app = app;
    app.resize = slResize.bind(app);                 // (main.js calls it once the post chain exists)
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.sets = {};
    for (const [name, f] of Object.entries(SL_SETS)) app.sets[name] = f(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.slHud = new SlHud(document.getElementById('hud'));
    app.audio = new SlAudio(app.tl, app);
  },

  update(app, t) {
    const shot = slShotAt(t);
    FILM._shot = shot;
    const set = app.sets[shot.set];
    set.frame(t, shot, app);
    FILM._set = set;
    app.slHud.update(t, shot, set, app);
  },

  view(app, t) {
    const set = FILM._set || app.sets.home;
    if (set.prerender) set.prerender(app);
    return [set.scene, set.camera];
  },

  grade(t, p) {
    const shot = FILM._shot || SL_SHOTS[0];
    if (!FILM._cuts) FILM._cuts = slCutTimes(FILM._app);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0; p.smear.set(0, 0);
    p.exposure = 1.0; p.saturation = 1.06; p.contrast = 1.06; p.warmth = 0.0; p.blackLift = 0.004;
    p.vignette = 0.5; p.soft = 0.06; p.bloom = 0.3; p.bloomThreshold = 1.0; p.grain = 0.024;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.keepWarm = 0; p.uneven = 0;
    p.flashColor.setRGB(1, 1, 1);
    const set = FILM._set;
    if (set && set.grade) set.grade(t, p, shot);
    // every cut: a 2-frame dip
    for (const c of FILM._cuts) if (Math.abs(t - c) < 0.07) p.fade = Math.max(p.fade, 0.3 * (1 - Math.abs(t - c) / 0.07));
    // the end: the music cuts to silence, the picture to black
    p.fade = Math.max(p.fade, MathX.smooth(t, SL.end - 0.6, SL.end - 0.05));
  },

  debug(app, t) { const s = FILM._shot; return `shot ${s ? s.id : '-'} · set ${s ? s.set : '-'} · mode ${s ? s.mode : '-'} · c ${slC(t).toPrecision(4)} m/s`; },
};
