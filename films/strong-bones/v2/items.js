/* =====================================================================
   ITEMS (v2) — the story's objects, drawn live: alarm clock (and its explosion), jar + lid, mug, barbell, egg,
   phone feed, billboard, scaffold tower, x-ray forearm, TV broadcast.
   ===================================================================== */

// ---------- alarm clock (x, y = bottom centre), ring = shake amount; burst = seconds since the slap (<0: intact) ----------
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
function drawJar(g, x, y, s, broken) {
  const w = 60 * s, h = 92 * s, rim = 16 * s;
  g.fillStyle = '#8e1d2a'; rr(g, x - w / 2 + 4 * s, y - h * 0.68, w - 8 * s, h * 0.66, 6 * s); g.fill();
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(200,40,60,0.6)'; g.beginPath(); g.arc(x - w * 0.3 + (i % 3) * w * 0.3, y - h * 0.18 - Math.floor(i / 3) * h * 0.2, 9 * s, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#efe4c8'; g.fillRect(x - w / 2 + 2 * s, y - h * 0.5, w - 4 * s, 24 * s);
  txt(g, 'CHERRY', x, y - h * 0.5 + 17 * s, `700 ${13 * s}px ${SERIF}`, '#7a1c22');
  g.strokeStyle = 'rgba(230,245,250,0.9)'; g.lineWidth = 3 * s; g.fillStyle = 'rgba(210,235,240,0.18)';
  const top = broken ? y - h + rim : y - h;
  g.beginPath(); g.moveTo(x - w / 2, top); g.lineTo(x - w / 2, y - 6 * s); g.quadraticCurveTo(x - w / 2, y, x - w / 2 + 6 * s, y); g.lineTo(x + w / 2 - 6 * s, y); g.quadraticCurveTo(x + w / 2, y, x + w / 2, y - 6 * s); g.lineTo(x + w / 2, top); g.fill(); g.stroke();
  if (broken) { g.beginPath(); g.moveTo(x - w / 2, top); for (let i = 1; i <= 8; i++) g.lineTo(x - w / 2 + (w * i) / 8, top - (i % 2 ? 7 : 2) * s); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x - w / 2 + 6 * s, top + 6 * s, 5 * s, h * 0.5);
}
function drawLid(g, x, y, s, withRim, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const w = 66 * s, rim = 16 * s;
  if (withRim) {
    g.strokeStyle = 'rgba(230,245,250,0.9)'; g.lineWidth = 3 * s; g.fillStyle = 'rgba(210,235,240,0.22)';
    g.beginPath(); g.moveTo(-w / 2 + 3 * s, 10 * s); g.lineTo(-w / 2 + 3 * s, 10 * s + rim);
    for (let i = 1; i <= 8; i++) g.lineTo(-w / 2 + 3 * s + ((w - 6 * s) * i) / 8, 10 * s + rim + (i % 2 ? 7 : 2) * s);
    g.lineTo(w / 2 - 3 * s, 10 * s); g.closePath(); g.fill(); g.stroke();
  }
  const gr = g.createLinearGradient(0, 0, 0, 14 * s); gr.addColorStop(0, '#f0d27a'); gr.addColorStop(1, '#a8862f'); g.fillStyle = gr; rr(g, -w / 2, 0, w, 14 * s, 4 * s); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5 * s; for (let i = -7; i <= 7; i++) { g.beginPath(); g.moveTo(i * 4 * s, 3 * s); g.lineTo(i * 4 * s, 12 * s); g.stroke(); }
  g.restore();
}
function drawMug(g, x, y, s, handle = true, body = true, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  if (body) { const gr = g.createLinearGradient(-30 * s, 0, 30 * s, 0); gr.addColorStop(0, '#d8d0c0'); gr.addColorStop(0.6, '#f4efe4'); gr.addColorStop(1, '#cfc6b6'); g.fillStyle = gr; rr(g, -30 * s, -70 * s, 60 * s, 70 * s, 8 * s); g.fill();
    g.fillStyle = PAL.hero; g.fillRect(-30 * s, -52 * s, 60 * s, 9 * s); g.fillStyle = '#3a2416'; g.beginPath(); g.ellipse(0, -68 * s, 26 * s, 4 * s, 0, 0, Math.PI * 2); g.fill(); }
  if (handle) { g.strokeStyle = '#ece5d7'; g.lineWidth = 9 * s; g.beginPath(); g.arc(30 * s, -38 * s, 17 * s, -Math.PI / 2, Math.PI / 2); g.stroke(); }
  g.restore();
}
function steam(g, x, y, s, t) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 5 * s; for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i < 12; i++) { const yy = y - i * 8 * s, xx = x + (k - 1) * 14 * s + Math.sin(t * 3 + i * 0.6 + k) * 6 * s; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); } }
// coffee splash + shards (u = seconds since it hit)
function smash(g, x, y, s, u, seed = 5, liquid = '#5a3622') {
  const r = rng(seed);
  for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.05 + 0.9 * r()), v = (200 + r() * 500) * s, tt = Math.min(u, 0.9);
    const px = x + Math.cos(a) * v * tt, py = Math.min(y, y + Math.sin(a) * v * tt + 1600 * s * tt * tt);
    g.fillStyle = i % 3 ? liquid : '#efe8dc'; g.beginPath(); g.arc(px, py, (i % 3 ? 7 : 9) * s * (1 - tt * 0.3), 0, Math.PI * 2); g.fill(); }
  g.fillStyle = liquid; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(x, y, Math.min(1, u * 4) * 90 * s, 10 * s, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
}

