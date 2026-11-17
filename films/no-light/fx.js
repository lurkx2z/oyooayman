/* =====================================================================
   FX — what drifts and burns on the lake set, every frame from scratch (a pure function of time): the bonfire (flames
   and sparks: added light) and its smoke, the town's chimney smoke, exhaust from every running engine (the stopped
   cars, the lorry, the car on the ice), everyone's breath, the frost smoke off the hole, the plane's hot exhaust.
   In the heat view each puff is drawn by its temperature (nlHeatRGB); in daylight (the title) by its colour.
   Soft puffs never go past alpha 1 (picture pitfalls: alpha over 1 on the float target takes light away).
   ===================================================================== */

const nlH = (i, k = 0) => hash1(i * 7919 + k * 104729 + 17);
const nlFrac = (x) => x - Math.floor(x);

function nlLakeFx(set, s, t, o) {
  const { hot, soft, shore, roadCars, car, lorry, plane, heat, people } = o, F = NL_F, E = NLE, cam = set.camera.position;
  hot.begin(); soft.begin();
  const tc = (T, r, g, b) => { if (!heat) return [r, g, b]; const v = Math.min(2.6, nlHeatRGB(T)); return [v, v, v]; };
  const near = (x, y, z, d) => (x - cam.x) ** 2 + (y - cam.y) ** 2 + (z - cam.z) ** 2 < d * d;
  // ---- the bonfire: flames (hot, added), sparks, then smoke
  { const [fx, fy, fz] = shore.fire;
    if (near(fx, fy, fz, 700)) {
      for (let i = 0; i < 90; i++) {
        const L = 0.7 + 0.6 * nlH(i), u = nlFrac(t / L + nlH(i, 1)), a = nlH(i, 2) * 6.283, r0 = 0.45 * Math.sqrt(nlH(i, 3)) * (1 - 0.7 * u);
        const sw = 0.12 * Math.sin(t * 3.1 + i) * u;
        const x = fx + Math.cos(a) * r0 + sw, y = fy + 0.25 + u * (1.3 + 0.8 * nlH(i, 4)), z = fz + Math.sin(a) * r0;
        const T = 820 * (1 - u) ** 1.4 + 60, c = tc(T, 1.0, 0.45 + 0.3 * (1 - u), 0.12);
        hot.add(x, y, z, 0.36 * (1 - 0.55 * u), (heat ? 0.22 : 0.5) * (1 - u) * MathX.smooth(u, 0, 0.12), c[0], c[1], c[2]);
      }
      for (let i = 0; i < 24; i++) {
        const L = 1.6 + nlH(i, 5), u = nlFrac(t / L + nlH(i, 6)), x = fx + (nlH(i, 7) - 0.5) * 0.8 + 0.6 * u * (nlH(i, 8) - 0.5), y = fy + 0.4 + u * (3.5 + 2 * nlH(i, 9)), z = fz + (nlH(i, 10) - 0.5) * 0.8;
        const c = tc(500 * (1 - u) + 20, 1.0, 0.6, 0.2);
        hot.add(x, y, z, 0.035, (heat ? 0.5 : 0.9) * (1 - u), c[0], c[1], c[2]);
      }
      for (let i = 0; i < 70; i++) {
        const L = 7 + 3 * nlH(i, 11), u = nlFrac(t / L + nlH(i, 12)), x = fx + (nlH(i, 13) - 0.5) * 0.6 + u * 2.2 + 0.4 * Math.sin(t * 0.4 + i), y = fy + 1.4 + u * 10, z = fz + (nlH(i, 14) - 0.5) * 0.6 - u * 0.8;
        const c = tc(8 * (1 - u) ** 3 - 11, 0.55, 0.53, 0.5);
        soft.add(x, y, z, 0.5 + 2.4 * u, (heat ? 0.12 : 0.2) * (1 - u) * MathX.smooth(u, 0, 0.1), c[0], c[1], c[2]);
      }
    }
  }
  // ---- the town's chimneys (wood stoves): warm smoke rising straight up in the still air
  for (let j = 0; j < shore.chimneys.length; j++) {
    const [x0, y0, z0] = shore.chimneys[j];
    if (!near(x0, y0, z0, 900) || nlH(j, 40) < 0.25) continue;
    for (let i = 0; i < 6; i++) {
      const u = nlFrac(t / 10 + nlH(j * 8 + i, 41)), x = x0 + 0.7 * u * Math.sin(j + t * 0.2), y = y0 + u * 9, z = z0 + 0.4 * u;
      const c = tc(40 * (1 - u) ** 2 - 12, 0.75, 0.74, 0.72);
      soft.add(x, y, z, 0.35 + 2.2 * u, 0.26 * (1 - u) * MathX.smooth(u, 0, 0.08), c[0], c[1], c[2]);
    }
  }
  // ---- exhaust: the stopped cars (engines running), the lorry, the car on the lake (until it goes under)
  const exhaust = (x, y, z, dx, dz, n, seed, k = 1) => {
    if (!near(x, y, z, 400)) return;
    for (let i = 0; i < n; i++) {
      const u = nlFrac(t / 2.6 + nlH(seed * 31 + i, 50)), w = (nlH(seed * 31 + i, 51) - 0.5) * 0.5;
      const c = tc(70 * (1 - u) ** 2 - 8, 0.85, 0.85, 0.86);
      soft.add(x + dx * u * 1.6 + w * u, y + u * 1.1, z + dz * u * 1.6 + w * u, 0.12 + 0.75 * u, 0.32 * k * (1 - u) * MathX.smooth(u, 0, 0.1), c[0], c[1], c[2]);
    }
  };
  roadCars.forEach((c, i) => { const L = (c.v && c.v.L) || 4.4, b = [-Math.sin(c.yaw), -Math.cos(c.yaw)]; exhaust(c.x + b[0] * L / 2, F.road.y + 0.32, c.z + b[1] * L / 2, b[0], b[1], 10, i); });
  { const g = lorry.g, yw = g.rotation.y, f = [Math.sin(yw), Math.cos(yw)], sd = [Math.cos(yw), -Math.sin(yw)];
    if (g.visible) exhaust(g.position.x + f[0] * 3.3 + sd[0] * 1.05, g.position.y + 3.5, g.position.z + f[1] * 3.3 + sd[1] * 1.05, -f[0], -f[1], 12, 77); }
  if (car.visible && s < E.sink + 6) { const yw = car.rotation.y, b = [-Math.sin(yw), -Math.cos(yw)]; exhaust(car.position.x + b[0] * 2.3, car.position.y + 0.32, car.position.z + b[1] * 2.3, b[0], b[1], 12, 91, s > E.sink ? 1 - MathX.smooth(s - E.sink, 0, 6) : 1); }
  // ---- breath: everyone near the camera, every few seconds (warm, wet: a heat camera sees it faintly)
  const v = NL_FX_V || (NL_FX_V = [new THREE.Vector3(), new THREE.Vector3()]);
  people.forEach((P, n) => {
    if (!P.root.visible) return;
    const r = P.root.position; if (!near(r.x, r.y + 1, r.z, 45)) return;
    P.j.head.updateWorldMatrix(true, false); P.j.head.getWorldPosition(v[0]); v[1].set(0, 0, 1).transformDirection(P.j.head.matrixWorld);
    if (near(v[0].x, v[0].y, v[0].z, 0.6)) return;                    // (the camera's own head: a POV shot breathes out of frame)
    const per = 3.2 + 1.3 * nlH(n, 60), ph = nlFrac(t / per + nlH(n, 61));
    for (let i = 0; i < 5; i++) {
      const age = ph * per - i * 0.12; if (age < 0 || age > 1.9) continue;
      const u = age / 1.9, x = v[0].x + v[1].x * (0.14 + 0.5 * u), y = v[0].y - 0.06 + v[1].y * (0.14 + 0.5 * u) + 0.25 * u * u, z = v[0].z + v[1].z * (0.14 + 0.5 * u);
      const c = tc(24 * (1 - u) ** 2 - 6, 0.96, 0.96, 0.98);
      soft.add(x, y, z, 0.05 + 0.3 * u, (heat ? 0.4 : 0.22) * (1 - u) * MathX.smooth(u, 0, 0.08), c[0], c[1], c[2]);
    }
  });
  // ---- the hole: frost smoke off water at 0 °C into air at −12 °C
  { const R = NLV.holeR(s), H = NLV.hole;
    if (R > 0.1 && near(H[0], 0, H[1], 600)) for (let i = 0; i < 70; i++) {
      const u = nlFrac(t / 5 + nlH(i, 70)), a = nlH(i, 71) * 6.283, rr = R * Math.sqrt(nlH(i, 72)) * 0.95;
      const c = tc(5 * (1 - u) - 10, 0.9, 0.92, 0.95);
      soft.add(H[0] + Math.cos(a) * rr + 0.3 * u * Math.sin(t * 0.3 + i), 0.1 + u * 1.6, H[1] + Math.sin(a) * rr, 0.25 + 0.9 * u, 0.2 * (1 - u) * MathX.smooth(u, 0, 0.15) * MathX.smooth(s - E.sink, 0, 6), c[0], c[1], c[2]);
    }
  }
  // ---- the plane: two hot exhaust trails
  if (plane.g.visible) { const g = plane.g, yw = g.rotation.y, f = [Math.sin(yw), Math.cos(yw)], sd = [Math.cos(yw), -Math.sin(yw)];
    for (const e of [-4.2, 4.2]) for (let i = 0; i < 30; i++) {
      const d = 2.8 + i * 1.6, x = g.position.x + sd[0] * e - f[0] * d, y = g.position.y + 0.7, z = g.position.z + sd[1] * e - f[1] * d, c = tc(260 * Math.exp(-i / 7) + 0, 1, 1, 1);
      hot.add(x, y, z, 0.7 + 0.08 * i, heat ? 0.12 * Math.exp(-i / 12) : 0, c[0], c[1], c[2]);
    }
  }
  hot.end(); soft.end();
}
let NL_FX_V = null;
