/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes in every set: x EAST, y up, z SOUTH.
   A southern coast at latitude 33.9° S on a moonless Saturday night in November (9 PM, local sidereal time 23.8 h):
   the sea and the bay are to the south, so the far side of the bay (the city, the hospital on its hill, the stadium)
   is to the south too, and the Southern Cross, Alpha Centauri and the Magellanic Clouds hang over it.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE COAST (set 'coast'): the railway along the sea wall, the coast road, the beach, the bay, the city across it
// ---------------------------------------------------------------------------------------------------------------------
const LF_ST = {
  railY: 3.32,                      // top of the rail (the sea wall's top is 3.0; ballast 3.06, sleepers 3.16)
  wallTop: 3.0, wallFace: 4.0,      // the sea wall's face (z) drops to the sea / the sand
  track: [0, -4.4],                 // z of the two tracks (yours is the seaward one, z = 0)
  mastZ: -7.0, mastEvery: 50, wireY: 3.32 + 5.4,
  road: { z: [-19, -12], y: 3.25 },  // the coast road (two lanes), behind the line
  lampEvery: 36, lampZ: -11.3,
  tunnel: { x: -660 },               // the headland's tunnel mouth (the train comes out of it eastbound)
  x0: -900, x1: 1700,               // where the coast runs (the sea wall, the road)
  beach: { x: [520, 920], z: [4, 46], stepsX: 690 },   // the cove below the wall: sand from the wall (y 1.9) to the water (z ≈ 46)
  fire: [726, 0, 21],               // the bonfire (y from the sand)
  stopX: 700,                       // the front of your train stops here
  city: { x: [-2900, 2900], z: [2500, 3900] },        // across the bay
  hospital: [980, 0, 2760],          // on its hill (y from the ground)
  stadium: [-1050, 0, 2860],
};
// the sand's height (y) at (x, z): from 1.9 at the wall's foot down to the water around z ≈ 46, rising at the cove's ends
function lfSandY(x, z) {
  const B = LF_ST.beach, u = MathX.clamp((z - B.z[0]) / (B.z[1] - B.z[0]), 0, 1.25);
  const ends = Math.max(0, 1 - Math.min(x - B.x[0], B.x[1] - x) / 60);
  return 1.9 * (1 - u) + 0.6 * Math.sin(u * 3.0) * (1 - u) * 0.4 - 0.25 * (u > 1 ? (u - 1) * 4 : 0) + 2.2 * ends * ends * (1 - u * 0.6) + 0.06 * noise1(x * 0.07 + z * 0.05, 3);
}

// your train: three cars, eastbound on the seaward track; your seat in the first car, on the right (sea) side, facing
// forward. Train-local: x forward (east), y up from the rail top, z to the right (south)
const LF_TR = {
  cars: 3, L: 20.0, gap: 0.9, W: 2.9, H: 3.95, floor: 1.15, cab: -2.3,
  rows: [-16.6, -14.65, -12.7, -10.75, -8.8, -6.85, -4.9],          // seat rows (x of the seat back, from the front), facing forward
  winY: [0.82, 1.78], winW: 1.3,                                       // windows (above the floor), centred on each row (+0.35)
  doors: [[-3.6, -2.45], [-19.4, -18.25]],                             // door openings (x, from the front), both sides
  you: { row: -6.85, z: 0.98 },                                        // your seat (window, sea side)
};
LF_TR.eye = [LF_TR.you.row + 0.42, LF_TR.floor + 1.2, LF_TR.you.z - 0.04];


// ---------------------------------------------------------------------------------------------------------------------
// THE HOSPITAL (set 'hospital'): the MRI room, its control room, the corridor with the nurses' station, the roof
// ---------------------------------------------------------------------------------------------------------------------
const LF_HO = {
  mri: { x: [0, 7.2], z: [0, 6.4], H: 3.0 },          // the scan room (floor y = 0)
  bore: [3.6, 1.05, 2.6],                              // the magnet's centre
  ctrl: { x: [7.4, 10.6], z: [0, 6.4] },              // the control room, through the window in the wall x = 7.2
  hall: { x: [-30, 0], z: [8, 11.2], H: 2.9 },         // the corridor (north of the rooms)
  board: [-9.0, 1.45, 8.02],                           // the whiteboard on the corridor's north wall (its middle)
  roof: { y: 22.0, x: [-30, 16], z: [-6, 18] },        // the roof (the building is 6 storeys)
  vent: [5.2, 22.0, 3.4],                              // the quench pipe on the roof
};

// ---------------------------------------------------------------------------------------------------------------------
// THE STADIUM (set 'stadium'): an oval bowl, the pitch along x
// ---------------------------------------------------------------------------------------------------------------------
const LF_SD = { pitch: [105, 68], inA: 66, inB: 48, outA: 112, outB: 94, top: 34, rows: 46, roofY: 40 };

// ---------------------------------------------------------------------------------------------------------------------
// THE OBSERVATORY (set 'obs'): a dome on the mountain (2,200 m), 60 km inland; the coast's lights far below to the south
// ---------------------------------------------------------------------------------------------------------------------
const LF_OB = {
  r: 7.0, wallH: 5.2, domeR: 7.25, slitW: 2.6, slitAz: 0,     // the slit faces north (Saturn)
  scope: { y: 2.2, len: 6.2 },                                 // the telescope's elevation axis (on the pier)
  baro: [-6.7, 1.75, -1.6],                                    // the barometer on the wall (the mercury's top)
  desk: [4.1, 0, 2.6],
};

// the sky: latitude, local sidereal time (hours) at 9 PM
const LF_SKY = { lat: -33.9, lst: 23.8 };

if (typeof module !== 'undefined') module.exports = { LF_ST, LF_TR, LF_HO, LF_SD, LF_OB };
