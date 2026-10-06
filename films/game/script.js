/* =====================================================================
   SCRIPT — "POV: This video is a game. Don't die."
   ★ The one file to edit for timings, the camera, the stillness windows
   and the speech. Everything is a pure function of film time t.
   Shot plan, safe zones and touch targets: films/game/PLAN.md
   ===================================================================== */

CONFIG.duration = 51.6;
CONFIG.seed = 20261014;
Object.assign(CONFIG.camera, { cameraHeight: 1.66, walkSpeed: 1.2, bobStrength: 0.012, bobFrequency: 1.7, breathingStrength: 0.004, breathRate: 14, fov: 60 });
CONFIG.render.shadowMapSize = 2048;

// the facility (metres; you start at the origin looking down −Z)
const GF = {
  eye: 1.66,
  view: { x0: -3.0, x1: 3.0, z0: -0.95, z1: 3.2, h: 3.1 },                 // your side of the glass
  glassZ: -0.95,
  cell: { x0: -2.6, x1: 2.6, z0: -5.8, z1: -0.95, h: 3.0 },
  doorL: { x: -0.72, w: 0.9, h: 2.1 }, doorR: { x: 0.72, w: 0.9, h: 2.1 },   // in the cell's back wall (z = cell.z0)
  corrL: { x0: -1.62, x1: -0.17, z0: -10.5, h: 2.8 },                        // the left route (hazard)
  corrB: { x0: 0.17, x1: 1.97, z0: -12.6, h: 2.9, ax: 1.07 },                // the right route
  doorB: { x: 1.07, w: 1.3, h: 2.4 },                                         // the blast door at corrB.z0
  pad: { x: 1.07, y: 1.06, r: 0.16 },                                         // HOLD HERE (on the blast door)
  scanner: { x: 0.17, y: 1.36, z: -11.95 },                                    // his palm (on the corridor's left wall)
  hall: { x0: -1.9, x1: 4.6, z0: -23.5, h: 5.2 },                             // the core hall (z1 = corrB.z0)
  caseP: [1.85, -15.25], core: [1.07, -19.6], hatch: [1.07, -23.45], dock: [1.07, 4.95, -17.4],
};

// the beats (film seconds)
const GM = {
  boot: [0, 0.5], detected: 0.12, hearts: 0.25,
  hook: { wait: [0.4, 1.0], see: [1.05, 1.85], dont: [1.9, 3.3] },
  touch: { step: [3.3, 4.25], palm: 4.35, prompt: 4.45, contact: 5.75, whoa: [6.0, 6.7], feel: [6.85, 8.05] },
  tech: { door: 7.3, enter: [7.45, 9.15], who: [8.5, 9.6], point: 9.55, them: [9.75, 10.35], look: 10.2, nobody: [10.5, 11.7] },
  alarm: 11.8, glass: [12.0, 12.6], doors: [12.2, 12.75], techOut: [12.3, 13.4],
  choice: { ui: 12.7, n: [12.9, 13.7, 14.5], zero: 15.3, blast: 15.32, result: [15.5, 17.1] },
  hold: { arrive: 17.0, help: [17.2, 17.95], palm: 17.35, ui: 17.6, start: 17.9, steps: [18.4, 18.95, 19.5, 20.05, 20.6], open: [20.75, 21.45], ctrl: [20.95, 21.95] },
  roul: { ui: 22.6, spin: [22.9, 25.1], land: 25.9, remember: [26.0, 27.6] },
  sys: { flicker: 27.7, input: 28.0, observer: 28.9, end: 31.0, knows: [29.6, 30.9] },
  edge: { right: 31.05, bottom: 31.75, back: 32.35, what: [32.5, 33.8] },
  drone: { drop: 33.8, table: [34.2, 37.6], charge: 36.4, fire: 37.35 },
  reset: { n5: 37.7, run: 37.8, no: [37.95, 38.55], press: 38.9, hand: [39.2, 39.85], pat: 39.98, n4: 39.6, real: [40.05, 41.3], n3: 41.2, wind: 41.45, hit: 42.2, shatter: [42.4, 43.5] },
  reach: { start: 43.45, say: [43.8, 45.0], target: [44.2, 45.6], n1: 44.4, contact: 45.6, glitch: [45.8, 46.2], override: 46.2, cancelled: 46.7 },
  end: { cut: 47.8, come: [48.0, 48.9], score: 49.0, item: 50.15, black: 51.55 },
};

