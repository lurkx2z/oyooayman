/* =====================================================================
   CLOCK — the caption beats and the story clock of "What if everything kept shrinking and couldn't stop?".
   ★ The edit is built AROUND THE CAPTIONS (window.EKT, written by build-timing.cjs from CAPTIONS.md). Story time τ is
   seconds after 6:49:00 AM on Saturday 28 August 2027, when everything except you starts shrinking. ONE clock for the
   whole film (EK_CLOCK): it only ever runs forward (the owner's rule of 2026-10-29: no replays). It runs at real speed
   and jumps forward only at cuts (the HUD says how far): each jump is set so that the caption it leads to lands on the
   moment it describes (script.js checks every one against physics.js).
   ===================================================================== */

const EKT_ID = Object.fromEntries(EKT.groups.map((g) => [g.id, g]));
const ekS = (id) => EKT_ID[id].first;         // the beat's first caption appears (film s)
const ekE = (id) => EKT_ID[id].end;           // its last caption goes
const ekCap = (id, k) => EKT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const ekC = (id, k) => EKT_ID[id].caps[k].show;
const ekB = (id, d = 0.6) => ekS(id) - d;     // a cut just before beat id's first caption
const ekBk = (id, k, d = 0.5) => ekC(id, k) - d;   // a cut just before caption k of beat id

const EK = {};
EK.title = [-0.4, ekE('title') + 0.25];
EK.end = EKT.duration;
EK.tOn = 0.9;                                  // ★ (film) 6:49:00 AM: everything starts shrinking (τ = 0)
// the moment your eye first sees the Sun (the skyline to the east-north-east drops below it as you grow): physics.js
// [the cut (film s), the caption it leads to (film s), story τ at that caption, 'soft' = no earlier than the clock gets there]
const EK_ANCHORS = () => [
  [ekB('voice'), ekC('voice', 1), 61.5, 'soft'],        // his voice: 2 octaves up
  [ekB('weight'), ekC('weight', 1), 92.0],              // you weigh 9 kg
  [ekB('neighbours'), ekC('neighbours', 1), 122.3],     // 30 m tall to them
  [ekB('hush'), ekC('hush', 0), 140, 'soft'],           // a bird (no earlier than the clock gets there)
  [ekBk('hush', 1), ekC('hush', 1), 157],               // a whistle
  [ekBk('hush', 2), ekC('hush', 2), 180],               // gone (17 kHz)
  [ekB('quiet'), ekC('quiet', 0), 226],                 // the valley's deepest sound (100 Hz) at 17 kHz
  [ekB('sunrise'), ekC('sunrise', 0), EKP.tauSunrise + 1.5],
  [ekBk('shadow', 1), ekC('shadow', 1), 302],           // taller than every peak round the lake: they are in your shadow
  [ekB('peaks'), ekC('peaks', 1), 314, 'soft'],         // the peaks at your waist
  [ekB('air'), ekC('air', 0), 344.6],                   // your hand 3 km up to him
  [ekB('escape'), ekC('escape', 0), 371.0, 'soft'],     // 14 g
  [ekB('plane'), ekC('plane', 0), 388],                 // the airliner at your eyes
  [ekB('curve'), ekC('curve', 0), 417.8],               // the Earth 800 m across
  [ekB('sky'), ekC('sky', 0), 466],                     // the air below your eyes
  [ekBk('sky', 1), ekC('sky', 1), 486],                 // 6:57
  [ekB('lift'), ekC('lift', 0), 505],                   // escape speed 0.1 m/s
  [ekB('moon'), ekC('moon', 0), 525],
  [ekB('house'), ekC('house', 0), 603],                 // a house (12 m)
  [ekBk('house', 1), ekC('house', 1), 640],             // a car (4.6 m)
  [ekBk('house', 2), ekC('house', 2), 690],             // smaller than you (1.5 m)
  [ekB('ball'), ekC('ball', 0), 760.2],                 // 30 cm, 75 kg
];
const EK_CLOCK = (() => {
  const A = EK_ANCHORS().map(([cut, cap, tau, soft]) => ({ t0: cut, s0: tau - (cap - cut), soft }));
  const out = [{ t0: -2, s0: -2 - EK.tOn }];
  for (const a of A) {
    const pv = out[out.length - 1], sAt = pv.s0 + (a.t0 - pv.t0);
    if (a.soft && a.s0 < sAt) a.s0 = sAt;              // ('soft': the moment named is a range; if the clock is already in it, no jump)
    if (a.s0 < sAt - 1e-6) throw new Error(`EK_CLOCK: the anchor at film ${a.t0.toFixed(2)} would run the clock backwards (${a.s0.toFixed(2)} < ${sAt.toFixed(2)})`);
    out.push({ t0: a.t0, s0: a.s0 });
  }
  return out.map((g, i) => ({ t0: g.t0, t1: out[i + 1] ? out[i + 1].t0 : EK.end + 5, s0: g.s0, s1: g.s0 + ((out[i + 1] ? out[i + 1].t0 : EK.end + 5) - g.t0), rate: 1 }));
})();
function ekSegAt(t) { const K = EK_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function ekStoryAt(t) { const g = ekSegAt(t); return g.s0 + g.rate * (t - g.t0); }
// the clock's jumps (film times where the story skips ahead), for the HUD's "+25 s LATER"
const EK_JUMPS = EK_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - EK_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time τ is on screen (monotonic: bisect)
function ekFilmAt(s) { let a = -2, b = EK.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (ekStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
const ekSC = (id, k, d = 0) => ekStoryAt(ekC(id, k) + d);

// the wall clock: τ = 0 is 6:49:00.000 AM on Saturday 28 August 2027 (MDT)
const EK_T0 = 6 * 3600 + 49 * 60;
function ekClockParts(s) {
  const x = EK_T0 + s, h24 = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = Math.floor(x % 60), ms = Math.floor(((x % 1) + 1) % 1 * 1000);
  return { day: 'SAT 28 AUG', h: ((h24 + 11) % 12) + 1, m, sec, ms, pm: h24 >= 12 };
}
