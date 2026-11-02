/* =====================================================================
   FIGURE — the cast of "Would Eren and Light agree?", drawn as manga figures (not stickmen): tapered limbs with ink
   outlines and cel shadows, anime heads in three-quarter view (cranium + jaw, ear, big inked eyes with coloured
   irises, brows, nose, lip-flap mouth), hair as cut shapes with a shine band, and clothes:
     Light — tan suit, white shirt, crimson tie (his colour), neat chestnut hair with a long fringe, crimson-brown eyes;
     Eren  — dark jacket and harness straps, a green cloak (his colour), long dark hair in a half-bun, green eyes.
   Poses are joint angles (radians) as in the earlier 2D films: arms and legs measured from straight down, + = toward
   the way the figure faces. Pure drawing, no state. drawFig(g, o) returns the joint positions.
   ===================================================================== */

const POSE0 = { lean: 0, tilt: 0, lSh: 0.08, lEl: 0.15, rSh: -0.06, rEl: 0.15, lHip: 0.04, lKn: 0.03, rHip: -0.04, rKn: 0.03, hipDrop: 0 };
function pose(o) { return Object.assign({}, POSE0, o); }
function mixPose(a, b, u) { const o = {}; for (const k in POSE0) o[k] = lerp(a[k] ?? POSE0[k], b[k] ?? POSE0[k], u); return o; }
function poseAt(track, t, bl = 0.35) {
  let i = 0; while (i + 1 < track.length && track[i + 1][0] <= t) i++;
  const [t0, p] = track[i]; if (i === 0) return pose(p);
  const prev = track[i - 1][1], b = track[i][2] ?? bl;
  return mixPose(pose(prev), pose(p), eIO((t - t0) / b));
}
const POSES = {
  stand: {},
  relaxed: { lSh: 0.1, lEl: 0.2, rSh: -0.08, rEl: 0.25, tilt: 0.04 },
  pockets: { lSh: -0.15, lEl: 0.75, rSh: -0.2, rEl: 0.8, tilt: 0.02 },
  crossed: { lSh: 0.55, lEl: 1.9, rSh: 0.45, rEl: 1.95, tilt: 0.05 },
  point: { lSh: 0.1, lEl: 0.2, rSh: 1.45, rEl: 0.1, tilt: -0.05 },
  open: { lSh: 0.5, lEl: 0.5, rSh: 0.7, rEl: 0.6, tilt: -0.08 },
  fist: { lSh: 0.1, lEl: 0.3, rSh: 0.35, rEl: 1.9, tilt: 0.1, lean: 0.05 },
  walk1: { lSh: -0.35, lEl: 0.3, rSh: 0.35, rEl: 0.35, lHip: 0.38, lKn: 0.15, rHip: -0.3, rKn: 0.35 },
  walk2: { lSh: 0.35, lEl: 0.35, rSh: -0.35, rEl: 0.3, lHip: -0.3, lKn: 0.35, rHip: 0.38, rKn: 0.15 },
  sit: { lHip: 1.5, lKn: 1.5, rHip: 1.42, rKn: 1.38, lSh: 0.35, lEl: 0.9, rSh: 0.3, rEl: 1.0, lean: 0.04 },
  sitBack: { lHip: 1.5, lKn: 1.5, rHip: 1.42, rKn: 1.38, lSh: -0.2, lEl: 0.4, rSh: 0.15, rEl: 0.9, lean: -0.1, tilt: -0.05 },
  sitLean: { lHip: 1.5, lKn: 1.5, rHip: 1.42, rKn: 1.38, lSh: 0.6, lEl: 1.3, rSh: 0.55, rEl: 1.4, lean: 0.28, tilt: 0.1 },
  sitCross: { lHip: 1.5, lKn: 1.5, rHip: 1.65, rKn: 1.1, lSh: 0.5, lEl: 1.8, rSh: 0.4, rEl: 1.9, lean: -0.04 },
  sitWrite: { lHip: 1.5, lKn: 1.5, rHip: 1.42, rKn: 1.38, lSh: 0.85, lEl: 1.0, rSh: 0.95, rEl: 1.25, lean: 0.18, tilt: 0.35 },
  sitHands: { lHip: 1.5, lKn: 1.5, rHip: 1.42, rKn: 1.38, lSh: 0.55, lEl: 1.35, rSh: 0.5, rEl: 1.45, lean: 0.2, tilt: 0.15 },
  sitOffer: { lHip: 1.5, lKn: 1.5, rHip: 1.42, rKn: 1.38, lSh: 0.4, lEl: 0.9, rSh: 1.05, rEl: 0.45, lean: 0.12, tilt: -0.05 },
  armsWide: { lSh: 1.2, lEl: 0.3, rSh: 1.4, rEl: 0.25, tilt: -0.2, lean: -0.05 },
  godArms: { lSh: 2.2, lEl: 0.2, rSh: 2.0, rEl: 0.25, tilt: -0.35, lean: -0.1 },
  write: { lSh: 0.7, lEl: 1.1, rSh: 0.9, rEl: 1.3, lean: 0.25, tilt: 0.4 },
  bagReach: { lHip: 1.5, lKn: 1.5, rHip: 1.42, rKn: 1.38, lSh: 0.3, lEl: 0.6, rSh: -0.2, rEl: 0.5, lean: 0.06, tilt: 0.25 },
  cloakWalk1: { lSh: -0.1, lEl: 0.2, rSh: 0.15, rEl: 0.25, lHip: 0.38, lKn: 0.15, rHip: -0.3, rKn: 0.35 },
  cloakWalk2: { lSh: 0.1, lEl: 0.25, rSh: -0.1, rEl: 0.2, lHip: -0.3, lKn: 0.35, rHip: 0.38, rKn: 0.15 },
  headDown: { lSh: 0.05, lEl: 0.1, rSh: 0.0, rEl: 0.1, tilt: 0.5, lean: 0.08 },
  stride: { lSh: -0.4, lEl: 0.5, rSh: 0.5, rEl: 0.4, lHip: 0.45, lKn: 0.1, rHip: -0.35, rKn: 0.2, lean: 0.06 },
};
const walkP = (t, sp = 4, a = POSES.walk1, b = POSES.walk2) => mixPose(pose(a), pose(b), 0.5 + 0.5 * Math.sin(t * sp));

