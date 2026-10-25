/* =====================================================================
   SOUND · AMBIENCE — what you hear where the picture is (ucPlace), at that night time:
     the night     a freezing October night at the back of a terrace: the town's low roar, a breeze, a tawny owl, a
                   train far off. No crickets (it is −2 °C). From 10:30, when the sky is as bright as a city's, dogs
                   start barking; from 11:00 (twilight) the birds wake and sing: a dawn chorus at 11 at night. It
                   stops as the heat comes (by 11:32)
     the heat      from 11:29 the air over the garden moves: a hot wind that grows with the sky's heat, then a roar
     the fire      from 11:37: the roar, the flutter and the crackle of what is burning (as much as is alight at that
                   moment: garden.js's own fire front). From the kitchen it is heard through the glass (dull, low)
     the kitchen   a fridge's hum and the room
     the end       11:52 on: one smooth roar (no edges in the sound either); the last second slowed down: a slow throb;
                   midnight: nothing. Then the garden at 7:29 again
     space         the cosmos shots: a deep low air under the music
   ===================================================================== */

const UC_KITCHEN_MODES = ['cold', 'steam', 'leaves', 'lawn', 'noon', 'shed', 'glass'];
let UC_PL = null;
function ucPl() {
  if (UC_PL) return UC_PL;
  return (UC_PL = {
    out: ucCurve(ucPlace((s) => s.set === 'garden' && !UC_KITCHEN_MODES.includes(s.mode))),
    kit: ucCurve(ucPlace((s) => UC_KITCHEN_MODES.includes(s.mode))),
    space: ucCurve(ucPlace((s) => s.set === 'cosmos', 0.3)),
  });
}
// the night time the picture shows at film time t (the end shots show other nights: garden.js nightFor)
function ucSoundNight(t) {
  const s = ucShotAt(t);
  if (s.mode === 'after') return ucAt(19, 29, 25) + (t - UC.question);
  return Math.max(0, ucNight(t));
}
// the last second slowed down: how much of the sound is stretched into a throb
let UC_SLOWK = null;
const ucSlowK = (t) => (UC_SLOWK = UC_SLOWK || ucCurve((x) => (x > UC.sun && x < UC.midnight ? 1 - MathX.smooth(ucRate(x), 0.04, 0.5) : 0)))(t);
// the sky's heat as a level (0 at 500 W/m², 1 at 3 MW/m²)
const ucHeatK = (n) => MathX.smooth(Math.log10(Math.max(1, ucSkyNow(n).flux)), 2.7, 6.5);

