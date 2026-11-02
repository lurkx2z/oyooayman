/* =====================================================================
   HUD — drawn after the ink shader, so it stays crisp: captions timed to every voice's words (narrator in cream,
   Light's lines in italics with a red dot, Eren's with a green one), numbers as numerals, the place card, the
   forty-second countdown (red, from the moment the name is finished to the narrator's "Forty") and the closing
   question.
   ===================================================================== */
const SPK = { n: { col: '#f6f1e7', dot: null }, l: { col: '#ffd9d6', dot: '#d8262c' }, e: { col: '#cdf5df', dot: '#1fbf78' } };
const NUMS = [[/\bforty seconds/gi, '40 seconds'], [/\bfifteen meters/gi, '15 meters'], [/\bfifty meters/gi, '50 meters'], [/\beighty percent/gi, '80%'],
  [/\btwelve o'clock/gi, "12 o'clock"], [/\bat twelve\b/gi, 'at 12']];
const NUMRE = /(40 seconds|15 meters|50 meters|80%|12 o'clock|at 12)/;
const NOCAP = ['n_title', 'n_zero', 'n_cta'];
const CAPS = (() => {
  const out = [];
  for (const id of KET.order) {
    const c = KET.clips[id]; if (NOCAP.includes(id)) continue;
    // sentences first (a short sentence stands alone when a pause follows it), then long sentences split at the best
    // place: after a comma, never right after a small word, near the middle
    const sents = []; let cur = [];
    c.words.forEach((w, i) => { cur.push(w); const end = /[.?!:]["”]?$/.test(w.w) || /\.\.\.$/.test(w.w), gap = i + 1 < c.words.length ? c.words[i + 1].s - w.e : 9; if ((end && (cur.length >= 3 || gap >= 0.45)) || i === c.words.length - 1) { sents.push(cur); cur = []; } });
    const SMALL = /^(the|a|an|of|to|in|on|at|for|that|and|but|or|your|my|you|is|it|be|by|with|from|into|their|has|have|who|can't|don't|he|they|we|i|his|our)$/i;
    const split = (ws) => { if (ws.length <= 11) return [ws]; let best = 0, bs = -1e9; for (let i = 3; i <= ws.length - 3; i++) { const prev = ws[i - 1].w; let sc = -Math.abs(i - ws.length / 2) * 0.35; if (/[,;]$/.test(prev) || /\.\.\.$/.test(prev)) sc += 3; if (SMALL.test(prev.replace(/[^a-z']/gi, ''))) sc -= 2.5; sc += Math.min(1.5, (ws[i].s - ws[i - 1].e) * 4); if (sc > bs) { bs = sc; best = i; } } return split(ws.slice(0, best)).concat(split(ws.slice(best))); };
    const chunks = [].concat(...sents.map(split));
    chunks.forEach((ch, k) => {
      const t0 = ch[0].s - 0.08, t1 = k + 1 < chunks.length ? chunks[k + 1][0].s - 0.08 : c.end + 0.4;
      let s = ch.map((w) => w.w).join(' ').replace(/^\.\.\./, '');
      for (const [re, r] of NUMS) s = s.replace(re, r);
      out.push({ id, who: c.who, t0, t1, s });
    });
  }
  for (let i = 0; i + 1 < out.length; i++) out[i].t1 = Math.min(out[i].t1, out[i + 1].t0);
  return out;
})();
function capLine(g, s, x, y, size, col, italic, a, hi = '#ffcf6a') {
  g.font = `${italic ? 'italic ' : ''}600 ${size}px ${SERIF}`; g.textBaseline = 'alphabetic';
  const full = g.measureText(s).width; if (full > W - 240) { size = Math.floor(size * (W - 240) / full); g.font = `${italic ? 'italic ' : ''}600 ${size}px ${SERIF}`; }
  const parts = s.split(NUMRE), widths = parts.map((p) => g.measureText(p).width), tw = widths.reduce((a2, b) => a2 + b, 0);
  let cx = x - tw / 2; g.globalAlpha = a;
  // a thin ink outline under a soft shadow: readable on white paper and on black night alike
  g.lineJoin = 'round'; g.lineWidth = Math.max(4, size * 0.11); g.strokeStyle = 'rgba(10,8,12,0.92)';
  parts.forEach((p, i) => { g.textAlign = 'left'; g.strokeText(p, cx, y); cx += widths[i]; });
  cx = x - tw / 2; shadowOn(g, 14, 'rgba(0,0,0,0.6)', 2);
  parts.forEach((p, i) => { g.fillStyle = NUMRE.test(p) && i % 2 === 1 ? hi : col; g.textAlign = 'left'; g.fillText(p, cx, y); cx += widths[i]; });
  shadowOff(g); g.globalAlpha = 1; return tw;
}
function spaced(g, s, x, y, font, col, gap, a = 1, align = 'left', stroke = 0) {
  g.font = font; let w = 0; for (const ch of s) w += g.measureText(ch).width + gap; w -= gap;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; let cx = x0;
  g.globalAlpha = a; g.textAlign = 'left';
  if (stroke) { g.lineJoin = 'round'; g.lineWidth = stroke; g.strokeStyle = 'rgba(10,8,12,0.9)'; for (const ch of s) { g.strokeText(ch, cx, y); cx += g.measureText(ch).width + gap; } cx = x0; }
  g.fillStyle = col; for (const ch of s) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + gap; } g.globalAlpha = 1; return w;
}
// place cards: small letter-spaced caps in a thin ink box, top left
let CARDS = null;
function placeCards() {
  if (CARDS) return CARDS;
  const sh = (id) => SHOTS.find((s) => s.id === id);
  CARDS = [[sh('stWide').t0 + 0.2, sh('stWide').t1 + 1.8, 'MIDNIGHT · A STATION ON NO MAP'], [sh('tick').t0 + 0.1, sh('tick').t0 + 3.0, "12:00:01 · THE CLOCK STARTS"]];
  return CARDS;
}
// the countdown: from the moment the name is finished (T.written) to the narrator's "Forty" (T.zero, exactly 40 s later)
function countdown(g, t) {
  const t0 = T.written, t1 = T.zero, hold = 2.6;
  if (t < t0 - 0.05 || t > t1 + hold) return;
  const n = Math.min(40, Math.max(0, Math.floor(t - t0))), frac = (t - t0) % 1;
  const sil = shotAt(t), quiet = ['sA', 'sB', 'sC', 'sD', 'sE', 'collide'].includes(sil.id) || t > t1 - 0.2;
  const a = sm(t, t0 - 0.05, t0 + 0.25) * (1 - sm(t, t1 + hold - 0.6, t1 + hold));
  // the last ten seconds grow into the frame
  const big = sm(t, t1 - 10.5, t1 - 9.5), sz = lerp(quiet ? 150 : 120, 230, big), x = lerp(W - 190, W - 250, big), y = lerp(150, 200, big);
  const tick = t < t1 ? Math.exp(-frac * 10) : 0, done = t >= t1;
  g.save(); g.globalAlpha = a;
  // a ring that empties as the seconds run out
  g.lineWidth = 8 + big * 4; g.strokeStyle = 'rgba(10,8,12,0.85)'; g.beginPath(); g.arc(x, y, sz * 0.72, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = '#d8262c'; g.lineWidth = 5 + big * 3; g.beginPath(); g.arc(x, y, sz * 0.72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, (t - t0) / 40)); g.stroke();
  const k = 1 + 0.08 * tick + (done ? 0.12 * Math.exp(-(t - t1) * 4) : 0);
  g.translate(x, y); g.scale(k, k);
  bigCount(g, n, 0, 4, sz * (n >= 10 ? 0.86 : 0.86), done ? '#ffffff' : '#d8262c', 1);
  g.restore();
  spaced(g, 'SECONDS', x, y + sz * 0.72 + 44, `700 ${Math.round(22 + big * 6)}px ${SANS}`, '#f6f1e7', 5, a, 'center', 6);
}
KEF.hud = function (g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const Wn = (a, b, fi = 0.08, fo = 0.1) => sm(t, a, a + fi) * (1 - sm(t, b - fo, b));
  let any = 0; for (const c of CAPS) if (t >= c.t0 && t < c.t1) any = Math.max(any, Wn(c.t0, c.t1));
  if (any > 0) { g.globalAlpha = any * 0.7; vgrad(g, 0, H - 220, W, 220, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.42)']]); g.globalAlpha = 1; }
  for (const c of CAPS) {
    if (t < c.t0 || t >= c.t1) continue;
    const a = Wn(c.t0, c.t1), sp = SPK[c.who];
    const tw = capLine(g, c.s, W / 2 + (sp.dot ? 20 : 0), H - 80, 52, sp.col, c.who !== 'n', a);
    if (sp.dot) { g.globalAlpha = a; g.fillStyle = sp.dot; g.beginPath(); g.arc(W / 2 + 20 - tw / 2 - 28, H - 97, 12, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(10,8,12,0.9)'; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1; }
  }
  for (const [a0, a1, s] of placeCards()) {
    const a = Wn(a0, a1, 0.3, 0.4); if (a <= 0) continue;
    g.font = `600 24px ${SANS}`; let w = 0; for (const ch of s) w += g.measureText(ch).width + 5;
    g.globalAlpha = a * 0.8; g.fillStyle = 'rgba(10,8,12,0.78)'; g.fillRect(64, 60, w + 40, 54); g.globalAlpha = a; g.strokeStyle = 'rgba(246,241,231,0.7)'; g.lineWidth = 1.5; g.strokeRect(64, 60, w + 40, 54);
    spaced(g, s, 84, 96, `600 24px ${SANS}`, '#f6f1e7', 5, a);
  }
  countdown(g, t);
  // the closing question, over the four glowing eyes
  const c0 = S('n_cta');
  if (t > c0 - 0.2) {
    const a = sm(t, c0 - 0.2, c0 + 0.3) * (1 - sm(t, KET.duration - 0.5, KET.duration));
    capLine(g, 'Which rule wins?', W / 2, 250, 84, '#f6f1e7', false, a);
    const b = sm(t, Wd('n_cta', 'notebook') - 0.15, Wd('n_cta', 'notebook') + 0.2) * a, c = sm(t, Wd('n_cta', 'future') - 0.15, Wd('n_cta', 'future') + 0.2) * a;
    g.save(); g.font = `700 110px ${COND}`; g.textBaseline = 'alphabetic'; g.lineWidth = 12; g.lineJoin = 'round'; g.strokeStyle = '#0a080c';
    const w1 = g.measureText('THE NOTEBOOK').width, w2 = g.measureText(' OR ').width, w3 = g.measureText('THE FUTURE').width, x0 = W / 2 - (w1 + w2 + w3) / 2;
    g.textAlign = 'left';
    g.globalAlpha = b; g.strokeText('THE NOTEBOOK', x0, 940); g.fillStyle = '#d8262c'; g.fillText('THE NOTEBOOK', x0, 940);
    g.globalAlpha = c; g.fillStyle = '#f6f1e7'; g.font = `500 70px ${SERIF}`; const wo = g.measureText(' or ').width; g.fillText(' or ', x0 + w1 + (w2 - wo) / 2, 940);
    g.font = `700 110px ${COND}`; g.strokeText('THE FUTURE', x0 + w1 + w2, 940); g.fillStyle = '#1fbf78'; g.fillText('THE FUTURE', x0 + w1 + w2, 940);
    g.restore();
  }
};
