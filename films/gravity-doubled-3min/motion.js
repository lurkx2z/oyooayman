/* =====================================================================
   MOTION — footsteps and leg IK for the hybrid characters (3-minute film; film-side, built on rig.js).
   The 61 s film only had people sitting, standing up over planted feet and taking one step. This film needs people
   who walk, climb stairs and push a bicycle up a ramp, so feet are planned as world-space FOOTHOLDS:
     plan = [{ side: 'L'|'R', t0, t1, p: Vector3 }, …]   the foot is planted at p from t0 (lands) to t1 (lifts)
   Between two holds of the same foot it swings on an arc (it clears the step it is climbing).
   gbLegIK() then solves each leg in the body's sagittal plane (hip, knee, ankle kept flat), and gbPelvisFor() finds
   the pelvis height that both feet can reach with a little knee bend (heavy walking is low and bent).
   Everything is a pure function of time.
   ===================================================================== */

const GB_LEG = { L1: 0.41, L2: 0.395, hipDrop: 0.02, sole: 0.072, hipX: 0.088 };

// solve one leg so the ankle sits above the local sole point (sy, sz) (character-local metres, root frame)
function gbLegIK(P, side, sy, sz, opts = {}) {
  const d2r = Math.PI / 180, L1 = GB_LEG.L1, L2 = GB_LEG.L2;
  const py = 0.86 + (P.rootY || 0) - GB_LEG.hipDrop, pz = P.rootZ || 0;
  const dz = sz - pz, dy = (sy + GB_LEG.sole) - py;
  const d = MathX.clamp(Math.hypot(dz, dy), 0.12, (L1 + L2) * 0.9995);
  const cb = MathX.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1);
  const b = Math.PI - Math.acos(cb);
  const phi = Math.atan2(-dz, -dy), al = Math.atan2(L2 * Math.sin(b), L1 + L2 * Math.cos(b));
  const a = phi - al;
  P[side + 'HipX'] = a / d2r - (P.pelX || 0);
  P[side + 'KnX'] = b / d2r;
  P[side + 'AnX'] = -(a + b) / d2r + (opts.toe || 0);
  return P;
}

// the pelvis height (rootY) at which both soles can be reached with `bend` metres of knee bend left
function gbPelvisFor(soles, rootZ, bend = 0.03) {
  const R = (GB_LEG.L1 + GB_LEG.L2) * 0.985;
  let y = 1e9;
  for (const [sy, sz] of soles) { const dz = sz - rootZ; y = Math.min(y, sy + GB_LEG.sole + Math.sqrt(Math.max(0.01, R * R - dz * dz)) + GB_LEG.hipDrop); }
  return y - bend - 0.86;
}

// where each foot is at time t (world), from a foothold plan. lift = swing arc height (m)
function gbFeetAt(plan, t, lift = 0.07) {
  const out = {};
  for (const side of ['L', 'R']) {
    const holds = plan.filter((h) => h.side === side);
    let pos = holds[0].p.clone(), sw = 0;
    if (t >= holds[holds.length - 1].t0) pos = holds[holds.length - 1].p.clone();
    for (let i = 0; i < holds.length; i++) {
      const h = holds[i], n = holds[i + 1];
      if (t >= h.t0 && t <= h.t1) { pos = h.p.clone(); break; }
      if (n && t > h.t1 && t < n.t0) {
        const k = (t - h.t1) / (n.t0 - h.t1), e = Ease.inOutSine(k);
        pos = h.p.clone().lerp(n.p, e);
        // up a step: the foot rises early (before it moves over the nosing); on the flat a plain arc
        const up = Math.max(0, n.p.y - h.p.y);
        pos.y = h.p.y + (n.p.y - h.p.y) * (up > 0.02 ? Ease.outSine(Math.min(1, k * 1.6)) : e) + lift * Math.sin(Math.PI * k);
        sw = Math.sin(Math.PI * k);
        break;
      }
    }
    out[side] = { p: pos, swing: sw };
  }
  return out;
}

