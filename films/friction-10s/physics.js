/* =====================================================================
   PHYSICS — "What if friction disappeared for 10 seconds?" Every motion in the film is a pure function of STORY time
   s (seconds after friction disappears; it comes back at s = 10). Metres; y up; the street runs along x, downhill
   towards +x (east); your house's front wall faces −z (north; the street is at z −11.6 … −22.0). UK: traffic keeps left,
   so downhill traffic uses the north half of the road (−z), uphill the south half.
   The rule (PLAN.md § 1): from s = 0 to 10, every solid-on-solid contact above ground loses its sideways grip
   (static and kinetic friction both zero). Normal forces (pushing), air drag, liquids, gravity are unchanged.
   What follows, and is drawn:
     · nothing at rest on a level surface moves; anything moving keeps moving (only air drag slows it)
     · on a slope, everything slides at a = g·sin θ, whatever its mass (the hill: 8 % → 0.782 m/s²; your floor: 0.5° →
       0.0856 m/s²). Air drag is small for cars and noticeable only for light boxy things late on (bins, people: −5…−8 %)
     · grip (squeezing), knots, screws under load, wall plugs, scaffold clamps, a leaning ladder, piles of grains: let go
     · at s = 10 friction returns (μ ≈ 0.7 tyres, 0.55 clothes on asphalt, 0.45 on wood): everything still sliding
       stops in about a second; tall things sliding fast tip; a double-decker sliding sideways goes over (its static
       stability factor ≈ 0.6 < μ); cars sliding sideways lurch (factor ≈ 1.3 > μ: no roll on flat ground)
   ===================================================================== */

const FZP = {
  g: 9.81,
  tBack: 10,
  floorDeg: 0.5,
  grade: 0.08,                                                  // the hill: 8 % (4.57°)
};
FZP.aFloor = FZP.g * Math.sin(FZP.floorDeg * Math.PI / 180);  // 0.0856 m/s² towards the street (−z)
FZP.aHill = FZP.g * FZP.grade / Math.hypot(1, FZP.grade);       // 0.782 m/s² downhill (+x)
FZP.decCar = FZP.g * 0.7 - FZP.aHill;                           // skidding to a stop downhill (m/s²)
FZP.decBody = FZP.g * 0.55 - FZP.aHill;
FZP.decWood = FZP.g * 0.45;

// ---------------------------------------------------------------------------------------------------------------------
// THE WORLD'S LEVELS
// ---------------------------------------------------------------------------------------------------------------------
const FZ_W = {
  front: -8.0,              // your front wall, inside face (the floor ends here)
  wallT: 0.3,               // wall thickness
  pav0: -0.45,              // pavement height at x = 0 (your ground floor is y = 0)
  pavS: [-9.6, -11.6],      // south pavement z (your side)
  road: [-11.6, -22.0],     // kerb to kerb (a bus route: parking both sides, a lane each way)
  pavN: [-22.0, -24.0],
  yardN: -25.2,             // the north houses' front faces
  laneS: -12.7, laneN: -20.9,           // the parking lanes (south cars face uphill, north cars downhill)
  up: -15.3, down: -18.3,               // the uphill and downhill lanes (centres)
  mid: -16.8,                           // the crown
  door: [-0.2, 0.7],        // your front door (x), in the front wall
};
const fzPavY = (x) => FZ_W.pav0 - FZP.grade * x;
// the road: 12 cm below the pavement at the gutters, a 7 cm crown in the middle
function fzRoadY(x, z) { const u = (z - FZ_W.mid) / 5.2; return fzPavY(x) - 0.12 + 0.07 * Math.max(0, 1 - u * u); }
// the ground anywhere outside (pavement, road, yards)
function fzGroundY(x, z) { return z < FZ_W.road[0] && z > FZ_W.road[1] ? fzRoadY(x, z) : fzPavY(x); }

// distance along a slope from rest: ½at², then (after s = 10) a skid to a stop
const fzHalf = (a, s) => 0.5 * a * s * s;
// a slider: start p0 (m along its line) with speed v0, acceleration a until s = 10; from then it decelerates at dec
// (dec ≤ 0: no stop). Returns { p, v, stop } (stop: the story time it came to rest)
function fzSlide(p0, v0, a, s, dec, t10 = FZP.tBack) {
  if (s <= 0) return { p: p0, v: 0, stop: null };
  const sa = Math.min(s, t10), p1 = p0 + v0 * sa + 0.5 * a * sa * sa, v1 = v0 + a * sa;
  if (s <= t10 || !(dec > 0)) return { p: p1, v: v1, stop: null };
  const tau = s - t10, ts = Math.abs(v1) / dec, sg = Math.sign(v1) || 1;
  if (tau >= ts) return { p: p1 + sg * v1 * v1 / (2 * dec) * sg * sg, v: 0, stop: t10 + ts };
  return { p: p1 + v1 * tau - sg * 0.5 * dec * tau * tau, v: v1 - sg * dec * tau, stop: null };
}
// a smooth 0→1 over [a, b]
const fzSm = (s, a, b) => MathX.smooth(s, a, b);
const fzLin = (s, a, b) => MathX.clamp((s - a) / (b - a), 0, 1);

