/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode, k, … }. One set (world.js: your house and the
   street outside it); mode picks the camera and the action. Cut points come from the captions (script.js: fzS, fzCap).
   k is the shot's clock: [[t, s], …], film time → story time, straight lines between the keys (before the first and
   after the last it carries on at the end slope), or 'open' (the cold open's clock, fzOpenS). Flags: replay (it's a
   second we've already seen), flash (a flash-forward), pov (seen through your eyes: your hands, no body).
   ===================================================================== */

// a clock that starts at story second s0 at film time t0 and runs `slow` times slower than life
const fzRun = (t0, s0, slow) => [[t0, s0], [t0 + 1, s0 + 1 / slow]];
// a rewind (dur film seconds from s1 back to s0), then on at `slow`
const fzRewind = (t0, s1, s0, dur, slow) => [[t0, s1], [t0 + dur, s0], [t0 + dur + 1, s0 + 1 / slow]];
const fzSh = (id, mode, t0, t1, k, o = {}) => Object.assign({ id, mode, t0, t1, set: 'world', k }, o);
const fzB = (id, d = 0.45) => fzS(id) - d;                       // a cut just before beat id's first caption

const FZ_SHOTS = [];
{
  const P = FZ_SHOTS, c = (id, k) => fzCap(id, k).show;
  // 1 — the cold open: the first second and a half in real time, then the clock nearly stops (fzOpenS)
  P.push(fzSh('A0', 'open', -1, fzB('gone', 0.35), 'open', { pov: true }));
  P.push(fzSh('A1', 'floor', fzB('gone', 0.35), c('gone', 1) - 0.35, 'open', { pov: true }));
  P.push(fzSh('A2', 'teaser', c('gone', 1) - 0.35, c('gone', 2) - 0.35, 'open'));
  P.push(fzSh('A3', 'flash', c('gone', 2) - 0.35, fzB('nuance', 0.4), [[c('gone', 2) - 0.35, 10.2], [fzB('nuance', 0.4), 10.42]], { flash: true }));
  P.push(fzSh('A4', 'atoms', fzB('nuance', 0.4), c('nuance', 1) - 0.35, 'open'));
  P.push(fzSh('A5', 'apart', c('nuance', 1) - 0.35, c('nuance', 2) - 0.35, 'open'));
  P.push(fzSh('A6', 'push', c('nuance', 2) - 0.35, c('nuance', 3) - 0.35, 'open'));
  P.push(fzSh('A7', 'fault', c('nuance', 3) - 0.35, fzB('rewind', 0.4), 'open'));
  // 2 — that first second again, 10× slower: the kitchen from every side
  { const t = fzB('rewind', 0.4); P.push(fzSh('B0', 'replay', t, fzB('cat'), fzRewind(t, fzOpenS(t), -0.41, 1.2, 10), { pov: true, replay: true })); }
  P.push(fzSh('B1', 'cat', fzB('cat'), fzB('mug', 0.5), fzRun(fzB('cat'), -0.22, 10), { replay: true }));
  P.push(fzSh('B2', 'mug', fzB('mug', 0.5), fzB('feet', 0.5), fzRun(fzB('mug', 0.5), 0.3, 5), { replay: true }));
  P.push(fzSh('B3', 'reach', fzB('feet', 0.5), c('feet', 2) - 0.4, fzRun(fzB('feet', 0.5), 0.15, 10), { pov: true, replay: true }));
  P.push(fzSh('B4', 'feet', c('feet', 2) - 0.4, fzB('grip', 0.4), fzRun(c('feet', 2) - 0.4, 0.42, 6), { replay: true }));
  P.push(fzSh('B5', 'slap', fzB('grip', 0.4), c('grip', 2) - 0.45, fzRun(fzB('grip', 0.4), 0.6, 14), { pov: true, replay: true }));
  P.push(fzSh('B6', 'hook', c('grip', 2) - 0.45, fzB('catrun'), fzRun(c('grip', 2) - 0.45, 1.3, 8), { replay: true }));
  P.push(fzSh('B7', 'catrun', fzB('catrun'), fzB('house', 0.5), fzRun(fzB('catrun'), 1.15, 3), { replay: true }));
  // 3 — the same second, the rest of the house
  { const t = fzB('house', 0.5); P.push(fzSh('C0', 'house', t, fzB('screws'), fzRewind(t, 1.15 + (t - fzB('catrun')) / 3, -0.1, 0.8, 20), { replay: true })); }
  P.push(fzSh('C1', 'screws', fzB('screws'), fzB('cabinets'), fzRun(fzB('screws'), -0.01, 100), { replay: true }));
  P.push(fzSh('C2', 'cabinets', fzB('cabinets'), fzB('tv'), fzRun(fzB('cabinets'), 0.05, 6), { replay: true }));
  P.push(fzSh('C3', 'tv', fzB('tv'), fzB('cotton'), fzRun(fzB('tv'), -0.05, 6), { replay: true }));
  P.push(fzSh('C4', 'curtains', fzB('cotton'), fzB('clothes', 0.4), fzRun(fzB('cotton'), 0.0, 10), { replay: true }));
  P.push(fzSh('C5', 'clothes', fzB('clothes', 0.4), fzB('sugar'), fzRun(fzB('clothes', 0.4), 1.3, 10), { pov: true, replay: true }));
  P.push(fzSh('C6', 'sugar', fzB('sugar'), fzB('street'), fzRun(fzB('sugar'), -0.05, 5), { replay: true }));
  // 4 — the same second, outside
  { const t = fzB('street'); P.push(fzSh('D0', 'street', t, fzB('brakes', 2.4), fzRewind(t, -0.05 + (t - fzB('sugar')) / 5, -0.8, 0.8, 10), { replay: true })); }
  P.push(fzSh('D1', 'brakes', fzB('brakes', 2.4), fzB('bike', 0.5), fzRun(fzB('brakes', 2.4), -0.5, 6), { replay: true }));
  P.push(fzSh('D2', 'bike', fzB('bike', 0.5), fzB('laces', 0.5), fzRun(fzB('bike', 0.5), -0.15, 5), { replay: true }));
  P.push(fzSh('D3', 'laces', fzB('laces', 0.5), fzB('walk', 0.5), fzRun(fzB('laces', 0.5), -0.1, 8), { replay: true }));
  P.push(fzSh('D4', 'walk', fzB('walk', 0.5), fzB('ladder', 0.5), fzRun(fzB('walk', 0.5), -0.3, 4), { replay: true }));
  P.push(fzSh('D5', 'ladder', fzB('ladder', 0.5), fzB('scaffold', 0.5), fzRun(fzB('ladder', 0.5), -0.05, 3), { replay: true }));
  { const t = fzB('scaffold', 0.5), u = c('scaffold', 0) + 1.6;
    P.push(fzSh('D6', 'scaffold', t, fzB('sand', 0.5), [[t, -0.1], [u, 0.02], [u + 1, 0.22]], { replay: true })); }
  P.push(fzSh('D7', 'sand', fzB('sand', 0.5), fzB('slide', 0.5), fzRun(fzB('sand', 0.5), -0.05, 4), { replay: true }));
  // 5 — everything slides (one continuous clock, slowed down, from 1.55 s), the count down, the return
  const G = [[fzB('slide', 0.5), 1.55], [fzB('floor'), 2.3], [fzB('hill', 0.5), 3.95], [fzB('same', 0.5), 4.45], [fzB('realspeed'), 5.0]];
  P.push(fzSh('E0', 'slide', G[0][0], G[1][0], G));
  P.push(fzSh('E1', 'floor2', G[1][0], G[2][0], G));
  P.push(fzSh('E2', 'hill', G[2][0], G[3][0], G));
  P.push(fzSh('E3', 'same', G[3][0], G[4][0], G));
  { const t = fzB('realspeed'); P.push(fzSh('E4', 'realspeed', t, t + 5.0, [[t, 0], [t + 5, 5]], { replay: true })); }
  const H = [[fzB('realspeed') + 5.0, 5.0], [fzB('sofa'), 5.5], [fzB('bus'), 6.0], [fzB('bus') + 4.25, 6.18], [fzB('phone2', 0.5), 6.8], [fzB('warn'), 7.15], [fzE('warn') + 0.3, 7.6], [fzB('back', 0.35), 10.0]];
  P.push(fzSh('E5', 'faster', H[0][0], H[1][0], H));
  P.push(fzSh('E6', 'sofa', H[1][0], H[2][0], H));
  P.push(fzSh('E7', 'bus', H[2][0], H[4][0], H));
  P.push(fzSh('E8', 'phone2', H[4][0], H[5][0], H));
  P.push(fzSh('E9', 'warn', H[5][0], c('warn', 1) - 0.4, H));
  P.push(fzSh('E10', 'warn2', c('warn', 1) - 0.4, H[6][0], H));
  P.push(fzSh('E11', 'count', H[6][0], H[7][0], H));
  { const t = fzB('back', 0.35); P.push(fzSh('E12', 'back', t, fzB('stop'), [[t, 10], [t + 1, 11]])); }
  P.push(fzSh('E13', 'stop', fzB('stop'), fzB('bus2'), [[fzB('stop'), 9.8], [fzB('bus2'), 11.6]], { replay: true }));
  { const t = fzB('bus2'), u = c('bus2', 1) + 0.3; P.push(fzSh('E14', 'bus2', t, fzB('cat2'), [[t, 9.7], [u, 10.0], [fzB('cat2'), 11.7]], { replay: true })); }
  P.push(fzSh('E15', 'cat2', fzB('cat2'), fzB('after', 0.5), [[fzB('cat2'), 9.8], [fzB('after', 0.5), 11.0]], { replay: true }));
  // after: real time again (picking up where 'back' left off)
  { const tb = fzB('back', 0.35), sAfter = 10 + (fzB('stop') - tb) + 0.6, t = fzB('after', 0.5);
    const K = [[t, sAfter], [t + 1, sAfter + 1]];
    P.push(fzSh('E16', 'after', t, fzB('phone3'), K));
    P.push(fzSh('E17', 'phone3', fzB('phone3'), fzB('question', 0.5), K));
    P.push(fzSh('E18', 'question', fzB('question', 0.5), 1e9, K)); }
}
// s = 10 on screen (the blow), and the moment before it when everything stops dead (mix.js: 0.42 s of silence)
FZ.tB = fzB('back', 0.35); FZ.hold = FZ.tB - 0.42;
// (the mix's dynamics map keys: the slide's build, real speed, the warning)
FZ.tSlide = fzB('slide', 0.5); FZ.tRS = fzB('realspeed'); FZ.tWarn = fzB('warn');
// the count down's quick cuts (inside 'count'): round the house and the street, every ~0.9 s
// the return's quick cuts (inside 'back', real speed): the street, the cat (her paws catch), the bus (on its side at
// 11.25), then wide
FZ.backCuts = [FZ.tB + 0.32, FZ.tB + 0.86, FZ.tB + 1.62];
FZ.countCuts = (() => { const sh = FZ_SHOTS.find((s) => s.mode === 'count'), n = 8, d = (sh.t1 - sh.t0) / n; return Array.from({ length: n - 1 }, (_, i) => sh.t0 + d * (i + 1)); })();

// a shot's clock at film time t, and its speed (story seconds per film second)
function fzClock(shot, t) {
  const K = shot.k;
  if (K === 'open') return fzOpenS(t);
  let i = 0;
  while (i < K.length - 2 && t >= K[i + 1][0]) i++;
  const [ta, sa] = K[i], [tb, sb] = K[i + 1];
  return sa + (sb - sa) * (t - ta) / (tb - ta);
}
function fzRate(shot, t) { const h = 1 / 60; return (fzClock(shot, t + h) - fzClock(shot, t - h)) / (2 * h); }
function fzShotAt(t) { for (const s of FZ_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? FZ_SHOTS[0] : FZ_SHOTS[FZ_SHOTS.length - 1]; }
function fzStoryAt(t) { return fzClock(fzShotAt(t), t); }
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function fzCutTimes(app) {
  const out = FZ_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
// the story's clock on the kitchen wall: 8:14:07 AM at s = 0
const FZ_CLOCK0 = 8 * 3600 + 14 * 60 + 7;
function fzClockParts(s) { const x = FZ_CLOCK0 + s, h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = x % 60; return { h, m, sec }; }
// the events for the dev scrubber
SCRIPT.events = FZ_SHOTS.filter((s, i) => i === 0 || s.mode !== FZ_SHOTS[i - 1].mode).map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
