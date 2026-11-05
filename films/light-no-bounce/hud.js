/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / Air solid / Light faster films':
     top left     LIGHT BOUNCING: 100% or 0%; while it's off, how long until it's back (to the hundredth); the next
                  thing due ("NEXT · 3:30:01.24 · THE MOON GOES OUT"); at 4:42 PM, Saturn's ten seconds
     top right    Saturday and the time (to the millisecond in the slow part); 39× SLOWER or REAL SPEED; "+2 min" when
                  the clock jumps at a cut (it only ever runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       the Moon's light on its way; why the sky is blue; the electron; 300 m blind; a fibre; the cables; the
                  heat; your pupil; Saturn's light on its way (while one is up, the context box steps aside)
     bottom left  the honest labels (what is impossible, what is rough)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// what's due next (story s, label)
const NB_NEXT = [
  [0, 'LIGHT STOPS BOUNCING'], [NBP.moonS, 'THE MOON GOES OUT'], [NBP.T, 'LIGHT BOUNCES AGAIN'], [NBP.T + NBP.moonS, 'THE MOON COMES BACK'],
  [NBP.sEcho, 'SATURN GOES OUT'],
];
const nbClockStr = (s, ms = true) => { const c = nbClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}${ms ? '.' + String(c.ms).padStart(3, '0').slice(0, 2) : ''}`; };
const nbN = (x) => Math.round(x).toLocaleString('en-US');
// the scene's context box: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const NB_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [nbC(id, k0) - 0.2, (k1 != null ? nbCap(id, k1).hide : nbE(id)) + 0.2, l, f];
  return [
    beat('moon', 'THE MOON’S LAST LIGHT ARRIVES', (t, s) => ({ v: s < NBP.moonS ? `IN ${(NBP.moonS - s).toFixed(2)} <small>s</small>` : 'NOW', v2: `${nbN(NBP.moonKm)} km TODAY = ${NBP.moonS.toFixed(2)} LIGHT-SECONDS` }), 1),
    beat('sky', 'BLUE LIGHT BOUNCES OFF AIR', (t, s) => ({ v: `${NBP.rayleigh.toFixed(1)}× <small>more than red</small>`, v2: 'NOW: NEITHER' }), 1),
    beat('sun', `THE SUN, ${NBP.sunAlt.toFixed(1)}° UP`, (t, s) => ({ v: '3–10× <small>brighter</small>', v2: `ITS LIGHT CROSSES ≈ ${NBP.airMass}× MORE AIR THAN OVERHEAD` })),
    beat('crowd', 'PEOPLE AT THE FAIR', (t, s) => ({ v: '400', v2: 'YOU CAN SEE: 0' })),
    beat('road', 'DRIVERS WHO CAN’T SEE THE ROAD', (t, s) => ({ v: `${Math.round(NBP.driversNow / 1e6)} <small>million</small>`, v2: `BLIND SO FAR AT 110 km/h: ${Math.round(NBP.motorway * Math.max(0, s))} m` }), 1),
    beat('plane', 'THE PLANE', (t, s, set) => { const V = set && set.V; if (!V) return { v: '', v2: '' }; const p = V.planePos(s); return { v: `${nbN((p[1] - NB_F.runway.y) * 3.281)} <small>ft</small>`, v2: `${(Math.max(0, p[0] - V.PL.xTD) / 1000).toFixed(1)} km TO TOUCHDOWN · 136 knots` }; }),
    beat('coaster', 'THE TRAIN', (t, s, set) => ({ v: set && set.co ? `${Math.round(set.co.speed(s) * 3.6)} <small>km/h</small>` : '', v2: 'NOBODY IS STEERING IT: IT RUNS ON RAILS' })),
    beat('net', 'TRAFFIC BETWEEN CONTINENTS', (t, s) => ({ v: '≈ 0<small>% left</small>', v2: 'UNDERSEA CABLES AND SATELLITE LINKS: DARK' }), 2),
    beat('heat', 'EXTRA ENERGY SOAKED UP SO FAR', (t, s) => ({ v: `${(NBP.extraJ * MathX.clamp(s / NBP.T, 0, 1) / 1e17).toFixed(2)} × 10<sup>17</sup> <small>J</small>`, v2: `≈ ${nbN(NBP.bombs * MathX.clamp(s / NBP.T, 0, 1))} ATOMIC BOMBS · BY 3:30:10: ${nbN(Math.round(NBP.bombs / 100) * 100)}` }), 0),
    beat('saturn', 'SATURN’S LIGHT LEFT IT', (t, s) => ({ v: `${Math.round(NBP.saturnS / 60)} <small>minutes ago</small>`, v2: `IT GOES OUT AT ${nbClockStr(NBP.sEcho, false)} PM` }), 1),
    beat('pupils', 'YOUR PUPILS', (t, s) => ({ v: `${NBP.pupil(s).toFixed(1)} <small>mm</small>`, v2: `${NBP.pupilGain(s).toFixed(1)}× THE LIGHT GETS IN` })),
    beat('crash', 'BLIND, AT 110 km/h', (t, s) => ({ v: `${Math.round(NBP.blindM)} <small>m</small>`, v2: '10 SECONDS' })),
    beat('echo', 'SATURN', (t, s) => (s < NBP.sEcho ? { v: `GOES OUT IN ${(NBP.sEcho - s).toFixed(1)} <small>s</small>`, v2: 'ITS LIGHT FROM 3:30:00 IS DUE' } : { v: 'GONE', v2: 'NOTHING BOUNCED OFF IT AT 3:30' }), 1),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const NB_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [nbC(id, k0) - 0.1, (k1 != null ? nbCap(id, k1).hide : nbE(id)) + 0.2, text]; return [
  b('sun', 'APPROX.: AIR AND HAZE SCATTER AWAY 70–95% OF THE LOW SUN’S LIGHT', 0),
  b('hands', 'OLED SCREENS MAKE THEIR OWN LIGHT · LCDS BOUNCE A BACKLIGHT: DARK', 1),
  b('real', 'THE ONE IMPOSSIBLE THING: BOUNCING STOPS; BENDING AND ABSORBING DON’T', 1),
  b('road', 'APPROX.: 1.45 BILLION CARS ON EARTH, ABOUT 4% MOVING AT ANY MOMENT', 0, 1),
  b('road', 'A HEADLIGHT IS A BULB IN A MIRROR: NOW A BARE BULB · RADAR IS BLIND', 2),
  b('plane', 'ITS TRANSPONDER SENDS ITS OWN SIGNAL: THE TOWER STILL SEES THE PLANE', 2),
  b('net', 'ABOUT 99% OF DATA BETWEEN CONTINENTS GOES THROUGH UNDERSEA FIBRE', 2),
  b('space', 'APPROX.: FROM ORBIT, MUCH OF A CITY’S GLOW IS BOUNCED OFF ITS STREETS', 1),
  b('closer', 'SOUND STILL BOUNCES: ONLY LIGHT HAS STOPPED', 1),
  b('heat', 'ALBEDO 0.30 × 1361 W/m² × πR² × 10 s = 5.2 × 10¹⁷ J · HIROSHIMA ≈ 63 TJ', 1),
  b('pupils', 'APPROX.: PUPILS OPEN IN SECONDS; FULL DARK ADAPTATION TAKES 20–30 MIN', 0),
]; })();
// the insets: [from, to, which, where]
const NB_INSETS = (() => { const b = (id, k0, k1, w, where = '') => [nbC(id, k0) - 0.25, (k1 != null ? nbCap(id, k1).hide : nbE(id)) + 0.3, w, where]; return [
  b('moon', 1, null, 'moonlt', 'mid'), b('sky', 1, null, 'rayleigh'), b('real', 1, null, 'electron', 'mid'),
  b('road', 3, null, 'blind', 'mid'), b('net', 1, 1, 'fibre', 'mid'), b('net', 2, 2, 'cables', 'mid'),
  b('heat', 1, 1, 'heat', 'mid'), b('pupils', 0, 0, 'pupil'), b('saturn', 1, 1, 'saturnlt', 'mid'),
]; })();

// a caption's text with its numbers in amber
function nbCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/×?[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?°C|\s?%|\s(?:million|thousand|hours|hour|minutes|minute|seconds|second|light-seconds|times|km\/h|m\/s|metres|km|kg|cm|m|s)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class NbHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('nb-ro', '<div class="l">LIGHT BOUNCING</div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('nb-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('nb-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('nb-band'); this.cap = mk('nb-cap'); this.tag = mk('nb-tag');
    this.count = mk('nb-count');
    this.caps = NBT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: nbCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('nb-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : nbStoryAt(t), rate = nbRateAt(t), b = NBP.bounce(s);
    void app;
    // ---- light bouncing: 100% / 0%, the time left, what's next
    const ra = W(t, NB.title[1] - 0.5, NB.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._html('rov', this.roV, b ? '100<small>%</small>' : '0<small>%</small>');
      const left = NBP.T - s;
      this._html('ros', this.roS, s < 0 ? 'AS IT ALWAYS HAS' : s < NBP.T ? `BACK IN <b>${left.toFixed(2)} s</b>` : s < 300 ? 'AGAIN, SINCE 3:30:10 PM' : s < NBP.sEcho ? 'SATURN’S 3:30 LIGHT IS DUE' : s < NBP.sEchoEnd ? 'SATURN: <b>DARK</b>' : '');
      const nx = NB_NEXT.find((x) => x[0] > s + 1e-4);
      this._html('ron', this.roN, nx && s >= 0 && nx[0] - s < 4000 ? `NEXT · ${nbClockStr(nx[0], nx[0] < 100)} · ${nx[1]}` : '');
      this._cls('roc', this.ro, b ? 'nb-ro' : (left < 3.05 ? 'nb-ro dark tick' : 'nb-ro dark'));
    }
    // ---- the context box
    const cx = NB_CTX.find((x) => t >= x[0] && t < x[1]), inA = (() => { const w = NB_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    // (the tag steps aside while a caption runs to two lines: it would touch it)
    const tg = NB_TAGS.find((x) => t >= x[0] && t < x[1]);
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- Saturday and the time; how slowed down, or a jump
    const ca = W(t, NB.title[1] - 0.5, NB.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = nbClockParts(s), ms = rate < 0.9 ? `<small>.${String(c.ms).padStart(3, '0')}</small>` : '';
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small>${ms} <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = NB_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 90 ? Math.round(j.ds / 60) + ' min' : Math.round(j.ds) + ' s') : '';
      const tl = rate < 0.9 ? Math.round(1 / rate) + '× SLOWER' : 'REAL SPEED';
      this._txt('ckf', this.clockF, jl ? jl + '  ·  ' + tl : tl);
    }
    // ---- the last three seconds: the count, big
    { const left = NBP.T - s, on = t >= nbB('count') && s < NBP.T + 0.02;
      this._set('cnta', this.count, 'opacity', on ? '1' : '0');
      if (on) { this._txt('cntv', this.count, left > 0.005 ? String(Math.ceil(left - 1e-6)) : '0'); this._cls('cntc', this.count, left < 0.02 ? 'nb-count hit' : 'nb-count'); } }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = NBT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'nb-cap q' : 'nb-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    const two = cp && this.root.clientHeight ? this.cap.offsetHeight / this.root.clientHeight > 0.095 : false;
    this._set('tga', this.tag, 'opacity', tg && !two ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagrams
    this._insets(t, s, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'nb-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = NbHud._p || (NbHud._p = new THREE.Vector3());
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
      const ty = Math.min(74, Math.max(ly, 24));   // (24%: clear of the clock box)
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) d.style.opacity = '0'; }
      d.className = right ? 'nb-lab r' : 'nb-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  _insets(t, s, set) {
    const W = StoryHUD.win, which = NB_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'nb-inset' : ('nb-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(s * 200);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = NbHud[which[2]](u, t, s, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="nbAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.86, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static cross(x, y, r = 22) { return `<path d="M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}" stroke="#ff6a5a" stroke-width="6" stroke-linecap="round"/>`; }
  // a line of text that always fits: past maxW (its width estimated from the class's capitals) its font shrinks to fit
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  // the Moon's light, on its way: the last of it (bounced before 3:30) still between the Moon and you
  static moonlt(u, t, s) {
    const x0 = 90, x1 = 680, L = x1 - x0, f = MathX.clamp(s / NBP.moonS, 0, 1), T = NbHud.tx;
    let dots = ''; for (let i = 0; i < 26; i++) { const p = (i + 0.5) / 26, ph = (p + (t * 0.04) % (1 / 26)); const x = x1 - ph * L; if (x < x0 || x > x1) continue; if (ph < f) continue;
      dots += `<circle cx="${x.toFixed(1)}" cy="235" r="7" fill="#ffe6b0"/>`; }
    const tail = x1 - f * L;
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', 'MOONLIGHT ON ITS WAY TO YOU')}
      <circle cx="${x0}" cy="235" r="34" fill="#2a5aa8"/><text x="${x0}" y="300" text-anchor="middle" class="sm">EARTH</text>
      <circle cx="${x1}" cy="235" r="20" fill="#d8d4c8"/><text x="${x1}" y="300" text-anchor="middle" class="sm">MOON</text>
      ${dots}<line x1="${tail.toFixed(1)}" y1="190" x2="${tail.toFixed(1)}" y2="280" stroke="#ff6a5a" stroke-width="3" stroke-dasharray="6 6" opacity="${f > 0 && f < 1 ? 1 : 0}"/>
      ${T(30, 380, 's', `${nbN(NBP.moonKm)} km · LIGHT TAKES ${NBP.moonS.toFixed(2)} s`)}
      ${T(30, 430, 'b', s < NBP.moonS ? `LAST LIGHT ARRIVES IN ${(NBP.moonS - Math.max(0, s)).toFixed(2)} s` : 'THE LAST OF IT HAS ARRIVED')}`);
  }
  // Rayleigh: how strongly air scatters each colour (∝ 1/λ⁴)
  static rayleigh(u) {
    const cols = [['#6a3aa0', 410], ['#2a5cff', 460], ['#2aa84a', 530], ['#e8d02a', 580], ['#ff8a1a', 610], ['#e8231a', 660]], a = MathX.smooth(u, 1.2, 2.2), T = NbHud.tx;
    const bars = cols.map(([c, l], i) => { const h = 230 * Math.pow(410 / l, 4); return `<rect x="${80 + i * 105}" y="${390 - h}" width="70" height="${h.toFixed(1)}" rx="6" fill="${c}" opacity="${(1 - 0.75 * a).toFixed(2)}"/><text x="${115 + i * 105}" y="420" text-anchor="middle" class="sm">${l} nm</text>`; }).join('');
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', 'HOW MUCH EACH COLOUR BOUNCES OFF AIR')}${bars}
      ${T(80, 120, 's', 'BLUE ≈ 4× RED: THE SKY IS BLUE', 640, `opacity="${(1 - a).toFixed(2)}"`)}
      ${T(80, 120, 'b', 'NOW: NONE OF THEM. THE SKY IS BLACK', 640, `opacity="${a.toFixed(2)}"`)}`);
  }
  // one electron, shaken by the light: it sends light out sideways (scattering: stopped here) and forwards (bending: kept)
  static electron(u, t) {
    const y = 235 + 16 * Math.sin(t * 9), a = MathX.smooth(u, 0.8, 1.6), b2 = MathX.smooth(u, 2.0, 3.0), T = NbHud.tx;
    let wave = ''; for (let x = 40; x <= 300; x += 4) wave += (x === 40 ? 'M' : 'L') + x + ' ' + (235 + 26 * Math.sin((x - t * 120) / 18)).toFixed(1);
    let fwd = ''; for (let x = 420; x <= 720; x += 4) fwd += (x === 420 ? 'M' : 'L') + x + ' ' + (235 + 26 * Math.sin((x - 30 - t * 120) / 18)).toFixed(1);
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', 'LIGHT SHAKES AN ELECTRON…')}
      <path d="${wave}" fill="none" stroke="#ffcf8a" stroke-width="4"/><circle cx="360" cy="${y.toFixed(1)}" r="16" fill="#9fc4ff"/>
      <g opacity="${a.toFixed(2)}"><line x1="360" y1="200" x2="300" y2="110" stroke="#ffcf8a" stroke-width="4" marker-end="url(#nbAh)"/><line x1="360" y1="270" x2="420" y2="370" stroke="#ffcf8a" stroke-width="4" marker-end="url(#nbAh)"/>
        ${T(420, 112, 's', '…AND IT SENDS LIGHT', 320)}${T(420, 146, 's', 'SIDEWAYS: BOUNCING', 320)}${NbHud.cross(330, 155, 18)}${NbHud.cross(392, 320, 18)}</g>
      <g opacity="${b2.toFixed(2)}"><path d="${fwd}" fill="none" stroke="#9fe0a8" stroke-width="4"/>${T(30, 430, 's', 'AND FORWARDS: BENDING. THAT IS KEPT', 700, 'style="fill:#9fe0a8"')}</g>`);
  }
  // ten seconds blind at 110 km/h: how far so far (story time), and the whole 306 m
  static blind(u, t, s) {
    const f = MathX.clamp(s / NBP.T, 0, 1), x0 = 60, x1 = 700, x = x0 + (x1 - x0) * f, T = NbHud.tx;
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', '10 SECONDS AT 110 km/h')}
      <rect x="${x0}" y="215" width="${x1 - x0}" height="40" rx="8" fill="#2a2d33"/><line x1="${x0}" y1="235" x2="${x1}" y2="235" stroke="#e8e4d8" stroke-width="3" stroke-dasharray="26 18"/>
      <rect x="${x0}" y="215" width="${(x - x0).toFixed(1)}" height="40" rx="8" fill="rgba(216,38,58,0.25)"/>
      <rect x="${(x - 46).toFixed(1)}" y="218" width="46" height="34" rx="8" fill="#d8263a"/>
      <text x="${x0}" y="300" class="sm">3:30:00</text><text x="${x1}" y="300" text-anchor="end" class="sm">3:30:10 · ${Math.round(NBP.blindM)} m</text>
      ${T(30, 390, 'b', `${Math.round(NBP.motorway * s)} m SO FAR, WITH YOUR EYES SHUT`)}
      ${T(30, 436, 'sm', `${(NBP.T - s).toFixed(1)} s OF IT STILL TO GO`)}`);
  }
  // a glass fibre: light kept in by total internal reflection; now it leaks out at the first bounce
  static fibre(u, t) {
    const a = MathX.smooth(u, 1.0, 2.0), T = NbHud.tx; let zz = 'M40 235'; for (let i = 1; i <= 8; i++) zz += ` L${40 + i * 85} ${i % 2 ? 180 : 290}`;
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', 'AN OPTICAL FIBRE')}
      <rect x="30" y="170" width="700" height="130" rx="65" fill="rgba(150,200,255,0.12)" stroke="#9fc4ff" stroke-width="3"/>
      <path d="${zz}" fill="none" stroke="#ffcf8a" stroke-width="5" opacity="${(1 - a).toFixed(2)}"/>
      <g opacity="${a.toFixed(2)}"><path d="M40 235 L125 180 L180 110" fill="none" stroke="#ffcf8a" stroke-width="5" marker-end="url(#nbAh)"/>${NbHud.cross(125, 180, 20)}</g>
      ${T(30, 370, 's', 'LIGHT BOUNCES OFF THE GLASS WALLS, ALL THE WAY')}
      ${T(30, 430, 'b', 'NOW IT ESCAPES AT THE FIRST BOUNCE', 700, `opacity="${a.toFixed(2)}"`)}`);
  }
  // the undersea cables between the continents (a schematic map: blobs, not real coastlines)
  static cables(u) {
    const a = MathX.smooth(u, 0.6, 2.2), land = '#2a3a2a', T = NbHud.tx;
    const conts = [[150, 170, 95, 75], [180, 330, 55, 80], [390, 150, 50, 45], [420, 300, 65, 85], [560, 170, 110, 70], [640, 340, 50, 35]];
    const links = [[200, 170, 380, 150], [200, 180, 540, 175], [230, 310, 400, 290], [380, 160, 560, 170], [440, 290, 600, 200], [600, 200, 640, 330], [240, 160, 610, 150], [190, 300, 640, 340], [400, 160, 420, 280]];
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', 'THE CABLES UNDER THE SEA (A SKETCH)')}
      ${conts.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${land}"/>`).join('')}
      ${links.map(([x0, y0, x1, y1]) => `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 50} ${x1} ${y1}" fill="none" stroke="${a > 0.5 ? '#3a3f46' : '#6ad0ff'}" stroke-width="4" opacity="${(1 - 0.5 * a).toFixed(2)}"/>`).join('')}
      ${T(30, 430, 's', `ABOUT 600 OF THEM · ${a > 0.5 ? 'ALL DARK' : '99% OF THE TRAFFIC'}`)}`);
  }
  // the heat: the 30% of sunlight Earth always bounced back to space, absorbed for ten seconds (each dot: 100 bombs)
  static heat(u, t, s) {
    const f = MathX.clamp(s / NBP.T, 0, 1), all = Math.round(NBP.bombs / 100), shown = Math.round(all * f), T = NbHud.tx;
    let icons = ''; for (let i = 0; i < all; i++) icons += `<circle cx="${62 + (i % 21) * 31}" cy="${150 + Math.floor(i / 21) * 34}" r="11" fill="${i < shown ? '#ffcf8a' : 'none'}" stroke="#ffcf8a" stroke-width="2" opacity="${i < shown ? 0.9 : 0.35}"/>`;
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', 'THE SUNLIGHT EARTH USED TO BOUNCE BACK')}
      ${T(30, 104, 's', 'EACH DOT: 100 HIROSHIMA BOMBS’ WORTH')}${icons}
      ${T(30, 400, 'b', `IN 10 s: ${nbN(Math.round(NBP.bombs / 100) * 100)} (SO FAR ${nbN(NBP.bombs * f)})`)}
      ${T(30, 440, 'sm', `EARTH SOAKS UP ≈ ${nbN(Math.round(NBP.bombsUsual / 1000) * 1000)} EVERY 10 s ANYWAY: THIS IS +${Math.round(100 * NBP.albedo / (1 - NBP.albedo))}%`)}`);
  }
  // your pupil, opening
  static pupil(u, t, s) {
    const d = NBP.pupil(s), r = d * 14, T = NbHud.tx;
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', 'YOUR PUPIL')}
      <ellipse cx="380" cy="240" rx="250" ry="130" fill="#e8e2d8"/><circle cx="380" cy="240" r="125" fill="#3a6a5a"/><circle cx="380" cy="240" r="${r.toFixed(1)}" fill="#020304"/>
      <circle cx="380" cy="240" r="${(2.5 * 14).toFixed(1)}" fill="none" stroke="#ffcf8a" stroke-width="2" stroke-dasharray="6 6"/>
      ${T(30, 420, 'b', `${d.toFixed(1)} mm · ${NBP.pupilGain(s).toFixed(1)}× THE LIGHT`)}${T(30, 452, 'sm', 'DASHED: 2.5 mm IN DAYLIGHT')}`);
  }
  // Saturn's light: 73 minutes on the way
  static saturnlt(u, t, s) {
    const x0 = 80, x1 = 690, T = NbHud.tx;
    return NbHud.svg(`${NbHud.plate()}${T(30, 58, 't', 'SATURN’S LIGHT ON ITS WAY TO YOU')}
      <circle cx="${x0}" cy="235" r="30" fill="#2a5aa8"/><text x="${x0}" y="300" text-anchor="middle" class="sm">EARTH</text>
      <ellipse cx="${x1}" cy="235" rx="44" ry="12" fill="none" stroke="#e8d8b0" stroke-width="4"/><circle cx="${x1}" cy="235" r="22" fill="#e8d8b0"/><text x="${x1}" y="300" text-anchor="middle" class="sm">SATURN</text>
      <rect x="${x0 + 40}" y="225" width="${x1 - x0 - 110}" height="20" rx="6" fill="#ffe6b0" opacity="0.85"/>
      <rect x="${x1 - 78}" y="225" width="10" height="20" fill="#05070a" stroke="#ff6a5a" stroke-width="2"/>
      <text x="${x1 - 73}" y="205" text-anchor="middle" class="sm" style="fill:#ff9a8a">3:30 → 3:30:10</text>
      ${T(30, 380, 's', `${(NBP.saturnS / 60).toFixed(0)} LIGHT-MINUTES AWAY TODAY`)}${T(30, 430, 'b', `THAT GAP REACHES US AT ${nbClockStr(NBP.sEcho, false)} PM`)}`);
  }
}
