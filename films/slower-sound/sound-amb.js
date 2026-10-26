/* =====================================================================
   SOUND · AMB — the places, and how the day empties of sound. Each bed follows the shots it belongs to (ssPlace) and
   gets thinner as the hours go: by evening only what is near you can reach you at all, and after 10 PM there is
   nothing but the faint sound of your own body.
     the garden    birds, a far road, a breeze in the leaves (morning); thinner each hour; nothing at night
     the kitchen   a fridge's hum, the room
     the street    traffic and people (11:00), the breeze at 1 PM, the street going quiet behind the van, the crowd
   ===================================================================== */

ssSound('amb', 'places', function (ctx, bus, K) {
  const END = SS.end + 1.2, H = (t) => 7 + ssH(t), modes = (...m) => (s) => m.includes(s.mode);
  const garden = ssPlace((s) => s.set === 'garden' && !['kettle', 'radio', 'echo', 'vowels', 'tv', 'clap', 'earbuds', 'storm', 'box', 'walkinto', 'wait', 'real', 'question'].includes(s.mode));
  const kitchen = ssPlace(modes('kettle', 'radio', 'echo', 'vowels', 'tv', 'clap', 'earbuds', 'storm', 'box', 'walkinto', 'wait'));
  const street = ssPlace((s) => s.set === 'street' && s.mode !== 'horizon');
  const real = ssPlace(modes('real', 'question'));
  // (how much of the world's sound still reaches you: full in the morning, thinning through the afternoon)
  const thin = (t) => { const h = H(t); return h < 11 ? 1 : h < 17 ? 1 - 0.6 * (h - 11) / 6 : h < 20 ? 0.4 - 0.3 * (h - 17) / 3 : 0.04; };
  const gEnv = ssCurve((t) => garden(t) * thin(t) * (t < SS.boomAt + 2 && t > SS.boomAt - 0.2 ? 0.6 : 1));
  ssBed(K, SS.titleShot - 0.3, END, { colour: 'pink', f: [['lp', 900], ['hp', 60]], env: (u, t) => gEnv(t), vol: 0.1, fi: 0.5, fo: 0.5, am: 0.3, wr: 0.2 });   // the far road
  ssBed(K, SS.titleShot - 0.3, END, { colour: 'white', f: [['bp', 3200, 0.5], ['lp', 8000]], env: (u, t) => gEnv(t) * (H(t) < 18 ? 1 : 0), vol: 0.035, fi: 0.5, fo: 0.5, am: 0.7, wr: 0.4 });   // leaves
  // the morning's birds (until the boom startles them), small and far
  { const r = new RNG(81); for (let t = SS.titleShot; t < SS.carpet + 6; t += 0.6 + 1.6 * r.next()) { if (t > SS.boomAt - 0.3 && t < SS.boomAt + 3) continue; if (garden(t) < 0.5) continue; K.put(ssChirp(K.fx, { f0: r.range(2600, 4800) }), t, { vol: 0.025 + 0.03 * r.next(), pan: r.range(-0.9, 0.9) }); } }
  // the kitchen: a fridge, the room
  const kEnv = ssCurve((t) => kitchen(t) * (H(t) < 21.9 ? 1 : 0.25));
  ssBed(K, SS.kettle - 0.3, SS.midnight, { colour: 'brown', f: [['lp', 300], ['hp', 40]], env: (u, t) => kEnv(t), vol: 0.07, fi: 0.3, fo: 0.3, am: 0.1 });
  ssTone(K, SS.kettle - 0.3, SS.midnight - SS.kettle + 0.3, 100, [[1, 1], [2, 0.5], [3, 0.2]], (u, tt) => kEnv(SS.kettle - 0.3 + tt) * 0.5, { vol: 0.02, f: [['lp', 500]] });
  // the street: traffic and people at 11:00; at noon thinner; the breeze at 1 PM; behind the van it all drops away
  const sEnv = ssCurve((t) => street(t) * (H(t) < 12.9 ? 1 : 0.65) * (t > SS.behind - 0.3 && t < SS.ears ? 1 - 0.85 * MathX.smooth(t, SS.behind - 0.3, SS.behind + 0.4) : 1) * (t < SS.titleShot ? 0.6 : 1));
  ssBed(K, 0, SS.four, { colour: 'pink', f: [['lp', 1400], ['hp', 50]], env: (u, t) => sEnv(t), vol: 0.13, fi: 0.4, fo: 0.4, am: 0.35, wr: 0.3 });
  ssBed(K, 0, SS.four, { colour: 'white', f: [['bp', 900, 0.6]], env: (u, t) => sEnv(t) * 0.6, vol: 0.05, fi: 0.4, fo: 0.4, am: 0.8, wr: 1.2 });   // voices, a murmur
  const wEnv = ssCurve((t) => street(t) * MathX.smooth(t, SS.one - 0.5, SS.one + 1) * (1 - MathX.smooth(t, SS.two - 0.6, SS.two + 0.2)));
  ssBed(K, SS.one - 0.6, SS.two + 0.4, { colour: 'pink', f: [['bp', 450, 0.5]], env: (u, t) => wEnv(t), vol: 0.22, fi: 0.5, fo: 0.4, am: 0.9, wr: 0.45 });   // the breeze, gusting
  // the view from above the town: air
  ssBed(K, SS.flying - 0.2, SS.one + 0.2, { colour: 'pink', f: [['lp', 600]], vol: 0.06, fi: 0.4, fo: 0.4, am: 0.4 });
  // the night: nothing reaches you; your own body (blood, breath) very faint
  ssBed(K, SS.box - 0.5, SS.real, { colour: 'brown', f: [['lp', 180], ['hp', 25]], vol: 0.03, fi: 2, fo: 1, am: 0.3, wr: 0.15 });
  // is it real: an ordinary morning again
  const rEnv = ssCurve(real);
  ssBed(K, SS.real - 0.5, END, { colour: 'pink', f: [['lp', 900], ['hp', 60]], env: (u, t) => rEnv(t), vol: 0.07, fi: 1.5, fo: 1.0, am: 0.3, wr: 0.2 });
  { const r = new RNG(83); for (let t = SS.real + 1; t < SS.end; t += 1.4 + 2.5 * r.next()) K.put(ssChirp(K.fx, { f0: r.range(2600, 4800) }), t, { vol: 0.02 + 0.025 * r.next(), pan: r.range(-0.9, 0.9) }); }
});
