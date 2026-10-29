/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light / Friction 10s films':
     top left     DOWN HAS TURNED and the angle (it steps each second, with a pulse), under it "+1° EVERY SECOND";
                  under that one context line for the scene (the spire's lean, the fastest car, the pond, the cars'
                  height, the countdown to down being down again…)
     top right    the time this afternoon, and a DOWN dial: which way down points, on the screen, right now
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams: friction's angle, the circle a falling thing makes, how high things go
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

const gkKmh = (v) => Math.round(v * 3.6) + ' <small>km/h</small>';
const gkKm = (y) => (y < 1000 ? Math.round(y / 10) * 10 + ' <small>m</small>' : (y / 1000).toFixed(1) + ' <small>km</small>');
// a simulated body's speed (m/s) at s
function gkSimSpeed(world, id, s) { const A = [0, 0, 0], B = [0, 0, 0], Q = [0, 0, 0, 1]; gkSimPose(world, id, s - 0.1, A, Q); gkSimPose(world, id, s + 0.1, B, Q); return Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) / 0.2; }
const GK_CARS = GK_ST.bodies.filter((b) => b.kind === 'car').map((b) => b.id);
// the scene's context line: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const GK_CTX = (() => {
  const c = gkC, E = gkE, sh = (m) => GK_SHOTS.find((x) => x.mode === m);
  const fastest = (t, s) => { let best = 0; for (const id of GK_CARS) best = Math.max(best, gkSimSpeed('street', id, s)); return { v: gkKmh(best), v2: best > 0.5 ? 'SLIDING EAST' : 'STILL PARKED' }; };
  return [
    [c('spire', 1) - 0.2, sh('spire').t1 - 0.2, 'THE SPIRE IS LEANING', (t, s) => { const a = gkSpireAngle(s) * 180 / Math.PI; return s > GK_SPIRE.hitS ? { v: 'GONE', v2: '' } : { v: a.toFixed(1) + '<small>°</small>', v2: a > 3 ? 'AND FALLING' : '' }; }],
    [sh('cars0').t0 + 0.3, sh('church0').t1 - 0.3, 'THE FASTEST CAR', fastest],
    [sh('ski').t0 + 0.4, sh('ski').t1 - 0.3, 'THE PARK IS A SLOPE OF', (t, s) => ({ v: gkDeg(s) + '<small>°</small>', v2: '' })],
    [sh('pond').t0 + 0.4, sh('pond').t1 - 0.3, 'WATER LEFT IN THE POND', (t, s) => ({ v: Math.max(0, Math.round(100 * GK_POND.left(s))) + '<small>%</small>', v2: '' })],
    [sh('stack').t0 + 1.0, sh('up0').t1 - 0.2, 'THE CARS', (t, s) => { const y = gkSimCarY(s); return { v: gkKm(y), v2: y > 3 ? 'UP, AND FALLING' : 'ON THE CHURCH WALL' }; }],
    [sh('sky0').t0 + 0.6, sh('sky0').t1 - 0.3, 'A CAR, ALARM STILL GOING', (t, s) => { const P = [0, 0, 0], Q = [0, 0, 0, 1]; gkSimPose('street', 'car4', s, P, Q); return { v: gkKm(P[1]), v2: 'UP' }; }],
    [sh('rising').t0 + 0.5, sh('rising').t1 - 0.3, 'THE CARS', (t, s) => ({ v: gkKm(gkSimCarY(s)), v2: 'UP, AND STILL CLIMBING' })],
    [sh('back').t0 + 0.4, sh('back').t1 - 0.3, 'THE CARS', (t, s) => ({ v: gkKm(gkSimCarY(s)), v2: 'UP, AND COMING DOWN' })],
    [sh('down0').t0 + 0.4, sh('straight').t1 - 0.3, 'THE CARS', (t, s) => ({ v: gkKm(gkSimCarY(s)), v2: 'UP' })],
    [sh('count').t0, gkFilmAt(360), 'DOWN IS DOWN AGAIN IN', (t, s) => ({ v: Math.max(0, Math.ceil(360 - s - 1e-6)) + ' <small>s</small>', v2: '' })],
    [sh('comes').t0 + 0.4, GK.end + 1, 'THE CARS', (t, s) => ({ v: gkKm(gkSimCarY(s)), v2: 'UP, ' + (-gkSimCarX(s) / 1000).toFixed(1) + ' km WEST' })],
  ];
})();
function gkSimCarX(s) { const P = [0, 0, 0], Q = [0, 0, 0, 1]; let x = 0; for (const id of GK_CARS) { gkSimPose('street', id, s, P, Q); x += P[0]; } return x / GK_CARS.length; }

