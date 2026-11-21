/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience, the effects and the score share (the gravity films'
   sound kit, via the light films and the air-thinner film), and where the camera is. Every function here is listed in
   OC_SOUND_FNS at the end, so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function ocNoise(fx, n, colour = 'white') {
  const y = fx.white(n);
  if (colour === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) { const w = y[i]; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; y[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
  } else if (colour === 'brown') {
    let b = 0; for (let i = 0; i < n; i++) { b = (b + 0.02 * y[i]) / 1.02; y[i] = b * 3.5; }
  }
  return y;
}
// play x through a filter whose frequency follows curve (Hz, evenly spaced over x's length); a biquad whose
// coefficients follow the curve every 32 samples
function ocSweep(x, sr, type, q, curve) {
  const y = new Float32Array(x.length), B = 32, T = { lowpass: 'lp', highpass: 'hp', bandpass: 'bp' }[type] || type;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b1, b2, a1, a2;
  for (let i0 = 0; i0 < x.length; i0 += B) {
    const u = i0 / Math.max(1, x.length - 1) * (curve.length - 1), j = Math.min(curve.length - 2, Math.floor(u)), f = curve[j] + (curve[j + 1] - curve[j]) * (u - j);
    const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
    if (T === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } else if (T === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
    b0 /= a0; b1 /= a0; b2 /= a0; a1 = -2 * cs / a0; a2 = (1 - al) / a0;
    for (let i = i0; i < Math.min(x.length, i0 + B); i++) { const xi = x[i], v = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = xi; y2 = y1; y1 = v; y[i] = v; }
  }
  return y;
}
const ocEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const ocWn = (t, a, b, fi = 0.3, fo = 0.3) => ocEv(t, a - fi, a) * (1 - ocEv(t, b, b + fo));   // 1 inside [a, b]
// a level curve sampled once (200 Hz) and read back by linear interpolation
function ocCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((OC.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}
// is story moment s on screen (the clock doesn't skip it), and when
function ocSeen(s) { const t = ocFilmAt(s); return Math.abs(ocStoryAt(t) - s) < 0.5 ? t : null; }

// ---- where the camera is ------------------------------------------------------------------------------------------
//   rock   out on the island, by the sea (the swell washing the rock, the wind, the gulls early on, the bell buoy)
//   far    a drone's view: the sea wide and even, the wind
//   house  inside your house (the sea muffled through the walls, a clock, the house's own quiet)
//   tower  inside the tower's shaft (a hard tall room: the swell booming on the stone; the lights' hum until the dark;
//          after the door gives, the water churning in the shaft below)
//   top    out on the gallery, 46 m up: the wind loud in the railing, the sea far below (nearer every minute)
//   room   the watch room and the lantern: the water in the room, the lamp's motor, the wind through the glass
//   roof   on the lantern's roof: the wind, the sea slapping at your boots
//   hill   Isla's hilltop, 24 km away: the people, the wind, a siren in the drowned town below
const OC_PLACE = {
  far: ['aerial', 'ocean', 'horizon', 'aerialSea', 'towerOut', 'lastLight', 'section', 'night', 'underBeam', 'question', 'gallery'],
  house: ['radio', 'window', 'binocs', 'kitchen'],
  tower: ['bolt', 'strain', 'burst', 'powerRoom', 'stairsDown', 'climb'],
  top: ['phoneTown', 'coastOut', 'owlPoint', 'ship', 'gallerySea', 'phoneHill', 'phoneLie'],
  room: ['watchRadio', 'watchFlood', 'ladder', 'lens'],
  roof: ['roof', 'phoneLow'],
  hill: ['hill'],
};
function ocWhereShot(sh) { for (const [k, v] of Object.entries(OC_PLACE)) if (v.includes(sh.mode)) return k; return 'rock'; }
// the film as places: [{ t0, t1, where, shot }] in order
function ocPlaces() {
  if (ocPlaces._c) return ocPlaces._c;
  return (ocPlaces._c = OC_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, OC.end + 5), where: ocWhereShot(sh), shot: sh })));
}
// 0…1 over the shots at the given places, with a short crossfade at each cut
function ocPlaceAt(where, xf = 0.05) {
  const ws = [].concat(where), W = ocPlaces().filter((p) => ws.includes(p.where)).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += ocWn(t, a, b, xf, xf); return Math.min(1, v); };
}

