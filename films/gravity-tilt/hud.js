/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s films':
     top left     the countdown: GRAVITY BACK IN 59:42; under it how fast we're watching (REAL SPEED, SPED UP 25×) and,
                  on a cut that moves the hour on, how far (+8 MIN); after the return: GRAVITY · BACK +0:12
                  under that one context line for the scene (the fastest car, the terrace's slip, your house's lean…)
     top right    the time this morning, and a DOWN dial: which way down is, on the screen, right now
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right/left   the diagrams: the glass's load, Einstein's equivalence, the air, the pits, the damp-proof course,
                  a river becoming rain, wood under a long load
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// how fast we're watching
function gtSpeedTag(t) {
  const r = gtRate(t);
  if (Math.abs(r - 1) < 0.03) return 'REAL SPEED';
  if (r < 1) return 'SLOWED DOWN ' + (1 / r).toFixed(1).replace(/\.0$/, '') + '×';
  return 'SPED UP ' + (r < 3 ? r.toFixed(1).replace(/\.0$/, '') : Math.round(r)) + '×';
}
const gtKmh = (v) => Math.round(v * 3.6) + ' <small>km/h</small>';
const gtMmss = (x) => { x = Math.max(0, x); const m = Math.floor(x / 60), s = Math.floor(x % 60); return `${m}:${String(s).padStart(2, '0')}`; };
// the scene's context line: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const GT_CTX = (() => {
  const c = gtC, E = gtE, car = () => GT_FALLERS.filter((f) => f.k === 'car').sort((a, b) => b.d - a.d)[0], chair = () => GT_FALLERS.find((f) => f.k === 'gchair');
  const lean = (t, s) => ({ v: gtLean(s).toFixed(2) + '<small>°</small>', v2: 'TOWARDS THE STREET' });
  const slip = (t, s) => { const d = gtTerSlip(s) * 100; return { v: (d < 10 ? d.toFixed(1) : Math.round(d)) + ' <small>cm</small>', v2: 'AND SPEEDING UP' }; };
  return [
    [c('tilt', 1) + 0.2, gtB('street', 0.2) - 0.1, 'THE CAR OUTSIDE YOUR HOUSE', (t, s) => { const f = car(), r = gtFaller(f, s); return r.hit ? { v: gtKmh(f.vHit), v2: 'HIT THE BOTTOM AT THAT' } : { v: gtKmh(r.v), v2: 'FALLEN ' + Math.round(r.x - f.x) + ' OF ' + Math.round(f.d) + ' m' }; }],
    [c('street', 0) + 0.2, c('street', 1) - 0.3, 'THE GARDEN CHAIR', (t, s) => { const f = chair(), r = gtFaller(f, s); return { v: gtKmh(r.v), v2: 'FALLEN ' + Math.round(r.x - f.x) + ' OF ' + Math.round(f.d) + ' m' }; }],
    [c('jogger', 1) - 0.4, E('jogger') + 0.3, 'SHE HAS HELD ON FOR', (t, s) => ({ v: gtMmss(s - GT_JOG.catch), v2: s > GT_JOG.climb[0] ? 'CLIMBING' : '' })],
    [c('bath', 1) - 0.2, E('bath') + 0.3, 'BATH WATER IN YOUR ROOM', (t, s) => ({ v: Math.round(GT_BATH.litres * gtSm(s, GT_BATH.t0 + 4, GT_BATH.t1)) + ' <small>litres</small>', v2: '' })],
    [c('slip', 0) - 0.2, E('slip') + 1.2, 'THE TERRACE HAS SLIPPED', slip],
    [gtS('going') - 0.4, GT.tRel - 0.1, 'THE TERRACE HAS SLIPPED', slip],
    [GT.tRel, GT.tTerHit + 1.0, 'THE TERRACE', (t, s) => { const r = gtTerHouse(0, s); return { v: gtKmh(r.v || 0), v2: r.hit ? 'HIT' : 'FALLEN ' + Math.round(Math.max(0, r.dx - GT_TER.dRel)) + ' OF 120 m' }; }],
    [c('rain', 0) - 0.2, c('rain', 2) - 0.6, 'THE RIVER’S WATER', (t, s) => { const fr = -GT_RIVER.dist + GT_RIVER.vDrop * (s - GT_RIVER.leave); return fr < 0 ? { v: (-fr / 1000).toFixed(2) + ' <small>km away</small>', v2: 'FALLING AT 34 km/h' } : { v: 'HERE', v2: 'FALLING AT 34 km/h' }; }],
    [gtS('wood') - 0.2, E('creep') + 0.4, 'YOUR HOUSE IS LEANING', lean],
    [c('bolt', 0) - 0.4, E('bolt') + 0.4, 'YOUR HOUSE IS LEANING', lean],
    [gtS('after') - 0.4, E('after') + 0.4, 'YOUR HOUSE IS LEANING', (t, s) => ({ v: gtLean(s).toFixed(2) + '<small>°</small>', v2: 'FOR GOOD' })],
  ];
})();

