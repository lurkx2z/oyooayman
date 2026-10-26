/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     the readout: LIGHT TURNS AROUND IN (the countdown), then SINCE LIGHT TURNED AROUND · how long · one
                  fact that grows (the mirror stars back in your sky, then how much sunlight hits the Earth) · NEXT;
                  under it one context line for the scene
     bottom left  the honest label (thought experiment / illustration / sped up / slowed down / time-lapse / real)
     top right    the time where you are (in Hawaii, theirs under it); in the lantern replay, billionths of a second
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams: the rule, why the stars come back mirrored, the card's sunspots, how much sunlight,
                  a year of sunlight, a phase-conjugate mirror, a light wave
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

function lbThousands(n) { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
const lbMinSec = (x) => { const v = Math.max(0, Math.ceil(x - 1e-6)); return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0'); };
// a day's sunlight at the top of the air (MJ/m²) at latitude lat for a sun at declination dec, r AU away
function lbDailyMJ(lat, dec, r = 1) {
  const p = lat * LB_D2R, d = dec * LB_D2R, c = MathX.clamp(-Math.tan(p) * Math.tan(d), -1, 1), h0 = Math.acos(c);
  return 1361 * 86400 / Math.PI / (r * r) * (h0 * Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.sin(h0)) / 1e6;
}
// the year at your garden: [day, normal, now] (the Sun ×2 plus the second Sun at the opposite declination)
const LB_YEAR = Array.from({ length: 74 }, (_, i) => {
  const day = i * 5, dec = -23.44 * Math.cos(2 * Math.PI * (day + 10) / 365), r = 1 - 0.0167 * Math.cos(2 * Math.PI * (day - 3) / 365);
  const one = lbDailyMJ(LBP.lat, dec, r);
  return [day, one, 2 * one + lbDailyMJ(LBP.lat, -dec, r)];
});
// the Sun's surface (°C) at brightness ×g (σT⁴: T ∝ g^¼; 5,772 K today)
const lbSurfaceC = (g) => 5772 * Math.pow(g, 0.25) - 273;

// how long since 10:00:00 the readout shows, per shot (null: no readout). The space shots after the first days run on
// their own clocks: days, months, years, billions of years.
function lbSince(t, shot, set) {
  const m = shot.mode, S = set && set._s;
  if (shot.set === 'space') {
    if (m === 'why' || m === 'shadow') return null;
    if (m === 'wave' || m === 'half') return { s: S ?? lbStoryAt(t) };
    if (m === 'voyager') return { s: lbStoryAt(t) };
    if (m === 'twosuns') return { s: lbAt(12, 0) + 86400 * (3 + (t - LB.space) * 0.1) };
    if (m === 'ice') { const k = MathX.smooth(t, LB.ice + 0.6, LB.ice + 4.2), mo = 0.15 * Math.pow(4 / 0.15, k); return { s: mo * 30.4 * 86400, txt: mo < 1 ? Math.round(mo * 30.4) + ' DAYS' : mo < 1.5 ? '1 MONTH' : Math.round(mo) + ' MONTHS' }; }
    if (m === 'boil') { const k = MathX.smooth(t, lbCap('boil', 0).show, lbCap('boil', 2).show + 6), y = Math.pow(10, 3 * k); return { s: y * 3.156e7, txt: lbThousands(y) + (y < 1.5 ? ' YEAR' : ' YEARS') }; }
    if (m === 'birth') { const k = MathX.smooth(t, LB.birth + 0.5, LB.nightBack - 0.2), y = 1000 * Math.pow(4.6e9 / 1000, k); return { s: y * 3.156e7, txt: lbThousands(y) + ' YEARS', y }; }
    return null;
  }
  if (m === 'open' || m === 'title' || m === 'replay' || m === 'nightback' || m === 'real') return null;
  if (m === 'question') return { s: LB_GARDEN.skyTime(t, m) };
  return { s: lbStoryAt(t) };
}
// the next thing that will happen (story s), for the readout's NEXT line
const LB_NEXT = [[LB_SKY.on, 'A SECOND SUN'], [LBP.tSun, 'THE SUN COMES BACK'], [LB_SUNRISE.s, 'TWO SUNS AT ONCE']];

// the scene's context line: [from, to, label, value(t, s)] (value: { v, v2 } with HTML)
const LB_CTX = [
  [lbCap('past', 1).show, LB.hawaii - 0.2, 'THE SECOND SUN SHOWS THE SUN AT', (t, s) => ({ v: lbClockText(lbSecondShows(s), true) + ' PM', v2: 'ONE SECOND FURTHER BACK EVERY SECOND' })],
  [LB.wait + 0.3, LB.voyager - 0.2, 'NEW SUNLIGHT ARRIVES IN', (t, s) => ({ v: lbMinSec(LBP.tSun - s), v2: 'IT LEAVES THE SUN AT 10:00:00' })],
  [LB.voyager + 0.3, LB.ret - 0.2, 'VOYAGER 1', () => ({ v: '25.7 BILLION km AWAY', v2: 'ITS RADIO SIGNAL: 23.8 HOURS OLD' })],
  [LB.ret + 0.2, LB.back - 0.05, 'NEW SUNLIGHT ARRIVES IN', (t, s) => ({ v: lbMinSec(LBP.tSun - s) })],
  [lbCap('double', 2).show, LB.full - 0.2, 'THE SUN\'S SURFACE', (t, s) => { const g = lbSunGain(s - LBP.tSun); return { v: lbThousands(Math.round(lbSurfaceC(g) / 100) * 100) + ' °C', v2: 'BRIGHTNESS × ' + g.toFixed(2) }; }],
  [lbCap('midnight', 1).show, lbCap('midnight', 2).show - 0.3, 'THE SECOND SUN', (t, s) => ({ v: lbAltAz(lbSc(lbSunDir(s), -1), lbFrame(s)).alt.toFixed(0) + '° ABOVE THE HORIZON', v2: 'THE REAL SUN AT NOON TODAY: ' + LB_NOON_ALT.toFixed(0) + '°' })],
  [lbCap('noon', 1).show, LB.never - 0.2, 'ULTRAVIOLET FROM THE SUN', () => ({ v: 'ABOUT × 3.6', v2: 'A HOTTER SUN IS A BLUER SUN' })],
  [LB.heat + 0.3, LB.boil - 0.2, 'EXTRA HEAT THE EARTH SOAKS UP', () => ({ v: '476 W PER m²', v2: 'CLIMATE CHANGE TODAY: ABOUT 1 TO 2 W PER m²' })],
  [lbCap('birth', 1).show, LB.nightBack - 0.2, 'THE SECOND SUN SHOWS THE SUN', (t, s, o) => ({ v: (o && o.y >= 1e9 ? (o.y / 1e9).toFixed(1) + ' BILLION' : lbThousands(o ? o.y : 0)) + ' YEARS AGO' })],
];
const LB_NOON_ALT = lbAltAz(lbSunDir(lbAt(12, 0) - 86400), lbFrame(lbAt(12, 0) - 86400)).alt;
// the honest labels: [from, to, text] (the first match wins); a time-lapse says so on its own
const LB_TAGS = [
  [LB.rule + 0.3, LB.count, 'THOUGHT EXPERIMENT · ONLY THE DIRECTION OF LIGHT CHANGES'],
  [LB.replay, LB.replayEnd, 'ILLUSTRATION · SLOWED DOWN A BILLION TIMES'],
  [LB.why, LB.wave, 'ILLUSTRATION · NOT TO SCALE'],
  [LB.wave, LB.moonwhy, 'ILLUSTRATION · SPED UP 20×'],
  [lbCap('project', 0).show, LB.past, 'PROJECTED ONTO A CARD · NEVER LOOK AT THE SUN'],
  [LB.past, LB.hawaii, 'THROUGH A SOLAR FILTER'],
  [LB.half, LB.wait, 'ILLUSTRATION'],
  [LB.voyager, LB.ret, 'ILLUSTRATION · NOT TO SCALE'],
  [LB.sunClose, LB.full, 'THROUGH A SOLAR FILTER'],
  [LB.space, LB.summer, 'ILLUSTRATION · TIME-LAPSE'],
  [LB.heat, LB.nightBack, 'ILLUSTRATION · TIME-LAPSE'],
  [LB.nightBack, LB.real, 'BILLIONS OF YEARS FROM NOW'],
  [LB.real2, LB.question - 0.1, 'REAL'],
];
// a caption's text with its numbers in amber
function lbCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\d(?:[\d,]|[.:%]\d|%)*(?:\s?%|\s?°C|\s?(?:AM|PM)|\s(?:and a half\s)?(?:billion\s)?(?:kilometres|minutes|seconds|hours|times|years)(?:\s\d+\sseconds)?)?|\b(?:Midnight|Noon|twice|ten minutes|a thousand years|Billions of years|hundreds of times|1\.3 seconds)\b/g, (m) => `<span class="n">${m}</span>`);
}

class LbHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('lb-ro', '<div class="l"></div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('lb-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('lb-tag');
    this.clock = mk('lb-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>'); this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.cap = mk('lb-cap');
    this.caps = LBT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: lbCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('lb-inset');
    this.labels = [];
    this.root = root;
    this._last = {};
    this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  // the mirror-image stars above your horizon whose light has come back (the garden's sky)
  _starsBack(s, set) {
    const T = set && set.sky && set.sky.table; if (!T) return 0;
    const up = lbFrame(s).up; let n = 0;
    for (const st of T) if (st.t <= s && lbDot(st.d, up) < 0) n++;
    return n;
  }

  update(t, shot, set, app) {
    const W = StoryHUD.win, lapse = lbLapsing(t) && shot.set !== 'space', m = shot.mode;
    // ---- the readout
    const since = lbSince(t, shot, set);
    const ra = since ? Math.max(W(t, LB.before + 0.4, LB.real - 0.2, 0.5, 0.4), W(t, LB.question + 0.3, LB.end + 1, 0.6, 0.3)) : 0;
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const s = since.s;
      if (s < 0) {
        this._txt('rol', this.roL, 'LIGHT TURNS AROUND IN');
        this._html('rov', this.roV, '0:' + String(Math.min(59, Math.ceil(-s - 1e-6))).padStart(2, '0'));
        this._txt('ros', this.roS, 'EVERY RAY · EVERYWHERE · AT ONCE');
        this._txt('ron', this.roN, '');
      } else {
        this._txt('rol', this.roL, 'SINCE LIGHT TURNED AROUND');
        this._html('rov', this.roV, (since.txt || lbFmtSince(s)).replace(/ ([A-Z]+)$/, '<small> $1</small>').replace(/ (min|s) /g, '<small> $1 </small>').replace(/ s$/, '<small> s</small>'));
        let sub;
        if (shot.set === 'garden' && s < LB_SKY.on) sub = 'MIRROR-IMAGE STARS BACK: ' + lbThousands(this._starsBack(s, set));
        else if (s < LBP.tSun) sub = shot.set === 'space' && m === 'wave' ? 'THE NIGHT SIDE IS LIGHTING UP' : 'THE REAL SUN: OUT';
        else sub = 'SUNLIGHT HITTING THE EARTH: × ' + (1 + lbSunGain(s - LBP.tSun)).toFixed(2);
        if (m === 'birth') sub = 'THE SECOND SUN: STILL RUNNING BACKWARDS';
        this._txt('ros', this.roS, sub);
        const nx = shot.set === 'space' && m !== 'voyager' ? null : LB_NEXT.find(([at]) => at > s + 0.5);
        this._txt('ron', this.roN, nx ? 'NEXT · ' + nx[1] + ' · ' + lbClockText(Math.round(nx[0]), true) + ' ' + lbAmPm(nx[0]) : '');
      }
    }
    // ---- the context line
    const cx = LB_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t, since ? since.s : lbStoryAt(t), since);
      this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || '');
      this._set('cxt', this.ctx, 'top', ra > 0.05 ? '' : 'calc(var(--u) * 44)');
    }
    // ---- the honest label (a time-lapse first)
    const tg = lapse && m !== 'question' ? [t - 1, t + 1, 'TIME-LAPSE'] : LB_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? (tg[2] === 'TIME-LAPSE' ? '1' : W(t, tg[0], tg[1], 0.5, 0.4).toFixed(3)) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the time where you are
    const noClock = (shot.set === 'space' && m !== 'wave' && m !== 'half' && m !== 'voyager') || m === 'nightback';
    const ca = noClock ? 0 : Math.max(W(t, 0.4, LB.titleShot - 0.1, 0.5, 0.3), W(t, LB.before + 0.3, LB.end + 1, 0.5, 0.6));
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      if (m === 'replay') {
        // a billion times slower: one second of film is a billionth of a second
        const tau = t - (lbCap('replay', 1).show + 0.4), a = Math.abs(tau).toFixed(1);
        this._txt('ckl', this.clockL, 'TONIGHT');
        this._html('ckv', this.clockV, '10:00<small>:00</small> <i>PM</i>');
        this._txt('ckf', this.clockF, tau < 0 ? a + ' BILLIONTHS OF A SECOND BEFORE' : '+ ' + a + ' BILLIONTHS OF A SECOND');
      } else {
        const s = shot.set === 'space' ? since.s : shot.set === 'garden' ? LB_GARDEN.skyTime(t, m) : lbStoryAt(t), c = lbClockParts(s);
        this._txt('ckl', this.clockL, c.day <= 0 ? 'TONIGHT' : c.day === 1 ? 'TOMORROW' : Math.max(2, Math.round(s / 86400)) + ' DAYS LATER');
        this._html('ckv', this.clockV, `${c.h12}:${String(c.m).padStart(2, '0')}<small>:${String(c.s).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
        if (lbInHawaii(t)) { const h = lbClockParts(s, -10); this._txt('ckf', this.clockF, `IN HAWAII ${h.h12}:${String(h.m).padStart(2, '0')}:${String(h.s).padStart(2, '0')} ${h.pm ? 'PM' : 'AM'}`); }
        else this._txt('ckf', this.clockF, '');
      }
    }
    // ---- the caption
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'lb-cap q' : 'lb-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, since ? since.s : lbStoryAt(t));
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'lb-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = LbHud._p || (LbHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      const right = lx > 62;
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ((ra > 0.05 || cx) && lx < 40 ? Math.max(ly, 46) : Math.max(ly, 18)).toFixed(2) + '%';
      d.className = right ? 'lb-lab r' : 'lb-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
    });
  }

  // the diagrams (SVG, 760×470 design px, right of centre; 'big' ones larger and centred)
  _insets(t, s) {
    const W = StoryHUD.win;
    const which = [
      ['rule', lbCap('rule', 0).show + 0.2, LB.count - 0.2],
      ['mirror', lbCap('mirror', 0).show + 0.2, LB.replay - 0.2],
      ['project', lbCap('project', 1).show - 0.3, LB.past - 0.2],
      ['three', LB.three + 0.3, LB.midnight - 0.2],
      ['summer', LB.summer + 0.4, LB.heat - 0.2],
      ['pcm', LB.real4 + 0.3, LB.real5 - 0.2],
      ['wave', LB.real5 + 0.3, LB.question - 0.2],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.5, 0.5) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'lb-inset' : which[0] === 'pcm' || which[0] === 'wave' ? 'lb-inset big' : which[0] === 'mirror' || which[0] === 'project' ? 'lb-inset left' : 'lb-inset');
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = LbHud[k](u, t, s);
  }
  static svg(body) { return `<svg viewBox="0 0 760 470" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.68) { return `<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static arrow(x, y, dir, col, len = 34) { const d = dir > 0 ? 1 : -1; return `<line x1="${(x - d * len / 2).toFixed(1)}" y1="${y}" x2="${(x + d * len / 2).toFixed(1)}" y2="${y}" stroke="${col}" stroke-width="5" stroke-linecap="round"/><path d="M${(x + d * len / 2 + d * 4).toFixed(1)} ${y} l${-d * 16} -10 l0 20 z" fill="${col}"/>`; }
  // the rule: light on its way out from a lamp; at 10:00 every ray turns round and goes back; the lamp keeps shining
  static rule(u, t) {
    const flip = LB.flipRule - (lbCap('rule', 0).show + 0.2), sp = 110, x0 = 120;
    let s = '';
    for (let i = 0; ; i++) {
      const e = -8 + i * 0.95; if (e > u) break;                      // a ray sent at u = e
      const old = e < flip, back = old && u >= flip;
      const x = old ? x0 + (Math.min(u, flip) - e) * sp - Math.max(0, u - flip) * sp : x0 + (u - e) * sp;
      for (const y of old ? [150, 235, 320] : [192, 278]) if (x > x0 + 34 && x < 730) s += LbHud.arrow(x, y, back ? -1 : 1, back ? '#ffcf8a' : '#f6efe2');
    }
    return LbHud.svg(`${LbHud.plate()}
      <circle cx="${x0}" cy="235" r="34" fill="#ffd79a"/><circle cx="${x0}" cy="235" r="58" fill="rgba(255,215,154,0.18)"/>
      <text x="${x0}" y="380" class="s" text-anchor="middle">A LAMP</text>${s}
      <text x="40" y="50" class="t">${u < flip ? 'LIGHT ON ITS WAY OUT' : 'AT 10:00:00, EVERY RAY TURNS ROUND'}</text>
      <text x="40" y="440" class="b" opacity="${MathX.smooth(u, flip + 1.5, flip + 2.5)}">AMBER: OLD LIGHT, GOING BACK · WHITE: NEW LIGHT</text>`);
  }
  // a star's light: before 10:00 it streams past the Earth (leaving a shadow behind it); then every ray turns round.
  // The Earth moves on, out of its own shadow, and the light coming back hits its far side: the star, seen backwards
  static mirror(u) {
    const flip = 1.8, sp = 70, ex = 430, R = 46, ey = 250 - 62 * MathX.smooth(u, flip + 0.6, flip + 4.0), gap = 60;
    let s = '';
    for (const y of [160, 190, 220, 250, 280, 310, 340]) {
      const band = Math.abs(y - 250) < R;                             // behind the Earth (where it was): its shadow
      for (let i = -12; i < 16; i++) {
        let x, dir = 1;
        if (u < flip) x = 20 + i * gap + ((u * sp) % gap);
        else { x = 20 + i * gap + ((flip * sp) % gap) - (u - flip) * sp; dir = -1; }
        const x0 = u < flip ? x : x + (u - flip) * sp;               // where it was at 10:00
        if (band && x0 > ex) continue;
        if (dir < 0 && x0 > ex) { const dy = y - ey; if (Math.abs(dy) < R && x < ex + Math.sqrt(R * R - dy * dy)) continue; }   // it hit the Earth
        if (x > 84 && x < 740) s += LbHud.arrow(x, y, dir, dir > 0 ? '#f6efe2' : '#ffcf8a', 26);
      }
    }
    const g = MathX.smooth(u, flip + 3.4, flip + 4.4);
    return LbHud.svg(`${LbHud.plate()}
      <circle cx="58" cy="250" r="14" fill="#f6efe2"/><text x="40" y="300" class="s">A STAR</text>
      ${s}<circle cx="${ex}" cy="${ey.toFixed(1)}" r="${R}" fill="#2a5aa0" stroke="#f6efe2" stroke-width="3"/>
      <circle cx="${ex + R - 7}" cy="${ey.toFixed(1)}" r="7" fill="#fff"/><text x="${ex}" y="${(ey + R + 30).toFixed(1)}" class="s" text-anchor="middle">YOU</text>
      <g opacity="${g}"><circle cx="712" cy="${ey.toFixed(1)}" r="14" fill="none" stroke="#ffcf8a" stroke-width="4" stroke-dasharray="5 5"/>
      <text x="730" y="${(ey + 52).toFixed(1)}" class="s" text-anchor="end">YOU SEE IT HERE</text></g>
      <text x="40" y="50" class="t">${u < flip ? 'STARLIGHT STREAMING PAST THE EARTH' : 'IT ALL TURNS ROUND AND COMES BACK'}</text>
      <text x="40" y="440" class="b" opacity="${MathX.smooth(u, flip + 1.5, flip + 2.5)}">THE EARTH MOVES ON, INTO THE LIGHT COMING BACK</text>`);
  }
  // the card: the same sunspots, back to front
  static project(u) {
    const g = MathX.smooth(u, 0.2, 1.2), q = MathX.smooth(u, 1.4, 2.4);
    const disc = (cx, cy, R, flip, a) => `<g opacity="${a}"><circle cx="${cx}" cy="${cy}" r="${R}" fill="#ffd9a0"/>` +
      LB_SPOTS.map(([sx, sy, sr]) => `<circle cx="${(cx + (flip ? -sx : sx) * R).toFixed(1)}" cy="${(cy + sy * R).toFixed(1)}" r="${Math.max(2.5, sr * R).toFixed(1)}" fill="#3a2414"/>`).join('') + '</g>';
    return LbHud.svg(`${LbHud.plate()}
      ${disc(200, 245, 130, false, g)}${disc(560, 245, 130, true, q)}
      <text x="200" y="420" class="s" text-anchor="middle" opacity="${g}">THE SUN THIS AFTERNOON</text>
      <text x="560" y="420" class="s" text-anchor="middle" opacity="${q}">THE SECOND SUN NOW</text>
      <text x="40" y="50" class="t">THE SAME SUNSPOTS · BACK TO FRONT</text>`);
  }
  // how much sunlight lands on the Earth: before tonight, Venus, now
  static three(u) {
    const rows = [[1, 'EARTH, UNTIL TONIGHT', '× 1', 0.2], [1.91, 'VENUS', '× 1.9', 0.9], [3, 'EARTH, NOW', '× 3', 1.6]];
    let s = '';
    rows.forEach(([v, name, val, at], i) => {
      const k = MathX.smooth(u, at, at + 0.8); if (k <= 0) return;
      const y = 140 + i * 105, w = v * 110 * k;
      s += `<text x="40" y="${y + 9}" class="b" opacity="${k}">${name}</text><rect x="320" y="${y - 20}" width="${w.toFixed(1)}" height="40" rx="8" fill="${i === 2 ? '#ffcf8a' : '#f6efe2'}" opacity="${0.88 * k}"/>
        <text x="${(330 + w).toFixed(1)}" y="${y + 9}" class="s" opacity="${k}">${val}</text>`;
    });
    return LbHud.svg(`${LbHud.plate(0.72)}<text x="40" y="50" class="t">SUNLIGHT HITTING THE PLANET</text>${s}
      <text x="40" y="446" class="s">NOW: THE SUN × 2 + THE SECOND SUN × 1</text>`);
  }
  // a year of sunlight over Britain: as it was, and now (it never drops to the old midsummer)
  static summer(u) {
    const X = (d) => 90 + d / 365 * 630, Y = (v) => 400 - v * 3.0, k = MathX.smooth(u, 0.3, 2.3), q = MathX.smooth(u, 2.0, 4.2);
    const path = (j, f) => LB_YEAR.filter((r) => r[0] <= 365 * f + 1).map((r, i) => (i ? 'L' : 'M') + X(r[0]).toFixed(1) + ' ' + Y(r[j]).toFixed(1)).join('');
    const mid = Math.max(...LB_YEAR.map((r) => r[1]));
    const months = 'J F M A M J J A S O N D'.split(' ').map((mm, i) => `<text x="${X(i * 30.4 + 15).toFixed(1)}" y="436" class="s" text-anchor="middle">${mm}</text>`).join('');
    return LbHud.svg(`${LbHud.plate(0.72)}
      <line x1="90" y1="${Y(mid).toFixed(1)}" x2="720" y2="${Y(mid).toFixed(1)}" stroke="rgba(246,239,226,0.5)" stroke-width="2" stroke-dasharray="8 7"/>
      <text x="96" y="${(Y(mid) - 10).toFixed(1)}" class="s" style="fill:#f6efe2">OLD MIDSUMMER'S DAY</text>
      <path d="${path(1, k)}" fill="none" stroke="#f6efe2" stroke-width="4"/>
      <path d="${path(2, q)}" fill="none" stroke="#ffcf8a" stroke-width="5" opacity="${q > 0 ? 1 : 0}"/>
      <line x1="90" y1="400" x2="720" y2="400" stroke="rgba(222,214,196,0.5)" stroke-width="2"/>${months}
      <text x="40" y="50" class="t">SUNLIGHT PER DAY OVER BRITAIN</text>
      <text x="40" y="84" class="s"><tspan style="fill:#f6efe2">WHITE: A NORMAL YEAR</tspan> · AMBER: NOW</text>`);
  }
  // a phase-conjugate mirror: light through frosted glass comes back through it exactly the way it came
  static pcm(u) {
    const row = (y, conj, a) => {
      const ph = (u * 160) % 60;
      let s = `<rect x="300" y="${y - 52}" width="22" height="104" rx="6" fill="rgba(200,220,255,0.35)" stroke="#cfe0ff" stroke-width="2"/>
        <rect x="660" y="${y - 52}" width="14" height="104" fill="${conj ? '#ffcf8a' : '#c8ccd4'}"/>
        <circle cx="90" cy="${y}" r="14" fill="#fff"/>`;
      // out: a clean beam to the glass, a scrambled one after it
      s += `<line x1="104" y1="${y}" x2="300" y2="${y}" stroke="#fff" stroke-width="6" opacity="0.9"/>`;
      for (let i = 0; i < 5; i++) { const dy = (i - 2) * 18 + 8 * Math.sin(i * 2.1); s += `<line x1="322" y1="${y}" x2="660" y2="${(y + dy).toFixed(1)}" stroke="#fff" stroke-width="2.5" opacity="0.6"/>`; }
      // back
      const back = MathX.smooth(u, 1.2, 2.0);
      if (back > 0) {
        if (conj) { for (let i = 0; i < 5; i++) { const dy = (i - 2) * 18 + 8 * Math.sin(i * 2.1); s += `<line x1="660" y1="${(y + dy).toFixed(1)}" x2="322" y2="${y}" stroke="#ffcf8a" stroke-width="3" opacity="${0.9 * back}" stroke-dasharray="14 10" stroke-dashoffset="${ph}"/>`; }
          s += `<line x1="300" y1="${y}" x2="110" y2="${y}" stroke="#ffcf8a" stroke-width="6" opacity="${back}" stroke-dasharray="14 10" stroke-dashoffset="${ph}"/>`; }
        else for (let i = 0; i < 5; i++) { const dy = (i - 2) * 18 + 8 * Math.sin(i * 2.1), y2 = y + dy, y3 = y2 + dy * 1.4 + (i - 2) * 5; s += `<line x1="660" y1="${y2.toFixed(1)}" x2="330" y2="${y3.toFixed(1)}" stroke="#c8ccd4" stroke-width="2.5" opacity="${0.75 * back}" stroke-dasharray="14 10" stroke-dashoffset="${ph}"/>`; }
      }
      return `<g opacity="${a}">${s}</g>`;
    };
    const a1 = MathX.smooth(u, 0, 0.6), a2 = MathX.smooth(u, 2.6, 3.4);
    return LbHud.svg(`${LbHud.plate(0.74)}
      <text x="40" y="44" class="t">THROUGH FROSTED GLASS, THEN A MIRROR</text>
      <text x="40" y="88" class="s" opacity="${a1}">AN ORDINARY MIRROR</text>${row(152, false, a1)}
      <text x="40" y="272" class="s" opacity="${a2}">A PHASE-CONJUGATE MIRROR</text>${row(336, true, a2)}
      <text x="40" y="452" class="b" opacity="${MathX.smooth(u, 4, 5)}">IT COMES BACK EXACTLY THE WAY IT CAME</text>`);
  }
  // a light wave: electric (white) and magnetic (amber) fields; flip the magnetic one and the wave goes back
  static wave(u) {
    const flip = 3.2, f = MathX.smooth(u, flip, flip + 0.6), dir = u < flip ? 1 : -1, ph = (u < flip ? u : flip - (u - flip)) * 3.2, cx = 380;
    let e = '', b = '';
    for (let i = 0; i <= 120; i++) {
      const x = 80 + i * 5, a = (x - 80) / 600 * 4 * Math.PI - ph, E = Math.sin(a), B = Math.sin(a) * (1 - 2 * f);
      e += (i ? 'L' : 'M') + x + ' ' + (220 - 95 * E).toFixed(1);
      b += (i ? 'L' : 'M') + (x - 26 * B * 0.4).toFixed(1) + ' ' + (220 + 40 * B).toFixed(1);
    }
    return LbHud.svg(`${LbHud.plate(0.74)}
      <line x1="80" y1="220" x2="690" y2="220" stroke="rgba(222,214,196,0.4)" stroke-width="2"/>
      <path d="${e}" fill="none" stroke="#f6efe2" stroke-width="4"/>
      <path d="${b}" fill="none" stroke="#ffcf8a" stroke-width="4"/>
      ${LbHud.arrow(cx, 370, dir, '#fff', 120)}
      <text x="${cx}" y="414" class="s" text-anchor="middle">${dir > 0 ? 'WHICH WAY IT GOES' : 'NOW IT GOES BACK'}</text>
      <text x="40" y="50" class="t">A LIGHT WAVE</text>
      <text x="40" y="84" class="s"><tspan style="fill:#f6efe2">WHITE: ELECTRIC FIELD</tspan> · AMBER: MAGNETIC FIELD</text>
      <text x="40" y="452" class="b" opacity="${f}">FLIP THE MAGNETIC FIELD: THE WAVE TURNS ROUND</text>`);
  }
}
