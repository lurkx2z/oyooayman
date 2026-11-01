/* =====================================================================
   HUD — captions timed to every voice's words (a coloured dot names who is talking, character lines in italics),
   numbers as amber numerals, the day cards (Tuesday … Sunday), the title card and the closing question.
   ===================================================================== */
const SPK = { n: { col: '#f6f1e7', dot: null }, y: { col: '#bff3ea', dot: PAL.hero }, s: { col: '#ffe08a', dot: PAL.sis }, m: { col: '#ffc9cf', dot: '#d0566c' },
  t: { col: '#ead9c4', dot: '#9a7a58' }, k: { col: '#ffd0bd', dot: '#d0613c' }, a: { col: '#cfe0ff', dot: '#5b8ad6' }, p: { col: '#d9e6ff', dot: '#eef0f3' }, g: { col: '#d5dbe8', dot: '#7d8698' } };
const NUMS = [[/\bseven a\.m\./gi, '7 a.m.'], [/\bforty-one\b/gi, '41'], [/\btwo million\b/gi, '2 million'], [/\bninety-four percent/gi, '94%'], [/\bseventy-one percent/gi, '71%'],
  [/\btwenty questions/gi, '20 questions'], [/\bforty seconds/gi, '40 seconds'], [/\bquestion seven/gi, 'Question 7'], [/\bthree feet/gi, '3 feet'], [/\btwo hundred\b/gi, '200'], [/\beighteen fifty-one/gi, '1851'],
  [/\beighty thousand dollars/gi, '$80,000'], [/\bforty million/gi, '40 million'], [/\bthirty years/gi, '30 years'], [/\bsix seconds/gi, '6 seconds'], [/\bthree kinds/gi, '3 kinds'], [/\bfour days/gi, '4 days'],
  [/\bninety-nine percent/gi, '99%'], [/\bninety-eight\b/gi, '98%']];
