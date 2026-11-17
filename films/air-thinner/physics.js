/* =====================================================================
   PHYSICS — "What if the air got 1% thinner every minute?". Every number a caption or the HUD shows comes from here
   (script.js checks them). Story time s: seconds after 10:00:00 AM ship's time (s = 0 is the first step).
   THE RULE: at the top of every minute, 1% of whatever air is left stops existing, everywhere at once (all of its gases,
   the same share at every height, so the sky keeps its shape and only thins). Nothing else changes: the ocean, the
   ship, the temperatures, the Sun. The first step is at 10:00:00 AM; step n is at 10:00 + (n − 1) minutes, so after n
   steps the air left is 0.99ⁿ of what there was.
   ===================================================================== */

const ATP = (() => {
  const P = {
    p0: 1013.25,              // hPa at sea level before (a standard day)
    k: 0.99,                  // what is left after each step
    ramp: 0.35,               // s: each step is felt as a quick drop
    airC: 27, seaC: 26, poolC: 28, tubC: 39, bodyC: 37,    // °C
    passengers: 3100, crew: 1200,
    land: [17.07, -25.17],    // the nearest land (Santo Antão, Cape Verde)
    tanks: 6, tankL: 12, tankBar: 200,      // the dive shop's tanks: 12 litres at 200 bar = 2,400 litres of air each
    sac: [14, 9],             // litres a minute at 1 bar, breathing slowly in warm water: you, her (a 9-year-old)
    rhoSea: 1025, g: 9.81,
    tip: 870,                 // hPa: the lowest sea-level pressure ever measured (Typhoon Tip, 1979)
    cabinAlt: 2438,           // m: an airliner's cabin is kept no thinner than 8,000 ft
    everest: 8849,            // m
    o2Limit: 13700,           // m (45,000 ft): above this, breathing pure oxygen no longer keeps you conscious
    tucS: 15,                 // s: time of useful consciousness at 45,000–50,000 ft (9–15 s)
  };
  // the ISA pressure altitude (m) of a pressure (hPa): the height on a standard day where the air is this thin
  P.alt = (hPa) => {
    const L = [[0, 288.15, -0.0065, 101325], [11000, 216.65, 0, 22632.1], [20000, 216.65, 0.001, 5474.89], [32000, 228.65, 0.0028, 868.019], [47000, 270.65, 0, 110.906]];
    const g = 9.80665, M = 0.0289644, R = 8.3144598, pa = hPa * 100;
    if (pa >= 101325) return 0;
    for (let i = L.length - 1; i >= 0; i--) { const [h0, T0, lr, p0] = L[i]; if (pa <= p0) return lr === 0 ? h0 - R * T0 / (g * M) * Math.log(pa / p0) : h0 + T0 / lr * (Math.pow(pa / p0, -R * lr / (g * M)) - 1); }
    return 0;
  };
  // water's vapour pressure (hPa) at T °C (Antoine, 1–100 °C): it boils where the air is thinner than this
  P.pvap = (T) => Math.pow(10, 8.07131 - 1730.63 / (233.426 + T)) * 1.33322;
  // the first step after which the air is thinner than hPa → its story time
  P.stepBelow = (hPa) => { const n = Math.ceil(Math.log(hPa / P.p0) / Math.log(P.k) + 1e-9); return (n - 1) * 60; };
  P.stepAboveAlt = (m) => { let n = 0; while (P.alt(P.p0 * Math.pow(P.k, n)) < m) n++; return (n - 1) * 60; };
  // the steps taken by story time s (fractional during each step's quick drop)
  P.steps = (s) => { if (s < 0) return 0; const n = Math.floor(s / 60), u = (s - 60 * n) / P.ramp; return n + (u >= 1 ? 1 : u * u * (3 - 2 * u)); };
  P.air = (s) => Math.pow(P.k, P.steps(s));               // the share of the air left (1 = all of it)
  P.hpa = (s) => P.p0 * P.air(s);
  P.altAt = (s) => P.alt(P.hpa(s));
  P.next = (s) => (s < 0 ? -s : 60 - (s % 60));            // seconds to the next step
  P.boilS = (T) => P.stepBelow(P.pvap(T));
  P.kmToLand = (() => { const r = Math.PI / 180, a = AT_F.lat * r, b = P.land[0] * r, dl = (P.land[1] - AT_F.lon) * r; const x = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(dl / 2) ** 2; return 2 * 6371 * Math.asin(Math.sqrt(x)); })();
  P.tonnes = P.p0 * 100 / P.g / 1000;                    // the air over a square metre (t)
  P.climb1 = P.alt(P.p0 * P.k);                           // the first 1% as height (m)
  P.seaBar = (d) => P.rhoSea * P.g * d / 1e5;             // the water's own weight at depth d (bar)
  P.oneAtmDepth = 101325 / (P.rhoSea * P.g);              // m of seawater that weigh as much as the whole sky
  return P;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE EVENTS (story s)
// ---------------------------------------------------------------------------------------------------------------------
const ATE = (() => {
  const P = ATP, E = {};
  E.tip = P.stepBelow(P.tip);                    // the barometer below Typhoon Tip (10:15)
  E.cabin = P.stepAboveAlt(P.cabinAlt);          // as thin as an airliner's cabin (10:29)
  E.half = P.stepBelow(P.p0 / 2);                // half the air gone (11:08)
  E.everest = P.stepAboveAlt(P.everest);         // 11:56
  E.o2 = P.stepAboveAlt(P.o2Limit);              // 1:11 PM
  E.tub = P.boilS(P.tubC); E.body = P.boilS(P.bodyC); E.pool = P.boilS(P.poolC); E.sea = P.boilS(P.seaC);
  E.balloonPop = atHMS(10, 30);                  // her balloon bursts on the 10:30 step (it was blown up near its limit)
  E.choke = atHMS(11, 7, 20);                    // the diesels start to smoke black (on screen from the 11:08 step)
  E.blackout = atHMS(11, 13);                    // the generators trip: the ship goes dark and dead
  E.roll = atSC('dive', 1, 1.3);                 // you go in, backwards off the marina, holding her
  E.deep = E.roll + 64;                          // you two at 10 m
  E.youOut = atHMS(11, 27, 40);                  // when you'd have passed out up there (working hard at ~6,800 m)
  E.letGo = atSC('rise', 0, 0.0);                // she lets go of the line
  E.catch = atSC('rise', 2, 0.25);               // you catch her fin
  return E;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE TANKS: six 12-litre tanks at 200 bar, two of you breathing slowly at 10.1 m. What you breathe is at the
// pressure round you: the water's weight (1.02 bar) plus whatever air is left on top. → when the last one runs out
// ---------------------------------------------------------------------------------------------------------------------
const ATK = (() => {
  const P = ATP, F = AT_F, total = P.tanks * P.tankL * P.tankBar, sac = P.sac[0] + P.sac[1];
  const amb = (s) => P.seaBar(F.depth) + P.hpa(s) / 1000;
  // litres used from E.deep to s (a minute at a time, then the remainder); the descent breathes at about half depth
  const used = (s) => { let L = 0, t = ATE.roll; while (t < s) { const d = Math.min(60, s - t), a = t < ATE.deep ? 1 + 0.5 * (amb(t) - 1) : amb(t); L += sac * a * d / 60; t += d; } return L; };
  let s = ATE.roll, L = 0; while (L < total) { L += sac * amb(s) / 60 * 60; s += 60; }
  const out = s - 60 + 60 * (1 - (L - total) / (sac * amb(s - 60)));
  return { total, sac, amb, used, out, left: (s0) => Math.max(0, total - used(s0)), tankNo: (s0) => Math.min(P.tanks, 1 + Math.floor(used(s0) / (total / P.tanks))) };
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE SHIP'S SPEED (m/s through the water) and how far the sea has run past it (m)
// ---------------------------------------------------------------------------------------------------------------------
const ATV = (() => {
  const E = ATE, v0 = AT_F.speed0, vChoke = 6.0, vDrift = 0.25;
  const v = (s) => {
    if (s < E.choke) return v0;
    if (s < E.blackout) return MathX.lerp(v0, vChoke, MathX.smooth(s, E.choke, E.blackout));
    const k = 1 / 160;                                   // drag: coasting from 6 m/s, down to ~1 m/s in 13 minutes
    return Math.max(vDrift, vChoke / (1 + vChoke * k * (s - E.blackout)));
  };
  // ∫ v ds, tabulated each second from 30 s before the start (pure, fast)
  const s0 = -30, N = 20000, X = new Float64Array(N + 1); for (let i = 1; i <= N; i++) X[i] = X[i - 1] + 0.5 * (v(s0 + i - 1) + v(s0 + i));
  const dist = (s) => { const x = MathX.clamp(s - s0, 0, N - 1e-6), i = Math.floor(x); return X[i] + (X[i + 1] - X[i]) * (x - i) + (s - s0 > N ? v(s) * (s - s0 - N) : 0); };
  return { v, dist };
})();

// ---------------------------------------------------------------------------------------------------------------------
// HOW THE WORLD LOOKS AND SOUNDS AT AIR SHARE a (1 … 0): sky brightness (thin-sky scattering ∝ the air), the horizon's
// band (a long path through the air: it stays bright longest), the sky's blue getting deeper, stars, how loud the
// world's sounds are (a sound's pressure ∝ the air's density, so its level falls 20·log10(a) dB)
// ---------------------------------------------------------------------------------------------------------------------
const ATL = {
  zenith: (a) => a,                                      // the sky overhead (scattered light ∝ the air above)
  horizon: (a) => 1 - Math.exp(-3.2 * a) * 1.0,          // the low sky, through 30× more air (saturated until it's thin)
  stars: (a) => MathX.smooth(-Math.log(Math.max(a, 1e-4)), -Math.log(0.075), -Math.log(0.04)),   // visible from ~6 % down
  loud: (a) => a,                                         // sound pressure (amplitude) of the world's own sounds
  sunK: (a) => 1 + 0.12 * (1 - a),                        // direct sunlight: a little stronger with no air to scatter it
};

if (typeof module !== 'undefined') module.exports = { ATP, ATE, ATK };
