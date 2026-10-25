/* =====================================================================
   CAST — the people of this film, on the shared Person rig (js/world/people.js, unchanged; this film only adds its
   looks and actions, prefixed nt). Office clothes of 2001, FDNY firefighters (black bunker coats with yellow
   stripes, helmets, air tanks), NYPD and Port Authority police. No faces are painted (the rig's rule).
   Sets place people directly (ntPlace): a position, a heading and a pose, all from film time.
   ===================================================================== */

Object.assign(LOOKS, {
  ntShirtW: { skin: 0, build: 'avg', shirt: '#e8e6e0', sleeves: 'long', pants: '#2c3038', shoes: '#1a1612', sole: '#141210', hair: '#3a2a1e', collar: true },
  ntShirtB: { skin: 2, build: 'broad', shirt: '#9fb4cc', sleeves: 'long', pants: '#3a3a3e', shoes: '#241a12', sole: '#141210', hair: '#14100c', collar: true },
  ntSuit: { skin: 1, build: 'avg', shirt: '#2e3440', sleeves: 'long', pants: '#2e3440', shoes: '#121212', sole: '#0c0c0c', hair: '#5a4030', jacket: true, collar: true, inner: '#e6e2da' },
  ntSuitG: { skin: 3, build: 'slim', shirt: '#55585e', sleeves: 'long', pants: '#45484e', shoes: '#121212', sole: '#0c0c0c', hair: '#0e0b09', jacket: true, collar: true, inner: '#cfd8e6' },
  ntBlouse: { skin: 5, build: 'slim', shirt: '#b8584e', sleeves: 'long', pants: '#25262c', shoes: '#2a1a14', sole: '#141010', hair: '#7a5232', hairStyle: 'long' },
  ntBlouse2: { skin: 4, build: 'slim', shirt: '#d9c9a8', sleeves: 'long', pants: '#3c3a44', shoes: '#141414', sole: '#0c0c0c', hair: '#0e0b09', hairStyle: 'bun', shoulderBag: '#4a3426' },
  ntCardigan: { skin: 1, build: 'avg', shirt: '#5e6b5a', sleeves: 'long', pants: '#4a4440', shoes: '#3a2a1c', sole: '#1a1410', hair: '#b39a74', hairStyle: 'bun', jacket: true },
  ntPolo: { skin: 3, build: 'broad', shirt: '#3d4f6b', sleeves: 'short', pants: '#6b6252', shoes: '#2a2018', sole: '#1a1410', hair: '#141010' },
  ntBlazer: { skin: 0, build: 'slim', shirt: '#6a3b44', sleeves: 'long', pants: '#22232a', shoes: '#141414', sole: '#0c0c0c', hair: '#c9a46a', hairStyle: 'pony', jacket: true, inner: '#efe9df', shoulderBag: '#2a2220' },
  ntTie: { skin: 2, build: 'avg', shirt: '#f0eee8', sleeves: 'long', pants: '#30343c', shoes: '#141210', sole: '#0c0c0c', hair: '#1a1410', collar: true, backpack: '#2a2c30' },
  // FDNY: a black bunker coat with yellow reflective stripes, a helmet, an air tank on the back
  ntFF: { skin: 1, build: 'broad', shirt: '#17181a', sleeves: 'long', pants: '#17181a', shoes: '#0c0c0c', sole: '#0a0a0a', hair: '#2a2018', coat: true, collar: true, gloves: '#3a3024', vest: '#17181a', hat: { type: 'helmet', color: '#1c1d20' }, backpack: '#b9b6ae', inner: '#101012' },
  ntFF2: { skin: 0, build: 'broad', shirt: '#1a1a1c', sleeves: 'long', pants: '#1a1a1c', shoes: '#0c0c0c', sole: '#0a0a0a', hair: '#5a4030', coat: true, collar: true, gloves: '#3a3024', vest: '#1a1a1c', hat: { type: 'helmet', color: '#4a2e1c' }, backpack: '#c8c4b8', inner: '#101012' },
  // police: NYPD navy, a cap; the Port Authority's lighter blue
  ntNYPD: { skin: 2, build: 'broad', shirt: '#1d2638', sleeves: 'long', pants: '#1a2030', shoes: '#0c0c0c', sole: '#0a0a0a', hair: '#141010', collar: true, hat: { type: 'cap', color: '#1a2132' } },
  ntPAPD: { skin: 0, build: 'avg', shirt: '#2c3d5a', sleeves: 'short', pants: '#1c2232', shoes: '#0c0c0c', sole: '#0a0a0a', hair: '#3a2a1e', collar: true, hat: { type: 'cap', color: '#1c2232' } },
});
// the office crowd's looks, in the order the sets take them
const NT_LOOKS = ['ntShirtW', 'ntBlouse', 'ntSuit', 'ntBlouse2', 'ntShirtB', 'ntCardigan', 'ntSuitG', 'ntBlazer', 'ntPolo', 'ntTie'];

