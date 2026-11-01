/* =====================================================================
   WORLD — the sets of "What if you suddenly knew everything?". Each set is painted once into cached layers at
   different depths: far (sky, seen through windows, k≈0.4) → mid → back (walls, furniture, k=1) → [actors] → glow
   (light shafts, lamps, added on top) → fg (near props, blurred, k≈1.3). drawSet(g, name, C, t, actors, opt) composites
   them under the parallax camera C = {x, y, z}. Layers are 2400×1350 set pixels with the 1920×1080 frame at (240, 135).
   Bedroom, kitchen, street and living room come from the strong-bones sets; the others are new: the bedroom at night,
   the classroom, the school hallway, the backyard, the front of your house (day and night), the university lab and the
   bookshop window.
   ===================================================================== */

const LW = 2400, LH = 1350, LX = -240, LY = -135;
// opt.tint: a colour washed over the painted pixels only (night versions of a set)
const LAY = (key, fn, opt = {}) => LAYER(key, LW, LH, (g) => { g.translate(-LX, -LY); fn(g); if (opt.tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = opt.tint; g.fillRect(LX, LY, LW, LH); g.globalCompositeOperation = 'source-over'; } }, opt);
const KIT2 = { top: 760 };
const SETS = {};

SETS.bedroom = {
  k: { far: 0.45, fg: 1.3 },
  far(g) {
    sky(g, LX, LY, LW, LH, [[0, '#3d3c6e'], [0.45, '#a2779b'], [0.7, '#f3a978'], [1, '#ffd29a']]);
    glow(g, 470, 640, 420, 'rgba(255,214,150,0.9)');
    skyline(g, LX, 1100, 700, 60, 210, '#6d4f73', 41, { lit: 0.08 });
    skyline(g, LX, 1100, 760, 30, 120, '#4b3a5c', 42, { lit: 0.12 });
    for (let i = 0; i < 3; i++) cloud(g, 180 + i * 260, 300 + i * 40, 0.6 + i * 0.15, '#f7c3a0', 0.5);
  },
  back(g) {
    wall(g, LX, LY, LW, 1050 - LY, '#b99ab4', 11);
    // window (cut out so the far layer shows)
    g.globalCompositeOperation = 'destination-out'; g.fillRect(230, 230, 420, 440); g.globalCompositeOperation = 'source-over';
    windowFrame(g, 230, 230, 420, 440, '#efe4dc');
    // curtains
    for (const [x, s] of [[150, 1], [690, -1]]) { const gr = g.createLinearGradient(x, 0, x + s * 90, 0); gr.addColorStop(0, '#5e7fa0'); gr.addColorStop(1, '#41607f'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, 190); g.lineTo(x + s * 80, 190); g.quadraticCurveTo(x + s * 60, 500, x + s * 95, 760); g.lineTo(x - s * 10, 760); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 4; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + s * k * 20, 195); g.lineTo(x + s * k * 24, 755); g.stroke(); } }
    g.fillStyle = '#2b2a35'; g.fillRect(120, 182, 620, 10);
    // shelf + books + frames above the bed
    frame(g, 1010, 300, 150, 110, 0, 3); frame(g, 1200, 270, 110, 140, 2, 5); frame(g, 1350, 320, 170, 100, 1, 8);
    box(g, 1590, 420, 300, 18, '#8a6a52', { r: 3 }); books(g, 1600, 420, 200, 9); plant(g, 1840, 420, 0.55, 4);
    // posters
    g.fillStyle = '#1d2346'; g.fillRect(780, 250, 140, 200); g.fillStyle = '#e8a64a'; g.beginPath(); g.arc(850, 340, 40, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#f4d9a8'; g.lineWidth = 5; g.beginPath(); g.ellipse(850, 340, 66, 16, -0.3, 0, Math.PI * 2); g.stroke(); for (let i = 0; i < 14; i++) { g.fillStyle = '#ffffff'; g.fillRect(790 + hash(i * 5) * 120, 262 + hash(i * 9) * 170, 2, 2); } txt(g, 'SPACE', 850, 432, `700 26px ${COND}`, '#e9e1d2');
    // floor
    floorPlanks(g, LX, 1000, LW, LH + LY - 1000, '#8c6649', 1100);
    ao(g, LX, 1000, LW, 60, 'down', 0.45);
    // skirting
    g.fillStyle = '#e3d5cf'; g.fillRect(LX, 985, LW, 16);
    // bed: headboard, frame, mattress, pillows (the duvet is drawn over the sleeper later)
    box(g, 900, 560, 760, 300, '#4a3a5a', { r: 18, lit: 0.12, dark: 0.3 });
    g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 5; i++) rr(g, 930 + i * 146, 590, 120, 230, 12), g.fill();
    box(g, 870, 820, 1080, 120, '#5b4636', { r: 10 });
    box(g, 880, 760, 1060, 80, '#ece6dd', { r: 22, lit: 0.05, dark: 0.12 });
    box(g, 940, 700, 230, 90, '#f7f3ec', { r: 40, lit: 0.03, dark: 0.15 });
    ao(g, 870, 940, 1080, 50, 'down', 0.5);
    // nightstand + lamp on the left of the bed
    box(g, 700, 800, 160, 190, '#7d5b45', { r: 6, top: 14, side: 0 }); g.fillStyle = shade('#7d5b45', -0.3); g.fillRect(712, 880, 136, 4); g.fillStyle = '#d8c3a8'; g.fillRect(770, 850, 20, 6);
    g.fillStyle = '#2a2c3a'; g.fillRect(724, 740, 10, 60); g.fillStyle = '#e8d2a8'; g.beginPath(); g.moveTo(690, 742); g.lineTo(768, 742); g.lineTo(752, 690); g.lineTo(706, 690); g.closePath(); g.fill();
    // rug
    g.fillStyle = '#3c6b73'; g.beginPath(); g.ellipse(1250, 1110, 620, 70, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#e9d3a6'; g.lineWidth = 6; g.beginPath(); g.ellipse(1250, 1110, 580, 58, 0, 0, Math.PI * 2); g.stroke();
  },
  glow(g) {
    shaft(g, [[230, 240], [650, 240], [1500, 1150], [600, 1150]], 'rgba(255,190,120,0.55)', 0.55);
    glow(g, 730, 700, 160, 'rgba(255,210,150,0.5)');
  },
  fg(g) { box(g, LX - 50, 1180, 700, 400, '#2f2a3d', { r: 30 }); },
};

