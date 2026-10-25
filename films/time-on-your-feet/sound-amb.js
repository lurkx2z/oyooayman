/* =====================================================================
   SOUND · AMBIENCE — what you hear where the picture is (tfPlace):
     home      a quiet house at 7 a.m.: the room, birds outside the window, a car now and then on the road
     lab       ventilation, the hum of the electronics (the 1959 tower: a tall hollow shaft)
     flight    a 1971 airliner's cabin: the engines' roar through the hull, the air
     skytree   wind at 450 m, the city far below
     space     the cosmos shots: a deep low air and the faintest hiss (GPS, the flights to the stars)
     moon      inside a spacesuit: its fan, your breath (in the effects)
     wd / ns   standing on a star (pretend): a deep roar from the glowing ground, deeper and denser on the neutron star
     bh        the platform: the lamp's hum, a deep pressure under everything; deeper as you go down; at the edge the
               world thins to almost nothing
   ===================================================================== */

let TF_PL = null;
function tfPl() {
  if (TF_PL) return TF_PL;
  const home = (s) => s.set === 'home' && s.mode !== 'title';
  return (TF_PL = {
    home: tfCurve(tfPlace(home)),
    title: tfCurve(tfPlace((s) => s.mode === 'title')),
    lab: tfCurve(tfPlace((s) => s.set === 'lab' && s.mode !== 'pound')),
    shaft: tfCurve(tfPlace((s) => s.mode === 'pound')),
    flight: tfCurve(tfPlace((s) => s.mode === 'flight')),
    sky: tfCurve(tfPlace((s) => s.mode === 'skytree')),
    space: tfCurve(tfPlace((s) => (s.set === 'orbit' && s.mode !== 'moon') || ((s.set === 'wd' || s.set === 'ns') && (s.mode === 'approach' || s.mode === 'stretched')) || (s.set === 'bh' && ['approach', 'sphere'].includes(s.mode)), 0.3)),
    moon: tfCurve(tfPlace((s) => s.mode === 'moon')),
    wd: tfCurve(tfPlace((s) => s.set === 'wd' && (s.mode === 'surface' || s.mode === 'clocks'))),
    ns: tfCurve(tfPlace((s) => s.set === 'ns' && s.mode !== 'approach')),
    bh: tfCurve(tfPlace((s) => s.set === 'bh' && !['approach', 'sphere'].includes(s.mode))),
  });
}

