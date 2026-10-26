/* =====================================================================
   CAST — the people and your hands (shared rigs: js/world/people.js and js/camera/viewerHands.js, unchanged; this
   film only adds its own looks, actions and poses under sb* names).
     LOOKS.sb*        suits for the boardroom, the woman at the crossing, a guard, students, neighbours
     ACTIONS.sb*      holding an umbrella, laughing in a chair, polishing a car, a guard's stance, a thank-you wave,
                      eating, leaning over a board game
     SS_HPOSE         your hands: a phone, the ticket, a pen, the wheel, a remote, a cookie, flat on a note
     ssHands(cam, script, o)   your hands in a set (with props parented to the right hand: phone, ticket, pen, remote)
     ssPerson(spec, scene, o)  a person (+ an umbrella over their head when o.umbrella)
   ===================================================================== */

Object.assign(LOOKS, {
  ssSuit1: { skin: 1, build: 'avg', shirt: '#23272e', sleeves: 'long', pants: '#23272e', shoes: '#141414', sole: '#0c0c0c', hair: '#2a1d14', jacket: true, collar: true, inner: '#e8e6e0' },
  ssSuit2: { skin: 3, build: 'broad', shirt: '#3a3f48', sleeves: 'long', pants: '#30343b', shoes: '#1a1410', sole: '#0c0c0c', hair: '#111', jacket: true, collar: true, inner: '#d8dde6' },
  ssSuit3: { skin: 5, build: 'slim', shirt: '#4a3a40', sleeves: 'long', pants: '#24262c', shoes: '#141414', sole: '#0c0c0c', hair: '#7a5232', hairStyle: 'bun', jacket: true, collar: true, inner: '#f0ece4' },
  ssSuit4: { skin: 2, build: 'avg', shirt: '#1f2a3a', sleeves: 'long', pants: '#1f2a3a', shoes: '#141414', sole: '#0c0c0c', hair: '#3a2a1e', jacket: true, collar: true, inner: '#e6e8ee' },
  ssSuit5: { skin: 4, build: 'slim', shirt: '#2e2a26', sleeves: 'long', pants: '#2e2a26', shoes: '#141414', sole: '#0c0c0c', hair: '#0e0b09', hairStyle: 'long', jacket: true, collar: true, inner: '#e8e2d8' },
  ssWoman: { skin: 2, build: 'slim', shirt: '#b8a07a', sleeves: 'long', pants: '#2a2c34', shoes: '#2a2018', sole: '#14100c', hair: '#1a120c', hairStyle: 'long', coat: true, collar: true, scarf: '#7a2f34', shoulderBag: '#3a2a20' },
  ssWalker: { skin: 4, build: 'avg', shirt: '#6a7a5a', sleeves: 'long', pants: '#3a3a40', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#111', jacket: true, backpack: '#3a3028' },
  ssShopper: { skin: 4, build: 'avg', shirt: '#7a5a66', sleeves: 'long', pants: '#34343c', shoes: '#2a2420', sole: '#14100c', hair: '#8a8580', hairStyle: 'bun', coat: true, collar: true, shoulderBag: '#6a5a40' },
  ssGuard: { skin: 3, build: 'broad', shirt: '#121418', sleeves: 'long', pants: '#121418', shoes: '#0a0a0a', sole: '#050505', hair: '#0b0b0b', jacket: true, collar: true, inner: '#1a1c20' },
  ssStudent1: { skin: 0, build: 'avg', shirt: '#7a8a9a', sleeves: 'long', pants: '#3a4050', shoes: '#cfcac0', sole: '#e8e4dc', hair: '#5a3f28', hood: true },
  ssStudent2: { skin: 3, build: 'slim', shirt: '#9a5a4a', sleeves: 'long', pants: '#2a2c34', shoes: '#1f1f24', sole: '#2a2a2a', hair: '#0e0b09', hairStyle: 'pony' },
  ssNeighbour: { skin: 1, build: 'broad', shirt: '#b8b0a0', sleeves: 'short', pants: '#4a5060', shoes: '#cfcac0', sole: '#e8e4dc', hair: '#6a5a4a' },
  ssVisitor: { skin: 0, build: 'avg', shirt: '#4a4a52', sleeves: 'long', pants: '#2a2a30', shoes: '#1a1a1a', sole: '#111', hair: '#3a2a1e', coat: true, collar: true },
});

Object.assign(ACTIONS, {
  // standing under an umbrella: the right forearm up holding the shaft
  ssUmbrella(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [0.72, 0.12]; p.rEl = 1.75; p.headYaw *= 0.5; return p; },
  ssUmbrellaWalk(τ, c) { const p = ACTIONS.walk(τ, c); p.rSh = [0.72, 0.12]; p.rEl = 1.75; return p; },
  // a step back from the kerb, startled (the umbrella stays up)
  ssStartle(τ, c) { const p = ACTIONS.ssUmbrella(τ, c), k = Math.min(1, τ / 0.25); p.spine = -0.12 * k; p.neck = -0.1 * k; p.lSh = [0.5 * k + 0.05, 0.3 * k]; p.lEl = 0.9 * k + 0.2; p.lHip = [-0.15 * k, 0.05]; p.rKnee = 0.12; return p; },
  // a thank-you: the left hand up, a small wave
  ssThanks(τ, c) { const p = ACTIONS.ssUmbrella(τ, c), k = Math.min(1, τ / 0.4); p.lSh = [1.3 * k + 0.05, 0.35 * k]; p.lEl = 1.0 + 0.15 * Math.sin(τ * 7) * k; p.headYaw = 0; return p; },
  // seated, laughing (shoulders shake, head back a little)
  // (a big laugh: the head thrown back, the shoulders shaking, a hand slapping the table, now and then doubling forward)
  ssLaugh(τ, c) { const p = ACTIONS.sit(τ, c), s = Math.sin(τ * 13 + c.seed * 9), k = 0.65 + 0.35 * Math.sin(τ * 1.9 + c.seed * 4), fwd = Math.max(0, Math.sin(τ * 2.3 + c.seed * 7)) ** 3, slap = Math.abs(Math.sin(τ * 4.2 + c.seed * 3));
    p.spine = -0.14 + 0.1 * s * k + 0.42 * fwd; p.neck = -0.5 * k * (1 - fwd) + 0.2 * fwd; p.lSh = [0.5 + 0.12 * s, 0.14]; p.rSh = [0.55 + 0.5 * slap, 0.1]; p.lEl = 1.2; p.rEl = 0.5 + 0.5 * slap; p.headYaw = 0.15 * Math.sin(c.seed * 20); return p; },
  // seated, turned to you, attentive (a slow nod)
  ssListen(τ, c) { const p = ACTIONS.sit(τ, c); p.neck = 0.12 + 0.06 * Math.sin(τ * 1.3 + c.seed * 5); p.headYaw = 0; p.lSh = [0.6, 0.08]; p.rSh = [0.62, 0.08]; p.lEl = 1.3; p.rEl = 1.3; p.spine = 0.05; return p; },
  // seated at a table, hands on it, looking down at it (or at you)
  ssTable(τ, c) { const p = ACTIONS.sit(τ, c); p.lSh = [0.75, 0.05]; p.rSh = [0.75, 0.05]; p.lEl = 0.95; p.rEl = 0.95; p.neck = 0.35; p.spine = 0.12; p.headYaw = noise1(τ * 0.2, c.seedI) * 0.15; return p; },
  ssTableLook(τ, c) { const p = ACTIONS.ssTable(τ, c); p.neck = 0.05; p.headYaw = 0; return p; },
  ssTableSlump(τ, c) { const p = ACTIONS.ssTable(τ, c); p.spine = 0.38; p.neck = 0.5; p.lSh = [0.5, 0.15]; p.rSh = [0.5, 0.15]; p.lEl = 0.6; p.rEl = 0.6; return p; },
  // eating a cookie (seated): the hand comes up to the mouth and down
  ssEat(τ, c) { const p = ACTIONS.ssTable(τ, c), k = 0.5 - 0.5 * Math.cos(Math.min(1, τ / 0.8) * Math.PI); p.rSh = [0.75 + 0.55 * k, 0.12]; p.rEl = 0.95 + 1.2 * k; p.neck = 0.2; return p; },
  // polishing the car: bent over, the right hand circling
  ssPolish(τ, c) { const p = basePose(), a = τ * 3.2; p.spine = 0.42; p.neck = 0.3; p.rSh = [1.05 + 0.18 * Math.sin(a), 0.22 + 0.18 * Math.cos(a)]; p.rEl = 0.55; p.lSh = [0.7, 0.1]; p.lEl = 0.4; p.lKnee = 0.16; p.rKnee = 0.12; p.hipY = 0.9; return p; },
  // a guard: feet apart, hands together in front
  ssGuard(τ, c) { const p = ACTIONS.idle(τ, c); p.lSh = [0.32, -0.12]; p.rSh = [0.32, -0.12]; p.lEl = 0.95; p.rEl = 0.95; p.lHip = [0, 0.09]; p.rHip = [0, 0.09]; p.headYaw = noise1(τ * 0.25, c.seedI) * 0.5; return p; },
  // at a door: waiting, looking at the peephole
  ssWait(τ, c) { const p = ACTIONS.idle(τ, c); p.neck = -0.06; p.headYaw = 0.05 * Math.sin(τ * 0.7); p.lSh = [0.2, 0.05]; p.lEl = 0.4; return p; },
  ssKnock(τ, c) { const p = ACTIONS.ssWait(τ, c), k = Math.sin(Math.min(τ, 1.2) * 15); p.rSh = [1.25, 0.1]; p.rEl = 1.5 + 0.18 * Math.max(0, k) * (τ < 1.2 ? 1 : 0); return p; },
});
Object.assign(BLEND, { ssUmbrella: 0.6, ssUmbrellaWalk: 0.5, ssStartle: 0.12, ssThanks: 0.4, ssLaugh: 0.35, ssListen: 0.5, ssTable: 0.6, ssTableLook: 0.5, ssTableSlump: 0.9, ssEat: 0.3, ssPolish: 0.6, ssGuard: 0.6, ssWait: 0.5, ssKnock: 0.15 });

// a person, with an umbrella over them if asked (held up over the right shoulder, on the spine so it never wanders)
function ssPerson(spec, scene, o = {}) {
  const p = new Person(spec, scene);
  if (o.umbrella) {
    const u = new THREE.Group(), cloth = ssStd(o.umbrella, 0.55, 0, { side: THREE.DoubleSide });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.24, 10, 1, true), cloth); canopy.position.y = 0.62; u.add(canopy);
    const ribs = new THREE.Mesh(new THREE.ConeGeometry(0.565, 0.245, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#000', wireframe: true, transparent: true, opacity: 0.35 })); ribs.position.y = 0.62; u.add(ribs);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 6), ssStd('#2a2a2a', 0.4, 0.6)); shaft.position.y = 0.35; u.add(shaft);
    u.position.set(-0.13, 0.48, 0.2); u.rotation.z = 0.12; p.j.spine.add(u);
    u.traverse((m) => { if (m.isMesh) { m.castShadow = true; } });
    p.umbrella = u;
  }
  return p;
}

// ---- your hands -------------------------------------------------------------------------------------------------------
// (camera space, the right hand; ViewerHands mirrors them for the left)
const SS_HPOSE = {
  // a phone held up in front of you, portrait, screen to you (the Slower light film's grip)
  phone:   { p: [0.105, -0.075, -0.3], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  phoneT:  { p: [0.105, -0.073, -0.3], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.88, 0.75] },
  phoneLow:{ p: [0.11, -0.16, -0.32], F: [-0.9, 0.3, -0.1], N: [0.02, 0.6, 0.8], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  // the ticket, held up beside the TV (fingers and thumb pinching its corner)
  ticket:  { p: [0.15, -0.13, -0.36], F: [-0.25, 1, -0.2], N: [-0.15, 0.1, 1], curl: [0.55, 0.85, 1.1, 1.25], thumb: [0.55, 0.55] },
  // a pen (writing on the pad: the set moves p each frame so the nib follows the letters)
  pen:     { p: [0.06, -0.2, -0.38], F: [-0.35, 0.35, -0.85], N: [-0.4, -0.85, 0.2], curl: [0.5, 1.15, 1.35, 1.45], thumb: [0.55, 0.7] },
  // flat, pressing the note onto the fridge
  press:   { p: [0.05, -0.08, -0.38], F: [-0.05, 1, -0.15], N: [0, 0.12, -1], curl: [0.08, 0.06, 0.1, 0.14], thumb: [0.7, 0.1] },
  // both hands on the wheel (10 to 2); the set adds a little steering
  wheel:   { p: [0.175, -0.205, -0.47], F: [-0.3, 0.75, -0.55], N: [-0.6, -0.2, -0.75], curl: [1.15, 1.2, 1.25, 1.3], thumb: [0.6, 0.5] },
  wheelUp: { p: [0.18, -0.12, -0.5], F: [-0.15, 1, -0.2], N: [0.05, 0.1, -1], curl: [0.1, 0.08, 0.12, 0.18], thumb: [0.75, 0.12] },
  // a TV remote, pointed at the screen
  remote:  { p: [0.13, -0.2, -0.4], F: [-0.2, 0.25, -1], N: [-1, 0.1, -0.1], curl: [0.9, 1.2, 1.3, 1.35], thumb: [0.25, 0.5] },
  remoteP: { p: [0.13, -0.2, -0.4], F: [-0.2, 0.25, -1], N: [-1, 0.1, -0.1], curl: [0.9, 1.2, 1.3, 1.35], thumb: [0.15, 0.85] },
  // reaching for something on the table (the set aims p), then holding it up
  reach:   { p: [0.08, -0.24, -0.5], F: [-0.1, -0.35, -1], N: [0, -1, 0.3], curl: [0.35, 0.4, 0.45, 0.5], thumb: [0.6, 0.3] },
  pinch:   { p: [0.08, -0.24, -0.5], F: [-0.1, -0.35, -1], N: [0, -1, 0.3], curl: [0.75, 0.8, 1.0, 1.1], thumb: [0.35, 0.75] },
  hold:    { p: [0.07, -0.14, -0.34], F: [-0.3, 0.6, -0.75], N: [-0.2, -0.8, 0.5], curl: [0.75, 0.85, 1.05, 1.15], thumb: [0.35, 0.75] },
  // slapping the board, a fist of dice opening
  slapUp:  { p: [0.1, -0.12, -0.42], F: [-0.15, -0.2, -1], N: [0, -1, 0.15], curl: [0.1, 0.1, 0.12, 0.15], thumb: [0.6, 0.1] },
  slap:    { p: [0.1, -0.3, -0.5], F: [-0.15, -0.35, -1], N: [0, -1, 0.3], curl: [0.05, 0.05, 0.08, 0.1], thumb: [0.6, 0.1] },
  fist:    { p: [0.1, -0.2, -0.42], F: [-0.3, -0.2, -1], N: [-0.3, -1, 0.1], curl: [1.4, 1.5, 1.55, 1.55], thumb: [0.35, 0.9] },
  toss:    { p: [0.07, -0.18, -0.52], F: [-0.2, -0.1, -1], N: [0, -1, -0.3], curl: [0.2, 0.2, 0.25, 0.3], thumb: [0.6, 0.2] },
};
const SS_HBLEND = { phone: 0.55, phoneT: 0.12, phoneLow: 0.6, ticket: 0.6, pen: 0.5, press: 0.45, wheel: 0.6, wheelUp: 0.35, remote: 0.5, remoteP: 0.1, reach: 0.6, pinch: 0.2, hold: 0.5, slapUp: 0.25, slap: 0.09, fist: 0.3, toss: 0.12, hidden: 0.45 };

function ssHands(cam, script, o = {}) {
  const hands = new ViewerHands(cam, Object.assign({ scale: 1.0, skin: '#d2a487', nail: '#e6cbbf', sleeve: '#3a4250', cuff: '#2c333e', watch: false, sleeveLen: 1.0, sleeveFit: 0.85, poses: SS_HPOSE, blends: SS_HBLEND, script }, o));
  hands.root.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  // the right hand's props (shown by the set)
  const R = hands.right.g, props = {};
  props.phone = ssPhone(); props.phone.g.position.set(0.034, 0.074, 0.024); props.phone.g.rotation.set(0, 0, -Math.PI / 2); R.add(props.phone.g);
  { const t = new THREE.Group(), tt = ssTicketTex(); const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.16), new THREE.MeshStandardMaterial({ map: tt.tex, roughness: 0.75, side: THREE.DoubleSide }));
    t.add(paper); t.position.set(-0.01, 0.13, 0.012); t.rotation.set(0, 0, 0.2); R.add(t); props.ticket = t; hands.ticketTex = tt; }
  { const p = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.004, 0.14, 10), ssStd('#1c2a4a', 0.35, 0.3)); p.add(body);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.015, 10), ssStd('#c9c9c4', 0.3, 0.9)); tip.position.y = -0.077; tip.rotation.x = Math.PI; p.add(tip);
    p.position.set(0.02, 0.07, 0.035); p.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0.15, 0.8, 0.55).normalize()); R.add(p); props.pen = p; }
  { const r = new THREE.Group(); const body = new THREE.Mesh(ssRoundBox(0.045, 0.02, 0.17, 0.01, 0.004), ssStd('#1a1b1e', 0.45)); body.rotation.x = Math.PI / 2; r.add(body);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 10), ssStd('#b8332a', 0.4)); btn.rotation.x = Math.PI / 2; btn.position.set(0, 0.05, -0.012); r.add(btn);
    r.position.set(0.006, 0.06, 0.03); r.rotation.set(0, 0, 0.1); R.add(r); props.remote = r; }
  for (const k of Object.keys(props)) { const g = props[k].g || props[k]; g.visible = false; g.traverse((m) => { if (m.isMesh) { m.frustumCulled = false; m.castShadow = false; } }); }
  hands.props = props;
  hands.show = (which) => { for (const [k, v] of Object.entries(props)) (v.g || v).visible = which === k; };
  return hands;
}
// the lottery ticket (your six numbers; the set highlights the ones drawn)
const SS_NUMBERS = [7, 19, 23, 34, 41, 12];
// (a canvas texture: update({ n }) rings the first n numbers, the ones drawn so far)
function ssTicketTex() {
  const ct = ssCanvasTex(256, 480, (g, w, h, s) => {
    g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c23a2a'; g.fillRect(0, 0, w, 64); g.fillStyle = '#fff'; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center'; g.fillText('THE BIG DRAW', w / 2, 43);
    g.fillStyle = '#333'; g.font = '15px monospace'; g.fillText('SAT · DRAW 2,214 · $2.00', w / 2, 96);
    g.font = 'bold 34px monospace';
    SS_NUMBERS.forEach((n, i) => { const x = 40 + (i % 3) * 88, y = 160 + Math.floor(i / 3) * 70; g.fillStyle = i === 5 ? '#c23a2a' : '#222'; g.fillText(String(n).padStart(2, '0'), x, y); });
    g.fillStyle = '#666'; g.font = '13px monospace'; g.fillText('BONUS BALL', 216, 250);
    for (let i = 0; i < 46; i++) { g.fillStyle = i % 3 ? '#222' : '#555'; g.fillRect(24 + i * 4.6, 330, 2 + (hash1(i * 7) * 2.5 | 0), 70); }
    g.fillStyle = '#888'; g.font = '12px monospace'; g.fillText('0417 2214 8812 03', w / 2, 424);
    // the numbers drawn so far, ringed in pen
    g.strokeStyle = 'rgba(30,60,170,0.9)'; g.lineWidth = 5;
    for (let i = 0; i < (s.n || 0); i++) { const x = 40 + (i % 3) * 88, y = 160 + Math.floor(i / 3) * 70 - 12; g.beginPath(); g.ellipse(x, y, 38, 28, -0.1 + 0.2 * hash1(i * 5), 0.3, 0.3 + Math.PI * 2.1); g.stroke(); }
  });
  ct.update({ n: 0 });
  return ct;
}

