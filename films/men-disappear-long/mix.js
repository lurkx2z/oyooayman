/* =====================================================================
   MIX — stem levels and the dynamics map for men-disappear-long.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a MG key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (each stem rendered solo, K-weighted loudness in 10 s windows; see EPISODE_REPORT.md for the measured numbers).
     · the beds sit 8.5 dB under their raw level; the air round the plane a further 3 dB (sound-amb.js);
     · in the quiet stop (the radio, his phone) the beds dip 4 dB and the score comes up 2 dB, so the score still
       leads the car's own radio song; in the cockpit and the cabin the beds dip 2.5 dB;
     · from 9:47 the score's endless rise is held back (−1.5 to −4.5 dB), so the end climbs about 5 LU over the rest instead of 11.
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
const MG_MIXSH = (m) => mgShot(m);
window.MG_MIX = (() => {
  const b = (id, o = 0) => mgB(id) + o;
  return {
    stems: {
      music: { gain: 2.5, hp: 32 },   // the score leads
      amb: { gain: -8.5, hp: 28 },    // the road, the deck's wind, the river, the air round the plane, the cockpit, the cabin, the tower, the town, the ward
      sfx: { gain: 2, hp: 25 },       // the radio, the cup, the brake, the lorry, the barriers, the phones, the train, the barge, the door, the jet
    },
    dyn: {
      music: [[0, 0, 1.5], [b('radio', -0.5), 0, 1.5], [b('radio', 1.5), 0, 3.5], [b('train', 0.3), 0, 3.5], [b('train', 2), 0, 1.5],
        [b('hold', 2), 0, 1.5], [b('many'), 0, -1.5], [b('autoland'), 0, -3], [b('final'), 0, -4.5], ['end', -0.04, -4], ['end', 0, -60]],
      amb: [[0, 0, 0], [b('radio', -0.5), 0, 0], [b('radio', 1.5), 0, -4], [b('train', -0.3), 0, -4], [b('train', 1.2), 0, 0],
        [b('door', -0.6), 0, 0], [b('door', 0.6), 0, -2.5], [b('tower', -0.6), 0, -2.5], [b('tower', 0.6), 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
      sfx: [['end', -0.04, 0], ['end', 0, -60]],
    },
    master: 4.5,    // dB: lifts the whole mix to about −15 LUFS integrated (measured −16.5 at +3)
    eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
    ceiling: -2.5,   // dBTP, the limiter's ceiling (mgLimit)
  };
})();
