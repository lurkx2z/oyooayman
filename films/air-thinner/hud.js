/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the long-form films' (Slower light, Friction 10 s, No light):
     top left     AIR LEFT (the share of this morning's air), its pressure, the height where a standard sky is that thin,
                  and the countdown to the next 1% (it flashes on each step)
     top right    the day and the time; REAL SPEED, or "+15 MIN LATER" when the clock jumps at a cut (it only runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       the air's weight over a square metre; the barometer; the regulator; 10 m of sea vs the whole sky
     bottom left  the honest labels (what is rough, where a number comes from)
     in the scene labels the set pins to things (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

const atN = (x) => Math.round(x).toLocaleString('en-US');
const atMMSS = (x) => { x = Math.max(0, x); return `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`; };
const atAlt = (s) => { const h = ATP.altAt(s); return atN(h < 1000 ? Math.round(h / 5) * 5 : Math.round(h / 10) * 10); };   // (85 m under 1 km, as the caption says)
// the scene's context box: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const AT_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [atC(id, k0) - 0.2, (k1 != null ? atCap(id, k1).hide : atE(id)) + 0.2, l, f];
  const P = ATP;
  return [
    beat('start', 'THE NEAREST LAND', () => ({ v: `${atN(Math.round(P.kmToLand / 100) * 100)} <small>km</small>`, v2: `ON BOARD: ${atN(P.passengers)} PASSENGERS · ${atN(P.crew)} CREW` }), 0, 1),
    beat('weight', 'THE FIRST 1%', () => ({ v: `${Math.round(P.climb1)} <small>m up</small>`, v2: 'THE FUNNEL’S TOP: 64 m OVER THE SEA' }), 2),
    beat('boil', 'THE SEA: 26 °C', () => ({ v: `boils below ${P.pvap(P.seaC).toFixed(0)} <small>hPa</small>`, v2: 'WATER BOILS WHEN THE AIR PRESSES ON IT LESS THAN ITS VAPOUR DOES' })),
    beat('cabin', 'LIKE BEING', (t, s) => ({ v: `${atAlt(s)} <small>m up</small>`, v2: 'AN AIRLINER’S CABIN: 2,438 m (8,000 ft)' }), 0, 0),
    beat('stairs', 'OXYGEN IN EACH BREATH', (t, s) => ({ v: `${Math.round(P.air(s) * 100)}<small>%</small>`, v2: 'OF A BREATH AT 10:00 AM' }), 0, 1),
    beat('stairs', 'THE MEDICAL CENTRE', () => ({ v: 'deck 2', v2: '13 DECKS DOWN' }), 2),
    beat('tanks', 'YOUR TANKS', () => ({ v: `6 × ${atN(P.tankL * P.tankBar)} <small>litres</small>`, v2: `${P.tankL} LITRES AT ${P.tankBar} bar EACH` }), 3),
    beat('engines', 'THE SHIP’S SPEED', (t, s) => ({ v: `${(ATV.v(s) * 1.944).toFixed(1)} <small>knots</small>`, v2: 'DIESELS BURN THE AIR’S OXYGEN' })),
    beat('marina', 'YOU PASS OUT IN ABOUT', (t, s) => ({ v: atMMSS(ATE.youOut - s), v2: `WORKING HARD · LIKE ${atAlt(s)} m UP` })),
    beat('dive', 'YOU PASS OUT IN ABOUT', (t, s) => ({ v: atMMSS(ATE.youOut - s), v2: `WORKING HARD · LIKE ${atAlt(s)} m UP` })),
    beat('under', 'DEPTH', () => ({ v: `${AT_F.depth.toFixed(1)} <small>m</small>`, v2: '' }), 0, 0),
    beat('under', 'PRESSING ON YOU', (t, s) => ({ v: `${(P.seaBar(AT_F.depth) + P.hpa(s) / 1000).toFixed(2)} <small>bar</small>`, v2: `THE SEA ${P.seaBar(AT_F.depth).toFixed(2)} + THE AIR ${(P.hpa(s) / 1000).toFixed(2)}` }), 1),
    beat('everest', 'UP THERE, LIKE', (t, s) => ({ v: `${atAlt(s)} <small>m up</small>`, v2: `EVEREST: ${atN(P.everest)} m` })),
    beat('shark', 'YOUR AIR', (t, s) => ({ v: `tank ${ATK.tankNo(s)} <small>of 6</small>`, v2: `${atN(Math.round(ATK.left(s) / 100) * 100)} LITRES LEFT` })),
    beat('oxygen', 'UP THERE, LIKE', (t, s) => ({ v: `${atAlt(s)} <small>m up</small>`, v2: 'PURE OXYGEN STOPS WORKING ABOVE ~13,700 m' })),
    beat('rise', 'UP THERE, LIKE', (t, s) => ({ v: `${atAlt(s)} <small>m up</small>`, v2: `SHE’D HAVE ABOUT ${P.tucS} SECONDS` }), 1),
    beat('sky', 'BLUE LIGHT FROM THE SKY', (t, s) => ({ v: `${Math.round(ATL.zenith(P.air(s)) * 100)}<small>%</small>`, v2: 'OF THIS MORNING’S: AIR SCATTERS IT' })),
    beat('tubs', 'THE HOT TUBS: 39 °C', () => ({ v: `boil below ${P.pvap(P.tubC).toFixed(0)} <small>hPa</small>`, v2: '' }), 0, 0),
    beat('tubs', 'BODY TEMPERATURE: 37 °C', () => ({ v: `boils below ${P.pvap(P.bodyC).toFixed(0)} <small>hPa</small>`, v2: 'THE ARMSTRONG LIMIT (ABOUT 19 km UP)' }), 1),
    beat('sea', 'THE POOL: 28 °C', () => ({ v: `boils below ${P.pvap(P.poolC).toFixed(0)} <small>hPa</small>`, v2: '' }), 0, 0),
    beat('sea', 'THE SEA: 26 °C', () => ({ v: `boils below ${P.pvap(P.seaC).toFixed(0)} <small>hPa</small>`, v2: '' }), 1, 1),
    beat('sea', 'AT 10 m, THE SEA’S WEIGHT', () => ({ v: `${P.seaBar(AT_F.depth).toFixed(2)} <small>bar</small>`, v2: 'WATER AT 26 °C BOILS BELOW 0.03 bar' }), 2),
    beat('last', 'YOUR AIR', (t, s) => ({ v: `tank ${ATK.tankNo(s)} <small>of 6</small>`, v2: `${atN(Math.round(ATK.left(s) / 100) * 100)} LITRES LEFT` })),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const AT_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [atC(id, k0) - 0.1, (k1 != null ? atCap(id, k1).hide : atE(id)) + 0.2, text]; return [
  b('start', 'THE RULE: EVERY MINUTE, 1% OF THE AIR THAT’S LEFT IS GONE · NOTHING ELSE CHANGES', 0, 2),
  b('weight', 'LIKE CLIMBING: THE HEIGHT WHERE A STANDARD SKY IS THIS THIN (ICAO STANDARD ATMOSPHERE)', 2),
  b('ears', 'A BALLOON’S GAS SWELLS AS THE AIR AROUND IT THINS (BOYLE’S LAW)', 1),
  b('fizz', 'CARBON DIOXIDE COMES OUT OF A DRINK FASTER WHEN THE AIR PRESSING ON IT IS THINNER', 1),
  b('marina', 'HOW FAST PEOPLE PASS OUT VARIES A LOT · THESE ARE ROUGH TIMES FOR HEALTHY ADULTS', 1),
  b('under', 'A SCUBA REGULATOR GIVES YOU AIR AT THE PRESSURE AROUND YOU', 1),
  b('shark', 'OCEANIC WHITETIPS LIVE OUT HERE, IN THE OPEN OCEAN, FAR FROM LAND', 1),
  b('rise', 'TIME OF USEFUL CONSCIOUSNESS AT 45,000–50,000 ft: 9 TO 15 SECONDS', 1),
  b('tubs', 'THE ARMSTRONG LIMIT: 63 hPa · ABOVE IT, WATER AT BODY TEMPERATURE BOILS', 1),
  b('last', `${ATP.tanks} TANKS × ${ATP.tankL} L AT ${ATP.tankBar} bar · YOU ${ATP.sac[0]} L/min, HER ${ATP.sac[1]} L/min AT 1 bar, × THE PRESSURE AT 10 m`, 0),
]; })();
// the insets: [from, to, which, where]
const AT_INSETS = (() => { const b = (id, k0, id1, k1, w, where = '') => [atC(id, k0) - 0.25, atCap(id1, k1).hide + 0.3, w, where]; return [
  b('weight', 0, 'weight', 1, 'column'), b('storm', 0, 'storm', 1, 'baro'), b('tanks', 1, 'tanks', 1, 'reg'), b('tanks', 2, 'tanks', 2, 'depth'),
]; })();

// a caption's text with its numbers in amber
function atCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?%|\s?°\s?C)?(?:\s(?:km|metres|metre|seconds|minutes|tonnes|tanks)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class AtHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('at-ro', '<div class="l">AIR LEFT</div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('at-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('at-clock', '<div class="l"></div><div class="v"></div><div class="f"></div><div class="cd"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f'); this.clockC = this.clock.querySelector('.cd');
    this.band = mk('at-band'); this.cap = mk('at-cap'); this.tag = mk('at-tag');
    this.caps = ATT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: atCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('at-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : atStoryAt(t);
    void app;
    // ---- the air left; its pressure; like how high; the next step
    const ra = W(t, AT.title[1] - 0.5, AT.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const a = ATP.air(s), pct = a * 100;
      this._html('rov', this.roV, `${pct >= 99.995 ? '100' : pct.toFixed(pct < 10 ? 2 : 1)}<small>%</small>`);
      this._html('ros', this.roS, `${atN(ATP.hpa(s))} hPa · LIKE <b>${atAlt(s)} m</b> UP`);
      const nx = Math.ceil(ATP.next(s) - 1e-6);
      this._html('ron', this.roN, `NEXT 1% IN ${nx >= 60 ? '1:00' : '0:' + String(nx).padStart(2, '0')}`);
      const tick = s >= -0.05 && (((s % 60) + 60) % 60) < 1.0;
      const compact = t > atE('weight') ? ' compact' : '';
      this._cls('roc', this.ro, 'at-ro' + (tick ? ' tick' : '') + (a < 0.2 ? ' low' : '') + compact);
      this._cls('cxc', this.ctx, 'at-ctx' + compact);
    }
    // ---- the context box
    const cx = AT_CTX.find((x) => t >= x[0] && t < x[1]), inA = (() => { const w = AT_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = AT_TAGS.find((x) => t >= x[0] && t < x[1]);
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the day and the time; a jump
    const ca = W(t, AT.title[1] - 0.5, AT.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = atClockParts(s);
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = AT_JUMPS.filter((x) => t >= x.t && t < x.t + 3.5).pop();
      this._cls('ckj', this.clockF, j ? 'f jump' : 'f');
      const jl = j ? '+' + (j.ds >= 90 ? Math.round(j.ds / 60) + ' MIN' : Math.round(j.ds) + ' s') : '';
      this._txt('ckf', this.clockF, jl ? jl + ' LATER' : 'REAL SPEED');
      // the two deadlines: the sea boiling (from the first caption; it drops at every jump), and, once you are under, your air
      const hms = (x) => { x = Math.max(0, Math.floor(x)); return `${Math.floor(x / 3600)}:${String(Math.floor(x / 60) % 60).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
      const L = [];
      if (t >= atC('start', 0) - 0.2) L.push(s < ATE.sea ? `THE SEA BOILS IN <b>${hms(ATE.sea - s)}</b>` : '<span class="hot">THE SEA IS BOILING</span>');
      if (t >= atC('under', 1) - 0.2) L.push(`YOUR AIR RUNS OUT IN <b>${hms(ATK.out - s)}</b>`);
      this._html('ckc', this.clockC, L.map((x) => `<div>${x}</div>`).join(''));
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = ATT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'at-cap q' : 'at-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    const two = cp && this.root.clientHeight ? this.cap.offsetHeight / this.root.clientHeight > 0.095 : false;
    this._set('tga', this.tag, 'opacity', tg && !two ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagrams
    this._insets(t, s, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene (the side is chosen from this frame's measured width: measure first, then place)
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'at-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = AtHud._p || (AtHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam || !(l.a > 0)) { d.style.opacity = '0'; return; }
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      const lx = MathX.clamp((_p.x * 0.5 + 0.5) * 100, 3, 97), ly = (-_p.y * 0.5 + 0.5) * 100;
      if (d._tx !== tx) { d._tx = tx; d.className = 'at-lab'; d.innerHTML = '<span class="d"></span>' + tx; d._w = d.offsetWidth; }
      let right = l.side ? l.side === 'r' : lx > 62;
      const wPct = this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      const ty = Math.min(74, Math.max(ly, 28));   // (28%: clear of the boxes at the top)
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      let op = vis ? (l.a ?? 1) : 0;
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) op = 0; }
      d.style.opacity = String(op);
      const hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx, cl = right ? 'at-lab r' : 'at-lab';
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
      if (d.className !== cl) d.className = cl;
    });
  }

  _insets(t, s, set) {
    const W = StoryHUD.win, which = AT_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'at-inset' : ('at-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(s * 4);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = AtHud[which[2]](u, t, s, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="atAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker>
    <linearGradient id="atSkyG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#05070d"/><stop offset="0.6" stop-color="#2a5fa8"/><stop offset="1" stop-color="#8fc0ec"/></linearGradient>
    <linearGradient id="atSeaG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a8cc0"/><stop offset="1" stop-color="#06304e"/></linearGradient></defs>${body}</svg>`; }
  static plate(a = 0.86, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // a line of text that always fits: past maxW (its width estimated from the class's capitals) its font shrinks to fit
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  // the air over one square metre of deck: a column to space, 10.3 tonnes; then the same push from every side
  static column(u) {
    const T = AtHud.tx, a = MathX.smooth(u, 0.2, 1.0), b = MathX.smooth(u, 2.0, 2.8), c = MathX.smooth(u, 6.2, 7.0), X = 120, Y0 = 410;
    const arrows = [[-1, 0], [1, 0], [0, -1], [-0.7, -0.7], [0.7, -0.7]].map(([dx, dy]) => { const cx = 560, cy = 300, x1 = cx + dx * 150, y1 = cy + dy * 150, x2 = cx + dx * 62, y2 = cy + dy * 62; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffcf8a" stroke-width="7" marker-end="url(#atAh)"/>`; }).join('');
    return AtHud.svg(`${AtHud.plate()}${T(30, 56, 't', 'THE AIR OVER ONE SQUARE METRE')}
      <g opacity="${a.toFixed(2)}"><rect x="${X}" y="90" width="110" height="${Y0 - 90}" fill="url(#atSkyG)" opacity="0.95"/><rect x="${X - 30}" y="${Y0}" width="170" height="14" fill="#c9a06a"/>
        ${T(X - 10, 82, 'sm', 'TO SPACE', 200)}${T(X + 8, Y0 + 46, 'sm', '1 m × 1 m', 200)}</g>
      <g opacity="${b.toFixed(2)}">${T(X + 140, 210, 'b', `${ATP.tonnes.toFixed(1)} TONNES`, 300)}${T(X + 140, 250, 's', 'ABOUT 7 CARS’ WEIGHT', 300)}</g>
      <g opacity="${c.toFixed(2)}"><circle cx="560" cy="268" r="20" fill="#f6efe2"/><rect x="540" y="292" width="40" height="80" rx="16" fill="#f6efe2"/>${arrows}${T(470, 120, 's', 'FROM EVERY SIDE', 280)}</g>`);
  }
  // the ship's barometer: the needle falls past the lowest a storm has ever pushed it (Typhoon Tip, 1979)
  static baro(u, t, s) {
    const T = AtHud.tx, cx = 380, cy = 300, R = 190, lo = 850, hi = 1050, A = (p) => (-210 + 240 * (p - lo) / (hi - lo)) * Math.PI / 180;
    const pt = (p, r) => [cx + Math.cos(A(p)) * r, cy + Math.sin(A(p)) * r];
    const ticks = []; for (let p = lo; p <= hi; p += 10) { const [x1, y1] = pt(p, R), [x2, y2] = pt(p, p % 50 ? R - 14 : R - 26); ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#cfd6de" stroke-width="${p % 50 ? 2 : 4}"/>`); if (!(p % 50)) { const [x, y] = pt(p, R - 54); ticks.push(`<text x="${x.toFixed(1)}" y="${(y + 9).toFixed(1)}" class="sm" text-anchor="middle">${p}</text>`); } }
    const hp = Math.max(lo - 20, ATP.hpa(s)), [nx, ny] = pt(Math.max(hp, lo - 12), R - 30), [tx, ty] = pt(ATP.tip, R + 4), [tx2, ty2] = pt(ATP.tip, R - 30), [nx0, ny0] = pt(ATP.p0, R + 4);
    const below = ATP.hpa(s) < ATP.tip;
    return AtHud.svg(`${AtHud.plate()}${T(30, 56, 't', 'THE SHIP’S BAROMETER')}
      <path d="M ${pt(lo, R)[0]} ${pt(lo, R)[1]} A ${R} ${R} 0 0 1 ${pt(hi, R)[0]} ${pt(hi, R)[1]}" fill="none" stroke="#5a6470" stroke-width="3"/>${ticks.join('')}
      <line x1="${tx}" y1="${ty}" x2="${tx2}" y2="${ty2}" stroke="#ff6a4a" stroke-width="6"/>
      <circle cx="${nx0}" cy="${ny0}" r="7" fill="#9fd0ff"/>
      ${T(30, 452, 'sm', '<tspan fill="#9fd0ff">●</tspan> A NORMAL DAY · 1013 &#160;&#160; <tspan fill="#ff6a4a">▌</tspan> TYPHOON TIP, 1979 · 870', 700)}
      <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${below ? '#ffcf8a' : '#ffffff'}" stroke-width="6" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="12" fill="#ffffff"/>
      ${T(cx - 70, cy + 70, 'b', `${Math.round(ATP.hpa(s))} hPa`, 220)}${below ? T(cx - 150, cy + 108, 's', 'LOWER THAN ANY STORM', 320) : ''}`);
  }
  // the regulator: it gives you air at the pressure round you (up here: thin; at 10 m: the sea's weight + the air's)
  static reg(u, t, s) {
    const T = AtHud.tx, a = MathX.smooth(u, 0.2, 0.9), b = MathX.smooth(u, 1.6, 2.4), up = ATP.hpa(s) / 1000, dn = ATP.seaBar(AT_F.depth) + up;
    const bar = (x, v, col, l1, l2, op) => `<g opacity="${op.toFixed(2)}"><rect x="${x}" y="${400 - v * 170}" width="120" height="${v * 170}" rx="6" fill="${col}"/>${T(x - 6, 400 - v * 170 - 16, 'b', v.toFixed(2) + ' bar', 200)}${T(x - 6, 440, 's', l1, 230)}${T(x - 6, 464, 'sm', l2, 230)}</g>`;
    return AtHud.svg(`${AtHud.plate()}${T(30, 56, 't', 'WHAT A SCUBA TANK GIVES YOU')}${T(30, 96, 'sm', 'AIR AT THE PRESSURE AROUND YOU', 700)}
      <line x1="40" y1="400" x2="720" y2="400" stroke="#9aa" stroke-width="2"/>
      ${bar(90, 1.013, '#5a6470', 'AT 10:00 AM', 'ON DECK', a)}${bar(330, up, '#ffcf8a', 'NOW, ON DECK', 'NOT ENOUGH', a)}${bar(570, dn, '#4ab0e0', 'NOW, AT 10 m', 'SEA + AIR', b)}`);
  }
  // 10 m of sea weighs as much as the whole sky
  static depth(u) {
    const T = AtHud.tx, a = MathX.smooth(u, 0.2, 0.9), b = MathX.smooth(u, 1.4, 2.2), c = MathX.smooth(u, 3.2, 4.0);
    return AtHud.svg(`${AtHud.plate()}${T(30, 56, 't', 'PRESSING ON ONE SQUARE METRE')}
      <g opacity="${a.toFixed(2)}"><rect x="110" y="100" width="150" height="290" fill="url(#atSkyG)"/>${T(80, 430, 's', 'ALL OF THE SKY', 240)}${T(110, 462, 'sm', `${ATP.tonnes.toFixed(1)} t`, 200)}</g>
      <g opacity="${b.toFixed(2)}"><rect x="460" y="100" width="150" height="290" fill="url(#atSeaG)"/>${T(440, 430, 's', `${ATP.oneAtmDepth.toFixed(0)} m OF SEA`, 240)}${T(460, 462, 'sm', `${(ATP.rhoSea * ATP.oneAtmDepth / 1000).toFixed(1)} t`, 200)}</g>
      <g opacity="${c.toFixed(2)}">${T(318, 260, 'b', '=', 60)}</g>`);
  }
}
