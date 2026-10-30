/* =====================================================================
   PHYSICS — "What if gravity kept tilting sideways every second and couldn't stop?" Every number the film shows comes
   from here or from the baked rigid-body simulation (simdata.js: your room, the street). Story time s is seconds after
   4:00:00 PM; the angle is θ = floor(s) degrees (the first tick at s = 1; 90° east at s = 90, straight up at 180, west
   at 270, down again at 360, and on). Down keeps its strength (9.81 m/s²). The air and the ground keep their old down.
   Pure functions of s. Units: m, s, kg, degrees for angles named …Deg, radians otherwise.
   ===================================================================== */

const GKP = {
  g: 9.81, w: Math.PI / 180,                     // ω: 1° per second
  t0: GKT.t0,                                    // film t of s = 0
  h0: 16, m0: 0,                                 // 4:00:00 PM
  sunAz: 250, sunAlt: 11,                        // the sun: west-south-west, low (it lights the park from your left)
};
const gkSm = (x, a, b) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const gkLin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
// the angle down has turned (degrees, a whole number: it steps on each second); and a smooth one (for slow things)
const gkDeg = (s) => (s < 1 ? 0 : Math.floor(s + 1e-9));
const gkDegC = (s) => Math.max(0, s);
// down as a unit vector [x, y] in the x–y plane (east, up), for an angle in degrees
const gkDown = (deg) => [Math.sin(deg * Math.PI / 180), -Math.cos(deg * Math.PI / 180)];
// the clock this afternoon
function gkClock(s) { const T = Math.floor(GKP.h0 * 3600 + GKP.m0 * 60 + s), h = Math.floor(T / 3600), m = Math.floor((T % 3600) / 60), sec = T % 60; return { h: h > 12 ? h - 12 : h, m, sec, pm: h >= 12 }; }
function gkSunDir() { const a = GKP.sunAz * Math.PI / 180, e = GKP.sunAlt * Math.PI / 180; return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]; }

// ---------------------------------------------------------------------------------------------------------------------
// THE TICK: each second down jumps 1°, a sideways kick of g·sin 1° = 0.17 m/s². Anything that hangs or sloshes rings
// after it: a damped swing of 1° per tick (period from its length), summed over the last few ticks.
// ---------------------------------------------------------------------------------------------------------------------
function gkRing(s, period, tau = 1.6, n = 6) {
  if (s < 1) return 0;
  const w = 2 * Math.PI / period, k0 = Math.floor(s + 1e-9);
  let a = 0;
  for (let k = k0; k > k0 - n && k >= 1; k--) { const u = s - k; a -= Math.exp(-u / tau) * Math.cos(w * u); }
  return a;                                                      // degrees (lagging behind the new down)
}
const gkTickPulse = (s, d = 0.12) => (s < 1 ? 0 : Math.exp(-(s - Math.floor(s + 1e-9)) / d));   // a jolt envelope each second

// ---------------------------------------------------------------------------------------------------------------------
// THE SIMULATION (simdata.js): a body's pose at story time s. Keyframes [frame, x, y, z, qx, qy, qz, qw], linear between
// ---------------------------------------------------------------------------------------------------------------------
const GK_SIMIDX = {};
function gkSimTrack(world, id) {
  const W = GK_SIM[world], k = world + ':' + id;
  if (GK_SIMIDX[k] == null) { const i = W.ids.indexOf(id); if (i < 0) throw new Error('simdata: no body ' + id + ' in ' + world); GK_SIMIDX[k] = i; }
  return W.tracks[GK_SIMIDX[k]];
}
function gkSimPose(world, id, s, P, Q) {
  const tr = gkSimTrack(world, id), f = (Math.min(s, GK_SIM.end) - GK_SIM.t0) * GK_SIM.hz;
  let a = 0, b = tr.length - 1;
  if (f <= tr[0][0]) { b = 0; } else if (f >= tr[b][0]) { a = b; } else { while (b - a > 1) { const m = (a + b) >> 1; if (tr[m][0] <= f) a = m; else b = m; } }
  const A = tr[a], B = tr[b], u = B[0] > A[0] ? (f - A[0]) / (B[0] - A[0]) : 0;
  P[0] = A[1] + (B[1] - A[1]) * u; P[1] = A[2] + (B[2] - A[2]) * u; P[2] = A[3] + (B[3] - A[3]) * u;
  let d = A[4] * B[4] + A[5] * B[5] + A[6] * B[6] + A[7] * B[7]; const sg = d < 0 ? -1 : 1;
  let qx = A[4] + (sg * B[4] - A[4]) * u, qy = A[5] + (sg * B[5] - A[5]) * u, qz = A[6] + (sg * B[6] - A[6]) * u, qw = A[7] + (sg * B[7] - A[7]) * u;
  const l = Math.hypot(qx, qy, qz, qw) || 1; Q[0] = qx / l; Q[1] = qy / l; Q[2] = qz / l; Q[3] = qw / l;
}
// impacts from the simulation, for the sound and the dust: [s, body, Δv, x, y, z]
const gkSimHits = (world, min = 0) => GK_SIM[world].events.filter((e) => e[2] >= min);
// the first time a body moves (story s), from its track
function gkSimFirst(world, id, d = 0.03) {
  const tr = gkSimTrack(world, id), p = tr[0];
  for (const k of tr) if (Math.hypot(k[1] - p[1], k[2] - p[2], k[3] - p[3]) > d) return k[0] / GK_SIM.hz + GK_SIM.t0;
  return Infinity;
}

