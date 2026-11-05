/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / Air solid / Speed of light films':
     top left     MEN AND BOYS ON EARTH: 4,121,384,56x until 7:42:00.000, then 0, and from then on only the boys
                  born since (about 2 a second)
     top right    Tuesday and the time (to the millisecond in the slow part); 9× SLOWER or REAL SPEED; "+6 min" when
                  the clock jumps at a cut (it only ever runs forward)
     under them   the scene's context box (the number this scene is about: a speed, a countdown, the fuel)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     insets       half of everyone; 20 airline pilots; 193 countries; the landing queue
     bottom left  the honest labels (what is real, what is rough, where a number comes from)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a, side }])
   ===================================================================== */

const mgNum = (x) => Math.round(x).toLocaleString('en-US');
// the scene's context box: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const MG_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [mgC(id, k0) - 0.2, (k1 != null ? mgCap(id, k1).hide : mgE(id)) + 0.2, l, f];
  const kmh = (v) => `${Math.round(v * 3.6)} <small>km/h</small>`;
  const car = (t, s) => ({ v: kmh(MGP.carV(s)), v2: MGP.carDecel(s) > 0.3 ? `BRAKING · ${(MGP.carDecel(s) / 9.81).toFixed(2)} g` : s < MGP.car.sGrab ? 'CRUISE CONTROL · NOBODY STEERING' : s < MGP.car.sBrake ? 'CRUISE CONTROL · YOUR HANDS ON THE WHEEL' : MGP.carV(s) > 0 ? 'BRAKING' : 'STOPPED' });
  const lorry = (t, s) => ({ v: kmh(MGP.lorryV(s)), v2: s < MGP.lorry.sHit ? 'NOBODY AT THE WHEEL' : MGP.lorryV(s) > 0 ? 'GRINDING ALONG THE BARRIER' : 'STOPPED' });
  const fuel = (t, s) => ({ v: `${MGP.hms(MGP.fuel(s))} <small>of fuel</small>`, v2: s > MG.sLand3 ? 'AUTOLAND: LAND 3' : s > MG.sFlap ? 'FLAPS SET · WHEELS DOWN' : 'ON AUTOPILOT · 64 PASSENGERS' });
  const plane = (t, s) => {
    const q = mgPlaneAt(s), toGo = MG_FL.zTD - q.p[2], h = Math.max(0, q.p[1] - MG_PL.gear);
    if (s < MG.sTD) return { v: `${mgNum(h)} <small>m up</small>`, v2: `${Math.round(q.v * 3.6)} km/h · ${toGo >= 1000 ? (toGo / 1000).toFixed(1) + ' km' : Math.max(0, Math.round(toGo / 10) * 10) + ' m'} TO TOUCHDOWN` };
    return { v: kmh(q.v), v2: q.v > 0.5 ? 'ON THE RUNWAY · BRAKING ITSELF' : 'STOPPED ON THE RUNWAY' };
  };
  const out = [
    beat('wheel', 'YOUR CAR', car),
    beat('brake', 'YOUR CAR', car),
    beat('lorry', 'THE LORRY · 40 TONNES', lorry),
    beat('cab', 'THE LORRY · 40 TONNES', lorry),
    beat('stop', 'YOUR CAR', (t, s) => ({ v: kmh(MGP.carV(s)), v2: 'THE LORRY: 3.0 m AHEAD' })),
    beat('cars', 'CARS ON THIS STRETCH', () => ({ v: `${MG_TRAFFIC.nEmpty} <small>with nobody at the wheel</small>`, v2: `${MG_TRAFFIC.nOk} STILL HAVE A DRIVER` })),
    beat('phone', 'THE MOBILE NETWORK', (t, s) => ({ v: 'JAMMED', v2: `${(1 + 0.4 * Math.sin(s * 0.7)).toFixed(1)} BILLION CALLS AT ONCE` }), 1),
    beat('train', 'THE TRAIN', (t, s) => ({ v: kmh(MGP.trainV(s)), v2: s < MGP.train.sWarn ? 'THE PEDAL’S ALARM: 4 s' : MGP.trainV(s) > 0 ? 'EMERGENCY BRAKES ON' : 'STOPPED' })),
    beat('barge', 'THE BARGE · 86 m LONG', (t, s) => ({ v: s < MGP.barge.sHit ? kmh(MGP.barge.v) : '0 <small>km/h</small>', v2: s < MGP.barge.sHit ? 'AUTOPILOT: HEADING 180°' : 'AGROUND ON THE BANK' })),
    beat('plane', 'FLIGHT 2207', () => ({ v: '11,000 <small>m up</small>', v2: '830 km/h · AUTOPILOT ON' })),
    beat('world', 'AIRLINERS IN THE AIR', () => ({ v: '≈ 9,000', v2: '≈ 8,100 WITH NO ONE AT THE CONTROLS' })),
    beat('door', 'THE COCKPIT DOOR', (t, s) => (s < MG.sCode ? { v: 'LOCKED', v2: 'FROM INSIDE' } : s < MG.sDoor ? { v: `${Math.ceil(MG.sDoor - s)} <small>s</small>`, v2: 'EMERGENCY CODE ENTERED' } : { v: 'OPEN', v2: 'NOBODY INSIDE DENIED IT' }), 1),
    // (the countdown stays up through the silent wait, until the door has opened)
    beat('alone', 'FLIGHT 2207', fuel),
    beat('tower', 'CONTROLLERS ON DUTY', () => ({ v: '2 <small>of 9</small>', v2: 'EVERY PLANE IN RANGE CALLING' })),
    beat('smoke', 'FIREFIGHTERS LEFT', () => ({ v: '≈ 1 <small>in 10</small>', v2: 'KITCHENS BURNING: THOUSANDS' }), 2),
    beat('ward', 'BOYS STILL TO BE BORN', () => ({ v: '≈ 50 <small>million</small>', v2: 'DUE IN THE NEXT 9 MONTHS' }), 4),
    beat('walk', 'CARS MOVED ON THE MOTORWAY', () => ({ v: '0', v2: 'SINCE 7:42' }), 1),
    beat('alert', 'COUNTRIES LED ONLY BY MEN', () => ({ v: '166 <small>of 193</small>', v2: 'UNTIL 7:42' }), 2),
    beat('hold', 'FLIGHT 2207', fuel),
    beat('autoland', 'FLIGHT 2207', fuel),
    beat('final', 'FLIGHT 2207', plane),
    beat('question', 'PLANES STILL CIRCLING', () => ({ v: '23', v2: 'CONTROLLERS LEFT: 2' })),
  ];
  const d = out.find((x) => x[2] === 'THE COCKPIT DOOR'); d[1] = Math.max(d[1], Math.min(mgB('alone') - 0.1, mgFilmAt(MG.sDoor) + 3));
  return out;
})();
// the honest labels (bottom left): [from, to, text]
const MG_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [mgC(id, k0) - 0.1, (k1 != null ? mgCap(id, k1).hide : mgE(id)) + 0.2, text]; return [
  b('start', 'THE ONE IMPOSSIBLE THING: EVERY MAN AND BOY VANISHES AT 7:42. THE REST FOLLOWS FROM IT', 0),
  b('brake', 'REAL: HELD WHILE MOVING, AN ELECTRONIC PARKING BRAKE STOPS THE CAR HARD (CAR MANUALS)', 0),
  b('cab', 'LORRY DRIVERS IN EUROPE: ABOUT 3% ARE WOMEN (IRU 2023)', 1),
  b('cars', 'ROUGH: ABOUT 6 IN 10 RUSH-HOUR DRIVERS ARE MEN. ONLY NEWER CARS STOP THEMSELVES', 1),
  b('train', 'REAL: A DRIVER’S VIGILANCE PEDAL STOPS THE TRAIN IF IT IS LET GO', 1),
  b('world', 'AIRLINE PILOTS: ABOUT 5% WOMEN (ISWAP). AIRLINERS UP AT THE DAILY PEAK: 9,000–10,000', 1),
  b('door', 'REAL: THE CREW’S CODE OPENS THE COCKPIT DOOR AFTER A DELAY UNLESS A PILOT DENIES IT', 1),
  b('tower', 'AIR TRAFFIC CONTROLLERS: ABOUT 1 IN 5 ARE WOMEN', 0),
  b('smoke', 'FIREFIGHTERS: ABOUT 9% WOMEN (UK HOME OFFICE 2024)', 2),
  b('ward', 'MIDWIVES WORLDWIDE: MORE THAN 9 IN 10 ARE WOMEN (UNFPA / WHO 2021)', 1, 1),
  b('ward', 'BIRTHS: ABOUT 132 MILLION A YEAR, 105 BOYS TO EVERY 100 GIRLS (UN 2024)', 4),
  b('alert', 'HEADS OF STATE OR GOVERNMENT: WOMEN IN 27 OF 193 COUNTRIES (UN WOMEN 2025)', 2),
  b('autoland', 'REAL: AUTOLAND FLIES THE APPROACH, FLARE AND ROLLOUT. A PILOT HAS TO SET IT UP', 1),
  b('final', 'ROUGH: NO ONE HAS EVER TALKED A NON-PILOT THROUGH AN AIRLINER’S AUTOLAND', 3),
]; })();
// the insets: [from, to, which, where]
const MG_INSETS = (() => { const b = (id, k0, k1, w, where = '') => [mgC(id, k0) - 0.25, (k1 != null ? mgCap(id, k1).hide : mgE(id)) + 0.3, w, where]; return [
  b('start', 1, 1, 'half'), b('world', 1, 1, 'pilots'), b('alert', 2, 2, 'leaders'), b('many', 1, 2, 'queue'),
]; })();

