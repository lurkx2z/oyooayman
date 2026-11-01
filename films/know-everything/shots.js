/* =====================================================================
   SHOTS — the edit of "What if you suddenly knew everything?", placed on the voices' word times (window.KET from
   build-timing.cjs). One week, Tuesday to Sunday, told by the narrator. About 85 shots of ~4 s.
   Cast: you (teal hoodie), Maya your sister (yellow, ponytail), Mom (red cardigan, bun), the maths teacher (glasses,
   tie), a classmate, Emma, the physicist (white coat), the news anchor, the agent (black suit, earpiece).
   ===================================================================== */

const S = (id) => KET.clips[id].start, E = (id) => KET.clips[id].end;
function Wd(id, w, n = 0) {
  // exact word first ("a" must not match "are"); a prefix only when no exact word exists ("what" → "what's")
  const N = (x) => x.w.toLowerCase().replace(/[^a-z0-9']/g, ''), q = w.toLowerCase();
  let L = KET.clips[id].words.filter((x) => N(x).replace(/'s$/, '') === q);
  if (!L.length) L = KET.clips[id].words.filter((x) => N(x).startsWith(q));
  if (!L[n]) throw new Error(`word "${w}" not in ${id}`); return L[n].s;
}
const T = {};
T.eyes = Wd('n_wake', 'open'); T.know = Wd('n_wake', 'everything');
T.spider = Wd('n_room', 'spider'); T.dust = Wd('n_room', 'dust'); T.buzz = Wd('n_room', 'now');
T.num = Wd('n_toast', 'number'); T.n94 = Wd('n_toast', 'ninety');
T.pop = E('m_what') + 0.55;
T.read = Wd('n_maya', 'read');
T.bh0 = Wd('n_hole', 'collapse') - 0.3; T.bh1 = Wd('n_hole', 'yours');
T.dice = Wd('n_dice', 'dice') - 0.6;
T.kick = Wd('n_dice', 'kicks') + 0.1; T.binLand = Wd('n_dice', 'bin') + 0.05;
T.next = Wd('n_mirror', 'next'); T.q = Wd('n_mirror', 'question') - 0.2;
T.fill0 = Wd('n_test', 'you') - 0.1; T.fill1 = Wd('n_test', 'seconds') + 0.2; T.down = E('n_test') + 0.15;
T.dig0 = Wd('n_dig', 'start'); T.clunk = S('n_tin') - 0.05; T.open = Wd('n_tin', 'inside');
T.views = Wd('n_viral', 'million');
T.write0 = Wd('n_marker', 'write'); T.write1 = Wd('n_marker', 'seconds') + 0.6; T.sit = Wd('n_marker', 'sits') - 0.2; T.cry = Wd('n_marker', 'cry') - 0.4;
T.unwrap = S('y_wow') - 0.7;
T.carIn = Wd('n_car', 'black') - 0.6; T.carStop = Wd('n_car', 'stops') + 0.5;
T.c1 = Wd('n_odds', 'run'); T.c2 = Wd('n_odds', 'hide'); T.c3 = Wd('n_odds', 'go'); T.c4 = Wd('n_forget', 'way');
T.n99 = Wd('n_comp', 'ninety');
T.qBig = Wd('n_first2', 'you');
T.mid = E('n_first2') + 6.2;   // the clock reaches midnight in the silence
T.dark = S('n_sun') - 2.0;     // the fade to black before Sunday
T.pop2 = Wd('n_burn', 'burns') - 0.1;
T.good = S('s_good') - 0.2;

const SHOTS = [
  // Tuesday morning
  ['bedWide', T.eyes - 0.25], ['faceCU', T.know - 0.2], ['roomBurst', Wd('n_room', 'the') - 0.25], ['spiderShot', Wd('n_room', 'there') - 0.3],
  ['sunbeam', Wd('n_room', 'and') - 0.3], ['phone', S('n_toast') - 0.25],
  ['kitWide', Wd('n_toast', 'above') - 0.3], ['toasterTag', S('y_toast') - 0.3], ['youToast', S('m_what') - 0.15], ['momPop', S('n_maya') - 0.2],
  ['mayaText', Wd('n_maya', 'over') - 0.3], ['mayaSecret', S('y_party') - 0.25], ['party', S('m_party') - 0.15], ['momParty', S('s_kill') - 0.12],
  ['kill', S('n_lesson') - 0.2], ['lesson', S('n_title2') - 0.3],
  ['title', S('n_walk') - 0.3],
  // the rules, on the walk to school
  ['walkWide', Wd('n_walk', 'every') - 0.3], ['walkTags', Wd('n_walk', 'where') - 0.3], ['stranger', S('n_space') - 0.25],
  ['earth', Wd('n_space', 'you') - 0.2], ['moon', Wd('n_space', 'what', 1) - 0.2], ['sunCore', Wd('n_space', 'what', 2) - 0.2], ['edge', S('n_hole') - 0.25],
  ['holeTalk', Wd('n_hole', 'squeeze') - 0.3], ['hole', T.bh1 - 0.05], ['holeGone', S('n_dice') - 0.25],
  ['oddsStreet', Wd('n_dice', 'deep') - 0.3], ['diceRoll', Wd('n_dice', 'a', 0) - 0.3], ['kick', S('n_mirror') - 0.2],
  ['thinkWalk', Wd('n_mirror', 'everyone') - 0.3], ['nextMoves', Wd('n_mirror', 'then') - 0.3], ['shopWin', Wd('n_mirror', 'over', 1) - 0.3], ['shopQ', S('n_test') - 0.35],
  // school
  ['classWide', Wd('n_test', 'you') - 0.3], ['paperFast', T.down], ['pencilDown', S('y_seven') - 0.2], ['seven', E('y_seven') + 0.25],
  ['keyWrong', Wd('n_lunch', 'by') - 0.25], ['hallway', S('y_ask') - 0.25], ['emma', S('n_dig') - 0.35],
  // the backyard
  ['yardWide', Wd('n_dig', 'you', 1) - 0.3], ['yardTag', Wd('n_dig', 'you', 2) - 0.3], ['dig', T.clunk - 0.2], ['clunk', T.open - 0.3],
  ['tinOpen', S('s_real') - 0.3], ['real', S('n_viral') - 0.25], ['viral', S('n_wed') - 0.3],
  // Wednesday to Friday
  ['vans', S('a_news') - 0.25], ['news', S('n_thu') - 0.3], ['labWide', Wd('n_thu', 'a', 1) - 0.25], ['labQ', S('n_marker') - 0.15],
  ['write', Wd('n_marker', 'she') - 0.3], ['reads', S('p_simple') - 0.2], ['simple', S('n_fri') - 0.25], ['papers', Wd('n_fri', 'you\'re') - 0.25], ['covers', S('n_price') - 0.25],
  // the price
  ['priceSofa', Wd('n_price', 'every') - 0.3], ['joke', Wd('n_price', 'every', 1) - 0.25], ['movie', Wd('n_price', 'that') - 0.3],
  ['giftIn', Wd('n_price', 'and', 0) - 0.3], ['giftTag', S('s_open') - 0.2], ['unwrap', S('s_knew') - 0.25], ['knew', S('s_any') - 0.2], ['any', S('n_night') - 0.3],
  ['night1', Wd('n_night', 'every') - 0.3], ['night2', Wd('n_night', 'you') - 0.3], ['night3', S('n_car') - 0.3],
  // Saturday night
  ['carArrive', S('g_codes') - 0.35], ['door', S('g_tonight') - 0.2], ['agentCU', S('n_know') - 0.25], ['agentTags', Wd('n_know', 'and', 1) - 0.25], ['carDoor', S('n_odds') - 0.3],
  // the choice
  ['odds1', Wd('n_odds', 'hide') - 0.3], ['odds2', S('n_forget') - 0.25], ['forget', Wd('n_forget', 'including') - 0.3], ['forget2', S('n_comp') - 0.25],
  ['laptop', S('n_first2') - 0.3], ['firstQ', E('n_first2') + 0.6], ['silenceA', E('n_first2') + 4.6], ['silenceB', T.dark + 0.6], ['black', S('n_sun') - 1.0],
  // Sunday
  ['sunday', Wd('n_sun', 'the') - 0.3], ['ceiling', S('n_burn') - 0.2], ['toast2', Wd('n_burn', 'and') - 0.3], ['laugh', S('s_hand') - 0.25],
  ['hand', S('y_idea') - 0.2], ['good', S('n_gone') - 0.3], ['gone', S('n_note') - 0.3], ['pillow', S('n_cta2') - 0.4], ['cta', 1e9],
].reduce((acc, [id, t1]) => { acc.push({ id, t0: acc.length ? acc[acc.length - 1].t1 : -1, t1 }); return acc; }, []);
const shotAt = (t) => SHOTS.find((s) => t < s.t1) || SHOTS[SHOTS.length - 1];
const U = (t, sh) => cl((t - sh.t0) / (Math.min(sh.t1, KET.duration) - sh.t0));

/* ---------- the cast ---------- */
const blinkAt = (t, seed) => { const p = 3.1 + hash(seed) * 1.7, ph = (t + hash(seed + 9) * 3) % p; return ph < 0.12; };
const walk = (t, sp = 4) => mixPose(pose(POSES.walk1), pose(POSES.walk2), 0.5 + 0.5 * Math.sin(t * sp));
function hero(g, t, o) { return drawStick(g, Object.assign({ f: 1, col: HERO, rim: 1, t, blink: blinkAt(t, 1), talk: talkAt(t, 'y') }, o)); }
function maya(g, t, o) { return drawStick(g, Object.assign({ f: -1, col: SIS, pony: true, rim: -1, t, blink: blinkAt(t, 2), talk: talkAt(t, 's') }, o)); }
function mom(g, t, o) { return drawStick(g, Object.assign({ f: -1, col: MOM, sweater: true, cardigan: true, bun: true, shirt: '#f2e6da', rim: 1, t, blink: blinkAt(t, 3), talk: talkAt(t, 'm') }, o)); }
function teacher(g, t, o) { return drawStick(g, Object.assign({ f: 1, col: TEACH, sweater: true, tie: '#8a2c27', glasses: true, short: true, rim: 1, t, blink: blinkAt(t, 4), talk: talkAt(t, 't') }, o)); }
function physicist(g, t, o) { return drawStick(g, Object.assign({ f: 1, col: PHYS, coat: true, glasses: true, bob: true, rim: 1, t, blink: blinkAt(t, 5), talk: talkAt(t, 'p') }, o)); }
function agent(g, t, o) { return drawStick(g, Object.assign({ f: -1, col: AGENT, coat: '#1d1f29', short: true, tie: '#0b0c10', earpiece: true, rim: 1, rimCol: '#9fc4ff', t, blink: blinkAt(t, 6), talk: talkAt(t, 'g') }, o)); }
function kid(g, t, o) { return drawStick(g, Object.assign({ f: 1, col: KID1, rim: 1, t, blink: blinkAt(t, 7 + (o.seed || 0)), talk: o.speaker ? talkAt(t, 'k') : 0 }, o)); }
const sleeve = (g, a, b, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
const fist = (g, x, y, r) => { g.fillStyle = PAL.ink; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.4, 0, Math.PI * 2); g.fill(); };
Object.assign(POSES, {
  sitBed: { lHip: 1.45, lKn: 0.1, rHip: 1.4, rKn: 0.1, lSh: 0.25, lEl: 0.5, rSh: 0.2, rEl: 0.6, lean: -0.05 },
  sitBedLook: { lHip: 1.45, lKn: 0.1, rHip: 1.4, rKn: 0.1, lSh: 0.5, lEl: 0.3, rSh: 0.45, rEl: 0.35, lean: -0.12, tilt: -0.25 },
  sitEdge: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 0.45, lEl: 1.2, rSh: 0.4, rEl: 1.3, lean: 0.18, tilt: 0.25 },
  handsHead: { lSh: 2.5, lEl: 2.3, rSh: 2.4, rEl: 2.35, tilt: -0.1, lean: -0.04 },
  shrug: { lSh: 0.35, lEl: -1.5, rSh: 0.3, rEl: 1.6, tilt: 0.15 },
  dig1: { lean: 0.42, lSh: 0.9, lEl: 0.3, rSh: 0.75, rEl: 0.45, lHip: 0.5, lKn: 0.7, rHip: -0.1, rKn: 0.4, tilt: 0.1 },
  dig2: { lean: 0.15, lSh: 1.5, lEl: 0.5, rSh: 1.3, rEl: 0.7, lHip: 0.3, lKn: 0.4, rHip: -0.2, rKn: 0.2, tilt: -0.05 },
  board: { lSh: 0.2, lEl: 0.3, rSh: 1.9, rEl: 0.5, tilt: -0.1 },
  laughBig: { lean: -0.18, lSh: 0.7, lEl: 1.9, rSh: 0.6, rEl: 2.0, tilt: -0.45 },
  behindBack: { lSh: -0.55, lEl: 0.6, rSh: -0.5, rEl: 0.7, tilt: 0.1 },
  offerOne: { lSh: 0.1, lEl: 0.2, rSh: 1.3, rEl: 0.3, tilt: 0.05 },
  clasp: { lSh: 0.35, lEl: 1.35, rSh: 0.3, rEl: 1.4 },
  kick: { lean: -0.12, lSh: -0.6, lEl: 0.5, rSh: 0.7, rEl: 0.4, lHip: 1.2, lKn: 0.2, rHip: -0.15, rKn: 0.15 },
  cry: { lean: 0.25, lSh: 1.5, lEl: 2.3, rSh: 1.4, rEl: 2.4, tilt: 0.45 },
  sitCry: { lHip: 1.45, lKn: 1.45, rHip: 1.35, rKn: 1.4, lSh: 1.4, lEl: 2.3, rSh: 1.3, rEl: 2.4, lean: 0.25, tilt: 0.45 },
  mic: { lSh: 0.2, lEl: 0.3, rSh: 1.1, rEl: 1.5 },
});

/* ---------- little scene helpers ---------- */
function clockFace(g, x, y, r, hh, mm, ss = 0, col = '#f7f2e8') {
  g.fillStyle = '#c0392b'; g.beginPath(); g.arc(x, y, r * 1.22, 0, Math.PI * 2); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2b2b33'; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, r * 0.05, 0, Math.PI * 2); g.fill(); }
  const hand = (a, L, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * L, y - Math.cos(a) * L); g.stroke(); };
  hand(((hh % 12) + mm / 60) / 12 * Math.PI * 2, r * 0.5, r * 0.11, '#2b2b33'); hand(mm / 60 * Math.PI * 2, r * 0.75, r * 0.07, '#2b2b33'); hand(ss / 60 * Math.PI * 2, r * 0.8, r * 0.03, '#e0483e');
  g.fillStyle = '#2b2b33'; g.beginPath(); g.arc(x, y, r * 0.07, 0, Math.PI * 2); g.fill();
}
// the duvet over a sleeper / someone sitting up in bed
function duvet(g, t, sitting) {
  const br = Math.sin(t * 1.6) * 4; const dg = g.createLinearGradient(0, 720, 0, 900); dg.addColorStop(0, '#6f93a8'); dg.addColorStop(1, '#3f5f73'); g.fillStyle = dg;
  g.beginPath();
  if (sitting) { g.moveTo(980, 900); g.quadraticCurveTo(990, 800, 1100, 792); g.quadraticCurveTo(1400, 760, 1600, 780); g.quadraticCurveTo(1900, 780, 1930, 900); }
  else { g.moveTo(1000, 860); g.quadraticCurveTo(1000, 760, 1110, 750 - br); g.quadraticCurveTo(1400, 700 - br, 1600, 760); g.quadraticCurveTo(1900, 770, 1930, 860); }
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 6; g.beginPath(); g.moveTo(1150, sitting ? 800 : 760); g.quadraticCurveTo(1300, sitting ? 830 : 800, 1420, sitting ? 790 : 740); g.stroke();
}
// your head on the pillow (sleeping / waking)
function bedHead(g, t, open, wide = 0, o = {}) {
  const R = 62, hx = 1040, hy = 700; const gr = g.createRadialGradient(hx + 20, hy - 30, 5, hx, hy, R); gr.addColorStop(0, '#3a3d55'); gr.addColorStop(1, '#0e0f18');
  g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, R, 0, Math.PI * 2); g.fill();
  face(g, [hx, hy], R, -1, { eyes: { open, wide, lx: o.lx ?? -0.3, ly: o.ly ?? 0 }, mouth: o.mouth || (open < 0.3 ? 'flat' : 'o'), brow: open < 0.3 ? undefined : (o.brow ?? 0.4), blink: o.blink }, {});
}
// the bedroom's live props: the spider, the alarm clock, the phone
function bedProps(q, t, o = {}) {
  q.strokeStyle = 'rgba(230,230,240,0.35)'; q.lineWidth = 1.5; for (let k = 0; k < 6; k++) { q.beginPath(); q.moveTo(2160, -135 + k * 30); q.lineTo(2160 - 180 + k * 30, -135); q.stroke(); }
  spider(q, 1760, 150, 1.1, t);
  alarmClock(q, 775, 800, 0.62, t, o.ring || 0);
  phoneOnStand(q, 838, 800, 0.7, t, o.buzz || 0, o.lit || 0);
}
const ROOMTAGS = [[1760, 150, 'Spider', '41 days old', -40, 110], [460, 520, 'Sunbeam', '2,041,377 specks of dust', 40, -40], [775, 740, 'Alarm', '7:00:06 a.m.', -30, -90], [1840, 380, 'Plant', 'needs water in 2 days', -40, -60],
  [1085, 355, 'Photo', 'Grand Canyon, 2019', -30, -90], [1255, 340, 'Photo', 'you and Maya, age 6', 30, -110], [850, 330, 'Poster', 'Saturn · 1.4 billion km', -40, -120], [1690, 400, 'Books', 'read 3 of 14', 30, 70],
  [730, 700, 'Lamp bulb', 'dies in 19 days', -40, 40], [300, 650, 'Curtain', '3 moth holes', 30, 60], [1250, 1100, 'Rug', '11,402 loose fibres', 40, -40], [1500, 620, 'Headboard', 'pine, felled 1987', 40, -60]];

const DRAW = {};
/* =========================== TUESDAY, 7 A.M. =========================== */
DRAW.bedWide = (g, t, sh) => {
  drawSet(g, 'bedroom', { x: 1130, y: 640, z: 1.12 + 0.07 * eIO(U(t, sh)) }, t, (q) => {
    bedProps(q, t, { ring: 1 }); bedHead(q, t, 0.08); duvet(q, t, false);
  });
};
DRAW.faceCU = (g, t, sh) => {
  const op = sm(t, T.eyes, T.eyes + 0.25), wide = sm(t, T.know - 0.6, T.know - 0.3);
  drawSet(g, 'bedroom', { x: 1000, y: 700, z: 3.1 + 0.25 * U(t, sh) }, t, (q) => {
    bedProps(q, t, { ring: t < T.eyes + 0.7 ? 1 : 0 });
    bedHead(q, t, 0.08 + 0.92 * op, wide * 0.8, { lx: -0.3 + Math.sin(t * 5) * 0.4 * sm(t, T.eyes + 0.5, T.eyes + 0.8), ly: -0.3, mouth: wide > 0.5 ? 'o' : 'flat', brow: 0.6 });
    duvet(q, t, false);
  });
};
DRAW.roomBurst = (g, t, sh) => {
  drawSet(g, 'bedroom', { x: 1060, y: 560, z: 1.03 - 0.04 * eOut(U(t, sh)) }, t, (q) => {
    bedProps(q, t);
    const look = Math.sin(t * 1.7) * 0.7;
    hero(q, t, { x: 1150, y: 905, h: 520, f: 1, rim: -1, p: pose(POSES.sitBedLook), eyes: { wide: 0.9, lx: look, ly: -0.5 }, mouth: 'o', brow: 0.7 });
    duvet(q, t, true);
    knowRing(q, 1150, 470, t, T.know, 1700);
    tagBurst(q, t, T.know + 0.2, ROOMTAGS, { step: 0.11, s: 0.82 });
  });
};
DRAW.spiderShot = (g, t, sh) => {
  drawSet(g, 'bedroom', { x: 1700, y: 270, z: 2.3 + 0.12 * U(t, sh) }, t, (q) => {
    bedProps(q, t);
    tag(q, 1760, 140, { t0: T.spider - 0.1, label: 'Spider · in the corner', value: '41 days old', dx: -330, dy: 40, s: 1.25 });
    tag(q, 1760, 140, { t0: T.spider + 0.9, label: 'Name', value: 'none (you checked)', dx: -330, dy: 170, s: 1.05 });
  });
};
DRAW.sunbeam = (g, t, sh) => {
  drawSet(g, 'bedroom', { x: 640, y: 640, z: 1.75 - 0.1 * U(t, sh) }, t, (q) => { bedProps(q, t); }, { after: (q) => {
    q.save(); q.beginPath(); q.moveTo(230, 240); q.lineTo(650, 240); q.lineTo(1500, 1150); q.lineTo(600, 1150); q.closePath(); q.clip(); motes(q, t, 230, 240, 1100, 900, 160, 5, 'rgba(255,236,200,0.85)'); q.restore();
    const n = Math.floor(2041377 * eOut(cl((t - T.dust) / 1.1))).toLocaleString('en-US');
    tag(q, 560, 560, { t0: T.dust - 0.2, label: 'Dust in this sunbeam', value: `${n} specks`, dx: 60, dy: -170, s: 1.3, type: false });
  } });
};
DRAW.phone = (g, t, sh) => {
  const buzz = t > T.buzz && t < T.buzz + 1.2 ? 1 : 0;
  drawSet(g, 'bedroom', { x: 820, y: 760, z: 3.0 }, t, (q) => {
    bedProps(q, t, { buzz, lit: t > T.buzz ? 1 : 0 });
    const left = Math.max(0, Math.ceil(T.buzz - t)), val = t < T.buzz ? `${left}…` : 'now';
    tag(q, 838, 792, { t0: Wd('n_room', 'phone') - 0.1, label: 'Maya texts you in', value: val, dx: 60, dy: -130, s: 1.3, type: false });
  });
  if (t > T.buzz + 0.2) { g.setTransform(1, 0, 0, 1, 0, 0); phoneMsg(g, 1440, 640, 0.95, 'Maya', 'MOM SAYS BREAKFAST!!', cl((t - T.buzz - 0.2) / 0.4)); }
};
/* ---------- the kitchen ---------- */
const TOAST = { x: 1325, y: 680 };
function kitToaster(q, t, o = {}) {
  const popped = t >= T.pop && t < S('n_maya') + 30; const u = t - T.pop;
  toaster(q, TOAST.x, TOAST.y, 1, t, popped ? u : -1, popped ? Math.max(0, u) : 0);
}
function kitchenCast(q, t, o = {}) {
  const pop = t >= T.pop;
  // Mom at the toaster (she turns to you when you speak)
  kitToaster(q, t);
  const momP = o.momP || (t > S('m_party') - 0.2 ? pose(POSES.point) : pop && t < S('n_maya') ? pose(POSES.surprised) : t > S('y_toast') + 0.3 ? pose(POSES.relaxed) : pose({ lSh: 0.6, lEl: 0.9, rSh: 0.7, rEl: 0.8 }));
  mom(q, t, { x: 1540, y: 1010, h: 560, p: momP, eyes: o.momEyes || { lx: t > S('y_toast') ? -0.6 : 0.4, ly: 0.2, wide: pop && t < S('n_maya') ? 0.7 : (t > S('m_party') - 0.2 ? 0.9 : 0) }, brow: t > S('m_party') - 0.2 ? -0.8 : pop ? 0.6 : undefined, mouth: t > S('m_party') - 0.2 ? 'open' : 'flat' });
  // Maya at the island, texting
  if (!o.noMaya) { const angry = t > S('m_party') - 0.1; maya(q, t, { x: 1010, y: 1010, h: 520, f: -1, p: angry ? pose(o.mayaP || POSES.crossed) : pose(POSES.phone), eyes: angry ? { lx: -0.6, open: 0.65 } : { lx: 0.2, ly: 0.7 }, brow: angry ? -0.9 : undefined, mouth: angry ? 'flat' : 'smile' });
    if (!angry) { q.fillStyle = '#0d0e14'; rr(q, 958, 640, 40, 66, 8); q.fill(); q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 978, 660, 80, 'rgba(150,200,255,0.5)'); q.restore(); } }
  // you
  if (!o.noYou) hero(q, t, { x: o.youX ?? 640, y: 1010, h: 560, f: 1, rim: -1, p: o.youP || pose(POSES.relaxed), eyes: o.youEyes || { lx: 0.4 }, mouth: o.youMouth || 'flat', brow: o.youBrow });
}
DRAW.kitWide = (g, t, sh) => {
  const u = U(t, sh);
  drawSet(g, 'kitchen', { x: 1000, y: 545, z: 1.06 + 0.04 * u }, t, (q) => {
    const x = lerp(260, 620, eOut(u * 1.3));
    kitchenCast(q, t, { youX: x, youP: u < 0.75 ? walk(t, 7) : pose(POSES.relaxed), youEyes: { lx: 0.5, ly: -0.2 } });
  });
};
DRAW.toasterTag = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 1380, y: 560, z: 2.0 + 0.15 * U(t, sh) }, t, (q) => {
    kitchenCast(q, t, { noYou: true, noMaya: true });
    const odds = Math.round(94 * sm(t, T.n94 - 0.7, T.n94 + 0.35));
    tag(q, TOAST.x, TOAST.y - 75, { t0: T.num - 0.15, kind: 'odds', label: 'Toast · burnt', odds, dx: -260, dy: -170, s: 1.35 });
  });
};
DRAW.youToast = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 700, y: 520, z: 1.95 }, t, (q) => {
    kitchenCast(q, t, { youP: pose(POSES.point), youEyes: { lx: 0.6, ly: 0.1 }, youBrow: 0.3 });
  });
};
DRAW.momPop = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 1330, y: 540, z: 1.65 }, t, (q) => {
    kitchenCast(q, t, { noYou: true });
    const odds = t < T.pop ? 94 : 100;
    tag(q, TOAST.x, TOAST.y - 75, { t0: sh.t0 - 1, kind: 'odds', label: t < T.pop ? 'Toast · burnt' : 'Toast · burnt (told you)', odds, dx: -100, dy: -260, s: 1.0 });
  });
};
DRAW.mayaText = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 1000, y: 520, z: 1.7 + 0.1 * U(t, sh) }, t, (q) => { kitchenCast(q, t); });
};
DRAW.mayaSecret = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 1010, y: 470, z: 2.15 + 0.15 * U(t, sh) }, t, (q) => {
    kitchenCast(q, t, { noYou: true });
    tag(q, 1000, 410, { t0: T.read - 0.1, label: 'Maya · last night', value: 'Jake\'s party', dx: 70, dy: -160, s: 1.25 });
    tag(q, 1000, 410, { t0: Wd('n_maya', 'wasn\'t') - 0.2, label: 'What she told Mom', value: '"at the library"', dx: -80, dy: -170, s: 1.1 });
  });
};
DRAW.party = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 690, y: 520, z: 2.05 }, t, (q) => {
    kitchenCast(q, t, { youP: pose({ lSh: 0.2, lEl: 0.4, rSh: 0.5, rEl: 1.6, tilt: -0.1 }), youEyes: { lx: 0.7, open: 0.8 }, youMouth: 'smirk', youBrow: -0.2 });
  });
};
DRAW.momParty = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 1330, y: 500, z: 2.0, shake: Math.max(0, 0.6 - (t - sh.t0) * 2) * 0.4 }, t, (q) => { kitchenCast(q, t, { noYou: true }); });
};
DRAW.kill = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 1000, y: 480, z: 2.3 }, t, (q) => {
    kitchenCast(q, t, { noYou: true });
    tag(q, 1000, 420, { t0: Wd('s_kill', 'kill') - 0.1, kind: 'odds', label: 'Maya · next · revenge', odds: 99, dx: 80, dy: -150, s: 1.15 });
  });
};
DRAW.lesson = (g, t, sh) => {
  const u = U(t, sh);
  drawSet(g, 'kitchen', { x: 980, y: 540, z: 1.06 + 0.06 * u }, t, (q) => {
    kitchenCast(q, t, { mayaP: Math.sin(t * 3) > 0 ? POSES.shrug : POSES.handsUp, youP: pose({ lSh: 0.3, lEl: 1.7, rSh: 0.25, rEl: 1.8, tilt: 0.2 }), youMouth: u < 0.4 ? 'smirk' : 'wavy', youEyes: { lx: 0.8, ly: 0.2 }, youBrow: u < 0.4 ? -0.2 : 0.8 });
    // Mom and Maya argue: sound-free mouths
  });
};
DRAW.title = (g, t, sh) => {
  const u = U(t, sh);
  drawSet(g, 'houseDay', { x: 960, y: 560, z: 1.0 + 0.05 * u }, t, (q) => {
    // you and Maya leave for school down the porch steps
    const k = eOut(cl(u * 1.2));
    hero(q, t, { x: lerp(860, 1250, k), y: lerp(880, 966, k), h: 330, f: 1, p: walk(t, 7), eyes: { lx: 0.4 } });
    maya(q, t, { x: lerp(780, 1130, k), y: lerp(880, 966, k), h: 315, f: 1, rim: 1, p: walk(t + 0.4, 7), eyes: { lx: 0.4 } });
    tag(q, 155, 790, { t0: sh.t0 + 0.6, label: 'Mail', value: '2 bills, 1 postcard', dx: 40, dy: -260, s: 0.75, a: 0.55 });
    tag(q, 1820, 530, { t0: sh.t0 + 0.9, label: 'Street lamp', value: 'on in 11 h 40 min', dx: -40, dy: 300, s: 0.75, a: 0.55 });
  });
};
/* =========================== THE RULES (the walk to school) =========================== */
const STREETTAGS = [[430, 430, 'Your house', 'built 1962', 30, -120], [866, 520, 'Street lamp', 'on in 11 h 40 min', 30, -80], [LX + 600, 700, 'Oak', '84 years old', 30, -140], [1700, 600, 'School clock', '2 minutes slow', -40, -100], [1980, 330, 'Cloud', '410 tonnes of water', -40, 80]];
function trafficLight(q, x, y, red) { q.fillStyle = '#2b2e38'; q.fillRect(x - 6, y - 330, 12, 330); box(q, x - 28, y - 440, 56, 130, '#1b1c24', { r: 10 }); for (const [k, c] of [[0, red ? '#ff4a3a' : '#4a1a1a'], [1, '#4a3a1a'], [2, red ? '#1a3a2a' : '#3aff8a']]) { q.fillStyle = c; q.beginPath(); q.arc(x, y - 418 + k * 40, 14, 0, Math.PI * 2); q.fill(); } }
function stranger(q, t, o) { return drawStick(q, Object.assign({ f: -1, col: GREY, coat: '#5a6070', tie: '#2f4a7a', short: true, rim: 1, t, blink: blinkAt(t, 12) }, o)); }
function walkers(q, t, x, o = {}) {
  hero(q, t, { x, y: 935, h: 430, f: 1, p: o.stop ? pose(o.youP || POSES.relaxed) : walk(t, 7), eyes: o.youEyes || { lx: Math.sin(t * 0.9) * 0.6, ly: -0.3 }, mouth: o.youMouth || 'flat', brow: o.youBrow });
  if (!o.noMaya) maya(q, t, { x: x + 150, y: 935, h: 410, f: o.mayaF || 1, rim: 1, p: o.stop ? pose(o.mayaP || POSES.phone) : walk(t + 0.4, 7), eyes: o.mayaEyes || { lx: 0.3, ly: 0.5 }, mouth: o.mayaMouth || 'flat', brow: o.mayaBrow });
}
DRAW.walkWide = (g, t, sh) => {
  const u = U(t, sh), x = lerp(520, 820, u);
  drawSet(g, 'street', { x: 900 + 150 * u, y: 600, z: 1.05 }, t, (q) => {
    walkers(q, t, x);
    tagBurst(q, t, sh.t0 + 0.3, STREETTAGS, { step: 0.25, s: 0.78, a: 0.8 });
  });
};
DRAW.walkTags = (g, t, sh) => {
  const u = U(t, sh), x = lerp(840, 1240, u), T1 = Wd('n_walk', 'car'), T2 = Wd('n_walk', 'bird'), T3 = Wd('n_walk', 'stranger');
  drawSet(g, 'street', { x: x + 230, y: 600, z: 1.12 }, t, (q) => {
    // a stranger walks toward you
    const sx = lerp(2050, 1700, u); stranger(q, t, { x: sx, y: 935, h: 440, p: walk(t + 1, 7), eyes: { lx: -0.2 } });
    walkers(q, t, x);
    // a bird crosses the sky
    const bx = lerp(700, 2200, cl((t - T2 + 1.2) / 3.5)), by = 300 + Math.sin(t * 2) * 20; bird(q, bx, by, 1.4, t, 1);
    tag(q, bx, by, { t0: T2 - 0.1, label: 'Pigeon · heading south', value: '41 km/h', dx: 40, dy: -90, s: 1 });
    tag(q, sx, 500, { t0: T3 - 0.1, label: 'Stranger · going to', value: 'a job interview', dx: -60, dy: -120, s: 1 });
  }, { after: (q) => {
    const cx = lerp(LX - 300, 2600, cl((t - T1 + 1.3) / 3.2)); car(q, cx, 1110, 1.05, '#f2c230', 1);
    tag(q, cx, 960, { t0: T1 - 0.15, label: 'Yellow car · going to', value: 'the dentist (late)', dx: 50, dy: -150, s: 1 });
  } });
};
DRAW.stranger = (g, t, sh) => {
  const W1 = Wd('n_walk', 'where'), W2 = Wd('n_walk', 'afraid');
  drawSet(g, 'street', { x: 1620, y: 560, z: 1.9 + 0.12 * U(t, sh) }, t, (q) => {
    const P = pose({ lSh: 0.2, lEl: 0.3, rSh: 0.9, rEl: 2.0, tilt: 0.25 });
    stranger(q, t, { x: 1640, y: 935, h: 450, p: P, eyes: { lx: 0.5, ly: 0.7 }, brow: 0.7, mouth: 'wavy', sweat: (t * 0.7) % 1 });
    q.fillStyle = '#3a2a22'; rr(q, 1560, 790, 70, 52, 6); q.fill();
    tag(q, 1640, 470, { t0: W1 - 0.1, label: 'Going to', value: 'a job interview, 9:30', dx: 70, dy: -120, s: 1.15 });
    tag(q, 1640, 470, { t0: W2 - 0.1, label: 'Afraid of', value: 'not getting it', dx: -80, dy: -140, s: 1.15 });
  });
};
/* ---------- the zoom out ---------- */
DRAW.earth = (g, t, sh) => {
  const u = U(t, sh); g.setTransform(1, 0, 0, 1, 0, 0); starfield(g, t, 3);
  const r = lerp(2600, 430, eOut(u)), x = lerp(960, 1080, u), y = lerp(1900, 560, eOut(u));
  planet(g, x, y + r * 0, r, '#7fb4e8', '#1f4f9a', { earth: true, atmo: true });
  const px = x - r * 0.22, py = y - r * 0.55; g.fillStyle = PAL.amber; g.beginPath(); g.arc(px, py, 6, 0, Math.PI * 2); g.fill();
  tag(g, px, py, { t0: sh.t0 + 0.4, label: 'Your street', value: 'you are here', dx: -60, dy: -120, s: 1.1 });
};
DRAW.moon = (g, t, sh) => {
  const u = U(t, sh); g.setTransform(1, 0, 0, 1, 0, 0); starfield(g, t, 4);
  const x = lerp(1060, 980, u), r = lerp(380, 430, u); planet(g, x, 560, r, '#d8d6d0', '#5d5b58', { craters: 7 });
  tag(g, x - r * 0.3, 560 - r * 0.2, { t0: Wd('n_space', 'far') - 0.1, label: 'Far side of the Moon', value: '1,846 craters you\'ve never seen', dx: -80, dy: -330, s: 1.15 });
};
DRAW.sunCore = (g, t, sh) => {
  const u = U(t, sh); g.setTransform(1, 0, 0, 1, 0, 0); starfield(g, t, 5);
  sun(g, 980, 560, lerp(360, 420, u), t, true);
  tag(g, 980, 560, { t0: Wd('n_space', 'heart') - 0.1, label: 'Heart of the Sun', value: '15,000,000 °C', dx: 120, dy: -330, s: 1.2 });
};
DRAW.edge = (g, t, sh) => {
  const u = U(t, sh); g.setTransform(1, 0, 0, 1, 0, 0);
  starfield(g, t, 6); galaxy(g, 960, 540, lerp(700, 120, eIO(u)), t, 0.4);
  cosmicWeb(g, t, sm(u, 0.35, 0.8));
  tag(g, 960, 540, { t0: Wd('n_space', 'edge') - 0.15, label: 'Edge of the universe', value: '46.5 billion light-years', dx: -330, dy: -260, s: 1.15 });
  tag(g, 960, 540, { t0: Wd('n_space', 'edge') + 0.6, label: 'What\'s past it', value: 'you know. (no words)', dx: 120, dy: 230, s: 1.0 });
};
/* ---------- the black hole that should have happened ---------- */
const STOP = 1250;   // where you stop on the street
function spiralTags(q, t, cx, cy, t0, t1) {
  if (t < t0) return; const W0 = ['WHERE EVERY ATOM IS', 'EVERY WORD EVER SAID', 'EVERY PASSWORD', 'π · ALL OF IT', 'WHAT HAPPENED IN 1347', 'WHERE THE SOCKS GO', 'EVERY STAR\'S NAME', 'WHAT CATS THINK', 'THE LAST DIGIT OF NOTHING', 'EVERY SECRET'];
  for (let i = 0; i < W0.length; i++) { const k = cl((t - t0 - i * 0.12) / (t1 - t0)); if (k <= 0) continue; const a = i * 0.63 + k * 7, R = 520 * (1 - eIn(k)) + 20; const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.6;
    q.save(); q.globalAlpha = (1 - k) * 0.95; q.translate(x, y); q.rotate(a + 1.6); q.scale(1 - k * 0.7, 1 - k * 0.7); q.font = `600 18px ${SANS}`; const w = q.measureText(W0[i]).width + 24; q.fillStyle = KN.glass; rr(q, -w / 2, -18, w, 36, 7); q.fill(); q.strokeStyle = KN.cyanA + '0.8)'; q.lineWidth = 1.5; rr(q, -w / 2, -18, w, 36, 7); q.stroke(); q.fillStyle = KN.cyan; q.textAlign = 'center'; q.fillText(W0[i], 0, 6); q.restore(); }
}
DRAW.holeTalk = (g, t, sh) => {
  drawSet(g, 'street', { x: STOP + 80, y: 560, z: 1.55 }, t, (q) => {
    walkers(q, t, STOP, { stop: true, youP: POSES.handsHead, youEyes: { wide: 0.8, ly: -0.6 }, youMouth: 'o', youBrow: 0.9, mayaF: -1, mayaP: POSES.crossed, mayaEyes: { lx: -0.5 }, mayaBrow: 0.4 });
    tagBurst(q, t, sh.t0, STREETTAGS, { step: 0.05, s: 0.75, a: 0.7 });
  });
};
DRAW.hole = (g, t, sh) => {
  const grow = sm(t, T.bh0, T.bh0 + 1.4), hx = STOP + 10, hy = 330;
  drawSet(g, 'street', { x: STOP + 60, y: 470, z: 2.0 + 0.2 * U(t, sh), shake: grow * 0.25 }, t, (q) => {
    walkers(q, t, STOP, { stop: true, youP: POSES.handsHead, youEyes: { wide: 1, ly: -0.9 }, youMouth: 'open', youBrow: 1, mayaF: -1, mayaP: POSES.surprised, mayaEyes: { wide: 0.8, lx: -0.4, ly: -0.6 }, mayaMouth: 'o', mayaBrow: 0.9 });
    spiralTags(q, t, hx, hy, Wd('n_hole', 'information') - 0.3, T.bh0 + 1.3);
    // the street bends toward it
    if (grow > 0) { q.save(); q.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { q.strokeStyle = `rgba(255,190,120,${0.18 * grow})`; q.lineWidth = 3; q.beginPath(); q.ellipse(hx, hy, 120 + k * 70 * grow, (120 + k * 70 * grow) * 0.55, t * 0.5 + k, 0, Math.PI * 2); q.stroke(); } q.restore(); }
    blackHole(q, hx, hy, 70 * grow, t, grow);
    tag(q, hx, hy, { t0: Wd('n_hole', 'black') - 0.1, label: 'Should be', value: 'a black hole', dx: 160, dy: -60, s: 1.15 });
  });
};
DRAW.holeGone = (g, t, sh) => {
  const pop = sm(t, sh.t0, sh.t0 + 0.35), hx = STOP + 10, hy = 330;
  drawSet(g, 'street', { x: STOP + 80, y: 520, z: 1.7 }, t, (q) => {
    const shrug = t > Wd('n_hole', 'there') - 0.3;
    walkers(q, t, STOP, { stop: true, youP: shrug ? POSES.shrug : POSES.relaxed, youEyes: { lx: shrug ? 0.6 : -0.2, ly: -0.4 }, youMouth: shrug ? 'smirk' : 'o', youBrow: 0.3, mayaF: -1, mayaP: POSES.crossed, mayaEyes: { lx: -0.6, open: 0.7 }, mayaBrow: 0.2 });
    blackHole(q, hx, hy, 70 * (1 - pop), t, 1 - pop);
    if (pop < 1) { q.save(); q.globalCompositeOperation = 'lighter'; glow(q, hx, hy, 300 * pop, 'rgba(255,240,210,0.8)', 1 - pop); q.restore(); }
    tag(q, STOP + 150, 520, { t0: Wd('n_hole', 'you') - 0.1, kind: 'odds', label: 'Maya thinks · you\'re being weird', odds: 92, dx: 80, dy: -160, s: 1.05 });
  });
};
/* ---------- the odds ---------- */
function oddsStreetCast(q, t) {
  trafficLight(q, 1700, 940, t > Wd('n_dice', 'not') + 0.4);
  // a man walking a dog
  const dx = 1950 - 40 * (t - S('n_dice'));
  stranger(q, t, { x: dx, y: 935, h: 430, p: walk(t, 6), col: KID3, coat: false, eyes: { lx: -0.3 } });
  q.fillStyle = '#c9a26a'; q.beginPath(); q.ellipse(dx - 140, 905, 46, 24, 0, 0, Math.PI * 2); q.fill(); q.beginPath(); q.arc(dx - 186, 880, 20, 0, Math.PI * 2); q.fill(); q.fillStyle = '#8a6a3a'; q.beginPath(); q.ellipse(dx - 196, 866, 8, 14, 0.4, 0, Math.PI * 2); q.fill();
  q.strokeStyle = '#8a6a3a'; q.lineWidth = 6; for (const k of [-1, 1]) { q.beginPath(); q.moveTo(dx - 140 + k * 26, 920); q.lineTo(dx - 140 + k * 30 + Math.sin(t * 12 + k) * 6, 935); q.stroke(); }
  q.strokeStyle = '#2b2e38'; q.lineWidth = 2; q.beginPath(); q.moveTo(dx - 40, 760); q.quadraticCurveTo(dx - 120, 860, dx - 180, 885); q.stroke();
  return dx;
}
DRAW.oddsStreet = (g, t, sh) => {
  drawSet(g, 'street', { x: 1500, y: 580, z: 1.25 }, t, (q) => {
    const dx = oddsStreetCast(q, t);
    walkers(q, t, STOP, { stop: true, youP: POSES.relaxed, youEyes: { lx: 0.6, ly: -0.3 }, mayaP: POSES.phone });
    tag(q, 1700, 520, { t0: Wd('n_dice', 'future') - 0.2, kind: 'odds', label: 'Light · red in 4 s', odds: 97, dx: 50, dy: -110, s: 1 });
    tag(q, dx - 170, 860, { t0: Wd('n_dice', 'not') - 0.1, kind: 'odds', label: 'Dog · barks next', odds: 60, dx: -70, dy: -170, s: 1 });
  });
};
DRAW.diceRoll = (g, t, sh) => {
  setBlur(g, 'street', { x: 1300, y: 560, z: 1.2 }, t, 0.6);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const u = U(t, sh);
  // drifting odds everywhere
  for (let i = 0; i < 46; i++) { const x = (hash(i * 3) * W + t * (10 + hash(i) * 30)) % W, y = (hash(i * 7) * H - t * (8 + hash(i * 5) * 20) + H) % H; g.globalAlpha = 0.3 + 0.4 * hash(i * 9); txt(g, `${Math.floor(hash(i * 11) * 99) + 1}%`, x, y, `600 ${18 + hash(i) * 22}px ${SERIF}`, hash(i * 13) > 0.7 ? PAL.amber : KN.cyan, 'center', g.globalAlpha); }
  g.globalAlpha = 1;
  // two glowing dice tumbling in slow motion
  for (let k = 0; k < 2; k++) {
    const x = lerp(-200 + k * 300, 1300 + k * 400, u), y = 520 + k * 120 - Math.sin(u * Math.PI) * 220, rot = t * (1.6 + k * 0.7) + k, s = 150 - k * 30;
    g.save(); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(140,220,255,0.9)'; g.shadowBlur = 40; g.fillStyle = 'rgba(200,240,255,0.18)'; rr(g, -s / 2, -s / 2, s, s, s * 0.18); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(200,240,255,0.95)'; g.lineWidth = 4; rr(g, -s / 2, -s / 2, s, s, s * 0.18); g.stroke();
    const face = 1 + Math.floor((t * 6 + k * 3) % 6), P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[face];
    g.fillStyle = '#ffffff'; for (const [a, b] of P) { g.beginPath(); g.arc(a * s * 0.27, b * s * 0.27, s * 0.08, 0, Math.PI * 2); g.fill(); } g.restore();
  }
};
DRAW.kick = (g, t, sh) => {
  const kx = 890, binX = 1560, k = cl((t - T.kick) / (T.binLand - T.kick));
  drawSet(g, 'street', { x: 1150, y: 560, z: 1.2 }, t, (q) => {
    walkers(q, t, 470, { stop: true, youP: POSES.relaxed, youEyes: { lx: 0.6, ly: -0.2 }, mayaP: POSES.relaxed, mayaF: 1, mayaEyes: { lx: 0.6 } });
    const kp = t < T.kick - 0.35 ? pose(POSES.relaxed) : t < T.kick ? mixPose(pose(POSES.relaxed), pose({ lHip: -0.5, lKn: 0.6, lSh: 0.5, rSh: -0.5 }), eIO((t - T.kick + 0.35) / 0.3)) : t < T.kick + 0.4 ? pose(POSES.kick) : t > T.binLand ? pose(POSES.cheer) : pose(POSES.relaxed);
    kid(q, t, { x: kx - 70, y: 935, h: 330, f: 1, p: kp, cap: '#2f6fbf', eyes: { lx: 0.6, ly: -0.4 }, mouth: t > T.binLand ? 'smile' : 'flat' });
    bin(q, binX, 935, 1.1);
    // the can: on the ground, then a slow, high arc into the bin
    let cx, cy, rot;
    if (t < T.kick) { cx = kx; cy = 920; rot = 0.3; } else { cx = lerp(kx, binX, k); cy = lerp(920, 790, k) - Math.sin(k * Math.PI) * 360; rot = (t - T.kick) * 5; }
    if (t < T.binLand + 0.05) can(q, cx, cy, 1.4, rot);
    if (t > T.binLand) { const v = t - T.binLand; q.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.2 + i * 0.12); q.fillRect(binX + Math.cos(a) * (40 + v * 200), 800 + Math.sin(a) * (40 + v * 200), 6, 6); } }
    tag(q, cx, cy, { t0: Wd('n_dice', 'seventy') - 0.2, t1: T.binLand + 0.2, kind: 'odds', label: 'Can · lands in the bin', odds: 71, dx: 70, dy: -150, s: 1.1 });
    if (t > T.binLand + 0.1) tag(q, binX, 790, { t0: T.binLand + 0.1, kind: 'odds', label: 'Can · in the bin', odds: 100, dx: 70, dy: -150, s: 1.1 });
  });
};
DRAW.thinkWalk = (g, t, sh) => {
  const u = U(t, sh), x = lerp(900, 1150, u), still = t > Wd('n_mirror', 'you', 1) - 0.2;
  drawSet(g, 'street', { x: x + 80, y: 520, z: 1.75 }, t, (q) => {
    hero(q, t, { x: still ? lerp(900, 1150, cl((Wd('n_mirror', 'you', 1) - 0.2 - sh.t0) / (sh.t1 - sh.t0))) : x, y: 935, h: 430, f: 1, p: still ? pose(POSES.holdFront) : walk(t, 5), eyes: still ? { ly: 0.8, lx: 0.4 } : { lx: 0.5, ly: -0.2 }, brow: 0.5 });
    tagBurst(q, t, sh.t0, STREETTAGS, { step: 0.05, s: 0.75, a: 0.6 });
  });
};
DRAW.nextMoves = (g, t, sh) => {
  drawSet(g, 'street', { x: 1150, y: 560, z: 1.12 }, t, (q) => {
    const T0 = Wd('n_mirror', 'next') - 0.3;
    stranger(q, t, { x: 520, y: 935, h: 420, f: 1, col: KID2, coat: '#7d5fb0', tie: false, bob: true, p: pose(POSES.relaxed), eyes: { lx: 0.4 } });
    stranger(q, t, { x: 1180, y: 935, h: 440, f: -1, col: GREY, p: pose(POSES.phone), eyes: { ly: 0.7 } });
    stranger(q, t, { x: 1760, y: 935, h: 410, f: -1, col: KID1, coat: '#c46b4a', tie: false, short: false, p: pose({ tilt: -0.3, lSh: 0.9, lEl: 1.6 }), eyes: { open: 0.5 }, mouth: 'wavy' });
    tag(q, 520, 480, { t0: T0, kind: 'odds', label: 'Next · crosses the road', odds: 83, dx: 50, dy: -110, s: 1 });
    tag(q, 1180, 470, { t0: T0 + 0.35, kind: 'odds', label: 'Next · checks phone again', odds: 91, dx: 50, dy: -120, s: 1 });
    tag(q, 1760, 490, { t0: T0 + 0.7, kind: 'odds', label: 'Next · sneezes', odds: 64, dx: -50, dy: -130, s: 1 });
  });
};
function reflection(q, t, x, y, h, a, qmark) {
  q.save(); q.beginPath(); q.rect(SHOPWIN.x, SHOPWIN.y, SHOPWIN.w, SHOPWIN.h); q.clip(); q.globalAlpha = a;
  hero(q, t, { x, y, h, f: -1, rim: 1, rimCol: '#bfe8ff', p: pose(POSES.relaxed), eyes: { lx: 0.5 }, mouth: 'flat', brow: 0.4, shadow: false });
  q.globalAlpha = 1; q.fillStyle = 'rgba(180,220,255,0.06)'; q.fillRect(SHOPWIN.x, SHOPWIN.y, SHOPWIN.w, SHOPWIN.h);
  q.restore();
}
DRAW.shopWin = (g, t, sh) => {
  const u = U(t, sh), x = lerp(200, 640, eOut(cl(u * 1.4)));
  drawSet(g, 'shop', { x: 900, y: 560, z: 1.05 }, t, (q) => {
    reflection(q, t, 2 * 640 - x + 700, 900, 520, 0.45 * sm(u, 0.4, 0.8));
    hero(q, t, { x, y: 1040, h: 600, f: 1, p: u < 0.7 ? walk(t, 6) : pose(POSES.relaxed), eyes: { lx: 0.6 }, brow: 0.3 });
  });
};
DRAW.shopQ = (g, t, sh) => {
  drawSet(g, 'shop', { x: 1000, y: 520, z: 1.6 + 0.12 * U(t, sh) }, t, (q) => {
    reflection(q, t, 1340, 900, 520, 0.5);
    tag(q, 1340, 330, { t0: T.q, kind: 'q', s: 1.25 });
    hero(q, t, { x: 640, y: 1040, h: 600, f: 1, p: pose(POSES.relaxed), eyes: { lx: 0.7, wide: sm(t, T.q, T.q + 0.3) * 0.6 }, mouth: t > T.q ? 'o' : 'flat', brow: 0.6 });
  });
};
/* =========================== SCHOOL =========================== */
const DESKS = [[1150, 925, 0.82, KID3], [1500, 925, 0.82, KID4], [1850, 925, 0.82, KID2], [1000, 1005, 1, KID1], [1350, 1005, 1, null], [1700, 1005, 1, KID3]];
function classCast(q, t, o = {}) {
  for (const [x, y, s, col] of DESKS) {
    chair(q, x + 20 * s, y, s);
    const writing = Math.sin(t * 9 + x) * 0.15, me = !col;
    const fast = me && t > T.fill0 && t < T.fill1, done = me && t >= T.down - 0.2;
    const P = pose(Object.assign({}, POSES.sitTable, { rSh: 0.9 + (fast ? Math.sin(t * 40) * 0.12 : done ? -0.5 : writing), rEl: 1.0 + (fast ? Math.cos(t * 40) * 0.2 : done ? -0.5 : writing), lSh: 0.7, lEl: 1.2, lean: 0.2, tilt: done ? -0.1 : 0.35 }));
    if (me && o.raise) Object.assign(P, { rSh: 2.5, rEl: 0.25, tilt: -0.05, lean: 0.05 });
    if (me) hero(q, t, { x, y, h: 470 * s, f: -1, rim: 1, p: P, eyes: done ? { lx: 0.6, ly: -0.2 } : { ly: 0.9, lx: 0.4 }, mouth: o.youMouth || 'flat', brow: o.youBrow });
    else kid(q, t, { x, y, h: 450 * s, f: -1, col, seed: x, p: P, pony: col === KID2, eyes: o.stare ? { lx: 0.9, ly: -0.1, wide: 0.5 } : { ly: 0.9, lx: 0.4 }, cap: col === KID1 ? '#2f6fbf' : undefined, mouth: o.stare ? 'o' : 'flat' });
    studentDesk(q, x - 70 * s, y, s, { paper: true });
  }
}
function classTeacher(q, t, o = {}) { teacher(q, t, { x: 720, y: 985, h: 560, f: 1, p: pose(o.p || POSES.clipboard), eyes: o.eyes || { lx: 0.5, ly: 0.3 }, brow: o.brow, mouth: o.mouth || 'flat', sweat: o.sweat }); }
DRAW.classWide = (g, t, sh) => {
  drawSet(g, 'classroom', { x: 1120, y: 560, z: 1.0 + 0.05 * U(t, sh) }, t, (q) => {
    wallClock(q, 1240, 130, 52, (t * 6) % 60, 5);
    classTeacher(q, t, { eyes: { lx: 0.6, ly: 0.6 } });
    classCast(q, t);
  });
};
DRAW.paperFast = (g, t, sh) => {
  setBlur(g, 'classroom', { x: 1350, y: 700, z: 1.6 }, t, 0.3);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const k = cl((t - T.fill0) / (T.fill1 - T.fill0)), filled = Math.floor(20 * k);
  testPaper(g, 900, 560, 1.12, filled, t);
  // your hand and pencil chase the next blank
  const i = Math.min(19, filled), col = i < 10 ? 0 : 1, row = i % 10;
  const px = 900 + (-260 + col * 270 + 60 + Math.sin(t * 50) * 40) * 1.12, py = 560 + (-280 + row * 64) * 1.12;
  const done = t > T.fill1 + 0.1, hx = done ? 1500 : px + 30, hy = done ? 760 : py + 10;
  sleeve(g, [2000, 1150], [hx + 80, hy + 90], PAL.hero, 110); fist(g, hx + 60, hy + 60, 58);
  g.save(); g.translate(hx, hy); g.rotate(-0.6); g.fillStyle = '#f2c230'; g.fillRect(-10, -150, 20, 150); g.fillStyle = '#e8c9a0'; g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.lineTo(0, 28); g.fill(); g.fillStyle = '#e88a8a'; g.fillRect(-10, -170, 20, 20); g.restore();
  const secs = Math.round(40 * k);
  tag(g, 1640, 200, { t0: sh.t0 + 0.15, label: 'Time', value: `00:${String(secs).padStart(2, '0')}`, dx: -60, dy: 60, s: 1.3, type: false });
};
DRAW.pencilDown = (g, t, sh) => {
  drawSet(g, 'classroom', { x: 1040, y: 560, z: 1.25 }, t, (q) => {
    wallClock(q, 1240, 130, 52, (t * 6) % 60, 6);
    const look = t > S('t_problem') - 0.5;
    classTeacher(q, t, { p: look ? POSES.crossed : POSES.clipboard, eyes: look ? { lx: 0.7, ly: 0.1 } : { lx: 0.5, ly: 0.6 }, brow: look ? -0.3 : undefined });
    classCast(q, t);
    tag(q, 720, 470, { t0: sh.t0 + 0.2, t1: E('t_problem') + 0.2, kind: 'odds', label: 'Next · "Is there a problem?"', odds: 96, dx: 60, dy: -140, s: 1.05 });
  });
};
DRAW.seven = (g, t, sh) => {
  drawSet(g, 'classroom', { x: 1300, y: 600, z: 2.0 }, t, (q) => {
    classCast(q, t, { raise: t < Wd('y_seven', 'question') + 0.3, youMouth: 'smile' });
  });
};
DRAW.keyWrong = (g, t, sh) => {
  setBlur(g, 'classroom', { x: 700, y: 600, z: 1.5 }, t, 0.3);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const c7 = sm(t, sh.t0 + 0.3, sh.t0 + 1.1);
  testPaper(g, 960, 600, 1.1, 20, t, { title: 'ANSWER KEY · DO NOT SHARE', key: ['x = 4', '17', '3/8', '12π', 'y = 2x', '81', '−50', '0.25', '144', 'x = 9', '6', '√2', '7', '45°', '2.5', '1/3', '64', 'x = −2', '19', '100'], circle7: c7, rot: 0.03 });
  for (const s2 of [-1, 1]) { sleeve(g, [960 + s2 * 900, 1200], [960 + s2 * 360, 900], TEACH.hood, 100); fist(g, 960 + s2 * 330, 880, 54); }
  tag(g, 960 - 150 * 1.1, 600 + (-280 + 6 * 64 - 8) * 1.1, { t0: sh.t0 + 0.6, label: 'Question 7 · the key', value: 'wrong since 2009', dx: -160, dy: -150, s: 1.15 });
};
/* ---------- the hallway ---------- */
function crowd(q, t, x0, n, walking) {
  const cols = [KID1, KID2, KID3, KID4, KID1, KID3];
  for (let i = n - 1; i >= 0; i--) { const x = x0 - i * 120 - (i % 2) * 30, y = 945 - (i % 2) * 14, h = 400 - (i % 2) * 24; kid(q, t, { x, y, h, f: 1, col: cols[i], seed: i + 3, speaker: i === 0, p: walking ? walk(t + i * 0.3, 7) : pose(i === 0 ? POSES.holdFront : POSES.relaxed), cap: i === 0 ? '#2f6fbf' : undefined, pony: cols[i] === KID2, eyes: { lx: 0.6, ly: -0.2 }, mouth: i === 0 ? 'flat' : 'smile' }); }
}
function emmaF(q, t, o) { return kid(q, t, Object.assign({ x: 1780, y: 945, h: 410, f: -1, col: KID2, pony: true, seed: 40, p: pose(POSES.holdFront), eyes: { lx: 0.3 } }, o)); }
DRAW.hallway = (g, t, sh) => {
  const u = U(t, sh), x = lerp(620, 960, u), stop = t > S('k_emma') - 0.2;
  drawSet(g, 'hallway', { x: 980, y: 560, z: 1.05 }, t, (q) => {
    emmaF(q, t, { p: pose(POSES.holdFront) });
    crowd(q, t, (stop ? lerp(620, 960, cl((S('k_emma') - 0.2 - sh.t0) / (sh.t1 - sh.t0))) : x) - 150, 6, !stop);
    hero(q, t, { x: stop ? lerp(620, 960, cl((S('k_emma') - 0.2 - sh.t0) / (sh.t1 - sh.t0))) : x, y: 945, h: 430, f: 1, p: stop ? pose(POSES.relaxed) : walk(t, 7), eyes: { lx: stop ? -0.6 : 0.5 }, mouth: 'flat' });
  });
};
DRAW.emma = (g, t, sh) => {
  drawSet(g, 'hallway', { x: 1330, y: 560, z: 1.35 }, t, (q) => {
    emmaF(q, t, { eyes: { lx: 0.5, ly: 0.2 } });
    kid(q, t, { x: 900, y: 945, h: 400, f: 1, col: KID1, seed: 3, speaker: true, cap: '#2f6fbf', p: pose(POSES.holdFront), eyes: { lx: 0.6 }, mouth: 'flat', brow: 0.5 });
    const smile = t > Wd('n_learn', 'learning') - 0.4;
    hero(q, t, { x: 1080, y: 945, h: 430, f: -1, rim: 1, p: pose(t < S('n_learn') ? POSES.point : POSES.relaxed), eyes: { lx: 0.5 }, mouth: smile ? 'smile' : 'flat' });
    tag(q, 1780, 520, { t0: sh.t0 + 0.15, kind: 'odds', label: 'Emma · likes him back', odds: 83, dx: -60, dy: -130, s: 1.1 });
  });
};
/* =========================== THE BACKYARD =========================== */
const HOLE = { x: 980, y: 990 };
function holeDepth(t) { return sm(t, T.dig0, T.clunk); }
DRAW.yardWide = (g, t, sh) => {
  const u = U(t, sh);
  drawSet(g, 'backyard', { x: 1080, y: 560, z: 1.0 + 0.04 * u }, t, (q) => {
    const k = eOut(cl(u * 1.15));
    maya(q, t, { x: lerp(2000, 1500, k), y: 1000, h: 470, f: -1, p: u < 0.8 ? walk(t + 0.4, 7) : pose(POSES.crossed), eyes: { lx: 0.4 } });
    const hx = lerp(1800, 1180, k); const H1 = hero(q, t, { x: hx, y: 1000, h: 500, f: -1, rim: 1, p: u < 0.85 ? walk(t, 7) : pose(POSES.relaxed), eyes: { lx: 0.4, ly: 0.3 } });
    shovel(q, H1.rHand[0], H1.rHand[1], -2.6, 1.0);
  });
};
DRAW.yardTag = (g, t, sh) => {
  drawSet(g, 'backyard', { x: 1000, y: 700, z: 1.6 + 0.1 * U(t, sh) }, t, (q) => {
    const H1 = hero(q, t, { x: 1180, y: 1000, h: 500, f: -1, rim: 1, p: pose({ lean: 0.2, tilt: 0.4, lSh: 0.1, lEl: 0.2, rSh: 0.3, rEl: 0.3 }), eyes: { ly: 0.9, lx: 0.3 }, brow: 0.2 });
    shovel(q, H1.rHand[0], H1.rHand[1] + 20, 0.15, 1.0);
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, HOLE.x, HOLE.y, 160, 'rgba(160,230,255,0.35)', 0.5 + 0.3 * Math.sin(t * 3)); q.restore();
    tag(q, HOLE.x, HOLE.y, { t0: Wd('n_dig', 'something') - 0.2, label: 'Under here · 0.9 m down', value: 'a tin, buried 1851', dx: -120, dy: -260, s: 1.2 });
  });
};
DRAW.dig = (g, t, sh) => {
  drawSet(g, 'backyard', { x: 1150, y: 600, z: 1.3 }, t, (q) => {
    digHole(q, HOLE.x, HOLE.y, holeDepth(t), t);
    const ph = Math.max(0, t - T.dig0) * 1.4, k = 0.5 + 0.5 * Math.sin(ph * Math.PI * 2);
    const P = t < T.dig0 ? pose(POSES.relaxed) : mixPose(pose(POSES.dig1), pose(POSES.dig2), k);
    const H1 = hero(q, t, { x: 1170, y: 1000, h: 500, f: -1, rim: 1, p: P, eyes: { ly: 0.8, lx: 0.4 }, mouth: 'grit', sweat: t > T.dig0 + 2 ? (t * 0.6) % 1 : 0 });
    const hp = [(H1.lHand[0] + H1.rHand[0]) / 2, (H1.lHand[1] + H1.rHand[1]) / 2];
    const ang = t < T.dig0 ? 0.15 : lerp(0.75, 0.2, k);
    shovel(q, hp[0], hp[1], ang, 1.0);
    // dirt flying off the shovel on each lift
    if (t > T.dig0) { const fl = (ph % 1); if (fl > 0.25 && fl < 0.75) { const v = (fl - 0.25) * 2; for (let i = 0; i < 8; i++) { q.fillStyle = '#5a3d26'; q.beginPath(); q.arc(HOLE.x + 100 + v * 260 + i * 12, HOLE.y - 120 - Math.sin(v * Math.PI) * 140 + i * 6, 9 - i * 0.6, 0, Math.PI * 2); q.fill(); } } }
    maya(q, t, { x: 1560, y: 1000, h: 470, f: -1, p: pose(POSES.phone), eyes: { lx: 0.6, ly: 0.4 }, brow: 0.5, mouth: 'flat' });
    q.fillStyle = '#0d0e14'; rr(q, 1485, 650, 44, 70, 8); q.fill(); q.fillStyle = '#e0483e'; q.beginPath(); q.arc(1507, 662, 5, 0, Math.PI * 2); q.fill();
    tag(q, 1529, 700, { t0: sh.t0 + 0.4, label: 'Maya\'s phone', value: 'recording', dx: 120, dy: 60, s: 0.95 });
  });
};
DRAW.clunk = (g, t, sh) => {
  const lift = sm(t, Wd('n_tin', 'rusty') - 0.4, Wd('n_tin', 'tin') + 0.3);
  drawSet(g, 'backyard', { x: 1000, y: 880, z: 2.3, shake: Math.max(0, 0.5 - (t - T.clunk) * 2) * 0.5 }, t, (q) => {
    digHole(q, HOLE.x, HOLE.y, 1, t);
    if (t > T.clunk && t < T.clunk + 0.3) { q.save(); q.globalCompositeOperation = 'lighter'; glow(q, HOLE.x, HOLE.y, 200, 'rgba(255,240,200,0.9)', 1 - (t - T.clunk) / 0.3); q.restore(); }
    tinBox(q, HOLE.x, HOLE.y + 40 - lift * 150, 0.55, 0, t);
    for (const s2 of [-1, 1]) { sleeve(q, [HOLE.x + s2 * 360, 700], [HOLE.x + s2 * 100, HOLE.y - lift * 150], PAL.hero, 40); fist(q, HOLE.x + s2 * 95, HOLE.y - lift * 150, 22); }
  });
};
DRAW.tinOpen = (g, t, sh) => {
  setBlur(g, 'backyard', { x: 1000, y: 800, z: 1.8 }, t, 0.25);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const op = sm(t, T.open - 0.25, T.open + 0.55);
  tinBox(g, 960, 760, 2.3, op, t);
  for (const s2 of [-1, 1]) { sleeve(g, [960 + s2 * 900, 1250], [960 + s2 * 420, 860], PAL.hero, 110); fist(g, 960 + s2 * 400, 840, 60); }
  tag(g, 960, 580, { t0: Wd('n_tin', 'two') - 0.1, label: 'Inside', value: '200 gold coins', dx: -420, dy: -280, s: 1.3 });
  tag(g, 1100, 640, { t0: Wd('n_tin', 'buried') - 0.1, label: 'Buried 1851 by', value: 'Thomas Reed, farmer', dx: 260, dy: -300, s: 1.15 });
  tag(g, 1100, 640, { t0: Wd('n_tin', 'never') - 0.1, label: 'Came back for them', value: 'never (cholera, 1852)', dx: 260, dy: -150, s: 1.0 });
};
DRAW.real = (g, t, sh) => {
  drawSet(g, 'backyard', { x: 1300, y: 600, z: 1.55 }, t, (q) => {
    digHole(q, HOLE.x, HOLE.y, 1, t);
    const H1 = hero(q, t, { x: 1170, y: 1000, h: 500, f: -1, rim: 1, p: pose(POSES.holdFront), eyes: { lx: -0.4, ly: 0.2 }, mouth: t > S('y_real') ? 'flat' : 'smile', brow: 0.2 });
    const hx = (H1.lHand[0] + H1.rHand[0]) / 2, hy = (H1.lHand[1] + H1.rHand[1]) / 2;
    tinBox(q, hx - 20, hy + 34, 0.42, 1, t, 0.6);
    const M = maya(q, t, { x: 1520, y: 1000, h: 470, f: -1, p: pose({ lSh: 0.3, lEl: 0.6, rSh: 0.5, rEl: 1.2 }), eyes: { wide: 1, lx: 0.6, ly: 0.6 }, brow: 1, mouth: t < S('s_real') + 0.1 ? 'o' : 'open' });
    tag(q, hx - 20, hy, { t0: Wd('y_real', 'eighty') - 0.1, label: 'Value today', value: '$80,400', dx: -60, dy: -230, s: 1.1 });
  });
};
DRAW.viral = (g, t, sh) => {
  g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#0c0f24'], [1, '#1c1838']]);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 960, 540, 700, 'rgba(120,150,255,0.25)'); g.restore();
  const u = U(t, sh), s = 1.2;
  g.save(); g.translate(960, 560); g.scale(s, s);
  g.fillStyle = '#0d0e14'; rr(g, -200, -420, 400, 840, 48); g.fill(); g.fillStyle = '#16182a'; rr(g, -186, -406, 372, 812, 38); g.fill();
  g.save(); rr(g, -186, -406, 372, 812, 38); g.clip();
  const pm = t > Wd('n_viral', 'midnight') - 0.2;
  txt(g, pm ? '11:59 PM' : '4:12 PM', -160, -370, `700 20px ${SANS}`, '#ffffff', 'left');
  txt(g, '#TheKidWhoKnowsEverything', -160, -326, `700 22px ${SANS}`, '#ffffff', 'left');
  vgrad(g, -170, -300, 340, 420, [[0, '#ffcf8a'], [1, '#6a8f4a']]);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -60, 160, 'rgba(255,210,120,0.8)'); g.restore();
  drawStick(g, { x: -40, y: 80, h: 220, f: 1, col: HERO, p: pose(POSES.holdFront), mouth: 'smile', shadow: false }); tinBox(g, 20, 0, 0.25, 1, t);
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(-24, -120); g.lineTo(30, -94); g.lineTo(-24, -68); g.fill();
  const views = t < Wd('n_viral', 'by') ? 1200 + (t - sh.t0) * 900 : 1200 + 39998800 * eOut(cl((t - Wd('n_viral', 'by')) / (T.views - Wd('n_viral', 'by') + 0.5)));
  const vs = views >= 1e6 ? (views / 1e6).toFixed(1) + 'M' : views >= 1e3 ? Math.round(views / 1e3) + 'K' : Math.round(views);
  txt(g, `${vs} views`, -160, 160, `800 40px ${SANS}`, '#ffffff', 'left');
  txt(g, '"my brother just found TREASURE??"', -160, 196, `600 18px ${SANS}`, '#c9cde0', 'left');
  for (let i = 0; i < 3; i++) { const a = cl((t - sh.t0 - 0.6 - i * 0.7) / 0.4); g.globalAlpha = a; g.fillStyle = '#23263a'; rr(g, -170, 222 + i * 60, 340, 52, 12); g.fill(); g.fillStyle = ['#e0483e', '#2fa79a', '#f2c230'][i]; g.beginPath(); g.arc(-142, 248 + i * 60, 16, 0, Math.PI * 2); g.fill();
    txt(g, ['how did he KNOW', 'this kid knows everything fr', 'ask him the lottery numbers'][i], -116, 254 + i * 60, `600 17px ${SANS}`, '#ffffff', 'left'); g.globalAlpha = 1; }
  g.restore(); g.restore();
};
/* =========================== WEDNESDAY TO FRIDAY =========================== */
function reporter(q, t, x, f, col, seed) { const R = drawStick(q, { x, y: 1012, h: 400, f, col, coat: col.hood, short: true, rim: 1, t, blink: blinkAt(t, seed), p: pose(POSES.mic), eyes: { lx: 0.4 }, mouth: Math.sin(t * 9 + seed) > 0.3 ? 'open' : 'flat' }); q.fillStyle = '#16171f'; q.fillRect(R.rHand[0] - 5, R.rHand[1] - 46, 10, 50); q.beginPath(); q.arc(R.rHand[0], R.rHand[1] - 50, 13, 0, Math.PI * 2); q.fill(); }
function tvCamera(q, x, y, s, f = 1) { q.fillStyle = '#16171f'; q.save(); q.translate(x, y); q.scale(s * f, s); rr(q, -60, -260, 140, 80, 10); q.fill(); q.fillRect(80, -245, 40, 46); q.fillRect(-6, -180, 12, 120); q.beginPath(); q.moveTo(0, -60); q.lineTo(-60, 0); q.lineTo(-52, 0); q.lineTo(0, -46); q.lineTo(52, 0); q.lineTo(60, 0); q.fill(); q.fillStyle = '#e0483e'; q.beginPath(); q.arc(-40, -245, 6, 0, Math.PI * 2); q.fill(); q.restore(); }
DRAW.vans = (g, t, sh) => {
  drawSet(g, 'houseDay', { x: 1000, y: 600, z: 1.02 + 0.04 * U(t, sh) }, t, (q) => {
    // you peek out of your bedroom window upstairs
    q.save(); q.beginPath(); q.rect(366, 346, 208, 178); q.clip(); hero(q, t, { x: 470, y: 640, h: 300, f: 1, p: pose(POSES.relaxed), eyes: { lx: 0.5, ly: 0.6, wide: 0.5 }, mouth: 'o', shadow: false }); q.restore();
    reporter(q, t, 300, 1, { hood: '#3f5f93', hoodDk: '#2f4a7a', pants: '#2a2f3d' }, 21); tvCamera(q, 560, 1012, 1, -1);
    reporter(q, t, 1240, -1, { hood: '#8a3a4a', hoodDk: '#6a2a3a', pants: '#2a2f3d' }, 22); tvCamera(q, 1460, 1012, 1, -1);
    reporter(q, t, 1700, -1, { hood: '#4a6a4a', hoodDk: '#355035', pants: '#2a2f3d' }, 23);
  }, { after: (q) => {
    newsVan(q, 260, 1200, 0.85, '#c0392b', 'CH 7 NEWS', 1); newsVan(q, 1000, 1210, 0.85, '#2f6fbf', 'NEWS 24', 1); newsVan(q, 1760, 1200, 0.85, '#ef8a3a', 'LIVE 9', -1);
    tag(q, 1000, 940, { t0: Wd('n_wed', 'vans') - 0.1, label: 'News vans', value: '6 (3 more on the way)', dx: 60, dy: -300, s: 1.05 });
  } });
};
DRAW.news = (g, t, sh) => {
  g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#13224a'], [1, '#08102a']]);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 1300, 300, 900, 'rgba(90,140,255,0.25)'); for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(120,170,255,0.08)'; g.fillRect(i * 210, 0, 3, H); } g.restore();
  // the big screen behind the anchor: your house with the vans
  const bx = 1040, by = 150, bw = 760, bh = 430; box(g, bx - 12, by - 12, bw + 24, bh + 24, '#0a0f20', { r: 8 });
  g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip(); g.translate(bx, by); g.scale(bw / 1920 * 1.3, bh / 1080 * 1.3); g.translate(-200, -150);
  putL(g, LAY('houseDay.far', SETS.houseDay.far, { res: 0.6, blur: 3 }), LX, LY); putL(g, LAY('houseDay.back', SETS.houseDay.back), LX, LY);
  newsVan(g, 260, 1200, 0.85, '#c0392b', 'CH 7 NEWS', 1); newsVan(g, 1000, 1210, 0.85, '#2f6fbf', 'NEWS 24', 1); g.restore();
  // the anchor at the desk
  drawStick(g, { x: 560, y: 1000, h: 620, f: 1, col: { hood: '#2a3550', hoodDk: '#1d2540', pants: '#1a1d2a', hair: '#3a2a20' }, coat: '#2a3550', tie: '#c0392b', short: true, rim: 1, rimCol: '#9fc4ff', t, blink: blinkAt(t, 30), talk: talkAt(t, 'a'), p: pose(POSES.clasp), eyes: { lx: 0.3 }, mouth: 'flat', shadow: false });
  box(g, 200, 780, 760, 300, '#1d2a52', { r: 6 }); g.fillStyle = '#2f6fbf'; g.fillRect(200, 800, 760, 10);
  // lower third and ticker
  g.fillStyle = 'rgba(8,12,28,0.92)'; g.fillRect(0, 820, W, 150); g.fillStyle = '#c0392b'; g.fillRect(0, 820, 210, 70); txt(g, 'LIVE', 105, 870, `800 40px ${SANS}`, '#ffffff');
  txt(g, 'THE BOY WHO KNOWS EVERYTHING', 240, 875, `700 52px ${SERIF}`, '#ffffff', 'left');
  const tick = 'FINDS 1851 GOLD IN BACKYARD · CORRECTS SCHOOL ANSWER KEY · 40 MILLION VIEWS OVERNIGHT · SCIENTISTS "VERY INTERESTED" · ';
  g.save(); g.beginPath(); g.rect(0, 900, W, 60); g.clip(); g.fillStyle = '#f2c230'; g.fillRect(0, 900, W, 60); g.font = `700 30px ${SANS}`; const tw = g.measureText(tick).width; const off = (t * 170) % tw; txt(g, tick + tick, W - off - tw * 0.6, 942, `700 30px ${SANS}`, '#191a26', 'left'); g.restore();
  g.globalAlpha = 0.05; g.fillStyle = '#000'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2); g.globalAlpha = 1;
};
function whiteboardAnswer(q, t, k) {
  // the clean corner you write in, and the line (it glows faintly)
  q.fillStyle = '#fbfcfd'; q.fillRect(1040, 300, 440, 210);
  const s = 'Ω = ∮ φ(ℏ) · dΣ⁴', n = Math.floor(s.length * cl(k));
  q.save(); q.shadowColor = 'rgba(80,140,255,0.6)'; q.shadowBlur = 14 * cl(k * 2); txt(q, s.slice(0, n), 1070, 420, `italic 600 54px ${SERIF}`, '#1f3fa0', 'left'); q.restore();
  if (k >= 1) { q.strokeStyle = 'rgba(31,63,160,0.8)'; q.lineWidth = 4; q.beginPath(); q.moveTo(1070, 446); q.lineTo(1440, 446); q.stroke(); }
}
function labCast(q, t, o = {}) {
  const k = cl((t - T.write0) / (T.write1 - T.write0)); whiteboardAnswer(q, t, t < T.write0 ? 0 : k);
  const sitting = t > T.sit, crying = t > T.cry;
  if (sitting) { g2stool(q, 760, 950); }
  physicist(q, t, { x: sitting ? 780 : 820, y: sitting ? 975 : 960, h: 540, f: 1, p: pose(sitting ? (crying ? POSES.sitCry : POSES.sitHands) : o.physP || POSES.relaxed), eyes: sitting ? { lx: 0.6, ly: crying ? 0.6 : -0.3, open: crying ? 0.5 : 1 } : { lx: o.reading ? Math.sin(t * 2.4) * 0.8 : 0.6, ly: o.reading ? -0.4 : -0.1, wide: o.reading ? 0.5 : 0 }, brow: crying ? 0.9 : 0.4, mouth: crying ? 'wavy' : 'flat' });
  const writing = t > T.write0 - 0.3 && t < T.write1 + 0.2;
  hero(q, t, { x: 1250, y: 960, h: 520, f: -1, rim: 1, p: pose(writing ? POSES.board : POSES.relaxed), eyes: { lx: writing ? 0.2 : 0.6, ly: writing ? -0.5 : 0 }, mouth: 'flat' });
}
function g2stool(q, x, y) { q.fillStyle = '#3a3f4c'; q.fillRect(x - 6, y - 90, 12, 90); q.fillRect(x - 46, y - 10, 92, 8); box(q, x - 56, y - 110, 112, 22, '#2fa79a', { r: 10 }); }
DRAW.labWide = (g, t, sh) => { drawSet(g, 'lab', { x: 1000, y: 560, z: 1.0 + 0.04 * U(t, sh) }, t, (q) => { labCast(q, t); }); };
DRAW.labQ = (g, t, sh) => {
  drawSet(g, 'lab', { x: 900, y: 500, z: 1.75 }, t, (q) => {
    labCast(q, t, { physP: POSES.clasp });
    tag(q, 820, 390, { t0: Wd('n_thu', 'thirty') - 0.2, label: 'Dr. Lena Ortiz · has asked this', value: 'for 30 years', dx: -90, dy: -140, s: 1.1 });
  });
};
DRAW.write = (g, t, sh) => {
  drawSet(g, 'lab', { x: 1250, y: 430, z: 2.5 }, t, (q) => {
    const k = cl((t - T.write0) / (T.write1 - T.write0)); whiteboardAnswer(q, t, t < T.write0 ? 0 : k);
    const s = 'Ω = ∮ φ(ℏ) · dΣ⁴'; q.font = `italic 600 54px ${SERIF}`; const px = 1070 + q.measureText(s.slice(0, Math.floor(s.length * k))).width;
    const hx = t < T.write0 ? 1100 : k < 1 ? px + 10 : 1460, hy = t < T.write0 ? 560 : k < 1 ? 410 + Math.sin(t * 30) * 8 : 600;
    sleeve(q, [1800, 900], [hx + 40, hy + 40], PAL.hero, 70); fist(q, hx + 30, hy + 30, 34);
    q.save(); q.translate(hx, hy); q.rotate(-0.7); q.fillStyle = '#1f3fa0'; rr(q, -12, -10, 24, 90, 8); q.fill(); q.fillStyle = '#e9edf5'; q.fillRect(-12, 30, 24, 30); q.restore();
    if (k >= 1) tag(q, 1250, 420, { t0: T.write1, label: 'Dark matter', value: 'solved (one line)', dx: 60, dy: 200, s: 1.1 });
  });
};
DRAW.reads = (g, t, sh) => { drawSet(g, 'lab', { x: 1000, y: 560, z: 1.45 }, t, (q) => { labCast(q, t, { reading: true }); }); };
DRAW.simple = (g, t, sh) => {
  drawSet(g, 'lab', { x: 790, y: 640, z: 2.5 }, t, (q) => {
    labCast(q, t);
    // tears
    for (let i = 0; i < 4; i++) { const ph = (t * 0.9 + i * 0.25) % 1; q.fillStyle = `rgba(190,225,255,${0.9 * (1 - ph)})`; q.beginPath(); q.ellipse(812 + (i % 2) * 18, 560 + ph * 90, 5, 8, 0, 0, Math.PI * 2); q.fill(); }
  });
};
DRAW.papers = (g, t, sh) => {
  setBlur(g, 'street', { x: 1200, y: 560, z: 1.1 }, t, 0.45); g.setTransform(1, 0, 0, 1, 0, 0);
  const a = eOut(cl((t - sh.t0) / 0.5)), b = eOut(cl((t - sh.t0 - 1.3) / 0.5));
  newspaper(g, 760, 560, 0.95 * (0.4 + 0.6 * a), -0.12 + (1 - a) * 3, 'BOY CURES 3 CANCERS', 'Doctors: "We checked it twice. It works."', 3);
  if (b > 0) newspaper(g, 1180, 520, 0.95 * (0.4 + 0.6 * b), 0.08 - (1 - b) * 3, 'DARK MATTER: SOLVED', 'On a whiteboard, in six seconds', 4);
};
DRAW.covers = (g, t, sh) => {
  setBlur(g, 'street', { x: 900, y: 560, z: 1.2 }, t, 0.55); g.setTransform(1, 0, 0, 1, 0, 0);
  const cover = (x, y, s, rot, top, big, col, k) => { if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * (0.6 + 0.4 * k), s * (0.6 + 0.4 * k)); g.globalAlpha = k; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; vgrad(g, -220, -300, 440, 600, [[0, col], [1, shade(col, -0.4)]]); g.shadowBlur = 0;
    txt(g, top, 0, -230, `800 54px ${COND}`, '#ffffff'); drawStick(g, { x: 0, y: 260, h: 380, f: 1, col: HERO, p: pose(POSES.crossed), mouth: 'smirk', rim: 1, shadow: false }); txt(g, big, 0, 200, `700 40px ${SERIF}`, '#ffffff'); g.restore(); };
  cover(560, 540, 0.95, -0.1, 'WORLD WEEKLY', 'Person of the Century', '#c0392b', eOut(cl((t - sh.t0) / 0.4)));
  cover(1360, 540, 0.95, 0.1, 'GENIUS?', 'The boy who knows it all', '#2f6fbf', eOut(cl((t - sh.t0 - 0.5) / 0.4)));
  cover(960, 580, 1.05, 0, 'SCIENCE NOW', '"He\'s right. Again."', '#1f5a4a', eOut(cl((t - sh.t0 - 1.0) / 0.4)));
  tag(g, 960, 300, { t0: Wd('n_fri', 'famous') - 0.2, label: 'People who know your name', value: '6,100,000,000', dx: 60, dy: -140, s: 1.2, noDot: true });
};
/* =========================== THE PRICE =========================== */
function livingTV(q, t, mode) {
  box(q, 30, 820, 420, 160, '#3a2a26', { r: 6 });
  tvSet(q, 70, 560, 340, 220, (g2) => {
    if (mode === 'movie') { vgrad(g2, 70, 560, 340, 220, [[0, '#ff9a5a'], [1, '#7a3a5a']]); g2.fillStyle = '#2a1a22'; g2.fillRect(70, 720, 340, 60); drawStick(g2, { x: 240, y: 730, h: 130, f: 1, col: { hood: '#6a4a3a', hoodDk: '#4a3428', pants: '#2a2230' }, cap: '#3a2a20', p: pose(POSES.relaxed), shadow: false }); }
    else { vgrad(g2, 70, 560, 340, 220, [[0, '#3a6ac0'], [1, '#1a2a5a']]); for (let i = 0; i < 5; i++) { g2.fillStyle = `rgba(255,255,255,${0.1 + 0.1 * Math.sin(t * 3 + i)})`; g2.fillRect(90 + i * 64, 600 + (i % 2) * 40, 48, 120); } }
  });
  q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 240, 670, 300, 'rgba(120,160,255,0.35)', 0.8 + 0.2 * Math.sin(t * 5)); q.restore();
}
function sofaYou(q, t, o = {}) { return hero(q, t, Object.assign({ x: 820, y: 985, h: 430, f: 1, rim: -1, rimCol: '#8fb0ff', p: pose(POSES.sitHands), eyes: { lx: -0.5, open: 0.7 }, mouth: 'flat', brow: 0.1 }, o)); }
function sofaMaya(q, t, o = {}) { return maya(q, t, Object.assign({ x: 1090, y: 985, h: 400, f: -1, rim: 1, rimCol: '#ffcf8a', p: pose(POSES.sitHands), eyes: { lx: 0.5 } }, o)); }
const LIVTAGS = [[240, 600, 'Show', 'you know the ending', 30, -110], [1395, 470, 'Lamp', 'bulb dies Tuesday', -30, -100], [1700, 380, 'Window', 'a moth, 2 seconds away', -40, -110], [700, 330, 'Photo', 'Dad took it, 2014', 30, -90]];
DRAW.priceSofa = (g, t, sh) => {
  drawSet(g, 'living', { x: 820, y: 600, z: 1.15 + 0.05 * U(t, sh) }, t, (q) => { livingTV(q, t, 'show'); sofaYou(q, t); tagBurst(q, t, sh.t0 + 0.3, LIVTAGS, { step: 0.3, s: 0.85 }); });
};
DRAW.joke = (g, t, sh) => {
  drawSet(g, 'living', { x: 960, y: 620, z: 1.6 }, t, (q) => {
    livingTV(q, t, 'show'); sofaYou(q, t, { eyes: { lx: 0.6, open: 0.6 }, mouth: 'flat' });
    sofaMaya(q, t, { p: pose(Object.assign({}, POSES.sitHands, { rSh: 1.0 + Math.sin(t * 5) * 0.3, rEl: 0.9 })), talk: 0.4 + 0.4 * Math.abs(Math.sin(t * 11)), mouth: 'smile', eyes: { lx: 0.6 } });
    tag(q, 1090, 600, { t0: sh.t0 + 0.2, label: 'Punchline', value: '"…because it was two-tired."', dx: -40, dy: -170, s: 1.05 });
  });
};
DRAW.movie = (g, t, sh) => {
  drawSet(g, 'living', { x: 240, y: 660, z: 3.0 }, t, (q) => {
    livingTV(q, t, 'movie');
    tag(q, 240, 640, { t0: Wd('n_price', 'who') - 0.2, label: 'Him', value: 'dies in 4 min 12 s', dx: 80, dy: -40, s: 0.6 });
  });
};
DRAW.giftIn = (g, t, sh) => {
  const u = U(t, sh), k = eOut(cl(u * 1.6));
  drawSet(g, 'living', { x: 980, y: 600, z: 1.3 }, t, (q) => {
    livingTV(q, t, 'show'); sofaYou(q, t, { eyes: { lx: 0.6 }, p: pose(t > sh.t0 + 1.5 ? POSES.sitOffer : POSES.sitHands) });
    if (u < 0.45) { const M = maya(q, t, { x: lerp(1700, 1150, k), y: 985, h: 420, f: -1, p: walk(t, 6), eyes: { lx: 0.4 }, mouth: 'smile' }); present(q, M.rHand[0] - 20, M.rHand[1] + 50, 0.6, 0, t); }
    else { const M = sofaMaya(q, t, { p: pose(POSES.sitOffer), mouth: 'smile', eyes: { lx: 0.5 } }); const hx = lerp((M.lHand[0] + M.rHand[0]) / 2, 960, sm(u, 0.6, 0.9)); present(q, hx, (M.lHand[1] + M.rHand[1]) / 2 + 40, 0.6, 0, t); }
  });
};
DRAW.giftTag = (g, t, sh) => {
  drawSet(g, 'living', { x: 920, y: 760, z: 2.6 }, t, (q) => {
    sofaYou(q, t, { p: pose(POSES.sitOffer), eyes: { lx: 0.4, ly: 0.8, open: 0.6 } });
    present(q, 925, 870, 0.6, 0, t);
    tag(q, 925, 820, { t0: Wd('n_price', 'already') - 0.2, label: 'Inside', value: 'headphones (blue)', dx: -60, dy: -170, s: 1.25 });
  });
};
DRAW.unwrap = (g, t, sh) => {
  const op = sm(t, T.unwrap, T.unwrap + 0.5);
  drawSet(g, 'living', { x: 960, y: 640, z: 1.75 }, t, (q) => {
    const Y = sofaYou(q, t, { p: pose(POSES.sitOffer), eyes: { lx: 0.4, ly: 0.6 }, mouth: t > S('y_wow') ? 'smile' : 'flat', brow: 0.3 });
    sofaMaya(q, t, { p: pose(t < S('s_knew') - 0.3 ? POSES.cheer : POSES.sitHands), eyes: { lx: 0.6, wide: 0.4 }, mouth: 'smile' });
    present(q, (Y.lHand[0] + Y.rHand[0]) / 2 + 10, (Y.lHand[1] + Y.rHand[1]) / 2 + 40, 0.6, op, t);
    if (op > 0 && op < 1) { for (let i = 0; i < 6; i++) { q.fillStyle = i % 2 ? '#4a8ad0' : '#f2c230'; q.save(); q.translate(925 + (hash(i) - 0.5) * 300 * op, 820 - op * 160 * hash(i * 3)); q.rotate(op * 6 + i); q.fillRect(-20, -12, 40, 24); q.restore(); } }
  });
};
DRAW.knew = (g, t, sh) => {
  drawSet(g, 'living', { x: 1090, y: 600, z: 2.4 }, t, (q) => {
    sofaYou(q, t, { p: pose(POSES.sitOffer), eyes: { lx: 0.5 }, mouth: 'smile' });
    sofaMaya(q, t, { p: pose(POSES.sitHands), eyes: { lx: 0.6, ly: 0.2 }, mouth: 'sad', brow: 0.6 });
  });
};
DRAW.any = (g, t, sh) => {
  const u = U(t, sh), leave = sm(u, 0.75, 1);
  drawSet(g, 'living', { x: 960, y: 600, z: 1.5 }, t, (q) => {
    livingTV(q, t, 'show');
    const Y = sofaYou(q, t, { p: pose(POSES.sitOffer), eyes: { lx: 0.5, ly: 0.3 }, mouth: 'flat', brow: 0.7 });
    headphones(q, (Y.lHand[0] + Y.rHand[0]) / 2, (Y.lHand[1] + Y.rHand[1]) / 2 - 10, 0.5, t);
    if (leave <= 0) sofaMaya(q, t, { p: pose(POSES.sitHands), eyes: { lx: 0.6 }, mouth: 'sad', brow: 0.8 });
    else maya(q, t, { x: lerp(1150, 1800, leave), y: 985, h: 420, f: 1, p: walk(t, 6), eyes: { lx: 0.4, ly: 0.5 }, mouth: 'sad', brow: 0.8 });
  });
};
// 3 a.m.: the universe never goes quiet
function nightBed(q, t, o = {}) {
  bedProps(q, t);
  const H1 = hero(q, t, { x: 1150, y: 905, h: 520, f: 1, rim: -1, rimCol: '#9fb8ff', p: pose(POSES.sitBed), eyes: { wide: o.wide ?? 0.4, lx: Math.sin(t * 0.7) * 0.5, ly: -0.2, open: o.open ?? 1 }, mouth: o.mouth || 'flat', brow: 0.8 });
  duvet(q, t, true); return H1;
}
DRAW.night1 = (g, t, sh) => {
  drawSet(g, 'bedroomN', { x: 1060, y: 560, z: 1.02 }, t, (q) => { nightBed(q, t); tagBurst(q, t, sh.t0 + 0.4, ROOMTAGS, { step: 0.06, s: 0.75, a: 0.75 }); });
  textFlood(g, t, sm(t, sh.t0, sh.t1) * 0.7, 11);
};
DRAW.night2 = (g, t, sh) => {
  drawSet(g, 'bedroomN', { x: 900, y: 520, z: 1.4 }, t, (q) => {
    nightBed(q, t, { wide: 0.7 });
    // a star dies, far away, through the window
    const k = sm(t, Wd('n_night', 'star') - 0.3, Wd('n_night', 'star') + 0.5); q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 560, 330, 30 + 160 * k, 'rgba(200,220,255,0.9)', k * (1 - sm(t, Wd('n_night', 'away'), Wd('n_night', 'away') + 1.5))); q.restore();
    tag(q, 560, 330, { t0: Wd('n_night', 'star') - 0.2, label: 'A star · dying right now', value: '61 million light-years away', dx: 60, dy: -60, s: 1 });
    tag(q, 1150, 470, { t0: Wd('n_night', 'heartbeat') - 0.2, noDot: true, label: 'Heartbeats on Earth', value: '10,140,000,000 / second', dx: 120, dy: -280, s: 1 });
  });
  textFlood(g, t, 0.85, 12);
};
DRAW.night3 = (g, t, sh) => {
  drawSet(g, 'bedroomN', { x: 1110, y: 640, z: 2.2 + 0.1 * U(t, sh) }, t, (q) => {
    nightBed(q, t, { wide: 0.2, open: 0.75, mouth: 'wavy' });
    tag(q, 775, 740, { t0: sh.t0 + 0.4, label: 'Awake', value: '4 days, 3 hours', dx: -40, dy: -260, s: 1.0 });
  });
  textFlood(g, t, 0.6, 13);
};
/* =========================== SATURDAY NIGHT =========================== */
const CARX = 1320;
function carX(t) { return t < T.carIn ? 2900 : lerp(2900, CARX, eOut(cl((t - T.carIn) / (T.carStop - T.carIn)))); }
DRAW.carArrive = (g, t, sh) => {
  const out = sm(t, T.carStop + 1.2, T.carStop + 1.6), walkK = cl((t - T.carStop - 1.6) / 2.4);
  drawSet(g, 'houseNight', { x: 1100, y: 780, z: 1.0 }, t, (q) => {
    // you at your window upstairs
    q.save(); q.beginPath(); q.rect(366, 346, 208, 178); q.clip(); hero(q, t, { x: 470, y: 640, h: 300, f: 1, p: pose(POSES.relaxed), eyes: { lx: 0.6, ly: 0.7 }, mouth: 'flat', brow: 0.6, shadow: false }); q.restore();
    if (out > 0) agent(q, t, { x: lerp(CARX - 120, 1000, eIO(walkK)), y: lerp(1015, 960, eIO(walkK)), h: 430, f: -1, p: walkK > 0 && walkK < 1 ? walk(t, 6) : pose(POSES.clasp), eyes: { lx: 0.3, ly: -0.3 }, mouth: 'flat' });
  }, { after: (q) => {
    blackCar(q, carX(t), 1180, 1.1, -1, 1 - sm(t, T.carStop + 0.8, T.carStop + 1.4) * 0.6, t);
    tag(q, carX(t), 1060, { t0: Wd('n_car', 'black') - 0.1, kind: 'odds', label: 'Black car · here at 9:00 p.m.', odds: 99, dx: 60, dy: -260, s: 1.05 });
  } });
};
function porch(q, t, o = {}) {
  // the doorway lit from inside, you in it; the agent on the steps
  q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 890, 760, 260, 'rgba(255,200,130,0.6)'); q.restore();
  q.fillStyle = '#ffd7a0'; q.fillRect(820, 650, 140, 230);
  hero(q, t, { x: 885, y: 880, h: 400, f: 1, rim: 1, rimCol: '#ffcf8a', p: pose(o.youP || POSES.relaxed), eyes: { lx: 0.5, ly: -0.1, wide: o.wide ?? 0.3 }, mouth: 'flat', brow: 0.6 });
  agent(q, t, { x: 1110, y: 935, h: 440, f: -1, p: pose(o.agentP || POSES.clasp), eyes: { lx: 0.4 }, mouth: 'flat' });
}
DRAW.door = (g, t, sh) => { drawSet(g, 'houseNight', { x: 990, y: 700, z: 1.95 }, t, (q) => { porch(q, t); }); };
DRAW.agentCU = (g, t, sh) => {
  drawSet(g, 'houseNight', { x: 1090, y: 590, z: 3.4 + 0.2 * U(t, sh) }, t, (q) => { porch(q, t, { agentP: t > Wd('g_tonight', 'midnight') - 0.6 ? POSES.offerOne : POSES.clasp }); }, { farBlur: 6 });
};
DRAW.agentTags = (g, t, sh) => {
  setBlur(g, 'houseNight', { x: 1150, y: 620, z: 1.6 }, t, 0.2); camK(g, { x: 960, y: 540, z: 1 }, 1, t);
  agent(g, t, { x: 1250, y: 1120, h: 720, f: -1, p: pose(POSES.clasp), eyes: { lx: 0.5 }, mouth: 'flat' });
  hero(g, t, { x: 520, y: 1380, h: 1000, f: 1, back: true, p: pose(POSES.relaxed), shadow: false });
  tag(g, 1250, 420, { t0: Wd('n_know', 'everything') - 0.2, label: 'Her file on you', value: '412 pages', dx: 120, dy: -140, s: 1.15 });
  tag(g, 1250, 420, { t0: Wd('n_know', 'cures') - 0.2, label: 'The cures', value: 'not interested', dx: 150, dy: 10, s: 1.15 });
  tag(g, 1250, 420, { t0: Wd('n_know', 'secrets') - 0.2, label: 'What they want', value: 'the secrets', dx: 150, dy: 150, s: 1.15 });
};
DRAW.carDoor = (g, t, sh) => {
  drawSet(g, 'houseNight', { x: CARX, y: 900, z: 2.0 }, t, (q) => {}, { after: (q) => {
    blackCar(q, CARX, 1180, 1.1, -1, 0.4, t);
    // the back door hangs open: a dark inside, a small red light
    q.fillStyle = '#05060a'; q.beginPath(); q.moveTo(CARX - 10, 1090); q.lineTo(CARX + 80, 1090); q.lineTo(CARX + 80, 1160); q.lineTo(CARX - 10, 1160); q.fill(); q.fillStyle = '#2a2d38'; q.beginPath(); q.moveTo(CARX + 80, 1090); q.lineTo(CARX + 190, 1070); q.lineTo(CARX + 190, 1180); q.lineTo(CARX + 80, 1160); q.fill();
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, CARX + 30, 1110, 50, 'rgba(255,60,40,0.7)'); q.restore();
    tag(q, CARX + 30, 1110, { t0: Wd('n_know', 'if') - 0.2, kind: 'odds', label: 'If you get in · you never come home', odds: 99, dx: -80, dy: -230, s: 1.15 });
  } });
};
/* =========================== THE CHOICE =========================== */
function edgeOfBed(q, t, o = {}) {
  bedProps(q, t);
  duvet(q, t, false);
  hero(q, t, { x: 1250, y: 1060, h: 540, f: -1, rim: 1, rimCol: '#9fb8ff', p: pose(POSES.sitEdge), eyes: { lx: o.lx ?? 0.2, ly: o.ly ?? 0.6, open: o.open ?? 1 }, mouth: o.mouth || 'flat', brow: o.brow ?? 0.7 });
}
function cards(g, t, dim = 0) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const A = (t0) => sm(t, t0 - 0.1, t0 + 0.3) * (1 - dim * 0.5), d = eIO(dim), y = 330 - 165 * d, sc = 1 - 0.38 * d, X = (x) => 960 + (x - 960) * (1 - 0.3 * d);
  optionCard(g, X(470), y, 400, 300, 'RUN', 'caught', '99%', A(T.c1), { scale: sc, strike: sm(t, T.c1 + 1.1, T.c1 + 1.5) });
  optionCard(g, 960, y, 400, 300, 'HIDE', 'found', '98%', A(T.c2), { scale: sc, strike: sm(t, T.c2 + 1.1, T.c2 + 1.5) });
  optionCard(g, X(1450), y, 400, 300, 'GO WITH THEM', 'never see your family again', '100%', A(T.c3), { scale: sc, oddsCol: '#ff7a6a', strike: sm(t, T.c3 + 2.0, T.c3 + 2.4) });
}
DRAW.odds1 = (g, t, sh) => { drawSet(g, 'bedroomN', { x: 1150, y: 700, z: 1.3 }, t, (q) => { edgeOfBed(q, t); }); cards(g, t); };
DRAW.odds2 = (g, t, sh) => { drawSet(g, 'bedroomN', { x: 1200, y: 640, z: 1.6 + 0.1 * U(t, sh) }, t, (q) => { edgeOfBed(q, t, { brow: 0.9 }); }); cards(g, t); };
DRAW.forget = (g, t, sh) => {
  drawSet(g, 'bedroomN', { x: 1200, y: 640, z: 1.7 }, t, (q) => { edgeOfBed(q, t, { ly: -0.4, lx: 0.4 }); });
  const a = sm(t, T.c4 - 0.2, T.c4 + 0.4); cards(g, t, a);
  g.setTransform(1, 0, 0, 1, 0, 0); optionCard(g, 960, 420, 560, 240, 'FORGET IT ALL', 'every cure · every answer · gone', null, a, { glow: true });
};
DRAW.forget2 = (g, t, sh) => {
  const goneK = sm(t, Wd('n_forget', 'gone') - 0.1, Wd('n_forget', 'gone') + 0.15) * (1 - sm(t, Wd('n_forget', 'gone') + 0.6, Wd('n_forget', 'gone') + 0.9));
  drawSet(g, 'bedroomN', { x: 1060, y: 560, z: 1.02 }, t, (q) => {
    edgeOfBed(q, t, { ly: -0.6, lx: 0.5 });
    tagBurst(q, t, sh.t0 - 2, ROOMTAGS.concat([[1500, 250, 'Cure', 'pancreatic cancer', 30, -60], [300, 300, 'Answer', 'why we dream', 30, -60], [1900, 700, 'Answer', 'what\'s inside a black hole', -40, -80]]), { s: 0.8, a: 0.85 * (1 - goneK) * (0.75 + 0.25 * Math.sin(t * 13) * sm(t, Wd('n_forget', 'every') - 0.2, Wd('n_forget', 'gone'))) });
  });
};
DRAW.laptop = (g, t, sh) => {
  setBlur(g, 'houseNight', { x: 600, y: 520, z: 1.4 }, t, 0.35); g.setTransform(1, 0, 0, 1, 0, 0);
  // inside the black car: the window frame, the agent in profile, the laptop
  g.save(); rr(g, 140, 120, 1080, 520, 80); g.rect(W, 0, -W, H); g.fillStyle = '#05060a'; g.fill('evenodd'); g.restore();
  g.fillStyle = 'rgba(0,0,10,0.35)'; rr(g, 140, 120, 1080, 520, 80); g.fill();
  g.strokeStyle = 'rgba(140,170,220,0.25)'; g.lineWidth = 6; rr(g, 140, 120, 1080, 520, 80); g.stroke();
  g.save(); g.globalAlpha = 0.18; g.strokeStyle = '#ffffff'; g.lineWidth = 30; g.beginPath(); g.moveTo(420, 140); g.lineTo(260, 620); g.moveTo(520, 140); g.lineTo(380, 620); g.stroke(); g.restore();
  const look = t > Wd('n_comp', 'nobody') - 0.2;
  const A = agent(g, t, { x: 1420, y: 1260, h: 900, f: look ? -1 : -1, rim: -1, rimCol: '#8fc8ff', p: pose(POSES.clasp), eyes: look ? { lx: 0.6, ly: -0.6 } : { lx: 0.6, ly: 0.8 }, mouth: 'flat', shadow: false });
  // the laptop
  g.save(); g.translate(1060, 760); g.fillStyle = '#1a1c24'; g.beginPath(); g.moveTo(-260, 120); g.lineTo(260, 120); g.lineTo(220, 160); g.lineTo(-220, 160); g.fill();
  g.fillStyle = '#22252f'; g.beginPath(); g.moveTo(-250, 120); g.lineTo(-210, -200); g.lineTo(230, -200); g.lineTo(250, 120); g.fill();
  vgrad(g, -200, -184, 420, 290, [[0, '#0b1c34'], [1, '#08142a']]);
  txt(g, 'SUBJECT 17 · PREDICTION', -180, -140, `700 20px ${SANS}`, KN.cyan, 'left');
  txt(g, 'WILL GET IN THE CAR', -180, -96, `700 26px ${SANS}`, '#ffffff', 'left');
  const n = t < T.n99 - 0.2 ? Math.floor(40 + (t - sh.t0) * 30) : 99.2; txt(g, (typeof n === 'number' && n < 99 ? n : 99.2) + '%', -180, -10, `700 80px ${SERIF}`, PAL.amber, 'left');
  g.fillStyle = '#16304e'; g.fillRect(-180, 30, 380, 14); g.fillStyle = PAL.amber; g.fillRect(-180, 30, 380 * Math.min(0.992, (t < T.n99 - 0.2 ? (40 + (t - sh.t0) * 30) : 99.2) / 100), 14);
  txt(g, 'NOBODY GIVES IT UP', -180, 84, `600 18px ${SANS}`, '#9fb6dc', 'left');
  g.restore(); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 1160, 820, 500, 'rgba(90,160,255,0.35)'); g.restore();
};
DRAW.firstQ = (g, t, sh) => {
  drawSet(g, 'bedroomN', { x: 1230, y: 640, z: 2.1 + 0.25 * U(t, sh) }, t, (q) => {
    edgeOfBed(q, t, { ly: 0.2, lx: 0.4, brow: 0.5 });
    tag(q, 1225, 430, { t0: T.qBig - 0.3, kind: 'q', s: 1.2 + 0.4 * sm(t, T.qBig, E('n_first2')) });
  });
};
DRAW.silenceA = (g, t, sh) => {
  // every tag in the room goes out, one by one; you close your eyes
  drawSet(g, 'bedroomN', { x: 1080, y: 580, z: 1.05 - 0.03 * U(t, sh) }, t, (q) => {
    edgeOfBed(q, t, { open: 1 - sm(t, sh.t0 + 1.2, sh.t0 + 2.0), brow: 0.2 });
    ROOMTAGS.forEach((L, i) => tag(q, L[0], L[1], { t0: sh.t0 - 5, t1: sh.t0 + 0.4 + i * 0.28, fo: 0.5, label: L[2], value: L[3], dx: L[4], dy: L[5], s: 0.8, a: 0.85 }));
    tag(q, 1225, 560, { t0: sh.t0 - 5, kind: 'q', s: 1.1 });
  });
};
DRAW.silenceB = (g, t, sh) => {
  drawSet(g, 'bedroomN', { x: 775, y: 720, z: 3.6 }, t, (q) => {
    bedProps(q, t);
    // the clock face, close: 11:59 → 12:00
    const secLeft = T.mid - t, m = secLeft > 0 ? 59 : 0, s = secLeft > 0 ? 60 - secLeft : 0;
    q.save(); q.translate(775, 800 - 62 * 0.62); clockFace(q, 0, 0, 44 * 0.62 * 0.98, secLeft > 0 ? 11 : 12, m + (secLeft > 0 ? s / 60 : 0), s); q.restore();
    tag(q, 775, 740, { t0: sh.t0 - 5, t1: T.mid, fo: 0.6, label: 'Midnight in', value: secLeft > 0 ? `${Math.ceil(secLeft)} s` : '0 s', dx: 60, dy: -110, s: 1.0, type: false });
  });
};
DRAW.black = (g, t, sh) => { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); };
/* =========================== SUNDAY =========================== */
DRAW.sunday = (g, t, sh) => {
  const op = sm(t, Wd('n_sun', 'open') - 0.1, Wd('n_sun', 'open') + 0.3), up = sm(t, Wd('n_sun', 'eyes') + 0.2, Wd('n_sun', 'eyes') + 0.8);
  drawSet(g, 'bedroom', { x: 1060, y: 600, z: 1.25 - 0.15 * eOut(U(t, sh)) }, t, (q) => {
    bedProps(q, t, { ring: t < Wd('n_sun', 'open') ? 1 : 0 });
    if (up < 0.5) { bedHead(q, t, 0.08 + 0.92 * op, 0, { lx: Math.sin(t * 2) * 0.5, ly: -0.4, mouth: 'flat' }); duvet(q, t, false); }
    else { hero(q, t, { x: 1150, y: 905, h: 520, f: 1, rim: -1, p: pose(POSES.sitBedLook), eyes: { lx: Math.sin(t * 1.2) * 0.7, ly: -0.5 }, mouth: 'smile', brow: 0.2 }); duvet(q, t, true); }
  });
};
DRAW.ceiling = (g, t, sh) => { drawSet(g, 'bedroom', { x: 1700, y: 270, z: 2.3 + 0.1 * U(t, sh) }, t, (q) => { bedProps(q, t); }); };
DRAW.toast2 = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 1330, y: 560, z: 1.7 }, t, (q) => {
    const u = t - T.pop2; toaster(q, TOAST.x, TOAST.y, 1, t, t >= T.pop2 ? u : -1, t >= T.pop2 ? Math.max(0, u) : 0);
    mom(q, t, { x: 1540, y: 1010, h: 560, p: t > T.pop2 ? pose(POSES.surprised) : pose({ lSh: 0.6, lEl: 0.9, rSh: 0.7, rEl: 0.8 }), eyes: { lx: 0.4, ly: 0.3, wide: t > T.pop2 ? 0.5 : 0 }, brow: t > T.pop2 ? 0.5 : undefined });
  });
};
DRAW.laugh = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 980, y: 545, z: 1.1 }, t, (q) => {
    toaster(q, TOAST.x, TOAST.y, 1, t, 3, Math.max(0, t - T.pop2));
    mom(q, t, { x: 1540, y: 1010, h: 560, p: pose(POSES.crossed), eyes: { lx: -0.7, ly: 0.1 }, brow: 0.7, mouth: 'wavy' });
    maya(q, t, { x: 1010, y: 1010, h: 520, f: -1, p: pose(POSES.crossed), eyes: { lx: -0.6, open: 0.6 }, mouth: 'smirk' });
    const sh2 = Math.sin(t * 22) * 0.06;
    hero(q, t, { x: 640, y: 1010, h: 560, f: 1, rim: -1, p: pose(Object.assign({}, POSES.laughBig, { lean: -0.18 + sh2, tilt: -0.45 + sh2 })), eyes: { open: 0.2 }, mouth: 'open', brow: -0.2 });
  });
};
DRAW.hand = (g, t, sh) => {
  drawSet(g, 'kitchen', { x: 820, y: 520, z: 1.8 }, t, (q) => {
    hero(q, t, { x: 640, y: 1010, h: 560, f: 1, rim: -1, p: pose(POSES.relaxed), eyes: { lx: 0.6 }, mouth: 'smile' });
    maya(q, t, { x: 1010, y: 1010, h: 520, f: -1, p: pose(POSES.behindBack), eyes: { lx: 0.6, open: 0.8 }, mouth: 'smirk', brow: -0.3 });
  });
};
DRAW.good = (g, t, sh) => {
  const give = sm(t, T.good, T.good + 0.5);
  drawSet(g, 'kitchen', { x: 820, y: 520, z: 1.8 }, t, (q) => {
    hero(q, t, { x: 640, y: 1010, h: 560, f: 1, rim: -1, p: pose(t > S('s_good') + 0.4 ? POSES.holdFront : POSES.shrug), eyes: { lx: 0.6 }, mouth: t > S('s_good') ? 'smile' : 'flat', brow: 0.3 });
    const M = maya(q, t, { x: 1010, y: 1010, h: 520, f: -1, p: give > 0 ? mixPose(pose(POSES.behindBack), pose(POSES.offerOne), give) : pose(POSES.behindBack), eyes: { lx: 0.6 }, mouth: 'smile', brow: 0.2 });
    if (give > 0.3) { q.fillStyle = '#2a1a12'; q.save(); q.translate(M.rHand[0], M.rHand[1] - 20); q.rotate(-0.2); rr(q, -26, -34, 52, 60, 10); q.fill(); q.fillStyle = '#4a2a1a'; q.fillRect(-20, -26, 40, 8); q.restore(); }
  });
};
DRAW.gone = (g, t, sh) => {
  drawSet(g, 'houseDay', { x: 1150, y: 640, z: 1.08 + 0.04 * U(t, sh) }, t, (q) => {
    hero(q, t, { x: 900, y: 880, h: 360, f: 1, p: pose(POSES.holdFront), eyes: { lx: 0.6, ly: 0.4 }, mouth: 'smile' });
    q.fillStyle = '#2a1a12'; rr(q, 925, 735, 30, 34, 6); q.fill();
  }, { after: (q) => { q.strokeStyle = 'rgba(20,20,26,0.35)'; q.lineWidth = 16; for (const d of [-1, 1]) { q.beginPath(); q.moveTo(CARX - 400, 1170 + d * 40); q.quadraticCurveTo(CARX, 1180 + d * 40, CARX + 600, 1240 + d * 30); q.stroke(); } } });
};
DRAW.pillow = (g, t, sh) => {
  const lift = sm(t, Wd('n_note', 'pillow') - 0.4, Wd('n_note', 'pillow') + 0.3);
  drawSet(g, 'bedroom', { x: 1060, y: 720, z: 2.6 }, t, (q) => {
    duvet(q, t, true);
    note(q, 1050, 760, 0.42, -0.08, 1);
    // the pillow lifts
    q.save(); q.translate(1055, 745 - lift * 120); q.rotate(-lift * 0.25); box(q, -115, -45, 230, 90, '#f7f3ec', { r: 40, lit: 0.03, dark: 0.15 }); q.restore();
    if (lift > 0) { sleeve(q, [1500, 1200], [1180, 760 - lift * 120], PAL.hero, 46); fist(q, 1170, 750 - lift * 120, 26); }
  });
};
DRAW.cta = (g, t, sh) => {
  drawSet(g, 'bedroom', { x: 1050, y: 760, z: 3.6 + 0.3 * U(t, sh) }, t, (q) => {
    duvet(q, t, true);
    note(q, 1050, 760, 0.42, -0.08, 1);
  });
};

