/* =====================================================================
   PHYSICS — "What if gravity tilted 90° for one hour?" Every motion in the film is a pure function of STORY time s
   (seconds after 7:42:00 AM, when gravity turns; it turns back at s = 3600, 8:42:00 AM).
   Metres; y up; your street runs along x from your house (its front wall at x = 0) east to the end of the street (x = 285);
   north is −z. The rule (PLAN.md § 1): for one hour, gravity in your town pulls east (+x) instead of down, just as
   strong (9.81 m/s²). The air and the ground keep their old down (they are the medium and the floor of the story).
   What follows, and is drawn:
     · nothing rests on anything any more (a floor is now a wall): every loose thing falls east, without turning
       (uniform gravity puts no twist on a body), until it hits something: free fall, with air drag for light things
     · what is bolted, nailed or grown in stays and bends: your (timber) house, the north houses, lamp posts, trees
     · brick houses are only held down by their weight (they sit on a damp-proof course): now only the mortar's grip on
       that strip holds them; under a load that never stops it creeps, then lets go (the terrace, at 8:09:00)
     · at s = 3600 down is down again: everything that is off the floor falls (the rain, the books, you)
   ===================================================================== */

const GTP = {
  leanEnd: 0.9,             // your house's lean once gravity is back (degrees east: a permanent set)
  g: 9.81,
  tBack: 3600,              // 8:42:00 AM
  clock0: 7 * 3600 + 42 * 60,
  alert: 235,               // your phone's emergency alert (7:45:55)
};

// ---------------------------------------------------------------------------------------------------------------------
// THE WORLD'S LAYOUT
// ---------------------------------------------------------------------------------------------------------------------
const GT_W = {
  // your house: a timber house at the head of the street, facing east down it. The bedroom is upstairs at the front
  house: { x: [-10.5, 0], z: [-5.2, 5.2], eaves: 6.0, ridge: 8.6 },
  floorY: 3.0,                                       // the bedroom floor (the ground floor is 3.0 m)
  roomX: -0.15,                                      // the bedroom's east wall, inside face (= room-local x 0)
  room: { x: [-3.6, 0], z: [-1.6, 1.6], h: 2.5 },    // room-local (floor y 0, east wall x 0)
  win: { z: [-0.6, 0.6], y: [0.9, 2.1] },            // the window (room-local)
  door: { z: [0.45, 1.35], h: 2.05 },                // the door, in the west wall (room-local)
  // the street: from your garden gate to the end of the street (x 285), where it meets the hillside: a stone retaining
  // wall and the slope above it are the ground (they keep their old down), so the end of the street is the bottom
  x0: 6, end: 285,
  road: [-3.5, 3.5], pavN: [-5.5, -3.5], pavS: [3.5, 5.5],
  frontN: -9.5, frontS: 9.5,                         // the house fronts either side
  terrace: [14, 164], terraceZ: [9.5, 17.5],         // the brick terrace (south side): 30 houses of 5 m
  park: [164, 285],                                  // the green (south side) from the terrace to the end
};
// room-local → world
const gtRoomW = (x, y, z) => [x + GT_W.roomX, y + GT_W.floorY, z];

const gtSm = (s, a, b) => MathX.smooth(s, a, b);
const gtLin = (s, a, b) => MathX.clamp((s - a) / (b - a), 0, 1);

