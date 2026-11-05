/* =====================================================================
   PHYSICS — every number this film shows or uses (classic script: globals; story time s = seconds after Tuesday
   10 November 2026, 7:42:00.000 AM, when every man and boy on Earth vanishes). No randomness, no clock.

   THE RULE: at 7:42:00 AM every man and boy alive vanishes, with what he is wearing. Whatever he was holding stays
   (and falls). Babies not yet born stay (that is the twist of the maternity ward).

   SOURCES (rounded; PLAN.md § 2):
   - world population mid-2026 ≈ 8.30 billion, about 101 men to 100 women (UN World Population Prospects 2024): 4.17 billion
     men and boys, 4.13 billion women and girls
   - births ≈ 132 million a year (UN WPP 2024), 105 boys to 100 girls: 132e6 × 0.512 / 31.56e6 s = 2.14 boys a second;
     pregnancies that end in a birth within 9 months ≈ 132e6 × 0.75 ≈ 99 million, half boys: ≈ 50 million boys
   - airline pilots: about 5% are women (ISWAP / IATA, 2023-24): 19 in 20 are men; both pilots men: 0.95² ≈ 9 in 10
   - airliners airborne at once: about 9,000 (rough; flight trackers)
   - the cockpit door: the cabin crew's emergency code unlocks it after a 30-second delay unless someone inside denies it
   - firefighters: about 9% women (England, Home Office 2024; US NFPA); air traffic controllers about 1 in 5 women (ICAO)
   - lorry drivers in Europe: about 3% women (IRU 2023); heads of state or government: 28 of 193 countries are led by
     a woman (UN Women, "Women in politics: 2026", 1 January 2026), so 165 of 193 were led by a man
   - an electronic parking brake held while driving brakes the car hard through its stability system (owner's manuals:
     Hyundai, Kia, VW, BMW); about 6.5 m/s² here
   ===================================================================== */

