/* =====================================================================
   CAST — the people on the street. Twice the weight on the same muscles:
   knees give when gravity doubles, everyone stands lower and moves slower,
   a kid's jump becomes a 6 cm hop, standing up from a bench fails, the
   jogger stops, the paramedics can barely carry their kit.
   People use the shared rig (js/world/people.js); the film's looks and
   actions are added here (all prefixed gv). Masses never change: only weight.
   ===================================================================== */

Object.assign(LOOKS, {
  gvHiVis: { skin: 2, build: 'broad', shirt: '#33414c', sleeves: 'long', pants: '#2c3138', shoes: '#4a3a2c', sole: '#22201c', hair: '#2a1d14', vest: '#ef7a22', hat: { type: 'hard', color: '#efece4' }, gloves: '#5b4e36' },
  gvWorker: { skin: 4, build: 'avg', shirt: '#6a6f72', sleeves: 'short', pants: '#3a3f46', shoes: '#4a3a2c', sole: '#22201c', hair: '#111', vest: '#d8d23a', hat: { type: 'hard', color: '#e2a823' }, gloves: '#5b4e36' },
  gvMedic: { skin: 1, build: 'avg', shirt: '#2f5a3c', sleeves: 'long', pants: '#28402f', shoes: '#151515', sole: '#2a2a2a', hair: '#3a2a1e', vest: '#cfe03a' },
  gvMedic2: { skin: 3, build: 'slim', shirt: '#2f5a3c', sleeves: 'long', pants: '#28402f', shoes: '#151515', sole: '#2a2a2a', hair: '#0e0b09', hairStyle: 'bun', vest: '#cfe03a' },
  gvKid: { skin: 5, build: 'slim', shirt: '#c0463a', sleeves: 'short', pants: '#3a4a6a', shoes: '#e8e4dc', sole: '#f0ede6', hair: '#6b4a2c', backpack: '#2f6a8a' },
  gvMum: { skin: 5, build: 'slim', shirt: '#3d5566', sleeves: 'long', pants: '#2b2b30', shoes: '#2a2018', sole: '#14100c', hair: '#6b4a2c', hairStyle: 'pony', jacket: true },
  gvOld: { skin: 0, build: 'avg', shirt: '#7b7262', sleeves: 'long', pants: '#4a4a48', shoes: '#2a1f18', sole: '#1a1612', hair: '#cfcac2', coat: true, collar: true, hat: { type: 'cap', color: '#5a5040' } },
  gvShop: { skin: 3, build: 'broad', shirt: '#d8d2c4', sleeves: 'long', pants: '#3a3a40', shoes: '#1a1a1a', sole: '#3a3a3a', hair: '#2a2420', apron: '#3f5a46' },
});

