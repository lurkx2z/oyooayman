/* =====================================================================
   SOUND — scene 10 (the rain). The street of scene 9 a few minutes on, heard from where she is.
     the rain    built from impacts, not from a noise loop: a few thousand tiny ticks a second (drops on stone), heavier
                 "plaps", bubbles ringing in the puddles, the far hiss, the roofs' low roar. It follows the weather
                 (beRainK), the sheet that sweeps the street in the gap, and where she stands: under the arcade the
                 near impacts stop and the street's rain comes from the opening on her left, darker
     sources     the scaffold's boards drumming across the road, drips falling from the arcade's edge (a row of points,
                 each at its own pace), rain on the umbrella that passes her, the wet traffic (tyres hiss), thunder
                 after the flash, wind
     slow motion inside the slowed shots the bed sinks and darkens; the drop meeting the rail rings like a bell (its
                 "tink" slowed); each insert's impacts are pitched down and lengthened by its shot's rate
     her         wet steps and cane taps (a small splash with each); under the arcade dry ones with close reflections
                 (the back wall ≈ 2 m behind her, the ceiling); the cane's tip meeting the column
     clicks      J6: the arcade answers (≈ 14 ms, ≈ 33 ms), but the rain sits on top of the answer
     music       a high celesta drop on each surface's word, a darker chord under "doesn't simply", a held tension under
                 "drown out", a note for each zone, the walking pulse on her steps that slows as she slows; the gap is
                 rain only
   ===================================================================== */
const BE_SR = 48000;   // the offline render's rate (audio.js); the bubbles are written at it
const BE_ARCADE_ROOM = { size: [30, 4.2, 3.25], rt60: 0.55, absorb: 0.45, bright: 0.6, damp: 3.2, seed: 131 };

// her ears in scene 10 (x, z): the end of the crossing (beCityEar), then her blocking (the actor's segments), every 10 ms
const beRainEar = (() => {
  let tab = null, T0 = 0;
  const at = (t) => {
    if (t < BE.iCross[1]) return beCityEar(t);
    let seg = BE_HERO_CITY[0]; for (const s of BE_HERO_CITY) if (t >= s.t0) seg = s;
    if (seg.p1) { const plan = beActPlan(seg), p = plan.atS(plan.sOfT(Math.min(t, seg.t1))).p; return { x: p.x, z: p.z }; }
    return { x: seg.p0.x, z: seg.p0.z };
  };
  return (t) => {
    if (!tab) { T0 = BE.s10 - 3; const n = Math.ceil(((BE.rainEnd || BE.s11 + 2) + 8 - T0) * 100) + 2; tab = new Float32Array(n * 2); for (let i = 0; i < n; i++) { const e = at(T0 + i / 100); tab[2 * i] = e.x; tab[2 * i + 1] = e.z; } }
    const u = MathX.clamp((t - T0) * 100, 0, tab.length / 2 - 1.001), i = Math.floor(u), f = u - i;
    return { x: tab[2 * i] + (tab[2 * i + 2] - tab[2 * i]) * f, z: tab[2 * i + 1] + (tab[2 * i + 3] - tab[2 * i + 1]) * f };
  };
})();
// 0…1: she is under the arcade's roof (softened over ±0.1 s, the time it takes to step under)
function beRainShelter(t) { let s = 0; for (const d of [-0.1, -0.05, 0, 0.05, 0.1]) { const E = beRainEar(t + d); s += E.x > 43.4 && E.z > 11.95 ? 1 : 0; } return s / 5; }
// a bubble ringing (Minnaert: the pitch rises as it decays), mono, added at i0
function _beBubble(y, i0, f, tau, amp, sr = BE_SR) {
  const n = Math.ceil(tau * 6 * sr); let ph = 0;
  for (let i = 0; i < n && i0 + i < y.length; i++) { if (i0 + i < 0) continue; const t = i / sr; ph += 2 * Math.PI * f * (1 + 0.15 * t / tau) / sr; y[i0 + i] += amp * Math.sin(ph) * Math.exp(-t / tau) * Math.min(1, i / 30); }
}
// add a mono source y (it starts at film time ty) heard from her ears: at pos ({x, z} or (t) => {x, z}), × g(t)
function _beRainPlace(K, L, R, T0, y, ty, pos, ref, pw, g) {
  const sr = K.sr, CR = 64, i00 = Math.round((ty - T0) * sr);
  for (let j0 = 0; j0 < y.length; j0 += CR) {
    const t = ty + j0 / sr, p = typeof pos === 'function' ? pos(t) : pos, P = _beCityPlace(p.x, p.z, beRainEar(t), ref, pw), G = P.g * (g ? g(t) : 1);
    if (G < 1e-5) continue;
    for (let j = j0; j < Math.min(j0 + CR, y.length); j++) { const i = i00 + j; if (i < 0 || i >= L.length) continue; L[i] += y[j] * G * P.gl; R[i] += y[j] * G * P.gr; }
  }
}
// a sparse train of impacts (rate(t) per second, exponential amplitudes) from T0, length n
function _beImpacts(r, sr, T0, n, rate) {
  const e = new Float32Array(n), CR = 64;
  for (let i0 = 0; i0 < n; i0 += CR) { const p = rate(T0 + i0 / sr) / sr; if (p <= 0) continue; for (let i = i0; i < Math.min(n, i0 + CR); i++) if (r.next() < p) e[i] = (r.next() < 0.5 ? -1 : 1) * (0.25 - Math.log(1 - 0.999 * r.next())); }
  return e;
}
const _beRms = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, b - a)) + 1e-9; };

