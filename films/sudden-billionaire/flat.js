/* =====================================================================
   FLAT — your studio flat (3.3 × 2.6 m: the money's first home), and Chuck Feeney's rented flat (the same room, by day,
   almost bare). One set, many modes:
     title     the flat at night, under the title         flat      on the bed: the TV, the rent letter, $412 on your phone
     draw      the draw on TV; your one ticket            balls     six balls; each one ringed on the ticket
     won       the TV: ONE WINNING TICKET; you stand up, the ticket shaking
     scale     a $10,000 bundle on the table; then $100 bills fill the room to your chest
     promise   you write GIVE HALF AWAY on a sticky note; a cut; you press it onto the fridge
     mum       day one: $310,000 to your mum, $64,000 to Sam; then the window
     out       day three: the lock screen fills up        who       the inbox scrolls
     trust     you stop answering; a knock; the peephole (someone who says he's an old friend)
     interest  in bed at night: the phone on its stand, counting your interest
     feeney    a rented flat by day: a $10 watch on the table
   Layout (metres): x −1.65…1.65 (the TV on the left wall, the bed along the right), z −1.3 (the window) … 1.3 (the
   door, the fridge, the kitchenette), ceiling 2.45. The corridor outside the door (for the peephole) is at z > 1.3.
   ===================================================================== */

const SB_FL = { X: 1.65, Z: 1.3, H: 2.45, seat: [1.02, 1.08, -0.2], tv: [-1.6, 0.86, -0.3], table: [-0.42, 0.745, -0.86], door: -1.025,
  fridge: [-0.15, 0.68], pad: [-0.2, 0.7515, -0.7], stand: [0.42, 0.62, -1.08] };
// the cash: ten million $100 bills (156 × 66.3 × 0.11 mm each) = 11.4 m³; on this 3.3 × 2.6 m floor, 1.33 m deep
SB_FL.cashDepth = 1e7 * 0.156 * 0.0663 * 0.00011 / (2 * SB_FL.X * 2 * SB_FL.Z);

