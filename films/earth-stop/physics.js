/* =====================================================================
   PHYSICS — "What if Earth stopped spinning for 1 second?" Every number on screen comes from here.
   STORY time s: seconds after Sunday 15 November 2026, 5:42:00.000 PM, at a harbour town on the equator (layout.js).
   THE RULE: from s = 0 to s = 1 the solid Earth does not turn: rock, soil, and the ground everything stands on. At
   s = 1 it turns again as before. Nothing else is touched: every loose thing, the air and the sea keep the motion they
   had, 465.1 m/s to the east (2πR / one sidereal day, at the equator).
   THE ONE IMPOSSIBLE THING: stopping the Earth (and starting it again) takes its whole spin energy, 2.1 × 10²⁹ J, as
   much as the Sun gives off in 9 minutes; where it goes, and what force does it, is not said.
   What follows from the rule (all rough, all stated on screen where used):
     nothing is bolted down hard enough   to stop dead from 465 m/s steel would have to carry ρ·c·v ≈ 18 GPa; structural
                          steel yields at 0.355 GPa: about 50 times too weak. So every bolt shears and everything above
                          the ground keeps going: buildings slide off their floors, the canopy leaves its bolts behind
     friction             a thing sliding on the ground is slowed by μ·g: a person about 25 km/h in the second (μ 0.7),
                          the train about 7 km/h (steel skidding on steel, μ 0.2). GENEROUS: the train stays on its
                          rails and the rails in their clips
     gravity              in one second a thing falls ½·g·t² = 4.9 m: whatever was higher than that, with nothing
                          ahead of it, is still in the air when the ground turns again
     energy               ½v² = 108 kJ per kilogram = 26 g of TNT per kilogram
     the hill             is ground: it stopped. Whatever started within 465 m west of its rock face reaches it at
                          465 m/s during the second
     the air              keeps going too: against the rock a Mach 1.33 wind (30 °C air: sound 349 m/s); where it is
                          stopped it heats by v²/2cp = 108 °C
     the sea              keeps going: 465 m of water, 10 m deep, onto every metre of the quay (4,800 t per metre,
                          the energy of 120 t of TNT); it can only go up (APPROX.: drawn climbing at ¾ of its speed)
     5:42:01              the ground turns again: what is still moving east at 465 m/s is at rest on it; what the
                          ground stopped during the second stands still while the ground leaves: seen from the ground
                          it is thrown west at 465 m/s
   ===================================================================== */