// ---------------------------------------------------------------------------------------------------------------------
// HANGING THINGS (the ceiling lamp, the curtains, the swings): they hang along down while down points away from their
// pivot; when it points back past the pivot they fold over and lie against what they hang from.
// gkHang(deg): the angle from straight down (east +), degrees, for a thing hanging under a ceiling
// ---------------------------------------------------------------------------------------------------------------------
function gkHang(s, period = 1.76) {
  const d = gkDeg(s) % 360, r = gkRing(s, period);
  if (d <= 88) return d + r * gkLin(88 - d, 0, 6);
  if (d < 180) return 90;                                       // (lying flat against the ceiling, east of its pivot)
  if (d < 272) return 90 - 180 * gkSm(gkDegC(s) % 360, 180, 184);   // (slides over to the west side as down passes up)
  return d - 360 + r * gkLin(d - 272, 0, 6);
}
// a swing (a pendulum on its chain: it can point anywhere, so it just follows down round the bar, ringing at each tick)
const gkSwing = (s, period = 3.1, phase = 0) => gkDeg(s) + gkRing(s, period, 3.0) * 1.6 + (s < 1 ? 3 * Math.sin(s * 2 * Math.PI / period + phase) : 0);

// the first time after story s0 that a body moves d from where it was at s0 (story s), from its track
function gkSimFirstAfter(world, id, s0, d = 0.05) {
  const tr = gkSimTrack(world, id), P = [0, 0, 0], Q = [0, 0, 0, 1]; gkSimPose(world, id, s0, P, Q);
  for (const k of tr) { const s = k[0] / GK_SIM.hz + GK_SIM.t0; if (s > s0 && Math.hypot(k[1] - P[0], k[2] - P[1], k[3] - P[2]) > d) return s; }
  return Infinity;
}
// the first time after s0 that a body's centre is west of room-local x
function gkSimWestOf(world, id, s0, x) { for (const k of gkSimTrack(world, id)) { const s = k[0] / GK_SIM.hz + GK_SIM.t0; if (s > s0 && k[1] < x) return s; } return Infinity; }
// THE CEILING LAMP: it hangs from the middle of the ceiling; the sofa sliding west along the ceiling smashes it
GK_ROOM.lamp.broken = gkSimWestOf('room', 'sofa', 190, GK_ROOM.lamp.x + 0.45);
// the sofa drops off the ceiling down the west wall (~278 s)
const GK_SOFA_FALL = gkSimFirstAfter('room', 'sofa', 272, 0.05);

// ---------------------------------------------------------------------------------------------------------------------
// FALLING INTO THE SKY. A loose thing falls at its terminal speed vt in still air, in the direction of down, which turns
// at ω: so it goes round a circle of radius R = vt/ω, once every 360 s. Starting from p1 at angle θ1 (degrees ≥ 90,
// when it leaves the ground or what held it): x = x1 + R (cos θ1 − cos θ), y = y1 − R (sin θ − sin θ1). (The lag of a
// heavy thing behind the turning down is ignored here; the simulation has it for the cars.)
// ---------------------------------------------------------------------------------------------------------------------
const GK_R = (vt) => vt / GKP.w;
function gkFly(x1, y1, deg1, vt, deg, out) {
  const R = GK_R(vt), a1 = deg1 * Math.PI / 180, a = deg * Math.PI / 180;
  out[0] = x1 + R * (Math.cos(a1) - Math.cos(a)); out[1] = Math.max(0, y1 - R * (Math.sin(a) - Math.sin(a1)));
  return out;
}
// the heights at 270° (twice R above where each started)
const GK_HIGH = { leaf: 2 * GK_R(1.5), drop: 2 * GK_R(9), car: 2 * GK_R(90) };   // 172 m, 1 km, 10 km