Object.assign(ACTIONS, {
  // walking down stairs: shorter steps, more knee, leaning a little forward, one hand forward on the rail
  ntDown(τ, c) {
    const p = ACTIONS.walk(τ, c), φ = c.walkPhase, s = Math.sin(φ), co = Math.cos(φ);
    p.lHip = [0.32 * s + 0.12, 0.03]; p.rHip = [-0.32 * s + 0.12, 0.03];
    p.lKnee = 0.25 + 0.55 * Math.max(0, co); p.rKnee = 0.25 + 0.55 * Math.max(0, -co);
    p.hipY = 0.9 - 0.05 * Math.abs(s);
    p.spine = 0.12; p.neck = 0.22;
    p.lSh = [-0.18 * s, 0.07]; p.rSh = [0.35, 0.12]; p.rEl = 0.55;
    return p;
  },
  // standing in the queue on the stairs (breathing, looking around)
  ntWait(τ, c) { const p = ACTIONS.idle(τ, c); p.neck = 0.12 + 0.05 * noise1(τ * 0.2, c.seedI + 9); p.rSh = [0.3, 0.12]; p.rEl = 0.5; return p; },
  // a firefighter climbing: bent forward under the load, hands on the rail and the hose, heavy steps
  ntClimb(τ, c) {
    const p = ACTIONS.walk(τ, c), φ = c.walkPhase, s = Math.sin(φ), co = Math.cos(φ);
    p.lHip = [0.5 * s - 0.25, 0.03]; p.rHip = [-0.5 * s - 0.25, 0.03];
    p.lKnee = 0.45 + 0.6 * Math.max(0, -co); p.rKnee = 0.45 + 0.6 * Math.max(0, co);
    p.spine = 0.38; p.neck = -0.12; p.hipY = 0.88;
    p.lSh = [0.55, 0.15]; p.lEl = 0.9; p.rSh = [0.25, 0.2]; p.rEl = 1.1;
    p.headYaw *= 0.3;
    return p;
  },
  // a firefighter resting on a landing: hands on knees, breathing hard
  ntRest(τ, c) {
    const p = basePose(), br = Math.sin(τ * 3.4 + c.seed * 9);
    p.spine = 0.62 + 0.03 * br; p.neck = -0.35; p.hipY = 0.86; p.lHip = [0.35, 0.05]; p.rHip = [0.35, 0.05]; p.lKnee = 0.4; p.rKnee = 0.4;
    p.lSh = [0.75, 0.25]; p.rSh = [0.75, 0.25]; p.lEl = 0.35; p.rEl = 0.35;
    return p;
  },
  // helped down: arms over two shoulders, head low, feet dragging a little
  ntHelped(τ, c) {
    const p = ACTIONS.walk(τ, c);
    p.lSh = [0.2, 1.35]; p.rSh = [0.2, 1.35]; p.lEl = 0.5; p.rEl = 0.5; p.spine = 0.25; p.neck = 0.45; p.hipY = 0.86;
    p.lHip[0] *= 0.6; p.rHip[0] *= 0.6;
    return p;
  },
  // a helper with an arm round someone's back
  ntHelper(τ, c) { const p = ACTIONS.ntDown(τ, c); p.lSh = [0.15, 0.95]; p.lEl = 0.9; return p; },
  // a police officer waving people on: the right arm sweeps the way, over and over
  ntWave(τ, c) {
    const p = ACTIONS.idle(τ, c), w = Math.sin(τ * 3.1 + c.seed * 5);
    p.rSh = [0.9 + 0.35 * w, 0.55 + 0.35 * w]; p.rEl = 0.35 + 0.25 * Math.max(0, -w);
    p.lSh = [0.15, 0.1]; p.lEl = 0.4; p.headYaw = 0.25 * Math.sin(τ * 0.7 + c.seed); p.spineYaw = 0.12 * w;
    return p;
  },
  // sitting at a desk, typing
  ntType(τ, c) {
    const p = ACTIONS.sit(τ, c), k = Math.sin(τ * 9 + c.seed * 7) * 0.03;
    p.lSh = [0.75 + k, 0.12]; p.rSh = [0.75 - k, 0.12]; p.lEl = 1.25; p.rEl = 1.25; p.spine = 0.12; p.neck = 0.18;
    return p;
  },
  // stood up, looking up at the ceiling (after the impact)
  ntLookUp(τ, c) { const p = ACTIONS.idle(τ, c); p.neck = -0.55; p.spine = -0.06; p.lSh = [0.2, 0.15]; p.rSh = [0.25, 0.2]; p.rEl = 0.6; return p; },
  // looking back over the shoulder, a hand up against the light (the street)
  ntLookBack(τ, c) { const p = ACTIONS.idle(τ, c); p.neck = -0.35; p.headYaw = 0.3; p.rSh = [1.9, 0.25]; p.rEl = 1.6; return p; },
  // a hand over mouth and nose (the dust)
  ntCover(τ, c) { const p = ACTIONS.walk(τ, c); p.rSh = [1.25, 0.15]; p.rEl = 2.0; p.spine = 0.25; p.neck = 0.3; return p; },
});
Object.assign(BLEND, { ntDown: 0.5, ntWait: 0.6, ntClimb: 0.5, ntRest: 0.8, ntHelped: 0.4, ntHelper: 0.4, ntWave: 0.5, ntType: 0.6, ntLookUp: 0.5, ntLookBack: 0.7, ntCover: 0.5 });

// a person for a set: built once, placed every frame
function ntPerson(scene, id, look) { const p = new Person({ id, look, states: [[0, 'idle']] }, scene); p.root.traverse((o) => { if (o.isMesh) o.frustumCulled = true; }); return p; }
// place a person: position, heading (the direction they face, radians, 0 = −z), the action and its time, the walk
// phase (radians, from the distance walked), and an optional blend into a second action (b, w)
function ntPlace(p, x, y, z, heading, act, tau, phase = 0, b = null, w = 0) {
  const ctx = { seed: p.seed, seedI: p.seedI, walkPhase: phase };
  let pose = (ACTIONS[act] || ACTIONS.idle)(tau, ctx);
  if (b && w > 0) pose = lerpPose(pose, (ACTIONS[b] || ACTIONS.idle)(tau, ctx), Math.min(1, w));
  p.root.visible = true;
  p.root.position.set(x, y, z);
  p.root.rotation.y = Math.PI + heading;
  p.apply(pose);
  p.root.updateMatrixWorld(true);
}
