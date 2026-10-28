/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     the readout: THE CUT IN (the countdown to 10:00), then THE SHOCK REACHES YOU IN (to 10:03:49), with
                  one fact under it (the bright stars left in your sky; what you weigh); after the shock, SINCE THE CUT
                  (the time-lapses); under it one context line for the scene
     bottom left  the honest label (thought experiment / illustration / slowed down / replay / time-lapse / estimate / real)
     top right    the time tonight; in the Moon's replay, the fraction of a second
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams: the rule, why you feel nothing, the shock on its way through the rock, and the real ones
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }]); the telescope's round field
   ===================================================================== */

function hvThousands(n) { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
const hvMinSec = (x) => { const v = Math.max(0, Math.ceil(x - 1e-6)); return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0'); };
// a time-lapse's "since 10:00": minutes, hours, days, years
function hvSinceTxt(s) {
  if (s < 3600) return Math.round(s / 60) + ' MIN';
  if (s < 86400) { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 600) * 10; return h + (h === 1 ? ' HOUR' : ' HOURS') + (m ? ' ' + m + ' MIN' : ''); }
  if (s < 3.156e7) { const d = Math.round(s / 86400); return d + (d === 1 ? ' DAY' : ' DAYS'); }
  const y = Math.round(s / 3.156e7); return y + (y === 1 ? ' YEAR' : ' YEARS');
}
// the story second the HUD reads in this shot (the space shots keep their own clocks)
function hvHudS(t, shot, set) {
  if (shot.mode === 'front' && t < HV.front + 5.0) return hvStoryAt(t);       // (the replay runs its own clock: the HUD stays on real time)
  if (shot.set === 'space' && set && set._s != null) return set._s;
  if (shot.mode === 'replay') return hvReplayS(t);
  return hvStoryAt(t);
}
// the scene's context line: [from, to, label, value(t, s, set)] (value: { v, v2 } with HTML)
const HV_CTX = [
  [hvCap('line', 0).show + 0.3, HV.moon - 0.2, 'STARS YOU CAN SEE', (t, s, set) => ({ v: 'ABOUT ' + hvThousands(Math.round((set && set.sky ? set.sky.starsLeft(s) : 0) / 10) * 10) + ' <small>OF ' + hvThousands(Math.round((set && set.sky ? set.sky.count0 : 0) / 100) * 100) + '</small>', v2: 'MOST WENT OUT WITHIN 0.04 SECONDS' })],
  [hvCap('face', 1).show, HV.blow - 0.2, 'AT THE CENTRE OF THE FACE', () => ({ v: '5,400 °C', v2: '3.6 MILLION ATMOSPHERES' })],
  [HV.blow + 0.4, HV.shock - 0.1, 'BLOWING OUT AT', () => ({ v: 'UP TO ABOUT 5 km A SECOND', v2: 'ESCAPE SPEED FROM THE FACE: 10.6 km/s' })],
  [hvCap('front', 1).show, HV.edge - 0.2, 'THE SHOCK HAS REACHED', (t, s) => { const P = HV_PLACES.filter((p) => p.t <= s && p.name !== 'LONDON').sort((a, b) => b.t - a.t)[0]; return { v: P ? P.name.charAt(0) + P.name.slice(1).toLowerCase() : 'the coast', v2: 'IT REACHES YOU AT 10:03:49' }; }],
  [hvCap('ears', 0).show + 0.3, HV.paris - 0.2, 'AIR PRESSURE', (t, s) => { const d = 1013 * (hvFelt(s).weight - 1); return { v: '+' + d.toFixed(0) + ' hPa <small>IN 3 MINUTES</small>', v2: 'LIKE A LIFT GOING DOWN ' + (Math.round(d * 8.4 / 10) * 10) + ' m' }; }],
  [hvCap('heavier', 0).show + 0.4, HV.ears - 0.2, 'WHAT YOU WEIGH', (t, s) => { const f = hvFelt(s); return { v: (f.weight * 100).toFixed(1) + ' %', v2: '“DOWN” TIPPED ' + f.tilt.toFixed(1) + '° TOWARDS THE CUT' }; }],
  [HV.count2 + 0.3, HV.hit - 0.1, 'WHAT YOU WEIGH', (t, s) => { const f = hvFelt(s); return { v: (f.weight * 100).toFixed(1) + ' %', v2: '“DOWN” TIPPED ' + f.tilt.toFixed(1) + '° TOWARDS THE CUT' }; }],
  [hvCap('fall', 1).show, HV.moonaway - 0.2, 'THE NEW EARTH', () => ({ v: 'ABOUT 4/5 AS WIDE', v2: 'ENOUGH HEAT TO MELT MOST OF IT' })],
  [hvCap('moonaway', 1).show, HV.orbit - 0.2, 'THE MOON’S SPEED', () => ({ v: '1,144 m/s', v2: 'ESCAPE SPEED FROM THE NEW EARTH: 1,052 m/s' })],
  [hvCap('orbit', 1).show, HV.forever - 0.2, 'THE NEW YEAR', () => ({ v: 'ABOUT 3 DAYS SHORTER', v2: 'THE HALF KEEPS ITS SPIN’S 0.09 km/s, ON TOP OF 30 km/s' })],
];
// the honest labels: [from, to, text] (the first match wins)
const HV_TAGS = [
  [HV.rule + 0.3, HV.count, 'THOUGHT EXPERIMENT'],
  [HV.line + 0.6, HV.moon, 'THE CUT DRAWN IN TO SHOW IT'],
  [HV.moon, HV.moonEnd, 'SLOWED DOWN 8× · THE CUT DRAWN IN'],
  [HV.shock, HV.calls, 'ILLUSTRATION · CROSS-SECTION'],
  [HV.front, HV.front + 5.0, 'REPLAY · THE FIRST 2 MINUTES, 25× FASTER'],
  [HV.gone, HV.calls, 'ILLUSTRATION'],
  [HV.front, HV.moonedge, 'ILLUSTRATION'],
  [HV.moonedge, HV.others, 'THROUGH YOUR TELESCOPE · THE GLOW DRAWN WIDER'],
  [HV.others, HV.tea, 'ILLUSTRATION'],
  [HV.sun, HV.cat2, 'ILLUSTRATION · NOT TO SCALE'],
  [HV.tea, HV.saturn, 'HOW STRONG THE TREMORS ARE IS A GUESS'],
  [HV.heavier, HV.paris, 'HOW MUCH YOUR WEIGHT CHANGES IS AN ESTIMATE'],
  [HV.alarms, HV.count2, 'HOW STRONG THE TREMORS ARE IS A GUESS'],
  [HV.paris, HV.alarms, 'ILLUSTRATION'],
  [HV.fall, HV.moonaway, 'ILLUSTRATION · TIME-LAPSE'],
  [HV.moonaway, HV.orbit, 'ILLUSTRATION · TIME-LAPSE · NOT TO SCALE'],
  [HV.orbit, HV.forever, 'ILLUSTRATION · TIME-LAPSE · NOT TO SCALE'],
  [HV.forever, HV.real, 'ILLUSTRATION'],
  [HV.real, HV.real2 - 0.1, 'TONIGHT · 9:59 PM'],
  [HV.real2, HV.real5, 'REAL'],
];
// a caption's text with its numbers in amber
function hvCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\d(?:[\d,½]|[.:]\d)*(?:\s?°C|\s?(?:PM|AM)|\s(?:billion light-years|million atmospheres|km every second|km a second|km|seconds|minutes|times))?(?:\s(?:to|and)\s\d+(?:\s(?:km a second|seconds))?)?|\b(?:four-fifths|half|Half|twelve|Twelve|Forever)\b/g, (m) => `<span class="n">${m}</span>`);
}

class HvHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.eye = mk('hv-eye');
    this.ro = mk('hv-ro', '<div class="l"></div><div class="v"></div><div class="s"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.ctx = mk('hv-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('hv-tag');
    this.clock = mk('hv-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>'); this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('hv-band'); this.cap = mk('hv-cap');
    this.caps = HVT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: hvCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('hv-inset');
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
    const W = StoryHUD.win, m = shot.mode, s = hvHudS(t, shot, set);
    // ---- the telescope's round field
    this._set('eye', this.eye, 'opacity', m === 'moonedge' ? '1' : '0');
    // ---- the readout
    const lapse = m === 'fall' || m === 'moonaway' || m === 'orbit' || m === 'forever';
    const ra = Math.max(W(t, 0.4, HV.titleShot - 0.05, 0.4, 0.05), W(t, HV.before + 0.4, HV.hit + 0.3, 0.5, 0.15), W(t, HV.fall + 0.6, HV.real - 0.2, 0.5, 0.4), W(t, HV.question + 0.3, HV.end + 1, 0.6, 0.3));
    this._set('ro', this.ro, 'opacity', (m === 'shock' ? ra * 0.0 : ra).toFixed(3));
    if (ra > 0) {
      if (lapse) {
        this._txt('rol', this.roL, 'SINCE THE CUT');
        this._html('rov', this.roV, hvSinceTxt(s).replace(/ ([A-Z]+)/g, '<small> $1</small>'));
        this._txt('ros', this.roS, m === 'forever' ? 'HALF THE SKY: STILL BLACK' : m === 'moonaway' ? 'THE MOON: DRIFTING AWAY' : m === 'orbit' ? 'STILL GOING ROUND THE SUN' : s < 3600 ? 'THE HALF-EARTH: FALLING IN' : 'A BALL AGAIN · MOSTLY MOLTEN');
      } else if (s < 0) {
        this._txt('rol', this.roL, 'THE CUT IN');
        this._html('rov', this.roV, hvMinSec(-s));
        this._txt('ros', this.roS, 'HALF THE UNIVERSE · ALL AT ONCE');
      } else {
        this._txt('rol', this.roL, s < HVP.tHit ? 'THE SHOCK REACHES YOU IN' : 'THE SHOCK');
        this._html('rov', this.roV, s < HVP.tHit ? hvMinSec(HVP.tHit - s) : 'NOW');
        const sky = set && set.sky;
        const weighs = HV_CTX.some((x) => t >= x[0] - 0.5 && t < x[1] + 0.4 && x[2] === 'WHAT YOU WEIGH');   // (the context line shows it then)
        const sub = s < 180 || weighs ? 'HALF THE UNIVERSE: GONE' : 'WHAT YOU WEIGH: ' + (hvFelt(s).weight * 100).toFixed(1) + ' %';   // (your weight only from 10:03, when it starts to show)
        this._txt('ros', this.roS, sub);
      }
    }
    // ---- the context line
    const cx = HV_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t, s, set);
      this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || '');
      this._set('cxt', this.ctx, 'top', ra > 0.05 && m !== 'shock' ? '' : 'calc(var(--u) * 44)');
    }
    // ---- the honest label
    const tg = HV_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.3).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the time tonight
    const ca = lapse ? 0 : Math.max(W(t, 0.4, HV.titleShot - 0.05, 0.4, 0.05), W(t, HV.before + 0.3, HV.hit + 0.3, 0.5, 0.15), W(t, HV.real + 0.3, HV.end + 1, 0.5, 0.6));
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = hvClockParts(s);
      this._txt('ckl', this.clockL, 'TONIGHT');
      this._html('ckv', this.clockV, `${c.h12}:${String(c.m).padStart(2, '0')}<small>:${String(c.s).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      if (m === 'replay') this._txt('ckf', this.clockF, (s >= 0 ? '+ ' : '− ') + Math.abs(s).toFixed(2) + ' s · SLOWED DOWN 8×');
      else if (m === 'front' && t < HV.front + 5.0 && set && set._s != null) this._txt('ckf', this.clockF, 'REPLAY 25× · ' + hvClockText(set._s, true));
      else this._txt('ckf', this.clockF, '');
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = HVT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'hv-cap q' : 'hv-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, s);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'hv-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = HvHud._p || (HvHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      let right = l.side ? l.side === 'r' : lx > 62;
      // (a label that would run off the side of the frame goes the other way)
      const wPct = vis && this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      d.style.left = lx.toFixed(2) + '%'; d.style.top = Math.min(76, (ra > 0.05 || cx) && lx < 40 ? Math.max(ly, 46) : Math.max(ly, 18)).toFixed(2) + '%';   // (never down on the caption)
      d.className = right ? 'hv-lab r' : 'hv-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
  }

  // the diagrams (SVG, 760×470 design px; 'mid'/'big' ones larger and centred)
  _insets(t, s) {
    const W = StoryHUD.win;
    const which = [
      ['rule', hvCap('rule', 0).show + 0.2, HV.count - 0.2, ''],
      ['why', hvCap('why', 0).show + 0.2, HV.gone - 0.2, ''],
      ['shock', HV.shock + 0.15, HV.calls - 0.15, 'mid'],
      ['observable', HV.real2 + 0.2, HV.real3 - 0.2, ''],
      ['float', HV.real3 + 0.2, HV.real4 - 0.2, ''],
      ['quake', HV.real4 + 0.2, HV.real5 - 0.2, ''],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.5, 0.5) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'hv-inset' : 'hv-inset ' + which[3]);
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = HvHud[k](u, t, s);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.7, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // the rule: the universe we can see is a ball round us; a plane through its middle; it goes through the Earth, and the Moon
  static rule(u) {
    const c = (k) => hvCap('rule', k).show - hvCap('rule', 0).show - 0.2, cm = hvW('rule', 'tonight').start - hvCap('rule', 0).show - 0.5;   // (each picture with its words)
    const p1 = MathX.smooth(u, 0.2, 1.0), p2 = MathX.smooth(u, c(2) - 0.3, c(2) + 0.7), p3 = MathX.smooth(u, cm - 0.3, cm + 0.7), cut = MathX.smooth(u, c(1) + 1.2, c(1) + 2.2);
    let gal = '';
    for (let i = 0; i < 70; i++) { const r = 185 * Math.sqrt(hvR(i, 41)), a = 6.2832 * hvR(i, 42), x = 380 + r * Math.cos(a), y = 245 + r * Math.sin(a) * 0.98, gone = y > 245 && cut > 0.5;
      gal += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4.5" ry="2" transform="rotate(${(hvR(i, 43) * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#f6efe2" opacity="${(gone ? 0.08 : 0.75).toFixed(2)}"/>`; }
    const ball = `<g opacity="${(p1 * (1 - p2)).toFixed(3)}"><circle cx="380" cy="245" r="195" fill="none" stroke="rgba(246,239,226,0.55)" stroke-width="2" stroke-dasharray="6 6"/>${gal}
      <circle cx="380" cy="245" r="6" fill="#ffcf8a"/><text x="392" y="236" class="s">US</text>
      <line x1="150" y1="245" x2="610" y2="245" stroke="#ffcf8a" stroke-width="3" opacity="${cut.toFixed(2)}"/>
      <text x="40" y="50" class="t">WHAT WE CAN SEE: A BALL ROUND US</text>
      <text x="40" y="446" class="b" opacity="${cut.toFixed(2)}">CUT IN HALF, IT’S CUT THROUGH US</text></g>`;
    const earth = `<g opacity="${(p2 * (1 - p3)).toFixed(3)}"><circle cx="380" cy="245" r="150" fill="#244c80" stroke="#f6efe2" stroke-width="2.5"/>
      <rect x="226" y="246" width="308" height="152" fill="rgba(6,9,14,0.86)"/><line x1="200" y1="245" x2="560" y2="245" stroke="#ffcf8a" stroke-width="3"/>
      <circle cx="${(380 + 150 * Math.cos(-20.2 * HV_D2R + Math.PI)).toFixed(1)}" cy="${(245 - 150 * Math.sin(20.2 * HV_D2R)).toFixed(1)}" r="6" fill="#fff"/>
      <text x="${(380 - 150 * Math.cos(20.2 * HV_D2R) - 10).toFixed(1)}" y="${(245 - 150 * Math.sin(20.2 * HV_D2R) - 12).toFixed(1)}" class="s" text-anchor="end">YOU</text>
      <text x="40" y="50" class="t">SO, THROUGH THE EARTH’S CENTRE</text></g>`;
    const mx = 700, moonP = `<g opacity="${p3.toFixed(3)}"><circle cx="140" cy="245" r="70" fill="#244c80" stroke="#f6efe2" stroke-width="2"/><rect x="66" y="246" width="148" height="72" fill="rgba(6,9,14,0.86)"/>
      <circle cx="${mx - 40}" cy="245" r="22" fill="#c9c6bd"/><rect x="${mx - 64}" y="246" width="48" height="24" fill="rgba(6,9,14,0.9)"/>
      <line x1="40" y1="245" x2="${mx}" y2="245" stroke="#ffcf8a" stroke-width="3"/><text x="${mx - 40}" y="210" class="s" text-anchor="middle">THE MOON</text>
      <text x="140" y="155" class="s" text-anchor="middle">THE EARTH</text><text x="40" y="50" class="t">AND TONIGHT, THROUGH THE MOON</text>
      <text x="40" y="446" class="b">BELOW THE LINE: GONE</text></g>`;
    return HvHud.svg(`${HvHud.plate()}${ball}${earth}${moonP}`);
  }
  // why you feel nothing: you, the ground and the air all get the same new pull at once
  static why(u) {
    const f = MathX.smooth(u, 0.3, 1.2), q = MathX.smooth(u, 4.0, 5.0), dy = 18 * MathX.smooth(u, 1.5, 4.0);
    const arrow = (x, y, a) => `<g opacity="${a}"><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 46}" stroke="#ffcf8a" stroke-width="5" stroke-linecap="round"/><path d="M${x - 10} ${y + 40} l10 16 l10 -16 z" fill="#ffcf8a"/></g>`;
    const g = `<g transform="translate(0 ${dy.toFixed(1)})">
      <rect x="80" y="300" width="600" height="60" fill="#3a2e24"/><rect x="80" y="290" width="600" height="12" fill="#2f4a2a"/>
      <circle cx="380" cy="190" r="16" fill="#f6efe2"/><rect x="368" y="208" width="24" height="56" rx="10" fill="#f6efe2"/><rect x="368" y="262" width="9" height="30" fill="#f6efe2"/><rect x="383" y="262" width="9" height="30" fill="#f6efe2"/>
      ${[150, 250].map((x) => `<circle cx="${x}" cy="150" r="4" fill="#9fb8d8"/><circle cx="${x + 40}" cy="200" r="4" fill="#9fb8d8"/>`).join('')}${[530, 610].map((x) => `<circle cx="${x}" cy="160" r="4" fill="#9fb8d8"/><circle cx="${x - 30}" cy="215" r="4" fill="#9fb8d8"/>`).join('')}
      ${arrow(420, 205, f)}${arrow(220, 160, f)}${arrow(560, 175, f)}${arrow(300, 318, f)}${arrow(470, 318, f)}</g>`;
    return HvHud.svg(`${HvHud.plate()}${g}
      <text x="40" y="50" class="t">YOU, THE GROUND, THE AIR</text>
      <text x="40" y="88" class="s" opacity="${f}">THE SAME NEW PULL, ALL AT ONCE</text>
      <text x="40" y="446" class="b" opacity="${q}">SO NOTHING PRESSES ON YOU DIFFERENTLY</text>`);
  }
  // the shock on its way: a slice through what's left, the face on the left, you on the surface
  static shock(u, t, s) {
    const Wd = 1100, Hd = 680, cx = 150, cy = 360, R = 300;
    const lon = (phi) => [cx + R * Math.sin(phi * HV_D2R), cy - R * Math.cos(phi * HV_D2R)];   // (φ from the face: 0 on the face's edge, top)
    const P = (phi, r) => [cx + r * R * Math.sin(phi * HV_D2R), cy - r * R * Math.cos(phi * HV_D2R)];
    // (the front: the surface point at φ_front, curving ahead of itself at depth where the rock is faster)
    const fp = hvFrontPhi(Math.max(0, s)), pts = [];
    for (let i = 0; i <= 24; i++) { const r = 1 - i / 24, lead = 1 + 0.55 * (1 - r) * (1 - r * 0.3); pts.push(P(Math.min(89, fp * lead), r)); }
    const you = lon(20.2), fz = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const ring = (r, col, w = 2) => { const a = P(0, r), b = P(180, r); return `<path d="M${a[0]} ${a[1]} A${r * R} ${r * R} 0 0 1 ${b[0]} ${b[1]}" fill="none" stroke="${col}" stroke-width="${w}"/>`; };
    const k = MathX.smooth(u, 0.2, 1.0), k2 = MathX.smooth(u, hvCap('shock', 1).show - HV.shock - 0.3, hvCap('shock', 1).show - HV.shock + 0.7);
    return HvHud.svg(`${HvHud.plate(0.8, Wd, Hd)}
      <path d="M${cx} ${cy - R} A${R} ${R} 0 0 1 ${cx} ${cy + R} Z" fill="#3a2a1e"/>
      ${ring(0.896, 'rgba(255,170,90,0.35)')}${ring(0.5462, 'rgba(255,190,110,0.5)')}${ring(0.1917, 'rgba(255,230,170,0.6)')}
      <path d="M${cx} ${cy - 0.5462 * R} A${0.5462 * R} ${0.5462 * R} 0 0 1 ${cx} ${cy + 0.5462 * R} Z" fill="rgba(255,150,60,0.22)"/>
      <path d="${fz} L${cx} ${cy + R} L${cx} ${cy - R} Z" fill="rgba(255,207,138,${(0.28 * k2).toFixed(3)})"/>
      <path d="${fz}" fill="none" stroke="#ffcf8a" stroke-width="5" opacity="${k2.toFixed(3)}"/>
      <line x1="${cx}" y1="${cy - R - 20}" x2="${cx}" y2="${cy + R + 20}" stroke="#ff9a4a" stroke-width="6"/>
      <text x="${cx - 18}" y="${cy - R - 34}" class="s" text-anchor="start">THE CUT FACE</text>
      <circle cx="${you[0].toFixed(1)}" cy="${you[1].toFixed(1)}" r="9" fill="#fff"/><text x="${(you[0] + 18).toFixed(1)}" y="${(you[1] - 12).toFixed(1)}" class="b">YOU</text>
      <text x="${(cx + 0.36 * R).toFixed(1)}" y="${cy + 8}" class="s" opacity="${k.toFixed(2)}">CORE</text><text x="${(cx + 0.72 * R).toFixed(1)}" y="${cy + 130}" class="s" opacity="${k.toFixed(2)}">MANTLE</text>
      <text x="540" y="96" class="t">A SLICE THROUGH WHAT’S LEFT</text>
      <text x="540" y="140" class="s" opacity="${k2.toFixed(2)}">AMBER: THE SHOCK SO FAR</text>
      <text x="540" y="560" class="b">THE SHOCK REACHES YOU IN</text>
      <text x="540" y="624" class="t" style="font-size:58px;fill:#ffcf8a">${hvMinSec(HVP.tHit - s)}</text>`, Wd, Hd);
  }
  // real: the universe we can see, 93 billion light-years across, us in the middle
  static observable(u) {
    const k = MathX.smooth(u, 0.2, 1.0), q = MathX.smooth(u, 2.4, 3.4);
    let gal = '';
    for (let i = 0; i < 110; i++) { const r = 190 * Math.sqrt(hvR(i, 51)), a = 6.2832 * hvR(i, 52), x = 380 + r * Math.cos(a), y = 250 + r * Math.sin(a);
      gal += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="1.8" transform="rotate(${(hvR(i, 53) * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#f6efe2" opacity="${(0.4 + 0.5 * hvR(i, 54)).toFixed(2)}"/>`; }
    return HvHud.svg(`${HvHud.plate()}<g opacity="${k}">${gal}<circle cx="380" cy="250" r="196" fill="none" stroke="rgba(246,239,226,0.6)" stroke-width="2" stroke-dasharray="6 6"/>
      <circle cx="380" cy="250" r="6" fill="#ffcf8a"/><text x="392" y="242" class="s">US</text></g>
      <g opacity="${q}"><line x1="184" y1="470" x2="576" y2="470" stroke="#ffcf8a" stroke-width="0"/><line x1="184" y1="455" x2="576" y2="455" stroke="#ffcf8a" stroke-width="3"/>
      <text x="380" y="440" class="b" text-anchor="middle">93 BILLION LIGHT-YEARS</text></g>
      <text x="40" y="50" class="t">THE UNIVERSE WE CAN SEE</text><text x="40" y="88" class="s">WHEREVER YOU ARE, YOU’RE IN ITS MIDDLE</text>`);
  }
  // real: astronauts float because they and their station fall together
  static float(u) {
    const k = MathX.smooth(u, 0.2, 1.0), q = MathX.smooth(u, 3.0, 4.0), a = u * 0.35;
    const orbit = `<circle cx="380" cy="272" r="128" fill="none" stroke="rgba(246,239,226,0.35)" stroke-width="2" stroke-dasharray="5 7"/><circle cx="380" cy="272" r="62" fill="#244c80" stroke="#f6efe2" stroke-width="2"/>`;
    const sx = 380 + 128 * Math.cos(a), sy = 272 - 128 * Math.sin(a);
    return HvHud.svg(`${HvHud.plate()}<g opacity="${k}">${orbit}
      <rect x="${(sx - 26).toFixed(1)}" y="${(sy - 8).toFixed(1)}" width="52" height="16" rx="4" fill="#d8d4ca"/><rect x="${(sx - 6).toFixed(1)}" y="${(sy - 26).toFixed(1)}" width="12" height="52" fill="#6f86a8"/>
      <line x1="${sx.toFixed(1)}" y1="${(sy + 20).toFixed(1)}" x2="${(380 + 92 * Math.cos(a)).toFixed(1)}" y2="${(272 - 92 * Math.sin(a)).toFixed(1)}" stroke="#ffcf8a" stroke-width="4" opacity="${q}"/></g>
      <text x="40" y="50" class="t">ON THE SPACE STATION</text><text x="40" y="88" class="s" opacity="${k}">GRAVITY THERE: ABOUT 90% OF YOURS</text>
      <text x="40" y="446" class="b" opacity="${q}">THEY AND THE STATION FALL TOGETHER</text>`);
  }
  // real: earthquake waves through the Earth, and the shadow the liquid core makes for the S waves
  static quake(u) {
    const k = MathX.smooth(u, 0.2, 1.0), q = MathX.smooth(u, 3.2, 4.2), cx = 380, cy = 268, R = 150, rc = 0.5462 * R;
    let rays = '';
    for (let i = -6; i <= 6; i++) { const a = i * 13 * HV_D2R, ex = cx + R * Math.sin(a), ey = cy + R * Math.cos(a), through = Math.abs(i) <= 3;
      rays += `<path d="M${cx} ${cy - R} Q ${cx + (ex - cx) * 0.25} ${cy} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${through && q > 0 ? 'rgba(246,239,226,0.25)' : '#ffcf8a'}" stroke-width="2.5" opacity="${k}"/>`; }
    return HvHud.svg(`${HvHud.plate()}<circle cx="${cx}" cy="${cy}" r="${R}" fill="#3a2a1e" stroke="#f6efe2" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${rc}" fill="rgba(255,150,60,0.35)"/>
      ${rays}<circle cx="${cx}" cy="${cy - R}" r="8" fill="#fff"/><text x="${cx + 16}" y="${cy - R - 4}" class="s">EARTHQUAKE</text>
      <text x="${cx}" y="${cy + 6}" class="s" text-anchor="middle">LIQUID CORE</text>
      <text x="40" y="50" class="t">WAVES THROUGH THE EARTH</text>
      <text x="40" y="446" class="b" opacity="${q}">ONE KIND CAN’T CROSS LIQUID: A SHADOW</text>`);
  }
}
