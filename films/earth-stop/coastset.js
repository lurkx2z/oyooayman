/* =====================================================================
   COAST SET — the harbour, the station, the town, the line and the hill (world.js, station.js, train.js, fx.js) and
   every camera in it. Two kinds of camera: standing on the ground (it stopped: everything loose slides past), and
   travelling with everything loose (ESP.X(s) is added to its position: then it is the ground that goes by).
   Your seat is in the train's second car, on the north side, facing forward (east).
   ===================================================================== */

ES_SETS.coast = (app) => {
  // the light of 5:42 PM: a low orange sun (it barely touches level ground: 6.5° up), a warm sky. When the sea stands
  // up in front of the sun (fx.js), what is left is the sky overhead: cooler and dimmer
  const S = esSet(app, { sky: '#f0c898', fov: 50, near: 0.1, far: 14000, sun: [0, 0, 0], sunColor: '#ffb469', sunI: 3.6, shadow: 4096, shadowR: 60, shadowFar: 1700,
    hemi: ['#f1d2ae', '#7a573f', 0.78], env: ['#4f7fc0', '#f0c898', '#6a5a48'] });
  const scene = S.scene, cam = S.camera;
  scene.fog = new THREE.FogExp2('#e6c19a', 0.0003);
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.5;
  S.sun.shadow.bias = -0.0006; S.sun.shadow.normalBias = 0.06;
  const W = esBuildWorld(S), St = esBuildStation(S), Tr = esBuildTrain(S), Fx = esBuildFx(S, { W, St, Tr });
  const sunV = new THREE.Vector3(...ES_SUN);
  const skyWarm = new THREE.Color('#f1d2ae'), skyCool = new THREE.Color('#b4b9c6'), gndWarm = new THREE.Color('#7a573f'), gndCool = new THREE.Color('#5c5148');
  const fogWarm = new THREE.Color('#e6c19a'), fogCool = new THREE.Color('#b9ad9e');

  const set = {
    scene, camera: cam, W, St, Tr, Fx,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = esStoryAt(t), kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1), u = t - shot.t0;
      this._s = s; this._shot = shot; this._t = t;
      W.update(s); St.update(s, t); Tr.update(s);
      const v = { p: [0, 5, 10], at: [0, 4, -20], fov: 50, drift: 0.01, near: 0.1, far: 14000, roll: 0, shake: 0, shadowR: 60, fog: 0.0003 };
      esCoastCam(this, m, s, t, kk, u, shot, v);
      const dr = v.drift ? esDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 61) * Math.sin(t * 11.3); dr[1] += j * 0.7 * Math.sin(t * 53 + 1); dr[2] += j * Math.sin(t * 47 + 2) * Math.sin(t * 7.1); }
      if (cam.near !== v.near || cam.far !== v.far) { cam.near = v.near; cam.far = v.far; }
      esCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov, v.roll);
      this._v = v;
      // the sun's shadow box follows what the camera looks at (never farther than 1.2 box widths from the camera); the
      // sun stands far enough back for the box to hold the sea's wall, which is what shades the land
      const R = v.shadowR, lim = R * 1.2, sb = v.sat || v.at, tg = new THREE.Vector3(MathX.clamp(sb[0], cam.position.x - lim, cam.position.x + lim), 0, MathX.clamp(sb[2], cam.position.z - lim, cam.position.z + lim));
      const D = MathX.clamp((tg.x - ES_F.quay.x + 160) / -ES_SUN[0] + 120, 800, 1700);
      const sc = S.sun.shadow.camera; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.far = D + 700; sc.updateProjectionMatrix();
      S.sun.target.position.copy(tg); S.sun.position.copy(tg).addScaledVector(sunV, D); S.sun.target.updateMatrixWorld();
      // how deep in the sea's shadow the subject is: the sky that is left is cooler; the haze loses the sun
      const sh = 1 - Fx.lit(sb[0], Math.max(1.5, sb[1] || 0), s); this._shade = sh;
      S.hemi.color.copy(skyWarm).lerp(skyCool, sh); S.hemi.groundColor.copy(gndWarm).lerp(gndCool, sh); S.hemi.intensity = 0.78 - 0.1 * sh;
      scene.fog.color.copy(fogWarm).lerp(fogCool, sh * 0.8); scene.fog.density = v.fog;
      // the fire's light: strongest on what is near it
      const fp = Fx.firePos(s), fd = Math.hypot(sb[0] - fp[0], sb[2] - fp[2]), hot = Fx.fire(s);
      Fx.light.position.set(fp[0] - 8, fp[1], fp[2]); Fx.light.intensity = (v.fire ?? 1) * 2.4 * hot / (1 + (fd / 230) * (fd / 230));
      this._fireL = Fx.light.intensity;
      Fx.update(s, t, m, cam);
    },
    labels(t) { return esCoastLabels(this, t); },
    grade(t, p) {
      const s = this._s, P = ESP, m = this._shot ? this._shot.mode : '', sh = this._shade || 0;
      p.exposure = 0.98 + 0.24 * sh; p.saturation = 1.12 - 0.04 * sh; p.contrast = 1.1; p.warmth = 0.04 - 0.05 * sh; p.vignette = 0.46 + 0.06 * sh; p.bloom = 0.3; p.bloomThreshold = 0.96; p.grain = 0.024; p.blackLift = 0.004;
      // 5:42:00.000: a jolt of light; the first wagon; the ferry; 5:42:01.000
      const fl = (s0, a, d) => { if (s > s0 && s < s0 + d * 6) p.flash = Math.max(p.flash, a * Math.exp(-(s - s0) / d)); };
      fl(0, 0.55, 0.0016);
      if (m === 'impact' || m === 'wagons') fl(P.wagon0, 0.7, 0.004);
      if (m === 'ferry') fl(P.ferryHit, 0.4, 0.003);
      fl(P.T, 0.5, 0.0012);
      p.flashColor.setRGB(1, 0.93, 0.8);
      // in the fire's light
      const f = Math.min(1, (this._fireL || 0) / 2);
      p.warmth += 0.05 * f; p.bloom += 0.1 * f;
      if (m === 'sun') { const k = MathX.smooth(t, this._shot.t0 + 1.5, this._shot.t1 - 0.5); p.exposure = 0.42 + 0.5 * k; p.bloom = 0.5 - 0.2 * k; p.bloomThreshold = 0.9; p.saturation = 1.2; }
      if (m === 'question') { const k = MathX.smooth(t, this._shot.t0, ES.end); p.warmth += 0.06 * k; p.bloom += 0.12 * k; }
      if (m === 'inside' || m === 'question') { p.vignette = 0.5; }
      if (m === 'wheels') p.exposure += 0.22;
    },
  };
  return set;
};

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS (v: p, at, fov, drift, shake, near, far, shadowR, sat = where the shadow box sits if not at `at`)
// ---------------------------------------------------------------------------------------------------------------------
function esCoastCam(set, m, s, t, kk, u, shot, v) {
  const P = ESP, F = ES_F, X = P.X(s), N = P.nose(s), Tr = set.Tr, St = set.St, d = Math.min(shot.t1, ES.end) - shot.t0, K = (a = 0, b = d) => esK(u, a, b);
  const eye = (lx = 4.9, ly = 1.22, lz = -0.78) => Tr.seat(lx, ly, lz);
  const PH = F.plat.h, L = esLerp;
  switch (m) {
    // ---- 5:41:57: platform 1, looking west along it into the low sun; at 5:42:00 all of it comes at you
    case 'title': {
      const b = t - ES.tOn;
      v.p = [-3.0, PH + 1.62, -2.35]; v.at = [-60, 2.7, -3.5]; v.fov = 54; v.near = 0.1; v.drift = 0.012; v.shadowR = 50; v.sat = [-22, 0, -3];
      if (b > 0) { v.shake = 0.05 * Math.exp(-b / 0.4); v.at = [-60, L(2.7, 3.4, esK(b, 0.3, 2.6)), -3.5]; }
      break;
    }
    case 'lurch': { const k = K(); v.p = [L(58, 74, k), L(21, 25, k), 96]; v.at = [-44, 5, -6]; v.fov = 40; v.near = 1; v.shadowR = 150; v.drift = 0.02; break; }
    case 'globe': { const k = K(); v.p = [L(330, 300, k), L(300, 284, k), L(430, 400, k)]; v.at = [-90, 0, -20]; v.fov = 40; v.near = 5; v.shadowR = 480; v.drift = 0.05; v.fog = 0.0001; break; }
    case 'glide': { v.p = [-3.0 + X, PH + 1.62, -2.35]; v.at = [-60 + X, 3.0, -3.5]; v.fov = 54; v.near = 0.1; v.drift = 0.012; v.shadowR = 50; v.sat = [-22 + X, 0, -3]; break; }
    case 'sun': {
      // from 9 m up over the tracks the train has left, straight at the sun: at the shot's start the sea's wall is just
      // under its lower limb; by its end the sun is gone
      const s0 = esStoryAt(shot.t0), y = 9, d = (0.75 * P.wallH(s0) - y) / Math.tan(MathX.deg(5.1)), p = [F.quay.x + d * -ES_SUN[0] / Math.hypot(ES_SUN[0], ES_SUN[2]), y, 2.2];
      v.p = p; v.at = [p[0] + ES_SUN[0] * 400, p[1] + ES_SUN[1] * 400 + L(2, 10, K()), p[2] + ES_SUN[2] * 400]; v.fov = L(22, 19, K()); v.near = 1; v.drift = 0.004; v.shadowR = 120; v.sat = [p[0] - 40, 0, 4]; break;
    }
    // ---- the bolts
    case 'bolt': { const k = K(); v.p = [L(-43.75, -43.9, k), PH + L(0.36, 0.3, k), -3.55]; v.at = [-45.25, PH + 0.06, -4.72]; v.fov = 40; v.near = 0.03; v.drift = 0.003; v.shadowR = 14; break; }
    case 'feet': { const k = K(); v.p = [-62 + X, PH + L(0.38, 0.5, k), -3.45]; v.at = [-110 + X, PH + 1.0, -4.95]; v.fov = 36; v.near = 0.08; v.drift = 0.006; v.shadowR = 40; v.sat = [-75 + X, 0, -4.5]; break; }
    case 'floor': { const k = K(); v.p = [L(-176, -168, k), L(33, 30, k), 36]; v.at = [-90, 2, -13]; v.fov = 40; v.near = 1; v.shadowR = 110; v.drift = 0.02; break; }
    // ---- the town
    case 'town': { const k = K(); v.p = [L(-36, -40, k), 1.7, -58.2]; v.at = [-140, 5, -58.6]; v.fov = 50; v.near = 0.2; v.drift = 0.012; v.shadowR = 70; v.sat = [-70, 0, -58]; break; }
    case 'townAir': { const k = K(); v.p = [L(-212, -200, k), L(118, 110, k), -236]; v.at = [-10, 0, -50]; v.fov = 42; v.near = 2; v.shadowR = 300; v.drift = 0.03; v.sat = [-60, 0, -70]; break; }
    // ---- the people on the platform; its end; the pigeons
    case 'people': { const k = K(), x = St.leadX + X; v.p = [x + L(9.5, 8.2, k), PH + 1.52, -2.25]; v.at = [x - 5, PH + 1.28, -4.6]; v.fov = 30; v.near = 0.1; v.drift = 0.006; v.shadowR = 30; break; }
    case 'platEnd': { v.p = [8.6, 0.38, -3.0]; v.at = [-10, 2.8, -4.4]; v.fov = 60; v.near = 0.08; v.drift = 0.006; v.shadowR = 40; break; }
    case 'pigeons': { const k = K(); v.p = [-58 + X + L(0, -1.5, k), L(6.3, 6.0, k), L(3.8, 3.0, k)]; v.at = [-70 + X, 5.3, -1.4]; v.fov = 32; v.near = 0.1; v.drift = 0.008; v.shadowR = 40; break; }
    // ---- your train
    case 'wheels': { const bx = N - 37.5 + 8.4, k = K(); v.p = [bx + L(3.9, 3.3, k), 0.44, 2.75]; v.at = [bx - 0.8, 0.52, 0.55]; v.fov = 40; v.near = 0.05; v.drift = 0.003; v.shake = 0.0015; v.shadowR = 20; break; }
    case 'inside': {
      // your coffee, your table, the window; then you look out
      const k = esK(u, 5.4, 8.0), a = eye(6.4, 0.78, -1.2), b = eye(11, 1.5, -9);
      v.p = eye(4.9, 1.3, -0.78); v.at = esV(a, b, k); v.fov = 62; v.near = 0.03; v.drift = 0.0025; v.shake = 0.0012; v.shadowR = 40;
      break;
    }
    case 'pass': { const s0 = esStoryAt(shot.t0), x0 = P.nose(s0) + 15.5; v.p = [x0, 0.85, -3.3]; v.at = [Math.min(N - 6, x0 - 3), 2.1, -0.4]; v.fov = 52; v.near = 0.1; v.drift = 0.006; v.shake = 0.004 * esK(N, x0 - 12, x0 - 1); v.shadowR = 50; break; }
    case 'energy': { const k = K(); v.p = [N + L(36, 27, k), L(8.5, 7, k), L(20, 17.5, k)]; v.at = [N - 40, 2.6, -2]; v.fov = 40; v.near = 0.5; v.drift = 0.012; v.shadowR = 110; break; }
    case 'ahead': { const k = K(); v.p = [N - L(52, 46, k), L(10.5, 11.5, k), 1.6]; v.at = [606, 12, 0]; v.fov = L(30, 25, k); v.near = 0.5; v.drift = 0.006; v.shadowR = 110; v.sat = [N - 20, 0, 0]; break; }
    // ---- the hill
    case 'hill': { const k = K(); v.p = [L(466, 474, k), L(6.5, 7.5, k), 17]; v.at = [602, 13, -3]; v.fov = 34; v.near = 0.5; v.drift = 0.008; v.shadowR = 110; v.sat = [570, 0, 0]; break; }
    case 'palms': { const k = K(); v.p = [L(576, 578, k), 5, 46]; v.at = [604, 9, -16]; v.fov = 50; v.near = 0.3; v.drift = 0.01; v.shadowR = 80; v.shake = 0.01 * Math.exp(-Math.max(0, s - 0.387) / 0.006) * (s > 0.387 ? 1 : 0); break; }
    case 'wagons': { const fr = F.wagons.front + X; v.p = [596.2, 2.4, 3.2]; v.at = [Math.min(fr, 598) - 7, 2.7, -8.6]; v.fov = 46; v.near = 0.15; v.drift = 0.006; v.shadowR = 50; break; }
    case 'impact': { const h = s - P.wagon0; v.p = [569, 3.2, 25]; v.at = [600, L(5, 9, esK(u, 1.5, 5.5)), -9]; v.fov = L(46, 52, esK(u, 1.2, 5.5)); v.near = 0.3; v.drift = 0.01; v.shadowR = 80; if (h > 0) v.shake = 0.09 * Math.exp(-h / 0.012) + 0.012; break; }
    case 'wind': { const k = K(); v.p = [L(452, 460, k), 34, 112]; v.at = [612, 36, -18]; v.fov = 42; v.near = 2; v.drift = 0.03; v.shadowR = 200; v.shake = 0.012; break; }
    case 'heat': { const k = K(); v.p = [L(573, 575, k), 16, 72]; v.at = [604, 23, 12]; v.fov = 40; v.near = 0.5; v.drift = 0.012; v.shadowR = 100; v.shake = 0.008; break; }
    case 'over': { const k = K(); v.p = [L(320, 340, k), L(150, 160, k), 340]; v.at = [650, 70, -30]; v.fov = 40; v.near = 3; v.drift = 0.04; v.shadowR = 420; v.fog = 0.0002; break; }
    // ---- the sea
    case 'sea': { const k = K(); v.p = [-66, PH + 1.6, -4.4]; v.at = [-250, L(40, 110, k), -2]; v.fov = 58; v.near = 0.2; v.drift = 0.01; v.shadowR = 80; v.shake = 0.006; break; }
    case 'quay': { const k = K(); v.p = [L(-272, -266, k), L(8, 11, k), 150]; v.at = [-253, L(30, 60, k), -60]; v.fov = 52; v.near = 0.5; v.drift = 0.02; v.shadowR = 150; v.shake = 0.008; break; }
    case 'ferry': { const h = s - P.ferryHit; v.p = [-287, 4.2, -70]; v.at = [-255, 9, -36]; v.fov = 50; v.near = 0.5; v.drift = 0.012; v.shadowR = 120; v.shake = h > 0 ? 0.1 * Math.exp(-h / 0.01) + 0.01 : 0.008; break; }
    case 'up': { const k = K(); v.p = [-224, 1.6, 30]; v.at = [-246, L(120, 190, k), -30]; v.fov = 62; v.near = 0.3; v.drift = 0.012; v.shadowR = 80; v.shake = 0.01; break; }
    case 'shores': { const k = K(); v.p = [L(1150, 1100, k), L(540, 520, k), 1500]; v.at = [-250, 120, -400]; v.fov = 36; v.near = 6; v.drift = 0.06; v.shadowR = 600; v.fog = 0.00012; break; }
    // ---- one second is not long enough to fall
    case 'roof': { const k = K(); v.p = [-17 + X + L(0, -3, k), L(1.5, 1.8, k), -4.5]; v.at = [-90 + X, L(4.6, 4.0, k), -4.7]; v.fov = 50; v.near = 0.2; v.drift = 0.01; v.shadowR = 90; v.sat = [-60 + X, 0, -5]; break; }
    case 'woman': { const y = P.womanY(s), x = F.bridge.x + X, k = K(); v.p = [x - L(5.6, 4.6, k), y + 1.45, 6.0]; v.at = [x, y + 1.0, 2.4]; v.fov = 36; v.near = 0.1; v.drift = 0.006; v.shadowR = 30; break; }
    // ---- the last 0.14 s; 5:42:01
    case 'count': { const k = K(); v.p = [N - 44, L(10.5, 12, k), 1.6]; v.at = [600, 20, 0]; v.fov = L(32, 27, k); v.near = 0.5; v.drift = 0.008; v.shake = 0.004; v.shadowR = 120; v.sat = [N - 10, 0, 0]; break; }
    case 'cab': { const z = s < P.T ? 1 : 0; v.p = [N + 13, 2.7, 0]; v.at = [600, 9, 0]; v.fov = 58; v.near = 0.2; v.drift = 0.003; v.shake = 0.006 * z + 0.05 * (s >= P.T ? Math.exp(-(s - P.T) / 0.002) : 0); v.shadowR = 80; v.sat = [N + 50, 0, 0]; break; }
    case 'still': { const k = K(); v.p = [N + L(40, 36, k), L(16, 18, k), 64]; v.at = [N - 56, 5, -14]; v.fov = 42; v.near = 1; v.drift = 0.02; v.shadowR = 170; break; }
    case 'short': { const k = K(), mid = (N + 600) / 2; v.p = [mid - L(70, 60, k), L(64, 58, k), 150]; v.at = [mid + 16, 6, -4]; v.fov = 44; v.near = 2; v.drift = 0.03; v.shadowR = 200; v.sat = [mid, 0, 0]; break; }
    case 'roofDown': { const k = K(); v.p = [N - L(5, 7.5, k), L(1.45, 1.6, k), -4.5]; v.at = [N - 70, 2.4, -4.7]; v.fov = 50; v.near = 0.2; v.drift = 0.012; v.shadowR = 90; v.sat = [N - 45, 0, -5]; break; }
    // ---- everything the ground stopped, thrown west
    case 'twist': { const k = K(); v.p = [N - 34, L(19, 22, k), 28]; v.at = [L(598, 580, k), 26, -6]; v.fov = L(36, 32, k); v.near = 0.5; v.drift = 0.012; v.shake = 0.006; v.shadowR = 130; v.sat = [N, 0, 0]; break; }
    case 'twistSea': { const k = K(); v.p = [L(-64, -58, k), 70, 170]; v.at = [-268, 130, -10]; v.fov = 54; v.near = 1; v.drift = 0.03; v.shadowR = 220; break; }
    case 'second': { const k = K(); v.p = [N + L(30, 27, k), 1.25, 4.6]; v.at = [600, L(20, 16, k), -5]; v.fov = 46; v.near = 0.2; v.drift = 0.006; v.shake = 0.012 + 0.03 * k; v.shadowR = 90; break; }
    case 'reach': { const k = K(); v.p = [N - L(13, 11, k), L(2.0, 2.3, k), 6.2]; v.at = [N + 34, L(13, 16, k), -1]; v.fov = 56; v.near = 0.2; v.drift = 0.004; v.shake = 0.02 + 0.06 * k; v.shadowR = 80; break; }
    case 'question': {
      // your seat: the coffee, then your window: what is coming along the line
      const k = K(), e = eye(4.9, 1.36, -0.78), a = eye(6.4, 0.8, -1.2), b = eye(12.5, 1.75, -5.6);
      v.p = [e[0] + 0.25 * k, e[1], e[2] - 0.12 * k]; v.at = esV(a, b, esK(u, 0.2, 2.2)); v.fov = L(60, 68, k); v.near = 0.03; v.drift = 0.002; v.shake = 0.004 + 0.035 * k * k; v.shadowR = 40; v.fire = 1 + 2.2 * k * k; break;
    }
    default: { v.p = [60, 30, 100]; v.at = [-40, 4, 0]; v.near = 1; }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// LABELS pinned in the scene: { p, text, sub, a, side }
// ---------------------------------------------------------------------------------------------------------------------
function esCoastLabels(set, t) {
  const sh = set._shot; if (!sh) return [];
  const P = ESP, F = ES_F, s = set._s, m = sh.mode, X = P.X(s), N = P.nose(s), a = esWin(t, sh.t0 + 0.6, sh.t1 - 0.1, 0.4, 0.3), n = (x) => Math.round(x).toLocaleString('en-US');
  const out = [], L = (p, text, sub, side, k = 1) => out.push({ p, text, sub, a: a * k, side });
  switch (m) {
    case 'lurch': L([-118, 3, -13], 'WHERE THE STATION STOOD', `${X.toFixed(0)} m AGO`, 'r'); break;
    case 'globe': L([-250, 4, 80], 'THE HARBOUR', 'WEST', 'r'); L([-100 + X, 22, -13], 'THE STATION'); L([604, 60, -60], 'THE HILL', 'EAST'); break;
    case 'floor': L([-124, 2.4, -14], 'ITS FLOOR', 'STILL BOLTED DOWN', 'r'); break;
    case 'townAir': L([-214, 3, -76], 'THE FLOORS THEY LEFT', `${X.toFixed(0)} m BEHIND THEM`, 'r'); break;
    case 'platEnd': L([0, F.plat.h + 0.1, -5.2], 'THE PLATFORM’S END', null, 'r', esWin(t, sh.t0 + 0.4, sh.t0 + 3.2, 0.3, 0.4)); break;
    case 'pass': L([N + 2, 4.6, 0], 'YOUR TRAIN', `${n(P.kmh - P.trainA * Math.min(s, 1) * 3.6)} km/h OVER THE GROUND`, null); break;
    case 'energy': L([N - 36, 6.5, 0], 'YOUR TRAIN', `${(P.tntT(P.trainT)).toFixed(1)} TONNES OF TNT`, null); break;
    case 'ahead': L([604, 34, 0], 'THE HILL', `${n(P.gap(s))} m AHEAD`, null); break;
    case 'hill': L([600, 9.6, 0], 'THE TUNNEL', 'THE HILL IS GROUND: IT STOPPED', 'r'); break;
    case 'wagons': { const fr = F.wagons.front + X, g = esHillX(F.wagons.z) - fr; if (g > 0) L([fr, 5.4, F.wagons.z], `${g.toFixed(1)} m`, 'TO THE ROCK', 'r'); break; }
    case 'sea': case 'quay': case 'up': L([F.quay.x - 2, Math.min(P.wallH(s) * 0.45, m === 'up' ? 60 : 90), m === 'quay' ? -40 : 0], `${n(P.wallH(s))} m HIGH`, m === 'up' ? 'THE EIFFEL TOWER: 330 m' : 'AND CLIMBING', m === 'quay' ? 'r' : null); break;
    case 'roof': L([-60 + X, P.roofY(s) + 0.4, -4.5], 'THE STATION’S ROOF', `${P.roofY(s).toFixed(1)} m UP · ${X.toFixed(0)} m FROM ITS PLATFORM`, null); break;
    case 'woman': L([F.bridge.x + X + 0.5, P.womanY(s) + 1.75, 2.4], `${P.womanY(s).toFixed(1)} m UP`, `FALLING AT ${(P.g * Math.max(0, s - P.womanFree) * 3.6).toFixed(0)} km/h`, 'l'); break;
    case 'count': L([604, 40, 0], 'THE HILL', `${n(P.gap(s))} m`, null); break;
    case 'short': L([(N + 600) / 2, 13, 0], `${n(P.gap(s))} m`, 'YOUR TRAIN TO THE ROCK', null); break;
    case 'roofDown': L([N - 62, P.roofY(s) + 0.5, -4.5], 'THE STATION’S ROOF', `${P.roofY(s).toFixed(1)} m UP`, 'r'); break;
    case 'twist': case 'second': L([P.blastX(s) - 2, 30, -9], 'THROWN WEST', `${n(P.kmh)} km/h`, 'r'); break;
    case 'reach': L([P.blastX(s) - 2, 22, 0], `${Math.max(0, P.blastX(s) - N).toFixed(0)} m`, 'FROM YOUR TRAIN', 'r'); break;
    default: break;
  }
  return out;
}
