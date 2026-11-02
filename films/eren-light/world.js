/* =====================================================================
   WORLD — the sets of "Would Eren and Light agree?". Each set is painted once into cached layers at different depths:
   far (k≈0.4) → mid → back (k=1) → [actors] → glow (added light) → fg (near props, blurred). drawSet(g, name, C, t,
   actors, opt) composites them under the parallax camera C = {x, y, z}. Layers are 2400×1350 set pixels with the
   1920×1080 frame at (240, 135). Machinery from know-everything; the sets are new:
     station   — the empty midnight station "between their worlds": glass roof, rain, a bench, two doors
     lightRoom — Light's desk at night (lamp, the city through the window, a small TV)
     city      — Light's city at night: towers with giant news screens, a crowd
     walls     — Eren's world: a stone wall fifty metres high over a small town, at dusk
     plain     — open farmland under a red sky (the horizon the giants walk over)
     court     — courthouse steps (a murderer walks free)
   ===================================================================== */

const LW = 2400, LH = 1350, LX = -240, LY = -135;
const LAY = (key, fn, opt = {}) => LAYER(key, LW, LH, (g) => { g.translate(-LX, -LY); fn(g); if (opt.tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = opt.tint; g.fillRect(LX, LY, LW, LH); g.globalCompositeOperation = 'source-over'; } }, opt);
const SETS = {};
const BENCH = { x: 1180, y: 1000 };          // the station bench (centre of the seat front)
const CLOCK = { x: 1180, y: 300, r: 110 };   // the station clock (drawn live: its hands move)

