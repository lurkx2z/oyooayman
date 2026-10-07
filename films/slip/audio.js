/* =====================================================================
   SOUNDTRACK — "What happens if you slip and fall?"
   A serious documentary score that escalates link by link, and the sound
   of each link. Synthesised offline (AudioEngine + SoundKit).
     0–3.8     rain, wet footsteps, a car hissing past; a quiet piano line
     3.3–3.8   the squeak of a shoe on wet steel, the fall, the THUD
     3.8–4.7   silence (rain only)
     4.7–7.4   breath, a low drone, one piano note; the ring; down
     7.4–17.4  underground: muffled rain, a deep tone, a ping for the ring,
               slow pulses; the pebble's tiny dry click; it drops; a hollow boom
     17.4–24.6 the fault: creaking stress, a crack (0.2 mm), the rupture — a
               long tearing rumble, drums accelerating with the magnitude
     24.6–32   the quake: sub rumble, rattling, glass, car alarms, falling stone
     32–39.2   the planet: wide and quiet, a low choir; a soft tick; a swell
     39.2–52.6 the coast: wind, the sea draining away, boats creaking, ticking
               tension; the distant rumble, sirens
     52.6–59.6 the run: drums, brass, the wave's roar, breathing, splashing
     59.6      the impact — then total silence; one drop of rain under the last line
   ===================================================================== */

class SlAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  fingerprintData() { return [SL, SL_WAVE, SL_DRAIN, 3]; }

  _build(ctx) {
    const S = new SoundKit(ctx, 2026), END = CONFIG.duration + 1.0, T = SL;
    const out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.25; comp.connect(out);
    const rev = S.reverb(2.8), revG = ctx.createGain(); revG.gain.value = 0.32; rev.connect(revG);
    const bus = (g, r = 0, dest = comp) => { const b = ctx.createGain(); b.gain.value = g; b.connect(dest); if (r) { const s = ctx.createGain(); s.gain.value = r; b.connect(s); s.connect(rev); } return b; };
    // everything is cut by one master gate at the impact (total silence after it)
    const gate = ctx.createGain(); gate.connect(comp);
    gate.gain.setValueAtTime(1, 0); gate.gain.setValueAtTime(1, T.impact + 0.06); gate.gain.linearRampToValueAtTime(0, T.impact + 0.12);
    revG.connect(gate);   // (the reverb tail is cut too)
    const musG = ctx.createGain(); musG.connect(gate);
    const mus = bus(0.52, 0.3, musG), drums = bus(0.55, 0.12, musG), fx = bus(0.9, 0.25, gate), amb = bus(0.85, 0.1, gate);
    // the rain bed goes muffled underground and away in the fault and in space
    const ambLP = S.filter('lowpass', 9000, 0.7), ambG = ctx.createGain(); ambLP.connect(ambG); ambG.connect(amb);
    const lin = (p, pts) => { p.setValueAtTime(pts[0][1], 0); for (const [t, v] of pts) p.linearRampToValueAtTime(v, t); };
    lin(musG.gain, [[0, 0], [0.4, 0.75], [3.75, 0.75], [3.8, 0], [4.9, 0], [5.6, 0.7], [60, 1], [END, 1]]);
    lin(ambG.gain, [[0, 0.9], [7.3, 0.9], [7.45, 0.45], [17.3, 0.45], [17.45, 0], [24.55, 0], [24.6, 0.8], [31.9, 0.8], [32.0, 0], [39.1, 0], [39.3, 0.8], [END, 0.8]]);
    ambLP.frequency.setValueAtTime(9000, 0); ambLP.frequency.setValueAtTime(9000, 7.35); ambLP.frequency.exponentialRampToValueAtTime(380, 7.5); ambLP.frequency.setValueAtTime(380, 24.5); ambLP.frequency.setValueAtTime(9000, 24.6);

    /* ---------------- instruments ---------------- */
    const osc = (type, f, t0, t1) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.start(t0); o.stop(t1); return o; };
    const env = (t, a, peak, d, hold = 0) => { const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); if (hold) g.gain.setValueAtTime(peak, t + a + hold); g.gain.setTargetAtTime(0, t + a + hold, Math.max(0.003, d / 4)); return g; };
    const noiseHit = (t, dur, type, f, q, vol, dest, noise = 'white', pan = 0, a = 0.002, f1 = null) => {
      const n = S.noise(noise, t, t + dur + 0.2), b = S.filter(type, f, q), g = env(t, a, vol, dur);
      if (f1) { b.frequency.setValueAtTime(f, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur); }
      n.connect(b); b.connect(g); g.connect(S.panned(dest, pan));
    };
    const noiseBed = (t0, t1, type, f, q, vol, dest, noise = 'pink', fa = 0.5, fr = 0.5, pan = 0) => {
      const n = S.noise(noise, t0, t1 + 0.05), b = S.filter(type, f, q), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + fa); g.gain.setValueAtTime(vol, Math.max(t0 + fa, t1 - fr)); g.gain.linearRampToValueAtTime(0, t1);
      n.connect(b); b.connect(g); g.connect(S.panned(dest, pan)); return { b, g };
    };
    const sub = (t, f0, f1, vol, dec, dest) => { const o = osc('sine', f0, t, t + dec * 1.8 + 0.1); o.frequency.exponentialRampToValueAtTime(f1, t + Math.min(0.5, dec * 0.6)); const g = env(t, 0.004, vol, dec); o.connect(g); g.connect(dest); };
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const saws = (t0, t1, f, vol, cut, dest, det = [-9, 0, 8], a = 0.05, r = 0.2, cut1 = null) => {
      const g = ctx.createGain(), lp = S.filter('lowpass', cut, 1.0);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.setValueAtTime(vol, Math.max(t0 + a, t1 - r)); g.gain.linearRampToValueAtTime(0, t1);
      if (cut1) { lp.frequency.setValueAtTime(cut, t0); lp.frequency.exponentialRampToValueAtTime(cut1, t1); }
      for (const c of det) { const o = osc('sawtooth', f, t0, t1 + 0.05); o.detune.value = c; o.connect(lp); }
      lp.connect(g); g.connect(dest);
    };
    const pad = (t0, t1, notes, vol, cut = 900, cut1 = null) => { for (const n of notes) saws(t0, t1, hz(n), vol, cut, mus, [-14, 0, 13], Math.min(1.5, (t1 - t0) * 0.35), Math.min(1.2, (t1 - t0) * 0.3), cut1); };
    const piano = (t, m, v = 1, dur = 2.4) => { for (const [k, mul, a] of [[0, 1, 0.09], [12, 2, 0.025], [19, 3, 0.012]]) { const o = osc(k ? 'sine' : 'triangle', hz(m + k), t, t + dur + 0.1), g = env(t, 0.004, a * v, dur * (k ? 0.5 : 1)); o.connect(g); g.connect(mus); void mul; } };
    const braam = (t, dur, v = 1, root = 26) => { for (const [m, k] of [[root, 1], [root + 7, 0.7], [root + 12, 0.8]]) saws(t, t + dur, hz(m), 0.2 * v * k, 170, mus, [-18, -6, 7, 19], 0.07, dur * 0.6, 1300); sub(t, 66, 34, 0.8 * v, dur * 0.6, mus); };
    const kick = (t, v = 1) => { sub(t, 150, 42, 0.9 * v, 0.45, drums); noiseHit(t, 0.02, 'highpass', 3000, 0.7, 0.12 * v, drums); };
    const taiko = (t, v = 1) => { sub(t, 105, 52, 0.85 * v, 0.75, drums); noiseHit(t, 0.35, 'lowpass', 600, 0.7, 0.42 * v, drums, 'pink'); };
    const snare = (t, v = 1) => { noiseHit(t, 0.22, 'bandpass', 1800, 0.7, 0.36 * v, drums); };
    const tick = (t, v = 1) => { const o = osc('square', 2400, t, t + 0.03), g = env(t, 0.001, 0.05 * v, 0.02); o.connect(g); g.connect(mus); };
    const riser = (t0, t1, vol = 0.16) => { const n = S.noise('white', t0, t1 + 0.05), b = S.filter('bandpass', 260, 2.5), g = ctx.createGain(); b.frequency.setValueAtTime(260, t0); b.frequency.exponentialRampToValueAtTime(6000, t1);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t1 - 0.02); g.gain.linearRampToValueAtTime(0, t1); n.connect(b); b.connect(g); g.connect(mus); };
    const whoosh = (t, dur, v = 1, f0 = 300, f1 = 2400, dest = fx) => noiseHit(t, dur, 'bandpass', f0, 1.4, 0.32 * v, dest, 'pink', 0, dur * 0.55, f1);
    const strings = (t0, t1, notes, vol, rise = false) => { for (const n of notes) { saws(t0, t1, hz(n), vol, rise ? 500 : 1400, mus, [-7, 0, 6, 12], Math.min(2.5, (t1 - t0) * 0.5), 0.3, rise ? 3200 : null); } };
    const crackle = (t0, t1, v = 1, rate = 70, dest = fx, f = 2200) => { const src = ctx.createBufferSource(); src.buffer = S.crackleBuffer(Math.min(8, t1 - t0 + 0.1), rate); src.start(t0); src.stop(t1); const hp = S.filter('highpass', f, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.16 * v, t0 + 0.08); g.gain.setValueAtTime(0.16 * v, t1 - 0.1); g.gain.linearRampToValueAtTime(0, t1); src.connect(hp); hp.connect(g); g.connect(dest); };
    const rumble = (t0, t1, v, dest = fx, f = 140) => { const r = noiseBed(t0, t1, 'lowpass', f, 0.8, 0.9 * v, dest, 'brown', 0.25, 0.4); const lfo = osc('sine', 6.5, t0, t1), lg = ctx.createGain(); lg.gain.value = 0.3 * v; lfo.connect(lg); lg.connect(r.g.gain); sub(t0, 48, 30, 0.6 * v, (t1 - t0) * 0.6, dest); return r; };
    const glass = (t, n = 18, v = 1) => { for (let i = 0; i < n; i++) { const tt = t + S.rng.range(0, 0.7), o = osc('sine', S.rng.range(2800, 7800), tt, tt + 0.3), g = env(tt, 0.001, 0.05 * v, S.rng.range(0.05, 0.25)); o.connect(g); g.connect(S.panned(fx, S.rng.range(0.2, 0.9))); } noiseHit(t, 0.35, 'highpass', 3500, 0.7, 0.3 * v, fx, 'white', 0.5); };
    const stone = (t, v = 1, pan = 0) => { sub(t, 120, 40, 0.5 * v, 0.3, fx); noiseHit(t, 0.4, 'lowpass', 1200, 0.7, 0.5 * v, fx, 'brown', pan); for (let i = 0; i < 4; i++) noiseHit(t + 0.08 + i * 0.07, 0.08, 'bandpass', 1800, 1, 0.12 * v, fx, 'white', pan); };
    const alarm = (t0, t1, v = 1, pan = -0.5) => { const o = osc('square', 900, t0, t1), lp = S.filter('lowpass', 2500, 0.7), g = ctx.createGain(); for (let t = t0; t < t1; t += 0.5) { o.frequency.setValueAtTime(900, t); o.frequency.setValueAtTime(700, t + 0.25); }
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.025 * v, t0 + 0.1); g.gain.setValueAtTime(0.025 * v, t1 - 0.1); g.gain.linearRampToValueAtTime(0, t1); o.connect(lp); lp.connect(g); g.connect(S.panned(fx, pan)); };
    const siren = (t0, t1, v = 1, pan = 0, f0 = 420, f1 = 820, per = 3.2) => { const o = osc('sawtooth', f0, t0, t1), lp = S.filter('lowpass', 1800, 0.7), g = ctx.createGain();
      for (let t = t0; t < t1; t += per) { o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + per * 0.5); o.frequency.linearRampToValueAtTime(f0, t + per); }
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.03 * v, t0 + 1.0); g.gain.setValueAtTime(0.03 * v, t1 - 0.2); g.gain.linearRampToValueAtTime(0, t1); o.connect(lp); lp.connect(g); g.connect(S.panned(fx, pan)); };
    const wetStep = (t, v = 1, pan = 0) => { noiseHit(t, 0.06, 'lowpass', 900, 0.7, 0.18 * v, fx, 'brown', pan); noiseHit(t + 0.01, 0.12, 'bandpass', 2600, 0.8, 0.07 * v, fx, 'white', pan); };
    const breath = (t, dur, v = 1) => noiseHit(t, dur, 'bandpass', 1100, 0.9, 0.06 * v, fx, 'pink', 0, dur * 0.4);
    const creak = (t, dur, v = 1, f = 90, pan = 0) => { const o = osc('sawtooth', f, t, t + dur), lp = S.filter('bandpass', f * 4, 3), g = env(t, dur * 0.3, 0.05 * v, dur * 0.7); o.frequency.linearRampToValueAtTime(f * 0.8, t + dur); o.connect(lp); lp.connect(g); g.connect(S.panned(fx, pan)); };
    const ping = (t, f, v = 1) => { const o = osc('sine', f, t, t + 2.5), g = env(t, 0.005, 0.07 * v, 1.8); o.connect(g); g.connect(mus); const o2 = osc('sine', f * 2.01, t, t + 1.2), g2 = env(t, 0.005, 0.02 * v, 0.8); o2.connect(g2); g2.connect(mus); };

    /* ---------------- 0–3.8 the rain, the walk, the slip ---------------- */
    noiseBed(0, 31.95, 'highpass', 1800, 0.5, 0.11, ambLP, 'white', 0.3, 0.1);        // the rain's hiss
    noiseBed(0, 31.95, 'lowpass', 700, 0.5, 0.1, ambLP, 'pink', 0.3, 0.1);            // its body
    crackle(0, 31.9, 0.5, 120, ambLP, 3000);                                           // drops on things
    noiseBed(39.2, END, 'highpass', 1800, 0.5, 0.08, ambLP, 'white', 0.4, 0.1); noiseBed(39.2, END, 'lowpass', 500, 0.5, 0.14, ambLP, 'pink', 0.4, 0.1);
    for (let t = 0.12; t < T.step; t += 0.42) wetStep(t, 1, (Math.round(t / 0.42) % 2 ? 0.12 : -0.12));
    noiseBed(2.6, 6.2, 'bandpass', 600, 0.6, 0.12, fx, 'pink', 1.6, 1.4, -0.4); sub(4.4, 60, 40, 0.15, 0.8, fx);   // the car hissing past
    pad(0.3, 3.8, [38, 45, 50, 53], 0.022, 700);
    [[0.6, 62], [1.4, 65], [2.2, 69], [3.0, 67]].forEach(([t, m]) => piano(t, m, 0.8));
    // the squeak, the fall, the thud
    { const o = osc('sine', 2300, T.slide, T.slide + 0.16), g = env(T.slide, 0.005, 0.07, 0.12); o.frequency.exponentialRampToValueAtTime(3600, T.slide + 0.12); o.connect(g); g.connect(fx); }
    breath(T.slide + 0.04, 0.3, 1.6); whoosh(3.42, 0.36, 0.8, 250, 900);
    sub(T.thud, 110, 38, 1.0, 0.5, fx); noiseHit(T.thud, 0.25, 'lowpass', 500, 0.7, 0.9, fx, 'brown'); noiseHit(T.thud + 0.01, 0.2, 'bandpass', 1800, 0.8, 0.22, fx, 'white');
    for (let i = 0; i < 5; i++) noiseHit(T.thud + 0.04 + i * 0.05, 0.06, 'bandpass', 3000, 1, 0.05, fx, 'white', S.rng.range(-0.5, 0.5));   // splash
    /* ---------------- 4.7–7.4 getting up; the ring; down ---------------- */
    breath(4.75, 0.7, 1.0); breath(5.7, 0.6, 0.8);
    pad(4.9, 7.4, [26, 33], 0.04, 300);
    piano(6.45, 50, 1.1, 3.0); piano(6.45, 38, 0.9, 3.0);
    sub(6.3, 70, 50, 0.25, 1.2, fx);
    whoosh(6.9, 0.5, 1.0, 1800, 160); sub(7.2, 60, 30, 0.5, 0.8, fx);
    /* ---------------- 7.4–17.4 underground ---------------- */
    pad(7.4, 17.4, [26, 33, 38], 0.045, 320);
    ping(7.45, hz(62), 1.2); ping(8.6, hz(62), 0.7); ping(10.0, hz(62), 0.45); ping(11.25, hz(62), 0.3);
    for (const t of [7.5, 8.8, 10.0, 11.1, 12.2]) { sub(t, 58, 40, 0.28, 0.25, mus); sub(t + 0.22, 54, 38, 0.18, 0.25, mus); }
    noiseBed(11.8, 17.4, 'highpass', 5000, 0.5, 0.012, fx, 'white', 0.5, 0.3);       // the macro's air
    crackle(12.5, 13.3, 0.25, 30, fx, 4000);
    { const t = T.nudge; noiseHit(t, 0.012, 'highpass', 4500, 0.7, 0.35, fx, 'white', 0.05, 0.001); const o = osc('triangle', 3100, t, t + 0.05), g = env(t, 0.001, 0.05, 0.03); o.connect(g); g.connect(fx); }
    pad(13.4, 16.2, [38, 45, 50], 0.022, 500); piano(15.3, 41, 0.9, 2.6);
    { const t = T.drop; for (let i = 0; i < 5; i++) noiseHit(t + i * 0.09 + i * i * 0.02, 0.015, 'highpass', 3500 - i * 400, 0.7, 0.25 - i * 0.04, fx, 'white', 0, 0.001); crackle(t, t + 0.9, 0.3, 40, fx, 2500); sub(t + 0.75, 50, 28, 0.6, 1.4, fx); noiseHit(t + 0.75, 1.5, 'lowpass', 300, 0.7, 0.4, fx, 'brown'); }
    riser(16.6, 17.38, 0.14);
    /* ---------------- 17.4–24.6 the fault ---------------- */
    rumble(17.4, 24.6, 0.25, fx, 90);
    strings(17.4, 20.3, [38, 41, 44], 0.035);
    creak(17.9, 1.0, 1.2, 70, -0.3); creak(18.8, 1.2, 1.4, 62, 0.3); creak(19.4, 0.5, 1.0, 80, 0);
    tick(17.8, 1.2);
    // 0.2 mm: one crack, a beat of nothing
    noiseHit(T.slip, 0.06, 'highpass', 1500, 0.7, 0.6, fx, 'white', 0, 0.001); sub(T.slip, 90, 40, 0.5, 0.3, fx);
    // the rupture: a long tearing rumble, drums accelerating with the magnitude
    { const r = noiseBed(T.rupture, 24.6, 'lowpass', 120, 0.8, 0.9, fx, 'brown', 0.3, 0.5); r.b.frequency.setValueAtTime(120, T.rupture); r.b.frequency.exponentialRampToValueAtTime(900, 23.8); }
    crackle(T.rupture, 24.6, 0.7, 50, fx, 900);
    braam(21.0, 3.6, 1.0, 26); strings(20.4, 24.6, [50, 53, 57, 62], 0.03, true);
    { let t = 20.5, dt = 0.6; while (t < 24.5) { taiko(t, 0.5 + 0.5 * (t - 20.5) / 4); t += dt; dt = Math.max(0.16, dt * 0.88); } }
    riser(23.4, 24.58, 0.2);
    /* ---------------- 24.6–32 the quake ---------------- */
    rumble(24.6, 31.9, 1.0, fx, 160); crackle(24.6, 31.9, 0.9, 90, fx, 1200);
    braam(T.quake, 3.0, 1.2, 26); taiko(T.quake, 1.3); kick(T.quake, 1.2);
    for (let t = 25.6; t < 31.6; t += 1.0) { taiko(t, 0.8); taiko(t + 0.5, 0.45); }
    alarm(25.5, 31.9, 1.0, -0.6); alarm(26.3, 31.9, 0.6, 0.5);
    glass(27.05, 22, 1.2);
    stone(28.25, 0.8, -0.4); stone(28.5, 0.6, -0.3); stone(29.35, 1.0, 0.4); stone(29.6, 0.7, 0.5);
    for (let i = 0; i < 6; i++) S.voice(25.0 + i * 0.9 + S.rng.range(0, 0.3), S.rng.range(260, 420), 0.35, i % 2 ? 'a' : 'o', 0.08, S.rng.range(-0.7, 0.7), fx, 0.8);
    pad(28.0, 32.0, [26, 33, 38, 41], 0.04, 800, 1800);
    whoosh(31.5, 0.6, 1.4, 200, 5000);
    /* ---------------- 32–39.2 the planet ---------------- */
    rumble(32.0, 34.5, 0.18, fx, 70);
    pad(32.0, 39.2, [26, 38, 45, 50, 57], 0.03, 600, 1200);
    for (const [t, m] of [[32.6, 62], [33.8, 65], [35.0, 69], [36.2, 67], [37.4, 65]]) piano(t, m, 0.6, 2.4);
    tick(T.tick, 1.6); sub(T.tick + 0.02, 55, 30, 0.6, 1.4, mus);
    strings(T.shift, 39.2, [38, 45, 50, 53], 0.03, true); riser(38.3, 39.18, 0.15); whoosh(38.7, 0.5, 1.1, 4000, 300);
    /* ---------------- 39.2–52.6 the coast ---------------- */
    { const w = noiseBed(39.2, 52.6, 'lowpass', 500, 0.6, 0.32, amb, 'pink', 0.5, 0.5); w.g.gain.setValueAtTime(0.32, 41.0); w.g.gain.linearRampToValueAtTime(0.04, 45.6); }   // the surf, fading as the sea leaves
    { const h = noiseBed(40.0, 46.4, 'bandpass', 900, 0.8, 0.16, fx, 'pink', 1.5, 1.0); h.b.frequency.setValueAtTime(1400, 40); h.b.frequency.exponentialRampToValueAtTime(500, 46.4); }  // the water draining away
    creak(42.4, 1.4, 1.3, 75, -0.5); creak(43.5, 1.2, 1.0, 68, -0.3); creak(44.6, 1.0, 1.2, 82, -0.6);
    S.chatter(40.0, 46.5, 0.05, 0.1, fx, 300, 2.5);
    pad(39.2, 46.0, [26, 33, 38], 0.05, 480);
    { let t = 41.0, dt = 0.62; while (t < 52.5) { tick(t, 0.8); t += dt; dt = Math.max(0.24, dt * 0.975); } }
    // the line: a distant rumble that grows; sirens; a hit on every new height
    rumble(T.line, 52.6, 0.45, fx, 80);
    sub(T.line, 50, 32, 0.6, 2.0, mus); braam(T.line, 3.0, 0.7, 26);
    for (const [t] of SL_WAVE_STEPS.slice(0, 5)) { kick(t, 0.9); }
    siren(48.4, 60, 1.0, -0.4); siren(49.6, 60, 0.7, 0.5, 380, 760, 3.8);
    pad(46.0, 52.6, [26, 33, 38, 41], 0.04, 500, 1600); strings(48.0, 52.6, [50, 53, 57], 0.03, true);
    for (let t = 49.4; t < 52.4; t += 0.5) { kick(t, 0.7); if (Math.round(t * 2) % 2) snare(t, 0.4); }
    S.voice(50.5, 330, 0.5, 'a', 0.12, -0.3, fx, 0.85); S.voice(51.0, 280, 0.6, 'o', 0.1, 0.4, fx, 0.85);
    /* ---------------- 52.6–59.6 the run ---------------- */
    { const r = noiseBed(52.6, T.impact + 0.1, 'lowpass', 180, 0.7, 0.9, fx, 'brown', 0.5, 0.05); r.b.frequency.setValueAtTime(180, 52.6); r.b.frequency.exponentialRampToValueAtTime(2400, 59.5); r.g.gain.setValueAtTime(0.9, 55); r.g.gain.linearRampToValueAtTime(1.4, 59.5); }   // the wave's roar
    rumble(52.6, T.impact + 0.1, 0.6, fx, 70);
    for (let t = 52.7; t < T.impact; t += 0.3) wetStep(t, 1.4, (Math.round(t / 0.3) % 2 ? 0.15 : -0.15));
    for (let t = 52.8; t < T.impact; t += 0.6) breath(t, 0.32, 1.4);
    for (let t = 52.6; t < 59.5; t += 0.5) { const b = Math.round((t - 52.6) * 2); if (b % 2 === 0) taiko(t, 0.9); else snare(t, 0.6); kick(t, 0.8); }
    braam(55.0, 2.6, 1.3, 26); strings(55.0, 59.6, [50, 53, 57, 62, 65], 0.035, true); pad(52.6, 59.6, [26, 38, 45, 50, 53], 0.045, 700, 2400);
    braam(58.3, 1.4, 1.3, 29); riser(57.8, 59.58, 0.22);
    stone(56.2, 0.6, -0.6); stone(57.3, 0.5, 0.6); for (let i = 0; i < 4; i++) stone(59.2 + i * 0.08, 0.9, S.rng.range(-0.8, 0.8));
    noiseHit(59.2, 0.5, 'lowpass', 1600, 0.6, 0.9, fx, 'brown', 0, 0.02);                 // the wall of water hits the sea front
    // the impact: one hit — then nothing
    sub(T.impact, 90, 26, 1.1, 0.4, fx); noiseHit(T.impact, 0.12, 'lowpass', 2500, 0.6, 1.0, fx, 'brown');
    /* ---------------- the end card: silence, and one drop of rain under the meta line ---------------- */
    { const t = T.meta[0] + 0.05, o = osc('sine', 1900, t, t + 0.12), g = ctx.createGain(); o.frequency.exponentialRampToValueAtTime(900, t + 0.08); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.1); o.connect(g); g.connect(comp); }
  }
}
