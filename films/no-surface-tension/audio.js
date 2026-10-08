/* =====================================================================
   AUDIO — placeholder (replaced by the full sound pass)
   ===================================================================== */
class NstAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  fingerprintData() { return [NST, 0]; }
  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed);
    const out = ctx.createGain(); out.gain.value = 0.3; out.connect(ctx.destination);
    const n = S.noise('pink', 0, CONFIG.duration + 1), f = S.filter('lowpass', 600, 0.7); n.connect(f); f.connect(out);
  }
}
