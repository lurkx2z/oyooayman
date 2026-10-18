/* =====================================================================
   FILM — "What if you kept shrinking and couldn't stop?"
   Six worlds, each its own THREE.Scene in its own units, so every scale renders with full precision:
     room   metres       the bedroom, the cat, the toy brick, the phone (down to its subpixels)
     dust   micrometres  the floor: skin flakes, a dust mite, the spilled water, a hair, pollen, bacteria
     nano   nanometres   electron-microscope grey: a bacteriophage, air molecules, DNA
     atom   picometres   a carbon atom: the electron haze, the emptiness, the nucleus
     proton femtometres  a proton: three quarks in a storm of gluons; the quark that never grows
     void   (abstract)   beyond any experiment: the foam, the Planck length, the black hole
   Worlds register in SH_WORLDS: name → (app) => { scene, camera, frame(t, h, app), grade?(t, p) }.
   A world change is a true crossfade: the outgoing world renders into a texture shown over the incoming one.
   ===================================================================== */

const SH_WORLDS = {};
// the world changes, in order: [centre, length, from, to]. The 'to' world is the one on screen from the start of its
// crossfade (the outgoing one is laid over it, fading out)
const SH_XF = [
  [SH.floor - 2.0, 2.6, 'room', 'dust'],      // (the dust world takes over the last of the fall)
  [SH.sem, 1.6, 'dust', 'nano'],
  [SH.atomWorld, 2.4, 'nano', 'atom'],
  [SH.proton - 0.6, 1.6, 'atom', 'proton'],
  [SH.unknown + 3.0, 3.0, 'proton', 'void'],
];
function shWorldAt(t) { let w = 'room'; for (const [c, d, , to] of SH_XF) if (t >= c - d / 2) w = to; return w; }

// 16:9: the shared SceneManager sizes the stage 9:16, so this film installs its own resize(); --u = one design pixel of
// a 1920-wide frame
function shResize() {
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
  for (const w of Object.values(this.worlds || {})) { w.camera.aspect = rw / rh; w.camera.updateProjectionMatrix(); }
  if (this.xfRT) this.xfRT.setSize(rw, rh);
}

// a soft gradient environment map for a world's reflections
function shEnv(renderer, top, mid, low) {
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(mid) }, c: { value: new THREE.Color(low) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 a,b,c; varying vec3 vD; void main(){ float h = vD.y; vec3 col = h > 0.0 ? mix(b, a, smoothstep(0.0, 0.7, h)) : mix(b, c, smoothstep(0.0, -0.5, h)); gl_FragColor = vec4(col, 1.0); }',
  })));
  const tex = pm.fromScene(es, 0.04).texture; pm.dispose();
  return tex;
}

// a camera-facing plane that shows the crossfade texture (one per world, hidden unless that world is fading in)
function shOverlay(world) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
  m.renderOrder = 10000; m.frustumCulled = false; m.visible = false;
  world.camera.add(m);
  if (!world.camera.parent) world.scene.add(world.camera);
  world.overlay = m;
}
function shFitOverlay(world) {
  const c = world.camera, d = c.near * 2, hh = 2 * d * Math.tan(THREE.MathUtils.degToRad(c.fov) / 2);
  world.overlay.position.set(0, 0, -d);
  world.overlay.scale.set(hh * c.aspect, hh, 1);
}

// smoothstep helpers used by every world
const shS = (t, a, b) => MathX.smooth(t, a, b);
const shWin = (t, a, b, fi, fo) => StoryHUD.win(t, a, b, fi, fo);
const shLerp = (a, b, k) => a + (b - a) * k;

const FILM = {
  build(app) {
    FILM._app = app;
    app.resize = shResize.bind(app);                 // (main.js calls it once the post chain exists)
    app.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    app.worlds = {};
    for (const [name, f] of Object.entries(SH_WORLDS)) { const w = f(app); w.name = name; shOverlay(w); app.worlds[name] = w; }
    app.xfRT = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: 4 });
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.shHud = new ShHud(document.getElementById('hud'));
    app.audio = new ShAudio(app.tl, app);
  },

  update(app, t) {
    const h = shH(t), name = shWorldAt(t), W = app.worlds[name] || app.worlds.room;
    FILM._world = W;
    W.frame(t, h, app);
    // a crossfade into this world: render the outgoing world into a texture, lay it over this one
    const X = SH_XF.find(([c, d]) => Math.abs(t - c) < d / 2);
    for (const w of Object.values(app.worlds)) w.overlay.visible = false;
    if (X && X[3] === name && app.worlds[X[2]]) {
      const F = app.worlds[X[2]], k = 1 - shS(t, X[0] - X[1] / 2, X[0] + X[1] / 2);
      F.frame(t, h, app);
      const r = app.renderer, sz = r.getDrawingBufferSize(new THREE.Vector2());
      if (app.xfRT.width !== sz.x || app.xfRT.height !== sz.y) app.xfRT.setSize(sz.x, sz.y);
      r.setRenderTarget(app.xfRT); r.clear(); r.render(F.scene, F.camera); r.setRenderTarget(null);
      W.overlay.material.map = app.xfRT.texture; W.overlay.material.opacity = k; W.overlay.material.needsUpdate = W.overlay.material._hadMap !== true;
      W.overlay.material._hadMap = true;
      W.overlay.visible = true; shFitOverlay(W);
      FILM._xf = { F, k };
    } else FILM._xf = null;
    app.shHud.update(t);
  },

  view(app, t) {
    const W = FILM._world || app.worlds.room;
    return [W.scene, W.camera];
  },

  grade(t, p) {
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0; p.smear.set(0, 0);
    p.exposure = 1.0; p.saturation = 1.06; p.contrast = 1.05; p.warmth = 0.0; p.blackLift = 0.008;
    p.vignette = 0.55; p.soft = 0.08; p.bloom = 0.3; p.bloomThreshold = 1.0; p.grain = 0.024;
    p.tunnel = 1.3; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.keepWarm = 0; p.uneven = 0.02;
    p.flashColor.setRGB(1, 1, 1);
    const W = FILM._world;
    if (W && W.grade) W.grade(t, p);
    // a crossfade blends the two worlds' grades too
    if (FILM._xf && FILM._xf.F.grade) {
      const q = Object.assign({}, p, { smear: p.smear.clone(), flashColor: p.flashColor.clone() });
      FILM._xf.F.grade(t, q);
      for (const k of ['exposure', 'saturation', 'contrast', 'warmth', 'blackLift', 'vignette', 'soft', 'bloom', 'bloomThreshold', 'grain', 'chroma', 'edgeBlur', 'tunnelDark', 'flash', 'fade'])
        p[k] = shLerp(p[k], q[k], FILM._xf.k);
    }
    // the end: black, then the buzz in the dark
    p.fade = Math.max(p.fade, MathX.smooth(t, SH.end - 0.8, SH.end - 0.05));
  },

  debug(app, t) { return `world ${FILM._world ? FILM._world.name : '-'} · h ${shFmt(shH(t))} · rate ${shRate(t).toFixed(3)} dec/s`; },
};
