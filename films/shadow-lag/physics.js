/* =====================================================================
   PHYSICS — every number on screen, and everything that moves, as a pure function of story time s (clock.js).
     SHP    the numbers: light's trip from the lamp to the floor, the lag, your speeds, the Earth's spin and orbit
     SHE    the story's moments (placed from the caption times, so they move with the edit)
     SHY    you: where you are and how you're moving (walk, stand, run, jump, in your car), what your hands do
     SHG    the night guard (his path, his torch)
     SHC    your car (level 4, level 2, the exit lane)
     shLampOn(i, s)  which lamps are lit (the failing tube; half of them off at midnight)
   THE RULE: your shadow (anywhere your body stops light reaching) is your body as it was exactly 1 story second ago.
   Light, reflections and everyone else's shadows are on time. So the film draws you twice: your body (seen, casting no
   shadow) at s, and an invisible copy of you (casting the shadow, never seen) at s − 1.
   ===================================================================== */

const SHP = (() => {
  const c = 299792458, P = { c, lag: 1.0, lampH: SH_F.lampY };
  P.lightS = P.lampH / c;                               // the lamp-to-floor trip: 9.0 ns
  P.lightNs = P.lightS * 1e9;
  P.ratio = P.lag / P.lightS;                           // 1 s / 9 ns: 111 million
  P.walk = 1.4; P.run = 5.0;                            // m/s (cruise speeds of the walk and the run below)
  P.rampKmh = 25; P.ramp = P.rampKmh / 3.6;             // 6.94 m/s
  P.limitKmh = 5 * 1.609344;                            // the sign: 5 mph = 8.05 km/h
  P.overLimit = P.rampKmh / P.limitKmh;                 // 3.1×
  P.spin = 465.1 * Math.cos(SH_LAT);                    // the Earth's spin carries you east at 282 m/s at 52.6° N
  P.orbitKms = 29.78;                                   // the Earth's orbit round the Sun, km/s
  P.cctvKmh = 20; P.cctv = P.cctvKmh / 3.6;             // level 2
  P.people = 8.2e9;                                     // people on Earth, late 2026 (UN estimate, rounded)
  return P;
})();

