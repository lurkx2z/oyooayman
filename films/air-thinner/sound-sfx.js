/* =====================================================================
   SOUND · SFX — the events, at their story moments (each heard once: the clock only runs forward). Up top every sound
   is as loud as the air lets it be (atLoud: −6 dB at half the air, −23 dB by the time the hot tubs boil; things close
   to the camera keep a little more of it, ^0.5) and duller as it thins. Under the sea the air doesn't come into it:
   the regulators, the bubbles, the fins, the whitetip going by are as loud at 3 PM as at noon.
     every step   a low pressure push (the film's clock), muffled under water
     the deck     a boy's cannonball (the title); ears popping; the balloon's rubber stretching; the bridge's alarm
                  at 10:15; crisp packets crinkling; the balloon's bang; the drinks fizzing over; feet on the stairs,
                  gasps, the old man and his wife; the ship's PA calling the doctor; the dive shop's tanks and a valve
                  cracked open; down the stairs; the girl crying; the engines choking under the funnel; the blackout
     the marina   your breathing (6,400 m up, working), clumsy hands on buckles, the regulators tried in air, the roll
     under        the plunge, two regulators breathing (yours slow, hers quick), the tanks knocking on their line, the
                  school of fish turning, the whitetip's passes, her letting go, the fins, the catch; the hull groaning
     afternoon    a watch ticking on a still wrist; the oxygen still hissing into a mask; the hot tubs, the pool, the sea
                  boiling, all of them thin and far
   ===================================================================== */