/* ---------- the station ---------- */
// High-key manga values: paper-pale walls lit by two lamps, solid-ink night through the arches and the glass roof,
// a wet dark floor with white reflections. Rain and the clock are drawn live (rainFx, stationClock).
SETS.station = {
  k: { far: 0.4, fg: 1.35 },
  far(g) {
    vgrad(g, LX, LY, LW, LH, [[0, '#050507'], [1, '#14141a']]);
    skyline(g, LX, LX + LW, 860, 120, 460, '#1d1d24', 71, { lit: 0.12, litCol: 'rgba(255,255,255,0.85)' });
  },
  back(g) {
    // the wall: pale stone, darker toward the roof and the corners
    vgrad(g, LX, 60, LW, 960, [[0, '#4a4a4e'], [0.25, '#a9a6a0'], [0.6, '#d8d4cb'], [1, '#c4c0b8']]);
    hao(g, LX, 60, 520, 960, 'right', 0.55); hao(g, LX + LW - 520, 60, 520, 960, 'left', 0.55);
    g.strokeStyle = 'rgba(20,18,22,0.55)'; g.lineWidth = 2;
    for (let y = 540; y < 1000; y += 40) { g.beginPath(); g.moveTo(LX, y); g.lineTo(LX + LW, y); g.stroke(); }
    for (let y = 540, r = 0; y < 1000; y += 40, r++) for (let x = LX + (r % 2) * 40; x < LX + LW; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 40); g.stroke(); }
    g.fillStyle = '#2a2a2e'; g.fillRect(LX, 512, LW, 26); g.fillStyle = '#e8e4da'; g.fillRect(LX, 506, LW, 6);
    // three tall arched windows onto the night (cut out: the far layer shows through)
    const arch = (x, y, w, hh) => { g.beginPath(); g.moveTo(x, y + hh); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + hh); g.closePath(); };
    for (const [x, y, w, hh] of [[210, 120, 360, 370], [1000, 150, 360, 340], [1790, 120, 360, 370]]) {
      g.globalCompositeOperation = 'destination-out'; arch(x, y, w, hh); g.fill(); g.globalCompositeOperation = 'source-over';
      g.strokeStyle = '#efebe2'; g.lineWidth = 16; arch(x, y, w, hh); g.stroke(); g.strokeStyle = '#18181c'; g.lineWidth = 3; arch(x - 9, y - 9, w + 18, hh + 9); g.stroke();
      g.strokeStyle = '#d9d5cc'; g.lineWidth = 6; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + k * w / 4, y + (k === 2 ? 0 : 30)); g.lineTo(x + k * w / 4, y + hh); g.stroke(); } g.beginPath(); g.moveTo(x, y + hh * 0.62); g.lineTo(x + w, y + hh * 0.62); g.stroke();
    }
    // the iron roof: black trusses over a black glass roof
    g.fillStyle = '#0c0c10'; g.fillRect(LX, LY, LW, 195);
    g.strokeStyle = '#3a3a42'; g.lineWidth = 6; for (let x = LX; x < LX + LW + 200; x += 240) { g.beginPath(); g.moveTo(x, LY); g.lineTo(x + 120, 60); g.lineTo(x + 240, LY); g.stroke(); }
    g.fillStyle = '#1a1a1f'; g.fillRect(LX, 54, LW, 18);
    // the doors: Eren's on the far left (old wood, iron bands), Light's on the far right (glass, steel)
    box(g, 20, 600, 190, 400, '#3a2c20', { r: 4, lit: 0.1, dark: 0.35 }); g.strokeStyle = '#141014'; g.lineWidth = 3; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(20 + k * 38, 604); g.lineTo(20 + k * 38, 996); g.stroke(); }
    g.fillStyle = '#16121a'; g.fillRect(20, 680, 190, 14); g.fillRect(20, 900, 190, 14); g.fillStyle = '#bba77a'; g.beginPath(); g.arc(185, 800, 8, 0, Math.PI * 2); g.fill();
    box(g, 2150, 600, 190, 400, '#22262c', { r: 3 }); g.fillStyle = '#6d7480'; g.fillRect(2170, 620, 150, 260); g.fillStyle = '#d9dde4'; g.fillRect(2180, 760, 50, 7);
    for (const [x, s2] of [[115, 'PARADIS'], [2245, 'KANTO']]) { box(g, x - 95, 540, 190, 46, '#18181c', { r: 4 }); txt(g, s2, x, 573, `600 24px ${COND}`, '#efebe2'); }
    // two departure boards, blank
    for (const x of [560, 1560]) { box(g, x, 590, 280, 120, '#141418', { r: 6 }); g.fillStyle = 'rgba(255,255,255,0.65)'; for (let k = 0; k < 3; k++) g.fillRect(x + 22, 612 + k * 30, 120 + hash(k + x) * 110, 10); }
    // the floor: wet dark stone with seams running to the vanishing point
    vgrad(g, LX, 1000, LW, LH + LY - 1000, [[0, '#1e1e22'], [1, '#34343a']]);
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2; for (let i = -16; i <= 16; i++) { g.beginPath(); g.moveTo(1180 + i * 70, 1000); g.lineTo(1180 + i * 300, LY + LH); g.stroke(); }
    for (let y = 1030; y < LY + LH; y += (y - 980) * 0.5) { g.beginPath(); g.moveTo(LX, y); g.lineTo(LX + LW, y); g.stroke(); }
    // reflections of the lamps and the wall in the wet floor
    for (const x of [640, 1720]) { const gr = g.createLinearGradient(0, 1000, 0, 1220); gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - 16, 1004, 32, 216); g.fillRect(x - 60, 1010, 120, 6); }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(LX, 1004, LW, 30);
    stationBench(g, BENCH.x, BENCH.y);
    // two lamps on iron posts
    for (const x of [640, 1720]) { g.fillStyle = '#121216'; g.fillRect(x - 7, 470, 14, 530); g.fillRect(x - 26, 992, 52, 10); box(g, x - 30, 410, 60, 66, '#16161a', { r: 8 }); g.fillStyle = '#ffffff'; rr(g, x - 20, 422, 40, 44, 6); g.fill(); }
    // the clock's hanger
    g.strokeStyle = '#121216'; g.lineWidth = 6; g.beginPath(); g.moveTo(CLOCK.x - 50, 60); g.lineTo(CLOCK.x - 50, CLOCK.y - CLOCK.r); g.moveTo(CLOCK.x + 50, 60); g.lineTo(CLOCK.x + 50, CLOCK.y - CLOCK.r); g.stroke();
  },
  glow(g) {
    for (const x of [640, 1720]) { glow(g, x, 450, 420, 'rgba(255,248,230,0.75)'); g.fillStyle = 'rgba(255,248,230,0.1)'; g.beginPath(); g.moveTo(x - 20, 470); g.lineTo(x + 20, 470); g.lineTo(x + 300, 1100); g.lineTo(x - 300, 1100); g.closePath(); g.fill(); }
    glow(g, BENCH.x, 900, 520, 'rgba(255,248,230,0.25)');
  },
  fg(g) { box(g, LX - 60, LY, 190, LH, '#0e0e12', { r: 0, edge: false }); g.fillStyle = '#e8e2c8'; g.fillRect(LX, 1210, LW, 14); },
};
// live rain: white streaks (deterministic), in set coordinates over area [x0, y0, w, h]
function rainFx(g, t, x0, y0, w, hh, n = 160, a = 0.6, slant = 0.18, seed = 1) {
  g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 2; g.beginPath();
  for (let i = 0; i < n; i++) { const sp = 1.6 + hash(i * 7 + seed) * 1.2, ph = (t * sp + hash(i * 13 + seed)) % 1, len = 30 + hash(i * 3 + seed) * 50;
    const x = x0 + hash(i * 17 + seed) * w + ph * hh * slant, y = y0 + ph * (hh + len) - len; g.moveTo(x, y); g.lineTo(x + len * slant, y + len); }
  g.stroke();
}
// the station clock (big white face, bold ticks, black hands); sec in seconds after midnight (negative: before)
function stationClock(g, x, y, r, secAfter12) {
  const s = secAfter12 ?? 0;
  g.fillStyle = '#121216'; g.beginPath(); g.arc(x, y, r * 1.12, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f7f3ea'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#121216'; for (let k = 0; k < 60; k++) { const a = k * Math.PI / 30, big = k % 5 === 0; g.lineWidth = big ? r * 0.06 : r * 0.02; g.beginPath(); g.moveTo(x + Math.sin(a) * r * (big ? 0.74 : 0.84), y - Math.cos(a) * r * (big ? 0.74 : 0.84)); g.lineTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92); g.stroke(); }
  const hh = (12 + s / 3600) % 12, mm = ((s / 60) % 60 + 60) % 60, ss = ((s % 60) + 60) % 60;
  const hand = (a, L, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x - Math.sin(a) * L * 0.18, y + Math.cos(a) * L * 0.18); g.lineTo(x + Math.sin(a) * L, y - Math.cos(a) * L); g.stroke(); };
  hand(hh / 12 * Math.PI * 2, r * 0.5, r * 0.09, '#121216'); hand(mm / 60 * Math.PI * 2, r * 0.78, r * 0.06, '#121216'); hand(ss / 60 * Math.PI * 2, r * 0.84, r * 0.022, '#d2232a');
  g.fillStyle = '#121216'; g.beginPath(); g.arc(x, y, r * 0.06, 0, Math.PI * 2); g.fill();
  g.lineCap = 'round';
}
function stationBench(g, x, y) {
  // a long wooden bench with iron legs: seat top at y - 140, back rest up to y - 330
  g.fillStyle = '#16181f'; for (const dx of [-300, 300]) { g.fillRect(x + dx - 10, y - 330, 20, 330); g.fillRect(x + dx - 60, y - 6, 120, 10); }
  for (let k = 0; k < 3; k++) box(g, x - 360, y - 320 + k * 46, 720, 30, '#6e4a2f', { r: 6, lit: 0.12, dark: 0.25 });
  box(g, x - 380, y - 150, 760, 34, '#7a5434', { r: 8, lit: 0.15, dark: 0.25 });
  ao(g, x - 380, y - 116, 760, 30, 'down', 0.35);
}

