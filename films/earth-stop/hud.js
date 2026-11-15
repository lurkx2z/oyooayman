/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s / Magnets films':
     top left     THE GROUND: TURNING or STOPPED; while it's stopped, how long until it turns again (to the
                  millisecond); the next thing due ("NEXT · 5:42:00.449 · THE FIRST FUEL WAGON REACHES THE ROCK");
                  your train's distance to the hill (after 5:42:01: the blast's distance to your train)
     top right    Sunday and the time, to the millisecond; 300× SLOWER (the clock only ever runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       how fast the ground moves east, by latitude; what steel would have to carry
     bottom left  the honest labels (what is impossible, what is rough, what is generous)
     middle left  the last 0.14 s, counted down, big
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// what's due next (story s, label)
const ES_NEXT = [
  [0, 'THE GROUND STOPS'], [ES_HITS[0].s, 'THE FIRST PALM REACHES THE HILL'], [ESP.roofFree, 'THE STATION’S ROOF LEAVES ITS PLATFORM'],
  [(ES_HITS.find((h) => h.kind === 'shed') || {}).s, 'THE DEPOT’S SHED REACHES THE ROCK'], [ESP.wagon0, 'THE FIRST FUEL WAGON REACHES THE ROCK'],
  [ESP.ferryHit, 'THE FERRY REACHES THE QUAY'], [(ES_HITS.find((h) => h.kind === 'box') || {}).s, 'THE SIGNAL BOX REACHES THE ROCK'],
  [(ES_HITS.find((h) => h.kind === 'tower') || {}).s, 'THE WATER TOWER REACHES THE ROCK'], [ESP.T, 'THE GROUND TURNS AGAIN'], [ESP.blastHit, 'IT REACHES YOUR TRAIN'],
].filter((x) => x[0] != null).sort((a, b) => a[0] - b[0]);
const esClockStr = (s, ms = true) => { const c = esClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}${ms ? '.' + String(c.ms).padStart(3, '0') : ''}`; };
const esN = (x) => Math.round(x).toLocaleString('en-US');
// the scene's context box: [from, to, label, value(t, s, set) → { v, v2 }] (HTML)
const ES_CTX = (() => {
  const P = ESP, F = ES_F;
  const beat = (id, l, f, k0 = 0, k1) => [esC(id, k0) - 0.2, (k1 != null ? esCap(id, k1).hide : esE(id)) + 0.2, l, f];
  const gone = (t, s) => ({ v: `${P.X(s).toFixed(1)} <small>m</small>`, v2: 'EAST, SINCE 5:42:00' });
  const gap = (t, s) => ({ v: `${esN(P.gap(s))} <small>m</small>`, v2: `CLOSING AT ${esN(Math.max(0, P.trainV(s)) * 3.6)} km/h` });
  const wagonsIn = (s) => { let n = 0; for (let k = 0; k < F.wagons.n; k++) if (s >= P.wagonHit(k)) n++; return n; };
  return [
    beat('speed', 'EVERYTHING LOOSE HAS GONE', gone, 1, 1),
    beat('speed', 'TO STOP THE EARTH’S SPIN', () => ({ v: '2.1 × 10<sup>29</sup> <small>joules</small>', v2: `THE SUN’S WHOLE OUTPUT FOR ${P.sunMin.toFixed(1)} MINUTES` }), 2, 2),
    beat('bolts', 'EVERYTHING LOOSE HAS GONE', gone, 0, 0),
    beat('bolts', 'THE BUILDING HAS SLID', (t, s) => ({ v: `${P.X(s).toFixed(1)} <small>m</small>`, v2: `ITS FLOOR IS ${F.bldg.x[1] - F.bldg.x[0]} m LONG` }), 2, 2),
    beat('town', 'EVERYTHING LOOSE HAS GONE', gone),
    beat('people', 'THE PEOPLE ON THE PLATFORM', () => ({ v: `${esN(P.kmh)} <small>km/h</small>`, v2: 'AND NOT ONE OF THEM HAS MOVED' }), 0, 1),
    beat('people', 'TO THE PLATFORM’S END', (t, s, set) => { const d = -(set.St.leadX + P.X(s)); return d > 0 ? { v: `${d.toFixed(1)} <small>m</small>`, v2: `THEN ${F.plat.h} m TO FALL: 0.47 s` } : { v: 'PAST IT', v2: `${F.plat.h} m TO FALL: 0.47 s` }; }, 2, 2),
    beat('train', 'YOUR TRAIN, OVER THE GROUND', (t, s) => ({ v: `${(Math.max(0, P.trainV(s)) * 3.6).toFixed(1)} <small>km/h</small>`, v2: `BRAKING AT ${P.muTrain} g · YOUR COFFEE TILTS ${Math.round(Math.atan(P.muTrain) * 180 / Math.PI)}°` })),
    beat('energy', 'ENERGY OF MOTION', () => ({ v: `${Math.round(P.keKg / 1000)} <small>kJ per kilogram</small>`, v2: `= ${P.tntG.toFixed(0)} g OF TNT PER KILOGRAM` }), 0, 0),
    beat('energy', 'YOUR TRAIN CARRIES', () => ({ v: `${P.tntT(P.trainT).toFixed(1)} <small>tonnes of TNT</small>`, v2: `${P.trainT} TONNES AT ${esN(P.kmh)} km/h` }), 1, 2),
    beat('hill', 'YOUR TRAIN TO THE HILL', gap),
    beat('depot', 'THE FIRST WAGON TO THE ROCK', (t, s) => { const g = esHillX(F.wagons.z) - (F.wagons.front + P.X(s)); return g > 0 ? { v: `${g.toFixed(1)} <small>m</small>`, v2: `6 WAGONS × ${P.wagonT} TONNES` } : { v: `${wagonsIn(s)} <small>of 6 in the rock</small>`, v2: `${P.tntT(P.wagonT).toFixed(1)} t OF TNT EACH, BEFORE THE FUEL` }; }),
    beat('wind', 'THE WIND AGAINST THE HILL', () => ({ v: `Mach ${P.mach.toFixed(2)}`, v2: `${esN(P.v)} m/s · SOUND HERE: ${esN(P.sound)} m/s` }), 0, 0),
    beat('wind', 'THE AIR AT THE ROCK', () => ({ v: `30 → ${Math.round(30 + P.heat)} <small>°C</small>`, v2: 'SQUEEZED TO A STOP' }), 1, 1),
    beat('wind', 'FUEL WAGONS IN THE ROCK', (t, s) => ({ v: `${wagonsIn(s)} <small>of 6</small>`, v2: 'THE FIRE CAN ONLY GO UP AND SIDEWAYS' }), 2, 2),
    beat('sea', 'ON EVERY METRE OF QUAY, SO FAR', (t, s) => ({ v: `${esN(P.waterT * Math.min(s, 1))} <small>tonnes</small>`, v2: `THE WATER IS ${esN(P.wallH(s))} m HIGH` }), 0, 2),
    beat('sea', 'THE FERRY', (t, s) => { const g = F.quay.x - (F.ferry.bow + P.X(s)); return g > 0 ? { v: `${g.toFixed(1)} <small>m to the quay</small>`, v2: `${esN(P.ferryT)} TONNES · ${esN(P.kmh)} km/h` } : { v: 'AT THE QUAY', v2: `${esN(P.ferryT)} TONNES = ${P.tntT(P.ferryT).toFixed(0)} t OF TNT` }; }, 3, 3),
    beat('up', 'THE WATER’S HEIGHT', (t, s) => ({ v: `${esN(P.wallH(s))} <small>m</small>`, v2: `CLIMBING AT ${esN(P.wallKmh)} km/h` })),
    beat('fall', 'EVERYTHING IN THE AIR HAS FALLEN', (t, s) => ({ v: `${P.fall(s).toFixed(2)} <small>m</small>`, v2: `IN ${s.toFixed(3)} s` }), 0, 0),
    beat('sky', 'AT 10 km', () => ({ v: 'NOTHING', v2: 'PLANE AND AIR STILL MOVE TOGETHER' }), 1, 1),
    beat('count', 'YOUR TRAIN TO THE HILL', gap),
    beat('back', 'YOUR TRAIN, OVER THE GROUND', (t, s) => ({ v: `${(Math.abs(P.trainV(s)) * 3.6).toFixed(1)} <small>km/h</small>`, v2: s < P.T ? '' : 'BACKWARDS NOW, AND BRAKING' }), 0, 2),
    beat('twist', 'FROM THE HILL TO YOUR TRAIN', (t, s) => ({ v: `${esN(Math.max(0, P.blastX(s) - P.nose(s)))} <small>m</small>`, v2: `${Math.max(0, (P.blastX(s) - P.nose(s)) / P.v).toFixed(3)} s AWAY` })),
    beat('second', 'FROM THE HILL TO YOUR TRAIN', (t, s) => ({ v: `${esN(Math.max(0, P.blastX(s) - P.nose(s)))} <small>m</small>`, v2: `${Math.max(0, (P.blastX(s) - P.nose(s)) / P.v).toFixed(3)} s AWAY` })),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const ES_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [esC(id, k0) - 0.1, (k1 != null ? esCap(id, k1).hide : esE(id)) + 0.2, text]; return [
  b('start', 'THE RULE: FOR 1 SECOND THE SOLID EARTH DOES NOT TURN · EVERYTHING LOOSE KEEPS ITS 465 m/s', 0),
  b('speed', 'THE IMPOSSIBLE PART: THE SPIN’S ENERGY GOES AND COMES BACK · WHAT FORCE DOES IT IS NOT SAID', 2, 2),
  b('bolts', 'TO STOP DEAD FROM 465 m/s, STEEL MUST CARRY DENSITY × ITS SOUND SPEED × 465 m/s ≈ 18 GPa', 1, 1),
  b('people', 'APPROX.: SHOES ON PAVING, FRICTION 0.7', 2, 2),
  b('train', 'GENEROUS: THE TRAIN STAYS ON ITS RAILS, AND THE RAILS STAY PUT · STEEL ON STEEL, FRICTION 0.2', 0, 1),
  b('energy', '½ × SPEED² = 108 kJ PER KILOGRAM · TNT: 4.2 MJ PER KILOGRAM', 0, 1),
  b('depot', 'APPROX.: THE FIRE’S SIZE AND SHAPE ARE DRAWN, NOT SIMULATED', 1),
  b('wind', 'AIR AT 30 °C: SOUND AT 349 m/s · AIR BROUGHT TO REST HEATS BY SPEED² / 2cp', 0, 1),
  b('sea', 'APPROX.: THE HARBOUR IS 10 m DEEP · THE WATER IS DRAWN CLIMBING AT ¾ OF ITS SPEED', 1, 2),
  b('fall', '½ × g × t² = 4.9 m IN ONE SECOND', 0, 1),
  b('back', 'AFTER 5:42:01 THE GROUND MOVES WITH EVERYTHING THAT NEVER STOPPED', 1, 2),
  b('twist', 'WHAT THE GROUND STOPPED HAS NO SPEED LEFT: THE GROUND NOW LEAVES IT BEHIND AT 465 m/s', 1),
]; })();
// the insets: [from, to, which, where]
const ES_INSETS = (() => { const b = (id, k0, k1, w, where = '') => [esC(id, k0) - 0.25, (k1 != null ? esCap(id, k1).hide : esE(id)) + 0.3, w, where]; return [
  b('speed', 0, 0, 'lat'), b('bolts', 1, 1, 'steel'),
]; })();

// a caption's text with its numbers in amber
function esCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/×?[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?°C|\s?%|\s(?:million|thousand|hours|hour|minutes|minute|seconds|second|times|km\/h|m\/s|kilometres|metres|grams|tonnes|km|kg|cm|g|m|s)\b)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class EsHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('es-ro', '<div class="l">THE GROUND</div><div class="v"></div><div class="s"></div><div class="s nx"></div><div class="s bt"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx'); this.roB = this.ro.querySelector('.bt');
    this.ctx = mk('es-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('es-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('es-band'); this.cap = mk('es-cap'); this.tag = mk('es-tag');
    this.count = mk('es-count');
    this.caps = EST.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: esCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('es-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, P = ESP, s = set && set._s != null ? set._s : esStoryAt(t), rate = esRateAt(t), stopped = s >= 0 && s < P.T;
    void app;
    // ---- the ground: turning / stopped, the time left, what's next, your train
    const ra = W(t, ES.title[1] - 0.5, ES.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._html('rov', this.roV, stopped ? 'STOPPED' : 'TURNING');
      const left = P.T - s;
      this._html('ros', this.roS, s < 0 ? `${esN(P.kmh)} km/h EAST, AS ALWAYS` : stopped ? `TURNS AGAIN IN <b>${left.toFixed(3)} s</b>` : `AGAIN, AT ${esN(P.kmh)} km/h · SINCE 5:42:01`);
      const nx = ES_NEXT.find((x) => x[0] > s + 1e-5);
      this._html('ron', this.roN, nx && s >= -4 ? `NEXT · ${esClockStr(nx[0], true)} · ${nx[1]}` : '');
      // (your train, from its beat on: never out of mind; after the twist: what is coming for it)
      const bt = t < esB('train') ? '' : t < esB('twist') ? `YOUR TRAIN · <b>${esN(P.gap(s))} m</b> FROM THE HILL` : `YOUR TRAIN · <b>${Math.max(0, P.blastX(s) - P.nose(s)).toFixed(0)} m</b> FROM WHAT THE HILL STOPPED`;
      this._html('rob', this.roB, bt);
      this._cls('roc', this.ro, !stopped ? 'es-ro' : (left < 0.1405 ? 'es-ro dark tick' : 'es-ro dark'));
    }
    // ---- the context box
    const cx = ES_CTX.find((x) => t >= x[0] && t < x[1]), inA = (() => { const w = ES_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = ES_TAGS.find((x) => t >= x[0] && t < x[1]);
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- Sunday and the time; how slowed down
    const ca = W(t, ES.title[1] - 0.5, ES.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = esClockParts(s), ms = rate < 0.9 ? `<small>.${String(c.ms).padStart(3, '0')}</small>` : '';
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small>${ms} <i>${c.pm ? 'PM' : 'AM'}</i>`);
      this._txt('ckf', this.clockF, rate < 0.9 ? esN(1 / rate) + '× SLOWER' : 'REAL SPEED');
    }
    // ---- the last 0.14 s: the count, big
    { const left = P.T - s, on = t >= esB('count') && s < P.T + 0.006;
      this._set('cnta', this.count, 'opacity', on ? '1' : '0');
      if (on) { this._txt('cntv', this.count, Math.max(0, left).toFixed(2)); this._cls('cntc', this.count, left < 0.0005 ? 'es-count hit' : 'es-count'); } }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = EST.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'es-cap q' : 'es-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    // (the tag steps aside while a caption runs to two lines: it would touch it)
    const two = cp && this.root.clientHeight ? this.cap.offsetHeight / this.root.clientHeight > 0.095 : false;
    this._set('tga', this.tag, 'opacity', tg && !two ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagrams
    this._insets(t, s, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'es-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = EsHud._p || (EsHud._p = new THREE.Vector3());
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
      const ty = Math.min(74, Math.max(ly, 30));   // (30%: clear of the boxes along the top)
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) d.style.opacity = '0'; }
      d.className = right ? 'es-lab r' : 'es-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  _insets(t, s, set) {
    const W = StoryHUD.win, which = ES_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'es-inset' : ('es-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = EsHud[which[2]](u, t, s, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="esAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.86, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // a line of text that always fits: past maxW (its width estimated from the class's capitals) its font shrinks to fit
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  // how fast the ground moves east, by latitude: the Earth from the side, a row per place (one after another)
  static lat(u) {
    const T = EsHud.tx, cx = 175, cy = 268, R = 150;
    const rows = [['THE EQUATOR · THIS STATION', 0, '#ffcf8a'], ['CAIRO', 30.0, '#f6efe2'], ['NEW YORK', 40.7, '#f6efe2'], ['LONDON', 51.5, '#f6efe2'], ['OSLO', 59.9, '#f6efe2'], ['THE POLES', 90, '#9fc4ff']];
    const body = rows.map(([name, la, col], i) => {
      const a = MathX.smooth(u, 0.4 + i * 0.45, 0.9 + i * 0.45), y = cy - R * Math.sin(la * Math.PI / 180), hw = R * Math.cos(la * Math.PI / 180), ry = 112 + i * 60;
      const kmh = ESP.at(la), w = Math.max(0, 230 * kmh / ESP.kmh);
      return `<g opacity="${a.toFixed(2)}"><ellipse cx="${cx}" cy="${y.toFixed(1)}" rx="${Math.max(2, hw).toFixed(1)}" ry="${Math.max(1.5, hw * 0.16).toFixed(1)}" fill="none" stroke="${col}" stroke-width="${i ? 2.5 : 5}"/>
        <line x1="${(cx + hw).toFixed(1)}" y1="${y.toFixed(1)}" x2="372" y2="${ry - 8}" stroke="${col}" stroke-width="1.5" opacity="0.5"/>
        <rect x="380" y="${ry - 24}" width="${w.toFixed(1)}" height="14" rx="4" fill="${col}"/>${T(380, ry + 20, 'sm', `${name} · ${esN(kmh)} km/h`, 360, `fill="${col}"`)}</g>`;
    }).join('');
    return EsHud.svg(`${EsHud.plate()}${T(30, 56, 't', 'HOW FAST THE GROUND MOVES EAST')}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(60,90,130,0.35)" stroke="#9aa" stroke-width="2"/><line x1="${cx}" y1="${cy - R - 16}" x2="${cx}" y2="${cy + R + 16}" stroke="#9aa" stroke-width="2" stroke-dasharray="6 6"/>
      <path d="M ${cx - 46} ${cy + R + 30} Q ${cx} ${cy + R + 46} ${cx + 46} ${cy + R + 30}" fill="none" stroke="#ffcf8a" stroke-width="4" marker-end="url(#esAh)"/>${body}`);
  }
  // what steel would have to carry to stop with the ground, and what it can
  static steel(u) {
    const T = EsHud.tx, x0 = 40, x1 = 720, a = MathX.smooth(u, 1.0, 2.0), b = MathX.smooth(u, 2.4, 3.2);
    return EsHud.svg(`${EsHud.plate()}${T(30, 58, 't', 'TO STOP WITH THE GROUND')}
      <rect x="${x0}" y="104" width="${x1 - x0}" height="44" rx="6" fill="#ff8a6a"/>${T(x0, 194, 's', `STEEL WOULD HAVE TO CARRY ${(ESP.steelNeed / 1e9).toFixed(0)} GPa`, 680)}
      <g opacity="${a.toFixed(2)}"><rect x="${x0}" y="246" width="${((x1 - x0) / ESP.steelK).toFixed(1)}" height="44" rx="4" fill="#9fc4ff"/>${T(x0, 336, 's', `STRUCTURAL STEEL GIVES WAY AT ${(ESP.yieldSteel / 1e9).toFixed(2)} GPa`, 680, 'fill="#9fc4ff"')}</g>
      <g opacity="${b.toFixed(2)}">${T(x0, 420, 't', `${Math.round(ESP.steelK)} TIMES TOO WEAK`, 680, 'fill="#ffcf8a"')}</g>`);
  }
}
