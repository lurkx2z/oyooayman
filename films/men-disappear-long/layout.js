/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes in every set: x EAST, y up, z SOUTH.
   A river valley on a Tuesday morning in November, latitude 47° N (a made-up place, right-hand traffic, km/h):
   the motorway crosses the valley east-west on a viaduct 42 m up; the river runs north-south under it; a railway
   runs along the east bank; the town lies on the west bank south of the viaduct; the airport is on the east side of
   the valley floor, its runway running north-south, so planes landing to the south come in low over the viaduct.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE VALLEY (set 'world')
// ---------------------------------------------------------------------------------------------------------------------
const MG_V = {
  deckY: 42.0,                        // the viaduct's road surface
  vx: [-960, 1960],                   // the viaduct's ends (beyond them the motorway runs in cuttings through the hills)
  deckW: 16.5,                        // the deck's half width (z −16.5…16.5)
  lanes: [2.3, 6.0, 9.7],             // eastbound lane centres (z > 0: keep right, eastbound); westbound at −z
  shoulder: 12.6,                     // the hard shoulder's centre (eastbound)
  pierEvery: 60,
  riverW: 55,                         // the river's half width
  railX: 140,                         // the railway (east bank), north-south
  runway: { x: 600, z: [1800, 4800], w: 45 },   // runway 18/36 (we land on 18: southbound)
  taxiX: 790,
  tower: [1010, 0, 3020], towerH: 44, cabR: 6.4,  // the control tower (its cab floor at y = towerH)
  apron: { x: [860, 1240], z: [2500, 3600] },
  terminal: { x: [1180, 1300], z: [2620, 3420], h: 16 },
  town: { x: [-2600, -230], z: [240, 2900] },
  hospital: [-760, 0, 980],           // the town's hospital (4 storeys)
  church: [-1350, 0, 1500],
};
// the river's centre (x) at z: straight under the viaduct, then bending west south of it (the barge goes straight on)
function mgRiverX(z) { if (z < 250) return 0; if (z < 650) return -((z - 250) * (z - 250)) / 900; return -177.8 - 260 * (1 - Math.exp(-(z - 650) / 290)); }
// where the valley's sides begin (x of the foot of the west and east hills at z): the valley widens to the south
function mgHillW(z) { return -980 - Math.max(0, z - 500) * 0.75; }
function mgHillE(z) { return 1990 + Math.max(0, z - 1500) * 0.45; }
// the ground's height (y) at (x, z)
function mgGroundY(x, z) {
  const dW = mgHillW(z) - x, dE = x - mgHillE(z);
  const hill = (d, s) => (d <= -60 ? 0 : 46 * MathX.smooth(d, -60, 70) + 0.085 * Math.max(0, d) + 0.00002 * Math.max(0, d) * Math.max(0, d)) * (1 + 0.25 * noise1(s, 7));
  let y = hill(dW, z * 0.0011 + 3) + hill(dE, z * 0.0013 + 9);
  // rolling hills further out, and far mountains
  const far = Math.max(0, Math.max(dW, dE));
  y += far > 0 ? (40 + 0.02 * far) * (0.5 + 0.5 * noise1(x * 0.0007 + 2, 11) * noise1(z * 0.0006 + 5, 12)) * MathX.smooth(far, 0, 900) : 0;
  y += 0.5 * noise1(x * 0.013 + z * 0.007, 3) + 0.3 * noise1(z * 0.021 - x * 0.004, 5);
  // the north and south of the valley climb gently (it is a valley, not a plain)
  y += 0.000004 * Math.max(0, Math.abs(z - 1200) - 5000) ** 2;
  // (the far ring saturates at about 1,400 m: hills, then mountains, not walls kilometres high)
  if (y > 300) y = 300 + 1100 * (1 - Math.exp(-(y - 300) / 1100));
  // the river's channel
  const rx = mgRiverX(z), dr = Math.abs(x - rx);
  if (dr < MG_V.riverW + 12) y = MathX.lerp(-3.2, y, MathX.smooth(dr, MG_V.riverW - 6, MG_V.riverW + 12));
  // the airport's ground: levelled (the runway, taxiways and apron are painted or lie on it)
  { const R = MG_V.runway, ax = Math.min(x - (R.x - 230), MG_V.apron.x[1] + 160 - x), az = Math.min(z - (R.z[0] - 900), R.z[1] + 600 - z), a = Math.min(ax, az);
    if (a > -60) y = MathX.lerp(y, 0.0, MathX.smooth(a, -60, 20)); }
  // the motorway's corridor beyond the viaduct: a cutting at road level
  // (it runs on 2.6 km each way, as far as the road does, and closes over it beyond: no slot through the hills)
  if (x < MG_V.vx[0] + 20 || x > MG_V.vx[1] - 20) { const out = Math.max(MG_V.vx[0] - x, x - MG_V.vx[1]), c = (1 - MathX.smooth(Math.abs(z), 24, 90)) * (1 - MathX.smooth(out, 1800, 2500)); y = MathX.lerp(y, MG_V.deckY - 1.6, c); }
  return y;
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR CAR (car-local: x forward, y up from the road, z to the right; the car's origin at the middle of its wheelbase)
// a grey estate on cruise control; your dad drives (left), you sit beside him (right)
// ---------------------------------------------------------------------------------------------------------------------
const MG_CAR = {
  L: 4.7, W: 1.84, H: 1.48, color: '#8b9096',
  seatL: [-0.12, 0.56, -0.38], seatR: [-0.12, 0.56, 0.38],  // the seats' hip points (H-points)
  eye: [-0.06, 1.18, 0.38],                          // your eyes (passenger seat)
  wheel: [0.4, 0.97, -0.38], wheelR: 0.185, wheelTilt: 0.42,
  epb: [0.3, 0.73, 0.0],                             // the parking-brake switch on the console
  cup: [0.12, 0.93, -0.2],                           // your dad's coffee (in his right hand)
  dash: 0.78,                                        // the dashboard's back edge (x)
  shield: [1.3, 0.98, 0.7, 1.4],                     // the windscreen: base (x, y), top (x, y)
};

// ---------------------------------------------------------------------------------------------------------------------
// THE PLANE (plane-local: x forward, y up, z right; origin at the wing root, on the fuselage's axis)
// a twin-engine narrow-body airliner, 38 m long; flight MG 2207
// ---------------------------------------------------------------------------------------------------------------------
const MG_PL = {
  L: 38.0, R: 1.95, nose: 17.5, tail: -20.5, span: 34.6,
  cockpitX: 14.6, floorY: -0.85,                    // the cockpit's seats (x), the floor (y)
  seatL: [14.3, -0.85, -0.55], seatR: [14.3, -0.85, 0.55],
  door: 12.6,                                        // the cockpit door's plane (x)
  rows: 28, pitch: 0.81, row0: 10.6,                 // passenger rows: 6 abreast, from x = row0 aft
  gear: 2.6,                                         // the main gear's height (wheels to the axis) when down
};

// ---------------------------------------------------------------------------------------------------------------------
// THE MATERNITY WARD (set 'ward'): a delivery room, floor y = 0, x 0…7, z 0…6.2; the window on the south wall
// ---------------------------------------------------------------------------------------------------------------------
const MG_WD = { x: [0, 7.0], z: [0, 6.2], H: 2.9, bed: [3.4, 0, 2.6], win: { x: [1.4, 5.6], y: [0.95, 2.35] } };

// the sun at 47° N on 10 November: [azimuth from north, elevation] in degrees, by story time (s after 7:42:00 AM)
function mgSunAt(s) {
  const h = 7.7 + s / 3600;                                         // local hours
  const u = h - 7.7, el = 5 + 7.8 * u - 1.1 * u * u;
  const az = 120 + 11.5 * u + 0.4 * u * u;
  return [az, el];
}
// the direction to the sun (unit vector)
function mgSunDir(s) { const [az, el] = mgSunAt(s), a = MathX.deg(az), e = MathX.deg(el); return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]; }

if (typeof module !== 'undefined') module.exports = { MG_V, MG_CAR, MG_PL, MG_WD };