// THE RAIN BED (stereo, from T0): every layer per channel (the two ears hear different drops)
function beRainBed(K, T0, T1) {
  const { fx, sr, r } = K, B = BE, n = Math.ceil((T1 - T0) * sr), CR = 64, nb = Math.ceil(n / CR) + 1;
  const slowShots = BE_SHOTS.filter((s) => s.set === 'city' && s.rate && s.rate < 1);
  const viewShots = BE_SHOTS.filter((s) => s.set === 'city' && s.tag === true && s.t0 >= B.s10 - 1 && s.t0 < B.s11);
  const J4a = BE_SHOTS.find((s) => s.id === 'J4a');
  const K_ = new Float32Array(nb), SH = new Float32Array(nb), SL = new Float32Array(nb), DV = new Float32Array(nb), WD = new Float32Array(nb), FR = new Float32Array(nb), FP = new Float32Array(nb);
  for (let b = 0; b < nb; b++) {
    const t = T0 + b * CR / sr, E = beRainEar(t), F = beRainFront(t);
    K_[b] = beRainK(t); SH[b] = beRainShelter(t);
    let s = 0; for (const q of slowShots) s = Math.max(s, MathX.window(t, q.t0 - 0.03, q.t1 + 0.03, 0.06, 0.06)); SL[b] = s;
    let v = 0; for (const q of viewShots) v = Math.max(v, MathX.window(t, q.t0 - 0.05, q.t1 + 0.05, 0.1, 0.1)); DV[b] = v;
    WD[b] = J4a ? MathX.window(t, J4a.t0 - 0.05, J4a.t1 + 0.05, 0.1, 0.3) : 0;
    // the sheet is heard before it arrives and after it passes (a wider band than the picture's); in the overhead shot
    // +x is screen-left, so it sweeps from the right of the frame to the left
    FR[b] = F[2] * Math.exp(-((E.x - F[0]) * (E.x - F[0])) / (F[1] * F[1] * 4)); FP[b] = -MathX.clamp((F[0] - E.x) / 9, -1, 1) * 0.75;
  }
  const near = (t) => { const b = Math.min(nb - 1, ((t - T0) * sr / CR) | 0); return K_[b] * (1 - 0.9 * SH[b]); };
  const a = Math.round((B.j3e - T0) * sr), z = Math.round((B.j5 - T0) * sr);   // the reference stretch: full rain, real time, in the open
  const out = [];
  for (let c = 0; c < 2; c++) {
    const imp = _beImpacts(r, sr, T0, n, (t) => 2600 * near(t)), hi = Float32Array.from(imp), mid = Float32Array.from(imp);
    GBX.bq(hi, 'bp', 4200, 0.6, sr); GBX.bq(mid, 'bp', 1700, 0.8, sr);
    const ticks = new Float32Array(n); for (let i = 0; i < n; i++) ticks[i] = hi[i] + 0.6 * mid[i];
    const pe = _beImpacts(r, sr, T0, n, (t) => 70 * near(t)), plaps = new Float32Array(n);
    GBX.res(plaps, pe, [[380, 0.006, 1], [820, 0.004, 0.6], [1700, 0.0025, 0.4], [3500, 0.0015, 0.3]], sr);
    const bub = new Float32Array(n);
    for (let t = T0; t < T1; t += 1 / 400) if (r.next() < 18 * near(t) / 400) _beBubble(bub, Math.round((t - T0) * sr), r.range(1300, 3800), r.range(0.004, 0.011), r.range(0.3, 1));
    const hiss = fx.white(n), roar = fx.white(n), wv = fx.wander(0.35);
    GBX.bq(hiss, 'lp', 7500, 0.6, sr); GBX.bq(hiss, 'hp', 600, 0.6, sr);
    GBX.bq(roar, 'lp', 240, 0.6, sr); GBX.bq(roar, 'hp', 35, 0.7, sr);
    const hissM = Float32Array.from(hiss); GBX.bq(hissM, 'lp', 2200, 0.7, sr);
    // unit levels at full rain (the bubbles and plaps keep their own balance against the ticks)
    const nT = 1 / _beRms(ticks, a, z), nP = 1 / _beRms(plaps, a, z), nB = 1 / _beRms(bub, a, z), nH = 1 / _beRms(hiss, 0, n), nR = 1 / _beRms(roar, 0, n);
    const y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const b = (i / CR) | 0, k = K_[b]; if (k < 1e-4) continue;
      const sh = SH[b], dv = DV[b], wd = WD[b], fr = FR[b], t = T0 + i / sr;
      const gH = k * (1 - 0.3 * dv) * (1 + 0.3 * wd) * (1 + 1.4 * fr) * (0.85 + 0.15 * wv(t));
      y[i] = ticks[i] * nT * 0.05 * (1 + 0.5 * dv) * (1 - 0.5 * wd) + plaps[i] * nP * 0.028 * (1 - 0.4 * wd) + bub[i] * nB * 0.014
        + (hiss[i] * (1 - sh) + hissM[i] * sh * 0.8) * nH * 0.032 * gH + roar[i] * nR * 0.03 * k * (1 + 0.8 * wd + 0.6 * fr);
      if (c === 1) y[i] *= 1 - 0.45 * sh;   // under the roof the open side is on her left (the back wall on her right)
    }
    out.push(y);
  }
  // the sheet: more impacts and a denser hiss in a band, panned with it
  { const imp = _beImpacts(r, sr, T0, n, (t) => { const b = Math.min(nb - 1, ((t - T0) * sr / CR) | 0); return 3500 * FR[b]; }), w = fx.white(n);
    GBX.bq(imp, 'bp', 3000, 0.6, sr); GBX.bq(w, 'lp', 5000, 0.6, sr); GBX.bq(w, 'hp', 300, 0.6, sr);
    const nI = 1 / _beRms(imp, 0, n), nW = 1 / _beRms(w, 0, n);
    for (let i0 = 0; i0 < n; i0 += CR) {
      const b = (i0 / CR) | 0, fr = FR[b]; if (fr < 1e-4) continue;
      const an = (FP[b] + 1) * Math.PI / 4, gl = Math.cos(an), gr = Math.sin(an);
      for (let i = i0; i < Math.min(n, i0 + CR); i++) { const s = (imp[i] * nI * 0.012 + w[i] * nW * 0.03 * fr) * (1 - 0.6 * SH[b]); out[0][i] += s * gl; out[1][i] += s * gr; }
    }
  }
  // slow motion: the bed sinks and darkens (as if stretched)
  for (const y of out) {
    const d = Float32Array.from(y); GBX.bq(d, 'lp', 700, 0.7, sr); GBX.bq(d, 'lp', 700, 0.7, sr);
    for (let i = 0; i < n; i++) { const s = SL[(i / CR) | 0]; if (s > 0) y[i] = y[i] * (1 - s) + d[i] * s * 0.55; }
  }
  return { L: out[0], R: out[1] };
}

