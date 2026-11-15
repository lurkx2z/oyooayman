/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised. It leads the film (the owner's rule), and it is loud: a driving
   ostinato in D minor at 120 beats a minute (short string notes over a low pulse), big drums, low brass, a sub drop
   on every blow; cut to almost nothing where the picture holds its breath, so the next blow lands.
     5:41:57        a station at evening: a warm chord, the platform chime; a reversed swell into
     5:42:00        the blow (sub, drums, a brass cluster); the ostinato starts under it and does not let go
     the sun        the drive thins to its bass; low brass walks down as the sun is covered; a dark blow when it is gone
     the bolts      the drive, lower and tighter; four anvil strokes on "every bolt sheared"
     the town       wide brass and drums over the town from the air
     the people     pulled right back: a heartbeat, a high held note; the pigeons: a breath of F major
     your train     the drive at full stride; a blow on "575"
     the energy     a rise through "5 tonnes"; cut to one low note on "until something stops it"
     the hill       a slow march of drums; a blow on "It stopped"
     the wagons     a ticking and a roll into the first wagon: a beat of nothing, then the biggest blow of the film;
                    the drive with everything, a sub drop on each of the other five wagons
     the sea        the drive stops: slow, huge chords (brass, a choir of strings), drum rolls; the ferry
     up             the endless rise
     the fall       held breath: bells, a soft chord, the heartbeat
     the sky        calm and high
     the count      the endless rise, the heartbeat racing, a roll: cut dead at 5:42:01.000
     5:42:01        stillness: single piano notes over a cold high note
     the twist      the low pulse comes back; brass climbing a step with every caption; the drive with everything,
                    faster and faster to the last frame (no ending: it is cut)
   ===================================================================== */

function esMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, sr = fx.sr, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(3.8, { bright: 0.5, damp: 2.6, shape: 2.0, pre: 0.02, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.46;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  // the drums and the short notes: drier (a little of the hall)
  const perc = ctx.createGain(), ps = ctx.createGain(); ps.gain.value = 0.2; perc.connect(K.bus); perc.connect(ps); ps.connect(hall);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const norm = (y, pk0 = 1) => { const pk = ESX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] *= pk0 / pk; return y; };
  const cache = (key, make) => fx.cache[key] || (fx.cache[key] = make());
  // a band-limited sawtooth sample (additive)
  const saw = (f, t, det = 0) => { let v = 0; const ff = f * Math.pow(2, det / 1200), nh = Math.min(14, Math.floor(sr * 0.4 / ff)); for (let k = 1; k <= nh; k++) v += Math.sin(2 * Math.PI * ff * k * t + k * 0.7) / k; return v; };
  // THE MIXER: the score has thousands of short notes; a node for each would make the offline render crawl, so every
  // sampled note is added into one stereo lane per bus here (the same equal-power pan a StereoPanner gives, the same
  // linear fade to o.stop), and each lane is played once (M.flush, at the end of the score)
  const NL = Math.ceil((CONFIG.duration + 2) * sr), lanes = new Map();
  const lane = (dest) => { if (dest !== bus && dest !== perc) return null; if (!lanes.has(dest)) lanes.set(dest, [new Float32Array(NL), new Float32Array(NL)]); return lanes.get(dest); };
  const play = (x, t, dest, o = {}) => {
    const Ln = lane(dest); if (!Ln || o.rate || o.fadeIn || o.offset || o.norm) return fx.play(x, t, dest, o);
    const v = o.vol == null ? 1 : o.vol, i0 = Math.round(t * sr), th = ((o.pan || 0) + 1) * Math.PI / 4, xr = o.xr || x, gl = o.xr ? v : v * Math.cos(th), gr = o.xr ? v : v * Math.sin(th);
    let n = x.length, fl = 0;
    if (o.stop != null) { n = Math.min(n, Math.round((o.stop - t) * sr)); fl = Math.max(1, Math.round((o.fade || 0.05) * sr)); }
    const f0 = n - fl, L = Ln[0], R = Ln[1];
    for (let i = Math.max(0, -i0); i < n; i++) { const j = i0 + i; if (j >= NL) break; const e = fl && i > f0 ? (n - i) / fl : 1; L[j] += x[i] * gl * e; R[j] += xr[i] * gr * e; }
  };
  const M = {
    bus, perc,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(esMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * sr));
      return play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const y = cache('rp' + n + '_' + dur, () => {
        const b = fx.pianoBuf(esMidi(n)), L = Math.min(b.length, Math.ceil(dur * sr)), o = new Float32Array(L + Math.ceil(0.01 * sr));
        for (let i = 0; i < L; i++) { const u = i / L; o[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * sr; i++) o[L + i] = o[L - 1] * (1 - i / (0.01 * sr));
        return o;
      });
      return play(y, tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => play(fx.bellBuf(esMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const y = cache('drum' + f + '_' + soft + '_' + dk, () => norm(fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) })));
      return play(y, t, bus, { vol: vol * 0.5 });
    },
    // a big frame drum: a short low membrane with a slap of skin on top (dry)
    taiko(t, vol, f = 62, pan = 0) {
      const y = cache('taiko' + f, () => {
        const b = fx.hit([[f, 0.34, 1], [f * 1.48, 0.2, 0.55], [f * 2.1, 0.12, 0.35], [f * 2.9, 0.07, 0.2]], { width: 0.004, amp: 1, noise: 0.5, nlen: 0.012, nhp: 500, len: 1.2 });
        const n = fx.white(Math.ceil(0.05 * sr)); ESX.bq(n, 'bp', 1900, 0.8, sr); for (let i = 0; i < n.length; i++) b[i] += n[i] * 0.5 * Math.exp(-i / (0.008 * sr));
        return norm(b);
      });
      return play(y, t, perc, { vol: vol * 0.55, pan });
    },
    // the sub drop under a blow: a sine falling from f0 to f1, with a thump of noise on its front
    boom(t, vol, f0 = 68, f1 = 27, dk = 0.9) {
      const y = cache('boom' + f0 + '_' + f1 + '_' + dk, () => {
        const n = Math.ceil(Math.min(4, dk * 4.5) * sr), o = new Float32Array(n), w = fx.white(Math.ceil(0.12 * sr)); ESX.bq(w, 'lp', 260, 0.7, sr);
        let ph = 0; for (let i = 0; i < n; i++) { const tt = i / sr; ph += 2 * Math.PI * (f1 + (f0 - f1) * Math.exp(-tt / 0.1)) / sr; o[i] = Math.sin(ph) * Math.exp(-tt / dk) * (1 - Math.exp(-tt / 0.0015)) + 0.35 * Math.sin(2 * ph) * Math.exp(-tt / (dk * 0.3)) + (i < w.length ? w[i] * 2.2 * Math.exp(-tt / 0.03) : 0); }
        return norm(o);
      });
      return play(y, t, perc, { vol: vol * 0.8 });
    },
    // a tick (a closed hat), a clack (a rim), a crack (a snare with no snares: skin and noise), a crash (a long wash)
    tick(t, vol, pan = 0) { const y = cache('tick', () => { const n = fx.white(Math.ceil(0.05 * sr)); ESX.bq(n, 'hp', 6500, 0.8, sr); for (let i = 0; i < n.length; i++) n[i] *= Math.exp(-i / (0.009 * sr)); return norm(n); }); return play(y, t, perc, { vol: vol * 0.16, pan }); },
    clack(t, vol, pan = 0) { const y = cache('clack', () => norm(fx.hit([[1720, 0.02, 1], [2630, 0.014, 0.6], [820, 0.03, 0.5]], { width: 0.0008, amp: 1, noise: 0.4, nlen: 0.006, nhp: 1500, len: 0.2 }))); return play(y, t, perc, { vol: vol * 0.22, pan }); },
    crack(t, vol, pan = 0) {
      const y = cache('crack', () => { const n = fx.white(Math.ceil(0.3 * sr)); ESX.bq(n, 'bp', 2400, 0.5, sr); const o = fx.hit([[196, 0.09, 1], [331, 0.06, 0.6], [470, 0.04, 0.3]], { width: 0.002, amp: 1, noise: 0, len: 0.35 }); for (let i = 0; i < Math.min(o.length, n.length); i++) o[i] = o[i] * 0.7 + n[i] * 0.9 * Math.exp(-i / (0.05 * sr)); return norm(o); });
      return play(y, t, perc, { vol: vol * 0.4, pan });
    },
    crash(t, vol, dk = 1.4) {
      const mk = (seed) => { const n = fx.white(Math.ceil(dk * 4 * sr)); ESX.bq(n, 'hp', 3200, 0.6, sr); ESX.bq(n, 'pk', 5200, 1.2, sr, 5); for (let i = 0; i < n.length; i++) { const tt = i / sr; n[i] *= Math.exp(-tt / dk) * (1 - Math.exp(-tt / 0.004)) * (1 + 0.3 * Math.sin(tt * (37 + seed))); } return norm(n); };
      const L = cache('crashL' + dk, () => mk(1)), R = cache('crashR' + dk, () => mk(5));
      return play(L, t, bus, { xr: R, vol: vol * 0.2 });
    },
    // an anvil: a short bright bar of steel
    anvil(t, vol, pan = 0, f = 1180) { const y = cache('anvil' + f, () => norm(fx.hit([[f, 0.22, 1], [f * 2.76, 0.14, 0.7], [f * 5.4, 0.08, 0.5], [f * 0.51, 0.1, 0.4]], { width: 0.0005, amp: 1, noise: 0.5, nlen: 0.004, nhp: 2500, len: 0.9 }))); return play(y, t, bus, { vol: vol * 0.3, pan }); },
    // noise swelling up to tEnd and cut (a cymbal played backwards)
    swell(tEnd, dur, vol) {
      const mk = () => { const n = fx.white(Math.ceil(dur * sr)); ESX.bq(n, 'hp', 2400, 0.6, sr); for (let i = 0; i < n.length; i++) { const u = i / n.length; n[i] *= Math.pow(u, 3.2) * Math.min(1, (1 - u) / 0.004); } return norm(n); };
      return play(cache('swL' + dur, mk), tEnd - dur, bus, { xr: cache('swR' + dur, mk), vol: vol * 0.22 });
    },
    // a heartbeat: lub-dub on a soft low drum
    beat(t, vol) { M.drum(t, vol, 47, 1.6, 0.45); M.drum(t + 0.17, vol * 0.62, 52, 1.6, 0.4); },
    // a timpani roll from t0 to t1, its level following keys [[t, v], …]
    roll(t0, t1, keys, f = 73) {
      for (let t = t0, i = 0; t < t1; t += 0.065 + 0.012 * Math.sin(i * 1.7), i++) {
        let v = keys[0][1];
        for (let k = 1; k < keys.length; k++) if (t >= keys[k - 1][0]) v = keys[k - 1][1] + (keys[k][1] - keys[k - 1][1]) * MathX.clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]), 0, 1);
        M.drum(t, v * (0.8 + 0.2 * Math.sin(i * 2.3)), f, 1.6, 0.35);
      }
    },
    // a short string note (spiccato: three detuned saws, a fast bow), cached per pitch; and a short bass note
    spic(t, n, vol, pan = 0) {
      const m = esMidi(n), y = cache('spic' + m, () => { const f = 440 * Math.pow(2, (m - 69) / 12), L = Math.ceil(0.3 * sr), o = new Float32Array(L); for (let i = 0; i < L; i++) { const tt = i / sr; o[i] = (saw(f, tt, -8) + saw(f, tt, 5) + 0.7 * saw(f * 2, tt, 2)) * (1 - Math.exp(-tt / 0.003)) * (Math.exp(-tt / 0.055) * 0.8 + 0.2 * Math.exp(-tt / 0.16)) * Math.min(1, (0.3 - tt) / 0.02); } ESX.bq(o, 'lp', Math.min(5200, f * 9), 0.7, sr); ESX.bq(o, 'pk', 2600, 1.0, sr, 4); return norm(o); });
      return play(y, t, perc, { vol: vol * 0.2, pan });
    },
    bass(t, n, vol, len = 0.22) {
      const m = esMidi(n), y = cache('bass' + m + '_' + len, () => { const f = 440 * Math.pow(2, (m - 69) / 12), L = Math.ceil((len + 0.08) * sr), o = new Float32Array(L); for (let i = 0; i < L; i++) { const tt = i / sr; o[i] = (saw(f, tt, -5) + saw(f, tt, 6) + 1.4 * Math.sin(2 * Math.PI * f * tt)) * (1 - Math.exp(-tt / 0.004)) * Math.exp(-tt / (len * 0.75)) * Math.min(1, (len + 0.08 - tt) / 0.03); } ESX.bq(o, 'lp', 520, 0.9, sr); for (let i = 0; i < L; i++) o[i] = Math.tanh(2.2 * o[i]); return norm(o); });
      return play(y, t, perc, { vol: vol * 0.3 });
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents),
    // o.glide (cents, from o.glideFrom by o.glideAt: the chord slides), o.pan
    strings(t0, t1, notes, vol, o = {}) {
      t0 = Math.max(0, t0); if (t1 - t0 < 0.1) return;
      const att = Math.min(o.att || 1.0, (t1 - t0) * 0.45), rel = Math.min(o.rel || 1.2, (t1 - t0) * 0.45), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * 0.11 * (o.keys ? o.keys[0][1] : 1), t0 + att);
      for (const [t, v] of (o.keys || [])) if (t > t0 + att && t < t1 - rel) g.gain.linearRampToValueAtTime(vol * 0.11 * v, t);
      const vEnd = o.keys ? o.keys[o.keys.length - 1][1] : 1;
      g.gain.linearRampToValueAtTime(vol * 0.11 * vEnd, Math.max(t0 + att + 0.01, t1 - rel)); g.gain.linearRampToValueAtTime(0, t1);
      g.connect(o.dest || bus);
      const lanes = [-0.55, 0, 0.55].map((p) => {
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.setValueAtTime(o.cut || 1700, t0);
        if (o.cutTo) lp.frequency.linearRampToValueAtTime(o.cutTo, o.cutAt || (t1 - rel * 0.5));
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      for (const nn of notes) {
        const f = esHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f;
          const d0 = d + r.range(-2, 2); osc.detune.setValueAtTime(d0, t0);
          if (o.glide) { osc.detune.setValueAtTime(d0, o.glideFrom || t0); osc.detune.linearRampToValueAtTime(d0 + o.glide, o.glideAt || t1); }
          lfo.frequency.value = r.range(4.4, 5.4); lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(o.vib == null ? 7 : o.vib, t0 + Math.min(1.5, (t1 - t0) * 0.6));
          lfo.connect(lg); lg.connect(osc.detune);
          og.gain.value = 1 / Math.sqrt(notes.length); osc.connect(og); og.connect(lanes[k]);
          osc.start(t0); osc.stop(t1 + 0.05); lfo.start(t0); lfo.stop(t1 + 0.05);
        });
      }
    },
    // a chord progression: [[t0, notes], …] each held to the next; the last one ends at t1 (o.lastRel its release)
    prog(steps, t1, vol, o = {}) {
      steps.forEach(([t0, notes], i) => {
        const last = i + 1 >= steps.length;
        M.strings(t0, last ? t1 : steps[i + 1][0] + 0.35, notes, vol, Object.assign({ att: 0.6, rel: 0.6 }, o, last && o.lastRel ? { rel: o.lastRel } : {}));
      });
    },
    // low brass: two saws a note, driven (a soft clip), through a low-pass that opens hard on the attack and settles.
    // o.att, o.rel, o.cut (the settled cut-off), o.open (how far it opens on the attack), o.keys [[t, level]], o.swell
    // (true: it grows to its end and is cut)
    brass(t0, t1, notes, vol, o = {}) {
      if (t1 - t0 < 0.08) return;
      const att = o.att ?? 0.05, rel = Math.min(o.rel ?? 0.5, (t1 - t0) * 0.5), g = ctx.createGain(), lp = ctx.createBiquadFilter(), sh = ctx.createWaveShaper(), pre = ctx.createGain();
      const curve = new Float32Array(257); for (let i = 0; i < 257; i++) curve[i] = Math.tanh(2.4 * (i / 128 - 1)); sh.curve = curve;
      lp.type = 'lowpass'; lp.Q.value = 0.9; const cut = o.cut || 700, open = o.open || 2600;
      if (o.swell) { lp.frequency.setValueAtTime(cut * 0.5, t0); lp.frequency.exponentialRampToValueAtTime(open, t1); }
      else { lp.frequency.setValueAtTime(open, t0); lp.frequency.setTargetAtTime(cut, t0 + att, o.settle || 0.35); }
      pre.gain.value = 0.5 / Math.sqrt(notes.length); pre.connect(sh); sh.connect(lp); lp.connect(g); g.connect(o.dest || bus);
      const V = vol * 0.16; g.gain.setValueAtTime(0, t0);
      if (o.swell) { g.gain.linearRampToValueAtTime(V * 0.15, t0 + Math.min(0.4, (t1 - t0) * 0.3)); g.gain.exponentialRampToValueAtTime(V, t1 - 0.02); g.gain.linearRampToValueAtTime(0, t1); }
      else { g.gain.linearRampToValueAtTime(V, t0 + att); for (const [t, v] of (o.keys || [])) if (t > t0 + att && t < t1 - rel) g.gain.linearRampToValueAtTime(V * v, t); g.gain.setValueAtTime(V * (o.keys ? o.keys[o.keys.length - 1][1] : 1), Math.max(t0 + att + 0.01, t1 - rel)); g.gain.linearRampToValueAtTime(0, t1); }
      for (const nn of notes) for (const d of [-9, 8]) { const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.value = esHz(nn); os.detune.value = d + r.range(-2, 2); os.connect(pre); os.start(t0); os.stop(t1 + 0.05); }
    },
    // the blow: sub drop, drums, a crash; v its size (1 = the biggest)
    blow(t, v = 1, f = 36.7) { M.boom(t, v); M.drum(t, 0.9 * v, f, 1.1, 1.8); M.taiko(t, v, 55, -0.2); M.taiko(t + 0.02, 0.8 * v, 74, 0.25); if (v > 0.55) M.crash(t, 0.8 * v, 1.0 + v * 0.7); },
    // play the lanes (once, after every note has been written)
    flush() { for (const [dest, [L, R]] of lanes) fx.play(L, 0, dest, { xr: R }); lanes.clear(); },
  };
  return (K._music = M);
}

