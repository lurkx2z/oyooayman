/* =====================================================================
   CAST — the people (the shared adult rig, js/world/people.js): this film's looks (you: the ship's dive instructor;
   the girl with the red balloon; the man who can't get his breath back and his wife; the bartender; the officer on the
   bridge wing; the people round the pool), the poses (some from the earlier films' casts, renamed), the props (masks,
   fins, regulators) and the helpers. Every person is posed as a pure function of story time s.
     atPerson(look, parent, o) → Person      o: { id, kid, legs: 'skin' (shorts), arms: 'skin' (swimwear) }
     atPlace(P, q, x, z, yaw, y0)            put a person there in pose q ({ p, lay, y }); laid flat if q.lay
     atLie(P, pose, foot, head, y)           lying face up on something, from the feet to the head
   ===================================================================== */

const AT_SKIN = (i) => SKIN[i % SKIN.length];
Object.assign(LOOKS, {
  // you: the ship's dive instructor (a navy crew polo, khaki shorts); then a black wetsuit
  atYou: { skin: 2, build: 'avg', shirt: '#1d3352', sleeves: 'short', pants: '#b9a57a', shoes: '#f2f2ee', sole: '#ddd', hair: '#2a1d14' },
  atYouSuit: { skin: 2, build: 'avg', shirt: '#14171b', sleeves: 'long', pants: '#14171b', shoes: '#14171b', sole: '#111', hair: '#2a1d14' },
  // the girl (nine): a yellow top, orange shorts; then a shorty wetsuit
  atGirl: { skin: 1, build: 'slim', shirt: '#ffcf2e', sleeves: 'short', pants: '#ff7a3a', shoes: '#f4f4f0', sole: '#ddd', hair: '#5a3418', hairStyle: 'pony' },
  atGirlSuit: { skin: 1, build: 'slim', shirt: '#17191d', sleeves: 'short', pants: '#17191d', shoes: '#17191d', sole: '#111', hair: '#5a3418', hairStyle: 'pony' },
  // the man by the pool and his wife
  atOld: { skin: 5, build: 'broad', shirt: '#e9e3d2', sleeves: 'short', pants: '#7c8794', shoes: '#c9b89a', sole: '#555', hair: '#e6e2dc', hat: { type: 'cap', color: '#f4f1ea' } },
  atWife: { skin: 5, build: 'slim', shirt: '#4e8fc4', sleeves: 'short', pants: '#f2efe6', shoes: '#e9e0d0', sole: '#bbb', hair: '#d8d2c8', hairStyle: 'bun' },
  atBarman: { skin: 3, build: 'avg', shirt: '#f4f4f0', sleeves: 'short', pants: '#16181b', shoes: '#111', sole: '#111', hair: '#141010', apron: '#1a1c20' },
  atOfficer: { skin: 0, build: 'avg', shirt: '#f6f6f2', sleeves: 'short', pants: '#1f2b45', shoes: '#111', sole: '#111', hair: '#3a2a1a', collar: true },
  atJaw: { skin: 0, build: 'broad', shirt: '#e0783c', sleeves: 'short', pants: '#2a6ab0', shoes: '#333', sole: '#222', hair: '#6a4a2a' },
});
// the people round the pool: swimwear and resort clothes (a bare chest is a shirt the colour of the skin)
const AT_CROWD_LOOKS = (() => {
  const r = new RNG(4242), out = [];
  const sw = ['#2a6ab0', '#e0503c', '#1f8f7a', '#f0a12a', '#1a1d22', '#7a3fa0', '#d8d2c4', '#ff86b4', '#2fb39a', '#c0392b'];
  for (let i = 0; i < 24; i++) {
    const skin = r.int(0, 5), man = i % 2 === 0, id = 'atC' + i;
    const L = man ? { skin, build: r.next() < 0.35 ? 'broad' : 'avg', shirt: r.next() < 0.5 ? AT_SKIN(skin) : sw[r.int(0, 9)], sleeves: 'short', pants: sw[r.int(0, 9)], shoes: AT_SKIN(skin), sole: '#777', hair: ['#1a1410', '#4a3220', '#8a6a3a', '#d8c8a0', '#2a1a10'][r.int(0, 4)] }
      : { skin, build: 'slim', shirt: sw[r.int(0, 9)], sleeves: 'short', pants: sw[r.int(0, 9)], shoes: AT_SKIN(skin), sole: '#777', hair: ['#1a1410', '#6a4224', '#c8a060', '#e0c890', '#2a1a10'][r.int(0, 4)], hairStyle: ['long', 'bun', 'pony'][r.int(0, 2)] };
    if (r.next() < 0.25) L.hat = { type: 'cap', color: ['#f4f1ea', '#1d3352', '#e0503c'][r.int(0, 2)] };
    LOOKS[id] = L; out.push(id);
  }
  return out;
})();

