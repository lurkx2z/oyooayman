/* =====================================================================
   CAST (3-minute film) — who does what, when (pure functions of t). Helpers and the pose library come from the 61 s
   film's cast; the class below is new. (The 61 s film's description follows.)
   Inside: the hero at his breakfast (the steaming cup; the heavy lift: reach → grip → pull → hold → set down),
           the waiter behind the counter.
   Outside: the man on the bench (two attempts to stand; the second braced on the parked car's wing, then a slow
           step), a second passer-by fighting to stay upright, a jogger resting on the ground, pigeons.
   Feet: gbPlant() solves the pelvis height and position from the leg angles so the soles stay on the ground
   (the bench man rises over his planted feet instead of sliding).
   ===================================================================== */

// walk cycle overrides for a phase (0…1 per stride pair) — kept from the prototype for background people
function gbCycle(phase, kind = 'walk') {
  const a = Math.sin(phase * Math.PI * 2), b = Math.cos(phase * Math.PI * 2), jog = kind === 'jog';
  const hip = jog ? 34 : 22, kn = jog ? 70 : 38, arm = jog ? 32 : 18;
  return {
    LHipX: -hip * a - (jog ? 10 : 2), RHipX: hip * a - (jog ? 10 : 2),
    LKnX: Math.max(0, -b) * kn + 6, RKnX: Math.max(0, b) * kn + 6,
    LAnX: 8 * a, RAnX: -8 * a,
    LShX: arm * a, RShX: -arm * a, LElX: jog ? -85 : -20, RElX: jog ? -85 : -20, LShAbd: 8, RShAbd: 8,
    rootY: -Math.abs(b) * (jog ? 0.05 : 0.02), spX: jog ? 8 : 3, chY: 6 * a, pelY: -5 * a, hdX: jog ? -4 : 0,
    LFing: 0.5, RFing: 0.5,
  };
}

// keyed scalar helper: [[t, v, ease?], …] → Track (cached)
const _gbTr = new Map();
function gbTrack(id, keys) { if (!_gbTr.has(id)) _gbTr.set(id, new Track(keys)); return _gbTr.get(id); }

// plant the feet: set rootY / rootZ so the chosen sole(s) sit on the ground at local z = footZ.
// Leg chain (rig.js): hip 0.02 below the pelvis joint, thigh 0.41, shin 0.395, sole 0.072 below the ankle.
function gbFoot(P, s) {
  const d = Math.PI / 180, a = ((P.pelX || 0) + (P[s + 'HipX'] || 0)) * d, b = a + (P[s + 'KnX'] || 0) * d;
  return { y: -0.02 - 0.41 * Math.cos(a) - 0.395 * Math.cos(b), z: -0.41 * Math.sin(a) - 0.395 * Math.sin(b) };
}
function gbPlant(P, footZ, side = 'both', footZR) {
  const L = gbFoot(P, 'L'), R = gbFoot(P, 'R');
  let y, z;
  if (side === 'L') { y = L.y; z = L.z; } else if (side === 'R') { y = R.y; z = R.z; footZ = footZR ?? footZ; } else { y = Math.min(L.y, R.y); z = (L.z + R.z) / 2; }
  P.rootY = (0.072 - y) - 0.86;
  P.rootZ = footZ - z;
  return P;
}

