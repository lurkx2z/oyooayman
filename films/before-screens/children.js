/* =====================================================================
   CHILDREN — period kids (c. 1905) on the shared people rig (js/world/people.js).
   Same joint skeleton and pose blending as the adults, with child proportions
   (bigger head, shorter limbs, ~1.25–1.45 m) and period clothes:
   knickerbockers + long stockings, short trousers + braces, sailor collars,
   waistcoats, knitted jumpers, newsboy / flat caps, straw boaters;
   girls in knee-length dresses with pinafores, ribbons, braids; boots or bare feet.
   New actions: run, runLaugh, hoopRun, reach, startle, catchIdle (+ throw / catch),
   jumpRope, sitStep, carry, hangWash, sitBench.
   ===================================================================== */

// child silhouettes (adult units; the whole body is scaled to the child's height)
BUILDS.kid = { sh: 0.44, chest: 0.33, waist: 0.31, hip: 0.31, depth: 0.215, limb: 0.9, head: 1.3 };
BUILDS.kidSlim = { sh: 0.41, chest: 0.3, waist: 0.28, hip: 0.3, depth: 0.2, limb: 0.84, head: 1.32 };
BUILDS.woman = { sh: 0.42, chest: 0.31, waist: 0.25, hip: 0.35, depth: 0.2, limb: 0.86, head: 0.95 };

// muted period palette: navy, brown, cream, faded red, olive, dusty blue, oatmeal
Object.assign(LOOKS, {
  newsboy:      { kid: true, h: 0.79, skin: 0, build: 'kid', top: '#d2c8b4', vest: '#4a4038', bottom: 'knickers', bottomColor: '#5d5246', socks: '#2f2b28', shoes: '#2a2018', hair: '#4a3220', hairStyle: 'short', hat: { type: 'newsboy', color: '#5b5650' } },
  sailor:       { kid: true, h: 0.72, skin: 5, build: 'kid', top: '#2e3d56', collar: 'sailor', collarColor: '#e8e2d4', bottom: 'shorts', bottomColor: '#2e3d56', socks: '#ddd6c8', shoes: '#1c1a19', hair: '#a8834e', hairStyle: 'short' },
  boyBare:      { kid: true, h: 0.75, skin: 2, build: 'kidSlim', top: '#dcd3be', sleeves: 'rolled', braces: '#3b2f26', bottom: 'shorts', bottomColor: '#6a5844', socks: null, shoes: 'bare', hair: '#1e1610', hairStyle: 'messy' },
  boyCap:       { kid: true, h: 0.8, skin: 1, build: 'kid', top: '#86775e', sweater: true, bottom: 'knickers', bottomColor: '#3b3b42', socks: '#4a4440', shoes: '#2a2018', hair: '#5b3f28', hairStyle: 'short', hat: { type: 'flat', color: '#4e4a44' } },
  tallBoy:      { kid: true, h: 0.84, skin: 3, build: 'kidSlim', top: '#cfc6b2', jacket: '#3e4b40', bottom: 'knickers', bottomColor: '#3e4b40', socks: '#33302c', shoes: '#1e1712', hair: '#140f0b', hairStyle: 'short', hat: { type: 'newsboy', color: '#3b3a36' } },
  braces:       { kid: true, h: 0.77, skin: 0, build: 'kid', top: '#9fb0b4', braces: '#3a2e26', bottom: 'knickers', bottomColor: '#6c5a44', socks: '#76716a', shoes: '#3a2a1e', hair: '#b08a52', hairStyle: 'messy', hat: { type: 'flat', color: '#5e5a4c' } },
  boyChores:    { kid: true, h: 0.81, skin: 4, build: 'kid', top: '#b9ae96', braces: '#2e2620', bottom: 'trousers', bottomColor: '#4c4236', shoes: '#2a2018', hair: '#120d0a', hairStyle: 'short', hat: { type: 'flat', color: '#3a3934' } },
  girlPinafore: { kid: true, h: 0.76, skin: 5, build: 'kidSlim', top: '#7c3e3a', bottom: 'dress', pinafore: '#ece6d8', socks: '#211d1b', shoes: '#1c1816', hair: '#5a3a22', hairStyle: 'long', bow: '#efe9dc' },
  girlBlue:     { kid: true, h: 0.78, skin: 0, build: 'kidSlim', top: '#52708e', bottom: 'dress', pinafore: '#e6dcc6', socks: '#2a2624', shoes: '#2a1f18', hair: '#c9a464', hairStyle: 'braids', bow: '#b4473f' },
  girlCheck:    { kid: true, h: 0.8, skin: 2, build: 'kidSlim', top: '#6f7d55', collar: 'big', collarColor: '#efe9dc', bottom: 'dress', socks: '#2b2723', shoes: '#22190f', hair: '#2a1a10', hairStyle: 'bob', bow: '#efe9dc' },
  girlSmall:    { kid: true, h: 0.7, skin: 1, build: 'kidSlim', top: '#a98a58', bottom: 'dress', pinafore: '#f0eadc', socks: '#e2dbcc', shoes: '#2a1f18', hair: '#d8b878', hairStyle: 'long', bow: '#6e86a8' },
  girlRope:     { kid: true, h: 0.78, skin: 3, build: 'kidSlim', top: '#8e5048', collar: 'big', collarColor: '#efe8d8', bottom: 'dress', socks: '#22201e', shoes: '#1c1612', hair: '#120d0a', hairStyle: 'braids', bow: '#e9e1cf' },
  girlStep1:    { kid: true, h: 0.72, skin: 0, build: 'kidSlim', top: '#5f7488', bottom: 'dress', pinafore: '#ede7da', socks: '#2a2624', shoes: '#2a1f18', hair: '#8a5a2e', hairStyle: 'long', bow: '#c4b48a', hat: { type: 'boater', color: '#d8c48e', band: '#3a4a64' } },
  girlStep2:    { kid: true, h: 0.68, skin: 5, build: 'kidSlim', top: '#b58b6a', bottom: 'dress', socks: '#e4ddcf', shoes: '#3a2a1e', hair: '#e0c48a', hairStyle: 'bun', bow: '#9c4a42', doll: true },
  boyStripe:    { kid: true, h: 0.77, skin: 1, build: 'kid', top: '#8a5848', bottom: 'knickers', bottomColor: '#2f3a4c', socks: '#3a3632', shoes: '#2a2018', hair: '#7a5230', hairStyle: 'messy', hat: { type: 'flat', color: '#5a5048' } },
  girlApron2:   { kid: true, h: 0.74, skin: 4, build: 'kidSlim', top: '#5a6e86', bottom: 'dress', pinafore: '#e8e0cc', socks: '#2a2624', shoes: '#22190f', hair: '#140e0a', hairStyle: 'braids', bow: '#d8cfb8' },
  // grown-ups
  mother:       { adult: true, h: 0.96, skin: 0, build: 'woman', top: '#5a6474', bottom: 'longdress', pinafore: '#ece6da', shoes: '#1c1816', hair: '#4a3020', hairStyle: 'bun' },
  neighbour:    { adult: true, h: 0.95, skin: 2, build: 'woman', top: '#7a5a4a', bottom: 'longdress', pinafore: '#e8e2d4', shoes: '#1c1816', hair: '#2a1a12', hairStyle: 'bun' },
  lamplighter:  { adult: true, h: 0.98, skin: 1, build: 'avg', top: '#3a3c40', jacket: '#2e3034', bottom: 'trousers', bottomColor: '#2a2a2e', shoes: '#141210', hair: '#3a2a1e', hairStyle: 'short', hat: { type: 'flat', color: '#2a2a2c' }, pole: true },
  oldMan:       { adult: true, h: 0.95, skin: 1, build: 'avg', top: '#d4ccba', vest: '#3e3a36', bottom: 'trousers', bottomColor: '#3a3632', shoes: '#1a1612', hair: '#c8c4bc', hairStyle: 'short', beard: '#d8d4cc', hat: { type: 'bowler', color: '#24211e' } },
});

