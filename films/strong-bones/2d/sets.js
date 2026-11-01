/* =====================================================================
   SETS (2D) — painted backgrounds and props, all in 1920×1080 "set" pixels:
     kitchen (dusk, or night a week later), the arena (dark hall, spotlit platform, the crowd in tiers, the big screen),
     outside the loading door (afternoon yard, the scaffold tower), the house at dusk (title), the forearm blueprint.
   Palette: violet shadows, amber light, one colour per character (you teal, your sister yellow).
   ===================================================================== */

// ---------- the kitchen ----------
const KIT = { top: 724 };
const KITCHEN_CITY = (() => { const r = rng(31), out = []; for (let x = 0; x < 460;) { const w = 22 + r() * 46, h = 40 + r() * 120; out.push([x, w, h, r()]); x += w + 3; } return out; })();
function kitchenBG(g, t, night = false) {
  vgrad(g, 0, 0, W, H, night ? [[0, '#1d1a2e'], [1, '#2a2338']] : [[0, '#3f2d4a'], [0.7, '#5e4256'], [1, '#6a4a58']]);
  // the window
  const wx = 1120, wy = 170, ww = 470, wh = 380;
  g.save(); rr(g, wx, wy, ww, wh, 6); g.clip();
  if (night) vgrad(g, wx, wy, ww, wh, [[0, '#070a18'], [0.6, '#141a34'], [1, '#2a2340']]);
  else { vgrad(g, wx, wy, ww, wh, [[0, '#3b2f6e'], [0.5, '#b0627e'], [0.85, '#f2a65a'], [1, '#ffcf8a']]); glow(g, wx + 300, wy + 300, 170, 'rgba(255,214,150,0.95)'); }
  g.fillStyle = night ? '#0c0f1e' : '#2a1d36';
  for (const [x, w, h, k] of KITCHEN_CITY) { g.fillRect(wx + x, wy + wh - h, w, h); if (night) { g.fillStyle = '#ffd27a'; for (let yy = wy + wh - h + 10; yy < wy + wh - 8; yy += 16) for (let xx = wx + x + 5; xx < wx + x + w - 6; xx += 11) if (hash(Math.floor(xx * 7 + yy * 13)) > 0.62) g.fillRect(xx, yy, 5, 7); g.fillStyle = '#0c0f1e'; } }
  if (night) for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + hash(i * 17) * 0.6})`; g.fillRect(wx + hash(i * 3) * ww, wy + hash(i * 5) * wh * 0.45, 2, 2); }
  g.restore();
  g.strokeStyle = '#efe6d8'; g.lineWidth = 16; rr(g, wx, wy, ww, wh, 6); g.stroke(); g.lineWidth = 9; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
  g.fillStyle = '#efe6d8'; g.fillRect(wx - 30, wy + wh + 4, ww + 60, 18);
  if (!night) { g.globalCompositeOperation = 'lighter'; glow(g, wx + 260, wy + 260, 520, 'rgba(255,150,90,0.22)'); g.globalCompositeOperation = 'source-over'; }
  // upper cabinets, shelves, a clock
  g.fillStyle = night ? '#1f2c33' : '#2d4448';
  for (let i = 0; i < 4; i++) { rr(g, 120 + i * 210, 140, 196, 230, 8); g.fill(); }
  g.fillStyle = '#c9b48a'; for (let i = 0; i < 4; i++) g.fillRect(120 + i * 210 + 170, 320, 8, 34);
  g.fillStyle = night ? '#2a2236' : '#4e3848'; g.fillRect(60, 560, 1860, 140);           // back counter splash
  // the back counter with a kettle, a plant
  g.fillStyle = night ? '#1b2228' : '#24363a'; g.fillRect(0, 590, W, 110);
  g.fillStyle = '#e9e1d4'; g.fillRect(0, 578, W, 14);
  g.fillStyle = '#2b2b2e'; rr(g, 300, 510, 70, 70, 12); g.fill(); g.fillRect(320, 500, 30, 12);
  g.fillStyle = '#b5643e'; rr(g, 1700, 520, 64, 58, 8); g.fill();
  g.fillStyle = '#3f6b3a'; for (let i = 0; i < 6; i++) { g.save(); g.translate(1732, 524); g.rotate(-0.9 + i * 0.36); g.beginPath(); g.ellipse(0, -46, 13, 46, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  // pendant lamps
  for (const x of [640, 1300]) {
    g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 250); g.stroke();
    g.fillStyle = '#1f2a2a'; g.beginPath(); g.moveTo(x - 60, 300); g.lineTo(x + 60, 300); g.lineTo(x + 26, 245); g.lineTo(x - 26, 245); g.closePath(); g.fill();
    g.globalCompositeOperation = 'lighter'; glow(g, x, 305, 260, night ? 'rgba(255,190,120,0.35)' : 'rgba(255,200,130,0.28)'); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ffe0a8'; g.beginPath(); g.ellipse(x, 302, 34, 8, 0, 0, Math.PI * 2); g.fill();
  }
}
// the island in front (drawn over the characters' legs)
function kitchenFG(g, night = false, top = KIT.top) {
  const KT = top;
  vgrad(g, 0, KT + 14, W, H - KT, night ? [[0, '#1b2a2c'], [1, '#101819']] : [[0, '#2f4a4c'], [1, '#1d3032']]);
  g.fillStyle = night ? '#d9d2c4' : '#efe8dc'; g.fillRect(0, KT, W, 16);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, KT + 16, W, 10);
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; for (let x = 160; x < W; x += 420) { g.beginPath(); g.moveTo(x, KT + 60); g.lineTo(x, H); g.stroke(); }
}

// a jar (x = centre, y = base on the counter, s = scale). broken: the top ring has gone (with the lid)
function drawJar(g, x, y, s, broken) {
  const w = 60 * s, h = 92 * s, rim = 16 * s;
  g.fillStyle = '#8e1d2a'; rr(g, x - w / 2 + 4 * s, y - h * 0.68, w - 8 * s, h * 0.66, 6 * s); g.fill();
  g.fillStyle = '#efe4c8'; g.fillRect(x - w / 2 + 2 * s, y - h * 0.5, w - 4 * s, 24 * s);
  txt(g, 'CHERRY', x, y - h * 0.5 + 17 * s, `700 ${13 * s}px ${SERIF}`, '#7a1c22');
  g.strokeStyle = 'rgba(230,245,250,0.85)'; g.lineWidth = 3 * s; g.fillStyle = 'rgba(210,235,240,0.18)';
  const top = broken ? y - h + rim : y - h;
  g.beginPath(); g.moveTo(x - w / 2, top); g.lineTo(x - w / 2, y - 6 * s); g.quadraticCurveTo(x - w / 2, y, x - w / 2 + 6 * s, y); g.lineTo(x + w / 2 - 6 * s, y); g.quadraticCurveTo(x + w / 2, y, x + w / 2, y - 6 * s); g.lineTo(x + w / 2, top); g.fill(); g.stroke();
  if (broken) { g.beginPath(); g.moveTo(x - w / 2, top); for (let i = 1; i <= 8; i++) g.lineTo(x - w / 2 + (w * i) / 8, top - (i % 2 ? 7 : 2) * s); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x - w / 2 + 6 * s, top + 6 * s, 5 * s, h * 0.5);
}
// the lid with the glass rim still on it (x, y = lid centre top)
function drawLid(g, x, y, s, withRim, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const w = 66 * s, rim = 16 * s;
  if (withRim) {
    g.strokeStyle = 'rgba(230,245,250,0.9)'; g.lineWidth = 3 * s; g.fillStyle = 'rgba(210,235,240,0.22)';
    g.beginPath(); g.moveTo(-w / 2 + 3 * s, 10 * s); g.lineTo(-w / 2 + 3 * s, 10 * s + rim);
    for (let i = 1; i <= 8; i++) g.lineTo(-w / 2 + 3 * s + ((w - 6 * s) * i) / 8, 10 * s + rim + (i % 2 ? 7 : 2) * s);
    g.lineTo(w / 2 - 3 * s, 10 * s); g.closePath(); g.fill(); g.stroke();
  }
  g.fillStyle = '#c9a447'; rr(g, -w / 2, 0, w, 14 * s, 4 * s); g.fill(); g.fillStyle = '#e8c86a'; g.fillRect(-w / 2 + 4 * s, 2 * s, w - 8 * s, 3 * s);
  g.restore();
}
function drawMug(g, x, y, s, handle = true, body = true, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  if (body) { g.fillStyle = '#ece5d7'; rr(g, -30 * s, -70 * s, 60 * s, 70 * s, 8 * s); g.fill(); g.fillStyle = '#2f4a4c'; g.fillRect(-30 * s, -52 * s, 60 * s, 9 * s); g.fillStyle = '#3a2416'; g.beginPath(); g.ellipse(0, -68 * s, 26 * s, 4 * s, 0, 0, Math.PI * 2); g.fill(); }
  if (handle) { g.strokeStyle = '#ece5d7'; g.lineWidth = 9 * s; g.beginPath(); g.arc(30 * s, -38 * s, 17 * s, -Math.PI / 2, Math.PI / 2); g.stroke(); }
  g.restore();
}

// ---------- the arena ----------
const CROWD = (() => { const r = rng(77), out = []; for (let row = 0; row < 9; row++) for (let x = -40; x < W + 40; x += 34 + r() * 8) out.push({ row, x: x + r() * 10, c: r(), ph: r() * 9, up: r() > 0.25, sc: 0.85 + r() * 0.3 }); return out; })();
const CROWD_COLS = ['#5b3a4a', '#2f4a6e', '#3d5a4a', '#7a5a3a', '#4a3a6a', '#8a2f3a', '#2a2a3a', '#8a8170', '#2f5a6a', '#b06a2a'];
function arenaBG(g, t, o = {}) {
  vgrad(g, 0, 0, W, H, [[0, '#090a14'], [0.6, '#151628'], [1, '#0d0e18']]);
  // the big screen
  if (o.screen !== false) {
    const sx = W / 2 - 330, sy = 70;
    g.fillStyle = '#05060a'; rr(g, sx - 12, sy - 12, 684, 300, 10); g.fill();
    vgrad(g, sx, sy, 660, 276, [[0, '#0e1a33'], [1, '#060a16']]);
    (o.screenFn || (() => {}))(g, sx, sy, 660, 276);
    g.globalCompositeOperation = 'lighter'; glow(g, W / 2, sy + 140, 520, 'rgba(90,130,220,0.18)'); g.globalCompositeOperation = 'source-over';
  }
  // the crowd: rows of heads and shoulders, lit cool from above; on their feet when they cheer
  const cheer = o.cheer || 0, still = o.still || 0;
  for (let row = 8; row >= 0; row--) {
    const yb = 420 + row * 46;
    g.fillStyle = `rgb(${18 + row * 3},${19 + row * 3},${30 + row * 4})`; g.fillRect(0, yb + 6, W, 50);
    for (const p of CROWD) if (p.row === row) {
      const up = cheer * (p.up ? 1 : 0), hop = up * Math.max(0, Math.sin(t * 8 + p.ph)) * 10, sway = (1 - still) * Math.sin(t * 1.3 + p.ph) * 2;
      const y = yb - up * 14 - hop, s = p.sc * (0.75 + row * 0.03);
      const col = CROWD_COLS[Math.floor(p.c * CROWD_COLS.length)];
      g.fillStyle = shade(col, -0.35 + row * 0.03); g.beginPath(); g.ellipse(p.x + sway, y + 22 * s, 17 * s, 18 * s, 0, Math.PI, 0); g.fill();
      g.fillStyle = shade('#1b1c28', row * 0.02); g.beginPath(); g.arc(p.x + sway, y, 11 * s, 0, Math.PI * 2); g.fill();
      if (up > 0.5 && p.c > 0.7) { g.strokeStyle = shade(col, -0.2); g.lineWidth = 5 * s; g.beginPath(); g.moveTo(p.x + sway + 12 * s, y + 10 * s); g.lineTo(p.x + sway + 20 * s, y - 22 * s - hop * 0.3); g.stroke(); }
    }
  }
  // LED band
  g.fillStyle = '#0b1a3a'; g.fillRect(0, 812, W, 34); g.save(); g.beginPath(); g.rect(0, 812, W, 34); g.clip();
  const off = (t * 60) % 520; for (let x = -off; x < W; x += 520) txt(g, 'WEIGHTLIFTING · FINAL', x + 260, 838, `700 22px ${SANS}`, '#f2c230');
  g.restore();
  // floor, the platform
  vgrad(g, 0, 846, W, H - 846, [[0, '#1d1e28'], [1, '#0e0f15']]);
  const px = o.platX ?? W / 2;
  g.fillStyle = '#121216'; g.fillRect(px - 420, 870, 840, 34);
  vgrad(g, px - 300, 862, 600, 16, [[0, '#d0a06a'], [1, '#9a6d40']]);
  // the spotlight
  if (o.spot !== false) { g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, 'rgba(255,236,200,0.0)'); gr.addColorStop(1, 'rgba(255,236,200,0.16)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(px - 60, 0); g.lineTo(px + 60, 0); g.lineTo(px + 360, 880); g.lineTo(px - 360, 880); g.closePath(); g.fill();
    glow(g, px, 875, 420, 'rgba(255,225,180,0.35)'); g.globalCompositeOperation = 'source-over'; }
}
function drawBar(g, x, y, s, bend = 0) {
  // x, y: centre of the shaft; plates either side (seen side-on from the front: a long bar)
  g.strokeStyle = '#c8cbd0'; g.lineWidth = 9 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 330 * s, y + bend * 10); g.quadraticCurveTo(x, y - bend * 18, x + 330 * s, y + bend * 10); g.stroke();
  const cols = ['#b8322a', '#2f5fa8', '#c9a227', '#2f7a3a', '#b8322a'];
  for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) { const px = x + sd * (230 + k * 20) * s, r = (110 - k * 9) * s; g.fillStyle = cols[k]; rr(g, px - 9 * s, y + bend * 9 - r, 18 * s, 2 * r, 6 * s); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(px - 6 * s, y + bend * 9 - r + 6 * s, 4 * s, 2 * r - 12 * s); }
}

// ---------- outside the loading door ----------
function outsideBG(g, t) {
  vgrad(g, 0, 0, W, H, [[0, '#6f8fc8'], [0.6, '#e9cfae'], [1, '#f1d6b0']]);
  glow(g, 1650, 160, 380, 'rgba(255,240,210,0.8)');
  // a warehouse wall, windows
  g.fillStyle = '#b9a68e'; g.fillRect(1180, 260, 760, 640);
  g.fillStyle = '#2a3442'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { rr(g, 1240 + i * 170, 320 + j * 180, 110, 120, 6); g.fill(); }
  g.fillStyle = '#8d8a82'; g.fillRect(0, 890, W, 190);
  g.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = 0; x < W; x += 160) g.fillRect(x, 890, 4, 190);
}
// the scaffold tower: pivot at (x, y) = its base corner nearest the door; lean in degrees, tips to the left (toward the door)
function drawScaffold(g, x, y, s, leanDeg, t) {
  g.save(); g.translate(x, y); g.rotate(-leanDeg * Math.PI / 180);
  const w = 230 * s, h = 760 * s;
  g.strokeStyle = '#9aa0a8'; g.lineWidth = 9 * s; g.lineCap = 'round';
  for (const xx of [0, w]) { g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, -h); g.stroke(); }
  for (let k = 0; k <= 4; k++) { const yy = -k * h / 4; g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); if (k < 4) { g.beginPath(); g.moveTo(k % 2 ? 0 : w, yy); g.lineTo(k % 2 ? w : 0, yy - h / 4); g.stroke(); } }
  g.fillStyle = '#a77a3e'; for (let k = 1; k <= 4; k++) g.fillRect(-10 * s, -k * h / 4 - 10 * s, w + 20 * s, 12 * s);
  g.fillStyle = 'rgba(47,111,176,0.55)'; g.fillRect(4 * s, -h, w - 8 * s, h / 4 - 14 * s);
  g.restore();
  // buckets slide off the top as it goes
  for (let i = 0; i < 2; i++) {
    const f = cl((leanDeg - 9 - i * 4) / 14), a = -leanDeg * Math.PI / 180;
    const bx0 = 50 * s + i * 90 * s, by0 = -h - 30 * s;
    let px = x + bx0 * Math.cos(a) - by0 * Math.sin(a), py = y + bx0 * Math.sin(a) + by0 * Math.cos(a);
    px -= f * 260 * s; py += f * f * 560 * s;
    if (py < y - 10) { g.save(); g.translate(px, py); g.rotate(a - f * 3); g.fillStyle = i ? '#3a3f46' : '#c9a227'; rr(g, -22 * s, -30 * s, 44 * s, 40 * s, 6 * s); g.fill(); g.restore(); }
  }
}

// ---------- the house at dusk (title) ----------
function houseDusk(g, t) {
  vgrad(g, 0, 0, W, H, [[0, '#2b2457'], [0.45, '#8a4f78'], [0.75, '#f0985a'], [1, '#ffc27a']]);
  glow(g, 1450, 760, 420, 'rgba(255,200,140,0.7)');
  const r = rng(5); g.fillStyle = '#2a1d36';
  for (let x = 0; x < W;) { const w = 60 + r() * 120, h = 140 + r() * 260; g.fillRect(x, 860 - h, w, h); x += w + 6; }
  g.fillStyle = '#1a1424'; g.beginPath(); g.moveTo(560, 470); g.lineTo(960, 250); g.lineTo(1360, 470); g.closePath(); g.fill(); g.fillRect(620, 465, 680, 460);
  g.fillStyle = '#ffd08a'; rr(g, 760, 560, 400, 230, 6); g.fill();
  g.globalCompositeOperation = 'lighter'; glow(g, 960, 680, 380, 'rgba(255,190,110,0.4)'); g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#1a1424'; g.fillRect(950, 560, 18, 230);
  vgrad(g, 0, 900, W, 180, [[0, '#1a1424'], [1, '#0e0b14']]);
}
