/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the long-form films' (Slower light, Friction 10s, falls-up):
     top left     who could have heard you tonight (it climbs as your voice spreads at 337 m/s); in the dark: who is round you
                  under it, your sound meter: how loud you just were and how far it carried (the horror-game meter)
     top right    Thursday and the time; "+1 min" when the clock jumps at a cut (it only runs forward); slow motion
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers amber, your own words in italics)
     inset        how loud things are (the decibel ladder) while your body gets loud
     middle       the lightning count, big
     bottom left  the honest labels (what is impossible, what is assumed, what is slowed down or made louder)
     in the scene labels the set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

// how far your sounds carry where you are (dB lost on the way out: the flat's walls and windows; the stairwell's doors)
const SO_WALL = { inside: 38, stair: 30 };
function soReachAt(t, mode) {
  const m = mode || soShotAt(t).mode, inFlat = ['title', 'what', 'start', 'hello', 'room', 'clap', 'rule', 'body', 'mum', 'text'].includes(m) || (m === 'window' && t < SO.tWin + 0.6);
  return inFlat ? SO_WALL.inside : m === 'stairs' || m === 'behind' ? SO_WALL.stair : 0;
}
// who could have heard you so far (people, nothing in the way): every sound you made, spreading at 337 m/s out to
// where it fades below hearing
const SO_HEARD = (() => SO_NOISE.map(([t, dB]) => { const loss = soReachAt(t + 0.01), r = Math.max(0, soHeard(dB - loss)); return { t, r, n: loss ? Math.min(4, soPeople(r) + (r > 3 ? 4 : 0)) : soPeople(r) }; }))();
function soHeardBy(t) { let n = 0; for (const h of SO_HEARD) { if (t < h.t) break; const r = Math.min(h.r, SOP.c * (t - h.t)); n = Math.max(n, h.r > 0 ? h.n * (r / h.r) ** 2 : 0); } return n; }
// your sound right now: [label, dB, reach (m)] or null
function soMeterAt(t) {
  const m = soShotAt(t).mode;
  const ev = SO_NOISE.filter((x) => t >= x[0] - 0.05 && t < x[0] + x[2] + 1.6).pop();
  const names = { 72: 'YOUR CLICK', 84: 'YOUR CLAP', 89: 'YOUR SHOUT', 30: 'YOUR WHISPER', 54: 'YOUR VOICE', 46: 'YOUR VOICE' };
  if (ev) { const loss = soReachAt(ev[0] + 0.01); return { l: names[ev[1]] || 'YOUR VOICE', dB: ev[1], r: soHeard(ev[1] - loss), walls: loss > 0, live: t < ev[0] + ev[2] }; }
  if (m === 'body') return { l: 'YOUR BREATHING', dB: SOP.L.breath, r: soHeard(SOP.L.breath), live: true };
  if (m === 'hide' || m === 'dog' || m === 'echo' || m === 'who' || m === 'question') return { l: 'YOUR BREATHING (SCARED)', dB: 28, r: soHeard(28), live: true };
  if (m === 'stairs' && t < soC('stairs', 3) + 2) return { l: 'YOUR FOOTSTEPS', dB: SOP.L.step, r: soHeard(SOP.L.step - SO_WALL.stair), walls: true, live: true };
  if (m === 'street' && t < soShot('street').t0 + 2.2) return { l: 'YOUR FOOTSTEPS (WET)', dB: SOP.L.stepWet, r: soHeard(SOP.L.stepWet), live: true };
  if (m === 'street' || m === 'car' || m === 'warn') return { l: 'YOUR BREATHING', dB: SOP.L.breath, r: soHeard(SOP.L.breath), live: true };
  return null;
}
// the scene's context line: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const SO_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [soC(id, k0) - 0.2, k1 == null ? soE(id) + 0.2 : soC(id, k1) - 0.1, l, f];
  return [
    beat('storm', 'THE LIGHTNING IS', () => ({ v: `6 <small>s</small> × ${SOP.c} <small>m/s</small>`, v2: `= ${(6 * SOP.c / 1000).toFixed(1)} km AWAY · NO THUNDER` }), 2),
    beat('shout', 'YOUR ECHO FROM THE TOWER', () => ({ v: `${(2 * 170 / SOP.c).toFixed(2)} <small>s</small>`, v2: '170 m THERE, 170 m BACK' }), 2),
  ];
})();
// the honest labels (bottom left): [from, to, text]
const SO_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [soC(id, k0) - 0.1, k1 == null ? soE(id) + 0.2 : soC(id, k1) + 0.3, text]; return [
  b('start', 'THE ONE IMPOSSIBLE THING: NOTHING MAKES A SOUND BUT YOU'),
  b('window', 'ASSUMED: OPEN AIR, NO BACKGROUND NOISE · HEARING THRESHOLD 5 dB', 2),
  b('car', 'EU RULE SINCE 2019 (REG. 540/2014): NEW EVs HUM BELOW 20 km/h', 1),
  b('shout', 'YOUR ECHOES ARE PLAYED ABOUT 40 dB LOUDER THAN REAL, SO YOU HEAR THEM', 1, 2),
  b('far', 'ASSUMED: NOTHING IN THE WAY · 5,000 PEOPLE PER km² · SHUT WINDOWS: ~750 m'),
  b('echo', 'ECHO PICTURE: STYLISED, AND SHOWN ~67× SLOWER THAN SOUND', 1),
]; })();

