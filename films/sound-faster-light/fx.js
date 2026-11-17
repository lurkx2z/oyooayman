/* =====================================================================
   FX — what glows and drifts, every frame from scratch (a pure function of t and s): the far lights (the town and its
   water tower, the Hansen farm, other farms' yard lights over the plain, the freight train), the near glows (the yard
   light, the porch, the barn, the torch, the phones, the sheriff's light bar), the sparks and smoke when lightning hits
   the yard light, the tornado's dust, leaves and grit in the wind. Glows are added light; soft puffs never go past
   alpha 1 (picture pitfalls).
   ===================================================================== */

const sfH = (i, k = 0) => hash1(i * 7919 + k * 104729 + 17);
const sfFrac = (x) => x - Math.floor(x);
// other farms over the plain: [x, z] (their yard lights)
const SF_FARMS = (() => { const r = new RNG(3131), out = []; for (let i = 0; i < 46; i++) { const a = r.range(0, 6.283), d = r.range(900, 9000); const p = [Math.cos(a) * d, Math.sin(a) * d]; if (Math.hypot(p[0] - SF_PLACES.hansen[0], p[1] - SF_PLACES.hansen[1]) < 600 || Math.hypot(p[0] - SF_F.town[0], p[1] - SF_F.town[1]) < 1200) continue; out.push(p); } return out; })();
// the freight train: along a line through the crossing (heading north-west), its lights 4.5 m up
const SF_TRAIN = { dir: sfDirOf(305), v: 18, at(s) { const u = SF_TRAIN.v * (s - SFE.train); return [SF_F.rail[0] + SF_TRAIN.dir[0] * u, SF_F.rail[1] + SF_TRAIN.dir[1] * u]; } };

