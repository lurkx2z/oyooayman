/* =====================================================================
   SOUND · EFFECTS — the events, each at its story second (the clock only runs forward, so each is heard once; an
   event the clock skips over is not heard):
     a chime at every sunrise we see (they come faster and faster: the film's pulse); the TV's static, then the news;
     the first quake (the room rattling), the wall clock ticking at real speed; the kitchen scale's beep; the marble
     rolling across the boards; the second quake in the street (car alarms going off); the car without its handbrake
     (its tyres, the railings, its owner running); footsteps in the street; the girl landing her jumps; the street
     lights clicking on; the sofa and the furniture scraping across your floor into the window wall; the spire
     cracking, falling, landing; the parked cars' locked tyres dragging sideways into the railings.
   ===================================================================== */

dsSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, f = dsFilmAt, sh = (m) => DS_SHOTS.find((s) => s.mode === m), inShot = (t, m) => { const S = sh(m); return t >= S.t0 - 0.02 && t < S.t1; };
  const room = K.verb('room', 0.5, { bright: 0.6, damp: 3.5, wet: 0.25 }), street = K.verb('street', 1.6, { bright: 0.5, damp: 2.2, wet: 0.3 });
  const bisect = (g, a, b, v) => { for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (g(m) < v) a = m; else b = m; } return (a + b) / 2; };
  // ---- a chime at every sunrise on screen: a small high bell, a step up the scale each day
  { const scale = ['A5', 'B5', 'C#6', 'E6', 'F#6', 'A6']; for (let k = 0; k < 18; k++) { const t = dsSeen(dsSunrise(k)); if (t != null && t > 0.5 && t < DS.end) K.put(fx.bellBuf(dsMidi(scale[k % 6])), t, { vol: 0.16, pan: k % 2 ? 0.25 : -0.25, room: street, wet: 0.6 }); } }
  // ---- the TV: static (no signal, from the dish shot's evening), then the news (a murmur of a voice, a sting)
  { const S = sh('tv'); dsBed(K, S.t0, S.t1, { colour: 'white', f: [['hp', 1800], ['lp', 7000]], vol: 0.16, am: 0.2, wr: 9, room, wet: 0.3 }); }
  { const S = sh('news'), d = S.t1 - S.t0, n = Math.ceil(d * sr), y = dsNoise(fx, n, 'pink'), w = fx.wander(5.5);
    for (let i = 0; i < n; i++) { const t = i / sr, syl = Math.max(0, w(t)) ** 1.5 * (Math.sin(2 * Math.PI * 1.1 * t) > -0.6 ? 1 : 0.1); y[i] *= syl * Math.min(1, t / 0.3); }
    DSX.bq(y, 'bp', 650, 1.2, sr); DSX.bq(y, 'bp', 1400, 0.9, sr); K.put(y, S.t0, { vol: 0.12, norm: true, room, wet: 0.4, pan: -0.3 }); }
  // ---- the wall clock ticking, at real speed in your room
  for (const p of dsPlaces().filter((q) => q.where === 'in')) {
    for (let t = p.t0; t < p.t1; ) { const rate = dsRateAt(t + 1e-3); if (rate > 1.5) break; const s = dsStoryAt(t), nx = Math.floor(s) + 1, tt = t + (nx - s) / rate; if (tt >= p.t1) break;
      K.put(fx.hit(fx.woodModes(2600, 0.5), { width: 0.0008, amp: 0.6, noise: 0.4, nlen: 0.004, nhp: 2000, len: 0.08 }), tt, { vol: 0.07, pan: -0.5, room, wet: 0.4 }); t = tt + 1e-3; } }
  // ---- the quakes: a deep rumble; in the room the cups, the window and the lamp rattle; in the street car alarms go off
  const quake = (s0, d, inRoom) => {
    const t0 = f(s0), n = Math.ceil((d + 2) * sr), y = dsNoise(fx, n, 'brown');
    for (let i = 0; i < n; i++) { const s = s0 + i / sr; y[i] *= dsQuake(s) * 1.4 + (s > s0 + d ? Math.exp(-(s - s0 - d) / 0.6) * 0.3 : 0); }
    DSX.bq(y, 'lp', 140, 0.7, sr); K.putLR(y, Float32Array.from(y), t0, { vol: 1.0, norm: true });
    for (let k = 0; k < (inRoom ? 70 : 30); k++) { const tt = s0 + fx.r.range(0.3, d - 0.5), q = dsQuake(tt); if (fx.r.next() > q) continue;
      const m = inRoom ? [fx.cupModes(), fx.saucerModes(), fx.glassModes(), fx.panelModes(0.5)][k % 4] : fx.stoneModes(fx.r.range(0.6, 1.2));
      K.put(fx.hit(m, { width: 0.001, amp: 0.5, noise: 0.3, nlen: 0.01, nhp: 800, len: 0.6 }), f(tt), { vol: 0.06 + 0.12 * q, pan: fx.r.range(-0.7, 0.7), room: inRoom ? room : street, wet: 0.5 }); }
  };
  quake(DS.sQuake, 9, true); quake(dsAt(3, 20, 10, 2), 10, false);
  { const t = f(dsAt(3, 20, 10, 4.5)), S = sh('quake2'), d = S.t1 - t + 0.3; if (d > 0.2) { K.put(dsAlarm(fx, d), t, { vol: 0.16, pan: 0.5, room: street, wet: 0.5 }); K.put(dsAlarm(fx, d - 1.1, { f1: 1240, f2: 990, per: 0.18 }), t + 1.1, { vol: 0.1, pan: -0.6, room: street, wet: 0.6 }); } }
  // ---- the kitchen scale's beep
  K.put(fx.beep(2400, 0.09), sh('scale').t0 + 0.5, { vol: 0.08, room, wet: 0.2 });
  // ---- the marble: it rolls off across the boards (slowly gathering speed), ticking on each seam
  { const s0 = DS.sMarble + 1.5, t0 = f(s0), S = sh('marble'), d = S.t1 - t0 + 0.2; if (d > 0.3) K.put(dsRoll(fx, d, { v: (u) => 0.25 + 0.75 * u, seam: 1.2, tick: 1400, lp: 2600, hp: 120 }), t0, { vol: 0.32, norm: true, room, wet: 0.3, pan: 0.2 }); }
  // ---- the car without its handbrake: tyres over the asphalt, faster; into the park railings; its owner running
  { const F = dsSlider(DS_MU.car, 1, 200, 0.35), stop = 3.2 - (-12.35 + 4.12 / 2 + 0.15), sHit = bisect(F, F.s0, F.s0 + 200, stop), t0 = f(F.s0), tH = f(sHit);
    K.put(dsRoll(fx, tH - t0, { v: (u) => 0.15 + 0.85 * u * u, lp: 900 }), t0, { vol: 0.5, norm: true, room: street, wet: 0.3, pan: 0.2 });
    K.put(fx.hit(fx.panelModes(0.9), { width: 0.004, amp: 1, noise: 0.5, nlen: 0.06, nhp: 200, len: 1.4 }), tH, { vol: 0.7, room: street, wet: 0.4 });
    K.put(fx.hit(fx.metalModes(310, 1.5), { width: 0.002, amp: 0.8, noise: 0.3, nlen: 0.02, nhp: 600, len: 2.2 }), tH + 0.01, { vol: 0.4, room: street, wet: 0.5, pan: 0.3 });
    for (let t = f(F.s0 + 0.7), i = 0; t < sh('car2').t1; t += 0.31, i++) K.put(fx.step({ weight: 0.8, s: 1.1 }), t, { vol: 0.16, room: street, wet: 0.3, pan: -0.2 }); }
  // ---- footsteps along the street (the walkers on Friday evening)
  { const S = sh('lighter'); for (const [per, v, pan, ph] of [[0.52, 0.1, -0.3, 0.1], [0.55, 0.08, 0.2, 0.3], [0.5, 0.06, 0.5, 0.05], [0.58, 0.05, -0.6, 0.2], [0.72, 0.07, 0.1, 0.4]]) for (let t = S.t0 + ph; t < S.t1; t += per) K.put(fx.step({ weight: 0.55 }), t, { vol: v, pan, room: street, wet: 0.35 }); }
  // ---- the girl landing her jumps (soft thuds), the hop off each time
  { const s0 = dsAt(5, 19, 45), ge = dsGEff(s0), per = 2 * 2.6 / ge + 0.42, S = sh('jump');
    for (let k = 0; k < 20; k++) { const s = s0 - 0.3 + k * per, t = f(s); if (t > S.t0 && t < S.t1) K.put(fx.step({ weight: 0.7, body: 95, s: 0.8 }), t, { vol: 0.2, room: street, wet: 0.3 }); } }
  // ---- the street lights coming on (a click and the ballast's hum), one after another
  { const S = sh('lamps'), tOn = bisect((t) => -dsDaylight(dsStoryAt(t)), S.t0, S.t1, -0.45);
    for (let k = 0; k < 7; k++) { const t = tOn + k * 0.22 + 0.05 * Math.sin(k * 3); if (t < S.t1 - 0.3) { K.put(fx.hit(fx.metalModes(1900, 0.2), { width: 0.0005, amp: 0.5, noise: 0.6, nlen: 0.004, nhp: 2500, len: 0.1 }), t, { vol: 0.08 / (1 + k * 0.3), pan: 0.4 - k * 0.12, room: street, wet: 0.5 });
      dsTone(K, t, S.t1 - t + 0.1, 100, [[1, 1], [2, 0.5], [3, 0.2]], (u) => Math.min(1, u * 6) * Math.min(1, (1 - u) * 8), { vol: 0.02 / (1 + k * 0.5), pan: 0.4 - k * 0.12 }); } } }
  // ---- Saturday, 0:04:30: your furniture breaks loose and scrapes south into the window wall
  { const S = sh('slide');
    for (const sl of DS_ROOM_SLIDE) { const t0 = f(sl.f.s0), tH = f(sl.hit); if (!inShot(t0, 'slide') && !inShot(tH, 'slide')) continue;
      const big = { sofa: 1, armchair: 0.8, table: 0.6, stand: 0.7, tv: 0.5, rug: 0.25, pouffe: 0.4, side: 0.35, tlamp: 0.3, flamp: 0.35 }[sl.id] || 0.4, a = Math.max(t0, S.t0), b = Math.min(tH, S.t1);
      if (b - a > 0.1) K.put(dsScrape(fx, b - a, { f: 300 + 500 * (1 - big), rate: 12 + 20 * (1 - big) }), a, { vol: 0.25 * big + 0.05, norm: true, room, wet: 0.35, pan: MathX.clamp(sl.id.length % 3 - 1, -1, 1) * 0.4 });
      if (inShot(tH, 'slide')) K.put(fx.hit(sl.id === 'tv' || sl.id === 'tlamp' ? fx.glassModes() : fx.woodModes(110 + 200 * (1 - big), 1.5), { width: 0.004 * big + 0.001, amp: 1, noise: 0.4, nlen: 0.05, nhp: 150, len: 1.2 }), tH, { vol: 0.25 + 0.4 * big, room, wet: 0.4 }); }
    // the radiator under the window rings when the sofa hits it
    const so = DS_ROOM_SLIDE.find((x) => x.id === 'sofa'); if (inShot(f(so.hit), 'slide')) K.put(fx.hit(fx.metalModes(180, 2), { width: 0.003, amp: 0.8, noise: 0.2, nlen: 0.02, nhp: 300, len: 2.5 }), f(so.hit) + 0.01, { vol: 0.35, room, wet: 0.5 }); }
  // ---- the spire: it cracks at its foot, leans, falls; the crash and the dust
  { const D = DS_SPIRE, sGo = D.s0, sLand = D.sLand, S = sh('spire');
    if (inShot(f(sGo), 'spire')) K.put(dsCrack(fx, { s: 0.6, len: 2.0 }), f(sGo), { vol: 0.55, room: street, wet: 0.5, pan: 0.4 });
    K.put(fx.creak(Math.max(0.3, f(sLand) - f(sGo) - 0.3), fx.stoneModes(0.5), { rate: [6, 30], jit: 0.4, env: (u) => Math.sin(Math.PI * Math.min(1, u * 1.2)) }), f(sGo) + 0.15, { vol: 0.35, lp: 1500, room: street, wet: 0.5, pan: 0.4 });
    { const d = f(sLand) - f(sGo), n = Math.ceil(d * sr), w = dsNoise(fx, n, 'pink'); for (let i = 0; i < n; i++) w[i] *= Math.pow(i / n, 3); dsSweepPut(K, w, f(sGo), 'bandpass', 1.2, [300, 500, 900, 1400], { vol: 0.25, pan: 0.4 }); }
    K.put(fx.hit([[45, 1.0, 1], [70, 0.7, 0.7], [110, 0.5, 0.5], [180, 0.3, 0.35], [400, 0.15, 0.2]], { width: 0.02, amp: 1, noise: 0.6, nlen: 0.3, nhp: 80, len: 3.5 }), f(sLand), { vol: 1.0, room: street, wet: 0.5, pan: 0.4 });
    for (let k = 0; k < 14; k++) K.put(dsCrack(fx, { s: fx.r.range(0.8, 1.6), len: 0.6 }), f(sLand) + 0.1 + fx.r.range(0, 1.6), { vol: 0.12, room: street, wet: 0.5, pan: fx.r.range(0, 0.8) });
    void S; }
  // ---- the parked cars: locked tyres dragging sideways over the asphalt, into the railings
  { const S = sh('cars');
    for (const b of DS_ST.bodies.filter((x) => x.kind === 'car' && x.id !== 'car10')) { const F = dsSlider(b.dir > 0 ? DS_MU.cars : DS_MU.cars2, 1, 300), stop = b.pos[2] - (-12.35 + 1.0), sHit = bisect(F, F.s0, F.s0 + 300, stop), t0 = f(F.s0), tH = f(sHit);
      const near = Math.max(0, 1 - Math.abs(b.pos[0] + 28) / 30); if (near <= 0) continue;
      const a = Math.max(t0, S.t0), e = Math.min(tH, S.t1 + 0.3); if (e - a > 0.15) K.put(dsScrape(fx, e - a, { f: 1100, q: 1.4, rate: 45 }), a, { vol: 0.3 * near, norm: true, room: street, wet: 0.35, pan: MathX.clamp((b.pos[0] + 24) / 20, -0.8, 0.8) });
      if (inShot(tH, 'cars')) K.put(fx.hit(fx.panelModes(0.8), { width: 0.004, amp: 1, noise: 0.5, nlen: 0.05, nhp: 200, len: 1.2 }), tH, { vol: 0.5 * near, room: street, wet: 0.4 }); } }
  // ---- a dawn chorus over the park (the birds beat), wings
  { const S = sh('birds'); for (let t = S.t0 + 0.1; t < S.t1; t += 0.05 + 0.1 * fx.r.next()) K.put(dsChirp(fx, { f0: fx.r.range(2200, 5200) }), t, { vol: fx.r.range(0.04, 0.12), pan: fx.r.range(-0.9, 0.9), hp: 1400, room: street, wet: 0.3 }); }
});
