/* =====================================================================
   SOUND · AMBIENCE — the evening as YOU hear it (every sound is now inside your head, so the beds follow you, not the
   camera). The beds sit well under the score (mix.js; the owner's rule: the music clearly leads, beds about 10 dB under).
     before 8:52  the old world: wide stereo, the rain on the lawn and the house, the corn hissing in the breeze, the
                  yard's echo (a reverb with a slap-back off the barn)
     from 8:52    every one of those mono, dry, in the middle of your head (the stereo snaps shut on the boom)
     the corn     after you run in: the rain on the leaves close, the leaves rubbing, louder
     the storm    the wind builds as the tornado comes; at 90 km/h it roars; the tornado's own roar from just before it
                  is seen, louder as it comes closer (louder means closer: that's all you know)
   ===================================================================== */

const SF_PLACE = { lawn: 'by the house', edge: 'at the corn', corn: 'in the corn' };
// where you are during a shot (the beds are what you hear)
function sfWhereShot(sh) {
  const s = sfStoryAt((Math.max(-1, sh.t0) + Math.min(sh.t1, SF.end)) / 2);
  return s < SFE.walk[0] + 4 ? 'lawn' : s < SFE.run ? 'edge' : 'corn';
}
// the tornado's distance from you (m) and the wind's strength (0…1) at story time s
const sfRoarDist = (s) => { const p = SFN.at(s), y = SFY.at(s); return Math.hypot(p[0] - y.x, p[1] - y.z); };
const sfWindK = (s) => MathX.smooth(s, sfSC('wind', 0, -12), sfSC('wind', 0, 2));

