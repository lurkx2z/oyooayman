/* =====================================================================
   SHOTS (2D) — the edit, built on the narration's word times (window.SBT from build-timing.cjs).
   Each shot draws itself for film time t. Characters: you (teal hoodie), your sister (yellow hoodie, ponytail).
   ===================================================================== */

const S = (id) => SBT.clips[id].start, E = (id) => SBT.clips[id].end;
function Wd(id, w, n = 0) {
  const L = SBT.clips[id].words.filter((x) => x.w.toLowerCase().replace(/[^a-z']/g, '').startsWith(w.toLowerCase()));
  if (!L[n]) throw new Error(`word "${w}" not in ${id}`); return L[n].s;
}
const T = {};
T.lid = Wd('jar', 'comes') + 0.04;
T.mugUp = Wd('mug', 'pick') - 0.05;
T.mug = Wd('mug', 'comes') + 0.03;
T.egg = Wd('nuance', 'harder') + 0.35;
T.lift0 = Wd('record', 'learn') - 0.2;
T.rack = Wd('record', 'smoothly');
T.over = Wd('record', 'beat') - 0.25;
T.lean = Wd('scaffold', 'lean') - 0.25;
T.choice = E('cost');
T.letGo = T.choice + 1.15;
T.run = T.choice + 2.85;
T.catch = T.run + 1.25;
T.black = T.catch + 0.9;
T.after = S('after') - 0.55;
function leanDeg(t) { if (t < T.lean) return 0.6; const u = cl((t - T.lean) / (T.catch - T.lean)); return 0.6 + 21.4 * Math.pow(u, 3.0); }

const SHOTS = [
  ['jarCU', 3.75], ['jarWide', S('mug') - 0.15], ['mug', S('sis1') - 0.12], ['sisCU', S('title') - 0.3], ['title', S('rule') - 0.3],
  ['diagram', Wd('nuance', 'your') - 0.25], ['careful', S('record') - 0.3], ['lift', S('nick') - 0.2], ['screen', S('final') - 0.25],
  ['final', Wd('scaffold', 'through') - 0.05], ['door', Wd('scaffold', 'your') - 0.15], ['sister', S('cost') - 0.15], ['face', T.choice + 0.3],
  ['grip', T.choice + 1.9], ['eyes', T.run], ['run', T.catch], ['catch', T.black], ['black', T.after], ['after', S('letter') - 0.3], ['letter', 1e9],
].reduce((acc, [id, t1]) => { acc.push({ id, t0: acc.length ? acc[acc.length - 1].t1 : -1, t1 }); return acc; }, []);
const shotAt = (t) => SHOTS.find((s) => t < s.t1) || SHOTS[SHOTS.length - 1];
const CUTS = SHOTS.slice(1).map((s) => s.t0);

// camera: zoom z about set point (cx, cy), with a little handheld drift
function cam(g, z, cx, cy, t, drift = 1) {
  const dx = noise(t * 0.45, 3) * 6 * drift, dy = noise(t * 0.4, 4) * 4 * drift;
  g.setTransform(z, 0, 0, z, W / 2 - (cx + dx) * z, H / 2 - (cy + dy) * z);
}
const blinkAt = (t, seed) => { const p = 3.1 + hash(seed) * 1.7, ph = (t + hash(seed + 9) * 3) % p; return ph < 0.12; };

// ---------- the kitchen beats ----------
function heroKitchen(g, t, o) {
  return drawStick(g, Object.assign({ x: 640, y: 1000, h: 640, f: 1, col: HERO, rim: 1, blink: blinkAt(t, 1) }, o));
}
function sisKitchen(g, t, o) {
  return drawStick(g, Object.assign({ x: 1360, y: 1000, h: 580, f: -1, col: SIS, pony: true, rim: -1, blink: blinkAt(t, 2) }, o));
}

const DRAW = {
  jarCU(g, t, sh) {
    const z = 1 + 0.04 * sm(t, 0, 3.7); cam(g, z, 960, 560, t, 0.4);
    kitchenBG(g, t);
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(20,10,25,0.45)'; g.fillRect(0, 0, W, H);   // (background soft and dark: an insert)
    cam(g, z, 960, 560, t, 0.4);
    // the counter, close
    vgrad(g, 0, 820, W, 260, [[0, '#efe8dc'], [0.06, '#d9d0c2'], [0.07, '#2f4a4c'], [1, '#1d3032']]);
    const s = 3.6, jx = 960, jy = 836;
    const off = t >= T.lid;
    drawJar(g, jx, jy, s, off);
    const u = t - T.lid;
    const lift = off ? eOut(u / 0.35) * 190 + Math.max(0, u - 0.35) * 8 : 0;
    const twist = sm(t, T.lid - 1.4, T.lid - 0.1);
    const lx = jx + (off ? eOut(u / 0.4) * 60 : 0), ly = jy - 92 * s - 14 * s - lift;
    drawLid(g, lx, ly, s, off, off ? -0.12 * eOut(u / 0.4) : noise(t * 30, 5) * 0.015 * twist);
    // glass chips
    if (off && u < 1.5) for (let i = 0; i < 16; i++) { const a = -Math.PI * (0.1 + 0.8 * hash(i * 7)), v = 500 + hash(i * 11) * 700, tt = Math.min(u, 0.9);
      const x = jx + Math.cos(a) * v * tt * (hash(i) > 0.5 ? 1 : -1), y = jy - 92 * s + 16 * s + Math.sin(a) * v * tt + 1600 * tt * tt;
      if (y < 840) { g.fillStyle = 'rgba(235,248,255,0.9)'; g.save(); g.translate(x, y); g.rotate(u * 12 + i); g.fillRect(-5, -2, 10, 4); g.restore(); } }
    // your hand on the lid (a big ink fist, teal sleeve from the top left), twisting
    const hx = lx + 10 + noise(t * 20, 6) * 3 * twist, hy = ly - 34;
    g.strokeStyle = PAL.hero; g.lineWidth = 120; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - 520, hy - 520); g.lineTo(hx - 70, hy - 40); g.stroke();
    g.strokeStyle = PAL.heroDk; g.lineWidth = 128; g.beginPath(); g.moveTo(hx - 92, hy - 64); g.lineTo(hx - 70, hy - 40); g.stroke();
    g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(hx, hy, 118, 82, -0.15 + twist * 0.25, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,179,107,0.6)'; g.lineWidth = 6; g.beginPath(); g.ellipse(hx, hy, 112, 76, -0.15 + twist * 0.25, -1.2, 0.4); g.stroke();
    // the other hand, holding the jar
    g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(jx - 132, jy - 150, 70, 92, 0.2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = PAL.heroDk; g.lineWidth = 110; g.beginPath(); g.moveTo(jx - 600, jy + 40); g.lineTo(jx - 190, jy - 120); g.stroke();
    if (off && u < 0.25) { g.globalCompositeOperation = 'lighter'; glow(g, jx, jy - 92 * s + 10, 260, 'rgba(255,255,255,0.8)', 1 - u / 0.25); g.globalCompositeOperation = 'source-over'; }
  },
  jarWide(g, t, sh) {
    const z = 1.18 - 0.08 * sm(t, sh.t0, sh.t1); cam(g, z, 900, 520, t);
    kitchenBG(g, t);
    const look = sm(t, sh.t0 + 0.6, sh.t0 + 1.3);
    sisKitchen(g, t, { p: pose({ lSh: 0.6, lEl: 1.2, rSh: 0.5, rEl: 1.3, tilt: 0.25 * (1 - look) - 0.05 * look }), eyes: { wide: look * 0.8, lx: 0 }, mouth: look > 0.5 ? 'o' : 'flat' });
    const hero = heroKitchen(g, t, { p: pose({ rSh: 1.7, rEl: 0.9, lSh: 0.35, lEl: 0.6, tilt: -0.25 }), eyes: { wide: 0.9, ly: -0.6, lx: 0.4 }, mouth: 'o', brow: 0.6 });
    kitchenFG(g);
    drawJar(g, 820, KIT.top + 2, 1.4, true);
    drawLid(g, hero.rHand[0] + 10, hero.rHand[1] - 6, 1.4, true, -0.2);
    g.fillStyle = PAL.ink; g.beginPath(); g.arc(hero.rHand[0], hero.rHand[1], 22, 0, Math.PI * 2); g.fill();
  },
  mug(g, t, sh) {
    const z = 1.12; cam(g, z, 980, 560, t);
    kitchenBG(g, t);
    const shock = sm(t, T.mug + 0.15, T.mug + 0.5);
    sisKitchen(g, t, { p: mixPose(pose({ lSh: 0.6, lEl: 1.2, rSh: 0.5, rEl: 1.3 }), pose(POSES.surprised), shock), eyes: { wide: 0.4 + shock * 0.6, lx: 0.2 }, mouth: shock > 0.3 ? 'open' : 'flat', brow: shock > 0.05 ? shock : undefined });
    const up = sm(t, T.mugUp, T.mugUp + 0.6);
    const hero = heroKitchen(g, t, { p: pose({ rSh: lerp(0.75, 1.25, up), rEl: lerp(0.65, 0.95, up), lSh: 0.3, lEl: 0.5, tilt: lerp(0.25, -0.05, up) }), eyes: { wide: t > T.mug ? 0.9 : 0, lx: 0.2, ly: t > T.mug ? 0.4 : 0 }, mouth: t > T.mug ? 'o' : 'smile' });
    kitchenFG(g);
    const hx = hero.rHand[0], hy = hero.rHand[1], s = 1.5;
    if (t < T.mug) { drawMug(g, hx - 30 * s - 30, hy + 38 * s, s); }
    else {
      const u = t - T.mug, my0 = hy + 38 * s, drop = KIT.top + 4 - my0, tf = Math.sqrt(Math.max(1, drop) / 2400);
      const my = u < tf ? my0 + 2400 * u * u : KIT.top + 4, tip = eOut((u - tf) / 0.25);
      drawMug(g, hx - 30 * s - 30 - tip * 18, my, s, false, true, u > tf ? -1.45 * tip : 0);
      drawMug(g, hx - 30 * s - 30, hy + 38 * s, s, true, false);
      if (u > tf) { const r = 30 + 150 * eOut((u - tf) / 0.5); g.fillStyle = 'rgba(58,36,22,0.92)'; g.beginPath(); g.ellipse(hx - 110, KIT.top + 6, r * 1.3, r * 0.12, 0, 0, Math.PI * 2); g.fill();
        for (let i = 0; i < 10 && u - tf < 0.6; i++) { const a = -Math.PI * hash(i * 3), v = 300 + hash(i * 5) * 400, q = u - tf; g.fillStyle = '#3a2416'; g.beginPath(); g.arc(hx - 110 + Math.cos(a) * v * q, KIT.top + Math.sin(a) * v * q + 1500 * q * q, 6, 0, Math.PI * 2); g.fill(); } }
    }
    g.fillStyle = PAL.ink; g.beginPath(); g.arc(hx, hy, 22, 0, Math.PI * 2); g.fill();
  },
  sisCU(g, t, sh) {
    const z = 2.25 + 0.1 * sm(t, sh.t0, sh.t1); cam(g, z, 1300, 470, t, 0.6);
    kitchenBG(g, t);
    const k = sm(t, Wd('sis1', 'rip') - 0.1, Wd('sis1', 'rip') + 0.3);
    const pt = sm(t, Wd('sis1', 'handle') - 0.2, Wd('sis1', 'handle') + 0.2);
    sisKitchen(g, t, { p: pose({ lSh: 0.6 + pt * 0.9, lEl: 1.2 - pt * 0.9, rSh: 0.5, rEl: 1.3, tilt: -0.12 + 0.12 * k, lean: -0.05 }), eyes: { wide: 0.9, lx: -0.2 }, mouth: noise(t * 9, 3) > -0.1 && t < E('sis1') ? 'open' : 'o', brow: 0.8 });
    kitchenFG(g);
  },
  title(g, t, sh) {
    const z = 1.0 + 0.06 * sm(t, sh.t0, sh.t1); cam(g, z, 960, 560, t, 0.3);
    houseDusk(g, t);
    // two silhouettes in the window: you, holding up a mug handle; your sister
    drawStick(g, { x: 880, y: 800, h: 210, f: 1, col: { hood: '#3a2a3a', hoodDk: '#2a1d2a', pants: '#2a1d2a' }, back: true, p: pose({ rSh: 1.9, rEl: 0.8 }) });
    drawStick(g, { x: 1070, y: 800, h: 190, f: -1, col: { hood: '#3a2a3a', hoodDk: '#2a1d2a', pants: '#2a1d2a' }, back: true, pony: true, p: pose(POSES.surprised) });
    g.fillStyle = '#1a1424'; g.fillRect(950, 560, 18, 230);
  },
  diagram(g, t, sh) { drawDiagram(g, t, sh); },
  careful(g, t, sh) {
    const z = 1.55 + 0.25 * sm(t, sh.t0, sh.t1); cam(g, z, 760, 470, t, 0.7);
    kitchenBG(g, t);
    sisKitchen(g, t, { x: 1250, p: pose(POSES.crossed), eyes: { lx: -0.3, ly: 0.3 }, mouth: 'smile', brow: -0.2 });
    const crack = t > T.egg;
    const hero = heroKitchen(g, t, { p: pose(POSES.carefulHold), eyes: { wide: crack ? 1 : 0.5, ly: 0.7, lx: 0.3 }, mouth: crack ? 'o' : 'grit', brow: 1, sweat: (t * 0.7) % 1 });
    kitchenFG(g);
    // the egg between your hands, trembling
    const ex = (hero.lHand[0] + hero.rHand[0]) / 2 + 26, ey = (hero.lHand[1] + hero.rHand[1]) / 2 - 18 + noise(t * 40, 9) * 2.5;
    g.fillStyle = '#f6efe2'; g.beginPath(); g.ellipse(ex, ey, 30, 40, 0.1, 0, Math.PI * 2); g.fill();
    if (crack) { g.strokeStyle = '#6a5a48'; g.lineWidth = 3; g.beginPath(); g.moveTo(ex - 22, ey - 6); g.lineTo(ex - 8, ey + 2); g.lineTo(ex + 2, ey - 8); g.lineTo(ex + 14, ey + 4); g.stroke(); }
    for (const hnd of [hero.lHand, hero.rHand]) { g.fillStyle = PAL.ink; g.beginPath(); g.arc(hnd[0], hnd[1], 21, 0, Math.PI * 2); g.fill(); }
  },
  lift(g, t, sh) {
    const z = 1.0 + 0.06 * sm(t, sh.t0, sh.t1); cam(g, z, 960, 540, t, 0.5);
    const cheer = sm(t, T.over + 0.2, T.over + 0.8);
    arenaBG(g, t, { cheer, platX: 1230, screenFn: (g2, x, y, w, h) => screenText(g2, x, y, w, h, t > T.over + 0.4 ? 'record' : 'lifting', t) });
    const k1 = sm(t, T.lift0, T.rack), k2 = sm(t, T.rack + 0.3, T.over);
    let p = mixPose(pose(POSES.crouchGrip), pose(POSES.rackPos), k1); p = mixPose(p, pose(POSES.overhead), k2);
    const hero = drawStick(g, { x: 1230, y: 866, h: 470, f: 1, col: HERO, p, rim: 1, eyes: { open: k2 > 0.95 ? 1 : 0.55, ly: -0.3 }, mouth: k2 > 0.95 ? 'smile' : 'grit', brow: k2 > 0.95 ? 0 : -0.6, sweat: (t * 0.6) % 1 });
    const bx = (hero.lHand[0] + hero.rHand[0]) / 2, by = (hero.lHand[1] + hero.rHand[1]) / 2;
    drawPlates(g, bx, by, 0.56);
    for (const hnd of [hero.rHand]) { g.fillStyle = PAL.ink; g.beginPath(); g.arc(hnd[0], hnd[1], 19, 0, Math.PI * 2); g.fill(); }
    if (cheer > 0) flashes(g, t, cheer);
  },
  screen(g, t, sh) {
    const z = 2.0 + 0.15 * sm(t, sh.t0, sh.t1); cam(g, z, 960, 330, t, 0.4);
    arenaBG(g, t, { cheer: 1, screenFn: (g2, x, y, w, h) => screenText(g2, x, y, w, h, 'nick', t) });
    g.setTransform(1, 0, 0, 1, 0, 0); flashes(g, t, 1);
  },
  final(g, t, sh) {
    const z = 1.0 + 0.32 * sm(t, sh.t0 + 2.2, sh.t1); cam(g, z, 960, lerp(540, 600, sm(t, sh.t0 + 2.2, sh.t1)), t, 0.5);
    arenaBG(g, t, { still: 1, screenFn: (g2, x, y, w, h) => screenText(g2, x, y, w, h, 'final', t) });
    // you walk out to the bar, then take your grip
    const walk = cl((t - sh.t0) / 2.3), x = lerp(470, 900, eOut(walk));
    const ph = (t - sh.t0) * 5.2, wk = walk < 1 ? 1 : 0;
    const wp = pose({ lHip: 0.45 * Math.sin(ph) * wk, rHip: -0.45 * Math.sin(ph) * wk, lKn: 0.3 * Math.max(0, Math.cos(ph)) * wk, rKn: 0.3 * Math.max(0, -Math.cos(ph)) * wk, lSh: -0.35 * Math.sin(ph) * wk, rSh: 0.35 * Math.sin(ph) * wk, lEl: 0.3, rEl: 0.3 });
    const gp = sm(t, sh.t0 + 2.9, sh.t0 + 3.6);
    const p = mixPose(wp, pose(POSES.crouchGrip), gp);
    const hero = drawStick(g, { x: lerp(x, 900, gp), y: 866, h: 560, f: 1, col: HERO, p, rim: 1, eyes: { ly: gp > 0.5 ? 0.3 : 0 }, mouth: 'flat', brow: -0.3, blink: blinkAt(t, 4) });
    const bx = gp > 0.01 ? (hero.lHand[0] + hero.rHand[0]) / 2 : 1100, by = gp > 0.01 ? (hero.lHand[1] + hero.rHand[1]) / 2 : 866 - 110;
    drawPlates(g, lerp(1100, bx, gp), lerp(866 - 110, by, gp), 1.0);
    if (gp > 0.5) { g.fillStyle = PAL.ink; g.beginPath(); g.arc(hero.rHand[0], hero.rHand[1], 19, 0, Math.PI * 2); g.fill(); }
  },
  door(g, t, sh) {
    // the loading door: the dark hall frames a bright afternoon; the scaffold, your sister on her phone
    const z = 1.0 + 0.45 * eIO((t - sh.t0) / (sh.t1 - sh.t0)); cam(g, z, 1020, 600, t, 0.4);
    g.save(); g.beginPath(); g.rect(640, 260, 760, 650); g.clip();
    g.translate(640, 260); g.scale(760 / W, 650 / H); g.translate(-200, -60); g.scale(1.25, 1.25);
    outsideBG(g, t); drawScaffold(g, 1000, 890, 1, leanDeg(t), t);
    drawStick(g, { x: 900, y: 890, h: 330, f: 1, col: SIS, pony: true, rim: 1, p: pose(POSES.phone), eyes: { ly: 0.8, lx: 0.3 }, mouth: 'flat' });
    g.restore();
    // the hall around the door
    g.fillStyle = '#0d0e16'; g.beginPath(); g.rect(-400, -300, 2720, 1680); g.rect(640, 260, 760, 650); g.fill('evenodd');
    g.fillStyle = '#c9a227'; g.fillRect(620, 236, 800, 26); g.fillStyle = '#1a1a1a'; for (let x = 630; x < 1420; x += 60) { g.save(); g.beginPath(); g.rect(620, 236, 800, 26); g.clip(); g.translate(x, 236); g.rotate(0.6); g.fillRect(0, -10, 24, 70); g.restore(); }
    g.fillStyle = '#3b3f48'; g.fillRect(610, 190, 820, 46);
    g.globalCompositeOperation = 'lighter'; glow(g, 1020, 900, 600, 'rgba(255,230,190,0.3)'); g.globalCompositeOperation = 'source-over';
    // the platform edge and your bar in the dark foreground
    g.fillStyle = '#121216'; g.fillRect(-400, 960, 2720, 400);
  },
  sister(g, t, sh) {
    const z = 1.0 + 0.15 * sm(t, sh.t0, sh.t1); cam(g, z, 1000, 520, t, 0.6);
    outsideBG(g, t);
    drawScaffold(g, 1170, 900, 1.15, leanDeg(t), t);
    const look = sm(t, T.lean + 1.5, T.lean + 2.1);
    drawStick(g, { x: 900, y: 902, h: 470, f: 1, col: SIS, pony: true, rim: 1, p: mixPose(pose(POSES.phone), pose({ lSh: 0.3, lEl: 1.5, rSh: 0.3, rEl: 0.4, tilt: -0.6, lean: -0.08 }), look),
      eyes: { ly: look > 0.5 ? -0.9 : 0.8, lx: 0.3, wide: look }, mouth: look > 0.5 ? 'o' : 'flat', blink: blinkAt(t, 3) });
  },
  face(g, t, sh) {
    const z = 3.2 + 0.25 * sm(t, sh.t0, sh.t1); cam(g, z, 960, 432, t, 0.5);
    arenaBG(g, t, { still: 1, screen: false });
    const dart = noise(t * 2.2, 8);
    drawStick(g, { x: 900, y: 866, h: 560, f: 1, col: HERO, p: pose(POSES.crouchGrip), rim: 1, eyes: { wide: 0.6, lx: dart * 0.9, ly: -0.2 }, mouth: 'grit', brow: 1, sweat: (t * 0.5) % 1 });
  },
  grip(g, t, sh) {
    // your hands on the bar, close. Then they open.
    const z = 1; cam(g, z, 960, 540, t, 0.6);
    arenaBG(g, t, { still: 1, screen: false, spot: false });
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(5,5,10,0.55)'; g.fillRect(0, 0, W, H);
    const rel = sm(t, T.letGo, T.letGo + 0.35);
    g.strokeStyle = '#c8cbd0'; g.lineWidth = 46; g.lineCap = 'butt'; g.beginPath(); g.moveTo(-50, 640); g.lineTo(W + 50, 640); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-50, 625, W + 100, 6);
    for (const [hx, sd] of [[700, -1], [1220, 1]]) {
      const lift = rel * 120, y = 640 - lift;
      g.strokeStyle = sd < 0 ? PAL.heroDk : PAL.hero; g.lineWidth = 170; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + sd * 260, 1200); g.lineTo(hx + sd * 40, y + 110); g.stroke();
      g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(hx, y + (1 - rel) * 6, 120, 92 - rel * 18, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,179,107,0.55)'; g.lineWidth = 6; g.beginPath(); g.ellipse(hx, y, 114, 86 - rel * 18, 0, -2.6, -0.6); g.stroke();
      if (rel < 0.5) { g.fillStyle = 'rgba(240,240,240,0.5)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(hx - 80 + k * 32, y - 30 + hash(k * 3) * 50, 3, 0, Math.PI * 2); g.fill(); } }   // chalk
    }
  },
  eyes(g, t, sh) {
    const z = 4.6; cam(g, z, 1012, 400, t, 0.4);
    arenaBG(g, t, { still: 1, screen: false });
    drawStick(g, { x: 900, y: 866, h: 560, f: 1, col: HERO, p: pose({ lean: 0.1, tilt: 0.1, lSh: 0.3, rSh: 0.2 }), rim: 1, eyes: { open: 0.7, lx: 0.8 }, mouth: 'flat', brow: -1 });
  },
  run(g, t, sh) {
    // a side-on sprint across the hall and out through the door (your legs got ten times stronger too)
    const u = cl((t - sh.t0) / (sh.t1 - sh.t0));
    const camX = lerp(700, 2500, eIn(u * 0.92));
    g.setTransform(1, 0, 0, 1, 0, 0);
    vgrad(g, 0, 0, W, H, [[0, '#0b0c16'], [1, '#171826']]);
    // background streaks (crowd blur) and the door
    g.save(); g.translate(W / 2 - camX, 0);
    for (let i = 0; i < 70; i++) { const y = 300 + hash(i * 5) * 520, x = hash(i * 7) * 3600 - 200; g.fillStyle = CROWD_COLS[i % CROWD_COLS.length]; g.globalAlpha = 0.35; g.fillRect(x, y, 260 + hash(i) * 400, 8); }
    g.globalAlpha = 1;
    // the door at x 2300: bright outside
    vgrad(g, 2300, 180, 900, 700, [[0, '#9fb6dc'], [1, '#f1d6b0']]); g.fillStyle = '#8d8a82'; g.fillRect(2300, 860, 900, 40);
    g.fillStyle = '#0b0c16'; g.fillRect(2240, 0, 60, 900); g.fillStyle = '#c9a227'; g.fillRect(2240, 150, 1000, 30);
    g.fillStyle = '#1d1e28'; g.fillRect(-500, 866, 2800, 300);
    g.restore();
    const ph = (t - sh.t0) * 13;
    const p = mixPose(pose(POSES.run1), pose(POSES.run2), 0.5 + 0.5 * Math.sin(ph));
    drawStick(g, { x: W / 2 - 80, y: 866 - Math.abs(Math.sin(ph)) * 24, h: 560, f: 1, col: HERO, p, rim: 1, eyes: { open: 0.75, lx: 0.9, ly: -0.3 }, mouth: 'grit', brow: -1 });
    // speed lines
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 4; for (let i = 0; i < 18; i++) { const y = 120 + hash(i * 13) * 840, x = ((hash(i * 3) * W - t * 3800) % W + W) % W; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 260, y); g.stroke(); }
    const out = sm(t, sh.t1 - 0.3, sh.t1); if (out > 0) { g.fillStyle = `rgba(255,245,225,${out * 0.9})`; g.fillRect(0, 0, W, H); }
  },
  catch(g, t, sh) {
    const u = t - sh.t0, shake = Math.exp(-u * 5) * 26;
    cam(g, 1.0, 1000 + noise(t * 30, 1) * shake, 520 + noise(t * 30, 2) * shake, t, 0);
    outsideBG(g, t);
    drawScaffold(g, 1170, 900, 1.15, leanDeg(t), t);
    drawStick(g, { x: 1040, y: 902, h: 430, f: 1, col: SIS, pony: true, rim: 1, p: pose({ lHip: 1.2, lKn: 2.2, rHip: 1.1, rKn: 2.1, lSh: 2.2, lEl: 1.6, rSh: 2.1, rEl: 1.7, lean: 0.4, tilt: 0.3 }), eyes: { open: 0.15 }, mouth: 'grit' });
    drawStick(g, { x: 870, y: 902, h: 560, f: 1, col: HERO, p: pose(POSES.catch), rim: 1, eyes: { open: u < 0.12 ? 1 : 0.15, wide: u < 0.12 ? 1 : 0 }, mouth: u < 0.12 ? 'o' : 'grit', brow: 1 });
    // CRACK: an X-ray flash of both forearms
    if (u > 0.08 && u < 0.5) xray(g, u);
  },
  black(g, t) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); },
  after(g, t, sh) {
    const z = 1.12 + 0.06 * sm(t, sh.t0, sh.t1); cam(g, z, 960, 600, t, 0.5);
    kitchenBG(g, t, true);
    tvShow(g, t);
    kitchenFG(g, true, 880);
    for (const x of [900, 1270]) { g.fillStyle = '#2a2230'; g.fillRect(x - 70, 860, 140, 22); g.strokeStyle = '#2a2230'; g.lineWidth = 12; g.beginPath(); g.moveTo(x - 50, 880); g.lineTo(x - 60, 1080); g.moveTo(x + 50, 880); g.lineTo(x + 60, 1080); g.stroke(); }
    const lean = sm(t, Wd('sis2', 'thank') - 0.2, Wd('sis2', 'thank') + 0.6);
    drawStick(g, { x: 1270 - 70 * lean, y: 1015, h: 560, f: -1, col: SIS, pony: true, rim: -1, rimCol: '#9fb6ff', p: mixPose(pose(Object.assign({}, POSES.crossed, { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4 })), pose(POSES.sitLean), lean),
      eyes: { lx: -0.4, open: lean > 0.6 ? 0.1 : 1 }, mouth: lean > 0.5 ? 'smile' : 'flat', brow: lean > 0.5 ? 0.6 : -0.6, blink: blinkAt(t, 7) });
    drawStick(g, { x: 900, y: 1015, h: 600, f: 1, col: HERO, casts: true, rim: 1, rimCol: '#9fb6ff', p: pose({ lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.25, lEl: 1.45, rSh: 0.2, rEl: 1.5, lean: 0.05, tilt: 0.15 }), eyes: { lx: lean > 0.3 ? 0.6 : -0.2, ly: 0.2 }, mouth: lean > 0.5 ? 'smile' : 'flat', brow: 0.3, blink: blinkAt(t, 8) });
  },
  letter(g, t, sh) {
    const z = 1.0 + 0.05 * sm(t, sh.t0, sh.t1); cam(g, z, 960, 540, t, 0.4);
    kitchenBG(g, t, true);
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(8,8,16,0.55)'; g.fillRect(0, 0, W, H);
    cam(g, z, 960, 540, t, 0.4);
    // the letter, held up in two casts
    g.save(); g.translate(960, 500); g.rotate(-0.03);
    shadowOn(g, 50, 'rgba(0,0,0,0.55)', 14);
    g.fillStyle = '#f4efe4'; g.fillRect(-330, -430, 660, 860); shadowOff(g);
    txt(g, 'OSTEON LABS', -270, -350, `700 30px ${SANS}`, '#20262c', 'left'); txt(g, 'BONE & TISSUE ENGINEERING', -270, -315, `500 20px ${SANS}`, '#8a8172', 'left');
    txt(g, 'Dear Glass Hercules,', -270, -220, `500 40px ${SERIF}`, '#20262c', 'left');
    const reveal = (k) => sm(t, k, k + 0.35);
    txt(g, 'We can build you', -270, -110, `700 62px ${SERIF}`, '#20262c', 'left', reveal(Wd('letter', 'we') - 0.2));
    txt(g, 'bones that', -270, -30, `700 62px ${SERIF}`, '#20262c', 'left', reveal(Wd('letter', 'bones') - 0.2));
    txt(g, 'keep up.', -270, 50, `700 62px ${SERIF}`, '#20262c', 'left', reveal(Wd('letter', 'keep') - 0.2));
    txt(g, 'Interested?', -185, 170, `italic 600 64px ${SERIF}`, '#8a1c22', 'left', reveal(Wd('letter', 'interested') - 0.2));
    txt(g, 'P.S. Bring the casts.', -270, 270, `500 34px ${SERIF}`, '#5a5246', 'left', 1 - sm(t, S('cta') - 0.4, S('cta')));
    g.restore();
    for (const [x, sd] of [[620, -1], [1300, 1]]) {
      g.strokeStyle = sd < 0 ? '#d9d4ca' : '#f4f1ea'; g.lineWidth = 190; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + sd * 200, 1250); g.lineTo(x, 650); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x - 90 + sd * k * 6, 760 + k * 70); g.lineTo(x + 90 + sd * k * 6, 740 + k * 70); g.stroke(); }
      g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(x, 600, 70, 56, 0, 0, Math.PI * 2); g.fill();
    }
  },
};