// ---------------------------------------------------------------------------------------------------------------------
// INSIDE: the loose things on your floor (the floor slopes 0.5° towards the front wall, z = −8).
// Every one starts at rest and slides at the same aFloor, so none catches another until the one in front has stopped
// against the wall (or against something already stopped). Solved once, front to back, lane by lane (overlap in x).
// item: { id, x: [x0, x1], z: [zBack, zFront] (zFront < zBack), h, tall }
// ---------------------------------------------------------------------------------------------------------------------
const FZ_LOOSE = [
  // living room
  { id: 'sofa', x: [-2.28, -1.36], z: [-4.35, -6.25], h: 0.86 },
  { id: 'rug', x: [-1.25, 0.25], z: [-4.6, -6.6], h: 0.01, under: true },
  { id: 'ctable', x: [-0.95, -0.25], z: [-5.0, -5.85], h: 0.42, onRug: true },
  { id: 'armchair', x: [1.1, 1.95], z: [-6.35, -7.2], h: 0.82 },
  { id: 'lamp', x: [-2.2, -1.9], z: [-6.75, -7.05], h: 1.6, tall: true },
  { id: 'plant', x: [1.95, 2.3], z: [-7.4, -7.75], h: 1.1 },
  { id: 'side', x: [1.95, 2.33], z: [-4.25, -5.75], h: 0.55 },
  // dining
  { id: 'table', x: [-0.15, 1.45], z: [-3.0, -4.6], h: 0.75 },                     // (z: with its tucked-in chairs)
  { id: 'chair1', x: [0.05, 0.5], z: [-3.0, -3.45], h: 0.9, with: 'table' },         // (tucked under it: they go with it)
  { id: 'chair2', x: [0.85, 1.3], z: [-3.0, -3.45], h: 0.9, with: 'table' },
  { id: 'chair3', x: [0.05, 0.5], z: [-4.15, -4.6], h: 0.9, with: 'table' },
  { id: 'chair4', x: [0.85, 1.3], z: [-4.15, -4.6], h: 0.9, with: 'table' },
  // kitchen
  { id: 'stool1', x: [0.72, 1.07], z: [-1.6, -1.95], h: 0.75, tall: true },
  { id: 'stool2', x: [0.72, 1.07], z: [-2.15, -2.5], h: 0.75, tall: true },
  { id: 'fridge', x: [1.58, 2.25], z: [-0.08, -0.76], h: 1.86, tall: true },
  { id: 'bin', x: [1.85, 2.2], z: [-1.1, -1.42], h: 0.66, tall: true },
];
const FZ_LOOSE_ID = {};
(function fzSolvePile() {
  const a = FZP.aFloor, done = [];
  const order = FZ_LOOSE.slice().sort((p, q) => q.z[1] < p.z[1] ? 1 : -1);   // front-most first (most negative zFront)
  order.sort((p, q) => p.z[1] - q.z[1]);
  for (const it of order) {
    if (it.with) continue;
    let stopAt = FZ_W.front;                                                     // the front wall
    if (it.onRug || it.under) stopAt = -1e9;                                     // (the rug and what's on it: below)
    for (const o of done) {
      if (o.under || it.under) continue;
      if (o.x[1] <= it.x[0] + 0.02 || o.x[0] >= it.x[1] - 0.02) continue;        // not in the same lane
      if (o.z[0] > it.z[1]) continue;                                            // not in front of it
      stopAt = Math.max(stopAt, o.z[0] - o.d);                                   // its back edge, where it stopped
    }
    it.d = Math.max(0, it.z[1] - stopAt);                                        // how far it can slide
    it.tStop = Math.sqrt(2 * it.d / a);
    it.vHit = a * it.tStop;
    done.push(it); FZ_LOOSE_ID[it.id] = it;
  }
  for (const it of FZ_LOOSE) if (it.with) { const p = FZ_LOOSE_ID[it.with]; it.d = p.d; it.tStop = p.tStop; it.vHit = p.vHit; FZ_LOOSE_ID[it.id] = it; done.push(it); }
  // the rug carries the coffee table; it stops when its front edge reaches the armchair-free floor by the front wall
  const rug = FZ_LOOSE_ID.rug; rug.d = rug.z[1] - (FZ_W.front + 0.05); rug.tStop = Math.sqrt(2 * rug.d / a); rug.vHit = a * rug.tStop;
  const ct = FZ_LOOSE_ID.ctable; ct.d = Math.min(rug.d, ct.z[1] - (FZ_W.front + 0.05)); ct.tStop = Math.sqrt(2 * ct.d / a); ct.vHit = a * ct.tStop;
})();
// how far a loose item has slid (towards −z) at story time s, and its speed. After s = 10 a still-sliding item skids
// to a stop on the wooden floor (and a tall one tips: fzTip)
function fzLoose(id, s) {
  const it = FZ_LOOSE_ID[id], a = FZP.aFloor;
  if (s <= 0) return { dz: 0, v: 0, moving: false };
  if (s < Math.min(it.tStop, FZP.tBack)) return { dz: -fzHalf(a, s), v: a * s, moving: true };
  if (it.tStop <= FZP.tBack) return { dz: -it.d, v: 0, moving: false, hit: it.tStop };
  const r = fzSlide(0, 0, a, s, FZP.decWood);
  return { dz: -r.p, v: r.v, moving: r.v > 0 };
}
// a tall thing still sliding when friction returns pitches over the way it was going (angle, radians; 0 = upright)
function fzTip(id, s, max = Math.PI / 2) {
  const it = FZ_LOOSE_ID[id];
  if (s <= FZP.tBack || it.tStop <= FZP.tBack) return 0;
  const u = (s - FZP.tBack) / 0.85;
  return max * (u >= 1 ? 1 : u * u * (3 - 2 * u)) * (1 + 0.04 * Math.exp(-(s - FZP.tBack - 0.85) * 9) * Math.sin(Math.max(0, s - FZP.tBack - 0.85) * 40));
}

