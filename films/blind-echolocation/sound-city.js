/* =====================================================================
   SOUND — scene 9 (the city becomes a wall of sound). Every source sits where the picture puts it and is heard from
   where she is: her ears walk the south pavement (z 9.5), the road on her left, the shopfronts 2.5 m to her right.
     traffic     every car in city.js's traffic list (the same pure positions as the picture): tyres and engine, louder
                 and brighter as it nears, a Doppler drop as it passes; the bus on "Engines" (a diesel's growl); two
                 cars idling in the side street; a far city wash under everything
     the street  one acoustic space: the shopfronts beside her answer ≈ 15 ms after a sound, the far facades ≈ 125 ms
     people      the café pair talking (synthesised syllables, not words, on the same timing as their mouths), cups;
                 the walkers' own footsteps; distant construction on the far side
     her         her steps, the cane's tip on the slabs and then on the tactile domes; her clicks (I5: the echo is
                 there but the street covers it; I7: the wall beside her answers, then the side street does not)
     the signal  the accessible pedestrian signal: a locator tone once a second from each pole (audible only close
                 to it, as real ones are), the button's confirmation, the walk phase's rapid tick
     music       a quiet walking pulse out of the lab's silence; a clouded chord under "mask"; in the words-free gap the
                 street steps back, the signal comes forward, and a warm chord carries her across
   ===================================================================== */
const BE_CITY_ROOM = { size: [400, 120, 24], rt60: 1.0, absorb: 0.45, bright: 0.55, damp: 3.5, seed: 94 };
const _beCityBox = (x, y, z) => [x + 200, y, z + 12];   // the street as a box: the two facade lines are z = ±12

// her ears (x, z): the walk along the pavement, the corner, two steps to the pole, the crossing
function beCityEar(t) {
  const B = BE, P = BE_CITY.path;
  if (t < B.iStop) return { x: beCityHerX(t), z: P };
  const r0 = B.iReach[0] - 1.1, r1 = B.iReach[0] - 0.05, [c0, c1] = B.iCross;
  if (t < r0) return { x: 28.6, z: P };
  if (t < r1) { const k = MathX.smooth(t, r0, r1); return { x: MathX.lerp(28.6, 29.0, k), z: MathX.lerp(P, 9.18, k) }; }
  if (t < c0) return { x: 29.0, z: 9.18 };
  const k = BE_CROSS_EASE(MathX.ramp(t, c0, c1)); return { x: MathX.lerp(29.0, 41.6, k), z: MathX.lerp(9.18, P, k) };
}
// gain and equal-power pan of a source at (x, z) for a listener facing +x (+z is her right)
function _beCityPlace(x, z, E, ref = 4, pw = 1.1) {
  const dx = x - E.x, dz = z - E.z, d = Math.sqrt(dx * dx + dz * dz + 0.3), pan = MathX.clamp(dz / d, -1, 1) * 0.85, a = (pan + 1) * Math.PI / 4;
  return { d, g: Math.pow(ref / Math.max(d, ref), pw), gl: Math.cos(a), gr: Math.sin(a), pan };
}
// an engine's waveform over two firing cycles (with the half-order irregularity real engines have)
function _beEngineTab(r, tilt, nh, half = 0.25) {
  const T = new Float32Array(2048), ph = []; for (let k = 1; k <= 2 * nh; k++) ph.push(r.range(0, 6.283));
  for (let i = 0; i < 2048; i++) { let s = 0; for (let k = 1; k <= 2 * nh; k++) s += Math.sin(2 * Math.PI * k * i / 2048 + ph[k - 1]) * (k % 2 ? half : 1) / Math.pow(k / 2, tilt); T[i] = s; }
  const pk = GBX.peak(T); for (let i = 0; i < 2048; i++) T[i] /= pk; return T;
}