// legs bent at the hip (a, forward) and knee (k), feet flat; sets the hip height to match (thigh 0.46, shin 0.47)
function gvLegs(p, a, k, aR = a, kR = k) {
  p.lHip = [a, 0.06]; p.rHip = [aR, 0.06]; p.lKnee = k; p.rKnee = kR; p.lFoot = a - k; p.rFoot = aR - kR;
  p.hipY = Math.min(0.46 * Math.cos(a) + 0.47 * Math.cos(k - a), 0.46 * Math.cos(aR) + 0.47 * Math.cos(kR - aR)) + 0.005;
  return p;
}

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
  // the same, with heavy bags pulling both arms straight down
  gvLoaded(τ, c) {
    const p = ACTIONS.gvHeavy(τ, c);
    p.lSh = [0.02, 0.15]; p.rSh = [0.02, 0.15]; p.lEl = 0.04; p.rEl = 0.04; p.spine += 0.06;
    return p;
  },
  // holding bags at 1 G (arms relaxed)
  gvBags(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.lSh = [0.04, 0.13]; p.rSh = [0.04, 0.13]; p.lEl = 0.12; p.rEl = 0.12;
    return p;
  },
  // squatting to put the bags down, then coming back up slowly
  gvSetDown(τ, c) {
    const p = basePose(), d = MathX.smooth(τ, 0, 0.7) * (1 - MathX.smooth(τ, 1.3, 2.6));
    gvLegs(p, 0.25 + 0.85 * d, 0.42 + 1.2 * d);
    p.spine = 0.18 + 0.4 * d; p.neck = 0.12 + 0.25 * d;
    p.lSh = [0.05 + 0.3 * d, 0.15]; p.rSh = [0.05 + 0.3 * d, 0.15]; p.lEl = 0.05; p.rEl = 0.05;
    return p;
  },
  // walking under twice the weight: short, flat, bent-kneed steps, leaning forward
  gvTrudge(τ, c) {
    const p = ACTIONS.walk(τ, c);
    p.lHip[0] *= 0.55; p.rHip[0] *= 0.55; p.lKnee = 0.3 + (p.lKnee - 0.08) * 0.5; p.rKnee = 0.3 + (p.rKnee - 0.08) * 0.5;
    p.lHip[0] += 0.14; p.rHip[0] += 0.14; p.lFoot = 0.14 - p.lKnee * 0.5; p.rFoot = 0.14 - p.rKnee * 0.5;
    p.hipY = 0.86; p.spine = 0.2; p.neck = 0.12; p.lSh[0] *= 0.4; p.rSh[0] *= 0.4;
    return p;
  },
  // a heavy bag in the right hand: the body leans away from it
  gvCarry(τ, c) {
    const p = ACTIONS.gvTrudge(τ, c);
    p.rSh = [0.04, 0.02]; p.rEl = 0.05; p.lSh = [0.15, 0.45]; p.lEl = 0.35; p.spineRoll = 0.12;
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
  // the man on the bench tries to stand: leans in, hands on knees, pushes, gets halfway, drops back, slumps
  gvBenchTry(τ, c) {
    const p = ACTIONS.sit(τ, c), seat = (c.seat || 0.45) + 0.05;
    const lean = MathX.smooth(τ, 0, 0.9), up = MathX.smooth(τ, 0.9, 2.1) * (1 - Ease.inQuad(MathX.clamp((τ - 2.25) / 0.32, 0, 1)));
    const tr = Math.sin(τ * 31) * 0.012 * up, br = Math.sin(τ * 3.4) * MathX.smooth(τ, 2.5, 3.0);
    p.spine = 0.0 + 0.6 * lean + 0.25 * up + br * 0.05; p.neck = 0.1 + 0.15 * lean - 0.35 * up;
    p.hipY = seat + 0.2 * up + tr; p.rootZ = 0.1 * up;
    p.lHip = [1.5 - 0.6 * up, 0.08]; p.rHip = [1.5 - 0.6 * up, 0.08]; p.lKnee = 1.5 - 0.42 * up; p.rKnee = 1.5 - 0.42 * up;
    p.lFoot = p.rFoot = 0.0;
    const hk = MathX.smooth(τ, 0.3, 0.9);
    p.lSh = [MathX.lerp(0.45, 0.7, hk), 0.18]; p.rSh = [MathX.lerp(0.5, 0.7, hk), 0.18]; p.lEl = MathX.lerp(1.05, 0.45 + 0.25 * up, hk); p.rEl = p.lEl;
    p.headYaw = 0;
    if (τ > 2.6) { const s = MathX.smooth(τ, 2.6, 3.4); p.spine = MathX.lerp(p.spine, 0.42 + br * 0.05, s); p.neck = MathX.lerp(p.neck, 0.4, s); }
    return p;
  },
  // slumped on the bench afterwards, breathing hard
  gvBenchSlump(τ, c) {
    const p = ACTIONS.sit(τ, c), br = Math.sin(τ * 3.2);
    p.spine = 0.42 + br * 0.05; p.neck = 0.4; p.lSh = [0.7, 0.18]; p.rSh = [0.7, 0.18]; p.lEl = 0.5; p.rEl = 0.5; p.headYaw = 0.15;
    return p;
  },
  // sat on the bench, the extra weight sinking him into it
  gvBenchSit(τ, c) {
    const p = ACTIONS.sit(τ, c), k = MathX.smooth(τ, 0, 0.3);
    p.spine = -0.05 + 0.2 * k; p.neck = 0.1 + 0.15 * k; p.lSh = [0.45, 0.14]; p.rSh = [0.5, 0.14];
    return p;
  },
  // the banksman: right hand up (hold), looking up at the load
  gvSignal(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.rSh = [2.75, 0.2]; p.rEl = 0.12 + 0.06 * Math.sin(τ * 4); p.neck = -0.3; p.headYaw = 0;
    p.lSh = [0.2, 0.25]; p.lEl = 0.35;
    return p;
  },
  // both arms crossing over the head: emergency stop
  gvStop(τ, c) {
    const p = ACTIONS.gvHeavy(τ, c), w = Math.sin(τ * 9);
    p.lSh = [2.6, 0.55 + 0.35 * w]; p.rSh = [2.6, 0.55 + 0.35 * w]; p.lEl = 0.15; p.rEl = 0.15; p.neck = -0.35; p.headYaw = 0;
    return p;
  },
  // looking up, a hand shading the eyes
  gvLookUp(τ, c) {
    const p = ACTIONS.gvHeavy(τ, c);
    p.neck = -0.5; p.headYaw = 0.1 * Math.sin(τ * 0.6); p.spine = 0.02;
    p.lSh = [2.1, 0.35]; p.lEl = 2.25;
    return p;
  },
  // kneeling on the scaffold boards, one hand on the guard rail
  gvGrip(τ, c) {
    const p = ACTIONS.kneel(τ, c);
    p.lSh = [1.35, 0.25]; p.lEl = 0.5; p.neck = 0.55; p.spine = 0.3;
    return p;
  },
  // laying bricks on the scaffold
  gvBrick(τ, c) {
    const p = ACTIONS.kneel(τ, c), w = Math.sin(τ * 1.8);
    p.spine = 0.5; p.neck = 0.4; p.rSh = [0.95 + 0.15 * w, 0.15]; p.rEl = 0.6 + 0.2 * w;
    return p;
  },
});
Object.assign(BLEND, { gvBuckle: 0.08, gvHeavy: 0.7, gvLoaded: 0.6, gvBags: 0.5, gvSetDown: 0.4, gvTrudge: 0.6, gvCarry: 0.6, gvHandsKnees: 0.8, gvBenchTry: 0.4, gvBenchSlump: 0.8, gvBenchSit: 0.15,
  gvSignal: 0.5, gvStop: 0.25, gvLookUp: 0.6, gvGrip: 0.5, gvBrick: 0.5 });

