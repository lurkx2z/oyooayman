/* =====================================================================
   SCRIPT — "What if sound kept getting slower and couldn't stop?" (16:9, 1920×1080, 30 fps, ≈ 8 min, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.SST, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js, PLAN.md § 2) runs on STORY time h (hours after 7:00 on Saturday). This file maps film time
   to story time: real time inside every scene (so every delay, echo and Doppler shift you hear is the real one at
   that moment), and a short time-lapse into each new hour, with every caption's clock time pinned to the moment it
   really happens. Everything is a pure function of film time.
   ===================================================================== */

const SST_ID = Object.fromEntries(SST.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function ssW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = SST_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`ssW: "${txt}" not found in beat ${id}`);
}
const ssS = (id) => SST_ID[id].first;         // the beat's first caption appears
const ssE = (id) => SST_ID[id].end;           // its last caption goes
const ssCap = (id, k) => SST_ID[id].caps[k];  // a caption: { text, show, hide, words }

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const SS = {};
// 1 — the cold open (3 PM, the high street), the title
SS.titleShot = ssS('title') - 0.55;
SS.title = [ssS('title') - 0.3, ssE('title') + 0.6];
// 2 — the morning: the garden, the blackbird, the airliner, the boom, the neighbour, the kitchen
SS.seven = ssS('seven') - 0.5;
SS.halves = ssCap('seven', 2).show;                     // "that speed halves": the readout starts to fall
SS.bird = ssS('bird') - 0.45;
SS.song = ssCap('bird', 0).show + 0.6;                  // the blackbird's first phrase
SS.plane = ssS('plane') - 0.5;
SS.boom = ssS('boom') - 0.5;
SS.boomAt = ssCap('boom', 1).show - 0.15;               // ★ the boom reaches the garden (7:27:23)
SS.others = ssCap('boom', 2).show - 0.2;                // more contrails, more booms
SS.carpet = ssS('carpet') - 0.45;
SS.eight = ssS('eight') - 0.5;
SS.morning = ssCap('eight', 1).show + 0.3;              // "Good morning!" (his mouth: the rings)
SS.throat = ssS('throat') - 0.4;
SS.kettle = ssS('kettle') - 0.5;
SS.whistle = ssCap('kettle', 0).show - 0.2;
SS.radio = ssS('radio') - 0.45;
// 3 — the kitchen echoes, the vowels go, the motorway
SS.nine = ssS('nine') - 0.5;
SS.spoon = ssS('spoon') - 0.35;
SS.drop = ssCap('spoon', 1).show - 0.6;                 // ★ the spoon hits the floor
SS.ten = ssS('ten') - 0.5;
SS.text = ssCap('ten', 3).show - 0.4;                   // your phone: everyone's texting
SS.motorway = ssS('motorway') - 0.55;
// 4 — the street
SS.eleven = ssS('eleven') - 0.5;
SS.siren = ssS('siren') - 0.45;
SS.sirenPass = ssCap('siren', 2).show + 0.1;           // ★ the ambulance passes you
SS.silent = ssS('silent') - 0.5;
SS.after = ssS('after') - 0.4;
SS.carPass = ssCap('after', 1).show - 0.9;              // ★ a car passes you close: the crack
SS.backwards = ssS('backwards') - 0.45;
SS.musicPass = ssCap('backwards', 1).show - 0.2;        // ★ the music car passes you
SS.noon = ssS('noon') - 0.5;
SS.bell = ssW('noon', 'noon').start;                    // ★ the bell rings (12:00:00)
SS.bellHeard = ssCap('noon', 2).show + 0.25;            // … and reaches you (12:01:15)
SS.ball = ssS('ball') - 0.45;
SS.kick = ssCap('ball', 1).show - 0.35;                 // ★ the hard kick
SS.flying = ssS('flying') - 0.5;
SS.horizon = ssS('horizon') - 0.3;
SS.one = ssS('one') - 0.5;
SS.shout = ssCap('one', 2).show + 0.2;                  // your friend shouts (downwind: the wind blows from you to her)
SS.two = ssS('two') - 0.5;
SS.behind = ssCap('two', 2).show + 0.1;                 // you step behind the van
SS.ears = ssS('ears') - 0.4;
SS.three = ssS('three') - 0.5;
SS.popcorn = ssS('popcorn') - 0.3;
// 5 — home
SS.four = ssS('four') - 0.55;
SS.clap = ssS('clap') - 0.4;
SS.clapAt = ssCap('clap', 0).show + 0.35;               // ★ the clap
SS.earbuds = ssS('earbuds') - 0.45;
SS.five = ssS('five') - 0.5;
SS.meow = ssCap('five', 1).show - 2.2;                  // the cat meows as she sets off towards you
SS.hum = ssS('hum') - 0.45;
// 6 — the evening
SS.storm = ssS('storm') - 0.55;
SS.flash = ssCap('storm', 1).show - 0.4;                // ★ the lightning
SS.eight2 = ssS('eight2') - 0.6;
SS.box = ssS('box') - 0.55;
SS.boxGo = ssCap('box', 2).show - 0.3;                  // ★ the music box starts (22:00:00)
SS.boxTune = 6.4;                                       // its tune lasts 6.4 s (as played)
SS.walkinto = ssS('walkinto') - 0.4;
SS.wait = ssS('wait') - 0.4;
SS.arrives = ssS('arrives') - 0.45;
SS.tuneHere = ssCap('arrives', 1).show + 0.5;           // ★ the first note reaches you
// 7 — the night
SS.midnight = ssS('midnight') - 0.6;
SS.stop = ssS('stop') - 0.4;
SS.last = ssS('last') - 0.5;
SS.beat = ssCap('last', 2).show - 1.0;                  // the heartbeat
// 8 — is any of this real; the question
SS.real = ssS('real') - 0.8;
SS.real2 = ssS('real2') - 0.3;
SS.real3 = ssS('real3') - 0.4;
SS.real4 = ssS('real4') - 0.4;
SS.real5 = ssS('real5') - 0.4;
SS.question = ssS('question') - 0.6;
SS.end = SST.duration;

