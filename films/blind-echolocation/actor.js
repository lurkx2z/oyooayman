/* =====================================================================
   ACTOR — blocking for the later chapters: a character follows a list of SEGMENTS (pure functions of t).
     { t0, t1, p0, p1?, yaw?, pose?, cane?, face?, hdY?, step? }
       p1 given  → she walks p0 → p1 over [t0, t1] (feet on footholds, arms swing, the cane sweeps in time)
       p1 absent → she stands at p0 facing yaw (a number or (t) => number)
     clicks: times of tongue clicks (the mouth opens a little), blinks: times
   beActor(H, t, segs, o) poses H and returns { seg, walking, tip } (tip: the cane tip, when she has one)
   ===================================================================== */

const _beActPlans = new Map();
function beActPlan(seg) {
  let plan = _beActPlans.get(seg);
  if (!plan) {
    const a = seg.p0, b = seg.p1;
    plan = gbWalkPlan((u) => new THREE.Vector3().lerpVectors(a, b, u), () => 0, seg.t0, seg.t1, seg.step || 0.5, { first: 'R', lat: 0.09, ease: seg.ease || Ease.inOutSine });
    _beActPlans.set(seg, plan);
  }
  return plan;
}
function beActor(H, t, segs, o = {}) {
  let seg = segs[0];
  for (const s of segs) if (t >= s.t0) seg = s;
  H.root.visible = true;
  const base = GB_POSES[seg.pose || 'standListen'] || GB_POSES.standListen;
  const P = Object.assign({}, base, { hdZ: 3 });
  const breath = 1.2 * Math.sin(t * 2 * Math.PI * 0.24);
  let walking = 0, feet, sweep = 0, yaw;
  if (seg.p1) {
    const plan = beActPlan(seg);
    const d = seg.p1.clone().sub(seg.p0); yaw = Math.atan2(d.x, d.z);
    const p = plan.atS(plan.sOfT(t)).p;
    H.place(p.x, 0, p.z, yaw);
    walking = MathX.window(t, seg.t0, seg.t1, 0.35, 0.35);
    // arm swing and the cane's sweep follow the steps: one side-to-side arc per stride
    const stride = (seg.step || 0.5) * 2, s = plan.sOfT(t), ph = (s / stride) * Math.PI * 2;
    P.LShX = (P.LShX || 0) + 9 * walking * Math.sin(ph); if (!seg.cane) P.RShX = (P.RShX || 0) - 9 * walking * Math.sin(ph);
    P.chY = 3 * walking * Math.sin(ph);
    sweep = Math.sin(ph + Math.PI / 2) * walking;
    if (seg.sweepAdd) sweep += seg.sweepAdd(t);   // a deliberate reach of the cane while walking (scene 10: the column)
    feet = gbFeetAt(plan, t, 0.06);
  } else {
    yaw = typeof seg.yaw === 'function' ? seg.yaw(t) : (seg.yaw ?? 0);
    H.place(seg.p0.x, 0, seg.p0.z, yaw);
    feet = { L: { p: H.root.localToWorld(new THREE.Vector3(0.1, 0, 0.02)), swing: 0 }, R: { p: H.root.localToWorld(new THREE.Vector3(-0.1, 0, -0.03)), swing: 0 } };
    if (seg.sweep) sweep = seg.sweep(t);
  }
  if (seg.cane) beCaneArm(H, P);
  P.hdY = (P.hdY || 0) + (typeof seg.hdY === 'function' ? seg.hdY(t) : seg.hdY || 0);
  P.chX = (P.chX || 0) - breath; P.LShrug = breath * 0.002; P.RShrug = breath * 0.002;
  if (seg.adjust) seg.adjust(P, t);
  if (!/^sit/.test(seg.pose || '')) gbStandOn(H, P, feet, { bend: 0.04 });   // seated poses keep their own legs
  H.applyPose(P);
  if (seg.after) seg.after(H, t);   // e.g. arm IK toward something she touches
  const F = Object.assign({}, GB_FACES[seg.face || 'listen']);
  const cl = (o.clicks || []).reduce((m, c) => Math.max(m, MathX.window(t, c - 0.12, c + 0.1, 0.08, 0.1)), 0);
  F.open = Math.max(F.open || 0, 0.12 * cl); if (cl > 0.01) F.width = 0.85;
  F.blink = (o.blinks || []).reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
  if (seg.smile) F.smile = seg.smile;
  H.applyFace(F, { x: 0, y: -0.15 });
  let tip = null;
  if (o.cane) { if (seg.cane) tip = beCaneUpdate(o.cane, H, sweep, { lift: seg.lift ? seg.lift(t) : 0 }); else o.cane.visible = false; }
  // a solid thing in the cane's way (seg.tipStop: { c: Vector3, r }): the tip stops on its surface instead of passing through
  if (tip && seg.tipStop) {
    const S = seg.tipStop, dx = tip.x - S.c.x, dz = tip.z - S.c.z, d = Math.hypot(dx, dz);
    if (d < S.r) { tip.x = S.c.x + dx / Math.max(d, 1e-4) * S.r; tip.z = S.c.z + dz / Math.max(d, 1e-4) * S.r; o.cane.position.copy(tip);
      const hand = H.worldOf('RWr').add(new THREE.Vector3(0, -0.06, 0)); o.cane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hand.sub(tip).normalize()); }
  }
  return { seg, walking, tip, sweep };
}
// the times at which a walking segment's cane tip touches down at each side of its arc (for taps in the sound)
function beCaneTaps(seg) {
  if (!seg.p1) return [];
  const plan = beActPlan(seg), stride = (seg.step || 0.5) * 2, out = [];
  for (let t = seg.t0 + 0.2; t < seg.t1 - 0.1; t += 0.01) {
    const a = (plan.sOfT(t) / stride) * Math.PI * 2, b = (plan.sOfT(t + 0.01) / stride) * Math.PI * 2;
    if (Math.floor(a / Math.PI) !== Math.floor(b / Math.PI)) out.push(t);
  }
  return out;
}

// a walking ease: speeds up over the first `a` of the walk, slows over the last `b` (steady between); k → distance
function beEaseWalk(a = 0.1, b = 0.1) {
  const n = 240, s = [0];
  for (let i = 1; i <= n; i++) { const k = (i - 0.5) / n; s.push(s[i - 1] + MathX.smooth(k, 0, a) * (1 - MathX.smooth(k, 1 - b, 1))); }
  return (k) => { const f = MathX.clamp(k) * n, i = Math.min(n - 1, Math.floor(f)); return MathX.lerp(s[i], s[i + 1], f - i) / s[n]; };
}
