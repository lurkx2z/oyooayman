/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     THE TEMPERATURE OF SPACE · its value · how small the universe is · NEXT: the next thing it will do
                  and when (so there is always something coming); under it one context line for the scene
     bottom left  the honest label (thought experiment / illustration / sped up / slowed down / real)
     top right    the time tonight (in the last second, the time left too)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams: starlight squeezed, the light of every galaxy sliding into view, the last second's
                  ladder of temperatures, the size of the universe past and future
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

function ucThousands(n) { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function ucSig(x, d = 2) { if (x >= 100) return ucThousands(x); if (x >= 10) return x.toFixed(d > 2 ? 1 : 0); return x.toFixed(d > 2 ? 2 : 1).replace(/\.0$/, ''); }
// a big number in words ("15 MILLION", "1.4 × 10<sup>32</sup>")
function ucBig(x) {
  if (x < 1e6) return ucThousands(x);
  for (const [v, w] of [[1e12, 'TRILLION'], [1e9, 'BILLION'], [1e6, 'MILLION']]) if (x >= v && x < v * 1000) return ucSig(x / v) + ' ' + w;
  const e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
  return `${m.toFixed(1).replace(/\.0$/, '')} × 10<sup>${e}</sup>`;
}
// a temperature (K) in °C, rounded the way a person would say it
function ucFmtC(K) {
  const C = K - 273.15;
  if (!isFinite(K)) return 'NO LONGER MEANINGFUL';
  if (C < -100) return '−' + (-C).toFixed(1) + ' °C';
  if (C < 0) return '−' + Math.round(-C) + ' °C';
  if (C < 1000) return Math.round(C) + ' °C';
  if (C < 1e6) return ucThousands(Math.round(C / 10) * 10) + ' °C';
  return ucBig(C) + ' °C';
}
// the time tonight: 12-hour clock "7:29:52"; fine = with milliseconds (debug)
function ucClockParts(n) {
  const s = UCP.onset + n, H = Math.floor(s / 3600) % 24, M = Math.floor(s / 60) % 60, S = Math.floor(s % 60);
  return { h: ((H + 11) % 12) + 1, m: M, s: S, frac: s - Math.floor(s) };
}
function ucClockText(n, fine) {
  const c = ucClockParts(n), base = `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.s).padStart(2, '0')}`;
  return fine ? base + (Math.floor(c.frac * 1000) / 1000).toFixed(3).slice(1) : base;
}
const ucHM = (n) => { const c = ucClockParts(n); return `${c.h}:${String(c.m).padStart(2, '0')}`; };
// a fraction of a second, spelled in groups of three ("0.000 000 845")
function ucFrac(x) {
  if (x <= 0) return '0';
  if (x >= 1) return x.toFixed(3);
  if (x < 1e-15) { const e = Math.floor(Math.log10(x)); return `${(x / Math.pow(10, e)).toFixed(1)} × 10<sup>${e}</sup>`; }
  const e = Math.floor(Math.log10(x)), dig = Math.max(3, -e + 2), s = x.toFixed(Math.min(dig, 30)).replace(/^0\./, '');
  const g = s.match(/.{1,3}/g).join(' ');
  return '0.' + g.replace(/(\s0+|0+)$/, '').trim();
}
// the size of the universe, said simply
function ucFmtSize(s) {
  if (s < 1.0005) return 'THE UNIVERSE · TODAY\'S SIZE';
  if (s < 10) return 'THE UNIVERSE · ' + Math.round(100 / s) + '% OF ITS SIZE';
  return 'THE UNIVERSE · 1/' + (s < 1e6 ? ucThousands(s) : ucBig(s)) + ' OF ITS SIZE';
}
// the age of the universe when space was this hot (years, in words)
const UC_AGE = new Map();
function ucFmtAge(s) {
  const key = Math.round(Math.log(s) * 200); let y = UC_AGE.get(key); if (y === undefined) { y = ucAgeAtS(Math.exp(key / 200)); UC_AGE.set(key, y); }
  if (y >= 1e9) return ucSig(y / 1e9) + ' BILLION YEARS';
  if (y >= 1e6) return ucSig(y / 1e6) + ' MILLION YEARS';
  if (y >= 1e3) return ucThousands(Math.round(y / 1000) * 1000) + ' YEARS';
  return ucSig(y) + ' YEARS';
}

// the milestones the readout looks ahead to: [K, what], each with its night time (or, past the Sun's core, its time left)
const UC_NEXT = [...UC_MILESTONES, [1e9, 'ATOMIC NUCLEI BURST'], [2e12, 'PROTONS MELT'], [1.42e32, 'PHYSICS RUNS OUT']]
  .map(([K, what]) => ({ K, what, n: K / UCP.T0 < 1e5 ? ucNightForS(K / UCP.T0) : null, left: ucLeftForS(K / UCP.T0) }));
// the brightness of the sky, in words (cd/m²)
function ucSkyWords(L) {
  return L < 1.2e-3 ? 'AS DARK AS THE COUNTRYSIDE' : L < 0.04 ? 'AS BRIGHT AS A CITY\'S' : L < 0.6 ? 'TWILIGHT' : L < 300 ? 'DAWN' : L < 3000 ? 'AN OVERCAST DAY' : L < 1.2e4 ? 'A SUNNY DAY' : 'BRIGHTER THAN NOON';
}

// the scene's context line: [from, to, label, value(t, n)] (value: text, or { l, v, v2 } with HTML)
const UC_CTX = [
  [UC.titleShot + 0.8, UC.rule - 0.3, 'THE GARDEN, 7:29 PM', (t, n) => ({ v: ucFmtC(ucTempAt('frost', n)) + ' · FROST', v2: 'STARS YOU CAN SEE: ' + ucThousands(Math.round(ucSkyNow(0).stars / 10) * 10) })],
  [UC.rule + 0.6, UC.held - 0.2, 'THE SPACE BETWEEN THE GALAXIES', (t) => ({ v: t < UC.shrinkAt ? 'GROWING' : 'SHRINKING', v2: t < UC.shrinkAt ? 'AS IT HAS FOR 13.8 BILLION YEARS' : 'FROM 7:30 · FASTER AND FASTER' })],
  [UC.held + 0.6, UC.promise - 0.25, 'HELD TOGETHER · THEY KEEP THEIR SIZE', (t) => ({ v: 'ATOMS · YOU · STARS · GALAXIES', v2: t > UC.runout - 0.3 ? 'THE SPACE LEFT BETWEEN THEM: ' + Math.max(0, Math.round(100 * UC_COS.held(t) / UC_COS.held(UC.held))) + '%' : '' })],
  [UC.promise + 0.5, UC.begin - 0.25, 'THE UNIVERSE, REWOUND', (t) => { const u = MathX.clamp((t - UC.promise) / (UC.begin - 0.6 - UC.promise), 0, 1), s = Math.exp(Math.log(1100) * Math.pow(u, 1.6)); return { l: 'THE UNIVERSE, REWOUND · AGE', v: ucFmtAge(s), v2: 'THE SMALLER IT WAS, THE HOTTER' }; }],
  [UC.mirach + 0.6, UC.squeeze - 0.3, 'MIRACH LOOKS', (t, n) => { const s = ucShrink(n); return { v: ucFmtC(3840 * s), v2: 'ITS LIGHT, SQUEEZED × ' + s.toFixed(2) }; }],
  [UC.squeeze + 0.4, UC.more - 0.3, 'STARLIGHT, SQUEEZED BY', (t, n) => ({ v: '× ' + ucShrink(n).toFixed(2), v2: 'STARS YOU CAN SEE: ' + ucThousands(Math.round(ucSkyNow(n).stars / 100) * 100) })],
  [UC.more + 0.4, UC.glow - 0.3, 'STARS YOU CAN SEE', (t, n) => ({ v: ucThousands(Math.round(ucSkyNow(n).stars / 100) * 100), v2: 'ON A CLEAR NIGHT HERE: 1,900' })],
  [UC.glow + 0.4, UC.city - 0.3, 'THE DARK BETWEEN THE STARS', (t, n) => { const S = ucSkyNow(n), k = S.L / UC_NIGHT_L; return { v: k < 1.05 ? 'AS DARK AS EVER' : '× ' + ucSig(k) + ' BRIGHTER', v2: 'STARS YOU CAN SEE: ' + ucThousands(Math.round(S.stars / 100) * 100) }; }],
  [UC.city + 0.4, UC.close - 0.3, 'THE SKY', (t, n) => { const S = ucSkyNow(n); return { v: ucSkyWords(S.L), v2: 'STARS YOU CAN SEE: ' + ucThousands(Math.round(S.stars / 10) * 10) }; }],
  [UC.close + 0.5, UC.frost - 0.3, 'OUT THERE, TONIGHT', (t, n) => ({ v: t < UC.crashAt ? 'GALAXIES CLOSING IN' : 'GALAXIES CRASHING', v2: ucFmtSize(ucShrink(n)) })],
  [UC.frost + 0.4, UC.zero - 0.3, 'YOUR LAWN', (t, n) => ({ v: ucFmtC(ucTempAt('frost', n)), v2: 'SPACE: ' + ucFmtC(ucSpaceK(ucShrink(n))) })],
  [UC.zero + 0.4, UC.warm - 0.3, 'THE MILKY WAY\'S DARK DUST', (t, n) => { const S = ucSkyNow(n), r = S.dust / Math.max(1e-30, S.mw); return { v: r < 1 ? 'DARK' : 'OUTSHINES ITS STARS × ' + ucSig(r), v2: 'ITS LIGHT WAS FAR INFRARED · SQUEEZED × ' + Math.round(S.s) }; }],
  [UC.warm + 0.4, UC.boil - 0.3, 'YOU', (t, n) => ({ v: '37 °C', v2: 'SPACE: ' + ucFmtC(ucSpaceK(ucShrink(n))) })],
  [UC.boil + 0.4, UC.steam - 0.3, 'THE SKY\'S HEAT ON YOUR SKIN', (t, n) => ({ v: ucThousands(Math.round(ucSkyNow(n).flux / 10) * 10) + ' W PER m²', v2: 'THE MIDDAY SUN: ABOUT 1,000' })],
  [UC.steam + 0.3, UC.leaves - 0.2, 'YOUR LAWN', (t, n) => ({ v: ucFmtC(ucTempAt('grass', n)), v2: 'ITS WATER BOILS OFF' })],
  [UC.leaves + 0.4, UC.lawn - 0.2, 'DEAD LEAVES CATCH FIRE AT', (t, n) => ({ v: 'ABOUT 260 °C', v2: 'YOURS: ' + ucFmtC(ucTempAt('leaves', n)) })],
  [UC.lawn + 0.3, UC.noon - 0.2, 'THE SKY\'S HEAT', (t, n) => ({ v: ucSig(ucSkyNow(n).flux / 1000) + ' kW PER m²', v2: 'A BONFIRE, CLOSE UP: ABOUT 10' })],
  [UC.noon + 0.3, UC.shed - 0.2, 'DAYLIGHT', (t, n) => { const S = ucSkyNow(n), lux = Math.PI * S.Lavg; return { v: ucSig(lux / 1e5, 3) + ' × NOON', v2: t > UC.shedAt - 0.2 ? 'THE SHED: ' + ucFmtC(ucTempAt('shed', n)) + ' · THE FENCE: ' + ucFmtC(ucTempAt('fence', n)) : 'FROM THE LIGHT OF EVERY GALAXY' }; }],
  [UC.moonGo - 0.2, UC.glass - 0.2, 'THE MOON', (t, n) => ({ v: 'NO BRIGHTER THAN THE SKY', v2: 'ITS SUNLIGHT IS ONLY 8 MINUTES OLD' })],
  [UC.glass + 0.4, UC.bath - 0.2, 'WINDOW GLASS SOFTENS AT', (t, n) => ({ v: 'ABOUT 700 °C', v2: 'YOURS: ' + ucFmtC(ucTempAt('glass', n)) })],
  [UC.bath + 0.4, UC.red - 0.2, 'THE BIRD BATH', (t, n) => ({ v: ucFmtC(ucTempAt('water', n)) + (n > ucNightForTemp('water', 373.1) ? ' · BOILING' : ''), v2: 'AT 7:29: −2 °C · ICE' })],
  [UC.red + 0.4, UC.melt - 0.2, 'THE BIG BANG\'S AFTERGLOW', (t, n) => ({ v: 'TONIGHT: ' + ucFmtC(ucSpaceK(ucShrink(n))), v2: 'TODAY: −270 °C · INVISIBLE' })],
  [UC.melt + 0.3, UC.bigbang - 0.2, 'BRICK MELTS AT', (t, n) => ({ v: 'ABOUT 1,600 °C', v2: 'YOUR WALLS: ' + ucFmtC(ucTempAt('brick', n)) })],
  [UC.bigbang + 0.4, UC.vanish - 0.2, 'AS HOT AS THE UNIVERSE WAS', (t, n) => ({ v: ucFmtAge(ucShrink(n)), v2: 'AFTER THE BIG BANG' })],
  [UC.vanish + 0.4, UC.sun - 0.2, 'EVERYTHING IN THE GARDEN', (t, n) => ({ v: 'AS HOT AS THE SKY', v2: 'LIGHT FROM EVERY DIRECTION · NO SHADOWS' })],
  [UC.sun + 0.3, UC.last - 0.2, 'THE SURFACE OF THE SUN', (t, n) => ({ v: 'ABOUT 5,500 °C', v2: 'SPACE: ' + ucFmtC(ucSpaceK(ucShrink(n))) })],
  [UC.real + 1.0, UC.clue - 0.2, 'THE REAL UNIVERSE', () => ({ v: 'GROWING · FASTER EVERY YEAR', v2: 'FOUND IN 1998 · NOBEL PRIZE 2011' })],
  [UC.clue + 0.5, UC.turn - 0.2, 'DESI · THE BIGGEST 3D MAP', () => ({ v: '14 MILLION GALAXIES', v2: 'THE PUSH (DARK ENERGY) MAY BE WEAKENING' })],
  [UC.same + 0.4, UC.question - 0.3, 'THE SAME END', () => ({ v: 'EVERY GALAXY\'S LIGHT, SQUEEZED', v2: 'THEN THE BIG BANG\'S GLOW, HEATING EVERYTHING' })],
];
// the honest labels: [from, to, text] (the first match wins)
const UC_TAGS = [
  [0.3, UC.titleShot, 'LATER TONIGHT · 11:44 PM'],
  [UC.rule + 0.3, UC.held, 'THOUGHT EXPERIMENT · ILLUSTRATION'],
  [UC.held + 0.2, UC.begin - 0.1, 'ILLUSTRATION'],
  [UC.close + 0.3, UC.frost - 0.1, 'ILLUSTRATION · OUT THERE, TONIGHT'],
  [UC.mirach + 0.3, UC.pretend, 'THE NIGHT, SPED UP'],
  [UC.pretend, UC.last - 0.1, 'FROM HERE, PRETEND NOTHING CAN HURT YOU'],
  [UC.last + 0.3, UC.midnight - 0.05, 'THE LAST SECOND · SLOWED DOWN'],
  [UC.real + 0.8, UC.turn - 0.1, 'REAL · ILLUSTRATED'],
  [UC.turn + 0.3, UC.same - 0.1, 'A REAL PREDICTION · ONE OF SEVERAL · ILLUSTRATED'],
  [UC.same + 0.3, UC.question - 0.1, 'TONIGHT · 11:49 PM'],
];
// a caption's text with its numbers in amber
function ucCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\b(\d[\d,.:%]*(?:\s?(?:°C|billion years|billion|years|PM))?|the last second|half its size|twice as hot)/gi, '<span class="n">$1</span>');
}

class UcHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('uc-ro', '<div class="l">THE TEMPERATURE OF SPACE</div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('uc-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('uc-tag');
    this.clock = mk('uc-clock', '<div class="l">TONIGHT</div><div class="v"></div><div class="f"></div>'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.cap = mk('uc-cap');
    this.caps = UCT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: ucCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('uc-inset');
    this.labels = [];
    this.root = root;
    this._last = {};
    this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, n = ucNight(t);
    // ---- the readout: the cold open; 7:29 on, except over the illustrations; to midnight
    const ra = Math.max(W(t, 0.4, UC.titleShot - 0.1, 0.5, 0.3), W(t, ucS('frozen') - 0.2, UC.rule - 0.1, 0.5, 0.3), W(t, UC.begin + 0.2, UC.close - 0.1, 0.5, 0.3), W(t, UC.frost + 0.2, UC.midnight - 0.05, 0.5, 0.05));
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const last = t >= UC.last, left = last ? ucLeft(t) : UCP.R - n, s = last ? (left > 0 ? Math.exp(ucLnSLeft(left)) : Infinity) : ucShrink(Math.max(0, n)), K = UCP.T0 * s;
      this._html('rov', this.roV, ucFmtC(K)); this._html('ros', this.roS, ucFmtSize(s));
      const nx = UC_NEXT.find((m) => m.K > K * 1.0001);
      let nt = '';
      if (nx) nt = 'NEXT · ' + nx.what + ' · ' + (nx.n !== null && nx.left > 60 ? 'AT ' + ucHM(nx.n) : 'IN ' + ucFrac(Math.max(0, left - nx.left)) + ' s');
      if (t < UC.titleShot) nt = 'NEXT · ' + UC_NEXT.find((m) => m.K > K * 1.0001).what + ' · AT ' + ucHM(UC_NEXT.find((m) => m.K > K * 1.0001).n);
      this._html('ron', this.roN, nt);
    }
    // ---- the context line
    const cx = UC_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t, Math.max(0, n)), o = typeof r === 'string' ? { v: r } : r;
      this._txt('cxl', this.ctxL, o.l || cx[2]); this._html('cxv', this.ctxV, o.v); this._html('cxv2', this.ctxV2, o.v2 || '');
      // (it sits under the readout when that is up, else in its place)
      this._set('cxt', this.ctx, 'top', ra > 0.05 ? '' : 'calc(var(--u) * 44)');
    }
    // ---- the honest label
    const tg = UC_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.5, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the time tonight (and in the last second, how long is left)
    const ca = Math.max(W(t, 0.4, UC.titleShot - 0.1, 0.5, 0.3), W(t, ucS('frozen') - 0.2, UC.rule - 0.1, 0.5, 0.3), W(t, UC.begin + 0.2, UC.close - 0.1, 0.5, 0.3), W(t, UC.frost + 0.2, UC.midnight - 0.05, 0.5, 0.05));
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = ucClockParts(t < UC.midnight ? Math.min(n, UCP.R - 1e-3) : n);   // (until midnight it is still 11:59:59)
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.s).padStart(2, '0')}</small> <i>PM</i>`);
      this._html('ckf', this.clockF, t >= UC.last ? ucFrac(ucLeft(t)) + ' s TO MIDNIGHT' : '');
    }
    // ---- the caption
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._set('capq', this.cap, 'className', cp.q ? 'uc-cap q' : 'uc-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, n);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'uc-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = UcHud._p || (UcHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      // (kept clear of the readout and the context box in the top left)
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ((ra > 0.05 || cx) && lx < 40 ? Math.max(ly, 46) : ly).toFixed(2) + '%';
      const h = `<span class="d"></span><span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (d._h !== h) { d._h = h; d.innerHTML = h; }
    });
  }

  // the diagrams (SVG, 760×470 design px, right of centre; 'crunch' large)
  _insets(t, n) {
    const W = StoryHUD.win;
    const which = [
      ['squeeze', ucCap('squeeze', 0).show + 0.3, UC.half - 0.2], ['spectrum', ucS('ebl') - 0.1, UC.city - 0.2],
      ['ladder', UC.last + 0.4, UC.midnight - 0.05], ['crunch', UC.turn + 0.2, UC.same - 0.2],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.5, which[0] === 'ladder' ? 0.05 : 0.5) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._set('inb', this.inset, 'className', which && which[0] === 'crunch' ? 'uc-inset big' : 'uc-inset');
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = UcHud[k](u, t, n);
  }
  static svg(body) { return `<svg viewBox="0 0 760 470" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.68) { return `<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // starlight on its way: it leaves the star long and red, crosses space that shrinks, arrives short and blue
  static squeeze(u, t, n) {
    const x0 = 80, x1 = 680, y = 222;
    let d = '';
    for (let i = 0; i <= 320; i++) { const s = i / 320, x = x0 + (x1 - x0) * s; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y - 44 * Math.sin(2 * Math.PI * UcHud._ph(s) - u * 5)).toFixed(1); }
    const flow = (u * 0.45) % 1;
    return UcHud.svg(`${UcHud.plate()}
      <defs><linearGradient id="ucw" x1="0" x2="1"><stop offset="0" stop-color="rgb(255,120,70)"/><stop offset="0.55" stop-color="rgb(255,236,210)"/><stop offset="1" stop-color="rgb(170,200,255)"/></linearGradient></defs>
      <circle cx="${x0 - 22}" cy="${y}" r="20" fill="#ff9a6a"/><text x="${x0 - 22}" y="${y + 66}" class="t" text-anchor="middle">A STAR</text>
      <path d="${d}" fill="none" stroke="url(#ucw)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="${x1 + 26}" cy="${y}" r="12" fill="none" stroke="#fff" stroke-width="3"/><circle cx="${x1 + 26}" cy="${y}" r="4" fill="#fff"/>
      <text x="${x1 + 20}" y="${y + 66}" class="t" text-anchor="end">YOU</text>
      ${[0.2, 0.5, 0.8].map((s) => { const x = x0 + (x1 - x0) * ((s + flow * 0.2) % 1); return `<path d="M ${x - 16} ${y + 96} L ${x - 4} ${y + 96} M ${x + 16} ${y + 96} L ${x + 4} ${y + 96} M ${x - 10} ${y + 89} L ${x - 3} ${y + 96} L ${x - 10} ${y + 103} M ${x + 10} ${y + 89} L ${x + 3} ${y + 96} L ${x + 10} ${y + 103}" stroke="rgba(222,214,196,0.6)" stroke-width="3" fill="none"/>`; }).join('')}
      <text x="380" y="${y + 146}" class="s" text-anchor="middle">SPACE SHRINKS WHILE THE LIGHT CROSSES IT</text>
      <text x="380" y="70" class="t" text-anchor="middle">LEAVES LONG AND RED · ARRIVES SHORT AND BLUE</text>`);
  }
  static _ph(s) { const N = 60; let a = 0; for (let i = 0; i < N; i++) { const q = (i + 0.5) / N * s; a += s / N / (34 * (1 - 0.62 * Math.pow(q, 1.2))); } return a * 600; }
  // the light of every galaxy: two humps (starlight, warm then cold dust) on a log-wavelength axis, squeezed to shorter
  // waves; the band your eyes see marked
  static spectrum(u, t, n) {
    const s = ucShrink(Math.max(0, n)), X0 = 70, X1 = 700, l0 = Math.log10(0.1), l1 = Math.log10(1000), X = (lu) => X0 + (Math.log10(lu) - l0) / (l1 - l0) * (X1 - X0);
    let d = '', mx = 0; const pts = [];
    for (let i = 0; i <= 200; i++) { const lu = Math.pow(10, l0 + (l1 - l0) * i / 200), v = ucEBL0(lu * s) * Math.pow(s, 4); pts.push([lu, v]); mx = Math.max(mx, v); }
    const Y = (v) => 390 - 260 * Math.pow(v / mx, 0.6);
    pts.forEach(([lu, v], i) => { d += (i ? 'L' : 'M') + X(lu).toFixed(1) + ' ' + Y(v).toFixed(1); });
    const v0 = X(0.38), v1 = X(0.75), lab = (lu, txt) => { const x = X(lu / s); return x > X0 + 30 && x < X1 - 30 ? `<text x="${x.toFixed(1)}" y="${(Y(ucEBL0(lu) * Math.pow(s, 4)) - 16).toFixed(1)}" class="b" text-anchor="middle">${txt}</text>` : ''; };
    const stops = [[0, '#8a5cff'], [0.2, '#3a7bff'], [0.4, '#3fdc7a'], [0.6, '#f2e24a'], [0.8, '#ff8a2a'], [1, '#e02a2a']].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
    return UcHud.svg(`${UcHud.plate()}
      <defs><linearGradient id="ucv" x1="0" x2="1">${stops}</linearGradient></defs>
      <rect x="${v0.toFixed(1)}" y="110" width="${(v1 - v0).toFixed(1)}" height="282" fill="url(#ucv)" opacity="0.35"/>
      <text x="${((v0 + v1) / 2).toFixed(1)}" y="96" class="s" text-anchor="middle">WHAT YOUR EYES SEE</text>
      <path d="${d}" fill="none" stroke="#ffd7a8" stroke-width="4"/>
      ${lab(1.1, 'STARLIGHT')}${lab(150, 'COLD DUST')}
      <line x1="${X0}" y1="392" x2="${X1}" y2="392" stroke="rgba(222,214,196,0.5)" stroke-width="2"/>
      <text x="${X0}" y="428" class="s">SHORT WAVES</text><text x="${X1}" y="428" class="s" text-anchor="end">LONG WAVES</text>
      <text x="40" y="46" class="t">EVERY GALAXY'S LIGHT · SQUEEZED × ${s.toFixed(s < 10 ? 1 : 0)}</text>`);
  }
  // the last second, on a ladder of temperature (each step ×1,000): what each one does
  static ladder(u, t) {
    const left = ucLeft(t), K = left > 0 ? UCP.T0 * Math.exp(ucLnSLeft(left)) : 1e40, Y = (k) => 430 - (Math.log10(k) - 3.5) / (32.5 - 3.5) * 360, yNow = Math.max(62, Y(Math.min(1.5e32, K)));
    const marks = [[5772, 'THE SUN\'S SURFACE', '5,500 °C'], [1.57e7, 'THE SUN\'S CORE', '15 MILLION °C'], [1e9, 'NUCLEI BURST', '1 BILLION °C'], [2e12, 'PROTONS MELT', '2 TRILLION °C'], [1.42e32, 'PHYSICS RUNS OUT', '10<tspan dy="-10" font-size="15">32</tspan><tspan dy="10"> °C</tspan>']];
    let m = '';
    for (const [k, name, val] of marks) {
      const y = Y(k), hit = K >= k;
      m += `<line x1="250" y1="${y.toFixed(1)}" x2="290" y2="${y.toFixed(1)}" stroke="${hit ? '#ffcf8a' : 'rgba(222,214,196,0.6)'}" stroke-width="4"/>
        <text x="310" y="${(y + 8).toFixed(1)}" class="t" style="fill:${hit ? '#ffcf8a' : '#f6efe2'}">${name}</text>
        <text x="230" y="${(y + 8).toFixed(1)}" class="s" text-anchor="end">${val}</text>`;
    }
    return UcHud.svg(`${UcHud.plate()}
      <line x1="270" y1="56" x2="270" y2="440" stroke="rgba(222,214,196,0.35)" stroke-width="3"/>
      ${m}
      <circle cx="270" cy="${yNow.toFixed(1)}" r="11" fill="#fff"/><circle cx="270" cy="${yNow.toFixed(1)}" r="22" fill="rgba(255,255,255,0.22)"/>
      <text x="40" y="40" class="s">THE TEMPERATURE OF SPACE</text>`);
  }
  // the size of the universe: the Big Bang to today (real), then one 2025 prediction (it turns round and crunches, about
  // 20 billion years from now), and the old expectation (growing forever, dashed)
  static crunch(u, t) {
    const X = (g) => 70 + g / 36 * 640, Y = (a) => 410 - a / 1.5 * 320, now = 13.8, top = 24.8, end = 33.8;
    const past = (g) => Math.pow(g / now, 0.66) * (1 + 0.12 * Math.sin(Math.PI * g / now / 2)) / 1.12;
    const fut = (g) => { if (g <= top) { const q = (g - now) / (top - now); return 1 + 0.36 * Math.sin(Math.PI / 2 * q); } const q = (g - top) / (end - top); return 1.36 * Math.sqrt(Math.max(0, 1 - q * q)); };
    const ever = (g) => Math.exp((g - now) * 0.055);
    const prog = MathX.smooth(u, 0.3, 4.5), path = (f, g0, g1, N = 120) => { let d = ''; for (let i = 0; i <= N; i++) { const g = g0 + (g1 - g0) * i / N; d += (i ? 'L' : 'M') + X(g).toFixed(1) + ' ' + Y(f(g)).toFixed(1); } return d; };
    const gF = now + (end - now) * prog;
    return UcHud.svg(`${UcHud.plate(0.72)}
      <text x="40" y="44" class="t">THE SIZE OF THE UNIVERSE</text>
      <line x1="70" y1="410" x2="720" y2="410" stroke="rgba(222,214,196,0.5)" stroke-width="2"/>
      <path d="${path(ever, now, 34)}" fill="none" stroke="rgba(190,220,255,0.55)" stroke-width="3" stroke-dasharray="10 9"/>
      <text x="${X(31)}" y="${Y(ever(31)) - 12}" class="s" text-anchor="end" style="fill:#bfe0ff">OR: GROWING FOREVER</text>
      <path d="${path(past, 0.05, now)}" fill="none" stroke="#f6efe2" stroke-width="5"/>
      ${prog > 0 ? `<path d="${path(fut, now, gF)}" fill="none" stroke="#ffcf8a" stroke-width="5"/>` : ''}
      <circle cx="${X(now)}" cy="${Y(1)}" r="9" fill="#fff"/><text x="${X(now)}" y="${Y(1) + 40}" class="b" text-anchor="middle">TODAY</text>
      <text x="${X(0.3)}" y="440" class="s">THE BIG BANG</text>
      ${prog > 0.98 ? `<circle cx="${X(end)}" cy="${Y(0)}" r="9" fill="#ffcf8a"/><text x="${X(end) - 6}" y="${Y(0) - 22}" class="b" text-anchor="end" style="fill:#ffcf8a">A BIG CRUNCH · ~20 BILLION YEARS FROM NOW</text>` : ''}
      <text x="720" y="440" class="s" text-anchor="end">BILLIONS OF YEARS →</text>`);
  }
}