SETS.kitchen = {
  k: { far: 0.5, fg: 1.2 },
  far(g) {
    sky(g, LX, LY, LW, LH, [[0, '#7fb4d6'], [0.55, '#cfe0dd'], [1, '#ffe2b0']]);
    glow(g, 820, 330, 300, 'rgba(255,240,200,0.6)');
    for (let i = 0; i < 6; i++) tree(g, 500 + i * 160, 760, 0.8 + hash(i) * 0.4, '#6f9f6a', 20 + i);
    facade(g, 1100, 360, 420, 500, '#d9b48f', 31, { lit: 0.05, glass: '#7e9cb8' });
  },
  back(g) {
    wall(g, LX, LY, LW, 900 - LY, '#efdcc2', 12);
    // backsplash tiles
    g.fillStyle = '#e6e3dc'; g.fillRect(LX, 470, LW, 210); g.strokeStyle = 'rgba(120,110,100,0.25)'; g.lineWidth = 2; for (let y = 470; y < 680; y += 35) { g.beginPath(); g.moveTo(LX, y); g.lineTo(LX + LW, y); g.stroke(); } for (let x = LX; x < LX + LW; x += 70) for (let y = 470; y < 680; y += 70) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 35); g.moveTo(x + 35, y + 35); g.lineTo(x + 35, y + 70); g.stroke(); }
    // window over the sink
    g.globalCompositeOperation = 'destination-out'; g.fillRect(640, 150, 560, 400); g.globalCompositeOperation = 'source-over';
    windowFrame(g, 640, 150, 560, 400, '#f6f1e8');
    // upper cabinets
    for (const x of [LX + 40, 120, 380]) box(g, x, 100, 230, 300, '#3d6e74', { r: 6, dark: 0.25 });
    for (const x of [1300, 1560, 1820]) box(g, x, 100, 230, 300, '#3d6e74', { r: 6, dark: 0.25 });
    g.fillStyle = '#c9b38d'; for (const x of [LX + 40, 120, 380, 1300, 1560, 1820]) g.fillRect(x + 100, 360, 30, 6);
    ao(g, LX, 400, LW, 50, 'down', 0.3);
    // open shelf with jars
    box(g, 1300, 450, 500, 14, '#8a6a52', { r: 3 });
    for (let i = 0; i < 6; i++) { const x = 1320 + i * 78; g.fillStyle = 'rgba(220,235,240,0.75)'; rr(g, x, 380, 54, 70, 8); g.fill(); g.fillStyle = ['#d9a441', '#c0533f', '#7a5a3a', '#e9e1d2', '#5a7f5a', '#d9a441'][i]; g.fillRect(x + 4, 410, 46, 36); g.fillStyle = '#6a4a3a'; g.fillRect(x + 6, 372, 42, 10); }
    // back counter with appliances
    box(g, LX, 680, LW, 30, '#d9cfc0', { r: 4 }); box(g, LX, 708, LW, 300, '#3f5f66', { r: 2, dark: 0.3 });
    g.fillStyle = 'rgba(0,0,0,0.15)'; for (let x = LX + 20; x < LX + LW; x += 260) g.fillRect(x, 720, 4, 280);
    // sink + tap under the window
    g.fillStyle = '#b8c0c6'; rr(g, 790, 668, 260, 18, 6); g.fill(); g.strokeStyle = '#c9d0d6'; g.lineWidth = 12; g.beginPath(); g.moveTo(920, 668); g.lineTo(920, 600); g.quadraticCurveTo(920, 580, 950, 580); g.stroke();
    // coffee machine, kettle, toaster, fruit bowl
    box(g, 300, 540, 140, 140, '#2b2e38', { r: 10 }); g.fillStyle = '#d9533f'; g.beginPath(); g.arc(370, 590, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = '#a9b0ba'; g.fillRect(345, 630, 50, 40);
    g.fillStyle = '#d9d2c4'; g.beginPath(); g.moveTo(490, 680); g.lineTo(500, 600); g.quadraticCurveTo(540, 560, 580, 600); g.lineTo(590, 680); g.closePath(); g.fill(); g.strokeStyle = '#2b2e38'; g.lineWidth = 8; g.beginPath(); g.arc(540, 590, 40, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    box(g, 1250, 610, 150, 70, '#c9cfd6', { r: 12 }); g.fillStyle = '#2b2e38'; g.fillRect(1280, 604, 30, 8); g.fillRect(1330, 604, 30, 8);
    g.fillStyle = '#e8e2d6'; g.beginPath(); g.ellipse(1520, 668, 80, 18, 0, 0, Math.PI); g.fill(); for (const [dx, c] of [[-30, '#e0483e'], [0, '#f2c230'], [28, '#7fb04a'], [-8, '#ef8a3a']]) { g.fillStyle = c; g.beginPath(); g.arc(1520 + dx, 650 - (dx === -8 ? 18 : 0), 22, 0, Math.PI * 2); g.fill(); }
    // fridge on the far right
    box(g, 1960, 150, 300, 860, '#d8dde2', { r: 14, dark: 0.2 }); g.fillStyle = '#9aa3ad'; g.fillRect(1985, 300, 10, 160); g.fillRect(1985, 560, 10, 220); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(1960, 520, 300, 6);
    for (let i = 0; i < 5; i++) { g.fillStyle = ['#f2c230', '#e0483e', '#2fa79a', '#8a5fb0', '#ef8a3a'][i]; g.fillRect(2040 + (i % 3) * 60, 220 + Math.floor(i / 3) * 70, 44, 54); }
    plant(g, LX + 120, 680, 0.7, 6);
    lampPendant(g, 520, LY, 300, '#2f3346'); lampPendant(g, 1400, LY, 300, '#2f3346');
  },
  glow(g) {
    shaft(g, [[640, 160], [1200, 160], [1500, 1100], [700, 1100]], 'rgba(255,236,190,0.5)', 0.28);
    glow(g, 520, 470, 200, 'rgba(255,220,160,0.35)'); glow(g, 1400, 470, 200, 'rgba(255,220,160,0.35)');
  },
  // the island counter in front (covers the characters' legs)
  fg(g) {
    box(g, LX, KIT2.top, LW, 26, '#efe8dc', { r: 4, lit: 0.05 });
    box(g, LX, KIT2.top + 24, LW, 600, '#2e4e55', { r: 2, dark: 0.35 });
    g.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = LX + 100; x < LX + LW; x += 300) g.fillRect(x, KIT2.top + 60, 230, 220);
    ao(g, LX, KIT2.top + 26, LW, 40, 'down', 0.4);
  },
};

