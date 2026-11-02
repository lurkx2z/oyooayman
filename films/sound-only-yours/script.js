/* =====================================================================
   SCRIPT — "What if every sound vanished except yours?" (16:9, 1920×1080, 30 fps; no narrator: captions, the HUD, the
   score, and your own voice).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.SOT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   Story time s = seconds after Thursday 9:41:00 PM, when every sound but yours stops. ONE clock for the whole film
   (SO_CLOCK): it only ever runs forward (the owner's rule of 2026-10-29), at real speed except the glass under the
   title (slow motion ×0.35), and it jumps forward only at cuts between places (the HUD says how far).
   ===================================================================== */

const SOT_ID = Object.fromEntries(SOT.groups.map((g) => [g.id, g]));
const soS = (id) => SOT_ID[id].first;         // the beat's first caption appears
const soE = (id) => SOT_ID[id].end;           // its last caption goes
const soCap = (id, k) => SOT_ID[id].caps[k];  // a caption: { text, show, hide, words, voice? }
const soC = (id, k) => SOT_ID[id].caps[k].show;
const soB = (id, d = 0.6) => soS(id) - d;     // a cut just before beat id's first caption
// the film time a word of a caption appears (its anchor), by the word's text (first match from word k0)
const soW = (id, k, word) => { const c = soCap(id, k), w = c.words.find((x) => x.text.replace(/[^\w']/g, '').toLowerCase() === word.toLowerCase()); if (!w) throw new Error(`soW: no "${word}" in ${id}:${k}`); return w.start; };
// your spoken lines: { id, start, seconds } (film time)
const SO_VOICE = SOT.groups.flatMap((g) => g.caps.filter((c) => c.voice).map((c) => Object.assign({ beat: g.id }, c.voice)));
const soVoice = (id) => SO_VOICE.find((v) => v.id === id);

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const SO = {};
SO.title = [-0.4, soE('title') + 0.2];
SO.end = SOT.duration;
SO.tStop = 0.7;                                          // ★ (film) every sound but yours stops (story s = 0)
SO.sKnock = 0.55;                                        // (story) the cat's paw sends the glass off the counter's edge
SO.tClap = soC('clap', 0) + 0.7;                         // you clap
SO.tClap2 = soC('rule', 1) + 0.4;                        // ...and again, slowly, for the diagram
SO.tWin = soC('window', 0) + 0.5;                        // you open the window
SO.tLightOut = soC('stairs', 3) + 0.7;                   // the stairwell's timer light goes out
SO.tTurn = soC('behind', 0) + 2.0;                       // you turn round on the stairs
SO.tKerb = soC('car', 0) + 0.3;                          // you step off the kerb...
SO.tCar = soC('car', 0) + 1.55;                          // ...and a car glides past 1.2 m in front of you
SO.tBolt = soC('storm', 0) + 0.5;                        // the lightning (you count from here)
SO.tShout = soVoice('y_shout').start;
SO.tDog = soC('hide', 1) - 0.2;                          // the dog lunges out of the dark
SO.tClicks = (() => {                                    // your tongue clicks in the dark (echo pictures)
  const e = (k, d = 0.25) => soC('echo', k) - d;
  return [e(1, 0.1), e(1, -1.3), e(2, 0.5), e(3, 0.7), e(4, 0.55), e(5, 0.6), e(5, -1.6), soC('who', 1) - 0.4, soC('who', 2) - 0.3, soC('question', 0) - 0.5];
})();

// THE CLOCK: segments [film t where it starts, story s there | 'cont', 'real' | ['rate', r]]. Inside a segment time
// runs at a steady rate; between segments it may jump forward (always at a cut, never back)
const SO_CLOCK = (() => {
  const B = soB;
  const S = [
    [-2, -2.7, 'real'],
    [1.25, 'cont', ['rate', 0.35]],                      // the glass goes off the edge (slow motion)
    [3.0, 'cont', 'real'],
    [B('window'), 150, 'real'],                          // 9:43:30 (+1 min)
    [B('stairs'), 360 - (soC('stairs', 0) - B('stairs')), 'real'],   // "9:47"
    [B('street'), 660 - (soC('street', 0) - B('street')), 'real'],   // "9:52"
    [B('storm'), 'skip', 30],                            // (+30 s: to the park gate)
    [B('park'), 900 - (soC('park', 0) - B('park')), 'real'],         // "9:56"
    [B('coming'), 'skip', 50],                           // (+50 s)
    [B('hide'), 1740 - (soC('hide', 0) - B('hide')), 'real'],        // "10:09"
  ];
  const out = [];
  let prev = null;
  S.forEach((g, i) => {
    const t0 = g[0], tn = i + 1 < S.length ? S[i + 1][0] : SO.end + 5;
    const at = prev ? prev.s0 + prev.rate * (t0 - prev.t0) : 0;
    const s0 = g[1] === 'cont' ? at : g[1] === 'skip' ? at + g[2] : g[1];
    const rate = g[1] === 'skip' || g[2] === 'real' ? 1 : g[2][1];
    const seg = { t0, t1: tn, s0, s1: s0 + rate * (tn - t0), rate };
    out.push(seg); prev = seg;
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`SO_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`SO_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(2)} < ${out[i - 1].s1.toFixed(2)})`);
  });
  return out;
})();
function soSegAt(t) { const K = SO_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function soStoryAt(t) { const g = soSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const soRateAt = (t) => soSegAt(t).rate;
const SO_JUMPS = SO_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - SO_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
function soFilmAt(s) { let a = -2, b = SO.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (soStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
SO.tKnock = soFilmAt(SO.sKnock);
SO.tShatter = soFilmAt(SO.sKnock + 0.43);              // 0.92 m of fall (0.43 s), then the tiles

// ---------------------------------------------------------------------------------------------------------------------
// HOW LOUD YOU ARE, moment by moment (the HUD's noise meter and its "heard by" circle): [film t, dB at 1 m, seconds]
// ---------------------------------------------------------------------------------------------------------------------
const SO_NOISE = (() => {
  const L = SOP.L, out = [], v = (id, dB) => { const c = soVoice(id); out.push([c.start, dB, c.seconds]); };
  v('y_what', 58); v('y_hello', L.voice); v('y_mum', L.voice); v('y_window', L.call); v('y_okay', 46); v('y_scared', 70); v('y_street', L.call); v('y_count', 54); v('y_shout', L.shout); v('y_who', L.whisper);
  out.push([SO.tClap, L.clap, 0.25], [SO.tClap2, L.clap, 0.25]);
  for (const t of SO.tClicks) out.push([t, L.click, 0.12]);
  return out.sort((a, b) => a[0] - b[0]);
})();

CONFIG.duration = SO.end;
CONFIG.seed = 20261103;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if every sound vanished except yours?', wav: 'sound-only-yours-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: SO.title[0], out: SO.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF EVERY SOUND</span><span class="hero">VANISHED</span><span class="kick k2">EXCEPT YOURS?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
