/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x EAST, y up, z SOUTH (north is −z).
   A frozen lake in Norway (61.1° N, near Lillehammer), Sunday 10 January 2027, 2:40 PM. The Sun is 2.5° up in the
   south-south-west (azimuth 211°) and sets at 3:26 PM. −12 °C, clear and still.
     the lake    ice at y = 0, snow on it; a ploughed skating track (an oval, clear ice) in the middle of the north half
     north shore a bank up to the shore road (y = 3), a railing, a boat ramp; a stream comes in under the road at
                 x = 150 (the ice by its mouth is thin); the kiosk and its bonfire on a little beach at x = −66; the town
                 behind the road (painted wooden houses, lamp posts, a church-free skyline of chimneys), forested hills
     far shores  low forested hills all round; the Sun sets behind the south-west ones
   ===================================================================== */

const NL_F = {
  lat: 61.1,
  air: -12,                                                   // °C
  track: { cx: 0, cz: 50, a: 260, b: 80, w: 12 },          // the ploughed oval (centre line), clear ice
  shoreZ: -432,                                               // the north shore's line (about)
  road: { z: -447, w: 8, y: 3.0 },                            // the shore road (its centre line), on top of the bank
  inlet: { x: 150, w: 4 },                                    // the stream's mouth (thin ice for 40 m out)
  kiosk: { x: -70, z: -437 },                                  // the kiosk on its little beach; the bonfire in front of it
  fire: { x: -66, z: -429 },
  lake: { x: [-1500, 1400], zS: 1060 },
  lamps: Array.from({ length: 22 }, (_, k) => -330 + 30 * k),  // lamp posts along the road (north side)
};
// the Sun at 2:40 PM on 10 January 2027 from 61.1° N, 10.45° E: altitude 2.5°, azimuth 211.0° (NOAA's formulas;
// it sets, upper limb with refraction, at 3:26 PM)
const NL_SUN = (() => { const alt = 2.5 * Math.PI / 180, az = 211.0 * Math.PI / 180; return [Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)]; })();

// the north shore's line z at x
function nlShoreZ(x) { return NL_F.shoreZ + 5 * noise1(x * 0.011, 3) + 3 * Math.sin(x * 0.0047 + 1) - 4 * Math.exp(-((x - NL_F.kiosk.x) / 30) ** 2); }
// how far outside the lake (x, z) is (m; < 0 = on the lake)
function nlOut(x, z) {
  const F = NL_F;
  const n = nlShoreZ(x) - z;                                                  // north
  const s = z - (F.lake.zS + 40 * noise1(x * 0.004, 5));                      // south
  const w = F.lake.x[0] + 60 * noise1(z * 0.005, 7) - x, e = x - (F.lake.x[1] + 60 * noise1(z * 0.005, 9));
  return Math.max(n, s, w, e);
}
// the ground's height (the lake's ice is y = 0)
function nlGroundY(x, z) {
  const F = NL_F, d = nlOut(x, z);
  if (d <= 0) return 0;
  const north = nlShoreZ(x) - z;
  if (north > 0 && north >= d - 1e-6 && Math.abs(x) < 900) {
    // the north bank: up to the road (3 m), flat across it, then the town's slope and the hills
    const rz = F.road.z, top = F.road.y, zr0 = rz + F.road.w / 2 + 1.5;            // the road's lake-side edge (+ verge)
    if (z > zr0) { const k = MathX.clamp((nlShoreZ(x) - z) / (nlShoreZ(x) - zr0), 0, 1); return top * (k * k * (3 - 2 * k)); }
    if (z > rz - F.road.w / 2 - 1.5) return top;
    const u = (rz - F.road.w / 2 - 1.5) - z;
    return top + u * 0.07 + 0.012 * u * u * MathX.smooth(u, 80, 400) * 0.06 + 2.5 * noise1(x * 0.02 + z * 0.013, 11) * MathX.smooth(u, 10, 60) + 60 * MathX.smooth(u, 250, 900);
  }
  // other shores: a short bank, then forested hills
  const k = MathX.smooth(d, 0, 40);
  return k * (2 + d * 0.05) + MathX.smooth(d, 60, 700) * (55 + 45 * noise1(x * 0.0021 + z * 0.0017, 13) + 30 * noise1(x * 0.007 - z * 0.005, 17));
}
// the oval track's centre line at angle a (0 = east, counter-clockwise seen from above with north up)
function nlTrackP(a) { const T = NL_F.track; return [T.cx + T.a * Math.cos(a), T.cz - T.b * Math.sin(a)]; }
// distance from (x, z) to the track's centre line (approximate: the ellipse scaled to a circle)
function nlTrackD(x, z) {
  const T = NL_F.track, u = (x - T.cx) / T.a, v = (z - T.cz) / T.b, r = Math.hypot(u, v) || 1e-9, a = Math.atan2(-v, u), p = nlTrackP(a);
  return Math.hypot(x - p[0], z - p[1]) * (r < 1 ? -1 : 1);
}

// the town's houses: [x, z, w (along the road), d, wall h, colour, yaw]
const NL_HOUSES = (() => {
  const r = new RNG(4410), out = [], cols = ['#9b2f22', '#c9a23a', '#efe9dc', '#7a2a24', '#d8d2c2', '#3f5a6a', '#b65a2a', '#e8dfc8'];
  for (const [z0, step] of [[-466, 1], [-492, 1], [-520, 1.2], [-552, 1.4], [-590, 1.6]]) {
    for (let x = -360; x < 380; ) {
      const w = r.range(8, 13), d = r.range(7, 9), h = r.range(4.6, 6.4) + (r.next() < 0.3 ? 2.6 : 0);
      if (!(x > 138 && x < 162 && z0 > -470)) out.push([x + w / 2, z0 - d / 2 - r.range(0, 6), w, d, h, cols[r.int(0, cols.length - 1)], r.range(-0.08, 0.08)]);
      x += w + r.range(6, 16) * step;
    }
  }
  return out;
})();

if (typeof module !== 'undefined') module.exports = { NL_F, NL_SUN, nlShoreZ, nlOut, nlGroundY, nlTrackP, nlTrackD, NL_HOUSES };
