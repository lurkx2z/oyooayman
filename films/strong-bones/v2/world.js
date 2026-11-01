/* =====================================================================
   WORLD (v2) — the sets. Each set is painted once into cached layers at different depths:
     far (seen through windows / sky, k≈0.5) → back (walls, furniture, k=1) → [actors] → fg (near props, blurred, k≈1.3)
     → glow (light shafts and lamp glow, added on top).
   drawSet(g, name, C, t, actors) composites them under the parallax camera C = {x, y, z}.
   Layers are 2400×1350 set pixels with the 1920×1080 frame at (240, 135), so cameras can pan and zoom out a little.
   ===================================================================== */

const LW = 2400, LH = 1350, LX = -240, LY = -135;
const LAY = (key, fn, opt) => LAYER(key, LW, LH, (g) => { g.translate(-LX, -LY); fn(g); }, opt);

const SETS = {};

/* ---------- bedroom, dawn ---------- */
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
    g.fillStyle = '#26324b'; g.fillRect(780, 250, 140, 200); txt(g, 'LIFT', 850, 330, `700 44px ${COND}`, '#f2c230'); txt(g, 'HEAVY', 850, 380, `700 36px ${COND}`, '#e9e1d2');
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

/* ---------- kitchen, morning ---------- */
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
const KIT2 = { top: 760 };
const ADOOR = { x: 1500, y: 560, w: 250, h: 320 };   // the arena's back door

/* ---------- street, morning (title) and the street outside the arena at dusk ---------- */
function streetFar(g, dusk) {
  sky(g, LX, LY, LW, LH, dusk ? [[0, '#2c2a55'], [0.5, '#8a5f8f'], [0.78, '#f09a6a'], [1, '#ffcf8a']] : [[0, '#6aa2d0'], [0.5, '#b9d4e0'], [0.8, '#ffe0b8'], [1, '#ffd3a0']]);
  glow(g, 1500, 700, 500, dusk ? 'rgba(255,170,110,0.8)' : 'rgba(255,240,210,0.8)');
  for (let i = 0; i < 4; i++) cloud(g, 200 + i * 520, 200 + (i % 2) * 90, 0.9, dusk ? '#e7a49a' : '#ffffff', 0.55);
  skyline(g, LX, LX + LW, 760, 120, 380, dusk ? '#4a3a62' : '#9fb3c8', 51, { lit: dusk ? 0.2 : 0 });
  // the arena dome in the distance (planted in the title shot)
  g.fillStyle = dusk ? '#3e3258' : '#8ea5bd'; g.beginPath(); g.ellipse(1700, 760, 260, 120, 0, Math.PI, 0); g.fill(); g.fillRect(1440, 740, 520, 30);
  g.strokeStyle = dusk ? 'rgba(255,220,160,0.6)' : 'rgba(255,255,255,0.4)'; g.lineWidth = 3; for (let k = 1; k < 6; k++) { g.beginPath(); g.ellipse(1700, 760, 260 * k / 6, 120, 0, Math.PI, 0); g.stroke(); }
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
SETS.arenaOut = {
  k: { far: 0.35, fg: 1.35 },
  far(g) { streetFar(g, true); },
  back(g) {
    // the arena's back wall with the loading door (open, warm light inside) on the left
    box(g, LX, 160, 1080, 760, '#3b3550', { r: 2, dark: 0.3 }); g.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 200; y < 900; y += 40) g.fillRect(LX, y, 1080, 3);
    g.globalCompositeOperation = 'destination-out'; g.fillRect(260, 420, 420, 500); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#1f1b2b'; g.fillRect(250, 400, 440, 22); for (let i = 0; i < 11; i++) { g.fillStyle = i % 2 ? '#f2c230' : '#1b1b22'; g.beginPath(); g.moveTo(250 + i * 40, 400); g.lineTo(290 + i * 40, 400); g.lineTo(270 + i * 40, 422); g.lineTo(230 + i * 40, 422); g.fill(); }
    txt(g, 'LOADING · ATHLETES', 470, 380, `700 30px ${COND}`, 'rgba(255,220,160,0.75)');
    // the new building under construction on the right (the scaffold itself is drawn live, it moves)
    box(g, 1240, 120, 760, 800, '#8a7f86', { r: 2, dark: 0.35 });
    for (let y = 170; y < 880; y += 120) for (let x = 1290; x < 1960; x += 130) { g.fillStyle = '#2a2638'; g.fillRect(x, y, 80, 80); }
    g.fillStyle = '#6a5f68'; for (let y = 120; y < 920; y += 120) g.fillRect(1240, y, 760, 10);
    // pavement, kerb, road
    vgrad(g, LX, 900, LW, 70, [[0, '#7e7487'], [1, '#655c70']]); g.fillStyle = '#4f485a'; g.fillRect(LX, 966, LW, 12);
    vgrad(g, LX, 978, LW, LH + LY - 978, [[0, '#3a3548'], [1, '#26222f']]);
    // cones, barrier, a truck at the far right
    for (const x of [1180, 1230, 2080]) { g.fillStyle = '#ef7a2a'; g.beginPath(); g.moveTo(x - 18, 930); g.lineTo(x + 18, 930); g.lineTo(x + 6, 870); g.lineTo(x - 6, 870); g.fill(); g.fillStyle = '#f5f0e6'; g.fillRect(x - 12, 895, 24, 8); }
    box(g, 2040, 690, 360, 230, '#d9d4c9', { r: 8 }); box(g, 1960, 760, 100, 160, '#c0563f', { r: 8 }); for (const x of [2010, 2300]) { g.fillStyle = '#16171f'; g.beginPath(); g.arc(x, 930, 34, 0, Math.PI * 2); g.fill(); }
    // street lamps (lit)
    for (const x of [130, 2160]) { g.fillStyle = '#1f1d28'; g.fillRect(x, 560, 12, 380); g.fillRect(x - 30, 552, 80, 10); g.fillStyle = '#ffe2a8'; g.fillRect(x + 14, 562, 30, 10); }
  },
  // what's behind the loading door: the warm lit corridor of the arena (seen through the cut-out)
  inside(g) { vgrad(g, 250, 400, 450, 530, [[0, '#ffcf8a'], [1, '#c77a4a']]); g.fillStyle = 'rgba(80,40,30,0.35)'; g.fillRect(250, 820, 450, 110); },
  glow(g) { shaft(g, [[260, 920], [680, 920], [900, 1215], [100, 1215]], 'rgba(255,190,120,0.6)', 0.5); glow(g, 146, 572, 140, 'rgba(255,220,160,0.6)'); glow(g, 2176, 572, 140, 'rgba(255,220,160,0.6)'); },
  fg(g) { g.fillStyle = '#16131d'; g.fillRect(LX, LY, 120, LH); },
};