// ================================================================================================= AMBIENCE
beSound('amb', 'rain', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, T0 = B.s10 + 0.2, T1 = (B.rainEnd || B.s11 + 2), n = Math.ceil((T1 - T0) * sr);
  const street = K.room('rainAmb', Object.assign({ src: _beCityBox(45, 0.8, 0), lis: _beCityBox(45, 1.6, BE_CITY.path), wet: 0.3 }, BE_CITY_ROOM));
  // the wet street: the same cars (tyres hissing as the road gets wet), the far city's wash under the rain
  const { L, R } = beCityTraffic(K, T0, T1, beRainEar, { wet: (t) => beWetK(t) });
  { const a = fx.white(n), b = fx.white(n); for (const x of [a, b]) { GBX.bq(x, 'lp', 480, 0.6, sr); GBX.bq(x, 'hp', 35, 0.7, sr); }
    for (let i = 0; i < n; i++) { L[i] += a[i] * 0.07; R[i] += b[i] * 0.07; } }
  const J7 = (t, a) => 1 + a * MathX.window(t, B.j7 + 0.9, B.j8 + 0.3, 0.25, 0.6);
  // the scaffold's boards across the road: hollow knocks, irregular, as dense as the rain (two bays)
  for (const [x, f] of [[52, 175], [60, 205]]) {
    const e = _beImpacts(r, sr, T0, n, (t) => 26 * beRainK(t)), y = new Float32Array(n);
    GBX.res(y, e, fx.woodModes(f, 1.3).concat([[f * 0.55, 0.06, 0.6]]), sr); GBX.bq(y, 'lp', 2600, 0.7, sr);
    const nY = 1 / _beRms(y, Math.round((B.j3e - T0) * sr), Math.round((B.j5 - T0) * sr));
    for (let i = 0; i < n; i++) y[i] *= nY * 0.05;
    _beRainPlace(K, L, R, T0, y, T0, { x, z: -11.2 }, 4, 1.0, (t) => J7(t, 2.6));
  }
  // drips off the arcade's edge (z 11.84 from x 43.6 on): each point drips at its own pace once the roof has filled
  for (let x = 43.8 + r.range(0, 0.4); x < 64; x += r.range(0.8, 1.7)) {
    const per = r.range(0.32, 1.1), f0 = r.range(1500, 3300);
    for (let t = B.rain0 + r.range(3.5, 7); t < T1 - 0.2; t += per * r.range(0.88, 1.12)) {
      const y = fx.arr(0.07); _beBubble(y, 0, f0 * r.range(0.94, 1.06), r.range(0.005, 0.009), 1);
      const tk = fx.white(Math.round(0.003 * sr)); GBX.bq(tk, 'hp', 2500, 0.7, sr); for (let i = 0; i < tk.length; i++) y[i] += tk[i] * 0.35 * Math.exp(-i / 30);
      const P = _beCityPlace(x, 11.84, beRainEar(t), 0.7, 1.5); if (P.g < 0.01) continue;
      GBX.mixIn(L, R, y, Math.round((t - T0) * sr), 0.055 * P.g * J7(t, 1.5) * r.range(0.6, 1), P.pan);
    }
  }
  // the umbrella that passes her (the woman walking west along her pavement): rain drumming on taut fabric
  { const sg = BE_PEDS_CITY.u1[1], pos = (t) => ({ x: MathX.lerp(sg.p0.x, sg.p1.x, MathX.ramp(t, sg.t0, sg.t1)), z: sg.p0.z });
    const e = _beImpacts(r, sr, T0, n, (t) => 150 * beRainK(t) * (t > sg.t0 - 2 ? 1 : 0)), y = new Float32Array(n);
    GBX.res(y, e, [[230, 0.018, 1], [370, 0.012, 0.6], [560, 0.008, 0.4], [1500, 0.003, 0.3]], sr);
    const nY = 1 / _beRms(y, Math.round((B.j5 - T0) * sr), Math.round((B.j7 - T0) * sr));
    for (let i = 0; i < n; i++) y[i] *= nY * 0.04;
    _beRainPlace(K, L, R, T0, y, T0, pos, 1.0, 1.3);
  }
  // thunder after the far flash (≈ 0.9 km away: ≈ 2.6 s later): low rolls, no crack
  { const t = B.jFlash + 2.6, d = 5.5, m = Math.ceil(d * sr), e = new Float32Array(m);
    for (const [o, w, a] of [[0, 0.5, 0.6], [0.35, 0.9, 1], [1.2, 1.4, 0.75], [2.4, 1.6, 0.45]]) for (let i = 0; i < m; i++) { const u = i / sr - o; if (u > 0) e[i] += a * Math.min(1, u / 0.12) * Math.exp(-u / w); }
    for (const [dt, v, p] of [[0, 0.16, -0.35], [0.06, 0.11, 0.5]]) {
      const y = fx.white(m); GBX.bq(y, 'lp', 140, 0.7, sr); GBX.bq(y, 'lp', 220, 0.7, sr); GBX.bq(y, 'hp', 22, 0.7, sr);
      for (let i = 0; i < m; i++) y[i] *= e[i] * Math.min(1, (m - i) / (0.6 * sr));
      GBX.mixIn(L, R, y, Math.round((t + dt - T0) * sr), v / GBX.peak(y), p);
    }
  }
  // wind: gusts high over the street (the storm shot) and as the sheet arrives
  { const w = fx.white(n), wv = fx.wander(0.25); GBX.bq(w, 'bp', 520, 0.5, sr); GBX.bq(w, 'lp', 1400, 0.7, sr);
    const J4a = BE_SHOTS.find((s) => s.id === 'J4a'), nW = 1 / _beRms(w, 0, n);
    for (let i = 0; i < n; i++) { const t = T0 + i / sr, g = beRainK(t) * (0.25 + 0.75 * Math.max(MathX.window(t, J4a.t0 - 0.4, J4a.t1 + 1.2, 0.4, 1.0), MathX.window(t, B.j9 - 0.5, B.j9b + 0.8, 0.8, 1.0))) * (0.6 + 0.4 * wv(t));
      L[i] += w[i] * nW * 0.012 * g; R[i] += w[i] * nW * 0.012 * g * 0.85; } }
  K.putLR(L, R, T0, { vol: 0.34, fadeIn: 1.4, stop: T1, fade: 1.5, room: street, wet: 0.3 });
  // the rain itself (diffuse already: a light send only)
  const bed = beRainBed(K, T0, T1);
  K.putLR(bed.L, bed.R, T0, { vol: 1, stop: T1, fade: 1.5, room: street, wet: 0.08 });
});

