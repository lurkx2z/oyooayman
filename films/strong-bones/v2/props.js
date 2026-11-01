/* =====================================================================
   PROPS (v2) — painted building blocks for the sets: walls with soft light, windows, furniture, shelves, plants,
   buildings, trees, cars, crowds. Everything is drawn with gradients and a light direction so nothing is flat.
   All deterministic (seeded rng). Used once when a set's layers are cached, so detail costs nothing per frame.
   ===================================================================== */

// a lit box: front face with a vertical gradient, a lighter top edge and a darker side
function box(g, x, y, w, h, col, o = {}) {
  const top = o.top ?? 0, side = o.side ?? 0, r = o.r ?? 4;
  if (side) { g.fillStyle = shade(col, -0.35); g.beginPath(); g.moveTo(x + w, y); g.lineTo(x + w + side, y - top); g.lineTo(x + w + side, y + h - top); g.lineTo(x + w, y + h); g.closePath(); g.fill(); }
  if (top) { g.fillStyle = shade(col, 0.18); g.beginPath(); g.moveTo(x, y); g.lineTo(x + side, y - top); g.lineTo(x + w + side, y - top); g.lineTo(x + w, y); g.closePath(); g.fill(); }
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, shade(col, o.lit ?? 0.08)); gr.addColorStop(1, shade(col, -(o.dark ?? 0.18)));
  g.fillStyle = gr; rr(g, x, y, w, h, r); g.fill();
  if (o.edge !== false) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + r, y, w - 2 * r, 2); }
}
// a soft ambient-occlusion band (darkening near a junction), dir: 'down' darkens below y, 'up' above y
function ao(g, x, y, w, h, dir = 'down', a = 0.35) {
  const gr = dir === 'down' ? g.createLinearGradient(0, y, 0, y + h) : g.createLinearGradient(0, y, 0, y - h);
  gr.addColorStop(0, `rgba(10,6,20,${a})`); gr.addColorStop(1, 'rgba(10,6,20,0)'); g.fillStyle = gr;
  if (dir === 'down') g.fillRect(x, y, w, h); else g.fillRect(x, y - h, w, h);
}
function hao(g, x, y, w, h, dir = 'right', a = 0.3) {
  const gr = dir === 'right' ? g.createLinearGradient(x, 0, x + w, 0) : g.createLinearGradient(x + w, 0, x, 0);
  gr.addColorStop(0, `rgba(10,6,20,${a})`); gr.addColorStop(1, 'rgba(10,6,20,0)'); g.fillStyle = gr; g.fillRect(x, y, w, h);
}
// a wall: gradient plus a faint texture of vertical streaks
function wall(g, x, y, w, h, col, seed = 1) {
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, shade(col, -0.18)); gr.addColorStop(0.6, col); gr.addColorStop(1, shade(col, -0.1));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  const r = rng(seed); g.globalAlpha = 0.045; for (let i = 0; i < 60; i++) { g.fillStyle = r() > 0.5 ? '#ffffff' : '#000000'; g.fillRect(x + r() * w, y, 2 + r() * 30, h); } g.globalAlpha = 1;
}
// wooden floor with planks in perspective toward vanishing point vx
function floorPlanks(g, x, y, w, h, col, vx = 960, n = 22) {
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, shade(col, -0.25)); gr.addColorStop(1, shade(col, 0.05)); g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.strokeStyle = shade(col, -0.32); g.lineWidth = 2; g.globalAlpha = 0.5;
  for (let i = -n; i <= n; i++) { const bx = vx + i * 140; g.beginPath(); g.moveTo(vx + i * 40, y); g.lineTo(bx + (bx - vx) * 1.5, y + h); g.stroke(); }
  for (let k = 1; k < 6; k++) { const yy = y + h * Math.pow(k / 6, 1.8); g.globalAlpha = 0.25; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
  g.globalAlpha = 1;
}
// a window frame with sky behind already painted by the caller (or cut out); draws frame, sill, mullions
function windowFrame(g, x, y, w, h, col = '#f1ece3', o = {}) {
  const fw = o.fw ?? 16;
  g.fillStyle = shade(col, -0.25); g.fillRect(x - fw - 4, y - fw - 4, w + 2 * fw + 8, fw + 4); // header shadow
  g.strokeStyle = col; g.lineWidth = fw; g.strokeRect(x - fw / 2, y - fw / 2, w + fw, h + fw);
  g.lineWidth = fw * 0.45; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); if (o.cross !== false) { g.moveTo(x, y + h * 0.45); g.lineTo(x + w, y + h * 0.45); } g.stroke();
  box(g, x - fw - 18, y + h + fw / 2, w + 2 * fw + 36, 18, shade(col, -0.05), { top: 0, r: 3 });
  ao(g, x - fw - 18, y + h + fw / 2 + 18, w + 2 * fw + 36, 30, 'down', 0.25);
}
// sky gradient
function sky(g, x, y, w, h, stops) { vgrad(g, x, y, w, h, stops); }
// distant city silhouette with lit windows
function skyline(g, x0, x1, base, hmin, hmax, col, seed, o = {}) {
  const r = rng(seed); let x = x0;
  while (x < x1) {
    const bw = 50 + r() * 120, bh = hmin + r() * (hmax - hmin);
    g.fillStyle = col; g.fillRect(x, base - bh, bw, bh + 4);
    if (r() > 0.6) g.fillRect(x + bw * 0.4, base - bh - 26, 4, 26);
    if (o.lit) { for (let yy = base - bh + 12; yy < base - 8; yy += 16) for (let xx = x + 8; xx < x + bw - 8; xx += 13) if (r() < o.lit) { g.fillStyle = o.litCol || 'rgba(255,214,150,0.85)'; g.fillRect(xx, yy, 5, 7); } }
    g.fillStyle = col; x += bw + r() * 6;
  }
}
function cloud(g, x, y, s, col, a = 1) {
  g.globalAlpha = a; g.fillStyle = col;
  for (const [dx, dy, r] of [[0, 0, 40], [45, -18, 52], [100, -6, 44], [140, 6, 32], [-40, 8, 30]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
  g.fillRect(x - 40 * s, y, 180 * s, 38 * s); g.globalAlpha = 1;
}
function plant(g, x, y, s, seed = 3, col = '#4f8a5b') {
  const r = rng(seed);
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2, L = (60 + r() * 50) * s; g.strokeStyle = shade(col, (r() - 0.5) * 0.4); g.lineWidth = 16 * s; g.beginPath(); g.moveTo(x, y - 40 * s); g.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y - 40 * s + Math.sin(a) * L * 0.7, x + Math.cos(a) * L, y - 40 * s + Math.sin(a) * L); g.stroke(); }
  box(g, x - 34 * s, y - 52 * s, 68 * s, 52 * s, '#c46b4a', { r: 6 * s });
}
function books(g, x, y, w, seed = 5) {
  const r = rng(seed), cols = ['#c0533f', '#3f6f8f', '#d9a441', '#5a7f5a', '#8a5a9a', '#e6dccb', '#2f3c56'];
  let xx = x; while (xx < x + w - 10) { const bw = 10 + r() * 14, bh = 50 + r() * 34; g.fillStyle = cols[Math.floor(r() * cols.length)]; const lean = r() > 0.88 ? 0.15 : 0;
    g.save(); g.translate(xx, y); g.rotate(lean); g.fillRect(0, -bh, bw, bh); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(2, -bh + 8, bw - 4, 3); g.restore(); xx += bw + 2 + (lean ? 8 : 0); }
}
function frame(g, x, y, w, h, art = 0, seed = 7) {
  box(g, x - 8, y - 8, w + 16, h + 16, '#3a2c26', { r: 3, edge: false });
  const r = rng(seed);
  if (art === 0) { vgrad(g, x, y, w, h, [[0, '#f2b880'], [1, '#7d5ba6']]); g.fillStyle = '#3d2f52'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.35, y + h * 0.45); g.lineTo(x + w * 0.6, y + h * 0.7); g.lineTo(x + w * 0.8, y + h * 0.4); g.lineTo(x + w, y + h); g.fill(); }
  else if (art === 1) { g.fillStyle = '#e9e1d2'; g.fillRect(x, y, w, h); for (let i = 0; i < 5; i++) { g.fillStyle = ['#e0483e', '#2fa79a', '#f2c230', '#2b3047'][i % 4]; g.beginPath(); g.arc(x + w * (0.2 + 0.6 * r()), y + h * (0.2 + 0.6 * r()), 10 + r() * 22, 0, Math.PI * 2); g.fill(); } }
  else { // a photo: two stick figures
    vgrad(g, x, y, w, h, [[0, '#8fc4d8'], [1, '#e8d6b0']]);
    for (const [k, c] of [[0.38, PAL.hero], [0.62, PAL.sis]]) { g.fillStyle = c; rr(g, x + w * k - 9, y + h * 0.55, 18, h * 0.4, 6); g.fill(); g.fillStyle = PAL.ink; g.beginPath(); g.arc(x + w * k, y + h * 0.45, 11, 0, Math.PI * 2); g.fill(); }
  }
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.5, y); g.lineTo(x, y + h * 0.6); g.fill();
}
function lampPendant(g, x, y, len, col = '#2f3346', lit = true) {
  g.strokeStyle = '#1b1c26'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + len); g.stroke();
  g.fillStyle = col; g.beginPath(); g.moveTo(x - 46, y + len + 46); g.quadraticCurveTo(x, y + len - 16, x + 46, y + len + 46); g.closePath(); g.fill();
  if (lit) { g.fillStyle = '#fff3d6'; g.beginPath(); g.ellipse(x, y + len + 46, 34, 8, 0, 0, Math.PI * 2); g.fill(); }
}
function tree(g, x, y, s, col, seed = 11) {
  const r = rng(seed); g.fillStyle = shade(col, -0.45); g.fillRect(x - 9 * s, y - 120 * s, 18 * s, 120 * s);
  for (let i = 0; i < 7; i++) { g.fillStyle = shade(col, (r() - 0.6) * 0.3); g.beginPath(); g.arc(x + (r() - 0.5) * 120 * s, y - 150 * s - r() * 110 * s, (50 + r() * 40) * s, 0, Math.PI * 2); g.fill(); }
}
function car(g, x, y, s, col, f = 1) {
  g.save(); g.translate(x, y); g.scale(s * f, s);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 4, 190, 14, 0, 0, Math.PI * 2); g.fill();
  const gr = g.createLinearGradient(0, -110, 0, 0); gr.addColorStop(0, shade(col, 0.15)); gr.addColorStop(1, shade(col, -0.3)); g.fillStyle = gr;
  g.beginPath(); g.moveTo(-180, -20); g.lineTo(-175, -62); g.lineTo(-90, -70); g.lineTo(-50, -118); g.lineTo(70, -118); g.lineTo(115, -70); g.lineTo(178, -60); g.lineTo(182, -20); g.closePath(); g.fill();
  g.fillStyle = '#a9c4d6'; g.beginPath(); g.moveTo(-40, -108); g.lineTo(5, -108); g.lineTo(5, -74); g.lineTo(-74, -74); g.closePath(); g.fill(); g.beginPath(); g.moveTo(15, -108); g.lineTo(64, -108); g.lineTo(98, -74); g.lineTo(15, -74); g.closePath(); g.fill();
  g.fillStyle = '#fff2c8'; g.fillRect(162, -58, 16, 10); g.fillStyle = '#c0392b'; g.fillRect(-182, -58, 10, 12);
  for (const wx of [-110, 110]) { g.fillStyle = '#16171f'; g.beginPath(); g.arc(wx, -18, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = '#8a8f9a'; g.beginPath(); g.arc(wx, -18, 13, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
// a building facade with a window grid
function facade(g, x, y, w, h, col, seed, o = {}) {
  box(g, x, y, w, h, col, { r: 2, lit: 0.05, dark: 0.25, edge: false });
  if (o.cornice !== false) { g.fillStyle = shade(col, -0.2); g.fillRect(x - 8, y, w + 16, 14); }
  const r = rng(seed), cw = o.cw || 70, ch = o.ch || 90, mx = o.mx || 34, my = o.my || 40;
  for (let yy = y + my; yy + ch < y + h - (o.ground || 0) - 10; yy += ch + my) for (let xx = x + mx; xx + cw <= x + w - mx + 1; xx += cw + mx) {
    const lit = r() < (o.lit ?? 0.3);
    vgrad(g, xx, yy, cw, ch, lit ? [[0, '#ffe2a8'], [1, '#f2a65a']] : [[0, o.glass || '#5c6f93'], [1, shade(o.glass || '#5c6f93', -0.35)]]);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + cw * 0.4, yy); g.lineTo(xx, yy + ch * 0.5); g.fill();
    g.fillStyle = shade(col, 0.2); g.fillRect(xx - 4, yy + ch, cw + 8, 7);
    if (lit && r() < 0.4) { g.fillStyle = 'rgba(40,30,40,0.6)'; g.beginPath(); g.arc(xx + cw * (0.3 + r() * 0.4), yy + ch * 0.62, 10, 0, Math.PI * 2); g.fill(); g.fillRect(xx + cw * 0.3, yy + ch * 0.68, cw * 0.4, ch * 0.32); }
  }
}
// a crowd of seated spectators (rows), colours varied; returns nothing (static)
function crowdRows(g, x0, x1, y0, rows, rowH, s, seed, light = 0.5) {
  const r = rng(seed), cols = ['#d8584c', '#3f7fbf', '#f0c040', '#5fae6b', '#e9e3d6', '#8a5fb0', '#ef8a3a', '#2fa79a', '#c94f7c'];
  for (let k = 0; k < rows; k++) {
    const y = y0 + k * rowH, sc = s * (1 + k * 0.06), dk = -0.55 + light * (k / rows) * 0.6;
    g.fillStyle = shade('#2a2440', -0.2 + k * 0.03); g.fillRect(x0, y + 10 * sc, x1 - x0, rowH);
    for (let x = x0 + r() * 20; x < x1; x += (26 + r() * 10) * sc) {
      const c = cols[Math.floor(r() * cols.length)], hh = (r() - 0.5) * 8 * sc;
      g.fillStyle = shade(c, dk); rr(g, x - 11 * sc, y - 18 * sc + hh, 22 * sc, 30 * sc, 8 * sc); g.fill();
      g.fillStyle = shade(PAL.ink, dk * 0.3); g.beginPath(); g.arc(x, y - 28 * sc + hh, 10 * sc, 0, Math.PI * 2); g.fill();
    }
  }
}
// a light shaft (additive) from a window or a spotlight
function shaft(g, pts, col, a) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const xs = pts.map((p) => p[1]); const gr = g.createLinearGradient(0, Math.min(...xs), 0, Math.max(...xs)); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); g.restore();
}
// floating dust motes in a light beam (dynamic, cheap)
function motes(g, t, x, y, w, h, n, seed, col = 'rgba(255,236,200,0.7)') {
  g.fillStyle = col;
  for (let i = 0; i < n; i++) { const px = x + ((hash(seed + i * 3) * w + t * (6 + hash(i) * 10)) % w), py = y + ((hash(seed + i * 5) * h + noise(t * 0.3 + i, seed) * 40 + h) % h), r = 1.2 + hash(i * 9) * 2.4;
    g.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.8 + i)); g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
}
