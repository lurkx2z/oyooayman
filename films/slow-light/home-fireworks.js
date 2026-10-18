/* =====================================================================
   HOME · FIREWORKS — six fireworks over the far shore of the harbour, 2 km north of the balcony. Each is placed by the
   moment you SEE it burst (script.js: SL.f1 … SL.f6; the bangs SL.b1 … SL.b6 are heard 2000 m / 343 m/s after it
   really burst, and the light speed c is set so the flash arrives when the captions need it).
   What slowing light does to a burst you watch:
     · every spark's light is Doppler-shifted, s = 1 / (1 + v·n / c) (n: you → the burst): sparks flying towards you
       turn blue, sparks flying away turn red; it barely shows at the first bursts (c ≈ 4 km/s) and is strong at the
       last two (c ≈ 250 m/s, sparks at ≈ 80 m/s)
     · you see each spark at its own age τ, with τ + (r(τ)·n) / c = t − f: the near half of a shell grows faster than
       the far half, so the bursts look egg-shaped once light is slow
   All particles are drawn as soft additive puffs, with their reflections in the water below. Pure function of t.
   ===================================================================== */

const SL_FW_EYE = [0.2, 1.62, -3.7];
function slFwBursts() {
  const Y = SL_HOME.water, B = [];
  const add = (f, x, h, z, R, col, n, o = {}) => B.push(Object.assign({ f, x, y: Y + h, z, R, col, n, seed: B.length + 1, life: 2.6, rise: 1.9, crackle: 0 }, o));
  add(SL.f1, -50, 205, -2050, 100, [1.0, 0.62, 0.25], 300);                        // gold
  add(SL.f2, 110, 220, -2020, 105, [0.35, 0.95, 0.45], 300);                       // green
  add(SL.f3, -130, 200, -2060, 100, [1.0, 0.3, 0.42], 300, { crackle: 0.5 });      // red, crackling
  add(SL.fb4, 20, 235, -2030, 115, [0.95, 0.95, 1.0], 320);                        // white: flash and bang together
  add(SL.f5, -90, 215, -2010, 110, [1.0, 0.75, 0.3], 300, { crackle: 0.4 });       // gold willow
  add(SL.f6, 0, 245, -2040, 115, [0.85, 0.85, 1.0], 280, { life: 3.2 });            // the big one: three shells
  add(SL.f6 + 0.18, -105, 215, -2000, 95, [1.0, 0.45, 0.35], 240, { life: 3.0, rise: 0 });
  add(SL.f6 + 0.34, 110, 225, -2080, 100, [0.55, 0.8, 1.0], 240, { life: 3.0, rise: 0 });
  return B;
}

