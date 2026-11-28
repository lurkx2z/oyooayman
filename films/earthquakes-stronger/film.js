/* =====================================================================
   FILM — "What If Earthquakes Got 1 Magnitude Stronger Every Minute?"
     build(app)    every set (each its own THREE.Scene + camera), the HUD, the soundtrack
     update(app,t) the shot's set and camera (shots.js), the HUD (hud.js)
     view(app,t)   [the shot's scene, its camera]
     grade(t,p)    per set; the cuts (a 1-frame dip), the end on the question
   Sets register themselves in EQ_SETS: name → (app) => { scene, camera, frame(t, shot, app), grade?(t, p, shot), labels?(t) }.
     sf      San Francisco: the waterfront by the Ferry Building (the café, the pier, the street), the whole city, the
             bay and its bridges, from the street and from the helicopter (sf-geo.js, sf-marks.js, waterfront.js,
             heli.js, sf-set.js)
     world   the other cities' earthquakes: the Hollywood sign, Mexico City, the Hoover Dam, the Space Needle, the
             Tokyo Skytree, the Burj Khalifa, Istanbul's bridge (world.js)
     globe   the planet from space: every earthquake's crack, the coast from Mexico to Canada (globe.js)
   A shot can pin story time (shot.s: the story second at its first frame) so the cold open, a flash-forward,
   shows the film's last moments. (The 16:9 resize is the long-form films' own.)
   ===================================================================== */

const EQ_SETS = {};

// 16:9: the shared SceneManager sizes the stage 9:16, so this film installs its own resize(); --u is one design
// pixel of a 1920-wide frame
function eqResize() {
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

// story time in a shot: film time minus the first tick, or the shot's own pinned story time (the cold open)
function eqStoryOf(t, shot) { return shot && shot.s !== undefined ? shot.s + (t - shot.t0) : eqS(t); }

const FILM = {
  build(app) {
    FILM._app = app;
    app.resize = eqResize.bind(app);
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.sets = {};
    for (const [name, f] of Object.entries(EQ_SETS)) app.sets[name] = f(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.eqHud = new EqHud(document.getElementById('hud'));
    app.audio = new EqAudio(app.tl, app);
  },

  update(app, t) {
    const shot = eqShotAt(t);
    FILM._shot = shot;
    const set = app.sets[shot.set];
    set.frame(t, shot, app);
    FILM._set = set;
    app.eqHud.update(t, shot, set, app);
  },

  view(app, t) {
    const set = FILM._set || app.sets.sf;
    if (set.prerender) set.prerender(app);
    return set.view ? set.view() : [set.scene, set.camera];
  },

  grade(t, p) {
    const shot = FILM._shot || EQ_SHOTS[0];
    if (!FILM._cuts) FILM._cuts = eqCutTimes();
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0; p.smear.set(0, 0);
    p.exposure = 1.0; p.saturation = 1.16; p.contrast = 1.08; p.warmth = 0.0; p.blackLift = 0.004;
    p.vignette = 0.38; p.soft = 0.04; p.bloom = 0.3; p.bloomThreshold = 0.92; p.grain = 0.018;
    p.tunnel = 1.4; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.keepWarm = 0; p.uneven = 0;
    p.flashColor.setRGB(1, 1, 1);
    const set = FILM._set;
    if (set && set.grade) set.grade(t, p, shot);
    // every cut: a 1-frame dip (bright cuts stay bright: the new recipe cuts hard)
    for (const c of FILM._cuts) if (Math.abs(t - c) < 0.04) p.fade = Math.max(p.fade, 0.12 * (1 - Math.abs(t - c) / 0.04));
  },

  debug(app, t) { const s = FILM._shot, S = eqStoryOf(t, s); return `shot ${s ? s.id : '-'} · ${s ? s.set + '/' + s.mode : '-'} · story ${S.toFixed(2)} s · minute ${eqMinOf(S)} · M${eqMagOf(S)} · level ${eqLevel(S).toFixed(3)}`; },
};
