/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the long-form films' (Slower light, No light, Sound faster than light):
     top left     EVERYTHING BUT YOU: its size (1 / N), and the countdown to the next halving
     top right    the day and the time; REAL SPEED, or "+25 s LATER" when the clock jumps at a cut (it only runs forward);
                  Leo's height, to you (the story never lets go of him)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       Poincaré's question (1908); the ladder of pitch (his voice climbing out of your hearing)
     bottom left  the honest labels (what is impossible, what is rough)
     in the scene labels the set pins to things (set.labels(t) → [{ p, text, sub, a, side }])
   ===================================================================== */

const ekN = (x) => Math.round(x).toLocaleString('en-US');
// a length, in the unit a person would use for it
function ekLen(m, html = true) {
  const u = (v, unit, d) => `${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}${html ? ` <small>${unit}</small>` : ' ' + unit}`;
  if (m >= 100000) return u(m / 1000, 'km', 0);
  if (m >= 1000) return u(m / 1000, 'km', 1);
  if (m >= 10) return u(m, 'm', 0);
  if (m >= 1) return u(m, 'm', 2);
  if (m >= 0.01) return u(m * 100, 'cm', m >= 0.1 ? 0 : 1);
  if (m >= 0.001) return u(m * 1000, 'mm', 1);
  if (m >= 1e-5) return u(m * 1000, 'mm', 3);
  if (m >= 1e-6) return u(m * 1e6, 'μm', 1);
  return u(m * 1e9, 'nm', 0);
}
// the world's size as "1 / N"
function ekFrac(s) {
  const n = 1 / s;
  if (n < 10) return n.toFixed(2);
  if (n < 100) return n.toFixed(1);
  if (n < 1e6) return ekN(n);
  return (n / 1e6).toFixed(n < 1e7 ? 2 : 1) + ' million';
}
const ekMassTxt = (kg) => (kg >= 1 ? `${kg.toFixed(kg < 10 ? 1 : 0)} <small>kg</small>` : `${(kg * 1000).toFixed(kg < 0.01 ? 1 : 0)} <small>g</small>`);