/* ---- child actions (added to the shared ACTIONS table) ---- */
Object.assign(ACTIONS, {
  run(τ, c) {
    const p = basePose(), φ = c.walkPhase, s = Math.sin(φ), co = Math.cos(φ);
    p.lHip = [0.78 * s, 0.04]; p.rHip = [-0.78 * s, 0.04];
    p.lKnee = 0.3 + 1.3 * Math.max(0, co) ** 1.2; p.rKnee = 0.3 + 1.3 * Math.max(0, -co) ** 1.2;
    p.lFoot = -0.35 * Math.max(0, co); p.rFoot = -0.35 * Math.max(0, -co);
    p.lSh = [-0.85 * s, 0.14]; p.rSh = [0.85 * s, 0.14]; p.lEl = 1.35 + 0.2 * s; p.rEl = 1.35 - 0.2 * s;
    p.spine = 0.2; p.neck = -0.08; p.pelvisYaw = 0.12 * s; p.spineYaw = -0.18 * s;
    p.hipY = 0.88 + 0.06 * Math.abs(co);          // flight phase: kids bounce
    p.headYaw = noise1(τ * 0.5, c.seedI) * 0.18;
    return p;
  },
  runLaugh(τ, c) {
    const p = ACTIONS.run(τ, c);
    p.neck = -0.28 + Math.sin(τ * 9) * 0.04; p.spine = 0.1; p.headRoll = Math.sin(τ * 3.1) * 0.12;
    p.lSh[1] += 0.15; p.rSh[1] += 0.15;
    return p;
  },
  hoopRun(τ, c) {
    const p = ACTIONS.run(τ, c);
    // right arm forward and down: the stick reaches the top of the hoop rolling ahead
    p.rSh = [0.82 + 0.06 * Math.sin(c.walkPhase * 2), 0.06]; p.rEl = 0.22; p.spineYaw *= 0.4;
    return p;
  },
  reach(τ, c) {
    const p = ACTIONS.run(τ, c);
    p.rSh = [1.5, 0.1]; p.rEl = 0.08; p.spine = 0.32; p.spineYaw = -0.25;
    return p;
  },
  startle(τ, c) {
    const p = ACTIONS.run(τ, c);
    p.lSh = [0.7, 0.55]; p.rSh = [0.7, 0.55]; p.lEl = 1.6; p.rEl = 1.6; p.spine = -0.05; p.neck = -0.2;
    return p;
  },
  catchIdle(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.lKnee = p.rKnee = 0.16; p.hipY = 0.91; p.spine = 0.08;
    p.lSh = [0.35, 0.12]; p.rSh = [0.35, 0.12]; p.lEl = 0.7; p.rEl = 0.7;
    p.lHip = [0.05, 0.08]; p.rHip = [-0.05, 0.08];
    return p;
  },
  jumpRope(τ, c) {
    const p = basePose(), T = 0.52, ph = (τ + c.seed) / T, f = ph - Math.floor(ph);
    const air = Math.sin(Math.PI * f);                          // feet leave the ground as the rope passes under
    p.hipY = 0.9 + 0.09 * air; p.lKnee = p.rKnee = 0.18 + 0.32 * (1 - air); p.lHip = p.rHip = [0.12 + 0.18 * (1 - air), 0.04];
    p.lFoot = p.rFoot = 0.25 * air; p.spine = 0.08;
    const a = Math.PI * 2 * f;                                  // small wrist circles turn the rope
    p.lSh = [0.3 + 0.12 * Math.sin(a), 0.42]; p.rSh = [0.3 + 0.12 * Math.sin(a), 0.42]; p.lEl = 0.75; p.rEl = 0.75;
    return p;
  },
  sitStep(τ, c) {
    const p = ACTIONS.sit(τ, c);
    p.lKnee = p.rKnee = 1.75; p.spine = 0.22; p.neck = 0.25; p.headYaw = 0.35 * Math.sin(τ * 0.4 + c.seed * 4);
    p.lSh = [0.65, 0.05]; p.rSh = [0.7, 0.05]; p.lEl = 1.25; p.rEl = 1.2;
    return p;
  },
  carry(τ, c) {
    const p = ACTIONS.walk(τ, c);
    p.rSh = [0.04, 0.2]; p.rEl = 0.04; p.lSh = [-0.15 + p.lSh[0] * 0.3, 0.42]; p.lEl = 0.5;
    p.spineRoll = 0.09; p.spine = 0.1;
    return p;
  },
  hangWash(τ, c) {
    const p = basePose(), T = 4.2, ph = ((τ + c.seed * 3) % T) / T;
    const up = MathX.smooth(ph, 0.3, 0.42) * (1 - MathX.smooth(ph, 0.8, 0.92));
    const down = 1 - up;
    p.spine = 0.08 + 0.55 * down * MathX.smooth(ph, 0.05, 0.2); p.neck = -0.25 * up + 0.2 * down;
    p.lSh = [0.4 + 2.15 * up, 0.12]; p.rSh = [0.4 + 2.2 * up, 0.1]; p.lEl = 0.5 - 0.3 * up; p.rEl = 0.5 - 0.3 * up;
    p.lKnee = p.rKnee = 0.12 * down;
    return p;
  },
  sitBench(τ, c) {
    const p = ACTIONS.sit(τ, c);
    p.spine = -0.12; p.neck = 0.08 + 0.06 * Math.sin(τ * 0.5); p.lSh = [0.55, 0.12]; p.rSh = [0.55, 0.12]; p.lEl = 0.9; p.rEl = 0.9;
    p.headYaw = 0.5 * Math.sin(τ * 0.23 + 1.1);
    return p;
  },
});
/* ---- pocket games, workshop, celebrations ---- */
Object.assign(ACTIONS, {
  kneelWatch(τ, c) {
    const p = ACTIONS.kneel(τ, c);
    p.spine = 0.62 + Math.sin(τ * 1.3 + c.seed * 5) * 0.03; p.neck = 0.55; p.spineRoll = 0;
    p.lSh = [0.95, 0.16]; p.rSh = [0.95, 0.16]; p.lEl = 0.25; p.rEl = 0.25;     // hands on the ground in front
    p.headYaw = noise1(τ * 0.4, c.seedI) * 0.15;
    return p;
  },
  kneelShoot(τ, c) {
    const p = ACTIONS.kneelWatch(τ, c);
    p.spine = 0.85; p.neck = 0.5; p.rSh = [1.1, 0.05]; p.rEl = 0.1; p.lSh = [0.7, 0.3]; p.lEl = 0.4;
    return p;
  },
  kneelGroan(τ, c) {
    const p = ACTIONS.kneel(τ, c);
    const k = MathX.smooth(τ, 0, 0.3);
    p.spine = 0.1 - 0.25 * k; p.neck = -0.3 * k; p.lSh = [2.6 * k, 0.4]; p.rSh = [2.6 * k, 0.4]; p.lEl = 1.9 * k; p.rEl = 1.9 * k;
    return p;
  },
  kneelCheer(τ, c) {
    const p = ACTIONS.kneel(τ, c);
    const b = Math.abs(Math.sin(τ * 7));
    p.spine = 0.05; p.neck = -0.15; p.lSh = [2.5 + 0.3 * b, 0.35]; p.rSh = [2.5 + 0.3 * b, 0.35]; p.lEl = 0.3; p.rEl = 0.3; p.hipY += 0.04 * b;
    return p;
  },
  lookDown(τ, c) {
    const p = basePose();
    p.spine = 0.62; p.neck = 0.42; p.hipY = 0.88; p.lKnee = p.rKnee = 0.32; p.lHip = p.rHip = [0.32, 0.06];
    p.lSh = [0.75, 0.05]; p.rSh = [0.75, 0.05]; p.lEl = 0.45; p.rEl = 0.45;      // hands on the knees
    p.headYaw = noise1(τ * 0.4, c.seedI) * 0.2;
    return p;
  },
  cheer(τ, c) {
    const p = basePose(), b = Math.abs(Math.sin(τ * 7.5 + c.seed));
    p.hipY = 0.93 + 0.07 * b; p.lKnee = p.rKnee = 0.2 * (1 - b); p.neck = -0.2;
    p.lSh = [2.7, 0.35 + 0.2 * b]; p.rSh = [2.7, 0.35 + 0.2 * b]; p.lEl = 0.25; p.rEl = 0.25;
    return p;
  },
  squatWatch(τ, c) {
    const p = basePose();
    p.hipY = 0.42; p.lHip = [1.95, 0.32]; p.rHip = [1.95, 0.32]; p.lKnee = p.rKnee = 2.35; p.lFoot = p.rFoot = 0.55;
    p.spine = 0.55; p.neck = 0.35; p.lSh = [0.9, 0.22]; p.rSh = [0.95, 0.22]; p.lEl = 1.0; p.rEl = 0.95;
    p.headYaw = noise1(τ * 0.5, c.seedI) * 0.12;
    return p;
  },
  sitCross(τ, c) {
    const p = basePose();
    p.hipY = 0.14; p.lHip = [1.45, 0.75]; p.rHip = [1.45, 0.75]; p.lKnee = p.rKnee = 2.4; p.lFoot = p.rFoot = 0.4;
    p.spine = 0.3; p.neck = 0.3; p.lSh = [0.55, 0.2]; p.rSh = [0.55, 0.2]; p.lEl = 0.9; p.rEl = 0.9;
    p.headYaw = noise1(τ * 0.4, c.seedI) * 0.2;
    return p;
  },
  // jacks: toss the ball, sweep up jacks from the ground, catch it (tosses every 0.8 s from the start)
  jacks(τ, c) {
    const p = ACTIONS.sitCross(τ, c);
    const T = 0.8, f = ((τ + 0.35) % T) / T;
    const up = 1 - MathX.smooth(f, 0.0, 0.18) + MathX.smooth(f, 0.72, 0.95);
    const sweep = MathX.smooth(f, 0.18, 0.35) * (1 - MathX.smooth(f, 0.55, 0.72));
    p.rSh = [0.9 + 0.55 * up - 0.1 * sweep, 0.12]; p.rEl = 0.9 - 0.5 * up - 0.6 * sweep; p.spine = 0.3 + 0.35 * sweep; p.neck = 0.3 - 0.4 * up * (1 - sweep);
    return p;
  },
  benchWork(τ, c) {
    const p = basePose();
    const w = noise1(τ * 2.2, c.seedI), w2 = noise1(τ * 2.6, c.seedI + 5);
    p.spine = 0.42; p.neck = 0.45; p.lKnee = p.rKnee = 0.1;
    p.lSh = [0.95 + 0.12 * w, 0.06]; p.rSh = [0.95 + 0.12 * w2, 0.06]; p.lEl = 0.75 + 0.2 * w2; p.rEl = 0.75 + 0.2 * w;
    p.headYaw = 0.12 * w; p.spineYaw = 0.06 * w2;
    return p;
  },
  holdKiteUp(τ, c) {
    const p = basePose(), lift = MathX.smooth(τ, 0, 0.5);
    p.lSh = [MathX.lerp(0.9, 2.75, lift), 0.18]; p.rSh = [MathX.lerp(0.9, 2.75, lift), 0.18]; p.lEl = 0.25; p.rEl = 0.25;
    p.neck = -0.35 * lift; p.spine = -0.08 * lift; p.hipY = 0.93 + 0.02 * Math.sin(τ * 3);
    return p;
  },
});
/* ---- the kite, the duel ---- */
Object.assign(ACTIONS, {
  launch(τ, c) {           // arms flick up and forward as the kite is let go
    const p = basePose(), k = MathX.smooth(τ, 0, 0.25);
    p.lSh = [2.75 - 0.9 * k, 0.2]; p.rSh = [2.75 - 0.9 * k, 0.2]; p.lEl = 0.2; p.rEl = 0.2; p.neck = -0.35; p.spine = -0.05 + 0.1 * k;
    return p;
  },
  lookUp(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.neck = -0.55; p.spine = -0.12; p.headYaw = 0.15 * Math.sin(τ * 0.6 + c.seed * 4);
    if (c.seed > 0.5) { p.rSh = [2.0, 0.25]; p.rEl = 0.25; }   // some point at it
    return p;
  },
  duelStance(τ, c) {
    const p = basePose(), b = Math.sin(τ * 3 + c.seed * 5);
    p.hipY = 0.86; p.lHip = [0.35, 0.18]; p.rHip = [-0.2, 0.12]; p.lKnee = 0.45; p.rKnee = 0.3;
    p.spine = 0.12; p.spineYaw = -0.25; p.rSh = [1.25 + 0.1 * b, 0.25]; p.rEl = 0.9; p.lSh = [0.9, 0.35]; p.lEl = 1.3;
    p.hipY += 0.015 * b;
    return p;
  },
  duelSwing(τ, c) {         // a big overhead swing down and across
    const p = ACTIONS.duelStance(τ, c), k = MathX.smooth(τ, 0, 0.18), r = MathX.smooth(τ, 0.18, 0.4);
    p.rSh = [MathX.lerp(2.7, 0.7, k), 0.35 - 0.3 * k]; p.rEl = 0.5 - 0.3 * k + 0.4 * r; p.spineYaw = -0.4 + 0.7 * k; p.spine = 0.1 + 0.25 * k;
    return p;
  },
  duelBlock(τ, c) {
    const p = ACTIONS.duelStance(τ, c);
    p.rSh = [2.3, 0.6]; p.rEl = 1.3; p.lSh = [1.6, 0.2]; p.lEl = 1.0; p.spine = -0.05;
    return p;
  },
  duelLoop(τ, c) {          // two background knights trading blows
    const f = ((τ + c.seed * 2) % 1.2) / 1.2;
    return f < 0.35 ? ACTIONS.duelSwing(f * 1.2, c) : f < 0.6 ? ACTIONS.duelBlock(τ, c) : ACTIONS.duelStance(τ, c);
  },
  knightCheer(τ, c) {
    const p = ACTIONS.cheer(τ, c); p.lSh = [1.6, 0.3]; p.lEl = 1.0;   // shield arm stays up
    return p;
  },
  laughStand(τ, c) {
    const p = basePose(), b = Math.abs(Math.sin(τ * 8));
    p.spine = 0.35 + 0.1 * b; p.neck = -0.1; p.lSh = [0.5, 0.15]; p.lEl = 1.4; p.rSh = [0.6, 0.1]; p.rEl = 1.5; p.hipY = 0.9; p.lKnee = p.rKnee = 0.2;
    return p;
  },
});
/* ---- games with others, going home ---- */
Object.assign(ACTIONS, {
  turnRope(τ, c) {         // the arm nearest the rope circles at shoulder height
    const p = basePose(), a = (τ / 0.62) * Math.PI * 2;
    p.rSh = [1.0 + 0.45 * Math.sin(a), 0.35 + 0.25 * Math.cos(a)]; p.rEl = 0.4; p.lSh = [0.15, 0.12]; p.lEl = 0.3;
    p.spine = 0.05; p.lKnee = p.rKnee = 0.12; p.hipY = 0.92 + 0.01 * Math.sin(a * 2);
    return p;
  },
  countTree(τ, c) {        // forearm on the trunk, face hidden in it
    const p = basePose();
    p.spine = 0.35; p.neck = 0.55; p.rSh = [2.3, 0.1]; p.rEl = 1.9; p.lSh = [2.2, 0.15]; p.lEl = 2.0; p.lKnee = p.rKnee = 0.08;
    p.spineRoll = 0.02 * Math.sin(τ * 2.2);
    return p;
  },
  jumpLong(τ, c) {         // jumping the long rope: feet highest as it passes under (rope period 0.62 s from the state start)
    const p = basePose(), f = (τ / 0.62) % 1, air = Math.sin(Math.PI * f);
    p.hipY = 0.88 + 0.11 * air; p.lKnee = p.rKnee = 0.2 + 0.5 * (1 - air); p.lHip = p.rHip = [0.15 + 0.25 * (1 - air), 0.05]; p.lFoot = p.rFoot = 0.3 * air;
    p.lSh = [0.3, 0.35]; p.rSh = [0.3, 0.35]; p.lEl = 0.6; p.rEl = 0.6; p.spine = 0.08; p.neck = 0.1;
    return p;
  },
  hide(τ, c) {
    const p = ACTIONS.squatWatch(τ, c);
    p.spine = 0.75; p.neck = -0.1; p.headYaw = 0.35 * Math.sin(τ * 0.9 + c.seed * 3);
    return p;
  },
  hop(τ, c) {              // hopscotch: hop forward on one leg, arms out for balance, two feet on the doubles
    const p = basePose(), f = (τ / 0.42) % 1, air = Math.sin(Math.PI * f), both = Math.floor(τ / 0.42) % 3 === 2;
    p.hipY = 0.86 + 0.12 * air; p.rHip = [0.25 + 0.3 * air, 0.05]; p.rKnee = 0.35 + 0.4 * (1 - air);
    p.lHip = both ? [0.25 + 0.3 * air, 0.1] : [0.15, 0.05]; p.lKnee = both ? 0.35 + 0.4 * (1 - air) : 1.5; p.lFoot = both ? 0 : 0.4;
    p.lSh = [0.4, 0.75]; p.rSh = [0.4, 0.75]; p.lEl = 0.3; p.rEl = 0.3; p.spine = 0.15;
    return p;
  },
  wave(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.rSh = [2.6, 0.35 + 0.25 * Math.sin(τ * 9)]; p.rEl = 0.4 + 0.2 * Math.sin(τ * 9);
    return p;
  },
  callWave(τ, c) {         // hand cupped at the mouth, then a big wave: "time to come in!"
    const p = ACTIONS.idle(τ, c), k = MathX.smooth(τ, 0.8, 1.1);
    p.rSh = [MathX.lerp(1.9, 2.7, k), MathX.lerp(0.1, 0.4 + 0.25 * Math.sin(τ * 8), k)]; p.rEl = MathX.lerp(2.2, 0.4, k); p.neck = -0.12 * (1 - k);
    return p;
  },
  lampLight(τ, c) {        // the lamplighter raises his pole to the lamp, holds it there, lowers it
    const p = basePose(), up = MathX.smooth(τ, 0.2, 0.9) * (1 - MathX.smooth(τ, 2.0, 2.6));
    p.rSh = [MathX.lerp(0.6, 2.75, up), 0.12]; p.rEl = MathX.lerp(0.8, 0.15, up); p.lSh = [MathX.lerp(0.7, 2.5, up), 0.1]; p.lEl = MathX.lerp(0.9, 0.3, up);
    p.neck = -0.6 * up; p.spine = -0.1 * up;
    return p;
  },
});
Object.assign(BLEND, { run: 0.3, runLaugh: 0.3, hoopRun: 0.3, reach: 0.15, startle: 0.12, catchIdle: 0.4, jumpRope: 0.3, sitStep: 0.6, carry: 0.5, hangWash: 0.6, sitBench: 0.6,
  jumpLong: 0.2, turnRope: 0.3, countTree: 0.4, hide: 0.35, hop: 0.2, wave: 0.3, callWave: 0.4, lampLight: 0.4,
  launch: 0.15, lookUp: 0.5, duelStance: 0.35, duelSwing: 0.08, duelBlock: 0.12, duelLoop: 0.3, knightCheer: 0.25, laughStand: 0.3,
  kneelWatch: 0.4, kneelShoot: 0.25, kneelGroan: 0.2, kneelCheer: 0.15, lookDown: 0.4, cheer: 0.2, squatWatch: 0.5, sitCross: 0.5, jacks: 0.3, benchWork: 0.5, holdKiteUp: 0.3 });