// ---------------------------------------------------------------------------------------------------------------------
// THE POND (x 0, z −52, 34 × 20 m, 0.7 m deep, banks a few cm above the water): level to a few cm, so it spills over
// its east bank at 1°. The water runs east across the grass as a sheet, piles against the east railings and the houses
// beyond (by ~40°), and leaves the ground as drops from 90°: rain going up.
// ---------------------------------------------------------------------------------------------------------------------
const GK_POND = { left: (s) => (s < 1 ? 1 : Math.exp(-(s - 1) / 7.0)), sheetFront: (s) => GK_ST.pond.x + GK_ST.pond.rx + Math.min(70 - GK_ST.pond.x - GK_ST.pond.rx, 0.55 * Math.max(0, s - 1) ** 1.6), lift: [90, 104] };

// ---------------------------------------------------------------------------------------------------------------------
// THE SPIRE (on the church tower, 82 m east of your window): a slender stone needle, a hollow cone 17 m tall on a base
// 2.1 m across, standing on its weight (mortar has almost no grip). A hollow cone's weight acts a third of the way up
// (5.7 m), over a base 1.05 m in radius: it starts to tip when tan θ = 1.05 / 5.7, at 10.5°. It rocks over its east
// edge as a rigid body (I ≈ m (L²/6 + r²) about that edge), slowly at first; each tick leans it 1° more. It comes off
// the tower ~5 s later and falls to the ground beside the nave.
// ---------------------------------------------------------------------------------------------------------------------
const GK_SPIRE = (() => {
  const L = GK_ST.church.spire, r = GK_ST.church.spireR, D = Math.hypot(L / 3, r), k = GKP.g * D / (L * L / 6 + r * r);
  const th0 = Math.atan(r / (L / 3)), s0 = Math.ceil(th0 * 180 / Math.PI), dt = 1 / 240, track = [];
  let ph = 0, w = 0, s = s0;
  for (let n = 0; n < 240 * 15; n++) { track.push(ph); if (ph > 1.25) break; w += k * Math.sin(ph + gkDeg(s) * Math.PI / 180 - th0) * dt; ph += w * dt; s += dt; }
  return { L, r, th0, s0, dt, track, hitS: s0 + (track.length - 1) * dt, go: s0 + track.findIndex((p) => p > 0.05) * dt };
})();
function gkSpireAngle(s) {                                     // its lean (radians, east), from upright
  const S = GK_SPIRE, u = s - S.s0;
  return u <= 0 ? 0 : S.track[Math.min(S.track.length - 1, Math.floor(u / S.dt))];
}

// ---------------------------------------------------------------------------------------------------------------------
// THE BALCONIES on the next block (concrete cantilevers, reinforced at the top, where a balcony hanging down is
// stretched). Turned up, the stretched side is the bottom, which has almost no steel: they crack at the root and fold up,
// then break off and fall into the sky (vt ≈ 110 m/s)
// ---------------------------------------------------------------------------------------------------------------------
const GK_BALC = [];
{ const B = GK_ST.blockB; let i = 0;
  for (const fl of [1, 2, 3]) for (const x of [38, 46, 54, 62, 70]) {
    const go = { '1:46': 149.4, '3:54': 155.2, '2:62': 166.8, '3:38': 171.5 }[fl + ':' + x];
    GK_BALC.push({ i: i++, x, y: fl * 3.1, z: B.z[0], w: 3.0, d: 1.4, go: go || null }); } }
const GK_BALC_FOLD = 2.2;                                         // (s: it hinges up as its top steel yields, then tears off)
function gkBalcony(b, s) {                                     // → { fold (rad, about its root, up), off: [dx, dy, dz], gone }
  if (!b.go || s < b.go) return { fold: 0, off: [0, 0, 0], gone: false };
  const u = s - b.go, F = GK_BALC_FOLD;
  if (u < F) return { fold: 0.6 * gkSm(u, 0, F) ** 1.6, off: [0, 0, 0], gone: false };
  if (!b.fl) b.fl = gkFlight(0, b.y, b.go + F, 110);
  const P = gkFlightAt(b.fl, s), k = Math.min(1, (u - F) / 3);
  return { fold: 0.6 + 1.3 * k, off: [P[0], P[1] - b.y, -1.2 * k], gone: true };
}
// a heavy thing falling from rest at (x1, y1) at story s1 with terminal speed vt: dv/dt = g·down(θ) − (g/vt²)|v|v,
// integrated once (1/120 s steps) and kept at 10 Hz → gkFlightAt(f, s) = [x, y] (never below the ground)
function gkFlight(x1, y1, s1, vt, s2 = 400) {
  const k = GKP.g / (vt * vt), dt = 1 / 120, out = [];
  let x = x1, y = y1, vx = 0, vy = 0;
  for (let n = 0; s1 + n * dt <= s2; n++) {
    const s = s1 + n * dt;
    if (n % 12 === 0) out.push(x, y);
    const d = gkDown(gkDeg(s)), sp = Math.hypot(vx, vy);
    vx += (GKP.g * d[0] - k * sp * vx) * dt; vy += (GKP.g * d[1] - k * sp * vy) * dt;
    x += vx * dt; y += vy * dt; if (y < 0) { y = 0; vy = Math.max(0, vy); }
  }
  return { s1, a: out };
}
function gkFlightAt(f, s) {
  const u = Math.max(0, (s - f.s1) * 10), i = Math.min(f.a.length / 2 - 2, Math.floor(u)), w = Math.min(1, u - i);
  return [f.a[2 * i] + (f.a[2 * i + 2] - f.a[2 * i]) * w, f.a[2 * i + 1] + (f.a[2 * i + 3] - f.a[2 * i + 1]) * w];
}

