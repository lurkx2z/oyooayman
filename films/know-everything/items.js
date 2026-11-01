/* =====================================================================
   ITEMS — the story objects of "What if you suddenly knew everything?" and the film's one visual idea, the FACT TAG:
   everything you look at gets a small glass label (what it is, a number, the odds of what happens next). People get
   their next move. You get a question mark.
   Tags are registered in set space during a shot (tag(g, x, y, {...}) reads the current camera transform) and drawn on
   top in screen space at a fixed size (flushTags), so they stay readable at any zoom. Pure functions of t.
   ===================================================================== */

const KN = { cyan: '#8fe3ff', cyanA: 'rgba(143,227,255,', glass: 'rgba(8,14,30,0.8)' };
const TAGQ = [];
// o: { t0, t1 (fade out), label, value, odds (number), kind: 'fact'|'odds'|'q', dx, dy (label offset, px), s (size), a, type (typing on/off) }
function tag(g, x, y, o) { const m = g.getTransform(); TAGQ.push(Object.assign({ px: m.a * x + m.c * y + m.e, py: m.b * x + m.d * y + m.f }, o)); }
function flushTags(g, t, k = 1) { g.setTransform(1, 0, 0, 1, 0, 0); for (const o of TAGQ) drawTag(g, t, o, k); TAGQ.length = 0; }
function tagAlpha(t, o) { return sm(t, o.t0, o.t0 + 0.22) * (o.t1 !== undefined ? 1 - sm(t, o.t1, o.t1 + (o.fo ?? 0.35)) : 1) * (o.a ?? 1); }
function drawTag(g, t, o, k = 1) {
  const a = tagAlpha(t, o) * k; if (a <= 0.003) return;
  const s = o.s || 1, u = cl((t - o.t0) / 0.32), pop = 0.75 + 0.25 * eOut(u) + 0.06 * Math.sin(u * Math.PI);
  const px = o.px, py = o.py, dx = (o.dx ?? 40) * s, dy = (o.dy ?? -70) * s;
  let bx = px + dx, by = py + dy;
  if (o.kind !== 'q') {   // keep the whole box inside the frame and clear of the captions
    const L = (o.label || '').toUpperCase(), V = o.kind === 'odds' ? `${o.odds}%` : (o.value || '');
    g.font = `600 18px ${SANS}`; const lw = L ? g.measureText(L).width + L.length * 1.6 : 0;
    g.font = o.kind === 'odds' ? `700 48px ${SERIF}` : `600 30px ${SERIF}`; const vw = g.measureText(V).width;
    const bw = (Math.max(lw, vw) + 34) * s, bh = (L ? (o.kind === 'odds' ? 96 : 78) : 50) * s, l = dx < 0 ? bx - bw : bx;
    if (l < 28) bx += 28 - l; if (l + bw > W - 28) bx -= l + bw - (W - 28);
    if (by - bh / 2 < 28) by = 28 + bh / 2; if (by + bh / 2 > H - 170) by = H - 170 - bh / 2;
  }
  g.save(); g.globalAlpha = a;
  // the anchor: a dot with a slow pulse ring, and the leader line
  if (o.kind !== 'q' && !o.noDot) {
    g.fillStyle = KN.cyan; g.beginPath(); g.arc(px, py, 4.5 * s, 0, Math.PI * 2); g.fill();
    const ph = ((t - o.t0) * 0.8) % 1; g.strokeStyle = KN.cyanA + (0.5 * (1 - ph)) + ')'; g.lineWidth = 1.5; g.beginPath(); g.arc(px, py, (6 + ph * 14) * s, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = KN.cyanA + '0.75)'; g.lineWidth = 1.6 * s; g.beginPath(); g.moveTo(px, py); g.lineTo(bx, by); g.stroke();
  }
  g.translate(bx, by); g.scale(pop * s, pop * s);
  if (o.kind === 'q') {
    // the question mark over your own head: no numbers, a soft white glow
    const r = 54, pul = 1 + 0.04 * Math.sin(t * 3.2);
    g.scale(pul, pul); g.shadowColor = 'rgba(200,240,255,0.9)'; g.shadowBlur = 26;
    g.fillStyle = KN.glass; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = KN.cyanA + '0.9)'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    txt(g, '?', 0, 26, `700 76px ${SERIF}`, '#ffffff', 'center', 1);
    g.restore(); return;
  }
  const label = (o.label || '').toUpperCase();
  let value = o.kind === 'odds' ? `${o.odds}%` : (o.value || '');
  const typed = o.type === false ? value.length : Math.floor(cl((t - o.t0 - 0.08) / 0.45) * value.length);
  value = value.slice(0, Math.max(o.kind === 'odds' ? value.length : 0, typed));
  const lf = `600 18px ${SANS}`, vf = o.kind === 'odds' ? `700 48px ${SERIF}` : `600 30px ${SERIF}`;
  g.font = lf; const lw = label ? g.measureText(label).width + label.length * 1.6 : 0;
  g.font = vf; const vw = g.measureText(o.kind === 'odds' ? `${o.odds}%` : (o.value || '')).width;
  const w = Math.max(lw, vw) + 34, h = label && value !== undefined ? (o.kind === 'odds' ? 96 : 78) : 50;
  const x0 = dx < 0 ? -w : 0, y0 = -h / 2;
  g.shadowColor = 'rgba(120,200,255,0.45)'; g.shadowBlur = 18; g.fillStyle = KN.glass; rr(g, x0, y0, w, h, 9); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = KN.cyanA + '0.85)'; g.lineWidth = 1.5; rr(g, x0, y0, w, h, 9); g.stroke();
  g.fillStyle = KN.cyanA + '0.18)'; g.fillRect(x0 + 1, y0 + 1, 4, h - 2);
  if (label) { g.font = lf; g.fillStyle = KN.cyan; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; let cx = x0 + 15; for (const ch of label) { g.fillText(ch, cx, y0 + 28); cx += g.measureText(ch).width + 1.6; } }
  g.font = vf; g.textAlign = 'left'; g.fillStyle = o.kind === 'odds' ? PAL.amber : '#ffffff';
  g.fillText(value, x0 + 16, o.kind === 'odds' ? y0 + 80 : y0 + (label ? 62 : 36));
  g.restore();
}
// a burst of small ambient tags (the room fills with facts); list: [[x, y, label, value, dx, dy], ...] appearing from t0
function tagBurst(g, t, t0, list, o = {}) { list.forEach((L, i) => tag(g, L[0], L[1], Object.assign({ t0: t0 + (o.step ?? 0.09) * i, label: L[2], value: L[3], dx: L[4] ?? 34, dy: L[5] ?? -50, s: o.s ?? 0.8, a: o.a ?? 0.85, t1: o.t1 }, o.extra || {}))); }
// the "knowing" ring: a shimmer that expands from your head when the knowledge arrives
function knowRing(g, x, y, t, t0, R = 1400) {
  const u = (t - t0) / 1.2; if (u < 0 || u > 1) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const uu = u - k * 0.08; if (uu < 0) continue; g.strokeStyle = KN.cyanA + (0.55 * (1 - uu)) + ')'; g.lineWidth = 10 * (1 - uu) + 2; g.beginPath(); g.arc(x, y, eOut(uu) * R, 0, Math.PI * 2); g.stroke(); }
  glow(g, x, y, 260 * (1 - u) + 40, 'rgba(160,230,255,0.7)', 1 - u);
  g.restore();
}

