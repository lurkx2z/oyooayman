/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / Air solid / Light no bounce films':
     top left     EVERY MAGNET: ×1 or ×1,000; while they're ×1,000, how long until they're back (to the hundredth); the
                  next thing due ("NEXT · 10:42:00.012 · THE CRANE'S ROPE SNAPS")
     top right    Saturday and the time (to the millisecond in the slow part); 380× SLOWER or REAL SPEED; "+1 min" when
                  the clock jumps at a cut (it only ever runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       the pull on steel by distance (the cube law); tesla, from a fridge magnet to the frog to this MRI; the
                  squeeze inside a magnet; the pull on your boat by distance (while one is up, the context box steps aside)
     bottom left  the honest labels (what is impossible, what is rough)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// what's due next (story s, label); when your boat comes within d metres of the ball
function mgBoatAt(d) { for (let x = 1; x < MGP.T; x += 0.002) if (MGB.dist(x) < d) return x; return null; }
const MG_NEXT = [
  [0, 'EVERY MAGNET ×1,000'], [MG_SMALL.cyl.wall, 'THE CYLINDER HITS THE WALL'], [MG_SMALL.cyl.hit, 'THE CYLINDER HITS THE SCANNER'],
  [Math.min(...MG_SMALL.wait.filter((w) => w.hit != null).map((w) => w.hit)), 'THE FIRST PHONE HITS THE WAITING ROOM WALL'],
  [MG_AT.carUp, 'THE FIRST CAR LEAVES THE GROUND'], ...[19, 18.5, 18, 17, 16].map((d) => [mgBoatAt(d), `YOUR BOAT PASSES ${d} m`]),
  [6.088, 'THE KETTLE FALLS'], [MG_SMALL.phone.rel, 'YOUR PHONE IS TORN AWAY'], [MG_SMALL.phone.hit, 'YOUR PHONE HITS THE BALL'],
  [MGP.bikeRel, 'YOUR BIKE GOES'], [MGB.hit, 'YOUR BOAT HITS THE WALL'], [MGP.T, 'BACK TO NORMAL'],
].filter((x) => x[0] != null).sort((a, b) => a[0] - b[0]);
const mgClockStr = (s, ms = true) => { const c = mgClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}${ms ? '.' + String(c.ms).padStart(3, '0') : ''}`; };
const mgN = (x) => Math.round(x).toLocaleString('en-US');
const mgT = (kg) => mgN(kg / 1000);
// the scene's context box: [from, to, label, value(t, s, set) → { v, v2 }] (HTML)
const MG_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [mgC(id, k0) - 0.2, (k1 != null ? mgCap(id, k1).hide : mgE(id)) + 0.2, l, f];
  const cylV = (s) => { const C = MG_SMALL.cyl, a = Math.max(0.005, s), d = 0.005; return Math.max(0, (C.at(a - d) - C.at(a + d)) / (2 * d)); };   // (centred over 10 ms: the track is stored in steps)
  const phoneV = (s) => {
    const ph = MG_SMALL.phone, P = MGP;
    if (s < ph.rel) { const h = mgOnBoat(s, ...MG_SMALL.hand), M = MGY.magAt(s), r = Math.hypot(M[0] - h[0], M[1] - h[1], M[2] - h[2]); return { v: `${(P.phoneM * P.K * P.G(r) / P.phoneKg / P.g).toFixed(2)}× <small>its weight</small>`, v2: `YOUR GRIP HOLDS ABOUT ${P.phoneGrip}×` }; }
    if (s < ph.hit) { const a = ph.at(s), b = ph.at(s + 0.002), v = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.002, M = MGY.magAt(s); return { v: `${mgN(v * 3.6)} <small>km/h</small>`, v2: `${Math.max(0, Math.hypot(M[0] - a[0], M[1] - a[1], M[2] - a[2]) - MGY.R(s)).toFixed(1)} m TO THE BALL` }; }
    return { v: 'ON THE BALL', v2: `HIT AT ${mgN(P.phoneKmh)} km/h` };
  };
  const onWall = (s) => MG_SMALL.wait.filter((w) => w.hit != null && s >= w.hit).length;
  return [
    beat('pile', 'STEEL ON THE MAGNET', (t, s) => ({ v: `${mgT(MGY.massAt(s))} <small>tonnes</small>`, v2: 'ITS USUAL LOAD: ONE CAR, ABOUT 1 TONNE' }), 1),
    beat('reach', 'STEEL FLIES UP TO IT FROM', (t, s) => ({ v: `${MGP.reachK.toFixed(1)} <small>m</small>`, v2: `BEFORE 10:42: ${MGP.reach1.toFixed(1)} m` }), 1),
    beat('mri', 'THE MRI’S MAGNET', (t, s) => ({ v: `${mgN(MGP.mriB)} <small>tesla</small>`, v2: 'A FRIDGE MAGNET: 0.005 · EARTH: 0.00005' }), 1, 1),
    beat('cylinder', 'THE OXYGEN CYLINDER', (t, s) => (s < MG_SMALL.cyl.hit ? { v: `${mgN(cylV(s) * 3.6)} <small>km/h</small>`, v2: `${MG_SMALL.cyl.at(Math.max(0, s)).toFixed(2)} m FROM THE MAGNET` } : { v: 'IN THE SCANNER', v2: '' })),
    beat('waiting', 'PHONES PULLED OUT OF HANDS', (t, s) => ({ v: `${onWall(s)} <small>of 6 on the wall</small>`, v2: `PULLED AT ${MGP.waitG.toFixed(1)}× THEIR WEIGHT` }), 1),
    beat('speed', 'THE BALL OF STEEL', (t, s) => ({ v: `${mgT(MGY.massAt(s))} <small>tonnes</small>`, v2: `${(2 * MGY.R(s)).toFixed(1)} m ACROSS · HITS AT UP TO ${mgN(MGP.vMaxKmh)} km/h` })),
    beat('boat', 'YOUR BOAT', (t, s) => ({ v: `${MGB.dist(s).toFixed(1)} <small>m from the ball</small>`, v2: `SLIDING SIDEWAYS AT ${(Math.abs(MGB.vz(s)) * 3.6).toFixed(1)} km/h` }), 1, 1),
    beat('real', 'ITS TWO ENDS SQUEEZE EACH OTHER WITH', (t, s) => ({ v: `${(MGP.atm / 1e6).toFixed(1)} <small>million atmospheres</small>`, v2: `EARTH’S CENTRE: ${(MGP.earthCore / 101325 / 1e6).toFixed(1)} MILLION` }), 2),
    beat('cars', 'OLD CARS ON THE YARD', (t, s) => ({ v: `${MGY.cars.filter((c) => c.firstHit != null && s >= c.firstHit).length} <small>of ${MGY.cars.length} on the ball</small>`, v2: 'A TONNE EACH, MOSTLY STEEL' })),
    beat('turbine', 'EACH BLADE', (t, s) => ({ v: `10 <small>tonnes · 45 m</small>`, v2: `THE HUB: ${MG_F.hub} m UP` }), 1),
    beat('boat2', 'THE PULL ON YOUR BOAT', (t, s) => ({ v: `${(MGP.boatPull(s) / MGP.thrust).toFixed(1)}× <small>the engine</small>`, v2: `${MGB.dist(s).toFixed(1)} m FROM THE BALL` }), 1),
    beat('phonehit', 'YOUR PHONE', (t, s) => phoneV(s)),
    beat('close', 'GAP TO THE WALL', (t, s) => ({ v: `${MGB.gap(s).toFixed(1)} <small>m</small>`, v2: `UPWARD PULL: ${Math.round(100 * Math.max(0, MGB.Fy(s)) / (MGP.boatKg * MGP.g))}% OF ITS WEIGHT` })),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const MG_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [mgC(id, k0) - 0.1, (k1 != null ? mgCap(id, k1).hide : mgE(id)) + 0.2, text]; return [
  b('start', 'THE RULE: EVERY MAGNET’S FIELD ×1,000 · EARTH’S OWN FIELD STAYS AS IT IS', 0),
  b('radio', 'A SPEAKER’S COIL MOVES IN A MAGNET’S FIELD: AT 1,000× THE FIELD, IT BRAKES ITSELF ALMOST DEAD', 1),
  b('pile', 'APPROX.: A 1.8 m LIFTING MAGNET, ABOUT 1 TESLA AT ITS FACE', 0, 1),
  b('reach', 'FAR AWAY, A MAGNET’S FIELD FADES AS 1 / DISTANCE³', 0, 0),
  b('reach', 'GENEROUS: OUR SCRAP MAGNET IS DRAWN STRONGER THAN A REAL ONE THIS SIZE', 1),
  b('mri', 'APPROX.: THE MRI’S FIELD FAR AWAY ≈ 0.032 / DISTANCE³ TESLA', 2),
  b('water', 'WATER IS VERY WEAKLY PUSHED AWAY BY A FIELD (DIAMAGNETIC)', 0, 1),
  b('real', 'THE IMPOSSIBLE PART: THE MAGNETS SURVIVE, AND THE FIELD’S ENERGY COMES FROM NOWHERE', 1),
  b('waiting', 'A PHONE’S MAGNETS TURN IT LIKE A COMPASS NEEDLE: THE TWIST BEATS THE GRIP FIRST', 1),
  b('back', 'APPROX.: THE CORE WAS SQUEEZED AT HUNDREDS OF MEGAPASCALS; PARTS OF IT WELDED', 3),
  b('road', 'A MOTOR’S MAGNETS SWEEPING PAST ITS COILS MAKE A CURRENT THAT FIGHTS THEM · PETROL CARS DON’T', 1),
  b('turbine', 'APPROX.: THE GENERATORS LOCK; THE BLADES SNAP OFF AT THE ROOT', 1),
  b('boat2', 'APPROX.: THE WATER’S DRAG ON A HULL SLIDING SIDEWAYS GROWS AS SPEED²', 1),
  b('inside', 'YOUR BLOOD’S IRON IS BOUND IN HAEMOGLOBIN: BARELY MAGNETIC', 1, 1),
  b('phonehit', 'APPROX.: A HAND HOLDS A PHONE AGAINST ABOUT 5× ITS WEIGHT', 0),
  b('after', 'STEEL LEFT IN A STRONG FIELD KEEPS A LITTLE MAGNETISM', 0),
]; })();
// the insets: [from, to, which, where]
const MG_INSETS = (() => { const b = (id, k0, k1, w, where = '') => [mgC(id, k0) - 0.25, (k1 != null ? mgCap(id, k1).hide : mgE(id)) + 0.3, w, where]; return [
  b('reach', 0, null, 'cube'), b('water', 0, 0, 'frog'), b('real', 1, 1, 'squeeze', 'mid'), b('boat', 2, 2, 'pullgraph'),
]; })();

// a caption's text with its numbers in amber
function mgCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/×?[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?°C|\s?%|\s(?:million|thousand|hours|hour|minutes|minute|seconds|second|times|km\/h|m\/s|metres|tesla|tonnes|atmospheres|km|kg|cm|g|m|s)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class MgHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('mg-ro', '<div class="l">EVERY MAGNET</div><div class="v"></div><div class="s"></div><div class="s nx"></div><div class="s bt"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx'); this.roB = this.ro.querySelector('.bt');
    this.ctx = mk('mg-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('mg-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('mg-band'); this.cap = mk('mg-cap'); this.tag = mk('mg-tag');
    this.count = mk('mg-count');
    this.caps = MGT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: mgCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('mg-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : mgStoryAt(t), rate = mgRateAt(t), b = !(s >= 0 && s < MGP.T);
    void app;
    // ---- the magnets: ×1 / ×1,000, the time left, what's next
    const ra = W(t, MG.title[1] - 0.5, MG.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._html('rov', this.roV, b ? '×1' : '×1,000');
      const left = MGP.T - s;
      this._html('ros', this.roS, s < 0 ? 'AS STRONG AS THEY ALWAYS ARE' : s < MGP.T ? `BACK TO NORMAL IN <b>${left.toFixed(2)} s</b>` : 'BACK TO NORMAL SINCE 10:42:10');
      const nx = MG_NEXT.find((x) => x[0] > s + 1e-4);
      this._html('ron', this.roN, nx && s >= -4 && s < MGP.T ? `NEXT · ${mgClockStr(nx[0], true)} · ${nx[1]}` : '');
      // (your boat, from the moment it starts to slide until 10:42:10: never out of mind)
      this._html('rob', this.roB, t >= mgB('boat') && s < MGP.T ? `YOUR BOAT · <b>${MGB.dist(s).toFixed(1)} m</b> FROM THE BALL` : '');
      this._cls('roc', this.ro, b ? 'mg-ro' : (left < 3.05 ? 'mg-ro dark tick' : 'mg-ro dark'));
    }
    // ---- the context box
    const cx = MG_CTX.find((x) => t >= x[0] && t < x[1]), inA = (() => { const w = MG_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    // (the tag steps aside while a caption runs to two lines: it would touch it)
    const tg = MG_TAGS.find((x) => t >= x[0] && t < x[1]);
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- Saturday and the time; how slowed down, or a jump
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
    // ---- the last three seconds: the count, big
    { const left = MGP.T - s, on = t >= mgB('count') && s < MGP.T + 0.02;
      this._set('cnta', this.count, 'opacity', on ? '1' : '0');
      if (on) { this._txt('cntv', this.count, left > 0.005 ? String(Math.ceil(left - 1e-6)) : '0'); this._cls('cntc', this.count, left < 0.02 ? 'mg-count hit' : 'mg-count'); } }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = MGT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'mg-cap q' : 'mg-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    const two = cp && this.root.clientHeight ? this.cap.offsetHeight / this.root.clientHeight > 0.095 : false;
    this._set('tga', this.tag, 'opacity', tg && !two ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagrams
    this._insets(t, s, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'mg-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = MgHud._p || (MgHud._p = new THREE.Vector3());
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
      d.className = right ? 'mg-lab r' : 'mg-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  _insets(t, s, set) {
    const W = StoryHUD.win, which = MG_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'mg-inset' : ('mg-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(s * 200);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = MgHud[which[2]](u, t, s, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="mgAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.86, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static cross(x, y, r = 22) { return `<path d="M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}" stroke="#ff6a5a" stroke-width="6" stroke-linecap="round"/>`; }
  // a line of text that always fits: past maxW (its width estimated from the class's capitals) its font shrinks to fit
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  // a log-scale y axis: value → y (y0 at lo, y1 at hi)
  static ly(v, lo, hi, y0, y1) { const k = (Math.log10(Math.max(v, lo)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)); return y0 + (y1 - y0) * MathX.clamp(k, 0, 1.04); }
  // the pull on a kilogram of steel, by distance: before 10:42 and now (log scale); where it beats its weight
  static cube(u) {
    const T = MgHud.tx, x0 = 120, x1 = 720, r1 = 20, yb = 400, yt = 110, lo = 0.01, hi = 10000, X = (r) => x0 + (x1 - x0) * r / r1, Y = (g) => MgHud.ly(g, lo, hi, yb, yt);
    const a = MathX.smooth(u, 1.6, 3.2);
    const path = (k, f) => { let d = ''; for (let r = 0.4; r <= Math.max(0.5, r1 * f) + 1e-6; r += 0.1) d += (d ? 'L' : 'M') + X(r).toFixed(1) + ' ' + Y(MGP.pull(r, k) / MGP.g).toFixed(1); return d; };
    const ticks = [0.01, 1, 100, 10000].map((g) => `<line x1="${x0 - 8}" y1="${Y(g)}" x2="${x0}" y2="${Y(g)}" stroke="#9aa" stroke-width="2"/><text x="${x0 - 14}" y="${Y(g) + 9}" text-anchor="end" class="sm">${g < 1 ? g : mgN(g)}</text>`).join('');
    return MgHud.svg(`${MgHud.plate()}${T(30, 56, 't', 'PULL ON STEEL (× ITS WEIGHT), BY DISTANCE')}
      <line x1="${x0}" y1="${yb}" x2="${x1}" y2="${yb}" stroke="#9aa" stroke-width="2"/><line x1="${x0}" y1="${yt - 10}" x2="${x0}" y2="${yb}" stroke="#9aa" stroke-width="2"/>${ticks}
      ${[0, 5, 10, 15, 20].map((r) => `<text x="${X(r)}" y="${yb + 32}" text-anchor="middle" class="sm">${r} m</text>`).join('')}
      <line x1="${x0}" y1="${Y(1)}" x2="${x1}" y2="${Y(1)}" stroke="#ffcf8a" stroke-width="2" stroke-dasharray="8 8"/>${T(x1 - 170, Y(1) + 34, 'sm', 'ITS WEIGHT', 170)}
      <path d="${path(1, 1)}" fill="none" stroke="#9fc4ff" stroke-width="5"/>
      <circle cx="${X(MGP.reach1)}" cy="${Y(1)}" r="8" fill="#9fc4ff"/>${T(X(MGP.reach1) + 14, Y(1) + 34, 'sm', `BEFORE: ${MGP.reach1.toFixed(1)} m`, 250)}
      <g opacity="${a.toFixed(2)}"><path d="${path(MGP.K, MathX.clamp(a * 1.2, 0, 1))}" fill="none" stroke="#ff8a6a" stroke-width="5"/>
      <circle cx="${X(MGP.reachK)}" cy="${Y(1)}" r="8" fill="#ff8a6a"/>${T(X(MGP.reachK) - 60, Y(1) - 22, 's', `NOW: ${MGP.reachK.toFixed(1)} m`, 260)}</g>`);
  }
  // tesla, from a fridge magnet to this MRI (log scale)
  static frog(u) {
    const T = MgHud.tx, rows = [['A FRIDGE MAGNET', MGP.fridge, '#9aa4ae'], ['AN MRI, ANY OTHER DAY', MGP.mriB0, '#9fc4ff'], ['FLOATED A LIVE FROG (1997)', MGP.frogT, '#9fe0a8'], ['THIS MRI, NOW', MGP.mriB, '#ff8a6a']];
    const x0 = 40, x1 = 720, lo = 0.001, hi = 5000, X = (v) => x0 + (x1 - x0) * (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
    const bars = rows.map(([l, v, c], i) => { const y = 100 + i * 88, a = MathX.smooth(u, 0.3 + i * 0.6, 0.9 + i * 0.6); return `<g opacity="${a.toFixed(2)}"><rect x="${x0}" y="${y}" width="${(X(v) - x0).toFixed(1)}" height="32" rx="6" fill="${c}"/>${T(x0, y + 64, 'sm', `${l} · ${v < 1 ? v : mgN(v)} TESLA`, 680)}</g>`; }).join('');
    return MgHud.svg(`${MgHud.plate()}${T(30, 58, 't', 'HOW STRONG (EACH STEP: ×10)')}${bars}`);
  }
  // inside a magnet: its two ends squeeze each other (B² / 2μ₀): before, Earth's centre, now
  static squeeze(u) {
    const T = MgHud.tx, x0 = 40, x1 = 720, max = MGP.atm, X = (v) => x0 + (x1 - x0) * v / max, a = MathX.smooth(u, 0.8, 2.0), atm1 = MGP.pressure / (MGP.K * MGP.K) / 101325;
    return MgHud.svg(`${MgHud.plate()}${T(30, 58, 't', 'HOW HARD A MAGNET’S ENDS SQUEEZE')}
      <rect x="${x0}" y="110" width="6" height="40" fill="#9fc4ff"/>${T(x0, 190, 'sm', `BEFORE 10:42: ${atm1.toFixed(0)} ATMOSPHERES`, 680)}
      <g opacity="${a.toFixed(2)}"><rect x="${x0}" y="225" width="${(X(MGP.earthCore / 101325) - x0).toFixed(1)}" height="40" rx="6" fill="#d8a46a"/>${T(x0, 305, 'sm', `EARTH’S CENTRE: ${(MGP.earthCore / 101325 / 1e6).toFixed(1)} MILLION`, 680)}</g>
      <g opacity="${MathX.smooth(u, 2.2, 3.2).toFixed(2)}"><rect x="${x0}" y="340" width="${x1 - x0}" height="40" rx="6" fill="#ff8a6a"/>${T(x0, 425, 's', `NOW: ${(MGP.atm / 1e6).toFixed(1)} MILLION ATMOSPHERES`, 680)}</g>`);
  }
  // the pull on your boat, by distance (log scale): where the boat is now; your mum's engine
  static pullgraph(u, t, s) {
    const T = MgHud.tx, x0 = 110, x1 = 720, ra = 4, rb = 24, yb = 400, yt = 110, lo = 0.3, hi = 3000, X = (r) => x0 + (x1 - x0) * (r - ra) / (rb - ra), Y = (kn) => MgHud.ly(kn, lo, hi, yb, yt);
    const F = (r) => MGP.pull(r) * MGP.boatSteel / 1000;
    let d = ''; for (let r = ra; r <= rb + 1e-6; r += 0.1) d += (d ? 'L' : 'M') + X(r).toFixed(1) + ' ' + Y(F(r)).toFixed(1);
    const bd = MGB.dist(s), m20 = F(20), m10 = F(10), a = MathX.smooth(u, 1.0, 2.0);
    return MgHud.svg(`${MgHud.plate()}${T(30, 56, 't', 'PULL ON YOUR BOAT, BY DISTANCE')}
      <line x1="${x0}" y1="${yb}" x2="${x1}" y2="${yb}" stroke="#9aa" stroke-width="2"/><line x1="${x0}" y1="${yt - 10}" x2="${x0}" y2="${yb}" stroke="#9aa" stroke-width="2"/>
      ${[5, 10, 15, 20].map((r) => `<text x="${X(r)}" y="${yb + 32}" text-anchor="middle" class="sm">${r} m</text>`).join('')}
      <line x1="${x0}" y1="${Y(MGP.thrust / 1000)}" x2="${x1}" y2="${Y(MGP.thrust / 1000)}" stroke="#9fe0a8" stroke-width="2" stroke-dasharray="8 8"/>${T(x1 - 270, Y(MGP.thrust / 1000) + 34, 'sm', 'YOUR ENGINE’S PUSH', 270)}
      <path d="${d}" fill="none" stroke="#ff8a6a" stroke-width="5"/>
      <circle cx="${X(20)}" cy="${Y(m20)}" r="8" fill="#ffcf8a"/><circle cx="${X(10)}" cy="${Y(m10)}" r="8" fill="#ffcf8a" opacity="${a.toFixed(2)}"/>
      <g opacity="${a.toFixed(2)}">${T(X(10) + 16, Y(m10) - 4, 's', `HALF THE DISTANCE: ${Math.round(m10 / m20)}×`, 400)}</g>
      ${bd > ra && bd < rb ? `<line x1="${X(bd)}" y1="${yt}" x2="${X(bd)}" y2="${yb}" stroke="#fff" stroke-width="2" opacity="0.6"/>${T(X(bd) + 8, yt + 22, 'sm', 'YOU', 100)}` : ''}`);
  }
}