// ---- voices -------------------------------------------------------------------------------------------------------
// a voice: glottal pulses at f0(u) through formants [[f, q, a]] (scaled by k), with breath; env(u)
function ocVoice(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), r = fx.r, src = new Float32Array(n), k = o.k || 1, f0 = o.f0 || (() => 300), wv = fx.wander(3);
  let ph = 0; for (let i = 0; i < n; i++) { const u = i / n; ph += f0(u) * k * (1 + 0.025 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += (r.next() * 2 - 1) * (o.breath ?? 0.08); }
  const y = new Float32Array(n), F = o.formants || [[800, 5, 1], [1250, 6, 0.6], [2700, 7, 0.3]];
  for (const [f, q, a] of F) { const z = Float32Array.from(src); OCX.bq(z, 'bp', f * k, q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a; }
  const env = o.env || ((u) => Math.min(1, u / 0.15) * Math.pow(1 - u, 0.8));
  for (let i = 0; i < n; i++) y[i] *= env(i / n);
  return y;
}
const OC_VOWEL = { a: [[730, 6, 1], [1150, 7, 0.55], [2650, 8, 0.25]], o: [[470, 6, 1], [820, 7, 0.5], [2600, 8, 0.15]], e: [[520, 6, 1], [1800, 7, 0.5], [2500, 8, 0.3]], u: [[320, 6, 1], [800, 7, 0.4], [2400, 8, 0.12]], i: [[300, 6, 1], [2200, 7, 0.45], [2950, 8, 0.3]] };
// talk (stereo [L, R], d s): n talkers, each phrases of syllables with pauses; f0 range per talker (o.lo/o.hi), o.pan
// spread; o.urgent shortens the pauses. Unfiltered: the caller gives it its distance (a crowd, a radio).
function ocBabble(fx, d, n, o = {}) {
  const sr = fx.sr, N = Math.ceil(d * sr), L = new Float32Array(N), R = new Float32Array(N), r = fx.r, V = Object.values(OC_VOWEL);
  const env = (u) => Math.min(1, u / 0.18) * Math.min(1, (1 - u) / 0.35);
  for (let k = 0; k < n; k++) {
    const kind = r.next(), f0 = kind < 0.45 ? r.range(95, 140) : kind < 0.85 ? r.range(175, 240) : r.range(250, 320), fk = kind < 0.45 ? 1 : kind < 0.85 ? 1.15 : 1.3;
    const pan = r.range(-1, 1) * (o.pan ?? 0.9), amp = r.range(0.35, 1);
    let t = r.range(0, 2);
    while (t < d - 0.5) {
      const ns = r.int(3, 11); let f = f0 * r.range(0.95, 1.12) * (o.up || 1);
      for (let j = 0; j < ns && t < d - 0.4; j++) {
        const sd = r.range(0.09, 0.22), v = V[r.int(0, V.length - 1)], fj = f, fm = v.map(([ff, q, a]) => [ff * fk * r.range(0.9, 1.1), q, a]);
        const y = ocVoice(fx, sd, { f0: (u) => fj * (1 + 0.07 * Math.sin(Math.PI * u) - 0.05 * u), formants: fm, breath: 0.14, env });
        OCX.mixIn(L, R, y, Math.round(t * sr), amp * r.range(0.55, 1) * (j === ns - 1 ? 0.7 : 1), pan);
        t += sd + r.range(0, 0.06); f *= r.range(0.95, 1.05);
      }
      t += o.urgent ? r.range(0.15, 0.8) : r.range(0.3, 2.2);
    }
  }
  return [L, R];
}

// ---- the sea's and the island's voices -----------------------------------------------------------------------------
// a swell washing up the rock: the rush in (a rising hiss), the crash, the long seething drain back. d (s), o.big
// (a breaking wave: a boom under it), o.bright (0…1)
function ocWash(fx, d = 3.2, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), r = fx.r, z = ocNoise(fx, n, 'pink'), w = fx.white(n), y = new Float32Array(n);
  const tc = d * r.range(0.22, 0.32), br = o.bright ?? 0.6;
  const cut = []; for (let k = 0; k <= 40; k++) { const t = k / 40 * d; cut.push(t < tc ? 400 + 2600 * br * Math.pow(t / tc, 1.5) : 300 + 3000 * br * Math.exp(-(t - tc) / (d * 0.35))); }
  const zf = ocSweep(z, sr, 'lowpass', 0.6, cut);
  OCX.bq(w, 'bp', 3200, 0.5, sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr, e = t < tc ? Math.pow(t / tc, 2.2) : Math.exp(-(t - tc) / (d * 0.32)), fizz = t > tc ? Math.exp(-(t - tc) / (d * 0.55)) * (0.6 + 0.4 * Math.sin(t * 37 + Math.sin(t * 11))) : 0;
    y[i] = zf[i] * e * 1.4 + w[i] * fizz * 0.12 * br;
  }
  if (o.big) { const b = fx.hit([[48, 0.5, 1], [71, 0.35, 0.6], [103, 0.2, 0.35]], { width: 0.02, amp: o.big, len: 2.0 }); for (let i = 0; i < b.length && Math.round(tc * sr) + i < n; i++) y[Math.round(tc * sr) + i] += b[i] * 0.5; }
  for (let i = 0; i < n; i++) y[i] *= Math.min(1, (n - i) / (0.2 * sr));
  return y;
}
// a herring gull: "kee-ow", a falling cry with a rough edge; o.f0
function ocGull(fx, o = {}) {
  const f0 = o.f0 || 1250, d = o.d || 0.42;
  const y = ocVoice(fx, d, { f0: (u) => f0 * (1.15 - 0.5 * u * u) * 0.5, formants: [[f0 * 1.1, 4, 1], [f0 * 2.1, 5, 0.5], [f0 * 3.3, 6, 0.25]], breath: 0.35, env: (u) => Math.min(1, u / 0.05) * Math.pow(1 - u, 0.6) });
  OCX.bq(y, 'hp', 600, 0.7, fx.sr);
  return y;
}
// the fog signal (a diaphone): a reed tone that roars up to pitch, holds, and drops away on its "grunt" at the end.
// d (s), f (Hz), o.choke (0…1): the last blast, the compressor drowning: the pitch sags and the air bubbles out
function ocFoghorn(fx, d, f = 96, o = {}) {
  const sr = fx.sr, n = Math.ceil((d + 1.2) * sr), y = new Float32Array(n), r = fx.r, wv = fx.wander(4), ch = o.choke || 0;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, up = Math.min(1, t / 0.45), held = t < d ? 1 : Math.max(0, 1 - (t - d) / 0.9);
    const sag = ch * Math.pow(Math.max(0, t / d), 2.5) * 0.35, grunt = t > d - 0.25 ? 0.62 + 0.38 * Math.max(0, (d + 0.4 - t) / 0.65) : 1;
    const fr = f * (0.72 + 0.28 * Math.pow(up, 0.6)) * grunt * (1 - sag) * (1 + 0.006 * wv(t) * (1 + 6 * ch));
    ph += fr / sr; const p = ph - Math.floor(ph);
    // a reed's pulse: a buzzy, bright wave; it softens and dulls as it chokes
    const v = (Math.pow(Math.sin(Math.PI * p), 6) - 0.25) + 0.35 * Math.sin(2 * Math.PI * ph * 0.5);
    y[i] = v * Math.pow(up, 0.8) * held * (1 - 0.5 * ch * Math.max(0, t / d));
  }
  OCX.bq(y, 'lp', 1400 - 600 * ch, 0.8, sr); OCX.bq(y, 'peak', f * 3, 2.0, sr, 4); OCX.bq(y, 'hp', 40, 0.7, sr);
  if (ch) { const L = new Float32Array(n), R = new Float32Array(n); for (let t = d * 0.5; t < d + 1; t += r.range(0.02, 0.07)) fx.bubble(L, R, Math.round(t * sr), r.range(120, 420), r.range(0.02, 0.05), 0.35 * ch, 0); for (let i = 0; i < n; i++) y[i] += L[i] + R[i]; }
  return y;
}
// a flood siren far off (a two-tone wail rising and falling); d (s)
function ocSiren(fx, d) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / sr, f = 420 + 260 * (0.5 - 0.5 * Math.cos(2 * Math.PI * t / 9)); ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * Math.min(1, t / 1.5, (d - t) / 1.5); }
  OCX.bq(y, 'lp', 1500, 0.7, sr);
  return y;
}
// a ship's horn far off: one long low blast (two reeds a fifth apart), d (s)
function ocShipHorn(fx, d, f = 70) {
  const sr = fx.sr, n = Math.ceil((d + 0.6) * sr), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / sr, e = Math.min(1, t / 0.25) * (t < d ? 1 : Math.max(0, 1 - (t - d) / 0.5)); let v = 0; for (const [ff, a] of [[f, 1], [f * 1.5, 0.6]]) for (let h = 1; h <= 9; h++) v += a * Math.sin(2 * Math.PI * ff * h * t + h) / Math.pow(h, 1.2); y[i] = Math.tanh(v * 0.9) * e; }
  OCX.bq(y, 'lp', 700, 0.7, sr);
  return y;
}
// static on a radio: crackle and hiss, band-limited; d (s)
function ocStatic(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = fx.white(n), r = fx.r, wv = fx.wander(6);
  for (let i = 0; i < n; i++) y[i] *= 0.3 + 0.25 * wv(i / sr);
  for (let t = 0; t < d; t += r.range(0.005, 0.06)) { const i0 = Math.round(t * sr), a = r.range(0.4, 1.6); for (let j = 0; j < 40 && i0 + j < n; j++) y[i0 + j] += a * (r.next() * 2 - 1) * Math.exp(-j / 8); }
  OCX.bq(y, 'bp', o.f || 1600, 0.45, sr); OCX.bq(y, 'lp', 3400, 0.7, sr); OCX.bq(y, 'hp', 300, 0.7, sr);
  return y;
}
// a voice on the radio (a garbled call: "…all stations… mayday…"): talk through the radio's band, clipped
function ocRadioVoice(fx, d, o = {}) {
  const [L] = ocBabble(fx, d, 1, { pan: 0, urgent: true, up: o.up || 1 }), sr = fx.sr;
  OCX.bq(L, 'hp', 420, 0.7, sr); OCX.bq(L, 'lp', 2800, 0.7, sr); OCX.bq(L, 'peak', 1500, 1.2, sr, 6);
  const pk = OCX.peak(L) || 1; for (let i = 0; i < L.length; i++) L[i] = Math.tanh(2.2 * L[i] / pk) * 0.6;
  return L;
}

const OC_SOUND_FNS = [ocNoise, ocSweep, ocEv, ocWn, ocCurve, ocSeen, ocWhereShot, ocPlaces, ocPlaceAt, ocVoice, ocBabble, ocWash, ocGull, ocFoghorn, ocSiren, ocShipHorn, ocStatic, ocRadioVoice];
window.OC_SOUND_FNS = OC_SOUND_FNS;