const ESP = (() => {
  const F = ES_F;
  const P = {
    R: 6378137, Tsid: 86164.0905, T: 1, g: 9.78, tnt: 4.184e6,
    rhoSteel: 7850, cSteel: 5048, yieldSteel: 355e6,      // bar wave speed √(E/ρ); S355 structural steel
    muPerson: 0.7, muTrain: 0.2,
    trainT: 180, wagonT: 80, ferryT: 2000,               // tonnes
    record: 574.8,                                        // km/h: the TGV's 2007 record, the fastest on steel wheels
    airT: 303.15, cp: 1004.5, rhoWater: 1025, depth: 10,
    spinE: 2.138e29, sunW: 3.828e26,
    wallK: 0.75,                                          // the water's climb, as a share of its speed (rough)
  };
  P.v = 2 * Math.PI * P.R / P.Tsid;                       // 465.10 m/s
  P.kmh = P.v * 3.6; P.mph = P.v / 0.44704;               // 1,674 km/h · 1,040 mph
  P.at = (latDeg) => P.kmh * Math.cos(latDeg * Math.PI / 180);
  P.drop = 0.5 * P.g * P.T * P.T;                         // 4.89 m
  P.steelNeed = P.rhoSteel * P.cSteel * P.v;              // 18.4 GPa
  P.steelK = P.steelNeed / P.yieldSteel;                  // ≈ 52
  P.keKg = 0.5 * P.v * P.v;                               // 108 kJ/kg
  P.tntG = P.keKg / P.tnt * 1000;                         // 25.9 g of TNT per kg
  P.tntT = (tonnes) => tonnes * P.keKg / P.tnt;           // tonnes of TNT for a mass in tonnes
  P.personKmh = P.muPerson * P.g * 3.6;                   // 24.6 km/h lost per second
  P.trainA = P.muTrain * P.g;                             // 1.96 m/s²
  P.sound = Math.sqrt(1.4 * 287.05 * P.airT);             // 349 m/s
  P.mach = P.v / P.sound;                                 // 1.33
  P.heat = P.v * P.v / (2 * P.cp);                        // 107.7 K
  P.waterT = P.v * P.depth * P.rhoWater / 1000;           // 4,767 t of water per metre of quay
  P.waterTnt = P.tntT(P.waterT);                          // 123 t of TNT per metre
  P.riseKm = P.v * P.v / (2 * P.g) / 1000;                // 11.1 km (no drag)
  P.wallKmh = P.wallK * P.kmh;
  P.sunMin = P.spinE / P.sunW / 60;                       // 9.3 minutes
  // ---- where things are
  // a free flyer's shift east at story s
  P.X = (s) => (s <= 0 ? 0 : P.v * Math.min(s, P.T));
  // the train's shift (skidding on its rails; after 5:42:01 it is moving west over the ground at 7 km/h, and brakes)
  P.trainX = (s) => {
    if (s <= 0) return 0;
    if (s <= P.T) return P.v * s - 0.5 * P.trainA * s * s;
    const u = Math.min(s - P.T, P.T), vb = P.trainA * P.T;
    return P.v * P.T - 0.5 * P.trainA * P.T * P.T - (vb * u - 0.5 * P.trainA * u * u);
  };
  P.trainV = (s) => (s <= 0 ? 0 : s <= P.T ? P.v - P.trainA * s : -Math.max(0, P.trainA * P.T - P.trainA * (s - P.T)));   // over the ground
  P.nose = (s) => F.train.nose + P.trainX(s);
  P.gap = (s) => F.hill.x - P.nose(s);                    // the train's nose to the rock
  P.gapEnd = F.hill.x - (F.train.nose + P.trainX(P.T));   // 149.9 m at 5:42:01
  // free fall from story s0
  P.fall = (s, s0 = 0) => (s <= s0 ? 0 : 0.5 * P.g * (s - s0) * (s - s0));
  // the platform canopies: carried on their sliding columns until their middle passes the platform's end, then falling;
  // they come to rest on their folded columns (the roof's top 1.5 m up)
  P.roofFree = (F.plat.x[1] - (F.can1.x[0] + F.can1.x[1]) / 2) / P.v;         // 0.224 s
  P.roofRest = 1.5;
  P.roofY = (s) => Math.max(P.roofRest, F.can1.y - P.fall(s, P.roofFree));
  P.roofLand = P.roofFree + Math.sqrt(2 * (F.can1.y - P.roofRest) / P.g);     // 1.14 s
  // the woman on the footbridge (at the platforms' east end): in free fall once the bridge has left the platforms
  P.womanFree = (F.plat.x[1] - F.bridge.x) / P.v;                             // 0.017 s
  P.womanY = (s) => Math.max(0, F.bridge.y - P.fall(s, P.womanFree));
  P.womanLand = P.womanFree + Math.sqrt(2 * F.bridge.y / P.g);                // 1.12 s
  P.womanV = P.g * (P.womanLand - P.womanFree);                               // 10.7 m/s: a 5.9 m fall
  // the tank wagons: wagon k's front is at wagons.front − k·L; it meets the rock at:
  P.wagonHit = (k) => (esHillX(F.wagons.z) - (F.wagons.front - k * F.wagons.L)) / P.v;
  P.shed = (esHillX(F.shed.z) - (F.shed.x + F.shed.w / 2)) / P.v;               // 0.387 s: the depot's shed reaches the rock
  P.wagon0 = P.wagonHit(0); P.wagonEnd = P.wagonHit(F.wagons.n);              // 0.449 … 0.643 s
  P.parked = esHillX(F.wagons.z) - F.wagons.front;                            // 209 m
  // the sea's wall at the quay: its height
  P.wallH = (s) => (s <= 0 ? 0 : P.wallK * P.v * s * (s > P.T ? 1 - 0.25 * Math.min(1, s - P.T) : 1));
  // the ferry (its bow), the boats: when they meet the quay
  P.ferryHit = (F.quay.x - F.ferry.bow) / P.v;                                // 0.624 s
  P.ferryOut = F.quay.x - F.ferry.bow;                                        // 290 m
  // 5:42:01: what the hill stopped is thrown west (seen from the ground): its front, and when it reaches the train
  P.blastX = (s) => F.hill.x - (s <= P.T ? 0 : P.v * (s - P.T));
  P.blastHit = P.T + P.gapEnd / P.v;                                          // 1.322 s
  return P;
})();

// everything that reaches the rock face during the second: { s, x, y, z, kind, m (tonnes), r (a size) }
const ES_HITS = (() => {
  const P = ESP, F = ES_F, out = [];
  const add = (x0, z, y, kind, m, r) => { const hx = esHillX(z), s = (hx - x0) / P.v; if (s > 0.004 && s < P.T) out.push({ s, x: hx, y, z, kind, m, r, x0 }); };
  ES_PALMS.forEach((p, i) => add(p[0], p[1], p[2] * 0.75, 'palm', 0.4, 2.5 + (i % 3)));
  for (let k = 0; k < F.wagons.n; k++) add(F.wagons.front - k * F.wagons.L, F.wagons.z, 2.2, 'wagon', P.wagonT, 9);
  add(F.shed.x + F.shed.w / 2, F.shed.z, 3, 'shed', 40, 8);
  add(F.sigbox.x + 3, F.sigbox.z, 3.5, 'box', 30, 6);
  add(F.wtower.x + 2, F.wtower.z, 9, 'tower', 25, 6);
  add(F.crossing.x + 2, -13.5, 1, 'truck', 2, 4);
  return out.sort((a, b) => a.s - b.s);
})();

// the time of day: 5:42:00 PM + s
function esClockParts(s) {
  const tot = 17 * 3600 + 42 * 60 + s, f = Math.floor(tot + 1e-9), ms = Math.min(999, Math.max(0, Math.floor((tot - f) * 1000 + 1e-6)));
  const h24 = Math.floor(f / 3600) % 24, m = Math.floor(f / 60) % 60, sec = f % 60;
  return { day: 'SUNDAY', h: ((h24 + 11) % 12) + 1, m, sec, ms, pm: h24 >= 12 };
}
// a seeded stream of numbers in [0, 1)
function esRand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

if (typeof module !== 'undefined') module.exports = { ESP, ES_HITS, esClockParts, esRand };