// lip flap from the clips' word times (window.KET from build-timing.cjs)
function talkAt(t, who) {
  if (typeof KET === 'undefined') return 0;
  for (const id of KET.order) {
    const c = KET.clips[id]; if (c.who !== who || t < c.start - 0.05 || t > c.end + 0.05) continue;
    for (const w of c.words) if (t >= w.s - 0.03 && t <= w.e + 0.02) { const ph = (t - w.s) * 11 + hash(Math.round(w.s * 100)) * 3; return 0.35 + 0.65 * Math.abs(Math.sin(ph)); }
  }
  return 0;
}
function shade(hex, k) {
  let r, gg, b;
  if (hex[0] === '#') { const n = parseInt(hex.slice(1), 16); r = n >> 16; gg = (n >> 8) & 255; b = n & 255; }
  else { const m = hex.match(/\d+/g); r = +m[0]; gg = +m[1]; b = +m[2]; }
  const t = k < 0 ? 0 : 255, a = Math.abs(k); r = Math.round(r + (t - r) * a); gg = Math.round(gg + (t - gg) * a); b = Math.round(b + (t - b) * a);
  return `rgb(${r},${gg},${b})`;
}

const SKIN = '#f3e3d3', INKC = '#121015';
const CAST = {
  light: { suit: '#c4b498', suitDk: '#8c7e66', shirt: '#fbf9f4', tie: '#d2232a', pants: '#a39478', shoe: '#1e1b1a', hair: '#9c8670', iris: '#a3262a', irisDk: '#4a1210' },
  eren: { suit: '#3a3a35', suitDk: '#24241f', shirt: '#53524a', pants: '#6a5a46', shoe: '#2a1f18', hair: '#251a12', iris: '#15c98a', irisDk: '#06523a', cloak: '#1c9c5c', cloakDk: '#0d5a34', strap: '#8a6a44' },
  extra: { suit: '#55586a', suitDk: '#3a3c4a', shirt: '#e8e6e0', tie: '#3a3c4a', pants: '#3e404c', shoe: '#1d1d22', hair: '#2a2420', iris: '#3a3a40', irisDk: '#111' },
};

// a tapered capsule path from a (radius ra) to b (radius rb)
function capPath(g, a, b, ra, rb) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  g.beginPath(); g.arc(b[0], b[1], rb, ang - Math.PI / 2, ang + Math.PI / 2); g.arc(a[0], a[1], ra, ang + Math.PI / 2, ang + Math.PI * 1.5); g.closePath();
}
// fill a shape with a cel shadow on the side away from the light, then ink its outline
let FIGSIL = 0; const FIGRIM = '#f6f1e6';
function cel(g, path, base, dark, lx, ly, lw, keep) {
  if (FIGSIL && !keep) {   // silhouette mode: solid ink with a rim of light on the lit edge
    path(); g.fillStyle = FIGRIM; g.fill();
    g.save(); path(); g.clip(); g.translate(-lx * 0.8, -ly * 0.8); path(); g.fillStyle = INKC; g.fill(); g.restore();
    return;
  }
  path(); g.fillStyle = dark; g.fill();
  g.save(); path(); g.clip(); g.translate(lx, ly); path(); g.fillStyle = base; g.fill(); g.restore();
  path(); g.strokeStyle = INKC; g.lineWidth = lw; g.stroke();
}