// ================================================================================================= FOLEY
beSound('foley', 'rain', function (ctx, dest, K) {
  const { fx, r, sr } = K, B = BE, T1 = (B.rainEnd || B.s11 + 2);
  const street = K.room('rainF', Object.assign({ src: _beCityBox(45, 0.2, BE_CITY.path), lis: _beCityBox(45, 1.6, BE_CITY.path), wet: 0.3 }, BE_CITY_ROOM));
  const arcade = K.room('arcadeF', Object.assign({ src: [8, 0.2, 1.3], lis: [8, 1.6, 1.3], wet: 0.45 }, BE_ARCADE_ROOM));
  const splash = (w) => { const m = Math.round(0.06 * sr), y = fx.white(m); GBX.bq(y, 'bp', 2400, 0.8, sr); for (let i = 0; i < m; i++) y[i] *= Math.exp(-i / (m * 0.22)) * w; _beBubble(y, Math.round(r.range(0.004, 0.012) * sr), r.range(1200, 2400), 0.006, 0.25 * w); return y; };
  const wetAt = (t) => beWetK(t) * (1 - beRainShelter(t));
  for (const sg of BE_HERO_CITY) {
    for (const t of beCaneTaps(sg)) {
      if (t < B.s10 || t > T1) continue;
      const w = wetAt(t), y = fx.hit(fx.stoneModes(2.6), { width: 0.0006, amp: 1 }), s = splash(0.5 * w);
      for (let i = 0; i < s.length && i < y.length; i++) y[i] += s[i];
      const under = beRainShelter(t) > 0.5;
      K.put(y, t, { vol: 0.08, norm: true, pan: r.range(-0.15, 0.15), room: under ? arcade : street, wet: under ? 0.5 : 0.3 });
    }
    if (sg.p1) for (const h of beActPlan(sg)) {
      if (h.t0 <= sg.t0 || h.t0 >= sg.t1 + 0.6 || h.t0 < B.s10 || h.t0 > T1) continue;
      const w = wetAt(h.t0), y = fx.step({ weight: 0.4, scuff: 0.12 * (1 - w) }), s = splash(0.9 * w);
      const i0 = Math.round(0.004 * sr); for (let i = 0; i < s.length && i0 + i < y.length; i++) y[i0 + i] += s[i];
      const under = beRainShelter(h.t0) > 0.5;
      K.put(y, h.t0, { vol: 0.07, norm: true, pan: h.side === 'L' ? -0.08 : 0.08, room: under ? arcade : street, wet: under ? 0.55 : 0.3 });
    }
  }
  // rain on her: soft pats on her hair and shoulders while she is out in it (none under the roof)
  { const T0 = B.rain0, n = Math.ceil((B.jIn[1] + 1 - T0) * sr), e = _beImpacts(r, sr, T0, n, (t) => 22 * beRainK(t) * (1 - beRainShelter(t))), y = new Float32Array(n);
    GBX.res(y, e, [[900, 0.004, 1], [2100, 0.002, 0.5], [420, 0.006, 0.4]], sr);
    K.put(y, T0, { vol: 0.03, norm: true, room: street, wet: 0.15 }); }
  // J8: the cane's tip meets the column (stone, and the aluminium shaft rings a little)
  { const y = fx.hit(fx.stoneModes(2.4), { width: 0.0005, amp: 1 }); GBX.strike(y, 0, Math.round(0.0003 * sr), 0.25, fx.metalModes(1900, 0.3), sr);
    K.put(y, B.jTap - 0.05, { vol: 0.14, norm: true, pan: 0.25, room: street, wet: 0.25 });
    K.put(fx.hit(fx.stoneModes(2.6), { width: 0.0006, amp: 1 }), B.jTap + 0.42, { vol: 0.06, norm: true, pan: 0.22, room: street, wet: 0.25 }); }
  // breath: before her click; as she stops; let go under the roof; a shake of the wet jacket
  K.put(fx.breath(0.7, { inhale: true }), B.j6Clicks[0] - 0.6, { vol: 0.035, norm: true, room: street, wet: 0.15 });
  K.put(fx.breath(1.1, {}), B.jStop + 0.1, { vol: 0.04, norm: true, room: street, wet: 0.15 });
  K.put(fx.breath(1.3, {}), B.jIn[1] - 0.2, { vol: 0.045, norm: true, room: arcade, wet: 0.35 });
  K.put(fx.rustle(0.9, { density: 260, rub: 0.45, lo: 350, hi: 5200, grain: 0.015 }), B.jIn[1] + 0.4, { vol: 0.04, norm: true, room: arcade, wet: 0.4 });
});

