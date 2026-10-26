/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     THE SPEED OF SOUND · its value · what it is as fast as · NEXT: the next thing it will do and when;
                  under it one context line for the scene
     bottom left  the honest label (thought experiment / illustration / sped up / real)
     top right    the day and the time
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber); the last one is the question
     right        the diagrams: a voice's resonances, the boom carpets over the country, music arriving backwards, the
                  noon bell's horizon, sound reaching one ear then the other, the real speeds of sound
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

function ssThousands(n) { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
// a delay in seconds, said simply ("0.016 s", "4.5 s", "1 min 15 s", "4.3 min")
function ssFmtSec(s) {
  if (!isFinite(s)) return 'NEVER';
  if (s < 0.1) return s.toFixed(3) + ' s';
  if (s < 10) return s.toFixed(1) + ' s';
  if (s < 60) return Math.round(s) + ' s';
  if (s < 600) { const m = Math.floor(s / 60), r = Math.round(s - 60 * m); return r ? `${m} min ${r} s` : `${m} min`; }
  if (s < 7200) return Math.round(s / 60) + ' min';
  return (s / 3600).toFixed(1) + ' HOURS';
}
// the time a sound made now takes to cross d metres (story time, so the slowing on the way counts)
const ssTake = (h, d) => (ssArriveH(h, d) - h) * 3600;

// the scene's context line: [from, to, label, value(t, h)] (value: text, or { l, v, v2 } with HTML)
const SS_CTX = [
  [0.6, SS.titleShot - 0.2, 'THE HIGH STREET', (t, h) => ({ v: 'SOUND: ' + ssFmtSpeed(ssC(h)), v2: 'WALKING PACE: ABOUT 1.4 m/s' })],
  [ssCap('seven', 1).show, SS.bird - 0.2, 'SOUND CROSSES YOUR GARDEN (15 m) IN', (t, h) => ({ v: ssFmtSec(ssTake(h, 15)) })],
  [ssCap('bird', 1).show, SS.plane - 0.2, 'THE BLACKBIRD · 5.5 m AWAY', (t, h) => ({ v: 'HEARD ' + ssFmtSec(ssTake(h, 5.5)) + ' LATE', v2: 'ABOUT 1/60 OF A SECOND' })],
  [SS.plane + 0.4, SS.boom - 0.2, 'SOUND, 11 km UP', (t, h) => ({ v: ssFmtSpeed(ssCAlt(h)), v2: 'THE AIRLINER: 250 m/s' + (ssCAlt(h) < SSP.plane ? ' · FASTER' : '') })],
  [SS.boom + 0.4, SS.eight - 0.2, 'SOUND, DOWN HERE', (t, h) => ({ v: ssFmtSpeed(ssC(h)), v2: 'THE AIRLINER: 250 m/s' + (ssC(h) < SSP.plane ? ' · FASTER' : '') })],
  [SS.morning + 0.2, SS.kettle - 0.2, 'THE RESONANCES OF HIS VOICE', (t, h) => ({ v: '× ' + (ssC(h) / SSP.c0).toFixed(2) + ' · AN OCTAVE DOWN', v2: 'HIS VOICE BOX: THE SAME PITCH' })],
  [SS.kettle + 0.3, SS.radio - 0.2, 'THE KETTLE\'S WHISTLE', (t, h) => ({ v: Math.round(2000 * ssC(h) / SSP.c0) + ' Hz', v2: 'THIS MORNING: 2,000 Hz' })],
  [SS.radio + 0.3, SS.nine - 0.2, 'THE RADIO', () => ({ v: 'EXACTLY AS RECORDED', v2: 'ITS SPEAKER SHAKES AT THE SAME RATE' })],
  [ssCap('nine', 1).show, SS.ten - 0.2, 'AN ECHO IN THE KITCHEN LASTS', (t, h) => ({ v: ssFmtSec(0.5 * SSP.c0 / ssC(h)), v2: 'THIS MORNING: 0.5 s' })],
  [ssCap('ten', 1).show, SS.text - 0.2, 'THE RESONANCES THAT MAKE VOWELS', (t, h) => ({ v: '3 OCTAVES LOWER', v2: 'A, E, I, O, U ALL SOUND THE SAME' })],
  [SS.motorway + 0.4, SS.eleven - 0.2, 'THE MOTORWAY · 3.2 km AWAY', (t, h) => ({ v: 'CARS: 31 m/s · SOUND: ' + ssFmtSpeed(ssC(h)), v2: 'ITS NOISE TAKES ' + ssFmtSec(ssTake(h, 3200)) + ' TO GET HERE' })],
  [ssCap('eleven', 1).show, SS.siren - 0.2, 'A SHOUT ACROSS THE ROAD (10 m) TAKES', (t, h) => ({ v: ssFmtSec(ssTake(h, 10)) })],
  [SS.siren + 0.4, SS.silent - 0.2, 'THE AMBULANCE · 13 m/s', (t) => ({ v: t < SS.sirenPass ? 'SIREN × 2.6 HIGHER' : 'SIREN × 0.62 · LOWER', v2: 'SOUND: ' + ssFmtSpeed(ssC(ssH(t))) })],
  [ssCap('silent', 1).show, SS.after - 0.2, 'CARS IN TOWN', (t, h) => ({ v: '13.4 m/s', v2: 'SOUND: ' + ssFmtSpeed(ssC(h)) })],
  [SS.after + 0.4, SS.backwards - 0.2, 'A CAR AT 30 mph', () => ({ v: 'ARRIVES BEFORE ITS SOUND', v2: 'THEN ITS SOUND, FROM BOTH SIDES' })],
  [SS.noon + 0.4, SS.ball - 0.2, 'THE NOON BELL · 800 m AWAY', (t, h) => (t < SS.bell ? { v: 'NOT RUNG YET' } : t < SS.bellHeard ? { v: 'ITS SOUND: ' + ssFmtDist(ssDist(5, h)) + ' FROM THE CHURCH', v2: 'IT REACHES YOU AT 12:01:15' } : { v: 'HEARD · 75 s LATE', v2: 'IT RANG AT 12:00:00' })],
  [ssCap('ball', 0).show, SS.flying - 0.2, 'A HARD KICK', (t, h) => ({ v: 'THE BALL: ABOUT 25 m/s', v2: 'SOUND: ' + ssFmtSpeed(ssC(h)) })],
  [SS.one + 0.4, SS.two - 0.2, 'THE WIND', (t, h) => ({ v: '6 m/s', v2: 'SOUND: ' + ssFmtSpeed(ssC(h)) + ' · IT CAN\'T GO UPWIND' })],
  [ssCap('two', 1).show, SS.ears - 0.2, 'A VOICE\'S SOUND WAVES', (t, h) => ({ v: Math.round(ssC(h) / 300 * 1000) + ' mm LONG', v2: 'THIS MORNING: 1.1 m · BIG WAVES BEND ROUND THINGS' })],
  [SS.ears + 0.4, SS.three - 0.2, 'FROM ONE EAR TO THE OTHER (20 cm)', (t, h) => ({ v: ssFmtSec(ssTake(h, 0.2)), v2: 'THIS MORNING: 0.0006 s' })],
  [SS.three + 0.4, SS.four - 0.2, 'WALKING', (t, h) => ({ v: 'ABOUT 1.4 m/s', v2: 'SOUND: ' + ssFmtSpeed(ssC(h)) })],
  [ssCap('four', 1).show, SS.clap - 0.2, 'THE TV · 3 m AWAY', (t, h) => ({ v: 'ITS SOUND: ' + ssFmtSec(ssTake(h, SS_K.tvDist)) + ' LATE' })],
  [SS.clap + 0.3, SS.earbuds - 0.2, 'YOUR KITCHEN WILL RING FOR', (t, h) => ({ v: ssFmtSec(0.5 * SSP.c0 / ssC(h)), v2: 'THIS MORNING: 0.5 s' })],
  [SS.earbuds + 0.4, SS.five - 0.2, 'EARBUD TO EARDRUM · 1 cm', (t, h) => ({ v: ssFmtSec(ssTake(h, 0.01)), v2: 'TOO SHORT TO NOTICE' })],
  [ssCap('five', 1).show, SS.hum - 0.2, 'YOUR CAT', (t, h) => ({ v: 'ABOUT 70 cm/s', v2: 'SOUND: ' + ssFmtSpeed(ssC(h)) })],
  [SS.hum + 0.4, SS.storm - 0.2, 'THE RESONANCES OF YOUR MOUTH', () => ({ v: 'BELOW 3 Hz', v2: 'YOU CAN HEAR DOWN TO ABOUT 20 Hz' })],
  [ssCap('storm', 3).show, SS.eight2 - 0.2, 'NO SOUND CAN EVER TRAVEL FURTHER THAN', (t, h) => ({ v: ssFmtDist(ssHorizon(h)), v2: 'THE LIGHTNING: 1.0 km AWAY' })],
  [ssCap('eight2', 2).show, SS.box - 0.2, 'A SOUND MADE AT 7 PM HAS GONE', (t, h) => ({ v: ssFmtDist(ssDist(12, h)) })],
  [SS.boxGo + 0.3, SS.walkinto - 0.2, 'YOU ARE 3.0 m FROM THE BOX', (t, h) => ({ v: 'ITS TUNE: ' + ssFmtDist(ssDist(15, h)) + ' SO FAR', v2: 'IT REACHES YOU AT 10:04:55' })],
  [SS.walkinto + 0.4, SS.wait - 0.2, 'WALKING INTO THE TUNE', () => ({ v: 'NOTES × 135 HIGHER', v2: 'A MIDDLE C BECOMES 35,000 Hz' })],
  [SS.midnight + 0.4, SS.stop - 0.2, 'YOUR VOICE CAN NEVER GO FURTHER THAN', (t, h) => ({ v: ssFmtDist(ssHorizon(h)) })],
  [ssCap('real5', 1).show, SS.question - 0.2, 'HALF THE SPEED OF SOUND NEEDS AIR AT', () => ({ v: 'ABOUT −200 °C', v2: 'LIQUID NITROGEN BOILS AT −196 °C' })],
];
// the honest labels: [from, to, text] (the first match wins); a time-lapse says so on its own
const SS_TAGS = [
  [0.3, SS.titleShot, 'LATER TODAY · 3 PM'],
  [SS.seven + 0.3, SS.bird, 'THOUGHT EXPERIMENT · ONLY THE SPEED OF SOUND CHANGES'],
  [SS.plane + 0.3, SS.eight, 'RINGS: WHERE ITS SOUND HAS REACHED · ILLUSTRATION'],
  [SS.carpet, SS.eight, 'ILLUSTRATION'],
  [SS.throat, SS.kettle, 'ILLUSTRATION'],
  [SS.siren, SS.noon, 'RINGS: ILLUSTRATION'],
  [SS.flying, SS.one, 'ILLUSTRATION'],
  [SS.ears, SS.three, 'ILLUSTRATION'],
  [SS.four, SS.five, 'RINGS: ILLUSTRATION'],
  [SS.box, SS.midnight, 'RINGS: ILLUSTRATION'],
  [SS.real + 0.6, SS.question - 0.1, 'REAL'],
];
// a caption's text with its numbers in amber
function ssCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\b(\d[\d,.:]*(?:\s?(?:AM|PM|metres a second|metres|centimetres a second|centimetres|millimetres a second|millimetres|kilometres|times|seconds|minutes|centimetre a second|centimetre|kilometre|a second))?)|\b(Midnight|Half|an octave lower|an octave|a thirtieth|a sixtieth)\b/g, (m) => `<span class="n">${m}</span>`);
}

class SsHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('ss-ro', '<div class="l">THE SPEED OF SOUND</div><div class="v"></div><div class="s"></div><div class="s nx"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roN = this.ro.querySelector('.nx');
    this.ctx = mk('ss-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('ss-tag');
    this.clock = mk('ss-clock', '<div class="l"></div><div class="v"></div><div class="f"></div>'); this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f');
    this.cap = mk('ss-cap');
    this.caps = SST.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: ssCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('ss-inset');
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
    const W = StoryHUD.win, h = ssH(t), lapse = ssLapsing(t);
    // ---- the readout: the cold open, then from 7:00 to the silence (not over the title or the real section)
    const ra = Math.max(W(t, 0.4, SS.titleShot - 0.1, 0.5, 0.3), W(t, SS.seven + 0.3, SS.last + 0.2, 0.5, 0.6));
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const c = ssC(h);
      this._html('rov', this.roV, ssFmtSpeed(c).replace(/ (\S+)$/, '<small> $1</small>'));
      this._txt('ros', this.roS, h < 1e-4 ? 'FASTER THAN AN AIRLINER' : ssLike(c));
      const nx = ssNextAt(h);
      this._txt('ron', this.roN, nx ? 'NEXT · ' + nx.what + ' · ' + ssClockText(nx.h) + ' ' + ssAmPm(nx.h) : '');
    }
    // ---- the context line
    const cx = SS_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t, h), o = typeof r === 'string' ? { v: r } : r;
      this._txt('cxl', this.ctxL, o.l || cx[2]); this._html('cxv', this.ctxV, o.v); this._html('cxv2', this.ctxV2, o.v2 || '');
      this._set('cxt', this.ctx, 'top', ra > 0.05 ? '' : 'calc(var(--u) * 44)');
    }
    // ---- the honest label (a time-lapse first)
    const tg = lapse ? [t - 1, t + 1, 'TIME-LAPSE'] : SS_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? (lapse ? '1' : W(t, tg[0], tg[1], 0.5, 0.4).toFixed(3)) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the day and the time
    const ca = Math.max(W(t, 0.4, SS.titleShot - 0.1, 0.5, 0.3), W(t, SS.seven + 0.3, SS.real - 0.3, 0.5, 0.6));
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = ssClockParts(h);
      this._txt('ckl', this.clockL, 7 + h >= 24 ? 'SUNDAY' : 'SATURDAY');
      this._html('ckv', this.clockV, `${c.h12}:${String(c.m).padStart(2, '0')}<small>:${String(c.s).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      this._txt('ckf', this.clockF, '');
    }
    // ---- the caption
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'ss-cap q' : 'ss-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    // ---- the diagrams
    this._insets(t, h);
    // ---- labels pinned in the scene
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'ss-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = SsHud._p || (SsHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      d.style.left = Math.min(lx, 78).toFixed(2) + '%'; d.style.top = ((ra > 0.05 || cx) && lx < 40 ? Math.max(ly, 46) : Math.max(ly, 18)).toFixed(2) + '%';
      const hh = `<span class="d"></span><span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
    });
  }

  // the diagrams (SVG, 760×470 design px, right of centre; 'big' ones larger and centred)
  _insets(t, h) {
    const W = StoryHUD.win;
    const which = [
      ['throat', SS.throat + 0.2, SS.kettle - 0.2],
      ['carpet', SS.carpet + 0.3, SS.eight - 0.2],
      ['backwards', ssCap('backwards', 1).show - 0.2, SS.noon - 0.2],
      ['ears', SS.ears + 0.3, SS.three - 0.2],
      ['real', SS.real2 + 0.2, ssCap('real5', 1).show - 0.2],
    ].find((x) => t >= x[1] && t < x[2]);
    const a = which ? W(t, which[1], which[2], 0.5, 0.5) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'ss-inset' : which[0] === 'real' ? 'ss-inset big' : 'ss-inset');
    if (!which) return;
    const k = which[0], u = t - which[1], key = k + '|' + Math.round(u * 30);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = SsHud[k](u, t, h);
  }
  static svg(body) { return `<svg viewBox="0 0 760 470" xmlns="http://www.w3.org/2000/svg">${body}</svg>`; }
  static plate(a = 0.68) { return `<rect x="0" y="0" width="760" height="470" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  // a voice: the voice box's buzz (a row of harmonics, the same pitch) under the throat's resonances (the bumps that
  // make the vowel), which slide an octave lower as sound halves
  static throat(u) {
    const k = MathX.smooth(u, 1.2, 4.5), sc = 1 - 0.5 * k, X = (f) => 60 + f / 4000 * 650, base = 400;
    const env = (f) => [[500, 1], [1500, 0.7], [2500, 0.45]].reduce((s, [F, A]) => s + A * Math.exp(-Math.pow((f - F * sc) / (110 * sc + 40), 2)), 0.06);
    let d = '', bars = '';
    for (let i = 0; i <= 200; i++) { const f = i / 200 * 4000; d += (i ? 'L' : 'M') + X(f).toFixed(1) + ' ' + (base - 250 * env(f)).toFixed(1); }
    for (let f = 120; f < 4000; f += 120) bars += `<line x1="${X(f).toFixed(1)}" y1="${base}" x2="${X(f).toFixed(1)}" y2="${(base - 250 * env(f)).toFixed(1)}" stroke="#f6efe2" stroke-width="3" opacity="0.8"/>`;
    return SsHud.svg(`${SsHud.plate()}
      <text x="40" y="50" class="t">HIS VOICE</text>
      ${bars}<path d="${d}" fill="none" stroke="#ffcf8a" stroke-width="4"/>
      <line x1="60" y1="${base}" x2="710" y2="${base}" stroke="rgba(222,214,196,0.5)" stroke-width="2"/>
      <text x="60" y="${base + 36}" class="s">LOW</text><text x="710" y="${base + 36}" class="s" text-anchor="end">HIGH</text>
      <text x="40" y="440" class="b">WHITE: VOICE BOX · AMBER: HIS THROAT'S AIR</text>`);
  }
  // the country from above: each airliner's boom sweeps a band about 60 km wide along its track
  static carpet(u) {
    const tracks = [[60, 120, 700, 300], [40, 380, 720, 160], [120, 60, 520, 440], [300, 40, 680, 420], [80, 260, 700, 250], [200, 450, 640, 50], [30, 190, 400, 30], [380, 450, 740, 330]];
    const prog = MathX.smooth(u, 0.2, 3.5);
    let s = '';
    tracks.forEach(([x0, y0, x1, y1], i) => {
      const p = MathX.clamp(prog * 1.6 - i * 0.08, 0, 1); if (p <= 0) return;
      const xe = x0 + (x1 - x0) * p, ye = y0 + (y1 - y0) * p;
      s += `<line x1="${x0}" y1="${y0}" x2="${xe.toFixed(1)}" y2="${ye.toFixed(1)}" stroke="rgba(255,207,138,0.22)" stroke-width="46" stroke-linecap="round"/>
        <line x1="${x0}" y1="${y0}" x2="${xe.toFixed(1)}" y2="${ye.toFixed(1)}" stroke="#ffcf8a" stroke-width="2.5" stroke-dasharray="8 7"/>
        <circle cx="${xe.toFixed(1)}" cy="${ye.toFixed(1)}" r="5" fill="#fff"/>`;
    });
    return SsHud.svg(`${SsHud.plate(0.72)}${s}
      <circle cx="372" cy="232" r="8" fill="none" stroke="#fff" stroke-width="3"/><text x="388" y="226" class="b">YOU</text>
      <text x="40" y="46" class="t">A MORNING OF FLIGHTS · 500 km ACROSS</text>
      <text x="40" y="446" class="s">EACH BAND OF BOOM: ABOUT 60 km WIDE</text>`);
  }
  // the music car: notes 1–5 made as it comes towards you; you hear them 5, 4, 3, 2, 1
  static backwards(u) {
    const p = MathX.smooth(u, 0.3, 3.0), q = MathX.smooth(u, 2.6, 5.0);
    let s = '';
    for (let i = 0; i < 5; i++) {
      const x = 110 + i * 110, show = p * 5 > i;
      if (show) s += `<circle cx="${x}" cy="170" r="22" fill="none" stroke="#ffcf8a" stroke-width="3"/><text x="${x}" y="179" class="b" text-anchor="middle">${i + 1}</text>`;
      const j = 4 - i, hx = 110 + j * 110;
      if (q * 5 > j) s += `<circle cx="${hx}" cy="330" r="22" fill="#ffcf8a"/><text x="${hx}" y="339" class="b" text-anchor="middle" style="fill:#111">${i + 1}</text>`;
    }
    return SsHud.svg(`${SsHud.plate()}
      <text x="40" y="50" class="t">A CAR FASTER THAN SOUND, COMING AT YOU</text>
      <text x="40" y="112" class="s">NOTES IT PLAYS, IN ORDER, AS IT GETS CLOSER →</text>${s}
      <text x="40" y="272" class="s">WHAT REACHES YOU, IN ORDER →</text>
      <text x="40" y="420" class="b">THE LAST NOTES WERE PLAYED CLOSEST TO YOU</text>`);
  }
  // the noon bell's sound, spreading over the country and slowing: it stops at 56 km
  static horizon(u, t, h) {
    const cx = 380, cy = 250, sc = 3.4, H = ssHorizon(5), r = ssDist(5, h) / 1000, k = MathX.smooth(u, 0.3, 4);
    const rr = Math.min(H / 1000, Math.max(r, (H / 1000) * Math.pow(k, 0.6))), towns = [[-38, -18, 'A TOWN · 42 km'], [26, 34, 'A CITY · 43 km'], [70, -10, '71 km · NEVER']];
    return SsHud.svg(`${SsHud.plate()}
      <circle cx="${cx}" cy="${cy}" r="${(H / 1000 * sc).toFixed(1)}" fill="none" stroke="rgba(255,207,138,0.6)" stroke-width="2.5" stroke-dasharray="9 8"/>
      <circle cx="${cx}" cy="${cy}" r="${(rr * sc).toFixed(1)}" fill="rgba(255,207,138,0.12)" stroke="#ffcf8a" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="#fff"/><text x="${cx + 12}" y="${cy - 10}" class="b">THE CHURCH</text>
      ${towns.map(([x, y, n]) => `<circle cx="${cx + x * sc}" cy="${cy + y * sc}" r="5" fill="#f6efe2"/><text x="${cx + x * sc + 10}" y="${cy + y * sc + 6}" class="s">${n}</text>`).join('')}
      <text x="40" y="50" class="t">THE NOON BELL'S SOUND · ${Math.round(rr)} km</text>
      <text x="40" y="440" class="s">IT SLOWS ON THE WAY · IT STOPS AT 56 km</text>`);
  }
  // your head from above: a sound from your left reaches your left ear, then 0.07 s later your right
  static ears(u, t, h) {
    const cx = 380, cy = 250, per = 2.4, ph = (u % per) / per, x = 120 + ph * 520, L = 330, Rr = 430, hitL = x > L, hitR = x > Rr;
    return SsHud.svg(`${SsHud.plate()}
      <ellipse cx="${cx}" cy="${cy}" rx="52" ry="64" fill="#3a3330" stroke="#f6efe2" stroke-width="3"/>
      <ellipse cx="${L - 2}" cy="${cy}" rx="9" ry="20" fill="${hitL ? '#ffcf8a' : '#f6efe2'}"/><ellipse cx="${Rr + 2}" cy="${cy}" rx="9" ry="20" fill="${hitR ? '#ffcf8a' : '#f6efe2'}"/>
      <line x1="${x.toFixed(1)}" y1="140" x2="${x.toFixed(1)}" y2="360" stroke="#ffcf8a" stroke-width="5" opacity="0.85"/>
      <text x="${L - 2}" y="${cy + 66}" class="s" text-anchor="middle">LEFT</text><text x="${Rr + 2}" y="${cy + 66}" class="s" text-anchor="middle">RIGHT</text>
      <text x="40" y="50" class="t">A SOUND FROM YOUR LEFT</text>
      <text x="40" y="440" class="b">REACHES YOUR RIGHT EAR ${ssFmtSec(0.2 / ssC(h))} LATER</text>`);
  }
  // the real speeds of sound (a log scale): air, Mars, sulphur hexafluoride, bubbly water, an atom cloud
  static real(u, t) {
    const rows = [[343, 'AIR, 20 °C', '343 m/s', SS.real2], [240, 'MARS', 'ABOUT 240 m/s', ssCap('real2', 1).show], [130, 'SULPHUR HEXAFLUORIDE', 'ABOUT 130 m/s', SS.real3], [20, 'BUBBLY WATER', 'DOWN TO ~20 m/s', ssCap('real3', 1).show], [0.004, 'ULTRACOLD ATOMS', 'A FEW mm/s', SS.real4]];
    const X = (v) => 330 + (Math.log10(v) + 3) / 6 * 210;
    let s = '';
    rows.forEach(([v, name, val, at], i) => {
      const k = MathX.smooth(t, at, at + 0.8); if (k <= 0) return;
      const y = 104 + i * 70, w = (X(v) - 330) * k;
      s += `<text x="40" y="${y + 9}" class="b" opacity="${k}">${name}</text><rect x="330" y="${y - 14}" width="${Math.max(3, w).toFixed(1)}" height="28" rx="6" fill="${i ? '#ffcf8a' : '#f6efe2'}" opacity="${0.85 * k}"/>
        <text x="${(330 + w + 12).toFixed(1)}" y="${y + 8}" class="s" opacity="${k}">${val}</text>`;
    });
    return SsHud.svg(`${SsHud.plate(0.72)}<text x="40" y="50" class="t">THE SPEED OF SOUND · MEASURED</text>${s}
      <text x="40" y="452" class="s">BAR LENGTHS: EACH STEP × 10</text>`);
  }
}
