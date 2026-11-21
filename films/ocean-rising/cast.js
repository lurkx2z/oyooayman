/* =====================================================================
   CAST — the people (the shared rig, js/world/people.js) and what you hold:
     LOOKS ocKeeper (you: a yellow oilskin jacket over a navy jumper, dark trousers, sea boots, a navy beanie)
           ocIsla (your daughter, fifteen: a green rain jacket, jeans, a ponytail) · ocMum · ocHill0…5 (on the hill)
     ocPerson(look, parent, o) → Person      OC_P poses (u = seconds, k = 0…1)
     ocFace(P, o) / ocFaceSet(P, t, F)        a real face for the people seen close (keeps the beanie)
     OC_HAND_POSES                            your hands (ViewerHands, camera space): the phone, the torch, the bolts,
                                              the rail, the ladder
     ocPhone(parent) → { g, set(state) }      your phone: the Messages thread with Isla, its clock, its battery
   ===================================================================== */

Object.assign(LOOKS, {
  ocKeeper: { skin: 1, build: 'avg', shirt: '#e3b21c', sleeves: 'long', pants: '#252a31', shoes: '#121416', sole: '#0c0c0c', hair: '#6a625a', jacket: true, collar: true, inner: '#1f2a44', hat: { type: 'beanie', color: '#1f2a44' } },
  ocIsla: { skin: 0, build: 'slim', shirt: '#2f6a4a', sleeves: 'long', pants: '#33415e', shoes: '#ecebe6', sole: '#bbb', hair: '#7a4e2a', hairStyle: 'pony', jacket: true, hood: true },
  ocMum: { skin: 0, build: 'slim', shirt: '#3a3f58', sleeves: 'long', pants: '#2a2a30', shoes: '#3a2a1e', sole: '#1a1612', hair: '#3a2416', hairStyle: 'long', coat: true, collar: true, scarf: '#8a3a3a' },
  ocHill0: { skin: 2, build: 'broad', shirt: '#5a3a2a', sleeves: 'long', pants: '#2a2f38', shoes: '#222', sole: '#111', hair: '#1a1410', jacket: true, hat: { type: 'cap', color: '#1d2a3a' } },
  ocHill1: { skin: 3, build: 'avg', shirt: '#7a7a72', sleeves: 'long', pants: '#3a3a40', shoes: '#333', sole: '#111', hair: '#141010', coat: true, collar: true },
  ocHill2: { skin: 1, build: 'slim', shirt: '#a33a3a', sleeves: 'long', pants: '#22262c', shoes: '#ddd', sole: '#bbb', hair: '#c8a060', hairStyle: 'long', jacket: true },
  ocHill3: { skin: 4, build: 'avg', shirt: '#2a4a6a', sleeves: 'long', pants: '#5a5248', shoes: '#2a2018', sole: '#14100c', hair: '#0e0b09', jacket: true, hood: true },
  ocHill4: { skin: 0, build: 'broad', shirt: '#4a5a3a', sleeves: 'long', pants: '#3f3a34', shoes: '#2a1f18', sole: '#1a1612', hair: '#9a9a96', coat: true, hat: { type: 'beanie', color: '#6a2a2a' } },
  ocHill5: { skin: 5, build: 'slim', shirt: '#d8d2c4', sleeves: 'long', pants: '#1f1f24', shoes: '#111', sole: '#2a2a2a', hair: '#2a1a12', hairStyle: 'bun', coat: true, scarf: '#9a8a6a' },
});
const OC_SKIN = (i) => SKIN[i % SKIN.length];
const OCPI = Math.PI;
function ocPerson(look, parent, o = {}) {
  const P = new Person({ id: 'oc' + look + (o.id || ''), look }, null);
  if (o.kid) { P.root.scale.setScalar(o.kid); P.j.head.scale.multiplyScalar(1.1); }
  ocPersonNoZ(P);
  (parent || OC_KIT_SCENE).add(P.root);
  return P;
}
// (the engine's people have a few surfaces that share a plane; nudged here, per person, so nothing flickers)
function ocPersonNoZ(p) {
  const L = p.look, BG = PersonGeo.forBuild(L.build || 'avg', L);
  p.root.traverse((m) => {
    if (!m.isMesh) return; const g = m.geometry, q = g.parameters;
    if (g.type === 'BoxGeometry' && q.height === 0.035 && Math.abs(q.width - BG.B.waist * 1.02) < 1e-6) m.scale.set(1, 1.6, 1.08);
    else if (g.type === 'BoxGeometry' && q.width === 0.08 && q.depth === 0.01) m.position.z += L.shoulderBag ? 0.0015 : 0.004;
    else if (g.type === 'BoxGeometry' && q.width === 0.03 && q.depth === 0.012) m.position.z += 0.003;
    else if (L.coat && (g === BG.pelvis || g === BG.thigh)) m.scale.set(0.98, 1, 0.98);
  });
}
// put a person at (x, y, z) facing yaw (their +z), in pose p
function ocPlace(P, p, x, y, z, yaw) { P.root.position.set(x, y, z); P.root.rotation.order = 'YXZ'; P.root.rotation.set(0, yaw, 0); P.apply(p); P.pose = p; P.root.visible = true; }
// the yaw that faces from (x, z) towards (tx, tz)
const ocYawTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

function ocWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
const OC_P = {
  stand: (u, i = 0) => { const p = basePose(); p.spine += Math.sin(u * 1.4 + i) * 0.01; p.headYaw = 0.15 * noise1(u * 0.25, i + 2); p.lSh = [0.1, 0.1]; p.rSh = [0.08, 0.1]; return p; },
  // looking down at the water (the head bent, the shoulders a little round)
  lookDown: (u) => { const p = basePose(); p.neck = 0.6; p.spine = 0.15; p.lSh = [0.15, 0.12]; p.rSh = [0.15, 0.12]; p.headYaw = 0.1 * Math.sin(u * 0.4); return p; },
  lookUp: (u) => { const p = basePose(); p.neck = -0.75; p.spine = -0.12; p.lSh = [0.12, 0.12]; p.rSh = [0.1, 0.1]; p.headYaw = 0.06 * Math.sin(u * 0.3); return p; },
  // kneeling at the landing's edge, both hands on the line, pulling at the knot
  kneelLine: (u) => { const p = basePose(); p.hipY = 0.52; p.lHip = [0.02, 0.1]; p.rHip = [0.6, 0.1]; p.lKnee = 1.62; p.rKnee = 1.3; p.lFoot = 0.55; p.rFoot = 0.1; p.spine = 0.62; p.neck = 0.25;
    const w = Math.sin(u * 5.0); p.lSh = [1.15 + 0.12 * w, 0.05]; p.rSh = [1.1 - 0.12 * w, 0.0]; p.lEl = 0.5 + 0.2 * w; p.rEl = 0.6 - 0.2 * w; return p; },
  walk: (ph, big = 1) => ocWalkPose(ph, big),
  jog: (ph) => { const p = ocWalkPose(ph, 1.25); p.spine = 0.22; p.lEl = 1.2; p.rEl = 1.2; p.hipY = 0.9; return p; },
  // holding the phone in front of the chest (the right hand), the left at the side
  phone: (u) => { const p = basePose(); p.rSh = [0.7, -0.05]; p.rEl = 2.2; p.lSh = [0.35, 0.15]; p.lEl = 0.9; p.neck = 0.5; p.headYaw = 0.05 * Math.sin(u * 0.3); return p; },
  // on the gallery: both hands on the rail, leaning
  rail: (u) => { const p = basePose(); p.spine = 0.2; p.neck = 0.15; p.lSh = [0.95, 0.15]; p.rSh = [0.95, 0.15]; p.lEl = 0.6; p.rEl = 0.6; p.headYaw = 0.2 * Math.sin(u * 0.2); return p; },
  // on the lantern's roof: hugging the rod and the ball, the knees bent against the slope
  cling: (u) => { const p = basePose(); p.hipY = 0.86; p.lHip = [0.5, 0.1]; p.rHip = [0.2, 0.06]; p.lKnee = 0.75; p.rKnee = 0.35; p.lFoot = 0.25; p.rFoot = -0.1; p.spine = 0.35; p.neck = 0.1;
    p.lSh = [1.55, 0.2]; p.rSh = [1.7, 0.1]; p.lEl = 1.25; p.rEl = 1.4; p.headYaw = 0.35 + 0.1 * Math.sin(u * 0.3); return p; },
  // clinging with the right arm, the phone in the left
  clingPhone: (u) => { const p = OC_P.cling(u); p.lSh = [0.75, -0.1]; p.lEl = 2.15; p.neck = 0.55; p.headYaw = -0.15; return p; },
  // Isla on the hill: holding her phone up, looking out to sea
  islaPhone: (u) => { const p = basePose(); p.rSh = [1.25, -0.05]; p.rEl = 1.25; p.lSh = [0.3, 0.2]; p.lEl = 0.7; p.neck = -0.05; p.headYaw = 0.04 * Math.sin(u * 0.5); return p; },
  islaType: (u) => { const p = basePose(); p.rSh = [0.7, -0.08]; p.rEl = 2.0; p.lSh = [0.7, 0.08]; p.lEl = 2.0; p.neck = 0.55; return p; },
  torchUp: (u, i) => { const p = basePose(); p.rSh = [2.3 + 0.15 * Math.sin(u * 0.7 + i), 0.2]; p.rEl = 0.35; p.lSh = [0.15, 0.12]; p.headYaw = 0.1 * Math.sin(u * 0.2 + i); p.neck = -0.12; return p; },
  arms: (u, i) => { const p = basePose(); p.lSh = [0.55, 0.3]; p.rSh = [0.55, 0.3]; p.lEl = 1.6; p.rEl = 1.6; p.headYaw = 0.15 * Math.sin(u * 0.2 + i); return p; },
};

