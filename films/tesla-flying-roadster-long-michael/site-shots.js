/* =====================================================================
   SITE SHOTS — the car's motion and the camera for each shot at the test site (shot.mode in shots.js).
   Each: frame(t, shot, app, sh, puffs) poses everything; labels(...) pins words to things; grade(t, p) tweaks;
   cuts() lists the camera cuts inside the mode (for the cut dip).
   Slow motion is a clock: film time → the event's own seconds (τ), so the jets slow down with the car.
   ===================================================================== */

// a piecewise-linear clock: keys [[filmT, rate], …] starting at film time t0 with τ = τ0
function trClock(t0, τ0, keys) {
  return {
    at(t) { let τ = τ0, tt = t0; for (let i = 0; i < keys.length; i++) { const [tk, r] = keys[i], tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity; if (t <= tn) return τ + (t - Math.max(tt, tk)) * r; τ += (tn - Math.max(tt, tk)) * r; tt = tn; } return τ; },
    inv(τt) { let τ = τ0, tt = t0; for (let i = 0; i < keys.length; i++) { const [, r] = keys[i], tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity, τn = τ + (tn - tt) * r; if (τt <= τn) return tt + (τt - τ) / r; τ = τn; tt = tn; } return tt; },
  };
}
// a clock through anchor points [[filmT, τ], …] (linear between them, the end slopes carried on outside)
function trAnchorClock(P) {
  const f = (a, b, x) => { for (let i = 0; i < P.length - 1; i++) if (x <= P[i + 1][a] || i === P.length - 2) { const p = P[i], q = P[i + 1]; return p[b] + (x - p[a]) * (q[b] - p[b]) / (q[a] - p[a]); } };
  return { at: (t) => f(0, 1, t), inv: (τ) => f(1, 0, τ) };
}

// the demo run's τ at its milestones: over the top of the loop, off the end of the ceiling, the landing
const TR_DEMO_TOP = TR_DEMO.findIndex((s) => s.s >= TR_LOOP) * TR_DEMO.dt;

// the demo run's clock: real time, slow through the loop and the ceiling, slower in the air, real time after landing
let TR_RUN = null, TR_REPLAY = null;
function trRunClock() {
  if (TR_RUN) return TR_RUN;
  const L0 = TR.go + 0.25, e = TR_DEMO_EXIT, land = TR_DEMO.tLand;
  const tLoop = L0 + 2.4, tAir = tLoop + (e - 2.4) / 0.5, tLand = tAir + (land - e) / 0.62;
  TR_RUN = trClock(L0, 0, [[L0, 1], [tLoop, 0.5], [tAir, 0.62], [tLand, 1]]);
  TR_RUN.tLoop = tLoop; TR_RUN.tAir = tAir; TR_RUN.tLand = tLand;
  // the replay (clip 6), slowed: climbing on "So", on the ceiling on "ceiling", leaving it on "plane", rolling on "fly"
  TR_REPLAY = trAnchorClock([[TR.replay, TR_DEMO_TOP - 0.75], [trW(6, 'ceiling').start, TR_DEMO_TOP + 0.4], [trW(6, 'plane').start, e - 0.02], [trW(6, 'fly').start, e + 0.5], [TR.three, e + 0.62]]);
  return TR_RUN;
}

// ---- the explainer (sections 4 and 5): the car creeps along the ceiling on its fans, rolls off the end, falls in
//      slow motion (all but frozen while the film cuts away to explain thrust), rolls upright on its jets and brakes on
//      the corner jets to land. Its clock T: real time until the drop, slow in the fall, real time for the burst.
let TR_EXC = null;
function trExClock() {
  if (TR_EXC) return TR_EXC;
  TR_EXC = trClock(TR.suck, 0, [[TR.suck, 1], [TR.drop, 0.075], [TR.newton, 0.004], [TR.blast, 0.055], [TR.brk, 1]]);
  return TR_EXC;
}
function trExState(T) {
  const C = trExClock(), t = C.inv(T), Td = C.at(TR.drop), Tb = C.at(TR.brk);
  const H = 2 * TR_R + 0.03;
  if (t < TR.drop) {
    // creep: barely moving while the fans are explained, then along to the end on "suction needs a surface"
    const xa = -2.2, xb = -3.3, xc = -TR_LC - 0.05;
    const x = t < TR.creep ? MathX.lerp(xa, xb, trK(t, TR.suck, TR.creep, (u) => u)) : MathX.lerp(xb, xc, trK(t, TR.creep, TR.drop, (u) => u * (0.6 + 0.4 * u)));
    return { c: new THREE.Vector3(x, H - TR_CG, 0), fwd: new THREE.Vector3(-1, 0, 0), up0: new THREE.Vector3(0, -1, 0), roll: 0, s: -x * 1.4, fan: 1, onRamp: true };
  }
  const roll = Math.PI * MathX.smooth(t, TR.blast + 0.15, TR.rolled + 0.8);
  if (t < TR.brk) {
    const τ = T - Td;
    return { c: new THREE.Vector3(-TR_LC - 0.05 - 0.9 * τ, H - TR_CG - 0.5 * TR_G * τ * τ, 0), fwd: new THREE.Vector3(-1, 0, 0), up0: new THREE.Vector3(0, -1, 0), roll, s: 11, fan: 0.4 };
  }
  const τb = Tb - Td, yb = H - TR_CG - 0.5 * TR_G * τb * τb, xb = -TR_LC - 0.05 - 0.9 * τb;
  const u = MathX.clamp((t - TR.brk) / 0.8, 0, 1), y = MathX.lerp(yb, TR_CG, 1 - Math.pow(1 - u, 2.2));
  const land = t - TR.brk - 0.8, sq = land > 0 ? 0.12 * Math.exp(-land / 0.2) * Math.sin(land * 20 + 0.3) : 0;
  return { c: new THREE.Vector3(xb - 1.6 * Math.min(u, 1) - (land > 0 ? 0.6 * (1 - Math.exp(-land / 0.4)) : 0), y - sq, 0), fwd: new THREE.Vector3(-1, 0, 0), up0: new THREE.Vector3(0, -1, 0), roll: Math.PI, s: 13, fan: 0, landed: land };
}

// ---- the hover thought-experiment on the pad: parked, lifts off at lift0, hovers, the tanks run dry, it drops
function trHoverState(t) {
  const up = MathX.smooth(t, TR.lift0 + 0.5, TR.lift0 + 2.2), h = 1.7 * up + 0.08 * Math.sin((t - TR.lift0) * 2.3) * up;
  let y = TR_CG + h, land = -1;
  if (t > TR.empty + 0.25) {
    const u = t - TR.empty - 0.25, y0 = TR_CG + 1.7 + 0.08 * Math.sin((TR.empty + 0.25 - TR.lift0) * 2.3);
    y = Math.max(TR_CG, y0 - 0.5 * TR_G * u * u);
    const tl = Math.sqrt(2 * (y0 - TR_CG) / TR_G); land = u - tl;
    if (land > 0) y = TR_CG - 0.14 * Math.exp(-land / 0.2) * Math.sin(land * 20 + 0.2);
  }
  return { c: new THREE.Vector3(TR_PAD.x, y, TR_PAD.z), fwd: new THREE.Vector3(1, 0, 0.0001).normalize(), up0: new THREE.Vector3(0, 1, 0), roll: 0, s: 0, land };
}
// the hover jets: full to lift off, steady, then sputter out on "seconds"
const trHoverK = (t) => (t < TR.lift0 + 0.2 ? 0 : Math.min(1, (t - TR.lift0 - 0.2) / 0.25)) * (1 - 0.25 * MathX.smooth(t, TR.lift0 + 2.4, TR.lift0 + 3)) * (t < TR.empty ? 1 : Math.max(0, 1 - (t - TR.empty) / 0.35) * (0.6 + 0.4 * Math.sin(t * 60)));
// the car parked on the pad, facing +x
const trPadState = (dx = 0) => ({ c: new THREE.Vector3(TR_PAD.x + dx, TR_CG, TR_PAD.z), fwd: new THREE.Vector3(1, 0, 0.0001).normalize(), up0: new THREE.Vector3(0, 1, 0), roll: 0, s: 0 });
// the car parked upside down on the ceiling (the last section)
const trCeilState = (x = -4.2) => ({ c: new THREE.Vector3(x, 2 * TR_R + 0.03 - TR_CG, 0), fwd: new THREE.Vector3(-1, 0, 0), up0: new THREE.Vector3(0, -1, 0), roll: 0, s: 0, fan: 1 });