// the hero's extra seated poses (built on the prototype's 'sit')
(function () {
  const S = GB_POSES.sit, P = (o) => Object.assign({}, S, o);
  Object.assign(GB_POSES, {
    sitRest: P({ spX: 2, chX: 2, nkX: 0, hdX: 6, hdY: 4, LShX: -36, LElX: -62, LShAbd: 12, RShX: -30, RElX: -66, RShAbd: 10 }),
    sitSettle: P({ rootY: -0.372, pelX: 3, spX: 7, chX: 5, nkX: 2, hdX: 8, hdY: 2, LShX: -32, LElX: -58, LShAbd: 10, RShX: -27, RElX: -62, LShrug: -0.012, RShrug: -0.012 }),
    sitHold: P({ rootY: -0.38, pelX: 1, spX: 6, chX: -4, nkX: 4, hdX: 8, hdZ: -2, LShX: -38, LElX: -48, RShX: -26, LShrug: 0.024, RShrug: 0.03 }),
    sitLower: P({ rootY: -0.383, pelX: 3, spX: 10, chX: 4, nkX: 5, hdX: 12, LShX: -38, LElX: -50, RShX: -28, LShrug: 0.015, RShrug: 0.018 }),
    sitRelief: P({ rootY: -0.38, pelX: 2, spX: 4, chX: -2, nkX: 0, hdX: 2, hdY: 4, LShX: -34, LElX: -60, LShAbd: 12, RShX: -28, RElX: -64, LShrug: -0.018, RShrug: -0.02 }),
  });
  // the bench man (seated on a 0.48 m bench: thighs slope slightly down, shins vertical)
  const B = { LHipX: -76, RHipX: -74, LKnX: 77, RKnX: 75, LAnX: -2, RAnX: -1, LHipAbd: 7, RHipAbd: 6, LFing: 0.4, RFing: 0.4, LThumb: 0.3, RThumb: 0.3 };
  Object.assign(GB_POSES, {
    benchSit: Object.assign({}, B, { pelX: -4, spX: 10, chX: 12, nkX: 6, hdX: 8, LShX: -34, RShX: -32, LShAbd: 8, RShAbd: 8, LElX: -40, RElX: -42, LShrug: -0.02, RShrug: -0.02 }),
    // lean forward over the feet, hands on the knees (pelvis tips forward; the thighs stay on the seat)
    benchLean: Object.assign({}, B, { pelX: 18, LHipX: -94, RHipX: -92, spX: 18, chX: 14, nkX: -6, hdX: -8, LShX: -40, RShX: -40, LShAbd: 6, RShAbd: 6, LElX: -16, RElX: -16, LShrug: 0.01, RShrug: 0.01 }),
    // the push: hips just off the seat, knees deeply bent, torso far forward (the hardest instant)
    benchPush: Object.assign({}, B, { pelX: 30, LHipX: -92, RHipX: -90, LKnX: 92, RKnX: 90, LAnX: -14, RAnX: -13, spX: 22, chX: 16, nkX: -12, hdX: -10, LShX: -34, RShX: -34, LElX: -12, RElX: -12, LShrug: 0.03, RShrug: 0.03 }),
    // half up (attempt 2): thighs at ~45°, torso still forward, right arm out to the car
    benchHalf: Object.assign({}, B, { pelX: 26, LHipX: -66, RHipX: -64, LKnX: 70, RKnX: 68, LAnX: -10, RAnX: -10, spX: 18, chX: 10, nkX: -10, hdX: -8, LShX: -30, LElX: -14, RShX: -62, RElX: -18, LShrug: 0.03, RShrug: 0.025 }),
    // up, but heavy: knees soft, shoulders down, a hand still on the car
    standBrace: { pelX: 10, LHipX: -18, RHipX: -16, LKnX: 22, RKnX: 20, LAnX: -6, RAnX: -6, LHipAbd: 7, RHipAbd: 6, spX: 12, chX: 8, nkX: -2, hdX: 2, LShX: -12, LShAbd: 8, LElX: -16, RShX: -44, RElX: -16, LShrug: -0.015, RShrug: 0.01, LFing: 0.35, RFing: 0.2, LThumb: 0.3, RThumb: 0.2 },
    standHeavy: { pelX: 6, LHipX: -12, RHipX: -12, LKnX: 16, RKnX: 16, LAnX: -4, RAnX: -4, LHipAbd: 8, RHipAbd: 8, spX: 9, chX: 8, nkX: 2, hdX: 6, LShX: -8, LShAbd: 9, LElX: -18, RShX: -8, RShAbd: 9, RElX: -18, LShrug: -0.025, RShrug: -0.025, LFing: 0.4, RFing: 0.4, LThumb: 0.3, RThumb: 0.3 },
    // the passer-by: feet wide, knees bent, a bag dragging her left arm down, the right arm out for balance
    shopBrace: { pelX: 8, LHipX: -20, RHipX: -16, LKnX: 26, RKnX: 22, LAnX: -6, RAnX: -6, LHipAbd: 13, RHipAbd: 13, spX: 12, chX: 8, nkX: -4, hdX: 4, LShX: 4, LShAbd: 4, LElX: -6, RShX: -30, RShAbd: 42, RElX: -24, LShrug: -0.03, RShrug: 0.0, LFing: 0.8, RFing: 0.3, LThumb: 0.7, RThumb: 0.3 },
    shopDip: { pelX: 14, LHipX: -34, RHipX: -26, LKnX: 46, RKnX: 36, LAnX: -12, RAnX: -10, LHipAbd: 14, RHipAbd: 14, spX: 18, chX: 12, nkX: -8, hdX: -2, hdZ: 6, LShX: 6, LShAbd: 6, LElX: -4, RShX: -52, RShAbd: 58, RElX: -14, LShrug: -0.035, RShrug: 0.01, LFing: 0.85, RFing: 0.15, LThumb: 0.75, RThumb: 0.2 },
    counterLean: Object.assign({}, GB_POSES.stand, { spX: 8, chX: 6, hdX: 6, LShX: -40, RShX: -38, LElX: -34, RElX: -36, LShAbd: 12, RShAbd: 12 }),
    counterSag: Object.assign({}, GB_POSES.stand, { rootY: -0.03, pelX: 4, spX: 14, chX: 10, hdX: 10, LKnX: 12, RKnX: 12, LHipX: -8, RHipX: -8, LShX: -44, RShX: -42, LElX: -26, RElX: -28, LShAbd: 14, RShAbd: 14, LShrug: -0.02, RShrug: -0.02 }),
  });
})();


const GB_GRIP_WRIST = new THREE.Vector3(-0.095, 0.04, 0.092);   // wrist in the cup's frame when the fingers are through the handle