sfSound('amb', 'beds', function (ctx, bus, K) {
  const fx = K.fx, T0 = SF.tOn, END = SF.end, F = sfFilmAt, E = SFE, S = sfStoryAt;
  const open = K.verb('yard', 2.6, { bright: 0.4, damp: 2.4, wet: 0.5, pre: 0.02, early: [[0.35, 0.22], [0.52, 0.1]] });   // the yard: the barn's slap-back
  const tRun = F(E.run), inCorn = (t) => sfEv(t, tRun - 0.05, tRun + 0.4);
  // levels over film time (curves sampled once)
  const rainL = sfCurve((t) => { const s = S(t); return 0.55 + 0.45 * MathX.smooth(s, 40, 230) + 0.3 * inCorn(t); });
  const windL = sfCurve((t) => { const s = S(t); return 0.35 + 0.35 * MathX.smooth(s, 100, 230) + 1.2 * sfWindK(s); });
  const leafL = sfCurve((t) => { const s = S(t); return (0.4 + 0.6 * MathX.smooth(s, 100, 230) + 0.8 * sfWindK(s)) * (0.5 + 0.9 * inCorn(t)); });
  const roarL = sfCurve((t) => { const s = S(t); if (s < E.tornado - 9) return 0; const d = sfRoarDist(s); return MathX.smooth(s, E.tornado - 9, E.tornado + 0.3) * Math.min(1.6, Math.pow(2600 / d, 1.15)); });

  // ---- the old world (the title, until 8:52:00): wide, with the yard's echo; it snaps shut on the boom
  { const a = -1, b = T0 + 0.012, d = b - a;
    sfBedW(K, a, b, { colour: 'pink', f: [['hp', 1300], ['lp', 9000]], vol: 0.05, am: 0.15, wr: 1.2, fi: 0.3, fo: 0.012, room: open, wet: 0.35 });   // rain on the grass and leaves
    sfBedW(K, a, b, { colour: 'pink', f: [['bp', 600, 0.6], ['lp', 2400]], vol: 0.035, am: 0.6, wr: 0.25, fi: 0.3, fo: 0.012, room: open, wet: 0.3 });   // the breeze
    sfBedW(K, a, b, { colour: 'pink', f: [['bp', 3400, 0.8], ['lp', 7000]], vol: 0.022, am: 0.8, wr: 0.6, fi: 0.3, fo: 0.012, room: open, wet: 0.4 });   // the corn hissing
    // drips off the house's gutters, here and there (left and right)
    { const n = Math.ceil(d * fx.sr), L = new Float32Array(n), R = new Float32Array(n), r = new RNG(5151);
      for (let t = r.range(0, 0.2); t < T0 - a - 0.02; t += r.range(0.12, 0.5)) { const x = fx.hit([[r.range(1400, 3200), 0.012, 1], [r.range(3500, 6000), 0.006, 0.4]], { width: 0.0003, amp: r.range(0.2, 1), len: 0.08 }); SFX.mixIn(L, R, x, Math.round(t * fx.sr), 0.5, r.range(-0.9, 0.9)); }
      K.putLR(L, R, a, { vol: 0.02, norm: true, room: open, wet: 0.5 }); } }

  // ---- from 8:52:00: the same world, mono, dry, in the middle; then the storm builds
  const cuts = [T0 - 0.01, 40, 80, 120, F(E.tornado) - 9, tRun, tRun + 45, END + 1.2];   // (in order: the tornado's roar starts its own segment)
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1] + (i + 2 < cuts.length ? 0.04 : 0), fi = i ? 0.04 : 0.008, fo = 0.04;
    const corn = a >= tRun - 0.1;
    // the rain: on the grass and the corn's edge; in the corn, close on the leaves (brighter, more patter)
    sfBedW(K, a, b, { colour: 'pink', f: [['hp', corn ? 1600 : 1300], ['lp', corn ? 10000 : 8500]], vol: 0.055, am: 0.15, wr: 1.2, fi, fo, mono: true, env: (u, t) => rainL(t) });
    { const n = Math.ceil((b - a) * fx.sr), y = fx.rustle(b - a, { density: corn ? 2600 : 1400, rub: 0.15, lo: 2200, hi: 9000, grain: 0.0015, env: () => 1 });
      let mx = 0; for (let k = 0; k < n; k++) { const t = a + k / fx.sr, e = rainL(t); mx = Math.max(mx, e); y[k] *= e * Math.min(1, (t - a) / fi, (b - t) / fo); }
      K.put(y, a, { vol: (corn ? 0.05 : 0.03) * mx, norm: true }); }
    // the wind: low and breathing at first; a gale late on
    sfBedW(K, a, b, { colour: 'pink', f: [['bp', 520, 0.55], ['lp', 2600]], vol: 0.05, am: 0.7, wr: 0.25, fi, fo, mono: true, env: (u, t) => windL(t) });
    sfBedW(K, a, b, { colour: 'brown', f: [['lp', 260], ['hp', 30]], vol: 0.05, am: 0.5, wr: 0.18, fi, fo, mono: true, env: (u, t) => 0.4 + 0.6 * windL(t) });
    // the corn: the leaves rubbing in the wind (close and loud once you're in it)
    sfBedW(K, a, b, { colour: 'pink', f: [['bp', 3000, 0.7], ['lp', 7500]], vol: 0.03, am: 0.9, wr: 0.7, fi, fo, mono: true, env: (u, t) => leafL(t) });
    // the tornado's roar: a freight train that never passes; deep, rumbling, louder as it comes closer
    if (b > F(E.tornado) - 9.5) {
      sfBedW(K, a, b, { colour: 'brown', f: [['lp', 170], ['hp', 24]], vol: 0.075, am: 0.35, wr: 0.4, fi, fo, mono: true, env: (u, t) => roarL(t) });
      sfBedW(K, a, b, { colour: 'pink', f: [['bp', 420, 0.5], ['lp', 1400]], vol: 0.035, am: 0.55, wr: 0.9, fi, fo, mono: true, env: (u, t) => roarL(t) * (0.6 + 0.4 * windL(t) / 1.9) });
    }
  }
});
SF_SOUND_FNS.push(sfWhereShot, sfRoarDist, sfWindK);
