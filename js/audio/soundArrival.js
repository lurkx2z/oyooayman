/* =====================================================================
   SOUND ARRIVAL — when does a sound reach the listener?   (shared helper, additive)

   Light reaches you effectively instantly at street distances; sound does not. Every delayed
   sound in a film should come from this one rule instead of hand-placed offsets:

       soundArrivalTime = eventTime + distance / soundSpeed

   The functions below handle the general case too: a listener who moves (the POV camera) and
   sources that move (cars, aircraft), including sources faster than sound (a shock / sonic boom).
   Everything is a pure function of its inputs, so it is safe for scrubbing, baking and rendering.

   Positions are plain {x, y, z} objects (metres); times are story seconds; c is m/s.
     SoundArrival.C_AIR                                   343 m/s (dry air, ~20 °C)
     SoundArrival.arrivalTime(te, d, c)                   te + d / c
     SoundArrival.arrival(te, src, lisFn, c)              static source, moving listener → tr
     SoundArrival.emissions(srcFn, lisFn, c, t0, t1, dt)  [{te, tr, d}] for a moving source
     SoundArrival.delayCurve(srcFn, lisFn, c, a, b, dt)   [{t, delay, d, te}] in LISTENER time: drive a
                                                          DelayNode's delayTime with it → exact Doppler
     SoundArrival.firstArrival(srcFn, lisFn, c, t0, t1)   {tr, te}: the earliest arrival (for a supersonic
                                                          source this is the shock: the sonic boom)
     SoundArrival.mach(v, c)                              v / c
     SoundArrival.coneHalfAngle(M)                        asin(1 / M) (radians; null below Mach 1)
     SoundArrival.boomDelay(perp, v, c)                   straight, level, constant-speed source: the boom
                                                          reaches a point `perp` metres from the track
                                                          perp·√(M²−1)/v seconds after closest approach

   Used first by films/slow-sound (speed of sound 34.3 m/s). Not loaded by any other page.
   ===================================================================== */

const SoundArrival = {
  C_AIR: 343,

  dist(a, b) { const dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z; return Math.sqrt(dx * dx + dy * dy + dz * dz); },

  arrivalTime(te, d, c) { return te + d / c; },

  // a sound made at time te at a fixed point reaches a (possibly moving) listener at tr = te + |src − lis(tr)| / c
  arrival(te, src, lisFn, c) {
    let tr = te + this.dist(src, lisFn(te)) / c;
    for (let i = 0; i < 12; i++) tr = te + this.dist(src, lisFn(tr)) / c;   // contraction while the listener is far below c
    return tr;
  },

  // every emission te in [t0, t1] (step dt) with the time it arrives and the distance it travelled
  emissions(srcFn, lisFn, c, t0, t1, dt = 1 / 120) {
    const out = [];
    for (let te = t0; te <= t1 + 1e-9; te += dt) { const s = srcFn(te), tr = this.arrival(te, s, lisFn, c); out.push({ te, tr, d: (tr - te) * c }); }
    return out;
  },

  // the latest emission time whose sound is arriving at listener time tr (or null if none has arrived yet).
  // For a subsonic source there is exactly one; behind a supersonic source this picks the newest branch.
  emitTimeAt(tr, srcFn, lisFn, c, tMin) {
    const f = (te) => te + this.dist(srcFn(te), lisFn(tr)) / c - tr;          // < 0: that emission has already arrived
    let hi = tr, step = 0.02, lo = tr - step;
    while (lo > tMin && f(lo) > 0) { hi = lo; step = Math.min(step * 1.4, 0.25); lo -= step; }
    if (lo <= tMin && f(tMin) > 0) return null;
    lo = Math.max(lo, tMin);
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  },

  // listener-time samples of the propagation delay for a continuously sounding moving source.
  // Feed `delay` into a DelayNode (maxDelayTime ≥ the largest value): the pitch shift (Doppler) comes out exact.
  delayCurve(srcFn, lisFn, c, a, b, dt = 1 / 60, tMin = a - 30) {
    const pts = [];
    for (let t = a; t <= b + 1e-9; t += dt) {
      const te = this.emitTimeAt(t, srcFn, lisFn, c, tMin);
      if (te === null) { pts.push({ t, delay: null, d: null, te: null }); continue; }
      pts.push({ t, delay: t - te, d: (t - te) * c, te });
    }
    return pts;
  },

  // the earliest arrival over emissions in [t0, t1]; behind a supersonic source this is the shock front
  firstArrival(srcFn, lisFn, c, t0, t1, dt = 1 / 240) {
    let best = { tr: Infinity, te: t0 };
    for (let te = t0; te <= t1 + 1e-9; te += dt) { const tr = this.arrival(te, srcFn(te), lisFn, c); if (tr < best.tr) best = { tr, te }; }
    return best;
  },

  mach(v, c) { return v / c; },
  coneHalfAngle(M) { return M > 1 ? Math.asin(1 / M) : null; },
  boomDelay(perp, v, c) { const M = v / c; return M > 1 ? (perp * Math.sqrt(M * M - 1)) / v : null; },
};
