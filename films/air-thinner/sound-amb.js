/* =====================================================================
   SOUND · AMB — the beds, by where the camera is (sound-lib.js: atPlaces). Each shot gets one stereo buffer with its
   layers summed in, cross-faded at the cuts.
     deck   the sea along the hull, the wind of the ship's way (both follow the ship's speed: full ahead, the engines
            choking, then adrift), the ship's machinery (fans and the 60 Hz of its power) until the blackout and its
            spin-down, the people (chatter, then gasping, then nobody), the steel band on the deck speakers until the
            power fails. ALL of it as loud as the air lets it be: a sound's pressure goes with the air's density, so it
            falls 20·log10(air) dB (−6 dB at half the air, −26 dB at 5 %), and the thin air dulls it a little too.
            By the afternoon the deck is all but silent.
     stairs the stairwell (inside, a hard room): the machinery, the people far above, closer gasps
     shop   the dive shop on deck 2: a fluorescent buzz, the engines through the hull
     under  under the sea, where the air doesn't matter: the sea's own hiss and rumble (always the same), the
            propellers churning (while the engines run), the dead hull groaning (after), and once the top of the sea
            boils, its roar overhead, heard through 10 m of water
   ===================================================================== */

// story envelopes for the people up top
const atCrowdS = (s) => 1 - 0.65 * atEv(s, atHMS(10, 36), atHMS(10, 46)) - 0.23 * atEv(s, atHMS(10, 46), atHMS(11, 5)) - 0.12 * atEv(s, atHMS(11, 5), atHMS(11, 20));
const atGaspS = (s) => atEv(s, atHMS(10, 39), atHMS(10, 46)) * (1 - 0.75 * atEv(s, atHMS(11, 10), atHMS(11, 22))) * (1 - atEv(s, atHMS(11, 24), atHMS(11, 40)));
const atBandS = (s) => (s < ATE.blackout ? 1 : 0);

