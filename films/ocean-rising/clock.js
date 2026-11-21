/* =====================================================================
   CLOCK — the caption beats and the story clock of "What if the ocean kept rising and couldn't stop?".
   ★ The edit is built AROUND THE CAPTIONS (window.OCT, written by build-timing.cjs from CAPTIONS.md). Story time s is
   seconds after 6:42:00 PM EDT on Thursday 9 September 2027, high water, when the sea starts to rise.
   ONE clock for the whole film (OC_CLOCK): it only ever runs forward (the owner's rule of 2026-10-29: no replays; a new
   angle or place moves the clock on). It runs at real speed, and jumps forward only at a cut (the HUD says how far).
   Each jump is anchored to a caption: "this caption comes up at that story second" (OC_ANCHORS), so a caption that
   says "6:42" is on screen at 6:42, whatever the timing does. Everything that moves (physics.js) is placed on story
   time, so changing a caption's timing moves the story with it.
   ===================================================================== */

const OCT_ID = Object.fromEntries(OCT.groups.map((g) => [g.id, g]));
const ocS = (id) => OCT_ID[id].first;         // the beat's first caption appears (film s)
const ocE = (id) => OCT_ID[id].end;           // its last caption goes
const ocCap = (id, k) => OCT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const ocC = (id, k) => OCT_ID[id].caps[k].show;
const ocB = (id, d = 0.6) => ocS(id) - d;     // a cut just before beat id's first caption

const OC = {};
OC.title = [-0.4, ocE('title') + 0.25];
OC.end = OCT.duration;
OC.tOn = ocE('title') + 0.2;                   // ★ (film) 6:42:00 PM: high water; the sea starts to rise (s = 0)
const ocHMS = (h, m, sec = 0) => (h - 18) * 3600 + (m - 42) * 60 + sec;   // story s of a clock reading (24 h)

// [beat, caption, story s when that caption comes up, lead]: the clock jumps at a cut `lead` film seconds before the
// caption (0.6 = the beat's own first cut, ocB), so the caption's own words are true when they show
const OC_ANCHORS = [
  ['boat', 0, OCE.taut - 4.0],                      // the bow line comes taut under the first caption
  ['boat', 1, OCE.flood - 1.2, 1.4],                // the sea pours in over the bow as "it pulls it under" comes up
  ['boat', 2, OCE.sunk + 1.0, 1.6],                 // the stern goes under just before "no way off the rock"
  ['phone', 0, ocHMS(18, 43, 24)],                  // her first text at 6:43:25 (the sea over her harbour's wall)
  ['rule', 0, ocHMS(18, 43, 40)],
  ['height', 0, ocHMS(18, 44, 0)],                  // "you have 45 minutes" (the sea at 2.1 m)
  ['lichen', 0, ocHMS(18, 45, 38)],                // the sea at 3.63 m: just over the top of the orange band (3.25–3.6)
  ['radio', 0, ocHMS(18, 48, 50)],
  ['bell', 0, OCE.bell - 2.0],                      // the chain runs out as "Its chain just ran out" is read
  ['world', 0, OCE.tenM - 4.5],                     // "The sea just passed 10 metres"
  ['fog', 0, OCE.fogLast - 7.5],                    // its last blast comes as "You sound it one last time"
  ['cottage', 0, OCE.houseIn + 5.0],                // the sheet of water already spreading from the door
  ['cottage', 1, OCE.houseIn + 52],                 // the water knee-deep in the kitchen
  ['island', 0, OCE.island + 14],
  ['door', 0, OCE.towerDoor + 32],
  ['door', 1, OCE.burst - 6.5],                     // 4 m over it, 10 tonnes; it gives 6.5 s later
  ['stairs', 0, OCE.burst + 58],
  ['town', 0, OCE.grid - 7.2],                      // her text; then the grid fails on screen
  ['lights', 0, OCP.sAt(29) - 5.6],                 // Owl Point (29 m) goes out on screen
  ['ship', 0, OCP.sAt(29.45)],
  ['ice', 0, OCP.sAt(32.9) - 2.5],                  // "In 33 minutes" with the sea at 33 m as it is read
  ['hill', 0, ocHMS(19, 17, 50)],
  ['lie', 0, ocHMS(19, 19, 58)],
  ['watch', 0, OCE.watch + 2],
  ['gallery', 0, OCE.gallery - 8],
  ['lamp', 0, OCE.lamp - 0.2],
  ['lamp', 1, OCE.lamp + 30, 1.2],
  ['roof', 0, OCP.sAt(49.12)],
];

// [film t where a segment starts, story s there]: real speed inside each segment
const OC_CLOCK = (() => {
  const out = [{ t0: -2, s0: -2 - OC.tOn }];
  for (const [id, k, s, lead = 0.6] of OC_ANCHORS) { const t = ocC(id, k) - lead; out.push({ t0: t, s0: s - lead, id: id + ':' + k }); }
  out.forEach((g, i) => { g.t1 = out[i + 1] ? out[i + 1].t0 : OC.end + 5; g.s1 = g.s0 + (g.t1 - g.t0); g.rate = 1; });
  out.forEach((g, i) => { if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`OC_CLOCK: the clock would run backwards at ${g.id} (${(g.s0 - out[i - 1].s1).toFixed(1)} s)`); if (i && !(g.t0 > out[i - 1].t0)) throw new Error('OC_CLOCK: anchors out of order at ' + g.id); });
  return out;
})();
function ocSegAt(t) { const K = OC_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function ocStoryAt(t) { const g = ocSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const ocRateAt = (t) => ocSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the story skips ahead), for the HUD's "+4 MIN LATER"
const OC_JUMPS = OC_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - OC_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function ocFilmAt(s) { let a = -2, b = OC.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (ocStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
// story time at a caption's appearance (+ d film seconds)
const ocSC = (id, k, d = 0) => ocStoryAt(ocC(id, k) + d);

// the wall clock: s = 0 is 6:42:00.000 PM EDT on Thursday 9 September 2027
function ocClockParts(s) {
  const x = OC_F.t0 + s, h24 = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = Math.floor(x % 60), ms = Math.floor(((x % 1) + 1) % 1 * 1000);
  return { day: 'THU 9 SEP', h: ((h24 + 11) % 12) + 1, m, sec, ms, pm: h24 >= 12 };
}

// Isla's texts and yours: [story s, who, text], placed on their beats (the phone shows the thread up to the moment;
// its clock is the HUD's)
const OC_TEXTS = [
  [ocSC('phone', 0, 0.5), 'isla', 'dad?? the sea is coming over the harbour wall'],
  [ocSC('phone', 0, 2.9), 'isla', 'its coming up our street'],
  [ocSC('phone', 1, 2.0), 'you', 'Get mum. Go up the hill. NOW.'],
  [ocStoryAt(ocCap('world', 1).hide + 0.9), 'isla', 'we are in the car going up. the harbour is gone'],
  [ocSC('town', 0, 0.5), 'isla', 'roads are jammed. we are walking up'],
  [ocSC('hill', 0, 0.4), 'isla', 'we made it to the top!! so many people'],
  [ocSC('hill', 0, 3.2), 'isla', 'dad we can see your light!! is that you??'],
  [ocSC('lie', 0, 1.6), 'you', 'That\u2019s me. I\u2019m fine. Up in the light.'],
  [ocSC('roof', 0, 2.4), 'isla', 'dad?'],
  [ocSC('roof', 0, 5.0), 'isla', 'your light just went out'],
  [ocSC('roof', 1, 2.6), 'isla', 'are you ok??'],
];