function alarmClock(g, x, y, s, t, ring, burst = -1) {
  if (burst < 0) {
    const sh = ring ? Math.sin(t * 90) * 4 * s * ring : 0, rot = ring ? Math.sin(t * 70) * 0.06 * ring : 0;
    g.save(); g.translate(x + sh, y); g.rotate(rot);
    g.strokeStyle = '#2b2b33'; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(-34 * s, 0); g.lineTo(-44 * s, -26 * s); g.moveTo(34 * s, 0); g.lineTo(44 * s, -26 * s); g.stroke();
    for (const d of [-1, 1]) { g.fillStyle = '#d9d4cc'; g.beginPath(); g.arc(d * 42 * s, -112 * s, 22 * s, Math.PI, 0); g.fill(); }
    g.strokeStyle = '#b7b2aa'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(0, -120 * s); g.lineTo(0, -106 * s); g.stroke();
    const gr = g.createRadialGradient(-18 * s, -84 * s, 6 * s, 0, -62 * s, 66 * s); gr.addColorStop(0, '#ff7a6a'); gr.addColorStop(1, '#a8231c'); g.fillStyle = gr; g.beginPath(); g.arc(0, -62 * s, 58 * s, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f7f2e8'; g.beginPath(); g.arc(0, -62 * s, 44 * s, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2b2b33'; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.fillRect(Math.cos(a) * 36 * s - 2 * s, -62 * s + Math.sin(a) * 36 * s - 2 * s, 4 * s, 4 * s); }
    g.strokeStyle = '#2b2b33'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(0, -62 * s); g.lineTo(0, -92 * s); g.moveTo(0, -62 * s); g.lineTo(22 * s, -54 * s); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-16 * s, -82 * s, 14 * s, 8 * s, -0.6, 0, Math.PI * 2); g.fill();
    g.restore();
    if (ring) { g.strokeStyle = `rgba(255,240,200,${0.6 * ring})`; g.lineWidth = 4 * s; for (const d of [-1, 1]) for (let k = 0; k < 3; k++) { const ph = (t * 3 + k / 3) % 1; g.globalAlpha = (1 - ph) * ring; g.beginPath(); g.arc(x + d * 70 * s, y - 112 * s, (20 + ph * 50) * s, d > 0 ? -0.8 : Math.PI - 0.8, d > 0 ? 0.8 : Math.PI + 0.8); g.stroke(); } g.globalAlpha = 1; }
    return;
  }
  // exploded: pieces fly out, spin and fall
  const r = rng(77);
  for (let i = 0; i < 22; i++) {
    const a = -Math.PI * (0.05 + 0.9 * r()), v = (400 + r() * 900) * s, spin = (r() - 0.5) * 20, tt = Math.min(burst, 1.6);
    let px = x + Math.cos(a) * v * tt, py = y - 62 * s + Math.sin(a) * v * tt + 1800 * s * tt * tt; py = Math.min(py, y + 10 * s);
    g.save(); g.translate(px, py); g.rotate(spin * tt);
    const kind = i % 5;
    if (kind === 0) { g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(-20 * s, 0); g.lineTo(18 * s, -12 * s); g.lineTo(10 * s, 16 * s); g.fill(); }
    else if (kind === 1) { g.fillStyle = '#d6b45a'; g.beginPath(); g.arc(0, 0, 12 * s, 0, Math.PI * 2); g.fill(); g.fillStyle = '#8a6a2a'; for (let k = 0; k < 8; k++) { const b = k * Math.PI / 4; g.fillRect(Math.cos(b) * 13 * s - 2 * s, Math.sin(b) * 13 * s - 2 * s, 4 * s, 4 * s); } }
    else if (kind === 2) { g.strokeStyle = '#c9ccd2'; g.lineWidth = 3 * s; g.beginPath(); for (let k = 0; k < 24; k++) { const b = k * 0.6; g.lineTo(Math.cos(b) * (4 + k * 0.6) * s, Math.sin(b) * (4 + k * 0.6) * s); } g.stroke(); }
    else if (kind === 3) { g.fillStyle = 'rgba(220,240,250,0.8)'; g.beginPath(); g.moveTo(0, -10 * s); g.lineTo(8 * s, 6 * s); g.lineTo(-6 * s, 8 * s); g.fill(); }
    else { g.fillStyle = '#f7f2e8'; g.beginPath(); g.arc(0, 0, 14 * s, 0, Math.PI); g.fill(); }
    g.restore();
  }
  if (burst < 0.25) { g.globalCompositeOperation = 'lighter'; glow(g, x, y - 60 * s, 260 * s * (1 + burst * 3), 'rgba(255,230,180,0.9)', 1 - burst * 4); g.globalCompositeOperation = 'source-over'; }
}

