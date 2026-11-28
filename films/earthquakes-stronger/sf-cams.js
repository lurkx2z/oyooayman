/* =====================================================================
   SF CAMS — a camera and the labels for every shot mode of the San Francisco set (shots.js names them).
   eqSfCam(mode, u, s, set, X) → { p, at, fov, roll, near, shake: 'ground', local (p / at in the helicopter's own
   frame), shR / shC (the sun's shadow box), inside, fxRange, fog }. u: seconds into the shot; s: story seconds.
   Positions: G(u, y, v) the waterfront frame, plain [x, y, z] the world (sf-geo.js).
   ===================================================================== */

const eqG = eqWL;
const eqPush = (a, b, u, d) => eqV(a, b, MathX.clamp(u / d, 0, 1));
function eqHead(you) { const v = you.headWorld(); return [v.x, v.y, v.z]; }
// a point ahead/behind someone (yaw: world, 0 = +z)
const eqAhead = (p, yaw, d, side = 0, up = 0) => [p[0] + Math.sin(yaw) * d + Math.cos(yaw) * side, p[1] + up, p[2] + Math.cos(yaw) * d - Math.sin(yaw) * side];

function eqSfCam(mode, u, s, set, X) {
  const you = set.you, H = set.heli, Y = EQ_GROUND_Y;
  const head = () => eqHead(you), yaw = you.root.rotation.y;
  const heliP = () => { const p = H.g.position; return [p.x, p.y, p.z]; };
  const cupW = () => { const v = set.wf.cup.world(); return [v.x, v.y, v.z]; };
  const gr = (o) => Object.assign({ shake: 'ground', shR: 30 }, o);
  const air = (o) => Object.assign({ near: 2, shR: 1400, drift: 0.4 }, o);
  const C = {
    // ---- the cold open (the last minute)
    openSF: () => air({ p: eqPush([-690, 215, -770], [-750, 185, -700], u, 0.9), at: [-920, 0, -150], fov: 50, roll: 10, near: 1, shR: 600 }),   // (the molten crack through the flattened city)
    openFace: () => ({ local: true, p: [0.1, 2.03, 1.58], at: [0.45, 2.05, 0.8], fov: 40, inside: true, shR: 6, near: 0.03 }),
    // ---- minute one: the café
    cafeWide: () => { const h = head(); return gr({ p: eqPush(eqG(375.3, 3.75, 11.1), eqG(374.8, 3.7, 11.0), u, 3), at: eqV(h, eqG(0, 40, 6), 0.035), fov: 50, shakeK: 0, shC: h }); },
    aerialSF: () => air({ p: eqPush([1650, 190, -1350], [1500, 175, -1250], u, 3), at: [-600, 40, 500], fov: 46 }),
    helipad: () => gr({ p: eqPush(eqG(384.5, 4.6, 124), eqG(384, 4.3, 127), u, 5), at: eqG(380, 2.6, 160), fov: 38, shC: eqG(380, 2, 158), shakeK: 0 }),
    faceFelt: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 0.95, 0.2, 0.02), at: [h[0], h[1] - 0.02, h[2]], fov: 34, shC: h, shR: 6, shakeK: 0.4 }); },
    cupRipple: () => { const c = cupW(); return gr({ p: [c[0] + 0.16, c[1] + 0.2, c[2] + 0.13], at: [c[0], c[1] + 0.05, c[2]], fov: 30, shC: c, shR: 3, near: 0.02, shakeK: 0.2 }); },
    bayView: () => gr({ p: eqG(386, 3.6, 18.5), at: eqG(900, 60, 1500), fov: 50, shakeK: 0.3 }),
    street: () => { const uA = 372 + 6.5 * (s - 25.5); return gr({ p: eqG(368, Y + 1.75, -10.5), at: eqG(MathX.lerp(360, uA, 0.6), 2.6, -32), fov: 46, shC: eqG(370, 2, -25), shakeK: 0.5 }); },
    ruleFace: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 1.1, -0.35, 0.12), at: [h[0], h[1] - 0.06, h[2]], fov: 32, shC: h, shR: 6 }); },
    terraceTop: () => gr({ p: eqPush(eqG(366, 34, 28), eqG(366, 38, 30), u, 9), at: eqG(372, 2.5, 6), fov: 44, shC: eqG(372, 2, 8), shR: 40, shakeK: 0 }),
    clock: () => gr({ p: eqPush(eqG(58, 37, 1.5), eqG(56, 37, 1.5), u, 7), at: eqG(6.2, Y + 50, 6), fov: 17, shC: eqG(0, 50, 6), shR: 20, shakeK: 0.15 }),
    cup: () => { const c = cupW(); return gr({ p: [c[0] - 0.05, c[1] + 0.36, c[2] - 0.0], at: [c[0], c[1] + 0.04, c[2]], fov: 40, near: 0.02, shC: c, shR: 4, shakeK: 0.3 }); },
    cupMacro: () => { const c = cupW(); const k = MathX.smooth(u, 0, 3); return gr({ p: [c[0] + 0.07 - 0.02 * k, c[1] + 0.16 - 0.04 * k, c[2] + 0.06], at: [c[0], c[1] + 0.066, c[2]], fov: 28, near: 0.01, shC: c, shR: 3, shakeK: 0.25 }); },
    terraceRise: () => gr({ p: eqPush(eqG(364, 3.8, 17), eqG(372, 30, 62), u, 5), at: eqPush(eqG(372, 3, 9), eqG(356, 2, -32), u, 5), fov: 48, shC: eqG(372, 2, 6), shR: 50, shakeK: 0.3 }),
    bayView2: () => gr({ p: eqPush(eqG(361.5, 3.3, 14.5), eqG(361.5, 3.4, 15.5), u, 5), at: eqG(1400, 45, 1250), fov: 40, shC: eqG(372, 2, 12), shR: 30, shakeK: 0.3 }),
    calmWide: () => gr({ p: eqPush(eqG(331, Y + 1.7, -41), eqG(336, Y + 1.7, -41), u, 5), at: eqG(372, 4.2, 8), fov: 40, shC: eqG(366, 2, -12), shR: 50, shakeK: 0.2 }),
    // ---- minute two
    jolt4: () => gr({ p: eqG(388.5, 4.2, 17.8), at: eqG(366, 3.0, 7.5), fov: 50, shC: eqG(372, 2, 10), shakeK: 1.4 }),
    truck: () => gr({ p: eqG(392, Y + 0.6, -26.8), at: eqG(330, Y + 1.2, -33.5), fov: 44, shC: eqG(370, 2, -30) }),
    locals: () => gr({ p: eqG(365.8, 3.45, 2.2), at: eqG(368.4, 3.15, 4.9), fov: 38, shC: eqG(368, 2, 4.5), shR: 8 }),
    youSide: () => { const h = head(), c = eqAhead(h, yaw, 0.7, 1.4, 0.1), dx = h[0] - c[0], dz = h[2] - c[2], l = Math.hypot(dx, dz);
      // (you on the left third: the card on the right covered your face)
      return gr({ p: c, at: [h[0] - (dz / l) * 0.45, h[1] - 0.08, h[2] + (dx / l) * 0.45], fov: 36, shC: h, shR: 8 }); },
    faultMap: () => ({ p: eqPush([600, 47000, 23000], [500, 44000, 21500], u, 9), at: [200, 0, 2500], fov: 38, near: 200, far: 140000, shR: 0, fog: 0, drift: 0 }),
    // (the second half of the fault map: pushing in on the city between the two faults)
    faultMap2: () => ({ p: eqPush([-2000, 26000, 9000], [-1800, 21000, 7200], u, 7), at: [-1600, 0, 1800], fov: 38, near: 100, far: 140000, shR: 0, fog: 0, drift: 0 }),
    // (from the promenade: the terrace and its people, left of the card)
    terraceLow: () => gr({ p: eqPush(eqG(349, Y + 1.7, -9), eqG(351, Y + 1.7, -8.5), u, 3.5), at: eqG(390, Y + 1.3, 11), fov: 46, shC: eqG(372, 2, 6), shR: 40, shakeK: 0.6 }),
    // (up at the Ferry Building's tower from the promenade, the flag shaking)
    ferryLook: () => gr({ p: eqPush(eqG(52, Y + 1.6, -9), eqG(46, Y + 1.6, -9.5), u, 4), at: eqG(0, 40, 6), fov: 50, shC: eqG(10, 2, 0), shR: 60, shakeK: 0.6 }),
    drone: () => air({ p: eqPush(eqG(430, 62, 150), eqG(445, 66, 160), u, 8), at: eqG(335, 3, -25), fov: 46, near: 0.5, shR: 140, shC: eqG(360, 2, -20) }),
    birds: () => gr({ p: eqG(377.5, 3.3, 38), at: eqPush(eqG(382, 3.8, 70), eqG(390, 14, 110), u, 3.5), fov: 46, shC: eqG(380, 2, 60), shR: 30, shakeK: 0.4 }),
    pier: () => gr({ p: eqPush(eqG(379.4, 4.3, 24), eqG(379.4, 4.25, 29), u, 7),   // (on the pier itself: from the café's end its railing swept across the lens)
      at: eqG(380, 3.4, 160), fov: 34, shC: eqG(380, 2, 60), shR: 70, shakeK: 0.4 }),
    pilotWave: () => { const p = set.pilot.headWorld(); return gr({ p: eqG(376.6, 3.3, 141), at: [p.x, p.y - 0.25, p.z], fov: 34, shC: [p.x, p.y, p.z], shR: 12, shakeK: 0.5 }); },
    youSee: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 2.2, 0.6, -0.1), at: [h[0], h[1] - 0.15, h[2]], fov: 40, shC: h, shR: 8, shakeK: 0.7 }); },
    // ---- minute three
    jolt5: () => gr({ p: eqG(364.8, Y + 1.75, 7.4), at: eqG(360.6, Y + 2.3, 10.6), fov: 48, shC: eqG(361, 3, 10), shR: 8, shakeK: 1.1 }),
    everyone: () => gr({ p: eqG(327, Y + 1.75, -4.5), at: eqG(380, Y + 1.3, -8), fov: 48, shC: eqG(350, 2, -6), shR: 40, shakeK: 1.0 }),
    alert: () => gr({ p: eqG(364.6, 3.4, 2.8), at: eqG(368.3, 2.9, 5.0), fov: 40, shC: eqG(368, 2, 4.5), shR: 8, shakeK: 0.9 }),
    phones: () => gr({ p: eqG(402, Y + 1.6, -6.5), at: eqG(350, Y + 1.1, -11.5), fov: 44, shC: eqG(380, 2, -8), shR: 40, shakeK: 1.0 }),
    lowStreet: () => gr({ p: eqG(378, Y + 0.5, -11.5), at: eqG(386, Y + 4.5, -60), fov: 54, shC: eqG(372, 2, -35), shR: 40, shakeK: 1.0 }),
    crowd: () => gr({ p: eqG(375, Y + 1.65, -43.5), at: eqG(366, Y + 1.6, -56), fov: 50, shC: eqG(372, 2, -40), shR: 40, shakeK: 1.0 }),
    drop: () => gr({ p: eqG(378.5, 2.9, 2.3), at: eqG(375, 2.6, 10.5), fov: 50, shC: eqG(376, 2, 9), shR: 14, shakeK: 1.0 }),
    never: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 1.05, 0.15, 0.03), at: [h[0], h[1] - 0.03, h[2]], fov: 34, shC: h, shR: 6, shakeK: 0.6 }); },
    run: () => { const h = head(); return gr({ p: eqAhead(h, yaw, -3.6, 0.6, 0.35), at: eqAhead(h, yaw, 6, 0, -0.5), fov: 52, shC: h, shR: 14, shakeK: 1.0 }); },
    ferry: () => gr({ p: eqPush(eqG(262, Y + 1.7, -8), eqG(254, Y + 1.7, -8), u, 6), at: eqG(0, 48, 6), fov: 24, shC: eqG(0, 40, 6), shR: 60, shakeK: 0.5 }),
    pierRun: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 5.5, 0.4, 0.05), at: [h[0], h[1] - 0.2, h[2]], fov: 44, shC: h, shR: 14, shakeK: 1.0 }); },
    pierTrack: () => { const h = head(), [, hv] = eqUV(h[0], h[2]); return gr({ p: eqG(396, 3.4, hv - 5), at: [h[0], h[1] - 0.3, h[2]], fov: 40, shC: h, shR: 16, shakeK: 1.0 }); },
    pierHeli: () => { const h = head(); return gr({ p: eqG(382.3, 3.5, 150), at: [h[0], h[1] - 0.4, h[2]], fov: 34, shC: eqG(380, 2, 135), shR: 30, shakeK: 1.0 }); },
    // ---- minute four
    jolt6: () => gr({ p: eqG(383.4, 2.7, 134.5), at: eqG(380.1, 2.6, 128.6), fov: 46, shC: eqG(380, 2, 130), shR: 10, shakeK: 1.3 }),
    skyline: () => gr({ p: eqG(385.5, 6.5, 152), at: eqG(220, 55, -320), fov: 46, shC: eqG(380, 2, 140), shR: 60, shakeK: 1.0 }),
    windows: () => gr({ p: eqG(396, Y + 0.9, -31), at: eqG(380, 14, -52), fov: 56, shC: eqG(380, 2, -45), shR: 40, shakeK: 1.0 }),
    chimneys: () => gr({ p: eqG(393, 3.8, -38), at: eqG(377, 21, -62), fov: 48, shC: eqG(380, 2, -55), shR: 40, shakeK: 1.0 }),
    alarms: () => gr({ p: eqG(338, Y + 0.9, -19.5), at: eqG(420, Y + 0.9, -36), fov: 46, shC: eqG(370, 2, -30), shR: 40, shakeK: 1.0 }),
    streetcar: () => gr({ p: eqG(437, Y + 1.6, -15.2), at: eqG(451, Y + 1.4, -27), fov: 48, shC: eqG(450, 2, -26), shR: 20, shakeK: 1.0 }),
    in: () => ({ local: true, p: [3.9, 1.7, 2.6], at: [1.0, 1.25, 0.5], fov: 44, shR: 10, near: 0.05 }),
    start: () => ({ local: true, p: [-0.2, 2.0, 1.92], at: [-0.45, 2.04, 0.78], fov: 42, inside: true, shR: 6, near: 0.03 }),
    startTwo: () => gr({ p: eqPush(eqG(391, 3.3, 149), eqG(388.5, 3.2, 151.5), u, 5.8), at: eqG(380, 4.6, 160), fov: 46, shC: eqG(380, 2, 158), shR: 16, shakeK: 0.8 }),   // (closer: from 19 m the helicopter was small)
    fillDia: () => gr({ p: eqG(372, Y + 1.8, -38), at: eqG(372, Y + 0.6, -85), fov: 52, shC: eqG(372, 2, -60), shR: 40, shakeK: 0.9 }),
    mudBoil: () => gr({ p: eqPush(eqG(352, Y + 2.6, -30.5), eqG(354, Y + 2.3, -31.5), u, 5), at: eqG(360, Y - 0.3, -43), fov: 46, shC: eqG(360, 2, -42), shR: 20, shakeK: 0.9 }),
    sink: () => gr({ p: eqG(388, Y + 1.3, -31.4), at: eqG(396, Y - 0.2, -38.5), fov: 44, shC: eqG(395, 2, -38), shR: 14, shakeK: 0.9 }),
    cockpitWait: () => ({ local: true, p: [-0.15, 1.96, 1.85], at: [0.45, 2.0, 0.78], fov: 40, inside: true, shR: 6, near: 0.03 }),
    rotorUp: () => gr({ p: eqG(370.5, 2.95, 166.5), at: eqG(380, 5.8, 160), fov: 52, shC: eqG(380, 2, 160), shR: 16, shakeK: 1.0 }),
    // ---- minute five
    jolt7: () => gr({ p: eqG(396, 9.5, 171), at: eqG(370, 9, -60), fov: 50, shC: eqG(380, 2, 60), shR: 120, shakeK: 1.0 }),
    haiti: () => gr({ p: eqG(387, 7.5, 163), at: eqG(150, 40, -260), fov: 44, shC: eqG(380, 2, 140), shR: 80, shakeK: 1.0 }),
    brick: () => gr({ p: eqG(371, Y + 1.7, -6.5), at: eqG(381, 13, -60), fov: 54, shC: eqG(380, 2, -45), shR: 50, shakeK: 1.0 }),
    split: () => gr({ p: eqPush(eqG(402, Y + 6.5, -25.5), eqG(399, Y + 5.2, -26.5), u, 5), at: eqG(360, Y - 2.5, -30.5), fov: 50, shC: eqG(375, 2, -30), shR: 40, shakeK: 0.8 }),
    pierBreak: () => gr({ p: eqPush(eqG(388.5, Y + 3.2, 151.5), eqG(389, Y + 3.7, 153.5), u, 5.5), at: eqG(378, Y - 0.5, 66), fov: 52, shC: eqG(380, 2, 120), shR: 60, shakeK: 1.0 }),
    lift: () => { const h = heliP(); return gr({ p: eqG(398, 5.5, 139), at: [h[0], h[1] + 1.8, h[2]], fov: 44, shC: h, shR: 24, shakeK: 0.9 }); },
    sky: () => ({ local: true, p: [-0.1, 1.98, 1.9], at: [0.45, 2.0, 0.78], fov: 38, inside: true, shR: 6, near: 0.03 }),
    skyWide: () => { const h = heliP(); const back = eqWL(380, 0, 900); return air({ p: [h[0] + (back[0] - h[0]) * 0.07, h[1] + 14, h[2] + (back[2] - h[2]) * 0.07], at: [h[0], h[1] - 6, h[2]], fov: 50, near: 0.5, shC: h, shR: 200 }); },
    bayBridge: () => air({ p: eqPush([2050, 48, -520], [1985, 52, -462], u, 5), at: [1031, 70, 139], fov: 50 }),
    bayDrop: () => air({ p: [1990, 82, -600], at: [1822, 52, -815], fov: 40, shR: 300, shC: [1822, 50, -815] }),
    heliOverBay: () => { H.g.updateMatrixWorld(true); const p = H.toWorld(-14, 3, 20), a = H.toWorld(0, 1.5, 0); return air({ p: [p.x, p.y, p.z], at: [a.x, a.y, a.z], fov: 42, near: 0.5, shC: [a.x, a.y, a.z], shR: 60 }); },
    downtown: () => air({ p: eqPush([620, 330, -1120], [570, 318, -1060], u, 6), at: [-700, 60, 300], fov: 44 }),
    // ---- minute six
    jolt8: () => air({ p: eqG(260, 88, 270), at: eqG(0, 36, 6), fov: 40, shC: eqG(0, 10, 0), shR: 200 }),
    y1906: () => air({ p: eqPush([760, 255, -260], [700, 250, -200], u, 7), at: [-600, 40, 500], fov: 42 }),
    fires: () => air({ p: [300, 390, -1300], at: [-1500, 40, 1500], fov: 50 }),
    wideCity: () => air({ p: eqPush([-200, 900, -3200], [-300, 880, -3100], u, 8), at: [-1500, 0, 1500], fov: 46 }),
    pyramid: () => air({ p: eqPush([-300, 170, -430], [-330, 165, -400], u, 9), at: [-801, 150, 33], fov: 36, shC: [-801, 100, 33], shR: 300 }),
    pyramidFall: () => air({ p: eqPush([-545, 185, -290], [-562, 180, -268], u, 6), at: [-801, 150, 33], fov: 42,   // (above the roofs: at 120 m it flew through one)
      shC: [-801, 100, 33], shR: 300 }),
    golden: () => air({ p: eqPush([-4700, 230, -2700], [-4800, 225, -2690], u, 5), at: [-7450, 95, -2370], fov: 30, fxRange: 4000 }),
    ggFall: () => air({ p: [-6250, 125, -2520], at: [-7450, 55, -2370], fov: 38, shC: [-7450, 40, -2370], shR: 900 }),
    phoneLap: () => ({ local: true, p: [0.25, 1.98, 1.85], at: [0.66, 1.9, 0.9], fov: 46, inside: true, shR: 6, near: 0.03 }),
    // ---- minute seven
    jolt9: () => air({ p: [-400, 720, -2650], at: [-1500, 0, 1200], fov: 50 }),
    japan: () => air({ p: eqPush([1950, 210, 330], [1900, 205, 300], u, 5), at: [1300, 40, -320], fov: 46 }),
    tsarBg: () => air({ p: [500, 520, -1500], at: [-900, 0, 900], fov: 48 }),
    calm: () => ({ local: true, p: [0.66, 2.04, 1.38], at: [0.38, 2.0, 0.8], fov: 50, inside: true, shR: 6, near: 0.03 }),
    empty: () => air({ p: eqPush(eqG(380, 210, 900), eqG(380, 200, 860), u, 10), at: eqG(300, 0, 60), fov: 46 }),
    drained: () => air({ p: eqPush(eqG(720, 70, 560), eqG(690, 64, 530), u, 6), at: eqG(380, -6, 110), fov: 46, shC: eqG(400, 0, 200), shR: 400 }),
    back: () => air({ p: eqPush(eqG(368, 8.5, -2), eqG(370, 7.5, 3), u, 4.5), at: eqG(398, 7, 170), fov: 58, shC: eqG(385, 0, 90), shR: 160 }),   // (from the seawall by your café, low: the wall of water coming at you)
    cafe: () => air({ p: eqG(610, 58, 300), at: eqG(372, 5, 6), fov: 34, shC: eqG(372, 2, 6), shR: 200 }),
    // ---- minute eight
    jolt10: () => air({ p: [420, 260, -400], at: [-308, 150, 644], fov: 44 }),
    recordBg: () => air({ p: [-1000, 520, -2400], at: [-1500, 0, 1500], fov: 50 }),
    chile: () => air({ p: eqPush([-1750, 420, -1500], [-1700, 410, -1450], u, 4), at: [-900, 0, 600], fov: 48 }),
    faultCrack: () => ({ p: eqPush([500, 44000, 21500], [400, 42000, 20500], u, 7), at: [200, 0, 2500], fov: 38, near: 200, far: 140000, shR: 0, fog: 0, drift: 0 }),
    gravity: () => air({ p: eqPush([-1200, 150, 140], [-1230, 140, 170], u, 6), at: [-1460, 0, 400], fov: 46, shC: [-1460, 0, 400], shR: 250 }),
    ruins: () => air({ p: [200, 620, -2000], at: [-1200, 0, 1200], fov: 48 }),
    crackSF: () => air({ p: eqPush([-560, 300, -950], [-620, 290, -900], u, 8), at: [-1200, 0, -220], fov: 50 }),
    // ---- minute nine
    jolt11: () => air({ p: [-300, 660, -2350], at: [-1500, 0, 1500], fov: 50 }),
    yearsBg: () => air({ p: [-2400, 720, -1800], at: [-900, 0, 1400], fov: 50 }),
    air: () => ({ local: true, p: [0.02, 2.06, 1.7], at: [0.45, 2.0, 0.8], fov: 46, inside: true, shR: 6, near: 0.03 }),
    fuel: () => ({ local: true, p: [0.08, 1.98, 1.08], at: [-0.3, 1.45, 1.72], fov: 46, inside: true, shR: 6, near: 0.03 }),
    nowhere: () => { const h = heliP(); return air({ p: [h[0] + 600, h[1] + 260, h[2] - 700], at: [h[0] - 700, h[1] - 380, h[2] + 1900], fov: 54, shR: 0 }); },   // (no sun shadows from up here: the shadow box's edge drew a dark line on the bay)
    below: () => { const h = heliP(), at = [-950, 0, -250], d = [at[0] - h[0], at[1] - h[1], at[2] - h[2]], l = Math.hypot(d[0], d[1], d[2]);
      // (over your helicopter's tail, down at what is left of the city: the window shot looked into the sun)
      const b = (k, up) => [h[0] - (d[0] / l) * k, h[1] - (d[1] / l) * k + up, h[2] - (d[2] / l) * k];
      return air({ p: eqPush(b(36, 12), b(27, 9), u, 5.7), at, fov: 50, shR: 0 }); },
    // ---- minute ten
    melt: () => air({ p: eqPush([-720, 230, -720], [-760, 220, -690], u, 7), at: [-920, 0, -150], fov: 48 }),
    last: () => ({ local: true, p: [0.12, 2.0, 1.72], at: [0.45, 2.03, 0.8], fov: 38, inside: true, shR: 6, near: 0.03 }),
    question: () => ({ local: true, p: [0.14, 2.0, 1.56], at: [0.45, 2.04, 0.78], fov: 32, inside: true, shR: 6, near: 0.03 }),
  };
  const f = C[mode];
  return f ? f() : null;
}

