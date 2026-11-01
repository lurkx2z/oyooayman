/* =====================================================================
   RIG — our stickmen: round ink heads with big white eyes, a coloured hoodie as the one colour mark per character
   (you: teal; your sister: yellow, ponytail), thick round limbs, white sneakers. Poses are joint angles (radians):
   arms and legs measured from straight down, + = toward the way the figure faces. Pure drawing, no state.
   ===================================================================== */

const POSE0 = { lean: 0, tilt: 0, lSh: 0.08, lEl: 0.15, rSh: -0.06, rEl: 0.15, lHip: 0.04, lKn: 0.03, rHip: -0.04, rKn: 0.03, hipDrop: 0 };
function pose(o) { return Object.assign({}, POSE0, o); }
function mixPose(a, b, u) { const o = {}; for (const k in POSE0) o[k] = lerp(a[k] ?? POSE0[k], b[k] ?? POSE0[k], u); return o; }
// a pose track: [[t, pose], ...] blended with an ease over `bl` seconds after each key
function poseAt(track, t, bl = 0.35) {
  let i = 0; while (i + 1 < track.length && track[i + 1][0] <= t) i++;
  const [t0, p] = track[i]; if (i === 0) return pose(p);
  const prev = track[i - 1][1], b = track[i][2] ?? bl;
  return mixPose(pose(prev), pose(p), eIO((t - t0) / b));
}

const POSES = {
  stand: {},
  surprised: { lean: -0.06, lSh: 0.5, lEl: -1.2, rSh: -0.45, rEl: 1.2, tilt: -0.08 },
  armsUp: { lSh: 2.6, lEl: 0.1, rSh: 2.5, rEl: 0.15, lean: -0.05, tilt: -0.25 },
  crossed: { lSh: 0.55, lEl: 1.9, rSh: 0.45, rEl: 1.95, tilt: 0.05 },
  holdFront: { lSh: 0.7, lEl: 0.9, rSh: 0.6, rEl: 1.0 },
  crouchGrip: { lean: 0.55, lSh: 0.15, lEl: 0, rSh: 0.1, rEl: 0, lHip: 1.5, lKn: 1.9, rHip: 1.3, rKn: 1.7, tilt: -0.35 },
  rackPos: { lean: -0.04, lSh: 0.9, lEl: 2.5, rSh: 0.85, rEl: 2.5, lHip: 0.15, lKn: 0.2, rHip: -0.1, rKn: 0.15, tilt: -0.12 },
  overhead: { lean: -0.02, lSh: 3.0, lEl: 0.0, rSh: 2.95, rEl: 0.0, lHip: 0.35, lKn: 0.05, rHip: -0.45, rKn: 0.45, tilt: -0.2 },
  standBar: { lean: 0.15, lSh: 0.1, lEl: 0.1, rSh: 0.05, rEl: 0.1, tilt: 0.1 },
  run1: { lean: 0.35, lSh: -0.9, lEl: 1.6, rSh: 1.1, rEl: 1.5, lHip: 1.1, lKn: 1.0, rHip: -0.6, rKn: 1.6, tilt: 0.05 },
  run2: { lean: 0.35, lSh: 1.1, lEl: 1.5, rSh: -0.9, rEl: 1.6, lHip: -0.6, lKn: 1.6, rHip: 1.1, rKn: 1.0, tilt: 0.05 },
  catch: { lean: -0.15, lSh: 2.75, lEl: 0.35, rSh: 2.55, rEl: 0.45, lHip: 0.35, lKn: 0.5, rHip: -0.4, rKn: 0.3, hipDrop: 0.03, tilt: -0.5 },
  phone: { lSh: 0.5, lEl: 1.9, rSh: 0.4, rEl: 1.8, tilt: 0.35 },
  sitStool: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.5, lEl: 0.9, rSh: 0.45, rEl: 1.0, lean: 0.05 },
  sitCasts: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.55, lEl: 1.25, rSh: 0.5, rEl: 1.3, lean: 0.08, tilt: 0.1 },
  sitLean: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.2, lEl: 0.4, rSh: 0.1, rEl: 0.3, lean: -0.12, tilt: -0.35 },
  carefulHold: { lSh: 0.85, lEl: 0.75, rSh: 0.75, rEl: 0.85, tilt: 0.15, lean: 0.06 },
};

