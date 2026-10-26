/* =====================================================================
   LAB — your boardroom (year one) and the room where the studies happen (illustrated, one at a time).
     boss          the boardroom high over the city: you take the head of the table; a folder slides to you, everyone
                   nods; then they all laugh at your joke
     dunn          a campus lobby (Vancouver): a researcher hands you an envelope; $20 and a card ("spend it on
                   someone else"); you drop it in a food-bank tin
     cookies       three strangers at a table; a card puts you in charge; a plate of five cookies, one each…
     cookie2       … you take the extra one, and eat it with your mouth open (they stare)
     game, game2   the rigged board game: a coin makes you rich (double money, two dice); you slap the board, take the
                   pretzels, win
     real          the board of study cards; stamps on the weak ones
     scott         MacKenzie Scott's gifts (an illustration, no people): a dark hall, a wall of 1,664 pigeonholes, one
                   envelope in each (one charity each: "over 1,600"); they light up, faster and faster, as you pull back
   ===================================================================== */

const SB_LB = { table: [0, 0.74, -0.5], seat: 0.46, eye: 1.18, BX: 40 };

Object.assign(LOOKS, {
  sbResearcher: { skin: 2, build: 'slim', shirt: '#e8e6e0', sleeves: 'long', pants: '#3a3f4a', shoes: '#2a2420', sole: '#14100c', hair: '#3a2416', hairStyle: 'pony', jacket: true, collar: true, inner: '#5a7a9a' },
  sbOpponent: { skin: 4, build: 'avg', shirt: '#5a6a4a', sleeves: 'long', pants: '#2a2c34', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#0e0b09', hood: true },
});
Object.assign(ACTIONS, {
  // seated: reaching to the middle of the table and back to the mouth (a cookie), right or left hand
  sbTakeR(τ, c) { const p = ACTIONS.sbTable(τ, c), r = Math.min(1, τ / 0.55) * (1 - MathX.smooth(τ, 0.7, 1.2)), e = MathX.smooth(τ, 0.8, 1.3) * (1 - MathX.smooth(τ, 2.4, 3.0));
    p.spine = 0.12 + 0.25 * r; p.rSh = [0.75 + 0.55 * r + 0.55 * e, 0.05 - 0.25 * r + 0.07 * e]; p.rEl = 0.95 - 0.75 * r + 1.15 * e; p.neck = 0.35 - 0.15 * r - 0.2 * e; return p; },
  sbTakeL(τ, c) { const p = ACTIONS.sbTable(τ, c), r = Math.min(1, τ / 0.55) * (1 - MathX.smooth(τ, 0.7, 1.2)), e = MathX.smooth(τ, 0.8, 1.3) * (1 - MathX.smooth(τ, 2.4, 3.0));
    p.spine = 0.12 + 0.25 * r; p.lSh = [0.75 + 0.55 * r + 0.55 * e, 0.05 - 0.25 * r + 0.07 * e]; p.lEl = 0.95 - 0.75 * r + 1.15 * e; p.neck = 0.35 - 0.15 * r - 0.2 * e; return p; },
  // seated, staring at you (a little lean back)
  sbStare(τ, c) { const p = ACTIONS.sbTable(τ, c); p.neck = -0.02; p.spine = -0.04; p.headYaw = 0; p.lSh = [0.55, 0.08]; p.rSh = [0.55, 0.08]; p.lEl = 1.25; p.rEl = 1.25; return p; },
  // seated, a flinch back (the slap)
  sbJolt(τ, c) { const p = ACTIONS.sbTable(τ, c), k = Math.min(1, τ / 0.1) * Math.exp(-τ / 0.5); p.spine = 0.12 - 0.3 * k; p.neck = 0.35 - 0.45 * k; return p; },
  // seated behind a table, holding something out to you (the envelope)
  sbOffer(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.6); p.rSh = [0.1 + 1.35 * k, 0.05]; p.rEl = 0.2 + 0.05 * k; p.neck = 0.12; p.headYaw = 0; p.spine = 0.28 * k; return p; },
});
Object.assign(BLEND, { sbTakeR: 0.35, sbTakeL: 0.35, sbStare: 0.4, sbJolt: 0.08, sbOffer: 0.5 });

