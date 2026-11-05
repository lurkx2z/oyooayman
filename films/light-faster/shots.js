/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   lfS, lfC, lfB, lfE) and the story clock may only jump forward at a cut (the owner's rule of 2026-10-29: no replays).
   Sets: coast (the train, the road, the beach, the sky, the hospital's roof across the bay), hospital (the MRI, the
   corridor, the generator room), stadium, obs (the
   observatory on the mountain).
   ===================================================================== */

const lfSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });

const LF_SHOTS = [];
{
  const P = LF_SHOTS, c = lfC, B = lfB;
  const L = [
    // 1 — the train along the sea wall, 9:00 PM: the speed of light starts climbing (slow motion: 10× slower)
    ['A0', 'title', -1, B('start'), 'coast'],
    ['A1', 'win', B('start'), B('gps'), 'coast'],
    ['A2', 'phone', B('gps'), B('real'), 'coast'],
    ['A3', 'ext2', B('real'), c('real', 1) - 0.5, 'coast'],
    ['A3b', 'bay', c('real', 1) - 0.5, c('real', 2) - 0.5, 'coast'],
    ['A3c', 'ext3', c('real', 2) - 0.5, B('magnet'), 'coast'],
    ['A4', 'panto', B('magnet'), B('flicker'), 'coast'],
    ['A5', 'flicker', B('flicker'), B('mri'), 'coast'],
    // the hospital across the bay: the MRI scanner's magnet quenches
    ['H1', 'mriA', B('mri'), c('mri', 1) - 0.5, 'hospital'],
    ['H1b', 'mriB', c('mri', 1) - 0.5, c('mri', 2) - 0.5, 'hospital'],
    ['H1c', 'quench', c('mri', 2) - 0.5, c('mri', 3) - 0.5, 'hospital'],
    ['H1d', 'roof', c('mri', 3) - 0.5, B('blackout'), 'coast'],
    // the grid trips: the coast, the stadium
    ['A6', 'bayOut', B('blackout'), c('blackout', 1) - 0.5, 'coast'],
    ['S1', 'stadA', c('blackout', 1) - 0.5, c('blackout', 2) - 0.5, 'stadium'],
    ['S1b', 'stadB', c('blackout', 2) - 0.5, B('generator'), 'stadium'],
    ['H2', 'gen', B('generator'), c('generator', 1) - 0.5, 'hospital'],
    ['H2b', 'corridor', c('generator', 1) - 0.5, B('brake'), 'hospital'],
    ['A7', 'brakeX', B('brake'), c('brake', 1) - 0.5, 'coast'],
    ['A7b', 'emerg', c('brake', 1) - 0.5, B('road'), 'coast'],
    ['A8', 'road', B('road'), c('road', 1) - 0.5, 'coast'],
    ['A8b', 'roadCar', c('road', 1) - 0.5, B('mercury'), 'coast'],
    // the observatory on the mountain: the barometer's mercury freezes
    ['O1', 'obsOut', B('mercury'), c('mercury', 1) - 0.5, 'obs'],
    ['O1b', 'baro', c('mercury', 1) - 0.5, B('ring'), 'obs'],
    ['A9', 'ring', B('ring'), B('beach'), 'coast'],
    // 2 — the beach (real speed from here)
    ['B1', 'stopX', B('beach'), c('beach', 1) - 0.5, 'coast'],
    ['B1b', 'winBeach', c('beach', 1) - 0.5, B('speaker'), 'coast'],
    ['B2', 'spk', B('speaker'), B('board'), 'coast'],
    ['H3', 'board', B('board'), B('fire'), 'hospital'],
    ['B3', 'fireA', B('fire'), c('fire', 2) - 0.5, 'coast'],
    ['B3b', 'fireB', c('fire', 2) - 0.5, B('waves'), 'coast'],
    ['B4', 'waves', B('waves'), B('phones'), 'coast'],
    ['S2', 'stadC', B('phones'), B('colour'), 'stadium'],
    ['B5', 'colA', B('colour'), c('colour', 2) - 0.5, 'coast'],
    ['B5b', 'colB', c('colour', 2) - 0.5, B('day'), 'coast'],
    ['B6', 'dayA', B('day'), B('heat'), 'coast'],
    ['B7', 'heat', B('heat'), B('stars'), 'coast'],
    // 3 — the stars: the last light, running out
    ['C1', 'starsA', B('stars'), c('stars', 2) - 0.5, 'coast'],
    ['C1b', 'starsB', c('stars', 2) - 0.5, B('runout'), 'coast'],
    ['C2', 'runout', B('runout'), B('saturn'), 'coast'],
    ['O2', 'scope', B('saturn'), c('saturn', 1) - 0.5, 'obs'],
    ['O2b', 'eyepiece', c('saturn', 1) - 0.5, B('nearest'), 'obs'],
    ['C3', 'nearest', B('nearest'), B('question'), 'coast'],
    ['C4', 'question', B('question'), 1e9, 'coast'],
  ];
  for (const [id, mode, t0, t1, set] of L) P.push(lfSh(id, mode, t0, t1, set));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`LF_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`LF_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of LF_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`LF_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function lfShotAt(t) { for (const s of LF_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? LF_SHOTS[0] : LF_SHOTS[LF_SHOTS.length - 1]; }
const lfShot = (mode) => { const A = LF_SHOTS.filter((s) => s.mode === mode); return A.length ? Object.assign({}, A[0], { t1: A[A.length - 1].t1 }) : undefined; };
function lfCutTimes(app) {
  const out = LF_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = LF_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
