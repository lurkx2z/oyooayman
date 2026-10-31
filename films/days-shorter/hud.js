/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / gravity films':
     top left     LENGTH OF A DAY (noon to noon; it shrinks every second the clock runs), how many sunrises since Sunday
                  noon, and when the next sunset (or sunrise) comes; under it one context line for the scene
     top right    the weekday and the time; TIME-LAPSE ×N when we watch the week go by, "+N h" when the clock jumps at a
                  cut (it only ever runs forward); from the push beat, the DOWN dial: the old down (dashed) and the new
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams: the spin's push and why it tips "down" towards the equator; where the oceans go
     bottom left  the honest labels (what is impossible, what is left out)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

const dsDeg = (x) => (x < 1 ? x.toFixed(2) : x < 10 ? x.toFixed(1) : Math.round(x)) + '°';
// the length of a day, as the big number: "23 h 50 min" / "1 h 14 min" / "58 min 12 s"
function dsDayHtml(x) {
  const h = Math.floor(x / 3600), m = Math.floor(x / 60) % 60, sc = Math.floor(x % 60);
  return h >= 1 ? `${h}<small> h </small>${String(m).padStart(2, '0')}<small> min</small>` : `${m}<small> min </small>${String(sc).padStart(2, '0')}<small> s</small>`;
}
// the scene's context line: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const DS_CTX = (() => {
  const sh = (m) => DS_SHOTS.find((x) => x.mode === m);
  const span = (a, b, l, f) => [sh(a).t0 + 0.4, sh(b).t1 - 0.25, l, f];
  const beat = (id, l, f, k0 = 0) => [dsC(id, k0) - 0.2, dsE(id) + 0.2, l, f];
  const bulge = (s) => '+' + (21.4 * ((DSP.P0 / dsDay(s)) ** 2 - 1)).toFixed(1) + ' <small>km</small>';
  const slope = (s) => 'THE GROUND IS NOW A ' + Math.round(100 * Math.tan(dsTilt(s))) + ' % SLOPE';
  return [
    beat('math', 'LENGTH OF A DAY AT NOON', (t, s) => { const d = ['SUN 24 h', 'MON 20 h', 'TUE 16 h', 'WED 12 h', 'THU 8 h', 'FRI 4 h'], n = Math.min(5, Math.floor((t - dsS('math') + 0.3) / 0.55));
      return { v: 'SAT ≈ 1 <small>h</small>', v2: d.map((x, i) => `<span class="chip${i <= n ? ' on' : ''}">${x}</span>`).join('') }; }),
    beat('real', 'REAL DAYS GET LONGER BY', () => ({ v: '2 <small>ms a century</small>', v2: 'THE MOON’S TIDES' })),
    beat('quake', 'THE PLANET WANTS TO BULGE', (t, s) => ({ v: bulge(s), v2: 'MORE AT THE EQUATOR' })),
    beat('sunrise', 'DAYLIGHT TODAY', (t, s) => ({ v: dsDayHtml(dsNext(s, false) - dsSunrise(0)), v2: 'MONDAY' })),
    span('marble', 'marble', 'DOWN LEANS', (t, s) => ({ v: dsDeg(dsTiltDeg(s)), v2: 'TOWARDS THE EQUATOR' })),
    span('quake2', 'quake2', 'THE PLANET WANTS TO BULGE', (t, s) => ({ v: bulge(s), v2: 'THE ROCK CAN’T KEEP UP' })),
    span('lighter', 'lighter', 'IF YOU WEIGHED 70 kg', (t, s) => ({ v: Math.round(70 * dsGEff(s) / DSP.g) + ' <small>kg</small>', v2: 'DOWN LEANS ' + dsDeg(dsTiltDeg(s)) })),
    span('jump', 'jump', 'THE SAME JUMP GOES', (t, s) => ({ v: '+' + Math.round(100 * (DSP.g / dsGEff(s) - 1)) + ' <small>% higher</small>', v2: '' })),
    span('glass', 'glass', 'DOWN LEANS', (t, s) => ({ v: dsDeg(dsTiltDeg(s)), v2: 'THE WATER STAYS LEVEL WITH IT' })),
    beat('sat', 'AT THE EQUATOR, THINGS WEIGH', (t, s) => ({ v: Math.round(100 * dsEqWeight(s)) + ' <small>% of what they did</small>', v2: '' }), 1),
    span('slide', 'slide', 'DOWN LEANS', (t, s) => ({ v: dsDeg(dsTiltDeg(s)), v2: slope(s) })),
    span('spire', 'spire', 'PUSHING THE SPIRE SIDEWAYS', (t, s) => ({ v: Math.round(100 * Math.sin(dsTilt(s))) + ' <small>% of what it weighs now</small>', v2: 'DOWN LEANS ' + dsDeg(dsTiltDeg(s)) })),
    span('lean', 'cars', 'DOWN LEANS', (t, s) => ({ v: dsDeg(dsTiltDeg(s)), v2: slope(s) })),
    span('equator', 'equator', 'AT THE EQUATOR, THINGS WEIGH', (t, s) => ({ v: Math.round(100 * dsEqWeight(s)) + ' <small>%</small>', v2: 'THE GROUND THERE MOVES AT ' + (dsW(s) * DSP.R / 1000).toFixed(1) + ' km/s' })),
    span('sunset2', 'sunset2', 'THE SUN TAKES', (t, s) => { const sc = DS.sSunset2, h = dsSunsetLen(sc) / 2; return { v: dsSunsetLen(s).toFixed(1) + ' <small>s to set</small>', v2: s < sc - h ? 'ON A NORMAL DAY: 2 MIN 35 s' : s < sc + h ? 'GONE IN ' + (sc + h - s).toFixed(1) + ' s' : 'GONE' }; }),
    span('stars', 'stars', 'THE SKY TURNS ONCE EVERY', (t, s) => ({ v: Math.round(2 * Math.PI / dsW(s) / 60) + ' <small>min</small>', v2: 'A CLOCK’S MINUTE HAND: 60' })),
    span('dawn', 'dawn', 'DOWN LEANS', (t, s) => ({ v: dsDeg(dsTiltDeg(s)), v2: '' })),
    span('question', 'question', 'DOWN POINTS SIDEWAYS IN', (t, s) => { const x = Math.max(0, DS_LIFT - s), m = Math.floor(x / 60), c = Math.floor(x % 60); return { v: `${m}<small> min </small>${String(c).padStart(2, '0')}<small> s</small>`, v2: 'DOWN LEANS ' + dsDeg(dsTiltDeg(s)) }; }),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const DS_TAGS = (() => { const b = (id, text) => [dsS(id) - 0.1, dsE(id) + 0.2, text]; return [
  b('real', 'THE ONE IMPOSSIBLE THING: NOTHING IS SPINNING IT UP'),
  b('quake', 'LEFT OUT: REAL ROCK WOULD CRACK FAR WORSE'),
  b('node', 'LEFT OUT: THE AIR IS PUSHED TOO. REAL SKIES WOULD TURN TO STORMS'),
  [dsS('lighter') - 0.1, dsE('jump') + 0.2, 'LEFT OUT: BY NOW, THE AIR HERE WOULD BE THINNING TOO'],
  b('equator', 'LEFT OUT: BY NOW, REAL ROCK WOULD BE BREAKING UP'),
]; })();

// a caption's text with its numbers in amber
function dsCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)?(?::\d+)?(?:\s?°|\s?%|\s(?:hours|hour|minutes|minute|milliseconds|seconds|grams|kg|cm|m)\b|-hour\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class DsHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('ds-ro', '<div class="l"></div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('ds-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('ds-clock', '<div class="l"></div><div class="v"></div><div class="f"></div><div class="dn"><span class="dl"></span><svg viewBox="-50 -50 100 100"><circle class="ring" r="44"/><line x1="0" y1="-30" x2="0" y2="34" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-dasharray="6 6"/><path class="arr" d="M0 -30 L0 34 M-11 22 L0 36 L11 22"/><text x="30" y="-28">S</text><text x="-42" y="-28">N</text></svg></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.dn = this.clock.querySelector('.dn'); this.dnL = this.clock.querySelector('.dl'); this.dnA = this.clock.querySelector('.arr');
    this.band = mk('ds-band'); this.cap = mk('ds-cap'); this.tag = mk('ds-tag');
    this.caps = DST.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: dsCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('ds-inset');
    this.labels = [];
    this.root = root;
    this._last = {};
    this._insetKey = null;
    this.tDown = dsS('push') - 0.3;                           // the DOWN dial appears once the push is explained
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : dsStoryAt(t), rate = dsRateAt(t);
    // ---- the length of a day (from the first second to the last frame), the sunrises, the next sunset/sunrise
    const ra = Math.max(W(t, DS.t0 + 0.6, DS.end + 1, 0.3, 0.5), 0);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._txt('rol', this.roL, 'LENGTH OF A DAY');
      this._html('rov', this.roV, dsDayHtml(dsDay(Math.max(0, s))));
      const n = dsSunrises(s);
      this._html('ros', this.roS, n ? `SUNRISES SINCE SUNDAY <b>${n}</b>` : 'SUNDAY');
      const ns = dsNext(s, false), nr = dsNext(s, true), rise = nr < ns, nx = rise ? nr : ns;
      this._html('ron', this.roN, `NEXT ${rise ? 'SUNRISE' : 'SUNSET'} <b>${dsHM(nx)}</b>${nx - s < 60 && rate < 3 ? ` · IN ${Math.max(0, Math.ceil(nx - s))} s` : ''}`);
      // a tick of light each time the minute changes during a time-lapse (the day visibly shrinking)
      this._cls('roc', this.ro, rate > 3 && (t * 2) % 1 < 0.12 ? 'ds-ro tick' : 'ds-ro');
    }
    // ---- the context line
    const cx = DS_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = DS_TAGS.find((x) => t >= x[0] && t < x[1]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the weekday and the time; time-lapse or a jump; the DOWN dial
    const ca = W(t, DS.title[1] - 0.6, DS.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = dsClockParts(s);
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = DS_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 3600 ? Math.floor(j.ds / 3600) + ' h ' + (Math.round(j.ds / 60) % 60 ? (Math.round(j.ds / 60) % 60) + ' min' : '') : j.ds >= 90 ? Math.round(j.ds / 60) + ' min' : Math.round(j.ds) + ' s').trim() : '';
      const tl = rate > 3 ? 'TIME-LAPSE ×' + (rate > 950 ? (Math.round(rate / 100) * 100).toLocaleString('en-US') : rate > 95 ? Math.round(rate / 10) * 10 : Math.round(rate)) : 'REAL SPEED';
      this._txt('ckf', this.clockF, jl ? jl + '  ·  ' + tl : tl); this._set('ckfa', this.clockF, 'opacity', '1');
      const da = W(t, this.tDown, DS.end + 1, 0.4, 0.5);
      this._set('dna', this.dn, 'opacity', da.toFixed(3));
      if (da > 0) { const d = dsTiltDeg(s); this._txt('dnl', this.dnL, 'DOWN ' + dsDeg(d)); this._set('dnr', this.dnA, 'transform', `rotate(${(-d).toFixed(3)}deg)`); this._cls('dnc', this.dn, d > 5 ? 'dn on' : 'dn'); }
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = DST.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'ds-cap q' : 'ds-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, s);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'ds-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = DsHud._p || (DsHud._p = new THREE.Vector3());
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
      d.className = right ? 'ds-lab r' : 'ds-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  // the diagrams (SVG, 760×470 design px)
  _insets(t, s) {
    const W = StoryHUD.win, sh = (m) => DS_SHOTS.find((x) => x.mode === m);
    const which = [['push', sh('push').t0 + 0.3, sh('push').t1 - 0.2, ''], ['node', dsC('node', 1) - 0.3, sh('news').t1 - 0.2, ''], ['equator', sh('equator').t0 + 0.5, sh('equator').t1 - 0.2, '']].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'ds-inset' : 'ds-inset ' + which[3]);
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = DsHud[k](u, t, s);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="dsAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static arrow(x1, y1, x2, y2, col, w = 6, op = 1) { return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#dsAh)" opacity="${op}"/>`; }
  // the spin's push: away from Earth's axis, not straight up. At 35° N part of it lifts you, part of it pushes you along
  // the ground towards the equator: "down" (gravity + the push) leans south. (The push is drawn far larger than it is.)
  static push(u) {
    const cx = 190, cy = 250, R = 138, la = DS_LAT, px = cx + R * Math.cos(la), py = cy - R * Math.sin(la);
    const k1 = MathX.smooth(u, 0.3, 1.3), k2 = MathX.smooth(u, 2.0, 3.0), k3 = MathX.smooth(u, 4.2, 5.4), k4 = MathX.smooth(u, 6.2, 7.4);
    const G = 112, Pm = 66 * k2;                                         // gravity, the push (exaggerated)
    const gx = px - G * Math.cos(la), gy = py + G * Math.sin(la);        // gravity: towards the centre
    const dx = -G * Math.cos(la) + Pm, dy = G * Math.sin(la);             // down = gravity + push (the push is horizontal, away from the axis)
    return DsHud.svg(`${DsHud.plate()}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(70,110,150,0.35)" stroke="rgba(255,255,255,0.55)" stroke-width="3"/>
      <line x1="${cx}" y1="${cy - R - 40}" x2="${cx}" y2="${cy + R + 40}" stroke="#f6efe2" stroke-width="3" stroke-dasharray="8 8"/>
      <text x="${cx - 70}" y="${cy - R - 52}" class="sm">EARTH'S AXIS</text>
      <line x1="${cx - R - 20}" y1="${cy}" x2="${cx + R + 20}" y2="${cy}" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <text x="${cx - R + 4}" y="${cy - 10}" class="sm" opacity="0.8">EQUATOR</text>
      <circle cx="${px}" cy="${py}" r="9" fill="#ffcf8a"/><text x="${px + 16}" y="${py + 36}" class="sm">YOU, 35° N</text>
      <g opacity="${k1}">${DsHud.arrow(px, py, gx, gy, '#9fc4ff', 6)}<text x="${gx - 30}" y="${gy + 34}" class="sm" style="fill:#9fc4ff">GRAVITY</text></g>
      <g opacity="${k2}">${DsHud.arrow(px, py, px + Pm, py, '#ffcf8a', 6)}<text x="${px - 180}" y="${py - 22}" class="sm">THE SPIN'S PUSH</text></g>
      <g opacity="${k3}">${DsHud.arrow(px, py, px + dx, py + dy, '#ffffff', 7)}<text x="${px + dx - 92}" y="${py + dy + 8}" class="b">DOWN</text></g>
      <g opacity="${k4}"><text x="455" y="130" class="t">IT PUSHES AWAY</text><text x="455" y="170" class="t">FROM THE AXIS</text>
        <text x="455" y="235" class="s">SO "DOWN" TIPS</text><text x="455" y="270" class="s">TOWARDS THE</text><text x="455" y="305" class="s">EQUATOR</text>
        <text x="455" y="365" class="sm">(THE PUSH IS DRAWN</text><text x="455" y="395" class="sm">FAR BIGGER THAN IT IS)</text></g>`);
  }
  // the equator at 3:33 AM: the spin's push there has grown as big as gravity: the ground moves at orbital speed
  static equator(u, t, s) {
    const cx = 190, cy = 240, R = 130, k1 = MathX.smooth(u, 0.2, 1.0), k2 = MathX.smooth(u, 1.2, 2.2), k3 = MathX.smooth(u, 3.0, 4.0);
    const eq = dsEqWeight(s), G = 110, Pm = G * (1 - eq), ex = cx + R, ey = cy;
    return DsHud.svg(`${DsHud.plate()}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(70,110,150,0.35)" stroke="rgba(255,255,255,0.55)" stroke-width="3"/>
      <line x1="${cx}" y1="${cy - R - 40}" x2="${cx}" y2="${cy + R + 40}" stroke="#f6efe2" stroke-width="3" stroke-dasharray="8 8"/>
      <line x1="${cx - R - 20}" y1="${cy}" x2="${cx + R + 20}" y2="${cy}" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <circle cx="${ex}" cy="${ey}" r="9" fill="#ffcf8a"/><text x="${ex - 190}" y="${ey - 30}" class="sm">THE EQUATOR</text>
      <g opacity="${k1}">${DsHud.arrow(ex, ey + 6, ex - G, ey + 6, '#9fc4ff', 6)}<text x="${ex - G - 6}" y="${ey + 44}" class="sm" style="fill:#9fc4ff">GRAVITY</text></g>
      <g opacity="${k2}">${DsHud.arrow(ex, ey - 6, ex + Pm, ey - 6, '#ffcf8a', 6)}<text x="${ex + 18}" y="${ey - 30}" class="sm">PUSH</text></g>
      <g opacity="${k3}"><text x="420" y="130" class="t">THE PUSH NOW</text><text x="420" y="170" class="t">EQUALS GRAVITY</text>
        <text x="420" y="235" class="s">WEIGHT THERE: ${Math.round(100 * eq)} %</text><text x="420" y="285" class="s">ONE TURN: ${Math.round(2 * Math.PI / dsW(s) / 60)} MIN,</text><text x="420" y="320" class="s">LIKE A LOW ORBIT</text>
        <text x="420" y="380" class="sm">(${(dsW(s) * DSP.R / 1000).toFixed(1)} km/s: ORBITAL SPEED)</text></g>`);
  }
  // where the sea goes: the new level rises at the equator and falls towards the poles; it crosses today's at 35°
  static node(u, t, s) {
    const cx = 160, cy = 240, R = 125, k = MathX.smooth(u, 0.2, 2.2), A = 28 * k;              // A: the change, drawn huge
    let d = '';
    for (let i = 0; i <= 120; i++) { const ph = Math.PI / 2 - i / 120 * Math.PI, r = R + A * (Math.cos(ph) ** 2 - 2 / 3) * 1.5, x = cx + r * Math.cos(ph), y = cy - r * Math.sin(ph); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    const n1 = [cx + R * Math.cos(DS_LAT), cy - R * Math.sin(DS_LAT)], n2 = [cx + R * Math.cos(DS_LAT), cy + R * Math.sin(DS_LAT)];
    const eq = dsGeoid(s, 0), po = -dsGeoid(s, Math.PI / 2);
    return DsHud.svg(`${DsHud.plate()}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(70,110,150,0.3)" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-dasharray="7 7"/>
      <path d="${d}" fill="none" stroke="#7fd0ff" stroke-width="7" opacity="${0.3 + 0.7 * k}"/>
      <circle cx="${n1[0]}" cy="${n1[1]}" r="10" fill="#ffcf8a"/><circle cx="${n2[0]}" cy="${n2[1]}" r="7" fill="rgba(255,207,138,0.6)"/>
      <text x="${n1[0] - 40}" y="${n1[1] - 26}" class="sm">YOU</text>
      <text x="${cx + R + 22}" y="${cy + 8}" class="sm">EQ.</text><text x="${cx - 30}" y="${cy - R - 16}" class="sm">POLE</text>
      <text x="360" y="110" class="t" style="font-size:29px">THE SEA'S NEW LEVEL</text>
      <text x="360" y="168" class="s">EQUATOR  +${Math.round(eq)} m</text>
      <text x="360" y="208" class="s">POLES  −${Math.round(po)} m</text>
      <text x="360" y="268" class="b">AT 35°: NO CHANGE</text>
      <text x="360" y="330" class="sm">(TODAY'S LEVEL DASHED,</text><text x="360" y="360" class="sm">THE CHANGE DRAWN HUGE)</text>`);
  }
}