// THE TRAFFIC (stereo arrays from T0): every car's tyres and engine from her ears' point of view. o.wet (0…1): a wet
// road (scene 10; a number or (t) => number): the tyres hiss; o.gain(t): an overall envelope. Also two cars idling in the side street.
function beCityTraffic(K, T0, T1, ear, o = {}) {
  const { fx, sr, r } = K, n = Math.ceil((T1 - T0) * sr), L = new Float32Array(n), R = new Float32Array(n), CR = 32, wetF = typeof o.wet === 'function' ? o.wet : () => o.wet || 0;
  const N = Math.ceil(7 * sr), tb = fx.white(N), td = fx.white(N), th = fx.white(N);
  GBX.bq(tb, 'bp', 1100, 0.45, sr); GBX.bq(tb, 'hp', 320, 0.7, sr);              // the tyres' roar, near
  GBX.bq(td, 'lp', 380, 0.7, sr); GBX.bq(td, 'hp', 45, 0.7, sr);                 // the far, dark part
  GBX.bq(th, 'bp', 3800, 0.5, sr); GBX.bq(th, 'hp', 1600, 0.7, sr);              // the hiss of water under tyres
  const nb = 1 / Math.sqrt(GBX.peak(tb) * 0.2 + 1e-9), nd = 1 / Math.sqrt(GBX.peak(td) * 0.2 + 1e-9);
  const tabCar = _beEngineTab(r, 1.1, 7), tabBus = _beEngineTab(r, 0.65, 12, 0.4), tabIdle = _beEngineTab(r, 0.9, 8, 0.5);
  const F0 = { sedan: 58, hatch: 66, suv: 52, van: 50, taxi: 60, pickup: 44, ev: 0, bus: 44 };
  const gEnv = o.gain || (() => 1);
  for (const c of beCityCarList()) {
    const z = BE_CITY.lanes[c.lane].z, bus = !!c.bus, f0 = F0[c.type] || 56, eng = bus ? 1.0 : f0 ? 0.32 : 0, tab = bus ? tabBus : tabCar;
    const off = r.int(0, N - 1), wv = fx.wander(0.4);
    let ph = r.next(), prevD = null;
    for (let i0 = 0; i0 < n; i0 += CR) {
      const t = T0 + i0 / sr, x = beCityCarX(c, t), E = ear(t), P = _beCityPlace(x, z, E, 4, 1.1);
      if (P.d > 110) { prevD = null; continue; }
      const vr = prevD == null ? 0 : MathX.clamp((P.d - prevD) * sr / CR, -30, 30); prevD = P.d;
      const dop = 343 / (343 + vr), near = 1 / (1 + (P.d / 14) * (P.d / 14)), G = P.g * (bus ? 1.6 : 1) * gEnv(t), wet = wetF(t);
      const inc = f0 * dop * (1 + 0.02 * wv(t)) / sr / 2;
      for (let j = 0; j < CR && i0 + j < n; j++) {
        const i = i0 + j, q = (off + i) % N;
        ph += inc; if (ph >= 1) ph -= 1;
        const e = eng ? eng * tab[(ph * 2048) | 0] * (0.2 + 0.8 * near) : 0;
        const s = G * (tb[q] * nb * near * (bus ? 1.3 : 0.9) + td[q] * nd * (0.55 + 0.45 * near) + th[q] * nb * wet * (0.4 + 1.6 * near) + e * 0.12);
        L[i] += s * P.gl; R[i] += s * P.gr;
      }
    }
  }
  // the side street: two cars waiting at the stop line, idling (≈ 800 rpm)
  for (const [x, z, f] of [[32.6, 15.2, 27], [32.6, 21.4, 25]]) {
    let ph = r.next(); const wv = fx.wander(0.3);
    for (let i0 = 0; i0 < n; i0 += CR) {
      const t = T0 + i0 / sr, P = _beCityPlace(x, z, ear(t), 3, 1.2), G = P.g * 0.05 * gEnv(t);
      for (let j = 0; j < CR && i0 + j < n; j++) { ph += f * (1 + 0.03 * wv(t)) / sr / 2; if (ph >= 1) ph -= 1; const s = G * tabIdle[(ph * 2048) | 0]; L[i0 + j] += s * P.gl; R[i0 + j] += s * P.gr; }
    }
  }
  return { L, R };
}