/* ---------- doctor's office ---------- */
SETS.doctor = {
  k: { far: 0.5, fg: 1.3 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#9cc6dc'], [1, '#e6eef0']]); facade(g, 1500, 200, 600, 800, '#c9b8a6', 81, { lit: 0.05 }); },
  back(g) {
    wall(g, LX, LY, LW, 960 - LY, '#bcd6cf', 13);
    g.fillStyle = '#9fc0b8'; g.fillRect(LX, 600, LW, 360); g.fillStyle = '#e8efe9'; g.fillRect(LX, 592, LW, 12);
    // window with blinds on the right
    g.globalCompositeOperation = 'destination-out'; g.fillRect(1560, 180, 420, 380); g.globalCompositeOperation = 'source-over';
    for (let y = 186; y < 560; y += 26) { g.fillStyle = '#eef2ef'; g.fillRect(1560, y, 420, 12); }
    windowFrame(g, 1560, 180, 420, 380, '#f4f6f4', { cross: false });
    // the lightbox (x-ray drawn live) and an anatomy poster
    box(g, 230, 200, 520, 380, '#dfe5ea', { r: 10 }); g.fillStyle = '#1c2230'; rr(g, 254, 224, 472, 332, 6); g.fill();
    g.fillStyle = '#f4f1ea'; g.fillRect(820, 200, 220, 320); g.strokeStyle = '#2b3047'; g.lineWidth = 5; // skeleton poster
    { const cx = 930; g.beginPath(); g.arc(cx, 250, 22, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(cx, 272); g.lineTo(cx, 400); for (let k = 0; k < 4; k++) { g.moveTo(cx - 32, 300 + k * 18); g.quadraticCurveTo(cx, 290 + k * 18, cx + 32, 300 + k * 18); } g.moveTo(cx, 290); g.lineTo(cx - 60, 380); g.moveTo(cx, 290); g.lineTo(cx + 60, 380); g.moveTo(cx, 400); g.lineTo(cx - 34, 500); g.moveTo(cx, 400); g.lineTo(cx + 34, 500); g.stroke(); }
    txt(g, 'THE HUMAN SKELETON', 930, 508, `700 15px ${SANS}`, '#2b3047');
    frame(g, 1110, 250, 150, 110, 1, 12); frame(g, 1300, 260, 120, 90, 0, 13);
    // cabinet with jars, sink
    box(g, 1100, 600, 420, 340, '#e8ecef', { r: 6 }); g.fillStyle = '#c4ccd3'; g.fillRect(1310, 610, 4, 320); g.fillStyle = '#8f99a3'; g.fillRect(1280, 740, 6, 50); g.fillRect(1340, 740, 6, 50);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(210,230,240,0.85)'; rr(g, 1120 + i * 90, 520, 60, 80, 8); g.fill(); g.fillStyle = '#e8e1d6'; g.fillRect(1124 + i * 90, 560, 52, 36); }
    // exam table (padded, paper roll) – the hero sits on it
    box(g, 520, 760, 560, 60, '#5d8fa8', { r: 14 }); g.fillStyle = '#f6f3ec'; g.fillRect(560, 752, 480, 14);
    g.fillStyle = '#9aa5ae'; g.fillRect(580, 820, 20, 140); g.fillRect(1000, 820, 20, 140); g.fillStyle = '#b9c2ca'; g.fillRect(560, 800, 480, 10);
    // floor
    vgrad(g, LX, 960, LW, LH + LY - 960, [[0, '#cdd3cc'], [1, '#e2e6df']]); g.strokeStyle = 'rgba(0,0,0,0.06)'; for (let x = LX; x < LX + LW; x += 120) { g.beginPath(); g.moveTo(x, 960); g.lineTo(x + (x - 960) * 0.6, 1215); g.stroke(); }
    ao(g, LX, 960, LW, 50, 'down', 0.3); ao(g, 500, 960, 600, 30, 'down', 0.4);
    // a chair for Maya
    box(g, 1240, 820, 180, 30, '#c46b4a', { r: 8 }); box(g, 1390, 640, 30, 190, '#c46b4a', { r: 8 }); g.fillStyle = '#5a5f6a'; g.fillRect(1255, 850, 12, 110); g.fillRect(1395, 850, 12, 110);
  },
  glow(g) { for (let k = 0; k < 6; k++) shaft(g, [[1560, 200 + k * 60], [1980, 200 + k * 60], [1500, 980 + k * 30], [1100, 980 + k * 30]], 'rgba(255,250,230,0.12)', 0.35); },
  fg(g) { box(g, 1560, 980, 900, 260, '#8a6a52', { r: 10 }); g.fillStyle = '#2b2e38'; rr(g, 1700, 760, 300, 210, 10); g.fill(); g.fillStyle = '#3f86a8'; rr(g, 1714, 774, 272, 180, 6); g.fill(); },
};

/* ---------- gym ---------- */
SETS.gym = {
  k: { far: 0.55, fg: 1.3 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#ffd8a0'], [1, '#ffb070']]); },
  back(g) {
    // brick wall
    vgrad(g, LX, LY, LW, 980 - LY, [[0, '#4a3238'], [1, '#6b4642']]);
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 3; for (let y = LY; y < 980; y += 34) { g.beginPath(); g.moveTo(LX, y); g.lineTo(LX + LW, y); g.stroke(); for (let x = LX + ((y / 34) % 2) * 40; x < LX + LW; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 34); g.stroke(); } }
    // tall windows high up (light pours in)
    for (const x of [100, 620, 1140, 1660]) { g.globalCompositeOperation = 'destination-out'; g.fillRect(x, 60, 260, 300); g.globalCompositeOperation = 'source-over'; windowFrame(g, x, 60, 260, 300, '#2b2a33', { fw: 14 }); }
    // banners and the rack of plates
    for (const [x, c, s] of [[420, '#2fa79a', 'SLOW'], [940, '#e0483e', 'SMOOTH'], [1460, '#f2c230', 'STRONG']]) { g.fillStyle = c; g.fillRect(x, 400, 140, 230); g.beginPath(); g.moveTo(x, 630); g.lineTo(x + 70, 590); g.lineTo(x + 140, 630); g.fill(); txt(g, s, x + 70, 470, `700 30px ${COND}`, '#191a26'); }
    box(g, 1700, 600, 420, 30, '#2b2e38', { r: 4 }); for (let i = 0; i < 6; i++) { const x = 1730 + i * 66; g.fillStyle = ['#c0392b', '#2f6fbf', '#e0b030', '#3a9a52', '#c0392b', '#2f6fbf'][i]; rr(g, x, 470 + (i % 2) * 20, 40, 160 - (i % 2) * 20, 8); g.fill(); }
    box(g, 1700, 630, 30, 330, '#2b2e38', { r: 3 }); box(g, 2090, 630, 30, 330, '#2b2e38', { r: 3 });
    // rubber floor + the wooden platform
    vgrad(g, LX, 960, LW, LH + LY - 960, [[0, '#2a2a33'], [1, '#1a1a22']]);
    box(g, 560, 950, 800, 40, '#a8794e', { r: 4, top: 0 }); g.strokeStyle = 'rgba(0,0,0,0.2)'; for (let x = 600; x < 1360; x += 70) { g.beginPath(); g.moveTo(x, 952); g.lineTo(x, 988); g.stroke(); }
    ao(g, LX, 960, LW, 40, 'down', 0.4);
    // chalk bowl
    g.fillStyle = '#c9cfd6'; g.fillRect(380, 830, 18, 130); g.fillStyle = '#e8ecef'; g.beginPath(); g.ellipse(389, 830, 60, 18, 0, 0, Math.PI * 2); g.fill();
  },
  glow(g) { for (const x of [100, 620, 1140, 1660]) shaft(g, [[x, 70], [x + 260, 70], [x + 620, 1100], [x + 260, 1100]], 'rgba(255,214,160,0.45)', 0.4); },
  fg(g) { box(g, LX, 900, 380, 400, '#2b2e38', { r: 8 }); for (let i = 0; i < 4; i++) { g.fillStyle = '#16171f'; g.beginPath(); g.arc(LX + 60 + i * 80, 900 - 20, 36, 0, Math.PI * 2); g.fill(); } },
};

/* ---------- arena (the record, the final) ---------- */
SETS.arena = {
  k: { far: 0.55, fg: 1.35 },
  far(g) {
    vgrad(g, LX, LY, LW, LH, [[0, '#0b0b16'], [1, '#1d1830']]);
    // roof truss + spotlights
    g.strokeStyle = '#2a2840'; g.lineWidth = 8; g.beginPath(); g.moveTo(LX, 40); g.lineTo(LX + LW, 40); g.moveTo(LX, 110); g.lineTo(LX + LW, 110); g.stroke(); g.lineWidth = 4; for (let x = LX; x < LX + LW; x += 80) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 40, 110); g.lineTo(x + 80, 40); g.stroke(); }
    for (let x = LX + 100; x < LX + LW; x += 220) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, 120, 9, 0, Math.PI * 2); g.fill(); glow(g, x, 120, 70, 'rgba(255,240,210,0.6)'); }
    // upper tiers
    crowdRows(g, LX, LX + LW, 380, 9, 42, 0.8, 91, 0.6);
    // the big screen frame (content drawn live)
    box(g, 640, 150, 640, 220, '#1a1a24', { r: 8 });
  },
  back(g) {
    // lower tier wall with boards
    vgrad(g, LX, 760, LW, 120, [[0, '#262038'], [1, '#1a1628']]);
    for (let x = LX; x < LX + LW; x += 400) { g.fillStyle = '#2f6fbf'; g.fillRect(x + 10, 790, 380, 60); txt(g, 'WEIGHTLIFTING · FINAL', x + 200, 832, `700 28px ${COND}`, '#e9eef6'); }
    // the arena floor
    vgrad(g, LX, 880, LW, LH + LY - 880, [[0, '#2e2a44'], [1, '#14121f']]);
    // the platform (wood, chalk marks)
    g.fillStyle = '#b07f52'; g.beginPath(); g.moveTo(560, 940); g.lineTo(1360, 940); g.lineTo(1460, 1010); g.lineTo(460, 1010); g.closePath(); g.fill();
    g.fillStyle = '#7d5638'; g.fillRect(460, 1010, 1000, 22); g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(960, 975, 140, 14, 0, 0, Math.PI * 2); g.fill();
    // the back door (open: the street outside is drawn live into it by doorView), a tunnel under the stands
    box(g, ADOOR.x - 34, ADOOR.y - 40, ADOOR.w + 68, ADOOR.h + 40, '#3a3448', { r: 4, dark: 0.35 });
    g.fillStyle = '#0c0a12'; g.fillRect(ADOOR.x, ADOOR.y, ADOOR.w, ADOOR.h);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f2c230' : '#1b1b22'; g.beginPath(); const x0 = ADOOR.x - 34 + i * (ADOOR.w + 68) / 8; g.moveTo(x0, ADOOR.y - 40); g.lineTo(x0 + (ADOOR.w + 68) / 8, ADOOR.y - 40); g.lineTo(x0 + (ADOOR.w + 68) / 16, ADOOR.y - 18); g.lineTo(x0 - (ADOOR.w + 68) / 16, ADOOR.y - 18); g.fill(); }
    txt(g, 'EXIT · LOADING', ADOOR.x + ADOOR.w / 2, ADOOR.y - 52, `700 24px ${COND}`, '#7fe0a0');
    // judges' table on the left, a coach's chair on the right
    box(g, 60, 860, 340, 100, '#20253a', { r: 4 }); for (let i = 0; i < 3; i++) { g.fillStyle = '#f2f2f2'; g.beginPath(); g.arc(120 + i * 110, 880, 9, 0, Math.PI * 2); g.fill(); }
  },
  glow(g) { glow(g, 960, 760, 600, 'rgba(255,220,170,0.18)'); shaft(g, [[ADOOR.x, ADOOR.y + ADOOR.h], [ADOOR.x + ADOOR.w, ADOOR.y + ADOOR.h], [ADOOR.x + ADOOR.w - 120, 1215], [ADOOR.x - 260, 1215]], 'rgba(255,170,110,0.6)', 0.5); },
  fg(g) { // a TV camera on a tripod and a photographer, close and soft
    g.fillStyle = '#0d0c14'; rr(g, 1780, 760, 260, 150, 14); g.fill(); g.fillRect(1700, 800, 100, 60); g.fillRect(1880, 900, 16, 340); g.beginPath(); g.moveTo(1888, 1000); g.lineTo(1780, 1260); g.lineTo(1800, 1260); g.lineTo(1888, 1030); g.lineTo(1990, 1260); g.lineTo(2010, 1260); g.fill();
    g.fillStyle = '#0d0c14'; g.beginPath(); g.arc(LX + 200, 980, 70, 0, Math.PI * 2); g.fill(); rr(g, LX + 110, 1040, 200, 300, 60); g.fill();
  },
};

