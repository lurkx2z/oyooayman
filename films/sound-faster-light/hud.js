/* =====================================================================
   HUD — this film's overlay (DOM, in #hud; a pure function of time). The centred title is the shared StoryHUD. The
   layout is the long-form films' (Slower light, No light, Friction 10 s):
     top left     THE SPEED OF SOUND: 343 m/s, then 1,000,000 km/s (since 8:52:00 PM)
     top right    the day and the time; REAL SPEED, or "+25 s LATER" when the clock jumps at a cut (it only runs forward)
     under them   the scene's context box (the number this scene is about)
     bottom       one caption at a time (CAPTIONS.md via timing.js; numbers in amber)
     insets       the thunder in the air at 8:52; the race from 3 km; the 6 km bolt's rumble; your two ears; far sounds;
                  her phone's map; the way out
     bottom left  the honest labels (what is impossible, what is rough)
     in the scene labels the set pins to things (set.labels(t) → [{ p, text, sub, a }])
   ===================================================================== */

const sfN = (x) => Math.round(x).toLocaleString('en-US');
const sfKm = (m) => (m / 1000).toFixed(1);
const sfYouXZ = (s) => { const a = SFY.at(s); return [a.x, a.z]; };
const sfToKid = (s) => Math.max(0, sfDist(sfYouXZ(s), SF_PLACES.kid) - 0.3);
const sfToTornado = (s) => sfDist(sfYouXZ(s), SFN.at(s));
// the scene's context box: [from, to, label, value(t, s) → { v, v2 }] (HTML)
const SF_CTX = (() => {
  const beat = (id, l, f, k0 = 0, k1) => [sfC(id, k0) - 0.2, (k1 != null ? sfCap(id, k1).hide : sfE(id)) + 0.2, l, f];
  const k3 = SF_STRIKES.find((k) => k.key === 'flash3'), d3 = sfDist(sfYouXZ(k3.s), [k3.x, k3.z]);
  const barnD = sfDist(SF_PLACES.edge, [SF_F.barn.x - SF_F.barn.w / 2, SF_F.barn.z]), kidD = sfDist(SF_PLACES.edge, SF_PLACES.kid);
  const town = sfDist(SF_PLACES.edge, SF_F.town), rail = sfDist(SF_PLACES.edge, SF_F.rail);
  return [
    beat('flash', 'THE STRIKE', () => ({ v: `${sfKm(d3)} <small>km</small>`, v2: `ITS THUNDER USED TO TAKE ${(d3 / SFP.c0).toFixed(1)} s` }), 0, 1),
    beat('rumble', 'THE BOLT', () => ({ v: `${sfKm(SFP.longBolt.len)} <small>km long</small>`, v2: `NEAR END ${sfKm(SFP.longBolt.near)} km · FAR END ${sfKm(SFP.longBolt.far)} km` }), 0, 0),
    beat('call', 'YOUR VOICE TO THE BARN AND BACK', () => ({ v: `${Math.round(2 * barnD)} <small>m</small>`, v2: `USED TO TAKE ${(2 * barnD / SFP.c0).toFixed(2)} s · NOW 0.000 000 1 s` })),
    beat('answer', 'HER VOICE REACHES YOU IN', () => ({ v: '0.000 000 1 <small>s</small>', v2: `SHE’S ${Math.round(kidD)} m AWAY · WHICH WAY?` })),
    beat('far', 'EVERYTHING ARRIVES AT ONCE', () => ({ v: `${sfKm(rail)} <small>km</small>`, v2: `THE TRAIN’S HORN USED TO TAKE ${Math.round(rail / SFP.c0)} s` }), 0, 0),
    beat('siren', 'THE TOWN', () => ({ v: `${sfKm(town)} <small>km</small>`, v2: `ITS SIRENS USED TO TAKE ${Math.round(town / SFP.c0)} s TO REACH YOU` }), 0, 0),
    beat('tornado', 'THE TORNADO', (t, s) => ({ v: `${sfKm(sfToTornado(s))} <small>km</small>`, v2: 'WHICH WAY IS IT GOING? YOU CAN’T TELL' }), 1),
    beat('phone', 'HER PHONE', () => ({ v: `${Math.round(kidD)} <small>m west</small>`, v2: 'SHE SOUNDS RIGHT BESIDE YOU' }), 2),
    beat('corn', 'TO HER', (t, s) => ({ v: `${Math.round(sfToKid(s))} <small>m</small>`, v2: `THE TORNADO: ${sfKm(sfToTornado(s))} km` })),
    beat('strike', 'TO HER', (t, s) => ({ v: `${Math.round(sfToKid(s))} <small>m</small>`, v2: `THE TORNADO: ${sfKm(sfToTornado(s))} km` }), 1),
    beat('wind', 'THE WIND', () => ({ v: `${SFP.inflow} <small>km/h</small>`, v2: 'BLOWING WEST, INTO THE TORNADO' })),
    beat('neighbour', 'THE TORNADO', (t, s) => ({ v: `${sfKm(sfToTornado(s))} <small>km</small>`, v2: `TO HER: ${Math.round(sfToKid(s))} m` })),
    beat('found', 'TO HER', (t, s) => ({ v: `${Math.max(0, sfToKid(s)).toFixed(1)} <small>m</small>`, v2: `THE TORNADO: ${sfKm(sfToTornado(s))} km` })),
    beat('back', 'THE TORNADO', (t, s) => ({ v: `${sfKm(sfToTornado(s))} <small>km</small>`, v2: `THE STORM CELLAR: ${Math.round(sfDist(sfYouXZ(s), [SF_F.cellar.x, SF_F.cellar.z]))} m EAST` }), 1),
  ];
})();
// the speed box goes compact at the cut to the 6 km bolt; the tornado warning comes up at 8:52:18; she ran into the corn at 8:51:59
const SF_RO_COMPACT = sfFilmAt(SF_STRIKES.find((k) => k.key === 'long').s) - 0.6, SF_WARN = sfFilmAt(18), SF_KID_IN = -1;
// the honest labels (bottom left): [from, to, text]
const SF_TAGS = (() => { const b = (id, text, k0 = 0, k1) => [sfC(id, k0) - 0.1, (k1 != null ? sfCap(id, k1).hide : sfE(id)) + 0.2, text]; return [
  b('rule', 'IN REAL PHYSICS IT CAN’T HAPPEN: NOTHING CARRIES A SIGNAL FASTER THAN LIGHT', 0, 0),
  b('rule', 'THE RULE HERE: ONLY SOUND’S SPEED CHANGES · LOUDNESS AND HOW FAR IT CARRIES STAY', 1),
  b('flash', 'IT WINS BY 7 MILLIONTHS OF A SECOND: FAR TOO SHORT FOR ANYONE TO NOTICE', 2),
  b('ears', 'A BRAIN USES GAPS DOWN TO ABOUT 10 MILLIONTHS OF A SECOND', 1, 1),
  b('phone', 'A PHONE CALL STILL LAGS ABOUT 0.25 s: RADIO, A NETWORK, CODECS', 1, 1),
  b('phone', 'A PHONE’S LOCATION: GPS, GOOD TO A FEW METRES', 2, 2),
  b('tornado', 'A STRONG TORNADO: ABOUT 150 m WIDE, MOVING AT 60 km/h', 0, 1),
  b('wind', 'NEAR A TORNADO THE WIND RUSHES IN TOWARDS IT, FROM EVERY SIDE', 0, 0),
]; })();
// the insets: [from, to, which, where]
const SF_INSETS = (() => { const b = (id, k0, id1, k1, w, where = '') => [sfC(id, k0) - 0.25, sfCap(id1, k1).hide + 0.3, w, where]; return [
  b('start', 2, 'start', 2, 'rings'), b('flash', 2, 'flash', 2, 'race'), b('rumble', 1, 'rumble', 2, 'rumble'), b('ears', 0, 'ears', 2, 'ears'),
  b('far', 1, 'far', 2, 'far'), b('phone', 2, 'phone', 3, 'phone'), b('back', 0, 'back', 0, 'escape'),
]; })();