/* ---- geometry shared by all children ---- */
const KidGeo = {
  ready: false,
  init() {
    if (this.ready) return;
    PersonGeo.init();
    this.newsboy = facetBall(0.13, 1.08, 0.42, 1.12, 1);
    this.flat = facetBall(0.124, 1.04, 0.3, 1.14, 1);
    this.capBrim = new THREE.BoxGeometry(0.15, 0.012, 0.07);
    this.boaterCrown = new THREE.CylinderGeometry(0.105, 0.11, 0.06, 14);
    this.boaterBrim = new THREE.CylinderGeometry(0.175, 0.175, 0.008, 18);
    this.band = new THREE.CylinderGeometry(0.112, 0.112, 0.022, 14, 1, true);
    this.bowlerDome = new THREE.SphereGeometry(0.118, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.55); this.bowlerDome.scale(1, 1.05, 1.1);
    this.bowlerBrim = new THREE.TorusGeometry(0.135, 0.018, 5, 16); this.bowlerBrim.rotateX(Math.PI / 2); this.bowlerBrim.scale(1, 1, 1.12);
    this.bowWing = new THREE.ConeGeometry(0.035, 0.07, 4); this.bowWing.rotateZ(Math.PI / 2);
    this.knot = facetBall(0.018, 1, 1, 1, 0);
    this.braid = loftGeo([[-0.2, 0.014, 0.014], [-0.15, 0.022, 0.02], [-0.06, 0.026, 0.024], [0.0, 0.02, 0.02]], 6);
    this.tuft = new THREE.ConeGeometry(0.03, 0.06, 4);
    this.eye = new THREE.SphereGeometry(0.0105, 8, 6);
    this.brow = new THREE.BoxGeometry(0.03, 0.007, 0.01);
    this.sailorBack = new THREE.BoxGeometry(0.24, 0.17, 0.012);
    this.sailorV = new THREE.BoxGeometry(0.035, 0.16, 0.01);
    this.bigCollar = new THREE.CylinderGeometry(0.1, 0.13, 0.025, 12);
    this.bib = new THREE.BoxGeometry(0.17, 0.2, 0.012);
    this.strap = new THREE.BoxGeometry(0.03, 0.32, 0.012);
    this.button = new THREE.SphereGeometry(0.008, 5, 4);
    this.band2 = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
    this.stick = new THREE.CylinderGeometry(0.009, 0.011, 0.55, 5); this.stick.translate(0, -0.275, 0);
    this.bucket = new THREE.CylinderGeometry(0.11, 0.09, 0.22, 12, 1, true);
    this.bucketBase = new THREE.CircleGeometry(0.09, 12); this.bucketBase.rotateX(Math.PI / 2);
    this.handle = new THREE.TorusGeometry(0.1, 0.006, 4, 10, Math.PI); this.handle.rotateZ(0);
    this.ropeHandle = new THREE.CylinderGeometry(0.014, 0.014, 0.1, 6);
    this.ready = true;
  },
};

