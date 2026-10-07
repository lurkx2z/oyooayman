/* =====================================================================
   AUDIO — the episode's soundtrack, synthesised and rendered offline (js/audio/audioEngine.js).
   Schedule every cue at ABSOLUTE STORY TIMES in _build(ctx). Bake it when the film is final:
     NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page gravity-2x.html --out films/gravity-2x/soundtrack.js
   Layers: city bed → your steps → the rule-change hit → a quiet pulse → the payoff → silence → the closing chord.
   ===================================================================== */

class GvAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // anything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() { return [GV]; }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), T = GV, END = CONFIG.duration + 1.0;
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);

    // mix chain: buses → compressor → out → limiter
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12; lim.connect(ctx.destination);
    const out = ctx.createGain(); out.gain.value = 1.0; out.connect(lim);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.connect(out);
    const mix = ctx.createGain(); mix.gain.value = 2.4; mix.connect(comp);
    const rev = S.reverb(2.4), revG = ctx.createGain(); revG.gain.value = 0.25; rev.connect(revG); revG.connect(mix);
    const bus = (g) => { const b = ctx.createGain(); b.gain.value = g; b.connect(mix); return b; };
    const amb = bus(0.8), you = bus(0.9), mus = bus(0.5), fx = bus(1.0);

    // 1. the city bed (filtered noise layers), ducked to near-silence before the payoff and after it
    const bed = (type, f, q, vol) => { const n = S.noise(type, 0, END), b = S.filter('lowpass', f, q), g = ctx.createGain(); g.gain.value = vol; n.connect(b); b.connect(g); g.connect(amb); };
    bed('brown', 320, 0.7, 0.35); bed('pink', 1800, 0.5, 0.06);
    amb.gain.setValueAtTime(0.8, 0); amb.gain.linearRampToValueAtTime(0.8, T.payoff - 1.2); amb.gain.linearRampToValueAtTime(0.15, T.payoff - 0.2);
    amb.gain.setValueAtTime(0.15, T.payoff + 2.5); amb.gain.linearRampToValueAtTime(0.0, T.line[0]);

    // 2. your footsteps, from the camera's walk (stops when you stop)
    const C = SCRIPT.camera, zT = new Track(C.z);
    let walked = 0, next = 0.7, pz = zT.value(0);
    for (let t = 0; t < CONFIG.duration; t += 1 / 60) {
      const z = zT.value(t); walked += Math.abs(z - pz); pz = z;
      if (walked >= next) { S.step(t, 0.22, (Math.round(next / 0.7) % 2 ? 0.15 : -0.15), you); next += 0.7; }
    }

    // 3. the rule change: a soft low hit + a rising tone under the title
    S.thump(T.rule[0] + 0.1, 0.5, fx);
    S.tone(T.rule[0], 2.0, 110, 0.05, 0, mus, 'triangle', 0.4, 1.2);

    // 4. a quiet pulse that tightens toward the payoff (music supports, sound effects dominate)
    for (let t = T.first; t < T.payoff - 0.3; ) {
      const k = MathX.ramp(t, T.first, T.payoff);
      S.tone(t, 0.25, 55, 0.08 + 0.08 * k, 0, mus, 'sine', 0.01, 0.2);
      t += MathX.lerp(1.0, 0.45, k);
    }

    // 5. the payoff: the biggest sound of the film, then silence
    S.boom(T.payoff, 0.9, fx, rev);
    S.thump(T.payoff + 0.05, 0.7, fx);

    // 6. the closing chord under the line
    for (const f of [110, 164.8, 220, 277.2]) S.tone(T.line[0] - 0.2, 4.5, f, 0.035, 0, mus, 'sine', 1.2, 2.5);
  }
}
