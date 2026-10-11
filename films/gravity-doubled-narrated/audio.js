/* =====================================================================
   AUDIO — "What If Gravity Doubled?" — three layers, rendered offline in one pass (js/audio/audioEngine.js, unchanged):
     VOICE  the five real ElevenLabs clips (window.GN_VO, decoded first), each at its GN start time, levelled to the
            same loudness (GN gainDb), through a gentle voice compressor
     MUSIC  an original pluck motif + pads, ducked under every narration window, up in the speech-free sequences
     SFX    synthesised room tones and foley, each keyed to the action (GB) or to the measured physics (GB_DROP)
   Layers: café room tone → warm pluck motif → the doubling (low impact, pressure fall, chair creak) → the cup
   (ceramic, fabric, breath) → the experiment (a ticking pulse, the clamps, two impacts at the measured times,
   shards; a low slow-motion replay) → outside (wind, the lower fountain, shoes, springs, breath) → the ending chord.
   ===================================================================== */

class GbAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  fingerprintData() { return [GB, GB_CUES, GN.clips.map((c) => [c.id, c.hash, c.start, c.seconds, c.gainDb]), GB_CAR, GB_DROP]; }

  // the voice clips are MP3s: decode them (at the render's sample rate) before the offline render schedules them
  async renderOffline() {
    this.vo = {};
    if (window.GN_VO) {
      const dc = new OfflineAudioContext(2, 1, this.sampleRate);
      for (const c of GN.clips) {
        const b64 = GN_VO[c.id]; if (!b64) { console.warn('narration: no audio for', c.id); continue; }
        const bin = atob(b64), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        this.vo[c.id] = await dc.decodeAudioData(u8.buffer);
      }
    } else console.warn('narration: narration-audio.js not loaded; the soundtrack has no voice');
    return super.renderOffline();
  }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), END = CONFIG.duration + 1.5, R = new RNG(CONFIG.seed + 7);
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);

    // mix chain: buses → compressor → out → limiter
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12; lim.connect(ctx.destination);
    const out = ctx.createGain(); out.gain.value = 1.0; out.connect(lim);
    // ---- VOICE: every clip whole, at its placed time, never sped up or trimmed; levelled, lightly compressed, centred
    { const vc = ctx.createDynamicsCompressor(); vc.threshold.value = -20; vc.knee.value = 6; vc.ratio.value = 2.5; vc.attack.value = 0.005; vc.release.value = 0.15;
      const vo = ctx.createGain(); vo.gain.value = 1.26; vc.connect(vo); vo.connect(out);   // the voice ≈5 dB above the speech-free sequences
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70; hp.connect(vc);
      for (const c of GN.clips) {
        const buf = this.vo && this.vo[c.id]; if (!buf) continue;
        const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = buf; g.gain.value = Math.pow(10, c.gainDb / 20);
        src.connect(g); g.connect(hp); src.start(c.start);
      } }
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3; comp.connect(out);
    const mix = ctx.createGain(); mix.gain.value = 1.3;
    // the whole music + effects mix dips ≈6 dB under every line (on top of the music's own deeper duck), so the voice
    // sits ≈8 dB clear of everything else; it comes back up in the speech-free sequences
    const mduck = ctx.createGain(); mix.connect(mduck); mduck.connect(comp);
    { const keys = [[0, 1]];
      for (const c of GN.clips) keys.push([c.start - 0.25, 1], [c.start, 0.5], [c.speechEnd + 0.1, 0.5], [c.speechEnd + 0.6, 1]);
      mduck.gain.setValueAtTime(1, 0); for (const [t, v] of keys) mduck.gain.linearRampToValueAtTime(v, Math.max(0.001, t)); }
    const rev = S.reverb(2.2), revG = ctx.createGain(); revG.gain.value = 0.24; rev.connect(revG); revG.connect(mix);
    const bus = (g) => { const b = ctx.createGain(); b.gain.value = g; b.connect(mix); return b; };
    const outB = bus(0), inB = bus(0), fx = bus(1.0), body = bus(0.95), mus = bus(0.5);
    const send = (src, k) => { const s = ctx.createGain(); s.gain.value = k; src.connect(s); s.connect(rev); };
    send(fx, 0.3); send(mus, 0.55); send(body, 0.12);
    const auto = (param, keys) => { param.setValueAtTime(keys[0][1], 0); for (const [t, v] of keys) param.linearRampToValueAtTime(v, Math.max(0.001, t)); };
    const T = GB, X = 0.08;

    // ---- DUCKING: the music sits low under every narration window and comes up in the speech-free sequences
    const duck = ctx.createGain(); duck.gain.value = 1; mus.disconnect(); mus.connect(duck); duck.connect(mix);
    const sendM = ctx.createGain(); sendM.gain.value = 0.55; duck.connect(sendM); sendM.connect(rev);
    { const keys = [[0, 0.62]];
      for (const c of GN.clips) { keys.push([c.start - 0.35, 0.62], [c.start - 0.05, 0.3], [c.speechEnd + 0.15, 0.3], [c.speechEnd + 0.75, 1.0]); }
      keys.sort((a, b) => a[0] - b[0]); keys.push([END, 0.9]);
      // the pure-visual stretches lift the score a little more than the gaps between short lines
      auto(duck.gain, keys); }
    const bedDuck = ctx.createGain(); bedDuck.gain.value = 1; inB.disconnect(); outB.disconnect(); inB.connect(bedDuck); outB.connect(bedDuck); bedDuck.connect(mix);
    { const keys = [[0, 1]]; for (const c of GN.clips) keys.push([c.start - 0.2, 1], [c.start, 0.72], [c.speechEnd + 0.1, 0.72], [c.speechEnd + 0.5, 1]); auto(bedDuck.gain, keys); }

    // ---- 1. the beds: the café (room tone + the plaza through glass) and outside (air, the fountain, the town)
    auto(inB.gain, [[0, 0.85], [T.out - X, 0.85], [T.out, 0], [END, 0]]);
    auto(outB.gain, [[0, 0], [T.out - X, 0], [T.out, 0.95], [END - 1.2, 0.8], [END, 0]]);
    const bed = (dest, type, ft, f, q, vol) => { const n = S.noise(type, 0, END), b = S.filter(ft, f, q), g = ctx.createGain(); g.gain.value = vol; n.connect(b); b.connect(g); g.connect(dest); return g; };
    bed(inB, 'brown', 'lowpass', 260, 0.7, 0.28);
    bed(inB, 'pink', 'bandpass', 1500, 0.6, 0.012);
    const esp = bed(inB, 'white', 'bandpass', 3800, 2.5, 0.0);                  // the espresso machine's faint hiss
    auto(esp.gain, [[0, 0], [0.5, 0.004], [T.exp, 0.004], [T.exp + 0.3, 0.0], [END, 0]]);
    bed(outB, 'pink', 'lowpass', 900, 0.6, 0.16);
    const wind = bed(outB, 'pink', 'bandpass', 420, 0.5, 0.05);
    auto(wind.gain, [[0, 0.05], [T.out + 2, 0.07], [T.pull, 0.06], [END, 0.09]]);
    bed(outB, 'white', 'bandpass', 2600, 0.5, 0.028);                         // the fountain, low and quiet at 2 g
    bed(outB, 'pink', 'bandpass', 700, 0.7, 0.035);
    for (let t = T.out + 0.5; t < END - 1.5; t += R.range(0.9, 1.8)) S.chirp(t, R.range(2100, 2900), R.range(0.012, 0.024), R.range(-0.8, 0.8), outB, false);
    // cups and spoons around the room before the doubling (and fewer, heavier after)
    for (const [t, f] of [[0.3, 5200], [1.25, 4400], [2.05, 6100], [T.g + 1.6, 3600], [T.room + 0.8, 4100]]) S.tone(t, 0.25, f, 0.011, R.range(-0.5, 0.5), inB, 'sine', 0.002, 0.2);

    // ---- 2. MUSIC (original): a warm pluck motif in F that stops dead at the doubling; a low unsettled drone; a pulse
    //         under the experiment; the motif returns lower and slower outside; the resolve chord decays to the end
    const F = (n) => 174.61 * Math.pow(2, n / 12);
    const motif = [0, 4, 7, 12, 9, 7, 4, 5];
    for (let i = 0; i < 14; i++) { const t = 0.12 + i * 0.36; if (t > T.g - 0.12) break; S.pluck(t, F(motif[i % 8] + (i >= 8 ? 2 : 0)), 0.15, (i % 2 ? 0.25 : -0.25), mus, 1.6, 0.55); }
    S.tone(0.0, T.g, F(-12), 0.045, 0, mus, 'triangle', 0.4, 0.05);
    // the doubling: a short rising tension cue into the hit, then a semitone-down drone
    { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(F(-5), T.g - 1.1); o.frequency.linearRampToValueAtTime(F(-4), T.g);
      const lp = S.filter('lowpass', 500, 0.7); g.gain.setValueAtTime(0, T.g - 1.1); g.gain.linearRampToValueAtTime(0.03, T.g - 0.05); g.gain.linearRampToValueAtTime(0, T.g + 0.05);
      o.connect(lp); lp.connect(g); g.connect(mus); o.start(T.g - 1.1); o.stop(T.g + 0.1); }
    S.tone(T.g + 0.5, T.exp - T.g - 0.2, F(-13), 0.05, 0, mus, 'triangle', 1.5, 1.0);
    // scene 3 (no narration): a held high tone that tightens while he holds the cup, released at the set-down
    S.tone(T.lift, T.down - T.lift + 0.4, F(11), 0.012, 0.15, mus, 'sine', 1.5, 0.6);
    S.tone(T.top - 0.2, T.down - T.top + 0.3, F(12), 0.01, -0.15, mus, 'sine', 1.0, 0.5);
    for (let i = 0; i < 4; i++) S.pluck(T.down + 0.2 + i * 0.42, F([7, 4, 0, -5][i]), 0.09, (i % 2 ? 0.3 : -0.3), mus, 1.8, 0.4);
    // the experiment: a soft clock-like pulse under the narration that stops before the drop (anticipation)
    for (let t = T.exp + 0.4; t < T.drop - 0.75; t += 0.5) S.pluck(t, F(12 + ((Math.round((t - T.exp) / 0.5) % 2) ? 7 : 0)), 0.035, 0.1, mus, 0.4, 0.8);
    S.tone(T.exp + 0.2, T.drop - T.exp - 0.6, F(-12), 0.035, 0, mus, 'triangle', 1.2, 0.6);
    { const t = T.drop - 0.9; S.tone(t, 0.9, F(19), 0.012, 0, mus, 'sine', 0.7, 0.05); }   // a thin held note in the hold
    // the result: a bright little chord after both impacts; the replay sits on a low swell; the hold resolves
    for (const n of [0, 4, 7, 12]) S.tone(T.drop + 0.75, 1.8, F(n + 12), 0.012, 0, mus, 'sine', 0.05, 1.4);
    S.tone(T.replay, T.replayEnd - T.replay + 0.6, F(-24 + 12), 0.04, 0, mus, 'triangle', 1.2, 0.8);
    for (const n of [0, 7, 12, 16]) S.tone(T.replayEnd - 0.2, T.out - T.replayEnd + 0.6, F(n), 0.014, 0, mus, 'sine', 0.6, 0.6);
    // outside: the motif, slower and a fourth lower (heavy); more present in the speech-free scene 7
    for (let i = 0; i < 8; i++) S.pluck(T.out + 0.5 + i * 0.85, F(motif[i] - 5), 0.09, (i % 2 ? 0.3 : -0.3), mus, 2.0, 0.4);
    S.tone(T.out, T.pull - T.out, F(-17), 0.04, 0, mus, 'triangle', 1.5, 1.0);
    for (let i = 0; i < 10; i++) S.pluck(T.world + 0.3 + i * 0.8, F(motif[(i + 2) % 8] - 5 + (i > 5 ? 2 : 0)), 0.12, (i % 2 ? 0.35 : -0.35), mus, 2.2, 0.45);
    S.tone(T.world, T.pull - T.world + 0.5, F(-5), 0.016, 0.2, mus, 'sine', 1.5, 1.0);
    // the ending: the resolve chord swells under the last line and decays naturally past the last frame
    for (const n of [-12, 0, 4, 7, 12, 16]) S.tone(T.pull + 0.2, END - T.pull - 0.2, F(n), n > 7 ? 0.016 : 0.028, 0, mus, 'sine', 1.6, 2.6);
    for (let i = 0; i < 5; i++) S.pluck(T.pull + 0.9 + i * 1.1, F([12, 9, 7, 4, 0][i]), 0.08, (i % 2 ? 0.3 : -0.3), mus, 2.6, 0.35);
    S.pluck(GB.end - 2.4, F(0), 0.11, 0, mus, 4.0, 0.3);

    // ---- 3. THE DOUBLING: a low cinematic impact on "doubled", a pressure fall, the chair creaks, he breathes out
    S.thump(T.g, 0.85, fx);
    S.boom(T.g + 0.02, 0.45, fx, rev);
    { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(300, T.g - 0.04); o.frequency.exponentialRampToValueAtTime(46, T.g + 0.5); S.env(g, T.g - 0.04, 0.02, 0.1, 0.55); o.connect(g); g.connect(fx); o.start(T.g - 0.04); o.stop(T.g + 0.9); }
    const creak = (t, dur, f, vol, pan, dest = fx) => {
      const o = ctx.createOscillator(), bp = S.filter('bandpass', f * 6, 6), g = ctx.createGain(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t); for (let k = 1; k <= 6; k++) o.frequency.linearRampToValueAtTime(f * (0.85 + 0.3 * R.next()), t + dur * k / 6);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.2); g.gain.linearRampToValueAtTime(vol * 0.7, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + dur + 0.05);
    };
    creak(T.g + 0.12, 0.5, 62, 0.16, -0.15);
    S.breath(T.g + 0.35, 0.6, false, 0.06, body);
    for (const [d, f, p] of [[0.3, 98, -0.4], [0.38, 110, 0.1], [0.45, 92.5, 0.5]]) S.pluck(T.g + d, f, 0.05, p, fx, 1.0, 0.7);   // lamp cords: a faint twang
    creak(T.g + 1.2, 0.7, 55, 0.06, 0.3);

    // ---- 4. THE CUP: fabric as he reaches, a ceramic tick at the grip, a held breath, the stick (saucer rattle),
    //         the scrape as it breaks free, effortful breaths while it trembles, the careful set-down, relief
    const rustle = (t, dur, vol, pan) => { const n = S.noise('pink', t, t + dur + 0.1), bp = S.filter('bandpass', 2200, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.4); g.gain.linearRampToValueAtTime(0, t + dur); n.connect(bp); bp.connect(g); g.connect(S.panned(body, pan)); };
    rustle(T.reach[0], 0.55, 0.035, -0.2);
    rustle(T.reach[0] - 0.3, 0.4, 0.025, 0.2);                                 // the other sleeve: palm down on the table
    S.whump(T.reach[0] - 0.05, 0.05, 0.2, fx);
    S.tone(T.grip, 0.12, 4600, 0.016, -0.15, fx, 'sine', 0.002, 0.1);
    S.breath(T.lift - 0.35, 0.3, true, 0.08, body);
    for (let k = 0; k < 6; k++) S.tone(T.lift + 0.03 + k * 0.055 + R.range(0, 0.02), 0.05, R.range(3200, 4600), 0.012, -0.15, fx, 'sine', 0.002, 0.04);
    { const t = T.lift + 0.33, n = S.noise('white', t, t + 0.3), bp = S.filter('bandpass', 2600, 3), g = ctx.createGain(); S.env(g, t, 0.02, 0.05, 0.2); n.connect(bp); bp.connect(g); g.connect(S.panned(fx, -0.2)); }
    S.breath(T.lift + 0.6, 0.45, false, 0.11, body);
    for (let k = 0; k < 4; k++) S.breath(T.lift + 1.4 + k * 0.85, 0.42, k % 2 === 1, k % 2 ? 0.07 : 0.11, body);
    creak(T.top, 0.9, 58, 0.05, -0.1);                                          // the chair under his braced weight
    rustle(T.lower - 0.1, 0.7, 0.03, -0.15);
    S.breath(T.lower + 0.2, 1.1, false, 0.08, body);
    // touch-down: ceramic on ceramic (a soft clink + a tiny scrape as it settles), then the coffee rocks
    S.clunk(T.down, 0.13, -0.15, fx); S.tone(T.down, 0.35, 3700, 0.018, -0.15, fx, 'sine', 0.002, 0.3);
    S.tone(T.down + 0.05, 0.2, 5200, 0.006, -0.15, fx, 'sine', 0.002, 0.15);
    { const t = T.down + 0.08, n = S.noise('white', t, t + 0.2), bp = S.filter('bandpass', 3000, 4), g = ctx.createGain(); S.env(g, t, 0.01, 0.02, 0.12); n.connect(bp); bp.connect(g); g.connect(S.panned(fx, -0.15)); }
    rustle(T.letGo, 0.5, 0.028, -0.2);
    S.breath(T.letGo + 0.1, 1.0, false, 0.12, body);

    // ---- 5. THE EXPERIMENT: the clamps click open together; two impacts at the MEASURED landing times (2 g first);
    //         shards skitter; in the slow-motion replay the same events land again, slowed and low
    const D = this.app.drop, land = D.lanes.map((o) => o.landT);
    S.click(T.drop, 0.3, -0.25, fx); S.click(T.drop + 0.004, 0.3, 0.25, fx);
    S.tone(T.drop, 0.08, 2400, 0.02, 0, fx, 'square', 0.002, 0.05);
    for (let i = 0; i < 2; i++) {
      const t = T.drop + land[i], pan = i ? 0.35 : -0.35, v = i ? 1.0 : 0.72;          // the 2 g cup lands √2 faster: louder
      S.crunch(t, 0.5 * v, pan, fx, rev); S.click(t + 0.01, 0.2 * v, pan, fx); S.thump(t, 0.2 * v, fx);
      for (let k = 0; k < 10; k++) { const tt = t + 0.06 + Math.pow(k / 10, 1.5) * 0.8 + R.range(0, 0.04); S.tone(tt, 0.05, R.range(3800, 7200), 0.016 * (1 - k / 12) * v, pan + R.range(-0.2, 0.2), fx, 'sine', 0.002, 0.04); }
    }
    // replay: the clamps and the two hits again, an octave-ish lower and longer (slowed tape), plus a low swell
    { const sl = (te) => T.replay + (te - T.replayFrom) / T.replayRate;
      S.tone(sl(0), 0.4, 600, 0.03, 0, fx, 'square', 0.004, 0.3);
      for (let i = 0; i < 2; i++) {
        const t = sl(land[i]), pan = i ? 0.35 : -0.35;
        S.boom(t, 0.3, fx, rev);
        { const n = S.noise('pink', t, t + 1.4), lp = S.filter('lowpass', 900, 0.7), g = ctx.createGain(); S.env(g, t, 0.02, 0.12, 1.2); n.connect(lp); lp.connect(g); g.connect(S.panned(fx, pan)); }
      }
      const t = T.replay - 0.2, d = T.replayEnd - t, n = S.noise('pink', t, t + d + 0.2), bp = S.filter('bandpass', 300, 0.8), g = ctx.createGain();
      bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(140, t + d);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.5); g.gain.linearRampToValueAtTime(0, t + d);
      n.connect(bp); bp.connect(g); g.connect(fx); }

    // ---- 6. OUTSIDE: shoes on stone, the bench creaks, effortful breaths; on attempt 2 the car's springs creak
    //         as he pushes on the wing and again as it rocks back; one heavy step; the passer-by scuffs and gasps
    const scrape = (t, dur, vol, pan) => { const n = S.noise('white', t, t + dur + 0.1), bp = S.filter('bandpass', 1400, 1.2), g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.04); g.gain.linearRampToValueAtTime(vol * 0.6, t + dur * 0.6); g.gain.linearRampToValueAtTime(0, t + dur); n.connect(bp); bp.connect(g); g.connect(S.panned(fx, pan)); };
    const spring = (t, dur, vol, pan) => {   // a coil spring and its rubber: a low metallic groan with a little ring
      const o = ctx.createOscillator(), bp = S.filter('bandpass', 360, 8), g = ctx.createGain(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(48, t); o.frequency.linearRampToValueAtTime(41, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(bp); bp.connect(g); g.connect(S.panned(fx, pan)); o.start(t); o.stop(t + dur + 0.05);
      S.tone(t + 0.02, dur, 820, vol * 0.08, pan, fx, 'sine', 0.01, dur * 0.8);
    };
    const R1 = T.rise1, R2 = T.rise2, ST = T.step;
    S.breath(R1[0] - 0.5, 0.4, true, 0.08, body);
    scrape(R1[0], 0.3, 0.05, 0.1);
    S.breath(R1[0] + 0.3, 0.6, false, 0.12, body);
    creak(R1[0] + 0.1, 0.6, 70, 0.08, 0.1);
    S.whump(R1[0] + 1.55, 0.22, 0.1, fx); creak(R1[0] + 1.58, 0.5, 64, 0.1, 0.1);   // drops back onto the bench
    S.breath(R1[0] + 1.75, 0.9, false, 0.1, body);
    rustle(R2[0] - 0.6, 0.5, 0.03, 0.15);
    S.whump(R2[0] - 0.12, 0.08, 0.2, fx);                                           // his palm on the car's wing
    S.breath(R2[0] - 0.4, 0.35, true, 0.09, body);
    spring(R2[0], 0.7, 0.07, 0.2); scrape(R2[0] + 0.1, 0.35, 0.05, 0.1);
    S.breath(R2[0] + 0.4, 0.55, false, 0.14, body); S.breath(R2[0] + 1.2, 0.5, false, 0.12, body);
    rustle(R2[0] + 0.5, 1.2, 0.03, 0.1);
    spring(R2[0] + 1.6, 0.6, 0.04, 0.2);
    spring(ST[0] - 0.3, 0.9, 0.05, 0.2);                                            // he lets go: the car rocks back up
    S.step(ST[0] + 0.85, 0.22, 0.1, fx); scrape(ST[0] + 0.8, 0.25, 0.04, 0.1);
    S.step(ST[1] + 0.2, 0.12, 0.05, fx);
    S.breath(ST[1] + 0.3, 1.0, false, 0.1, body);
    for (const d of [GB.world + 1.2, GB.wide2 + 0.9, GB.pull + 1.4]) { scrape(d + 0.1, 0.35, 0.04, -0.3); S.gasp(d + 0.15, 0.035, S.panned(body, -0.3)); }
    for (let k = 0; k < 2; k++) S.flap(GB.wide2 + 0.5 + k * 0.6, R.range(-0.6, 0.6), 0.03, fx);
  }
}