// ---------------------------------------------------------------------------------------------------------------------
// TREES (rooted: the ground holds them). A trunk is a cantilever: its crown's weight bends it the way down points
// sideways (most at 90° and 270°); with down pointing up the crown hangs from the trunk and pulls it straight
// (tension). Their leaves let go between 15° and 160°
// ---------------------------------------------------------------------------------------------------------------------
function gkTreeBend(s, stiff) { const a = gkDegC(s) * Math.PI / 180; return (0.42 / stiff) * Math.sin(a) + 0.03 * gkRing(s, 2.2, 2.5) * Math.PI / 180; }   // radians, east +

// when each lamp goes out, the TV goes dark, the glass of water is gone (story s, from the simulation: a lamp goes out
// a moment after it starts to fall, as it hits)
const GK_LAMPS = {
  tlamp: gkSimFirst('room', 'tlamp', 0.06) + 0.35,
  flamp: gkSimFirst('room', 'flamp', 0.06) + 0.5,
  tv: gkSimFirst('room', 'tv', 0.06) + 0.5,
  glassGone: gkSimFirst('room', 'glass', 0.3),
};

// THE FOOTBALL on your floor by the window (not in the simulation; it is out of every shot by 104 s): a hollow ball
// (it runs between the pouffe and your heels) rolls once down's slope beats its rolling resistance (about 0.6 % of its weight on a wooden floor: a third of sin 1°), so it sets off on the
// first tick, east, and fetches up against the sideboard. Pure: integrated once here, sampled at 60 Hz.
const GK_BALL = (() => {
  const r = 0.11, x0 = -0.6, z = -1.33, xs = GK_ROOM.bodies.find((b) => b.id === 'sideboard').pos[0] - 0.22 - r, rr = 0.006, dt = 1 / 600, hz = 60;
  const xs60 = [], hits = []; let x = x0, v = 0, n = 0;
  for (let s = 0; s < 104; s += dt, n++) {
    const sn = Math.sin(gkDeg(s) * Math.PI / 180), a = v > 1e-4 ? GKP.g * (sn - rr) / (5 / 3) : Math.max(0, GKP.g * (sn - rr) / (5 / 3));
    v += a * dt; x += v * dt;
    if (x > xs) { x = xs; if (v > 0.05) hits.push([s, v]); v = v > 0.05 ? -0.4 * v : 0; }
    if (n % (600 / hz) === 0) xs60.push(x);
  }
  return { r, x0, z, xs60, hz, hits, end: 104 };
})();
function gkBallX(s) { const B = GK_BALL; if (s <= 0) return B.x0; const f = s * B.hz, i = Math.min(B.xs60.length - 2, Math.floor(f)), u = f - i; return B.xs60[i] + (B.xs60[i + 1] - B.xs60[i]) * u; }

// THE FIRST CAR DOWN: each car's flight carried on past the end of the simulation (it is recorded to 380 s) with the
// same drag (its terminal speed) and the same turning down; the first to reach the ground (≈ 4:07:05, ~6 km west)
const GK_LAND = (() => {
  const G = GKP.g, P = [0, 0, 0], Q = [0, 0, 0, 1], A = [0, 0, 0], B = [0, 0, 0], s0 = GK_SIM.end - 2; let best = { s: Infinity, x: 0, id: '', v: 0 };
  for (const b of GK_ST.bodies) if (b.kind === 'car') {
    gkSimPose('street', b.id, s0 - 0.5, A, Q); gkSimPose('street', b.id, s0 + 0.5, B, Q); gkSimPose('street', b.id, s0, P, Q);
    let x = P[0], y = P[1], vx = B[0] - A[0], vy = B[1] - A[1]; const k = G / (b.vt * b.vt), dt = 1 / 60;
    for (let n = 0, s = s0; n < 60 * 300; n++, s += dt) {
      const th = gkDeg(s) * Math.PI / 180, sp = Math.hypot(vx, vy);
      vx += (G * Math.sin(th) - k * sp * vx) * dt; vy += (-G * Math.cos(th) - k * sp * vy) * dt; x += vx * dt; y += vy * dt;
      if (y <= 0) { if (s < best.s) best = { s, x, id: b.id, v: sp }; break; }
    }
  }
  return best;
})();
