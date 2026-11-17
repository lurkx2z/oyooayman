/* =====================================================================
   PHYSICS — every number the captions say, and where everything is at story time s (seconds after 2:40:00 PM, when
   visible light stops existing). Pure functions of s. script.js checks each caption's number against these.
     NLP   the constants (light, your skin, the Sun, ice, sound, cold water, the plane)
     NLE   the story's moments (placed on the captions through the clock)
     NLY   you · NLW the woman · NLK the skaters · NLV the lorry and the car · NLD the driver · NLA the plane
   ===================================================================== */

const NLP = (() => {
  const P = {};
  P.band = [380, 750];                         // nm: the light eyes use (the rule: only these stop existing)
  P.wien = 2897.8;                             // µm·K
  P.skinC = 33;                                // °C, the skin of your face and hands
  P.peakUm = P.wien / (P.skinC + 273.15);      // 9.47 µm
  P.timesRed = P.peakUm / (P.band[1] / 1000);  // 12.6 times the reddest light you could see
  P.sunVisible = 0.44;                         // the share of sunlight's energy between 380 and 750 nm (at the ground, about)
  P.sunAlt = 2.5; P.sunset = [15, 26];         // °, and 3:26 PM
  P.v0Kmh = 24; P.v0 = P.v0Kmh / 3.6;          // your speed when it went dark
  P.glide = 0.06;                              // m/s²: a skate gliding on its own (friction about 0.006)
  P.skaters = 240;
  P.air = NL_F.air;                            // −12 °C
  P.water = 0;                                 // under the ice
  P.icePerson = 5; P.iceCar = 20; P.iceInlet = 8;   // cm (clear ice; Norwegian rules of thumb)
  P.sound = 331.3 * Math.sqrt(1 + P.air / 273.15);  // m/s in air at −12 °C: 323.9
  P.people = 8.2e9;
  P.plane = { dist: 12000, glide: 3 };         // 12 km from the runway on a 3° glide path
  P.plane.alt = P.plane.dist * Math.tan(P.plane.glide * Math.PI / 180) - 0;   // 629 m above the runway
  P.plane.v = 72;                              // m/s on the approach (140 knots)
  P.fireC = 800;
  P.coldMin = [1, 10];                          // the 1-10 rule: a minute to get your breath, ten of useful movement
  return P;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE MOMENTS (story s), placed on the captions
// ---------------------------------------------------------------------------------------------------------------------
const NLE = (() => {
  const E = {}, S = nlSC, st = nlStoryAt;
  E.fall = S('skaters', 1, 1.1);                // you run into someone sitting on the ice, and go down
  E.rest = E.fall + 3.4;                        // stopped sliding
  E.herFall = E.fall + 1.3;
  E.hand = [st(nlB('body') + 0.6), st(nlC('body', 1) - 1.6)];   // your hand on the ice, then lifted
  E.grab = st(nlC('grab', 0) - 0.45);
  E.manStop = st(nlC('fire', 2) - 0.7);         // the man at the bonfire stops, a metre short
  E.lorry0 = st(nlC('road', 1) - 4);            // the lorry creeping along the road (it was already moving)
  E.up = st(nlB('road') + 0.2);                 // you both get up (to go towards the road's sounds)
  E.sinkHear = 0;                               // (set below)
  E.crack = S('ice', 1, -0.4);
  E.sink = S('ice', 2, -0.7);                   // ★ the ice under the car gives way
  E.out = S('water', 0, -1.7);                  // the driver surfaces at the edge of the hole
  E.plane = S('plane', 0, 2.4);                 // the plane passes overhead
  E.lie = st(nlB('crawl') + 1.0);               // you lie flat
  return E;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE ROAD: the lorry, the car it hits, its slide onto the lake (and so where the hole is)
// ---------------------------------------------------------------------------------------------------------------------
const NLV = (() => {
  const F = NL_F, V = {};
  V.car0 = [F.inlet.x - 8, F.road.z + 1.3];      // the car stopped where its driver went blind, nose to the lake
  V.dir = (() => { const a = -0.22; return [Math.sin(a), Math.cos(a)]; })();   // its heading (mostly south, a little west)
  V.yaw = Math.atan2(V.dir[0], V.dir[1]);
  // where the lorry's front hits the car's back: the moment comes from the caption "Sound takes … to cross the ice"
  // (the caption shows 0.3 s after the sound arrives)
  V.lorryV = 2.6;                               // m/s (9 km/h), creeping
  V.carV = 4.2;                                 // m/s: what the push gives the car
  V.muIce = 0.07;                               // tyres on bare ice, sliding
  // the car's path: along V.dir from car0; the bank (y 3 → 0) from the road's edge to the shore
  const sh = nlShoreZ(V.car0[0]), dz = V.dir[1];
  V.edgeD = (F.road.z + F.road.w / 2 + 1.5 - V.car0[1]) / dz;   // to the top of the bank
  V.shoreD = (sh - V.car0[1]) / dz;                            // to the ice
  V.vIce = Math.sqrt(V.carV * V.carV + 2 * 9.81 * F.road.y * 0.55);   // at the bottom of the bank (some lost to the grass)
  V.slide = V.vIce * V.vIce / (2 * V.muIce * 9.81);            // on the ice, to a stop
  V.restD = V.shoreD + V.slide;
  V.hole = [V.car0[0] + V.dir[0] * V.restD, V.car0[1] + V.dir[1] * V.restD];
  return V;
})();

// the timing of the hit: the caption "Sound takes X seconds" must be true from where you are standing then
NLE.hit = (() => {
  // you are at Y1 (sitting) at that moment; solve hit + distance/sound + 0.3 = the caption's story time
  const tCap = nlSC('road', 2);
  return tCap - 0.3 - Math.hypot(NLV.car0[0] - NL_Y1()[0], NLV.car0[1] - NL_Y1()[1]) / NLP.sound;
})();
NLE.hear = NLE.hit + Math.hypot(NLV.car0[0] - NL_Y1()[0], NLV.car0[1] - NL_Y1()[1]) / NLP.sound;
NLV.delay = NLE.hear - NLE.hit;
// the car over the ground: d along its heading from car0, at s
NLV.carD = (s) => {
  const V = NLV, s0 = NLE.hit;
  if (s < s0) return 0;
  // on the road and down the bank: steady-ish (the push, then gravity), then the slide on the ice
  const tBank = V.shoreD / ((V.carV + V.vIce) / 2);
  if (s < s0 + tBank) { const u = (s - s0) / tBank; return V.shoreD * (u * (V.carV / ((V.carV + V.vIce) / 2)) + u * u * (1 - V.carV / ((V.carV + V.vIce) / 2))); }
  const a = V.muIce * 9.81, tS = V.vIce / a, x = Math.min(s - s0 - tBank, tS);
  return V.shoreD + V.vIce * x - 0.5 * a * x * x;
};
NLV.carStop = (() => { const V = NLV, tBank = V.shoreD / ((V.carV + V.vIce) / 2); return NLE.hit + tBank + V.vIce / (V.muIce * 9.81); })();
// the car's pose: { x, y, z, yaw, pitch (nose down +), roll }
NLV.car = (s) => {
  const V = NLV, F = NL_F, d = NLV.carD(s), x = V.car0[0] + V.dir[0] * d, z = V.car0[1] + V.dir[1] * d;
  let y = nlGroundY(x, z) , pitch = 0, roll = 0;
  // down the bank: nose down along the slope
  if (d > V.edgeD - 2 && d < V.shoreD + 2) { const h0 = nlGroundY(x - V.dir[0], z - V.dir[1]), h1 = nlGroundY(x + V.dir[0], z + V.dir[1]); pitch = Math.atan2(h0 - h1, 2); }
  if (s > NLE.crack) roll = 0.015 * Math.sin((s - NLE.crack) * 9) * Math.exp(-(s - NLE.crack) * 2);
  // sinking: the nose (the engine) goes first
  const k = MathX.clamp((s - NLE.sink) / 55, 0, 1);
  if (s > NLE.sink) { pitch = 0.62 * MathX.smooth(s - NLE.sink, 0, 8) - 0.25 * MathX.smooth(s - NLE.sink, 30, 60); y = -0.35 * MathX.smooth(s - NLE.sink, 0, 2.5) - 3.4 * k * k; roll = 0.08 * MathX.smooth(s - NLE.sink, 2, 12); }
  void F;
  return { x, y, z, yaw: V.yaw, pitch, roll };
};
// the hole in the ice: radius at s (0 before the ice gives way)
NLV.holeR = (s) => (s < NLE.sink ? 0 : 1.6 + 1.3 * MathX.smooth(s - NLE.sink, 0, 4));
// the lorry: creeping west along the road; it stops dead against the car, then rolls on another 3 m
NLV.lorry = (s) => {
  const V = NLV, F = NL_F, xHit = V.car0[0] + 2.6, z = F.road.z - 1.9;
  const x = s < NLE.hit ? xHit + V.lorryV * (NLE.hit - s) : xHit - 3.0 * MathX.smooth(s - NLE.hit, 0, 2.2);
  return { x, y: F.road.y, z, yaw: -Math.PI / 2, v: s < NLE.hit ? V.lorryV : 0 };
};
// the parked or stopped cars on the road (they stopped when their drivers went blind): [x, lane z, yaw, type, colour]
const NL_ROADCARS = (() => {
  const r = new RNG(907), out = [], F = NL_F;
  for (const x of [-310, -262, -205, -150, -96, -12, 38, 96, 212, 268, 330]) {
    const lane = r.next() < 0.5 ? -1 : 1;
    out.push([x + r.range(-6, 6), F.road.z + lane * 2.0 + r.range(-0.6, 0.6), (lane < 0 ? Math.PI / 2 : -Math.PI / 2) + r.range(-0.5, 0.5), ['sedan', 'hatch', 'suv', 'van'][r.int(0, 3)], ['#2a3a4a', '#8a1f22', '#c9c6bd', '#1f2a24', '#5a5f66', '#0f1012'][r.int(0, 5)]]);
  }
  return out;
})();

// ---------------------------------------------------------------------------------------------------------------------
// YOU (and the woman): positions over the ice
// ---------------------------------------------------------------------------------------------------------------------
// where you are at s = 0, and heading (west along the track's north straight)
const NL_Y0 = [-30, NL_F.track.cz - NL_F.track.b];
function nlGlideX(s) { const P = NLP; const t = Math.min(s, P.v0 / P.glide); return P.v0 * t - 0.5 * P.glide * t * t; }
const NL_YFALL = () => [NL_Y0[0] - nlGlideX(NLE.fall), NL_Y0[1]];
// where you come to rest after the fall (you slide on, turning)
function NL_Y1() { const f = NL_YFALL(), v = NLP.v0 - NLP.glide * NLE.fall; return [f[0] - v * v / (2 * 1.9), f[1] + 1.2]; }
// the walk to the sound: [s, x, z] keys (you); the crawl is the last stretch (towards the driver)
const NLY = (() => {
  const Y = {}, V = NLV, E = NLE;
  Y.y1 = NL_Y1();
  // the driver holds the edge on your side of the hole
  const hx = V.hole[0], hz = V.hole[1], dx = Y.y1[0] - hx, dz = Y.y1[1] - hz, L = Math.hypot(dx, dz);
  Y.toYou = [dx / L, dz / L];
  Y.driver = (r) => [hx + Y.toYou[0] * r, hz + Y.toYou[1] * r];
  const at = (dist) => [hx + Y.toYou[0] * dist, hz + Y.toYou[1] * dist];    // a point dist metres from the hole's centre, on your side
  // the crawl: 40 m from the driver when "He's 40 metres away" comes up; 3 m from the edge at "You're 3 metres from the edge"
  E.crawl40 = nlSC('crawl', 2);
  E.edge3 = nlSC('edge', 2);
  const rFin = 2.9;                                            // the hole's radius by then
  Y.dDriver = 2.4;                                             // the driver's chest from the hole's centre
  const d40 = 40 + Y.dDriver, d3 = 3 + rFin;
  Y.crawlV = (d40 - d3) / (E.edge3 - E.crawl40);               // m/s, lying flat
  E.lieD = d40 + Y.crawlV * (E.crawl40 - E.lie);              // where you lie down
  // the walk: from Y1 (after the crash) to where you lie down; you stop to listen at the sing beat
  E.walk0 = E.hear + 3.0;
  E.listen = [nlSC('sing', 0, -0.2), nlSC('water', 0, 0.8)];
  const walkTime = (E.listen[0] - E.walk0) + (E.lie - E.listen[1]);
  Y.walkV = (L - E.lieD) / walkTime;
  Y.at = at;
  // distance from the hole's centre at s (on your side)
  Y.dist = (s) => {
    if (s < E.walk0) return L;
    let w = Math.min(s, E.listen[0]) - E.walk0;
    if (s > E.listen[1]) w += Math.min(s, E.lie) - E.listen[1];
    if (s <= E.lie) return L - Y.walkV * w;
    return Math.max(d3 - 0.3, E.lieD - Y.crawlV * (s - E.lie));
  };
  Y.L = L;
  return Y;
})();
// your body: { x, z, yaw, state, u } (state: skate · glide · fall · sit · up · walk · stand · prone)
NLY.at2 = (s) => {
  const E = NLE, P = NLP;
  if (s < E.fall) { const x = NL_Y0[0] - (s < 0 ? P.v0 * s : nlGlideX(s)); return { x, z: NL_Y0[1], yaw: -Math.PI / 2, state: s < 0 ? 'skate' : 'glide', u: s }; }
  const f = NL_YFALL(), y1 = NLY.y1;
  if (s < E.rest) { const u = (s - E.fall) / (E.rest - E.fall), k = 1 - (1 - u) * (1 - u); return { x: f[0] + (y1[0] - f[0]) * k, z: f[1] + (y1[1] - f[1]) * k, yaw: -Math.PI / 2 + 2.2 * k, state: 'fall', u }; }
  const faceHole = Math.atan2(-NLY.toYou[0], -NLY.toYou[1]);
  if (s < E.walk0) return { x: y1[0], z: y1[1], yaw: s < E.hear ? -Math.PI / 2 + 2.2 : faceHole, state: s < E.up ? 'sit' : 'stand', u: s - E.rest };
  const p = NLY.at(NLY.dist(s));
  const st = s >= E.lie ? 'prone' : (s >= E.listen[0] && s < E.listen[1]) ? 'stand' : 'walk';
  return { x: p[0], z: p[1], yaw: faceHole, state: st, u: s };
};
// the woman: behind you when it went dark; she falls over the same pile, slides off; crawls to you; then with you,
// a step behind on your left (holding your arm, then your ankles)
const NLW = (() => {
  const W = {}, E = NLE;
  W.p0 = [NL_Y0[0] + 11, NL_Y0[1] + 1.2];
  W.rest = (() => { const y = NLY.y1; return [y[0] + 8.5, y[1] - 4.2]; })();
  W.crawl = [E.grab - 9, E.grab];
  W.at2 = (s) => {
    const P = NLP;
    if (s < E.herFall) { const x = W.p0[0] - (s < 0 ? P.v0 * 0.96 * s : nlGlideX(s) * 0.96); return { x, z: W.p0[1], yaw: -Math.PI / 2, state: s < 0 ? 'skate' : 'glide' }; }
    const fx = W.p0[0] - nlGlideX(E.herFall) * 0.96;
    if (s < E.herFall + 3) { const u = (s - E.herFall) / 3, k = 1 - (1 - u) * (1 - u); return { x: fx + (W.rest[0] - fx) * k, z: W.p0[1] + (W.rest[1] - W.p0[1]) * k, yaw: -Math.PI / 2 - 1.2 * k, state: 'fall', u }; }
    const y = NLY.at2(s), side = [-NLY.toYou[1], NLY.toYou[0]];     // (your left, facing the hole)
    const beside = [y.x + side[0] * 0.7 + NLY.toYou[0] * 0.5, y.z + side[1] * 0.7 + NLY.toYou[1] * 0.5];
    if (s < W.crawl[0]) return { x: W.rest[0], z: W.rest[1], yaw: 2.4, state: 'sit' };
    if (s < W.crawl[1]) { const u = (s - W.crawl[0]) / (W.crawl[1] - W.crawl[0]); const near = [NLY.y1[0] + 0.75, NLY.y1[1] - 0.5]; return { x: W.rest[0] + (near[0] - W.rest[0]) * u, z: W.rest[1] + (near[1] - W.rest[1]) * u, yaw: Math.atan2(near[0] - W.rest[0], near[1] - W.rest[1]), state: 'crawl', u }; }
    if (s < E.walk0) return { x: NLY.y1[0] + 0.75, z: NLY.y1[1] - 0.5, yaw: -2.0, state: s < E.up ? 'kneel' : 'stand' };
    if (s < E.lie) return { x: beside[0], z: beside[1], yaw: y.yaw, state: y.state === 'walk' ? 'walk' : 'stand' };
    // lying flat behind you, holding your ankles
    const b = NLY.at(NLY.dist(s) + 1.95);
    return { x: b[0], z: b[1], yaw: y.yaw, state: 'prone' };
  };
  return W;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE SKATERS: on the oval until 2:40:00, then straight on, blind; most fall within a few seconds
// ---------------------------------------------------------------------------------------------------------------------
const NLK = (() => {
  const r = new RNG(24001), T = NL_F.track, list = [];
  const perim = Math.PI * (3 * (T.a + T.b) - Math.sqrt((3 * T.a + T.b) * (T.a + 3 * T.b)));
  // (a skater at track angle a, moving counter-clockwise: the tangent)
  const tan = (a) => { const dx = -T.a * Math.sin(a), dz = -T.b * Math.cos(a), l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
  const angOfYou = Math.atan2(-(NL_Y0[1] - T.cz) / T.b, (NL_Y0[0] - T.cx) / T.a);
  const N = 58;
  for (let i = 0; i < N; i++) {
    // the first 26 near you (ahead and behind on your straight), the rest round the oval
    const a = i < 26 ? angOfYou + r.range(-0.55, 0.45) : r.range(0, Math.PI * 2);
    const lane = r.range(-4.5, 4.5), v = r.range(3.2, 7.2), kid = r.next() < 0.14;
    const fall = r.next() < 0.72, tf = r.range(0.6, 16), stop = r.range(0.8, 2.4);
    const rest = ['sit', 'kneel', 'allFours', 'lie', 'sit', 'stand', 'crouch'][r.int(0, 6)];
    // (nobody stands where you fall and slide)
    const p = nlTrackP(a), tg = tan(a), n = [-tg[1], tg[0]];
    const x0 = p[0] + n[0] * lane, z0 = p[1] + n[1] * lane;
    if (Math.hypot(x0 - NL_Y0[0], z0 - NL_Y0[1]) < 6 && i) continue;
    list.push({ i, a0: a, lane, v, kid, fall, tf, stop, rest, x0, z0, tg, look: i % 9, seed: r.next() });
  }
  // the one you run into: sitting on the ice where you fall
  const f = NL_YFALL();
  list.push({ i: 99, a0: 0, lane: 0, v: 0, kid: false, fall: true, tf: 0, stop: 1, rest: 'sit', x0: f[0] - 0.9, z0: f[1] - 0.3, tg: [-1, 0], look: 3, seed: 0.3, fixed: true });
  // where a skater is: { x, z, yaw, state, u }
  const pos = (k, s) => {
    if (k.fixed) return { x: k.x0, z: k.z0, yaw: 1.2, state: s < NLE.fall + 0.3 ? 'sit' : 'sit', u: 0 };
    if (s < 0) { const a = k.a0 + k.v * s / (perim / (2 * Math.PI)) * (T.a + T.b) / (2 * Math.sqrt(T.a * T.b)) * 0; const p = nlTrackP(k.a0 + (k.v * s) / ((T.a + T.b) / 2)), tg = tan(k.a0 + (k.v * s) / ((T.a + T.b) / 2)), n = [-tg[1], tg[0]]; void a; return { x: p[0] + n[0] * k.lane, z: p[1] + n[1] * k.lane, yaw: Math.atan2(tg[0], tg[1]), state: 'skate', u: s * k.v / 2.4 }; }
    const yaw = Math.atan2(k.tg[0], k.tg[1]);
    if (k.fall) {
      const vF = Math.max(0, k.v - NLP.glide * k.tf), dF = k.v * k.tf - 0.5 * NLP.glide * k.tf * k.tf;
      if (s < k.tf) { const d = k.v * s - 0.5 * NLP.glide * s * s; return { x: k.x0 + k.tg[0] * d, z: k.z0 + k.tg[1] * d, yaw, state: 'glide', u: s }; }
      const a = 2.0, tS = vF / a, x = Math.min(s - k.tf, tS), d = dF + vF * x - 0.5 * a * x * x;
      return { x: k.x0 + k.tg[0] * d, z: k.z0 + k.tg[1] * d, yaw: yaw + (k.seed - 0.5) * 3 * Math.min(1, (s - k.tf) / 1.2), state: s < k.tf + tS + 0.6 ? 'fall' : k.rest === 'stand' ? 'sit' : k.rest, u: (s - k.tf) };
    }
    const tS = k.stop * k.v / 2.5, x = Math.min(s, tS), d = k.v * x - 0.5 * (k.v / tS) * x * x;
    return { x: k.x0 + k.tg[0] * d, z: k.z0 + k.tg[1] * d, yaw, state: s < tS ? 'stopping' : 'standBlind', u: s };
  };
  return { list, pos, perim };
})();

// the far skaters (simple figures, round the oval and spread over the ice): 240 in all with the near ones
const NL_FAR = (() => {
  const r = new RNG(5150), out = [], T = NL_F.track;
  for (let i = 0; i < 190; i++) {
    const a = r.range(0, Math.PI * 2), p = nlTrackP(a), lane = r.range(-6, 6), sp = r.next() < 0.3 ? r.range(8, 60) : 0;
    const x = p[0] + lane * Math.cos(a) + sp * r.range(-1, 1), z = p[1] - lane * Math.sin(a) * 0.4 + sp * r.range(-1, 1);
    if (Math.hypot(x - NL_Y0[0], z - NL_Y0[1]) < 70) continue;
    out.push([x, z, r.range(0, 6.28), r.next() < 0.6 ? 0 : 1, r.range(0.85, 1.05)]);   // [x, z, yaw, 0 = down / 1 = standing, scale]
  }
  void T;
  return out;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE DRIVER, THE MAN AT THE BONFIRE, THE PLANE
// ---------------------------------------------------------------------------------------------------------------------
const NLD = {
  // in the water at the edge of the hole, on your side, arms on the ice: { x, y, z, yaw, k (0…1 how tired) }
  at: (s) => { const p = NLY.driver(NLY.dDriver); const yaw = Math.atan2(NLY.toYou[0], NLY.toYou[1]); return { x: p[0], y: -1.18 + 0.05 * Math.sin(s * 1.7) - 0.25 * MathX.smooth(s - NLE.out, 200, 400), z: p[1], yaw, k: MathX.smooth(s - NLE.out, 0, 420) }; },
  inWater: (s) => s - NLE.out,
};
const NLM = {
  // walks towards the fire from the kiosk's side, arms out; feels it a metre away; stops; steps back
  at: (s) => {
    const F = NL_F, dir = [0.55, 0.835], st = NLE.manStop, v = 0.62;
    const dStop = 1.0 + 0.45;                                      // (his chest a metre from the fire's edge)
    let d = s < st ? dStop + v * (st - s) : dStop + 1.2 * MathX.smooth(s - st, 0.3, 1.8);
    d = Math.min(d, 14);
    return { x: F.fire.x - dir[0] * d, z: F.fire.z - dir[1] * d, yaw: Math.atan2(dir[0], dir[1]), walking: s < st, back: s > st + 0.3 && s < st + 1.8 };
  },
};
const NLA = {
  // the plane: heading west-north-west, descending at 3°; overhead (a little south of) you at NLE.plane
  at: (s) => {
    const P = NLP, hd = -1.92, dx = Math.sin(hd), dz = Math.cos(hd), y0 = NLY.at2(NLE.plane), u = (s - NLE.plane) * P.plane.v;
    return { x: y0.x + 60 + dx * u, y: P.plane.alt - u * Math.tan(P.plane.glide * Math.PI / 180), z: y0.z + 120 + dz * u, yaw: hd, pitch: -0.03 };
  },
};
