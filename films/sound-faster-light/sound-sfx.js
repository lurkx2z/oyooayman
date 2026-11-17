/* =====================================================================
   SOUND · EFFECTS — what happens, heard by YOU. Before 8:52:00 the world is the old one: in stereo, with the yard's
   echo, and its thunder late and rolling. From 8:52:00 every sound of the world arrives the instant it is made, from
   everywhere at once: mono, dry, in the middle of your head, and every thunder lands with its flash as one blow.
     the title: her boots on the wet lawn, the dog barking in the corn, her call (with its echo off the barn), an old
       thunder rolling in late · 8:52:00: nine thunders at once
     every strike after: its whole thunder in one blow, with the flash (a crack only when it's near)
     your steps; your call (no echo); her voice (everywhere, as loud as if she were beside you)
     the ears: a click arriving left then right (0.66 thousandths of a second), then both at once (a diagram's sound)
     the freight train's horn 11 km off and the Hansens' dogs 1.4 km off, at the same instant
     the bats: wings, and the ones that fly into the windmill, the yard light, the house, the barn; the one at your face
     the town's tornado sirens (6 km, the instant they start); the sheriff's car: its siren never drops in pitch
     the phone: the keys, her ringtone (as if in your pocket), her voice first through the air, then through the phone
     the run: your steps in the corn, the leaves, your breath; the yard light hit: the loudest sound in the film
     the Hansen farm coming apart, at the instant it happens · the dog, her crying · the last strikes
   ===================================================================== */

