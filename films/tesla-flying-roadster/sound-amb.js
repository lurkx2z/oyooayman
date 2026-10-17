/* =====================================================================
   SOUND · AMBIENCE — one bed per place, cut with the picture (a few ms of fade against clicks):
   the test site at dusk (desert wind, the floodlights' mains hum, the crowd behind the barrier, crickets once it is
   dark), the muffled slow-motion beds, the sky (wind over the canopy, the plane's engine following its airspeed), the
   helicopter, and the cabin in the last shot.
   trCrowd (a crowd: murmur, and a cheer when env rises) is shared with sound-sfx.js (this file loads first).
   ===================================================================== */

// a crowd of n voices from t0 to t1: band-passed noise opened and closed at syllable rate; env(u, t) its level,
// cheer(t) 0…1 how much of it is a shout (brighter, louder, the syllables blur into a roar)
function trCrowd(K, t0, t1, o = {}) {
  const { fx, sr, r } = K, d = t1 - t0; if (d <= 0.05) return;
  const n = Math.ceil(d * sr), L = fx.arr(d), R = fx.arr(d), nv = o.n || 12;
  for (let v = 0; v < nv; v++) {
    const z = trNoise(fx, n, 'pink'), f = r.range(380, 950), rate = r.range(3.2, 6), ph = r.range(0, 6.3), pan = r.range(-0.8, 0.8);
    GBX.bq(z, 'bp', f, 2.2, sr); GBX.bq(z, 'bp', f * 2.3, 1.4, sr);
    const gl = Math.sqrt(0.5 * (1 - pan)), gr = Math.sqrt(0.5 * (1 + pan));
    for (let i = 0; i < n; i++) {
      const t = i / sr, ch = o.cheer ? o.cheer(t0 + t) : 0, syl = Math.max(0, Math.sin(2 * Math.PI * rate * t + ph + 1.5 * Math.sin(t * 1.7 + v)));
      const s = z[i] * ((1 - ch) * syl * (0.6 + 0.4 * Math.sin(t * 0.8 + v)) + ch * 1.6);
      L[i] += s * gl; R[i] += s * gr;
    }
  }
  const sh = trNoise(fx, n, 'white'); GBX.bq(sh, 'bp', 2400, 0.8, sr);                    // the shout's hiss
  for (let i = 0; i < n; i++) {
    const t = i / sr, ch = o.cheer ? o.cheer(t0 + t) : 0, e = (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / (o.fi ?? 0.05), (d - t) / (o.fo ?? 0.05));
    L[i] = (L[i] + 0.5 * ch * sh[i]) * e; R[i] = (R[i] + 0.5 * ch * sh[(i + 977) % n]) * e;
  }
  GBX.bq(L, 'lp', 3600, 0.7, sr); GBX.bq(R, 'lp', 3600, 0.7, sr);
  return K.putLR(L, R, t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}

trSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr, r } = K, A = TR, C = trRunClock(), kc = trKickClock(); trExClock();
  const open = K.verb('open', 2.2, { bright: 0.5, damp: 3.2, wet: 0.35, seed: 31 });
  const runExit = C.inv(TR_DEMO_EXIT), kickLand = kc.inv(kc.launchT + kc.flight);
  // ---- the test site: desert wind, the floodlights' 60 Hz hum, crickets after dark (shared by every site shot)
  const site = (t0, t1, o = {}) => {
    trBed(K, t0, t1, { colour: 'pink', f: [['bp', 480, 0.5], ['lp', 1700]], vol: 0.11 * (o.wind ?? 1), am: 0.5, wr: 0.25, env: o.env });
    trBed(K, t0, t1, { colour: 'brown', f: [['lp', 220]], vol: 0.07, am: 0.3, env: o.env });
    trTone(K, t0, t1 - t0, 60, [[1, 0.6], [2, 1], [3, 0.5], [4, 0.3], [6, 0.12]], (u, t) => Math.min(1, t / 0.05, (t1 - t0 - t) / 0.05) * (o.env ? o.env(u, t0 + t) : 1), { vol: 0.012 * (o.hum ?? 1), pan: 0.3 });
    if (o.night) {   // crickets: a ringing band switched at the chirp rate, two of them, apart
      for (const [fq, rate, pan] of [[4300, 2.3, -0.5], [4900, 1.7, 0.45]]) {
        const d = t1 - t0, n = Math.ceil(d * sr), y = trNoise(fx, n, 'white'); GBX.bq(y, 'bp', fq, 7, sr); GBX.bq(y, 'bp', fq, 5, sr);
        for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (Math.sin(2 * Math.PI * rate * t) > 0.3 ? 1 : 0) * (0.5 + 0.5 * Math.sign(Math.sin(2 * Math.PI * 52 * t))) * Math.min(1, t / 0.05, (d - t) / 0.05) * (o.env ? o.env(t / d, t0 + t) : 1); }
        K.put(y, t0, { vol: 0.018 * (o.night || 1), norm: true, pan });
      }
    }
  };
  // a slow-motion bed: the world muffled down to a low breath
  const slow = (t0, t1, v = 0.12) => trBed(K, t0, t1, { colour: 'brown', f: [['lp', 260], ['peak', 80, 0.8, 4]], vol: v, am: 0.35, wr: 0.3, fi: 0.15, fo: 0.08 });

  // title and the start line: dusk, the crowd waiting behind the barrier
  site(-1, C.tLoop, { env: (u, t) => t < A.hero ? 0.8 : 1 });
  trCrowd(K, -1, C.tLoop, { vol: 0.055, room: open, wet: 0.6, env: (u, t) => (t < A.hero ? 0.6 : 0.85) + (t > (A.go + 0.25) ? 0.3 : 0), cheer: (t) => 0.5 * MathX.smooth(t, A.go + 0.25, A.go + 1.6) });
  // the loop and the ceiling in slow motion; the replay slower still
  slow(C.tLoop, A.replay, 0.1);
  slow(A.replay, A.plane, 0.13);

  // ---- the sky: wind over the canopy (brighter and louder with airspeed), the plane's engine (its pitch with the
  //      speed), the buffet of the stall, and the whistle of the fall
  {
    const t0 = A.plane, t1 = A.suck, d = t1 - t0, n = Math.ceil(d * sr);
    for (let k = 0; k < 2; k++) {
      const y = trNoise(fx, n, 'pink'), w = fx.wander(0.4);
      for (let i = 0; i < n; i++) { const t = t0 + i / sr, v = trSkyV(t) / 69; y[i] *= (0.35 + 0.65 * v * v) * (0.8 + 0.2 * w(i / sr + 5 * k)) * Math.min(1, i / (0.04 * sr), (n - i) / (0.06 * sr)); }
      const curve = new Float32Array(Math.ceil(d * 30)); for (let j = 0; j < curve.length; j++) curve[j] = 300 + 1600 * Math.pow(trSkyV(t0 + j / 30) / 69, 1.5);
      trSweepPut(K, y, t0, 'bandpass', 0.8, curve, { vol: 0.13, pan: k ? 0.35 : -0.35 });
    }
    // the engine: a six-cylinder's firing note (≈ 135 Hz at 2,700 rpm) over the two-blade prop's 90 Hz beat, a little
    // throatier as the speed bleeds
    const y = fx.arr(d); let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = t0 + i / sr, v = trSkyV(t), f = 135 * (0.75 + 0.25 * v / 69) * (t > A.stall ? 0.92 : 1);
      ph += 2 * Math.PI * f / sr;
      const pulse = Math.pow(Math.max(0, Math.sin(ph)), 4) - 0.2 + 0.25 * Math.sin(2 * ph + 0.4) + 0.15 * Math.sin(3 * ph) + 0.35 * Math.sin(ph * 2 / 3) + 0.15 * Math.sin(ph * 4 / 3);
      const far = t > A.fall ? 1 - 0.6 * MathX.smooth(t, A.fall, A.suck) : 1;
      y[i] = pulse * far * Math.min(1, i / (0.05 * sr), (n - i) / (0.05 * sr));
    }
    GBX.bq(y, 'lp', 2200, 0.7, sr); GBX.bq(y, 'peak', 270, 1, sr, 3);
    K.put(y, t0, { vol: 0.07, norm: true, pan: -0.1, room: open, wet: 0.3 });
    // the stall's buffet: the airflow breaking away from the wing shakes it (a rough, low rattle)
    trBed(K, A.stall - 0.35, A.fall + 1.2, { colour: 'brown', f: [['bp', 70, 0.8], ['lp', 400]], vol: 0.18, am: 0.9, wr: 9, fi: 0.3, fo: 0.6, env: (u) => Math.sin(Math.PI * Math.min(1, u * 1.4)) });
  }

  // ---- the ceiling of the ramp, after dark (the suction explainer): the site at night, quieter, the crowd gone
  site(A.suck, A.drop, { wind: 0.7, hum: 1.3, night: 1 });
  slow(A.drop, A.brk, 0.11);                                                        // the slow-motion fall
  site(A.brk, A.hover, { wind: 0.7, hum: 1.3, night: 1 });
  // ---- the pad (the hover): the open desert at night
  site(A.hover, A.heli, { wind: 1, hum: 0.5, night: 1.2 });
  // ---- the helicopter: rotor slap at blade-pass rate, the turbine's whine, its downwash
  {
    const t0 = A.heli, d = A.hop - t0, n = Math.ceil(d * sr), y = trNoise(fx, n, 'pink');
    GBX.bq(y, 'lp', 900, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = i / sr, bp = (t * 21.5) % 1; y[i] *= (0.25 + Math.exp(-bp / 0.09) * 1.4) * Math.min(1, t / 0.05, (d - t) / 0.06); }
    K.put(y, t0, { vol: 0.2, norm: true, pan: -0.2, room: open, wet: 0.5 });
    trTone(K, t0, d, 2650, [[1, 1], [1.5, 0.3], [2, 0.25]], (u, t) => Math.min(1, t / 0.05, (d - t) / 0.06), { vol: 0.012, pan: -0.2 });
    trBed(K, t0, A.hop, { colour: 'brown', f: [['lp', 320]], vol: 0.12, am: 0.4, wr: 1.2 });
  }
  // ---- the kick lane: dusk again, the crowd; they roar when it lands
  site(A.hop, A.real, { wind: 1, hum: 0.8 });
  trCrowd(K, A.hop, A.real, { vol: 0.07, room: open, wet: 0.6, env: (u, t) => 0.8 + 0.4 * MathX.smooth(t, kickLand, kickLand + 0.4) - 0.5 * MathX.smooth(t, A.real - 1.2, A.real), cheer: (t) => 0.25 * MathX.smooth(t, kc.inv(kc.launchT) - 0.2, kc.inv(kc.launchT) + 0.3) + 0.75 * MathX.smooth(t, kickLand, kickLand + 0.3) * (1 - 0.6 * MathX.smooth(t, kickLand + 2.2, A.real)) });
  // ---- the verdict: the car under the lights, the site emptying
  site(A.real, A.pov, { wind: 0.6, hum: 1.4, night: 0.8 });
  trCrowd(K, A.real, A.pov, { vol: 0.03, room: open, wet: 0.8, n: 6, env: (u) => 1 - 0.6 * u });
  // ---- the driver's seat: the cabin (a closed, low room), the wind outside muffled, the road through the tyres
  trBed(K, A.pov, A.end + 0.1, { colour: 'brown', f: [['lp', 380], ['peak', 110, 0.9, 5]], vol: 0.14, am: 0.3, wr: 0.6, fi: 0.04 });
  trBed(K, A.pov, A.end + 0.1, { colour: 'pink', f: [['bp', 900, 0.6], ['lp', 2000]], vol: 0.03, am: 0.5, wr: 0.4 });
});
