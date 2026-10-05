/* =====================================================================
   MAIN — SceneManager: builds everything, runs the loop, owns the clock.
   ===================================================================== */

class SceneManager {
  constructor() {
    this.canvas = document.getElementById('gl');
    this.stage = document.getElementById('stage');
    this.tl = new Timeline(CONFIG.duration, SCRIPT.events);
    this.t = MathX.clamp(CONFIG.startTime, 0, CONFIG.duration);
    this.playing = false;
    this.recording = false;
    this.fps = 0;
    this._frames = 0; this._fpsT = performance.now();
  }

  init() {
    if (CONFIG.captureMode) document.body.classList.add('capture');
    const R = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: CONFIG.captureMode });
    R.shadowMap.enabled = CONFIG.render.shadows;
    R.shadowMap.type = THREE.PCFShadowMap;
    R.toneMapping = THREE.NoToneMapping;              // tone mapping happens in the post pass
    R.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = R;
    R.info.autoReset = false;           // count every pass of a frame (shadows + scene + post)
    Tex.maxAniso = Math.min(8, R.capabilities.getMaxAnisotropy());

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 9 / 16, 0.05, 3000);
    this.scene.add(this.camera);           // so the first-person hands (camera children) render
    this.rng = new RNG(CONFIG.seed);

    this.env = new Environment(this.scene, R, this.rng);
    this.env.build();
    this.peds = new PedestrianSystem(this.scene);
    this.traffic = new TrafficSystem(this.scene);
    this.hands = new ViewerHands(this.camera);
    this.fx = new ParticleSystem(this.scene, this.env, this.traffic, this.peds, this.hands);
    this.post = new PostProcessing(R);
    this.cam = new CameraController(this.camera, CONFIG.camera);
    this.hud = new HUD(document.getElementById('hud'), this.tl);
    this.audio = new AudioManager(this.tl, this.traffic);
    if (!CONFIG.captureMode) {
      this.dev = new DevControls(this);
      this.audio.prepare();
    }

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.renderAt(this.t);
    // warm up shaders so the first played frames don't hitch
    R.compile(this.scene, this.camera);
    document.getElementById('loading').classList.add('hidden');
    if (CONFIG.startInRecordingMode) this.setRecording(true);
    if (CONFIG.captureMode) { document.getElementById('startOverlay').classList.add('hidden'); document.getElementById('dev').style.display = 'none'; }
    this._last = performance.now();
    if (!CONFIG.captureMode) requestAnimationFrame(() => this.loop());
  }

  /* ---------------- sizing ---------------- */
  resize() {
    let sw, sh;
    if (CONFIG.captureMode) { sw = CONFIG.captureWidth; sh = CONFIG.captureHeight; }
    else {
      // leave room for the dev bar unless we're recording
      const W = window.innerWidth, H = window.innerHeight - (this.recording ? 0 : 118);
      sh = Math.min(H, W * 16 / 9); sw = sh * 9 / 16;
    }
    this.stage.style.width = sw + 'px';
    this.stage.style.height = sh + 'px';
    document.documentElement.style.setProperty('--u', (sh / 1920) + 'px');
    // internal resolution
    let rw, rh;
    const res = CONFIG.render.resolution;
    if (CONFIG.captureMode) { rw = sw; rh = sh; }
    else if (res === 'auto') { const dpr = Math.min(window.devicePixelRatio || 1, 2); rh = Math.min(1920, Math.round(sh * dpr)); rw = Math.round(rh * 9 / 16); }
    else { const f = parseFloat(res) || 1; rw = Math.round(1080 * f); rh = Math.round(1920 * f); }
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(rw, rh, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.post.setSize(rw, rh);
    this.camera.aspect = rw / rh;
    this.camera.updateProjectionMatrix();
  }

  /* ---------------- playback ---------------- */
  play() {
    if (this.t >= this.tl.duration - 1e-3) this.t = 0;
    this.playing = true;
    this.audio.ensureContext();
    const start = () => { if (this.playing) this.audio.play(this.t); };
    if (this.audio.buffer) start(); else this.audio.prepare().then(() => { if (this.playing && !this.audio.playing) start(); });
    this._last = performance.now();
  }
  pause() { this.playing = false; this.audio.stop(); }
  togglePlay() { this.playing ? this.pause() : this.play(); }
  restart() { this.seek(0); this.play(); }
  seek(t) {
    const was = this.playing;
    this.t = MathX.clamp(t, 0, this.tl.duration);
    if (was) { this.audio.play(this.t); }
    this.renderAt(this.t);
  }
  step(dt) { this.pause(); this.seek(Math.round((this.t + dt) * CONFIG.fps) / CONFIG.fps); }
  jumpEvent(dir) {
    const evs = this.tl.events;
    if (dir > 0) { const n = evs.find((e) => e.time > this.t + 0.01); if (n) this.seek(n.time); }
    else { const p = [...evs].reverse().find((e) => e.time < this.t - 0.05); this.seek(p ? p.time : 0); }
  }
  toggleMute() { this.audio.setMuted(!this.audio.muted); }
  setRecording(on) {
    this.recording = on;
    document.body.classList.toggle('recording', on);
    if (on) { this.pause(); this.seek(0); }
    this.resize();
  }

  /* ---------------- frame ---------------- */
  update(t) {
    const tl = this.tl;
    tl.t = t;
    this.cam.update(t);
    this.hands.update(t);
    this.env.update(t, tl);
    this.traffic.update(t, tl);
    this.peds.update(t);
    this.fx.update(t, tl, this.camera);
    this.post.updateFromTimeline(t, tl);
    this.hud.update(t, this.camera, (target, tt) => this.anchor(target, tt));
  }

  anchor(target, t) {
    const [kind, id] = target.split(':');
    if (kind === 'veh') return this.traffic.anchor(id, t);
    if (kind === 'fx') return this.env.anchors[id] || null;
    if (kind === 'hand') return this.hands.nozzleWorld(new THREE.Vector3());
    if (kind === 'person') { const p = this.peds.byId[id]; return p ? p.root.position.clone().setY(1.9) : null; }
    return null;
  }

  renderAt(t) {
    this.renderer.info.reset();
    this.update(t);
    this.post.render(this.scene, this.camera);
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const now = performance.now();
    const dt = Math.min(0.1, (now - this._last) / 1000);
    this._last = now;
    if (this.playing) {
      const at = this.audio.clockTime();
      this.t = at !== null ? at : this.t + dt;
      if (this.t >= this.tl.duration) { this.t = this.tl.duration; this.pause(); }
    }
    this.renderAt(this.t);
    this._frames++;
    if (now - this._fpsT > 500) { this.fps = (this._frames * 1000) / (now - this._fpsT); this._frames = 0; this._fpsT = now; }
    if (this.dev) {
      const info = this._debugInfo();
      this.dev.update(this.t, this.fps, info);
    }
  }

  _debugInfo() {
    if (!this.dev || !this.dev.el.debugPanel.classList.contains('show')) return '';
    const i = this.renderer.info;
    const c = this.camera.position;
    return `O₂ ${SCRIPT_TRACKS.oxygen.value(this.t).toFixed(2)}% · hypoxia ${SCRIPT_TRACKS.hypoxia.value(this.t).toFixed(2)}<br>
      draw calls ${i.render.calls} · tris ${(i.render.triangles / 1000).toFixed(0)}k<br>
      cam ${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)} · fov ${this.camera.fov.toFixed(1)}<br>
      render ${this.renderer.domElement.width}×${this.renderer.domElement.height} · audio ${this.audio.buffer ? 'ready' : 'rendering…'}`;
  }
}

/* ---------------- boot ---------------- */
const SIM = new SceneManager();
window.SIM = SIM;
// capture helpers for tools/render-preview.mjs
SIM.captureFrame = (t) => { SIM.renderAt(t); return true; };
SIM.audioWavBase64 = async () => {
  const buf = await SIM.audio.prepare();
  const blob = AudioManager.encodeWav(buf);
  const ab = await blob.arrayBuffer();
  let s = ''; const u8 = new Uint8Array(ab);
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const boot = () => {
  try { SIM.init(); window.SIM_READY = true; }
  catch (e) { console.error(e); const b = document.getElementById('errorBox'); b.style.display = 'block'; b.textContent += e.stack || e; }
};
// wait for web fonts briefly (signs are drawn with them), then build
if (document.fonts && document.fonts.load) {
  const fonts = ['700 40px "Oswald"', '800 40px "Inter"', '600 20px "Inter"', '700 20px "JetBrains Mono"'].map((f) => document.fonts.load(f).catch(() => null));
  Promise.race([Promise.all(fonts), new Promise((r) => setTimeout(r, 2500))]).then(boot);
} else boot();
