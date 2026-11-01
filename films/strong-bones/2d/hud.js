/* =====================================================================
   HUD (2D) — drawn on the canvas: the narrator's captions (timed to his words, numbers amber), the sister's lines
   (italic, with her yellow dot), the title card, a REAL tag, the sister's label, the closing question.
   ===================================================================== */

const CAPS = (() => {
  const out = [];
  for (const id of SBT.order) {
    const c = SBT.clips[id]; if (id === 'title') continue;
    const chunks = []; let cur = [];
    c.words.forEach((w, i) => { cur.push(w); const end = /[.?!]["”]?$/.test(w.w); if ((end && cur.length >= 2) || cur.length >= 12 || i === c.words.length - 1) { chunks.push(cur); cur = []; } });
    chunks.forEach((ch, k) => {
      const t0 = ch[0].s - 0.1, t1 = k + 1 < chunks.length ? chunks[k + 1][0].s - 0.1 : c.end + 0.3;
      let s = ch.map((w) => w.w).join(' ').replace(/^\.\.\./, '').replace(/^"|"$/g, '');
      s = s.replace(/\bten times\b/gi, '10×').replace(/\bthree hundred kilos\b/gi, '300 kilos');
      out.push({ id, who: c.who, t0, t1, s, q: id === 'cta' });
    });
  }
  return out;
})();

// a caption line with amber highlights on numbers
function capLine(g, s, x, y, size, col, italic, a) {
  g.font = `${italic ? 'italic ' : ''}600 ${size}px ${SERIF}`; g.textBaseline = 'alphabetic';
  const full = g.measureText(s).width; if (full > W - 200) { size = Math.floor(size * (W - 200) / full); g.font = `${italic ? 'italic ' : ''}600 ${size}px ${SERIF}`; }
  const parts = s.split(/(10×|300 kilos)/), widths = parts.map((p) => g.measureText(p).width), tw = widths.reduce((a, b) => a + b, 0);
  let cx = x - tw / 2; g.globalAlpha = a; shadowOn(g, 18, 'rgba(0,0,0,0.85)', 2);
  parts.forEach((p, i) => { g.fillStyle = /10×|300 kilos/.test(p) ? PAL.amber : col; g.textAlign = 'left'; g.fillText(p, cx, y); cx += widths[i]; });
  shadowOff(g); g.globalAlpha = 1; return tw;
}

FILM2.hud = function (g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const Wn = (a, b, fi = 0.12, fo = 0.15) => sm(t, a, a + fi) * (1 - sm(t, b - fo, b));
  const sh = FILM2._shot;
  // the bottom band (under any caption)
  let any = 0; for (const c of CAPS) if (t >= c.t0 && t < c.t1) any = Math.max(any, Wn(c.t0, c.t1));
  if (any > 0) { g.globalAlpha = any * 0.85; vgrad(g, 0, H - 300, W, 300, [[0, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0.5)']]); g.globalAlpha = 1; }
  for (const c of CAPS) {
    if (t < c.t0 || t >= c.t1) continue;
    const a = Wn(c.t0, c.t1);
    if (c.q) { capLine(g, c.s, W / 2, H - 140, 96, PAL.cream, false, a); continue; }
    if (c.who === 's') {
      const tw = capLine(g, '“' + c.s + '”', W / 2 + 22, H - 92, 58, '#ffe08a', true, a);
      g.globalAlpha = a; g.fillStyle = PAL.sis; g.beginPath(); g.arc(W / 2 - tw / 2 - 10, H - 111, 13, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    } else capLine(g, c.s, W / 2, H - 92, 58, PAL.cream, false, a);
  }
  // the title card (after the hook)
  const ta = Wn(S('title') - 0.15, S('rule') - 0.35, 0.35, 0.4);
  if (ta > 0) {
    g.globalAlpha = ta * 0.75; const gr = g.createRadialGradient(W / 2, 400, 40, W / 2, 400, 760); gr.addColorStop(0, 'rgba(2,3,6,0.7)'); gr.addColorStop(1, 'rgba(2,3,6,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    shadowOn(g, 40, 'rgba(0,0,0,0.85)', 3);
    txt(g, 'WHAT IF YOU WERE', W / 2, 270, `600 56px ${SERIF}`, PAL.cream, 'center', ta);
    txt(g, '10× STRONGER', W / 2, 410, `700 140px ${SERIF}`, '#ffffff', 'center', ta);
    txt(g, 'BUT YOUR BONES WEREN’T?', W / 2, 500, `600 64px ${SERIF}`, PAL.amber, 'center', ta);
    shadowOff(g);
  }
  // REAL tag (top left) while the nuance plays
  const ra = Wn(Wd('nuance', 'normal') - 0.1, E('nuance') + 0.3, 0.3, 0.3);
  if (ra > 0) {
    g.globalAlpha = ra; g.fillStyle = 'rgba(6,8,12,0.62)'; rr(g, 52, 44, 760, 120, 12); g.fill();
    txt(g, 'REAL', 76, 92, `700 26px ${SANS}`, PAL.amber, 'left', ra);
    txt(g, 'In a seizure or an electric shock, muscles can', 76, 92 + 0, `600 26px ${SANS}`, '#e9e2d4', 'left', 0);
    g.font = `600 26px ${SANS}`; g.fillStyle = '#e9e2d4'; g.textAlign = 'left';
    g.fillText('In a seizure or an electric shock, muscles can', 160, 92); g.fillText('contract hard enough to break the body’s own bones.', 76, 136);
    g.globalAlpha = 1;
  }
  // the sister's label: when she's first in danger
  if (sh && sh.id === 'sister') {
    const la = Wn(Wd('scaffold', 'sister') - 0.15, sh.t1 + 0.1, 0.2, 0.1);
    if (la > 0) { const x = 1050, y = 380; g.globalAlpha = la; g.strokeStyle = PAL.sis; g.lineWidth = 5; g.beginPath(); g.arc(x - 160, y + 40, 20, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(x - 140, y + 40); g.lineTo(x - 20, y + 40); g.stroke(); g.fillStyle = 'rgba(4,6,10,0.65)'; rr(g, x - 16, y + 6, 330, 68, 10); g.fill();
      txt(g, 'YOUR SISTER', x + 149, y + 54, `700 36px ${SANS}`, '#fff', 'center', la); g.globalAlpha = 1; }
  }
};
