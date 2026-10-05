/* =====================================================================
   STORY HUD — the reusable cinematic overlay for any film.
   Everything is driven by SCRIPT.hud and is a pure function of time:

     title:    { in, out, html }                  a quiet serif title
     stack:    [{ t, until, lines: [[t, text]] }] short lines that appear one by one
     captions: [{ t, until, text }]               one narration line at a time
     readouts: [{ from, until, label, value, unit, sub, ctx }]
                                                  the top-left info block (value may be a function of t)
     endLine:  { t, until, text }                 the closing line

   Layout follows the shared style.css (TikTok / Shorts safe zones).
   ===================================================================== */

class StoryHUD {
  constructor(root, tl) {
    this.root = root;
    this.tl = tl;
    const H = SCRIPT.hud;
    const mk = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; root.appendChild(d); return d; };
    this.title = mk('story-title', `<div class="main">${(H.title && H.title.html) || ''}</div>`).firstChild;
    this.stack = mk('story-stack');
    this.stackLines = [];
    for (const S of H.stack || []) for (const [lt, text] of S.lines) {
      const d = document.createElement('div'); d.className = 'line'; d.textContent = text; d.style.opacity = '0';
      this.stack.appendChild(d); this.stackLines.push({ S, t: lt, el: d });
    }
    this.caption = mk('story-caption');
    this.readouts = (H.readouts || []).map((R, i) => {
      const d = mk('readout story-readout', `<div class="label"></div><div class="value"><span class="v"></span><span class="unit"></span></div><div class="sub"></div><div class="ctx"></div>`);
      d.style.top = `calc(var(--u) * ${R.top || 236 + i * 230})`;
      d.querySelector('.label').textContent = R.label || '';
      d.querySelector('.unit').textContent = R.unit || '';
      d.querySelector('.sub').textContent = R.sub || '';
      d.querySelector('.ctx').textContent = R.ctx || '';
      d.style.opacity = '0';
      return { R, el: d, v: d.querySelector('.v') };
    });
    this.endLine = mk('story-end');
    this._last = {};
  }

  _set(key, el, prop, val) {
    if (this._last[key] === val) return;
    this._last[key] = val;
    el.style[prop] = val;
  }

  // fade in over `fi`, out over `fo` inside [a, b]
  static win(t, a, b, fi = 0.45, fo = 0.45) { return MathX.smooth(t, a, a + fi) * (1 - MathX.smooth(t, b - fo, b)); }

  update(t) {
    const H = SCRIPT.hud, W = StoryHUD.win;
    if (H.title) {
      const a = W(t, H.title.in, H.title.out, 0.6, 0.45);
      this._set('title', this.title, 'opacity', a.toFixed(3));
      this._set('titley', this.title, 'transform', `translateY(${((1 - MathX.smooth(t, H.title.in, H.title.in + 0.6)) * 8).toFixed(1)}px)`);
    }
    this.stackLines.forEach((L, i) => this._set('st' + i, L.el, 'opacity', W(t, L.t, L.S.until, 0.3, 0.4).toFixed(3)));
    const cap = (H.captions || []).find((c) => t >= c.t && t < c.until);
    if (cap) {
      if (this._last.capText !== cap.text) { this.caption.innerHTML = cap.text; this._last.capText = cap.text; }
      this._set('cap', this.caption, 'opacity', W(t, cap.t, cap.until).toFixed(3));
    } else this._set('cap', this.caption, 'opacity', '0');
    this.readouts.forEach((r, i) => {
      const R = r.R;
      this._set('ro' + i, r.el, 'opacity', W(t, R.from, R.until, 0.6, 0.6).toFixed(3));
      const v = typeof R.value === 'function' ? R.value(t) : R.value;
      if (this._last['rv' + i] !== v) { r.v.textContent = v; this._last['rv' + i] = v; }
    });
    if (H.endLine) {
      const E = H.endLine;
      if (this._last.endText !== E.text) { this.endLine.innerHTML = E.text; this._last.endText = E.text; }
      this._set('end', this.endLine, 'opacity', W(t, E.t, E.until, 0.9, 0.6).toFixed(3));
    }
  }
}