// ---- the flat ceiling, "what if": it slows on the flat, the fans stop, it falls onto its roof
function trFlatState(t) {
  const H = 2 * TR_R + 0.03 - TR_CG, x0 = -1.0, x1 = -4.6, f = TR.flatFall;
  const x = MathX.lerp(x0, x1, trK(t, TR.flat - 1, f, (u) => u * (2 - u)));
  const st = { c: new THREE.Vector3(x, H, 0), fwd: new THREE.Vector3(-1, 0, 0), up0: new THREE.Vector3(0, -1, 0), roll: 0, s: -x * 1.4, fan: t < f - 0.4 ? 1 : 0 };
  if (t > f) {
    const u = t - f, yRoof = 0.66, tl = Math.sqrt(2 * (H - yRoof) / TR_G);
    st.c.y = H - 0.5 * TR_G * u * u;
    if (u > tl) { const w = u - tl; st.c.y = yRoof - 0.1 * Math.exp(-w / 0.15) * Math.sin(w * 26); st.crash = w; st.roll = 0.06 * (1 - Math.exp(-w / 0.2)); }
  }
  return st;
}

// ---- the kickflip: the approach, up the kicker, a full roll over the five cars (0.7× in the air), the landing ramp
let TR_KC = null;
function trKickClock() {
  if (TR_KC) return TR_KC;
  const K = TR_KICK, L = TR.kick - 1.2, tLaunch = L + (15 + 3.5) / K.v, flight = 2 * K.vy / TR_G;
  TR_KC = trClock(L, 0, [[L, 1], [tLaunch, 0.7], [tLaunch + flight / 0.7, 1]]);
  TR_KC.launchT = (15 + 3.5) / K.v; TR_KC.flight = flight;
  return TR_KC;
}
// the verdict's replays: the cling from "clings", the jump from "jumps", back to the pad on "closed"
function trRealCuts() { return [trW(48, 'clings').start - 0.3, trW(48, 'jumps').start - 0.3, trW(48, 'closed').start - 0.3]; }
function trKickState(τ) {
  const K = TR_KICK, C = trKickClock(), x0 = K.k0 - 15, kick = C.launchT, F = C.flight;
  const s = { fwd: new THREE.Vector3(1, 0, 0), up0: new THREE.Vector3(0, 1, 0), roll: 0, s: 0 };
  if (τ < 0) { s.c = new THREE.Vector3(x0, TR_CG, K.z); return s; }
  if (τ < kick) {
    const x = x0 + K.v * τ, onK = MathX.clamp((x - K.k0) / 3.5, 0, 1), ang = x > K.k0 ? Math.atan2(1, 3.5) : 0;
    s.fwd.set(Math.cos(ang), Math.sin(ang), 0); s.up0.set(-Math.sin(ang), Math.cos(ang), 0);
    s.c = new THREE.Vector3(x, onK * 1.0, K.z).addScaledVector(s.up0, TR_CG); s.s = K.v * τ; return s;
  }
  const u = τ - kick;
  if (u < F) {
    const ang = Math.atan2(1, 3.5) * (1 - MathX.smooth(u, 0, 0.6)) - 0.25 * MathX.smooth(u, F * 0.6, F);
    s.fwd.set(Math.cos(ang), Math.sin(ang), 0); s.up0.set(-Math.sin(ang), Math.cos(ang), 0);
    s.c = new THREE.Vector3(K.k0 + 3.5 + K.v * u, 1.0 + TR_CG + K.vy * u - 0.5 * TR_G * u * u, K.z);
    s.roll = -2 * Math.PI * MathX.smooth(u, 0.18, F - 0.25); s.s = K.v * τ; s.air = u; return s;
  }
  const w = u - F, x = K.k0 + 3.5 + K.v * F + K.v * w - 2.5 * w * w;
  const onR = MathX.clamp(1 - (x - (K.k0 + 25.5)) / 4, 0, 1), ang = x < K.k0 + 29.5 ? -Math.atan2(1, 4) : 0;
  s.fwd.set(Math.cos(ang), Math.sin(ang), 0); s.up0.set(-Math.sin(ang), Math.cos(ang), 0);
  const sq = 0.12 * Math.exp(-w / 0.2) * Math.sin(w * 20 + 0.3);
  s.c = new THREE.Vector3(x, onR * 1.0, K.z).addScaledVector(s.up0, TR_CG - sq); s.s = K.v * τ; s.landed = w; return s;
}

// ---- the camera helpers: a hand-held drift (small, seeded) so locked-off shots still breathe
function trDrift(t, amt = 1, seed = 0) {
  return [amt * 0.05 * (Math.sin(t * 0.63 + seed) + 0.5 * Math.sin(t * 1.37 + seed * 2)), amt * 0.035 * Math.sin(t * 0.81 + seed * 3), amt * 0.04 * Math.sin(t * 0.47 + seed * 5)];
}
function trCamD(cam, p, at, fov, t, amt = 1, roll = 0) { const d = trDrift(t, amt); trCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); }
// the same, but the subject sits off centre: the look point slides `shift` metres to the camera's right (so the
// subject lands left of centre, clear of a panel on the right)
function trCamOff(cam, p, at, fov, t, shift, amt = 1) {
  const d = new THREE.Vector3(at[0] - p[0], 0, at[2] - p[2]).normalize(), r = new THREE.Vector3(-d.z, 0, d.x);
  trCamD(cam, p, [at[0] + r.x * shift, at[1], at[2] + r.z * shift], fov, t, amt);
}
// which of a list of [from, …] set-ups t is in (the last one whose start ≤ t)
const trPhase = (t, starts) => { let i = 0; while (i + 1 < starts.length && t >= starts[i + 1]) i++; return i; };

// a ground ring of dust/vapour pushed out from under a downward jet (centre c, radius grows with age)
function trRing(puffs, t, t0, t1, k, c, o = {}) {
  const dt = o.dt || 1 / 70, life = o.life || 1.4, R0 = o.r0 || 0.5, sp = o.speed || 6, col = o.color || [0.62, 0.55, 0.48];
  for (let i = Math.ceil((Math.max(t0, t - life) - t0) / dt); ; i++) {
    const tb = t0 + i * dt; if (tb > Math.min(t, t1)) break;
    const kb = k(tb); if (kb < 0.02) continue;
    const age = t - tb, u = age / life;
    for (let j = 0; j < (o.per || 5); j++) {
      const a = hash1(i * 17 + j * 3 + (o.seed || 0)) * 6.283, r = R0 + sp * kb * 0.45 * (1 - Math.exp(-age / 0.45)) * (0.7 + 0.6 * hash1(i * 5 + j));
      puffs.add(c.x + Math.cos(a) * r, (o.y || 0.15) + 0.5 * u * (0.5 + hash1(i * 7 + j)), c.z + Math.sin(a) * r, (o.size || 0.5) + 1.8 * u, (o.alpha || 0.28) * kb * Math.pow(1 - u, 1.3) * Math.min(1, age / 0.08), col[0], col[1], col[2]);
    }
  }
}
const trVap = [0.9, 0.94, 1.0];
// a quick pulse 0…1: rises at t0, holds for len, falls
const trBlip = (t, t0, len = 0.25) => MathX.smooth(t, t0, t0 + 0.04) * (1 - MathX.smooth(t, t0 + len, t0 + len + 0.12));
// idle vapour wisps from the corner nozzles (the tanks venting) on a parked car
const trIdleVapour = (puffs, t, car, st) => trCarJets(puffs, t, car, () => st, { corner: (tt) => 0.12 + 0.08 * Math.sin(tt * 3) }, { speed: 2, life: 1.6, size: 0.3, grow: 1.2, alpha: 0.16, dt: 1 / 20 });
// the air pulled out from under a car on its fans (streams out of the diffuser and the sides), following state(tb)
function trFanAir(puffs, t, t0, t1, k, stateAt, o = {}) {
  for (let j = 0; j < 4; j++) {
    trJet(puffs, t, t0, t1, k, (tb) => {
      const s2 = stateAt(tb), up = s2.up0.clone().applyAxisAngle(s2.fwd, s2.roll), side = new THREE.Vector3().crossVectors(s2.fwd, up).normalize();
      const p = s2.c.clone().addScaledVector(s2.fwd, -2.2).addScaledVector(up, -TR_CG + 0.18).addScaledVector(side, (j - 1.5) * 0.45);
      return [p, s2.fwd.clone().multiplyScalar(-1).addScaledVector(up, -0.08).addScaledVector(side, (j - 1.5) * 0.25).normalize()];
    }, Object.assign({ speed: 6, life: 0.9, size: 0.08, grow: 0.5, alpha: 0.5, dt: 1 / 60, seed: 40 + j, color: [0.55, 0.78, 1.0], rise: 0 }, o));
  }
}
// the pressure arrows riding on the car (blue: the outside air pressing; amber: the thinner air under the floor)
function trPressArrows(sh, t, pa, t0) {
  sh.press.visible = pa > 0.01;
  sh.outside.forEach((a, i) => { a.scale.setScalar(0.001 + MathX.smooth(pa, i * 0.012, 0.6 + i * 0.012)); });
  sh.inside.forEach((a, i) => { a.scale.setScalar(0.001 + MathX.smooth(t, t0 + 0.6 + i * 0.03, t0 + 1.0 + i * 0.03) * pa); });
  sh.blueM.opacity = sh.ambM.opacity = 1;
  sh.blueM.emissiveIntensity = 1.4 + 0.2 * (1 + Math.sin(t * 6));
}
const trLabRed = (txt, sub) => `<span class="d" style="background:#ff6a5a;box-shadow:0 0 0 calc(var(--u) * 3) #ff6a5a"></span>${txt}${sub ? `<small>${sub}</small>` : ''}`;
const trLabBlue = (txt, sub) => `<span class="d" style="box-shadow:0 0 0 calc(var(--u) * 3) #6ab4ff"></span>${txt}${sub ? `<small style="color:#9fd0ff">${sub}</small>` : ''}`;
const trLabA = (txt, sub) => `<span class="d"></span>${txt}${sub ? `<small>${sub}</small>` : ''}`;
const trFade = (t, a, b, i = 0.3, o = 0.3) => MathX.smooth(t, a, a + i) * (1 - MathX.smooth(t, b - o, b));

