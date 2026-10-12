/* =====================================================================
   SCENE 11 — "You don't need a perfect picture" (city.js: the covered walkway, still raining; the café-bookshop).
     K1   "Here's something easy to forget.": down the arcade: she listens to the rain at its edge; far off, a friend
          is walking toward her
     K2   "Understanding the world isn't only about knowing what things look like.": with the friend: she lifts a hand
          to wave, remembers, lowers it, smiles, and calls out instead
     K3   "A familiar voice tells you who's nearby.": her experience (sound view): the voice, warm, to her right; she
          turns toward it
     K4   "Footsteps reveal that someone is approaching.": low, her experience: the steps, closer with each one
     K5   "Touch gives you details that sound alone cannot.": the friend's hand on her forearm; she takes the friend's
          arm just above the elbow (the sighted-guide grip); the friend turns to lead
     K6   "And memory helps you understand places you've learned.": they walk toward the café door; she knows the place
     K7   "Blind people use many different combinations of senses, skills and tools.": around them as they walk: hearing
          and touch, a guide's arm, the cane
     K8   "Echolocation is one remarkable possibility among them.": at the door, a click: the glass door and the
          windows answer, close and broad (the sound view)
     K9   "The goal isn't to recreate eyesight. It's to gain useful information and greater independence.": the sound
          view gives way to the picture: the two of them at the door, wide; she smiles
     K10  (no narration) the friend opens the door; the room beyond pours out (voices, cups, a warm enclosed room);
          they go in together
   ===================================================================== */
Object.assign(GB_LOOKS, {
  friend: { skin: '#b67c5c', lip: '#6e3a32', top: '#7a3f63', topDark: '#62324f', pants: '#3b3f4c', shoes: '#5a3a2a', sole: '#1e1612', hair: '#2a1a12', hairStyle: 'pony', build: 0.96, head: 0.98 },
  barista: { skin: '#d4a385', lip: '#8a4a44', top: '#2b2b2e', topDark: '#1e1e21', pants: '#2b2b30', shoes: '#2a2420', sole: '#141212', hair: '#6a4a2e', hairStyle: 'short', build: 1.0, head: 1.0 },
});

BE.k2 = bnE(11, 'understanding').start - 0.3;
BE.k3 = bnE(11, 'familiar').start - 0.4;
BE.k4 = bnE(11, 'footsteps').start - 0.3;
BE.k5 = bnE(11, 'touch').start - 0.3;
BE.k6 = bnE(11, 'and').start - 0.3;
BE.k7 = bnE(11, 'blind').start - 0.3;
BE.k8 = bnE(11, 'echolocation').start - 0.3;
BE.k9 = bnE(11, 'goal').start - 0.45;
BE.k10 = BN_CLIP[11].speechEnd + 0.2;
BE.k10b = BE.k10 + 1.7;
BE.k10c = BE.k10 + 3.2;
BE.s12 = BN_SC[12].start;
BE.rainEnd = BE.s12 + 0.6;                                  // the rain bed (sound-rain.js) runs to here
BE.kW = { senses: bnE(11, 'senses').start, skills: bnE(11, 'skills').start, tools: bnE(11, 'tools').start, memory: bnE(11, 'memory').start, smile: bnE(11, "it's").start };
BE.kWave = [BE.k2 + 1.7, BE.k2 + 3.1];                       // the friend lifts a hand to wave, then lowers it
BE.kCall = [bnE(11, 'like').end + 0.25, bnE(11, 'like').end + 0.5];   // she calls out (between the narrator's lines)
BE.kTurn = [BE.k3 + 1.15, BE.k3 + 2.3];                      // Noor turns toward the voice
BE.kArrive = BE.k5 - 0.25;                                   // the friend has arrived
BE.kTouch = BE.k5 + 0.45;                                    // her hand on Noor's forearm
BE.kGrip = [BE.k5 + 2.4, BE.k5 + 3.1];                       // Noor takes the friend's arm
BE.kWalk = [BE.k6 + 0.45, BE.k7 + 3.4];                      // together to the café door
BE.kClick = bnE(11, 'echolocation').start + 0.45;
BE.kDoor = [BE.k10 + 0.5, BE.k10 + 1.6];                     // the door swings in
BE.kIn = [BE.k10b + 0.9, BE.s12 + 0.2];                      // they go in

// the friend's speech (syllable times: the mouth, the voice rings, the sound): a call, a greeting, a word at the door
const BE_FRIEND_TALK = (() => {
  const r = new RNG(1111), out = [];
  const phrase = (t, n, gap = [0.13, 0.2]) => { for (let i = 0; i < n; i++) { out.push({ t, d: r.range(0.1, 0.16) }); t += r.range(gap[0], gap[1]); } };
  out.push({ t: BE.kCall[0] - 0.05, d: 0.16, call: true }, { t: BE.kCall[0] + 0.15, d: 0.3, call: true });
  phrase(bnE(11, 'nearby').end + 0.15, 2);
  phrase(BE.kTouch + 0.05, 3);
  phrase(bnE(11, 'cannot').end + 0.12, 3);
  phrase(BE.k10 + 0.05, 4);
  return out;
})();
const BE_NOOR_TALK = (() => { const r = new RNG(1112), out = []; let t = BE.k10 + 0.95; for (let i = 0; i < 3; i++) { out.push({ t, d: r.range(0.1, 0.15) }); t += r.range(0.14, 0.2); } return out; })();
const beTalking = (L, t) => L.some((q) => t > q.t && t < q.t + q.d);

