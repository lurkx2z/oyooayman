/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x WEST, y up, z NORTH (right-handed: the sky
   turns the right way). Your block's street front faces south across the street to the park (−z): the sun shines in at
   your window, and "down" leans that way (towards the equator) as the days shorten.
   A body: { id, kind, pos: [x, y, z] (its origin), m (kg), mu (friction), parts: [[shape, size…, offset x, y, z]] }
     ['box', hx, hy, hz, ox, oy, oz]   half extents
     ['cyl', hh, r, ox, oy, oz]        a cylinder along y: half height, radius
     ['ball', r, ox, oy, oz]
   The page draws each part (kind decides the look). Nothing here is simulated: what moves is posed by physics.js
   (dsSlider: things break loose when down leans past their friction angle, and slide south).
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// YOUR LIVING ROOM (room-local: origin at the middle of the floor). The top (fifth) floor of your block, 12.0 m up; the
// window is in the south wall, towards the park (z = −2), and the sun comes in through it
// ---------------------------------------------------------------------------------------------------------------------
const DS_ROOM = {
  W: 5.0, H: 2.6, D: 4.0,                                  // x −2.5…2.5, y 0…2.6, z −2…2
  origin: [4.0, 12.0, 2.25],                                // (world: your block's street front is z = 0, its walls 0.25 thick)
  win: { x: [-1.0, 1.4], y: [0.85, 2.3] },                 // the window (south wall)
  rad: { x: [-0.8, 1.2], y: [0.12, 0.72], z: [-2.0, -1.9] },   // the radiator under it (fixed to the wall)
  sill: { x: [-1.05, 1.45], y: [0.83, 0.86], z: [-2.0, -1.88] },
  rail: { x: [-1.25, 1.65], y: 2.42 },                     // the curtain rail above the window (fixed)
  door: { x: [1.15, 2.05], h: 2.05 },                      // the door (south wall), to the hall
  lamp: { x: -0.2, z: 0.2, cord: 0.62 },                   // the ceiling lamp: a shade on a cord from the middle of the ceiling
  you: { x: 0.25, z: -1.6 },                               // you, at the window, by the radiator
  bodies: [],
};
{
  const B = DS_ROOM.bodies, add = (o) => B.push(o);
  // the sofa: in the middle of the room, facing west (the TV); its back to the east
  add({ id: 'sofa', kind: 'sofa', pos: [0.55, 0, 0.25], m: 55, mu: 0.5, parts: [['box', 0.475, 0.21, 1.05, 0, 0.21, 0], ['box', 0.11, 0.25, 1.05, 0.365, 0.67, 0], ['box', 0.36, 0.12, 0.1, -0.11, 0.54, -0.95], ['box', 0.36, 0.12, 0.1, -0.11, 0.54, 0.95]] });
  for (const [k, z] of [[0, -0.35], [1, 0.25], [2, 0.85]]) add({ id: 'cush' + k, kind: 'cushion', pos: [0.718, 0.421, z], m: 0.6, mu: 0.6, parts: [['box', 0.08, 0.2, 0.21, 0, 0.2, 0]] });
  // the rug, and the coffee table on it (with a glass of water, a bowl, a book and the remote)
  add({ id: 'rug', kind: 'rug', pos: [-0.8, 0, 0.25], m: 6, mu: 0.42, parts: [['box', 0.85, 0.006, 0.75, 0, 0.006, 0]] });
  add({ id: 'table', kind: 'table', pos: [-0.75, 0.0125, 0.25], m: 16, mu: 0.65, parts: [['box', 0.32, 0.025, 0.55, 0, 0.4, 0], ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ['box', 0.025, 0.1875, 0.025, a * 0.28, 0.1875, b * 0.5])] });
  const top = 0.0125 + 0.425;
  add({ id: 'glass', kind: 'glass', pos: [-0.88, top, -0.02], m: 0.35, mu: 0.3, parts: [['cyl', 0.06, 0.04, 0, 0.06, 0]] });
  add({ id: 'bowl', kind: 'bowl', pos: [-0.62, top, 0.5], m: 0.7, mu: 0.4, parts: [['cyl', 0.035, 0.11, 0, 0.035, 0]] });
  add({ id: 'tbook', kind: 'book', pos: [-0.58, top, -0.08], m: 0.5, mu: 0.4, parts: [['box', 0.11, 0.014, 0.15, 0, 0.014, 0]] });
  add({ id: 'remote', kind: 'remote', pos: [-0.98, top, 0.4], m: 0.15, mu: 0.35, parts: [['box', 0.025, 0.01, 0.09, 0, 0.01, 0]] });
  // the TV on its low stand, against the west wall; the screen faces east
  add({ id: 'stand', kind: 'stand', pos: [-2.27, 0, 0.25], m: 28, mu: 0.45, parts: [['box', 0.21, 0.25, 0.75, 0, 0.25, 0]] });
  add({ id: 'tv', kind: 'tv', pos: [-2.29, 0.5005, 0.25], m: 14, mu: 0.5, parts: [['box', 0.12, 0.012, 0.2, 0, 0.012, 0, 6], ['box', 0.02, 0.06, 0.04, 0, 0.084, 0, 1], ['box', 0.028, 0.36, 0.62, 0, 0.5, 0, 7]] });
  // the bookcase against the west wall (open to the east), and its books (they spill when it goes)
  { const bc = { id: 'bookcase', kind: 'bookcase', pos: [-2.33, 0, 1.4], m: 26, mu: 0.5, parts: [['box', 0.01, 0.925, 0.425, -0.15, 0.925, 0], ['box', 0.16, 0.925, 0.01, 0, 0.925, -0.415], ['box', 0.16, 0.925, 0.01, 0, 0.925, 0.415], ['box', 0.15, 0.03, 0.405, 0.005, 0.03, 0]] };
    const shelfY = [0.06, 0.43, 0.8, 1.17, 1.54];
    for (const y of shelfY.slice(1)) bc.parts.push(['box', 0.15, 0.01, 0.405, 0.005, y - 0.01, 0]);
    bc.parts.push(['box', 0.15, 0.01, 0.405, 0.005, 1.84, 0]);
    add(bc);
    // books: standing on each shelf, packed along z, their spines flush with the shelf's front edge (seeded sizes)
    let n = 0, h = 0x2a;
    const rnd = () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
    shelfY.forEach((y, si) => {
      let z = -0.395;
      for (let k = 0; k < 7; k++) {
        const t = 0.018 + 0.012 * rnd(), hh = 0.1 + 0.04 * rnd(), dd = 0.075 + 0.03 * rnd();
        if (z + 2 * t > 0.39) break;
        add({ id: 'book' + n++, kind: 'book', pos: [-2.33 + 0.153 - dd, y + 0.0005, 1.4 + z + t], m: 0.2 + 4000 * t * hh * dd, mu: 0.4, parts: [['box', dd, hh, t, 0, hh, 0]] });
        z += 2 * t + 0.004 + 0.02 * rnd();
      }
    });
  }
  // the armchair (south-west, facing the window), the side table with its lamp (by the sofa's south end)
  add({ id: 'armchair', kind: 'armchair', pos: [-1.25, 0, 1.45], m: 30, mu: 0.55, parts: [['box', 0.42, 0.21, 0.4, 0, 0.21, 0], ['box', 0.42, 0.25, 0.1, 0, 0.67, 0.3], ['box', 0.08, 0.12, 0.3, -0.34, 0.54, -0.1], ['box', 0.08, 0.12, 0.3, 0.34, 0.54, -0.1]] });
  add({ id: 'side', kind: 'sidetable', pos: [0.55, 0, 1.68], m: 6, mu: 0.4, parts: [['box', 0.15, 0.01, 0.15, 0, 0.01, 0, 2.5], ['box', 0.03, 0.25, 0.03, 0, 0.27, 0, 1.5], ['box', 0.2, 0.02, 0.2, 0, 0.54, 0, 2]] });
  add({ id: 'tlamp', kind: 'tablelamp', pos: [0.55, 0.5605, 1.68], m: 2.5, mu: 0.5, parts: [['cyl', 0.12, 0.06, 0, 0.12, 0, 1.9], ['cyl', 0.1, 0.15, 0, 0.34, 0, 0.6]] });
  // the sideboard against the east wall, with a vase, a photo and a pile of books on it
  add({ id: 'sideboard', kind: 'sideboard', pos: [2.27, 0, -0.55], m: 40, mu: 0.45, parts: [['box', 0.22, 0.4, 0.7, 0, 0.4, 0]] });
  add({ id: 'vase', kind: 'vase', pos: [2.3, 0.8005, -1.0], m: 1.2, mu: 0.45, parts: [['cyl', 0.15, 0.07, 0, 0.15, 0]] });
  add({ id: 'photo', kind: 'photo', pos: [2.4, 0.8005, -0.45], m: 0.4, mu: 0.45, parts: [['box', 0.012, 0.1, 0.08, 0, 0.1, 0]] });
  add({ id: 'sbooks', kind: 'bookpile', pos: [2.25, 0.8005, -0.05], m: 2.5, mu: 0.45, parts: [['box', 0.12, 0.06, 0.16, 0, 0.06, 0]] });
  // the floor lamp (south-east corner), the plant (north-east corner, by the window), a pouffe
  add({ id: 'flamp', kind: 'floorlamp', pos: [2.2, 0, 1.7], m: 5, mu: 0.5, parts: [['cyl', 0.015, 0.16, 0, 0.015, 0, 3.6], ['cyl', 0.75, 0.013, 0, 0.78, 0, 0.8], ['cyl', 0.13, 0.2, 0, 1.62, 0, 0.6]] });
  add({ id: 'plant', kind: 'plant', pos: [2.12, 0, -1.6], m: 15.5, mu: 0.6, parts: [['cyl', 0.2, 0.2, 0, 0.2, 0, 14], ['ball', 0.33, 0, 0.78, 0, 1.5]] });
  add({ id: 'pouffe', kind: 'pouffe', pos: [-0.25, 0, -0.95], m: 5, mu: 0.5, parts: [['cyl', 0.2, 0.25, 0, 0.2, 0]] });
}

