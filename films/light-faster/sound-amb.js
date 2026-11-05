/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: lfPlaces). The beds sit well under the score (mix.js; the
   owner's rule: the music clearly leads, beds about 10 dB under it). In the slow minutes (ten times slower) every bed
   is lowered and darkened, as if the world itself were slowed down; from the beach on they are at real speed.
     the train      inside: the car's rumble (with its speed), the cabin's air, the lights' hum while the mains last;
                    outside: the sea against the wall, a little wind, the wire's hum
     the bay        the sea, the city across the water (gone with the grid); on the hospital's roof the wind and the
                    plant's hum
     the hospital   the air handling and the MRI's cold head (its pump chuffing) while the mains last; afterwards a
                    hollow quiet, the generators far off
     the stadium    40,000 people: a roar under the floodlights, a frightened murmur in the dark
     the mountain   wind round the dome, lower inside
     the road       crickets, the sea far off
     the beach      the surf, the party's murmur (quieter as the night goes on), the wind; at 9:23 only the surf
   ===================================================================== */

lfSound('amb', 'beds', function (ctx, bus, K) {
  const fx = K.fx, F = lfFilmAt, grid = F(LFP.sGrid), stad = F(LFP.sGrid + LF_STAD_D);
  // (the envelopes the beds read per sample, sampled once at 200 Hz)
  const mains = lfCurve((t) => lfGrid(lfStoryAt(t), 0.02)), hosp = lfCurve((t) => lfHospital(lfStoryAt(t))), trainV = lfCurve((t) => lfTrainV(lfStoryAt(t)) / LFP.train.v);
  const stadG = lfCurve((t) => lfGrid(lfStoryAt(t), LF_STAD_D)), genFar = lfCurve((t) => lfEv(lfStoryAt(t), 15.5, 16.5));
  const surf = (t) => 0.45 + 0.55 * Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * (t / 8.3 + 0.2 * Math.sin(t * 0.11))), 2);
  for (const p of lfPlaces()) {
    const a = p.t0, b = p.t1 + 0.06, m = p.shot.mode;
    if (b - a < 0.05 || a > LF.end + 1) continue;
    const q = lfRateAt(a + 0.01) < 0.5 ? 0.45 : 1, fi = 0.04, fo = 0.04, end = (t) => (t > LF.end - 0.02 ? 0 : 1);
    switch (p.where) {
      case 'trainIn': {
        lfBed(K, a, b, { colour: 'brown', f: [['lp', 210 * q]], vol: 0.32, am: 0.15, wr: 0.5, env: (u, t) => 0.18 + 0.82 * trainV(t), fi, fo });
        lfBed(K, a, b, { colour: 'pink', f: [['bp', 650 * q, 0.6], ['lp', 1700 * q]], vol: 0.11, am: 0.25, env: (u, t) => (0.25 + 0.75 * trainV(t)) * end(t), fi, fo });
        // (the lights and the air: a hum while the mains last; the battery lights' inverter after)
        lfTone(K, a, b - a, 100 * q, [[1, 0.6], [2, 1], [3, 0.4], [5, 0.15]], (u, t) => mains(a + t) * Math.min(1, t / fi, (b - a - t) / fo), { vol: 0.02, pan: 0.3 });
        break;
      }
      case 'trainOut': {
        lfBed(K, a, b, { colour: 'pink', f: [['bp', 520 * q, 0.5], ['lp', 1500 * q]], vol: 0.22, am: 0.5, wr: 0.25, env: (u, t) => surf(t), fi, fo });
        lfBed(K, a, b, { colour: 'brown', f: [['lp', 420 * q]], vol: 0.14, am: 0.5, wr: 0.3, fi, fo });
        lfBed(K, a, b, { colour: 'brown', f: [['lp', 160 * q]], vol: 0.2, am: 0.1, env: (u, t) => 0.15 + 0.85 * trainV(t), fi, fo });
        break;
      }
      case 'bay': {
        if (m === 'roof') {
          lfBed(K, a, b, { colour: 'pink', f: [['bp', 380 * q, 0.5], ['lp', 1200 * q]], vol: 0.24, am: 0.6, wr: 0.35, fi, fo });
          lfTone(K, a, b - a, 60 * q, [[1, 1], [2, 0.6], [3, 0.3], [4, 0.2], [6, 0.1]], (u, t) => hosp(a + t) * Math.min(1, t / fi, (b - a - t) / fo), { vol: 0.04, pan: -0.4 });
          lfBed(K, a, b, { colour: 'pink', f: [['bp', 300 * q, 0.7], ['lp', 900 * q]], vol: 0.1, am: 0.2, env: (u, t) => mains(t), fi, fo });   // the city below
        } else {
          lfBed(K, a, b, { colour: 'pink', f: [['bp', 480 * q, 0.5], ['lp', 1400 * q]], vol: 0.2, am: 0.5, wr: 0.25, env: (u, t) => surf(t), fi, fo });
          lfBed(K, a, b, { colour: 'pink', f: [['bp', 260 * q, 0.6], ['lp', 800 * q]], vol: 0.12, am: 0.25, env: (u, t) => 0.2 + 0.8 * mains(t), fi, fo });
        }
        break;
      }
      case 'hospital': {
        lfBed(K, a, b, { colour: 'brown', f: [['lp', 260 * q]], vol: 0.16, am: 0.1, fi, fo });
        lfBed(K, a, b, { colour: 'pink', f: [['bp', 900 * q, 0.8], ['lp', 2600 * q]], vol: 0.1, am: 0.1, env: (u, t) => 0.15 + 0.85 * hosp(t), fi, fo });
        lfTone(K, a, b - a, 50 * Math.sqrt(q), [[1, 0.4], [2, 1], [4, 0.3], [6, 0.12]], (u, t) => hosp(a + t) * Math.min(1, t / fi, (b - a - t) / fo), { vol: 0.03, pan: 0.5 });
        // the MRI's cold head: its helium pump chuffs once a second (stretched in the slow minutes), while it has power
        if (m === 'mriA' || m === 'mriB' || m === 'quench') {
          const k = lfSlowK(a), per = 1.15 * k;
          for (let t = a + 0.2; t < b - 0.1; t += per) { const g = hosp(t); if (g < 0.05) continue;
            const n = Math.ceil(0.35 * k * K.sr), y = lfNoise(fx, n, 'pink'); for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(Math.sin(Math.PI * u), 0.6) * Math.exp(-u * 2.5); }
            LFX.bq(y, 'bp', 520 / k, 1.2, K.sr); K.put(y, t, { vol: 0.05 * g, norm: true, pan: -0.5 }); }
        }
        // after the grid: the generators far off
        lfBed(K, a, b, { colour: 'brown', f: [['lp', 120]], vol: 0.12, am: 0.2, env: (u, t) => genFar(t), fi, fo });
        break;
      }
      case 'stadium': {
        // the crowd: a roar under the lights (pitched down in the slow minutes); a frightened murmur in the dark
        const live = (t) => (t < stad ? 1 : 0.32 + 0.68 * Math.exp(-(t - stad) / 2.5)), late = m === 'stadC';
        lfBed(K, a, b, { colour: 'pink', f: [['bp', (late ? 700 : 820) * q, 0.45], ['lp', 3200 * q]], vol: late ? 0.13 : 0.34, am: 0.45, wr: 0.6, env: (u, t) => (late ? 1 : live(t)), fi, fo });
        lfBed(K, a, b, { colour: 'pink', f: [['bp', 1700 * q, 0.9], ['lp', 4200 * q]], vol: late ? 0.05 : 0.16, am: 0.8, wr: 1.4, env: (u, t) => (late ? 0.7 : live(t)), fi, fo });
        lfBed(K, a, b, { colour: 'brown', f: [['lp', 200 * q]], vol: 0.14, am: 0.2, fi, fo });
        if (!late) lfTone(K, a, b - a, 100 * q, [[1, 0.5], [2, 1], [3, 0.5], [4, 0.25]], (u, t) => stadG(a + t) * Math.min(1, t / fi, (b - a - t) / fo), { vol: 0.03, pan: 0.6 });
        break;
      }
      case 'obs': {
        const ins = m !== 'obsOut', w = q < 1 ? 0.5 : 1;
        lfBed(K, a, b, { colour: 'brown', f: [['lp', (ins ? 300 : 520) * w]], vol: ins ? 0.14 : 0.24, am: 0.7, wr: 0.18, fi, fo });
        lfBed(K, a, b, { colour: 'pink', f: [['bp', (ins ? 700 : 1100) * w, 1.4], ['lp', 2400 * w]], vol: ins ? 0.04 : 0.09, am: 0.9, wr: 0.3, fi, fo });
        break;
      }
      case 'road': {
        lfBed(K, a, b, { colour: 'pink', f: [['bp', 420 * q, 0.5], ['lp', 1100 * q]], vol: 0.12, am: 0.4, wr: 0.2, fi, fo });
        // crickets (slowed: a lower, slower trill)
        const n = Math.ceil((b - a) * K.sr), y = new Float32Array(n), f0 = 4300 * Math.sqrt(q), pr = 14 * q;
        for (let i = 0; i < n; i++) { const t = i / K.sr, tr = Math.max(0, Math.sin(2 * Math.PI * pr * t)), ch = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.45 * t + 1); y[i] = Math.sin(2 * Math.PI * f0 * t) * tr * tr * (ch > 0.35 ? 1 : 0.1) * Math.min(1, t / fi, (b - a - t) / fo); }
        K.put(y, a, { vol: 0.012, norm: true, pan: -0.5 });
        break;
      }
      default: {   // the beach
        const s0 = lfStoryAt(a + 0.01), party = MathX.clamp(1 - (s0 - 100) / 160, 0, 1), near = ['fireA', 'fireB', 'colA', 'colB', 'heat', 'starsB'].includes(m) ? 1 : 0.6;
        lfBed(K, a, b, { colour: 'pink', f: [['bp', 600, 0.45], ['lp', 1700]], vol: m === 'waves' ? 0.3 : 0.22, am: 0.4, wr: 0.2, env: (u, t) => surf(t) * end(t), fi, fo });
        lfBed(K, a, b, { colour: 'brown', f: [['lp', 300]], vol: 0.12, am: 0.6, wr: 0.15, env: (u, t) => end(t), fi, fo });
        if (party > 0.03 && m !== 'stopX') lfBed(K, a, b, { colour: 'pink', f: [['bp', 480, 0.8], ['lp', 1600]], vol: 0.12 * party * near, am: 0.9, wr: 1.8, env: (u, t) => end(t), fi, fo });   // voices, low
        break;
      }
    }
  }
});
