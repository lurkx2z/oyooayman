/* =====================================================================
   COAST SET — the harbour, the station, the town, the line and the hill (world.js, station.js, train.js, fx.js) and
   every camera in it. Two kinds of camera: standing on the ground (it stopped: everything loose slides past), and
   travelling with everything loose (ESP.X(s) is added to its position: then it is the ground that goes by).
   Your seat is in the train's second car, on the north side, facing forward (east).
   ===================================================================== */

ES_SETS.coast = (app) => {
  const S = esSet(app, { sky: '#f0c898', fov: 50, near: 0.1, far: 14000, sun: [0, 0, 0], sunColor: '#ffc27e', sunI: 3.4, shadow: 4096, shadowR: 60, shadowFar: 1700,
    hemi: ['#a9c0e4', '#8a6a4c', 1.0], env: ['#4f7fc0', '#f0c898', '#6a5a48'] });
  const scene = S.scene, cam = S.camera;
  scene.fog = new THREE.FogExp2('#eac9a2', 0.0003);
  S.sun.shadow.bias = -0.0006; S.sun.shadow.normalBias = 0.06;
  const W = esBuildWorld(S), St = esBuildStation(S), Tr = esBuildTrain(S), Fx = esBuildFx(S, { W, St, Tr });
  const sunV = new THREE.Vector3(...ES_SUN);

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
      scene.fog.density = v.fog;
      esCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov, v.roll);
      this._v = v;
      // the sun's shadow box follows what the camera looks at (never farther than 1.2 box widths from the camera)
      const R = v.shadowR, lim = R * 1.2, tg = new THREE.Vector3(MathX.clamp(v.sat ? v.sat[0] : v.at[0], cam.position.x - lim, cam.position.x + lim), 0, MathX.clamp(v.sat ? v.sat[2] : v.at[2], cam.position.z - lim, cam.position.z + lim));
      const sc = S.sun.shadow.camera; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.updateProjectionMatrix();
      S.sun.target.position.copy(tg); S.sun.position.copy(tg).addScaledVector(sunV, 800); S.sun.target.updateMatrixWorld();
      // the fire dims the day a little around it (its smoke); the sun itself is unchanged
      Fx.update(s, t, m, cam);
    },
    labels(t) { return esCoastLabels(this, t); },
    grade(t, p) {
      p.exposure = 1.0; p.saturation = 1.08; p.contrast = 1.08; p.warmth = 0.03; p.vignette = 0.44; p.bloom = 0.36; p.bloomThreshold = 0.92; p.grain = 0.024; p.blackLift = 0.006;
      const s = this._s, P = ESP, m = this._shot ? this._shot.mode : '';
      // 5:42:00.000: a jolt of light; the first wagon; the ferry; 5:42:01.000
      const fl = (s0, a, d) => { if (s > s0 && s < s0 + d * 6) p.flash = Math.max(p.flash, a * Math.exp(-(s - s0) / d)); };
      fl(0, 0.55, 0.0016);
      if (m === 'impact' || m === 'wagons') fl(P.wagon0, 0.75, 0.004);
      if (m === 'ferry') fl(P.ferryHit, 0.4, 0.003);
      fl(P.T, 0.5, 0.0012);
      p.flashColor.setRGB(1, 0.93, 0.8);
      // in the fire's light
      const f = this.Fx.fire(s);
      if (f > 0 && (m === 'impact' || m === 'wind' || m === 'heat' || m === 'over' || m === 'count' || m === 'cab' || m === 'twist' || m === 'second' || m === 'reach' || m === 'question')) { p.warmth += 0.05 * f; p.bloom += 0.14 * f; }
      if (m === 'question') { const k = MathX.smooth(t, this._shot.t0, ES.end); p.warmth += 0.1 * k; p.exposure += 0.25 * k * k; p.bloom += 0.2 * k; }
      if (m === 'inside' || m === 'question') { p.vignette = 0.5; }
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
    case 'globe': { const k = K(); v.p = [L(-560, -500, k), L(430, 400, k), 600]; v.at = [130, 0, -30]; v.fov = 38; v.near = 5; v.shadowR = 480; v.drift = 0.05; v.fog = 0.00016; break; }
    case 'glide': { v.p = [-3.0 + X, PH + 1.62, -2.35]; v.at = [-60 + X, 3.0, -3.5]; v.fov = 54; v.near = 0.1; v.drift = 0.012; v.shadowR = 50; v.sat = [-22 + X, 0, -3]; break; }
    case 'sun': { const p = [60, 8.4, -51.4]; v.p = p; v.at = [p[0] + ES_SUN[0] * 400, p[1] + ES_SUN[1] * 400 - 8, p[2] + ES_SUN[2] * 400]; v.fov = L(15, 12.5, K()); v.near = 2; v.drift = 0.004; v.shadowR = 120; v.sat = [-50, 0, -14]; break; }
    // ---- the bolts
    case 'bolt': { const k = K(); v.p = [L(-43.75, -43.9, k), PH + L(0.36, 0.3, k), -3.55]; v.at = [-45.25, PH + 0.06, -4.72]; v.fov = 40; v.near = 0.03; v.drift = 0.003; v.shadowR = 14; break; }
    case 'feet': { const k = K(); v.p = [-62 + X, PH + L(0.38, 0.5, k), -3.45]; v.at = [-110 + X, PH + 1.0, -4.95]; v.fov = 36; v.near = 0.08; v.drift = 0.006; v.shadowR = 40; v.sat = [-75 + X, 0, -4.5]; break; }
    case 'floor': { const k = K(); v.p = [L(-176, -168, k), L(33, 30, k), 36]; v.at = [-90, 2, -13]; v.fov = 40; v.near = 1; v.shadowR = 110; v.drift = 0.02; break; }
    // ---- the town
    case 'town': { const k = K(); v.p = [L(-36, -40, k), 1.7, -58.2]; v.at = [-140, 5, -58.6]; v.fov = 50; v.near = 0.2; v.drift = 0.012; v.shadowR = 70; v.sat = [-70, 0, -58]; break; }
    case 'townAir': { const k = K(); v.p = [L(-340, -322, k), L(124, 116, k), -210]; v.at = [-40, 0, -50]; v.fov = 40; v.near = 2; v.shadowR = 260; v.drift = 0.03; break; }
    // ---- the people on the platform; its end; the pigeons
    case 'people': { const k = K(), x = St.leadX + X; v.p = [x + L(9.5, 8.2, k), PH + 1.52, -2.25]; v.at = [x - 5, PH + 1.28, -4.6]; v.fov = 30; v.near = 0.1; v.drift = 0.006; v.shadowR = 30; break; }
    case 'platEnd': { v.p = [8.6, 0.38, -3.0]; v.at = [-10, 2.8, -4.4]; v.fov = 60; v.near = 0.08; v.drift = 0.006; v.shadowR = 40; break; }
    case 'pigeons': { const k = K(); v.p = [-58 + X + L(0, -1.5, k), L(6.3, 6.0, k), L(3.8, 3.0, k)]; v.at = [-70 + X, 5.3, -1.4]; v.fov = 32; v.near = 0.1; v.drift = 0.008; v.shadowR = 40; break; }
    // ---- your train
    case 'wheels': { const bx = N - 37.5 + 8.4, k = K(); v.p = [bx + L(3.9, 3.3, k), 0.44, 2.75]; v.at = [bx - 0.8, 0.52, 0.55]; v.fov = 40; v.near = 0.05; v.drift = 0.003; v.shake = 0.0015; v.shadowR = 20; break; }
    case 'inside': {
      // your coffee, your table, the window; then you look out
      const k = esK(u, 5.4, 8.0), a = eye(6.6, 0.74, -1.25), b = eye(11, 1.5, -9);
      v.p = eye(); v.at = esV(a, b, k); v.fov = 62; v.near = 0.03; v.drift = 0.0025; v.shake = 0.0012; v.shadowR = 40;
      break;
    }
    case 'pass': { const s0 = esStoryAt(shot.t0), x0 = P.nose(s0) + 15.5; v.p = [x0, 0.85, -3.3]; v.at = [Math.min(N - 6, x0 - 3), 2.1, -0.4]; v.fov = 52; v.near = 0.1; v.drift = 0.006; v.shake = 0.004 * esK(N, x0 - 12, x0 - 1); v.shadowR = 50; break; }
    case 'energy': { const k = K(); v.p = [N + L(40, 30, k), L(15, 12, k), L(34, 28, k)]; v.at = [N - 36, 2.5, -3]; v.fov = 38; v.near = 0.5; v.drift = 0.012; v.shadowR = 110; break; }
    case 'ahead': { const k = K(); v.p = [N - 70, L(10.5, 11.5, k), -6.5]; v.at = [606, 16, 0]; v.fov = L(26, 22, k); v.near = 0.5; v.drift = 0.006; v.shadowR = 110; v.sat = [N - 20, 0, 0]; break; }
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
    case 'ferry': { const h = s - P.ferryHit; v.p = [-296, 7.5, -84]; v.at = [-262, 9, -37]; v.fov = 50; v.near = 0.5; v.drift = 0.012; v.shadowR = 120; v.shake = h > 0 ? 0.1 * Math.exp(-h / 0.01) + 0.01 : 0.008; break; }
    case 'up': { const k = K(); v.p = [-224, 1.6, 30]; v.at = [-246, L(120, 190, k), -30]; v.fov = 62; v.near = 0.3; v.drift = 0.012; v.shadowR = 80; v.shake = 0.01; break; }
    case 'shores': { const k = K(); v.p = [L(1150, 1100, k), L(540, 520, k), 1500]; v.at = [-250, 120, -400]; v.fov = 36; v.near = 6; v.drift = 0.06; v.shadowR = 600; v.fog = 0.00012; break; }
    // ---- one second is not long enough to fall
    case 'roof': { const k = K(); v.p = [-30 + X + L(0, -3, k), L(1.9, 2.3, k), -14.5]; v.at = [-96 + X, 4.4, -4.6]; v.fov = 44; v.near = 0.2; v.drift = 0.01; v.shadowR = 90; v.sat = [-70 + X, 0, -5]; break; }
    case 'woman': { const y = P.womanY(s), x = F.bridge.x + X, k = K(); v.p = [x - L(5.6, 4.6, k), y + 1.45, 6.0]; v.at = [x, y + 1.0, 2.4]; v.fov = 36; v.near = 0.1; v.drift = 0.006; v.shadowR = 30; break; }
    // ---- the last 0.14 s; 5:42:01
    case 'count': { const k = K(); v.p = [N - 52, L(11, 12.5, k), -8.5]; v.at = [600, 26, 0]; v.fov = L(30, 26, k); v.near = 0.5; v.drift = 0.008; v.shake = 0.004; v.shadowR = 120; v.sat = [N - 10, 0, 0]; break; }
    case 'cab': { const z = s < P.T ? 1 : 0; v.p = [N + 2.0, 3.35, 0]; v.at = [600, 10, 0]; v.fov = 58; v.near = 0.2; v.drift = 0.003; v.shake = 0.006 * z + 0.05 * (s >= P.T ? Math.exp(-(s - P.T) / 0.002) : 0); v.shadowR = 80; v.sat = [N + 40, 0, 0]; break; }
    case 'still': { const k = K(); v.p = [N + L(40, 36, k), L(16, 18, k), 64]; v.at = [N - 56, 5, -14]; v.fov = 42; v.near = 1; v.drift = 0.02; v.shadowR = 170; break; }
    case 'short': { const k = K(); v.p = [L(520, 528, k), 10, 128]; v.at = [528, 10, 0]; v.fov = 44; v.near = 1; v.drift = 0.02; v.shadowR = 130; break; }
    case 'roofDown': { const k = K(); v.p = [N - L(16, 20, k), L(6.2, 5.4, k), -18]; v.at = [N - 62, 2.4, -3.4]; v.fov = 42; v.near = 0.3; v.drift = 0.012; v.shadowR = 90; break; }
    // ---- everything the ground stopped, thrown west
    case 'twist': { const k = K(); v.p = [N - 34, L(19, 22, k), 28]; v.at = [L(598, 580, k), 26, -6]; v.fov = L(36, 32, k); v.near = 0.5; v.drift = 0.012; v.shake = 0.006; v.shadowR = 130; v.sat = [N, 0, 0]; break; }
    case 'twistSea': { const k = K(); v.p = [L(-64, -58, k), 70, 170]; v.at = [-268, 130, -10]; v.fov = 54; v.near = 1; v.drift = 0.03; v.shadowR = 220; break; }
    case 'second': { const k = K(); v.p = [N + L(30, 27, k), 1.25, 4.6]; v.at = [600, L(20, 16, k), -5]; v.fov = 46; v.near = 0.2; v.drift = 0.006; v.shake = 0.012 + 0.03 * k; v.shadowR = 90; break; }
    case 'reach': { const k = K(); v.p = [N - L(13, 11, k), L(2.0, 2.3, k), 6.2]; v.at = [N + 34, L(13, 16, k), -1]; v.fov = 56; v.near = 0.2; v.drift = 0.004; v.shake = 0.02 + 0.06 * k; v.shadowR = 80; break; }
    case 'question': { const k = K(), a = eye(6.6, 0.76, -1.2), b = eye(16, 1.9, -5.5); v.p = eye(); v.at = esV(a, b, esK(u, 0.2, 2.6)); v.fov = L(62, 66, k); v.near = 0.03; v.drift = 0.002; v.shake = 0.004 + 0.03 * k * k; v.shadowR = 40; break; }
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