// ---------- barbell (front view: x, y = shaft centre), plates colours; bend = flex ----------
function drawBar(g, x, y, s, bend = 0, o = {}) {
  g.strokeStyle = '#d8dbe0'; g.lineWidth = 10 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 340 * s, y + bend * 12 * s); g.quadraticCurveTo(x, y - bend * 22 * s, x + 340 * s, y + bend * 12 * s); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x - 330 * s, y - 3 * s + bend * 12 * s); g.quadraticCurveTo(x, y - 3 * s - bend * 22 * s, x + 330 * s, y - 3 * s + bend * 12 * s); g.stroke();
  const cols = ['#c0392b', '#2f6fbf', '#e0b030', '#3a9a52', '#c0392b'];
  for (const sd of [-1, 1]) for (let k = 0; k < (o.plates ?? 5); k++) {
    const px = x + sd * (232 + k * 21) * s, r = (112 - k * 9) * s, yy = y + bend * 10 * s;
    const gr = g.createLinearGradient(px - 10 * s, 0, px + 10 * s, 0); gr.addColorStop(0, shade(cols[k], -0.35)); gr.addColorStop(0.5, cols[k]); gr.addColorStop(1, shade(cols[k], -0.2));
    g.fillStyle = gr; rr(g, px - 10 * s, yy - r, 20 * s, 2 * r, 6 * s); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(px - 6 * s, yy - r + 8 * s, 3 * s, 2 * r - 16 * s);
  }
  g.fillStyle = '#9aa0a8'; for (const sd of [-1, 1]) g.fillRect(x + sd * 218 * s - 5 * s, y - 16 * s + bend * 10 * s, 10 * s, 32 * s);
}