tfSound('amb', 'places', function (ctx, bus, K) {
  const { fx, r } = K, END = TF.end + 1.5, P = tfPl();
  const room = K.verb('room', 0.7, { bright: 0.35, damp: 4, wet: 0.35, seed: 31 });
  const out = K.verb('out', 2.2, { bright: 0.42, damp: 2.6, wet: 0.5, seed: 29, pre: 0.02 });
  const shaft = K.verb('shaft', 3.4, { bright: 0.4, damp: 2.0, wet: 0.6, seed: 37, pre: 0.03, early: [[0.021, 0.4], [0.047, 0.3], [0.081, 0.2]] });

  // ---- home: the room, the window's birds, a car now and then (during the sped-up year the house is quiet: the
  //      effects carry the rush of days)
  const quiet = tfCurve((t) => 1 - tfWn(t, TF.yearGo, TF.yearEnd, 0.4, 0.4) * 0.85 - tfWn(t, TF.life + 0.3, TF.lifeEnd, 0.3, 0.4) * 0.85);
  const H = tfCurve((t) => P.home(t) * quiet(t));
  tfBed(K, 0, END, { colour: 'pink', f: [['lp', 700]], vol: 0.02, am: 0.15, wr: 0.1, env: (u, t) => H(t), fi: 0.02, fo: 0.3 });
  tfBed(K, 0, END, { colour: 'brown', f: [['lp', 180]], vol: 0.03, am: 0.25, wr: 0.07, env: (u, t) => H(t), fi: 0.02, fo: 0.3 });
  tfBed(K, 0, END, { colour: 'pink', f: [['bp', 2600, 0.5], ['lp', 6000]], vol: 0.004, am: 0.6, wr: 0.2, env: (u, t) => H(t), fi: 0.02, fo: 0.3 });   // air outside
  {
    const voices = [[3100, 0.55, 1.1], [3900, 0.7, 1.6], [2500, 0.4, 2.2], [4500, 0.8, 2.8]];
    voices.forEach(([f0, pan, gap], v) => {
      for (let t = TF.hall - 1 + v * 0.9; t < END - 1; t += gap * r.range(1.1, 2.4)) {
        const lv = H(t); if (lv < 0.05 || r.chance(0.3)) continue;
        K.put(tfChirp(fx, { f0: f0 * r.range(0.92, 1.08), n: r.int(2, 6) }), t, { vol: 0.006 * lv, norm: true, pan, lp: 6500, room: out, wet: 0.6 });
      }
    });
    for (const [t, pan] of [[TF.hall + 3.2, 0.7], [TF.yes + 1.5, -0.6], [TF.cat + 2, 0.6], [TF.why + 3.2, -0.5], [TF.real + 5, 0.6], [TF.home + 2.5, -0.6]]) {
      tfBed(K, t, t + 6.5, { colour: 'pink', f: [['bp', 380, 0.6], ['lp', 1000]], vol: 0.01, mono: true, pan, env: (u, tt) => Math.pow(Math.sin(Math.PI * u), 2) * H(tt), fi: 0.3, fo: 0.3 });
    }
  }
  // the title: the hallway in the half-light, very quiet
  tfBed(K, 0, END, { colour: 'pink', f: [['lp', 600]], vol: 0.012, env: (u, t) => P.title(t), fi: 0.02, fo: 0.3 });

  // ---- the labs: ventilation, mains hum, an electronics whine; the tower shaft: hollow and tall
  tfBed(K, TF.measured - 1, TF.gps + 1, { colour: 'pink', f: [['lp', 1400], ['hp', 120]], vol: 0.03, am: 0.15, wr: 0.2, env: (u, t) => P.lab(t), fi: 0.02, fo: 0.3 });
  tfTone(K, TF.measured - 1, TF.gps - TF.measured + 2, 50, [[1, 0.6], [2, 1], [3, 0.4], [4, 0.2], [6, 0.08]], (u, tt) => P.lab(TF.measured - 1 + tt), { vol: 0.006, f: [['lp', 600]] });
  tfTone(K, TF.measured - 1, TF.gps - TF.measured + 2, 7800, [[1, 1]], (u, tt) => P.lab(TF.measured - 1 + tt) * 0.4, { vol: 0.0012, pan: 0.4 });
  tfBed(K, TF.pound - 0.5, TF.planes + 0.5, { colour: 'pink', f: [['lp', 900], ['hp', 60]], vol: 0.03, am: 0.35, wr: 0.15, env: (u, t) => P.shaft(t), fi: 0.02, fo: 0.3, room: shaft, wet: 0.8 });
  tfBed(K, TF.pound - 0.5, TF.planes + 0.5, { colour: 'brown', f: [['lp', 120]], vol: 0.03, env: (u, t) => P.shaft(t), fi: 0.02, fo: 0.3 });

  // ---- the airliner: the engines through the hull, the air rushing past, the cabin's whoosh
  tfBed(K, TF.planes - 0.5, TF.nist + 0.5, { colour: 'brown', f: [['lp', 300]], vol: 0.12, am: 0.12, wr: 0.15, env: (u, t) => P.flight(t), fi: 0.02, fo: 0.2 });
  tfBed(K, TF.planes - 0.5, TF.nist + 0.5, { colour: 'pink', f: [['bp', 700, 0.5], ['lp', 3000]], vol: 0.03, am: 0.2, wr: 0.3, env: (u, t) => P.flight(t), fi: 0.02, fo: 0.2 });
  tfTone(K, TF.planes - 0.5, TF.nist - TF.planes + 1, 118, [[1, 1], [2, 0.5], [3, 0.25], [5, 0.1]], (u, tt) => P.flight(TF.planes - 0.5 + tt), { vol: 0.008, f: [['lp', 800]] });

  // ---- the Skytree: wind at height, gusting; the city far below
  tfBed(K, TF.skytree - 0.5, TF.jila + 0.5, { colour: 'pink', f: [['bp', 500, 0.4], ['lp', 2500]], vol: 0.05, am: 0.7, wr: 0.25, env: (u, t) => P.sky(t), fi: 0.02, fo: 0.2 });
  tfBed(K, TF.skytree - 0.5, TF.jila + 0.5, { colour: 'brown', f: [['lp', 250]], vol: 0.04, am: 0.3, wr: 0.1, env: (u, t) => P.sky(t), fi: 0.02, fo: 0.2 });
  tfBed(K, TF.skytree - 0.5, TF.jila + 0.5, { colour: 'pink', f: [['bp', 300, 0.7], ['lp', 900]], vol: 0.012, am: 0.4, wr: 0.2, env: (u, t) => P.sky(t), fi: 0.02, fo: 0.2, room: out, wet: 0.8 });

  // ---- space: a deep low air and the faintest hiss
  tfBed(K, TF.gps - 1, END, { colour: 'brown', f: [['lp', 70]], vol: 0.045, env: (u, t) => P.space(t), fi: 0.02, fo: 0.3 });
  tfBed(K, TF.gps - 1, END, { colour: 'pink', f: [['hp', 5000]], vol: 0.0022, env: (u, t) => P.space(t), fi: 0.02, fo: 0.3 });

  // ---- the Moon, inside the suit: its fan
  tfBed(K, TF.moon - 0.5, TF.why + 0.5, { colour: 'pink', f: [['bp', 1100, 0.8], ['lp', 3000]], vol: 0.012, am: 0.1, wr: 0.5, env: (u, t) => P.moon(t), fi: 0.02, fo: 0.2 });
  tfTone(K, TF.moon - 0.5, TF.why - TF.moon + 1, 180, [[1, 1], [2, 0.4], [3, 0.2]], (u, tt) => P.moon(TF.moon - 0.5 + tt), { vol: 0.003, f: [['lp', 900]] });

  // ---- on Sirius B (pretend): the glowing ground's roar; on the neutron star: deeper, denser
  tfBed(K, TF.wdLand - 0.5, TF.wd4 + 0.5, { colour: 'brown', f: [['lp', 160]], vol: 0.07, am: 0.25, wr: 0.08, env: (u, t) => P.wd(t), fi: 0.02, fo: 0.3 });
  tfBed(K, TF.wdLand - 0.5, TF.wd4 + 0.5, { colour: 'pink', f: [['bp', 900, 0.3], ['lp', 4000]], vol: 0.014, am: 0.4, wr: 0.3, env: (u, t) => P.wd(t), fi: 0.02, fo: 0.3 });
  tfBed(K, TF.nsLand - 0.5, TF.bh + 0.5, { colour: 'brown', f: [['lp', 90]], vol: 0.09, am: 0.2, wr: 0.06, env: (u, t) => P.ns(t), fi: 0.02, fo: 0.3 });
  tfTone(K, TF.nsLand - 0.5, TF.bh - TF.nsLand + 1, 36.7, [[1, 1], [2, 0.4], [3, 0.15]], (u, tt) => P.ns(TF.nsLand - 0.5 + tt), { vol: 0.012, f: [['lp', 200]] });
  tfBed(K, TF.nsLand - 0.5, TF.bh + 0.5, { colour: 'pink', f: [['hp', 3000], ['lp', 9000]], vol: 0.004, am: 0.3, wr: 0.4, env: (u, t) => P.ns(t), fi: 0.02, fo: 0.3 });

  // ---- the black hole's platform: the lamp's hum, a deep pressure that grows as you go down; it thins at the edge
  {
    const deep = tfCurve((t) => MathX.smooth(Math.log10(tfBhRatio(tfRho(t))), 0, 2.6));
    const thin = tfCurve((t) => 1 - 0.8 * MathX.smooth(t, TF.freeze - 0.5, TF.freeze + 1.5) + 0.8 * MathX.smooth(t, TF.feetView - 0.3, TF.feetView + 0.6));
    const B = tfCurve((t) => P.bh(t) * thin(t));
    tfBed(K, 0, TF.real + 1, { colour: 'brown', f: [['lp', 110]], vol: 0.06, am: 0.2, wr: 0.07, env: (u, t) => B(t) * (0.55 + 0.45 * deep(t)), fi: 0.02, fo: 0.3 });
    tfTone(K, 0, TF.real + 1, 60, [[1, 0.5], [2, 1], [3, 0.35], [4, 0.2]], (u, tt) => B(tt), { vol: 0.004, pan: 0.3, f: [['lp', 500]] });
    tfTone(K, 0, TF.real + 1, 30.9, [[1, 1], [2, 0.3]], (u, tt) => B(tt) * deep(tt), { vol: 0.016, f: [['lp', 140]] });
    tfBed(K, 0, TF.real + 1, { colour: 'pink', f: [['hp', 4500]], vol: 0.002, env: (u, t) => B(t), fi: 0.02, fo: 0.3 });
  }
});