// ---------------------------------------------------------------------------------------------------------------------
// YOU, THE CAT, THE PHONE, THE MUG
// ---------------------------------------------------------------------------------------------------------------------
const FZ_YOU = { x: -1.12, z: -1.2, eye: 1.63, sitEye: 0.86, slide: 0.42 };
const FZ_ISLAND = { x: [-0.55, 0.55], z: [-1.4, -2.6], top: 0.92 };
const FZ_OVEN = { x: -1.74, y: 0.8, z: [-2.08, -2.56] };                         // the handle bar
// the phone: in your left hand until s = 0, squeezed out (down and forwards), lands at 0.42 s, slides for the door.
const FZ_PHONE = {
  hand: [-1.28, 1.12, -1.6], land: 0.42, v0: 0.7,
  dir: null, doorZ: FZ_W.front - FZ_W.wallT,
};
(function () {
  const P = FZ_PHONE, tx = 0.25, tz = FZ_W.front;
  const lx = P.hand[0] + 0.05, lz = P.hand[2] - 0.12;                           // where it lands
  const dx = tx - lx, dz = tz - lz, L = Math.hypot(dx, dz);
  P.landAt = [lx, lz]; P.dir = [dx / L, dz / L]; P.toDoor = L;
  P.a = FZP.aFloor * (-P.dir[1]);                                                // the floor's slope along its path
  P.tDoor = P.land + (-P.v0 + Math.sqrt(P.v0 * P.v0 + 2 * P.a * L)) / P.a;
  P.vDoor = P.v0 + P.a * (P.tDoor - P.land);
})();
// the phone's position {x, y, z, yaw, pitch, roll} at s
function fzPhone(s) {
  const P = FZ_PHONE;
  if (s <= 0) return { x: P.hand[0], y: P.hand[1], z: P.hand[2], yaw: 0.2, pitch: -0.25, roll: 0, inHand: true };
  if (s < P.land) {                                                              // squeezed out: drops, tumbling a little
    const u = s / P.land;
    return { x: P.hand[0] + 0.05 * u, y: P.hand[1] - 0.5 * FZP.g * s * s - 0.05 * u, z: P.hand[2] - 0.12 * u, yaw: 0.2 + 0.6 * u, pitch: -0.25 - 1.3 * u * u, roll: 0.5 * u, inHand: false };
  }
  // sliding (screen up after the drop), for the door
  const tau = s - P.land, bounce = Math.max(0, Math.exp(-tau * 12) * Math.sin(tau * 40)) * 0.03;
  if (s < P.tDoor) {
    const d = P.v0 * Math.min(tau, FZP.tBack - P.land) + 0.5 * P.a * Math.min(tau, FZP.tBack - P.land) ** 2;
    return { x: P.landAt[0] + P.dir[0] * d, y: 0.006 + bounce, z: P.landAt[1] + P.dir[1] * d, yaw: 0.8 + 0.12 * tau, pitch: -Math.PI / 2, roll: 0 };
  }
  // out of the door: down your three steps, along the path, onto the pavement and down the hill (fzPhoneOut)
  return fzPhoneOut(s);
}
// outside: off the doorstep at tDoor (speed vDoor, heading −z), down 3 steps (a hop each), across the yard and the
// pavement; on the pavement the hill pulls it along +x. Stops at s = 10 (it's light: a short skid).
const FZ_STEPS = { n: 3, rise: 0.155, run: 0.28, z0: FZ_W.front - FZ_W.wallT };
function fzPhoneOut(s) {
  const P = FZ_PHONE, t0 = P.tDoor, v = P.vDoor, sx = 0.25;
  const se = Math.min(s, FZP.tBack + 0.25);
  const tau = se - t0, zDist = v * tau;                                          // it keeps its −z speed
  const z = FZ_STEPS.z0 - zDist;
  const stepsEnd = FZ_STEPS.n * FZ_STEPS.run;
  let y;
  if (zDist < stepsEnd) {                                                        // hopping down the steps
    const k = Math.floor(zDist / FZ_STEPS.run), u = (zDist % FZ_STEPS.run) / FZ_STEPS.run;
    y = -k * FZ_STEPS.rise - FZ_STEPS.rise * u * u;
  } else y = fzPavY(sx);
  // on the yard path and the pavement: the hill's pull along +x from when it leaves the steps
  const tFlat = t0 + stepsEnd / v, tx = Math.max(0, se - tFlat);
  let x = sx + 0.5 * FZP.aHill * tx * tx;
  let zz = z;
  if (zz < FZ_W.road[0] + 0.05) zz = FZ_W.road[0] + 0.05 - 0.15 * (1 - Math.exp(-(FZ_W.road[0] + 0.05 - z) * 3));   // it fetches up in the gutter
  const yy = zDist < stepsEnd ? y + 0.006 : (zz < FZ_W.road[0] ? fzRoadY(x, zz) : fzPavY(x)) + 0.006;
  return { x, y: yy, z: zz, yaw: 0.8 + 0.12 * (se - P.land) + 0.9 * Math.min(1, tx / 3), pitch: -Math.PI / 2, roll: 0, out: true };
}

