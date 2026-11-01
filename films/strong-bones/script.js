/* =====================================================================
   SCRIPT — "What if you were 10× stronger, but your bones weren't?" (1-minute narrated test, 16:9, 30 fps).
   ★ The edit is built AROUND THE VOICE: every beat comes from the narration's word times (window.SBT, written by
   build-timing.cjs from the ElevenLabs clips). Structure from the reference study
   (/mnt/project-files/reflex-video-study/STUDY.md): an everyday hook with a reaction line from the sister (colour
   mark: yellow), the rule that decides the climax (muscles ×10, bones ×1), a record and a nickname, the moral choice
   with a silence, one-line aftermath, a cliffhanger letter, one question. Pure function of time.
   ===================================================================== */

const sbS = (id) => SBT.clips[id].start;                 // clip starts
const sbE = (id) => SBT.clips[id].end;                   // clip ends
const sbW = (id, k) => SBT.clips[id].words[k].s;         // a word starts (index in the clip)
// the word in clip id whose text starts with `w` (the n-th such word)
function sbWord(id, w, n = 0) {
  const L = SBT.clips[id].words.filter((x) => x.w.toLowerCase().replace(/[^a-z']/g, '').startsWith(w.toLowerCase()));
  if (!L[n]) throw new Error(`word "${w}" not in clip ${id}`);
  return L[n].s;
}

// the moments the picture is built on (film seconds)
const SB = {};
SB.end = SBT.duration;
SB.lid = sbWord('jar', 'comes') + 0.05;                  // the lid comes off with the rim
SB.mugUp = sbWord('mug', 'pick') - 0.05;                 // you lift the mug
SB.mug = sbWord('mug', 'comes') + 0.02;                  // the mug drops off its handle
SB.fist = sbWord('nuance', 'harder') - 0.25;             // you close your hand, very carefully
SB.liftA = sbWord('record', 'lift') - 0.1;               // the bar leaves the floor
SB.liftB = sbWord('record', 'beat') + 0.2;               // the bar at the shoulders
SB.pan = sbWord('scaffold', 'through');                  // you turn to the loading door
SB.lean = sbWord('scaffold', 'lean') - 0.2;              // the scaffold starts to go
SB.choice = sbE('cost');                                 // ★ the silence
SB.letGo = SB.choice + 1.6;                              // your hands leave the bar
SB.run = SB.choice + 3.6;                               // you run
SB.catch = SB.run + 1.5;                                // ★ you catch it (both arms)
SB.black = SB.catch + 0.55;                              // cut to black
SB.after = sbS('after') - 0.55;                          // a week later… (the kitchen, casts)
// the scaffold's lean (degrees from upright): a base that slips and creeps, then tips fast; it reaches your hands
// (≈ 34°) at the catch and is held there. (Story timing, not a free fall: a 6 m tower falls in about 2 s once it goes.)
function sbLeanDeg(t) {
  if (t < SB.lean) return 0.4;
  const u = sbClamp((t - SB.lean) / (SB.catch - SB.lean));
  return 0.4 + 33.6 * Math.pow(u, 3.2);
}

CONFIG.duration = SB.end;
CONFIG.seed = 20261101;
CONFIG.render.shadowMapSize = 2048;
Object.assign(CONFIG.camera, { cameraHeight: 1.6, bobStrength: 0, breathingStrength: 0, fov: 50 });

const SCRIPT = {
  meta: { title: 'What if you were 10× stronger, but your bones weren’t?', wav: 'strong-bones-soundtrack.wav' },
  events: [],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.6]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: { captions: [], readouts: [] },
};
const SCRIPT_TRACKS = {};
