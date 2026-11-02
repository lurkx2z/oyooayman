/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / gravity films':
     top left     the countdown: how long dropped things keep falling up (10:00 → 0:00); from the apple on, where your
                  apple is (↑ height) and the next height it will pass; under it one context line for the scene
     top right    Saturday and the time; REAL SPEED / SLOW MOTION ×0.38, "+40 s" when the clock jumps at a cut (it only
                  ever runs forward)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     insets       walking vs running (who has a foot on the ground); the height ladder when we ride with the apple
     middle       the last ten seconds, counted down big
     bottom left  the honest labels (what is impossible, what is left out)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// heights your apple passes on the way (m)
const SO_MARKS = [[1000, '1 km'], [8849, 'EVEREST'], [11000, 'AIRLINERS'], [18300, 'CONCORDE'], [35000, 'WEATHER BALLOONS'], [100000, 'SPACE']];
// the scene's context line: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const SO_CTX = (() => {
  const sh = soShot;
  const span = (a, b, l, f) => [sh(a).t0 + 0.4, sh(b).t1 - 0.25, l, f];
  const beat = (id, l, f, k0 = 0) => [soC(id, k0) - 0.2, soE(id) + 0.2, l, f];
  const A = SO_FLY.apple, kmh = (v) => Math.round(Math.abs(v) * 3.6).toLocaleString('en-US');
  return [
    beat('rate', 'EVERYTHING FALLS UP AT', () => ({ v: '9.81 <small>m/s²</small>', v2: 'A SPOON, A GRAPE, A PIANO' })),
    span('appleUp', 'appleUp', 'YOUR APPLE IS GOING UP AT', (t, s) => ({ v: Math.round(A.v(s)) + ' <small>m/s</small>', v2: kmh(A.v(s)) + ' km/h · STILL SPEEDING UP' })),
    beat('leaves', 'A LEAF FALLS AT ABOUT', () => ({ v: '1.3 <small>m/s</small>', v2: 'SO IT RISES AT 1.3 m/s' })),
    span('fountain', 'fountain', 'THE WATER LEAVES THE JET AT', () => ({ v: '6 <small>m/s</small>', v2: 'NONE OF IT COMES BACK' })),
    beat('hold', 'IF SHE LETS GO NOW, BY 3:10', (t, s) => { const f = soFlight(Math.round(s), 55, { h0: 4.5, until: 601, dt: 0.1 }); return { v: Math.round(f(600) / 1000) + ' <small>km up</small>', v2: 'AIRLINERS FLY AT 11 km' }; }, 1),
    span('dog', 'dog', 'THE DOG PULLS UP ON THE LEAD WITH', () => ({ v: '200 <small>N</small>', v2: 'ITS WHOLE WEIGHT (20 kg)' })),
    span('height', 'height', 'THE AIR UP HERE', (t, s) => ({ v: Math.round(100 * soRho(A(s)) / SOP.ref) + ' <small>% as thick</small>', v2: 'LESS AIR, LESS DRAG: ' + Math.round(A.v(s)) + ' m/s' })),
    span('planes', 'planes', 'AIRLINERS CRUISE AT', () => ({ v: '10–12 <small>km</small>', v2: 'LOST PHONES ARE GETTING THERE' })),
    span('space', 'space', 'YOUR APPLE IS GOING', (t, s) => ({ v: (A.v(s) / 1000).toFixed(1) + ' <small>km/s</small>', v2: kmh(A.v(s)) + ' km/h · THE AIR HAS RUN OUT' })),
    beat('down', 'THE FOUNTAIN’S HIGHEST WATER', () => ({ v: '5.5 <small>km up</small>', v2: 'FROZEN · DOWN BY 3:20' }), 1),
    beat('question', 'YOUR APPLE IS STILL UP AT', (t, s) => ({ v: Math.round(A(s) / 1000) + ' <small>km</small>', v2: 'STRAIGHT BACK DOWN · LANDS ABOUT 3:21' })),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const SO_TAGS = (() => { const b = (id, text, k0 = 0) => [soC(id, k0) - 0.1, soE(id) + 0.2, text]; return [
  b('real', 'THE ONE IMPOSSIBLE THING: GRAVITY PUSHING WHAT YOU LET GO OF'),
  b('kettle', 'LEFT OUT: THE AIR KEEPS ITS WEIGHT (OR THE SKY WOULD LEAVE TOO)'),
  b('apple', 'AIR DRAG: THE STANDARD ATMOSPHERE, THINNING WITH HEIGHT', 2),
  b('height', 'TEMPERATURE: THE STANDARD ATMOSPHERE AT 15.3 km', 1),
]; })();

// a caption's text with its numbers in amber
function soCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)?(?::\d+){0,2}(?:\s?°C?|\s?%|\s(?:hours|hour|minutes|minute|seconds|second|km|kg|cm|m|s)\b)?(?:\s(?:AM|PM))?(?:\s\d+\s(?:seconds|second))?/g, (m) => `<span class="n">${m}</span>`);
}

class SoHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('so-ro', '<div class="l"></div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('so-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('so-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('so-band'); this.cap = mk('so-cap'); this.tag = mk('so-tag');
    this.count = mk('so-count');
    this.caps = SOT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: soCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('so-inset');
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
    const W = StoryHUD.win, s = set && set._s != null ? set._s : soStoryAt(t), rate = soRateAt(t), A = SO_FLY.apple;
    // ---- the countdown; your apple
    const ra = Math.max(W(t, FU.title[1] - 0.5, FU.end + 1, 0.4, 0.5), 0);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const left = SOP.T - s, on = left > 0;
      this._txt('rol', this.roL, on ? 'DROPPED THINGS FALL UP FOR' : 'BACK TO NORMAL');
      this._html('rov', this.roV, on ? soMS(left) : '0:00');
      if (s >= A.s0) {
        const h = A(s), up = A.v(s) > 0;
        this._html('ros', this.roS, `YOUR APPLE ${up ? '↑' : '↓'} <b>${soHt(h)}</b>`);
        const nx = SO_MARKS.find((x) => x[0] > h);
        const sky = shot && (shot.mode === 'height' || shot.mode === 'planes' || shot.mode === 'space' || shot.mode === 'appleUp'), M = soMach(A.v(s), h);
        this._html('ron', this.roN, s >= SOP.T ? (up ? `COASTING UP TO ${soHt(A.hTop)}` : 'FALLING BACK · LANDS ABOUT 3:21') : M >= 1 ? `SUPERSONIC · MACH ${M.toFixed(1)}` : sky && nx ? `NEXT: ${nx[1]}${nx[1] === '1 km' ? '' : ' · ' + soHt(nx[0])}` : h >= 100000 ? 'IN SPACE' : '');
      } else { this._html('ros', this.roS, ''); this._html('ron', this.roN, ''); }
      this._cls('roc', this.ro, !on ? 'so-ro hit' : left <= 10 ? 'so-ro tick' : 'so-ro');
    }
    // ---- the context line
    const cx = SO_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = SO_TAGS.find((x) => t >= x[0] && t < x[1]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- Saturday and the time; slow motion or a jump
    const ca = W(t, FU.title[1] - 0.5, FU.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = soClockParts(s);
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = SO_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 90 ? Math.round(j.ds / 60) + ' min' : Math.round(j.ds) + ' s') : '';
      const tl = rate < 0.9 ? 'SLOW MOTION ×' + rate.toFixed(2) : 'REAL SPEED';
      this._txt('ckf', this.clockF, jl ? jl + '  ·  ' + tl : tl);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = SOT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'so-cap q' : 'so-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the last ten seconds, big
    { const n = s >= FU.sCount && s < SOP.T && shot && shot.mode === 'count' ? Math.ceil(SOP.T - s - 1e-6) : 0, a = n ? 1 : 0;
      this._set('cna', this.count, 'opacity', String(a));
      if (n) { this._txt('cnt', this.count, String(n)); const f = (SOP.T - s) % 1; this._cls('cnc', this.count, f > 0.82 ? 'so-count hit' : 'so-count'); } }
    // ---- the diagrams
    this._insets(t, s);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'so-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = SoHud._p || (SoHud._p = new THREE.Vector3());
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
      d.className = right ? 'so-lab r' : 'so-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  // the diagrams (SVG)
  _insets(t, s) {
    const W = StoryHUD.win, sh = soShot;
    const which = [['stride', soC('walk', 0) - 0.2, sh('walk').t1 - 0.2, 'left'], ['ladder', sh('height').t0 + 0.4, sh('planes').t1 - 0.2, 'ladder'], ['ladder', sh('space').t0 + 0.4, sh('space').t1 - 0.2, 'ladder']].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'so-inset' : 'so-inset ' + which[3]);
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = SoHud[k](u, t, s);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="soAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // walking vs running: when each foot is on the ground (bars), over two strides. Walking: the bars overlap (always a
  // foot down). Running: gaps where both feet are off the ground (amber). A playhead runs along both
  static stride(u) {
    const x0 = 252, x1 = 728, L = x1 - x0, cyc = 2, ph = ((u * 0.45) % 1) * L + x0, k2 = MathX.smooth(u, 3.2, 4.0);
    const bars = (y, duty, off, col) => { let o = ''; for (let c = 0; c < cyc + 1; c++) { const a = x0 + (c + off) * L / cyc, b = a + duty * L / cyc; const aa = Math.max(x0, a), bb = Math.min(x1, b); if (bb > aa) o += `<rect x="${aa.toFixed(1)}" y="${y}" width="${(bb - aa).toFixed(1)}" height="22" rx="8" fill="${col}"/>`;
      const a2 = a - L / cyc, b2 = a2 + duty * L / cyc, aa2 = Math.max(x0, a2), bb2 = Math.min(x1, b2); if (c === 0 && bb2 > aa2) o += `<rect x="${aa2.toFixed(1)}" y="${y}" width="${(bb2 - aa2).toFixed(1)}" height="22" rx="8" fill="${col}"/>`; } return o; };
    const gaps = (y) => { let o = ''; for (let c = -1; c < cyc + 1; c++) for (const st of [0.3, 0.8]) { const a = x0 + (c + st) * L / cyc, b = a + 0.2 * L / cyc, aa = Math.max(x0, a), bb = Math.min(x1, b); if (bb > aa) o += `<rect x="${aa.toFixed(1)}" y="${y}" width="${(bb - aa).toFixed(1)}" height="66" rx="8" fill="rgba(255,207,138,0.28)" stroke="#ffcf8a" stroke-width="2"/>`; } return o; };
    return SoHud.svg(`${SoHud.plate()}
      <text x="30" y="60" class="t">WHICH FOOT IS ON THE GROUND</text>
      <text x="30" y="140" class="s">WALKING</text>
      <text x="236" y="128" text-anchor="end" class="sm">L</text><text x="236" y="160" text-anchor="end" class="sm">R</text>
      ${bars(110, 0.6, 0, '#f6efe2')}${bars(142, 0.6, 0.5, '#9fc4ff')}
      <text x="${x0}" y="200" class="sm">ALWAYS A FOOT DOWN</text>
      <g opacity="${k2}">
        <text x="30" y="290" class="s">RUNNING</text>
        ${gaps(258)}
        <text x="236" y="282" text-anchor="end" class="sm">L</text><text x="236" y="314" text-anchor="end" class="sm">R</text>
        ${bars(264, 0.3, 0, '#f6efe2')}${bars(296, 0.3, 0.5, '#9fc4ff')}
        <text x="${x0}" y="360" class="sm" style="fill:#ffcf8a">BOTH FEET OFF, TWICE A STRIDE</text>
      </g>
      <line x1="${ph.toFixed(1)}" y1="96" x2="${ph.toFixed(1)}" y2="${k2 > 0.05 ? 336 : 180}" stroke="#ffffff" stroke-width="3" opacity="0.8"/>`);
  }
  // the height ladder (log scale, 1 km … 150 km): the marks, your apple (and a lost phone)
  static ladder(u, t, s) {
    const w = 360, h = 640, top = 60, bot = 590, lg = (x) => Math.log10(Math.max(1000, x)), y = (x) => bot - (lg(x) - 3) / (lg(150000) - 3) * (bot - top);
    const A = SO_FLY.apple, ha = A(s), shot = soShotAt(t), ph = shot.mode === 'planes' ? SO_FLY.phone0(s) : null;
    let marks = '';
    // (Everest sits too close to the airliners on this scale to read: the caption names it)
    for (const [m, n] of SO_MARKS.slice(2)) marks += `<line x1="70" y1="${y(m).toFixed(1)}" x2="${w - 20}" y2="${y(m).toFixed(1)}" stroke="rgba(255,255,255,${n === 'SPACE' ? 0.75 : 0.35})" stroke-width="${n === 'SPACE' ? 3 : 2}" stroke-dasharray="${n === 'SPACE' ? '' : '6 6'}"/>
      <text x="${w - 20}" y="${(y(m) - 9).toFixed(1)}" text-anchor="end" class="sm" style="font-size:24px">${n === 'WEATHER BALLOONS' ? 'BALLOONS' : n} <tspan style="fill:#f6efe2">${soHt(m)}</tspan></text>`;
    const dot = (hh, col, lab) => (hh >= 1000 ? `<circle cx="70" cy="${y(hh).toFixed(1)}" r="12" fill="${col}"/><rect x="90" y="${(y(hh) - 18).toFixed(1)}" width="${w - 102}" height="34" rx="8" fill="rgba(6,9,14,0.92)"/><text x="100" y="${(y(hh) + 9).toFixed(1)}" class="b" style="font-size:26px;fill:${col}">${lab} ${soHt(hh)}</text>` : '');
    return SoHud.svg(`${SoHud.plate(0.62, w, h)}
      <text x="24" y="42" class="sm" style="font-size:25px;fill:#f6efe2">HEIGHT ABOVE THE PARK</text>
      <line x1="70" y1="${top}" x2="70" y2="${bot}" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
      ${marks}${dot(ha, '#ffcf8a', 'APPLE')}${ph != null ? dot(ph, '#9fc4ff', 'PHONE') : ''}`, w, h);
  }
}
