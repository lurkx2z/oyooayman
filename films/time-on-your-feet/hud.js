/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     YOUR FEET STAY YOUNGER BY · its value over an 80-year life · NEXT: the next place (so there is
                  always something coming); under it one context line for the scene
     top right    WHERE you are, and the gravity there
     bottom left  the honest label (real / illustration / sped up / pretend nothing can hurt you)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the two clocks read out in full (head and feet, every digit, the gap), and the diagrams: the maths,
                  a GPS signal's 11 km, Sirius B's stretched light
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

function tfThousands(n) { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
// a fraction of a second, spelled in groups of three ("0.000 000 47")
function tfFrac(x, sig = 2) {
  if (x <= 0) return '0';
  if (x >= 1) return x.toFixed(sig);
  const e = Math.floor(Math.log10(x)), dig = Math.max(3, -e - 1 + sig), s = x.toFixed(Math.min(dig, 30)).replace(/^0\./, '');
  return '0.' + s.match(/.{1,3}/g).join(' ').replace(/[\s0]+$/, (m) => m.replace(/0/g, '').length ? m : '');
}
// a stretch of time said simply: "0.000 000 47 s", "0.18 s", "21 HOURS", "1.4 YEARS", "29,000 YEARS"
function tfFmtSpan(s) {
  const y = s / TFP.year;
  if (s < 0.01) return tfFrac(s) + ' s';
  if (s < 90) return (s < 10 ? s.toFixed(2) : s.toFixed(1)) + ' s';
  if (s < 5400) return Math.round(s / 60) + ' MINUTES';
  if (s < 2.5 * 86400) return Math.round(s / 3600) + ' HOURS';
  if (y < 1.5) return Math.round(s / 86400) + ' DAYS';
  if (y < 10) return y.toFixed(1).replace(/\.0$/, '') + ' YEARS';
  if (y < 1000) return Math.round(y) + ' YEARS';
  return tfThousands(Math.round(y / 1000) * 1000) + ' YEARS';
}
// gravity in g, said simply
function tfFmtG(gx) {
  if (gx < 1.5) return gx < 0.5 ? gx.toFixed(2) + ' g' : '1 g';
  if (gx < 1e6) return tfThousands(Math.round(gx / (gx > 1e4 ? 1000 : 1)) * (gx > 1e4 ? 1000 : 1)) + ' g';
  if (gx < 1e12) return (gx / 1e9 >= 1 ? Math.round(gx / 1e9) + ' BILLION' : Math.round(gx / 1e6) + ' MILLION') + ' g';
  const e = Math.floor(Math.log10(gx)); return `${(gx / Math.pow(10, e)).toFixed(0)} × 10<sup>${e}</sup> g`;
}

// ---- the two clocks, every digit: BigInt in units of 10⁻¹⁹ s (the gap at home is 10⁻¹⁶ of a second per second)
const TF_U = 10n ** 19n;
function tfClockStr(U, o = {}) {
  const s = U / TF_U, f = U % TF_U, tod = Number((s + BigInt(o.start ?? 7 * 3600)) % 86400n), day = Number((s + BigInt(o.start ?? 7 * 3600)) / 86400n);
  const hh = String(Math.floor(tod / 3600)).padStart(2, '0'), mm = String(Math.floor(tod / 60) % 60).padStart(2, '0'), ss = String(tod % 60).padStart(2, '0');
  const fr = f.toString().padStart(19, '0');
  return { big: `${hh}:${mm}:${ss}`, frac: fr, day };
}
const tfGroup3 = (s) => s.match(/.{1,3}/g).join(' ');
// clock(t) → strings for the faces and the HUD: { head: {big, small, day}, feet: {…}, gap }
function tfFmtClock(c) {
  if (c.fmt === 'fine') {
    const hU = BigInt(Math.round(c.head * 1000)) * 10n ** 16n, gU = BigInt(Math.round(c.gap * 1e19)), fU = hU - gU;
    const H = tfClockStr(hU), F = tfClockStr(fU);
    return { head: { big: H.big, small: '.' + tfGroup3(H.frac), day: H.day }, feet: { big: F.big, small: '.' + tfGroup3(F.frac), day: F.day }, gap: c.gap };
  }
  if (c.fmt === 'ms') {
    const hU = BigInt(Math.round(c.head * 1000)) * 10n ** 16n, fU = BigInt(Math.round((c.head - c.gap) * 1000)) * 10n ** 16n;
    const H = tfClockStr(hU), F = tfClockStr(fU);
    return { head: { big: H.big, small: '.' + H.frac.slice(0, 3), day: H.day }, feet: { big: F.big, small: '.' + F.frac.slice(0, 3), day: F.day }, gap: c.gap };
  }
  // 'days': you've been here a while (the cold open)
  const d = (x0) => { const x = x0 + 7 * 3600, D = Math.floor(x / 86400), r = x - D * 86400, hh = Math.floor(r / 3600), mm = Math.floor(r / 60) % 60, ss = r % 60;
    return { big: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${ss.toFixed(3).padStart(6, '0').slice(0, 2)}`, small: '.' + ss.toFixed(3).split('.')[1], day: D }; };
  return { head: d(c.head), feet: d(c.head - c.gap), gap: c.gap };
}
// the places (top right): [from, to, place, gravity line(t)]
const TF_WHERE = [
  [0.3, TF.titleShot, 'SAGITTARIUS A*', () => '5 mm ABOVE THE EDGE'],
  [TF.hall + 0.2, TF.measured, 'YOUR HALLWAY', () => 'GRAVITY 1 g'],
  [TF.pound + 0.3, TF.planes, 'HARVARD, 1959', () => 'A 22.5 m TOWER'],
  [TF.planes + 0.3, TF.nist, 'AROUND THE WORLD, 1971', () => '4 CLOCKS · 2 AIRLINER TRIPS'],
  [TF.nist + 0.3, TF.skytree, 'BOULDER, COLORADO, 2010', () => 'NIST · ALUMINIUM-ION CLOCKS'],
  [TF.skytree + 0.4, TF.jila, 'TOKYO SKYTREE, 2020', () => '450 m APART'],
  [TF.jila + 0.3, TF.gps, 'BOULDER, COLORADO, 2022', () => 'JILA · STRONTIUM ATOMS'],
  [TF.gps + 0.5, TF.moon, '20,200 km UP', () => 'GRAVITY 0.06 g'],
  [TF.moon + 0.4, TF.why, 'THE MOON', () => 'GRAVITY 0.17 g'],
  [TF.why + 0.4, TF.go, 'YOUR HALLWAY', () => 'GRAVITY 1 g'],
  [TF.wd + 0.6, TF.ns, 'SIRIUS B · 8.6 LIGHT-YEARS', () => 'GRAVITY ' + tfFmtG(TFP.wd.gx)],
  [TF.ns + 0.6, TF.bh, 'A NEUTRON STAR', () => 'GRAVITY ' + tfFmtG(TFP.ns.gx)],
  [TF.bh + 0.6, TF.ten, 'SAGITTARIUS A* · 26,000 LIGHT-YEARS', (t) => { const r = tfBhR(t); return r > 1.02 ? (r - 1 < 9.5 ? (r - 1).toFixed(r - 1 < 1 ? 2 : 1) : Math.round(r - 1)) + ' × ITS RADIUS ABOVE THE EDGE' : 'JUST ABOVE THE EDGE'; }],
  [TF.ten + 0.2, TF.real, 'SAGITTARIUS A*', (t) => { const rho = tfRho(t); return (rho >= 1 ? (rho < 9.95 ? rho.toFixed(1) : Math.round(rho)) + ' m' : rho >= 0.01 ? Math.round(rho * 100) + ' cm' : rho >= 0.001 ? (rho * 1000).toFixed(1) + ' mm' : 'A HAIR\'S WIDTH') + ' ABOVE THE EDGE'; }],
  [TF.real + 0.6, TF.end, 'YOUR HALLWAY', () => 'GRAVITY 1 g'],
];
// the readout (top left): when it shows, its value, and what's NEXT
function tfReadoutAt(t) {
  const W = StoryHUD.win;
  const a = Math.max(W(t, 0.5, TF.titleShot - 0.1, 0.5, 0.3), W(t, TF.life + 1.2, TF.measured - 0.1, 0.6, 0.3), W(t, TF.bigger + 0.3, TF.real - 0.2, 0.5, 0.4));
  if (a <= 0) return null;
  // (frac = head rate / feet rate − 1, kept apart from the 1 so the tiny ones survive in floating point)
  let frac, next = '';
  if (t < TF.titleShot) { frac = TFP.h / TF.rhoDay; next = ''; }
  else if (t < TF.wd + 2.2) { frac = TFP.gapE; next = t > TF.bigger ? 'NEXT · A WHITE DWARF' : 'NEXT · STRONGER GRAVITY'; }
  else if (t < TF.ns) { frac = TFP.wd.frac; next = 'NEXT · A NEUTRON STAR'; }
  else if (t < TF.bh + 1) { frac = TFP.ns.frac; next = 'NEXT · A BLACK HOLE'; }
  else if (t < TF.ten) { frac = TFP.ns.frac; next = 'NEXT · THE EDGE OF A BLACK HOLE'; }
  else { frac = TFP.h / tfRho(t); next = t < TF.two ? 'NEXT · YOUR OWN HEIGHT ABOVE THE EDGE' : t < TF.eleven ? 'NEXT · 17 cm' : t < TF.day ? 'NEXT · 5 mm' : t < TF.edge ? 'NEXT · THE EDGE ITSELF' : ''; }
  const life = tfLifeGap(frac), inf = t >= TF.freeze + 1.2;
  return { a, v: inf ? 'NO LIMIT' : tfFmtSpan(life), s: frac > 0.5 ? 'WHILE YOUR FEET LIVE 80 YEARS' : 'OVER AN 80-YEAR LIFE', next };
}
// the scene's context line: [from, to, label, value(t)] (value: text, or { l, v, v2 } with HTML)
const TF_CTX = [
  [0.6, TF.titleShot - 0.2, 'WHILE YOUR HEAD LIVES 1 YEAR', () => ({ v: 'YOUR FEET LIVE 1 DAY', v2: 'TIME AT YOUR HEAD · ×365' })],
  [TF.precise + 0.2, TF.drift - 0.2, 'THE BEST CLOCKS · OPTICAL LATTICE CLOCKS', () => ({ v: 'OFF BY UNDER 1 s IN 15 BILLION YEARS', v2: '' })],
  [TF.drift + 0.4, TF.year - 0.2, 'TIME AT YOUR HEAD RUNS FASTER BY', () => ({ v: '0.000 000 000 000 019 %', v2: 'HEAD 1.7 m ABOVE YOUR FEET' })],
  [TF.year + 0.5, TF.life + 1.0, 'THE GAP AFTER', (t) => { const c = tfClock(t), y = c.head / TFP.year; return { l: 'THE GAP AFTER', v: y < 0.02 ? Math.max(1, Math.round(c.head / 86400)) + (c.head < 1.5 * 86400 ? ' DAY' : ' DAYS') : y < 1.5 ? (y < 0.995 ? Math.round(y * 365) + ' DAYS' : '1 YEAR') : Math.round(y) + ' YEARS', v2: tfFrac(c.gap) + ' s' }; }],
  [TF.bigBang - 0.2, TF.cat - 0.2, 'SINCE THE BIG BANG (13.8 BILLION YEARS)', () => ({ v: 'THE GAP: 81 SECONDS', v2: '' })],
  [TF.lie + 0.5, TF.hand - 0.2, 'HEAD AND FEET AT THE SAME HEIGHT', () => ({ v: 'THE SAME SPEED', v2: '' })],
  [TF.upstairs + 0.5, TF.measured - 0.2, 'ONE FLOOR UP · 3 m', () => ({ v: '+0.000 000 83 s', v2: 'OVER AN 80-YEAR LIFE' })],
  [TF.pound + 0.6, TF.planes - 0.2, 'POUND & REBKA', () => ({ v: '2.5 PARTS IN A MILLION BILLION', v2: 'THE ENERGY LOST, CLIMBING 22.5 m' })],
  [TF.planes + 0.6, TF.nist - 0.2, 'HAFELE & KEATING', () => ({ v: 'EASTWARD −59 ns · WESTWARD +273 ns', v2: 'HEIGHT AND SPEED BOTH CHANGE TIME' })],
  [TF.nist + 0.6, TF.skytree - 0.2, 'RAISED 33 cm', () => ({ v: 'FASTER BY 4 PARTS IN 10<sup>17</sup>', v2: '' })],
  [TF.skytree + 1.0, TF.jila - 0.2, 'THE TOP CLOCK GAINS', () => ({ v: '4 BILLIONTHS OF A SECOND A DAY', v2: 'TAKAMOTO ET AL. · NATURE PHOTONICS' })],
  [TF.jila + 0.6, TF.gps - 0.2, 'ACROSS 1 mm', () => ({ v: '1 PART IN 10<sup>19</sup>', v2: 'BOTHWELL ET AL. · NATURE' })],
  [TF.gps2 + 0.4, TF.gps3 - 0.2, 'A GPS CLOCK, EVERY DAY', (t) => ({ v: t < tfCap('gps2', 1).show ? '+45.7 µs · WEAKER GRAVITY' : t < tfCap('gps2', 2).show ? '+45.7 µs · −7.2 µs SPEED' : '+38.5 µs · NET', v2: 'µs = A MILLIONTH OF A SECOND' })],
  [TF.gps3 + 0.4, TF.moon - 0.2, 'SET BEFORE LAUNCH', () => ({ v: '10.229 999 995 43 MHz', v2: 'INSTEAD OF 10.23 MHz' })],
  [TF.moon + 0.6, TF.why - 0.2, 'A CLOCK ON THE MOON GAINS', () => ({ v: '+56 µs A DAY', v2: 'COORDINATED LUNAR TIME · NASA' })],
  [TF.fall + 0.3, TF.maths - 0.2, 'EACH METRE UP, TIME RUNS FASTER BY', () => ({ v: '0.000 000 000 000 000 11', v2: 'SECONDS EVERY SECOND' })],
  [TF.wd2 + 0.4, TF.wd3 - 0.2, 'YOUR WEIGHT', () => ({ v: tfThousands(Math.round(TFP.wd.weightT / 100) * 100) + ' TONNES', v2: 'THE EIFFEL TOWER: 10,100' })],
  [TF.wd4 + 0.4, TF.ns - 0.2, 'SIRIUS B\'S LIGHT, STRETCHED', () => ({ v: 'AS IF RACING AWAY AT 80 km/s', v2: 'MEASURED BY HUBBLE, 2005' })],
  [TF.ns2 + 0.4, TF.nsLand - 0.2, 'YOU CAN SEE', () => ({ v: Math.round(TFP.ns.visible * 100) + '% OF ITS SURFACE', v2: 'LIGHT FROM THE FAR SIDE BENDS ROUND' })],
  [TF.ns4 + 0.4, TF.ns5 - 0.2, 'STARLIGHT ARRIVES', () => ({ v: '×' + TFP.ns.blue.toFixed(2) + ' MORE ENERGY', v2: 'SUN-LIKE STARS TURN BLUE-WHITE' })],
  [TF.ns5 + 0.4, TF.bh - 0.2, 'TIME HERE RUNS', () => ({ v: Math.round(TFP.ns.rate * 100) + '% AS FAST AS ON EARTH', v2: 'ONE YEAR HERE = 1 YEAR 86 DAYS ON EARTH' })],
  [TF.bh2 + 0.3, TF.board - 0.2, 'EVENT HORIZON TELESCOPE · 2022', () => ({ v: 'ITS SHADOW, PHOTOGRAPHED', v2: '' })],
  [TF.board + 0.6, TF.sphere - 0.2, 'TO HOVER HERE', () => ({ v: 'A PUSH NO ROCKET COULD GIVE', v2: '' })],
  [TF.ten + 0.4, TF.feel - 0.2, 'TIME AT YOUR HEAD', (t) => { const r = tfBhRatio(tfRho(t)); return { v: t >= TF.freeze + 1.2 ? '× NO LIMIT' : '× ' + (r < 1.995 ? r.toFixed(2) : r < 30 ? r.toFixed(r < 10 ? 1 : 0) : tfThousands(r)), v2: 'TO HOVER: ' + tfFmtG(tfBhPush(tfRho(t))) }; }],
  [TF.real + 1.2, TF.home - 0.2, 'MEASURED', () => ({ v: '1959 · 1971 · 1976 · 2010 · 2020 · 2022', v2: 'AND EVERY GPS SATELLITE, EVERY DAY' })],
  [TF.home + 0.5, TF.end, 'SINCE THIS VIDEO STARTED', (t) => ({ v: tfFrac(t * TFP.gapE, 2) + ' s', v2: 'YOUR FEET, BEHIND YOUR HEAD' })],
];
// the honest labels: [from, to, text] (the first match wins)
const TF_TAGS = [
  [0.3, TF.titleShot, 'LATER IN THIS FILM · PRETEND NOTHING CAN HURT YOU'],
  [TF.hall + 0.4, TF.year, 'ILLUSTRATION · CLOCKS THIS GOOD FILL A LAB'],
  [TF.year + 0.3, TF.cat, 'SPED UP'],
  [TF.measured + 0.3, TF.gps, 'REAL EXPERIMENTS · ILLUSTRATED'],
  [TF.gps + 0.3, TF.why, 'REAL · ILLUSTRATED'],
  [TF.fall, TF.maths, 'THE DIFFERENCE EXAGGERATED 10,000,000,000,000,000 TIMES'],
  [TF.wd + 0.4, TF.wd3 + 0.6, 'FROM HERE, PRETEND NOTHING CAN HURT YOU'],
  [tfS('wd3') + 0.6, tfE('wd3') + 0.4, 'A DAY, SPED UP'],
  [TF.wd4, TF.ns5, 'PRETEND NOTHING CAN HURT YOU'],
  [tfS('ns5') + 0.4, tfCap('ns5', 0).hide, 'A DAY, SPED UP'],
  [TF.bh + 0.4, TF.board, 'ILLUSTRATION · ITS GLOW AS RADIO TELESCOPES SEE IT'],
  [TF.board, TF.real - 0.2, 'PRETEND YOUR PLATFORM CAN HOLD YOU UP · AND NOTHING CAN HURT YOU'],
];
// a caption's text with its numbers in amber
function tfCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\b(\d[\d,.:%]*(?:\s?(?:billionths|millionths|millionth|seconds|second|metres|metre|centimetres|millimetres|km|cm|AM|times|degrees|years|year|months|days))?(?:\s000)*|half a millionth of a second|twice as fast|a whole year|one day)/gi, '<span class="n">$1</span>');
}

class TfHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('tf-ro', '<div class="l">YOUR FEET STAY YOUNGER BY</div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('tf-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('tf-tag');
    this.where = mk('tf-where', '<div class="l">WHERE</div><div class="v"></div><div class="f"></div>'); this.whereV = this.where.querySelector('.v'); this.whereF = this.where.querySelector('.f');
    this.cap = mk('tf-cap');
    this.caps = TFT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: tfCapHtml(c.text), q: g.id === 'question' })));
    this.clocks = mk('tf-clocks', '<div class="r h"><span class="k">HEAD</span><span class="d"></span><span class="t"></span></div><div class="r f"><span class="k">FEET</span><span class="d"></span><span class="t"></span></div><div class="g"></div>');
    this.ckH = this.clocks.querySelector('.h .t'); this.ckF = this.clocks.querySelector('.f .t'); this.ckHd = this.clocks.querySelector('.h .d'); this.ckFd = this.clocks.querySelector('.f .d'); this.ckG = this.clocks.querySelector('.g');
    this.inset = mk('tf-inset');
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
    const W = StoryHUD.win;
    // ---- the readout
    const big = StoryHUD.win(t, TF.maths + 0.3, TF.pull - 0.1, 0.5, 0.5), R = tfReadoutAt(t), ra = R ? R.a * (1 - big) : 0;
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (R) { this._html('rov', this.roV, R.v); this._html('ros', this.roS, R.s); this._html('ron', this.roN, R.next); }
    // ---- the context line
    const cx = TF_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t), o = typeof r === 'string' ? { v: r } : r;
      this._txt('cxl', this.ctxL, o.l || cx[2]); this._html('cxv', this.ctxV, o.v); this._html('cxv2', this.ctxV2, o.v2 || '');
      this._set('cxt', this.ctx, 'top', ra > 0.05 ? '' : 'calc(var(--u) * 44)');
    }
    // ---- where
    const wh = TF_WHERE.find((x) => t >= x[0] && t < x[1]);
    this._set('wh', this.where, 'opacity', wh ? (W(t, wh[0], wh[1], 0.5, 0.3) * (1 - big)).toFixed(3) : '0');
    if (wh) { this._txt('whv', this.whereV, wh[2]); this._html('whf', this.whereF, wh[3](t)); }
    // ---- the honest label
    const tg = TF_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.5, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the caption
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'tf-cap q' : 'tf-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the two clocks, every digit
    this._clocks(t);
    // ---- the diagrams
    this._insets(t);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'tf-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = TfHud._p || (TfHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      const r = l.side ? l.side === 'l' : lx > 72; if (d._r !== r) { d._r = r; d.classList.toggle('r', r); }
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ((ra > 0.05 || cx) && lx < 40 ? Math.max(ly, 46) : ly).toFixed(2) + '%';
      const h = `<span class="d"></span><span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (d._h !== h) { d._h = h; d.innerHTML = h; }
    });
  }

  // the clocks in full: when the scene is about them
  _clocks(t) {
    const W = StoryHUD.win;
    const a = Math.max(W(t, 0.6, TF.titleShot - 0.1, 0.4, 0.3), W(t, TF.start - 0.5, TF.cat - 0.1, 0.4, 0.3), W(t, TF.wd3 + 0.2, TF.wd4 + 0.6, 0.4, 0.3),
      W(t, TF.ns5 + 0.2, TF.bh - 0.1, 0.4, 0.3), W(t, TF.ten + 0.4, TF.outside - 0.1, 0.4, 0.3), W(t, TF.edge + 0.2, TF.real - 0.2, 0.4, 0.3), W(t, TF.home + 0.4, TF.question - 0.1, 0.4, 0.3));
    this._set('cka', this.clocks, 'opacity', a.toFixed(3));
    if (a <= 0) return;
    const c = tfClock(t), F = tfFmtClock(c);
    // the digits that differ, in amber
    const hs = F.head.big + F.head.small, fs = F.feet.big + F.feet.small;
    let k = 0; while (k < hs.length && hs[k] === fs[k]) k++;
    const mark = (s) => k < s.length ? s.slice(0, k) + '<b>' + s.slice(k) + '</b>' : s;
    this._html('ckh', this.ckH, mark(hs)); this._html('ckf', this.ckF, mark(fs));
    const dayTxt = (D) => c.fmt === 'days' ? `DAY ${D + 1}` : (c.place === 'home' && c.head > 2 * 86400 ? (c.head > 1.5 * TFP.year ? 'YEAR ' + Math.floor(c.head / TFP.year + 1e-9) : 'DAY ' + (D + 1)) : '');
    this._txt('ckhd', this.ckHd, dayTxt(F.head.day)); this._txt('ckfd', this.ckFd, dayTxt(F.feet.day));
    this._html('ckg', this.ckG, 'YOUR FEET ARE BEHIND BY <b>' + (c.fmt === 'fine' ? tfFrac(c.gap, 3) + ' s' : tfFmtSpan(c.gap)) + '</b>');
  }

  // the diagrams (SVG, 760×470 design px)
  _insets(t) {
    const W = StoryHUD.win;
    const which = [
      ['maths', TF.maths + 0.3, TF.pull - 0.1], ['signal', tfCap('gps3', 0).show - 0.2, TF.phone + 0.1], ['spectrum', tfCap('wd4', 1).show - 0.3, TF.ns - 0.2],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.5, 0.5) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'tf-inset' : which[0] === 'maths' ? 'tf-inset big' : 'tf-inset');
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = TfHud[k](u, t);
  }
  static svg(body) { return `<svg viewBox="0 0 760 470" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.68) { return `<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // the maths: (how much faster per metre) × c² = 9.8 m/s², built term by term with the captions
  static maths(u, t) {
    const k1 = MathX.smooth(t, tfCap('maths', 0).show, tfCap('maths', 0).show + 0.5), k2 = MathX.smooth(t, tfCap('maths', 1).show, tfCap('maths', 1).show + 0.5), k3 = MathX.smooth(t, tfCap('maths', 2).show, tfCap('maths', 2).show + 0.6);
    return TfHud.svg(`${TfHud.plate(0.74)}
      <text x="380" y="62" class="s" text-anchor="middle">HOW MUCH FASTER TIME RUNS, PER METRE UP</text>
      <g opacity="${k1}"><text x="380" y="150" class="eq" text-anchor="middle">0.000 000 000 000 000 109</text>
      <text x="380" y="186" class="s" text-anchor="middle">SECONDS PER SECOND, PER METRE</text></g>
      <g opacity="${k2}"><text x="380" y="258" class="eq" text-anchor="middle">× (299,792,458 m/s)²</text>
      <text x="380" y="292" class="s" text-anchor="middle">THE SPEED OF LIGHT, SQUARED</text></g>
      <g opacity="${k3}"><line x1="150" y1="322" x2="610" y2="322" stroke="rgba(255,215,168,0.6)" stroke-width="3"/>
      <text x="380" y="392" class="eq big" text-anchor="middle">= 9.8 m/s²</text>
      <text x="380" y="432" class="s" text-anchor="middle">THE PULL OF THE EARTH</text></g>`);
  }
  // a GPS signal: in 38.5 µs it crosses 11.5 km (drawn to scale against a city)
  static signal(u) {
    const k = MathX.clamp(u / 2.2, 0, 1), x0 = 90, x1 = 670, x = x0 + (x1 - x0) * Ease.inOutSine(k);
    return TfHud.svg(`${TfHud.plate()}
      <text x="40" y="58" class="t">IN 38 MILLIONTHS OF A SECOND</text>
      <line x1="${x0}" y1="230" x2="${x1}" y2="230" stroke="rgba(222,214,196,0.35)" stroke-width="3" stroke-dasharray="8 8"/>
      <line x1="${x0}" y1="230" x2="${x.toFixed(1)}" y2="230" stroke="#ffcf8a" stroke-width="6" stroke-linecap="round"/>
      <circle cx="${x.toFixed(1)}" cy="230" r="13" fill="#fff"/><circle cx="${x.toFixed(1)}" cy="230" r="26" fill="rgba(255,220,160,0.25)"/>
      <text x="${x0}" y="290" class="b">0 km</text><text x="${x1}" y="290" class="b" text-anchor="end">11.5 km</text>
      <text x="380" y="380" class="s" text-anchor="middle">A GPS SIGNAL TRAVELS AT THE SPEED OF LIGHT</text>
      <text x="380" y="420" class="s" text-anchor="middle">EVERY 30 cm = 1 BILLIONTH OF A SECOND</text>`);
  }
  // Sirius B's light, stretched: a line in its spectrum sits redder than the same line made on Earth
  static spectrum(u) {
    const X0 = 70, X1 = 690, k = MathX.smooth(u, 0.4, 1.8), base = 380, shift = 26 * k;
    const stops = [[0, '#6a3cff'], [0.18, '#2a6bff'], [0.38, '#3fdc7a'], [0.58, '#f2e24a'], [0.78, '#ff8a2a'], [1, '#d01818']].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
    return TfHud.svg(`${TfHud.plate()}
      <defs><linearGradient id="tfv" x1="0" x2="1">${stops}</linearGradient></defs>
      <text x="40" y="58" class="t">ONE COLOUR OF LIGHT FROM SIRIUS B</text>
      <rect x="${X0}" y="130" width="${X1 - X0}" height="70" rx="6" fill="url(#tfv)" opacity="0.9"/>
      <rect x="${base - 4}" y="124" width="8" height="82" fill="rgba(255,255,255,0.92)"/>
      <text x="${base}" y="110" class="b" text-anchor="middle">MADE ON EARTH</text>
      <rect x="${(base + shift - 5).toFixed(1)}" y="124" width="10" height="82" fill="#000"/>
      <text x="${(base + shift).toFixed(1)}" y="244" class="b" text-anchor="middle">FROM SIRIUS B</text>
      <path d="M ${base + 8} 270 L ${(base + Math.max(14, shift)).toFixed(1)} 270" stroke="#ffcf8a" stroke-width="4"/>
      <text x="380" y="330" class="s" text-anchor="middle">SHIFTED TOWARDS RED:</text>
      <text x="380" y="366" class="s" text-anchor="middle">ITS LIGHT CLIMBED OUT OF ITS GRAVITY</text>
      <text x="380" y="418" class="s" text-anchor="middle">(THE SHIFT DRAWN 100× LARGER)</text>`);
  }
}