// a caption's text with its numbers in amber
function gtCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\d+(?:\.\d+)?(?:\s?°|\s?%|\s?km\/h|\s(?:degrees|metres|minutes|seconds|litres|houses|km|kg|cm)(?: per square metre)?)?|\bOne minute\b|\b90 degrees\b/g, (m) => `<span class="n">${m}</span>`);
}

class GtHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('gt-ro', '<div class="l"></div><div class="v"></div><div class="s"></div><div class="nx"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('gt-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('gt-clock', '<div class="l"></div><div class="v"></div><div class="dn"><span class="dl">DOWN</span><svg viewBox="-50 -50 100 100"><circle r="44" class="ring"/><g class="arr"><path d="M0 -26 L0 22 M-14 8 L0 24 L14 8"/></g><g class="into"><circle r="9"/><path d="M-20 -20 L20 20 M20 -20 L-20 20"/></g></svg></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.dn = this.clock.querySelector('.dn'); this.arr = this.clock.querySelector('.arr'); this.into = this.clock.querySelector('.into');
    this.band = mk('gt-band'); this.cap = mk('gt-cap');
    this.caps = GTT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: gtCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('gt-inset');
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
    const W = StoryHUD.win, s = set && set._s != null ? set._s : gtStoryAt(t);
    // ---- the countdown (from the moment gravity turns to the last frame)
    const ra = Math.max(W(t, GT.t0 - 0.05, GT.end + 1, 0.12, 0.5), 0);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      if (s < GTP.tBack) { this._txt('rol', this.roL, 'GRAVITY BACK IN'); const x = GTP.tBack - Math.max(0, s); this._html('rov', this.roV, x < 60 ? Math.floor(x) + '<small>.' + Math.floor((x % 1) * 10) + ' s</small>' : gtMmss(x)); }
      else { this._txt('rol', this.roL, 'GRAVITY'); this._html('rov', this.roV, 'BACK <small>+' + gtMmss(s - GTP.tBack) + '</small>'); }
      this._cls('roc', this.ro, s >= GTP.tBack - 10 && s < GTP.tBack ? 'gt-ro warn' : s >= GTP.tBack && s < GTP.tBack + 0.8 ? 'gt-ro hit' : 'gt-ro');
      // how fast we're watching; a jump in the hour (just after a cut)
      this._txt('ros', this.roS, t >= GT.title[1] - 0.3 && s < GTP.tBack + 2 ? gtSpeedTag(t) : '');
      const jp = GT_JUMPS.filter((j) => j.ds > 20 && t >= j.t && t < j.t + 2.6).pop();
      this._txt('ron', this.roN, jp ? (jp.ds >= 90 ? '+' + Math.round(jp.ds / 60) + ' MIN' : '+' + Math.round(jp.ds) + ' s') + ' LATER' : '');
    }
    // ---- the context line
    const cx = GT_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the time this morning, and which way is down on the screen
    const ca = W(t, GT.t0 - 0.05, GT.end + 1, 0.12, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = gtClockParts(s), sec = Math.floor(c.sec);
      this._txt('ckl', this.clockL, 'THIS MORNING');
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(sec).padStart(2, '0')}</small> <i>AM</i>`);
      this._down(s, set);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = GTT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'gt-cap q' : 'gt-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, s);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'gt-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = GtHud._p || (GtHud._p = new THREE.Vector3());
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
      d.className = right ? 'gt-lab r' : 'gt-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  // the DOWN dial: gravity (old down, or east during the hour) in camera space; along the view it's a ⊗ (away)
  _down(s, set) {
    const cam = set && set.camera; if (!cam) return;
    const g = GtHud._g || (GtHud._g = new THREE.Vector3()), q = GtHud._q || (GtHud._q = new THREE.Quaternion());
    const on = s >= 0 && s < GTP.tBack;
    g.set(on ? 1 : 0, on ? 0 : -1, 0); cam.getWorldQuaternion(q); g.applyQuaternion(q.invert());
    const flat = Math.hypot(g.x, g.y), into = flat < 0.45;
    const ang = Math.atan2(g.x, -g.y) * 180 / Math.PI;                 // (0 = straight down the screen)
    this._set('dnA', this.arr, 'opacity', into ? '0' : '1'); this._set('dnI', this.into, 'opacity', into ? '1' : '0');
    this._set('dnR', this.arr, 'transform', `rotate(${(-ang).toFixed(1)}deg)`);
    this._cls('dnC', this.dn, on ? 'dn on' : 'dn');
  }

  // the diagrams (SVG, 760×470 design px)
  _insets(t, s) {
    const W = StoryHUD.win, c = gtC, E = gtE;
    const which = [
      ['glassload', c('glass', 1) + 0.2, E('glass') + 0.2, ''],
      ['einstein', c('nuance', 1) + 0.15, c('nuance', 2) - 0.35, 'left'],
      ['airwind', c('air', 1) + 0.15, c('air', 2) - 0.35, ''],
      ['pits', c('pit', 2) + 0.1, E('pit') + 0.3, ''],
      ['dpc', c('brick', 1) + 0.15, E('brick') + 0.2, 'left'],
      ['rain', c('rain', 1) + 0.15, c('rain', 2) - 0.35, ''],
      ['creep', c('creep', 0) + 0.2, E('creep') + 0.2, ''],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'gt-inset' : 'gt-inset ' + which[3]);
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = GtHud[k](u, t, s);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static arrow(x1, y1, x2, y2, col = '#ffcf8a', w = 6) { const a = Math.atan2(y2 - y1, x2 - x1), h = 16; return `<line x1="${x1}" y1="${y1}" x2="${x2 - Math.cos(a) * 8}" y2="${y2 - Math.sin(a) * 8}" stroke="${col}" stroke-width="${w}"/><path d="M${x2} ${y2} L${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)} L${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)} Z" fill="${col}"/>`; }
  // the window's glass: built for wind (a spread push of ~100 kg/m²); you lying on it; you kneeling on it
  static glassload(u) {
    const k1 = MathX.smooth(u, 0.2, 0.8), k2 = MathX.smooth(u, 1.6, 2.2), k3 = MathX.smooth(u, 4.2, 4.8), crack = MathX.smooth(u, 5.0, 5.4);
    let wind = ''; for (let i = 0; i < 7; i++) wind += GtHud.arrow(70 + i * 30, 150, 70 + i * 30, 205, '#9fc6e6', 4);
    const pane = (x, y) => `<rect x="${x}" y="${y}" width="210" height="14" fill="#bfe0ee" opacity="0.8"/>`;
    return GtHud.svg(`${GtHud.plate()}
      <text x="40" y="50" class="t">A WINDOW PANE, FROM THE SIDE</text>
      <g opacity="${k1}">${pane(50, 214)}${wind}<text x="155" y="262" class="sm" text-anchor="middle">WIND</text><text x="155" y="288" class="sm" text-anchor="middle">~100 kg/m²</text><text x="155" y="326" class="b" text-anchor="middle">✓ BUILT FOR</text></g>
      <g opacity="${k2}">${pane(290, 214)}<path d="M300 212 q 95 -40 190 0 z" fill="#d8b49a"/><text x="395" y="262" class="sm" text-anchor="middle">YOU, LYING</text><text x="395" y="288" class="sm" text-anchor="middle">~150 kg/m²</text><text x="395" y="326" class="b" text-anchor="middle">? MIGHT HOLD</text></g>
      <g opacity="${k3}">${pane(530, 214)}<path d="M600 212 l 14 -70 l 14 70 z M650 212 l 12 -70 l 12 70 z" fill="#d8b49a"/>${GtHud.arrow(613, 110, 613, 196, '#ff8a6a', 5)}${GtHud.arrow(662, 110, 662, 196, '#ff8a6a', 5)}
        <text x="635" y="262" class="sm" text-anchor="middle">KNEELING</text><text x="635" y="288" class="sm" text-anchor="middle">~4,000 kg/m²</text><text x="635" y="326" class="b" text-anchor="middle" fill="#ff8a6a">✗ THROUGH</text>
        <path d="M600 228 l 18 30 M 640 228 l -10 40 M 660 228 l 20 26" stroke="#fff" stroke-width="2" opacity="${crack}"/></g>
      <text x="40" y="420" class="s" opacity="${k3}">THE SAME WEIGHT. LESS GLASS TO SPREAD IT ON</text>`);
  }
  // Einstein: inside a closed room you can't tell a pull to the side from a room tipped on its side
  static einstein(u) {
    const k = MathX.smooth(u, 0.2, 0.9), k2 = MathX.smooth(u, 1.4, 2.1);
    const room = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-80" y="-80" width="160" height="160" fill="none" stroke="#f6efe2" stroke-width="5"/>
      <rect x="-60" y="40" width="70" height="26" fill="#a8744a"/><rect x="40" y="-30" width="22" height="96" fill="#c9b79a"/><circle cx="-20" cy="-50" r="11" fill="#ffcf8a"/><line x1="-20" y1="-80" x2="-20" y2="-61" stroke="#ffcf8a" stroke-width="3"/></g>`;
    return GtHud.svg(`${GtHud.plate()}
      <text x="40" y="50" class="t">FROM INSIDE, THESE ARE THE SAME</text>
      <g opacity="${k}">${room(200, 250, 0)}${GtHud.arrow(200, 360, 200, 420, '#ffcf8a', 6)}<text x="200" y="455" class="sm" text-anchor="middle">A ROOM ON ITS SIDE</text></g>
      <g opacity="${k2}">${room(560, 250, -90)}${GtHud.arrow(660, 250, 720, 250, '#ffcf8a', 6)}<text x="560" y="455" class="sm" text-anchor="middle">GRAVITY TURNED SIDEWAYS</text></g>
      <text x="380" y="262" class="b" text-anchor="middle" opacity="${k2}">=</text>`);
  }
  // if the air fell sideways too: wind speed against time, through the speed of sound at 35 s
  static airwind(u) {
    const k = MathX.smooth(u, 0.2, 0.8), p = MathX.clamp((u - 0.5) / 2.6, 0, 1), X = (s) => 90 + s / 45 * 600, Y = (v) => 400 - v / 450 * 300;
    let d = `M${X(0)} ${Y(0)}`; for (let s = 0; s <= 45 * p; s += 1) d += ` L${X(s).toFixed(1)} ${Y(9.81 * s).toFixed(1)}`;
    return GtHud.svg(`${GtHud.plate()}<g opacity="${k}">
      <line x1="90" y1="400" x2="700" y2="400" stroke="#f6efe2" stroke-width="3"/><line x1="90" y1="400" x2="90" y2="90" stroke="#f6efe2" stroke-width="3"/>
      <line x1="90" y1="${Y(343)}" x2="700" y2="${Y(343)}" stroke="#ff8a6a" stroke-width="3" stroke-dasharray="8 7"/><text x="700" y="${Y(343) - 12}" class="sm" text-anchor="end">THE SPEED OF SOUND</text>
      <path d="${d}" stroke="#ffcf8a" stroke-width="6" fill="none"/>
      <text x="${X(35)}" y="430" class="sm" text-anchor="middle" opacity="${MathX.smooth(p, 0.75, 0.8)}">35 s</text>
      <text x="96" y="80" class="sm">WIND</text><text x="700" y="432" class="sm" text-anchor="end">TIME →</text></g>
      <text x="40" y="50" class="t">IF THE AIR FELL TOO</text>`);
  }
  // your house, on its side: every room a pit, its door in the ceiling
  static pits(u) {
    const k = MathX.smooth(u, 0.2, 0.9);
    let rooms = '';
    for (let i = 0; i < 4; i++) { const x = 230 + (i % 2) * 150, y = 120 + Math.floor(i / 2) * 150; rooms += `<rect x="${x}" y="${y}" width="140" height="140" fill="rgba(255,255,255,0.05)" stroke="#f6efe2" stroke-width="4"/><rect x="${x + 50}" y="${y - 3}" width="40" height="8" fill="#ffcf8a"/>`; }
    return GtHud.svg(`${GtHud.plate()}<g opacity="${k}">${rooms}${GtHud.arrow(560, 150, 560, 380, '#ffcf8a', 6)}<text x="580" y="270" class="sm">DOWN</text>
      <text x="380" y="440" class="sm" text-anchor="middle">EVERY DOOR IS IN A CEILING</text></g><text x="40" y="50" class="t">YOUR HOUSE, AS IT FEELS</text>`);
  }
  // brick on a damp-proof course: before, its weight pressed it onto the strip (friction holds it); now its weight
  // pulls it along the strip, and only the mortar's grip holds it
  static dpc(u) {
    const k = MathX.smooth(u, 0.2, 0.8), k2 = MathX.smooth(u, 2.0, 2.8), sl = 8 * MathX.smooth(u, 4.0, 6.0);
    let br = ''; for (let r = 0; r < 6; r++) for (let i = 0; i < 4; i++) br += `<rect x="${(r % 2 ? 26 : 0) + 22 + i * 52}" y="${150 + r * 26}" width="48" height="22" fill="#a4553a"/>`;
    const wall = (x, dx) => `<g transform="translate(${x + dx} 0)">${br}</g><rect x="${x + 10}" y="310" width="230" height="8" fill="#111"/><rect x="${x + 10}" y="318" width="230" height="40" fill="#8a847a"/>`;
    return GtHud.svg(`${GtHud.plate()}
      <g opacity="${k}">${wall(40, 0)}${GtHud.arrow(165, 90, 165, 140, '#ffcf8a', 6)}<text x="165" y="392" class="sm" text-anchor="middle">BEFORE: ITS WEIGHT</text><text x="165" y="416" class="sm" text-anchor="middle">PRESSES IT DOWN</text><text x="165" y="448" class="b" text-anchor="middle">FRICTION HOLDS IT</text></g>
      <g opacity="${k2}">${wall(430, sl)}${GtHud.arrow(560, 230, 720, 230, '#ffcf8a', 6)}<text x="555" y="392" class="sm" text-anchor="middle">NOW: ITS WEIGHT</text><text x="555" y="416" class="sm" text-anchor="middle">PULLS IT ALONG</text><text x="555" y="448" class="b" text-anchor="middle">ONLY THE MORTAR HOLDS</text></g>
      <text x="40" y="50" class="t">BRICK ON A DAMP-PROOF COURSE</text><text x="40" y="84" class="s">THE BLACK STRIP: PLASTIC</text>`);
  }
  // a column of water falling a long way breaks up: by the bottom it's spray (Angel Falls, 979 m); 4 km: rain
  static rain(u) {
    const k = MathX.smooth(u, 0.2, 0.8), p = MathX.smooth(u, 0.5, 2.6);
    let d = '';
    for (let i = 0; i < 70; i++) { const f = i / 70, x = 90 + f * 600 * p, br = f * f; if (f > p) break; d += `<circle cx="${x.toFixed(1)}" cy="${(235 + (gtR(i, 5) - 0.5) * 110 * br).toFixed(1)}" r="${(9 - 6 * br).toFixed(1)}" fill="#bfe0ee" opacity="${(1 - 0.4 * br).toFixed(2)}"/>`; }
    return GtHud.svg(`${GtHud.plate()}<g opacity="${k}"><rect x="40" y="200" width="50" height="70" fill="#5d8aa0"/>${d}
      ${GtHud.arrow(100, 330, 690, 330, '#ffcf8a', 5)}<text x="395" y="370" class="sm" text-anchor="middle">4 km, FALLING</text>
      <text x="90" y="170" class="sm">A SHEET</text><text x="690" y="170" class="sm" text-anchor="end" opacity="${MathX.smooth(p, 0.8, 1)}">DROPS</text></g>
      <text x="40" y="50" class="t">WATER THAT FALLS FAR BREAKS UP</text><text x="40" y="430" class="s">ANGEL FALLS (979 m) IS MOSTLY SPRAY AT THE BOTTOM</text>`);
  }
  // wood under a load that never stops: the longer it lasts, the less it can take (log time)
  static creep(u) {
    const k = MathX.smooth(u, 0.2, 0.9), p = MathX.smooth(u, 0.5, 2.6), X = (lg) => 100 + (lg + 0.5) / 9 * 580, Y = (f) => 390 - f * 260;
    const curve = (lg) => 1.08 - 0.065 * (lg + 0.5) - 0.004 * (lg + 0.5) ** 2;
    let d = ''; for (let lg = -0.5; lg <= -0.5 + 9 * p; lg += 0.1) d += (d ? ' L' : 'M') + X(lg).toFixed(1) + ' ' + Y(curve(lg)).toFixed(1);
    const m = Math.log10(900), lab = [['1 s', 0], ['1 min', Math.log10(60)], ['1 hour', Math.log10(3600)], ['1 year', Math.log10(3.15e7)]];
    return GtHud.svg(`${GtHud.plate()}<g opacity="${k}"><line x1="100" y1="390" x2="690" y2="390" stroke="#f6efe2" stroke-width="3"/><line x1="100" y1="390" x2="100" y2="110" stroke="#f6efe2" stroke-width="3"/>
      <path d="${d}" stroke="#ffcf8a" stroke-width="6" fill="none"/>
      ${lab.map(([l, lg]) => `<text x="${X(lg)}" y="420" class="sm" text-anchor="middle">${l}</text>`).join('')}
      <g opacity="${MathX.smooth(p, 0.4, 0.5)}"><line x1="${X(m)}" y1="390" x2="${X(m)}" y2="${Y(curve(m))}" stroke="#ff8a6a" stroke-width="3" stroke-dasharray="6 6"/><circle cx="${X(m)}" cy="${Y(curve(m))}" r="9" fill="#ff8a6a"/><text x="${X(m) + 14}" y="${Y(curve(m)) - 14}" class="sm">15 MIN</text></g>
      <text x="108" y="100" class="sm">STRENGTH</text></g>
      <text x="40" y="50" class="t">WOOD UNDER A LOAD THAT LASTS</text>`);
  }
}
