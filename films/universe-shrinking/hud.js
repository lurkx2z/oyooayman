/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     SPACE DOUBLES EVERY · the doubling time tonight · what it is as long as / shorter than (a soft plate)
                  under it, one context line for the scene (the edge, the stretch, the Moon's distance, your weight,
                  the air pressure, the boiling point, the pull across your house …)
     bottom left  the honest label (thought experiment / illustration / slowed down / sped up / real)
     top right    the time tonight (in the first and the last second, the fraction of a second too)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams: what holds vs the pull, a stretched wave, the Sun's last light, Earth's layers, the
                  last second
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

const UC_YR = 3.156e7;
// durations to compare the doubling time with (s)
const UC_MARKS = [
  [4.54e9 * UC_YR, 'THE AGE OF THE EARTH'], [66e6 * UC_YR, 'THE TIME SINCE THE DINOSAURS'], [3e5 * UC_YR, 'THE TIME SINCE THE FIRST HUMANS'],
  [4500 * UC_YR, 'THE TIME SINCE THE PYRAMIDS'], [80 * UC_YR, 'A LIFETIME'], [UC_YR, 'A YEAR'], [30 * 86400, 'A MONTH'], [86400, 'A DAY'],
  [3600, 'AN HOUR'], [180, 'A SONG'], [4, 'A BREATH'], [0.8, 'A HEARTBEAT'], [0.1, 'A BLINK'], [1e-3, 'A CAMERA FLASH'],
  [1.1e-10, 'ONE TICK OF AN ATOMIC CLOCK'], [1.8e-15, 'ONE WAVE OF LIGHT'],
];
function ucThousands(n) { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function ucSig(x, d = 2) { if (x >= 100) return ucThousands(x); if (x >= 10) return x.toFixed(d > 2 ? 1 : 0); return x.toFixed(d > 2 ? 2 : 1).replace(/\.0$/, ''); }
// a duration, in words ("10 billion years", "28 minutes", "22 attoseconds")
function ucFmtDur(T) {
  if (!(T > 0)) return 'no time at all';
  const Y = T / UC_YR;
  if (Y >= 1e9) return ucSig(Y / 1e9) + ' billion years';
  if (Y >= 1e6) return ucSig(Y / 1e6) + ' million years';
  if (Y >= 2) return ucSig(Y) + ' years';
  if (T >= 2 * 86400) return ucSig(T / 86400) + ' days';
  if (T >= 2 * 3600) return ucSig(T / 3600) + ' hours';
  if (T >= 100) return Math.round(T / 60) + ' minutes';
  if (T >= 2) return ucSig(T) + ' seconds';
  const U = [[1, 'seconds'], [1e-3, 'milliseconds'], [1e-6, 'microseconds'], [1e-9, 'nanoseconds'], [1e-12, 'picoseconds'], [1e-15, 'femtoseconds'], [1e-18, 'attoseconds'], [1e-21, 'zeptoseconds'], [1e-24, 'yoctoseconds']];
  for (const [u, w] of U) if (T >= u) return ucSig(T / u) + ' ' + w;
  return 'no time at all';
}
function ucDurSub(T, n) {
  if (n <= 0) return 'AS IT REALLY IS, TODAY';
  if (!(T > 0)) return 'SPACE TEARS';
  const near = UC_MARKS.find((m) => T > m[0] * 0.9 && T < m[0] * 1.1);
  if (near) return 'ABOUT ' + near[1];
  const above = UC_MARKS.filter((m) => m[0] > T).pop();
  return above ? 'LESS THAN ' + above[1] : 'LONGER THAN ' + UC_MARKS[0][1];
}
// a distance, in words
function ucFmtLy(m) {
  const L = m / UCP.ly;
  if (L >= 1e9) return ucSig(L / 1e9) + ' BILLION LIGHT YEARS';
  if (L >= 1e6) return ucSig(L / 1e6) + ' MILLION LIGHT YEARS';
  if (L >= 1.5) return ucSig(L) + ' LIGHT YEARS';
  return ucFmtKm(m);
}
function ucFmtKm(m) {
  const k = m / 1000;
  if (k >= 1e9) return ucSig(k / 1e9) + ' BILLION km';
  if (k >= 1e6) return ucSig(k / 1e6) + ' MILLION km';
  if (k >= 1) return ucThousands(k) + ' km';
  return ucSig(m) + ' m';
}
function ucFmtAge(s) { return s < 90 ? ucSig(s) + ' SECONDS' : s < 5400 ? Math.round(s / 60) + ' MINUTES' : ucSig(s / 3600) + ' HOURS'; }
// a big multiple ("5", "170", "17 MILLION MILLION MILLION MILLION")
function ucFmtTimes(x) {
  if (x < 10) return x.toFixed(1).replace(/\.0$/, '');
  if (x < 1e6) return ucThousands(x);
  const e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
  return `${m.toFixed(1).replace(/\.0$/, '')} × 10<sup>${e}</sup>`;
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
// a fraction of a second, spelled in groups of three ("0.000 000 845")
function ucFrac(x) {
  if (x <= 0) return '0';
  if (x >= 1) return x.toFixed(3);
  const e = Math.floor(Math.log10(x)), dig = Math.max(3, -e + 2), s = x.toFixed(Math.min(dig, 30)).replace(/^0\./, '');
  const g = s.match(/.{1,3}/g).join(' ');
  return '0.' + g.replace(/(\s0+|0+)$/, '').trim();
}

// Earth's layers let go when the pull beats the mean density inside them (g(r)/r = 4π/3 · G · ρ̄(r)) — PREM
const UC_LAYERS = [['THE SURFACE', 5514, 1.0], ['THE UPPER MANTLE', 6280, 0.9], ['THE OUTER CORE', 10990, 0.546], ['THE INNER CORE', 12860, 0.19]]
  .map(([name, rho, r]) => ({ name, r, n: ucNightForAcc(4 / 3 * Math.PI * 6.674e-11 * rho) }));
// the stars labelled in the frozen sky: [name, light years]
const UC_STAR_LY = { FOMALHAUT: 25.1, ALTAIR: 16.7, DIPHDA: 96, MARKAB: 133, ENIF: 690, SCHEAT: 196, ALPHERATZ: 97, ALGENIB: 390 };
const UC_STAR_EDGE = Object.fromEntries(Object.entries(UC_STAR_LY).map(([k, d]) => [k, ucNightForH(UCP.c / (d * UCP.ly))]));
UC.satEdgeN = ucNightForEdge(UC_D.saturn); UC.sunEdgeN = ucNightForEdge(UC_D.sun);
const UC_G0 = 9.81;

// the scene's context line: [from, to, label, value(t, n)] (value: text, or { l, v, v2 } with HTML)
const UC_CTX = [
  [UC.grow + 5.2, UC.held - 0.3, 'A GALAXY 100 MILLION LIGHT YEARS AWAY', () => ({ v: 'DRIFTS OFF AT 2,100 km/s', v2: 'TWICE AS FAR: TWICE AS FAST' })],
  [UC.scope + 0.7, UC.rule - 0.3, 'SATURN', () => ({ v: '1.28 BILLION km AWAY', v2: 'ITS LIGHT LEFT IT 71 MINUTES AGO' })],
  [UC.second + 1.0, UC.letgo, 'THE EDGE', (t, n) => ({ v: ucFmtLy(ucEdge(Math.max(1e-30, n))) + ' AWAY', v2: 'PAST IT, THINGS MOVE AWAY FASTER THAN LIGHT' })],
  [UC.stars + 0.2, UC.resume - 0.3, 'THE EDGE', (t, n) => ({ v: ucFmtLy(ucEdge(Math.max(1e-30, n))) + ' AWAY', v2: 'PAST IT, THINGS MOVE AWAY FASTER THAN LIGHT' })],   // (not over the chart)
  [UC.resume + 1.2, UC.stretch - 0.2, 'YOUR WEIGHT', (t, n) => Math.round(ucWeight(n) * 100) + '% · ALL AT ONCE, AT 7:30'],
  [UC.stretch + 1.4, UC.moon - 0.3, 'STARLIGHT, STRETCHED BY', (t, n) => ({ v: '× ' + ucA(n).toFixed(2), v2: 'STARS YOU CAN SEE: ' + ucThousands(ucStarsVisible(n)) })],
  [UC.moon + 0.7, UC.saturn - 0.3, 'THE MOON', (t, n) => { const M = ucMoonSeen(n); return { v: ucFmtKm(M.A * UC_D.moon) + ' AWAY', v2: 'ITS LIGHT: SUNLIGHT ' + ucFmtAge(n - ucSent(n, UC_D.sunMoon + UC_D.moon)) + ' OLD' }; }],
  [UC.saturn + 0.7, UC.blue - 0.3, 'SATURN', (t, n) => ({ v: n < UC.satEdgeN ? ucFmtKm(ucA(n) * UC_D.saturn) + ' AWAY' : 'OVER THE EDGE', v2: 'THE LIGHT YOU SEE LEFT IT ' + ucFmtAge(n - ucSent(n, UC_D.saturn)) + ' AGO' })],
  [UC.blue + 0.7, UC.moon2 - 0.3, 'STARLIGHT, STRETCHED BY', (t, n) => ({ v: '× ' + ucA(n).toFixed(2), v2: 'STARS YOU CAN SEE: ' + ucThousands(ucStarsVisible(n)) })],
  [UC.moon2 + 0.7, UC.sun - 0.2, 'THE MOON', (t, n) => ({ v: ucFmtKm(ucMoonSeen(n).A * UC_D.moon) + ' AWAY', v2: 'ITS LIGHT, STRETCHED BY × ' + ucMoonSeen(n).stretch.toFixed(2) })],
  [UC.sun + 0.5, UC.weight - 0.3, 'THE SUN', (t, n) => ({ v: n < UC.sunEdgeN ? ucFmtKm(ucA(n) * UC_D.sun) + ' AWAY' : 'OVER THE EDGE', v2: n < UC.sunEdgeN ? 'MOVING AWAY AT ' + Math.round(ucH(n) * ucA(n) * UC_D.sun / UCP.c * 100) + '% OF LIGHT SPEED' : 'MOVING AWAY FASTER THAN LIGHT' })],
  [UC.weight + 0.7, UC.air - 0.3, 'YOUR WEIGHT', (t, n) => {
    const w = ucWeight(n), v = Math.round(w * 100) + '%';
    if (t >= UC.fountain && t < UC.moongo) return { v, v2: 'THE FOUNTAIN: ' + Math.round(2.3 * 2.3 / (2 * UC_G0 * w) * 100) + ' cm HIGH (NORMALLY 27)' };
    if (t >= UC.jump - 0.6) return { v, v2: 'A JUMP: ' + (2 * 2.7 / (UC_G0 * Math.max(0.05, ucWeight(ucNight(UC.jump))))).toFixed(1) + ' s IN THE AIR (NORMALLY 0.6)' };
    return v;
  }],
  [UC.air + 0.6, UC.tea - 0.3, 'AIR PRESSURE', (t, n) => { const p = ucPressure(n); return { v: p.toFixed(2) + ' atm', v2: p > 0.7 ? 'LIKE A PLANE\'S CABIN' : p > 0.52 ? 'LIKE THE TOP OF MONT BLANC' : p > 0.4 ? 'LIKE THE TOP OF KILIMANJARO' : p > 0.3 ? 'LIKE THE TOP OF EVEREST' : 'LESS THAN THE TOP OF EVEREST' }; }],
  [UC.tea + 0.6, UC.flame - 0.3, 'WATER BOILS AT', (t, n) => { const b = ucBoil(ucPressure(n)); return { v: Math.round(b) + ' °C', v2: `YOUR TEA: ${UC_TEA} °C${b <= UC_TEA ? ' · <span class="chip hit">● BOILING</span>' : ''}` }; }],
  [UC.flame + 0.6, UC.zero - 0.3, 'YOUR WEIGHT', (t, n) => ({ v: Math.round(ucWeight(n) * 100) + '%', v2: 'HOT AIR RISES BECAUSE IT WEIGHS LESS' })],
  [UC.zero + 0.6, UC.pieces - 0.3, 'YOUR WEIGHT', (t, n) => { const w = ucWeight(n); if (t >= UC.drift) return { v: 'NOTHING', v2: 'YOU AND YOUR GARDEN FLOAT OFF TOGETHER' }; return w > 0.005 ? Math.round(w * 100) + '%' : { l: 'PULLED UP AT', v: (w > -0.995 ? Math.round(-w * 100) + '% OF' : ucFmtTimes(-w) + ' ×') + ' GRAVITY' }; }],
  [UC.pieces + 0.6, UC.midnight - 0.05, 'THE PULL ACROSS YOUR HOUSE', (t, n) => {
    const left = ucLeft(t), A = t >= UC.last ? ucAccLeft(left) : ucAcc(n);
    const who = t < UC.house ? ['THE PULL ACROSS YOUR HOUSE', 10] : t < UC.you ? ['THE PULL ACROSS YOU', 1.7] : t < UC.atoms - 0.4 ? ['THE PULL ACROSS A MOLECULE', 1e-9] : ['THE PULL ACROSS AN ATOM', 1e-10];
    const g = A * who[1] / UC_G0;
    return { l: who[0], v: g < 0.01 ? (g * 100).toPrecision(1) + '% OF GRAVITY' : ucFmtTimes(g) + ' × GRAVITY', v2: t < UC.house ? 'BRICKS AND MORTAR STILL HOLD IT' : '' };
  }],
  [UC.real + 1.4, UC.future - 0.3, 'THE REAL UNIVERSE', (t) => t < ucS('rip') - 0.3 ? { v: 'GALAXIES LEAVE FASTER EVERY YEAR', v2: 'FOUND IN 1998 · NOBEL PRIZE 2011' } : { l: 'THE PUSH (DARK ENERGY)', v: 'STEADY, OR WEAKENING', v2: 'NOT GROWING NOW · THE LATEST SURVEYS, 2025' }],
];
// the honest labels: [from, to, text]
const UC_TAGS = [
  [0.3, UC.titleShot, 'LATER TONIGHT'],
  [UC.grow + 0.3, UC.scope - 0.2, 'ILLUSTRATION · SPACE GROWING · 10 BILLION YEARS IN 20 SECONDS'],
  [UC.scope + 0.3, UC.rule - 0.2, 'THROUGH YOUR TELESCOPE · 120×'],
  [UC.rule + 0.4, UC.second - 0.1, 'THOUGHT EXPERIMENT · FROM 7:30, SPACE GROWS FASTER AND FASTER'],
  [UC.second + 0.3, UC.far - 0.1, 'THE FIRST SECOND · SLOWED DOWN'],
  [UC.far + 0.3, UC.andro - 0.1, 'ILLUSTRATION · DISTANCES SQUEEZED TO FIT'],
  [UC.andro + 0.3, UC.resume + 0.4, 'THE FIRST SECOND · SLOWED DOWN'],
  [UC.stretch + 0.6, UC.saturn - 0.1, 'THE NIGHT, SPED UP'],
  [UC.saturn + 0.3, UC.blue - 0.1, 'THROUGH YOUR TELESCOPE · THE NIGHT, SPED UP'],
  [UC.blue + 0.3, UC.zeroAt + 1.6, 'THE NIGHT, SPED UP'],
  [ucCap('zero', 2).show, UC.last - 0.1, 'FROM HERE, PRETEND YOU CAN BREATHE'],
  [UC.last + 0.3, UC.midnight - 0.05, 'THE LAST SECOND · SLOWED DOWN'],
  [UC.real + 0.3, ucS('rip') - 0.3, 'REAL · ILLUSTRATED'],
  [ucS('rip') - 0.3, UC.future - 0.1, 'REAL MEASUREMENTS · ILLUSTRATED'],
  [UC.future + 0.3, UC.question - 0.1, 'THE REAL FUTURE · ILLUSTRATED'],
];
// a caption's text with its numbers in amber
function ucCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\b(\d[\d,.:%]*(?:\s?(?:billion years|billion|years|seconds?))?|a millionth of a second|half a second|the first second|the last second|a quarter)\b/gi, '<span class="n">$1</span>');
}

class UcHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('uc-ro', '<div class="l">SPACE DOUBLES EVERY</div><div class="v"></div><div class="s"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
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
    const W = StoryHUD.win, n = ucNight(t), real = t >= UC.real;
    // ---- the readout: the cold open, then from "space doubles" to midnight; the real value again at the end
    const ra = Math.max(W(t, 0.4, UC.titleShot - 0.1, 0.5, 0.3), W(t, ucCap('grow', 1).show - 0.2, UC.midnight - 0.05, 0.6, 0.05), W(t, UC.real + 0.8, UC.future - 0.3, 0.6, 0.6));
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      let T, sub;
      if (real) { T = ucT(-1); sub = 'AND SLOWLY GETTING LONGER'; }
      else if (t >= UC.last) { const left = ucLeft(t); T = Math.LN2 * left / UCP.h; sub = ucDurSub(T, 1); }
      else { T = ucT(n); sub = ucDurSub(T, n); }
      this._txt('rov', this.roV, ucFmtDur(T)); this._txt('ros', this.roS, sub);
    }
    // ---- the context line
    const cx = UC_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t, n), o = typeof r === 'string' ? { v: r } : r;
      this._txt('cxl', this.ctxL, o.l || cx[2]); this._html('cxv', this.ctxV, o.v); this._html('cxv2', this.ctxV2, o.v2 || '');
    }
    // ---- the honest label
    const tg = UC_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.5, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the time tonight (and in the first and last second, how far into it / how long is left)
    const ca = Math.max(W(t, 0.4, UC.titleShot - 0.1, 0.5, 0.3), W(t, UC.scope + 0.4, UC.midnight - 0.05, 0.6, 0.05));
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = ucClockParts(t < UC.midnight ? Math.min(n, UCP.R - 1e-3) : n);   // (until midnight it is still 11:59:59)
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.s).padStart(2, '0')}</small> <i>PM</i>`);
      let f = '';
      if (t >= UC.onset && t < UC.resume + 0.4) f = '+ ' + ucFrac(Math.min(0.999999, n)) + ' s';
      else if (t >= UC.last) f = ucFrac(ucLeft(t)) + ' s TO MIDNIGHT';
      this._txt('ckf', this.clockF, f);
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
      // (kept clear of the readout and the context box in the top left while that box is up)
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      d.style.left = lx.toFixed(2) + '%'; d.style.top = (cx && lx < 40 ? Math.max(ly, 44) : ly).toFixed(2) + '%';
      const h = `<span class="d"></span><span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (d._h !== h) { d._h = h; d.innerHTML = h; }
    });
  }

  // the diagrams (SVG, 760×470 design px, right of centre)
  _insets(t, n) {
    const W = StoryHUD.win;
    const which = [
      ['letgo', UC.letgo + 0.1, UC.stars - 0.2], ['stretch', ucCap('stretch', 1).show - 0.3, UC.red - 0.1], ['sun', UC.sun + 0.2, UC.weight - 0.3],
      ['earth', ucCap('crack', 1).show - 0.4, UC.drift - 0.3], ['ladder', UC.last + 0.4, UC.midnight - 0.05],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.5, which[0] === 'ladder' ? 0.05 : 0.5) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = UcHud[k](u, t, n);
  }
  static svg(body) { return `<svg viewBox="0 0 760 470" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.68) { return `<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // what holds each thing together against the pull apart (log scale): from 7:30 the pull is 1.5 × 10⁻⁸ per second²,
  // already more than holds a galaxy, the Sun's family, or the Moon; not yet what holds you to the Earth
  static letgo(u, t) {
    const P0 = 1.5e-8, rows = [
      ['THE MILKY WAY → ITS STARS', 7.8e-31, ucCap('letgo', 0).show], ['THE SUN → THE EARTH', 3.96e-14, ucCap('letgo', 1).show],
      ['THE EARTH → THE MOON', 7.0e-12, ucCap('letgo', 2).show], ['THE EARTH → YOU', 1.54e-6, ucCap('letgo', 3).hide + 0.1],
    ];
    const X = (v) => 70 + (Math.log10(v) + 32) / 27 * 620, xp = X(P0);
    let body = '';
    rows.forEach(([name, hold, at], i) => {
      const y = 92 + i * 86, on = MathX.smooth(t, at - 0.3, at + 0.4), win = P0 > hold, hx = X(hold);
      // (what happens is said after the name, clear of the pull's line)
      body += `<g opacity="${(0.25 + 0.75 * on).toFixed(3)}"><text x="70" y="${y - 14}" class="t">${name}<tspan class="s" dx="16" style="fill:${win ? '#ffb38a' : '#bfe0ff'}">${win ? 'LETS GO' : 'HOLDS · FOR NOW'}</tspan></text>
        <rect x="70" y="${y}" width="${(hx - 70).toFixed(1)}" height="16" rx="8" fill="${win ? 'rgba(222,214,196,0.35)' : '#9fd0ff'}"/></g>`;
    });
    return UcHud.svg(`${UcHud.plate()}
      <text x="70" y="40" class="s">WHAT HOLDS IT TOGETHER</text>
      ${body}
      <line x1="${xp.toFixed(1)}" y1="86" x2="${xp.toFixed(1)}" y2="420" stroke="#ffcf8a" stroke-width="4"/>
      <text x="${(xp - 10).toFixed(1)}" y="446" class="t" text-anchor="end" style="fill:#ffcf8a">THE PULL APART, FROM 7:30</text>`);
  }
  // starlight on its way: the wave leaves a star short and blue-white, crosses space that grows, arrives long and red
  static stretch(u, t, n) {
    const G = Math.max(1, ucA(n)), x0 = 70, x1 = 690, y = 230;
    let d = '';
    for (let i = 0; i <= 300; i++) {
      const s = i / 300, x = x0 + (x1 - x0) * s;
      // (the phase builds up as the wave stretches: ∫ dx / λ)
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y - 46 * Math.sin(2 * Math.PI * UcHud._ph(s, G))).toFixed(1);
    }
    const flow = (u * 0.45) % 1, c0 = 'rgb(200,220,255)', c1 = 'rgb(255,120,70)';
    return UcHud.svg(`${UcHud.plate()}
      <defs><linearGradient id="ucw" x1="0" x2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>
      <circle cx="${x0 - 20}" cy="${y}" r="20" fill="#e8f0ff"/><text x="${x0 - 20}" y="${y + 66}" class="t" text-anchor="middle">A STAR</text>
      <path d="${d}" fill="none" stroke="url(#ucw)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="${x1 + 26}" cy="${y}" r="12" fill="none" stroke="#fff" stroke-width="3"/><circle cx="${x1 + 26}" cy="${y}" r="4" fill="#fff"/>
      <text x="${x1 + 20}" y="${y + 66}" class="t" text-anchor="end">YOU</text>
      ${[0.2, 0.45, 0.7].map((s) => { const x = x0 + (x1 - x0) * ((s + flow * 0.25) % 1); return `<path d="M ${x - 14} ${y + 96} L ${x + 14} ${y + 96} M ${x + 4} ${y + 88} L ${x + 14} ${y + 96} L ${x + 4} ${y + 104}" stroke="rgba(222,214,196,0.6)" stroke-width="3" fill="none"/>`; }).join('')}
      <text x="380" y="${y + 140}" class="s" text-anchor="middle">SPACE GROWS WHILE THE LIGHT CROSSES IT</text>
      <text x="380" y="70" class="t" text-anchor="middle">LEAVES SHORT AND BLUE · ARRIVES LONG AND RED</text>`);
  }
  static _ph(s, G) { const k = Math.max(1.8, G * 1.6) - 1; let a = 0; const N = 60; for (let i = 0; i < N; i++) { const q = (i + 0.5) / N * s; a += s / N / (22 * (1 + k * Math.pow(q, 1.4))); } return a * 620; }
  // the Sun goes over the edge: the light already on its way still reaches the Moon (and you); light it gives off from
  // now on is carried away faster than it can travel (not to scale)
  static sun(u, t, n) {
    const ex = 300, cy = 235, R = 190, over = MathX.smooth(t, UC.sunGone - 0.2, UC.sunGone + 0.6);
    const sx = 520 + 70 * over;
    let packets = '';
    for (let i = 0; i < 8; i++) { const x = sx - 40 - ((i * 38 + u * 50) % 300); if (x > 130 && x < sx - 30) packets += `<path d="M ${x - 10} ${cy} q 5 -10 10 0 t 10 0" stroke="#ffd7a8" stroke-width="3" fill="none"/>`; }
    // (new light, after the crossing: it moves towards you through space, but space carries it off faster)
    const nl = over > 0.5 ? [0, 1, 2].map((k) => `<path d="M ${sx - 46 - k * 6} ${cy + 36 + k * 22} q 5 -10 10 0 t 10 0" stroke="rgba(255,150,90,0.6)" stroke-width="2.5" fill="none"/><path d="M ${sx - 18 - k * 6} ${cy + 31 + k * 22} l 18 0 m -7 -6 l 7 6 l -7 6" stroke="rgba(255,150,90,0.6)" stroke-width="2" fill="none"/>`).join('') : '';
    return UcHud.svg(`${UcHud.plate()}
      <circle cx="${ex}" cy="${cy}" r="${R}" fill="rgba(255,215,168,0.05)" stroke="rgba(255,215,168,0.75)" stroke-width="3" stroke-dasharray="10 8"/>
      <text x="${ex - R + 18}" y="${cy - R + 50}" class="s">THE EDGE</text>
      <circle cx="${ex - 120}" cy="${cy}" r="12" fill="#5a8fd8"/><text x="${ex - 120}" y="${cy + 44}" class="t" text-anchor="middle">YOU</text>
      <circle cx="${ex - 70}" cy="${cy - 40}" r="7" fill="#d8d4c8"/><text x="${ex - 70}" y="${cy - 58}" class="s" text-anchor="middle">MOON</text>
      ${packets}${nl}
      <circle cx="${sx}" cy="${cy}" r="30" fill="#ffd27a"/><circle cx="${sx}" cy="${cy}" r="52" fill="rgba(255,210,122,0.18)"/>
      <text x="${sx}" y="${cy + 80}" class="t" text-anchor="middle">THE SUN</text>
      <text x="380" y="446" class="s" text-anchor="middle">${over > 0.5 ? 'ITS NEW LIGHT CAN NEVER REACH YOU' : 'SUNLIGHT ALREADY ON ITS WAY'}</text>`);
  }
  // Earth's layers, from the outside in: each lets go when the pull beats the mean density inside it
  static earth(u, t, n) {
    const cx = 228, cy = 235, R = 195;
    const cols = ['#5c4a3a', '#8a4a2a', '#d0702a', '#ffcf6a'];
    let rings = '', list = '';
    UC_LAYERS.forEach((L, i) => {
      const gone = n >= L.n, k = MathX.smooth(n, L.n - 20, L.n + 20);
      rings += `<circle cx="${cx}" cy="${cy}" r="${(R * L.r).toFixed(1)}" fill="${cols[i]}" stroke="${gone ? '#fff' : 'rgba(0,0,0,0.4)'}" stroke-width="${gone ? 3 : 1.5}" ${gone ? 'stroke-dasharray="12 7"' : ''}/>`;
      const c = ucClockParts(L.n), y = 110 + i * 78;
      list += `<g opacity="${(0.45 + 0.55 * k).toFixed(3)}"><text x="448" y="${y}" class="t">${L.name}</text><text x="448" y="${y + 28}" class="s" style="fill:${gone ? '#ffb38a' : '#ffd7a8'}">${gone ? 'LETS GO' : 'LETS GO AT'} ${c.h}:${String(c.m).padStart(2, '0')}</text></g>`;
    });
    return UcHud.svg(`${UcHud.plate()}${rings}${list}
      <text x="380" y="452" class="s" text-anchor="middle">THE DENSER THE INSIDE, THE LONGER IT HOLDS</text>`);
  }
  // the last second, on a ladder of time left (each step 10× less): when each thing's own glue gives way
  static ladder(u, t) {
    const left = ucLeft(t), Y = (s) => 92 + (Math.log10(1) - Math.log10(s)) / 18 * 330, yNow = Math.min(430, Y(Math.max(1e-18, left)));
    const marks = [[0.79, 'YOUR HOUSE', UC.house, -12], [0.056, 'YOU', UC.you, 12], [1.8e-14, 'MOLECULES', UC.atoms - 0.6, 0], [4.3e-17, 'ATOMS', UC.atoms, 0]];
    let m = '';
    for (const [s, name, at, dy] of marks) {
      const y = Y(s), yl = y + dy, hit = t >= at;   // (the two top marks sit close: their labels spread apart a little)
      m += `<line x1="250" y1="${y.toFixed(1)}" x2="290" y2="${y.toFixed(1)}" stroke="${hit ? '#ffcf8a' : 'rgba(222,214,196,0.6)'}" stroke-width="4"/>
        <text x="310" y="${(yl + 8).toFixed(1)}" class="t" style="fill:${hit ? '#ffcf8a' : '#f6efe2'}">${name}${hit ? ' · LETS GO' : ''}</text>
        <text x="230" y="${(yl + 8).toFixed(1)}" class="s" text-anchor="end">${s >= 0.01 ? s + ' s' : '10<tspan dy="-10" font-size="15">' + Math.round(Math.log10(s)) + '</tspan><tspan dy="10"> s</tspan>'}</text>`;
    }
    return UcHud.svg(`${UcHud.plate()}
      <line x1="270" y1="70" x2="270" y2="430" stroke="rgba(222,214,196,0.35)" stroke-width="3"/>
      ${m}
      <circle cx="270" cy="${yNow.toFixed(1)}" r="11" fill="#fff"/><circle cx="270" cy="${yNow.toFixed(1)}" r="22" fill="rgba(255,255,255,0.22)"/>
      <text x="40" y="40" class="s">TIME LEFT TO MIDNIGHT</text>
      <text x="40" y="452" class="s">EACH STEP DOWN: TEN TIMES LESS</text>`);
  }
}