// a caption's text with its numbers in amber
function sfCapHtml(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/[−-]?\d+(?:[.,]\d+)*(?::\d+){0,2}(?:\s?°\s?C|°)?(?:\s(?:billion|million|thousandths|millionths|billionths|metres|metre|seconds|second|minutes|minute|times|km\/h|km\/s|km|cm|m\/s|m|degrees)\b)?(?:\s(?:km|AM|PM))?/g, (m) => `<span class="n">${m}</span>`);
}

class SfHud {
  constructor(root) {
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.ro = mk('sf-ro', '<div class="l">THE SPEED OF SOUND</div><div class="v"></div><div class="s"></div><div class="w"></div>');
    this.roV = this.ro.querySelector('.v'); this.roS = this.ro.querySelector('.s'); this.roW = this.ro.querySelector('.w');
    this.ctx = mk('sf-ctx', '<span class="l"></span><span class="v"></span><span class="v2"></span>');
    this.ctxL = this.ctx.querySelector('.l'); this.ctxV = this.ctx.querySelector('.v'); this.ctxV2 = this.ctx.querySelector('.v2');
    this.clock = mk('sf-clock', '<div class="l"></div><div class="v"></div><div class="f"></div><div class="k"></div>');
    this.clockL = this.clock.querySelector('.l'); this.clockV = this.clock.querySelector('.v'); this.clockF = this.clock.querySelector('.f'); this.clockK = this.clock.querySelector('.k');
    this.band = mk('sf-band'); this.cap = mk('sf-cap'); this.tag = mk('sf-tag');
    this.caps = SFT.groups.filter((g) => !g.title).flatMap((g) => g.caps.map((c) => ({ show: c.show, hide: c.hide, html: sfCapHtml(c.text), q: g.id === 'question' })));
    this.inset = mk('sf-inset');
    this.labels = []; this.root = root; this._last = {}; this._insetKey = null;
  }
  _set(k, el, prop, v) { if (this._last[k] === v) return; this._last[k] = v; el.style[prop] = v; }
  _txt(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.textContent = v; }
  _html(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.innerHTML = v; }
  _cls(k, el, v) { if (this._last[k] === v) return; this._last[k] = v; el.className = v; }

