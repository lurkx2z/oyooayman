/* =====================================================================
   HUD — restrained cinematic overlay on top of the WebGL canvas.
   One primary readout (atmospheric oxygen), a second counter only when it
   matters, a quiet title and one caption at a time. The world tells the rest.
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
      timer: root.querySelector('#timerReadout'),
      timerValue: root.querySelector('#timerValue'),
      title: root.querySelector('#title'),
      kicker: root.querySelector('#title .kicker'),
      main: root.querySelector('#title .main'),
      caption: root.querySelector('#caption'),
      ann: root.querySelector('#annotations'),
    };
    // optional floating labels (empty by default)
    this.anns = (SCRIPT.hud.annotations || []).map((a) => {
      const d = document.createElement('div');
      d.className = 'ann ' + (a.tone || '');
      d.innerHTML = `<div class="tag"><div class="t1"></div><div class="t2"></div></div>`;
      d.querySelector('.t1').textContent = a.title;
      d.querySelector('.t2').textContent = a.status;
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

    // ---- primary readout: atmospheric oxygen
    const o2 = SCRIPT_TRACKS.oxygen.value(t);
    const dropping = t >= tl.at('oxygen_drop') && t < tl.at('o2_zero') + 0.1;
    let shown = o2;
    if (dropping && o2 > 0.05) shown = Math.max(0, o2 + (hash1(Math.floor(t * 30)) - 0.5) * 0.5);
    const txt = shown.toFixed(1);
    if (this._last.o2txt !== txt) { this.el.o2Value.textContent = txt; this._last.o2txt = txt; }
    this._set('o2fill', this.el.o2Fill, 'transform', `scaleX(${(o2 / 21).toFixed(4)})`);
    this.el.o2.classList.toggle('alert', o2 < H.oxygenRedBelow && o2 > 0.05);
    this.el.o2.classList.toggle('zero', o2 <= 0.05);
    // the zero blinks twice, quietly
    const z = t - tl.at('o2_zero');
    const blink = z > 0 && z < 0.9 ? (Math.floor(z * 6) % 2 === 1 ? 0.4 : 0.88) : 0.88;
    this._set('o2op', this.el.o2, 'opacity', String(blink));

    // ---- title: small kicker, then the question
    const kIn = MathX.smooth(t, H.title.in, H.title.in + 0.35), mIn = MathX.smooth(t, H.title.in + 0.3, H.title.in + 0.8);
    const out = 1 - MathX.smooth(t, H.title.out - 0.4, H.title.out);
    this._set('kick', this.el.kicker, 'opacity', (kIn * out).toFixed(3));
    this._set('main', this.el.main, 'opacity', (mIn * out).toFixed(3));
    this._set('mainy', this.el.main, 'transform', `translateY(${((1 - mIn) * 10).toFixed(1)}px)`);

    // ---- secondary counter: time without oxygen (only once it matters)
    const tv = MathX.smooth(t, H.timerFrom, H.timerFrom + 0.6);
    this._set('timerop', this.el.timer, 'opacity', tv.toFixed(3));
    const secs = Math.max(0, t - tl.at('o2_zero'));
    const tt = `00:${String(Math.floor(secs)).padStart(2, '0')}`;
    if (this._last.tt !== tt) { this.el.timerValue.textContent = tt; this._last.tt = tt; }

    // ---- one caption at a time
    const cap = (H.captions || []).find((c) => t >= c.t && t < c.until);
    if (cap) {
      if (this._last.capText !== cap.text) { this.el.caption.textContent = cap.text; this._last.capText = cap.text; }
      const a = MathX.smooth(t, cap.t, cap.t + 0.45) * (1 - MathX.smooth(t, cap.until - 0.45, cap.until));
      this._set('capop', this.el.caption, 'opacity', a.toFixed(3));
    } else this._set('capop', this.el.caption, 'opacity', '0');

    // ---- optional floating labels
    for (const a of this.anns) {
      const vis = MathX.window(t, a.from, a.to, 0.25, 0.3);
      const p = vis > 0.001 ? resolveAnchor(a.target, t) : null;
      if (!p) { this._set('an' + a.target, a.el, 'opacity', '0'); continue; }
      this._v.copy(p).project(camera);
      if (this._v.z > 1 || Math.abs(this._v.x) > 1 || this._v.y > 0.42 || this._v.y < -0.6) { this._set('an' + a.target, a.el, 'opacity', '0'); continue; }
      a.el.style.left = ((this._v.x * 0.5 + 0.5) * 100).toFixed(2) + '%';
      a.el.style.top = ((-this._v.y * 0.5 + 0.5) * 100).toFixed(2) + '%';
      this._set('an' + a.target, a.el, 'opacity', vis.toFixed(3));
    }
  }
}
