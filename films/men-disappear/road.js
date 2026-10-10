/* =====================================================================
   ROAD — the waterfront road under the viaduct's left side. When the drivers who are men vanish, their feet
   leave the pedals: the cars don't speed up, they coast (engine braking + rolling resistance ≈ 0.7 m/s²) and drift
   with the road's camber until a kerb or a parked car stops them. Women drivers brake and put their hazards on.
   One SUV was on cruise control: it holds 50 km/h, drifts across its lane and hits a parked van.
   Each car is a closed-form function of time: lane, start z, speed, who was driving.
   ===================================================================== */

const MD_RX = MD_G.roadX;
// [id, type, colour, lane x, z at t 0, speed m/s (− = toward −z), driver 'm' | 'w' | 'cruise' | 'parked', drift m (lateral, + = toward +x)]
const MD_CARS = [
  ['cruise', 'suv', '#b9bcbe', MD_RX + 1.6, 274.4, -13.9, 'cruise', 4.4],
  ['c2', 'hatch', '#7a3a30', MD_RX + 1.6, 92, -9.5, 'w', 0],
  ['c8', 'ev', '#8a8f94', MD_RX + 1.6, 186, -12.5, 'm', 4.0, 144.6],   // drifts into the parked sedan (p3) seconds after the vanish
  ['c1', 'sedan', '#5c6670', MD_RX + 4.0, 128, -11.0, 'm', 0.2],
  ['c3', 'van', '#d4d0c4', MD_RX + 4.0, 220, -10.5, 'm', 0.2],
  ['c4', 'taxi', '#c4a24c', MD_RX - 1.6, 18, 10.5, 'm', -0.5],
  ['c6', 'sedan', '#2e3a32', MD_RX - 1.6, 70, 11.5, 'w', 0],
  ['c7', 'pickup', '#6e5a44', MD_RX - 1.6, 104, 12.0, 'm', -0.4],
  ['c5', 'bus', '#3d6a78', MD_RX - 3.6, 30, 8.5, 'm', 0],
  // parked along the near kerb (the van the SUV hits) and the far kerb
  ['p1', 'van', '#e2ded4', MD_RX + 6.0, 66.0, 0, 'parked', 0],
  ['p2', 'hatch', '#4a5a6a', MD_RX + 6.0, 54, 0, 'parked', 0],
  ['p3', 'sedan', '#6a3a3a', MD_RX + 6.0, 140, 0, 'parked', 0],
  ['p4', 'suv', '#3a4048', MD_RX - 6.0, 46, 0, 'parked', 0],
  ['p5', 'sedan', '#9a9488', MD_RX - 6.0, 63, 0, 'parked', 0],
  ['p6', 'hatch', '#5a6a5a', MD_RX - 6.0, 120, 0, 'parked', 0],
];
const MD_COAST = 0.72, MD_WBRAKE = 3.0, MD_REACT = 0.9;

// distance travelled (signed along the lane) and speed at t
function mdCarMotion(c, t) {
  const [, , , , z0, v0, who] = c, V = MD.vanish, s = Math.sign(v0) || 1, u0 = Math.abs(v0);
  if (who === 'parked') return { d: 0, v: 0 };
  if (t <= V) return { d: v0 * t, v: u0 };
  const a = t - V, dV = u0 * V;
  if (who === 'cruise') {
    const th = MD.cruise - V;
    if (a < th) return { d: s * (dV + u0 * a), v: u0 };
    const b = a - th, stop = 0.35;                     // the crumple: 13.9 m/s → 0 in ~0.35 s over ~2.4 m
    const db = b < stop ? u0 * b - 0.5 * (u0 / stop) * b * b : 0.5 * u0 * stop;
    return { d: s * (dV + u0 * th + db), v: b < stop ? u0 * (1 - b / stop) : 0 };
  }
  if (who === 'w') {
    if (a < MD_REACT) return { d: s * (dV + u0 * a), v: u0 };
    const b = a - MD_REACT, tb = u0 / MD_WBRAKE, bb = Math.min(b, tb);
    return { d: s * (dV + u0 * MD_REACT + u0 * bb - 0.5 * MD_WBRAKE * bb * bb), v: Math.max(0, u0 - MD_WBRAKE * b) };
  }
  const tc = u0 / MD_COAST, b = Math.min(a, tc);
  const d = s * (dV + u0 * b - 0.5 * MD_COAST * b * b), v = Math.max(0, u0 - MD_COAST * a);
  // a coasting car that drifts into a parked one stops dead where it hits (c[8]: the z where it stops)
  if (c[8] !== undefined && (z0 + d - c[8]) * s >= 0) return { d: c[8] - z0, v: 0 };
  return { d, v };
}
// when a car with a stop point hits (closed form: solve the coasting distance)
function mdCrashT(id) {
  const c = MD_CARS.find((k) => k[0] === id), u0 = Math.abs(c[5]), need = Math.abs(c[8] - c[4]) - u0 * MD.vanish;
  return MD.vanish + (u0 - Math.sqrt(u0 * u0 - 2 * MD_COAST * need)) / MD_COAST;
}
const MD_CRASH0 = mdCrashT('c8');
function mdCarKmh(id, t) { const c = MD_CARS.find((k) => k[0] === id); return mdCarMotion(c, t).v * 3.6; }