SETS.living = {
  k: { far: 0.45, fg: 1.25 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#0b0f24'], [1, '#2a2450']]); for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(LX + hash(i * 3) * LW, LY + hash(i * 7) * 500, 2, 2); } skyline(g, LX, LX + LW, 780, 100, 360, '#161a33', 61, { lit: 0.3 }); },
  back(g) {
    wall(g, LX, LY, LW, 940 - LY, '#3c3d63', 14);
    g.globalCompositeOperation = 'destination-out'; g.fillRect(1420, 190, 480, 420); g.globalCompositeOperation = 'source-over'; windowFrame(g, 1420, 190, 480, 420, '#8d8fae');
    frame(g, 520, 300, 170, 120, 2, 21); frame(g, 740, 280, 110, 150, 0, 22); frame(g, 900, 320, 180, 110, 1, 23);
    box(g, 1100, 470, 260, 16, '#7a5a44', { r: 3 }); books(g, 1110, 470, 200, 24); plant(g, 1950, 930, 0.9, 25, '#3f7a52');
    // floor lamp (warm) on the right of the sofa
    g.fillStyle = '#1b1c26'; g.fillRect(1366, 520, 8, 420); g.fillStyle = '#f0d49a'; g.beginPath(); g.moveTo(1320, 530); g.lineTo(1420, 530); g.lineTo(1400, 460); g.lineTo(1340, 460); g.closePath(); g.fill();
    // sofa back + seat (the characters sit on it; the front cushions are drawn after them)
    box(g, 520, 650, 840, 220, '#7a4e63', { r: 40, lit: 0.1, dark: 0.3 }); box(g, 540, 840, 800, 70, '#8a5a70', { r: 20, lit: 0.15 }); box(g, 560, 905, 760, 50, '#5a3a4a', { r: 10 }); box(g, 480, 760, 80, 180, '#6a4256', { r: 30 }); box(g, 1320, 760, 80, 180, '#6a4256', { r: 30 });
    vgrad(g, LX, 940, LW, LH + LY - 940, [[0, '#2a2236'], [1, '#1a1522']]); g.fillStyle = '#5a3a3a'; g.beginPath(); g.ellipse(940, 1080, 700, 80, 0, 0, Math.PI * 2); g.fill();
    ao(g, LX, 940, LW, 40, 'down', 0.5);
  },
  glow(g) { glow(g, 1370, 520, 360, 'rgba(255,200,130,0.45)'); },
  fg(g) { box(g, 640, 1070, 640, 60, '#4a3226', { r: 8 }); g.fillStyle = '#e8e1d6'; rr(g, 900, 1046, 70, 26, 4); g.fill(); g.fillStyle = '#2a3a5a'; rr(g, 1020, 1050, 90, 20, 4); g.fill(); },
};

function streetFar(g, dusk) {
  sky(g, LX, LY, LW, LH, dusk ? [[0, '#2c2a55'], [0.5, '#8a5f8f'], [0.78, '#f09a6a'], [1, '#ffcf8a']] : [[0, '#6aa2d0'], [0.5, '#b9d4e0'], [0.8, '#ffe0b8'], [1, '#ffd3a0']]);
  glow(g, 1500, 700, 500, dusk ? 'rgba(255,170,110,0.8)' : 'rgba(255,240,210,0.8)');
  for (let i = 0; i < 4; i++) cloud(g, 200 + i * 520, 200 + (i % 2) * 90, 0.9, dusk ? '#e7a49a' : '#ffffff', 0.55);
  skyline(g, LX, LX + LW, 760, 120, 380, dusk ? '#4a3a62' : '#9fb3c8', 51, { lit: dusk ? 0.2 : 0 });
  // the school in the distance (red brick, a clock tower) where you walk to
  g.fillStyle = dusk ? '#4a3150' : '#b9806a'; g.fillRect(1480, 600, 460, 170); g.fillRect(1660, 470, 100, 140); g.beginPath(); g.moveTo(1650, 470); g.lineTo(1710, 410); g.lineTo(1770, 470); g.fill();
  g.fillStyle = '#f4ecdc'; g.beginPath(); g.arc(1710, 520, 26, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#4a3a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(1710, 520); g.lineTo(1710, 502); g.moveTo(1710, 520); g.lineTo(1722, 526); g.stroke();
  g.fillStyle = dusk ? 'rgba(255,214,150,0.7)' : 'rgba(255,255,255,0.55)'; for (let x = 1500; x < 1930; x += 46) g.fillRect(x, 640, 26, 34); for (let x = 1500; x < 1930; x += 46) g.fillRect(x, 700, 26, 34);
}
SETS.street = {
  k: { far: 0.35, mid: 0.7, fg: 1.35 },
  far(g) { streetFar(g, false); },
  mid(g) {
    const cols = ['#e7c9a0', '#c98f6e', '#9fb7a6', '#e2b6a4', '#b7a3c9'];
    for (let i = 0; i < 7; i++) { const x = LX + 40 + i * 360, w = 320, h = 360 + (i % 3) * 60, y = 860 - h; facade(g, x, y, w, h, cols[i % 5], 60 + i, { cw: 60, ch: 70, mx: 34, my: 36, lit: 0.1, ground: 90 });
      g.fillStyle = shade(cols[i % 5], -0.45); g.beginPath(); g.moveTo(x - 20, y); g.lineTo(x + w / 2, y - 110); g.lineTo(x + w + 20, y); g.fill(); }
    for (let i = 0; i < 8; i++) tree(g, LX + 200 + i * 330, 880, 1.1, '#5f9a5d', 70 + i);
  },
  back(g) {
    // sidewalk and road
    vgrad(g, LX, 860, LW, 90, [[0, '#cfc6b8'], [1, '#b5ab9c']]); g.fillStyle = '#9b9286'; g.fillRect(LX, 945, LW, 14);
    vgrad(g, LX, 959, LW, LH + LY - 959, [[0, '#55596a'], [1, '#3a3d4a']]);
    g.fillStyle = '#e9e1cf'; for (let x = LX; x < LX + LW; x += 200) g.fillRect(x, 1050, 110, 10);
    // our house (front step, door, mailbox) at the left
    box(g, 120, 470, 620, 400, '#e3c9a7', { r: 2, dark: 0.2 }); g.fillStyle = '#8a4a3a'; g.beginPath(); g.moveTo(90, 470); g.lineTo(430, 300); g.lineTo(770, 470); g.fill();
    box(g, 360, 650, 120, 210, '#3d6e74', { r: 4 }); g.fillStyle = '#e9d29a'; g.beginPath(); g.arc(455, 760, 7, 0, Math.PI * 2); g.fill();
    for (const x of [180, 540]) { vgrad(g, x, 560, 130, 120, [[0, '#ffe2a8'], [1, '#f2a65a']]); g.strokeStyle = '#f6f1e8'; g.lineWidth = 10; g.strokeRect(x, 560, 130, 120); }
    box(g, 340, 856, 160, 14, '#bfb6a8', { r: 2 });
    car(g, 1150, 1000, 0.95, '#d0563f', 1); car(g, 2050, 1010, 0.95, '#3f6f9f', -1);
    // lamp post
    g.fillStyle = '#2b2e38'; g.fillRect(860, 520, 12, 350); g.fillRect(830, 515, 80, 10); g.fillStyle = '#ffe9b8'; g.fillRect(890, 524, 26, 10);
  },
  glow(g) { glow(g, 1500, 700, 700, 'rgba(255,220,170,0.25)'); },
  fg(g) { // a hedge and a mailbox, close and soft
    g.fillStyle = '#2f5a3a'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(LX + 60 + i * 90, 1180 + (i % 2) * 20, 90, 0, Math.PI * 2); g.fill(); }
  },
};

/* ---------- bedroom at night (3 a.m., midnight): the same room, moonlit, the bedside lamp on ---------- */
SETS.bedroomN = {
  k: { far: 0.45, fg: 1.3 }, tint: 'rgba(14,18,52,0.62)',
  far(g) {
    sky(g, LX, LY, LW, LH, [[0, '#070a1c'], [0.6, '#1a1f45'], [1, '#2c2a55']]);
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + hash(i * 7) * 0.6})`; g.fillRect(LX + hash(i * 3) * 1400, LY + hash(i * 5) * 700, 2, 2); }
    g.fillStyle = '#f4efd8'; g.beginPath(); g.arc(520, 330, 46, 0, Math.PI * 2); g.fill(); glow(g, 520, 330, 220, 'rgba(200,215,255,0.5)');
    skyline(g, LX, 1100, 700, 60, 210, '#141633', 41, { lit: 0.12 }); skyline(g, LX, 1100, 760, 30, 120, '#0d0f24', 42, { lit: 0.18 });
  },
  back(g) { SETS.bedroom.back(g); },
  glow(g) {
    shaft(g, [[230, 240], [650, 240], [1500, 1150], [600, 1150]], 'rgba(150,175,255,0.4)', 0.35);
    glow(g, 730, 700, 260, 'rgba(255,200,130,0.75)'); glow(g, 730, 700, 520, 'rgba(255,180,110,0.22)');
  },
  fg(g) { SETS.bedroom.fg(g); },
};

/* ---------- classroom (side view: the board on the left, desks facing it, windows on the right) ---------- */
SETS.classroom = {
  k: { far: 0.45, fg: 1.3 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#7fb6dc'], [0.7, '#d5e7ea'], [1, '#f6e6c4']]); for (let i = 0; i < 6; i++) tree(g, 1500 + i * 150, 760, 1 + hash(i + 3) * 0.4, '#6aa064', 30 + i); facade(g, 1950, 380, 400, 420, '#c48a6c', 33, { lit: 0.04, glass: '#8fb1c9' }); },
  back(g) {
    wall(g, LX, LY, LW, 905 - LY, '#d8e4d6', 21);
    g.fillStyle = '#c3d3c4'; g.fillRect(LX, 640, LW, 265); g.fillStyle = '#eef3ec'; g.fillRect(LX, 632, LW, 10);
    // the windows (cut out)
    for (const x of [1480, 1860]) { g.globalCompositeOperation = 'destination-out'; g.fillRect(x, 170, 300, 420); g.globalCompositeOperation = 'source-over'; windowFrame(g, x, 170, 300, 420, '#f4f2ec'); }
    // the blackboard with old chalk work
    box(g, 120, 160, 900, 440, '#6b4a33', { r: 6 }); vgrad(g, 140, 180, 860, 400, [[0, '#2f4a3e'], [1, '#253a31']]);
    g.globalAlpha = 0.08; g.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) g.fillRect(150 + i * 95, 190, 60, 380); g.globalAlpha = 1;
    const ch = (s, x, y, sz = 34, a = 0.85) => txt(g, s, x, y, `italic 500 ${sz}px ${SERIF}`, `rgba(240,240,232,${a})`, 'left');
    ch('x² + 7x + 12 = 0', 190, 260); ch('(x + 3)(x + 4) = 0', 190, 320); ch('x = −3,  x = −4', 190, 380, 34, 0.7);
    ch('a² + b² = c²', 640, 260); ch('sin θ = opp / hyp', 640, 330, 30, 0.75); ch('TEST TODAY · 20 Q', 560, 520, 36, 0.95);
    g.strokeStyle = 'rgba(240,240,232,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(560, 530); g.lineTo(880, 530); g.stroke();
    box(g, 130, 596, 880, 16, '#7d5a40', { r: 3 }); for (let i = 0; i < 4; i++) { g.fillStyle = ['#f4f2ec', '#f2c230', '#f4f2ec', '#e88a8a'][i]; g.fillRect(300 + i * 40, 588, 26, 8); }
    // the periodic table poster and a map
    g.fillStyle = '#f2efe6'; g.fillRect(1080, 220, 320, 210); for (let r = 0; r < 7; r++) for (let c = 0; c < 18; c++) { if (r === 0 && c > 0 && c < 17) continue; if (r < 3 && c > 1 && c < 12) continue; g.fillStyle = ['#e9a26a', '#8fc0d8', '#b6d38a', '#e6d27a', '#c9a6d8'][(c + r) % 5]; g.fillRect(1092 + c * 16.6, 234 + r * 24, 14, 20); }
    txt(g, 'PERIODIC TABLE', 1240, 422, `700 14px ${SANS}`, '#4a4a55');
    // floor
    vgrad(g, LX, 905, LW, LH + LY - 905, [[0, '#b9b2a2'], [1, '#d4cdbd']]); g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 2; for (let x = LX; x < LX + LW; x += 110) { g.beginPath(); g.moveTo(x, 905); g.lineTo(x + (x - 960) * 0.5, 1215); g.stroke(); }
    ao(g, LX, 905, LW, 40, 'down', 0.35);
    // the teacher's desk (front left) with a stack of papers and an apple
    box(g, 160, 760, 420, 40, '#8a6446', { r: 4, top: 10 }); box(g, 180, 800, 380, 110, '#77553b', { r: 3 }); g.fillStyle = '#f4f2ec'; g.fillRect(230, 735, 120, 24); g.fillRect(236, 729, 112, 6);
    g.fillStyle = '#d23b33'; g.beginPath(); g.arc(470, 738, 20, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(470, 720); g.lineTo(474, 708); g.stroke();
  },
  glow(g) { for (const x of [1480, 1860]) shaft(g, [[x, 180], [x + 300, 180], [x - 260, 1150], [x - 640, 1150]], 'rgba(255,244,214,0.55)', 0.3); },
  fg(g) { box(g, LX - 40, 1040, 640, 300, '#8a6446', { r: 10 }); },
};

/* ---------- school hallway: lockers, a notice board, ceiling lights, a shiny floor ---------- */
SETS.hallway = {
  k: { far: 0.5, fg: 1.3 },
  back(g) {
    wall(g, LX, LY, LW, 930 - LY, '#e9dcc4', 22);
    g.fillStyle = '#d9c9ad'; g.fillRect(LX, LY, LW, 90);
    for (let x = LX + 120; x < LX + LW; x += 420) { g.fillStyle = '#f7f4ea'; g.fillRect(x, LY + 90, 200, 18); }
    // notice board and a banner
    box(g, 260, 210, 520, 230, '#9a6a44', { r: 4 }); g.fillStyle = '#c99a6a'; g.fillRect(274, 224, 492, 202);
    for (const [x, y, w, h, c, s] of [[290, 240, 140, 100, '#fff6d6', 'SCIENCE FAIR'], [450, 236, 120, 160, '#d6eaff', 'TRYOUTS'], [590, 250, 160, 90, '#ffd6d6', 'BAKE SALE'], [300, 352, 130, 60, '#e8ffd6', 'LOST CAT']]) { g.fillStyle = c; g.save(); g.translate(x + w / 2, y + h / 2); g.rotate((hash(x) - 0.5) * 0.08); g.fillRect(-w / 2, -h / 2, w, h); txt(g, s, 0, -h / 2 + 26, `700 15px ${SANS}`, '#33343f'); g.restore(); g.fillStyle = '#e0483e'; g.beginPath(); g.arc(x + w / 2, y + 6, 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#2f6fbf'; g.fillRect(1060, 230, 760, 80); txt(g, 'GO HAWKS!', 1440, 290, `700 48px ${COND}`, '#f2c230');
    // lockers
    for (let x = LX; x < LX + LW; x += 96) {
      vgrad(g, x + 3, 470, 90, 455, [[0, '#4f8fa8'], [1, '#356c82']]); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 4; k++) g.fillRect(x + 22, 494 + k * 10, 48, 4);
      g.fillStyle = '#c9d2d8'; g.fillRect(x + 74, 660, 8, 40); txt(g, String(200 + Math.round((x - LX) / 96)), x + 46, 560, `600 14px ${SANS}`, 'rgba(255,255,255,0.55)');
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 3, 470, 6, 455);
    }
    g.fillStyle = '#2b4f60'; g.fillRect(LX, 925, LW, 10);
    // the floor (polished, with the lockers' reflection)
    vgrad(g, LX, 935, LW, LH + LY - 935, [[0, '#cfc7b4'], [1, '#e6e0d0']]);
    g.globalAlpha = 0.18; for (let x = LX; x < LX + LW; x += 96) { vgrad(g, x + 3, 935, 90, 120, [[0, '#4f8fa8'], [1, 'rgba(79,143,168,0)']]); } g.globalAlpha = 1;
    g.strokeStyle = 'rgba(0,0,0,0.06)'; for (let x = LX; x < LX + LW; x += 140) { g.beginPath(); g.moveTo(x, 935); g.lineTo(x + (x - 960) * 0.5, 1215); g.stroke(); }
    ao(g, LX, 935, LW, 30, 'down', 0.3);
  },
  glow(g) { for (let x = LX + 220; x < LX + LW; x += 420) glow(g, x, LY + 110, 260, 'rgba(255,250,235,0.45)'); },
  fg(g) { box(g, 1960, LY, 500, LH, '#c9b99a', { r: 2 }); },
};

/* ---------- the backyard, late afternoon: the old tree, a fence, the shed, the neighbours' roofs ---------- */
SETS.backyard = {
  k: { far: 0.4, mid: 0.7, fg: 1.35 },
  far(g) {
    sky(g, LX, LY, LW, LH, [[0, '#5f8fc9'], [0.5, '#e9b98a'], [0.8, '#ffd39a'], [1, '#ffe6b8']]);
    glow(g, 1750, 560, 600, 'rgba(255,214,150,0.85)');
    for (let i = 0; i < 4; i++) cloud(g, 150 + i * 560, 180 + (i % 2) * 70, 0.9, '#ffe2c4', 0.55);
  },
  mid(g) {
    // neighbours' roofs and trees over the fence
    for (let i = 0; i < 5; i++) { const x = LX + 60 + i * 520, w = 420, y = 470 + (i % 2) * 40; g.fillStyle = ['#9b6b5a', '#7d6a8a', '#8a7a5a', '#6a7d8a', '#9b6b5a'][i]; g.beginPath(); g.moveTo(x, y + 120); g.lineTo(x + w / 2, y); g.lineTo(x + w, y + 120); g.fill(); g.fillStyle = ['#e7d2b8', '#d9c8d8', '#e8dcc0', '#cfdbe0', '#e7d2b8'][i]; g.fillRect(x + 30, y + 120, w - 60, 200); g.fillStyle = 'rgba(255,220,160,0.7)'; g.fillRect(x + 90, y + 160, 50, 50); g.fillRect(x + w - 140, y + 160, 50, 50); }
    for (let i = 0; i < 7; i++) tree(g, LX + 140 + i * 360, 640, 1.3, '#5d8f55', 90 + i);
  },
  back(g) {
    // the fence
    for (let x = LX; x < LX + LW; x += 44) { const hh = 300 + (hash(x) - 0.5) * 8; vgrad(g, x, 860 - hh, 40, hh, [[0, '#b98a5e'], [1, '#8a6240']]); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x + 38, 860 - hh, 3, hh); g.fillStyle = '#a07650'; g.beginPath(); g.moveTo(x, 860 - hh); g.lineTo(x + 20, 840 - hh); g.lineTo(x + 40, 860 - hh); g.fill(); }
    g.fillStyle = '#7a5434'; g.fillRect(LX, 640, LW, 18); g.fillRect(LX, 790, LW, 18);
    // the shed on the right
    box(g, 1700, 540, 380, 340, '#6f8f7a', { r: 2 }); g.fillStyle = '#4a3a3a'; g.beginPath(); g.moveTo(1670, 548); g.lineTo(1890, 430); g.lineTo(2110, 548); g.fill(); box(g, 1830, 650, 120, 230, '#5a7564', { r: 2 }); g.fillStyle = '#d9c7a0'; g.beginPath(); g.arc(1930, 760, 6, 0, Math.PI * 2); g.fill();
    // the lawn
    vgrad(g, LX, 860, LW, LH + LY - 860, [[0, '#7aa255'], [1, '#4f7a3a']]);
    const r = rng(17); g.strokeStyle = '#5d8a42'; g.lineWidth = 3; for (let i = 0; i < 900; i++) { const x = LX + r() * LW, y = 870 + r() * 340; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y - 10 - r() * 10); g.stroke(); }
    ao(g, LX, 860, LW, 40, 'down', 0.3);
    // flower bed along the fence
    for (let i = 0; i < 40; i++) { const x = LX + 900 + i * 22, y = 862 + (i % 3) * 6; g.fillStyle = ['#e0483e', '#f2c230', '#f4f2ec', '#c94f7c'][i % 4]; g.beginPath(); g.arc(x, y - 18, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4f7a3a'; g.fillRect(x - 1, y - 14, 3, 16); }
    // the old tree: a thick trunk with roots, a big canopy over the top left
    const tx = 560;
    g.fillStyle = '#5a3d2a'; g.beginPath(); g.moveTo(tx - 90, 900); g.quadraticCurveTo(tx - 60, 600, tx - 70, 300); g.lineTo(tx + 60, 300); g.quadraticCurveTo(tx + 50, 600, tx + 100, 900); g.closePath(); g.fill();
    g.fillStyle = '#4a3222'; g.beginPath(); g.moveTo(tx - 90, 900); g.quadraticCurveTo(tx - 160, 905, tx - 220, 925); g.lineTo(tx - 60, 910); g.closePath(); g.fill(); g.beginPath(); g.moveTo(tx + 100, 900); g.quadraticCurveTo(tx + 170, 905, tx + 230, 930); g.lineTo(tx + 60, 912); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,18,10,0.35)'; g.lineWidth = 4; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(tx - 50 + k * 22, 880); g.quadraticCurveTo(tx - 40 + k * 20, 600, tx - 40 + k * 18, 320); g.stroke(); }
    g.fillStyle = 'rgba(255,200,130,0.25)'; g.beginPath(); g.moveTo(tx + 40, 880); g.quadraticCurveTo(tx + 40, 600, tx + 50, 320); g.lineTo(tx + 60, 300); g.quadraticCurveTo(tx + 50, 600, tx + 100, 900); g.closePath(); g.fill();
    const r2 = rng(23); for (let i = 0; i < 26; i++) { g.fillStyle = shade('#4f7f45', (r2() - 0.6) * 0.35); g.beginPath(); g.arc(tx + (r2() - 0.5) * 900, 120 + r2() * 240 - 60, 90 + r2() * 90, 0, Math.PI * 2); g.fill(); }
    // a swing hanging from a branch
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 8; g.beginPath(); g.moveTo(tx + 60, 330); g.quadraticCurveTo(tx + 260, 300, tx + 420, 360); g.stroke(); g.strokeStyle = '#d9cbb0'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx + 300, 335); g.lineTo(tx + 300, 700); g.moveTo(tx + 380, 350); g.lineTo(tx + 380, 700); g.stroke(); box(g, tx + 288, 698, 104, 14, '#8a6240', { r: 3 });
  },
  glow(g) { glow(g, 1750, 560, 900, 'rgba(255,200,130,0.35)'); shaft(g, [[1500, 300], [2100, 300], [1200, 1200], [300, 1200]], 'rgba(255,214,150,0.4)', 0.22); },
  fg(g) { for (let i = 0; i < 9; i++) { g.fillStyle = shade('#3f6a33', (hash(i) - 0.5) * 0.3); g.beginPath(); g.ellipse(LX + 100 + i * 300, 1240 + (i % 2) * 30, 220, 120, 0, 0, Math.PI * 2); g.fill(); } },
};

/* ---------- the front of your house (day: news vans; night: the black car) ---------- */
function houseFar(g, night) {
  sky(g, LX, LY, LW, LH, night ? [[0, '#05081a'], [0.6, '#151a3c'], [1, '#2a2650']] : [[0, '#6aa2d0'], [0.6, '#bcd6e2'], [1, '#ffe6c0']]);
  if (night) { for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + hash(i * 11) * 0.6})`; g.fillRect(LX + hash(i * 3) * LW, LY + hash(i * 5) * 600, 2, 2); } g.fillStyle = '#f4efd8'; g.beginPath(); g.arc(1780, 160, 40, 0, Math.PI * 2); g.fill(); glow(g, 1780, 160, 200, 'rgba(200,215,255,0.45)'); }
  else for (let i = 0; i < 4; i++) cloud(g, 200 + i * 560, 170 + (i % 2) * 80, 0.9, '#ffffff', 0.6);
  for (let i = 0; i < 6; i++) { const x = LX + i * 460, y = 520 + (i % 2) * 50; g.fillStyle = night ? '#141734' : '#9fb3c8'; g.beginPath(); g.moveTo(x, y + 90); g.lineTo(x + 200, y); g.lineTo(x + 400, y + 90); g.fill(); g.fillRect(x + 20, y + 90, 360, 260); if (night) { g.fillStyle = 'rgba(255,214,150,0.75)'; g.fillRect(x + 80, y + 150, 40, 40); g.fillRect(x + 260, y + 150, 40, 40); } }
}
function houseBack(g, night) {
  // the house: two storeys, a porch with steps and a light, your bedroom window upstairs on the left
  box(g, 260, 260, 1260, 640, '#e3c9a7', { r: 2, dark: 0.22 }); g.fillStyle = 'rgba(0,0,0,0.05)'; for (let y = 280; y < 900; y += 26) g.fillRect(260, y, 1260, 3);
  g.fillStyle = '#7a3f34'; g.beginPath(); g.moveTo(200, 268); g.lineTo(890, 30); g.lineTo(1580, 268); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 1; k < 8; k++) { g.fillRect(200 + k * 20, 268 - k * 30, 1380 - k * 40, 4); }
  box(g, 1080, 60, 90, 160, '#8a4a3a', { r: 2 });
  const win = (x, y, w, h, lit) => { vgrad(g, x, y, w, h, lit ? [[0, '#ffe2a8'], [1, '#f2a65a']] : [[0, '#8fb1c9'], [1, '#5c7f99']]); g.strokeStyle = '#f6f1e8'; g.lineWidth = 12; g.strokeRect(x, y, w, h); g.lineWidth = 6; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke(); box(g, x - 16, y + h + 4, w + 32, 14, '#d8cbb6', { r: 2 }); };
  win(360, 340, 220, 190, night); win(1180, 340, 220, 190, false); win(360, 640, 220, 190, night); win(1180, 640, 220, 190, night);
  // the porch: roof, posts, door, light
  g.fillStyle = '#6a3a30'; g.beginPath(); g.moveTo(700, 600); g.lineTo(890, 540); g.lineTo(1080, 600); g.fill(); box(g, 690, 596, 400, 22, '#efe6d6', { r: 3 });
  for (const x of [714, 1050]) box(g, x, 618, 18, 262, '#efe6d6', { r: 3 });
  box(g, 820, 650, 140, 230, '#3d6e74', { r: 4 }); g.fillStyle = '#e9d29a'; g.beginPath(); g.arc(940, 770, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(840, 670, 100, 70);
  g.fillStyle = night ? '#ffe9b8' : '#d9cba8'; g.beginPath(); g.arc(1000, 660, 12, 0, Math.PI * 2); g.fill();
  for (let k = 0; k < 3; k++) box(g, 780 - k * 20, 880 + k * 26, 220 + k * 40, 26, '#cfc3ae', { r: 2 });
  // lawn, path, hedge, mailbox
  vgrad(g, LX, 900, LW, 70, [[0, '#6f9a4f'], [1, '#5d8a42']]); g.fillStyle = '#d6cbb6'; g.beginPath(); g.moveTo(780, 958); g.lineTo(1000, 958); g.lineTo(1060, 970); g.lineTo(720, 970); g.fill();
  for (let i = 0; i < 9; i++) { g.fillStyle = '#3f6e3a'; g.beginPath(); g.arc(300 + i * 52, 890, 44, Math.PI, 0); g.fill(); g.beginPath(); g.arc(1110 + i * 48, 890, 42, Math.PI, 0); g.fill(); }
  g.fillStyle = '#4a4f5a'; g.fillRect(150, 820, 10, 140); box(g, 110, 780, 90, 56, '#2f6fbf', { r: 10 }); g.fillStyle = '#e0483e'; g.fillRect(192, 774, 6, 30);
  // pavement, kerb, road
  vgrad(g, LX, 966, LW, 70, [[0, '#cfc6b8'], [1, '#b5ab9c']]); g.fillStyle = '#9b9286'; g.fillRect(LX, 1032, LW, 12);
  vgrad(g, LX, 1044, LW, LH + LY - 1044, [[0, '#55596a'], [1, '#3a3d4a']]);
  // the street lamp on the right
  g.fillStyle = '#2b2e38'; g.fillRect(1840, 520, 14, 520); g.fillRect(1800, 512, 90, 12); g.fillStyle = night ? '#ffe9b8' : '#cfd3d8'; g.fillRect(1800, 524, 34, 12);
}
SETS.houseDay = { k: { far: 0.4, fg: 1.3 }, far(g) { houseFar(g, false); }, back(g) { houseBack(g, false); }, glow(g) { glow(g, 1500, 400, 900, 'rgba(255,236,200,0.2)'); } };
SETS.houseNight = {
  k: { far: 0.4, fg: 1.3 }, tint: 'rgba(16,20,56,0.55)',
  far(g) { houseFar(g, true); },
  back(g) { houseBack(g, true); },
  // lit windows and lamps drawn again on top of the night tint
  glow(g) { for (const [x, y] of [[360, 340], [360, 640], [1180, 640]]) { g.globalAlpha = 0.9; vgrad(g, x + 6, y + 6, 208, 178, [[0, '#ffdca0'], [1, '#f0a050']]); g.globalAlpha = 1; glow(g, x + 110, y + 95, 240, 'rgba(255,190,110,0.5)'); }
    glow(g, 1000, 660, 160, 'rgba(255,220,160,0.9)'); glow(g, 1817, 532, 200, 'rgba(255,220,160,0.8)'); shaft(g, [[1800, 536], [1834, 536], [2040, 1100], [1580, 1100]], 'rgba(255,220,160,0.5)', 0.35); },
};