// ---------- egg held in fingertips (u: 0..1 squeeze), ok: stays whole ----------
function eggHeld(g, x, y, s, u, t) {
  const gr = g.createRadialGradient(x - 20 * s, y - 40 * s, 8 * s, x, y, 90 * s); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#d9c9ad');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 62 * s, 82 * s, 0, 0, Math.PI * 2); g.fill();
  const tr = noise(t * 18, 4) * 4 * s * u;
  for (const [dx, dy] of [[-70, -10], [70, -16], [-56, 44], [60, 40]]) { g.fillStyle = PAL.ink; g.beginPath(); g.arc(x + dx * s * (1 - u * 0.08) + tr, y + dy * s, 30 * s, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = PAL.hero; g.lineWidth = 70 * s; g.beginPath(); g.moveTo(x - 140 * s, y + 260 * s); g.lineTo(x - 90 * s, y + 70 * s); g.moveTo(x + 140 * s, y + 260 * s); g.lineTo(x + 90 * s, y + 70 * s); g.stroke();
}

// ---------- phone with the social feed ----------
function phoneFeed(g, x, y, s, t, u) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#0d0e14'; rr(g, -190, -390, 380, 780, 46); g.fill(); g.fillStyle = '#1b1d28'; rr(g, -176, -376, 352, 752, 36); g.fill();
  g.save(); rr(g, -176, -376, 352, 752, 36); g.clip();
  vgrad(g, -176, -376, 352, 752, [[0, '#14151d'], [1, '#1d1f2b']]);
  txt(g, '#GlassHercules', -150, -320, `700 30px ${SANS}`, '#ffffff', 'left');
  // the video card (scrolls up)
  const sc = -eOut(u) * 160;
  vgrad(g, -160, -290 + sc, 320, 400, [[0, '#2b2050'], [1, '#c77a4a']]);
  g.fillStyle = PAL.ink; g.beginPath(); g.arc(0, -150 + sc, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = PAL.hero; rr(g, -18, -126 + sc, 36, 80, 10); g.fill();
  g.strokeStyle = '#d8dbe0'; g.lineWidth = 6; g.beginPath(); g.moveTo(-120, -200 + sc); g.lineTo(120, -200 + sc); g.stroke(); g.fillStyle = '#c0392b'; for (const d of [-1, 1]) rr(g, d * 110 - 9, -250 + sc, 18, 100, 5), g.fill();
  g.strokeStyle = PAL.ink; g.lineWidth = 12; g.beginPath(); g.moveTo(-14, -120 + sc); g.lineTo(-60, -196 + sc); g.moveTo(14, -120 + sc); g.lineTo(60, -196 + sc); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(-24, -110 + sc + 140); g.lineTo(28, -84 + sc + 140); g.lineTo(-24, -58 + sc + 140); g.fill();
  const views = (2.1 + 10.3 * eOut(u)).toFixed(1);
  txt(g, `${views}M views · “he lifted 570 kg like it was glass”`, -150, 150 + sc, `600 19px ${SANS}`, '#e9e4da', 'left');
  for (let i = 0; i < 3; i++) { g.fillStyle = '#2a2c3a'; rr(g, -160, 190 + sc + i * 110, 320, 90, 14); g.fill(); g.fillStyle = ['#e0483e', '#f2c230', '#2fa79a'][i]; g.beginPath(); g.arc(-120, 235 + sc + i * 110, 24, 0, Math.PI * 2); g.fill();
    txt(g, ['GLASS HERCULES!!', 'my bones hurt watching this', 'he opened a jar and the jar opened HIM'][i], -84, 230 + sc + i * 110, `600 18px ${SANS}`, '#ffffff', 'left'); txt(g, ['1.2M likes', '842K likes', '611K likes'][i], -84, 258 + sc + i * 110, `500 15px ${SANS}`, '#9aa0b0', 'left'); }
  g.restore();
  // hearts floating up
  for (let i = 0; i < 8; i++) { const ph = (t * 0.9 + hash(i) ) % 1; g.globalAlpha = 1 - ph; g.fillStyle = '#ff4d6d'; const hx = 150 + hash(i * 3) * 40, hy = 200 - ph * 420; g.beginPath(); g.arc(hx - 8, hy, 10, Math.PI, 0); g.arc(hx + 8, hy, 10, Math.PI, 0); g.lineTo(hx, hy + 20); g.closePath(); g.fill(); }
  g.globalAlpha = 1; g.restore();
}

// ---------- scaffold tower: pivot (x, y) = the base corner it tips over; leans to the left by leanDeg ----------
function scaffoldTower(g, x, y, s, leanDeg, t, o = {}) {
  const a = -leanDeg * Math.PI / 180, w = 260 * s, h = 820 * s;
  g.save(); g.translate(x, y); g.rotate(a);
  g.lineCap = 'round';
  for (const xx of [0, w]) { g.strokeStyle = '#7d848e'; g.lineWidth = 12 * s; g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, -h); g.stroke(); g.strokeStyle = '#c7ccd3'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(xx - 3 * s, 0); g.lineTo(xx - 3 * s, -h); g.stroke(); }
  for (let k = 0; k <= 5; k++) { const yy = -k * h / 5; g.strokeStyle = '#8a9099'; g.lineWidth = 9 * s; g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); if (k < 5) { g.lineWidth = 6 * s; g.beginPath(); g.moveTo(k % 2 ? 0 : w, yy); g.lineTo(k % 2 ? w : 0, yy - h / 5); g.stroke(); } }
  for (let k = 1; k <= 5; k++) { const yy = -k * h / 5; const gr = g.createLinearGradient(0, yy - 12 * s, 0, yy + 4 * s); gr.addColorStop(0, '#c9935a'); gr.addColorStop(1, '#8a5f33'); g.fillStyle = gr; g.fillRect(-14 * s, yy - 12 * s, w + 28 * s, 14 * s); }
  // safety netting on the top two bays
  g.fillStyle = 'rgba(47,111,176,0.5)'; g.fillRect(6 * s, -h, w - 12 * s, 2 * h / 5 - 16 * s);
  g.strokeStyle = 'rgba(160,200,240,0.35)'; g.lineWidth = 2 * s; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(6 * s + i * 21 * s, -h); g.lineTo(6 * s + i * 21 * s, -h + 2 * h / 5 - 16 * s); g.stroke(); }
  // a clamp near the base (the one that shears)
  if (o.clamp !== false) { g.fillStyle = '#5a6068'; rr(g, -14 * s, -h / 5 - 18 * s, 28 * s, 30 * s, 5 * s); g.fill(); }
  // tool buckets + planks on top, they slide off as it tips
  g.restore();
  for (let i = 0; i < 3; i++) {
    const f = cl((leanDeg - 6 - i * 3) / 16), bx0 = 40 * s + i * 80 * s, by0 = -h - 26 * s;
    let px = x + bx0 * Math.cos(a) - by0 * Math.sin(a), py = y + bx0 * Math.sin(a) + by0 * Math.cos(a);
    px -= f * 300 * s; py += f * f * 700 * s;
    if (py < y - 10 * s) { g.save(); g.translate(px, py); g.rotate(a - f * 4); g.fillStyle = ['#e0b030', '#3a3f46', '#c0392b'][i]; rr(g, -22 * s, -30 * s, 44 * s, 40 * s, 6 * s); g.fill(); g.strokeStyle = '#2a2a30'; g.lineWidth = 3 * s; g.beginPath(); g.arc(0, -30 * s, 18 * s, Math.PI, 0); g.stroke(); g.restore(); }
  }
}
// the point on the scaffold's left upright at height-fraction k (0 base, 1 top)
function scaffoldPt(x, y, s, leanDeg, k) { const a = -leanDeg * Math.PI / 180, yy = -k * 820 * s; return [x - yy * Math.sin(a), y + yy * Math.cos(a)]; }