// the mug: on the island; the cat's shoulder knocks it at 0.2 s; it slides off the island's left edge and smashes at
// FZ_MUG.smash; its pieces then glide away from where it landed, each at its own speed and heading, until a wall
const FZ_MUG = { at: [-0.22, FZ_ISLAND.top, -1.92], hit: 0.2, v: [-1.55, 0, -0.18] };
(function () {
  const M = FZ_MUG, dx = FZ_ISLAND.x[0] - M.at[0];
  M.tOff = M.hit + dx / M.v[0];                                                  // leaves the edge
  M.tFall = Math.sqrt(2 * FZ_ISLAND.top / FZP.g);
  M.smash = M.tOff + M.tFall;
  M.land = [FZ_ISLAND.x[0] + M.v[0] * M.tFall, M.at[2] + M.v[2] * (M.smash - M.hit)];
  // 22 shards: speeds 0.25–1.4 m/s (the mug's own −x speed carried on), headings spread; they stop at the walls/units
  const r = new RNG(9071); M.shards = [];
  for (let i = 0; i < 22; i++) {
    const a = r.range(-Math.PI, Math.PI), sp = r.range(0.25, 1.1);
    let vx = Math.cos(a) * sp + M.v[0] * 0.45, vz = Math.sin(a) * sp + M.v[2] * 0.45;
    M.shards.push({ vx, vz, size: r.range(0.012, 0.04), spin: r.range(-6, 6), tilt: r.range(0, 1) });
  }
})();
function fzMug(s) {
  const M = FZ_MUG;
  if (s < M.hit) return { x: M.at[0], y: M.at[1], z: M.at[2], rx: 0, rz: 0, whole: true };
  if (s < M.tOff) { const t = s - M.hit; return { x: M.at[0] + M.v[0] * t, y: M.at[1], z: M.at[2] + M.v[2] * t, rx: 0, rz: 0, whole: true }; }
  if (s < M.smash) { const t = s - M.tOff; return { x: FZ_ISLAND.x[0] + M.v[0] * t, y: M.at[1] - 0.5 * FZP.g * t * t, z: M.at[2] + M.v[2] * (s - M.hit), rx: 0, rz: -2.2 * t, whole: true }; }
  return { x: M.land[0], y: 0, z: M.land[1], whole: false };
}
// a shard's floor position at s (bounded by the kitchen units on the left, x −1.74, the island, and the floor ends)
function fzShard(i, s) {
  const M = FZ_MUG, sh = M.shards[i];
  if (s < M.smash) return null;
  const t = Math.min(s, FZP.tBack + 0.05) - M.smash;
  let x = M.land[0] + sh.vx * t, z = M.land[1] + sh.vz * t - fzHalf(FZP.aFloor, Math.max(0, t));
  if (x < -1.72) x = -1.72 + (-1.72 - x) * 0.25;                                // bounced off the units (most of the speed lost)
  if (x > FZ_ISLAND.x[0] - 0.02 && z < FZ_ISLAND.z[0] && z > FZ_ISLAND.z[1]) x = FZ_ISLAND.x[0] - 0.02 - (x - FZ_ISLAND.x[0]) * 0.2;
  z = Math.max(z, FZ_W.front + 0.03); z = Math.min(z, -0.05);
  return { x, z, a: sh.spin * t };
}
// the cat: crouched by the island's right side; leaps at −0.55; lands on the island top at 0.0 sliding −x at 2.0 m/s;
// shoulders the mug at 0.2; off the left edge at fzCat.off; lands on the floor, slides into the units at x −1.74 and
// stops; from 1.35 she tries to run and runs on the spot, drifting down the room with the floor; at s = 10 her paws
// grip and she shoots forward.
const FZ_CAT = { start: [0.95, 0, -1.95], top: [0.5, FZ_ISLAND.top, -1.95], vx: -2.0, leap: -0.55, run: 1.35 };
(function () {
  const C = FZ_CAT;
  C.off = (FZ_ISLAND.x[0] - C.top[0]) / C.vx;                                   // leaves the left edge
  C.fall = Math.sqrt(2 * FZ_ISLAND.top / FZP.g);
  C.land = C.off + C.fall;
  C.landX = FZ_ISLAND.x[0] + C.vx * C.fall;
  C.wall = -1.74 + 0.13;                                                         // her flank against the units
  C.hitWall = C.land + (C.wall - C.landX) / C.vx;
  C.z0 = C.top[2];
})();
function fzCat(s) {
  const C = FZ_CAT;
  if (s < C.leap) return { x: C.start[0], y: 0, z: C.start[2], yaw: -Math.PI / 2, mode: 'crouch', u: fzLin(s, C.leap - 0.35, C.leap) };
  if (s < 0) { const u = (s - C.leap) / -C.leap; return { x: MathX.lerp(C.start[0], C.top[0], u), y: C.top[1] * Math.sin(u * Math.PI * 0.5) + 0.25 * Math.sin(u * Math.PI), z: C.z0, yaw: -Math.PI / 2, mode: 'leap', u }; }
  if (s < C.off) return { x: C.top[0] + C.vx * s, y: C.top[1], z: C.z0, yaw: -Math.PI / 2 + 0.6 * fzSm(s, 0.05, C.off), mode: 'skid', u: s / C.off };
  if (s < C.land) { const t = s - C.off; return { x: FZ_ISLAND.x[0] + C.vx * t, y: C.top[1] - 0.5 * FZP.g * t * t, z: C.z0, yaw: -Math.PI / 2 + 0.6 + 0.97 * fzSm(t, 0, C.fall), mode: 'drop', u: t / C.fall }; }
  if (s < C.hitWall) return { x: C.landX + C.vx * (s - C.land), y: 0, z: C.z0, yaw: Math.PI, mode: 'splay', u: 0 };
  // against the units; from C.run running on the spot while the floor's slope carries her slowly towards the front
  const tz = Math.max(0, Math.min(s, FZP.tBack) - C.hitWall), z = C.z0 - fzHalf(FZP.aFloor, tz);
  if (s < FZP.tBack) return { x: C.wall + 0.02 * Math.exp(-(s - C.hitWall) * 6), y: 0, z, yaw: Math.PI, mode: s < C.run ? 'splay' : 'run', u: s - C.run };
  // friction back: the paws grip mid-stride and she shoots forwards (−z), straight at the sofa (it slid ahead of her and
  // stopped 0.4 m in front): up over its arm onto the seat (0.6 m up), where she sits down as if she meant it
  const tb = s - FZP.tBack, sofaBack = FZ_LOOSE_ID.sofa.z[0] - FZ_LOOSE_ID.sofa.d, d = 1.15 * (1 - Math.exp(-tb * 3.4));
  const zz = z - d, up = fzSm(tb, 0.06, 0.3), hop = 0.22 * Math.sin(Math.PI * MathX.clamp((tb - 0.04) / 0.34, 0, 1));
  return { x: C.wall - 0.14 * fzSm(tb, 0.1, 0.8), y: (zz < sofaBack + 0.1 ? 0.6 * up : 0) + hop, z: zz, yaw: Math.PI, mode: tb < 0.7 ? 'launch' : 'sitUp', u: tb };
}
// you: standing at FZ_YOU; you reach for the mug at 0.3; your feet shoot out (0.55 → 1.2, the view drops to the floor);
// your right hand skids off the island (0.75 → 1.0); your left hand hooks the oven handle (1.45 → 1.9).
const FZ_FALL = { reach: 0.3, slip: 0.55, down: 1.2, grab: [0.75, 1.0], hook: [1.45, 1.9] };
// the eye height (story time)
function fzEyeY(s) {
  const F = FZ_FALL;
  if (s < F.slip) return FZ_YOU.eye - 0.06 * fzSm(s, F.reach, F.slip);
  if (s < F.down) { const u = (s - F.slip) / (F.down - F.slip); return MathX.lerp(FZ_YOU.eye - 0.06, FZ_YOU.sitEye, u * u); }
  const b = s - F.down;
  return FZ_YOU.sitEye - 0.05 * Math.exp(-b * 9) * Math.sin(b * 26);
}

