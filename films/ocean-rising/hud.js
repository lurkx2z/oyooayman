/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the long-form films' (Slower light, No light, Everything kept shrinking):
     top left     THE SEA: how far it has risen since 6:42 PM; the countdown to the lamp (47 m)
     top right    the day and the time; REAL SPEED, or "+4 MIN LATER" when the clock jumps at a cut (it only runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       the rivers (a minute of new water); the tower's side view (your boat down there); every glacier
     bottom left  the honest labels (what is impossible, what is fictional)
     in the scene labels the set pins to things (set.labels(t) → [{ p, text, sub, a, side }]); the binoculars' mask
   ===================================================================== */

const ocN = (x) => Math.round(x).toLocaleString('en-US');
const ocMS = (sec) => { sec = Math.max(0, Math.ceil(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };

// the scene's context box: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const OC_CTX = (() => {
  const P = OCP, T = OC_F.tower, beat = (id, l, f, k0 = 0, k1) => [ocC(id, k0) - 0.2, (k1 != null ? ocCap(id, k1).hide : ocE(id)) + 0.2, l, f];
  return [
    beat('start', 'HIGH WATER TONIGHT', () => ({ v: '6:42 <small>PM</small>', v2: 'THE TIDE TURNS AT HIGH WATER, EVERY 12½ HOURS' }), 0, 1),
    beat('boat', 'THE BOAT’S BOW LINE', (t, s) => ({ v: `${OC_F.boat.rope.toFixed(2)} <small>m</small>`, v2: s < OCE.taut ? 'SLACK' : s < OCE.flood ? 'TAUT · HOLDING THE BOW DOWN' : 'THE SEA POURS IN' }), 0, 1),
    beat('rule', 'NEW WATER, EVERY MINUTE', () => ({ v: `${ocN(P.perMinKm3)} <small>km³</small>`, v2: 'THE OCEANS: 361 MILLION km² × 1 m' }), 0, 0),
    beat('height', 'THE LAMP', (t, s) => ({ v: `${T.lamp} <small>m</small>`, v2: `THE SEA: ${P.h(s).toFixed(1)} m · ${(T.lamp - P.h(s)).toFixed(1)} m TO GO` })),
    beat('lichen', 'HERE, ORANGE LICHEN GROWS UP TO', () => ({ v: '3.6 <small>m</small>', v2: 'ABOVE THE HIGHEST TIDES: ONLY THE SPRAY REACHES IT' })),
    beat('phone', 'PORT ELLERY', (t, s) => ({ v: '22 <small>km</small>', v2: `THE SEA THERE: +${P.h(s).toFixed(1)} m TOO` })),
    beat('radio', 'VHF CHANNEL 16', () => ({ v: 'MAYDAY <small>×</small> 40', v2: 'THE COAST’S DISTRESS CALLS, ALL AT ONCE' })),
    beat('bell', 'THE BUOY’S CHAIN', (t, s) => ({ v: `${OC_F.bell.chain} <small>m</small>`, v2: `THE WATER UNDER IT: ${(OC_F.bell.depth + P.h(s)).toFixed(1)} m DEEP` })),
    beat('world', 'LIVE UNDER 10 m', () => ({ v: '1 <small>IN 10</small>', v2: 'ABOUT 800 MILLION PEOPLE' })),
    beat('fog', 'THE FOG SIGNAL', () => ({ v: '1907 <small>BUILT</small>', v2: 'ITS FLOOR: 10.5 m OVER HIGH WATER' })),
    beat('cottage', 'YOUR KITCHEN', (t, s) => ({ v: `${Math.max(0, (P.houseWater(s) - OC_F.house.floor) * 100).toFixed(0)} <small>cm</small>`, v2: 'OF WATER ON THE FLOOR' })),
    beat('island', 'HARROW ROCK’S TOP', () => ({ v: '15 <small>m</small>', v2: 'UNDER THE SEA NOW' })),
    beat('door', 'THE SEA ON THE DOOR', (t, s) => ({ v: `${P.doorTonnes(P.h(s)).toFixed(1)} <small>TONNES</small>`, v2: `ITS BOLTS GIVE AT ABOUT ${P.doorT} TONNES · ${Math.max(0, P.h(s) - T.sill - T.door.h).toFixed(1)} m OVER ITS TOP` }), 0, 1),
    beat('stairs', 'THE WATER IN THE TOWER', (t, s) => ({ v: `+${P.towerWater(s).toFixed(1)} <small>m</small>`, v2: `THE WATCH ROOM: +${T.watch} m` })),
    beat('town', 'THE MAINLAND’S POWER', (t, s) => ({ v: P.h(s) < P.gridFail ? 'ON' : 'OFF', v2: 'ITS SUBSTATIONS ARE AT THE COAST' })),
    beat('lights', 'LIGHTHOUSES IN SIGHT STILL LIT', (t, s) => ({ v: `${1 + OC_F.lights.filter((l) => l[2] > P.h(s)).length}`, v2: OC_F.lights.filter((l) => l[2] > P.h(s)).map((l) => l[5].toUpperCase()).concat(['YOURS']).join(' · ') })),
    beat('ship', 'YOUR BOAT', () => ({ v: `${Math.round(P.boatDepth(ocSC('ship', 1, 0.3)))} <small>m DOWN</small>`, v2: 'A SHIP AT SEA JUST FLOATS UP' }), 0, 1),
    beat('ship', 'THE CONTAINER SHIP', () => ({ v: `${P.shipKm} <small>km</small>`, v2: `${P.shipKn} KNOTS · ${Math.round(P.shipMin)} MINUTES TO YOU` }), 2, 2),
    beat('ice', 'ALL THE ICE ON EARTH, MELTED', () => ({ v: `+${P.iceM} <small>m</small>`, v2: 'ANTARCTICA 58 m · GREENLAND 7.4 m · GLACIERS 0.3 m' })),
    beat('hill', 'HER HILL', (t, s) => { const c = ocClockParts(P.sAt(OC_F.hill.h)); return { v: `${OC_F.hill.h - P.h(s) | 0} <small>m OVER THE SEA</small>`, v2: `THE SEA REACHES ITS TOP AT ${c.h}:${String(c.m).padStart(2, '0')} PM` }; }),
    beat('watch', 'THE LAMP', (t, s) => ({ v: `${(T.lamp - P.h(s)).toFixed(1)} <small>m</small>`, v2: 'OVER THE SEA' })),
    beat('gallery', 'THE LAMP', (t, s) => ({ v: `${(T.lamp - P.h(s)).toFixed(1)} <small>m</small>`, v2: 'OVER THE SEA' })),
    beat('roof', 'YOUR PHONE', (t, s) => ({ v: `${OC_BAT(s)} <small>%</small>`, v2: `THE SHIP: ${Math.round((ocSC('ship', 2) + P.shipMin * 60 - s) / 60)} MINUTES AWAY` }), 1, 1),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const OC_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [ocC(id, k0) - 0.1, (k1 != null ? ocCap(id, k1).hide : ocE(id)) + 0.2, text]; return [
  b('start', 'HARROW ROCK, ITS KEEPER AND PORT ELLERY ARE FICTIONAL · THE SKY AND THE TIDE ARE REAL', 0, 2),
  b('rule', 'THE FILM’S ONE CHEAT: THE WATER COMES FROM NOWHERE', 0, 2),
  b('rule', 'ALL THE WORLD’S RIVERS: ABOUT 37,000 km³ A YEAR', 1, 1),
  b('world', 'LOW ELEVATION COASTAL ZONE: UNDER 10 m · ABOUT 1 PERSON IN 10', 0, 1),
  b('door', 'THE PUSH: THE WATER’S PRESSURE AT THE DOOR’S MIDDLE × ITS 2 m²', 1, 1),
  b('ice', 'IPCC AR6: ANTARCTICA 57.9 m + GREENLAND 7.4 m + GLACIERS 0.32 m = ABOUT 66 m', 0, 0),
  b('hill', 'HOW FAR A LIGHT IS SEEN: 3.85 km × (√ ITS HEIGHT + √ YOUR EYES’ HEIGHT)', 1, 1),
  b('lamp', 'A SEALED LAMP, MOTOR AND BATTERY COULD RUN UNDER WATER · ITS BEAM SPREADS TO A GLOW', 1, 1),
]; })();
// the insets: [from, to, which, class]
const OC_INSETS = (() => { const b = (id, k0, id1, k1, w, where = '') => [ocC(id, k0) - 0.25, ocCap(id1, k1).hide + 0.3, w, where]; return [
  b('rule', 0, 'rule', 1, 'rivers'), b('height', 0, 'height', 1, 'tower', 'tall'), b('ship', 1, 'ship', 1, 'section', 'tall'), b('ice', 0, 'ice', 0, 'ice', 'tall'),
]; })();

// a caption's text with its numbers in amber
function ocCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}%?(?:\s(?:cubic kilometres|metres|metre|seconds|minutes|minute|tonnes|years|steps|km)\b)?(?:\s(?:km|AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class OcHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.bino = mk('oc-bino');
    this.ro = mk('oc-ro', '<div class="l">THE SEA</div><div class="v"></div><div class="s"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.ctx = mk('oc-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('oc-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('oc-band'); this.cap = mk('oc-cap'); this.tag = mk('oc-tag');
    this.caps = OCT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: ocCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('oc-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : ocStoryAt(t), P = OCP, T = OC_F.tower, h = P.h(s);
    void app;
    // ---- the binoculars' mask
    this._set('bino', this.bino, 'opacity', shot.mode === 'binocs' ? '1' : '0');
    // ---- the sea, and the countdown to the lamp
    const ra = W(t, OC.title[1] - 0.5, OC.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._html('rov', this.roV, s <= 0 ? 'HIGH WATER' : `+${h.toFixed(h < 10 ? 2 : 1)} <small>m</small>`);
      const left = (T.lamp - h) / P.rate;
      this._html('ros', this.roS, s <= 0 ? '' : left > 0 ? `THE LAMP GOES UNDER IN <b>${ocMS(left)}</b>` : `THE LAMP: <b>${(h - T.lamp).toFixed(1)} m</b> UNDER`);
      this._cls('roc', this.ro, 'oc-ro' + (s > 0 ? ' on' : '') + (left < 300 ? ' warn' : ''));
    }
    // ---- the context box
    const inA = (() => { const w = OC_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    const cx = OC_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = OC_TAGS.filter((x) => t >= x[0] && t < x[1]).pop();
    if (tg) this._txt('tgt', this.tag, tg[2]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the day and the time; a jump
    const ca = W(t, OC.title[1] - 0.5, OC.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = ocClockParts(s);
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = OC_JUMPS.filter((x) => t >= x.t && t < x.t + 3.5).pop();
      this._cls('ckj', this.clockF, j ? 'f jump' : 'f');
      this._txt('ckf', this.clockF, j ? (j.ds >= 90 ? `+${Math.round(j.ds / 60)} MIN LATER` : `+${Math.round(j.ds)} s LATER`) : 'REAL SPEED');
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat)
    const gb = OCT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'oc-cap q' : 'oc-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, s, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene (measure first, then place)
    const L = set && set.labels ? (typeof set.labels === 'function' ? set.labels(t) : set.labels) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'oc-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = OcHud._p || (OcHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam || !(l.a > 0.01)) { d.style.opacity = '0'; return; }
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (l.p.isVector3) _p.copy(l.p); else _p.set(l.p[0], l.p[1], l.p[2]);
      _p.project(cam);
      const vis = _p.z < 1 && _p.z > -1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      const lx = MathX.clamp((_p.x * 0.5 + 0.5) * 100, 3, 97), ly = (-_p.y * 0.5 + 0.5) * 100;
      if (d._tx !== tx) { d._tx = tx; d.className = 'oc-lab'; d.innerHTML = '<span class="d"></span>' + tx; d._w = d.offsetWidth; }
      let right = l.side ? l.side === 'r' : lx > 62;
      const wPct = this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      const ty = Math.min(70, Math.max(ly, 26));
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      let op = vis ? (l.a ?? 1) : 0;
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) op = 0; }
      d.style.opacity = String(op);
      const hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx, cl = right ? 'oc-lab r' : 'oc-lab';
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
      if (d.className !== cl) d.className = cl;
    });
  }

  _insets(t, s, set) {
    const W = StoryHUD.win, which = OC_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'oc-inset' : ('oc-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(s * 4);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = OcHud[which[2]](u, t, s, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.84, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69], big: [44, 0.62] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  // a minute of new water (361,000 km³) against a year of every river on Earth (37,300 km³): ten years' worth
  static rivers(u) {
    const T = OcHud.tx, P = OCP, d1 = ocC('rule', 1) - ocC('rule', 0), a = MathX.smooth(u, 0.2, 1.4), b = MathX.smooth(u, d1 - 0.2, d1 + 1.2);
    const W0 = 640, x0 = 50, y0 = 150, unit = W0 / 10;
    const boxes = [...Array(10)].map((_, i) => `<rect x="${x0 + i * unit + 3}" y="${y0 + 120}" width="${unit - 6}" height="62" rx="6" fill="#3a7ac8" opacity="${MathX.clamp(b * 10 - i, 0, 1).toFixed(2)}"/>`).join('');
    return OcHud.svg(`${OcHud.plate()}${T(30, 56, 't', 'ONE MINUTE OF NEW WATER')}
      <rect x="${x0}" y="${y0 - 40}" width="${(W0 * a).toFixed(1)}" height="80" rx="8" fill="#7ac8ff"/>
      ${T(x0, y0 + 92, 'sm', `${ocN(P.perMinKm3)} km³ · EVERY MINUTE`, 640)}
      <g opacity="${b.toFixed(2)}">${boxes}${T(x0, y0 + 230, 's', 'ALL THE WORLD’S RIVERS, ONE YEAR EACH', 660)}${T(x0, y0 + 272, 'sm', `${ocN(P.riversKm3)} km³ A YEAR · ×${P.riverYears.toFixed(1)}`, 660)}</g>`);
  }
  // the tower's side view: the sea's line, the lamp at 47 m, the minutes left
  static tower(u, t, s) {
    const T = OcHud.tx, F = OC_F.tower, P = OCP, H0 = 562, W0 = 330, yb = 520, k = 8.6, y = (m) => yb - m * k, h = P.h(s);
    const tw = (m) => 46 + (F.rB - (F.rB - F.rT) * MathX.clamp((m - F.base) / (F.top - F.base), 0, 1)) * 10;
    const body = `<path d="M${120 - tw(F.base)} ${y(F.base)} L${120 - tw(F.top)} ${y(F.top)} L${120 + tw(F.top)} ${y(F.top)} L${120 + tw(F.base)} ${y(F.base)} Z" fill="#e8e6de"/>
      <rect x="${120 - 18}" y="${y(F.eave)}" width="36" height="${(F.eave - F.top) * k}" fill="#30343a"/><path d="M${120 - 22} ${y(F.eave)} L120 ${y(F.dome)} L${120 + 22} ${y(F.eave)} Z" fill="#1a1c1e"/>
      <path d="M20 ${y(F.base)} Q 60 ${y(F.base - 4)} 70 ${y(0)} L 170 ${y(0)} Q 190 ${y(F.base - 6)} 230 ${y(F.base)}" fill="none"/>
      <rect x="20" y="${y(F.base)}" width="200" height="${F.base * k}" fill="#6a6258"/>`;
    return OcHud.svg(`${OcHud.plate(0.84, W0, H0)}${T(20, 46, 't', 'YOUR TOWER', 290)}${body}
      <circle cx="120" cy="${y(F.lamp)}" r="7" fill="#ffd27a"/><line x1="132" y1="${y(F.lamp)}" x2="200" y2="${y(F.lamp)}" stroke="#ffd27a" stroke-width="2"/>${T(206, y(F.lamp) + 8, 'sm', 'LAMP 47 m', 120)}
      <rect x="10" y="${y(h)}" width="${W0 - 20}" height="${Math.max(0, h * k + 6)}" fill="rgba(40,120,170,0.55)"/><line x1="10" y1="${y(h)}" x2="${W0 - 10}" y2="${y(h)}" stroke="#7ac8ff" stroke-width="3"/>
      ${T(18, y(h) - 10, 'sm', `THE SEA +${h.toFixed(1)} m`, 200)}`, W0, H0);
  }
  // your boat: still tied to the rock, on the bottom; the sea over it
  static section(u, t, s) {
    const T = OcHud.tx, F = OC_F.tower, P = OCP, H0 = 562, W0 = 330, yb = 500, k = 7.4, y = (m) => yb - (m + 3) * k, h = P.h(s);
    return OcHud.svg(`${OcHud.plate(0.84, W0, H0)}${T(20, 46, 't', 'UNDER YOU', 290)}
      <path d="M10 ${y(-3)} L 60 ${y(-1.9)} L 90 ${y(1.2)} L 200 ${y(F.base)} L ${W0 - 10} ${y(F.base)} L ${W0 - 10} ${yb + 30} L 10 ${yb + 30} Z" fill="#6a6258"/>
      <rect x="${W0 - 70}" y="${y(F.top)}" width="36" height="${(F.top - F.base) * k}" fill="#e8e6de"/>
      <rect x="10" y="${y(h)}" width="${W0 - 20}" height="${(h + 3) * k}" fill="rgba(40,120,170,0.5)"/><line x1="10" y1="${y(h)}" x2="${W0 - 10}" y2="${y(h)}" stroke="#7ac8ff" stroke-width="3"/>
      <path d="M38 ${y(-1.6)} l 34 -4 l 4 6 l -38 4 z" fill="#d9dcdf"/><line x1="72" y1="${y(-1.4)}" x2="88" y2="${y(0.85)}" stroke="#c9b27a" stroke-width="2"/>
      <line x1="56" y1="${y(h)}" x2="56" y2="${y(-1.2)}" stroke="#ffcf8a" stroke-width="2" stroke-dasharray="6 5"/>${T(66, (y(h) + y(-1.2)) / 2, 's', `${Math.round(P.boatDepth(ocSC('ship', 1, 0.3)))} m`, 120)}
      ${T(20, y(h) - 10, 'sm', 'THE SEA', 200)}${T(20, yb + 22, 'sm', 'YOUR BOAT', 200)}`, W0, H0);
  }
  // all the ice on Earth, melted: about 66 m; the sea tonight
  static ice(u, t, s) {
    const T = OcHud.tx, P = OCP, H0 = 562, W0 = 330, yb = 500, k = 5.2, y = (m) => yb - m * k, h = P.h(s);
    return OcHud.svg(`${OcHud.plate(0.84, W0, H0)}${T(20, 46, 't', 'THE SEA', 290)}
      <rect x="60" y="${y(P.iceM)}" width="80" height="${P.iceM * k}" fill="rgba(200,230,255,0.25)" stroke="#cfe6ff" stroke-width="2"/>${T(150, y(P.iceM) + 8, 'sm', `ALL THE ICE: +${P.iceM} m`, 170)}
      <rect x="160" y="${y(Math.min(h, 80))}" width="80" height="${Math.min(h, 80) * k}" fill="rgba(40,120,170,0.75)"/>${T(150, y(h) - 12, 'sm', `TONIGHT: +${h.toFixed(0)} m`, 170)}
      <line x1="40" y1="${yb}" x2="${W0 - 30}" y2="${yb}" stroke="#7a8492" stroke-width="2"/>`, W0, H0);
  }
}