// the touch targets (design px). Every one is reached with the thumb and sits clear of the platform's buttons and captions
const GM_TARGETS = {
  palm: { x: 540, y: 1130 },
  pad: { x: 540, y: 1150 },
  screen: { x: 300, y: 1110 },        // where his palm lands on the screen, beside his face (the ripple's centre)
  crack: { x: 540, y: 1170 },         // where his fist lands (below his face, so the hole opens under it)
  finger: { x: 540, y: 1225 },        // his fingertip through the hole (below his chin: never a "shh")
};
const GM_SAFE = { top: 200, right: 900, rightY: [700, 1560], bottom: 1500 };

const GM_ITEMS = [
  { id: 'key', name: 'KEY', res: 'opens the hatch', ok: '✓' },
  { id: 'shield', name: 'SHIELD', res: 'blocks the shot', ok: '✓' },
  { id: 'medkit', name: 'MEDKIT', res: 'restores', ok: '+1' },
  { id: 'light', name: 'LIGHT', res: 'useless here', ok: '−1' },
];
// the roulette: which item is showing at film time t (0.2 s per item while it spins, then slower, landing on SHIELD)
const GM_SPIN = (() => {
  const S = GM.roul.spin, out = []; let t = S[0], i = 0;
  while (t < S[1] - 1e-6) { out.push([t, i % 4]); t += 0.2; i++; }
  for (const d of [0.24, 0.3, 0.38]) { out.push([t, i % 4]); t += d; i++; }
  while (i % 4 !== 1) { out.push([t, i % 4]); t += 0.3; i++; }
  out.push([GM.roul.land, 1]);
  return out;
})();
function gmItemAt(t) { let k = GM_SPIN[0][1]; for (const [t0, j] of GM_SPIN) if (t >= t0) k = j; return k; }

// where you stand: behind the glass; under the lifting glass; the dash through the right door; at the blast door; into the hall
const GC = {
  z0: 0, zIn: -0.6, hold: [GF.corrB.ax, -9.6], hall: [GF.corrB.ax, -13.55],
};

