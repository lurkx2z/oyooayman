/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD.
     top left    YOUR HEIGHT · the value · what you are as tall as · NEXT (the next landmark and its size)
     top right   YOUR BEDROOM, TO YOU · the same 4 m at human scale · what it is as big as (from the dust on)
     top centre  the phone's notifications from Mum
     bottom      one caption at a time
     the honest label (illustration / false colour / theory) under the readout
   ===================================================================== */

class ShHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('sh-ro', '<div class="l">YOUR HEIGHT</div><div class="v"></div><div class="s"></div>' +
      '<div class="nx"><span class="nl">NEXT</span><span class="nn"></span><span class="nv"></span></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s');
    this.nx = this.ro.querySelector('.nx'); this.nxN = this.ro.querySelector('.nn'); this.nxV = this.ro.querySelector('.nv');
    this.room = mk('sh-room', '<div class="l">YOUR BEDROOM, TO YOU</div><div class="v"></div><div class="s"></div>');
    this.roomV = this.room.querySelector('.v'); this.roomS = this.room.querySelector('.s');
    this.tag = mk('sh-tag');
    this.cap = mk('sh-cap');
    this.caps = SH_CAPS.map(([t, text], i) => {
      const next = i + 1 < SH_CAPS.length ? SH_CAPS[i + 1][0] : t + 4;
      return { t, until: Math.min(t + 3.7, next - 0.45), text };
    });
    this.msg = mk('sh-msg', '<div class="ic"></div><div class="tx"><div class="hd"><b>MESSAGES</b><span>now</span></div><div class="who"></div><div class="body"></div></div>');
    this.msgWho = this.msg.querySelector('.who'); this.msgBody = this.msg.querySelector('.body');
    this._last = {};
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }

  update(t) {
    const W = StoryHUD.win, h = shH(t);
    // the readout: on from the start, gone for the last silence
    const ra = W(t, 0.5, SH.flash + 0.4, 0.8, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      this._txt('rov', this.roV, shFmt(h));
      const now = shNow(h), nx = shNext(h);
      let sub = 'AS TALL AS ' + now[1];
      if (h < 1.0e-19 * 0.98) sub = h > 1.7e-35 ? `A DECIMAL POINT AND ${shZeros(h)} ZEROS` : 'THE PLANCK LENGTH';
      if (now[0] === 1.0e-19 && h > 0.98e-19) sub = 'THE SMALLEST THING EVER MEASURED';
      this._txt('ros', this.roS, sub);
      this._set('nx', this.nx, 'opacity', nx && t < SH.planck ? '1' : '0');
      if (nx) { this._txt('nxn', this.nxN, nx[1]); this._txt('nxv', this.nxV, shFmt(nx[0])); }
    }
    // your bedroom, to you
    const rm = W(t, SH.roomCounter, SH.flash + 0.4, 0.8, 0.5);
    this._set('rm', this.room, 'opacity', rm.toFixed(3));
    if (rm > 0) { const R = shRoom(h); this._txt('rmv', this.roomV, R.v); this._txt('rms', this.roomS, R.what); }
    // the honest label
    const tg = SH_TAGS.find((g) => t >= g[0] && t < g[1]);
    this._set('tg', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.6, 0.4).toFixed(3) : '0');
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // the caption
    const c = this.caps.find((x) => t >= x.t - 0.01 && t < x.until);
    if (c) { this._txt('cap', this.cap, c.text); this._set('capa', this.cap, 'opacity', W(t, c.t, c.until, 0.25, 0.35).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    // Mum's notifications: slide down, hold, slide up
    const m = SH_MSGS.find((x) => t >= x[0] && t < x[0] + 4.2);
    if (m) {
      const a = W(t, m[0], m[0] + 4.2, 0.35, 0.45), y = (1 - MathX.smooth(t, m[0], m[0] + 0.35)) * -40 + MathX.smooth(t, m[0] + 3.75, m[0] + 4.2) * -40;
      this._set('ma', this.msg, 'opacity', a.toFixed(3));
      this._set('my', this.msg, 'transform', `translate(-50%, calc(var(--u) * ${y.toFixed(1)}))`);
      this._txt('mw', this.msgWho, m[1]); this._txt('mb', this.msgBody, m[2]);
    } else this._set('ma', this.msg, 'opacity', '0');
  }
}