function sfFarmFx(set, s, t, o) {
  const { glow, far, soft, cam, F, yardOn, yardHit, torch, hansen } = o, E = SFE, P = cam.position;
  glow.begin(); far.begin(); soft.begin();
  const dist = (x, y, z) => Math.hypot(x - P.x, y - P.y, z - P.z);
  // a glow whose size on screen never drops under a couple of pixels (far lights stay visible in a long lens)
  const px = (d) => d * Math.tan(set.camera.fov * Math.PI / 360) * 2 / (set.renderH || 1080);
  const light = (pool, x, y, z, size, a, r, g, b, minPx = 2.2) => { const d = dist(x, y, z); pool.add(x, y, z, Math.max(size, px(d) * minPx), a, r, g, b); };
  // ---- the town: street lamps (sodium), the water tower's red light (a slow blink), the elevator's floodlight
  for (const [x, y, z, k] of set.town.lights) light(far, x, y, z, 6, 0.75, 1.0, k ? 0.85 : 0.6, k ? 0.6 : 0.25, 2.4);
  { const [x, y, z] = set.town.tower, b = 0.35 + 0.65 * Math.max(0, Math.sin(t * Math.PI * 0.9)); light(far, x, y, z, 5, b, 1.0, 0.12, 0.06, 3.0); }
  light(far, F.town[0] - 330, 46, F.town[1] + 150, 14, 0.5, 1.0, 0.8, 0.5, 2.6);
  // ---- other farms' yard lights over the plain
  SF_FARMS.forEach(([x, z], i) => { const y = sfGroundY(x, z) + 9, out = (i % 7 === 3) && s > 175; if (!out) light(far, x, y, z, 4, 0.85, 1.0, 0.72 + 0.2 * sfH(i, 2), 0.4 + 0.3 * sfH(i, 3), 2.4); });
  // ---- the Hansen farm: its yard light and a window, until the tornado takes them
  if (hansen.alive(s)) { const [x, z] = SF_PLACES.hansen, y = sfGroundY(x, z); light(far, x + 4, y + 8.8, z + 4.8, 3, 0.9, 1.0, 0.75, 0.45, 2.4); light(far, x - 10, y + 2.2, z + 9.6, 1.5, 0.6, 1.0, 0.7, 0.4, 1.6); }
  // ---- the freight train: the headlight and two ditch lights, a few minutes either side of its horn
  if (Math.abs(s - E.train) < 200) { const p = SF_TRAIN.at(s), y = sfGroundY(p[0], p[1]) + 4.5, sd = [-SF_TRAIN.dir[1], SF_TRAIN.dir[0]];
    light(far, p[0], y, p[1], 6, 1.0, 1.0, 0.95, 0.85, 8); for (const k of [-1, 1]) { const fl = 0.55 + 0.45 * Math.max(0, Math.sin(t * Math.PI * 1.5 + (k > 0 ? 0 : Math.PI))); light(far, p[0] + sd[0] * k * 1.2, y - 2.6, p[1] + sd[1] * k * 1.2, 2, fl, 1.0, 0.92, 0.8, 4.5); } }
  // ---- the near lamps' halos in the wet air
  if (yardOn) { const [x, y, z] = set.yard.yardLight.lamp; glow.add(x, y - 0.05, z, 1.4, 0.32, 1.0, 0.7, 0.38); glow.add(x, y - 0.05, z, 0.4, 0.8, 1.0, 0.85, 0.6); }
  { const [x, y, z] = set.house.porchLight; glow.add(x, y, z, 0.9, 0.35, 1.0, 0.75, 0.45); }
  { const [x, y, z] = set.barn.lamp; glow.add(x, y, z, 1.0, 0.32, 1.0, 0.78, 0.5); }
  // ---- the torch's lens (seen from in front), the phones' screens
  if (torch.on) { const [x, y, z] = torch.p, fc = torch.face; glow.add(x, y, z, 0.05 + 0.04 * fc, 0.25 + 0.6 * fc, 1.0, 0.95, 0.85); glow.add(x, y, z, 0.3, 0.14 * fc * fc, 1.0, 0.9, 0.75); }
  // ---- seen from above: where your torch lights the corn, a pool of warm light moving through it
  if (o.torchTop) { const [x, y, z] = o.torchTop; glow.add(x, y, z, 6.0, 0.4, 1.0, 0.82, 0.55); glow.add(x, y, z, 2.2, 0.55, 1.0, 0.9, 0.7); }
  for (const ph of o.phones) if (ph.on) glow.add(ph.p[0], ph.p[1], ph.p[2], 0.09, 0.22, 0.75, 0.85, 1.0);
  // ---- the sheriff's car: its light bar (red and blue, alternating, soft-edged) and headlights
  if (o.car.on) { const c = o.car; const ph = t * Math.PI * 2 * 1.4, a = 0.5 + 0.5 * Math.sin(ph), b = 1 - a;
    glow.add(c.bar[0] - c.side[0] * 0.4, c.bar[1], c.bar[2] - c.side[1] * 0.4, 0.7 + 1.1 * a, 0.5 * a + 0.05, 1.0, 0.1, 0.06); glow.add(c.bar[0] + c.side[0] * 0.4, c.bar[1], c.bar[2] + c.side[1] * 0.4, 0.7 + 1.1 * b, 0.5 * b + 0.05, 0.12, 0.25, 1.0);
    for (const k of [-1, 1]) glow.add(c.head[0] + c.side[0] * 0.65 * k, c.head[1], c.head[2] + c.side[1] * 0.65 * k, 0.5, 0.6, 1.0, 0.95, 0.85); }
  // ---- lightning hits the yard light: a burst of sparks, then molten drips and smoke from the dead lamp
  { const u = s - yardHit; if (u > -0.02 && u < 30) { const [x, y, z] = set.yard.yardLight.lamp;
      for (let i = 0; i < 160; i++) { const L = 0.6 + 1.4 * sfH(i, 1), w = u - 0.02 * sfH(i, 9); if (w < 0 || w > L) continue; const a = sfH(i, 2) * 6.283, v = 3 + 9 * sfH(i, 3), up = -2 + 8 * sfH(i, 4);
        const px2 = x + Math.cos(a) * v * w, py = y + up * w - 4.9 * w * w, pz = z + Math.sin(a) * v * w; if (py < 0.05) continue; const k = 1 - w / L; glow.add(px2, py, pz, 0.08 + 0.05 * k, k, 1.0, 0.7 + 0.3 * k, 0.3 + 0.4 * k); }
      if (u > 0.3) for (let i = 0; i < 18; i++) { const L = 1.0 + sfH(i, 11), w = sfFrac((u - 0.3) / L + sfH(i, 12)); const fall = u < 9 ? 1 : 0; if (!fall) break; glow.add(x + 0.1 * (sfH(i, 13) - 0.5), y - 0.15 - 4.9 * (w * L) ** 2, z + 0.1 * (sfH(i, 14) - 0.5), 0.05, (1 - w) * 0.8, 1.0, 0.6, 0.2); }
      for (let i = 0; i < 40; i++) { const L = 6 + 3 * sfH(i, 15), w = sfFrac(u / L + sfH(i, 16)); if (u < w * L) continue; const wd = o.wind; soft.add(x + w * wd[0] * 6 + 0.5 * Math.sin(t + i), y + 0.4 + w * 4, z + w * wd[1] * 6, 0.4 + 2.2 * w, 0.35 * (1 - w) * MathX.smooth(u, 0.2, 1.0), 0.05, 0.05, 0.05); } } }
  // ---- the tornado: a ring of dust and debris at its foot, turning, rising
  { const T = o.tornado; if (T && T.vis) { const k = T.r / 80;
      for (let i = 0; i < 420; i++) { const L = 9 + 6 * sfH(i, 21), w = sfFrac(t / L + sfH(i, 22)), a = sfH(i, 23) * 6.283 + t * (0.7 - 0.4 * w), rr = (70 + 90 * sfH(i, 24) + 60 * w) * k, y = w * (40 + 160 * sfH(i, 25));
        const x = T.p[0] + Math.cos(a) * rr, z = T.p[1] + Math.sin(a) * rr, c = 0.035 + 0.05 * T.lit;
        soft.add(x, T.y + y, z, (25 + 45 * w) * k, 0.55 * (1 - w) * MathX.smooth(w, 0, 0.1), c * 1.1, c, c * 0.85); } } }
  // ---- the wind: leaves and grit blowing past the camera (towards the tornado), late on
  { const wk = o.windK; if (wk > 0.02) { const wd = o.wind;
      for (let i = 0; i < 260; i++) { const L = 1.6 + sfH(i, 31), w = sfFrac(t / L + sfH(i, 32)), ox = (sfH(i, 33) - 0.5) * 30, oz = (sfH(i, 34) - 0.5) * 30, oy = sfH(i, 35) * 5;
        const x = P.x + ox + (w - 0.5) * wd[0] * 25, z = P.z + oz + (w - 0.5) * wd[1] * 25, y = Math.max(0.2, P.y - 1.4 + oy + Math.sin(t * 3 + i) * 0.4);
        const c = 0.02 + 0.06 * o.lit; soft.add(x, y, z, 0.06 + 0.08 * sfH(i, 36), wk * 0.8 * Math.sin(Math.PI * w), c * 0.9, c * 1.1, c * 0.7); } } }
  glow.end(); far.end(); soft.end();
}
