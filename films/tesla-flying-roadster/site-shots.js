/* =====================================================================
   SITE SHOTS — the car's motion and the camera for each shot at the test site (shot.mode in shots.js).
   Each: frame(t, shot, app, sh, puffs) poses everything; labels(...) pins words to things; grade(t, p) tweaks.
   Slow motion is a clock: film time → the event's own seconds (τ), so the jets slow down with the car.
   ===================================================================== */

// a piecewise-linear clock: keys [[filmT, rate], …] starting at film time t0 with τ = τ0
function trClock(t0, τ0, keys) {
  return {
    at(t) { let τ = τ0, tt = t0; for (let i = 0; i < keys.length; i++) { const [tk, r] = keys[i], tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity; if (t <= tn) return τ + (t - Math.max(tt, tk)) * r; τ += (tn - Math.max(tt, tk)) * r; tt = tn; } return τ; },
    inv(τt) { let τ = τ0, tt = t0; for (let i = 0; i < keys.length; i++) { const [, r] = keys[i], tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity, τn = τ + (tn - tt) * r; if (τt <= τn) return tt + (τt - τ) / r; τ = τn; tt = tn; } return tt; },
  };
}

// the demo run's clock: real time, slow through the loop and the ceiling, slower in the air, real time after landing
let TR_RUN = null, TR_REPLAY = null;
function trRunClock() {
  if (TR_RUN) return TR_RUN;
  const L0 = TR.go + 0.25, e = TR_DEMO_EXIT, land = TR_DEMO.tLand;
  const tLoop = L0 + 2.4, tAir = tLoop + (e - 2.4) / 0.5, tLand = tAir + (land - e) / 0.62;
  TR_RUN = trClock(L0, 0, [[L0, 1], [tLoop, 0.5], [tAir, 0.62], [tLand, 1]]);
  TR_RUN.tLoop = tLoop; TR_RUN.tAir = tAir; TR_RUN.tLand = tLand;
  // the replay: from 0.7 s before the exit at 0.25× (it leaves the ceiling on "end"), then 0.3×
  const tEnd = trW(3, 'end').start + 0.1;
  TR_REPLAY = trClock(TR.replay, e - (tEnd - TR.replay) * 0.25, [[TR.replay, 0.25], [tEnd, 0.3]]);
  return TR_RUN;
}

