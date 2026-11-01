/* =====================================================================
   FILM — "What if you were 10× stronger, but your bones weren't?"
     build(app)    the two sets (kitchen, arena), the HUD, the soundtrack
     update(app,t) the shot's set + camera, the HUD
     view(app,t)   [the shot's scene, its camera]
     grade(t,p)    per set; a 2-frame dip at each cut; black after the catch
   (The 16:9 resize is the long-form films' own, film-side.)
   ===================================================================== */

// the shots: [id, set, end time] in order (each starts where the last ended)
const SB_SHOTS = (() => {
  const L = [
    ['jar', 'kitchen', sbS('mug') - 0.2],
    ['mug', 'kitchen', sbS('sis1') - 0.1],
    ['sister', 'kitchen', sbS('rule') - 0.3],
    ['arm', 'kitchen', sbS('record') - 0.35],
    ['lift', 'arena', sbS('nick') - 0.15],
    ['screen', 'arena', sbS('final') - 0.3],
    ['final', 'arena', sbS('cost') - 0.15],
    ['hands', 'arena', SB.choice + 2.4],
    ['look', 'arena', SB.run],
    ['run', 'arena', SB.black],
    ['black', 'arena', SB.after],
    ['after', 'kitchen', sbS('letter') - 0.3],
    ['letter', 'kitchen', SB.end + 1],
  ];
  let t0 = -1;
  return L.map(([id, set, t1]) => { const s = { id, set, t0, t1 }; t0 = t1; return s; });
})();
function sbShotAt(t) { for (const s of SB_SHOTS) if (t < s.t1) return s; return SB_SHOTS[SB_SHOTS.length - 1]; }
const SB_CUTS = SB_SHOTS.slice(1).map((s) => s.t0);

function sbResize() {
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
  for (const s of Object.values(this.sets || {})) for (const c of [s.camera, s.camA, s.camB, s.cam]) if (c) { c.aspect = rw / rh; c.updateProjectionMatrix(); }
}

const FILM = {
  build(app) {
    FILM._app = app;
    app.resize = sbResize.bind(app);
    app.renderer.shadowMap.type = THREE.PCFShadowMap;
    app.sets = {};
    for (const [name, f] of Object.entries(SB_SETS)) app.sets[name] = f(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.sbHud = new SbHud(document.getElementById('hud'));
    app.audio = new SbAudio(app.tl, app);
  },
  update(app, t) {
    const shot = sbShotAt(t);
    FILM._shot = shot;
    const set = app.sets[shot.set];
    set.frame(t, shot, app);
    FILM._set = set;
    app.sbHud.update(t, shot, set, app);
  },
  view(app, t) { const set = FILM._set || app.sets.kitchen; return [set.scene, set.camera]; },
  grade(t, p) {
    const shot = FILM._shot || SB_SHOTS[0];
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0; p.smear.set(0, 0);
    p.exposure = 1.0; p.saturation = 1.06; p.contrast = 1.06; p.warmth = 0.04; p.blackLift = 0.006;
    p.vignette = 0.5; p.soft = 0.05; p.bloom = 0.32; p.bloomThreshold = 0.95; p.grain = 0.024;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.keepWarm = 0; p.uneven = 0;
    p.flashColor.setRGB(1, 1, 1);
    const set = FILM._set;
    if (set && set.grade) set.grade(t, p, shot);
    if (shot.id === 'after' || shot.id === 'letter') { p.warmth = 0.0; p.saturation = 0.98; }
    for (const c of SB_CUTS) if (Math.abs(t - c) < 0.07 && c !== SB.black && c !== SB.after) p.fade = Math.max(p.fade, 0.3 * (1 - Math.abs(t - c) / 0.07));
    if (shot.id === 'black') p.fade = 1;
    if (shot.id === 'after') p.fade = Math.max(p.fade, 1 - sbSmooth(t, SB.after, SB.after + 0.7));
    if (t < 0.25) p.fade = Math.max(p.fade, 1 - t / 0.25);
  },
  debug(app, t) { const s = FILM._shot; return `shot ${s ? s.id : '-'} · t ${t.toFixed(2)}`; },
};