const SCRIPT = {
  meta: { title: 'POV: This video is a game. Don’t die.', wav: 'game-soundtrack.wav' },
  events: [
    { id: 'boot', time: 0.0, label: 'PLAYER DETECTED · ❤❤❤ · “Wait…” “You can see me?” DON’T LET ME DIE.' },
    { id: 'touch', time: 3.3, label: 'Put your finger on my hand (contact 6.0)' },
    { id: 'tech', time: 7.75, label: '“Who are you talking to?” “Them.” “There’s nobody there.”' },
    { id: 'alarm', time: 11.8, label: 'Alarm; the glass lifts; CHOOSE! 3-2-1 (tilt)' },
    { id: 'result', time: 15.3, label: 'RIGHT = SAFE · LEFT = −1 ❤' },
    { id: 'hold', time: 17.0, label: '“Help me.” HOLD HERE 21→100 %; the door lifts' },
    { id: 'roulette', time: 22.6, label: 'TAP TO STOP ON YOUR ITEM' },
    { id: 'system', time: 27.7, label: 'EXTERNAL INPUT DETECTED · OBSERVER CONNECTION ACTIVE' },
    { id: 'edge', time: 31.05, label: '“What’s outside my world?”' },
    { id: 'drone', time: 33.8, label: 'WHAT ITEM DID YOU GET?' },
    { id: 'reset', time: 37.7, label: 'RESET IN 5 · his palm on the screen' },
    { id: 'crack', time: 41.2, label: 'RESET IN 3 · 2 — the crack, the void' },
    { id: 'reach', time: 43.45, label: '“Put your finger here.” · 1 · RESET CANCELLED' },
    { id: 'end', time: 47.8, label: '“Come back.” · the score' },
  ],

  camera: {
    baseY: 0,
    height: [[0, GF.eye]],
    x: [[0, 0], [15.5, 0], [15.9, 0.3], [16.3, 0.72, 'linear'], [16.6, 0.95, 'linear'], [17.05, GC.hold[0], 'outQuad'], [21.55, GC.hold[0]], [22.7, GC.hall[0]], [60, GC.hall[0]]],
    z: [[0, GC.z0], [12.6, GC.z0], [13.3, GC.zIn], [15.5, GC.zIn], [15.9, -2.4, 'inQuad'], [16.3, -5.6, 'linear'], [16.6, -7.6, 'linear'], [17.05, GC.hold[1], 'outQuad'],
      [21.55, GC.hold[1]], [22.7, GC.hall[1], 'inOutSine'], [37.75, GC.hall[1]], [38.3, GC.hall[1] + 0.12, 'outQuad'], [60, GC.hall[1] + 0.12]],
    // yaw: + is left (0 = straight ahead, −Z)
    yaw: [[0, 0], [7.9, 0], [8.6, -3.5], [11.8, -3.5], [12.3, 1.5], [12.9, 0], [15.5, 0], [15.75, -16], [16.1, -12], [16.6, -3], [17.05, 0],
      [22.0, 0], [22.8, -24], [27.3, -24], [28.0, 0], [60, 0]],
    pitch: [[0, -2], [3.3, -2], [4.25, -6], [7.9, -6], [8.6, -4], [11.8, -4], [12.6, -1], [15.3, -1], [15.6, -2], [16.6, -2], [17.05, -4],
      [21.0, -4], [21.6, 1], [22.8, 0.5], [27.3, 0.5], [28.0, -3], [33.8, -3], [34.6, 0.5], [37.3, 0.5], [37.8, -2], [60, -2]],
    fov: [[0, 34], [1.9, 29], [3.3, 44], [4.25, 60], [7.9, 60], [8.6, 62], [12.6, 62], [13.3, 60], [16.6, 64], [17.05, 66], [21.55, 66], [22.8, 60],
      [27.6, 54], [30.9, 50], [31.3, 44], [33.8, 44], [34.6, 56], [37.75, 56], [38.6, 62], [47.75, 62], [47.8, 48, 'step'], [60, 46]],
    tilt: [[0, 0], [15.5, 0], [15.8, -9], [16.2, -7], [16.7, 0], [60, 0]],
    startles: [[6.0, 0.15], [11.8, 0.25], [15.45, 0.35], [38.9, 0.35]],
    shakes: [[11.8, 0.25, 0.4], [15.45, 0.5, 0.35], [20.75, 0.35, 0.4], [37.35, 0.9, 0.3], [42.2, 1.3, 0.3], [45.8, 0.5, 0.25]],
  },

  // your head: a normal POV at first; perfectly still in every touch window; less and less like a body as he notices you
  tracks: {
    pov: [[0, 1], [4.2, 1], [4.4, 0], [6.6, 0], [7.2, 0.6], [12.6, 0.6], [12.9, 0.25], [15.5, 0.25], [15.6, 0.15], [17.4, 0.15], [17.6, 0],
      [20.7, 0], [20.75, 1], [21.4, 0.4], [27.6, 0.3], [31.0, 0], [33.8, 0], [34.0, 0.4], [37.3, 0.4], [37.35, 1], [38.0, 0.5], [38.85, 0.5], [38.9, 1], [39.4, 0.2],
      [42.1, 0.2], [42.2, 1], [43.4, 1], [43.6, 0], [45.75, 0], [45.8, 1], [46.6, 0.3], [47.8, 0.3], [47.8, 0.15, 'step'], [60, 0.15]],
  },

  hands: { left: [[0, 'hidden']], right: [[0, 'hidden']] },

  // (the game HUD, the system HUD and the speech are drawn by hud.js from GM and GM_SAY)
  hud: { captions: [], readouts: [], says: [], notes: [] },
  people: [],
};

// speech: who, text, window. A = NPC_AWARE_01, T = the technician
const GM_SAY = [
  ['A', 'Wait…', GM.hook.wait], ['A', 'You can see me?', GM.hook.see],
  ['A', 'Whoa…', GM.touch.whoa], ['A', 'I can feel you.', GM.touch.feel],
  ['T', 'Who are you talking to?', GM.tech.who], ['A', 'Them.', GM.tech.them], ['T', 'There’s nobody there.', GM.tech.nobody],
  ['A', 'Help me.', GM.hold.help], ['A', 'You’re controlling this place.', GM.hold.ctrl],
  ['A', 'It knows you’re here.', GM.sys.knows, 'quiet'],
  ['A', 'What’s outside my world?', GM.edge.what],
  ['A', 'No—', GM.reset.no], ['A', 'You’re really there.', GM.reset.real],
  ['A', 'Put your finger here.', GM.reach.say],
  ['A', 'Come back.', GM.end.come, 'quiet'],
];

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
