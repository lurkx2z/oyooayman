/* =====================================================================
   FILM — "What if the universe got cut in half?"
     build(app)    every set (each its own THREE.Scene + camera), the HUD, the soundtrack
     update(app,t) the shot's set and camera (shots.js), the HUD (hud.js)
     view(app,t)   [the shot's scene, its camera]
     grade(t,p)    per set; the cuts (a 2-frame dip), the final cut to black
   Sets register themselves in FZ_SETS: name → (app) => { scene, camera, frame(t, shot, app), grade?(t, p, shot), labels? }.
   (The page structure and the 16:9 resize are the slow-light film's.)
   ===================================================================== */

const FZ_SETS = {};

// 16:9: the shared SceneManager sizes the stage 9:16, so this film installs its own resize() (film-side, as in the
// other long-form films); --u is one design pixel of a 1920-wide frame
function fzResize() {
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
    app.resize = fzResize.bind(app);                 // (main.js calls it once the post chain exists)
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.sets = {};
    for (const [name, f] of Object.entries(FZ_SETS)) app.sets[name] = f(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.fzHud = new FzHud(document.getElementById('hud'));
    app.audio = new FzAudio(app.tl, app);
  },

  update(app, t) {
    const shot = fzShotAt(t);
    FILM._shot = shot;
    const set = app.sets[shot.set];
    set.frame(t, shot, app);
    FILM._set = set;
    app.fzHud.update(t, shot, set, app);
  },

  view(app, t) {
    const set = FILM._set || app.sets.garden;
    if (set.prerender) set.prerender(app);
    return set.view ? set.view() : [set.scene, set.camera];
  },

  grade(t, p) {
    const shot = FILM._shot || FZ_SHOTS[0];
    if (!FILM._cuts) FILM._cuts = fzCutTimes(FILM._app);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0; p.smear.set(0, 0);
    p.exposure = 1.0; p.saturation = 1.04; p.contrast = 1.06; p.warmth = 0.0; p.blackLift = 0.006;
    p.vignette = 0.52; p.soft = 0.06; p.bloom = 0.34; p.bloomThreshold = 0.95; p.grain = 0.026;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.keepWarm = 0; p.uneven = 0;
    p.flashColor.setRGB(1, 1, 1);
    const set = FILM._set;
    if (set && set.grade) set.grade(t, p, shot);
    // every cut: a 2-frame dip
    for (const c of FILM._cuts) if (Math.abs(t - c) < 0.07) p.fade = Math.max(p.fade, 0.3 * (1 - Math.abs(t - c) / 0.07));
    // the end: no fade-out and no black (nothing signals the end): the film stops on the question, mid-shot
  },

  debug(app, t) { const s = FILM._shot, st = FILM._set && FILM._set._s != null ? FILM._set._s : fzStoryAt(t); return `shot ${s ? s.id : '-'} · set ${s ? s.set : '-'} · mode ${s ? s.mode : '-'} · story ${fzClockText(st, true)} ${fzAmPm(st)} · s ${st.toFixed(2)}`; },
};
