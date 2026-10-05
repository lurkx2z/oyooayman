/* =====================================================================
   Timeline — deterministic, time-based playback.

   Every system asks "what should I look like at time t?" instead of
   integrating frame-by-frame. That makes scrubbing, restarting and
   frame-exact recording trivial: the same t always gives the same frame.
   ===================================================================== */

const Ease = {
  linear: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outSine: (x) => Math.sin((x * Math.PI) / 2),
  inSine: (x) => 1 - Math.cos((x * Math.PI) / 2),
  outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  inExpo: (x) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
  outExpo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  step: (x) => (x < 1 ? 0 : 1),
};

/**
 * Keyframed numeric track.
 * keys: [[time, value, easeName?], ...]  — easeName applies to the segment
 * that ENDS at that key (default inOutSine, i.e. a natural head move).
 */
class Track {
  constructor(keys, defaultEase = 'inOutSine') {
    this.keys = keys.map((k) => ({ t: k[0], v: k[1], e: Ease[k[2] || defaultEase] || Ease.linear }));
    this.keys.sort((a, b) => a.t - b.t);
  }
  value(t) {
    const k = this.keys;
    if (t <= k[0].t) return k[0].v;
    if (t >= k[k.length - 1].t) return k[k.length - 1].v;
    let i = 1;
    while (i < k.length && k[i].t < t) i++;
    const a = k[i - 1], b = k[i];
    const x = (t - a.t) / (b.t - a.t || 1);
    return a.v + (b.v - a.v) * b.e(x);
  }
}

/**
 * Catmull-Rom track for smooth continuous motion (camera position).
 */
class SmoothTrack {
  constructor(keys) { this.keys = keys.map((k) => ({ t: k[0], v: k[1] })); }
  value(t) {
    const k = this.keys, n = k.length;
    if (t <= k[0].t) return k[0].v;
    if (t >= k[n - 1].t) return k[n - 1].v;
    let i = 1;
    while (i < n && k[i].t < t) i++;
    const p0 = k[Math.max(0, i - 2)], p1 = k[i - 1], p2 = k[i], p3 = k[Math.min(n - 1, i + 1)];
    const x = (t - p1.t) / (p2.t - p1.t);
    // tangents scaled by segment durations (non-uniform Catmull-Rom)
    const m1 = ((p2.v - p0.v) / (p2.t - p0.t || 1)) * (p2.t - p1.t);
    const m2 = ((p3.v - p1.v) / (p3.t - p1.t || 1)) * (p2.t - p1.t);
    const x2 = x * x, x3 = x2 * x;
    return (2 * x3 - 3 * x2 + 1) * p1.v + (x3 - 2 * x2 + x) * m1 + (-2 * x3 + 3 * x2) * p2.v + (x3 - x2) * m2;
  }
}

/**
 * Timeline: the clock plus the list of named story events.
 */
class Timeline {
  constructor(duration, events) {
    this.duration = duration;
    this.events = events.slice().sort((a, b) => a.time - b.time);
    this.byName = {};
    for (const e of this.events) this.byName[e.id] = e;
    this.t = 0;
  }
  at(id) {
    const e = this.byName[id];
    if (!e) throw new Error('Unknown timeline event: ' + id);
    return e.time;
  }
  // seconds since an event (negative before it)
  since(id, t = this.t) { return t - this.at(id); }
  passed(id, t = this.t) { return t >= this.at(id); }
  // index of the latest event at or before t
  currentEvent(t = this.t) {
    let cur = this.events[0];
    for (const e of this.events) if (e.time <= t) cur = e;
    return cur;
  }
}
