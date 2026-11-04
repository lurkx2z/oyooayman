/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x WEST, y up, z NORTH. Your block's street
   front faces south across the street to the park (−z); the afternoon sun (south-west) shines in at your window.
   (The days-shorter film's street and park, with a kitchen in your flat, a fountain in the pond and a big plane tree
   by the path.)
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// YOUR KITCHEN (room-local: origin at the middle of the floor). The top (fifth) floor of your block, 12.0 m up; the window
// is in the south wall (z = −2), towards the park. Facing the window, +x is on your right.
//   the counter run along the left wall (x −2.5…−1.88): the sink by the window, the kettle, the hob; wall cabinets above;
//   the fridge at the far end. The table in the middle, its pendant lamp over it. Open shelves and the clock on the right.
// ---------------------------------------------------------------------------------------------------------------------
const SA_ROOM = {
  W: 5.0, H: 2.6, D: 4.0,                                  // x −2.5…2.5, y 0…2.6, z −2…2
  origin: [4.0, 12.0, 2.25],                               // (world: your block's street front is z = 0, its walls 0.25 thick)
  win: { x: [-1.0, 1.4], y: [0.85, 2.3], hinge: 1.4, split: 0.25 },   // the window (south wall); its right half opens outwards
  rad: { x: [-0.8, 1.2], y: [0.12, 0.72], z: [-2.0, -1.9] },
  sill: { x: [-1.05, 1.45], y: [0.83, 0.86], z: [-2.0, -1.88] },
  door: { x: [1.15, 2.05], h: 2.05 },                      // the door (north wall), to the hall
  counter: { x: [-2.5, -1.88], z: [-1.95, 1.18], top: 0.92 },
  wallCab: { x: [-2.5, -2.15], y: [1.5, 2.2], z: [-1.4, 1.18] },
  fridge: { x: [-2.5, -1.86], z: [1.24, 1.96], h: 1.86 },
  sink: { z: -1.05, w: 0.5 }, hob: { z: 0.45 },
  kettle: [-2.1, 0.92, -0.32],                             // on the counter (its base)
  mug: [-1.98, 0.92, -0.08],
  table: { x: 0.25, z: -0.1, w: 1.4, d: 0.85, top: 0.75 }, // centre, size (x, z), top height
  lamp: { x: 0.25, z: -0.1, cord: 0.72 },
  shelves: { x: 2.5, z: [-1.3, 0.7], y: [1.22, 1.56, 1.9] },
  clock: { x: 2.47, y: 1.98, z: 1.15 },
  you: { x: 0.25, z: 0.72 },                               // your chair (north side of the table, facing the window)
};

// what is on your table at 2:00 (room-local): the glass you are filling, the jug in your right hand, your mug of tea;
// the cat sits at the far side of the table and jumps off it (to your left, towards the window) at SA.sJump
const SA_GLASS = { at: [0.1, 0.75, 0.16], h: 0.12, r: 0.034 };
const SA_MUG = [-0.24, 0.75, 0.14];
const SA_RADIO = [0.5, 0.862, -1.93];                      // on the window sill
const SA_CATP = { sit: [-0.12, 0.75, -0.3], yaw: -Math.PI / 2 - 0.45, v0: [-1.15, 0.65, -0.55], hc: 0.2 };   // its feet on the table; it leaves facing −x (your left)

// ---------------------------------------------------------------------------------------------------------------------
// THE STREET AND THE PARK (world). Your block (x −22…22, z 0…12) faces south across the street (z −9…−2) to the park
// (z −12.6…−100). The pond (its fountain in the middle), the path along the railings (z −15.5), the big plane tree by
// the path (its low branch over it), the playground; the next block west (the café), the church on the corner.
// ---------------------------------------------------------------------------------------------------------------------
const SA_ST = {
  road: { z: [-9, -2] }, pav: [[-2.0, 0.0], [-12.0, -9.0]], kerbH: 0.12, roadEnd: 430,
  park: { x: [-70, 70], z: [-100, -12.6] },
  blockA: { x: [-22, 22], z: [0, 12], h: 15.4, floors: 5 },
  blockB: { x: [34, 74], z: [0, 12], h: 15.4, floors: 5 },
  church: { nave: { x: [95, 127], z: [-31, -15], h: 12, ridge: 19.5 }, tower: { x: [86, 95], z: [-25, -16], h: 24 }, spire: 17, spireR: 1.05 },
  pond: { x: 0, z: -52, rx: 17, rz: 10, depth: 0.7 },
  fountain: { x: 0, z: -52, h: 1.2, v0: 6 },               // the jet's nozzle (1.2 m above the water), 6 m/s
  dome: { x: 34, z: -30, r: 2.0 },
  swings: { x: 46, z: -24, top: 2.4, n: 3 },
  // the plane tree by the path: trunk at (x, z), its long low branch reaching out over the path, east (−x)
  plane: { x: -9.0, z: -19.2, h: 15, branch: [[-9.0, 2.6, -19.2], [-8.0, 3.0, -17.6], [-6.6, 3.3, -16.0], [-5.0, 3.45, -15.1], [-3.4, 3.7, -14.6]] },
  path: { z: -15.5 },
  flag: { x: -13.5, z: -13.6, h: 7.2, w: 1.5, ht: 1.0 },  // a flagpole by the park gate (the flag flies east, −x, in the westerly breeze)
  mainRoad: { z: [-121, -113] },                           // the main road past the far side of the park
  smoke: [[-28, -150], [22, -176]],                        // after 2:00:03: where the smoke rises (beyond the main road)
  bodies: [],
};
{
  const B = SA_ST.bodies, add = (o) => B.push(o);
  // parked cars along both kerbs (they stay put: nothing here leaves the ground)
  const cars = [
    ['car0', -54, -7.95, 1, 'hatch', '#8a1f22', 4.12], ['car1', -40, -7.95, 1, 'sedan', '#2d3f55', 4.72],
    ['car2', -26, -7.95, 1, 'suv', '#cfd2d1', 4.78], ['car3', -12, -7.95, 1, 'hatch', '#2f5a3a', 4.12],
    ['car4', 4, -7.95, 1, 'ev', '#e8e8e4', 4.72], ['car5', 18, -7.95, 1, 'van', '#d9d4c4', 5.3],
    ['car6', 46, -7.95, 1, 'sedan', '#4a4d52', 4.72], ['car7', 60, -7.95, 1, 'hatch', '#c9a23a', 4.12],
    ['car8', -34, -3.05, -1, 'sedan', '#6b2a3a', 4.72], ['car9', 11, -3.05, -1, 'hatch', '#3b6f8f', 4.12],
  ];
  for (const [id, x, z, dir, type, col, L] of cars) add({ id, kind: 'car', type, col, dir, L, pos: [x, 0, z] });
  ['#2f4a2f', '#3a3a3c', '#2c4a6a', '#3a3a3c', '#7a5a2a', '#2f4a2f', '#3a3a3c', '#2c4a6a'].forEach((col, i) =>
    add({ id: 'bin' + i, kind: 'bin', col, pos: [-15 + i * 4.1, SA_ST.kerbH + 0.0005, -0.75] }));
}

if (typeof module !== 'undefined') module.exports = { SA_ROOM, SA_ST };
