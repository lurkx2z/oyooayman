/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / Air solid / Light faster films':
     top left     LIGHT BOUNCING: 100% or 0%; while it's off, how long until it's back (to the hundredth); the next
                  thing due ("NEXT · 3:30:01.28 · THE MOON GOES OUT"); at 4:42 PM, Saturn's ten seconds
     top right    Saturday and the time (to the millisecond in the slow part); 26× SLOWER or REAL SPEED; "+2 min" when
                  the clock jumps at a cut (it only ever runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       a mirror; the Moon's light on its way; why the sky is blue; the electron; 300 m blind; radar; a fibre;
                  the cables; a laser; the heat; your pupil
     bottom left  the honest labels (what is impossible, what is rough)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// what's due next (story s, label)
const NB_NEXT = [
  [0, 'LIGHT STOPS BOUNCING'], [NBP.moonS, 'THE MOON GOES OUT'], [NBP.T, 'LIGHT BOUNCES AGAIN'], [NBP.T + NBP.moonS, 'THE MOON COMES BACK'],
  [NBP.sEcho, 'SATURN GOES OUT'], [NBP.sEchoEnd, 'SATURN COMES BACK'],
];
const nbClockStr = (s, ms = true) => { const c = nbClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}${ms ? '.' + String(c.ms).padStart(3, '0').slice(0, 2) : ''}`; };
const nbN = (x) => Math.round(x).toLocaleString('en-US');
// the scene's context box: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const NB_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [nbC(id, k0) - 0.2, (k1 != null ? nbCap(id, k1).hide : nbE(id)) + 0.2, l, f];
  return [
    beat('mirror', 'A MIRROR SENDS BACK', (t, s) => ({ v: (NBP.bounce(s) ? 95 : 0) + '<small>% of the light</small>', v2: 'BEFORE 3:30: 95%' }), 1),
    beat('moon', 'THE MOON’S LAST LIGHT ARRIVES', (t, s) => ({ v: s < NBP.moonS ? `IN ${(NBP.moonS - s).toFixed(2)} <small>s</small>` : 'NOW', v2: '384,400 km = 1.28 LIGHT-SECONDS' }), 1),
    beat('sky', 'BLUE LIGHT BOUNCES OFF AIR', (t, s) => ({ v: `${NBP.rayleigh.toFixed(1)}× <small>more than red</small>`, v2: 'NOW: NEITHER' }), 1),
    beat('sun', 'THE SUN, 3.8° UP', (t, s) => ({ v: `${NBP.sunBoost.toFixed(0)}× <small>brighter</small>`, v2: 'ITS LIGHT CROSSES 11× MORE AIR THAN AT NOON' })),
    beat('crowd', 'PEOPLE AT THE FAIR', (t, s) => ({ v: '400', v2: 'YOU CAN SEE: 0' })),
    beat('road', 'DRIVERS WHO CAN’T SEE THE ROAD', (t, s) => ({ v: `${Math.round(NBP.driversNow / 1e6)} <small>million</small>`, v2: `BLIND SO FAR AT 110 km/h: ${Math.round(NBP.motorway * Math.max(0, s))} m` }), 1),
    beat('plane', 'THE PLANE', (t, s, set) => { const V = set && set.V; if (!V) return { v: '', v2: '' }; const p = V.planePos(s); return { v: `${nbN((p[1] - NB_F.runway.y) * 3.281)} <small>ft</small>`, v2: `${(Math.max(0, p[0] - V.PL.xTD) / 1000).toFixed(1)} km TO TOUCHDOWN · 136 knots` }; }),
    beat('coaster', 'THE TRAIN', (t, s, set) => ({ v: set && set.co ? `${Math.round(set.co.speed(s) * 3.6)} <small>km/h</small>` : '', v2: 'NOBODY IS STEERING IT: IT RUNS ON RAILS' })),
    beat('net', 'TRAFFIC BETWEEN CONTINENTS', (t, s) => ({ v: '1<small>% left</small>', v2: '600 UNDERSEA CABLES: DARK' }), 2),
    beat('heat', 'EXTRA ENERGY EARTH HAS SOAKED UP', (t, s) => ({ v: `${(NBP.extraJ * MathX.clamp(s / NBP.T, 0, 1) / 1e17).toFixed(2)} × 10<sup>17</sup> <small>J</small>`, v2: `≈ ${nbN(NBP.bombs * MathX.clamp(s / NBP.T, 0, 1))} ATOMIC BOMBS` }), 0),
    beat('saturn', 'SATURN’S LIGHT LEFT IT', (t, s) => ({ v: '72 <small>minutes ago</small>', v2: 'IT GOES OUT AT 4:42:10 PM' }), 1),
    beat('pupils', 'YOUR PUPILS', (t, s) => ({ v: `${NBP.pupil(s).toFixed(1)} <small>mm</small>`, v2: `${NBP.pupilGain(s).toFixed(1)}× THE LIGHT GETS IN` })),
    beat('crash', 'BLIND, AT 110 km/h', (t, s) => ({ v: `${Math.round(NBP.blindM)} <small>m</small>`, v2: '10 SECONDS' })),
    beat('echo', 'SATURN', (t, s) => (s < NBP.sEcho ? { v: `GOES OUT IN ${(NBP.sEcho - s).toFixed(1)} <small>s</small>`, v2: 'ITS LIGHT FROM 3:30:00 IS DUE' } : { v: 'GONE', v2: `BACK IN ${Math.max(0, NBP.sEchoEnd - s).toFixed(1)} s` }), 1),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const NB_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [nbC(id, k0) - 0.1, (k1 != null ? nbCap(id, k1).hide : nbE(id)) + 0.2, text]; return [
  b('real', 'THE ONE IMPOSSIBLE THING: REFLECTING AND SCATTERING STOP; BENDING (REFRACTION) AND ABSORBING DON’T', 1),
  b('sun', 'ROUGH: THE LOW SUN LOSES ABOUT TWO-THIRDS OF ITS LIGHT TO SCATTERING ON ITS WAY THROUGH THE AIR', 0),
  b('road', 'ROUGH: 1.45 BILLION CARS IN THE WORLD, ABOUT 4% MOVING AT ANY MOMENT', 0, 1),
  b('plane', 'RADAR HEARS ITS OWN PULSES BOUNCE BACK · A TRANSPONDER SENDS ITS OWN SIGNAL', 2),
  b('net', 'ABOUT 99% OF DATA BETWEEN CONTINENTS GOES THROUGH UNDERSEA FIBRE', 2),
  b('heat', '0.30 (EARTH’S ALBEDO) × 1361 W/m² × πR² × 10 s = 5.2 × 10¹⁷ J · ONE HIROSHIMA ≈ 63 TJ', 2),
  b('pupils', 'ROUGH: PUPILS OPEN IN SECONDS; YOUR EYES TAKE 20–30 MINUTES TO ADAPT FULLY · THE FILM BRIGHTENS WITH YOUR PUPILS', 0),
]; })();
// the insets: [from, to, which, where]
const NB_INSETS = (() => { const b = (id, k0, k1, w, where = '') => [nbC(id, k0) - 0.25, (k1 != null ? nbCap(id, k1).hide : nbE(id)) + 0.3, w, where]; return [
  b('mirror', 1, null, 'mirror'), b('moon', 1, null, 'moonlt', 'mid'), b('sky', 1, null, 'rayleigh'), b('real', 1, null, 'electron', 'mid'),
  b('road', 3, null, 'blind', 'mid'), b('plane', 2, 2, 'radar'), b('net', 1, 1, 'fibre', 'mid'), b('net', 2, 2, 'cables', 'mid'), b('net', 3, 3, 'laser', 'mid'),
  b('heat', 2, 2, 'heat', 'mid'), b('pupils', 0, 0, 'pupil'), b('saturn', 1, 1, 'saturnlt', 'mid'),
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
      this._html('ros', this.roS, s < 0 ? 'AS IT ALWAYS HAS' : s < NBP.T ? `BACK IN <b>${left.toFixed(2)} s</b>` : s < 300 ? 'AGAIN, SINCE 3:30:10 PM' : s < NBP.sEcho ? 'SATURN’S 3:30 LIGHT IS DUE' : s < NBP.sEchoEnd ? `SATURN: DARK FOR <b>${(NBP.sEchoEnd - s).toFixed(1)} s</b>` : '');
      const nx = NB_NEXT.find((x) => x[0] > s + 1e-4);
      this._html('ron', this.roN, nx && s >= 0 && nx[0] - s < 4000 ? `NEXT · ${nbClockStr(nx[0], nx[0] < 100)} · ${nx[1]}` : '');
      this._cls('roc', this.ro, b ? 'nb-ro' : (left < 3.05 ? 'nb-ro dark tick' : 'nb-ro dark'));
    }
    // ---- the context box
    const cx = NB_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = NB_TAGS.find((x) => t >= x[0] && t < x[1]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
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
    { const left = NBP.T - s, on = s >= NBP.T - 3.0 && s < NBP.T + 0.02;
      this._set('cnta', this.count, 'opacity', on ? '1' : '0');
      if (on) { this._txt('cntv', this.count, left > 0.005 ? String(Math.ceil(left - 1e-6)) : '0'); this._cls('cntc', this.count, left < 0.02 ? 'nb-count hit' : 'nb-count'); } }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = NBT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'nb-cap q' : 'nb-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
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
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static cross(x, y, r = 22) { return `<path d="M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}" stroke="#ff6a5a" stroke-width="6" stroke-linecap="round"/>`; }
  // a mirror: light in, light back (before), nothing back (now)
  static mirror(u) {
    const a = MathX.smooth(u, 0.4, 1.2);
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">A MIRROR</text>
      <rect x="560" y="110" width="22" height="300" fill="#cfd8e0"/><rect x="582" y="110" width="40" height="300" fill="#4a5058"/>
      <line x1="110" y1="140" x2="548" y2="260" stroke="#ffcf8a" stroke-width="6" marker-end="url(#nbAh)"/><text x="100" y="124" class="s">LIGHT IN</text>
      <g opacity="${(1 - a).toFixed(2)}"><line x1="548" y1="262" x2="120" y2="390" stroke="#ffcf8a" stroke-width="6" stroke-dasharray="14 10" marker-end="url(#nbAh)"/><text x="110" y="430" class="s">95% BACK TO YOU</text></g>
      <g opacity="${a.toFixed(2)}"><text x="110" y="430" class="b">NOW: NOTHING COMES BACK</text>${NbHud.cross(330, 330)}</g>`);
  }
  // the Moon's light, on its way: the last of it (bounced before 3:30) still between the Moon and you
  static moonlt(u, t, s) {
    const x0 = 90, x1 = 680, L = x1 - x0, f = MathX.clamp(s / NBP.moonS, 0, 1);
    let dots = ''; for (let i = 0; i < 26; i++) { const p = (i + 0.5) / 26, ph = (p + (t * 0.04) % (1 / 26)); const x = x1 - ph * L; if (x < x0 || x > x1) continue; if (ph < f) continue;
      dots += `<circle cx="${x.toFixed(1)}" cy="235" r="7" fill="#ffe6b0"/>`; }
    const tail = x1 - f * L;
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">MOONLIGHT ON ITS WAY TO YOU</text>
      <circle cx="${x0}" cy="235" r="34" fill="#2a5aa8"/><text x="${x0}" y="300" text-anchor="middle" class="sm">EARTH</text>
      <circle cx="${x1}" cy="235" r="20" fill="#d8d4c8"/><text x="${x1}" y="300" text-anchor="middle" class="sm">MOON</text>
      ${dots}<line x1="${tail.toFixed(1)}" y1="190" x2="${tail.toFixed(1)}" y2="280" stroke="#ff6a5a" stroke-width="3" stroke-dasharray="6 6" opacity="${f > 0 && f < 1 ? 1 : 0}"/>
      <text x="30" y="380" class="s">384,400 km · LIGHT TAKES 1.28 s</text>
      <text x="30" y="430" class="b">${s < NBP.moonS ? `LAST LIGHT ARRIVES IN ${(NBP.moonS - Math.max(0, s)).toFixed(2)} s` : 'THE LAST OF IT HAS ARRIVED'}</text>`);
  }
  // Rayleigh: how strongly air scatters each colour (∝ 1/λ⁴)
  static rayleigh(u) {
    const cols = [['#6a3aa0', 410], ['#2a5cff', 460], ['#2aa84a', 530], ['#e8d02a', 580], ['#ff8a1a', 610], ['#e8231a', 660]], a = MathX.smooth(u, 1.2, 2.2);
    const bars = cols.map(([c, l], i) => { const h = 230 * Math.pow(410 / l, 4); return `<rect x="${80 + i * 105}" y="${390 - h}" width="70" height="${h.toFixed(1)}" rx="6" fill="${c}" opacity="${(1 - 0.75 * a).toFixed(2)}"/><text x="${115 + i * 105}" y="420" text-anchor="middle" class="sm">${l} nm</text>`; }).join('');
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">HOW MUCH EACH COLOUR BOUNCES OFF AIR</text>${bars}
      <text x="80" y="120" class="s" opacity="${(1 - a).toFixed(2)}">BLUE ≈ 4× RED: THE SKY IS BLUE</text>
      <g opacity="${a.toFixed(2)}"><text x="80" y="120" class="b">NOW: NONE OF THEM. THE SKY IS BLACK</text></g>`);
  }
  // one electron, shaken by the light: it sends light out sideways (scattering: stopped here) and forwards (bending: kept)
  static electron(u, t) {
    const y = 235 + 16 * Math.sin(t * 9), a = MathX.smooth(u, 0.8, 1.6), b2 = MathX.smooth(u, 2.0, 3.0);
    let wave = ''; for (let x = 40; x <= 300; x += 4) wave += (x === 40 ? 'M' : 'L') + x + ' ' + (235 + 26 * Math.sin((x - t * 120) / 18)).toFixed(1);
    let fwd = ''; for (let x = 420; x <= 720; x += 4) fwd += (x === 420 ? 'M' : 'L') + x + ' ' + (235 + 26 * Math.sin((x - 30 - t * 120) / 18)).toFixed(1);
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">LIGHT SHAKES AN ELECTRON…</text>
      <path d="${wave}" fill="none" stroke="#ffcf8a" stroke-width="4"/><circle cx="360" cy="${y.toFixed(1)}" r="16" fill="#9fc4ff"/>
      <g opacity="${a.toFixed(2)}"><line x1="360" y1="200" x2="300" y2="110" stroke="#ffcf8a" stroke-width="4" marker-end="url(#nbAh)"/><line x1="360" y1="270" x2="420" y2="370" stroke="#ffcf8a" stroke-width="4" marker-end="url(#nbAh)"/>
        <text x="440" y="120" class="s">…IT SENDS LIGHT SIDEWAYS: BOUNCING</text>${NbHud.cross(330, 155, 18)}${NbHud.cross(392, 320, 18)}</g>
      <g opacity="${b2.toFixed(2)}"><path d="${fwd}" fill="none" stroke="#9fe0a8" stroke-width="4"/><text x="430" y="420" class="s" style="fill:#9fe0a8">AND FORWARDS: BENDING. KEPT HERE</text></g>`);
  }
  // ten seconds blind at 110 km/h
  static blind(u, t, s) {
    const f = MathX.clamp(s / NBP.T, 0, 1), x0 = 60, x1 = 700, x = x0 + (x1 - x0) * Math.min(1, u / 3.2);
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">10 SECONDS AT 110 km/h</text>
      <rect x="${x0}" y="215" width="${x1 - x0}" height="40" rx="8" fill="#2a2d33"/><line x1="${x0}" y1="235" x2="${x1}" y2="235" stroke="#e8e4d8" stroke-width="3" stroke-dasharray="26 18"/>
      <rect x="${(x - 46).toFixed(1)}" y="218" width="46" height="34" rx="8" fill="#d8263a"/>
      <text x="${x0}" y="300" class="sm">0 m</text><text x="${x1}" y="300" text-anchor="end" class="sm">306 m</text>
      <text x="30" y="400" class="b">${Math.round(306 * Math.min(1, u / 3.2))} m WITH YOUR EYES SHUT</text>
      <text x="30" y="440" class="sm">(AND THE DARK HAS ONLY GONE ON ${f.toFixed(1)} OF ITS 10 s)</text>`);
  }
  // the radar scope: the sweep finds no echoes; the plane's own transponder reply is still there
  static radar(u, t, s, set) {
    const cx = 380, cy = 250, R = 190, a = (s * 2 * Math.PI / 4.0) % (2 * Math.PI), V = set && set.V;
    const pl = V ? V.planePos(s) : [4600, 0, 1650], px = cx + (pl[0] - 2350) / 4000 * R, py = cy + (pl[2] - 1320) / 4000 * R * 6;
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">THE AIRPORT’S RADAR</text>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="#03140a" stroke="#2a8a4a" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${R * 0.5}" fill="none" stroke="#1a5a2a" stroke-width="1.5"/>
      <line x1="${cx}" y1="${cy}" x2="${(cx + R * Math.cos(a)).toFixed(1)}" y2="${(cy + R * Math.sin(a)).toFixed(1)}" stroke="#6aff8a" stroke-width="3"/>
      <rect x="${(px - 8).toFixed(1)}" y="${(py - 8).toFixed(1)}" width="16" height="16" fill="none" stroke="#ffcf8a" stroke-width="3"/><text x="${(px - 150).toFixed(1)}" y="${(py - 18).toFixed(1)}" class="sm" style="font-size:22px">BAW271 · 2100 ft</text>
      <text x="610" y="160" class="sm">ECHOES</text><text x="610" y="194" class="b" style="font-size:40px">0</text>
      <text x="30" y="440" class="s">ONLY THE PLANE’S OWN SIGNAL: ITS TRANSPONDER</text>`);
  }
  // a glass fibre: light kept in by total internal reflection; now it leaks out at the first bounce
  static fibre(u, t) {
    const a = MathX.smooth(u, 1.0, 2.0); let zz = 'M40 235'; for (let i = 1; i <= 8; i++) zz += ` L${40 + i * 85} ${i % 2 ? 180 : 290}`;
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">AN OPTICAL FIBRE</text>
      <rect x="30" y="170" width="700" height="130" rx="65" fill="rgba(150,200,255,0.12)" stroke="#9fc4ff" stroke-width="3"/>
      <path d="${zz}" fill="none" stroke="#ffcf8a" stroke-width="5" opacity="${(1 - a).toFixed(2)}"/>
      <g opacity="${a.toFixed(2)}"><path d="M40 235 L125 180 L180 110" fill="none" stroke="#ffcf8a" stroke-width="5" marker-end="url(#nbAh)"/>${NbHud.cross(125, 180, 20)}</g>
      <text x="30" y="370" class="s">LIGHT BOUNCES OFF THE WALLS OF THE GLASS, ALL THE WAY</text>
      <text x="30" y="430" class="b" opacity="${a.toFixed(2)}">NOW IT ESCAPES AT THE FIRST BOUNCE</text>`);
  }
  // the undersea cables between the continents (a schematic map: blobs, not real coastlines)
  static cables(u) {
    const a = MathX.smooth(u, 0.6, 2.2), land = '#2a3a2a';
    const conts = [[150, 170, 95, 75], [180, 330, 55, 80], [390, 150, 50, 45], [420, 300, 65, 85], [560, 170, 110, 70], [640, 340, 50, 35]];
    const links = [[200, 170, 380, 150], [200, 180, 540, 175], [230, 310, 400, 290], [380, 160, 560, 170], [440, 290, 600, 200], [600, 200, 640, 330], [240, 160, 610, 150], [190, 300, 640, 340], [400, 160, 420, 280]];
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">THE CABLES UNDER THE SEA</text>
      ${conts.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${land}"/>`).join('')}
      ${links.map(([x0, y0, x1, y1]) => `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${Math.max(y0, y1) + 50} ${x1} ${y1}" fill="none" stroke="${a > 0.5 ? '#3a3f46' : '#6ad0ff'}" stroke-width="4" opacity="${(1 - 0.5 * a).toFixed(2)}"/>`).join('')}
      <text x="30" y="430" class="s">ABOUT 600 OF THEM · ${a > 0.5 ? 'ALL DARK' : '99% OF THE TRAFFIC'}</text>`);
  }
  // a laser: light bouncing between two mirrors, building up; no bounce, no laser
  static laser(u, t) {
    const a = MathX.smooth(u, 1.0, 2.0); let rays = ''; for (let i = 0; i < 5; i++) { const y = 200 + i * 14; rays += `<line x1="150" y1="${y}" x2="600" y2="${y}" stroke="#ff4a3a" stroke-width="3" opacity="${((1 - a) * (0.4 + 0.12 * i)).toFixed(2)}"/>`; }
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">A LASER</text>
      <rect x="120" y="150" width="22" height="170" fill="#cfd8e0"/><rect x="608" y="150" width="22" height="170" fill="#cfd8e0" opacity="0.7"/>
      <rect x="250" y="190" width="250" height="90" rx="12" fill="rgba(255,90,70,0.15)" stroke="#ff8a7a" stroke-width="2"/>${rays}
      <line x1="630" y1="235" x2="740" y2="235" stroke="#ff4a3a" stroke-width="8" opacity="${(1 - a).toFixed(2)}"/>
      <text x="100" y="370" class="s">LIGHT BOUNCES BETWEEN TWO MIRRORS, GROWING EACH PASS</text>
      <text x="100" y="430" class="b" opacity="${a.toFixed(2)}">NO BOUNCE: NO LASER</text>`);
  }
  // the heat: the 30% of sunlight Earth always bounced back to space, absorbed for ten seconds
  static heat(u, t, s) {
    const f = MathX.clamp(s / NBP.T, 0, 1), n = Math.round(NBP.bombs * f);
    let icons = ''; const shown = Math.round(80 * f); for (let i = 0; i < shown; i++) icons += `<circle cx="${70 + (i % 20) * 31}" cy="${200 + Math.floor(i / 20) * 34}" r="11" fill="#ffcf8a" opacity="0.85"/>`;
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">EARTH USED TO BOUNCE BACK 30% OF SUNLIGHT</text>
      <text x="30" y="120" class="s">FOR 10 s IT SOAKS UP ALL OF IT</text>${icons}
      <text x="30" y="400" class="b">${nbN(n)} HIROSHIMA BOMBS’ WORTH</text><text x="30" y="440" class="sm">EACH DOT ≈ 100 · SPREAD OVER HALF THE PLANET: A FRACTION OF A DEGREE</text>`);
  }
  // your pupil, opening
  static pupil(u, t, s) {
    const d = NBP.pupil(s), r = d * 14;
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">YOUR PUPIL</text>
      <ellipse cx="380" cy="240" rx="250" ry="130" fill="#e8e2d8"/><circle cx="380" cy="240" r="125" fill="#3a6a5a"/><circle cx="380" cy="240" r="${r.toFixed(1)}" fill="#020304"/>
      <circle cx="380" cy="240" r="${(2.5 * 14).toFixed(1)}" fill="none" stroke="#ffcf8a" stroke-width="2" stroke-dasharray="6 6"/>
      <text x="30" y="420" class="b">${d.toFixed(1)} mm · ${NBP.pupilGain(s).toFixed(1)}× THE LIGHT</text><text x="30" y="450" class="sm">DASHED: 2.5 mm IN DAYLIGHT</text>`);
  }
  // Saturn's light: 72 minutes on the way
  static saturnlt(u, t, s) {
    const x0 = 80, x1 = 690;
    return NbHud.svg(`${NbHud.plate()}<text x="30" y="58" class="t">SATURN’S LIGHT ON ITS WAY TO YOU</text>
      <circle cx="${x0}" cy="235" r="30" fill="#2a5aa8"/><text x="${x0}" y="300" text-anchor="middle" class="sm">EARTH</text>
      <ellipse cx="${x1}" cy="235" rx="44" ry="12" fill="none" stroke="#e8d8b0" stroke-width="4"/><circle cx="${x1}" cy="235" r="22" fill="#e8d8b0"/><text x="${x1}" y="300" text-anchor="middle" class="sm">SATURN</text>
      <rect x="${x0 + 40}" y="225" width="${x1 - x0 - 110}" height="20" rx="6" fill="#ffe6b0" opacity="0.85"/>
      <rect x="${x1 - 78}" y="225" width="10" height="20" fill="#05070a" stroke="#ff6a5a" stroke-width="2"/>
      <text x="${x1 - 73}" y="205" text-anchor="middle" class="sm" style="fill:#ff9a8a">3:30 → 3:30:10</text>
      <text x="30" y="380" class="s">72 LIGHT-MINUTES AWAY</text><text x="30" y="430" class="b">THAT GAP REACHES US AT 4:42 PM</text>`);
  }
}
