/* =====================================================================
   MODES — what each kind of shot shows: its camera (your frame), you (third person, or your own body below the neck
   in your view), Leo (in the world or on your palm), the neighbours, the tent, the airliner, the Sun's shadow, the
   labels pinned to things. Each is a pure function of { t, tau, s, u (0…1 through the shot), dt, D }.
   Your frame: x east, y up, z south; P (the tent) at the origin; you stand on P facing east.
   ===================================================================== */

const EK_EYE = [0.07, 1.63, 0], EK_KEYE = [0.1, 1.17, 0], EK_LIE_EYE = [-0.66, 0.22, 0];
// your body: lying in the tent (face up, head west), standing, kneeling
const ekYouLie = (dt) => ({ show: true, pov: true, pos: [0.98, 0.13, 0], lay: -Math.PI / 2, yaw: Math.PI / 2, pose: (() => { const p = basePose(); p.lSh = [0.15, 0.08]; p.rSh = [0.15, 0.08]; p.lEl = 0.4; p.rEl = 0.4; p.neck = 0.25; return p; })() });
const ekYouPov = (pose, o = {}) => Object.assign({ show: true, pov: true, pos: [0, 0, 0], yaw: Math.PI / 2, pose }, o);
const ekYou3 = (pose, o = {}) => Object.assign({ show: true, pov: false, pos: [0, 0, 0], yaw: Math.PI / 2, pose }, o);
// the tent's fabric is pushed out by: your body lying (a capsule for the head and chest, one for the legs); standing
const EK_WRAP_LIE = [[-0.62, 0.15, 0, 0.15, 0.15, 0, 0.24], [0.15, 0.12, 0, 0.92, 0.1, 0, 0.17]];
const EK_WRAP_STAND = [[0, -0.2, 0, 0, 0.95, 0, 0.21], [0, 0.95, 0, 0, 1.55, 0, 0.25]];
const EK_WRAP_KNEEL = [[-0.45, 0.0, 0, 0.1, 0.12, 0, 0.18], [0.05, 0.1, 0, 0.05, 1.25, 0, 0.24]];
// Leo in the world, by story time τ: { xz, pose, yaw, lay, dy }
function ekLeoAt(tau, dt = 0) {
  const L = EK_LEO;
  if (tau < 41) {   // asleep in his bag (face up, head west)
    return { where: 'world', xz: [L.bag[0] + 0.5, L.bag[1]], pose: (() => { const p = basePose(); p.lSh = [0.1, 0.05]; p.rSh = [0.1, 0.05]; p.neck = 0.3; return p; })(), yaw: Math.PI / 2, lay: -Math.PI / 2, dy: 0.06, bag: true };
  }
  if (tau < 49.5) {   // crawling out: from beside you to the door and out
    const k = ekSm(tau, 41, 49.5), a = k < 0.5 ? [L.bag[0] + 0.3, L.bag[1] - 0.1] : L.door, b = k < 0.5 ? L.door : [1.9, -0.65], kk = k < 0.5 ? k * 2 : (k - 0.5) * 2;
    const x = MathX.lerp(a[0], b[0], kk), z = MathX.lerp(a[1], b[1], kk);
    return { where: 'world', xz: [x, z], pose: EK_P_.crawl(tau), yaw: Math.atan2(b[0] - a[0], b[1] - a[1]), dy: 0 };
  }
  if (tau < 54) {   // stands up, walks out a few steps, turns to look up at you
    const k = ekSm(tau, 49.5, 53), x = MathX.lerp(1.9, L.out[0], k), z = MathX.lerp(-0.65, L.out[1], k);
    const face = Math.atan2(-L.out[0], -L.out[1]);
    return { where: 'world', xz: [x, z], pose: ekLerpPose(sfWalkPoseEK(tau * 5.5), EK_P_.lookUp(tau, 1), ekSm(tau, 52, 54)), yaw: MathX.lerp(Math.atan2(L.out[0] - 1.9, L.out[1] + 0.65), face, ekSm(tau, 52, 54)) };
  }
  return { where: 'world', xz: L.out, pose: EK_P_.leoCall(tau, 1), yaw: Math.atan2(-L.out[0], -L.out[1]) };
}
function sfWalkPoseEK(ph) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * s, 0.03]; p.rHip = [-0.42 * s, 0.03]; p.lKnee = 0.08 + 0.65 * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * Math.max(0, -co) ** 1.5;
  p.lSh = [-0.34 * s, 0.07]; p.rSh = [0.34 * s, 0.07]; p.lEl = 0.28; p.rEl = 0.28; return p;
}
// a label pinned in your frame
const ekLab = (p, text, sub = '', a = 1, side = '') => ({ p: new THREE.Vector3(p[0], p[1], p[2]), text, sub, a, side });
// where your shadow falls: from a point of you (y0 m up) along the sunlight to the first ground that rises into it
const ekShadowHit = (tau, s, y0) => {
  const sp = ekSunAt(Math.max(0, tau)), d = ekDirAltAz(sp.alt, sp.az), k = Math.hypot(d[0], d[2]), hx = -d[0] / k, hz = -d[2] / k, dy = -d[1] / k;
  for (let r = 0.4; r < 30; r += 0.015) { const x = hx * r, z = hz * r, y = y0 + dy * r, g = ekGroundY(x / s, z / s) * s; if (g >= y) return [x, g, z]; }
  return null;
};
const ekFmt = (x, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const EK_MODES = {
  // ---- in the tent (lying on your back, head west)
  tentWake: ({ tau, s, u, dt }) => ({
    cam: { p: [EK_LIE_EYE[0], EK_LIE_EYE[1], EK_LIE_EYE[2] + 0.01 * Math.sin(dt * 0.7)], at: ekAt(EK_LIE_EYE, 95 + 4 * Math.sin(dt * 0.4), 62 + 3 * Math.sin(dt * 0.5)), fov: 64, near: 0.015, far: 2e5 },
    you: ekYouLie(dt), leo: ekLeoAt(tau), tent: { wrap: EK_WRAP_LIE }, exposure: 1.05,
  }),
  tentLeo: ({ tau, s, u, dt }) => {
    const leo = ekLeoAt(tau), head = ekWP(EK_LEO.bag[0] - 0.42, EK_LEO.bag[1], s, 0.12, 0.0);
    return { cam: { p: EK_LIE_EYE, at: [head[0], head[1] + 0.02, head[2]], atLeo: [0, -0.02, 0], fov: 50, near: 0.012, far: 2e5 }, you: ekYouLie(dt), leo, tent: { wrap: EK_WRAP_LIE } };
  },
  tentFeet: ({ tau, s, u, dt }) => ({
    cam: { p: [EK_LIE_EYE[0] + 0.05 * u, EK_LIE_EYE[1] + 0.06 + 0.04 * u, 0], at: ekAt(EK_LIE_EYE, 90, -18 + 4 * u), fov: 62, near: 0.012, far: 2e5 },
    you: ekYouLie(dt), leo: ekLeoAt(tau), tent: { wrap: EK_WRAP_LIE },
  }),
  tentClose: ({ tau, s, u, dt }) => {
    const head = ekWP(EK_LEO.bag[0] - 0.42, EK_LEO.bag[1], s, 0.12, 0.0), p = [EK_LIE_EYE[0] + 0.02, EK_LIE_EYE[1] + 0.02, 0.06 + 0.04 * u];
    return { cam: { p, at: [head[0], head[1], head[2]], atLeo: [0, -0.01, 0], fov: 46 - 6 * u, near: 0.01, far: 2e5 }, you: ekYouLie(dt), leo: ekLeoAt(tau), tent: { wrap: EK_WRAP_LIE } };
  },
  // ---- out through the roof: hands up, the fabric tears, you sit up and stand
  rip: ({ tau, s, u, dt, D }) => {
    const up = ekSm(u, 0.28, 0.95), sit = ekSm(u, 0.28, 0.62);
    const p = [MathX.lerp(EK_LIE_EYE[0], EK_EYE[0], ekSm(u, 0.3, 0.8)), MathX.lerp(EK_LIE_EYE[1], EK_EYE[1], up), 0];
    const pitch = MathX.lerp(68, -8, ekSm(u, 0.3, 0.85)), az = 90;
    return { cam: { p, at: ekAt(p, az, pitch), fov: 62 - 6 * up, near: 0.015, far: 2e5, shake: 0.004 * (1 - Math.abs(u - 0.4) * 2) },
      you: u > 0.85 ? ekYouPov(EK_P_.stand(dt)) : { show: false }, hands: u < 0.7, leo: ekLeoAt(tau),
      tent: { rip: 0.42 * ekSm(u, 0.12, 0.32), wrap: u < 0.36 ? EK_WRAP_LIE : EK_WRAP_STAND } };
  },
  campPan: ({ tau, s, u, dt }) => ({
    cam: { p: EK_EYE, at: ekAt(EK_EYE, MathX.lerp(150, 78, ekSm(u, 0, 1)), -14 + 3 * u), fov: 58, near: 0.03, far: 2e6 },
    you: ekYouPov(EK_P_.stand(dt)), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND },
  }),
  // ---- Poincaré: the lake and the peaks lit at the top; then you, from low
  lakeDawn: ({ tau, s, u, dt }) => ({
    cam: { p: EK_EYE, at: ekAt(EK_EYE, MathX.lerp(282, 300, u), 1.5), fov: 54, near: 0.05, far: 3e6 },
    you: ekYouPov(EK_P_.stand(dt)), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND },
  }),
  campLow: ({ tau, s, u, dt }) => {
    const p = [2.3 - 0.2 * u, 0.32, 1.5 - 0.1 * u];
    return { cam: { p, at: [0, 0.95, 0], fov: 46, near: 0.02, far: 3e6 }, you: ekYou3(EK_P_.stand(dt), { yaw: Math.PI / 2 + 0.3 }), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND } };
  },
  unless: ({ tau, s, u, dt }) => {
    const p = [0.95 + 0.05 * u, 0.05, -0.55];
    return { cam: { p, at: [0, 1.45, 0], fov: 60, near: 0.01, far: 3e6 }, you: ekYou3(EK_P_.stand(dt), { yaw: Math.PI / 2 - 0.25 }), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND } };
  },
  // ---- Leo
  leoOut: ({ tau, s, u, dt }) => ({
    cam: { p: EK_EYE, at: ekAt(EK_EYE, 78 - 6 * u, -58 + 6 * u), fov: 56, near: 0.02, far: 3e6 },
    you: ekYouPov(EK_P_.lookDown(dt)), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND },
  }),
  leoView: ({ tau, s, u, dt }) => {
    const L = EK_LEO.out, e = ekWP(L[0] + 0.15, L[1] + 0.05, s, 0.98);
    return { cam: { p: e, at: [0.05, 1.5, 0], fov: 64, near: 0.004, far: 3e6 }, you: ekYou3(Object.assign(EK_P_.lookDown(dt), { headYaw: 0.25 }), { yaw: 1.25 }), leo: { where: 'none' }, tent: { rip: 0.42, wrap: EK_WRAP_STAND } };
  },
  leoCall: ({ tau, s, u, dt }) => {
    const L = ekWP(EK_LEO.out[0], EK_LEO.out[1], s, 0.6);
    return { cam: { p: EK_EYE, at: [L[0], L[1] - 0.05, L[2]], fov: 48 - 4 * u, near: 0.02, far: 3e6 }, you: ekYouPov(EK_P_.lookDown(dt)), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND } };
  },
  leoCallLow: ({ tau, s, u, dt }) => {
    const L = EK_LEO.out, p = ekWP(L[0] + 1.25, L[1] - 0.55, s, 0.95);
    return { cam: { p, at: [0.05, 1.35, 0], fov: 54, near: 0.004, far: 3e6 }, you: ekYou3(Object.assign(EK_P_.lookDown(dt), { headYaw: 0.2 }), { yaw: 1.3 }), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND } };
  },
  // ---- your weight; picking him up
  bayPOV: ({ tau, s, u, dt }) => ({
    cam: { p: EK_EYE, at: ekAt(EK_EYE, MathX.lerp(22, 48, u), -16), fov: 54, near: 0.03, far: 3e6 },
    you: ekYouPov(EK_P_.stand(dt)), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND },
  }),
  bendSide: ({ tau, s, u, dt, D }) => {
    const g = EKP.g0 * s, v0 = Math.sqrt(2 * g * 0.07), tb = 0.55, tt = dt - tb, hop = tt > 0 ? Math.max(0, v0 * tt - 0.5 * g * tt * tt) : 0;
    const bend = ekSm(dt, 0.1, 0.65) * (1 - ekSm(dt, 2.4, 3.2));
    return { cam: { p: [0.35, 0.05, 2.3], at: [0.15, 0.55, 0], fov: 44, near: 0.01, far: 3e6 },
      you: ekYou3(ekLerpPose(EK_P_.stand(dt), EK_P_.bend(dt), bend), { pos: [0, hop, 0], yaw: Math.PI / 2 }), leo: ekLeoAt(tau), tent: { rip: 0.42, wrap: EK_WRAP_STAND }, hop };
  },
  pickUp: ({ tau, s, u, dt, D }) => {
    const rise = ekSm(u, 0.42, 0.95), bearing = 72;
    const p = [MathX.lerp(0.32, EK_EYE[0], rise), MathX.lerp(0.98, EK_EYE[1], rise), 0];
    const pitch = MathX.lerp(-62, -22, rise);
    const onPalm = u > 0.34;
    const L = ekLeoAt(tau);
    return { cam: { p, at: ekAt(p, bearing, pitch), fov: 54, near: 0.01, far: 3e6 }, hands: true,
      you: ekYouPov(EK_P_.stand(dt)), leo: onPalm ? { where: 'hand', pose: EK_P_.stand(dt, 2), yaw: 0.3 } : { where: 'world', xz: L.xz, toPalm: ekSm(u, 0.05, 0.34), pose: sfWalkPoseEK(dt * 6), yaw: -1.9 },
      tent: { rip: 0.42, wrap: EK_WRAP_STAND } };
  },
  // ---- the neighbours
  nbView: ({ tau, s, u, dt }) => {
    const p = ekWP(31.5, 8.2, s, 1.5);
    return { cam: { p, at: [0.05, 1.2 + 0.1 * u, 0.05], fov: 56, near: 0.002, far: 3e6, shake: 0.0004 }, you: ekYou3(EK_P_.hold(dt), { yaw: 1.4 }), leo: { where: 'none' }, nb: { pose: EK_P_.scream, yaw: [-1.79, -1.75] }, tent: { rip: 0.42, wrap: EK_WRAP_STAND }, smoke: false };
  },
  nbDown: ({ tau, s, u, dt }) => {
    const v = ekWP(EK_F.van.x, EK_F.van.z, s, 1);
    return { cam: { p: EK_EYE, at: [v[0], v[1] - 0.02, v[2] + 0.05], fov: 46 - 4 * u, near: 0.02, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.lookDown(dt)), leo: { where: 'hand', pose: EK_P_.leoCall(dt, 0.7) },
      nb: { pose: EK_P_.scream, yaw: [-1.79, -1.75] }, tent: { rip: 0.42, wrap: EK_WRAP_STAND },
      labels: (t, tau, s) => [ekLab(ekWP(EK_F.van.x, EK_F.van.z, s, 3.4), 'THE NEXT CAMPSITE', `${ekFmt(ekDist([0, 0], [EK_F.van.x, EK_F.van.z]))} m AWAY TO THEM · ${ekFmt(ekDist([0, 0], [EK_F.van.x, EK_F.van.z]) * s * 100)} cm TO YOU`)] };
  },
  boots: ({ tau, s, u, dt }) => ({
    cam: { p: EK_EYE, at: ekAt(EK_EYE, 94, -64 - 3 * u), fov: 60, near: 0.02, far: 3e6 }, hands: false,
    you: ekYouPov(EK_P_.stand(dt), { legs: true }), leo: { where: 'none' }, nb: { pose: EK_P_.scream, yaw: [-1.79, -1.75] }, tent: { rip: 0.42, wrap: EK_WRAP_STAND },
  }),
  callOut: ({ tau, s, u, dt }) => {
    const p = ekWP(70, -32, s, 2.5);
    return { cam: { p, at: [0, 1.25, 0], fov: 50, near: 0.004, far: 3e6 }, you: ekYou3(EK_P_.call(dt, 0.75), { yaw: 1.45 }), leo: { where: 'none' }, nb: { pose: EK_P_.cower }, tent: { rip: 0.42, wrap: EK_WRAP_STAND } };
  },
  // (the quake, as they feel it: low behind the two of them, the ground shaking, you over everything)
  quake: ({ tau, s, u, dt }) => {
    const [[ax, az], [bx, bz]] = EK_F.vanPeople, mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const p = ekWP(mx + 4.2 - 0.8 * u, mz + 1.8, s, 0.45), env = ekSm(u, 0, 0.06) * (1 - 0.55 * ekSm(u, 0.45, 1)) * (0.75 + 0.25 * Math.sin(dt * 5.1));
    return { cam: { p, at: [0, window.EK_QAT ?? 0.55, 0], fov: 66, near: 0.0008, far: 3e6, shake: 0.12 * s * env, shakeRot: 0.022 * env }, you: ekYou3(EK_P_.call(dt, 0.75), { yaw: 1.45 }), leo: { where: 'none' },
      nb: { pose: EK_P_.cower, yaw: [1.35, 1.6] }, tent: { rip: 0.42, wrap: EK_WRAP_STAND }, quake: 1 };
  },
  // ---- his voice climbs out of your hearing (on your palm, smaller each time)
  palm1: ({ tau, s, u, dt }) => ({ cam: { p: EK_EYE, at: ekAt(EK_EYE, 70, -9), fov: 46, near: 0.02, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.hold(dt)), leo: { where: 'hand', pose: EK_P_.leoCall(dt, 1), yaw: 0.2 } }),
  palm2: ({ tau, s, u, dt }) => ({ cam: { p: EK_EYE, at: ekAt(EK_EYE, 66, -11), fov: 40, near: 0.02, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.hold(dt)), leo: { where: 'hand', pose: EK_P_.leoCall(dt, 1), yaw: 0.2 } }),
  palm3: ({ tau, s, u, dt }) => ({ cam: { p: EK_EYE, at: ekAt(EK_EYE, 62, -13), fov: 34 - 3 * u, near: 0.02, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.hold(dt)), leo: { where: 'hand', pose: EK_P_.leoCall(dt, 1), yaw: 0.2 } }),
  valleyDark: ({ tau, s, u, dt }) => ({ cam: { p: EK_EYE, at: ekAt(EK_EYE, MathX.lerp(262, 278, u), -9), fov: 56, near: 0.03, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.hold(dt)), leo: { where: 'hand', pose: EK_P_.sit(dt) } }),
  giantWide: ({ tau, s, u, dt }) => {
    const p = ekWP(-1250 + 120 * u, -470, s, 40, EK_F.lakeY);
    return { cam: { p, at: [0, 1.0, 0], fov: 34, near: 0.01, far: 3e6 }, you: ekYou3(EK_P_.hold(dt), { yaw: 1.4 }), leo: { where: 'none' }, smoke: false };
  },
  // ---- the Sun comes up for you; your shadow
  sunrise: ({ tau, s, u, dt }) => ({ cam: { p: EK_EYE, at: ekAt(EK_EYE, 74, -2.5 - 3 * u), fov: 50, near: 0.03, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.hold(dt)), leo: { where: 'hand', pose: EK_P_.sit(dt) }, bloom: 0.5 }),
  peaksGold: ({ tau, s, u, dt }) => ({ cam: { p: EK_EYE, at: ekAt(EK_EYE, MathX.lerp(262, 256, u), -4), fov: 44, near: 0.03, far: 3e6 }, you: ekYouPov(EK_P_.hold(dt)), leo: { where: 'none' } }),
  // (from the gold peaks: you stand up between them and the Sun; it slips behind you, and they are in your shadow)
  shadowOn: ({ tau, s, u, dt }) => {
    const k = ekSm(u, 0.08, 0.78), h = ekShadowHit(tau, s, 1.0) || [-3.3, 1.0, 1.0], sp = ekSunAt(Math.max(0, tau)), d = ekDirAltAz(sp.alt, sp.az), q = Math.hypot(d[0], d[2]);
    const off = MathX.lerp(0.3, 0.0, k), xw = (h[0] - d[2] / q * off) / s, zw = (h[2] + d[0] / q * off) / s;
    return { cam: { p: ekWP(xw, zw, s, 90), at: [0, 1.0, 0], fov: 50 - 4 * u, near: 0.002, far: 5e4 }, you: ekYou3(EK_P_.hold(dt), { yaw: Math.PI - 254 * Math.PI / 180 }), leo: { where: 'none' },
      shadow: { c: ekWP(-3600, 600, s, 0), R: 15000 * s, bias: -0.0006 }, smoke: false };
  },
  puddle: ({ tau, s, u, dt }) => ({ cam: { p: EK_EYE, at: ekAt(EK_EYE, 296, -52 + 4 * u), fov: 58, near: 0.02, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.lookDown(dt)), leo: { where: 'hand', pose: EK_P_.sit(dt) },
    labels: (t, tau, s) => [ekLab(ekWP(EK_F.lake.cx, EK_F.lake.cz, s, 0, EK_F.lakeY), 'THE LAKE', `3 km LONG · ${ekFmt(3000 * s * 100)} cm TO YOU`)] }),
  waist: ({ tau, s, u, dt }) => ({ cam: { p: [7.5 - 0.6 * u, 0.85, 6.0], at: [-0.8, 0.9, 0], fov: 46, near: 0.01, far: 3e6 }, you: ekYou3(EK_P_.hold(dt), { yaw: 1.3 }), leo: { where: 'none' },
    shadow: { c: [-2, 0.5, 0], R: 12, bias: -0.0005 } }),
  // ---- putting him down
  handHigh: ({ tau, s, u, dt, set }) => ({ cam: { p: EK_EYE, at: ekAt(EK_EYE, 72, -30), fov: 40, near: 0.02, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.hold(dt)), leo: { where: 'hand', pose: EK_P_.sit(dt) },
    labels: () => [ekPalmLab(set, 'LEO')] }),
  kneelDown: ({ tau, s, u, dt, set }) => {
    const k = ekSm(u, 0.05, 0.85), p = [MathX.lerp(EK_EYE[0], EK_KEYE[0], k), MathX.lerp(EK_EYE[1], EK_KEYE[1], k), 0];
    return { cam: { p, at: ekAt(p, 74, MathX.lerp(-30, -46, k)), fov: 46, near: 0.02, far: 3e6 }, hands: true, you: ekYouPov(ekLerpPose(EK_P_.hold(dt), EK_P_.kneel(dt), k)), leo: { where: 'hand', pose: EK_P_.sit(dt) },
      labels: () => [ekPalmLab(set, 'LEO', '', 1 - ekSm(u, 0.6, 0.9))] };
  },
  touch: ({ tau, s, u, dt, set }) => {
    const p = [0.05, 0.56, 0];
    return { cam: { p, at: ekAt(p, 80, -58), fov: 50, near: 0.01, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.kneelTouch(dt)), leo: { where: 'hand', pose: EK_P_.sit(dt) },
      labels: () => [ekPalmLab(set, 'LEO', '', ekSm(u, 0.5, 0.8))] };
  },
  speck: ({ tau, s, u, dt }) => {
    // at Leo's own size: he climbs off your fingertip into the grass (world metres round the touch point)
    const T = EK_TOUCH, k = ekSm(u, 0.05, 0.9), lx = T[0] + 0.6 + 2.4 * k, lz = T[1] + 0.4 + 0.8 * k;
    const tipP = ekWP(T[0], T[1], s, 0);
    const cp = ekWP(T[0] + 3.4 + 1.2 * u, T[1] + 5.0, s, 1.15);
    return { cam: { p: cp, at: ekWP(lx - 0.6, lz, s, 0.7), fov: 52, near: 0.00001, far: 30 }, you: { show: false }, leo: { where: 'world', xz: [lx, lz], pose: k < 0.25 ? EK_P_.climb(dt) : sfWalkPoseEK(dt * 5), yaw: 1.2, dy: 0.0 },
      tip: { p: [tipP[0], tipP[1], tipP[2]], yaw: 0.1 }, smoke: false };
  },
  gone: ({ tau, s, u, dt, set }) => {
    const p = [0.05, 0.56, 0];
    return { cam: { p, at: ekAt(p, 80, -58), fov: 46 - 4 * u, near: 0.01, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.kneelTouch(dt)), leo: { where: 'none' },
      labels: (t, tau, s) => [ekLab(ekWP(EK_TOUCH[0] + 3, EK_TOUCH[1] + 1.2, s, 0.5), 'LEO', 'SOMEWHERE HERE', 1 - ekSm(u, 0.4, 0.95))] };
  },
  // ---- holding on
  kneelView: ({ tau, s, u, dt }) => ({ cam: { p: EK_KEYE, at: ekAt(EK_KEYE, MathX.lerp(60, 90, u), -10), fov: 58, near: 0.02, far: 3e6 }, you: ekYouPov(EK_P_.kneel(dt)), leo: { where: 'none' } }),
  holdPeaks: ({ tau, s, u, dt }) => ({ cam: { p: [EK_KEYE[0], EK_KEYE[1] - 0.05, 0], at: ekAt(EK_KEYE, 90, -54 + 3 * u), fov: 70, near: 0.02, far: 3e6 }, hands: true, you: ekYouPov(EK_P_.kneelHold(dt)), leo: { where: 'none' }, youSky: 2.6 }),
  plane: ({ tau, s, u, dt }) => {
    // westbound (Calgary to Vancouver), 1.9 km north of you; its height 11,000 m above the sea
    const x = 1300 - EKP.plane.v * (tau - 386), z = -1900, y = EKP.plane.alt - EK_F.asl, p = ekSphere(x, z, y);
    const pp = [p[0] * s, p[1] * s, p[2] * s];
    return { cam: { p: EK_KEYE, at: [pp[0] - 0.008, pp[1] - 0.002, pp[2]], fov: 7, near: 0.01, far: 3e6 }, you: ekYouPov(EK_P_.kneel(dt)), leo: { where: 'none' },
      plane: { p: pp, pw: p, yaw: Math.PI, back: [1, 0, 0], trail: true }, smoke: false,
      labels: () => [ekLab([pp[0], pp[1], pp[2]], 'A BOEING 737', `11 km UP · ${ekFmt(EKP.plane.len * s * 1000, 1)} mm LONG`)] };
  },
  curve: ({ tau, s, u, dt }) => ({ cam: { p: EK_KEYE, at: ekAt(EK_KEYE, MathX.lerp(118, 98, u), -9), fov: 74, near: 0.02, far: 3e6 }, you: ekYouPov(EK_P_.kneel(dt)), leo: { where: 'none' }, smoke: false }),
  airBelow: ({ tau, s, u, dt }) => ({ cam: { p: EK_KEYE, at: ekAt(EK_KEYE, 150, -14 + 4 * u), fov: 66, near: 0.02, far: 3e6 }, you: ekYouPov(EK_P_.kneel(dt)), leo: { where: 'none' }, smoke: false }),
  stars: ({ tau, s, u, dt }) => ({ cam: { p: EK_KEYE, at: ekAt(EK_KEYE, 230, MathX.lerp(-4, 48, ekSm(u, 0.05, 0.8))), fov: 66, near: 0.02, far: 3e6 }, you: ekYouPov(EK_P_.kneel(dt)), leo: { where: 'none' }, smoke: false }),
  // ---- it can't hold you; you hold it
  lift: ({ tau, s, u, dt }) => {
    const R = EKP.R * s, lift = 0.04 + 0.5 * ekSm(u, 0.1, 1);
    return { cam: { p: [3.4, 1.1 + 0.4 * u, 4.2], at: [0, 0.2, 0], fov: 48, near: 0.02, far: 3e6 }, you: ekYou3(EK_P_.cling(dt), { pos: [0.9, 0.28 + lift, 0], lay: -Math.PI / 2 + 0.15, yaw: -Math.PI / 2 }), leo: { where: 'none' }, smoke: false, stars: 1 };
  },
  moon: ({ tau, s, u, dt }) => {
    const m = EK_MOON_DIR, p = [-2.6, 1.9, 1.6];
    return { cam: { p, at: [p[0] + m[0] * 10, p[1] + m[1] * 10, p[2] + m[2] * 10], fov: 8, near: 0.02, far: 3e6 }, you: ekYou3(EK_P_.cling(dt), { pos: [0.9, 0.7, 0], lay: -Math.PI / 2 + 0.2, yaw: -Math.PI / 2 }), leo: { where: 'none' }, smoke: false,
      labels: (t, tau, s) => [ekLab([p[0] + m[0] * 10, p[1] + m[1] * 10, p[2] + m[2] * 10], 'THE MOON', `${ekFmt(EKP.moonD * s / 1000, 1)} km AWAY · ${ekFmt(2 * EKP.moonR * s)} m ACROSS`)] };
  },
  // (house, car, smaller than you: the same framing each time, you holding on to its side as the scale)
  house: ({ tau, s, u, dt }) => ekBeside(EKP.R * s, 1.0, dt, u),
  carSize: ({ tau, s, u, dt }) => ekBeside(EKP.R * s, 0.9, dt, u),
  smaller: ({ tau, s, u, dt }) => ekBeside(EKP.R * s, 0.45, dt, u),
  ball: ({ tau, s, u, dt }) => {
    const R = EKP.R * s, p = [0.12, 0.3 - 0.02 * u, 0.06];
    return { cam: { p, at: [0, -R, 0], fov: 50, near: 0.01, far: 3e6 }, hands: true, you: { show: false }, leo: { where: 'none' }, smoke: false, globeOnly: true };
  },
  leoOn: ({ tau, s, u, dt }) => {
    const T = EK_TOUCH, lx = T[0] + 3.0, lz = T[1] + 1.2;
    return { cam: { p: ekWP(lx + 2.2, lz + 2.6, s, 0.9), at: ekWP(lx, lz, s, 1.2), fov: 50, near: 1e-10, far: 1e-3 * 0 + 30000 * s }, you: { show: false },
      leo: { where: 'world', xz: [lx, lz], pose: EK_P_.lookUp(dt, 2), yaw: 2.2 }, smoke: false, youSky: 1 };
  },
  cupped: ({ tau, s, u, dt }) => { const R = EKP.R * s, p = [0.1, 0.24, 0.05]; return { cam: { p, at: [0, -R, 0], fov: 46, near: 0.01, far: 3e6 }, hands: true, you: { show: false }, leo: { where: 'none' }, smoke: false, globeOnly: true }; },
  question: ({ tau, s, u, dt }) => { const R = EKP.R * s, p = [0.1, 0.24, 0.05]; return { cam: { p, at: [0, -R, 0], fov: 46, near: 0.01, far: 3e6 }, hands: true, you: { show: false }, leo: { where: 'none' }, smoke: false, globeOnly: true }; },
};
// you beside the Earth (radius R, its centre at [0, −R, 0]), holding on to its sunlit side; the camera keeps you both in
// frame (k: how wide your arms are)
function ekBeside(R, k, dt, u) {
  const C = [0, -R, 0], v = ekDirAz(38, 14), L = new THREE.Vector3(-v[0], -v[1], -v[2]), rt = new THREE.Vector3().crossVectors(L, new THREE.Vector3(0, 1, 0)).normalize();
  const rr = new THREE.Vector3(rt.x * 0.82 + v[0] * 0.57, 0, rt.z * 0.82 + v[2] * 0.57).normalize(), d = R + 0.16 + 0.1 * k;
  const chest = [C[0] + rr.x * d, C[1], C[2] + rr.z * d], D = R * 1.7 + 4.6 + 0.3 * u;
  const at = [C[0] + rr.x * (R * 0.42 + 0.35), C[1] + 0.1, C[2] + rr.z * (R * 0.42 + 0.35)];
  return { cam: { p: [at[0] + v[0] * D, at[1] + v[1] * D, at[2] + v[2] * D], at, fov: 46, near: 0.02, far: 3e6 },
    you: ekYou3(EK_P_.embrace(dt, k), { pos: [chest[0], chest[1] - 1.3, chest[2]], yaw: Math.atan2(-rr.x, -rr.z) }), leo: { where: 'none' }, smoke: false, globeOnly: true };
}
const EK_TMP = new THREE.Vector3();
// where your hand came down (world metres): the meadow east along the valley floor
const EK_TOUCH = [1150, -160];
// a label on your palm (where he stands)
function ekPalmLab(set, text, sub = '', a = 1) {
  const v = set.hands.right.g.localToWorld(EK_PALM.clone().add(new THREE.Vector3(0, 0, 0.004)));
  return ekLab([v.x, v.y, v.z], text, sub, a);
}