// ---- generators ---------------------------------------------------------------------------------------------------
// thunder. o.d (m), o.strokes [[dt, a]] (the return strokes), o.roll (s: the old world's rumble as the channel's parts
// arrive one after another; 0 now), o.tail (s), o.crack (0…1), o.low (pitch scale of the boom), o.lp
function sfThunder(fx, o = {}) {
  const sr = fx.sr, r = fx.r, km = Math.max(0.01, (o.d ?? 1000) / 1000), roll = o.roll || 0, tail = o.tail ?? 1.4, n = Math.ceil((tail + roll + 0.25) * sr), y = new Float32Array(n);
  const near = Math.min(1, 1.5 / km) * (o.crack ?? 1), strokes = o.strokes || [[0, 1]];
  for (const [dt, a] of strokes) {
    const i0 = Math.round(dt * sr);
    // the crack: a burst of N-waves from the channel's kinks (tearing cloth); a near strike's
    if (near > 0.06) { const nc = 6 + r.int(0, 14), span = 0.015 + 0.05 * r.next();
      for (let c = 0; c < nc; c++) { const j = i0 + Math.round(Math.pow(r.next(), 1.5) * span * sr), w = Math.max(2, Math.round(r.range(0.0003, 0.0018) * sr)), A = a * near * r.range(0.25, 1) * (c === 0 ? 1.4 : 1);
        for (let i = 0; i < 2 * w && j + i < n; i++) y[j + i] += A * (1 - i / w); } }
    // the boom: the channel's low N-waves together, a heavy thump falling in pitch
    { const f0 = r.range(42, 62) * (o.low ?? 1), tau = r.range(0.25, 0.45) * (1 + 0.4 * Math.min(2, km)); let ph = r.next() * 6.28;
      for (let i = 0; i + i0 < n; i++) { const t = i / sr, e = Math.min(1, t / 0.006) * Math.exp(-t / tau); if (e < 1e-4 && t > 0.1) break; ph += 2 * Math.PI * f0 * (1 - 0.35 * Math.min(1, t / 0.6)) / sr; y[i0 + i] += a * 0.9 * e * Math.sin(ph); } }
  }
  // the body: low noise shaped by the strokes; in the old world, the long roll (swells as each part of the channel arrives)
  const z = fx.white(n); let b = 0; for (let i = 0; i < n; i++) { b = (b + 0.02 * z[i]) / 1.02; z[i] = b * 3.5; }
  const sw = []; if (roll) for (let k = 0; k < Math.ceil(roll * 2.5); k++) sw.push([r.range(0, roll), r.range(0.3, 1), r.range(0.2, 0.9)]);
  for (let i = 0; i < n; i++) { const t = i / sr; let e = 0;
    for (const [dt, a] of strokes) { const u = t - dt; if (u >= 0) e = Math.max(e, a * Math.min(1, u / 0.01) * Math.exp(-u / (0.3 + 0.2 * km))); }
    for (const [t1, a, w] of sw) { const u = (t - t1) / w; e += a * 0.7 * Math.exp(-u * u); }
    if (roll) e *= 1 - MathX.smooth(t, roll + tail * 0.3, roll + tail);
    y[i] += z[i] * e * 1.4; }
  SFX.bq(y, 'lp', Math.max(160, (o.lp || 9000) / (1 + km * 1.6)), 0.7, sr); SFX.bq(y, 'hp', 22, 0.7, sr);
  for (let i = n - Math.round(0.05 * sr); i < n; i++) y[i] *= (n - i) / (0.05 * sr);
  return y;
}
// a dog's bark: a short voiced burst through a dog's mouth; o.f0, o.k (size: bigger = lower)
function sfBark(fx, o = {}) {
  const k = o.k || 1, d = (o.d || 0.16) * k;
  return sfVoice(fx, d, { f0: (u) => (o.f0 || 520) / k * (1.15 - 0.4 * u), formants: [[750 / k, 4, 1], [1500 / k, 5, 0.65], [2900 / k, 6, 0.3]], breath: 0.35, env: (u) => Math.min(1, u / 0.06) * Math.pow(1 - u, 1.6) });
}
// a child's voice (higher, brighter); her calls are sfCall with k ≈ 1.25
const sfKid = (fx, o = {}) => sfCall(fx, Object.assign({ f0: 330, d: 0.7, up: 1.15, k: 1.25 }, o));
// a freight train's horn: five reeds, a long blast, d (s)
function sfFreightHorn(fx, d) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), F = [277, 311, 370, 415, 554];
  for (let i = 0; i < n; i++) { const t = i / sr, e = Math.min(1, t / 0.08, (d - t) / 0.12); let v = 0; for (const f of F) v += Math.sin(2 * Math.PI * f * t * (1 + 0.002 * Math.sin(t * 5))) + 0.3 * Math.sin(6 * Math.PI * f * t); y[i] = Math.tanh(0.8 * v) * e; }
  SFX.bq(y, 'lp', 1600, 0.7, sr); return y;
}
// an outdoor warning siren (the town's): it winds up, then wails steady; the horn rotating makes it swell and fade
function sfTornadoSiren(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), up = o.up || 5, rot = o.rot || 9;
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / sr, f = 140 + 330 * Math.pow(Math.min(1, t / up), 0.6), e = Math.min(1, t / 0.4, (d - t) / 0.4) * (0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * t / rot), 1.5));
    ph += f / sr; const p = ph - Math.floor(ph); y[i] = (Math.sin(2 * Math.PI * p) + 0.55 * Math.sin(4 * Math.PI * p + 0.4) + 0.3 * (2 * p - 1)) * e; }
  SFX.bq(y, 'lp', 1900, 0.7, sr); SFX.bq(y, 'hp', 120, 0.7, sr); return y;
}
// a police siren: a wail (rising and falling over ~3.4 s), then a yelp; the pitch NEVER shifts with the car's motion
function sfPoliceSiren(fx, d, env) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / sr, yelp = t > d * 0.55, c = yelp ? 0.5 + 0.5 * Math.sin(2 * Math.PI * t * 3.2) : 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 3.4), f = 680 + 700 * c;
    ph += f / sr; const p = ph - Math.floor(ph); y[i] = (Math.sin(2 * Math.PI * p) + 0.35 * Math.sin(6 * Math.PI * p)) * env(t); }
  SFX.bq(y, 'bp', 1200, 0.6, sr); return y;
}
// a phone's ringtone (an original marimba phrase), repeated for d seconds
function sfRingtone(fx, d) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), notes = [76, 79, 83, 79, 81, 76, 79, 74], step = 0.16;
  for (let t0 = 0, j = 0; t0 < d - 0.1; t0 += j % 8 === 7 ? step + 0.75 : step, j++) {
    const f = 440 * Math.pow(2, (notes[j % 8] - 69) / 12), i0 = Math.round(t0 * sr);
    for (let i = 0; i < 0.5 * sr && i0 + i < n; i++) { const t = i / sr; y[i0 + i] += (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 3.9 * t) * Math.exp(-t / 0.02)) * Math.exp(-t / 0.13) * Math.min(1, t / 0.002); }
  }
  for (let i = 0; i < n; i++) y[i] *= Math.min(1, (n - i) / (0.03 * sr));
  return y;
}
// keypad tones (DTMF) for a list of digits
function sfDTMF(fx, digits) {
  const sr = fx.sr, R = [697, 770, 852, 941], C = [1209, 1336, 1477], K = { 1: [0, 0], 2: [0, 1], 3: [0, 2], 4: [1, 0], 5: [1, 1], 6: [1, 2], 7: [2, 0], 8: [2, 1], 9: [2, 2], 0: [3, 1] };
  const y = fx.arr(digits.length * 0.16 + 0.05);
  digits.split('').forEach((dg, j) => { const [a, b] = K[dg]; const i0 = Math.round(j * 0.16 * sr); for (let i = 0; i < 0.1 * sr; i++) { const t = i / sr; y[i0 + i] += 0.5 * (Math.sin(2 * Math.PI * R[a] * t) + Math.sin(2 * Math.PI * C[b] * t)) * Math.min(1, t / 0.004, (0.1 - t) / 0.004); } });
  return y;
}
// many wings: bats pouring out (a soft, fast flutter); env(t)
function sfFlutter(fx, d, env) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = fx.rustle(d, { density: 1800, rub: 0.35, lo: 900, hi: 6000, grain: 0.003, env: () => 1 }), w = fx.wander(2);
  for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= env(t) * (0.55 + 0.45 * Math.sin(2 * Math.PI * 11 * t + 3 * w(t))) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 7.3 * t)); }
  return y;
}
// a step on wet grass (soft thump, a squelch) / in the corn (the thump, leaves slapping legs and arms)
function sfGrassStep(fx, o = {}) {
  const y = fx.hit([[70, 0.04, 1], [130, 0.025, 0.5], [260, 0.012, 0.3]], { width: 0.006, amp: o.w || 0.6, noise: 0.15, nlen: 0.015, nhp: 900, len: 0.35 });
  const q = fx.rustle(0.12, { density: 1200, rub: 0.3, lo: 1500, hi: 7000, grain: 0.002, env: (u) => Math.exp(-u * 4) });
  for (let i = 0; i < q.length && i < y.length; i++) y[i] += q[i] * 0.3 * (o.w || 0.6);
  return y;
}
function sfCornStep(fx, o = {}) {
  const y = sfGrassStep(fx, { w: 0.8 }), r = fx.r, q = fx.rustle(0.35, { density: 900, rub: 0.55, lo: 800, hi: 6500, grain: 0.005, env: (u) => Math.min(1, u / 0.08) * Math.pow(1 - u, 1.5) });
  const z = new Float32Array(Math.max(y.length, q.length)); for (let i = 0; i < z.length; i++) z[i] = (y[i] || 0) + (q[i] || 0) * (o.leaf ?? 0.8) * r.range(0.6, 1);
  return z;
}
// wood or tin tearing apart: a fast stick-slip through the material's modes; o.metal, d (s)
function sfTear(fx, d, o = {}) {
  const modes = o.metal ? fx.metalModes(o.f || 380, 0.5) : fx.woodModes(o.f || 160, 1.4);
  return fx.creak(d, modes, { rate: o.metal ? [300, 900] : [90, 260], jit: 0.6, env: (u) => Math.min(1, u / 0.05) * Math.pow(1 - u, 0.8) * (0.5 + 0.5 * Math.sin(u * 23)) });
}
// sparks: a hiss and a crackle, fizzing out over d
function sfFizz(fx, d) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = sfCrackle(fx, d, { rate: 60 }), h = fx.white(n);
  SFX.bq(h, 'hp', 3500, 0.7, sr);
  for (let i = 0; i < n; i++) { const t = i / sr, e = Math.exp(-t / (d * 0.3)); y[i] = (y[i] * 1.2 + h[i] * 0.3) * e * Math.min(1, t / 0.005); }
  return y;
}
// a stereo {L, R} folded to mono (the world is in the middle of your head now)
const sfMono = (g) => { const y = new Float32Array(g.L.length); for (let i = 0; i < y.length; i++) y[i] = 0.5 * (g.L[i] + g.R[i]); return y; };
// a dog's whimper: a thin, falling whine
const sfWhimper = (fx, o = {}) => sfVoice(fx, o.d || 0.55, { f0: (u) => (o.f0 || 950) * (1.05 - 0.3 * u), formants: [[1100, 6, 1], [2300, 7, 0.4]], breath: 0.15, env: (u) => Math.min(1, u / 0.12) * Math.pow(1 - u, 1.2) });

