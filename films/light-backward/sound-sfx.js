/* =====================================================================
   SOUND · SFX — the events. Light turning round makes no sound of its own, so most of these are the world reacting
   (the cat, the streetlights, the crowd on the beach) or the film's own marks on the clock:
     the clock          dry ticks on the readout's seconds: the last five before 10:00:00, and tonight again at the end
     10:00:00           a reversed cymbal and bells that swell up and stop dead on the stars going out; then nothing
     the Moon           a faint shimmer as its wrong-side sliver lights (1.3 s, moonlight's age)
     the mirror sky     tiny glassy tings, one per star coming back, sparse then thick (in E, under the score)
     the lantern        the replay: a slow low throb, a rush into the reversal, a soft snap back to real time
     the second Sun     a rush of air into the moment it switches on
     the cat            a sleepy "mrrp" on the wall at 9:59; a puzzled "mrrow?" in daylight at 10 PM
     the streetlights   a faint hum, then their photocells' relays click off down the street
     space              a whoosh where the stream of old sunlight turns round; a slow sweep as dawn crosses the night side
     Hawaii             the crowd's gasp when the Sun goes out; phone shutters in the dark; the cheer and the clapping
                        when it comes back
     Voyager 1          its telemetry pips going out; after 10:00, the old ones coming back (played backwards)
     the panels         next door's inverter clicking on at midnight, a faint electrical hum
     the end of oceans  the sea ice cracking; the seas boiling; a deep rumble as the Sun is born, cut dead when the
                        night comes back
   ===================================================================== */

lbSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, sun2 = lbStory(LB_SKY.on);
  const room = K.verb('garden', 1.5, { bright: 0.5, damp: 4, wet: 0.16 });
  const hall = K.verb('space', 3.4, { bright: 0.45, damp: 2.2, shape: 1.8, wet: 0.3 });
  const beach = K.verb('beach', 0.9, { bright: 0.6, damp: 5, wet: 0.12 });
  const rev = (y) => { const z = new Float32Array(y.length); for (let i = 0; i < y.length; i++) z[i] = y[y.length - 1 - i]; return z; };
  const fadeEnd = (y, sec) => { const n = Math.round(sec * sr); for (let i = 0; i < n; i++) y[y.length - 1 - i] *= i / n; return y; };
  const sine = (y, f, a, tau, i0 = 0, rise = 0.004) => { for (let i = 0; i + i0 < y.length; i++) { const t = i / sr; y[i0 + i] += a * Math.sin(2 * Math.PI * f * t) * Math.exp(-t / tau) * Math.min(1, t / rise); } return y; };
  // a rush of air that swells into tEnd and stops there (a reversed, darkening noise tail)
  const rush = (tEnd, d, o = {}) => {
    const n = Math.ceil(d * sr), z = lbNoise(fx, n, o.colour || 'pink');
    for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / ((o.tau || 0.3) * d * sr));
    const y = fadeEnd(rev(lbSweep(z, sr, 'lowpass', 0.8, o.curve || [9000, 4000, 1800, 900, 500])), 0.004);
    return K.put(y, tEnd - d, { vol: o.vol || 0.05, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  };

  // ---- the clock: the readout's last five seconds before 10:00:00; and tonight at the end, 9:59:51 → 9:59:59
  const tick = (t, v, pan = 0.15) => K.put(lbClick(fx, { f: 3400, tau: 0.0025, len: 0.04, hp: 1200 }), t, { vol: v, norm: true, pan, room, wet: 0.25 });
  for (let k = 5; k >= 1; k--) tick(LB.t0 - k, 0.035 + 0.01 * (5 - k));
  for (let j = 8; j >= 0; j--) tick(LB.end - 0.5 - j, 0.03 + 0.006 * (8 - j));

  // ---- 10:00:00: everything in the sky swells and stops dead
  {
    const d = 2.6, n = Math.ceil(d * sr), cym = lbNoise(fx, n, 'white');
    LBX.bq(cym, 'hp', 3200, 0.7, sr); LBX.bq(cym, 'lp', 12000, 0.7, sr);
    for (let i = 0; i < n; i++) cym[i] *= Math.exp(-i / (0.6 * sr));
    const y = new Float32Array(n);
    for (const [nn, a] of [['E6', 0.6], ['B6', 0.4], ['E7', 0.25]]) { const b = fx.bellBuf(nn); for (let i = 0; i < n && i < b.length; i++) y[i] += b[i] * a; }
    for (let i = 0; i < n; i++) y[i] += 2 * cym[i];
    K.put(fadeEnd(rev(y), 0.003), LB.t0 - d, { vol: 0.11, norm: true });
  }
  // the Moon's sliver, on the wrong side
  K.put(fx.shimmer(2.4, lbHz('B6'), { skew: 0.18 }), lbStory(1.3) - 0.1, { vol: 0.012, norm: true, pan: -0.1, room: hall, wet: 0.6 });

  // ---- the mirror sky: a ting per star coming back (Sirius and Canopus get the score's bells)
  {
    const r = new RNG(211), notes = ['E6', 'F#6', 'G#6', 'B6', 'C#7', 'E7', 'F#7', 'G#7'], ting = {};
    const mk = (nn) => ting[nn] || (ting[nn] = fx.hit([[lbHz(nn), 0.32, 1], [lbHz(nn) * 2.01, 0.11, 0.22], [lbHz(nn) * 3.02, 0.05, 0.08]], { width: 0.00025, len: 1.6 }));
    const dens = (t) => t < LB.mirror ? 0.35 : t < LB.replay ? 0.6 + 4 * MathX.smooth(t, LB.mirror, LB.replay - 1.5) : 1.2;
    for (const [a, b] of [[lbStory(21), LB.replay - 0.3], [LB.replayEnd + 0.6, LB.north - 0.4]])
      for (let t = a; t < b; t += r.range(0.4, 1.6) / dens(t)) K.put(mk(notes[r.int(0, notes.length - 1)]), t, { vol: r.range(0.004, 0.012) * (t < LB.mirror ? 0.8 : 1), norm: true, pan: r.range(-0.85, 0.85), room: hall, wet: 0.7 });
  }

  // ---- the cat: asleep on the wall at 9:59 (a sleepy "mrrp" as the camera finds it); puzzled at 10 PM daylight
  K.put(lbMeow(fx, { d: 0.32, f0: [380, 520, 360], open: 0.45, thin: 0.25 }), lbCap('before', 1).show + 3.1, { vol: 0.045, norm: true, pan: 0.25, room, wet: 0.8 });
  K.put(lbMeow(fx, { d: 0.62, f0: [470, 640, 760], open: 0.9, thin: 0.1 }), lbCap('day', 0).show + 1.6, { vol: 0.05, norm: true, pan: 0.3, room, wet: 0.8 });

  // ---- the lantern, a billion times slower: a slow low throb; a rush into the reversal; a snap back to real time
  {
    const tR = lbCap('replay', 1).show + 0.4;
    lbBed(K, LB.replay, LB.replayEnd, { colour: 'brown', f: [['lp', 240], ['hp', 28]], env: (u, t) => 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.9 * t) ** 2, vol: 0.07, fi: 0.5, fo: 0.06, am: 0.4, wr: 0.5 });
    lbBed(K, LB.replay, LB.replayEnd, { colour: 'white', f: [['hp', 6500], ['lp', 12000]], vol: 0.012, fi: 1.0, fo: 0.06, am: 1.2, wr: 3 });   // the photons' glitter
    rush(tR, 1.6, { vol: 0.06, room: hall, wet: 0.4 });
    K.put(sine(fx.arr(2.2), 52, 1, 0.5, 0, 0.01), tR, { vol: 0.12, norm: true });
    K.put(lbClick(fx, { f: 1500, tau: 0.006, len: 0.08 }), LB.replayEnd, { vol: 0.03, norm: true, room, wet: 0.4 });
  }

  // ---- the second Sun: a rush of air into the moment it switches on
  rush(sun2, 2.2, { vol: 0.07, tau: 0.35, curve: [10000, 6000, 2500, 900, 300] });

  // ---- the streetlights: a faint hum, then the relays click off down the street (near, middle, far)
  lbTone(K, LB.day - 0.3, LB.lampsOff - LB.day + 0.32, 100, [[1, 1], [2, 0.6], [3, 0.35], [5, 0.15]], (u) => Math.min(1, u / 0.1), { vol: 0.006, f: [['bp', 300, 0.6]], pan: 0.4 });
  for (const [dt, v, pan, lp] of [[0, 0.05, 0.45, 0], [0.48, 0.028, -0.2, 5000], [1.05, 0.016, -0.6, 3000]]) {
    const y = lbClick(fx, { f: 1700, tau: 0.007, len: 0.09 }); sine(y, 140, 0.5, 0.015); if (lp) LBX.bq(y, 'lp', lp, 0.7, sr);
    K.put(y, LB.lampsOff + dt, { vol: v, norm: true, pan, room, wet: 0.6 });
  }

  // ---- space: the stream of old sunlight turns round; the dawn sweeping across the night side
  {
    const d = 2.2, z = lbNoise(fx, Math.ceil(d * sr), 'pink');
    for (let i = 0; i < z.length; i++) { const u = i / z.length; z[i] *= Math.sin(Math.PI * u) ** 1.5; }
    lbSweepPut(K, z, LB.flip - 1.1, 'bandpass', 1.4, [400, 1400, 3200, 1400, 400], { vol: 0.05, room: hall, wet: 0.5 });
    const t0 = LB.wave + 0.3, dw = LB.moonwhy - t0 - 0.2, n = Math.ceil(dw * sr), a = lbNoise(fx, n, 'pink'), b = lbNoise(fx, n, 'pink');
    const sw = (x) => lbSweep(x, sr, 'bandpass', 1.1, [250, 380, 600, 900, 1300, 1700]);
    const L = sw(a), R = sw(b);
    for (let i = 0; i < n; i++) { const u = i / n, e = Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.12); L[i] *= e * (1 - 0.7 * u); R[i] *= e * (0.3 + 0.7 * u); }
    K.putLR(L, R, t0, { vol: 0.03, norm: true, room: hall, wet: 0.4 });
  }

  // ---- Hawaii: the gasp when their Sun goes out; phone shutters in the dark; the cheer when it comes back
  { const [L, R] = lbGasp(fx, { n: 24, spread: 0.45 }); K.putLR(L, R, LB.out + 0.3, { vol: 0.11, norm: true, room: beach, wet: 0.7 }); }
  {
    const r = new RNG(223), shutter = () => { const y = lbClick(fx, { f: 2900, tau: 0.003, len: 0.12, hp: 800 }), z = lbClick(fx, { f: 2100, tau: 0.004, len: 0.06, hp: 800 }); lbAddAt(y, z, 0.065, 0.8, sr); return y; };
    for (const [a, b] of [[LB.black + 0.8, LB.half - 0.2], [LB.wait + 0.3, LB.voyager - 0.2]])
      for (let t = a + r.range(0, 0.8); t < b; t += r.range(0.5, 2.2)) K.put(shutter(), t, { vol: r.range(0.008, 0.022), norm: true, pan: r.range(-0.8, 0.8), room: beach, wet: 0.5 });
  }
  {
    const t0 = LB.back + 0.45, d = 9, n = Math.ceil(d * sr), env = (u) => { const t = u * d; return Math.min(1, Math.pow(t / 1.6, 1.5)) * (t < 3.2 ? 1 : Math.exp(-(t - 3.2) / 2.6)); };
    // many voices' "aah": noise through two vowel formants, each side its own crowd, wavering
    const side = () => { const y = lbNoise(fx, n, 'pink'), w = fx.wander(5), F = [[720, 3, 1], [1150, 4, 0.6], [2600, 5, 0.25]], out = new Float32Array(n);
      for (const [f, q, a] of F) { const z = Float32Array.from(y); LBX.bq(z, 'bp', f, q, sr); for (let i = 0; i < n; i++) out[i] += z[i] * a; }
      for (let i = 0; i < n; i++) out[i] *= env(i / n) * (1 + 0.35 * w(i / sr)); return out; };
    K.putLR(side(), side(), t0, { vol: 0.09, norm: true, room: beach, wet: 0.6 });
    // a couple of whistles
    for (const [dt, pan, f0] of [[1.3, -0.5, 2300], [2.4, 0.6, 2700]]) { const dd = 0.9, y = fx.arr(dd); let ph = 0; for (let i = 0; i < dd * sr; i++) { const u = i / (dd * sr), f = f0 * (u < 0.35 ? 0.85 + 0.15 * u / 0.35 : 1 - 0.25 * (u - 0.35)); ph += 2 * Math.PI * f / sr; y[i] = Math.sin(ph) * Math.min(1, u / 0.08) * Math.min(1, (1 - u) / 0.2); } K.put(y, t0 + dt, { vol: 0.018, norm: true, pan, room: beach, wet: 0.7 }); }
    const [L, R] = lbClaps(fx, 8, { n: 36, env: (u) => Math.min(1, u / 0.12) * Math.pow(1 - u, 1.4) });
    K.putLR(L, R, t0 + 1.1, { vol: 0.07, norm: true, room: beach, wet: 0.5 });
  }

  // ---- Voyager 1: its pips going out; after 10:00 the old ones come back, backwards
  {
    const tf = lbCap('voyager', 1).show + 1.4, pip = fx.beep(1760, 0.045), back = rev(fx.beep(1320, 0.07));
    for (const p of [pip, back]) LBX.bq(p, 'lp', 4000, 0.7, sr);
    for (let k = -30; k < 40; k++) { const t = tf + k * 0.55; if (t > LB.voyager + 0.3 && t < LB.ret - 0.3) K.put(pip, t, { vol: 0.012, norm: true, pan: -0.35, room: hall, wet: 0.5 }); }
    for (let k = 1; k < 40; k++) { const t = tf + k * 0.55 - 0.07; if (t < LB.ret - 0.3) K.put(back, t, { vol: 0.011, norm: true, pan: 0.35, room: hall, wet: 0.5 }); }
    rush(tf, 0.9, { vol: 0.025, room: hall, wet: 0.5, curve: [8000, 4000, 2000, 1200] });
  }

  // ---- midnight: next door's inverter clicks on, and hums
  {
    const t0 = lbCap('midnight', 2).show + 0.2;
    K.put(lbClick(fx, { f: 1400, tau: 0.008, len: 0.1 }), t0, { vol: 0.025, norm: true, pan: 0.55, room, wet: 0.6 });
    lbTone(K, t0 + 0.05, LB.sunrise - t0 - 0.05, 50, [[2, 1], [4, 0.5], [6, 0.25], [80, 0.06]], (u) => Math.min(1, u / 0.05) * Math.min(1, (1 - u) / 0.1), { vol: 0.007, pan: 0.55 });
  }

  // ---- the sea ice cracks up; the oceans boil; a rumble as the Sun is born, cut dead when the night comes back
  {
    const r = new RNG(227);
    for (const t of [LB.ice + 0.5, LB.ice + 1.6, LB.ice + 2.3, LB.ice + 3.4]) {
      const y = fx.arr(2.2); sine(y, r.range(38, 60), 1, 0.45, 0, 0.002);
      const c = lbCrackle(fx, 0.5, { rate: 2500, hp: 300, env: (u) => Math.exp(-u * 5) }); lbAddAt(y, c, 0, 2.2, sr);
      const g = fx.creak(1.1, [[r.range(70, 95), 0.05, 1], [r.range(160, 210), 0.03, 0.5], [r.range(380, 460), 0.015, 0.25]], { rate: [8, 22], env: (u) => Math.exp(-u * 3) }); lbAddAt(y, g, 0.05, 0.6, sr);
      K.put(y, t, { vol: r.range(0.06, 0.09), norm: true, pan: r.range(-0.6, 0.6), room: hall, wet: 0.5 });
    }
    const t0 = LB.boil + 1.0, d = LB.birth - t0 + 0.4, n = Math.ceil(d * sr), L = new Float32Array(n), R = new Float32Array(n), dens = (t) => MathX.smooth(t0 + t, lbCap('boil', 1).show - 1, lbCap('boil', 2).show + 1.5);
    for (let t = 0; t < d; t += r.range(0.004, 0.02)) { const a = dens(t); if (a > 0.03 && r.next() < 0.3 + 0.7 * a) fx.bubble(L, R, Math.round(t * sr), r.range(140, 700), r.range(0.01, 0.035), 0.4 * a * r.range(0.4, 1), r.range(-0.9, 0.9)); }
    const steam = lbNoise(fx, n, 'white'); LBX.bq(steam, 'hp', 2500, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = i / sr, e = dens(t) * Math.min(1, (d - t) / 0.4); L[i] = L[i] * e + 0.12 * steam[i] * e; R[i] = R[i] * e + 0.12 * steam[i] * e * 0.9; }
    K.putLR(L, R, t0, { vol: 0.06, norm: true, room: hall, wet: 0.35 });
    const tb = lbCap('birth', 1).show - 0.5, db = LB.nightBack - tb, rm = lbNoise(fx, Math.ceil(db * sr), 'brown');
    LBX.bq(rm, 'lp', 110, 0.7, sr); sine(rm, 31, 0.15, 1e9, 0, 0.5);
    for (let i = 0; i < rm.length; i++) { const u = i / rm.length; rm[i] *= Math.pow(u, 1.6); }
    K.put(fadeEnd(rm, 0.02), tb, { vol: 0.14, norm: true });
  }
});
