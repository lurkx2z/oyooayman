/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / falls-up films':
     top left     while the air is solid: how long it stays solid (3.000 s → 0), to the millisecond
     top right    Sunday and the time, to the millisecond while it's solid; how much slowed down (110× SLOWER) or
                  REAL SPEED, and "+20 s" when the clock jumps at a cut (it only ever runs forward)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     insets       the ladder: each speed in the film and the height a belly flop would need to hit as hard; a cube of air
                  (what real frozen air is); the bell's sound, caught and let go
     middle       the last second, counted down big
     bottom left  the honest labels (what is impossible, what is a stand-in)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// the scene's context line: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const SA_CTX = (() => {
  const beat = (id, l, f, k0 = 0) => [saC(id, k0) - 0.2, saE(id) + 0.2, l, f];
  return [
    beat('wind', 'A DAY ON EARTH, FOR NOW', () => ({ v: '86,399.998 <small>s</small>', v2: '2 ms SHORTER THAN AT 1:59 PM' }), 1),
    beat('echo', 'THE BELL’S SOUND, WHEN THE AIR SET', () => ({ v: '41 <small>m from the tower</small>', v2: 'YOUR WINDOW: 89 m AWAY' })),
    beat('planes', 'IN THE AIR AT 2:00', () => ({ v: '≈10,000 <small>planes</small>', v2: 'MOST AT 800–900 km/h' })),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const SA_TAGS = (() => { const b = (id, text, k0 = 0) => [saC(id, k0) - 0.1, saE(id) + 0.2, text]; return [
  b('real', 'THE ONE IMPOSSIBLE THING: AIR THAT SETS AT 12 °C, WITHOUT SHRINKING', 1),
  b('silence', 'THE MUSIC IS THE FILM’S: IN THE AIR THERE IS NO SOUND'),
  b('catfine', 'LIKE A BELLY FLOP FROM h: THE SAME SPEED, STOPPED AS FAST · h = v² / 2g', 1),
  b('wind', 'THE WINDS’ SPIN: ≈1.5 × 10²⁶ kg m²/s, EASTWARD ON BALANCE', 1),
  b('planes', 'A STAND-IN NUMBER: FLIGHT TRACKERS SHOW 8,000–12,000 AT ONCE'),
]; })();
// the speed ladder: which rows are on (in order of reveal), and which is lit, by beat
const SA_LADDER = (() => {
  const on = (id, k0, keys, hot) => [saC(id, k0) - 0.3, saE(id) + 0.25, keys, hot];
  return [
    on('catfine', 0, ['walk', 'cat'], 'cat'),
    on('pigeon', 0, ['walk', 'cat', 'pigeon'], 'pigeon'),
    on('walkers', 0, ['walk', 'cat', 'pigeon'], 'walk'),
    on('cyclist', 0, ['walk', 'cat', 'bike', 'pigeon'], 'bike'),
    on('car', 0, ['walk', 'cat', 'bike', 'car', 'pigeon'], 'car'),
    on('runner', 0, ['walk', 'cat', 'run', 'bike', 'car', 'pigeon'], 'run'),
    on('road', 0, ['walk', 'cat', 'run', 'bike', 'car', 'pigeon', 'road'], 'road'),
    [saC('road', 2) - 0.3, saE('road') + 0.25, ['walk', 'cat', 'run', 'bike', 'car', 'pigeon', 'road', 'motorway'], 'motorway'],
    on('planes', 1, ['walk', 'cat', 'run', 'bike', 'car', 'pigeon', 'road', 'motorway', 'plane'], 'plane'),
  ];
})();

// a caption's text with its numbers in amber
function saCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?°C?|\s?%|\s(?:hours|hour|minutes|minute|seconds|second|thousandths|km\/h|m\/s|km|kg|cm|m|s)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class SaHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('sa-ro', '<div class="l"></div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('sa-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('sa-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('sa-band'); this.cap = mk('sa-cap'); this.tag = mk('sa-tag');
    this.count = mk('sa-count');
    this.caps = SAT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: saCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('sa-inset'); this.ladder = mk('sa-inset ladder');
    this.labels = [];
    this.root = root;
    this._last = {};
    this._insetKey = null; this._ladKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : saStoryAt(t), rate = saRateAt(t);
    // ---- how long the air stays solid (from just after the title until a few seconds after it lets go)
    const tOff = saFilmAt(SAP.T) + 6.5, ra = Math.max(W(t, SA.title[1] - 0.5, tOff, 0.4, 0.8), 0);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const left = SAP.T - s, on = left > 0;
      this._txt('rol', this.roL, on ? 'THE AIR IS SOLID FOR' : 'THE AIR IS AIR AGAIN');
      this._html('rov', this.roV, on ? `${Math.max(0, left).toFixed(3)}<small> s</small>` : '0.000<small> s</small>');
      this._html('ros', this.roS, on ? 'NOTHING CAN MOVE THROUGH IT' : 'EVERYTHING STARTS AGAIN FROM REST');
      this._html('ron', this.roN, '');
      this._cls('roc', this.ro, !on ? 'sa-ro hit' : left <= 1 ? 'sa-ro tick' : 'sa-ro');
    }
    // ---- the context line
    const cx = SA_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = SA_TAGS.find((x) => t >= x[0] && t < x[1]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- Sunday and the time; how slowed down, or a jump
    const ca = W(t, SA.title[1] - 0.5, SA.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = saClockParts(s), ms = saLocked(s) || (s > -1 && s < SAP.T + 4) ? `<small>.${String(c.ms).padStart(3, '0')}</small>` : '';
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small>${ms} <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = SA_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 90 ? Math.round(j.ds / 60) + ' min' : Math.round(j.ds) + ' s') : '';
      const sl = 1 / rate, tl = rate < 0.9 ? (sl >= 20 ? Math.round(sl / 10) * 10 : Math.round(sl)) + '× SLOWER' : 'REAL SPEED';
      this._txt('ckf', this.clockF, jl ? jl + '  ·  ' + tl : tl);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = SAT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'sa-cap q' : 'sa-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the last second, big
    { const on = s >= SA.sCount && s < SAP.T && shot && (shot.mode === 'countA' || shot.mode === 'countB'), a = on ? W(t, saS('count') - 0.2, SA.tRel, 0.3, 0.2) : 0;
      this._set('cna', this.count, 'opacity', a.toFixed(3));
      if (on) { this._txt('cnt', this.count, Math.max(0, SAP.T - s).toFixed(2)); this._cls('cnc', this.count, SAP.T - s < 0.1 ? 'sa-count hit' : 'sa-count'); } }
    // ---- the diagrams
    this._insets(t, s);
    this._ladderUpd(t);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'sa-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = SaHud._p || (SaHud._p = new THREE.Vector3());
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
      d.className = right ? 'sa-lab r' : 'sa-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  // the diagrams (SVG): the cube of air (real), the bell's sound (echo)
  _insets(t, s) {
    const W = StoryHUD.win;
    const which = [['cube', saC('real', 0) - 0.2, saE('real') + 0.3, 'mid'], ['ring', saC('echo', 0) - 0.2, saE('echo') + 0.3, 'mid']].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'sa-inset' : 'sa-inset ' + which[3]);
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = SaHud[k](u, t, s);
  }
  _ladderUpd(t) {
    const W = StoryHUD.win, L = SA_LADDER.find((x) => t >= x[0] && t < x[1]);
    // (one fade over back-to-back beats: the ladder stays up from the cat to the car, and from the runner to the motorway)
    const a = L ? Math.min(1, W(t, L[0], L[1], 0.45, 0.4) + (SA_LADDER.some((x) => x !== L && Math.abs(x[0] - L[1]) < 3.2 && t > L[1] - 0.4) ? 1 : 0) + (SA_LADDER.some((x) => x !== L && Math.abs(L[0] - x[1]) < 3.2 && t < L[0] + 0.45) ? 1 : 0)) : 0;
    this._set('lda', this.ladder, 'opacity', a.toFixed(3));
    if (!L) return;
    const key = L[2].join(',') + '|' + L[3] + '|' + Math.round((t - L[0]) * 20);
    if (key === this._ladKey) return;
    this._ladKey = key;
    this.ladder.innerHTML = SaHud.ladderSvg(L[2], L[3], t - L[0]);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="saAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // the ladder: each speed, and the drop that hits as hard (bars on a log scale, 5 cm … 5 km); your window's height
  static ladderSvg(keys, hot, u) {
    const w = 380, h = 676, rows = SA_SPEEDS.filter((x) => keys.includes(x.k)), x0 = 24, bx = 24, bw = w - 48, lg = (m) => (Math.log10(m) - Math.log10(0.05)) / (Math.log10(5000) - Math.log10(0.05));
    let body = `${SaHud.plate(0.62, w, h)}<text x="${x0}" y="44" class="sm" style="font-size:25px;fill:#f6efe2">STOPPED DEAD FROM…</text><text x="${x0}" y="74" class="sm" style="font-size:22px">…LIKE FALLING FLAT FROM</text>`;
    const top = 104, rh = Math.min(62, (h - top - 30) / Math.max(rows.length, 1));
    rows.forEach((r, i) => {
      const y = top + i * rh, isHot = r.k === hot, grow = isHot ? MathX.smooth(u, 0.2, 1.1) : 1, bl = Math.max(6, bw * lg(Math.max(0.05, r.h)) * grow);
      body += `<text x="${x0}" y="${y + 24}" class="sm" style="font-size:23px;fill:${isHot ? '#ffffff' : '#c8c2b6'}">${r.l} <tspan style="fill:${isHot ? '#ffcf8a' : '#c8c2b6'}">${r.kmh === 10.8 ? '3 m/s' : r.kmh.toLocaleString('en-US') + ' km/h'}</tspan></text>
        <rect x="${bx}" y="${y + 33}" width="${bl.toFixed(1)}" height="14" rx="5" fill="${isHot ? '#ffcf8a' : 'rgba(246,239,226,0.55)'}"/>
        <text x="${(bx + bl + 8 > w - 90 ? w - 24 : bx + bl + 8).toFixed(1)}" y="${y + 46}" text-anchor="${bx + bl + 8 > w - 90 ? 'end' : 'start'}" class="sm" style="font-size:21px;fill:${isHot ? '#ffffff' : '#c8c2b6'};${bx + bl + 8 > w - 90 ? 'paint-order:stroke;stroke:rgba(6,9,14,0.9);stroke-width:5px' : ''}">${saHt(r.h)}</text>`;
    });
    // your kitchen's window, 12 m up (dashed)
    const wx = bx + bw * lg(12);
    body += `<line x1="${wx.toFixed(1)}" y1="${top - 6}" x2="${wx.toFixed(1)}" y2="${top + rows.length * rh}" stroke="rgba(159,196,255,0.7)" stroke-width="2" stroke-dasharray="5 6"/><text x="${(wx + 6).toFixed(1)}" y="${h - 16}" class="sm" style="font-size:19px;fill:#9fc4ff">YOUR WINDOW 12 m</text>`;
    return SaHud.svg(body, w, h);
  }
  // a cubic metre of air: what real frozen air is (shrunk 800×), and this air (set where it stood)
  static cube(u, t) {
    const k2 = MathX.smooth(t, saC('real', 1) - 0.4, saC('real', 1) + 0.6), k1 = MathX.smooth(u, 0.3, 1.0);
    const cube = (x, y, s, fill, stroke) => { const d = s * 0.35; return `<path d="M${x} ${y} h${s} v${s} h${-s} z" fill="${fill}" stroke="${stroke}" stroke-width="3"/><path d="M${x} ${y} l${d} ${-d} h${s} l${-d} ${d} z M${x + s} ${y} l${d} ${-d} v${s} l${-d} ${d} z" fill="${fill}" stroke="${stroke}" stroke-width="3" opacity="0.85"/>`; };
    return SaHud.svg(`${SaHud.plate()}
      <text x="30" y="56" class="t">1 m³ OF AIR · 1.2 kg</text>
      ${cube(60, 140, 250, 'rgba(159,196,255,0.08)', 'rgba(159,196,255,0.8)')}
      <text x="60" y="430" class="sm">AS AIR</text>
      <g opacity="${(k1 * (1 - k2)).toFixed(3)}">
        ${cube(500, 340, 31, 'rgba(255,207,138,0.85)', '#ffcf8a')}
        <text x="440" y="200" class="s">FROZEN, −210 °C</text><text x="440" y="240" class="sm">11 cm ACROSS: 800× SMALLER</text>
        <line x1="400" y1="300" x2="490" y2="350" stroke="#ffcf8a" stroke-width="3" marker-end="url(#saAh)"/>
      </g>
      <g opacity="${k2.toFixed(3)}">
        ${cube(60, 140, 250, 'rgba(255,207,138,0.22)', '#ffcf8a')}
        <text x="440" y="200" class="s">THIS AIR</text><text x="440" y="240" class="sm">SET WHERE IT STOOD</text><text x="440" y="275" class="sm">STILL 1 m³, 1.2 kg, 12 °C</text>
      </g>`);
  }
  // the bell's sound: a ring 41 m out from the tower when the air set; at 2:00:03 it splits in two (out and back)
  static ring(u) {
    const tw = [200, 250], you = [600, 250], px = (m) => m * (400 / 89), r0 = px(338 * 0.12), k = MathX.clamp((u - 1.6) / 3.2, 0, 1), d = px(48.7) * k;
    const op = (x) => (x > 0 ? 1 : 0);
    return SaHud.svg(`${SaHud.plate()}
      <text x="30" y="56" class="t">FROM ABOVE: THE BELL’S SOUND</text>
      <rect x="${tw[0] - 16}" y="${tw[1] - 16}" width="32" height="32" fill="#c8c2b6"/><text x="${tw[0]}" y="${tw[1] + 56}" text-anchor="middle" class="sm">TOWER</text>
      <rect x="${you[0] - 12}" y="${you[1] - 12}" width="24" height="24" fill="#9fc4ff"/><text x="${you[0]}" y="${you[1] + 56}" text-anchor="middle" class="sm" style="fill:#9fc4ff">YOU</text>
      <circle cx="${tw[0]}" cy="${tw[1]}" r="${r0.toFixed(1)}" fill="none" stroke="#ffcf8a" stroke-width="${(5 - 2.5 * op(k)).toFixed(1)}" stroke-dasharray="${k > 0 ? '' : '10 8'}" opacity="${k > 0 ? 0 : 1}"/>
      <circle cx="${tw[0]}" cy="${tw[1]}" r="${(r0 + d).toFixed(1)}" fill="none" stroke="#ffcf8a" stroke-width="3" opacity="${op(k)}"/>
      <circle cx="${tw[0]}" cy="${tw[1]}" r="${Math.max(0, r0 - d).toFixed(1)}" fill="none" stroke="#ffcf8a" stroke-width="3" opacity="${op(k) * (r0 - d > 2 ? 1 : 0)}"/>
      <text x="30" y="440" class="sm">${k > 0 ? '2:00:03 · HALF GOES ON, HALF GOES BACK' : '2:00:00 · CAUGHT IN THE AIR, 41 m OUT'}</text>`);
  }
}