/* ---------- the university lab: a wall-sized whiteboard of failed attempts ---------- */
SETS.lab = {
  k: { far: 0.45, fg: 1.3 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#8cb8d8'], [1, '#e2ecef']]); facade(g, 1580, 260, 600, 700, '#b9806a', 71, { lit: 0.06, glass: '#8fb1c9' }); for (let i = 0; i < 3; i++) tree(g, 1660 + i * 180, 800, 1.2, '#5d8f55', 80 + i); },
  back(g) {
    wall(g, LX, LY, LW, 930 - LY, '#e6e9ec', 31);
    g.globalCompositeOperation = 'destination-out'; g.fillRect(1640, 190, 420, 420); g.globalCompositeOperation = 'source-over'; windowFrame(g, 1640, 190, 420, 420, '#f4f6f4');
    // the whiteboard: thirty years of crossed-out attempts
    box(g, 200, 170, 1320, 520, '#c9ced4', { r: 6 }); g.fillStyle = '#fbfcfd'; g.fillRect(216, 186, 1288, 488);
    const r = rng(41), syms = ['Ω_dm ≈ 0.27', 'ρ(r) ∝ 1/r²', 'v(r) = √(GM/r)', 'WIMP?', 'axion?', 'm ≈ 10⁻²² eV', '∇²Φ = 4πGρ', 'σ v ≈ 3×10⁻²⁶', 'MOND?', 'L = ½(∂φ)² − V(φ)', 'sterile ν?', 'Λ CDM'];
    for (let i = 0; i < 30; i++) { const x = 240 + r() * 1150, y = 220 + r() * 430, s = syms[i % syms.length], col = ['#2b4fa0', '#1f2430', '#b03a3a'][i % 3]; txt(g, s, x, y, `italic 500 ${22 + r() * 12}px ${SERIF}`, col, 'left', 0.55 + r() * 0.3); if (r() < 0.45) { g.strokeStyle = 'rgba(176,58,58,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 6, y - 8); g.lineTo(x + 170, y - 14); g.stroke(); } }
    g.strokeStyle = '#2b4fa0'; g.lineWidth = 3; g.beginPath(); g.moveTo(1100, 560); g.quadraticCurveTo(1200, 400, 1400, 420); g.stroke(); txt(g, '???', 1420, 430, `700 40px ${SERIF}`, '#b03a3a', 'left');
    box(g, 230, 684, 1260, 14, '#aab1b8', { r: 3 }); for (let i = 0; i < 3; i++) { g.fillStyle = ['#2b4fa0', '#1f2430', '#b03a3a'][i]; rr(g, 300 + i * 70, 670, 54, 14, 5); g.fill(); }
    // lab bench with glassware on the right
    box(g, 1560, 690, 640, 30, '#2f3442', { r: 3 }); box(g, 1580, 720, 600, 210, '#d6dbe0', { r: 3 }); g.fillStyle = '#b7bec6'; for (const x of [1780, 1980]) g.fillRect(x, 730, 4, 190);
    for (let i = 0; i < 6; i++) { const x = 1600 + i * 95; g.fillStyle = 'rgba(200,230,245,0.75)'; g.beginPath(); g.moveTo(x, 690); g.lineTo(x + 50, 690); g.lineTo(x + 40, 620 - (i % 2) * 30); g.lineTo(x + 10, 620 - (i % 2) * 30); g.closePath(); g.fill(); g.fillStyle = ['#5fd0b0', '#f2c230', '#7fa7ff', '#e88a8a', '#5fd0b0', '#c9a6d8'][i]; g.fillRect(x + 6, 664, 38, 24); }
    // floor
    vgrad(g, LX, 930, LW, LH + LY - 930, [[0, '#9fa7b0'], [1, '#c3c9cf']]); ao(g, LX, 930, LW, 40, 'down', 0.3);
    // her stool
    g.fillStyle = '#3a3f4c'; g.fillRect(1290, 860, 12, 90); g.fillRect(1250, 940, 92, 8); box(g, 1240, 840, 112, 22, '#2fa79a', { r: 10 });
  },
  glow(g) { shaft(g, [[1640, 200], [2060, 200], [1700, 1150], [1150, 1150]], 'rgba(255,250,235,0.5)', 0.25); glow(g, 860, 120, 700, 'rgba(255,255,255,0.18)'); },
  fg(g) { box(g, LX - 60, 980, 520, 400, '#2f3442', { r: 6 }); g.fillStyle = 'rgba(200,230,245,0.6)'; g.beginPath(); g.arc(LX + 200, 960, 60, 0, Math.PI * 2); g.fill(); },
};

/* ---------- the bookshop window on the walk to school (your reflection is drawn live into the glass) ---------- */
const SHOPWIN = { x: 520, y: 250, w: 1300, h: 610 };
SETS.shop = {
  k: { far: 0.5, fg: 1.3 },
  back(g) {
    // brick front
    vgrad(g, LX, LY, LW, 960 - LY, [[0, '#7a4a3e'], [1, '#8f5a48']]); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; for (let y = LY; y < 960; y += 30) { g.beginPath(); g.moveTo(LX, y); g.lineTo(LX + LW, y); g.stroke(); for (let x = LX + ((y / 30) % 2) * 35; x < LX + LW; x += 70) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 30); g.stroke(); } }
    // sign + awning
    box(g, 420, 40, 1500, 120, '#1f3a34', { r: 6 }); txt(g, 'CORNER BOOKS', 1170, 125, `700 72px ${SERIF}`, '#f2d08a');
    for (let i = 0; i < 15; i++) { g.fillStyle = i % 2 ? '#f4efe4' : '#2f7a6a'; g.beginPath(); g.moveTo(440 + i * 98, 170); g.lineTo(538 + i * 98, 170); g.lineTo(538 + i * 98, 220); g.quadraticCurveTo(489 + i * 98, 240, 440 + i * 98, 220); g.closePath(); g.fill(); }
    // the window: dark glass with shelves of books faintly inside
    const S = SHOPWIN; box(g, S.x - 26, S.y - 26, S.w + 52, S.h + 52, '#1f3a34', { r: 4 });
    vgrad(g, S.x, S.y, S.w, S.h, [[0, '#1b2430'], [1, '#121820']]);
    for (let k = 0; k < 4; k++) { g.fillStyle = '#3a2a22'; g.fillRect(S.x + 40, S.y + 120 + k * 130, S.w - 80, 10); g.globalAlpha = 0.45; books(g, S.x + 50, S.y + 120 + k * 130, S.w - 100, 50 + k); g.globalAlpha = 1; }
    g.fillStyle = 'rgba(10,14,20,0.35)'; g.fillRect(S.x, S.y, S.w, S.h);
    // sill and pavement
    box(g, S.x - 40, S.y + S.h + 20, S.w + 80, 30, '#6a6f78', { r: 3 });
    vgrad(g, LX, 960, LW, LH + LY - 960, [[0, '#cfc6b8'], [1, '#b0a696']]); ao(g, LX, 960, LW, 40, 'down', 0.3);
    g.strokeStyle = 'rgba(0,0,0,0.1)'; for (let x = LX; x < LX + LW; x += 160) { g.beginPath(); g.moveTo(x, 960); g.lineTo(x + (x - 960) * 0.5, 1215); g.stroke(); }
  },
  glow(g) { glow(g, 1600, 400, 700, 'rgba(255,240,210,0.2)'); },
};

// composite a set under camera C; actors(g) draws the characters in set space (k=1)
function drawSet(g, name, C, t, actors, opt = {}) {
  const S = SETS[name], K = S.k || {}, tint = S.tint ? { tint: S.tint } : {};
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (S.far) { camK(g, C, K.far ?? 0.5, t); putL(g, LAY(name + '.far', S.far, { res: 0.6, blur: opt.farBlur ?? 3 }), LX, LY); }
  if (S.mid) { camK(g, C, K.mid ?? 0.75, t); putL(g, LAY(name + '.mid', S.mid, Object.assign({ blur: 1.5 }, tint)), LX, LY); }
  if (opt.beforeBack) { camK(g, C, 1, t); opt.beforeBack(g); }
  camK(g, C, 1, t); putL(g, LAY(name + '.back', S.back, tint), LX, LY);
  if (opt.blurBack) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(8,6,16,${opt.blurBack})`; g.fillRect(0, 0, W, H); }
  camK(g, C, 1, t); if (actors) actors(g);
  if (S.glow && opt.glow !== false) { camK(g, C, 1, t); g.globalCompositeOperation = 'lighter'; putL(g, LAY(name + '.glow', S.glow, { res: 0.5, blur: 6 }), LX, LY); g.globalCompositeOperation = 'source-over'; }
  if (opt.after) { camK(g, C, 1, t); opt.after(g); }
  if (S.fg && opt.fg !== false) { const kf = K.fg ?? 1.3; camK(g, C, kf, t); putL(g, LAY(name + '.fg', S.fg, name === 'kitchen' || name === 'living' ? tint : Object.assign({ res: 0.5, blur: 10 }, tint)), LX, LY); }
  if (opt.front) { camK(g, C, 1, t); opt.front(g); }
}
// a soft blurred backdrop of a set for close-ups (cached), dimmed
function setBlur(g, name, C, t, dim = 0.35) {
  const S = SETS[name];
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const c = LAYER(name + '.soft', LW, LH, (q) => { q.translate(-LX, -LY); if (S.far) S.far(q); if (S.mid) S.mid(q); S.back(q); if (S.tint) { q.globalCompositeOperation = 'source-atop'; q.fillStyle = S.tint; q.fillRect(LX, LY, LW, LH); } q.globalCompositeOperation = 'source-over'; if (S.glow) { q.globalCompositeOperation = 'lighter'; S.glow(q); q.globalCompositeOperation = 'source-over'; } }, { res: 0.35, blur: 16 });
  camK(g, C, 1, t); putL(g, c, LX, LY);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(8,6,16,${dim})`; g.fillRect(0, 0, W, H);
}
