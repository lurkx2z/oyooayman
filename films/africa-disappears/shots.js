/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, frame(t, set, app) }. A set is one of the worlds
   film.js builds (planet, mine, factory, board, port, shelf, storm, forest, room, phone, coast); its frame() poses
   the set and its camera for time t. Cut points come from script.js (AF), i.e. from the real narration.
   ===================================================================== */

const afK = (t, a, b, e = Ease.inOutSine) => e(MathX.clamp((t - a) / (b - a), 0, 1));
const afLerp = MathX.lerp;
const afLogLerp = (a, b, k) => a * Math.pow(b / a, k);

// the planet's state for the whole film (what has happened by time t)
function afPlanetState(t, extra = {}) {
  const F = afFill(t);
  return Object.assign({ t, van0: AF.van0, vanDur: AF.vanDur, front: F.front, level: F.level, foam: F.foam, swirl: F.front > 0 ? 1 : 0, sea: afSea(t), sun: [12, 3] }, extra);
}

const AF_SHOTS = [
  // ================= 1 — THE IMPOSSIBLE EVENT
  // P1: today's Earth, Africa in full daylight under the title; it goes; the camera leans in over the new basin
  { id: 'P1', t0: -1, t1: AF.erased - 0.25, set: 'planet', frame(t, P) {
    const k = afK(t, AF.van0 + 0.6, AF.erased - 0.25, Ease.inOutCubic), close = k > 0.35;
    P.set(afPlanetState(t, { sun: [35, 8], clouds: afLerp(1, 0.6, k), patch: close ? [-2, -14, 26, 12] : null }));
    // after the vanish the camera falls toward the Gabon coast and tips over until it looks west across the floor at
    // the cut wall, the Atlantic standing on top of it
    P.orbit(afLerp(18.5, 9.4, k), afLerp(1, -1, k), { range: afLogLerp(2.9, 0.15, k), pitch: afLerp(0, 68, k), from: 90, upMix: k, look: afLerp(0, 1.5, k), fov: afLerp(30, 38, k) });
  } },
  // P2: dusk: the camera over the Mediterranean looking south. Europe's lights are on; where Cairo, Lagos and
  //     Kinshasa shone there is nothing; the old coast glows faintly
  { id: 'P2', t0: AF.erased - 0.25, t1: AF.mine, set: 'planet', frame(t, P) {
    const k = afK(t, AF.erased - 0.25, AF.mine);
    // the cities' ghosts (where their lights were) fade out on "erased"
    const ghostL = 0;
    P.set(afPlanetState(t, { sun: [-95, 5], clouds: 0.4, moon: 1, ghost: 0.5 + 0.5 * afK(t, AF.erasedW - 0.4, AF.erasedW + 0.6), ghostL }));
    P.aim(afLerp(16, 20, k), afLerp(8, 11, k), afLerp(2.6, 2.35, k), 32, { tilt: afLerp(18, 26, k), dy: -1.5 });
  } },
  // ================= 2 — THE ECONOMIC SHOCK (sets: mine, factory)
  { id: 'M1', t0: AF.mine, t1: AF.platinum, set: 'mine' },
  { id: 'F1', t0: AF.platinum, t1: AF.battery, set: 'factory', mode: 'cars' },
  { id: 'F2', t0: AF.battery, t1: AF.gone, set: 'factory', mode: 'cells' },
  { id: 'F3', t0: AF.gone, t1: AF.trade, set: 'factory', mode: 'stop' },
  // ================= 3 — THE NETWORK BREAKS
  // T1: the trade map: the planet as a dark satellite map, the routes glowing, ships moving; the African lanes and
  //     ports flicker out; then the Suez line snaps (close-up), and the detours draw across the Pacific
  { id: 'T1', t0: AF.trade, t1: AF.suez - 0.2, set: 'planet', frame(t, P) {
    const k = afK(t, AF.trade, AF.suez - 0.2);
    P.set(afPlanetState(t, { mode: 1, clouds: 0, lights: 0, atmo: 0.5, sun: [30, 20],
      trade: { on: 1, grow: 0.6 + 2.5 * (t - AF.trade), cut0: AF.ports - 0.1, cut1: AF.collapse + 1.2, suez: 1e9, detour: 0 } }));
    P.aim(42 - 18 * k, 18 - 6 * k, afLerp(3.6, 3.2, k), 32, { tilt: 8, dy: -1 });
  } },
  { id: 'T2', t0: AF.suez - 0.2, t1: AF.board, set: 'planet', frame(t, P) {
    const k = afK(t, AF.suez - 0.2, AF.board), z = afK(t, AF.suez - 0.2, AF.suez + 0.6, Ease.outCubic);
    P.set(afPlanetState(t, { mode: 1, clouds: 0, lights: 0, atmo: 0.5, sun: [30, 20],
      trade: { on: 1, grow: 9, cut0: AF.ports - 0.1, cut1: AF.collapse + 1.2, suez: AF.suezGone - 0.15, detour: 1.3 * afK(t, AF.suezGone + 0.3, AF.board + 0.5) } }));
    P.aim(afLerp(30, 33, z) + 2 * k, afLerp(22, 29, z), afLerp(2.6, 1.42, z) + 0.12 * k, 32, { tilt: 18 * z, dy: -0.5 });
  } },
  { id: 'B1', t0: AF.board, t1: AF.port, set: 'board' },
  { id: 'H1', t0: AF.port, t1: AF.prices, set: 'port' },
  { id: 'S1', t0: AF.prices, t1: AF.oceans, set: 'shelf' },
  // ================= 4 — THE PLANET REACTS
  // O1: low over the Gulf of Guinea's old coast: the ocean pours over the rim into the dark basin
  { id: 'O1', t0: AF.oceans, t1: AF.surge, set: 'planet', frame(t, P) {
    const k = afK(t, AF.oceans, AF.surge);
    P.set(afPlanetState(t, { sun: [-40, 23], clouds: 0, patch: [-14, -8, 12, 20] }));
    // from over the dry floor, looking south at the Ghana coast: the Atlantic spills over the 4 km wall
    P.orbit(afLerp(-0.6, -0.2, k), 5.2, { range: afLerp(0.11, 0.095, k), pitch: 70, from: afLerp(-8, 6, k), look: 1, fov: 36 });
  } },
  // O2: the whole basin from high up: two oceans and the Mediterranean cross the floor (time-lapse)
  { id: 'O2', t0: AF.surge, t1: AF.currents, set: 'planet', frame(t, P) {
    const k = afK(t, AF.surge, AF.currents);
    P.set(afPlanetState(t, { sun: [10, 10], clouds: 0.3 }));
    P.aim(18, 2, afLerp(3.0, 2.8, k), 32, { tilt: 12, dy: -1.5 });
  } },
  // O3: closer: violent currents, the churn and eddies where the fronts meet
  { id: 'O3', t0: AF.currents, t1: AF.ship, set: 'planet', frame(t, P) {
    const k = afK(t, AF.currents, AF.ship);
    // over the middle of the basin, where the fronts collide: eddies hundreds of km wide
    P.set(afPlanetState(t, { sun: [40, 14], clouds: 0, patch: [4, -20, 44, 16], swirl: 1.6 }));
    P.orbit(afLerp(21, 23, k), afLerp(-4, -2.5, k), { range: afLerp(0.62, 0.5, k), pitch: 36, from: 195, look: 2, fov: 36, roll: afLerp(-3, 2, k) });
  } },
  { id: 'W1', t0: AF.ship, t1: AF.forest, set: 'storm' },
  // ================= 5 — THE ENVIRONMENTAL DISASTER
  { id: 'R1', t0: AF.forest, t1: AF.wild, set: 'forest', mode: 'canopy' },
  { id: 'R2', t0: AF.wild, t1: AF.flow, set: 'forest', mode: 'savanna' },
  // C1: the turning Earth (the basin full now, a new sea): wind and current lines bend into a new pattern
  { id: 'C1', t0: AF.flow, t1: AF.room, set: 'planet', frame(t, P) {
    const k = afK(t, AF.flow, AF.room);
    P.set(afPlanetState(t, { sun: [55, 18], clouds: 0.35, level: 0.85, swirl: 0.3, foam: 0, ghost: 0.6, flow: { on: MathX.smooth(t, AF.flow, AF.flow + 0.8), k: afK(t, AF.flowBend, AF.room - 1.0) } }));
    P.aim(afLerp(-5, 35, k), afLerp(8, 4, k), 3.3, 32, { tilt: 6, dy: -1 });
  } },
  // ================= 6 — HUMANITY
  { id: 'G1', t0: AF.room, t1: AF.halt, set: 'room' },
  { id: 'F4', t0: AF.halt, t1: AF.phone, set: 'factory', mode: 'dark' },
  { id: 'K1', t0: AF.phone, t1: AF.coast, set: 'phone' },
  // ================= 7 — THE FINAL REVEAL
  { id: 'L1', t0: AF.coast, t1: AF.earth, set: 'coast' },
  // E1: the new Earth: an ocean where Africa stood, the shelves dry, the camera pulls away
  { id: 'E1', t0: AF.earth, t1: 1e9, set: 'planet', frame(t, P) {
    const k = afK(t, AF.earth, AF.end, Ease.inOutSine);
    P.set(afPlanetState(t, { sun: [0, 8], clouds: 0.75, front: 3000, level: 1, foam: 0, swirl: 0.2, sea: 1 }));
    P.aim(afLerp(12, 22, k), afLerp(10, 4, k), afLerp(2.9, 6.5, k), 30, { tilt: afLerp(14, 0, k), dy: afLerp(-1, 0, k) });
  } },
];

function afShotAt(t) { for (const s of AF_SHOTS) if (t >= s.t0 && t < s.t1) return s; return AF_SHOTS[AF_SHOTS.length - 1]; }
