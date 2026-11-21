/* =====================================================================
   PHYSICS — "What if the ocean kept rising and couldn't stop?". Every number a caption, the HUD or a text shows comes
   from here (script.js checks them). Story time s: seconds after 6:42:00 PM EDT on Thursday 9 September 2027, high
   water at Harrow Rock (s = 0).
   THE RULE: from s = 0 the sea everywhere on Earth rises 1 metre every minute (1/60 m every second), and keeps rising.
   The water comes from nowhere (the film's one cheat, said on screen); nothing else is changed: the Moon, the swell,
   the weight of water, the light. Heights are above high water at 6:42 PM (the datum a lighthouse's height is charted
   from), so the sea's height is h(s) = s / 60 m.
   ===================================================================== */

const OCP = (() => {
  const T = OC_F.tower, P = {
    rate: 1 / 60,               // m a second
    oceanKm2: 361.1e6,          // the oceans' area (km²)
    riversKm3: 37300,           // every river on Earth, into the sea, a year (km³; Dai & Trenberth 2002: 37,288)
    rho: 1025, g: 9.81,         // sea water (kg/m³), gravity
    doorT: 10,                  // tonnes: the push the tower door can take (it is rated for storm waves, not a standing sea)
    lowZone: 10,                // m: one person in ten on Earth lives less than 10 m above the sea (CIESIN's low elevation coastal zone, ~10 %)
    iceM: 66,                   // m: all the ice on Earth melted (IPCC AR6: Antarctica 57.9 m, Greenland 7.4 m, glaciers 0.32 m = 65.6)
    shipKm: 25, shipKn: 16,     // the container ship: 25 km out when you call it, at 16 knots (29.6 km/h)
    fogBuilt: OC_F.fog.built, year: OC_F.date[0],
    gridFail: 27.0,             // m: the sea floods the coast's last substations; the mainland's power goes (7:09 PM)
    kRange: 3.85,               // km per √m: how far a light can be seen over the sea's curve (with normal refraction)
  };
  P.h = (s) => Math.max(0, s) * P.rate;                    // the sea above high water (m)
  P.sAt = (h) => h / P.rate;                               // when the sea reaches height h
  P.perMinKm3 = P.oceanKm2 * 1e-3;                         // new water a minute (km³)
  P.riverYears = P.perMinKm3 / P.riversKm3;                // the rivers' years to bring one minute's worth
  P.lampLeft = (s) => (T.lamp - P.h(s)) / (P.rate * 60);   // minutes until the sea is at the lamp
  // the door: 1.0 × 2.0 m, its sill at +15.3; the push of the sea on it (tonnes-force) with the sea at h
  P.doorTonnes = (h) => { const d = h - (T.sill + T.door.h / 2); return Math.max(0, P.rho * P.g * T.door.w * T.door.h * d) / (P.g * 1000); };
  P.burstH = T.sill + T.door.h / 2 + P.doorT * 1000 / (P.rho * T.door.w * T.door.h);   // +21.18 m
  P.stepS = T.rise / P.rate;                               // a step every 11.3 s
  P.shipMin = P.shipKm / (P.shipKn * 1.852) * 60;          // the ship needs 50.6 minutes to reach you
  // how far a light at height a (m above the sea) can be seen from eyes at height b (km)
  P.range = (a, b) => P.kRange * (Math.sqrt(Math.max(0, a)) + Math.sqrt(Math.max(0, b)));
  // the tower inside, after the door gives: the sea pours in through the doorway (Cd 0.6 × 2 m²) until it stands at
  // the sea's own height (the shaft's floor area: π × 2.35² m²); before, only spray through the seams
  P.inA = Math.PI * T.inner * T.inner;
  P.burstS = P.sAt(P.burstH);
  const tw = (() => { const out = []; let y = T.sill, s = P.burstS; for (let i = 0; i < 1200; i++) { out.push([s, y]); const d = Math.max(0, P.h(s) - y); y += 0.05 * Math.min(0.6 * 2.0 * Math.sqrt(2 * P.g * d) / P.inA, d / 0.05 + P.rate); s += 0.05; } return out; })();
  P.towerWater = (s) => { if (s < P.burstS) return T.sill - 0.4; if (s >= tw[tw.length - 1][0]) return P.h(s); const i = Math.min(tw.length - 2, Math.floor((s - P.burstS) / 0.05)), u = (s - tw[i][0]) / 0.05; return tw[i][1] + (tw[i + 1][1] - tw[i][1]) * u; };
  P.filledS = tw.find(([s, y]) => P.h(s) - y < 0.05)[0] - P.burstS;   // ~16 s to fill to the sea's height
  // the house: the sea seeps in under the door and round the frames, standing a little lower inside (up to 0.35 m)
  const H = OC_F.house, sill = H.floor + H.door.sill;
  P.houseWater = (s) => { const d = P.h(s) - sill; return d <= 0 ? H.floor - 0.3 : H.floor + Math.max(0, d - 0.35 * (1 - Math.exp(-d / 0.35))); };
  P.houseFull = P.sAt(H.ceil + 0.35 * 0.95) - P.sAt(sill);    // s from the door to the ceiling (2.8 min)
  // the boat: moored by a 1.15 m line from the ring to its bow. It floats free until the line is taut; then the bow is
  // held down and the stern rises with the sea; the sea pours in over the bow; it fills and sinks beside the landing
  const R = OC_F.ring, B = OC_F.boat, dx = Math.hypot(B.x - R[0], B.bowZ - R[2]);
  P.tautH = R[1] + Math.sqrt(Math.max(0, B.rope * B.rope - dx * dx)) - B.free;   // the sea's height when the line comes taut
  P.floodH = P.tautH + 0.28;                               // the bow's gunwale goes under
  P.boatRestY = -1.9;                                      // where it lies: the rock shelf at the landing's foot
  P.boatDepth = (s) => P.h(s) - P.boatRestY;               // how deep your boat lies
  // the bell buoy: 26 m of chain in 18 m of water; the chain is straight up and down when the sea is 8 m higher
  P.bellH = OC_F.bell.chain - OC_F.bell.depth;
  return P;
})();