ucSound('amb', 'garden', function (ctx, bus, K) {
  const { fx, r } = K, END = UC.end + 1.5, P = ucPl();
  const out = K.verb('out', 2.6, { bright: 0.42, damp: 2.6, wet: 0.5, seed: 29, pre: 0.02 });
  const room = K.verb('room', 0.6, { bright: 0.35, damp: 4, wet: 0.35, seed: 31 });
  const mute = (t) => (t > UC.midnight - 0.02 && t < UC.real + 0.5 ? 0 : 1);
  // ---- the night: quiet until the heat comes (it is drowned by the wind by 11:33)
  const night = ucCurve((t) => P.out(t) * (1 - MathX.smooth(ucSoundNight(t), ucAt(23, 29), ucAt(23, 34))) * mute(t));
  ucBed(K, 0, END, { colour: 'brown', f: [['lp', 260]], vol: 0.05, am: 0.25, wr: 0.08, env: (u, t) => night(t), fi: 0.02, fo: 0.3 });
  ucBed(K, 0, END, { colour: 'pink', f: [['bp', 520, 0.6], ['lp', 1400]], vol: 0.014, am: 0.4, wr: 0.12, env: (u, t) => night(t), fi: 0.02, fo: 0.3 });
  ucBed(K, 0, END, { colour: 'pink', f: [['hp', 600], ['lp', 5200]], vol: 0.013, am: 0.85, wr: 0.18, env: (u, t) => night(t), fi: 0.02, fo: 0.3 });
  // a tawny owl (under the title, at 9:14, and at the end), a train far off (in the 9:20 shot)
  for (const t of [12.6, 69.5, UC.question + 3.6]) K.put(ucOwl(fx), t, { vol: 0.016, norm: true, pan: 0.6, lp: 2400, room: out, wet: 0.7 });
  ucBed(K, UC.more + 0.5, UC.more + 7.5, { colour: 'brown', f: [['lp', 340]], vol: 0.02, mono: true, pan: -0.5, env: (u, t) => Math.pow(Math.sin(Math.PI * u), 2) * night(t), fi: 0.3, fo: 0.3 });
  ucTone(K, UC.more + 3.1, 1.4, 640, [[1, 1], [1.26, 0.7], [2, 0.2]], (u) => Math.min(1, u / 0.1) * Math.pow(1 - u, 1.2), { vol: 0.003, pan: -0.5, f: [['lp', 1500]] });
  // ---- dogs barking far off (the sky as bright as a city's), and the birds waking at 11 p.m.
  {
    const bark = (t, pan, f0, n) => { for (let i = 0; i < n; i++) K.put(ucMeow(fx, { d: 0.16, f0: [f0, f0 * 1.25, f0 * 0.8], open: 1.2, thin: 0.35 }), t + i * r.range(0.32, 0.5), { vol: 0.012 * night(t), norm: true, pan, lp: 1800, room: out, wet: 0.8 }); };
    bark(UC.city + 1.6, -0.7, 330, 3); bark(UC.city + 4.4, 0.6, 410, 2); bark(UC.drown + 1.2, -0.4, 300, 4); bark(UC.zero + 2.5, 0.75, 380, 3);
    const birds = ucCurve((t) => P.out(t) * MathX.smooth(ucSoundNight(t), ucAt(22, 58), ucAt(23, 6)) * (1 - MathX.smooth(ucSoundNight(t), ucAt(23, 29, 30), ucAt(23, 32, 30))));
    const voices = [[2600, -0.6, 0.9], [3400, 0.5, 0.7], [4300, -0.2, 0.55], [2200, 0.8, 0.8], [3900, 0.15, 0.5]];
    voices.forEach(([f0, pan, gap], v) => {
      for (let t = UC.drown - 1 + v * 0.7; t < UC.boil + 2; t += gap * r.range(1.2, 2.6)) {
        const lv = birds(t); if (lv < 0.03 || r.chance(0.25)) continue;
        K.put(ucChirp(fx, { f0: f0 * r.range(0.92, 1.08), n: r.int(3, 7) }), t, { vol: 0.011 * lv * (v === 0 ? 1.3 : 1), norm: true, pan, room: out, wet: 0.45 });
      }
    });
  }
  // ---- the heat: a hot wind over the garden (outside), a dull rush through the glass (inside), then the roar
  {
    const hw = ucCurve((t) => ucHeatK(ucSoundNight(t)) * (1 - ucSlowK(t)) * mute(t));
    const wo = ucCurve((t) => P.out(t) * hw(t)), wk = ucCurve((t) => P.kit(t) * hw(t) * 0.45);
    ucBed(K, UC.zero, END, { colour: 'brown', f: [['lp', 420]], vol: 0.11, am: 0.5, wr: 0.15, env: (u, t) => wo(t), fi: 0.3, fo: 0.3 });
    ucBed(K, UC.zero, END, { colour: 'pink', f: [['hp', 500], ['lp', 4500]], vol: 0.03, am: 0.8, wr: 0.3, env: (u, t) => wo(t) * (0.4 + 0.6 * hw(t)), fi: 0.3, fo: 0.3 });
    ucBed(K, 0, END, { colour: 'brown', f: [['lp', 240]], vol: 0.07, am: 0.4, wr: 0.12, env: (u, t) => wk(t), fi: 0.02, fo: 0.3 });
  }
  // ---- the lawn steams (a soft hiss, through the glass)
  { const st = ucCurve((t) => { const n = ucSoundNight(t); return MathX.smooth(n, UC_N.steam - 25, UC_N.steam + 15) * (1 - MathX.smooth(n, UC_N.steam + 70, UC_N.ign.grass - 20)) * (P.kit(t) * 0.5 + P.out(t)); });
    ucBed(K, UC.boil, UC.lawn + 2, { colour: 'pink', f: [['hp', 2500], ['lp', 6000]], vol: 0.012, am: 0.4, wr: 1.2, env: (u, t) => st(t), fi: 0.3, fo: 0.3 }); }
  // ---- the fire: outside, full; inside, through the glass (until the panes sag and a gap opens at the top)
  {
    const F = ucCurve((t) => Math.min(1.4, ucFireLevel(ucSoundNight(t))) * mute(t));
    const gap = (t) => MathX.smooth(ucSoundNight(t), UC_N.glassSoft, UC_N.glassSoft + 40);
    for (const [a, b] of [[0, UC.titleShot + 0.3], [UC.leaves - 1.2, UC.melt + 0.5]]) {
      const d = b - a, fo = ucCurve((t) => P.out(t) * F(t)), fk = ucCurve((t) => P.kit(t) * F(t) * (0.55 + 0.25 * gap(t)));
      K.put(ucFire(fx, d, (u) => fo(a + u * d), { pop: 26 }), a, { vol: 0.14, norm: 1.4, pan: 0.1, room: out, wet: 0.25 });
      K.put(ucFire(fx, d, (u) => fk(a + u * d) * (0.6 + 0.4 * gap(a + u * d)), { pop: 14, lo: 220 }), a, { vol: 0.12, norm: 1.4, pan: 0, lp: 750, room, wet: 0.4 });
    }
  }
  // ---- the kitchen: the fridge, the room
  ucBed(K, 0, END, { colour: 'pink', f: [['lp', 900]], vol: 0.006, env: (u, t) => P.kit(t), fi: 0.02, fo: 0.2, mono: true });
  ucTone(K, 0, END - 0.1, 50, [[1, 0.5], [2, 1], [3, 0.3], [4, 0.15]], (u, tt) => P.kit(tt), { vol: 0.004, pan: -0.4, f: [['lp', 400]] });
  // ---- the last second, slowed down: the roar stretched into a slow, deep throb; cut dead at midnight
  {
    const sk = ucCurve((t) => ucSlowK(t) * (t < UC.midnight ? 1 : 0));
    ucBed(K, UC.last - 0.5, UC.midnight + 0.05, { colour: 'brown', f: [['lp', 90]], vol: 0.08, am: 0.55, wr: 0.06, env: (u, t) => sk(t), fi: 0.3, fo: 0.01 });
    ucTone(K, UC.last - 0.5, UC.midnight - UC.last + 0.55, 41, [[1, 1], [2, 0.35], [3, 0.12]], (u, tt) => { const t = UC.last - 0.5 + tt; return sk(t) * (0.55 + 0.45 * Math.sin(2 * Math.PI * 0.6 * tt)); }, { vol: 0.016, f: [['lp', 300]] });
  }
  // ---- the end: the garden at 7:29 again, and a car going by on the road behind the houses
  ucBed(K, UC.question + 4.0, UC.question + 10.5, { colour: 'pink', f: [['bp', 420, 0.6], ['lp', 1100]], vol: 0.016, mono: true, pan: 0.3, env: (u) => Math.pow(Math.sin(Math.PI * u), 2), fi: 0.3, fo: 0.3 });
  // ---- space: a deep low air, and the faintest high hiss
  ucBed(K, UC.rule - 0.4, END, { colour: 'brown', f: [['lp', 70]], vol: 0.04, env: (u, t) => P.space(t), fi: 0.02, fo: 0.3 });
  ucBed(K, UC.rule - 0.4, END, { colour: 'pink', f: [['hp', 5000]], vol: 0.0025, env: (u, t) => P.space(t), fi: 0.02, fo: 0.3 });
});
