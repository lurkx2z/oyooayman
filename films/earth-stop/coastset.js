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
      if (m === 'impact' || m === 'wagons') fl(P.wagon0, 1.0, 0.0035);
      if (m === 'impact2') fl(P.wagonHit(1), 0.6, 0.003);
      if (m === 'heat') fl(P.wagonHit(2), 0.6, 0.003);
      if (m === 'wind') fl(P.wagonHit(3), 0.45, 0.003);
      if (m === 'over') fl(P.wagonHit(4), 0.25, 0.003);
      if (m === 'first') fl(P.house0, 0.3, 0.0015);
      if (m === 'shed') fl(P.shed, 0.4, 0.002);
      if (m === 'ferry') fl(P.ferryHit, 0.5, 0.003);
      fl(P.T, 0.5, 0.0012);
      p.flashColor.setRGB(1, 0.93, 0.8);
      // in the fire's light
      const f = Math.min(1, (this._fireL || 0) / 2);
      p.warmth += 0.05 * f; p.bloom += 0.1 * f;
      if (m === 'sun') { const k = MathX.smooth(t, this._shot.t0 + 1.5, this._shot.t1 - 0.5); p.exposure = 0.5 + 0.14 * k; p.bloom = 0.42; p.bloomThreshold = 0.9; p.saturation = 1.2; p.vignette = 0.56; }
      // it arrives: the picture burns out to white at ES.tHit, and then there is nothing: black, and the question
      if (m === 'question') {
        const k = MathX.smooth(t, this._shot.t0, ES.tHit), w = MathX.smooth(t, ES.tHit - 0.55, ES.tHit - 0.02), aft = t - ES.tHit;
        p.warmth += 0.06 * k; p.bloom += 0.12 * k + 0.5 * w; p.flash = Math.max(p.flash, 0.94 * w * w); p.flashColor.setRGB(1, 0.9, 0.72);
        if (aft >= 0) { p.flash = 1; p.fade = MathX.smooth(aft, 0.1, 0.42); p.bloom = 0.3; p.grain = 0.024 * (1 - p.fade); }
      }
      if (m === 'inside' || m === 'question') { p.vignette = 0.5; }
      if (m === 'wheels') p.exposure += 0.3;
      if (m === 'pass') p.exposure += 0.4;                     // (the train's shaded side)
    },
  };
  return set;
};

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS (v: p, at, fov, drift, shake, near, far, shadowR, sat = where the shadow box sits if not at `at`)
// ---------------------------------------------------------------------------------------------------------------------
// the Sun's shot: the share of the wall's height that is solid where the camera's line to the Sun meets it; the camera's z
const ES_SUNSHOT = { top: 0.86, z: 2.2, turn: -2.1 };
// where the Eiffel Tower's outline stands, for scale, beside the sea's wall: [x, z]
const ES_EIFFEL = [ES_F.quay.x + 6, 70];
// how hard the rock is being hit right now, as felt at (x, z): every arrival within the last 12 ms of story
function esHitShake(s, x, z) {
  let k = 0;
  for (const h of ES_HITS) { const u = s - h.s; if (u < 0) break; if (u < 0.012) k += (h.kind === 'palm' ? 1 : 4) * Math.exp(-u / 0.004) / (1 + Math.hypot(h.x - x, h.z - z) / 30); }
  return Math.min(1.5, k);
}
function esCoastCam(set, m, s, t, kk, u, shot, v) {
  const P = ESP, F = ES_F, X = P.X(s), N = P.nose(s), Tr = set.Tr, St = set.St, d = Math.min(shot.t1, ES.end) - shot.t0, K = (a = 0, b = d) => esK(u, a, b);
  const eye = (lx = 4.9, ly = 1.22, lz = -0.78) => Tr.seat(lx, ly, lz);
  const PH = F.plat.h, L = esLerp, hitAt = (s0, a, tau = 0.01) => (s > s0 ? a * Math.exp(-(s - s0) / tau) : 0);
  switch (m) {
    // ---- 5:41:57: platform 1, looking west along it into the low sun; at 5:42:00 all of it comes at you
    case 'title': {
      const b = t - ES.tOn;
      v.p = [-3.0, PH + 1.62, -2.35]; v.at = [-60, 2.7, -3.5]; v.fov = 54; v.near = 0.1; v.drift = 0.012; v.shadowR = 50; v.sat = [-22, 0, -3];
      // …and the camera turns with it, the way your head would: by 0:05 it looks east, after the train, down the line
      if (b > 0) {
        const k2 = esK(b, 0.3, 5.3), kp = esK(b, 0.7, 5.2), yaw = L(Math.PI + 0.02, 2 * Math.PI - 0.13, kp);
        v.shake = 0.05 * Math.exp(-b / 0.4); v.p = [L(-3.0, -2.3, k2), PH + L(1.62, 1.52, k2), -2.35];
        v.at = [v.p[0] + 50 * Math.cos(yaw), L(2.7, 2.0, kp), v.p[2] + 50 * Math.sin(yaw)]; v.sat = [L(-22, 14, kp), 0, -3];
      }
      break;
    }
    // ---- the hill east of town: it stopped too. From the plain; then along its rock face, where the palms arrive
    case 'first': { const k = K(), k2 = esK(u, 0, 1.7); v.p = [L(546, 557, k), L(4.6, 2.8, k), L(-20, -27, k)]; v.at = [L(592, 599, k2), L(6.5, 5, k), L(-45, -46, k)]; v.fov = L(30, 24, k); v.near = 0.5; v.drift = 0.01; v.shadowR = 110; v.sat = [588, 0, -40]; v.shake = hitAt(P.house0, 0.12, 0.006) + 0.012 * esHitShake(s, 590, -44); break; }
    case 'firstB': { const k = K(); v.p = [L(588.2, 587.4, k), L(4.6, 3.8, k), L(-11, -17, k)]; v.at = [L(598.5, 598, k), 7.4, -150]; v.fov = L(32, 27, k); v.near = 0.3; v.drift = 0.006; v.shadowR = 110; v.sat = [592, 0, -50]; v.shake = 0.02 * esHitShake(s, 590, -40); break; }
    // travelling with the station, from above: the roofs, the train and the people look as they always did; only the
    // ground is going by underneath
    case 'glide': { const k = K(); v.p = [L(-28, -48, k) + X, L(24, 14, k), L(36, 24, k)]; v.at = [-72 + X, 2.5, -4.5]; v.fov = 42; v.near = 0.5; v.drift = 0.012; v.shadowR = 90; v.sat = [-60 + X, 0, -4]; break; }
    case 'sun': {
      // a long lens from 9 m up over the tracks the train has left, straight at the Sun: the sea's wall climbs across
      // it (the camera stands where the wall's top crosses the Sun's middle halfway through the shot)
      const sc = esStoryAt(shot.t0 + 0.47 * d), y = 9, hz = Math.hypot(ES_SUN[0], ES_SUN[2]), el = Math.atan2(ES_SUN[1], hz), k = K();
      const dh = (ES_SUNSHOT.top * P.wallH(sc) - y) / Math.tan(el), p = [F.quay.x + 0.26 * P.wallH(sc) + dh * -ES_SUN[0] / hz, y, ES_SUNSHOT.z];
      // (the Sun sits right of the middle, clear of the cards on the left)
      const ce = el - MathX.deg(L(0.9, 0.3, k)), az = Math.atan2(ES_SUN[2], ES_SUN[0]) + MathX.deg(ES_SUNSHOT.turn);
      v.p = p; v.at = [p[0] + Math.cos(az) * 400, y + 400 * Math.tan(ce), p[2] + Math.sin(az) * 400]; v.fov = L(10, 8, k); v.near = 1; v.drift = 0.002; v.shadowR = 120; v.sat = [p[0], y, p[2]]; break;
    }
    // ---- the bolts
    case 'bolt': { const k = K(); v.p = [L(-42.7, -44.3, k), PH + L(0.85, 0.25, k), L(-2.9, -3.7, k)]; v.at = [-45.25, PH + 0.06, -4.72]; v.fov = 40; v.near = 0.03; v.drift = 0.003; v.shadowR = 14; break; }
    case 'floor': { const k = K(); v.p = [L(-186, -160, k), L(38, 26, k), L(44, 30, k)]; v.at = [L(-96, -84, k), 2, -13]; v.fov = 40; v.near = 1; v.shadowR = 110; v.drift = 0.02; break; }
    // ---- the town
    case 'town': { const k = K(); v.p = [L(-30, -50, k), L(1.5, 2.6, k), -58.2]; v.at = [-140, 5, -58.6]; v.fov = 50; v.near = 0.2; v.drift = 0.012; v.shadowR = 70; v.sat = [-70, 0, -58]; break; }
    // the car park behind the station: three parked cars, coming
    case 'cars': { const x0 = P.X(esStoryAt(shot.t0)) - 84 + 13, k = K(); v.p = [x0 + L(3, -3.5, k), L(0.55, 1.1, k), L(-23.3, -22.6, k)]; v.at = [x0 - 30, 1.5, -26.2]; v.fov = 46; v.near = 0.1; v.drift = 0.006; v.shadowR = 50; v.sat = [x0 - 14, 0, -25]; break; }
    // ---- the people on the platform; its end; past it; the pigeons
    case 'people': { const k = K(), x = St.leadX + X; v.p = [x + L(9.5, 8.0, k), PH + 1.52, -2.25]; v.at = [x - 5, PH + 1.28, -4.6]; v.fov = 30; v.near = 0.1; v.drift = 0.006; v.shadowR = 30; break; }
    case 'platEnd': { const k = K(), lx = Math.min(St.leadX + X, 3); v.p = [L(15, 13.5, k), L(3.3, 2.8, k), L(-3.0, -3.8, k)]; v.at = [lx - 2.5, PH + 0.8, -4.4]; v.fov = L(23, 33, k); v.near = 0.1; v.drift = 0.006; v.shadowR = 40; v.sat = [-4, 0, -4]; break; }
    case 'fly': { const k = K(), x = St.leadX + X; v.p = [x - L(3.2, 2.2, k), L(0.55, 0.75, k), L(1.4, 0.7, k)]; v.at = [x - 1.2, 2.05, -3.9]; v.fov = 50; v.near = 0.08; v.drift = 0.005; v.shadowR = 30; break; }
    // ---- your train
    case 'wheels': { const bx = N - 37.5 + 8.4, k = K(); v.p = [bx + L(3.9, 3.3, k), 0.44, 2.75]; v.at = [bx - 0.8, 0.52, 0.55]; v.fov = 40; v.near = 0.05; v.drift = 0.003; v.shake = 0.0015; v.shadowR = 20; break; }
    case 'inside': {
      // your coffee, your table, the window; then you look out
      const k = esK(u, 2.4, 4.8), a = eye(6.4, 0.78, -1.2), b = eye(11, 1.5, -9);
      v.p = eye(4.9, 1.3, -0.78); v.at = esV(a, b, k); v.fov = 62; v.near = 0.03; v.drift = 0.0025; v.shake = 0.0012; v.shadowR = 40;
      break;
    }
    case 'pass': { const s0 = esStoryAt(shot.t0), x0 = P.nose(s0) + 7.5; v.p = [x0, 0.85, -3.3]; v.at = [Math.min(N - 6, x0 - 3), 2.1, -0.4]; v.fov = 52; v.near = 0.1; v.drift = 0.006; v.shake = 0.004 * esK(N, x0 - 12, x0 - 1); v.shadowR = 50; break; }
    case 'energy': { const k = K(); v.p = [N + L(46, 22, k), L(11, 4.5, k), L(26, 13, k)]; v.at = [N - L(36, 46, k), 2.6, -2]; v.fov = 40; v.near = 0.5; v.drift = 0.012; v.shadowR = 110; break; }
    // down the line, fast, to the hill
    case 'ahead': { const k = K(0.2, d), k2 = k * k; v.p = [L(N - 40, 505, k2), L(11, 9.8, k), 1.6]; v.at = [606, L(12, 10, k), 0]; v.fov = L(34, 40, k); v.near = 0.5; v.drift = 0.006; v.shadowR = 110; v.sat = [L(N - 20, 540, k2), 0, 0]; break; }
    // ---- the hill
    case 'hill': { const k = K(); v.p = [L(548, 566, k), L(2.2, 15, k), L(15, 22, k)]; v.at = [601, L(7, 15, k), -2]; v.fov = 40; v.near = 0.5; v.drift = 0.008; v.shadowR = 110; v.sat = [585, 0, 0]; v.shake = 0.008 * esHitShake(s, 585, 10); break; }
    case 'shed': { const k = K(); v.p = [L(577, 580, k), L(25, 21, k), L(-51, -47, k)]; v.at = [L(596.5, 598, k), 3, -27]; v.fov = 40; v.near = 0.2; v.drift = 0.008; v.shadowR = 80; v.shake = hitAt(P.shed, 0.08) + 0.008; break; }
    case 'siding': { const fr = F.wagons.front + X, k = K(); v.p = [fr - L(104, 96, k), L(7, 4.2, k), F.wagons.z + L(9, 5.5, k)]; v.at = [fr + 30, 5.5, F.wagons.z - 1]; v.fov = 44; v.near = 0.3; v.drift = 0.006; v.shadowR = 90; v.sat = [fr - 40, 0, F.wagons.z]; break; }
    case 'wagons': { const fr = F.wagons.front + X, k = K(); v.p = [L(596.4, 595.8, k), L(2.5, 2.2, k), L(3.6, 2.6, k)]; v.at = [Math.min(fr, 598) - 7, 2.7, -8.6]; v.fov = 46; v.near = 0.15; v.drift = 0.006; v.shadowR = 50; break; }
    case 'impact': { const k2 = esK(u, 1.2, 3.4); v.p = [L(575, 572, k2), L(2.3, 3.0, k2), L(13, 17, k2)]; v.at = [600, L(4.5, 10, k2), -9]; v.fov = L(46, 56, k2); v.near = 0.3; v.drift = 0.01; v.shadowR = 80; v.shake = hitAt(P.wagon0, 0.14) + (s > P.wagon0 ? 0.02 : 0); v.fire = 0.6; break; }
    case 'impact2': { const k = K(); v.p = [L(512, 524, k), L(5.5, 4.5, k), L(4, 2.5, k)]; v.at = [600, L(10, 16, k), -8]; v.fov = L(30, 26, k); v.near = 0.5; v.drift = 0.008; v.shadowR = 110; v.sat = [585, 0, -8]; v.shake = hitAt(P.wagonHit(1), 0.07) + 0.012; v.fire = 0.6; break; }
    case 'wind': { const k = K(); v.p = [L(538, 551, k), L(15, 9, k), L(-62, -49, k)]; v.at = [602, L(17, 26, k), -7]; v.fov = 42; v.near = 0.5; v.drift = 0.015; v.shadowR = 130; v.shake = 0.012 + hitAt(P.wagonHit(3), 0.08, 0.012); v.fire = 0.55; break; }
    case 'heat': { const k = K(), k2 = esK(u, 2.4, d); v.p = [L(570, 579, k), L(2.0, 3.2, k), L(22, 31, k)]; v.at = [L(600, 606, k2), L(5.5, 32, k2), L(-9, 0, k2)]; v.fov = L(46, 56, k2); v.near = 0.3; v.drift = 0.012; v.shadowR = 100; v.shake = 0.012 + hitAt(P.wagonHit(2), 0.1, 0.012); v.fire = 0.55; break; }
    case 'over': { const k = K(); v.p = [L(516, 546, k), L(30, 66, k), L(104, 76, k)]; v.at = [L(610, 632, k), L(30, 46, k), -14]; v.fov = 46; v.near = 2; v.drift = 0.03; v.shadowR = 260; v.fog = 0.0002; v.shake = 0.008 + hitAt(P.wagonHit(4), 0.05, 0.012); v.fire = 0.6; break; }
    // ---- the sea
    // from the platform (bare now: everything on it has gone east): the harbour, and what stands in it
    case 'quay': { const k = esK(u, 0.5, 7.0), kp = K(); v.p = [L(-58, -76, kp), PH + 1.6, -4.4]; v.at = [-250, L(4, 175, k), L(-6, -2, k)]; v.fov = L(52, 66, k); v.near = 0.2; v.drift = 0.01; v.shadowR = 80; v.shake = 0.008; break; }
    // along the foot of it, in profile, toward the ferry
    case 'foot': { const k = K(); v.p = [L(-273, -263, k), L(4.5, 9, k), L(176, 58, k)]; v.at = [-252, L(20, 44, k), -70]; v.fov = 52; v.near = 0.5; v.drift = 0.015; v.shadowR = 150; v.shake = 0.008; break; }
    case 'ferry': { const k = K(); v.p = [L(-289, -286, k), 4.2, L(-72, -68, k)]; v.at = [-259, L(8, 16, esK(u, 1.2, 5)), -32]; v.fov = 47; v.near = 0.5; v.drift = 0.012; v.shadowR = 120; v.shake = hitAt(P.ferryHit, 0.12) + 0.01; break; }
    // beside the Eiffel Tower's outline, rising; then back and up: the same wall along the whole coast
    case 'up': { const k = esK(u, 0, 6.2), k2 = esK(u, 5.2, d); v.p = [L(-16, -84, k) + 380 * k2, L(8, 64, k) + 330 * k2, L(336, 262, k) + 560 * k2]; v.at = [-250, L(96, 186, k) - 70 * k2, L(24, -260, k2)]; v.fov = L(54, 46, k2); v.near = 1; v.drift = 0.02; v.shadowR = 200 + 400 * k2; v.fog = L(0.0003, 0.00014, k2); v.shake = 0.006 * (1 - k2); break; }
    // ---- one second is not long enough to fall: under the station's roof; behind it (ahead: the fire); the woman
    case 'roof': { const k = K(), ry = P.roofY(s); v.p = [-193 + X - 3 * k, L(1.1, 1.7, k), L(1.6, 0.4, k)]; v.at = [-120 + X, ry - 0.8, -3.2]; v.fov = 54; v.near = 0.2; v.drift = 0.01; v.shadowR = 90; v.sat = [-150 + X, 0, -5]; v.fire = 1.6; break; }
    case 'woman': { const y = P.womanY(s), x = F.bridge.x + X, k = K(); v.p = [x - L(5.2, 3.6, k), y + L(2.6, 1.2, k), L(6.4, 5.4, k)]; v.at = [x + 0.4, y + 0.9, 2.4]; v.fov = 38; v.near = 0.1; v.drift = 0.006; v.shadowR = 30; break; }
    // ---- the last 0.14 s; 5:42:01
    case 'count': { const k = K(); v.p = [N - L(8, 5, k), L(1.2, 0.9, k), L(4.2, 3.5, k)]; v.at = [600, L(16, 12, k), -3]; v.fov = 52; v.near = 0.15; v.drift = 0.006; v.shake = 0.008; v.shadowR = 90; v.sat = [N + 20, 0, 0]; break; }
    // from the tunnel's mouth, a very long lens: your train, head-on (behind it, the sea)
    case 'mouth': { const k = K(); v.p = [L(586, 584, k), L(3.4, 2.6, k), L(7.5, 5.5, k)]; v.at = [N, 3.2, 0]; v.fov = L(5, 3.6, k); v.near = 0.5; v.drift = 0.004; v.shake = 0.004; v.shadowR = 110; v.sat = [N + 40, 0, 0]; v.fire = 1.5; break; }
    // the driver's view: the last 0.05 s in a rush (20 m/s), then 5:42:01: everything stops dead
    case 'cab': { const aft = t - esFilmAt(P.T), rush = Math.min(1, esRateAt(t) * P.v / 20), j = aft < 0 ? rush : Math.exp(-aft / 0.14); v.p = [N + 13, 2.7, 0]; v.at = [600, 9, 0]; v.fov = 58 + 7 * j; v.near = 0.2; v.drift = 0.003; v.shake = aft < 0 ? 0.004 + 0.035 * rush : 0.08 * Math.exp(-aft / 0.22); v.shadowR = 80; v.sat = [N + 50, 0, 0]; break; }
    case 'still': { const k = K(); v.p = [N + L(64, 30, k), L(9, 21, k), L(84, 58, k)]; v.at = [N - 56, L(8, 5, k), -14]; v.fov = 42; v.near = 1; v.drift = 0.02; v.shadowR = 170; break; }
    case 'grip': { const k = K(); v.p = [N - L(31, 29, k), L(0.5, 0.7, k), L(3.1, 2.6, k)]; v.at = [N + 40, L(3, 5, k), 0.4]; v.fov = 44; v.near = 0.08; v.drift = 0.003; v.shadowR = 40; v.sat = [N - 20, 0, 0]; v.fire = 1.4; break; }
    case 'short': { const k = K(); v.p = [N - L(62, 42, k), L(8.5, 5, k), L(17, 9.5, k)]; v.at = [N + 100, L(10, 8.5, k), -2]; v.fov = 40; v.near = 0.3; v.drift = 0.012; v.shadowR = 140; v.sat = [N + 10, 0, 0]; v.fire = 1.4; break; }
    // ---- everything the ground stopped, thrown west
    case 'twist': { const k = K(); v.p = [N - L(36, 30, k), L(18, 23, k), L(30, 24, k)]; v.at = [L(598, 572, k), 26, -6]; v.fov = L(36, 32, k); v.near = 0.5; v.drift = 0.012; v.shake = 0.006 + 0.01 * k; v.shadowR = 130; v.sat = [N, 0, 0]; break; }
    // travelling with the fire, over the roofs (it stands still; the ground runs under it): your train comes in from the left
    case 'sweep': { const k = K(), bx = P.blastX(s); v.p = [bx - L(58, 50, k), L(34, 26, k), L(86, 70, k)]; v.at = [bx - L(52, 44, k), 6, 0]; v.fov = 50; v.near = 0.5; v.drift = 0.012; v.shake = 0.01 + 0.012 * k; v.shadowR = 170; v.sat = [bx - 40, 0, 0]; break; }
    case 'reach': { const k = K(); v.p = [N - L(13, 11, k), L(2.0, 2.3, k), 6.2]; v.at = [N + 34, L(13, 16, k), -1]; v.fov = 56; v.near = 0.2; v.drift = 0.004; v.shake = 0.02 + 0.06 * k; v.shadowR = 80; break; }
    case 'question': {
      // your seat: your window, and what is coming along the line (it arrives at ES.tHit; after that the picture is black)
      const k = esK(t, shot.t0, ES.tHit), e = eye(4.9, 1.36, -0.78), a = eye(8.5, 1.3, -3.2), b = eye(12.5, 1.75, -5.6);
      v.p = [e[0] + 0.25 * k, e[1], e[2] - 0.12 * k]; v.at = esV(a, b, esK(u, 0, 1.5)); v.fov = L(60, 70, k); v.near = 0.03; v.drift = 0.002; v.shake = 0.006 + 0.07 * k * k; v.shadowR = 40; v.fire = 1 + 2.2 * k * k; break;
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
    case 'first': L([606, 27, -30], 'THE HILL', '600 m EAST OF THE STATION', 'l'); break;
    case 'glide': L([-118, 3, -13], 'WHERE THE STATION STOOD', `${X.toFixed(0)} m AGO`, 'r'); break;
    case 'floor': L([-124, 2.4, -14], 'ITS FLOOR', 'STILL BOLTED DOWN', 'r'); break;
    case 'platEnd': L([0, F.plat.h + 0.1, -5.2], 'THE PLATFORM’S END', null, 'r', esWin(t, sh.t0 + 0.4, sh.t0 + 3.2, 0.3, 0.4)); break;
    case 'fly': { const x = set.St.leadX + X; if (x > 0.5) L([x, 3.2, -3.6], `${F.plat.h} m UP`, `FALLEN SO FAR: ${(P.fall(s, -set.St.leadX / P.v) * 1000).toFixed(0)} mm`, 'r'); break; }
    case 'pass': L([N + 2, 4.6, 0], 'YOUR TRAIN', `${n(P.kmh - P.trainA * Math.min(s, 1) * 3.6)} km/h OVER THE GROUND`, null); break;
    case 'energy': L([N - 36, 6.5, 0], 'YOUR TRAIN', `${(P.tntT(P.trainT)).toFixed(1)} TONNES OF TNT`, null); break;
    case 'ahead': L([604, 34, 0], 'THE HILL', `${n(P.gap(s))} m AHEAD OF YOUR TRAIN`, null); break;
    case 'hill': L([600, 9.6, 0], 'THE TUNNEL', null, 'r'); break;
    case 'siding': case 'wagons': { const fr = F.wagons.front + X, g = esHillX(F.wagons.z) - fr; if (g > 0) L([fr, 5.4, F.wagons.z], `${g.toFixed(1)} m`, 'TO THE ROCK', 'r'); break; }
    case 'quay': L([F.quay.x - 2, Math.min(P.wallH(s) * 0.45, 90), 0], `${n(P.wallH(s))} m HIGH`, 'AND CLIMBING', null, esWin(t, sh.t0 + 3.4, sh.t1 - 0.1, 0.4, 0.3)); break;
    case 'foot': L([F.quay.x - 2, 34, -40], `${n(P.wallH(s))} m HIGH`, 'AND CLIMBING', 'r'); break;
    case 'up': { const k = 1 - MathX.smooth(t, sh.t0 + 5.0, sh.t0 + 6.0); L([ES_EIFFEL[0], 300, ES_EIFFEL[1]], 'THE EIFFEL TOWER', '330 m, FOR SCALE', 'r', k); L([F.quay.x, P.wallH(s) * 0.8, -60], `${n(P.wallH(s))} m HIGH`, 'AND CLIMBING', null, k); break; }
    case 'roof': L([-150 + X, P.roofY(s) + 0.4, -4.5], 'THE STATION’S ROOF', `${P.roofY(s).toFixed(1)} m UP · ${X.toFixed(0)} m FROM ITS PLATFORM`, null); break;
    case 'woman': L([F.bridge.x + X + 0.5, P.womanY(s) + 1.75, 2.4], `${P.womanY(s).toFixed(1)} m UP`, `FALLING AT ${(P.g * Math.max(0, s - P.womanFree) * 3.6).toFixed(0)} km/h`, 'l'); break;
    case 'count': L([604, 40, 0], 'THE HILL', `${n(P.gap(s))} m`, null); break;
    case 'mouth': L([N, 5.2, 0], 'YOUR TRAIN', `${n(P.gap(s))} m FROM THE ROCK`, null); break;
    case 'short': L([(N + 600) / 2, 13, 0], `${n(P.gap(s))} m`, 'YOUR TRAIN TO THE ROCK', null); break;
    case 'twist': L([P.blastX(s) - 2, 30, -9], 'THE FIRE AND THE AIR', 'NO SPEED LEFT', 'r'); break;
    case 'sweep': L([N + 2, 5.4, 0], 'YOUR TRAIN', '1,670 km/h EAST, WITH THE GROUND', null); L([P.blastX(s) + 4, 26, -4], 'THE FIRE', 'STANDING STILL', 'l'); break;
    default: break;
  }
  return out;
}