// a caption's text with its numbers in amber
function soCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)?(?::\d+){0,2}(?:\s?%|\s(?:minutes|minute|seconds|second|metres|metre|decibels|km|m|s)\b|\s?km\/h)?(?:\s(?:AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class SoHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('so-ro', '<div class="l"></div><div class="v"></div><div class="s"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.mt = mk('so-meter', '<div class="l"></div><div class="bar"><i></i></div><div class="v"></div>');
    this.mtL = this.mt.querySelector('.l'); this.mtB = this.mt.querySelector('.bar i'); this.mtV = this.mt.querySelector('.v');
    this.ctx = mk('so-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('so-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.band = mk('so-band'); this.cap = mk('so-cap'); this.tag = mk('so-tag');
    this.count = mk('so-count');
    this.caps = SOT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: soCapHtml(c.text), q: g.id === 'question', voice: !!c.voice })));
    this.inset = mk('so-inset');
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
    const W = StoryHUD.win, s = set && set._s != null ? set._s : soStoryAt(t), rate = soRateAt(t), m = shot ? shot.mode : '';
    const on = W(t, SO.title[1] - 0.5, SO.end + 1, 0.4, 0.5);
    const dark = m === 'hide' || m === 'dog' || m === 'echo' || m === 'who' || m === 'question';
    // ---- who has heard you; in the dark, who is round you
    this._set('ro', this.ro, 'opacity', on.toFixed(3));
    if (on > 0) {
      if (dark) {
        const tR = SO.tClicks[SO.tClicks.length - 1] + SO_BEHIND.d1 / SO_ECHO_V;      // (the last click finds it)
        const n = t < soC('echo', 4) - 0.3 ? null : t < tR ? SO_RING.length : 1;
        this._txt('rol', this.ro.querySelector('.l'), n === 1 ? 'RIGHT BEHIND YOU' : 'AROUND YOU');
        this._html('rov', this.roV, n == null ? '?' : n === 1 ? '0.95 <small>m</small>' : String(n));
        this._html('ros', this.roS, n == null ? 'YOU CAN\'T HEAR ANYONE' : n === 1 ? 'IT CAN HEAR YOU BREATHE' : t > soC('who', 1) ? 'ONE STEP CLOSER' : 'WITHIN 15 m · NOT MOVING');
        this._cls('roc', this.ro, n == null ? 'so-ro' : 'so-ro tick');
      } else {
        const n = soHeardBy(t);
        this._txt('rol', this.ro.querySelector('.l'), 'COULD HAVE HEARD YOU');
        this._html('rov', this.roV, n < 0.5 ? '0' : (n >= 20 ? '≈ ' : '') + soRound(n));
        this._html('ros', this.roS, n < 0.5 ? 'NO ONE, YET' : n <= 8 ? 'NEIGHBOURS, THROUGH THE WALLS' : 'PEOPLE · EVERY ONE OF THEM IN SILENCE');
        const grow = SO_HEARD.some((h) => t > h.t && t < h.t + h.r / SOP.c + 0.3 && h.n > 8);
        this._cls('roc', this.ro, grow ? 'so-ro tick' : 'so-ro');
      }
    }
    // ---- your sound meter (how loud, how far it carried)
    const M = soMeterAt(t), ma = M ? on * 1 : 0;
    this._set('mta', this.mt, 'opacity', ma.toFixed(3));
    if (M) {
      this._txt('mtl', this.mtL, M.l);
      const lv = MathX.clamp((M.dB + 10) / 100, 0.02, 1) * (M.live ? 1 : 0.55);
      this._set('mtb', this.mtB, 'width', (lv * 100).toFixed(1) + '%');
      this._html('mtv', this.mtV, `<b>${M.dB} dB</b> · HEARD ${M.r < 10 ? M.r.toFixed(1) + ' m' : soDist(M.r)}${M.walls ? ' <small>(THROUGH WALLS)</small>' : ''}`);
      this._cls('mtc', this.mt, M.dB >= 80 ? 'so-meter hot' : 'so-meter');
    }
    // ---- the context line
    const cx = SO_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.4, 0.4).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = SO_TAGS.find((x) => t >= x[0] && t < x[1]);
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- Thursday and the time; slow motion or a jump
    this._set('ck', this.clock, 'opacity', on.toFixed(3));
    if (on > 0) {
      const c = soClockParts(s);
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = SO_JUMPS.filter((x) => t >= x.t && t < x.t + 2.6).pop();
      const jl = j ? '+' + (j.ds >= 90 ? Math.round(j.ds / 60) + ' min' : Math.round(j.ds) + ' s') : '';
      const since = Math.floor(Math.max(0, s) / 60), sl = s > 0.5 ? `SILENT FOR ${since < 1 ? Math.floor(s) + ' s' : since + ' min'}` : 'REAL SPEED';
      const tl = rate < 0.9 ? 'SLOW MOTION ×' + rate.toFixed(2) : m === 'echo' || m === 'who' || m === 'question' ? 'ECHO PICTURE · SLOWED DOWN' : sl;
      this._txt('ckf', this.clockF, jl ? jl + '  ·  ' + tl : tl);
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat so it doesn't pump)
    const gb = SOT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'so-cap q' : cp.voice ? 'so-cap vo' : 'so-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the lightning count, big (one a second from the flash, as you count)
    { const v = soVoice('y_count'), on = [0, 0.89, 1.81, 2.84, 3.84, 4.80], n = m === 'storm' && t >= v.start ? on.filter((x) => t - v.start >= x).length : 0, a = n && t < v.start + v.seconds + 1.4 ? 1 : 0;
      this._set('cna', this.count, 'opacity', String(a));
      if (a) { this._html('cnt', this.count, `${n}<small> s</small>`); this._cls('cnc', this.count, n === 6 ? 'so-count hit' : 'so-count'); }
    }
    // ---- the decibel ladder
    this._insets(t, s);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'so-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = SoHud._p || (SoHud._p = new THREE.Vector3());
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
      d.className = right ? 'so-lab r' : 'so-lab';
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`, hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; d._w = d.offsetWidth; }
    });
    void app;
  }

  // the decibel ladder (SVG), while your body gets loud
  _insets(t, s) {
    const W = StoryHUD.win, a0 = soC('body', 0) + 0.6, a1 = soE('body') + 0.1, on = t >= a0 && t < a1;
    const a = on ? W(t, a0, a1, 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, 'so-inset ladder');
    if (!on) return;
    const u = t - a0, key = 'ladder|' + Math.round(u * 10);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = SoHud.ladder(u, t, s);
  }
  static svg(body, w, h) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a, w, h) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // how loud things are (dB at 1 m): the marks; yours light up as the caption names them
  static ladder(u, t) {
    const w = 380, h = 660, top = 70, bot = 610, y = (d) => bot - (d + 25) / 120 * (bot - top);
    const rows = [[89, 'A SHOUT', 0], [60, 'YOUR VOICE', 0], [30, 'A WHISPER', 0], [10, 'YOUR BREATH', 1], [0, 'YOUR HEARTBEAT', 2], [-20, 'THE QUIETEST ROOM', 3]];
    const lit = [0, soC('body', 0) + 2.2, soC('body', 0) + 3.4, soC('body', 1)];
    let o = '';
    for (const [d, n, k] of rows) { const yy = y(d), hot = k && t >= lit[k]; o += `<line x1="64" y1="${yy.toFixed(1)}" x2="${w - 20}" y2="${yy.toFixed(1)}" stroke="rgba(255,255,255,${hot ? 0.8 : 0.28})" stroke-width="${hot ? 3 : 2}"/>
      <text x="${w - 20}" y="${(yy - 10).toFixed(1)}" text-anchor="end" class="sm" style="font-size:24px;fill:${hot ? '#ffcf8a' : '#d8d2c6'}">${n} <tspan style="fill:#f6efe2">${d > 0 ? d : d < 0 ? '−' + Math.abs(d) : '0'} dB</tspan></text>`; }
    return SoHud.svg(`${SoHud.plate(0.62, w, h)}
      <text x="24" y="44" class="sm" style="font-size:25px;fill:#f6efe2">HOW LOUD (AT 1 m)</text>
      <line x1="64" y1="${top}" x2="64" y2="${bot}" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
      <line x1="40" y1="${y(5).toFixed(1)}" x2="${w - 20}" y2="${y(5).toFixed(1)}" stroke="rgba(159,196,255,0.7)" stroke-width="2" stroke-dasharray="6 6"/>
      <text x="74" y="${(y(5) + 26).toFixed(1)}" class="sm" style="font-size:20px;fill:#9fc4ff">YOU CAN HEAR DOWN TO ABOUT HERE</text>
      ${o}`, w, h);
  }
}