// ---- the café-bookshop behind the glass door (x 52.7…63.3, z 15.2…21.5), its people; the friend
const BE_CAFE = { x0: 52.7, x1: 63.3, z0: 15.2, z1: 21.5, h: 3.4 };
BE_SET_BUILDERS.push((app, cast) => {
  const c = app.sets.city, C = BE_CAFE, r = new RNG(1113), g = c.cafe = new THREE.Group(); g.name = 'beCafe'; c.root.add(g);
  c.cafeBack.visible = false;
  // the dark backing behind the café's front comes away (the real room is behind the glass now); a fascia above it
  c.root.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'beCityArcadeWallStone') o.visible = false; });
  // the ground floor behind the arcade is solid (city.js): cut the café's room out of it (left, right and back pieces)
  for (const m of c.arcadeGf) { const P = m.geometry.parameters, bx0 = m.position.x - P.width / 2, bx1 = m.position.x + P.width / 2, bz0 = m.position.z - P.depth / 2, bz1 = m.position.z + P.depth / 2;
    if (bx1 < C.x0 - 0.15 || bx0 > C.x1 + 0.15) continue;
    m.visible = false;
    if (bx0 < C.x0 - 0.15) beBox(c.root, C.x0 - 0.15 - bx0, P.height, P.depth, (bx0 + C.x0 - 0.15) / 2, m.position.y, m.position.z, m.material);
    if (bx1 > C.x1 + 0.15) beBox(c.root, bx1 - C.x1 - 0.15, P.height, P.depth, (bx1 + C.x1 + 0.15) / 2, m.position.y, m.position.z, m.material);
    const x0 = Math.max(bx0, C.x0 - 0.15), x1 = Math.min(bx1, C.x1 + 0.15);
    beBox(c.root, x1 - x0, P.height, bz1 - C.z1 - 0.15, (x0 + x1) / 2, m.position.y, (bz1 + C.z1 + 0.15) / 2, m.material); }
  gbAdd(g, new THREE.PlaneGeometry(C.x1 - C.x0, BE_CITY.arcade.h - 3.3), gbMat('#2a2622', { rough: 0.6, name: 'beCafeFasciaStone' }), (C.x0 + C.x1) / 2, (BE_CITY.arcade.h + 3.3) / 2, C.z0 - 0.01, { ry: Math.PI, cast: false });
  // the shop windows become glass (the real room shows through)
  const glass = new THREE.MeshStandardMaterial({ color: '#d8e6ee', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.14, name: 'beCafeWindowGlass', envMapIntensity: 0.45, depthWrite: false });
  for (const w of c.cafeWins) w.material = glass;
  const floorTx = beCanvasTex(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { const v = r.range(-14, 14); x.fillStyle = `rgb(${128 + v},${86 + v * 0.7},${54 + v * 0.5})`; x.fillRect(0, i * 64, w, 64); x.fillStyle = 'rgba(40,24,14,0.5)'; x.fillRect(0, i * 64, w, 2); for (let k = 0; k < 3; k++) x.fillRect(r.range(0, w), i * 64, 2, 64); } Tex.noise(x, w, h, 8, r); }, [3, 3]);
  const floorM = new THREE.MeshStandardMaterial({ map: floorTx, roughness: 0.55, name: 'beCafeFloorWood', envMapIntensity: 0.5 });
  gbAdd(g, new THREE.PlaneGeometry(C.x1 - C.x0, C.z1 - C.z0), floorM, (C.x0 + C.x1) / 2, 0.004, (C.z0 + C.z1) / 2, { rx: -Math.PI / 2, cast: false });
  const wallM = gbMat('#d9b48a', { rough: 0.85, name: 'beCafeWallPlaster' }), ceilM = gbMat('#e8d6bc', { rough: 0.9, name: 'beCafeCeilingPlaster' });
  beBox(g, C.x1 - C.x0, 0.1, C.z1 - C.z0, (C.x0 + C.x1) / 2, C.h + 0.05, (C.z0 + C.z1) / 2, ceilM, { cast: false });
  beBox(g, C.x1 - C.x0 + 0.3, C.h, 0.15, (C.x0 + C.x1) / 2, C.h / 2, C.z1 + 0.075, wallM, { cast: false });
  for (const x of [C.x0 - 0.075, C.x1 + 0.075]) beBox(g, 0.15, C.h, C.z1 - C.z0, x, C.h / 2, (C.z0 + C.z1) / 2, wallM, { cast: false });
  // the inside of the front: a lintel over the windows and the door, the piers between
  beBox(g, C.x1 - C.x0, C.h - 3.35, 0.12, (C.x0 + C.x1) / 2, (C.h + 3.35) / 2, C.z0 + 0.08, wallM, { cast: false });
  for (const x of [57.33, 58.67]) beBox(g, 0.12, 3.35, 0.12, x, 1.675, C.z0 + 0.08, wallM, { cast: false });
  // bookshelves: the back wall and the left wall, floor to near the ceiling, full of books (one instanced mesh)
  const shelfM = gbMat('#6b4630', { rough: 0.6, name: 'beCafeShelfWood' }), books = [];
  const shelfRun = (x0, z0, dx, dz, len, rot) => {
    const nx = dz, nz = -dx;   // the shelf faces into the room
    for (let k = 0; k < 6; k++) { const y = 0.12 + k * 0.48; beBox(g, Math.abs(dx) * len + Math.abs(dz) * 0.3, 0.03, Math.abs(dz) * len + Math.abs(dx) * 0.3, x0 + dx * len / 2 + nx * 0.15, y, z0 + dz * len / 2 + nz * 0.15, shelfM, { cast: false });
      let s = 0.05; while (s < len - 0.05) { const w = r.range(0.025, 0.06), h = r.range(0.24, 0.38), d = r.range(0.17, 0.24); if (r.next() < 0.07) { s += r.range(0.1, 0.25); continue; } books.push({ x: x0 + dx * (s + w / 2) + nx * (d / 2 + 0.03), y: y + 0.015 + h / 2, z: z0 + dz * (s + w / 2) + nz * (d / 2 + 0.03), w, h, d, rot, tilt: r.next() < 0.06 ? r.range(-0.25, 0.25) : 0 }); s += w + 0.004; } }
  };
  shelfRun(C.x0 + 0.3, C.z1, 1, 0, C.x1 - C.x0 - 3.6, 0);
  shelfRun(C.x0, C.z0 + 1.2, 0, 1, C.z1 - C.z0 - 1.5, Math.PI / 2);
  { const bm = new THREE.MeshStandardMaterial({ roughness: 0.7, name: 'beCafeBookCloth' }), im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bm, books.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
    const pal = ['#7a2e2a', '#2e4a6a', '#3d5a3a', '#c9a24a', '#5a3a5a', '#d8cbb0', '#2a2a2a', '#9a5a2a', '#4a6a7a'];
    books.forEach((b, i) => { e.set(0, b.rot, b.tilt); q.setFromEuler(e); M.compose(new THREE.Vector3(b.x, b.y, b.z), q, new THREE.Vector3(b.w, b.h, b.d)); im.setMatrixAt(i, M); im.setColorAt(i, col.set(pal[(i * 7 + (i >> 3)) % pal.length]).multiplyScalar(r.range(0.75, 1.1))); });
    im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; g.add(im); }
  // the counter (right), its espresso machine and cups; three small tables with chairs; pendant lamps
  const woodM = gbMat('#8a5a3a', { rough: 0.5, name: 'beCafeCounterWood' }), topM = gbMat('#e9e2d6', { rough: 0.3, name: 'beCafeCounterStone' }), steel = gbMat('#b9bec4', { rough: 0.25, metal: 0.9, name: 'beCafeMachineSteel' });
  beBox(g, 0.7, 1.0, 3.6, 62.1, 0.5, 18.4, woodM); beBox(g, 0.8, 0.05, 3.7, 62.1, 1.02, 18.4, topM);
  beBox(g, 0.5, 0.42, 0.62, 62.25, 1.26, 17.6, steel); beBox(g, 0.12, 0.08, 0.5, 61.95, 1.12, 17.6, steel);
  const cupM = gbMat('#f4efe6', { rough: 0.35, name: 'beCafeCupCeramic' });
  for (let k = 0; k < 6; k++) gbAdd(g, new THREE.CylinderGeometry(0.04, 0.034, 0.08, 10), cupM, 62.25 + (k % 3) * 0.1 - 0.1, 1.51, 17.45 + (k >> 1 & 1) * 0.12 + 0.3, { cast: false });
  const tableM = gbMat('#5a3a26', { rough: 0.5, name: 'beCafeTableWood' }), legM = gbMat('#2a2624', { rough: 0.4, metal: 0.6, name: 'beCafeTableMetal' });
  for (const [x, z] of [[55.2, 17.6], [59.9, 19.6], [55.6, 20.1]]) {
    gbAdd(g, new THREE.CylinderGeometry(0.38, 0.38, 0.04, 20), tableM, x, 0.74, z); gbAdd(g, new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8), legM, x, 0.37, z); gbAdd(g, new THREE.CylinderGeometry(0.2, 0.22, 0.02, 14), legM, x, 0.01, z);
    for (const a of [0.4, 0.4 + Math.PI]) { const cx = x + Math.cos(a) * 0.62, cz = z + Math.sin(a) * 0.62; beBox(g, 0.4, 0.04, 0.4, cx, 0.45, cz, tableM); beBox(g, 0.04, 0.45, 0.4, cx + Math.cos(a) * 0.2, 0.67, cz + Math.sin(a) * 0.2, tableM, { ry: 0 }); for (const [u, v] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) gbAdd(g, new THREE.CylinderGeometry(0.015, 0.015, 0.44, 6), legM, cx + u, 0.22, cz + v, { cast: false }); }
    gbAdd(g, new THREE.CylinderGeometry(0.04, 0.034, 0.08, 10), cupM, x + 0.12, 0.8, z - 0.05, { cast: false });
  }
  const glowM = new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffcf8a', emissiveIntensity: 2.2, name: 'beCafeLampGlow' });
  c.cafeLamps = [];
  for (const [x, z] of [[55.4, 17.6], [59.9, 19.6], [55.6, 20.1], [62.1, 18.4]]) c.cafeLamps.push(gbAdd(g, new THREE.SphereGeometry(0.14, 14, 10), glowM, x, 2.35, z, { cast: false }), gbAdd(g, new THREE.CylinderGeometry(0.005, 0.005, C.h - 2.45, 4), legM, x, (C.h + 2.45) / 2, z, { cast: false }));
  c.cafeLight = new THREE.PointLight('#ffcf96', 0, 11, 1.4); c.cafeLight.position.set(58.0, 2.6, 18.2); c.scene.add(c.cafeLight);
  beAcousticScene(g, 'world', { beCafeLampGlow: { refl: 0.2, crisp: 0.3 } });
  // the people inside: two at the tables, one behind the counter
  c.cafePeople = {};
  for (const [id, look, x, z, yaw, pose] of [['c1', 'cityA', 55.2 + Math.cos(0.4) * 0.62, 17.6 + Math.sin(0.4) * 0.62, -2.0, 'sitRelax'], ['c2', 'cityB', 55.6 + Math.cos(0.4 + Math.PI) * 0.62, 20.1 + Math.sin(0.4 + Math.PI) * 0.62, 1.2, 'sitRelax'], ['c3', 'barista', 62.7, 18.0, -Math.PI / 2, 'stand']]) {
    const P = new GbCharacter(c.scene, look, { name: id }); beAcousticScene(P.root, 'world'); P.J.hc.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
    c.cafePeople[id] = { P, segs: [{ t0: -1, p0: new THREE.Vector3(x, 0, z), yaw, pose, face: 'content', hdY: (t) => 8 * Math.sin(t * 0.6 + x) }] };
  }
  // the friend (a teal raincoat, a ponytail)
  c.friend = new GbCharacter(c.scene, 'friend', { name: 'friend' }); beAcousticScene(c.friend.root, 'world'); c.friend.J.hc.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
  // the café's door handle (world) and the frame wrapper: the friend, the café people, the door
  const prevFrame = c.frame, prevFx = c.fx, prevExtra = c.extra;
  c.frame = function (app2, t, shot) { prevFrame.call(this, app2, t, shot); beCafeFrame.call(this, app2, t, shot); };
  c.fx = function (app2, t, shot, L) { prevFx.call(this, app2, t, shot, L); beCafeFx.call(this, app2, t, shot, L); };
  c.extra = function (t, L, cam, shot) { prevExtra.call(this, t, L, cam, shot); beCafeExtra.call(this, t, L, cam, shot); };
});