// the plates on the bar, side-on (a big disc at your hands)
function drawPlates(g, x, y, s, dim) {
  g.fillStyle = dim ? '#5a1a18' : '#b8322a'; g.beginPath(); g.arc(x, y, 112 * s, 0, Math.PI * 2); g.fill();
  g.fillStyle = dim ? '#1f2e4a' : '#2f5fa8'; g.beginPath(); g.arc(x, y, 84 * s, 0, Math.PI * 2); g.fill();
  g.fillStyle = dim ? '#4a3c12' : '#c9a227'; g.beginPath(); g.arc(x, y, 58 * s, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c8cbd0'; g.beginPath(); g.arc(x, y, 16 * s, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 5 * s; g.beginPath(); g.arc(x, y, 100 * s, -2.4, -1.2); g.stroke();
}
function screenText(g, x, y, w, h, mode, t) {
  g.textAlign = 'center';
  if (mode === 'lifting') { txt(g, 'CLEAN & JERK', x + w / 2, y + 90, `600 34px ${SANS}`, '#9fb6dc'); txt(g, '…', x + w / 2, y + 190, `700 110px ${SERIF}`, '#ffffff'); }
  if (mode === 'record') { txt(g, 'CLEAN & JERK', x + w / 2, y + 62, `600 30px ${SANS}`, '#ffffff'); txt(g, '570 kg', x + w / 2, y + 178, `700 118px ${SERIF}`, '#ffffff'); txt(g, 'WORLD RECORD · 267 kg', x + w / 2, y + 240, `600 28px ${SANS}`, PAL.amber); }
  if (mode === 'nick') { txt(g, 'THEY CALL HIM', x + w / 2, y + 66, `600 30px ${SANS}`, PAL.amber); txt(g, 'GLASS', x + w / 2, y + 150, `700 86px ${SERIF}`, '#ffffff'); txt(g, 'HERCULES', x + w / 2, y + 236, `700 86px ${SERIF}`, '#ffffff'); }
  if (mode === 'final') { txt(g, 'OLYMPIC FINAL · LAST LIFT', x + w / 2, y + 80, `600 32px ${SANS}`, '#ffffff'); txt(g, 'FOR GOLD', x + w / 2, y + 200, `700 104px ${SERIF}`, '#f2c230'); }
}
function flashes(g, t, a) {
  for (let i = 0; i < 9; i++) { const k = Math.floor(t * 6 + i * 0.37), on = hash(k * 31 + i) > 0.72; if (!on) continue;
    const x = hash(k * 7 + i) * W, y = 420 + hash(k * 13 + i) * 380; g.globalCompositeOperation = 'lighter'; glow(g, x, y, 60, 'rgba(255,255,255,0.9)', a); g.globalCompositeOperation = 'source-over'; }
}
function tvShow(g, t) {
  const x = 230, y = 165, w = 420, h = 240;
  g.fillStyle = '#0a0a0c'; rr(g, x - 10, y - 10, w + 20, h + 20, 8); g.fill();
  vgrad(g, x, y, w, h, [[0, '#162238'], [1, '#0b1020']]);
  g.fillStyle = '#f2c230'; g.beginPath(); g.arc(x + 70, y + 120, 42, 0, Math.PI * 2); g.fill(); txt(g, '1', x + 70, y + 136, `700 44px ${SERIF}`, '#7a5a10');
  txt(g, 'WEIGHTLIFTING · FINAL', x + 130, y + 70, `600 18px ${SANS}`, '#ffffff', 'left');
  txt(g, 'GOLD: ARANDA', x + 130, y + 130, `700 40px ${SERIF}`, '#ffffff', 'left');
  txt(g, 'GLASS HERCULES: DID NOT FINISH', x + 130, y + 176, `600 16px ${SANS}`, PAL.amber, 'left');
  g.globalCompositeOperation = 'lighter'; glow(g, x + w / 2, y + h / 2, 380, 'rgba(90,130,220,0.25)'); g.globalCompositeOperation = 'source-over';
}
// the X-ray flash: both forearms, the bones cracking
function xray(g, u) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const a = u < 0.4 ? 1 : 1 - (u - 0.4) / 0.1;
  g.globalAlpha = a; g.fillStyle = '#0b2a4a'; g.fillRect(0, 0, W, H);
  for (const [x, rot] of [[700, -0.25], [1220, 0.25]]) {
    g.save(); g.translate(x, 560); g.rotate(rot);
    g.fillStyle = 'rgba(120,190,255,0.25)'; rr(g, -110, -440, 220, 880, 100); g.fill();
    g.fillStyle = '#e8f4ff'; for (const bx of [-38, 38]) { rr(g, bx - 18, -380, 36, 760, 18); g.fill(); }
    g.strokeStyle = '#ff5a4a'; g.lineWidth = 9; g.lineJoin = 'round';
    for (const bx of [-38, 38]) { g.beginPath(); g.moveTo(bx - 26, -10); g.lineTo(bx - 4, 8); g.lineTo(bx + 6, -12); g.lineTo(bx + 26, 10); g.stroke(); }
    g.restore();
  }
  g.globalAlpha = 1;
}