// o: { x, y (feet), h, f (+1 faces right), who: 'light'|'eren'|'extra', p: pose, look {lx, ly}, open, brow, mouth, talk,
//      t, ld (key light side, ±1), wind, wet, glow (Eren's eyes, 0..1), blink, back (seen from behind), col (override) }
function drawFig(g, o) {
  FIGSIL = o.sil ? 1 : 0;
  const h = o.h, f = o.f || 1, p = o.p || pose({}), C = Object.assign({}, CAST[o.who || 'extra'], o.col || {});
  const L = { torso: 0.285 * h, neck: 0.03 * h, R: 0.074 * h, ua: 0.165 * h, fa: 0.15 * h, th: 0.235 * h, sh: 0.235 * h };
  const dir = (a) => [Math.sin(a) * f, Math.cos(a)];
  const breath = o.t !== undefined ? Math.sin(o.t * 2.1 + (o.x || 0) * 0.01) * 0.004 * h : 0;
  const lw = Math.min(6.5, Math.max(1.4, 0.0052 * h)), ld = o.ld ?? -f, lx = ld * 0.014 * h, ly = -0.006 * h;
  const legs = [[p.lHip, p.lKn], [p.rHip, p.rKn]].map(([ha, ka]) => { const a = dir(ha), b = dir(ha - ka); return a[1] * L.th + b[1] * L.sh; });
  const hipY = o.y - Math.max(legs[0], legs[1]) - 0.03 * h + p.hipDrop * h;
  const hip = [o.x, hipY];
  const sp = [Math.sin(p.lean) * f, -Math.cos(p.lean)];
  const neck = [hip[0] + sp[0] * L.torso, hip[1] + sp[1] * L.torso + breath];
  const nrm = [-sp[1] * f, sp[0] * f];                                   // points the way the figure faces
  const ht = p.lean + p.tilt * 0.6;
  const hd = [Math.sin(ht) * f, -Math.cos(ht)];
  const head = [neck[0] + hd[0] * (L.neck * 0.4 + L.R * 0.92), neck[1] + hd[1] * (L.neck * 0.4 + L.R * 0.92)];
  const sho = [neck[0] - sp[0] * 0.03 * h, neck[1] - sp[1] * 0.03 * h];
  const shoB = [sho[0] - nrm[0] * 0.03 * h, sho[1] - nrm[1] * 0.03 * h], shoF = [sho[0] + nrm[0] * 0.025 * h, sho[1] + nrm[1] * 0.025 * h];
  const hipB = [hip[0] - nrm[0] * 0.022 * h, hip[1]], hipF = [hip[0] + nrm[0] * 0.022 * h, hip[1]];
  g.lineCap = 'round'; g.lineJoin = 'round';
  // contact shadow
  if (o.shadow !== false) { const sw = 0.2 * h, cy = o.y + 0.004 * h; const gr = g.createRadialGradient(o.x, cy, 0, o.x, cy, sw); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(o.x, cy); g.scale(1, 0.14); g.translate(-o.x, -cy); g.fillStyle = gr; g.fillRect(o.x - sw, cy - sw, 2 * sw, 2 * sw); g.restore(); }
  const shoe = (q, back) => {
    const toe = [q[0] + f * 0.07 * h, q[1]], heel = [q[0] - f * 0.025 * h, q[1]];
    const P = () => { g.beginPath(); g.moveTo(heel[0], heel[1] + 0.006 * h); g.lineTo(toe[0], toe[1] + 0.006 * h); g.quadraticCurveTo(toe[0] + f * 0.012 * h, toe[1] - 0.02 * h, q[0] + f * 0.02 * h, q[1] - 0.032 * h); g.lineTo(heel[0], q[1] - 0.034 * h); g.closePath(); };
    cel(g, P, back ? shade(C.shoe, -0.2) : C.shoe, shade(C.shoe, -0.45), lx * 0.5, ly, lw);
  };
  const hand = (q, d2, back) => {
    const P = () => { g.beginPath(); g.ellipse(q[0] + d2[0] * 0.012 * h, q[1] + d2[1] * 0.012 * h, 0.016 * h, 0.023 * h, Math.atan2(d2[1], d2[0]) - Math.PI / 2, 0, Math.PI * 2); };
    cel(g, P, back ? shade(SKIN, -0.1) : SKIN, shade(SKIN, -0.28), lx * 0.4, ly, lw * 0.9);
  };
  // a limb is ONE stroked path (no seam at the elbow or knee): ink edge, shadow tone, then a lit band toward the light
  const limb = (from, a1, l1, a2, l2, r0, r1, r2, col, dk) => {
    const d1 = dir(a1), e = [from[0] + d1[0] * l1, from[1] + d1[1] * l1];
    const d2 = dir(a2), q = [e[0] + d2[0] * l2, e[1] + d2[1] * l2];
    const w = (r0 + r1 + r2) / 1.5, path = (ox = 0, oy = 0) => { g.beginPath(); g.moveTo(from[0] + ox, from[1] + oy); g.lineTo(e[0] + ox, e[1] + oy); g.lineTo(q[0] + ox, q[1] + oy); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (FIGSIL) { path(); g.strokeStyle = FIGRIM; g.lineWidth = w; g.stroke(); path(-lx * 0.8, -ly * 0.8); g.strokeStyle = INKC; g.lineWidth = w; g.stroke(); return { e, q, d1, d2 }; }
    path(); g.strokeStyle = INKC; g.lineWidth = w + lw * 2; g.stroke();
    path(); g.strokeStyle = dk; g.lineWidth = w; g.stroke();
    path(lx * 0.35, ly * 0.35); g.strokeStyle = col; g.lineWidth = w * 0.62; g.stroke();
    return { e, q, d1, d2 };
  };
  const arm = (base, a, el, back) => {
    const col = back ? shade(C.suit, -0.14) : C.suit, dk = back ? shade(C.suitDk, -0.15) : C.suitDk;
    const r = limb(base, a, L.ua, a + el, L.fa, 0.026 * h, 0.022 * h, 0.019 * h, col, dk);
    // shirt cuff (Light) / wrist wrap (Eren)
    const cu = [r.q[0] - r.d2[0] * 0.012 * h, r.q[1] - r.d2[1] * 0.012 * h];
    cel(g, () => capPath(g, cu, r.q, 0.017 * h, 0.016 * h), o.who === 'eren' ? '#d8cfbd' : C.shirt, shade(o.who === 'eren' ? '#d8cfbd' : C.shirt, -0.25), lx * 0.3, ly, lw * 0.8);
    hand(r.q, r.d2, back); return r;
  };
  const leg = (base, ha, ka, back) => {
    const col = back ? shade(C.pants, -0.16) : C.pants, dk = shade(C.pants, -0.4);
    const r = limb(base, ha, L.th, ha - ka, L.sh, 0.036 * h, 0.028 * h, 0.022 * h, col, dk); shoe(r.q, back); return r;
  };
  // Eren's cloak, back panel (behind everything)
  if (C.cloak) {
    const wv = (o.wind ?? 0.4) * (Math.sin((o.t || 0) * 2.7) * 0.6 + Math.sin((o.t || 0) * 4.3 + 1) * 0.4) * 0.05 * h;
    const kneeY = Math.max(hip[1] + 0.2 * h, o.y - 0.24 * h);
    const P = () => { g.beginPath(); g.moveTo(shoB[0] - f * 0.02 * h, shoB[1]); g.lineTo(shoF[0] + f * 0.04 * h, shoF[1] + 0.01 * h);
      g.quadraticCurveTo(hip[0] + f * 0.08 * h, hip[1], hip[0] + f * 0.05 * h + wv * 0.3, kneeY);
      const n = 6; for (let k = 1; k <= n; k++) g.lineTo(lerp(hip[0] + f * 0.05 * h, hip[0] - f * 0.26 * h, k / n) - wv * (k / n), kneeY + ((k % 2) ? 0.022 : -0.004) * h - (k / n) * 0.05 * h - wv * 0.3 * (k / n));
      g.quadraticCurveTo(hip[0] - f * 0.22 * h - wv, hip[1] - 0.05 * h, shoB[0] - f * 0.02 * h, shoB[1]); g.closePath(); };
    cel(g, P, shade(C.cloak, -0.12), C.cloakDk, lx, ly, lw, true);
    g.save(); P(); g.clip(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = lw * 0.8; for (let k = 0; k < 4; k++) { const xx = lerp(hip[0] - f * 0.2 * h, hip[0] + f * 0.02 * h, k / 3); g.beginPath(); g.moveTo(xx, hip[1] - 0.08 * h); g.quadraticCurveTo(xx - f * 0.01 * h - wv * 0.3, hip[1] + 0.1 * h, xx - f * 0.02 * h - wv * (0.5 + k * 0.1), kneeY); g.stroke(); } g.restore();
  }
  // back arm, back leg
  const lA = arm(shoB, p.lSh, p.lEl, true);
  const lL = leg(hipB, p.lHip, p.lKn, true);
  const rL = leg(hipF, p.rHip, p.rKn, false);
  // torso: jacket from the shoulders to just below the hips
  const hw = 0.064 * h, sw = 0.088 * h, hem = 0.05 * h;
  const torso = () => { g.beginPath();
    g.moveTo(hip[0] - nrm[0] * hw - sp[0] * hem, hip[1] - nrm[1] * hw - sp[1] * hem);
    g.lineTo(hip[0] + nrm[0] * (hw + 0.006 * h) - sp[0] * hem, hip[1] + nrm[1] * hw - sp[1] * hem);
    g.quadraticCurveTo(lerp(hip[0], sho[0], 0.55) + nrm[0] * (hw * 1.15), lerp(hip[1], sho[1], 0.55) + nrm[1] * hw, sho[0] + nrm[0] * sw * 0.8, sho[1] + nrm[1] * sw * 0.8 + 0.012 * h);
    g.quadraticCurveTo(neck[0] + nrm[0] * 0.04 * h, neck[1] - 0.01 * h, neck[0], neck[1] - 0.004 * h);
    g.quadraticCurveTo(neck[0] - nrm[0] * 0.05 * h, neck[1] - 0.006 * h, sho[0] - nrm[0] * sw, sho[1] - nrm[1] * sw + 0.016 * h);
    g.quadraticCurveTo(lerp(hip[0], sho[0], 0.5) - nrm[0] * (hw * 1.1), lerp(hip[1], sho[1], 0.5) - nrm[1] * hw, hip[0] - nrm[0] * hw - sp[0] * hem, hip[1] - nrm[1] * hw - sp[1] * hem);
    g.closePath(); };
  // the neck (under the collar)
  cel(g, () => capPath(g, [neck[0], neck[1] + 0.01 * h], [head[0] - f * 0.008 * h, head[1] + L.R * 0.55], 0.024 * h, 0.022 * h), SKIN, shade(SKIN, -0.3), lx * 0.5, ly, lw);
  cel(g, torso, C.suit, C.suitDk, lx, ly, lw);
  const cx = neck[0] + nrm[0] * 0.018 * h;   // the front line of the jacket (toward the face side in 3/4 view)
  if (o.who === 'light' || o.who === 'extra') {
    // shirt V, tie, lapels
    const vy = neck[1] + 0.13 * h;
    g.fillStyle = C.shirt; g.beginPath(); g.moveTo(cx - 0.034 * h, neck[1] + 0.002 * h); g.lineTo(cx + 0.03 * h, neck[1] + 0.002 * h); g.lineTo(cx + 0.004 * h, vy); g.closePath(); g.fill(); g.strokeStyle = INKC; g.lineWidth = lw * 0.8; g.stroke();
    g.fillStyle = C.tie; g.beginPath(); g.moveTo(cx - 0.008 * h, neck[1] + 0.008 * h); g.lineTo(cx + 0.008 * h, neck[1] + 0.008 * h); g.lineTo(cx + 0.009 * h, neck[1] + 0.022 * h); g.lineTo(cx + 0.013 * h, vy + 0.004 * h); g.lineTo(cx + 0.001 * h, vy + 0.018 * h); g.lineTo(cx - 0.009 * h, vy + 0.002 * h); g.lineTo(cx - 0.006 * h, neck[1] + 0.022 * h); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = INKC; g.lineWidth = lw; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 0.036 * h, neck[1] - 0.002 * h); g.lineTo(cx + s * 0.05 * h, neck[1] + 0.05 * h); g.lineTo(cx + 0.004 * h, vy + 0.03 * h); g.stroke(); }
    g.beginPath(); g.moveTo(cx + 0.004 * h, vy + 0.03 * h); g.lineTo(lerp(cx, hip[0] + nrm[0] * hw * 0.6, 1), hip[1] - sp[1] * hem * 0.6); g.stroke();
    g.fillStyle = INKC; g.beginPath(); g.arc(cx + 0.006 * h, vy + 0.07 * h, 0.005 * h, 0, Math.PI * 2); g.fill();
  } else if (o.who === 'eren') {
    // a dark high collar, two harness straps and a belt
    g.strokeStyle = C.strap; g.lineWidth = 0.011 * h; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 0.03 * h, neck[1] + 0.01 * h); g.lineTo(lerp(cx, hip[0], 0.9) + s * 0.03 * h, hip[1] - 0.02 * h); g.stroke(); }
    g.strokeStyle = INKC; g.lineWidth = lw * 0.6; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 0.03 * h - 0.0055 * h, neck[1] + 0.01 * h); g.lineTo(lerp(cx, hip[0], 0.9) + s * 0.03 * h - 0.0055 * h, hip[1] - 0.02 * h); g.stroke(); }
    g.strokeStyle = C.strap; g.lineWidth = 0.014 * h; g.beginPath(); g.moveTo(hip[0] - nrm[0] * hw, hip[1] - 0.012 * h); g.lineTo(hip[0] + nrm[0] * hw, hip[1] - 0.012 * h); g.stroke();
    g.fillStyle = '#c9c2b0'; rr(g, hip[0] + nrm[0] * 0.01 * h - 0.012 * h, hip[1] - 0.022 * h, 0.024 * h, 0.02 * h, 0.004 * h); g.fill();
  }
  // Eren's cloak: the cape over the shoulders and the gathered hood
  if (C.cloak) {
    const P = () => { g.beginPath(); g.moveTo(shoB[0] - f * 0.045 * h, shoB[1] + 0.03 * h); g.quadraticCurveTo(neck[0] - f * 0.02 * h, neck[1] - 0.035 * h, shoF[0] + f * 0.055 * h, shoF[1] + 0.02 * h);
      g.quadraticCurveTo(shoF[0] + f * 0.07 * h, shoF[1] + 0.07 * h, shoF[0] + f * 0.04 * h, shoF[1] + 0.1 * h); g.quadraticCurveTo(neck[0], neck[1] + 0.12 * h, shoB[0] - f * 0.06 * h, shoB[1] + 0.1 * h); g.closePath(); };
    cel(g, P, C.cloak, C.cloakDk, lx, ly, lw, true);
    const hood = () => { g.beginPath(); g.ellipse(neck[0] - f * 0.045 * h, neck[1] + 0.006 * h, 0.06 * h, 0.034 * h, -f * 0.45, 0, Math.PI * 2); };
    cel(g, hood, shade(C.cloak, -0.1), C.cloakDk, lx * 0.5, ly, lw, true);
    g.fillStyle = '#c9b089'; g.beginPath(); g.arc(neck[0] + f * 0.02 * h, neck[1] + 0.03 * h, 0.008 * h, 0, Math.PI * 2); g.fill(); g.strokeStyle = INKC; g.lineWidth = lw * 0.6; g.stroke();
  }
  // head
  drawHead(g, head, L.R, f, ht, o, C, lw);
  // front arm
  const rA = arm(shoF, p.rSh, p.rEl, false);
  // rain drips (wet)
  if (o.wet && o.t !== undefined) { g.strokeStyle = 'rgba(235,245,255,0.8)'; g.lineWidth = lw * 0.6; for (let k = 0; k < 5; k++) { const ph = ((o.t * 1.3 + k * 0.37) % 1); const xx = head[0] + f * (k - 2) * 0.03 * h, yy = head[1] + L.R * 0.9 + ph * 0.25 * h; g.globalAlpha = 1 - ph; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 0.012 * h); g.stroke(); } g.globalAlpha = 1; }
  FIGSIL = 0;
  return { head, R: L.R, neck, hip, sho, lHand: lA.q, rHand: rA.q, lElbow: lA.e, rElbow: rA.e, lFoot: lL.q, rFoot: rL.q, h };
}