// ---------- x-ray forearm: (x, y) centre, rot, scale; crack 0..1 (hairline cracks glow in), snap: full break ----------
function xrayArm(g, x, y, s, rot, crack, t, o = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = 'rgba(120,190,255,0.22)'; rr(g, -120, -470, 240, 940, 110); g.fill();
  g.fillStyle = 'rgba(150,210,255,0.12)'; rr(g, -150, 300, 300, 260, 120); g.fill();
  const bone = (bx, w) => { const gr = g.createLinearGradient(bx - w, 0, bx + w, 0); gr.addColorStop(0, '#9cc8ee'); gr.addColorStop(0.5, '#f2f9ff'); gr.addColorStop(1, '#9cc8ee'); g.fillStyle = gr;
    rr(g, bx - w, -400, 2 * w, 720, w); g.fill(); g.beginPath(); g.ellipse(bx, -400, w * 1.5, w * 1.1, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(bx, 320, w * 1.6, w * 1.1, 0, 0, Math.PI * 2); g.fill(); };
  bone(-42, 20); bone(40, 17);
  g.fillStyle = '#d9ecfb'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(-60 + (i % 4) * 40, 370 + Math.floor(i / 4) * 34, 15, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 4; i++) { rr(g, -66 + i * 42, 420, 22, 140, 10); g.fill(); }
  if (crack > 0) {
    g.strokeStyle = o.snap ? '#ff4433' : '#ff6a4a'; g.lineJoin = 'round'; g.lineCap = 'round';
    const cr = [[-42, -140, 1], [40, 60, 0.6], [-42, 180, 0.35], [40, -260, 0.8]];
    for (const [bx, by, th] of cr) { if (crack < 1 - th) continue; const u = cl((crack - (1 - th)) / th);
      g.lineWidth = o.snap ? 12 : 5; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 9); g.beginPath(); g.moveTo(bx - 22, by - 4); const n = 5; for (let i = 1; i <= n * u; i++) g.lineTo(bx - 22 + 44 * i / n, by + (i % 2 ? 8 : -8)); g.stroke(); g.globalAlpha = 1;
      g.globalCompositeOperation = 'lighter'; glow(g, bx, by, 60, 'rgba(255,90,60,0.5)', u); g.globalCompositeOperation = 'source-over'; }
  }
  g.restore();
}