class Child extends Person {
  constructor(spec, scene) {
    super(spec, scene);
  }

  _build() {
    KidGeo.init();
    const G = PersonGeo, KG = KidGeo, L = this.look, adult = !!L.adult;
    const longDress = L.bottom === 'longdress', dress = L.bottom === 'dress' || longDress;
    const BG = G.forBuild(L.build || 'kid', { jacket: !!L.jacket, coat: false, sleeves: L.sleeves === 'short' ? 'short' : 'long' });
    const B = BG.B, K = B.limb;
    this.scale = (L.h || 0.76) * (0.975 + this.seed * 0.05);
    const M = (c, r = 0.86) => Mat.std(c, { roughness: r });
    const skin = M(SKIN[L.skin % SKIN.length], 0.7);
    const top = M(L.top), hair = M(L.hair, 0.9);
    const bottom = dress ? top : M(L.bottomColor || '#4a4036');
    const socks = L.socks ? M(L.socks, 0.95) : skin;
    const shoes = L.shoes === 'bare' ? skin : M(L.shoes || '#2a2018', 0.6);
    const sole = L.shoes === 'bare' ? skin : M('#1a1410', 0.8);
    const casters = new Set([BG.pelvis, BG.torso, G.head, BG.thigh, BG.shin, BG.upperArm]);
    const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = casters.has(g); o.receiveShadow = true; parent.add(o); return o; };
    const root = new THREE.Group();
    root.name = 'person:' + (this.spec.id || '');
    const body = new THREE.Group(); body.scale.setScalar(this.scale); root.add(body);
    const hips = new THREE.Group(); body.add(hips);
    if (!dress) mesh(BG.pelvis, bottom, hips);
    const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine);
    const front = B.depth * 0.5;
    // torso (shirt / dress bodice / jumper); a jacket or waistcoat goes over it
    mesh(BG.torso, L.jacket ? M(L.jacket) : top, spine);
    if (L.jacket) mesh(new THREE.BoxGeometry(0.075, 0.36, 0.01), top, spine, 0, 0.3, front + 0.004);
    if (L.vest) {
      const vg = loftGeo([[-0.03, B.waist * 0.54, B.depth * 0.5], [0.18, B.chest * 0.54, B.depth * 0.54, 0.01], [0.42, B.sh * 0.5 - 0.085, B.depth * 0.48]], 8);
      mesh(vg, M(L.vest, 0.8), spine);
      for (let i = 0; i < 4; i++) mesh(KG.button, M('#c9b98a', 0.4), spine, 0, 0.06 + i * 0.075, front + 0.014);
    }
    if (L.sweater) mesh(KG.band2, M(L.top, 0.95), spine, 0, 0.0, 0).scale.set(B.waist * 0.54, 0.05, B.depth * 0.5);
    if (L.braces) {
      const bm = M(L.braces, 0.7);
      for (const sx of [-1, 1]) {
        mesh(KG.strap, bm, spine, sx * 0.055, 0.25, front + 0.006).rotation.z = sx * 0.08;
        mesh(KG.strap, bm, spine, sx * 0.05, 0.25, -front - 0.006).rotation.z = -sx * 0.1;
      }
    }
    if (L.collar === 'sailor') {
      const cm = M(L.collarColor, 0.8);
      mesh(KG.sailorBack, cm, spine, 0, 0.45, -front - 0.012).rotation.x = 0.12;
      for (const sx of [-1, 1]) mesh(KG.sailorV, cm, spine, sx * 0.04, 0.42, front + 0.008).rotation.z = sx * 0.45;
    }
    if (L.collar === 'big') mesh(KG.bigCollar, M(L.collarColor, 0.8), spine, 0, 0.5, 0.005);
    if (L.pinafore) {
      const pm = M(L.pinafore, 0.88);
      mesh(KG.bib, pm, spine, 0, 0.3, front + 0.008).scale.x = B.chest / 0.33;
      for (const sx of [-1, 1]) mesh(KG.strap, pm, spine, sx * 0.075, 0.33, front + 0.004).scale.set(1.4, 0.85, 1);
    }
    // skirt (knee length for girls, ankle length for the mother); follows the legs a little (see apply)
    if (dress) {
      const len = longDress ? 0.9 : 0.47, flare = longDress ? 1.05 : 0.86;
      const sk = new THREE.Group(); hips.add(sk);
      mesh(loftGeo([[0.11, B.waist * 0.53, B.depth * 0.5], [-0.04, B.hip * 0.6, B.depth * 0.62], [-len * 0.55, B.hip * (flare * 0.85), B.depth * 0.8], [-len, B.hip * flare, B.depth * 0.92]], 10), top, sk);
      if (L.pinafore) {
        const ap = loftGeo([[0.0, 0.11, 0.004], [-len * 0.92, 0.15, 0.004]], 4);
        const apron = mesh(ap, M(L.pinafore, 0.88), sk, 0, 0.06, B.depth * 0.6);
        apron.rotation.x = -0.2;
        apron.scale.z = 1;
      }
      this.skirt = sk;
    }
    // neck, head, face, hair, hat
    const neck = new THREE.Group(); neck.position.y = 0.52; spine.add(neck);
    mesh(G.neck, skin, neck, 0, -0.01, 0).scale.set(0.9, 0.85, 0.9);
    const head = new THREE.Group(); head.position.y = 0.13; head.scale.setScalar(B.head); neck.add(head);
    mesh(G.head, skin, head);
    mesh(G.jaw, skin, head, 0, -0.052, 0.016).scale.set(adult ? 1 : 0.92, adult ? 1 : 0.85, 1);
    mesh(G.nose, skin, head, 0, -0.014, 0.098).scale.set(0.8, 0.75, adult ? 1 : 0.7);
    for (const sx of [-1, 1]) mesh(G.ear, skin, head, sx * 0.094, -0.008, -0.005);
    const eyeM = M('#2a1f1a', 0.4), browM = M(L.hair, 0.9);
    for (const sx of [-1, 1]) {
      mesh(KG.eye, eyeM, head, sx * 0.034, 0.008, 0.091);
      mesh(KG.brow, browM, head, sx * 0.034, 0.032, 0.094).rotation.z = -sx * 0.08;
    }
    if (L.beard) mesh(facetBall(0.07, 1.1, 0.9, 0.8, 1), M(L.beard, 0.95), head, 0, -0.07, 0.04);
    const hatT = L.hat && L.hat.type;
    if (!hatT || hatT === 'newsboy' || hatT === 'flat' || hatT === 'boater') mesh(G.hair, hair, head, 0, 0.016, -0.014).rotation.x = -0.85;
    if (L.hairStyle === 'messy') for (const [x, z, r] of [[-0.05, 0.06, 0.4], [0.04, 0.07, -0.3], [0.0, -0.02, 0.1]]) { const tf = mesh(KG.tuft, hair, head, x, 0.105, z); tf.rotation.set(r, 0, -r); }
    if (L.hairStyle === 'long') mesh(G.hairLong, hair, head, 0, -0.1, -0.02);
    if (L.hairStyle === 'bob') mesh(G.hairLong, hair, head, 0, -0.045, -0.015).scale.set(1.04, 0.55, 1.05);
    if (L.hairStyle === 'bun') mesh(G.bun, hair, head, 0, 0.07, -0.1);
    if (L.hairStyle === 'braids') for (const sx of [-1, 1]) { const b = mesh(KG.braid, hair, head, sx * 0.07, -0.07, -0.07); b.rotation.set(0.25, 0, sx * 0.12); }
    if (L.bow) {
      const bw = M(L.bow, 0.6), y = L.hairStyle === 'bun' ? 0.05 : 0.085, z = L.hairStyle === 'bun' ? -0.12 : -0.085;
      for (const sx of [-1, 1]) mesh(KG.bowWing, bw, head, sx * 0.034, y, z).rotation.y = sx > 0 ? 0 : Math.PI;
      mesh(KG.knot, bw, head, 0, y, z);
    }
    if (L.hat) {
      const hm = M(L.hat.color, 0.85);
      if (hatT === 'newsboy') { mesh(KG.newsboy, hm, head, 0, 0.075, 0.012); mesh(KG.capBrim, hm, head, 0, 0.058, 0.118).rotation.x = 0.18; }
      if (hatT === 'flat') { mesh(KG.flat, hm, head, 0, 0.08, 0.016); mesh(KG.capBrim, hm, head, 0, 0.066, 0.12).rotation.x = 0.12; }
      if (hatT === 'boater') { mesh(KG.boaterCrown, hm, head, 0, 0.1, 0); mesh(KG.boaterBrim, hm, head, 0, 0.074, 0); mesh(KG.band, M(L.hat.band, 0.7), head, 0, 0.088, 0); }
      if (hatT === 'bowler') { mesh(KG.bowlerDome, hm, head, 0, 0.045, -0.004); mesh(KG.bowlerBrim, hm, head, 0, 0.05, 0); }
    }
    // arms (rolled sleeves: bare forearms)
    const sleeve = L.sleeves === 'rolled' ? skin : (L.jacket ? M(L.jacket) : top);
    const arm = (side) => {
      const sh = new THREE.Group(); sh.position.set(side * (B.sh * 0.5 - 0.062 * K), 0.45, 0); spine.add(sh);
      mesh(BG.deltoid, L.jacket ? M(L.jacket) : top, sh, -side * 0.006, 0, 0);
      mesh(BG.upperArm, L.jacket ? M(L.jacket) : top, sh);
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      mesh(BG.elbow, sleeve, el);
      mesh(BG.foreArm, sleeve, el);
      const hand = new THREE.Group(); hand.position.y = -0.26; el.add(hand);
      mesh(BG.hand, skin, hand);
      mesh(BG.thumb, skin, hand, -side * 0.01, -0.028, 0.036).rotation.set(-0.45, 0, 0);
      return { sh, el, hand };
    };
    // legs: knickerbockers end in a puff below the knee over long stockings; shorts show the knee
    const leg = (side) => {
      const hp = new THREE.Group(); hp.position.set(side * (B.hip * 0.5 - 0.085 * K), -0.04, 0); hips.add(hp);
      const thighM = dress ? socks : bottom;
      mesh(BG.thigh, thighM, hp);
      const kn = new THREE.Group(); kn.position.y = -0.45; hp.add(kn);
      const knick = L.bottom === 'knickers', trousers = L.bottom === 'trousers';
      if (knick) mesh(BG.knee, bottom, kn, 0, -0.02, 0.004).scale.set(1.3, 1.45, 1.3);
      else mesh(BG.knee, trousers ? bottom : (L.bottom === 'shorts' ? skin : socks), kn, 0, 0, 0.004);
      mesh(BG.shin, trousers ? bottom : socks, kn);
      if (L.bottom === 'shorts' && L.socks) mesh(BG.knee, socks, kn, 0, -0.17, 0).scale.set(1.0, 0.7, 1.0);   // knee socks' turned top
      const ft = new THREE.Group(); ft.position.y = -0.43; kn.add(ft);
      const shoe = mesh(BG.shoe, shoes, ft, 0, -0.026, 0.03);
      if (L.shoes !== 'bare') { mesh(BG.sole, sole, ft, 0, -0.03, 0.03); mesh(BG.knee, shoes, ft, 0, 0.025, 0).scale.set(0.82, 0.9, 0.82); }   // boot shaft
      else shoe.scale.set(0.9, 0.75, 0.92);
      return { hp, kn, ft };
    };
    const la = arm(1), ra = arm(-1), ll = leg(1), rl = leg(-1);
    // hand props
    if (this.spec.hoop) { const st = mesh(KG.stick, M('#7a5a3a', 0.8), ra.hand, 0, -0.06, 0.02); st.rotation.x = -1.05; this.stick = st; }
    if (this.spec.look === 'boyChores') {
      const bk = new THREE.Group(); ra.hand.add(bk); bk.position.set(0, -0.2, 0.02);
      const wood = M('#8a6a44', 0.8), iron = M('#3a3836', 0.5);
      const b1 = mesh(KG.bucket, wood, bk); b1.material = wood; b1.geometry = KG.bucket;
      mesh(KG.bucketBase, wood, bk, 0, -0.1, 0);
      mesh(KG.band2, iron, bk, 0, 0.06, 0).scale.set(0.106, 0.02, 0.106);
      mesh(KG.handle, iron, bk, 0, 0.1, 0);
      const water = mesh(new THREE.CircleGeometry(0.1, 12), M('#4a5a62', 0.15), bk, 0, 0.07, 0); water.rotation.x = -Math.PI / 2;
    }
    if (this.spec.look === 'girlRope') { for (const a of [la, ra]) mesh(KG.ropeHandle, M('#9a7a52', 0.7), a.hand, 0, -0.06, 0.02); }
    if (L.pole) { const pl = mesh(new THREE.CylinderGeometry(0.012, 0.016, 2.6, 6), M('#5a4632', 0.8), ra.hand, 0, -0.04, 0.02); pl.geometry.translate(0, 0.9, 0); pl.rotation.x = -0.5; mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.12, 6), M('#8a7a4a', 0.4), pl, 0, 2.25, 0); this.pole = pl; }
    if (L.doll) { const d = new THREE.Group(); la.hand.add(d); d.position.set(0.02, -0.06, 0.07); mesh(facetBall(0.04, 1, 1.1, 1, 1), M('#f0d8c0', 0.6), d, 0, 0.09, 0); mesh(loftGeo([[-0.09, 0.05, 0.035], [0.05, 0.035, 0.025]], 6), M('#c86a5a', 0.8), d); }
    this.root = root;
    this.j = { body, hips, spine, neck, head, la, ra, ll, rl };
  }

  // value of a [[t, v], ...] list at time t (last entry at or before t)
  _seg(list, t, def) { let v = def; if (list) for (const [tt, val] of list) { if (t >= tt) v = val; else break; } return v; }

  _dirOf(i, t = 0) {
    const f = this._seg(this.spec.faces, t, this.spec.face);
    if (f !== undefined && f !== null) return Math.PI + MathX.deg(f);
    const P = this.pathPts;
    if (P.length < 2) return Math.PI;
    for (let k = Math.min(i, P.length - 2); k >= 0; k--) {
      const a = P[k], b = P[k + 1];
      if (b[0] - a[0] > 0.01 && Math.hypot(b[1] - a[1], b[2] - a[2]) > 1e-3) return Math.atan2(b[1] - a[1], b[2] - a[2]);
    }
    return Math.PI;
  }

  strideAt(t) { return this._seg(this.spec.strides, t, this.spec.stride || 1.32); }

  shown(t) { return !this.spec.show || this.spec.show.some(([a, b]) => t >= a && t < b); }

  update(t) {
    const vis = this.shown(t);
    this.root.visible = vis;
    if (!vis) return;
    const loc = this.locate(t);
    const ctx = { seed: this.seed, seedI: this.seedI, walkPhase: (loc.dist / this.strideAt(t)) * Math.PI * 2, seat: this._seg(this.spec.seats, t, this.spec.seat) };
    this.root.position.set(loc.x, this._seg(this.spec.ys, t, this.spec.y || 0), loc.z);
    this.root.rotation.y = loc.dir;
    this.apply(this.poseAt(t, ctx));
    this.root.updateMatrixWorld(true);
  }

  // ball games: throws and catches layered over the current action (SCRIPT.throws)
  poseAt(t, ctx) {
    const p = super.poseAt(t, ctx);
    const id = this.spec.id;
    for (const [t0, from, to, fl] of SCRIPT.throws || []) {
      if (from === id && t > t0 - 0.6 && t < t0 + 0.45) {
        const wind = MathX.smooth(t, t0 - 0.6, t0 - 0.15), rel = MathX.smooth(t, t0 - 0.15, t0 + 0.05), back = MathX.smooth(t, t0 + 0.1, t0 + 0.45);
        const sh = -0.5 * wind + 2.6 * rel;
        const k = 1 - back;
        p.rSh = [MathX.lerp(p.rSh[0], sh, k), MathX.lerp(p.rSh[1], 0.25, k)]; p.rEl = MathX.lerp(p.rEl, 1.3 - 1.1 * rel, k);
        p.spineYaw += (0.35 * wind - 0.5 * rel) * k; p.spine += 0.12 * rel * k;
      }
      const tc = t0 + fl;
      if (to === id && t > tc - 0.55 && t < tc + 0.5) {
        const k = MathX.smooth(t, tc - 0.55, tc - 0.2) * (1 - MathX.smooth(t, tc + 0.15, tc + 0.5));
        p.lSh = [MathX.lerp(p.lSh[0], 1.2, k), MathX.lerp(p.lSh[1], 0.1, k)]; p.rSh = [MathX.lerp(p.rSh[0], 1.2, k), MathX.lerp(p.rSh[1], 0.1, k)];
        p.lEl = MathX.lerp(p.lEl, 0.55, k); p.rEl = MathX.lerp(p.rEl, 0.55, k); p.spine += 0.1 * k;
      }
    }
    return p;
  }

  apply(P) {
    super.apply(P);
    if (this.skirt) {
      const sw = (P.lHip[0] + P.rHip[0]) * 0.5, spread = Math.abs(P.lHip[0] - P.rHip[0]) + Math.max(P.lHip[0], P.rHip[0], 0) * 0.5;
      this.skirt.rotation.x = -sw * 0.35;
      this.skirt.scale.set(1 + spread * 0.05, 1, 1 + spread * 0.3);
    }
  }
}

class ChildrenSystem {
  constructor(scene) {
    this.people = SCRIPT.people.map((spec) => new Child(spec, scene));
    this.byId = {};
    for (const p of this.people) this.byId[p.spec.id] = p;
    this.blobs = new BlobShadows(scene, this.people.length * 3);
    this._v = new THREE.Vector3();
  }
  update(t, visible = true) {
    this.blobs.begin();
    for (const p of this.people) {
      if (!visible) { p.root.visible = false; continue; }
      p.update(t);
      if (!p.root.visible) continue;
      const gy = p._seg(p.spec.ys, t, p.spec.y || 0);
      for (const [part, r] of [['hips', 0.34], ['neck', 0.26], ['head', 0.18]]) {
        const w = p.worldOf(part, this._v);
        const k = MathX.clamp(1 - Math.max(0, w.y - gy) / 1.2, 0, 1);
        if (k > 0.02) this.blobs.push(w.x, gy + 0.013, w.z, r * (1.4 - k * 0.5), 0.45 * k);
      }
    }
    this.blobs.end();
    this.blobs.mesh.visible = visible;
  }
}
