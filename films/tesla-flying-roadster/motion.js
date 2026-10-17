/* =====================================================================
   MOTION — where the Roadster is, as pure functions of time.
     the curl ramp     a half loop (radius TR_R) that carries on as a flat ceiling (length TR_LC) 2·TR_R up, upside down
     trRampAt(s)       the track at arc length s (s < 0: the run-up on the ground): { p, fwd, up }
     trDemo(τ)         the demo run (τ = seconds from the launch), integrated once at load with fixed steps
                       (deterministic): the launch on the rear thrusters, the loop (the speed falls with height:
                       v² = v₀² − 2gh), the ceiling, off the end, the roll on the corner/fender jets, the braking burst,
                       the landing and the roll-out.
   A state is { c (centre of mass), fwd, up0 (up before the roll), roll, jets: {rear, corner, fender, brake} 0…1,
   fan 0…1, s (distance, for the wheels) }. The car's footprint sits TR_CG below its centre of mass.
   Numbers: a ~1.8 t car (Tesla has not published the weight; 4,000+ lb was quoted after the demo), 16 m/s into the
   loop. At the top v ≈ 8.7 m/s, so v²/R ≈ 1.7 g: in this reconstruction speed alone would hold it there, as it does
   for loop-the-loop stunt cars; the fans are what let it go slower (the explainer section shows that).
   ===================================================================== */

const TR_R = 4.6, TR_LC = 8, TR_G = 9.81, TR_CG = 0.55, TR_S0 = -36;
const TR_LOOP = Math.PI * TR_R, TR_TRACK = TR_LOOP + TR_LC;

function trRampAt(s, out = {}) {
  const p = out.p || (out.p = new THREE.Vector3()), fwd = out.fwd || (out.fwd = new THREE.Vector3()), up = out.up || (out.up = new THREE.Vector3());
  if (s < 0) { p.set(s, 0, 0); fwd.set(1, 0, 0); up.set(0, 1, 0); }
  else if (s <= TR_LOOP) { const a = s / TR_R; p.set(TR_R * Math.sin(a), TR_R - TR_R * Math.cos(a), 0); fwd.set(Math.cos(a), Math.sin(a), 0); up.set(-Math.sin(a), Math.cos(a), 0); }
  else { p.set(-(s - TR_LOOP), 2 * TR_R, 0); fwd.set(-1, 0, 0); up.set(0, -1, 0); }
  return { p, fwd, up };
}
const trRampH = (s) => s < 0 ? 0 : s <= TR_LOOP ? TR_R - TR_R * Math.cos(s / TR_R) : 2 * TR_R;