const ATPI = Math.PI;
const atEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
function atPerson(look, parent, o = {}) {
  const P = new Person({ id: 'at' + look + (o.id || ''), look }, null);
  if (o.kid) { P.root.scale.setScalar(o.kid); P.j.head.scale.multiplyScalar(1.16); }
  atPersonNoZ(P);
  const L = LOOKS[look], skinM = new THREE.MeshStandardMaterial({ color: AT_SKIN(L.skin), roughness: 0.7 });
  // shorts: the knee and the shin are skin; swimwear: the upper arms too
  if (o.legs === 'skin') for (const lg of [P.j.ll, P.j.rl]) lg.kn.children.forEach((m) => { if (m.isMesh && !m.children.length && m.position.y === 0) m.material = skinM; });
  if (o.arms === 'skin') for (const ar of [P.j.la, P.j.ra]) ar.sh.children.forEach((m) => { if (m.isMesh) m.material = skinM; });
  if (o.arms === 'skin') for (const ar of [P.j.la, P.j.ra]) ar.el.children.forEach((m) => { if (m.isMesh && m !== ar.hand) m.material = skinM; });
  (parent || AT_KIT_SCENE).add(P.root);
  P._skinM = skinM;
  return P;
}
// (the engine's people have a few surfaces that share a plane; nudged here, per person, so nothing flickers)
function atPersonNoZ(p) {
  const L = p.look, BG = PersonGeo.forBuild(L.build || 'avg', L);
  p.root.traverse((m) => {
    if (!m.isMesh) return; const g = m.geometry, q = g.parameters;
    if (g.type === 'BoxGeometry' && q.height === 0.035 && Math.abs(q.width - BG.B.waist * 1.02) < 1e-6) m.scale.set(1, 1.6, 1.08);
    else if (g.type === 'BoxGeometry' && q.width === 0.08 && q.depth === 0.01) m.position.z += 0.004;
    else if (L.coat && (g === BG.pelvis || g === BG.thigh)) m.scale.set(0.98, 1, 0.98);
  });
}
function atPlace(P, q, x, z, yaw, y0 = 0) {
  P.root.position.set(x, y0 + q.y, z); P.root.rotation.order = 'YXZ'; P.root.rotation.set(ATPI / 2 * q.lay, yaw, 0);
  if (q.lay !== 0) { const back = Math.abs(q.lay) * 0.9; P.root.position.x -= Math.sin(yaw) * back; P.root.position.z -= Math.cos(yaw) * back; }
  P.apply(q.p); P.pose = q.p;
}
// lying face up: the feet at foot [x, z], the head towards head [x, z], the body's back at height y
function atLie(P, pose, foot, head, y) {
  const dx = head[0] - foot[0], dz = head[1] - foot[1], yaw = Math.atan2(-dx, -dz);
  P.root.rotation.order = 'YXZ'; P.root.rotation.set(-ATPI / 2, yaw, 0); P.root.position.set(foot[0], y + 0.12, foot[1]);
  P.apply(pose); P.pose = pose;
}
// the face-down / prone version (swimming, floating): the body along dir [x, y, z] (feet → head), the belly down
function atSwim(P, pose, at, yaw, pitch, roll = 0) {
  P.root.rotation.order = 'YXZ'; P.root.rotation.set(pitch, yaw, roll); P.root.position.set(at[0], at[1], at[2]);
  P.apply(pose); P.pose = pose;
}

function atWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
// breathing: the chest and the shoulders rise (rate a minute; deep 0…1: gasping heaves the shoulders, the mouth opens)
function atBreathe(p, t, rate = 14, deep = 0, ph = 0) {
  const w = Math.sin(t * rate / 60 * ATPI * 2 + ph), k = 0.012 + 0.05 * deep;
  p.spine += k * w; p.neck -= 0.6 * k * w; p.lSh = [p.lSh[0] + 0.5 * k * w, p.lSh[1]]; p.rSh = [p.rSh[0] + 0.5 * k * w, p.rSh[1]]; p.mouth = Math.max(p.mouth || 0, deep * (0.6 + 0.4 * w));
  return p;
}
const AT_P = {
  stand: (t, i) => { const p = basePose(); p.headYaw = 0.35 * Math.sin(t * 0.21 + i); p.lSh = [0.12, 0.1]; p.rSh = [0.1, 0.1]; p.lHip = [0.04, 0.06]; p.rKnee = 0.12; return p; },
  chat: (t, i) => { const p = basePose(); p.lSh = [0.5 + 0.2 * Math.sin(t * 1.3 + i), 0.25]; p.lEl = 1.2 + 0.3 * Math.sin(t * 0.9 + i); p.rSh = [0.15, 0.12]; p.headYaw = 0.25 * Math.sin(t * 0.4 + i); p.mouth = 0.5 + 0.5 * Math.sin(t * 7 + i); return p; },
  rail: (t, i) => { const p = basePose(); p.spine = 0.22; p.neck = 0.18; p.lSh = [1.0, 0.18]; p.rSh = [1.0, 0.18]; p.lEl = 1.25; p.rEl = 1.3; p.rKnee = 0.2; p.headYaw = 0.25 * Math.sin(t * 0.17 + i); return p; },
  recline: (t, i) => { const p = basePose(); p.hipY = 0.47; p.lHip = [1.38, 0.06]; p.rHip = [1.25, 0.1]; p.lKnee = 0.12; p.rKnee = 0.45; p.spine = -0.72; p.neck = 0.42; p.lSh = [0.15, 0.3]; p.rSh = [2.6 + 0.0 * i, 0.3]; p.lEl = 0.4; p.rEl = 1.9; p.headYaw = 0.2 * Math.sin(t * 0.1 + i); return p; },
  sitEdge: (t, i) => { const p = basePose(); p.hipY = 0.47; p.lHip = [1.5, 0.1]; p.rHip = [1.45, 0.08]; p.lKnee = 1.45; p.rKnee = 1.5; p.spine = 0.1; p.neck = 0.05; p.lSh = [0.35, 0.15]; p.rSh = [0.4, 0.15]; p.lEl = 0.9; p.rEl = 1.0; p.headYaw = 0.3 * Math.sin(t * 0.2 + i); return p; },
  stool: (t, i) => { const p = basePose(); p.hipY = 0.8; p.lHip = [1.35, 0.1]; p.rHip = [1.3, 0.12]; p.lKnee = 1.6; p.rKnee = 1.4; p.spine = 0.12; p.lSh = [0.75, 0.05]; p.rSh = [0.85, 0.05]; p.lEl = 1.4; p.rEl = 1.6; p.headYaw = 0.3 * Math.sin(t * 0.25 + i); return p; },
  lieFlat: (t, i) => { const p = basePose(); p.lSh = [0.1, 0.25]; p.rSh = [0.15, 0.3]; p.lEl = 0.25; p.rEl = 0.2; p.lHip = [0.0, 0.08]; p.rHip = [0.05, 0.1]; p.rKnee = 0.25 * (i % 2); p.headYaw = 0.25 * Math.sin(t * 0.08 + i); return p; },
  pool: (t, i) => { const p = basePose(); p.lSh = [0.6 + 0.15 * Math.sin(t * 0.8 + i), 0.75]; p.rSh = [0.55 + 0.15 * Math.sin(t * 0.7 + i), 0.75]; p.lEl = 0.4; p.rEl = 0.45; p.headYaw = 0.3 * Math.sin(t * 0.3 + i); p.lHip = [0.15, 0.1]; p.rHip = [-0.1, 0.1]; p.lKnee = 0.3; return p; },
  // out of breath: bent over, hands on the knees; sitting with the head down
  handsKnees: (t, i) => { const p = basePose(); p.hipY = 0.86; p.lHip = [0.55, 0.12]; p.rHip = [0.5, 0.12]; p.lKnee = 0.45; p.rKnee = 0.5; p.spine = 0.85; p.neck = -0.35; p.lSh = [0.75, 0.15]; p.rSh = [0.75, 0.15]; p.lEl = 0.15; p.rEl = 0.15; return p; },
  slumpSit: (t, i) => { const p = basePose(); p.hipY = 0.13; p.lHip = [1.45, 0.3]; p.rHip = [1.3, 0.22]; p.lKnee = 0.6; p.rKnee = 1.1; p.spine = 0.35; p.neck = 0.75; p.headRoll = 0.25 * ((i % 2) * 2 - 1); p.lSh = [0.12, 0.2]; p.rSh = [0.1, 0.25]; p.lEl = 0.2; p.rEl = 0.3; return p; },
  slumpEdge: (t, i) => { const p = AT_P.sitEdge(t, i); p.spine = 0.65; p.neck = 0.8; p.lSh = [0.2, 0.2]; p.rSh = [0.25, 0.25]; p.lEl = 0.3; p.rEl = 0.2; p.headYaw = 0.0; p.headRoll = 0.3; return p; },
  slumpRecline: (t, i) => { const p = AT_P.recline(t, i); p.spine = -0.98; p.neck = 0.35; p.headYaw = (i % 2 ? 0.5 : -0.5); p.headRoll = (i % 2 ? 0.7 : -0.7); p.rSh = [0.1, 0.4]; p.rEl = 0.12; p.lSh = [0.08, 0.38]; p.lEl = 0.15; p.lKnee = 0.3; p.rKnee = 0.25; p.mouth = 0.4; return p; },
  slumpStool: (t, i) => { const p = AT_P.stool(t, i); p.spine = 0.95; p.neck = 0.5; p.lSh = [1.35, 0.25]; p.rSh = [1.4, 0.2]; p.lEl = 0.4; p.rEl = 0.5; p.headYaw = 0.4; return p; },
  lieLimp: (t, i) => { const p = AT_P.lieFlat(t, i); p.headYaw = i % 2 ? 0.7 : -0.6; p.lSh = [0.2, 0.55]; p.rSh = [0.1, 0.45]; p.mouth = 0.3; return p; },
  // the man who can't get his breath: sitting up on the lounger's edge, hunched, a hand on his chest
  oldGasp: (t, k) => { const p = AT_P.sitEdge(t, 0); p.spine = 0.45; p.neck = -0.1; p.rSh = [0.9, -0.2]; p.rEl = 2.0; p.lSh = [0.5, 0.3]; p.lEl = 0.2; p.headYaw = 0; return atBreathe(p, t, 34, 1, 0.3); },
  kneel: (t, i) => { const p = basePose(); p.hipY = 0.5; p.lHip = [0.05, 0.08]; p.rHip = [0.05, 0.08]; p.lKnee = 1.75; p.rKnee = 1.75; p.lFoot = 0.5; p.rFoot = 0.5; p.spine = 0.3;
    p.lSh = [1.1, -0.1]; p.rSh = [1.0, -0.15]; p.lEl = 0.6; p.rEl = 0.7; p.headYaw = 0.2 * Math.sin(t * 0.4 + i); return p; },
  // working the jaw, pinching the nose (ears popping)
  jaw: (t) => { const p = basePose(); p.rSh = [1.25, -0.2]; p.rEl = 2.25; p.lSh = [0.15, 0.12]; p.neck = -0.05 + 0.05 * Math.sin(t * 2.2); p.mouth = 0.5 + 0.5 * Math.sin(t * 5.5); p.headYaw = 0.15 * Math.sin(t * 0.7); return p; },
  // the girl holding her balloon's string up
  balloon: (t) => { const p = basePose(); p.rSh = [1.35, 0.18]; p.rEl = 0.55; p.lSh = [0.1, 0.12]; p.neck = -0.45; p.headYaw = 0.12 * Math.sin(t * 0.5); return p; },
  flinch: (u) => { const p = basePose(); const k = Math.exp(-u * 1.2) * MathX.smooth(u, 0, 0.12); p.rSh = [1.35 + 0.8 * k, 0.18 + 0.4 * k]; p.rEl = 0.55 + 1.2 * k; p.lSh = [0.1 + 1.6 * k, 0.12 + 0.3 * k]; p.lEl = 0.12 + 1.6 * k; p.spine = 0.25 * k; p.neck = -0.45 + 0.7 * k; p.lKnee = 0.25 * k; p.rKnee = 0.25 * k; p.hipY = 0.93 - 0.05 * k; p.mouth = k; return p; },
  // sitting on a stair step, knees up, the burst balloon's string in her hand
  stairSit: (t) => { const p = basePose(); p.hipY = 0.3; p.lHip = [1.9, 0.12]; p.rHip = [1.85, 0.1]; p.lKnee = 2.1; p.rKnee = 2.05; p.spine = 0.45 + 0.03 * Math.sin(t * 2.4); p.neck = 0.45; p.lSh = [0.9, -0.2]; p.rSh = [0.85, -0.25]; p.lEl = 1.5; p.rEl = 1.6; return atBreathe(p, t, 28, 0.7); },
  // stairs: climbing (up), stepping down (holding the rail)
  climb: (ph) => { const p = atWalkPose(ph, 0.6); const s = Math.sin(ph); p.lHip = [0.45 + 0.45 * s, 0.05]; p.rHip = [0.45 - 0.45 * s, 0.05]; p.lKnee = 0.5 + 0.55 * Math.max(0, s); p.rKnee = 0.5 + 0.55 * Math.max(0, -s); p.spine = 0.3; p.hipY = 0.88; return p; },
  down: (ph) => { const p = atWalkPose(ph, 0.55); p.spine = 0.12; p.neck = 0.3; p.lSh = [0.5, 0.45]; p.lEl = 0.5; p.lKnee += 0.15; p.rKnee += 0.15; p.hipY = 0.88; return p; },
  // holding a hand (right arm forward and down)
  leadHand: (ph) => { const p = AT_P.down(ph); p.rSh = [0.35, 0.18]; p.rEl = 0.25; p.headYaw = 0.25; return p; },
  // on the marina: crouching, working on a strap with clumsy hands
  fumble: (t) => { const p = AT_P.kneel(t, 0); p.spine = 0.55; p.neck = 0.55; p.lSh = [1.1 + 0.1 * Math.sin(t * 3.1), -0.25]; p.rSh = [1.15 + 0.12 * Math.sin(t * 2.3 + 1), -0.3]; p.lEl = 1.0; p.rEl = 1.1; return atBreathe(p, t, 32, 0.9); },
  sitPlatform: (t) => { const p = AT_P.stairSit(t); p.hipY = 0.13; p.lHip = [1.5, 0.15]; p.rHip = [1.45, 0.15]; p.lKnee = 0.6; p.rKnee = 0.7; p.spine = 0.3; return p; },
  // the backward roll: sitting on the edge (u 0 → 1 tipping back)
  rollBack: (u) => { const p = basePose(); p.hipY = 0.13; p.lHip = [1.6 + 0.6 * u, 0.12]; p.rHip = [1.6 + 0.6 * u, 0.12]; p.lKnee = 1.2 - 0.6 * u; p.rKnee = 1.2 - 0.6 * u; p.spine = 0.25 - 0.5 * u; p.neck = 0.4; p.lSh = [1.2, -0.25]; p.rSh = [1.6, -0.1]; p.lEl = 1.6; p.rEl = 2.0; return p; },
  // hanging on the line under water: one hand on the line (up), slow fin kicks, the other arm round her
  hang: (t, i, hold = 1) => { const p = basePose(); const k = Math.sin(t * 1.3 + i); p.hipY = 0.93; p.lHip = [0.3 + 0.25 * k, 0.06]; p.rHip = [0.3 - 0.25 * k, 0.06]; p.lKnee = 0.45; p.rKnee = 0.45; p.lFoot = 0.9; p.rFoot = 0.9;
    p.rSh = [2.55, 0.12]; p.rEl = 0.45; p.lSh = [0.7 * hold + 0.3, -0.25 * hold + 0.2]; p.lEl = 1.3 * hold + 0.3; p.spine = 0.1; p.neck = -0.1; p.headYaw = 0.2 * Math.sin(t * 0.3 + i); return p; },
  // kicking up: arms reaching for the light, legs fluttering
  kickUp: (t) => { const p = basePose(); const k = Math.sin(t * 7.5); p.lHip = [0.35 * k, 0.05]; p.rHip = [-0.35 * k, 0.05]; p.lKnee = 0.35 + 0.25 * Math.max(0, k); p.rKnee = 0.35 + 0.25 * Math.max(0, -k); p.lFoot = 1.0; p.rFoot = 1.0;
    p.lSh = [2.9, 0.25]; p.rSh = [2.7, 0.3]; p.lEl = 0.3; p.rEl = 0.4; p.neck = -0.5; p.spine = -0.1; return p; },
  // reaching up for her fin (right arm stretched)
  reach: (t, k) => { const p = AT_P.hang(t, 1, 0); p.lSh = [2.6 * k + 0.3, 0.15]; p.lEl = 0.2; p.neck = -0.6 * k; return p; },
  // the officer on the bridge wing: sitting slumped against the bulkhead, an oxygen mask on
  officer: () => { const p = AT_P.slumpSit(0, 1); p.rSh = [0.35, 0.2]; p.rEl = 0.6; p.neck = 0.55; return p; },
};