// the hand keyframes from the shots (ViewerHands blends between them)
(() => {
  const R = EK_HANDS.right, L = EK_HANDS.left, sh = (id) => EK_SHOTS.find((x) => x.id === id);
  const key = (id, rp, lp, d = 0) => { const s = sh(id); R.push([s.t0 + d, rp]); L.push([s.t0 + d, lp]); };
  key('O1', 'pushUp', 'pushUp', 0); key('O1', 'hidden', 'hidden', (sh('O1').t1 - sh('O1').t0) * 0.62);
  key('W3', 'scoop', 'hidden', 0); key('W3', 'palmUp', 'hidden', (sh('W3').t1 - sh('W3').t0) * 0.42);
  key('N1', 'palmUp', 'hidden'); key('N2', 'palmLow', 'hidden'); key('N3', 'hidden', 'hidden'); key('U1', 'palmUp', 'hidden');
  key('H1', 'palmUp', 'hidden'); key('H2', 'palmNear', 'hidden'); key('H3', 'palmNear', 'hidden'); key('Q1', 'palmLow', 'hidden'); key('S1', 'palmUp', 'hidden');
  key('D1', 'palmLow', 'hidden'); key('P1', 'palmLow', 'hidden'); key('A1', 'palmUp', 'hidden'); key('A2', 'palmUp', 'hidden'); key('A3', 'palmUp', 'hidden');
  key('A3', 'flat', 'hidden', (sh('A3').t1 - sh('A3').t0) * 0.35); key('A5', 'flat', 'hidden');
  key('E1', 'hidden', 'hidden'); key('E2', 'grip', 'grip'); key('F1', 'hidden', 'hidden');
  key('B1', 'ball', 'ball'); key('Z1', 'ball', 'ball'); key('Z2', 'cup', 'cup'); key('Z3', 'cup', 'cup');
  R.sort((a, b) => a[0] - b[0]); L.sort((a, b) => a[0] - b[0]);
})();