/* =========================== THE FILM =========================== */
const NIGHT = ['night1', 'night2', 'night3', 'carArrive', 'door', 'agentCU', 'agentTags', 'carDoor', 'odds1', 'odds2', 'forget', 'forget2', 'laptop', 'firstQ', 'silenceA', 'silenceB', 'black', 'priceSofa', 'joke', 'movie', 'giftIn', 'giftTag', 'unwrap', 'knew', 'any', 'viral'];
const SPACE = ['earth', 'moon', 'sunCore', 'edge', 'diceRoll'];
const SUNDAY = ['sunday', 'ceiling', 'toast2', 'laugh', 'hand', 'good', 'gone', 'pillow', 'cta'];
const KEF = {
  duration: KET.duration,
  draw(g, t) { const sh = shotAt(t); KEF._shot = sh; TAGQ.length = 0; g.save(); DRAW[sh.id](g, t, sh); g.restore(); flushTags(g, t); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; },
  post(t) {
    const sh = shotAt(t); let fade = 0, flash = 0;
    if (t < 0.3) fade = 1 - t / 0.3;
    if (t > KET.duration - 1.2) fade = Math.max(fade, sm(t, KET.duration - 1.2, KET.duration - 0.1));
    if (sh.id === 'roomBurst' && t > T.know) flash = Math.max(0, 0.5 - (t - T.know) * 1.5);
    if (sh.id === 'earth') fade = Math.max(fade, 1 - sm(t, sh.t0, sh.t0 + 0.3));
    if (sh.id === 'silenceB') fade = Math.max(fade, sm(t, T.dark - 0.4, T.dark + 0.55));
    if (sh.id === 'black') fade = 1 - sm(t, sh.t1 - 0.3, sh.t1);
    if (sh.id === 'sunday') fade = Math.max(fade, 1 - sm(t, sh.t0, sh.t0 + 0.8));
    if (sh.id === 'forget2') { const gk = Wd('n_forget', 'gone'); fade = Math.max(fade, 0.55 * sm(t, gk - 0.1, gk + 0.15) * (1 - sm(t, gk + 0.6, gk + 0.9))); }
    const night = NIGHT.includes(sh.id), space = SPACE.includes(sh.id), sunday = SUNDAY.includes(sh.id);
    const P = { fade, flash, vignette: night ? 0.7 : space ? 0.6 : 0.5, bloom: space ? 0.55 : night ? 0.5 : ['kitWide', 'toasterTag', 'youToast', 'momPop', 'mayaText', 'mayaSecret', 'party', 'momParty', 'kill', 'lesson', 'toast2', 'laugh', 'hand', 'good', 'labWide', 'labQ', 'write', 'reads', 'simple'].includes(sh.id) ? 0.2 : 0.38 };
    if (sunday) { P.wash = ['rgba(255,214,150,1)', 'rgba(255,170,120,1)']; P.washA = 0.2; }
    else if (night) { P.wash = ['rgba(80,110,220,1)', 'rgba(150,90,200,1)']; P.washA = 0.22; }
    else if (space) { P.wash = ['rgba(90,110,220,1)', 'rgba(255,150,110,1)']; P.washA = 0.12; }
    else { P.wash = ['rgba(140,190,240,1)', 'rgba(255,170,120,1)']; P.washA = 0.14; }
    return P;
  },
};
