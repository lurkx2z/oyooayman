/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the Slower light film's:
     top left     where you are: FLOOR · 73 · NORTH TOWER (a soft plate); under it, one context line for the scene
                  (the tower, the windows, the time since the impact …)
     left         on the stairs: the tower, 110 floors, the impact floors and you (a slim diagram)
     bottom left  the honest label (a composite; the morning sped up; illustrated)
     top right    the time this morning
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     middle       the remembrance card at the end
     in the scene labels a set pins to places (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

function ntClockParts(c) { const H = Math.floor(c / 3600) % 24, M = Math.floor(c / 60) % 60, S = Math.floor(c % 60); return { h: ((H + 11) % 12) + 1, m: M, s: S, am: H < 12 }; }
function ntClockText(c, fine) { const p = ntClockParts(c); return `${p.h}:${String(p.m).padStart(2, '0')}` + (fine ? `:${String(p.s).padStart(2, '0')}` : ''); }
const NT_HIT = ntAt(8, 46, 40);

// where you are: [from, to, label, value, sub] (value a function of t, or text)
const NT_WHERE = [
  [NT.morning + 0.6, NT.known, 'FLOOR', () => '73', 'NORTH TOWER · 1 WORLD TRADE CENTER'],
  [NT.known, NT.stair, 'FLOOR', () => '73', 'THE CORE · STAIRWAY C'],
  [NT.stair, NT.transfer, 'FLOOR', (t) => String(ntFloorNow(t)), 'NORTH TOWER · STAIRWAY C'],
  [NT.transfer, NT.transfer + 4.5, 'FLOOR', () => '48', 'THE TRANSFER HALLWAY'],
  [NT.transfer + 4.5, NT.mezz, 'FLOOR', (t) => String(ntFloorNow(t)), 'NORTH TOWER · STAIRWAY C'],
  [NT.mezz, NT.esc, 'PLAZA LEVEL', () => 'MEZZANINE', 'NORTH TOWER'],
  [NT.esc, NT.five, 'BELOW THE PLAZA', () => 'CONCOURSE', 'THE SHOPPING MALL'],
  [NT.five, NT.walk, 'OUTSIDE', () => 'VESEY STREET', 'NORTH OF THE TOWERS'],
  [NT.walk, NT.out - 0.4, 'OUTSIDE', () => 'CHURCH STREET', 'WALKING NORTH'],
];
// the scene's context line: [from, to, label, value(t)] (value: text, or { l, v, v2 } with HTML)
const ntSince = (t) => { const s = Math.max(0, ntClock(t) - NT_HIT), m = Math.floor(s / 60); return m < 1 ? `${Math.floor(s)} SECONDS` : `${m} MINUTE${m === 1 ? '' : 'S'}`; };
const NT_CTX = [
  [ntS('tower') - 0.2, NT.windows - 0.3, 'THE NORTH TOWER', () => ({ v: '1,368 ft · 110 FLOORS', v2: 'ABOUT 8,900 PEOPLE INSIDE AT 8:46' })],
  [ntS('windows') - 0.2, NT.impactShot - 0.3, 'EACH WINDOW', () => ({ v: '22 in WIDE', v2: 'STEEL COLUMNS JUST OVER A YARD APART' })],
  [ntCap('impact', 2).show - 0.2, NT.known - 0.3, 'SINCE THE IMPACT', (t) => ({ v: ntSince(t), v2: t > ntCap('nobody', 0).show ? 'NO ANNOUNCEMENT REACHES YOU' : '' })],
  [ntS('known') + 0.2, NT.stair - 0.3, 'THE IMPACT', () => ({ v: 'FLOORS 93 TO 99', v2: '20 FLOORS ABOVE YOU' })],
  [ntCap('stair', 0).show - 0.2, NT.glow - 0.3, 'STAIRWAY C', () => ({ v: '44 in WIDE', v2: 'TWO PEOPLE SIDE BY SIDE' })],
  [ntS('pace') - 0.2, NT.second - 0.3, 'SINCE THE IMPACT', (t) => ({ v: ntSince(t), v2: '' })],
  [ntCap('second', 2).show - 0.2, NT.calm - 0.3, 'THE SOUTH TOWER', () => ({ v: 'HIT AT 9:03', v2: 'FLOORS 77 TO 85' })],
  [ntS('calm'), NT.transfer - 0.3, 'SINCE THE IMPACT', (t) => ({ v: ntSince(t), v2: '' })],
  [ntS('ff') - 0.2, NT.water - 0.3, 'GOING UP', () => ({ v: 'FIREFIGHTERS', v2: 'ON FOOT · THE ELEVATORS ARE OUT' })],
  [ntS('water'), NT.mezz - 0.3, 'SINCE THE IMPACT', (t) => ({ v: ntSince(t), v2: '' })],
  [ntS('nine59') + 2.0, NT.cloud - 0.3, 'THE SOUTH TOWER', () => ({ v: 'COLLAPSES IN 10 SECONDS', v2: '56 MINUTES AFTER IT WAS HIT' })],
];
// the honest labels: [from, to, text]
const NT_TAGS = [
  [NT.morning + 0.5, NT.impactShot - 0.2, 'YOU ARE A COMPOSITE OF SURVIVORS’ ACCOUNTS · THE TIMES ARE REAL'],
  [NT.impactShot + 0.3, NT.hit - 0.1, 'THE MORNING, SPED UP'],
  [NT.after + 0.3, NT.known - 0.1, 'THE MORNING, SPED UP · SOUND, LIGHT AND SMOKE ARE FROM SURVIVORS’ ACCOUNTS'],
  [NT.stair + 0.4, NT.mezz - 0.1, 'THE DESCENT, SPED UP · ABOUT ONE FLOOR A MINUTE'],
  [NT.mezz + 0.4, NT.roarShot - 0.1, 'THE ROUTE OUT, AS POLICE DIRECTED IT'],
  [NT.roarShot + 0.4, NT.out - 0.3, 'NOTHING HERE IS SHOWN CLOSER THAN IT WAS SEEN'],
  [NT.light + 0.6, NT.card - 0.3, 'EVERY SEPTEMBER 11 · LOWER MANHATTAN'],
];
function ntCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/\b(\d[\d,.:]*(?:\s?(?:AM|inches|floors?|minutes|pounds))?|102 minutes|73rd|91st|the 73rd floor|the 91st floor)\b/g, '<span class="n">$1</span>');
}

class NtHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('nt-ro', '<div class="l"></div><div class="v"></div><div class="s"></div>');
    this.roL = this.ro.querySelector('.l'); this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.ctx = mk('nt-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.tag = mk('nt-tag');
    this.clock = mk('nt-clock', '<div class="l">TUESDAY · SEPTEMBER 11, 2001</div><div class="v"></div>'); this.clockV = this.clock.querySelector('.v');
    this.cap = mk('nt-cap');
    this.caps = NTT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: ntCapHtml(c.text), big: g.id === 'cost' || g.id === 'light' })));
    this.tower = mk('nt-tower');
    this.card = mk('nt-card', `<div class="k">IN MEMORY OF</div><div class="h">THE 2,977 PEOPLE<br>KILLED ON SEPTEMBER 11, 2001</div>
      <div class="k2">AND THE SIX KILLED IN THE BOMBING OF FEBRUARY 26, 1993</div>
      <div class="note">The person you followed is a composite of survivors’ accounts. The times, places and numbers come from<br>the 9/11 Commission Report, NIST and the 9/11 Memorial &amp; Museum.</div>`);
    this.labels = [];
    this.root = root;
    this._last = {};
    this._towerKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win;
    const wh = NT_WHERE.find((x) => t >= x[0] && t < x[1]);
    const ra = W(t, NT.morning + 0.6, NT.out - 0.4, 0.6, 0.6);
    this._set('ro', this.ro, 'opacity', wh ? ra.toFixed(3) : '0');
    if (wh) {
      this._txt('rol', this.roL, wh[2]); this._txt('rov', this.roV, wh[3](t)); this._txt('ros', this.roS, wh[4]);
      this._set('rovc', this.roV, 'fontSize', /^\d+$/.test(wh[3](t)) ? '' : 'calc(var(--u) * 58)');
    }
    const cx = NT_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? W(t, cx[0], cx[1], 0.5, 0.4).toFixed(3) : '0');
    if (cx) {
      const r = cx[3](t), o = typeof r === 'string' ? { v: r } : r;
      this._txt('cxl', this.ctxL, o.l || cx[2]); this._html('cxv', this.ctxV, o.v); this._html('cxv2', this.ctxV2, o.v2 || '');
    }
    const tg = NT_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.5, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    const ca = W(t, NT.morning + 0.6, NT.out - 0.4, 0.6, 0.6);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = ntClockParts(ntClock(t));
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.s).padStart(2, '0')}</small> <i>AM</i>`);
    }
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) {
      this._html('cap', this.cap, cp.html); this._set('capq', this.cap, 'className', cp.big ? 'nt-cap q' : 'nt-cap');
      this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.25, 0.35).toFixed(3));
    } else this._set('capa', this.cap, 'opacity', '0');
    this._towerBar(t);
    this._set('card', this.card, 'opacity', W(t, NT.card, NT.end - 1.4, 1.2, 1.0).toFixed(3));
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'nt-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = NtHud._p || (NtHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam) { d.style.opacity = '0'; return; }
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      d.style.opacity = vis ? String(l.a ?? 1) : '0';
      const lx = (_p.x * 0.5 + 0.5) * 100, ly = (-_p.y * 0.5 + 0.5) * 100;
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ly.toFixed(2) + '%';
      const h = `<span class="d"></span><span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      if (d._h !== h) { d._h = h; d.innerHTML = h; }
    });
  }

  // the slim tower: 110 floors, the impact floors, the stairways gone above 91, you
  _towerBar(t) {
    const W = StoryHUD.win, a = W(t, ntS('known') + 1.2, NT.mezz - 0.2, 0.6, 0.5);
    this._set('twa', this.tower, 'opacity', a.toFixed(3));
    if (a <= 0) return;
    const f = ntFloorNowF(t), key = f.toFixed(2) + (t > ntCap('known', 2).show - 0.2 ? 'g' : '');
    if (key === this._towerKey) return;
    this._towerKey = key;
    const H = 560, top = 30, Y = (fl) => top + H * (1 - fl / 110), x = 70, w = 54, gone = t > ntCap('known', 2).show - 0.2;
    const tick = (fl) => `<line x1="${x - 10}" y1="${Y(fl).toFixed(1)}" x2="${x}" y2="${Y(fl).toFixed(1)}" stroke="rgba(246,239,226,0.5)" stroke-width="2"/><text x="${x - 16}" y="${(Y(fl) + 7).toFixed(1)}" class="s" text-anchor="end">${fl}</text>`;
    this.tower.innerHTML = `<svg viewBox="0 0 230 640" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x}" y="${top}" width="${w}" height="${H}" fill="rgba(200,206,214,0.16)" stroke="rgba(246,239,226,0.55)" stroke-width="2"/>
      ${gone ? `<rect x="${x}" y="${top}" width="${w}" height="${(Y(91) - top).toFixed(1)}" fill="rgba(40,40,44,0.75)"/>` : ''}
      <rect x="${x}" y="${Y(99).toFixed(1)}" width="${w}" height="${(Y(93) - Y(99)).toFixed(1)}" fill="#e0703a"/>
      ${[110, 99, 93, 78, 44, 1].map(tick).join('')}
      <circle cx="${x + w / 2}" cy="${Y(f).toFixed(1)}" r="9" fill="#ffffff"/><circle cx="${x + w / 2}" cy="${Y(f).toFixed(1)}" r="17" fill="rgba(255,255,255,0.25)"/>
      <text x="${x + w + 14}" y="${(Y(96) + 7).toFixed(1)}" class="t" style="fill:#ffb38a">IMPACT</text>
      <text x="${x + w + 14}" y="${(Y(f) + 7).toFixed(1)}" class="t">YOU</text>
    </svg>`;
  }
}
