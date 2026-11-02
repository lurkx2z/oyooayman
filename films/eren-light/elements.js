/* =====================================================================
   ELEMENTS — the story objects and graphic devices of "Would Eren and Light agree?":
     the black notebook (closed / open, names, live handwriting), the writing hand, a TV, a prison cell,
     the giants (walking silhouettes with steam), the globe going dark, the island map, the Wall,
     manga devices: panels (clipped sub-frames with gutters), focus lines, SFX lettering, callouts,
     round cards, ink stamps, the scoreboard, the countdown numerals.
   All pure functions of their arguments (and t); everything is drawn before the ink shader unless noted.
   ===================================================================== */

const ELK = { ink: '#121015', paper: '#f4efe4', red: '#d8262c', green: '#1fbf78', redDk: '#7a0e12', greenDk: '#0b5a36' };

// a plain plate (no set): a vertical gradient background, then the camera
function plate(g, t, C, stops, fn) { g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, stops); camK(g, C, 1, t); if (fn) fn(g); }

/* ---------- the notebook ---------- */
function notebookClosed(g, x, y, s, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  shadowOn(g, 30, 'rgba(0,0,0,0.5)', 10); box(g, -140, -190, 280, 380, '#141217', { r: 8, lit: 0.12, dark: 0.1 }); shadowOff(g);
  g.fillStyle = '#e9e4da'; g.fillRect(132, -182, 8, 364);                              // page edges
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; g.strokeRect(-122, -172, 244, 344);
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(-140, -190, 40, 380);
  g.restore();
}
// an open notebook seen from above: two pages; names = [[text, struck?], ...] on the left page; live = { text, u (0..1) }
function notebookOpen(g, x, y, s, rot, names = [], live = null, t = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  shadowOn(g, 40, 'rgba(0,0,0,0.55)', 14); box(g, -420, -270, 840, 540, '#141217', { r: 10 }); shadowOff(g);
  for (const sx of [-1, 1]) { const px = sx < 0 ? -400 : 6; vgrad(g, px, -252, 394, 504, [[0, '#f6f2ea'], [1, '#e6e0d4']]);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(sx < 0 ? -30 : 6, -252, 24, 504);
    g.strokeStyle = 'rgba(40,40,60,0.28)'; g.lineWidth = 1.5; for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(px + 26, -200 + k * 38); g.lineTo(px + 370, -200 + k * 38); g.stroke(); } }
  g.font = `italic 400 30px ${SERIF}`; g.textAlign = 'left'; g.fillStyle = '#16121a';
  names.forEach(([n, st], k) => { const yy = -208 + k * 38; g.fillText(n, -370, yy); if (st) { g.strokeStyle = '#16121a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-372, yy - 9); g.lineTo(-370 + g.measureText(n).width, yy - 9); g.stroke(); } });
  if (live) handwrite(g, live.text, 40, -170, 44, live.u, t);
  g.restore();
}
// handwriting that appears letter by letter (u: 0..1 of the text); returns the pen tip position
function handwrite(g, s, x, y, size, u, t) {
  g.font = `italic 500 ${size}px ${SERIF}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const n = s.length, k = u * n, whole = Math.floor(k), frac = k - whole;
  let cx = x;
  for (let i = 0; i < Math.min(n, whole + 1); i++) {
    const ch = s[i], w = g.measureText(ch).width;
    if (i < whole) { g.fillStyle = '#100c12'; g.fillText(ch, cx, y + Math.sin(i * 1.7) * 1.5); }
    else if (frac > 0) { g.save(); g.beginPath(); g.rect(cx - 2, y - size, w * frac + 2, size * 1.4); g.clip(); g.fillStyle = '#100c12'; g.fillText(ch, cx, y + Math.sin(i * 1.7) * 1.5); g.restore(); cx += w * frac; break; }
    cx += w;
  }
  return [cx, y - size * 0.3];
}
// a hand holding a pen (sleeve from the top right), the pen tip at (x, y)
function penHand(g, x, y, s, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.rot ?? -0.15);
  const sleeve = o.sleeve || '#c4b498';
  g.lineCap = 'round';
  // the pen
  g.strokeStyle = ELK.ink; g.lineWidth = 22; g.beginPath(); g.moveTo(0, 0); g.lineTo(150, -260); g.stroke();
  g.strokeStyle = '#3a3a44'; g.lineWidth = 14; g.beginPath(); g.moveTo(8, -14); g.lineTo(150, -260); g.stroke();
  g.fillStyle = '#d8d4cc'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, -22); g.lineTo(10, -20); g.closePath(); g.fill();
  // the sleeve and cuff
  g.strokeStyle = ELK.ink; g.lineWidth = 214; g.beginPath(); g.moveTo(230, -250); g.lineTo(700, -640); g.stroke();
  g.strokeStyle = sleeve; g.lineWidth = 200; g.beginPath(); g.moveTo(230, -250); g.lineTo(700, -640); g.stroke();
  g.strokeStyle = shade(sleeve, -0.3); g.lineWidth = 90; g.beginPath(); g.moveTo(270, -230); g.lineTo(720, -600); g.stroke();
  g.strokeStyle = ELK.ink; g.lineWidth = 104; g.beginPath(); g.moveTo(170, -190); g.lineTo(230, -245); g.stroke();
  g.strokeStyle = '#f7f4ee'; g.lineWidth = 92; g.beginPath(); g.moveTo(170, -190); g.lineTo(230, -245); g.stroke();
  // the hand, in the lamp's shadow: an ink silhouette wrapped round the pen, rim-lit on the top edge
  const P = () => { g.beginPath(); g.moveTo(30, -60); g.quadraticCurveTo(20, -120, 70, -150); g.quadraticCurveTo(120, -190, 170, -200); g.quadraticCurveTo(230, -215, 250, -170);
    g.quadraticCurveTo(262, -120, 225, -70); g.quadraticCurveTo(190, -30, 150, -24); g.quadraticCurveTo(120, -10, 92, -20); g.quadraticCurveTo(60, -10, 42, -30); g.closePath(); };
  P(); g.fillStyle = '#f2ece2'; g.fill(); g.save(); P(); g.clip(); g.translate(8, 10); P(); g.fillStyle = ELK.ink; g.fill(); g.restore();
  g.strokeStyle = 'rgba(242,236,226,0.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(92, -20); g.quadraticCurveTo(110, -60, 104, -96); g.moveTo(150, -24); g.quadraticCurveTo(170, -70, 160, -110); g.stroke();
  // the index finger along the barrel
  g.fillStyle = ELK.ink; g.beginPath(); g.moveTo(26, -48); g.quadraticCurveTo(50, -90, 96, -120); g.lineTo(110, -100); g.quadraticCurveTo(64, -70, 42, -36); g.closePath(); g.fill();
  g.strokeStyle = '#f2ece2'; g.lineWidth = 3; g.beginPath(); g.moveTo(26, -50); g.quadraticCurveTo(50, -92, 96, -122); g.stroke();
  g.restore();
}

/* ---------- screens, cells, rooms ---------- */
function tv(g, x, y, w, h, fn, t) {
  box(g, x - 18, y - 18, w + 36, h + 36, '#16151a', { r: 10 });
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(g); g.fillStyle = 'rgba(255,255,255,0.05)'; for (let yy = y + ((t * 60) % 6); yy < y + h; yy += 6) g.fillRect(x, yy, w, 2); g.restore();
  g.fillStyle = '#d8262c'; g.beginPath(); g.arc(x + w - 10, y + h + 10, 4, 0, Math.PI * 2); g.fill();
}
function cellBars(g, x0, x1, y0, y1) { g.fillStyle = '#16151a'; for (let x = x0; x < x1; x += 70) { g.fillRect(x, y0, 14, y1 - y0); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 2, y0, 3, y1 - y0); g.fillStyle = '#16151a'; } g.fillRect(x0, y0 + 60, x1 - x0, 16); }

/* ---------- the giants ---------- */
// a giant walking toward the camera, seen as a silhouette with a rim, steam and pale eyes. x, y = feet, h = height
const GIANT = { suit: '#2a2426', suitDk: '#141012', pants: '#2a2426', shoe: '#1a1416', hair: '#141012', shirt: '#2a2426', iris: '#ffffff', irisDk: '#bbbbbb' };
function giant(g, t, x, y, h, seed = 1, o = {}) {
  const ph = t * (o.speed ?? 0.9) + hash(seed) * 6;
  const P = mixPose(pose(POSES.walk1), pose(POSES.walk2), 0.5 + 0.5 * Math.sin(ph * Math.PI));
  P.lean = 0.06 + 0.04 * Math.sin(ph * 2.1); P.tilt = 0.15 + 0.05 * Math.sin(ph * 1.3); P.lSh += 0.2; P.rSh += 0.1;
  const s = (o.sway ?? 1) * Math.sin(ph * Math.PI) * 0.01 * h;
  const F = drawFig(g, { x: x + s, y, h, f: o.f ?? (hash(seed + 3) > 0.5 ? 1 : -1), who: 'extra', col: GIANT, p: P, sil: 1, ld: o.ld ?? 1, shadow: o.shadow ?? false, t, look: { lx: 0, ly: 0.2 }, open: 0.6 });
  // ribs and muscle stripes in a dull rim tone, and the steam
  g.save(); g.strokeStyle = 'rgba(246,241,230,0.18)'; g.lineWidth = Math.max(1, h * 0.004);
  for (let k = 0; k < 4; k++) { const yy = lerp(F.neck[1], F.hip[1], 0.25 + k * 0.15); g.beginPath(); g.moveTo(F.hip[0] - h * 0.05, yy); g.quadraticCurveTo(F.hip[0], yy + h * 0.015, F.hip[0] + h * 0.05, yy); g.stroke(); }
  g.restore();
  if (o.steam !== false) steam(g, t, F.head[0], F.head[1] - h * 0.04, h * 0.12, seed, o.steamA ?? 0.6);
  return F;
}
function steam(g, t, x, y, r, seed = 1, a = 0.6) {
  for (let k = 0; k < 6; k++) { const ph = (t * 0.35 + k / 6 + hash(seed * 7 + k)) % 1; const xx = x + (hash(seed + k) - 0.5) * r * 1.4 + Math.sin(t + k) * r * 0.2, yy = y - ph * r * 3.2;
    glow(g, xx, yy, r * (0.6 + ph * 1.1), `rgba(245,240,232,${(a * (1 - ph) * 0.8).toFixed(3)})`); }
}
// a row of giants on the horizon: n figures between x0..x1 at baseline y, heights around h
function giantRow(g, t, x0, x1, y, h, n, seed, o = {}) {
  const L = []; for (let i = 0; i < n; i++) L.push([lerp(x0, x1, (i + hash(seed + i) * 0.6) / n), h * (0.75 + hash(seed * 3 + i) * 0.5), seed + i]);
  L.sort((a, b) => a[1] - b[1]);
  for (const [x, hh, sd] of L) giant(g, t, x, y + (hh - h) * 0.15, hh, sd, o);
}
// a giant foot coming down (from above the frame), its sole at y
function giantFoot(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#16121a'; g.beginPath(); g.moveTo(-160, -900); g.lineTo(-120, -160); g.quadraticCurveTo(-260, -60, -240, 0); g.lineTo(260, 0); g.quadraticCurveTo(280, -90, 110, -170); g.lineTo(130, -900); g.closePath(); g.fill();
  g.strokeStyle = FIGRIM; g.lineWidth = 8; g.beginPath(); g.moveTo(130, -900); g.lineTo(110, -170); g.quadraticCurveTo(280, -90, 260, 0); g.stroke();
  g.strokeStyle = 'rgba(246,241,230,0.2)'; g.lineWidth = 6; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-120 + k * 50, -700); g.lineTo(-110 + k * 52, -180); g.stroke(); }
  g.restore();
}

/* ---------- the world ---------- */
// the globe, with darkness swallowing a fraction `dark` of it from the east (the Rumbling)
function globeDark(g, x, y, r, t, dark) {
  g.save();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
  vgrad(g, x - r, y - r, 2 * r, 2 * r, [[0, '#f2eee6'], [1, '#b9b4ab']]);
  const tex = earthTex();
  g.globalAlpha = 0.6; g.globalCompositeOperation = 'multiply'; g.save(); g.translate(x, y); g.rotate(t * 0.01); g.drawImage(tex, -r, -r, 2 * r, 2 * r); g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.globalCompositeOperation = 'source-over';
  // the dark front: a ragged edge sweeping from the right
  const edge = x + r - dark * 2 * r;
  g.fillStyle = '#0d0b10'; g.beginPath(); g.moveTo(x + r + 10, y - r - 10);
  for (let k = 0; k <= 24; k++) { const yy = y - r + (2 * r) * k / 24; g.lineTo(edge + Math.sin(k * 1.7 + t * 2) * r * 0.04 + noise(k + t, 5) * r * 0.05, yy); }
  g.lineTo(x + r + 10, y + r + 10); g.closePath(); g.fill();
  g.globalCompositeOperation = 'lighter'; glow(g, edge, y, r * 0.5, 'rgba(255,240,220,0.25)'); g.globalCompositeOperation = 'source-over';
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.restore();
  g.strokeStyle = ELK.ink; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
}
// the island inside the Walls and the warships closing in (a manga map)
function islandMap(g, t, u) {
  vgrad(g, 0, 0, W, H, [[0, '#8f99a6'], [1, '#6c7684']]);
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; for (let y = 30; y < H; y += 26) { g.beginPath(); for (let x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x * 0.02 + y + t * 1.5) * 4); g.stroke(); }
  const cx = 960, cy = 560;
  g.fillStyle = '#e8e2d4'; g.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2, r = 230 + noise(k * 0.7, 3) * 40 + Math.sin(a * 3) * 20; g.lineTo(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeStyle = ELK.ink; g.lineWidth = 5; g.stroke();
  for (const r of [70, 120, 170]) { g.strokeStyle = ELK.ink; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, r * 1.25, r, 0, 0, Math.PI * 2); g.stroke(); }
  // ships converging
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.2, R0 = 900, R1 = 400 + hash(i) * 60, rr2 = lerp(R0, R1, eOut(u));
    const sx = cx + Math.cos(a) * rr2 * 1.25, sy = cy + Math.sin(a) * rr2 * 0.95;
    g.save(); g.translate(sx, sy); g.rotate(a + Math.PI); g.fillStyle = '#16131a'; g.beginPath(); g.moveTo(-34, -12); g.lineTo(30, -12); g.lineTo(44, 0); g.lineTo(30, 12); g.lineTo(-34, 12); g.closePath(); g.fill(); g.fillRect(-14, -6, 18, 12);
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-40, -10); g.lineTo(-90, -24); g.moveTo(-40, 10); g.lineTo(-90, 24); g.stroke(); g.restore(); }
}

/* ---------- manga devices ---------- */
// panels: draw several sub-frames, each clipped to a polygon, with white gutters and an ink edge.
// list: [{ poly: [[x, y], ...], fn: (g) => {...}, view: { x, y, s } (where the sub-frame's camera centre sits) }]
function panels(g, t, list, gutter = 14) {
  for (const P of list) {
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); P.poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
    const v0 = { x: VIEW.x, y: VIEW.y, s: VIEW.s }; if (P.view) Object.assign(VIEW, P.view);
    P.fn(g); Object.assign(VIEW, v0); g.restore();
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const P of list) { g.beginPath(); P.poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.strokeStyle = ELK.paper; g.lineWidth = gutter * 2; g.stroke(); }
  for (const P of list) { g.beginPath(); P.poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.strokeStyle = ELK.ink; g.lineWidth = 4; g.save(); g.clip(); g.lineWidth = 8; g.stroke(); g.restore(); }
}
// manga focus lines converging on (cx, cy)
function focusLines(g, cx, cy, t, o = {}) {
  const n = o.n ?? 120, r0 = o.r0 ?? 320, a = o.a ?? 0.9, col = o.col || ELK.ink;
  g.save(); g.fillStyle = col; g.globalAlpha = a; g.beginPath();
  for (let i = 0; i < n; i++) { const ang = (i / n) * Math.PI * 2 + hash(i * 5 + Math.floor(t * (o.fps ?? 12))) * 0.05, w = 0.004 + hash(i * 3 + Math.floor(t * (o.fps ?? 12))) * 0.012, r1 = r0 + hash(i * 11 + Math.floor(t * (o.fps ?? 12))) * 260;
    g.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); g.lineTo(cx + Math.cos(ang - w) * 2400, cy + Math.sin(ang - w) * 2400); g.lineTo(cx + Math.cos(ang + w) * 2400, cy + Math.sin(ang + w) * 2400); g.closePath(); }
  g.fill(); g.restore();
}
// speed lines (horizontal)
function speedLines(g, t, y0, y1, a = 0.8, col = ELK.ink) { g.save(); g.fillStyle = col; g.globalAlpha = a; for (let i = 0; i < 60; i++) { const y = lerp(y0, y1, hash(i * 7 + Math.floor(t * 15))), x = hash(i * 13 + Math.floor(t * 15)) * W, l = 200 + hash(i * 3) * 600; g.fillRect(x - l / 2, y, l, 2 + hash(i) * 4); } g.restore(); }
// manga SFX lettering: bold condensed, skewed, white with a heavy ink outline (or inverted)
function sfx(g, s, x, y, size, rot = -0.08, o = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.transform(1, 0, -0.18, 1, 0, 0);
  g.font = `700 ${size}px ${COND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.16; g.strokeStyle = o.stroke || ELK.ink; g.strokeText(s, 0, 0);
  g.fillStyle = o.fill || ELK.paper; g.fillText(s, 0, 0); g.restore();
}
// an annotation callout: a line from the point to a small boxed label (manga margin note)
function callout(g, x, y, dx, dy, label, value, u, o = {}) {
  if (u <= 0) return; const a = cl(u * 3);
  g.save(); g.globalAlpha = a; g.strokeStyle = ELK.ink; g.lineWidth = 3; g.fillStyle = ELK.ink;
  g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
  const bx = x + dx, by = y + dy; g.beginPath(); g.moveTo(x, y); g.lineTo(bx, by); g.stroke();
  g.font = `600 22px ${SANS}`; const lw = g.measureText(label).width; g.font = `500 40px ${SERIF}`; const vw = g.measureText(value).width; const w = Math.max(lw + label.length * 2, vw) + 40, hh = 100;
  const lft = dx < 0 ? bx - w : bx; const top = by - hh / 2;
  g.fillStyle = ELK.paper; g.fillRect(lft, top, w, hh); g.lineWidth = 4; g.strokeRect(lft, top, w, hh);
  g.fillStyle = o.accent || ELK.ink; g.fillRect(lft, top, 8, hh);
  g.fillStyle = ELK.ink; g.textAlign = 'left'; g.font = `600 22px ${SANS}`; let cx = lft + 22; for (const ch of label) { g.fillText(ch, cx, top + 34); cx += g.measureText(ch).width + 2; }
  const n = Math.floor(cl((u - 0.15) * 2.5) * value.length); g.font = `500 40px ${SERIF}`; g.fillStyle = o.valCol || ELK.ink; g.fillText(value.slice(0, n), lft + 22, top + 80);
  g.restore();
}
// the round card: ROUND n over the question, brushed on paper; u = 0..1 of the shot
function roundCard(g, t, n, q, u, t0) {
  g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#ece6da'], [1, '#d8d1c3']]);
  focusLines(g, 960, 470, t, { n: 90, r0: 420, a: 0.35 });
  const k = eOut(cl((t - t0) / 0.35)), sh = 1 + 0.25 * (1 - k);
  g.save(); g.translate(960, 420); g.scale(sh, sh);
  // a heavy ink brush bar behind the numeral
  g.fillStyle = ELK.ink; g.beginPath(); g.moveTo(-520, -40); for (let i = 0; i <= 20; i++) g.lineTo(-520 + i * 52, -60 + noise(i * 0.9, n) * 14); for (let i = 20; i >= 0; i--) g.lineTo(-520 + i * 52, 70 + noise(i * 1.3, n + 3) * 16); g.closePath(); g.fill();
  g.font = `700 150px ${COND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ELK.paper; g.fillText(`ROUND ${n}`, 0, 8);
  g.restore();
  const qa = cl((t - t0 - 0.3) / 0.4); g.globalAlpha = qa; g.font = `500 76px ${SERIF}`; g.textAlign = 'center'; g.fillStyle = ELK.ink; g.fillText(q, 960, 650); g.globalAlpha = 1;
  // the two names under it
  g.font = `700 40px ${COND}`; g.fillStyle = ELK.red; g.fillText('LIGHT', 760, 760); g.fillStyle = ELK.ink; g.fillText('VS', 960, 760); g.fillStyle = ELK.green; g.fillText('EREN', 1160, 760);
}
// an ink stamp (hanko style): rotated box with a word, slammed in at t0
function stamp(g, t, t0, x, y, word, col, o = {}) {
  if (t < t0) return; const u = cl((t - t0) / 0.18), s = lerp(2.2, 1, eIn(u)), a = cl(u * 2);
  g.save(); g.translate(x, y); g.rotate(o.rot ?? -0.12); g.scale(s, s); g.globalAlpha = a * 0.92;
  g.font = `700 ${o.size || 120}px ${COND}`; const w = g.measureText(word).width + 80, h = (o.size || 120) * 1.3;
  g.strokeStyle = col; g.lineWidth = 14; g.strokeRect(-w / 2, -h / 2, w, h); g.lineWidth = 5; g.strokeRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32);
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, 0, 6);
  // ink gaps: a few paper specks over the stamp
  g.fillStyle = ELK.paper; for (let i = 0; i < 40; i++) { g.globalAlpha = a * 0.7; g.fillRect((hash(i * 3 + 1) - 0.5) * w, (hash(i * 7 + 2) - 0.5) * h, 3 + hash(i) * 7, 2 + hash(i + 5) * 4); }
  if (o.sub) { g.globalAlpha = a; g.font = `600 30px ${SANS}`; g.fillStyle = col; g.fillText(o.sub, 0, h / 2 + 40); }
  g.restore();
}
// the scoreboard: four rounds, each AGREE / CLASH; res: ['agree', 'agree*', 'clash', 'clash'] (null = not yet)
function scoreboard(g, t, res, x, y, s, hl = -1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  shadowOn(g, 30, 'rgba(0,0,0,0.4)', 8); g.fillStyle = ELK.paper; g.fillRect(-460, -290, 920, 580); shadowOff(g);
  g.strokeStyle = ELK.ink; g.lineWidth = 6; g.strokeRect(-460, -290, 920, 580);
  g.font = `700 44px ${COND}`; g.textAlign = 'center'; g.fillStyle = ELK.red; g.fillText('LIGHT', -150, -215); g.fillStyle = ELK.ink; g.fillText('×', 0, -215); g.fillStyle = ELK.green; g.fillText('EREN', 150, -215);
  const Q = ["What's wrong with the world?", 'How many would you kill?', 'What does the new world look like?', 'How does your story end?'];
  for (let i = 0; i < 4; i++) {
    const yy = -130 + i * 110; g.globalAlpha = hl >= 0 && hl !== i ? 0.45 : 1;
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-430, yy - 50); g.lineTo(430, yy - 50); g.stroke();
    g.font = `700 30px ${COND}`; g.fillStyle = ELK.ink; g.textAlign = 'left'; g.fillText(`${i + 1}`, -420, yy + 10);
    g.font = `500 32px ${SERIF}`; g.fillText(Q[i], -380, yy + 10);
    const r = res[i]; if (r) { const ag = r.startsWith('agree'); g.font = `700 36px ${COND}`; g.textAlign = 'right'; g.fillStyle = ag ? ELK.ink : ELK.red; g.fillText(ag ? (r.endsWith('*') ? 'AGREE*' : 'AGREE') : 'CLASH', 420, yy + 12); }
    g.globalAlpha = 1;
  }
  g.restore();
}
// big numerals (the countdown): drawn after the shader in the HUD, crisp
function bigCount(g, n, x, y, size, col, a = 1) { g.save(); g.globalAlpha = a; g.font = `700 ${size}px ${COND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = size * 0.08; g.strokeStyle = '#000'; g.strokeText(String(n).padStart(2, '0'), x, y); g.fillStyle = col; g.fillText(String(n).padStart(2, '0'), x, y); g.restore(); }

/* ---------- visions ---------- */
function throne(g, x, y, s, col = '#c9a04a') {
  g.save(); g.translate(x, y); g.scale(s, s);
  box(g, -120, -420, 240, 300, shade(col, -0.1), { r: 12 }); g.fillStyle = shade(col, 0.2); g.beginPath(); g.moveTo(-120, -420); g.lineTo(-80, -500); g.lineTo(0, -440); g.lineTo(80, -500); g.lineTo(120, -420); g.closePath(); g.fill();
  box(g, -160, -140, 320, 60, col, { r: 8 }); box(g, -150, -90, 40, 90, shade(col, -0.2), { r: 4 }); box(g, 110, -90, 40, 90, shade(col, -0.2), { r: 4 });
  g.strokeStyle = ELK.ink; g.lineWidth = 6; g.strokeRect(-120, -420, 240, 300); g.restore();
}
function birdcage(g, x, y, w, h) {
  g.strokeStyle = '#e8dcc0'; g.lineWidth = 8; for (let k = 0; k <= 12; k++) { const xx = x - w / 2 + (w * k) / 12; g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y - h + Math.abs(xx - x) * Math.abs(xx - x) / (w * 0.5) * 0.4); g.stroke(); }
  g.beginPath(); g.ellipse(x, y - h + 10, w / 2, 40, 0, Math.PI, 0); g.stroke(); g.lineWidth = 16; g.beginPath(); g.moveTo(x - w / 2 - 20, y); g.lineTo(x + w / 2 + 20, y); g.stroke();
  g.beginPath(); g.moveTo(x, y - h - 30); g.lineTo(x, y - h - 120); g.stroke(); g.beginPath(); g.arc(x, y - h - 140, 22, 0, Math.PI * 2); g.stroke();
}
// a crowd of small silhouettes (heads down when `bow`)
function crowd(g, t, x0, x1, y, h, n, seed, o = {}) {
  for (let i = 0; i < n; i++) { const r = hash(seed + i * 7); const x = lerp(x0, x1, (i + r * 0.8) / n), hh = h * (0.85 + hash(seed + i) * 0.3);
    drawFig(g, { x, y: y + (hash(seed * 3 + i) - 0.5) * h * 0.08, h: hh, f: o.f ?? (r > 0.5 ? 1 : -1), who: 'extra', sil: 1, ld: o.ld ?? 1, shadow: false, t: t + i,
      p: o.walk ? walkP(t + i * 0.37, 4) : pose(o.bow ? POSES.headDown : POSES.relaxed), open: o.bow ? 0.3 : 1, look: { ly: o.bow ? 1 : 0 } }); }
}

// a stylised hand seen from the side, pointing +x, with a suit sleeve and shirt cuff (Light)
function mangaHand(g, x, y, s, rot = 0, curl = 0.2) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  const lw = 4 / s, ink = '#121015', skin = '#f6e8da', dk = '#d9bfae';
  const sleeve = () => { g.beginPath(); g.moveTo(-1.6, -0.34); g.lineTo(-0.16, -0.3); g.lineTo(-0.12, 0.3); g.lineTo(-1.6, 0.36); g.closePath(); };
  sleeve(); g.fillStyle = '#c4b498'; g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke();
  g.fillStyle = '#fbfaf6'; g.beginPath(); g.moveTo(-0.2, -0.28); g.lineTo(0.02, -0.25); g.lineTo(0.04, 0.25); g.lineTo(-0.16, 0.28); g.closePath(); g.fill(); g.stroke();
  const fingers = [[-0.17, 0.44, 0.08], [-0.05, 0.5, 0.15], [0.07, 0.47, 0.22], [0.18, 0.38, 0.3]];
  for (let i = fingers.length - 1; i >= 0; i--) { const [fy, len, bend] = fingers[i]; g.save(); g.translate(0.48, fy); g.rotate((bend + curl) * 0.6);
    g.beginPath(); g.moveTo(0, -0.055); g.quadraticCurveTo(len * 0.6, -0.07, len, -0.03); g.quadraticCurveTo(len + 0.05, 0.0, len, 0.035); g.quadraticCurveTo(len * 0.6, 0.06, 0, 0.055); g.closePath();
    g.fillStyle = i % 2 ? skin : '#f1e2d3'; g.fill(); g.strokeStyle = ink; g.lineWidth = lw * 0.8; g.stroke(); g.restore(); }
  g.beginPath(); g.moveTo(0.02, -0.24); g.quadraticCurveTo(0.3, -0.28, 0.52, -0.22); g.lineTo(0.54, 0.22); g.quadraticCurveTo(0.3, 0.3, 0.04, 0.24); g.closePath(); g.fillStyle = skin; g.fill();
  g.fillStyle = dk; g.beginPath(); g.moveTo(0.04, 0.1); g.quadraticCurveTo(0.3, 0.2, 0.54, 0.12); g.lineTo(0.54, 0.22); g.quadraticCurveTo(0.3, 0.3, 0.04, 0.24); g.closePath(); g.fill();
  g.strokeStyle = ink; g.lineWidth = lw; g.beginPath(); g.moveTo(0.02, -0.24); g.quadraticCurveTo(0.3, -0.28, 0.52, -0.22); g.moveTo(0.54, 0.22); g.quadraticCurveTo(0.3, 0.3, 0.04, 0.24); g.stroke();
  g.save(); g.translate(0.2, -0.22); g.rotate(-0.7 + curl * 0.4); g.beginPath(); g.moveTo(0, -0.06); g.quadraticCurveTo(0.22, -0.08, 0.34, -0.02); g.quadraticCurveTo(0.37, 0.03, 0.32, 0.05); g.quadraticCurveTo(0.2, 0.06, 0, 0.06); g.closePath(); g.fillStyle = skin; g.fill(); g.strokeStyle = ink; g.lineWidth = lw * 0.85; g.stroke(); g.restore();
  g.restore();
}

// a macro of a fountain-pen nib on paper, writing: the ink line trails behind the tip (tip at x, y)
function nibMacro(g, x, y, s, t, ang = -0.9) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); g.lineJoin = 'round';
  // the nib: a long pointed blade with a slit and a breather hole
  const N = () => { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(60, -40, 260, -70); g.lineTo(280, 70); g.quadraticCurveTo(60, 40, 0, 0); g.closePath(); };
  N(); g.fillStyle = '#d8d4cc'; g.fill(); g.save(); N(); g.clip(); g.fillStyle = '#8c8880'; g.fillRect(0, 0, 400, 100); g.fillStyle = '#ffffff'; g.fillRect(40, -40, 300, 12); g.restore();
  N(); g.strokeStyle = ELK.ink; g.lineWidth = 6; g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(4, 0); g.lineTo(170, 0); g.stroke(); g.fillStyle = ELK.ink; g.beginPath(); g.arc(180, 0, 12, 0, Math.PI * 2); g.fill();
  for (const yy of [-30, 30]) { g.lineWidth = 2; g.beginPath(); g.moveTo(200, yy * 0.8); g.quadraticCurveTo(230, yy, 270, yy * 1.4); g.stroke(); }
  // the barrel
  g.fillStyle = ELK.ink; g.beginPath(); g.moveTo(250, -80); g.lineTo(1400, -150); g.lineTo(1400, 150); g.lineTo(260, 80); g.closePath(); g.fill();
  g.fillStyle = '#c9b089'; g.fillRect(300, -88, 30, 176); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(340, -66, 900, 10);
  g.restore();
}