// the places a deck shot can be, and how much of each layer it hears
// sea · wind · crowd · gasp · band · hum · near (the water right below) · far (high above it all) · room (inside)
const AT_AMB_MODE = {
  title: { sea: 0.5, wind: 0.45, crowd: 1.1, band: 0.8, hum: 0.35 },
  aerial: { sea: 0.9, wind: 1.2, crowd: 0.12, band: 0.1, hum: 0.3, far: 1 },
  deck: { sea: 0.45, wind: 0.6, crowd: 1, band: 0.7, hum: 0.35 },
  girl: { sea: 0.35, wind: 0.5, crowd: 0.9, band: 0.6, hum: 0.3 },
  sky: { sea: 0.35, wind: 0.75, crowd: 0.75, band: 0.6, hum: 0.3 },
  terrace: { sea: 0.5, wind: 0.7, crowd: 0.8, band: 0.8, hum: 0.35 },
  climb: { sea: 0.7, wind: 1.3, crowd: 0.15, band: 0.1, hum: 0.25, far: 1 },
  rail: { sea: 1.0, wind: 1.0, crowd: 0.35, band: 0.3, hum: 0.3 },
  seaLevel: { sea: 1.4, wind: 0.6, crowd: 0.05, band: 0.05, hum: 0.5, near: 1 },
  jaw: { sea: 0.4, wind: 0.5, crowd: 1, band: 0.6, hum: 0.3 },
  balloon: { sea: 0.35, wind: 0.6, crowd: 0.9, band: 0.6, hum: 0.3 },
  bridge: { sea: 0.8, wind: 1.1, crowd: 0.15, band: 0.15, hum: 0.4 },
  bow: { sea: 1.3, wind: 1.3, crowd: 0.05, band: 0.05, hum: 0.25 },
  cabinDeck: { sea: 0.45, wind: 0.6, crowd: 1, band: 0.7, hum: 0.35 },
  swell: { sea: 0.3, wind: 0.4, crowd: 0.85, band: 0.6, hum: 0.3 },
  pop: { sea: 0.3, wind: 0.45, crowd: 0.9, band: 0.6, hum: 0.3 },
  bar: { sea: 0.25, wind: 0.35, crowd: 1, band: 1.0, hum: 0.4 },
  glass: { sea: 0.25, wind: 0.35, crowd: 0.9, band: 0.9, hum: 0.4 },
  climbers: { g: 2.4, sea: 0.1, wind: 0.1, crowd: 0.35, gasp: 0.6, band: 0.25, hum: 0.8, room: 1 },
  oldMan: { sea: 0.3, wind: 0.45, crowd: 0.8, gasp: 0.8, band: 0.5, hum: 0.3 },
  down13: { sea: 1.0, wind: 1.1, crowd: 0.3, gasp: 0.4, band: 0.25, hum: 0.4 },
  you: { sea: 0.4, wind: 0.6, crowd: 0.9, gasp: 0.9, band: 0.5, hum: 0.3 },
  gasping: { sea: 0.4, wind: 0.6, crowd: 0.9, gasp: 1.3, band: 0.5, hum: 0.3 },
  stairsDown: { g: 2.4, sea: 0.1, wind: 0.1, crowd: 0.3, gasp: 0.6, band: 0.2, hum: 0.8, room: 1 },
  girlStairs: { g: 2.4, sea: 0.1, wind: 0.1, crowd: 0.25, gasp: 0.5, band: 0.2, hum: 0.8, room: 1 },
  hand: { g: 2.4, sea: 0.1, wind: 0.1, crowd: 0.2, gasp: 0.4, band: 0.15, hum: 0.8, room: 1 },
  funnel: { sea: 0.5, wind: 1.3, crowd: 0.05, gasp: 0.1, band: 0.1, hum: 1.4, far: 1 },
  smokeAerial: { sea: 0.9, wind: 1.1, crowd: 0, band: 0, hum: 0.6, far: 1 },
  screen: { sea: 0.35, wind: 0.5, crowd: 0.6, gasp: 1.0, band: 1.1, hum: 0.5 },
  marina: { g: 2.2, sea: 1.3, wind: 0.35, crowd: 0, gasp: 0.15, band: 0, hum: 0, near: 1 },
  pov: { g: 2.2, sea: 1.1, wind: 0.3, crowd: 0, gasp: 0.1, band: 0, hum: 0, near: 1 },
  girlMask: { g: 2.2, sea: 1.1, wind: 0.3, crowd: 0, gasp: 0.1, band: 0, hum: 0, near: 1 },
  roll: { g: 2.2, sea: 1.3, wind: 0.35, crowd: 0, band: 0, hum: 0, near: 1 },
  seaBoil: { g: 2.2, sea: 1.2, wind: 0.4, crowd: 0, band: 0, hum: 0, near: 1 },
};
const AT_AMB_G = { deck: 0.08, shop: 0.3, under: 0.13 };            // each place's level (set by measuring the stems: mix.js)
const AT_AMB_LATE = { sea: 0.5, wind: 0.55, crowd: 0, band: 0, hum: 0 };   // the afternoon cutaways: nobody, nothing running

