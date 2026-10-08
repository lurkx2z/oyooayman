/* =====================================================================
   CAST — the people in the leisure centre. Twice the weight on the same muscles: the runner can't hold the
   belt's pace, the lifter and his spotter can't get the bar off the safety arms, the free throw falls short,
   a man sits down halfway up the stair, the lifeguard slumps in her chair. In the water nothing changed:
   swimmers float, tread and swim as before, until one tries to climb out. The diver on the 10 m platform
   steps off rather than climb down.
   People use the shared rig (js/world/people.js); the film's looks and actions are added here (all prefixed gv).
   Masses never change: only weight.
   ===================================================================== */

Object.assign(LOOKS, {
  // the gym and the court
  gvRunner: { skin: 1, build: 'slim', shirt: '#d8426a', sleeves: 'short', pants: '#1d1f24', shoes: '#f2f0ea', sole: '#e8e4dc', hair: '#3a2416', hairStyle: 'pony' },
  gvLifter: { skin: 3, build: 'broad', shirt: '#d9822b', sleeves: 'short', pants: '#3a3f46', shoes: '#1a1a1a', sole: '#e8e4dc', hair: '#111' },
  gvSpotter: { skin: 0, build: 'broad', shirt: '#3d6b8a', sleeves: 'short', pants: '#22252a', shoes: '#2a2a2a', sole: '#e8e4dc', hair: '#5a3a22' },
  gvBell: { skin: 2, build: 'slim', shirt: '#5a8a6a', sleeves: 'short', pants: '#2a2c34', shoes: '#ececec', sole: '#e0e0e0', hair: '#1c120c', hairStyle: 'bun' },
  gvBaller: { skin: 4, build: 'avg', shirt: '#e8e6e0', sleeves: 'short', pants: '#c8321e', shoes: '#f2f0ea', sole: '#e8e4dc', hair: '#0e0b09' },
  gvMate: { skin: 1, build: 'avg', shirt: '#2b5fa8', sleeves: 'short', pants: '#1f2a3a', shoes: '#f2f0ea', sole: '#e8e4dc', hair: '#3a2a1e' },
  gvStair: { skin: 2, build: 'broad', shirt: '#7b7262', sleeves: 'short', pants: '#3a3f46', shoes: '#4a3a2c', sole: '#22201c', hair: '#8a8580' },
  // the pool deck (bare: see GV_PEOPLE)
  gvGuard: { skin: 1, build: 'slim', shirt: '#d8341e', sleeves: 'short', pants: '#c8321e', shoes: '#26282b', sole: '#26282b', hair: '#c9a46a', hairStyle: 'pony' },
  gvDad: { skin: 2, build: 'avg', shirt: '#4a6a8a', sleeves: 'short', pants: '#2f5a7a', shoes: '#26282b', sole: '#26282b', hair: '#2a1d14' },
  gvTot: { skin: 5, build: 'slim', shirt: '#e8c21c', sleeves: 'short', pants: '#e8c21c', shoes: '#f6d7bd', sole: '#f6d7bd', hair: '#c9a46a' },
  gvDeck: { skin: 0, build: 'broad', shirt: '#b8a890', sleeves: 'short', pants: '#2a3a4a', shoes: '#26282b', sole: '#26282b', hair: '#cfcac2' },
  // in the water
  gvSwimA: { skin: 1, build: 'slim', shirt: '#1f3f7a', sleeves: 'short', pants: '#1f3f7a', shoes: '#000', hair: '#3a2416', hat: { type: 'beanie', color: '#e8c21c' } },
  gvSwimB: { skin: 3, build: 'avg', shirt: '#000', sleeves: 'short', pants: '#2a2a30', shoes: '#000', hair: '#111' },
  gvSwimC: { skin: 0, build: 'slim', shirt: '#1d1f24', sleeves: 'short', pants: '#1d1f24', shoes: '#000', hair: '#c9a46a', hat: { type: 'beanie', color: '#e8e6e0' } },
  gvKidSwim: { skin: 4, build: 'slim', shirt: '#000', sleeves: 'short', pants: '#e0503a', shoes: '#000', hair: '#0e0b09' },
  gvLadder: { skin: 2, build: 'broad', shirt: '#000', sleeves: 'short', pants: '#2b5fa8', shoes: '#000', hair: '#4a3626' },
  gvDiver: { skin: 1, build: 'slim', shirt: '#b8231d', sleeves: 'short', pants: '#b8231d', shoes: '#000', hair: '#2a1d14', hairStyle: 'bun' },
});

// legs bent at the hip (a, forward) and knee (k), feet flat; sets the hip height to match (thigh 0.46, shin 0.47)
function gvLegs(p, a, k, aR = a, kR = k) {
  p.lHip = [a, 0.06]; p.rHip = [aR, 0.06]; p.lKnee = k; p.rKnee = kR; p.lFoot = a - k; p.rFoot = aR - kR;
  p.hipY = Math.min(0.46 * Math.cos(a) + 0.47 * Math.cos(k - a), 0.46 * Math.cos(aR) + 0.47 * Math.cos(kR - aR)) + 0.005;
  return p;
}

const GV_RUN_HZ = 1.45;   // stride cycles per second at 10 km/h

