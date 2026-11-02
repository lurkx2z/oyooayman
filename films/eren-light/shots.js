/* =====================================================================
   SHOTS — the edit of "Would Eren and Light agree?", placed on the voices' word times (window.KET from
   build-timing.cjs). Cold open (the notebook, the giants), the title, the meeting at the midnight station, four
   rounds, the verdict, and the forty-second countdown (exact: the name is finished at KET.T.written and the
   narrator's "Forty" lands 40.0 s later). About 90 shots of ~4 s.
   ===================================================================== */

const S = (id) => KET.clips[id].start, E = (id) => KET.clips[id].end;
function Wd(id, w, n = 0) {
  const N = (x) => x.w.toLowerCase().replace(/[^a-z0-9']/g, ''), q = w.toLowerCase();
  let L = KET.clips[id].words.filter((x) => N(x).replace(/'s$/, '') === q);
  if (!L.length) L = KET.clips[id].words.filter((x) => N(x).startsWith(q));
  if (!L[n]) throw new Error(`word "${w}" not in ${id}`); return L[n].s;
}
const T = {};
T.write0 = 0.15; T.write1 = Wd('n_open', 'name') + 0.4;
T.fast0 = Wd('n_open', 'forty') - 0.1;
T.grab = Wd('n_open', 'grabs'); T.fall = Wd('n_open', 'falls');
T.shake = Wd('n_open2', 'shake');
T.title = S('n_title');
T.door = Wd('n_eren', 'opens');
T.giant15 = Wd('n_eren', 'giant');
T.every = Wd('n_eren', 'every');
T.collideA = Wd('n_rules', 'collide');
T.stamp1 = Wd('n_agree1', 'agree');
T.eighty = S('e_eighty');
T.stand = S('l_monster') - 0.1;
T.stamp2 = Wd('n_same', 'agree');
T.erenStand = S('e_wall') + 0.3;
T.crack = Wd('n_break', 'break');
T.stamp4 = E('n_r4b') - 0.3;
T.click = KET.T.written - Math.ceil(KET.T.written - Wd('n_click', 'one'));   // the clock's ticks fall on the countdown's seconds
T.moves = Wd('n_click', 'move');
T.open = Wd('n_write', 'opens');
T.wr0 = Wd('n_write', 'knows'); T.written = KET.T.written;
T.zero = T.written + 40;
T.collideB = Wd('n_collide', 'two');
T.smile = Wd('n_end', 'smiles');
T.out = Wd('n_end', 'lights');
const NAME = 'Eren Yeager';

const SHOTS = [
  // cold open
  ['pen', Wd('n_open', 'one') - 0.15], ['name', T.fast0 - 0.05], ['fast', Wd('n_open', 'other') - 0.25], ['cell', S('n_open2') - 0.35],
  ['shake', Wd('n_open2', 'over') - 0.3], ['horizon', Wd('n_open2', 'millions') - 0.25], ['feet', S('n_two') - 0.35],
  ['twoL', Wd('n_two', 'the', 0) - 0.2], ['twoE', Wd('n_two', 'tonight') - 0.25], ['meet', T.title - 0.35],
  ['title', S('n_station') - 0.3],
  // the meeting
  ['stWide', Wd('n_station', 'rain') - 0.25], ['roof', Wd('n_station', 'and') - 0.2], ['clockCU', S('n_light') - 0.3],
  ['lightIn', Wd('n_light', 'neat') - 0.2], ['lightTags', Wd('n_light', 'in', 1) - 0.25], ['bag', Wd('n_light', 'write') - 0.2], ['rule', S('n_eren') - 0.3],
  ['door', Wd('n_eren', 'eren') - 0.2], ['erenWalk', Wd('n_eren', 'he') - 0.2], ['titan', Wd('n_eren', 'and', 0) - 0.2], ['command', S('l_late') - 0.3],
  ['late', S('e_knew') - 0.2], ['knew', S('n_future') - 0.3], ['future', S('n_rules') - 0.3], ['rules', Wd('n_rules', 'eren') - 0.25], ['rulesB', Wd('n_rules', 'remember') - 0.25], ['rulesC', S('n_r1') - 0.4],
  // round 1
  ['r1', S('l_rotten') - 0.3], ['l1', Wd('l_rotten', 'murderers') - 0.2], ['court', Wd('l_rotten', 'someone') - 0.25], ['l1b', S('e_cage') - 0.3],
  ['e1', Wd('e_cage', 'walls') - 0.2], ['walls', Wd('e_cage', 'and') - 0.2], ['map', S('n_r1b') - 0.3],
  ['nod', Wd('n_r1b', 'two') - 0.25], ['alone', Wd('n_r1b', 'not') - 0.25], ['them', S('n_agree1') - 0.3], ['agree1', S('n_r2') - 0.5],
  // round 2
  ['r2', S('l_guilty') - 0.3], ['l2', Wd('l_guilty', 'since') - 0.2], ['screens', Wd('l_guilty', 'people') - 0.25], ['afraid', S('n_r2b') - 0.3],
  ['eSilent', S('e_eighty') - 0.3], ['e80', S('n_eighty') - 0.2], ['globe', Wd('n_eighty', 'cities') - 0.2], ['foot', Wd('n_eighty', 'kids') - 0.2],
  ['kid', Wd('n_eighty', 'crushed') - 0.25], ['march', S('l_monster') - 0.3], ['monster', S('n_bag') - 0.2], ['hand', S('e_agents') - 0.3],
  ['eAgents', Wd('e_agents', 'agents') + 0.1], ['agents', S('l_inway') - 0.25], ['inway', S('e_mine') - 0.25], ['mine', S('n_same') - 0.35],
  ['mirror', Wd('n_same', 'same') - 0.25], ['size', Wd('n_same', 'on') - 0.25], ['agree2', S('n_r3') - 0.5],
  // round 3
  ['r3', S('l_god') - 0.3], ['god', Wd('l_god', 'and', 0) - 0.25], ['godFace', S('n_r3b') - 0.3], ['eChange', S('e_wall') - 0.3],
  ['eWall', Wd('e_wall', 'that\'s') - 0.25], ['wallTop', S('l_burn') - 0.3], ['burn', S('e_free') - 0.2], ['free', S('n_break') - 0.3],
  ['strings', T.crack - 0.4], ['clash3', S('n_r4') - 0.5],
  // round 4
  ['r4', S('l_win') - 0.3], ['throne', S('e_lose') - 0.3], ['heroes', S('n_r4b') - 0.3], ['puzzled', Wd('n_r4b', 'and') - 0.25], ['cage', S('n_verdict') - 0.4],
  ['board', Wd('n_verdict', 'two') - 0.25], ['oneWorld', S('n_click') - 0.4],
  // the countdown
  ['tick', T.moves - 0.3], ['moving', S('n_write') - 0.3], ['decide', T.open - 0.3], ['opens', T.wr0 - 0.3], ['writing', T.written + 0.35],
  ['forty', S('n_forty') - 0.3], ['heart', Wd('n_forty', 'that\'s') - 0.25], ['failed', S('e_seen') - 0.35], ['seen', S('n_collide') - 0.3],
  ['collide', E('n_collide') + 0.6], ['sA', E('n_collide') + 4.2], ['sB', E('n_collide') + 7.6], ['sC', E('n_collide') + 10.6], ['sD', E('n_collide') + 13.4], ['sE', T.zero - 0.12],
  ['zero', S('n_end') - 0.3], ['look', T.out - 0.3], ['dark', S('n_cta') - 0.6], ['cta', 1e9],
].reduce((acc, [id, t1]) => { acc.push({ id, t0: acc.length ? acc[acc.length - 1].t1 : -1, t1 }); return acc; }, []);
const shotAt = (t) => SHOTS.find((s) => t < s.t1) || SHOTS[SHOTS.length - 1];
const U = (t, sh) => cl((t - sh.t0) / (Math.min(sh.t1, KET.duration) - sh.t0));

/* ---------- the station and its cast ---------- */
const LX0 = 930, EX0 = 1430;   // where Light and Eren sit
function clockSec(t) { return t < T.click ? -0.4 + Math.sin(t * 9) * 0.25 * (t > T.click - 3 ? 1 : 0.3) : Math.floor(t - T.click) + 1 + eOut(((t - T.click) % 1) / 0.12) * 0; }
function station(g, t, C, cast, o = {}) {
  drawSet(g, 'station', C, t, (q) => {
    stationClock(q, CLOCK.x, CLOCK.y, CLOCK.r, clockSec(t));
    if (cast) cast(q);
  }, Object.assign({ beforeBack: (q) => rainFx(q, t, LX, LY, LW, 1100, 260, 0.55, 0.15, 3) }, o));
}
const LIGHT_SIT = (t, o = {}) => (q) => light(q, t, Object.assign({ x: LX0, y: 1000, h: 560, f: 1, p: pose(POSES.sitBack), ld: -1, look: { lx: 0.5 } }, o));
const EREN_SIT = (t, o = {}) => (q) => eren(q, t, Object.assign({ x: EX0, y: 1000, h: 575, f: -1, p: pose(POSES.sitHands), ld: 1, wet: true, look: { lx: 0.4 } }, o));
function both(t, lo = {}, eo = {}) { return (q) => { if (lo !== null) LIGHT_SIT(t, lo)(q); if (eo !== null) EREN_SIT(t, eo)(q); }; }
// head positions of the seated pair (for close-ups)
const LH_ = { x: 952, y: 640 }, EH_ = { x: 1408, y: 632 };
const cuL = (t, sh, z = 3.4, dz = 0.25) => ({ x: LH_.x + 70, y: LH_.y + 40, z: z + dz * U(t, sh) });
const cuE = (t, sh, z = 3.4, dz = 0.25) => ({ x: EH_.x - 70, y: EH_.y + 40, z: z + dz * U(t, sh) });


/* ---------- close-ups: the portrait renderer on a manga backdrop ---------- */
// bg: 'tile' (the lit station wall), 'dark' (night, rain), 'tone' (flat screentone), 'lines' (focus lines),
// 'red' / 'green' (a flat accent splash), 'rain'; ots: the other one's shoulder in the foreground
function cuBack(q, t, bg, who, x, y) {
  const fx = who === 'eren' ? -1 : 1;
  if (bg === 'tile' || bg === 'rain') {
    q.fillStyle = '#ebe5d9'; q.fillRect(-400, -300, 2800, 1700);
    q.strokeStyle = 'rgba(20,18,22,0.5)'; q.lineWidth = 4;
    for (let r = 0; r < 18; r++) { const yy = -300 + r * 96; q.beginPath(); q.moveTo(-400, yy); q.lineTo(2400, yy); q.stroke(); for (let c = 0; c < 16; c++) { const xx = -400 + c * 190 + (r % 2) * 95; q.beginPath(); q.moveTo(xx, yy); q.lineTo(xx, yy + 96); q.stroke(); } }
    // the lamp from the side they face, darkness behind them
    const gr = q.createLinearGradient(x - fx * 900, 0, x + fx * 900, 0); gr.addColorStop(0, 'rgba(14,12,18,0.82)'); gr.addColorStop(0.55, 'rgba(14,12,18,0.15)'); gr.addColorStop(1, 'rgba(14,12,18,0)'); q.fillStyle = gr; q.fillRect(-400, -300, 2800, 1700);
    vgrad(q, -400, 700, 2800, 700, [[0, 'rgba(14,12,18,0)'], [1, 'rgba(14,12,18,0.7)']]);
    if (bg === 'rain') { q.fillStyle = 'rgba(14,12,18,0.35)'; for (let i = 0; i < 90; i++) { const xx = hash(i * 3.1) * 2400 - 200, sp = 0.4 + hash(i * 1.7) * 0.5, yy = ((t * sp * 900 + hash(i * 5) * 1700) % 1700) - 300; q.fillRect(xx, yy, 5, 60 + hash(i) * 80); } }
  } else if (bg === 'dark') {
    q.fillStyle = '#121016'; q.fillRect(-400, -300, 2800, 1700);
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, x - fx * 260, y + 60, 640, 'rgba(200,196,210,0.22)'); q.restore();
    q.strokeStyle = 'rgba(235,240,255,0.32)'; q.lineWidth = 2; q.beginPath(); for (let i = 0; i < 120; i++) { const xx = hash(i * 3.1) * 2600 - 300, yy = ((t * (700 + hash(i) * 500) + hash(i * 5) * 1700) % 1700) - 300; q.moveTo(xx, yy); q.lineTo(xx - 10, yy + 50); } q.stroke();
  } else if (bg === 'tone') {
    vgrad(q, -400, -300, 2800, 1700, [[0, '#c9c3b8'], [1, '#77726c']]);
  } else if (bg === 'lines') {
    q.fillStyle = ELK.paper; q.fillRect(-400, -300, 2800, 1700); focusLines(q, x + fx * 120, y - 20, t, { n: 150, r0: 420, a: 0.9, fps: 12 });
  } else if (bg === 'red' || bg === 'green') {
    q.fillStyle = bg === 'red' ? '#cf2229' : '#1aa86a'; q.fillRect(-400, -300, 2800, 1700);
    q.globalAlpha = 0.35; focusLines(q, x + fx * 120, y - 20, t, { n: 110, r0: 520, a: 1, fps: 8, col: '#0d0a0e' }); q.globalAlpha = 1;
  }
}
function otsShoulder(q, t, who, side) {
  // the other one, from behind, out of focus at the frame edge
  const x = side > 0 ? 1960 : -40, y = 600 + Math.sin(t * 1.3) * 6;
  q.save(); q.fillStyle = '#100e12';
  q.beginPath(); q.ellipse(x, y - 60, 250, 290, 0, 0, Math.PI * 2); q.fill();
  q.beginPath(); q.moveTo(x - side * 420, 1200); q.quadraticCurveTo(x - side * 360, 640, x, 600); q.quadraticCurveTo(x + side * 400, 620, x + side * 520, 1200); q.closePath(); q.fill();
  if (who === 'eren') { q.fillStyle = '#0f5c36'; q.beginPath(); q.moveTo(x - side * 400, 1200); q.quadraticCurveTo(x - side * 340, 760, x - side * 200, 700); q.lineTo(x - side * 160, 760); q.quadraticCurveTo(x - side * 300, 820, x - side * 320, 1200); q.closePath(); q.fill(); }
  q.restore();
}
function cu(g, t, sh, who, o = {}, s = {}) {
  const u = U(t, sh), f = who === 'eren' ? -1 : 1;
  const x = s.x ?? (who === 'eren' ? 1180 : 740), y = s.y ?? 470, R = s.R ?? 215;
  const z = lerp(s.z0 ?? 1.0, s.z1 ?? 1.06, eIO(u));
  plate(g, t, { x: s.cx ?? x + f * 60, y: s.cy ?? y + 60, z, drift: s.drift ?? 0.5, rot: s.rot || 0, shake: s.shake || 0 }, [[0, '#000'], [1, '#000']], (q) => {
    cuBack(q, t, s.bg || 'tile', who, x, y);
    if (s.under) s.under(q);
    portrait(q, who, x, y, R, Object.assign({ t, ld: s.ld ?? 1 }, o));
    if (s.ots) otsShoulder(q, t, who === 'eren' ? 'light' : 'eren', -f);
    if (s.over) s.over(q);
  });
}
// a two-shot of the two portraits facing each other
function cu2(g, t, sh, lo = {}, eo = {}, s = {}) {
  const u = U(t, sh), z = lerp(s.z0 ?? 1.0, s.z1 ?? 1.05, eIO(u));
  plate(g, t, { x: 960, y: 560, z, drift: 0.4 }, [[0, '#000'], [1, '#000']], (q) => {
    cuBack(q, t, s.bg || 'tile', 'light', 960, 470);
    if (s.under) s.under(q);
    portrait(q, 'light', s.lx ?? 600, s.y ?? 500, s.R ?? 190, Object.assign({ t, ld: 1 }, lo));
    portrait(q, 'eren', s.ex ?? 1320, s.y ?? 500, s.R ?? 190, Object.assign({ t, ld: 1 }, eo));
    if (s.over) s.over(q);
  });
}
// an extreme close-up on the eyes: a letterboxed manga eye panel
function eyesCU(g, t, sh, who, o = {}, s = {}) {
  const f = who === 'eren' ? -1 : 1, R = s.R ?? 760, ex = 960, ey = 540;
  cu(g, t, sh, who, Object.assign({ talk: 0, blink: false }, o), Object.assign({ x: ex - f * 0.5 * R, y: ey - 0.1 * R, R, cx: 960, cy: 540, z0: 1.0, z1: 1.06 }, s));
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = ELK.paper; g.fillRect(0, 0, W, 330); g.fillRect(0, H - 330, W, 330);
  g.fillStyle = ELK.ink; g.fillRect(0, 0, W, 318); g.fillRect(0, H - 318, W, 318);
  g.strokeStyle = ELK.ink; g.lineWidth = 6; g.strokeRect(-10, 330, W + 20, H - 660);
}
const DRAW = {};
/* =========================== COLD OPEN =========================== */
DRAW.pen = (g, t, sh) => {
  // a macro: the nib touches the page and the first strokes of a name run out from under it
  const u = cl((t - T.write0) / (T.write1 - T.write0)), z = 1.0 + 0.12 * eOut(U(t, sh));
  plate(g, t, { x: 960, y: 540, z, drift: 0.3 }, [[0, '#efe9de'], [1, '#d4ccbf']], (q) => {
    q.strokeStyle = 'rgba(80,110,160,0.35)'; q.lineWidth = 3; for (let y = 140; y < 1100; y += 150) { q.beginPath(); q.moveTo(-200, y); q.lineTo(2200, y); q.stroke(); }
    q.save(); q.globalCompositeOperation = 'source-over'; glow(q, 1100, 420, 900, 'rgba(255,248,230,0.5)'); q.restore();
    // the name, big, in ink, written up to the pen tip
    q.save(); q.font = `italic 400 300px ${SERIF}`; q.textBaseline = 'alphabetic'; const txt2 = 'Kenji', wTot = q.measureText(txt2).width, x0 = 300, y0 = 640;
    q.beginPath(); q.rect(-200, -200, x0 + wTot * u + 200, 1600); q.clip(); q.fillStyle = '#16121a'; q.fillText(txt2, x0, y0); q.restore();
    const tipX = x0 + wTot * u + Math.sin(t * 40) * 4, tipY = 560 - 70 * Math.abs(Math.sin(u * 14)) * (u < 1 ? 1 : 0);
    // a bead of wet ink at the tip
    q.fillStyle = '#16121a'; q.beginPath(); q.arc(tipX, tipY + 30, 14, 0, Math.PI * 2); q.fill();
    nibMacro(q, tipX, tipY + 30, 1.0, t, -0.85);
  });
  if (u > 0.05 && u < 1) sfxOver(g, 'SKRTCH', 1520, 860, 130, -0.12, t);
};
function sfxOver(g, s, x, y, size, rot, t) { g.setTransform(1, 0, 0, 1, 0, 0); sfx(g, s, x + Math.sin(t * 40) * 3, y, size, rot); }
DRAW.name = (g, t, sh) => {
  plate(g, t, { x: 1150, y: 360, z: 2.6 + 0.3 * U(t, sh), drift: 0.4 }, [[0, '#1a171d'], [1, '#2a262c']], (q) => {
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 1100, 380, 700, 'rgba(255,240,215,0.5)'); q.restore();
    notebookOpen(q, 960, 600, 1.35, -0.06, [['Takeshi Ono', 1], ['Mark Delaney', 1]], { text: 'Kenji Moriyama', u: 1 }, t);
  });
};
DRAW.fast = (g, t, sh) => {
  const u = U(t, sh), n = Math.max(0, Math.round(40 - 40 * eIO(u)));
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ece6da'; g.fillRect(0, 0, W, H);
  focusLines(g, 960, 520, t, { n: 140, r0: 300, a: 0.85, fps: 24 });
  g.save(); g.translate(960, 540); const k = 1 + 0.06 * Math.sin(t * 30); g.scale(k, k);
  g.font = `700 420px ${COND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 30; g.strokeStyle = ELK.ink; g.strokeText(String(n).padStart(2, '0'), 0, 0); g.fillStyle = ELK.paper; g.fillText(String(n).padStart(2, '0'), 0, 0);
  g.restore(); g.font = `600 44px ${SANS}`; g.fillStyle = ELK.ink; g.textAlign = 'center'; g.fillText('SECONDS', 960, 830);
};
DRAW.cell = (g, t, sh) => {
  // the other side of the world: a man in a cell grabs his chest and falls
  const grab = sm(t, T.grab - 0.1, T.grab + 0.3), fall = sm(t, T.fall - 0.05, T.fall + 0.5);
  plate(g, t, { x: 960, y: 560, z: 1.15 + 0.15 * U(t, sh), shake: t > T.fall && t < T.fall + 0.4 ? 0.5 : 0 }, [[0, '#3a3740'], [1, '#55525c']], (q) => {
    vgrad(q, -200, 860, 2400, 500, [[0, '#2a282e'], [1, '#3d3a42']]);
    q.fillStyle = '#4a4750'; q.fillRect(-200, -200, 2400, 1060); q.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = -200; y < 860; y += 60) q.fillRect(-200, y, 2400, 3);
    box(q, 1250, 120, 220, 160, '#1d1b21', { r: 4 }); q.fillStyle = '#d8d4cc'; q.fillRect(1270, 140, 180, 120); q.fillStyle = '#1d1b21'; for (let x = 1290; x < 1450; x += 36) q.fillRect(x, 140, 8, 120);
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 1360, 300, 600, 'rgba(255,248,230,0.35)'); q.restore();
    box(q, 300, 760, 520, 90, '#6a666e', { r: 6 }); box(q, 300, 700, 520, 70, '#8a868e', { r: 10 });
    const P = fall > 0 ? mixPose(pose({ lSh: 1.6, lEl: 1.9, rSh: 1.5, rEl: 2.0, lean: 0.4, tilt: 0.4, lHip: 0.6, lKn: 1.2, rHip: 0.3, rKn: 0.9 }), pose({ lean: 1.45, tilt: 0.3, lSh: 2.6, lEl: 0.5, rSh: 2.4, rEl: 0.6, lHip: 1.4, lKn: 0.3, rHip: 1.3, rKn: 0.2 }), fall)
      : mixPose(pose(POSES.relaxed), pose({ lSh: 1.6, lEl: 1.9, rSh: 1.5, rEl: 2.0, lean: 0.25, tilt: 0.35 }), grab);
    drawFig(q, { x: 1050 - fall * 60, y: 900 + fall * 30, h: 640, f: -1, who: 'extra', col: { suit: '#d8d0c0', suitDk: '#a8a090', pants: '#d0c8b8', shirt: '#d8d0c0', tie: '#d8d0c0' }, p: P, ld: 1, t, open: grab > 0.5 ? 1 : 0.8, mouth: grab > 0.3 ? 'open' : 'flat', brow: grab > 0.3 ? 0.9 : 0, look: { lx: 0.2, ly: -0.5 } });
  }, null);
  g.setTransform(1, 0, 0, 1, 0, 0); cellBars(g, -20, 1960, -10, 1100);
  if (t > T.grab && t < T.grab + 0.7) sfxOver(g, 'BA-DUMP', 520, 260, 120, -0.1, t);
};
DRAW.shake = (g, t, sh) => {
  const th = (k) => Math.max(0, 1 - ((t - T.shake + 0.3 - k * 0.9) % 0.9) / 0.35);
  const hit = t > T.shake - 0.3 ? th(0) : 0;
  drawSet(g, 'walls', { x: 980, y: 700, z: 1.3, shake: hit * 0.35 }, t, (q) => {
    // a puddle in the street, rippling with each thud
    q.fillStyle = '#5a4a3c'; q.beginPath(); q.ellipse(1000, 1120, 360, 60, 0, 0, Math.PI * 2); q.fill();
    q.fillStyle = '#c9c2b4'; q.beginPath(); q.ellipse(1000, 1120, 330, 50, 0, 0, Math.PI * 2); q.fill();
    q.strokeStyle = ELK.ink; q.lineWidth = 4; for (let k = 0; k < 4; k++) { if (t < T.shake - 0.3) break; const ph = (((t - T.shake) * 1.1 + k * 0.25) % 1 + 1) % 1; q.globalAlpha = 1 - ph; q.beginPath(); q.ellipse(1000, 1120, 40 + ph * 300, 6 + ph * 46, 0, 0, Math.PI * 2); q.stroke(); } q.globalAlpha = 1;
    // dust falling from the roofs
    for (let i = 0; i < 30; i++) { const ph = (t * 0.8 + hash(i)) % 1; q.fillStyle = 'rgba(40,30,30,0.7)'; q.fillRect(200 + hash(i * 3) * 1600, 380 + ph * 600, 4, 4); }
  });
  if (hit > 0.5) sfxOver(g, 'DOOM', 1500, 220, 150, 0.08, t);
};
DRAW.horizon = (g, t, sh) => {
  drawSet(g, 'plain', { x: 960, y: 640, z: 1.05 + 0.08 * U(t, sh), shake: 0.12 }, t, null, { beforeBack: (q) => {
    giantRow(q, t, LX, LX + LW, 800, 460, 15, 31, { steamA: 0.5, ld: -1 });
    q.save(); q.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) glow(q, 200 + i * 340, 720, 380, 'rgba(255,230,200,0.25)'); q.restore();
  } });
};
DRAW.feet = (g, t, sh) => {
  const ph = (t - sh.t0) / 1.25, down = (k) => eIn(cl((ph - k) * 2.2));
  drawSet(g, 'plain', { x: 960, y: 820, z: 1.6, shake: Math.max(0, 0.5 - ((ph % 1) * 2)) * 0.6 }, t, (q) => {
    giantFoot(q, 720, lerp(-500, 1060, down(0)), 1.25);
    giantFoot(q, 1520, lerp(-500, 1040, down(0.9)), 1.1);
    for (const [k, x] of [[0, 720], [0.9, 1520]]) if (ph > k + 0.45) { const u2 = cl((ph - k - 0.45) * 1.5); for (let i = 0; i < 14; i++) { const a = -Math.PI * (0.1 + 0.8 * hash(i + k * 10)); q.fillStyle = `rgba(30,24,22,${1 - u2})`; q.beginPath(); q.arc(x + Math.cos(a) * u2 * 400, 1060 + Math.sin(a) * u2 * 260, 8 + hash(i) * 10, 0, Math.PI * 2); q.fill(); } steam(q, t, x, 1000, 160, 7 + k, 0.5 * (1 - u2)); }
  });
  if ((ph % 0.9) < 0.25 && ph > 0.4) sfxOver(g, 'DOOM', 960, 240, 180, -0.05, t);
};
DRAW.twoL = (g, t, sh) => {
  // Light on a rooftop over his city at night, the notebook in his hand
  drawSet(g, 'city', { x: 1000, y: 560, z: 1.12 + 0.06 * U(t, sh) }, t, (q) => {
    box(q, 380, 880, 1400, 500, '#1a1a20', { r: 0 }); q.fillStyle = '#f0ebe0'; q.fillRect(380, 876, 1400, 8);
    const F = light(q, t, { x: 1100, y: 880, h: 620, f: 1, p: pose({ lSh: 0.1, lEl: 0.2, rSh: 0.6, rEl: 1.2, tilt: -0.1 }), sil: 1, ld: -1, glow: 0.7, look: { lx: 0.6 } });
    notebookClosed(q, F.rHand[0] + 14, F.rHand[1] - 10, 0.16, 0.3);
  }, { beforeBack: (q) => { bigScreen(q, 300, 120, 520, 300, (s) => { vgrad(s, 300, 120, 520, 300, [[0, '#d8d4cc'], [1, '#b8b4ac']]); s.font = `700 120px ${COND}`; s.textAlign = 'center'; s.fillStyle = ELK.ink; s.fillText('CRIME', 560, 260); s.font = `700 80px ${COND}`; s.fillStyle = ELK.red; s.fillText('↓ 70%', 560, 370); }); } });
};
DRAW.twoE = (g, t, sh) => {
  // Eren on top of the Wall, the giants marching beyond it
  drawSet(g, 'plain', { x: 960, y: 560, z: 1.1 + 0.06 * U(t, sh), shake: 0.1 }, t, (q) => {
    vgrad(q, LX, 860, LW, 600, [[0, '#6e6460'], [1, '#4e4644']]); q.fillStyle = '#3a3230'; q.fillRect(LX, 850, LW, 20);
    eren(q, t, { x: 980, y: 860, h: 640, f: 1, p: pose({ lSh: 0.05, lEl: 0.1, rSh: -0.05, rEl: 0.1, tilt: 0.05 }), sil: 1, ld: -1, glow: 0.8, wind: 1.6 });
  }, { beforeBack: (q) => giantRow(q, t, LX, LX + LW, 780, 380, 12, 57, { steamA: 0.5, ld: -1 }) });
};
DRAW.meet = (g, t, sh) => {
  const u = U(t, sh), sl = eOut(cl(u * 3));
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = ELK.paper; g.fillRect(0, 0, W, H);
  panels(g, t, [
    { poly: [[0, 0], [lerp(-200, 1000, sl), 0], [lerp(-400, 860, sl), H], [0, H]], view: { x: 480, y: 540, s: 1 }, fn: (q) => cu(q, t, sh, 'light', { sil: 1, glow: 1, look: { lx: 0.8 }, talk: 0 }, { bg: 'rain', x: 900, cx: 960, R: 230 }) },
    { poly: [[lerp(2100, 1060, sl), 0], [W, 0], [W, H], [lerp(2300, 920, sl), H]], view: { x: 1440, y: 540, s: 1 }, fn: (q) => cu(q, t, sh, 'eren', { sil: 1, glow: 1, look: { lx: 0.8 }, talk: 0 }, { bg: 'rain', x: 1020, cx: 960, R: 230 }) },
  ], 12);
};
DRAW.title = (g, t, sh) => {
  const u = U(t, sh);
  station(g, t, { x: 1180, y: 600, z: 1.0 + 0.04 * u }, both(t, { sil: 1 }, { sil: 1 }));
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(10,8,12,0.55)'; g.fillRect(0, 0, W, H);
  const a = sm(t, T.title - 0.2, T.title + 0.2), pop = 1 + 0.08 * (1 - eOut((t - T.title) / 0.5));
  g.save(); g.translate(960, 470); g.scale(pop, pop); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `500 70px ${SERIF}`; g.fillStyle = ELK.paper; g.fillText('WOULD', 0, -150);
  g.font = `700 210px ${COND}`; const we = g.measureText('EREN').width, wa = g.measureText(' & ').width, wl = g.measureText('LIGHT').width; const x0 = -(we + wa + wl) / 2;
  g.lineWidth = 16; g.strokeStyle = ELK.ink; g.textAlign = 'left';
  g.strokeText('EREN', x0, 60); g.fillStyle = ELK.green; g.fillText('EREN', x0, 60);
  g.fillStyle = ELK.paper; g.fillText(' & ', x0 + we, 60);
  g.strokeText('LIGHT', x0 + we + wa, 60); g.fillStyle = ELK.red; g.fillText('LIGHT', x0 + we + wa, 60);
  g.textAlign = 'center'; const aa = sm(t, Wd('n_title', 'agree') - 0.1, Wd('n_title', 'agree') + 0.2); g.globalAlpha = a * aa; g.font = `700 150px ${COND}`; g.fillStyle = ELK.paper; g.fillText('AGREE?', 0, 230);
  g.restore();
};
/* =========================== THE MEETING =========================== */
DRAW.stWide = (g, t, sh) => station(g, t, { x: 1180, y: 600, z: 1.18 - 0.14 * eOut(U(t, sh)) }, null);
DRAW.roof = (g, t, sh) => {
  plate(g, t, { x: 960, y: 540, z: 1.0, rot: -0.04 }, [[0, '#08080b'], [1, '#121218']], (q) => {
    q.strokeStyle = '#3a3a44'; q.lineWidth = 16; for (let x = -400; x < 2400; x += 320) { q.beginPath(); q.moveTo(x, -200); q.lineTo(x + 300, 1300); q.stroke(); } for (let y = 0; y < 1200; y += 260) { q.beginPath(); q.moveTo(-200, y); q.lineTo(2200, y - 120); q.stroke(); }
    rainFx(q, t, -300, -200, 2500, 1500, 420, 0.75, 0.25, 9);
    // drops hitting the glass
    for (let i = 0; i < 40; i++) { const ph = (t * 2 + hash(i)) % 1; q.strokeStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; q.lineWidth = 2; q.beginPath(); q.arc(hash(i * 3) * W, hash(i * 7) * H, 4 + ph * 18, 0, Math.PI * 2); q.stroke(); }
  });
};
DRAW.clockCU = (g, t, sh) => station(g, t, { x: CLOCK.x, y: CLOCK.y + 20, z: 3.4 + 0.3 * U(t, sh), drift: 0.3 }, null);
DRAW.lightIn = (g, t, sh) => {
  const u = U(t, sh), k = eOut(cl(u * 1.25)), sitting = u > 0.82;
  station(g, t, { x: 1240 - 60 * u, y: 620, z: 1.15 }, (q) => {
    if (!sitting) light(q, t, { x: lerp(2000, LX0 + 60, k), y: 1012, h: 600, f: -1, p: walkP(t, 7), ld: 1, look: { lx: 0.3 } });
    else light(q, t, { x: LX0, y: 1000, h: 560, f: 1, p: mixPose(pose(POSES.relaxed), pose(POSES.sitBack), sm(u, 0.82, 0.95)), ld: -1, look: { lx: 0.5 } });
  });
};
DRAW.lightTags = (g, t, sh) => {
  station(g, t, { x: 1010, y: 690, z: 2.25 + 0.1 * U(t, sh) }, LIGHT_SIT(t, { mouth: 'smirk', look: { lx: 0.7, ly: 0.1 } }));
  g.setTransform(1, 0, 0, 1, 0, 0);
  const c = (w) => cl((t - Wd('n_light', w) + 0.15) / 0.8);
  callout(g, 760, 760, -160, -260, 'SUIT', 'pressed, perfect', c('neat'));
  callout(g, 1015, 720, 320, -300, 'TIE', 'red', c('red'), { accent: ELK.red, valCol: ELK.red });
  callout(g, 940, 380, 300, -110, 'RANK', '#1 in the country', c('top'));
};
DRAW.bag = (g, t, sh) => {
  const op = sm(t, sh.t0 + 0.3, sh.t0 + 1.2), u = U(t, sh);
  plate(g, t, { x: 960, y: 560, z: 1.0 + 0.08 * u, drift: 0.4 }, [[0, '#e9e3d7'], [1, '#bdb5a8']], (q) => {
    q.fillStyle = '#2a2420'; q.fillRect(-200, 760, 2400, 60); q.fillRect(-200, 860, 2400, 60); q.fillStyle = ELK.ink; q.fillRect(-200, 820, 2400, 40);   // the bench slats
    q.save(); q.globalCompositeOperation = 'source-over'; glow(q, 1000, 560, 520, `rgba(216,38,44,${0.3 + 0.35 * op})`); q.restore();
    // the bag: a dark leather case, its flap lifting
    box(q, 640, 470, 720, 340, '#9a7a5a', { r: 26 }); q.strokeStyle = ELK.ink; q.lineWidth = 6; rr(q, 640, 470, 720, 340, 26); q.stroke();
    q.save(); q.translate(1000, 560 - op * 120); q.rotate(-0.06); notebookClosed(q, 0, 0, 1.05, 0); q.restore();
    q.save(); q.translate(640, 480); q.rotate(-op * 0.5); box(q, 0, -10, 720, 140, '#b08c68', { r: 22 }); q.strokeStyle = ELK.ink; q.lineWidth = 6; rr(q, 0, -10, 720, 140, 22); q.stroke(); q.fillStyle = '#c9b089'; q.fillRect(340, 110, 40, 30); q.restore();
  });
};
DRAW.rule = (g, t, sh) => {
  // the rule, as a manga explainer panel: NAME + FACE → 40 s
  g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#ece6da'], [1, '#d6cfc0']]);
  const a1 = sm(t, Wd('n_light', 'write') - 0.1, Wd('n_light', 'write') + 0.3), a2 = sm(t, Wd('n_light', 'picture') - 0.1, Wd('n_light', 'picture') + 0.3), a3 = sm(t, Wd('n_light', 'dies') - 0.2, Wd('n_light', 'dies') + 0.15);
  g.globalAlpha = a1; notebookOpen(g, 470, 520, 0.62, 0.0, [], { text: 'a name', u: cl((t - Wd('n_light', 'write')) / 0.8) }, t); g.globalAlpha = 1;
  g.globalAlpha = a2; g.save(); g.translate(1010, 520); g.rotate(0.05); g.fillStyle = '#ffffff'; g.fillRect(-150, -190, 300, 360); g.strokeStyle = ELK.ink; g.lineWidth = 5; g.strokeRect(-150, -190, 300, 360);
  g.fillStyle = '#c8c2b6'; g.fillRect(-120, -160, 240, 240); drawFig(g, { x: 0, y: 330, h: 520, f: 1, who: 'extra', p: pose(POSES.relaxed), ld: 1, look: { lx: -0.3 } }); g.restore(); g.globalAlpha = 1;
  g.font = `700 120px ${COND}`; g.textAlign = 'center'; g.fillStyle = ELK.ink; g.globalAlpha = a1; g.fillText('+', 745, 560); g.globalAlpha = a2; g.fillText('=', 1270, 560); g.globalAlpha = 1;
  if (a3 > 0) { g.globalAlpha = a3; g.font = `700 220px ${COND}`; g.fillStyle = ELK.red; g.fillText('40s', 1560, 600); g.font = `600 40px ${SANS}`; g.fillStyle = ELK.ink; g.fillText('HEART STOPS', 1560, 680); g.globalAlpha = 1; }
};
DRAW.door = (g, t, sh) => {
  const op = sm(t, T.door - 0.1, T.door + 0.8);
  station(g, t, { x: 420, y: 720, z: 1.9 - 0.15 * U(t, sh) }, (q) => {
    // the doorway: night and rain outside, a lightning flash, a figure standing in it
    q.save(); q.beginPath(); q.rect(20, 600, 190, 400); q.clip();
    q.fillStyle = t > T.door + 0.25 && t < T.door + 0.45 ? '#f4f0e6' : '#0a0a0e'; q.fillRect(20, 600, 190, 400); rainFx(q, t, 0, 560, 240, 460, 30, 0.7, 0.15, 4);
    if (op > 0.3) eren(q, t, { x: 125, y: 1000, h: 580, f: 1, p: pose(POSES.relaxed), sil: 1, ld: -1, glow: 0.8, wind: 1 });
    q.restore();
    q.save(); q.translate(20, 600); q.scale(1 - op * 0.85, 1); box(q, 0, 0, 190, 400, '#3a2c20', { r: 4, lit: 0.1, dark: 0.35 }); q.restore();
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 115, 820, 400 * op, 'rgba(230,240,255,0.35)'); q.restore();
  });
};
DRAW.erenWalk = (g, t, sh) => {
  const u = U(t, sh), k = eOut(u * 1.05);
  station(g, t, { x: lerp(560, 1200, u), y: 640, z: 1.55 }, (q) => {
    LIGHT_SIT(t, { look: { lx: -0.5, ly: 0 } })(q);
    const x = lerp(240, 1150, k);
    eren(q, t, { x, y: 1015, h: 610, f: 1, p: walkP(t, 5.5, POSES.cloakWalk1, POSES.cloakWalk2), ld: -1, wet: true, wind: 0.9, look: { lx: 0.4 } });
    // wet footprints behind him
    for (let i = 0; i < 8; i++) { const fx = lerp(240, x, i / 8); q.fillStyle = 'rgba(255,255,255,0.25)'; q.beginPath(); q.ellipse(fx, 1018 + (i % 2) * 8, 26, 6, 0, 0, Math.PI * 2); q.fill(); }
  });
  g.setTransform(1, 0, 0, 1, 0, 0);
  const c = (w) => cl((t - Wd('n_eren', w) + 0.15) / 0.8);
  const ex = (lerp(240, 1150, k) - lerp(560, 1200, u)) * 1.55 + 960;
  callout(g, ex + 10, 300, 150, -110, 'HAIR', 'long, tied back', c('long'));
  callout(g, ex - 60, 600, -280, 40, 'CLOAK', 'green', c('green'), { accent: ELK.green, valCol: ELK.green });
};
DRAW.titan = (g, t, sh) => {
  const rise = sm(t, T.giant15 - 0.3, T.giant15 + 1.0);
  plate(g, t, { x: 960, y: 560, z: 1.0 + 0.04 * U(t, sh) }, [[0, '#f1ebdf'], [1, '#d9d2c5']], (q) => {
    q.strokeStyle = 'rgba(20,18,22,0.25)'; q.lineWidth = 2; for (let y = 1000; y > -100; y -= 70.7) { q.beginPath(); q.moveTo(-200, y); q.lineTo(2200, y); q.stroke(); }
    q.fillStyle = ELK.ink; q.fillRect(-200, 1000, 2400, 200);
    q.save(); q.translate(1180, 1000); q.scale(1, rise); q.translate(-1180, -1000); giant(q, t * 0.3, 1180, 1000, 1060, 3, { f: -1, steamA: 0.5, ld: -1, speed: 0.15, sway: 0.2 }); q.restore();
    eren(q, t, { x: 640, y: 1000, h: 120, f: 1, p: pose(POSES.relaxed), sil: 1, ld: -1, glow: 0.8, wind: 0.6, shadow: false });
    q.strokeStyle = ELK.ink; q.lineWidth = 6; q.beginPath(); q.moveTo(1640, 1000); q.lineTo(1640, 1000 - 1060 * rise); q.moveTo(1610, 1000); q.lineTo(1670, 1000); q.moveTo(1610, 1000 - 1060 * rise); q.lineTo(1670, 1000 - 1060 * rise); q.stroke();
    q.beginPath(); q.moveTo(560, 1000); q.lineTo(560, 880); q.moveTo(540, 880); q.lineTo(580, 880); q.stroke();
    q.globalAlpha = rise; q.font = `700 110px ${COND}`; q.fillStyle = ELK.ink; q.textAlign = 'left'; q.fillText('15 m', 1690, 560); q.globalAlpha = 1;
    q.font = `700 44px ${COND}`; q.fillStyle = ELK.ink; q.textAlign = 'right'; q.fillText('1.7 m', 530, 900);
  });
};
DRAW.command = (g, t, sh) => {
  const turn = sm(t, T.every, T.every + 1.5);
  plate(g, t, { x: 960, y: 560, z: 1.05 + 0.06 * U(t, sh) }, [[0, '#1d1a1e'], [1, '#3a3438']], (q) => {
    for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) { const x = -100 + i * 230 + (r % 2) * 110, y = 820 + r * 90, h = 640 - r * 120 + hash(i + r * 10) * 80; q.save(); q.globalAlpha = 0.55 + r * 0.2; giant(q, t * 0.2, x, y, h, 40 + i + r * 10, { steamA: 0.4, ld: 1, speed: 0.1, sway: 0.1 }); q.restore();
      if (turn > hash(i * 3 + r) * 0.8) { q.save(); q.globalCompositeOperation = 'lighter'; glow(q, x + 12, y - h * 0.9, 40, 'rgba(80,255,170,0.9)'); q.restore(); } }
    eren(q, t, { x: 960, y: 1120, h: 780, f: 1, p: pose(POSES.relaxed), sil: 1, ld: 1, glow: 1, wind: 0.8, look: { lx: 0.2 } });
  });
};
DRAW.late = (g, t, sh) => cu(g, t, sh, 'light', { mouth: 'smirk', look: { lx: -0.3, ly: 0.5 }, open: 0.75 }, { bg: 'tile', ots: true });
DRAW.knew = (g, t, sh) => {
  const u = U(t, sh);
  station(g, t, { x: 1180, y: 640, z: 1.35 }, both(t, { look: { lx: 0.6 }, brow: 0.2 }, { p: mixPose(pose(POSES.relaxed), pose(POSES.sitHands), sm(u, 0.1, 0.5)), y: lerp(1012, 1000, sm(u, 0.1, 0.5)) }));
};
DRAW.future = (g, t, sh) => {
  cu(g, t, sh, 'eren', { glow: 0.5 + 0.5 * sm(t, sh.t0, sh.t0 + 1.5), look: { lx: 0.3, ly: -0.3 }, wet: true }, { bg: 'dark', z1: 1.1, under: (q) => {
    const frags = [[0, 'giants'], [1, 'clock'], [2, 'notebook'], [3, 'eyes']];
    for (const [d, kind] of frags) { const ph = ((t - sh.t0) * 0.16 + d * 0.27) % 1.1, x = lerp(1900, 200, ph), y = 220 + (d % 2) * 380 + Math.sin(d * 3) * 60;
      q.save(); q.translate(x, y); q.rotate(Math.sin(d * 2 + 1) * 0.18); q.globalAlpha = 0.9 * Math.sin(Math.PI * cl(ph)); q.fillStyle = ELK.paper; q.fillRect(-170, -110, 340, 220); q.strokeStyle = ELK.ink; q.lineWidth = 6; q.strokeRect(-170, -110, 340, 220);
      q.beginPath(); q.rect(-162, -102, 324, 204); q.clip(); q.fillStyle = ELK.ink;
      if (kind === 'giants') { for (let k = 0; k < 5; k++) { q.beginPath(); q.ellipse(-120 + k * 60, 20, 18, 26, 0, 0, Math.PI * 2); q.fill(); q.fillRect(-136 + k * 60, 40, 32, 80); } }
      else if (kind === 'clock') { q.lineWidth = 6; q.beginPath(); q.arc(0, 0, 80, 0, Math.PI * 2); q.stroke(); q.beginPath(); q.moveTo(0, 0); q.lineTo(0, -64); q.moveTo(0, 0); q.lineTo(34, 30); q.stroke(); }
      else if (kind === 'notebook') { q.fillRect(-60, -80, 120, 160); q.fillStyle = ELK.red; q.fillRect(-40, -10, 80, 6); }
      else { q.beginPath(); q.ellipse(0, 0, 120, 44, 0, 0, Math.PI * 2); q.fill(); q.fillStyle = ELK.green; q.beginPath(); q.arc(0, 0, 34, 0, Math.PI * 2); q.fill(); }
      q.restore(); }
  } });
};
function ruleL(q, t) { plate(q, t, { x: 960, y: 540, z: 1 }, [[0, '#f1ebdf'], [1, '#d6cfc2']], (r) => {
      r.save(); r.globalCompositeOperation = 'source-over'; glow(r, 960, 420, 420, 'rgba(216,38,44,0.35)'); r.restore();
      notebookClosed(r, 960, 420, 0.95, -0.1); r.font = `700 64px ${COND}`; r.textAlign = 'center'; r.fillStyle = ELK.red; r.fillText("LIGHT'S RULE", 960, 780); r.font = `500 48px ${SERIF}`; r.fillStyle = ELK.ink; r.fillText('a name + a face = death', 960, 850); }); }
function ruleE(q, t) { plate(q, t, { x: 960, y: 540, z: 1 }, [[0, '#1c2620'], [1, '#101a14']], (r) => {
      r.fillStyle = ELK.paper; r.beginPath(); r.ellipse(960, 420, 230, 110, 0, 0, Math.PI * 2); r.fill(); r.fillStyle = ELK.green; r.beginPath(); r.arc(960, 420, 95, 0, Math.PI * 2); r.fill(); r.fillStyle = ELK.ink; r.beginPath(); r.arc(960, 420, 45, 0, Math.PI * 2); r.fill(); r.fillStyle = '#fff'; r.beginPath(); r.arc(930, 390, 18, 0, Math.PI * 2); r.fill();
      r.font = `700 64px ${COND}`; r.textAlign = 'center'; r.fillStyle = ELK.green; r.fillText("EREN'S RULE", 960, 780); r.font = `500 48px ${SERIF}`; r.fillStyle = ELK.paper; r.fillText("what he saw will happen", 960, 850); }); }
DRAW.rules = (g, t, sh) => { VIEW.s = 1.0 + 0.08 * eOut(U(t, sh)); ruleL(g, t); };
DRAW.rulesB = (g, t, sh) => { VIEW.s = 1.0 + 0.08 * eOut(U(t, sh)); ruleE(g, t); };
DRAW.rulesC = (g, t, sh) => {
  const u = U(t, sh), hit = sm(t, T.collideA - 0.15, T.collideA + 0.05);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = ELK.paper; g.fillRect(0, 0, W, H);
  const off = (1 - hit) * 40 + hit * -6;
  const L = [[0, 0], [940 - off, 0], [900 - off, H], [0, H]], R = [[980 + off, 0], [W, 0], [W, H], [940 + off, H]];
  panels(g, t, [
    { poly: L, view: { x: 450, y: 540, s: 1 }, fn: (q) => ruleL(q, t) },
    { poly: R, view: { x: 1450, y: 540, s: 1 }, fn: (q) => ruleE(q, t) },
  ], 10 + 10 * (1 - hit));
  if (t > T.collideA) { g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = ELK.paper; g.lineWidth = 8; g.beginPath(); let y = 0, x = 940; g.moveTo(x, y); for (let k = 0; k < 12; k++) { y += 90; x = 940 + (hash(k + 3) - 0.5) * 80; g.lineTo(x, y); } g.stroke(); sfxOver(g, 'KRAKK', 960, 160, 150, -0.1, t); }
};
/* =========================== ROUND 1 =========================== */
DRAW.r1 = (g, t, sh) => roundCard(g, t, 1, "What's wrong with the world?", U(t, sh), sh.t0);
DRAW.l1 = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.8 }, brow: -0.25 }, { bg: 'tile', ots: true, z1: 1.1 });
DRAW.court = (g, t, sh) => {
  const u = U(t, sh), fl = (k) => (Math.floor(t * 7 + k) % 5 === 0 ? 1 : 0);
  drawSet(g, 'court', { x: 1000, y: 700, z: 1.3 + 0.08 * u }, t, (q) => {
    crowd(q, t, 200, 700, 1180, 330, 6, 21, { f: 1 }); crowd(q, t, 1350, 1900, 1180, 330, 6, 41, { f: -1 });
    drawFig(q, { x: lerp(1000, 1080, u), y: 1080, h: 440, f: 1, who: 'extra', col: { suit: '#3a3a44', suitDk: '#22222a', pants: '#3a3a44', tie: '#3a3a44' }, p: walkP(t, 5), ld: 1, mouth: 'grin', look: { lx: 0.6 }, t });
    q.save(); q.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) if (fl(k)) glow(q, 260 + k * 300, 980, 160, 'rgba(255,255,255,0.9)'); q.restore();
  });
  g.setTransform(1, 0, 0, 1, 0, 0); stamp(g, t, Wd('l_rotten', 'free') - 0.1, 1500, 230, 'NOT GUILTY', ELK.ink, { size: 70, rot: 0.08 });
};
DRAW.l1b = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.9, ly: 0.1 }, brow: -0.7, drama: 0.85, glow: 0.4 }, { bg: 'dark', R: 240, z1: 1.12 });
DRAW.e1 = (g, t, sh) => cu(g, t, sh, 'eren', { look: { lx: 0.3, ly: 0.3 }, brow: -0.4, wet: true }, { bg: 'tile', ots: true });
DRAW.walls = (g, t, sh) => {
  drawSet(g, 'walls', { x: 960, y: 520 - 120 * eIO(U(t, sh)), z: 1.0 }, t, (q) => {
    drawFig(q, { x: 980, y: 1130, h: 180, f: 1, who: 'eren', col: { cloak: null }, p: pose({ tilt: -0.5, lSh: 0.1, rSh: -0.1 }), sil: 1, ld: 1, look: { ly: -1 }, t });
  }, { after: (q) => { q.font = `700 120px ${COND}`; q.textAlign = 'left'; q.fillStyle = ELK.paper; q.strokeStyle = ELK.ink; q.lineWidth = 12; q.strokeText('50 m', 1620, 520); q.fillText('50 m', 1620, 520); q.strokeStyle = ELK.paper; q.lineWidth = 8; q.beginPath(); q.moveTo(1580, 120); q.lineTo(1580, 1000); q.stroke(); } });
};
DRAW.map = (g, t, sh) => { g.setTransform(1, 0, 0, 1, 0, 0); islandMap(g, t, U(t, sh)); };
DRAW.nod = (g, t, sh) => {
  const n1 = Math.max(0, Math.sin((t - sh.t0) * 3.5)) * sm(t, sh.t0 + 0.3, sh.t0 + 0.6) * (1 - sm(t, sh.t0 + 1.6, sh.t0 + 2.0));
  station(g, t, { x: 1180, y: 640, z: 1.55 }, both(t, { p: pose(Object.assign({}, POSES.sitBack, { tilt: 0.2 * n1 })), look: { lx: 0.4, ly: 0.3 } }, { p: pose(Object.assign({}, POSES.sitHands, { tilt: 0.15 + 0.2 * n1 })), look: { lx: 0.4, ly: 0.3 } }));
};
DRAW.alone = (g, t, sh) => {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = ELK.paper; g.fillRect(0, 0, W, H);
  panels(g, t, [
    { poly: [[0, 0], [990, 0], [930, H], [0, H]], view: { x: 470, y: 540, s: 0.9 }, fn: (q) => drawSet(q, 'lightRoom', { x: 760, y: 640, z: 1.0 }, t, (r) => {
      light(r, t, { x: 700, y: 1060, h: 600, f: 1, p: pose(POSES.write), ld: -1, look: { lx: 0.4, ly: 0.8 } }); notebookOpen(r, 900, 800, 0.32, 0.05, [['....', 1], ['....', 1], ['....', 1]], null, t); }) },
    { poly: [[1010, 0], [W, 0], [W, H], [950, H]], view: { x: 1450, y: 540, s: 0.9 }, fn: (q) => drawSet(q, 'walls', { x: 960, y: 300, z: 1.0 }, t, (r) => {
      r.fillStyle = '#4a403f'; r.fillRect(LX, 90, LW, 40); eren(r, t, { x: 960, y: 100, h: 420, f: 1, p: pose(POSES.relaxed), sil: 1, ld: -1, wind: 1.4, glow: 0.4 }); }) },
  ]);
};
DRAW.them = (g, t, sh) => station(g, t, { x: 1180, y: 560, z: 0.92 + 0.04 * U(t, sh) }, both(t, { sil: 1 }, { sil: 1 }), { glowA: 0.6 });
DRAW.agree1 = (g, t, sh) => { g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#ece6da'], [1, '#d6cfc0']]); scoreboard(g, t, ['agree', null, null, null], 960, 560, 1.15, 0); g.setTransform(1, 0, 0, 1, 0, 0); stamp(g, t, T.stamp1 - 0.05, 1240, 380, 'AGREE', ELK.ink, { size: 90 }); };
/* =========================== ROUND 2 =========================== */
DRAW.r2 = (g, t, sh) => roundCard(g, t, 2, 'How many would you kill?', U(t, sh), sh.t0);
DRAW.l2 = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.8, ly: -0.1 }, mouth: 'smirk' }, { bg: 'tone', z1: 1.1 });
DRAW.screens = (g, t, sh) => {
  drawSet(g, 'city', { x: 960, y: 600, z: 1.08 + 0.06 * U(t, sh) }, t, (q) => {
    crowd(q, t, LX, LX + LW, 1150, 300, 16, 61, { walk: true });
  }, { beforeBack: (q) => {
    const k = cl((t - sh.t0) / 2.5);
    bigScreen(q, 240, 140, 640, 380, (s) => { vgrad(s, 240, 140, 640, 380, [[0, '#e8e4dc'], [1, '#c8c4bc']]); s.strokeStyle = ELK.ink; s.lineWidth = 4; s.beginPath(); s.moveTo(280, 480); s.lineTo(840, 480); s.moveTo(280, 480); s.lineTo(280, 180); s.stroke();
      s.strokeStyle = ELK.red; s.lineWidth = 10; s.beginPath(); for (let i = 0; i <= 20 * k; i++) { const x = 290 + i * 27, y = 220 + (i < 6 ? 0 : (i - 6) * 15) + Math.sin(i * 2) * 8; i ? s.lineTo(x, y) : s.moveTo(x, y); } s.stroke(); s.font = `700 54px ${COND}`; s.fillStyle = ELK.ink; s.fillText('CRIME', 560, 200); });
    bigScreen(q, 1360, 160, 600, 340, (s) => { vgrad(s, 1360, 160, 600, 340, [[0, '#e8e4dc'], [1, '#c8c4bc']]); s.font = `700 110px ${COND}`; s.textAlign = 'center'; s.fillStyle = ELK.ink; s.fillText('WARS', 1660, 300); s.fillStyle = ELK.red; s.fillText('END', 1660, 420); });
  } });
};
DRAW.afraid = (g, t, sh) => {
  drawSet(g, 'city', { x: 960, y: 760, z: 1.6 }, t, (q) => {
    crowd(q, t, 200, 1800, 1160, 520, 7, 77, { bow: true });
  }, { beforeBack: (q) => { bigScreen(q, 600, 60, 900, 380, (s) => { vgrad(s, 600, 60, 900, 380, [[0, '#121014'], [1, '#221c24']]); s.fillStyle = ELK.red; s.beginPath(); s.ellipse(1050, 250, 200, 80, 0, 0, Math.PI * 2); s.fill(); s.fillStyle = ELK.ink; s.beginPath(); s.arc(1050, 250, 60, 0, Math.PI * 2); s.fill(); }); } });
};
DRAW.eSilent = (g, t, sh) => cu(g, t, sh, 'eren', { look: { lx: 0.1, ly: 0.9 }, open: 0.55, brow: 0.1, wet: true }, { bg: 'tone', z0: 1.05, z1: 1.14 });
DRAW.e80 = (g, t, sh) => {
  cu(g, t, sh, 'eren', { look: { lx: 0.4, ly: -0.1 }, glow: 0.9, brow: -0.8, drama: 0.7 }, { bg: t > T.eighty ? 'green' : 'dark', R: 250, z0: 1.05, z1: 1.15, x: 1240 });
  g.setTransform(1, 0, 0, 1, 0, 0); if (t > T.eighty) { const k = eOut(cl((t - T.eighty) / 0.25)); g.save(); g.translate(560, 560); g.scale(1.6 - 0.6 * k, 1.6 - 0.6 * k); g.font = `700 300px ${COND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 22; g.strokeStyle = ELK.ink; g.strokeText('80%', 0, 0); g.fillStyle = ELK.paper; g.fillText('80%', 0, 0); g.restore(); }
};
DRAW.globe = (g, t, sh) => {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0d0b10'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(hash(i * 3) * W, hash(i * 7) * H, 2, 2); }
  const d = 0.8 * eIO(U(t, sh) * 1.2); globeDark(g, 960, 540, 380 + 20 * U(t, sh), t, d);
  g.font = `700 120px ${COND}`; g.textAlign = 'left'; g.fillStyle = ELK.paper; g.fillText(`${Math.round(d * 100)}%`, 1420, 560);
};
DRAW.foot = (g, t, sh) => {
  const u = U(t, sh), dn = eIn(cl(u * 1.4));
  drawSet(g, 'walls', { x: 960, y: 640, z: 1.15, shake: dn > 0.95 ? 0.6 : 0.1 }, t, null, { beforeMid: (q) => {}, after: (q) => { giantFoot(q, 1000, lerp(-300, 1000, dn), 1.6); if (dn > 0.95) steam(q, t, 1000, 960, 220, 5, 0.7); } });
};
DRAW.kid = (g, t, sh) => {
  const u = U(t, sh), sh2 = sm(u, 0.3, 0.9);
  drawSet(g, 'plain', { x: 900, y: 660, z: 1.5 }, t, (q) => {
    const F = drawFig(q, { x: 900, y: 1000, h: 300, f: 1, who: 'extra', col: { suit: '#d8d0bc', suitDk: '#a8a08c', pants: '#6a5a46' }, p: pose({ rSh: 2.6, rEl: 0.2, tilt: -0.4 }), ld: -1, look: { lx: 0.5, ly: -1 }, open: 1, mouth: u > 0.6 ? 'open' : 'flat', t });
    q.strokeStyle = ELK.ink; q.lineWidth = 2; q.beginPath(); q.moveTo(F.rHand[0], F.rHand[1]); q.quadraticCurveTo(1100, 300, 1250, 180 + Math.sin(t * 2) * 20); q.stroke();
    q.fillStyle = ELK.paper; q.save(); q.translate(1250, 180 + Math.sin(t * 2) * 20); q.rotate(0.3 + Math.sin(t * 2.4) * 0.1); q.beginPath(); q.moveTo(0, -60); q.lineTo(45, 0); q.lineTo(0, 70); q.lineTo(-45, 0); q.closePath(); q.fill(); q.strokeStyle = ELK.ink; q.lineWidth = 4; q.stroke(); q.restore();
  }, { after: (q) => { q.fillStyle = `rgba(10,8,10,${0.85 * sh2})`; q.beginPath(); q.ellipse(lerp(2400, 900, sh2), 1000, 900, 260, 0, 0, Math.PI * 2); q.fill(); q.fillRect(lerp(2400, 900, sh2), LY, 3000, LH); } });
};
DRAW.march = (g, t, sh) => {
  drawSet(g, 'plain', { x: 960, y: 560, z: 1.25 + 0.12 * U(t, sh), shake: 0.25 }, t, (q) => {
    eren(q, t, { x: 960, y: 1240, h: 700, f: 1, p: pose(POSES.relaxed), sil: 1, back: false, ld: -1, glow: 0.9, wind: 1.4 });
  }, { beforeBack: (q) => { giantRow(q, t, LX, LX + LW, 900, 720, 9, 81, { steamA: 0.6, ld: -1 }); } });
};
DRAW.monster = (g, t, sh) => {
  const st = sm(t, T.stand, T.stand + 0.5);
  station(g, t, { x: 1120, y: 600, z: 1.7 }, both(t, { p: mixPose(pose(POSES.sitBack), pose(POSES.point), st), y: lerp(1000, 1012, st), h: lerp(560, 600, st), brow: -0.9, mouth: 'flat', look: { lx: 0.8 } }, { look: { lx: 0.5, ly: -0.3 }, brow: -0.2 }));
};
DRAW.hand = (g, t, sh) => {
  const reach = sm(t, sh.t0 + 0.4, sh.t1 - 0.3);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = ELK.paper; g.fillRect(0, 0, W, H);
  panels(g, t, [
    { poly: [[0, 0], [W, 0], [W, 420], [0, 470]], view: { x: 960, y: 230, s: 1 }, fn: (q) => cu(q, t, sh, 'light', { look: { lx: 0.2, ly: 0.9 }, open: 0.7, brow: -0.4, talk: 0 }, { bg: 'tone', R: 640, x: 700, y: 520, cx: 960, cy: 560 }) },
    { poly: [[0, 490], [W, 440], [W, H], [0, H]], view: { x: 960, y: 770, s: 1 }, fn: (q) => plate(q, t, { x: 960, y: 560, z: 1.0 }, [[0, '#e9e3d7'], [1, '#c5bdb0']], (r) => {
      r.save(); glow(r, 1240, 560, 420, 'rgba(216,38,44,0.4)'); r.restore();
      box(r, 980, 380, 620, 400, '#9a7a5a', { r: 26 }); r.strokeStyle = ELK.ink; r.lineWidth = 6; rr(r, 980, 380, 620, 400, 26); r.stroke();
      r.save(); r.translate(1260, 420); r.rotate(0.04); notebookClosed(r, 0, 0, 0.8, 0); r.restore();
      mangaHand(r, lerp(260, 900, reach), 560, 300, 0.02, 0.3);
    }) },
  ], 10);
};
DRAW.eAgents = (g, t, sh) => cu(g, t, sh, 'eren', { look: { lx: 0.8 }, brow: -0.6 }, { bg: 'tile', ots: true, z1: 1.1 });
DRAW.agents = (g, t, sh) => {
  // twelve agents in the rain, each falling in turn
  plate(g, t, { x: 960, y: 560, z: 1.0 }, [[0, '#e3ddd1'], [1, '#aaa397']], (q) => {
    vgrad(q, -200, 900, 2400, 400, [[0, '#8a8478'], [1, '#5a554e']]);
    for (let i = 0; i < 12; i++) { const x = 140 + i * 150, fallT = sh.t0 + 0.4 + i * 0.32, f = sm(t, fallT, fallT + 0.35);
      drawFig(q, { x, y: 900 + f * 40, h: 380, f: 1, who: 'extra', col: { suit: '#2a2a32', suitDk: '#16161c', pants: '#2a2a32', tie: '#16161c' }, p: f > 0 ? mixPose(pose({ lSh: 1.6, lEl: 1.9, rSh: 1.5, rEl: 2.0, lean: 0.3 }), pose({ lean: 1.4, lSh: 2.6, rSh: 2.4, lHip: 1.3, lKn: 0.4, rHip: 1.2, rKn: 0.3 }), f) : walkP(t + i, 4), ld: -1, sil: 1, shadow: false, t }); }
    q.strokeStyle = 'rgba(20,18,22,0.45)'; q.lineWidth = 2; q.beginPath(); for (let i = 0; i < 220; i++) { const xx = hash(i * 3.1) * 2600 - 300, yy = ((t * (900 + hash(i) * 500) + hash(i * 5) * 1500) % 1500) - 300; q.moveTo(xx, yy); q.lineTo(xx - 12, yy + 60); } q.stroke();
  });
};
DRAW.inway = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.9 }, brow: -0.8, drama: 0.9, glow: 0.6, mouth: 'flat' }, { bg: 'dark', R: 250, z1: 1.14, rot: -0.03 });
DRAW.mine = (g, t, sh) => cu(g, t, sh, 'eren', { look: { lx: 0.9 }, brow: -0.9, drama: 0.9, glow: 0.8 }, { bg: 'dark', R: 250, z1: 1.14, rot: 0.03 });
DRAW.mirror = (g, t, sh) => {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = ELK.paper; g.fillRect(0, 0, W, H);
  const a1 = sm(t, Wd('n_same', 'necessary', 0) - 0.1, Wd('n_same', 'necessary', 0) + 0.2), a2 = sm(t, Wd('n_same', 'necessary', 1) - 0.1, Wd('n_same', 'necessary', 1) + 0.2);
  panels(g, t, [
    { poly: [[0, 0], [950, 0], [950, H], [0, H]], view: { x: 475, y: 540, s: 1 }, fn: (q) => cu(q, t, sh, 'light', { look: { lx: 0.9 }, brow: -0.5, drama: 0.6 }, { bg: 'tile', x: 900, cx: 960 }) },
    { poly: [[970, 0], [W, 0], [W, H], [970, H]], view: { x: 1445, y: 540, s: 1 }, fn: (q) => cu(q, t, sh, 'eren', { look: { lx: 0.9 }, brow: -0.5, drama: 0.6 }, { bg: 'tile', x: 1020, cx: 960 }) },
  ]);
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const [x, a, c] of [[475, a1, ELK.red], [1445, a2, ELK.green]]) { if (a <= 0) continue; g.globalAlpha = a; g.fillStyle = ELK.paper; g.fillRect(x - 330, 730, 660, 120); g.strokeStyle = ELK.ink; g.lineWidth = 5; g.strokeRect(x - 330, 730, 660, 120); g.font = `700 84px ${COND}`; g.textAlign = 'center'; g.fillStyle = c; g.fillText('"NECESSARY"', x, 820); g.globalAlpha = 1; }
};
DRAW.size = (g, t, sh) => {
  // same excuse, different size: a few notebook pages against a mountain
  g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#ece6da'], [1, '#d6cfc0']]); g.translate(0, -120);
  const u = eOut(cl(U(t, sh) * 1.6));
  g.fillStyle = ELK.ink; g.fillRect(100, 880, 1720, 6);
  for (let i = 0; i < 6; i++) { g.save(); g.translate(460, 870 - i * 14 * u); g.rotate((hash(i) - 0.5) * 0.08); g.fillStyle = ELK.paper; g.fillRect(-90, -10, 180, 12); g.strokeStyle = ELK.ink; g.lineWidth = 2; g.strokeRect(-90, -10, 180, 12); g.restore(); }
  g.fillStyle = ELK.ink; g.beginPath(); g.moveTo(950, 880); for (let k = 0; k <= 30; k++) { const x = 950 + k * 30, y = 880 - Math.sin(k / 30 * Math.PI) * 700 * u + noise(k * 0.8, 9) * 30 * u; g.lineTo(x, y); } g.lineTo(1850, 880); g.closePath(); g.fill();
  g.font = `700 64px ${COND}`; g.textAlign = 'center'; g.fillStyle = ELK.red; g.fillText('LIGHT', 460, 980); g.fillStyle = ELK.green; g.fillText('EREN', 1400, 980);
  g.font = `500 40px ${SERIF}`; g.fillStyle = ELK.ink; g.fillText('thousands', 460, 1040); g.fillText('billions', 1400, 1040);
};
DRAW.agree2 = (g, t, sh) => { g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#ece6da'], [1, '#d6cfc0']]); scoreboard(g, t, ['agree', 'agree*', null, null], 960, 560, 1.15, 1); g.setTransform(1, 0, 0, 1, 0, 0); stamp(g, t, T.stamp2 - 0.05, 1240, 480, 'AGREE', ELK.ink, { size: 90, sub: "(they'd never admit it)" }); };
/* =========================== ROUND 3 =========================== */
DRAW.r3 = (g, t, sh) => roundCard(g, t, 3, 'What does the new world look like?', U(t, sh), sh.t0);
DRAW.god = (g, t, sh) => {
  const u = U(t, sh);
  plate(g, t, { x: 960, y: 560, z: 1.0 + 0.05 * u }, [[0, '#7a1014'], [0.6, '#d8262c'], [1, '#f0a07a']], (q) => {
    q.save(); q.globalAlpha = sm(u, 0.0, 0.35); light(q, t, { x: 960, y: 1900, h: 2000, f: 1, p: pose(POSES.godArms), sil: 1, ld: 1, glow: 1, shadow: false, look: { lx: 0, ly: 0.6 } }); q.restore();
    q.fillStyle = ELK.ink; q.fillRect(-200, 1030, 2400, 300);
    for (let r = 0; r < 3; r++) crowd(q, t, -100, 2020, 1060 + r * 70, 200 + r * 40, 16, 100 + r * 9, { bow: true, f: 1 });
  });
};
DRAW.godFace = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.4, ly: -0.6 }, mouth: 'smirk', drama: 0.7, glow: 0.8, brow: 0.1 }, { bg: 'red', R: 240, z1: 1.14, rot: -0.04 });
DRAW.eChange = (g, t, sh) => {
  const k = sm(t, sh.t0 + 0.6, sh.t1 - 0.5);
  cu(g, t, sh, 'eren', { look: { lx: 0.8 }, brow: lerp(0.1, -1, k), glow: k * 0.9, drama: k * 0.6 }, { bg: k > 0.5 ? 'lines' : 'tile', z0: 1.0, z1: 1.3, ots: k < 0.5 });
};
DRAW.eWall = (g, t, sh) => {
  const st = sm(t, T.erenStand, T.erenStand + 0.6);
  station(g, t, { x: 1250, y: 600, z: 1.75 }, both(t, { look: { lx: 0.6, ly: -0.3 }, brow: 0.1 }, { p: mixPose(pose(POSES.sitHands), pose(POSES.fist), st), y: lerp(1000, 1012, st), h: lerp(575, 615, st), look: { lx: 0.6 }, brow: -0.8, glow: 0.4 }));
};
DRAW.wallTop = (g, t, sh) => {
  // the Wall around a city of tiny people, and Light at the top of it
  const u = U(t, sh);
  drawSet(g, 'walls', { x: 960, y: 420 + 120 * (1 - eOut(u)), z: 1.0 }, t, (q) => {
    crowd(q, t, LX, LX + LW, 1120, 140, 26, 140, { bow: true });
    light(q, t, { x: 960, y: 104, h: 260, f: 1, p: pose(POSES.armsWide), sil: 1, ld: -1, glow: 1 });
  });
};
DRAW.burn = (g, t, sh) => station(g, t, { x: 1180, y: 600, z: 2.1 }, (q) => {
  light(q, t, { x: 1080, y: 1012, h: 600, f: 1, p: pose(POSES.open), ld: -1, look: { lx: 0.8 }, brow: -0.6 });
  eren(q, t, { x: 1300, y: 1012, h: 615, f: -1, p: pose(POSES.fist), ld: 1, look: { lx: 0.8 }, brow: -0.9, glow: 0.3 });
});
DRAW.free = (g, t, sh) => cu(g, t, sh, 'eren', { look: { lx: 0.9 }, brow: -1, glow: 1, drama: 0.6, wind: 1.6 }, { bg: 'lines', R: 245, z0: 1.05, z1: 1.2, rot: 0.03 });
DRAW.strings = (g, t, sh) => {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = ELK.paper; g.fillRect(0, 0, W, H);
  panels(g, t, [
    { poly: [[0, 0], [950, 0], [950, H], [0, H]], view: { x: 475, y: 540, s: 0.85 }, fn: (q) => plate(q, t, { x: 960, y: 540, z: 1 }, [[0, '#2a2226'], [1, '#121014']], (r) => {
      light(r, t, { x: 960, y: 520, h: 420, f: 1, p: pose(POSES.armsWide), sil: 1, ld: 1, glow: 1 });
      for (let i = 0; i < 7; i++) { const x = 300 + i * 110, sw = Math.sin(t * 2 + i) * 20; r.strokeStyle = ELK.red; r.lineWidth = 3; r.beginPath(); r.moveTo(960 + (i - 3) * 60, 300); r.lineTo(x + sw, 760); r.stroke();
        drawFig(r, { x: x + sw, y: 1000, h: 240, f: 1, who: 'extra', sil: 1, ld: 1, shadow: false, p: pose({ lSh: 2.4 + Math.sin(t * 2 + i) * 0.2, rSh: 2.2, tilt: 0.3 }), t }); } }) },
    { poly: [[970, 0], [W, 0], [W, H], [970, H]], view: { x: 1445, y: 540, s: 0.85 }, fn: (q) => plate(q, t, { x: 960, y: 540, z: 1 }, [[0, '#1c2620'], [1, '#101a14']], (r) => {
      const brk = sm(t, sh.t0 + 0.8, sh.t0 + 1.3);
      eren(r, t, { x: 960, y: 980, h: 560, f: 1, p: pose(POSES.armsWide), sil: 1, ld: -1, glow: 1, wind: 1.5 });
      r.strokeStyle = '#8a8a90'; r.lineWidth = 14; for (const s2 of [-1, 1]) { r.beginPath(); r.moveTo(960 + s2 * 160, 640); r.lineTo(960 + s2 * (300 + brk * 300), 600 - brk * 200); r.stroke(); }
      giantRow(r, t, 200, 1720, 1000, 300, 6, 9, { steamA: 0.4 }); }) },
  ]);
};
DRAW.clash3 = (g, t, sh) => {
  g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#ece6da'], [1, '#d6cfc0']]); scoreboard(g, t, ['agree', 'agree*', 'clash', null], 960, 560, 1.15, 2);
  g.setTransform(1, 0, 0, 1, 0, 0); stamp(g, t, sh.t0 + 0.25, 1240, 600, 'CLASH', ELK.red, { size: 100, rot: 0.1 });
  g.strokeStyle = ELK.ink; g.lineWidth = 6; if (t > sh.t0 + 0.25) { g.beginPath(); let x = 960, y = 0; g.moveTo(x, y); for (let k = 0; k < 10; k++) { y += 110; x += (hash(k + 30) - 0.5) * 140; g.lineTo(x, y); } g.stroke(); }
};
/* =========================== ROUND 4 =========================== */
DRAW.r4 = (g, t, sh) => roundCard(g, t, 4, 'How does your story end?', U(t, sh), sh.t0);
DRAW.throne = (g, t, sh) => {
  plate(g, t, { x: 960, y: 560, z: 1.0 + 0.05 * U(t, sh) }, [[0, '#2a2226'], [1, '#0e0c10']], (q) => {
    // a mountain of black notebooks, a throne on top, Light seated
    for (let i = 0; i < 40; i++) { const r2 = Math.floor(i / 8), c = i % 8; notebookClosed(q, 960 + (c - 3.5) * (70 - r2 * 6) + (hash(i) - 0.5) * 30, 1080 - r2 * 70, 0.28, (hash(i * 3) - 0.5) * 1.2); }
    throne(q, 960, 760, 0.8, '#bfa060');
    light(q, t, { x: 960, y: 750, h: 360, f: 1, p: pose(POSES.sitBack), ld: 1, look: { lx: 0.3, ly: 0.2 }, mouth: 'smirk', glow: 0.8 });
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 960, 520, 520, 'rgba(255,230,180,0.3)'); q.restore();
  });
};
DRAW.heroes = (g, t, sh) => {
  // Eren's ending: his friends on the hill as heroes, Eren alone below
  drawSet(g, 'plain', { x: 960, y: 600, z: 1.0 + 0.05 * U(t, sh) }, t, (q) => {
    q.fillStyle = '#2a2020'; q.beginPath(); q.moveTo(400, 800); q.quadraticCurveTo(900, 520, 1500, 800); q.closePath(); q.fill();
    for (let i = 0; i < 5; i++) drawFig(q, { x: 760 + i * 95, y: 640 + Math.abs(i - 2) * 20, h: 200 + (i % 2) * 14, f: i < 2 ? 1 : -1, who: 'extra', sil: 1, ld: -1, shadow: false, p: pose(i === 2 ? POSES.godArms : POSES.relaxed), t });
    crowd(q, t, 300, 1700, 1000, 160, 18, 200, {});
    eren(q, t, { x: 1600, y: 1200, h: 360, f: -1, p: pose(POSES.headDown), sil: 1, ld: -1, glow: 0.4, wind: 1 });
  });
};
DRAW.puzzled = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.8 }, brow: 0.7, mouth: 'frown' }, { bg: 'tone', z1: 1.1 });
DRAW.cage = (g, t, sh) => {
  plate(g, t, { x: 960, y: 600, z: 1.1 - 0.08 * U(t, sh) }, [[0, '#1c1a1e'], [1, '#0e0c10']], (q) => {
    throne(q, 960, 960, 0.6, '#bfa060'); light(q, t, { x: 960, y: 950, h: 270, f: 1, p: pose(POSES.sitBack), ld: 1, mouth: 'smirk', look: { lx: 0.3 } });
    birdcage(q, 960, 1010, 640, 860);
  });
};
DRAW.board = (g, t, sh) => {
  g.setTransform(1, 0, 0, 1, 0, 0); vgrad(g, 0, 0, W, H, [[0, '#ece6da'], [1, '#d6cfc0']]);
  const k = sm(t, Wd('n_verdict', 'on') - 0.3, Wd('n_verdict', 'on') + 0.2);
  scoreboard(g, t, ['agree', 'agree*', 'clash', 'clash'], lerp(960, 560, k), 560, lerp(1.15, 0.85, k));
  g.setTransform(1, 0, 0, 1, 0, 0);
  const p = Wd('n_verdict', 'problem'), c = Wd('n_verdict', 'cure');
  if (t > p) { g.font = `600 44px ${SANS}`; g.textAlign = 'left'; g.fillStyle = ELK.ink; g.fillText('THE PROBLEM', 1080, 380); stamp(g, t, Wd('n_verdict', 'yes') - 0.05, 1420, 470, 'YES', ELK.ink, { size: 80, rot: -0.05 }); }
  if (t > c) { g.font = `600 44px ${SANS}`; g.textAlign = 'left'; g.fillStyle = ELK.ink; g.fillText('THE CURE', 1080, 650); stamp(g, t, Wd('n_verdict', 'never') - 0.05, 1420, 740, 'NEVER', ELK.red, { size: 80, rot: 0.06 }); }
};
DRAW.oneWorld = (g, t, sh) => {
  station(g, t, { x: 1180, y: 620, z: 1.05 + 0.05 * U(t, sh) }, both(t, { sil: 1, glow: 0.5 }, { sil: 1, glow: 0.5 }));
  g.setTransform(1, 0, 0, 1, 0, 0); const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(216,38,44,0.35)'); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(31,191,120,0.35)'); g.globalCompositeOperation = 'multiply'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
};
/* =========================== THE COUNTDOWN =========================== */
DRAW.tick = (g, t, sh) => station(g, t, { x: CLOCK.x, y: CLOCK.y + 10, z: 4.2 + 0.2 * U(t, sh), drift: 0.2, shake: t > T.click && t < T.click + 0.2 ? 0.4 : 0 }, null);
DRAW.moving = (g, t, sh) => {
  station(g, t, { x: 1180, y: 600, z: 1.0 + 0.1 * U(t, sh) }, both(t, { look: { lx: -0.2, ly: -0.8 } }, { look: { lx: 0.2, ly: -0.8 } }));
  g.setTransform(1, 0, 0, 1, 0, 0); const fl = Math.sin(t * 37) > 0.6 ? 0.25 : 0; g.fillStyle = `rgba(0,0,0,${fl})`; g.fillRect(0, 0, W, H);
};
DRAW.decide = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.9 }, brow: -0.8, drama: 1, glow: 1, mouth: 'flat' }, { bg: 'dark', R: 240, z0: 1.0, z1: 1.2 });
DRAW.opens = (g, t, sh) => {
  const op = sm(t, T.open - 0.1, T.open + 0.6);
  plate(g, t, { x: 960, y: 560, z: 1.15 + 0.1 * U(t, sh) }, [[0, '#1a171d'], [1, '#2a262c']], (q) => {
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 960, 520, 800, 'rgba(255,240,215,0.4)'); q.restore();
    if (op < 0.5) notebookClosed(q, 960, 560, 1.3, -0.04); else notebookOpen(q, 960, 560, 1.1, -0.04, [['Takeshi Ono', 1], ['Mark Delaney', 1], ['Kenji Moriyama', 1]], null, t);
  });
};
DRAW.writing = (g, t, sh) => {
  const u = cl((t - T.wr0) / (T.written - T.wr0));
  plate(g, t, { x: 1120, y: 420, z: 2.0 + 0.2 * U(t, sh), drift: 0.4 }, [[0, '#1a171d'], [1, '#2a262c']], (q) => {
    q.save(); q.globalCompositeOperation = 'lighter'; glow(q, 1100, 420, 700, 'rgba(255,240,215,0.45)'); q.restore();
    notebookOpen(q, 960, 560, 1.1, -0.04, [['Takeshi Ono', 1], ['Mark Delaney', 1], ['Kenji Moriyama', 1]], { text: NAME, u }, t);
    const px = 960 + (40 + u * 300) * 1.1, py = 560 + (-170) * 1.1 - 10 + Math.sin(t * 30) * 4;
    penHand(q, px, py, 0.75, t, { rot: -0.12 });
  });
  if (u > 0 && u < 1) sfxOver(g, 'SKRTCH', 1560, 860, 120, -0.1, t);
};
DRAW.forty = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.9, ly: -0.1 }, brow: -0.5, drama: 0.8, glow: 0.9, mouth: 'smirk' }, { bg: 'red', R: 235, z1: 1.08 });
DRAW.heart = (g, t, sh) => {
  // a manga x-ray: Eren's heart beating inside his silhouette
  plate(g, t, { x: 960, y: 560, z: 1.0 + 0.1 * U(t, sh) }, [[0, '#0f0d12'], [1, '#1a1720']], (q) => {
    eren(q, t, { x: 960, y: 1500, h: 1500, f: -1, p: pose(POSES.relaxed), sil: 1, ld: 1, glow: 0.6 });
    const b = (t * 1.1) % 1, beat = Math.exp(-b * 9) + 0.6 * Math.exp(-Math.max(0, b - 0.18) * 9) * (b > 0.18 ? 1 : 0);
    q.save(); q.translate(1000, 700); q.scale(1 + beat * 0.12, 1 + beat * 0.12); q.fillStyle = ELK.paper; q.beginPath(); q.moveTo(0, 60); q.bezierCurveTo(-140, -20, -80, -130, 0, -70); q.bezierCurveTo(80, -130, 140, -20, 0, 60); q.fill(); q.strokeStyle = ELK.ink; q.lineWidth = 6; q.stroke(); q.restore();
  });
};
DRAW.failed = (g, t, sh) => {
  // the notebook's pages flip past, full of names
  plate(g, t, { x: 960, y: 560, z: 1.25, drift: 0.3 }, [[0, '#1a171d'], [1, '#2a262c']], (q) => {
    const pg = Math.floor((t - sh.t0) * 9);
    const names = []; for (let i = 0; i < 11; i++) names.push([['A. Kowalski', 'R. Tanaka', 'J. Ruiz', 'M. Okafor', 'L. Chen', 'S. Petrov', 'D. Haddad', 'K. Sato', 'P. Novak', 'T. Adeyemi', 'H. Kim', 'B. Silva'][(i + pg * 3) % 12], 1]);
    notebookOpen(q, 960, 560, 1.1, -0.04, names, null, t);
    q.save(); q.translate(960 + 50, 560); q.scale(1.1, 1.1); q.font = `italic 400 30px ${SERIF}`; q.fillStyle = '#16121a'; for (let i = 0; i < 11; i++) q.fillText(['N. Ivanova', 'F. Rossi', 'G. Moreau', 'Y. Park', 'E. Costa', 'O. Mensah'][(i + pg) % 6], 20, -208 + i * 38); q.restore();
    const fp = ((t - sh.t0) * 9) % 1; q.save(); q.translate(960, 560); q.scale(1.1 * Math.cos(fp * Math.PI), 1.1); q.fillStyle = '#efe9de'; q.fillRect(0, -252, 394, 504); q.restore();
  });
};
DRAW.seen = (g, t, sh) => cu(g, t, sh, 'eren', { look: { lx: 0.9 }, brow: -0.2, glow: 0.9, mouth: 'flat', wet: true }, { bg: 'rain', ots: true, z1: 1.1 });
DRAW.collide = (g, t, sh) => {
  const k = sm(t, T.collideB - 0.1, T.collideB + 0.6);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = ELK.paper; g.fillRect(0, 0, W, H);
  const off = (1 - k) * 200;
  panels(g, t, [
    { poly: [[0, 0], [940 - off, 0], [940 - off, H], [0, H]], view: { x: 470 - off / 2, y: 540, s: 1 }, fn: (q) => { plate(q, t, { x: 960, y: 540, z: 1 }, [[0, '#2a2226'], [1, '#14101a']], (r) => { notebookOpen(r, 960, 520, 0.7, -0.05, [], { text: NAME, u: 1 }, t); r.font = `700 70px ${COND}`; r.textAlign = 'center'; r.fillStyle = ELK.red; r.fillText('HE DIES TONIGHT', 960, 900); }); } },
    { poly: [[980 + off, 0], [W, 0], [W, H], [980 + off, H]], view: { x: 1450 + off / 2, y: 540, s: 1 }, fn: (q) => { plate(q, t, { x: 960, y: 540, z: 1 }, [[0, '#1c2620'], [1, '#101a14']], (r) => { r.fillStyle = ELK.paper; r.beginPath(); r.ellipse(960, 480, 230, 110, 0, 0, Math.PI * 2); r.fill(); r.fillStyle = ELK.green; r.beginPath(); r.arc(960, 480, 95, 0, Math.PI * 2); r.fill(); r.fillStyle = ELK.ink; r.beginPath(); r.arc(960, 480, 45, 0, Math.PI * 2); r.fill(); r.font = `700 70px ${COND}`; r.textAlign = 'center'; r.fillStyle = ELK.green; r.fillText("HE DOESN'T", 960, 900); }); } },
  ]);
  if (k > 0.98) { g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = ELK.paper; g.lineWidth = 10; g.beginPath(); let y = 0, x = 960; g.moveTo(x, y); for (let i = 0; i < 12; i++) { y += 90; x = 960 + (hash(i + 7) - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
};
// the silence: the clock, Light's eyes, Eren's hand, the two of them, the count
DRAW.sA = (g, t, sh) => station(g, t, { x: CLOCK.x, y: CLOCK.y + 10, z: 3.8 + 0.3 * U(t, sh), drift: 0.2 }, null);
DRAW.sB = (g, t, sh) => eyesCU(g, t, sh, 'light', { look: { lx: 0.9 }, brow: -0.3, glow: 0.7, sweat: (t * 0.4) % 1 }, { bg: 'dark' });
DRAW.sC = (g, t, sh) => cu2(g, t, sh, { look: { lx: 0.9 }, brow: -0.3, glow: 0.6, talk: 0, sweat: (t * 0.4) % 1 }, { look: { lx: 0.9 }, glow: 0.6, talk: 0 }, { bg: 'rain', R: 165, lx: 500, ex: 1420, y: 520, z0: 1.0, z1: 1.05 });
DRAW.sD = (g, t, sh) => station(g, t, { x: 1180, y: 620, z: 1.05 + 0.06 * U(t, sh) }, both(t, { sil: 1, glow: 0.7, p: pose(POSES.sitWrite) }, { sil: 1, glow: 0.7 }));
DRAW.sE = (g, t, sh) => eyesCU(g, t, sh, 'eren', { look: { lx: 0.9 }, brow: -0.2, glow: 0.9 }, { bg: 'dark' });
DRAW.zero = (g, t, sh) => cu(g, t, sh, 'light', { look: { lx: 0.9 }, brow: 0.8, open: 1.15, mouth: 'open', blink: false, sweat: 0.4 + (t - T.zero) * 0.3, talk: 0 }, { bg: 'lines', R: 230, z0: 1.0, z1: 1.12 });
DRAW.look = (g, t, sh) => {
  const sm2 = sm(t, T.smile - 0.2, T.smile + 0.3);
  cu2(g, t, sh, { look: { lx: 0.9 }, brow: 0.5, mouth: 'frown', talk: 0 }, { look: { lx: 0.9 }, glow: 0.5 * sm2, mouth: sm2 > 0.5 ? 'smirk' : 'flat', brow: lerp(-0.4, 0.0, sm2), talk: 0 }, { bg: 'tile', z0: 1.0, z1: 1.08, R: 165, lx: 500, ex: 1420, y: 520 });
};
// the four eyes, in station coordinates (measured off the seated pair at z 1.6): they outlive the lights
const DARK_EYES = [[990.6, 643.8, '255,40,48', 'l'], [1005, 647.5, '255,40,48', 'l'], [1353, 623.8, '60,255,160', 'e'], [1368.8, 625.6, '60,255,160', 'e']];
function eyesInDark(g, t, C, aL, aE) {
  camK(g, C, 1, t); g.save(); g.globalCompositeOperation = 'lighter';
  for (const [x, y, c, w] of DARK_EYES) {
    const a = w === 'l' ? aL : aE; if (a <= 0) continue;
    const gr = g.createRadialGradient(x, y, 0, x, y, 30); gr.addColorStop(0, `rgba(${c},${0.5 * a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 30, y - 30, 60, 60);
    g.fillStyle = `rgba(${c},${Math.min(1, a)})`; g.beginPath(); g.ellipse(x, y, 6, 1.9, w === 'l' ? 0.12 : -0.05, 0, Math.PI * 2); g.fill();
    g.fillStyle = `rgba(255,255,255,${0.75 * Math.min(1, a)})`; g.beginPath(); g.ellipse(x, y, 2.6, 0.8, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore(); g.setTransform(1, 0, 0, 1, 0, 0);
}
DRAW.dark = (g, t, sh) => {
  // the lights go out, one by one; only the four eyes stay lit
  const o1 = sm(t, T.out - 0.05, T.out + 0.1), o2 = sm(t, T.out + 0.6, T.out + 0.75), o3 = sm(t, T.out + 1.2, T.out + 1.35);
  const C = { x: 1180, y: 640, z: 1.6 };
  station(g, t, C, both(t, { sil: 1, glow: 1, p: pose(POSES.sitWrite) }, { sil: 1, glow: 1 }), { glowA: 1 - o1 });
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(0,0,0,${0.55 * o1 + 0.3 * o2 + 0.15 * o3})`; g.fillRect(0, 0, W, H);
  eyesInDark(g, t, C, o1, o1);
};
DRAW.cta = (g, t, sh) => {
  // black, a slow push towards the four eyes; each pair flares when its rule is named
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const u = cl((t - sh.t0) / Math.max(1, KET.duration - sh.t0)), fl = (w) => 0.45 * Math.exp(-Math.max(0, t - Wd('n_cta', w)) * 1.6) * (t > Wd('n_cta', w) - 0.05 ? 1 : 0);
  const end = 1 - sm(t, KET.duration - 0.6, KET.duration);
  eyesInDark(g, t, { x: 1180, y: 636, z: lerp(1.6, 2.05, eIO(u)) }, (0.9 + fl('notebook')) * end, (0.9 + fl('future')) * end);
};
/* =========================== THE FILM =========================== */
const DUSK = ['shake', 'horizon', 'feet', 'twoE', 'walls', 'foot', 'kid', 'march', 'heroes', 'wallTop', 'alone'];
const PAGE = ['fast', 'rule', 'rules', 'rulesB', 'rulesC', 'r1', 'r2', 'r3', 'r4', 'agree1', 'agree2', 'clash3', 'board', 'size', 'map', 'mirror', 'collide', 'strings', 'meet'];
const KEF = {
  duration: KET.duration,
  draw(g, t) { const sh = shotAt(t); KEF._shot = sh; g.save(); DRAW[sh.id](g, t, sh); g.restore(); VIEW.x = W / 2; VIEW.y = H / 2; VIEW.s = 1; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; },
  post(t) {
    const sh = shotAt(t); let fade = 0, flash = 0, impact = 0;
    if (t < 0.25) fade = 1 - t / 0.25;
    if (sh.id === 'cta') fade = 0;
    const hit = (t0, d = 0.1) => (t >= t0 && t < t0 + d ? 1 : 0);
    impact = Math.max(hit(T.fall), hit(T.collideA, 0.13), hit(T.eighty, 0.13), hit(T.crack, 0.13), hit(T.collideB + 0.55, 0.13), hit(T.zero - 0.02, 0.2), hit(T.stamp1, 0.07), hit(T.stamp2, 0.07));
    if (sh.id === 'feet') { const ph = (t - sh.t0) / 1.25; if ((ph % 0.9) > 0.42 && (ph % 0.9) < 0.48) impact = 1; }
    if (sh.id === 'door' && t > T.door + 0.25 && t < T.door + 0.45) flash = 0.4;
    if (sh.id === 'title') flash = Math.max(0, 0.6 - (t - T.title) * 3) * (t > T.title ? 1 : 0);
    const dusk = DUSK.includes(sh.id), page = PAGE.includes(sh.id);
    const P = { fade, flash, impact, vignette: page ? 0.2 : 0.5, bloom: page ? 0 : 0.3, ink: '#141218', paper: '#efe9dc', tone: '#16131a', wash: dusk ? 0.45 : 0.22, edge: 0.45, pitch: 7 };
    if (dusk) P.paper = '#f2e4d2';
    if (['dark', 'cta'].includes(sh.id)) { P.vignette = 0.6; }
    return P;
  },
};