const MGP = (() => {
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = (x, a, b) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const P = {};

  // ---- people
  P.men0 = 4171482560;                    // men and boys alive at 7:41:59 AM
  P.women0 = 4128702340;                  // women and girls
  P.menGone = P.men0 + 2;                 // the count the instant before 7:42 (what vanished)
  P.boysPerS = 2.14;                      // boys born per second, worldwide
  P.boysDue = 50e6;                       // boys not yet born, due in the next nine months
  // the counter: men and boys on Earth (before 7:42 it creeps up: births minus deaths ≈ 0.9 a second)
  P.men = (s) => (s < 0 ? P.men0 + Math.floor(0.9 * (s + 3)) : Math.floor(P.boysPerS * s));

  // ---- your car: on cruise control at 100 km/h in the middle lane, eastbound; your dad vanishes; you grab the wheel
  // at sGrab and hold the parking-brake switch at sBrake (the brake builds up over 0.4 s, then 6.5 m/s²)
  const C = P.car = { v0: 100 / 3.6, sGrab: 2.0, sBrake: 3.2, ramp: 0.4, a: 6.5, xStop: 95 };
  C.sStop = C.sBrake + C.ramp + (C.v0 - 0.5 * C.a * C.ramp) / C.a;
  const carRel = (s) => {                                          // distance from s = 0, and speed
    if (s <= C.sBrake) return [C.v0 * s, C.v0];
    const tb = s - C.sBrake, d0 = C.v0 * C.sBrake;
    if (tb <= C.ramp) return [d0 + C.v0 * tb - C.a * tb * tb * tb / (6 * C.ramp), C.v0 - C.a * tb * tb / (2 * C.ramp)];
    const v1 = C.v0 - 0.5 * C.a * C.ramp, d1 = d0 + C.v0 * C.ramp - C.a * C.ramp * C.ramp / 6, u = Math.min(tb - C.ramp, v1 / C.a);
    return [d1 + v1 * u - 0.5 * C.a * u * u, Math.max(0, v1 - C.a * u)];
  };
  C.x0 = C.xStop - carRel(1e3)[0];
  P.carX = (s) => C.x0 + carRel(s)[0];
  P.carV = (s) => carRel(s)[1];
  P.carDecel = (s) => (s <= C.sBrake || s >= C.sStop ? 0 : C.a * Math.min(1, (s - C.sBrake) / C.ramp));
  // your hands keep the car in lane: it wanders a little to the right before you catch it
  P.carZ = (s) => MG_V.lanes[1] + 0.32 * smooth(s, 0.3, 2.2) * (1 - smooth(s, 2.3, 3.6)) + 0.12 * smooth(s, 3.4, 5.5);
  P.carYaw = (s) => 0.022 * Math.sin(Math.PI * clamp((s - 0.3) / 3.3, 0, 1)) * (s < 3.6 ? 1 : 0.4);    // + = nose right
  P.wheelTurn = (s) => (s < 0 ? 0.02 * Math.sin(s * 1.3) : s < C.sGrab ? 0.03 * smooth(s, 0, C.sGrab) : -0.16 * Math.sin(Math.PI * clamp((s - C.sGrab) / 1.6, 0, 1)) + 0.05 * Math.sin(Math.PI * clamp((s - 3.8) / 2.2, 0, 1)));

  // ---- the lorry ahead (in the slow lane, 90 km/h on cruise control): it drifts left across both lanes until its
  // front-left corner meets the central barrier, then grinds along it, nose pressed in, and stops at an angle across
  // the fast and middle lanes, 3 m in front of you. (Lorry-local: x forward, z right; one rigid body, 16.5 × 2.55 m.)
  const L = P.lorry = { len: 16.5, half: 8.25, w: 2.55, v0: 23.5, sDrift: 0.35, vz: 2.6, a: 5.66, yaw0: -0.13, yawEnd: -0.24, zFace: 0.12 };
  L.z0 = MG_V.lanes[2];
  const yawPre = (s) => L.yaw0 * smooth(s, L.sDrift, L.sDrift + 1.2);
  const zRaw = (s) => { if (s <= L.sDrift) return L.z0; const u = s - L.sDrift; return L.z0 - (u < 0.8 ? 0.5 * L.vz * u * u / 0.8 : 0.5 * L.vz * 0.8 + L.vz * (u - 0.8)); };
  // the centre's z when the front-left corner touches the barrier's face, at yaw y (+ = nose right)
  const zTouch = (y) => L.zFace + L.half * Math.sin(-y) + (L.w / 2) * Math.cos(y);
  { let s = L.sDrift; while (zRaw(s) > zTouch(yawPre(s)) && s < 20) s += 0.0005; L.sHit = s; }
  L.sStop = L.sHit + L.v0 / L.a;
  const lorryRel = (s) => { const u = Math.max(0, Math.min(s, L.sStop) - L.sHit); return L.v0 * Math.min(s, L.sHit) + L.v0 * u - 0.5 * L.a * u * u + (s > L.sStop ? 0 : 0); };
  P.lorryYaw = (s) => (s < L.sHit ? yawPre(s) : MathX.lerp(yawPre(L.sHit), L.yawEnd, smooth(s, L.sHit, L.sStop)));
  P.lorryV = (s) => (s <= L.sHit ? L.v0 : Math.max(0, L.v0 - L.a * (s - L.sHit)));
  P.lorryZ = (s) => (s < L.sHit ? zRaw(s) : zTouch(P.lorryYaw(s)));
  // a corner of the lorry (lorry-local lx, lz) in the world, at story time s, given its centre's x
  L.corner = (s, cx, lx, lz) => { const th = -P.lorryYaw(s); return [cx + lx * Math.cos(th) + lz * Math.sin(th), P.lorryZ(s) - lx * Math.sin(th) + lz * Math.cos(th)]; };
  // where it stops: its nearest rear corner 3.0 m in front of your car's nose
  { const rx = Math.min(L.corner(1e3, 0, -L.half, -L.w / 2)[0], L.corner(1e3, 0, -L.half, L.w / 2)[0]); L.xEnd = C.xStop + MG_CAR.L / 2 + 3.0 - rx; }
  L.x0 = L.xEnd - lorryRel(1e3);
  P.lorryX = (s) => L.x0 + lorryRel(s);
  P.lorrySparks = (s) => (s > L.sHit && s < L.sStop ? Math.min(1, P.lorryV(s) / 8) : 0);

  // ---- the train (the railway on the east bank, southbound): the driver's pedal released at 7:42; the safety
  // system brakes after a 4 s warning; 1.0 m/s² from 25 m/s: it stops just north of the viaduct
  const T = P.train = { v0: 25, sWarn: 4, a: 0.6, zStop: -150, cars: 4, carL: 24 };
  T.sStop = T.sWarn + T.v0 / T.a;
  T.z0 = T.zStop - (T.v0 * T.sWarn + T.v0 * T.v0 / (2 * T.a));
  P.trainZ = (s) => { const u = Math.min(s, T.sStop); return T.z0 + (u <= T.sWarn ? T.v0 * u : T.v0 * T.sWarn + T.v0 * (u - T.sWarn) - 0.5 * T.a * (u - T.sWarn) ** 2); };   // the front
  P.trainV = (s) => (s <= T.sWarn ? T.v0 : Math.max(0, T.v0 - T.a * (s - T.sWarn)));

  // ---- the barge (southbound down the river at 3.6 m/s, its heading held by its autopilot): the river bends west
  // south of the viaduct; the barge goes straight on and its bow runs into the east bank at sHit (set by script.js)
  const B = P.barge = { v: 3.6, len: 86, beam: 9.6, x: 14, sHit: 75, zHit: 440 };
  P.bargeBow = (s) => (s <= B.sHit ? B.zHit - B.v * (B.sHit - s) : B.zHit + 4.5 * (1 - Math.exp(-(s - B.sHit) / 1.6)));
  P.bargeYaw = (s) => (s <= B.sHit ? 0 : 0.05 * (1 - Math.exp(-(s - B.sHit) / 6)));

  // ---- flight 2207: fuel runs out at sEmpty (11:05 AM); it is 3 h 20 min at 7:45
  P.sEmpty = 12300;
  P.fuel = (s) => Math.max(0, P.sEmpty - s);
  P.hms = (x) => { x = Math.max(0, Math.round(x)); return `${Math.floor(x / 3600)}:${String(Math.floor(x / 60) % 60).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
  P.door = 30;                                                      // the cockpit door's emergency-access delay (s)
  P.controllers = [9, 2];
  P.circling = 24;                                                  // planes the tower has circling at 9:47
  P.landMin = 15;                                                   // minutes to talk one plane down
  P.pilotsMale = 0.95;
  P.airborne = 9000;
  P.leadersMan = [165, 193];
  return P;
})();
if (typeof module !== 'undefined') module.exports = { MGP };