// ---------- jar, lid, mug (from v1, shaded) ----------
/* ---------- bedroom things ---------- */
function spider(g, x, y, s, t) {
  const bob = Math.sin(t * 1.3) * 6 * s;
  g.strokeStyle = 'rgba(230,230,240,0.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - 200 * s); g.lineTo(x, y + bob); g.stroke();
  g.strokeStyle = '#1a1520'; g.lineWidth = 3 * s; for (const d of [-1, 1]) for (let k = 0; k < 4; k++) { const a = -0.9 + k * 0.6; g.beginPath(); g.moveTo(x, y + bob); g.quadraticCurveTo(x + d * 16 * s, y + bob - 10 * s + k * 6 * s, x + d * 22 * s * Math.cos(a * 0.4), y + bob + 12 * s * Math.sin(a)); g.stroke(); }
  g.fillStyle = '#1a1520'; g.beginPath(); g.ellipse(x, y + bob, 9 * s, 11 * s, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(x, y + bob - 12 * s, 6 * s, 0, Math.PI * 2); g.fill();
}
function phoneOnStand(g, x, y, s, t, buzz, lit, msg) {
  const sh = buzz ? Math.sin(t * 80) * 3 * s : 0;
  g.save(); g.translate(x + sh, y); g.rotate(buzz ? Math.sin(t * 60) * 0.03 : 0);
  g.fillStyle = '#0d0e14'; rr(g, -40 * s, -9 * s, 80 * s, 12 * s, 3 * s); g.fill();
  g.restore();
  if (lit) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y - 4 * s, 70 * s, 'rgba(150,200,255,0.6)', lit); g.restore(); }
  if (buzz) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; for (const d of [-1, 1]) { g.beginPath(); g.arc(x + d * 50 * s, y - 4 * s, 10 * s, d > 0 ? -0.8 : Math.PI - 0.8, d > 0 ? 0.8 : Math.PI + 0.8); g.stroke(); } }
}
// a phone held up to the camera with a message
function phoneMsg(g, x, y, s, who, text, u) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#0d0e14'; rr(g, -160, -320, 320, 640, 40); g.fill(); vgrad(g, -146, -306, 292, 612, [[0, '#1d2340'], [1, '#2d2350']]);
  txt(g, '7:00', 0, -230, `300 64px ${SANS}`, '#ffffff'); txt(g, 'Tuesday', 0, -190, `500 20px ${SANS}`, '#c9cde0');
  const a = eOut(u); g.globalAlpha = a; g.fillStyle = 'rgba(255,255,255,0.92)'; rr(g, -130, -130 + (1 - a) * 30, 260, 110, 18); g.fill();
  g.fillStyle = PAL.sis; g.beginPath(); g.arc(-96, -96 + (1 - a) * 30, 18, 0, Math.PI * 2); g.fill();
  txt(g, who, -68, -100 + (1 - a) * 30, `700 18px ${SANS}`, '#191a26', 'left'); txt(g, text, -68, -70 + (1 - a) * 30, `600 19px ${SANS}`, '#33354a', 'left');
  g.globalAlpha = 1; g.restore();
}
/* ---------- kitchen: the toaster and the toast ---------- */
function toaster(g, x, y, s, t, pop, smoke) {
  // the toast slices: they jump up at `pop` (t-relative), burnt black
  if (pop !== null) { const u = pop, jump = u < 0 ? 0 : Math.sin(Math.min(u, 0.5) / 0.5 * Math.PI) * 60 * s + (u > 0.5 ? 34 * s : 0);
    for (const d of [-1, 1]) { g.fillStyle = u >= 0 ? '#2a1a12' : '#d9a868'; rr(g, x + d * 26 * s - 18 * s, y - 64 * s - jump - (u >= 0 ? 0 : -30 * s), 36 * s, 50 * s, 8 * s); g.fill(); if (u >= 0) { g.fillStyle = '#4a2a1a'; g.fillRect(x + d * 26 * s - 12 * s, y - 60 * s - jump, 24 * s, 6 * s); } } }
  box(g, x - 80 * s, y - 70 * s, 160 * s, 70 * s, '#c9cfd6', { r: 16 * s });
  g.fillStyle = '#2b2e38'; g.fillRect(x - 52 * s, y - 74 * s, 40 * s, 8 * s); g.fillRect(x + 12 * s, y - 74 * s, 40 * s, 8 * s);
  g.fillStyle = '#e0483e'; g.fillRect(x + 66 * s, y - 50 * s, 10 * s, 18 * s);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x - 70 * s, y - 62 * s, 6 * s, 50 * s);
  if (smoke > 0) { for (let i = 0; i < 9; i++) { const ph = (smoke * 0.6 + i / 9) % 1, r = (20 + ph * 70) * s; g.globalAlpha = 0.5 * (1 - ph) * Math.min(1, smoke * 2); g.fillStyle = '#4a4550'; g.beginPath(); g.arc(x + Math.sin(i * 2.3 + smoke) * 30 * s, y - 80 * s - ph * 260 * s, r, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; }
}
/* ---------- the street: birds, a can, a bin ---------- */
function bird(g, x, y, s, t, seed = 1) { const f = Math.sin(t * 14 + seed) * 0.6; g.strokeStyle = '#2b2a35'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x - 22 * s, y - 10 * s * f); g.quadraticCurveTo(x - 10 * s, y - 14 * s * f - 4 * s, x, y); g.quadraticCurveTo(x + 10 * s, y - 14 * s * f - 4 * s, x + 22 * s, y - 10 * s * f); g.stroke(); }
function bin(g, x, y, s) { box(g, x - 46 * s, y - 120 * s, 92 * s, 120 * s, '#3f6f5a', { r: 8 * s }); box(g, x - 54 * s, y - 132 * s, 108 * s, 18 * s, '#2f5747', { r: 6 * s }); g.fillStyle = 'rgba(0,0,0,0.2)'; for (let k = 0; k < 4; k++) g.fillRect(x - 30 * s + k * 20 * s, y - 104 * s, 6 * s, 90 * s); }
function can(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); vgrad(g, -14 * s, -22 * s, 28 * s, 44 * s, [[0, '#e0483e'], [1, '#a8231c']]); g.fillStyle = '#d9dde2'; g.fillRect(-14 * s, -22 * s, 28 * s, 5 * s); g.fillRect(-14 * s, 17 * s, 28 * s, 5 * s); g.fillStyle = '#ffffff'; g.fillRect(-10 * s, -6 * s, 20 * s, 6 * s); g.restore(); }
/* ---------- space (the zoom out) ---------- */
function starfield(g, t, seed = 1, dens = 1) {
  const c = LAYER('stars' + seed, W, H, (q) => { vgrad(q, 0, 0, W, H, [[0, '#03040c'], [1, '#0a0b1c']]); const r = rng(seed); for (let i = 0; i < 900 * dens; i++) { const b = r(); q.fillStyle = `rgba(${200 + r() * 55},${210 + r() * 45},255,${0.2 + b * 0.8})`; const sz = b > 0.97 ? 3 : b > 0.85 ? 2 : 1; q.fillRect(r() * W, r() * H, sz, sz); }
    for (let i = 0; i < 4; i++) { const x = r() * W, y = r() * H; const gr = q.createRadialGradient(x, y, 0, x, y, 400); gr.addColorStop(0, ['rgba(120,80,200,0.18)', 'rgba(60,120,220,0.15)', 'rgba(220,100,140,0.12)', 'rgba(80,180,200,0.12)'][i]); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); } });
  g.drawImage(c, 0, 0);
}
function earthTex() {   // a painted globe (continents in clusters, ice cap, soft cloud bands, limb darkening), cached
  return LAYER('earthTex', 1024, 1024, (q) => {
    const c = 512, r = rng(11); q.save(); q.beginPath(); q.arc(c, c, 512, 0, Math.PI * 2); q.clip();
    const CONT = [[0.30, 0.34, 9, 0.17], [0.63, 0.28, 7, 0.14], [0.70, 0.64, 10, 0.17], [0.27, 0.70, 6, 0.12], [0.88, 0.45, 4, 0.08]];
    for (const [cx, cy, n, sz] of CONT) for (let i = 0; i < n; i++) { const a = r() * 6.283, d = r() * sz; const x = (cx + Math.cos(a) * d) * 1024, y = (cy + Math.sin(a) * d * 0.8) * 1024, R = (0.35 + r() * 0.5) * sz * 1024 * 0.55;
      q.fillStyle = '#5f9a5d'; q.beginPath(); q.ellipse(x, y, R, R * (0.55 + r() * 0.4), r() * 3, 0, 6.283); q.fill(); }
    const r2 = rng(12); for (const [cx, cy, n, sz] of CONT) for (let i = 0; i < 2; i++) { const x = (cx + (r2() - 0.5) * sz) * 1024, y = (cy + (r2() - 0.5) * sz * 0.6) * 1024; q.fillStyle = i ? 'rgba(70,120,70,0.7)' : 'rgba(196,174,112,0.85)'; q.beginPath(); q.ellipse(x, y, sz * 160, sz * 90, r2() * 3, 0, 6.283); q.fill(); }
    q.fillStyle = 'rgba(240,248,255,0.95)'; q.beginPath(); q.ellipse(c, 0, 360, 90, 0, 0, 6.283); q.fill(); q.beginPath(); q.ellipse(c, 1024, 420, 80, 0, 0, 6.283); q.fill();
    q.filter = 'blur(5px)'; q.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const y = 80 + r() * 860, x = r() * 1024, L = 90 + r() * 260, w = 7 + r() * 16; q.strokeStyle = `rgba(255,255,255,${0.3 + r() * 0.4})`; q.lineWidth = w; q.beginPath(); q.moveTo(x - L / 2, y); q.quadraticCurveTo(x, y - (r() - 0.5) * 70, x + L / 2, y + (r() - 0.5) * 34); q.stroke(); }
    q.filter = 'none';
    const lg = q.createRadialGradient(c, c, 300, c, c, 512); lg.addColorStop(0, 'rgba(0,10,40,0)'); lg.addColorStop(1, 'rgba(0,10,40,0.45)'); q.fillStyle = lg; q.fillRect(0, 0, 1024, 1024);
    q.restore();
  });
}
function planet(g, x, y, r, c0, c1, o = {}) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  if (o.earth) g.drawImage(earthTex(), x - r, y - r, r * 2, r * 2);
  if (o.craters) { const rr2 = rng(o.craters); for (let i = 0; i < 26; i++) { const cx = x + (rr2() - 0.5) * r * 1.5, cy = y + (rr2() - 0.5) * r * 1.5; if (Math.hypot(cx - x, cy - y) > r * 0.88) continue; const cr = r * (0.03 + rr2() * 0.1); g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.arc(cx, cy, cr, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(cx - cr * 0.2, cy - cr * 0.2, cr * 0.7, 0, Math.PI * 2); g.fill(); } }
  // night side
  const sh = g.createLinearGradient(x - r, y - r, x + r, y + r); sh.addColorStop(0.45, 'rgba(0,0,10,0)'); sh.addColorStop(1, 'rgba(0,0,10,0.75)'); g.fillStyle = sh; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  if (o.atmo) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(120,190,255,0.5)'; g.lineWidth = r * 0.04; g.beginPath(); g.arc(x, y, r * 1.01, 0, Math.PI * 2); g.stroke(); glow(g, x, y, r * 1.25, 'rgba(90,150,255,0.18)'); g.restore(); }
}
function sun(g, x, y, r, t, cut) {
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, r * 2.6, 'rgba(255,170,80,0.55)'); g.restore();
  const gr = g.createRadialGradient(x, y, r * 0.1, x, y, r); gr.addColorStop(0, '#fff6d6'); gr.addColorStop(0.6, '#ffc35a'); gr.addColorStop(1, '#ff7a2a'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 40; i++) { const a = hash(i * 3) * Math.PI * 2, d = hash(i * 7) * r * 0.9; g.fillStyle = `rgba(255,${120 + hash(i) * 80},40,${0.25 + 0.2 * Math.sin(t * 2 + i)})`; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.06, 0, Math.PI * 2); g.fill(); }
  if (cut) { // a quarter cut away: three layers down to a white-hot core
    const a0 = -Math.PI / 2, a1 = 0;
    g.save(); g.fillStyle = 'rgba(60,10,0,0.55)'; g.beginPath(); g.moveTo(x + 10, y + 10); g.arc(x + 10, y + 10, r, a0, a1); g.closePath(); g.fill(); g.restore();
    for (const [k, c] of [[1, '#d8501c'], [0.72, '#f28a2a'], [0.45, '#ffc458'], [0.22, '#fff7e0']]) { g.fillStyle = c; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r * k, a0, a1); g.closePath(); g.fill(); }
    for (let i = 0; i < 9; i++) { const ang = a0 + (i + 0.5) / 9 * (a1 - a0), k1 = 0.74 + 0.22 * hash(i * 5); g.strokeStyle = 'rgba(255,200,120,0.5)'; g.lineWidth = r * 0.025; g.beginPath(); g.arc(x + Math.cos(ang) * r * k1, y + Math.sin(ang) * r * k1, r * 0.06, 0, Math.PI * 2 * (0.5 + 0.5 * Math.sin(t * 2 + i))); g.stroke(); }
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, r * 0.5, 'rgba(255,255,230,0.9)', 0.8 + 0.2 * Math.sin(t * 5)); g.restore();
    g.strokeStyle = 'rgba(120,30,0,0.7)'; g.lineWidth = r * 0.012; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x, y); g.lineTo(x + r, y); g.stroke();
  }
}
function galaxy(g, x, y, r, t, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot + t * 0.03); g.scale(1, 0.45); g.globalCompositeOperation = 'lighter';
  glow(g, 0, 0, r * 0.35, 'rgba(255,230,190,0.9)');
  for (let i = 0; i < 1400; i++) { const arm = i % 2, k = hash(i * 13), a = k * 5.5 + arm * Math.PI + (hash(i * 7) - 0.5) * 0.5, d = k * r; g.fillStyle = k < 0.25 ? 'rgba(255,220,180,0.7)' : `rgba(${150 + hash(i) * 80},${170 + hash(i * 3) * 60},255,0.55)`; g.fillRect(Math.cos(a) * d, Math.sin(a) * d, 2.2, 2.2); }
  g.restore();
}
function cosmicWeb(g, t, a = 1) {
  const c = LAYER('web', W, H, (q) => { q.fillStyle = '#02030a'; q.fillRect(0, 0, W, H); const r = rng(99), pts = []; for (let i = 0; i < 70; i++) pts.push([r() * W, r() * H]);
    q.globalCompositeOperation = 'lighter'; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < 230) { q.strokeStyle = `rgba(140,120,255,${0.35 * (1 - d / 230)})`; q.lineWidth = 3; q.beginPath(); q.moveTo(pts[i][0], pts[i][1]); q.lineTo(pts[j][0], pts[j][1]); q.stroke(); } }
    for (const p of pts) glow(q, p[0], p[1], 40 + r() * 50, 'rgba(255,200,240,0.5)'); }, { blur: 2 });
  g.globalAlpha = a; g.drawImage(c, 0, 0); g.globalAlpha = 1;
}
// the black hole that should have formed over your head (u 0..1 grows, then collapses away)
function blackHole(g, x, y, r, t, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a;
  g.globalCompositeOperation = 'lighter'; g.translate(x, y);
  for (let k = 0; k < 3; k++) { g.save(); g.rotate(t * (1.6 + k * 0.5)); g.scale(1, 0.32); g.strokeStyle = `rgba(255,${150 + k * 40},80,${0.5 - k * 0.12})`; g.lineWidth = r * (0.35 - k * 0.08); g.beginPath(); g.arc(0, 0, r * (1.45 + k * 0.32), 0, Math.PI * 2); g.stroke(); g.restore(); }
  glow(g, 0, 0, r * 2.4, 'rgba(255,170,90,0.4)');
  g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000000'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,220,170,0.9)'; g.lineWidth = r * 0.06; g.beginPath(); g.arc(0, 0, r * 1.03, 0, Math.PI * 2); g.stroke();
  g.restore();
}
/* ---------- school ---------- */
function studentDesk(g, x, y, s, o = {}) {
  // desk top and legs (seen from the side, the student faces left), and a chair behind
  g.fillStyle = '#5a5f6a'; g.fillRect(x - 120 * s, y - 170 * s, 8 * s, 170 * s); g.fillRect(x + 40 * s, y - 170 * s, 8 * s, 170 * s);
  box(g, x - 150 * s, y - 190 * s, 230 * s, 22 * s, '#c79a6a', { r: 4 * s });
  if (o.paper) { g.fillStyle = '#f7f5ee'; g.save(); g.translate(x - 60 * s, y - 192 * s); g.scale(1, 0.35); g.fillRect(-60 * s, -40 * s, 120 * s, 80 * s); g.restore(); }
}
function chair(g, x, y, s) { g.fillStyle = '#3f6f9f'; rr(g, x - 50 * s, y - 128 * s, 100 * s, 18 * s, 6 * s); g.fill(); rr(g, x + 34 * s, y - 250 * s, 18 * s, 130 * s, 6 * s); g.fill(); g.fillStyle = '#5a5f6a'; g.fillRect(x - 44 * s, y - 112 * s, 7 * s, 112 * s); g.fillRect(x + 36 * s, y - 112 * s, 7 * s, 112 * s); }
function wallClock(g, x, y, r, sec, min = 0) {
  g.fillStyle = '#f7f4ec'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#2b2e38'; g.lineWidth = r * 0.1; g.stroke();
  g.fillStyle = '#2b2e38'; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.fillRect(x + Math.cos(a) * r * 0.78 - 2, y + Math.sin(a) * r * 0.78 - 2, 4, 4); }
  const hand = (a, L, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * L, y - Math.cos(a) * L); g.stroke(); };
  hand(min / 60 * Math.PI * 2 + 0.6, r * 0.5, r * 0.09, '#2b2e38'); hand(min / 60 * Math.PI * 2, r * 0.72, r * 0.06, '#2b2e38'); hand(sec / 60 * Math.PI * 2, r * 0.8, r * 0.03, '#e0483e');
}
// the test paper, close: 20 questions; filled = how many are answered (0..20), ticks: show the teacher's red ticks
function testPaper(g, x, y, s, filled, t, o = {}) {
  g.save(); g.translate(x, y); g.rotate(o.rot || -0.04); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 30; g.fillStyle = '#f9f7f0'; g.fillRect(-300, -400, 600, 800); g.shadowBlur = 0;
  txt(g, o.title || 'MATHS TEST · 20 QUESTIONS', -260, -340, `700 26px ${SANS}`, '#2b2e38', 'left'); g.fillStyle = '#c7cbd6'; g.fillRect(-260, -322, 520, 3);
  for (let i = 0; i < 20; i++) { const col = i < 10 ? 0 : 1, row = i % 10, qx = -260 + col * 270, qy = -280 + row * 64;
    txt(g, `${i + 1}.`, qx, qy, `600 22px ${SANS}`, '#6a6f7e', 'left');
    g.strokeStyle = '#dfe2ea'; g.lineWidth = 2; g.beginPath(); g.moveTo(qx + 40, qy + 6); g.lineTo(qx + 220, qy + 6); g.stroke();
    if (i < filled) { const ans = o.key ? o.key[i] : ['x = 4', '17', '3/8', '12π', 'y = 2x', '81', '−5', '0.25', '144', 'x = 9', '6', '√2', '7', '45°', '2.5', '1/3', '64', 'x = −2', '19', '100'][i]; txt(g, ans, qx + 50, qy, `italic 500 28px ${SERIF}`, o.key ? '#c0392b' : '#2b4fa0', 'left'); }
  }
  if (o.circle7) { const c = o.circle7; g.strokeStyle = `rgba(192,57,43,${c})`; g.lineWidth = 6; g.beginPath(); g.ellipse(-150, -280 + 6 * 64 - 8, 150 * c + 10, 40, -0.05, 0, Math.PI * 2 * c); g.stroke(); }
  if (o.score) txt(g, o.score, 180, -360, `700 64px ${SERIF}`, '#c0392b', 'center', o.scoreA ?? 1);
  g.restore();
}
/* ---------- the backyard: the hole, the tin, the coins ---------- */
function digHole(g, x, y, depth, t) {
  // dirt pile beside, the hole (an ellipse whose darkness grows with depth)
  const d = cl(depth);
  g.fillStyle = '#5a3d26'; g.beginPath(); g.ellipse(x + 230, y + 6, 40 + d * 120, 10 + d * 50, 0, Math.PI, 0); g.fill(); g.fillStyle = '#6f4c30'; g.beginPath(); g.ellipse(x + 220, y, 30 + d * 90, 8 + d * 36, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#3a2618'; g.beginPath(); g.ellipse(x, y + 10, 70 + d * 90, 14 + d * 22, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1f140c'; g.beginPath(); g.ellipse(x, y + 12, (70 + d * 90) * 0.75, (14 + d * 22) * 0.6, 0, 0, Math.PI * 2); g.fill();
}
function shovel(g, x, y, ang, s) { g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = '#7a5434'; g.fillRect(-6 * s, -260 * s, 12 * s, 260 * s); g.fillStyle = '#2b2e38'; rr(g, -26 * s, -282 * s, 52 * s, 22 * s, 8 * s); g.fill(); g.fillStyle = '#9aa3ad'; g.beginPath(); g.moveTo(-34 * s, 0); g.lineTo(34 * s, 0); g.lineTo(28 * s, 70 * s); g.quadraticCurveTo(0, 96 * s, -28 * s, 70 * s); g.closePath(); g.fill(); g.restore(); }
function tinBox(g, x, y, s, open, t, glint = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  // the lid: lifts and tips back on its hinge (drawn behind the body once it is up)
  const lid = () => { g.save(); g.translate(-160, -100); g.rotate(-open * 1.9); vgrad(g, 0, -22, 330, 26, [[0, '#9a7a5a'], [1, '#6a4c36']]); g.fillStyle = 'rgba(160,80,40,0.45)'; g.fillRect(40, -18, 60, 14); g.restore(); };
  if (open > 0.5) lid();
  // the tin body, rusty
  vgrad(g, -160, -100, 320, 160, [[0, '#8a6a4a'], [1, '#5a4030']]); g.fillStyle = 'rgba(160,80,40,0.45)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(-150 + hash(i * 3) * 300, -90 + hash(i * 7) * 140, 8 + hash(i) * 18, 0, Math.PI * 2); g.fill(); }
  if (open > 0) {
    // the opening, then a heap of gold coins rising over the rim
    g.fillStyle = '#2a1c10'; g.beginPath(); g.ellipse(0, -100, 152, 16, 0, 0, Math.PI * 2); g.fill();
    const r = rng(8), up = eOut(cl(open * 1.4));
    for (let i = 0; i < 70; i++) { const cx = -135 + r() * 270, k = 1 - (cx / 150) ** 2, cy = -98 - r() * 46 * k * up, gold = r(); g.fillStyle = gold > 0.6 ? '#f6cc3a' : gold > 0.25 ? '#e0ac22' : '#b8861a'; g.beginPath(); g.ellipse(cx, cy, 21, 12, (r() - 0.5) * 0.6, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(120,80,10,0.6)'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,255,230,0.5)'; g.beginPath(); g.ellipse(cx - 6, cy - 3, 8, 4, 0, 0, Math.PI * 2); g.fill(); }
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -120, 280, 'rgba(255,210,120,0.6)', open * glint);
    for (let i = 0; i < 7; i++) { const ph = (t * 0.7 + hash(i)) % 1; g.globalAlpha = Math.sin(ph * Math.PI) * open; g.fillStyle = '#fff6d6'; const sx = -120 + hash(i * 5) * 240, sy = -150 + hash(i * 9) * 50; g.beginPath(); g.moveTo(sx, sy - 18); g.lineTo(sx + 3, sy); g.lineTo(sx, sy + 18); g.lineTo(sx - 3, sy); g.fill(); g.beginPath(); g.moveTo(sx - 18, sy); g.lineTo(sx, sy + 3); g.lineTo(sx + 18, sy); g.lineTo(sx, sy - 3); g.fill(); } g.restore();
  }
  if (open <= 0.5) lid();
  g.restore();
}
/* ---------- the present and the headphones ---------- */
function present(g, x, y, s, open, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (open < 1) { const a = 1 - open; g.globalAlpha = 1; box(g, -90, -120, 180, 120, '#3f7fbf', { r: 6 }); g.fillStyle = '#f2c230'; g.fillRect(-14, -120, 28, 120); g.fillRect(-90, -72, 180, 24);
    g.save(); g.translate(0, -120 - open * 140); g.rotate(open * 0.8); box(g, -100, -30, 200, 34, '#4a8ad0', { r: 6 }); g.fillStyle = '#f2c230'; g.fillRect(-14, -30, 28, 34); g.beginPath(); g.ellipse(-30, -40, 30, 18, -0.4, 0, Math.PI * 2); g.ellipse(30, -40, 30, 18, 0.4, 0, Math.PI * 2); g.fill(); g.restore(); g.globalAlpha = 1; }
  else headphones(g, 0, -60, 1, t);
  g.restore();
}
function headphones(g, x, y, s, t) { g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = '#2f6fbf'; g.lineWidth = 18; g.beginPath(); g.arc(0, 0, 80, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); for (const d of [-1, 1]) { box(g, d * 80 - 26, -10, 52, 80, '#3f7fbf', { r: 20 }); g.fillStyle = '#1d2a4a'; rr(g, d * 80 - 18, 0, 36, 60, 14); g.fill(); } g.restore(); }
/* ---------- a TV set (the movie, the news) ---------- */
function tvSet(g, x, y, w, h, fn) { box(g, x - 16, y - 16, w + 32, h + 32, '#16171f', { r: 10 }); g.save(); rr(g, x, y, w, h, 6); g.clip(); fn(g); g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.5, y); g.lineTo(x, y + h * 0.7); g.fill(); g.restore(); }
/* ---------- vehicles: a news van, the black car ---------- */
function newsVan(g, x, y, s, col, label, f = 1, dish = 1) {
  g.save(); g.translate(x, y); g.scale(s * f, s);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 4, 230, 16, 0, 0, Math.PI * 2); g.fill();
  box(g, -220, -230, 380, 210, '#f1efe9', { r: 14 }); box(g, 150, -170, 80, 150, '#e6e3dc', { r: 12 }); g.fillStyle = '#a9c4d6'; g.beginPath(); g.moveTo(160, -160); g.lineTo(205, -160); g.lineTo(225, -100); g.lineTo(160, -100); g.fill();
  g.fillStyle = col; g.fillRect(-220, -120, 380, 40); g.save(); g.scale(f, 1); txt(g, label, f > 0 ? -30 : 30, -134, `700 40px ${COND}`, col); g.restore();
  for (const wx of [-140, 150]) { g.fillStyle = '#16171f'; g.beginPath(); g.arc(wx, -18, 32, 0, Math.PI * 2); g.fill(); g.fillStyle = '#8a8f9a'; g.beginPath(); g.arc(wx, -18, 14, 0, Math.PI * 2); g.fill(); }
  // the satellite dish on its mast
  g.fillStyle = '#b9bec6'; g.fillRect(-60, -230 - 120 * dish, 10, 120 * dish); g.save(); g.translate(-55, -240 - 120 * dish); g.rotate(-0.5); g.fillStyle = '#e6e8ec'; g.beginPath(); g.ellipse(0, 0, 60, 22, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c4c8ce'; g.beginPath(); g.ellipse(0, 4, 50, 14, 0, 0, Math.PI * 2); g.fill(); g.restore();
  g.restore();
}
function blackCar(g, x, y, s, f, lights, t) {
  g.save(); g.translate(x, y); g.scale(s * f, s);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(0, 4, 240, 16, 0, 0, Math.PI * 2); g.fill();
  const gr = g.createLinearGradient(0, -130, 0, 0); gr.addColorStop(0, '#2a2d38'); gr.addColorStop(1, '#0b0c12'); g.fillStyle = gr;
  g.beginPath(); g.moveTo(-230, -22); g.lineTo(-226, -70); g.lineTo(-120, -80); g.lineTo(-70, -132); g.lineTo(90, -132); g.lineTo(150, -80); g.lineTo(228, -70); g.lineTo(232, -22); g.closePath(); g.fill();
  g.fillStyle = '#10131c'; g.beginPath(); g.moveTo(-58, -122); g.lineTo(10, -122); g.lineTo(10, -86); g.lineTo(-100, -86); g.closePath(); g.fill(); g.beginPath(); g.moveTo(20, -122); g.lineTo(84, -122); g.lineTo(130, -86); g.lineTo(20, -86); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(160,190,255,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-226, -70); g.lineTo(228, -70); g.stroke();
  for (const wx of [-140, 140]) { g.fillStyle = '#05060a'; g.beginPath(); g.arc(wx, -18, 34, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4a4f5a'; g.beginPath(); g.arc(wx, -18, 15, 0, Math.PI * 2); g.fill(); }
  if (lights) { g.fillStyle = '#fff6dc'; g.fillRect(214, -64, 18, 12); g.fillStyle = '#ff3a2a'; g.fillRect(-232, -64, 12, 14); g.restore(); g.save(); g.globalCompositeOperation = 'lighter'; const hx = x + f * 232 * s, hy = y - 58 * s; glow(g, hx, hy, 120 * s, 'rgba(255,245,220,0.9)', lights); const bm = g.createLinearGradient(hx, 0, hx + f * 900 * s, 0); bm.addColorStop(0, `rgba(255,245,220,${0.35 * lights})`); bm.addColorStop(1, 'rgba(255,245,220,0)'); g.fillStyle = bm; g.beginPath(); g.moveTo(hx, hy - 10 * s); g.lineTo(hx + f * 900 * s, hy - 120 * s); g.lineTo(hx + f * 900 * s, hy + 120 * s); g.closePath(); g.fill(); }
  g.restore();
}
/* ---------- the choice: option cards ---------- */
function optionCard(g, x, y, w, h, title, sub, odds, a, o = {}) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.translate(x, y); const s = (0.85 + 0.15 * a) * (o.scale ?? 1); g.scale(s, s);
  g.shadowColor = o.glow ? 'rgba(255,255,255,0.8)' : 'rgba(120,200,255,0.5)'; g.shadowBlur = o.glow ? 40 : 22; g.fillStyle = KN.glass; rr(g, -w / 2, -h / 2, w, h, 16); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = o.glow ? 'rgba(255,255,255,0.95)' : KN.cyanA + '0.85)'; g.lineWidth = o.glow ? 3 : 2; rr(g, -w / 2, -h / 2, w, h, 16); g.stroke();
  txt(g, title, 0, -h / 2 + 64, `700 46px ${SERIF}`, '#ffffff'); txt(g, sub, 0, -h / 2 + 108, `600 22px ${SANS}`, KN.cyan);
  if (odds) txt(g, odds, 0, h / 2 - 44, `700 64px ${SERIF}`, o.oddsCol || PAL.amber);
  if (o.strike) { g.strokeStyle = `rgba(224,72,62,${o.strike})`; g.lineWidth = 8; g.beginPath(); g.moveTo(-w / 2 + 30, -h / 2 + 50); g.lineTo(-w / 2 + 30 + (w - 60) * o.strike, h / 2 - 50); g.stroke(); }
  g.restore();
}
/* ---------- the note under the pillow ---------- */
function note(g, x, y, s, rot, a = 1) { g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(s, s); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 20; g.fillStyle = '#f7f1e2'; g.fillRect(-150, -90, 300, 180); g.shadowBlur = 0; g.strokeStyle = 'rgba(0,0,0,0.1)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -90); g.lineTo(0, 90); g.stroke();
  g.fillStyle = 'rgba(160,190,220,0.4)'; for (let k = 0; k < 5; k++) g.fillRect(-140, -50 + k * 30, 280, 2);
  txt(g, 'For me.', -120, -20, `italic 600 40px ${SERIF}`, '#2b4fa0', 'left'); txt(g, 'Read this when…', -120, 40, `italic 500 30px ${SERIF}`, '#2b4fa0', 'left'); g.restore(); }
/* ---------- news paper (the Friday montage) ---------- */
function newspaper(g, x, y, s, rot, head, sub, seed) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.fillStyle = '#f1ece0'; g.fillRect(-420, -300, 840, 600); g.shadowBlur = 0;
  txt(g, 'THE DAILY HERALD', 0, -240, `700 46px ${SERIF}`, '#1d1d24'); g.fillStyle = '#1d1d24'; g.fillRect(-390, -220, 780, 4); g.fillRect(-390, -212, 780, 1.5);
  txt(g, head, 0, -140, `800 64px ${COND}`, '#111116'); txt(g, sub, 0, -88, `italic 500 30px ${SERIF}`, '#333340');
  g.fillStyle = '#c9c2b2'; g.fillRect(-390, -60, 360, 300); drawStick(g, { x: -210, y: 220, h: 230, f: 1, col: HERO, p: pose(POSES.relaxed), mouth: 'smile', shadow: false });
  const r = rng(seed); g.fillStyle = 'rgba(40,40,50,0.35)'; for (let k = 0; k < 14; k++) g.fillRect(10, -50 + k * 20, 360 - r() * 60, 6);
  g.restore();
}
/* ---------- text flood (3 a.m.: the universe never goes quiet) ---------- */
const FLOOD = ['HEARTBEATS ON EARTH · 10,140,000,000 / SECOND', 'STORM · BAY OF BENGAL · 140 KM/H', 'STAR DYING · NGC 4414 · NOW', 'BIRTHS THIS MINUTE · 253', 'LIGHTNING STRIKES · 44 / SECOND', 'A WHALE SINGS · NORTH PACIFIC', 'SUPERNOVA · 3.2 BILLION LY', 'RAIN · LIMA · 2 MM', 'EARTHQUAKE · M4.1 · CHILE', 'NEUTRINOS THROUGH YOU · 60 BILLION / CM² / S', 'SOMEONE LAUGHS · OSAKA', 'A LEAF FALLS · ONTARIO', 'GALAXY COLLISION · ANTENNAE', 'AURORA · TROMSØ', 'A DOOR SLAMS · CAIRO', 'COMET · 0.83 AU'];
function textFlood(g, t, amt, seed = 1) {
  if (amt <= 0) return; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const n = Math.floor(18 + amt * 70);
  for (let i = 0; i < n; i++) { const sp = 20 + hash(seed + i * 3) * 60, y = (hash(seed + i * 7) * (H + 80) - t * sp * (hash(i) > 0.5 ? 1 : -0.6)) % (H + 80); const yy = y < -40 ? y + H + 80 : y;
    const x = hash(seed + i * 11) * W, s = 13 + hash(i * 5) * 9; g.globalAlpha = amt * (0.25 + 0.5 * hash(i * 13)); g.font = `600 ${s}px ${SANS}`; g.fillStyle = hash(i * 17) > 0.8 ? PAL.amber : KN.cyan; g.textAlign = 'left'; g.fillText(FLOOD[i % FLOOD.length], x - 200, yy); }
  g.globalAlpha = 1; g.restore();
}