const NUMRE = /(7 a\.m\.|41|2 million|94%|71%|20 questions|40 seconds|Question 7|3 feet|200|1851|\$80,000|40 million|30 years|6 seconds|3 kinds|4 days|99%|98%)/;
const CAPS = (() => {
  const out = [];
  for (const id of KET.order) {
    const c = KET.clips[id]; if (id === 'n_title2') continue;
    // sentences first (a one-word sentence stands alone when a pause follows it), then long sentences split at the
    // best place: after a comma, never right after a small word, near the middle
    const sents = []; let cur = [];
    c.words.forEach((w, i) => { cur.push(w); const end = /[.?!:]["”]?$/.test(w.w) || /\.\.\.$/.test(w.w), gap = i + 1 < c.words.length ? c.words[i + 1].s - w.e : 9; if ((end && (cur.length >= 3 || gap >= 0.45)) || i === c.words.length - 1) { sents.push(cur); cur = []; } });
    const SMALL = /^(the|a|an|of|to|in|on|at|for|that|and|but|or|your|my|you|is|it|be|by|with|from|into|their|has|have|what's|who|can't|don't|she|he|they|we|i|next)$/i;
    const split = (ws) => { if (ws.length <= 12) return [ws]; let best = 0, bs = -1e9; for (let i = 3; i <= ws.length - 3; i++) { const prev = ws[i - 1].w; let sc = -Math.abs(i - ws.length / 2) * 0.35; if (/[,;]$/.test(prev) || /\.\.\.$/.test(prev)) sc += 3; if (SMALL.test(prev.replace(/[^a-z']/gi, ''))) sc -= 2.5; sc += Math.min(1.5, (ws[i].s - ws[i - 1].e) * 4); if (sc > bs) { bs = sc; best = i; } } return split(ws.slice(0, best)).concat(split(ws.slice(best))); };
    const chunks = [].concat(...sents.map(split));
    chunks.forEach((ch, k) => {
      const t0 = ch[0].s - 0.08, t1 = k + 1 < chunks.length ? chunks[k + 1][0].s - 0.08 : c.end + 0.4;
      let s = ch.map((w) => w.w).join(' ').replace(/^\.\.\./, '');
      for (const [re, r] of NUMS) s = s.replace(re, r);
      out.push({ id, who: c.who, t0, t1, s, q: id === 'n_cta2' });
    });
  }
  for (let i = 0; i + 1 < out.length; i++) out[i].t1 = Math.min(out[i].t1, out[i + 1].t0);
  return out;
})();
function capLine(g, s, x, y, size, col, italic, a) {
  g.font = `${italic ? 'italic ' : ''}600 ${size}px ${SERIF}`; g.textBaseline = 'alphabetic';
  const full = g.measureText(s).width; if (full > W - 240) { size = Math.floor(size * (W - 240) / full); g.font = `${italic ? 'italic ' : ''}600 ${size}px ${SERIF}`; }
  const parts = s.split(NUMRE), widths = parts.map((p) => g.measureText(p).width), tw = widths.reduce((a2, b) => a2 + b, 0);
  let cx = x - tw / 2; g.globalAlpha = a; shadowOn(g, 18, 'rgba(0,0,0,0.9)', 2);
  parts.forEach((p, i) => { g.fillStyle = NUMRE.test(p) && i % 2 === 1 ? PAL.amber : col; g.textAlign = 'left'; g.fillText(p, cx, y); cx += widths[i]; });
  shadowOff(g); g.globalAlpha = 1; return tw;
}
// the day cards: small letter-spaced caps in a thin box, top left
const DAYS = [];
function dayCards() {
  if (DAYS.length) return DAYS;
  const shot = (id) => SHOTS.find((s) => s.id === id);
  DAYS.push([0.35, 3.4, 'TUESDAY · 7:00 A.M.'], [shot('classWide').t0 + 0.1, shot('classWide').t0 + 3.0, 'TUESDAY · FIRST PERIOD'], [shot('yardWide').t0 + 0.1, shot('yardWide').t0 + 3.0, 'TUESDAY · 4:00 P.M.'],
    [shot('vans').t0 + 0.05, shot('vans').t0 + 3.0, 'WEDNESDAY'], [shot('labWide').t0 + 0.05, shot('labWide').t0 + 3.0, 'THURSDAY'], [shot('papers').t0 + 0.05, shot('papers').t0 + 2.8, 'FRIDAY'],
    [shot('priceSofa').t0 + 0.1, shot('priceSofa').t0 + 3.0, 'FRIDAY · 8:40 P.M.'], [shot('night1').t0 + 0.1, shot('night1').t0 + 3.2, 'SATURDAY · 3:12 A.M.'], [shot('carArrive').t0 + 0.1, shot('carArrive').t0 + 3.4, 'SATURDAY · 9:00 P.M.'],
    [shot('odds1').t0 + 0.1, shot('odds1').t0 + 3.0, 'SATURDAY · 11:21 P.M.'], [shot('silenceA').t0 + 0.1, shot('silenceB').t0 + 1.2, '11:59 P.M.'], [shot('sunday').t0 + 0.2, shot('sunday').t0 + 3.6, 'SUNDAY · 7:00 A.M.']);
  return DAYS;
}
KEF.hud = function (g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const Wn = (a, b, fi = 0.08, fo = 0.1) => sm(t, a, a + fi) * (1 - sm(t, b - fo, b));
  let any = 0; for (const c of CAPS) if (t >= c.t0 && t < c.t1 && !c.q) any = Math.max(any, Wn(c.t0, c.t1));
  if (any > 0) { g.globalAlpha = any * 0.8; vgrad(g, 0, H - 240, W, 240, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.5)']]); g.globalAlpha = 1; }
  for (const c of CAPS) {
    if (t < c.t0 || t >= c.t1) continue;
    const a = Wn(c.t0, c.t1), sp = SPK[c.who];
    if (c.q) continue;
    const tw = capLine(g, c.s, W / 2 + (sp.dot ? 20 : 0), H - 84, 54, sp.col, c.who !== 'n', a);
    if (sp.dot) { g.globalAlpha = a; g.fillStyle = sp.dot; g.beginPath(); g.arc(W / 2 + 20 - tw / 2 - 26, H - 102, 12, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1; }
  }
  // day cards
  for (const [a0, a1, s] of dayCards()) {
    const a = Wn(a0, a1, 0.3, 0.4); if (a <= 0) continue;
    g.font = `600 26px ${SANS}`; let w = 0; for (const ch of s) w += g.measureText(ch).width + 4;
    g.globalAlpha = a * 0.75; g.fillStyle = 'rgba(6,8,18,0.7)'; rr(g, 70, 64, w + 44, 58, 6); g.fill(); g.globalAlpha = a; g.strokeStyle = 'rgba(246,241,231,0.6)'; g.lineWidth = 1.5; rr(g, 70, 64, w + 44, 58, 6); g.stroke();
    g.fillStyle = PAL.cream; g.textAlign = 'left'; let x = 92; for (const ch of s) { g.fillText(ch, x, 103); x += g.measureText(ch).width + 4; } g.globalAlpha = 1;
  }
  // the title card
  const T0 = S('n_title2'), ta = Wn(T0 - 0.3, SHOTS.find((s2) => s2.id === 'title').t1 - 0.1, 0.35, 0.4);
  if (ta > 0) {
    g.globalAlpha = ta * 0.75; const gr = g.createRadialGradient(W / 2, 380, 40, W / 2, 380, 800); gr.addColorStop(0, 'rgba(2,3,10,0.8)'); gr.addColorStop(1, 'rgba(2,3,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    shadowOn(g, 40, 'rgba(0,0,0,0.85)', 3);
    const pop = 1 + 0.05 * (1 - eOut((t - T0 + 0.3) / 0.6));
    g.save(); g.translate(W / 2, 380); g.scale(pop, pop); g.translate(-W / 2, -380);
    txt(g, 'WHAT IF YOU SUDDENLY', W / 2, 270, `600 58px ${SERIF}`, PAL.cream, 'center', ta);
    const ev = ta * sm(t, Wd('n_title2', 'everything') - 0.15, Wd('n_title2', 'everything') + 0.15);
    txt(g, 'KNEW', W / 2, 360, `600 64px ${SERIF}`, PAL.cream, 'center', ta * sm(t, Wd('n_title2', 'knew') - 0.1, Wd('n_title2', 'knew') + 0.1));
    g.save(); g.shadowColor = 'rgba(143,227,255,0.9)'; g.shadowBlur = 40 * ev; txt(g, 'EVERYTHING?', W / 2, 520, `700 168px ${SERIF}`, '#ffffff', 'center', ev); g.restore();
    g.restore(); shadowOff(g);
  }
  // the closing question
  const qc = CAPS.find((c) => c.q);
  if (qc && t > qc.t0) {
    const a = sm(t, qc.t0, qc.t0 + 0.4) * (1 - sm(t, KET.duration - 0.6, KET.duration));
    g.globalAlpha = a * 0.8; const gr = g.createRadialGradient(W / 2, 200, 20, W / 2, 200, 760); gr.addColorStop(0, 'rgba(2,3,10,0.85)'); gr.addColorStop(1, 'rgba(2,3,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 560); g.globalAlpha = 1;
    capLine(g, 'What would you have written?', W / 2, 220, 92, PAL.cream, false, a);
  }
};