// ================================================================================================= SFX
beSound('sfx', 'rain', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, T0 = B.s10 + 1.6, T1 = B.j9, n = Math.ceil((T1 - T0) * sr), L = new Float32Array(n), R = new Float32Array(n);
  const street = K.room('rainSfx', Object.assign({ src: _beCityBox(44, 1.55, BE_CITY.path), lis: _beCityBox(44, 1.6, BE_CITY.path), wet: 0.3 }, BE_CITY_ROOM));
  const at = (t) => Math.round((t - T0) * sr);
  // J2 (slowed ×30): the drop falls, meets the rail and rings like a bell; its crown spreads; a few droplets fall back
  { const t = B.jRail, sw = fx.white(Math.round(0.9 * sr)); GBX.bq(sw, 'bp', 320, 0.7, sr);
    for (let i = 0; i < sw.length; i++) { const u = i / sw.length; sw[i] *= Math.pow(u, 2.2) * (1 - Math.pow(u, 24)); }
    GBX.mixIn(L, R, sw, at(t - 0.9), 0.05 / GBX.peak(sw), 0);
    const y = fx.hit(fx.metalModes(262, 6.5).concat([[52, 0.16, 0.8]]), { width: 0.004, amp: 1, len: 3.2 });
    const sp = fx.white(Math.round(0.9 * sr)); GBX.bq(sp, 'lp', 850, 0.7, sr); GBX.bq(sp, 'hp', 90, 0.7, sr);
    for (let i = 0; i < sp.length; i++) sp[i] *= Math.min(1, i / (0.03 * sr)) * Math.exp(-i / (0.2 * sr));
    for (let i = 0; i < sp.length; i++) y[i] += sp[i] * 0.25;
    GBX.mixIn(L, R, y, at(t), 0.42 / GBX.peak(y), 0.05);
    for (const [dt, f, p] of [[0.62, 340, -0.3], [0.85, 420, 0.25], [1.05, 300, 0.1], [1.3, 380, -0.15]]) { const z = fx.arr(0.5); _beBubble(z, 0, f, 0.05, 1); GBX.mixIn(L, R, z, at(t + dt), 0.07, p); }
  }
  // J3a pavement (×6): heavy drops on stone, slowed: a low "plap", the splash, a bubble
  const plap = (t, pan, v) => { const y = fx.hit(fx.stoneModes(1.1), { width: 0.0025, amp: 1, len: 0.6 }); const s = fx.white(Math.round(0.4 * sr)); GBX.bq(s, 'lp', 1300, 0.7, sr);
    for (let i = 0; i < s.length; i++) y[i] += s[i] * 0.4 * Math.min(1, i / (0.01 * sr)) * Math.exp(-i / (0.09 * sr)); _beBubble(y, Math.round(0.05 * sr), r.range(520, 820), 0.035, 0.5);
    GBX.mixIn(L, R, y, at(t), v / GBX.peak(y), pan); };
  [[0, 0.1], [0.38, -0.35], [0.7, 0.3], [1.05, -0.1], [1.32, 0.4]].forEach(([dt, p], k) => plap(B.jW.pavement - 0.08 + dt, p, k ? 0.16 : 0.24));
  // J3b metal (×4): the rail, pitched down
  [[0, 0.1, 0.22], [0.27, -0.2, 0.14], [0.48, 0.3, 0.1]].forEach(([dt, p, v]) => { const y = fx.hit(fx.metalModes(r.range(560, 700), 2.4), { width: 0.0009, amp: 1 }); GBX.mixIn(L, R, y, at(B.jW.metal - 0.05 + dt), v / GBX.peak(y), p); });
  // J3c leaves (×4): soft taps, the leaf bouncing
  [[0, -0.1, 0.16], [0.22, 0.25, 0.11], [0.42, -0.3, 0.09]].forEach(([dt, p, v]) => { const y = fx.hit([[380, 0.02, 1], [720, 0.012, 0.5], [1500, 0.006, 0.3]], { width: 0.0014, amp: 1 }); const s = fx.rustle(0.25, { density: 500, rub: 0.2, lo: 600, hi: 4000, grain: 0.006, env: (u) => Math.exp(-u * 5) });
    for (let i = 0; i < s.length && i < y.length; i++) y[i] += s[i] * 0.5; GBX.mixIn(L, R, y, at(B.jW.leaves - 0.05 + dt), v / GBX.peak(y), p); });
  // J3d umbrellas (×4): taut fabric, a muffled drum
  [[0, 0.1, 0.22], [0.18, -0.2, 0.15], [0.33, 0.25, 0.13], [0.52, -0.05, 0.12], [0.7, 0.2, 0.1]].forEach(([dt, p, v]) => { const y = fx.hit([[150, 0.05, 1], [240, 0.035, 0.6], [370, 0.025, 0.4], [1300, 0.004, 0.2]], { width: 0.003, amp: 1, noise: 0.3, nhp: 1500 }); GBX.mixIn(L, R, y, at(B.jW.umbrellas - 0.05 + dt), v / GBX.peak(y), p); });
  // J3e glass (real time): a patter of bright ticks on the window, two louder on the word
  for (let k = 0; k < 44; k++) { const t = B.j3e + r.range(0, B.j4a - B.j3e), f = r.range(2600, 4300), y = fx.hit([[f, 0.012, 1], [f * 2.3, 0.006, 0.4], [f * 0.52, 0.02, 0.3]], { width: 0.0002, amp: 1 }); GBX.mixIn(L, R, y, at(t), r.range(0.015, 0.045) / GBX.peak(y), r.range(-0.5, 0.5)); }
  for (const [dt, p] of [[0, 0.1], [0.16, -0.15]]) { const f = r.range(3000, 3600), y = fx.hit([[f, 0.03, 1], [f * 2.3, 0.012, 0.5], [f * 0.52, 0.05, 0.4]], { width: 0.0002, amp: 1 }); GBX.mixIn(L, R, y, at(B.jW.glass - 0.04 + dt), 0.12 / GBX.peak(y), p); }
  // J6: her clicks. The arcade answers (the columns ≈ 14 ms, the shopfronts ≈ 33 ms), but the rain covers the answer
  const col = 2 * (11.95 - BE_CITY.path) / 343, shop = 2 * (15.2 - BE_CITY.path) / 343;
  B.j6Clicks.forEach((t) => { const y = beWithEchoes(fx, beClickArr(fx, { f: 3000 }), [[2 * 1.55 / 343, 0.3, 6000], [col, 0.12, 4000], [shop, 0.16, 3000]]); GBX.mixIn(L, R, y, at(t), 0.3 / GBX.peak(y), 0.05); });
  // the accessible signal, as in scene 9: the walk phase's tick runs on until it ends, then the locator again
  const loc = fx.hit([[880, 0.018, 1], [1760, 0.01, 0.4], [2640, 0.006, 0.25]], { width: 0.0008, amp: 1 }), tick = fx.hit([[2300, 0.004, 1], [3700, 0.003, 0.6], [1200, 0.006, 0.4]], { width: 0.0004, amp: 1 });
  const lp = GBX.peak(loc), tp = GBX.peak(tick); for (let i = 0; i < loc.length; i++) loc[i] /= lp; for (let i = 0; i < tick.length; i++) tick[i] /= tp;
  for (const [pi, Q] of [BE_CITY.apsA, BE_CITY.apsB].entries()) {
    for (let t = Math.ceil(T0); t < T1 - 0.2; t += 1) { if (t < B.iWalkEnd) continue; const P = _beCityPlace(Q.x, Q.z, beRainEar(t), 1.2, 1.4); if (P.g < 0.01) continue; GBX.mixIn(L, R, loc, at(t), 0.16 * P.g * (pi ? 0.9 : 1), P.pan); }
    for (let k = Math.ceil(T0 / 0.12); k * 0.12 < B.iWalkEnd; k++) { const t = k * 0.12, P = _beCityPlace(Q.x, Q.z, beRainEar(t), 1.2, 1.3); if (P.g < 0.01) continue; GBX.mixIn(L, R, tick, at(t), 0.13 * P.g * (pi ? 0.9 : 1), P.pan); }
  }
  K.putLR(L, R, T0, { vol: 1, room: street, wet: 0.25 });
});