Object.assign(ACTIONS, {
  // the moment gravity doubles: the knees give, arms go out, then a lower, bent-kneed stance
  gvBuckle(τ, c) {
    const p = basePose(), k = Math.sin(Math.min(τ / 0.2, 1) * Math.PI / 2), d = k * (1 - 0.55 * MathX.smooth(τ, 0.3, 1.2));
    gvLegs(p, 0.12 + 0.55 * d, 0.16 + 1.0 * d, 0.1 + 0.5 * d, 0.14 + 0.92 * d);
    p.spine = 0.08 + 0.38 * d; p.neck = 0.05 + 0.1 * d; p.rootZ = -0.06 * d;
    p.lSh = [0.35 * d, 0.1 + 0.4 * d]; p.rSh = [0.3 * d, 0.1 + 0.35 * d]; p.lEl = 0.3 + 0.3 * d; p.rEl = 0.3 + 0.3 * d;
    p.headYaw = noise1(τ * 0.5, c.seedI) * 0.2;
    return p;
  },
  // standing under twice the weight: knees bent, shoulders down, breathing hard
  gvHeavy(τ, c) {
    const p = basePose(), br = Math.sin((τ + c.seed * 3) * 3.0);
    gvLegs(p, 0.2, 0.38);
    p.spine = 0.16 + br * 0.025; p.neck = 0.1 + br * 0.02; p.rootZ = -0.03;
    p.lSh = [0.08, 0.06]; p.rSh = [0.08, 0.06]; p.lEl = 0.22; p.rEl = 0.22;
    p.headYaw = noise1(τ * 0.3, c.seedI) * 0.3;
    return p;
  },
  // bent over, hands on knees, head up, chest heaving
  gvHandsKnees(τ, c) {
    const p = basePose(), br = Math.sin((τ + c.seed) * 3.6);
    gvLegs(p, 0.6, 0.62, 0.55, 0.58);
    p.spine = 0.85 + br * 0.04; p.neck = -0.4; p.rootZ = -0.08;
    p.lSh = [1.0, 0.14]; p.rSh = [1.0, 0.14]; p.lEl = 0.12; p.rEl = 0.12;
    return p;
  },
  // dumbbell curls (1 G), alternating arms
  gvCurl(τ, c) {
    const p = ACTIONS.idle(τ, c), a = 0.5 - 0.5 * Math.cos(τ * 2.6), b = 0.5 - 0.5 * Math.cos(τ * 2.6 + Math.PI);
    p.lSh = [0.12, 0.1]; p.rSh = [0.12, 0.1]; p.lEl = 0.2 + 1.9 * a; p.rEl = 0.2 + 1.9 * b; p.neck = 0.12; p.headYaw = 0;
    return p;
  },

  /* ---- the treadmill ---- */
  // running on the belt (the phase comes from time: she stays in place)
  gvRun(τ, c) {
    const p = ACTIONS.jog(τ, Object.assign({}, c, { walkPhase: τ * GV_RUN_HZ * Math.PI * 2 + c.seed * 6 }));
    p.neck = 0.02; p.headYaw = 0;
    return p;
  },
  // gravity doubles mid-stride: she grabs the side rails and hangs on, legs dragging back on the belt
  gvCling(τ, c) {
    const p = basePose(), φ = τ * 2.1 * Math.PI * 2 + c.seed * 4, s = Math.sin(φ), co = Math.cos(φ), sl = Math.min(1, τ / 0.4);
    p.hipY = 0.84 - 0.06 * sl; p.rootZ = -0.1 * sl;
    p.spine = 0.45 + 0.04 * s; p.neck = -0.3; p.headYaw = 0;
    p.lHip = [-0.3 + 0.28 * s, 0.05]; p.rHip = [-0.3 - 0.28 * s, 0.05];
    p.lKnee = 0.45 + 0.5 * Math.max(0, co); p.rKnee = 0.45 + 0.5 * Math.max(0, -co);
    p.lFoot = -0.25; p.rFoot = -0.25;
    p.lSh = [1.3, 0.38]; p.rSh = [1.3, 0.38]; p.lEl = 0.4; p.rEl = 0.4;
    return p;
  },
  // losing the rails: the knees go, arms reach after the rails, she drops onto her knees on the moving belt
  gvOffBelt(τ, c) {
    const p = basePose(), k = MathX.smooth(τ, 0, 0.3);
    p.hipY = MathX.lerp(0.8, 0.5, k); p.spine = 0.5 + 0.15 * k; p.neck = -0.35;
    p.lHip = [MathX.lerp(-0.3, 0.1, k), 0.08]; p.rHip = [MathX.lerp(-0.25, 0.05, k), 0.08];
    p.lKnee = MathX.lerp(0.6, 1.6, k); p.rKnee = MathX.lerp(0.5, 1.55, k); p.lFoot = 0.4 * k; p.rFoot = 0.4 * k;
    p.lSh = [1.7 - 0.3 * k, 0.35]; p.rSh = [1.8 - 0.4 * k, 0.3]; p.lEl = 0.2; p.rEl = 0.25;
    return p;
  },
  // sitting on the floor behind the treadmill, hands planted behind her, getting her breath
  gvFloorSit(τ, c) {
    const p = ACTIONS.sitGround(τ + 3, c), br = Math.sin(τ * 4.2);
    p.spine = 0.12 + 0.04 * br; p.neck = 0.35 + 0.03 * br; p.headYaw = 0;
    p.lSh = [-0.55, 0.25]; p.rSh = [-0.55, 0.25]; p.lEl = 0.1; p.rEl = 0.1;
    return p;
  },

  /* ---- the bench press ---- */
  // on his back on the bench, feet on the floor either side. c.s sets the arms: 0 = elbows out, the bar on the chest-high
  // safety arms; 1 = locked out above his shoulders. c.shake = straining; c.rest = arms dropped off the bar
  gvPress(τ, c) {
    const p = basePose(), s = c.s !== undefined ? c.s : 1, sh = c.shake || 0, rest = c.rest || 0, tr = Math.sin(τ * 37) * 0.05 * sh;
    p.pelvisPitch = -Math.PI / 2 + 0.04; p.hipY = 0.57;
    p.lHip = [-0.1, 0.32]; p.rHip = [-0.1, 0.32]; p.lKnee = 1.5; p.rKnee = 1.5; p.lFoot = -0.05; p.rFoot = -0.05;
    p.spine = -0.03; p.neck = 0.12 - 0.25 * sh + 0.2 * rest; p.headYaw = 0.3 * rest; p.mouth = sh;
    const fl = MathX.lerp(0.35, Math.PI / 2, s) + tr, ab = MathX.lerp(1.25, 0.28, s), el = MathX.lerp(1.65, 0.05, s) - tr;
    p.lSh = [MathX.lerp(fl, 0.15, rest), MathX.lerp(ab, 0.55, rest)]; p.rSh = [MathX.lerp(fl - tr, 0.2, rest), MathX.lerp(ab, 0.5, rest)];
    p.lEl = MathX.lerp(el, 0.3, rest); p.rEl = MathX.lerp(el + tr, 0.35, rest);
    return p;
  },
  // the spotter behind the lifter's head, bent over the bar. c.s = arm reach (solved), c.heave = lifting with his legs
  gvSpot(τ, c) {
    const p = basePose(), h = c.heave || 0, s = c.s !== undefined ? c.s : 0.5, tr = Math.sin(τ * 31) * 0.03 * h;
    gvLegs(p, 0.3 + 0.2 * (1 - h), 0.55 + 0.35 * (1 - h));
    p.spine = 0.62 - 0.14 * h; p.neck = 0.45; p.headYaw = 0; p.rootZ = -0.05;
    p.lSh = [MathX.lerp(0.75, 1.55, s) + tr, 0.1]; p.rSh = [MathX.lerp(0.75, 1.55, s) - tr, 0.1];
    p.lEl = MathX.lerp(0.75, 0.15, s); p.rEl = p.lEl;
    return p;
  },

  /* ---- the court ---- */
  // holding the ball at the waist (2 G: knees bent)
  gvHold(τ, c) {
    const p = ACTIONS.gvHeavy(τ, c);
    p.lSh = [0.55, 0.18]; p.rSh = [0.55, 0.18]; p.lEl = 1.55; p.rEl = 1.55; p.headYaw = 0; p.neck = 0;
    return p;
  },
  // a free throw: dip, rise, release at τ = 1.1, follow through
  gvShoot(τ, c) {
    const p = basePose();
    const dip = MathX.smooth(τ, 0.15, 0.7) * (1 - MathX.smooth(τ, 0.75, 1.1));
    const set = MathX.smooth(τ, 0.0, 0.55), up = MathX.smooth(τ, 0.75, 1.1);
    gvLegs(p, 0.12 + 0.45 * dip, 0.2 + 0.85 * dip);
    p.spine = 0.08 + 0.1 * dip - 0.1 * up; p.neck = -0.15 - 0.15 * up; p.headYaw = 0;
    p.rSh = [MathX.lerp(0.55, 0.95, set) + (2.75 - 0.95) * up, 0.18 - 0.1 * up]; p.rEl = MathX.lerp(1.55, 2.1, set) * (1 - up) + 0.1 * up;
    p.lSh = [MathX.lerp(0.55, 0.9, set) + (2.45 - 0.9) * up, 0.25]; p.lEl = MathX.lerp(1.55, 2.0, set) * (1 - up) + 0.4 * up;
    p.hipY += 0.04 * up * (1 - MathX.smooth(τ, 1.3, 1.7));
    return p;
  },
  // hands on his head
  gvHandsHead(τ, c) {
    const p = ACTIONS.gvHeavy(τ, c);
    p.lSh = [2.35, 0.8]; p.rSh = [2.35, 0.8]; p.lEl = 2.25; p.rEl = 2.25; p.neck = -0.2; p.headYaw = 0;
    return p;
  },

  /* ---- the stair and the deck ---- */
  // sat down on the stair halfway up: a forearm on his knee, his left hand up on the rail, chest heaving
  gvStairSit(τ, c) {
    const p = ACTIONS.sit(τ, c), br = Math.sin(τ * 3.6);
    p.spine = 0.48 + 0.04 * br; p.neck = 0.3 + 0.03 * br; p.headYaw = 0.2;
    p.rSh = [0.75, 0.2]; p.rEl = 0.5; p.lSh = [1.45, 0.62]; p.lEl = 0.45;
    return p;
  },
  // the lifeguard, slumped in her high chair
  gvGuardSlump(τ, c) {
    const p = ACTIONS.sit(τ, c), br = Math.sin(τ * 2.9);
    p.spine = 0.55 + 0.03 * br; p.spineRoll = 0.12; p.neck = 0.55; p.headRoll = 0.15; p.headYaw = 0.1;
    p.lSh = [0.1, 0.3]; p.rSh = [0.2, 0.25]; p.lEl = 0.2; p.rEl = 0.25;
    return p;
  },
  // sitting on the deck, leaning on one arm
  gvDeckSit(τ, c) {
    const p = ACTIONS.sitGround(τ + 3, c), br = Math.sin(τ * 3.2);
    p.spine = 0.2 + 0.03 * br; p.neck = 0.3; p.headYaw = noise1(τ * 0.3, c.seedI) * 0.3;
    p.rSh = [-0.5, 0.35]; p.rEl = 0.1; p.lSh = [0.6, 0.2]; p.lEl = 0.8;
    return p;
  },
  // kneeling on the deck, hands on his thighs, chest heaving, watching you
  gvDeckKneel(τ, c) {
    const p = ACTIONS.kneel(τ, c), br = Math.sin(τ * 3.3);
    p.spine = 0.62 + 0.04 * br; p.neck = -0.5; p.lSh = [1.0, 0.14]; p.rSh = [1.0, 0.14]; p.lEl = 0.1; p.rEl = 0.1; p.headYaw = 0;
    return p;
  },
  // a toddler sitting on the floor, slapping the tiles
  gvTotSit(τ, c) {
    const p = ACTIONS.sitGround(τ + 3, c), sl = Math.max(0, Math.sin(τ * 3.1));
    p.spine = 0.1; p.neck = 0.2; p.lSh = [0.9 - 0.5 * sl, 0.3]; p.rSh = [0.9 - 0.5 * Math.max(0, Math.sin(τ * 3.1 + 2)), 0.3]; p.lEl = 0.3; p.rEl = 0.3;
    return p;
  },

  /* ---- in the water ---- */
  // treading water (eggbeater legs, hands sculling): only the head and shoulders out
  gvTread(τ, c) {
    const p = basePose(), φ = τ * 2.4 + c.seed * 6, s = Math.sin(φ), co = Math.cos(φ);
    p.hipY = 0.88; p.spine = 0.1; p.neck = -0.05;
    p.lHip = [0.8 + 0.2 * s, 0.45]; p.rHip = [0.8 - 0.2 * s, 0.45]; p.lKnee = 1.35 + 0.3 * co; p.rKnee = 1.35 - 0.3 * co; p.lFoot = 0.3; p.rFoot = 0.3;
    p.lSh = [0.5, 1.15 + 0.25 * s]; p.rSh = [0.5, 1.15 - 0.25 * s]; p.lEl = 0.9; p.rEl = 0.9;
    p.headYaw = noise1(τ * 0.3, c.seedI) * 0.5;
    return p;
  },
  // floating on the back, arms out, a lazy scull
  gvFloat(τ, c) {
    const p = basePose(), s = Math.sin(τ * 1.6 + c.seed * 5);
    p.pelvisPitch = -Math.PI / 2 + 0.22; p.hipY = 0.93;
    p.lHip = [0.08, 0.22]; p.rHip = [0.04, 0.2]; p.lKnee = 0.25; p.rKnee = 0.2; p.lFoot = -0.5; p.rFoot = -0.5;
    p.lSh = [-0.05, 1.2 + 0.12 * s]; p.rSh = [-0.05, 1.2 - 0.12 * s]; p.lEl = 0.08; p.rEl = 0.08;
    p.neck = -0.25; p.spine = -0.05; p.headYaw = 0;
    return p;
  },
  // breaststroke (face down; one stroke every 1.45 s)
  gvBreast(τ, c) {
    const u = ((τ + c.seed * 1.45) / 1.45) % 1, p = basePose(), S = MathX.smooth;
    p.pelvisPitch = Math.PI / 2 - 0.12; p.hipY = 0.93;
    const pull = S(u, 0.3, 0.55), rec = S(u, 0.55, 0.72), shoot = S(u, 0.72, 0.92);
    const fl = Math.PI - (Math.PI - 1.9) * pull - (1.9 - 0.9) * rec + (Math.PI - 0.9) * shoot;
    const ab = 0.15 + 0.75 * pull - 0.6 * rec - 0.15 * shoot, el = 0.05 + 0.85 * pull + 1.4 * rec - 2.2 * shoot;
    p.lSh = [fl, ab]; p.rSh = [fl, ab]; p.lEl = el; p.rEl = el;
    const kick = S(u, 0.45, 0.72) * (1 - S(u, 0.72, 0.86));
    p.lHip = [0.55 * kick, 0.08 + 0.3 * kick]; p.rHip = [0.55 * kick, 0.08 + 0.3 * kick]; p.lKnee = 0.05 + 1.8 * kick; p.rKnee = p.lKnee; p.lFoot = -0.8; p.rFoot = -0.8;
    p.neck = 0.25 - 0.75 * S(u, 0.35, 0.55) * (1 - S(u, 0.7, 0.85)); p.spine = -0.08 - 0.12 * S(u, 0.35, 0.55) * (1 - S(u, 0.7, 0.85));
    return p;
  },
  // climbing the pool ladder, hands on the rails' curved tops. c.k = how far up (0 in the water, 1 waist out), c.shake
  gvClimb(τ, c) {
    const p = basePose(), k = c.k || 0, sh = c.shake || 0, tr = Math.sin(τ * 33) * sh;
    p.spine = 0.15 + 0.15 * k; p.neck = -0.25 + 0.45 * k; p.headYaw = 0; p.mouth = sh;
    p.lSh = [MathX.lerp(2.25, 0.45, k) + tr * 0.05, 0.42]; p.rSh = [MathX.lerp(2.25, 0.45, k) - tr * 0.05, 0.42];
    p.lEl = MathX.lerp(0.9, 0.12, k) + tr * 0.1; p.rEl = MathX.lerp(0.9, 0.12, k) - tr * 0.1;
    p.lHip = [0.15 + 0.85 * k, 0.1]; p.lKnee = 0.4 + 1.2 * k; p.rHip = [0.1 + 0.2 * k, 0.08]; p.rKnee = 0.2 + 0.3 * k; p.lFoot = 0.2; p.rFoot = 0.1;
    p.hipY = 0.93 - 0.12 * k;
    return p;
  },
  // the arms give: he drops back into the water
  gvSlipBack(τ, c) {
    const p = basePose(), k = MathX.smooth(τ, 0, 0.25);
    p.spine = 0.3 - 0.45 * k; p.neck = 0.2 - 0.5 * k;
    p.lSh = [0.5 + 1.9 * k, 0.4 + 0.2 * k]; p.rSh = [0.5 + 1.7 * k, 0.45 + 0.2 * k]; p.lEl = 0.3; p.rEl = 0.4;
    p.lHip = [0.9 - 0.3 * k, 0.15]; p.lKnee = 1.4 - 0.6 * k; p.rHip = [0.3, 0.1]; p.rKnee = 0.5;
    p.hipY = 0.85;
    return p;
  },

  /* ---- the diver ---- */
  // flattened onto the platform: on her knees, a hand on the deck
  gvPlatKneel(τ, c) {
    const p = ACTIONS.kneel(τ, c), br = Math.sin(τ * 3.0);
    p.spine = 0.62 + 0.04 * br; p.neck = 0.2; p.lSh = [1.05, 0.12]; p.rSh = [1.05, 0.12]; p.lEl = 0.1; p.rEl = 0.1; p.headYaw = 0;
    return p;
  },
  // getting up: from her knees to a heavy, bent-kneed stance
  gvPlatStand(τ, c) {
    const a = ACTIONS.gvPlatKneel(τ, c), b = ACTIONS.gvHeavy(τ, c);
    b.headYaw = 0; b.spine = 0.2; b.lSh = [0.15, 0.12]; b.rSh = [0.15, 0.12];
    return lerpPose(a, b, MathX.smooth(τ, 0.1, 1.1));
  },
  // looking back over her shoulder at the stairs behind the platform
  gvLookBack(τ, c) {
    const p = ACTIONS.gvHeavy(τ, c), k = MathX.smooth(τ, 0, 0.5) * (1 - MathX.smooth(τ, 0.95, 1.3));
    p.headYaw = 1.25 * k; p.spineYaw = 0.5 * k; p.neck = 0.05; p.lSh = [0.1, 0.15]; p.rSh = [0.25, 0.2]; p.rEl = 0.5;
    return p;
  },
  // at the edge: toes over, arms at her sides, looking down at the water
  gvEdge(τ, c) {
    const p = basePose(), br = Math.sin(τ * 3.4);
    gvLegs(p, 0.12, 0.22);
    p.spine = 0.12 + 0.02 * br; p.neck = 0.55 - 0.25 * MathX.smooth(τ, 0.7, 1.1); p.headYaw = 0;
    p.lSh = [0.05, 0.12 + 0.05 * Math.sin(τ * 2)]; p.rSh = [0.05, 0.12 + 0.05 * Math.sin(τ * 2 + 1)]; p.lEl = 0.15; p.rEl = 0.15;
    return p;
  },
  // feet first: a step off, then straight and tight, arms pinned to her sides
  gvPencil(τ, c) {
    const p = basePose(), step = 1 - MathX.smooth(τ, 0.0, 0.25), wave = Math.exp(-τ / 0.35);
    p.lHip = [0.55 * step, 0.03]; p.lKnee = 0.4 * step; p.rHip = [0, 0.03]; p.rKnee = 0.05;
    p.lFoot = 0.4; p.rFoot = 0.4;
    p.lSh = [0.4 * wave, 0.5 * wave + 0.04]; p.rSh = [0.4 * wave, 0.5 * wave + 0.04]; p.lEl = 0.1; p.rEl = 0.1;
    p.spine = -0.04; p.neck = 0.15; p.headYaw = 0;
    return p;
  },
  // under water, rising back up: arms sweeping down, a slow flutter kick
  gvRise(τ, c) {
    const p = basePose(), s = Math.sin(τ * 3.0), k = Math.sin(τ * 5.0);
    p.lSh = [0.3, 0.6 + 0.5 * s]; p.rSh = [0.3, 0.6 + 0.5 * s]; p.lEl = 0.3; p.rEl = 0.3;
    p.lHip = [0.15 + 0.2 * k, 0.05]; p.rHip = [0.15 - 0.2 * k, 0.05]; p.lKnee = 0.3; p.rKnee = 0.3; p.lFoot = -0.6; p.rFoot = -0.6;
    p.neck = -0.45; p.spine = 0.0; p.headYaw = 0;
    return p;
  },
});
Object.assign(BLEND, {
  gvBuckle: 0.08, gvHeavy: 0.7, gvHandsKnees: 0.8, gvCurl: 0.4, gvRun: 0.3, gvCling: 0.18, gvOffBelt: 0.1, gvFloorSit: 0.35,
  gvPress: 0.3, gvSpot: 0.3, gvHold: 0.5, gvShoot: 0.35, gvHandsHead: 0.5, gvStairSit: 0.5, gvGuardSlump: 0.8, gvDeckSit: 0.8, gvDeckKneel: 0.6, gvTotSit: 0.6,
  gvTread: 0.6, gvFloat: 0.9, gvBreast: 0.6, gvClimb: 0.5, gvSlipBack: 0.08, gvPlatKneel: 0.5, gvPlatStand: 0.2, gvLookBack: 0.4, gvEdge: 0.6,
  gvPencil: 0.12, gvRise: 0.5,
});