// the head in three-quarter view, in R units, +x = the way the figure faces
function headPath(g) {
  g.beginPath(); g.moveTo(0.05, -1.08);
  g.quadraticCurveTo(0.72, -1.04, 0.84, -0.5); g.quadraticCurveTo(0.9, -0.18, 0.86, 0.06); g.quadraticCurveTo(0.94, 0.24, 0.88, 0.4);
  g.quadraticCurveTo(0.78, 0.7, 0.5, 0.92); g.quadraticCurveTo(0.36, 1.0, 0.22, 0.92); g.quadraticCurveTo(-0.05, 0.74, -0.3, 0.5);
  g.quadraticCurveTo(-0.42, 0.38, -0.62, 0.32); g.quadraticCurveTo(-0.98, 0.1, -0.95, -0.42); g.quadraticCurveTo(-0.8, -1.0, 0.05, -1.08); g.closePath();
}
function drawHead(g, c, R, f, ht, o, C, lw) {
  g.save(); g.translate(c[0], c[1]); g.rotate(ht * 0.5); g.scale(f * R, R);
  const LW = lw / R, ldl = (o.ld ?? -f) * f;   // light side in local units
  const who = o.who || 'extra';
  if (!o.back) {
    if (who === 'eren') hairEren(g, C.hair, LW, 'back', o);
    if (who === 'light') hairLight(g, C.hair, LW, 'back');
  }
  cel(g, () => headPath(g), SKIN, shade(SKIN, -0.3), ldl * 0.06, 0, LW);
  // drama: a hard manga shadow over the half of the face away from the light (o.drama 0..1)
  if (o.drama > 0) { g.save(); headPath(g); g.clip(); g.globalAlpha = o.drama; g.fillStyle = '#17141a'; g.beginPath();
    const B = [[0.5, -1.3], [0.4, -0.2], [0.58, 0.3], [0.44, 0.58], [0.5, 1.3]], far = ldl > 0 ? -3 : 3;
    g.moveTo(far, -1.3); for (const q of B) g.lineTo(q[0], q[1]); g.lineTo(far, 1.3); g.closePath(); g.fill(); g.restore(); }
  // the shadow the jaw throws on the neck side and a cheek blush line
  cel(g, () => { g.beginPath(); g.ellipse(-0.3, 0.18, 0.13, 0.2, 0.12, 0, Math.PI * 2); }, SKIN, shade(SKIN, -0.3), ldl * 0.04, 0, LW * 0.9);
  g.strokeStyle = INKC; g.lineWidth = LW * 0.6; g.beginPath(); g.arc(-0.3, 0.18, 0.07, -0.8, 1.6); g.stroke();
  if (o.back) { hairBack(g, C.hair, LW, who); g.restore(); return; }
  face(g, o, C, LW, 'eyes');
  if (who === 'eren') hairEren(g, C.hair, LW, 'front', o);
  else if (who === 'light') hairLight(g, C.hair, LW, 'front');
  else hairShort(g, C.hair, LW);
  face(g, o, C, LW, 'brows');
  if (o.glow > 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (const [ex, ey, r] of [[0.33, 0.16, 0.75], [0.74, 0.15, 0.55]]) { const gr = g.createRadialGradient(ex, ey, 0, ex, ey, r); gr.addColorStop(0, who === 'light' ? `rgba(255,40,48,${0.95 * o.glow})` : `rgba(60,255,160,${0.95 * o.glow})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(ex - r, ey - r, 2 * r, 2 * r); } g.restore(); }
  g.restore();
}
function face(g, o, C, LW, part) {
  const open = (o.open ?? 1) * (o.blink ? 0.06 : 1), lk = Object.assign({ lx: 0, ly: 0 }, o.look || {});
  const who = o.who || 'extra', brow = o.brow ?? (who === 'eren' ? -0.45 : 0);
  const narrow = who === 'light' ? 0.84 : 1;
  const ey = 0.16;
  // each eye is drawn in its own frame with the OUTER corner toward +x: the near eye's outer corner faces the ear
  // (mirrored), the far eye's faces the front edge of the face
  const eyes = [[0.33, ey, 0.36, 0.23, true], [0.74, ey - 0.01, 0.16, 0.2, false]];
  if (part === 'brows') {
    if (FIGSIL) return;
    g.fillStyle = INKC;
    for (const [bx, by, bw, , near] of eyes) { g.save(); g.translate(bx, by); g.scale(near ? -1 : 1, 1);
      const yi = -0.31 - brow * 0.12, yo = -0.3 + brow * 0.02, ym = -0.39;   // inner (nose side, -x) / outer (+x)
      g.beginPath(); g.moveTo(-bw * 0.5, yi); g.quadraticCurveTo(bw * 0.05, ym - 0.03, bw * 0.55, yo); g.quadraticCurveTo(bw * 0.05, ym + 0.025, -bw * 0.5, yi + 0.016); g.closePath(); g.fill(); g.restore(); }
    return;
  }
  const eye = (cx, cy, w, hh0, near) => {
    const hh = hh0 * open * narrow, sx = near ? -1 : 1;
    g.save(); g.translate(cx, cy); g.scale(sx, 1);
    const P = () => { g.beginPath(); g.moveTo(-w / 2, 0.02); g.quadraticCurveTo(w * 0.08, -hh * 1.3, w / 2, -hh * 0.3); g.quadraticCurveTo(-w * 0.08, hh * 0.95, -w / 2, 0.02); g.closePath(); };
    if (hh > 0.025) {
      g.save(); P(); g.clip();
      // an intense or worried brow cuts the top of the eye (inner side = -x)
      if (brow !== 0) { const k = brow * 0.55, yc = -hh * 0.78; g.beginPath(); g.moveTo(-1, yc - k); g.lineTo(1, yc + k); g.lineTo(1, 1); g.lineTo(-1, 1); g.closePath(); g.clip(); }
      P(); g.fillStyle = '#ffffff'; g.fill();
      const ix = -w * 0.04 + lk.lx * sx * w * 0.24, iy = -hh * 0.05 + lk.ly * hh * 0.3, ir = near ? 0.13 : 0.1;
      const gr = g.createLinearGradient(0, iy - ir * 1.2, 0, iy + ir * 1.2); gr.addColorStop(0, C.irisDk); gr.addColorStop(0.45, C.iris); gr.addColorStop(1, shade(C.iris, 0.35));
      g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy, ir * (near ? 0.86 : 0.6), ir * 1.12, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = C.irisDk; g.lineWidth = LW * 0.8; g.stroke();
      g.fillStyle = '#0a0809'; g.beginPath(); g.ellipse(ix, iy - ir * 0.05, ir * 0.36 * (near ? 1 : 0.7), ir * 0.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(0, -hh * 1.05, w * 0.7, hh * 0.45, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix + sx * ir * 0.32, iy - ir * 0.45, ir * 0.22, ir * 0.3, -0.4 * sx, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(ix - sx * ir * 0.3, iy + ir * 0.45, ir * 0.1, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    if (!FIGSIL) {
      g.strokeStyle = INKC; g.fillStyle = INKC; g.lineCap = 'round';
      const hk = Math.max(hh, 0.025);
      g.beginPath(); g.moveTo(-w / 2 - 0.01, 0.035); g.quadraticCurveTo(w * 0.1, -hk * 1.36 - 0.035, w / 2 + 0.05, -hk * 0.34 - 0.025);
      g.lineTo(w / 2 + 0.02, -hk * 0.26); g.quadraticCurveTo(w * 0.1, -hk * 1.3, -w / 2, 0.04); g.closePath(); g.fill();
      g.lineWidth = LW * 1.1; g.beginPath(); g.moveTo(w / 2 + 0.03, -hk * 0.3); g.lineTo(w / 2 + 0.11, -hk * 0.4 - 0.04); g.moveTo(w / 2, -hk * 0.5); g.lineTo(w / 2 + 0.06, -hk * 0.7 - 0.05); g.stroke();
      if (hh > 0.025) { g.lineWidth = LW * 0.75; g.beginPath(); g.moveTo(w * 0.25, hh * 0.78); g.quadraticCurveTo(-w * 0.12, hh * 0.9, -w * 0.44, hh * 0.18); g.stroke(); }
      g.lineWidth = LW * 0.6; g.beginPath(); g.moveTo(w * 0.3, -hk * 1.55 - 0.04); g.quadraticCurveTo(-w * 0.1, -hk * 1.75 - 0.05, -w * 0.42, -hk * 0.95 - 0.04); g.stroke();
    }
    g.restore();
  };
  for (const e of eyes) eye(...e);
  if (FIGSIL) {   // in silhouette only the eyes, and a pale line of the mouth when it moves, read
    const mx = 0.58, my = 0.66, tk = o.talk || 0, m = o.mouth || 'flat';
    g.strokeStyle = FIGRIM; g.fillStyle = FIGRIM; g.lineWidth = LW * 1.1;
    if (tk > 0.05) { g.beginPath(); g.ellipse(mx, my + 0.01, 0.07 + tk * 0.02, 0.012 + tk * 0.05, 0, 0, Math.PI * 2); g.fill(); }
    else if (m === 'smirk' || m === 'grin' || m === 'smile') { g.beginPath(); g.moveTo(mx - 0.1, my); g.quadraticCurveTo(mx + 0.02, my + (m === 'grin' ? 0.08 : 0.04), mx + 0.13, my - 0.06); g.stroke(); }
    return;
  }
  g.strokeStyle = INKC;
  if (who === 'eren') { g.lineWidth = LW * 0.6; g.beginPath(); g.moveTo(0.2, ey + 0.25); g.quadraticCurveTo(0.34, ey + 0.31, 0.5, ey + 0.23); g.stroke(); }
  // nose: a small hooked stroke and a nostril dot
  g.lineWidth = LW * 0.9; g.beginPath(); g.moveTo(0.88, 0.27); g.quadraticCurveTo(0.97, 0.38, 0.88, 0.42); g.stroke();
  // mouth
  const mx = 0.58, my = 0.66, tk = o.talk || 0, m = o.mouth || 'flat';
  g.lineWidth = LW * 1.1; g.fillStyle = '#3a1416';
  if (tk > 0.05) { g.beginPath(); g.moveTo(mx - 0.1 - tk * 0.02, my); g.quadraticCurveTo(mx, my - 0.03, mx + 0.11 + tk * 0.02, my - 0.01); g.quadraticCurveTo(mx + 0.02, my + 0.04 + tk * 0.14, mx - 0.1 - tk * 0.02, my); g.closePath(); g.fill(); g.stroke();
    if (tk > 0.5) { g.fillStyle = '#ffffff'; g.fillRect(mx - 0.06, my - 0.012, 0.13, 0.025); } }
  else if (m === 'smirk') { g.beginPath(); g.moveTo(mx - 0.1, my + 0.01); g.quadraticCurveTo(mx + 0.04, my + 0.035, mx + 0.13, my - 0.06); g.stroke(); g.lineWidth = LW * 0.6; g.beginPath(); g.moveTo(mx + 0.12, my - 0.08); g.lineTo(mx + 0.15, my - 0.03); g.stroke(); }
  else if (m === 'smile') { g.beginPath(); g.moveTo(mx - 0.12, my - 0.02); g.quadraticCurveTo(mx, my + 0.07, mx + 0.13, my - 0.03); g.stroke(); }
  else if (m === 'frown') { g.beginPath(); g.moveTo(mx - 0.1, my + 0.03); g.quadraticCurveTo(mx, my - 0.03, mx + 0.11, my + 0.03); g.stroke(); }
  else if (m === 'grit') { g.fillStyle = '#ffffff'; rr(g, mx - 0.11, my - 0.03, 0.22, 0.07, 0.02); g.fill(); g.stroke(); g.beginPath(); g.moveTo(mx - 0.11, my + 0.005); g.lineTo(mx + 0.11, my + 0.005); g.stroke(); }
  else if (m === 'open') { g.beginPath(); g.ellipse(mx, my + 0.03, 0.08, 0.09, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
  else if (m === 'grin') { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(mx - 0.15, my - 0.04); g.quadraticCurveTo(mx, my + 0.12, mx + 0.16, my - 0.08); g.closePath(); g.fill(); g.stroke(); g.lineWidth = LW * 0.5; for (const k of [-0.06, 0, 0.06]) { g.beginPath(); g.moveTo(mx + k, my - 0.04); g.lineTo(mx + k, my + 0.03); g.stroke(); } }
  else { g.beginPath(); g.moveTo(mx - 0.09, my); g.lineTo(mx + 0.1, my - 0.006); g.stroke(); }
  if (o.sweat) { g.fillStyle = 'rgba(220,240,255,0.95)'; const sx = -0.05, sy = -0.3 + (o.sweat % 1) * 0.5; g.beginPath(); g.moveTo(sx, sy - 0.12); g.quadraticCurveTo(sx + 0.08, sy, sx, sy + 0.05); g.quadraticCurveTo(sx - 0.08, sy, sx, sy - 0.12); g.fill(); g.strokeStyle = INKC; g.lineWidth = LW * 0.6; g.stroke(); }
}
// a closed outline through points [x, y, sharp?]: sharp points are corners (lock tips), the rest are smoothed
function blob(g, pts) {
  const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  g.beginPath(); const s0 = pts[0][2] ? pts[0] : mid(pts[n - 1], pts[0]); g.moveTo(s0[0], s0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; if (p[2]) g.lineTo(p[0], p[1]); else { const m = q[2] ? q : mid(p, q); g.quadraticCurveTo(p[0], p[1], m[0], m[1]); } }
  g.closePath();
}
// a hair shape: fill, cel shadow, ink outline, strand lines, a broken shine band
function hairFill(g, P, col, LW, shine, strands) {
  cel(g, P, col, shade(col, -0.5), 0.12, -0.06, LW);
  g.save(); P(); g.clip();
  if (strands) { g.strokeStyle = shade(col, -0.6); g.lineWidth = LW * 0.55; g.beginPath(); strands(); g.stroke(); }
  if (shine === 'ring') { g.strokeStyle = FIGSIL ? 'rgba(246,241,230,0.35)' : 'rgba(255,255,255,0.85)'; g.lineCap = 'round';
    for (const [a0, a1, r, wdt] of [[-2.5, -2.05, 0.8, 0.07], [-1.95, -1.45, 0.84, 0.08], [-1.35, -1.0, 0.8, 0.06]]) { g.lineWidth = wdt; g.beginPath(); g.ellipse(0, -0.12, r, r * 0.92, 0, a0, a1); g.stroke(); } }
  else if (shine) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.06; g.beginPath(); shine(); g.stroke(); }
  g.restore();
}
function hairLight(g, col, LW, part) {
  if (part === 'back') return;
  const P = [[-0.42, 0.48], [-0.62, 0.66, 1], [-0.74, 0.46], [-0.9, 0.58, 1], [-0.95, 0.3], [-1.08, 0.0], [-1.06, -0.5], [-0.8, -1.0], [-0.25, -1.24], [0.4, -1.2], [0.86, -0.92], [1.04, -0.55], [1.06, -0.25],
    [0.99, 0.02, 1], [0.88, -0.28], [0.76, 0.0, 1], [0.64, -0.3], [0.5, -0.04, 1], [0.38, -0.32], [0.26, -0.08, 1], [0.16, -0.24], [0.1, 0.14], [0.08, 0.52, 1], [-0.06, 0.22], [-0.2, 0.0], [-0.3, 0.2]];
  hairFill(g, () => blob(g, P), col, LW, 'ring',
    () => { for (const [x0, y0, x1, y1] of [[-0.2, -1.2, 0.5, -0.16], [0.15, -1.25, 0.78, -0.12], [0.5, -1.15, 1.05, -0.08], [-0.6, -1.0, -0.05, 0.45], [-0.9, -0.7, -0.78, 0.6], [-1.1, -0.3, -1.1, 0.4]]) { g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 0.15, (y0 + y1) / 2 - 0.05, x1, y1); } });
}
function hairEren(g, col, LW, part, o) {
  const sw = o && o.t !== undefined ? Math.sin(o.t * 2.3) * 0.04 * (o.wind ?? 0.4) : 0;
  if (part === 'back') {
    hairFill(g, () => { g.beginPath(); g.moveTo(-0.3, -0.9); g.quadraticCurveTo(-1.14, -0.6, -1.08, 0.3); g.quadraticCurveTo(-1.02, 0.9, -0.84 + sw, 1.3); g.lineTo(-0.7, 0.92); g.lineTo(-0.56, 1.16 + sw); g.quadraticCurveTo(-0.5, 0.6, -0.42, 0.2); g.closePath(); }, col, LW, null, () => { g.moveTo(-1.0, -0.4); g.quadraticCurveTo(-1.05, 0.5, -0.86, 1.2); g.moveTo(-0.8, -0.2); g.quadraticCurveTo(-0.8, 0.5, -0.66, 1.0); });
    hairFill(g, () => { g.beginPath(); g.ellipse(-0.78, -0.76, 0.3, 0.27, -0.5, 0, Math.PI * 2); }, col, LW, () => { g.moveTo(-0.96, -0.88); g.quadraticCurveTo(-0.86, -1.07, -0.65, -1.0); });
    return;
  }
  const P = [[-0.5, 0.35], [-0.84, 0.4], [-1.06, -0.05], [-0.98, -0.62], [-0.6, -1.2], [0.15, -1.22], [0.8, -1.04], [1.08, -0.56], [1.15, -0.05], [1.06 + sw, 0.56, 1], [0.99, 0.02], [0.9, -0.28], [0.74, -0.42],
    [0.6, -0.16, 1], [0.48, -0.44], [0.3, -0.5], [0.18, -0.2], [0.12, 0.4], [0.03 + sw, 0.96, 1], [-0.08, 0.4], [-0.18, 0.05], [-0.36, 0.25]];
  hairFill(g, () => blob(g, P), col, LW, 'ring',
    () => { for (const [x0, y0, x1, y1] of [[0.1, -1.1, 1.0, -0.2], [0.3, -1.1, 1.06, 0.5], [-0.2, -1.1, 0.4, -0.45], [-0.5, -0.95, 0.06, 0.8], [-0.8, -0.7, -0.6, 0.3]]) { g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 0.12, (y0 + y1) / 2 - 0.08, x1, y1); } });
  g.strokeStyle = '#d8cfbd'; g.lineWidth = 0.07; g.beginPath(); g.moveTo(-0.58, -0.64); g.lineTo(-0.7, -0.5); g.stroke();
}
function hairShort(g, col, LW) {
  hairFill(g, () => { g.beginPath(); g.moveTo(-0.8, 0.42); g.quadraticCurveTo(-1.14, -0.1, -0.94, -0.64); g.quadraticCurveTo(-0.6, -1.16, 0.15, -1.14); g.quadraticCurveTo(0.86, -1.06, 0.98, -0.5); g.quadraticCurveTo(0.7, -0.6, 0.3, -0.58); g.quadraticCurveTo(0.12, -0.4, 0.06, 0.1); g.quadraticCurveTo(-0.3, 0.1, -0.8, 0.42); g.closePath(); }, col, LW, () => { g.moveTo(-0.6, -0.76); g.quadraticCurveTo(0.0, -0.98, 0.5, -0.84); });
}
function hairBack(g, col, LW, who) {
  hairFill(g, () => { g.beginPath(); g.moveTo(-0.95, 0.5); g.quadraticCurveTo(-1.15, -0.6, -0.4, -1.12); g.quadraticCurveTo(0.6, -1.25, 0.98, -0.4); g.quadraticCurveTo(1.05, 0.2, 0.85, 0.55); g.quadraticCurveTo(0, 0.75, -0.95, 0.5); g.closePath(); }, col, LW);
  if (who === 'eren') hairFill(g, () => { g.beginPath(); g.ellipse(0, -0.92, 0.34, 0.3, 0, 0, Math.PI * 2); }, col, LW);
}

// the two leads, with their defaults
function light(g, t, o) { return drawFig(g, Object.assign({ who: 'light', f: 1, t, blink: blinkAt(t, 2), talk: talkAt(t, 'l') }, o)); }
function eren(g, t, o) { return drawFig(g, Object.assign({ who: 'eren', f: -1, t, blink: blinkAt(t, 5), talk: talkAt(t, 'e') }, o)); }
const blinkAt = (t, seed) => { const p = 3.3 + hash(seed) * 1.9, ph = (t + hash(seed + 9) * 3) % p; return ph < 0.11; };
