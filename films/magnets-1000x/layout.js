/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x EAST, y up, z SOUTH (north is −z).
   A river at the edge of a northern English town (53.5° N), Saturday 28 November 2026, 10:42 AM, a bright cold morning:
   the Sun 13.5° up in the south-south-east (azimuth 163°). The river runs east–west, the water at y = 0.
     north bank   a scrapyard on a wharf (its edge a steel sheet-pile wall at z = −20, the yard 2.2 m above the water):
                  the scrap pile under a crawler crane's lifting magnet (it is lifting a car), a row of old cars east of
                  the pile, skips, drums, a site office; behind the yard the land rises to a long hill with three wind
                  turbines on its crest (north-east, about a kilometre away)
     south bank   a towpath, a fence and the hospital: its single-storey MRI unit nearest the river, the wards behind
     east         the bypass crosses the river on a concrete bridge, 11 m above the water
   You are on a narrowboat going east along the middle of the river, at the stern beside your mum (she is steering).
   The hospital's MRI room is a separate set (its own coordinates: hospital.js).
   ===================================================================== */

const MG_F = {
  you: { eye: 1.66 },                       // your eye above the stern deck
  river: { z: [-20, 8.5], bed: -2.6 },      // the channel between the wharf wall and the south bank's toe; its bed
  wharf: { z: -20, top: 2.2, x: [-75, 70], back: -85 },
  // the scrap pile under the magnet (a low cone), and the ball that forms where it was
  pile: { c: [0, 2.2, -26], R: 6.8, h: 4.2 },
  mag0: [0, 10.5, -26],                     // the lifting magnet's centre at 10:42:00 (a disc 1.8 m across, 0.55 m thick)
  magR: 0.9, magH: 0.55,
  ballC: [0, 4.6, -26],                     // where the ball comes to rest (its centre)
  // the crawler crane north-west of the pile: its tracks, its cab, the lattice boom up to the magnet's rope
  crane: { base: [-6, 2.2, -49], yaw: 0.12, foot: [-5.4, 4.6, -45.6], tip: [0, 25.5, -26.6] },
  office: [-17, 2.2, -37],                  // the site office (a steel cabin, 6 × 2.4 m)
  // the old cars in a row east of the pile, nose to the north (x, z): their distance from the ball is 15–25 m
  cars: [[15.5, -28.5], [18.4, -29.5], [21.3, -28.8], [24.2, -29.9], [17.0, -36.0], [20.6, -37.5]],
  // the narrowboat: 17.4 m × 2.08 m (57 ft × 6 ft 10), going east along the river
  boat: { L: 17.4, B: 2.08, x0: -9.0, z0: -5.4, v0: 1.1 },
  south: { z: 8.5, top: 1.6 },              // the south bank's top (the towpath) and its toe
  hospital: { mri: [-26, 1.6, 30], mriSize: [22, 5.2, 14], wards: [-40, 1.6, 62], wardSize: [86, 17, 22] },
  bridge: { x: 150, y: 11.0, w: 13.5, span: [-60, 60] },
  // the wind turbines on the hill to the north-east (ground point; hub 80 m above it; blades 45 m)
  turbines: [[1250, 0, -760], [1420, 0, -660], [1580, 0, -830]],
  hub: 80, blade: 45,
  hill: { z: -700, top: 58 },
};
// the Sun at 10:42 AM on 28 November 2026 from 53.5° N: altitude 13.5°, azimuth 163° (from north, through east)
const MG_SUN = (() => { const alt = 13.5 * Math.PI / 180, az = 163 * Math.PI / 180; return [Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)]; })();

// the ground's height (x east, z south): the yard and the bank behind it; the river channel; the south bank; the long
// hill to the north (the turbines stand on its crest)
function mgGroundY(x, z) {
  const W = MG_F.wharf, Sb = MG_F.south;
  if (z <= W.z) {
    // the yard (flat), then fields rising to the hill's crest about 1 km north
    const u = Math.max(0, -z - 95);
    const rise = MG_F.hill.top * (1 - Math.exp(-u / 520)) + 6 * Math.sin(x * 0.004 + 1.3) * Math.min(1, u / 300);
    const yard = Math.abs(x) < 80 && z > -95 ? W.top : W.top + rise + 0.4 * noise1(x * 0.03 + z * 0.02, 3);
    return yard;
  }
  if (z >= Sb.z - 2.5) {
    // the south bank: a grass slope up from the river bed to the towpath, then flat ground (the hospital)
    const k = Math.min(1, (z - (Sb.z - 2.5)) / 5), y0 = MG_F.river.bed * 0.62;
    return y0 + (Sb.top - y0) * (k * k * (3 - 2 * k)) + 0.15 * noise1(x * 0.05 + z * 0.07, 5) * Math.min(1, Math.max(0, z - Sb.z) / 6);
  }
  // the river bed (a shallow U)
  const c = MathX.clamp((z - (W.z + Sb.z - 2.5) / 2) / ((Sb.z - 2.5 - W.z) / 2), -1, 1);
  return MG_F.river.bed * (1 - 0.38 * c * c);
}

if (typeof module !== 'undefined') module.exports = { MG_F, MG_SUN, mgGroundY };
