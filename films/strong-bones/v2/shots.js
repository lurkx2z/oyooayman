/* =====================================================================
   SHOTS (v2) — the edit, placed on the voices' word times (window.SBT from v2/build-timing.cjs).
   34 shots, a cut every ~2 s. Characters talk with lip-flap from their own clips:
   you (teal hoodie), Maya (yellow, ponytail), the doctor (white coat), the coach (green cap), a worker (hard hat).
   ===================================================================== */

const S = (id) => SBT.clips[id].start, E = (id) => SBT.clips[id].end;
function Wd(id, w, n = 0) {
  const L = SBT.clips[id].words.filter((x) => x.w.toLowerCase().replace(/[^a-z']/g, '').startsWith(w.toLowerCase()));
  if (!L[n]) throw new Error(`word "${w}" not in ${id}`); return L[n].s;
}
const T = {};
T.wake = Wd('n_wake', 'wake');
T.slap = Wd('n_wake', 'stronger') + 0.14;
T.lid = S('s_handle') - 1.72;
T.mugUp = S('s_handle') - 0.95;
T.mug = S('s_handle') - 0.45;
T.mugHit = T.mug + 0.3;
T.crack = Wd('n_memo', 'bones');
T.circle = Wd('d_cracks', 'cracks');
T.bend = Wd('d_brake', 'brain') - 0.2;
T.relax = Wd('d_brake', 'brake');
T.egg = S('a_record') - 1.2;
T.kilos = Wd('a_record', 'kilos');
T.record = Wd('a_record', 'record');
T.bolt = S('w_going') - 0.45;
T.letGo = E('c_dare') + 0.45;
T.run0 = E('c_dare') + 1.05;
T.catch = T.run0 + 1.3;
T.pop = S('n_cta') - 0.25;
// the scaffold: a bolt shears, it sags 7°, then (after you let go) it falls to 30° where you catch it
function leanDeg(t) {
  if (t < T.bolt) return 0;
  if (t < T.run0) return 7 * eOut((t - T.bolt) / 2.6) + Math.sin(t * 7) * 0.25 * sm(t, T.bolt, T.bolt + 0.5);
  if (t < T.catch) { const u = (t - T.run0) / (T.catch - T.run0); return 7 + (CATCH_DEG - 7) * u * u; }
  return CATCH_DEG - 1.2 * Math.exp(-(t - T.catch) * 5) * Math.sin((t - T.catch) * 30);
}
const SCAF = { x: 1150, y: 940, s: 1 };
const CATCH_DEG = 38;

const SHOTS = [
  ['bedWide', T.slap - 0.55], ['bedSlap', T.slap + 0.7], ['jar', T.lid + 0.6], ['mug', Wd('y_touch', 'i') - 0.1],
  ['heroCU', S('y_ow') - 0.25], ['ow', S('n_memo') - 0.1], ['xrayWrist', S('n_title') - 0.25], ['title', S('d_cracks') - 0.3],
  ['docWide', Wd('d_cracks', 'hairline') - 0.15], ['lightbox', S('d_brake') - 0.2], ['docTwo', T.bend - 0.3], ['rail', S('c_slow') - 0.35],
  ['gymWide', Wd('c_slow', 'like') - 0.15], ['gymCU', E('c_slow') + 0.1], ['egg', S('a_record') - 0.1], ['recWide', Wd('a_record', 'new') - 0.25],
  ['recLow', S('n_nick') - 0.15], ['phone', Wd('n_nick', 'glass') - 0.35], ['billboard', S('a_final') - 0.2], ['finalWide', S('s_phone') - 0.3],
  ['outside', T.bolt - 0.3], ['bolt', S('w_going') - 0.05], ['worker', S('y_maya') - 0.1], ['maya', S('n_cost') - 0.1],
  ['arms', S('c_dare') - 0.12], ['coach', E('c_dare') + 0.15], ['release', T.run0], ['run', T.catch], ['catch', T.catch + 1.0],
  ['still', S('a_tv') - 0.25], ['tv', S('s_idiot') - 0.25], ['sofa', S('y_jar') - 0.3], ['jarAsk', E('y_jar') + 0.3], ['end', 1e9],
].reduce((acc, [id, t1]) => { acc.push({ id, t0: acc.length ? acc[acc.length - 1].t1 : -1, t1 }); return acc; }, []);
const shotAt = (t) => SHOTS.find((s) => t < s.t1) || SHOTS[SHOTS.length - 1];
const CUTS = SHOTS.slice(1).map((s) => s.t0);
const U = (t, sh) => cl((t - sh.t0) / (sh.t1 - sh.t0));   // progress through a shot

const blinkAt = (t, seed) => { const p = 3.1 + hash(seed) * 1.7, ph = (t + hash(seed + 9) * 3) % p; return ph < 0.12; };
const walk = (t, sp = 4) => mixPose(pose(POSES.walk1), pose(POSES.walk2), 0.5 + 0.5 * Math.sin(t * sp));
const runP = (t) => mixPose(pose(POSES.run1), pose(POSES.run2), 0.5 + 0.5 * Math.sin(t * 22));
function hero(g, t, o) { return drawStick(g, Object.assign({ f: 1, col: HERO, rim: 1, t, blink: blinkAt(t, 1), talk: talkAt(t, 'y') }, o)); }
function maya(g, t, o) { return drawStick(g, Object.assign({ f: -1, col: SIS, pony: true, rim: -1, t, blink: blinkAt(t, 2), talk: talkAt(t, 's') }, o)); }
function doctor(g, t, o) { return drawStick(g, Object.assign({ f: 1, col: DOC, coat: true, glasses: true, rim: 1, t, blink: blinkAt(t, 3), talk: talkAt(t, 'd') }, o)); }
function coach(g, t, o) { return drawStick(g, Object.assign({ f: 1, col: COACH, cap: '#2f7a3a', whistle: true, rim: 1, t, blink: blinkAt(t, 4), talk: talkAt(t, 'c') }, o)); }
function worker(g, t, o) { return drawStick(g, Object.assign({ f: -1, col: WORKER, hardhat: true, vest: true, rim: 1, t, talk: talkAt(t, 'w') }, o)); }
const sleeve = (g, a, b, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
const fist = (g, x, y, r) => { g.fillStyle = PAL.ink; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.4, 0, Math.PI * 2); g.fill(); };
function spot(g, x, y0, y1, w0, w1, a, col = 'rgba(255,240,210,0.5)') { shaft(g, [[x - w0, y0], [x + w0, y0], [x + w1, y1], [x - w1, y1]], col, a); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.fillStyle = 'rgba(255,230,190,0.35)'; g.beginPath(); g.ellipse(x, y1, w1, w1 * 0.12, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
function dust(g, t, x, y, n, a, seed = 3) { for (let i = 0; i < n; i++) { const dx = (hash(seed + i) - 0.5) * 900, r = 60 + hash(seed + i * 3) * 120; g.globalAlpha = a * (0.25 + 0.2 * hash(i)); g.fillStyle = '#c9b8a6'; g.beginPath(); g.arc(x + dx + noise(t * 0.4 + i, seed) * 40, y - hash(i * 7) * 200 - t * 6, r, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; }

const DRAW = {
  /* ---------- bedroom ---------- */
  bedWide(g, t, sh) {
    const u = U(t, sh);
    drawSet(g, 'bedroom', { x: 1130, y: 640, z: 1.12 + 0.08 * eIO(u) }, t, (q) => {
      alarmClock(q, 785, 800, 0.75, t, 1);
      // you, asleep: head on the pillow, eyes open on "wake"
      const R = 62, hx = 1040, hy = 700; const gr = q.createRadialGradient(hx + 20, hy - 30, 5, hx, hy, R); gr.addColorStop(0, '#3a3d55'); gr.addColorStop(1, '#0e0f18');
      q.fillStyle = gr; q.beginPath(); q.arc(hx, hy, R, 0, Math.PI * 2); q.fill();
      face(q, [hx, hy], R, -1, { eyes: { open: t < T.wake ? 0.08 : 1, wide: sm(t, T.wake, T.wake + 0.3) * 0.6, lx: -0.3 }, mouth: t < T.wake ? 'flat' : 'o', brow: t < T.wake ? undefined : 0.5 }, {});
      // the arm reaches out for the clock
      const ar = sm(t, T.wake + 0.3, T.slap - 0.6);
      if (ar > 0) { const hand = [lerp(1060, 860, ar), lerp(800, 700, ar)]; sleeve(q, [1110, 790], hand, PAL.hero, 34); fist(q, hand[0], hand[1], 20); }
      // the duvet over the body (with a breathing rise)
      const br = Math.sin(t * 1.6) * 4; const dg = q.createLinearGradient(0, 700, 0, 880); dg.addColorStop(0, '#6f93a8'); dg.addColorStop(1, '#3f5f73'); q.fillStyle = dg;
      q.beginPath(); q.moveTo(1000, 860); q.quadraticCurveTo(1000, 760, 1110, 750 - br); q.quadraticCurveTo(1400, 700 - br, 1600, 760); q.quadraticCurveTo(1900, 770, 1930, 860); q.closePath(); q.fill();
      q.strokeStyle = 'rgba(255,255,255,0.15)'; q.lineWidth = 6; q.beginPath(); q.moveTo(1150, 760); q.quadraticCurveTo(1300, 800, 1420, 740); q.stroke();
    });
  },
  bedSlap(g, t, sh) {
    const hit = t >= T.slap, u = t - T.slap;
    drawSet(g, 'bedroom', { x: 790, y: 730, z: 2.3, shake: hit ? Math.max(0, 0.9 - u * 2) : 0 }, t, (q) => {
      if (!hit) alarmClock(q, 785, 800, 0.75, t, 1);
      else {
        alarmClock(q, 785, 800, 0.75, t, 0, u);
        // the nightstand top splits
        q.strokeStyle = '#2a1a12'; q.lineWidth = 5; q.beginPath(); q.moveTo(790, 786); q.lineTo(778, 830); q.lineTo(796, 870); q.lineTo(784, 930); q.stroke();
        q.fillStyle = 'rgba(30,20,15,0.35)'; q.beginPath(); q.moveTo(760, 786); q.lineTo(820, 786); q.lineTo(800, 800); q.lineTo(770, 800); q.fill();
      }
      // your hand comes down
      const d = hit ? 1 : sm(t, T.slap - 0.5, T.slap - 0.25) * 0.25 + eIn((t - (T.slap - 0.22)) / 0.22) * 0.75;
      const hand = [lerp(900, 790, d), lerp(560, 760, cl(d))];
      sleeve(q, [1060, 520], hand, PAL.hero, 48); fist(q, hand[0], hand[1], 28);
    });
  },
  /* ---------- kitchen ---------- */
  jar(g, t, sh) {
    const z = 1 + 0.04 * U(t, sh);
    setBlur(g, 'kitchen', { x: 960, y: 520, z: 1.4 }, t, 0.25);
    camK(g, { x: 960, y: 560, z, shake: t > T.lid ? Math.max(0, 0.5 - (t - T.lid)) : 0 }, 1, t);
    vgrad(g, -100, 860, W + 200, 400, [[0, '#efe8dc'], [0.05, '#d9d0c2'], [0.06, '#2e4e55'], [1, '#1d3238']]);
    const s = 3.6, jx = 960, jy = 870, off = t >= T.lid, u = t - T.lid;
    drawJar(g, jx, jy, s, off);
    // left hand holds the jar
    sleeve(g, [380, 1180], [700, 760], PAL.hero, 90); fist(g, 760, 720, 56);
    const lift = off ? eOut(u / 0.35) * 190 + Math.max(0, u - 0.35) * 8 : 0, twist = sm(t, T.lid - 1.2, T.lid - 0.1);
    const lx = jx + (off ? eOut(u / 0.4) * 60 : 0), ly = jy - 92 * s - 14 * s - lift;
    drawLid(g, lx, ly, s, off, off ? -0.12 * eOut(u / 0.4) : noise(t * 30, 5) * 0.02 * twist);
    // right hand on the lid
    const rh = [lx + 40, ly - 40]; sleeve(g, [1500, 120], rh, PAL.hero, 90); fist(g, rh[0], rh[1], 62);
    if (off && u < 1.4) { const r = rng(9); for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.1 + 0.8 * r()), v = 500 + r() * 800, tt = Math.min(u, 0.9), sx = r() > 0.5 ? 1 : -1;
      const x = jx + Math.cos(a) * v * tt * sx, y = jy - 92 * s + 16 * s + Math.sin(a) * v * tt + 1600 * tt * tt; g.fillStyle = 'rgba(225,245,255,0.9)'; g.save(); g.translate(x, y); g.rotate(u * 9 + i); g.beginPath(); g.moveTo(0, -9); g.lineTo(8, 6); g.lineTo(-7, 7); g.fill(); g.restore(); } }
    if (!off) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 4; for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2; g.beginPath(); g.arc(jx, jy - 92 * s - 6 * s, 150 + k * 12, a, a + 0.5); g.stroke(); } }
  },
  mug(g, t, sh) {
    const snap = t >= T.mug;
    let hand;
    drawSet(g, 'kitchen', { x: 980, y: 560, z: 1.08 }, t, (q) => {
      const p = t < T.mugUp ? pose(POSES.relaxed) : snap ? pose({ lSh: 0.1, lEl: 0.2, rSh: 1.25, rEl: 0.9, tilt: 0.1 }) : mixPose(pose(POSES.relaxed), pose({ lSh: 0.1, lEl: 0.2, rSh: 1.05, rEl: 1.1 }), eIO((t - T.mugUp) / 0.35));
      const H1 = hero(q, t, { x: 760, y: 1010, h: 600, p, eyes: { wide: snap ? 0.7 : 0, ly: snap ? 0.6 : 0, lx: 0.3 }, mouth: snap ? 'o' : 'smile', brow: snap ? 0.6 : undefined });
      hand = H1.rHand;
      const look = t > T.mug + 0.15;
      maya(q, t, { x: 1250, y: 1010, h: 540, p: look ? pose(POSES.crossed) : pose(POSES.holdFront), eyes: { wide: look ? 0.4 : 0, ly: look ? 0.4 : 0.6 }, brow: look ? -0.5 : undefined, mouth: look ? 'flat' : 'smile' });
      if (!look) { drawMug(q, 1180, 800, 0.9, true, true); steam(q, 1180, 730, 0.8, t); }
      // your mug: in your hand until the handle snaps
      if (!snap) { const mx = t < T.mugUp ? 905 : hand[0] - 28, my = t < T.mugUp ? KIT2.top + 4 : hand[1] + 40; drawMug(q, mx, my, 1.1, true, true); steam(q, mx, my - 85, 0.9, t); }
      else drawMug(q, hand[0] - 34, hand[1] + 40, 1.1, true, false, 0.2);
    }, { front: (q) => {
      if (!snap) return; const u = t - T.mug;
      if (t < T.mugHit) { const x = hand[0] - 34, y = hand[1] + 40 + 900 * u * u; drawMug(q, x, Math.min(y, KIT2.top + 10), 1.1, false, true, u * 3); }
      else { smash(q, hand[0] - 34, KIT2.top + 8, 1.4, t - T.mugHit); q.fillStyle = '#efe8dc'; for (const [dx, r] of [[-40, 0.4], [30, -0.6], [70, 1.2]]) { q.save(); q.translate(hand[0] - 34 + dx, KIT2.top + 2); q.rotate(r); q.fillRect(-14, -8, 28, 12); q.restore(); } }
    } });
  },
  heroCU(g, t, sh) {
    drawSet(g, 'kitchen', { x: 800, y: 470, z: 2.0 }, t, (q) => {
      const H1 = hero(q, t, { x: 760, y: 1010, h: 600, p: pose({ lSh: 0.3, lEl: 0.5, rSh: 1.35, rEl: 1.35, tilt: -0.05 }), eyes: { wide: 0.8, lx: 0.2 }, brow: 0.8, mouth: 'o' });
      drawMug(q, H1.rHand[0] - 34, H1.rHand[1] + 40, 1.1, true, false, 0.4);
    }, { farBlur: 8 });
  },
  ow(g, t, sh) {
    drawSet(g, 'kitchen', { x: 1010, y: 540, z: 1.4 }, t, (q) => {
      hero(q, t, { x: 780, y: 1010, h: 600, p: pose(POSES.wristHold), eyes: { open: 0.75, lx: -0.2, ly: 0.5 }, brow: 1, mouth: 'wavy', sweat: (t * 0.8) % 1 });
      maya(q, t, { x: 1250, y: 1010, h: 540, p: pose(POSES.crossed), eyes: { open: 0.65, lx: 0.4 }, brow: -0.3, mouth: 'smirk' });
      drawMug(q, 1000, KIT2.top + 4, 0.9, false, false);
    });
  },
  xrayWrist(g, t, sh) {
    g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#06162c'], [1, '#020a16']]);
    g.strokeStyle = 'rgba(120,170,230,0.07)'; g.lineWidth = 2; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const z = 1 + 0.08 * U(t, sh); g.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z));
    xrayArm(g, 960, 560, 0.95, -1.2, sm(t, T.crack, T.crack + 1.4), t);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.08; g.fillStyle = '#4ab0ff'; g.fillRect(0, (t * 600) % H, W, 30); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  },
  /* ---------- the street (title) ---------- */
  title(g, t, sh) {
    const u = U(t, sh);
    drawSet(g, 'street', { x: 980 + 140 * u, y: 520 - 30 * u, z: 1.04 }, t, (q) => {
      // a neighbour watering plants, a dog, birds
      drawStick(q, { x: 1640, y: 900, h: 400, f: -1, col: { hood: '#9a7fb0', hoodDk: '#7a5f90', pants: '#3a3550' }, p: pose({ rSh: 1.2, rEl: 0.3, lSh: 0.1 }), t, mouth: 'smile', rim: 1 });
      q.strokeStyle = 'rgba(160,210,255,0.7)'; q.lineWidth = 4; for (let k = 0; k < 6; k++) { const ph = (t * 2 + k / 6) % 1; q.beginPath(); q.arc(1560 - ph * 80, 760 + ph * ph * 120, 3, 0, Math.PI * 2); q.stroke(); }
      for (let i = 0; i < 6; i++) { const bx = 400 + ((t * 80 + i * 90) % 1400), by = 200 + Math.sin(t * 2 + i) * 20 + i * 12; q.strokeStyle = '#2b3047'; q.lineWidth = 4; q.beginPath(); q.moveTo(bx - 14, by); q.quadraticCurveTo(bx - 6, by - 10 * Math.abs(Math.sin(t * 9 + i)), bx, by); q.quadraticCurveTo(bx + 6, by - 10 * Math.abs(Math.sin(t * 9 + i)), bx + 14, by); q.stroke(); }
      // you and Maya walk out of the house
      const hx = 470 + 380 * u, mx = 330 + 380 * u;
      maya(q, t, { x: mx, y: 905, h: 420, f: 1, rim: 1, p: walk(t * 1.6 + 1), talk: 0, mouth: 'smile', eyes: { lx: 0.3 } });
      hero(q, t, { x: hx, y: 905, h: 460, p: walk(t * 1.6), talk: 0, mouth: 'flat', eyes: { lx: -0.4 }, brow: 0.3 });
    });
  },
  /* ---------- the doctor ---------- */
  docWide(g, t, sh) {
    drawSet(g, 'doctor', { x: 860, y: 560, z: 1.0 + 0.04 * U(t, sh) }, t, (q) => { lightboxXray(q, t); docScene(q, t, false); });
  },
  lightbox(g, t, sh) {
    const u = U(t, sh);
    drawSet(g, 'doctor', { x: 490, y: 400, z: 2.4 + 0.15 * u }, t, (q) => {
      lightboxXray(q, t);
      // the doctor's pen circles the cracks
      const a = sm(t, T.circle - 0.3, T.circle + 0.5) * Math.PI * 2;
      q.strokeStyle = '#e0483e'; q.lineWidth = 5; q.beginPath(); q.ellipse(450, 352, 62, 40, 0, -Math.PI / 2, -Math.PI / 2 + a); q.stroke();
      const px = 450 + 62 * Math.cos(-Math.PI / 2 + a), py = 352 + 40 * Math.sin(-Math.PI / 2 + a);
      sleeve(q, [760, 600], [px + 40, py + 34], '#eef0f3', 46); q.strokeStyle = '#3d6fd6'; q.lineWidth = 6; q.beginPath(); q.moveTo(px, py); q.lineTo(px + 34, py + 30); q.stroke(); fist(q, px + 40, py + 34, 16);
    }, { glow: true });
  },
  docTwo(g, t, sh) {
    drawSet(g, 'doctor', { x: 700, y: 520, z: 1.55 }, t, (q) => { lightboxXray(q, t); docScene(q, t, true); });
  },
  rail(g, t, sh) {
    setBlur(g, 'doctor', { x: 800, y: 700, z: 1.8 }, t, 0.2);
    camK(g, { x: 960, y: 540, z: 1.0 + 0.05 * U(t, sh) }, 1, t);
    const bend = sm(t, T.bend, T.bend + 1.1) * 34, rel = sm(t, T.relax, T.relax + 0.5);
    // the padded table top and its steel rail, bending under your grip
    box(g, -100, 330, W + 200, 160, '#5d8fa8', { r: 30 }); g.fillStyle = '#f6f3ec'; g.fillRect(-100, 320, W + 200, 30);
    g.strokeStyle = '#b9c2ca'; g.lineWidth = 46; g.lineCap = 'round'; g.beginPath(); g.moveTo(-100, 560); g.quadraticCurveTo(960, 560 + bend * 2, W + 100, 560); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 10; g.beginPath(); g.moveTo(-100, 548); g.quadraticCurveTo(960, 548 + bend * 2, W + 100, 548); g.stroke();
    if (bend > 4) { g.strokeStyle = 'rgba(40,40,50,0.5)'; g.lineWidth = 3; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(960 + d * 60, 560 + bend * 1.6); g.lineTo(960 + d * 90, 590 + bend * 1.4); g.stroke(); } }
    // your hand: grips, then lets go and lifts away (the brain on the brake)
    const hy = 560 + bend * 2 - rel * 220; sleeve(g, [1180, -40], [990, hy - 60], PAL.hero, 120); fist(g, 960, hy, 92);
    if (!rel) { g.strokeStyle = PAL.ink; g.lineWidth = 50; g.lineCap = 'round'; for (const dx of [-60, -20, 20, 60]) { g.beginPath(); g.moveTo(960 + dx, hy + 30); g.lineTo(960 + dx, hy + 70); g.stroke(); } }
  },
  /* ---------- the gym ---------- */
  gymWide(g, t, sh) {
    const u = U(t, sh), lift = sm(t, sh.t0 + 0.3, sh.t1 + 1.6);
    drawSet(g, 'gym', { x: 900, y: 560, z: 1.0 + 0.06 * u }, t, (q) => {
      coach(q, t, { x: 560, y: 960, h: 500, p: t < Wd('c_slow', 'smooth') ? pose(POSES.crossed) : pose(POSES.point), eyes: { lx: 0.3 }, brow: -0.2 });
      liftHero(q, t, 1080, 960, 470, lift, { sweat: 0 });
    });
    motes(g, t, 0, 0, W, 700, 40, 7);
  },
  gymCU(g, t, sh) {
    const lift = sm(t, sh.t0 - 2.3, sh.t1 + 0.6);
    drawSet(g, 'gym', { x: 1080, y: 520, z: 2.1 }, t, (q) => liftHero(q, t, 1080, 960, 470, lift, { sweat: (t * 0.7) % 1, eyes: { open: 0.6, ly: -0.3 }, brow: -0.6, mouth: 'grit' }));
    motes(g, t, 0, 0, W, H, 50, 8);
  },
  egg(g, t, sh) {
    setBlur(g, 'gym', { x: 1000, y: 600, z: 1.6 }, t, 0.3);
    g.setTransform(1, 0, 0, 1, 0, 0);
    eggHeld(g, 960, 500, 1.9, 0.6 + 0.4 * Math.sin(t * 3) * 0.2, t);
    const th = sm(t, sh.t1 - 0.8, sh.t1 - 0.4); if (th > 0) { const x = W + 200 - th * 520; sleeve(g, [W + 300, 900], [x, 760], COACH.hood, 110); fist(g, x - 20, 740, 70); g.strokeStyle = PAL.ink; g.lineWidth = 40; g.beginPath(); g.moveTo(x - 40, 700); g.lineTo(x - 40, 610); g.stroke(); }
  },
  /* ---------- the record ---------- */
  recWide(g, t, sh) {
    const u = U(t, sh), cheer = sm(t, T.kilos, T.kilos + 0.4);
    drawSet(g, 'arena', { x: 960, y: 520, z: 1.0 + 0.08 * u }, t, (q) => {
      arenaScreen(q, t, cheer > 0 ? 'record' : 'lifting'); crowdArms(q, t, cheer * 0.8);
      spot(q, 960, 120, 1000, 30, 260, 0.6);
      liftHero(q, t, 960, 975, 420, 1, { mouth: cheer > 0.5 ? 'smile' : 'grit', eyes: { open: 0.8, ly: -0.4 } });
    }, { farBlur: 2 });
    g.setTransform(1, 0, 0, 1, 0, 0); flashes(g, t, 0.3 + cheer * 0.7, 300, 700);
  },
  recLow(g, t, sh) {
    const u = U(t, sh);
    drawSet(g, 'arena', { x: 960, y: 640, z: 1.65 + 0.05 * u, rot: -0.05 }, t, (q) => {
      arenaScreen(q, t, 'wr'); crowdArms(q, t, 0.9); spot(q, 960, 120, 1000, 30, 260, 0.7);
      liftHero(q, t, 960, 975, 420, 1, { mouth: 'smile', eyes: { wide: 0.3, ly: -0.5 } });
    });
    g.setTransform(1, 0, 0, 1, 0, 0); flashes(g, t, 1, 200, 600); confetti(g, t, T.record);
  },
  phone(g, t, sh) {
    setBlur(g, 'street', { x: 1000, y: 600, z: 1.3 }, t, 0.3);
    g.setTransform(1, 0, 0, 1, 0, 0);
    sleeve(g, [W / 2 + 120, H + 200], [W / 2 + 60, 760], '#9a7fb0', 130);
    phoneFeed(g, W / 2, 490 + (1 - eOut(U(t, sh) * 3)) * 80, 1.1, t, U(t, sh));
    fist(g, W / 2 - 205, 620, 46); fist(g, W / 2 + 207, 560, 46);
  },
  billboard(g, t, sh) {
    const u = U(t, sh);
    drawSet(g, 'street', { x: 1150 + 60 * u, y: 470, z: 1.15 }, t, (q) => {
      for (const [x, f, c, hh, look] of [[700, 1, GREY, 440, 1], [920, -1, { hood: '#c94f7c', hoodDk: '#9a3a5f', pants: '#2b3047' }, 300, 1], [1500, -1, { hood: '#ef8a3a', hoodDk: '#c06a2a', pants: '#2b3047' }, 450, 0]]) {
        drawStick(q, { x: x + (look ? 0 : -160 * u), y: 905, h: hh, f, col: c, p: hh < 350 ? pose(POSES.pointUp) : look ? pose(POSES.relaxed) : walk(t * 1.5), t, eyes: { ly: -0.8, lx: f * 0.3 }, mouth: hh < 350 ? 'open' : 'o', rim: 1 });
      }
    }, { beforeBack: (q) => billboardPanel(q, t) });
  },
  /* ---------- the final ---------- */
  finalWide(g, t, sh) {
    const u = U(t, sh);
    drawSet(g, 'arena', { x: 960, y: 560, z: 1.0 + 0.14 * eIO(u) }, t, (q) => {
      arenaScreen(q, t, 'final'); spot(q, 960, 120, 1000, 30, 260, 0.85);
      coach(q, t, { x: 330, y: 960, h: 440, p: pose(POSES.crossed), eyes: { lx: 0.4 }, brow: 0.3 });
      drawStick(q, { x: 1560, y: 960, h: 440, f: -1, col: RIVAL, p: pose(POSES.crossed), t, eyes: { open: 0.6, lx: 0.4 }, brow: -0.6, mouth: 'smirk', rim: -1, blink: blinkAt(t, 9) });
      const walkIn = cl((t - sh.t0) / 1.4), x = lerp(640, 960, eOut(walkIn));
      if (walkIn < 1) { hero(q, t, { x, y: 975, h: 420, p: walk(t * 2), eyes: { lx: 0.3 }, brow: -0.3 }); drawBar(q, 960, 975 - 80, 0.42, 0); }
      else liftHero(q, t, 960, 975, 420, 0, { eyes: { ly: 0.2 }, brow: -0.5 });
    });
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(6,4,14,0.25)'; g.fillRect(0, 0, W, H);
  },
  /* ---------- outside: Maya under the scaffold ---------- */
  outside(g, t, sh) {
    drawSet(g, 'arenaOut', { x: 900, y: 600, z: 1.15 }, t, (q) => {
      scaffoldTower(q, SCAF.x, SCAF.y, SCAF.s, leanDeg(t), t);
      scaffoldWorkers(q, t);
      const wk = cl((t - sh.t0) / 2.4), mx = lerp(560, 900, eOut(wk));
      maya(q, t, { x: mx, y: 940, h: 400, f: 1, rim: -1, p: wk < 1 ? mixPose(walk(t * 1.8), pose(POSES.phone), 0.6) : pose(POSES.phone), mouth: 'smile', eyes: { lx: 0.5, ly: 0.3 } });
    });
  },
  bolt(g, t, sh) {
    const L = leanDeg(t), p = scaffoldPt(SCAF.x, SCAF.y, SCAF.s, L, 0.2);
    drawSet(g, 'arenaOut', { x: p[0] + 20, y: p[1] - 20, z: 3.0, shake: t > T.bolt ? 0.25 : 0 }, t, (q) => {
      scaffoldTower(q, SCAF.x, SCAF.y, SCAF.s, L, t, { clamp: t < T.bolt });
      if (t >= T.bolt) { const u = t - T.bolt; q.fillStyle = '#5a6068'; q.save(); q.translate(p[0] - 300 * u, p[1] - 22 + 400 * u * u); q.rotate(u * 14); rr(q, -14, -15, 28, 30, 5); q.fill(); q.fillStyle = '#9aa0a8'; q.fillRect(-4, -34, 8, 22); q.restore();
        if (u < 0.4) for (let i = 0; i < 14; i++) { const a = hash(i) * Math.PI * 2, v = 200 + hash(i * 3) * 300; q.fillStyle = '#ffd27a'; q.fillRect(p[0] + Math.cos(a) * v * u, p[1] - 10 + Math.sin(a) * v * u + 300 * u * u, 4, 4); } }
    }, { farBlur: 8 });
  },
  worker(g, t, sh) {
    const L = leanDeg(t);
    drawSet(g, 'arenaOut', { x: 1100, y: 240, z: 1.3, rot: 0.06, shake: 0.12 }, t, (q) => {
      scaffoldTower(q, SCAF.x, SCAF.y, SCAF.s, L, t, { clamp: false });
      scaffoldWorkers(q, t, true);
    });
  },
  maya(g, t, sh) {
    drawSet(g, 'arena', { x: 1000, y: 720, z: 2.4 }, t, (q) => { spot(q, 960, 120, 1000, 30, 260, 0.85); liftHero(q, t, 960, 975, 420, 0, { eyes: { wide: 1, lx: -1 }, brow: 1, turn: true, blink: false }); });
  },
  arms(g, t, sh) {
    setBlur(g, 'arena', { x: 960, y: 700, z: 1.8 }, t, 0.35);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const pulse = sm(t, Wd('n_cost', 'snap'), Wd('n_cost', 'snap') + 0.3);
    drawBar(g, 960, 760, 1.6, 0);
    for (const [x, r] of [[720, -0.08], [1200, 0.08]]) { sleeve(g, [x + r * 600, -80], [x, 700], PAL.hero, 120); fist(g, x, 760, 70); }
    g.globalAlpha = 0.55 + 0.35 * sm(t, sh.t0, sh.t0 + 0.6); for (const [x, r] of [[720, -0.08], [1200, 0.08]]) xrayArm(g, x + r * 300, 380, 0.55, r, pulse, t, { snap: pulse > 0.5 }); g.globalAlpha = 1;
  },
  coach(g, t, sh) {
    drawSet(g, 'arena', { x: 470, y: 640, z: 2.0 }, t, (q) => coach(q, t, { x: 400, y: 960, h: 470, p: pose(POSES.shout), eyes: { wide: 0.6, lx: 0.5 }, brow: -1 }));
  },
  release(g, t, sh) {
    setBlur(g, 'arena', { x: 960, y: 700, z: 1.8 }, t, 0.35);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const u = t - T.letGo, drop = u > 0 ? 900 * u * u : 0;
    drawBar(g, 960, 760 + drop, 1.6, 0);
    const open = sm(t, T.letGo - 0.15, T.letGo + 0.05);
    for (const [x, r] of [[720, -0.08], [1200, 0.08]]) { sleeve(g, [x + r * 600, -80], [x, 700 - open * 60], PAL.hero, 120); fist(g, x, 760 - open * 70, 70);
      if (open > 0.5) { g.strokeStyle = PAL.ink; g.lineWidth = 36; g.lineCap = 'round'; for (const dx of [-45, -15, 15, 45]) { g.beginPath(); g.moveTo(x + dx, 700); g.lineTo(x + dx * 1.3, 650); g.stroke(); } } }
  },
  run(g, t, sh) {
    const u = U(t, sh), hx = lerp(420, 775, eIn(u) * 0.3 + u * 0.7);
    drawSet(g, 'arenaOut', { x: hx + 120, y: 600, z: 1.2 }, t, (q) => {
      scaffoldTower(q, SCAF.x, SCAF.y, SCAF.s, leanDeg(t), t, { clamp: false });
      maya(q, t, { x: 950, y: 940, h: 380, f: -1, p: pose(POSES.cower), eyes: { wide: 1, ly: -0.6 }, brow: 1, mouth: 'open', talk: 0 });
      hero(q, t, { x: hx, y: 940, h: 430, p: runP(t), eyes: { wide: 0.6, ly: -0.4 }, brow: -0.8, mouth: 'grit', talk: 0 });
    });
    speedLines(g, t, 0.8, -1);
  },
  catch(g, t, sh) {
    const u = t - T.catch;
    drawSet(g, 'arenaOut', { x: 900, y: 560, z: 1.18, shake: Math.max(0, 1 - u * 1.6) }, t, (q) => {
      catchPose(q, t, u);
    });
    if (u < 0.32) xrayCatch(g, t, u);
  },
  still(g, t, sh) {
    const u = U(t, sh);
    drawSet(g, 'arenaOut', { x: 900, y: 540, z: 1.0 + 0.05 * u }, t, (q) => {
      catchPose(q, t, 2);
      drawStick(q, { x: 1500, y: 950, h: 400, f: -1, col: WORKER, hardhat: true, vest: true, p: pose(POSES.handsUp), t, eyes: { wide: 0.8, lx: -0.6 }, mouth: 'o', rim: -1 });
      drawStick(q, { x: 1700, y: 950, h: 390, f: -1, col: GREY, p: pose(POSES.surprised), t, eyes: { wide: 0.8, lx: -0.6 }, mouth: 'o', rim: -1 });
      dust(q, t - T.catch, 900, 950, 10, 1 - u * 0.7);
    });
  },
  /* ---------- home, night ---------- */
  tv(g, t, sh) {
    setBlur(g, 'living', { x: 900, y: 560, z: 1.2 }, t, 0.55);
    const z = 1.0 + 0.05 * U(t, sh); g.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z));
    box(g, 230, 110, 1460, 860, '#0c0c12', { r: 22 }); tvBroadcast(g, 260, 140, 1400, 800, t);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; glow(g, W / 2, H / 2, 900, 'rgba(80,120,220,0.18)'); g.globalCompositeOperation = 'source-over';
  },
  sofa(g, t, sh) {
    drawSet(g, 'living', { x: 940, y: 640, z: 1.25 }, t, (q) => sofaPair(q, t, 'sofa'));
    tvLight(g, t);
  },
  jarAsk(g, t, sh) {
    drawSet(g, 'living', { x: 860, y: 680, z: 2.0 }, t, (q) => sofaPair(q, t, 'ask'));
    tvLight(g, t);
  },
  end(g, t, sh) {
    const u = cl((t - sh.t0) / 4);
    drawSet(g, 'living', { x: 950, y: 640, z: 1.3 + 0.08 * u }, t, (q) => sofaPair(q, t, 'end'));
    tvLight(g, t);
  },
};

