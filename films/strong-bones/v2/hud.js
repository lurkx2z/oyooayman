/* =====================================================================
   HUD (v2) — captions timed to every voice's words (a coloured dot names who is talking), the title card after the
   hook, and the closing question. Numbers are shown as numerals in amber.
   ===================================================================== */

const SPK = { n: { col: '#f6f1e7', dot: null }, y: { col: '#bff3ea', dot: PAL.hero }, s: { col: '#ffe08a', dot: PAL.sis }, d: { col: '#d9e6ff', dot: '#eef0f3' },
  c: { col: '#c9f0c2', dot: '#3c8f4a' }, a: { col: '#ffd6a8', dot: '#ef8a3a' }, w: { col: '#ffd6a8', dot: '#f6b21b' } };
const CAPS = (() => {
  const out = [];
  for (const id of SBT.order) {
    const c = SBT.clips[id]; if (id === 'n_title') continue;
    const chunks = []; let cur = [];
    c.words.forEach((w, i) => { cur.push(w); const end = /[.?!]["”]?$/.test(w.w); if ((end && cur.length >= 3) || cur.length >= 9 || i === c.words.length - 1) { chunks.push(cur); cur = []; } });
    chunks.forEach((ch, k) => {
      const t0 = ch[0].s - 0.08, t1 = k + 1 < chunks.length ? chunks[k + 1][0].s - 0.08 : c.end + 0.35;
      let s = ch.map((w) => w.w).join(' ').replace(/^\.\.\./, '');
      s = s.replace(/\bten times\b/gi, '10×').replace(/\bfive hundred and seventy kilos\b/gi, '570 kilos');
      out.push({ id, who: c.who, t0, t1, s, q: id === 'n_cta' });
    });
  }
  // a caption ends where the next one starts (no overlaps)
  for (let i = 0; i + 1 < out.length; i++) out[i].t1 = Math.min(out[i].t1, out[i + 1].t0);
  return out;
})();

function capLine(g, s, x, y, size, col, italic, a) {
  g.font = `${italic ? 'italic ' : ''}600 ${size}px ${SERIF}`; g.textBaseline = 'alphabetic';
  const full = g.measureText(s).width; if (full > W - 240) { size = Math.floor(size * (W - 240) / full); g.font = `${italic ? 'italic ' : ''}600 ${size}px ${SERIF}`; }
  const parts = s.split(/(10×|570 kilos)/), widths = parts.map((p) => g.measureText(p).width), tw = widths.reduce((a, b) => a + b, 0);
  let cx = x - tw / 2; g.globalAlpha = a; shadowOn(g, 18, 'rgba(0,0,0,0.9)', 2);
  parts.forEach((p, i) => { g.fillStyle = /10×|570 kilos/.test(p) ? PAL.amber : col; g.textAlign = 'left'; g.fillText(p, cx, y); cx += widths[i]; });
  shadowOff(g); g.globalAlpha = 1; return tw;
}

FILM2.hud = function (g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const Wn = (a, b, fi = 0.08, fo = 0.1) => sm(t, a, a + fi) * (1 - sm(t, b - fo, b));
  let any = 0; for (const c of CAPS) if (t >= c.t0 && t < c.t1 && !c.q) any = Math.max(any, Wn(c.t0, c.t1));
  if (any > 0) { g.globalAlpha = any * 0.8; vgrad(g, 0, H - 240, W, 240, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']]); g.globalAlpha = 1; }
  for (const c of CAPS) {
    if (t < c.t0 || t >= c.t1) continue;
    const a = Wn(c.t0, c.t1), sp = SPK[c.who];
    if (c.q) { g.globalAlpha = a * 0.8; const gr = g.createRadialGradient(W / 2, 180, 20, W / 2, 180, 700); gr.addColorStop(0, 'rgba(2,3,10,0.8)'); gr.addColorStop(1, 'rgba(2,3,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 520); g.globalAlpha = 1; capLine(g, c.s, W / 2, 210, 92, PAL.cream, false, a); continue; }
    const tw = capLine(g, c.s, W / 2 + (sp.dot ? 20 : 0), H - 84, 54, sp.col, c.who !== 'n', a);
    if (sp.dot) { g.globalAlpha = a; g.fillStyle = sp.dot; g.beginPath(); g.arc(W / 2 + 20 - tw / 2 - 26, H - 102, 12, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
  }
  // the title card
  const ta = Wn(S('n_title') - 0.2, S('d_cracks') - 0.35, 0.3, 0.35);
  if (ta > 0) {
    g.globalAlpha = ta * 0.7; const gr = g.createRadialGradient(W / 2, 330, 40, W / 2, 330, 760); gr.addColorStop(0, 'rgba(2,3,10,0.75)'); gr.addColorStop(1, 'rgba(2,3,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    shadowOn(g, 40, 'rgba(0,0,0,0.85)', 3);
    const pop = 1 + 0.06 * (1 - eOut((t - S('n_title') + 0.2) / 0.5));
    g.save(); g.translate(W / 2, 330); g.scale(pop, pop); g.translate(-W / 2, -330);
    txt(g, 'WHAT IF YOU WERE', W / 2, 200, `600 54px ${SERIF}`, PAL.cream, 'center', ta);
    txt(g, '10× STRONGER', W / 2, 340, `700 150px ${SERIF}`, '#ffffff', 'center', ta * sm(t, Wd('n_title', 'ten') - 0.1, Wd('n_title', 'ten') + 0.1));
    txt(g, 'BUT YOUR BONES WEREN’T?', W / 2, 432, `600 64px ${SERIF}`, PAL.amber, 'center', ta * sm(t, Wd('n_title', 'but') - 0.1, Wd('n_title', 'but') + 0.1));
    g.restore(); shadowOff(g);
  }
};