// a syllable of unintelligible speech: glottal pulses (with a pitch glide) through a vowel's formants, a consonant edge
const BE_VOWELS = [[[730, 5, 1], [1090, 6, 0.55], [2440, 8, 0.22]], [[530, 5, 1], [1840, 7, 0.45], [2480, 8, 0.22]], [[320, 5, 1], [2200, 8, 0.35], [2950, 9, 0.18]],
  [[570, 5, 1], [840, 6, 0.6], [2410, 8, 0.18]], [[350, 5, 1], [900, 6, 0.45], [2240, 8, 0.14]]];
function beSyllable(fx, f0, dur, fs = 1, stress = 1) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(dur * sr), y = fx.arr(dur + 0.04), src = new Float32Array(n), V = BE_VOWELS[r.int(0, 4)], glide = r.range(-0.18, 0.1) * stress;
  let ph = 0; const nz = fx.white(n);
  for (let i = 0; i < n; i++) { const u = i / n; ph += f0 * (1 + glide * u + 0.012 * (r.next() - 0.5)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += nz[i] * 0.05; }
  for (const [f, q, a] of V) { const z = Float32Array.from(src); GBX.bq(z, 'bp', f * fs, q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a; }
  for (let i = 0; i < n; i++) y[i] *= Math.pow(Math.sin(Math.PI * i / n), 0.6);
  if (r.next() < 0.55) { const m = Math.round(r.range(0.02, 0.05) * sr), z = fx.white(m); GBX.bq(z, 'hp', r.range(2500, 5000), 0.7, sr); for (let i = 0; i < m; i++) y[i] += z[i] * 0.35 * Math.exp(-i / (m * 0.3)); }
  return y;
}

// ================================================================================================= AMBIENCE
beSound('amb', 'city', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, T0 = B.s9 - 0.05, T1 = B.s10 + 1.6, n = Math.ceil((T1 - T0) * sr);
  const street = K.room('cityAmb', Object.assign({ src: _beCityBox(15, 0.8, 0), lis: _beCityBox(15, 1.6, BE_CITY.path), wet: 0.32 }, BE_CITY_ROOM));
  // from high above (I1) the street is a softer, more distant roar; it reaches full size as the camera comes down
  const aerial = (t) => MathX.lerp(0.45, 1, MathX.smooth(t, B.s9 + 0.3, B.i2 + 0.3));
  const { L, R } = beCityTraffic(K, T0, T1, beCityEar, { gain: aerial });
  // the far city: a wide, dark wash that never stops (both channels independent), a little wind in the trees
  { const a = fx.white(n), b = fx.white(n), w = fx.white(n); for (const x of [a, b]) { GBX.bq(x, 'lp', 480, 0.6, sr); GBX.bq(x, 'hp', 35, 0.7, sr); }
    GBX.bq(w, 'bp', 2600, 0.4, sr); const wa = fx.wander(0.12), ww = fx.wander(0.2);
    for (let i = 0; i < n; i++) { const t = T0 + i / sr, g = aerial(t) * (0.75 + 0.25 * wa(t)), gw = 0.004 * (0.6 + 0.4 * ww(t)); L[i] += a[i] * 0.09 * g + w[i] * gw; R[i] += b[i] * 0.09 * g + w[i] * gw * 0.8; } }
  // the café pair talking (the same phrases their mouths make), a few cups; heard from her ears
  const cafe = (x, z, t, y, vol) => { const P = _beCityPlace(x, z, beCityEar(t), 2.5, 1.25); GBX.mixIn(L, R, y, Math.round((t - T0) * sr), vol * P.g, P.pan); };
  for (const q of BE_CITY_TALK) {
    if (q.t < T0 || q.t > T1 - 0.5) continue;
    const y = beSyllable(fx, q.who ? 205 : 128, r.range(0.12, 0.2), q.who ? 1.14 : 1, 1); GBX.bq(y, 'lp', 3200, 0.7, sr);
    cafe(q.who ? 15.78 : 14.62, 11.15, q.t, y, 0.05);
  }
  for (let t = T0 + 1.3; t < T1 - 1; t += r.range(2.5, 6)) cafe(15.2, 11.15, t, fx.hit(r.next() < 0.5 ? fx.cupModes() : fx.saucerModes(), { width: 0.0004, amp: 1 }), 0.012);
  // the terrace beyond (people at the other tables and in the arcade): a low murmur of overlapping voices
  for (const [x, z, f0, fs] of [[18.0, 11.4, 112, 1], [18.3, 11.0, 196, 1.12], [6, 11.6, 150, 1.06], [44, 12.6, 120, 1], [47, 12.8, 215, 1.15]]) {
    for (let t = T0 + r.range(0, 1.5); t < T1 - 0.6;) {
      const k = r.int(4, 12); for (let i = 0; i < k && t < T1 - 0.6; i++) { const y = beSyllable(fx, f0 * r.range(0.95, 1.05), r.range(0.11, 0.2), fs, 0.7); GBX.bq(y, 'lp', 2200, 0.7, sr); cafe(x, z, t, y, 0.02); t += r.range(0.14, 0.24); }
      t += r.range(0.6, 2.2);
    }
  }
  // the walkers' own steps (shoes on the slabs)
  for (const id of ['p1', 'p4', 'p5', 'p2', 'p3']) for (const sg of BE_PEDS_CITY[id]) if (sg.p1) for (const h of beActPlan(sg)) {
    if (h.t0 <= sg.t0 || h.t0 >= sg.t1 || h.t0 < T0 || h.t0 > T1 - 0.6) continue;
    const P = _beCityPlace(h.p.x, h.p.z, beCityEar(h.t0), 1.5, 1.3); if (P.g < 0.02) continue;
    const y = fx.step({ weight: id === 'p1' ? 0.5 : 0.42, scuff: 0.1, s: id === 'p4' ? 0.9 : 1.1 }); if (P.d > 6) GBX.bq(y, 'lp', 2400, 0.7, sr);
    GBX.mixIn(L, R, y, Math.round((h.t0 - T0) * sr), 0.03 * P.g, P.pan);
  }
  // distant construction on the far side (the scaffolding at x 48–64): bursts of hammering, a cut-off saw twice
  for (let t = T0 + 2.2; t < T1 - 2; t += r.range(3.8, 7.5)) {
    const k = r.int(3, 7), per = r.range(0.32, 0.48);
    for (let j = 0; j < k; j++) {
      const tt = t + j * per * r.range(0.92, 1.08), P = _beCityPlace(56, -14, beCityEar(tt), 4, 1.0);
      const y = fx.hit(fx.metalModes(r.range(760, 980), 0.3).concat([[170, 0.02, 0.9]]), { width: 0.0007, amp: 1, noise: 0.4, nhp: 2500 }); GBX.bq(y, 'lp', 3000, 0.7, sr);
      GBX.mixIn(L, R, y, Math.round((tt - T0) * sr), 0.03 * P.g, P.pan);
    }
  }
  for (const t of [B.i2 + 1.1, B.i6 + 0.8]) {
    const d = 2.6, m = Math.ceil(d * sr), y = fx.white(m), wv = fx.wander(1.5), P = _beCityPlace(58, -14, beCityEar(t), 4, 1.0);
    GBX.bq(y, 'bp', 3300, 3, sr); for (let i = 0; i < m; i++) { const u = i / m; y[i] = (y[i] + 0.3 * Math.sin(2 * Math.PI * 3300 * i / sr)) * Math.min(1, u * 12, (1 - u) * 6) * (0.8 + 0.2 * wv(i / sr)); }
    GBX.mixIn(L, R, y, Math.round((t - T0) * sr), 0.012 * P.g, P.pan);
  }
  // a few birds in the street trees
  for (let t = T0 + 0.8; t < T1 - 1; t += r.range(2.4, 5)) {
    const f = r.range(3000, 4600), k = r.int(2, 4), y = fx.arr(k * 0.13 + 0.1);
    for (let j = 0; j < k; j++) { const i0 = Math.round(j * r.range(0.09, 0.13) * sr), len = Math.round(r.range(0.04, 0.07) * sr), f1 = f * r.range(0.88, 1.12); let ph = 0; for (let i = 0; i < len && i0 + i < y.length; i++) { const u = i / len; ph += 2 * Math.PI * f1 * (1 + 0.25 * Math.sin(Math.PI * u)) / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u); } }
    GBX.mixIn(L, R, y, Math.round((t - T0) * sr), r.range(0.002, 0.004), r.range(-0.3, 0.8));
  }
  K.putLR(L, R, T0, { vol: 0.34, fadeIn: 0.2, stop: T1, fade: 1.4, room: street, wet: 0.35 });
});