// the labels the garden pins to things in its sky and on the ground (by shot)
function ucGardenLabels(t, set) {
  const s = ucShotAt(t), sky = set.sky, n = set._n ?? ucNight(t), W = StoryHUD.win;
  if (s.mode === 'andro') {
    const gone = t >= UC.andGone;
    return [{ p: sky.at('ANDROMEDA', 300), text: 'ANDROMEDA', sub: gone ? 'OVER THE EDGE · STILL IN SIGHT' : '2.5 MILLION LIGHT YEARS', a: W(t, ucS('andromeda') - 0.2, UC.letgo, 0.5, 0.4) }];
  }
  if (s.mode === 'stars') {
    return ['FOMALHAUT', 'DIPHDA', 'ENIF', 'MARKAB', 'ALTAIR'].map((k, i) => {
      const over = n >= UC_STAR_EDGE[k], ms = UC_STAR_EDGE[k];
      return { p: sky.at(k, 300), text: k, sub: over ? `OVER THE EDGE AT ${ms.toFixed(ms < 0.01 ? 3 : 2)} s` : `${ucSig(UC_STAR_LY[k])} LIGHT YEARS`, a: W(t, UC.stars + 0.6 + i * 0.25, UC.resume - 0.2, 0.4, 0.4) };
    });
  }
  if (s.mode === 'sky') {
    const a = W(t, UC.red + 0.2, UC.moon - 0.2, 0.5, 0.4);
    return [{ p: sky.at('MIRACH', 300), text: 'MIRACH', sub: 'A RED STAR', a }, { p: sky.at('ALGENIB', 300), text: 'ALGENIB', sub: 'A BLUE STAR', a }];
  }
  if (s.mode === 'pleiades') return [{ p: sky.at('ALCYONE', 300), text: 'THE PLEIADES', sub: 'HOT BLUE STARS', a: W(t, UC.blue + 0.5, ucCap('blue', 1).show - 0.1, 0.4, 0.4) }];
  if (s.mode === 'pieces') return [{ p: [0, 4, 2], text: 'YOUR HOUSE', sub: 'STILL IN ONE PIECE', a: W(t, ucCap('pieces', 1).show - 0.2, UC.last - 0.1, 0.4, 0.3) }];
  return [];
}