// the endless rise (a Shepard–Risset glissando): octave-spaced sines whose pitch climbs for ever under a fixed bell-shaped
// loudness window, so new low ones fade in as the high ones fade out. o.rate(t) octaves per second, o.env(t) its level
function esShepard(fx, t0, t1, o = {}) {
  const sr = fx.sr, n = Math.ceil((t1 - t0) * sr), L = new Float32Array(n), R = new Float32Array(n), N = 9, f0 = 27.5;
  const c0 = Math.log2(o.centre || 330) - Math.log2(f0), sg = o.width || 1.25, rate = o.rate || (() => 1 / 26), env = o.env || (() => 1);
  const phL = new Float64Array(N), phR = new Float64Array(N), det = Math.pow(2, (o.det || 7) / 1200);
  let u = 0, eC = env(t0), rC = rate(t0);
  for (let i = 0; i < n; i++) {
    if ((i & 255) === 0) { const t = t0 + i / sr; eC = env(t); rC = rate(t); }
    u += rC / sr; const fr = u - Math.floor(u);
    let l = 0, r = 0;
    for (let k = 0; k < N; k++) {
      const oc = k + fr, f = f0 * Math.pow(2, oc), a = Math.exp(-0.5 * Math.pow((oc - c0) / sg, 2));
      phL[k] += 2 * Math.PI * f / sr; phR[k] += 2 * Math.PI * f * det / sr;
      l += a * Math.sin(phL[k]); r += a * Math.sin(phR[k]);
    }
    L[i] = l * eC; R[i] = r * eC;
  }
  return [L, R];
}