/* ---------------------------------------------------------------------
   Who is where. y = ground height (0.15 on the sidewalks); show = [from, to] (hidden outside);
   face = degrees (0 faces −Z, down the street; 90 faces −X, toward the road on your side).
   --------------------------------------------------------------------- */
const GV_SW = LAYOUT.curbH;
const GV_PEOPLE = [
  // the kid by the shop, hopping while he waits; his mum with the shopping. They back off after the pallet lands.
  { id: 'kid', look: 'gvKid', y: GV_SW, kid: true, path: [[0, 9.75, -6.3], [GV_FALL.pallet.hit + 0.4, 9.75, -6.3], [GV_FALL.pallet.hit + 4.4, 10.1, -3.5]], face: 90, faceUntil: GV_FALL.pallet.hit + 0.4,
    states: [[0, 'idle'], [GV.g0 + 0.02, 'gvBuckle'], [GV.g0 + 1.3, 'gvHeavy'], [GV_FALL.pallet.hit, 'recoil'], [GV_FALL.pallet.hit + 0.4, 'gvTrudge'], [GV_FALL.pallet.hit + 4.4, 'gvHeavy']] },
  { id: 'mum', look: 'gvMum', y: GV_SW, path: [[0, 10.55, -7.1], [GV_FALL.pallet.hit + 0.6, 10.55, -7.1], [GV_FALL.pallet.hit + 4.8, 10.7, -3.0]], face: 125, faceUntil: GV_FALL.pallet.hit + 0.6,
    states: [[0, 'gvBags'], [GV.g0 + 0.02, 'gvBuckle'], [GV.g0 + 1.1, 'gvLoaded'], [5.0, 'gvSetDown'], [7.6, 'gvHeavy'], [GV_FALL.pallet.hit, 'recoil'], [GV_FALL.pallet.hit + 0.6, 'gvTrudge'], [GV_FALL.pallet.hit + 4.8, 'gvHeavy'], [GV.limit + 0.4, 'gvHandsKnees']] },
  // the old man on the bench
  { id: 'old', look: 'gvOld', y: GV_SW, seat: 0.43, path: [[0, GV_CITY.bench.x + 0.12, GV_CITY.bench.z + 0.3]], face: 90,
    states: [[0, 'sit'], [GV.g0 + 0.03, 'gvBenchSit'], [GV.oldMan[0], 'gvBenchTry'], [GV.oldMan[0] + 3.8, 'gvBenchSlump']] },
  // a man walking away down your sidewalk: stumbles, slows to a trudge, stops, bent over
  { id: 'walker', look: 'casual1', y: GV_SW, path: [[0, 7.75, -4.6], [GV.g0, 7.75, -6.75], [GV.g0 + 7.5, 7.75, -10.6], [70, 7.75, -10.6]],
    states: [[0, 'walk'], [GV.g0 + 0.02, 'gvBuckle'], [GV.g0 + 0.9, 'gvTrudge'], [GV.g0 + 7.5, 'gvHandsKnees'], [GV_FALL.pallet.hit, 'recoil'], [GV_FALL.pallet.hit + 0.5, 'gvHeavy'], [GV.limit, 'gvHandsKnees']] },
  // a jogger on the far sidewalk: can't keep running
  { id: 'jogger', look: 'casual3', y: GV_SW, stride: 2.1, path: [[0, -8.7, 0.5], [GV.g0, -8.7, -4.0], [GV.g0 + 1.2, -8.7, -5.6], [GV.g0 + 4.0, -8.7, -7.0], [70, -8.7, -7.0]],
    states: [[0, 'jog'], [GV.g0 + 0.02, 'gvBuckle'], [GV.g0 + 1.2, 'gvTrudge'], [GV.g0 + 4.0, 'gvHandsKnees'], [22, 'gvHeavy'], [GV.limit, 'gvHandsKnees']] },
  // a woman on the far sidewalk: down on her knees when it hits, then slowly on
  { id: 'woman', look: 'casual8', y: GV_SW, path: [[0, -10.1, -27.0], [GV.g0, -10.1, -25.0], [GV.g0 + 6.0, -10.1, -25.0], [GV.g0 + 30, -10.1, -16.5], [70, -10.1, -16.5]],
    states: [[0, 'walk'], [GV.g0 + 0.02, 'gvBuckle'], [GV.g0 + 0.5, 'kneel'], [GV.g0 + 6.0, 'gvTrudge'], [GV.g0 + 30, 'gvHeavy'], [GV.tank + 0.3, 'recoil'], [GV.tank + 0.9, 'gvHeavy'], [GV.limit, 'kneel']] },
  // the bricklayer on the top lift of the scaffold; later on the pavement past it
  { id: 'brick', look: 'gvWorker', y: GV_SW + 12.0 + 0.11 + 0.025, show: [-1, 23], path: [[0, 11.75, -12.5]], face: 90,
    states: [[0, 'gvBrick'], [GV.g0 + 0.02, 'gvBuckle'], [GV.g0 + 0.5, 'gvGrip'], [GV.bay.crack, 'recoil'], [GV.bay.crack + 0.6, 'gvGrip']] },
  { id: 'brick2', look: 'gvWorker', y: GV_SW, show: [27, 99], path: [[0, 8.1, -27.6]], face: 0,
    states: [[0, 'gvLookUp'], [GV.scaffold.fold + 0.2, 'recoil'], [GV.scaffold.fold + 1.4, 'gvHeavy']] },
  // the banksman under the load, and the crane hand at the outrigger; both run when the brake slips
  { id: 'bank', look: 'gvHiVis', y: 0, path: [[0, -2.7, -25.4], [GV.slips[1] + 0.2, -2.7, -25.4], [GV.slips[1] + 3.0, -5.1, -16.2], [GV.drop + 4.0, -5.6, -9.0], [80, -5.6, -9.0]], face: 160, faceUntil: GV.slips[1] + 0.2,
    states: [[0, 'gvSignal'], [GV.g0 + 0.02, 'gvBuckle'], [GV.g0 + 0.9, 'gvSignal'], [GV.outrigger, 'recoil'], [GV.outrigger + 0.7, 'gvLookUp'], [GV.slips[0], 'gvStop'], [GV.slips[1] + 0.2, 'jog'], [GV.drop + 4.0, 'gvHandsKnees']] },
  { id: 'hand', look: 'gvWorker', y: 0, path: [[0, -0.6, -27.0], [GV.outrigger + 0.3, -0.6, -27.0], [GV.outrigger + 3.4, -0.7, -23.2], [GV.slips[1], -0.7, -23.2], [GV.slips[1] + 3.4, -3.2, -12.0], [80, -3.2, -12.0]], face: 200, faceUntil: GV.outrigger + 0.3,
    states: [[0, 'gvHeavy'], [GV.outrigger, 'recoil'], [GV.outrigger + 0.3, 'gvTrudge'], [GV.outrigger + 3.4, 'gvLookUp'], [GV.slips[1], 'jog'], [GV.slips[1] + 3.4, 'gvHeavy']] },
  // the hardware shop's owner comes out to look at his creaking canopy, then backs off
  { id: 'shop', look: 'gvShop', y: GV_SW, show: [GV.awning - 1.8, 99], path: [[GV.awning - 1.8, 12.3, -6.6], [GV.awning - 0.9, 11.25, -6.3], [GV.awning - 0.25, 11.25, -6.3], [GV.awning + 0.45, 11.15, -3.85], [99, 11.15, -3.85]], face: 80, faceUntil: GV.awning - 0.25,
    states: [[0, 'walk'], [GV.awning - 0.9, 'gvLookUp'], [GV.awning - 0.25, 'recoil'], [GV.awning + 0.5, 'gvHeavy'], [GV.awning + 1.4, 'handHead']] },
  // the paramedics from the ambulance, carrying their kit across: every bag weighs twice as much
  { id: 'medA', look: 'gvMedic', y: 0, show: [50.6, 99], path: [[50.6, 3.1, -10.6], [GV.limit + 2.6, 5.9, -7.4], [GV.drop + 0.5, 7.6, -5.4], [99, 7.6, -5.4]], carry: 'kit',
    states: [[0, 'gvCarry'], [GV.drop + 0.5, 'gvLookUp']] },
  { id: 'medB', look: 'gvMedic2', y: 0, show: [50.9, 99], path: [[50.9, 2.9, -12.6], [GV.limit + 1.3, 4.5, -10.6], [99, 4.5, -10.6]], carry: 'case',
    states: [[0, 'gvCarry'], [GV.limit + 1.3, 'gvHandsKnees'], [GV.drop + 0.4, 'gvLookUp']] },
];

