/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     the countdown: FRICTION BACK IN 7.81 s (FRICTION GOES IN, before it goes; FRICTION · BACK, after);
                  under it one context line for the scene (how fast everything on the hill is going, the bus's turn…)
     bottom left  the honest label: how fast we're watching (SLOWED DOWN 10×, REAL SPEED, REWIND, REPLAY, FLASH-FORWARD)
     top right    the time this morning, to the hundredth of a second
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams (illustrations): atoms snagging, push but no grip, a fault, a screw is a ramp, cotton
                  thread, a pile of sugar, Galileo's ramp
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// the honest speed label for a shot at film time t
function fzSpeedTag(shot, t) {
  if (shot.mode === 'question' || shot.mode === 'after' || shot.mode === 'phone3') return '';
  const r = fzRate(shot, t);
  let x;
  if (r < -0.05) x = 'REWIND';
  else if (Math.abs(r - 1) < 0.03) x = 'REAL SPEED';
  else { const n = 1 / Math.max(1e-4, r); x = 'SLOWED DOWN ' + (n >= 12 ? Math.round(n / 5) * 5 : Math.round(n)) + '×'; }
  if (shot.flash) return 'FLASH-FORWARD · ' + x;
  if (shot.mode === 'screws') x = 'INSIDE THE CABINET · ' + x;
  return shot.replay && x !== 'REWIND' ? 'REPLAY · ' + x : x;
}
// the scene's context line: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const fzKmh = (v) => (v * 3.6).toFixed(1) + ' <small>km/h</small>';
const FZ_CTX = [
  [fzCap('floor', 0).show + 0.4, fzS('hill') - 0.6, 'EVERYTHING ON YOUR FLOOR', (t, s) => ({ v: fzKmh(FZP.aFloor * s), v2: 'AND SPEEDING UP' })],
  [fzCap('hill', 0).show + 0.4, fzS('realspeed') - 0.6, 'EVERYTHING ON THE HILL', (t, s) => ({ v: fzKmh(FZP.aHill * s), v2: 'SLID ' + fzHalf(FZP.aHill, s).toFixed(1) + ' m SO FAR' })],
  [fzS('faster') - 2.6, fzS('sofa') - 0.5, 'EVERYTHING ON THE HILL', (t, s) => ({ v: fzKmh(FZP.aHill * s), v2: 'SLID ' + fzHalf(FZP.aHill, s).toFixed(1) + ' m SO FAR' })],
  [fzCap('bus', 1).show, fzS('phone2') - 0.6, 'THE BUS', (t, s) => { const b = fzBusAt(s); return { v: fzKmh(Math.hypot(b.vx, b.vz)), v2: 'TURNED ' + Math.round((b.yaw - FZ_BUS.yaw0) * 57.3) + '° AND STILL TURNING' }; }],
  [fzS('warn') + 0.3, fzS('back') - 0.4, 'EVERYTHING ON THE HILL', (t, s) => ({ v: fzKmh(FZP.aHill * Math.min(s, 10)), v2: 'SLID ' + fzHalf(FZP.aHill, Math.min(s, 10)).toFixed(1) + ' m SO FAR' })],
];

// a caption's text with its numbers in amber
function fzCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\d+(?:\.\d+)?(?:\s?%|\s?km\/h|\s(?:seconds?|years|times)(?: old| slower)?)?|\bhalf a degree\b|\bfirst second(?: and a half)?\b/g, (m) => `<span class="n">${m}</span>`);
}

class FzHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('fz-ro', '<div class="l"></div><div class="v"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v');
    this.ctx = mk('fz-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('fz-tag');
    this.clock = mk('fz-clock', '<div class="l"></div><div class="v"></div>'); this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v');
    this.band = mk('fz-band'); this.cap = mk('fz-cap');
    this.caps = FZT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: fzCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('fz-inset');
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
    const W = StoryHUD.win, m = shot.mode, s = set && set._s != null ? set._s : fzStoryAt(t);
    const quiet = m === 'question' || m === 'phone3' || m === 'after';
    // ---- the countdown (from the moment friction goes; off for the closing shots)
    const ra = quiet ? 0 : Math.max(W(t, FZ.t0 - 0.05, fzS('after') - 0.6, 0.12, 0.5), 0);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      if (s < 0) { this._txt('rol', this.roL, 'FRICTION GOES IN'); this._html('rov', this.roV, (-s).toFixed(2) + '<small> s</small>'); }
      else if (s < 10) { this._txt('rol', this.roL, 'FRICTION BACK IN'); this._html('rov', this.roV, Math.max(0, 10 - s).toFixed(2) + '<small> s</small>'); }
      else { this._txt('rol', this.roL, 'FRICTION'); this._html('rov', this.roV, 'BACK <small>+' + (s - 10).toFixed(2) + ' s</small>'); }
      this._cls('roc', this.ro, s >= 7 && s < 10 ? 'fz-ro warn' : s >= 10 && s < 10.6 ? 'fz-ro hit' : 'fz-ro');
    }
    // ---- the context line
    const cx = FZ_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = t >= FZ.title[1] - 0.3 ? fzSpeedTag(shot, t) : '';
    this._set('tg', this.tag, 'opacity', tg ? W(t, shot.t0 + 0.05, shot.t1, 0.25, 0.1).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg);
    // ---- the time this morning
    const ca = quiet ? 0 : W(t, FZ.t0 - 0.05, fzS('after') - 0.6, 0.12, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = fzClockParts(s), sec = Math.floor(c.sec), cs = Math.floor((c.sec - sec) * 100);
      this._txt('ckl', this.clockL, 'THIS MORNING');
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}</small> <i>AM</i>`);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = FZT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'fz-cap q' : 'fz-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, s);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'fz-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = FzHud._p || (FzHud._p = new THREE.Vector3());
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
      d.style.left = lx.toFixed(2) + '%'; d.style.top = Math.min(74, Math.max(ly, 20)).toFixed(2) + '%';   // (never down on the caption)
      d.className = right ? 'fz-lab r' : 'fz-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  // the diagrams (SVG, 760×470 design px)
  _insets(t, s) {
    const W = StoryHUD.win, c = (id, k) => fzCap(id, k).show;
    const which = [
      ['atoms', c('nuance', 0) + 0.2, c('nuance', 1) - 0.3, ''],
      ['push', c('nuance', 2) + 0.1, c('nuance', 3) - 0.3, ''],
      ['fault', c('nuance', 3) + 1.0, fzE('nuance') + 0.2, ''],
      ['screw', c('screws', 0) + 0.2, c('screws', 2) - 0.3, ''],
      ['cotton', c('cotton', 1) - 0.2, fzE('cotton') + 0.1, ''],
      ['pile', c('sugar', 1) - 0.2, fzE('sugar') + 0.2, ''],
      ['galileo', c('same', 1) + 0.1, fzE('same') + 0.2, ''],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'fz-inset' : 'fz-inset ' + which[3]);
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = FzHud[k](u, t, s);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // two surfaces close up: their atoms, the bumps snagging (electric attraction where they touch); then the snag lets go
  static atoms(u) {
    const k = MathX.smooth(u, 0.2, 0.9), go = MathX.smooth(u, 2.0, 2.8), dx = 46 * go * Math.min(1, Math.max(0, u - 2.0) / 1.5);
    let top = '', bot = '', snag = '';
    for (let i = 0; i < 15; i++) {
      const x = 80 + i * 43, yb = 300 - 18 * Math.abs(Math.sin(i * 1.7)) - (i % 4 === 1 ? 26 : 0), yt = 196 + 16 * Math.abs(Math.sin(i * 2.3 + 1)) + (i % 5 === 3 ? 24 : 0);
      bot += `<circle cx="${x}" cy="${yb + 30}" r="19" fill="#c08a5c"/><circle cx="${x}" cy="${yb + 70}" r="19" fill="#a8744a"/>`;
      top += `<circle cx="${x + dx}" cy="${yt - 30}" r="19" fill="#7fa6cc"/><circle cx="${x + dx}" cy="${yt - 70}" r="19" fill="#6a92ba"/>`;
      if (i % 4 === 1 || i % 5 === 3) snag += `<g opacity="${(k * (1 - go)).toFixed(2)}"><line x1="${x}" y1="${yt - 10}" x2="${x}" y2="${yb + 12}" stroke="#ffcf8a" stroke-width="4" stroke-dasharray="5 5"/></g>`;
    }
    return FzHud.svg(`${FzHud.plate()}<g opacity="${k}">${bot}${top}${snag}</g>
      <text x="40" y="50" class="t">TWO SURFACES, ATOM BY ATOM</text>
      <text x="40" y="88" class="s" opacity="${(k * (1 - go)).toFixed(2)}">WHERE THEY TOUCH, THEY PULL ON EACH OTHER: THEY SNAG</text>
      <text x="40" y="446" class="b" opacity="${go.toFixed(2)}">NOW: NO SNAG. THEY SLIDE PAST</text>`);
  }
  // push ✓ grip ✗: a hand pressing straight down on a block, and pulling it sideways
  static push(u) {
    const k = MathX.smooth(u, 0.2, 0.9), q = MathX.smooth(u, 1.6, 2.4), slip = 60 * MathX.smooth(u, 2.4, 3.6);
    const blk = (x, y) => `<rect x="${x}" y="${y}" width="150" height="90" rx="8" fill="#c9b79a"/>`;
    return FzHud.svg(`${FzHud.plate()}
      <rect x="40" y="320" width="300" height="16" fill="#6b5a48"/><rect x="420" y="320" width="300" height="16" fill="#6b5a48"/>
      <g opacity="${k}">${blk(115, 230)}<line x1="190" y1="120" x2="190" y2="214" stroke="#ffcf8a" stroke-width="8"/><path d="M174 206 l16 22 l16 -22 z" fill="#ffcf8a"/>
      <text x="190" y="390" class="b" text-anchor="middle">PUSH: STILL WORKS</text><text x="190" y="436" class="s" text-anchor="middle">IT DOESN'T GO THROUGH</text></g>
      <g opacity="${q}">${blk(495 + slip, 230)}<line x1="${640 + slip}" y1="275" x2="${712 + slip}" y2="275" stroke="#ffcf8a" stroke-width="8"/><path d="M${706 + slip} 259 l22 16 l-22 16 z" fill="#ffcf8a"/>
      <line x1="460" y1="355" x2="720" y2="355" stroke="#ff8a6a" stroke-width="0"/>
      <text x="570" y="390" class="b" text-anchor="middle">GRIP: GONE</text><text x="570" y="436" class="s" text-anchor="middle">NOTHING HOLDS IT SIDEWAYS</text></g>
      <text x="40" y="50" class="t">WHAT CHANGES</text>`);
  }
  // a fault: two blocks of rock locked by friction; unlocked, they lurch
  static fault(u) {
    const k = MathX.smooth(u, 0.1, 0.7), go = MathX.smooth(u, 0.9, 1.5), d = 26 * go;
    return FzHud.svg(`${FzHud.plate()}<g opacity="${k}">
      <rect x="40" y="130" width="680" height="12" fill="#5f8a4a"/>
      <path d="M40 142 L${380 + 30} 142 L${330} 420 L40 420 Z" fill="#7a6048" transform="translate(${-d} ${d * 0.25})"/>
      <path d="M${410} 142 L720 142 L720 420 L${330} 420 Z" fill="#8c7054" transform="translate(${d} ${-d * 0.25})"/>
      <line x1="410" y1="142" x2="330" y2="420" stroke="#ffcf8a" stroke-width="4" stroke-dasharray="8 6"/>
      <text x="470" y="300" class="s" opacity="${(1 - go).toFixed(2)}">LOCKED BY FRICTION</text>
      <text x="470" y="300" class="b" opacity="${go.toFixed(2)}">IT SLIPS: AN EARTHQUAKE</text></g>
      <text x="40" y="50" class="t">A FAULT, UNDERGROUND</text><text x="40" y="88" class="s">(THIS FILM: ABOVE GROUND ONLY)</text>`);
  }
  // a screw is a ramp wrapped round a pin: unwrap its thread into a slope; a weight on it slides down
  static screw(u) {
    const k = MathX.smooth(u, 0.2, 1.0), un = MathX.smooth(u, 1.6, 3.0), sl = MathX.smooth(u, 4.6, 6.6);
    let thread = '';
    for (let i = 0; i < 6; i++) thread += `<path d="M150 ${130 + i * 40} L250 ${150 + i * 40}" stroke="#d8d4ca" stroke-width="7" stroke-linecap="round" opacity="${(1 - un * 0.6).toFixed(2)}"/>`;
    const bx = 430 + 220 * sl, by = 160 + 160 * sl;
    return FzHud.svg(`${FzHud.plate()}<g opacity="${k}">
      <rect x="170" y="110" width="60" height="260" rx="6" fill="#9aa0a6"/>${thread}
      <path d="M150 112 h100 v18 h-100 z" fill="#b8bec4"/>
      <g opacity="${un}"><path d="M400 380 L700 380 L400 140 Z" fill="none" stroke="#ffcf8a" stroke-width="5"/>
      <text x="430" y="420" class="s">THE THREAD, UNWRAPPED: A RAMP</text>
      <rect x="${(bx - 24).toFixed(1)}" y="${(by - 40).toFixed(1)}" width="48" height="36" rx="5" fill="#c9b79a" transform="rotate(38.7 ${bx.toFixed(1)} ${by.toFixed(1)})"/></g></g>
      <text x="40" y="50" class="t">A SCREW IS A RAMP</text>
      <text x="40" y="88" class="s" opacity="${sl.toFixed(2)}">NO FRICTION: THE LOAD SLIDES DOWN IT. THE SCREW TURNS</text>`);
  }
  // cotton thread: short fibres twisted together; pulled, they slide apart
  static cotton(u) {
    const k = MathX.smooth(u, 0.2, 1.0), pull = MathX.smooth(u, 2.6, 4.4);
    let f = '';
    for (let i = 0; i < 26; i++) {
      const x0 = 60 + (i % 13) * 48 + (i < 13 ? 0 : 24), side = x0 + 20 < 380 ? -1 : 1, dx = side * pull * (40 + 60 * fzR(i, 3)), y = 225 + 22 * Math.sin(i * 1.9) * (1 - pull * 0.3);
      f += `<path d="M${x0 + dx} ${y - 18} q 30 ${18 + 8 * fzR(i, 5)} 70 ${36}" stroke="${i % 2 ? '#efe8da' : '#d8cfbd'}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    }
    return FzHud.svg(`${FzHud.plate()}<g opacity="${k}">${f}
      <path d="M40 250 h${(30 - 20 * pull).toFixed(0)}" stroke="#ffcf8a" stroke-width="6" opacity="${pull.toFixed(2)}"/>
      </g><text x="40" y="50" class="t">COTTON THREAD, MAGNIFIED</text><text x="40" y="88" class="s">SHORT FIBRES, TWISTED: FRICTION HOLDS THEM</text>
      <text x="40" y="446" class="b" opacity="${pull.toFixed(2)}">WITHOUT IT, A PULL JUST SLIDES THEM APART</text>`);
  }
  // a pile: grains stack up to a slope (about 30–35° for sugar or sand) because they grip; without friction, flat
  static pile(u) {
    const k = MathX.smooth(u, 0.2, 0.9), flat = MathX.smooth(u, 1.6, 3.0), h = 190 * (1 - flat) + 14 * flat, w = 200 + 230 * flat;
    let gr = '';
    for (let i = 0; i < 160; i++) { const a = fzR(i, 1), b = fzR(i, 2), x = 380 + (a - 0.5) * 2 * w * (1 - b * 0.6), y = 360 - h * (1 - Math.abs(x - 380) / w) * b; gr += `<circle cx="${x.toFixed(1)}" cy="${Math.min(358, y).toFixed(1)}" r="7" fill="${i % 3 ? '#efe9de' : '#d9d2c4'}"/>`; }
    return FzHud.svg(`${FzHud.plate()}<rect x="40" y="366" width="680" height="10" fill="#6b5a48"/><g opacity="${k}">${gr}
      <path d="M${380 - 200} 362 L380 ${362 - 190} L${380 + 200} 362" fill="none" stroke="#ffcf8a" stroke-width="3" stroke-dasharray="7 6" opacity="${(1 - flat).toFixed(2)}"/>
      <text x="${380 + 120}" y="250" class="s" opacity="${(1 - flat).toFixed(2)}">ABOUT 35°</text></g>
      <text x="40" y="50" class="t">A PILE OF GRAINS</text><text x="40" y="88" class="s">THEY GRIP EACH OTHER: THAT HOLDS THE SLOPE</text>
      <text x="40" y="446" class="b" opacity="${flat.toFixed(2)}">NO FRICTION: IT FLOWS FLAT, LIKE WATER</text>`);
  }
  // Galileo: a ball rolling down a gentle ramp is falling, slowed down; he timed it with water clocks
  static galileo(u) {
    const k = MathX.smooth(u, 0.2, 0.9), r = (u * 0.8) % 3.2, d = Math.min(1, 0.5 * 0.9 * r * r / 4.6), bx = 120 + 520 * d, by = 200 + 120 * d;
    return FzHud.svg(`${FzHud.plate()}<g opacity="${k}">
      <path d="M100 196 L660 334 L660 352 L100 352 Z" fill="#7a6048"/>
      <circle cx="${bx.toFixed(1)}" cy="${(by - 14).toFixed(1)}" r="14" fill="#d8d4ca"/>
      <line x1="${bx.toFixed(1)}" y1="${(by - 30).toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(by - 30).toFixed(1)}" stroke="#ffcf8a"/>
      <path d="M690 120 v220" stroke="#ffcf8a" stroke-width="4" stroke-dasharray="6 6"/><circle cx="690" cy="${(120 + 220 * Math.min(1, r * r / 1.6)).toFixed(1)}" r="12" fill="#ffcf8a"/>
      <text x="560" y="110" class="s">FALLING</text><text x="300" y="400" class="s">THE SAME, SLOWED DOWN</text></g>
      <text x="40" y="50" class="t">GALILEO’S RAMP, 1600s</text>`);
  }
}
