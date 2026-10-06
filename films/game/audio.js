/* =====================================================================
   SOUNDTRACK — "POV: This video is a game. Don't die."
   Restrained: the sound effects lead, the music stays underneath.
     ambience   the facility's hum and air; it drops when the system
                notices you, nearly vanishes when he looks at the frame,
                turns hollow in the void, calm at the end
     interface  soft clean game tones (boot, PLAYER DETECTED, the hearts,
                timer ticks, the roulette's ticks, the hold's rising hum);
                the system's tones are lower and colder
     events     the glass touch, doors, the alarm, the steam blast, the
                drone, the membrane thump of his palm on your screen, the
                crack and the shards, the reverse of RESET—, the silence
                and the small confirmation of RESET CANCELLED
     voices     no voice: soft dialogue blips under each subtitle, breath
     music      curious → tense → almost nothing → rising → silence → a
                quiet warm chord for "Come back."
   ===================================================================== */

class GmAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  fingerprintData() { return [GM, GF, GM_SAY, GM_SPIN, GM_TARGETS]; }

  _kit(ctx, seed) {
    const S = new SoundKit(ctx, seed);
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.004)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.004), Math.max(0.004, d / 4)); };
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null, f1 = null) => {
      if (vol <= 0.0005) return null;
      const o = ctx.createOscillator(), g = ctx.createGain(), r = release || dur * 0.3; o.type = type; o.frequency.setValueAtTime(f, t);
      if (f1) o.frequency.linearRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.max(0.004, attack)); g.gain.setValueAtTime(vol, t + Math.max(attack, dur - r)); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + dur + 0.05); return o;
    };
    // a decaying tone (bells, plucks, glass)
    S.ping = (t, f, vol, dec, dest, pan = 0, type = 'sine') => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.setTargetAtTime(0, t + 0.004, dec / 3);
      o.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + dec * 1.6 + 0.05);
    };
    // a filtered noise burst
    S.burst = (t, dur, f, q, vol, dest, type = 'bandpass', noise = 'white', pan = 0, a = 0.004, f1 = null) => {
      const n = S.noise(noise, t, t + dur + 0.05), b = S.filter(type, f, q), g = ctx.createGain();
      if (f1) { b.frequency.setValueAtTime(f, t); b.frequency.linearRampToValueAtTime(f1, t + dur); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setTargetAtTime(0, t + a, Math.max(0.005, (dur - a) / 3.5));
      n.connect(b); b.connect(g); g.connect(S.panned(dest, pan));
    };
    S.thud = (t, f, vol, dec, dest) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f * 1.8, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.setTargetAtTime(0, t + 0.005, dec / 3); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dec * 1.6 + 0.05); };
    S.step = (t, vol, pan, dest) => { S.burst(t, 0.07, 160, 0.9, vol, dest, 'lowpass', 'pink', pan); S.burst(t + 0.005, 0.03, 2400, 1.2, vol * 0.25, dest, 'bandpass', 'white', pan); };
    S.breath = (t, dur, inhale, vol, dest, pan = 0) => {
      const n = S.noise('pink', t, t + dur + 0.1), bp = S.filter('bandpass', inhale ? 1200 : 700, 0.9), g = ctx.createGain();
      if (inhale) { bp.frequency.setValueAtTime(850, t); bp.frequency.linearRampToValueAtTime(1500, t + dur); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * (inhale ? 0.6 : 0.3)); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan));
    };
    return S;
  }

  _build(ctx) {
    const S = this._kit(ctx, 9), T = (t) => t;
    const out = ctx.createGain(); out.gain.value = 1; out.connect(ctx.destination);
    const rev = S.reverb(1.6), revG = ctx.createGain(); revG.gain.value = 0.32; rev.connect(revG); revG.connect(out);
    const bus = (g, r = 0) => { const b = ctx.createGain(); b.gain.value = g; b.connect(out); if (r) { const s = ctx.createGain(); s.gain.value = r; b.connect(s); s.connect(rev); } return b; };
    const amb = bus(1.0, 0.1), ui = bus(0.55, 0.2), sys = bus(0.6, 0.35), fx = bus(1.0, 0.25), vo = bus(0.5, 0.15), mus = bus(0.42, 0.4);
    void T;
    const E = GM;

    /* ---------- ambience: hum, air, distant machinery; automated ---------- */
    const ambG = ctx.createGain(); ambG.connect(amb);
    const lvl = [[0, 0], [0.35, 1], [GM.sys.flicker, 1], [GM.sys.flicker + 0.4, 0.3], [GM.edge.right, 0.3], [GM.edge.right + 0.3, 0.12], [GM.drone.drop, 0.12], [GM.drone.drop + 0.5, 0.7],
      [GM.reset.hit, 0.7], [GM.reset.hit + 0.1, 0.0], [GM.end.cut, 0], [GM.end.cut + 0.05, 0.45], [GM.end.black, 0.45], [GM.end.black + 0.02, 0]];
    ambG.gain.setValueAtTime(0, 0); for (const [t, v] of lvl) ambG.gain.linearRampToValueAtTime(v, t);
    const air = S.noise('brown', 0, 53), airF = S.filter('lowpass', 420, 0.7), airG = ctx.createGain(); airG.gain.value = 0.22; air.connect(airF); airF.connect(airG); airG.connect(ambG);
    const hiss = S.noise('pink', 0, 53), hissF = S.filter('bandpass', 2600, 0.6), hissG = ctx.createGain(); hissG.gain.value = 0.012; hiss.connect(hissF); hissF.connect(hissG); hissG.connect(ambG);
    for (const [f, v] of [[55, 0.05], [110, 0.025], [165, 0.008], [220, 0.006]]) { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = v; o.connect(g); g.connect(ambG); o.start(0); o.stop(53); }
    for (const t of [5.2, 9.8, 14.1, 19.0, 24.3, 26.9]) { S.burst(t, 0.5, 300, 2, 0.05, ambG, 'bandpass', 'pink', 0.4 * Math.sin(t)); S.thud(t + 0.02, 70, 0.04, 0.4, ambG); }
    // the core hall hums a little higher; the void is hollow; the end is a quiet room
    const core = ctx.createOscillator(), coreG = ctx.createGain(); core.frequency.value = 98; coreG.gain.setValueAtTime(0, 0); coreG.gain.setValueAtTime(0, GM.hold.open[0]); coreG.gain.linearRampToValueAtTime(0.03, GM.hold.open[1] + 0.5); core.connect(coreG); coreG.connect(ambG); core.start(0); core.stop(53);
    const vd = S.noise('pink', GM.reset.shatter[0], GM.reach.cancelled + 0.5), vdF = S.filter('bandpass', 380, 3), vdG = ctx.createGain();
    vdG.gain.setValueAtTime(0, GM.reset.shatter[0]); vdG.gain.linearRampToValueAtTime(0.09, GM.reset.shatter[1]); vdG.gain.setValueAtTime(0.09, GM.reach.target[0]); vdG.gain.linearRampToValueAtTime(0.03, GM.reach.contact); vdG.gain.linearRampToValueAtTime(0, GM.reach.override);
    vd.connect(vdF); vdF.connect(vdG); vdG.connect(fx);
    S.tone(GM.reset.shatter[0], GM.reach.override - GM.reset.shatter[0], 69, 0.06, 0, fx, 'sine', 0.6, 0.4);

    /* ---------- the game interface ---------- */
    S.tone(0.0, 0.42, 180, 0.08, 0, ui, 'triangle', 0.01, 0.15, 900); S.burst(0.0, 0.35, 1800, 0.7, 0.05, ui, 'bandpass', 'white', 0, 0.01, 5000);
    S.ping(GM.detected, 880, 0.12, 0.5, ui); S.ping(GM.detected + 0.09, 1318, 0.1, 0.7, ui);
    [0, 1, 2].forEach((i) => S.ping(GM.hearts + i * 0.07, [1046, 1174, 1396][i], 0.06, 0.35, ui, (i - 1) * 0.2));
    S.thud(GM.hook.dont[0], 48, 0.35, 0.9, fx); S.burst(GM.hook.dont[0], 0.7, 900, 0.5, 0.05, fx, 'lowpass', 'pink');
    S.ping(GM.touch.prompt, 1568, 0.05, 0.4, ui);
    for (let t = GM.touch.prompt + 0.375; t < GM.touch.contact - 0.05; t += 0.375) S.ping(t, 2093, 0.018, 0.12, ui);   // a soft heartbeat-like tick while you hold still
    // the choice
    S.ping(GM.choice.ui, 784, 0.09, 0.3, ui, 0, 'triangle'); S.ping(GM.choice.ui + 0.07, 1175, 0.07, 0.4, ui);
    GM.choice.n.forEach((t, i) => { S.ping(t, [1318, 1318, 1760][i], 0.1, 0.18, ui); S.burst(t, 0.04, 4000, 1, 0.03, ui); });
    for (let t = GM.choice.n[0] + 0.4; t < GM.choice.zero; t += 0.8) S.ping(t, 2637, 0.025, 0.06, ui);
    S.burst(GM.choice.zero, 0.5, 600, 0.6, 0.12, fx, 'bandpass', 'pink', 0.3, 0.05, 3200);           // the swing right
    S.ping(GM.choice.result[0], 1046, 0.07, 0.4, ui, 0.3); S.ping(GM.choice.result[0] + 0.08, 1568, 0.07, 0.5, ui, 0.3);
    S.tone(GM.choice.result[0] + 0.25, 0.35, 196, 0.05, -0.3, ui, 'square', 0.01, 0.15);                // the −1, low and quiet
    // the hold: a rising hum, a tick at each step, a completion chime
    const H = GM.hold, hum = ctx.createOscillator(), hum2 = ctx.createOscillator(), humF = S.filter('lowpass', 400, 4), humG = ctx.createGain();
    hum.type = 'sawtooth'; hum2.type = 'sine'; hum.frequency.setValueAtTime(110, H.start); hum.frequency.linearRampToValueAtTime(220, H.steps[4]); hum2.frequency.setValueAtTime(220, H.start); hum2.frequency.linearRampToValueAtTime(440, H.steps[4]);
    humF.frequency.setValueAtTime(300, H.start); humF.frequency.linearRampToValueAtTime(2400, H.steps[4]);
    humG.gain.setValueAtTime(0, 0); humG.gain.setValueAtTime(0, H.start); humG.gain.linearRampToValueAtTime(0.05, H.start + 0.3); humG.gain.linearRampToValueAtTime(0.09, H.steps[4]); humG.gain.linearRampToValueAtTime(0, H.steps[4] + 0.25);
    hum.connect(humF); hum2.connect(humF); humF.connect(humG); humG.connect(ui); hum.start(H.start); hum2.start(H.start); hum.stop(H.steps[4] + 0.4); hum2.stop(H.steps[4] + 0.4);
    S.ping(H.ui, 1568, 0.05, 0.4, ui);
    H.steps.forEach((t, i) => S.ping(t, 880 * Math.pow(2, i / 5), 0.06, 0.15, ui));
    [1046, 1318, 1568, 2093].forEach((f, i) => S.ping(H.steps[4] + i * 0.05, f, 0.06, 0.6, ui));
    // the roulette: a clean tick per item, a ding where it lands
    for (const [t] of GM_SPIN) if (t < GM.roul.land) { S.burst(t, 0.03, 3200, 2, 0.06, ui); S.ping(t, 1760, 0.025, 0.05, ui); }
    S.ping(GM.roul.ui, 1175, 0.07, 0.3, ui); S.ping(GM.roul.land, 1568, 0.12, 0.8, ui); S.ping(GM.roul.land + 0.04, 2349, 0.07, 0.9, ui);
    S.ping(GM.roul.remember[0] + 0.05, 784, 0.05, 0.6, ui);
    // the item table
    S.ping(GM.drone.table[0], 1046, 0.06, 0.4, ui); for (let i = 0; i < 4; i++) S.ping(GM.drone.table[0] + 0.15 + i * 0.18, 1568, 0.025, 0.1, ui);
    // the final touch and the score
    S.ping(GM.reach.target[0], 1568, 0.04, 0.4, ui);
    S.ping(GM.end.score, 784, 0.05, 0.8, ui); S.ping(GM.end.score + 0.06, 1175, 0.04, 0.9, ui); S.ping(GM.end.item, 988, 0.04, 0.8, ui);

    /* ---------- the system: lower, colder ---------- */
    const sysTone = (t, f, dur = 0.5) => { S.tone(t, dur, f, 0.1, 0, sys, 'square', 0.005, dur * 0.6); S.tone(t, dur, f * 0.5, 0.08, 0, sys, 'sine', 0.005, dur * 0.6); };
    sysTone(GM.sys.input, 392, 0.45); sysTone(GM.sys.observer, 330, 0.6); S.tone(GM.sys.flicker, 3.0, 41, 0.12, 0, sys, 'sine', 0.3, 1.2);
    for (let f = 0; f < 42; f++) if ([0, 1, 4, 5, 9, 15, 16, 24].includes(f)) S.burst(GM.sys.flicker + f / 30, 0.04, 120, 3, 0.08, fx, 'bandpass', 'white');
    [GM.reset.n5, GM.reset.n4, GM.reset.n3, GM.reset.hit, GM.reach.n1].forEach((t, i) => sysTone(t, [262, 247, 233, 220, 196][i], 0.35));
    sysTone(GM.reach.override, 523, 0.25); sysTone(GM.reach.override + 0.18, 392, 0.4);

    /* ---------- events ---------- */
    // the glass touch: a glassy tone, a soft low swell, a shimmer
    const c0 = GM.touch.contact;
    [[1244, 0.16, 1.6], [1866, 0.08, 1.2], [2797, 0.04, 0.9], [622, 0.06, 1.8]].forEach(([f, v, d]) => S.ping(c0, f, v, d, fx));
    S.tone(c0, 1.2, 80, 0.12, 0, fx, 'sine', 0.05, 0.9); S.burst(c0, 1.4, 3000, 1.5, 0.05, fx, 'bandpass', 'white', 0, 0.02, 9000);
    for (let i = 0; i < 14; i++) S.ping(c0 + 0.05 + i * 0.045 + hash1(i) * 0.03, 3000 + hash1(i + 9) * 3000, 0.012, 0.15, fx, hash1(i + 3) - 0.5);
    // doors: a pneumatic hiss and a clunk
    const door = (t, dur, pan, big = 1) => { S.burst(t, dur, 1600, 0.5, 0.07 * big, fx, 'bandpass', 'white', pan, 0.03, 700); S.thud(t + dur * 0.9, 90, 0.12 * big, 0.25, fx); S.burst(t + dur * 0.9, 0.08, 900, 1, 0.06 * big, fx, 'bandpass', 'pink', pan); };
    door(GM.tech.door - 0.05, 0.35, 0.3); door(GM.tech.enter[0] + 1.2, 0.35, 0.3, 0.6);
    door(GM.doors[0], 0.5, -0.4); door(GM.doors[0] + 0.03, 0.5, 0.4);
    // the glass wall lifts: a motor whine and a slam
    S.tone(GM.glass[0], GM.glass[1] - GM.glass[0], 140, 0.06, 0, fx, 'sawtooth', 0.05, 0.1, 260); S.thud(GM.glass[1], 70, 0.25, 0.4, fx); S.burst(GM.glass[1], 0.15, 1200, 1, 0.06, fx);
    // steps (his, hers)
    const steps = (t0, t1, rate, vol, pan) => { for (let t = t0; t < t1; t += rate) S.step(t + hash1(Math.floor(t * 100)) * 0.02, vol, pan, fx); };
    steps(GM.touch.step[0] + 0.1, GM.touch.step[1], 0.5, 0.05, 0); steps(GM.tech.enter[0], GM.tech.enter[1], 0.48, 0.035, 0.25);
    steps(12.45, 13.35, 0.3, 0.06, 0); steps(12.3, 13.4, 0.28, 0.05, 0.5); steps(GM.choice.zero, GM.hold.arrive + 0.1, 0.26, 0.07, 0.1);
    steps(21.95, 22.8, 0.28, 0.05, 0.2); steps(27.6, 28.25, 0.45, 0.04, 0); steps(GM.reset.run, 38.55, 0.25, 0.09, 0);
    // the alarm: a slow two-tone whoop, under reverb
    for (let t = GM.alarm; t < GM.hold.open[0] - 0.2; t += 1.1) { const v = t < 13 ? 0.07 : 0.045; S.tone(t, 0.55, 520, v, -0.2, fx, 'square', 0.02, 0.1, 700); S.tone(t + 0.55, 0.5, 700, v * 0.8, 0.2, fx, 'square', 0.02, 0.1, 520); }
    for (let t = GM.reset.n5; t < GM.reset.hit; t += 1.1) { S.tone(t, 0.55, 440, 0.035, -0.2, fx, 'square', 0.02, 0.1, 600); S.tone(t + 0.55, 0.5, 600, 0.03, 0.2, fx, 'square', 0.02, 0.1, 440); }
    S.thud(GM.alarm, 45, 0.3, 0.8, fx);
    // the left route: steam, sparks, a thump
    const b0 = GM.choice.blast;
    S.burst(b0, 1.8, 3500, 0.4, 0.28, fx, 'highpass', 'white', -0.6, 0.02); S.burst(b0, 1.2, 600, 0.5, 0.18, fx, 'bandpass', 'pink', -0.5);
    S.thud(b0, 55, 0.4, 0.6, fx); for (let i = 0; i < 18; i++) S.burst(b0 + hash1(i) * 0.6, 0.02, 4000 + hash1(i + 4) * 4000, 3, 0.04, fx, 'bandpass', 'white', -0.7);
    // the blast door: unlock clunk, hydraulic lift
    S.thud(GM.hold.open[0], 60, 0.45, 0.5, fx); S.burst(GM.hold.open[0], 0.12, 900, 1, 0.1, fx);
    S.burst(GM.hold.open[0] + 0.05, 0.7, 500, 0.6, 0.12, fx, 'bandpass', 'brown', 0, 0.1, 300); S.burst(GM.hold.open[1] - 0.05, 0.4, 2400, 0.5, 0.06, fx, 'bandpass', 'white');
    // the case lid
    S.burst(GM.roul.ui - 0.15, 0.15, 1400, 1, 0.08, fx); S.thud(GM.roul.ui - 0.1, 140, 0.08, 0.2, fx);
    // the drone: servo drop, rotors, scan beeps, charge, the shot
    const D = GM.drone, rot = S.noise('pink', D.drop - 0.1, GM.reset.n5 + 0.8), rotF = S.filter('bandpass', 190, 4), rotG = ctx.createGain(), lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 38; lfoG.gain.value = 0.03; lfo.connect(lfoG); lfoG.connect(rotG.gain); lfo.start(D.drop); lfo.stop(GM.reset.n5 + 0.8);
    rotG.gain.setValueAtTime(0, D.drop - 0.1); rotG.gain.linearRampToValueAtTime(0.09, D.drop + 0.6); rotG.gain.setValueAtTime(0.09, GM.reset.n5); rotG.gain.linearRampToValueAtTime(0, GM.reset.n5 + 0.8);
    rot.connect(rotF); rotF.connect(rotG); rotG.connect(fx);
    S.tone(D.drop, 0.8, 900, 0.04, 0, fx, 'sawtooth', 0.05, 0.3, 300);
    for (let t = D.drop + 0.9; t < D.charge; t += 0.42) S.ping(t, 1975, 0.03, 0.08, fx, 0.2);
    S.tone(D.charge, D.fire - D.charge, 300, 0.08, 0, fx, 'sine', 0.3, 0.05, 2400); S.burst(D.charge, D.fire - D.charge, 800, 1, 0.06, fx, 'bandpass', 'white', 0, 0.8, 5000);
    S.thud(D.fire, 80, 0.5, 0.4, fx); S.burst(D.fire, 0.25, 2500, 0.6, 0.25, fx, 'bandpass', 'white', 0, 0.005, 400); S.burst(D.fire + 0.14, 0.6, 800, 0.4, 0.2, fx, 'lowpass', 'pink');
    // his palm on your screen: a deep membrane thump that wobbles
    const p0 = GM.reset.press;
    S.thud(p0, 38, 0.7, 1.2, fx); S.tone(p0, 1.8, 55, 0.18, 0, fx, 'sine', 0.01, 1.4, 42);
    const mem = S.noise('pink', p0, p0 + 2), memF = S.filter('bandpass', 140, 2), memG = ctx.createGain(), tr = ctx.createOscillator(), trG = ctx.createGain();
    tr.frequency.value = 6.5; trG.gain.value = 0.06; tr.connect(trG); trG.connect(memG.gain); tr.start(p0); tr.stop(p0 + 2);
    memG.gain.setValueAtTime(0, p0); memG.gain.linearRampToValueAtTime(0.12, p0 + 0.05); memG.gain.linearRampToValueAtTime(0, p0 + 1.9);
    mem.connect(memF); memF.connect(memG); memG.connect(fx);
    S.ping(p0, 410, 0.06, 1.0, fx); S.ping(p0, 617, 0.03, 0.8, fx);
    // the wind-up and the crack: a sharp glass hit, bass, the crack running, shards falling
    S.burst(GM.reset.wind, 0.35, 700, 0.6, 0.05, fx, 'bandpass', 'pink', 0, 0.2, 1400);
    const h0 = GM.reset.hit;
    S.thud(h0, 42, 0.9, 0.9, fx); S.burst(h0, 0.35, 4500, 0.5, 0.45, fx, 'highpass', 'white', 0, 0.002);
    [2617, 3520, 4186, 5274, 6271].forEach((f, i) => S.ping(h0 + i * 0.004, f, 0.06, 0.9 - i * 0.1, fx, (i - 2) * 0.2));
    for (let i = 0; i < 40; i++) { const t = h0 + 0.02 + Math.pow(hash1(i * 3), 1.6) * 0.5; S.burst(t, 0.012, 3000 + hash1(i) * 5000, 4, 0.05, fx, 'bandpass', 'white', hash1(i + 1) - 0.5); }
    for (let i = 0; i < 60; i++) { const t = GM.reset.shatter[0] + Math.pow(hash1(i * 7 + 1), 1.3) * 1.3; S.ping(t, 2400 + hash1(i * 5) * 5200, 0.03 * (1 - (t - GM.reset.shatter[0]) / 1.6), 0.25, fx, hash1(i + 11) * 1.4 - 0.7); }
    // the contact: a tiny bright tink, a breath of air
    const k0 = GM.reach.contact; S.ping(k0, 3136, 0.08, 0.9, fx); S.ping(k0, 4699, 0.04, 0.6, fx); S.tone(k0, 0.9, 98, 0.08, 0, fx, 'sine', 0.05, 0.7);
    // RESET—: a reverse swell that stops dead, digital stutter; then silence; then the small confirmation
    const g0 = GM.reach.glitch[0];
    const rs = S.noise('white', g0 - 0.6, g0 + 0.02), rsF = S.filter('bandpass', 900, 0.7), rsG = ctx.createGain();
    rsF.frequency.setValueAtTime(400, g0 - 0.6); rsF.frequency.linearRampToValueAtTime(5000, g0); rsG.gain.setValueAtTime(0, g0 - 0.6); rsG.gain.linearRampToValueAtTime(0.18, g0 - 0.01); rsG.gain.linearRampToValueAtTime(0, g0);
    rs.connect(rsF); rsF.connect(rsG); rsG.connect(fx);
    for (let i = 0; i < 16; i++) { const t = g0 + 0.25 + i * 0.022; S.tone(t, 0.016, 200 + 900 * hash1(i), 0.06, 0, fx, 'square', 0.002, 0.004); }
    S.tone(g0 + 0.25, GM.reach.override - g0 - 0.25, 1200, 0.03, 0, fx, 'sawtooth', 0.01, 0.05, 120);
    S.ping(GM.reach.cancelled, 1046, 0.08, 0.6, ui); S.ping(GM.reach.cancelled + 0.1, 1318, 0.08, 0.7, ui); S.ping(GM.reach.cancelled + 0.2, 1568, 0.06, 0.9, ui);

    /* ---------- breath and dialogue blips ---------- */
    S.breath(0.4, 0.5, true, 0.05, vo); S.breath(GM.touch.contact + 0.05, 0.45, true, 0.08, vo); S.breath(GM.alarm + 0.1, 0.4, true, 0.06, vo);
    S.breath(GM.sys.knows[0] - 0.5, 0.45, true, 0.04, vo); S.breath(GM.edge.what[0] - 0.4, 0.35, true, 0.04, vo); S.breath(GM.reset.hand[1], 0.4, true, 0.06, vo);
    S.breath(GM.reach.cancelled + 0.1, 1.0, false, 0.09, vo); S.breath(GM.end.come[0] - 0.4, 0.35, true, 0.03, vo);
    for (const [who, text, [a, b], q] of GM_SAY) {
      const n = text.replace(/[^A-Za-z]/g, '').length, dur = Math.min(b - a - 0.12, 0.075 * n + 0.18), base = who === 'T' ? 330 : 196, vol = q ? 0.025 : 0.045;
      for (let t = a + 0.02, i = 0; t < a + dur; t += 0.075, i++) { const f = base * Math.pow(2, (Math.floor(hash1(i * 13 + n) * 5) - 2) / 12); const o = S.tone(t, 0.05, f, vol, who === 'T' ? 0.2 : 0, vo, 'triangle', 0.004, 0.03); void o; }
    }

    /* ---------- music ---------- */
    const note = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // curious: a soft plucked figure in D minor
    const fig = [62, 65, 69, 72, 69, 65];
    for (let t = 0.6, i = 0; t < GM.alarm - 0.2; t += 0.5, i++) S.ping(t, note(fig[i % 6]), 0.03, 0.9, mus, (i % 2 ? 0.25 : -0.25), 'triangle');
    S.tone(0.4, GM.alarm - 0.4, note(38), 0.03, 0, mus, 'sine', 1.5, 1.0);
    // tense: a low pulse with the alarm, through the hold and the roulette
    for (let t = GM.alarm + 0.2, i = 0; t < GM.sys.flicker; t += 0.25, i++) { const m = [38, 38, 50, 38, 41, 38, 50, 43][i % 8]; S.ping(t, note(m), 0.05, 0.22, mus, 0, 'sawtooth'); }
    S.tone(GM.alarm, GM.sys.flicker - GM.alarm, note(50), 0.018, 0, mus, 'sine', 1.0, 0.6);
    // almost nothing while the system watches; a single low note
    S.tone(GM.sys.flicker + 0.3, GM.drone.drop - GM.sys.flicker, note(33), 0.03, 0, mus, 'sine', 1.0, 0.8);
    // rising: the pulse returns, faster, from the drone to the final touch
    for (let t = GM.drone.drop + 0.4, i = 0; t < GM.reach.target[0]; i++) { const k = (t - GM.drone.drop) / (GM.reach.target[0] - GM.drone.drop); S.ping(t, note([38, 38, 45, 38, 41, 38, 48, 44][i % 8]), 0.035 + 0.04 * k, 0.18, mus, 0, 'sawtooth'); t += 0.25 - 0.1 * k; }
    S.tone(GM.reset.n5, GM.reach.target[0] - GM.reset.n5, note(62), 0.025, 0, mus, 'sawtooth', 2.0, 0.3, note(69));
    // a quiet warm chord for "Come back."
    for (const m of [50, 57, 62, 66, 64]) S.tone(GM.end.cut + 0.05, GM.end.black - GM.end.cut - 0.05, note(m), 0.022, (m % 3 - 1) * 0.3, mus, 'sine', 0.8, 0.6);
  }

  async renderOffline() {
    const buf = await super.renderOffline(), sr = buf.sampleRate;
    // master: compressor and limiter, a soft ceiling, exact silence after the cut
    const n = buf.length, mctx = new OfflineAudioContext(2, n, sr), src = mctx.createBufferSource(); src.buffer = buf;
    const comp = mctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 2.5; comp.attack.value = 0.008; comp.release.value = 0.2;
    const lim = mctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
    const g = mctx.createGain(); g.gain.value = 1.6;
    src.connect(g); g.connect(comp); comp.connect(lim); lim.connect(mctx.destination); src.start(0);
    const out = await mctx.startRendering();
    for (let c = 0; c < 2; c++) {
      const o = out.getChannelData(c);
      for (let i = 0; i < n; i++) {
        const t = i / sr, x = o[i], ax = Math.abs(x);
        if (t >= GM.end.black) { o[i] = 0; continue; }
        if (t > GM.end.black - 0.004) o[i] *= (GM.end.black - t) / 0.004;
        if (ax > 0.6) o[i] = Math.sign(x) * (0.6 + 0.22 * Math.tanh((ax - 0.6) / 0.22));
      }
    }
    return out;
  }
}
