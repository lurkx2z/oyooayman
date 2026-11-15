/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x EAST, y up, z SOUTH (north is −z).
   A harbour town on the equator, Sunday 15 November 2026, 5:42 PM: the Sun 6.5° up in the west-south-west (azimuth
   251.5°), the sea to the WEST, a hill to the EAST. The railway runs east–west, rail level and the plain at y = 0.
     west      the harbour (sea level y = −2.6, 10 m deep at the quay), the quay wall at x = −250, the quay's apron
     station   the buffer stops at x = −212; two platforms x −210…0 (1.1 m high) either side of two tracks; the station
               building and its clock tower north of platform 1; a canopy over each platform; a footbridge at their east end (x = −8)
     your train  four cars standing at platform 1, its nose at x = −14, pointing east
     east      the two tracks become one; a level crossing at x = 200; a signal box; a fuel siding with six tank wagons
               (x 301…391); the depot's shed; palms; then, at x = 600, the hill: a rock face 26 m high with the tunnel
               mouth in it, the ridge 140 m high behind
     the town  low buildings north and south of the station
   Everything loose is a "flyer": from 5:42:00.000 to 5:42:01.000 it keeps going east at 465 m/s while the ground stands
   still (physics.js: ESP.X).
   ===================================================================== */

const ES_F = {
  sea: { level: -2.6, bed: -12.6 },
  quay: { x: -250, apron: -214 },
  buffers: -212, rail: 0.2,
  plat: { x: [-210, 0], h: 1.1, p1: [-7.6, -1.65], p2: [6.05, 11.0] },
  track: { z1: 0, z2: 4.4, z3: -9, gauge: 1.435, merge: [50, 140], siding: [262, 404] },
  bldg: { x: [-130, -62], z: [-19.6, -7.6], h: 7.6, roof: 10.6, tower: { x: -96, z: -13.6, w: 5.6, h: 20 } },
  can1: { x: [-180, -28], z: [-7.4, -1.75], y: 5.6, colZ: -4.7, step: 9.5 },
  can2: { x: [-150, -60], z: [6.3, 10.8], y: 5.6, colZ: 8.55, step: 10 },
  bridge: { x: -8, y: 5.9, z: [-5.6, 9.6], w: 2.6 },
  train: { nose: -14, cars: 4, carL: 25, z: 0 },
  you: { car: 1, lx: 4.2, side: -1 },         // your seat: car 1 (the second from the front), on the north side
  hill: { x: 600, cliff: 26, top: 140 },
  wagons: { front: 391, n: 6, L: 15, z: -9 },
  shed: { x: 408, z: -26, w: 26, d: 12, h: 6.5 },
  sigbox: { x: 250, z: 9.5 },
  wtower: { x: 160, z: -16 },
  crossing: { x: 200, w: 7 },
  ferry: { bow: -540, z: -34, L: 62, B: 13 },
  boats: [[-292, 22, 0.3], [-318, -72, -0.5], [-365, 58, 1.2], [-330, 6, 2.6]],
};
// the Sun at 5:42 PM on 15 November from the equator: azimuth 251.5° (from north, through east); drawn 6.5° up
const ES_SUN = (() => { const alt = 6.5 * Math.PI / 180, az = 251.5 * Math.PI / 180; return [Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)]; })();

// where the hill's rock face stands (x) at z: straight at the tunnel mouth, wavering elsewhere
function esHillX(z) {
  const k = MathX.smooth(Math.abs(z), 9, 40);
  return ES_F.hill.x + k * (5 * noise1(z * 0.021, 3) + 2.2 * noise1(z * 0.09, 5));
}
// the ground's height: the plain (y = 0), the harbour's bed west of the quay, the hill east of its rock face
function esGroundY(x, z) {
  const F = ES_F;
  if (x < F.quay.x) return F.sea.bed;
  const hx = esHillX(z);
  if (x > hx - 0.6) {
    const k = MathX.clamp((x - (hx - 0.6)) / 3.6, 0, 1), cl = F.hill.cliff * (0.92 + 0.08 * noise1(z * 0.05, 9));
    if (k < 1) return cl * (k * k * (3 - 2 * k));
    const u = x - hx - 3;
    return cl + (F.hill.top - cl) * (1 - Math.exp(-u / 150)) + 7 * noise1(x * 0.012 + z * 0.017, 11) * Math.min(1, u / 60) + 3 * noise1(z * 0.04 - x * 0.03, 13) * Math.min(1, u / 30);
  }
  const far = MathX.smooth(Math.abs(z), 30, 90);
  return far * 0.25 * noise1(x * 0.03 + z * 0.021, 17);
}

// the palms: [x, z, height, lean seed]: along the line, around the town, along the foot of the hill
const ES_PALMS = (() => {
  const r = new RNG(5421), out = [];
  const add = (x, z, h) => { if (Math.abs(z) < 7 && x > -215) return; if (z > -22 && z < 13 && x > -215 && x < 5) return; out.push([x, z, h ?? r.range(7, 11), r.next()]); };
  for (let x = -200; x < 560; x += r.range(14, 30)) { add(x + r.range(-3, 3), -r.range(26, 44)); add(x + r.range(-3, 3), r.range(18, 40)); }
  for (let i = 0; i < 46; i++) add(r.range(-240, 560), (r.next() < 0.5 ? -1 : 1) * r.range(50, 190));
  // the row along the foot of the hill (the first things to reach the rock)
  for (let z = -170; z <= 170; z += r.range(9, 17)) { if (Math.abs(z) < 12) continue; add(esHillX(z) - r.range(6, 26), z, r.range(8, 12)); }
  return out;
})();

// the town's buildings: [x, z, w (east–west), d, h, colour k, roof k]
const ES_TOWN = (() => {
  const r = new RNG(777), out = [];
  const rows = [[-34, -52, 1], [-64, -84, 1], [-98, -120, 1], [26, 46, -1], [58, 80, -1], [94, 118, -1]];
  for (const [z0, z1] of rows.map((q) => [Math.min(q[0], q[1]), Math.max(q[0], q[1])])) {
    for (let x = -236; x < 118; ) {
      const w = r.range(9, 20), d = Math.min(z1 - z0, r.range(9, 16)), h = r.next() < 0.25 ? r.range(8.5, 12) : r.range(3.6, 7);
      if (!(z0 < -19 && z1 > -34 && x > -140 && x < -50)) out.push([x + w / 2, r.next() < 0.5 ? z0 + d / 2 : z1 - d / 2, w, d, h, r.int(0, 5), r.int(0, 2)]);
      x += w + r.range(3, 11);
    }
  }
  return out;
})();

if (typeof module !== 'undefined') module.exports = { ES_F, ES_SUN, esGroundY, esHillX, ES_PALMS, ES_TOWN };