// the kid's hops: [takeoff time, height (m), g]. At 1 G a 30 cm hop (0.49 s in the air); at 2 G, with legs that now
// carry twice the weight, 6 cm (0.16 s).
const GV_HOPS = [[0.2, 0.3, GV_G0], [0.9, 0.3, GV_G0], [GV.kidJump, 0.06, 2 * GV_G0]].map(([t, h, g]) => { const v = Math.sqrt(2 * g * h); return { t, h, g, v, T: 2 * v / g, crouch: g > GV_G0 ? 0.55 : 0.26 }; });
function gvKidHop(t) {
  for (const H of GV_HOPS) { const a = t - H.t; if (a >= 0 && a < H.T) return H.v * a - 0.5 * H.g * a * a; }
  return 0;
}

class GvCast {
  constructor(app) {
    const scene = app.scene;
    this.people = GV_PEOPLE.map((s) => new Person(s, scene));
    this.byId = {}; for (const p of this.people) this.byId[p.spec.id] = p;
    this.byId.kid.root.scale.setScalar(0.64);
    this.shadows = new BlobShadows(scene, 80);
    this._v = new THREE.Vector3();
    // props: the mum's two shopping bags, the old man's cane, the paramedics' kit
    const paper = Mat.std('#b48c5c', { roughness: 0.9 }), green = Mat.std('#5f8a3a', { roughness: 0.8 }), red = Mat.std('#b8231d', { roughness: 0.6 }), case_ = Mat.std('#e2a020', { roughness: 0.5 });
    const bag = () => { const g = new THREE.Group(); scene.add(g); gvBox(0.26, 0.3, 0.15, paper, g, 0, -0.17, 0); gvBox(0.1, 0.1, 0.1, green, g, 0.05, -0.0, 0, 0, 0.4, 0, false); gvBox(0.03, 0.06, 0.12, Mat.std('#3a3028'), g, 0, 0.0, 0, 0, 0, 0, false); return g; };
    this.bags = [bag(), bag()];
    this.cane = gvMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 6), Mat.std('#3b2a1c', { roughness: 0.6 }), scene, GV_CITY.bench.x - 0.15, GV_SW + 0.44, GV_CITY.bench.z + 1.05, 0.2, 0, 0.12);
    this.kit = new THREE.Group(); scene.add(this.kit); gvBox(0.55, 0.3, 0.28, red, this.kit, 0, -0.2, 0); gvBox(0.56, 0.04, 0.29, Mat.std('#e8e6e0'), this.kit, 0, -0.1, 0, 0, 0, 0, false);
    this.case = new THREE.Group(); scene.add(this.case); gvBox(0.42, 0.34, 0.16, case_, this.case, 0, -0.22, 0);
    // where the mum put her bags down (her hands at the bottom of the squat)
    const mum = this.byId.mum; mum.update(5.65); this._bagDown = [0, 1].map((i) => { const w = mum.handWorld(i ? 1 : -1, new THREE.Vector3()); w.y = GV_SW + 0.32; return w; });
  }

  // the kid: hops (crouch, launch, land) layered on his pose; height added to his root
  _kid(p, t) {
    let crouch = 0, air = 0;
    for (const H of GV_HOPS) {
      crouch = Math.max(crouch, MathX.smooth(t, H.t - H.crouch, H.t - 0.06) * (1 - MathX.smooth(t, H.t - 0.06, H.t)));
      crouch = Math.max(crouch, MathX.smooth(t, H.t + H.T, H.t + H.T + 0.06) * (1 - MathX.smooth(t, H.t + H.T + 0.1, H.t + H.T + 0.45)) * (H.g > GV_G0 ? 1 : 0.6));
      if (t >= H.t && t < H.t + H.T) air = 1;
    }
    const loc = p.locate(t), P = p.poseAt(t, { seed: p.seed, seedI: p.seedI, walkPhase: (loc.dist / (p.spec.stride || 1.32)) * Math.PI * 2 });
    if (crouch > 0) { const Q = gvLegs(Object.assign({}, P, { lSh: [-0.5, 0.15], rSh: [-0.5, 0.15], lEl: 0.3, rEl: 0.3 }), 0.95, 1.55); Q.spine = 0.5; Q.neck = -0.1; Object.assign(P, lerpPose(P, Q, crouch)); }
    if (air) { gvLegs(P, 0.1, 0.12); P.lSh = [2.3, 0.3]; P.rSh = [2.3, 0.3]; P.lEl = 0.2; P.rEl = 0.2; P.spine = -0.05; P.neck = -0.2; }
    p.apply(P);
    p.root.position.y = GV_SW + gvKidHop(t);
    p.root.updateMatrixWorld(true);
  }

  update(t) {
    this.shadows.begin();
    for (const p of this.people) {
      const S = p.spec, vis = !S.show || (t >= S.show[0] && t < S.show[1]);
      p.root.visible = vis;
      if (!vis) continue;
      p.update(t);
      if (S.kid) this._kid(p, t);
      // soft contact shadows under pelvis, chest and head
      const gy = S.y || 0;
      for (const [part, r] of [['hips', 0.4], ['neck', 0.3], ['head', 0.2]]) {
        const w = p.worldOf(part, this._v), k = MathX.clamp(1 - (w.y - gy) / 1.4, 0, 1);
        if (k > 0.02) this.shadows.push(w.x, gy + 0.012, w.z, r * (1.4 - k * 0.5) * (S.kid ? 0.7 : 1), 0.5 * k);
      }
    }
    this.shadows.end();
    // the shopping: in her hands until she puts it down
    const mum = this.byId.mum;
    this.bags.forEach((b, i) => {
      if (t < 5.65) { mum.handWorld(i ? 1 : -1, b.position); b.position.y -= 0.02; b.rotation.set(0, mum.root.rotation.y, 0); }
      else { b.position.copy(this._bagDown[i]); b.rotation.set(0, mum.root.rotation.y + 0.3 * (i - 0.5), 0); }
    });
    // the paramedics' kit hangs from their right hands
    for (const [id, g] of [['medA', this.kit], ['medB', this.case]]) {
      const p = this.byId[id]; g.visible = p.root.visible;
      if (g.visible) { p.handWorld(-1, g.position); g.rotation.set(0, p.root.rotation.y, 0); }
    }
  }
}
