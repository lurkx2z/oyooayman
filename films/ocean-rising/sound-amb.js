/* =====================================================================
   SOUND · AMB — the beds, by where the camera is (sound-lib.js: ocPlaces). Each shot gets one stereo buffer with its
   layers summed in, cross-faded at the cuts. No constant breathing (the owner's note of 2026-11-20).
     rock   the swell washing up the rock (each wash a rush, a crash and a long seething drain), the wind, the gulls
            (until the island starts to go under), the bell buoy out east (until its chain runs out)
     far    the sea wide and even under a drone, the wind
     house  the sea through the walls, low; the house's own quiet; the kitchen clock
     tower  the shaft: the swell booming on the stone, the lights' hum (until the power room floods), then the sea
            churning in the shaft below you, louder as it climbs
     top    the gallery: the wind loud and whistling in the railing, the sea far below (louder as it comes up),
            the lamp's motor through the glass
     room   the watch room and the lantern: the water slopping in the room, the lamp's motor, the wind outside
     roof   the wind, the sea slapping at your boots, the lamp's motor under the water below you
     hill   Isla's hilltop: the people talking low, the wind, flood sirens in the drowned town
   ===================================================================== */

const OC_AMB_G = { rock: 0.16, far: 0.12, house: 0.2, tower: 0.2, top: 0.15, room: 0.18, roof: 0.15, hill: 0.15 };   // each place's level (set by measuring the stems: mix.js)
// how much of each layer a place hears (sea: the swell near; far: the open sea; wind; whistle; gull; bell; …)
const OC_AMB = {
  rock: { sea: 1, wash: 1, wind: 0.55, gull: 1, bell: 1 },
  far: { far: 1, wind: 0.8, gull: 0.5, bell: 0.4 },
  house: { far: 0.6, muffle: 380, room: 1, clock: 1, bell: 0.25, wind: 0.25 },
  tower: { boom: 1, hum: 1, churn: 1, muffle: 900 },
  top: { far: 0.9, wind: 1.25, whistle: 1, motor: 0.35 },
  room: { slop: 1, motor: 1, wind: 0.45, muffle: 1600 },
  roof: { far: 0.9, near: 1, wind: 1.35, whistle: 1.2, motor: 0.5 },
  hill: { far: 0.25, wind: 0.75, crowd: 1, siren: 1 },
};
// a few shots hear more (or less) of something than their place does
const OC_AMB_SHOT = {
  title: { sea: 1.2, wash: 1.2 }, tide: { sea: 1.3, wash: 0.8 }, rope: { sea: 1.3 }, bow: { sea: 1.3, wash: 1.2 }, lichen: { sea: 1.3 },
  buoy: { bell: 0, sea: 0.4, wash: 0.3, far: 0.7 },        // (the buoy is heard close, in sound-sfx.js)
  breakers: { wash: 1.6, big: 1 }, tenM: { wash: 1.3, big: 1 }, horn: { wash: 1.2, big: 1 }, fogHouse: { wash: 1.2 },
  gallery: { near: 1, far: 1.1, wind: 1.2, whistle: 0.8 }, question: { wind: 1.1, near: 0.6 },
  lens: { slop: 0.2, motor: 1.4 }, ladder: { slop: 1.2, motor: 0.6 }, watchFlood: { slop: 1.4, motor: 0.5 },
  bolt: { churn: 0 }, strain: { churn: 0 },
};
const OC_GULL_END = 600;              // story s: the gulls have gone by the time the sea is 10 m up