// ================================================================================================= MUSIC
beSound('music', 'rain', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // a celesta drop on each surface's word, falling; a soft open chord under the inserts that grows with "thousands"
  [['pavement', 'A5'], ['metal', 'F#5'], ['leaves', 'E5'], ['umbrellas', 'D5'], ['glass', 'B4']].forEach(([w, nn], k) => M.bell(B.jW[w] + 0.02, nn, 0.42, k % 2 ? 0.3 : -0.3));
  M.strings(B.j3a - 0.4, B.j5 + 0.6, ['G2', 'D3', 'A3', 'B3'], 0.3, { att: 2.0, rel: 1.2, cut: 900, keys: [[B.j4a, 1.0], [B.j4b + 0.6, 1.25]] });
  // "create new sounds": a quick shimmer of drops in the sound view
  ['B5', 'F#5', 'D6', 'A5', 'E6', 'B5', 'F#6', 'D6', 'A5', 'E6', 'B6'].forEach((nn, k) => M.bell(B.j4b + 0.25 + k * 0.21, nn, 0.13 + 0.02 * (k % 3), (k % 2 ? 0.45 : -0.45) * (1 - k / 14)));
  // "doesn't simply reveal a perfect map": the chord clouds; "drown out": a low held tension
  M.strings(B.j5 - 0.2, B.j7 + 0.4, ['E2', 'B2', 'F#3', 'G3'], 0.32, { att: 1.2, rel: 1.4, cut: 600 });
  M.strings(B.j6 - 0.3, B.j7 + 0.3, ['E1', 'B1'], 0.26, { att: 1.0, rel: 1.2, cut: 320 });
  // "every environment has its own acoustic character": an open chord, a note on each zone as it lights
  M.strings(B.j7 - 0.2, B.j8 + 0.6, ['A2', 'E3', 'B3'], 0.3, { att: 0.9, rel: 1.2, cut: 1200 });
  [[0.4, 'E5'], [1.0, 'B5'], [1.6, 'C#6']].forEach(([dt, nn], k) => M.bell(B.j7 + dt, nn, 0.3, [-0.4, 0.1, 0.45][k]));
  // trust / check / slow down: the walking pulse comes back on her steps and slows with them; it settles as she stops
  const sg = BE_HERO_CITY.find((s) => s.p1 && Math.abs(s.t0 - (B.j7 + 0.3)) < 1e-6);
  if (sg) { const notes = ['D3', 'A3', 'E4', 'A3', 'B2', 'F#3', 'D4', 'F#3']; let i = 0;
    for (const h of beActPlan(sg)) { if (h.t0 < B.j8 - 0.1 || h.t0 > sg.t1 - 0.2 || h.t0 <= sg.t0) continue; M.piano(h.t0, notes[i % 8], i % 2 ? 0.07 : 0.09, 1.6, i % 2 ? 0.25 : -0.25, 0.5); i++; } }
  M.strings(B.j8 - 0.3, B.j9 + 1.0, ['D2', 'A2', 'F#3', 'A3'], 0.34, { att: 1.4, rel: 1.6, cut: 900, keys: [[B.jStop - 1.5, 1.0], [B.jStop, 1.15]] });
  M.piano(B.jStop, 'D2', 0.09, 2.6, -0.1, 0.9); M.piano(B.jStop + 0.04, 'A3', 0.07, 2.6, 0.15, 0.9); M.piano(B.jStop + 0.6, 'F#4', 0.06, 2.4, 0.2, 0.9);
});
