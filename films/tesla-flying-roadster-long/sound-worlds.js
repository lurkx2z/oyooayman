/* =====================================================================
   SOUND · THE OTHER WORLDS — effects for the sets away from the test site (the race track, the desk, space), run at
   the end of the effects pass (sound-sfx.js calls every function in TR_SFX_EXTRA). Times come from the sets' own
   motion (track.js, toy.js, space.js).
   ===================================================================== */
window.TR_SFX_EXTRA = window.TR_SFX_EXTRA || [];

// the desk: the plunger, the launch click, the toy car's plastic wheels on the track (slowed, then real time), the bumper
TR_SFX_EXTRA.push((K, H) => {
  const { fx, sr } = K;
  const click = (t, v = 0.05, f = 2600) => K.put(fx.hit([[f, 0.012, 1], [f * 1.9, 0.008, 0.5]], { width: 0.0004, amp: 1, noise: 0.5, nlen: 0.01, nhp: 1500, len: 0.1 }), t, { vol: v, norm: true });
  const pull = (t0, t1) => trBed(K, t0, t1, { colour: 'white', f: [['bp', 3200, 1.5]], vol: 0.03, am: 0.8, wr: 30, fi: 0.05, fo: 0.05 });
  const roll = (t0, t1, slow, v = 0.05) => { trBed(K, t0, t1, { colour: 'pink', f: [['bp', 1400 * slow + 200, 1.2], ['lp', 4000 * slow + 600]], vol: v, am: 0.5, wr: 12 * slow + 2, fi: 0.08, fo: 0.1 }); };
  pull(165.3, 166.2); click(166.55, 0.07); roll(166.6, 167.1, 1, 0.05); roll(167.1, 179.2, 0.15, 0.035);
  trBed(K, 167.1, 179.2, { colour: 'brown', f: [['lp', 180]], vol: 0.04, fi: 0.3, fo: 0.2 });
  pull(178.7, 179.6); click(179.95, 0.07); roll(179.98, 181.1, 1, 0.07);
  trWhoosh(K, 180.45, { d: 0.4, vol: 0.05 });
  click(181.09, 0.09, 1500); K.put(fx.creak(0.2, fx.panelModes(0.4), {}), 181.1, { vol: 0.03, norm: true });
});

// space: no air, so the sounds are what the astronaut would hear through the suit: breath, the radio, a thud of the
// throw through the glove; the thrusters as dull thumps through the hull
TR_SFX_EXTRA.push((K, H) => {
  const { fx } = K, T = TR;
  for (let t = T.newton + 0.2; t < T.cold - 0.3; t += 2.4) trBed(K, t, t + 1.1, { colour: 'pink', f: [['bp', 900, 0.7], ['lp', 2400]], vol: 0.03, fi: 0.4, fo: 0.6 });
  K.put(fx.beep(1400, 0.06), T.newton + 0.1, { vol: 0.015, norm: true, pan: -0.4 });
  trThump(K, 300.0, { vol: 0.12, f0: 70, tau: 0.12 });
  for (const [t, d] of [[303.13, 0.45], [303.88, 0.3], [315.24, 0.45], [316.55, 0.45]]) { trThump(K, t, { vol: 0.1, f0: 48, tau: 0.2 }); trBed(K, t, t + d + 0.2, { colour: 'brown', f: [['lp', 300]], vol: 0.05, fi: 0.01, fo: 0.15 }); }
  K.put(fx.beep(1400, 0.06), T.space2 + 0.1, { vol: 0.015, norm: true, pan: 0.4 });
});