/* ---------------------------------------------------------------------
   the diver: the 10 m platform, the fall at 2 G (1.01 s, 71 km/h), down through the water in her bubbles, back up
   --------------------------------------------------------------------- */
const GV_TOWER_TOP = GV_LOW + GV_C.tower.top;
const GV_DIVER = { x: -4.5, z0: GV_C.tower.edge - 0.6, ze: GV_C.tower.edge - 0.14, vz: 0.75, deep: 3.6 };
// her feet (the rig's root) at story time t; mode 0 platform, 1 falling, 2 under water, 3 floating
function gvDiverAt(t, out) {
  const D = GV_DIVER, F = GV_FALL;
  out.x = D.x;
  if (t < F.t0) { out.y = GV_TOWER_TOP; out.z = MathX.lerp(D.z0, D.ze, MathX.smooth(t, GV.diver.edge, GV.diver.edge + 0.9)); out.mode = 0; return out; }
  const a = t - F.t0;
  if (a < F.T2) { out.y = GV_TOWER_TOP - 0.5 * GV_G * a * a; out.z = D.ze + D.vz * a; out.mode = 1; return out; }
  // in the water: she drives down (the water brakes her from 19.8 m/s), then floats back up
  const b = a - F.T2, zEnt = D.ze + D.vz * F.T2, y0 = GV_TOWER_TOP - F.h;
  const dep = D.deep * (1 - Math.exp(-b * F.v2 / D.deep)), up = MathX.smooth(b, 0.9, 4.2);
  out.y = MathX.lerp(y0 - dep, GV_WATER - 1.38, up);
  out.z = zEnt + 0.35 * (1 - Math.exp(-b / 0.5)) + 0.08 * Math.max(0, b - 3);
  // floating on her back, she sculls slowly out toward the middle of the deep end
  const f = Math.max(0, t - GV.surface);
  out.x += 2.6 * (1 - Math.exp(-f / 6)); out.z += 1.3 * (1 - Math.exp(-f / 6));
  out.mode = t < GV.surface - 0.3 ? 2 : 3;
  return out;
}