// chords: [root (bass, octave 1–2), the three notes the ostinato plays, the held chord]
const ES_CH = {
  Dm: { b: 'D2', o: ['D3', 'F3', 'A3', 'D4'], h: ['D2', 'A2', 'D3', 'F3', 'A3'] },
  Bb: { b: 'Bb1', o: ['D3', 'F3', 'Bb3', 'D4'], h: ['Bb1', 'F2', 'Bb2', 'D3', 'F3'] },
  Gm: { b: 'G1', o: ['D3', 'G3', 'Bb3', 'D4'], h: ['G1', 'D2', 'G2', 'Bb2', 'D3'] },
  A: { b: 'A1', o: ['C#3', 'E3', 'A3', 'C#4'], h: ['A1', 'E2', 'A2', 'C#3', 'E3'] },
  F: { b: 'F1', o: ['C3', 'F3', 'A3', 'C4'], h: ['F1', 'C2', 'F2', 'A2', 'C3'] },
  C: { b: 'C2', o: ['C3', 'E3', 'G3', 'C4'], h: ['C2', 'G2', 'C3', 'E3', 'G3'] },
  Eb: { b: 'Eb2', o: ['Eb3', 'G3', 'Bb3', 'Eb4'], h: ['Eb2', 'Bb2', 'Eb3', 'G3', 'Bb3'] },
  E: { b: 'E2', o: ['E3', 'G#3', 'B3', 'E4'], h: ['E2', 'B2', 'E3', 'G#3', 'B3'] },
  Dm9: { h: ['D2', 'A2', 'F3', 'C4', 'E4'] }, Bbmaj7: { h: ['Bb1', 'F2', 'D3', 'A3'] }, Fmaj9: { h: ['F2', 'C3', 'A3', 'E4', 'G4'] }, Bblyd: { h: ['Bb1', 'F2', 'D3', 'A3', 'E4'] },
};
const ES_THEME = ['D4', 'F4', 'E4', 'A3', 'D4'];          // the film's five notes (heard whole only when everything stands still)
const esOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));
const esWord = (id, k, j) => { const w = esCap(id, k).words; return w[Math.min(j < 0 ? w.length + j : j, w.length - 1)].start; };