// ---------------------------------------------------------------------------------------------------------------------
// OUTSIDE: the street (downhill +x, 8 %)
// ---------------------------------------------------------------------------------------------------------------------
// parked: { id, type, color, x (centre), z (lane), dir (+1 nose downhill, −1 uphill) }. All start at rest and slide
// together at aHill; after s = 10 they skid (locked wheels: parked in gear with the handbrake on) to a stop.
// (none on the north side from the bus stop at x 18 down to x 60, none on the south side between 18 and 52: the bus's
// sweep stays clear of them)
const FZ_PARKED = [
  { id: 'S0', type: 'sedan', color: '#5b6470', x: -21.0, z: FZ_W.laneS, dir: -1 },
  { id: 'S1', type: 'hatch', color: '#9b2f2b', x: -14.0, z: FZ_W.laneS, dir: -1 },
  { id: 'S2', type: 'sedan', color: '#7d8187', x: -7.4, z: FZ_W.laneS, dir: -1 },
  { id: 'S3', type: 'suv', color: '#283a52', x: 6.0, z: FZ_W.laneS, dir: -1 },
  { id: 'S4', type: 'hatch', color: '#d9d6cf', x: 12.2, z: FZ_W.laneS, dir: -1 },
  { id: 'S5', type: 'sedan', color: '#3d4f6b', x: 54.0, z: FZ_W.laneS, dir: -1 },
  { id: 'N0', type: 'hatch', color: '#476b8a', x: -24.0, z: FZ_W.laneN, dir: 1 },
  { id: 'N1', type: 'van', color: '#e8e6e0', x: -17.0, z: FZ_W.laneN, dir: 1 },
  { id: 'N2', type: 'sedan', color: '#2f6b6a', x: -10.6, z: FZ_W.laneN, dir: 1 },
  { id: 'N3', type: 'hatch', color: '#c9a23a', x: -4.2, z: FZ_W.laneN, dir: 1 },
  { id: 'N5', type: 'suv', color: '#4c5a3c', x: 14.4, z: FZ_W.laneN, dir: 1 },
];
// drag: ½ρC_dA/m (1/m) for the light boxy things; cars ≈ 0
function fzDragSlide(x0, s, k, dec) {
  // a = aHill − k v²  (integrated in closed form: v = vt·tanh(s·aHill/vt))
  const vt = Math.sqrt(FZP.aHill / k), sa = Math.min(s, FZP.tBack);
  if (s <= 0) return { p: x0, v: 0 };
  const p = x0 + (vt * vt / FZP.aHill) * Math.log(Math.cosh(sa * FZP.aHill / vt)), v = vt * Math.tanh(sa * FZP.aHill / vt);
  if (s <= FZP.tBack) return { p, v };
  const tau = s - FZP.tBack, ts = v / dec;
  return tau >= ts ? { p: p + v * v / (2 * dec), v: 0 } : { p: p + v * tau - 0.5 * dec * tau * tau, v: v - dec * tau };
}
function fzParked(c, s) { const r = fzSlide(c.x, 0, FZP.aHill, s, FZP.decCar); return { x: r.p, z: c.z, v: r.v }; }
// the wheelie bins (pairs at the kerb, bin day): slide with a little drag; tumble when friction returns
const FZ_BINS = [];
for (const [bx, z] of [[-8.9, -11.15], [-8.25, -11.15], [-1.6, -11.15], [-0.95, -11.15], [3.1, -11.15], [3.75, -11.15], [8.3, -11.15], [8.95, -11.15],
  [-12.6, -22.45], [-11.95, -22.45], [-1.2, -22.45], [-0.55, -22.45]]) FZ_BINS.push({ x: bx, z, k: 0.012 });