// the scene's context box: [from, to, label, value(t, τ) → { v, v2 }] (HTML)
const EK_CTX = (() => {
  const P = EKP, beat = (id, l, f, k0 = 0, k1) => [ekC(id, k0) - 0.2, (k1 != null ? ekCap(id, k1).hide : ekE(id)) + 0.2, l, f];
  const tent = Math.hypot(EK_F.tent.w, EK_F.tent.d);
  return [
    beat('start', 'THE TENT, TO YOU', (t, tau) => ({ v: ekLen(EK_F.tent.w * P.sAt(tau)) + ' <small>long</small>', v2: `ITS ROOF: ${ekLen(EK_F.tent.h * P.sAt(tau), false)} HIGH` }), 2, 2),
    beat('out', 'YOU, TO THEM', (t, tau) => ({ v: ekLen(P.tallToThem(tau)) + ' <small>tall</small>', v2: `YOUR CAR, TO YOU: ${ekLen(4.6 * P.sAt(tau), false)} LONG` }), 1, 1),
    beat('leo', 'LEO, TO YOU', (t, tau) => ({ v: ekLen(P.leoH(tau)) + ' <small>tall</small>', v2: `HE IS ${Math.round(P.leo.h * 100)} cm · YOU ARE ${ekLen(P.tallToThem(tau), false)}, TO HIM` })),
    beat('voice', 'LEO’S VOICE, TO YOU', (t, tau) => ({ v: `${ekN(P.leoF(tau))} <small>Hz</small>`, v2: `HIS NORMAL VOICE: ${P.leo.f0} Hz · ${P.octaves(tau).toFixed(1)} OCTAVES UP` })),
    beat('weight', 'YOUR WEIGHT', (t, tau) => ({ v: ekMassTxt(P.weight(tau)), v2: `GRAVITY: ${(P.g0 * P.sAt(tau)).toFixed(2)} m/s² · NORMALLY 9.81` })),
    beat('neighbours', 'YOU, TO THEM', (t, tau) => ({ v: ekLen(P.tallToThem(tau)) + ' <small>tall</small>', v2: `YOUR BOOT, TO THEM: ${ekLen(0.3 / P.sAt(tau), false)} LONG` })),
    beat('rumble', 'YOUR VOICE, TO THEM', (t, tau) => ({ v: `${P.youF(tau).toFixed(1)} <small>Hz</small>`, v2: `BELOW ${P.infra} Hz: FELT, NOT HEARD` })),
    beat('hush', 'LEO’S VOICE, TO YOU', (t, tau) => ({ v: `${ekN(P.leoF(tau))} <small>Hz</small>`, v2: `YOUR HEARING STOPS AT ${ekN(P.hear)} Hz` })),
    beat('quiet', 'THE VALLEY’S DEEPEST SOUND', (t, tau) => ({ v: `${ekN(P.valleyLow / P.sAt(tau))} <small>Hz</small>`, v2: `NORMALLY ${P.valleyLow} Hz: THE RIVER, THE WIND IN THE TREES` })),
    beat('sunrise', 'YOUR EYES, TO THEM', (t, tau) => ({ v: ekLen(P.toThem(P.you.eye, tau)) + ' <small>up</small>', v2: 'THE VALLEY FLOOR: STILL IN THE MOUNTAINS’ SHADOW' })),
    beat('shadow', 'YOU, TO THEM', (t, tau) => ({ v: ekLen(P.tallToThem(tau)) + ' <small>tall</small>', v2: `THE SUN, TO YOU: ${Math.max(0, P.refr(ekSunAt(tau).alt)).toFixed(1)}° UP` })),
    beat('peaks', 'YOU, TO THEM', (t, tau) => ({ v: ekLen(P.tallToThem(tau)) + ' <small>tall</small>', v2: `THE LAKE, TO YOU: ${ekLen(3000 * P.sAt(tau), false)} LONG` })),
    beat('air', 'YOUR HAND, TO LEO', (t, tau) => ({ v: ekLen(P.toThem(P.you.hand, tau)) + ' <small>up</small>', v2: `THERE: ${Math.round(P.tempAt(P.toThem(P.you.hand, tau)))} °C · ${Math.round(100 * Math.exp(-P.toThem(P.you.hand, tau) / P.H))} % OF THE AIR` }), 0, 1),
    beat('air', 'LEO, TO YOU', (t, tau) => ({ v: ekLen(P.leoH(tau)) + ' <small>tall</small>', v2: 'THE MEADOW BY THE TENT' }), 2),
    beat('escape', 'YOUR WEIGHT', (t, tau) => ({ v: ekMassTxt(P.weight(tau)), v2: `ESCAPE SPEED: ${P.vesc(tau).toFixed(2)} m/s · A JUMP: ${P.jump} m/s` })),
    beat('plane', 'YOU, TO THEM', (t, tau) => ({ v: ekLen(P.tallToThem(tau)) + ' <small>tall</small>', v2: `THE EARTH: ${ekLen(P.earthD(tau), false)} ACROSS` })),
    beat('curve', 'THE EARTH', (t, tau) => ({ v: ekLen(P.earthD(tau)) + ' <small>across</small>', v2: `ITS AIR: ${ekLen(P.H * P.sAt(tau), false)} DEEP` })),
    beat('sky', 'THE AIR ABOVE YOUR EYES', (t, tau) => ({ v: `${(100 * P.airAbove(P.you.kneelEye, tau)).toFixed(2)} <small>%</small>`, v2: `THE EARTH: ${ekLen(P.earthD(tau), false)} ACROSS` })),
    beat('lift', 'ESCAPE SPEED', (t, tau) => ({ v: `${(P.vesc(tau) * 100).toFixed(1)} <small>cm/s</small>`, v2: 'A FLICK OF YOUR TOES COULD PUSH YOU OFF IT' })),
    beat('moon', 'THE MOON', (t, tau) => ({ v: ekLen(P.moonD * P.sAt(tau)) + ' <small>away</small>', v2: `${ekLen(2 * P.moonR * P.sAt(tau), false)} ACROSS` })),
    beat('house', 'THE EARTH', (t, tau) => ({ v: ekLen(P.earthD(tau)) + ' <small>across</small>', v2: `MOUNT EVEREST ON IT: ${ekLen(8849 * P.sAt(tau), false)}` })),
    beat('ball', 'THE EARTH WEIGHS', (t, tau) => ({ v: `${P.earthMass(tau).toFixed(0)} <small>kg</small>`, v2: `IT IS ${ekLen(P.earthD(tau), false)} ACROSS · YOU: ${P.you.mass} kg` })),
    beat('end', 'THE EARTH', (t, tau) => ({ v: ekLen(P.earthD(tau)) + ' <small>across</small>', v2: `LEO ON IT: ${ekLen(P.leoH(tau), false)} TALL` })),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const EK_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [ekC(id, k0) - 0.1, (k1 != null ? ekCap(id, k1).hide : ekE(id)) + 0.2, text]; return [
  b('start', 'THE RULE HERE: EVERYTHING BUT YOU SHRINKS, ATOMS AND ALL · YOU DON’T', 1, 1),
  b('rule', 'HENRI POINCARÉ, SCIENCE AND METHOD (1908)', 0, 1),
  b('voice', 'A SIX-YEAR-OLD’S VOICE: ABOUT 275 Hz · EACH OCTAVE DOUBLES IT', 0, 1),
  b('weight', 'THE SAME ROCK IN A SMALLER BALL: ITS PULL SHRINKS WITH IT', 0, 0),
  b('rumble', 'BELOW ABOUT 20 Hz, A SOUND IS FELT, NOT HEARD', 0, 1),
  b('hush', 'AN ADULT HEARS UP TO ABOUT 17,000 Hz', 2, 2),
  b('sunrise', 'THE HIGHER YOUR EYES, THE FURTHER YOU SEE OVER THE MOUNTAINS', 0, 0),
  b('air', 'THE AIR: HALF AS THICK EVERY 5.8 km UP, 6.5 °C COLDER EVERY km', 0, 0),
  b('escape', 'ESCAPE SPEED: HOW FAST YOU’D NEED TO GO TO NEVER FALL BACK', 0, 0),
  b('sky', 'THE FILM’S ONE CHEAT: THE AIR STAYS, AND YOU CAN STILL BREATHE', 0, 1),
  b('lift', 'THE FILM’S ONE CHEAT: THE AIR STAYS, AND YOU CAN STILL BREATHE', 0, 0),
  b('end', 'A GRAIN OF SAND: 1 mm · LIGHT’S WAVE: 0.4 THOUSANDTHS OF A mm', 1, 1),
]; })();
// the insets: [from, to, which, where]
const EK_INSETS = (() => { const b = (id, k0, id1, k1, w, where = '') => [ekC(id, k0) - 0.25, ekCap(id1, k1).hide + 0.3, w, where]; return [
  b('rule', 0, 'rule', 2, 'poincare'), b('voice', 0, 'voice', 1, 'ladder', 'ladder'), b('hush', 0, 'hush', 2, 'ladder', 'ladder'),
]; })();

// a caption's text with its numbers in amber
function ekCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?°\s?C|°)?(?:\s(?:octaves|degrees|metres|metre|millimetres|seconds|second|minutes|minute|grams|kg|km|cm|m)\b)?(?:\s(?:km|AM|PM|in the morning))?/g, (m) => `<span class="n">${m}</span>`);
}

class EkHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('ek-ro', '<div class="l">EVERYTHING BUT YOU</div><div class="v"></div><div class="s"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.ctx = mk('ek-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('ek-clock', '<div class="l"></div><div class="v"></div><div class="f"></div><div class="k"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f'); this.clockK = this.clock.querySelector('.k');
    this.band = mk('ek-band'); this.cap = mk('ek-cap'); this.tag = mk('ek-tag');
    this.caps = EKT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: ekCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('ek-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, tau = set && set._tau != null ? set._tau : ekStoryAt(t), s = EKP.sAt(tau);
    void app;
    // ---- the world's size, and the next halving
    const ra = W(t, EK.title[1] - 0.5, EK.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const ph = tau > 0 ? tau % EKP.half : 0, hit = tau > 1 && ph < 0.7, left = Math.ceil(EKP.half - ph - 1e-6);
      this._html('rov', this.roV, tau <= 0 ? 'FULL SIZE' : `1 / ${ekFrac(s)} <small>SIZE</small>`);
      this._html('ros', this.roS, tau <= 0 ? '' : `HALVES AGAIN IN <b>0:${String(Math.min(left, 30)).padStart(2, '0')}</b>`);
      this._cls('roc', this.ro, 'ek-ro' + (tau > 0 ? ' on' : '') + (hit ? ' hit' : ''));
    }
    // ---- the context box
    const inA = (() => { const w = EK_INSETS.find((x) => x[3] !== 'ladder' && t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    const cx = EK_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, tau, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = EK_TAGS.find((x) => t >= x[0] && t < x[1]);
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the day and the time; a jump; Leo
    const ca = W(t, EK.title[1] - 0.5, EK.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = ekClockParts(tau);
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = EK_JUMPS.filter((x) => t >= x.t && t < x.t + 3.5).pop();
      this._cls('ckj', this.clockF, j ? 'f jump' : 'f');
      this._txt('ckf', this.clockF, j ? `+${Math.round(j.ds)} s LATER` : 'REAL SPEED');
      this._html('ckk', this.clockK, tau <= 0 ? '' : `LEO, TO YOU: <b>${ekLen(EKP.leoH(tau), false)}</b>`);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat)
    const gb = EKT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'ek-cap q' : 'ek-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagrams
    this._insets(t, tau, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene (measure first, then place)
    const L = set && set.labels ? (typeof set.labels === 'function' ? set.labels(t) : set.labels) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'ek-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = EkHud._p || (EkHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam || !(l.a > 0.01)) { d.style.opacity = '0'; return; }
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (l.p.isVector3) _p.copy(l.p); else _p.set(l.p[0], l.p[1], l.p[2]);
      _p.project(cam);
      const vis = _p.z < 1 && _p.z > -1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      const lx = MathX.clamp((_p.x * 0.5 + 0.5) * 100, 3, 97), ly = (-_p.y * 0.5 + 0.5) * 100;
      if (d._tx !== tx) { d._tx = tx; d.className = 'ek-lab'; d.innerHTML = '<span class="d"></span>' + tx; d._w = d.offsetWidth; }
      let right = l.side ? l.side === 'r' : lx > 62;
      const wPct = this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      const ty = Math.min(74, Math.max(ly, 24));
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      let op = vis ? (l.a ?? 1) : 0;
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) op = 0; }
      d.style.opacity = String(op);
      const hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx, cl = right ? 'ek-lab r' : 'ek-lab';
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
      if (d.className !== cl) d.className = cl;
    });
  }

  _insets(t, tau, set) {
    const W = StoryHUD.win, which = EK_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'ek-inset' : ('ek-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(tau * 10);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = EkHud[which[2]](u, t, tau, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="ekAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.84, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69], big: [44, 0.62] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  // a house, a ruler beside it (both the same scale k), the ruler's reading
  static _house(x, base, k, lab) {
    const T = EkHud.tx, w = 150 * k, h = 110 * k, r = 80 * k;
    return `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="#3a4658" stroke="#c8ccd2" stroke-width="${2.5 * Math.max(k, 0.5)}"/>
      <path d="M${x - 10 * k} ${base - h} L${x + w / 2} ${base - h - r} L${x + w + 10 * k} ${base - h} Z" fill="#6a4a3a" stroke="#c8ccd2" stroke-width="${2.5 * Math.max(k, 0.5)}"/>
      <rect x="${x + w * 0.4}" y="${base - 55 * k}" width="${30 * k}" height="${55 * k}" fill="#ffcf8a"/>
      <rect x="${x + w + 24 * k}" y="${base - (h + r)}" width="${16 * k}" height="${h + r}" fill="#f2c22a"/>
      ${[...Array(10)].map((_, i) => `<line x1="${x + w + 24 * k}" y1="${base - (h + r) * i / 10}" x2="${x + w + 32 * k}" y2="${base - (h + r) * i / 10}" stroke="#2a2a2a" stroke-width="1.5"/>`).join('')}
      ${T(x + w + 46 * k, base - (h + r) * 0.5 + 8, 'sm', lab, 160)}`;
  }
  static _person(x, base, h, col = '#ffcf8a') {
    const hd = h * 0.13;
    return `<circle cx="${x}" cy="${base - h + hd}" r="${hd}" fill="${col}"/><path d="M${x} ${base - h + 2 * hd} L${x} ${base - h * 0.45} M${x - h * 0.16} ${base - h * 0.7} L${x} ${base - h * 0.62} L${x + h * 0.16} ${base - h * 0.7} M${x - h * 0.12} ${base} L${x} ${base - h * 0.45} L${x + h * 0.12} ${base}" stroke="${col}" stroke-width="${Math.max(3, h * 0.05)}" fill="none" stroke-linecap="round"/>`;
  }
  // Poincaré, 1908: if everything shrank overnight, would anyone notice? Every ruler shrinks too. Unless one thing didn't.
  static poincare(u) {
    const T = EkHud.tx, d1 = ekC('rule', 1) - ekC('rule', 0), d2 = ekC('rule', 2) - ekC('rule', 0);
    const a = MathX.smooth(u, 0.2, 0.8), b = MathX.smooth(u, d1 - 0.2, d1 + 0.5), c = MathX.smooth(u, d2 - 0.1, d2 + 0.6), base = 400;
    return EkHud.svg(`${EkHud.plate()}${T(30, 56, 't', 'IF EVERYTHING SHRANK OVERNIGHT…')}
      <line x1="30" y1="${base}" x2="730" y2="${base}" stroke="#7a8492" stroke-width="2"/>
      <g opacity="${a.toFixed(2)}">${T(60, 110, 's', 'TONIGHT', 300)}${EkHud._house(70, base, 1, '10 m')}</g>
      <g opacity="${b.toFixed(2)}">${T(430, 110, 's', 'TOMORROW', 300)}${EkHud._house(440, base, 0.5, '10 m')}
        ${T(30, 450, 'sm', 'THE RULER SHRANK TOO: IT STILL SAYS 10 m', 700)}</g>
      <g opacity="${c.toFixed(2)}"><rect x="20" y="420" width="720" height="46" fill="rgba(6,9,14,0.95)"/>${EkHud._person(650, base, 190)}${T(560, 168, 'b', 'YOU', 200)}
        ${T(30, 450, 'sm', 'UNLESS ONE THING DIDN’T SHRINK', 700)}</g>`);
  }
  // the ladder of pitch: 20 Hz … 20,000 Hz (log); his voice climbing; the top of your hearing
  static ladder(u, t, tau) {
    const T = EkHud.tx, W0 = 316, H0 = 562, y0 = 500, y1 = 96, f0 = 20, f1 = 40000, P = EKP;
    const y = (f) => y0 + (y1 - y0) * Math.log(f / f0) / Math.log(f1 / f0), lf = P.leoF(tau), heard = lf < P.hear;
    const band = (a, b, col, lab) => `<rect x="70" y="${y(b).toFixed(1)}" width="40" height="${(y(a) - y(b)).toFixed(1)}" fill="${col}" opacity="0.5"/>${T(120, ((y(a) + y(b)) / 2 + 8).toFixed(1), 'sm', lab, 180)}`;
    const ly = Math.max(y1 - 8, y(Math.min(lf, f1 * 1.2)));
    return EkHud.svg(`${EkHud.plate(0.84, W0, H0)}${T(22, 50, 't', 'PITCH', 280)}
      <line x1="90" y1="${y0}" x2="90" y2="${y1}" stroke="#7a8492" stroke-width="3"/>
      ${[20, 100, 1000, 10000].map((f) => `<line x1="80" y1="${y(f).toFixed(1)}" x2="100" y2="${y(f).toFixed(1)}" stroke="#9aa" stroke-width="2"/>${T(8, (y(f) + 8).toFixed(1), 'sm', f >= 1000 ? (f / 1000) + 'k' : String(f), 70)}`).join('')}
      ${band(P.bird[0], P.bird[1], '#5aa0ff', 'BIRDSONG')}${band(P.whistle[0], P.whistle[1], '#9a7aff', 'WHISTLE')}
      <rect x="20" y="${y1 - 26}" width="276" height="${(y(P.hear) - y1 + 26).toFixed(1)}" fill="rgba(255,90,70,0.16)"/>
      <line x1="20" y1="${y(P.hear).toFixed(1)}" x2="296" y2="${y(P.hear).toFixed(1)}" stroke="#ff6a4a" stroke-width="3" stroke-dasharray="7 5"/>
      ${T(120, (y(P.hear) - 12).toFixed(1), 'sm', 'YOU CAN’T HEAR', 180)}
      <line x1="80" y1="${y(P.leo.f0).toFixed(1)}" x2="100" y2="${y(P.leo.f0).toFixed(1)}" stroke="#ffcf8a" stroke-width="3"/>${T(120, (y(P.leo.f0) + 8).toFixed(1), 'sm', 'HIS VOICE', 180)}
      <circle cx="90" cy="${ly.toFixed(1)}" r="12" fill="${heard ? '#ffcf8a' : 'none'}" stroke="#ffcf8a" stroke-width="3"/>
      ${T(120, (ly + 9).toFixed(1), 's', heard ? `LEO ${ekN(lf)} Hz` : 'LEO', 180)}`, W0, H0);
  }
}
