/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set, pov }. The story clock runs at real speed (story
   s = film t − GK.t0), so a cut never moves time back or forward: each shot simply picks up the same turn somewhere
   else (the owner's rule of 2026-10-29). Cut points come from the captions (script.js: gkS, gkC, gkB) and from the
   simulation's events (physics.js), so every one lands on something happening.
   ===================================================================== */

const gkSh = (id, mode, t0, t1, o = {}) => Object.assign({ id, mode, t0, t1, set: 'world' }, o);

const GK_SHOTS = [];
{
  const P = GK_SHOTS, c = gkC, B = gkB, f = gkFilmAt;
  const L = [
    // 1 — the first ticks: your room turning (as you feel it) and the football rolling off by itself; the pond spilling
    //     (the climbing dome behind it); the spire, followed to the ground; your ears; the street becoming a hill; the
    //     first avalanche; holding on
    ['A0', 'room0', -1, 4.6],
    ['A1', 'ball', 4.6, 7.6],
    ['A2', 'pond0', 7.6, B('spire', 0.2)],
    ['A3', 'spire', B('spire', 0.2), f(GK_SPIRE.hitS + 1.9) + 0.8],
    ['A4', 'ear', f(GK_SPIRE.hitS + 1.9) + 0.8, 24.2],
    ['A5', 'cars0', 24.2, B('slide', 0.8)],
    ['A6', 'slide', B('slide', 0.8), B('hold', 0.0)],
    ['A7', 'hold', B('hold', 0.0), B('east', 0.0)],
    // 2 — everything slides east: the street; the cars into the church; the climbing dome; you follow; the park as a
    //     ski slope; the empty pond; your east wall; the window, on its side; 90°
    ['B0', 'street1', B('east', 0.0), c('east', 1) + 0.55],
    ['B1', 'church0', c('east', 1) + 0.55, B('dome', 0.0)],
    ['B2', 'dome0', B('dome', 0.0), B('follow', 1.4)],
    ['B3', 'follow', B('follow', 1.4), gkE('follow') + 0.55],
    ['B4', 'ski', gkE('follow') + 0.55, B('pond', 0.6)],
    ['B5', 'pond', B('pond', 0.6), gkE('pond') + 1.2],
    ['B6', 'wall', gkE('pond') + 1.2, gkE('wall') + 0.8],
    ['B7', 'win2', gkE('wall') + 0.8, gkE('wall') + 5.8, { pov: true }],
    ['B7b', 'dome1', gkE('wall') + 5.8, B('ninety', 0.4)],
    ['B8', 'ninety', B('ninety', 0.4), f(96.0)],
    // 3 — down points into the sky: the stack of cars goes; things fall up, in circles; rain going up; the roof tiles;
    //     the dome; the balconies; the trees; ten degrees to go
    ['C0', 'stack', f(96.0), gkE('stack') - 0.8],
    ['C1', 'up0', gkE('stack') - 0.8, B('terminal', 0.4)],
    ['C2', 'leaves0', B('terminal', 0.4), c('terminal', 2) - 0.35],
    ['C3', 'circle', c('terminal', 2) - 0.35, B('rainup', 0.6)],
    ['C4', 'rainup', B('rainup', 0.6), B('tiles', 0.6)],
    ['C5', 'tiles', B('tiles', 0.6), B('climb', 0.6)],
    ['C6', 'climb', B('climb', 0.6), B('balcony', 0.6)],
    ['C7', 'balcony', B('balcony', 0.6), f(GK_BALC[1].go + GK_BALC_FOLD + 2.6)],
    ['C7b', 'balcony2', f(GK_BALC[1].go + GK_BALC_FOLD + 2.6), B('trees', 0.6)],
    ['C8', 'trees', B('trees', 0.6), B('ten', 0.6)],
    ['C9', 'ten', B('ten', 0.6), B('ceiling', 0.6)],
    // 4 — upside down: your ceiling; your block, hanging; the furniture goes again (and smashes the lamp); the crack;
    //     the cars 7 km up; the pigeons; the swings; the girl; everything climbing
    ['D0', 'ceiling', B('ceiling', 0.6), B('hang', 0.6)],
    ['D1', 'block', B('hang', 0.6), B('again', 0.8)],
    ['D2', 'again', B('again', 0.8), B('crack', 0.6)],
    ['D3', 'crack', B('crack', 0.6), B('alarm', 0.6)],
    ['D4', 'sky0', B('alarm', 0.6), B('birds', 0.6)],
    ['D5', 'birds', B('birds', 0.6), B('swings', 0.6)],
    ['D6', 'swings', B('swings', 0.6), B('kid', 0.6)],
    ['D7', 'kid', B('kid', 0.6), B('rising', 0.6)],
    ['D8', 'rising', B('rising', 0.6), f(262.0)],
    ['D8b', 'rising2', f(262.0), B('high', 0.6)],
    // 5 — as high as it goes; coming back down; your things home; nothing has landed; the last 30 degrees; down is
    //     down for one second; it all comes round again
    ['E0', 'high', B('high', 0.6), f(GK_SOFA_FALL) - 0.6],
    ['E1', 'westwall', f(GK_SOFA_FALL) - 0.6, B('back', 0.6)],
    ['E2', 'back', B('back', 0.6), f(290.6)],
    ['E2b', 'back2', f(290.6), B('home', 6.0)],
    ['E3', 'home', B('home', 6.0), B('never', 0.6)],
    ['E4', 'down0', B('never', 0.6), f(312.2)],
    ['E4b', 'down1', f(312.2), gkE('never') + 3.7],
    ['E5', 'dome2', gkE('never') + 3.7, B('thirty', 0.6)],
    ['E6', 'thirty', B('thirty', 0.6), B('straight', 0.6)],
    ['E7', 'straight', B('straight', 0.6), f(345.6)],
    ['E7b', 'straight2', f(345.6), f(351.0)],
    ['E8', 'count', f(351.0), f(360.0)],
    ['E9', 'down', f(360.0), B('comes', 0.1)],
    ['E10', 'comes', B('comes', 0.1), B('question', 0.45)],
    ['E11', 'question', B('question', 0.45), 1e9],
  ];
  for (const [id, mode, t0, t1, o] of L) P.push(gkSh(id, mode, t0, t1, o || {}));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`GK_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`GK_SHOTS: ${s.id} has no length`); });
}
// the last ten seconds' quick cuts (inside 'count')
GK.subCuts = (() => { const sh = GK_SHOTS.find((s) => s.mode === 'count'), n = 6, d = (sh.t1 - sh.t0) / n; return Array.from({ length: n - 1 }, (_, i) => sh.t0 + d * (i + 1)); })();

function gkShotAt(t) { for (const s of GK_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? GK_SHOTS[0] : GK_SHOTS[GK_SHOTS.length - 1]; }
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function gkCutTimes(app) {
  const out = GK_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
// the events for the dev scrubber
SCRIPT.events = GK_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