// a caption's text with its numbers in amber
function mgCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?%|\s(?:billion|million|thousand|hours|hour|minutes|minute|seconds|second|km\/h|m\/s|km|kg|cm|m|s)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class MgHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('mg-ro', '<div class="l">MEN AND BOYS ON EARTH</div><div class="v"></div><div class="s"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.ctx = mk('mg-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('mg-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('mg-band'); this.cap = mk('mg-cap'); this.tag = mk('mg-tag');
    this.caps = MGT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: mgCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('mg-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = mgStoryAt(t), rate = mgRateAt(t);
    void app; void shot;
    // ---- men and boys on Earth (from just after the title)
    const ra = W(t, MG.title[1] - 0.5, MG.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._html('rov', this.roV, mgNum(MGP.men(s)));
      this._html('ros', this.roS, s < 0 ? 'HALF OF EVERYONE ALIVE' : s < 1.2 ? '<b>ALL GONE AT 7:42:00</b>' : 'BORN SINCE 7:42 · ABOUT 2 A SECOND');
      this._cls('roc', this.ro, s >= 0 && s < 1.2 ? 'mg-ro hit' : 'mg-ro');
    }
    // ---- the context box
    const cx = MG_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = MG_TAGS.find((x) => t >= x[0] && t < x[1]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- Tuesday and the time; how slowed down, or a jump
    const ca = W(t, MG.title[1] - 0.5, MG.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = mgClockParts(s), ms = rate < 0.9 ? `<small>.${String(c.ms).padStart(3, '0')}</small>` : '';
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small>${ms} <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = MG_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 90 ? Math.round(j.ds / 60) + ' min' : Math.round(j.ds) + ' s') : '';
      const tl = rate < 0.9 ? Math.round(1 / rate) + '× SLOWER' : 'REAL SPEED';
      this._txt('ckf', this.clockF, jl ? jl + '  ·  ' + tl : tl);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = MGT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'mg-cap q' : 'mg-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, s);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'mg-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? (set.view ? set.view()[1] : set.camera) : null, _p = MgHud._p || (MgHud._p = new THREE.Vector3());
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
      const ty = Math.min(70, Math.max(ly, 34));   // (34%: clear of the counter and the clock; 70%: of the caption)
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      // a label never sits on a diagram: while one is up, a label whose box would touch it is hidden
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) d.style.opacity = '0'; }
      d.className = right ? 'mg-lab r' : 'mg-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  _insets(t, s) {
    const W = StoryHUD.win, which = MG_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'mg-inset' : ('mg-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = MgHud[which[2]](u, t, s);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // a person, as a dot on a stalk (the insets' one figure): x, y (feet), height, fill
  static fig(x, y, hgt, fill, stroke = 'none') { const r = hgt * 0.17; return `<circle cx="${x.toFixed(1)}" cy="${(y - hgt + r).toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M${(x - r * 1.15).toFixed(1)} ${y.toFixed(1)} L${(x - r * 0.9).toFixed(1)} ${(y - hgt + 2.4 * r).toFixed(1)} Q${x.toFixed(1)} ${(y - hgt + 2.05 * r).toFixed(1)} ${(x + r * 0.9).toFixed(1)} ${(y - hgt + 2.4 * r).toFixed(1)} L${(x + r * 1.15).toFixed(1)} ${y.toFixed(1)} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`; }
  // half of everyone: 20 figures, the men's 10 fading to outlines
  static half(u) {
    const k = MathX.smooth(u, 0.5, 1.6);
    let b = `${MgHud.plate()}<text x="30" y="56" class="t">EVERYONE ALIVE AT 7:41</text><text x="30" y="96" class="sm">WOMEN AND GIRLS · 4.13 BILLION</text>
      <text x="30" y="256" class="sm" opacity="${(0.5 + 0.5 * k).toFixed(2)}">MEN AND BOYS · 4.12 BILLION${k > 0.5 ? ' · GONE' : ''}</text>`;
    for (let i = 0; i < 20; i++) { const x = 70 + (i % 10) * 68, y = i < 10 ? 222 : 382, man = i >= 10;
      b += man ? `<g opacity="${(1 - 0.75 * k).toFixed(3)}">${MgHud.fig(x, y, 110, k > 0.5 ? 'none' : 'rgba(170,190,220,0.85)', 'rgba(246,239,226,0.6)')}</g>` : MgHud.fig(x, y, 110, '#ffcf8a'); }
    b += `<text x="30" y="444" class="s">HALF OF EVERYONE · GONE AT 7:42</text>`;
    return MgHud.svg(b);
  }
  // 20 airline pilots: 19 men, gone; 10 cockpits, 9 empty
  static pilots(u) {
    const k = MathX.smooth(u, 0.4, 1.4);
    let b = `${MgHud.plate()}<text x="30" y="58" class="t">10 COCKPITS · 20 PILOTS</text>`;
    for (let i = 0; i < 10; i++) { const cx = 78 + (i % 5) * 150, cy = i < 5 ? 190 : 330, woman = i === 6;
      b += `<rect x="${cx - 60}" y="${cy - 90}" width="120" height="112" rx="18" fill="rgba(246,239,226,0.06)" stroke="rgba(246,239,226,0.3)" stroke-width="2"/>`;
      for (const sx of [-26, 26]) { const w = woman && sx < 0; b += w ? MgHud.fig(cx + sx, cy + 10, 78, '#ffcf8a') : `<g opacity="${(1 - 0.8 * k).toFixed(3)}">${MgHud.fig(cx + sx, cy + 10, 78, 'rgba(170,190,220,0.85)')}</g>`; } }
    b += `<text x="30" y="440" class="s">9 IN 10 COCKPITS: NO ONE LEFT</text>`;
    return MgHud.svg(b);
  }
  // 193 countries: 27 with a woman at the top
  static leaders(u) {
    const k = MathX.smooth(u, 0.3, 1.5), n = Math.round(193 * k);
    let b = `${MgHud.plate()}<text x="30" y="58" class="t">193 COUNTRIES, THEIR TOP LEADERS</text>`;
    for (let i = 0; i < n; i++) { const c = i % 20, r = Math.floor(i / 20), x = 52 + c * 34.5, y = 110 + r * 30, w = (i * 7 + 3) % 193 < 27;
      b += w ? `<circle cx="${x.toFixed(1)}" cy="${y}" r="11" fill="#ffcf8a"/>` : `<circle cx="${x.toFixed(1)}" cy="${y}" r="10" fill="none" stroke="rgba(246,239,226,0.55)" stroke-width="2.5"/>`; }
    b += `<circle cx="44" cy="428" r="11" fill="#ffcf8a"/><text x="66" y="437" class="sm">A WOMAN: 27</text><circle cx="330" cy="428" r="10" fill="none" stroke="rgba(246,239,226,0.55)" stroke-width="2.5"/><text x="352" y="437" class="sm">ONLY MEN: 166 · NOW GONE</text>`;
    return MgHud.svg(b);
  }
  // the landing queue: 24 planes, one every 15 minutes; most have 2 hours of fuel
  static queue(u) {
    const k = MathX.smooth(u, 0.3, 2.6), x = (h) => 60 + h / 6.2 * 660, fx = x(2);
    let b = `${MgHud.plate()}<text x="30" y="58" class="t">ONE LANDING EVERY 15 MINUTES</text>
      <rect x="${fx.toFixed(1)}" y="96" width="${(x(6.2) - fx).toFixed(1)}" height="250" fill="rgba(255,90,70,0.12)"/>
      <line x1="${fx.toFixed(1)}" y1="90" x2="${fx.toFixed(1)}" y2="352" stroke="#ff8a6a" stroke-width="3" stroke-dasharray="9 7"/>
      <text x="${(fx + 12).toFixed(1)}" y="122" class="sm" style="fill:#ff9a7a">MOST RUN OUT OF FUEL</text>
      <line x1="60" y1="352" x2="720" y2="352" stroke="rgba(246,239,226,0.6)" stroke-width="2"/>`;
    for (let h = 0; h <= 6; h++) b += `<line x1="${x(h).toFixed(1)}" y1="352" x2="${x(h).toFixed(1)}" y2="364" stroke="rgba(246,239,226,0.6)" stroke-width="2"/><text x="${x(h).toFixed(1)}" y="392" text-anchor="middle" class="sm">${h} h</text>`;
    const n = Math.round(24 * k);
    for (let i = 0; i < n; i++) { const hx = x(i * 0.25 + 0.25), y = 330 - (i % 4) * 52, late = i * 0.25 + 0.25 > 2;
      b += `<path d="M${(hx - 13).toFixed(1)} ${y} L${(hx + 13).toFixed(1)} ${y} M${hx.toFixed(1)} ${y - 16} L${hx.toFixed(1)} ${y + 14} M${(hx - 6).toFixed(1)} ${y + 11} L${(hx + 6).toFixed(1)} ${y + 11}" stroke="${late ? '#ff9a7a' : '#ffcf8a'}" stroke-width="4" stroke-linecap="round" fill="none"/>`; }
    b += `<text x="30" y="440" class="s">24 PLANES · THE LAST LANDS AT 6 h</text>`;
    return MgHud.svg(b);
  }
}