// the sticky note: GIVE HALF AWAY in your handwriting, written k of the way (0…1); old (0…1) yellows and creases it
function ssNoteDraw(g, w, h, s) {
  const old = s.old || 0;
  g.fillStyle = `rgb(${Math.round(250 - 18 * old)},${Math.round(226 - 30 * old)},${Math.round(92 - 10 * old)})`; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0.08)'); gr.addColorStop(0.18, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(120,80,0,0.12)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (old > 0) { g.strokeStyle = `rgba(120,90,20,${0.25 * old})`; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h * 0.62); g.lineTo(w, h * 0.55); g.stroke(); g.beginPath(); g.moveTo(w * 0.3, 0); g.lineTo(w * 0.38, h); g.stroke(); }
  // the words, stroke by stroke (a hand-drawn line per letter, revealed in order)
  const k = s.k ?? 1, lines = ['GIVE', 'HALF', 'AWAY'], total = 12;
  g.save(); g.translate(w * 0.5, h * 0.5); g.rotate(-0.05); g.translate(-w * 0.5, -h * 0.5);
  g.font = `italic 700 ${Math.round(h * 0.2)}px "Lora", Georgia, serif`; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = `rgba(28,36,70,${0.92 - 0.25 * old})`;
  let n = 0;
  lines.forEach((ln, li) => {
    const y = h * (0.26 + li * 0.25), x0 = w * (0.14 + li * 0.03);
    let x = x0;
    for (const ch of ln) {
      const u = MathX.clamp(k * total - n, 0, 1), cw = g.measureText(ch).width;
      if (u > 0) { g.save(); g.beginPath(); g.rect(x - 2, y - h * 0.15, cw * u + 2, h * 0.3); g.clip(); g.fillText(ch, x, y + Math.sin(n * 2.7) * 2); g.restore(); }
      x += cw + 2; n++;
    }
  });
  if (k >= 1) { g.strokeStyle = `rgba(28,36,70,${0.8 - 0.2 * old})`; g.lineWidth = Math.max(3, h * 0.018); g.beginPath(); g.moveTo(w * 0.18, h * 0.86); g.quadraticCurveTo(w * 0.5, h * 0.9, w * 0.82, h * 0.84); g.stroke(); }
  g.restore();
}
function ssNoteTex(k = 1, old = 0) { const c = ssCanvas(256, 256, (g, w, h) => ssNoteDraw(g, w, h, { k, old })); return ssTex(c, { repeat: false }); }
