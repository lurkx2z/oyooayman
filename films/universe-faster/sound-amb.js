/* =====================================================================
   SOUND · AMBIENCE — the garden's own air, cut with the picture (uxPlace), and thinning with the air itself.
     the garden    a late-autumn night at the back of a terrace: the town's low roar, a breeze in the trees, the
                   bird-bath fountain trickling, crickets, now and then a tawny owl, a train far off. All of it
                   carried by the air, so as the air goes (from about 11:20) it gets quieter and duller, and from
                   11:36 there is nothing: sound needs air
     slowed down   in the first second the garden's sound is slowed as much as the picture: a cricket's chirp
                   stretched sixty times is a low throb, the town's roar a deep, slow swell
     space         the cosmos shots: almost nothing, a deep low air under the music
   ===================================================================== */

let UX_PL = null;
function uxPl() {
  if (UX_PL) return UX_PL;
  return (UX_PL = {
    garden: uxCurve(uxPlace((s) => s.set === 'garden' || s.set === 'scope')),
    scope: uxCurve(uxPlace((s) => s.set === 'scope')),
    fountain: uxCurve(uxPlace((s) => s.mode === 'fountain')),
    space: uxCurve(uxPlace((s) => s.set === 'cosmos', 0.3)),
  });
}
// how much of the garden's sound is slowed into a throb (the two slowed-down seconds), and how much is heard as is
let UX_SLOWK = null;
const uxSlowK = (t) => (UX_SLOWK = UX_SLOWK || uxCurve((x) => 1 - MathX.smooth(uxRate(x), 0.04, 0.5)))(t);