/* ---------- Light's desk at night ---------- */
SETS.lightRoom = {
  k: { far: 0.45, fg: 1.3 },
  far(g) {
    sky(g, LX, LY, LW, LH, [[0, '#060a1c'], [1, '#1c2348']]);
    skyline(g, LX, LX + LW, 760, 160, 520, '#0e1430', 81, { lit: 0.22, litCol: 'rgba(255,214,150,0.7)' });
    skyline(g, LX, LX + LW, 820, 80, 260, '#090c20', 82, { lit: 0.15 });
  },
  back(g) {
    wall(g, LX, LY, LW, 1040 - LY, '#2b3044', 31);
    g.globalCompositeOperation = 'destination-out'; g.fillRect(1250, 160, 640, 520); g.globalCompositeOperation = 'source-over';
    windowFrame(g, 1250, 160, 640, 520, '#c9cdd6');
    g.fillStyle = '#20263a'; g.fillRect(1200, 150, 40, 560); g.fillRect(1900, 150, 40, 560);
    // shelf of school books + a trophy
    box(g, 200, 330, 520, 16, '#6a5240', { r: 3 }); books(g, 210, 330, 380, 33); g.fillStyle = '#d9b13a'; g.fillRect(640, 270, 30, 60); g.beginPath(); g.arc(655, 262, 26, 0, Math.PI); g.fill(); g.fillRect(630, 322, 50, 10);
    // the desk
    floorPlanks(g, LX, 1030, LW, LH + LY - 1030, '#5a4434', 960);
    box(g, 120, 820, 1500, 40, '#6a4a32', { r: 6, lit: 0.18 }); box(g, 160, 860, 300, 180, '#5a3e2a', { r: 4 }); box(g, 1280, 860, 300, 180, '#5a3e2a', { r: 4 });
    // desk lamp (head over the notebook spot)
    g.strokeStyle = '#2b2e38'; g.lineWidth = 14; g.beginPath(); g.moveTo(560, 820); g.lineTo(520, 640); g.lineTo(700, 560); g.stroke();
    g.fillStyle = '#2b2e38'; g.beginPath(); g.moveTo(660, 540); g.lineTo(780, 560); g.lineTo(760, 620); g.lineTo(680, 600); g.closePath(); g.fill(); box(g, 500, 805, 120, 20, '#2b2e38', { r: 6 });
    // small TV on a cabinet to the right
    box(g, 1660, 760, 360, 280, '#3a2e26', { r: 6 });
  },
  glow(g) { glow(g, 740, 760, 420, 'rgba(255,214,150,0.7)'); g.fillStyle = 'rgba(255,214,150,0.16)'; g.beginPath(); g.moveTo(690, 600); g.lineTo(770, 610); g.lineTo(1050, 830); g.lineTo(450, 830); g.closePath(); g.fill(); glow(g, 1570, 420, 400, 'rgba(120,150,230,0.2)'); },
};