// a crowd's babble (stereo [L, R], d s): n talkers (men, women, children), each phrases of syllables with pauses, and
// sometimes a laugh. Through a distant, outdoor band-pass; a loop the deck shots read from.
function atBabble(fx, d, n) {
  const sr = fx.sr, N = Math.ceil(d * sr), L = new Float32Array(N), R = new Float32Array(N), r = fx.r, V = Object.values(AT_VOWEL);
  const env = (u) => Math.min(1, u / 0.18) * Math.min(1, (1 - u) / 0.35);
  for (let k = 0; k < n; k++) {
    const kind = r.next(), f0 = kind < 0.45 ? r.range(95, 140) : kind < 0.85 ? r.range(175, 240) : r.range(250, 320), fk = kind < 0.45 ? 1 : kind < 0.85 ? 1.15 : 1.3;
    const pan = r.range(-0.9, 0.9), amp = r.range(0.35, 1);
    let t = r.range(0, 3);
    while (t < d - 0.5) {
      const ns = r.int(3, 11); let f = f0 * r.range(0.95, 1.12);
      for (let j = 0; j < ns && t < d - 0.4; j++) {
        const sd = r.range(0.09, 0.24), v = V[r.int(0, V.length - 1)], fj = f, fm = v.map(([ff, q, a]) => [ff * fk * r.range(0.9, 1.1), q, a]);
        const y = atVoice(fx, sd, { f0: (u) => fj * (1 + 0.07 * Math.sin(Math.PI * u) - 0.05 * u), formants: fm, breath: 0.14, env });
        ATX.mixIn(L, R, y, Math.round(t * sr), amp * r.range(0.55, 1) * (j === ns - 1 ? 0.7 : 1), pan);
        t += sd + r.range(0, 0.07); f *= r.range(0.95, 1.04);
      }
      if (r.chance(0.13)) {                                   // a laugh: "ha-ha-ha", falling
        let fl = f0 * r.range(1.15, 1.35);
        for (let j = 0, nj = r.int(3, 6); j < nj && t < d - 0.4; j++) {
          const y = atVoice(fx, 0.12, { f0: () => fl, formants: AT_VOWEL.a.map(([ff, q, a]) => [ff * fk, q, a]), breath: 0.45, env: (u) => Math.min(1, u / 0.1) * Math.pow(1 - u, 1.4) });
          ATX.mixIn(L, R, y, Math.round(t * sr), amp * 0.9, pan); t += r.range(0.15, 0.2); fl *= 0.95;
        }
      }
      t += r.range(0.3, 2.4);
    }
  }
  for (const x of [L, R]) { ATX.bq(x, 'hp', 220, 0.7, sr); ATX.bq(x, 'lp', 3200, 0.7, sr); }
  return [L, R];
}
// the gasping crowd (a loop): people around the deck, each an inhale with a strained voice and a short breath out,
// faster and harsher than any breath at rest; now and then a cough
function atGasps(fx, d, n) {
  const sr = fx.sr, N = Math.ceil(d * sr), L = new Float32Array(N), R = new Float32Array(N), r = fx.r;
  for (let k = 0; k < n; k++) {
    const pan = r.range(-0.9, 0.9), amp = r.range(0.3, 1), f0 = r.chance(0.5) ? r.range(100, 140) : r.range(190, 250), per = r.range(1.3, 2.1);
    for (let t = r.range(0, per); t < d - 1.2; t += per * r.range(0.85, 1.15)) {
      const di = r.range(0.45, 0.7), yi = fx.breath(di, { inhale: true, voice: r.range(0.08, 0.2), f0: f0 * 1.3 });
      ATX.mixIn(L, R, yi, Math.round(t * sr), amp, pan);
      const de = r.range(0.35, 0.55), ye = fx.breath(de, { voice: r.range(0.05, 0.12), f0 });
      ATX.mixIn(L, R, ye, Math.round((t + di + 0.05) * sr), amp * 0.7, pan);
      if (r.chance(0.06)) { const c = atVoice(fx, 0.16, { f0: () => f0 * 1.1, formants: AT_VOWEL.a, breath: 0.9, env: (u) => Math.min(1, u / 0.04) * Math.pow(1 - u, 2) }); ATX.mixIn(L, R, c, Math.round((t + di + de + 0.1) * sr), amp * 0.8, pan); }
    }
  }
  for (const x of [L, R]) { ATX.bq(x, 'hp', 250, 0.7, sr); ATX.bq(x, 'lp', 4200, 0.7, sr); }
  return [L, R];
}
// the steel band on the deck speakers (a loop, stereo): a calypso in F (F, B♭, C7, F), steel pans over a bass and a
// shaker, 112 bpm; through the speakers' band-pass and a little drive
function atBand(fx) {
  const sr = fx.sr, b = 60 / 112, bars = 8, d = bars * 4 * b, N = Math.ceil(d * sr), L = new Float32Array(N), R = new Float32Array(N), r = new RNG(5151);
  const pan = (f, t, vel, p, dk = 1) => { const y = fx.hit([[f, 0.55 * dk, 1], [f * 2.003, 0.32 * dk, 0.5], [f * 2.997, 0.18 * dk, 0.28], [f * 4.01, 0.09 * dk, 0.12]], { width: 0.0016, len: 1.6 * dk }); ATX.mixIn(L, R, y, Math.round(t * sr), vel, p); };
  const chords = [['F', 'A', 'C'], ['Bb', 'D', 'F'], ['C', 'E', 'G', 'Bb'], ['F', 'A', 'C'], ['F', 'A', 'C'], ['Bb', 'D', 'F'], ['C', 'E', 'G', 'Bb'], ['F', 'C', 'A']];
  const pat = [0, 0.75, 1.5, 2, 2.5, 3.25];                                   // the calypso's skip
  chords.forEach((ch, i) => {
    const t0 = i * 4 * b, root = atHz(ch[0] + '2');
    // bass: on 1, the and of 2, 3
    for (const [q, v] of [[0, 1], [1.5, 0.7], [2, 0.85], [3.5, 0.6]]) { const n = Math.round(0.4 * sr), y = new Float32Array(n), f = q === 2 ? root * 1.5 : root; for (let j = 0; j < n; j++) y[j] = Math.sin(2 * Math.PI * f * j / sr) * Math.exp(-j / (0.18 * sr)) * Math.min(1, j / (0.004 * sr)); ATX.mixIn(L, R, y, Math.round((t0 + q * b) * sr), 0.5 * v, 0); }
    // the pans: an arpeggio on the skip, a second pan answering an octave down
    pat.forEach((q, k) => { const n = ch[(k + i) % ch.length] + (k % 3 === 2 ? '6' : '5'); pan(atHz(n), t0 + q * b + r.range(0, 0.01), (k === 0 ? 0.42 : 0.3) * r.range(0.8, 1), -0.35); });
    for (const q of [0.5, 2.5]) pan(atHz(ch[1] + '4'), t0 + q * b, 0.22, 0.4, 1.4);
    // the shaker, 16ths, accents on the beat
    for (let k = 0; k < 16; k++) { const n = Math.round(0.05 * sr), z = fx.white(n); for (let j = 0; j < n; j++) z[j] *= Math.exp(-j / (0.012 * sr)); ATX.bq(z, 'hp', 5000, 0.7, sr); ATX.mixIn(L, R, z, Math.round((t0 + k * b / 4) * sr), k % 4 === 0 ? 0.12 : 0.06, 0.25); }
  });
  for (const x of [L, R]) { ATX.bq(x, 'hp', 280, 0.7, sr); ATX.bq(x, 'lp', 5200, 0.7, sr); for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * 1.6) / 1.6; }
  return [L, R];
}