// ---------------------------------------------------------------------------------------------------------------------
// FALLING (east, +x), from rest or with a starting speed, with or without air drag
// ---------------------------------------------------------------------------------------------------------------------
// distance fallen after time u from rest, terminal speed vt (Infinity: no drag): vt²/g · ln cosh(g u / vt)
function gtDrop(u, vt = Infinity) {
  if (u <= 0) return 0;
  if (!isFinite(vt)) return 0.5 * GTP.g * u * u;
  const k = GTP.g * u / vt; return vt * vt / GTP.g * (k > 20 ? k - Math.LN2 : Math.log(Math.cosh(k)));
}
function gtDropV(u, vt = Infinity) { if (u <= 0) return 0; return isFinite(vt) ? vt * Math.tanh(GTP.g * u / vt) : GTP.g * u; }
// the time to fall d from rest
function gtDropT(d, vt = Infinity) {
  if (d <= 0) return 0;
  if (!isFinite(vt)) return Math.sqrt(2 * d / GTP.g);
  return vt / GTP.g * Math.acosh(Math.exp(d * GTP.g / (vt * vt)));
}
// a body that falls `d` (m) from rest starting at story time s0, then stops with a small rebound (e) and settles.
// returns { x (m fallen), v, hit (story time of the hit, or null), vHit }
function gtFall(s, d, o = {}) {
  const s0 = o.s0 || 0, vt = o.vt ?? Infinity, v0 = o.v0 || 0, u = s - s0;
  if (u <= 0) return { x: 0, v: 0, hit: null, vHit: 0 };
  let tHit, vHit, x;
  if (v0) {                                   // (no drag) x = v0 u + ½ g u²
    tHit = (-v0 + Math.sqrt(v0 * v0 + 2 * GTP.g * d)) / GTP.g; vHit = v0 + GTP.g * tHit;
    if (u < tHit) return { x: v0 * u + 0.5 * GTP.g * u * u, v: v0 + GTP.g * u, hit: null, vHit };
  } else {
    tHit = gtDropT(d, vt); vHit = gtDropV(tHit, vt);
    if (u < tHit) return { x: gtDrop(u, vt), v: gtDropV(u, vt), hit: null, vHit };
  }
  // the rebound: up (west) by (e·v)²/2g, back down; then a few small bounces
  const e = o.e ?? 0.12, w = u - tHit;
  let vb = e * vHit, tt = w; x = d;
  for (let k = 0; k < 4 && vb > 0.05; k++) {
    const T = 2 * vb / GTP.g;
    if (tt < T) { x = d - (vb * tt - 0.5 * GTP.g * tt * tt); break; }
    tt -= T; vb *= 0.35;
  }
  return { x, v: 0, hit: s0 + tHit, vHit };
}
// a free fall that hits "the floor" at height-loss h (m) when gravity is back (s ≥ 3600): time to fall h from rest
const gtDownT = (h) => Math.sqrt(2 * Math.max(0, h) / GTP.g);
// height above a floor while falling back down after the return (from h0, with a small bounce)
function gtDownY(s, h0, e = 0.1) {
  const u = s - GTP.tBack; if (u <= 0) return h0;
  const r = gtFall(GTP.tBack + u, h0, { s0: GTP.tBack, e });
  return h0 - r.x;
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR BEDROOM (room-local; floor y 0; east wall x 0; the window z −0.6…0.6, y 0.9…2.1). Everything loose falls east
// and stops against the wall or against what is already there; the order is solved by hand (each stop distance below
// is from the layout), the times and speeds by gtFall.
// ---------------------------------------------------------------------------------------------------------------------
const GT_ROOM = {
  // the bed (2.0 × 1.4 × 0.55, against the north wall): falls 1.0 m, its foot hits the wall under the window's left side
  bed: { x: [-3.0, -1.0], z: [-1.6, -0.2], h: 0.55, d: 1.0 },
  // the wardrobe (west wall): falls 1.0 m onto the bed's head, then topples over onto the bed (its top towards the wall)
  wardrobe: { x: [-3.6, -3.0], z: [-1.5, -0.55], h: 2.0, d: 1.0, topple: [0.0, 0.62] },
  // the desk (south wall), the laptop and the lamp on it; the chair in front of it hits the window's corner
  desk: { x: [-2.4, -1.2], z: [0.95, 1.6], h: 0.75, d: 1.2 },
  laptop: { x: [-2.05, -1.7], z: [1.1, 1.38], d: 1.7 },
  lamp: { x: [-1.5, -1.36], z: [1.38, 1.52], d: 1.36 },
  chair: { x: [-2.1, -1.55], z: [0.15, 0.7], h: 1.0, d: 1.55 },
  rug: { x: [-2.9, -0.7], z: [-0.6, 0.9], d: 0.7 },
  // the shelf of books (on the west wall opposite the window, 1.35 m up, north of the door): each book falls the 3.4 m
  // across the room; the ones in line with the window land on the glass (beside you), the rest on the wall
  shelf: { x: [-3.6, -3.38], z: [-1.25, -0.28], y: 1.35 },
  // you: standing at the window, 0.32 m from the glass, the mug in your right hand
  you: { x: -0.32, d: 0.17 },
  // the ceiling light: a 0.55 m flex from the middle of the ceiling
  light: { x: -1.8, z: 0, L: 0.55 },
  // the clock on the north wall
  clock: { x: -1.6, y: 1.75 },
};
// the books: standing on the shelf side by side along z: { z0 (their north face), w (thickness), h, c (colour), d (the
// fall to the wall or the glass), glass (on the glass?) }
const GT_BOOKS = (() => {
  const B = [], r = new RNG(77), S = GT_ROOM.shelf; let z = S.z[0] + 0.04;
  while (z < S.z[1] - 0.05) { const w = r.range(0.025, 0.055), h = r.range(0.2, 0.3), dep = r.range(0.14, 0.2); B.push({ z0: z, w, h, dep, c: r.int(0, 9), lean: r.range(-0.08, 0.08) }); z += w + r.range(0.0, 0.006); }
  for (const b of B) { const zc = b.z0 + b.w / 2; b.glass = zc > GT_W.win.z[0] + 0.02 && zc < GT_W.win.z[1]; b.d = (b.glass ? 0.06 : 0) - (S.x[0] + 0.02) - b.dep; }
  return B;
})();
// a book at story time s: its west face's x (room-local), y (its bottom), and the fall
function gtBook(i, s) {
  const b = GT_BOOKS[i], f = gtFall(s, b.d, { e: 0.1 });
  let x = GT_ROOM.shelf.x[0] + 0.02 + f.x, y = GT_ROOM.shelf.y, gone = false;
  // the ones on the glass go out with it (s 2530) and fall down the street
  if (b.glass && s >= GT_GLASS.go) { x += gtDrop(s - GT_GLASS.go - 0.05 * (i % 4)); gone = x > 300; }
  // the rest drop to the floor when gravity comes back
  else if (s >= GTP.tBack) y = gtDownY(s, GT_ROOM.shelf.y);
  return { x, y, f, gone };
}
// the bed, the desk, the chair: a fall of d from rest
const gtRoomFall = (k, s) => gtFall(s, GT_ROOM[k].d, { e: 0.06 });

// the wardrobe: falls 1.0 m onto the bed's west end (s 0.45), then pivots about its lower east edge onto the bed
function gtWardrobe(s) {
  const W = GT_ROOM.wardrobe, f = gtFall(s, W.d, { e: 0.04 });
  if (!f.hit || s < f.hit) return { x: f.x, a: 0 };
  // a rigid tip about the base edge: θ'' = (3g / 2h) cos θ (gravity now along x, the box rotating "down" onto the bed)
  const u = s - f.hit, T = 0.78;                               // (it reaches the mattress in ~0.8 s)
  const k = MathX.clamp(u / T, 0, 1), a = (Math.PI / 2) * k * k;
  const land = u > T ? Math.exp(-(u - T) * 9) * Math.sin((u - T) * 26) * 0.04 : 0;
  return { x: f.x, a: Math.min(Math.PI / 2, a) - land, hit2: f.hit + T };
}

// you: you fall the 0.17 m onto the glass (s 0.19); you lie there (s < 34); you ease off it sideways onto the wall
// beside the window (34 → 52) and sit with your back against the south wall; at 10 minutes to go (s 3000) you move to
// the corner (y 0.25); at s = 3600 you drop to the floor
const GT_YOU = { hitGlass: gtDropT(0.17), crawl: [34, 52], seat: { y: 1.25, z: 1.0 }, corner: [3000, 3030], cornerY: 0.3 };

// the cat: asleep on the bed (room-local x −2.15, z −0.9, on the mattress); falls with the bed, keeps going when the
// bed stops, turns in the air (the righting reflex) and lands feet-first on the wall at 0.61 s
const GT_CAT = { x0: -2.15, z: -0.9, y: 0.62, len: 0.42 };
GT_CAT.d = -GT_CAT.x0 - GT_CAT.len / 2;                       // to the wall
GT_CAT.land = gtDropT(GT_CAT.d);

// the ceiling light: a pendulum (0.55 m) that was hanging down, now pulled east: it swings out and settles pointing at
// the window; at s = 3600 it swings back. θ = angle from the old vertical towards +x
function gtLight(s) {
  const w = Math.sqrt(GTP.g / GT_ROOM.light.L), z = 0.07;
  const sw = (u, from, to) => to + (from - to) * Math.exp(-z * w * u) * Math.cos(w * u * Math.sqrt(1 - z * z));
  if (s <= 0) return 0;
  if (s < GTP.tBack) return sw(s, 0, Math.PI / 2);
  return sw(s - GTP.tBack, Math.PI / 2, 0);
}

// the bath water next door comes through the edges of your door (s 120 → 330), runs down (east) to the window wall and
// lies there: 150 litres over the 8 m² of wall = 1.9 cm (minus what the bed and the wardrobe stand in)
const GT_BATH = { t0: 170, t1: 380, litres: 150 };
// how much of it has come through (0…1): fastest at first, while the bathroom behind the door is full
const gtBathIn = (s) => { const u = gtLin(s, GT_BATH.t0, GT_BATH.t1); return 1 - (1 - u) * (1 - u); };
const gtPool = (s) => (s < GT_BATH.t0 ? 0 : 0.019 * gtBathIn(s) * (s < GT_GLASS.go ? 1 : 0));

// the window glass: cracked by the mug (0.19) and the chair's corner (0.62); you off it at 34–52; it carries the pool,
// the chair, the mug, the books that slid onto it; under a load that never stops cracked glass weakens (static
// fatigue); it lets go at 8:24:10. Everything on it falls out, down the street
const GT_GLASS = { go: 2530 };
// how far the crack has run (0…1)
function gtCrack(s) {
  if (s < GT_YOU.hitGlass) return 0;
  return MathX.clamp(0.18 + 0.2 * gtSm(s, 0.55, 0.7) + 0.12 * gtSm(s, 8, 30) + 0.12 * gtSm(s, 400, 1500) + 0.4 * gtSm(s, GT_GLASS.go - 400, GT_GLASS.go), 0, 1);
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR HOUSE: timber, nailed, bolted to its foundation by 22 anchor bolts. It leans (racks) east and keeps creeping
// (wood under a load that lasts creeps); one bolt snaps at 8:37:30; at s = 3600 it springs most of the way back
// ---------------------------------------------------------------------------------------------------------------------
const GT_BOLT = { snap: 55 * 60 + 30, n: 22 };
function gtLean(s) {                                           // degrees (east)
  if (s <= 0) return 0;
  const sway = (u, a) => (u > 0 ? a * Math.exp(-u * 0.9) * Math.sin(u * 2 * Math.PI * 1.6) : 0);
  const loaded = (x) => 0.55 * gtSm(x, 0, 0.4) + 0.72 * Math.log10(1 + x / 40) / Math.log10(1 + 3600 / 40) + sway(x, 0.18)
    + (x > GT_BOLT.snap ? 0.2 * gtSm(x, GT_BOLT.snap, GT_BOLT.snap + 0.3) + sway(x - GT_BOLT.snap, 0.12) : 0);
  if (s < GTP.tBack) return loaded(s);
  const u = s - GTP.tBack, L = loaded(GTP.tBack);
  return GTP.leanEnd + (L - GTP.leanEnd) * Math.exp(-u * 2.5) + sway(u, -0.5);
}


// ---------------------------------------------------------------------------------------------------------------------
// THE STREET: everything loose falls down it (x → 285), and piles up against the retaining wall, band by band (across z)
// ---------------------------------------------------------------------------------------------------------------------
// kinds: car (terminal speed ~180 m/s: almost no drag over 285 m), bin (light, ~27 m/s), a white garden chair (~15 m/s).
// (it is 7:42 on a weekday: the cars are parked and empty; out on the street there is only the jogger)
const GT_FALLERS = [
  // parked cars [x (rear), z (centre), type, colour, faces +x?]
  { k: 'car', x: 17, z: -2.6, type: 'hatch', col: '#a8acb2', dir: 1 },
  { k: 'car', x: 33, z: -2.6, type: 'sedan', col: '#2c3e57', dir: 1 },
  { k: 'car', x: 61, z: -2.6, type: 'suv', col: '#6b2a2a', dir: 1 },
  { k: 'car', x: 92, z: -2.6, type: 'hatch', col: '#e8e4dc', dir: -1 },
  { k: 'car', x: 128, z: -2.6, type: 'sedan', col: '#3b4b3c', dir: 1 },
  { k: 'car', x: 170, z: -2.6, type: 'hatch', col: '#c9a23a', dir: 1 },
  { k: 'car', x: 214, z: -2.6, type: 'suv', col: '#20252b', dir: -1 },
  { k: 'car', x: 252, z: -2.6, type: 'sedan', col: '#8a929a', dir: 1 },
  { k: 'car', x: 25, z: 2.6, type: 'suv', col: '#4a5866', dir: -1 },
  { k: 'car', x: 47, z: 2.6, type: 'hatch', col: '#9a3b2e', dir: -1 },
  { k: 'car', x: 78, z: 2.6, type: 'van', col: '#e9e6df', dir: -1 },
  { k: 'car', x: 109, z: 2.6, type: 'sedan', col: '#5a5f66', dir: -1 },
  { k: 'car', x: 140, z: 2.6, type: 'hatch', col: '#2d5a7a', dir: 1 },
  { k: 'car', x: 196, z: 2.6, type: 'sedan', col: '#7a6a52', dir: -1 },
  { k: 'car', x: 236, z: 2.6, type: 'hatch', col: '#b8b2a6', dir: -1 },
  // bins (bin day)
  ...[22, 41, 58, 73, 99, 118, 150, 166, 189, 224, 260].map((x, i) => ({ k: 'bin', x, z: i % 2 ? 4.0 : -4.0, col: ['#2a2d30', '#2f5a3a', '#6a4a2a', '#2a4a7a'][i % 4] })),
  // a white plastic garden chair from a front garden opposite (the camera falls with it)
  { k: 'gchair', x: 18, z: -6.6, id: 'gchair' },
];
const GT_LEN = { car: { hatch: 4.12, sedan: 4.72, suv: 4.78, van: 5.3 }, bin: 0.72, gchair: 0.6 };
const GT_VT = { car: 180, bin: 27, gchair: 15 };
// the pile against the retaining wall (x 285): bands across the street (and one for the gardens opposite), each with a
// front that moves west as things land
(function gtSolvePile() {
  const F = GT_FALLERS, bands = [[-5.5, -3.5], [-3.5, -1.75], [-1.75, 0], [0, 1.75], [1.75, 3.5], [3.5, 5.5], [-14, -5.5]];
  const front = bands.map(() => GT_W.end);
  for (const f of F) {
    f.len = f.k === 'car' ? GT_LEN.car[f.type] : GT_LEN[f.k];
    f.w = f.k === 'car' ? 1.9 : 0.6;
    f.vt = f.k === 'car' ? GT_VT.car : GT_VT[f.k];
    f.bands = bands.map((b, i) => (f.z + f.w / 2 > b[0] && f.z - f.w / 2 < b[1] ? i : -1)).filter((i) => i >= 0);
  }
  // the order of arrival (the light things later than their distance says)
  const order = F.map((f, i) => i).sort((a, b) => gtDropT(GT_W.end - F[a].x, F[a].vt) - gtDropT(GT_W.end - F[b].x, F[b].vt));
  for (const i of order) {
    const f = F[i], fr = Math.min(...f.bands.map((b) => front[b]));
    const crush = f.k === 'car' ? 0.55 : f.k === 'bin' ? 0.5 : 0.8;          // (crumpled length / length)
    f.stop = fr - f.len * crush;                                             // its rear end's x when it stops
    f.d = f.stop - f.x;
    f.crush = crush;
    for (const b of f.bands) front[b] = f.stop - 0.05;
    f.tHit = gtDropT(f.d, f.vt); f.vHit = gtDropV(f.tHit, f.vt);
  }
  GTP.pileFront = front;
})();
// a faller at story time s: { x (rear), v, hit, k (crumple 0…1) }
function gtFaller(f, s) {
  const r = gtFall(s, f.d, { vt: f.vt, e: 0.03 });
  const k = r.hit && s >= r.hit ? MathX.clamp((s - r.hit) / 0.12, 0, 1) : 0;
  return { x: f.x + r.x, v: r.v, hit: r.hit, k };
}
// the fastest anything hit the bottom: the first parked car's ~ 72 m/s
GTP.vMax = Math.max(...GT_FALLERS.map((f) => f.vHit));

// roof tiles: the end tiles of every roof work loose and fall all hour (most in the first minutes): each has a house, a
// release time and a terminal speed (they flutter: ~25 m/s); they stop at the pile. [x0, y0, z0, s0, vt, spin seed]
const GT_TILES = (() => {
  const r = new RNG(311), T = [];
  for (let i = 0; i < 420; i++) {
    const north = r.next() < 0.62, x0 = north ? r.range(10, 270) : r.range(GT_W.terrace[0], GT_W.terrace[1]);
    const z0 = north ? r.range(-17, -10) : r.range(10, 17), y0 = north ? r.range(5.6, 8.4) : r.range(6.6, 9.3);
    const s0 = i < 120 ? r.range(0.3, 25) : i < 260 ? r.range(25, 400) : r.range(400, 3590);
    T.push({ x0, y0, z0, s0: north || s0 < 27 * 60 ? s0 : -1, vt: r.range(20, 30), seed: r.next(), d: GT_W.end - 1.5 - r.range(0, 6) - x0 });
  }
  return T.filter((t) => t.s0 >= 0);
})();
// a tile at story time s: null before it lets go and after it lands (it joins the pile: not drawn)
function gtTile(T, s) {
  const u = s - T.s0; if (u < 0) return null;
  const x = gtDrop(u, T.vt); if (x >= T.d) return null;
  return { x: T.x0 + x, y: T.y0, z: T.z0, a: u * (4 + 6 * T.seed) };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE JOGGER: running up the street (west, 3 m/s) on the north pavement, just past a lamp post. She rises (like a
// ball thrown up), stops, falls back past the post and hooks it (s 0.72, at 4 m/s). Hangs; climbs on top (100 → 132);
// sits; edges down to its foot (3020 → 3080); at s = 3600 she drops the last 0.45 m and sits on the pavement
// ---------------------------------------------------------------------------------------------------------------------
const GT_JOG = { x0: 23.6, z: -4.55, v0: -3.0, post: { x: 24.0, z: -3.95 }, grabY: 1.45, climb: [100, 132], down: [3020, 3080], lowY: 0.45 };
GT_JOG.catch = (-GT_JOG.v0 + Math.sqrt(GT_JOG.v0 ** 2 + 2 * GTP.g * (GT_JOG.post.x - GT_JOG.x0))) / GTP.g;
function gtJog(s) {
  const J = GT_JOG;
  if (s < 0) return { mode: 'run', x: J.x0 + J.v0 * s, ph: (J.x0 + J.v0 * s) / -1.4 * Math.PI * 2 };
  if (s < J.catch) return { mode: 'fly', x: J.x0 + J.v0 * s + 0.5 * GTP.g * s * s, u: s / J.catch };
  if (s < J.climb[0]) return { mode: 'hang', u: s - J.catch };
  if (s < J.climb[1]) return { mode: 'climb', u: (s - J.climb[0]) / (J.climb[1] - J.climb[0]) };
  if (s < GTP.tBack) return { mode: 'sit', y: MathX.lerp(J.grabY - 0.15, J.lowY, gtSm(s, J.down[0], J.down[1])) };
  return { mode: 'after', y: gtDownY(s, J.lowY, 0.05), u: s - GTP.tBack };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE TERRACE (south side, x 14 → 164, 30 brick houses): held on its damp-proof course by the mortar's grip alone, it
// creeps east (tertiary creep: d = k/(T − s) − k/T), lets go at 8:09:00, falls the 120 m to the end of the street as one
// block (nothing to stop it: it falls freely, so nothing inside it is loaded), then crumples house by house
// ---------------------------------------------------------------------------------------------------------------------
const GT_TER = { n: 30, L: 5, release: 27 * 60, T: 1700, k: 88, crushL: 1.7, depth: 8, eaves: 6.6, ridge: 9.4 };
GT_TER.dRel = GT_TER.k / (GT_TER.T - GT_TER.release) - GT_TER.k / GT_TER.T;      // 1.05 m at release (30 cm at 8:06:10)
function gtTerSlip(s) {                                         // metres slipped before release
  const T = GT_TER;
  if (s <= 0) return 0;
  return T.k / (T.T - Math.min(s, T.release)) - T.k / T.T;
}
// house i (0 = the east end): its east face's x shift, its crumple (0…1) and its hit time
function gtTerHouse(i, s) {
  const T = GT_TER, x0 = GT_W.terrace[1] - i * T.L;               // its east face before anything
  if (s <= T.release) return { dx: gtTerSlip(s), k: 0, hit: null };
  const stop = GT_W.end - i * T.crushL;                           // where its east face ends up
  const D = stop - x0 - T.dRel, tHit = gtDropT(D), u = s - T.release;
  if (u < tHit) return { dx: T.dRel + gtDrop(u), k: 0, hit: null, v: GTP.g * u };
  return { dx: stop - x0, k: MathX.clamp((u - tHit) / 0.18, 0, 1), hit: T.release + tHit, v: 0 };
}
GT_TER.hit0 = GT_TER.release + gtDropT(GT_W.end - GT_W.terrace[1] - GT_TER.dRel);
GT_TER.vHit = GTP.g * (GT_TER.hit0 - GT_TER.release);               // 48.5 m/s = 175 km/h
GT_TER.hitLast = gtTerHouse(GT_TER.n - 1, 1e9).hit;
// when it had slipped 30 cm (the caption)
GT_TER.s30 = GT_TER.T - 1 / (0.3 / GT_TER.k + 1 / GT_TER.T);

// ---------------------------------------------------------------------------------------------------------------------
// THE RIVER (4 km west): it falls along its own bed and leaves it at the first bend as spray; the spray, broken into
// drops, falls the 4 km east at their terminal speed (~9.5 m/s) and arrives over your street at 7:49:00
// ---------------------------------------------------------------------------------------------------------------------
const GT_RIVER = { dist: 4000, vDrop: 9.5, leave: 25 };
GT_RIVER.arrive = GT_RIVER.leave + GT_RIVER.dist / GT_RIVER.vDrop;    // ≈ 446 s (7:49:26)
// how hard it is raining over your street (0…1)
const gtRain = (s) => (s < GTP.tBack ? gtSm(s, GT_RIVER.arrive - 10, GT_RIVER.arrive + 40) * (0.85 + 0.15 * Math.sin(s * 0.013)) : Math.max(0, 1 - (s - GTP.tBack) / 9));

// ---------------------------------------------------------------------------------------------------------------------
// THE TREES: a trunk and crown pulled sideways by their own weight bend like a branch (about 20–35° at the crown) and
// hold; they swing a little first; at s = 3600 they whip back past upright and ring down
// ---------------------------------------------------------------------------------------------------------------------
function gtTreeBend(s, stiff, seed) {
  const A = 0.55 / stiff, w = 2 * Math.PI * (0.45 + 0.2 * seed), z = 0.12;
  if (s <= 0) return 0.02 * Math.sin(s * 1.3 + seed * 9);           // (a breath of wind before)
  if (s < GTP.tBack) return A * (1 - Math.exp(-z * w * s) * Math.cos(w * s)) + 0.015 * Math.sin(s * 0.7 + seed * 5);
  const u = s - GTP.tBack; return A * Math.exp(-z * w * u) * Math.cos(w * u);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SUN (7:42 → 8:42 on an autumn morning): low in the east-south-east, climbing; a unit vector towards it
// ---------------------------------------------------------------------------------------------------------------------
function gtSunDir(s) {
  const u = MathX.clamp(s / 3600, -0.1, 1.1), alt = MathX.deg(4.5 + 9.5 * u), az = MathX.deg(8 + 9 * u);   // az: from east towards south
  return [Math.cos(alt) * Math.cos(az), Math.sin(alt), Math.cos(alt) * Math.sin(az)];
}

// the time on the clock: h, m, sec (sec with fraction)
function gtClockParts(s) { const x = GTP.clock0 + s, h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = x % 60; return { h, m, sec }; }
