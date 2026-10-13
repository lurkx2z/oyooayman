/* =====================================================================
   AUDIO — "What if Africa suddenly disappeared?" js/audio/audioEngine.js is unchanged (this is a subclass); the DSP
   and generators come from audiokit.js (the gravity films' sound design, copied). Four stems:
     voice  the 25 ElevenLabs clips (never regenerated), levelled per clip, faded just after the last word
     music  an original score (sound-music.js): low strings and a pulse that rise in the narration-free beats
     amb    places: space, the mine, the factory, the port, the storm, the forest, the room, the night, the coast
     sfx    the events: the vanish, the line stopping, the cancellations, the water, the ship, the phone
   Ducking under the voice + a dynamics map (mix.js). Everything is synthesised from seeded noise and maths.
   ===================================================================== */

const AF_STEMS = ['voice', 'music', 'amb', 'sfx'];
const AF_SOUND = { voice: [], music: [], amb: [], sfx: [] };
function afSound(stem, name, fn) { AF_SOUND[stem].push({ name, fn }); }

// the spoken windows (every word), merged when the gap between words is shorter than `merge`
function afSpeechWindows(merge) {
  const ws = [];
  for (const c of AN.clips) c.words.forEach((w, i) => ws.push([w.start, i === c.words.length - 1 ? Math.max(w.end, c.speechEnd) : w.end]));
  ws.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [a, b] of ws) { const L = out[out.length - 1]; if (L && a - L[1] < merge) L[1] = Math.max(L[1], b); else out.push([a, b]); }
  return out;
}
function afDuckDb(t, depth, M, wins) {
  let d = 0;
  for (const [a, b] of wins) {
    const a1 = a - M.lead, a0 = a1 - M.attack, r0 = b + M.hold, r1 = r0 + M.release;
    let k = 0;
    if (t >= a1 && t <= r0) k = 1;
    else if (t < a1 && t > a0) k = 0.5 - 0.5 * Math.cos(Math.PI * (t - a0) / (a1 - a0));
    else if (t > r0 && t < r1) k = 0.5 + 0.5 * Math.cos(Math.PI * (t - r0) / (r1 - r0));
    d = Math.min(d, depth * k);
  }
  return d;
}
// dynamics map keys: [beat, offset, dB]; beat = an AF key ('ship') or a clip edge ('N3<' first word, 'N3>' speech end)
function afBeat(name) {
  const m = /^N(\d+)([<>])$/.exec(name);
  if (m) return m[2] === '<' ? afS(+m[1]) : afE(+m[1]);
  if (AF[name] == null) throw new Error('dyn: unknown beat ' + name);
  return AF[name];
}
function afDynDb(t, keys) {
  if (!keys || !keys.length) return 0;
  const K = keys.map(([b, o, d]) => [afBeat(b) + o, d]).sort((a, b) => a[0] - b[0]);
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, d0] = K[i - 1], [t1, d1] = K[i], u = (t - t0) / Math.max(1e-6, t1 - t0); return d0 + (d1 - d0) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
  return K[K.length - 1][1];
}

class AfAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = 'africa-disappears-soundtrack.wav'; this.solo = null; this.noDuck = false; }
  fingerprintData() {
    return [AF, AN.clips.map((c) => [c.id, c.hash, c.start, c.seconds, c.gainDb]), window.AF_MIX, Object.values(GBX).map(String).join(''),
      Object.values(GbFx.prototype).map(String).join(''), Object.values(AF_SOUND).flat().map((b) => b.name + b.fn).join(''),
      afDuckDb.toString(), afDynDb.toString(), AfAudio.toString(), afFill.toString(), afSea.toString()];
  }
  async renderOffline() {
    this.vo = {};
    if (window.AN_VO && (!this.solo || this.solo === 'voice')) {
      const dc = new OfflineAudioContext(2, 1, this.sampleRate);
      for (const c of AN.clips) {
        const b64 = AN_VO[c.id]; if (!b64) continue;
        const bin = atob(b64), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        this.vo[c.id] = await dc.decodeAudioData(u8.buffer);
      }
    }
    if (this.solo) return super.renderOffline();
    const dur = CONFIG.duration + 1.5, n = Math.ceil(dur * this.sampleRate), groups = [['music'], ['sfx'], ['amb', 'voice']];
    const bufs = await Promise.all(groups.map((g) => { const ctx = new OfflineAudioContext(2, n, this.sampleRate); this._build(ctx, { stems: g, noMaster: true }); return ctx.startRendering(); }));
    for (const b of bufs.slice(1)) for (let c = 0; c < 2; c++) { const x = b.getChannelData(c), y = bufs[0].getChannelData(c); for (let i = 0; i < n; i++) y[i] += x[i]; }
    const mc = new OfflineAudioContext(2, n, this.sampleRate), src = mc.createBufferSource();
    src.buffer = bufs[0]; bufs.length = 0; src.connect(this._master(mc)); src.start(0);
    const buf = await mc.startRendering();
    AudioEngine.declick(buf);
    return Edit.spliceAudio(buf);
  }
  // the master: the cut to silence at the very end, then a fast peak limiter
  _master(ctx) {
    const master = ctx.createGain(), M = window.AF_MIX;
    master.gain.value = Math.pow(10, (M.master || 0) / 20);
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
    master.connect(lim); lim.connect(ctx.destination);
    return master;
  }
  _build(ctx, o = {}) {
    const M = window.AF_MIX, END = CONFIG.duration + 1.5, only = this.solo;
    let master;
    if (only || o.noMaster) { master = ctx.createGain(); master.connect(ctx.destination); }
    if (!master) master = this._master(ctx);
    const wins = afSpeechWindows(M.merge);
    for (const id of AF_STEMS) {
      if (only && only !== id) continue;
      if (o.stems && !o.stems.includes(id)) continue;
      const st = M.stems[id], bus = ctx.createGain();
      let node = bus;
      if (st.hp) for (let k = 0; k < 2; k++) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = st.hp; f.Q.value = 0.707; node.connect(f); node = f; }
      const trim = ctx.createGain(), duck = ctx.createGain();
      trim.gain.value = only ? 1 : Math.pow(10, st.gain / 20);
      node.connect(trim); trim.connect(duck); duck.connect(master);
      const dyn = (M.dyn || {})[id], dk = st.duck && !this.noDuck;
      const n = Math.ceil(END * 100) + 1, c = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / 100;
        let db = (dk ? afDuckDb(t, st.duck, M, wins) : 0) + (this.noDuck ? 0 : afDynDb(t, dyn));
        if (id !== 'voice' && t > AF.end - 0.06) db = -120;            // the cut to silence
        c[i] = Math.pow(10, db / 20);
      }
      duck.gain.setValueCurveAtTime(c, 0, END);
      if (id === 'voice') this._voice(ctx, bus);
      else for (const b of AF_SOUND[id]) b.fn.call(this, ctx, bus, this._kit(ctx, id, bus), END);
    }
  }
  _kit(ctx, stem, bus) {
    const fx = new GbFx(ctx, CONFIG.seed + 11 * AF_STEMS.indexOf(stem) + 3);
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
    const C = window.AF_MIX.voiceComp;
    const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 180; low.gain.value = -1.0;
    const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 3200; pres.Q.value = 0.9; pres.gain.value = 2;
    const vc = ctx.createDynamicsCompressor(); vc.threshold.value = C.threshold; vc.knee.value = C.knee; vc.ratio.value = C.ratio; vc.attack.value = C.attack; vc.release.value = C.release;
    const mk = ctx.createGain(); mk.gain.value = Math.pow(10, 4 / 20);
    low.connect(pres); pres.connect(vc); vc.connect(mk); mk.connect(dest);
    for (const c of AN.clips) {
      const buf = this.vo && this.vo[c.id]; if (!buf) continue;
      const src = ctx.createBufferSource(), g = ctx.createGain(), v = Math.pow(10, (c.gainDb + ((window.AF_MIX.voiceTrim || {})[c.id] || 0)) / 20);
      const f1 = Math.min(c.start + buf.duration, c.speechEnd + 0.3);   // every word whole; fade just after the last one
      src.buffer = buf; src.connect(g); g.connect(low); src.start(Math.max(0, c.start), Math.max(0, -c.start)); src.stop(f1 + 0.02);
      g.gain.setValueAtTime(v, Math.max(0, c.start)); g.gain.setValueAtTime(v, f1 - 0.12); g.gain.linearRampToValueAtTime(0, f1);
    }
  }
}
