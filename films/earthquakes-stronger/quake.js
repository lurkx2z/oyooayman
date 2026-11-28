/* =====================================================================
   QUAKE — the rule and the master clock of "What If Earthquakes Got 1 Magnitude Stronger Every Minute?"
   (classic script: globals). The film runs in REAL TIME: from the first tick (EQ.tick0, film seconds) one film second
   is one story second, and every minute every earthquake on Earth gets one magnitude stronger and none of them stops.
     yours        under San Francisco, magnitude 3 in minute 1 … magnitude 12 in minute 10 (stepwise, on each tick)
     the others   a new little one (magnitude 2) starts somewhere on Earth every 20 s (real rate of M2+: about one
                  every 22 s, USGS); each one also gains a magnitude every minute after it starts
     energy       log10 E = 1.5 M + 4.8 (joules, USGS / Gutenberg–Richter): one magnitude = 31.6×, two = 1,000×
     the crack    grows from the epicentre along its fault at 5 km/s (the fastest real ruptures, "supershear"), up to
                  the length real quakes of that size break (Wells & Coppersmith 1994: log10 L km = −3.55 + 0.74 M);
                  from magnitude 10 there is no real length (no fault on Earth is long enough), so it just keeps going
   Everything is a pure function of film time t (or story time s = t − EQ.tick0).
   ===================================================================== */

const EQ = { tick0: EQN.tick0, end: EQN.duration, clock0: 9 * 3600 + 55 * 60 + 20 };   // your clock at minute one: 9:55:20 AM
const eqS = (t) => t - EQ.tick0;                                     // story seconds
const eqMinOf = (s) => Math.floor(s / 60) + 1;                       // minute 1 … (s < 0: minute 0)
const eqMagOf = (s) => 2 + eqMinOf(s);                               // your magnitude
const eqE = (M) => Math.pow(10, 1.5 * M + 4.8);                      // joules
const EQ_TNT = 4.184e9;                                              // joules in a ton of TNT

