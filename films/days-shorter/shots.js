/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   dsS, dsC, dsB, dsE) and land where the story clock may jump (it only jumps forward, at a cut: the owner's rule of
   2026-10-29). The real-speed moments run across their cuts: each new angle moves the week on.
   ===================================================================== */

const dsSh = (id, mode, t0, t1, o = {}) => Object.assign({ id, mode, t0, t1, set: 'world' }, o);

const DS_SHOTS = [];
{
  const P = DS_SHOTS, c = dsC, B = dsB;
  const L = [
    // 1 — Sunday: the rule; the sun racing over the park; the dishes; the early sunset; the Moon; the first quake; Monday's sunrise; the news
    ['A0', 'title', -1, c('start', 0) + 2.2],
    ['A1', 'park', c('start', 0) + 2.2, B('math', 0.5)],
    ['A2', 'street', B('math', 0.5), B('dish')],
    ['A3', 'dish', B('dish'), c('dish', 1) - 0.4],
    ['A4', 'tv', c('dish', 1) - 0.4, B('sunset')],
    ['A5', 'sunset', B('sunset'), B('real')],
    ['A6', 'moon', B('real'), B('quake')],
    ['A7', 'quake', B('quake'), B('sunrise')],
    ['A8', 'sunrise', B('sunrise'), B('node')],
    ['A9', 'news', B('node'), B('midnight')],
    // 2 — Tuesday to Thursday: clocks against the sun; the week compresses; the scale, the push, the marble; the pond, the car
    ['B0', 'clock', B('midnight'), c('midnight', 1) - 0.5],
    ['B1', 'awake', c('midnight', 1) - 0.5, B('birds')],
    ['B2', 'birds', B('birds'), B('lamps')],
    ['B3', 'lamps', B('lamps'), B('wed')],
    ['B4', 'wed', B('wed'), B('scale')],
    ['B5', 'scale', B('scale'), B('push')],
    ['B6', 'push', B('push'), B('marble')],
    ['B7', 'marble', B('marble'), B('quake2')],
    ['B8', 'quake2', B('quake2'), B('pond')],
    ['B9', 'pond', B('pond'), B('car')],
    ['B10', 'car', B('car'), c('car', 1) - 0.3],
    ['B11', 'car2', c('car', 1) - 0.3, B('friday')],
    // 3 — Friday: days strobe; crooked swings; lighter; jumping; the crooked glass
    ['C0', 'friday', B('friday'), B('swings')],
    ['C1', 'swings', B('swings'), B('lighter')],
    ['C2', 'lighter', B('lighter'), B('jump')],
    ['C3', 'jump', B('jump'), B('glass')],
    ['C4', 'glass', B('glass'), B('sat')],
    // 4 — Saturday: midnight in daylight; the sofa; the spire; clinging on; the cars; the equator; the 9-second sunset; the stars; the last sunrise
    ['D0', 'sat', B('sat'), B('slide')],
    ['D1', 'slide', B('slide'), B('spire')],
    ['D2', 'spire', B('spire'), B('lean')],
    ['D3', 'lean', B('lean'), B('cars')],
    ['D4', 'cars', B('cars'), B('equator')],
    ['D5', 'equator', B('equator'), B('sunset2')],
    ['D6', 'sunset2', B('sunset2'), B('stars')],
    ['D7', 'stars', B('stars'), B('dawn')],
    ['D8', 'dawn', B('dawn'), B('question', 0.45)],
    ['D9', 'question', B('question', 0.45), 1e9],
  ];
  for (const [id, mode, t0, t1, o] of L) P.push(dsSh(id, mode, t0, t1, o || {}));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`DS_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`DS_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of DS_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`DS_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function dsShotAt(t) { for (const s of DS_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? DS_SHOTS[0] : DS_SHOTS[DS_SHOTS.length - 1]; }
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function dsCutTimes(app) {
  const out = DS_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
// the events for the dev scrubber
SCRIPT.events = DS_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