function slBuildFireworks(O) {
  const B = slFwBursts();
  // each burst: its sparks' directions (an even sphere, jittered) and speeds
  for (const b of B) {
    b.dirs = []; b.v0 = [];
    for (let i = 0; i < b.n; i++) {
      const y = 1 - 2 * (i + 0.5) / b.n, r = Math.sqrt(1 - y * y), a = i * 2.39996 + slR(i, b.seed) * 0.3;
      const j = 0.06;
      b.dirs.push(slN3([Math.cos(a) * r + (slR(i, b.seed + 7) - 0.5) * j, y + (slR(i, b.seed + 9) - 0.5) * j, Math.sin(a) * r + (slR(i, b.seed + 11) - 0.5) * j]));
      // m/s: with drag K the shell reaches ≈ R in 1.3 s; real stars leave a shell at ≈ 100–150 m/s (kept under 0.6 c)
      b.v0.push(Math.min(0.6 * slC(b.f), b.R * 1.0 / (1 - Math.exp(-1.0 * 1.3)) * (0.9 + 0.2 * slR(i, b.seed + 13))));
    }
  }
  const K = 1.0, G = 9;                                             // drag (1/s), sag (m/s²) once the sparks slow
  const disp = (v0, τ) => v0 * (1 - Math.exp(-K * τ)) / K;             // distance along the spark's direction
  const vel = (v0, τ) => v0 * Math.exp(-K * τ);
  const api = {
    bursts: B,
    // how bright the bursts light the sky right now (0 … 1), for the flash light and the sky
    flashAt(t) { let f = 0; for (const b of B) { const u = t - b.f; if (u > -0.05 && u < 1.2) f = Math.max(f, Math.exp(-u * 3.2) * (u > 0 ? 1 : 0) + 0.25 * Math.exp(-u * 1.2) * (u > 0 ? 1 : 0)); } return Math.min(1, f); },
    draw(t, puffs, eye) {
      const Y = SL_HOME.water;
      for (const b of B) {
        const u = t - b.f;
        if (u < -b.rise || u > b.life + 0.4) continue;
        const c = slC(b.f), n = slN3([b.x - eye[0], b.y - eye[1], b.z - eye[2]]);
        const put = (x, y, z, size, a, r, g, bb) => {
          puffs.add(x, y, z, size, a, r, g, bb);
          puffs.add(x, 2 * Y - y, z, size * 1.1, a * 0.22, r, g, bb);                 // its reflection in the water
        };
        // the rocket climbing (seen before the burst)
        if (u < 0 && b.rise > 0) {
          const q = 1 + u / b.rise, h = 1 - (1 - q) * (1 - q);
          for (let k = 0; k < 8; k++) {
            const hk = Math.max(0, h - k * 0.025);
            put(b.x + Math.sin(hk * 9 + b.seed) * 2, Y + 6 + (b.y - Y - 6) * hk, b.z, 4.5 - k * 0.4, (0.9 - k * 0.1) * (0.6 + 0.4 * q), 1, 0.78, 0.5);
          }
          continue;
        }
        // the flash at the heart of the burst
        if (u < 0.5) put(b.x, b.y, b.z, 70 * (1 - u * 1.6), 0.9 * Math.exp(-u * 7), 1, 0.92, 0.8);
        for (let i = 0; i < b.n; i++) {
          const d = b.dirs[i], v0 = b.v0[i], dn = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
          // the age this spark is seen at: τ + disp(τ)·dn / c = u (a few fixed-point steps; light only ever lags)
          let τ = u;
          for (let it = 0; it < 8; it++) τ = Math.max(0, u - disp(v0, τ) * dn / c);
          if (τ > b.life) continue;
          const D = disp(v0, τ), sag = G * Math.max(0, τ - 0.5) ** 2 * 0.5;
          const x = b.x + d[0] * D, y = b.y + d[1] * D - sag, z = b.z + d[2] * D;
          // the colour this spark's light arrives with
          const s = 1 / Math.max(0.05, 1 + vel(v0, τ) * dn / c);
          const life = τ < 0.12 ? 1.6 : Math.max(0, 1 - Math.pow(τ / b.life, 2.2));
          const tw = b.crackle > 0 && τ > b.life * 0.5 ? (hash2(i + Math.floor(τ * 18) * 977, b.seed) > 0.5 ? 1.6 : 0.2) : 1;
          const white = Math.exp(-τ * 5);
          let rgb = [slLerp(b.col[0], 1, white), slLerp(b.col[1], 1, white), slLerp(b.col[2], 1, white)];
          rgb = slShiftRGB(rgb, s); const bs = Math.min(2.5, s);
          const a = 0.95 * life * tw * bs;
          put(x, y, z, 9.0, a, rgb[0], rgb[1], rgb[2]);
          // its trail: where it was a moment earlier, dimmer
          for (let k = 1; k <= 3; k++) {
            const τk = Math.max(0, τ - k * 0.07), Dk = disp(v0, τk), sk = G * Math.max(0, τk - 0.5) ** 2 * 0.5;
            put(b.x + d[0] * Dk, b.y + d[1] * Dk - sk, b.z + d[2] * Dk, 7 - k * 1.2, a * (0.55 - k * 0.13), rgb[0], rgb[1], rgb[2]);
          }
        }
      }
    },
  };
  return api;
}
