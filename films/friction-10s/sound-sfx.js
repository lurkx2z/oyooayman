/* =====================================================================
   SOUND · SFX — the events. Each one happens at a story second (physics.js) and sounds wherever the picture passes
   that second (fzWhen): at real speed in real time, and in every replay slowed down with the picture (lower, longer,
   in a bigger space: fzPitch). The house's sounds play when we're in the house, the street's in the street (the big
   ones come through the walls, muffled). Without friction nothing scrapes, squeaks or skids: things slide in silence.
     before s = 0     the brakes outside, screeching; the cat's leap
     s = 0            the screech stops dead (nothing to squeal against); the scaffold's clamps all let go at once
     the house        the cat lands, the mug's clink and smash, your phone, your gasp and fall, the slap, the hook, the
                      wall cabinets (the screws, the drop, the glasses, the plates), the TV, the shelf, the curtains'
                      cotton coming apart, the sugar pouring, the wall clock's ticks, the sofa hitting the lamp
     the street       the crash into the bus, the cyclist going over, the walker, the dog's claws, the ladder, the
                      scaffold landing, the sand
     s = 10           everything grips at once: every tyre screeches, bodies and bins tumble, the cat's claws catch;
                      the bus goes over
     film-time marks  the clock slowing (a tape stopping), the rewinds, the count down's ticks, the phone lighting up
   ===================================================================== */

fzSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, r = new RNG(5501);
  const room = K.verb('room', 0.9, { bright: 0.55, damp: 5, wet: 0.22 });
  const street = K.verb('street', 1.5, { bright: 0.5, damp: 4, wet: 0.2 });
  const slowHall = K.verb('slow', 3.2, { bright: 0.4, damp: 2.4, shape: 1.8, wet: 0.35 });
  const rev = (y) => { const z = new Float32Array(y.length); for (let i = 0; i < y.length; i++) z[i] = y[y.length - 1 - i]; return z; };
  const mix = (...parts) => { const n = Math.max(...parts.map(([y, dt]) => y.length + Math.round(dt * sr))), out = new Float32Array(n); for (const [y, dt, g] of parts) fzAddAt(out, y, dt, g ?? 1, sr); return out; };
  const body = (w = 1, f = 62) => fx.woodStep({ weight: w, body: f, scuff: 0 });
  // an event at story second sE: place 'in' | 'out' | 'any'; make() builds it once (mono, or { L, R }); o.vol, o.pan,
  // o.pred (which shots), o.big (heard through the walls when we're on the other side), o.fixed (no slow-down)
  const ev = (sE, place, make, o = {}) => {
    let buf = null;
    for (const w of fzWhen(sE, o.pred)) {
      const here = place === 'any' || (place === 'in') === w.inside;
      if (!here && !o.big) continue;
      buf = buf || make();
      const pr = o.fixed ? 1 : fzPitch(w.rate), slow = pr < 0.95, rm = slow ? slowHall : w.inside ? room : street;
      const opt = { vol: (o.vol || 0.05) * (here ? 1 : 0.3) * (slow ? 0.85 : 1), norm: true, pan: o.pan || 0, room: rm, wet: slow ? 0.6 : (o.wet ?? 0.3), rate: pr, stop: Math.min(w.shot.t1 + (o.hang || 0), FZ.end + 1.2), fade: 0.1 };
      if (!here) opt.lp = 450;
      if (buf.L && here) K.putLR(buf.L, buf.R, w.t, opt); else K.put(buf.L || buf, w.t, opt);
    }
  };
  // a run of events every `every` story seconds from sA to sB (a cat's paws, a dog's claws), in the shots pred picks
  const series = (sA, sB, every, place, make, o = {}) => {
    const bufs = [make(), make(), make()];
    for (const sp of fzSpan(sA, sB, o.pred)) {
      const here = place === 'any' || (place === 'in') === sp.inside; if (!here) continue;
      const pr = fzPitch(sp.rate), slow = pr < 0.95;
      let k = Math.ceil((sp.sA - sA) / every);
      for (let s = sA + k * every; ; s = sA + ++k * every) {
        const t = sp.tA + (s - sp.sA) / sp.rate; if (t >= sp.tB || s >= sB) break;
        K.put(bufs[k % 3], t + r.range(-0.01, 0.01) / Math.max(sp.rate, 0.2), { vol: (o.vol || 0.02) * r.range(0.7, 1.0), norm: true, pan: (o.pan || 0) + r.range(-0.15, 0.15), rate: pr, room: slow ? slowHall : room, wet: slow ? 0.5 : 0.25 });
      }
    }
  };

  // ================================================================================================= the house
  const C = FZ_CAT, Mg = FZ_MUG;
  // the cat: lands on the island (stone), yowls as she skids, drops to the floor, thumps into the units, complains
  ev(0.0, 'in', () => fx.hit(fx.stoneModes(1.5).map(([f, tau, a]) => [f, tau * 1.5, a]), { width: 0.006 }), { vol: 0.045, pan: 0.2 });
  ev(0.08, 'in', () => fzMeow(fx, { d: 0.5, f0: [520, 800, 620], open: 1.0 }), { vol: 0.045, pan: 0.15 });
  ev(C.land, 'in', () => body(0.35, 110), { vol: 0.035, pan: -0.1 });
  ev(C.hitWall, 'in', () => mix([fx.hit(fx.woodModes(135, 1.4), { width: 0.004 }), 0], [fzMeow(fx, { d: 0.4, f0: [420, 560, 380], open: 0.5, thin: 0.25 }), 0.08, 0.6]), { vol: 0.055, pan: -0.25 });
  // her paws on the floor, running on the spot (the claws can't catch)
  series(C.run, FZP.tBack, 0.085, 'in', () => mix([fx.hit(fx.woodModes(r.range(320, 420), 0.4), { width: 0.004 }), 0], [fx.hit([[r.range(4800, 6200), 0.003, 1]], { width: 0.0002 }), 0.004, 0.4]), { vol: 0.012, pan: -0.2, pred: (s) => s.mode === 'catrun' || s.mode === 'count' || s.mode === 'cat2' });
  // the mug: the cat's shoulder (a clink), off the edge, the smash
  ev(Mg.hit, 'in', () => fx.hit(fx.cupModes(), { width: 0.0004 }), { vol: 0.04, pan: 0.05 });
  ev(Mg.smash, 'in', () => fx.smash({ v: 4.1, g: FZP.g, pan: -0.25 }), { vol: 0.12 });
  // your phone: squeezed out of your hand, lands screen-up with two little bounces; then slides without a sound
  // ...and three little clacks as it drops off your doorstep onto each step below, then the path
  for (const [i, t] of FZ_STEPS.lands().entries()) ev(t, 'out', () => fx.hit([[2900 + 260 * i, 0.016, 1], [4700, 0.01, 0.4], [1100, 0.02, 0.5]], { width: 0.0006, extra: [[0.045, 0.0005, 0.25]] }), { vol: 0.05 - 0.008 * i, pan: 0.1 });
  ev(FZ_PHONE.land, 'in', () => fx.hit([[3150, 0.02, 1], [5100, 0.012, 0.5], [820, 0.03, 0.6], [1650, 0.02, 0.4]], { width: 0.0008, extra: [[0.055, 0.0006, 0.35], [0.1, 0.0005, 0.12]] }), { vol: 0.07, pan: -0.2 });
  // you: the gasp as your feet go, the slap on the island's edge, the floor, the hook on the oven handle
  ev(FZ_FALL.slip, 'in', () => fx.breath(0.32, { inhale: true }), { vol: 0.05 });
  ev(FZ_SLAP.t[1], 'in', () => fx.slap(fx.stoneModes(1.3), { amp: 0.9 }), { vol: 0.07, pan: 0.25 });
  ev(FZ_FALL.down, 'in', () => mix([body(1.0, 58), 0], [fx.breath(0.4, { voice: 0.5, f0: 105 }), 0.02, 0.35]), { vol: 0.12 });
  ev(FZ_HOOK.t[1] - 0.05, 'in', () => mix([fx.hit(fx.metalModes(820, 0.5), { width: 0.0015 }), 0], [fx.hit(fx.glassModes(), { width: 0.002 }), 0.004, 0.5]), { vol: 0.06, pan: -0.3 });
  // the wall cabinets: the screws turning out (a fast metal tick), the drop onto the worktop, the glasses, onto its back
  ev(0.0, 'in', () => fx.creak(0.12, [[2400, 0.004, 1], [4100, 0.003, 0.5], [6300, 0.002, 0.3]], { rate: [140, 220], env: (u) => Math.sin(Math.PI * u) }), { vol: 0.03, pan: -0.4 });
  ev(FZ_CABT.land, 'in', () => mix([fx.hit(fx.woodModes(105, 1.5), { width: 0.004, noise: 0.3 }), 0], [fx.hit(fx.woodModes(150, 1.2), { width: 0.004 }), 0.035, 0.7], [fx.hit(fx.glassModes().map(([f, tau, a]) => [f * 4, tau, a]), { width: 0.0006 }), 0.01, 0.4]), { vol: 0.12, pan: -0.45, big: true });
  ev(FZ_CABT.land + 0.04, 'in', () => fx.smash({ v: 3.0, g: FZP.g, pitch: 1.5, len: 1.2, pan: -0.4 }), { vol: 0.06 });
  ev(FZ_CABT.flat, 'in', () => fx.hit(fx.woodModes(90, 1.6), { width: 0.006, noise: 0.2 }), { vol: 0.09, pan: -0.45 });
  // their plates: slid out across the worktop, off its edge, smashed on the floor one after another
  for (const [i, k] of [[0, 0], [0, 2], [0, 4], [1, 1], [1, 3], [1, 5]]) {
    const te = 0.46 + 0.03 * k + 0.05 * i, v = 0.8 + 0.12 * k, tHit = te + (FZ_H.runD - 0.25) / v + Math.sqrt(2 * FZ_H.top / FZP.g);
    ev(tHit, 'in', () => fx.smash({ v: 3.6, g: FZP.g, pitch: r.range(0.75, 0.95), pan: -0.5 + 0.1 * k }), { vol: 0.07 });
  }
  // the TV: the wall plugs give (plaster), onto the sideboard, onto the floor
  ev(0.1, 'in', () => fx.rustle(0.15, { density: 600, rub: 0.1, lo: 1500, hi: 7000, grain: 0.003 }), { vol: 0.02, pan: 0.5 });
  ev(0.4, 'in', () => fx.hit(fx.panelModes(0.8).map(([f, tau, a]) => [f * 1.6, tau, a]), { width: 0.004, noise: 0.2 }), { vol: 0.07, pan: 0.5 });
  ev(0.86, 'in', () => mix([fx.hit(fx.panelModes(1.2), { width: 0.005, noise: 0.4 }), 0], [fx.smash({ v: 2.2, g: FZP.g, pitch: 0.6, len: 1.0 }).L, 0.005, 0.5]), { vol: 0.1, pan: 0.5, big: true });
  // the shelf onto the sofa, its books
  ev(0.48, 'in', () => mix([fx.hit(fx.woodModes(80, 0.6), { width: 0.012 }), 0], ...[0.06, 0.14, 0.21, 0.3].map((dt) => [fx.hit(fx.woodModes(r.range(240, 330), 0.6), { width: 0.005 }), dt, r.range(0.3, 0.6)])), { vol: 0.06, pan: -0.5 });
  // the curtains' cotton coming apart; the sugar pouring (rustles over each stretch of film that shows them)
  for (const sp of fzSpan(0.15, 1.5, (s) => s.mode === 'curtains' || s.mode === 'house')) { const d = sp.tB - sp.tA; K.put(fx.rustle(d, { density: 260, rub: 0.25, lo: 900, hi: 5000, grain: 0.02, env: (u) => Math.min(1, u / 0.2) * Math.min(1, (1 - u) / 0.1) }), sp.tA, { vol: 0.03, norm: true, pan: -0.3, room: slowHall, wet: 0.4 }); }
  for (const sp of fzSpan(0.0, 2.0, (s) => s.mode === 'sugar')) { const d = sp.tB - sp.tA; K.put(fx.rustle(d, { density: 4000, rub: 0.4, lo: 2500, hi: 9000, grain: 0.0015, env: (u) => Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.08) }), sp.tA, { vol: 0.03, norm: true, pan: 0.1, room, wet: 0.3 }); }
  // "Let's not look down": a seam giving
  K.put(fx.rustle(0.35, { density: 900, rub: 0.15, lo: 1800, hi: 7000, grain: 0.004 }), fzCap('clothes', 1).show - 0.25, { vol: 0.03, norm: true });
  // the wall clock, ticking the story's seconds (far apart when the picture is slowed down)
  for (let k = 1; k < 10; k++) ev(k, 'in', () => fzClick(fx, { f: 3400, tau: 0.0025, len: 0.05, hp: 1200 }), { vol: 0.022, pan: 0.35, pred: (s) => s.mode !== 'count' });
  // the sofa reaches the lamp: it goes over
  ev(FZ_LOOSE_ID.sofa.tStop, 'in', () => mix([fx.hit(fx.woodModes(95, 1.0), { width: 0.008 }), 0], [fx.smash({ v: 2.5, g: FZP.g, pitch: 1.2, len: 1.2 }).L, 0.45, 0.6]), { vol: 0.08, pan: -0.3 });

  // ================================================================================================= the street
  // the brakes: a screech from 0.55 s before, cut dead at s = 0 (in every shot that shows it; muffled indoors)
  {
    const SC = fzScreech(fx, 0.62, { env: (u) => Math.min(1, u / 0.05) });
    for (const sp of fzSpan(FZ_CAR.brake, 0)) {
      const pr = fzPitch(sp.rate), here = !sp.inside, off = Math.max(0, sp.sA - FZ_CAR.brake);
      K.put(SC, sp.tA, { vol: here ? 0.13 : 0.05, norm: true, pan: 0.4, rate: pr, offset: off, stop: sp.tB + 0.008, fade: 0.008, lp: here ? undefined : 2200, room: street, wet: 0.25 });
    }
  }
  // the car into the bus's back corner
  ev(FZ_CRASH.t, 'out', () => mix([fzCrunch(fx, { big: 1.1 }), 0], [fx.smash({ v: 5, g: FZP.g, pitch: 1.3, len: 1.4 }).L, 0.01, 0.6]), { vol: 0.15, pan: 0.3, big: true });
  // the cyclist goes over (the bell rings as it hits); the walker's gasp and fall; her dog's claws on the paving
  ev(1.04, 'out', () => mix([fx.hit(fx.metalModes(620, 0.6), { width: 0.002, noise: 0.3 }), 0], [fx.bellBuf(fzMidi('A6')), 0.01, 0.25], [body(0.7, 70), 0.08, 0.8]), { vol: 0.08, pan: -0.2 });
  ev(FZ_WALKER.slip + 0.02, 'out', () => fx.breath(0.3, { inhale: true }), { vol: 0.04, pan: 0.2 });
  ev(FZ_WALKER.slip + 0.42, 'out', () => mix([fx.step({ weight: 1.0 }), 0], [fx.step({ weight: 0.7 }), 0.07, 0.8]), { vol: 0.06, pan: 0.2 });
  ev(0.35, 'out', () => { const y = fx.arr(0.3), m = Math.round(0.12 * sr), z = fzNoise(fx, m, 'pink'); FZX.bq(z, 'bp', 820, 3, sr); for (let i = 0; i < m; i++) y[i] = z[i] * Math.sin(Math.PI * i / m); return y; }, { vol: 0.04, pan: 0.3 });
  series(0.3, FZP.tBack, 0.06, 'out', () => fx.hit([[r.range(3800, 5200), 0.004, 1], [r.range(1400, 1900), 0.006, 0.4]], { width: 0.0002 }), { vol: 0.012, pan: 0.25, pred: (s) => s.mode === 'walk' || s.mode === 'count' });
  // the window cleaner's ladder: he lands on the pavement, the ladder clatters down, his bucket
  ev(FZ_LADDER.flat - 0.12, 'out', () => body(0.9, 64), { vol: 0.06, pan: -0.3 });
  ev(FZ_LADDER.flat, 'out', () => mix([fx.hit(fx.metalModes(420, 1.2), { width: 0.002, noise: 0.3 }), 0], [fx.hit(fx.metalModes(1130, 0.8), { width: 0.0015 }), 0.004, 0.6], [fx.hit(fx.metalModes(560, 0.8), { width: 0.002 }), 0.12, 0.4]), { vol: 0.1, pan: -0.35 });
  ev(FZ_LADDER.flat + 0.1, 'out', () => mix([fx.hit(fx.panelModes(0.5).map(([f, tau, a]) => [f * 2.2, tau, a]), { width: 0.003 }), 0], [fx.liquid(0.6, (t) => Math.exp(-t * 6)), 0.01, 0.8]), { vol: 0.04, pan: -0.4 });
  // the scaffold: every clamp lets go at once; the tubes and boards land; the standards topple into the road
  ev(0.0, 'out', () => { const L = fx.arr(0.4), R = fx.arr(0.4); for (let k = 0; k < 14; k++) FZX.mixIn(L, R, fx.clamp({ pitch: r.range(0.85, 1.2) }), Math.round(r.range(0, 0.05) * sr), r.range(0.5, 1), r.range(-0.8, 0.8)); return { L, R }; }, { vol: 0.06, pred: (s) => s.mode !== 'open' && s.mode !== 'replay' });
  for (const h of FZ_SCAF.lifts) ev(Math.sqrt(2 * h / FZP.g), 'out', () => mix([fzCrunch(fx, { big: 0.6, len: 1.2, scrape: 0 }), 0], ...[0.02, 0.05, 0.09].map((dt) => [fx.hit(fx.woodModes(r.range(150, 210), 0.9), { width: 0.004 }), dt, 0.6])), { vol: 0.1, pan: 0.1 });
  ev(1.47, 'out', () => { const L = fx.arr(1.6), R = fx.arr(1.6); for (let k = 0; k < 5; k++) FZX.mixIn(L, R, fx.hit(fx.metalModes(r.range(260, 360), 1.6), { width: 0.002, noise: 0.2 }), Math.round((0.03 * k + r.range(0, 0.02)) * sr), r.range(0.6, 1), -0.6 + 0.3 * k); return { L, R }; }, { vol: 0.11 });
  // the builders' sand pouring down the street
  for (const sp of fzSpan(0.05, 2.5, (s) => s.mode === 'sand' || s.mode === 'scaffold')) { const d = sp.tB - sp.tA; K.put(fx.rustle(d, { density: 3500, rub: 0.5, lo: 1800, hi: 8000, grain: 0.002, env: (u) => Math.min(1, u / 0.2) * Math.min(1, (1 - u) / 0.08) }), sp.tA, { vol: 0.03, norm: true, pan: 0.2, rate: fzPitch(sp.rate) < 0.95 ? 0.8 : 1, room: street, wet: 0.3 }); }

  // ================================================================================================= s = 10
  // outside: every tyre bites at once (each car screeches to a stop in a second or so); bins and bodies tumble
  ev(FZP.tBack, 'out', () => {
    const L = fx.arr(2.0), R = fx.arr(2.0);
    for (const [f, pan, d, g] of [[1.0, 0.5, 1.2, 1], [0.86, -0.4, 1.0, 0.8], [1.12, 0.1, 1.35, 0.7], [0.74, -0.75, 0.9, 0.6], [0.95, 0.8, 1.1, 0.5]]) FZX.mixIn(L, R, fzScreech(fx, d, { f, env: (u) => Math.min(1, u / 0.03) * Math.pow(1 - u, 0.6) }), Math.round(r.range(0, 0.04) * sr), g, pan);
    return { L, R };
  }, { vol: 0.15, big: true });
  ev(FZP.tBack + 0.15, 'out', () => mix(...[0, 0.08, 0.17, 0.26, 0.4].map((dt) => [fx.hit(fx.panelModes(0.6).map(([f, tau, a]) => [f * r.range(1.8, 2.6), tau, a]), { width: 0.004 }), dt, r.range(0.4, 0.8)])), { vol: 0.06, pan: -0.2 });
  ev(FZP.tBack + 0.25, 'out', () => mix([body(1.0, 60), 0], [body(0.8, 66), 0.3, 0.7], [fx.breath(0.35, { voice: 0.6, f0: 140 }), 0.05, 0.4]), { vol: 0.08, pan: 0.15 });
  ev(FZP.tBack + 0.05, 'out', () => fx.rustle(1.0, { density: 1400, rub: 0.7, lo: 600, hi: 5500, grain: 0.003, env: (u) => Math.pow(1 - u, 1.5) }), { vol: 0.04, pan: -0.1 });   // (the bike, scraping now)
  // the bus: its tyres bite, it rolls, lands on its side
  ev(FZP.tBack + 0.02, 'out', () => fzScreech(fx, 1.1, { f: 0.62, env: (u) => Math.min(1, u / 0.03) * Math.pow(1 - u, 0.5) }), { vol: 0.09, pan: 0.4, pred: (s) => s.mode === 'bus2' || s.mode === 'back' || s.mode === 'flash' });
  ev(FZP.tBack + 1.25, 'out', () => mix([fzCrunch(fx, { big: 2.2, len: 3.0 }), 0], [fx.smash({ v: 6, g: FZP.g, pitch: 0.75, len: 2.0 }).L, 0.02, 0.7], [fzCrunch(fx, { big: 1.4, len: 1.5, scrape: 0.4 }), 0.18, 0.5]), { vol: 0.18, pan: 0.3, big: true });
  // inside: the cat's claws catch (a scrabble) and she's gone; the fridge, still sliding at 3 km/h, rocks forward on
  // its front edge and drops back (a heavy thud, the bottles inside)
  ev(FZP.tBack, 'in', () => mix([fx.rustle(0.25, { density: 2000, rub: 0.3, lo: 2500, hi: 9000, grain: 0.002, env: (u) => Math.pow(1 - u, 1.2) }), 0], [fzMeow(fx, { d: 0.35, f0: [600, 760, 520], open: 0.8 }), 0.1, 0.5]), { vol: 0.05, pan: -0.2 });
  ev(FZP.tBack + 2 * fzTipInfo('fridge').tUp, 'in', () => mix([fx.hit(fx.panelModes(1.0), { width: 0.01, noise: 0.25 }), 0], [fx.hit(fx.glassModes(), { width: 0.002 }), 0.025, 0.3], [fx.hit(fx.glassModes(), { width: 0.002 }), 0.06, 0.2]), { vol: 0.08, pan: 0.4 });
  ev(FZP.tBack + 0.05, 'in', () => fx.creak(0.5, fx.woodModes(170, 0.8), { rate: [30, 70], env: (u) => Math.pow(1 - u, 1.3) }), { vol: 0.04, pan: 0.2 });   // (the furniture: wood dragging to a stop)

  // ================================================================================================= film-time marks
  // the clock slowing to 1/80 in the cold open: a tape stopping (a sine and a hiss falling away)
  {
    const [a, b] = [FZ.open.real, FZ.open.slow], d = b - a + 0.6, y = fx.arr(d); let ph = 0;
    for (let i = 0; i < y.length; i++) { const t = i / sr, u = MathX.clamp(t / (b - a), 0, 1), f = 320 * Math.pow(0.06, u); ph += 2 * Math.PI * f / sr; y[i] = Math.sin(ph) * Math.exp(-t / 0.9) * Math.min(1, t / 0.01); }
    const z = fzNoise(fx, y.length, 'pink'); for (let i = 0; i < z.length; i++) z[i] *= Math.exp(-i / (0.5 * sr));
    fzAddAt(y, fzSweep(z, sr, 'lowpass', 0.8, [6000, 2500, 900, 300, 120]), 0, 0.4, sr);
    K.put(y, a, { vol: 0.07, norm: true, room: slowHall, wet: 0.4 });
  }
  // the rewinds (back to the start of the second): a reversed rush, a tape whirr rising
  for (const sh of FZ_SHOTS.filter((s) => s.k !== 'open' && s.k.length > 2 && s.k[1][1] < s.k[0][1])) {
    const d = sh.k[1][0] - sh.k[0][0], n = Math.ceil(d * sr), z = fzNoise(fx, n, 'pink');
    for (let i = 0; i < n; i++) z[i] *= Math.pow(i / n, 1.5);
    const w = fzSweep(z, sr, 'bandpass', 1.4, [400, 900, 2000, 4200]); let ph = 0;
    for (let i = 0; i < n; i++) { const u = i / n; ph += 2 * Math.PI * (200 + 1400 * u * u) / sr; w[i] += 0.12 * Math.sin(ph) * u; }
    K.put(w, sh.t0, { vol: 0.05, norm: true, stop: sh.t0 + d + 0.02, fade: 0.02 });
  }
  // the count down: a clock's tick-tock from "Friction comes back in 3 seconds" to the silence, quickening (0.6 → 0.2 s
  // apart) and growing louder; it ignores the slowed picture: it's the tension, not the story's clock
  { const tick = fzClick(fx, { f: 3000, tau: 0.003, len: 0.05, hp: 900 }), tock = fzClick(fx, { f: 2300, tau: 0.004, len: 0.06, hp: 700 }), a = FZ.tWarn + 0.2, b = FZ.hold - 0.06;
    for (let t = a, i = 0; t < b; i++) { const u = (t - a) / (b - a); K.put(i % 2 ? tock : tick, t, { vol: 0.035 + 0.05 * u, norm: true, pan: 0.1, room, wet: 0.2 }); t += 0.6 - 0.4 * u; } }
  // each quick cut in the count down: a short whoosh
  for (const c of FZ.countCuts) { const y = fzNoise(fx, Math.ceil(0.25 * sr), 'pink'); for (let i = 0; i < y.length; i++) { const u = i / y.length; y[i] *= Math.sin(Math.PI * u) ** 2; } K.put(fzSweep(y, sr, 'bandpass', 1.2, [600, 2400, 900]), c - 0.15, { vol: 0.02, norm: true }); }
  // the phone in the gutter lights up: a notification
  { const t = FZ.phoneLit - 0.05, y = mix([fx.beep(1320, 0.09), 0], [fx.beep(1980, 0.12), 0.11, 0.8]); FZX.bq(y, 'lp', 5000, 0.7, sr); K.put(y, t, { vol: 0.035, norm: true, room: street, wet: 0.3 }); }
});