// THE DRIVE: from t0 to t1 on a grid of sixteenths (0.125 s), a chord every bar (2 s) from `chords` in turn.
//   lv 1  the short string notes, soft          lv 2  + the bass pulse and ticks
//   lv 3  + the big drums and the clack         lv 4  + cracks on the back beats, drums doubled
// o.vol, o.ramp(u) the level over its length, o.oct (the strings' octave shift), o.fill (a drum fill in its last bar)
function esDrive(M, t0, t1, chords, lv, o = {}) {
  const G = 0.125, N = Math.floor((t1 - t0) / G), vol = o.vol ?? 1, ramp = o.ramp || (() => 1);
  const pat = [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 3, 2, 0, 2, 1, 2], acc = [1, 0.55, 0.7, 0.55, 0.85, 0.55, 0.7, 0.55, 0.95, 0.55, 0.75, 0.55, 0.85, 0.55, 0.7, 0.6];
  const bassAt = [1, 0, 0, 0.8, 0, 0, 0.9, 0, 1, 0, 0, 0.8, 0, 0.7, 0.9, 0], taikoAt = [1, 0, 0, 0, 0, 0, 0.7, 0, 0.9, 0, 0, 0.5, 0, 0, 0.75, 0.5];
  for (let i = 0; i < N; i++) {
    const t = t0 + i * G, s = i % 16, ch = ES_CH[chords[Math.floor(i / 16) % chords.length]], u = i / Math.max(1, N - 1), v = vol * ramp(u), last = o.fill && i >= N - 16;
    M.spic(t, esOct(ch.o[pat[s]], o.oct || 0), v * acc[s] * (lv === 1 ? 0.75 : 1), s % 2 ? 0.3 : -0.3);
    if (lv >= 3 && s % 4 === 0) M.spic(t, esOct(ch.o[0], (o.oct || 0) + 1), v * 0.55, 0);
    if (lv >= 2) { if (bassAt[s]) M.bass(t, ch.b, v * bassAt[s]); if (s % 2 === 0) M.tick(t, v * (s % 4 === 0 ? 0.6 : 1), s % 4 ? 0.4 : -0.4); }
    if (lv >= 3) { if (taikoAt[s]) M.taiko(t, v * taikoAt[s] * 0.8, s === 0 ? 52 : s === 8 ? 58 : 70, s % 8 ? 0.3 : -0.2); if (s === 4 || s === 12) M.clack(t, v, 0.2); }
    if (lv >= 4) { if (s === 4 || s === 12) M.crack(t, v * 0.9, -0.1); if (s === 10 || s === 15) M.taiko(t, v * 0.6, 84, 0.4); M.tick(t, v * 0.5, s % 2 ? -0.5 : 0.5); }
    if (last && s >= 8) M.taiko(t, v * (0.5 + 0.06 * (s - 8)), [84, 84, 70, 70, 62, 62, 52, 52][s - 8], (s - 12) * 0.12);
  }
}