// the labels pinned in the scene: [{ p, text, sub, a, you, side }]
function eqSfLabels(mode, u, s, set, X) {
  void X;
  const a = MathX.smooth(u, 0.35, 0.8), M = set.marks;
  const L = (p, text, sub, o = {}) => Object.assign({ p, text, sub, a }, o);
  const head = () => { const v = set.you.headWorld(); return [v.x, v.y + 0.35, v.z]; };
  const heliTop = () => { const v = set.heli.toWorld(0, 3.6, 0); return [v.x, v.y, v.z]; };
  const T = {
    cafeWide: () => [L(head(), 'YOU', null, { you: true })],
    aerialSF: () => [L([-700, 260, 450], 'SAN FRANCISCO'), L(M.bay.label, 'BAY BRIDGE', '1936')],
    helipad: () => [L(heliTop(), 'YOUR HELICOPTER', 'TOUR OF THE BAY')],
    faultMap: () => { const sa = eqLL(37.66, -122.53), hw = eqLL(37.79, -122.19); return [L([sa[0], 600, sa[1]], 'SAN ANDREAS FAULT'), L([hw[0], 600, hw[1]], 'HAYWARD FAULT', null, { side: 'r' }), L(eqG(372, 400, 10), 'YOU', null, { you: true })]; },
    faultMap2: () => { const sa = eqLL(37.6, -122.48), hw = eqLL(37.75, -122.15); return [L([sa[0], 300, sa[1]], 'SAN ANDREAS FAULT'), L([hw[0], 300, hw[1]], 'HAYWARD FAULT', null, { side: 'r' }), L(eqG(372, 200, 10), 'YOU', null, { you: true })]; },
    ferryLook: () => [L(M.ferry.top, 'FERRY BUILDING', '1898 · CAME THROUGH 1906 AND 1989')],
    pier: () => [L(heliTop(), 'YOUR HELICOPTER', 'TOUR LEAVES AT 10:00')],
    ferry: () => [L(M.ferry.top, 'FERRY BUILDING', 'SURVIVED 1906')],
    skyline: () => [L(M.salesforce.label, 'SALESFORCE TOWER', '326 M · TALLEST IN THE CITY')],
    streetcar: () => [L(eqG(447, 5.2, -25), 'F-LINE STREETCAR', 'VINTAGE CARS, STILL RUNNING')],
    bayBridge: () => [L(M.bay.label, 'BAY BRIDGE', 'WEST SPAN · 1936')],
    jolt8: () => [L(eqG(0, 70, 6), 'FERRY BUILDING', 'CLOCK TOWER, 1898')],
    y1906: () => [L(M.coit.label, 'COIT TOWER'), L(M.salesforce.label, 'SALESFORCE TOWER')],
    pyramid: () => [L(M.pyramid.label, 'TRANSAMERICA PYRAMID', '260 M · 1972')],
    golden: () => [L(M.gg.label, 'GOLDEN GATE BRIDGE', '1937 · 1,280 M SPAN')],
    japan: () => [L(M.bay.label, 'BAY BRIDGE'), L(M.alcatraz.label, 'ALCATRAZ', null, { side: 'r' })],
    empty: () => [L(eqG(360, 12, 10), 'YOUR CAFÉ')],
    cafe: () => [L(eqG(355, 14, 10), 'YOUR CAFÉ')],
    jolt10: () => [L(M.salesforce.label, 'SALESFORCE TOWER', '326 M')],
    crackSF: () => [L([-1434, 30, -166], 'THE CRACK', `${Math.round(eqCrackW(s))} M WIDE`)],
    ruins: () => [L(M.sutro.label, 'SUTRO TOWER', '298 M')],
    melt: () => [L([-1100, 40, -260], 'THE CRACK', 'MOLTEN ROCK')],
  };
  const f = T[mode];
  return f ? f() : [];
}