// ---- textures (all made up: no real notes, logos or board-game designs)
function sbLbNote20() {
  return sbCanvas(512, 218, (g, w, h) => {
    g.fillStyle = '#c6d2bc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5e7058'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#e2e8d8'; g.beginPath(); g.ellipse(w * 0.36, h / 2, h * 0.3, h * 0.38, 0, 0, 7); g.fill(); g.strokeStyle = '#71846a'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#44523e'; g.font = 'bold 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('20', 62, 52); g.fillText('20', w - 62, h - 50); g.fillText('20', w - 70, 50);
    g.font = '600 26px Georgia, serif'; g.fillText('TWENTY', w * 0.68, h * 0.52);
  });
}
function sbLbCardCanvas(lines, big) {
  return sbCanvas(512, 300, (g, w, h) => {
    g.fillStyle = '#f6f3ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#1e2a4a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((ln, i) => { g.font = `${i === 0 && big ? 'bold 64' : i === 0 ? 'bold 40' : '30'}px Georgia, serif`; g.fillText(ln, w / 2, (i === 0 && big ? 110 : 70) + i * (big ? 70 : 52)); });
  });
}
function sbLbBoardCanvas() {
  return sbCanvas(1024, 1024, (g, w, h) => {
    g.fillStyle = '#d8e6d0'; g.fillRect(0, 0, w, h);
    const n = 9, c = 136, s = (w - 2 * c) / n, cols = ['#8a4a2a', '#5aa0d8', '#d84a8a', '#e88a2a', '#d82a2a', '#e8d02a', '#2a9a4a', '#2a4ab0'];
    g.strokeStyle = '#222'; g.lineWidth = 3;
    for (let side = 0; side < 4; side++) for (let i = 0; i < n; i++) {
      g.save(); g.translate(w / 2, h / 2); g.rotate(side * Math.PI / 2); g.translate(-w / 2, -h / 2);
      const x = c + i * s, y = h - c; g.fillStyle = '#eef4e8'; g.fillRect(x, y, s, c); g.strokeRect(x, y, s, c);
      if (i % 3 !== 1) { g.fillStyle = cols[(side * 2 + (i > 4 ? 1 : 0)) % 8]; g.fillRect(x, y, s, c * 0.24); g.strokeRect(x, y, s, c * 0.24); }
      g.restore();
    }
    for (const [x, y] of [[0, 0], [w - c, 0], [0, h - c], [w - c, h - c]]) { g.fillStyle = '#eef4e8'; g.fillRect(x, y, c, c); g.strokeRect(x, y, c, c); }
    g.fillStyle = '#b8241e'; g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 4); g.fillRect(-250, -60, 500, 120); g.fillStyle = '#fff'; g.font = 'bold 74px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TYCOON', 0, 4); g.restore();
  });
}
function sbLbStudyCard(c) {
  return sbCanvas(512, 340, (g, w, h) => {
    g.fillStyle = '#fbf9f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#c84a3a'; g.fillRect(0, 54, w, 3);
    g.fillStyle = '#1a1a1a'; g.textAlign = 'left'; g.font = 'bold 34px Georgia, serif'; g.fillText(c[1], 24, 40);
    g.font = 'bold 40px Georgia, serif'; c[0].forEach((ln, i) => g.fillText(ln, 24, 120 + i * 50));
    g.font = 'italic 28px Georgia, serif'; g.fillStyle = '#555'; g.fillText(c[2], 24, h - 30);
  });
}
function sbLbStampCanvas(txt) {
  return sbCanvas(512, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(200,30,30,0.92)'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = 'rgba(200,30,30,0.92)'; g.font = `bold ${txt.length > 12 ? 50 : 64}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 4);
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + 0.5 * hash1(i)})`; g.fillRect(hash1(i * 3) * w, hash1(i * 7) * h, 3, 3); }
  });
}
// MacKenzie Scott's wall: how far her gifts have lit it (0…1; the context line counts the dollars with it)
const sbScottK = (t) => MathX.smooth(t, SB.scottGive, SB.scottGive + 3.9);

SB_SETS.lab = (app) => {
  const S = sbSet(app, { sky: '#c8d6e6', fov: 55, near: 0.02, far: 3000, hemi: ['#e6eef6', '#8a8070', 0.55], sun: [-30, 40, 10], sunColor: '#fff1dc', sunI: 1.6, shadow: 2048, shadowR: 8, shadowFar: 120 });
  const { scene, camera: cam, sun, hemi } = S;
  scene.environment = sbEnv(app.renderer, '#d8e2ec', '#efe9e0', '#8a8070');
  const W = SB_W, K = sbK, L = SB_LB, TB = L.table;
  const groups = {}; const grp = (k) => { const g = new THREE.Group(); scene.add(g); groups[k] = g; return g; };
  const people = [], person = (spec, g) => { const p = sbPerson(spec, scene); p.root.traverse((m) => { if (m.isMesh) m.castShadow = true; }); p.group = g; people.push(p); return p; };
  const chair = (x, z, ry, g, col = '#2a2c30') => { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c);
    sbBox(0.46, 0.05, 0.44, sbStd(col, 0.6), 0, L.seat - 0.025, 0, c); sbBox(0.44, 0.48, 0.04, sbStd(col, 0.6), 0, L.seat + 0.26, -0.22, c);
    for (const [a, b] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) sbCyl(0.012, 0.012, L.seat, sbStd('#8a8c90', 0.3, 0.8), a, L.seat / 2, b, c, 8);
    return c; };

  // ======================= THE STUDY ROOM (a plain university room; the windows on the left look onto trees) =======================
  const gR = grp('room');
  { const floorTex = sbTex(sbCanvas(256, 256, (g, w, h) => { g.fillStyle = '#c8c4bc'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { const k = hash1(i * 3.3); g.fillStyle = k < 0.5 ? 'rgba(90,90,96,0.25)' : 'rgba(255,255,255,0.3)'; g.fillRect(hash1(i * 7) * w, hash1(i * 11) * h, 2, 2); } g.strokeStyle = 'rgba(80,80,80,0.25)'; g.strokeRect(0, 0, w, h); }));
    floorTex.repeat.set(16, 14);
    const fl = sbMesh(new THREE.PlaneGeometry(8, 7), sbStd('#ffffff', 0.5, 0, { map: floorTex }), 0, 0, 0, gR); fl.rotation.x = -Math.PI / 2;
    const wallM = sbStd('#e6e2da', 0.9), ceil = sbMesh(new THREE.PlaneGeometry(8, 7), sbStd('#f2f0ea', 0.95), 0, 3.0, 0, gR); ceil.rotation.x = Math.PI / 2;
    sbBox(8, 3, 0.1, wallM, 0, 1.5, -3.55, gR); sbBox(8, 3, 0.1, wallM, 0, 1.5, 3.55, gR); sbBox(0.1, 3, 7, wallM, 4.05, 1.5, 0, gR);
    // (the window wall: a sill, glass, mullions; trees and sky beyond)
    sbBox(0.1, 0.9, 7, wallM, -4.05, 0.45, 0, gR); sbBox(0.1, 0.6, 7, wallM, -4.05, 2.7, 0, gR);
    for (let z = -3.5; z <= 3.5; z += 1.75) sbBox(0.12, 1.5, 0.08, sbStd('#5a5e64', 0.4, 0.5), -4.05, 1.65, z, gR);
    const out = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial({ fog: false, map: sbTex(sbCanvas(1024, 360, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9cc0e4'); gr.addColorStop(0.6, '#e2ecf2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { const x = hash1(i * 3) * w, y = h * (0.42 + 0.25 * hash1(i * 5)), r = 30 + 50 * hash1(i * 7); g.fillStyle = `rgb(${70 + 40 * hash1(i)},${110 + 40 * hash1(i * 2)},${60 + 30 * hash1(i * 4)})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
      g.fillStyle = '#8a9a7a'; g.fillRect(0, h * 0.8, w, h * 0.2);
    }), { repeat: false }) }));
    out.position.set(-12, 3.5, 0); out.rotation.y = Math.PI / 2; gR.add(out);
    for (const [x, z] of [[-1.2, -1.6], [1.2, -1.6], [-1.2, 1.6], [1.2, 1.6]]) { const p = sbBox(0.6, 0.03, 0.6, sbStd('#ffffff', 0.4, 0, { emissive: new THREE.Color('#f4f6ff'), emissiveIntensity: 1.1 }), x, 2.98, z, gR); p.castShadow = false; }
    sbBox(1.0, 2.1, 0.06, sbStd('#8a6a4a', 0.6), 4.0, 1.05, 1.8, gR);
  }
  const roomL = [];
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [0, 1.6]]) { const l = new THREE.PointLight('#f0f2ff', 2.2, 9, 1.6); l.position.set(x, 2.8, z); gR.add(l); roomL.push(l); }
  // the table (shared by the cookies and the game) and its chairs
  const gT = grp('table');
  sbBox(1.6, 0.04, 0.9, sbStd('#d8cdb8', 0.55, 0, { map: sbTex(sbWoodCanvas(CONFIG.seed + 700, 256, 1024, [196, 176, 146])) }), TB[0], TB[1] - 0.02, TB[2], gT);
  for (const [a, b] of [[-0.74, -0.38], [0.74, -0.38], [-0.74, 0.38], [0.74, 0.38]]) sbCyl(0.022, 0.022, TB[1] - 0.04, sbStd('#6a6c70', 0.3, 0.8), TB[0] + a, (TB[1] - 0.04) / 2, TB[2] + b, gT, 8);
  const seatL = [-0.45, -1.35], seatR = [0.45, -1.35], seatC = [0, -1.35];
  const chairL = chair(...seatL, 0, gT), chairR = chair(...seatR, 0, gT), chairC = chair(...seatC, 0, gT), chairMe = chair(0, 0.4, Math.PI, gT);

  // ---- the cookies: papers and pens, the IN CHARGE card, the plate of five
  const gK = grp('cookies');
  for (const [x, z, r] of [[-0.45, -0.75, 0.1], [0.45, -0.75, -0.08], [0.02, -0.22, 0.04]]) { const pa = sbBox(0.21, 0.002, 0.297, sbStd('#f4f2ec', 0.9), x, TB[1] + 0.001, z, gK); pa.rotation.y = r; sbCyl(0.004, 0.004, 0.14, sbStd('#1c2a4a', 0.4), x + 0.13, TB[1] + 0.005, z, gK, 6).rotation.z = Math.PI / 2; }
  const card = new THREE.Group(); gK.add(card);
  { const cm = sbStd('#ffffff', 0.7, 0, { map: sbTex(sbLbCardCanvas(['IN CHARGE', 'drawn at random'], true), { repeat: false }) });
    const a = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.12), cm); a.position.set(0, 0.058, 0.028); a.rotation.x = -0.45; card.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.12), sbStd('#f6f3ea', 0.7)); b.position.set(0, 0.058, -0.028); b.rotation.x = 0.45 + Math.PI; card.add(b); }
  const plate = new THREE.Group(); gK.add(plate);
  sbCyl(0.14, 0.11, 0.015, sbStd('#f4f2ee', 0.3), 0, 0.008, 0, plate, 28);
  const cookieG = new THREE.CylinderGeometry(0.042, 0.042, 0.012, 20), bittenG = new THREE.CylinderGeometry(0.042, 0.042, 0.012, 20, 1, false, 0.9, Math.PI * 2 - 1.3);
  const cookieM = sbStd('#c8904a', 0.85, 0, { map: sbTex(sbCanvas(128, 128, (g, w, h) => { g.fillStyle = '#c8904a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { g.fillStyle = i % 3 ? '#3a2214' : '#a06a34'; g.beginPath(); g.arc(hash1(i * 3) * w, hash1(i * 7) * h, 3 + 4 * hash1(i * 5), 0, 7); g.fill(); } })) });
  const cookies = [];
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 + 0.3, c = sbMesh(cookieG, cookieM, Math.cos(a) * 0.066, 0.022, Math.sin(a) * 0.066, plate); c.rotation.y = a; cookies.push(c); }
  const researcher = person({ id: 'sbRsch', look: 'sbResearcher', path: [[0, 2.2, 1.6]], face: 90, states: [[0, 'idle']] }, gK);
  const stuL = person({ id: 'sbStuL', look: 'sbStudent1', path: [[0, ...seatL]], face: 180, seat: L.seat, states: [[0, 'sbTable']] }, gT);
  const stuR = person({ id: 'sbStuR', look: 'sbStudent2', path: [[0, ...seatR]], face: 180, seat: L.seat, states: [[0, 'sbTable']] }, gT);
  const handCookie = (p, side) => { const c = new THREE.Mesh(cookieG, cookieM); c.position.set(0, -0.07, 0.03); c.rotation.x = Math.PI / 2; (side > 0 ? p.j.la : p.j.ra).hand.add(c); c.visible = false; return c; };
  const ckL = handCookie(stuL, 1), ckR = handCookie(stuR, -1);
  const tTakeL = SB.plate + 0.9, tTakeR = SB.plate + 1.3, tTakeMe = SB.plate + 1.85, tEat = sbCap('cookie2', 1).show + 0.05;

  // ---- the game: the board, the money, the dice, two pawns, a bowl of pretzels; the coin
  const gG = grp('game');
  const board = sbBox(0.62, 0.012, 0.62, [sbStd('#2a3a2a', 0.6), sbStd('#2a3a2a', 0.6), sbStd('#ffffff', 0.6, 0, { map: sbTex(sbLbBoardCanvas(), { repeat: false }) }), sbStd('#2a3a2a', 0.6), sbStd('#2a3a2a', 0.6), sbStd('#2a3a2a', 0.6)], TB[0], TB[1] + 0.006, TB[2], gG);
  const pawnG = new THREE.LatheGeometry([[0, 0], [0.014, 0], [0.014, 0.004], [0.008, 0.01], [0.006, 0.026], [0.011, 0.032], [0.0, 0.042]].map(([x, y]) => new THREE.Vector2(x, y)), 14);
  const myPawn = sbMesh(pawnG, sbStd('#d8b040', 0.25, 0.8), 0, 0, 0, gG), theirPawn = sbMesh(pawnG, sbStd('#8a8c90', 0.35, 0.6), 0, 0, 0, gG);
  const tile = (i) => { const s = 0.62 / 2 - 0.041, step = (0.62 - 2 * 0.082) / 9, k = ((i % 40) + 40) % 40, side = Math.floor(k / 10), j = k % 10;
    const u = j === 0 ? s : s - 0.082 / 2 - (j - 0.5) * step; const pts = [[u, s], [-s, u], [-u, -s], [s, -u]][side]; return [TB[0] + pts[0], TB[1] + 0.012, TB[2] + pts[1]]; };
  const dieTex = (n) => sbTex(sbCanvas(64, 64, (g, w, h) => { g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; const P = { 1: [[32, 32]], 2: [[16, 16], [48, 48]], 3: [[14, 14], [32, 32], [50, 50]], 4: [[16, 16], [48, 16], [16, 48], [48, 48]], 5: [[16, 16], [48, 16], [32, 32], [16, 48], [48, 48]], 6: [[16, 14], [48, 14], [16, 32], [48, 32], [16, 50], [48, 50]] }[n]; for (const [x, y] of P) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } }), { repeat: false });
  const dieM = [1, 6, 2, 5, 3, 4].map((n) => sbStd('#ffffff', 0.4, 0, { map: dieTex(n) }));
  const dice = [[0.44, -0.47], [0.51, -0.52], [-0.2, -0.88]].map(([x, z]) => sbBox(0.024, 0.024, 0.024, dieM, TB[0] + x, TB[1] + 0.012, z, gG));
  const noteCols = ['#e8b8c8', '#f0e098', '#b8dcb0', '#a8c8e8', '#f0c890'];
  const stackG = new THREE.BoxGeometry(0.11, 0.004, 0.06), stacks = [];
  const mkStack = (x, z, n, ry) => { const g = new THREE.Group(); g.position.set(x, TB[1], z); g.rotation.y = ry; gG.add(g); for (let i = 0; i < n; i++) { const m = new THREE.Mesh(stackG, sbStd(noteCols[i % 5], 0.8)); m.position.set((i % 5) * 0.03 - 0.06, 0.003 + Math.floor(i / 5) * 0.0045, (i % 5) * 0.008); m.rotation.y = (i % 5 - 2) * 0.12; m.castShadow = true; g.add(m); } stacks.push(g); return g; };
  const myCash = [mkStack(-0.46, -0.36, 10, 0.25), mkStack(0.46, -0.36, 10, -0.25)], theirCash = mkStack(0.05, -0.885, 5, Math.PI);
  const bowl = new THREE.Group(); bowl.position.set(-0.64, TB[1], -0.58); gG.add(bowl);
  sbMesh(new THREE.SphereGeometry(0.09, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), sbStd('#f0ece4', 0.3, 0, { side: THREE.DoubleSide }), 0, 0.09, 0, bowl).rotation.x = 0;
  const pretzelG = new THREE.TorusKnotGeometry(0.012, 0.0035, 32, 6, 2, 3), pretzelM = sbStd('#a0602a', 0.55);
  for (let i = 0; i < 14; i++) { const pz = sbMesh(pretzelG, pretzelM, (hash1(i * 3) - 0.5) * 0.1, 0.035 + 0.012 * (i % 3), (hash1(i * 7) - 0.5) * 0.1, bowl); pz.rotation.set(hash1(i) * 3, hash1(i * 2) * 3, 0); }
  const coin = new THREE.Group(); gG.add(coin);
  { const cm = sbStd('#d8b040', 0.25, 0.9); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.003, 24), cm); coin.add(body);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), sbStd('#ffffff', 0.3, 0.6, { map: sbTex(sbCanvas(64, 64, (g, w, h) => { g.fillStyle = '#c8a038'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a5010'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', w / 2, h / 2 + 2); }), { repeat: false }) }));
    face.rotation.x = -Math.PI / 2; face.position.y = 0.0016; coin.add(face); }
  const opp = person({ id: 'sbOpp', look: 'sbOpponent', path: [[0, ...seatC]], face: 180, seat: L.seat, states: [[0, 'sbTable']] }, gG);

  // ---- the board of study cards (on the far wall), the stamps on the weak ones
  const gS = grp('real');
  const STUDIES = [
    [['Lottery winners', 'enjoyed little things less'], 'ILLINOIS · 1978', '22 winners', 'SMALL'],
    [['Spending on others', 'made people happier'], 'VANCOUVER · 2008', '46 people', 'SMALLER WHEN REPEATED'],
    [['Neighbours of winners', 'went bankrupt more'], 'CANADA · 2020', 'lottery records'],
    [['Millionaires wanted', '2 to 10 times more'], '17 COUNTRIES · 2018', '887 answered'],
    [['Winners in Sweden', 'more satisfied, for years'], 'SWEDEN · 2020', '3,300 players'],
    [['The leader took', 'the extra cookie'], 'BERKELEY · 1998', 'never published', 'UNPUBLISHED'],
    [['The rich player', 'slapped the board'], 'BERKELEY · 2013', 'from a talk', 'NOT A PAPER'],
    [['Bigger wins, views', 'moved right'], 'BRITAIN · 2014', 'national survey'],
    [['Higher-class walkers', 'looked more briefly'], 'NEW YORK · 2016', '61 people'],
    [['Expensive cars stopped', 'less at crossings'], 'BERKELEY · 2012', 'only 5 cheap cars', 'FAILED TO REPEAT'],
    [['Poorer people', 'gave more'], 'BERKELEY · 2010', '115 people', 'FAILED TO REPEAT'],
    [['Rich homes returned', 'more lost letters'], 'NETHERLANDS · 2021', '360 letters'],
    [['The billionaires\'', 'giving pledge'], 'USA · 2010–2025', '57 people'],
  ];
  const BZ = -3.48;
  sbBox(3.5, 1.7, 0.03, sbStd('#a8865a', 0.95, 0, { map: sbTex(sbCanvas(256, 128, (g, w, h) => { g.fillStyle = '#b08a5a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${hash1(i) > 0.5 ? '90,60,30' : '220,190,140'},0.35)`; g.fillRect(hash1(i * 3) * w, hash1(i * 7) * h, 1.5, 1.5); } }), { repeat: false }) }), 0, 1.55, BZ, gS);
  sbBox(3.6, 0.05, 0.05, sbStd('#5a4030', 0.6), 0, 2.42, BZ + 0.01, gS); sbBox(3.6, 0.05, 0.05, sbStd('#5a4030', 0.6), 0, 0.68, BZ + 0.01, gS);
  const stamps = [];
  STUDIES.forEach((c, i) => {
    const col = i % 5, row = Math.floor(i / 5), x = -1.36 + col * 0.68 + (row === 2 ? 0.34 : 0), y = 2.05 - row * 0.5, rz = (hash1(i * 13) - 0.5) * 0.08;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), sbStd('#ffffff', 0.85, 0, { map: sbTex(sbLbStudyCard(c), { repeat: false }) })); m.position.set(x, y, BZ + 0.018); m.rotation.z = rz; gS.add(m);
    sbMesh(new THREE.SphereGeometry(0.012, 10, 6), sbStd('#c8302a', 0.3), x, y + 0.17, BZ + 0.025, gS);
    if (c[3]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.144), new THREE.MeshBasicMaterial({ map: sbTex(sbLbStampCanvas(c[3]), { repeat: false }), transparent: true, depthWrite: false })); s.position.set(x + 0.02, y - 0.02, BZ + 0.024); s.rotation.z = -0.18 + rz; gS.add(s); stamps.push(s); }
  });
  const tStamp0 = sbCap('real', 2).show + 0.25;

  // ---- MacKenzie Scott's gifts (far from the room): a dark hall, the wall of pigeonholes, an envelope in each
  const SX = -60, SZ = -6, gV = grp('scott'), SC = { cols: 64, rows: 26, w: 0.2, h: 0.15, y0: 0.55 };
  { const fl = sbMesh(new THREE.PlaneGeometry(40, 30), sbStd('#16181c', 0.32, 0.1, { envMapIntensity: 0.4 }), SX, 0, SZ + 8, gV); fl.rotation.x = -Math.PI / 2;
    const W0 = SC.cols * SC.w, H0 = SC.rows * SC.h;
    // (the cubbies: a dark wood case, its grid drawn on, a lip round it)
    const grid = sbTex(sbCanvas(1024, 416, (g, w, h) => { g.fillStyle = '#120d09'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4a3624'; g.lineWidth = 3;
      for (let c = 0; c <= SC.cols; c++) { const x = c * w / SC.cols; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let r = 0; r <= SC.rows; r++) { const y = r * h / SC.rows; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }), { repeat: false });
    sbBox(W0, H0, 0.3, [sbStd('#2a2018', 0.7), sbStd('#2a2018', 0.7), sbStd('#2a2018', 0.7), sbStd('#2a2018', 0.7), sbStd('#ffffff', 0.85, 0, { map: grid }), sbStd('#2a2018', 0.7)], SX, SC.y0 + H0 / 2, SZ - 0.15, gV);
    sbBox(W0 + 0.24, 0.12, 0.42, sbStd('#3a2a1c', 0.6), SX, SC.y0 - 0.06, SZ - 0.1, gV); sbBox(W0 + 0.24, 0.12, 0.42, sbStd('#3a2a1c', 0.6), SX, SC.y0 + H0 + 0.06, SZ - 0.1, gV);
    sbBox(0.12, H0 + 0.24, 0.42, sbStd('#3a2a1c', 0.6), SX - W0 / 2 - 0.06, SC.y0 + H0 / 2, SZ - 0.1, gV); sbBox(0.12, H0 + 0.24, 0.42, sbStd('#3a2a1c', 0.6), SX + W0 / 2 + 0.06, SC.y0 + H0 / 2, SZ - 0.1, gV);
    const back = sbMesh(new THREE.PlaneGeometry(40, 14), sbStd('#0e1014', 0.9), SX, 7, SZ - 0.32, gV); back.receiveShadow = false; }
  const envN = SC.cols * SC.rows, envIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.15, 0.1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), envN);
  const envTh = new Float32Array(envN), envCol = new THREE.Color();
  { const o = new THREE.Object3D();
    for (let i = 0; i < envN; i++) {
      const c = i % SC.cols, r = Math.floor(i / SC.cols), x = SX + (c - SC.cols / 2 + 0.5) * SC.w + (hash1(i * 3.7) - 0.5) * 0.02, y = SC.y0 + (r + 0.42) * SC.h;
      o.position.set(x, y, SZ + 0.005); o.rotation.set(0, 0, (hash1(i * 5.1) - 0.5) * 0.1); o.updateMatrix(); envIM.setMatrixAt(i, o.matrix);
      // (the order: out from the middle, a little at random)
      const d = Math.hypot((c - SC.cols / 2) / (SC.cols / 2), (r - SC.rows / 2) / (SC.rows / 2) * 0.55) / 1.15;
      envTh[i] = 0.06 + 0.72 * Math.min(1, d) + 0.2 * hash1(i * 11.3);
      envIM.setColorAt(i, envCol.setRGB(0.13, 0.122, 0.108));
    }
    envIM.frustumCulled = false; gV.add(envIM); }
  const scottL = new THREE.PointLight('#ffd8a0', 0, 18, 1.6); scottL.position.set(SX, 2.4, SZ + 2.2); gV.add(scottL);
  const scottKey = new THREE.SpotLight('#b8c8f0', 2.2, 30, 0.7, 0.6, 1.4); scottKey.position.set(SX + 4, 7, SZ + 9); scottKey.target.position.set(SX, 1.5, SZ); gV.add(scottKey, scottKey.target);
  let scottK = -1;
  // ---- the campus lobby (Dunn): the researcher with envelopes at a table, a food-bank tin
  const gD = grp('dunn');
  const DK = [0, 0.95, -0.5];   // (a registration desk: 0.5 deep, counter height)
  sbBox(1.5, 0.04, 0.5, sbStd('#ffffff', 0.5, 0, { map: sbTex(sbWoodCanvas(CONFIG.seed + 730, 256, 1024, [176, 150, 120])) }), DK[0], DK[1] - 0.02, DK[2], gD);
  sbBox(1.5, 0.93, 0.04, sbStd('#3a4a5a', 0.7), DK[0], 0.465, DK[2] + 0.23, gD);
  const rsch2 = person({ id: 'sbRsch2', look: 'sbResearcher', path: [[0, 0, -1.02]], face: 180, states: [[0, 'idle'], [sbCap('dunn', 0).show - 0.2, 'sbOffer'], [sbCap('dunn', 0).show + 1.6, 'idle']] }, gD);
  const envM = sbStd('#efe6d2', 0.85, 0, { side: THREE.DoubleSide, map: sbTex(sbCanvas(256, 128, (g, w, h) => { g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a4a3a'; g.font = 'italic 26px Georgia, serif'; g.textAlign = 'center'; g.fillText('Participant 31', w / 2, h / 2 + 8); }), { repeat: false }) });
  const offerEnv = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.11), envM); offerEnv.rotation.x = -1.0; gD.add(offerEnv);
  const envBox = new THREE.Group(); envBox.position.set(0.42, DK[1], DK[2] - 0.08); gD.add(envBox);
  sbBox(0.26, 0.09, 0.14, sbStd('#a8885a', 0.8), 0, 0.045, 0, envBox); for (let i = 0; i < 12; i++) sbBox(0.012 + 0, 0.16, 0.11, envM, -0.1 + i * 0.018, 0.09, 0, envBox).rotation.z = 0.15;
  const tin = new THREE.Group(); tin.position.set(-0.4, DK[1], DK[2] + 0.06); gD.add(tin);
  sbCyl(0.065, 0.065, 0.17, sbStd('#c8302a', 0.4, 0.3), 0, 0.085, 0, tin, 24); sbBox(0.06, 0.004, 0.012, sbStd('#141414', 0.8), 0, 0.172, 0, tin);
  { const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0655, 0.0655, 0.08, 24, 1, true, -0.9, 1.8), sbStd('#ffffff', 0.7, 0, { map: sbTex(sbCanvas(256, 100, (g, w, h) => { g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8302a'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.fillText('FOOD BANK', w / 2, 62); }), { repeat: false }) })); lab.position.y = 0.09; tin.add(lab); }
  const tHand = sbCap('dunn', 0).show + 1.55, tRead = sbCap('dunn', 1).show - 0.1, tGive = sbCap('dunn', 2).show + 0.5;

  // ======================= THE BOARDROOM (high over the city) =======================
  const BX = L.BX, gB = grp('boss');
  { const fl = sbMesh(new THREE.PlaneGeometry(10, 11), sbStd('#3a3430', 0.5, 0, { map: sbTex(sbWoodCanvas(CONFIG.seed + 720, 256, 1024, [80, 64, 52])) }), BX, 0, -1, gB); fl.rotation.x = -Math.PI / 2; fl.material.map.repeat.set(6, 3);
    const ceil = sbMesh(new THREE.PlaneGeometry(10, 11), sbStd('#ece8e0', 0.95), BX, 3.2, -1, gB); ceil.rotation.x = Math.PI / 2;
    const wm = sbStd('#d8d2c8', 0.85);
    sbBox(0.1, 3.2, 11, wm, BX + 5, 1.6, -1, gB); sbBox(0.1, 3.2, 11, wm, BX - 5, 1.6, -1, gB); sbBox(10, 3.2, 0.1, wm, BX, 1.6, 4.5, gB);
    for (let x = -5; x <= 5; x += 2.0) sbBox(0.08, 3.2, 0.1, sbStd('#2a2c30', 0.4, 0.6), BX + x, 1.6, -6.5, gB);
    sbBox(10, 0.1, 0.12, sbStd('#2a2c30', 0.4, 0.6), BX, 0.05, -6.5, gB);
    // the table (dark, glossy), the chairs, a screen with the logo
    sbBox(1.5, 0.06, 5.6, sbStd('#1e1a18', 0.18, 0.1, { envMapIntensity: 1.2 }), BX, 0.71, -1.6, gB);
    sbBox(0.5, 0.68, 4.4, sbStd('#141210', 0.5), BX, 0.34, -1.6, gB);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.07), new THREE.MeshBasicMaterial({ map: sbTex(sbCanvas(512, 288, (g, w, h) => { g.fillStyle = '#10141c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3ccf78'; g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= 40; i++) { const x = 40 + i * 10.8, y = 230 - 160 * Math.pow(i / 40, 1.6) - 12 * Math.sin(i * 1.3); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.fillStyle = '#e8e6e0'; g.font = 'bold 30px Georgia, serif'; g.fillText('YOUR COMPANY · Q4', 40, 46); }), { repeat: false }) }));
    scr.position.set(BX + 4.94, 1.6, -1.8); scr.rotation.y = -Math.PI / 2; gB.add(scr);
  }
  const bossChairs = [], suits = [];
  const sides = [[-1, 0.3], [1, 0.3], [-1, -1.5], [1, -1.5], [-1, -3.3], [1, -3.3]];
  sides.forEach(([sx, z], i) => {
    const x = BX + sx * 1.1, dYou = Math.atan2(BX - x, 1.9 - z), dIn = Math.atan2(-sx, 0), dir = dIn + 0.45 * Math.atan2(Math.sin(dYou - dIn), Math.cos(dYou - dIn));
    chair(x, z, dir, gB, '#1a1a1c');
    suits.push(person({ id: 'sbSuitB' + i, look: 'sbSuit' + ((i % 5) + 1), path: [[0, x, z]], face: dir * 180 / Math.PI - 180, seat: L.seat, states: [[0, 'sbListen'], [sbCap('boss', 2).show + 0.15 + 0.12 * (i % 3), 'sbLaugh']] }, gB));
  });
  chair(BX, 2.0, Math.PI, gB, '#1a1a1c');
  const folder = sbBox(0.24, 0.012, 0.32, sbStd('#1f2a4a', 0.5), BX + 0.5, 0.746, 0.3, gB);
  const tFolder = sbCap('boss', 1).show + 0.2;
  // the city far below (towers to the horizon), the sky
  const sky = sbSky(scene, '#5a8cc8', '#d0dce8', '#9aa4ac', { sunDir: [-0.5, 0.5, -0.7], sunGlow: '#fff2d8', hw: 0.3 }); sky.visible = false;
  const city = (() => {
    const f = sbFacade(CONFIG.seed + 41, 'tower'), m = sbStd('#ffffff', 0.8, 0, { map: sbTex(f.map) }); m.map.repeat.set(1, 1);
    const N = 900, im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m, N), o = new THREE.Object3D(); let n = 0;
    for (let i = 0; i < 4000 && n < N; i++) { const x = (hash1(i * 3.1) - 0.5) * 1400, z = -40 - hash1(i * 5.3) * 900; if (Math.abs(x - BX) < 30 && z > -70) continue;
      const w = 18 + 26 * hash1(i * 7), h = 30 + 140 * Math.pow(hash1(i * 11), 2.2) * (1 - Math.min(1, -z / 1100)); o.position.set(x, -110 + h / 2, z); o.scale.set(w, h, w * (0.7 + 0.6 * hash1(i * 13))); o.updateMatrix(); im.setMatrixAt(n++, o.matrix); }
    im.count = n; gB.add(im);
    const ground = sbMesh(new THREE.PlaneGeometry(4000, 3000), sbStd('#7a7c74', 0.95), BX, -110, -900, gB); ground.rotation.x = -Math.PI / 2;
    return im;
  })();
  const bossL = new THREE.PointLight('#fff0dc', 2.0, 12, 1.4); bossL.position.set(BX, 2.9, -0.5); gB.add(bossL);

  // ======================= YOUR HANDS =======================
  const hs = {
    right: [[-1, 'hidden'],
      [tHand - 0.6, 'sbAim'], [tHand + 0.05, 'sbRead'], [tGive - 0.6, 'sbAim2'], [tGive + 0.35, 'hidden'],
      [SB.cookies - 0.1, 'sbRest'], [tTakeMe - 0.55, 'sbAim'], [tTakeMe + 0.05, 'sbBite'], [tTakeMe + 1.1, 'sbRest'], [SB.extra - 0.6, 'sbAim2'], [SB.extra + 0.05, 'sbHoldUp'], [tEat - 0.35, 'sbMouth'], [tEat + 1.7, 'sbHoldUp'],
      [SB.game - 0.1, 'sbRest'], [SB.slap - 0.45, 'slapUp'], [SB.slap - 0.06, 'sbSlap'], [SB.slap + 0.5, 'sbRest'], [SB.pretzel - 0.6, 'sbAim'], [SB.pretzel + 0.05, 'sbHoldUp'], [SB.pretzel + 1.1, 'sbMouth'], [SB.pretzel + 2.0, 'sbRest'], 
      [SB.genius - 0.2, 'hidden']],
    left: [[-1, 'hidden'], [SB.cookies - 0.1, 'sbRest'], [SB.genius - 0.2, 'hidden']],
  };
  const hands = sbHands(cam, hs, { sleeve: '#2a2c30', cuff: '#1e2024', watch: true });
  const P = hands.poses, Bl = hands.blends;
  P.sbRest = { p: [0.14, -0.3, -0.45], F: [-0.15, -0.3, -1], N: [0, -1, 0.2], curl: [0.35, 0.4, 0.45, 0.5], thumb: [0.55, 0.25] };
  P.sbAim = Object.assign({}, SB_HPOSE.pinch); P.sbAim2 = Object.assign({}, SB_HPOSE.pinch);
  P.sbBite = { p: [0.03, -0.26, -0.1], F: [-0.3, 0.6, -0.7], N: [-0.2, -0.75, 0.6], curl: [0.75, 0.85, 1.05, 1.15], thumb: [0.35, 0.75] };
  P.sbHoldUp = Object.assign({}, SB_HPOSE.hold, { p: [0.08, -0.13, -0.34] });
  P.sbMouth = Object.assign({}, SB_HPOSE.hold, { p: [0.02, -0.075, -0.15], trem: 0.002 });
  P.sbRead = { p: [-0.035, -0.125, -0.4], F: [-0.25, 1, 0.1], N: [-0.1, -0.1, 1], curl: [0.55, 0.85, 1.1, 1.25], thumb: [0.55, 0.55] };
  P.sbSlap = Object.assign({}, SB_HPOSE.slap); P.slapUp = Object.assign({}, SB_HPOSE.slapUp); P.sbFist = Object.assign({}, SB_HPOSE.fist, { p: [0.12, -0.08, -0.38], F: [-0.2, 1, -0.3], N: [-0.4, -0.1, -1], trem: 0.004 });
  Object.assign(Bl, { sbRest: 0.6, sbAim: 0.55, sbAim2: 0.55, sbBite: 0.4, sbHoldUp: 0.45, sbMouth: 0.35, sbRead: 0.5, sbSlap: 0.06, sbFist: 0.25 });
  // (props on the right hand: a cookie, a bitten one, pretzels, the envelope with its $20 and card)
  const R = hands.right.g, props = hands.props;
  const addProp = (name, obj) => { obj.visible = false; obj.traverse((m) => { if (m.isMesh) { m.frustumCulled = false; m.castShadow = false; } }); R.add(obj); props[name] = obj; return obj; };
  const GRIP = new THREE.Vector3(0.0, 0.105, 0.04);
  { const g = new THREE.Group(), c = new THREE.Mesh(cookieG, cookieM); c.rotation.x = Math.PI / 2; c.position.copy(GRIP).add(new THREE.Vector3(0, 0.03, 0)); g.add(c); addProp('cookie', g); }
  { const g = new THREE.Group(), c = new THREE.Mesh(bittenG, cookieM); c.rotation.set(Math.PI / 2, 0, 0); c.position.copy(GRIP).add(new THREE.Vector3(0, 0.03, 0)); g.add(c); addProp('bitten', g); }
  { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const pz = new THREE.Mesh(pretzelG, pretzelM); pz.position.copy(GRIP).add(new THREE.Vector3((i - 1) * 0.012, 0.012 + 0.008 * i, 0.004)); pz.rotation.set(i, i * 2, 0); g.add(pz); } addProp('pretzels', g); }
  { const g = new THREE.Group(); const e = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.2), envM); e.position.set(0.0, 0.16, 0.03); g.add(e); addProp('env', g); }
  { const g = new THREE.Group();
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.156, 0.066), sbStd('#ffffff', 0.85, 0, { map: sbTex(sbLbNote20(), { repeat: false }), side: THREE.DoubleSide })); n.position.set(0.01, 0.2, 0.05); n.rotation.z = 0.12; g.add(n);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.088), sbStd('#ffffff', 0.85, 0, { map: sbTex(sbLbCardCanvas(['Spend this $20 on', 'someone else:', 'a gift or a donation.', 'By 5 pm today.']), { repeat: false }), side: THREE.DoubleSide }));
    c.position.set(-0.01, 0.15, 0.056); c.rotation.z = -0.05; g.add(c); addProp('money', g); }
  { const g = new THREE.Group(); const n = new THREE.Mesh(new THREE.PlaneGeometry(0.078, 0.033), sbStd('#ffffff', 0.85, 0, { map: sbTex(sbLbNote20(), { repeat: false }), side: THREE.DoubleSide })); n.position.copy(GRIP).add(new THREE.Vector3(0, 0.03, 0)); n.rotation.z = Math.PI / 2; g.add(n); addProp('folded', g); }
  const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _cq = new THREE.Quaternion(), _hp = new THREE.Vector3();
  const orient = (F, N) => { _y.set(F[0], F[1], F[2]).normalize(); _z.set(N[0], N[1], N[2]); _z.addScaledVector(_y, -_z.dot(_y)).normalize(); _x.crossVectors(_y, _z); return _q.setFromRotationMatrix(_m.makeBasis(_x, _y, _z)); };
  const camDir = (d) => { _cq.copy(cam.quaternion).invert(); _v.set(d[0], d[1], d[2]).applyQuaternion(_cq); return [_v.x, _v.y, _v.z]; };
  // aim pose so its grip point lands on world point wp (fingers along world dir F, palm along world N)
  const aim = (pose, wp, F = [0, -0.55, -1], N = [0, -1, 0.35], local = GRIP) => { pose.F = camDir(F); pose.N = camDir(N); _v.set(wp[0], wp[1], wp[2]); cam.worldToLocal(_v); _w.copy(local).applyQuaternion(orient(pose.F, pose.N)); pose.p = [_v.x - _w.x, _v.y - _w.y, _v.z - _w.z]; };
  const cookieWorld = (i) => { plate.updateMatrixWorld(true); cookies[i].getWorldPosition(_hp); return [_hp.x, _hp.y + 0.006, _hp.z]; };

  // ---- light and backdrop per place
  let litKey = null;
  const setLight = (key) => {
    if (litKey === key) return; litKey = key;
    const boss = key === 'boss';
    sky.visible = boss; scene.background = new THREE.Color(boss ? '#c8d6e6' : '#d8e0e8');
    scene.fog = boss ? new THREE.FogExp2('#c2ccd8', 0.0011) : null;
    hemi.intensity = boss ? 0.85 : key === 'scott' ? 0.06 : 0.55; sun.intensity = boss ? 2.2 : key === 'scott' ? 0 : 1.5;
    if (key === 'scott') scene.background = new THREE.Color('#07080b');
    sun.position.set(boss ? BX - 30 : -30, 40, boss ? -40 : 10); sun.target.position.set(boss ? BX : 0, 0, boss ? -1 : -0.5); sun.target.updateMatrixWorld();
    S.sun.shadow.camera.left = S.sun.shadow.camera.bottom = boss ? -8 : -5; S.sun.shadow.camera.right = S.sun.shadow.camera.top = boss ? 8 : 5; S.sun.shadow.camera.updateProjectionMatrix();
    for (const l of roomL) l.intensity = key === 'scott' ? 0 : 2.2;
  };
  const look = (p, at, fov, t, drift = 0.004, roll = 0) => { const d = sbDrift(t, drift, 0.35, 31); sbCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); };

  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode;
      const place = m === 'boss' ? 'boss' : m === 'real' ? 'real' : m === 'scott' ? 'scott' : m === 'dunn' ? 'dunn' : (m === 'game' || m === 'game2') ? 'game' : 'cookies';
      setLight(place);
      gB.visible = place === 'boss'; gR.visible = place !== 'boss';
      gT.visible = place === 'cookies' || place === 'game';
      gK.visible = place === 'cookies'; gG.visible = place === 'game'; gS.visible = place === 'real'; gV.visible = place === 'scott'; gR.visible = place !== 'boss' && place !== 'scott'; gD.visible = place === 'dunn';
      chairL.visible = chairR.visible = place === 'cookies'; chairC.visible = place === 'game'; stuL.root.visible = stuR.root.visible = place === 'cookies'; chairMe.visible = place !== 'dunn';
      for (const p of people) p.root.visible = p.group.visible && ((p !== stuL && p !== stuR) || place === 'cookies');
      let pos, at, fov = 55, drift = 0.004, roll = 0, show = null;
      const shake = (t0, a) => { const k = Math.exp(-Math.max(0, t - t0) * 9) * (t >= t0 ? 1 : 0); return a * k * Math.sin((t - t0) * 70); };
      if (place === 'boss') {
        // you walk in and take the head of the table; they turn to you; the folder; the laugh
        const k = K(t, SB.boss, SB.boss + 2.4, Ease.inOutSine), kp = K(t, sbCap('boss', 2).show - 0.2, SB.cookies, Ease.inOutSine);
        pos = sbV([BX + 0.3, 1.66, 3.6], [BX, 1.2, 2.1], k); at = sbV([BX, 1.15, -6], [BX, 0.98, -3.8], k);
        at = [at[0] + 0.9 * Math.sin(kp * Math.PI * 1.0) * 0.6, at[1], at[2]]; fov = 54; drift = 0.005;
        for (const p of suits) p.update(t);
        const kf = K(t, tFolder, tFolder + 0.7, Ease.outCubic); folder.position.set(BX + 0.5 - 0.42 * kf, 0.746, 0.3 + 1.0 * kf); folder.rotation.y = 0.4 * kf;
      } else if (place === 'cookies') {
        // seated: across the table at the two others; the card; the plate; one each; the extra one; eating it
        const kc = K(t, SB.charge - 0.5, SB.charge + 0.1, Ease.outCubic), kpl = K(t, SB.plate - 0.6, SB.plate, Ease.outCubic);
        card.position.set(0.45 * (1 - kc), TB[1], TB[2] + 0.36 + 0.1 * (1 - kc)); card.rotation.y = 0.5 * (1 - kc); card.visible = t > SB.charge - 0.5;
        plate.position.set(TB[0] + 0.55 * (1 - kpl), TB[1], TB[2] - 0.02 - 0.1 * (1 - kpl)); plate.visible = t > SB.plate - 0.6;
        cookies[0].visible = t < tTakeL; cookies[1].visible = t < tTakeR; cookies[2].visible = t < tTakeMe; cookies[3].visible = t < SB.extra;
        ckL.visible = t >= tTakeL && t < tTakeL + 2.7; ckR.visible = t >= tTakeR && t < tTakeR + 2.7;
        // (the researcher: in with the card, out; in with the plate, out)
        const rp = [[0, 3.2, 1.2], [SB.charge - 1.6, 3.2, 1.2], [SB.charge - 0.5, 1.15, -0.1], [SB.charge + 0.6, 1.15, -0.1], [SB.charge + 1.8, 3.2, 1.2], [SB.plate - 1.8, 3.2, 1.2], [SB.plate - 0.6, 1.0, -0.45], [SB.plate + 0.5, 1.0, -0.45], [SB.plate + 2.0, 3.4, 1.6]];
        researcher.spec.path = rp; researcher.spec.face = undefined; researcher._preparePath();
        researcher.states = [[0, 'walk'], [SB.charge - 0.5, 'idle'], [SB.charge + 0.6, 'walk'], [SB.plate - 0.6, 'idle'], [SB.plate + 0.5, 'walk']];
        researcher.update(t); researcher.root.visible = t > SB.cookies && t < SB.plate + 2.6;
        stuL.states = [[0, 'sbTable'], [tTakeL - 0.55, 'sbTakeL'], [tTakeL + 3.0, 'sbTable'], [SB.extra - 0.2, 'sbStare']];
        stuR.states = [[0, 'sbTable'], [tTakeR - 0.55, 'sbTakeR'], [tTakeR + 3.0, 'sbTable'], [SB.extra - 0.1, 'sbStare']];
        stuL.update(t); stuR.update(t);
        pos = [0, L.eye, 0.42]; at = sbV(sbV([0, 0.95, -1.4], [0, 0.8, -0.78], K(t, SB.charge - 0.8, SB.charge + 0.2)), [0, 0.78, -0.62], K(t, SB.plate - 0.8, SB.plate + 0.4)); fov = 52;
        if (t > SB.extra + 0.4) at = sbV(at, [0, 1.0, -1.4], K(t, SB.extra + 0.4, SB.extra + 1.4));
        pos[1] += -0.02 * K(t, tEat - 0.3, tEat + 0.2) * (1 - K(t, tEat + 1.4, tEat + 1.9));
        if (t < tTakeMe + 0.05) aim(P.sbAim, cookieWorld(2)); else aim(P.sbAim2, cookieWorld(3));
        aim(P.sbRest, [0.15, TB[1] + 0.03, 0.02], [-0.1, -0.2, -1], [0, -1, 0.15], new THREE.Vector3(0, 0.07, 0.02));
        show = (t >= tTakeMe && t < tTakeMe + 1.0) ? 'cookie' : t >= SB.extra ? (t >= tEat + 0.1 ? 'bitten' : 'cookie') : null;
      } else if (place === 'game') {
        // the coin; your double money and two dice; the slap; the pretzels; your win
        const kfl = MathX.clamp((t - SB.flip) / 1.0, 0, 1), cx = TB[0] + 0.28 - 0.2 * kfl, cz = TB[2] + 0.05 * kfl;
        coin.position.set(cx, TB[1] + 0.014 + 0.42 * Math.sin(kfl * Math.PI) + (t < SB.flip ? 0.25 : 0), cz); coin.rotation.set(kfl < 1 ? kfl * 23 : 0, 0, 0);
        coin.visible = t >= SB.flip - 0.05 && t < sbCap('game', 2).show + 0.5;
        if (t < SB.flip) coin.visible = false;
        const kc = K(t, sbCap('game', 2).show - 0.1, sbCap('game', 2).show + 0.6, Ease.outCubic);
        myCash[0].visible = true; myCash[1].visible = t > sbCap('game', 2).show - 0.1; myCash[1].position.x = sbLerp(0.1, 0.46, kc);
        dice[1].visible = t > sbCap('game', 2).show + 0.4;
        const slapK = t >= SB.slap ? Math.exp(-(t - SB.slap) * 7) * Math.abs(Math.sin((t - SB.slap) * 18)) : 0;
        const hop = (i0, t0) => { const n = MathX.clamp(Math.floor((t - t0) / 0.28), 0, 3), f = MathX.clamp(((t - t0) / 0.28) % 1, 0, 1) * (t > t0 && n < 3 ? 1 : 0); const a = tile(i0 + n), b = tile(i0 + n + 1); return [sbLerp(a[0], b[0], f), a[1] + 0.03 * Math.sin(f * Math.PI), sbLerp(a[2], b[2], f)]; };
        const mp = hop(7, SB.winGame), tp = tile(14);
        myPawn.position.set(mp[0] - 0.008, mp[1] + 0.02 * slapK, mp[2] - 0.008); theirPawn.position.set(tp[0] + 0.01, tp[1] + 0.03 * slapK, tp[2] + 0.01);
        dice.forEach((d, i) => { d.position.y = TB[1] + 0.012 + (i < 2 ? 0.025 : 0.035) * slapK; d.rotation.set(slapK * 2 * (i + 1), slapK * 3, 0); });
        board.position.y = TB[1] + 0.006 + 0.004 * slapK;
        opp.states = [[0, 'sbTable'], [SB.slap, 'sbJolt'], [SB.slap + 0.9, 'sbTable'], [SB.winGame + 0.3, 'sbTableSlump']]; opp.update(t);
        pos = [0, 1.25, 0.3]; at = [0, 0.87, -0.85]; fov = 54;
        if (t >= SB.flip - 0.2 && t < sbCap('game', 2).show) { const k = K(t, SB.flip - 0.3, SB.flip + 0.3) * (1 - K(t, sbCap('game', 2).show - 0.6, sbCap('game', 2).show)); at = sbV(at, [0.1, 0.9, -0.5], k); fov = sbLerp(50, 40, k); }
        pos[1] += shake(SB.slap, 0.01) + 0.03 * K(t, SB.winGame + 0.2, SB.winGame + 1.2); pos[2] += 0.09 * K(t, SB.winGame + 0.2, SB.winGame + 1.2);
        aim(P.sbAim, [bowl.position.x, TB[1] + 0.06, bowl.position.z]);
        aim(P.sbSlap, [0.08, TB[1] + 0.03, TB[2] + 0.12], [-0.1, -0.15, -1], [0, -1, 0.1], new THREE.Vector3(0, 0.08, 0.02)); aim(P.slapUp, [0.1, TB[1] + 0.3, TB[2] + 0.2], [-0.1, 0.2, -1], [0, -1, 0.3], new THREE.Vector3(0, 0.08, 0.02));
        aim(P.sbRest, [0.15, TB[1] + 0.03, 0.02], [-0.1, -0.2, -1], [0, -1, 0.15], new THREE.Vector3(0, 0.07, 0.02));
        show = t >= SB.pretzel && t < SB.pretzel + 1.4 ? 'pretzels' : null;
      } else if (place === 'real') {
        const k = K(t, SB.real, SB.letters, (x) => x);
        pos = [-0.1, 1.6, sbLerp(0.0, -0.6, k)]; at = [-0.25, 1.78, BZ]; fov = 48; drift = 0.006;
        stamps.forEach((s, i) => { const t0 = tStamp0 + i * 0.42, k2 = K(t, t0, t0 + 0.12, Ease.inQuad); s.visible = t >= t0; s.scale.setScalar(1.35 - 0.35 * k2); s.material.opacity = k2; });
        let sh = 0; stamps.forEach((s, i) => { sh += shake(tStamp0 + i * 0.42 + 0.12, 0.004); }); pos[1] += sh;
      } else if (place === 'scott') {
        // close on a few dark pigeonholes; her money; then the envelopes light, out from the middle, as you pull back
        const k = sbScottK(t);
        if (Math.abs(k - scottK) > 1e-4) { scottK = k;
          for (let i = 0; i < envN; i++) { const a = MathX.smooth(k, envTh[i], envTh[i] + 0.06); envIM.setColorAt(i, envCol.setRGB(0.13 + 1.67 * a, 0.122 + 1.32 * a, 0.108 + 0.78 * a)); }
          envIM.instanceColor.needsUpdate = true; }
        scottL.intensity = 9 * k;
        const kb = K(t, SB.scott, SB.scottGive, Ease.inOutSine), kp = K(t, SB.scottGive - 0.3, SB.feeney + 0.3, Ease.inOutSine);
        pos = sbV(sbV([SX + 0.55, 1.62, SZ + 1.15], [SX + 0.3, 1.62, SZ + 3.0], kb), [SX - 0.4, 1.7, SZ + 10.5], kp);
        at = sbV(sbV([SX + 0.2, 1.52, SZ], [SX + 0.1, 1.5, SZ], kb), [SX, 2.3, SZ], kp); fov = sbLerp(44, 52, kp); drift = 0.004;
        scottKey.intensity = 3.4 - 1.2 * kp;
      } else if (place === 'dunn') {
        // standing at her table: the envelope; inside, $20 and a card; into the food-bank tin
        rsch2.update(t); offerEnv.visible = t < tHand;
        rsch2.j.ra.hand.getWorldPosition(_hp); _hp.add(_w.set(0, -0.02, 0.09)); offerEnv.position.copy(_hp);
        pos = [0.05, 1.64, 0.5]; at = sbV([0, 1.32, -1.1], [-0.12, 1.2, -0.6], K(t, tRead - 0.4, tRead + 0.6)); fov = 52;
        if (t > tGive - 1.2) at = sbV(at, [-0.3, 0.98, -0.4], K(t, tGive - 1.2, tGive - 0.2));
        if (t > tGive + 0.4) at = sbV(at, [0, 1.42, -1.0], K(t, tGive + 0.4, tGive + 1.5));   // (then back up to her)
        aim(P.sbAim, [_hp.x - 0.04, _hp.y, _hp.z + 0.04], [0, -0.2, -1], [-1, 0, 0.1]);
        aim(P.sbAim2, [tin.position.x, DK[1] + 0.21, tin.position.z], [-0.55, -0.25, -0.8], [0, -1, 0.2]);
        show = t >= tHand && t < tRead + 0.2 ? 'env' : t >= tRead + 0.2 && t < tGive - 0.65 ? 'money' : t >= tGive - 0.65 && t < tGive + 0.1 ? 'folded' : null;
      }
      look(pos, at, fov, t, drift, roll);
      hands.update(t); hands.show(show);
      this._t = t;
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.grain = 0.028;
      if (m === 'boss') { p.exposure = 1.0; p.warmth = 0.04; p.contrast = 1.1; p.bloom = 0.3; }
      else if (m === 'scott') { p.exposure = 1.1; p.warmth = 0.06; p.vignette = 0.66; p.bloom = 0.6; p.bloomThreshold = 0.85; p.contrast = 1.12; }
      else if (m === 'real') { p.exposure = 1.02; p.warmth = 0.03; p.contrast = 1.08; }
      else { p.exposure = m === 'dunn' ? 0.86 : 1.02; p.warmth = m === 'dunn' ? 0.05 : 0.0; p.contrast = 1.08; p.saturation = 0.96; }
    },
    labels(t) {
      const m = sbShotAt(t).mode, out = [];
      if (m === 'game') { const a = W(t, sbCap('game', 2).show + 0.4, SB.game2 - 0.1, 0.3, 0.3); out.push({ p: [-0.46, TB[1] + 0.1, -0.36], text: 'YOU', sub: 'RICH, BY A COIN', a }, { p: [0.05, TB[1] + 0.08, -0.885], text: 'THEM', a }); }
      if (m === 'scott') out.push({ p: [SX - 0.02, SC.y0 + SC.rows * SC.h + 0.32, SZ + 0.1], text: 'ONE ENVELOPE = ONE CHARITY', sub: 'OVER 1,600 BY 2022', side: 'c', a: W(t, SB.scottGive + 2.6, SB.feeney - 0.1, 0.4, 0.2) });
      return out;
    },
  };
  return set;
};
