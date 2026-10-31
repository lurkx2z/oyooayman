/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / gravity films':
     top left     THE AIR, TURNED TO LIQUID and the share (it climbs every second to 100 % at 3:10); under it the level
                  in your street; at 4:00 it turns round (TURNING BACK INTO AIR); under that one context line for the
                  scene (the light left, the rain, the air pressure, your weight, the countdown…)
     top right    the time this afternoon; a "+N MIN" flag when the clock jumps at a cut
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagram: the whole sky, as this liquid, against your block
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

const laM = (x) => (x < 10 ? x.toFixed(2) : x.toFixed(1)) + ' <small>m</small>';
const laAtm = (p) => p.toFixed(2) + ' <small>atm</small>';
// the scene's context line: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const LA_CTX = (() => {
  const sh = (m) => LA_SHOTS.find((x) => x.mode === m);
  const span = (a, b, l, f) => [sh(a).t0 + 0.4, sh(b).t1 - 0.25, l, f];
  return [
    span('dark', 'dark', 'SUNLIGHT REACHING THE STREET', (t, s) => ({ v: Math.max(0.1, 100 * laDiffuse(s)).toFixed(1) + ' <small>%</small>', v2: 'OF A CLEAR DAY' })),
    span('ears', 'ears', 'BEHIND YOUR EARDRUMS', (t, s) => ({ v: '−' + Math.round(laEarKPa(s)) + ' <small>kPa</small>', v2: 'SWALLOW' })),
    span('street', 'street', 'RAIN', (t, s) => ({ v: Math.round(laRate(s) * 60000) + ' <small>mm a minute</small>', v2: 'THE RECORD: 31 mm IN A MINUTE' })),
    span('lamps', 'lamps', 'AIR PRESSURE IN THE STREET', (t, s) => ({ v: laAtm(laP0(s)), v2: 'THE RAIN STILL HOLDS UP THE SKY' })),
    span('cars', 'cars', 'A PARKED CAR FLOATS AT', () => ({ v: '≈ 70 <small>cm</small>', v2: '' })),
    span('light', 'light', 'YOUR WEIGHT, ALL THE WAY IN IT', () => ({ v: '12 <small>kg</small>', v2: 'OUT OF 70 kg' })),
    span('chin', 'chin', 'AIR PRESSURE IN THE STREET', (t, s) => ({ v: laAtm(laP0(s)), v2: '' })),
    span('breathe', 'breathe', 'IN YOUR LUNGS', () => ({ v: '3 <small>litres of it</small>', v2: '700 × HEAVIER THAN AIR' })),
    span('last', 'last', 'AIR PRESSURE ABOVE THE SURFACE', (t, s) => ({ v: laAtm(laP0(s)), v2: laP0(s) < 0.4 ? 'TOO THIN TO BREATHE' : '' })),
    [sh('crash0').t0 + 0.4, sh('crash1').t1 - 0.25, 'THE SKY STILL FALLING', (t, s) => ({ v: Math.round(100 * laUp(s)) + ' <small>%</small>', v2: s < 610 ? 'LANDING AT ~460 km/h' : 'ALL DOWN' })],
    span('deep', 'deep', 'ABOVE THE SURFACE', () => ({ v: '0 <small>atm</small>', v2: 'NOTHING. A VACUUM' })),
    span('snell', 'snell', 'THE SKY, SEEN FROM UNDER IT', () => ({ v: '56° <small>from straight up</small>', v2: 'LIGHT BENDS AS IT GOES IN' })),
    span('moon', 'moon', 'YOUR WEIGHT IN IT', () => ({ v: '12 <small>kg</small>', v2: 'ON THE MOON: 11.6 kg' })),
    span('top', 'top', 'PRESSURE IN THE TOP 70 cm', () => ({ v: '< 6.3 <small>kPa</small>', v2: 'THE ARMSTRONG LIMIT' })),
    span('cold', 'cold', 'THE LIQUID', () => ({ v: '15 <small>°C</small>', v2: '' })),
    span('back', 'back', 'EVERY SECOND, YOUR LUNGS WILL MAKE', () => ({ v: '3.6 <small>litres of air</small>', v2: 'FROM 3 LITRES OF LIQUID' })),
    [sh('count').t0, laFilmAt(LAP.back), 'IT TURNS BACK IN', (t, s) => ({ v: Math.max(0, Math.ceil(LAP.back - s - 1e-6)) + ' <small>s</small>', v2: '' })],
  ];
})();
// the honest label (bottom left): [from, to, text]
const LA_TAGS = (() => { const sh = (m) => LA_SHOTS.find((x) => x.mode === m); return [
  [sh('real').t0 + 0.5, sh('real').t1 - 0.3, 'THE ONE IMPOSSIBLE THING: A LIQUID AT 15 °C'],
  [sh('crash1').t0 + 0.3, sh('crash1').t1 - 0.2, 'LEFT OUT: THE HEAT OF THE FALL (IT WOULD WARM IT ~40 °C)'],
]; })();

// a caption's text with its numbers in amber
function laCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)?(?::\d+)?(?:\s?°C|\s?°|\s?%|\s(?:degrees|metres|minutes|seconds|tonnes|litres|times|km|kg|cm|m)\b)?(?:\sPM)?/g, (m) => `<span class="n">${m}</span>`);
}

class LaHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('la-ro', '<div class="l"></div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('la-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('la-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('la-band'); this.cap = mk('la-cap'); this.count = mk('la-count'); this.tag = mk('la-tag');
    this.caps = LAT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: laCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('la-inset');
    this.labels = [];
    this.root = root;
    this._last = {};
    this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : laStoryAt(t);
    // ---- the share turned (from the first second to the last frame), and the level
    const ra = Math.max(W(t, LA.t0 + 0.8, LA.end + 1, 0.3, 0.5), 0);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const back = s >= LAP.back, f = back ? 100 * MathX.clamp((s - LAP.back) / LAP.T, 0, 1) : 100 * laF(s);
      this._txt('rol', this.roL, back ? 'TURNING BACK INTO AIR' : 'THE AIR, TURNED TO LIQUID');
      this._html('rov', this.roV, (f < 10 && f > 0 ? f.toFixed(1) : Math.floor(f)) + '<small>%</small>');
      const d = laDepth(s);
      this._html('ros', this.roS, d < 0.005 ? '' : `LEVEL IN YOUR STREET <b>${d < 1 ? Math.round(d * 100) + ' cm' : d.toFixed(2) + ' m'}</b>`);
      // the threat that hangs over the second half: at 4:00 it all turns back (from the [deep] caption to 4:00)
      const nx = t >= laC('deep', 1) - 0.2 && s < LAP.back ? Math.ceil((LAP.back - s) / 60) : 0;
      this._html('ron', this.roN, nx ? `IT TURNS BACK INTO AIR IN <b>${nx > 1 ? nx + ' MIN' : Math.ceil(LAP.back - s) + ' s'}</b>` : '');
      this._cls('roc', this.ro, s >= 599.5 && s < 612 ? 'la-ro hit' : 'la-ro');
    }
    // ---- the context line
    const cx = LA_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = LA_TAGS.find((x) => t >= x[0] && t < x[1]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the time this afternoon, and the jumps
    const ca = W(t, LA.title[1] - 0.6, LA.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = laClockParts(s);
      this._txt('ckl', this.clockL, 'SATURDAY');
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>PM</i>`);
      const j = LA_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const lab = j ? (j.ds >= 90 ? '+' + Math.round(j.ds / 60) + ' MIN' : '+' + Math.round(j.ds) + ' s') : '';
      this._txt('ckf', this.clockF, lab); this._set('ckfa', this.clockF, 'opacity', j ? W(t, j.t, j.t + 2.6, 0.15, 0.6).toFixed(3) : '0');
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = LAT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'la-cap q' : 'la-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the last ten seconds: the count, big (9 … 1)
    const n = LAP.back - Math.floor(s + 1e-9);
    if (s >= LAP.back - 9 && n >= 1 && n <= 9) { const fr = s - Math.floor(s + 1e-9); this._txt('cnt', this.count, String(n)); this._set('cnta', this.count, 'opacity', (0.92 * (1 - 0.55 * MathX.smooth(fr, 0.55, 0.98))).toFixed(3)); this._set('cnts', this.count, 'transform', `translate(-50%, -50%) scale(${(1.12 - 0.12 * MathX.smooth(fr, 0, 0.25)).toFixed(3)})`); }
    else this._set('cnta', this.count, 'opacity', '0');
    // ---- the diagram
    this._insets(t, s);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'la-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = LaHud._p || (LaHud._p = new THREE.Vector3());
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
      d.style.left = lx.toFixed(2) + '%'; d.style.top = Math.min(74, Math.max(ly, 20)).toFixed(2) + '%';
      d.className = right ? 'la-lab r' : 'la-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  // the diagram (SVG, 760×470 design px)
  _insets(t, s) {
    const W = StoryHUD.win, sh = (m) => LA_SHOTS.find((x) => x.mode === m);
    const which = [['sky', sh('floor').t0 + 0.3, sh('floor').t1 - 0.2, '']].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'la-inset' : 'la-inset ' + which[3]);
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = LaHud[k](u, t, s);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // the whole sky (100 km of air, thinning upward) squeezed into 11.8 m of liquid, against your block (5 floors)
  static sky(u) {
    const k = MathX.smooth(u, 0.1, 0.7), g = 410, mpx = 22, H = LA_ST.blockA.h * mpx, lv = LAP.D * mpx * MathX.smooth(u, 0.5, 2.2);
    let floors = ''; for (let i = 1; i < 5; i++) floors += `<line x1="380" y1="${g - i * 3.08 * mpx}" x2="560" y2="${g - i * 3.08 * mpx}" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>`;
    return LaHud.svg(`${LaHud.plate()}<g opacity="${k}">
      <rect x="380" y="${g - H}" width="180" height="${H}" fill="rgba(230,220,200,0.12)" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>${floors}
      <rect x="380" y="${g - 4 * 3.08 * mpx - 2.6 * mpx}" width="180" height="${2.6 * mpx}" fill="rgba(255,207,138,0.35)"/>
      <text x="575" y="${g - LAP.floorY * mpx - 2}" class="sm">YOUR FLOOR 12.0 m</text>
      <rect x="60" y="${g - lv}" width="640" height="${lv}" fill="rgba(110,190,220,0.32)"/>
      <line x1="60" y1="${g - lv}" x2="700" y2="${g - lv}" stroke="#bfe6ff" stroke-width="4"/>
      <text x="80" y="${g - lv - 14}" class="b">${(lv / mpx).toFixed(1)} m</text>
      <line x1="40" y1="${g}" x2="720" y2="${g}" stroke="#f6efe2" stroke-width="4"/>
      <text x="80" y="447" class="sm">10 TONNES ON EVERY m² → 11.8 m OF IT</text></g>
      <text x="40" y="50" class="t">THE WHOLE SKY, AS THIS LIQUID</text>`);
  }
}