/* ---------- Light's city ---------- */
SETS.city = {
  k: { far: 0.35, mid: 0.65, fg: 1.3 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#04060f'], [0.6, '#151c3c'], [1, '#3a2a4a']]); skyline(g, LX, LX + LW, 640, 200, 560, '#0b0f24', 91, { lit: 0.25, litCol: 'rgba(200,220,255,0.6)' }); },
  mid(g) {
    for (const [x, w, h, c] of [[LX, 420, 760, '#121628'], [380, 380, 640, '#161a2e'], [1500, 420, 700, '#141829'], [1980, 420, 780, '#10142a']]) {
      g.fillStyle = c; g.fillRect(x, 980 - h, w, h + 20); const r = rng(x + 5); for (let yy = 980 - h + 30; yy < 960; yy += 34) for (let xx = x + 20; xx < x + w - 20; xx += 30) if (r() < 0.35) { g.fillStyle = 'rgba(255,214,150,0.6)'; g.fillRect(xx, yy, 12, 16); }
    }
  },
  back(g) {
    vgrad(g, LX, 980, LW, LH + LY - 980, [[0, '#1a1c28'], [1, '#2a2c38']]);
    g.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = LX; x < LX + LW; x += 160) g.fillRect(x, 1090, 80, 8);
    crowdRows(g, LX, LX + LW, 1000, 2, 40, 0.8, 93, 0.35);
  },
};
// a giant outdoor screen (drawn live: content changes)
function bigScreen(g, x, y, w, h, fn) { box(g, x - 12, y - 12, w + 24, h + 24, '#0b0c12', { r: 6 }); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(g); g.fillStyle = 'rgba(255,255,255,0.04)'; for (let yy = y; yy < y + h; yy += 6) g.fillRect(x, yy, w, 2); g.restore(); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x + w / 2, y + h / 2, w * 0.8, 'rgba(160,190,255,0.18)'); g.restore(); }