function fzBin(b, s) { const r = fzDragSlide(b.x, s, b.k, FZP.decBody); return { x: r.p, z: b.z, v: r.v }; }

// the braking car: coming down the downhill lane at 10 m/s, braking hard from −0.55 (the screech) for the bus pulling
// out; 7.0 m/s at s = 0; no friction: no braking, it slides on and gains 0.78 m/s every second; at FZ_CRASH.t it hits
// the bus's back corner, is knocked across and spins; at 10 its tyres bite while it slides sideways: it lurches onto
// two wheels and drops back (a car's stability factor is above μ: no roll).
const FZ_CAR = { x0: -15.0, v0: 7.0, brake: -0.55, vPre: 10.3 };
// the bus: a double-decker just pulling away from the stop on the north side (centre x 26, z −18.6), at 1.4 m/s, nose
// 6° towards the road's middle (+z) and turning further at 0.085 rad/s (near full lock). With no friction it keeps both: it
// slides on, still turning about its middle (its spin can't change), and gains 0.78 m/s each second downhill like
// everything else. By 10 s it's slid 55 m and turned 55° (its overhangs just clear both kerbs).
const FZ_BUS = { x0: 26.0, z0: -18.4, v0: 1.4, yaw0: 0.105, w: 0.085, L: 11.0, W: 2.55, H: 4.38 };
function fzBusRaw(s) {
  const B = FZ_BUS, sa = Math.max(0, s);
  const yaw = B.yaw0 + B.w * sa;                                                 // heading: angle from +x towards +z
  // velocity stays what it was (v0 along the initial heading) plus the hill's pull along +x
  const vx = B.v0 * Math.cos(B.yaw0), vz = B.v0 * Math.sin(B.yaw0);
  return { x: B.x0 + vx * sa + fzHalf(FZP.aHill, sa), z: B.z0 + vz * sa, yaw, vx: vx + FZP.aHill * sa, vz };
}
const FZ_CRASH = { t: null };
// the car's raw path in the lane, before the crash
function fzCarRaw(s) {
  const C = FZ_CAR;
  if (s < C.brake) return { x: C.x0 - C.vPre * (C.brake - s) - (C.vPre - C.v0) * (-C.brake) * 0.5, v: C.vPre };
  if (s < 0) { const u = (s - C.brake) / -C.brake; return { x: C.x0 - (C.vPre + C.v0) * 0.5 * (-s) - 0 * u, v: MathX.lerp(C.vPre, C.v0, u) }; }
  const r = fzSlide(C.x0, C.v0, FZP.aHill, s, -1);
  return { x: r.p, v: r.v };
}
(function () {
  // when the car's front (x + 2.36 along the lane, either front corner, 0.8 m from its middle) gets inside the bus
  for (let s = 0; s < 10; s += 0.002) {
    const b = fzBusRaw(s), c = fzCarRaw(s);
    for (const dz of [-0.8, 0, 0.8]) {
      const px = c.x + 2.36 - b.x, pz = FZ_W.down + dz - b.z;
      const u = px * Math.cos(b.yaw) + pz * Math.sin(b.yaw), w = -px * Math.sin(b.yaw) + pz * Math.cos(b.yaw);   // bus-local (along, across)
      if (Math.abs(u) < FZ_BUS.L / 2 && Math.abs(w) < FZ_BUS.W / 2) { FZ_CRASH.t = s; FZ_CRASH.x = c.x; FZ_CRASH.v = c.v; FZ_CRASH.u = u; break; }
    }
    if (FZ_CRASH.t != null) break;
  }
})();
// the bus and the car, after the crash too
function fzBus(s) {
  const b = fzBusRaw(s);
  if (FZ_CRASH.t == null || s < FZ_CRASH.t) return b;
  // the knock: +0.55 m/s along +x and a little more spin
  const t = s - FZ_CRASH.t;
  const out = Object.assign({}, b);
  out.x += 0.55 * Math.min(t, FZP.tBack - FZ_CRASH.t); out.yaw += 0.02 * Math.min(t, FZP.tBack - FZ_CRASH.t);
  return out;
}
function fzCar(s) {
  const c = fzCarRaw(s);
  if (FZ_CRASH.t == null || s < FZ_CRASH.t) return { x: c.x, z: FZ_W.down, yaw: 0, v: c.v };
  const t = Math.min(s, FZP.tBack) - FZ_CRASH.t, C = FZ_CRASH;
  // after the hit: slowed by 5 m/s along +x (+ the hill), knocked towards the north side at 1.5 m/s, spinning 0.9 rad/s
  // (yaw here: + turns the nose towards −z, i.e. the car's own three.js rotation.y)
  const vx = C.v - 5.0, x = C.x + vx * t + fzHalf(FZP.aHill, t), z = FZ_W.down - 1.5 * t * Math.exp(-t * 0.25), yaw = 0.9 * t * Math.exp(-t * 0.08);
  return { x, z, yaw, v: vx + FZP.aHill * t };
}