atSound('amb', 'beds', function (ctx, bus, K) {
  const { fx, sr } = K, END = AT.end + 1.5, r = new RNG(CONFIG.seed + 909), XF = 0.06;
  const air = atCurve((t) => ATP.air(atStoryAt(t))), loud = atCurve(atLoud);
  // the loops (built once)
  const rms1 = ([L, R]) => { let e = 0; for (let i = 0; i < L.length; i += 5) e += L[i] * L[i] + R[i] * R[i]; const g = 0.25 / (Math.sqrt(e / (2 * Math.ceil(L.length / 5))) || 1); for (const x of [L, R]) for (let i = 0; i < x.length; i++) x[i] *= g; return [L, R]; };
  const babble = rms1(atBabble(fx, 23.0, 18)), gasps = rms1(atGasps(fx, 17.0, 10)), band = rms1(atBand(fx));
  const loopAdd = (L, R, src, i0, n, g, at, o = {}) => {   // add src (a loop) from film time `at` for n samples, gain g (×env(i))
    const [sL, sR] = src, M = sL.length; let j = Math.floor(((at * sr) % M + M) % M);
    for (let i = 0; i < n; i++) { const e = g * (o.env ? o.env(i) : 1); L[i0 + i] += sL[j] * e; R[i0 + i] += sR[j] * e; if (++j >= M) j = 0; }
  };
  const room = K.verb('room', 1.1, { bright: 0.45, damp: 3.4, shape: 2.0, early: [[0.011, 0.5], [0.019, 0.35], [0.031, 0.25]], wet: 0.5 });
  const noise = (n, colour, filters, norm = true) => {   // a fresh noise of a colour, through [[type, f, q]], scaled to rms ≈ 0.25
    const y = atNoise(fx, n, colour); for (const [ty, f, q] of filters) ATX.bq(y, ty, f, q || 0.7, sr);
    if (norm) { let e = 0; for (let i = 0; i < n; i += 7) e += y[i] * y[i]; const rms = Math.sqrt(e / Math.ceil(n / 7)) || 1; for (let i = 0; i < n; i++) y[i] *= 0.25 / rms; }
    return y;
  };

  for (const P of atPlaces()) {
    const a = Math.max(0, P.t0 - XF), b = Math.min(END, P.t1 + XF), d = b - a; if (d < 0.1) continue;
    const n = Math.ceil(d * sr), L = new Float32Array(n), R = new Float32Array(n), sh = P.shot, m = sh.mode, sMid = atStoryAt((P.t0 + P.t1) / 2);
    const fade = (i) => { const t = a + i / sr; return Math.min(1, (t - a) / XF, (b - t) / XF); };
    const wn = (rate) => fx.wander(rate);

    if (P.where === 'under') {
      // ------------------------------------------------------------- under the sea: the air doesn't come into it
      const swl = wn(0.07), hiss = [noise(n, 'brown', [['lp', 420]]), noise(n, 'brown', [['lp', 420]])], fizz = [noise(n, 'pink', [['bp', 1900, 0.5], ['lp', 5000]]), noise(n, 'pink', [['bp', 1900, 0.5], ['lp', 5000]])];
      for (let i = 0; i < n; i++) { const u = (a + i / sr), g = 0.55 * (0.8 + 0.2 * swl(u)); L[i] += hiss[0][i] * g + fizz[0][i] * 0.07; R[i] += hiss[1][i] * g + fizz[1][i] * 0.07; }
      // the propellers (only while the engines run: the hull from below at 10:46): five blades at 140 rpm, cavitating
      if (sMid < ATE.choke) {
        const fb = 140 / 60 * 5, z = noise(n, 'pink', [['lp', 900], ['hp', 40]]), z2 = noise(n, 'white', [['bp', 2600, 0.6]]);
        for (let i = 0; i < n; i++) { const u = a + i / sr, ph = (u * fb) % 1, th = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * ph), 3), tone = Math.sin(2 * Math.PI * fb * u) * 0.25 + Math.sin(2 * Math.PI * 2 * fb * u + 1) * 0.12;
          const v = (z[i] * (0.4 + 0.9 * th) + tone + z2[i] * 0.12 * th) * 0.35; L[i] += v * 0.95; R[i] += v; }
      }
      // the dead hull: slow groans as the ship drifts and rolls, a far knock now and then
      if (sMid > ATE.blackout) {
        for (let t = r.range(0.3, 2.5); t < d - 1.5; t += r.range(4.5, 9)) {
          const gd = r.range(1.6, 3.2), y = fx.creak(gd, [[r.range(40, 52), 0.3, 1], [r.range(70, 84), 0.25, 0.7], [r.range(115, 130), 0.2, 0.45], [r.range(180, 210), 0.12, 0.25]], { rate: [5, 16], env: (u) => Math.pow(Math.sin(Math.PI * u), 1.5) });
          ATX.bq(y, 'lp', 520, 0.7, sr); ATX.mixIn(L, R, y, Math.round(t * sr), 0.18 / (ATX.peak(y) || 1), r.range(-0.6, 0.6));
        }
      }
      // the top of the sea boiling (from 3:39): a roar overhead, through 10 m of water: low, dense, never stopping
      if (sMid > ATE.sea) {
        const zr = [noise(n, 'brown', [['lp', 260]]), noise(n, 'brown', [['lp', 260]])], cr = atCrackle(fx, d, { rate: 900 }), w2 = wn(0.4);
        ATX.bq(cr, 'lp', 2400, 0.7, sr); const cp = ATX.peak(cr) || 1;
        for (let i = 0; i < n; i++) { const u = a + i / sr, g = 0.55 * (0.85 + 0.15 * w2(u)); L[i] += zr[0][i] * g + cr[i] / cp * 0.05; R[i] += zr[1][i] * g + cr[i] / cp * 0.05; }
      }
      for (let i = 0; i < n; i++) { const e = fade(i) * AT_AMB_G.under; L[i] *= e; R[i] *= e; }
      K.putLR(L, R, a, { vol: 1 });
      continue;
    }

    if (P.where === 'shop') {
      // ------------------------------------------------------------- the dive shop on deck 2 (10:49, the power on)
      const z = [noise(n, 'brown', [['lp', 110]]), noise(n, 'brown', [['lp', 110]])], rt = noise(n, 'pink', [['bp', 700, 0.5]]);
      for (let i = 0; i < n; i++) {
        const u = a + i / sr, buzz = Math.sin(2 * Math.PI * 120 * u) * 0.05 + Math.sin(2 * Math.PI * 240 * u + 0.4) * 0.03 + Math.sign(Math.sin(2 * Math.PI * 120 * u)) * 0.006;
        const g = loud(u); L[i] += (z[0][i] * 0.5 + rt[i] * 0.05 + buzz) * g; R[i] += (z[1][i] * 0.5 + rt[i] * 0.05 + buzz) * g;
      }
      for (let i = 0; i < n; i++) { const e = fade(i) * AT_AMB_G.shop; L[i] *= e; R[i] *= e; }
      K.putLR(L, R, a, { vol: 1, room, wet: 0.25 });
      continue;
    }

    // --------------------------------------------------------------- on deck (and in the stairwell)
    const late = sMid > atHMS(11, 50) && !AT_AMB_MODE[m];
    const M = Object.assign({ g: 1, sea: 0, wind: 0, crowd: 0, gasp: 0, band: 0, hum: 0 }, late ? AT_AMB_LATE : (AT_AMB_MODE[m] || AT_AMB_LATE));
    const vk = ATV.v(sMid) / AT_F.speed0;                                    // the ship's speed (1 = 20 knots)
    // the sea: the swell along the hull (and the wake's hiss at speed); right below you: the slap of small waves
    if (M.sea) {
      const lp = M.near ? 1900 : M.far ? 700 : 1100, sw = wn(0.09), ws = [noise(n, 'pink', [['lp', lp], ['hp', 60]]), noise(n, 'pink', [['lp', lp], ['hp', 60]])];
      const wk = [noise(n, 'white', [['bp', 1500, 0.4], ['lp', 6000]]), noise(n, 'white', [['bp', 1500, 0.4], ['lp', 6000]])], gWake = 0.35 * Math.pow(vk, 1.5);
      for (let i = 0; i < n; i++) { const u = a + i / sr, g = M.sea * 0.5 * (0.72 + 0.28 * sw(u)); L[i] += (ws[0][i] + wk[0][i] * gWake) * g; R[i] += (ws[1][i] + wk[1][i] * gWake) * g; }
      if (M.near) for (let t = r.range(0, 0.6); t < d - 0.3; t += r.range(0.35, 1.3)) {   // waves slapping the platform
        const sl = fx.slap([[r.range(70, 110), 0.05, 1], [r.range(180, 260), 0.03, 0.5]], { amp: 0.6, skin: 0.25, len: 0.4 }), sp = noise(Math.round(0.35 * sr), 'white', [['hp', 900], ['lp', 5000]], false);
        for (let j = 0; j < sp.length; j++) sp[j] *= 0.5 * Math.exp(-j / (0.07 * sr)) * Math.min(1, j / (0.01 * sr));
        const v = M.sea * r.range(0.25, 0.6); ATX.mixIn(L, R, sl, Math.round(t * sr), v * 0.5 / (ATX.peak(sl) || 1), r.range(-0.6, 0.6)); ATX.mixIn(L, R, sp, Math.round((t + 0.01) * sr), v * 0.3, r.range(-0.6, 0.6));
      }
    }
    // the wind of the ship's way (20 knots of it at full speed), gusting; and a breeze of its own
    if (M.wind) {
      const gu = wn(0.22), gu2 = wn(0.6), wz = [noise(n, 'pink', [['bp', 420, 0.55], ['lp', 2500]]), noise(n, 'pink', [['bp', 520, 0.55], ['lp', 2500]])], g0 = M.wind * (0.2 + 0.8 * vk * vk) * 0.55;
      for (let i = 0; i < n; i++) { const u = a + i / sr, g = g0 * (0.6 + 0.3 * gu(u) + 0.1 * gu2(u)); L[i] += wz[0][i] * g; R[i] += wz[1][i] * g; }
    }
    // the ship's machinery: fans and the 60 Hz of its power, surging as the engines choke; at the blackout it spins down
    if (M.hum) {
      const fz = noise(n, 'pink', [['lp', 1400], ['bp', 300, 0.5]]), Eb = ATE.blackout; let ph = 0;
      for (let i = 0; i < n; i++) {
        const u = a + i / sr, s = atStoryAt(u), dn = s < Eb ? 1 : Math.exp(-(s - Eb) / 2.2), fk = s < Eb ? 1 : 0.35 + 0.65 * Math.exp(-(s - Eb) / 3.5);
        const surge = s > ATE.choke && s < Eb ? 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.45 * u) : 1;
        ph += 2 * Math.PI * 60 * fk / sr;
        const v = (Math.sin(ph) * 0.08 + Math.sin(2 * ph + 0.3) * 0.14 + Math.sin(3 * ph + 1) * 0.05 + fz[i] * 0.45 * fk) * M.hum * dn * surge * 0.6;
        L[i] += v; R[i] += v * 0.96;
      }
    }
    // the people: chatter, then gasping
    { const s0 = atStoryAt(a), cr = M.crowd * atCrowdS(sMid), gp = (M.gasp || 0.5 * M.crowd) * atGaspS(sMid);
      if (cr > 0.01) loopAdd(L, R, babble, 0, n, 0.6 * cr, a);
      if (gp > 0.01) loopAdd(L, R, gasps, 0, n, 0.55 * gp, a + 7);
      // the steel band on the deck speakers: cut dead by the blackout
      if (M.band && s0 < ATE.blackout) { const tb = atFilmAt(ATE.blackout), nb = Math.min(n, Math.max(0, Math.round((tb - a) * sr))); loopAdd(L, R, band, 0, nb, 0.5 * M.band, a, { env: (i) => Math.min(1, (nb - i) / (0.006 * sr)) }); } }
    // inside (the stairwell): muffle what comes from outside
    if (M.room) for (const x of [L, R]) ATX.bq(x, 'lp', 1800, 0.7, sr);
    // the air: everything as loud as the air lets it be, and duller as it thins
    { const N2 = Math.ceil(d * 25) + 2, cut = Array.from({ length: N2 }, (_, k) => Math.min(19000, 17000 * Math.pow(air(a + d * k / (N2 - 1)), 0.6)));
      const Lf = cut[0] < 16000 ? atSweep(L, sr, 'lowpass', 0.7, cut) : L, Rf = cut[0] < 16000 ? atSweep(R, sr, 'lowpass', 0.7, cut) : R;
      for (let i = 0; i < n; i++) { const e = fade(i) * loud(a + i / sr) * AT_AMB_G.deck * M.g; Lf[i] *= e; Rf[i] *= e; }
      K.putLR(Lf, Rf, a, M.room ? { vol: 1, room, wet: 0.5 } : { vol: 1 }); }
  }
});

AT_SOUND_FNS.push(atCrowdS, atGaspS, atBandS, atBabble, atGasps, atBand);
