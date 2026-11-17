/* =====================================================================
   PHYSICS — every number the captions say, and where everything is at story time s (seconds after 8:52:00 PM, when
   sound starts travelling at 1,000,000 km/s). Pure functions of s. script.js checks each caption's number against these.
     SFP         the constants (sound then and now, light, steel, your ears, a bat, the corn, the tornado)
     SF_STRIKES  every lightning strike (where, when, how long its channel is, its flicker)
     SFE         the story's moments (placed on the captions through the clock)
     SFY you · SFK your daughter · SFD the dog · SFN the tornado · SFC the sheriff's car
   ===================================================================== */

const SFP = (() => {
  const P = {};
  P.air = SF_F.air;                                  // °C
  P.c0 = 331.3 * Math.sqrt(1 + P.air / 273.15);      // the speed of sound before: 343.2 m/s at 20 °C
  P.c1 = 1e9;                                        // ★ after 8:52:00 PM: 1,000,000 km/s
  P.light = 299792458;                               // m/s
  P.timesLight = P.c1 / P.light;                     // 3.34
  P.sPerKm = 1000 / P.c0;                            // 2.91 s for every km (the flash-to-bang count: "3 seconds a kilometre")
  // to carry sound at c1, air (1.204 kg/m³) would need a bulk modulus ρc²: compared with steel's 160 GPa
  P.rho = 1.204; P.steelK = 160e9;
  P.stiff = P.rho * P.c1 * P.c1 / P.steelK;          // 7.5 million
  // your ears: the gap between them for a sound from one side (Woodworth's formula, head radius 8.75 cm)
  P.headR = 0.0875;
  P.itd = (c) => P.headR / c * (Math.PI / 2 + 1);
  P.itd0 = P.itd(P.c0);                              // 0.656 thousandths of a second
  P.itd1 = P.itd(P.c1);                              // 0.22 billionths
  P.itdMin = 10e-6;                                  // the smallest gap a brain can use: about 10 millionths of a second
  P.itdTimes = P.itdMin / P.itd1;                    // 44,000
  P.voiceF = 300;                                    // Hz: a 9-year-old's voice
  P.voiceLambda = P.c1 / P.voiceF;                   // 3,333 km
  P.batMm = P.c0 / 2 * 0.001;                        // a bat's echo: 1 thousandth of a second for every 17 cm
  P.cornH = SF_F.cornH;                              // 2.4 m in late July
  P.inflow = 90;                                     // km/h, the wind rushing in towards the tornado, near it
  P.carryV = 2.4;                                   // m/s: you, running with her in your arms over flattened corn
  P.tornadoV = 16.7;                                 // m/s: 60 km/h, east-north-east
  P.runV = 2.28;                                     // m/s: you, running blind through 2.4 m corn
  P.phoneLag = 0.25;                                 // s: a phone call's delay (the network and the codecs)
  return P;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE STORY'S MOMENTS (story s), placed on the captions
// ---------------------------------------------------------------------------------------------------------------------
const SFE = (() => {
  const E = {}, S = sfSC, st = sfStoryAt;
  E.on = 0;                                          // ★ 8:52:00 PM
  E.walk = [6, S('call', 0, -1.8)];                  // you walk from the porch to the corn, looking for her (there before you call)
  E.call = S('call', 0, 3.4);                        // you call her name (heard by her 0.0000001 s later)
  E.answer = S('answer', 0, -1.4);                   // she calls back
  E.away = [S('head', 2, -1.6), S('head', 2, 6.0)];  // you walk north along the corn: the wrong way
  E.back = [S('far', 1, 0.5), S('siren', 0, -1.0)];  // you walk back down the edge (heard: the train, the dogs)
  E.train = S('far', 0, 2.6);                        // the freight train's horn, 11 km away
  E.dogs = S('far', 1, -0.6);                        // the Hansens' dogs
  E.siren = S('siren', 0, -1.6);                     // the town's tornado sirens start
  E.sheriff = S('siren', 1, 2.2);                    // the sheriff's car passes the end of your drive
  E.tornado = S('tornado', 0, -1.8);                 // ★ a flash shows the tornado
  E.dial = S('phone', 0, -1.2);                      // you call her phone
  E.pickUp = S('phone', 1, -0.9);                    // she answers
  E.run = st(sfB('corn'));                           // you run into the corn (just after the clock's jump)
  E.yardHit = S('strike', 0, -0.5);                  // ★ lightning hits the yard light
  E.hansen = S('neighbour', 0, -1.4);                // the tornado's centre passes the Hansen farm (150 m beside it)
  E.found = S('found', 0, -0.25);                    // a flash: her raincoat, 6 m away
  E.hold = S('found', 1, -1.2);                      // you have her
  return E;
})();

// ---------------------------------------------------------------------------------------------------------------------
// A MOVER: a path of legs [{ s0, s1, a: [x, z], b: [x, z], state, ease }] (still between legs); at(s) → { x, z, yaw,
// state, v, d (distance along everything so far) }
// ---------------------------------------------------------------------------------------------------------------------
function sfMover(legs, o = {}) {
  const L = legs.map((g) => Object.assign({ len: sfDist(g.a, g.b) }, g));
  let acc = 0; for (const g of L) { g.d0 = acc; acc += g.len; }
  const yawOf = (g) => Math.atan2(g.b[0] - g.a[0], g.b[1] - g.a[1]);
  const M = {
    legs: L,
    at(s) {
      let g = L[0];
      if (s <= g.s0) return { x: g.a[0], z: g.a[1], yaw: g.yaw0 ?? yawOf(g), state: o.idle0 || 'stand', v: 0, d: 0 };
      for (let i = 0; i < L.length; i++) {
        g = L[i];
        if (s < g.s0) { const p = L[i - 1]; return { x: p.b[0], z: p.b[1], yaw: p.yaw1 ?? yawOf(p), state: p.rest || 'stand', v: 0, d: p.d0 + p.len }; }
        if (s <= g.s1) {
          // (a trapezoid of speed: up to speed over the first 12 %, down over the last 12 %, unless the leg is 'lin')
          const u = (s - g.s0) / (g.s1 - g.s0), A = 0.12, vm = 1 / (1 - A);
          const k = g.ease === 'lin' ? u : u < A ? vm * u * u / (2 * A) : u > 1 - A ? 1 - vm * (1 - u) * (1 - u) / (2 * A) : vm * (u - A / 2);
          const vMean = g.len / (g.s1 - g.s0), v = g.ease === 'lin' ? vMean : vMean * vm * (u < A ? u / A : u > 1 - A ? (1 - u) / A : 1);
          const wob = g.wob ? g.wob * Math.sin(k * g.len / 6.0 + g.s0) * Math.sin(Math.PI * k) : 0, n = [-(g.b[1] - g.a[1]) / (g.len || 1), (g.b[0] - g.a[0]) / (g.len || 1)];
          return { x: g.a[0] + (g.b[0] - g.a[0]) * k + n[0] * wob, z: g.a[1] + (g.b[1] - g.a[1]) * k + n[1] * wob, yaw: yawOf(g), state: g.state || 'walk', v, d: g.d0 + g.len * k };
        }
      }
      const p = L[L.length - 1];
      return { x: p.b[0], z: p.b[1], yaw: p.yaw1 ?? yawOf(p), state: p.rest || 'stand', v: 0, d: p.d0 + p.len };
    },
    dist(s) { return M.at(s).d; },
    speed(s) { return M.at(s).v; },
  };
  return M;
}

// ---------------------------------------------------------------------------------------------------------------------
// WHERE: you at the corn's edge, your daughter in the corn (K), the tornado's track through her
// ---------------------------------------------------------------------------------------------------------------------
const SF_PLACES = (() => {
  const F = SF_F, Q = {};
  Q.lawn = [-16, 24];                                         // the lawn by the tyre swing, west of the house: where you are at 8:52
  Q.swing = [-23.6, 18.5];                                    // where she was playing
  Q.round = [-33, 6];                                         // (your way round the house and the storm cellar)
  Q.edge = [F.field.westX + 1.8, -18];                       // E1: where you stand at the corn's edge, calling
  Q.north = [F.field.westX + 1.8, -38];                      // the wrong way (north along the edge)
  Q.kid = (() => { const d = sfDirOf(262); return [Q.edge[0] + 120 * d[0], Q.edge[1] + 120 * d[1]]; })();   // K: 120 m west of you
  Q.kidIn = [F.field.westX - 0.5, -10];                      // where she ran into the corn
  Q.track = sfDirOf(68);                                     // the tornado's heading: east-north-east (68°)
  Q.hansenD = 1300;                                          // the Hansen farm: on the track, this far before K
  Q.hansenSide = 150;                                        // …and this far to the north of it: the funnel passes beside the farm and its winds
  Q.hansen = (() => { const sd = sfDirOf(338); return [Q.kid[0] - Q.track[0] * Q.hansenD + sd[0] * Q.hansenSide, Q.kid[1] - Q.track[1] * Q.hansenD + sd[1] * Q.hansenSide]; })();   // tear it apart (you see it next to the funnel, not inside it)
  return Q;
})();

// ---------------------------------------------------------------------------------------------------------------------
// YOU: the porch at the title; across the yard to the corn; north along it (the wrong way); back; then (after the
// clock's jump) into the corn, along the rows, to her
// ---------------------------------------------------------------------------------------------------------------------
const SFY = (() => {
  const Q = SF_PLACES, E = SFE, P = SFP;
  const toKid = [Q.kid[0] - Q.edge[0], Q.kid[1] - Q.edge[1]], Lk = Math.hypot(...toKid), u = [toKid[0] / Lk, toKid[1] / Lk];
  // the run: from the edge, along a row (west), crossing rows now and then; you stop 1.0 m short of her
  const stop = 1.0, runEnd = E.run + (Lk - stop) / P.runV;
  const mid1 = [Q.edge[0] + u[0] * 40, Q.edge[1] + u[1] * 40 + 0.9], mid2 = [Q.edge[0] + u[0] * 85, Q.edge[1] + u[1] * 85 - 0.5], fin = [Q.kid[0] - u[0] * stop, Q.kid[1] - u[1] * stop];
  const d1 = sfDist(Q.edge, mid1), d2 = sfDist(mid1, mid2), d3 = sfDist(mid2, fin), dd = d1 + d2 + d3, T = (dd) / P.runV;
  const s1 = E.run + T * d1 / dd, s2 = s1 + T * d2 / dd, s3 = E.run + T;
  const M = sfMover([
    ...(() => { const a = sfDist(Q.lawn, Q.round), b = sfDist(Q.round, Q.edge), m = E.walk[0] + (E.walk[1] - E.walk[0]) * a / (a + b);
      return [{ s0: E.walk[0], s1: m, a: Q.lawn, b: Q.round, state: 'walk', ease: 'lin' }, { s0: m, s1: E.walk[1], a: Q.round, b: Q.edge, state: 'walk', rest: 'stand' }]; })(),
    { s0: E.away[0], s1: E.away[1], a: Q.edge, b: Q.north, state: 'walk', rest: 'stand' },
    { s0: E.back[0], s1: E.back[1], a: Q.north, b: Q.edge, state: 'walk', rest: 'stand' },
    { s0: E.run, s1: s1, a: Q.edge, b: mid1, state: 'run', ease: 'lin', wob: 0.25 },
    { s0: s1, s1: s2, a: mid1, b: mid2, state: 'run', ease: 'lin', wob: 0.3 },
    { s0: s2, s1: s3, a: mid2, b: fin, state: 'run', ease: 'lin', wob: 0.2, rest: 'kneel' },
  ]);
  M.runEnd = s3; M.u = u; M.fin = fin;
  void runEnd;
  return M;
})();

// ---------------------------------------------------------------------------------------------------------------------
// YOUR DAUGHTER (9, a yellow raincoat) and THE DOG: across the yard after it, into the corn; then crouched with it at K
// ---------------------------------------------------------------------------------------------------------------------
const SFK = sfMover([
  { s0: -6.0, s1: 0.8, a: SF_PLACES.swing, b: SF_PLACES.kidIn, state: 'run', ease: 'lin' },
  { s0: 0.8, s1: 44, a: SF_PLACES.kidIn, b: SF_PLACES.kid, state: 'run', ease: 'lin', wob: 1.2, rest: 'crouch' },
]);
const SFD = sfMover([
  { s0: -6.6, s1: -0.6, a: [-20.5, 16], b: [SF_PLACES.kidIn[0] - 0.4, SF_PLACES.kidIn[1] - 1.2], state: 'run', ease: 'lin' },
  { s0: -0.6, s1: 38, a: [SF_PLACES.kidIn[0] - 0.4, SF_PLACES.kidIn[1] - 1.2], b: [SF_PLACES.kid[0] - 0.5, SF_PLACES.kid[1] + 0.45], state: 'run', ease: 'lin', wob: 2.0, rest: 'lie' },
]);

// ---------------------------------------------------------------------------------------------------------------------
// THE TORNADO: a straight track east-north-east through K at 60 km/h; over the Hansen farm at SFE.hansen
// ---------------------------------------------------------------------------------------------------------------------
const SFN = (() => {
  const Q = SF_PLACES, P = SFP, N = {};
  N.sK = SFE.hansen + Q.hansenD / P.tornadoV;                 // when it would reach K
  N.at = (s) => { const u = P.tornadoV * (s - N.sK); return [Q.kid[0] + Q.track[0] * u, Q.kid[1] + Q.track[1] * u]; };
  N.born = SFE.tornado - 70;                                  // it touched down a minute before you saw it
  N.r = (s) => 70 + 25 * MathX.smooth(s - N.born, 0, 140);    // the funnel's radius at the ground (m)
  return N;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE SHERIFF'S CAR: west along the county road at 90 km/h, lights and siren on; past the end of your drive at SFE.sheriff
// ---------------------------------------------------------------------------------------------------------------------
const SFC = { v: 25, at: (s) => ({ x: SF_F.drive.x - SFC.v * (s - SFE.sheriff), z: SF_F.road.z - 1.7, yaw: -Math.PI / 2 }) };

// ---------------------------------------------------------------------------------------------------------------------
// THE LIGHTNING. Every strike: { s, x, z, d (from the farm, m), kind ('cg' to the ground | 'ic' in the cloud), top
// (cloud base, m), seed, pulses [[dt s, amp]], len (channel, m), path (for the long one) }. Before 8:52:00 PM the sound
// comes d / 343 s later; after, at once. The ones whose thunder was still in the air at 8:52:00 all land then.
// ---------------------------------------------------------------------------------------------------------------------
const SF_STRIKES = (() => {
  const r = new RNG(7240724), out = [], at = (s, d, brg, o = {}) => { const v = sfDirOf(brg); out.push(Object.assign({ s, x: v[0] * d, z: v[1] * d, d, brg, kind: 'cg', top: 1300, seed: r.int(1, 1e6), amp: 1 }, o)); };
  // ---- before 8:52 PM (thunder in the air at 8:52:00: the first nine)
  for (const [s, d, b] of [[-2.6, 4100, 266], [-6.1, 6000, 248], [-11.0, 9000, 290], [-15.2, 5900, 236], [-19.5, 12000, 300], [-24.0, 10500, 228], [-31.0, 13600, 280], [-37.5, 14200, 254], [-44.0, 16000, 310],
    [-20.2, 3200, 258], [-33.0, 2600, 302], [-50.0, 8000, 270], [-58.0, 12000, 240]]) at(s, d, b, { amp: d < 5000 ? 1 : 0.6 });
  // ---- after: the scripted ones
  at(sfSC('flash', 1, -0.55), 3000, 272, { amp: 1.2, key: 'flash3' });                 // "Now it comes with the flash" (3 km)
  at(sfSC('rumble', 0, -1.7), 1600, 300, { amp: 1.5, key: 'long', top: 1300, spider: 4600 });   // the 6 km bolt
  at(sfSC('tornado', 0, -1.8), 2600, 244, { amp: 1.6, kind: 'ic', top: 1500, key: 'tornado' });  // lights the tornado
  at(SFE.yardHit, 0, 0, { amp: 2.4, key: 'yard', top: 1100 });                                     // the yard light (placed below)
  at(sfSC('neighbour', 0, -1.6), 1500, 250, { amp: 1.6, kind: 'cg', key: 'hansen' });
  at(SFE.found, 900, 205, { amp: 1.5, kind: 'ic', key: 'found' });
  at(sfSC('back', 1, -0.6), 650, 270, { amp: 1.6, key: 'back' });
  at(sfSC('question', 0, -0.3), 400, 236, { amp: 1.8, kind: 'ic', key: 'last' });
  { const y = out.find((k) => k.key === 'yard'); y.x = SF_F.yardLight.x; y.z = SF_F.yardLight.z; y.d = Math.hypot(y.x, y.z); }
  // ---- after: the storm's own (every 5 to 9 s at first, every 2.5 to 4 s once the tornado is near; never closer than 2.1 s to another)
  const keyS = out.filter((k) => k.s > 0).map((k) => k.s);
  for (let s = 2.0; s < 330;) {
    const late = MathX.smooth(s, 160, 260), gap = MathX.lerp(r.range(5, 9), r.range(2.6, 4.2), late);
    if (!keyS.some((k) => Math.abs(k - s) < 2.1)) {
      const d = MathX.lerp(r.range(2500, 9000), r.range(700, 3500), late), b = r.range(215, 330);
      at(s, d, b, { amp: d < 3000 ? 1 : 0.7, kind: r.next() < 0.45 ? 'ic' : 'cg', top: r.range(1100, 1600) });
    }
    s += gap;
  }
  out.sort((a, b) => a.s - b.s);
  // each strike's flicker: return strokes (2 or 3, 40–120 ms apart) and a continuing glow
  for (const k of out) {
    const q = new RNG(k.seed), n0 = q.next() < 0.5 ? 2 : 3, n = k.kind === 'ic' || k.d < 2000 || k.amp >= 1.4 ? 2 : n0;   // (near or bright ones: two strokes at most, for the photosensitive)
    k.pulses = []; let dt = 0;
    for (let i = 0; i < n; i++) { k.pulses.push([dt, i ? q.range(0.45, 0.8) : 1]); dt += q.range(0.05, 0.12); }
    k.dur = dt + 0.25;
    k.y = k.kind === 'ic' ? k.top + 200 : 0;
    // the channel: straight down from the cloud base for a ground strike (+ the horizontal "spider" for the long one)
    k.len = (k.kind === 'cg' ? k.top : 0) + (k.spider || (k.kind === 'ic' ? 2500 : 600));
    // the heard time: before 8:52:00, d / 343 later (or at 8:52:00 if still in the air then); after, at once
    const late = k.d / SFP.c0;
    k.heard = k.s >= 0 ? k.s : Math.min(0, k.s + late);
    k.inAir = k.s < 0 && k.s + late > 0;
  }
  return out;
})();
// the strikes whose thunder was in the air at 8:52:00
SFP.inAir = SF_STRIKES.filter((k) => k.inAir).length;
// the long one: its channel (vertical from the cloud base to the ground, then the spider along the cloud base, away
// from you and across) and the thunder it used to make: from the nearest point to the farthest, at 343 m/s
SFP.longBolt = (() => {
  const k = SF_STRIKES.find((q) => q.key === 'long'), you = SFY.at(k.s), away = [k.x - you.x, k.z - you.z], L = Math.hypot(...away), a0 = [away[0] / L, away[1] / L], th = 0.6, u = [a0[0] * Math.cos(th) - a0[1] * Math.sin(th), a0[0] * Math.sin(th) + a0[1] * Math.cos(th)], pts = [];   // (34° off straight away, so its length shows across the sky)
  for (let i = 0; i <= 60; i++) pts.push([k.x, k.top * i / 60, k.z]);
  for (let i = 1; i <= 200; i++) { const h = k.spider * i / 200; pts.push([k.x + u[0] * h, k.top + 60 * Math.sin(i * 0.11), k.z + u[1] * h]); }
  const ds = pts.map((p) => Math.hypot(p[0] - you.x, p[1] - 1.7, p[2] - you.z));
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
  return { pts, len, near: Math.min(...ds), far: Math.max(...ds), rumble: (Math.max(...ds) - Math.min(...ds)) / SFP.c0, u };
})();
// the flash light at story time s, from strike k (0 … ~1.6): the strokes (sharp) and the glow between them
function sfFlash(k, s) {
  const u = s - k.s; if (u < -0.01 || u > k.dur + 0.4) return 0;
  let v = 0;
  for (const [dt, a] of k.pulses) { const w = u - dt; if (w >= 0) v = Math.max(v, a * Math.exp(-w / 0.035)); }
  v = Math.max(v, 0.18 * MathX.smooth(u, 0, 0.03) * (1 - MathX.smooth(u, k.dur - 0.1, k.dur + 0.35)));
  return v * k.amp;
}
// the strikes lit at s (for the picture: the sky, the light, the bolts)
function sfFlashesAt(s) { const out = []; for (const k of SF_STRIKES) { if (k.s > s + 0.02) break; const v = sfFlash(k, s); if (v > 0.002) out.push([k, v]); } return out; }
