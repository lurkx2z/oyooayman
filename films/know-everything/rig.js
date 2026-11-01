/* =====================================================================
   RIG (v2) — our stickmen: round ink heads with big white eyes, one colour mark per character, thick round limbs.
   v2 adds shading (lit side / shadow side), a contact shadow, hood collar and drawstrings, cuffs, sneaker soles, a
   head sheen and rim light, costumes (lab coat + glasses, cap + whistle, hard hat + hi-vis vest), breathing, and
   lip-flap while a character talks. Poses are joint angles (radians): arms and legs measured from straight down,
   + = toward the way the figure faces. Pure drawing, no state.
   ===================================================================== */

const POSE0 = { lean: 0, tilt: 0, lSh: 0.08, lEl: 0.15, rSh: -0.06, rEl: 0.15, lHip: 0.04, lKn: 0.03, rHip: -0.04, rKn: 0.03, hipDrop: 0 };
function pose(o) { return Object.assign({}, POSE0, o); }
function mixPose(a, b, u) { const o = {}; for (const k in POSE0) o[k] = lerp(a[k] ?? POSE0[k], b[k] ?? POSE0[k], u); return o; }
// a pose track: [[t, pose, blend?], ...] eased over `bl` seconds after each key
function poseAt(track, t, bl = 0.35) {
  let i = 0; while (i + 1 < track.length && track[i + 1][0] <= t) i++;
  const [t0, p] = track[i]; if (i === 0) return pose(p);
  const prev = track[i - 1][1], b = track[i][2] ?? bl;
  return mixPose(pose(prev), pose(p), eIO((t - t0) / b));
}

const POSES = {
  stand: {},
  relaxed: { lSh: 0.12, lEl: 0.25, rSh: -0.1, rEl: 0.3, tilt: 0.04 },
  surprised: { lean: -0.06, lSh: 0.5, lEl: -1.2, rSh: -0.45, rEl: 1.2, tilt: -0.08 },
  handsUp: { lean: -0.08, lSh: 1.2, lEl: 1.2, rSh: 1.0, rEl: 1.3, tilt: -0.12 },
  armsUp: { lSh: 2.6, lEl: 0.1, rSh: 2.5, rEl: 0.15, lean: -0.05, tilt: -0.25 },
  crossed: { lSh: 0.55, lEl: 1.9, rSh: 0.45, rEl: 1.95, tilt: 0.05 },
  holdFront: { lSh: 0.7, lEl: 0.9, rSh: 0.6, rEl: 1.0 },
  point: { lSh: 0.1, lEl: 0.2, rSh: 1.45, rEl: 0.1, tilt: -0.05 },
  pointUp: { lSh: 0.1, lEl: 0.2, rSh: 2.2, rEl: 0.2, tilt: -0.2 },
  wristHold: { lSh: 0.75, lEl: 1.25, rSh: 0.55, rEl: 1.55, tilt: 0.25, lean: 0.1 },
  crouchGrip: { lean: 0.55, lSh: 0.15, lEl: 0, rSh: 0.1, rEl: 0, lHip: 1.5, lKn: 1.9, rHip: 1.3, rKn: 1.7, tilt: -0.35 },
  rackPos: { lean: -0.04, lSh: 0.9, lEl: 2.5, rSh: 0.85, rEl: 2.5, lHip: 0.15, lKn: 0.2, rHip: -0.1, rKn: 0.15, tilt: -0.12 },
  overhead: { lean: -0.02, lSh: 3.0, lEl: 0.0, rSh: 2.95, rEl: 0.0, lHip: 0.35, lKn: 0.05, rHip: -0.45, rKn: 0.45, tilt: -0.2 },
  standBar: { lean: 0.15, lSh: 0.1, lEl: 0.1, rSh: 0.05, rEl: 0.1, tilt: 0.1 },
  run1: { lean: 0.42, lSh: -0.9, lEl: 1.6, rSh: 1.1, rEl: 1.5, lHip: 1.15, lKn: 1.0, rHip: -0.6, rKn: 1.7, tilt: 0.05 },
  run2: { lean: 0.42, lSh: 1.1, lEl: 1.5, rSh: -0.9, rEl: 1.6, lHip: -0.6, lKn: 1.7, rHip: 1.15, rKn: 1.0, tilt: 0.05 },
  catch: { lean: -0.15, lSh: 2.75, lEl: 0.35, rSh: 2.55, rEl: 0.45, lHip: 0.35, lKn: 0.5, rHip: -0.4, rKn: 0.3, hipDrop: 0.03, tilt: -0.5 },
  phone: { lSh: 0.5, lEl: 1.9, rSh: 0.4, rEl: 2.35, tilt: 0.25 },
  walk1: { lSh: -0.35, lEl: 0.3, rSh: 0.35, rEl: 0.35, lHip: 0.38, lKn: 0.15, rHip: -0.3, rKn: 0.35 },
  walk2: { lSh: 0.35, lEl: 0.35, rSh: -0.35, rEl: 0.3, lHip: -0.3, lKn: 0.35, rHip: 0.38, rKn: 0.15 },
  cower: { lean: 0.25, lSh: 2.2, lEl: 1.9, rSh: 2.1, rEl: 2.0, lHip: 0.6, lKn: 1.1, rHip: 0.5, rKn: 1.0, tilt: 0.5 },
  lieBed: {},
  sitStool: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.5, lEl: 0.9, rSh: 0.45, rEl: 1.0, lean: 0.05 },
  sitCasts: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.55, lEl: 1.25, rSh: 0.5, rEl: 1.3, lean: 0.08, tilt: 0.1 },
  sitOffer: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.95, lEl: 0.6, rSh: 0.9, rEl: 0.65, lean: 0.12, tilt: -0.05 },
  sitLean: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.2, lEl: 0.4, rSh: 0.1, rEl: 0.3, lean: -0.12, tilt: -0.35 },
  sitHands: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.35, lEl: 1.1, rSh: 0.3, rEl: 1.2, lean: 0.1, tilt: 0.12 },
  sitTable: { lHip: 1.45, lKn: 1.4, rHip: 1.4, rKn: 1.4, lSh: 0.3, lEl: 0.5, rSh: 0.25, rEl: 0.55, lean: 0.02, tilt: 0.02 },
  carefulHold: { lSh: 0.85, lEl: 0.75, rSh: 0.75, rEl: 0.85, tilt: 0.15, lean: 0.06 },
  clipboard: { lSh: 0.7, lEl: 1.6, rSh: 0.2, rEl: 0.5, tilt: 0.1 },
  cheer: { lSh: 2.7, lEl: 0.3, rSh: 2.6, rEl: 0.4, tilt: -0.3, lean: -0.05 },
  shout: { lean: 0.12, lSh: 1.0, lEl: 1.4, rSh: 1.6, rEl: 0.2, tilt: -0.1 },
};

