/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the long-form films' (Slower light, Friction 10 s, Magnets 1,000×):
     top left     VISIBLE LIGHT: NONE (since 2:40:00 PM); what the picture is: a heat camera nobody has, or what you see
     top right    the day and the time; REAL SPEED, or "+40 s" when the clock jumps at a cut (it only runs forward)
     under them   the scene's context box (the number this scene is about)
     right edge   the heat camera's scale (−24 °C black … +12 °C white), in the heat shots only
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       light by wavelength (the eyes' band gone; your skin's glow); sunlight's energy; ice thickness
     bottom left  the honest labels (what is impossible, what is rough)
     in the scene labels the set pins to things (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

const nlClockStr = (s, ms = true) => { const c = nlClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}${ms ? '.' + String(c.ms).padStart(3, '0') : ''}`; };
const nlN = (x) => Math.round(x).toLocaleString('en-US');
const nlMMSS = (x) => { x = Math.max(0, x); return `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`; };
// your speed (km/h): gliding, then sliding after the fall, then still
function nlYouKmh(s) { const P = NLP, E = NLE; if (s < E.fall) return (P.v0 - P.glide * Math.max(0, s)) * 3.6; if (s < E.rest) { const v = P.v0 - P.glide * E.fall, u = (s - E.fall) / (E.rest - E.fall); return v * (1 - u) * 3.6; } return 0; }
const nlArms = (s) => nlMMSS(60 * NLP.coldMin[1] - NLD.inWater(s));     // the 1-10-1 rule's ten minutes, counting down
const nlHeadToDriver = (s) => NLY.dist(s) - NLY.head - NLY.dDriver;
const nlHeadToEdge = (s) => NLY.dist(s) - NLY.head - NLV.holeR(s);
// the scene's context box: [from, to, label, value(t, s, set) → { v, v2 }] (HTML)
const NL_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [nlC(id, k0) - 0.2, (k1 != null ? nlCap(id, k1).hide : nlE(id)) + 0.2, l, f];
  const youRoad = Math.hypot(NLV.car0[0] - NLY.y1[0], NLV.car0[1] - NLY.y1[1]);
  return [
    beat('skaters', 'YOUR SPEED', (t, s) => ({ v: `${nlYouKmh(s).toFixed(0)} <small>km/h</small>`, v2: 'EYES OPEN · SEEING NOTHING' })),
    beat('count', 'ON THE ICE', () => ({ v: `${NLP.skaters} <small>people</small>`, v2: `AIR −12 °C · NEAREST SHORE ${Math.round((NLY.y1[1] - nlShoreZ(NLY.y1[0])) / 10) * 10} m` })),
    beat('sun', 'THE SUN', (t, s) => ({ v: `${NLP.sunAlt(s).toFixed(1)}° <small>up</small>`, v2: `SETS IN ${Math.ceil((NLP.sunsetS - s) / 60)} min · NOBODY WILL SEE IT` }), 1),
    beat('fire', 'THE BONFIRE', () => ({ v: `${NLP.fireC} <small>°C</small>`, v2: 'LIGHT FROM IT: NONE' })),
    beat('road', 'FROM THE ROAD TO YOU', () => ({ v: `${Math.round(youRoad / 10) * 10} <small>m</small>`, v2: `SOUND IN −12 °C AIR: ${Math.round(NLP.sound)} m/s` })),
    beat('steam', 'OPEN WATER', () => ({ v: '0 <small>°C</small>', v2: 'THE AIR: −12 °C · THE SNOW: −14 °C' })),
    beat('world', 'PEOPLE WHO CAN SEE', () => ({ v: '0', v2: 'OF 8.2 BILLION' }), 0, 1),
    beat('plane', 'THE PLANE', (t, s) => { const A = NLA.at(s); return { v: `${Math.round(A.y)} <small>m up</small>`, v2: `${(A.y / Math.tan(NLP.plane.glide * Math.PI / 180) / 1000).toFixed(1)} km FROM ITS RUNWAY` }; }),
    beat('water', 'HE’S BEEN IN THE WATER', (t, s) => ({ v: nlMMSS(NLD.inWater(s)), v2: `HIS ARMS GIVE OUT IN ABOUT ${nlArms(s)}` }), 1),
    beat('crawl', 'TO HIM', (t, s) => ({ v: `${Math.max(0, nlHeadToDriver(s)).toFixed(1)} <small>m</small>`, v2: `IN THE WATER ${nlMMSS(NLD.inWater(s))} · ARMS: ABOUT ${nlArms(s)} LEFT` }), 1),
    beat('edge', 'TO THE EDGE', (t, s) => ({ v: `${Math.max(0, nlHeadToEdge(s)).toFixed(1)} <small>m</small>`, v2: `IN THE WATER ${nlMMSS(NLD.inWater(s))} · ARMS: ABOUT ${nlArms(s)} LEFT` }), 1),
    beat('reach', 'TO THE EDGE', (t, s) => ({ v: `${Math.max(0, nlHeadToEdge(s)).toFixed(1)} <small>m</small>`, v2: `IN THE WATER ${nlMMSS(NLD.inWater(s))} · ARMS: ABOUT ${nlArms(s)} LEFT` })),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const NL_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [nlC(id, k0) - 0.1, (k1 != null ? nlCap(id, k1).hide : nlE(id)) + 0.2, text]; return [
  b('start', 'THE RULE: ONLY VISIBLE LIGHT (380–750 nm) STOPS EXISTING · EVERY OTHER KIND STILL WORKS', 1),
  b('heat', 'A HEAT CAMERA SEES 8–14 µm · BLACK IS COLD, WHITE IS HOT', 1),
  b('help', 'PHONES STILL WORK: RADIO IS LIGHT TOO, JUST NOT THE KIND EYES USE', 0),
  b('ice', 'ROUGH RULES FOR CLEAR BLACK ICE · SNOW ICE IS WEAKER', 0, 1),
  b('water', 'THE 1-10-1 RULE: 1 MIN TO GET YOUR BREATH · ~10 MIN OF MOVEMENT · ~1 HOUR TO HYPOTHERMIA', 2),
  b('crawl', 'ON THIN ICE THE ADVICE IS: LIE FLAT, SPREAD YOUR WEIGHT', 0),
]; })();
// the insets: [from, to, which, where]
const NL_INSETS = (() => { const b = (id, k0, id1, k1, w, where = '') => [nlC(id, k0) - 0.25, nlCap(id1, k1).hide + 0.3, w, where]; return [
  b('rule', 2, 'body', 0, 'spectrum'), b('sun', 0, 'sun', 0, 'sunbar'), b('ice', 0, 'ice', 1, 'ice'),
]; })();

// a caption's text with its numbers in amber
function nlCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?°\s?C|°)?(?:\s(?:billion|million|metres|metre|seconds|second|minutes|minute|times|km\/h|km|cm|m\/s|m|nanometres|micrometres|degrees)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class NlHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('nl-ro', '<div class="l">VISIBLE LIGHT</div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('nl-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('nl-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.scale = mk('nl-scale', '<div class="h">+12 °C</div><div class="bar"></div><div class="c">−24 °C</div>');
    this.band = mk('nl-band'); this.cap = mk('nl-cap'); this.tag = mk('nl-tag');
    this.caps = NLT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: nlCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('nl-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : nlStoryAt(t);
    void app;
    const dark = shot && NL_DARK.has(shot.mode), heatView = shot && !dark && shot.mode !== 'title';
    // ---- visible light: none; what the picture is
    const ra = W(t, NL.title[1] - 0.5, NL.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._html('rov', this.roV, s < 0 ? 'ON' : 'NONE');
      this._html('ron', this.roN, s < 0 ? '' : dark ? 'ON SCREEN: WHAT YOU SEE' : 'ON SCREEN: A HEAT CAMERA · NOBODY HAS ONE');
      const cp0 = t > nlE('body') ? ' compact' : '';
      this._html('ros', this.roS, s < 0 || cp0 ? '' : '380–750 nm · GONE SINCE <b>2:40:00 PM</b>');
      this._cls('roc', this.ro, (s < 0 ? 'nl-ro' : dark ? 'nl-ro dark black' : 'nl-ro dark') + cp0);
      this._cls('cxc', this.ctx, 'nl-ctx' + cp0);
    }
    // ---- the heat camera's scale
    const inA0 = (() => { const w = NL_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    this._set('sca', this.scale, 'opacity', heatView ? (0.9 * (1 - inA0) * W(t, NL.title[1] - 0.2, NL.end + 1, 0.4, 0.5)).toFixed(3) : '0');
    // ---- the context box
    const cx = NL_CTX.find((x) => t >= x[0] && t < x[1]), inA = (() => { const w = NL_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = NL_TAGS.find((x) => t >= x[0] && t < x[1]);
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the day and the time; a jump
    const ca = W(t, NL.title[1] - 0.5, NL.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = nlClockParts(s);
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = NL_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 90 ? (Math.round(j.ds / 60 * 10) / 10) + ' min' : Math.round(j.ds) + ' s') : '';
      this._txt('ckf', this.clockF, jl ? jl + '  ·  REAL SPEED' : 'REAL SPEED');
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = NLT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'nl-cap q' : 'nl-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    const two = cp && this.root.clientHeight ? this.cap.offsetHeight / this.root.clientHeight > 0.095 : false;
    this._set('tga', this.tag, 'opacity', tg && !two ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagrams
    this._insets(t, s, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene (the side is chosen from this frame's measured width: measure first, then place)
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'nl-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = NlHud._p || (NlHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam || !(l.a > 0)) { d.style.opacity = '0'; return; }
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      const lx = MathX.clamp((_p.x * 0.5 + 0.5) * 100, 3, 97), ly = (-_p.y * 0.5 + 0.5) * 100;
      if (d._tx !== tx) { d._tx = tx; d.className = 'nl-lab'; d.innerHTML = '<span class="d"></span>' + tx; d._w = d.offsetWidth; }
      let right = l.side ? l.side === 'r' : lx > 62;
      const wPct = this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      const ty = Math.min(74, Math.max(ly, 24));   // (24%: clear of the clock box)
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      let op = vis ? (l.a ?? 1) : 0;
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) op = 0; }
      d.style.opacity = String(op);
      const hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx, cl = right ? 'nl-lab r' : 'nl-lab';
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
      if (d.className !== cl) d.className = cl;
    });
  }

  _insets(t, s, set) {
    const W = StoryHUD.win, which = NL_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'nl-inset' : ('nl-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(s * 20);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = NlHud[which[2]](u, t, s, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="nlAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker>
    <linearGradient id="nlVis" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7a3cff"/><stop offset="0.2" stop-color="#2a5cff"/><stop offset="0.38" stop-color="#22c0e0"/><stop offset="0.5" stop-color="#3ad04a"/><stop offset="0.66" stop-color="#f0e030"/><stop offset="0.8" stop-color="#ff9a20"/><stop offset="1" stop-color="#e82a1a"/></linearGradient></defs>${body}</svg>`; }
  static plate(a = 0.86, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // a line of text that always fits: past maxW (its width estimated from the class's capitals) its font shrinks to fit
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  // light by wavelength (log scale, 0.1…100 µm): the eyes' band, struck out; the Sun's light (most of it still
  // arrives); your skin's glow, peaking at 9.5 µm; the heat camera's band
  static spectrum(u) {
    const T = NlHud.tx, X0 = 50, X1 = 720, lo = Math.log10(0.1), hi = Math.log10(100), X = (um) => X0 + (X1 - X0) * (Math.log10(um) - lo) / (hi - lo), Y0 = 360;
    const a1 = MathX.smooth(u, 0.2, 1.0), a2 = MathX.smooth(u, 1.6, 2.4), a3 = MathX.smooth(u, 6.0, 7.0), a4 = MathX.smooth(u, 8.0, 9.0);
    // Planck curves, normalised to their own peaks (x in µm)
    const planck = (um, K) => { const l = um * 1e-6, c2 = 0.014388; return 1 / (Math.pow(l, 5) * (Math.exp(c2 / (l * K)) - 1)); };
    const curve = (K, peak, h, x0, x1) => { const pk = planck(peak, K); let d = ''; for (let i = 0; i <= 120; i++) { const um = Math.pow(10, Math.log10(x0) + (Math.log10(x1) - Math.log10(x0)) * i / 120), y = Y0 - h * planck(um, K) / pk; d += (i ? 'L' : 'M') + X(um).toFixed(1) + ' ' + y.toFixed(1); } return d; };
    const ticks = [[0.1, '0.1 µm'], [1, '1 µm'], [10, '10 µm'], [100, '100 µm']].map(([v, l]) => `<line x1="${X(v)}" y1="${Y0}" x2="${X(v)}" y2="${Y0 + 10}" stroke="#9aa" stroke-width="2"/>${T(X(v) - 34, Y0 + 40, 'sm', l, 120)}`).join('');
    const v0 = X(NLP.band[0] / 1000), v1 = X(NLP.band[1] / 1000);
    return NlHud.svg(`${NlHud.plate()}${T(30, 56, 't', 'LIGHT, BY WAVELENGTH')}
      <line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#9aa" stroke-width="2"/>${ticks}
      <path d="${curve(5772, 0.5, 190, 0.2, 5)}" fill="none" stroke="#ffe7a8" stroke-width="4" opacity="${(0.9 * a1).toFixed(2)}"/>
      <g opacity="${a1.toFixed(2)}">${T(X(0.105), Y0 - 120, 'sm', 'THE SUN', 160)}</g>
      <rect x="${v0.toFixed(1)}" y="${Y0 - 230}" width="${(v1 - v0).toFixed(1)}" height="230" fill="url(#nlVis)" opacity="${(0.55 * (1 - 0.75 * a2)).toFixed(2)}"/>
      <g opacity="${a2.toFixed(2)}"><line x1="${v0 - 6}" y1="${Y0 - 236}" x2="${v1 + 6}" y2="${Y0 + 4}" stroke="#ff6a4a" stroke-width="5"/><line x1="${v1 + 6}" y1="${Y0 - 236}" x2="${v0 - 6}" y2="${Y0 + 4}" stroke="#ff6a4a" stroke-width="5"/>
        ${T(v0 - 6, Y0 - 248, 's', 'EYES: 380–750 nm · GONE', 330)}</g>
      <g opacity="${a3.toFixed(2)}"><path d="${curve(306, NLP.peakUm, 150, 2.5, 80)}" fill="none" stroke="#ff9a7a" stroke-width="4"/>
        <line x1="${X(NLP.peakUm)}" y1="${Y0 - 150}" x2="${X(NLP.peakUm)}" y2="${Y0}" stroke="#ff9a7a" stroke-width="2" stroke-dasharray="6 5"/>${T(X(NLP.peakUm) - 70, Y0 - 166, 's', 'YOUR SKIN: 9.5 µm', 260)}</g>
      <g opacity="${a4.toFixed(2)}"><rect x="${X(8)}" y="${Y0 + 52}" width="${X(14) - X(8)}" height="14" rx="4" fill="#d8dde4"/>${T(X(8) - 150, Y0 + 92, 'sm', 'A HEAT CAMERA SEES 8–14 µm', 330)}</g>`);
  }
  // sunlight's energy at the ground: ultraviolet, visible (gone), infrared (still here)
  static sunbar(u) {
    const T = NlHud.tx, a = MathX.smooth(u, 0.3, 1.0), b = MathX.smooth(u, 1.6, 2.4), uv = 0.03, vis = NLP.sunVisible, ir = 1 - uv - vis, X0 = 40, Wd = 680, Y = 190;
    const x1 = X0 + Wd * uv, x2 = x1 + Wd * vis;
    return NlHud.svg(`${NlHud.plate()}${T(30, 56, 't', 'SUNLIGHT REACHING THE GROUND')}
      <g opacity="${a.toFixed(2)}"><rect x="${X0}" y="${Y}" width="${Wd * uv}" height="80" fill="#8a7aff"/><rect x="${x1}" y="${Y}" width="${Wd * vis}" height="80" fill="url(#nlVis)"/><rect x="${x2}" y="${Y}" width="${Wd * ir}" height="80" fill="#c0503a"/>
        ${T(x1 + 10, Y - 18, 's', `VISIBLE ${Math.round(vis * 100)}%`, 300)}${T(x2 + 10, Y - 18, 's', `INFRARED ${Math.round(ir * 100)}%`, 300)}</g>
      <g opacity="${b.toFixed(2)}"><rect x="${x1}" y="${Y}" width="${Wd * vis}" height="80" fill="rgba(6,9,14,0.82)"/><line x1="${x1}" y1="${Y + 40}" x2="${x2}" y2="${Y + 40}" stroke="#ff6a4a" stroke-width="5"/>
        ${T(x1 + 10, Y + 130, 'b', 'GONE', 300)}${T(x2 + 10, Y + 130, 'b', 'STILL HERE: YOU FEEL IT', 330)}${T(X0, Y + 200, 'sm', 'ULTRAVIOLET ' + Math.round(uv * 100) + '% · VALUES ROUGH, FOR A LOW SUN', 680)}</g>`);
  }
  // clear ice: how thick for a person, for a car, and what is by the stream (to scale)
  static ice(u) {
    const T = NlHud.tx, P = NLP, k = 8, base = 236, a = MathX.smooth(u, 0.2, 0.9), b = MathX.smooth(u, 0.9, 1.6), c = MathX.smooth(u, 5.6, 6.4);
    const slab = (x, cm, col, lab, sub, op) => `<g opacity="${op.toFixed(2)}"><rect x="${x}" y="${base - 6}" width="190" height="${cm * k}" rx="4" fill="${col}"/><rect x="${x}" y="${base - 6 + cm * k}" width="190" height="${Math.max(6, 120 - cm * k)}" fill="#0d2233"/>
      ${T(x, base - 64, 'b', lab, 190)}${T(x, base - 26, 's', sub, 190)}</g>`;
    return NlHud.svg(`${NlHud.plate()}${T(30, 56, 't', 'CLEAR ICE, TO SCALE')}
      <line x1="30" y1="${base - 6}" x2="730" y2="${base - 6}" stroke="#9aa" stroke-width="2" stroke-dasharray="6 6"/>
      ${slab(40, P.icePerson, '#cfe3f2', 'A PERSON', `${P.icePerson} cm`, a)}${slab(285, P.iceCar, '#cfe3f2', 'A CAR', `${P.iceCar} cm`, b)}${slab(530, P.iceInlet, '#ffcf8a', 'BY THE STREAM', `${P.iceInlet} cm`, c)}`);
  }
}