// the demo run, integrated at 480 Hz from τ = 0 (the launch) and stored every step
const TR_DEMO = (() => {
  const dt = 1 / 480, out = [], v0 = 16, A = 24;
  let τ = 0, s = TR_S0, v = 0, phase = 'ground', c = null, vel = null, tAir = 0, roll = 0, tLand = 0, rollOut = 0, vOut = 0, bounce = 0;
  const R = {};
  while (τ < 9) {
    let st;
    if (phase === 'ground') {
      v = Math.min(v0, v + A * dt); s += v * dt;
      if (s >= 0) { phase = 'loop'; }
      trRampAt(s, R);
      st = { c: R.p.clone().addScaledVector(R.up, TR_CG), fwd: R.fwd.clone(), up0: R.up.clone(), roll: 0, jets: { rear: τ < 0.75 ? 1 - τ / 0.75 * 0.4 : Math.max(0, 1 - (τ - 0.75) / 0.2) * 0.6 }, fan: 1, s, v };
    } else if (phase === 'loop') {
      v = Math.sqrt(Math.max(1, v0 * v0 - 2 * TR_G * trRampH(s))); s += v * dt;
      trRampAt(s, R);
      st = { c: R.p.clone().addScaledVector(R.up, TR_CG), fwd: R.fwd.clone(), up0: R.up.clone(), roll: 0, jets: {}, fan: 1, s, v };
      if (s >= TR_TRACK) { phase = 'air'; c = st.c.clone(); vel = R.fwd.clone().multiplyScalar(v); tAir = 0; }
    } else if (phase === 'air') {
      tAir += dt;
      // the roll (half a turn about its own length) on the corner and fender jets, then the braking burst once upright
      const rk = MathX.smooth(tAir, 0.12, 0.95);
      roll = Math.PI * rk;
      const brake = tAir > 0.8 && vel.y < -2.2 ? 1 : 0;
      vel.y += (-TR_G + brake * 2.4 * TR_G) * dt;
      vel.x *= 1 - 0.04 * dt;
      c.addScaledVector(vel, dt); s += vel.length() * dt;
      const rollJet = MathX.smooth(tAir, 0.05, 0.2) * (1 - MathX.smooth(tAir, 0.75, 0.95));
      st = { c: c.clone(), fwd: new THREE.Vector3(-1, 0, 0), up0: new THREE.Vector3(0, -1, 0), roll, jets: { roll: rollJet, brake }, fan: 0.3, s, v: vel.length(), air: true };
      if (c.y - TR_CG <= 0 && tAir > 0.5) { phase = 'out'; tLand = τ; vOut = -vel.x; c.y = TR_CG; bounce = -vel.y; }
    } else {
      // landed: a squat on the suspension (a damped spring), then the roll-out to a stop
      const u = τ - tLand;
      vOut = Math.max(0, vOut - 7 * dt); c.x -= vOut * dt; s += vOut * dt;
      const sq = 0.16 * Math.min(1, bounce / 5) * Math.exp(-u / 0.18) * Math.sin(u * 22 + 0.2);
      st = { c: new THREE.Vector3(c.x, TR_CG - sq, 0), fwd: new THREE.Vector3(-1, 0, 0), up0: new THREE.Vector3(0, 1, 0), roll: 0, jets: { brake: u < 0.08 ? 1 : 0 }, fan: 0, s, v: vOut, landed: u };
    }
    out.push(st); τ += dt;
  }
  out.dt = dt;
  out.tLand = tLand;
  return out;
})();
// the time the car leaves the ceiling (τ)
const TR_DEMO_EXIT = TR_DEMO.findIndex((s) => s.air) * TR_DEMO.dt;

function trDemo(τ) {
  if (τ <= 0) { const R = trRampAt(TR_S0); return { c: R.p.clone().addScaledVector(R.up, TR_CG), fwd: R.fwd.clone(), up0: R.up.clone(), roll: 0, jets: {}, fan: 0, s: TR_S0, v: 0 }; }
  const i = Math.min(TR_DEMO.length - 2, Math.floor(τ / TR_DEMO.dt)), u = τ / TR_DEMO.dt - i, a = TR_DEMO[i], b = TR_DEMO[i + 1];
  return { c: a.c.clone().lerp(b.c, u), fwd: a.fwd.clone().lerp(b.fwd, u).normalize(), up0: a.up0.clone().lerp(b.up0, u).normalize(), roll: MathX.lerp(a.roll, b.roll, u), jets: a.jets, fan: a.fan, s: MathX.lerp(a.s, b.s, u), v: a.v, air: a.air, landed: a.landed };
}

// pose the car from a state (centre of mass, heading, up before the roll, roll)
const _trU = new THREE.Vector3();
function trPoseCar(car, st) {
  _trU.copy(st.up0).applyAxisAngle(st.fwd, st.roll);
  const foot = st.c.clone().addScaledVector(_trU, -TR_CG);
  trPlace(car, foot, st.fwd, st.up0, st.roll);
  // trPlace rolled about the footprint; shift so the roll is about the centre of mass
  car.root.position.copy(st.c).addScaledVector(_trU, -TR_CG);
  car.root.updateMatrixWorld(true);
  car.roll(st.s || 0);
}