// the track: the 1970s-style race car at speed, the tunnel roar, the brake, the peel-off and the hit on the floor; then
// the fan cars (1970 fan whine and the ban, 1978 pass and chequered flag), the garage door, and the McMurtry on its rig
TR_SFX_EXTRA.push((K, H) => {
  const { fx } = K;
  const ramp = (a, b, va, vb) => (t) => t <= a ? va : t >= b ? vb : va + (vb - va) * (t - a) / (b - a);
  const flap = (t0, t1, v = 0.03, pan = 0) => { for (let t = t0; t < t1; t += 0.11) trBed(K, t, t + 0.07, { colour: 'pink', f: [['bp', 700, 1.0]], vol: v * (0.7 + 0.3 * Math.sin(t * 7.3)), fi: 0.005, fo: 0.05, pan }); };
  // race at speed, then the brake: revs fall, the car peels off the ceiling and falls
  trDriveSfx(K, 136.6, 157.55, () => 60, { vol: 0.05, road: () => 0.6 });
  trDriveSfx(K, 157.55, 160.0, ramp(157.55, 159.4, 60, 14), { vol: 0.045, road: false });
  trBed(K, 149.0, 161.0, { colour: 'brown', f: [['lp', 400]], vol: 0.06, fi: 0.5, fo: 0.4 });
  K.put(fx.creak(0.6, fx.metalModes(260, 0.5), {}), 157.6, { vol: 0.03, norm: true });
  trWhoosh(K, 158.9, { d: 1.0, vol: 0.06, down: true });
  trLandSfx(K, 160.04, { size: 1.3 });
  trBed(K, 160.05, 161.0, { colour: 'white', f: [['bp', 2600, 0.8]], vol: 0.05, am: 0.6, wr: 25, fi: 0.01, fo: 0.4 });
  // 1970: the fan car's whine, the brakes, the flag, the ban
  trDriveSfx(K, 250.2, 259.5, () => 30, { vol: 0.03, road: () => 0.4 });
  trFanSfx(K, 250.2, 259.5, () => 1, { vol: 0.05, f: 900 });
  trFanSfx(K, 259.5, 260.5, ramp(259.5, 260.5, 1, 0), { vol: 0.05, f: 900 });
  trBed(K, 257.8, 260.1, { colour: 'white', f: [['bp', 3400, 2.0]], vol: 0.025, fi: 0.1, fo: 0.3 });
  flap(258.6, 260.4, 0.025, 0.3);
  K.put(fx.hit(fx.metalModes(140, 0.7), { width: 0.004, amp: 1, noise: 0.2, nlen: 0.02, nhp: 600, len: 1.2 }), 259.21, { vol: 0.06, norm: true });
  // 1978: engine and fan, the pass, the chequered flag
  trDriveSfx(K, 260.6, 267.0, () => 45, { vol: 0.035, road: () => 0.5 });
  trFanSfx(K, 260.6, 267.0, () => 1, { vol: 0.04, f: 1100 });
  trWhoosh(K, 265.28, { d: 0.7, vol: 0.08 });
  flap(264.8, 267.0, 0.03, -0.3);
  // the garage: roll in, door down, clank, lights off
  trDriveSfx(K, 267.0, 267.9, ramp(267.0, 267.9, 6, 0), { vol: 0.02 });
  trBed(K, 267.84, 268.64, { colour: 'pink', f: [['bp', 500, 0.8]], vol: 0.05, am: 0.7, wr: 18, fi: 0.05, fo: 0.02 });
  K.put(fx.hit(fx.metalModes(110, 0.7), { width: 0.004, amp: 1, noise: 0.3, nlen: 0.03, nhp: 500, len: 1.0 }), 268.64, { vol: 0.08, norm: true });
  trThump(K, 268.85, { vol: 0.05, f0: 90, tau: 0.05 });
  // McMurtry: fans spin up and whir; the rig motor turns it over; a settle clunk
  trFanSfx(K, 270.7, 271.7, ramp(270.7, 271.7, 0, 1), { vol: 0.05, f: 1500 });
  trFanSfx(K, 271.7, 283.1, () => 1, { vol: 0.05, f: 1500 });
  trTone(K, 274.96, 2.55, 62, [[1, 1], [2, 0.4], [3, 0.2]], null, { vol: 0.03, f: [['lp', 600]] });
  K.put(fx.creak(0.4, fx.metalModes(200, 0.5), {}), 277.6, { vol: 0.04, norm: true });
  trThump(K, 277.6, { vol: 0.06, f0: 60, tau: 0.1 });
});
