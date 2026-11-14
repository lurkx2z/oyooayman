/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the long-form films' (Slower light, Friction 10 s, Magnets 1,000×):
     top left     YOUR SHADOW · 1.00 s LATE; how far behind you it is right now (metres); "everyone else's: on time"
     top right    the day and the time (to the millisecond while slowed); 3× SLOWER or REAL SPEED; "+34 s" when the
                  clock jumps at a cut (it only ever runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       light's trip from the lamp to the floor (9 ns against 1 s); the Earth carrying you (spin, orbit)
     bottom left  the honest labels (what is impossible, what is rough)
     camera 7     the CCTV picture's own overlay (camera, level, date and time, REC) instead of the panels
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

const shClockStr = (s, ms = true) => { const c = shClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}${ms ? '.' + String(c.ms).padStart(3, '0') : ''}`; };
const shN = (x) => Math.round(x).toLocaleString('en-US');
// how far behind you your shadow is (story s): on foot, your position 1 s ago; in your car, your seat 1 s ago
function shGapAt(s, set) {
  if (s < 0) return 0;
  const Y = SHY;
  if (!Y.inCar(s - 1)) { const a = Y.pos(s), b = Y.pos(s - 1); if (Y.inCar(s)) { const c = shCarFn(set)(s); return Math.hypot(c.x - b[0], c.z - b[1]); } return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  const car = shCarFn(set), a = car(s), b = car(s - 1);
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
const shCarFn = (set) => (set && set._exit ? SHC.ex : set && set.carAt ? set.carAt : SHC.l4);
const shSpeedAt = (s, set) => { if (!SHY.inCar(s)) return SHY.speed(s); const c = shCarFn(set), h = 0.05, a = c(s - h), b = c(s + h); return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / (2 * h); };
// the scene's context box: [from, to, label, value(t, s, set) → { v, v2 }] (HTML)
const SH_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [shC(id, k0) - 0.2, (k1 != null ? shCap(id, k1).hide : shE(id)) + 0.2, l, f];
  const gap = (s, set) => shGapAt(s, set);
  return [
    beat('walk', 'YOUR SPEED', (t, s, set) => ({ v: `${shSpeedAt(s, set).toFixed(1)} <small>m/s</small>`, v2: `YOUR SHADOW: ${gap(s, set).toFixed(1)} m BEHIND` })),
    beat('stop', 'YOUR SHADOW', (t, s, set) => ({ v: `${gap(s, set).toFixed(2)} <small>m behind you</small>`, v2: SHY.speed(s) < 0.05 ? 'YOU: STOPPED' : 'YOU: WALKING' })),
    beat('lamps', 'YOUR SHADOWS', () => ({ v: '4 <small>dark ones</small>', v2: 'ALL OF THEM 1 s LATE' })),
    beat('where', 'THE EARTH’S SPIN CARRIES YOU AT', () => ({ v: `${shN(SHP.spin)} <small>m/s</small>`, v2: `ITS ORBIT: ${SHP.orbitKms.toFixed(1)} km/s` }), 0, 0),
    beat('midnight', 'LAMPS ON, LEVEL 4', (t, s) => ({ v: `${SH_LAMPS.filter((L) => shLampOn(L.i, s, 4) > 0.5).length} <small>of ${SH_LAMPS.length}</small>`, v2: 'NIGHT MODE FROM 12:00 AM' })),
    beat('run', 'YOUR SPEED', (t, s, set) => ({ v: `${shSpeedAt(s, set).toFixed(1)} <small>m/s</small>`, v2: `YOUR SHADOW: ${gap(s, set).toFixed(1)} m BEHIND` }), 1),
    beat('car', 'YOUR CAR', (t, s, set) => ({ v: `${(shSpeedAt(s, set) * 3.6).toFixed(0)} <small>km/h</small>`, v2: `YOUR SHADOW: ${gap(s, set).toFixed(1)} m BEHIND IT` }), 1),
    beat('speed', 'YOUR CAR', (t, s, set) => ({ v: `${(shSpeedAt(s, set) * 3.6).toFixed(0)} <small>km/h</small>`, v2: `LIMIT: 5 mph (8 km/h) · YOUR SHADOW ${gap(s, set).toFixed(1)} m BEHIND` })),
    beat('exit', 'YOUR CAR', (t, s, set) => { const v = shSpeedAt(s, set); return { v: v < 0.02 ? 'STOPPED' : `${(v * 3.6).toFixed(0)} <small>km/h</small>`, v2: `YOUR SHADOW: ${gap(s, set).toFixed(1)} m BEHIND` }; }, 0, 1),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const SH_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [shC(id, k0) - 0.1, (k1 != null ? shCap(id, k1).hide : shE(id)) + 0.2, text]; return [
  b('start', 'THE RULE: YOUR SHADOW IS 1 s LATE · LIGHT, REFLECTIONS AND EVERYONE ELSE’S SHADOWS ARE ON TIME', 1),
  b('light', 'LIGHT GOES 30 cm IN A BILLIONTH OF A SECOND', 1, 2),
  b('mirror', 'A MIRROR SHOWS LIGHT THAT BOUNCED OFF YOU: IT ARRIVES ON TIME', 0),
  b('lamps', 'EVERY LAMP CASTS ONE: THE FOUR NEAREST ARE THE DARKEST', 0),
  b('impossible', 'THE IMPOSSIBLE PART: LIGHT BEHAVES AS IF YOU WERE STILL WHERE YOU WERE 1 s AGO', 1),
  b('where', 'THE LATE SHADOW KEEPS TO THE GROUND: IT LAGS IN THE CAR PARK’S FRAME, NOT SPACE’S', 3),
  b('still', 'A SHADOW THAT STOPS 1 s AFTER YOU IS YOURS · ONE THAT DOESN’T IS SOMEONE ELSE’S', 2),
  b('guard', 'HIS SHADOW IS ON TIME: THE RULE IS ONLY YOURS', 0, 0),
  b('speed', 'CAR PARK LIMITS IN THE UK: USUALLY 5 mph', 0),
  b('cctv', 'A CAMERA SEES LIGHT · YOUR SHADOW IS WHERE THE LIGHT ISN’T', 2),
]; })();
// the insets: [from, to, which, where]
const SH_INSETS = (() => { const b = (id, k0, k1, w, where = '') => [shC(id, k0) - 0.25, (k1 != null ? shCap(id, k1).hide : shE(id)) + 0.3, w, where]; return [
  b('light', 1, 3, 'lamp'), b('where', 1, 2, 'earth'),
]; })();

// a caption's text with its numbers in amber
function shCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s(?:billionths|billion|million|metres|metre|seconds|second|times|km\/h|km|m\/s|m)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class ShHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('sh-ro', '<div class="l">YOUR SHADOW</div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('sh-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('sh-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.cctv = mk('sh-cctv', '<div class="a">CAM 07 · LEVEL 2 NORTH</div><div class="b"></div><div class="r">● REC</div>');
    this.cctvB = this.cctv.querySelector('.b'); this.cctvR = this.cctv.querySelector('.r');
    this.band = mk('sh-band'); this.cap = mk('sh-cap'); this.tag = mk('sh-tag');
    this.caps = SHT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: shCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('sh-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : shStoryAt(t), rate = shRateAt(t);
    void app;
    const cc = shot && shot.mode === 'cctv';
    // ---- your shadow: 1.00 s late; how far behind you
    const ra = W(t, SH.title[1] - 0.5, SH.end + 1, 0.4, 0.5) * (cc ? 0 : 1);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._html('rov', this.roV, s < 0 ? 'ON TIME' : '1.00 s <small>LATE</small>');
      const g = shGapAt(s, set);
      this._html('ros', this.roS, s < 0 ? '' : `<b>${g.toFixed(g < 10 ? 2 : 1)} m</b> BEHIND YOU`);
      this._html('ron', this.roN, s < 0 ? '' : 'EVERYONE ELSE’S: ON TIME');
      this._cls('roc', this.ro, s < 0 ? 'sh-ro' : 'sh-ro dark');
    }
    // ---- the context box
    const cx = SH_CTX.find((x) => t >= x[0] && t < x[1]), inA = (() => { const w = SH_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    this._set('cx', this.ctx, 'opacity', cx && !cc ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = SH_TAGS.find((x) => t >= x[0] && t < x[1]);
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the day and the time; how slowed down, or a jump
    const ca = W(t, SH.title[1] - 0.5, SH.end + 1, 0.4, 0.5) * (cc ? 0 : 1);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = shClockParts(s), ms = rate < 0.9 ? `<small>.${String(c.ms).padStart(3, '0')}</small>` : '';
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small>${ms} <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = SH_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 90 ? Math.round(j.ds / 60) + ' min' : Math.round(j.ds) + ' s') : '';
      const tl = rate < 0.9 ? (Math.round(10 / rate) / 10) + '× SLOWER' : 'REAL SPEED';
      this._txt('ckf', this.clockF, jl ? jl + '  ·  ' + tl : tl);
    }
    // ---- camera 7's own overlay
    this._set('cca', this.cctv, 'opacity', cc ? '1' : '0');
    if (cc) { const c = shClockParts(s), H = (c.h % 12) + (c.pm ? 12 : 0); this._txt('ccb', this.cctvB, `14/11/2026  ${String(H).padStart(2, '0')}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}`); this._set('ccr', this.cctvR, 'opacity', Math.floor(t * 1.2) % 2 ? '0.25' : '1'); }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = SHT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'sh-cap q' : 'sh-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    const two = cp && this.root.clientHeight ? this.cap.offsetHeight / this.root.clientHeight > 0.095 : false;
    this._set('tga', this.tag, 'opacity', tg && !two ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagrams
    this._insets(t, s, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'sh-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = ShHud._p || (ShHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam || !(l.a > 0)) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      const lx = MathX.clamp((_p.x * 0.5 + 0.5) * 100, 3, 97), ly = (-_p.y * 0.5 + 0.5) * 100;
      let right = l.side ? l.side === 'r' : lx > 62;
      const wPct = vis && this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      const ty = Math.min(74, Math.max(ly, 24));   // (24%: clear of the clock box)
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) d.style.opacity = '0'; }
      d.className = right ? 'sh-lab r' : 'sh-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  _insets(t, s, set) {
    const W = StoryHUD.win, which = SH_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'sh-inset' : ('sh-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(s * 20);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = ShHud[which[2]](u, t, s, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="shAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.86, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // a line of text that always fits: past maxW (its width estimated from the class's capitals) its font shrinks to fit
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  // the lamp, the floor, light's trip (2.70 m in 9 ns); then the two delays side by side on a log scale (9 ns · 1 s)
  static lamp(u) {
    const T = ShHud.tx, lx = 150, ly = 120, fy = 395, a1 = MathX.smooth(u, 0.4, 1.6), a2 = MathX.smooth(u, 4.6, 5.8), a3 = MathX.smooth(u, 9.4, 10.4);
    const yRay = ly + 14 + (fy - ly - 14) * a1;
    // log scale: 1 ns … 10 s across 330 px
    const X0 = 330, X1 = 720, lo = 1e-9, hi = 10, X = (v) => X0 + (X1 - X0) * (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
    const ticks = [[1e-9, '1 ns'], [1e-6, '1 µs'], [1e-3, '1 ms'], [1, '1 s']].map(([v, l]) => `<line x1="${X(v)}" y1="300" x2="${X(v)}" y2="312" stroke="#9aa" stroke-width="2"/><text x="${X(v)}" y="340" text-anchor="middle" class="sm">${l}</text>`).join('');
    return ShHud.svg(`${ShHud.plate()}${T(30, 56, 't', 'HOW LATE A SHADOW IS')}
      <rect x="${lx - 60}" y="${ly - 10}" width="120" height="16" rx="4" fill="#e9f1ff"/><line x1="${lx - 70}" y1="${fy}" x2="${lx + 70}" y2="${fy}" stroke="#9aa" stroke-width="3"/>
      <line x1="${lx}" y1="${ly + 14}" x2="${lx}" y2="${yRay}" stroke="#ffe7a8" stroke-width="5" marker-end="url(#shAh)"/>
      ${T(lx + 18, (ly + fy) / 2 - 6, 'sm', `${SHP.lampH.toFixed(2)} m`, 120)}${T(lx - 66, fy + 40, 's', `${SHP.lightNs.toFixed(1)} ns`, 160)}
      <g opacity="${a2.toFixed(2)}"><line x1="${X0}" y1="306" x2="${X1}" y2="306" stroke="#9aa" stroke-width="2"/>${ticks}
      <rect x="${X0}" y="196" width="${(X(SHP.lightS) - X0 + 6).toFixed(1)}" height="30" rx="5" fill="#9fc4ff"/>${T(X0, 186, 'sm', 'A SHADOW, NORMALLY: 9 BILLIONTHS OF A SECOND', 400)}</g>
      <g opacity="${a3.toFixed(2)}"><rect x="${X0}" y="240" width="${(X(1) - X0).toFixed(1)}" height="30" rx="5" fill="#ff8a6a"/>${T(X(1) - 150, 290, 'sm', 'YOURS: 1 s', 150)}
      ${T(X0, 410, 's', `${(SHP.ratio / 1e6).toFixed(0)} MILLION TIMES LATER`, 400)}</g>`);
  }
  // the Earth turning (the car park on it, east at 282 m/s) and going round the Sun (30 km/s): 1 s of each
  static earth(u) {
    const T = ShHud.tx, cx = 210, cy = 260, R = 130, a = MathX.smooth(u, 0.3, 1.2), b = MathX.smooth(u, 4.0, 5.0), lat = SH_LAT, ang = -0.4 + 0.12 * u;
    const px = cx + R * Math.cos(lat) * Math.sin(ang), py = cy - R * Math.sin(lat);
    return ShHud.svg(`${ShHud.plate()}${T(30, 56, 't', 'IN 1 SECOND, THE EARTH CARRIES YOU')}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="#16304a" stroke="#6f9fd0" stroke-width="3"/>
      <ellipse cx="${cx}" cy="${py}" rx="${(R * Math.cos(lat)).toFixed(1)}" ry="${(R * Math.cos(lat) * 0.18).toFixed(1)}" fill="none" stroke="#6f9fd0" stroke-width="2" stroke-dasharray="6 6"/>
      <circle cx="${px.toFixed(1)}" cy="${(py + R * Math.cos(lat) * 0.18 * Math.cos(ang)).toFixed(1)}" r="9" fill="#ffcf8a"/>
      <g opacity="${a.toFixed(2)}">${T(380, 170, 'sm', 'SPINNING EAST (52.6° N)', 360)}${T(380, 210, 's', `${shN(SHP.spin)} m`, 360)}</g>
      <g opacity="${b.toFixed(2)}">${T(380, 290, 'sm', 'ROUND THE SUN', 360)}${T(380, 330, 's', `${SHP.orbitKms.toFixed(1)} km`, 360)}
      ${T(380, 400, 'sm', 'YOUR SHADOW KEEPS UP WITH BOTH', 360)}</g>`);
  }
}