/* ---------------------------------------------------------------------
   Who is where. fn = placed by GvCast each frame (else the rig's own path/states); y = ground height; show = [from, to];
   face = degrees (0 faces −Z, 90 faces −X, 180 faces +Z); bare = what they wear ('trunks', 'suit', 'shorts');
   kid = overall scale; water = in the pool (no floor shadow; makes ripples).
   --------------------------------------------------------------------- */
const GV_GYM = [-1, 31], GV_POOLV = [17.5, 99];
const GV_PEOPLE = [
  // the gym
  { id: 'runner', look: 'gvRunner', fn: '_runner', show: GV_GYM, path: [[0, -5.45, GV_C.treadZ[1]]],
    states: [[0, 'gvRun'], [GV.g0 + 0.02, 'gvCling'], [GV.tread.slip, 'gvOffBelt'], [GV.tread.sit, 'gvFloorSit']] },
  { id: 'bell', look: 'gvBell', show: GV_GYM, path: [[0, 1.3, -4.2]], face: 175,
    states: [[0, 'gvCurl'], [GV.g0 + 0.02, 'gvBuckle'], [GV.g0 + 1.3, 'gvHeavy'], [7.5, 'gvHandsKnees']] },
  { id: 'lifter', look: 'gvLifter', fn: '_lifter', show: GV_GYM, floor: 0, path: [[0, GV_C.bench.x, GV_C.bench.barZ + 0.52 * GV_C.bench.feet]], states: [[0, 'gvPress']] },
  { id: 'spotter', look: 'gvSpotter', fn: '_spotter', show: GV_GYM, path: [[0, GV_C.bench.x, GV_C.bench.barZ - 0.66 * GV_C.bench.feet]], states: [[0, 'gvSpot']] },
  // the court
  { id: 'shooter', look: 'gvBaller', show: GV_GYM, path: [[0, GV_C.court.hoop.x + 0.05, GV_C.court.hoop.z + GV_THROW.d + 0.3]], face: 0,
    states: [[0, 'gvHold'], [GV.shot - 1.1, 'gvShoot'], [GV.shot + 1.5, 'gvHandsHead'], [GV.shot + 4.2, 'gvHeavy']] },
  { id: 'mate', look: 'gvMate', show: GV_GYM, path: [[0, GV_C.court.hoop.x - 1.1, GV_C.court.hoop.z + 6.4]], face: 15,
    states: [[0, 'gvHeavy'], [GV.shot + 1.0, 'handHead'], [GV.shot + 3.5, 'gvHandsKnees']] },
  // the stair
  { id: 'stairman', look: 'gvStair', fn: '_stairman', seat: 0.42, show: [15, 40], path: [[0, 3.3, -8.4]], states: [[0, 'gvStairSit']] },
  // the deck
  { id: 'guard', look: 'gvGuard', bare: 'shorts', fn: '_guard', seat: 0.45, show: GV_POOLV, path: [[0, GV_C.chair.x, GV_C.chair.z]], states: [[0, 'gvGuardSlump']] },
  { id: 'dad', look: 'gvDad', bare: 'trunks', y: GV_LOW, show: GV_POOLV, path: [[0, 6.4, -13.6]], face: 120, states: [[0, 'gvDeckSit']] },
  { id: 'tot', look: 'gvTot', bare: 'trunks', kid: 0.42, y: GV_LOW, show: GV_POOLV, path: [[0, 5.75, -13.95]], face: -55, states: [[0, 'gvTotSit']] },
  { id: 'deckman', look: 'gvDeck', bare: 'trunks', y: GV_LOW, show: GV_POOLV, path: [[0, 1.55, -32.5]], face: 180, states: [[0, 'gvDeckKneel']] },
  // in the water
  { id: 'floatA', look: 'gvSwimA', bare: 'suit', fn: '_floatA', water: true, show: GV_POOLV, path: [[0, -0.9, -19.6]], states: [[0, 'gvFloat']] },
  { id: 'treadB', look: 'gvSwimB', bare: 'trunks', fn: '_floatA', water: true, show: GV_POOLV, path: [[0, -3.6, -13.6]], states: [[0, 'gvFloat']] },
  { id: 'kid', look: 'gvKidSwim', bare: 'trunks', kid: 0.62, fn: '_tread', water: true, show: GV_POOLV, path: [[0, -1.0, -10.6]], states: [[0, 'gvTread']] },
  { id: 'swimC', look: 'gvSwimC', bare: 'suit', fn: '_breast', water: true, show: GV_POOLV, path: [[0, -9.1, -18.6]], states: [[0, 'gvBreast'], [31.6, 'gvTread']] },
  { id: 'ladder', look: 'gvLadder', bare: 'trunks', fn: '_ladder', water: true, show: GV_POOLV, path: [[0, GV_C.ladder.x - 0.42, GV_C.ladder.z]],
    states: [[0, 'gvClimb'], [GV.ladder.slip, 'gvSlipBack'], [GV.ladder.splash + 0.45, 'gvTread']] },
  { id: 'diver', look: 'gvDiver', bare: 'suit', fn: '_diver', water: true, show: GV_POOLV, path: [[0, GV_DIVER.x, GV_DIVER.z0]],
    states: [[0, 'gvPlatKneel'], [GV.diver.stand, 'gvPlatStand'], [GV.diver.look, 'gvLookBack'], [GV.diver.edge, 'gvEdge'], [GV.diver.step, 'gvPencil'], [GV_FALL.hit + 0.5, 'gvRise'], [GV.surface - 0.3, 'gvFloat']] },
  // her 1 G ghost: the same step off, falling at 9.81 m/s² (only halfway down when she hits the water)
  { id: 'ghost', look: 'gvDiver', bare: 'suit', fn: '_ghost', ghost: true, show: [GV.diver.step, GV_FALL.hit + 0.5], path: [[0, GV_DIVER.x, GV_DIVER.ze]],
    states: [[0, 'gvEdge'], [GV.diver.step, 'gvPencil']] },
];