// ---------------------------------------------------------------------------------------------------------------------
// FILM TIME → STORY TIME h (hours after 7:00 Saturday). Keys [film t, h], linear between them. Inside a scene the
// keys run at real time (1 s per s); between scenes the clock races to the next hour in the last LAPSE seconds
// before the cut (the readout falls, the clock spins). A few beats lapse on screen (the bell, the music box, the
// night) where the caption says so.
// ---------------------------------------------------------------------------------------------------------------------
const SS_HKEYS = [];
const SS_LAPSE = 1.3;
{
  const K = SS_HKEYS, hr = 1 / 3600;
  // a scene from film t0 to t1 in real time, with film time tp pinned to story time hp
  const real = (t0, t1, tp, hp) => { K.push([t0, hp + (t0 - tp) * hr], [t1, hp + (t1 - tp) * hr]); };
  // the scenes, in order: [cut in, cut out (the next scene's cut), pinned film time, pinned h]
  const at = ssAtClock;
  const scenes = [
    [-1, SS.titleShot, 0, 8 + 0.0 * hr],                                          // the cold open: 3 PM
    [SS.titleShot, SS.plane, ssS('seven'), 0],                                    // 7:00:00 on "7:00 AM"
    [SS.plane, SS.boom, ssCap('plane', 2).show, ssHourAt(SSP.plane * SSP.c0 / SSP.cAlt0) + 3 * hr],  // breaking it at 11 km (7:14:19)
    [SS.boom, SS.eight, SS.boomAt, ssHourAt(SSP.plane) + 1 * hr],                // the boom reaches the ground (7:27:23)
    [SS.eight, SS.nine, ssS('eight'), 1],
    [SS.nine, SS.ten, ssS('nine'), 2],
    [SS.ten, SS.motorway, ssS('ten'), 3],
    [SS.motorway, SS.eleven, ssS('motorway'), ssHourAt(SSP.motorway) - 2 * hr],
    [SS.eleven, SS.silent, ssS('eleven'), 4],
    [SS.silent, SS.noon, ssS('silent'), at(11, 41)],
    // (the noon scene: real time to the bell, then a lapse to the bell's arrival, then real time)
    [SS.noon, SS.bell + 1.0, SS.bell, 5],
    [SS.bellHeard - 0.25, SS.ball, SS.bellHeard, ssArriveH(5, 800)],
    [SS.ball, SS.one, ssS('ball'), at(12, 3)],
    [SS.one, SS.two, ssS('one'), 6],
    [SS.two, SS.three, ssS('two'), 7],
    [SS.three, SS.four, ssS('three'), 8],
    [SS.four, SS.five, ssS('four'), 9],
    [SS.five, SS.storm, ssS('five'), 10],
    [SS.storm, SS.eight2, ssS('storm'), 11],
    [SS.eight2, SS.box, ssS('eight2'), 13],
    // (the music box: real time from 22:00 until you sit down to wait; then the clock races to its arrival)
    [SS.box, ssCap('wait', 1).show, SS.boxGo, 15],
    [SS.tuneHere - 1.6, SS.midnight, SS.tuneHere, ssArriveH(15, SSP.box)],
    [SS.midnight, ssCap('stop', 1).show - 0.6, ssS('midnight'), 17],
    // (3 AM, 6 AM: the night lapses on screen; then the dawn in real time)
    [ssCap('stop', 1).show + 0.2, ssCap('stop', 2).show - 0.6, ssCap('stop', 1).show + 0.2, 20],
    [ssCap('stop', 2).show + 0.2, SS.end + 2, ssCap('stop', 2).show + 0.2, 23],
  ];
  for (const [t0, t1, tp, hp] of scenes) {
    const last = K.length ? K[K.length - 1] : null;
    // (the lapse into this scene: the previous scene stops at real time LAPSE s before this cut)
    // (no lapse back in time: the cold open (3 PM) cuts straight to 6:59)
    if (last && hp + (t0 - tp) / 3600 > last[1] && last[0] > t0 - SS_LAPSE && last[0] >= t0 - 0.01) { last[1] = last[1] - (last[0] - (t0 - SS_LAPSE)) * hr; last[0] = t0 - SS_LAPSE; }
    real(t0, t1, tp, hp);
  }
  for (let i = 1; i < K.length; i++) if (K[i][0] <= K[i - 1][0]) K[i][0] = K[i - 1][0] + 1e-3;
}
function ssH(t) {
  const K = SS_HKEYS;
  if (t <= K[0][0]) return K[0][1] + (t - K[0][0]) / 3600;
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, h0] = K[i - 1], [t1, h1] = K[i]; return h0 + (h1 - h0) * (t - t0) / (t1 - t0); }
  const L = K[K.length - 1]; return L[1] + (t - L[0]) / 3600;
}
const ssCNow = (t) => ssC(ssH(t));
// is the clock lapsing at t (faster than real time)?
function ssLapsing(t) { const a = ssH(t - 0.02), b = ssH(t + 0.02); return (b - a) * 3600 / 0.04 > 1.5; }

CONFIG.duration = SS.end;
CONFIG.seed = 20261026;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if sound kept getting slower and couldn\'t stop?', wav: 'slower-sound-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · 3 PM' }, { id: 'title', time: SS.title[0], label: 'title' },
    { id: 's2', time: SS.seven, label: '2 · 7 AM' }, { id: 'boom', time: SS.boomAt, label: '★ boom' },
    { id: 's3', time: SS.nine, label: '3 · kitchen' }, { id: 's4', time: SS.eleven, label: '4 · street' }, { id: 'noon', time: SS.noon, label: 'noon' },
    { id: 's5', time: SS.four, label: '5 · home' }, { id: 's6', time: SS.storm, label: '6 · evening' }, { id: 'box', time: SS.box, label: 'music box' },
    { id: 's7', time: SS.midnight, label: '7 · midnight' }, { id: 's8', time: SS.real, label: '8 · real' }, { id: 'q', time: SS.question, label: 'question' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: SS.title[0], out: SS.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF SOUND</span><span class="hero">KEPT GETTING SLOWER</span><span class="kick k2">AND COULDN\'T STOP?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