// ================================================================================================= FOLEY
beSound('foley', 'city', function (ctx, dest, K) {
  const { fx, r } = K, B = BE;
  const street = K.room('cityF', Object.assign({ src: _beCityBox(15, 0.2, BE_CITY.path), lis: _beCityBox(15, 1.6, BE_CITY.path), wet: 0.3 }, BE_CITY_ROOM));
  const onDomes = (x) => x > 29.1 && x < 30.1;
  for (const sg of BE_HERO_CITY) {
    // the cane's tip: on the slabs a bright, short tick; on the tactile domes a bumpier, rattling one
    for (const t of beCaneTaps(sg)) {
      if (t >= B.s10) continue;   // from scene 10 on: sound-rain.js (wet)
      const x = beCityEar(t).x + 0.55, d = onDomes(x);
      const y = fx.hit(fx.stoneModes(d ? 3.3 : 2.6), { width: 0.0006, amp: 1, extra: d ? [[0.007, 0.0004, 0.55], [0.015, 0.0004, 0.3]] : [] });
      K.put(y, t, { vol: 0.09, norm: true, pan: r.range(-0.15, 0.15), room: street, wet: 0.35 });
    }
    if (sg.p1) for (const h of beActPlan(sg)) if (h.t0 > sg.t0 && h.t0 < sg.t1 + 0.6 && h.t0 < B.s10) K.put(fx.step({ weight: 0.4, scuff: 0.15 }), h.t0, { vol: 0.07, norm: true, pan: h.side === 'L' ? -0.08 : 0.08, room: street, wet: 0.3 });
  }
  // at the corner: the cane sweeps across the domes (the bumps say "the kerb is here")
  for (const [t, d, p] of [[B.iStop - 0.1, 0.55, 0.15], [B.iStop + 0.5, 0.6, -0.15]]) {
    const y = fx.rustle(d, { density: 900, rub: 0.25, lo: 900, hi: 7000, grain: 0.004 });
    for (let k = 0.03; k < d - 0.03; k += 0.045) { const z = fx.hit(fx.stoneModes(3.4), { width: 0.0004, amp: r.range(0.3, 0.6) }); const i0 = Math.round(k * fx.sr); for (let i = 0; i < z.length && i0 + i < y.length; i++) y[i0 + i] += z[i] * 0.6; }
    K.put(y, t, { vol: 0.06, norm: true, pan: p, room: street, wet: 0.25 });
  }
  // her hand on the button box: fingertips on the housing, the button pressed (a firm mechanical click)
  const press = B.iReach[0] + 0.75;
  K.put(fx.rustle(0.7, { density: 220, rub: 0.4, lo: 400, hi: 4200, grain: 0.02 }), B.iReach[0], { vol: 0.04, norm: true, pan: -0.2, room: street, wet: 0.2 });
  K.put(fx.slap(fx.panelModes(0.4), { amp: 0.5, skin: 0.6, width: 0.002, len: 0.3 }), press - 0.35, { vol: 0.04, norm: true, pan: -0.25, room: street, wet: 0.2 });
  K.put(fx.hit([[2400, 0.004, 1], [3900, 0.003, 0.6], [900, 0.01, 0.5]], { width: 0.0004, amp: 1, extra: [[0.035, 0.0004, 0.5]] }), press, { vol: 0.07, norm: true, pan: -0.25, room: street, wet: 0.2 });
  // breath: she listens (held), then lets go when the walk tone starts
  K.put(fx.breath(0.8, { inhale: true }), B.i9 - 0.2, { vol: 0.04, norm: true, room: street, wet: 0.15 });
  K.put(fx.breath(1.2, {}), B.iWalkSig + 0.4, { vol: 0.045, norm: true, room: street, wet: 0.15 });
  K.put(fx.rustle(1.1, { density: 200, rub: 0.4, lo: 350, hi: 4500, grain: 0.02 }), B.iWalkSig + 0.6, { vol: 0.04, norm: true, room: street, wet: 0.3 });
});