// under the water line, bodies take the water's colour and the light dancing on them (seen from above and below)
function gvSubmerge(mat) {
  mat.userData.grime = 0;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCauTime = GV_CAU.uCauTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSubW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSubW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSubW; uniform float uCauTime;\n' + GV_CAU_GLSL)
      .replace('#include <color_fragment>', `#include <color_fragment>
        { float under = smoothstep(${(GV_WATER + 0.02).toFixed(3)}, ${(GV_WATER - 0.12).toFixed(3)}, vSubW.y), dd = clamp((${GV_WATER.toFixed(3)} - vSubW.y) * 0.3, 0.0, 0.7);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb * vec3(0.62, 0.9, 0.95), vec3(0.12, 0.42, 0.48), dd), under); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float under = smoothstep(${(GV_WATER + 0.02).toFixed(3)}, ${(GV_WATER - 0.12).toFixed(3)}, vSubW.y);
          totalEmissiveRadiance += vec3(0.5, 0.75, 0.85) * gvCau(vSubW.xz * 1.1 + vSubW.y * 0.3, uCauTime) * under * 0.35 * diffuseColor.rgb; }`);
  };
  mat.customProgramCacheKey = () => 'gvSubmerge';
  mat.needsUpdate = true;
}

class GvCast {
  constructor(app) {
    const scene = app.scene;
    this.people = GV_PEOPLE.map((s) => {
      const p = new Person(s, scene);
      if (s.kid) p.root.scale.setScalar(s.kid);
      if (s.bare) this._undress(p, s.bare);
      if (s.water) p.root.traverse((o) => { if (o.isMesh && !o.material.userData.gvSub) { o.material.userData.gvSub = true; gvSubmerge(o.material); } });
      return p;
    });
    this.byId = {}; for (const p of this.people) this.byId[p.spec.id] = p;
    // the ghost: see-through, unlit, no shadow
    this.ghostMat = new THREE.MeshBasicMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.45, depthWrite: false, name: 'gvGhost' });
    this.ghostMat.userData.grime = 0;
    for (const p of this.people) if (p.spec.ghost) p.root.traverse((o) => { if (o.isMesh) { o.material = this.ghostMat; o.castShadow = false; o.renderOrder = 5; } });
    this.shadows = new BlobShadows(scene, 60);
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._d = { x: 0, y: 0, z: 0, mode: 0 };
    this.hands = new THREE.Vector3();          // the shooter's hands (the ball sits in them until the release)
    this.bobs = [];                            // heads in the water (ripples)
    // the dumbbells she was curling: in her hands until gravity doubles, then dropped (2 G) onto the rubber floor
    const iron = Mat.std('#26282b', { roughness: 0.5, metalness: 0.3 }), chrome = Mat.std('#c4c9ce', { roughness: 0.22, metalness: 0.9 });
    this.bells = [0, 1].map(() => {
      const g = new THREE.Group(); scene.add(g);
      gvMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 8), chrome, g, 0, 0, 0, 0, 0, Math.PI / 2);
      for (const s of [-1, 1]) gvMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 10), iron, g, s * 0.1, 0, 0, 0, 0, Math.PI / 2);
      return g;
    });
    const bell = this.byId.bell, rel = GV.g0 + 0.12;
    bell.update(rel);
    this._bellRel = [-1, 1].map((sd) => bell.handWorld(sd, new THREE.Vector3()));
  }

  // swimwear: skin on the arms, legs and feet (and the chest, in trunks); no belt
  _undress(p, kind) {
    const j = p.j, skin = j.neck.children[0].material, bare = (g) => g.children.forEach((c) => { if (c.isMesh) c.material = skin; });
    for (const a of [j.la, j.ra]) { bare(a.sh); bare(a.el); }
    for (const l of [j.ll, j.rl]) { bare(l.kn); if (kind !== 'shorts') bare(l.ft); if (kind === 'suit') bare(l.hp); }
    if (kind === 'trunks') bare(j.spine);
    j.hips.children.forEach((c) => { if (c.isMesh && c.geometry.type === 'BoxGeometry') c.visible = false; });
  }

  _ctx(p, extra) { return Object.assign({ seed: p.seed, seedI: p.seedI, walkPhase: 0, seat: p.spec.seat }, extra || {}); }
  _place(p, t, x, y, z, yaw, ctx) {
    p.root.position.set(x, y, z); p.root.rotation.set(0, yaw, 0);
    p.apply(p.poseAt(t, ctx || this._ctx(p)));
    p.root.updateMatrixWorld(true);
  }
  _sc(p) { return p.scale * p.root.scale.y; }

  // the runner: in place on the belt; hanging on; carried off the back end (+X) at the belt's speed; sat on the floor
  _runner(p, t) {
    const T = GV.tread, xb = -5.45, belt = 0.165, end = GV_C.treadX[1] + 0.02, z = GV_C.treadZ[1];
    let x = xb, y = belt;
    if (t < GV.g0) y += 0.05 * Math.abs(Math.sin((t * GV_RUN_HZ + p.seed) * Math.PI * 2));
    else if (t < T.slip) x = xb + 0.18 * MathX.smooth(t, GV.g0, GV.g0 + 1.2) + 0.14 * MathX.smooth(t, T.look, T.slip);
    else {
      const x0 = xb + 0.32, a = t - T.slip, aEnd = (end - x0) / GV_BELT;
      if (a < aEnd) x = x0 + GV_BELT * a;
      else {
        const b = a - aEnd;
        x = end + GV_BELT * 0.16 * (1 - Math.exp(-b / 0.16));
        y = Math.max(0, belt - 0.5 * GV_G * b * b);
      }
    }
    this._place(p, t, x, y, z, -Math.PI / 2);
  }

  // the lifter: his hands follow the bar (one-parameter solve on the arm pose: the wrist just under the bar)
  _lifter(p, t) {
    const B = GV_C.bench, sc = this._sc(p), y = 0.578 - 0.57 * sc, z = B.barZ + 0.52 * B.feet, yaw = B.feet > 0 ? 0 : Math.PI, w = this._w;
    const shake = MathX.smooth(t, GV.bench.heave + 0.2, GV.bench.heave + 0.6) * (1 - MathX.smooth(t, GV.bench.drop, GV.bench.drop + 0.2)) + 0.4 * gvJolt(t, GV.g0 + 0.3, 4, 0.5) ** 2;
    const rest = MathX.smooth(t, GV.bench.drop + 0.35, GV.bench.drop + 1.2), target = gvBarY(t) - 0.035;
    const at = (s) => { this._place(p, t, B.x, y, z, yaw, this._ctx(p, { s, shake, rest })); return p.handWorld(1, w).y; };
    if (rest > 0.98) { at(0); return; }
    let s0 = 0, y0 = at(0), s1 = 1, y1 = at(1), s = 0;
    for (let i = 0; i < 3; i++) {
      s = MathX.clamp(s0 + (target - y0) * (s1 - s0) / ((y1 - y0) || 1e-4), -0.35, 1.05);
      const ys = at(s);
      if (Math.abs(ys - target) < 0.004) break;
      if ((ys - target) * (y0 - target) > 0) { s0 = s; y0 = ys; } else { s1 = s; y1 = ys; }
    }
  }

  // the spotter: hands on the bar too (the same kind of solve on his reach)
  _spotter(p, t) {
    const B = GV_C.bench, z = B.barZ - 0.66 * B.feet, yaw = B.feet > 0 ? 0 : Math.PI, w = this._w;
    const heave = MathX.smooth(t, GV.bench.heave, GV.bench.heave + 0.5) * (1 - MathX.smooth(t, GV.bench.drop, GV.bench.drop + 0.5));
    const off = MathX.smooth(t, GV.bench.drop + 0.6, GV.bench.drop + 1.6);
    const target = gvBarY(t) + 0.03 + 0.5 * off;
    const at = (s) => { this._place(p, t, B.x, 0, z, yaw, this._ctx(p, { s, heave })); return p.handWorld(1, w).y; };
    let s0 = 0, y0 = at(0), s1 = 1, y1 = at(1), s = 0.5;
    for (let i = 0; i < 2; i++) {
      s = MathX.clamp(s0 + (target - y0) * (s1 - s0) / ((y1 - y0) || 1e-4), -0.3, 1.2);
      const ys = at(s);
      if ((ys - target) * (y0 - target) > 0) { s0 = s; y0 = ys; } else { s1 = s; y1 = ys; }
    }
  }

  // sat on the 9th tread (the left side: you come down by the right-hand rail), feet two treads down
  _stairman(p, t) {
    const S = GV_C.stair, k = 9, sc = this._sc(p), seatY = -S.rise * k, zs = S.z0 - (k - 0.55) * S.run;
    this._place(p, t, 3.3, seatY + 0.08 - (p.spec.seat + 0.05) * sc, zs, Math.PI - 0.25);
  }

  // the lifeguard in her high chair (seat 1.66 m above the deck), facing the pool
  _guard(p, t) {
    const C = GV_C.chair, sc = this._sc(p);
    this._place(p, t, C.x - 0.05, GV_LOW + 1.66 + 0.09 - (p.spec.seat + 0.05) * sc, C.z, -Math.PI / 2);
  }

  // floating on her back in the lanes, drifting and turning slowly
  _floatA(p, t) {
    const sc = this._sc(p), P = p.spec.path[0], y = GV_WATER + 0.02 - 0.93 * sc + 0.012 * Math.sin(t * 1.3 + p.seed * 4);
    this._place(p, t, P[1] + 0.25 * Math.sin(t * 0.05 + p.seed), y, P[2] + 0.012 * t, 0.4 + p.seed * 2 + 0.012 * t);
  }

  // treading water (the kid nearer the shallow end)
  _tread(p, t) {
    const sc = this._sc(p), P = p.spec.path[0], y = GV_WATER - 1.47 * sc + 0.02 * Math.sin(t * 2.4 + p.seed * 6);   // (water at the chin: holding more of you out would take force)
    this._place(p, t, P[1] + 0.1 * Math.sin(t * 0.21 + p.seed * 4), y, P[2] + 0.08 * Math.sin(t * 0.17 + p.seed), 2.4 + 0.3 * Math.sin(t * 0.09 + p.seed * 3));
  }

  // breaststroke toward the shallow end (surging with each kick), then treading at the wall
  _breast(p, t) {
    const P = p.spec.path[0], t1 = 31.6, v = 0.82, u = ((t + p.seed * 1.45) / 1.45) % 1;
    const tt = Math.min(t, t1), surge = 0.09 * Math.sin(u * Math.PI * 2 - 1.2);
    const z = P[2] + v * (tt - 20) + (t < t1 ? surge : 0), sc = this._sc(p);
    if (t < t1) this._place(p, t, P[1], GV_WATER - 0.1 - 0.93 * sc + 0.03 * Math.sin(u * Math.PI * 2), z, 0);
    else this._place(p, t, P[1], MathX.lerp(GV_WATER - 0.1 - 0.93 * sc, GV_WATER - 1.38 * sc, MathX.smooth(t, t1, t1 + 0.8)), z, MathX.lerp(0, Math.PI, MathX.smooth(t, t1, t1 + 1.6)));
  }

  // the man on the ladder: holding on in the water; climbing (the higher he gets, the slower); stuck, shaking; slips back
  _ladder(p, t) {
    const L = GV.ladder, Ld = GV_C.ladder, sc = this._sc(p), yIn = GV_WATER - 1.38 * sc, yUp = -3.78;
    const k = Ease.outCubic(MathX.clamp((t - L.up) / (L.top - L.up), 0, 1)) * (t < L.slip ? 1 : 0);
    const shake = MathX.smooth(t, L.top - 0.5, L.top + 0.1) * (t < L.slip ? 1 : 0);
    let y = MathX.lerp(yIn, yUp, k) + 0.02 * Math.sin(t * 2.2) * (1 - k), x = Ld.x - 0.42 - 0.05 * k;
    if (t >= L.slip) {
      const a = t - L.slip, yf = yUp - 0.5 * GV_G * a * a, tl = Math.sqrt(2 * (yUp - (yIn - 0.35)) / GV_G);
      y = a < tl ? yf : yIn - 0.35 * Math.exp(-(a - tl) / 0.4) * Math.cos((a - tl) * 5) ;
      x = Ld.x - 0.42 - 0.12 * MathX.smooth(a, 0, 0.5);
    }
    this._place(p, t, x, y, Ld.z, Math.PI / 2, this._ctx(p, { k, shake }));
  }

  // the diver (see gvDiverAt); floating on her back at the end, drifting
  _diver(p, t) {
    const d = gvDiverAt(t, this._d), sc = this._sc(p);
    let y = d.y;
    if (t > GV.surface - 0.3) y = MathX.lerp(GV_WATER - 1.38 * sc, GV_WATER + 0.02 - 0.93 * sc, MathX.smooth(t, GV.surface - 0.3, GV.surface + 0.7)) + 0.012 * Math.sin(t * 1.3);
    this._place(p, t, d.x, y, d.z, MathX.lerp(0, -0.6, MathX.smooth(t, GV.surface - 0.3, GV.surface + 2.5)));
  }

  // the ghost (1 G): steps off with her, falls at 9.81 m/s²; fades once she has hit the water
  _ghost(p, t) {
    const D = GV_DIVER, F = GV_FALL, a = Math.max(0, t - F.t0);
    this._place(p, t, D.x + 0.3, GV_TOWER_TOP - 0.5 * GV_G0 * a * a, D.ze + D.vz * a, 0);
    this.ghostMat.opacity = 0.5 * MathX.smooth(t, F.t0, F.t0 + 0.15) * (1 - MathX.smooth(t, F.hit + 0.15, F.hit + 0.45));
  }

  update(t) {
    this.shadows.begin();
    this.bobs.length = 0;
    for (const p of this.people) {
      const S = p.spec, vis = !S.show || (t >= S.show[0] && t < S.show[1]);
      p.root.visible = vis;
      if (!vis) continue;
      if (S.fn) this[S.fn](p, t); else p.update(t);
      if (S.ghost) continue;
      if (S.water) {
        const n = p.worldOf('neck', this._v);
        if (this.bobs.length < GV_BOBS && Math.abs(n.y - GV_WATER) < 0.5) this.bobs.push([n.x, n.z, 0.008, p.seed * 6]);
        continue;
      }
      // soft contact shadows under pelvis, chest and head
      const gy = S.floor !== undefined ? S.floor : p.root.position.y, kid = S.kid || 1;
      for (const [part, r] of [['hips', 0.4], ['neck', 0.3], ['head', 0.2]]) {
        const w = p.worldOf(part, this._v), k = MathX.clamp(1 - (w.y - gy) / 1.4, 0, 1);
        if (k > 0.02) this.shadows.push(w.x, gy + 0.012, w.z, r * (1.4 - k * 0.5) * kid, 0.5 * k);
      }
    }
    this.shadows.end();
    // the shooter's hands (the ball rides in them until the release)
    const sh = this.byId.shooter;
    if (sh.root.visible) { sh.handWorld(-1, this.hands); sh.handWorld(1, this._v); this.hands.add(this._v).multiplyScalar(0.5); this.hands.y += 0.06; this.hands.z -= 0.12; }
    // the dumbbells: in her hands, then dropped at 2 G; a little bounce on the rubber
    const bell = this.byId.bell, rel = GV.g0 + 0.12;
    this.bells.forEach((g, i) => {
      g.visible = bell.root.visible;
      if (t < rel) { bell.handWorld(i ? 1 : -1, g.position); g.rotation.set(0, bell.root.rotation.y, 0); return; }
      const R = this._bellRel[i], a = t - rel, T = Math.sqrt(2 * (R.y - 0.055) / GV_G);
      g.position.set(R.x + 0.1 * (i - 0.5) * Math.min(a, T), a < T ? R.y - 0.5 * GV_G * a * a : 0.055 + 0.012 * Math.max(0, gvJolt(t, rel + T, 6, 0.05)), R.z + 0.05 * Math.min(a, T));
      g.rotation.set(0, bell.root.rotation.y + 0.3 * i * MathX.smooth(a, T, T + 0.2), 0.25 * MathX.smooth(a, 0, T));
    });
  }
}
