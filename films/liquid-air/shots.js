/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   laS, laC, laB, laE) and land where the story clock may jump (it only jumps forward, at a cut: the owner's rule of
   2026-10-29). The crash and the sun run at real speed across their cuts: each new angle moves the hour on.
   ===================================================================== */

const laSh = (id, mode, t0, t1, o = {}) => Object.assign({ id, mode, t0, t1, set: 'world' }, o);

const LA_SHOTS = [];
{
  const P = LA_SHOTS, c = laC, B = laB, E = laE;
  const L = [
    // 1 — 3:00 in your living room: drops out of nothing; the sun goes; the weight of the sky; your ears; get down
    ['A0', 'title', -1, B('start', 0.3)],
    ['A1', 'drops', B('start', 0.3), c('start', 1) + 2.0],
    ['A2', 'room1', c('start', 1) + 2.0, B('real', 0.5)],
    ['A3', 'real', B('real', 0.5), B('dark', 0.6)],
    ['A4', 'dark', B('dark', 0.6), B('weight', 0.6)],
    ['A5', 'weight', B('weight', 0.6), B('floor', 0.5)],
    ['A6', 'floor', B('floor', 0.5), B('ears', 0.6)],
    ['A7', 'ears', B('ears', 0.6), B('packet', 0.6)],
    ['A8', 'packet', B('packet', 0.6), B('go', 0.6)],
    ['A9', 'go', B('go', 0.6), B('stairs', 0.6)],
    // 2 — the street fills: everyone out; the deluge; the lamps; the cars float; lighter; the waist; the football; the
    //     chin; under; the girl; the street under it; no voices; a car goes down; the last of the air
    ['B0', 'stairs', B('stairs', 0.6), B('street', 0.6)],
    ['B1', 'street', B('street', 0.6), B('lamps', 0.6)],
    ['B2', 'lamps', B('lamps', 0.6), B('cars', 0.6)],
    ['B3', 'cars', B('cars', 0.6), B('light', 0.6)],
    ['B4', 'light', B('light', 0.6), B('rising', 0.6)],
    ['B5', 'rising', B('rising', 0.6), B('ball', 0.6)],
    ['B6', 'ball', B('ball', 0.6), B('chin', 0.6)],
    ['B7', 'chin', B('chin', 0.6), B('breathe', 0.6)],
    ['B8', 'breathe', B('breathe', 0.6), B('first', 0.6)],
    ['B9', 'first', B('first', 0.6), B('under', 0.6)],
    ['B10', 'under', B('under', 0.6), B('voice', 0.6)],
    ['B11', 'voice', B('voice', 0.6), B('sink', 0.6)],
    ['B12', 'sink', B('sink', 0.6), B('last', 0.6)],
    ['B13', 'last', B('last', 0.6), LA.tCrash],
    // ★ 3:10, at real speed: the sky lands (from under it, then the surface racing up your block), the sun in black
    ['C0', 'crash0', LA.tCrash, c('crash', 1) + 1.2],
    ['C1', 'crash1', c('crash', 1) + 1.2, B('sun', 1.6)],
    ['C2', 'sun', B('sun', 1.6), B('deep', 0.6)],
    // 3 — at the bottom of the sky
    ['D0', 'deep', B('deep', 0.6), B('flat', 0.6)],
    ['D1', 'flat', B('flat', 0.6), c('flat', 1) - 0.4],
    ['D2', 'glass', c('flat', 1) - 0.4, B('snell', 0.6)],
    ['D3', 'snell', B('snell', 0.6), B('moon', 0.6)],
    ['D4', 'moon', B('moon', 0.6), B('float', 0.6)],
    ['D5', 'float', B('float', 0.6), c('float', 1) - 0.4],
    ['D6', 'bins', c('float', 1) - 0.4, B('pond', 0.6)],
    ['D7', 'pond', B('pond', 0.6), B('birds', 0.6)],
    ['D8', 'birds', B('birds', 0.6), B('bell', 0.6)],
    ['D9', 'bell', B('bell', 0.6), c('bell', 1) - 0.4],
    ['D9b', 'bell2', c('bell', 1) - 0.4, B('top', 0.6)],
    ['D10', 'top', B('top', 0.6), B('cold', 0.6)],
    ['D11', 'cold', B('cold', 0.6), B('work', 0.6)],
    ['D12', 'work', B('work', 0.6), B('back', 0.6)],
    // 4 — 4:00: it turns back
    ['E0', 'back', B('back', 0.6), c('fizz', 0) - 10],
    ['E1', 'count', c('fizz', 0) - 10, c('fizz', 0) - 0.15],
    ['E2', 'fizz', c('fizz', 0) - 0.15, B('question', 0.45)],
    ['E3', 'question', B('question', 0.45), 1e9],
  ];
  for (const [id, mode, t0, t1, o] of L) P.push(laSh(id, mode, t0, t1, o || {}));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`LA_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`LA_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of LA_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`LA_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}
// the last ten seconds' quick cuts (inside 'count')
LA.subCuts = (() => { const sh = LA_SHOTS.find((s) => s.mode === 'count'), n = 6, d = (sh.t1 - sh.t0) / n; return Array.from({ length: n - 1 }, (_, i) => sh.t0 + d * (i + 1)); })();
LA.kidBreath = laStoryAt(laC('first', 1)) - 0.6;

function laShotAt(t) { for (const s of LA_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? LA_SHOTS[0] : LA_SHOTS[LA_SHOTS.length - 1]; }
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function laCutTimes(app) {
  const out = LA_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
// the events for the dev scrubber
SCRIPT.events = LA_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