// draw a figure. o: { x, y (feet), h (height px), f (+1 faces right, -1 left), col: {hood, hoodDk, pants, hair?}, p: pose,
//   eyes: { open, wide, lx, ly }, brow (-1 angry … +1 worried), mouth ('flat'|'o'|'smile'|'grit'|'sad'|'open'), pony,
//   casts (white forearms), back (seen from behind: no face), rim (light side: +1 right / -1 left), sweat, blink }
function drawStick(g, o) {
  const h = o.h, f = o.f || 1, p = o.p || pose({}), C = o.col;
  const L = { torso: 0.3 * h, neck: 0.035 * h, r: 0.115 * h, ua: 0.175 * h, fa: 0.165 * h, th: 0.215 * h, sh: 0.215 * h };
  const dir = (a) => [Math.sin(a) * f, Math.cos(a)];
  // legs → hip height (the lower foot stands on y)
  const legs = [[p.lHip, p.lKn], [p.rHip, p.rKn]].map(([ha, ka]) => { const a = dir(ha), b = dir(ha - ka); return { a, b, d: a[1] * L.th + b[1] * L.sh }; });
  const hipY = o.y - Math.max(legs[0].d, legs[1].d) - 0.02 * h + p.hipDrop * h;
  const hip = [o.x, hipY];
  const sp = [Math.sin(p.lean) * f, -Math.cos(p.lean)];
  const neck = [hip[0] + sp[0] * L.torso, hip[1] + sp[1] * L.torso];
  const hd = [Math.sin(p.lean + p.tilt * 0.5) * f, -Math.cos(p.lean + p.tilt * 0.5)];
  const head = [neck[0] + hd[0] * (L.neck + L.r), neck[1] + hd[1] * (L.neck + L.r)];
  const nrm = [-sp[1], sp[0]];                           // across the body
  const sho = [neck[0] - sp[0] * 0.02 * h, neck[1] - sp[1] * 0.02 * h];
  const lw = 0.052 * h;
  g.lineCap = 'round'; g.lineJoin = 'round';
  const limb = (from, a1, l1, a2, l2, col, w, col2, w2) => {
    const d1 = dir(a1), e = [from[0] + d1[0] * l1, from[1] + d1[1] * l1];
    const d2 = dir(a2), q = [e[0] + d2[0] * l2, e[1] + d2[1] * l2];
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(from[0], from[1]); g.lineTo(e[0], e[1]); if (!col2) g.lineTo(q[0], q[1]); g.stroke();
    if (col2) { g.strokeStyle = col2; g.lineWidth = w2; g.beginPath(); g.moveTo(e[0], e[1]); g.lineTo(q[0], q[1]); g.stroke(); }
    return { e, q, d2 };
  };
  const shoe = (q, a) => { g.fillStyle = PAL.shoe; g.beginPath(); g.ellipse(q[0] + f * 0.025 * h, q[1] + 0.004 * h, 0.042 * h, 0.022 * h, 0, 0, Math.PI * 2); g.fill(); };
  const hand = (q, cast) => { g.fillStyle = cast ? '#f2efe8' : PAL.ink; g.beginPath(); g.arc(q[0], q[1], (cast ? 0.034 : 0.03) * h, 0, Math.PI * 2); g.fill(); };
  const arm = (a, e, back) => {
    const sleeve = back ? C.hoodDk : C.hood;
    if (o.casts) { const r = limb(sho, a, L.ua, a + e, L.fa, sleeve, lw * 1.05, back ? '#d9d4ca' : '#f4f1ea', lw * 1.55); hand(r.q, true); return r; }
    const r = limb(sho, a, L.ua, a + e, L.fa, sleeve, lw * 1.05); hand(r.q); return r;
  };
  // back limbs
  const lA = arm(p.lSh, p.lEl, true);
  const legL = limb([hip[0] - nrm[0] * 0.01 * h, hip[1]], p.lHip, L.th, p.lHip - p.lKn, L.sh, shade(C.pants, -0.25), lw * 1.15); shoe(legL.q);
  // torso: hoodie
  const hw = 0.075 * h, sw = 0.088 * h;
  g.fillStyle = C.hood;
  g.beginPath();
  g.moveTo(hip[0] - nrm[0] * hw, hip[1] - nrm[1] * hw + 0.02 * h); g.lineTo(hip[0] + nrm[0] * hw, hip[1] + nrm[1] * hw + 0.02 * h);
  g.lineTo(sho[0] + nrm[0] * sw, sho[1] + nrm[1] * sw); g.quadraticCurveTo(neck[0], neck[1] - 0.03 * h, sho[0] - nrm[0] * sw, sho[1] - nrm[1] * sw); g.closePath(); g.fill();
  // hood (behind the neck) and the pocket
  g.fillStyle = C.hoodDk; g.beginPath(); g.ellipse(neck[0] - f * 0.045 * h, neck[1] + 0.012 * h, 0.06 * h, 0.04 * h, -f * 0.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = C.hoodDk; g.lineWidth = 0.012 * h; g.beginPath(); const pk = [lerp(hip[0], neck[0], 0.3), lerp(hip[1], neck[1], 0.3)]; g.moveTo(pk[0] - 0.045 * h, pk[1]); g.lineTo(pk[0] + 0.045 * h, pk[1]); g.stroke();
  g.fillStyle = shade(C.pants, -0.05); g.beginPath(); g.ellipse(hip[0], hip[1] + 0.03 * h, hw * 0.95, 0.035 * h, 0, 0, Math.PI * 2); g.fill();
  const legR = limb([hip[0] + nrm[0] * 0.01 * h, hip[1]], p.rHip, L.th, p.rHip - p.rKn, L.sh, C.pants, lw * 1.15); shoe(legR.q);
  // head
  const R = L.r;
  if (o.pony) { g.fillStyle = C.hair || '#2a1a12'; g.beginPath(); g.ellipse(head[0] - f * R * 0.95, head[1] - R * 0.15, R * 0.3, R * 0.55, f * 0.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(head[0] - f * R * 0.7, head[1] - R * 0.55, R * 0.22, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = PAL.ink; g.beginPath(); g.arc(head[0], head[1], R, 0, Math.PI * 2); g.fill();
  if (o.rim) { g.strokeStyle = o.rimCol || PAL.inkRim; g.globalAlpha = 0.75; g.lineWidth = 0.012 * h; g.beginPath(); const a0 = o.rim > 0 ? -1.3 : Math.PI - 0.6, a1 = o.rim > 0 ? 0.6 : Math.PI + 1.3; g.arc(head[0], head[1], R - 0.006 * h, a0, a1); g.stroke(); g.globalAlpha = 1; }
  if (o.pony) { g.fillStyle = C.hair || '#2a1a12'; g.beginPath(); g.arc(head[0], head[1], R * 1.02, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill(); }
  if (!o.back) face(g, head, R, f, o, p);
  // front arm
  const rA = arm(p.rSh, p.rEl, false);
  return { head, R, neck, hip, lHand: lA.q, rHand: rA.q, lElbow: lA.e, rElbow: rA.e, h };
}

function face(g, c, R, f, o, p) {
  const E = Object.assign({ open: 1, wide: 0, lx: 0, ly: 0 }, o.eyes || {});
  const cx = c[0] + f * R * 0.3, cy = c[1] - R * 0.08;
  const open = E.open * (o.blink ? 0.12 : 1);
  for (const s of [-1, 1]) {
    const ex = cx + s * R * 0.3, ew = R * 0.19 * (1 + E.wide * 0.35), eh = R * 0.27 * open * (1 + E.wide * 0.35);
    g.fillStyle = '#fbf8f2'; g.beginPath(); g.ellipse(ex, cy, ew, Math.max(eh, R * 0.03), 0, 0, Math.PI * 2); g.fill();
    if (open > 0.25) { g.fillStyle = PAL.ink; const pr = R * (0.085 - E.wide * 0.02); g.beginPath(); g.arc(ex + (E.lx + f * 0.25) * ew * 0.5, cy + E.ly * eh * 0.45, pr, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + (E.lx + f * 0.25) * ew * 0.5 - pr * 0.35, cy + E.ly * eh * 0.45 - pr * 0.35, pr * 0.32, 0, Math.PI * 2); g.fill(); }
    // brow
    if (o.brow !== undefined) { const b = o.brow; g.strokeStyle = '#fbf8f2'; g.lineWidth = R * 0.07; g.beginPath(); const by = cy - R * 0.38 - E.wide * R * 0.06;
      g.moveTo(ex - R * 0.15, by + s * b * R * 0.07 * f * -1); g.lineTo(ex + R * 0.15, by - s * b * R * 0.07 * f * -1); g.stroke(); }
  }
  // mouth
  const mx = c[0] + f * R * 0.3, my = c[1] + R * 0.45; g.strokeStyle = '#fbf8f2'; g.fillStyle = '#fbf8f2'; g.lineWidth = R * 0.07; g.lineCap = 'round';
  const m = o.mouth || 'flat';
  g.beginPath();
  if (m === 'flat') { g.moveTo(mx - R * 0.14, my); g.lineTo(mx + R * 0.14, my); g.stroke(); }
  else if (m === 'smile') { g.arc(mx, my - R * 0.12, R * 0.17, 0.35, Math.PI - 0.35); g.stroke(); }
  else if (m === 'sad') { g.arc(mx, my + R * 0.14, R * 0.15, Math.PI + 0.45, -0.45); g.stroke(); }
  else if (m === 'o') { g.ellipse(mx, my, R * 0.08, R * 0.11, 0, 0, Math.PI * 2); g.fill(); }
  else if (m === 'open') { g.ellipse(mx, my, R * 0.15, R * 0.12, 0, 0, Math.PI * 2); g.fill(); }
  else if (m === 'grit') { rr(g, mx - R * 0.17, my - R * 0.06, R * 0.34, R * 0.12, R * 0.04); g.fill(); g.strokeStyle = PAL.ink; g.lineWidth = R * 0.025; g.beginPath(); g.moveTo(mx - R * 0.17, my); g.lineTo(mx + R * 0.17, my); g.stroke(); }
  if (o.sweat) { g.fillStyle = 'rgba(190,225,255,0.9)'; const sx = c[0] - f * R * 0.55, sy = c[1] - R * 0.35 + (o.sweat % 1) * R * 0.5; g.beginPath(); g.moveTo(sx, sy - R * 0.14); g.quadraticCurveTo(sx + R * 0.09, sy, sx, sy + R * 0.06); g.quadraticCurveTo(sx - R * 0.09, sy, sx, sy - R * 0.14); g.fill(); }
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const t = k < 0 ? 0 : 255, a = Math.abs(k); r = Math.round(r + (t - r) * a); gg = Math.round(gg + (t - gg) * a); b = Math.round(b + (t - b) * a);
  return `rgb(${r},${gg},${b})`;
}
const HERO = { hood: PAL.hero, hoodDk: PAL.heroDk, pants: PAL.pants };
const SIS = { hood: PAL.sis, hoodDk: PAL.sisDk, pants: '#3a3550', hair: '#2a1a12' };
const GREY = { hood: '#6d7385', hoodDk: '#4b5060', pants: '#2b3047' };
