/* =====================================================================
   AUDIO — "What If Gravity Doubled at Breakfast?" Synthesised offline (js/audio/audioEngine.js, unchanged).
   Every cue comes from GB / GB_CUES in script.js (absolute story seconds). Bake it when the film is final:
     NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page gravity-breakfast.html --out films/gravity-breakfast/soundtrack.js
   Layers: morning bed (out/in) → warm pluck motif → the G-drop hit and its consequences (clunk, splash, creak, slump,
   lamps, tray) → the close-up (room ducks; strain) → the push (whoosh + heartbeat) → POV (effort, swinging lamp,
   smash) → outside (wind, a lower fountain, the balloons) → the resolve chord.
   ===================================================================== */

class GbAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  fingerprintData() { return [GB, GB_CUES]; }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), END = CONFIG.duration + 1.0, R = new RNG(CONFIG.seed + 7);
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);

    // mix chain: buses → compressor → out → limiter
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12; lim.connect(ctx.destination);
    const out = ctx.createGain(); out.gain.value = 1.0; out.connect(lim);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.connect(out);
    const mix = ctx.createGain(); mix.gain.value = 2.2; mix.connect(comp);
    const rev = S.reverb(1.8), revG = ctx.createGain(); revG.gain.value = 0.22; rev.connect(revG); revG.connect(mix);
    const bus = (g) => { const b = ctx.createGain(); b.gain.value = g; b.connect(mix); return b; };
    const outB = bus(0), inB = bus(0), fx = bus(1.0), body = bus(0.9), mus = bus(0.55);
    const send = (src, k) => { const s = ctx.createGain(); s.gain.value = k; src.connect(s); s.connect(rev); };
    send(fx, 0.35); send(mus, 0.5);

    // simple gain automation from [t, value] keys (linear between keys)
    const auto = (param, keys) => { param.setValueAtTime(keys[0][1], 0); for (const [t, v] of keys) param.linearRampToValueAtTime(v, Math.max(0.001, t)); };
    const T = GB, X = 0.12;                 // X: crossfade at the cuts

    // ---- 1. the beds: outside (exterior shots) and the café interior (with the plaza heard through glass)
    auto(outB.gain, [[0, 0.0], [T.wide - X, 0.0], [T.wide, 0.95], [T.line[0], 0.8], [END - 1, 0.0]]);
    auto(inB.gain, [[0, 0.85], [T.close - X, 0.85], [T.close, 0.35], [T.pov - 0.1, 0.35], [T.pov + 0.4, 0.85], [T.wide - X, 0.85], [T.wide, 0], [END, 0]]);
    const bed = (dest, type, ft, f, q, vol) => { const n = S.noise(type, 0, END), b = S.filter(ft, f, q), g = ctx.createGain(); g.gain.value = vol; n.connect(b); b.connect(g); g.connect(dest); return g; };
    bed(outB, 'pink', 'lowpass', 900, 0.6, 0.16);                         // air, distant town
    const fnt = bed(outB, 'white', 'bandpass', 2600, 0.5, 0.05);          // the fountain (falls lower and quieter at 2 g)
    auto(fnt.gain, [[0, 0.05], [T.g, 0.05], [T.g + 0.6, 0.028], [END, 0.028]]);
    const fntLo = bed(outB, 'pink', 'bandpass', 700, 0.7, 0.05);
    auto(fntLo.gain, [[0, 0.05], [T.g, 0.05], [T.g + 0.6, 0.035], [END, 0.035]]);
    bed(inB, 'brown', 'lowpass', 260, 0.7, 0.28);                         // room tone
    bed(inB, 'pink', 'bandpass', 1500, 0.6, 0.012);                       // the plaza through the glass
    // birds (exterior): sparse chirps; after the drop they are fewer and lower (it is harder to stay up)
    for (let t = T.wide + 0.3; t < END - 1.5; t += R.range(0.6, 1.2)) S.chirp(t, R.range(2100, 2900), R.range(0.02, 0.035), R.range(-0.8, 0.8), outB, false);
    // cups and spoons in the room before the drop
    for (const [t, f] of [[0.2, 5200], [2.1, 4400], [2.6, 6100]]) S.tone(t, 0.25, f, 0.012, R.range(-0.5, 0.5), inB, 'sine', 0.002, 0.2);

    // ---- 2. music: a warm pluck motif (F major), stops dead at the drop; returns lower in the POV; resolves at the end
    const F = (n) => 174.61 * Math.pow(2, n / 12);                       // semitones above F3
    const motif = [0, 4, 7, 12, 9, 7, 4, 5];
    for (let i = 0; i < 14; i++) { const t = 0.15 + i * 0.38; if (t > T.g - 0.15) break; S.pluck(t, F(motif[i % 8] + (i >= 8 ? 2 : 0)), 0.16, (i % 2 ? 0.25 : -0.25), mus, 1.6, 0.55); }
    S.tone(0.0, T.g, F(-12), 0.05, 0, mus, 'triangle', 0.5, 0.05);       // soft root under the motif, cut at the drop
    // after the drop: a low unsettled drone (F → E, a semitone down), under the close-up and the POV
    S.tone(T.g + 0.6, T.wide - T.g - 0.4, F(-13), 0.05, 0, mus, 'triangle', 1.5, 1.0);
    S.tone(T.close, T.pov - T.close, F(-1), 0.018, 0, mus, 'sine', 1.2, 0.8);
    // POV: the motif again, slower and a fourth lower (heavy)
    for (let i = 0; i < 6; i++) S.pluck(T.pov + 0.6 + i * 0.75, F(motif[i] - 5), 0.1, (i % 2 ? 0.3 : -0.3), mus, 1.8, 0.4);
    // outside: the motif lifts with the balloons; the resolve chord under the end line
    for (let i = 0; i < 8; i++) S.pluck(T.release + 0.1 + i * 0.27, F(motif[i] + 12), 0.11, (i % 2 ? 0.35 : -0.35), mus, 1.6, 0.6);
    for (const n of [-12, 0, 4, 7, 12]) S.tone(T.line[0] - 0.3, END - T.line[0] - 0.2, F(n), 0.03, 0, mus, 'sine', 1.0, 2.2);

    // ---- 3. before the drop: the sip
    { const t = T.sip[0] + 0.45, n = S.noise('pink', t, t + 0.5), bp = S.filter('bandpass', 1400, 1.2), g = ctx.createGain(); S.env(g, t, 0.05, 0.06, 0.35); n.connect(bp); bp.connect(g); g.connect(body); }
    S.clunk(T.sip[1] - 0.05, 0.12, -0.1, fx);                             // cup back on the saucer (gently)
    S.tone(T.sip[1] - 0.05, 0.3, 3900, 0.015, -0.1, fx, 'sine', 0.002, 0.25);

    // ---- 4. THE DROP: a sub hit + a falling pressure tone, then everything that weighs anything answers
    S.thump(T.g, 0.95, fx);
    S.boom(T.g + 0.02, 0.55, fx, rev);
    { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(330, T.g - 0.05); o.frequency.exponentialRampToValueAtTime(48, T.g + 0.45); S.env(g, T.g - 0.05, 0.02, 0.12, 0.5); o.connect(g); g.connect(fx); o.start(T.g - 0.05); o.stop(T.g + 0.8); }
    S.clunk(T.g + 0.12, 0.42, -0.1, fx);                                  // the cup slams down
    S.tone(T.g + 0.12, 0.5, 3300, 0.03, -0.1, fx, 'sine', 0.002, 0.45);
    { const t = T.g + 0.15, n = S.noise('white', t, t + 0.4), bp = S.filter('bandpass', 1200, 0.8), g = ctx.createGain(); S.env(g, t, 0.005, 0.16, 0.22); n.connect(bp); bp.connect(g); g.connect(S.panned(fx, -0.1)); }
    // wood creak: a buzzing low tone through a narrow, wandering band (chair, then floor)
    const creak = (t, dur, f, vol, pan) => {
      const o = ctx.createOscillator(), bp = S.filter('bandpass', f * 6, 6), g = ctx.createGain(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t); for (let k = 1; k <= 6; k++) o.frequency.linearRampToValueAtTime(f * (0.85 + 0.3 * R.next()), t + dur * k / 6);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.2); g.gain.linearRampToValueAtTime(vol * 0.7, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(bp); bp.connect(g); g.connect(S.panned(fx, pan)); o.start(t); o.stop(t + dur + 0.05);
    };
    creak(T.g + 0.2, 0.55, 62, 0.22, -0.15);
    S.whump(T.g + 0.35, 0.3, -0.1, fx);                                   // his body slumps
    S.breath(T.g + 0.4, 0.7, false, 0.09, body);
    // lamp cords twang (low bright plucks), three lamps across the room
    for (const [d, f, p] of [[0.45, 98, -0.4], [0.52, 110, 0.1], [0.6, 92.5, 0.5]]) S.pluck(T.g + d, f, 0.14, p, fx, 1.4, 0.9);
    // the waiter buckles: the tray rattles
    for (let k = 0; k < 9; k++) S.tone(T.g + 0.85 + k * 0.06 + R.range(0, 0.03), 0.08, R.range(2800, 5200), 0.02, 0.4, fx, 'sine', 0.002, 0.06);
    S.whump(T.g + 1.0, 0.18, 0.4, fx);
    creak(T.g + 1.6, 0.8, 55, 0.1, 0.3);                                  // the floor settles

    // ---- 5. the close-up: room ducked (bus automation); gauge ticks; the struggle
    for (let k = 0; k <= 10; k++) S.tick(T.g + 0.1 + k * 0.07, 1800 + k * 120, 0.03, fx);
    // brace: palm on the table, a breath in
    S.whump(T.try[0] + 0.3, 0.08, -0.2, fx); S.breath(T.try[0] + 0.05, 0.5, true, 0.1, body);
    // attempt 1: held breath, two strained grunts out; the cup drops back (clink + slosh)
    S.breath(T.a1[0] - 0.25, 0.3, true, 0.1, body);
    S.breath(T.a1[0] + 0.35, 0.45, false, 0.13, body); S.breath(T.a1[0] + 0.85, 0.35, false, 0.15, body);
    S.clunk(T.a1[1] + 0.07, 0.3, -0.15, fx); S.tone(T.a1[1] + 0.07, 0.4, 3500, 0.025, -0.15, fx, 'sine', 0.002, 0.35);
    S.breath(T.a1[1] + 0.15, 0.7, false, 0.14, body);
    // attempt 2: both hands, steady breaths, the sip, the cup set down carefully, relief
    for (let k = 0; k < 3; k++) { const t = T.a2[0] + k * 0.42; S.breath(t, 0.2, true, 0.08, body); S.breath(t + 0.21, 0.2, false, 0.1, body); }
    { const t = T.a2[0] + 1.45, n = S.noise('pink', t, t + 0.5), bp = S.filter('bandpass', 1400, 1.2), g = ctx.createGain(); S.env(g, t, 0.05, 0.06, 0.35); n.connect(bp); bp.connect(g); g.connect(body); }
    S.clunk(T.a2[1], 0.16, -0.15, fx); S.tone(T.a2[1], 0.3, 3700, 0.015, -0.15, fx, 'sine', 0.002, 0.25);
    S.breath(T.a2[1] + 0.1, 0.8, false, 0.12, body);
    for (const t of [T.a1[0] + 0.2, T.a2[0] + 0.15]) {   // ceramic scrape as the cup leaves the saucer
      const n = S.noise('white', t, t + 0.3), bp = S.filter('bandpass', 2600, 3), g = ctx.createGain(); S.env(g, t, 0.02, 0.05, 0.2); n.connect(bp); bp.connect(g); g.connect(S.panned(fx, -0.2));
    }

    // ---- 6. the push into his eyes: a rising whoosh + heartbeat; eyes open on a breath
    { const t = T.push - 0.2, d = T.pov - t + 0.1, n = S.noise('pink', t, t + d + 0.2), bp = S.filter('bandpass', 300, 0.8), g = ctx.createGain();
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + d);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + d * 0.9); g.gain.linearRampToValueAtTime(0, t + d + 0.12);
      n.connect(bp); bp.connect(g); g.connect(fx); }
    for (const t of [T.push + 0.05, T.push + 0.55]) S.heart(t, 0.35, body);
    S.breath(T.pov, 0.6, true, 0.07, body);

    // ---- 7. POV: effort to stand (two pushes), chair creaks, sinks back; the lamp swings overhead; the smash
    S.breath(T.stand[0] + 0.1, 0.5, true, 0.08, body);
    creak(T.stand[0] + 0.35, 0.9, 58, 0.14, 0.0);
    for (let k = 0; k < 3; k++) S.breath(T.stand[0] + 0.7 + k * 0.5, 0.4, false, 0.1, body);
    S.whump(T.stand[1], 0.38, 0, fx);                                     // sinks back into the chair
    creak(T.stand[1] + 0.05, 0.6, 50, 0.16, 0.0);
    S.breath(T.stand[1] + 0.2, 0.8, false, 0.11, body);
    // the lamp: period 2π√(L/2g) ≈ 1.57 s; a hinge squeak at each end of its swing
    for (let t = T.lamp + 0.1; t < T.wide - 0.2; t += 0.785) S.tone(t, 0.22, 1150 + R.range(-60, 60), 0.012, 0.0, fx, 'triangle', 0.05, 0.15);
    S.crunch(T.smash, 0.45, 0.45, fx, rev);
    S.click(T.smash + 0.02, 0.18, 0.45, fx);

    // ---- 8. outside: wind (bed), pigeons flap down, the balloons escape
    for (let k = 0; k < 3; k++) S.flap(T.wide + 0.3 + k * 0.45, R.range(-0.6, 0.6), 0.05, fx);
    { const t = T.release; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';     // rubber squeak
      o.frequency.setValueAtTime(700, t); o.frequency.linearRampToValueAtTime(1300, t + 0.08); o.frequency.linearRampToValueAtTime(900, t + 0.16); o.frequency.linearRampToValueAtTime(1500, t + 0.24);
      S.env(g, t, 0.01, 0.05, 0.3); o.connect(g); g.connect(S.panned(fx, 0.3)); o.start(t); o.stop(t + 0.5); }
    S.gasp(T.release + 0.12, 0.05, S.panned(body, 0.3));
    { const t = T.release + 0.05, d = 2.4, n = S.noise('pink', t, t + d + 0.2), bp = S.filter('bandpass', 500, 0.9), g = ctx.createGain();
      bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(3000, t + d);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.4); g.gain.linearRampToValueAtTime(0, t + d);
      n.connect(bp); bp.connect(g); g.connect(fx); }
  }
}