/* ---------- Eren's world ---------- */
SETS.walls = {
  k: { far: 0.35, mid: 0.6, fg: 1.3 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#2a2342'], [0.45, '#8a4a52'], [0.75, '#e2895a'], [1, '#f6c27a']]); glow(g, 1500, 640, 500, 'rgba(255,190,120,0.8)'); for (let i = 0; i < 4; i++) cloud(g, 200 + i * 520, 180 + (i % 2) * 70, 0.9, '#c88a8a', 0.45); },
  mid(g) {
    // the Wall: a vast stone face across the whole frame, top at y≈120
    vgrad(g, LX, 120, LW, 900, [[0, '#e6dfd4'], [1, '#a2978c']]);
    g.strokeStyle = 'rgba(20,16,18,0.6)'; g.lineWidth = 4; for (let y = 160; y < 1000; y += 46) { g.beginPath(); g.moveTo(LX, y); g.lineTo(LX + LW, y); g.stroke(); const off = (y / 46) % 2 ? 0 : 60; for (let x = LX + off; x < LX + LW; x += 120) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 46); g.stroke(); } }
    g.fillStyle = '#16131a'; g.fillRect(LX, 96, LW, 34); g.fillStyle = 'rgba(255,230,200,0.7)'; g.fillRect(LX, 96, LW, 5); const sg = g.createLinearGradient(LX, 0, LX + LW * 0.55, 0); sg.addColorStop(0, 'rgba(14,12,18,0.7)'); sg.addColorStop(1, 'rgba(14,12,18,0)'); g.fillStyle = sg; g.fillRect(LX, 130, LW, 900);
    for (let x = LX + 80; x < LX + LW; x += 340) { g.fillStyle = '#2b2422'; g.fillRect(x, 80, 30, 24); }
  },
  back(g) {
    // the town in front of the Wall: steep roofs, chimneys
    const r = rng(101); for (let x = LX - 50; x < LX + LW; x += 150 + r() * 60) { const w = 140 + r() * 70, hh = 150 + r() * 160, y0 = 1000 - hh; g.fillStyle = shade('#b49a7a', -0.1 - r() * 0.2); g.fillRect(x, y0, w, hh + 40);
      g.fillStyle = shade('#7a3e2e', -r() * 0.3); g.beginPath(); g.moveTo(x - 14, y0); g.lineTo(x + w / 2, y0 - 90 - r() * 40); g.lineTo(x + w + 14, y0); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,30,25,0.5)'; for (let k = 0; k < 2; k++) g.fillRect(x + 20 + k * (w - 60), y0 + 40, 26, 36); }
    vgrad(g, LX, 1000, LW, LH + LY - 1000, [[0, '#6a5440'], [1, '#4a3a2c']]);
  },
};
SETS.plain = {
  k: { far: 0.3, mid: 0.6, fg: 1.3 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#1e1424'], [0.5, '#6a2a2a'], [0.8, '#c4552e'], [1, '#e8904a']]); glow(g, 960, 760, 700, 'rgba(255,140,80,0.6)'); },
  back(g) {
    vgrad(g, LX, 760, LW, LH + LY - 760, [[0, '#3a2a22'], [0.4, '#5a4026'], [1, '#6a5030']]);
    g.strokeStyle = 'rgba(30,20,10,0.35)'; g.lineWidth = 3; for (let i = -20; i <= 20; i++) { g.beginPath(); g.moveTo(960 + i * 30, 760); g.lineTo(960 + i * 220, LY + LH); g.stroke(); }
    // a farmhouse and a fence on the left, a tree on the right
    box(g, 120, 820, 220, 140, '#8a6a4a', { r: 2 }); g.fillStyle = '#5a2e22'; g.beginPath(); g.moveTo(100, 822); g.lineTo(230, 740); g.lineTo(360, 822); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,200,120,0.6)'; g.fillRect(170, 860, 30, 30);
    g.strokeStyle = '#3a2a1e'; g.lineWidth = 6; for (let x = 380; x < 900; x += 60) { g.beginPath(); g.moveTo(x, 980); g.lineTo(x, 920); g.stroke(); } g.beginPath(); g.moveTo(380, 940); g.lineTo(900, 940); g.stroke();
    tree(g, 1750, 980, 1.1, '#3a3a22', 105);
  },
};
SETS.court = {
  k: { far: 0.4, fg: 1.3 },
  far(g) { sky(g, LX, LY, LW, LH, [[0, '#7f9ab8'], [1, '#d8d2c4']]); },
  back(g) {
    box(g, 260, 120, 1880, 120, '#cfc8ba', { r: 2 }); g.fillStyle = '#bdb5a5'; g.beginPath(); g.moveTo(240, 122); g.lineTo(1200, -60); g.lineTo(2160, 122); g.closePath(); g.fill();
    txt(g, 'HALL OF JUSTICE', 1200, 210, `600 54px ${SERIF}`, '#6a6252');
    for (let k = 0; k < 8; k++) { const x = 360 + k * 240; vgrad(g, x, 240, 70, 520, [[0, '#e6e0d2'], [1, '#b8b0a0']]); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x + 50, 240, 20, 520); }
    g.fillStyle = '#3a3a42'; g.fillRect(260, 240, 1880, 520); for (let k = 0; k < 8; k++) { const x = 360 + k * 240; vgrad(g, x, 240, 70, 520, [[0, '#e6e0d2'], [1, '#b8b0a0']]); }
    for (let k = 0; k < 6; k++) box(g, 140 - k * 40, 760 + k * 50, 2120 + k * 80, 50, '#d6cfc0', { r: 2, lit: 0.1 });
    vgrad(g, LX, 1060, LW, LH + LY - 1060, [[0, '#9a958a'], [1, '#7a756a']]);
  },
};