esSound('music', 'score', function (ctx, bus, K) {
  const M = esMusicKit(ctx, K), CH = ES_CH, c = esC, B = esB, E = esE, F = esFilmAt, END = ES.end, T0 = ES.tOn, P = ESP;
  const tW = []; for (let k = 0; k < ES_F.wagons.n; k++) tW.push(F(P.wagonHit(k)));
  const tFerry = F(P.ferryHit), tBack = F(P.T), tSunA = c('speed', 1) - 0.6, tSun = tSunA + 0.7 * (B('bolts') - tSunA), tShed = F(P.shed), tH0 = F(P.house0), tH1 = F(P.house1), tHit = ES.tHit;
  const hold = (t0, t1, ch, vol, o = {}) => M.strings(t0, t1, CH[ch].h, vol, o);
  const motif = (t, o = {}) => ES_THEME.slice(0, o.n || 5).forEach((n, i) => M.piano(t + i * (o.gap || 1.1), esOct(n, o.oct || 0), (o.vel || 0.5) * (i ? 0.88 : 1), o.dur || 3.4, [-0.2, 0.15, -0.1, 0.2, 0][i]));
  const beats = (t0, t1, p0, p1, v0, v1) => { for (let t = t0; t < t1 - 0.2;) { const u = (t - t0) / (t1 - t0); M.beat(t, v0 + (v1 - v0) * u); t += p0 + (p1 - p0) * u; } };
  const twinkle = (t0, t1, d0, d1, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); const u = (t - t0) / (t1 - t0); t += (d0 + (d1 - d0) * u) * r.range(0.6, 1.4); } };
  const rise = (t0, t1, v0, v1, o = {}) => { const [Lx, Rx] = esShepard(K.fx, t0, t1, { rate: o.rate || (() => 1 / 14), env: (t) => (v0 + (v1 - v0) * esEv(t, t0, t1)) * esEv(t, t0, t0 + 1.5), centre: o.centre || 300, width: 1.2 }); K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1, stop: t1, fade: o.fade ?? 0.01 }); };

  // ================================================================== 5:41:57: a station at evening
  M.strings(-0.3, T0 + 0.1, ['F3', 'A3', 'C4', 'E4'], 0.22, { att: 0.5, rel: 0.1, cut: 1900, wave: 'triangle', vib: 3 });
  ['A5', 'F5', 'C5'].forEach((n, i) => M.bell(0.35 + i * 0.42, n, 0.3, [-0.3, 0, 0.3][i]));      // the platform chime
  M.swell(T0, 1.5, 0.7); M.rpiano(T0, 'D2', 0.6, 2.2, 0); M.rpiano(T0, 'A2', 0.4, 2.2, 0.2);
  // ================================================================== 5:42:00.000: the blow; the drive starts
  M.blow(T0, 1.0, 32.7); M.brass(T0, T0 + 3.4, ['D1', 'A1', 'D2', 'Eb2'], 1.0, { cut: 420, open: 2400, rel: 1.6, settle: 0.5 });
  M.strings(T0 + 0.02, T0 + 3.2, ['E6', 'F6'], 0.07, { att: 0.02, rel: 2.0, cut: 8000, vib: 16 });
  M.strings(T0 + 0.3, B('speed') + 0.4, ['D2', 'A2', 'D3'], 0.36, { att: 1.5, rel: 0.5, cut: 260, cutTo: 420, cutAt: B('speed') });
  esDrive(M, T0 + 1.4, B('first') - 0.1, ['Dm'], 1, { vol: 0.7, ramp: (u) => 0.5 + 0.5 * u });
  // the hill: it stopped too
  M.blow(B('first'), 0.7, 36.7); M.brass(B('first'), c('first', 1) - 0.6, ['D1', 'D2', 'A2'], 0.8, { cut: 380, rel: 1.0 });
  esDrive(M, B('first') + 0.1, c('first', 1) - 0.9, ['Dm', 'Bb'], 2, { vol: 0.8, ramp: (u) => 0.7 + 0.3 * u });
  // a house reaches its rock
  M.blow(tH0, 0.95, 30.9); M.crash(tH0, 0.7, 1.4); M.boom(tH0 + 0.02, 0.6, 80, 26, 1.2);
  // "Nothing else did.": palm after palm into the rock
  M.blow(c('first', 1) - 0.8, 0.85, 32.7); M.brass(c('first', 1) - 0.8, B('speed') + 0.3, ['Bb0', 'Bb1', 'F2', 'Bb2'], 1.0, { cut: 420, open: 1700, rel: 0.8 });
  esDrive(M, c('first', 1) - 0.8, B('speed') - 0.05, ['Bb', 'A'], 3, { vol: 0.9, fill: true });
  for (let t = c('first', 1) - 0.3, i = 0; t < B('speed') - 0.3; t += 0.5, i++) { M.taiko(t, 0.8, i % 2 ? 62 : 52, i % 2 ? 0.25 : -0.2); }
  // ---- 1,670 km/h: the drive at stride
  M.blow(B('speed'), 0.55);
  esDrive(M, B('speed'), tSunA, ['Dm', 'Bb', 'Gm', 'A'], 3, { vol: 0.85, fill: true });
  M.prog([[B('speed'), CH.Dm.h], [B('speed') + 2.1, CH.Bb.h], [B('speed') + 4.2, CH.Gm.h]], tSunA + 0.2, 0.3, { cut: 1100 });
  // ---- the sun: the drive thins to its bass; brass walks down as the sun is covered; a dark blow when it is gone
  { const a = tSunA, d = (tSun - a) / 4;
    esDrive(M, a, tSun - 0.2, ['Dm', 'C', 'Bb', 'A'], 2, { vol: 0.6, ramp: (u) => 1 - 0.5 * u });
    ['D2', 'C2', 'Bb1', 'A1'].forEach((n, i) => M.brass(a + i * d, a + (i + 1) * d + 0.3, [n, esOct(n, 1)], 0.75 + 0.1 * i, { att: 0.3, cut: 360, open: 900, rel: 0.5 }));
    M.strings(a, tSun, ['A5', 'Bb5'], 0.06, { att: 2, rel: 0.05, cut: 6000, vib: 10, glide: 100, glideFrom: a + d, glideAt: tSun });
    M.swell(tSun, 1.8, 0.6);
    M.blow(tSun, 0.85, 29.1); M.brass(tSun, B('bolts') + 0.6, ['Bb0', 'Bb1', 'E2', 'Bb2'], 1.0, { cut: 330, open: 1800, rel: 1.0, settle: 0.6 });
    M.strings(tSun + 0.1, B('bolts') + 0.5, ['E6', 'F6', 'B6'], 0.05, { att: 0.3, rel: 0.6, cut: 7000, vib: 14 }); }

  // ================================================================== the bolts: lower, tighter
  M.strings(B('bolts'), B('town') + 0.4, ['D2', 'Eb2', 'A2'], 0.34, { att: 1.2, rel: 0.5, cut: 300, cutTo: 520, cutAt: B('town') });
  esDrive(M, B('bolts') + 0.1, c('bolts', 2) - 0.25, ['Dm', 'Eb', 'Dm', 'A'], 2, { vol: 0.75, oct: -1, ramp: (u) => 0.65 + 0.35 * u });
  M.blow(c('bolts', 1), 0.5, 41.2);
  // "So every bolt sheared": four strokes of steel
  { const t = c('bolts', 2); [0, 0.19, 0.38, 0.57].forEach((d, i) => { M.anvil(t + d, 0.9, [-0.5, 0.5, -0.2, 0.2][i], [1180, 1320, 1050, 1480][i]); M.taiko(t + d, 0.7, 70, [-0.3, 0.3, -0.1, 0.1][i]); });
    M.blow(t + 0.76, 0.75, 32.7); M.brass(t + 0.76, B('town') + 0.3, ['D1', 'D2', 'A2'], 0.8, { cut: 380, rel: 0.8 }); }
  // ================================================================== the town from the air: wide
  M.blow(B('town'), 0.65);
  M.brass(B('town'), c('town', 1) - 0.4, ['D2', 'A2', 'D3', 'F3'], 0.8, { att: 0.3, cut: 600, open: 1500, rel: 0.5 });
  M.brass(c('town', 1) - 0.6, B('people') + 0.3, ['Bb1', 'F2', 'Bb2', 'D3'], 0.95, { att: 0.3, cut: 650, open: 1700, rel: 0.9 });
  esDrive(M, B('town'), B('people') - 0.1, ['Dm', 'Dm', 'Bb', 'Bb'], 3, { vol: 0.8, fill: true });
  M.blow(c('town', 1) - 0.6, 0.7, 29.1);

  // ================================================================== the people: pulled right back
  M.blow(B('people'), 0.5, 36.7);
  hold(B('people'), B('train') + 0.3, 'Dm9', 0.26, { cut: 800, att: 1.2 });
  M.strings(B('people'), B('train'), ['A5', 'E6'], 0.05, { att: 2, rel: 0.6, cut: 5000, wave: 'triangle', vib: 3 });
  beats(B('people') + 0.5, c('people', 1) - 0.7, 1.05, 0.9, 0.34, 0.44);
  M.piano(c('people', 0) + 2.3, 'D2', 0.42, 5); M.piano(c('people', 0) + 2.32, 'A2', 0.3, 5);
  // the platform's end: the pulse quickens under them
  esDrive(M, c('people', 1) - 0.6, B('train') - 0.15, ['Dm', 'Gm', 'Bb', 'A'], 2, { vol: 0.7, oct: -1, ramp: (u) => 0.5 + 0.5 * u });
  beats(c('people', 1) - 0.6, B('train') - 0.3, 0.75, 0.5, 0.4, 0.6);
  M.blow(c('people', 2) - 0.6, 0.55, 36.7);

  // ================================================================== your train: the drive at full stride
  M.blow(B('train'), 0.7);
  esDrive(M, B('train'), c('train', 1) - 0.5, ['Dm', 'Bb', 'F', 'C'], 3, { vol: 0.85, fill: true });
  M.prog([[B('train'), CH.Dm.h], [B('train') + 2, CH.Bb.h], [B('train') + 4, CH.F.h]], c('train', 1) - 0.3, 0.3, { cut: 1100 });
  // inside: the same drive, heard from your seat (softer, lower)
  hold(c('train', 1) - 0.5, c('train', 2) - 0.3, 'Dm9', 0.26, { cut: 700, att: 0.6 });
  esDrive(M, c('train', 1) - 0.5, c('train', 1) + 2.4, ['Dm', 'Gm'], 2, { vol: 0.6, oct: -1 });
  esDrive(M, c('train', 1) + 2.4, c('train', 2) - 0.5, ['Bb', 'A'], 3, { vol: 0.75, ramp: (u) => 0.75 + 0.25 * u, fill: true });
  // it passes: "The record for a train on wheels is 575 km/h. Yours is doing 1,670."
  M.blow(c('train', 2) - 0.5, 0.75, 32.7); M.brass(c('train', 2) - 0.5, B('energy') + 0.2, ['D1', 'D2', 'A2', 'F3'], 0.95, { cut: 520, open: 2000, rel: 0.6 });
  esDrive(M, c('train', 2) - 0.5, B('energy') - 0.1, ['Dm'], 4, { vol: 0.85 });
  { const t = esWord('train', 2, -1); M.anvil(t, 0.6, 0, 1480); M.taiko(t, 0.8, 55); }

  // ================================================================== the energy: a rise; then one low note
  { const a = B('energy'), b = esWord('energy', 1, 8) - 0.05;
    esDrive(M, a, b - 0.05, ['Dm', 'Eb', 'E', 'F'], 3, { vol: 0.8, ramp: (u) => 0.6 + 0.4 * u });
    M.strings(a, b, ['D3', 'A3', 'D4', 'F4'], 0.3, { att: 2, rel: 0.03, cut: 700, cutTo: 3400, cutAt: b, glide: 300, glideFrom: a + 1, glideAt: b });
    rise(a + 0.5, b, 0.02, 0.1, { rate: () => 1 / 9 });
    M.roll(b - 2.6, b - 0.04, [[b - 2.6, 0.06], [b - 0.3, 0.6]], 55); M.swell(b, 2.0, 0.7);
    // "It's harmless, until something stops it."
    M.blow(b, 0.5, 29.1); M.piano(b + 0.02, 'D1', 0.6, 6); M.piano(b + 0.04, 'D2', 0.45, 6);
    M.strings(b + 0.1, B('hill') + 0.4, ['D2', 'A2'], 0.3, { att: 0.4, rel: 0.5, cut: 260 });
    { const t = esWord('energy', 1, 11); M.clack(t, 1.0); M.clack(t + 0.5, 0.8); M.clack(t + 1.0, 0.6); } }

  // ================================================================== the hill: a slow march
  { const a = B('hill'), b = B('depot');
    M.blow(a, 0.7, 29.1);
    M.brass(a, c('hill', 1) - 1.2, ['D1', 'D2', 'A2'], 0.85, { att: 0.5, cut: 380, open: 1000, rel: 0.6 });
    M.brass(c('hill', 1) - 1.4, b + 0.2, ['Eb1', 'Eb2', 'Bb2'], 1.0, { att: 0.4, cut: 400, open: 1200, rel: 0.6 });
    for (let t = a + 1, i = 0; t < b - 0.3; t += 1, i++) { M.taiko(t, 0.85, 52, -0.2); M.taiko(t + 0.5, 0.5, 62, 0.25); if (i % 2) M.taiko(t + 0.75, 0.4, 70, 0.3); M.bass(t, 'D2', 0.8, 0.4); }
    // a house on the road under it reaches the rock
    M.blow(tH1, 0.85, 32.7); M.crash(tH1, 0.55, 1.2);
    // the depot's shed reaches the rock
    M.blow(tShed, 0.9, 30.9); M.crash(tShed, 0.6, 1.4); M.anvil(tShed + 0.01, 0.5, -0.3, 520);
    M.strings(c('hill', 1), b + 0.3, ['A5', 'Bb5'], 0.05, { att: 2, rel: 0.4, cut: 6000, vib: 12 }); }

  // ================================================================== the six wagons: a ticking, a roll, a beat of nothing, the blow
  { const a = B('depot'), t0w = tW[0], tD = esCap('depot', 0).hide - 1.2;
    M.strings(a, t0w - 0.3, ['D2', 'A2', 'D3'], 0.34, { att: 1.0, rel: 0.05, cut: 280, cutTo: 700, cutAt: t0w - 0.3 });
    for (let t = a + 0.25, i = 0; t < t0w - 0.35; t += 0.25, i++) { M.tick(t, 1.2, i % 2 ? 0.4 : -0.4); if (i % 2 === 0) M.clack(t, 0.5); if (i % 4 === 0) M.bass(t, 'D2', 0.7, 0.3); }
    esDrive(M, tD, t0w - 0.35, ['Dm', 'Eb'], 2, { vol: 0.7, oct: -1, ramp: (u) => 0.5 + 0.5 * u });
    M.strings(tD, t0w - 0.3, ['D4', 'Eb4', 'A4'], 0.26, { att: 2, rel: 0.02, cut: 800, cutTo: 4200, cutAt: t0w - 0.3, glide: 200, glideFrom: tD + 1, glideAt: t0w - 0.3 });
    M.roll(t0w - 3.2, t0w - 0.33, [[t0w - 3.2, 0.06], [t0w - 0.5, 0.75]], 55); M.swell(t0w - 0.3, 2.4, 0.8);
    beats(tD, t0w - 0.6, 0.7, 0.36, 0.4, 0.7);
    // (0.3 s of nothing) … the first wagon
    M.blow(t0w, 1.15, 27.5); M.boom(t0w + 0.02, 0.9, 90, 24, 1.6); M.crash(t0w, 1.0, 2.2);
    M.brass(t0w, B('wind') + 0.4, ['D1', 'A1', 'D2', 'F2', 'A2'], 1.25, { cut: 560, open: 3000, rel: 0.8, settle: 0.8 });
    M.strings(t0w + 0.02, t0w + 3.4, ['D6', 'Eb6', 'A6'], 0.07, { att: 0.02, rel: 2.4, cut: 8000, vib: 16 });
    for (let t = t0w + 0.75, i = 0; t < B('wind') - 0.3; t += 0.75, i++) { M.taiko(t, 0.9, 52, -0.2); M.taiko(t + 0.375, 0.6, 62, 0.25); } }
  // ---- the wind, the fire: everything
  { const a = B('wind'), b = B('sea');
    M.blow(a, 0.8);
    esDrive(M, a, b - 0.15, ['Dm', 'Bb', 'Gm', 'A'], 4, { vol: 0.95, fill: true });
    const st = []; for (let t = a, i = 0; t < b - 1; t += 2, i++) st.push([t, CH[['Dm', 'Bb', 'Gm', 'A'][i % 4]].h]);
    M.prog(st, b + 0.2, 0.34, { cut: 1300 });
    for (let t = a, i = 0; t < b - 1.9; t += 4, i++) M.brass(t, t + 3.9, i % 2 ? ['G1', 'G2', 'D3', 'Bb3'] : ['D2', 'A2', 'D3', 'F3'], 0.85, { att: 0.2, cut: 700, open: 1900, rel: 0.5 });
    M.strings(a, b, ['A4', 'D5', 'F5'], 0.12, { att: 2, rel: 0.3, cut: 2600, vib: 9 });
    for (let k = 1; k < tW.length; k++) if (tW[k] > tW[0] + 0.3) { M.boom(tW[k], 0.75, 80, 26, 1.1); M.taiko(tW[k], 0.9, 52); if (k % 2) M.crash(tW[k], 0.5, 1.0); } }

  // ================================================================== the sea: slow and huge
  { const a = B('sea'), b = B('up'), t1 = c('sea', 1) - 0.8, t2 = c('sea', 2) - 0.6, t4 = c('sea', 3) - 0.7, t3 = (t2 + t4) / 2 + 0.3;
    M.blow(a, 0.95, 27.5); M.boom(a + 0.03, 0.7, 60, 22, 2.0);
    M.brass(a, t1 + 0.3, ['D1', 'D2', 'A2', 'D3'], 1.05, { att: 0.5, cut: 420, open: 1300, rel: 0.7, keys: [[a + 2, 0.8], [t1 - 0.5, 1.0]] });
    M.strings(a, t1 + 0.3, ['D3', 'A3', 'D4', 'F4', 'A4'], 0.3, { att: 1.5, rel: 0.6, cut: 1500, vib: 8 });
    // "This is what got in front of the Sun."
    M.swell(t1, 1.8, 0.7); M.blow(t1, 1.0, 29.1);
    M.brass(t1, t2 + 0.3, ['Bb0', 'Bb1', 'F2', 'Bb2', 'D3'], 1.2, { att: 0.15, cut: 560, open: 2400, rel: 0.8, settle: 0.7 });
    M.strings(t1, t2 + 0.3, ['Bb3', 'D4', 'F4', 'Bb4', 'D5'], 0.34, { att: 0.5, rel: 0.6, cut: 2400, vib: 9 });
    M.strings(t1, b, ['D6', 'F6'], 0.06, { att: 2.5, rel: 0.6, cut: 7000, wave: 'triangle', vib: 4 });
    // the quay: 4,800 tonnes, 120 tonnes of TNT
    M.blow(t2, 0.8, 32.7);
    M.brass(t2, t3 - 0.2, ['G0', 'G1', 'D2', 'G2', 'Bb2'], 1.05, { att: 0.3, cut: 480, open: 1500, rel: 0.6 });
    M.strings(t2, t3 - 0.2, ['G3', 'Bb3', 'D4', 'G4'], 0.3, { att: 0.6, rel: 0.6, cut: 1800, vib: 8 });
    M.blow(t3 - 0.3, 0.8, 27.5);
    M.brass(t3 - 0.4, t4 + 0.2, ['A0', 'A1', 'E2', 'A2', 'C#3'], 1.1, { att: 0.3, cut: 500, open: 1700, rel: 0.5 });
    M.strings(t3 - 0.4, t4 + 0.2, ['A3', 'C#4', 'E4', 'A4'], 0.3, { att: 0.6, rel: 0.4, cut: 2000, vib: 8 });
    for (let t = a + 1, i = 0; t < t4 - 0.4; t += 1, i++) { M.taiko(t, 0.8, 52, -0.2); if (i % 2) { M.taiko(t + 0.5, 0.5, 62, 0.2); M.taiko(t + 0.75, 0.45, 62, 0.3); } M.bass(t, ['D2', 'D2', 'Bb1', 'Bb1', 'G1', 'G1', 'A1', 'A1'][Math.floor(i / 3) % 8], 0.7, 0.5); }
    // the ferry: a roll into the quay
    M.strings(t4, tFerry + 0.02, ['D3', 'Eb3', 'A3', 'Bb3'], 0.32, { att: 0.3, rel: 0.02, cut: 700, cutTo: 3600, cutAt: tFerry, glide: 160, glideFrom: t4, glideAt: tFerry });
    M.roll(t4, tFerry - 0.04, [[t4, 0.2], [tFerry - 0.2, 0.8]], 55); M.swell(tFerry, 0.8, 0.6);
    M.blow(tFerry, 1.05, 27.5); M.anvil(tFerry + 0.01, 0.7, 0.3, 620); M.anvil(tFerry + 0.05, 0.5, -0.3, 410);
    M.brass(tFerry, b + 0.3, ['D1', 'A1', 'D2', 'Eb2', 'A2'], 1.15, { cut: 480, open: 2600, rel: 0.9, settle: 0.7 });
    for (let t = tFerry + 0.75; t < b - 0.3; t += 0.75) { M.taiko(t, 0.85, 52, -0.2); M.taiko(t + 0.375, 0.55, 62, 0.25); } }
  // ================================================================== up: the endless rise; every west-facing shore
  { const a = B('up'), b = B('fall'), t1 = c('up', 1) - 0.8;
    M.blow(a, 0.7);
    rise(a, b, 0.05, 0.12, { rate: () => 1 / 6, fade: 0.3 });
    esDrive(M, a, t1 - 0.1, ['Dm', 'Eb'], 3, { vol: 0.85, ramp: (u) => 0.7 + 0.3 * u, fill: true });
    M.strings(a, t1, ['D3', 'A3', 'D4'], 0.3, { att: 1, rel: 0.05, cut: 800, cutTo: 3200, cutAt: t1, glide: 200, glideFrom: a + 0.5, glideAt: t1 });
    // "This is happening on every west-facing shore on Earth.": the widest chord of the film
    M.blow(t1, 0.95, 27.5);
    M.brass(t1, t1 + 2.7, ['Bb0', 'Bb1', 'F2', 'Bb2', 'D3'], 1.2, { att: 0.1, cut: 620, open: 2500, rel: 0.5 });
    M.brass(t1 + 2.6, b + 0.2, ['C1', 'C2', 'G2', 'C3', 'E3'], 1.25, { att: 0.2, cut: 660, open: 2300, rel: 1.2 });
    M.prog([[t1, ['Bb3', 'D4', 'F4', 'Bb4', 'D5']], [t1 + 2.6, ['C4', 'E4', 'G4', 'C5', 'E5']]], b + 0.3, 0.36, { cut: 2600, lastRel: 1.2 });
    for (let t = t1 + 0.5, i = 0; t < b - 0.6; t += 0.5, i++) { M.taiko(t, 0.8, i % 2 ? 62 : 52, i % 2 ? 0.25 : -0.2); if (i % 4 === 3) M.taiko(t + 0.25, 0.5, 70, 0.3); } }

  // ================================================================== the fall: held breath
  { const a = B('fall'), b = B('sky');
    M.piano(a + 0.1, 'D2', 0.5, 6); M.piano(a + 0.12, 'A2', 0.36, 6);
    hold(a, c('fall', 1) + 0.3, 'Dm9', 0.26, { cut: 900, att: 1.5 }); hold(c('fall', 1), b + 0.4, 'Bbmaj7', 0.28, { cut: 1000, att: 1.0 });
    M.strings(a, b, ['A5', 'D6'], 0.05, { att: 2, rel: 0.6, cut: 5000, wave: 'triangle', vib: 2 });
    beats(a + 0.6, b - 0.3, 1.15, 1.0, 0.3, 0.36);
    twinkle(a + 1, b - 0.5, 1.2, 0.7, ['A5', 'D6', 'E6', 'A6'], 0.1);
    M.bell(c('fall', 1) + 0.1, 'F5', 0.26, -0.2); M.bell(c('fall', 1) + 1.0, 'E5', 0.26, 0.2);
    motif(c('fall', 1) + 1.3, { gap: 0.7, vel: 0.28, n: 3, oct: 1, dur: 3 }); }
  // ================================================================== the sky: calm and high
  { const a = B('sky'), b = B('count');
    M.prog([[a, CH.Fmaj9.h], [a + 3.2, CH.Bblyd.h]], b + 0.3, 0.32, { cut: 2200, att: 1.0 });
    M.strings(a, b, ['C6', 'E6', 'A6'], 0.05, { att: 2, rel: 0.5, cut: 7000, wave: 'triangle', vib: 3 });
    twinkle(a + 0.6, b - 0.4, 0.7, 0.4, ['A5', 'C6', 'E6', 'G6', 'A6', 'C7'], 0.12);
    M.piano(a + 0.1, 'F2', 0.4, 6); M.piano(a + 3.3, 'Bb1', 0.42, 6); }

  // ================================================================== the count: the endless rise, cut dead at 5:42:01.000
  { const a = B('count'), b = tBack;
    M.blow(a, 0.85, 29.1);
    rise(a, b, 0.05, 0.16, { rate: (t) => (t < c('count', 2) ? 1 / 9 : 1 / 4), fade: 0.004 });
    M.blow(c('count', 1) - 0.5, 0.6, 32.7);
    esDrive(M, a, c('count', 2) - 0.1, ['Dm', 'Eb', 'Dm', 'Eb'], 4, { vol: 0.9, ramp: (u) => 0.7 + 0.3 * u, fill: true });
    esDrive(M, c('count', 2) - 0.1, b - 0.02, ['E', 'F', 'E', 'F'], 4, { vol: 1.0, oct: 1, ramp: (u) => 0.8 + 0.2 * u });
    M.strings(a, b + 0.005, ['D3', 'A3', 'D4', 'Eb4', 'A4'], 0.42, { att: 1.0, rel: 0.005, cut: 700, cutTo: 4600, cutAt: b, glide: 300, glideFrom: a + 1, glideAt: b });
    M.brass(a, b + 0.005, ['D1', 'D2', 'A2', 'D3'], 1.3, { swell: true, cut: 500, open: 3400 });
    beats(a + 0.3, b - 0.3, 0.6, 0.26, 0.5, 0.85);
    M.roll(c('count', 2), b - 0.03, [[c('count', 2), 0.15], [b - 0.3, 0.95]], 55); M.swell(b, 3.0, 1.0); }
  // 5:42:01.000: nothing. No stroke marks it: everything simply stops
  // ================================================================== 5:42:01: stillness
  { const a = tBack, b = B('twist');
    M.strings(a + 0.9, b + 0.4, ['A5', 'E6'], 0.06, { att: 2.5, rel: 0.6, cut: 5000, wave: 'triangle', vib: 2 });
    M.strings(a + 1.2, b + 0.4, ['D2', 'A2'], 0.26, { att: 2, rel: 0.5, cut: 240 });
    motif(c('back', 1) - 0.4, { gap: 1.05, vel: 0.44, dur: 4.2 });                                       // the five notes, whole, once
    M.piano(c('back', 2) - 0.2, 'Bb1', 0.44, 6); M.piano(c('back', 2) - 0.18, 'F2', 0.3, 6); M.bell(c('back', 2) + 0.3, 'D6', 0.16, 0.2);
    beats(c('back', 2) + 1.6, b - 0.2, 1.1, 0.9, 0.26, 0.4); }

  // ================================================================== the twist: the pulse comes back; brass climbing
  { const a = B('twist'), b = c('twist', 2) - 0.5, cs = [a, c('twist', 1) - 0.6, c('twist', 1) + 2.0, b];
    M.blow(a, 0.8, 29.1);
    [['D1', 'D2', 'A2'], ['Eb1', 'Eb2', 'Bb2'], ['E1', 'E2', 'B2', 'E3']].forEach((ns, i) => { M.brass(cs[i], cs[i + 1] + 0.25, ns, 0.9 + 0.15 * i, { att: 0.3, cut: 420 + 80 * i, open: 1300 + 500 * i, rel: 0.5 }); if (i) M.blow(cs[i], 0.6 + 0.15 * i, 32.7); });
    esDrive(M, a + 0.1, cs[1] - 0.1, ['Dm'], 2, { vol: 0.7, oct: -1, ramp: (u) => 0.6 + 0.4 * u });
    esDrive(M, cs[1], cs[2] - 0.1, ['Eb'], 3, { vol: 0.85 });
    esDrive(M, cs[2], b - 0.1, ['E'], 4, { vol: 0.95, fill: true });
    M.strings(a, b, ['A4', 'D5'], 0.14, { att: 2, rel: 0.2, cut: 1800, cutTo: 3600, cutAt: b, vib: 9, glide: 200, glideFrom: a, glideAt: b });
    rise(a + 1, b, 0.03, 0.1, { rate: () => 1 / 8, fade: 0.2 }); }
  // ================================================================== 0.2 seconds; the question: everything, to the cut
  { const a = c('twist', 2) - 0.5, b = tHit, tq = B('question');
    M.blow(a, 1.0, 27.5); M.crash(a, 0.9, 1.6);
    esDrive(M, a, tq - 0.05, ['F', 'E', 'F', 'E'], 4, { vol: 1.0, fill: true });
    esDrive(M, tq, b, ['Dm'], 4, { vol: 1.05, oct: 1 });
    M.brass(a, tq + 0.1, ['F1', 'F2', 'C3', 'F3', 'A3'], 1.2, { att: 0.15, cut: 700, open: 2600, rel: 0.3, keys: [[a + 2, 0.85], [tq - 0.3, 1.1]] });
    M.blow(tq, 1.1, 27.5); M.crash(tq, 1.0, 2.0);
    M.brass(tq, b, ['D1', 'A1', 'D2', 'F2', 'A2', 'D3'], 1.4, { swell: true, cut: 600, open: 3800 });
    M.strings(a, b, ['D4', 'F4', 'A4', 'D5', 'F5'], 0.4, { att: 1.0, rel: 0.005, cut: 1500, cutTo: 5200, cutAt: b, vib: 10, glide: 200, glideFrom: tq - 2, glideAt: b });
    rise(a, b, 0.07, 0.18, { rate: (t) => (t < tq ? 1 / 5 : 1 / 2.4), fade: 0.004 });
    beats(a + 0.2, b - 0.1, 0.5, 0.22, 0.6, 0.95);
    M.roll(tq - 1.6, b - 0.02, [[tq - 1.6, 0.2], [b - 0.3, 1.0]], 55);
    // ★ it arrives: one blow; then, over the black, the first two notes of the five, low, and nothing else
    M.blow(b, 1.2, 27.5); M.boom(b + 0.01, 1.0, 70, 20, 3.0);
    M.piano(b + 1.5, 'D3', 0.3, 5, -0.1); M.piano(b + 2.35, 'F3', 0.22, 5, 0.1); }
  M.flush();
});
ES_SOUND_FNS.push(esShepard, esMusicKit, esWord, esDrive);
window.ES_THEME = ES_THEME;
