/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: saPlaceAt). The beds sit well under the score (mix.js; the
   owner's rule: the music clearly leads, beds about 10 dB under it):
     before 2:00   your kitchen: a quiet room tone, the fridge's hum, the street through the glass
     2:00–2:00:03  nothing at all: sound is air moving
     after         the kitchen's room tone; outside a shocked murmur, birds coming back, car alarms set off by the jolt,
                   from a minute on sirens far off. No wind anywhere, no traffic: every engine stalled
   ===================================================================== */

saSound('amb', 'beds', function (ctx, bus, K) {
  const fx = K.fx, L = SA.tLock, R = SA.tRelease, air = (t) => (t < L ? 1 : t < R ? 0 : 1);
  for (const p of saPlaces()) {
    let a = p.t0, b = p.t1 + 0.06; const m = p.shot.mode;
    if (b - a < 0.05 || a > SA.end + 1) continue;
    // (the beds stop dead at the lock and come back at the release)
    const parts = []; if (a < L) parts.push([a, Math.min(b, L)]); if (b > R) parts.push([Math.max(a, R), b]);
    for (const [a0, b0] of parts) {
      const fi = Math.abs(a0 - R) < 0.01 ? 1.2 : 0.04, fo = Math.abs(b0 - L) < 0.01 ? 0.004 : 0.04;
      if (p.where === 'in') {
        saBed(K, a0, b0, { colour: 'brown', f: [['lp', 240]], vol: 0.2, am: 0.1, fi, fo });
        saBed(K, a0, b0, { colour: 'pink', f: [['bp', 520, 0.6], ['lp', 1300]], vol: 0.18, am: 0.3, wr: 0.6, fi, fo });
        saTone(K, a0, b0 - a0, 50, [[1, 0.5], [2, 1], [3, 0.35], [4, 0.2]], (u, t) => Math.min(1, t / fi, (b0 - a0 - t) / fo), { vol: 0.025, pan: -0.6 });
      } else {
        // after: a shocked murmur (people talking low), no wind, no traffic
        saBed(K, a0, b0, { colour: 'pink', f: [['bp', 450, 0.7], ['lp', 1500]], vol: 0.3, am: 0.6, wr: 1.6, fi, fo });
        saBed(K, a0, b0, { colour: 'brown', f: [['lp', 200]], vol: 0.18, am: 0.3, wr: 0.2, fi, fo });
        if (m === 'fountain' || m === 'carp') saBed(K, a0, b0, { colour: 'white', f: [['hp', 900], ['lp', 6000]], vol: 0.2, am: 0.15, wr: 2.5, fi, fo });
      }
    }
  }
  // birds (before 2:00 faintly through the glass; after the release, outdoors, a while after they've landed)
  const inside = saPlaceAt('in');
  for (let t = 0.3; t < SA.end; ) {
    const s = saStoryAt(t), ok = t < L || s > 12;
    if (ok && fx.r.next() < 0.4) K.put(saChirp(fx, { f0: fx.r.range(2600, 4600) }), t, { vol: 0.06 * (0.15 + 0.85 * (1 - inside(t))), pan: fx.r.range(-0.8, 0.8), hp: 1500 });
    t += 0.3 + 0.7 * fx.r.next();
  }
  // car alarms set off by the jolt (from the release; far ones keep going)
  for (const [t0, f1, f2, per, pan, v] of [[f2t(3.6), 960, 760, 0.36, -0.5, 0.03], [f2t(4.4), 1200, 900, 0.5, 0.6, 0.022], [f2t(6.0), 880, 660, 0.28, 0.2, 0.018]]) {
    const t1 = SA.end + 0.5; if (t0 >= t1) continue;
    const y = saAlarm(fx, t1 - t0, { f1, f2, per }), ins = inside;
    for (let i = 0; i < y.length; i++) { const t = t0 + i / K.sr; y[i] *= air(t) * (1 - 0.8 * ins(t)) * (t < saB('echo') ? 0.6 : 1); }
    K.put(y, t0, { vol: v, pan, lp: 2600 });
  }
  // sirens, far off, from a minute on (a slow wail, two of them)
  { const t0 = saB('sirens') + 1.0, t1 = SA.end + 0.5, d = t1 - t0, n = Math.ceil(d * K.sr);
    for (const [per, f0, pan, v, off] of [[5.5, 620, 0.45, 0.07, 0], [4.2, 700, -0.3, 0.04, 6]]) { const y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const t = i / K.sr, w = 0.5 - 0.5 * Math.cos(2 * Math.PI * t / per), fr = f0 + 380 * w; ph += 2 * Math.PI * fr / K.sr; y[i] = (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * Math.min(1, Math.max(0, t - off) / 3) * (1 - 0.7 * inside(t0 + t)); }
      SAX.bq(y, 'lp', 1500, 0.7, K.sr); K.put(y, t0, { vol: v, norm: true, pan, room: K.verb('far', 2.2, { bright: 0.4, damp: 2.0, wet: 0.4 }) }); } }
  function f2t(s) { return saFilmAt(s); }
});
