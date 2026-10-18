/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD.
     top left     SPEED OF LIGHT · the value · what it is as fast as / slower than (on a soft plate)
                  under it, one context line for the scene (Gran's delay, the flash → bang stopwatch, what you
                  hear and see of car 2, the knock's countdown …)
     bottom left  the honest label (thought experiment / illustration / real experiment)
     top right    the time tonight; later Mum's "On my way" text, still travelling
     bottom       one caption at a time (from CAPTIONS.md via timing.js; numbers in amber); the last one is the
                  closing question, larger
     right        the diagrams (illustrations): the cable to Sydney, car 2 from above, the egg of light, the text that
                  never arrived; large in the middle: the light stopped inside your eye
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub }])
   ===================================================================== */

// speed landmarks (m/s)
const SL_MARKS = [
  [SL_C0, 'LIGHT, AS IT SHOULD BE'], [191000, 'THE FASTEST SPACE PROBE'], [29780, 'THE EARTH, ROUND THE SUN'], [7660, 'THE SPACE STATION'],
  [940, 'A RIFLE BULLET'], [343, 'SOUND'], [250, 'A PASSENGER JET'], [83, 'A HIGH-SPEED TRAIN'], [27.8, 'A CAR ON THE MOTORWAY'],
  [13.9, 'A CAR IN TOWN'], [5.6, 'A CYCLIST'], [2.8, 'A JOGGER'], [1.4, 'YOU, WALKING'], [0.075, 'A TORTOISE'], [0.001, 'A GARDEN SNAIL'],
];
function slThousands(n) { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function slFmtC(c) {
  if (!(c > 0)) return '0 km/h';
  if (c >= 1e4) { const k = c / 1000; return (k >= 100 ? slThousands(k) : k.toFixed(1)) + ' km/s'; }
  const h = c * 3.6;
  if (h >= 10) return slThousands(h) + ' km/h';
  if (h >= 1) return h.toFixed(1) + ' km/h';
  if (h >= 0.1) return h.toFixed(2) + ' km/h';
  return h.toFixed(3) + ' km/h';
}
function slFmtS(s) { return s < 0.1 ? s.toFixed(2) : s < 10 ? s.toFixed(1) : Math.round(s).toString(); }
// how long ago the light reaching you now left a thing d metres away (∫ c dt = d, back in time)
function slAgeOf(t, d) {
  let acc = 0, x = t, dt = 0.05;
  for (let i = 0; i < 40000 && acc < d; i++) { const c = slC(x - dt * 0.5); acc += c * dt; x -= dt; if (i > 200) dt = 0.5; if (i > 2000) dt = 5; }
  return t - x;
}
// how far light travelled between t0 and t1 (m)
function slDistBetween(t0, t1) { let acc = 0; const n = 400, dt = (t1 - t0) / n; for (let i = 0; i < n; i++) acc += slC(t0 + (i + 0.5) * dt) * dt; return acc; }
SL.textDist = 800;                                          // the mast your phone listens to is 800 m away
function slFmtAge(s) { return s < 90 ? Math.round(s) + ' SECONDS' : s < 5400 ? Math.round(s / 60) + ' MINUTES' : (s / 3600).toFixed(1) + ' HOURS'; }

// the fireworks stopwatch: each pair's first event (the flash, later the bang) starts it, the second stops it
function slFwStopwatch(t) {
  const P = SL_FW_PAIRS; let k = 0;
  for (let i = 0; i < P.length; i++) if (t >= Math.min(P[i].f, P[i].b) - 0.3) k = i;
  const p = P[k], e1 = Math.min(p.f, p.b), e2 = Math.max(p.f, p.b), tog = e2 - e1 < 0.05, bangFirst = p.b < p.f - 0.05;
  const chip = (txt, at) => `<span class="chip${t >= at ? (t < at + 0.45 ? ' hit' : ' on') : ''}">● ${txt}</span>`;
  const chips = bangFirst ? chip('HEARD', p.b) + chip('SEEN', p.f) : chip('SEEN', p.f) + chip('HEARD', p.b);
  let v;
  if (t < e1) v = '<span class="dim">0.0 s</span>';
  else if (tog) v = 'TOGETHER';
  else if (t < e2) v = (t - e1).toFixed(1) + ' s';
  else v = (e2 - e1).toFixed(1) + ' s' + (bangFirst ? ' · BANG FIRST' : '');
  return { l: bangFirst ? 'BANG → FLASH' : 'FLASH → BANG', v, v2: chips };
}
// car 2: what you hear of it (the sound is near enough instant) and what you see
function slCar2Meter(t) {
  const xr = SL_ST.eye[0] - SL_ST.v2 * (t - SL.car2Tp), d = Math.hypot(xr - SL_ST.eye[0], SL_ST.b);
  const v = Math.round(SL_ST.v2 * 3.6) + ' km/h · TWICE AS FAST AS LIGHT';
  let v2;
  if (t < SL.car2Tp - 0.4) v2 = `HEARD: ${Math.round(d)} m AWAY · SEEN: <span class="dim">NOTHING</span>`;
  else if (t < SL.car2Seen) v2 = 'HEARD: PASSING YOU · SEEN: <span class="dim">NOTHING</span>';
  else v2 = `HEARD: ${Math.round(d)} m AWAY, GOING · SEEN: TWO OF IT`;
  return { v, v2 };
}
// the knock: how late you see your hand; once you've heard it, the countdown to seeing it
function slKnockMeter(t) {
  if (t < SL.knockHit) return { v: 'SEEN ' + slFmtS(SL.knockDist / Math.max(1e-6, slC(t))) + ' s LATE' };
  if (t < SL.knockSeen) return { v: 'SEEN IN ' + (SL.knockSeen - t).toFixed(1) + ' s', v2: '<span class="chip hit">● HEARD</span><span class="chip">● SEEN</span>' };
  return { v: 'SEEN, ' + (SL.knockSeen - SL.knockHit).toFixed(1) + ' s LATE', v2: '<span class="chip on">● HEARD</span><span class="chip' + (t < SL.knockSeen + 0.45 ? ' hit' : ' on') + '">● SEEN</span>' };
}
// the scene's one context line: [from, to, label, value(t)] (value: text, or { l, v, v2 } with HTML)
const SL_CTX = [
  [SL.fast + 4.0, SL.rule - 0.3, 'ONE SECOND OF LIGHT', () => '300,000 km · 7½ TIMES ROUND THE EARTH'],
  [SL.call + 1.2, SL.map - 0.2, "GRAN'S PICTURE", (t) => slFmtS(slGranDelay(slC(t))) + ' s LATE'],
  [SL.map + 0.6, SL.sun - 0.3, 'GPS SIGNALS', (t) => slFmtS(2.02e7 / slC(t) - 2.02e7 / SL_C0) + ' s LATE'],
  [SL.sun + 0.6, SL.fw - 0.3, 'SUNLIGHT ARRIVING', (t) => { const p = slC(t) / SL_C0 * 100; return (p >= 10 ? Math.round(p) : p >= 1 ? p.toFixed(1) : p.toFixed(2)) + '% OF NORMAL'; }],
  [SL.f1 - 0.6, SL.street - 0.3, 'FLASH → BANG', (t) => slFwStopwatch(t)],
  [SL.street + 1.6, SL.redGone + 1.2, 'THIS CAR', (t) => { const v = slCar1V(slCar1Seen(t)), b = v / slC(t); return Math.round(v * 3.6) + ' km/h · ' + (b < 0.27 ? 'A QUARTER OF LIGHT' : Math.round(b * 100) + '% OF LIGHT'); }],
  [SL.faster + 0.4, SL.cat - 0.3, 'THE NEXT CAR', (t) => slCar2Meter(t)],
  [SL.cat + 0.6, SL.mirror - 0.3, 'YOUR CAT, FLAT OUT', () => '25 km/h · 3 × LIGHT'],
  [SL.mirror + 0.6, SL.walkCut - 0.2, 'YOUR REFLECTION', () => slFmtS(2 * SL.mirrorDist / SL.cMirror) + ' s LATE'],
  [SL.walkCut + 0.5, SL.lamp - 0.3, 'YOU', () => (SL.walkU * 3.6).toFixed(1) + ' km/h · TWO-FIFTHS OF LIGHT'],
  [SL.lamp + 0.6, SL.knock - 0.3, 'LAMP → YOUR EYE', () => slFmtS(Math.hypot(SL_SWITCH_EYE[0] - SL_HOME.lamp[0], SL_SWITCH_EYE[1] - SL_HOME.lamp[1], SL_SWITCH_EYE[2] - SL_HOME.lamp[2]) / SL.cLamp) + ' s'],
  [SL.knock + 0.6, SL.freeze - 0.2, 'YOUR HAND, ' + Math.round(SL.knockDist * 100) + ' cm AWAY', (t) => slKnockMeter(t)],
  [SL.freeze + 0.3, SL.stop + 0.2, 'THE TABLE YOU SEE IS', (t) => t >= SL.stop ? 'GONE' : slFmtAge(slAgeOf(t, 0.4)) + ' OLD'],
];
// the honest labels: [from, to, text]
const SL_TAGS = [
  [0.3, SL.titleShot, 'LATER TONIGHT'],
  [SL.fast + 0.3, SL.rule, 'LIGHT, AS IT REALLY IS · SHOWN 40× SLOWER'],
  [SL.rule + 0.4, SL.call + 6.5, 'THOUGHT EXPERIMENT · ONLY LIGHT SLOWS · WIRES AND CHIPS STILL WORK'],
  [SL.cable - 0.1, SL.cable + 7, 'ILLUSTRATION'],
  [SL.map + 0.4, SL.sun - 0.3, 'ILLUSTRATION'],
  [slS('egg') - 0.2, slE('egg') + 1.0, 'ILLUSTRATION'],
  [SL.last + 0.2, SL.door, 'ILLUSTRATION · YOUR EYE, NOT TO SCALE'],
  [SL.door + 0.2, SL.on2, 'ILLUSTRATION · YOUR FLAT, FROM ABOVE'],
  [SL.on2 + 0.2, SL.text, 'ILLUSTRATION · EVERY BULB IS ON'],
  [SL.text + 0.2, SL.real - 0.3, 'ILLUSTRATION'],
  [SL.lab + 0.2, SL.held - 0.4, 'REAL EXPERIMENT · HARVARD, 1999 · ILLUSTRATED, SLOWED DOWN'],
  [SL.held - 0.4, SL.question - 0.4, 'REAL EXPERIMENT · HARVARD, 2001 · ILLUSTRATED, SLOWED DOWN'],
];
// a caption's text with its numbers in amber
function slCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\b(\d[\d,.½]*(?:\s?(?:km\/h|metres|kilometres|seconds?))?|one|two|three|four|five|six|seven|eight|nine|ten|millimetre|a whole second|a fraction of a second)\b/gi, '<span class="n">$1</span>');
}

class SlHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('sl-ro', '<div class="l">SPEED OF LIGHT</div><div class="v"></div><div class="s"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.ctx = mk('sl-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('sl-tag');
    this.clock = mk('sl-clock', '<div class="l">TONIGHT</div><div class="v"></div>'); this.clockV = this.clock.querySelector('.v');
    this.msg = mk('sl-msg', '<div class="hd"><b>MUM</b><span class="st"></span></div><div class="body">On my way x</div><div class="go"></div>');
    this.msgSt = this.msg.querySelector('.st'); this.msgGo = this.msg.querySelector('.go');
    this.cap = mk('sl-cap');
    this.caps = SLT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: slCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('sl-inset');
    this.labels = [];
    this.root = root;
    this._last = {};
    this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, c = slC(t);
    // ---- the counter: the cold open (later tonight), then from "light is fast" to the stop; again in the lab
    const lab = t >= SL.lab;
    const ra = Math.max(W(t, 0.4, SL.titleShot, 0.5, 0.4), W(t, SL.fast + 0.5, SL.stop + 2.5, 0.6, 0.8), W(t, SL.lab + 0.6, SL.question - 0.3, 0.6, 0.6));
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      let v, sub;
      if (lab) {
        this._txt('rol', this.roL, 'LIGHT IN THE ATOM CLOUD');
        const held = t >= SL.held && t < SL.release;
        v = held ? '0 km/h' : '61 km/h'; sub = held ? 'STORED IN THE ATOMS · UP TO A THOUSANDTH OF A SECOND' : '17 METRES A SECOND';
      } else {
        this._txt('rol', this.roL, 'SPEED OF LIGHT');
        const cc = t < SL.titleShot ? SL.cLamp : c;
        v = slFmtC(cc);
        if (cc <= 0) sub = 'STOPPED';
        else if (cc > SL_C0 * 0.97) sub = 'THE FASTEST THING THERE IS';
        else {
          const near = SL_MARKS.find((m) => cc > m[0] * 0.94 && cc < m[0] * 1.06);
          const above = SL_MARKS.filter((m) => m[0] > cc).pop();
          sub = near ? 'AS FAST AS ' + near[1] : above[0] === SL_C0 ? (() => { const p = cc / SL_C0 * 100; return (p >= 10 ? Math.round(p) : p >= 1 ? p.toFixed(1) : p.toFixed(2)) + '% OF ITS NORMAL SPEED'; })() : 'SLOWER THAN ' + above[1];
        }
      }
      this._txt('rov', this.roV, v); this._txt('ros', this.roS, sub);
    }
    // ---- the context line
    const cx = SL_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t), o = typeof r === 'string' ? { v: r } : r;
      this._txt('cxl', this.ctxL, o.l || cx[2]); this._html('cxv', this.ctxV, o.v); this._html('cxv2', this.ctxV2, o.v2 || '');
    }
    // ---- the honest label
    const tg = SL_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.5, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the time tonight, Mum's text
    const ca = W(t, SL.rule + 0.5, SL.real - 0.4, 0.6, 0.6) * (t > SL.stop + 0.3 && t < SL.door ? 0 : 1);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) { const m = Math.floor(slClock(t)); this._txt('ckv', this.clockV, `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`); }
    const ma = W(t, SL.textSent, SL.real - 0.4, 0.4, 0.6) * (t > SL.stop + 0.3 && t < SL.text - 0.5 ? 0 : 1);
    this._set('ma', this.msg, 'opacity', ma.toFixed(3));
    { const u = t - SL.textSent, k = u > 0 && u < 0.9 ? Math.sin(Math.PI * u / 0.9) * Math.exp(-u * 2) : 0; this._set('msc', this.msg, 'transform', k > 0.002 ? `scale(${(1 + 0.22 * k).toFixed(3)})` : 'none'); }
    if (ma > 0) {
      const gone = Math.min(SL.textDist, slDistBetween(SL.textSent, Math.min(t, SL.stop)));
      this._txt('mst', this.msgSt, 'SENT ' + (() => { const m = Math.floor(slClock(SL.textSent)); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; })());
      this._txt('mgo', this.msgGo, t >= SL.stop ? `STOPPED ${slThousands(SL.textDist - gone)} m AWAY` : `STILL TRAVELLING · ${slThousands(SL.textDist - gone)} m TO GO`);
    }
    // ---- the caption
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._set('capq', this.cap, 'className', cp.q ? 'sl-cap q' : 'sl-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'sl-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = SlHud._p || (SlHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      // (kept clear of the readout and the context box in the top left while that box is up)
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      d.style.left = lx.toFixed(2) + '%'; d.style.top = (cx && lx < 44 ? Math.max(ly, 42) : ly).toFixed(2) + '%';
      const h = `<span class="d"></span>${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}`;
      if (d._h !== h) { d._h = h; d.innerHTML = h; }
    });
  }

  // the illustrated diagrams (SVG, 760×470 design px, right of centre)
  _insets(t) {
    const W = StoryHUD.win;
    const which = [
      ['cable', SL.cable - 0.2, SL.cable + 7.2], ['car2', slCap('faster', 1).show - 0.3, slS('two') - 0.4], ['car2', SL.car2Seen + 0.2, SL.cat - 0.3],
      ['egg', slS('egg') - 0.3, slE('egg') + 1.2], ['eye', SL.last - 0.1, SL.door - 0.2], ['text', SL.text + 0.3, SL.real - 0.4],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.5, 0.5) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    if (!which) return;
    { const cls = which[0] === 'eye' ? 'sl-inset big' : 'sl-inset'; if (this._last.inb !== cls) { this._last.inb = cls; this.inset.className = cls; } }
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = SlHud[k](u, t);
  }
  static svg(body) { return `<svg viewBox="0 0 760 470" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  // London → Sydney by sea cable: a pulse runs the route (not to time)
  static cable(u) {
    if (!SlHud._land) {
      const X = (lo) => (lo + 20) / 180 * 720 + 20, Y = (la) => (65 - la) / 115 * 430 + 20;
      SlHud._X = X; SlHud._Y = Y;
      SlHud._land = EARTH_LAND.map((poly) => '<path d="' + poly.map(([lo, la], i) => (i ? 'L' : 'M') + X(Math.max(-20, Math.min(160, lo))).toFixed(1) + ' ' + Y(Math.max(-50, Math.min(65, la))).toFixed(1)).join(' ') + 'Z"/>').join('');
      const R = [[-0.1, 51.5], [-6, 48], [-10, 40], [-6, 36], [5, 37.5], [15, 35.5], [28, 33], [32.3, 31.3], [33, 27], [38, 20], [43.5, 12.5], [55, 13], [65, 15], [72.8, 18.9], [76, 8], [80, 5.5], [92, 6], [98, 7], [103.8, 1.3], [106, -6.5], [114, -12], [115.9, -32], [124, -36], [138, -37], [151.2, -33.9]];
      SlHud._route = R.map(([lo, la]) => [X(lo), Y(la)]);
      let L = 0; SlHud._cum = [0]; for (let i = 1; i < R.length; i++) { L += Math.hypot(SlHud._route[i][0] - SlHud._route[i - 1][0], SlHud._route[i][1] - SlHud._route[i - 1][1]); SlHud._cum.push(L); }
    }
    const R = SlHud._route, C = SlHud._cum, Ltot = C[C.length - 1], drawn = Math.min(1, u / 1.4);
    const at = (f) => { const d = f * Ltot; let i = 1; while (i < C.length - 1 && C[i] < d) i++; const q = (d - C[i - 1]) / (C[i] - C[i - 1]); return [R[i - 1][0] + (R[i][0] - R[i - 1][0]) * q, R[i - 1][1] + (R[i][1] - R[i - 1][1]) * q]; };
    const pts = []; for (let f = 0; f <= drawn + 1e-6; f += 0.01) pts.push(at(Math.min(f, drawn)).map((v) => v.toFixed(1)).join(' '));
    const pf = ((u - 1.4) / 2.2) % 1, p = u > 1.4 ? at(pf < 0 ? 0 : pf) : null;
    const [lx, ly] = R[0], [sx, sy] = R[R.length - 1];
    return SlHud.svg(`<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,0.66)"/>
      <g fill="rgba(222,214,196,0.22)" stroke="rgba(222,214,196,0.35)" stroke-width="1">${SlHud._land}</g>
      <polyline points="${pts.join(' ')}" fill="none" stroke="#ffd7a8" stroke-width="3.5" stroke-dasharray="2 7" stroke-linecap="round"/>
      ${p ? `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="11" fill="#fff6e6"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="24" fill="rgba(255,215,168,0.35)"/>` : ''}
      <circle cx="${lx}" cy="${ly}" r="8" fill="#ffd7a8"/><circle cx="${sx}" cy="${sy}" r="8" fill="#ffd7a8"/>
      <text x="${lx + 14}" y="${ly - 12}" class="t">LONDON</text><text x="${sx - 14}" y="${sy + 34}" class="t" text-anchor="end">SYDNEY</text>
      <text x="380" y="448" class="s" text-anchor="middle">YOUR FACE, AS LIGHT · 20,000 km OF GLASS CABLE</text>`);
  }
  // the egg of light: every point on it is the same light-travel distance from the lamp to your eye (side view)
  static egg(u) {
    const Lx = 170, Ex = 590, y0 = 200, a = 260, f = (Ex - Lx) / 2, b = Math.sqrt(a * a - f * f), cx = (Lx + Ex) / 2;
    // (the egg on the floor is where this oval of equal light paths meets the floor: it grows as more light arrives)
    const k = Math.min(1, u / 1.6), r = 0.25 + 0.75 * Ease.inOutSine(k);
    const A = f + (a - f) * r, B = Math.sqrt(Math.max(1, A * A - f * f)), fy = y0 + b * 0.62, h = fy - y0;
    const hx = B > h ? A * Math.sqrt(1 - (h / B) * (h / B)) : 0, q0 = (cx - hx).toFixed(1), q1 = (cx + hx).toFixed(1);
    const paths = hx > 2 ? [q0, q1].map((qx) => `<polyline points="${Lx},${y0} ${qx},${fy} ${Ex},${y0}" fill="none" stroke="#fff6e6" stroke-width="2.5" stroke-dasharray="8 7"/><circle cx="${qx}" cy="${fy}" r="7" fill="#fff6e6"/>`).join('') : '';
    return SlHud.svg(`<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,0.66)"/>
      <line x1="40" y1="${fy}" x2="720" y2="${fy}" stroke="rgba(222,214,196,0.45)" stroke-width="3"/>
      <text x="50" y="${fy + 34}" class="s">FLOOR</text>
      <ellipse cx="${cx}" cy="${y0}" rx="${A.toFixed(1)}" ry="${B.toFixed(1)}" fill="rgba(255,190,110,0.1)" stroke="rgba(255,215,168,0.75)" stroke-width="3"/>
      ${hx > 2 ? `<line x1="${q0}" y1="${fy}" x2="${q1}" y2="${fy}" stroke="#ffcf8a" stroke-width="9" stroke-linecap="round"/><text x="${cx}" y="${fy + 34}" class="t" text-anchor="middle">THE EGG OF LIGHT</text>` : ''}
      ${paths}
      <circle cx="${Lx}" cy="${y0}" r="15" fill="#ffd27a"/><text x="${Lx}" y="${y0 - 28}" class="t" text-anchor="middle">LAMP</text>
      <circle cx="${Ex}" cy="${y0}" r="11" fill="none" stroke="#fff" stroke-width="3"/><circle cx="${Ex}" cy="${y0}" r="4" fill="#fff"/><text x="${Ex}" y="${y0 - 28}" class="t" text-anchor="middle">YOU</text>
      <text x="380" y="448" class="s" text-anchor="middle">LAMP → FLOOR → YOU: ONE DISTANCE ALL ROUND</text>`);
  }
  // the light that stopped: the room and your eye are full of it, frozen; the next light you'd see is a hair from your
  // retina and never gets there (side view of an eye, not to scale)
  static eye(u, t) {
    const cx = 450, cy = 228, R = 168, rx = cx + R - 16, cap = (k) => MathX.smooth(t, slCap('last', k).show - 0.2, slCap('last', k).show + 0.4);
    const pk = (x, y, a, hot) => { let d = ''; for (let i = 0; i <= 24; i++) { const env = Math.exp(-Math.pow((i - 12) / 5.5, 2)); d += (i ? 'L' : 'M') + (x - 26 + i * 2.2).toFixed(1) + ' ' + (y - (hot ? 16 : 10) * env * Math.sin(i * 1.05)).toFixed(1); } return `<path d="${d}" fill="none" stroke="${hot ? '#fff1d6' : '#ffd7a8'}" stroke-width="${hot ? 4 : 2.5}" opacity="${a}"/>`; };
    // frozen packets: in the room (left of the eye) and inside it; one, nearest the retina, is the next you'd have seen
    let packets = '';
    for (let i = 0; i < 26; i++) {
      const x = 40 + slR(i, 61) * 640, y = 60 + slR(i, 62) * 340, inEye = Math.hypot(x - cx, y - cy) < R - 18;
      if (Math.hypot(x - cx, y - cy) < R + 14 && !inEye) continue;
      if (Math.abs(y - cy) < 22 && x > rx - 70) continue;
      packets += pk(x, y, inEye ? 0.42 + 0.3 * cap(1) : 0.38, false);
    }
    const hx = rx - 34, hot = cap(0);
    return SlHud.svg(`<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,0.72)"/>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(240,236,228,${(0.08 + 0.08 * cap(1)).toFixed(3)})" stroke="rgba(240,236,228,${(0.5 + 0.4 * cap(1)).toFixed(3)})" stroke-width="3"/>
      <path d="M ${cx - R + 18} ${cy - 76} A 86 86 0 0 0 ${cx - R + 18} ${cy + 76}" fill="rgba(160,200,230,0.22)" stroke="rgba(200,225,240,0.8)" stroke-width="3"/>
      <ellipse cx="${cx - R + 50}" cy="${cy}" rx="22" ry="54" fill="rgba(255,240,210,0.2)" stroke="rgba(255,240,210,0.7)" stroke-width="2.5"/>
      <path d="M ${cx + R - 22} ${cy - 92} A ${R - 14} ${R - 14} 0 0 1 ${cx + R - 22} ${cy + 92}" fill="none" stroke="#e8846a" stroke-width="8"/>
      ${packets}
      ${pk(hx, cy, 0.35 + 0.65 * hot, true)}
      <circle cx="${hx}" cy="${cy}" r="34" fill="rgba(255,225,170,${(0.18 * hot).toFixed(3)})"/>
      <g opacity="${hot.toFixed(3)}"><line x1="${hx}" y1="${cy - 30}" x2="${hx + 40}" y2="${cy - R - 8}" stroke="#fff1d6" stroke-width="2"/>
        <text x="${hx + 70}" y="${cy - R - 14}" class="t" text-anchor="end">THE NEXT LIGHT YOU'D SEE</text></g>
      <g opacity="${cap(2).toFixed(3)}"><line x1="${hx + 20}" y1="${cy + 26}" x2="${hx + 70}" y2="${cy + R + 4}" stroke="#fff" stroke-width="2"/>
        <text x="${hx + 100}" y="${cy + R + 28}" class="t" text-anchor="end">A HAIR FROM YOUR RETINA</text></g>
      <text x="${cx + R + 16}" y="${cy - 100}" class="s" text-anchor="start">RETINA</text>
      <text x="${cx - R - 6}" y="${cy - 92}" class="s" text-anchor="end">CORNEA</text>
      <text x="380" y="452" class="s" text-anchor="middle">ALL THE LIGHT HERE HAS STOPPED</text>`);
  }
  // car 2, from above: the real car (unseen) outruns the light it gives off; that light's circles pile up into a cone
  // behind it (like a jet's sound); when the cone's edge reaches you, you see it, and from then on light from two of
  // its past moments reaches you at once: two images, one going on, one running backwards
  static car2(u, t) {
    const E0 = SL_ST.eye[0], V = -SL_ST.v2, Tp = SL.car2Tp, xr = E0 + V * (t - Tp), c = slC(t);
    const cen = [E0, SL_ST.carY, SL_ST.lane], seen = t >= SL.car2Seen;
    const tA = seen ? slMoveTau(t, c, SL_ST.eye, cen, [V, 0, 0], Tp, 1) : NaN, tB = seen ? slMoveTau(t, c, SL_ST.eye, cen, [V, 0, 0], Tp, -1) : NaN;
    const xA = isNaN(tA) ? null : E0 + V * tA, xB = isNaN(tB) ? null : E0 + V * tB;
    // to scale (px per metre): wide while it comes, close for the moment it appears and splits, wide again after
    const k = t < Tp ? Math.min(20, 330 / (Math.abs(xr - E0) + 14)) : slLerp(20, 6.5, slK(t, Tp + 1.6, Tp + 5.5));
    const X = (x) => 380 + (x - E0) * k, yL = 196, yY = yL + SL_ST.b * k;
    // the circles of light it gave off (every 0.4 s over the last 24 s), as far as each has got; the two reaching you now
    const ring = (te, a, w) => { const r = slDistBetween(te, t) * k; return `<circle cx="${X(E0 + V * (te - Tp)).toFixed(1)}" cy="${yL}" r="${r.toFixed(1)}" fill="none" stroke="rgba(255,215,168,${a.toFixed(3)})" stroke-width="${w}"/>`; };
    let rings = '';
    for (let i = 0; i < 60; i++) { const te = Math.floor(t / 0.4) * 0.4 - i * 0.4; if (te <= t && te > t - 24) rings += ring(te, 0.45 * Math.exp(-i / 34), 1.6); }
    const hot = (tt) => isNaN(tt) ? '' : ring(Tp + tt, 0.9, 3);
    const L = 4.6 * k, Wd = Math.max(10, 1.9 * k), on = (x) => X(x) > -L && X(x) < 760 + L;
    const car = (x, fill, stroke, dash) => on(x) ? `<rect x="${(X(x) - L / 2).toFixed(1)}" y="${(yL - Wd / 2).toFixed(1)}" width="${L.toFixed(1)}" height="${Wd.toFixed(1)}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="3" ${dash ? 'stroke-dasharray="7 5"' : ''}/>` : '';
    const txt = (x, y, an, a, b) => `<text x="${x.toFixed(1)}" y="${y}" class="t" text-anchor="${an}">${a}</text>${b ? `<text x="${x.toFixed(1)}" y="${y + 25}" class="s" text-anchor="${an}">${b}</text>` : ''}`;
    // a label over a car, or at the edge with an arrow and how far, once it has left the diagram
    const lab = (x, y, an, a, b) => {
      const px = X(x), d = Math.round(Math.abs(x - E0));
      if (px > 745) return txt(742, y, 'end', a + ' →', `${d} m${b ? ' · ' + b : ''}`);
      if (px < 15) return txt(18, y, 'start', '← ' + a, `${d} m${b ? ' · ' + b : ''}`);
      // (flip to the other side rather than run off the edge: about 260 px of text)
      if (an === 'start' && Math.max(px - L / 2, 18) + 260 > 742) an = 'end';
      else if (an === 'end' && Math.min(px + L / 2, 742) - 260 < 18) an = 'start';
      const ax = an === 'end' ? Math.min(px + L / 2, 742) : an === 'start' ? Math.max(px - L / 2, 18) : MathX.clamp(px, 140, 620);
      return txt(ax, y, an, a, b);
    };
    const ray = (x) => on(x) ? `<line x1="${X(x).toFixed(1)}" y1="${yL}" x2="380" y2="${yY.toFixed(1)}" stroke="#fff6e6" stroke-width="2.5" stroke-dasharray="6 6"/>` : '';
    const realAn = X(xr) > 560 ? 'end' : X(xr) < 200 ? 'start' : 'middle';
    return SlHud.svg(`<defs><clipPath id="slc2"><rect x="0" y="0" width="760" height="470" rx="22"/></clipPath></defs>
      <rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,0.76)"/>
      <g clip-path="url(#slc2)">
        <rect x="0" y="${(yL - Math.max(14, 2.0 * k)).toFixed(1)}" width="760" height="${(2 * Math.max(14, 2.0 * k)).toFixed(1)}" fill="rgba(222,214,196,0.12)"/>
        ${rings}${hot(tA)}${hot(tB)}${xA !== null ? ray(xA) : ''}${xB !== null ? ray(xB) : ''}
        ${car(xr, 'none', 'rgba(255,255,255,0.85)', true)}${xA !== null ? car(xA, '#3a3226', '#d9a92e', false) : ''}${xB !== null ? car(xB, '#d9a92e', '#fff3c4', false) : ''}
      </g>
      <circle cx="380" cy="${yY.toFixed(1)}" r="10" fill="#fff"/><text x="380" y="${(yY + 38).toFixed(1)}" class="t" text-anchor="middle">YOU</text>
      ${lab(xr, yL - 156, realAn, seen ? 'WHERE IT REALLY IS' : 'THE CAR', seen ? 'UNSEEN' : 'HEARD, NOT SEEN')}
      ${xA !== null ? lab(xA, yL - 104, 'end', 'IT, DRIVING ON', 'TOO RED TO SEE') : ''}
      ${xB !== null ? lab(xB, yL - 52, 'start', 'ITS PAST', 'RUNNING BACKWARDS') : ''}
      <text x="380" y="452" class="s" text-anchor="middle">FROM ABOVE · THE RINGS ARE ITS LIGHT</text>`);
  }
  // Mum's text: radio from the mast, stopped on the way to your phone
  static text(u, t) {
    const gone = Math.min(SL.textDist, slDistBetween(SL.textSent, SL.stop)), f = gone / SL.textDist, x0 = 110, x1 = 650, x = x0 + (x1 - x0) * f;
    return SlHud.svg(`<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,0.7)"/>
      <line x1="${x0}" y1="300" x2="${x1}" y2="300" stroke="rgba(222,214,196,0.4)" stroke-width="3" stroke-dasharray="6 9"/>
      <path d="M ${x0} 300 L ${x0 - 26} 180 L ${x0 + 26} 180 Z" fill="none" stroke="#e9e2d4" stroke-width="4"/><line x1="${x0}" y1="180" x2="${x0}" y2="150" stroke="#e9e2d4" stroke-width="4"/>
      <text x="${x0}" y="340" class="t" text-anchor="middle">MAST</text>
      <path d="M ${x1 - 46} 300 L ${x1 - 46} 240 L ${x1} 205 L ${x1 + 46} 240 L ${x1 + 46} 300 Z" fill="rgba(222,214,196,0.15)" stroke="#e9e2d4" stroke-width="4"/>
      <text x="${x1}" y="340" class="t" text-anchor="middle">HOME</text>
      ${[0, 1, 2].map((i) => `<path d="M ${x + 8 + i * 14} 282 A 24 24 0 0 1 ${x + 8 + i * 14} 318" fill="none" stroke="#ffd7a8" stroke-width="${4 - i}" opacity="${1 - i * 0.28}"/>`).join('')}
      <rect x="${x - 70}" y="196" width="160" height="56" rx="20" fill="#3a7bd5"/><text x="${x + 10}" y="232" class="b" text-anchor="middle">On my way x</text>
      <text x="380" y="420" class="s" text-anchor="middle">HER TEXT · ${slThousands(SL.textDist - gone)} m FROM YOUR PHONE · NOT MOVING</text>`);
  }
}