/* ---------- scene helpers ---------- */
function lightboxXray(q, t) { q.save(); rr(q, 254, 224, 472, 332, 6); q.clip(); vgrad(q, 254, 224, 472, 332, [[0, '#e8f4ff'], [1, '#bcd8f0']]); q.fillStyle = 'rgba(10,30,60,0.85)'; q.fillRect(254, 224, 472, 332); xrayArm(q, 490, 390, 0.36, Math.PI / 2, 1, t); q.restore(); q.globalCompositeOperation = 'lighter'; glow(q, 490, 390, 330, 'rgba(160,210,255,0.25)'); q.globalCompositeOperation = 'source-over'; }
function docScene(q, t, close) {
  doctor(q, t, { x: close ? 300 : 180, y: 960, h: 500, f: 1, p: close ? pose({ lSh: 0.5, lEl: 1.4, rSh: 0.9, rEl: 0.6, tilt: -0.05 }) : pose(POSES.point), eyes: { lx: close ? 0.6 : -0.2 }, brow: 0.2 });
  const grip = close && t > T.bend - 0.6;
  hero(q, t, { x: 860, y: 905, h: 470, f: -1, rim: 1, p: pose(grip ? { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.2, lEl: 0.4, rSh: -0.15, rEl: 0.3, lean: 0.05 } : POSES.sitHands), eyes: { lx: -0.5, wide: close ? 0.3 : 0 }, brow: close ? 0.9 : 0.4, mouth: close ? 'sad' : 'flat' });
  maya(q, t, { x: 1330, y: 950, h: 420, f: -1, p: pose(POSES.sitStool), eyes: { lx: -0.5, ly: 0.3 }, mouth: 'flat', brow: 0.3 });
}
// you lifting: u 0 (bar on the floor, gripped) … 0.5 (racked) … 1 (overhead)
function liftHero(q, t, x, y, h, u, o = {}) {
  const P = u < 0.5 ? mixPose(pose(POSES.crouchGrip), pose(POSES.rackPos), eIO(u / 0.5)) : mixPose(pose(POSES.rackPos), pose(POSES.overhead), eIO((u - 0.5) / 0.5));
  if (o.turn) { P.tilt = -0.15; }
  const H1 = hero(q, t, Object.assign({ x, y, h, p: P }, o, o.turn ? { f: 1 } : {}));
  const bx = (H1.lHand[0] + H1.rHand[0]) / 2, by = (H1.lHand[1] + H1.rHand[1]) / 2;
  drawBar(q, bx, by, h / 1000, u > 0.9 ? Math.sin(t * 5) * 0.3 : 0);
  // hands over the bar
  fist(q, H1.rHand[0], H1.rHand[1], 0.03 * h);
  return H1;
}
function arenaScreen(q, t, mode) {
  q.save(); q.translate(0, 0); const x = 660, y = 170, w = 600, h = 180;
  vgrad(q, x, y, w, h, [[0, '#14254a'], [1, '#0a1428']]);
  if (mode === 'lifting') { txt(q, 'CLEAN & JERK', x + w / 2, y + 60, `600 28px ${SANS}`, '#9fb6dc'); txt(q, '570 kg', x + w / 2, y + 150, `700 84px ${SERIF}`, '#ffffff'); }
  if (mode === 'record') { txt(q, 'CLEAN & JERK', x + w / 2, y + 52, `600 26px ${SANS}`, '#ffffff'); txt(q, '570 kg', x + w / 2, y + 132, `700 80px ${SERIF}`, '#ffffff'); txt(q, 'OLD RECORD · 267 kg', x + w / 2, y + 168, `600 22px ${SANS}`, PAL.amber); }
  if (mode === 'wr') { const fl = Math.sin(t * 10) > 0; vgrad(q, x, y, w, h, [[0, fl ? '#c0392b' : '#8a1f1a'], [1, '#4a0f0c']]); txt(q, 'WORLD RECORD', x + w / 2, y + 120, `700 76px ${COND}`, '#ffffff'); }
  if (mode === 'final') { txt(q, 'OLYMPIC FINAL · LAST LIFT', x + w / 2, y + 62, `600 28px ${SANS}`, '#ffffff'); txt(q, 'FOR GOLD', x + w / 2, y + 150, `700 84px ${SERIF}`, '#f2c230'); }
  q.globalCompositeOperation = 'lighter'; glow(q, x + w / 2, y + h / 2, 420, 'rgba(90,140,255,0.22)'); q.globalCompositeOperation = 'source-over';
  q.restore();
}
function billboardPanel(q, t) {
  const x = 1060, y = 110, w = 760, h = 380;
  q.fillStyle = '#2b2e38'; q.fillRect(x + 120, y + h, 22, 500); q.fillRect(x + w - 140, y + h, 22, 500);
  box(q, x - 14, y - 14, w + 28, h + 28, '#22242e', { r: 6 });
  vgrad(q, x, y, w, h, [[0, '#1b1440'], [1, '#c0563f']]);
  q.globalCompositeOperation = 'lighter'; glow(q, x + 210, y + 200, 260, 'rgba(255,200,140,0.45)'); q.globalCompositeOperation = 'source-over';
  drawStick(q, { x: x + 210, y: y + h - 20, h: 300, f: 1, col: HERO, p: pose(POSES.overhead), mouth: 'smile', rim: 1, shadow: false });
  drawBar(q, x + 210, y + h - 20 - 300 * 1.04, 0.3, 0);
  txt(q, 'GLASS', x + 520, y + 150, `700 92px ${SERIF}`, '#ffffff'); txt(q, 'HERCULES', x + 520, y + 240, `700 92px ${SERIF}`, '#ffffff');
  txt(q, '570 KG · WORLD RECORD', x + 520, y + 300, `600 26px ${SANS}`, PAL.amber);
  for (let i = 0; i < 4; i++) { q.fillStyle = '#ffe9b8'; q.beginPath(); q.arc(x + 80 + i * 200, y - 30, 8, 0, Math.PI * 2); q.fill(); }
}
function scaffoldWorkers(q, t, shout) {
  const L = leanDeg(t), a = -L * Math.PI / 180, top = (k) => { const lx = 60 + k * 120, ly = -820; return [SCAF.x + lx * Math.cos(a) - ly * Math.sin(a), SCAF.y + lx * Math.sin(a) + ly * Math.cos(a)]; };
  const p1 = top(0.6);
  q.save(); q.translate(p1[0], p1[1]); q.rotate(a * 0.6);
  worker(q, t, { x: 0, y: 0, h: 240, f: -1, p: shout ? pose(POSES.shout) : pose({ rSh: 1.0, rEl: 0.8 }), eyes: { wide: shout ? 0.9 : 0, lx: -0.5, ly: shout ? 0.6 : 0 }, brow: shout ? 1 : 0, mouth: shout ? 'open' : 'flat' });
  q.restore();
}
function catchPose(q, t, u) {
  const L = leanDeg(t), hp = scaffoldPt(SCAF.x, SCAF.y, SCAF.s, L, cl(520 / (820 * Math.cos(L * Math.PI / 180)), 0, 1));
  scaffoldTower(q, SCAF.x, SCAF.y, SCAF.s, L, t, { clamp: false });
  maya(q, t, { x: 950, y: 940, h: 380, f: -1, p: u > 1 ? pose({ lean: 0.1, lSh: 0.4, lEl: 0.6, rSh: 0.3, rEl: 0.7, lHip: 0.6, lKn: 1.1, rHip: 0.5, rKn: 1.0, tilt: -0.5 }) : pose(POSES.cower), eyes: { wide: 1, ly: -0.6, lx: -0.6 }, brow: 1, mouth: u > 1 ? 'o' : 'open', talk: 0 });
  const tr = noise(t * 30, 2) * 0.05;
  hero(q, t, { x: hp[0] + 30, y: 940, h: 430, p: pose(Object.assign({}, POSES.catch, { lSh: 2.75 + tr, rSh: 2.55 - tr })), eyes: { open: 0.5, ly: -0.3 }, brow: 1, mouth: 'grit', sweat: (t * 0.8) % 1, talk: 0 });
}
function xrayCatch(g, t, u) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const a = u < 0.22 ? 1 : 1 - (u - 0.22) / 0.1;
  g.globalAlpha = a; g.fillStyle = '#06162c'; g.fillRect(0, 0, W, H);
  xrayArm(g, 760, 560, 0.85, -0.3, 1, t, { snap: true }); xrayArm(g, 1160, 560, 0.85, 0.3, 1, t, { snap: true });
  g.globalAlpha = 1;
}
function sofaPair(q, t, mode) {
  const lean = t > Wd('s_thanks', 'thank') - 0.5, offer = mode === 'ask' || (mode === 'end' && t < T.pop - 0.4);
  const H1 = hero(q, t, { x: 820, y: 985, h: 430, f: 1, casts: true, rim: -1, rimCol: '#8fb0ff', p: pose(offer ? POSES.sitOffer : POSES.sitCasts), eyes: { lx: 0.5, open: mode === 'sofa' && !lean ? 0.8 : 1 }, brow: mode === 'sofa' ? 0.4 : 0, mouth: mode === 'end' ? 'smile' : 'flat' });
  const mx = lean && mode === 'sofa' ? 1000 : 1080;
  const laugh = mode === 'end';
  const M = maya(q, t, { x: mx, y: 985, h: 400, f: -1, rim: 1, rimCol: '#ffcf8a', p: pose(lean && mode === 'sofa' ? POSES.sitLean : laugh ? (t > T.pop - 0.6 ? POSES.sitOffer : POSES.sitHands) : POSES.sitHands), eyes: { open: laugh ? 0.3 : 1, lx: 0.5 }, mouth: laugh ? 'smile' : 'flat', brow: lean ? 0.4 : -0.2, blush: lean });
  // the jar: in your cast hands, then hers; it opens with a pop
  if (mode !== 'sofa') {
    const her = mode === 'end' && t > T.pop - 0.6;
    const hx = her ? (M.lHand[0] + M.rHand[0]) / 2 : (H1.lHand[0] + H1.rHand[0]) / 2, hy = (her ? (M.lHand[1] + M.rHand[1]) / 2 : (H1.lHand[1] + H1.rHand[1]) / 2) + 30;
    const opened = t > T.pop;
    drawJar(q, hx, hy, 0.9, false); drawLid(q, hx + (opened ? 30 : 0), hy - 92 * 0.9 - 14 * 0.9 - (opened ? 40 : 0), 0.9, false, opened ? 0.4 : 0);
  }
}
function tvLight(g, t) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; const f = 0.12 + 0.06 * Math.abs(noise(t * 4, 9)); const gr = g.createLinearGradient(0, 0, W * 0.6, 0); gr.addColorStop(0, `rgba(80,120,230,${f})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }

const FILM2 = {
  duration: SBT.duration,
  draw(g, t) { const sh = shotAt(t); FILM2._shot = sh; g.save(); DRAW[sh.id](g, t, sh); g.restore(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; },
  post(t) {
    const sh = shotAt(t); let fade = 0, flash = 0;
    if (t < 0.25) fade = 1 - t / 0.25;
    if (t > SBT.duration - 1.0) fade = Math.max(fade, sm(t, SBT.duration - 1.0, SBT.duration - 0.1));
    if (sh.id === 'bedSlap' && t > T.slap) flash = Math.max(0, 0.6 - (t - T.slap) * 3);
    if (sh.id === 'jar' && t > T.lid) flash = Math.max(0, 0.4 - (t - T.lid) * 2);
    if (sh.id === 'run') flash = Math.max(0, sm(t, T.catch - 0.12, T.catch) * 0.9);
    if (sh.id === 'catch') flash = Math.max(0, 0.9 - (t - T.catch) * 14);
    if (sh.id === 'still') fade = Math.max(fade, 1 - sm(t, sh.t0, sh.t0 + 0.5));
    if (sh.id === 'tv') fade = Math.max(fade, 1 - sm(t, sh.t0, sh.t0 + 0.6));
    const warm = ['bedWide', 'bedSlap', 'mug', 'heroCU', 'ow', 'jar', 'title', 'gymWide', 'gymCU', 'egg'].includes(sh.id);
    const night = ['tv', 'sofa', 'jarAsk', 'end'].includes(sh.id);
    const P = { fade, flash, vignette: night ? 0.7 : 0.55, bloom: ['jar', 'mug', 'heroCU', 'ow'].includes(sh.id) ? 0.2 : night ? 0.6 : 0.42 };
    if (warm) { P.wash = ['rgba(255,200,140,1)', 'rgba(120,80,160,1)']; P.washA = 0.18; }
    else if (night) { P.wash = ['rgba(80,100,200,1)', 'rgba(255,170,110,1)']; P.washA = 0.2; }
    else { P.wash = ['rgba(150,120,220,1)', 'rgba(255,160,100,1)']; P.washA = 0.16; }
    return P;
  },
};