  update(t, shot, set, app) {
    const W = StoryHUD.win, s = set && set._s != null ? set._s : sfStoryAt(t);
    void app;
    // ---- the speed of sound
    const ra = W(t, SF.title[1] - 0.5, SF.end + 1, 0.4, 0.5);
    this._set('ro', this.ro, 'opacity', ra.toFixed(3));
    if (ra > 0) {
      const cp = t > SF_RO_COMPACT ? ' compact' : '', hit = s >= 0 && s < 1.2;
      this._html('rov', this.roV, s < 0 ? '343 <small>m/s</small>' : '1,000,000 <small>km/s</small>');
      this._html('ros', this.roS, s < 0 ? '' : cp ? `${SFP.timesLight.toFixed(1)} × LIGHT` : `${SFP.timesLight.toFixed(1)} × LIGHT · SINCE <b>8:52:00 PM</b>`);
      this._cls('roc', this.ro, 'sf-ro' + (s >= 0 ? ' on' : '') + (hit ? ' hit' : '') + cp);
      // the county's tornado warning, from 8:52:18 to the end (it blinks in)
      const wa = t >= SF_WARN ? 0.55 + 0.45 * Math.cos(Math.min(t - SF_WARN, 2.4) * Math.PI * 2.5) : 0;
      this._html('row', this.roW, t >= SF_WARN ? 'TORNADO WARNING · UNTIL 9:30 PM' : '');
      this._set('rowa', this.roW, 'opacity', (t - SF_WARN < 2.4 ? wa : 1).toFixed(2));
      this._cls('cxc', this.ctx, 'sf-ctx' + cp);
    }
    // ---- the context box
    const inA = (() => { const w = SF_INSETS.find((x) => t >= x[0] - 0.3 && t < x[1] + 0.3); return w ? W(t, w[0] - 0.3, w[1] + 0.3, 0.4, 0.4) : 0; })();
    const cx = SF_CTX.find((x) => t >= x[0] && t < x[1]);
    this._set('cx', this.ctx, 'opacity', cx ? (W(t, cx[0], cx[1], 0.4, 0.4) * (1 - inA)).toFixed(3) : '0');
    if (cx) { const r = cx[3](t, s, set); this._txt('cxl', this.ctxL, cx[2]); this._html('cxv', this.ctxV, r.v); this._html('cxv2', this.ctxV2, r.v2 || ''); }
    // ---- the honest label
    const tg = SF_TAGS.find((x) => t >= x[0] && t < x[1]);
    if (tg) this._txt('tgt', this.tag, tg[2]);
    // ---- the day and the time; a jump
    const ca = W(t, SF.title[1] - 0.5, SF.end + 1, 0.4, 0.5);
    this._set('ck', this.clock, 'opacity', ca.toFixed(3));
    if (ca > 0) {
      const c = sfClockParts(s);
      this._txt('ckl', this.clockL, c.day);
      this._html('ckv', this.clockV, `${c.h}:${String(c.m).padStart(2, '0')}<small>:${String(c.sec).padStart(2, '0')}</small> <i>${c.pm ? 'PM' : 'AM'}</i>`);
      const j = SF_JUMPS.filter((x) => t >= x.t && t < x.t + 3.5).pop();
      this._cls('ckj', this.clockF, j ? 'f jump' : 'f');
      this._txt('ckf', this.clockF, j ? `+${Math.round(j.ds)} s LATER` : 'REAL SPEED');
      // how long she has been in the corn (the story never lets go of her)
      const g = Math.max(0, Math.floor(s - SF_KID_IN));
      this._html('ckk', this.clockK, s < 0 ? '' : s < SFE.found ? `MAISIE IN THE CORN <b>${Math.floor(g / 60)}:${String(g % 60).padStart(2, '0')}</b>` : 'MAISIE · WITH YOU');
    }
    // ---- the caption (on a soft band along the bottom, there for the whole beat)
    const gb = SFT.groups.find((g) => !g.title && t >= g.first - 0.6 && t < g.end + 0.6);
    this._set('band', this.band, 'opacity', gb ? W(t, gb.first - 0.3, gb.end + 0.3, 0.5, 0.6).toFixed(3) : '0');
    const cp = this.caps.find((x) => t >= x.show - 0.01 && t < x.hide);
    if (cp) { this._html('cap', this.cap, cp.html); this._cls('capq', this.cap, cp.q ? 'sf-cap q' : 'sf-cap'); this._set('capa', this.cap, 'opacity', W(t, cp.show, cp.hide, 0.22, 0.3).toFixed(3)); }
    else this._set('capa', this.cap, 'opacity', '0');
    const two = cp && this.root.clientHeight ? this.cap.offsetHeight / this.root.clientHeight > 0.095 : false;
    this._set('tga', this.tag, 'opacity', tg ? W(t, tg[0], tg[1], 0.4, 0.4).toFixed(3) : '0');
    // ---- the diagrams
    this._insets(t, s, set);
    this._inRect = null;
    if (Number(this.inset.style.opacity) > 0.02) { const r = this.inset.getBoundingClientRect(), o = this.root.getBoundingClientRect(); this._inRect = { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top }; }
    // ---- labels pinned in the scene (measure first, then place)
    const L = set && set.labels ? set.labels(t) || [] : [];
    while (this.labels.length < L.length) { const d = document.createElement('div'); d.className = 'sf-lab'; this.root.appendChild(d); this.labels.push(d); }
    const cam = set ? set.camera : null, _p = SfHud._p || (SfHud._p = new THREE.Vector3());
    this.labels.forEach((d, i) => {
      const l = L[i];
      if (!l || !cam || !(l.a > 0)) { d.style.opacity = '0'; return; }
      const tx = `<span class="t">${l.text}${l.sub ? `<small>${l.sub}</small>` : ''}</span>`;
      _p.set(l.p[0], l.p[1], l.p[2]).project(cam);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
      const lx = MathX.clamp((_p.x * 0.5 + 0.5) * 100, 3, 97), ly = (-_p.y * 0.5 + 0.5) * 100;
      if (d._tx !== tx) { d._tx = tx; d.className = 'sf-lab'; d.innerHTML = '<span class="d"></span>' + tx; d._w = d.offsetWidth; }
      let right = l.side ? l.side === 'r' : lx > 62;
      const wPct = this.root.clientWidth ? 100 * (d._w || 0) / this.root.clientWidth : 0;
      if (right && lx - wPct < 1.5) right = false; else if (!right && lx + wPct > 98.5) right = true;
      const ty = Math.min(74, Math.max(ly, 24));
      d.style.left = lx.toFixed(2) + '%'; d.style.top = ty.toFixed(2) + '%';
      let op = vis ? (l.a ?? 1) : 0;
      if (vis && this._inRect) { const R = this._inRect, W0 = this.root.clientWidth, H0 = this.root.clientHeight, px = lx / 100 * W0, py = ty / 100 * H0, w = d._w || 0, x0 = right ? px - w : px, x1 = right ? px : px + w;
        if (x1 > R.l - 12 && x0 < R.r + 12 && py + 30 > R.t - 12 && py - 30 < R.b + 12) op = 0; }
      d.style.opacity = String(op);
      const hh = right ? tx + '<span class="d"></span>' : '<span class="d"></span>' + tx, cl = right ? 'sf-lab r' : 'sf-lab';
      if (d._h !== hh) { d._h = hh; d.innerHTML = hh; }
      if (d.className !== cl) d.className = cl;
    });
  }