// ---------- the forearm blueprint (the rule) ----------
function drawDiagram(g, t, sh) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  vgrad(g, 0, 0, W, H, [[0, '#0d1a2e'], [1, '#081120']]);
  g.strokeStyle = 'rgba(120,170,230,0.08)'; g.lineWidth = 2; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const z = 1 + 0.06 * sm(t, sh.t0, sh.t1); g.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z));
  const cx = 960, cy = 520;
  // the arm outline (elbow left, fist right)
  g.fillStyle = 'rgba(201,154,122,0.22)'; g.strokeStyle = 'rgba(201,154,122,0.6)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(cx - 640, cy - 120); g.bezierCurveTo(cx - 300, cy - 200, cx + 300, cy - 160, cx + 470, cy - 95); g.lineTo(cx + 600, cy - 130); g.arc(cx + 640, cy, 135, -1.3, 1.3); g.lineTo(cx + 470, cy + 95);
  g.bezierCurveTo(cx + 300, cy + 140, cx - 300, cy + 170, cx - 640, cy + 120); g.closePath(); g.fill(); g.stroke();
  // the muscle (red), pulsing harder after "ten times"
  const m = sm(t, Wd('rule', 'ten') - 0.1, Wd('rule', 'ten') + 0.4), pulse = m * (0.5 + 0.5 * Math.sin(t * 8));
  g.fillStyle = `rgb(${190 + pulse * 40},${60 - pulse * 10},${56})`;
  g.beginPath(); g.moveTo(cx - 600, cy - 95); g.bezierCurveTo(cx - 300, cy - 175 - pulse * 14, cx + 200, cy - 150 - pulse * 14, cx + 470, cy - 70); g.lineTo(cx + 470, cy - 20); g.bezierCurveTo(cx + 200, cy - 60, cx - 300, cy - 60, cx - 600, cy - 30); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 3; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(cx - 500 + k * 130, cy - 120); g.lineTo(cx - 470 + k * 130, cy - 55); g.stroke(); }
  // the bone (white), the crack at "break"
  g.fillStyle = '#f3eee2'; rr(g, cx - 610, cy + 5, 1080, 54, 27); g.fill(); g.beginPath(); g.arc(cx - 610, cy + 32, 44, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(cx + 470, cy + 32, 40, 0, Math.PI * 2); g.fill();
  const cr = sm(t, Wd('nuance', 'break') - 0.05, Wd('nuance', 'break') + 0.12);
  if (cr > 0) { g.strokeStyle = PAL.red; g.lineWidth = 10; g.lineJoin = 'round'; g.globalAlpha = cr; g.beginPath(); g.moveTo(cx - 20, cy); g.lineTo(cx - 36, cy + 22); g.lineTo(cx - 6, cy + 36); g.lineTo(cx - 24, cy + 64); g.stroke(); g.globalAlpha = 1;
    if (t - Wd('nuance', 'break') < 0.3) { g.globalCompositeOperation = 'lighter'; glow(g, cx - 20, cy + 30, 160, 'rgba(255,90,70,0.8)', 1 - (t - Wd('nuance', 'break')) / 0.3); g.globalCompositeOperation = 'source-over'; } }
  // arrows pulling, labels
  const ar = m;
  if (ar > 0) { g.globalAlpha = ar; g.strokeStyle = PAL.amber; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; const L = 70 + 30 * Math.sin(t * 8);
    g.beginPath(); g.moveTo(cx - 640, cy - 60); g.lineTo(cx - 640 - L, cy - 60); g.moveTo(cx - 620 - L, cy - 86); g.lineTo(cx - 646 - L, cy - 60); g.lineTo(cx - 620 - L, cy - 34); g.stroke();
    g.beginPath(); g.moveTo(cx + 500, cy - 45); g.lineTo(cx + 500 + L * 0.2, cy - 45); g.stroke(); g.globalAlpha = 1; }
  txt(g, 'MUSCLE', cx - 600, cy - 300, `600 40px ${SANS}`, PAL.cream, 'left', sm(t, sh.t0 + 0.2, sh.t0 + 0.6));
  txt(g, '×10', cx - 600, cy - 210, `700 110px ${SERIF}`, PAL.amber, 'left', m);
  const b = sm(t, Wd('rule', 'bones') - 0.1, Wd('rule', 'bones') + 0.3);
  txt(g, 'BONE', cx - 600, cy + 230, `600 40px ${SANS}`, PAL.cream, 'left', b);
  txt(g, '×1', cx - 600, cy + 340, `700 110px ${SERIF}`, '#ffffff', 'left', b);
  txt(g, 'the same bone you had yesterday', cx - 420, cy + 330, `italic 500 40px ${SERIF}`, '#9fb6dc', 'left', b * 0.9);
}

/* ---------- the film ---------- */
const FILM2 = {
  duration: SBT.duration,
  draw(g, t) { const sh = shotAt(t); FILM2._shot = sh; DRAW[sh.id](g, t, sh); g.setTransform(1, 0, 0, 1, 0, 0); },
  post(t) {
    const sh = shotAt(t); let fade = 0, flash = 0;
    for (const c of CUTS) if (Math.abs(t - c) < 0.05 && c !== T.black && c !== T.after) fade = Math.max(fade, 0.35 * (1 - Math.abs(t - c) / 0.05));
    if (t < 0.3) fade = Math.max(fade, 1 - t / 0.3);
    if (sh.id === 'after') fade = Math.max(fade, 1 - sm(t, T.after, T.after + 0.8));
    if (sh.id === 'catch') flash = Math.max(0, 1 - (t - sh.t0) / 0.1) * 0.95;
    if (sh.id === 'jarCU' && t > T.lid) flash = Math.max(0, 0.35 - (t - T.lid) * 2);
    return { fade, flash, vignette: sh.id === 'diagram' ? 0.45 : 0.62 };
  },
};
