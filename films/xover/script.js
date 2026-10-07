/* =====================================================================
   SCRIPT — "Killua × Eren in WWII"
   ★ The beat times (film seconds, on a 120 BPM grid), the world clock
   with its slow-motion moments, the title and the last line.
   The action itself (who is where at every world time) is action.js;
   the camera of every shot is shots.js. Plan: films/xover/PLAN.md
   ===================================================================== */

CONFIG.duration = 72;
CONFIG.seed = 20261015;
Object.assign(CONFIG.camera, { cameraHeight: 1.6, fov: 50 });
CONFIG.render.shadowMapSize = 4096;

// the beats (film seconds)
const XB = {
  title: [0.3, 4.1],
  hush0: [4.55, 5.0], arrive: 5.0, appear: 5.4,             // an unnatural silence; two strikes in the road; the smoke parts on two figures
  halt: 6.2, spark: 8.1, order: 9.7, aim: 10.6, silence: [11.0, 12.0],
  shot: 12.0,                                                // the trigger: muzzle flash, he is gone (the drop)
  whip: 12.72, drop: [13.34, 13.12, 12.9], onTank: 14.0, cut: [15.0, 15.25], dead: 15.25, gone: 18.4,
  bite: 19.4, notice: 20.2, bolt: 20.7, ring: 21.0, rise: 22.6, reveal: 24.3, roar: 25.5,
  // the parallel section, intercut shot by shot: Eren breaks the armour, Killua breaks the crews
  fire1: 27.2, fire2: 27.8, run: 28.4, touch: 29.2, grab: 29.8, throw: 30.8, leap: 32.0, stop: 32.5, stomp: 32.9,
  fire3: 33.9, behind: 34.2, stare: 34.8, mg: 35.5, lower: 36.4, crush: 37.4, trench: 38.6,
  montage: 41.0, aura: 46.4, auraBlast: 47.6,
  radio: 49.0, battery: 50.4, barrage: 51.0, cross: 52.5, size: 54.0,
  silent: 57.0, push: 58.6, break: 60.6, smoke: 61.4, hush: [62.2, 63.0], retreat: 63.0,
  final: 65.0, titanUp: 67.0, caption: 68.2, black: 71.6,
};
// the few words on screen: [from, to, text]
const XCAPS = [[15.6, 17.8, 'KILLUA WOULD BE<br>IMPOSSIBLE TO TRACK.'], [25.9, 28.2, 'EREN WOULD CHANGE<br>THE SCALE OF THE WAR.'], [54.4, 55.9, 'AN ARMY COULD SURVIVE ONE.'], [55.9, 57.0, 'NOT BOTH.']];
// slow motion: [film from, film to, speed]
const XSLOW = [[12.12, 12.72, 0.2], [20.7, 21.5, 0.25], [30.8, 31.3, 0.3], [32.9, 33.3, 0.3], [38.6, 39.0, 0.25], [60.6, 61.4, 0.25]];
// film time → world time, and back
function xW(t) { let w = t; for (const [a, b, k] of XSLOW) { if (t <= a) break; w -= (Math.min(t, b) - a) * (1 - k); } return w; }
function xT(w) { let t = w; for (const [a, b, k] of XSLOW) { const wa = xW(a), wb = xW(b); if (w <= wa) break; t += (Math.min(w, wb) - wa) * (1 / k - 1); } return t; }
function xSlow(t) { for (const [a, b, k] of XSLOW) if (t >= a && t < b) return k; return 1; }

const SCRIPT = {
  meta: { title: 'Killua × Eren in WWII', wav: 'killua-eren-wwii.wav' },
  events: [
    { id: 'open', time: 0, label: 'The battlefield; the question' },
    { id: 'arrive', time: 5.0, label: 'Two strikes in the road; two figures; rifles lift' },
    { id: 'killua', time: 12.0, label: 'Muzzle flash — Killua is gone — on the tank' },
    { id: 'eren', time: 19.4, label: 'Eren bites his hand — the transformation' },
    { id: 'parallel', time: 27.0, label: 'Intercut: Eren vs the armour, Killua vs the crews' },
    { id: 'montage', time: 41.0, label: 'Parallel destruction; the aura walk' },
    { id: 'army', time: 49.0, label: 'The army adapts: artillery; size contrast' },
    { id: 'fail', time: 57.0, label: 'It fails' },
    { id: 'final', time: 65.0, label: 'Final poster frame' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  tracks: { pov: [[0, 0]] },
  hands: { left: [[0, 'hidden']], right: [[0, 'hidden']] },
  hud: { captions: [], readouts: [], says: [], notes: [] },
  people: [],
};
const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