// the clips: their first word, a word, their last word (narration-timing.js)
const EQN_ID = Object.fromEntries(EQN.clips.map((c) => [c.id, c]));
function eqClip(id) { const c = EQN_ID[id]; if (!c) throw new Error('no narration clip ' + id); return c; }
const eqW = (id, k = 0) => { const c = eqClip(id); return c.words[Math.min(k, c.words.length - 1)].start; };
const eqWE = (id, k) => { const c = eqClip(id); return c.words[Math.min(k, c.words.length - 1)].end; };
const eqE_ = (id) => eqClip(id).speechEnd;                           // the last word ends
function eqWord(id, text, i = 0) { const c = eqClip(id), m = c.words.filter((w) => w.text.toLowerCase().replace(/[^a-z0-9']/g, '') === text.toLowerCase()); if (!m[i]) throw new Error(`no word "${text}" in ${id}`); return m[i]; }
const eqTick = (k) => EQ.tick0 + 60 * (k - 1);                       // film time minute k starts

// ---- the status word (one per magnitude) and its colour class
const EQ_STATUS = { 3: ['FELT', ''], 4: ['SHAKING', ''], 5: ['STRONG', 'warm'], 6: ['DANGEROUS', 'hot'], 7: ['DEADLY', 'hot'], 8: ['DEADLY', 'hot'],
  9: ['HISTORIC', 'hot'], 10: ['OFF THE SCALE', 'max'], 11: ['OFF THE SCALE', 'max'], 12: ["CAN'T STOP", 'max'] };

// ---- how hard the ground shakes where you are (a picture scale, metres of ground motion) and how fast
const EQ_AMP = { 2: 0, 3: 0.003, 4: 0.012, 5: 0.035, 6: 0.08, 7: 0.16, 8: 0.28, 9: 0.45, 10: 0.8, 11: 1.3, 12: 2.0 };
const EQ_HZ = { 2: 6, 3: 7, 4: 5, 5: 3.5, 6: 2.4, 7: 1.6, 8: 1.1, 9: 0.8, 10: 0.6, 11: 0.45, 12: 0.35 };
// the level at story time s: each tick lands as a jolt (a 2.2× overshoot that settles in ~1.5 s), the level breathes
// with slow noise; before minute one, nothing
function eqLevel(s) {
  if (s < 0) return 0;
  const k = eqMinOf(s), M = 2 + k, a = EQ_AMP[Math.min(12, M)], a0 = EQ_AMP[Math.min(12, M - 1)] || 0, u = s - 60 * (k - 1);
  const ramp = a0 + (a - a0) * MathX.smooth(u, 0, 0.35);
  return ramp * (1 + 1.2 * Math.exp(-u / 1.4)) * (0.82 + 0.3 * (0.5 + 0.5 * noise1(s * 0.21, 41)));
}
// ground motion (m) at story time s, at a place `ph` seconds behind the waves (pure): [east, up, south]
function eqGround(s, ph = 0, seed = 1) {
  const L = eqLevel(s - ph); if (!(L > 0)) return [0, 0, 0];
  const M = Math.min(12, eqMagOf(s - ph)), f = EQ_HZ[M], q = (s - ph) * f;
  const n = (o) => noise1(q * 1.0 + o, seed + o) * 0.65 + noise1(q * 2.3 + o * 3, seed + o * 7) * 0.35;
  return [L * n(0), L * 0.55 * n(11), L * n(23)];
}

// ---- the world's earthquakes: { id, name, lat, lon, s0 (story second it starts), m0, az (its fault's bearing) }
// Yours is magnitude 3 at s = 0; then a new magnitude-2 one every 20 s, in the world's busiest earthquake zones.
const EQ_QUAKES = (() => {
  const L = [
    ['sf', 'SAN FRANCISCO', 37.79, -122.39, 0, 3, 0],
    ['seattle', 'SEATTLE', 47.6, -122.4, 20, 2, 10],
    ['nevada', 'NEVADA', 36.2, -114.8, 40, 2, 20],
    ['zagros', 'IRAN (ZAGROS)', 27.3, 55.8, 60, 2, 125],
    ['la', 'LOS ANGELES', 34.05, -118.3, 80, 2, 115],
    ['tokyo', 'TOKYO', 35.65, 139.85, 100, 2, 30],
    ['istanbul', 'ISTANBUL', 40.85, 28.9, 120, 2, 80],
    ['mexico', 'MEXICO CITY', 19.4, -99.1, 140, 2, 100],
    ['sumatra', 'SUMATRA', 2.0, 97.0, 160, 2, 140], ['chile', 'CHILE', -33.0, -71.9, 180, 2, 5], ['alaska', 'ALASKA', 60.0, -150.0, 200, 2, 60],
    ['philippines', 'PHILIPPINES', 12.0, 125.5, 220, 2, 160], ['peru', 'PERU', -12.0, -77.5, 240, 2, 150], ['nz', 'NEW ZEALAND', -41.5, 174.3, 260, 2, 40],
    ['tehran', 'NORTHERN IRAN', 36.0, 52.0, 280, 2, 100], ['taiwan', 'TAIWAN', 23.8, 121.6, 300, 2, 15], ['nepal', 'NEPAL', 28.2, 84.7, 320, 2, 110],
    ['italy', 'ITALY', 42.4, 13.4, 340, 2, 140], ['greece', 'GREECE', 38.2, 22.0, 360, 2, 120], ['kamchatka', 'KAMCHATKA', 53.0, 160.0, 380, 2, 35],
    ['tonga', 'TONGA', -20.0, -174.5, 400, 2, 20], ['atlantic', 'MID-ATLANTIC RIDGE', 15.0, -45.5, 420, 2, 0], ['png', 'PAPUA NEW GUINEA', -5.5, 151.5, 440, 2, 70],
    ['aleutians', 'ALEUTIANS', 51.5, -177.0, 460, 2, 80], ['guatemala', 'GUATEMALA', 13.9, -91.2, 480, 2, 120], ['sendai', 'JAPAN', 38.3, 142.4, 500, 2, 15],
    ['southatl', 'SOUTH ATLANTIC', -40.0, -16.5, 520, 2, 0], ['hindukush', 'AFGHANISTAN', 36.5, 70.8, 540, 2, 40], ['epr', 'EAST PACIFIC RISE', -15.0, -112.5, 560, 2, 5],
    ['vanuatu', 'VANUATU', -16.5, 167.8, 580, 2, 165],
  ];
  return L.map(([id, name, lat, lon, s0, m0, az]) => ({ id, name, lat, lon, s0, m0, az }));
})();
const EQ_Q = Object.fromEntries(EQ_QUAKES.map((q) => [q.id, q]));
function eqQMag(q, s) { if (typeof q === 'string') q = EQ_Q[q]; return s < q.s0 ? null : q.m0 + Math.floor((s - q.s0) / 60); }
// the crack's half-length (km) at story time s: grows at 5 km/s towards the length real quakes of that size break
const EQ_VRUP = 5.0;
const eqRupTarget = (M) => (M >= 10 ? Infinity : 0.5 * Math.pow(10, -3.55 + 0.74 * M));
function eqRupture(q, s) {
  if (typeof q === 'string') q = EQ_Q[q];
  if (s <= q.s0) return 0;
  let h = 0, u = q.s0;
  for (let k = 0; u < s; k++) {
    const u1 = Math.min(s, q.s0 + 60 * (k + 1)), T = eqRupTarget(q.m0 + k);
    h = Math.min(T, h + EQ_VRUP * (u1 - u)); u = u1;
  }
  return h;
}

// ---- your crack: from the epicentre (under the Embarcadero) both ways, joining the San Andreas fault, then along it
// south to the Gulf of California and north up the coast and along the Cascadia subduction zone (lat, lon)
const EQ_FAULT = {
  north: [[37.7925, -122.3915], [37.797, -122.41], [37.803, -122.44], [37.8095, -122.476], [37.79, -122.55], [37.91, -122.69], [38.07, -122.81], [38.3, -123.05],
    [38.52, -123.25], [38.95, -123.74], [40.03, -124.07], [40.37, -124.6], [41.5, -125.0], [43.0, -125.2], [44.5, -125.2], [46.0, -125.1], [47.5, -125.6], [48.6, -126.3], [49.5, -127.6], [51.0, -130.0], [53.5, -133.5]],
  south: [[37.7925, -122.3915], [37.775, -122.42], [37.74, -122.46], [37.667, -122.495], [37.58, -122.42], [37.49, -122.33], [37.37, -122.2], [37.12, -121.88],
    [36.85, -121.53], [35.9, -120.43], [35.72, -120.29], [35.2, -119.8], [34.8, -118.9], [34.55, -118.1], [34.36, -117.63], [34.3, -117.45], [34.15, -117.2],
    [33.72, -116.22], [33.35, -115.73], [32.85, -115.57], [32.62, -115.45], [31.8, -114.8], [30.5, -113.5], [28.0, -111.5], [25.0, -109.5], [22.5, -107.5]],
};
const eqKmLL = (a, b) => { const R = 6371, p1 = a[0] * Math.PI / 180, p2 = b[0] * Math.PI / 180, dp = p2 - p1, dl = (b[1] - a[1]) * Math.PI / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
// the distance (km) along a branch to its point nearest a place
function eqAlong(branch, ll) {
  const P = EQ_FAULT[branch]; let acc = 0, best = 1e9, at = 0;
  for (let i = 0; i < P.length; i++) { const d = eqKmLL(P[i], ll); if (d < best) { best = d; at = acc; } if (i < P.length - 1) acc += eqKmLL(P[i], P[i + 1]); }
  return at;
}
// the part of a branch broken by half-length h (km): the polyline cut at h
function eqBranchCut(branch, h) {
  const P = EQ_FAULT[branch], out = [P[0]]; let acc = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const d = eqKmLL(P[i], P[i + 1]);
    if (acc + d >= h) { const u = (h - acc) / d; out.push([P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u]); return out; }
    acc += d; out.push(P[i + 1]);
  }
  return out;
}

// ---- clocks: yours (Pacific Daylight Time, a Saturday in early October) and the world's
function eqClock(s, utcOff = -7) {
  let x = EQ.clock0 + s + (utcOff + 7) * 3600; x = ((x % 86400) + 86400) % 86400;
  const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), ap = h >= 12 ? 'PM' : 'AM', h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

// ---- the numbers the narrator says, checked against the code (the page refuses to run if one is wrong)
const EQ_CHECKS = (() => {
  const bad = [], out = [];
  const near = (what, v, want, tol) => { out.push([what, v, want]); if (!(Math.abs(v - want) <= tol)) bad.push(`${what}: ${v} (want ${want} ± ${tol})`); };
  const yes = (what, ok) => near(what, ok ? 1 : 0, 1, 0);
  const sOf = (id) => eqW(id) - EQ.tick0, sEnd = (id) => eqE_(id) - EQ.tick0;
  const magAt = (id) => eqMagOf(sOf(id));
  // every "Minute N. Magnitude M." clip starts in its minute
  for (let k = 1; k <= 10; k++) near(`clip m${k} is in minute ${k}`, eqMinOf(sOf('m' + k)), k, 0);
  near('the cold open is magnitude twelve (the last minute)', eqMagOf(EQ.end - EQ.tick0 - 0.1), 12, 0);
  near('one magnitude is about 32 times the energy', eqE(4) / eqE(3), 31.6, 0.1);
  near('two magnitudes are a thousand times', eqE(5) / eqE(3), 1000, 1);
  near('magnitude 3 ≈ a bolt of lightning (1–5 billion joules)', eqE(3) / 1e9, 2.0, 1.5);
  yes('California: several hundred quakes above magnitude 3 a year (southern California alone, USGS)', true);
  yes('magnitude 4 (15 t of TNT) beats the biggest non-nuclear bomb used in war (MOAB, 11 t)', eqE(4) / EQ_TNT > 11);
  near('magnitude 5 ≈ 500 tons of TNT', eqE(5) / EQ_TNT, 476, 30);
  near('magnitude 6 ≈ Hiroshima (15 kilotons)', eqE(6) / EQ_TNT / 1e3, 15, 1.5);
  near('magnitude 7 = Haiti 2010 (7.0)', magAt('haiti'), 7, 0);
  yes('magnitude 8 is stronger than San Francisco 1906 (7.9)', magAt('y1906') > 7.9);
  near('magnitude 8 ≈ 15 megatons (Castle Bravo, 15 Mt)', eqE(8) / EQ_TNT / 1e6, 15, 1.5);
  yes('magnitude 9 ≈ Japan 2011 (9.0–9.1)', magAt('japan') === 9);
  near('magnitude 9 ≈ ten Tsar Bombas (50 Mt)', eqE(9) / EQ_TNT / 50e6, 9.5, 0.8);
  yes('magnitude 10 beats Chile 1960 (9.5), the strongest ever recorded', magAt('never2') > 9.5);
  near('magnitude 10 ≈ a month of all human energy use (~620 EJ a year)', eqE(10) / (620e18 / 12), 1.2, 0.3);
  near('magnitude 11 ≈ three years of human energy use', eqE(11) / 620e18, 3.2, 0.3);
  near('magnitude 12 ≈ four days of all the sunlight on Earth (1.74e17 W)', eqE(12) / (1.74e17 * 86400), 4.2, 0.3);
  yes('magnitude 12 is still below the dinosaur-killer impact (~3–4 × 10^23 J); 13 passes it', eqE(12) < 3e23 && eqE(13) > 4.2e23 && eqE(13) > 1.3e24);
  yes('magnitude 19 (seven more minutes after minute ten) beats Earth\'s binding energy (~2.5 × 10^32 J); 18 does not', eqE(19) > 2.5e32 && eqE(18) < 2.5e32);
  yes('boiling every ocean (~3.7 × 10^27 J) falls between magnitude 15 and 16', eqE(15) < 3.7e27 && eqE(16) > 3.7e27);
  // the helicopter: the tour "leaves in three minutes" (said in minute 2) and lifts off in minute 5
  near('the tour leaves about three minutes after the line', (sOf('lift') - sOf('tour')) / 60, 2.75, 0.4);
  yes('the helicopter starts up across two ticks (two more magnitudes)', eqMagOf(sOf('lift')) - eqMagOf(sOf('run')) === 2);
  near('the café was six minutes ago (minute one)', (sOf('cafe') - 30) / 60, 6, 0.5);
  // the world: a new one every 20 s; their magnitudes when the narrator names them
  near('Los Angeles is at magnitude seven', eqQMag('la', sOf('la')), 7, 0); near('… to the end of its line', eqQMag('la', sEnd('la') + 2), 7, 0);
  near('Mexico City is at magnitude six', eqQMag('mexico', sOf('mexico')), 6, 0); near('… to the end of its line', eqQMag('mexico', sEnd('mexico') + 2), 6, 0);
  near('two dozen earthquakes by the line', EQ_QUAKES.filter((q) => q.s0 <= sOf('dozens')).length, 24, 3);
  // the crack, when the narrator says "from Los Angeles to Oregon" (the San Andreas passes Los Angeles at Palmdale;
  // Oregon starts at 42° N)
  const h = eqRupture('sf', sOf('crack'));
  yes(`the crack reaches the Los Angeles area (half-length ${h.toFixed(0)} km)`, h > eqAlong('south', [34.55, -118.1]));
  yes('… and Oregon', h > eqAlong('north', [42.0, -125.1]));
  yes('… but not Mexico yet', h < eqAlong('south', [32.62, -115.45]));
  // Tokyo is in the small hours: 10:03 AM in San Francisco (PDT, UTC−7) is 2 AM in Tokyo (UTC+9)
  yes('Tokyo: two in the morning', /^2:\d\d AM$/.test(eqClock(sOf('tokyo'), 9)));
  if (bad.length) throw new Error('quake.js: ' + bad.join(' · '));
  return out;
})();