// ---- generators (mono arrays unless they return [L, R]) ------------------------------------------------------------
// something big going into water: the slap, the cavity's "bloop", the spray, then the drops falling back
function atSplash(fx, size = 1) {
  const sr = fx.sr, r = fx.r, d = 1.8, n = Math.ceil(d * sr), L = new Float32Array(n), R = new Float32Array(n);
  { const z = fx.white(Math.round(0.03 * sr)); for (let i = 0; i < z.length; i++) z[i] *= Math.exp(-i / (0.006 * sr)); ATX.bq(z, 'hp', 350, 0.7, sr); ATX.mixIn(L, R, z, 0, 0.9 * size, 0); }
  { const y = new Float32Array(Math.round(0.35 * sr)); let ph = 0; for (let i = 0; i < y.length; i++) { const t = i / sr, f = 160 * Math.exp(-t / 0.12) + 70; ph += 2 * Math.PI * f / sr; y[i] = Math.sin(ph) * Math.exp(-t / 0.08) * Math.min(1, t / 0.004); } ATX.mixIn(L, R, y, Math.round(0.02 * sr), 0.8 * size, 0); }
  for (const pn of [-0.4, 0.4]) { const z = fx.white(Math.round(0.9 * sr)); ATX.bq(z, 'lp', 5500, 0.7, sr); ATX.bq(z, 'hp', 300, 0.7, sr); for (let i = 0; i < z.length; i++) { const t = i / sr; z[i] *= Math.min(1, t / 0.02) * Math.exp(-t / (0.22 * size)); } ATX.mixIn(L, R, z, Math.round(0.01 * sr), 0.5 * size, pn); }
  const nd = Math.round(70 * size);
  for (let k = 0; k < nd; k++) {
    const t = 0.2 + Math.pow(r.next(), 1.6) * 1.3, m = Math.round(r.range(0.004, 0.014) * sr), z = fx.white(m);
    for (let i = 0; i < m; i++) z[i] *= Math.exp(-i / (m * 0.3)); ATX.bq(z, 'bp', r.range(1800, 5500), 1.2, sr);
    ATX.mixIn(L, R, z, Math.round(t * sr), r.range(0.15, 0.45) * Math.exp(-(t - 0.2) / 0.8), r.range(-0.8, 0.8));
    if (r.chance(0.3)) fx.bubble(L, R, Math.round((t + 0.003) * sr), r.range(900, 2600), r.range(0.004, 0.01), 0.12, r.range(-0.6, 0.6));
  }
  return [L, R];
}
// a pressure push (each step): a sub-bass swell and a dull rush of air under it
function atWhump(fx) {
  const sr = fx.sr, n = Math.ceil(1.2 * sr), y = new Float32Array(n), z = atNoise(fx, n, 'brown');
  ATX.bq(z, 'lp', 160, 0.7, sr); const zp = ATX.peak(z) || 1;
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / sr, f = 34 - 10 * Math.min(1, t / 0.8); ph += 2 * Math.PI * f / sr; const e = Math.min(1, t / 0.05) * Math.exp(-t / 0.35); y[i] = Math.sin(ph) * e + 0.3 * z[i] / zp * Math.min(1, t / 0.08) * Math.exp(-t / 0.3); }
  return y;
}
// the balloon's bang: a crack (the rubber tearing) and its echo off the ship's white walls
function atBang(fx) {
  const sr = fx.sr, n = Math.ceil(0.6 * sr), y = new Float32Array(n), r = fx.r;
  const one = (i0, a, lp) => { const m = Math.round(0.03 * sr), z = fx.white(m); for (let i = 0; i < m; i++) z[i] *= Math.exp(-i / (0.0025 * sr)); ATX.bq(z, 'hp', 500, 0.7, sr); if (lp) ATX.bq(z, 'lp', lp, 0.7, sr); for (let i = 0; i < m && i0 + i < n; i++) y[i0 + i] += z[i] * a; };
  one(0, 1, 0); ATX.strike(y, 0, Math.round(0.0008 * sr), 0.5, [[r.range(900, 1100), 0.012, 1], [r.range(2100, 2500), 0.008, 0.6], [95, 0.03, 0.8]], sr);
  one(Math.round(0.062 * sr), 0.28, 3500); one(Math.round(0.15 * sr), 0.12, 2500); one(Math.round(0.23 * sr), 0.06, 2000);
  return y;
}
// a glass fizzing over: dense tiny bubble bursts and the hiss of the foam (rate: bursts a second)
function atFizz(fx, d, rate = 1800) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), y = new Float32Array(n);
  for (let t = r.range(0, 0.002); t < d - 0.01; t += -Math.log(1 - r.next() * 0.999) / rate) {
    const i0 = Math.round(t * sr), len = Math.round(r.range(0.0006, 0.0025) * sr), a = Math.pow(r.next(), 2) * Math.min(1, t / 0.2, (d - t) / 0.2), f = r.range(3500, 11000);
    for (let i = 0; i < len && i0 + i < n; i++) y[i0 + i] += a * Math.sin(2 * Math.PI * f * i / sr) * Math.exp(-i / (len * 0.35));
  }
  const h = fx.white(n); ATX.bq(h, 'hp', 4500, 0.7, sr); for (let i = 0; i < n; i++) y[i] += h[i] * 0.04 * Math.min(1, i / (0.3 * sr), (n - i) / (0.3 * sr));
  return y;
}
// a drop landing in a puddle on the bar: a rising "plip"
function atPlip(fx) {
  const sr = fx.sr, r = fx.r, n = Math.round(0.06 * sr), y = new Float32Array(n), f0 = r.range(900, 1500);
  let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * f0 * (1 + 1.4 * t / 0.04) / sr; y[i] = Math.sin(ph) * Math.exp(-t / 0.012) * Math.min(1, t / 0.0006); }
  return y;
}
// a two-tone chime (the ship's PA): o.f [f1, f2]
function atChime(fx, f = [659.3, 523.3]) {
  const sr = fx.sr, n = Math.ceil(2.4 * sr), y = new Float32Array(n);
  f.forEach((ff, k) => { const i0 = Math.round(k * 0.62 * sr); for (let i = 0; i + i0 < n; i++) { const t = i / sr, e = Math.min(1, t / 0.004) * Math.exp(-t / 0.55); y[i0 + i] += e * (Math.sin(2 * Math.PI * ff * t) + 0.3 * Math.sin(2 * Math.PI * ff * 2.01 * t) * Math.exp(-t / 0.2) + 0.12 * Math.sin(2 * Math.PI * ff * 3.98 * t) * Math.exp(-t / 0.1)); } });
  return y;
}
// a voice on the PA: a man's syllables, words you can't make out, through a horn speaker
function atPaVoice(fx, d) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), y = new Float32Array(n), V = Object.values(AT_VOWEL);
  for (let t = 0.05; t < d - 0.3;) {
    const ns = r.int(4, 9);
    for (let j = 0; j < ns && t < d - 0.3; j++) { const sd = r.range(0.1, 0.22), v = V[r.int(0, 3)], f0 = 118 * r.range(0.92, 1.12); const z = atVoice(fx, sd, { f0: (u) => f0 * (1 - 0.06 * u), formants: v, breath: 0.1, env: (u) => Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.3) }); for (let i = 0; i < z.length && t * sr + i < n; i++) y[Math.round(t * sr) + i] += z[i]; t += sd + r.range(0, 0.05); }
    t += r.range(0.25, 0.55);
  }
  ATX.bq(y, 'hp', 450, 0.9, sr); ATX.bq(y, 'lp', 3200, 0.9, sr); ATX.bq(y, 'peak', 1800, 1.2, sr, 6);
  const pk = ATX.peak(y) || 1; for (let i = 0; i < n; i++) y[i] = Math.tanh(2.2 * y[i] / pk) / Math.tanh(2.2);
  return y;
}
// high-pressure air: a valve cracked open (d s)
function atValveHiss(fx, d = 0.55) {
  const sr = fx.sr, n = Math.ceil((d + 0.1) * sr), y = fx.white(n);
  ATX.bq(y, 'hp', 2200, 0.7, sr); ATX.bq(y, 'peak', 6200, 1.5, sr, 6);
  for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= Math.min(1, t / 0.004) * (t < d ? 1 - 0.3 * t / d : Math.exp(-(t - d) / 0.025)); }
  return y;
}
// a plastic buckle snapping shut (click-clack)
function atBuckle(fx) {
  const sr = fx.sr, r = fx.r, y = fx.arr(0.12), md = () => [[r.range(2200, 2700), 0.008, 1], [r.range(3700, 4200), 0.006, 0.6], [r.range(5400, 6000), 0.004, 0.3]];
  ATX.strike(y, 0, Math.round(0.0002 * sr), 0.8, md(), sr); ATX.strike(y, Math.round(r.range(0.022, 0.035) * sr), Math.round(0.00025 * sr), 1, md(), sr);
  return y;
}
// a scuba regulator, in air or under water. inhale: the demand valve's tick and the hiss of air; exhale: under water
// a cloud of bubbles (Minnaert: bigger = lower) and the exhaust valve's flutter; in air just the flutter.
// o.d the breath's length (s), o.k pitch (a child's smaller lungs and bubbles: higher), o.air (above water)
function atRegIn(fx, o = {}) {
  const sr = fx.sr, d = o.d || 1.2, n = Math.ceil((d + 0.05) * sr), y = new Float32Array(n), z = fx.white(n), z2 = fx.white(n), k = o.k || 1;
  ATX.bq(z, 'bp', 2700 * k, 0.9, sr); ATX.bq(z2, 'bp', 5200 * k, 2.2, sr);
  ATX.strike(y, 0, Math.round(0.0002 * sr), 0.35, [[3100 * k, 0.006, 1], [5300 * k, 0.004, 0.5]], sr);   // the valve's tick
  const fl = fx.wander(11);
  for (let i = 0; i < n; i++) { const u = i / (d * sr), e = u > 1 ? 0 : Math.pow(Math.sin(Math.PI * Math.min(1, u / 0.85) * 0.5), 1.4) * (1 - Math.pow(Math.max(0, (u - 0.75) / 0.25), 2)); y[i] += (z[i] * 0.7 + z2[i] * 0.4) * e * (1 + 0.15 * fl(i / sr)); }
  return y;
}
function atRegOut(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = o.d || 1.4, k = o.k || 1, n = Math.ceil((d + 0.6) * sr), L = new Float32Array(n), R = new Float32Array(n);
  const fl = fx.white(n); ATX.bq(fl, 'lp', 900 * k, 0.7, sr); ATX.bq(fl, 'hp', 90, 0.7, sr);
  for (let i = 0; i < n; i++) { const t = i / sr, u = t / d, e = u > 1 ? 0 : Math.min(1, u / 0.1) * Math.pow(1 - u, 0.6); const v = fl[i] * e * (0.55 + 0.45 * Math.sin(2 * Math.PI * 34 * k * t)) * 0.8; L[i] += v; R[i] += v; }
  if (!o.air) {
    const nb = Math.round((o.many || 70) * d);
    for (let j = 0; j < nb; j++) {
      const t = Math.pow(r.next(), 1.3) * d * 1.15, big = r.chance(0.35), f = (big ? r.range(180, 480) : r.range(500, 1600)) * k, tau = big ? r.range(0.012, 0.03) : r.range(0.004, 0.012);
      fx.bubble(L, R, Math.round(t * sr), f, tau, (big ? 0.5 : 0.28) * Math.min(1, (d * 1.15 - t) / 0.3 + 0.2), (o.pan || 0) + r.range(-0.35, 0.35));
    }
  }
  return [L, R];
}
// a fin stroke through water: a soft low swish
function atFin(fx, d = 0.45) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = atNoise(fx, n, 'pink');
  ATX.bq(y, 'bp', 260, 0.9, sr); ATX.bq(y, 'lp', 900, 0.7, sr);
  for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(Math.sin(Math.PI * u), 2) * (1 + 0.6 * Math.sin(2 * Math.PI * 45 * i / sr) * Math.sin(Math.PI * u)); }
  return y;
}
// something big moving past in the water (the whitetip): a slow low swell of displaced water, swishing with its tail
function atPass(fx, d = 3) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = atNoise(fx, n, 'brown'), z = atNoise(fx, n, 'pink');
  ATX.bq(y, 'lp', 220, 0.7, sr); ATX.bq(z, 'bp', 420, 1.0, sr);
  const yp = ATX.peak(y) || 1, zp = ATX.peak(z) || 1;
  for (let i = 0; i < n; i++) { const t = i / sr, u = t / d, e = Math.pow(Math.sin(Math.PI * u), 2); y[i] = (y[i] / yp + 0.35 * z[i] / zp * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.3 * t))) * e; }
  return y;
}
// the bubble cloud of a body plunging in: hundreds of bubbles and the rush of water closing over you
function atPlunge(fx, d = 2.2) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), L = new Float32Array(n), R = new Float32Array(n), z = atNoise(fx, n, 'pink');
  ATX.bq(z, 'lp', 1600, 0.7, sr); ATX.bq(z, 'hp', 60, 0.7, sr); const zp = ATX.peak(z) || 1;
  for (let i = 0; i < n; i++) { const t = i / sr, e = Math.min(1, t / 0.02) * Math.exp(-t / 0.45); L[i] += z[i] / zp * e * 0.7; R[i] += z[i] / zp * e * 0.7; }
  for (let j = 0; j < 520; j++) { const t = Math.pow(r.next(), 2.2) * d * 0.9, f = Math.exp(r.range(Math.log(250), Math.log(3200))); fx.bubble(L, R, Math.round(t * sr), f, r.range(0.004, 0.02), 0.32 * Math.exp(-t / 0.7), r.range(-0.9, 0.9)); }
  return [L, R];
}
// water boiling at the surface: big bubbles bursting (the lower, the bigger), a hiss of steam, a rumble under it.
// rate: bursts a second at full boil; o.k(u) its build-up over the d s (u = 0…1); stereo, wide
function atBoil(fx, d, rate, o = {}) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), L = new Float32Array(n), R = new Float32Array(n), kf = o.k || (() => 1), w = o.width ?? 0.7;
  for (let t = r.range(0, 0.02); t < d - 0.05; t += -Math.log(1 - r.next() * 0.999) / (rate * Math.max(0.03, kf(t / d)))) {
    const kk = kf(t / d); if (kk < 0.02) continue;
    const big = r.chance(0.4), f = big ? r.range(110, 380) : r.range(400, 1300);
    fx.bubble(L, R, Math.round(t * sr), f * (o.pitch || 1), big ? r.range(0.015, 0.04) : r.range(0.005, 0.014), (big ? 0.55 : 0.3) * r.range(0.5, 1) * kk, r.range(-w, w));
  }
  for (const [x, s] of [[L, 1], [R, 2]]) { const z = atNoise(fx, n, 'white'), b = atNoise(fx, n, 'brown'); ATX.bq(z, 'hp', 2500, 0.7, sr); ATX.bq(b, 'lp', 160, 0.7, sr); const bp = ATX.peak(b) || 1; for (let i = 0; i < n; i++) { const kk = kf(i / n); x[i] += (z[i] * 0.04 * (o.steam ?? 1) + b[i] / bp * 0.25 * (o.rumble ?? 1)) * kk; } }
  return [L, R];
}
// a diesel engine choking (the funnel at 11:08): sixteen cylinders labouring at 520 → 380 rpm, misfiring
function atChoke(fx, d) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), wv = fx.wander(0.5);
  const y = atEngine(fx, d, (t) => (520 - 140 * t / d) * (1 + 0.08 * wv(t)), { cyl: 16, lp: 420 });
  const ex = atNoise(fx, n, 'brown'); ATX.bq(ex, 'lp', 380, 0.7, sr); const ep = ATX.peak(ex) || 1, yp = ATX.peak(y) || 1;
  for (let i = 0; i < n; i++) y[i] = y[i] / yp * 0.6 + ex[i] / ep * 0.55 * (0.7 + 0.3 * wv(i / sr * 1.7));
  for (let t = r.range(0.2, 0.8); t < d - 0.4; t += r.range(0.45, 1.6)) {   // misfires: a cough, a black puff, a gap
    const i0 = Math.round(t * sr), gap = Math.round(r.range(0.08, 0.2) * sr);
    for (let i = 0; i < gap && i0 + i < n; i++) y[i0 + i] *= 0.25 + 0.75 * (i / gap);
    const m = Math.round(0.35 * sr), z = fx.white(m); ATX.bq(z, 'lp', 650, 0.7, sr);
    for (let i = 0; i < m && i0 + gap + i < n; i++) { const tt = i / sr; y[i0 + gap + i] += (z[i] * 2.2 + Math.sin(2 * Math.PI * 42 * tt) * 0.9) * Math.min(1, tt / 0.008) * Math.exp(-tt / 0.09); }
  }
  return y;
}
// the blackout: the breakers dropping out (heavy clacks), the deck speakers' pop, a last buzz
function atBreakers(fx) {
  const sr = fx.sr, r = fx.r, y = fx.arr(1.4);
  [0, 0.045, 0.13, 0.31].forEach((dt, k) => ATX.strike(y, Math.round(dt * sr), Math.round(0.0006 * sr), [1, 0.7, 0.55, 0.35][k], fx.metalModes(r.range(280, 360), 0.5).concat([[r.range(1500, 1900), 0.02, 0.4]]), sr));
  for (let i = 0; i < 0.5 * sr; i++) y[i] += 0.8 * Math.sin(2 * Math.PI * 48 * i / sr) * Math.exp(-i / (0.09 * sr)) * Math.min(1, i / (0.003 * sr));
  for (let i = 0; i < 0.09 * sr; i++) { const t = i / sr; y[Math.round(0.012 * sr) + i] += 0.25 * Math.sign(Math.sin(2 * Math.PI * 100 * t)) * Math.exp(-t / 0.03); }
  return y;
}
// a metal tank knocking on metal (in air) or on its line (under water: o.uw, duller)
function atTankKnock(fx, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.hit(fx.metalModes(r.range(330, 420), o.uw ? 0.35 : 1.1).concat([[r.range(1150, 1300), o.uw ? 0.04 : 0.15, 0.4]]), { width: o.uw ? 0.003 : 0.0012, amp: 1 });
  for (let i = 0; i < 0.15 * sr; i++) y[i] += 0.5 * Math.sin(2 * Math.PI * 85 * i / sr) * Math.exp(-i / (0.04 * sr)) * Math.min(1, i / (0.002 * sr));
  if (o.uw) ATX.bq(y, 'lp', 1400, 0.7, sr);
  return y;
}
// a child crying quietly: catching breaths and small voiced sobs (f0 Hz)
function atSob(fx, d, f0 = 360) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), y = new Float32Array(n);
  for (let t = r.range(0, 0.3); t < d - 0.8;) {
    for (let k = 0, nk = r.int(2, 4); k < nk; k++) { const z = fx.breath(0.11, { inhale: true, voice: 0.25, f0: f0 * 1.1 }); for (let i = 0; i < z.length && t * sr + i < n; i++) y[Math.round(t * sr) + i] += z[i] * 0.6; t += r.range(0.13, 0.18); }
    const sd = r.range(0.35, 0.6), z = atVoice(fx, sd, { f0: (u) => f0 * (1.05 - 0.2 * u) * (1 + 0.04 * Math.sin(2 * Math.PI * 7 * u * sd)), formants: AT_VOWEL.u.map(([f, q, a]) => [f * 1.3, q, a]), breath: 0.35, env: (u) => Math.min(1, u / 0.1) * Math.pow(1 - u, 1.2) });
    for (let i = 0; i < z.length && t * sr + i < n; i++) y[Math.round(t * sr) + i] += z[i] * 0.8;
    t += sd + r.range(0.6, 1.4);
  }
  return y;
}
// a watch ticking (a quartz second hand): n ticks, one a second
function atTicks(fx, nT) {
  const sr = fx.sr, y = fx.arr(nT + 0.1);
  for (let k = 0; k < nT; k++) ATX.strike(y, Math.round(k * sr), Math.round(0.00012 * sr), 1, [[4300, 0.003, 1], [6900, 0.002, 0.6], [2600, 0.004, 0.4]], sr);
  return y;
}
// a crisp packet swelling: sparse crackles of foil as it stretches
function atCrinkle(fx, d) { return fx.rustle(d, { density: 60, rub: 0.02, lo: 2200, hi: 10000, grain: 0.0025, env: (u) => 0.3 + 0.7 * Math.sin(Math.PI * u) }); }

atSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, F = atFilmAt, c = atC, E = ATE, END = AT.end, r = new RNG(CONFIG.seed + 4242);
  const air = atCurve((t) => ATP.air(atStoryAt(t))), loud = atCurve(atLoud);
  const room = K.verb('room', 1.0, { bright: 0.45, damp: 3.4, shape: 2.0, early: [[0.011, 0.5], [0.021, 0.35], [0.033, 0.25]], wet: 0.5 });
  const sea = K.verb('sea', 2.4, { bright: 0.25, damp: 2.0, shape: 1.6, seed: 41, wet: 0.5 });           // under water
  const out = K.verb('out', 0.9, { bright: 0.55, damp: 4.5, shape: 2.6, seed: 53, early: [[0.06, 0.3], [0.14, 0.15]], wet: 0.35 });   // the ship's walls
  const shotOf = (id) => AT_SHOTS.find((s) => s.id === id);
  const lpCopy = (x, f) => { if (f >= 16000) return x; const y = Float32Array.from(x); ATX.bq(y, 'lp', f, 0.7, sr); return y; };
  // up top: as loud as the air allows (close = keeps more of it), duller as it thins; the reverb of the ship's walls
  const deck = (x, t, vol, o = {}) => { const a = air(t), k = o.close ? 0.5 : 1; return K.put(lpCopy(x, Math.min(19000, 17000 * Math.pow(a, 0.6))), t, { vol: vol * Math.pow(loud(t), k), norm: true, pan: o.pan || 0, room: o.room || out, wet: o.wet ?? 0.5 }); };
  const deckLR = (LR, t, vol, o = {}) => { const a = air(t), k = o.close ? 0.5 : 1, f = Math.min(19000, 17000 * Math.pow(a, 0.6)), pk = ATX.peak(LR[0], LR[1]) || 1; return K.putLR(lpCopy(LR[0], f).map((v) => v / pk), lpCopy(LR[1], f).map((v) => v / pk), t, { vol: vol * Math.pow(loud(t), k), room: o.room || out, wet: o.wet ?? 0.4, stop: o.stop, fade: 0.04 }); };
  // under the sea: as loud as they are, a little dulled by the water, in the sea's long reverb
  const uw = (x, t, vol, o = {}) => K.put(lpCopy(x, o.lp || 4500), t, { vol, norm: true, pan: o.pan || 0, room: sea, wet: o.wet ?? 0.35, stop: o.stop, fade: 0.04 });
  const uwLR = (LR, t, vol, o = {}) => { const pk = ATX.peak(LR[0], LR[1]) || 1; return K.putLR(LR[0].map((v) => v / pk), LR[1].map((v) => v / pk), t, { vol, room: sea, wet: o.wet ?? 0.3, stop: o.stop, fade: 0.04 }); };
  const isUnder = (t) => AT_UNDER.has(atShotAt(t).mode);

  // ================================================================== every step on screen: a pressure push
  for (let nS = 1; nS < 420; nS++) { const t = atSeen(60 * nS); if (t == null) continue; const y = atWhump(fx); if (isUnder(t)) ATX.bq(y, 'lp', 120, 0.7, sr); K.put(y, t, { vol: isUnder(t) ? 0.2 : 0.24, norm: true }); }
  K.put(atWhump(fx), AT.tOn, { vol: 0.24, norm: true });

  // ================================================================== the title: a boy's cannonball into the pool
  { const t = F(-1.95); deckLR(atSplash(fx, 1.1), t, 0.45, { wet: 0.25 });
    for (const [dt, f0, p] of [[0.35, 520, -0.3], [0.55, 610, 0.25], [0.7, 450, 0.4]]) deck(atScream(fx, { f0, d: 0.7 }), t + dt, 0.18, { pan: p }); }

  // ================================================================== 10:10 your ears pop; her balloon stretching
  { const t = c('ears', 0) + 0.5, y = fx.arr(0.12); ATX.strike(y, 0, Math.round(0.0015 * sr), 1, [[340, 0.02, 1], [900, 0.01, 0.5], [2400, 0.004, 0.3]], sr); K.put(y, t, { vol: 0.25, norm: true });
    const sh = shotOf('E2'); for (let k = 0; k < 4; k++) { const tt = sh.t0 + 0.6 + k * 1.3 + r.range(0, 0.4); deck(fx.creak(r.range(0.35, 0.6), [[r.range(620, 700), 0.03, 1], [r.range(1250, 1350), 0.02, 0.5], [r.range(2000, 2200), 0.012, 0.25]], { rate: [10, 35] }), tt, 0.07, { close: true, pan: 0.1 }); } }

  // ================================================================== 10:15 the bridge's barometer alarm (through the glass)
  { const t0 = atSeen(atHMS(10, 15)), sh = shotOf('St1'); if (t0 != null) for (let t = t0 + 0.5; t < sh.t1 - 0.3; t += 1.4) for (let k = 0; k < 3; k++) { const y = fx.beep(2900, 0.1); ATX.bq(y, 'lp', 2600, 0.7, sr); deck(y, t + k * 0.2, 0.045, { pan: 0.2 }); } }

  // ================================================================== 10:29 everything sealed swelling; 10:30 the balloon bursts
  { const sh = shotOf('C2'); deck(atCrinkle(fx, sh.t1 - sh.t0), sh.t0, 0.1, { close: true });
    const y = fx.hit([[r.range(500, 600), 0.03, 1], [r.range(1300, 1500), 0.015, 0.5]], { width: 0.0012, amp: 1 }); deck(y, sh.t0 + 2.1, 0.09, { close: true, pan: -0.2 });   // the sun cream's cap
    const tp = F(E.balloonPop); deck(atBang(fx), tp, 0.95, { close: true, wet: 0.6 });
    deck(atVoice(fx, 0.35, { f0: (u) => 420 * (1 + 0.2 * Math.sin(Math.PI * u)), formants: AT_VOWEL.a.map(([f, q, a]) => [f * 1.3, q, a]), breath: 0.3, env: (u) => Math.min(1, u / 0.05) * Math.pow(1 - u, 1.2) }), tp + 0.18, 0.2, { close: true });
    deck(atSob(fx, 2.6, 380), tp + 1.0, 0.12, { close: true }); }

  // ================================================================== 10:35 the drinks foam over
  { const s1 = shotOf('F1'), s2 = shotOf('F2');
    for (let k = 0; k < 5; k++) deck(atFizz(fx, s1.t1 - s1.t0 + 0.1, 900), s1.t0, 0.06, { pan: -0.6 + 0.3 * k });
    deck(atFizz(fx, s2.t1 - s2.t0 + 0.1, 2400), s2.t0, 0.14, { close: true });
    for (let t = s1.t0 + 0.3; t < s2.t1 - 0.1; t += r.range(0.25, 0.7)) deck(atPlip(fx), t, 0.05, { close: true, pan: r.range(-0.5, 0.5) }); }

  // ================================================================== 10:44 a flight of stairs; the man by the pool; the PA
  { const sh = shotOf('Sr1');
    for (let t = sh.t0 + 0.2, k = 0; t < sh.t1; t += r.range(0.85, 1.1), k++) deck(fx.step({ weight: 0.7, s: 1.25, body: 92 }), t, 0.1, { room, wet: 0.6, pan: 0.2 });
    for (let t = sh.t0 + 0.1; t < sh.t1 - 0.6; t += r.range(1.0, 1.25)) { deck(fx.breath(0.55, { inhale: true, voice: 0.18, f0: 150 }), t, 0.13, { room, wet: 0.5, pan: 0.1 }); deck(fx.breath(0.45, { voice: 0.1, f0: 120 }), t + 0.6, 0.1, { room, wet: 0.5, pan: 0.1 }); }
    for (let t = sh.t0 + 0.6; t < sh.t1 - 0.6; t += r.range(1.3, 1.6)) deck(fx.breath(0.5, { inhale: true, voice: 0.2, f0: 230 }), t, 0.08, { room, wet: 0.6, pan: -0.3 }); }
  { const sh = shotOf('Sr2');
    for (let t = sh.t0 + 0.15; t < sh.t1 - 0.4; t += r.range(1.15, 1.45)) { deck(fx.breath(0.7, { inhale: true, voice: 0.3, f0: 105 }), t, 0.2, { close: true }); deck(fx.breath(0.4, { voice: 0.14, f0: 95 }), t + 0.72, 0.12, { close: true }); }
    deck(atCall(fx, { f0: 215, d: 0.8, up: 0.95, v1: 'e', v2: 'o' }), sh.t0 + 1.4, 0.16, { close: true, pan: 0.3 });
    deck(atCall(fx, { f0: 230, d: 0.9, up: 1.15, v1: 'a', v2: 'o' }), sh.t0 + 3.4, 0.18, { close: true, pan: 0.3 }); }
  { const sh = shotOf('Sr3'); deck(atChime(fx), sh.t0 + 0.25, 0.14, { wet: 0.7 }); deck(atPaVoice(fx, Math.min(3.2, sh.t1 - sh.t0 - 1.2)), sh.t0 + 1.35, 0.16, { wet: 0.75 }); }

  // ================================================================== 10:46 you; the dive shop: tanks, a valve cracked open
  { const sh = shotOf('K1'); for (let t = sh.t0 + 0.4; t < sh.t1 - 0.5; t += 2.2) { deck(fx.breath(0.8, { inhale: true, voice: 0.05, f0: 120 }), t, 0.1, { close: true }); deck(fx.breath(0.9, { voice: 0.03, f0: 110 }), t + 0.9, 0.07, { close: true }); } }
  { const sh = shotOf('K4'), dt = sh.t1 - sh.t0;
    deck(atTankKnock(fx), sh.t0 + 0.35, 0.3, { close: true, room, wet: 0.35, pan: -0.2 });
    deck(atValveHiss(fx, 0.5), sh.t0 + Math.min(1.5, dt * 0.45), 0.4, { close: true, room, wet: 0.3 });
    deck(atTankKnock(fx), sh.t0 + Math.min(2.6, dt - 0.5), 0.22, { close: true, room, wet: 0.35, pan: 0.2 }); }

  // ================================================================== 10:52 thirteen decks down; the girl; her hand
  { const sh = shotOf('D1'); for (let t = sh.t0 + 0.1, k = 0; t < sh.t1; t += 0.34, k++) deck(fx.step({ weight: 0.55 + 0.1 * (k % 2), s: 1.3, body: 96, scuff: k % 5 === 0 ? 0.3 : 0 }), t, 0.12, { room, wet: 0.6, pan: k % 2 ? 0.1 : -0.1 });
    for (let t = sh.t0 + 0.2; t < sh.t1 - 0.4; t += 0.95) { deck(fx.breath(0.42, { inhale: true, voice: 0.1, f0: 125 }), t, 0.12, { close: true, room, wet: 0.3 }); deck(fx.breath(0.4, { voice: 0.05, f0: 115 }), t + 0.47, 0.08, { close: true, room, wet: 0.3 }); } }
  { const sh = shotOf('D2'); deck(atSob(fx, sh.t1 - sh.t0 + 0.4, 360), sh.t0 + 0.2, 0.2, { close: true, room, wet: 0.45 }); }
  { const sh = shotOf('D3'); deck(fx.rustle(0.4, { density: 300, rub: 0.4, lo: 700, hi: 4000 }), sh.t0 + 0.9, 0.05, { close: true, room, wet: 0.3 });
    deck(fx.breath(0.35, { inhale: true, f0: 330, voice: 0.12 }), sh.t0 + 1.8, 0.08, { close: true, room, wet: 0.4 }); }

  // ================================================================== 11:08 the engines choke; 11:13 the power fails
  { const s1 = shotOf('N1'), s2 = shotOf('N2'), d1 = s1.t1 - s1.t0 + 0.1;
    const y = atChoke(fx, d1); deck(y, s1.t0, 0.75, { wet: 0.25 });
    const y2 = atChoke(fx, s2.t1 - s2.t0 + 0.1); ATX.bq(y2, 'lp', 300, 0.7, sr); deck(y2, s2.t0, 0.32, { wet: 0.2 });
    const tb = F(E.blackout); deck(atBreakers(fx), tb, 0.55, { wet: 0.5 }); }

  // ================================================================== 11:20 the marina: your breathing, clumsy hands
  { const s1 = shotOf('M1'), s2 = shotOf('M2'), s3 = shotOf('M3');
    for (let t = s1.t0 + 0.1; t < s3.t1 - 0.3; t += 1.05 + 0.1 * Math.sin(t)) {   // you, panting (bone conduction: you hear your own breath anyway)
      const pov = t >= s2.t0 && t < s2.t1, v = pov ? 0.32 : t < s2.t0 ? 0.14 : 0.1;
      K.put(fx.breath(0.48, { inhale: true, voice: 0.14, f0: 118 }), t, { vol: v, norm: true }); K.put(fx.breath(0.45, { voice: 0.08, f0: 108 }), t + 0.52, { vol: v * 0.75, norm: true });
    }
    deck(atTankKnock(fx), s1.t0 + 1.6, 0.25, { pan: 0.3 }); deck(atTankKnock(fx), s1.t0 + 4.0, 0.18, { pan: -0.2 });
    for (const dt of [1.3, 2.7]) deck(atBuckle(fx), s2.t0 + dt, 0.22, { close: true, pan: dt > 2 ? 0.2 : -0.2 });
    deck(fx.rustle(0.4, { density: 900, rub: 0.5, lo: 1200, hi: 7000, grain: 0.004, env: (u) => Math.sin(Math.PI * u) }), s2.t0 + 3.4, 0.12, { close: true });
    // her mask, the regulator's purge, her breaths through it in the thin air
    deck(fx.slap([[480, 0.02, 1], [1100, 0.012, 0.4]], { amp: 0.6, skin: 0.4, len: 0.2 }), s3.t0 + 0.4, 0.12, { close: true });
    deck(atValveHiss(fx, 0.35), s3.t0 + 1.4, 0.18, { close: true });
    for (let t = s3.t0 + 2.2; t < s3.t1 - 0.5; t += 1.35) { deck(atRegIn(fx, { d: 0.6, k: 1.15 }), t, 0.14, { close: true }); deck(atRegOut(fx, { d: 0.55, k: 1.2, air: true })[0], t + 0.65, 0.08, { close: true }); } }

  // ================================================================== the six tanks on their line; the roll; the plunge
  { const sh = shotOf('V1'); for (let t = sh.t0 + 0.4; t < sh.t1 - 0.2; t += r.range(0.6, 1.4)) uw(atTankKnock(fx, { uw: true }), t, r.range(0.05, 0.12), { pan: r.range(-0.4, 0.4), wet: 0.5 });
    uw(fx.creak(1.2, [[420, 0.03, 1], [870, 0.02, 0.5]], { rate: [20, 50] }), sh.t0 + 2.2, 0.05, { lp: 1500, wet: 0.5 }); }
  { const tr = F(E.roll); deckLR(atSplash(fx, 1.4), tr, 0.75, { close: true, wet: 0.2, stop: shotOf('V2').t1 + 0.03 });
    const sh = shotOf('V3'); uwLR(atPlunge(fx, 2.6), Math.max(sh.t0 - 0.05, tr + 0.3), 0.4, { wet: 0.35 }); }

  // ================================================================== under: two regulators (yours slow, hers quick)
  // [shot, your period (s), your level, her period, her level]: the shark and her letting go speed them up
  const REG = { V3: [2.6, 0.55, 2.1, 0.4], U1: [4.2, 0.4, 3.2, 0.32], U2: [4.6, 0.3, 3.6, 0.6], U3: [4.4, 0.4, 3.4, 0.3], Sh1: [4.4, 0.38, 3.3, 0.3],
    Sh2: [3.6, 0.4, 2.3, 0.38], Sh3: [3.2, 0.42, 2.0, 0.4], R1: [2.8, 0.42, 1.6, 0.42], R2: [2.0, 0.42, 1.5, 0.48], R3: [2.2, 0.5, 1.7, 0.45],
    Tb4: [5.0, 0.38, 4.0, 0.3], Se3: [5.0, 0.36, 4.0, 0.28], L1: [5.0, 0.62, 4.0, 0.25], L2: [5.2, 0.25, 4.2, 0.6], Q1: [5.2, 0.34, 4.2, 0.3] };
  for (const [id, [pY, vY, pH, vH]] of Object.entries(REG)) {
    const sh = shotOf(id); if (!sh) continue;
    for (const [per, v, kk, pan, ph0] of [[pY, vY, 1, 0.15, 0.0], [pH, vH, 1.3, -0.2, 0.45]]) {
      const di = Math.min(1.4, per * 0.38), de = Math.min(1.8, per * 0.42);
      for (let t = sh.t0 + ((ph0 * per - sh.t0) % per + per) % per; t < sh.t1 + 0.2; t += per * r.range(0.92, 1.08)) {
        if (id === 'R1' && kk > 1 && t > F(E.letGo) - 0.3 && t < F(E.letGo) + 0.9) continue;   // (her big breath out as she lets go, below)
        const stop = sh.t1 + 0.04;
        if (t < stop - 0.1) uw(atRegIn(fx, { d: di, k: kk }), t, v * 0.16, { pan, lp: 7000, wet: 0.2, stop });
        if (t + di + 0.12 < stop - 0.1) { const LR = atRegOut(fx, { d: de, k: kk, pan }); uwLR(LR, t + di + 0.12, v * 0.28, { wet: 0.3, stop }); }
      }
    }
  }
  // 11:46 you can breathe again: one long breath, close
  { const t = c('under', 1) + 0.2; uw(atRegIn(fx, { d: 1.8 }), t, 0.14, { lp: 7000, wet: 0.2 }); uwLR(atRegOut(fx, { d: 2.4, many: 90 }), t + 2.0, 0.2); }
  // the hull above, groaning (11:52)
  { const sh = shotOf('U3'), y = fx.creak(2.6, [[44, 0.35, 1], [71, 0.28, 0.7], [118, 0.2, 0.45], [196, 0.12, 0.25], [330, 0.06, 0.12]], { rate: [4, 12], env: (u) => Math.pow(Math.sin(Math.PI * u), 1.3) }); ATX.bq(y, 'lp', 600, 0.7, sr); uw(y, sh.t0 + 0.4, 0.2, { lp: 600, wet: 0.5 }); }

  // ================================================================== 11:56 nobody awake: a watch ticking on a still wrist
  { const sh = shotOf('Ev2'); deck(atTicks(fx, Math.floor(sh.t1 - sh.t0)), sh.t0 + 0.3, 0.12, { close: true, wet: 0.1 }); }

  // ================================================================== 12:30 the fish turn; the whitetip's passes
  { const sh = shotOf('Sh1'); for (const dt of [1.2, 3.6]) uw(atFin(fx, 1.4), sh.t0 + dt, 0.12, { pan: dt > 2 ? 0.4 : -0.4, lp: 2500, wet: 0.5 }); }
  { const s2 = shotOf('Sh2'), s3 = shotOf('Sh3');
    uw(atPass(fx, 3.4), s2.t0 + 1.2, 0.5, { pan: -0.3, lp: 1500, wet: 0.45 });
    uw(atPass(fx, 2.6), s3.t0 + 0.1, 0.45, { pan: 0.35, lp: 1500, wet: 0.45 }); }

  // ================================================================== 1:11 PM the oxygen still flowing into his mask
  { const sh = shotOf('O1'), d = sh.t1 - sh.t0 + 0.1, y = fx.white(Math.ceil(d * sr)), fl = fx.wander(4);
    ATX.bq(y, 'bp', 3800, 1.4, sr); for (let i = 0; i < y.length; i++) y[i] *= (1 + 0.1 * fl(i / sr)) * Math.min(1, i / (0.05 * sr), (y.length - i) / (0.05 * sr));
    deck(y, sh.t0, 0.16, { close: true, wet: 0.1 }); }

  // ================================================================== 1:19 she lets go; you kick after her; you catch her fin
  { const tl = F(E.letGo), tc = F(E.catch);
    uw(fx.creak(0.3, [[1100, 0.015, 1], [2100, 0.01, 0.5]], { rate: [60, 140] }), tl - 0.05, 0.12, { lp: 3000, pan: -0.2 });
    uwLR(atRegOut(fx, { d: 1.1, k: 1.3, many: 140 }), tl + 0.05, 0.6);
    for (let t = tl + 0.4, k = 0; t < tc - 0.2; t += 0.5, k++) uw(atFin(fx, 0.4), t, 0.2, { pan: k % 2 ? -0.35 : -0.05, lp: 2000 });   // her small fins
    for (let t = tl + 1.4, k = 0; t < tc; t += 0.68, k++) uw(atFin(fx, 0.55), t, 0.32, { pan: k % 2 ? 0.3 : 0.1, lp: 1600 });    // yours
    const g = fx.slap([[180, 0.04, 1], [460, 0.02, 0.5]], { amp: 0.8, skin: 0.2 }); uw(g, tc, 0.4, { lp: 2500 });
    uw(fx.creak(0.25, [[850, 0.02, 1], [1700, 0.012, 0.5]], { rate: [40, 90] }), tc + 0.02, 0.18, { lp: 2500 });
    uwLR(atRegOut(fx, { d: 0.9, k: 1.3, many: 160 }), tc + 0.2, 0.55); }

  // ================================================================== 2:26 PM the hot tubs boil; the pool (3:27); the sea (3:39)
  { const s1 = shotOf('Tb1'), t0 = F(E.tub), d1 = s1.t1 - t0 + 0.1;
    if (d1 > 0.3) deckLR(atBoil(fx, d1, 70, { k: (u) => atEv(u * d1, 0, 2.5), width: 0.4 }), t0, 0.32, { close: true, wet: 0.2 });
    const s2 = shotOf('Tb2'); deckLR(atBoil(fx, s2.t1 - s2.t0 + 0.1, 160, { width: 0.8, pitch: 0.9 }), s2.t0, 0.32, { close: true, wet: 0.3 });
    const s3 = shotOf('Tb3'); deckLR(atBoil(fx, s3.t1 - s3.t0 + 0.1, 90, { width: 0.9, steam: 0.5 }), s3.t0, 0.16, { close: true, wet: 0.35 }); }
  { const s1 = shotOf('Se1'), t0 = F(E.pool), d1 = s1.t1 - t0 + 0.1;
    if (d1 > 0.3) deckLR(atBoil(fx, d1, 260, { k: (u) => atEv(u * d1, 0, 3.0), width: 0.95, rumble: 1.5 }), t0, 0.55, { close: true, wet: 0.3 });
    const s2 = shotOf('Se2'), ts = F(E.sea), d2 = s2.t1 - ts + 0.1;
    if (d2 > 0.3) deckLR(atBoil(fx, d2, 900, { k: (u) => atEv(u * d2, 0, 3.5), width: 1, rumble: 2.5, steam: 1.6 }), ts, 0.75, { close: true, wet: 0.25 }); }
});

AT_SOUND_FNS.push(atSplash, atWhump, atBang, atFizz, atPlip, atChime, atPaVoice, atValveHiss, atBuckle, atRegIn, atRegOut, atFin, atPass, atPlunge, atBoil, atChoke, atBreakers, atTankKnock, atSob, atTicks, atCrinkle);
