/* =====================================================================
   AUDIO — the episode's soundtrack, synthesised and rendered offline (js/audio/audioEngine.js).
   Every sound reaches you when SoundArrival's rule says (arrival = event + distance / 34.3 m/s), from where it was
   made, to where YOUR ear is at that moment (the ear jumps at each cut). What changes in this air, besides timing:
     · voices: the vocal folds keep their pitch, but the throat and mouth resonances scale with the speed of
       sound (10× lower): every voice comes out deep, hollow and muffled
     · anything whose note is set by an air cavity drops ~10×: the referee's whistle hoots, claps become soft thumps
       (the cupped palms), the ball's ping becomes a deep "dum"
     · echoes come back seconds later; one announcement from five loudspeakers arrives three times
   Thousands of small sounds (claps, cheers, gasps, footsteps) are mixed here in JavaScript from the crowd's own
   numbers (crowd.js), each one placed by its own distance; the rest are Web Audio nodes.
   Bake it when the film is final:
     NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page slow-sound.html --out films/slow-sound/soundtrack.js
   ===================================================================== */

class SndAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // everything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() {
    const fns = [sndC, sndEar, sndArriveFixed, sndHeardAt, sndThunderAt, sndBall, sndBallV, sndNetBulge, sndNetDepth, sndRunnerX, sndCrowdSeats, SndCrowd, sndFlashLevel];
    return [SND, SND_ST, SND_RUNNERS, Object.values(SoundArrival).map(String), fns.map(String)];
  }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), T = SND, H = SND.heard, END = CONFIG.duration + 1.0, c = SND.C1, app = this.app, SR = ctx.sampleRate;
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const rng = new RNG(CONFIG.seed + 5);
    const tT = H.thunder;

    // mix chain: buses → (your hands over your ears) → compressor → out → limiter → soft clip
    const clip = ctx.createWaveShaper(), CN = 2048, cv = new Float32Array(CN), knee = 0.6, ceil = 0.84;
    for (let i = 0; i < CN; i++) { const x = (i / (CN - 1)) * 2 - 1, ax = Math.abs(x); cv[i] = Math.sign(x) * (ax <= knee ? ax : knee + (ceil - knee) * Math.tanh((ax - knee) / (ceil - knee))); }
    clip.curve = cv; clip.oversample = '4x'; clip.connect(ctx.destination);
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.12; lim.connect(clip);
    const out = ctx.createGain(); out.gain.value = 0.9; out.connect(lim);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.25; comp.connect(out);
    const ears = S.filter('lowpass', 20000, 0.7); ears.connect(comp);
    ears.frequency.setValueAtTime(20000, 0); ears.frequency.setValueAtTime(20000, tT + 0.12); ears.frequency.exponentialRampToValueAtTime(650, tT + 0.3);
    ears.frequency.setValueAtTime(650, tT + 2.55); ears.frequency.exponentialRampToValueAtTime(20000, tT + 3.3);
    const mix = ctx.createGain(), mixHp = S.filter('highpass', 26, 0.7); mix.gain.value = 1.5; mix.connect(mixHp); mixHp.connect(ears);
    // the stadium's reverb: long (echoes take ten times longer to die away in this air)
    const rev = S.reverb(4.2), revG = ctx.createGain(); revG.gain.value = 0.3; rev.connect(revG); revG.connect(mix);
    // (window.SND_SOLO = 'amb' etc. renders one bus alone, for checking the mix; never set in the film)
    const solo = typeof window !== 'undefined' ? window.SND_SOLO : null;
    // (each bus: its own gain, which may be automated, then a fixed trim that sets the balance)
    const bus = (name, g, trim) => { const b = ctx.createGain(), m = ctx.createGain(); b.gain.value = g; m.gain.value = solo && solo !== name ? 0 : trim; b.connect(m); m.connect(mix); return b; };
    const amb = bus('amb', 0.4, 0.2), src = bus('src', 1.0, 0.45), fx = bus('fx', 1.15, 1.0), mus = bus('mus', 0.5, 1.0), crowd = bus('crowd', 1.0, 0.35), voices = bus('voices', 1.0, 0.26);
    if (solo) revG.gain.value = 0;
    const send = (node, amt) => { const g = ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(rev); };
    send(crowd, 0.35);

    // where a sound comes from, for your ears: pan by its bearing against the way you face, level by distance
    const panOf = (p, t) => {
      const e = sndEar(t), yaw = MathX.deg(this.cyaw.value(t)), dx = p.x - e.x, dz = p.z - e.z, d = Math.max(1, Math.hypot(dx, dz));
      return MathX.clamp((dx * Math.cos(yaw) - dz * Math.sin(yaw)) / d, -1, 1) * 0.85;
    };
    const lvl = (p, t, ref) => ref / (ref + SoundArrival.dist(p, sndEar(t)));
    // when a sound made at te at p reaches your ear: the first moment its front (it travels SND_RUN) gets to where
    // your ear is then (your ear jumps at the cuts, so this marches forward instead of iterating)
    const arrive = (te, p) => {
      const hit = (t) => SND_RUN(te, t) >= SoundArrival.dist(p, sndEar(t));
      let t = te;
      for (let i = 0; i < 9000; i++) {
        const t2 = t + 1 / 60;
        if (hit(t2)) { let lo = t, hi = t2; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (hit(m)) hi = m; else lo = m; } return hi; }
        t = t2;
      }
      return Infinity;
    };
    // a one-shot made at te at point p: scheduled when it ARRIVES; fn(tr, gain, pan)
    const at = (te, p, ref, fn) => { const tr = arrive(te, p); if (tr < END - 0.3) fn(tr, lvl(p, tr, ref), panOf(p, tr)); return tr; };
    // its echoes off the four stand fronts (image sources): later, softer, duller (only off a wall on YOUR side:
    // if you are up in a stand, behind its front wall, that wall's echo goes back out over the pitch)
    const WALLS = [['z', -SND_ST.side.d0 + 0.42], ['z', SND_ST.side.d0 - 0.42], ['x', -SND_ST.end.d0 + 0.42], ['x', SND_ST.end.d0 - 0.42]];
    const echoes = (te, p, ref, fn) => {
      for (const [ax, w] of WALLS) {
        const q = { x: p.x, y: p.y, z: p.z }; q[ax] = 2 * w - p[ax];
        const tr = arrive(te, q);
        if (!(tr < END - 0.3) || Math.sign(sndEar(tr)[ax] - w) !== Math.sign(p[ax] - w)) continue;
        fn(tr, lvl(q, tr, ref) * 0.45, panOf(q, tr));
      }
    };

    // --- small sounds mixed in JavaScript: thousands of grains, each placed by its own arrival ---------------------
    const NS = Math.ceil(END * SR), G = [new Float32Array(NS), new Float32Array(NS)], VG = [new Float32Array(NS), new Float32Array(NS)];
    const grain = (arr, t, g, pan, into = G) => {
      if (!(t < END) || g <= 0) return;
      const i0 = Math.round(t * SR), a = Math.cos((pan + 1) * Math.PI / 4) * g, b = Math.sin((pan + 1) * Math.PI / 4) * g, L = into[0], R = into[1];
      for (let i = 0, n = Math.min(arr.length, NS - i0); i < n; i++) { const v = arr[i]; L[i0 + i] += v * a; R[i0 + i] += v * b; }
    };
    const noiseArr = (n, seed) => { const r = new RNG(seed), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = r.next() * 2 - 1; return a; };
    const biquad = (x, type, f, Q) => {
      const w = 2 * Math.PI * f / SR, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Q), a0 = 1 + al;
      let b0, b1, b2; const a1 = -2 * cw / a0, a2 = (1 - al) / a0;
      if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; } else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; } else { b0 = al; b1 = 0; b2 = -al; }
      b0 /= a0; b1 /= a0; b2 /= a0;
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < x.length; i++) { const x0 = x[i], y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x0; y2 = y1; y1 = y0; x[i] = y0; }
      return x;
    };
    const norm = (x) => { let m = 1e-9; for (const v of x) m = Math.max(m, Math.abs(v)); for (let i = 0; i < x.length; i++) x[i] /= m; return x; };
    // a hollow voice in JS (a buzz at the vocal folds' pitch, through resonances ten times lower than in normal air)
    const hollowArr = (dur, f0, f1, seed, att, rel) => {
      const n = Math.round(dur * SR), x = new Float32Array(n), r = new RNG(seed);
      let ph = 0;
      for (let i = 0; i < n; i++) { const u = i / n, f = f0 + (f1 - f0) * u + 4 * Math.sin(i / SR * 2 * Math.PI * 5.5); ph += f / SR; x[i] = (ph % 1) * 2 - 1 + (r.next() * 2 - 1) * 0.35; }
      const y = Float32Array.from(x), z2 = Float32Array.from(x);
      biquad(x, 'bp', 95, 1.6); biquad(y, 'bp', 160, 2.0); biquad(z2, 'lp', 330, 0.9);
      for (let i = 0; i < n; i++) { const u = i / SR, e = Math.min(1, u / att) * Math.min(1, (dur - u) / rel); x[i] = (x[i] * 1.0 + y[i] * 0.7 + z2[i] * 0.45) * Math.max(0, e); }
      return norm(x);
    };
    // the grains
    const CLAPS = [0, 1, 2, 3, 4, 5].map((k) => {        // a clap: cupped palms ring ~10× lower — a soft thump, with a little click
      const n = Math.round(0.14 * SR), x = noiseArr(n, 300 + k), y = noiseArr(n, 400 + k);
      biquad(x, 'bp', 150 + k * 14, 1.4); biquad(y, 'hp', 1400, 0.7);
      for (let i = 0; i < n; i++) { const u = i / SR; x[i] = x[i] * Math.min(1, u / 0.002) * Math.exp(-u / 0.03) + 0.07 * y[i] * Math.exp(-u / 0.003); }
      return norm(x);
    });
    const STEPS = [0, 1, 2, 3].map((k) => {
      const n = Math.round(0.11 * SR), x = noiseArr(n, 500 + k);
      biquad(x, 'lp', 320 + k * 40, 0.8);
      for (let i = 0; i < n; i++) { const u = i / SR; x[i] = (x[i] + 0.6 * Math.sin(2 * Math.PI * 72 * u)) * Math.min(1, u / 0.002) * Math.exp(-u / 0.022); }
      return norm(x);
    });
    const CHEERS = [0, 1, 2, 3, 4].map((k) => hollowArr(2.4 + 0.3 * hash1(k), 230 + 60 * hash1(k * 3), 250 + 70 * hash1(k * 5), 600 + k, 0.12, 0.9));
    const GASPS = [0, 1, 2, 3].map((k) => hollowArr(0.6, 300 + 40 * k, 220 + 30 * k, 700 + k, 0.02, 0.45));

    // ---------------------------------------------------------------------------------------------------------------
    // 1. the stadium: a crowd murmur all round. Under the title it sinks into a deep, hollow murmur (voices in this air)
    {
      const n = S.noise('pink', 0, END), bp = S.filter('bandpass', 900, 0.55), lp = S.filter('lowpass', 2600, 0.6), g = ctx.createGain();
      bp.frequency.setValueAtTime(900, 0); bp.frequency.setValueAtTime(900, T.rule[0]); bp.frequency.exponentialRampToValueAtTime(140, T.rule[1]);
      lp.frequency.setValueAtTime(2600, 0); lp.frequency.setValueAtTime(2600, T.rule[0]); lp.frequency.exponentialRampToValueAtTime(420, T.rule[1]);
      g.gain.value = 1.5; n.connect(bp); bp.connect(lp); lp.connect(g); g.connect(amb);
      // swells (a crowd is never steady)
      const sw = ctx.createGain(); g.disconnect(); g.connect(sw); sw.connect(amb);
      sw.gain.setValueAtTime(1, 0); for (let t = 0.5; t < END; t += 1.3 + rng.range(0, 1.6)) sw.gain.linearRampToValueAtTime(0.75 + rng.range(0, 0.5), t);
      const hum = S.noise('brown', 0, END), hl = S.filter('lowpass', 140, 0.7), hg = ctx.createGain(); hg.gain.value = 0.5; hum.connect(hl); hl.connect(hg); hg.connect(amb);
      // the level shot by shot: a hush before the free kick; a hush as the storm comes; it all thins out at the end
      const A = amb.gain, K = SND.kick;
      A.setValueAtTime(0.4, 0);
      A.setValueAtTime(0.4, SND.cuts[2]); A.linearRampToValueAtTime(0.26, K.t - 1.2); A.linearRampToValueAtTime(0.18, K.t);
      A.setValueAtTime(0.18, SND.cuts[3] - 0.05); A.linearRampToValueAtTime(0.32, SND.cuts[3]);
      A.setValueAtTime(0.32, SND.cuts[4] - 0.05); A.linearRampToValueAtTime(0.4, SND.cuts[4]); A.linearRampToValueAtTime(0.4, tT - 5.0); A.linearRampToValueAtTime(0.22, tT - 2.0);
      A.setValueAtTime(0.22, tT); A.linearRampToValueAtTime(0.34, tT + 3.5); A.linearRampToValueAtTime(0.12, T.lineB[0]); A.linearRampToValueAtTime(0.0, END - 0.3);
    }

    // 2. the rule change under the title: everything sags (a falling tone with the counter)
    {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
      o.frequency.setValueAtTime(220, T.rule[0]); o.frequency.exponentialRampToValueAtTime(55, T.rule[1] + 0.2);
      g.gain.setValueAtTime(0, T.rule[0] - 0.2); g.gain.linearRampToValueAtTime(0.15, T.rule[0] + 0.1); g.gain.linearRampToValueAtTime(0.0, T.rule[1] + 0.9);
      o.connect(g); g.connect(mus); o.start(T.rule[0] - 0.2); o.stop(T.rule[1] + 1);
      const n = S.noise('pink', T.rule[0] - 0.2, T.rule[1] + 1), bp = S.filter('bandpass', 3000, 0.9), ng = ctx.createGain();
      bp.frequency.setValueAtTime(3200, T.rule[0]); bp.frequency.exponentialRampToValueAtTime(260, T.rule[1] + 0.3);
      ng.gain.setValueAtTime(0, T.rule[0] - 0.2); ng.gain.linearRampToValueAtTime(0.09, T.rule[0] + 0.3); ng.gain.linearRampToValueAtTime(0, T.rule[1] + 0.9);
      n.connect(bp); bp.connect(ng); ng.connect(mus);
    }

    // 3. the start: "Set!" (in normal air: a clear voice, on time), then the gun, heard 2.2 s late, and the stadium's
    //    echoes 2 s after that; the runners' feet, each set from where that runner is
    const G0 = SND_P(T.gun.x, T.gun.y, T.gun.z);
    at(T.gun.set, SND_P(T.gun.x + 0.35, 1.65, T.gun.z), 9, (tr, g, pn) => S.voice(tr, 175, 0.34, 'e', 6.4 * g, pn, src, 0.92));
    const bang = (tr, g, pn, bright) => {
      const P = S.panned(fx, pn);
      // (in this air high notes die within metres — absorption grows as 1/c³ — so even the direct bang is dull)
      const n = S.noise('white', tr, tr + 0.3), hp = S.filter(bright ? 'bandpass' : 'lowpass', bright ? 620 : 700, bright ? 0.8 : 0.7), ng = ctx.createGain();
      S.env(ng, tr, 0.001, g, bright ? 0.07 : 0.25); n.connect(hp); hp.connect(ng); ng.connect(P); send(ng, 0.5);
      const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(170, tr); o.frequency.exponentialRampToValueAtTime(48, tr + 0.25);
      S.env(og, tr, 0.002, g * 1.1, 0.3); o.connect(og); og.connect(P); o.start(tr); o.stop(tr + 0.45);
    };
    at(T.gun.bang, G0, 12, (tr, g, pn) => bang(tr, 4.0 * g, pn, true));
    echoes(T.gun.bang, G0, 12, (tr, g, pn) => bang(tr, 4.0 * g, pn, false));
    SND_RUNNERS.forEach((R) => {
      let k = 1;
      for (let t = R.go; t < SND.cuts[0] + 1.5; t += 1 / 240) {
        if (sndRunnerX(R, t) - SND.line.x < k * 1.15) continue;
        const p = SND_P(sndRunnerX(R, t), 0.05, R.z), tr = arrive(t, p);
        grain(STEPS[k % 4], tr, 0.5 * lvl(p, tr, 3), panOf(p, tr));
        k++;
      }
    });

    // 4. your friend: "Hey! Up here!" and "Over here!" — 0.8 s late, and hollow
    const FM = SND_FRIEND_MOUTH;
    at(T.friend.shout, FM, 9, (tr, g, pn) => {
      const v = 4.4 * g;
      for (const [dt, dur, f0, f1, sd] of [[0, 0.3, 270, 250, 1], [0.42, 0.13, 240, 236, 2], [0.57, 0.42, 280, 228, 3]]) grain(hollowArr(dur, f0, f1, 800 + sd, 0.02, 0.12), tr + dt, v, pn, VG);
    });
    at(T.friend.shout2, FM, 9, (tr, g, pn) => {     // "Over here!"
      const v = 4.6 * g;
      for (const [dt, dur, f0, f1, sd] of [[0, 0.24, 262, 248, 4], [0.27, 0.12, 250, 244, 5], [0.42, 0.36, 284, 226, 6]]) grain(hollowArr(dur, f0, f1, 800 + sd, 0.02, 0.12), tr + dt, v, pn, VG);
    });

    // 5. the announcer, through five loudspeakers: each copy arrives from its own speaker (three arrivals here)
    {
      const syl = [[0, 0.16, 135, 130], [0.17, 0.21, 128, 124], [0.42, 0.14, 132, 128], [0.6, 0.17, 142, 136], [0.78, 0.13, 132, 128], [0.93, 0.38, 124, 108]];
      const words = syl.map(([, dur, f0, f1], i) => { const x = hollowArr(dur, f0, f1, 900 + i, 0.015, 0.06); return x; });
      T.pa.speakers.forEach((P, si) => at(T.pa.speak, P, 26, (tr, g, pn) => {
        syl.forEach(([dt], i) => grain(words[i], tr + dt, 2.6 * g, pn, VG));
        // the loudspeaker's own horn ring (a little brightness the voice no longer has)
        const n = S.noise('pink', tr, tr + 1.4), bp = S.filter('bandpass', 800, 3), gg = ctx.createGain();
        gg.gain.setValueAtTime(0, tr); gg.gain.linearRampToValueAtTime(0.05 * g * 2.6, tr + 0.03); gg.gain.setValueAtTime(0.05 * g * 2.6, tr + 1.25); gg.gain.linearRampToValueAtTime(0, tr + 1.4);
        n.connect(bp); bp.connect(gg); gg.connect(S.panned(src, pn)); send(gg, 0.6);
      }));
    }

    // 6. the referee's whistle: its note is set by its air chamber — ten times lower, a hoot with the pea's trill
    const WP = SND_P(T.whistle.x, T.whistle.y, T.whistle.z);
    const hoot = (tr, g, pn) => {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), am = ctx.createOscillator(), amg = ctx.createGain(), g2 = ctx.createGain(), og = ctx.createGain(), P = S.panned(src, pn);
      o.type = 'triangle'; o.frequency.setValueAtTime(330, tr); o.frequency.linearRampToValueAtTime(352, tr + 0.08); o.frequency.setValueAtTime(352, tr + 0.75); o.frequency.linearRampToValueAtTime(320, tr + 0.95);
      o2.type = 'sine'; o2.frequency.value = 704;
      am.frequency.value = 27; amg.gain.value = 0.45; am.connect(amg); amg.connect(og.gain);
      og.gain.setValueAtTime(0, tr); og.gain.linearRampToValueAtTime(g * 0.55, tr + 0.04); og.gain.setValueAtTime(g * 0.55, tr + 0.8); og.gain.linearRampToValueAtTime(0, tr + 0.98);
      g2.gain.value = 0.12; o2.connect(g2); g2.connect(og);
      o.connect(og); og.connect(P); send(og, 0.5);
      for (const x of [o, o2, am]) { x.start(tr); x.stop(tr + 1.05); }
    };
    at(T.whistle.t, WP, 10, (tr, g, pn) => hoot(tr, 2.2 * g, pn));
    echoes(T.whistle.t, WP, 10, (tr, g, pn) => hoot(tr, 1.7 * g, pn));

    // 7. the shot: the ball outruns its own sound — a crack (its shock, as it drops through Mach 1), the kick's deep
    //    "dum" (the ball's air rings ten times lower), the net
    {
      const K = T.kick, KP = SND_P(K.x, 0.15, K.z), N = SND_NET, NP = SND_P(N.back, N.y, N.z);
      const crack = (tr, g, pn) => {
        const n = S.noise('white', tr, tr + 0.05), hp = S.filter('bandpass', 650, 0.8), gg = ctx.createGain();
        S.env(gg, tr, 0.0005, g, 0.012); n.connect(hp); hp.connect(gg); gg.connect(S.panned(fx, pn)); send(gg, 0.35);
      };
      { const tr = H.ball, p = sndBall(SND_BALL.tMach1); crack(tr, 3.0, panOf(p, tr)); }
      at(K.t, KP, 8, (tr, g, pn) => {
        const P = S.panned(src, pn), o = ctx.createOscillator(), og = ctx.createGain();
        o.frequency.setValueAtTime(96, tr); o.frequency.exponentialRampToValueAtTime(70, tr + 0.3); S.env(og, tr, 0.003, 7.5 * g, 0.4); o.connect(og); og.connect(P); o.start(tr); o.stop(tr + 0.5); send(og, 0.4);
        const n = S.noise('pink', tr, tr + 0.1), lp = S.filter('lowpass', 700, 0.7), ng = ctx.createGain(); S.env(ng, tr, 0.001, 5.0 * g, 0.06); n.connect(lp); lp.connect(ng); ng.connect(P);
      });
      at(N.tN, NP, 6, (tr, g, pn) => {
        const n = S.noise('white', tr, tr + 0.6), bp = S.filter('bandpass', 700, 0.8), gg = ctx.createGain();
        gg.gain.setValueAtTime(0, tr); gg.gain.linearRampToValueAtTime(1.3 * g, tr + 0.02); gg.gain.setTargetAtTime(0, tr + 0.04, 0.12);
        n.connect(bp); bp.connect(gg); gg.connect(S.panned(src, pn));
      });
    }

    // 8. the crowd: the cheer after the goal (everyone SEES it at once; you hear the stands one after another),
    //    the claps (each fan claps when the drum reaches IT), the gasps when the thunder reaches each seat
    const fans = app && app.crowd ? app.crowd.fans : [];
    fans.forEach((f, i) => {
      if (i % 17 === 0 && f.tGoal < 1e5) {
        const tr = arrive(f.tGoal + 0.08, f.head);
        grain(CHEERS[i % 5], tr, 0.26 * lvl(f.head, tr, 10), panOf(f.head, tr));
      }
      if (i % 13 === 0 && f.clapper) {
        for (let k = 0; k < T.drum.n; k++) {
          const te = T.drum.t0 + k * T.drum.period + f.tDrum + 0.09, tr = arrive(te, f.head);
          if (tr > END - 0.5) break;
          grain(CLAPS[(i + k) % 6], tr, 0.6 * lvl(f.head, tr, 5), panOf(f.head, tr));
        }
      }
      if (i % 19 === 0) {
        const tr = arrive(f.tThunder + 0.12, f.head);
        grain(GASPS[i % 4], tr, 0.5 * lvl(f.head, tr, 8), panOf(f.head, tr));
      }
    });

    // 9. the drum: a deep bass drum, every beat heard from where it is
    for (let k = 0; k < T.drum.n; k++) at(T.drum.t0 + k * T.drum.period, SND_DRUM, 12, (tr, g, pn) => {
      const P = S.panned(src, pn), o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.setValueAtTime(78, tr); o.frequency.exponentialRampToValueAtTime(48, tr + 0.25); S.env(og, tr, 0.003, 4.2 * g, 0.32); o.connect(og); og.connect(P); o.start(tr); o.stop(tr + 0.6); send(og, 0.45);
      const n = S.noise('pink', tr, tr + 0.08), lp = S.filter('lowpass', 500, 0.7), ng = ctx.createGain(); S.env(ng, tr, 0.001, 1.3 * g, 0.05); n.connect(lp); lp.connect(ng); ng.connect(P);
    });

    // the grains, played
    {
      for (const [B, to] of [[G, crowd], [VG, voices]]) {
        const buf = ctx.createBuffer(2, NS, SR); buf.copyToChannel(B[0], 0); buf.copyToChannel(B[1], 1);
        const s = ctx.createBufferSource(); s.buffer = buf; s.connect(to); s.start(0);
      }
    }

    // 10. the thunder (the flash under the title, 1.71 km away): no crack (over 1.7 km this air soaks up everything
    //     above ~200 Hz), a deep blow you feel, then a roll that would go on for a minute
    {
      const pn = panOf(SND_BOLT, tT);
      // the front: a heavy low blow
      const n = S.noise('white', tT, tT + 0.8), hp = S.filter('lowpass', 380, 0.7), g = ctx.createGain();
      g.gain.setValueAtTime(0, tT); g.gain.linearRampToValueAtTime(3.2, tT + 0.006); g.gain.setTargetAtTime(0, tT + 0.02, 0.09);
      n.connect(hp); hp.connect(g); g.connect(S.panned(fx, pn)); send(g, 0.6);
      S.boom(tT + 0.02, 1.0, fx, rev);
      S.thump(tT + 0.01, 0.9, fx);
      // the roll: brown noise through a low filter, in uneven waves (sound from further up the bolt, and its branches)
      const roll = S.noise('brown', tT, END), rl = S.filter('lowpass', 260, 0.8), rg = ctx.createGain(), mid = S.noise('pink', tT, END), ml = S.filter('lowpass', 420, 0.6), mg = ctx.createGain();
      roll.connect(rl); rl.connect(rg); rg.connect(S.panned(fx, pn * 0.6)); send(rg, 0.5);
      mid.connect(ml); ml.connect(mg); mg.connect(S.panned(fx, pn * 0.4));
      rg.gain.setValueAtTime(0, tT); rg.gain.linearRampToValueAtTime(1.5, tT + 0.06);
      mg.gain.setValueAtTime(0, tT); mg.gain.linearRampToValueAtTime(0.5, tT + 0.03); mg.gain.setTargetAtTime(0.05, tT + 0.2, 0.8);
      const peaks = [[0.9, 1.25], [2.1, 1.0], [3.4, 1.0], [5.2, 0.55], [6.9, 0.5], [8.6, 0.32]];
      rg.gain.setTargetAtTime(0.55, tT + 0.1, 0.35);
      for (const [dt, a] of peaks) { const t0 = tT + dt; if (t0 > END - 0.5) break; rg.gain.setTargetAtTime(a, t0 - 0.3, 0.12); rg.gain.setTargetAtTime(a * 0.45, t0 + 0.2, 0.4); }
      rg.gain.setTargetAtTime(0, END - 0.6, 0.15); mg.gain.setTargetAtTime(0, END - 0.6, 0.15);
    }

    // 11. the score: almost nothing — a low swell under the wait for the thunder, silence just before it,
    //     a quiet chord under the closing line
    const pad = (t0, t1, notes, vol) => { for (const f of notes) S.tone(t0, t1 - t0, f, vol, 0, mus, 'sine', (t1 - t0) * 0.45, (t1 - t0) * 0.35); };
    pad(SND.cuts[4] + 0.6, tT - 4.2, [55, 82.4], 0.05);
    pad(tT - 5.2, tT - 0.45, [58.3, 87.3, 116.5], 0.05);
    for (const f of [110, 164.8, 220, 277.2]) S.tone(T.lineA[0] - 0.3, 6.8, f, 0.03, 0, mus, 'sine', 1.4, 2.6);
  }
}