sfSound('sfx', 'events', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, T0 = SF.tOn, END = SF.end, F = sfFilmAt, E = SFE, seen = sfSeen, r = new RNG(CONFIG.seed + 9100);
  const open = K.verb('yard', 2.6, { bright: 0.4, damp: 2.4, wet: 0.5, pre: 0.02, early: [[0.35, 0.22], [0.52, 0.1]] });
  // a world sound from 8:52:00 on: mono, dry, centred, at story time s (if the film shows that moment)
  const now = (x, s, vol, o = {}) => { const t = seen(s); if (t == null || t > END + 0.5) return; K.put(x, t, Object.assign({ vol, norm: true, pan: 0 }, o)); };
  // the old world (the title): panned, with the yard's echo
  const old = (x, t, vol, pan, wet = 0.4) => K.put(x, t, { vol, norm: true, pan, room: open, wet });

  // ================================================================== the title: the old world
  // her boots on the wet lawn (she runs into the corn just after the boom)
  for (let s = -4.6; s < 0.8; s += 0.29 + 0.02 * Math.sin(s * 7)) { const t = F(s); if (t < -0.5) continue; old(sfGrassStep(fx, { w: 0.5 }), t, 0.05 * (s < 0 ? 1 : 0), r.range(-0.15, 0.15), 0.2); }
  // the dog barking in the corn ahead; she calls him ("Bis-cuit!"); each with the barn's echo
  for (const [t, pan] of [[-0.6, 0.15], [0.55, 0.25], [1.75, 0.1], [2.85, 0.2]]) { old(sfBark(fx, { f0: 560, k: 1 }), t, 0.09, pan, 0.6); old(sfBark(fx, { f0: 600, k: 1 }), t + 0.2, 0.07, pan, 0.6); }
  old(sfKid(fx, { f0: 340, d: 0.62, up: 1.2, v1: 'e', v2: 'u' }), 1.1, 0.12, 0.05, 0.5);
  old(sfKid(fx, { f0: 360, d: 0.55, up: 1.25, v1: 'e', v2: 'u' }), 2.35, 0.1, 0.0, 0.5);
  // the old thunder: strikes from before, heard late, rolling for seconds
  for (const k of SF_STRIKES) {
    if (k.s >= 0 || k.inAir || k.heard < -8) continue;
    const t = F(k.heard); if (t > T0) continue;
    const y = sfThunder(fx, { d: k.d, strokes: k.pulses, roll: Math.min(8, k.len / SFP.c0 * 0.8), tail: 2.5, crack: 0.3 });
    const cut = Math.round((T0 - t) * sr); for (let i = Math.max(0, cut); i < y.length; i++) y[i] *= Math.max(0, 1 - (i - cut) / (0.012 * sr));   // (the stereo world ends at 8:52:00)
    old(y, t, 0.3 * Math.min(1, 5000 / k.d), r.range(-0.7, 0.7), 0.6);
  }

  // ================================================================== 8:52:00: nine thunders at once
  { const air = SF_STRIKES.filter((k) => k.inAir), n = Math.ceil(3.2 * sr), y = new Float32Array(n);
    air.forEach((k, i) => { const x = sfThunder(fx, { d: Math.max(900, k.d * 0.5), strokes: k.pulses, tail: 2.6, crack: 0.8, low: 0.85 }), i0 = Math.round(0.004 * i * sr), g = 0.7 + 0.3 * Math.min(1, 6000 / k.d); for (let j = 0; j < x.length && i0 + j < n; j++) y[i0 + j] += x[j] * g; });
    K.put(y, T0, { vol: 0.95, norm: true, pan: 0 }); }

  // ================================================================== every strike after: its whole thunder in one blow, with the flash
  for (const k of SF_STRIKES) {
    if (k.s < 0 || k.key === 'yard') continue;
    const t = seen(k.s); if (t == null || t > END + 0.2) continue;
    const ic = k.kind === 'ic', long = k.key === 'long';
    const y = sfThunder(fx, { d: long ? SFP.longBolt.near : k.d, strokes: k.pulses, tail: long ? 2.4 : ic ? 1.8 : 1.4, crack: ic ? 0.35 : long ? 0.7 : 1, low: long ? 0.8 : 1 });
    const v = (long ? 0.95 : 0.75) * Math.min(1, Math.pow(1600 / k.d, 0.55)) * Math.min(1.2, 0.6 + 0.4 * k.amp);
    K.put(y, t, { vol: v, norm: true, pan: 0 });
  }

  // ================================================================== your steps (the walk to the corn, along it and back)
  for (const [a, b] of [E.walk, E.away, E.back]) for (const f of sfFootfalls(SFY, a, b, 0.78)) now(sfGrassStep(fx, { w: 0.5 }), f.s, 0.035);

  // ================================================================== your call: no echo
  now(sfCall(fx, { f0: 150, d: 0.95, up: 0.86, v1: 'a', v2: 'e', k: 1 }), E.call + 0.05, 0.2);
  // ================================================================== her voice: everywhere, as loud as if beside you (quieter only when you walk away)
  { const youD = (s) => { const y = SFY.at(s), p = SF_PLACES.kid; return Math.hypot(y.x - p[0], y.z - p[1]); }, d0 = youD(E.answer);
    const calls = [[E.answer, 'a', 'a', 1.1], [E.answer + 1.9, 'e', 'e', 1.25], [E.answer + 6.2, 'a', 'e', 1.2], [E.answer + 14.5, 'a', 'a', 1.1], [E.answer + 22.0, 'e', 'o', 1.2], [E.answer + 30.5, 'a', 'a', 1.15],
      [E.away[0] + 1.6, 'a', 'e', 1.2], [E.away[0] + 5.2, 'a', 'a', 1.1], [E.back[0] + 4, 'a', 'a', 1.15], [E.back[0] + 11, 'e', 'e', 1.2]];
    for (const [s, v1, v2, up] of calls) now(sfKid(fx, { f0: r.range(320, 360), d: r.range(0.55, 0.75), up, v1, v2 }), s, 0.15 * Math.min(1.2, d0 / youD(s))); }

  // ================================================================== the ears: a click arriving left, then right (0.66 thousandths), then both at once
  { const t1 = sfC('ears', 0) + 1.6, t2 = sfC('ears', 1) + 1.2, c = fx.hit([[2400, 0.006, 1], [5200, 0.003, 0.5]], { width: 0.0002, amp: 1, len: 0.05 }), dl = Math.round(SFP.itd0 * sr);
    for (let j = 0; j < 3; j++) { const L = new Float32Array(c.length + dl), R = new Float32Array(c.length + dl); L.set(c, 0); R.set(c, dl); K.putLR(L, R, t1 + j * 0.55, { vol: 0.08, norm: true }); }
    for (let j = 0; j < 3; j++) K.put(c, t2 + j * 0.55, { vol: 0.08, norm: true, pan: 0 }); }

  // ================================================================== far: the freight train's horn (11 km) and the Hansens' dogs (1.4 km), at once
  now(sfFreightHorn(fx, 1.9), E.train, 0.14); now(sfFreightHorn(fx, 2.6), E.train + 2.35, 0.14);
  for (const [dt, f, k] of [[0, 480, 1.3], [0.32, 520, 1.3], [0.9, 640, 1.0], [1.15, 470, 1.3], [1.8, 620, 1.0]]) now(sfBark(fx, { f0: f, k }), E.dogs + dt, 0.07, { lp: 2600 });

  // ================================================================== the bats: wings pouring out; the ones that fly into things
  { const s0 = E.bats, d = 17, t0 = seen(s0);
    if (t0 != null) K.put(sfFlutter(fx, d, (t) => Math.min(1, t / 1.5) * (1 - MathX.smooth(t, d - 5, d)) * (0.6 + 0.4 * Math.sin(t * 0.7))), t0, { vol: 0.05, norm: true, pan: 0 });
    for (const b of SFBAT) { if (!b.crash) continue; const metal = /windmill|yard light/.test(b.at);
      const x = metal ? fx.hit(fx.metalModes(r.range(1500, 2400), 0.3), { width: 0.0004, amp: 1, noise: 0.3, nlen: 0.004, nhp: 2500, len: 0.5 }) : fx.hit(fx.woodModes(r.range(250, 400), 0.6), { width: 0.002, amp: 1, noise: 0.2, len: 0.3 });
      now(x, b.crash, metal ? 0.07 : 0.06); now(sfVoice(fx, 0.05, { f0: () => 3200, formants: [[4200, 8, 1]], breath: 0.1 }), b.crash + 0.01, 0.03); }
    // the one at your face: wings right at you, your gasp
    now(sfFlutter(fx, 0.9, (t) => Math.sin(Math.PI * Math.min(1, t / 0.9))), E.batYou - 0.35, 0.16);
    now(fx.breath(0.5, { inhale: true, voice: 0.3, f0: 160 }), E.batYou + 0.05, 0.12); }

  // ================================================================== the town's tornado sirens (6 km), from the instant they start, to the end
  { const t0 = seen(E.siren); if (t0 != null) K.put(sfTornadoSiren(fx, END + 0.5 - t0, { up: 5, rot: 9 }), t0, { vol: 0.05, norm: true, pan: 0, lp: 2200 }); }
  // ================================================================== the sheriff's car: its siren (no drop in pitch), its engine and tyres
  { const sA = E.sheriff - 9, d = 18, t0 = seen(sA);
    if (t0 != null) {
      const lv = (t) => { const c = SFC.at(sA + t), y = SFY.at(sA + t), dd = Math.hypot(c.x - y.x, c.z - y.z); return Math.min(1, 40 / (20 + dd)) * Math.min(1, t / 0.5, (d - t) / 0.5); };
      K.put(sfPoliceSiren(fx, d, lv), t0, { vol: 0.13, norm: true, pan: 0 });
      const en = sfEngine(fx, d, (t) => 2100 + 300 * Math.sin(t * 0.4)), ty = sfNoise(fx, Math.ceil(d * sr), 'pink'); SFX.bq(ty, 'bp', 900, 0.5, sr);
      for (let i = 0; i < en.length; i++) { const t = i / sr, e = lv(t) * lv(t); en[i] = en[i] * e + ty[i] * 0.4 * e; }
      K.put(en, t0, { vol: 0.07, norm: true, pan: 0 }); } }

  // ================================================================== the phone: the keys, her ringtone (as if in your pocket), her voice twice
  { now(sfDTMF(fx, '5155550142'), E.dial + 0.15, 0.05);
    const tr = E.dial + 2.0, tp = E.pickUp;
    now(sfRingtone(fx, tp - tr - 0.05), tr, 0.12);
    // she answers: her voice through the air (at once), then the same words out of your phone a quarter of a second later
    const lines = [[tp + 0.25, 0.5, 1.25, 'a', 'e'], [tp + 2.2, 0.75, 0.9, 'e', 'o'], [tp + 4.4, 0.65, 1.1, 'a', 'a'], [tp + 7.8, 0.8, 0.95, 'e', 'u']];
    for (const [s, dd, up, v1, v2] of lines) { const v = sfKid(fx, { f0: r.range(330, 370), d: dd, up, v1, v2 }); now(v, s, 0.13);
      const p = Float32Array.from(v); SFX.bq(p, 'hp', 350, 0.7, sr); SFX.bq(p, 'lp', 3200, 0.7, sr); for (let i = 0; i < p.length; i++) p[i] = Math.tanh(p[i] * 3) / 3; now(p, s + 0.26, 0.06); } }

  // ================================================================== the run: your steps in the corn, the leaves, your breath
  { for (const f of sfFootfalls(SFY, E.run, SFY.runEnd, 1.15)) now(sfCornStep(fx, { leaf: 0.6 + 0.4 * r.next() }), f.s, 0.07);
    for (let s = E.run + 0.3, j = 0; s < SFY.runEnd + 2.5; s += 0.46 + 0.04 * Math.sin(j), j++) now(fx.breath(0.36, { inhale: j % 2 === 0, voice: j % 2 ? 0.25 : 0.1, f0: 150 }), s, 0.05);
    // her voice as you run: as loud as if she were beside you (she's 90 m away)
    for (const ds of [4.5, 9.5, 14.2, 22.5, 27.5, 37.0, 46.0, 52.0]) { const s = E.run + ds; if (s > E.found) break; now(sfKid(fx, { f0: r.range(330, 380), d: r.range(0.5, 0.75), up: r.range(1.1, 1.3), v1: 'a', v2: r.next() < 0.5 ? 'a' : 'e' }), s, 0.14); } }

  // ================================================================== the yard light: the loudest sound in the film, with its flash
  { const s = E.yardHit;
    now(sfThunder(fx, { d: 12, strokes: SF_STRIKES.find((k) => k.key === 'yard').pulses, tail: 2.2, crack: 1, low: 0.9 }), s, 1.0);
    { const g = fx.smash({ v: 7, len: 2.0, pitch: 0.8 }); now(sfMono(g), s + 0.01, 0.35); }
    now(sfFizz(fx, 3.0), s + 0.05, 0.12); }

  // ================================================================== the Hansen farm comes apart (1.3 km), at the instant it happens
  { const s = E.hansen;
    now(sfTear(fx, 2.6, { f: 140 }), s - 0.1, 0.16); now(sfTear(fx, 2.0, { metal: true, f: 300 }), s + 0.4, 0.12); now(sfTear(fx, 1.6, { f: 210 }), s + 1.6, 0.12);
    for (let j = 0; j < 7; j++) now(fx.hit(fx.woodModes(r.range(90, 180), 1.6), { width: 0.004, amp: 1, noise: 0.25, len: 0.6 }), s + r.range(0, 4.5), 0.1 * r.range(0.6, 1), { lp: 2200 });
    now(sfMono(fx.smash({ v: 5, len: 1.5, pitch: 1.1 })), s + 0.8, 0.07, { lp: 3000 }); }

  // ================================================================== found: the dog, her crying, the hug
  { const s = E.found;
    now(sfWhimper(fx, { f0: 980 }), s + 0.7, 0.07); now(sfWhimper(fx, { f0: 900, d: 0.7 }), s + 2.6, 0.06);
    now(sfKid(fx, { f0: 380, d: 0.6, up: 1.25, v1: 'a', v2: 'a' }), s + 1.5, 0.15);
    for (let j = 0; j < 6; j++) now(fx.breath(0.42, { inhale: j % 2 === 0, voice: 0.45, f0: 330 }), E.hold - 0.6 + j * 0.62, 0.06);
    now(fx.rustle(1.1, { density: 500, rub: 0.6, lo: 500, hi: 4000, grain: 0.008 }), E.hold - 0.2, 0.05); }
});
SF_SOUND_FNS.push(sfThunder, sfBark, sfKid, sfFreightHorn, sfTornadoSiren, sfPoliceSiren, sfRingtone, sfDTMF, sfFlutter, sfGrassStep, sfCornStep, sfTear, sfFizz, sfWhimper);