// a caption's text with its numbers in amber
function gkCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\d+(?:\.\d+)?(?::\d+)?(?:\s?°|\s?%|\s?km\/h|\s?m\/s|\s(?:degrees|metres|minutes|seconds|km|kg|cm|m)\b)?/g, (m) => `<span class="n">${m}</span>`);
}

class GkHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('gk-ro', '<div class="l"></div><div class="v"></div><div class="s"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.ctx = mk('gk-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('gk-clock', '<div class="l"></div><div class="v"></div><div class="dn"><span class="dl">DOWN</span><svg viewBox="-50 -50 100 100"><circle r="44" class="ring"/><g class="arr"><path d="M0 -26 L0 22 M-14 8 L0 24 L14 8"/></g><g class="into"><circle r="9"/><path d="M-20 -20 L20 20 M20 -20 L-20 20"/></g></svg></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.dn = this.clock.querySelector('.dn'); this.arr = this.clock.querySelector('.arr'); this.into = this.clock.querySelector('.into');
    this.band = mk('gk-band'); this.cap = mk('gk-cap');
    this.caps = GKT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: gkCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('gk-inset');
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
    const W = StoryHUD.win, s = set && set._s != null ? set._s : gkStoryAt(t);
    // ---- the angle (from the first tick to the last frame)
    const ra = Math.max(W(t, GK.t0 + 0.6, GK.end + 1, 0.3, 0.5), 0);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const d = gkDeg(s);
      this._txt('rol', this.roL, 'DOWN HAS TURNED');
      this._html('rov', this.roV, d + '<small>°</small>');
      this._txt('ros', this.roS, d >= 360 && d < 362 ? 'ONE FULL TURN' : '+1° EVERY SECOND');
      const fr = s - Math.floor(s + 1e-9);
      this._cls('roc', this.ro, s >= 1 && fr < 0.18 ? 'gk-ro tick' : d >= 360 && d < 362 ? 'gk-ro hit' : 'gk-ro');
    }
    // ---- the context line
    const cx = GK_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the time this afternoon, and which way is down on the screen
    const ca = W(t, GK.title[1] - 0.6, GK.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = gkClock(Math.max(0, s));
      this._txt('ckl', this.clockL, 'SATURDAY');
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>PM</i>`);
      this._down(s, set);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = GKT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'gk-cap q' : 'gk-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, s);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'gk-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = GkHud._p || (GkHud._p = new THREE.Vector3());
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
      d.style.left = lx.toFixed(2) + '%'; d.style.top = Math.min(74, Math.max(ly, 20)).toFixed(2) + '%';
      d.className = right ? 'gk-lab r' : 'gk-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  // the DOWN dial: down (it turns 1° a second, about the east–up plane) in camera space; along the view it's a ⊗
  _down(s, set) {
    const cam = set && set.camera; if (!cam) return;
    const g = GkHud._g || (GkHud._g = new THREE.Vector3()), q = GkHud._q || (GkHud._q = new THREE.Quaternion());
    const dd = gkDown(gkDeg(Math.max(0, s)));
    g.set(dd[0], dd[1], 0); cam.getWorldQuaternion(q); g.applyQuaternion(q.invert());
    const flat = Math.hypot(g.x, g.y), into = flat < 0.45;
    const ang = Math.atan2(g.x, -g.y) * 180 / Math.PI;                 // (0 = straight down the screen)
    this._set('dnA', this.arr, 'opacity', into ? '0' : '1'); this._set('dnI', this.into, 'opacity', into ? '1' : '0');
    this._set('dnR', this.arr, 'transform', `rotate(${(-ang).toFixed(1)}deg)`);
    this._cls('dnC', this.dn, s >= 1 ? 'dn on' : 'dn');
  }

  // the diagrams (SVG, 760×470 design px)
  _insets(t, s) {
    const W = StoryHUD.win, c = gkC, E = gkE, sh = (m) => GK_SHOTS.find((x) => x.mode === m);
    const which = [
      ['friction', c('slide', 0) - 0.2, E('slide') + 0.4, ''],
      ['circle', c('terminal', 2) + 0.1, sh('circle').t1 - 0.3, ''],
      ['heights', c('high', 1) - 0.1, E('high') + 0.4, ''],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'gk-inset' : 'gk-inset ' + which[3]);
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = GkHud[k](u, t, s);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.72, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static arrow(x1, y1, x2, y2, col = '#ffcf8a', w = 6) { const a = Math.atan2(y2 - y1, x2 - x1), h = 16; return `<line x1="${x1}" y1="${y1}" x2="${x2 - Math.cos(a) * 8}" y2="${y2 - Math.sin(a) * 8}" stroke="${col}" stroke-width="${w}"/><path d="M${x2} ${y2} L${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)} L${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)} Z" fill="${col}"/>`; }
  // friction: a floor turned to the current angle, a sofa on it; it holds until the slope beats its grip (~25°)
  static friction(u, t, s) {
    const d = gkDeg(s), a = d * Math.PI / 180, k = MathX.smooth(u, 0.1, 0.6), cx = 380, cy = 330, L = 300;
    const p0 = [cx - L * Math.cos(a), cy + L * Math.sin(a)], p1 = [cx + L * Math.cos(a), cy - L * Math.sin(a)];
    // (drawn as you'd see it from inside: the floor tips up to the west, so it slopes down to the east, the right)
    const q0 = [cx - L * Math.cos(a), cy - L * Math.sin(a)], q1 = [cx + L * Math.cos(a), cy + L * Math.sin(a)];
    const go = d >= 25, slide = go ? Math.min(1, (s - 24.5) / 4) : 0, bx = -40 + 160 * slide * slide;
    const bxp = cx + bx * Math.cos(a), byp = cy + bx * Math.sin(a);
    return GkHud.svg(`${GkHud.plate()}<g opacity="${k}">
      <line x1="${q0[0]}" y1="${q0[1]}" x2="${q1[0]}" y2="${q1[1]}" stroke="#f6efe2" stroke-width="6"/>
      <g transform="translate(${bxp} ${byp}) rotate(${d})"><rect x="-60" y="-56" width="120" height="56" rx="10" fill="${go ? '#ff8a6a' : '#ffcf8a'}"/></g>
      <path d="M ${cx + 150} ${cy + 150 * Math.tan(0)} A 150 150 0 0 1 ${cx + 150 * Math.cos(a)} ${cy + 150 * Math.sin(a)}" stroke="#ffd7a8" stroke-width="3" fill="none"/>
      <line x1="${cx}" y1="${cy}" x2="${cx + 240}" y2="${cy}" stroke="#ffd7a8" stroke-width="2" stroke-dasharray="6 6"/>
      <text x="${cx + 170}" y="${cy + 40}" class="b">${d}°</text>
      <text x="40" y="430" class="s">${go ? 'PAST ~25°: IT SLIDES' : 'UNDER ~25°: FRICTION HOLDS IT'}</text></g>
      <text x="40" y="50" class="t">YOUR FLOOR, AS DOWN SEES IT</text>`);
  }
  // the circle: falling at a steady speed while down turns at 1° a second, a thing goes round a circle of radius
  // speed ÷ turn rate (a leaf at 1.5 m/s: 86 m; a drop at 9 m/s: 516 m; a car at 90 m/s: 5.2 km)
  static circle(u, t, s) {
    const k = MathX.smooth(u, 0.1, 0.6), cx = 300, cy = 250, r = 150, d = gkDeg(s), a = d * Math.PI / 180;
    // (the thing left the ground at 90° from the bottom of the circle's east side; it's now at angle d on the circle)
    const pt = (deg) => { const q = deg * Math.PI / 180; return [cx - r * Math.cos(q), cy + r * Math.sin(q)]; };
    let path = ''; for (let g = 90; g <= Math.max(90, d); g += 2) { const p = pt(g); path += (path ? ' L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
    const p = pt(d), dn = gkDown(d);
    return GkHud.svg(`${GkHud.plate()}<g opacity="${k}">
      <line x1="40" y1="${cy + r}" x2="560" y2="${cy + r}" stroke="#8a847a" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,215,168,0.35)" stroke-width="3" stroke-dasharray="8 8"/>
      <path d="${path}" stroke="#ffcf8a" stroke-width="5" fill="none"/>
      <circle cx="${p[0]}" cy="${p[1]}" r="11" fill="#fff"/>
      ${GkHud.arrow(p[0], p[1], p[0] + dn[0] * 70, p[1] - dn[1] * 70, '#ff8a6a', 5)}
      <text x="${p[0] + dn[0] * 70 + 10}" y="${p[1] - dn[1] * 70}" class="sm">DOWN</text>
      <text x="480" y="150" class="sm">RADIUS = SPEED ÷ TURN</text>
      <text x="480" y="200" class="b">LEAF  86 m</text><text x="480" y="240" class="b">DROP  516 m</text><text x="480" y="280" class="b">CAR  5.2 km</text></g>
      <text x="40" y="50" class="t">A FALL THAT TURNS: A CIRCLE</text>`);
  }
  // how high things go at 270° (twice the radius): leaves 170 m, the pond's water 1 km, the cars 10 km (log scale)
  static heights(u) {
    const k = MathX.smooth(u, 0.1, 0.6), Y = (h) => 410 - (Math.log10(h) - 1) / 3.3 * 340;
    const bar = (x, h, lab, col, du) => { const kk = MathX.smooth(u, du, du + 0.8); return `<rect x="${x}" y="${410 - (410 - Y(h)) * kk}" width="90" height="${(410 - Y(h)) * kk}" fill="${col}" rx="6"/><text x="${x + 45}" y="${Y(h) - 14}" class="b" text-anchor="middle" opacity="${kk}">${lab}</text>`; };
    const ref = (h, lab) => `<line x1="80" y1="${Y(h)}" x2="700" y2="${Y(h)}" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-dasharray="6 8"/><text x="700" y="${Y(h) - 8}" class="sm" text-anchor="end">${lab}</text>`;
    return GkHud.svg(`${GkHud.plate()}<g opacity="${k}">
      ${ref(330, 'EIFFEL TOWER 330 m')}${ref(8849, 'EVEREST 8.8 km')}${ref(11000, 'AIRLINERS ~11 km')}
      <line x1="80" y1="410" x2="700" y2="410" stroke="#f6efe2" stroke-width="3"/>
      ${bar(130, 172, '170 m', '#d9a63a', 0.2)}${bar(300, 1031, '1 km', '#9fc6e6', 1.2)}${bar(470, 9800, '10 km', '#ff8a6a', 2.2)}
      <text x="175" y="445" class="sm" text-anchor="middle">LEAVES</text><text x="345" y="445" class="sm" text-anchor="middle">YOUR POND</text><text x="515" y="445" class="sm" text-anchor="middle">THE CARS</text></g>
      <text x="40" y="50" class="t">AS HIGH AS IT GOES (270°)</text>`);
  }
}