// ---- blocking. She has turned to the rain at the arcade's edge (end of scene 10); the friend comes along the arcade
const _beK = (x, z) => new THREE.Vector3(x, 0, z);
const BE_K = { noor0: _beK(50.6, 13.25), fr0: _beK(66.6, 13.7), frA: _beK(51.3, 13.3), frB: _beK(51.05, 12.88), frC: _beK(57.9, 13.55), noorC: _beK(57.35, 13.95),
  frD: _beK(57.95, 14.55), frIn: _beK(58.05, 17.0), noorIn: _beK(57.9, 16.25) };
// her left hand on the friend's right arm, just above the elbow (the sighted-guide grip)
const beGripW = (t) => t < BE.kGrip[0] || t > BE.s12 + 0.5 ? 0 : t < BE.kWalk[0] ? MathX.smooth(t, BE.kGrip[0], BE.kGrip[1]) : 1;
function beGripArm(H, t, w) {
  if (w < 0.002) return;
  const F = FILM._app.sets.city.friend, sh = F.worldOf('RSh'), el = F.worldOf('REl'), p = sh.lerp(el, 0.72);
  H.solveArm('L', p, new THREE.Vector3(0, -1, 0), w);
}
{
  const B = BE, segs = BE_HERO_CITY, last = segs[segs.length - 1], K = BE_K;
  // scene 10's last beat: under the roof she turns back to face the rain (to listen to it), not along the arcade
  const turnIn = last.yaw(B.jIn[1]); last.yaw = (t) => MathX.lerp(turnIn, -Math.PI, MathX.smooth(t, B.jIn[1], B.jIn[1] + 1.8));
  segs.push(
    { t0: B.s11 - 0.01, p0: K.noor0, cane: true, face: 'focus',
      yaw: (t) => MathX.lerp(-Math.PI, -1.5 * Math.PI, MathX.smooth(t, B.kTurn[0] + 0.5, B.kTurn[1] + 0.4)),
      hdY: (t) => -34 * MathX.window(t, B.kTurn[0] - 0.15, B.kTurn[1] + 0.2, 0.45, 0.6) + 6 * Math.sin((t - B.s11) * 0.5) * (1 - MathX.smooth(t, B.k3, B.kTurn[0])),
      smile: 0, adjust: (P, t) => { const s = MathX.smooth(t, B.kTurn[0] + 0.3, B.kTurn[1] + 0.8); P.hdX = (P.hdX || 0) - 4 * s; },
      after: (H, t) => { const s = MathX.smooth(t, B.kTurn[0] + 0.4, B.kTurn[1] + 1.0); if (s > 0) H.applyFace(Object.assign({}, GB_FACES.calm, { smile: 0.55 * s }), { x: 0, y: -0.15 }); } },
    { t0: B.kWalk[0] + 0.1, t1: B.kWalk[1] + 0.15, p0: K.noor0, p1: K.noorC, cane: true, step: 0.44, face: 'calm' },
    { t0: B.kWalk[1] + 0.15, p0: K.noorC, cane: true, face: 'calm', yaw: (t) => MathX.lerp(Math.atan2(K.noorC.x - K.noor0.x, K.noorC.z - K.noor0.z), 0, MathX.smooth(t, B.kWalk[1] + 0.1, B.kWalk[1] + 1.0)),
      hdY: (t) => 10 * MathX.window(t, B.kClick + 0.1, B.kClick + 1.6, 0.3, 0.6) - 18 * MathX.window(t, B.kDoor[0] + 0.4, B.kIn[0], 0.4, 0.5),
      after: (H, t) => { const s = MathX.smooth(t, B.kW.smile - 0.4, B.kW.smile + 0.6); H.applyFace(Object.assign({}, GB_FACES.calm, { smile: 0.25 + 0.5 * s, open: beTalking(BE_NOOR_TALK, t) ? 0.2 : 0 }), { x: 0, y: -0.15 }); } },
    { t0: B.kIn[0] + 0.35, t1: B.kIn[1] + 0.4, p0: K.noorC, p1: K.noorIn, cane: true, step: 0.4, face: 'calm' },
  );
}
const BE_FRIEND = (() => {
  const B = BE, K = BE_K;
  // the wave (inverse kinematics: the hand up beside the head, the forearm rocking), then lowered: she remembers
  const wave = (H, t) => { const w = MathX.window(t, B.kWave[0], B.kWave[1], 0.35, 0.45); if (w < 0.001) return;
    const sh = H.worldOf('RSh'), rt = sh.clone().sub(H.worldOf('LSh')).setY(0).normalize(), up = new THREE.Vector3(0, 1, 0), fw = new THREE.Vector3().crossVectors(up, rt);
    const s = Math.sin((t - B.kWave[0]) * 2 * Math.PI * 2.2) * MathX.smooth(t, B.kWave[0] + 0.25, B.kWave[0] + 0.45);
    H.solveArm('R', sh.clone().addScaledVector(rt, 0.2 + 0.08 * s).addScaledVector(up, 0.4).addScaledVector(fw, 0.12), rt.clone().addScaledVector(up, -0.7), w); };
  const talkFace = (H, t, base, smile) => H.applyFace(Object.assign({}, GB_FACES[base], { smile, open: beTalking(BE_FRIEND_TALK, t) ? 0.3 : 0.02, width: beTalking(BE_FRIEND_TALK, t) ? 0.8 : 1 }), { x: 0, y: 0 });
  return [
    { t0: B.s11 - 1.0, t1: B.kArrive, p0: K.fr0, p1: K.frA, pose: 'stand', step: 0.64, face: 'content', ease: beEaseWalk(0.02, 0.16),
      after: (H, t) => { wave(H, t); talkFace(H, t, 'content', 0.2 + 0.4 * MathX.smooth(t, B.kWave[1] - 0.3, B.kWave[1] + 0.6)); } },
    { t0: B.kArrive, p0: K.frA, pose: 'stand', yaw: -Math.PI / 2, face: 'content',
      after: (H, t) => { const w = MathX.window(t, B.kTouch - 0.35, B.kGrip[0] + 0.2, 0.35, 0.4); if (w > 0.001) { const N = FILM._app.sets.city.hero, p = N.worldOf('LEl').lerp(N.worldOf('LWr'), 0.45).add(new THREE.Vector3(0, 0.02, 0)); H.solveArm('R', p, new THREE.Vector3(0, -1, -0.3), w); } talkFace(H, t, 'content', 0.65); } },
    // she turns to lead: a half turn and a step to Noor's front-left
    { t0: B.kGrip[0] - 0.3, t1: B.kGrip[1] + 0.2, p0: K.frA, p1: K.frB, pose: 'stand', step: 0.3, face: 'content', after: (H, t) => talkFace(H, t, 'content', 0.6) },
    { t0: B.kGrip[1] + 0.2, p0: K.frB, pose: 'stand', yaw: Math.PI / 2, face: 'content', after: (H, t) => talkFace(H, t, 'content', 0.55) },
    { t0: B.kWalk[0], t1: B.kWalk[1], p0: K.frB, p1: K.frC, pose: 'stand', step: 0.5, face: 'content', adjust: (P) => { P.RShX = -6; P.RElX = -18; P.RShAbd = 10; }, after: (H, t) => talkFace(H, t, 'content', 0.5) },
    { t0: B.kWalk[1], p0: K.frC, pose: 'stand', yaw: (t) => MathX.lerp(Math.atan2(K.frC.x - K.frB.x, K.frC.z - K.frB.z), 0, MathX.smooth(t, B.kWalk[1], B.kWalk[1] + 0.9)), face: 'content',
      adjust: (P) => { P.RShX = -6; P.RElX = -18; P.RShAbd = 10; }, hdY: (t) => 14 * MathX.window(t, B.k9 + 1.5, B.k10 - 0.2, 0.5, 0.5), after: (H, t) => talkFace(H, t, 'content', 0.6) },
    { t0: B.k10 + 0.05, t1: B.kDoor[0] + 0.3, p0: K.frC, p1: K.frD, pose: 'stand', step: 0.35, face: 'content', adjust: (P) => { P.RShX = -6; P.RElX = -18; P.RShAbd = 10; }, after: (H, t) => talkFace(H, t, 'content', 0.6) },
    { t0: B.kDoor[0] + 0.3, p0: K.frD, pose: 'stand', yaw: 0, face: 'content', adjust: (P) => { P.RShX = -6; P.RElX = -18; P.RShAbd = 10; },
      after: (H, t) => { const w = MathX.window(t, B.kDoor[0] - 0.1, B.kIn[0] + 0.3, 0.3, 0.3); if (w > 0.001) H.solveArm('L', beCafeHandle(t).add(new THREE.Vector3(0, 0, -0.04)), new THREE.Vector3(1, -0.6, 0), w); talkFace(H, t, 'content', 0.6); } },
    { t0: B.kIn[0], t1: B.kIn[1], p0: K.frD, p1: K.frIn, pose: 'stand', step: 0.5, face: 'content', adjust: (P) => { P.RShX = -6; P.RElX = -18; P.RShAbd = 10; } },
    { t0: B.kIn[1], p0: K.frIn, pose: 'stand', yaw: 0.4, face: 'content' },
  ];
})();
// the door's angle (opening inward) and its handle in the world
function beCafeDoorAngle(t) { return -1.35 * Ease.inOutSine(MathX.ramp(t, BE.kDoor[0], BE.kDoor[1])); }
function beCafeHandle(t) { const a = beCafeDoorAngle(t), A = BE_CITY.arcade; return new THREE.Vector3(A.door - 0.6 + Math.cos(-a) * 1.05, 1.05, A.back - 0.02 + Math.sin(-a) * 1.05 - 0.06 * Math.cos(-a)); }

