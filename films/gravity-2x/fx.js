/* =====================================================================
   FX — water and dust, every particle computed from its birth time and age (scrubbing is exact). Everything
   that flies falls at 2 G (19.6 m/s²); bubbles rise faster (their buoyancy doubles with the water's weight).
     chalk from the bar hitting the safety arms · the ladder man's splash · your slide into the deep end ·
     the diver's entry (crown, jet, mist, foam) · under water: her bubble plume, light shafts, drifting specks
   ===================================================================== */

// a lumpy, soft puff for mist and dust (a few overlapping soft blobs, faded to nothing at the edge; deterministic)
function gvPuffTex() {
  const S = 128, c = Tex.canvas(S, S), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const a = hash1(i * 3.7 + 1) * Math.PI * 2, r = 22 * Math.sqrt(hash1(i * 5.3 + 2)), cx = 64 + Math.cos(a) * r, cy = 64 + Math.sin(a) * r, R = 16 + 16 * hash1(i * 7.1 + 3);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(0.55, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  x.globalCompositeOperation = 'multiply';
  const m = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  m.addColorStop(0, '#fff'); m.addColorStop(0.6, '#fff'); m.addColorStop(1, '#000');
  x.fillStyle = m; x.fillRect(0, 0, S, S);
  return Tex.tex(c, { srgb: false, repeat: false });
}
// a bubble: a thin bright rim, a faint body and a highlight (the alpha is read from red)
function gvBubbleTex() {
  const S = 64, c = Tex.canvas(S, S), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgb(150,150,150)'); g.addColorStop(0.6, 'rgb(170,170,170)'); g.addColorStop(0.88, 'rgb(225,225,225)'); g.addColorStop(1, 'rgb(0,0,0)');   // (silvery, a soft rim)
  x.fillStyle = g; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgb(255,255,255)'; x.beginPath(); x.arc(24, 22, 5, 0, Math.PI * 2); x.fill();
  return Tex.tex(c, { srgb: false, repeat: false });
}

// where the diver enters the water, and how deep her feet are b seconds later
const GV_ENTRY = { x: GV_DIVER.x, z: GV_DIVER.ze + GV_DIVER.vz * GV_FALL.T2 };
function gvDiverDepth(b) { const D = GV_DIVER; return D.deep * (1 - Math.exp(-Math.max(0, b) * GV_FALL.v2 / D.deep)); }

class GvFx {
  constructor(app) {
    const scene = app.scene;
    this.app = app;
    this.mist = new BillboardSystem(scene, 700, false); this.mist.uniforms.uLight.value = 1.0; this.mist.uniforms.uMap.value = gvPuffTex();
    this.bub = new BillboardSystem(scene, 1400, false); this.bub.uniforms.uLight.value = 1.0; this.bub.uniforms.uMap.value = gvBubbleTex();
    this.drops = new StreakSystem(scene, 1500);
    this.rays = new StreakSystem(scene, 120);
    this.foam = null;                                         // [x, z, radius, amount] for the water shader
    this.under = 0;
  }

  update(t, under) {
    const fog = this.app.scene.fog;
    this.under = under;
    this.mist.begin(fog); this.bub.begin(fog); this.drops.begin(); this.rays.begin();
    this._chalk(t);
    this._splash(t, GV_C.ladder.x - 0.55, GV_C.ladder.z, GV.ladder.splash, 0.55, 60, 11);
    this._splash(t, GV_ME.float[0] + 0.55, GV_ME.float[1] + 0.05, GV.slide + 0.32, 0.7, 80, 21);
    this._dive(t);
    this._plume(t);
    this._entryBubbles(t);
    if (under > 0.01) { this._rays(t, under); this._specks(t, under); }
    this.mist.end(); this.bub.end(); this.drops.end(); this.rays.end();
  }

  // chalk shaken off the bar when it crashes back onto the safety arms
  _chalk(t) {
    const B = GV_C.bench, a = t - (GV.bench.drop + 0.07);
    if (a < 0 || a > 2.2) return;
    for (let i = 0; i < 26; i++) {
      const h = (k) => hash1(i * 13.1 + k * 7.7 + 401), side = i % 2 ? 1 : -1;
      const x = B.x + side * (0.3 + 0.35 * h(1)) + (h(2) - 0.5) * 0.3 * a, y = GV_BAR.arms + 0.02 + 0.25 * (1 - Math.exp(-a * 2)) * h(3) - 0.05 * a, z = B.barZ + (h(4) - 0.5) * 0.2 + (h(5) - 0.5) * 0.3 * a;
      this.mist.push(x, y, z, 0.12 + 0.35 * a * (0.5 + h(6)), h(7) * 6, 0.32 * (1 - MathX.smooth(a, 0.3, 2.2)), 1.0, 0.96, 0.96, 0.94);
    }
  }

  // a small splash: droplets thrown up and out of a ring (2 G), a little mist
  _splash(t, x0, z0, t0, k, n, seed) {
    const a = t - t0;
    if (a < 0 || a > 1.6) return;
    const D = this.drops, w = GV_WATER;
    for (let i = 0; i < n; i++) {
      const h = (j) => hash1(i * 17.3 + j * 3.1 + seed * 101), ang = h(1) * Math.PI * 2, r0 = 0.15 + 0.2 * h(2) * k;
      const vr = (0.6 + 1.6 * h(3)) * k, vy = (1.4 + 3.0 * h(4)) * k * (0.7 + 0.3 * k), ag = a - 0.06 * h(5);
      if (ag < 0) continue;
      const y = w + vy * ag - 0.5 * GV_G * ag * ag;
      if (y < w - 0.02) continue;
      const ca = Math.cos(ang), sa = Math.sin(ang), r = r0 + vr * ag, ag2 = Math.max(0, ag - 0.025), y2 = w + vy * ag2 - 0.5 * GV_G * ag2 * ag2, r2 = r0 + vr * ag2;
      D.push(x0 + ca * r2, y2, z0 + sa * r2, x0 + ca * r, y, z0 + sa * r, 0.95, 0.98, 1.0, 0.55, 0.008 + 0.01 * h(6));
    }
    for (let i = 0; i < 10; i++) {
      const h = (j) => hash1(i * 5.3 + j * 9.7 + seed * 37), ang = h(1) * 6.283, r = (0.2 + 0.5 * h(2)) * k * (0.6 + a);
      this.mist.push(x0 + Math.cos(ang) * r, w + 0.1 + 0.4 * k * h(3) * (1 - Math.exp(-a * 4)), z0 + Math.sin(ang) * r, (0.25 + 0.4 * a) * k, h(4) * 6, 0.35 * (1 - MathX.smooth(a, 0.2, 1.4)), 1.0, 0.94, 0.97, 1.0);
    }
  }

  // the diver's entry at 71 km/h: a crown of spray, the jet that climbs out of the hole behind her, mist, foam
  _dive(t) {
    const a = t - GV_FALL.hit, E = GV_ENTRY, w = GV_WATER, D = this.drops;
    this.foam = null;
    if (a < 0) return;
    if (a < 8) this.foam = [E.x, E.z, 0.6 + 2.2 * (1 - Math.exp(-a / 0.9)), 0.85 * (1 - MathX.smooth(a, 1.0, 8.0))];
    if (a > 3.2) return;
    // the crown: a thin sheet thrown up and out, breaking into drops
    for (let i = 0; i < 760; i++) {
      const h = (j) => hash1(i * 7.13 + j * 2.71 + 911), ang = h(1) * Math.PI * 2, r0 = 0.2 + 0.25 * h(2);
      const vr = 1.2 + 3.0 * h(3) ** 1.5, vy = 2.5 + 5.0 * h(4) ** 0.8, ag = a - 0.04 * h(5);
      if (ag < 0) continue;
      const y = w + vy * ag - 0.5 * GV_G * ag * ag;
      if (y < w - 0.05) continue;
      const ca = Math.cos(ang), sa = Math.sin(ang), r = r0 + vr * ag, ag2 = Math.max(0, ag - 0.03), y2 = w + vy * ag2 - 0.5 * GV_G * ag2 * ag2, r2 = r0 + vr * ag2;
      D.push(E.x + ca * r2, y2, E.z + sa * r2, E.x + ca * r, y, E.z + sa * r, 0.95, 0.98, 1.0, 0.8, 0.016 + 0.02 * h(6));
    }
    // the jet: a column of water and spray climbing out of the collapsing hole (from 0.25 s)
    for (let i = 0; i < 260; i++) {
      const h = (j) => hash1(i * 3.91 + j * 5.17 + 377), ag = a - 0.22 - 0.25 * h(1);
      if (ag < 0) continue;
      const vy = 3.5 + 4.2 * h(2), vr = 0.15 + 0.6 * h(3), ang = h(4) * 6.283;
      const y = w + vy * ag - 0.5 * GV_G * ag * ag;
      if (y < w - 0.05) continue;
      const ca = Math.cos(ang), sa = Math.sin(ang), r = 0.05 + vr * ag, ag2 = Math.max(0, ag - 0.035), y2 = w + vy * ag2 - 0.5 * GV_G * ag2 * ag2, r2 = 0.05 + vr * ag2;
      D.push(E.x + ca * r2, y2, E.z + sa * r2, E.x + ca * r, y, E.z + sa * r, 0.95, 0.98, 1.0, 0.7, 0.014 + 0.02 * h(5));
    }
    // white water: the crown's body and the jet's mass (soft, opaque-ish), then the mist drifting
    for (let i = 0; i < 130; i++) {
      const h = (j) => hash1(i * 11.7 + j * 4.3 + 53), ang = h(1) * 6.283, jet = i < 40;
      const ag = a - (jet ? 0.25 + 0.15 * h(2) : 0.02 * h(2));
      if (ag < 0) continue;
      const vy = jet ? 3.0 + 3.5 * h(3) : 1.6 + 3.2 * h(3), vr = jet ? 0.2 * h(4) : 0.8 + 1.8 * h(4);
      const yb = w + vy * ag - 0.5 * GV_G * ag * ag, y = Math.max(w + 0.05, yb), r = 0.15 + vr * ag;
      const life = 1 - MathX.smooth(ag, 0.2, jet ? 1.1 : 0.9) * (yb < w ? 1 : 0.6);
      this.mist.push(E.x + Math.cos(ang) * r, y, E.z + Math.sin(ang) * r, (jet ? 0.4 : 0.52) + 0.6 * ag, h(5) * 6, 0.9 * life, 1.0, 0.95, 0.98, 1.0);
    }
    for (let i = 0; i < 40; i++) {
      const h = (j) => hash1(i * 6.1 + j * 8.3 + 77), ang = h(1) * 6.283, ag = a - 0.1 * h(2), r = 0.4 + (0.8 + 1.2 * h(3)) * (1 - Math.exp(-ag / 0.8));
      if (ag < 0) continue;
      this.mist.push(E.x + Math.cos(ang) * r, w + 0.15 + 0.9 * h(4) * (1 - Math.exp(-ag / 0.4)), E.z + Math.sin(ang) * r, 0.6 + 0.9 * ag, h(5) * 6, 0.3 * (1 - MathX.smooth(ag, 0.4, 3.0)), 1.0, 0.92, 0.95, 0.97);
    }
  }

  // under water: the air she drags down (a white cavity that breaks into a plume), rising and spreading
  _plume(t) {
    const b0 = t - GV_FALL.hit, E = GV_ENTRY, w = GV_WATER, B = this.bub, rise = 0.45 * Math.SQRT2;
    if (b0 < 0 || b0 > 9) return;
    for (let i = 0; i < 900; i++) {
      const h = (j) => hash1(i * 9.31 + j * 1.77 + 1203);
      // born where her body passed: depth d at the moment her feet got there (plus her body's length above)
      const d = Math.min(GV_DIVER.deep - 0.05, GV_DIVER.deep * h(1) ** 0.7), bb = -Math.log(1 - d / GV_DIVER.deep) * GV_DIVER.deep / GV_FALL.v2 + 0.06 * h(2);
      const age = b0 - bb;
      if (age < 0) continue;
      const sz = 0.025 + 0.11 * h(3) ** 3, vr = rise * (0.6 + 0.8 * h(4)) * (0.6 + 4 * sz);
      const y = w - d - 0.2 * h(5) + vr * Math.max(0, age - 0.15);
      if (y > w - 0.03) continue;
      const spread = (0.08 + 0.25 * h(6)) * (1 + 1.6 * (1 - Math.exp(-age / 1.2))), ang = h(7) * 6.283 + age * (h(8) - 0.5) * 2;
      const wob = 0.03 * Math.sin(age * (7 + 5 * h(9)) + h(10) * 6);
      const life = 1 - MathX.smooth(age, 2.5 + 3 * h(11), 4 + 4 * h(11));
      if (life <= 0) continue;
      const dense = 1 + 1.4 * (1 - MathX.smooth(age, 0.1, 0.9));       // the first moment: a near-solid white column
      B.push(E.x + Math.cos(ang) * spread + wob, y, E.z + Math.sin(ang) * spread, sz * dense * 1.6, h(12) * 6, 0.85 * life, 1.0, 0.92, 0.98, 1.0);
    }
    // a thin string of bubbles from her nose as she rises
    for (let i = 0; i < 40; i++) {
      const h = (j) => hash1(i * 4.7 + j * 2.9 + 77), born = 1.2 + 3.2 * h(1), age = b0 - born;
      if (age < 0 || age > 3) continue;
      const d = gvDiverAt(GV_FALL.hit + born, this._o || (this._o = {}));
      const y = d.y + 1.6 + rise * 1.2 * age;
      if (y > w - 0.03) continue;
      B.push(d.x + 0.04 * Math.sin(age * 9 + i), y, d.z + 0.1 + 0.04 * Math.cos(age * 7 + i), 0.02 + 0.03 * h(2), 0, 0.8, 1.0, 0.92, 0.98, 1.0);
    }
  }

  // bubbles around you when you go in, and a few escaping from your nose under water
  _entryBubbles(t) {
    const cam = this.app.camera, B = this.bub, w = GV_WATER, rise = 0.45 * Math.SQRT2;
    for (const [t0, n, seed] of [[GV.slide + 0.32, 140, 3], [GV.under, 90, 9]]) {
      const a = t - t0;
      if (a < 0 || a > 3) continue;
      const o = GV_ME.float;
      for (let i = 0; i < n; i++) {
        const h = (j) => hash1(i * 5.9 + j * 3.3 + seed * 211), ang = h(1) * 6.283, r = 0.15 + 0.8 * h(2);
        const age = a - 0.15 * h(3); if (age < 0) continue;
        const x = (seed === 3 ? o[0] + 0.3 : cam.position.x) + Math.cos(ang) * r, z = (seed === 3 ? o[1] : cam.position.z) + Math.sin(ang) * r - 0.4;
        const y = w - 0.9 - 0.8 * h(4) + rise * (0.8 + 1.5 * h(5)) * age;
        if (y > w - 0.03) continue;
        B.push(x + 0.04 * Math.sin(age * 8 + i), y, z, 0.02 + 0.07 * h(6) ** 2, 0, 0.8 * (1 - MathX.smooth(age, 1.5, 3)), 1.0, 0.92, 0.98, 1.0);
      }
    }
    // three little bursts from your nose (you are holding your breath)
    for (const t0 of [GV.under + 1.8, GV.under + 3.1]) {
      const a = t - t0;
      if (a < 0 || a > 2) continue;
      for (let i = 0; i < 7; i++) {
        const h = (j) => hash1(i * 3.3 + j * 7.1 + t0 * 13), age = a - 0.05 * i; if (age < 0) continue;
        B.push(cam.position.x + (h(1) - 0.5) * 0.06, cam.position.y - 0.12 + rise * 1.3 * age, cam.position.z - 0.25 - 0.1 * h(2), 0.012 + 0.018 * h(3), 0, 0.9, 1.0, 0.95, 1.0, 1.0);
      }
    }
  }

  // shafts of sunlight slanting down through the water (refracted: steeper than the sun), flickering with the waves
  _rays(t, k) {
    const R = this.rays, w = GV_WATER, dx = 0.42, dz = -0.18;
    for (let i = 0; i < 28; i++) {
      const h = (j) => hash1(i * 4.13 + j * 6.7 + 57), sx = -10 + 12 * h(1), sz = -29 + 11 * h(2), L = 3.5 + 2 * h(3);
      const fl = 0.5 + 0.5 * Math.sin(t * (1.1 + 1.3 * h(4)) + h(5) * 6), wd = 0.18 + 0.4 * h(6), a = 0.05 * k * (0.4 + 0.6 * fl);
      for (let s = 0; s < 3; s++) {
        const u0 = s / 3, u1 = (s + 1) / 3;
        R.push(sx + dx * L * u0, w - 0.05 - L * u0, sz + dz * L * u0, sx + dx * L * u1, w - 0.05 - L * u1, sz + dz * L * u1, 0.7, 0.95, 1.0, a * (1 - u0 * 0.8), wd);
      }
    }
  }

  // specks drifting in the water near you (they give the water depth): a 6 m tile of them repeated around you
  _specks(t, k) {
    const cam = this.app.camera, B = this.mist, S = 6, cx = Math.floor(cam.position.x / S) * S, cz = Math.floor(cam.position.z / S) * S;
    for (let i = 0; i < 160; i++) {
      const h = (j) => hash1(i * 2.17 + j * 9.1 + 5), y = GV_WATER - 0.2 - 3.5 * h(3) + 0.05 * Math.sin(t * 0.4 + i);
      for (const ox of [-S, 0, S]) for (const oz of [-S, 0, S]) {
        const X = cx + ox + h(1) * S + 0.1 * Math.sin(t * 0.3 + i), Z = cz + oz + h(2) * S;
        if (Math.abs(X - cam.position.x) > 4 || Math.abs(Z - cam.position.z) > 4) continue;
        B.push(X, y, Z, 0.012 + 0.015 * h(5), 0, 0.35 * k, 1.0, 0.85, 0.95, 0.95);
      }
    }
  }
}