// footholds for walking along a path: posAt(u) → ground point (Vector3) for u ∈ [0, 1]; the body travels u = ease(t)
// between ta and tb. Returns a plan with alternating feet every stepLen metres (first foot `first`).
function gbWalkPlan(posAt, groundY, ta, tb, stepLen, opts = {}) {
  const N = 200, pts = [], cum = [0];
  for (let i = 0; i <= N; i++) pts.push(posAt(i / N));
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = cum[N], lat = opts.lat ?? 0.1, first = opts.first || 'R';
  const ease = opts.ease || ((k) => k);
  const sOfT = (t) => total * ease(MathX.clamp((t - ta) / (tb - ta), 0, 1));
  const tOfS = (s) => { let lo = ta, hi = tb; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (sOfT(m) < s) lo = m; else hi = m; } return (lo + hi) / 2; };
  const atS = (s) => { s = MathX.clamp(s, 0, total); let i = 1; while (i < N && cum[i] < s) i++; const k = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return { p: pts[i - 1].clone().lerp(pts[i], k), d: pts[i].clone().sub(pts[i - 1]).setY(0).normalize() }; };
  const nSteps = Math.max(1, Math.round(total / stepLen)), L = total / nSteps;
  const plan = [];
  // the two starting holds, side by side at the start
  const s0 = atS(0), side0 = new THREE.Vector3(s0.d.z, 0, -s0.d.x);   // right-hand normal
  const hold = (side, s, t0, t1) => {
    const a = atS(s), n = new THREE.Vector3(a.d.z, 0, -a.d.x), sg = side === 'R' ? 1 : -1;
    const p = a.p.clone().addScaledVector(n, sg * lat); p.y = groundY(p.x, p.z);
    plan.push({ side, t0, t1, p });
  };
  const other = first === 'R' ? 'L' : 'R';
  // step k (1…n) lands at s = k·L (the last step brings the feet together); a foot lifts when the body is 0.45 L past its hold
  let lastT = { R: ta, L: ta };
  const landT = (k) => tOfS(Math.min(total, (k - 0.35) * L));
  hold(first, 0, -1e3, tOfS(0.1 * L)); hold(other, 0, -1e3, tOfS(0.55 * L));
  for (let k = 1; k <= nSteps + 1; k++) {
    const side = k % 2 ? first : other;
    const sLand = Math.min(total, k * L), tl = k <= nSteps ? landT(k) + (opts.lag || 0) : landT(nSteps) + 0.45 * (tb - ta) / nSteps;
    const tLift = k < nSteps ? tOfS(Math.min(total, sLand + 0.65 * L)) : 1e9;
    hold(side, k <= nSteps ? sLand : total, tl, tLift);
    // the last step brings the trailing foot level with the leading one
    lastT[side] = tl;
  }
  plan.sort((a, b) => a.t0 - b.t0);
  plan.total = total; plan.sOfT = sOfT; plan.atS = atS;
  return plan;
}

// pose a character's legs on world footholds. The character's root is at `rootW` (world, ground under the pelvis)
// with yaw; P carries the upper-body pose. Sets P.rootY (pelvis height) and the leg angles.
function gbStandOn(C, P, feet, opts = {}) {
  C.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(C.root.matrixWorld).invert();
  const lf = feet.L.p.clone().applyMatrix4(inv), rf = feet.R.p.clone().applyMatrix4(inv);
  P.rootZ = P.rootZ || 0;
  P.rootY = gbPelvisFor([[lf.y, lf.z], [rf.y, rf.z]], P.rootZ, opts.bend ?? 0.035) + (opts.dy || 0);
  if (opts.maxRootY !== undefined) P.rootY = Math.min(P.rootY, opts.maxRootY);
  gbLegIK(P, 'L', lf.y, lf.z, { toe: 12 * feet.L.swing });
  gbLegIK(P, 'R', rf.y, rf.z, { toe: 12 * feet.R.swing });
  // a little hip abduction keeps the knees from crossing; the swing foot's knee comes forward
  P.LHipAbd = (P.LHipAbd || 0) + 3; P.RHipAbd = (P.RHipAbd || 0) + 3;
  return P;
}