// the cyclist: coming down the driving lane at 6.5 m/s from far up the hill; can't steer, so can't balance: leans and
// goes over (0 → 1.3 s) and slides on, on the bike's side, gaining speed (passes your house at about 7 s)
const FZ_BIKE = { x0: -68.0, v0: 6.5, z: FZ_W.down - 1.0 };
function fzBike(s) {
  const r = fzSlide(FZ_BIKE.x0, FZ_BIKE.v0, FZP.aHill, s, FZP.decBody);
  const lean = s <= 0 ? 0 : Math.min(1.35, 0.06 * Math.exp(s * 3.05) - 0.06);
  return { x: s <= 0 ? FZ_BIKE.x0 + FZ_BIKE.v0 * s : r.p, z: FZ_BIKE.z - 0.4 * Math.min(1, Math.max(0, s) / 1.3), lean, v: s <= 0 ? FZ_BIKE.v0 : r.v };
}

// people sliding: a start (x0, z), a velocity along x at s = 0 (walking), and when they go down
const FZ_WALKER = { x0: 4.2, z: -10.4, v0: -1.3, slip: 0.22 };    // walking uphill past your house, with her dog
const FZ_DOG = { dx: -1.55, dz: 0.4 };
const FZ_LACE = { x0: 18.0, z: -22.9 };                             // crouched, tying his laces, at the bus stop
const FZ_LADDER = { x: -8.8, zWall: FZ_W.yardN, foot: 0.95, top: 4.0, man: 1.55 };
function fzPerson(x0, v0, s, k = 0.006) {
  if (s <= 0) return { x: x0 + v0 * s, v: v0 };
  // a = aHill − k·v|v| (drag), integrated in small steps (cached per person)
  return fzPersonInt(x0, v0, s, k);
}
const FZ_PCACHE = {};
function fzPersonInt(x0, v0, s, k) {
  const key = x0 + ':' + v0 + ':' + k;
  let C = FZ_PCACHE[key];
  if (!C) {
    C = FZ_PCACHE[key] = { x: [x0], v: [v0] };
    let x = x0, v = v0; const dt = 0.005;
    for (let t = dt; t <= 14; t += dt) {
      let a;
      if (t <= FZP.tBack) a = FZP.aHill - k * v * Math.abs(v);
      else a = Math.abs(v) < 0.05 ? -v / dt : -Math.sign(v) * FZP.decBody - k * v * Math.abs(v);
      v += a * dt; x += v * dt; C.x.push(x); C.v.push(v);
    }
  }
  const i = Math.min(C.x.length - 1, Math.max(0, Math.round(s / 0.005)));
  return { x: C.x[i], v: C.v[i] };
}
// the ladder: foot slides away from the wall (and downhill), top slides down the wall; it leaves the wall and falls
// flat by FZ_LADDER.flat; angle from the ground (rad)
FZ_LADDER.L = Math.hypot(FZ_LADDER.foot, FZ_LADDER.top);
FZ_LADDER.th0 = Math.atan2(FZ_LADDER.top, FZ_LADDER.foot);
FZ_LADDER.flat = 1.15;
function fzLadder(s) {
  const D = FZ_LADDER;
  if (s <= 0) return { th: D.th0, footZ: D.zWall + D.foot, x: D.x };
  const u = Math.min(1, s / D.flat), th = D.th0 * (1 - u * u * (0.35 + 0.65 * u));
  // the foot moves out as the top comes down (it stays on the wall while th > its 2/3 point, then flies)
  const footZ = D.zWall + D.L * Math.cos(th) + 0.4 * Math.max(0, u - 0.7);
  const x = fzPerson(D.x, 0, Math.max(0, s - 0.1), 0.004).x;
  return { th, footZ, x };
}