// lip flap: how open a character's mouth is at t, from their clips' word times (0 when silent)
function talkAt(t, who) {
  if (typeof KET === 'undefined') return 0;
  for (const id of KET.order) {
    const c = KET.clips[id]; if (c.who !== who || t < c.start - 0.05 || t > c.end + 0.05) continue;
    for (const w of c.words) if (t >= w.s - 0.03 && t <= w.e + 0.02) { const ph = (t - w.s) * 11 + hash(Math.round(w.s * 100)) * 3; return 0.35 + 0.65 * Math.abs(Math.sin(ph)); }
  }
  return 0;
}

// draw a figure. o: { x, y (feet), h, f (+1 right / -1 left), col: {hood, hoodDk, pants, hair?}, p: pose,
//   eyes: { open, wide, lx, ly }, brow (-1 angry … +1 worried), mouth, talk (0..1 lip flap), pony, casts, back,
//   rim (+1 light from the right / -1 left), rimCol, sweat, blink, t (breathing), coat, glasses, cap, hardhat, vest,
//   whistle, shadow (false: no contact shadow), light (0..1 how lit the near side is) }
function drawStick(g, o) {
  const h = o.h, f = o.f || 1, p = o.p || pose({}), C = o.col;
  const L = { torso: 0.3 * h, neck: 0.035 * h, r: 0.115 * h, ua: 0.175 * h, fa: 0.165 * h, th: 0.215 * h, sh: 0.215 * h };
  const dir = (a) => [Math.sin(a) * f, Math.cos(a)];
  const breath = o.t !== undefined ? Math.sin(o.t * 2.1 + (o.x || 0) * 0.01) * 0.006 * h : 0;
  const rim = o.rim || 0, rimCol = o.rimCol || PAL.inkRim;
  // legs → hip height (the lower foot stands on y)
  const legs = [[p.lHip, p.lKn], [p.rHip, p.rKn]].map(([ha, ka]) => { const a = dir(ha), b = dir(ha - ka); return { a, b, d: a[1] * L.th + b[1] * L.sh }; });
  const hipY = o.y - Math.max(legs[0].d, legs[1].d) - 0.02 * h + p.hipDrop * h;
  const hip = [o.x, hipY];
  const sp = [Math.sin(p.lean) * f, -Math.cos(p.lean)];
  const neck = [hip[0] + sp[0] * L.torso, hip[1] + sp[1] * L.torso + breath];
  const hd = [Math.sin(p.lean + p.tilt * 0.5) * f, -Math.cos(p.lean + p.tilt * 0.5)];
  const head = [neck[0] + hd[0] * (L.neck + L.r), neck[1] + hd[1] * (L.neck + L.r)];
  const nrm = [-sp[1], sp[0]];
  const sho = [neck[0] - sp[0] * 0.02 * h, neck[1] - sp[1] * 0.02 * h];
  const lw = 0.052 * h;
  g.lineCap = 'round'; g.lineJoin = 'round';
  // contact shadow
  if (o.shadow !== false) { const sw = 0.2 * h; const gr = g.createRadialGradient(o.x, o.y + 0.006 * h, 0, o.x, o.y + 0.006 * h, sw); gr.addColorStop(0, 'rgba(5,4,12,0.55)'); gr.addColorStop(1, 'rgba(5,4,12,0)');
    g.save(); g.translate(o.x, o.y + 0.006 * h); g.scale(1, 0.16); g.translate(-o.x, -(o.y + 0.006 * h)); g.fillStyle = gr; g.fillRect(o.x - sw, o.y - sw, 2 * sw, 2 * sw); g.restore(); }
  // a limb: upper + lower segment, base colour then a lit edge toward the rim light
  const limb = (from, a1, l1, a2, l2, col, w, col2, w2, lit) => {
    const d1 = dir(a1), e = [from[0] + d1[0] * l1, from[1] + d1[1] * l1];
    const d2 = dir(a2), q = [e[0] + d2[0] * l2, e[1] + d2[1] * l2];
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(from[0], from[1]); g.lineTo(e[0], e[1]); if (!col2) g.lineTo(q[0], q[1]); g.stroke();
    if (col2) { g.strokeStyle = col2; g.lineWidth = w2; g.beginPath(); g.moveTo(e[0], e[1]); g.lineTo(q[0], q[1]); g.stroke(); }
    if (lit && rim) { const ox = rim * w * 0.28; g.strokeStyle = lit; g.globalAlpha = 0.55; g.lineWidth = w * 0.22; g.beginPath(); g.moveTo(from[0] + ox, from[1]); g.lineTo(e[0] + ox, e[1]); if (!col2) g.lineTo(q[0] + ox, q[1]); g.stroke(); g.globalAlpha = 1; }
    return { e, q, d1, d2 };
  };
  const shoe = (q, back) => {
    g.fillStyle = back ? '#c9c4bb' : PAL.shoe; g.beginPath(); g.ellipse(q[0] + f * 0.026 * h, q[1] - 0.002 * h, 0.046 * h, 0.024 * h, 0, Math.PI, 0); g.lineTo(q[0] + f * 0.072 * h, q[1] + 0.012 * h); g.lineTo(q[0] - f * 0.02 * h, q[1] + 0.012 * h); g.closePath(); g.fill();
    g.fillStyle = back ? '#8d8a85' : '#b9b4ab'; g.fillRect(Math.min(q[0] - f * 0.02 * h, q[0] + f * 0.072 * h), q[1] + 0.006 * h, 0.092 * h, 0.008 * h);
  };
  const hand = (q, cast) => { g.fillStyle = cast ? '#f2efe8' : PAL.ink; g.beginPath(); g.arc(q[0], q[1], (cast ? 0.034 : 0.03) * h, 0, Math.PI * 2); g.fill(); };
  const coatCol = o.coat === true ? '#eef0f3' : (o.coat || null);
  const sleeveCol = (back) => (coatCol ? (back ? shade(coatCol, -0.16) : shade(coatCol, 0.03)) : back ? C.hoodDk : C.hood);
  const arm = (a, e, back) => {
    const sleeve = sleeveCol(back);
    if (o.casts) { const r = limb(sho, a, L.ua, a + e, L.fa, sleeve, lw * 1.05, back ? '#d9d4ca' : '#f6f3ec', lw * 1.6, back ? null : '#ffffff'); hand(r.q, true); return r; }
    const r = limb(sho, a, L.ua, a + e, L.fa, sleeve, lw * 1.05, null, 0, back ? null : shade(C.hood, 0.35));
    // cuff
    const cu = [r.q[0] - r.d2[0] * 0.03 * h, r.q[1] - r.d2[1] * 0.03 * h];
    g.strokeStyle = coatCol ? shade(coatCol, -0.12) : shade(C.hood, -0.22); g.lineWidth = lw * 1.12; g.beginPath(); g.moveTo(cu[0], cu[1]); g.lineTo(cu[0] + r.d2[0] * 0.012 * h, cu[1] + r.d2[1] * 0.012 * h); g.stroke();
    hand(r.q); return r;
  };
  // back limbs
  const lA = arm(p.lSh, p.lEl, true);
  const legL = limb([hip[0] - nrm[0] * 0.01 * h, hip[1]], p.lHip, L.th, p.lHip - p.lKn, L.sh, shade(C.pants, -0.3), lw * 1.15); shoe(legL.q, true);
  // torso
  const hw = 0.078 * h, sw = 0.09 * h;
  const bodyPath = (ext) => {
    g.beginPath();
    g.moveTo(hip[0] - nrm[0] * (hw + ext * 0.2) - sp[0] * ext, hip[1] - nrm[1] * hw + 0.02 * h - sp[1] * ext);
    g.lineTo(hip[0] + nrm[0] * (hw + ext * 0.2) - sp[0] * ext, hip[1] + nrm[1] * hw + 0.02 * h - sp[1] * ext);
    g.lineTo(sho[0] + nrm[0] * sw, sho[1] + nrm[1] * sw); g.quadraticCurveTo(neck[0], neck[1] - 0.03 * h, sho[0] - nrm[0] * sw, sho[1] - nrm[1] * sw); g.closePath();
  };
  const legR = () => { const r = limb([hip[0] + nrm[0] * 0.01 * h, hip[1]], p.rHip, L.th, p.rHip - p.rKn, L.sh, C.pants, lw * 1.15, null, 0, shade(C.pants, 0.3)); shoe(r.q); return r; };
  // shading gradient across the body: the rim side is lighter
  const gx0 = hip[0] - (rim || 1) * 0.1 * h, gx1 = hip[0] + (rim || 1) * 0.1 * h;
  const bodyFill = (base) => { const gr = g.createLinearGradient(gx0, 0, gx1, 0); gr.addColorStop(0, shade(base, -0.28)); gr.addColorStop(0.55, base); gr.addColorStop(1, rim ? shade(base, 0.22) : base); return gr; };
  // shirt V and tie at the neck (suits, the teacher's sweater)
  const shirtV = (col, tie) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(neck[0] - 0.034 * h, neck[1] - 0.004 * h); g.lineTo(neck[0] + 0.034 * h, neck[1] - 0.004 * h); g.lineTo(neck[0], neck[1] + 0.085 * h); g.closePath(); g.fill();
    if (tie) { g.fillStyle = tie; g.beginPath(); g.moveTo(neck[0] - 0.009 * h, neck[1] + 0.004 * h); g.lineTo(neck[0] + 0.009 * h, neck[1] + 0.004 * h); g.lineTo(neck[0] + 0.012 * h, neck[1] + 0.07 * h); g.lineTo(neck[0], neck[1] + 0.088 * h); g.lineTo(neck[0] - 0.012 * h, neck[1] + 0.07 * h); g.closePath(); g.fill(); }
  };
  if (coatCol) {
    // a long coat (white lab coat, or a dark suit jacket): tails over the hips, lapels; shirt (and tie) at the neck
    g.fillStyle = shade(C.pants, -0.05); g.beginPath(); g.ellipse(hip[0], hip[1] + 0.03 * h, hw * 0.95, 0.035 * h, 0, 0, Math.PI * 2); g.fill();
    legR();
    g.fillStyle = bodyFill(coatCol); bodyPath((o.short ? 0.05 : 0.12) * h); g.fill();
    g.strokeStyle = shade(coatCol, -0.18); g.lineWidth = 0.008 * h; g.beginPath(); g.moveTo(neck[0], neck[1] + 0.01 * h); g.lineTo(lerp(neck[0], hip[0], 1.3), lerp(neck[1], hip[1], 1.3)); g.stroke();
    if (o.tie) shirtV('#f4f2ee', o.tie);
    else { g.fillStyle = C.hood; g.beginPath(); g.moveTo(neck[0] - 0.03 * h, neck[1]); g.lineTo(neck[0] + 0.03 * h, neck[1]); g.lineTo(neck[0], neck[1] + 0.07 * h); g.closePath(); g.fill(); }
    // lapels
    g.strokeStyle = shade(coatCol, o.coat === true ? -0.12 : 0.18); g.lineWidth = 0.007 * h; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(neck[0] + s2 * 0.036 * h, neck[1]); g.lineTo(neck[0] + s2 * 0.012 * h, neck[1] + 0.1 * h); g.stroke(); }
    if (o.coat === true) { const pk = [lerp(hip[0], neck[0], 0.62) + f * 0.035 * h, lerp(hip[1], neck[1], 0.62)]; g.fillStyle = '#3d6fd6'; g.fillRect(pk[0], pk[1] - 0.03 * h, 0.008 * h, 0.035 * h); }
  } else if (o.sweater) {
    // a plain sweater with a V-neck, shirt and tie (the teacher); mom's cardigan has no tie
    g.fillStyle = shade(C.pants, -0.05); g.beginPath(); g.ellipse(hip[0], hip[1] + 0.03 * h, hw * 0.95, 0.035 * h, 0, 0, Math.PI * 2); g.fill();
    legR();
    g.fillStyle = bodyFill(C.hood); bodyPath(0); g.fill();
    g.strokeStyle = shade(C.hood, -0.22); g.lineWidth = 0.022 * h; g.beginPath(); g.moveTo(hip[0] - nrm[0] * hw * 0.92, hip[1] - nrm[1] * hw + 0.012 * h); g.lineTo(hip[0] + nrm[0] * hw * 0.92, hip[1] + nrm[1] * hw + 0.012 * h); g.stroke();
    shirtV(o.shirt || '#f4f2ee', o.tie || null);
    if (o.cardigan) { g.fillStyle = '#f4e6c8'; for (let k = 0; k < 3; k++) { const q2 = [lerp(neck[0], hip[0], 0.35 + k * 0.2), lerp(neck[1], hip[1], 0.35 + k * 0.2)]; g.beginPath(); g.arc(q2[0], q2[1], 0.009 * h, 0, Math.PI * 2); g.fill(); } }
  } else {
    g.fillStyle = bodyFill(C.hood); bodyPath(0); g.fill();
    // hem band
    g.strokeStyle = shade(C.hood, -0.22); g.lineWidth = 0.022 * h; g.beginPath(); g.moveTo(hip[0] - nrm[0] * hw * 0.92, hip[1] - nrm[1] * hw + 0.012 * h); g.lineTo(hip[0] + nrm[0] * hw * 0.92, hip[1] + nrm[1] * hw + 0.012 * h); g.stroke();
    // kangaroo pocket
    const pk = [lerp(hip[0], neck[0], 0.3), lerp(hip[1], neck[1], 0.3)];
    g.strokeStyle = shade(C.hood, -0.2); g.lineWidth = 0.01 * h; g.beginPath(); g.moveTo(pk[0] - 0.05 * h, pk[1] + 0.025 * h); g.lineTo(pk[0] - 0.035 * h, pk[1] - 0.02 * h); g.lineTo(pk[0] + 0.035 * h, pk[1] - 0.02 * h); g.lineTo(pk[0] + 0.05 * h, pk[1] + 0.025 * h); g.stroke();
    if (o.vest) { // hi-vis vest with two reflective stripes
      g.save(); bodyPath(0); g.clip(); g.fillStyle = '#ff8a1e'; g.fillRect(hip[0] - 0.2 * h, neck[1] - 0.02 * h, 0.4 * h, hip[1] - neck[1] + 0.06 * h);
      g.fillStyle = '#e8eef2'; for (const k of [0.35, 0.62]) { const yy = lerp(hip[1], neck[1], k); g.fillRect(hip[0] - 0.2 * h, yy, 0.4 * h, 0.022 * h); } g.restore();
    }
    g.fillStyle = shade(C.pants, -0.05); g.beginPath(); g.ellipse(hip[0], hip[1] + 0.03 * h, hw * 0.95, 0.035 * h, 0, 0, Math.PI * 2); g.fill();
    legR();
    // hood collar around the neck + drawstrings
    g.fillStyle = shade(C.hood, -0.25); g.beginPath(); g.ellipse(neck[0] - f * 0.03 * h, neck[1] + 0.008 * h, 0.07 * h, 0.038 * h, -f * 0.35, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.hoodDk; g.beginPath(); g.ellipse(neck[0] - f * 0.055 * h, neck[1] + 0.0 * h, 0.05 * h, 0.04 * h, -f * 0.6, 0, Math.PI * 2); g.fill();
    if (!o.back && !o.vest) { g.strokeStyle = '#f4efe6'; g.lineWidth = 0.007 * h; for (const s of [-1, 1]) { const x0 = neck[0] + f * 0.012 * h + s * 0.016 * h; g.beginPath(); g.moveTo(x0, neck[1] + 0.02 * h); g.lineTo(x0 + s * 0.004 * h, neck[1] + 0.075 * h + breath * 2); g.stroke(); } }
    if (o.whistle) { g.strokeStyle = '#d9dde2'; g.lineWidth = 0.005 * h; g.beginPath(); g.moveTo(neck[0] - 0.03 * h, neck[1] + 0.01 * h); g.quadraticCurveTo(neck[0] + f * 0.02 * h, neck[1] + 0.13 * h, neck[0] + f * 0.04 * h, neck[1] + 0.01 * h); g.stroke();
      g.fillStyle = '#c8ccd2'; rr(g, neck[0] + f * 0.005 * h - 0.015 * h, neck[1] + 0.1 * h, 0.03 * h, 0.018 * h, 0.006 * h); g.fill(); }
  }
  // head
  const R = L.r;
  const hair = C.hair || '#2a1a12';
  if (o.pony) { const sway = o.t !== undefined ? Math.sin(o.t * 2.6) * 0.12 : 0; g.fillStyle = hair; g.beginPath(); g.ellipse(head[0] - f * R * 1.0, head[1] - R * 0.05, R * 0.3, R * 0.62, f * (0.55 + sway), 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(head[0] - f * R * 0.72, head[1] - R * 0.55, R * 0.24, 0, Math.PI * 2); g.fill();
    g.fillStyle = PAL.sisDk; g.beginPath(); g.arc(head[0] - f * R * 0.78, head[1] - R * 0.42, R * 0.1, 0, Math.PI * 2); g.fill(); }
  { const gr = g.createRadialGradient(head[0] + (rim || 0.5) * R * 0.35, head[1] - R * 0.45, R * 0.05, head[0], head[1], R * 1.05); gr.addColorStop(0, '#3a3d55'); gr.addColorStop(0.5, PAL.ink); gr.addColorStop(1, '#0e0f18');
    g.fillStyle = gr; g.beginPath(); g.arc(head[0], head[1], R, 0, Math.PI * 2); g.fill(); }
  if (rim) { g.strokeStyle = rimCol; g.globalAlpha = 0.85; g.lineWidth = 0.014 * h; g.beginPath(); const a0 = rim > 0 ? -1.35 : Math.PI - 0.55, a1 = rim > 0 ? 0.55 : Math.PI + 1.35; g.arc(head[0], head[1], R - 0.007 * h, a0, a1); g.stroke(); g.globalAlpha = 1; }
  if (o.pony) { g.fillStyle = hair; g.beginPath(); g.arc(head[0], head[1], R * 1.03, Math.PI * 1.03, Math.PI * 1.97); g.quadraticCurveTo(head[0] + f * R * 0.2, head[1] - R * 0.5, head[0] - f * R * 0.2, head[1] - R * 0.62); g.closePath(); g.fill(); }
  if (o.bun) { g.fillStyle = hair; g.beginPath(); g.arc(head[0] - f * R * 0.55, head[1] - R * 0.82, R * 0.36, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(head[0], head[1], R * 1.03, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(head[0] + f * R * 0.3, head[1] - R * 0.45, head[0] - f * R * 0.1, head[1] - R * 0.6); g.closePath(); g.fill(); }
  if (o.bob) { g.fillStyle = hair; g.beginPath(); g.arc(head[0], head[1] - R * 0.05, R * 1.08, Math.PI * 0.92, Math.PI * 2.08); g.lineTo(head[0] + R * 1.08, head[1] + R * 0.35); g.quadraticCurveTo(head[0] + f * R * 0.5, head[1] - R * 0.55, head[0] - f * R * 0.2, head[1] - R * 0.5); g.lineTo(head[0] - R * 1.08, head[1] + R * 0.35); g.closePath(); g.fill(); }
  if (o.short) { g.fillStyle = hair; g.beginPath(); g.arc(head[0], head[1], R * 1.02, Math.PI * 1.08, Math.PI * 1.92); g.quadraticCurveTo(head[0], head[1] - R * 0.7, head[0] - R * 0.95, head[1] - R * 0.35); g.closePath(); g.fill(); }
  if (o.hardhat) { g.fillStyle = '#f6b21b'; g.beginPath(); g.arc(head[0], head[1] - R * 0.18, R * 1.0, Math.PI, 0); g.fill(); g.fillStyle = '#d6900c'; rr(g, head[0] - R * 1.18, head[1] - R * 0.24, R * 2.36, R * 0.16, R * 0.06); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(head[0] - R * 0.08, head[1] - R * 1.15, R * 0.16, R * 0.95); }
  if (o.cap) { g.fillStyle = o.cap; g.beginPath(); g.arc(head[0], head[1] - R * 0.12, R * 1.02, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); g.fill(); g.fillStyle = shade(o.cap, -0.25); g.beginPath(); g.ellipse(head[0] + f * R * 0.95, head[1] - R * 0.2, R * 0.6, R * 0.12, 0, 0, Math.PI * 2); g.fill(); }
  if (!o.back) face(g, head, R, f, o, p);
  if (o.shades && !o.back) { const cx = head[0] + f * R * 0.3, cy = head[1] - R * 0.1; g.fillStyle = '#07080c'; for (const s2 of [-1, 1]) { rr(g, cx + s2 * R * 0.3 - R * 0.24, cy - R * 0.14, R * 0.48, R * 0.3, R * 0.1); g.fill(); } g.fillRect(cx - R * 0.08, cy - R * 0.06, R * 0.16, R * 0.05);
    g.fillStyle = 'rgba(160,200,255,0.5)'; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(cx + s2 * R * 0.3 - R * 0.16, cy - R * 0.1); g.lineTo(cx + s2 * R * 0.3 - R * 0.04, cy - R * 0.1); g.lineTo(cx + s2 * R * 0.3 - R * 0.14, cy + R * 0.08); g.closePath(); g.fill(); } }
  if (o.earpiece) { g.strokeStyle = '#d6dbe4'; g.lineWidth = R * 0.05; g.beginPath(); const ex = head[0] - f * R * 0.45, ey = head[1] + R * 0.1; g.moveTo(ex, ey); for (let k = 1; k <= 8; k++) g.lineTo(ex - f * R * 0.08 * Math.sin(k * 1.6), ey + k * R * 0.11); g.stroke(); g.fillStyle = '#d6dbe4'; g.beginPath(); g.arc(ex, ey, R * 0.08, 0, Math.PI * 2); g.fill(); }
  if (o.glasses && !o.back) { g.strokeStyle = '#d8dde6'; g.lineWidth = R * 0.06; const cx = head[0] + f * R * 0.3, cy = head[1] - R * 0.08; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * R * 0.3, cy, R * 0.25, 0, Math.PI * 2); g.stroke(); } g.beginPath(); g.moveTo(cx - R * 0.05, cy); g.lineTo(cx + R * 0.05, cy); g.stroke(); }
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
    if (open > 0.25) { g.fillStyle = PAL.ink; const pr = R * (0.09 - E.wide * 0.02); const px = ex + (E.lx + f * 0.25) * ew * 0.5, py = cy + E.ly * eh * 0.45; g.beginPath(); g.arc(px, py, pr, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px - pr * 0.35, py - pr * 0.38, pr * 0.34, 0, Math.PI * 2); g.fill(); }
    if (o.brow !== undefined) { const b = o.brow; g.strokeStyle = '#fbf8f2'; g.lineWidth = R * 0.075; g.beginPath(); const by = cy - R * 0.4 - E.wide * R * 0.06;
      g.moveTo(ex - R * 0.15, by - s * b * R * 0.08); g.lineTo(ex + R * 0.15, by + s * b * R * 0.08); g.stroke(); }
  }
  const mx = c[0] + f * R * 0.3, my = c[1] + R * 0.45; g.strokeStyle = '#fbf8f2'; g.fillStyle = '#fbf8f2'; g.lineWidth = R * 0.07; g.lineCap = 'round';
  let m = o.mouth || 'flat';
  const tk = o.talk || 0;
  g.beginPath();
  if (tk > 0.05 && m !== 'grit') { g.ellipse(mx, my, R * (0.1 + tk * 0.06), R * (0.03 + tk * 0.12), 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#7a2b35'; g.beginPath(); g.ellipse(mx, my + R * tk * 0.03, R * (0.06 + tk * 0.04), R * tk * 0.07, 0, 0, Math.PI * 2); g.fill(); }
  else if (m === 'flat') { g.moveTo(mx - R * 0.14, my); g.lineTo(mx + R * 0.14, my); g.stroke(); }
  else if (m === 'smile') { g.arc(mx, my - R * 0.12, R * 0.17, 0.35, Math.PI - 0.35); g.stroke(); }
  else if (m === 'smirk') { g.moveTo(mx - R * 0.13, my + R * 0.02); g.quadraticCurveTo(mx + R * 0.05, my + R * 0.06, mx + R * 0.15, my - R * 0.06); g.stroke(); }
  else if (m === 'sad') { g.arc(mx, my + R * 0.14, R * 0.15, Math.PI + 0.45, -0.45); g.stroke(); }
  else if (m === 'o') { g.ellipse(mx, my, R * 0.08, R * 0.11, 0, 0, Math.PI * 2); g.fill(); }
  else if (m === 'open') { g.ellipse(mx, my, R * 0.15, R * 0.12, 0, 0, Math.PI * 2); g.fill(); }
  else if (m === 'wavy') { g.moveTo(mx - R * 0.17, my); for (let i = 1; i <= 4; i++) g.lineTo(mx - R * 0.17 + i * R * 0.085, my + (i % 2 ? -1 : 1) * R * 0.04); g.stroke(); }
  else if (m === 'grit') { rr(g, mx - R * 0.17, my - R * 0.06, R * 0.34, R * 0.12, R * 0.04); g.fill(); g.strokeStyle = PAL.ink; g.lineWidth = R * 0.025; g.beginPath(); g.moveTo(mx - R * 0.17, my); g.lineTo(mx + R * 0.17, my); g.stroke(); }
  if (o.sweat) { g.fillStyle = 'rgba(190,225,255,0.9)'; const sx = c[0] - f * R * 0.55, sy = c[1] - R * 0.35 + (o.sweat % 1) * R * 0.5; g.beginPath(); g.moveTo(sx, sy - R * 0.14); g.quadraticCurveTo(sx + R * 0.09, sy, sx, sy + R * 0.06); g.quadraticCurveTo(sx - R * 0.09, sy, sx, sy - R * 0.14); g.fill(); }
  if (o.blush) { g.fillStyle = 'rgba(255,120,120,0.35)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * R * 0.42, cy + R * 0.32, R * 0.12, R * 0.06, 0, 0, Math.PI * 2); g.fill(); } }
}

function shade(hex, k) {
  let r, gg, b;
  if (hex[0] === '#') { const n = parseInt(hex.slice(1), 16); r = n >> 16; gg = (n >> 8) & 255; b = n & 255; }
  else { const m = hex.match(/\d+/g); r = +m[0]; gg = +m[1]; b = +m[2]; }
  const t = k < 0 ? 0 : 255, a = Math.abs(k); r = Math.round(r + (t - r) * a); gg = Math.round(gg + (t - gg) * a); b = Math.round(b + (t - b) * a);
  return `rgb(${r},${gg},${b})`;
}
const HERO = { hood: PAL.hero, hoodDk: PAL.heroDk, pants: PAL.pants };
const SIS = { hood: PAL.sis, hoodDk: PAL.sisDk, pants: '#3a3550', hair: '#2a1a12' };
const DOC = { hood: '#5b7fb8', hoodDk: '#3f5f93', pants: '#3a4258' };
const COACH = { hood: '#3c8f4a', hoodDk: '#2a6a35', pants: '#2a2f3d' };
const WORKER = { hood: '#4a5466', hoodDk: '#353d4b', pants: '#2e3a52' };
const GREY = { hood: '#6d7385', hoodDk: '#4b5060', pants: '#2b3047' };
const RIVAL = { hood: '#b7413a', hoodDk: '#8a2c27', pants: '#26283a' };
const MOM = { hood: '#b5455a', hoodDk: '#8a3044', pants: '#33354a', hair: '#3a2418' };
const TEACH = { hood: '#7a6248', hoodDk: '#5c4934', pants: '#3a3d4c', hair: '#8f8f96' };
const PHYS = { hood: '#4f6fa8', hoodDk: '#3a5486', pants: '#2f3446', hair: '#5a3424' };
const AGENT = { hood: '#1d1f29', hoodDk: '#121319', pants: '#16171f', hair: '#16120f' };
const KID1 = { hood: '#d0613c', hoodDk: '#a2472a', pants: '#2b3047' };
const KID2 = { hood: '#7d5fb0', hoodDk: '#5d4590', pants: '#2b3047', hair: '#5a2e1a' };
const KID3 = { hood: '#3f7fbf', hoodDk: '#2d5f93', pants: '#30323f' };
const KID4 = { hood: '#e9e3d6', hoodDk: '#bdb6a7', pants: '#3a3550' };