// the moments (story s)
const OCE = (() => {
  const P = OCP, T = OC_F.tower, at = P.sAt;
  return {
    taut: at(P.tautH), flood: at(P.floodH), sunk: at(P.floodH) + 26,
    landing: at(OC_F.landing.top),                          // the landing's deck goes under
    bell: at(P.bellH),                                      // the bell buoy's chain runs out
    tenM: at(P.lowZone),
    fogLast: at(OC_F.fog.floor + 0.32),                     // the compressor's motor floods: the horn's last blast
    houseIn: at(OC_F.house.floor + OC_F.house.door.sill),   // the sea at the house's door
    island: at(T.base + 0.05),                              // the top of the rock goes under
    towerDoor: at(T.sill),
    burst: P.burstS, dark: P.burstS + 3.2,
    grid: at(P.gridFail),
    watch: at(T.watch), gallery: at(T.top), lamp: at(T.lamp), eave: at(T.eave),
  };
})();

// the town's lights (seeded): [x offset m along the coast, height above the datum m, kind]; a light goes out when the
// sea reaches it, and all but the hill's go out when the grid fails (P.gridFail); people's torches on the hill after
const OC_TOWN = (() => {
  const r = new RNG(9157), out = [];
  for (let i = 0; i < 230; i++) { const u = r.next(), x = (u - 0.5) * 3600, el = Math.min(70, 1.2 + Math.pow(r.next(), 1.6) * 55 + Math.max(0, 900 - Math.abs(x)) * 0.006); out.push([x, el, r.next() < 0.12 ? 'warm' : 'white']); }
  return out;
})();

if (typeof module !== 'undefined') module.exports = { OCP, OCE };