// ================================================================================================= SFX
beSound('sfx', 'city', function (ctx, dest, K) {
  const { fx, sr } = K, B = BE, T0 = B.s9, T1 = B.s10 + 1.6, n = Math.ceil((T1 - T0) * sr), L = new Float32Array(n), R = new Float32Array(n);
  const street = K.room('citySfx', Object.assign({ src: _beCityBox(29, 1.55, 9.2), lis: _beCityBox(29, 1.6, 9.2), wet: 0.3 }, BE_CITY_ROOM));
  const floor = 2 * 1.55 / 343, shop = 2 * (BE_CITY.walk - BE_CITY.path) / 343;
  // her clicks. I5: the shopfronts' echo is there (≈ 14.6 ms) but the street noise covers it
  B.i5Clicks.forEach((t) => K.put(beWithEchoes(fx, beClickArr(fx, { f: 3000 }), [[floor, 0.3, 6000], [shop, 0.22, 4500]]), t, { vol: 0.3, norm: true, pan: 0.05, room: street, wet: 0.35 }));
  // I7: the building beside her answers (right, slightly behind); the next click, toward the side street, comes back
  // with nothing close: only the far side of the side street, faint (≈ 14 m away: ≈ 80 ms)
  K.put(beWithEchoes(fx, beClickArr(fx, { f: 3000 }), [[floor, 0.3, 6000], [0.0165, 0.34, 5000], [0.022, 0.14, 3500]]), B.i7Clicks[0], { vol: 0.34, norm: true, pan: 0.12, room: street, wet: 0.3 });
  K.put(beWithEchoes(fx, beClickArr(fx, { f: 3000 }), [[floor, 0.3, 6000], [0.082, 0.05, 2200]]), B.i7Clicks[1], { vol: 0.34, norm: true, pan: -0.05, room: street, wet: 0.3 });
  // the accessible pedestrian signal (both poles): the locator tone once a second (short, low "tock"), and in the walk
  // phase the rapid tick (≈ 8 a second); both are meant to be heard only near the pole
  const loc = fx.hit([[880, 0.018, 1], [1760, 0.01, 0.4], [2640, 0.006, 0.25]], { width: 0.0008, amp: 1 }), tick = fx.hit([[2300, 0.004, 1], [3700, 0.003, 0.6], [1200, 0.006, 0.4]], { width: 0.0004, amp: 1 });
  const lp = GBX.peak(loc), tp = GBX.peak(tick); for (let i = 0; i < loc.length; i++) loc[i] /= lp; for (let i = 0; i < tick.length; i++) tick[i] /= tp;
  const poles = [BE_CITY.apsA, BE_CITY.apsB].map((p) => ({ x: p.x !== undefined ? p.x : p[0], z: p.z !== undefined ? p.z : p[2] }));
  for (const [pi, Q] of poles.entries()) {
    for (let t = Math.ceil(T0); t < T1 - 0.2; t += 1) {
      if (t >= B.iWalkSig && t < B.iWalkEnd) continue;
      const P = _beCityPlace(Q.x, Q.z, beCityEar(t), 1.2, 1.4); if (P.g < 0.01) continue;
      GBX.mixIn(L, R, loc, Math.round((t - T0) * sr), 0.16 * P.g * (pi ? 0.9 : 1), P.pan);
    }
    for (let k = Math.ceil(B.iWalkSig / 0.12); k * 0.12 < B.iWalkEnd; k++) {
      const t = k * 0.12, P = _beCityPlace(Q.x, Q.z, beCityEar(t), 1.2, 1.3); if (P.g < 0.01) continue;
      GBX.mixIn(L, R, tick, Math.round((t - T0) * sr), 0.13 * P.g * (pi ? 0.9 : 1), P.pan);
    }
  }
  // the button's confirmation (a short two-note chirp from the box under her hand)
  { const a = fx.beep(1320, 0.06), b = fx.beep(1760, 0.08), t = B.iReach[0] + 0.8; GBX.mixIn(L, R, a, Math.round((t - T0) * sr), 0.06, -0.2); GBX.mixIn(L, R, b, Math.round((t + 0.08 - T0) * sr), 0.06, -0.2); }
  K.putLR(L, R, T0, { vol: 1, room: street, wet: 0.3 });
});