// ---------------------------------------------------------------------------------------------------------------------
// THE STREET AND THE PARK (world). Your block (x −22…22, z 0…12) faces south across the street (z −9…−2) to the park
// (z −12…−100). The street runs straight east (−x) and west (+x): the sun rises down it and sets down it (an equinox
// week). West of you: the side street (x 25…33, north), the next block (x 34…74, balconies, the café), the cross street
// (x 76…84) and the church on the street's south side (its tower on the corner), then houses all the way to the sunset.
// ---------------------------------------------------------------------------------------------------------------------
const DS_ST = {
  road: { z: [-9, -2] }, pav: [[-2.0, 0.0], [-12.0, -9.0]], kerbH: 0.12, roadEnd: 430,
  park: { x: [-70, 70], z: [-100, -12.6] },
  blockA: { x: [-22, 22], z: [0, 12], h: 15.4, floors: 5 },
  blockB: { x: [34, 74], z: [0, 12], h: 15.4, floors: 5 },
  church: { nave: { x: [95, 127], z: [-31, -15], h: 12, ridge: 19.5 }, tower: { x: [86, 95], z: [-25, -16], h: 24 }, spire: 17, spireR: 1.05 },
  pond: { x: 0, z: -52, rx: 17, rz: 10, depth: 0.7 },
  dome: { x: 34, z: -30, r: 2.0 },                          // the playground's climbing dome (bars set in concrete)
  swings: { x: 46, z: -24, top: 2.4, n: 3 },
  bodies: [],
};
{
  const B = DS_ST.bodies, add = (o) => B.push(o);
  // parked cars: along the park's kerb (dir 1: facing +x) and on your side (dir −1); car10 in the side street, facing
  // north (dir 'n'), its handbrake off. (mu, vt: unused here; when each goes comes from script.js DS_MU)
  const cars = [
    ['car0', -54, -7.95, 1, 'hatch', '#8a1f22', 4.12, 1250, 0.38, 88], ['car1', -40, -7.95, 1, 'sedan', '#2d3f55', 4.72, 1450, 0.5, 95],
    ['car2', -26, -7.95, 1, 'suv', '#cfd2d1', 4.78, 1850, 0.62, 92], ['car3', -12, -7.95, 1, 'hatch', '#2f5a3a', 4.12, 1200, 0.42, 85],
    ['car4', 4, -7.95, 1, 'ev', '#e8e8e4', 4.72, 1900, 0.7, 100], ['car5', 18, -7.95, 1, 'van', '#d9d4c4', 5.3, 2100, 0.55, 86],
    ['car6', 46, -7.95, 1, 'sedan', '#4a4d52', 4.72, 1500, 0.46, 94], ['car7', 60, -7.95, 1, 'hatch', '#c9a23a', 4.12, 1150, 0.36, 84],
    ['car8', -34, -3.05, -1, 'sedan', '#6b2a3a', 4.72, 1480, 0.52, 95], ['car9', 11, -3.05, -1, 'hatch', '#3b6f8f', 4.12, 1220, 0.44, 86],
    ['car10', 26.4, 3.2, 'n', 'hatch', '#b8452e', 4.12, 1180, 0.3, 86],
  ];
  for (const [id, x, z, dir, type, col, L, m, mu, vt] of cars)
    add({ id, kind: 'car', type, col, dir, L, pos: [x, 0, z], m, mu, vt, parts: [['box', L / 2, 0.38, 0.88, 0, 0.38, 0]] });
  // the wheelie bins on your pavement (out for collection)
  ['#2f4a2f', '#3a3a3c', '#2c4a6a', '#3a3a3c', '#7a5a2a', '#2f4a2f', '#3a3a3c', '#2c4a6a'].forEach((col, i) =>
    add({ id: 'bin' + i, kind: 'bin', col, pos: [-15 + i * 4.1, DS_ST.kerbH + 0.0005, -0.75], m: 14, mu: 0.45, vt: 22, parts: [['box', 0.29, 0.53, 0.37, 0, 0.53, 0]] }));
  // footballs (one on the path: it rolls first), a bike left lying on the path by the railings
  add({ id: 'ball0', kind: 'ball', col: '#f2f0ea', pos: [12, 0.11, -17], m: 0.43, mu: 0.6, vt: 27, rr: 0.012, parts: [['ball', 0.11, 0, 0, 0]] });
  add({ id: 'ball1', kind: 'ball', col: '#e0482c', pos: [-8, 0.11, -34], m: 0.43, mu: 0.6, vt: 27, rr: 0.05, parts: [['ball', 0.11, 0, 0, 0]] });
  add({ id: 'ball2', kind: 'ball', col: '#3a6ad0', pos: [28, 0.11, -38], m: 0.43, mu: 0.6, vt: 27, rr: 0.06, parts: [['ball', 0.11, 0, 0, 0]] });
  add({ id: 'bike', kind: 'bike', col: '#2f6f8a', pos: [-20, 0, -13.4], m: 14, mu: 0.5, vt: 21, parts: [['box', 0.85, 0.035, 0.33, 0, 0.035, 0]] });   // (lying on the path)
}

if (typeof module !== 'undefined') module.exports = { DS_ROOM, DS_ST };