ocSound('amb', 'beds', function (ctx, bus, K) {
  const { fx, sr } = K, END = OC.end + 1.5, r = new RNG(CONFIG.seed + 909), XF = 0.06, E = OCE, P = OCP, T = OC_F.tower;
  const room = K.verb('room', 1.1, { bright: 0.45, damp: 3.4, shape: 2.0, early: [[0.011, 0.5], [0.019, 0.35], [0.031, 0.25]], wet: 0.5 });
  const shaft = K.verb('shaft', 3.2, { bright: 0.4, damp: 2.2, shape: 1.6, early: [[0.021, 0.5], [0.043, 0.4], [0.067, 0.3]], wet: 0.6 });
  const noise = (n, colour, filters, norm = true) => {   // a fresh noise of a colour, through [[type, f, q]], scaled to rms ≈ 0.25
    const y = ocNoise(fx, n, colour); for (const [ty, f, q] of filters) OCX.bq(y, ty, f, q || 0.7, sr);
    if (norm) { let e = 0; for (let i = 0; i < n; i += 7) e += y[i] * y[i]; const rms = Math.sqrt(e / Math.ceil(n / 7)) || 1; for (let i = 0; i < n; i++) y[i] *= 0.25 / rms; }
    return y;
  };
  // the hill's people (a loop): many voices, low, outdoors
  const crowd = (() => { const [L, R] = ocBabble(fx, 21, 22); for (const x of [L, R]) { OCX.bq(x, 'hp', 200, 0.7, sr); OCX.bq(x, 'lp', 2200, 0.7, sr); } let e = 0; for (let i = 0; i < L.length; i += 5) e += L[i] * L[i] + R[i] * R[i]; const g = 0.25 / (Math.sqrt(e / (2 * Math.ceil(L.length / 5))) || 1); for (const x of [L, R]) for (let i = 0; i < x.length; i++) x[i] *= g; return [L, R]; })();
  const loopAdd = (L, R, src, n, g, at) => { const [sL, sR] = src, M = sL.length; let j = Math.floor(((at * sr) % M + M) % M); for (let i = 0; i < n; i++) { L[i] += sL[j] * g; R[i] += sR[j] * g; if (++j >= M) j = 0; } };
  // the bell buoy's bell (four clappers on a bell in a cage: it rings as the buoy rolls on the swell)
  const bellModes = [[512, 2.2, 1], [1229, 1.4, 0.55], [1690, 0.9, 0.4], [2470, 0.6, 0.25], [3420, 0.35, 0.12]];
  const bellHit = (v) => fx.hit(bellModes.map(([f, tau, a]) => [f * r.range(0.997, 1.003), tau, a]), { width: 0.0008, amp: v, len: 5 });
  const tBell = ocFilmAt(E.bell);

  for (const Pl of ocPlaces()) {
    const a = Math.max(0, Pl.t0 - XF), b = Math.min(END, Pl.t1 + XF), d = b - a; if (d < 0.1) continue;
    const n = Math.ceil(d * sr), L = new Float32Array(n), R = new Float32Array(n), sh = Pl.shot, m = sh.mode, sMid = ocStoryAt((Pl.t0 + Pl.t1) / 2), hMid = P.h(sMid);
    const M = Object.assign({}, OC_AMB[Pl.where], OC_AMB_SHOT[m] || {});
    const fade = (i) => { const t = a + i / sr; return Math.min(1, (t - a) / XF, (b - t) / XF); };
    const wn = (rate) => fx.wander(rate);
    const add = (y, g, pan = 0, i0 = 0) => OCX.mixIn(L, R, y, i0, g, pan);

    // ---- the swell right by you: a bed, and the washes up the rock
    if (M.sea) {
      const sw = wn(0.12), z = [noise(n, 'pink', [['lp', 900], ['hp', 50]]), noise(n, 'pink', [['lp', 900], ['hp', 50]])];
      for (let i = 0; i < n; i++) { const u = a + i / sr, g = M.sea * 0.45 * (0.6 + 0.4 * (0.5 + 0.5 * Math.sin(2 * Math.PI * u / 8.3 + 1.1)) + 0.15 * sw(u)); L[i] += z[0][i] * g; R[i] += z[1][i] * g; }
    }
    if (M.wash) for (let t = r.range(-1.5, 1.0); t < d - 0.5; t += r.range(4.2, 7.5)) {
      const wd = r.range(2.6, 4.2), y = ocWash(fx, wd, { big: M.big ? r.range(0.5, 1) : 0, bright: r.range(0.45, 0.75) }), pk = OCX.peak(y) || 1, i0 = Math.round(Math.max(0, t) * sr), off = Math.round(Math.max(0, -t) * sr);
      add(off ? y.subarray(off) : y, M.wash * 0.42 * r.range(0.7, 1) / pk, r.range(-0.7, 0.7), i0);
    }
    // ---- the open sea: wide, even, the swell's slow rise and fall
    if (M.far) {
      const sw = wn(0.07), up = Pl.where === 'top' || Pl.where === 'roof' ? MathX.clamp(1 - (T.top + 1.6 - hMid) / 40, 0.25, 1) : 1;
      const z = [noise(n, 'pink', [['lp', 620], ['hp', 40]]), noise(n, 'pink', [['lp', 620], ['hp', 40]])], f2 = [noise(n, 'white', [['bp', 2400, 0.5]]), noise(n, 'white', [['bp', 2400, 0.5]])];
      for (let i = 0; i < n; i++) { const u = a + i / sr, g = M.far * 0.5 * up * (0.75 + 0.25 * sw(u)); L[i] += (z[0][i] + f2[0][i] * 0.08) * g; R[i] += (z[1][i] + f2[1][i] * 0.08) * g; }
    }
    // ---- right at your feet (the gallery, the roof): small waves slapping
    if (M.near) for (let t = r.range(0, 0.5); t < d - 0.3; t += r.range(0.4, 1.4)) {
      const sl = fx.slap([[r.range(70, 110), 0.05, 1], [r.range(180, 260), 0.03, 0.5]], { amp: 0.6, skin: 0.25, len: 0.4 }), sp = noise(Math.round(0.35 * sr), 'white', [['hp', 900], ['lp', 5000]], false);
      for (let j = 0; j < sp.length; j++) sp[j] *= 0.5 * Math.exp(-j / (0.07 * sr)) * Math.min(1, j / (0.01 * sr));
      const v = M.near * r.range(0.25, 0.6), i0 = Math.round(t * sr); add(sl, v * 0.45 / (OCX.peak(sl) || 1), r.range(-0.6, 0.6), i0); add(sp, v * 0.3, r.range(-0.6, 0.6), i0 + Math.round(0.01 * sr));
    }
    // ---- the wind, gusting; and its whistle in the gallery's railing
    if (M.wind) {
      const gu = wn(0.22), gu2 = wn(0.6), wz = [noise(n, 'pink', [['bp', 420, 0.55], ['lp', 2500]]), noise(n, 'pink', [['bp', 520, 0.55], ['lp', 2500]])];
      for (let i = 0; i < n; i++) { const u = a + i / sr, g = M.wind * 0.42 * (0.55 + 0.3 * gu(u) + 0.15 * gu2(u)); L[i] += wz[0][i] * g; R[i] += wz[1][i] * g; }
      if (M.whistle) { const gw = wn(0.3), ws = [noise(n, 'white', [['bp', 930, 18], ['bp', 930, 18]]), noise(n, 'white', [['bp', 1340, 16], ['bp', 1340, 16]])];
        for (let i = 0; i < n; i++) { const u = a + i / sr, g = M.whistle * 0.07 * Math.pow(Math.max(0, 0.5 + 0.5 * gw(u)), 2.2); L[i] += ws[0][i] * g; R[i] += ws[1][i] * g; } }
    }
    // ---- the gulls (until the island starts to go under)
    if (M.gull && sMid < OC_GULL_END) for (let t = r.range(0.4, 2.5); t < d - 0.6; t += r.range(1.8, 4.5)) {
      const k = r.int(1, 3), f0 = r.range(1050, 1450), pan = r.range(-0.9, 0.9), v = M.gull * r.range(0.04, 0.11) * (1 - sMid / OC_GULL_END * 0.6);
      for (let j = 0; j < k; j++) { const y = ocGull(fx, { f0: f0 * r.range(0.96, 1.04), d: r.range(0.32, 0.5) }); add(y, v / (OCX.peak(y) || 1), pan, Math.round((t + j * r.range(0.45, 0.6)) * sr)); }
    }
    // ---- the bell buoy, 340 m east (until its chain runs out)
    if (M.bell && a < tBell) for (let t = r.range(0, 1.5); a + t < Math.min(b, tBell) - 0.05; t += r.range(1.4, 3.6)) {
      const y = bellHit(r.range(0.5, 1)); add(y, M.bell * 0.05 / (OCX.peak(y) || 1), 0.55, Math.round(t * sr));
    }
    // ---- the house: its quiet, the clock on the kitchen wall
    if (M.room) { const z = noise(n, 'brown', [['lp', 140]]); for (let i = 0; i < n; i++) { L[i] += z[i] * 0.25; R[i] += z[i] * 0.25; } }
    if (M.clock) for (let t = 1 - ((a % 1) + 1) % 1; t < d; t += 1) { const y = fx.hit([[3100, 0.012, 1], [5200, 0.008, 0.5], [1800, 0.02, 0.4]], { width: 0.0002, len: 0.08 }); add(y, 0.035 / (OCX.peak(y) || 1), -0.3, Math.round(t * sr)); }
    // ---- the tower's shaft: the swell booming on the stone; the lights' hum; then the sea in the shaft below
    if (M.boom) {
      const z = noise(n, 'brown', [['lp', 90]]); for (let i = 0; i < n; i++) { L[i] += z[i] * 0.4; R[i] += z[i] * 0.4; }
      for (let t = r.range(0.2, 3); t < d - 0.5; t += r.range(5.5, 8.5)) { const y = fx.hit([[38, 0.9, 1], [57, 0.6, 0.6], [83, 0.4, 0.35], [131, 0.2, 0.15]], { width: 0.05, len: 3.5 }); add(y, 0.5 / (OCX.peak(y) || 1), r.range(-0.3, 0.3), Math.round(t * sr)); }
    }
    if (M.hum) { const tD = ocFilmAt(E.dark), nb = Math.max(0, Math.min(n, Math.round((tD - a) * sr))), fl0 = ocFilmAt(E.burst - 0.2); let ph = 0;
      for (let i = 0; i < nb; i++) { const u = a + i / sr, fl = u > fl0 ? (Math.sin(ocStoryAt(u) * 53) > 0.3 ? 1 : 0.3) : 1; ph += 2 * Math.PI * 60 / sr; const v = (Math.sin(ph) * 0.05 + Math.sin(2 * ph + 0.3) * 0.08 + Math.sin(3 * ph + 1) * 0.03) * fl * Math.min(1, (nb - i) / (0.004 * sr)); L[i] += v; R[i] += v; } }
    if (M.churn && sMid > E.burst) {
      const nearK = { burst: 1, powerRoom: 1, stairsDown: 0.8, climb: 0.6 }[m] ?? 0.6;     // (how far below you the water is)
      const z = [noise(n, 'pink', [['lp', 750], ['hp', 40]]), noise(n, 'pink', [['lp', 750], ['hp', 40]])], gw = wn(0.5);
      for (let i = 0; i < n; i++) { const u = a + i / sr, g = M.churn * 0.6 * nearK * (0.8 + 0.2 * gw(u)); L[i] += z[0][i] * g; R[i] += z[1][i] * g; }
      for (let t = r.range(0, 0.1); t < d; t += r.range(0.03, 0.12)) fx.bubble(L, R, Math.round(t * sr), r.range(160, 520), r.range(0.02, 0.05), 0.06 * M.churn, r.range(-0.7, 0.7));
    }
    // ---- the watch room and the lantern: the water slopping, the lamp's motor
    if (M.slop) for (let t = r.range(0, 0.4); t < d - 0.3; t += r.range(0.3, 0.9)) { const y = fx.slap([[r.range(80, 140), 0.04, 1], [r.range(220, 320), 0.03, 0.5]], { amp: 0.5, skin: 0.35, len: 0.35 }); add(y, M.slop * r.range(0.15, 0.35) / (OCX.peak(y) || 1), r.range(-0.6, 0.6), Math.round(t * sr)); }
    if (M.motor) {
      const under = (t) => P.h(ocStoryAt(t)) > T.lamp - 0.05; let ph = 0; const mo = new Float32Array(n), mz = noise(n, 'pink', [['bp', 240, 1.2]]);
      for (let i = 0; i < n; i++) { const u = a + i / sr; ph += 2 * Math.PI * 92 / sr; mo[i] = Math.sin(ph) * 0.12 + Math.sin(2 * ph + 0.4) * 0.07 + mz[i] * 0.4 + (((u * 4) % 1) < 0.01 ? 0.5 : 0) * (1 - ((u * 4) % 1) * 100); }
      const sub = under((a + b) / 2); if (sub) OCX.bq(mo, 'lp', 260, 0.7, sr);
      for (let i = 0; i < n; i++) { const v = mo[i] * M.motor * 0.3 * (sub ? 0.6 : 1); L[i] += v; R[i] += v * 0.95; }
    }
    // ---- the hilltop: the people, the sirens down in the town
    if (M.crowd) loopAdd(L, R, crowd, n, 0.55 * M.crowd, a);
    if (M.siren) { for (const [t, f, pan, v] of [[r.range(-4, 0), 1, -0.6, 0.12], [r.range(-6, -2), 0.84, 0.5, 0.08]]) { const y = ocSiren(fx, d + 8); OCX.bq(y, 'lp', 900, 0.7, sr); const off = Math.round(-t * sr); add(y.subarray(off), M.siren * v / (OCX.peak(y) || 1), pan, 0); } }

    // inside: muffle what comes from outside
    if (M.muffle) for (const x of [L, R]) { OCX.bq(x, 'lp', M.muffle, 0.7, sr); }
    for (let i = 0; i < n; i++) { const e = fade(i) * OC_AMB_G[Pl.where]; L[i] *= e; R[i] *= e; }
    const verb = Pl.where === 'tower' ? { room: shaft, wet: 0.55 } : Pl.where === 'house' || Pl.where === 'room' ? { room, wet: 0.3 } : {};
    K.putLR(L, R, a, Object.assign({ vol: 1 }, verb));
  }
});

// (the tables go into the soundtrack's fingerprint)
window.OC_THEME = Object.assign(window.OC_THEME || {}, { amb: [OC_AMB_G, OC_AMB, OC_AMB_SHOT, OC_GULL_END] });
