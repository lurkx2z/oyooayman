/* =====================================================================
   AUDIO — "What If You Went Blind?" js/audio/audioEngine.js is unchanged (this is a subclass); the DSP and generators
   come from audiokit.js (the gravity films' sound design). Five stems, as in the gravity films' dynamic mix:
     voice  the fourteen ElevenLabs clips (never regenerated), levelled per clip, faded just after the last word
     music  an original score (felt piano, strings, a low pulse): sparse under the narrator, rising in the silences
     amb    room tones and places (the bedroom, the hall, the training rooms, the street, the rain, the hall)
     foley  her breath, cloth, hands, steps, the cane
     sfx    the information-carrying sounds: clicks, taps, impacts, and their ECHOES, rendered per room from a simple
            image-source model (the same walls the picture uses), so what you see and what you hear agree
   Every sound is synthesised from seeded noise and maths: a pure function of time.
   ===================================================================== */

const BE_STEMS = ['voice', 'music', 'amb', 'foley', 'sfx'];

// chapter sound files register their builders per stem: beSound('sfx', 'bedroom', (ctx, dest, K, END) => { … })
const BE_SOUND = { voice: [], music: [], amb: [], foley: [], sfx: [] };
function beSound(stem, name, fn) { BE_SOUND[stem].push({ name, fn }); }

// ROOMS: each place has its own acoustics. The early reflections come from an image-source model of the room's box
// (the same walls the picture uses: a wall 2 m away answers ≈ 12 ms after the sound), the tail from its reverberation
// time. o: { size: [x, y, z] (m), src, lis: [x, y, z] (relative to the box's min corner), rt60 (s), absorb (0…1), bright }
function beRoomIR(fx, o) {
  const c = 343, [X, Y, Z] = o.size, s = o.src, l = o.lis, ab = o.absorb ?? 0.3, early = [];
  if (X && Y && Z) {
    for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) for (let k = -2; k <= 2; k++) {
      const n = Math.abs(i) + Math.abs(j) + Math.abs(k); if (!n) continue;
      const im = (q, L, src) => (q % 2 ? (q + 1) * L - src : q * L + src);   // image of the source across q walls
      const px = im(i, X, s[0]), py = im(j, Y, s[1]), pz = im(k, Z, s[2]);
      const d = Math.hypot(px - l[0], py - l[1], pz - l[2]), d0 = Math.hypot(s[0] - l[0], s[1] - l[1], s[2] - l[2]);
      early.push([(d - d0) / c, Math.pow(1 - ab, n) * d0 / d * 0.8]);
    }
  }
  return fx.ir(Math.max(0.25, o.rt60 * 1.3), { bright: o.bright ?? 0.5, damp: o.damp ?? 3, shape: o.shape ?? 1.8, pre: o.pre ?? 0.004, early, seed: o.seed || 77 });
}

// the spoken windows: every word, merged when the gap between words is shorter than `merge`
function beSpeechWindows(merge) {
  const ws = [];
  for (const c of BN.clips) c.words.forEach((w, i) => ws.push([w.start, i === c.words.length - 1 ? Math.max(w.end, c.speechEnd) : w.end]));
  ws.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [a, b] of ws) { const L = out[out.length - 1]; if (L && a - L[1] < merge) L[1] = Math.max(L[1], b); else out.push([a, b]); }
  return out;
}
function beDuckDb(t, depth, M, wins) {
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
// dynamics-map keys: [beat, offset, dB]; a beat is a BE key ('impact', 'slide[1]') or a clip edge ('N3<' first word, 'N3>' speech end)
function beBeat(name) {
  const m = /^N(\d+)([<>])$/.exec(name);
  if (m) { const c = BN_CLIP[+m[1]]; return m[2] === '<' ? c.words[0].start : c.speechEnd; }
  const k = /^(\w+)(?:\[(\d)\])?$/.exec(name), v = BE[k[1]];
  if (v == null) throw new Error('dyn: unknown beat ' + name);
  return k[2] != null ? v[+k[2]] : v;
}
function beDynDb(t, keys) {
  if (!keys || !keys.length) return 0;
  const K = keys.map(([b, o, d]) => [beBeat(b) + o, d]).sort((a, b) => a[0] - b[0]);
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, d0] = K[i - 1], [t1, d1] = K[i], u = (t - t0) / Math.max(1e-6, t1 - t0); return d0 + (d1 - d0) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
  return K[K.length - 1][1];
}

class BeAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = 'blind-echolocation-soundtrack.wav'; this.solo = null; this.noDuck = false; }
  fingerprintData() {
    return [BE, BN.clips.map((c) => [c.id, c.hash, c.start, c.seconds, c.gainDb]), window.BE_MIX, Object.values(GBX).map(String).join(''),
      Object.values(GbFx.prototype).map(String).join(''), beSpeechWindows.toString(), beRoomIR.toString(), Object.values(BE_SOUND).flat().map((b) => b.name + b.fn).join(''), typeof beMusicKit === 'function' ? beMusicKit.toString() : '', beDuckDb.toString(), beDynDb.toString(), BeAudio.toString()];
  }
  async renderOffline() {
    this.vo = {};
    if (window.BN_VO && (!this.solo || this.solo === 'voice')) {
      const dc = new OfflineAudioContext(2, 1, this.sampleRate);
      for (const c of BN.clips) {
        const b64 = BN_VO[c.id]; if (!b64) continue;
        const bin = atob(b64), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        this.vo[c.id] = await dc.decodeAudioData(u8.buffer);
      }
    }
    return super.renderOffline();
  }
  _build(ctx) {
    const M = window.BE_MIX, END = CONFIG.duration + 1.5, only = this.solo;
    const master = ctx.createGain();
    master.gain.setValueAtTime(1, 0); master.gain.setValueAtTime(1, CONFIG.duration - (window.BE_CUT ? 1.4 : 3)); master.gain.linearRampToValueAtTime(0, CONFIG.duration);
    if (only) master.connect(ctx.destination);
    else { const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1; master.connect(lim); lim.connect(ctx.destination); }
    const wins = beSpeechWindows(M.merge);
    for (const id of BE_STEMS) {
      if (only && only !== id) continue;
      const st = M.stems[id], bus = ctx.createGain();
      let node = bus;
      if (st.hp) for (let k = 0; k < 2; k++) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = st.hp; f.Q.value = 0.707; node.connect(f); node = f; }
      const trim = ctx.createGain(), duck = ctx.createGain();
      trim.gain.value = only ? 1 : Math.pow(10, st.gain / 20);
      node.connect(trim); trim.connect(duck); duck.connect(master);
      const dyn = (M.dyn || {})[id], dk = st.duck && !this.noDuck;
      if (dk || dyn) {
        const n = Math.ceil(END * 100) + 1, c = new Float32Array(n);
        for (let i = 0; i < n; i++) c[i] = Math.pow(10, ((dk ? beDuckDb(i / 100, st.duck, M, wins) : 0) + (this.noDuck ? 0 : beDynDb(i / 100, dyn))) / 20);
        duck.gain.setValueCurveAtTime(c, 0, END);
      }
      if (this['_' + id]) this['_' + id](ctx, bus, END);
      if (id !== 'voice') for (const b of BE_SOUND[id]) b.fn.call(this, ctx, bus, this._kit(ctx, id, bus), END);
    }
  }

  // the kit handed to every chapter builder: generators, the room sends, a few instruments
  _kit(ctx, stem, bus) {
    const K = this._K || (this._K = {}), fx = new GbFx(ctx, CONFIG.seed + 11 * BE_STEMS.indexOf(stem) + 3), sr = fx.sr;
    const rooms = {};
    const kit = {
      fx, sr, r: fx.r, ctx, bus,
      // a room send: K.room('bedroom', {size, src, lis, rt60, absorb, wet})
      room(name, o) {
        if (rooms[name]) return rooms[name];
        const cv = beRoomIR(fx, o), w = ctx.createGain(), inp = ctx.createGain(); w.gain.value = o.wet ?? 0.35;
        inp.connect(cv); cv.connect(w); w.connect(bus); return (rooms[name] = inp);
      },
      // play a mono array at t: dry into the stem (panned), plus a send into a room (o.room node, o.wet level)
      put(x, t, o = {}) {
        const node = ctx.createGain(); node.connect(bus);
        if (o.room) { const sg = ctx.createGain(); sg.gain.value = o.wet ?? 1; node.connect(sg); sg.connect(o.room); }
        if (o.lp || o.hp) { const f = ctx.createBiquadFilter(); f.type = o.lp ? 'lowpass' : 'highpass'; f.frequency.value = o.lp || o.hp; f.Q.value = 0.7; f.connect(node); return fx.play(x, t, f, o); }
        return fx.play(x, t, node, o);
      },
      // stereo arrays (L, R) at t
      putLR(L, R, t, o = {}) { const node = ctx.createGain(); node.connect(bus); if (o.room) { const sg = ctx.createGain(); sg.gain.value = o.wet ?? 1; node.connect(sg); sg.connect(o.room); } return fx.play(L, t, node, Object.assign({ xr: R }, o)); },
    };
    void K;
    return kit;
  }

  // ===================================================================================================== VOICE
  _voice(ctx, dest) {
    const C = window.BE_MIX.voiceComp;
    const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 180; low.gain.value = -1.5;
    const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 3200; pres.Q.value = 0.9; pres.gain.value = 2;
    const vc = ctx.createDynamicsCompressor(); vc.threshold.value = C.threshold; vc.knee.value = C.knee; vc.ratio.value = C.ratio; vc.attack.value = C.attack; vc.release.value = C.release;
    const mk = ctx.createGain(); mk.gain.value = Math.pow(10, 4 / 20);
    low.connect(pres); pres.connect(vc); vc.connect(mk); mk.connect(dest);
    for (const c of BN.clips) {
      const buf = this.vo && this.vo[c.id]; if (!buf) continue;
      const src = ctx.createBufferSource(), g = ctx.createGain(), v = Math.pow(10, (c.gainDb + ((window.BE_MIX.voiceTrim || {})[c.id] || 0)) / 20);
      // every word plays whole; the clip fades out just after its last word (clips 02, 10, 11 end on a click)
      const f1 = Math.min(c.start + buf.duration, c.fadeOut);
      src.buffer = buf; src.connect(g); g.connect(low); src.start(c.start); src.stop(f1 + 0.02);
      if (c.fadeIn) { g.gain.setValueAtTime(0, c.start); g.gain.linearRampToValueAtTime(v, c.start + c.fadeIn); } else g.gain.setValueAtTime(v, c.start);
      g.gain.setValueAtTime(v, f1 - 0.12); g.gain.linearRampToValueAtTime(0, f1);
    }
  }
}
