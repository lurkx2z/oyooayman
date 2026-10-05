/* =====================================================================
   CAMERA CONTROLLER — the viewer's head.
   Keyframed path (from SCRIPT.camera) + procedural layers:
   walking bob, breathing, head sway, startles, shakes, hypoxic wobble.
   All layers are pure functions of time → identical every playback.
   ===================================================================== */

class CameraController {
  constructor(camera, params) {
    this.camera = camera;
    this.p = params;
    const C = SCRIPT.camera;
    this.tx = new Track(C.x);
    this.tz = new Track(C.z);
    this.tyaw = new Track(C.yaw);
    this.tpitch = new Track(C.pitch);
    this.tfov = new Track(C.fov);
    this.startles = C.startles;
    this.shakes = C.shakes;
    this.tsag = new Track(C.sag || [[0, 0]]);
    this.troll = new Track(C.roll || [[0, 0]]);
    // distance walked as a function of time (drives step bob)
    this.dt = 1 / 120;
    const n = Math.ceil((CONFIG.duration + 2) / this.dt);
    this.dist = new Float32Array(n + 1);
    let d = 0, px = this.tx.value(0), pz = this.tz.value(0);
    for (let i = 0; i <= n; i++) {
      const t = i * this.dt, x = this.tx.value(t), z = this.tz.value(t);
      d += Math.hypot(x - px, z - pz); px = x; pz = z;
      this.dist[i] = d;
    }
    camera.rotation.order = 'YXZ';
  }

  walked(t) {
    const f = MathX.clamp(t / this.dt, 0, this.dist.length - 1.001), i = Math.floor(f);
    return this.dist[i] + (this.dist[i + 1] - this.dist[i]) * (f - i);
  }

  update(t) {
    const P = this.p, cam = this.camera, D = MathX.deg;
    const hyp = SCRIPT_TRACKS.hypoxia.value(t);
    let x = this.tx.value(t), z = this.tz.value(t);
    let y = LAYOUT.curbH + P.cameraHeight;
    let yaw = D(this.tyaw.value(t)), pitch = D(this.tpitch.value(t)), roll = 0;

    // --- walking bob (scaled by current speed)
    const speed = (this.walked(t + 0.05) - this.walked(t - 0.05)) / 0.1;
    const walkAmt = MathX.clamp(speed / P.walkSpeed, 0, 1.3);
    const ph = this.walked(t) * P.bobFrequency * Math.PI; // one step = half a cycle
    y += -Math.abs(Math.sin(ph)) * P.bobStrength * walkAmt + P.bobStrength * 0.5 * walkAmt;
    const sway = Math.sin(ph * 0.5) * walkAmt;
    x += sway * 0.018;
    roll += sway * D(0.6);
    pitch += Math.sin(ph * 2) * D(0.25) * walkAmt;

    // --- breathing (rate rises with hypoxia)
    const br = this._breathPhase(t);
    const deep = 1 + hyp * 2.2;
    y += Math.sin(br) * P.breathingStrength * deep;
    pitch += Math.sin(br) * D(0.18) * deep;

    // --- idle head sway (tiny, organic)
    yaw += noise1(t * 0.35, 11) * D(0.6) + noise1(t * 1.3, 12) * D(0.12);
    pitch += noise1(t * 0.3, 13) * D(0.45) + noise1(t * 1.1, 14) * D(0.1);

    // --- startles: quick dip + flinch up
    for (const [ts, s] of this.startles) {
      if (t < ts || t > ts + 1.2) continue;
      const a = t - ts;
      const k = Math.exp(-a / 0.22) * Math.sin(Math.min(a / 0.09, Math.PI)) * s;
      y -= 0.035 * k;
      pitch += D(1.6) * k;
      roll += D(0.6) * k * (hash1(Math.floor(ts * 100)) - 0.5) * 2;
    }

    // --- shakes (damped noise)
    let sh = 0;
    for (const [ts, amp, dec] of this.shakes) sh += amp * MathX.impulse(t, ts, dec);
    sh *= P.shakeStrength;
    if (sh > 0.0005) {
      yaw += noise1(t * 28, 21) * D(0.9) * sh;
      pitch += noise1(t * 31, 22) * D(0.9) * sh;
      roll += noise1(t * 24, 23) * D(0.7) * sh;
      y += noise1(t * 26, 24) * 0.012 * sh;
    }

    // --- hypoxia: slow drunken drift, late reactions, losing balance
    if (hyp > 0) {
      const h2 = hyp * hyp;
      yaw += noise1(t * 0.55, 31) * D(3.5) * hyp;
      pitch += noise1(t * 0.5, 32) * D(2.5) * hyp;
      roll += (noise1(t * 0.4, 33) * D(5) + Math.sin(t * 0.9) * D(1.5)) * h2 * 2;
      x += noise1(t * 0.45, 34) * 0.06 * hyp;
      z += noise1(t * 0.42, 35) * 0.05 * hyp;
      y -= 0.05 * h2;
    }

    // late hypoxia: knees start to go, head rolls
    y -= this.tsag.value(t);
    roll += D(this.troll.value(t)) * (0.6 + 0.4 * Math.sin(t * 0.8));

    cam.position.set(x, y, z);
    cam.rotation.set(pitch, yaw, roll, 'YXZ');
    const fov = this.tfov.value(t);
    if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld(true);
    this.hyp = hyp;
  }

  // integrated breathing phase so the rate can change smoothly
  _breathPhase(t) {
    if (!this._brTable) {
      const n = Math.ceil((CONFIG.duration + 2) / this.dt);
      this._brTable = new Float32Array(n + 1);
      let ph = 0;
      for (let i = 0; i <= n; i++) { this._brTable[i] = ph; ph += (SCRIPT_TRACKS.breathRate.value(i * this.dt) / 60) * Math.PI * 2 * this.dt; }
    }
    const f = MathX.clamp(t / this.dt, 0, this._brTable.length - 1.001), i = Math.floor(f);
    return this._brTable[i] + (this._brTable[i + 1] - this._brTable[i]) * (f - i);
  }
}