function beCafeFrame(app, t, shot) {
  const c = this, on = t > BE.s11 - 3 && t < BE.s12 + 0.5;
  c.friend.root.visible = on; c.cafeDoor.rotation.y = beCafeDoorAngle(t);
  if (on) beActor(c.friend, t, BE_FRIEND, { blinks: [BE.s11 + 2.2, BE.k4 + 0.4, BE.k7 + 1.1, BE.k9 + 2.0] });
  if (on) beGripArm(c.hero, t, beGripW(t));   // her hand on the friend's arm (the friend is posed by now)
  for (const id in c.cafePeople) { const q = c.cafePeople[id]; q.P.root.visible = on; if (on) beActor(q.P, t, q.segs, { blinks: [BE.s11 + 1 + id.charCodeAt(1), BE.k8 + id.charCodeAt(1) * 0.3] }); }
}
function beCafeExtra(t, L, cam, shot) {
  const c = this, ac = L.ac > 0.5;
  const k = MathX.smooth(t, BE.s11 - 4, BE.s11 - 1) * (t < BE.s12 + 0.5 ? 1 : 0);
  for (const m of c.cafeLamps) m.visible = !ac;
  c.cafeLight.intensity = ac ? 0 : 5.5 * k * (1 + 0.6 * MathX.smooth(t, BE.kDoor[0], BE.kDoor[1]));
  if (t > BE.s11 - 0.5 && !ac) c.arcadeLamps.forEach((p) => { p.intensity = 9; });
}
// the sound view: the friend's voice (warm rings at her mouth), her footsteps (small rings at the floor), the click at
// the door (the glass front answers), the room beyond the open door (voices, cups, the machine)
function beCafeFx(app, t, shot, L) {
  const c = this, R = c.rings, Wv = c.waves;
  if (L.ac < 0.5 || t < BE.s11 - 0.5 || t > BE.s12) return;
  const F = c.friend, mouth = F.worldOf('hd').add(new THREE.Vector3(0, 0.02, 0));
  const voice = BE_FRIEND_TALK.map((q) => q.t).filter((x) => x <= t && x > t - 1.0);
  if (voice.length) R.source(mouth, voice, t, { r: 0.45, a: 0.85, dur: 1.0, col: '#ffcf8a', th: 0.08 });
  for (const h of c._friendSteps || []) if (t > h.t && t < h.t + 0.7) R.source(h.p, [h.t], t, { r: 0.34, a: 0.75, dur: 0.7, col: '#ffd9a0', th: 0.1, squash: 0.35 });
  if (t > BE.kClick && t < BE.kClick + 1.6) {
    const N = c.hero, q = { t: BE.kClick, p: beMouth(N) };
    Wv.click(q, t, [{ p: new THREE.Vector3(58, 0, BE_CITY.arcade.back), n: new THREE.Vector3(0, 0, -1), refl: 0.95 }, { p: new THREE.Vector3(58, 0, 0), n: new THREE.Vector3(0, 1, 0), refl: 0.6, floor: true }], { speed: 3.2, life: 1.6, a: 0.12 });
    R.source(q.p, [q.t], t, { r: 0.07, a: 0.8, dur: 0.45, col: '#9ff6ff' });
  }
  if (t > BE.kDoor[0]) {
    const open = MathX.smooth(t, BE.kDoor[0], BE.kDoor[1]);
    for (const [id, per, off] of [['c1', 0.9, 0.1], ['c2', 1.3, 0.5], ['c3', 1.7, 0.2]]) { const P = c.cafePeople[id].P, p = P.worldOf('hd'); const k = Math.floor((t - off) / per); R.source(p, [k * per + off, (k - 1) * per + off], t, { r: 0.5, a: 0.6 * open, dur: 1.2, col: '#ffcf8a', th: 0.08 }); }
    { const k = Math.floor(t / 0.75); R.source(new THREE.Vector3(62.25, 1.3, 17.6), [k * 0.75, (k - 1) * 0.75], t, { r: 0.6, a: 0.5 * open, dur: 1.4, col: '#ffb05a', th: 0.06 }); }
  }
}