// the scaffold on the house opposite (x 3.5 … 11.5): every clamp lets go at s = 0. Every horizontal tube and board
// falls together at g until it lands on what's below (ground, then the pile); the standards stand on their base plates
// for a moment and topple into the road (they were held up by the clamps); then the heap slides downhill.
const FZ_SCAF = { x: [3.5, 5.5, 7.5, 9.5, 11.5], zIn: FZ_W.yardN + 0.35, zOut: FZ_W.yardN + 1.35, lifts: [2.0, 4.0, 6.0], top: 7.0 };
// a falling piece: from height h0 (above the yard) lands on the heap at h1 at sqrt(2(h0−h1)/g)
function fzFall(h0, h1, s) {
  if (s <= 0) return { y: h0, landed: false };
  const tl = Math.sqrt(2 * Math.max(0, h0 - h1) / FZP.g);
  if (s < tl) return { y: h0 - 0.5 * FZP.g * s * s, landed: false, tl };
  const b = s - tl, bounce = Math.max(0, Math.sin(b * 22)) * 0.06 * Math.exp(-b * 9);
  return { y: h1 + bounce, landed: true, tl, after: b };
}
// a standard (vertical tube) tips towards the road from a small lean; angle from vertical
function fzStandard(i, s) {
  if (s <= 0) return 0;
  const th0 = 0.05 + 0.02 * i, w = Math.sqrt(3 * FZP.g / (2 * FZ_SCAF.top));
  const th = th0 * Math.cosh(w * s * 1.9);                                      // (knocked by the falling tubes: faster)
  return Math.min(th, Math.PI / 2 - 0.12);
}
// the builders' sand: a heap at the scaffold's foot, on the far pavement. Grains: the heap slumps flat in ~0.5 s and
// spreads, then the sheet slides downhill and spills over the kerb into the gutter
const FZ_SAND = { x: 13.0, z: -23.0, r: 0.9, h: 0.75, n: 2600 };
FZ_SAND.g = (function () {
  const r = new RNG(7713), G = [];
  for (let i = 0; i < FZ_SAND.n; i++) {
    const a = r.range(0, Math.PI * 2), rr = FZ_SAND.r * Math.sqrt(r.next()), hMax = FZ_SAND.h * (1 - rr / FZ_SAND.r);
    G.push({ a, rr, y: hMax * Math.pow(r.next(), 0.7), sp: r.range(0.6, 1.25), s: r.range(0.03, 0.07), c: r.range(0, 1) });
  }
  return G;
})();
function fzGrain(i, s) {
  const S = FZ_SAND, g = S.g[i];
  if (s <= 0) return { x: S.x + Math.cos(g.a) * g.rr, y: g.y, z: S.z + Math.sin(g.a) * g.rr };
  const sa = Math.min(s, FZP.tBack);
  // slump: falls from its height; the heap's grains spread outwards at ~sqrt(2 g h)·sp
  const tf = Math.sqrt(2 * Math.max(0.001, g.y) / FZP.g), y = sa < tf ? g.y - 0.5 * FZP.g * sa * sa : 0;
  const vr = Math.sqrt(2 * FZP.g * (g.y + 0.15)) * 0.55 * g.sp;
  const rr = g.rr + vr * Math.min(sa, 0.9) * (1 - Math.min(sa, 0.9) / 1.8) + 0.25 * Math.max(0, sa - 0.9) * g.sp;
  let x = S.x + Math.cos(g.a) * rr + fzHalf(FZP.aHill, Math.max(0, sa - 0.15)) * (0.85 + 0.25 * g.sp);
  let z = S.z + Math.sin(g.a) * rr * 0.9;
  // the kerb: grains that reach it drop into the gutter and run along it
  let yy = y;
  if (z > FZ_W.pavN[0] - 0.05) { z = FZ_W.pavN[0] - 0.02 + (z - FZ_W.pavN[0]) * 0.35; yy = y - 0.12; }
  z = Math.max(z, FZ_W.yardN + 0.1);
  return { x, y: yy, z };
}

// what the readout says about the hill: the speed of everything that started at rest on it (km/h)
const fzHillKmh = (s) => 3.6 * FZP.aHill * MathX.clamp(s, 0, FZP.tBack);

// after s = 10: anything with a velocity skids along it to a stop at `dec`; its position and how far into the stop
function fzSkid(p10, vx, vz, dec, s) {
  const v = Math.hypot(vx, vz), tau = Math.max(0, s - FZP.tBack), ts = v / dec;
  const d = tau >= ts ? v * v / (2 * dec) : v * tau - 0.5 * dec * tau * tau;
  return { x: p10.x + (v ? vx / v : 0) * d, z: p10.z + (v ? vz / v : 0) * d, v: Math.max(0, v - dec * tau), u: ts ? Math.min(1, tau / ts) : 1, ts };
}
// the bus and the car, with the return: the bus (sliding ~60° off its heading) tips over over ~1.25 s
// and slides to a stop on it; the car lurches onto two wheels and drops back while it skids round
function fzBusAt(s) {
  if (s <= FZP.tBack) return Object.assign(fzBus(s), { roll: 0 });
  const b = fzBus(FZP.tBack), b2 = fzBus(FZP.tBack - 0.01);
  const vx = (b.x - b2.x) / 0.01, vz = (b.z - b2.z) / 0.01, k = fzSkid(b, vx, vz, FZP.decCar * 0.8, s);
  const tau = s - FZP.tBack, u = MathX.clamp(tau / 1.25, 0, 1);
  const roll = (Math.PI / 2) * (u * u * (3 - 2 * u)) + (u >= 1 ? 0.03 * Math.exp(-(tau - 1.25) * 8) * Math.sin((tau - 1.25) * 30) : 0);
  return { x: k.x, z: k.z, yaw: b.yaw + 0.05 * u, roll, vx, vz, skid: k };
}
function fzCarAt(s) {
  if (s <= FZP.tBack) return Object.assign(fzCar(s), { roll: 0 });
  const c = fzCar(FZP.tBack), c2 = fzCar(FZP.tBack - 0.01);
  const vx = (c.x - c2.x) / 0.01, vz = (c.z - c2.z) / 0.01, k = fzSkid(c, vx, vz, FZP.decCar, s);
  const wy = (c.yaw - c2.yaw) / 0.01, tau = s - FZP.tBack;
  const yaw = c.yaw + wy * Math.min(tau, k.ts) * (1 - 0.5 * Math.min(1, tau / Math.max(0.01, k.ts)));
  const lurch = 0.32 * Math.sin(Math.PI * MathX.clamp(tau / 0.9, 0, 1)) * Math.exp(-tau * 0.4);
  return { x: k.x, z: k.z, yaw, roll: lurch, v: k.v };
}
