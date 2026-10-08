/* =====================================================================
   AUDIO — the episode's soundtrack, synthesised and rendered offline (js/audio/audioEngine.js).
   Every sound reaches you when SoundArrival says it does (speed of sound 34.3 m/s after the title):
     · fixed sources (claps, the shout, the pile driver, breaking glass, alarms) at sndArriveFixed(te, where)
     · moving sources (siren, cars, the airliner's engines) through a DelayNode whose delay follows
       SoundArrival.delayCurve: the pitch shift (Doppler) and the late arrival come out exact
     · supersonic sources are silent until their shock arrives; then the boom (an N-wave), then what follows them
   Bake it when the film is final:
     NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page slow-sound.html --out films/slow-sound/soundtrack.js
   ===================================================================== */

class SndAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // everything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() {
    const fns = [sndC, sndAmb, sndH1, sndSport, sndSportV, sndPlane, sndPolice, sndDrone, sndEar, sndArriveFixed, sndPoliceBoomAt, sndPlaneBoomAt, sndSportBoomAt, SndGlass, SndCity, SndCast];
    return [SND, SND_PILE_HITS, Object.values(SoundArrival).map(String), fns.map(String)];
  }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), T = SND, B = SND.boom, END = CONFIG.duration + 1.0, c = SND.C1, app = this.app;
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);
    const rng = new RNG(CONFIG.seed + 5);

    // mix chain: buses → compressor → out → limiter
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12; lim.connect(ctx.destination);
    const out = ctx.createGain(); out.gain.value = 0.93; out.connect(lim);   // (~0.6 dB of headroom for the AAC encode)
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.25; comp.connect(out);
    const mix = ctx.createGain(); mix.gain.value = 1.5; mix.connect(comp);
    const rev = S.reverb(2.6), revG = ctx.createGain(); revG.gain.value = 0.3; rev.connect(revG); revG.connect(mix);
    const bus = (g) => { const b = ctx.createGain(); b.gain.value = g; b.connect(mix); return b; };
    const amb = bus(0.35), you = bus(0.85), src = bus(1.0), fx = bus(1.15), mus = bus(0.5);
    const send = (node, amt) => { const g = ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(rev); };

    // where a sound comes from, for your ears: pan by its bearing against the way you face, level by distance
    const panOf = (p, t) => {
      const e = sndEar(t), yaw = MathX.deg(this.cyaw.value(t)), dx = p.x - e.x, dz = p.z - e.z, d = Math.max(1, Math.hypot(dx, dz));
      return MathX.clamp((dx * Math.cos(yaw) - dz * Math.sin(yaw)) / d, -1, 1) * 0.85;
    };
    const lvl = (p, t, ref) => ref / (ref + SoundArrival.dist(p, sndEar(t)));
    // a one-shot made at te at point p: scheduled when it ARRIVES; fn(tr, gain, pan)
    const at = (te, p, ref, fn) => { const tr = sndArriveFixed(te, p); if (tr < END) fn(tr, lvl(p, tr, ref), panOf(p, tr)); return tr; };

    // a continuous moving source heard through a delay line (late arrival + exact Doppler).
    // make(dest) builds the source's emitted sound (in emission time) into dest; te0..te1: when it is sounding
    const moving = (posFn, te0, te1, a, b, make, vol, ref, dest, opts = {}) => {
      const pts = SoundArrival.delayCurve(posFn, sndEar, c, a, b, 1 / 120, te0);
      const maxD = Math.max(1, ...pts.map((q) => (q.delay === null ? 0 : q.delay))) + 0.5;
      const dly = ctx.createDelay(maxD), g = ctx.createGain(), pn = ctx.createStereoPanner(), lp = S.filter('lowpass', opts.lp || 9000, 0.7);
      make(dly);
      dly.connect(lp); lp.connect(g); g.connect(pn); pn.connect(dest);
      if (opts.rev) send(pn, opts.rev);
      let last = pts.find((q) => q.delay !== null), dl = last ? last.delay : 1;
      g.gain.setValueAtTime(0, 0); dly.delayTime.setValueAtTime(dl, 0); pn.pan.setValueAtTime(0, 0);
      // a source coming at you crowds its sound into less time: louder as well as higher (×dte/dt, capped)
      let prev = null, dop = 1;
      for (const q of pts) {
        let gv = 0, pv = 0;
        if (q.delay !== null && q.te >= te0 && q.te <= te1) {
          dl = q.delay;
          const sp = posFn(q.te);
          if (prev && prev.te !== null) { const r = (q.te - prev.te) / (q.t - prev.t); if (r > 0 && r < 50) dop += (MathX.clamp(r, 0.3, 6) - dop) * 0.25; }
          gv = vol * ref / (ref + q.d) * dop * (opts.gainFn ? opts.gainFn(q.te, q.t) : 1);
          if (opts.level) gv = opts.level(q, gv);
          pv = panOf(sp, q.t);
        }
        prev = q;
        dly.delayTime.linearRampToValueAtTime(Math.min(dl, maxD - 0.01), q.t);
        g.gain.linearRampToValueAtTime(gv, q.t);
        pn.pan.linearRampToValueAtTime(pv, q.t);
      }
      g.gain.linearRampToValueAtTime(0, b + 0.05);
      return { dly, g, pn };
    };

    // an N-wave: the two-crack "boom-boom" of a shock (front and tail shocks), duration T
    const nwave = (t, T, vol, dest, lpF, revAmt, pan = 0) => {
      const sr = ctx.sampleRate, n = Math.ceil((T + 0.03) * sr), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0), rise = 0.0012 * sr;
      for (let i = 0; i < n; i++) {
        const x = i / sr;
        if (x <= T) d[i] = (1 - 2 * x / T) * Math.min(1, i / rise);
        else d[i] = -Math.max(0, 1 - (x - T) * sr / rise);
      }
      const s = ctx.createBufferSource(); s.buffer = buf;
      const lp = S.filter('lowpass', lpF, 0.6), g = ctx.createGain(), p = S.panned(dest, pan);
      g.gain.value = vol; s.connect(lp); lp.connect(g); g.connect(p); send(g, revAmt);
      s.start(t);
    };
    // a rumble that follows a big shock (the ground and the buildings ringing)
    const rumble = (t, dur, vol, f, dest) => {
      const n = S.noise('brown', t, t + dur + 0.2), lp = S.filter('lowpass', f, 0.7), g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.setTargetAtTime(0, t + 0.08, dur / 3.5);
      n.connect(lp); lp.connect(g); g.connect(dest); send(g, 0.4);
    };
    // window glass rattling in the frames (many tiny ticks)
    const rattle = (t, dur, vol, pan, dest) => {
      for (let k = 0; k < dur * 38; k++) {
        const tt = t + rng.range(0, dur) * rng.range(0.2, 1), f = rng.range(1800, 5200), o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; S.env(g, tt, 0.001, vol * rng.range(0.3, 1) * Math.exp(-(tt - t) / (dur * 0.5)), 0.03);
        o.connect(g); g.connect(S.panned(dest, MathX.clamp(pan + rng.range(-0.5, 0.5), -1, 1))); o.start(tt); o.stop(tt + 0.08);
      }
    };
    // a pane bursting: a sharp crack, then the shower of pieces hitting the ground
    const glass = (t, vol, pan, dest, small = false) => {
      const P = S.panned(dest, pan);
      const n = S.noise('white', t, t + 0.5), hp = S.filter('highpass', 2400, 0.7), g = ctx.createGain();
      S.env(g, t, 0.002, vol * 0.8, small ? 0.08 : 0.22); n.connect(hp); hp.connect(g); g.connect(P); send(g, 0.35);
      const k = small ? 5 : 22;
      for (let i = 0; i < k; i++) {
        const tt = t + 0.02 + rng.range(0, small ? 0.25 : 0.7) * rng.range(0.3, 1), f = rng.range(2600, 7800), o = ctx.createOscillator(), og = ctx.createGain();
        o.frequency.value = f; S.env(og, tt, 0.001, vol * rng.range(0.12, 0.4), rng.range(0.02, 0.09));
        o.connect(og); og.connect(P); o.start(tt); o.stop(tt + 0.15);
      }
      if (!small) S.clunk(t, vol * 0.35, pan, dest);
    };

    // ---------------------------------------------------------------------------------------------------------------
    // 1. the city: a bed of distant traffic and air; it thins out toward the shocks, and almost goes before the line
    const bed = (type, f, q, vol) => { const n = S.noise(type, 0, END), b = S.filter('lowpass', f, q), g = ctx.createGain(); g.gain.value = vol; n.connect(b); b.connect(g); g.connect(amb); };
    bed('brown', 300, 0.7, 0.32); bed('pink', 1600, 0.5, 0.05);
    const A = amb.gain;
    A.setValueAtTime(0.35, 0); A.linearRampToValueAtTime(0.35, 49.0); A.linearRampToValueAtTime(0.14, 51.0);
    A.setValueAtTime(0.14, B.plane); A.linearRampToValueAtTime(0.28, B.plane + 1.5); A.linearRampToValueAtTime(0.16, B.police - 1.0);
    A.setValueAtTime(0.16, B.police); A.linearRampToValueAtTime(0.22, B.police + 2.5); A.linearRampToValueAtTime(0.07, T.lineA[0] + 0.5); A.linearRampToValueAtTime(0.0, END);
    // the avenue's own cars (they drive at ~12 m/s: Mach 0.35) — a few passes heard through the delay line
    if (app && app.cast) {
      const near = app.cast.cars.filter((k) => Math.abs(k.x) < 6).slice(0, 8);
      for (const k of near) {
        const pos = (t) => ({ x: k.x, y: 0.6, z: app.cast._zAt(k.table, Math.max(0, t)) });
        moving(pos, 0, END - 1, 0.2, END - 1, (d) => {
          const n = S.noise('pink', 0, END), bp = S.filter('bandpass', 420 + hash1(k.i) * 200, 0.8), g = ctx.createGain(); g.gain.value = 0.9;
          n.connect(bp); bp.connect(g); g.connect(d);
          const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 38 + hash1(k.i * 3) * 14; const og = ctx.createGain(), ol = S.filter('lowpass', 220, 0.7); og.gain.value = 0.35; o.connect(ol); ol.connect(og); og.connect(d); o.start(0); o.stop(END);
        }, 0.2, 5, src, { rev: 0.1, lp: 5000, gainFn: (te, t) => 1 - 0.75 * MathX.smooth(t, T.lineA[0] - 1.5, T.lineA[0] + 0.5) });
      }
    }

    // 2. your footsteps (only while you walk)
    {
      const zT = new Track(SCRIPT.camera.z);
      let walked = 0, next = 0.7, pz = zT.value(0);
      for (let t = 0; t < CONFIG.duration; t += 1 / 60) {
        const z = zT.value(t); walked += Math.abs(z - pz); pz = z;
        if (walked >= next) { S.step(t, 0.2, (Math.round(next / 0.7) % 2 ? 0.15 : -0.15), you); next += 0.7; }
      }
    }

    // 3. the rule change under the title: everything sags (a falling tone with the counter)
    {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
      o.frequency.setValueAtTime(220, T.rule[0]); o.frequency.exponentialRampToValueAtTime(55, T.rule[1] + 0.2);
      g.gain.setValueAtTime(0, T.rule[0] - 0.2); g.gain.linearRampToValueAtTime(0.07, T.rule[0] + 0.1); g.gain.linearRampToValueAtTime(0.0, T.rule[1] + 0.9);
      o.connect(g); g.connect(mus); o.start(T.rule[0] - 0.2); o.stop(T.rule[1] + 1);
      const n = S.noise('pink', T.rule[0] - 0.2, T.rule[1] + 1), bp = S.filter('bandpass', 3000, 0.9), ng = ctx.createGain();
      bp.frequency.setValueAtTime(3200, T.rule[0]); bp.frequency.exponentialRampToValueAtTime(260, T.rule[1] + 0.3);
      ng.gain.setValueAtTime(0, T.rule[0] - 0.2); ng.gain.linearRampToValueAtTime(0.05, T.rule[0] + 0.3); ng.gain.linearRampToValueAtTime(0, T.rule[1] + 0.9);
      n.connect(bp); bp.connect(ng); ng.connect(mus);
    }

    // 4. the friend: claps and the shout, each heard when it arrives (≈ 0.9 s after you see it)
    const F = T.friend, FP = { x: F.x, y: F.y, z: F.z };
    for (const tc of F.claps) at(tc, FP, 9, (tr, g, pn) => {
      const n = S.noise('white', tr, tr + 0.08), bp = S.filter('bandpass', 1500, 0.9), gg = ctx.createGain();
      S.env(gg, tr, 0.001, 0.55 * g * 4, 0.04); n.connect(bp); bp.connect(gg); gg.connect(S.panned(src, pn)); send(gg, 0.5);
    });
    at(F.shout, FP, 9, (tr, g, pn) => {
      const v = g * 4 * 0.5;
      S.voice(tr, 255, 0.3, 'e', v, pn, src, 0.88);
      S.voice(tr + 0.42, 238, 0.13, 'o', v * 0.85, pn, src, 0.95);
      S.voice(tr + 0.56, 226, 0.12, 'e', v * 0.8, pn, src, 0.92);
      S.voice(tr + 0.71, 262, 0.42, 'i', v * 0.95, pn, src, 0.8);
    });

    // 5. the pile driver (100 m): bang + ringing steel, ~2.9 s after each blow; the last three after it has stopped
    for (const th of SND_PILE_HITS) at(th, { x: T.pile.x - 0.75, y: 1.0, z: T.pile.z }, 14, (tr, g, pn) => {
      const v = 0.95 * g * 5.5, P = S.panned(src, pn);
      const n = S.noise('white', tr, tr + 0.15), lp = S.filter('lowpass', 2200, 0.7), gg = ctx.createGain(); S.env(gg, tr, 0.001, v, 0.05); n.connect(lp); lp.connect(gg); gg.connect(P); send(gg, 0.6);
      const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(150, tr); o.frequency.exponentialRampToValueAtTime(55, tr + 0.2); S.env(og, tr, 0.002, v * 1.2, 0.25); o.connect(og); og.connect(P); o.start(tr); o.stop(tr + 0.4);
      for (const [f, a, d] of [[470, 0.3, 0.6], [1180, 0.16, 0.4], [2050, 0.08, 0.25]]) { const r = ctx.createOscillator(), rg = ctx.createGain(); r.frequency.value = f; S.env(rg, tr, 0.002, v * a, d); r.connect(rg); rg.connect(P); send(rg, 0.4); r.start(tr); r.stop(tr + d * 1.6); }
    });

    // 6. the ambulance siren (two-tone) through the delay line: +68 % coming, −29 % going (over an octave apart)
    moving(sndAmb, 9.0, 31.0, 9.0, 33.0, (d) => {
      const o = ctx.createOscillator(); o.type = 'square';
      for (let t = 9.0; t < 31.0; t += 0.55) o.frequency.setValueAtTime(Math.round((t - 9) / 0.55) % 2 ? 600 : 450, t);
      const lp = S.filter('lowpass', 1800, 0.7), g = ctx.createGain(); g.gain.value = 0.5; o.connect(lp); lp.connect(g); g.connect(d); o.start(9.0); o.stop(31.0);
      const n = S.noise('pink', 9, 31), bp = S.filter('lowpass', 500, 0.7), ng = ctx.createGain(); ng.gain.value = 0.5; n.connect(bp); bp.connect(ng); ng.connect(d);
    }, 0.55, 8, src, { rev: 0.2 });

    // 7. the 110 km/h car on the highway (Mach 0.89): its sound is squeezed up ~9× coming, then drops 4 octaves
    const engine = (dest, t0, t1, f0, noiseF, nv, ov) => {
      const n = S.noise('pink', t0, t1), lp = S.filter('lowpass', noiseF, 0.6), g = ctx.createGain(); g.gain.value = nv; n.connect(lp); lp.connect(g); g.connect(dest);
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f0; const ol = S.filter('lowpass', f0 * 4, 0.8), og = ctx.createGain(); og.gain.value = ov; o.connect(ol); ol.connect(og); og.connect(dest); o.start(t0); o.stop(t1);
    };
    moving(sndH1, 0.0, 40.0, 10.0, 40.0, (d) => engine(d, 0, 40, 46, 380, 0.8, 0.4), 0.55, 10, src, { rev: 0.12, lp: 7000 });

    // 8. the car that goes supersonic: its whole approach arrives squeezed into a rising scream, then the boom
    // (half a kilometre away the squeezed sound would be faint; the film lets you hear it build: a floor under the
    //  natural level that rises into the shock, so the scream is there before the boom, never louder than it)
    const sportLevel = (q, g) => (q.t < B.sport ? Math.max(g, 0.03 + 0.34 * Math.pow(MathX.smooth(q.t, 33.75, B.sport), 2)) : g);
    moving(sndSport, 0.0, 44.0, 26.0, 46.0, (d) => engine(d, 0, 44, 62, 420, 0.8, 0.5), 0.55, 10, src, { rev: 0.12, lp: 6500, level: sportLevel });
    nwave(B.sport, 0.09, 0.85, fx, 5000, 0.4, -0.55);
    S.thump(B.sport + 0.01, 0.35, fx);
    rattle(B.sport + 0.05, 0.9, 0.06, 0.5, fx);

    // 9. the drone: propeller tips at Mach 2.6 → a tearing buzz-saw crackle; then it falls (8.5 m away: 0.25 s late)
    {
      const D = T.drone, dp = (t) => { const q = sndDrone(t); return { x: q.x, y: q.y + LAYOUT.curbH, z: q.z }; };
      moving(dp, D.up, D.down + 0.1, D.up - 0.5, D.down + 2, (d) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, D.up); o.frequency.linearRampToValueAtTime(340, D.up + 0.8);
        for (let t = D.up + 0.8; t < D.down; t += 0.11) o.frequency.linearRampToValueAtTime(330 + 40 * Math.sin(t * 7) + rng.range(-25, 25), t);
        const ws = ctx.createWaveShaper(), curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(x * 6); } ws.curve = curve;
        const og = ctx.createGain(); og.gain.setValueAtTime(0, D.up); og.gain.linearRampToValueAtTime(0.4, D.up + 0.5); og.gain.setValueAtTime(0.4, D.down - 0.05); og.gain.linearRampToValueAtTime(0, D.down + 0.05);
        o.connect(ws); ws.connect(og); og.connect(d); o.start(D.up); o.stop(D.down + 0.2);
        const cb = ctx.createBufferSource(); cb.buffer = S.crackleBuffer(4, 520); cb.loop = true; const cg = ctx.createGain(), hp = S.filter('highpass', 900, 0.7);
        cg.gain.setValueAtTime(0, D.up); cg.gain.linearRampToValueAtTime(0.9, D.up + 0.7); cg.gain.setValueAtTime(0.9, D.down - 0.05); cg.gain.linearRampToValueAtTime(0, D.down + 0.05);
        cb.connect(hp); hp.connect(cg); cg.connect(d); cb.start(D.up); cb.stop(D.down + 0.2);
      }, 0.5, 5, src, { rev: 0.15 });
      at(D.down, dp(D.down), 5, (tr, g, pn) => { S.clunk(tr, 0.7 * g * 2.2, pn, src); S.click(tr + 0.12, 0.25 * g * 2.2, pn, src); S.clunk(tr + 0.3, 0.3 * g * 2.2, pn, src); });
    }

    // 10. the airliner (Mach 2.1): nothing at all until its shock arrives, then a huge double boom and the city's reply
    nwave(B.plane, 0.32, 1.0, fx, 1500, 0.8, 0.0);
    S.boom(B.plane + 0.02, 0.85, fx, rev);
    rumble(B.plane + 0.05, 4.5, 0.55, 130, fx);
    rattle(B.plane + 0.03, 2.2, 0.1, 0, fx);
    // its engines, heard only from the boom on (receding, ~3× lower), surging
    moving(sndPlane, 30.0, 60.0, B.plane - 0.5, 70.0, (d) => {
      const n = S.noise('brown', 30, 60), lp = S.filter('lowpass', 700, 0.6), g = ctx.createGain(); g.gain.value = 1.2; n.connect(lp); lp.connect(g); g.connect(d);
      const w = S.noise('pink', 30, 60), bp = S.filter('bandpass', 1400, 1.2), wg = ctx.createGain(); wg.gain.value = 0.25; w.connect(bp); bp.connect(wg); wg.connect(d);
      for (let t = 40; t < 60; t += 0.9 + rng.range(0, 1.3)) S.backfire(t, 0.5, d, false);
    }, 1.1, 120, src, { rev: 0.4, lp: 3000 });
    // car alarms in the lot (each starts when the shock reaches that car, heard when its sound reaches you)
    if (app && app.cast) {
      const al = app.cast.parked.filter((k) => k.alarm).sort((a, b) => Math.hypot(a.x - 9.4, a.z - 1) - Math.hypot(b.x - 9.4, b.z - 1)).slice(0, 3);
      al.forEach((k, i) => {
        const p = { x: k.x, y: 1, z: k.z }, tr = sndArriveFixed(k.tA + 0.25, p), t1 = T.lineA[0] + 0.6, pts = this._spatial(() => p, tr, t1, 1 / 10, 12);
        // (they keep going, but the mix lets them fall away under the closing line)
        S.alarm(tr, t1, pts.map((q) => Object.assign({}, q, { gain: q.gain * 0.3 * (1 - MathX.smooth(q.t, T.lineA[0] - 2.5, t1)) })), src, rev, this);
      });
      // the pigeons burst off the roof
      for (const b of app.cast.birds.filter((_, i) => i % 3 === 0)) at(b.tA, { x: b.x, y: b.y, z: b.z }, 14, (tr, g, pn) => S.flap(tr, pn, 0.12 * g * 3, src));
    }

    // 11. the police car (Mach 1.3): silent while it comes; its shock; the glass; then its siren, low and moaning
    moving(sndPolice, 40.0, 66.0, B.police - 0.3, END - 0.5, (d) => {
      const o = ctx.createOscillator(); o.type = 'square';
      o.frequency.setValueAtTime(700, 40);
      for (let t = 40; t < 66; t += 2.4) { o.frequency.linearRampToValueAtTime(1400, t + 1.2); o.frequency.linearRampToValueAtTime(700, t + 2.4); }
      const lp = S.filter('lowpass', 2200, 0.7), g = ctx.createGain(); g.gain.value = 0.55; o.connect(lp); lp.connect(g); g.connect(d); o.start(40); o.stop(66);
      engine(d, 40, 66, 70, 520, 0.6, 0.35);
    }, 0.75, 8, src, { rev: 0.3, gainFn: (te, t) => 1 - 0.8 * MathX.smooth(t, T.lineA[0] - 1.0, T.lineA[0] + 1.5) });
    nwave(B.police, 0.075, 1.0, fx, 6500, 0.55, 0.5);
    S.thump(B.police + 0.01, 0.6, fx);
    rumble(B.police + 0.02, 1.6, 0.32, 220, fx);
    // every pane that bursts or cracks, heard from where it is (the cascade rolls in from down the street)
    if (app && app.glass) {
      for (const p of app.glass.panes) {
        if (!p.fate) continue;
        const where = { x: p.xf, y: 1.6, z: p.zc };
        at(p.tf, where, 6, (tr, g, pn) => glass(tr, (p.fate === 2 ? 1.0 : 0.35) * g * 3.2, pn, src, p.fate === 1));
      }
    }

    // 12. the score: barely there — a low swell under the supersonic car and the airliner, silence before each shock
    const pad = (t0, t1, notes, vol) => { for (const f of notes) S.tone(t0, t1 - t0, f, vol, 0, mus, 'sine', (t1 - t0) * 0.45, (t1 - t0) * 0.35); };
    pad(29.5, B.sport - 0.15, [55, 82.4], 0.05);
    pad(44.5, 50.5, [49, 73.4, 98], 0.045);
    pad(55.4, B.police - 0.2, [58.3, 87.3], 0.045);
    // the closing chord under the line
    for (const f of [110, 164.8, 220, 277.2]) S.tone(T.lineA[0] - 0.3, 6.6, f, 0.032, 0, mus, 'sine', 1.4, 2.6);
  }
}
