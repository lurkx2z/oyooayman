/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / Air solid films':
     top left     THE SPEED OF LIGHT in km/s, how many times faster, and the next thing it breaks ("NEXT ×1.15 …")
     top right    Saturday and the time (to the millisecond in the slow part); 10× SLOWER or REAL SPEED; "+3 min" when
                  the clock jumps at a cut (it only ever runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     insets       light and magnetism (μ₀ = 1/ε₀c²); the ladder of what breaks when; gold's colour; a speaker; the day
                  side of the Earth; the old light running out
     bottom left  the honest labels (what is impossible, what is rough, what the grade does)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// the landmarks (the counter's NEXT line, the ladder): [k, short label]
const LF_MARKS = [
  [LFP.kTrans, 'THE GRID’S IRON SATURATES'], [LFP.kQuench, 'MRI MAGNETS QUENCH'], [LFP.kGrid, 'THE GRID TRIPS'], [LFP.kSpark, 'ENGINES STALL'],
  [1.316, 'MERCURY FREEZES (6 °C)'], [LFP.kGold, 'GOLD TURNS SILVER'], [2, 'MAGNETS ¼ AS STRONG'], [2.7, 'FIRES 7× DIMMER'], [3, 'LEDS AT ¼'],
  [5, 'COLOURS FADE'], [LFP.kOut(499), 'THE SUN’S OLD LIGHT RUNS OUT'], [10, 'EARTH CAN’T COOL'], [LFP.kOut(LFP.dSaturn), 'SATURN GOES OUT'], [400, 'TOO LONG TO FOCUS'], [LFP.kPupil, 'WAVES AS WIDE AS YOUR PUPILS'], [3e5, 'ALMOST NO LIGHT GETS IN'],
];
const lfPct = (x) => (x >= 0.995 ? Math.round(x * 100) : x >= 0.1 ? Math.round(x * 100) : x >= 0.01 ? (x * 100).toFixed(1) : (x * 100).toFixed(2)) + '%';
// the scene's context box: [from, to, label, value(t, s, k) → { v, v2 }] (HTML)
const LF_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [lfC(id, k0) - 0.2, (k1 != null ? lfCap(id, k1).hide : lfE(id)) + 0.2, l, f];
  return [
    beat('gps', 'YOUR PHONE’S GPS', (t, s, k) => ({ v: 'NO FIX', v2: `TIMED WITH THE OLD SPEED: ${lfPct(k - 1)} OFF` })),
    beat('magnet', 'EVERY MAGNET’S PULL', (t, s, k) => ({ v: lfPct(1 / (k * k)), v2: 'FALLS AS 1 / (×c)²' }), 1),
    beat('flicker', 'TRANSFORMER IRON CAN HOLD', (t, s, k) => ({ v: `${(2.0 / (k * k)).toFixed(2)} <small>tesla</small>`, v2: 'THE GRID NEEDS 1.70' })),
    beat('mri', 'CURRENT IN THE MRI’S WIRE', (t, s, k) => ({ v: lfPct(k * k), v2: s < LFP.sQuench ? 'IT QUENCHES AT 121%' : 'QUENCHED' }), 1),
    beat('road', 'A SPARK COIL’S ENERGY', (t, s, k) => ({ v: lfPct(1 / (k * k)), v2: 'A MAGNET: 1 / (×c)²' })),
    beat('mercury', 'MERCURY FREEZES AT', (t, s, k) => ({ v: `${LFP.hgMelt(k).toFixed(1)} <small>°C</small>`, v2: LFP.hgMelt(k) >= LFP.tCold ? 'THE DOME: 6 °C · SOLID' : 'THE DOME: 6 °C' }), 1),
    beat('ring', 'GOLD SOAKS UP', (t, s, k) => { const e = LFP.goldEdge(k); return { v: e < 2.55 ? 'GREEN <small>and bluer</small>' : e < 2.75 ? 'BLUE <small>and bluer</small>' : e < 3.1 ? 'VIOLET <small>only</small>' : 'NO COLOUR <small>you can see</small>', v2: 'AT 9 PM: GREEN AND BLUER' }; }),
    beat('speaker', 'THE SPEAKER’S PUSH', (t, s, k) => ({ v: lfPct(1 / (k * k)), v2: `${LFP.speakerDb(k).toFixed(1)} dB` })),
    beat('board', 'A FRIDGE MAGNET’S GRIP', (t, s, k) => ({ v: lfPct(1 / (k * k)), v2: 'FRICTION HOLDS IT: UNTIL ¼' })),
    beat('fire', 'THE FIRE’S GLOW', (t, s, k) => ({ v: lfPct(1 / (k * k)), v2: 'SAME HEAT: ≈ 900 °C' }), 1),
    beat('waves', 'PLANKTON AND LED LIGHT', (t, s, k) => ({ v: lfPct(LFP.led(k)), v2: 'MORE OF THEIR ENERGY GOES TO HEAT' }), 1),
    beat('phones', 'A PHONE SCREEN', (t, s, k) => ({ v: lfPct(LFP.led(k)), v2: '' })),
    beat('colour', 'LIGHT A DYE CATCHES', (t, s, k) => ({ v: lfPct(1 / k), v2: 'AND YOUR EYES: ' + lfPct(LFP.eye(k)) }), 1),
    beat('day', 'SUNLIGHT ON THE DAY SIDE', (t, s, k) => (s < LFP.sSun ? { v: `${k.toFixed(1)}× <small>the heat</small>`, v2: 'LIGHT THAT LEFT THE SUN BEFORE 9:00' } : { v: LFP.sunNow(k) >= 1 ? `${LFP.sunNow(k).toFixed(1)}× <small>the heat</small>` : lfPct(LFP.sunNow(k)), v2: 'THE OLD SUNLIGHT HAS ALL ARRIVED' })),
    beat('heat', 'HEAT EARTH CAN SHED AS LIGHT', (t, s, k) => ({ v: lfPct(1 / (k * k)), v2: 'IT RADIATES 1 / (×c)² AS MUCH' })),
    beat('stars', 'STARLIGHT, AS YOU SEE IT', (t, s, k) => ({ v: lfPct(LFP.oldLight(k)), v2: `ARRIVING ${Math.round(k)}× FASTER · EYES CATCH ${lfPct(LFP.eye(k))}` }), 1),
    beat('runout', 'OLD LIGHT ALREADY SWALLOWED', (t, s, k) => ({ v: `${Math.round((k - 1) / LFP.LN).toLocaleString('en-US')} <small>light-seconds</small>`, v2: 'SATURN’S: 9,070' }), 1),
    beat('stretch', 'GREEN LIGHT’S WAVES', (t, s, k) => ({ v: `${(0.55 * k / 1000).toFixed(2)} <small>mm</small>`, v2: `0.00055 mm AT 9 PM · YOUR EYE BLURS ${(LFP.eyeBlur(k) * 57.3).toFixed(1)}°` })),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const LF_TAGS = (() => { const b = (id, text, k0 = 0) => [lfC(id, k0) - 0.1, lfE(id) + 0.2, text]; return [
  b('real', 'THE ONE IMPOSSIBLE THING: c GROWS WHILE THE ELECTRON, ħ, ε₀ AND G STAY', 1),
  b('gps', 'ROUGH: A REAL RECEIVER WOULD FAIL IN MESSIER WAYS', 1),
  b('magnet', 'μ₀ = 1 / ε₀c²: WITH ε₀ FIXED, MAGNETISM WEAKENS AS 1 / c²', 1),
  b('mercury', 'RELATIVITY LOWERS MERCURY’S MELTING POINT BY 105 K (CALVO ET AL. 2013)', 1),
  b('fire', 'HOW BRIGHT THINGS LOOK HERE: YOUR EYES ADJUSTING (THE FILM’S EXPOSURE), NEVER IN FULL', 1),
  b('stars', 'THE STARS ON SCREEN ARE NOT BOOSTED: k × YOUR EYE’S CATCH', 1),
  b('stretch', 'A PHOTON KEEPS ITS ENERGY, SO ITS WAVE GROWS AS c · BLUR: 1.22 λ / D, D = 7 mm'),
]; })();
// the insets: [from, to, which, where]
const LF_INSETS = (() => { const b = (id, k0, k1, w, where = '') => [lfC(id, k0) - 0.25, (k1 != null ? lfCap(id, k1).hide : lfE(id)) + 0.3, w, where]; return [
  b('magnet', 0, null, 'mu', 'mid'), b('ring', 0, null, 'gold'), b('speaker', 0, null, 'spk'), b('day', 0, null, 'globe', 'mid'), b('runout', 0, null, 'column', 'mid'), b('pupil', 0, null, 'wave', 'mid'),
]; })();
// the ladder (right): off. Both reviewers (5 November 2026) found it unreadable at phone size and that it made the film
// read as a checklist; the HUD's NEXT line carries what's coming. (Kept as code: add [from, to, row] entries to use it.)
const LF_LADDER = [];

// a caption's text with its numbers in amber
function lfCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/×?[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?°C|\s?%|\s(?:million|thousand|hours|hour|minutes|minute|seconds|second|volts|times|km\/h|m\/s|km|kg|cm|m|s)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class LfHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('lf-ro', '<div class="l">THE SPEED OF LIGHT</div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('lf-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('lf-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('lf-band'); this.cap = mk('lf-cap'); this.tag = mk('lf-tag');
    this.caps = LFT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: lfCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('lf-inset'); this.ladder = mk('lf-inset ladder');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null; this._ladKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : lfStoryAt(t), rate = lfRateAt(t), k = LFP.k(s);
    void app;
    // ---- the speed of light (from just after the title)
    const ra = W(t, LF.title[1] - 0.5, LF.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._html('rov', this.roV, `${lfCkm(s)}<small> km/s</small>`);
      this._html('ros', this.roS, s <= 0.0005 ? 'AS IT HAS ALWAYS BEEN' : `<b>${lfKx(k)}</b> · 1% FASTER EVERY SECOND`);
      const nx = LF_MARKS.find((x) => x[0] > k * 1.0005);
      this._html('ron', this.roN, nx && s > 0 ? `NEXT ${lfKx(nx[0])} · ${nx[1]}` : '');
      const hit = LF_MARKS.some((x) => k >= x[0] && k < x[0] * 1.012);
      this._cls('roc', this.ro, hit ? 'lf-ro hit' : 'lf-ro');
    }
    // ---- the context box
    const cx = LF_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, k); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = LF_TAGS.find((x) => t >= x[0] && t < x[1]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- Saturday and the time; how slowed down, or a jump
    const ca = W(t, LF.title[1] - 0.5, LF.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = lfClockParts(s), ms = rate < 0.9 ? `<small>.${String(c.ms).padStart(3, '0')}</small>` : '';
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small>${ms} <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = LF_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 90 ? Math.round(j.ds / 60) + ' min' : Math.round(j.ds) + ' s') : '';
      const tl = rate < 0.9 ? Math.round(1 / rate) + '× SLOWER' : 'REAL SPEED';
      this._txt('ckf', this.clockF, jl ? jl + '  ·  ' + tl : tl);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = LFT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'lf-cap q' : 'lf-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, s, k);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    this._ladderUpd(t, k);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'lf-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = LfHud._p || (LfHud._p = new THREE.Vector3());
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
      // a label never sits on a diagram: while one is up, a label whose box would touch it is hidden
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) d.style.opacity = '0'; }
      d.className = right ? 'lf-lab r' : 'lf-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  _insets(t, s, k) {
    const W = StoryHUD.win, which = LF_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'lf-inset' : ('lf-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(s * 20);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = LfHud[which[2]](u, t, s, k);
  }
  _ladderUpd(t, k) {
    const W = StoryHUD.win, L = LF_LADDER.find((x) => t >= x[0] && t < x[1]), a = L ? W(t, L[0], L[1], 0.45, 0.4) : 0;
    this._set('lda', this.ladder, 'opacity', a.toFixed(3));
    if (!L) return;
    const key = L[2] + '|' + Math.round(k * 400);
    if (key === this._ladKey) return;
    this._ladKey = key;
    this.ladder.innerHTML = LfHud.ladderSvg(L[2], k);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="lfAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // the ladder of what breaks when: each landmark's ×c; those passed are ticked, this beat's lit
  static ladderSvg(hot, k) {
    const w = 380, h = 676, rows = LF_MARKS.slice(0, 12), top = 70, rh = (h - top - 20) / rows.length;
    let body = `${LfHud.plate(0.62, w, h)}<text x="24" y="46" class="sm" style="font-size:25px;fill:#f6efe2">AS LIGHT SPEEDS UP…</text>`;
    rows.forEach(([kk, l], i) => { const y = top + i * rh, done = k >= kk, isHot = i === hot;
      body += `<text x="24" y="${(y + rh * 0.62).toFixed(1)}" class="sm" style="font-size:22px;fill:${isHot ? '#ffcf8a' : done ? '#f6efe2' : 'rgba(200,194,182,0.55)'}">${lfKx(kk).replace('×', '×')}</text>
        <text x="118" y="${(y + rh * 0.62).toFixed(1)}" class="sm" style="font-size:19px;fill:${isHot ? '#ffffff' : done ? '#e2dccf' : 'rgba(200,194,182,0.45)'}">${l}</text>`;
      if (done) body += `<circle cx="${w - 22}" cy="${(y + rh * 0.5).toFixed(1)}" r="6" fill="${isHot ? '#ffcf8a' : 'rgba(246,239,226,0.7)'}"/>`; });
    return LfHud.svg(body, w, h);
  }
  // light is electricity and magnetism moving: c = 1/√(ε₀μ₀); keep the electron's charge and ε₀, and μ₀ must fall as 1/c²
  static mu(u, t, s, k) {
    const a1 = MathX.smooth(u, 0.2, 0.9), a2 = MathX.smooth(t, lfC('magnet', 1) - 0.2, lfC('magnet', 1) + 0.5), bar = 300 / (k * k);
    return LfHud.svg(`${LfHud.plate()}
      <text x="30" y="58" class="t">LIGHT = ELECTRICITY + MAGNETISM</text>
      <g opacity="${a1.toFixed(3)}"><text x="30" y="150" class="b" style="font-size:54px">c = 1 / √(ε₀ μ₀)</text>
        <text x="30" y="200" class="sm">ε₀: HOW STRONGLY CHARGES PULL · FIXED HERE</text></g>
      <g opacity="${a2.toFixed(3)}"><text x="30" y="282" class="b" style="font-size:54px;fill:#ffcf8a">μ₀ = 1 / (ε₀ c²)</text>
        <text x="30" y="330" class="sm">μ₀: HOW STRONG MAGNETISM IS</text>
        <rect x="30" y="368" width="300" height="26" rx="8" fill="rgba(246,239,226,0.18)"/><rect x="30" y="368" width="${bar.toFixed(1)}" height="26" rx="8" fill="#ffcf8a"/>
        <text x="350" y="390" class="s">${lfPct(1 / (k * k))} OF 9 PM</text>
        <text x="30" y="440" class="sm">2× FASTER LIGHT → 4× WEAKER MAGNETS</text></g>`);
  }
  // gold: reflectance against wavelength; the edge (where it starts soaking up light) at 9 PM and now
  static gold(u, t, s, k) {
    const x = (nm) => 60 + (nm - 350) / (750 - 350) * 640, le0 = 1240 / LFP.goldEdge(1), le = 1240 / LFP.goldEdge(k);
    const curve = (lev) => { let d = ''; for (let nm = 350; nm <= 750; nm += 5) { const R = 0.3 + 0.62 / (1 + Math.exp(-(nm - lev) / 13)); d += (nm === 350 ? 'M' : 'L') + x(nm).toFixed(1) + ' ' + (380 - R * 250).toFixed(1); } return d; };
    const spec = [['#6a3aa0', 400, 450], ['#2a5cff', 450, 495], ['#2aa84a', 495, 570], ['#e8d02a', 570, 590], ['#ff8a1a', 590, 620], ['#e8231a', 620, 700]].map(([c, a, b]) => `<rect x="${x(a).toFixed(1)}" y="394" width="${(x(b) - x(a)).toFixed(1)}" height="16" fill="${c}"/>`).join('');
    const c0 = lfGoldRGB(1), c1 = lfGoldRGB(k), css = (c) => `rgb(${c.map((v) => Math.round(255 * Math.pow(Math.min(1, v), 1 / 2.2))).join(',')})`;
    return LfHud.svg(`${LfHud.plate()}
      <text x="30" y="58" class="t">HOW MUCH LIGHT GOLD REFLECTS</text>
      ${spec}<text x="${x(400)}" y="440" text-anchor="middle" class="sm">VIOLET</text><text x="${x(700)}" y="440" text-anchor="middle" class="sm">RED</text><text x="${x(550)}" y="440" text-anchor="middle" class="sm">THE COLOURS OF 9 PM</text>
      <path d="${curve(le0)}" fill="none" stroke="rgba(246,239,226,0.45)" stroke-width="3" stroke-dasharray="8 7"/>
      <path d="${curve(le)}" fill="none" stroke="#ffcf8a" stroke-width="4"/>
      <circle cx="640" cy="120" r="34" fill="${css(c0)}"/><text x="640" y="182" text-anchor="middle" class="sm">9 PM</text>
      <circle cx="720" cy="120" r="34" fill="${css(c1)}" stroke="#fff" stroke-width="2"/><text x="720" y="182" text-anchor="middle" class="sm">NOW</text>`);
  }
  // a speaker: magnet, coil, cone; the push ∝ B ∝ 1/k²
  static spk(u, t, s, k) {
    const f = 1 / (k * k), wob = 18 * f * Math.max(0, Math.sin(t * 2 * Math.PI * 2)) ** 4;
    return LfHud.svg(`${LfHud.plate()}
      <text x="30" y="58" class="t">A SPEAKER</text>
      <rect x="90" y="170" width="120" height="160" rx="8" fill="#5a5f66"/><text x="150" y="360" text-anchor="middle" class="sm">MAGNET</text>
      <rect x="210" y="215" width="${(36 + wob).toFixed(1)}" height="70" fill="#ffcf8a"/><text x="232" y="160" text-anchor="middle" class="sm">COIL</text>
      <path d="M${(246 + wob).toFixed(1)} 215 L${(420 + wob).toFixed(1)} 110 L${(420 + wob).toFixed(1)} 390 L${(246 + wob).toFixed(1)} 285 Z" fill="rgba(246,239,226,0.25)" stroke="#f6efe2" stroke-width="3"/>
      <text x="470" y="200" class="s">PUSH ∝ MAGNET</text><text x="470" y="250" class="b" style="font-size:44px">${lfPct(f)}</text><text x="470" y="300" class="sm">OF 9 PM</text>`);
  }
  // the day side: sunlight already on its way arrives k× faster (k× the heat); at 9:03 it has all arrived
  static globe(u, t, s, k) {
    const out = s >= LFP.sSun, f = LFP.sunNow(k), gl = Math.min(1, 0.1 + 0.15 * Math.min(f, 6)), n = Math.max(1, Math.min(14, 1 + Math.round(f * 2.2))), ro = Math.min(0.9, 0.15 + 0.75 * Math.min(1, f));
    let rays = ''; for (let i = 0; i < n; i++) { const y = 120 + i * (230 / Math.max(1, n - 1)); rays += `<line x1="30" y1="${y.toFixed(1)}" x2="240" y2="${y.toFixed(1)}" stroke="#ffcf8a" stroke-width="3" marker-end="url(#lfAh)" opacity="${ro.toFixed(2)}"/>`; }
    return LfHud.svg(`${LfHud.plate()}
      <text x="30" y="58" class="t">THE DAY SIDE, FROM THE SUN</text>${rays}
      <circle cx="480" cy="235" r="150" fill="#0b1830"/><path d="M480 85 A150 150 0 0 0 480 385 Z" fill="rgba(255,214,150,${gl.toFixed(2)})"/>
      <circle cx="620" cy="190" r="8" fill="#9fc4ff"/><text x="636" y="196" class="sm" style="fill:#9fc4ff">YOU</text>
      <text x="30" y="440" class="s">${out ? `9:03 · THE OLD LIGHT HAS ARRIVED: ${f >= 1 ? f.toFixed(1) + '×' : lfPct(f)} THE HEAT` : `ARRIVING ${f.toFixed(1)}× AS FAST: ${f.toFixed(1)}× THE HEAT`}</text>`);
  }
  // green light's wave against your pupil (7 mm): the wave grows as c; past the pupil's width almost none of it gets in
  static wave(u, t, s, k) {
    const mm = 20, L = 0.55e-3 * k * mm, cy = 250, x0 = 330, ph = (t * 0.9) % 1;
    let d = ''; for (let x = 40; x <= 720; x += 4) { const y = cy + 46 * Math.sin(2 * Math.PI * ((x - x0) / L - ph)); d += (x === 40 ? 'M' : 'L') + x + ' ' + y.toFixed(1); }
    return LfHud.svg(`${LfHud.plate()}
      <text x="30" y="58" class="t">GREEN LIGHT, AND YOUR PUPIL</text>
      <path d="${d}" fill="none" stroke="#9fe0a8" stroke-width="4" opacity="0.9"/>
      <ellipse cx="${x0}" cy="${cy}" rx="18" ry="${(3.5 * mm).toFixed(1)}" fill="none" stroke="#f6efe2" stroke-width="4"/>
      <text x="${x0}" y="${cy + 3.5 * mm + 40}" text-anchor="middle" class="sm">YOUR PUPIL · 7 mm</text>
      <line x1="${x0 + 60}" y1="132" x2="${(x0 + 60 + L).toFixed(1)}" y2="132" stroke="#9fe0a8" stroke-width="3"/>
      <text x="${x0 + 60}" y="118" class="sm" style="fill:#9fe0a8">ONE WAVE · ${(L / mm).toFixed(1)} mm</text>
      <text x="30" y="440" class="s">LIGHT GETTING IN: ${lfPct(LFP.through(k))}</text>`);
  }
  // the old light: a column from each star to you, swallowed at the near end faster and faster
  static column(u, t, s, k) {
    const D = (k - 1) / LFP.LN, x = (ls) => 60 + 640 * Math.log10(1 + ls) / Math.log10(1 + LFP.dAlphaCen * 1.3);
    const marks = [[499, 'SUN'], [LFP.dSaturn, 'SATURN'], [LFP.dAlphaCen, 'NEAREST STAR']];
    return LfHud.svg(`${LfHud.plate()}
      <text x="30" y="58" class="t">LIGHT ALREADY ON ITS WAY TO YOU</text>
      <rect x="60" y="200" width="640" height="40" rx="10" fill="rgba(255,207,138,0.75)"/>
      <rect x="60" y="200" width="${(x(D) - 60).toFixed(1)}" height="40" rx="10" fill="#0b0e14" stroke="rgba(246,239,226,0.5)" stroke-width="2"/>
      ${marks.map(([d, l]) => `<line x1="${x(d).toFixed(1)}" y1="186" x2="${x(d).toFixed(1)}" y2="254" stroke="#f6efe2" stroke-width="2"/><text x="${x(d).toFixed(1)}" y="${l === 'SATURN' ? 290 : 176}" text-anchor="${l === 'NEAREST STAR' ? 'end' : 'middle'}" class="sm">${l}</text>`).join('')}
      <text x="60" y="330" class="sm">YOU</text><text x="700" y="330" text-anchor="end" class="sm">FURTHER OUT (log scale)</text>
      <text x="30" y="420" class="s">SWALLOWED: ${Math.round(D).toLocaleString('en-US')} LIGHT-SECONDS</text>`);
  }
}