// ---------------------------------------------------------------------------------------------------------------------
// FACES: the people seen close get a real face (the engine's HeroFace: eyes, lids, brows, lips); it rebuilds the head,
// so the cap and the ponytail go back on after it. atFaceSet(P, t, F): blinking (staggered), and F's expression.
// ---------------------------------------------------------------------------------------------------------------------
function atFace(P, o = {}) {
  const H = P.j.head, G = PersonGeo, keep = H.children.filter((c) => c.geometry && [G.cap, G.brim, G.pony].includes(c.geometry));
  const L = P.look;
  P.face = new HeroFace(H, Object.assign({ skin: AT_SKIN(L.skin), hair: L.hair, hairStyle: L.hairStyle, seed: 7 }, o));
  for (const c of keep) H.add(c);
  P._faceSeed = (o.seed || 7) * 0.37;
  return P.face;
}
function atFaceSet(P, t, F = {}) {
  if (!P.face) return;
  const per = 3.4 + (P._faceSeed % 1.7), ph = (t + P._faceSeed * 5.3) % per, bl = ph < 0.16 ? Math.sin(ph / 0.16 * ATPI) : 0;
  P.face.set({ blink: Math.max(bl, F.shut || 0), mouth: F.mouth || 0, worry: F.worry || 0, frown: F.frown || 0, brow: F.brow || 0, wide: F.wide || 0 });
}