// ================================================================================================= MUSIC
beSound('music', 'city', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // out of the lab's silence: a quiet walking pulse (felt piano, two notes to a stride) over a low open fifth
  const walk = ['D3', 'A3', 'E4', 'A3', 'F#3', 'A3', 'D4', 'A3'];
  let i = 0; for (let t = B.s9 + 0.5; t < B.i5 - 0.4; t += 1.15, i++) M.piano(t, walk[i % walk.length], i % 2 ? 0.075 : 0.1, 1.5, i % 2 ? 0.25 : -0.25, 0.5);
  M.strings(B.s9 - 0.3, B.i5 + 0.4, ['D2', 'A2', 'E3'], 0.36, { att: 2.6, rel: 1.4, cut: 650 });
  // "mask": the chord clouds over (a semitone rub, low and close)
  M.strings(B.i5 - 0.3, B.i6 + 0.9, ['C#2', 'G#2', 'D3', 'E3'], 0.3, { att: 0.9, rel: 1.3, cut: 520 });
  // skills, tools, experience: the pulse again, steadier, under a warmer chord; it holds at the signal
  i = 0; for (let t = B.i6 + 0.4; t < B.i9 - 0.6; t += 1.15, i++) M.piano(t, ['B2', 'F#3', 'D4', 'F#3', 'G2', 'D3', 'B3', 'D3'][i % 8], i % 2 ? 0.07 : 0.09, 1.5, i % 2 ? 0.25 : -0.25, 0.5);
  M.strings(B.i6 + 0.2, B.i9 + 0.2, ['B1', 'F#2', 'D3', 'A3'], 0.34, { att: 1.6, rel: 1.0, cut: 700 });
  // the gap: the street steps back, a held open chord; on the walk tone it warms, and carries her across
  M.strings(B.i9 - 0.3, B.s10 + 2.6, ['D2', 'A2', 'E3', 'A3'], 0.5, { att: 1.4, rel: 2.4, cut: 1100, keys: [[B.iWalkSig, 0.75], [B.iWalkSig + 1.4, 1.0]] });
  M.strings(B.iWalkSig + 0.6, B.s10 + 2.6, ['F#3', 'D4'], 0.34, { att: 1.8, rel: 2.4, cut: 1600 });
  M.piano(B.iWalkSig + 1.0, 'F#4', 0.15, 2.6, 0.15, 0.7); M.piano(B.iWalkSig + 2.1, 'A4', 0.13, 2.4, -0.1, 0.7); M.piano(B.iWalkSig + 3.2, 'D5', 0.12, 3.0, 0.1, 0.9);
});
