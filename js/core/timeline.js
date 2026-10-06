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
/**
 * Edit — an optional cut of one continuous take (CONFIG.edit). A film is authored on a single continuous story
 * clock (camera, script, simulation, sound); CONFIG.edit lists the story intervals that are kept, in order, as
 * [from, to, speed = 1] — speed below 1 plays that stretch in slow motion. Playback, recording and the soundtrack
 * follow the cut; nothing else needs to know. Without CONFIG.edit film time and story time are the same.
 */
const Edit = {
  _segs() {
    const E = CONFIG.edit;
    if (!E || !E.length) return null;
    if (this._src !== E) {
      let f = 0;
      this._list = E.map(([s0, s1, k = 1]) => { const g = { s0, s1, k, f0: f, f1: f + (s1 - s0) / k }; f = g.f1; return g; });
      this._src = E;
    }
    return this._list;
  },
  on() { return !!this._segs(); },
  // length of the cut film (the story's length when there is no edit)
  duration() { const L = this._segs(); return L ? L[L.length - 1].f1 : CONFIG.duration; },
  // film time → story time
  story(t) {
    const L = this._segs();
    if (!L) return t;
    for (const g of L) if (t < g.f1) return g.s0 + Math.max(0, t - g.f0) * g.k;
    const g = L[L.length - 1]; return g.s1 + (t - g.f1);
  },
  // story time → film time (a moment inside a cut maps to the cut)
  film(s) {
    const L = this._segs();
    if (!L) return s;
    for (const g of L) { if (s < g.s0) return g.f0; if (s < g.s1) return g.f0 + (s - g.s0) / g.k; }
    const g = L[L.length - 1]; return g.f1 + (s - g.s1);
  },
  // the soundtrack, rendered on the story clock, cut to the film: slow stretches are resampled (so they drop in pitch,
  // like slowed film sound) and every join is crossfaded over 25 ms
  spliceAudio(buf) {
    const L = this._segs();
    if (!L) return buf;
    const sr = buf.sampleRate, n = Math.ceil((this.duration() + 1.5) * sr), X = Math.round(0.025 * sr);
    const out = new AudioBuffer({ numberOfChannels: buf.numberOfChannels, length: n, sampleRate: sr });
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const src = buf.getChannelData(c), dst = out.getChannelData(c);
      const at = (p) => { const i = Math.floor(p), u = p - i; return i < 0 || i + 1 >= src.length ? 0 : src[i] * (1 - u) + src[i + 1] * u; };
      L.forEach((g, j) => {
        const i0 = Math.round(g.f0 * sr), i1 = j === L.length - 1 ? n : Math.round(g.f1 * sr), prev = L[j - 1];
        for (let i = i0; i < i1; i++) {
          const tf = i / sr - g.f0;
          let v = at((g.s0 + tf * g.k) * sr);
          if (prev && i - i0 < X) { const w = (i - i0) / X; v = v * w + at((prev.s1 + tf * prev.k) * sr) * (1 - w); }
          dst[i] = v;
        }
      });
    }
    return out;
  },
};

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
