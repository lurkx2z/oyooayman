/* =====================================================================
   CAST — people and traffic. People use the shared rig (js/world/people.js): a spec is
   { id, look, path: [[t, x, z], …], states: [[t, 'action'], …], y, face, stride }.
   Cars use VehicleFactory (js/world/vehicles.js), driven here by simple time functions.
   Add film-specific looks/actions with Object.assign(LOOKS, {…}) / Object.assign(ACTIONS, {…}) + BLEND.
   ===================================================================== */

// people: walkers on both sidewalks (stagger speeds and start times — never animate a crowd in sync)
const NR_PEOPLE = [
  { id: 'P1', look: 'casual1', y: 0.15, path: [[0, 10.6, -14], [30, 10.6, -52]], states: [[0, 'walk'], [NR.first + 0.6, 'look'], [NR.first + 2.0, 'walk']] },
  { id: 'P2', look: 'casual6', y: 0.15, path: [[0, 8.4, -30], [30, 8.4, 4]], states: [[0, 'walk']] },
  { id: 'P3', look: 'casual2', y: 0.15, path: [[0, -9.6, -6], [30, -9.6, -44]], states: [[0, 'walk'], [NR.payoff + 0.2, 'stumble']] },
  { id: 'P4', look: 'casual8', y: 0.15, path: [[0, -10.4, -40], [30, -10.4, -2]], states: [[0, 'walk'], [NR.second, 'phone']] },
  { id: 'P5', look: 'casual4', y: 0.15, path: [[0, -9.0, -24]], states: [[0, 'idle'], [NR.rule[0] + 0.4, 'look']], face: 120 },
];

// traffic: [type, colour, lane x, z at t = 0, speed m/s (negative = toward −Z, away from you)]
const NR_CARS = [
  ['sedan', '#6c7a86', 1.75, 10, -8.5],
  ['suv', '#3d4a44', 5.25, -2, -6.0],
  ['hatch', '#8a4a3c', -1.75, -120, 9.0],
  ['van', '#c9c4b8', -5.25, -60, 5.5],
  ['taxi', '#c4a24c', 1.75, -30, -7.5],
];

class NrCast {
  constructor(app) {
    this.people = NR_PEOPLE.map((s) => new Person(s, app.scene));
    this.shadows = new BlobShadows(app.scene, 16);
    const F = new VehicleFactory();
    this.cars = NR_CARS.map(([type, color, x, z0, v]) => {
      const c = F.build(type, color);
      c.group.name = 'veh:' + type;                       // (Look.surface finds vehicles by this prefix)
      app.scene.add(c.group);
      return { c, x, z0, v, r: (CAR_PROFILES[type] && CAR_PROFILES[type].r) || 0.33 };
    });
  }

  update(t) {
    this.shadows.begin();
    for (const p of this.people) {
      p.update(t);
      const q = p.root.position;
      this.shadows.push(q.x, q.y + 0.01, q.z, 0.55, 0.5);
    }
    for (const k of this.cars) {
      const z = k.z0 + k.v * t, g = k.c.group;
      g.position.set(k.x, 0, z);
      g.rotation.y = (k.v < 0 ? 0 : Math.PI) + Math.PI / 2;  // forward = +X locally; yaw 0 faces −Z
      for (const w of k.c.wheels) w.rotation.z = -Math.abs(k.v * t) / k.r;
      this.shadows.push(k.x, 0.01, z, 1.2, 0.55, 2.6);
    }
    this.shadows.end();
  }
}
