/* =====================================================================
   HUD — two visual languages over the picture:
     the GAME   clean off-white: PLAYER DETECTED, the hearts, the touch
                rings, CHOOSE with its 3-2-1 ring, HOLD HERE with its
                progress, the item roulette, the item table, the score
     the SYSTEM colder and technical (mono, ice-blue, thin brackets):
                EXTERNAL INPUT DETECTED, RESET IN 5…1, OVERRIDE
   plus the speech subtitles. Everything is a pure function of film time.
   Positions are design pixels (1080 × 1920) inside the safe zones.
   ===================================================================== */

const GM_ICON = {
  heart: '<path d="M12 20.6s-7.4-4.5-9.3-9C1.3 8 3.5 4.6 6.9 4.6c2 0 3.5 1.1 5.1 3 1.6-1.9 3.1-3 5.1-3 3.4 0 5.6 3.4 4.2 7-1.9 4.5-9.3 9-9.3 9z"/>',
  key: '<circle cx="7.5" cy="12" r="4.2" fill="none" stroke-width="2.2"/><path d="M11.7 12H21.5M17.5 12v3.4M20.5 12v2.6" fill="none" stroke-width="2.2" stroke-linecap="round"/>',
  shield: '<path d="M12 2.8l7.6 3v6.1c0 4.7-3.2 7.9-7.6 9.4-4.4-1.5-7.6-4.7-7.6-9.4V5.8z" fill="none" stroke-width="2.1" stroke-linejoin="round"/><path d="M12 6.2v11.6" stroke-width="1.6"/>',
  medkit: '<rect x="2.8" y="7" width="18.4" height="13.2" rx="2.4" fill="none" stroke-width="2.1"/><path d="M9 7V4.6h6V7M12 10.3v6.6M8.7 13.6h6.6" fill="none" stroke-width="2.1" stroke-linecap="round"/>',
  light: '<path d="M8.6 9.4h6.8l-1.6 3v8.4h-3.6v-8.4z" fill="none" stroke-width="2" stroke-linejoin="round"/><rect x="8" y="6.6" width="8" height="2.8" rx="0.8" fill="none" stroke-width="2"/><path d="M12 1.8v2.4M6.4 3.6l1.4 1.8M17.6 3.6l-1.4 1.8" stroke-width="1.8" stroke-linecap="round"/>',
  check: '<path d="M4.5 12.5l4.6 4.6L19.5 6.8" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2" fill="none" stroke-width="1.8"/><path d="M10.5 18.6h3" stroke-width="1.6" stroke-linecap="round"/>',
};
const gmSvg = (name, cls = '', extra = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" ${extra}>${GM_ICON[name]}</svg>`;

class GmHud {
  constructor(root) {
    this.root = root;
    const mk = (cls, html = '', parent = root) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; parent.appendChild(d); return d; };
    this.el = {
      slitT: mk('gm-slit top'), slitB: mk('gm-slit bot'), boot: mk('gm-boot', 'LOADING WORLD <b>100%</b>'),
      detected: mk('gm-detected', '<span class="ln"></span>PLAYER DETECTED<span class="ln"></span>'),
      hearts: mk('gm-hearts', `<div class="row">${[0, 1, 2].map((i) => `<span class="h h${i}">${gmSvg('heart')}</span>`).join('')}</div><div class="lab">3 LIVES</div>`),
      callout: mk('gm-callout'),
      item: mk('gm-itemslot', '<span class="lab">ITEM</span><span class="box">?</span>'),
      dont: mk('gm-dont', 'DON’T LET<br>ME DIE.'),
      prompt: mk('gm-prompt'),
      choose: mk('gm-choose', 'CHOOSE!'),
      left: mk('gm-opt left', '◀ LEFT'), right: mk('gm-opt right', 'RIGHT ▶'),
      tilt: mk('gm-tilt', `${gmSvg('phone', 'ph')}<span>TILT YOUR PHONE<br>TOWARD YOUR CHOICE</span>`),
      result: mk('gm-result', `<div class="r ok">RIGHT = SAFE ${gmSvg('check')}</div><div class="r bad">LEFT = −1 ${gmSvg('heart')}</div><div class="own">keep your own score</div>`),
      roulTitle: mk('gm-roul-title', 'TAP TO STOP<br>ON YOUR ITEM'),
      card: mk('gm-card', '<div class="icon"></div><div class="name"></div>'),
      strip: mk('gm-strip', GM_ITEMS.map((it, i) => `<span class="s s${i}">${gmSvg(it.id)}</span>`).join('')),
      remember: mk('gm-remember', 'YOUR ITEM = WHERE YOU STOPPED<div class="sub">didn’t tap? → ' + gmSvg('shield') + ' SHIELD</div>'),
      sys: mk('gm-sys'),
      count: mk('gm-count'),
      dim: mk('gm-dim'),
      table: mk('gm-table', `<div class="t">WHAT ITEM DID YOU GET?</div>${GM_ITEMS.map((it, i) => `<div class="row r${i}">${gmSvg(it.id)}<span class="n">${it.name}</span><span class="arr">→</span><span class="res">${it.res}</span><span class="m ${it.id === 'light' ? 'bad' : 'ok'}">${it.id === 'medkit' ? '+1 ' + gmSvg('heart') : it.id === 'light' ? '−1 ' + gmSvg('heart') : gmSvg('check')}</span></div>`).join('')}`),
      score: mk('gm-score', `<div class="t">HOW MANY LIVES<br>DO YOU HAVE LEFT?</div>${[[3, 'PERFECT'], [2, 'SURVIVED'], [1, 'BARELY'], [0, 'YOU DIED']].map(([n, w], i) => `<div class="row r${i}"><span class="hs">${n ? Array.from({ length: n }, () => gmSvg('heart')).join('') : '<b>0</b>'}</span><span class="eq">=</span><span class="w">${w}</span></div>`).join('')}<div class="q">WHAT ITEM DID YOU GET?</div><div class="its">${GM_ITEMS.map((it) => `<span>${gmSvg(it.id)}<em>${it.name}</em></span>`).join('')}</div>`),
      say: mk('gm-say'),
    };
    // the rings: one SVG layer in design pixels
    const NS = 'http://www.w3.org/2000/svg';
    this.svg = document.createElementNS(NS, 'svg'); this.svg.setAttribute('viewBox', '0 0 1080 1920'); this.svg.setAttribute('class', 'gm-rings'); root.appendChild(this.svg);
    this.svg.innerHTML = `
      <defs><radialGradient id="gmGlow"><stop offset="0" stop-color="#dff6ff" stop-opacity="0.9"/><stop offset="0.45" stop-color="#9fe4ff" stop-opacity="0.35"/><stop offset="1" stop-color="#9fe4ff" stop-opacity="0"/></radialGradient></defs>
      <g id="gmTouch"><circle class="glow" r="150" fill="url(#gmGlow)"/><circle class="pulse" r="110" fill="none" stroke="#f4f7fa" stroke-width="3"/><circle class="base" r="96" fill="none" stroke="rgba(244,247,250,0.35)" stroke-width="6"/>
        <circle class="arc" r="96" fill="none" stroke="#f4f7fa" stroke-width="6" stroke-linecap="round" transform="rotate(-90)"/><circle class="dot" r="11" fill="#f4f7fa"/><circle class="burst" r="96" fill="none" stroke="#dff6ff" stroke-width="5"/></g>
      <g id="gmHold"><g class="rays"></g><circle class="base" r="118" fill="rgba(8,12,14,0.25)" stroke="rgba(244,247,250,0.3)" stroke-width="10"/>
        <circle class="arc" r="118" fill="none" stroke="#9ff0ff" stroke-width="10" stroke-linecap="round" transform="rotate(-90)"/><circle class="dot" r="12" fill="#f4f7fa"/>
        <text class="pct" y="12" text-anchor="middle">0%</text></g>
      <g id="gmTimer"><circle class="base" r="88" fill="rgba(8,10,12,0.35)" stroke="rgba(244,247,250,0.28)" stroke-width="7"/><circle class="arc" r="88" fill="none" stroke="#f4f7fa" stroke-width="7" stroke-linecap="round" transform="rotate(-90)"/>
        <text class="n" y="30" text-anchor="middle">3</text></g>
      <g id="gmFinger"><circle class="glow" r="120" fill="url(#gmGlow)"/><circle class="pulse" r="78" fill="none" stroke="#f4f7fa" stroke-width="3"/><circle class="base" r="64" fill="none" stroke="#f4f7fa" stroke-width="4"/><circle class="dot" r="8" fill="#f4f7fa"/><circle class="burst" r="64" fill="none" stroke="#ffffff" stroke-width="5"/></g>`;
    this.g = { touch: this.svg.querySelector('#gmTouch'), hold: this.svg.querySelector('#gmHold'), timer: this.svg.querySelector('#gmTimer'), finger: this.svg.querySelector('#gmFinger') };
    const rays = this.g.hold.querySelector('.rays');
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, l = document.createElementNS(NS, 'line'); l.setAttribute('x1', (Math.cos(a) * 135).toFixed(1)); l.setAttribute('y1', (Math.sin(a) * 135).toFixed(1)); l.setAttribute('x2', (Math.cos(a) * 330).toFixed(1)); l.setAttribute('y2', (Math.sin(a) * 330).toFixed(1)); l.setAttribute('class', 'ray'); rays.appendChild(l); }
    this.rays = [...rays.children];
    this.c = {};
  }

  _set(el, k, v) { const key = k; if (el['_' + key] !== v) { el.style[key] = v; el['_' + key] = v; } }
  _html(el, v) { if (el._h !== v) { el.innerHTML = v; el._h = v; } }
  _attr(el, k, v) { if (el['_a' + k] !== v) { el.setAttribute(k, v); el['_a' + k] = v; } }
  _ring(g, x, y, s = 1) { this._attr(g, 'transform', `translate(${x} ${y}) scale(${s.toFixed(3)})`); }
  _arc(c, r, k) { const L = 2 * Math.PI * r; this._attr(c, 'stroke-dasharray', `${(L * MathX.clamp(k, 0, 1)).toFixed(1)} ${L.toFixed(1)}`); }

  update(t, app) {
    const E = this.el, W = StoryHUD.win, fr = Math.floor(t * 30 + 1e-6), op = (el, v) => this._set(el, 'opacity', (+v).toFixed(3));
    const flick = (a) => !(t - a >= 0 && t - a < 0.1 && fr % 2 === 1);              // a two-frame flicker as a line arrives
    const sysOn = t >= GM.sys.flicker && t < GM.end.cut;
    // the boot: a slit opens outward from his eyes
    const B = GM.boot, k = Ease.outCubic(MathX.clamp((t - B[0] - 0.15) / (B[1] - B[0] - 0.05), 0, 1)), eye = 800, half = MathX.lerp(118, 1100, k);   // (the first frames: only his eyes)
    this._set(E.slitT, 'height', `calc(var(--u) * ${Math.max(0, eye - half).toFixed(1)})`); this._set(E.slitB, 'top', `calc(var(--u) * ${(eye + half).toFixed(1)})`);
    op(E.slitT, t < B[1] + 0.2 ? 1 : 0); op(E.slitB, t < B[1] + 0.2 ? 1 : 0); op(E.boot, t < 0.2 ? 1 - MathX.smooth(t, 0.12, 0.18) : 0);
    // PLAYER DETECTED, the hearts (centred, then a compact widget top-left)
    op(E.detected, t >= GM.detected && t < 3.5 && flick(GM.detected) ? 1 - MathX.smooth(t, 3.2, 3.5) : 0);
    const hm = MathX.smooth(t, 3.3, 3.75), hOn = t >= GM.hearts && t < GM.end.cut && !(t > GM.reset.hit && t < GM.reach.cancelled + 0.4 && fr % 7 < 2);
    op(E.hearts, hOn ? MathX.smooth(t, GM.hearts, GM.hearts + 0.12) * (t > GM.reset.hit && t < GM.reach.cancelled ? 0.55 : 1) : 0);
    this._set(E.hearts, 'transform', `translate(calc(var(--u) * ${MathX.lerp(0, -380, hm).toFixed(1)}), calc(var(--u) * ${MathX.lerp(0, -106, hm).toFixed(1)})) scale(${MathX.lerp(1, 0.8, hm).toFixed(3)})`);
    E.hearts.classList.toggle('compact', hm > 0.5);
    // the game never takes a heart itself (it can't know what you chose): a callout beside them says when to count one
    E.hearts.classList.toggle('hit', (t >= GM.choice.result[0] && t < GM.choice.result[0] + 0.4) || (t >= GM.drone.fire + 0.15 && t < GM.drone.fire + 0.55));
    const co = t >= GM.choice.result[0] && t < GM.choice.result[1] ? 'WENT LEFT? −1 ' + gmSvg('heart') : t >= GM.drone.fire + 0.15 && t < GM.reset.press ? 'LIGHT? −1 ' + gmSvg('heart') + '&nbsp; MEDKIT? +1 ' + gmSvg('heart') : '';
    this._html(E.callout, co); op(E.callout, co ? 1 : 0);
    op(E.item, t >= GM.roul.remember[0] && t < GM.end.cut && hOn ? 1 : 0);
    E.item.classList.toggle('pulse', t > GM.drone.table[0] && t < GM.drone.table[1]);
    // DON'T LET ME DIE.
    const D = GM.hook.dont; op(E.dont, W(t, D[0], D[1] + 0.05, 0.08, 0.25)); this._set(E.dont, 'transform', `translateX(-50%) scale(${(1.08 - 0.08 * Ease.outCubic(MathX.clamp((t - D[0]) / 0.25, 0, 1))).toFixed(3)})`);
    // the first touch: the ring over his palm
    const T = GM.touch, tg = GM_TARGETS.palm, tOn = t >= T.prompt && t < T.contact + 0.7;
    this.g.touch.style.opacity = tOn ? (t < T.contact ? MathX.smooth(t, T.prompt, T.prompt + 0.15) : 1 - MathX.smooth(t, T.contact + 0.2, T.contact + 0.7)).toFixed(3) : '0';
    if (tOn) {
      this._ring(this.g.touch, tg.x, tg.y, 1);
      const pre = t < T.contact, pu = (t - T.prompt) % 0.75 / 0.75;
      const q = this.g.touch;
      this._arc(q.querySelector('.arc'), 96, pre ? (t - T.prompt) / (T.contact - T.prompt) : 1);
      q.querySelector('.pulse').setAttribute('r', (pre ? 100 + 40 * pu : 96).toFixed(1)); q.querySelector('.pulse').style.opacity = pre ? (1 - pu).toFixed(3) : '0';
      const bu = MathX.clamp((t - T.contact) / 0.6, 0, 1);
      q.querySelector('.burst').style.opacity = '0';                        // (the reaction is in the glass, not in the interface)
      q.querySelector('.glow').style.opacity = pre ? '0.15' : (1 - MathX.smooth(t, T.contact + 0.1, T.contact + 0.7)).toFixed(3);
      q.querySelector('.base').style.opacity = pre ? '1' : '0';
    }
    // prompts under the targets
    let pr = '', po = 0;
    if (t >= T.prompt && t < T.contact + 0.15) { pr = 'PUT YOUR FINGER<br>ON MY HAND'; po = MathX.smooth(t, T.prompt, T.prompt + 0.15); }
    const H = GM.hold;
    if (t >= H.ui && t < H.open[0]) { pr = 'HOLD HERE'; po = MathX.smooth(t, H.ui, H.ui + 0.15) * (t > H.steps[4] ? 1 - MathX.smooth(t, H.steps[4], H.open[0]) : 1); }
    const R = GM.reach;
    if (t >= R.target[0] && t < R.contact + 0.1) { pr = 'TOUCH HERE'; po = MathX.smooth(t, R.target[0], R.target[0] + 0.2); }
    this._html(E.prompt, pr); op(E.prompt, po);
    E.prompt.className = 'gm-prompt' + (pr === 'HOLD HERE' ? ' hold' : pr === 'TOUCH HERE' ? ' finger' : '');
    // CHOOSE: the 3-2-1 ring, the doors' labels, the tilt instruction; the result
    const C = GM.choice, cOn = t >= C.ui && t < C.zero + 0.35;
    op(E.choose, cOn && flick(C.ui) ? (t < C.zero ? 1 : 1 - MathX.smooth(t, C.zero, C.zero + 0.3)) : 0);
    op(E.left, cOn ? (t < C.zero ? 1 : 0.25) : 0); op(E.right, cOn ? 1 : 0);
    E.right.classList.toggle('picked', t >= C.zero); E.left.classList.toggle('nudge', t < C.zero && Math.floor(t * 2.5) % 2 === 0); E.right.classList.toggle('nudge', t < C.zero && Math.floor(t * 2.5) % 2 === 1);
    op(E.tilt, t >= C.ui + 0.2 && t < C.zero ? MathX.smooth(t, C.ui + 0.2, C.ui + 0.4) : 0);
    const ph = E.tilt.querySelector('.ph'); if (ph) ph.style.transform = `rotate(${(18 * Math.sin((t - C.ui) * 4.2)).toFixed(1)}deg)`;
    const tm = this.g.timer, tOnT = t >= C.n[0] - 0.1 && t < C.zero + 0.25;
    tm.style.opacity = tOnT ? (t < C.zero ? 1 : 1 - MathX.smooth(t, C.zero, C.zero + 0.25)).toFixed(3) : '0';
    if (tOnT) {
      this._ring(tm, 540, 560, 1 + 0.06 * MathX.impulse(t, [C.n[0], C.n[1], C.n[2]].filter((a) => a <= t).pop() || 0, 0.12));
      const n = t < C.n[1] ? 3 : t < C.n[2] ? 2 : t < C.zero ? 1 : 0;
      const seg = t < C.n[0] ? 0 : t < C.zero ? ((t - C.n[0]) % 0.8) / 0.8 : 1;
      this._arc(tm.querySelector('.arc'), 88, 1 - seg);
      const nt = tm.querySelector('.n'); if (nt.textContent !== String(n)) nt.textContent = String(n);
    }
    op(E.result, t >= C.result[0] && t < C.result[1] && flick(C.result[0]) ? 1 - MathX.smooth(t, C.result[1] - 0.3, C.result[1]) : 0);
    // HOLD: the progress ring and the energy around the fingertip
    const ho = this.g.hold, hOnR = t >= H.ui && t < H.open[0] + 0.4;
    ho.style.opacity = hOnR ? (t < H.open[0] ? MathX.smooth(t, H.ui, H.ui + 0.15) : 1 - MathX.smooth(t, H.open[0], H.open[0] + 0.4)).toFixed(3) : '0';
    if (hOnR) {
      const p = app.fac.holdProgress(t), g2 = GM_TARGETS.pad;
      this._ring(ho, g2.x, g2.y, 1 + 0.04 * Math.sin(t * 12) * (t > H.start ? 1 : 0) + 0.12 * MathX.impulse(t, H.steps[4], 0.15) * (t > H.steps[4] ? 1 : 0));
      this._arc(ho.querySelector('.arc'), 118, p);
      ho.querySelector('.arc').setAttribute('stroke', p >= 1 ? '#a8f7c8' : '#9ff0ff');
      const pt = ho.querySelector('.pct'), s = t < H.start ? '' : p >= 1 ? '100%' : `${Math.round(p * 100)}%`;
      if (pt.textContent !== s) pt.textContent = s;
      const on = t > H.start ? 1 : 0;
      this.rays.forEach((l, i) => { const ph2 = (t * 3.2 + i * 0.37) % 1; l.style.opacity = (on * (0.15 + 0.85 * p) * (1 - ph2) * (0.5 + 0.5 * hash1(i * 7 + Math.floor(t * 12)))).toFixed(3); l.setAttribute('stroke-dashoffset', (-ph2 * 200).toFixed(1)); });
    }
    // the roulette
    const Ro = GM.roul, rOn = t >= Ro.ui && t < Ro.remember[1];
    op(E.roulTitle, t >= Ro.ui && t < Ro.land && flick(Ro.ui) ? 1 : 0);
    op(E.card, rOn ? MathX.smooth(t, Ro.ui, Ro.ui + 0.15) * (1 - MathX.smooth(t, Ro.remember[1] - 0.3, Ro.remember[1])) : 0);
    op(E.strip, rOn && t < Ro.land + 0.4 ? 0.9 * (1 - MathX.smooth(t, Ro.land, Ro.land + 0.4)) : 0);
    if (rOn) {
      // it spins, slows, and ends on a question mark: your item is the one you stopped on (no tap: the SHIELD)
      const i = t < Ro.spin[0] ? 1 : gmItemAt(t), it = GM_ITEMS[i], end = t >= Ro.land;
      this._html(E.card.querySelector('.icon'), end ? '<b class="q">?</b>' : gmSvg(it.id)); this._html(E.card.querySelector('.name'), end ? 'YOUR ITEM' : it.name);
      E.card.classList.toggle('landed', t >= Ro.land); E.card.classList.toggle('tick', t >= Ro.spin[0] && t < Ro.land && fr % 6 === 0);
      [...E.strip.children].forEach((s, j) => s.classList.toggle('on', j === i));
    }
    op(E.remember, t >= Ro.remember[0] && t < Ro.remember[1] ? W(t, Ro.remember[0], Ro.remember[1], 0.15, 0.3) : 0);
    // the item table
    const Dt = GM.drone.table;
    op(E.table, t >= Dt[0] && t < Dt[1] ? W(t, Dt[0], Dt[1], 0.12, 0.25) : 0);
    [...E.table.querySelectorAll('.row')].forEach((r, j) => this._set(r, 'opacity', MathX.smooth(t, Dt[0] + 0.15 + j * 0.18, Dt[0] + 0.3 + j * 0.18).toFixed(3)));
    // the system: cold, technical; it cuts in, it does not fade
    let sys = '';
    const S = GM.sys, line = (a, b, txt, cls = '') => (t >= a && t < b && flick(a) ? `<div class="l ${cls}"><span class="br">[</span>${txt}<span class="br">]</span></div>` : '');
    if (sysOn) {
      sys += line(S.input, S.end, 'EXTERNAL INPUT DETECTED');
      sys += line(S.observer, S.end, 'OBSERVER CONNECTION <b>ACTIVE</b>', 'b');
      const Rc = GM.reach;
      if (t >= Rc.glitch[0] && t < Rc.override) { const g = 'RESET—', s = g.split('').map((ch, i) => (hash2(i, fr) < 0.3 ? '▓░▒█'.charAt(Math.floor(hash2(i + 9, fr) * 4)) : ch)).join(''); sys += `<div class="l big">${t < Rc.glitch[0] + 0.25 ? g : s}</div>`; }
      sys += line(Rc.override, Rc.cancelled, 'EXTERNAL PLAYER OVERRIDE', 'b');
      if (t >= Rc.cancelled && t < GM.end.cut - 0.05 && flick(Rc.cancelled)) sys += '<div class="l big ok">RESET<br><b>CANCELLED</b></div>';
    }
    this._html(E.sys, sys); op(E.sys, sys ? 1 : 0);
    E.sys.classList.toggle('low', t >= GM.reach.glitch[0]);
    E.table.querySelector('.r1').classList.toggle('hit', t >= GM.drone.fire + 0.15 && t < GM.drone.table[1]);
    // RESET IN 5 · 4 · 3 · 2 · 1
    const Re = GM.reset; let n = 0;
    if (t >= Re.n5 && t < GM.reach.glitch[0]) n = t < Re.n4 ? 5 : t < Re.n3 ? 4 : t < Re.hit ? 3 : t < GM.reach.n1 ? 2 : 1;
    this._html(E.count, n ? `<div class="l">RESET IN</div><div class="n">${n}</div>` : ''); op(E.count, n && flick([Re.n5, Re.n4, Re.n3, Re.hit, GM.reach.n1][5 - n]) ? 1 : 0);
    // the fingertip through the crack
    const fg = this.g.finger, fOn = t >= R.target[0] && t < R.contact + 0.6, ft = GM_TARGETS.finger;
    fg.style.opacity = fOn ? (t < R.contact ? MathX.smooth(t, R.target[0], R.target[0] + 0.2) : 1 - MathX.smooth(t, R.contact + 0.15, R.contact + 0.6)).toFixed(3) : '0';
    if (fOn) {
      this._ring(fg, ft.x, ft.y, 1);
      const pre = t < R.contact, pu = (t - R.target[0]) % 0.7 / 0.7;
      fg.querySelector('.pulse').setAttribute('r', (pre ? 70 + 34 * pu : 64).toFixed(1)); fg.querySelector('.pulse').style.opacity = pre ? (1 - pu).toFixed(3) : '0';
      const bu = MathX.clamp((t - R.contact) / 0.5, 0, 1);
      fg.querySelector('.burst').setAttribute('r', (64 + 160 * Ease.outCubic(bu)).toFixed(1)); fg.querySelector('.burst').style.opacity = pre ? '0' : (1 - bu).toFixed(3);
      fg.querySelector('.glow').style.opacity = pre ? '0.12' : (1 - bu).toFixed(3); fg.querySelector('.base').style.opacity = pre ? '1' : '0';
    }
    // the score
    const Sc = GM.end.score;
    op(E.dim, t >= Sc ? 0.8 * MathX.smooth(t, Sc, Sc + 0.25) : 0);
    op(E.score, t >= Sc ? MathX.smooth(t, Sc, Sc + 0.2) : 0);
    [...E.score.querySelectorAll('.row')].forEach((r, j) => this._set(r, 'opacity', MathX.smooth(t, Sc + 0.2 + j * 0.15, Sc + 0.35 + j * 0.15).toFixed(3)));
    this._set(E.score.querySelector('.q'), 'opacity', MathX.smooth(t, GM.end.item, GM.end.item + 0.2).toFixed(3));
    this._set(E.score.querySelector('.its'), 'opacity', MathX.smooth(t, GM.end.item + 0.15, GM.end.item + 0.35).toFixed(3));
    // speech
    const s = GM_SAY.find((x) => t >= x[2][0] && t < x[2][1]);
    if (s) { this._html(E.say, s[1]); E.say.className = 'gm-say ' + (s[0] === 'T' ? 'tech' : '') + (s[3] === 'quiet' ? ' quiet' : ''); op(E.say, W(t, s[2][0], s[2][1], 0.08, 0.2)); }
    else op(E.say, 0);
  }
}