// ---- textures ---------------------------------------------------------------------------------------------------------
function sbFlFloorCanvas() {
  // laminate: boards 0.19 m wide; the canvas is 1.52 m square (8 boards)
  const W = 1024, P = W / 8, r = new RNG(CONFIG.seed + 501);
  const planks = [0, 1, 2].map((k) => sbWoodCanvas(CONFIG.seed + 510 + k, 128, 512, [168, 132, 96]));
  return sbCanvas(W, W, (g) => {
    for (let i = 0; i < 8; i++) {
      let y = -r.range(0, W * 0.6);
      while (y < W) { const L = r.range(0.5, 0.95) * W; g.drawImage(planks[r.int(0, 2)], i * P, y, P, L); g.fillStyle = `rgba(${r.next() < 0.5 ? '255,240,220' : '30,20,12'},${r.range(0.03, 0.08)})`; g.fillRect(i * P, y, P, L); g.fillStyle = 'rgba(25,16,10,0.5)'; g.fillRect(i * P, y, P, 2); y += L; }
      g.fillStyle = 'rgba(25,16,10,0.55)'; g.fillRect(i * P, 0, 2, W);
    }
    // wear: a darker path from the door to the bed
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${0.02 + 0.03 * hash1(i * 3)})`; g.fillRect(hash1(i * 7) * W, hash1(i * 13) * W, 2, 6); }
  });
}
function sbFlPaintCanvas(base, scuffs = 0) {
  return sbCanvas(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const v = hash1(i * 17 + 3); g.fillStyle = `rgba(${v > 0.5 ? '255,255,255' : '0,0,0'},0.03)`; g.fillRect(hash1(i * 5 + 1) * w, hash1(i * 11 + 7) * h, 3, 3); }
    for (let i = 0; i < scuffs; i++) { g.fillStyle = `rgba(60,50,40,${0.04 + 0.05 * hash1(i * 9)})`; g.beginPath(); g.ellipse(hash1(i * 3.1) * w, h * (0.7 + 0.3 * hash1(i * 4.7)), 10 + 30 * hash1(i * 2.3), 3 + 6 * hash1(i * 5.9), 0, 0, 7); g.fill(); }
  });
}
// the city through the window (night: lit windows; day: pale towers)
function sbFlCityDraw(g, w, h, s) {
  const day = s.day, r = new RNG(CONFIG.seed + 520);
  const sky = g.createLinearGradient(0, 0, 0, h);
  if (day) { sky.addColorStop(0, '#8fb2d8'); sky.addColorStop(0.6, '#d8e2ea'); sky.addColorStop(1, '#e8e4dc'); } else { sky.addColorStop(0, '#05070d'); sky.addColorStop(0.55, '#121a2c'); sky.addColorStop(1, '#2a2430'); }
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (const layer of [0, 1, 2]) {
    let x = -20;
    while (x < w) {
      const bw = r.range(60, 170) * (1 - layer * 0.2), bh = h * r.range(0.25, 0.75) * (1 - layer * 0.25), y0 = h - bh;
      const c = day ? [`#a9b2ba`, `#b8b0a4`, `#c6c0b4`][layer] : ['#0b0e16', '#10141e', '#151a26'][layer];
      g.fillStyle = c; g.fillRect(x, y0, bw, bh);
      for (let yy = y0 + 10; yy < h - 6; yy += 16) for (let xx = x + 6; xx < x + bw - 8; xx += 13) {
        const v = r.next();
        if (day) { g.fillStyle = `rgba(60,70,84,${0.25 + 0.2 * v})`; g.fillRect(xx, yy, 7, 9); }
        else if (v < 0.32 - layer * 0.06) { g.fillStyle = v < 0.08 ? 'rgba(190,210,255,0.85)' : 'rgba(255,206,140,0.9)'; g.fillRect(xx, yy, 7, 9); }
      }
      x += bw + r.range(4, 20);
    }
  }
  if (!day) for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(255,60,50,0.9)'; g.fillRect(r.range(0, w), h * r.range(0.25, 0.5), 3, 3); }
}
// the $100 bills (a made-up note: green-grey, "100" in the corners, an empty oval; not a real design)
function sbFlNote(g, x, y, w, h, flip) {
  g.save(); g.translate(x + w / 2, y + h / 2); if (flip) g.rotate(Math.PI);
  g.fillStyle = '#c9d0bc'; g.fillRect(-w / 2, -h / 2, w, h);
  g.strokeStyle = '#6d7a62'; g.lineWidth = 2; g.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
  g.fillStyle = '#e4e6da'; g.beginPath(); g.ellipse(-w * 0.12, 0, h * 0.28, h * 0.36, 0, 0, 7); g.fill(); g.strokeStyle = '#7d8a72'; g.stroke();
  g.fillStyle = '#4e5a46'; g.font = `700 ${Math.round(h * 0.22)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('100', -w * 0.38, -h * 0.28); g.fillText('100', w * 0.38, h * 0.28); g.fillText('100', w * 0.3, -h * 0.26);
  g.font = `600 ${Math.round(h * 0.11)}px Georgia, serif`; g.fillText('ONE HUNDRED', w * 0.22, h * 0.02);
  g.fillStyle = 'rgba(160,110,60,0.35)'; g.fillRect(w * 0.05, -h / 2, w * 0.035, h);
  g.restore();
}
function sbFlCashCanvas() {
  // 5 × 10 bundles (each 156 × 66 mm with a paper band): the canvas is 0.78 × 0.66 m of the pile's top
  const W = 1040, H = 880, bw = W / 5, bh = H / 10;
  return sbCanvas(W, H, (g) => {
    g.fillStyle = '#7c8572'; g.fillRect(0, 0, W, H);
    for (let j = 0; j < 10; j++) for (let i = 0; i < 5; i++) {
      const k = j * 5 + i, ox = (hash1(k * 3.7) - 0.5) * 8, oy = (hash1(k * 5.3) - 0.5) * 6;
      sbFlNote(g, i * bw + 2 + ox, j * bh + 2 + oy, bw - 4, bh - 4, hash1(k * 1.9) < 0.5);
      // the band
      g.fillStyle = '#d6b45a'; g.fillRect(i * bw + bw * 0.44 + ox, j * bh + 2 + oy, bw * 0.13, bh - 4);
      g.fillStyle = '#6a5420'; g.font = '700 11px Georgia, serif'; g.save(); g.translate(i * bw + bw * 0.505 + ox, j * bh + bh / 2 + oy); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('$10,000', 0, 4); g.restore();
      g.fillStyle = `rgba(0,0,0,${0.06 + 0.1 * hash1(k * 7.1)})`; g.fillRect(i * bw + ox, j * bh + bh - 3 + oy, bw, 3);
    }
  });
}
// the TV: the draw (a ball machine, the numbers), an ad, the news
function sbFlTvDraw(g, w, h, s) {
  const T = (txt, x, y, size, col, weight = 700, font = SB_FONT, align = 'center') => { g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(txt, x, y); };
  const ball = (x, y, r, n, hue) => {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, `hsl(${hue},80%,62%)`); gr.addColorStop(1, `hsl(${hue},70%,28%)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    if (n !== undefined) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.55, 0, 7); g.fill(); T(String(n), x, y + 1, Math.round(r * 0.62), '#111', 800); }
  };
  if (s.mode === 'news') {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1b2a44'); gr.addColorStop(1, '#0c1424'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 9; i++) g.fillRect(80 + i * 100, 90, 60, 260);
    g.fillStyle = '#c23a2a'; g.fillRect(0, h - 150, 230, 60); T('BREAKING', 115, h - 120, 30, '#fff', 800);
    g.fillStyle = '#f2f0ea'; g.fillRect(230, h - 150, w - 230, 60); T(s.head, 250, h - 120, 30, '#14181f', 800, SB_FONT, 'left');
    g.fillStyle = '#0c1424'; g.fillRect(0, h - 90, w, 50); T(s.tick, 24 - (s.f * 4) % 600, h - 65, 22, '#c8d0dc', 600, SB_FONT, 'left');
    return;
  }
  // the draw's studio
  const bg = g.createRadialGradient(w / 2, h * 0.4, 40, w / 2, h / 2, w * 0.7); bg.addColorStop(0, '#3b2a7a'); bg.addColorStop(1, '#0d0a24'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(255,210,120,${0.05 + 0.04 * Math.sin(s.f * 0.08 + i)})`; g.lineWidth = 18; g.beginPath(); g.moveTo(w / 2, -40); g.lineTo(w / 2 + (i - 6.5) * 140, h + 40); g.stroke(); }
  T('THE BIG DRAW', w / 2, 52, 44, '#ffd36a', 800, 'Georgia, serif');
  if (s.mode === 'ad') {
    T('TONIGHT', w / 2, 170, 40, '#ffffff', 700); T('$3.4 BILLION', w / 2, 270, 120, '#ffd36a', 800, 'Georgia, serif'); T('THE BIGGEST JACKPOT IN HISTORY', w / 2, 370, 32, '#ffffff', 700);
    T('11 PM', w / 2, 450, 40, '#ffffff', 800); return;
  }
  T(s.mode === 'won' ? 'JACKPOT WON' : 'JACKPOT · $3.4 BILLION', w / 2, 104, 30, '#ffffff', 700);
  if (s.mode !== 'won') {
    // the machine: a glass drum with the balls tumbling (positions are a function of the frame)
    const cx = w * 0.3, cy = h * 0.5, R = 150;
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.strokeStyle = 'rgba(220,230,255,0.6)'; g.lineWidth = 5; g.stroke();
    for (let i = 0; i < 24; i++) {
      const a = s.f * (0.05 + 0.03 * hash1(i * 2.1)) + i * 2.4, rr = R * (0.25 + 0.6 * hash1(i * 3.3));
      ball(cx + Math.cos(a) * rr * (0.7 + 0.3 * Math.sin(s.f * 0.11 + i)), cy + Math.sin(a * 1.3) * rr * 0.8 + 20, 17, undefined, (i * 47) % 360);
    }
    g.fillStyle = 'rgba(220,230,255,0.5)'; g.fillRect(cx + R - 6, cy - 12, 80, 24);
    T('BALLS DRAWN', w * 0.74, 200, 24, '#c8c0ff', 700);
  } else {
    T('ONE WINNING TICKET', w / 2, 168, 56, '#ffd36a', 800, 'Georgia, serif');
    for (let i = 0; i < 40; i++) { g.fillStyle = `hsl(${(i * 67) % 360},80%,65%)`; g.fillRect((hash1(i * 3) * w + s.f * 2) % w, (hash1(i * 7) * h + s.f * (3 + 3 * hash1(i))) % h, 8, 14); }
  }
  // the numbers drawn so far (a ball rolls in, then settles)
  const n = s.n || 0, row = s.mode === 'won' ? [w * 0.5, h * 0.62, 62] : [w * 0.74, h * 0.5, 44];
  for (let i = 0; i < 6; i++) {
    const col = i % 3, line = Math.floor(i / 3), x = s.mode === 'won' ? row[0] + (i - 2.5) * 140 : row[0] + (col - 1) * 110, y = s.mode === 'won' ? row[1] : row[1] + line * 110;
    if (i < n) ball(x, y, row[2], SB_NUMBERS[i], i === 5 ? 0 : 45 + i * 40);
    else if (i === n && s.roll > 0) ball(sbLerp(w * 0.3 + 230, x, s.roll), sbLerp(h * 0.5, y, s.roll), row[2] * (0.6 + 0.4 * s.roll), SB_NUMBERS[i], i === 5 ? 0 : 45 + i * 40);
    else { g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, row[2], 0, 7); g.stroke(); }
  }
}
// the rent letter on the table
function sbFlLetterCanvas() {
  return sbCanvas(256, 360, (g, w, h) => {
    g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b8332a'; g.font = '700 22px Georgia, serif'; g.textAlign = 'left'; g.fillText('RENT DUE', 22, 52);
    g.fillStyle = '#333'; g.font = '14px monospace'; g.fillText('Flat 4B · October', 22, 84); g.fillText('Amount   $1,240.00', 22, 130); g.fillText('Due      MONDAY', 22, 154);
    g.fillStyle = '#b8332a'; g.font = '700 16px monospace'; g.fillText('LATE FEE AFTER', 22, 200); g.fillText('MONDAY: $75', 22, 222);
    for (let i = 0; i < 6; i++) { g.fillStyle = '#c8c4b8'; g.fillRect(22, 260 + i * 14, 180 - 30 * hash1(i), 5); }
  });
}
// a cheap digital watch's face
function sbFlWatchCanvas() {
  return sbCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9aa38a'; sbRR(g, 30, 60, 196, 120, 10); g.fill();
    g.fillStyle = '#1e2418'; g.font = '700 74px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('10:42', w / 2, 124);
    g.fillStyle = '#c8c8c0'; g.font = '700 18px ' + SB_FONT; g.fillText('ALARM CHRONO', w / 2, 36); g.fillText('WATER RESIST', w / 2, 214);
  });
}

SB_SETS.flat = (app) => {
  const S = sbSet(app, { sky: '#05070d', fov: 55, near: 0.02, far: 80, hemi: ['#4a5470', '#2a2420', 0.12],
    sun: [-1.2, 3.6, -5.5], sunColor: '#fff0d8', sunI: 0, shadow: 2048, shadowR: 3.5, shadowFar: 20 });
  const { scene, camera: cam, sun, hemi } = S;
  sun.target.position.set(0.2, 0, 0.2);
  const envN = sbEnv(app.renderer, '#141a28', '#2a2a30', '#18140f'), envD = sbEnv(app.renderer, '#c8d6e6', '#d8d0c4', '#6a5a48');
  scene.environment = envN;
  const X = SB_FL.X, Z = SB_FL.Z, H = SB_FL.H, W = SB_W, K = sbK;
  const B = (w, h, d, m, x, y, z, parent) => sbBox(w, h, d, m, x, y, z, parent || null);
  const G = { clutter: new THREE.Group(), tv: new THREE.Group(), feeney: new THREE.Group(), hall: new THREE.Group() };
  for (const g of Object.values(G)) scene.add(g);

  // ---- materials
  const floorTex = sbTex(sbFlFloorCanvas()); floorTex.repeat.set(2 * X / 1.52, 2 * Z / 1.52);
  const floorM = sbStd('#ffffff', 0.62, 0, { map: floorTex });
  const wallTex = sbTex(sbFlPaintCanvas('#ffffff', 40)); wallTex.repeat.set(2, 1.2);
  const wallM = sbStd('#d9d2c4', 0.92, 0, { map: wallTex }), ceilM = sbStd('#e2ddd2', 0.95, 0);
  const whiteM = sbStd('#efece4', 0.5, 0), darkM = sbStd('#24252a', 0.55, 0.1), steelM = sbStd('#b8bcc0', 0.3, 0.85), woodM = sbStd('#ffffff', 0.55, 0, { map: sbTex(sbWoodCanvas(CONFIG.seed + 530, 256, 1024, [120, 86, 56])) });
  const fabricM = sbStd('#4a5a6e', 0.95, 0), duvetM = sbStd('#c9c2b2', 0.92, 0), pillowM = sbStd('#e8e4da', 0.9, 0);

  // ---- floor, ceiling, walls (window in the back wall, the door in the front wall)
  const floor = sbMesh(new THREE.PlaneGeometry(2 * X, 2 * Z).rotateX(-Math.PI / 2), floorM, 0, 0, 0); floor.castShadow = false;
  const WX0 = -0.25, WX1 = 0.95, WY0 = 0.85, WY1 = 2.05;
  B(WX0 + X, H, 0.1, wallM, (-X + WX0) / 2, H / 2, -Z - 0.05); B(X - WX1, H, 0.1, wallM, (WX1 + X) / 2, H / 2, -Z - 0.05);
  B(WX1 - WX0, WY0, 0.1, wallM, (WX0 + WX1) / 2, WY0 / 2, -Z - 0.05); B(WX1 - WX0, H - WY1, 0.1, wallM, (WX0 + WX1) / 2, (H + WY1) / 2, -Z - 0.05);
  B(0.1, H, 2 * Z + 0.2, wallM, -X - 0.05, H / 2, 0); B(0.1, H, 2 * Z + 0.2, wallM, X + 0.05, H / 2, 0);
  const DX0 = -1.45, DX1 = -0.6, DH = 2.05;
  B(DX0 + X, H, 0.1, wallM, (-X + DX0) / 2, H / 2, Z + 0.05); B(X - DX1, H, 0.1, wallM, (DX1 + X) / 2, H / 2, Z + 0.05); B(DX1 - DX0, H - DH, 0.1, wallM, (DX0 + DX1) / 2, (H + DH) / 2, Z + 0.05);
  B(2 * X + 0.2, 0.1, 2 * Z + 0.2, ceilM, 0, H + 0.05, 0);
  for (const [w, x, z, ry] of [[2 * Z, -X + 0.01, 0, Math.PI / 2], [2 * Z, X - 0.01, 0, Math.PI / 2], [WX0 + X, (-X + WX0) / 2, -Z + 0.01, 0], [X - WX1, (WX1 + X) / 2, -Z + 0.01, 0]]) B(w, 0.09, 0.015, whiteM, x, 0.045, z, null).rotation.y = ry;
  // a bare bulb on its flex (off at night: the lamp and the TV light the room)
  sbCyl(0.004, 0.004, 0.45, darkM, 0.4, H - 0.225, 0.1); const bulbM = sbStd('#fff8e8', 0.3, 0, { emissive: '#ffd9a0', emissiveIntensity: 0 }); sbMesh(new THREE.SphereGeometry(0.04, 14, 10), bulbM, 0.4, H - 0.47, 0.1);

  // ---- the window: frame, glass, a roller blind half down, a radiator; the city outside
  const frameM = sbStd('#f2f0ea', 0.45, 0);
  B(WX1 - WX0 + 0.1, 0.05, 0.16, frameM, (WX0 + WX1) / 2, WY0 - 0.02, -Z - 0.02); B(WX1 - WX0 + 0.1, 0.05, 0.1, frameM, (WX0 + WX1) / 2, WY1 + 0.02, -Z - 0.06);
  B(0.05, WY1 - WY0, 0.1, frameM, WX0 - 0.02, (WY0 + WY1) / 2, -Z - 0.06); B(0.05, WY1 - WY0, 0.1, frameM, WX1 + 0.02, (WY0 + WY1) / 2, -Z - 0.06); B(0.04, WY1 - WY0, 0.06, frameM, (WX0 + WX1) / 2, (WY0 + WY1) / 2, -Z - 0.08);
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#d8e2ea', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.12, envMapIntensity: 0.6 });
  const glass = sbMesh(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), glassM, (WX0 + WX1) / 2, (WY0 + WY1) / 2, -Z - 0.09); glass.castShadow = false;
  const blindM = sbStd('#d8cdb4', 0.95, 0, { side: THREE.DoubleSide, transparent: true, opacity: 0.94 });
  const blind = sbMesh(new THREE.PlaneGeometry(WX1 - WX0 + 0.06, 0.42), blindM, (WX0 + WX1) / 2, WY1 - 0.21, -Z + 0.03); B(WX1 - WX0 + 0.1, 0.05, 0.05, whiteM, (WX0 + WX1) / 2, WY1 + 0.04, -Z + 0.03);
  for (let i = 0; i < 9; i++) B(0.05, 0.55, 0.06, whiteM, WX0 + 0.12 + i * 0.12, 0.42, -Z + 0.06);
  const cityTex = sbCanvasTex(2048, 1024, sbFlCityDraw), cityM = new THREE.MeshBasicMaterial({ map: cityTex.tex, fog: false });
  const city = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), cityM); city.position.set(0.35, 1.2, -5.5); scene.add(city);

  // ---- the bed (along the right wall), the bedside crate, its lamp, the phone stand (for the night)
  B(0.92, 0.28, 1.95, woodM, X - 0.47, 0.14, -Z + 0.98);
  sbMesh(sbRoundBox(0.88, 0.2, 1.9, 0.06, 0.02), sbStd('#e9e5dc', 0.9, 0), X - 0.47, 0.28, -Z + 0.98);
  const pillow = sbMesh(sbRoundBox(0.6, 0.12, 0.36, 0.06, 0.05), pillowM, X - 0.47, 0.48, -Z + 0.26);
  const duvetG = new THREE.PlaneGeometry(0.98, 1.45, 24, 30); { const pa = duvetG.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); const edge = Math.max(0, Math.abs(x) - 0.38) * 3.2; pa.setZ(i, 0.06 + 0.035 * Math.sin(x * 9 + y * 4) * Math.cos(y * 6 - x * 2) + 0.02 * Math.sin(y * 17) - edge * edge * 0.5); } duvetG.computeVertexNormals(); duvetG.rotateX(-Math.PI / 2); }
  const duvet = sbMesh(duvetG, duvetM, X - 0.47, 0.47, -Z + 1.25); duvet.material.side = THREE.DoubleSide;
  const flatCover = B(0.94, 0.04, 1.5, sbStd('#8a8f8a', 0.95, 0), X - 0.47, 0.5, -Z + 1.2, G.feeney);
  B(0.36, 0.5, 0.36, woodM, 0.45, 0.25, -Z + 0.22);
  const lampM = sbStd('#f0e2c4', 0.85, 0, { emissive: '#ffcf90', emissiveIntensity: 0, side: THREE.DoubleSide, toneMapped: true });
  sbCyl(0.06, 0.07, 0.03, darkM, 0.38, 0.515, -Z + 0.18); sbCyl(0.008, 0.008, 0.3, steelM, 0.38, 0.68, -Z + 0.18); const shade = sbMesh(new THREE.CylinderGeometry(0.09, 0.13, 0.17, 20, 1, true), lampM, 0.38, 0.86, -Z + 0.18);
  const lampL = new THREE.PointLight('#ffb46a', 0, 5.5, 1.8); lampL.position.set(0.38, 0.86, -Z + 0.18); lampL.castShadow = true; lampL.shadow.mapSize.set(512, 512); lampL.shadow.bias = -0.002; scene.add(lampL);
  const standPhone = sbPhone(); standPhone.g.position.set(SB_FL.stand[0] + 0.04, SB_FL.stand[1], SB_FL.stand[2]); standPhone.g.rotation.set(-0.3, 1.29, 0, 'YXZ'); scene.add(standPhone.g);
  B(0.06, 0.05, 0.05, darkM, SB_FL.stand[0] + 0.03, 0.525, SB_FL.stand[2]);
  const phoneL = new THREE.PointLight('#9ab8ff', 0, 1.4, 2); phoneL.position.set(SB_FL.stand[0] + 0.3, SB_FL.stand[1] + 0.1, SB_FL.stand[2] + 0.1); scene.add(phoneL);
  // the shelf over the bed, books (clutter)
  B(0.9, 0.025, 0.22, woodM, X - 0.12, 1.55, -Z + 0.9, G.clutter).rotation.y = Math.PI / 2;
  for (let i = 0; i < 14; i++) { const hh = 0.17 + 0.07 * sbR(i, 3); B(0.2, hh, 0.03 + 0.02 * sbR(i, 5), sbStd(['#7a3a2e', '#2e4a6a', '#c9b48a', '#3a5a3a', '#6a5a7a', '#a8a090'][i % 6], 0.8), X - 0.13, 1.5625 + hh / 2, -Z + 0.52 + i * 0.05, G.clutter); }

  // ---- the table by the window, a chair, the rent letter, a mug
  B(0.72, 0.03, 0.5, woodM, SB_FL.table[0], 0.73, SB_FL.table[2]);
  for (const [dx, dz] of [[-0.32, -0.21], [0.32, -0.21], [-0.32, 0.21], [0.32, 0.21]]) B(0.03, 0.72, 0.03, darkM, SB_FL.table[0] + dx, 0.36, SB_FL.table[2] + dz);
  { const cx = SB_FL.table[0] - 0.52, cz = SB_FL.table[2] + 0.05;
    B(0.42, 0.03, 0.42, woodM, cx, 0.45, cz); B(0.03, 0.45, 0.42, woodM, cx - 0.2, 0.69, cz);
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) B(0.025, 0.45, 0.025, darkM, cx + dx, 0.225, cz + dz); }
  const letter = sbMesh(new THREE.PlaneGeometry(0.15, 0.21).rotateX(-Math.PI / 2), sbStd('#ffffff', 0.85, 0, { map: sbTex(sbFlLetterCanvas(), { repeat: false }) }), SB_FL.table[0] + 0.08, 0.747, SB_FL.table[2] + 0.04, G.clutter); letter.rotation.y = 0.22;
  sbCyl(0.04, 0.036, 0.09, sbStd('#c94a3a', 0.4, 0), SB_FL.table[0] - 0.2, 0.79, SB_FL.table[2] - 0.08, G.clutter);
  // the $10,000 bundle (for the counting)
  const cashCanvas = sbFlCashCanvas(), bundleTex = sbTex(sbCanvas(208, 88, (g) => g.drawImage(cashCanvas, 0, 0, 208, 88, 0, 0, 208, 88)), { repeat: false });
  const bundle = new THREE.Group(); bundle.position.set(SB_FL.table[0] + 0.02, 0.751, SB_FL.table[2] + 0.02); bundle.rotation.y = -0.3; scene.add(bundle);
  { const side = sbStd('#d9dccd', 0.9, 0), top = sbStd('#ffffff', 0.8, 0, { map: bundleTex }); const m = new THREE.Mesh(new THREE.BoxGeometry(0.156, 0.011, 0.066), [side, side, top, side, side, side]); m.position.y = 0.0055; m.castShadow = true; bundle.add(m); }

  // ---- the TV on its unit (left wall), a poster, the rug (clutter)
  B(0.42, 0.48, 1.0, woodM, -X + 0.21, 0.24, SB_FL.tv[2], G.tv);
  const tvTex = sbCanvasTex(1024, 576, sbFlTvDraw);
  const tv = new THREE.Group(); tv.position.set(SB_FL.tv[0] + 0.06, SB_FL.tv[1], SB_FL.tv[2]); tv.rotation.y = Math.PI / 2; G.tv.add(tv);
  { const body = new THREE.Mesh(sbRoundBox(0.92, 0.54, 0.05, 0.01, 0.004), darkM); body.position.y = -0.27; tv.add(body); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.89, 0.5), new THREE.MeshBasicMaterial({ map: tvTex.tex })); scr.position.z = 0.034; tv.add(scr); tv.userData.scr = scr;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.18), darkM); foot.position.set(0, -0.36, 0.0); tv.add(foot); const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.03), darkM); neck.position.set(0, -0.31, -0.01); tv.add(neck); }
  const tvL = new THREE.PointLight('#8aa8ff', 0, 4.5, 1.6); tvL.position.set(SB_FL.tv[0] + 0.5, SB_FL.tv[1], SB_FL.tv[2]); scene.add(tvL);
  const posterTex = sbTex(sbCanvas(256, 360, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8673a'); gr.addColorStop(1, '#2a2a5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#f4e6c8'; g.beginPath(); g.arc(w / 2, h * 0.42, 70, 0, 7); g.fill(); g.fillStyle = '#1a1a2a'; g.fillRect(0, h * 0.6, w, h * 0.4); g.fillStyle = '#f4e6c8'; g.font = '700 30px Georgia, serif'; g.textAlign = 'center'; g.fillText('SUMMER TOUR', w / 2, h * 0.8); }), { repeat: false });
  sbMesh(new THREE.PlaneGeometry(0.42, 0.59), sbStd('#ffffff', 0.8, 0, { map: posterTex }), -X + 0.012, 1.62, 0.55, G.clutter).rotation.y = Math.PI / 2;
  const rug = sbMesh(new THREE.PlaneGeometry(1.4, 0.9).rotateX(-Math.PI / 2), sbStd('#5a3a34', 0.98, 0), -0.35, 0.004, -0.15, G.clutter); rug.castShadow = false;

  // ---- the kitchenette (front wall, right of the fridge): counter, sink, hob, kettle; the fridge with its clutter
  const counterM = sbStd('#3a3632', 0.4, 0.05), cabM = sbStd('#e6e2d8', 0.6, 0);
  B(X - 0.15, 0.86, 0.58, cabM, (0.15 + X) / 2, 0.43, Z - 0.29); B(X - 0.15 + 0.02, 0.04, 0.62, counterM, (0.15 + X) / 2, 0.88, Z - 0.31);
  for (let i = 0; i < 3; i++) B(0.004, 0.8, 0.004, sbStd('#bdb8ac', 0.6), 0.15 + 0.5 * (i + 1), 0.42, Z - 0.58);
  B(0.42, 0.02, 0.36, steelM, 1.25, 0.905, Z - 0.3); B(0.5, 0.012, 0.5, sbStd('#141414', 0.3, 0.2), 0.48, 0.905, Z - 0.32);
  for (const [dx, dz] of [[-0.12, -0.12], [0.12, 0.12]]) { const r = sbMesh(new THREE.TorusGeometry(0.07, 0.006, 6, 24).rotateX(Math.PI / 2), sbStd('#2a2a2a', 0.5, 0.4), 0.48 + dx, 0.914, Z - 0.32 + dz); r.castShadow = false; }
  sbCyl(0.075, 0.085, 0.2, steelM, 1.55, 1.0, Z - 0.42, G.clutter);
  B(X - 0.15, 0.6, 0.32, cabM, (0.15 + X) / 2, 1.85, Z - 0.16);
  const ucL = new THREE.PointLight('#ffd6a0', 0, 2.2, 2); ucL.position.set(0.85, 1.48, Z - 0.3); scene.add(ucL);
  // the street's light from below the window, up onto the ceiling (night)
  const winL = new THREE.SpotLight('#9fb4dc', 0, 9, 0.5, 0.7, 1.2); winL.position.set(0.35, -0.6, -4.2); winL.target.position.set(0.55, H, 0.6); winL.castShadow = true; winL.shadow.mapSize.set(1024, 1024); winL.shadow.bias = -0.001; scene.add(winL, winL.target);
  // the moon through the window, onto the bed (the dark: the window frame's shadow across the duvet)
  const moonL = new THREE.SpotLight('#9cb2e0', 0, 9, 0.55, 0.6, 1.2); moonL.position.set(0.2, 2.6, -3.4); moonL.target.position.set(1.15, 0.45, -0.3); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024); moonL.shadow.bias = -0.001; scene.add(moonL, moonL.target);
  const FX = SB_FL.fridge[0], FZ = SB_FL.fridge[1], FH = 1.62;
  B(0.6, FH, Z - FZ, sbStd('#eeece6', 0.35, 0.1), FX, FH / 2, (FZ + Z) / 2);
  B(0.012, 0.32, 0.03, steelM, FX + 0.24, 1.15, FZ - 0.02); B(0.58, 0.004, 0.004, sbStd('#bdb8ac', 0.6), FX, 1.05, FZ - 0.001);
  // (what's on its door: a takeaway menu, a photo strip, a final notice, magnets)
  for (const [x, y, w, h, c, rz] of [[FX - 0.17, 1.32, 0.15, 0.21, '#f4f0e4', 0.05], [FX + 0.15, 1.45, 0.06, 0.18, '#3a3a48', -0.08], [FX - 0.05, 0.78, 0.17, 0.12, '#f2d0c8', 0.02]]) {
    const m = sbMesh(new THREE.PlaneGeometry(w, h), sbStd(c, 0.85, 0), x, y, FZ - 0.003, G.clutter); m.rotation.set(0, Math.PI, rz); m.castShadow = false;
  }
  for (const [x, y, c] of [[FX - 0.17, 1.42, '#c23a2a'], [FX + 0.15, 1.53, '#3a8ac2'], [FX - 0.05, 0.83, '#e2b23a']]) sbMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 12).rotateX(Math.PI / 2), sbStd(c, 0.4), x, y, FZ - 0.008, G.clutter);
  // the sticky note: on the pad (being written), then on the fridge
  const noteTex = sbCanvasTex(256, 256, sbNoteDraw);
  const noteM = sbStd('#ffffff', 0.85, 0, { map: noteTex.tex, side: THREE.DoubleSide });
  const notePad = sbMesh(new THREE.PlaneGeometry(0.076, 0.076).rotateX(-Math.PI / 2), noteM, SB_FL.pad[0], SB_FL.pad[1], SB_FL.pad[2]); notePad.rotation.y = 0.12;
  B(0.08, 0.012, 0.08, sbStd('#f2d04a', 0.9), SB_FL.pad[0], SB_FL.pad[1] - 0.007, SB_FL.pad[2], G.clutter).rotation.y = 0.12;
  const noteFridge = sbMesh(new THREE.PlaneGeometry(0.076, 0.076), noteM, FX + 0.06, 1.38, FZ - 0.004); noteFridge.rotation.set(0, Math.PI, -0.04); noteFridge.castShadow = false;

  // ---- the door (peephole, chain, hooks, a jacket); the corridor outside
  const doorM = sbStd('#2f4652', 0.55, 0), brassM = sbStd('#b79358', 0.3, 0.9), panelM = sbStd('#38525f', 0.5, 0);
  const door = B(DX1 - DX0 - 0.02, DH - 0.01, 0.045, doorM, (DX0 + DX1) / 2, DH / 2, Z + 0.02);
  for (const [y, h] of [[0.55, 0.75], [1.48, 0.78]]) B(DX1 - DX0 - 0.24, h, 0.02, panelM, (DX0 + DX1) / 2, y, Z - 0.01);
  for (const [w, h, x, y] of [[0.06, DH + 0.06, DX0 - 0.03, DH / 2], [0.06, DH + 0.06, DX1 + 0.03, DH / 2], [DX1 - DX0 + 0.12, 0.06, (DX0 + DX1) / 2, DH + 0.03]]) B(w, h, 0.03, whiteM, x, y, Z - 0.01);
  sbMesh(new THREE.CylinderGeometry(0.009, 0.009, 0.06, 14).rotateX(Math.PI / 2), brassM, SB_FL.door, 1.55, Z + 0.02);
  sbMesh(new THREE.SphereGeometry(0.03, 14, 10), brassM, DX1 - 0.09, 1.0, Z - 0.02);
  for (let i = 0; i < 7; i++) sbMesh(new THREE.TorusGeometry(0.008, 0.002, 4, 8), steelM, DX1 - 0.12 - i * 0.016, 1.42 - Math.sin(i / 6 * Math.PI) * 0.05, Z - 0.01);
  for (let i = 0; i < 3; i++) B(0.02, 0.02, 0.06, steelM, -X + 0.03, 1.7, 0.75 + i * 0.16).rotation.y = Math.PI / 2;
  sbMesh(sbRoundBox(0.1, 0.62, 0.36, 0.05, 0.03), sbStd('#3a4250', 0.95, 0), -X + 0.08, 1.1, 0.9, G.clutter);
  for (let i = 0; i < 3; i++) sbMesh(sbRoundBox(0.1, 0.07, 0.28, 0.03, 0.015), sbStd(['#e8e4dc', '#2a2a2a', '#7a5a3a'][i], 0.7), -1.3 + i * 0.16, 0, 1.05, G.clutter).rotation.y = 0.2 * i;
  // the corridor (lit by a tube), a neighbour's door across, the man at the door
  const hallM = sbStd('#bcb6a8', 0.9, 0), hallFloorM = sbStd('#6a6458', 0.8, 0);
  B(4, 0.02, 2.6, hallFloorM, -0.8, -0.01, Z + 1.4, G.hall); B(4, 0.05, 2.6, sbStd('#d8d4ca', 0.9), -0.8, H + 0.02, Z + 1.4, G.hall);
  B(4, H, 0.1, hallM, -0.8, H / 2, Z + 2.7, G.hall); B(0.1, H, 2.6, hallM, -2.8, H / 2, Z + 1.4, G.hall); B(0.1, H, 2.6, hallM, 1.2, H / 2, Z + 1.4, G.hall);
  B(0.86, 2.05, 0.05, sbStd('#6a3a2e', 0.6), -0.4, 1.025, Z + 2.64, G.hall);
  B(0.12, 0.03, 1.1, sbStd('#f4f8ff', 0.3, 0, { emissive: '#e8f0ff', emissiveIntensity: 2 }), -0.9, H - 0.02, Z + 1.3, G.hall);
  const hallL = new THREE.PointLight('#e8f0ff', 0, 5, 1.6); hallL.position.set(-0.9, H - 0.3, Z + 1.3); scene.add(hallL);
  const visitor = sbPerson({ id: 'sbFriend', look: 'sbVisitor', path: [[0, SB_FL.door + 0.08, Z + 0.95]], face: 0, states: [[0, 'sbWait']] }, scene);
  visitor.root.visible = false;
  // (the peephole: a black mask round a small circle, on the camera)
  const peep = new THREE.Mesh(new THREE.RingGeometry(0.092, 0.6, 72), new THREE.MeshBasicMaterial({ color: '#000', depthTest: false, depthWrite: false, transparent: true }));
  peep.position.z = -0.1; peep.renderOrder = 999; peep.visible = false; cam.add(peep);
  const peepGlow = new THREE.Mesh(new THREE.RingGeometry(0.078, 0.096, 72), new THREE.MeshBasicMaterial({ color: '#000', depthTest: false, depthWrite: false, transparent: true, opacity: 0.55 }));
  peepGlow.position.z = -0.1; peepGlow.renderOrder = 998; peepGlow.visible = false; cam.add(peepGlow);

  // ---- the cash, rising: its top is life-size $10,000 bundles (one instanced mesh, each a little askew, a loose layer
  //      tumbled on top), over a solid fill of the same texture just below them
  const cash = new THREE.Group(); cash.visible = false; scene.add(cash);
  { const side = sbStd('#e2e2d4', 0.9, 0), band = sbStd('#ffffff', 0.8, 0, { map: bundleTex }), cols = 21, rows = 39, loose = 260;
    const bG = new THREE.BoxGeometry(0.156, 0.011, 0.066), im = new THREE.InstancedMesh(bG, [side, side, band, side, side, side], cols * rows + loose), o = new THREE.Object3D();
    let n = 0;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const h = i * 31 + j * 7;
      o.position.set(-X + 0.08 + i * (2 * X - 0.16) / (cols - 1) + (sbR(h, 1) - 0.5) * 0.03, -0.006 + 0.008 * sbR(h, 2), -Z + 0.035 + j * (2 * Z - 0.07) / (rows - 1) + (sbR(h, 3) - 0.5) * 0.012);
      o.rotation.set((sbR(h, 4) - 0.5) * 0.12, (sbR(h, 5) - 0.5) * 0.3, (sbR(h, 6) - 0.5) * 0.12); o.updateMatrix(); im.setMatrixAt(n++, o.matrix);
    }
    for (let k = 0; k < loose; k++) {
      o.position.set((sbR(k, 11) - 0.5) * (2 * X - 0.2), 0.008 + 0.012 * sbR(k, 12), (sbR(k, 13) - 0.5) * (2 * Z - 0.12));
      o.rotation.set((sbR(k, 14) - 0.5) * 0.5, sbR(k, 15) * Math.PI, (sbR(k, 16) - 0.5) * 0.5); o.updateMatrix(); im.setMatrixAt(n++, o.matrix);
    }
    im.castShadow = false; im.receiveShadow = true; cash.add(im);
    const cashTex = sbTex(cashCanvas); cashTex.repeat.set(2 * X / 0.78, 2 * Z / 0.66);
    const fill = sbMesh(new THREE.PlaneGeometry(2 * X - 0.004, 2 * Z - 0.004).rotateX(-Math.PI / 2), sbStd('#c8c8b8', 0.9, 0, { map: cashTex }), 0, -0.012, 0, cash); fill.castShadow = false; }

  // ---- Feeney's table: a $10 watch, reading glasses, a folded paper
  const watch = new THREE.Group(); watch.position.set(SB_FL.table[0] + 0.05, 0.75, SB_FL.table[2] + 0.06); watch.rotation.y = -0.4; G.feeney.add(watch);
  { const face = new THREE.Mesh(sbRoundBox(0.038, 0.012, 0.042, 0.006, 0.002), sbStd('#1a1a1a', 0.5, 0.1)); watch.add(face);
    const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.03).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: sbTex(sbFlWatchCanvas(), { repeat: false }), toneMapped: true })); lcd.position.y = 0.0125; watch.add(lcd);
    for (const s of [-1, 1]) { const strap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.003, 0.09), sbStd('#141414', 0.7)); strap.position.set(0, 0.0015, s * 0.064); strap.rotation.x = s * 0.06; watch.add(strap); } }
  { const gl = new THREE.Group(); gl.position.set(SB_FL.table[0] - 0.16, 0.76, SB_FL.table[2] - 0.02); gl.rotation.y = 0.5; G.feeney.add(gl);
    for (const s of [-1, 1]) { const lens = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0025, 6, 20), sbStd('#2a2420', 0.4, 0.3)); lens.position.x = s * 0.028; lens.rotation.x = -1.2; gl.add(lens); } }
  B(0.22, 0.008, 0.3, sbStd('#e4e0d4', 0.9), SB_FL.table[0] + 0.2, 0.749, SB_FL.table[2] - 0.05, G.feeney).rotation.y = 0.15;

  // ---- your hands (one script for the whole flat: the phone, the ticket, the pen, the press)
  const hs = {
    right: [[-1, 'hidden'], [SB.rent - 0.7, 'phone'], [SB.draw + 0.1, 'hidden'], [SB.ticket, 'ticket'], [SB.won + 2.2, 'sbTicketShake'], [SB.scale, 'hidden'],
      [SB.write - 0.5, 'pen'], [SB.stick - 0.9, 'hidden'], [SB.stick - 0.25, 'press'], [SB.stick + 1.5, 'hidden'], [SB.mum, 'phone'], [sbCap('mum', 2).show - 0.2, 'phoneLow'], [SB.dunn, 'phone'],
      [SB.out + 0.3, 'sbPhoneBuzz'], [SB.who, 'phoneLow'], [sbCap('who', 1).show - 0.4, 'phone'], [SB.trust + 0.9, 'phoneLow'], [SB.knock + 0.1, 'hidden']],
    left: [[-1, 'hidden']],
  };
  const hands = sbHands(cam, hs, { sleeve: '#3a4250', cuff: '#2c333e' });
  hands.poses.sbTicketShake = Object.assign({}, SB_HPOSE.ticket, { p: [0.14, -0.1, -0.34], trem: 0.006 });
  hands.poses.sbPhoneBuzz = Object.assign({}, SB_HPOSE.phone, { trem: 0.0035 });
  hands.poses.press = Object.assign({}, SB_HPOSE.press); hands.poses.pen = Object.assign({}, SB_HPOSE.pen, { F: [-0.3, 0.85, -0.4], N: [-0.55, 0.1, -0.8] });
  hands.blends.sbTicketShake = 0.4; hands.blends.sbPhoneBuzz = 0.2;
  // (where the pen's tip sits in the hand, and the palm's middle: for aiming the hand at the note)
  const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3();
  const penTip = new THREE.Vector3(0, -0.086, 0).applyQuaternion(hands.props.pen.quaternion).add(hands.props.pen.position);
  const orient = (F, N) => { _y.set(F[0], F[1], F[2]).normalize(); _z.set(N[0], N[1], N[2]); _z.addScaledVector(_y, -_z.dot(_y)).normalize(); _x.crossVectors(_y, _z); return _q.setFromRotationMatrix(_m.makeBasis(_x, _y, _z)); };
  const aimHand = (pose, local, worldPt) => { _v.copy(worldPt); cam.worldToLocal(_v); _w.copy(local).applyQuaternion(orient(pose.F, pose.N)); pose.p = [_v.x - _w.x, _v.y - _w.y, _v.z - _w.z]; };

  // ---- light per scene: night (the lamp, the TV), day (the sun through the window), the dark (in bed)
  let litKey = null;
  const setLight = (key) => {
    if (litKey === key) return; litKey = key;
    const day = key === 'day' || key === 'feeney';
    cityTex.update({ day });
    scene.background = new THREE.Color(day ? '#c8d6e6' : '#05070d');
    scene.environment = day ? envD : envN;
    hemi.color.set(day ? '#dfe8f2' : key === 'dark' ? '#6a78a0' : '#58606e'); hemi.groundColor.set(day ? '#a08a70' : '#2a2420'); hemi.intensity = day ? 0.75 : key === 'dark' ? 0.16 : 0.12;
    sun.intensity = day ? (key === 'feeney' ? 3.4 : 3.0) : 0; sun.castShadow = day;
    lampL.intensity = key === 'night' ? 2.2 : 0; lampM.emissiveIntensity = key === 'night' ? 0.22 : 0;
    ucL.intensity = key === 'night' ? 1.4 : 0;
    phoneL.intensity = key === 'dark' ? 1.1 : 0; winL.intensity = key === 'night' ? 9 : key === 'dark' ? 10 : 0; moonL.intensity = key === 'dark' ? 26 : 0;
    G.clutter.visible = key !== 'feeney'; G.tv.visible = key !== 'feeney'; G.feeney.visible = key === 'feeney';
    duvet.visible = key !== 'feeney'; pillow.visible = true; letter.visible = key !== 'feeney' && key !== 'day';
  };

  const look = (p, at, fov, roll = 0, drift = 0.006, rate = 0.3, t = 0) => { const d = sbDrift(t, drift, rate, 5); sbCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); };
  const balls = (t) => { let n = 0; for (const b of SB.ball) if (t >= b) n++; return n; };
  const SEAT = SB_FL.seat, TV = [SB_FL.tv[0], SB_FL.tv[1], SB_FL.tv[2]];
  let cutAt = [];

  const set = {
    scene, camera: cam,
    cuts() { return [SB.stick - 0.35, SB.knock + 2.05]; },
    frame(t, shot) {
      const m = shot.mode;
      const key = m === 'feeney' ? 'feeney' : m === 'interest' ? 'dark' : (m === 'mum' || m === 'out' || m === 'who' || m === 'trust') ? 'day' : 'night';
      setLight(key);
      // ---- what's on: the TV, the phone in your hand, the ticket, the note
      const f = Math.floor(t * 30);
      let tvS = { mode: 'ad', f };
      if (m === 'draw') tvS = { mode: 'draw', f, n: 0 };
      if (m === 'balls' || (m === 'won' && t < SB.won + 0.9)) { const n = balls(t), nb = SB.ball[n]; tvS = { mode: 'draw', f, n, roll: nb ? MathX.clamp(1 - (nb - t) / 0.7, 0, 1) : 0 }; }
      if (m === 'won' && t >= SB.won + 0.9) tvS = { mode: 'won', f, n: 6 };
      if (m === 'scale' || m === 'promise') tvS = { mode: 'won', f, n: 6 };
      if (key === 'day') tvS = { mode: 'news', f, head: m === 'mum' ? 'ONE TICKET WINS $3.4 BILLION JACKPOT' : 'JACKPOT WINNER NAMED', tick: m === 'mum' ? 'THE WINNING TICKET WAS SOLD AT A CORNER SHOP  ·  THE WINNER HAS NOT COME FORWARD  ·  ' : 'THE $3.4 BILLION WINNER LIVES IN A RENTED FLAT  ·  HUNDREDS GATHER OUTSIDE  ·  "WE JUST WANT TO SAY CONGRATULATIONS"  ·  ' };
      if (key === 'dark') tvS = { mode: 'off' };
      if (tvS.mode === 'off') { tv.userData.scr.material.color.set('#050505'); } else { tv.userData.scr.material.color.set('#ffffff'); if (G.tv.visible) tvTex.update(tvS); }
      const tvFlicker = 0.75 + 0.25 * noise1(t * 3.1, 11);
      tvL.intensity = key === 'night' ? 0.8 * tvFlicker : key === 'day' ? 0.15 : 0;
      tvL.color.set(tvS.mode === 'won' ? '#ffd38a' : '#8aa8ff');
      hands.ticketTex.update({ n: m === 'balls' ? balls(t) : m === 'won' ? 6 : 0 });
      const kWrite = K(t, SB.write, SB.stick - 1.0, (x) => x);
      noteTex.update({ k: m === 'promise' ? Math.round(kWrite * 48) / 48 : 1, old: 0 });
      notePad.visible = m === 'promise' && t < SB.stick - 0.35;
      noteFridge.visible = (m === 'promise' && t >= SB.stick + 0.1) || m === 'mum' || m === 'out' || m === 'who' || m === 'trust' || m === 'interest';
      standPhone.g.visible = m === 'interest'; if (m === 'interest') standPhone.update(sbPhoneState(t, 'interest'));
      // ---- the bundle and the cash (scale only)
      bundle.visible = m === 'scale';
      const hCash = m === 'scale' ? SB_FL.cashDepth * K(t, SB.cashUp, SB.cashTop, Ease.inOutQuad) : 0;
      cash.visible = hCash > 0.01; cash.position.y = hCash;
      // ---- the corridor and the man in it (trust)
      const peeping = m === 'trust' && t >= SB.knock + 2.05;
      G.hall.visible = m === 'trust'; hallL.intensity = m === 'trust' ? 2.2 : 0; visitor.root.visible = m === 'trust';
      if (m === 'trust') { visitor.states = [[0, 'sbWait'], [SB.knock - 0.2, 'sbKnock'], [SB.knock + 1.3, 'sbWait']]; visitor.update(t); }
      peep.visible = peepGlow.visible = peeping;
      // ---- the camera
      let pos = SEAT, at = TV, fov = 55, roll = 0, drift = 0.006, show = null;
      if (m === 'title') {
        const k = K(t, SB.titleShot, SB.flat + 0.5);
        pos = sbV([-1.45, 1.74, 0.5], [-1.0, 1.6, 0.18], Ease.inOutSine(k)); at = sbV([0.6, 0.86, -1.15], [0.55, 0.8, -1.1], k); fov = sbLerp(64, 55, k);
      } else if (m === 'flat') {
        // the TV (the ad), the letter on the table, then your phone
        const k1 = K(t, sbCap('flat', 0).show + 0.4, sbCap('flat', 0).hide + 0.2), k2 = K(t, SB.rent - 0.9, SB.rent + 0.2);
        at = sbV(sbV(TV, [SB_FL.table[0], 0.8, SB_FL.table[2]], k1), [0.2, 0.75, -0.9], k2); fov = sbLerp(54, 50, k2);
        if (t > SB.rent - 0.7) show = 'phone';
      } else if (m === 'draw') {
        const k = K(t, SB.draw, sbE('draw'));
        pos = sbV(SEAT, [0.8, 1.06, -0.24], k); at = TV; fov = sbLerp(52, 46, k);
        if (t > SB.ticket) show = 'ticket';
      } else if (m === 'balls') {
        // you lean in to the TV
        const k = K(t, SB.balls, SB.ball[2]);
        pos = sbV([0.8, 1.06, -0.24], [0.15, 1.0, -0.28], k); at = [TV[0], TV[1] - 0.02, TV[2] - 0.26]; fov = 46; drift = 0.004 + 0.01 * K(t, SB.ball[4], SB.ball[5]);
        // (the last ball: a snap in on the screen, a jolt, as if you'd flinched)
        if (t >= SB.ball[5]) { const u = t - SB.ball[5]; fov = 46 - 9 * MathX.smooth(u, 0, 0.18); const j = 0.02 * Math.exp(-u * 6) * Math.sin(u * 48); pos = [pos[0], pos[1] + j, pos[2] + 0.04 * MathX.smooth(u, 0, 0.2)]; }
        show = 'ticket';
      } else if (m === 'won') {
        // you stand up; the ticket shakes
        const k = K(t, SB.won + 0.4, SB.won + 1.6, Ease.outCubic);
        pos = sbV([0.15, 1.0, -0.28], [0.3, 1.62, -0.25], k); at = sbV(TV, [TV[0], TV[1] + 0.1, TV[2]], k); fov = sbLerp(46, 52, k); drift = 0.012;
        show = 'ticket';
      } else if (m === 'scale') {
        // the bundle on the table, then the room filling up
        const k1 = K(t, SB.cashUp - 1.2, SB.cashUp + 0.4), k2 = K(t, SB.cashUp + 0.4, SB.cashTop + 2.0);
        pos = sbV([0.55, 1.62, 0.55], [0.9, 1.64, 0.85], k2); at = sbV([SB_FL.table[0] + 0.02, 0.76, SB_FL.table[2] + 0.02], sbV([-0.55, 0.95, -0.75], [-0.6, 1.0, -1.15], k2), k1);
        fov = sbLerp(44, sbLerp(64, 58, k2), k1);
      } else if (m === 'promise') {
        if (t < SB.stick - 0.35) {
          // the fridge's clutter, then down to the pad; the pen writes
          const k = K(t, SB.promise + 1.2, SB.write - 0.3);
          pos = sbV([0.45, 1.62, 0.35], [-0.16, 1.36, -0.3], k); at = sbV([TV[0], TV[1] + 0.05, TV[2]], [SB_FL.pad[0] + 0.01, SB_FL.pad[1], SB_FL.pad[2]], k); fov = sbLerp(52, 32, k);
          if (t > SB.write - 0.5) show = 'pen';
        } else {
          pos = [FX + 0.04, 1.55, FZ - 0.62]; at = [FX + 0.05, 1.37, FZ]; fov = 46; drift = 0.003;
          if (t < SB.stick + 1.6) show = null;
        }
      } else if (m === 'mum' || m === 'out' || m === 'who') {
        // on the bed by day, the phone in your hand (for "it feels incredible": the window)
        // (day three: a slow push in on the phone as the messages pour in, a jolt at each jump; then the news on the TV,
        //  your name on it, and back down to the phone)
        const kw = m === 'mum' ? K(t, sbCap('mum', 2).show - 0.3, sbCap('mum', 2).show + 0.9) : 0;
        at = sbV([0.1, 0.78, -0.8], [0.35, 1.45, -1.3], kw); fov = 50;
        if (m === 'out') {
          fov = sbLerp(50, 33, K(t, SB.out, SB.who, Ease.inOutSine));
          let j = 0; for (let i = 1; i <= 3; i++) { const t0 = sbCap('out', i).show - 0.1; if (t >= t0) j += 0.012 * Math.exp(-(t - t0) * 7) * Math.sin((t - t0) * 55); }
          pos = [SEAT[0] + j * 0.4, SEAT[1] + j, SEAT[2]];
        }
        if (m === 'who') { const kt = K(t, SB.who, SB.who + 0.6) * (1 - K(t, sbCap('who', 0).hide - 0.2, sbCap('who', 1).show + 0.3)); at = sbV(at, [TV[0], TV[1] + 0.02, TV[2]], kt); fov = sbLerp(sbLerp(46, 44, K(t, sbCap('who', 1).show, SB.trust)), 40, kt); }
        show = 'phone';
      } else if (m === 'trust') {
        if (t < SB.knock + 2.05) {
          // the phone goes dark; a knock; you look at the door, get up, go to it
          const k1 = K(t, SB.knock + 0.1, SB.knock + 0.7), k2 = K(t, SB.knock + 0.6, SB.knock + 2.0, Ease.inOutQuad);
          pos = sbV(SEAT, [SB_FL.door + 0.05, 1.6, Z - 0.35], k2); at = sbV([0.1, 0.78, -0.8], [SB_FL.door, 1.45, Z], k1); fov = 52; drift = 0.008;
          if (t < SB.knock + 0.1) show = 'phone';
        } else {
          // through the peephole
          pos = [SB_FL.door, 1.55, Z + 0.06]; at = [SB_FL.door + 0.05, 1.42, Z + 1.0]; fov = 100; drift = 0.002;
        }
      } else if (m === 'interest') {
        // in bed in the dark, the moonlit window; then down to the phone on its stand, lit, the interest ticking; closer
        const k = K(t, sbCap('interest', 0).show + 1.2, sbCap('interest', 1).show + 0.3), k2 = K(t, sbCap('interest', 2).show - 0.5, SB.house + 0.3);
        pos = sbV([X - 0.5, 0.76, -Z + 0.42], [X - 0.62, 0.74, -Z + 0.36], k); at = sbV([X - 0.75, H, -Z + 1.25], [SB_FL.stand[0], SB_FL.stand[1] + 0.07, SB_FL.stand[2]], k);
        fov = sbLerp(sbLerp(64, 30, k), 21, k2); roll = sbLerp(-6, 9, k); drift = 0.003;
        phoneL.intensity = 0.5 + 1.6 * K(t, sbCap('interest', 0).show + 0.6, sbCap('interest', 0).show + 1.2);
      } else if (m === 'feeney') {
        const k = K(t, SB.feeney, sbCap('feeney', 1).show), k2 = K(t, sbCap('feeney', 1).show + 0.5, SB.point);
        pos = sbV(sbV([0.35, 1.5, 0.25], [0.0, 1.2, -0.42], k), [0.45, 1.6, 0.6], k2); at = sbV([SB_FL.table[0] + 0.05, 0.75, SB_FL.table[2] + 0.06], [-0.2, 1.0, -1.0], k2); fov = sbLerp(sbLerp(46, 36, k), 60, k2);
      }
      look(pos, at, fov, roll, drift, 0.3, t);
      // ---- your hands: aim the pen at the letter being written, the palm at the note on the fridge
      if (m === 'promise' && t < SB.stick - 0.35) {
        const n = kWrite * 12, li = Math.min(2, Math.floor(n / 4)), u = (n - li * 4) / 4, lift = t < SB.write ? 0.012 : 0.0;
        _v.set((-0.5 + 0.14 + li * 0.03 + u * 0.6) * 0.076, 0, (-0.5 + 0.26 + li * 0.25) * 0.076 + 0.003 * Math.sin(t * 38));
        _v.applyAxisAngle(_y.set(0, 1, 0), 0.12).add(_w.set(SB_FL.pad[0], SB_FL.pad[1] + 0.002 + lift + 0.002 * Math.max(0, Math.sin(t * 19)), SB_FL.pad[2]));
        aimHand(hands.poses.pen, penTip, _v.clone());
      }
      if (m === 'promise' && t >= SB.stick - 0.35) aimHand(hands.poses.press, _x.set(0, 0.048, 0.022).clone(), noteFridge.position.clone().add(_w.set(0, 0, -0.005)));
      if (show === 'phone') hands.props.phone.update(m === 'trust' && t > SB.trust + 0.7 ? { app: 'off' } : sbPhoneState(t, m === 'trust' ? 'who' : m === 'flat' || m === 'title' ? 'flat' : m));
      hands.update(t);
      hands.show(show);
      this._t = t;
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.grain = 0.03;
      if (m === 'mum' || m === 'out' || m === 'who' || m === 'trust') { p.exposure = 1.08; p.warmth = 0.03; p.bloom = 0.3; p.bloomThreshold = 0.95; }
      else if (m === 'feeney') { p.exposure = 1.12; p.warmth = 0.06; p.saturation = 0.92; p.bloom = 0.35; }
      else if (m === 'scale') { p.exposure = 1.12; p.warmth = 0.02; p.bloom = 0.28; p.bloomThreshold = 0.92; p.vignette = 0.6; }
      else if (m === 'interest') { p.exposure = 1.4; p.warmth = -0.05; p.saturation = 0.85; p.vignette = 0.7; p.bloom = 0.5; p.bloomThreshold = 0.7; }
      else { p.exposure = 1.18; p.warmth = 0.02; p.bloom = 0.45; p.bloomThreshold = 0.8; p.vignette = 0.6; }
      if (m === 'won') p.flash = Math.max(p.flash, 0.18 * Math.exp(-Math.pow((t - SB.billion) * 3, 2)));
      if (m === 'balls' && t >= SB.ball[5]) { p.flash = Math.max(p.flash, 0.3 * Math.exp(-(t - SB.ball[5]) * 5)); p.flashColor.setRGB(1, 0.92, 0.75); }
      if (m === 'trust' && t >= SB.knock + 2.05) { p.vignette = 0.9; p.saturation = 0.85; p.edgeBlur = 0.6; }
    },
    labels(t) {
      const m = sbShotAt(t).mode, out = [];
      if (m === 'flat') out.push({ p: [SB_FL.table[0] + 0.08, 0.8, SB_FL.table[2] + 0.04], text: 'RENT · $1,240', sub: 'DUE MONDAY', a: W(t, sbCap('flat', 0).show + 1.0, SB.rent - 0.6, 0.4, 0.3) });
      if (m === 'scale') {
        out.push({ p: [SB_FL.table[0] + 0.02, 0.8, SB_FL.table[2] + 0.02], text: 'ONE BUNDLE · $10,000', sub: '2 H 47 MIN TO COUNT, $1 A SECOND', a: W(t, sbCap('scale', 0).show + 0.6, SB.cashUp - 1.0, 0.4, 0.3) });
      }
      if (m === 'promise') out.push({ p: [FX + 0.06, 1.45, FZ], text: 'YOUR PROMISE', a: W(t, SB.stick + 1.5, SB.mum, 0.4, 0.2) });
      if (m === 'trust') out.push({ p: [SB_FL.door + 0.08, 1.95, Z + 0.95], text: 'HE SAYS HE\'S AN OLD FRIEND', a: W(t, SB.knock + 2.4, SB.interest, 0.4, 0.2) });
      if (m === 'feeney') out.push({ p: [SB_FL.table[0] + 0.05, 0.8, SB_FL.table[2] + 0.06], text: 'A CHEAP WATCH', sub: 'ABOUT $10 TO $15', a: W(t, sbCap('feeney', 1).show + 1.0, SB.point - 0.4, 0.4, 0.3) });
      return out;
    },
  };
  return set;
};
