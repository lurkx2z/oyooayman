/* =====================================================================
   AUDIO — "What If Every Step You Took Was Twice as Long?" js/audio/audioEngine.js is unchanged (this is a subclass);
   the sample-level DSP and generators come from audiokit.js (via the ocean-rising film). Four stems:
     voice  the 79 ElevenLabs clips (Michael; never regenerated, never cut or sped up), levelled per clip, faded just
            after the last word
     music  an original score (sound-music.js); it leads
     amb    the places: the street, the café, Manhattan, the wind of the climb, the hum of space (sound-amb.js)
     sfx    the steps, the landings, the boom, the glass, the crowds, the sirens… each at its story moment (sound-sfx.js)
   Ducking under the voice + a dynamics map per stem (mix.js), then a true-peak limiter. Everything is synthesised
   from seeded noise and maths (the Tesla film's voice stem + the ocean-rising film's fingerprint fix).
   ===================================================================== */

const TW_STEMS = ['voice', 'music', 'amb', 'sfx'];
const TW_SOUND = { voice: [], music: [], amb: [], sfx: [] };
function twSound(stem, name, fn) { TW_SOUND[stem].push({ name, fn }); }

// the spoken windows (every word), merged when the gap between words is shorter than `merge`
function twSpeechWindows(merge) {
  const ws = [];
  for (const c of TWN.clips) c.words.forEach((w, i) => ws.push([w.start, i === c.words.length - 1 ? Math.max(w.end, c.speechEnd) : w.end]));
  ws.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [a, b] of ws) { const L = out[out.length - 1]; if (L && a - L[1] < merge) L[1] = Math.max(L[1], b); else out.push([a, b]); }
  return out;
}
// a window that ends just before one of the film's hits (M.fast: film seconds) lets go at once, so the hit lands at full level
function twDuckDb(t, depth, M, wins, hits) {
  let d = 0;
  for (const [a, b] of wins) {
    if (t < a - M.lead - M.attack - 0.01 || t > b + M.hold + M.release + 0.01) continue;
    const a1 = a - M.lead, a0 = a1 - M.attack, hit = hits.find((h) => h > b - 0.05 && h - b < 1.5);
    const r0 = hit != null ? Math.min(b + 0.02, hit - 0.1) : b + M.hold, r1 = hit != null ? Math.min(r0 + 0.1, hit) : r0 + M.release;
    let k = 0;
    if (t >= a1 && t <= r0) k = 1;
    else if (t < a1 && t > a0) k = 0.5 - 0.5 * Math.cos(Math.PI * (t - a0) / (a1 - a0));
    else if (t > r0 && t < r1) k = 0.5 + 0.5 * Math.cos(Math.PI * (t - r0) / (r1 - r0));
    d = Math.min(d, depth * k);
  }
  return d;
}
// a beat in the dynamics map: film seconds, 'L<n>' step n lands, 'S<n>' step n starts, '<id' a clip's first word,
// '>id' its speech end, 'id:word[:i]' a word of a clip, 'boom', 'end'
function twBeat(b) {
  if (typeof b === 'number') return b;
  let m;
  if ((m = /^L(\d+)$/.exec(b))) return TW_T[+m[1]] + (TW_D[+m[1]] || 0);
  if ((m = /^S(\d+)$/.exec(b))) return TW_T[+m[1]];
  if (b[0] === '<') return twW(b.slice(1), 0);
  if (b[0] === '>') return twE(b.slice(1));
  if ((m = /^(\w+):([\w']+)(?::(\d+))?$/.exec(b))) return twWord(m[1], m[2], +(m[3] || 0));
  if (b === 'boom') return TW_BOOM.t;
  if (b === 'end') return TW.end;
  throw new Error('dyn: unknown beat ' + b);
}
function twDynDb(t, K) {
  if (!K || !K.length) return 0;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, d0] = K[i - 1], [t1, d1] = K[i], u = (t - t0) / Math.max(1e-6, t1 - t0); return d0 + (d1 - d0) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
  return K[K.length - 1][1];
}
const twDynKeys = (keys) => (keys || []).map(([b, o, d]) => [twBeat(b) + o, d]).sort((a, b) => a[0] - b[0]);

// a look-ahead true-peak limiter on a rendered AudioBuffer (in place): the peak between samples is estimated by 4×
// windowed-sinc oversampling; the gain needed to keep it under `ceilDb` is held ahead of each peak (5 ms look-ahead,
// linear attack) and released over ~120 ms. Deterministic; the page and the video get exactly the same sound.
function twLimit(buf, ceilDb) {
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

class TwAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = 'twice-as-long-soundtrack.wav'; this.solo = null; this.noDuck = false; }
  fingerprintData() {
    const fns = (a) => a.map(String).join('');
    return [TW, TW_T, TW_D, TWN.clips.map((c) => [c.id, c.hash, c.start, c.seconds, c.gainDb]), window.TW_MIX, Object.values(TWX).map(String).join(''),
      TwFx.toString(), Object.getOwnPropertyNames(TwFx.prototype).map((k) => String(TwFx.prototype[k])).join(''),
      Object.values(TW_SOUND).flat().map((b) => b.name + b.fn).join(''), fns([twSpeechWindows, twDuckDb, twBeat, twDynDb, twDynKeys, twLimit, TwAudio, twStory, twFilmOf, twStepAt, twDist]),
      TW_SHOTS.map((s) => [s.id, s.set, s.mode, s.t0, s.t1]), TW_BOOM, (window.TW_SOUND_FNS || []).map(String).join(''), window.TW_THEME || null];
  }
  // AudioEngine's fingerprint, with every number rounded to 7 significant digits: browsers' Math.exp/sin/acosh… can
  // differ in the last bit (Safari, Firefox), and then the baked copy was refused and the whole soundtrack rendered
  // live, minutes of a silent film. Same inputs as the engine's otherwise.
  fingerprint() {
    const J = (v) => JSON.stringify(v, (k, x) => (typeof x === 'number' ? +x.toPrecision(7) : x));
    let s = `${CONFIG.duration}|${CONFIG.seed}|${this.sampleRate}|${J(SCRIPT)}|`;
    if (CONFIG.edit) s += J(CONFIG.edit) + '|';
    try { s += J(this.fingerprintData()); } catch (e) { s += 'x'; }
    const add = (proto) => { for (const k of Object.getOwnPropertyNames(proto)) { const d = Object.getOwnPropertyDescriptor(proto, k); s += k + String(d.value || d.get || ''); } };
    for (let p = Object.getPrototypeOf(this); p && p !== Object.prototype; p = Object.getPrototypeOf(p)) add(p);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }
  // iPhones mute Web Audio when the ring switch is on silent; 'playback' makes it play like a video does
  ensureContext() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
    return super.ensureContext();
  }
  async renderOffline() {
    this.vo = {};
    if (window.TWN_VO && (!this.solo || this.solo === 'voice')) {
      const dc = new OfflineAudioContext(2, 1, this.sampleRate);
      for (const c of TWN.clips) {
        const b64 = TWN_VO[c.id]; if (!b64) continue;
        const bin = atob(b64), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        this.vo[c.id] = await dc.decodeAudioData(u8.buffer);
      }
    }
    if (this.solo) return super.renderOffline();
    const dur = CONFIG.duration + 1.5, n = Math.ceil(dur * this.sampleRate), groups = [['music'], ['sfx'], ['amb', 'voice']];
    const bufs = [];
    for (const g of groups) { const ctx = new OfflineAudioContext(2, n, this.sampleRate); this._build(ctx, { stems: g, noMaster: true }); bufs.push(await ctx.startRendering()); }
    for (const b of bufs.slice(1)) for (let c = 0; c < 2; c++) { const x = b.getChannelData(c), y = bufs[0].getChannelData(c); for (let i = 0; i < n; i++) y[i] += x[i]; }
    const mc = new OfflineAudioContext(2, n, this.sampleRate), src = mc.createBufferSource();
    src.buffer = bufs[0]; bufs.length = 0; src.connect(this._master(mc)); src.start(0);
    const buf = await mc.startRendering();
    AudioEngine.declick(buf);
    twLimit(buf, window.TW_MIX.ceiling ?? -1.5);
    return Edit.spliceAudio(buf);
  }
  _master(ctx) {
    const master = ctx.createGain(), M = window.TW_MIX;
    master.gain.value = Math.pow(10, (M.master || 0) / 20);
    let out = master;
    for (const [type, f, g] of M.eq || []) { const q = ctx.createBiquadFilter(); q.type = type; q.frequency.value = f; q.gain.value = g; out.connect(q); out = q; }
    out.connect(ctx.destination);
    return master;
  }
  _build(ctx, o = {}) {
    const M = window.TW_MIX, END = CONFIG.duration + 1.5, only = this.solo;
    let master;
    if (only || o.noMaster) { master = ctx.createGain(); master.connect(ctx.destination); }
    if (!master) master = this._master(ctx);
    const wins = twSpeechWindows(M.merge), hits = (M.fast || []).map(twBeat);
    for (const id of TW_STEMS) {
      if (only && only !== id) continue;
      if (o.stems && !o.stems.includes(id)) continue;
      const st = M.stems[id], bus = ctx.createGain();
      let node = bus;
      if (st.hp) for (let k = 0; k < 2; k++) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = st.hp; f.Q.value = 0.707; node.connect(f); node = f; }
      const trim = ctx.createGain(), duck = ctx.createGain();
      trim.gain.value = only ? 1 : Math.pow(10, st.gain / 20);
      node.connect(trim); trim.connect(duck); duck.connect(master);
      const dyn = twDynKeys((M.dyn || {})[id]), dk = st.duck && !this.noDuck;
      const n = Math.ceil(END * 100) + 1, c = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / 100;
        let db = (dk ? twDuckDb(t, st.duck, M, wins, hits) : 0) + (this.noDuck ? 0 : twDynDb(t, dyn));
        if (id !== 'voice' && t > TW.end - 1 / 30) db = -120;          // the cut to silence (on the last frame)
        c[i] = Math.pow(10, db / 20);
      }
      duck.gain.setValueCurveAtTime(c, 0, END);
      if (id === 'voice') this._voice(ctx, bus);
      else for (const b of TW_SOUND[id]) b.fn.call(this, ctx, bus, this._kit(ctx, id, bus), END);
    }
  }
  _kit(ctx, stem, bus) {
    const fx = new TwFx(ctx, CONFIG.seed + 11 * TW_STEMS.indexOf(stem) + 3);
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
  _voice(ctx, dest) {
    const C = window.TW_MIX.voiceComp;
    const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 180; low.gain.value = -1.0;
    const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 3200; pres.Q.value = 0.9; pres.gain.value = 2;
    const vc = ctx.createDynamicsCompressor(); vc.threshold.value = C.threshold; vc.knee.value = C.knee; vc.ratio.value = C.ratio; vc.attack.value = C.attack; vc.release.value = C.release;
    const mk = ctx.createGain(); mk.gain.value = Math.pow(10, 4 / 20);
    low.connect(pres); pres.connect(vc); vc.connect(mk); mk.connect(dest);
    // the per-clip trims go after the compressor (before it, 3:1 would undo most of them); each is set in the
    // silence before its clip
    const trims = window.TW_MIX.voiceTrim || {}, order = TWN.clips.slice().sort((a, b) => a.start - b.start);
    order.forEach((c, i) => { const at = i ? Math.max(order[i - 1].speechEnd + 0.35, c.start - 0.05) : 0; mk.gain.setValueAtTime(Math.pow(10, (4 + (trims[c.id] || 0)) / 20), Math.max(0, at)); });
    for (const c of TWN.clips) {
      const buf = this.vo && this.vo[c.id]; if (!buf) continue;
      const src = ctx.createBufferSource(), g = ctx.createGain(), v = Math.pow(10, c.gainDb / 20);
      const f1 = Math.min(c.start + buf.duration, c.speechEnd + 0.3);   // every word whole; fade just after the last one
      src.buffer = buf; src.connect(g); g.connect(low); src.start(Math.max(0, c.start), Math.max(0, -c.start)); src.stop(f1 + 0.02);
      g.gain.setValueAtTime(v, Math.max(0, c.start)); g.gain.setValueAtTime(v, f1 - 0.12); g.gain.linearRampToValueAtTime(0, f1);
    }
  }
}