// ---------- the TV broadcast (inside rect x, y, w, h) ----------
function tvBroadcast(g, x, y, w, h, t) {
  g.save(); rr(g, x, y, w, h, 10); g.clip();
  vgrad(g, x, y, w, h, [[0, '#1d2a4a'], [1, '#0d1222']]);
  // podium with the rival (red) on top, gold medal glinting
  const cx = x + w * 0.5, base = y + h * 0.78;
  for (const [dx, hh, n] of [[-0.22, 0.12, '2'], [0, 0.2, '1'], [0.22, 0.08, '3']]) { box(g, cx + dx * w - w * 0.1, base - hh * h, w * 0.2, hh * h, '#e9e4da', { r: 4 }); txt(g, n, cx + dx * w, base - hh * h + 40, `700 34px ${SERIF}`, '#7a7a8a'); }
  drawStick(g, { x: cx, y: base - 0.2 * h, h: h * 0.42, f: 1, col: RIVAL, p: pose(POSES.cheer), mouth: 'smile', rim: 1, rimCol: '#ffe2a8' });
  g.fillStyle = '#f2c230'; g.beginPath(); g.arc(cx + 6, base - 0.2 * h - h * 0.42 * 0.58, 12, 0, Math.PI * 2); g.fill();
  for (const dx of [-0.22, 0.22]) drawStick(g, { x: cx + dx * w, y: base - (dx < 0 ? 0.12 : 0.08) * h, h: h * 0.4, f: dx < 0 ? 1 : -1, col: GREY, mouth: 'flat' });
  for (let i = 0; i < 30; i++) { const ph = (t * 0.25 + hash(i)) % 1; g.fillStyle = ['#f2c230', '#e0483e', '#2fa79a', '#ffffff'][i % 4]; g.fillRect(x + hash(i * 3) * w, y + ph * h, 8, 4); }
  // lower third + ticker
  g.fillStyle = 'rgba(10,14,28,0.88)'; g.fillRect(x, y + h * 0.8, w, h * 0.2); g.fillStyle = '#c0392b'; g.fillRect(x, y + h * 0.8, w * 0.2, h * 0.11);
  txt(g, 'LIVE', x + w * 0.1, y + h * 0.875, `700 ${h * 0.055}px ${SANS}`, '#fff');
  txt(g, 'GOLD · ARANDA', x + w * 0.23, y + h * 0.88, `700 ${h * 0.07}px ${SERIF}`, '#ffffff', 'left');
  const tick = 'GLASS HERCULES WALKS OFF IN FINAL · CATCHES FALLING SCAFFOLD · SISTER UNHURT · BOTH ARMS BROKEN · ';
  g.save(); g.beginPath(); g.rect(x, y + h * 0.92, w, h * 0.08); g.clip(); g.fillStyle = '#f2c230'; g.fillRect(x, y + h * 0.92, w, h * 0.08);
  g.font = `700 ${h * 0.045}px ${SANS}`; const tw = g.measureText(tick).width; const off = (t * 160) % tw; txt(g, tick + tick, x + w - off - tw * 0.4, y + h * 0.975, `700 ${h * 0.045}px ${SANS}`, '#191a26', 'left'); g.restore();
  // scanlines + glare
  g.globalAlpha = 0.06; g.fillStyle = '#000'; for (let yy = y; yy < y + h; yy += 4) g.fillRect(x, yy, w, 2); g.globalAlpha = 1;
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.5, y); g.lineTo(x, y + h * 0.7); g.fill();
  g.restore();
}