// ---------------------------------------------------------------------------------------------------------------------
// PROPS ON PEOPLE: a diving mask, a regulator's mouthpiece, fins, a weight belt; an oxygen mask
// ---------------------------------------------------------------------------------------------------------------------
function atDiveGear(P, o = {}) {
  const head = P.j.head, frame = atStd('#1a1d21', 0.5), lens = new THREE.MeshStandardMaterial({ color: '#b8d8e8', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 });
  const mask = new THREE.Group(); head.add(mask); mask.position.set(0, 0.025, 0.088);
  atMesh(new THREE.BoxGeometry(0.16, 0.07, 0.04), frame, 0, 0, 0, mask); atMesh(new THREE.BoxGeometry(0.15, 0.058, 0.01), lens, 0, 0.002, 0.022, mask);
  atMesh(new THREE.TorusGeometry(0.105, 0.008, 4, 18), frame, 0, 0.0, -0.085, mask).rotation.y = ATPI / 2;     // the strap
  // the regulator: a round second stage in the mouth (a grey purge cover on its face), its hose over the right shoulder
  const reg = new THREE.Group(); head.add(reg); reg.position.set(0, -0.062, 0.1);
  const rb = atMesh(new THREE.CylinderGeometry(0.026, 0.028, 0.034, 16), atStd('#202326', 0.5), 0, 0, 0.012, reg); rb.rotation.x = ATPI / 2;
  const rc = atMesh(new THREE.CylinderGeometry(0.02, 0.022, 0.006, 16), atStd('#8a9096', 0.45), 0, 0, 0.031, reg); rc.rotation.x = ATPI / 2;
  atMesh(new THREE.BoxGeometry(0.03, 0.014, 0.02), atStd('#202326', 0.5), 0, -0.022, 0.012, reg);
  const hose = new THREE.CatmullRomCurve3([[0.022, 0, 0.008], [0.07, -0.02, -0.01], [0.1, -0.08, -0.07], [0.1, -0.17, -0.15]].map((q) => new THREE.Vector3(...q)));
  atMesh(new THREE.TubeGeometry(hose, 12, 0.008, 6), atStd('#16181b', 0.6), 0, 0, 0, reg);
  const fins = [];
  if (o.fins !== false) for (const lg of [P.j.ll, P.j.rl]) { const f = atMesh(new THREE.BoxGeometry(0.17, 0.015, 0.55), atStd(o.finCol || '#f2c21a', 0.55), 0, -0.05, 0.26, lg.ft); f.rotation.x = 0.0; fins.push(f); }
  const belt = atMesh(new THREE.BoxGeometry(0.36, 0.05, 0.25), atStd('#2a2e33', 0.6), 0, 0.06, 0, P.j.hips);
  return { mask, reg, fins, belt };
}
function atO2Mask(P) {
  const m = atMesh(new THREE.ConeGeometry(0.062, 0.085, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#f2df8a', roughness: 0.35, side: THREE.DoubleSide }), 0, -0.06, 0.13, P.j.head); m.rotation.x = -ATPI / 2;
  return m;
}
