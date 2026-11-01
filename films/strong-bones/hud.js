/* =====================================================================
   HUD — captions that follow the narrator's words (numbers amber), the sister's lines (italic, her yellow dot),
   the title card, the record / final plates, the honest REAL tag, the forearm diagram, labels pinned to people.
   ===================================================================== */

// the narrator's captions: each clip split into sentence chunks (≤ 9 words), timed from the word stamps
const SB_CAPS = (() => {
  const out = [];
  const pretty = (s) => s.replace(/\bten times\b/gi, '<span class="n">10×</span>').replace(/\bthree hundred kilos\b/gi, '<span class="n">300 kilos</span>');
  for (const id of SBT.order) {
    const c = SBT.clips[id];
    if (id === 'title') continue;
    const chunks = []; let cur = [];
    c.words.forEach((w, i) => {
      cur.push(w);
      const end = /[.?!]["”]?$/.test(w.w) || /\.\.\.$/.test(w.w);
      if ((end && cur.length >= 2) || cur.length >= 9 || i === c.words.length - 1) { chunks.push(cur); cur = []; }
    });
    chunks.forEach((ch, k) => {
      const t0 = ch[0].s - 0.12, t1 = k + 1 < chunks.length ? chunks[k + 1][0].s - 0.12 : c.end + 0.35;
      out.push({ id, who: c.who, t0, t1, html: pretty(ch.map((w) => w.w).join(' ')), q: id === 'cta' });
    });
  }
  return out;
})();

class SbHud {
  constructor(root) {
    const mk = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; root.appendChild(d); return d; };
    this.band = mk('sb-band');
    this.cap = mk('sb-cap');
    this.title = mk('sb-title', '<span class="k">WHAT IF YOU WERE</span><span class="h">10× STRONGER</span><span class="k2">BUT YOUR BONES WEREN’T?</span>');
    this.ro = mk('sb-ro', '<div class="l"></div><div class="v"></div><div class="s"></div>');
    this.tag = mk('sb-tag', '<b>REAL</b>&nbsp; In a seizure or an electric shock, muscles can contract hard enough to break the body’s own bones.');
    this.lab = mk('sb-lab y', '<span class="d"></span><span class="t">YOUR SISTER</span>');
    this.inset = mk('sb-inset', `<svg viewBox="0 0 760 560">
      <rect x="0" y="0" width="760" height="560" rx="26" fill="rgba(6,8,12,0.62)"/>
      <text class="t" x="40" y="66">YOUR FOREARM</text>
      <g transform="translate(70,150)">
        <path d="M0,60 C60,0 520,10 600,50 C620,70 620,170 600,190 C520,230 60,240 0,180 Z" fill="#c99a7a" opacity="0.35"/>
        <path id="sbMus" d="M30,70 C120,30 470,35 580,70 L580,110 C470,90 120,90 30,110 Z" fill="#c2423c"/>
        <rect x="30" y="130" width="550" height="34" rx="17" fill="#f3eee2"/>
        <circle cx="30" cy="147" r="26" fill="#f3eee2"/><circle cx="580" cy="147" r="26" fill="#f3eee2"/>
        <path id="sbCrack" d="M300,128 L292,140 L306,149 L296,166" stroke="#e33" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
        <g id="sbArrows" opacity="0"><path d="M-20,90 L-90,90 M-70,74 L-92,90 L-70,106" stroke="#ffcf8a" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M630,90 L700,90 M680,74 L702,90 L680,106" stroke="#ffcf8a" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
      </g>
      <text class="big" id="sbMx" x="70" y="140" fill="#ffcf8a" opacity="0">MUSCLE ×10</text>
      <text class="big" id="sbBx" x="70" y="430" opacity="0">BONE ×1</text>
      <text class="s" id="sbBs" x="72" y="490" opacity="0">THE SAME BONE YOU HAD YESTERDAY</text>
    </svg>`);
    this.q = { mx: this.inset.querySelector('#sbMx'), bx: this.inset.querySelector('#sbBx'), bs: this.inset.querySelector('#sbBs'), ar: this.inset.querySelector('#sbArrows'), cr: this.inset.querySelector('#sbCrack'), mus: this.inset.querySelector('#sbMus') };
    this.sis = mk('sb-cap sis');
    this._last = {};
  }
  _o(key, el, v) { const s = v.toFixed(3); if (this._last[key] !== s) { this._last[key] = s; el.style.opacity = s; } }
  _h(key, el, html) { if (this._last['h' + key] !== html) { this._last['h' + key] = html; el.innerHTML = html; } }
  update(t, shot, set) {
    const W = (a, b, fi = 0.18, fo = 0.18) => sbSmooth(t, a, a + fi) * (1 - sbSmooth(t, b - fo, b));
    // narrator caption (and the question)
    let cap = null, capA = 0;
    for (const c of SB_CAPS) if (t >= c.t0 && t < c.t1 && c.who === 'n') { cap = c; capA = W(c.t0, c.t1, 0.12, 0.15); }
    if (cap) { this._h('cap', this.cap, cap.html); this.cap.classList.toggle('q', cap.q); }
    this._o('cap', this.cap, capA);
    // the sister
    let sc = null, sA = 0;
    for (const c of SB_CAPS) if (t >= c.t0 && t < c.t1 && c.who === 's') { sc = c; sA = W(c.t0, c.t1, 0.12, 0.15); }
    if (sc) this._h('sis', this.sis, '“' + sc.html + '”');
    this._o('sis', this.sis, sA);
    this._o('band', this.band, Math.max(capA, sA, 0) * 0.9);
    // the title
    this._o('title', this.title, W(sbS('title') - 0.15, sbS('rule') - 0.35, 0.35, 0.4));
    // plates
    let ro = null, roA = 0;
    if (shot.id === 'lift') { ro = ['CLEAN &amp; JERK', '570 <small>kg</small>', 'WORLD RECORD · 267 kg']; roA = W(SB.liftB - 0.3, shot.t1 + 0.2, 0.3, 0.2); }
    if (shot.id === 'final') { ro = ['OLYMPIC FINAL', 'LAST LIFT', 'FOR GOLD']; roA = W(shot.t0 + 0.3, SB.pan + 0.2, 0.3, 0.3); }
    if (ro) { this._h('ro', this.ro, `<div class="l">${ro[0]}</div><div class="v">${ro[1]}</div><div class="s">${ro[2]}</div>`); }
    this._o('ro', this.ro, roA);
    // the REAL tag (while the nuance line plays)
    this._o('tag', this.tag, W(sbWord('nuance', 'normal') - 0.1, sbE('nuance') + 0.3, 0.3, 0.3));
    // the forearm diagram: muscle ×10 with arrows pulling; bone ×1; a crack at "break"
    const inA = shot.id === 'arm' ? W(sbS('rule') - 0.1, shot.t1 + 0.1, 0.3, 0.2) : 0;
    this._o('inset', this.inset, inA);
    if (inA > 0) {
      const m = sbSmooth(t, sbWord('rule', 'ten') - 0.1, sbWord('rule', 'ten') + 0.3), b = sbSmooth(t, sbWord('rule', 'bones') - 0.1, sbWord('rule', 'bones') + 0.3);
      this.q.mx.setAttribute('opacity', m.toFixed(2)); this.q.ar.setAttribute('opacity', m.toFixed(2));
      this.q.ar.setAttribute('transform', `scale(${(1 + 0.05 * Math.sin(t * 9) * m).toFixed(3)},1)`);
      this.q.bx.setAttribute('opacity', b.toFixed(2)); this.q.bs.setAttribute('opacity', (b * 0.9).toFixed(2));
      const cr = sbSmooth(t, sbWord('nuance', 'break') - 0.05, sbWord('nuance', 'break') + 0.15);
      this.q.cr.setAttribute('opacity', cr.toFixed(2));
    }
    // the sister's label (her yellow dot): in the kitchen at her first line, and outside by the scaffold
    let lp = null, lA = 0;
    if (shot.id === 'sister') { lp = new THREE.Vector3(SB_K.sis[0], 1.78, SB_K.sis[2]); lA = W(shot.t0 + 0.2, sbE('sis1') + 0.4, 0.25, 0.3); }
    if (shot.id === 'final') { lp = new THREE.Vector3(SB_A.sis[0], 1.75, SB_A.sis[2]); lA = W(sbWord('scaffold', 'sister') - 0.15, shot.t1 + 0.1, 0.25, 0.1); }
    if (shot.id === 'look') { lp = new THREE.Vector3(SB_A.sis[0], 1.75, SB_A.sis[2]); lA = W(shot.t0, shot.t1 + 0.1, 0.15, 0.1); }
    if (lp && lA > 0) {
      const s = sbProject(set.camera, lp);
      if (s) { this.lab.style.left = (s.x * 100).toFixed(2) + '%'; this.lab.style.top = (s.y * 100 - 3).toFixed(2) + '%'; } else lA = 0;
    }
    this._o('lab', this.lab, lA);
  }
}
