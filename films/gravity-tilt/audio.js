/* =====================================================================
   AUDIO — "What if gravity tilted 90° for one hour?" js/audio/audioEngine.js is unchanged (this is a subclass); the
   DSP and generators come from audiokit.js (via the Friction 10s film). No narrator: the captions are silent and the
   sound carries the gaps. Three stems:
     music  an original score that hangs on one unresolved chord for the hour and only resolves when down comes back
            (sound-music.js)
     amb    the bedroom, the street, the river: wind that never stops (the air still falls the old way), the rain
            (sound-amb.js)
     sfx    the events at their story seconds (each heard once: the clock only runs forward); in the sped-up stretches
            the long sounds are cut short and the busy ones thinned out (sound-sfx.js)
   A dynamics map per stem (mix.js), then a true-peak limiter. Everything is synthesised from seeded noise and maths.
   ===================================================================== */

const GT_STEMS = ['music', 'amb', 'sfx'];
const GT_SOUND = { music: [], amb: [], sfx: [] };
function gtSound(stem, name, fn) { GT_SOUND[stem].push({ name, fn }); }

// dynamics map keys: [beat, offset s, dB]; beat = a GT key ('tB') or a number (seconds)
function gtBeat(b) { if (typeof b === 'number') return b; if (GT[b] == null) throw new Error('dyn: unknown beat ' + b); return Array.isArray(GT[b]) ? GT[b][0] : GT[b]; }
function gtDynDb(t, keys) {
  if (!keys || !keys.length) return 0;
  const K = keys.map(([b, o, d]) => [gtBeat(b) + o, d]).sort((a, b) => a[0] - b[0]);
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, d0] = K[i - 1], [t1, d1] = K[i], u = (t - t0) / Math.max(1e-6, t1 - t0); return d0 + (d1 - d0) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
  return K[K.length - 1][1];
}

// a look-ahead true-peak limiter on a rendered AudioBuffer (in place): the peak between samples is estimated by 4×
// windowed-sinc oversampling; the gain needed to keep it under `ceilDb` is held ahead of each peak (5 ms look-ahead,
// linear attack) and released over ~120 ms. Deterministic; the page and the video get exactly the same sound.
function gtLimit(buf, ceilDb) {
  const sr = buf.sampleRate, n = buf.length, C = buf.numberOfChannels, ceil = Math.pow(10, ceilDb / 20), ch = [];
  for (let c = 0; c < C; c++) ch.push(buf.getChannelData(c));
  const TAPS = 8, PH = [0.25, 0.5, 0.75].map((f) => {
    const w = []; let sum = 0;
    for (let k = -TAPS + 1; k <= TAPS; k++) { const x = k - f, sinc = Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x), win = 0.5 + 0.5 * Math.cos(Math.PI * x / TAPS); w.push(sinc * win); sum += sinc * win; }
    return w.map((v) => v / sum);
  });
  const need = new Float32Array(n).fill(1);
  for (const x of ch) for (let i = 0; i < n; i++) {
    let p = Math.abs(x[i]);
    if (p > ceil * 0.7) for (const w of PH) { let v = 0; for (let k = 0; k < w.length; k++) { const j = i + k - TAPS + 1; if (j >= 0 && j < n) v += w[k] * x[j]; } p = Math.max(p, Math.abs(v)); }
    if (p > ceil) need[i] = Math.min(need[i], ceil / p);
  }
  const L = Math.round(0.005 * sr), g1 = new Float32Array(n), dq = new Int32Array(n);
  let h = 0, e = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (e > h && need[dq[e - 1]] >= need[i]) e--;
    dq[e++] = i; while (dq[h] > i + L) h++;
    g1[i] = need[dq[h]];
  }
  let acc = 0; const rel = 1 - Math.exp(-1 / (0.12 * sr));
  let g = 1;
  for (let i = 0; i < n; i++) {
    acc += g1[i] - (i >= L ? g1[i - L] : 0);
    const g2 = (acc + Math.max(0, L - i - 1)) / L;
    g = Math.min(g2, g + (1 - g) * rel);
    if (g < 1) for (const x of ch) x[i] *= g;
  }
  return buf;
}

class GtAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = 'gravity-tilt-soundtrack.wav'; this.solo = null; }
  fingerprintData() {
    const consts = { GTP, GT_W, GT_ROOM, GT_BOOKS, GT_YOU, GT_CAT, GT_BATH, GT_GLASS, GT_BOLT, GT_FALLERS, GT_LEN, GT_VT, GT_JOG, GT_TER, GT_RIVER, GT_CLOCK, GT_SHOTS, GT_CAMXY, GT_TILES };
    return [GT, GTT, window.GT_MIX, Object.values(GTX).map(String).join(''), GtFx.toString(), Object.getOwnPropertyNames(GtFx.prototype).map((k) => String(GtFx.prototype[k])).join(''),
      Object.values(GT_SOUND).flat().map((b) => b.name + b.fn).join(''), gtDynDb.toString(), GtAudio.toString(), gtLimit.toString(), gtStoryAt.toString(), gtSegAt.toString(), JSON.stringify(consts),
      (window.GT_SOUND_FNS || []).map(String).join(''), [gtShotAt, gtFaller, gtFall, gtDrop, gtDropT, gtDropV, gtTerSlip, gtJog, gtBook, gtBathIn, gtPool, gtCrack, gtLean].map(String).join('')];
  }
  async renderOffline() {
    if (this.solo) return super.renderOffline();
    const dur = CONFIG.duration + 1.5, n = Math.ceil(dur * this.sampleRate), groups = [['music'], ['sfx'], ['amb']];
    const bufs = [];
    for (const g of groups) { const ctx = new OfflineAudioContext(2, n, this.sampleRate); this._build(ctx, { stems: g, noMaster: true }); bufs.push(await ctx.startRendering()); }
    for (const b of bufs.slice(1)) for (let c = 0; c < 2; c++) { const x = b.getChannelData(c), y = bufs[0].getChannelData(c); for (let i = 0; i < n; i++) y[i] += x[i]; }
    const mc = new OfflineAudioContext(2, n, this.sampleRate), src = mc.createBufferSource();
    src.buffer = bufs[0]; bufs.length = 0; src.connect(this._master(mc)); src.start(0);
    const buf = await mc.startRendering();
    AudioEngine.declick(buf);
    gtLimit(buf, window.GT_MIX.ceiling ?? -1.5);
    return Edit.spliceAudio(buf);
  }
  _master(ctx) {
    const master = ctx.createGain(), M = window.GT_MIX;
    master.gain.value = Math.pow(10, (M.master || 0) / 20);
    // (a gentle tilt: a little less boom, a little more air, so phones and laptops hear the piano and the garden)
    let out = master;
    for (const [type, f, g] of M.eq || []) { const q = ctx.createBiquadFilter(); q.type = type; q.frequency.value = f; q.gain.value = g; out.connect(q); out = q; }
    out.connect(ctx.destination);
    return master;
  }
  _build(ctx, o = {}) {
    const M = window.GT_MIX, END = CONFIG.duration + 1.5, only = this.solo;
    let master;
    if (only || o.noMaster) { master = ctx.createGain(); master.connect(ctx.destination); }
    if (!master) master = this._master(ctx);
    for (const id of GT_STEMS) {
      if (only && only !== id) continue;
      if (o.stems && !o.stems.includes(id)) continue;
      const st = M.stems[id], bus = ctx.createGain();
      let node = bus;
      if (st.hp) for (let k = 0; k < 2; k++) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = st.hp; f.Q.value = 0.707; node.connect(f); node = f; }
      const trim = ctx.createGain(), dynG = ctx.createGain();
      trim.gain.value = only ? 1 : Math.pow(10, st.gain / 20);
      node.connect(trim); trim.connect(dynG); dynG.connect(master);
      const dyn = (M.dyn || {})[id];
      const n = Math.ceil(END * 100) + 1, c = new Float32Array(n);
      for (let i = 0; i < n; i++) { const t = i / 100; c[i] = Math.pow(10, gtDynDb(t, dyn) / 20); }
      dynG.gain.setValueCurveAtTime(c, 0, END);
      for (const b of GT_SOUND[id]) b.fn.call(this, ctx, bus, this._kit(ctx, id, bus), END);
    }
  }
  _kit(ctx, stem, bus) {
    const fx = new GtFx(ctx, CONFIG.seed + 11 * GT_STEMS.indexOf(stem) + 3);
    const verbs = {};
    return {
      fx, sr: fx.sr, r: fx.r, ctx, bus,
      verb(name, sec, o = {}) {
        if (verbs[name]) return verbs[name];
        const cv = fx.ir(sec, o), w = ctx.createGain(), inp = ctx.createGain(); w.gain.value = o.wet ?? 0.4;
        inp.connect(cv); cv.connect(w); w.connect(bus); return (verbs[name] = inp);
      },
      put(x, t, o = {}) {
        const node = ctx.createGain(); node.connect(bus);
        if (o.room) { const sg = ctx.createGain(); sg.gain.value = o.wet ?? 1; node.connect(sg); sg.connect(o.room); }
        if (o.lp || o.hp) { const f = ctx.createBiquadFilter(); f.type = o.lp ? 'lowpass' : 'highpass'; f.frequency.value = o.lp || o.hp; f.Q.value = 0.7; f.connect(node); return fx.play(x, t, f, o); }
        return fx.play(x, t, node, o);
      },
      putLR(L, R, t, o = {}) { const node = ctx.createGain(); node.connect(bus); if (o.room) { const sg = ctx.createGain(); sg.gain.value = o.wet ?? 1; node.connect(sg); sg.connect(o.room); } return fx.play(L, t, node, Object.assign({ xr: R }, o)); },
    };
  }
}
