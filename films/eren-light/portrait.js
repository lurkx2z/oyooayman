/* =====================================================================
   PORTRAIT — the close-up renderer. The full-body figures (figure.js) carry the wide shots; every close-up uses
   this bust instead: a bigger, hand-shaped 3/4 head with layered hair locks, detailed manga eyes, ear, jaw shadow,
   neck and shoulders in costume (Light: suit, white collar, red tie; Eren: dark shirt, green cloak and hood).
   All shapes are in head units (R = 1, facing +x) and mirrored for a figure facing left.
   portrait(g, who, x, y, R, o) — (x, y) is the head centre; o: { f, t, look {lx, ly}, open, brow, mouth, talk, blink,
   drama, glow, sil, ld (+1 light from the front, -1 from behind), tilt, turn, sweat, wet, wind, hand }
   ===================================================================== */
const PCAST = {
  light: { hair: '#c8b08e', hairDk: '#7c6650', iris: '#b0302c', irisDk: '#3a0d0b', top: '#c4b498', topDk: '#7e715c', shirt: '#fbfaf6', tie: '#d2232a' },
  eren: { hair: '#231914', hairDk: '#0c0807', iris: '#19c98c', irisDk: '#043a28', top: '#34332e', topDk: '#1c1b18', cloak: '#1c9c5c', cloakDk: '#0b4e2d', shirt: '#4a4840', clasp: '#c9b089' },
};
const PSKIN = '#f6e8da', PSKINDK = '#d9bfae';
// shape with a cel shadow cut by an offset copy of itself, then inked
function pCel(g, path, base, dark, ox, oy, lw, sil) {
  if (sil) { path(); g.fillStyle = FIGRIM; g.fill(); g.save(); path(); g.clip(); g.translate(-ox * 1.4, -oy * 1.4); path(); g.fillStyle = INKC; g.fill(); g.restore(); return; }
  path(); g.fillStyle = dark; g.fill();
  g.save(); path(); g.clip(); g.translate(ox, oy); path(); g.fillStyle = base; g.fill(); g.restore();
  path(); g.strokeStyle = INKC; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke();
}
// smooth closed curve through points; [x, y, 1] marks a sharp corner (lock tips)
function pBlob(g, pts) { blob(g, pts); }
function pHead(g) {
  g.beginPath(); g.moveTo(0.0, -1.1);
  g.bezierCurveTo(0.5, -1.1, 0.82, -0.82, 0.86, -0.36);       // forehead
  g.bezierCurveTo(0.88, -0.14, 0.84, -0.02, 0.86, 0.08);      // brow ridge to the eye notch
  g.bezierCurveTo(0.93, 0.2, 0.92, 0.3, 0.86, 0.42);          // cheekbone
  g.bezierCurveTo(0.8, 0.62, 0.66, 0.82, 0.48, 0.94);         // cheek to chin
  g.bezierCurveTo(0.4, 1.0, 0.3, 1.0, 0.22, 0.95);            // chin
  g.bezierCurveTo(0.0, 0.9, -0.26, 0.74, -0.4, 0.5);          // jaw
  g.bezierCurveTo(-0.5, 0.36, -0.62, 0.3, -0.7, 0.22);        // under the ear
  g.bezierCurveTo(-0.98, -0.02, -1.02, -0.5, -0.82, -0.82);   // back of the skull
  g.bezierCurveTo(-0.62, -1.04, -0.32, -1.1, 0.0, -1.1);
  g.closePath();
}
function pEar(g) { g.beginPath(); g.moveTo(-0.32, 0.02); g.bezierCurveTo(-0.42, -0.08, -0.6, -0.04, -0.58, 0.16); g.bezierCurveTo(-0.57, 0.32, -0.48, 0.42, -0.36, 0.42); g.bezierCurveTo(-0.31, 0.3, -0.3, 0.14, -0.32, 0.02); g.closePath(); }
// one eye in its own frame, outer corner toward +x
function pEye(g, w, hh0, near, o, C, LW, sil) {
  const open = (o.open ?? 1) * (o.blink ? 0.05 : 1), brow = o.brow ?? o.browDef ?? 0, lk = Object.assign({ lx: 0, ly: 0 }, o.look || {});
  const hh = hh0 * open, sx = near ? -1 : 1, glow = o.glow || 0;
  const P = () => { g.beginPath(); g.moveTo(-w / 2, 0.02); g.bezierCurveTo(-w * 0.2, -hh * 1.12, w * 0.3, -hh * 1.12, w / 2, -hh * 0.3); g.bezierCurveTo(w * 0.3, hh * 0.7, -w * 0.25, hh * 0.85, -w / 2, 0.02); g.closePath(); };
  if (sil) {
    if (hh > 0.02 && glow > 0) { g.save(); g.globalAlpha = Math.min(1, glow * 1.2); g.fillStyle = shade(C.iris, 0.35); g.beginPath(); g.moveTo(-w / 2, 0.0); g.bezierCurveTo(-w * 0.2, -hh * 0.75, w * 0.3, -hh * 0.75, w / 2 + 0.05, -hh * 0.3); g.bezierCurveTo(w * 0.3, -hh * 0.05, -w * 0.25, hh * 0.15, -w / 2, 0.0); g.closePath(); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-w * 0.02, -hh * 0.2, w * 0.1, hh * 0.18, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
    return;
  }
  if (hh > 0.02) {
    g.save(); P(); g.clip();
    if (brow < 0) { const k = -brow * 0.5, yc = -hh * 0.9; g.beginPath(); g.moveTo(-1, yc + k * 0.6); g.lineTo(1, yc - k * 0.2); g.lineTo(1, 2); g.lineTo(-1, 2); g.closePath(); g.clip(); }
    P(); g.fillStyle = glow > 0.5 && (o.drama || 0) > 0.5 ? '#3a2a30' : '#ffffff'; g.fill();
    const ix = -w * 0.02 + lk.lx * sx * w * 0.22, iy = hh * 0.02 + lk.ly * hh * 0.35, ir = (near ? 0.135 : 0.11), rx = ir * (near ? 0.9 : 0.62), ry = ir * 1.15;
    const gr = g.createLinearGradient(0, iy - ry, 0, iy + ry); gr.addColorStop(0, C.irisDk); gr.addColorStop(0.5, C.iris); gr.addColorStop(1, shade(C.iris, 0.45));
    g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy, rx, ry, 0, 0, Math.PI * 2); g.fill();
    // iris fibres
    g.strokeStyle = shade(C.irisDk, 0.1); g.lineWidth = LW * 0.35; g.globalAlpha = 0.7; g.beginPath();
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; g.moveTo(ix + Math.cos(a) * rx * 0.45, iy + Math.sin(a) * ry * 0.45); g.lineTo(ix + Math.cos(a) * rx * 0.9, iy + Math.sin(a) * ry * 0.9); } g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = C.irisDk; g.lineWidth = LW * 0.8; g.beginPath(); g.ellipse(ix, iy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#070506'; g.beginPath(); g.ellipse(ix, iy - ry * 0.05, rx * 0.4, ry * 0.42, 0, 0, Math.PI * 2); g.fill();
    // the lid's shadow on the eyeball
    g.fillStyle = 'rgba(30,20,30,0.28)'; g.beginPath(); g.ellipse(0, -hh * 1.0, w * 0.75, hh * 0.5, 0, 0, Math.PI * 2); g.fill();
    if (glow > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const gg = g.createRadialGradient(ix, iy, 0, ix, iy, rx * 1.6); gg.addColorStop(0, `rgba(255,255,255,${0.6 * glow})`); gg.addColorStop(0.5, C.iris); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = glow; g.fillStyle = gg; g.fillRect(ix - rx * 2, iy - ry * 2, rx * 4, ry * 4); g.restore(); g.globalAlpha = 1; }
    // catchlights
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix + sx * rx * 0.38, iy - ry * 0.42, rx * 0.3, ry * 0.24, -0.5 * sx, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(ix - sx * rx * 0.35, iy + ry * 0.45, rx * 0.12, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  const hk = Math.max(hh, 0.02);
  g.fillStyle = sil ? FIGRIM : INKC; g.strokeStyle = sil ? FIGRIM : INKC; g.lineCap = 'round';
  // upper lid: a heavy lash line thickening to the outer corner, with two flicks
  g.beginPath(); g.moveTo(-w / 2 - 0.01, 0.03); g.bezierCurveTo(-w * 0.2, -hk * 1.32 - 0.03, w * 0.32, -hk * 1.28 - 0.04, w / 2 + 0.06, -hk * 0.34 - 0.03);
  g.lineTo(w / 2 + 0.02, -hk * 0.22); g.bezierCurveTo(w * 0.3, -hk * 1.18, -w * 0.2, -hk * 1.22, -w / 2, 0.045); g.closePath(); g.fill();
  g.lineWidth = LW * 1.0; g.beginPath(); g.moveTo(w / 2 + 0.03, -hk * 0.32); g.quadraticCurveTo(w / 2 + 0.08, -hk * 0.38, w / 2 + 0.1, -hk * 0.5 - 0.02); g.stroke();
  if (hh > 0.02) { g.lineWidth = LW * 0.6; g.beginPath(); g.moveTo(w * 0.32, hh * 0.62); g.bezierCurveTo(w * 0.1, hh * 0.86, -w * 0.25, hh * 0.84, -w * 0.42, hh * 0.24); g.stroke(); }
  // the crease
  g.lineWidth = LW * 0.5; g.beginPath(); g.moveTo(w * 0.32, -hk * 1.5 - 0.05); g.bezierCurveTo(w * 0.1, -hk * 1.75 - 0.06, -w * 0.25, -hk * 1.6 - 0.05, -w * 0.42, -hk * 1.0 - 0.04); g.stroke();
}
// hair: Light's swept, layered cut; Eren's long hair, half tied up, with loose strands framing the face
const HAIR = {
  light: {
    back: null,
    front: [[-0.1, 0.62, 1], [-0.2, 0.3], [-0.32, 0.04], [-0.5, -0.04], [-0.62, 0.3, 1], [-0.72, 0.08], [-0.9, 0.48, 1], [-0.98, 0.18], [-1.16, 0.26, 1], [-1.12, -0.08], [-1.2, -0.5], [-1.04, -0.94], [-0.7, -1.28],
      [-0.2, -1.44], [0.3, -1.44], [0.78, -1.3], [1.1, -1.0], [1.26, -0.56], [1.28, -0.24],
      [1.12, 0.38, 1], [1.02, -0.06], [0.86, 0.3, 1], [0.76, -0.1], [0.6, 0.18, 1], [0.48, -0.2], [0.3, -0.02, 1], [0.2, -0.32], [0.04, -0.12, 1], [-0.04, -0.34], [-0.08, 0.1]],
    strands: [],
    notch: [0.0, -1.3, 0.5],
    shine: [[-0.66, -0.98, 0.1], [-0.38, -1.12, 0.13], [-0.06, -1.2, 0.12], [0.26, -1.18, 0.12], [0.56, -1.08, 0.1], [0.82, -0.9, 0.08]],
  },
  eren: {
    back: [[-0.4, -0.6], [-1.1, -0.5], [-1.2, 0.2], [-1.16, 0.9], [-1.0, 1.6, 1], [-0.86, 1.2], [-0.74, 1.75, 1], [-0.6, 1.1], [-0.42, 1.5, 1], [-0.36, 0.6]],
    bun: [-0.86, -0.92, 0.36, 0.3],
    front: [[-0.22, 0.95, 1], [-0.3, 0.4], [-0.4, 0.12], [-0.6, 0.04], [-0.64, 0.42], [-0.74, 0.8, 1], [-0.9, 0.46], [-1.04, -0.2], [-1.06, -0.62], [-0.86, -1.02], [-0.4, -1.28], [0.2, -1.32], [0.74, -1.12], [1.06, -0.74], [1.16, -0.2], [1.12, 0.4],
      [1.04, 0.92, 1], [0.96, 0.4], [0.9, -0.1], [0.76, -0.4], [0.64, -0.26, 1], [0.54, -0.5], [0.38, -0.54], [0.22, -0.42], [0.1, -0.14], [0.02, 0.3], [-0.06, 0.72, 1], [-0.12, 0.22]],
    strands: [[0.36, -1.2, 1.0, 0.7], [0.5, -1.1, 1.08, 0.2], [0.3, -1.2, 0.62, -0.3], [0.2, -1.2, -0.04, 0.6], [0.0, -1.2, -0.2, 0.8], [-0.5, -1.1, -0.7, 0.05], [-0.2, -1.2, -0.5, 0.1]],
    shine: [[-0.5, -1.0, 0.12], [-0.22, -1.12, 0.14], [0.1, -1.14, 0.13], [0.42, -1.04, 0.12], [0.7, -0.86, 0.09]],
  },
};
function pHair(g, who, part, C, LW, sil, t, wind) {
  const H = HAIR[who], sw = Math.sin((t || 0) * 2.1) * 0.03 * (wind ?? 0.3);
  const ox = 0.1, oy = -0.08;
  if (part === 'back') {
    if (H.back) { const P = () => pBlob(g, H.back.map((p) => [p[0] + (p[1] > 0.8 ? sw * p[1] : 0), p[1], p[2]])); pCel(g, P, C.hair, C.hairDk, ox, oy, LW, sil);
      if (!sil) { g.save(); P(); g.clip(); g.strokeStyle = shade(C.hairDk, 0.25); g.lineWidth = LW * 0.6; g.beginPath(); for (const [x0, x1] of [[-1.0, -0.9], [-0.8, -0.7], [-0.6, -0.5]]) { g.moveTo(x0, -0.3); g.quadraticCurveTo(x0 - 0.1, 0.6, x1, 1.6); } g.stroke(); g.restore(); } }
    if (H.bun) { const [bx, by, rx, ry] = H.bun; const P = () => { g.beginPath(); g.ellipse(bx, by, rx, ry, -0.5, 0, Math.PI * 2); }; pCel(g, P, C.hair, C.hairDk, ox, oy, LW, sil);
      if (!sil) { g.strokeStyle = shade(C.hair, 0.5); g.lineWidth = LW * 0.5; g.beginPath(); g.arc(bx, by, rx * 0.6, -2.4, -0.6); g.stroke(); g.fillStyle = '#d8cfbd'; g.save(); g.translate(bx + 0.24, by + 0.2); g.rotate(-0.6); g.fillRect(-0.03, -0.12, 0.06, 0.24); g.restore(); } }
    return;
  }
  if (H.locks) {
    const cap = () => pBlob(g, H.cap);
    pCel(g, cap, C.hair, C.hairDk, ox, oy, LW, sil);
    const lock = (L) => { const [rx, ry, tx, ty, w, bend] = L, dx = tx - rx, dy = ty - ry, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, sw2 = ty > 0 ? sw * 2 : 0;
      return () => { g.beginPath(); g.moveTo(rx + nx * w / 2, ry + ny * w / 2); g.quadraticCurveTo(rx + dx * 0.55 + nx * (w * 0.4 + bend), ry + dy * 0.55 + ny * (w * 0.4 + bend), tx + sw2, ty);
        g.quadraticCurveTo(rx + dx * 0.5 - nx * (w * 0.3 - bend), ry + dy * 0.5 - ny * (w * 0.3 - bend), rx - nx * w / 2, ry - ny * w / 2); g.closePath(); }; };
    for (const L of H.locks) pCel(g, lock(L), C.hair, C.hairDk, ox * 0.6, oy * 0.6, LW, sil);
    if (!sil) { g.save(); cap(); g.clip(); g.fillStyle = 'rgba(255,255,255,0.92)';
      for (const [x, y, l] of H.shine) { const a2 = Math.atan2(y + 0.1, x) + Math.PI / 2; g.save(); g.translate(x, y); g.rotate(a2 + Math.PI / 2 - 0.15); g.beginPath(); g.moveTo(-l * 0.1, -l); g.quadraticCurveTo(l * 0.18, 0, 0, l); g.quadraticCurveTo(-l * 0.02, 0, -l * 0.1, -l); g.fill(); g.restore(); }
      g.restore(); }
    return;
  }
  const P = () => pBlob(g, H.front.map((p) => [p[0] + (p[2] && p[1] > 0.3 ? sw * 2 : 0), p[1], p[2]]));
  pCel(g, P, C.hair, C.hairDk, ox, oy, LW, sil);
  g.save(); P(); g.clip();
  if (!sil) {
    g.strokeStyle = who === 'eren' ? 'rgba(255,255,255,0.18)' : shade(C.hairDk, -0.1); g.lineWidth = LW * 0.55; g.lineCap = 'round'; g.beginPath();
    for (const [x0, y0, x1, y1] of H.strands) { g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 0.14, (y0 + y1) / 2 - 0.1, x1, y1); } g.stroke();
  }
  if (!sil && who === 'eren') {   // a darker tone below a zigzag edge that runs along the shine
    g.fillStyle = who === 'eren' ? 'rgba(0,0,0,0.5)' : shade(C.hair, -0.16); g.beginPath();
    const S = H.shine; g.moveTo(S[0][0] - 0.6, S[0][1] + 0.2);
    S.forEach(([x, y], i) => { const n = S[i + 1] || [x + 0.3, y + 0.15]; g.lineTo(x, y + 0.2); g.lineTo((x + n[0]) / 2, (y + n[1]) / 2 + 0.42); });
    g.lineTo(2, 0.0); g.lineTo(2, 2); g.lineTo(-2, 2); g.lineTo(-2, S[0][1] + 0.4); g.closePath(); g.fill();
  }
  if (H.notch && !sil) {   // lock separations: a tapered ink line runs up from each notch between two lock tips
    const [cx, cy, k] = H.notch, F = H.front; g.fillStyle = INKC;
    F.forEach((p, i) => { const a2 = F[(i + F.length - 1) % F.length], b2 = F[(i + 1) % F.length]; if (p[2] || !a2[2] || !b2[2]) return;
      const ex = p[0] + (cx - p[0]) * k, ey = p[1] + (cy - p[1]) * k, dx = ex - p[0], dy = ey - p[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, w = LW * 1.6;
      g.beginPath(); g.moveTo(p[0] + nx * w, p[1] + ny * w); g.quadraticCurveTo((p[0] + ex) / 2 + nx * 0.06, (p[1] + ey) / 2 + ny * 0.06, ex, ey); g.quadraticCurveTo((p[0] + ex) / 2 + nx * 0.04, (p[1] + ey) / 2 + ny * 0.04, p[0] - nx * w, p[1] - ny * w); g.closePath(); g.fill(); });
  }
  // the shine: a broken band of tapered slivers that follow the locks
  g.fillStyle = sil ? 'rgba(246,241,230,0.4)' : 'rgba(255,255,255,0.92)';
  for (const [x, y, l] of H.shine) { const a = Math.atan2(y + 0.1, x) + Math.PI / 2; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2 - 0.15); g.beginPath(); g.moveTo(-l * 0.1, -l); g.quadraticCurveTo(l * 0.18, 0, 0, l); g.quadraticCurveTo(-l * 0.02, 0, -l * 0.1, -l); g.fill(); g.restore(); }
  g.restore();
}
function pBody(g, who, C, LW, sil, t, o) {
  const ox = 0.16 * (o.ld ?? 1), oy = -0.06, br = Math.sin((t || 0) * 2.0) * 0.012;
  // neck with a hard jaw shadow
  const neck = () => { g.beginPath(); g.moveTo(-0.36, 0.4); g.bezierCurveTo(-0.34, 0.9, -0.42, 1.3, -0.62, 1.62); g.lineTo(0.5, 1.7); g.bezierCurveTo(0.3, 1.3, 0.26, 0.95, 0.3, 0.7); g.closePath(); };
  pCel(g, neck, PSKIN, PSKINDK, ox * 0.5, oy, LW, sil);
  if (!sil) { g.save(); neck(); g.clip(); g.translate(0.02, 0.2); pHead(g); g.fillStyle = '#b39484'; g.fill(); g.restore(); }
  if (who === 'light') {
    // jacket
    const jk = () => { g.beginPath(); g.moveTo(-0.7, 1.5 + br); g.bezierCurveTo(-1.6, 1.62, -2.3, 1.9, -2.6, 2.6); g.lineTo(-2.9, 4.6); g.lineTo(2.6, 4.6); g.lineTo(2.4, 2.6); g.bezierCurveTo(2.2, 2.0, 1.4, 1.72, 0.66, 1.62 + br); g.closePath(); };
    pCel(g, jk, C.top, C.topDk, ox, oy, LW, sil);
    if (sil) return;
    // shirt V, collar points, tie
    g.fillStyle = C.shirt; g.beginPath(); g.moveTo(-0.6, 1.52); g.lineTo(0.62, 1.6); g.lineTo(0.16, 3.4); g.closePath(); g.fill(); g.strokeStyle = INKC; g.lineWidth = LW; g.stroke();
    const col = (s) => { g.beginPath(); g.moveTo(s < 0 ? -0.52 : 0.54, 1.38); g.lineTo(s < 0 ? -0.62 : 0.66, 1.66); g.lineTo(s < 0 ? -0.18 : 0.5, 2.08); g.lineTo(0.12, 1.66); g.closePath(); };
    for (const s of [-1, 1]) { col(s); g.fillStyle = C.shirt; g.fill(); g.lineWidth = LW * 0.9; g.stroke(); }
    g.fillStyle = C.tie; g.beginPath(); g.moveTo(-0.02, 1.62); g.lineTo(0.28, 1.64); g.lineTo(0.22, 1.86); g.lineTo(0.04, 1.86); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(0.04, 1.86); g.lineTo(0.22, 1.86); g.lineTo(0.36, 3.5); g.lineTo(0.14, 3.75); g.lineTo(-0.04, 3.45); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(0.13, 1.86); g.lineTo(0.22, 1.86); g.lineTo(0.36, 3.5); g.lineTo(0.25, 3.62); g.closePath(); g.fill();
    // lapels
    g.strokeStyle = INKC; g.lineWidth = LW * 1.1; g.fillStyle = shade(C.top, -0.06);
    for (const [a, b, c] of [[[-0.66, 1.52], [-1.1, 2.4], [0.0, 3.7]], [[0.66, 1.62], [1.05, 2.5], [0.3, 3.9]]]) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.stroke(); }
    g.beginPath(); g.moveTo(-1.1, 2.4); g.lineTo(-0.9, 2.2); g.moveTo(1.05, 2.5); g.lineTo(0.86, 2.3); g.stroke();
    // a seam and a fold on the shoulder
    g.lineWidth = LW * 0.6; g.beginPath(); g.moveTo(-1.7, 1.8); g.quadraticCurveTo(-1.9, 2.6, -1.8, 3.4); g.moveTo(1.6, 1.86); g.quadraticCurveTo(1.8, 2.6, 1.7, 3.3); g.stroke();
  } else {
    // dark shirt with a high collar
    const sh = () => { g.beginPath(); g.moveTo(-0.6, 1.36 + br); g.bezierCurveTo(-1.4, 1.5, -2.2, 1.8, -2.5, 2.6); g.lineTo(-2.8, 4.6); g.lineTo(2.6, 4.6); g.lineTo(2.3, 2.6); g.bezierCurveTo(2.1, 1.9, 1.3, 1.6, 0.56, 1.5 + br); g.closePath(); };
    pCel(g, sh, C.top, C.topDk, ox, oy, LW, sil);
    if (!sil) { g.fillStyle = C.shirt; g.beginPath(); g.moveTo(-0.52, 1.24); g.lineTo(0.48, 1.36); g.lineTo(0.5, 1.62); g.lineTo(-0.56, 1.5); g.closePath(); g.fill(); g.strokeStyle = INKC; g.lineWidth = LW; g.stroke(); }
    // the cloak draped over the shoulders, open at the chest, the hood gathered low behind the neck, a clasp
    const wv = Math.sin((t || 0) * 2.4) * 0.05 * (o.wind ?? 0.3);
    const ck = () => { g.beginPath(); g.moveTo(-0.5, 1.3); g.bezierCurveTo(-1.2, 1.4, -1.9, 1.62, -2.3, 2.1); g.bezierCurveTo(-2.6, 2.6, -2.7 + wv, 3.6, -2.9 + wv, 4.6); g.lineTo(-0.8, 4.6);
      g.bezierCurveTo(-0.6, 3.6, -0.45, 2.6, -0.32, 1.86); g.lineTo(0.52, 1.92); g.bezierCurveTo(0.7, 2.7, 0.9, 3.6, 1.0, 4.6); g.lineTo(2.7 - wv, 4.6); g.bezierCurveTo(2.6 - wv, 3.4, 2.4, 2.4, 2.1, 2.0);
      g.bezierCurveTo(1.7, 1.6, 1.1, 1.44, 0.5, 1.42); g.bezierCurveTo(0.3, 1.62, -0.3, 1.56, -0.5, 1.3); g.closePath(); };
    pCel(g, ck, C.cloak, C.cloakDk, ox, oy, LW, sil);
    if (!sil) { g.save(); ck(); g.clip(); g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = LW * 0.7; g.beginPath();
      for (const [x0, x1] of [[-1.5, -1.8], [-1.0, -1.3], [1.3, 1.6], [1.8, 2.1]]) { g.moveTo(x0, 2.0); g.quadraticCurveTo((x0 + x1) / 2 + 0.1, 3.0, x1 + wv, 4.6); } g.stroke();
      // the turned-back front edges
      g.fillStyle = C.cloakDk; g.beginPath(); g.moveTo(-0.32, 1.86); g.bezierCurveTo(-0.45, 2.6, -0.6, 3.6, -0.8, 4.6); g.lineTo(-0.6, 4.6); g.bezierCurveTo(-0.36, 3.6, -0.22, 2.6, -0.16, 1.88); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(0.52, 1.92); g.bezierCurveTo(0.7, 2.7, 0.9, 3.6, 1.0, 4.6); g.lineTo(1.2, 4.6); g.bezierCurveTo(1.05, 3.6, 0.85, 2.7, 0.7, 1.9); g.closePath(); g.fill(); g.restore(); }
    const hood = () => { g.beginPath(); g.moveTo(-0.2, 1.36); g.bezierCurveTo(-0.5, 1.02, -1.3, 1.1, -1.62, 1.66); g.bezierCurveTo(-1.3, 1.62, -0.9, 1.56, -0.6, 1.6); g.bezierCurveTo(-0.4, 1.56, -0.26, 1.48, -0.2, 1.36); g.closePath(); };
    pCel(g, hood, shade(C.cloak, -0.08), C.cloakDk, ox * 0.5, oy, LW, sil);
    if (!sil) { g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = LW * 0.6; g.beginPath(); g.moveTo(-0.5, 1.24); g.quadraticCurveTo(-0.9, 1.3, -1.2, 1.56); g.moveTo(-0.7, 1.16); g.quadraticCurveTo(-1.1, 1.24, -1.4, 1.52); g.stroke(); }
    if (!sil) { g.fillStyle = C.clasp; g.beginPath(); g.arc(0.12, 1.9, 0.09, 0, Math.PI * 2); g.fill(); g.strokeStyle = INKC; g.lineWidth = LW * 0.8; g.stroke(); }
  }
}
function pFace(g, who, o, C, LW, sil) {
  const narrow = who === 'light' ? 0.72 : 0.74, ey = 0.12;
  const eyes = [[0.31, ey, 0.38, 0.22 * narrow, true], [0.75, ey - 0.01, 0.17, 0.2 * narrow, false]];
  for (const [ex, eyy, w, hh, near] of eyes) { g.save(); g.translate(ex, eyy); g.scale(near ? -1 : 1, 1); pEye(g, w, hh, near, o, C, LW, sil); g.restore(); }
  if (sil) {
    const tk = o.talk || 0; if (tk > 0.05) { g.fillStyle = FIGRIM; g.beginPath(); g.ellipse(0.6, 0.66, 0.07, 0.01 + tk * 0.05, 0, 0, Math.PI * 2); g.fill(); }
    return;
  }
  g.strokeStyle = INKC; g.lineCap = 'round';
  // nose: a hooked tip on the front contour and a soft shadow wedge
  g.fillStyle = 'rgba(120,80,70,0.25)'; g.beginPath(); g.moveTo(0.82, 0.12); g.lineTo(0.9, 0.38); g.lineTo(0.8, 0.4); g.closePath(); g.fill();
  g.lineWidth = LW * 0.9; g.beginPath(); g.moveTo(0.9, 0.3); g.quadraticCurveTo(0.98, 0.39, 0.88, 0.43); g.stroke();
  // under-eye line (Eren is tired)
  if (who === 'eren') { g.lineWidth = LW * 0.45; g.beginPath(); g.moveTo(0.14, ey + 0.22); g.quadraticCurveTo(0.3, ey + 0.29, 0.48, ey + 0.21); g.stroke(); }
  // mouth
  const mx = 0.6, my = 0.67, tk = o.talk || 0, m = o.mouth || 'flat';
  g.lineWidth = LW * 1.0; g.fillStyle = '#3a1416';
  if (tk > 0.05) { g.beginPath(); g.moveTo(mx - 0.1, my); g.quadraticCurveTo(mx, my - 0.025, mx + 0.11, my - 0.01); g.quadraticCurveTo(mx + 0.02, my + 0.03 + tk * 0.13, mx - 0.1, my); g.closePath(); g.fill(); g.stroke();
    if (tk > 0.45) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(mx - 0.08, my - 0.003); g.quadraticCurveTo(mx, my - 0.02, mx + 0.09, my - 0.008); g.lineTo(mx + 0.08, my + 0.012); g.lineTo(mx - 0.07, my + 0.012); g.closePath(); g.fill(); } }
  else if (m === 'smirk') { g.beginPath(); g.moveTo(mx - 0.1, my + 0.01); g.quadraticCurveTo(mx + 0.04, my + 0.035, mx + 0.14, my - 0.06); g.stroke(); g.lineWidth = LW * 0.5; g.beginPath(); g.moveTo(mx + 0.13, my - 0.09); g.lineTo(mx + 0.16, my - 0.03); g.stroke(); }
  else if (m === 'smile') { g.beginPath(); g.moveTo(mx - 0.12, my - 0.02); g.quadraticCurveTo(mx, my + 0.06, mx + 0.13, my - 0.03); g.stroke(); }
  else if (m === 'frown') { g.beginPath(); g.moveTo(mx - 0.1, my + 0.03); g.quadraticCurveTo(mx, my - 0.03, mx + 0.11, my + 0.03); g.stroke(); }
  else if (m === 'grit') { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(mx - 0.12, my - 0.02); g.lineTo(mx + 0.12, my - 0.03); g.lineTo(mx + 0.1, my + 0.04); g.lineTo(mx - 0.1, my + 0.04); g.closePath(); g.fill(); g.stroke(); g.lineWidth = LW * 0.5; g.beginPath(); g.moveTo(mx - 0.11, my + 0.008); g.lineTo(mx + 0.11, my + 0.002); g.stroke(); }
  else if (m === 'open') { g.fillStyle = '#5a1a1c'; g.beginPath(); g.moveTo(mx - 0.07, my); g.quadraticCurveTo(mx, my - 0.03, mx + 0.08, my - 0.01); g.quadraticCurveTo(mx + 0.05, my + 0.13, mx - 0.01, my + 0.12); g.quadraticCurveTo(mx - 0.07, my + 0.08, mx - 0.07, my); g.closePath(); g.fill(); g.stroke(); }
  else { g.beginPath(); g.moveTo(mx - 0.09, my); g.lineTo(mx + 0.1, my - 0.006); g.stroke(); }
  g.lineWidth = LW * 0.4; g.beginPath(); g.moveTo(mx - 0.04, my + 0.11); g.lineTo(mx + 0.05, my + 0.105); g.stroke();   // lower lip hint
  if (o.sweat) { g.fillStyle = 'rgba(225,242,255,0.95)'; const sx = -0.02, sy = -0.3 + (o.sweat % 1) * 0.55; g.beginPath(); g.moveTo(sx, sy - 0.13); g.quadraticCurveTo(sx + 0.08, sy, sx, sy + 0.05); g.quadraticCurveTo(sx - 0.08, sy, sx, sy - 0.13); g.fill(); g.strokeStyle = INKC; g.lineWidth = LW * 0.6; g.stroke(); }
}
function pBrows(g, who, o, LW, sil) {
  if (sil) return;
  const brow = o.brow ?? (who === 'eren' ? -0.6 : -0.15);
  g.fillStyle = INKC;
  for (const [bx, by, bw, near] of [[0.31, 0.12, 0.42, true], [0.76, 0.11, 0.2, false]]) {
    g.save(); g.translate(bx, by); g.scale(near ? -1 : 1, 1);
    const yi = -0.31 - brow * 0.13, yo = -0.31 + brow * 0.03, ym = -0.4 - (brow > 0 ? brow * 0.04 : 0);
    g.beginPath(); g.moveTo(-bw * 0.5, yi); g.quadraticCurveTo(bw * 0.05, ym - 0.035, bw * 0.55, yo); g.quadraticCurveTo(bw * 0.05, ym + 0.02, -bw * 0.5, yi + 0.022); g.closePath(); g.fill();
    g.restore();
  }
  if ((o.brow ?? 0) < -0.4) { g.strokeStyle = INKC; g.lineWidth = LW * 0.4; g.beginPath(); g.moveTo(0.52, -0.18); g.lineTo(0.56, -0.1); g.moveTo(0.58, -0.2); g.lineTo(0.61, -0.13); g.stroke(); }
}
function portrait(g, who, x, y, R, o = {}) {
  const C = PCAST[who], f = o.f ?? (who === 'eren' ? -1 : 1), sil = !!o.sil, t = o.t ?? 0;
  const lw = Math.min(7, Math.max(2, R * 0.016)), LW = lw / R;
  const op = Object.assign({ browDef: who === 'eren' ? -0.6 : -0.15, blink: blinkAt(t, who === 'eren' ? 5 : 2), talk: talkAt(t, who === 'eren' ? 'e' : 'l') }, o);
  if (o.talk === 0) op.talk = 0;
  g.save(); g.translate(x, y); g.rotate((o.tilt || 0) * f); g.scale(f * R, R);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const bob = Math.sin(t * 1.7) * 0.01;
  pHair(g, who, 'back', C, LW, sil, t, o.wind);
  g.save(); g.rotate(-(o.tilt || 0) * 0.4); g.translate(0, -0.1); pBody(g, who, C, LW, sil, t, op); g.restore();
  g.translate(0, bob);
  const ld = o.ld ?? 1, hx = 0.1 * ld, hy = -0.04;
  pCel(g, () => pHead(g), PSKIN, PSKINDK, hx, hy, LW, sil);
  if (!sil) {
    pCel(g, () => pEar(g), PSKIN, PSKINDK, 0.05, 0, LW * 0.9, false);
    g.strokeStyle = INKC; g.lineWidth = LW * 0.5; g.beginPath(); g.moveTo(-0.38, 0.06); g.quadraticCurveTo(-0.52, 0.06, -0.5, 0.22); g.stroke();
    // a hard manga shadow over the far side of the face
    if (o.drama > 0) { g.save(); pHead(g); g.clip(); g.globalAlpha = o.drama; g.fillStyle = '#16131a'; g.beginPath();
      const B = [[0.46, -1.3], [0.36, -0.3], [0.54, 0.12], [0.4, 0.5], [0.52, 1.2]], far = ld > 0 ? -3 : 3;
      g.moveTo(far, -1.3); for (const q of B) g.lineTo(q[0], q[1]); g.lineTo(far, 1.3); g.closePath(); g.fill(); g.restore(); }
  }
  pFace(g, who, op, C, LW, sil);
  pHair(g, who, 'front', C, LW, sil, t, o.wind);
  pBrows(g, who, op, LW, sil);
  if (o.glow > 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (const [ex, ey, r] of [[0.31, 0.12, 0.7], [0.75, 0.11, 0.45]]) { const gr = g.createRadialGradient(ex, ey, 0, ex, ey, r); gr.addColorStop(0, who === 'light' ? `rgba(255,40,48,${0.9 * o.glow})` : `rgba(60,255,160,${0.9 * o.glow})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(ex - r, ey - r, 2 * r, 2 * r); } g.restore(); }
  if (o.wet && !sil) { g.strokeStyle = 'rgba(235,245,255,0.85)'; g.lineWidth = LW * 0.9; for (let k = 0; k < 4; k++) { const ph = (t * 0.9 + k * 0.29) % 1; const xx = -0.2 + k * 0.32, yy = 0.2 + ph * 1.2; g.globalAlpha = 1 - ph; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 0.06); g.stroke(); } g.globalAlpha = 1; }
  g.restore();
}
// an extreme close-up of the eyes in a letterbox strip (the manga "eye panel")
function eyeStrip(g, who, x, y, R, o = {}) { portrait(g, who, x, y, R, Object.assign({ talk: 0 }, o)); }