// ---------------------------------------------------------------------------------------------------------------------
// FACES: the engine's HeroFace (eyes, lids, brows, lips) rebuilds the head, so the hat and the ponytail go back on
// ---------------------------------------------------------------------------------------------------------------------
function ocFace(P, o = {}) {
  const H = P.j.head, G = PersonGeo, keep = H.children.filter((c) => c.geometry && [G.cap, G.brim, G.pony, G.beanie, G.beanieBand].includes(c.geometry));
  const L = P.look;
  P.face = new HeroFace(H, Object.assign({ skin: OC_SKIN(L.skin), hair: L.hair, hairStyle: L.hairStyle, seed: 7 }, o));
  for (const c of keep) H.add(c);
  P._faceSeed = (o.seed || 7) * 0.37;
  return P.face;
}
function ocFaceSet(P, t, F = {}) {
  if (!P.face) return;
  const per = 3.4 + (P._faceSeed % 1.7), ph = (t + P._faceSeed * 5.3) % per, bl = ph < 0.16 ? Math.sin(ph / 0.16 * OCPI) : 0;
  P.face.set({ blink: Math.max(bl, F.shut || 0), mouth: F.mouth || 0, worry: F.worry || 0, frown: F.frown || 0, brow: F.brow || 0, wide: F.wide || 0 });
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR HANDS (camera space, the right hand; the left is mirrored) and what they hold
// ---------------------------------------------------------------------------------------------------------------------
const OC_HAND_POSES = {
  // the phone upright in the right hand, the screen to you (the pose of the light films); the left index finger typing
  phone: { p: [0.045, -0.097, -0.255], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  phoneL: { p: [0.105, -0.187, -0.27], F: [-0.62, 0.72, -0.3], N: [0.25, -0.05, -1], curl: [0.15, 0.55, 0.85, 1.0], thumb: [0.3, 0.5] },
  // the torch: a fist forward and down, its beam where you look
  torch: { p: [0.16, -0.2, -0.38], F: [-0.25, 0.05, -1], N: [-1, 0.1, 0], curl: [1.35, 1.45, 1.5, 1.55], thumb: [0.35, 0.9] },
  // both hands forward on the door's bolts
  bolt: { p: [0.1, -0.12, -0.45], F: [-0.1, 0.2, -1], N: [-0.15, -0.95, 0.2], curl: [1.1, 1.2, 1.25, 1.3], thumb: [0.4, 0.8] },
  shove: { p: [0.14, -0.04, -0.48], F: [-0.05, 1, -0.15], N: [0, 0.15, -1], curl: [0.1, 0.1, 0.14, 0.18], thumb: [0.6, 0.1] },
  // the left hand on the handrail (low, to the left)
  rail: { p: [0.26, -0.3, -0.34], F: [0.2, -0.1, -1], N: [0.1, -1, 0], curl: [1.2, 1.25, 1.3, 1.35], thumb: [0.4, 0.9] },
  // on a ladder's rung, up in front of you
  rung: { p: [0.18, 0.08, -0.32], F: [-0.15, 0.2, -1], N: [0, -1, 0.15], curl: [1.3, 1.35, 1.4, 1.45], thumb: [0.4, 0.9] },
  // binoculars up at the eyes
  bino: { p: [0.07, -0.06, -0.15], F: [-0.1, 1, 0.05], N: [-1, 0, 0.2], curl: [1.0, 1.05, 1.1, 1.1], thumb: [0.5, 0.6] },
};
const OC_HAND_BLEND = { phone: 0.6, phoneL: 0.6, torch: 0.5, bolt: 0.35, shove: 0.25, rail: 0.5, rung: 0.4, bino: 0.5 };
const OC_HANDS = { right: [[-5, 'hidden']], left: [[-5, 'hidden']] };      // (filled from the shots, set.js)

// a torch in the right hand (along the palm's x: the fist round it), its lens glowing when on
function ocTorch(hands) {
  const g = new THREE.Group(); hands.right.g.add(g); g.position.set(0.0, 0.045, 0.012); g.rotation.set(0, 0, 0);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 14), ocStd('#24262a', 0.4, 0.6)); body.rotation.x = Math.PI / 2; body.position.z = -0.03; g.add(body);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.02, 0.05, 16), ocStd('#2c2e32', 0.35, 0.7)); head.rotation.x = Math.PI / 2; head.position.z = -0.15; g.add(head);
  const lensM = new THREE.MeshBasicMaterial({ color: '#fff6e0' }); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), lensM); lens.position.z = -0.176; lens.rotation.y = Math.PI; g.add(lens);
  for (const m of [body, head, lens]) { m.frustumCulled = false; m.castShadow = false; }
  return { g, lensM };
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR PHONE: a 7.2 × 15 cm phone; its screen a canvas (the status bar's clock is the HUD's; the battery; the thread)
//   set({ clock: '7:14', battery: 18, msgs: [[who, text], …], typing: 'Get mu', dots: 0…1 (her typing), bars, dim })
// ---------------------------------------------------------------------------------------------------------------------
function ocPhone(parent) {
  const g = new THREE.Group(); parent.add(g);
  const W = 0.072, H = 0.15;
  const body = new THREE.Mesh(ocRoundBox(W, 0.009, H, 0.009, 0.002, 3), ocStd('#1b1c1f', 0.35, 0.6)); body.rotation.x = Math.PI / 2; body.position.z = -0.0045; g.add(body);
  const scr = ocCanvasTex(432, 900, (c, w, h, st) => {
    const k = st.dim ?? 1;
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    c.globalAlpha = k;
    // status bar
    c.fillStyle = '#f2f2f2'; c.font = '600 30px Arial'; c.textAlign = 'left'; c.fillText(st.clock || '', 34, 52);
    const bat = st.battery ?? 30; c.textAlign = 'right'; c.font = '600 24px Arial'; c.fillText(bat + '%', w - 86, 50);
    c.strokeStyle = '#f2f2f2'; c.lineWidth = 2.5; ocRR(c, w - 78, 30, 44, 22, 5); c.stroke(); c.fillStyle = bat <= 10 ? '#ff3b30' : '#f2f2f2'; c.fillRect(w - 75, 33, Math.max(2, 38 * bat / 100), 16); c.fillRect(w - 33, 37, 3, 8);
    for (let i = 0; i < 4; i++) { c.fillStyle = i < (st.bars ?? 3) ? '#f2f2f2' : '#555'; c.fillRect(w - 150 + i * 11, 50 - 8 - i * 5, 7, 8 + i * 5); }
    // the thread's header
    c.fillStyle = '#1c1c1e'; c.fillRect(0, 68, w, 112); c.fillStyle = '#8e8e93'; c.beginPath(); c.arc(w / 2, 108, 26, 0, 6.3); c.fill();
    c.fillStyle = '#fff'; c.font = '600 28px Arial'; c.textAlign = 'center'; c.fillText('I', w / 2, 118); c.font = '500 24px Arial'; c.fillText('Isla', w / 2, 166);
    c.fillStyle = '#0a84ff'; c.font = '400 40px Arial'; c.textAlign = 'left'; c.fillText('‹', 22, 120);
    // the messages, newest at the bottom (wrapped to the bubble's width)
    const kb = st.typing != null, bottom = kb ? h - 370 : h - 330, maxW = w * 0.68;
    c.font = '400 29px Arial';
    const wrap = (txt) => { const words = txt.split(' '), lines = []; let L = ''; for (const wd of words) { const tr = L ? L + ' ' + wd : wd; if (c.measureText(tr).width > maxW - 36 && L) { lines.push(L); L = wd; } else L = tr; } lines.push(L); return lines; };
    let y = bottom;
    if (st.dots > 0) { const bw = 96, bh = 56; y -= bh + 10; c.fillStyle = '#3a3a3c'; ocRR(c, 26, y, bw, bh, 26); c.fill(); for (let i = 0; i < 3; i++) { c.fillStyle = `rgba(200,200,205,${0.4 + 0.6 * Math.max(0, Math.sin(st.dots * 9 - i * 0.9))})`; c.beginPath(); c.arc(50 + i * 23, y + bh / 2, 7, 0, 6.3); c.fill(); } }
    for (let i = (st.msgs || []).length - 1; i >= 0 && y > 200; i--) {
      const [who, txt] = st.msgs[i], lines = wrap(txt), lw = Math.max(...lines.map((l) => c.measureText(l).width)), bw = lw + 40, bh = lines.length * 38 + 22;
      y -= bh + 12; const x = who === 'you' ? w - 26 - bw : 26;
      c.fillStyle = who === 'you' ? '#0a84ff' : '#3a3a3c'; ocRR(c, x, y, bw, bh, 24); c.fill();
      c.fillStyle = '#fff'; c.textAlign = 'left'; lines.forEach((l, j) => c.fillText(l, x + 20, y + 40 + j * 38));
    }
    // the input field (and the keyboard while you type)
    const iy = kb ? h - 350 : h - 286; c.strokeStyle = '#3a3a3c'; c.lineWidth = 2; ocRR(c, 26, iy + 14, w - 52, 56, 28); c.stroke();
    c.font = '400 27px Arial'; c.fillStyle = st.typing ? '#fff' : '#636366'; c.textAlign = 'left'; c.fillText(st.typing ? st.typing + (Math.floor((st.caret || 0) * 2) % 2 ? '' : '|') : 'iMessage', 48, iy + 52);
    if (kb) { c.fillStyle = '#2c2c2e'; c.fillRect(0, h - 270, w, 270); const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']; c.font = '400 26px Arial'; c.textAlign = 'center';
      rows.forEach((r, ri) => { const kw = (w - 20) / 10, x0 = 10 + (10 - r.length) * kw / 2; for (let i = 0; i < r.length; i++) { const hit = st.key === r[i]; c.fillStyle = hit ? '#8e8e93' : '#505053'; ocRR(c, x0 + i * kw + 3, h - 258 + ri * 64, kw - 6, 52, 8); c.fill(); c.fillStyle = '#fff'; c.fillText(r[i], x0 + i * kw + kw / 2, h - 222 + ri * 64); } });
      c.fillStyle = '#505053'; ocRR(c, w * 0.26, h - 66, w * 0.48, 50, 8); c.fill(); }
    // the low-battery warning
    if (st.lowBat) { c.fillStyle = 'rgba(28,28,30,0.96)'; ocRR(c, 40, 300, w - 80, 220, 26); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '600 30px Arial'; c.fillText('Low Battery', w / 2, 362); c.font = '400 26px Arial'; c.fillText(st.battery + '% battery remaining', w / 2, 410); c.fillStyle = '#0a84ff'; c.fillText('Close', w / 2, 482); }
    c.globalAlpha = 1;
  });
  const screenM = new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.005, H - 0.006), screenM); screen.position.z = 0.0049; g.add(screen);   // (the body spans z ±4.5 mm)
  for (const m of [body, screen]) { m.frustumCulled = false; m.castShadow = false; }
  // (the light the screen throws on your face and hands at night)
  const glow = new THREE.PointLight('#bcd2ff', 0, 0.6, 2); glow.position.set(0, 0, 0.18); g.add(glow);
  return { g, screen, scr, glow, set(st) { scr.update(st); glow.intensity = (st.light ?? 0) * 0.025; screenM.color.setScalar(0.62 + 0.18 * (1 - (st.light ?? 0))); } };
}
// what your phone shows at story time s (the thread up to then; the typing; the battery; the clock)
const OC_BAT = (s) => Math.max(1, Math.round(31 - 27 * MathX.clamp(s / 2950, 0, 1.05)));
function ocPhoneState(s, o = {}) {
  const cp = ocClockParts(s), msgs = [], P = OC_TEXTS;
  let dots = 0, typing = null, key = null;
  for (const [ts, who, txt] of P) {
    if (s >= ts) msgs.push([who, txt]);
    else if (who === 'isla' && s > ts - 1.6) dots = (s - ts + 1.6);
    else if (who === 'you' && s > ts - 2.4) { const n = Math.floor((s - ts + 2.4) / 2.2 * txt.length); typing = txt.slice(0, n); key = txt[n] ? txt[n].toUpperCase() : null; }
  }
  if (o.typing === false) typing = null;
  return { clock: `${cp.h}:${String(cp.m).padStart(2, '0')}`, battery: OC_BAT(s), msgs, dots, typing, key, caret: s, bars: OCP.h(s) < OCP.gridFail + 6 ? 3 : 1, lowBat: !!o.lowBat, light: o.light ?? 1, dim: o.dim ?? 1 };
}