class MdRoad {
  constructor(scene) {
    const F = new VehicleFactory();
    this.cars = MD_CARS.map((c) => {
      const v = F.build(c[1], c[2]);
      v.group.name = 'veh:' + c[0];
      scene.add(v.group);
      return { c, v, r: v.r || 0.33 };
    });
    this.shadows = new BlobShadows(scene, 24);
  }

  update(t) {
    this.shadows.begin();
    const V = MD.vanish;
    for (const k of this.cars) {
      const c = k.c, [id, , , lane, z0, v0, who, drift] = c, m = mdCarMotion(c, t);
      const z = z0 + m.d;
      // drift across the lane while coasting (camber, no hands on the wheel); a little yaw while it drifts
      const dk = who === 'cruise' ? MathX.smooth(t, V + 3, MD.cruise) : c[8] !== undefined ? MathX.smooth(t, V + 0.2, MD_CRASH0) : MathX.smooth(t, V + 0.5, V + 14);
      const x = lane + drift * dk;
      const yawDrift = who === 'parked' ? 0 : -Math.sign(v0 || 1) * drift * 0.05 * Math.sin(dk * Math.PI);
      const g = k.v.group;
      g.position.set(x, MD_G.quay, z);
      g.rotation.y = (v0 < 0 ? 0 : Math.PI) + Math.PI / 2 + yawDrift;
      // the SUV hits the van: it noses down and twists; the van is shoved and rocks
      if (id === 'cruise' && t > MD.cruise) { const b = t - MD.cruise; g.rotation.y += 0.12 * MathX.smooth(b, 0, 0.35); g.rotation.z = 0.04 * Math.sin(b * 9) * Math.exp(-b / 0.5); }
      if (id === 'c8' && t > MD_CRASH0) { const b = t - MD_CRASH0; g.rotation.y += 0.22 * MathX.smooth(b, 0, 0.3); g.rotation.z = 0.05 * Math.sin(b * 9) * Math.exp(-b / 0.5); }
      if (id === 'p3' && t > MD_CRASH0 + 0.05) { const b = t - MD_CRASH0 - 0.05; g.position.z -= 2.4 * (1 - Math.exp(-b / 0.3)); g.position.x += 0.5 * (1 - Math.exp(-b / 0.3)); g.rotation.y += 0.14 * (1 - Math.exp(-b / 0.3)); }
      if (id === 'p1' && t > MD.cruise + 0.12) { const b = t - MD.cruise - 0.12; g.position.z -= 3.0 * (1 - Math.exp(-b / 0.35)); g.position.x += 0.35 * (1 - Math.exp(-b / 0.3)); g.rotation.y += 0.09 * (1 - Math.exp(-b / 0.3)); g.rotation.x = 0.03 * Math.sin(b * 8) * Math.exp(-b / 0.6); }
      for (const w of k.v.wheels) w.rotation.z = -Math.abs(m.d) / k.r;
      // hazards: the women who braked switch them on; the van after it is hit
      const haz = (who === 'w' && t > V + 2.2) || (id === 'p1' && t > MD.cruise + 0.6) || (id === 'p3' && t > MD_CRASH0 + 0.5);
      if (k.v.hazard) k.v.hazard.emissiveIntensity = haz && Math.floor(t * 1.6) % 2 === 0 ? 2.2 : 0;
      // brake lights: on for the women braking; off for the coasting cars (nobody's foot is on the pedal)
      if (k.v.tail) k.v.tail.emissiveIntensity = who === 'w' && t > V + MD_REACT && m.v > 0 ? 2.0 : 0.5;
      this.shadows.push(x, MD_G.quay + 0.02, z, 1.25, 0.55, 2.8, g.rotation.y - Math.PI / 2);
    }
    this.shadows.end();
  }
}