// ---------------------------------------------------------------------------------------------------------------------
// MOVERS — a path as legs [s0, s1, [[x, z], …], ramp] (a trapezoid speed profile along the polyline: up to speed in
// `ramp` s, cruise, down again; between legs the mover stands). pos(s) → [x, z]; dist(s) → metres walked so far;
// speed(s); dir(s) → the travel direction's yaw (the rig faces +z at yaw 0).
// ---------------------------------------------------------------------------------------------------------------------
function shMover(x0, z0, legs) {
  let x = x0, z = z0, D = 0;
  const L = legs.map(([s0, s1, pts, ramp = 0.5]) => {
    const P = [[x, z], ...pts], cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const len = cum[cum.length - 1], T = s1 - s0, a = Math.min(ramp, T / 2), v = len / Math.max(1e-6, T - a);
    const leg = { s0, s1, P, cum, len, T, a, v, D0: D };
    x = P[P.length - 1][0]; z = P[P.length - 1][1]; D += len;
    return leg;
  });
  const along = (g, s) => { const u = MathX.clamp(s - g.s0, 0, g.T), a = g.a, v = g.v; if (u < a) return 0.5 * v * u * u / a; if (u < g.T - a) return v * (u - a / 2); return g.len - 0.5 * v * (g.T - u) * (g.T - u) / a; };
  const legAt = (s) => { let g = null; for (const q of L) if (s >= q.s0) g = q; return g; };
  const point = (g, d) => { let i = 1; while (i < g.cum.length - 1 && g.cum[i] < d) i++; const A = g.P[i - 1], B = g.P[i], k = (d - g.cum[i - 1]) / Math.max(1e-9, g.cum[i] - g.cum[i - 1]); return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, Math.atan2(B[0] - A[0], B[1] - A[1])]; };
  const M = {
    legs: L,
    pos(s) { const g = legAt(s); if (!g) return [x0, z0]; const p = point(g, along(g, s)); return [p[0], p[1]]; },
    dist(s) { const g = legAt(s); return g ? g.D0 + along(g, s) : 0; },
    speed(s) { const h = 0.02; return Math.abs(M.dist(s + h) - M.dist(s - h)) / (2 * h); },
    dir(s) { const g = legAt(s); if (!g) return 0; return point(g, Math.min(g.len - 1e-4, along(g, s) + 0.05))[2]; },
    moving(s) { const g = legAt(s); return !!g && s < g.s1; },
  };
  return M;
}
// yaw keys [[s, yaw], …] → smooth yaw at s (each step eased; angles may run past ±π: write them unwrapped)
function shYawKeys(K, s) {
  if (s <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (s < K[i][0]) { const [s0, a] = K[i - 1], [s1, b] = K[i], u = (s - s0) / (s1 - s0); return a + (b - a) * (u * u * (3 - 2 * u)); }
  return K[K.length - 1][1];
}
// a 0 → 1 → 0 window with eased edges (story time)
const shBump = (s, a, b, fi = 0.3, fo = 0.3) => MathX.smooth(s, a - fi, a) * (1 - MathX.smooth(s, b, b + fo));
const shYawTo = (x0, z0, x1, z1) => Math.atan2(x1 - x0, z1 - z0);

// ---------------------------------------------------------------------------------------------------------------------
// THE STORY'S MOMENTS (story s), from the captions (clock.js shSC: the story time when a caption comes up)
// ---------------------------------------------------------------------------------------------------------------------
// the run to your car: from behind the pillar, out across the aisle, to its driver's door (it's nose-in to the north
// wall; its right side faces east)
const SH_RUN = (() => { const C = SH_F.car, door = [C.x + 1.45, C.z + 0.95], P = [[SH_F.hide[0] + 0.03, SH_F.hide[1]], [2.0, -7.4], [13.6, -9.4], [C.x + 1.6, -10.6], door];
  let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return { P, door, len: L }; })();

const SHE = (() => {
  const E = {};
  E.step = 0.15;                                         // you step out of the door (the rule began at s = 0)
  E.atWall = 8.2;                                        // at the white wall
  E.lookBack = [-99, -98];                               // (unused)
  E.lookUp = [shSC('light', 1, -1.2), shSC('light', 2, 0.6)];   // up at the lamp
  E.face = shSC('light', 3, 1.4);                        // you turn to face the wall
  E.hand = shSC('hand', 1, -1.6);                        // your right hand goes up (0.45 s: up as "Its shadow waits" comes up), held, down
  E.handDown = shSC('hand', 2, 2.4);
  E.phone = shSC('film', 0, -0.7);                       // the phone comes up (filming the wall)
  E.wave = shSC('film', 1, -0.6);                        // a wave of the left hand, for the camera
  E.phoneDown = shSC('walk', 0, -2.0);
  E.stop = shSC('stop', 1, -2.6);                        // you stop (the shadow arrives 1 s later, just after "It walks right into you")
  E.walk0 = E.stop - (11.8 / SHP.walk + 0.5);            // so the walk along the wall cruises at exactly 1.4 m/s
  E.turn = shSC('turn', 0, 0.12);                        // you turn round (0.55 s)
  E.turnBack = shSC('jump', 1, 4.2);
  E.jump = shSC('jump', 1, -2.7);                        // take-off (crouch 0.25 s before; 0.45 s up); the shadow's just after jump:1
  E.walk1 = E.turnBack + 0.8;                            // on toward the mirror
  E.atMirror = E.walk1 + 9.9 / 1.4 + 0.5;
  E.walk2 = Math.max(shSC('lamps', 0, -2.0), E.atMirror + 0.3);   // on down the aisle (the four lamps)
  E.walk3 = shSC('impossible', 0, -0.4);                 // to the parapet
  E.atParapet = E.walk3 + 9.4;
  E.mid = SH_MIDNIGHT_S;                                 // 12:00:00 AM: half the lamps go off
  E.guardIn = shSC('steps', 0, -4.6);                    // the guard opens the stair door (his footsteps)
  E.react = shSC('steps', 0, -0.8);                      // you turn to the sound
  E.hidden = shSC('hide', 1, -0.6);                      // you're behind the pillar (your shadow 1 s later)
  E.hide0 = E.hidden - 5.4;
  E.shuffle = shSC('still', 1, -0.6);                    // a last half-step back against the pillar; then still
  E.guardSeen = shSC('guard', 0, -0.4);                  // he walks into view
  E.torchOn = shSC('guard', 1, -0.5);                    // his torch finds you
  E.shield = shSC('guard', 2, 0.1);                      // you shield your eyes (your shadow: 1 s later)
  E.shieldDown = shSC('seen', 1, 0.5);
  E.recoil = shSC('seen', 0, 0.1);                       // he steps back
  E.radio = shSC('radio', 0, -0.6);
  E.run = shSC('run', 0, 1.2);                           // you run (your shadow: 1 s later)
  E.atCar = E.run + SH_RUN.len / SHP.run + 0.6;          // at your car's door (cruising at 5 m/s)
  E.sit = E.atCar + 0.7;                                 // in the seat (1 s)
  E.doorShut = E.sit + 1.2;
  E.lock = shSC('lock', 0, 0.35);
  E.engine = E.lock + 0.9;
  E.reverse = [shSC('car', 0, -1.8), shSC('car', 0, 1.6)];   // out of the bay
  E.ramp = shSC('speed', 0, 0.35);                       // the car reaches the top of the ramp at 25 km/h…
  { const d = SH_F.ramp.x[0] - (SH_F.car.x - 5.8), v = SHP.ramp; E.go = E.ramp - (d / v + v / (2 * 2.2)); }   // …from rest at 2.2 m/s²
  E.cctv = shSC('cctv', 1, 0.15);                        // level 2: the car passes the camera's centre line
  E.exitStop = shSC('exit', 1, -2.6);                    // the car stops at the barrier (your shadow: just before exit:1)
  E.rise = [shSC('exit', 2, 2.4), shSC('question', 0, -0.3)];   // the shadow rising behind your seat
  return E;
})();

// ---------------------------------------------------------------------------------------------------------------------
// YOU (on foot until you sit in your car). pos(s), dist(s), yaw(s), lift (the jump), and the gestures.
// ---------------------------------------------------------------------------------------------------------------------
const SHY = (() => {
  const E = SHE, F = SH_F, Wz = -6.1;                    // your line along the white wall (1.1 m off it)
  const door = [-38.25, -8.2], wall0 = [-32.2, Wz], stopX = wall0[0] + 11.8, mirror = [stopX + 9.9, Wz];
  const lamps = [-3.0, -7.6], parapet = [-1.2, -16.05], car = SH_F.car;
  const carDoor = SH_RUN.door;
  const legs = [
    [E.step, E.atWall, [[-36.6, -7.9], [-34.0, -6.6], wall0], 0.9],
    [E.walk0, E.stop, [[stopX, Wz]], 0.5],
    [E.walk1, E.atMirror, [mirror], 0.5],
    [E.walk2, E.walk2 + 6.6, [lamps], 0.6],
    [E.walk3, E.atParapet, [[-2.0, -11.5], parapet], 0.8],
    [E.hide0, E.hidden, [[-0.6, -10.2], [0.55, -6.2], [0.9, -4.7], [F.hide[0], F.hide[1] - 0.1]], 0.7],
    [E.shuffle, E.shuffle + 0.6, [[F.hide[0] + 0.03, F.hide[1]]], 0.25],
    [E.run, E.atCar, SH_RUN.P.slice(1), 0.6],
  ];
  const M = shMover(-40.3, -8.2, [[-2.3, -0.9, [door], 0.4], ...legs]);
  const E2 = Math.PI / 2;
  // which way you face (unwrapped radians; the rig faces +z at 0: east = π/2, north = π, west = −π/2, south = 0)
  const yawK = [
    [-9, E2], [E.step + 0.4, shYawTo(door[0], door[1], -34.0, -6.6)], [E.atWall - 1.2, E2],
    [E.face - 0.6, E2], [E.face + 0.3, 0.12], [E.walk0 - 0.6, 0.12], [E.walk0 + 0.1, E2],
    [E.turn, E2], [E.turn + 0.55, E2 + Math.PI],                   // turning round, through north (the aisle)
    [E.turnBack, E2 + Math.PI], [E.turnBack + 0.7, E2],
    [E.walk2, E2], [E.walk2 + 0.6, shYawTo(mirror[0], mirror[1], lamps[0], lamps[1])], [E.walk2 + 6.0, shYawTo(mirror[0], mirror[1], lamps[0], lamps[1])], [E.walk2 + 7.0, E2 + 0.3],
    [E.walk3, E2 + 0.3], [E.walk3 + 0.7, Math.PI], [E.atParapet + 0.5, Math.PI],
    [E.react, Math.PI], [E.react + 0.7, Math.PI + 1.25],              // toward the footsteps (west)
    [E.hide0 + 0.4, Math.PI + 1.25], [E.hide0 + 1.2, 2 * Math.PI + 0.12], [E.hidden - 0.8, 2 * Math.PI + 0.25], [E.hidden + 0.4, 2 * Math.PI - 1.1],   // to the pillar; back to it, facing west-ish
    [E.torchOn + 0.6, 2 * Math.PI - 1.1], [E.torchOn + 1.3, 2 * Math.PI - 1.35],
    [E.run - 0.2, 2 * Math.PI - 1.35], [E.run + 0.4, 2 * Math.PI + E2 - 0.35], [E.run + 1.6, 2 * Math.PI + E2], [E.atCar - 1.2, 2 * Math.PI + E2 - 0.5], [E.atCar, 2 * Math.PI + Math.PI - 0.15],
  ];
  const Y = {
    M, door, wall0, stopX, mirror, lamps, parapet, carDoor,
    pos: M.pos, dist: M.dist, speed: M.speed,
    yaw: (s) => shYawKeys(yawK, s),
    // the jump: 0.45 s in the air, 0.25 m up
    lift: (s) => { const u = (s - E.jump) / 0.45; return u > 0 && u < 1 ? 0.25 * 4 * u * (1 - u) : 0; },
    crouch: (s) => Math.max(shBump(s, E.jump - 0.22, E.jump - 0.02, 0.18, 0.05), shBump(s, E.jump + 0.47, E.jump + 0.6, 0.04, 0.3)),
    inCar: (s) => s >= E.sit,
    seatK: (s) => MathX.smooth(s, E.sit - 0.6, E.sit + 0.4),     // getting in (0 → 1)
    // gestures (0…1 weights): your right hand up (the hand test), the phone (filming), the left hand's wave, shielding
    // your eyes from the torch, looking back / up (head)
    hand: (s) => shBump(s, E.hand + 0.45, E.handDown, 0.45, 0.5),
    phone: (s) => shBump(s, E.phone + 0.6, E.phoneDown, 0.6, 0.6),
    wave: (s) => shBump(s, E.wave, E.wave + 1.5, 0.2, 0.3) * Math.sin(Math.max(0, s - E.wave) * 9),
    shield: (s) => shBump(s, E.shield + 0.35, E.shieldDown, 0.35, 0.6),
    lookBack: (s) => shBump(s, E.lookBack[0] + 0.5, E.lookBack[1], 0.5, 0.6),
    lookUp: (s) => shBump(s, E.lookUp[0] + 0.6, E.lookUp[1], 0.6, 0.7),
    lookDown: (s) => shBump(s, E.lookUp[1] + 0.8, E.face - 0.4, 0.6, 0.5) + 0.6 * shBump(s, E.atWall - 1, E.lookBack[0], 0.6, 0.5),
    lookOut: (s) => shBump(s, E.atParapet, E.react, 0.6, 0.4),
  };
  return Y;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE NIGHT GUARD: in through the stair door after midnight, along the aisle with his torch, toward the noise
// ---------------------------------------------------------------------------------------------------------------------
const SHG = (() => {
  const E = SHE, stand = [-2.6, -8.1];
  // (he waits by the plant room, listening, then walks on at a steady pace, timed so that he passes x = −7.8 (where his
  // shadow reaches the floor by your pillar) just before "That one hasn't" comes up)
  const legsFrom = (ta) => [
    [E.guardIn + 0.6, E.guardIn + 21, [[-36.8, -8.3], [-18.5, -8.6]], 0.8],
    [ta, E.guardSeen + 3.0, [[-6.5, -8.3], stand], 0.8],
    [E.recoil, E.recoil + 0.7, [[-3.5, -8.35]], 0.3],
    [E.radio - 1.2, E.radio + 8.5, [[-9.5, -8.7]], 1.2],
  ];
  const sx = shSC('moving', 1, -0.3);
  let lo = E.guardIn + 21.5, hi = sx - 2;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2, x = shMover(-38.3, -8.25, legsFrom(m)).pos(sx)[0]; if (x > -7.8) lo = m; else hi = m; }
  const M = shMover(-38.3, -8.25, legsFrom((lo + hi) / 2));
  const E2 = Math.PI / 2;
  const you = SH_F.hide;
  const atYou = shYawTo(stand[0], stand[1], you[0], you[1]);
  const yawK = [[-9, E2], [E.guardIn + 21, E2], [E.guardIn + 21.8, E2 - 0.9], [E.guardIn + 23.2, E2 + 0.35], [E.guardIn + 24.2, E2],
    [E.guardSeen + 2.0, E2], [E.guardSeen + 3.0, atYou], [E.radio + 8.5, atYou]];   // he backs away still facing you
  // the torch's aim: a point it is pointing at (x, y, z); sweeping the bays as he walks, then on you
  const aim = (s) => {
    const p = M.pos(s), y = shYawKeys(yawK, s);
    const sweep = 0.55 * Math.sin((s - E.guardIn) * 0.9) + 0.25 * Math.sin((s - E.guardIn) * 2.3 + 1);
    const fwd = [p[0] + Math.sin(y + sweep) * 7, 0.2, p[1] + Math.cos(y + sweep) * 7];
    const onYou = MathX.smooth(s, E.torchOn - 0.6, E.torchOn + 0.15) * (1 - 0.6 * MathX.smooth(s, E.radio + 2, E.radio + 6));
    const T = [you[0], 1.35, you[1]];
    return [MathX.lerp(fwd[0], T[0], onYou), MathX.lerp(fwd[1], T[1], onYou), MathX.lerp(fwd[2], T[2], onYou)];
  };
  return {
    M, stand, pos: M.pos, dist: M.dist, speed: M.speed, yaw: (s) => shYawKeys(yawK, s), aim,
    visible: (s) => s >= E.guardIn - 0.2,
    torch: (s) => (s >= E.guardIn + 0.3 ? 1 : 0),
    radio: (s) => shBump(s, E.radio + 0.3, E.radio + 7.5, 0.5, 0.6),
    recoil: (s) => shBump(s, E.recoil, E.recoil + 1.6, 0.15, 1.0),
  };
})();

// ---------------------------------------------------------------------------------------------------------------------
// YOUR CAR. Level 4: out of the bay in reverse (a quarter circle), away along the aisle, down the ramp at 25 km/h.
// Level 2 (camera 7): along the aisle at 20 km/h. The exit lane: in to the barrier, stop.
// at(s) → { x, y, z, yaw, pitch, v } (the car's ground centre; it faces +z at yaw 0)
// ---------------------------------------------------------------------------------------------------------------------
const SHC = (() => {
  const E = SHE, C = SH_F.car, R = 5.8, cx = C.x - R, cz = C.z;
  const aisleZ = SH_F.aisle.n, x0 = cx, rampX = SH_F.ramp.x[0], P = SHP;
  // away along the aisle: speed up from rest (E.go) at a steady 1.9 m/s² to 25 km/h, reaching the ramp at E.ramp
  const vR = P.ramp, dist = rampX - x0;
  const acc = (() => { const T = E.ramp - E.go; // distance = v·T − v²/(2a) → a = v² / (2 (v T − d))
    return vR * vR / (2 * Math.max(0.5, vR * T - dist)); })();
  const tAcc = vR / acc;
  const xAisle = (s) => { const u = s - E.go; if (u <= 0) return x0; if (u < tAcc) return x0 + 0.5 * acc * u * u; return x0 + 0.5 * acc * tAcc * tAcc + vR * (u - tAcc); };
  const l4 = (s) => {
    if (s < E.reverse[0]) return { x: C.x, y: 0, z: C.z, yaw: Math.PI, pitch: 0, v: 0 };
    if (s < E.reverse[1]) {
      const u = (s - E.reverse[0]) / (E.reverse[1] - E.reverse[0]), k = u * u * (3 - 2 * u), ph = k * Math.PI / 2;
      return { x: cx + R * Math.cos(ph), y: 0, z: cz + R * Math.sin(ph), yaw: Math.atan2(Math.sin(ph), -Math.cos(ph)), pitch: 0, v: 0 };
    }
    const x = xAisle(s), y = shFloorY(x, aisleZ), slope = SH_F.ramp.drop / (SH_F.ramp.x[1] - SH_F.ramp.x[0]);
    const onRamp = MathX.smooth(x, rampX - 0.8, rampX + 0.8) * (1 - MathX.smooth(x, SH_F.ramp.x[1] - 0.8, SH_F.ramp.x[1] + 0.8));
    return { x, y, z: aisleZ, yaw: Math.PI / 2, pitch: Math.atan(slope) * onRamp, v: s > E.go ? Math.min(vR, acc * (s - E.go)) : 0 };
  };
  // level 2: east along the north aisle at 20 km/h, past the plant room's white wall (camera 7 on the column at x = −7.2)
  const l2 = (s) => { const x = -14.6 + P.cctv * (s - E.cctv); return { x, y: 0, z: aisleZ + 0.4, yaw: Math.PI / 2, pitch: 0, v: P.cctv }; };
  // the exit lane (exit.js: the lane runs along +x, the barrier at x = 0, your car stops with its front 1.2 m short of it)
  const exStopX = -3.25, exV = 3.2, exDec = 1.6;
  const ex = (s) => {
    const u = E.exitStop - s;                             // seconds before the stop
    if (u <= 0) return { x: exStopX, y: 0, z: 0, yaw: Math.PI / 2, pitch: 0, v: 0 };
    const tD = exV / exDec;                               // braking time
    const x = u < tD ? exStopX - 0.5 * exDec * u * u : exStopX - 0.5 * exDec * tD * tD - exV * (u - tD);
    return { x, y: 0, z: 0, yaw: Math.PI / 2, pitch: 0, v: Math.min(exV, exDec * u) };
  };
  return { l4, l2, ex, acc, R, exStopX };
})();
// the seat you sit in, in the car's frame (right-hand drive: the car faces +z, its right is −x)
const SH_SEAT = { x: -0.36, y: 0.30, z: -0.22 };
const SH_BACKSEAT = { x: 0.05, y: 0.26, z: -1.05 };

// ---------------------------------------------------------------------------------------------------------------------
// THE LAMPS (level 4): which are lit. One tube is failing (it flickers); at midnight the car park's night mode turns
// every other lamp off, row by row from the west end, about 0.11 s apart.
// ---------------------------------------------------------------------------------------------------------------------
const SH_LAMPS = (() => { const L = []; SH_F.lampRows.forEach((z, r) => SH_F.lampX.forEach((x, k) => L.push({ x, z, r, k, i: L.length, night: (k + r) % 2 === 0 }))); return L; })();
const SH_FAILING = SH_LAMPS.find((l) => l.x === -18.0 && l.z === -14.2).i;
function shLampOn(i, s, level = 4) {
  const L = SH_LAMPS[i];
  let on = 1;
  if (level === 4 && !L.night && s >= SHE.mid + 0.11 * L.k + 0.03 * L.r) on = 0;
  if (i === SH_FAILING) { const q = Math.floor(s * 14); const f = hash1(q * 13 + 7); const burst = noise1(s * 0.6, 3) > 0.25; on *= burst ? (f < 0.45 ? 0.08 : 1) : 1; }
  return on;
}

if (typeof module !== 'undefined') module.exports = { SHP, SHE, SHY, SHG, SHC, shLampOn, SH_LAMPS };