// the pulses: the friend's steps and voice paint the arcade (amber); the click at the door (cyan); the room beyond
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, c = app.sets.city;
  c._friendSteps = []; for (const sg of BE_FRIEND) if (sg.p1) for (const h of beActPlan(sg)) if (h.t0 > sg.t0 && h.t0 < sg.t1) c._friendSteps.push({ t: h.t0, p: new THREE.Vector3(h.p.x, 0.03, h.p.z) });
  for (const id of ['K3', 'K4']) { const S = BE_SHOTS.find((s) => s.id === id); for (const h of c._friendSteps) if (h.t > S.t0 - 0.5 && h.t < S.t1) P.add({ t: h.t, p: h.p, kind: 1, speed: 3.0, w: 0.08, life: 1.0, str: 0.7, set: 'city', shot: id }); }
  for (const q of BE_FRIEND_TALK) if (q.t > BE.k3 - 1.2 && q.t < BE.k4) { FILM._shot = BE_SHOTS.find((s) => s.id === 'K3'); beActor(c.friend, q.t, BE_FRIEND, {}); P.add({ t: q.t, p: c.friend.worldOf('hd'), kind: 1, speed: 3.0, w: 0.1, life: 1.2, str: 0.9, set: 'city', shot: 'K3' }); }
  { FILM._shot = BE_SHOTS.find((s) => s.id === 'K8'); beActor(c.hero, BE.kClick, BE_HERO_CITY, { cane: c.cane }); P.add({ t: BE.kClick, p: beMouth(c.hero), kind: 0, speed: 3.2, w: 0.1, life: 1.6, str: 1.6, set: 'city', shot: 'K8', click: true }); }
  { const r = new RNG(1114); for (let t = BE.kDoor[0] + 0.2; t < BE.k10c; t += r.range(0.3, 0.55)) P.add({ t, p: new THREE.Vector3(r.range(54, 62), r.range(0.8, 1.3), r.range(16.5, 20.5)), kind: 1, speed: 3.2, w: 0.1, life: 1.5, str: 0.75, set: 'city', shot: 'K10b' }); }
  FILM._shot = null;
});

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE, K = BE_K;
  const ct = () => FILM._app.sets.city;
  const ac = (w = 0.035, h = 0.3) => ({ ac: 1, world: w, hero: h, glow: 0.05 });
  const lab = (p, html, a, cls, dx, dy) => ({ p, html, a, cls, dx, dy });
  const fx = () => ct().friend.root.position.x;
  const mid = () => ct().hero.root.position.clone().lerp(ct().friend.root.position, 0.5);
  const S = [
    // K1: down the arcade: she listens to the rain at its edge; far off, the friend walks toward her
    { id: 'K1', t0: B.s11, t1: B.k2, set: 'city', look: () => BE_REAL, rainAlpha: 0.55,
      cam: beMove(B.s11, B.k2 + 0.6, [V(46.4, 1.72, 14.6), V(60, 1.3, 13.3), 42], [V(47.3, 1.68, 14.5), V(60, 1.3, 13.3), 42], { dof: 0.12, focus: (t, pos) => pos.distanceTo(ct().hero.root.position) }) },
    // K2: with the friend (the camera backs away ahead of her): a wave, she remembers, lowers the hand, calls out
    { id: 'K2', t0: B.k2, t1: B.k3, set: 'city', look: () => BE_REAL,
      cam: (t) => { const x = fx(), k = MathX.ramp(t, B.k2, B.k3); return { pos: V(x - 2.7 + 0.2 * k, 1.5, 12.75), at: V(x, 1.42, 13.65), fov: 38, focus: 2.85, dof: 0.35 }; } },
    // K3: her experience: the voice to her right, warm; she turns toward it
    { id: 'K3', t0: B.k3, t1: B.k4, set: 'city', tag: true, look: () => ac(0.04, 0.32), decay: 0.5, gain: 1.2, heroGain: 0.55, shells: false, splash: 0.9,
      cam: beMove(B.k3, B.k4, [V(50.25, 1.78, 14.35), V(55.5, 1.35, 12.9), 50], [V(50.35, 1.76, 14.3), V(55.0, 1.35, 13.0), 48], { dof: 0 }),
      labels: (t) => [lab(ct().friend.worldOf('hd').add(V(0, 0.32, 0)), '<div class="k">A VOICE SHE KNOWS</div>', MathX.smooth(t, B.k3 + 0.5, B.k3 + 0.9) * (1 - MathX.smooth(t, B.k4 - 0.4, B.k4)))] },
    // K4: low, her experience: the steps, closer with each one
    { id: 'K4', t0: B.k4, t1: B.k5, set: 'city', tag: true, look: () => ac(0.04, 0.32), decay: 0.5, gain: 1.2, heroGain: 0.55, shells: false, splash: 0.9,
      cam: beMove(B.k4, B.k5, [V(49.9, 0.32, 12.85), V(54.5, 0.12, 13.6), 54], [V(50.05, 0.3, 12.9), V(53.5, 0.12, 13.55), 54], { dof: 0 }),
      labels: (t) => [lab(V(52.6, 0.45, 13.6), '<div class="k">FOOTSTEPS</div><div class="s">CLOSER WITH EVERY STEP</div>', MathX.smooth(t, B.k4 + 0.4, B.k4 + 0.8) * (1 - MathX.smooth(t, B.k5 - 0.4, B.k5)))] },
    // K5: hands: hers on Noor's forearm; Noor takes her arm above the elbow; she turns to lead
    { id: 'K5', t0: B.k5, t1: B.k6, set: 'city', look: () => BE_REAL,
      cam: beMove(B.k5 + 0.6, B.k6 - 0.2, [V(51.0, 1.2, 12.25), V(51.0, 1.02, 13.25), 38], [V(52.55, 1.5, 11.75), V(50.95, 1.18, 13.1), 42], { dof: 0.35, ease: Ease.inOutCubic, focus: (t, pos) => pos.distanceTo(V(50.95, 1.05, 13.15)) }) },
    // K6: together toward the café door; the café is a place she knows
    { id: 'K6', t0: B.k6, t1: B.k7, set: 'city', look: () => BE_REAL,
      cam: beMove(B.k6, B.k7, [V(60.6, 1.8, 12.95), V(53.6, 1.2, 13.4), 44], [V(59.9, 1.75, 13.05), V(54.9, 1.2, 13.5), 44], { dof: 0.15, focus: (t, pos) => pos.distanceTo(mid()) }),
      labels: (t) => [lab(V(55.4, 2.3, 15.1), '<div class="k">THE CAFÉ</div><div class="s">A PLACE SHE KNOWS</div>', MathX.smooth(t, B.kW.memory + 0.2, B.kW.memory + 0.6) * (1 - MathX.smooth(t, B.k7 - 0.4, B.k7)))] },
    // K7: around them as they walk: hearing and touch, a guide's arm, the cane
    { id: 'K7', t0: B.k7, t1: B.k8, set: 'city', look: () => BE_REAL,
      cam: (t) => { const m = mid(), k = Ease.inOutSine(MathX.ramp(t, B.k7, B.k8)), a = MathX.lerp(-1.25, -0.35, k); return { pos: V(m.x + 3.1 * Math.cos(a), 1.55 - 0.1 * k, m.z + 3.1 * Math.sin(a)), at: V(m.x, 1.12, m.z), fov: 44, focus: 3.1, dof: 0.2 }; },
      labels: (t) => { const N = ct().hero, a = (w) => MathX.smooth(t, w - 0.05, w + 0.3) * (1 - MathX.smooth(t, B.k8 - 0.35, B.k8));
        return [lab(N.worldOf('hd').add(V(0, 0.3, 0)), '<div class="k">HEARING · TOUCH</div>', a(B.kW.senses)),
          lab(N.worldOf('LWr').add(V(0, -0.1, 0)), '<div class="k">A GUIDE’S ARM</div>', a(B.kW.skills)),
          lab(ct().cane.position.clone().add(V(0, 0.12, 0)), '<div class="k">THE CANE</div>', a(B.kW.tools))]; } },
    // K8: at the door: a click; the glass front answers, close and broad (the sound view)
    { id: 'K8', t0: B.k8, t1: B.k9, set: 'city', tag: true, look: () => ac(0.04, 0.35), decay: 0.45, gain: 1.3, heroGain: 0.6, shells: false, splash: 0.9,
      cam: beMove(B.k8, B.k9, [V(56.9, 1.75, 12.0), V(57.9, 1.35, 15.2), 50], [V(57.05, 1.7, 12.35), V(57.85, 1.35, 15.2), 48], { dof: 0 }),
      labels: (t) => [lab(V(58, 2.15, 15.1), '<div class="k">ECHOLOCATION</div><div class="s">ONE TOOL AMONG MANY</div>', MathX.smooth(t, B.kClick + 0.5, B.kClick + 0.9) * (1 - MathX.smooth(t, B.k9 - 0.4, B.k9)))] },
    // K9: the sound view gives way to the picture: the two of them at the door, wide, warm
    { id: 'K9', t0: B.k9, t1: B.k10, set: 'city', look: (t) => { const k = MathX.smooth(t, B.k9 + 0.5, B.k9 + 1.9); return { ac: k < 0.5 ? 1 : 0, world: k < 0.5 ? MathX.lerp(0.04, 0.4, k * 2) : 1, hero: k < 0.5 ? MathX.lerp(0.35, 0.8, k * 2) : 1, glow: 0.05 }; },
      decay: 0.45, gain: 1.2, heroGain: 0.6, shells: false,
      cam: beMove(B.k9, B.k10, [V(56.2, 1.55, 13.0), V(57.65, 1.45, 14.1), 40], [V(54.1, 2.35, 12.25), V(57.7, 1.2, 14.2), 46], { dof: 0.12, ease: Ease.inOutCubic }) },
    // K10a: the friend pushes the door; warm light falls on them
    { id: 'K10a', t0: B.k10, t1: B.k10b, set: 'city', look: () => BE_REAL,
      cam: beMove(B.k10, B.k10b, [V(60.4, 1.55, 12.45), V(57.8, 1.3, 14.75), 42], [V(60.2, 1.53, 12.55), V(57.8, 1.3, 14.85), 41], { dof: 0.12, focus: (t, pos) => pos.distanceTo(mid()) }) },
    // K10b: what she hears through the open door: the room beyond drawn by its own sounds (voices, cups, the machine,
    // the walls of books), from inside; K10c is the same camera, moving on, in the picture
    { id: 'K10b', t0: B.k10b, t1: B.k10c, set: 'city', tag: true, look: () => ac(0.06, 0.5), decay: 0.6, gain: 1.4, heroGain: 0.7, shells: false, splash: 0.12,
      cam: beMove(B.k10b, B.k10c, [V(61.05, 1.52, 20.85), V(58.0, 1.3, 15.3), 48], [V(60.75, 1.5, 20.55), V(58.0, 1.3, 15.4), 46], { dof: 0 }),
      labels: (t) => [lab(V(57.2, 2.1, 17.6), '<div class="k">THE ROOM BEYOND</div><div class="s">VOICES · CUPS · WALLS OF BOOKS</div>', MathX.smooth(t, B.k10b + 0.3, B.k10b + 0.7) * (1 - MathX.smooth(t, B.k10c - 0.35, B.k10c)))] },
    // K10c: inside, looking back at the door: they come in together out of the rain
    { id: 'K10c', t0: B.k10c, t1: B.s12, set: 'city', look: () => BE_REAL, rainAlpha: 0.5,
      cam: beMove(B.k10c, B.s12, [V(60.75, 1.5, 20.55), V(58.0, 1.3, 15.4), 46], [V(60.4, 1.45, 20.1), V(58.0, 1.3, 15.6), 44], { dof: 0.15, focus: (t, pos) => pos.distanceTo(ct().friend.root.position) }) },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s12;
})();
