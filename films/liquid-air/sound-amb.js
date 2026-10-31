/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: laAt), and how hard it's raining (physics.js: laRate):
     in     your room: drops pattering on the furniture and the floor (more every second), the deluge outside the
            window, low, through the glass
     out    the street: the roar of the rain (it grows with the rate), the splashes, the deep rumble of a sky falling
     under  everything muffled: a low pressure hum; before 3:10 the rain drumming on the surface above (low-passed);
            after it, a vast quiet (a faint hum, distant creaks of the cars against the surface)
     vac    above the surface after 3:10: nothing at all (a vacuum carries no sound)
   ===================================================================== */

laSound('amb', 'beds', function (ctx, bus, K) {
  const P = laPlaces(), rateMax = 0.035;
  const rain = laCurve((t) => MathX.clamp(laRate(laStoryAt(t)) / rateMax, 0, 1));
  const S = (t) => laStoryAt(t);
  for (const p of P) {
    const a = p.t0, b = p.t1 + 0.06;
    if (b - a < 0.05 || a > LA.end + 1) continue;
    if (p.where === 'in') {
      // the patter of drops in the room (from 3:00: more of them every second)
      laBed(K, a, b, { colour: 'white', f: [['hp', 2600], ['bp', 5200, 0.6]], vol: 0.32, am: 0.5, wr: 3, env: (u, t) => MathX.clamp(0.25 + S(t) / 60, 0, 1) * laEv(S(t), -0.3, 1.2) });
      laBed(K, a, b, { colour: 'brown', f: [['lp', 420]], vol: 0.5, am: 0.15, env: (u, t) => 0.2 + 0.8 * rain(t) });
      laBed(K, a, b, { colour: 'pink', f: [['bp', 1100, 0.5], ['lp', 2200]], vol: 0.18, am: 0.2, env: (u, t) => laEv(S(t), 0, 6) });
    } else if (p.where === 'out') {
      laBed(K, a, b, { colour: 'pink', f: [['hp', 400], ['lp', 9000]], vol: 0.72, am: 0.25, wr: 1.5, env: (u, t) => 0.35 + 0.65 * rain(t) });
      laBed(K, a, b, { colour: 'white', f: [['hp', 3000]], vol: 0.25, am: 0.6, wr: 6, env: (u, t) => 0.4 + 0.6 * rain(t) });
      laBed(K, a, b, { colour: 'brown', f: [['lp', 110]], vol: 0.7, am: 0.35, wr: 0.3, env: (u, t) => 0.2 + 0.8 * laEv(S(t), 200, 590) });
    } else if (p.where === 'under') {
      const pre = (t) => (S(t) < 600 ? 1 : 0);
      laBed(K, a, b, { colour: 'brown', f: [['lp', 180]], vol: 0.55, am: 0.3, wr: 0.2, env: (u, t) => 0.5 + 0.5 * pre(t) });
      laBed(K, a, b, { colour: 'pink', f: [['bp', 420, 0.6], ['lp', 900]], vol: 0.42, am: 0.35, wr: 2, env: (u, t) => pre(t) * (0.4 + 0.6 * rain(t)) });
      laBed(K, a, b, { colour: 'pink', f: [['bp', 2400, 1.2]], vol: 0.03, am: 0.8, wr: 0.5, env: (u, t) => 1 - pre(t) });
    }
    // 'vac': silence
  }
});
