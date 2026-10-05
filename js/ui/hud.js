/* =====================================================================
   HUD — HTML/CSS overlay on top of the WebGL canvas.
   Everything shown is a pure function of time t (scrub-safe).
   Layout respects TikTok/Shorts safe zones (top ~8 %, bottom ~22 %, right edge).
   ===================================================================== */

class HUD {
  constructor(root, tl) {
    this.root = root;
    this.tl = tl;
    this.el = {
      o2: root.querySelector('#o2Readout'),
      o2Value: root.querySelector('#o2Value'),
      o2Fill: root.querySelector('#o2Fill'),
      o2Label: root.querySelector('#o2Readout .label'),
      timer: root.querySelector('#timerReadout'),
      timerValue: root.querySelector('#timerValue'),
      title: root.querySelector('#title'),
      log: root.querySelector('#log'),
      ann: root.querySelector('#annotations'),
    };
    // log lines
    this.logs = SCRIPT.hud.logs.map((l) => {
      const d = document.createElement('div');
      d.className = 'logline ' + (l.tone || '');
      d.innerHTML = `<span class="tick"></span><span class="txt"></span>`;
      d.querySelector('.txt').textContent = l.text;
      this.el.log.appendChild(d);
      return { ...l, el: d };
    });
    // annotations
    this.anns = SCRIPT.hud.annotations.map((a) => {
      const d = document.createElement('div');
      d.className = 'ann ' + (a.tone || '');
      d.innerHTML = `<div class="box"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>
        <div class="tag"><div class="t1"></div><div class="t2"><span class="dot"></span><span class="st"></span></div></div><div class="lead"></div>`;
      d.querySelector('.t1').textContent = a.title;
      d.querySelector('.st').textContent = a.status;
      this.el.ann.appendChild(d);
      return { ...a, el: d };
    });
    this._v = new THREE.Vector3();
    this._last = {};
  }

  _set(key, el, prop, val) {
    if (this._last[key] === val) return;
    this._last[key] = val;
    el.style[prop] = val;
  }

  update(t, camera, resolveAnchor) {
    const tl = this.tl, H = SCRIPT.hud;
    // ---- oxygen readout
    const o2 = SCRIPT_TRACKS.oxygen.value(t);
    const dropping = t >= tl.at('oxygen_drop') && t < tl.at('o2_zero') + 0.15;
    let shown = o2;
    if (dropping && o2 > 0.05) shown = Math.max(0, o2 + (hash1(Math.floor(t * 30)) - 0.5) * 0.6);
    const txt = shown.toFixed(1);
    if (this._last.o2txt !== txt) { this.el.o2Value.textContent = txt; this._last.o2txt = txt; }
    this._set('o2fill', this.el.o2Fill, 'transform', `scaleX(${(o2 / 20.95).toFixed(4)})`);
    const red = o2 < H.oxygenRedBelow;
    this.el.o2.classList.toggle('alert', red);
    this.el.o2.classList.toggle('dropping', dropping);
    // flicker the zero a few times
    const z = t - tl.at('o2_zero');
    const flick = z > 0 && z < 1.2 ? (Math.floor(z * 10) % 3 === 1 ? 0.35 : 1) : 1;
    this._set('o2op', this.el.o2, 'opacity', String(flick));

    // ---- title (hook)
    const ti = MathX.window(t, H.title.in - 0.01, H.title.out, 0.01, 0.35);
    this._set('titleop', this.el.title, 'opacity', ti.toFixed(3));
    const ts = 1 + (1 - MathX.smooth(t, H.title.out - 0.35, H.title.out)) * 0 + MathX.smooth(t, H.title.out - 0.35, H.title.out) * 0.06;
    this._set('titletr', this.el.title, 'transform', `translateX(-50%) scale(${ts.toFixed(3)})`);

    // ---- time without oxygen
    const tv = MathX.smooth(t, H.timerFrom, H.timerFrom + 0.35);
    this._set('timerop', this.el.timer, 'opacity', tv.toFixed(3));
    this._set('timertr', this.el.timer, 'transform', `translateY(${((1 - tv) * 12).toFixed(1)}px)`);
    const secs = Math.max(0, t - tl.at('o2_zero'));
    const tt = `00:${String(Math.floor(secs)).padStart(2, '0')}`;
    if (this._last.tt !== tt) { this.el.timerValue.textContent = tt; this._last.tt = tt; }
    this.el.timer.classList.toggle('alert', SCRIPT_TRACKS.hypoxia.value(t) > 0.2);

    // ---- log lines (typewriter in, fade out, newest at the bottom)
    let slot = 0;
    for (const l of this.logs) {
      const on = t >= l.t && t < l.until;
      if (!on) { this._set('lg' + l.t, l.el, 'opacity', '0'); continue; }
      const a = MathX.smooth(t, l.t, l.t + 0.15) * (1 - MathX.smooth(t, l.until - 0.4, l.until));
      const chars = Math.floor((t - l.t) / 0.018);
      const shownTxt = l.text.slice(0, chars);
      if (l._shown !== shownTxt) { l.el.querySelector('.txt').textContent = shownTxt; l._shown = shownTxt; }
      this._set('lg' + l.t, l.el, 'opacity', a.toFixed(3));
      this._set('lgy' + l.t, l.el, 'transform', `translateY(${slot * 100}%)`);
      slot++;
    }

    // ---- annotations (projected from 3D)
    for (const a of this.anns) {
      const vis = MathX.window(t, a.from, a.to, 0.25, 0.3);
      if (vis <= 0.001) { this._set('an' + a.target, a.el, 'opacity', '0'); continue; }
      const p = resolveAnchor(a.target, t);
      if (!p) continue;
      this._v.copy(p).project(camera);
      const onScreen = this._v.z < 1 && Math.abs(this._v.x) < 1.15 && Math.abs(this._v.y) < 1.15;
      if (!onScreen) { this._set('an' + a.target, a.el, 'opacity', '0'); continue; }
      const x = (this._v.x * 0.5 + 0.5) * 100, y = (-this._v.y * 0.5 + 0.5) * 100;
      const dist = camera.position.distanceTo(p);
      const size = MathX.clamp(260 / dist, 1.2, 9); // box size in % of stage height
      a.el.style.left = x.toFixed(2) + '%';
      a.el.style.top = y.toFixed(2) + '%';
      a.el.style.setProperty('--s', size.toFixed(2));
      const flip = x > 58;
      a.el.classList.toggle('flip', flip);
      const pop = MathX.smooth(t, a.from, a.from + 0.25);
      this._set('an' + a.target, a.el, 'opacity', vis.toFixed(3));
      a.el.style.setProperty('--pop', (1.25 - pop * 0.25).toFixed(3));
    }
  }
}