uxSound('amb', 'garden', function (ctx, bus, K) {
  const { fx, r } = K, END = UX.end + 1.5, P = uxPl();
  const out = K.verb('out', 2.6, { bright: 0.42, damp: 2.6, wet: 0.5, seed: 29, pre: 0.02 });
  // heard: in the garden, through air, at normal speed. The level follows the pressure; the highs go first
  const lo = uxCurve((t) => P.garden(t) * Math.pow(uxAirAt(t), 1.1) * (1 - uxSlowK(t))), hi = uxCurve((t) => lo(t) * Math.pow(uxAirAt(t), 1.5));

  // ---- the town: a low roar, two layers (the ring road, nearer streets)
  uxBed(K, 0, END, { colour: 'brown', f: [['lp', 260]], vol: 0.05, am: 0.25, wr: 0.08, env: (u, t) => lo(t), fi: 0.02, fo: 0.3 });
  uxBed(K, 0, END, { colour: 'pink', f: [['bp', 520, 0.6], ['lp', 1400]], vol: 0.016, am: 0.4, wr: 0.12, env: (u, t) => lo(t) * (0.8 + 0.2 * hi(t)), fi: 0.02, fo: 0.3 });
  // ---- a breeze in the trees (gusts)
  uxBed(K, 0, END, { colour: 'pink', f: [['hp', 600], ['lp', 5200]], vol: 0.016, am: 0.85, wr: 0.18, env: (u, t) => hi(t) * (1 - 0.5 * P.scope(t)), fi: 0.02, fo: 0.3 });
  // ---- the bird-bath fountain: a small trickle (louder beside it); its splash softens as things weigh less
  {
    const lv = uxCurve((t) => (0.5 + 1.6 * P.fountain(t)) * lo(t) * (t < UX.zeroAt ? 1 : 0) * (0.5 + 0.5 * Math.max(0, uxWeight(Math.max(0, uxNight(t))))));
    uxBed(K, 0, END, { colour: 'white', f: [['bp', 2600, 0.8], ['lp', 6000]], vol: 0.008, am: 0.6, wr: 3.0, env: (u, t) => lv(t), fi: 0.02, fo: 0.3 });
    for (let t = 0.1; t < UX.zeroAt; t += r.range(0.06, 0.22)) {
      const v = lv(t); if (v < 0.03) continue;
      const L = fx.arr(0.12), R = fx.arr(0.12); fx.bubble(L, R, 0, r.range(700, 1900), r.range(0.006, 0.016), 1, r.range(-0.5, 0.5));
      K.putLR(L, R, t, { vol: 0.012 * v * r.range(0.4, 1), norm: true, room: out, wet: 0.3 });
    }
  }
  // ---- crickets: a few, each its own pitch and rhythm, in the far beds
  for (let c = 0; c < 4; c++) {
    const f = 4400 + 180 * c + r.range(-60, 60), pan = [-0.7, 0.5, -0.2, 0.8][c], per = r.range(0.45, 0.75);
    for (let t = r.range(0, 1); t < END - 1; t += per * r.range(0.92, 1.1)) {
      const v = hi(t) * (1 - 0.6 * P.scope(t)); if (v < 0.02) continue;
      if (r.chance(0.12)) { t += r.range(1, 3); continue; }
      K.put(uxCricket(fx, { f, n: r.int(3, 4) }), t, { vol: 0.0055 * v * (c === 1 ? 1.3 : 1), norm: true, pan, room: out, wet: 0.4 });
    }
  }
  // ---- a tawny owl (twice tonight, once at the end) and a train far off
  for (const t of [42.2, 128.5, 341.2]) if (P.garden(t) > 0.5) K.put(uxOwl(fx), t, { vol: 0.016 * Math.max(P.garden(t), 0.6) * uxAirAt(t), norm: true, pan: 0.6, lp: 2400, room: out, wet: 0.7 });
  uxBed(K, 36, 44, { colour: 'brown', f: [['lp', 340]], vol: 0.022, mono: true, pan: -0.5, env: (u, t) => Math.pow(Math.sin(Math.PI * u), 2) * lo(t), fi: 0.3, fo: 0.3 });
  uxTone(K, 38.6, 1.4, 640, [[1, 1], [1.26, 0.7], [2, 0.2]], (u) => Math.min(1, u / 0.1) * Math.pow(1 - u, 1.2), { vol: 0.0035, pan: -0.5, f: [['lp', 1500]] });   // its horn
  // ---- the end: the garden at 7:29 again, and a car going by on the road behind the houses
  uxBed(K, UX.question + 4.0, UX.question + 10.5, { colour: 'pink', f: [['bp', 420, 0.6], ['lp', 1100]], vol: 0.018, mono: true, pan: 0.3, env: (u) => Math.pow(Math.sin(Math.PI * u), 2), fi: 0.3, fo: 0.3 });

  // ---- slowed down: the garden's sound stretched with the picture into a low, slow throb (cut with the picture)
  {
    const sk = uxCurve((t) => P.garden(t) * uxSlowK(t) * (t > UX.onset - 0.5 && t < UX.weight ? 1 : 0));
    uxBed(K, UX.onset - 0.5, UX.resume + 1.5, { colour: 'brown', f: [['lp', 90]], vol: 0.07, am: 0.5, wr: 0.05, env: (u, t) => sk(t), fi: 0.3, fo: 0.3 });
    uxTone(K, UX.onset - 0.5, UX.resume + 2 - UX.onset, 74, [[1, 1], [2, 0.3], [3, 0.12]], (u, tt) => { const t = UX.onset - 0.5 + tt; return sk(t) * (0.55 + 0.45 * Math.sin(2 * Math.PI * 0.55 * tt)); }, { vol: 0.012, pan: -0.3, f: [['lp', 400]] });   // the crickets, sixty times slower
    uxTone(K, UX.onset - 0.5, UX.resume + 2 - UX.onset, 81, [[1, 1], [2, 0.25]], (u, tt) => { const t = UX.onset - 0.5 + tt; return sk(t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.41 * tt + 1.3)); }, { vol: 0.009, pan: 0.5, f: [['lp', 400]] });
  }
  // ---- space: a deep low air, and the faintest high hiss
  uxBed(K, UX.grow - 0.4, END, { colour: 'brown', f: [['lp', 70]], vol: 0.04, env: (u, t) => P.space(t), fi: 0.02, fo: 0.3 });
  uxBed(K, UX.grow - 0.4, END, { colour: 'pink', f: [['hp', 5000]], vol: 0.0025, env: (u, t) => P.space(t), fi: 0.02, fo: 0.3 });
});