// the route line's clock (shot "did"): how far along the demo's path the drawn line has got, keyed to the words
let TR_ROUTE = null;
function trRouteClock() {
  const e = TR_DEMO_EXIT, land = TR_DEMO.tLand;
  return TR_ROUTE || (TR_ROUTE = trAnchorClock([[trW(4, 'drives').start, 0], [trW(4, 'curls').start + 0.4, TR_DEMO_TOP], [trW(4, 'hangs').start + 0.5, (TR_DEMO_TOP + e) / 2],
    [trW(4, 'lets').start + 0.2, e], [trW(4, 'flips').start + 0.5, e + 0.55], [trW(4, 'lands').start + 0.3, land], [trW(4, 'lands').start + 1.5, land + 1.0]]));
}
// the explainer's camera set-ups (film times)
const trExCuts = () => [TR.fans, TR.press, TR.twoG, TR.tenth, TR.leave, TR.blast, TR.brk];

const SITE_SHOTS = {
  // ---- 1: THE DEMO
  // cold open: low on the car's nose on the start line; on "upside down" the camera rises to find the curl ahead
  cold: {
    frame(t, shot, app, sh, puffs) {
      const st = trDemo(-1); trPoseCar(sh.car, st);
      const k = trK(t, -1, trW(1, 'about').start), k2 = trK(t, trW(1, 'about').start, TR.wide, Ease.inOutCubic);
      const p0 = [TR_S0 + trLerp(5.2, 4.4, k), trLerp(0.45, 0.42, k), trLerp(2.9, 2.5, k)], p1 = [TR_S0 + 1.2, 1.25, 6.2];
      const a0 = [TR_S0 + 0.7, 0.62, 0], a1 = [TR_S0 + 4.5, 1.5, 0];
      trCamD(this.camera, trV(p0, p1, k2), trV(a0, a1, k2), trLerp(34, 42, k2), t, 0.5);
      const hiss = trW(1, 'drive').start;
      trCarJets(puffs, t, sh.car, () => st, { rear: (tt) => tt > hiss ? 0.35 * Math.exp(-(tt - hiss) / 0.5) : 0, corner: (tt) => tt > hiss + 0.15 ? 0.3 * Math.exp(-(tt - hiss - 0.15) / 0.4) : 0.1 }, { speed: 4, life: 1.2, size: 0.18, grow: 1.4, alpha: 0.3, dt: 1 / 40 });
    },
    grade(t, p) { p.fade = Math.max(p.fade, 1 - MathX.smooth(t, -0.4, 0.6)); },
  },
  // the title: behind the barrier with the crowd; the floodlit curl ramp, the car on the start line
  title: {
    frame(t, shot, app, sh, puffs) {
      const st = trDemo(-1); trPoseCar(sh.car, st);
      const k = trK(t, TR.wide, TR.when, Ease.inOutSine);
      trCamD(this.camera, [TR_S0 - trLerp(8.4, 6.8, k), trLerp(1.8, 1.6, k), trLerp(1.4, 0.9, k)], [trLerp(-5, -3, k), trLerp(3.8, 3.4, k), 0], 40, t, 1.0);
      trIdleVapour(puffs, t, sh.car, st);
    },
  },
  // the site from above, at dusk: a slow descending orbit (the date and the place)
  when: {
    frame(t, shot, app, sh, puffs) {
      trPoseCar(sh.car, trDemo(-1));
      const k = trK(t, TR.when, TR.did, (u) => u), a = trLerp(2.35, 1.45, Ease.inOutSine(k)), R = trLerp(46, 30, k);
      trCamD(this.camera, [-12 + Math.cos(a) * R, trLerp(28, 13, Ease.inOutSine(k)), -2 + Math.sin(a) * R], [-10, trLerp(0, 3, k), -3], 40, t, 0.4);
    },
    grade(t, p) { p.exposure = 0.96; },
  },
  // the route, drawn on the words: up the curl, upside down along the ceiling, off the end, the flip, the landing
  did: {
    frame(t, shot, app, sh, puffs) {
      trPoseCar(sh.car, trDemo(-1));
      const land = TR_DEMO.tLand, T = trRouteClock();
      const τ = MathX.clamp(T.at(t), 0, land + 1.0), u = τ / (land + 1.0), R = sh.route, n = R.userData.n;
      R.visible = u > 0.002; R.geometry.setDrawRange(0, Math.floor(u * n) * R.userData.radial * 6);
      R.material.emissiveIntensity = 2.4 + 0.6 * Math.sin(t * 5);
      // the head of the line: a bright puff
      if (u > 0.002 && u < 0.999) { const st = trDemo(τ), up = st.up0.clone().applyAxisAngle(st.fwd, st.roll), p = st.c.clone().addScaledVector(up, 0.75); puffs.add(p.x, p.y, p.z, 0.7, 0.8, 1, 0.8, 0.55); puffs.add(p.x, p.y, p.z, 1.6, 0.25, 1, 0.7, 0.4); }
      const k = trK(t, TR.did, TR.go, Ease.inOutSine);
      trCamD(this.camera, [trLerp(-12, -9, k), trLerp(5.5, 4.8, k), trLerp(33, 29, k)], [trLerp(-11, -8, k), 4.4, 0], 42, t, 0.4);
      trIdleVapour(puffs, t, sh.car, trDemo(-1));
    },
    labels(t, shot, app, sh, cam) {
      const out = [];
      const at = (τ, dy = 1.2) => { const st = trDemo(τ), up = st.up0.clone().applyAxisAngle(st.fwd, st.roll); return st.c.clone().addScaledVector(up, 0.75).add(new THREE.Vector3(0, dy, 0)); };
      const e = TR_DEMO_EXIT, end = TR.go - 0.2;
      trLab(out, cam, at(TR_DEMO_TOP - 0.55, 0.6).add(new THREE.Vector3(1.6, 0, 0)), trLabA('UP THE CURL'), trFade(t, trW(4, 'curls').start, end));
      trLab(out, cam, at((TR_DEMO_TOP + e) / 2, 0.9), trLabA('UPSIDE DOWN', 'ON THE CEILING'), trFade(t, trW(4, 'hangs').start + 0.2, end));
      trLab(out, cam, at(e + 0.45, 0.2).add(new THREE.Vector3(-1.2, 0, 0)), trLabA('LETS GO · FLIPS'), trFade(t, trW(4, 'flips').start, end));
      trLab(out, cam, at(TR_DEMO.tLand, 1.6), trLabA('LANDS'), trFade(t, trW(4, 'lands').start + 0.2, end));
      return out;
    },
  },
  // ★ the demo run (three set-ups, cut on the phase): the launch, the loop and the ceiling, off the end and the landing
  run: {
    cuts() { const C = trRunClock(); return [C.tLoop, C.tAir]; },
    frame(t, shot, app, sh, puffs) {
      const C = trRunClock(), τ = C.at(t), st = trDemo(τ);
      trPoseCar(sh.car, st);
      const cam = this.camera, c = st.c;
      if (t < C.tLoop) {
        // A: low beside the start line, panning as it rockets away on its rear jets
        trCamD(cam, [TR_S0 + 3.5, 0.75, 6.2], [trLerp(TR_S0 + 1.5, c.x + 2, MathX.smooth(t, TR.go, C.tLoop)), 0.8 + 0.3 * MathX.smooth(t, TR.go + 0.5, C.tLoop), 0], trLerp(40, 34, trK(t, TR.go, C.tLoop)), t, 0.5);
        cam.position.y += 0.06 * Math.exp(-Math.max(0, τ) / 0.25) * Math.sin(τ * 70) * (τ > 0 ? 1 : 0);
      } else if (t < C.tAir) {
        // B: from the run-in, under the ceiling, looking up the loop: it climbs, goes over, comes back upside down
        const k = trK(t, C.tLoop, C.tAir);
        trCamD(cam, [trLerp(-4.5, -5.5, k), 1.6, trLerp(13.5, 14.5, k)], [trLerp(0.6, -3.0, k), trLerp(4.6, 7.2, k), 0], 50, t, 0.4);
      } else {
        // C: wide and low as it drops off the end, rolls over in the air and lands, then rolls out
        trCamD(cam, [-7, 2.4, 21], [trLerp(c.x, -14, 0.5), Math.max(1.8, c.y * 0.7 + 0.8), 0], 40, t, 0.6);
      }
      const jets = { rear: (x) => trDemo(x).jets.rear || 0, cornerL: (x) => { const j = trDemo(x).jets; return Math.max(j.roll || 0, j.brake ? 0.9 : 0); }, cornerR: (x) => (trDemo(x).jets.brake ? 0.9 : 0), fender: (x) => 0.6 * (trDemo(x).jets.roll || 0) };
      trCarJets(puffs, τ, sh.car, trDemo, jets, { speed: 18, life: 0.45, alpha: 0.24 });
      if (st.landed != null) trRing(puffs, τ, TR_DEMO.tLand - 0.1, TR_DEMO.tLand + 0.6, () => 1, new THREE.Vector3(c.x, 0, 0), { speed: 7, life: 1.6, color: [0.7, 0.66, 0.6], alpha: 0.35 });
    },
    grade(t, p) { p.shake = 0; },
  },
  // the claims, on the car parked under the lights: the launch, the ten nozzles (x-ray), the fans (from below), 2028
  claims: {
    cuts() { return [trW(5, 'ten').start - 0.25, trW(5, 'fans').start - 0.25, trW(5, 'on').start - 0.25]; },
    frame(t, shot, app, sh, puffs) {
      const st = trPadState(), car = sh.car, P = TR_PAD; trPoseCar(car, st);
      const [c1, c2, c3] = SITE_SHOTS.claims.cuts();
      const cam = this.camera, ph = trPhase(t, [TR.claims, c1, c2, c3]);
      if (ph === 0) {
        const k = trK(t, TR.claims, c1);
        trCamD(cam, [P.x - trLerp(7.0, 5.6, k), trLerp(0.75, 0.6, k), P.z + trLerp(3.2, 4.2, k)], [P.x + 0.3, 0.75, P.z], 38, t, 0.5);
        const z = trW(5, 'second').start;
        trCarJets(puffs, t, car, () => st, { rear: (tt) => 0.8 * trBlip(tt, z, 0.35) }, { speed: 14, life: 0.7, alpha: 0.3, dt: 1 / 80 });
      } else if (ph === 1) {
        const k = trK(t, c1, c2, (u) => u), a = trLerp(0.5, 1.5, k);
        car.setXray(0.9 * MathX.smooth(t, c1, c1 + 0.5));
        for (let i = 0; i < 10; i++) car.fire(i, 0.9 * MathX.smooth(t, c1 + 0.3 + i * 0.09, c1 + 0.45 + i * 0.09));
        trCamD(cam, [P.x + Math.cos(a) * 6.2, trLerp(3.0, 2.4, k), P.z + Math.sin(a) * 6.2], [P.x, 0.6, P.z], 40, t, 0.3);
      } else if (ph === 2) {
        const k = trK(t, c2, c3);
        car.setXray(0.9); car.fanSpin(t * 34, 1.5);
        trCamD(cam, [P.x + trLerp(3.4, 2.4, k), 0.28, P.z + trLerp(4.4, 3.8, k)], [P.x - 0.2, 0.35, P.z], 44, t, 0.25);
        trFanAir(puffs, t, c2, c3 + 1, (tt) => MathX.smooth(tt, c2 + 0.2, c2 + 0.8), () => st);
      } else {
        const k = trK(t, c3, TR.questions);
        trCamD(cam, [P.x + trLerp(6.8, 5.6, k), trLerp(0.9, 2.0, k), P.z + trLerp(4.4, 6.0, k)], [P.x - 0.3, trLerp(0.8, 0.9, k), P.z], 38, t, 0.4);
        trIdleVapour(puffs, t, car, st);
      }
    },
    labels(t, shot, app, sh, cam) {
      const out = [], car = sh.car, M = car.root.matrixWorld, [c1, c2, c3] = SITE_SHOTS.claims.cuts();
      trLab(out, cam, car.nozzleWorld(6).clone().add(new THREE.Vector3(-0.3, 0.6, 0)), trLabA('REAR NOZZLES'), trFade(t, c1 + 0.9, c2));
      trLab(out, cam, car.nozzleWorld(0).clone().add(new THREE.Vector3(0.2, 0.7, 0)), trLabA('CORNER NOZZLES'), trFade(t, c1 + 1.2, c2));
      trLab(out, cam, new THREE.Vector3(0.55, 0.12, 0).applyMatrix4(M), trLabA('FANS', 'UNDER THE FLOOR'), trFade(t, c2 + 0.6, c3));
      return out;
    },
  },
  // the replay, slowed right down: up the loop, upside down on the ceiling, off the end, the roll
  replay: {
    cuts() { return [trW(6, 'plane').start - 0.35]; },
    frame(t, shot, app, sh, puffs) {
      trRunClock();
      const τ = TR_REPLAY.at(t), st = trDemo(τ), c = st.c, cut = SITE_SHOTS.replay.cuts()[0];
      trPoseCar(sh.car, st);
      if (t < cut) {
        // side-on and below, following the car so it stays whole in frame
        const k = trK(t, TR.replay, cut);
        trCamD(this.camera, [c.x + trLerp(3.0, 1.2, k), Math.max(1.2, c.y - 4.6), 13.5], [c.x - 0.6, c.y - 0.6, 0], 40, t, 0.3);
      } else {
        // from the far side, low: it drops off the end and turns over
        const k = trK(t, cut, TR.three);
        trCamD(this.camera, [trLerp(-16, -17.5, k), 1.6, -15], [c.x + 0.5, Math.max(2.5, c.y - 0.8), 0], 44, t, 0.3);
      }
      const jets = { cornerL: (x) => { const j = trDemo(x).jets; return Math.max(j.roll || 0, j.brake ? 0.9 : 0); }, cornerR: (x) => (trDemo(x).jets.brake ? 0.9 : 0), fender: (x) => 0.6 * (trDemo(x).jets.roll || 0) };
      trCarJets(puffs, τ, sh.car, trDemo, jets, { speed: 18, life: 0.45, alpha: 0.24 });
    },
    labels(t, shot, app, sh, cam) {
      const out = [], w = trW(6, 'ceiling').start;
      trLab(out, cam, sh.car.root.position.clone().add(new THREE.Vector3(0, -1.6, 0)), trLabA('UPSIDE DOWN', 'ON THE RAMP\'S CEILING'), trFade(t, w - 0.3, trW(6, 'why').start + 0.3));
      return out;
    },
    grade(t, p) { p.saturation = 1.0; p.contrast = 1.16; },
  },
  // ---- 3: THE LOOP. The real ramp at the loop's speed: the curve alone pins it (slowed down)
  loopspeed: {
    frame(t, shot, app, sh, puffs) {
      const τa = 1.7, r = (TR_DEMO_EXIT - 0.15 - τa) / (TR.flat - TR.numbers), τ = τa + (t - TR.numbers) * r, st = trDemo(τ);
      trPoseCar(sh.car, st);
      const k = trK(t, TR.numbers, TR.flat);
      trCamD(this.camera, [trLerp(4.5, 0.5, k), trLerp(3.6, 4.6, k), trLerp(18, 16.5, k)], [trLerp(1.8, -0.8, k), trLerp(4.2, 5.6, k), 0], 44, t, 0.4);
    },
    labels(t, shot, app, sh, cam) {
      const out = [], τa = 1.7, r = (TR_DEMO_EXIT - 0.15 - τa) / (TR.flat - TR.numbers), tTop = TR.numbers + (TR_DEMO_TOP - τa) / r;
      trLab(out, cam, new THREE.Vector3(1.2, 2 * TR_R - 2.2, 2.2), trLabA('THE CURVE PINS IT', 'ABOUT 25 km/h IS ENOUGH HERE'), trFade(t, tTop - 0.8, TR.flat - 0.2));
      return out;
    },
  },
  // the flat ceiling: it slows along the flat; then, what if the fans stopped? It falls onto its roof
  flat: {
    cuts() { return [TR.flatFall - 1.6]; },
    frame(t, shot, app, sh, puffs) {
      const st = trFlatState(t), car = sh.car, c = st.c, cut = TR.flatFall - 1.6;
      trPoseCar(car, st);
      car.fanSpin(t * 34 * st.fan, 0);
      if (st.fan > 0) trFanAir(puffs, t, TR.flat - 1, TR.flatFall - 0.4, (tt) => (tt < TR.flatFall - 0.4 ? 0.7 : 0), trFlatState, { alpha: 0.35 });
      if (t < cut) {
        const k = trK(t, TR.flat, cut);
        trCamD(this.camera, [trLerp(1.5, -1.5, k), 3.0, trLerp(9.5, 8.5, k)], [c.x - 0.8, c.y - 0.2, 0], 46, t, 0.3);
      } else {
        const k = trK(t, cut, TR.suck);
        trCamD(this.camera, [-1.5, trLerp(3.0, 2.4, k), 16], [c.x - 0.6, Math.max(1.6, c.y * 0.8 + 0.4), 0], 46, t, 0.4);
        if (st.crash != null) this.camera.position.y += 0.08 * Math.exp(-st.crash / 0.25) * Math.sin(st.crash * 55);
      }
      if (st.crash != null) trRing(puffs, t, TR.flatFall + 1.2, TR.flatFall + 1.7, () => 1, new THREE.Vector3(c.x, 0, 0), { speed: 8, life: 1.6, color: [0.7, 0.66, 0.6], alpha: 0.35, per: 6 });
    },
    labels(t, shot, app, sh, cam) {
      const out = [], c = sh.car.root.position;
      trLab(out, cam, new THREE.Vector3(-5, 2 * TR_R + 0.9, 2.1), trLabA('FLAT CEILING', 'NO CURVE'), trFade(t, trW(21, 'flat').start, TR.flatFall - 1.7));
      trLab(out, cam, c.clone().add(new THREE.Vector3(0.6, -1.5, 0)), trLabRed('FANS OFF'), trFade(t, TR.flatFall - 0.5, TR.flatFall + 0.9));
      return out;
    },
  },
  // ---- 4 and 5: SUCTION, then THRUST. Under the ceiling; the body turns see-through: the fans, the air they pull out,
  //      the pressure; it rolls off the end, falls (all but frozen while the film explains thrust), rolls on its jets,
  //      brakes on the corners and lands. Held across shots D1, D5, E2 and E4.
  ex: {
    cuts: trExCuts,
    frame(t, shot, app, sh, puffs) {
      const C = trExClock(), T = C.at(t), st = trExState(T), car = sh.car;
      trPoseCar(car, st);
      const xr = MathX.smooth(t, TR.fans, TR.fans + 0.8) * (1 - MathX.smooth(t, TR.drop - 0.2, TR.drop + 0.3)) + MathX.smooth(t, TR.cold - 0.3, TR.cold + 0.4) * (1 - MathX.smooth(t, TR.land - 0.4, TR.land));
      car.setXray(xr * 0.9);
      sh.tanks.visible = t > TR.cold - 0.3 && t < TR.land;
      sh.tankM.emissiveIntensity = 1.2 + 1.6 * trBlip(t, trW(34, 'tanks').start - 0.1, 1.6);
      const fan = st.fan ?? 0;
      car.fanSpin(t * 34 * fan, 1.5 * xr * fan);
      // the pressure arrows: on "around it pushes harder" the blue ones grow in; the amber ones under the floor stay short
      const pa = MathX.smooth(t, TR.press - 0.2, TR.press + 0.5) * (1 - MathX.smooth(t, TR.leave - 0.2, TR.leave + 0.4)) * (t > TR.old && t < TR.surface ? 0 : 1);
      trPressArrows(sh, t, pa, TR.press);
      if (st.onRamp) trFanAir(puffs, t, TR.fans, TR.drop, (tt) => MathX.smooth(tt, TR.fans + 0.2, TR.fans + 1.0) * (1 - MathX.smooth(tt, TR.drop - 0.3, TR.drop)), (tb) => trExState(C.at(tb)));
      // the nozzles light on their words (rear four, the corners, the two fenders) while it hangs frozen
      const nz = [[trW(35, 'four').start, [6, 7, 8, 9]], [trW(35, 'corner').start - 0.3, [0, 1, 2, 3]], [trW(35, 'two').start, [4, 5]]];
      if (t > TR.nozzles && t < TR.blast) for (const [w, ids] of nz) for (const i of ids) car.fire(i, 0.8 * trFade(t, w, TR.blast, 0.2, 0.2));
      // the camera
      const c = st.c, cam = this.camera;
      if (t < TR.fans) {
        const k = trK(t, TR.suck, TR.fans), a = trLerp(-0.9, -0.6, k);
        trCamD(cam, [c.x + Math.sin(a) * 9.5, 3.2, Math.cos(a) * 9.5], [c.x, c.y - 0.3, 0], 46, t, 0.3);
      } else if (t < TR.press) {
        const k = trK(t, TR.fans, TR.press), a = trLerp(-0.55, -0.2, k), r = trLerp(5.8, 4.4, k);
        trCamD(cam, [c.x + Math.sin(a) * r, trLerp(5.2, 6.0, k), Math.cos(a) * r], [c.x, c.y + 0.1, 0], 44, t, 0.25);
      } else if (t < TR.twoG) {
        const k = trK(t, TR.press, TR.twoG), a = trLerp(0.1, 0.35, k);
        trCamD(cam, [c.x + Math.sin(a) * trLerp(9.5, 10.5, k), trLerp(4.2, 4.6, k), Math.cos(a) * trLerp(9.5, 10.5, k)], [c.x, c.y + 0.2, 0], 44, t, 0.25);
      } else if (t < TR.tenth) {
        // a slow arc underneath: from behind the car round to its side, rising
        const k = trK(t, TR.twoG, TR.tenth, (u) => u), a = trLerp(-1.15, 0.25, k), r = trLerp(7.0, 8.5, k);
        trCamD(cam, [c.x + Math.sin(a) * r, trLerp(1.4, 3.0, k), Math.cos(a) * r], [c.x + 0.3, c.y - 0.2, 0], 42, t, 0.3);
      } else if (t < TR.old) {
        const k = trK(t, TR.tenth, TR.old, (u) => u), a = trLerp(0.6, 1.4, k);
        trCamD(cam, [c.x + Math.sin(a) * 8.0, trLerp(3.6, 4.4, k), Math.cos(a) * 8.0], [c.x, c.y, 0], 42, t, 0.25);
      } else if (t < TR.leave) {
        const k = trK(t, TR.surface, TR.leave);
        trCamD(cam, [c.x + trLerp(3.2, 2.0, k), 3.6, trLerp(10.0, 9.0, k)], [c.x - 0.8, c.y - 0.2, 0], 44, t, 0.3);
      } else if (t < TR.newton) {
        const k = trK(t, TR.leave, TR.newton);
        trCamD(cam, [trLerp(-4.5, -6.5, k), trLerp(3.4, 3.0, k), trLerp(11.0, 11.8, k)], [trLerp(-7.5, -8.8, k), c.y - 0.3, 0], 46, t, 0.25);
      } else if (t < TR.space2) {
        // frozen in mid-air, x-ray: the tanks
        const k = trK(t, TR.cold, TR.space2, (u) => u), a = trLerp(0.7, 1.9, k);
        trCamD(cam, [c.x + Math.sin(a) * 6.4, c.y + trLerp(1.6, 0.6, k), Math.cos(a) * 6.4], [c.x, c.y, 0], 40, t, 0.15);
      } else if (t < TR.blast) {
        // frozen, x-ray: the ten nozzles light on their words
        const k = trK(t, TR.nozzles, TR.blast, (u) => u), a = trLerp(2.3, 3.6, k);
        trCamD(cam, [c.x + Math.sin(a) * 6.0, c.y + trLerp(-0.6, 0.8, k), Math.cos(a) * 6.0], [c.x, c.y, 0], 40, t, 0.15);
      } else if (t < TR.brk) {
        const k = trK(t, TR.blast, TR.brk, (u) => u), ang = trLerp(0.9, -0.8, k);
        trCamD(cam, [c.x + Math.sin(ang) * 8.5, c.y + trLerp(0.4, 1.0, k), Math.cos(ang) * 8.5], [c.x, c.y, 0], 42, t, 0.2);
      } else {
        trCamD(cam, [c.x - 6.5, 0.8, 8.5], [c.x + 0.5, 1.0, 0], 40, t, 0.4);
        cam.position.y += 0.05 * Math.exp(-Math.max(0, t - TR.brk - 0.8) / 0.2) * Math.sin(t * 60) * (t > TR.brk + 0.8 ? 1 : 0);
      }
      // the jets, in the slow clock: one side's corners and a fender roll it, the other side stops the roll; all
      // four corners brake
      const kT = (f) => (x) => f(C.inv(x));
      const roll = (tt) => MathX.smooth(tt, TR.blast, TR.blast + 0.2) * (1 - MathX.smooth(tt, TR.blast + 1.6, TR.blast + 1.9));
      const stop = (tt) => MathX.smooth(tt, TR.rolled - 0.1, TR.rolled + 0.1) * (1 - MathX.smooth(tt, TR.rolled + 1.0, TR.rolled + 1.3));
      const brake = (tt) => MathX.smooth(tt, TR.brk - 0.05, TR.brk + 0.05) * (1 - MathX.smooth(tt, TR.brk + 0.75, TR.brk + 0.9));
      trCarJets(puffs, T, car, trExState, { cornerL: kT((tt) => Math.max(roll(tt), brake(tt))), cornerR: kT((tt) => Math.max(stop(tt), brake(tt))), fender: kT((tt) => 0.7 * roll(tt)) },
        { t0: T - 1.5, speed: 16, life: 0.8, alpha: 0.5, dt: 1 / 140 });
      if (t > TR.brk) trRing(puffs, t, TR.brk + 0.2, TR.brk + 0.9, () => 1, new THREE.Vector3(c.x, 0, 0), { speed: 8, life: 1.4, color: [0.82, 0.86, 0.92], alpha: 0.14, per: 3 });
    },
    labels(t, shot, app, sh, cam) {
      const out = [], car = sh.car, M = car.root.matrixWorld;
      trLab(out, cam, new THREE.Vector3(0.55, 0.17, 0).applyMatrix4(M), trLabA('FANS', 'PULLING THE AIR OUT'), trFade(t, TR.fans + 0.6, TR.press));
      const pa = trFade(t, TR.press + 0.3, trW(24, 'here').start, 0.4, 0.3);
      trLab(out, cam, new THREE.Vector3(-1.0, 2.8, 1.2).applyMatrix4(M), trLabBlue('OUTSIDE AIR', 'PRESSES HARDER'), pa);
      trLab(out, cam, new THREE.Vector3(1.5, 0.05, 0.9).applyMatrix4(M), trLabA('UNDER THE CAR', 'THINNER AIR'), pa);
      trLab(out, cam, new THREE.Vector3(0.0, 2.2, 0).applyMatrix4(M), trLabBlue('THE PUSH THAT WINS', 'INTO THE CEILING'), trFade(t, trW(24, 'here').start, TR.twoG));
      trLab(out, cam, new THREE.Vector3(-0.15, 0.42, 0.78).applyMatrix4(M), trLabBlue('TANKS', 'COMPRESSED AIR'), trFade(t, trW(34, 'tanks').start - 0.1, TR.space2));
      const nz = [[trW(35, 'four').start, 6, 'FOUR AT THE BACK'], [trW(35, 'corner').start - 0.3, 0, 'ONE ON EACH CORNER'], [trW(35, 'two').start, 4, 'TWO ON THE FENDERS']];
      for (const [w, i, txt] of nz) trLab(out, cam, car.nozzleWorld(i), trLabA(txt), trFade(t, w, TR.blast - 0.1, 0.2, 0.2));
      const rollA = trFade(t, TR.blast + 0.1, TR.rolled - 0.2, 0.2, 0.2), stopA = trFade(t, TR.rolled, TR.brk - 0.3, 0.2, 0.2);
      trLab(out, cam, car.root.position.clone().add(new THREE.Vector3(0, 1.8, 0)), trLabA('ONE SIDE FIRES', 'IT ROLLS'), rollA);
      trLab(out, cam, car.root.position.clone().add(new THREE.Vector3(0, 1.8, 0)), trLabA('THE OTHER SIDE', 'THE ROLL STOPS'), stopA);
      trLab(out, cam, car.root.position.clone().add(new THREE.Vector3(0.6, 1.6, 0)), trLabA('ALL FOUR CORNERS', 'SLOW THE FALL'), trFade(t, TR.brk, TR.land + 1.4, 0.15, 0.3));
      return out;
    },
    grade(t, p) { p.saturation = 1.06; },
  },
  // ---- 5: the hover thought-experiment: could it hover? the weight, a nozzle test, it lifts, the tanks drain, it drops
  hover: {
    cuts() { return [TR.weight - 0.2, TR.kilos - 0.2, TR.lift0, trS(42) - 0.3]; },
    frame(t, shot, app, sh, puffs) {
      const st = trHoverState(t), car = sh.car, P = TR_PAD; trPoseCar(car, st);
      const [c1, c2, c3, c4] = SITE_SHOTS.hover.cuts(), cam = this.camera, ph = trPhase(t, [TR.hover, c1, c2, c3, c4]), c = st.c;
      if (ph === 0) {
        const k = trK(t, TR.hover, c1);
        trCamD(cam, [P.x + trLerp(11, 8, k), trLerp(2.6, 1.6, k), P.z + trLerp(10, 7.5, k)], [P.x, 0.9, P.z], 40, t, 0.5);
        trIdleVapour(puffs, t, car, st);
      } else if (ph === 1) {
        // the weight (white, down) and the thrust the jets would need (amber, up), side on
        const k = trK(t, c1, c2);
        trCamD(cam, [P.x + trLerp(0.5, -0.5, k), 1.3, P.z + trLerp(8.5, 7.6, k)], [P.x, 1.2, P.z], 42, t, 0.3);
        const wa = MathX.smooth(t, trW(39, 'car').start, trW(39, 'car').start + 0.5), ta = MathX.smooth(t, trW(39, 'push').start - 0.1, trW(39, 'push').start + 0.6);
        sh.wArrow.visible = wa > 0.01; sh.wArrow.position.set(c.x - 0.7, 3.2, c.z + 1.3); sh.wArrow.rotation.set(Math.PI, 0, 0); sh.wArrow.scale.set(1, 0.01 + 1.9 * wa, 1);
        sh.tArrow.visible = ta > 0.01; sh.tArrow.position.set(c.x + 0.7, 0.05, c.z + 1.3); sh.tArrow.rotation.set(0, 0, 0); sh.tArrow.scale.set(1, 0.01 + 1.9 * ta, 1);
        trIdleVapour(puffs, t, car, st);
      } else if (ph === 2) {
        // close on a corner nozzle: a test burst on "fast"
        const k = trK(t, c2, c3), n = car.nozzleWorld(0);
        trCamD(cam, [n.x + trLerp(3.6, 1.4, k), trLerp(0.9, 0.42, k), n.z + trLerp(3.4, 1.9, k)], [n.x - 0.3, 0.3, n.z], 40, t, 0.2);
        const b = trW(40, 'fast').start - 0.05;
        trCarJets(puffs, t, car, () => st, { cornerL: (tt) => trBlip(tt, b, 0.9) + 0.6 * trBlip(tt, trW(40, 'thirty').start, 1.2) }, { speed: 16, life: 0.6, alpha: 0.4, size: 0.18, dt: 1 / 110 });
      } else {
        if (ph === 3) { const k = trK(t, c3, c4); trCamD(cam, [P.x + trLerp(10.5, 9.5, k), trLerp(1.4, 2.0, k), P.z + trLerp(8.5, 9.5, k)], [P.x - 0.3, trLerp(1.0, 1.8, k), P.z], 40, t, 0.4); }
        else { const k = trK(t, c4, TR.heli); trCamD(cam, [P.x - trLerp(5.5, 6.5, k), trLerp(1.0, 1.4, k), P.z + trLerp(6.8, 7.8, k)], [P.x + 0.4, 1.5, P.z], 42, t, 0.5); }
        if (t > TR.empty + 0.4) cam.position.y += 0.05 * Math.exp(-(t - TR.empty - 0.85) / 0.2) * Math.sin(t * 60) * (t > TR.empty + 0.85 ? 1 : 0);
        trCarJets(puffs, t, car, trHoverState, { cornerL: trHoverK, cornerR: trHoverK }, { speed: 14, life: 0.55, alpha: 0.3, size: 0.2, dt: 1 / 90 });
        trRing(puffs, t, TR.lift0 + 0.2, TR.empty + 0.3, trHoverK, new THREE.Vector3(P.x, 0, P.z), { speed: 9, life: 1.3, r0: 1.4, color: [0.84, 0.86, 0.9], alpha: 0.055, per: 4 });
      }
    },
    labels(t, shot, app, sh, cam) {
      const out = [], [c1, c2] = SITE_SHOTS.hover.cuts(), c = sh.car.root.position;
      trLab(out, cam, new THREE.Vector3(c.x - 0.45, 2.9, c.z + 1.3), trLabA('WEIGHT', '≈ 18 kN'), trFade(t, trW(39, 'car').start + 0.3, c2));
      trLab(out, cam, new THREE.Vector3(c.x + 0.95, 1.75, c.z + 1.3), trLabA('THRUST NEEDED', 'THE SAME, EVERY SECOND'), trFade(t, trW(39, 'push').start + 0.4, c2));
      return out;
    },
  },
  // the helicopter, hovering for as long as it likes: it pulls in air from all around and throws it down
  heli: {
    cuts() { return [trW(43, 'grabs').start - 0.3]; },
    frame(t, shot, app, sh, puffs) {
      const st = trHoverState(t); trPoseCar(sh.car, st);
      const H = sh.heli.position, cut = SITE_SHOTS.heli.cuts()[0], cam = this.camera;
      if (t < cut) {
        const k = trK(t, TR.heli, cut);
        trCamD(cam, [trLerp(-16, -19, k), trLerp(2.2, 3.0, k), trLerp(-2, -5, k)], [H.x, H.y - 1.0, H.z], 40, t, 0.5);
      } else {
        const k = trK(t, cut, TR.bottle);
        trCamD(cam, [trLerp(-24, -26, k), trLerp(6.5, 5.5, k), trLerp(-11, -13, k)], [H.x, H.y - 1.2, H.z], 46, t, 0.4);
      }
      trRing(puffs, t, TR.heli - 2, TR.bottle, () => 1, new THREE.Vector3(TR_HELI.x, 0, TR_HELI.z), { speed: 14, life: 1.8, r0: 3, color: [0.62, 0.55, 0.47], alpha: 0.2, per: 8, size: 0.8 });
      // the air: drawn in from above and all around, through the rotor, thrown down
      const ia = MathX.smooth(t, trW(43, 'throws').start - 0.3, trW(43, 'throws').start + 0.4);
      if (ia > 0.01) for (let i = 0; i < 260; i++) {
        const u = (t * 0.42 + hash1(i * 3.7)) % 1, el = 0.25 + 1.1 * hash1(i * 5.1), az = hash1(i * 9.3) * 6.283, rr = 5 * Math.sqrt(hash1(i * 2.9));
        const far = new THREE.Vector3(H.x + Math.cos(az) * 11 * Math.cos(el), H.y + 1.8 + 11 * Math.sin(el), H.z + Math.sin(az) * 11 * Math.cos(el));
        const disc = new THREE.Vector3(H.x + Math.cos(az) * rr, H.y + 1.78, H.z + Math.sin(az) * rr);
        const p = u < 0.6 ? far.lerp(disc, Math.pow(u / 0.6, 1.6)) : disc.clone().add(new THREE.Vector3(0, -(H.y + 1.6) * ((u - 0.6) / 0.4), 0)).addScaledVector(new THREE.Vector3(Math.cos(az), 0, Math.sin(az)), 1.5 * ((u - 0.6) / 0.4));
        const a = ia * 0.5 * Math.sin(Math.PI * u);
        puffs.add(p.x, p.y, p.z, 0.16 + 0.1 * u, a, 0.55, 0.78, 1.0);
      }
    },
    labels(t, shot, app, sh, cam) {
      const out = [], H = sh.heli.position;
      trLab(out, cam, H.clone().add(new THREE.Vector3(2.5, 2.6, 0)), trLabA('HOVERS ALL DAY'), trFade(t, trW(43, 'hover').start, trW(43, 'it').start));
      trLab(out, cam, H.clone().add(new THREE.Vector3(5.5, 4.5, 2)), trLabBlue('AIR FROM ALL AROUND', 'IT CARRIES NONE'), trFade(t, trW(43, 'grabs').start, trW(43, 'engine').start));
      trLab(out, cam, H.clone().add(new THREE.Vector3(1.5, 2.6, 0)), trLabA('ENGINE', 'RUNS AS LONG AS THERE\'S FUEL'), trFade(t, trW(43, 'engine').start, TR.bottle));
      return out;
    },
  },
  // back on the pad: the Roadster's air is all in its tanks (x-ray); "empty" and they go dark
  bottle: {
    frame(t, shot, app, sh, puffs) {
      const st = trPadState(), car = sh.car, P = TR_PAD; trPoseCar(car, st);
      car.setXray(0.88 * MathX.smooth(t, TR.bottle, TR.bottle + 0.5)); sh.tanks.visible = true;
      const e = trW(44, 'empty').start;
      sh.tankM.emissiveIntensity = trLerp(1.6 + 0.3 * Math.sin(t * 4), 0.04, MathX.smooth(t, e - 0.2, e + 0.5));
      sh.tankM.color.set(t < e + 0.2 ? '#9fc8ff' : '#56606a');
      const k = trK(t, TR.bottle, TR.hop, (u) => u), a = trLerp(0.4, 1.3, k);
      trCamD(this.camera, [P.x + Math.cos(a) * 6.0, trLerp(2.6, 2.0, k), P.z + Math.sin(a) * 6.0], [P.x - 0.2, 0.6, P.z], 40, t, 0.3);
    },
    labels(t, shot, app, sh, cam) {
      const out = [], M = sh.car.root.matrixWorld, e = trW(44, 'empty').start;
      trLab(out, cam, new THREE.Vector3(-0.15, 0.8, 0.9).applyMatrix4(M), t < e ? trLabBlue('ALL ITS AIR', 'IN TANKS') : trLabRed('EMPTY'), trFade(t, trW(44, 'bottle').start - 0.2, TR.hop));
      return out;
    },
    grade(t, p) { p.exposure = 0.95; },
  },
  // ---- the hop: along the row of cars; the Roadster blips its jets on "short, sharp bursts"; a full roll over the cars
  hop: {
    cuts() { return [trW(45, 'hops').start - 0.25, TR.kick - 0.4]; },
    frame(t, shot, app, sh, puffs) {
      const C = trKickClock(), τ = C.at(t), st = trKickState(τ), K = TR_KICK, [c1, c2] = SITE_SHOTS.hop.cuts();
      trPoseCar(sh.car, st);
      const c = st.c, cam = this.camera;
      if (t < c1) {
        // dolly along the row of parked cars
        // the Roadster waiting at the start of the lane, the kicker and the row of cars beyond it
        const k = trK(t, TR.hop, c1, (u) => u);
        trCamD(cam, [K.k0 - 25 + 1.5 * k, trLerp(1.9, 1.6, k), K.z + trLerp(5.5, 4.8, k)], [K.k0 - 8 + 1.0 * k, 0.9, K.z], 42, t, 0.4);
      } else if (t < c2) {
        // low behind the Roadster, down the lane: the kicker, the cars
        const k = trK(t, c1, c2);
        trCamD(cam, [K.k0 - 15 - trLerp(9.0, 8.0, k), trLerp(1.8, 1.5, k), K.z + trLerp(3.2, 2.6, k)], [K.k0 + 6, 1.0, K.z], 42, t, 0.4);
      } else {
        // side-on, tracking: the hop and the flip fill a third of the frame
        trCamD(cam, [c.x + 1.5, 1.3 + 0.35 * Math.max(0, c.y - 1), K.z + 12.5], [c.x + 0.8, Math.max(1.3, c.y * 0.85), K.z], 46, t, 0.25);
      }
      const blips = ['short', 'sharp', 'bursts', 'launch', 'jump', 'flip'].map((w) => trW(45, w).start);
      const bl = (x) => { const tt = C.inv(x); let k = 0; for (const b of blips) k = Math.max(k, trBlip(tt, b, 0.14)); return tt < TR.kick - 1.2 ? k : 0; };
      trCarJets(puffs, τ, sh.car, trKickState, { rear: (x) => (x > -0.1 && x < 0.9 ? 0.9 : 0), cornerL: (x) => Math.max(x > C.launchT - 0.05 && x < C.launchT + 0.3 ? 1 : 0, bl(x)), cornerR: (x) => Math.max(x > C.launchT - 0.05 && x < C.launchT + 0.3 ? 1 : 0, bl(x)) }, { speed: 16, life: 0.7, alpha: 0.5 });
      const land = C.launchT + C.flight;
      if (τ > land) trRing(puffs, τ, land, land + 0.3, () => 1, new THREE.Vector3(K.k0 + 3.5 + K.v * C.flight, 0, K.z), { speed: 6, life: 1.4, color: [0.7, 0.66, 0.6], alpha: 0.3 });
    },
  },
  // ---- 6: the verdict (the car on the left, the panel on the right), then the timeline over the whole site
  real: {
    cuts() { return [TR.promise, TR.timeline, ...trRealCuts()]; },
    frame(t, shot, app, sh, puffs) {
      const cam = this.camera, ph = trPhase(t, [TR.real, TR.promise, TR.timeline]), [r1, r2, r3] = trRealCuts();
      if (t >= r1 && t < r3) {
        // the checklist's evidence: the cling on the ramp, then the jump over the cars, replayed behind the panel
        if (t < r2) {
          trRunClock();
          const τ = TR_REPLAY.at(TR.replay + 0.6 + (t - r1) * 0.9), st = trDemo(τ), c = st.c; trPoseCar(sh.car, st);
          trCamOff(cam, [c.x + 2.0, Math.max(1.2, c.y - 4.6), 14.5], [c.x - 0.6, c.y - 0.6, 0], 42, t, 2.4, 0.2);
        } else {
          const C = trKickClock(), K = TR_KICK, τ = 0.2 + (t - r2) * 0.95, st = trKickState(τ), c = st.c; trPoseCar(sh.car, st);
          trCamOff(cam, [c.x + 1.5, 1.3 + 0.35 * Math.max(0, c.y - 1), K.z + 13], [c.x + 0.8, Math.max(1.3, c.y * 0.85), K.z], 46, t, 2.4, 0.2);
          trCarJets(puffs, τ, sh.car, trKickState, { rear: (x) => (x > 0.1 && x < 0.9 ? 0.9 : 0), cornerL: (x) => (x > C.launchT - 0.05 && x < C.launchT + 0.3 ? 1 : 0), cornerR: (x) => (x > C.launchT - 0.05 && x < C.launchT + 0.3 ? 1 : 0) }, { speed: 16, life: 0.7, alpha: 0.5 });
        }
        return;
      }
      const st = trPadState(), P = TR_PAD; trPoseCar(sh.car, st);
      if (ph === 0) {
        const k = trK(t, TR.real, TR.promise, (u) => u), a = trLerp(-0.3, 0.5, k);
        trCamOff(cam, [P.x + Math.cos(a) * 11.5, trLerp(2.2, 1.7, k), P.z + Math.sin(a) * 11.5], [P.x, 0.9, P.z], 40, t, 2.6, 0.3);
      } else if (ph === 1) {
        const k = trK(t, TR.promise, TR.timeline);
        trCamOff(cam, [P.x + trLerp(7.2, 6.4, k), 0.7, P.z - trLerp(4.0, 3.2, k)], [P.x, 0.8, P.z], 40, t, 2.2, 0.3);
      } else {
        const k = trK(t, TR.timeline, TR.legal);
        trCamD(cam, [trLerp(-4, -8, k), trLerp(12, 10, k), 36], [-14, 1.5, -2], 40, t, 0.3);
      }
      trIdleVapour(puffs, t, sh.car, st);
    },
    grade(t, p) { p.exposure = t < TR.timeline ? 0.92 : 0.78; p.vignette = 0.66; },
  },
  // the FAA: not an aircraft. It drives slowly along the lane, a car that does tricks (a blip of the jets)
  legal: {
    frame(t, shot, app, sh, puffs) {
      const V = 3.2, u = t - TR.legal, x = -54 + V * u, st = { c: new THREE.Vector3(x, TR_CG, 0), fwd: new THREE.Vector3(1, 0, 0.0001).normalize(), up0: new THREE.Vector3(0, 1, 0), roll: 0, s: V * u };
      trPoseCar(sh.car, st);
      // it drives past: from ahead of it round to its side, the camera keeping pace
      const k = trK(t, TR.legal, TR.human, (u) => u), a = trLerp(0.55, -0.25, k);
      trCamD(this.camera, [x + Math.sin(a) * 6.5, trLerp(1.0, 1.4, k), Math.cos(a) * 6.5], [x + 0.4, 0.8, 0], 40, t, 0.25);
      const b = trW(50, 'tricks').start;
      trCarJets(puffs, t, sh.car, (tt) => ({ c: new THREE.Vector3(-54 + 3.2 * (tt - TR.legal), TR_CG, 0), fwd: st.fwd, up0: st.up0, roll: 0 }), { corner: (tt) => trBlip(tt, b, 0.18), rear: (tt) => trBlip(tt, b + 0.1, 0.2) }, { speed: 12, life: 0.7, alpha: 0.4, dt: 1 / 90 });
    },
    grade(t, p) { p.exposure = 0.94; },
  },
  // ---- 7: YOU. The car upside down on the ceiling; the x-ray: a passenger in the harness, the blood, the fans
  human: {
    cuts() { return [trS(52) - 0.2, trW(52, 'harness').start - 0.3, trW(52, 'and').start - 0.2]; },
    frame(t, shot, app, sh, puffs) {
      const st = trCeilState(), car = sh.car, c = st.c, [c1, c2, c3] = SITE_SHOTS.human.cuts();
      trPoseCar(car, st);
      car.fanSpin(t * 34, 0);
      const cam = this.camera, ph = trPhase(t, [TR.human, c1, c2, c3]);
      trFanAir(puffs, t, TR.human - 1, TR.pov, () => 0.6, () => st, { alpha: 0.3 });
      if (ph === 0) {
        const k = trK(t, TR.human, c1);
        trCamD(cam, [c.x + trLerp(6, 4.5, k), trLerp(2.0, 2.6, k), trLerp(9, 7.5, k)], [c.x, c.y - 0.2, 0], 42, t, 0.4);
        return;
      }
      // the x-ray, with the rider inside
      car.setXray(0.86); car.fanSpin(t * 34, 1.2);
      sh.rider.root.visible = true; sh.rider.userData.light.intensity = 5; trPose(sh.rider, t); sh.rider.root.rotation.y = Math.PI / 2;
      sh.harness.visible = t > trW(52, 'harness').start - 0.2;
      const pa = MathX.smooth(t, trW(52, 'air').start - 0.2, trW(52, 'air').start + 0.6);
      trPressArrows(sh, t, pa, trW(52, 'air').start);
      if (ph === 1) {
        const k = trK(t, c1, c2);
        trCamD(cam, [c.x - trLerp(0.2, 0.5, k), 8.25, trLerp(5.4, 4.7, k)], [c.x - 0.45, 8.45, 0.3], 40, t, 0.2);
      } else if (ph === 2) {
        const k = trK(t, c2, c3);
        trCamD(cam, [c.x - trLerp(0.1, 0.3, k), 8.2, trLerp(3.4, 3.0, k)], [c.x - 0.55, 8.3, 0.36], 40, t, 0.15);
      } else {
        const k = trK(t, c3, TR.pov);
        trCamD(cam, [c.x + 1.0, c.y - trLerp(2.4, 3.2, k), trLerp(6.0, 8.0, k)], [c.x - 0.2, c.y + 0.2, 0], 42, t, 0.2);
      }
    },
    labels(t, shot, app, sh, cam) {
      const out = []; if (!sh.rider.root.visible) return out;
      const head = sh.rider.worldOf('head', new THREE.Vector3()), M = sh.car.root.matrixWorld;
      trLab(out, cam, new THREE.Vector3(-0.3, 0.75, 0.62).applyMatrix4(M), trLabA('THE HARNESS', 'HOLDS YOU, NOT THE SEAT'), trFade(t, trW(52, 'harness').start, trW(52, 'blood').start - 0.1));
      trLab(out, cam, head.clone().add(new THREE.Vector3(0.2, -0.25, 0.3)), trLabRed('BLOOD', 'HEADS FOR YOUR HEAD'), trFade(t, trW(52, 'blood').start, trW(52, 'and').start + 0.3));
      trLab(out, cam, new THREE.Vector3(0.0, 2.4, 0).applyMatrix4(M), trLabBlue('AIR PRESSURE', 'AND A FEW FANS'), trFade(t, trW(52, 'air').start + 0.2, TR.pov));
      return out;
    },
  },
  // ★ the last shot: the passenger seat, up the curl until the ground is overhead
  pov: {
    frame(t, shot, app, sh, puffs) {
      const s = MathX.lerp(-9, TR_LOOP + 3.2, trK(t, TR.pov - 0.2, TR.pov + 2.7, (u) => u * u * (3 - 2 * u)));
      const R = trRampAt(s), st = { c: R.p.clone().addScaledVector(R.up, TR_CG), fwd: R.fwd, up0: R.up, roll: 0, s };
      trPoseCar(sh.car, st);
      sh.car.inside(true);
      const M = sh.car.root.matrixWorld, eye = new THREE.Vector3(-0.45, 1.17, 0.36).applyMatrix4(M), look = new THREE.Vector3(6, 0.8, 0.3).applyMatrix4(M);
      const cam = this.camera; cam.position.copy(eye); cam.up.copy(R.up); cam.lookAt(look);
      cam.fov = 62; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    },
    grade(t, p) { p.exposure = (p.exposure ?? 1) * 1.35; },
  },
};