function drawSet(g, name, C, t, actors, opt = {}) {
  const S = SETS[name], K = S.k || {}, tint = S.tint ? { tint: S.tint } : {};
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (S.far) { camK(g, C, K.far ?? 0.5, t); putL(g, LAY(name + '.far', S.far, { res: 0.6, blur: opt.farBlur ?? 3 }), LX, LY); }
  if (opt.beforeMid) { camK(g, C, K.mid ?? 0.6, t); opt.beforeMid(g); }
  if (S.mid) { camK(g, C, K.mid ?? 0.75, t); putL(g, LAY(name + '.mid', S.mid, Object.assign({ blur: 1.5 }, tint)), LX, LY); }
  if (opt.beforeBack) { camK(g, C, 1, t); opt.beforeBack(g); }
  camK(g, C, 1, t); putL(g, LAY(name + '.back', S.back, tint), LX, LY);
  if (opt.blurBack) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(8,6,16,${opt.blurBack})`; g.fillRect(0, 0, W, H); }
  camK(g, C, 1, t); if (actors) actors(g);
  if (S.glow && opt.glow !== false) { camK(g, C, 1, t); g.globalCompositeOperation = 'lighter'; g.globalAlpha = opt.glowA ?? 1; putL(g, LAY(name + '.glow', S.glow, { res: 0.5, blur: 6 }), LX, LY); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if (opt.after) { camK(g, C, 1, t); opt.after(g); }
  if (S.fg && opt.fg !== false) { const kf = K.fg ?? 1.3; camK(g, C, kf, t); putL(g, LAY(name + '.fg', S.fg, Object.assign({ res: 0.5, blur: 10 }, tint)), LX, LY); }
  if (opt.front) { camK(g, C, 1, t); opt.front(g); }
}