/* ---------- living room, night ---------- */
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

// composite a set under camera C; actors(g) draws the characters in set space (k=1). opts.only: skip layers
function drawSet(g, name, C, t, actors, opt = {}) {
  const S = SETS[name], K = S.k || {};
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (S.far) { camK(g, C, K.far ?? 0.5, t); putL(g, LAY(name + '.far', S.far, { res: 0.6, blur: opt.farBlur ?? 3 }), LX, LY); }
  if (S.mid) { camK(g, C, K.mid ?? 0.75, t); putL(g, LAY(name + '.mid', S.mid, { blur: 1.5 }), LX, LY); }
  if (S.inside) { camK(g, C, 1, t); putL(g, LAY(name + '.inside', S.inside), LX, LY); }
  if (opt.beforeBack) { camK(g, C, 1, t); opt.beforeBack(g); }
  camK(g, C, 1, t); putL(g, LAY(name + '.back', S.back), LX, LY);
  if (opt.blurBack) { /* inserts: soften the set behind a close prop */ g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(8,6,16,${opt.blurBack})`; g.fillRect(0, 0, W, H); }
  camK(g, C, 1, t); if (actors) actors(g);
  if (S.glow && opt.glow !== false) { camK(g, C, 1, t); g.globalCompositeOperation = 'lighter'; putL(g, LAY(name + '.glow', S.glow, { res: 0.5, blur: 6 }), LX, LY); g.globalCompositeOperation = 'source-over'; }
  if (opt.after) { camK(g, C, 1, t); opt.after(g); }
  if (S.fg && opt.fg !== false) { const kf = K.fg ?? 1.3; camK(g, C, kf, t); putL(g, LAY(name + '.fg', S.fg, name === 'kitchen' || name === 'living' ? {} : { res: 0.5, blur: 10 }), LX, LY); }
  if (opt.front) { camK(g, C, 1, t); opt.front(g); }
}
// a soft blurred backdrop of a set for close-ups (cached), dimmed
function setBlur(g, name, C, t, dim = 0.35) {
  const S = SETS[name];
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const c = LAYER(name + '.soft', LW, LH, (q) => { q.translate(-LX, -LY); if (S.far) S.far(q); if (S.mid) S.mid(q); if (S.inside) S.inside(q); S.back(q); if (S.glow) { q.globalCompositeOperation = 'lighter'; S.glow(q); q.globalCompositeOperation = 'source-over'; } }, { res: 0.35, blur: 16 });
  camK(g, C, 1, t); putL(g, c, LX, LY);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(8,6,16,${dim})`; g.fillRect(0, 0, W, H);
}