// speed lines across the frame (screen space)
function speedLines(g, t, a, dir = 1) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = `rgba(255,255,255,${0.5 * a})`;
  for (let i = 0; i < 40; i++) { const y = hash(i * 13) * H, L = 200 + hash(i * 7) * 600, x = ((hash(i * 3) * W * 2 - t * 3200 * dir) % (W * 2) + W * 2) % (W * 2) - W * 0.5; g.lineWidth = 2 + hash(i) * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y); g.stroke(); }
}
// stadium camera flashes (screen space region)
function flashes(g, t, a, y0 = 300, y1 = 760) {
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { const k = Math.floor(t * 7 + i * 0.37), on = hash(k * 31 + i) > 0.7; if (!on) continue; const x = hash(k * 7 + i) * W, y = y0 + hash(k * 13 + i) * (y1 - y0); glow(g, x, y, 50, 'rgba(255,255,255,0.95)', a); }
  g.globalCompositeOperation = 'source-over';
}
// confetti falling (screen space)
function confetti(g, t, t0, a = 1) {
  const u = t - t0; if (u < 0) return;
  for (let i = 0; i < 160; i++) { const x = hash(i * 5) * W + Math.sin(u * 2 + i) * 30, y = -40 + ((hash(i * 9) * 300 + u * (180 + hash(i) * 160))), r = u * 4 + i; if (y > H + 20) continue;
    g.save(); g.translate(x, y); g.rotate(r); g.globalAlpha = a; g.fillStyle = ['#f2c230', '#e0483e', '#2fa79a', '#ffffff', '#3f7fbf'][i % 5]; g.fillRect(-7, -3, 14, 6); g.restore(); }
  g.globalAlpha = 1;
}
// arms up in the crowd (cheering), drawn over the cached crowd rows in set space
function crowdArms(g, t, amt, y0 = 380, rows = 9, rowH = 42, s = 0.8) {
  if (amt <= 0) return;
  const r = rng(92);
  g.strokeStyle = PAL.ink; g.lineCap = 'round';
  for (let k = 0; k < rows; k++) { const y = y0 + k * rowH, sc = s * (1 + k * 0.06); for (let x = LX + r() * 30; x < LX + LW; x += (50 + r() * 60) * sc) {
    if (r() > amt) continue; const ph = r() * 6, up = 0.5 + 0.5 * Math.sin(t * 9 + ph); g.lineWidth = 6 * sc; g.globalAlpha = 0.9;
    g.beginPath(); g.moveTo(x - 8 * sc, y - 20 * sc); g.lineTo(x - 18 * sc, y - (40 + up * 22) * sc); g.moveTo(x + 8 * sc, y - 20 * sc); g.lineTo(x + 18 * sc, y - (40 + up * 22) * sc); g.stroke(); } }
  g.globalAlpha = 1;
}