// ---- the explainer (sections 3 and 4): the car creeps along the ceiling on its fans, rolls off the end, falls in
//      slow motion, rolls upright on its jets and brakes on the corner jets to land. Its clock T: real time until the
//      drop, 0.075× in the fall, real time again for the braking burst.
let TR_EXC = null;
function trExClock() {
  if (TR_EXC) return TR_EXC;
  TR.brk = TR.rolled + 1.0;
  TR_EXC = trClock(TR.suck, 0, [[TR.suck, 1], [TR.drop, 0.075], [TR.brk, 1]]);
  return TR_EXC;
}
function trExState(T) {
  const C = trExClock(), t = C.inv(T), Td = C.at(TR.drop), Tb = C.at(TR.brk);
  const H = 2 * TR_R + 0.03;
  if (t < TR.drop) {
    // creep: slow at first, then a little faster on "even when it's going slow", the centre at the end on the drop
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

// ---- the hover thought-experiment on the pad
function trHoverState(t) {
  const up = MathX.smooth(t, TR.hover + 0.9, TR.hover + 2.6), h = 1.7 * up + 0.08 * Math.sin((t - TR.hover) * 2.3) * up;
  let y = TR_CG + h, land = -1;
  if (t > TR.empty + 0.25) {
    const u = t - TR.empty - 0.25, y0 = TR_CG + 1.7 + 0.08 * Math.sin((TR.empty + 0.25 - TR.hover) * 2.3);
    y = Math.max(TR_CG, y0 - 0.5 * TR_G * u * u);
    const tl = Math.sqrt(2 * (y0 - TR_CG) / TR_G); land = u - tl;
    if (land > 0) y = TR_CG - 0.14 * Math.exp(-land / 0.2) * Math.sin(land * 20 + 0.2);
  }
  return { c: new THREE.Vector3(TR_PAD.x, y, TR_PAD.z), fwd: new THREE.Vector3(1, 0, 0.0001).normalize(), up0: new THREE.Vector3(0, 1, 0), roll: 0, s: 0, land };
}
// the hover jets: full to lift off, steady, then sputter out on "seconds"
const trHoverK = (t) => (t < TR.hover + 0.6 ? 0 : Math.min(1, (t - TR.hover - 0.6) / 0.25)) * (1 - 0.25 * MathX.smooth(t, TR.hover + 2.4, TR.hover + 3)) * (t < TR.empty ? 1 : Math.max(0, 1 - (t - TR.empty) / 0.35) * (0.6 + 0.4 * Math.sin(t * 60)));

// ---- the kickflip: the approach, up the kicker, a full roll over the five cars (0.7× in the air), the landing ramp
let TR_KC = null;
function trKickClock() {
  if (TR_KC) return TR_KC;
  const K = TR_KICK, L = TR.kick - 1.2, tLaunch = L + (15 + 3.5) / K.v, flight = 2 * K.vy / TR_G;
  TR_KC = trClock(L, 0, [[L, 1], [tLaunch, 0.7], [tLaunch + flight / 0.7, 1]]);
  TR_KC.launchT = (15 + 3.5) / K.v; TR_KC.flight = flight;
  return TR_KC;
}
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

const SITE_SHOTS = {
  // the title: we stand behind the barrier with the crowd; the floodlit curl ramp, the car on the start line
  title: {
    frame(t, shot, app, sh, puffs) {
      trPoseCar(sh.car, trDemo(-1));
      const k = trK(t, 0, TR.hero, Ease.inOutSine);
      trCamD(this.camera, [TR_S0 - trLerp(7.8, 6.8, k), trLerp(1.75, 1.6, k), trLerp(1.1, 0.9, k)], [trLerp(-4, -3, k), trLerp(3.6, 3.4, k), 0], 40, t, 1.0);
      // idle vapour wisps from the corner nozzles (the tanks venting)
      trCarJets(puffs, t, sh.car, () => trDemo(-1), { corner: (tt) => 0.12 + 0.08 * Math.sin(tt * 3) }, { speed: 2, life: 1.6, size: 0.3, grow: 1.2, alpha: 0.18, dt: 1 / 20 });
    },
    grade(t, p) { p.fade = Math.max(p.fade, 1 - MathX.smooth(t, -0.4, 0.5)); },
  },
  // close and low on the car's nose; the vapour hisses on "actually did"
  hero: {
    frame(t, shot, app, sh, puffs) {
      trPoseCar(sh.car, trDemo(-1));
      const k = trK(t, TR.hero, TR.go + 0.25);
      trCamD(this.camera, [TR_S0 + trLerp(5.4, 4.6, k), trLerp(0.5, 0.42, k), trLerp(3.4, 2.7, k)], [TR_S0 + 0.6, 0.62, 0], trLerp(36, 33, k), t, 0.6);
      const hiss = trW(2, 'actually').start;
      trCarJets(puffs, t, sh.car, () => trDemo(-1), { rear: (tt) => tt > hiss ? 0.35 * Math.exp(-(tt - hiss) / 0.5) : 0, corner: (tt) => tt > hiss + 0.15 ? 0.3 * Math.exp(-(tt - hiss - 0.15) / 0.4) : 0.1 }, { speed: 4, life: 1.2, size: 0.18, grow: 1.4, alpha: 0.3, dt: 1 / 40 });
    },
  },
  // ★ the demo run (three set-ups, cut on the phase): the launch, the loop and the ceiling, off the end and the landing
  run: {
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
        trCamD(cam, [trLerp(-6.5, -7.2, k), 1.1, trLerp(8.6, 9.2, k)], [trLerp(1.0, -2.5, k), trLerp(5.0, 6.6, k), 0], 54, t, 0.4);
      } else {
        // C: wide and low as it drops off the end, rolls over in the air and lands
        trCamD(cam, [-7, 2.4, 21], [trLerp(c.x, -14, 0.5), Math.max(1.8, c.y * 0.7 + 0.8), 0], 40, t, 0.6);
      }
      const T0 = (tt) => C.inv(tt);
      // the jets (in the run's own clock): the launch on the rear four, the roll on one side's corners and a fender,
      // the braking burst on all four corners
      const jets = { rear: (x) => trDemo(x).jets.rear || 0, cornerL: (x) => { const j = trDemo(x).jets; return Math.max(j.roll || 0, j.brake ? 0.9 : 0); }, cornerR: (x) => (trDemo(x).jets.brake ? 0.9 : 0), fender: (x) => 0.6 * (trDemo(x).jets.roll || 0) };
      trCarJets(puffs, τ, sh.car, trDemo, jets, { speed: 18, life: 0.7, alpha: 0.5 });
      if (st.landed != null) trRing(puffs, τ, TR_DEMO.tLand - 0.1, TR_DEMO.tLand + 0.6, () => 1, new THREE.Vector3(c.x, 0, 0), { speed: 7, life: 1.6, color: [0.7, 0.66, 0.6], alpha: 0.35 });
    },
    grade(t, p) { const C = trRunClock(); p.shake = 0; },
  },
  // the replay, slowed right down: upside down on the ceiling, then off the end
  replay: {
    frame(t, shot, app, sh, puffs) {
      trRunClock();
      const τ = TR_REPLAY.at(t), st = trDemo(τ);
      trPoseCar(sh.car, st);
      const k = trK(t, TR.replay, TR.plane);
      trCamD(this.camera, [trLerp(-2.0, -5.0, k), 0.9, trLerp(5.6, 6.6, k)], [trLerp(-3.8, -9.0, k), trLerp(7.4, 6.4, k), 0], 46, t, 0.3);
      const jets = { cornerL: (x) => { const j = trDemo(x).jets; return Math.max(j.roll || 0, j.brake ? 0.9 : 0); }, cornerR: (x) => (trDemo(x).jets.brake ? 0.9 : 0), fender: (x) => 0.6 * (trDemo(x).jets.roll || 0) };
      trCarJets(puffs, τ, sh.car, trDemo, jets, { speed: 18, life: 0.7, alpha: 0.5 });
    },
    labels(t, shot, app, sh, cam) {
      const out = [], a = MathX.smooth(t, TR.replay + 0.5, TR.replay + 0.9) * (1 - MathX.smooth(t, trW(3, 'then').start, trW(3, 'then').start + 0.3));
      trLab(out, cam, sh.car.root.position.clone().add(new THREE.Vector3(0, -1.6, 0)), '<span class="d"></span>UPSIDE DOWN<small>ON THE RAMP\'S CEILING</small>', a);
      return out;
    },
    grade(t, p) { p.saturation = 1.0; p.contrast = 1.16; },
  },
  // ---- 3: SUCTION. Under the ceiling; the body turns see-through: the fans, the air they pull out, the pressure
  suck: {
    frame(t, shot, app, sh, puffs) {
      const C = trExClock(), T = C.at(t), st = trExState(T);
      trPoseCar(sh.car, st);
      const car = sh.car, xr = MathX.smooth(t, TR.fans, TR.fans + 0.8) * (1 - MathX.smooth(t, TR.drop - 0.2, TR.drop + 0.3)) + MathX.smooth(t, TR.nozzles - 0.3, TR.nozzles + 0.3) * (1 - MathX.smooth(t, TR.land - 0.4, TR.land));
      car.setXray(xr * 0.9);
      const fan = st.fan ?? 0;
      car.fanSpin(t * 34 * fan, 1.5 * xr * fan);
      // the pressure arrows: on "around it presses harder" the blue ones grow in; the amber ones under the floor stay short
      const pa = MathX.smooth(t, TR.press - 0.2, TR.press + 0.5) * (1 - MathX.smooth(t, TR.leave + 0.6, TR.drop + 0.2));
      sh.press.visible = pa > 0.01;
      sh.outside.forEach((a, i) => { const k = MathX.smooth(pa, i * 0.012, 0.6 + i * 0.012); a.scale.setScalar(0.001 + k); a.position.y = a.userData.y0 ?? (a.userData.y0 = a.position.y); });
      sh.inside.forEach((a, i) => { a.scale.setScalar(0.001 + MathX.smooth(t, TR.press + 0.6 + i * 0.03, TR.press + 1.0 + i * 0.03) * pa); });
      sh.blueM.opacity = sh.ambM.opacity = 1;
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      sh.blueM.emissiveIntensity = 1.4 + 0.4 * pulse;
      // the air pulled out from under the car: streams out of the rear diffuser and the sides
      if (st.onRamp) {
        const k = (tt) => MathX.smooth(tt, TR.fans + 0.2, TR.fans + 1.0) * (1 - MathX.smooth(tt, TR.drop - 0.3, TR.drop));
        for (let j = 0; j < 4; j++) {
          trJet(puffs, t, TR.fans, TR.drop, k, (tb) => {
            const s2 = trExState(C.at(tb));
            return [new THREE.Vector3(s2.c.x + 2.2, 2 * TR_R - 0.18, (j - 1.5) * 0.45), new THREE.Vector3(1, -0.08, (j - 1.5) * 0.25).normalize()];
          }, { speed: 6, life: 0.9, size: 0.08, grow: 0.5, alpha: 0.5, dt: 1 / 60, seed: 40 + j, color: [0.55, 0.78, 1.0], rise: 0 });
        }
      }
      // the camera: under the ceiling, looking up; it orbits slowly; on the drop it follows the fall; in the roll it
      // circles; on the landing it is low on the ground
      const c = st.c, cam = this.camera;
      if (t < TR.leave) {
        const k = trK(t, TR.suck, TR.leave);
        const ang = trLerp(-0.45, 0.3, k), r = trLerp(8.6, 7.6, k);
        trCamD(cam, [c.x + Math.sin(ang) * r, trLerp(3.0, 3.6, k), Math.cos(ang) * r], [c.x, c.y + 0.5, 0], trLerp(46, 42, k), t, 0.25);
      } else if (t < TR.drop + 1.2) {
        const k = trK(t, TR.leave, TR.drop + 1.2);
        trCamD(cam, [trLerp(-4.5, -7.0, k), trLerp(3.4, 3.0, k), trLerp(11.0, 11.6, k)], [trLerp(-7.5, -9.0, k), c.y - 0.3, 0], 46, t, 0.25);
      } else if (t < TR.brk) {
        const k = trK(t, TR.drop + 1.2, TR.brk, (u) => u), ang = trLerp(0.9, -0.8, k);
        trCamD(cam, [c.x + Math.sin(ang) * 8.5, c.y + trLerp(0.4, 1.0, k), Math.cos(ang) * 8.5], [c.x, c.y, 0], 42, t, 0.2);
      } else {
        trCamD(cam, [c.x - 6.5, 0.8, 8.5], [c.x + 0.5, 1.0, 0], 40, t, 0.4);
        cam.position.y += 0.05 * Math.exp(-Math.max(0, t - TR.brk - 0.8) / 0.2) * Math.sin(t * 60) * (t > TR.brk + 0.8 ? 1 : 0);
      }
      // the jets, in the slow clock: one side's corners and a fender roll it; all four corners brake
      const kT = (f) => (x) => f(C.inv(x));
      const roll = (tt) => MathX.smooth(tt, TR.blast, TR.blast + 0.2) * (1 - MathX.smooth(tt, TR.rolled + 0.5, TR.rolled + 0.8));
      const brake = (tt) => MathX.smooth(tt, TR.brk - 0.05, TR.brk + 0.05) * (1 - MathX.smooth(tt, TR.brk + 0.75, TR.brk + 0.9));
      trCarJets(puffs, T, car, trExState, { cornerL: kT((tt) => Math.max(roll(tt), brake(tt))), cornerR: kT(brake), fender: kT((tt) => 0.7 * roll(tt)) },
        { t0: T - 1.5, speed: 16, life: 0.8, alpha: 0.5, dt: 1 / 140 });
      if (t > TR.brk) trRing(puffs, t, TR.brk + 0.2, TR.brk + 0.9, () => 1, new THREE.Vector3(c.x, 0, 0), { speed: 8, life: 1.4, color: [0.82, 0.86, 0.92], alpha: 0.14, per: 3 });
    },
    labels(t, shot, app, sh, cam) {
      const out = [], car = sh.car, M = car.root.matrixWorld;
      const fanA = MathX.smooth(t, trW(9, 'fans').start, trW(9, 'fans').start + 0.3) * (1 - MathX.smooth(t, TR.press - 0.3, TR.press));
      trLab(out, cam, new THREE.Vector3(0.55, 0.17, 0).applyMatrix4(M), '<span class="d"></span>FANS', fanA);
      const pa = MathX.smooth(t, TR.press + 0.3, TR.press + 0.7) * (1 - MathX.smooth(t, TR.tenth - 0.3, TR.tenth));
      trLab(out, cam, new THREE.Vector3(-1.0, 2.8, 1.2).applyMatrix4(M), '<span class="d" style="box-shadow:0 0 0 calc(var(--u) * 3) #6ab4ff"></span>OUTSIDE AIR<small style="color:#9fd0ff">PRESSES HARDER</small>', pa);
      trLab(out, cam, new THREE.Vector3(1.5, 0.05, 0.9).applyMatrix4(M), '<span class="d"></span>UNDER THE CAR<small>THINNER AIR</small>', pa);
      // the nozzles, while they fire in the roll
      const na = MathX.smooth(t, TR.nozzles + 0.2, TR.nozzles + 0.6) * (1 - MathX.smooth(t, TR.blast - 0.2, TR.blast + 0.1));
      [0, 4, 6].forEach((i, k) => trLab(out, cam, car.nozzleWorld(i), k === 0 ? '<span class="d"></span>NOZZLES' : '<span class="d"></span>', na));
      return out;
    },
    grade(t, p) { p.saturation = 1.06; },
  },
  // ---- 5: the hover thought-experiment: it lifts on the four corner jets, the tanks drain, it drops
  hover: {
    frame(t, shot, app, sh, puffs) {
      const st = trHoverState(t);
      trPoseCar(sh.car, st);
      const k = trK(t, TR.hover, TR.heli), c = st.c;
      trCamD(this.camera, [TR_PAD.x + trLerp(4.5, 6.5, k), trLerp(1.0, 1.5, k), TR_PAD.z + trLerp(7.4, 8.4, k)], [TR_PAD.x - 0.4, trLerp(1.6, 1.4, k), TR_PAD.z], 42, t, 0.5);
      if (t > TR.empty + 0.4) this.camera.position.y += 0.05 * Math.exp(-(t - TR.empty - 0.85) / 0.2) * Math.sin(t * 60) * (t > TR.empty + 0.85 ? 1 : 0);
      trCarJets(puffs, t, sh.car, trHoverState, { cornerL: trHoverK, cornerR: trHoverK }, { speed: 14, life: 0.55, alpha: 0.3, size: 0.2, dt: 1 / 90 });
      trRing(puffs, t, TR.hover + 0.6, TR.empty + 0.3, trHoverK, new THREE.Vector3(TR_PAD.x, 0, TR_PAD.z), { speed: 9, life: 1.3, r0: 1.4, color: [0.84, 0.86, 0.9], alpha: 0.055, per: 4 });
    },
    grade(t, p) { },
  },
  // the helicopter, hovering for as long as it likes; the camera pans from it to the Roadster on the pad
  heli: {
    frame(t, shot, app, sh, puffs) {
      const st = trHoverState(t);
      trPoseCar(sh.car, st);
      const k = trK(t, TR.heli, TR.hop, Ease.inOutSine), pan = MathX.smooth(t, TR.bottle - 0.6, TR.bottle + 0.4);
      const at = new THREE.Vector3().lerpVectors(new THREE.Vector3(TR_HELI.x, 4.6, TR_HELI.z), new THREE.Vector3(TR_PAD.x - 1, 1.0, TR_PAD.z), pan * 0.55 + 0.1);
      trCamD(this.camera, [trLerp(-12, -14, k), trLerp(2.2, 1.9, k), trLerp(18, 16.5, k)], [at.x, at.y, at.z], trLerp(44, 40, k), t, 0.5);
      trRing(puffs, t, TR.heli - 2, TR.hop, () => 1, new THREE.Vector3(TR_HELI.x, 0, TR_HELI.z), { speed: 14, life: 1.8, r0: 3, color: [0.62, 0.55, 0.47], alpha: 0.2, per: 8, size: 0.8 });
    },
    labels(t, shot, app, sh, cam) {
      const out = [];
      trLab(out, cam, sh.heli.position.clone().add(new THREE.Vector3(2.5, 2.4, 0)), '<span class="d"></span>HELICOPTER<small>PUSHES THE AIR AROUND IT · HOURS</small>', MathX.smooth(t, trW(16, 'helicopter').start, trW(16, 'helicopter').start + 0.4));
      trLab(out, cam, sh.car.root.position.clone().add(new THREE.Vector3(0.5, 1.4, 0.5)), '<span class="d"></span>ROADSTER<small>CARRIES ITS AIR · SECONDS</small>', MathX.smooth(t, TR.bottle, TR.bottle + 0.4));
      return out;
    },
  },
  // ---- 6: the hop — a full roll over five parked cars
  hop: {
    frame(t, shot, app, sh, puffs) {
      const C = trKickClock(), τ = C.at(t), st = trKickState(τ), K = TR_KICK;
      trPoseCar(sh.car, st);
      const c = st.c, cam = this.camera;
      if (t < TR.kick - 0.4) {
        // the row of cars from beside the lane, the Roadster waiting at the far end, the kicker in front of them
        const k = trK(t, TR.hop, TR.kick - 0.4);
        trCamD(cam, [K.k0 + trLerp(28, 27, k), 1.3, K.z + trLerp(9.5, 8.8, k)], [K.k0 + trLerp(6, 4, k), 1.2, K.z], 40, t, 0.6);
      } else {
        // low at the side of the row: it comes over the top of the cars, rolls and lands
        // (after the launch the camera pans with it and slides along, so the landing stays in frame)
        const fo = MathX.smooth(t, C.inv(C.launchT), C.inv(C.launchT + C.flight) + 1.0);
        trCamD(cam, [K.k0 + 16 + 8 * fo, 0.7, K.z + 10.5], [trLerp(K.k0 + 10, c.x, 0.65 + 0.35 * fo), Math.max(1.4, c.y * 0.75), K.z], 52, t, 0.5);
      }
      const L = C.inv(C.launchT);
      trCarJets(puffs, τ, sh.car, trKickState, { rear: (x) => (x > -0.1 && x < 0.9 ? 0.9 : 0), cornerL: (x) => (x > C.launchT - 0.05 && x < C.launchT + 0.3 ? 1 : 0), cornerR: (x) => (x > C.launchT - 0.05 && x < C.launchT + 0.3 ? 1 : 0) }, { speed: 16, life: 0.7, alpha: 0.5 });
      const land = C.launchT + C.flight;
      if (τ > land) trRing(puffs, τ, land, land + 0.3, () => 1, new THREE.Vector3(K.k0 + 3.5 + K.v * C.flight, 0, K.z), { speed: 6, life: 1.4, color: [0.7, 0.66, 0.6], alpha: 0.3 });
    },
  },
  // the verdict: parked on the pad under the floodlights, the camera circling slowly
  real: {
    frame(t, shot, app, sh, puffs) {
      const st = { c: new THREE.Vector3(TR_PAD.x, TR_CG, TR_PAD.z), fwd: new THREE.Vector3(1, 0, 0), up0: new THREE.Vector3(0, 1, 0), roll: 0, s: 0 };
      trPoseCar(sh.car, st);
      const k = trK(t, TR.real, TR.pov, (u) => u), ang = trLerp(0.5, 1.25, k);
      trCamD(this.camera, [TR_PAD.x + Math.cos(ang) * 6.8, trLerp(1.2, 0.9, k), TR_PAD.z + Math.sin(ang) * 6.8], [TR_PAD.x + 0.3, 0.75, TR_PAD.z], 36, t, 0.3);
      trCarJets(puffs, t, sh.car, () => st, { corner: (tt) => 0.1 }, { speed: 1.5, life: 1.8, size: 0.3, grow: 1, alpha: 0.12, dt: 1 / 15 });
    },
    grade(t, p) { p.exposure = 0.92; p.vignette = 0.66; },
  },
  // ★ the last shot: the passenger seat, up the curl until the ground is overhead
  pov: {
    frame(t, shot, app, sh, puffs) {
      const s = MathX.lerp(-9, TR_LOOP + 3.2, trK(t, TR.pov - 0.2, TR.end - 1.4, (u) => u * u * (3 - 2 * u)));
      const R = trRampAt(s), st = { c: R.p.clone().addScaledVector(R.up, TR_CG), fwd: R.fwd, up0: R.up, roll: 0, s };
      trPoseCar(sh.car, st);
      sh.car.inside(true);
      const M = sh.car.root.matrixWorld, eye = new THREE.Vector3(-0.45, 1.17, 0.36).applyMatrix4(M), look = new THREE.Vector3(6, 0.8, 0.3).applyMatrix4(M);
      const cam = this.camera; cam.position.copy(eye); cam.up.copy(R.up); cam.lookAt(look);
      cam.fov = 62; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    },
    grade(t, p) { },
  },
};