  _insets(t, s, set) {
    const W = StoryHUD.win, which = SF_INSETS.find((x) => t >= x[0] && t < x[1]), a = which ? W(t, which[0], which[1], 0.45, 0.4) : 0;
    this._set('ina', this.inset, 'opacity', a.toFixed(3));
    this._cls('inb', this.inset, !which ? 'sf-inset' : ('sf-inset ' + which[3]).trim());
    if (!which) return;
    const u = t - which[0], key = which[2] + '|' + Math.round(u * 15) + '|' + Math.round(s * 20);
    if (key === this._insetKey) return;
    this._insetKey = key;
    this.inset.innerHTML = SfHud[which[2]](u, t, s, set);
  }
  static svg(body, w = 760, h = 470) { return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="sfAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke"/></marker></defs>${body}</svg>`; }
  static plate(a = 0.86, w = 760, h = 470) { return `<rect x="0" y="0" width="${w}" height="${h}" rx="22" fill="rgba(6,9,14,${a})"/>`; }
  static tx(x, y, cls, text, maxW = 700, extra = '') {
    const K = { t: [32, 0.78], s: [28, 0.76], b: [31, 0.64], sm: [25, 0.69], big: [44, 0.62] }[cls] || [28, 0.7], est = text.replace(/<[^>]+>/g, '').length * K[0] * K[1];
    const fs = est > maxW ? ` style="font-size:${(K[0] * maxW / est).toFixed(1)}px"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${fs} ${extra}>${text}</text>`;
  }
  static you(x, y, lab = 'YOU') { return `<circle cx="${x}" cy="${y}" r="9" fill="#ffcf8a"/>${SfHud.tx(x + 16, y + 9, 'sm', lab, 200)}`; }
  // 8:52:00: the thunder of nine strikes still on its way (rings at 343 m/s); then every one of them at you at once
  static rings(u) {
    const T = SfHud.tx, cx = 380, cy = 270, sc = 190 / 16500, k1 = MathX.smooth(u, 0.2, 2.6), snap = MathX.smooth(u, 2.7, 3.2), tau = -3.5 + 3.5 * k1;
    let g = '';
    for (const k of SF_STRIKES.filter((q) => q.s < 0 && q.inAir)) {
      const x = cx + k.x * sc, y = cy + k.z * sc, r = Math.min(k.d, SFP.c0 * Math.max(0, tau - k.s)) * sc;
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#d8dcff"/>`;
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="#9fb0ff" stroke-width="2.5" opacity="${(0.85 * (1 - snap)).toFixed(2)}"/>`;
      g += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${cx}" y2="${cy}" stroke="#ffcf8a" stroke-width="3" opacity="${snap.toFixed(2)}" marker-end="url(#sfAh)"/>`;
    }
    const c = MathX.smooth(u, 3.0, 3.4);
    return SfHud.svg(`${SfHud.plate()}${T(30, 56, 't', 'THUNDER STILL ON ITS WAY AT 8:52:00')}
      ${[5, 10, 15].map((km) => `<circle cx="${cx}" cy="${cy}" r="${km * 1000 * sc}" fill="none" stroke="#56606e" stroke-width="1.5" stroke-dasharray="5 6"/>${T(cx + km * 1000 * sc * 0.71 + 4, cy - km * 1000 * sc * 0.71, 'sm', km + ' km', 90)}`).join('')}
      ${g}${SfHud.you(cx, cy)}
      <g opacity="${c.toFixed(2)}">${T(30, 440, 'b', `ALL ${SFP.inAir} ARRIVE AT ONCE`, 700)}</g>`);
  }
  // from 3 km: before, the light wins by 8.7 s; now, the sound wins by 7 millionths of a second
  static race(u) {
    const T = SfHud.tx, X0 = 60, X1 = 640, a = MathX.smooth(u, 0.2, 0.8), b = MathX.smooth(u, 2.0, 2.6), d = 3000;
    const p0 = MathX.smooth(u, 0.4, 3.0), p1 = MathX.smooth(u, 2.6, 2.9);
    const row = (y, lab, light, sound, sub, op) => `<g opacity="${op.toFixed(2)}">${T(X0, y - 40, 's', lab, 600)}<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="#7a8492" stroke-width="3"/>
      <circle cx="${X0}" cy="${y}" r="10" fill="#d8dcff"/><rect x="${X1 - 8}" y="${y - 16}" width="16" height="32" rx="4" fill="#ffcf8a"/>
      <circle cx="${X0 + (X1 - X0) * light}" cy="${y - 14}" r="9" fill="#ffffff"/>${T(X0 + (X1 - X0) * light - 40, y - 26, 'sm', 'LIGHT', 120)}
      <circle cx="${X0 + (X1 - X0) * sound}" cy="${y + 14}" r="9" fill="#ff9a5a"/>${T(X0 + (X1 - X0) * sound - 40, y + 50, 'sm', 'SOUND', 120)}${T(X0, y + 88, 'sm', sub, 640)}</g>`;
    return SfHud.svg(`${SfHud.plate()}${T(30, 56, 't', `FROM ${d / 1000} km: THE STRIKE TO YOU`)}
      ${row(150, 'BEFORE 8:52', MathX.smooth(u, 0.2, 0.35), p0 * 0.34, `LIGHT 0.000 01 s · SOUND ${(d / SFP.c0).toFixed(1)} s`, a)}
      ${row(330, 'NOW', p1, Math.min(1, p1 * 1.04), 'SOUND 0.000 003 s · LIGHT 0.000 010 s', b)}`);
  }
  // the 6 km bolt: its far end is 4.5 km further away than its near end; the rumble that used to last 13 s
  static rumble(u) {
    const T = SfHud.tx, LB = SFP.longBolt, a = MathX.smooth(u, 0.2, 0.9), b = MathX.smooth(u, 2.0, 3.0), c = MathX.smooth(u, 6.0, 6.8);
    const X0 = 70, X1 = 690, t0 = LB.near / SFP.c0, t1 = LB.far / SFP.c0, sx = (tt) => X0 + (X1 - X0) * tt / 26;
    let wav = ''; for (let i = 0; i <= 160; i++) { const tt = t0 + (t1 - t0) * i / 160, amp = 46 * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.9) * Math.sin(i * 0.23))) * (1 - 0.6 * i / 160); wav += `<line x1="${sx(tt).toFixed(1)}" y1="${(250 - amp).toFixed(1)}" x2="${sx(tt).toFixed(1)}" y2="${(250 + amp).toFixed(1)}" stroke="#ff9a5a" stroke-width="2"/>`; }
    const ticks = [0, 5, 10, 15, 20, 25].map((v) => `<line x1="${sx(v)}" y1="310" x2="${sx(v)}" y2="320" stroke="#9aa" stroke-width="2"/>${T(sx(v) - 12, 350, 'sm', v + ' s', 80)}`).join('');
    return SfHud.svg(`${SfHud.plate()}${T(30, 56, 't', 'THE BOLT’S THUNDER, AS YOU HEAR IT')}
      <g opacity="${a.toFixed(2)}"><line x1="${X0}" y1="310" x2="${X1}" y2="310" stroke="#9aa" stroke-width="2"/>${ticks}${T(30, 110, 's', `NEAR END ${sfKm(LB.near)} km · FAR END ${sfKm(LB.far)} km`, 700)}</g>
      <g opacity="${(b * (1 - c)).toFixed(2)}">${wav}${T(sx(t0), 170, 'b', `BEFORE: ${Math.round(t1 - t0)} s OF RUMBLE`, 520)}</g>
      <g opacity="${c.toFixed(2)}"><line x1="${sx(0)}" y1="150" x2="${sx(0)}" y2="310" stroke="#ffcf8a" stroke-width="10"/>${T(sx(0) + 24, 220, 'b', 'NOW: ALL OF IT, AT ONCE', 520)}</g>`);
  }
  // your two ears: the gap that tells you where a sound is; the gap now; her voice's waves, longer than a country
  static ears(u) {
    const T = SfHud.tx, cx = 230, cy = 270, R = 95, ph1 = u < 6.5, ph3 = u > 11.7;
    const wave = MathX.smooth(u, 0.6, 3.2), a2 = MathX.smooth(u, 6.6, 7.2), a3 = MathX.smooth(u, 11.8, 12.5);
    const head = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#2a3240" stroke="#c8ccd2" stroke-width="3"/><path d="M${cx - 16} ${cy - R + 2} L${cx} ${cy - R - 26} L${cx + 16} ${cy - R + 2}" fill="#2a3240" stroke="#c8ccd2" stroke-width="3"/>
      <ellipse cx="${cx - R - 6}" cy="${cy}" rx="12" ry="26" fill="#c8ccd2"/><ellipse cx="${cx + R + 6}" cy="${cy}" rx="12" ry="26" fill="#c8ccd2"/>${T(cx - 40, cy + 8, 'sm', 'YOU', 100)}`;
    if (ph3) {
      let sine = ''; for (let i = 0; i <= 200; i++) { const x = 40 + 680 * i / 200, y = 330 + 70 * Math.sin(i / 200 * Math.PI * 2); sine += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
      return SfHud.svg(`${SfHud.plate()}${T(30, 56, 't', 'ONE WAVE OF HER VOICE (300 Hz)')}
        <g opacity="${a3.toFixed(2)}">${T(30, 130, 's', `BEFORE: ${(SFP.c0 / SFP.voiceF).toFixed(1)} m · ABOUT YOUR HEIGHT`, 700)}${T(30, 180, 'b', `NOW: ${sfN(SFP.voiceLambda / 1000)} km · IOWA TO CALIFORNIA`, 700)}
        <path d="${sine}" fill="none" stroke="#ff9a5a" stroke-width="5"/><circle cx="380" cy="330" r="3" fill="#ffcf8a"/>${T(392, 316, 'sm', 'YOUR HEAD (TO SCALE: SMALLER THAN THIS DOT)', 330)}</g>`);
    }
    const src = [cx - R - 250, cy], wx = src[0] + (cx + R + 30 - src[0]) * wave;
    const lines = [0, 1, 2].map((i) => { const x = wx - i * 34; return x > src[0] ? `<line x1="${x}" y1="${cy - 150}" x2="${x}" y2="${cy + 150}" stroke="#ff9a5a" stroke-width="${4 - i}" opacity="${(0.9 - 0.25 * i).toFixed(2)}"/>` : ''; }).join('');
    return SfHud.svg(`${SfHud.plate()}${T(30, 56, 't', 'HOW YOU HEAR WHERE A SOUND IS')}
      <defs><clipPath id="sfClip"><rect x="0" y="80" width="760" height="380"/></clipPath></defs>
      <g clip-path="url(#sfClip)">${ph1 ? lines : `<line x1="${cx - R - 30}" y1="${cy - 150}" x2="${cx - R - 30}" y2="${cy + 150}" stroke="#ff9a5a" stroke-width="4" opacity="0.4"/><line x1="${cx + R + 30}" y1="${cy - 150}" x2="${cx + R + 30}" y2="${cy + 150}" stroke="#ff9a5a" stroke-width="4" opacity="0.4"/>`}</g>
      ${head}
      <g opacity="${ph1 ? MathX.smooth(u, 2.4, 3.0).toFixed(2) : 0}">${T(420, 200, 's', 'LEFT EAR, THEN RIGHT', 320)}${T(420, 250, 'b', `${(SFP.itd0 * 1000).toFixed(2)} thousandths`, 320)}${T(420, 290, 'sm', 'OF A SECOND LATER', 320)}${T(420, 350, 'sm', 'YOUR BRAIN READS THE GAP', 320)}</g>
      <g opacity="${ph1 ? 0 : a2.toFixed(2)}">${T(420, 200, 's', 'NOW THE GAP IS', 320)}${T(420, 250, 'b', `${(SFP.itd1 * 1e9).toFixed(1)} billionths`, 320)}${T(420, 300, 'sm', `${sfN(Math.round(SFP.itdTimes / 1000) * 1000)} × TOO SHORT`, 320)}${T(420, 350, 'sm', 'BOTH EARS AT ONCE', 320)}</g>`);
  }
  // far sounds: each used to come late by its distance; now all of them at once
  static far(u) {
    const T = SfHud.tx, cx = 380, cy = 255, sc = 165 / 11500, P = sfYouXZ(SFE.dogs);
    const pts = [['THE HANSENS’ DOGS', SF_PLACES.hansen], ['THE TOWN', SF_F.town], ['THE TRAIN', SF_F.rail]];
    let g = '';
    pts.forEach(([lab, q], i) => { const a = MathX.smooth(u, 0.3 + 0.6 * i, 0.9 + 0.6 * i), dx = q[0] - P[0], dz = q[1] - P[1], d = Math.hypot(dx, dz), L = Math.max(d * sc, 34), x = cx + dx / d * L, y = cy + dz / d * L;
      const tx2 = x + (dx > 0 ? -250 : 16), ty = y + (dz > 0 ? 34 : -16);
      g += `<g opacity="${a.toFixed(2)}"><line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#ffcf8a" stroke-width="2.5" stroke-dasharray="6 5"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="#d8dcff"/>
        ${T(tx2.toFixed(1), ty.toFixed(1), 'sm', `${lab} · ${sfKm(d)} km`, 260)}${T(tx2.toFixed(1), (ty + 28).toFixed(1), 'sm', `USED TO: ${Math.round(d / SFP.c0)} s · NOW: 0`, 260)}</g>`; });
    return SfHud.svg(`${SfHud.plate()}${T(30, 56, 't', 'WHAT YOU HEAR, AND HOW LATE')}
      ${[5, 10].map((km) => `<circle cx="${cx}" cy="${cy}" r="${km * 1000 * sc}" fill="none" stroke="#56606e" stroke-width="1.5" stroke-dasharray="5 6"/>`).join('')}${g}${SfHud.you(cx, cy)}`);
  }
  // her phone's map: you, her (120 m west), the tornado further west
  static phone(u, t, s) {
    const T = SfHud.tx, a = MathX.smooth(u, 0.2, 0.8), b = MathX.smooth(u, 3.5, 4.2), P = sfYouXZ(s), K = SF_PLACES.kid, N = SFN.at(s);
    const ox = 470, oy = 250, sc = 0.9, map = (q) => [ox + (q[0] - P[0]) * sc, oy + (q[1] - P[1]) * sc];
    const k = map(K), nd = sfDist(P, N), nu = [(N[0] - P[0]) / nd, (N[1] - P[1]) / nd];
    return SfHud.svg(`<rect x="200" y="12" width="360" height="446" rx="40" fill="#0b0e13" stroke="#3a414c" stroke-width="4"/><rect x="216" y="40" width="328" height="400" rx="16" fill="#1f2a1c"/>
      <g opacity="${a.toFixed(2)}">${[...Array(9)].map((_, i) => `<line x1="216" y1="${48 + i * 44}" x2="544" y2="${48 + i * 44}" stroke="#2c3a28" stroke-width="2"/>`).join('')}
      ${T(232, 80, 'sm', 'LOCATION · MAISIE’S PHONE', 300)}
      <circle cx="${ox}" cy="${oy}" r="11" fill="#3a8aff" stroke="#fff" stroke-width="3"/>${T(ox - 20, oy + 40, 'sm', 'YOU', 100)}
      <line x1="${ox}" y1="${oy}" x2="${k[0].toFixed(1)}" y2="${k[1].toFixed(1)}" stroke="#ffcf8a" stroke-width="3" stroke-dasharray="6 5"/>
      <circle cx="${k[0].toFixed(1)}" cy="${k[1].toFixed(1)}" r="13" fill="#f2c22a" stroke="#fff" stroke-width="3"/>${T(k[0] - 30, k[1] - 22, 's', `${Math.round(sfDist(P, K))} m`, 200)}</g>
      <g opacity="${b.toFixed(2)}"><line x1="${k[0] - 20}" y1="${k[1] + 60}" x2="226" y2="${(k[1] + 60 + nu[1] * 30).toFixed(1)}" stroke="#ff6a4a" stroke-width="4" marker-end="url(#sfAh)"/>${T(232, k[1] + 110, 'sm', `TORNADO ${sfKm(nd)} km`, 300)}</g>`);
  }
  // the way out: the cellar 130 m east; the tornado less than a kilometre west; which way is it going?
  static escape(u, t, s) {
    const T = SfHud.tx, a = MathX.smooth(u, 0.2, 0.8), b = MathX.smooth(u, 1.6, 2.2), c = MathX.smooth(u, 3.0, 3.6), P = sfYouXZ(s), N = SFN.at(s), C = [SF_F.cellar.x, SF_F.cellar.z];
    const sc = 0.22, ox = 540, oy = 250, map = (q) => [ox + (q[0] - P[0]) * sc, oy + (q[1] - P[1]) * sc];
    const c2 = map(C), n2 = map(N), nd = sfDist(P, N), q = '?';
    return SfHud.svg(`${SfHud.plate()}${T(30, 56, 't', 'WHERE YOU ARE')}
      <g opacity="${a.toFixed(2)}"><rect x="${(c2[0] - 10).toFixed(1)}" y="${(c2[1] - 10).toFixed(1)}" width="20" height="20" fill="#d8dcff"/>${T(c2[0] - 90, c2[1] + 44, 'sm', `THE CELLAR · ${Math.round(sfDist(P, C))} m`, 230)}
        <line x1="${ox}" y1="${oy}" x2="${c2[0].toFixed(1)}" y2="${c2[1].toFixed(1)}" stroke="#d8dcff" stroke-width="2.5" stroke-dasharray="6 5"/>${SfHud.you(ox, oy, 'YOU + HER')}</g>
      <g opacity="${b.toFixed(2)}"><circle cx="${n2[0].toFixed(1)}" cy="${n2[1].toFixed(1)}" r="${(SFN.r(s) * sc).toFixed(1)}" fill="#4a3a32" stroke="#ff6a4a" stroke-width="3"/>${T(n2[0] - 20, n2[1] + 80, 'sm', `${sfKm(nd)} km`, 200)}</g>
      <g opacity="${c.toFixed(2)}">${[0, 1, 2, 3].map((i) => { const ang = i * Math.PI / 2 + 0.4; return `<line x1="${n2[0]}" y1="${n2[1]}" x2="${(n2[0] + Math.cos(ang) * 70).toFixed(1)}" y2="${(n2[1] + Math.sin(ang) * 70).toFixed(1)}" stroke="#ff6a4a" stroke-width="3" marker-end="url(#sfAh)" opacity="0.8"/>`; }).join('')}
        ${T(n2[0] - 14, n2[1] - 70, 'big', q, 80)}${T(30, 440, 'b', 'WHICH WAY IS IT GOING?', 700)}</g>
      <g opacity="${b.toFixed(2)}">${T(30, 104, 'sm', `THE CELLAR: ${Math.round(sfDist(P, C) / SFP.carryV)} s, CARRYING HER`, 700)}${T(30, 140, 'sm', `THE TORNADO: ${Math.round(nd / SFP.tornadoV)} s, IF IT’S COMING AT YOU`, 700)}</g>`);
  }
}
