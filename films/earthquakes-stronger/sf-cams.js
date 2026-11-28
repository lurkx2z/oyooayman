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
    openSF: () => air({ p: eqPush([-200, 520, -1650], [-260, 470, -1560], u, 1), at: [-1000, 0, 250], fov: 50, roll: 14 }),
    openFace: () => ({ local: true, p: [-0.05, 1.72, 1.85], at: [0.45, 1.76, 0.8], fov: 38, inside: true, shR: 6, near: 0.03 }),
    // ---- minute one: the café
    cafeWide: () => { const h = head(); return gr({ p: eqPush(eqG(375.3, 3.75, 11.1), eqG(374.8, 3.7, 11.0), u, 3), at: eqV(h, eqG(0, 40, 6), 0.035), fov: 50, shakeK: 0, shC: h }); },
    aerialSF: () => air({ p: eqPush([1650, 190, -1350], [1500, 175, -1250], u, 3), at: [-600, 40, 500], fov: 46 }),
    helipad: () => gr({ p: eqPush(eqG(384.5, 4.6, 124), eqG(384, 4.3, 127), u, 5), at: eqG(380, 2.6, 160), fov: 38, shC: eqG(380, 2, 158), shakeK: 0 }),
    faceFelt: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 0.95, 0.2, 0.02), at: [h[0], h[1] - 0.02, h[2]], fov: 34, shC: h, shR: 6, shakeK: 0.4 }); },
    cupRipple: () => { const c = cupW(); return gr({ p: [c[0] + 0.16, c[1] + 0.2, c[2] + 0.13], at: [c[0], c[1] + 0.05, c[2]], fov: 30, shC: c, shR: 3, near: 0.02, shakeK: 0.2 }); },
    bayView: () => gr({ p: eqG(386, 3.6, 18.5), at: eqG(900, 60, 1500), fov: 50, shakeK: 0.3 }),
    street: () => { const uA = 372 + 6.5 * (s - 25.5); return gr({ p: eqG(368, 2.0, -10.5), at: eqG(MathX.lerp(360, uA, 0.6), 2.6, -32), fov: 46, shC: eqG(370, 2, -25), shakeK: 0.5 }); },
    ruleFace: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 1.1, -0.35, 0.12), at: [h[0], h[1] - 0.06, h[2]], fov: 32, shC: h, shR: 6 }); },
    terraceTop: () => gr({ p: eqPush(eqG(366, 34, 28), eqG(366, 38, 30), u, 9), at: eqG(372, 2.5, 6), fov: 44, shC: eqG(372, 2, 8), shR: 40, shakeK: 0 }),
    clock: () => gr({ p: eqPush(eqG(58, 37, 1.5), eqG(56, 37, 1.5), u, 7), at: eqG(6.2, Y + 50, 6), fov: 17, shC: eqG(0, 50, 6), shR: 20, shakeK: 0.15 }),
    cup: () => { const c = cupW(); return gr({ p: [c[0] - 0.05, c[1] + 0.36, c[2] - 0.0], at: [c[0], c[1] + 0.04, c[2]], fov: 40, near: 0.02, shC: c, shR: 4, shakeK: 0.3 }); },
    cupMacro: () => { const c = cupW(); const k = MathX.smooth(u, 0, 3); return gr({ p: [c[0] + 0.07 - 0.02 * k, c[1] + 0.16 - 0.04 * k, c[2] + 0.06], at: [c[0], c[1] + 0.066, c[2]], fov: 28, near: 0.01, shC: c, shR: 3, shakeK: 0.25 }); },
    terraceRise: () => gr({ p: eqPush(eqG(364, 3.8, 17), eqG(356, 24, 30), u, 5), at: eqPush(eqG(372, 3, 9), eqG(330, 4, -40), u, 5), fov: 48, shC: eqG(372, 2, 6), shR: 50, shakeK: 0.3 }),
    bayView2: () => gr({ p: eqPush(eqG(361.5, 3.3, 14.5), eqG(361.5, 3.4, 15.5), u, 5), at: eqG(1400, 45, 1250), fov: 40, shC: eqG(372, 2, 12), shR: 30, shakeK: 0.3 }),
    calmWide: () => gr({ p: eqPush(eqG(331, 2.0, -41), eqG(336, 2.0, -41), u, 5), at: eqG(372, 4.5, 8), fov: 40, shC: eqG(366, 2, -12), shR: 50, shakeK: 0.2 }),
    // ---- minute two
    jolt4: () => gr({ p: eqG(357.5, 4.3, 18.5), at: eqG(377, 3.0, 8), fov: 50, shC: eqG(372, 2, 10), shakeK: 1.4 }),
    truck: () => gr({ p: eqG(392, 1.35, -29.3), at: eqG(330, 1.9, -36), fov: 44, shC: eqG(370, 2, -30) }),
    locals: () => gr({ p: eqG(365.8, 3.45, 2.2), at: eqG(368.4, 3.15, 4.9), fov: 38, shC: eqG(368, 2, 4.5), shR: 8 }),
    youSide: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 0.7, 1.4, 0.1), at: [h[0], h[1] - 0.08, h[2]], fov: 36, shC: h, shR: 8 }); },
    faultMap: () => ({ p: eqPush([600, 47000, 23000], [500, 44000, 21500], u, 9), at: [200, 0, 2500], fov: 38, near: 200, far: 140000, shR: 0, fog: 0, drift: 0 }),
    drone: () => air({ p: eqPush(eqG(430, 62, 150), eqG(445, 66, 160), u, 8), at: eqG(335, 3, -25), fov: 46, near: 0.5, shR: 140, shC: eqG(360, 2, -20) }),
    birds: () => gr({ p: eqG(377.5, 3.3, 38), at: eqPush(eqG(382, 3.8, 70), eqG(390, 14, 110), u, 3.5), fov: 46, shC: eqG(380, 2, 60), shR: 30, shakeK: 0.4 }),
    pier: () => gr({ p: eqPush(eqG(379.4, 3.7, 17.5), eqG(379.4, 3.6, 20.5), u, 7), at: eqG(380, 3.4, 160), fov: 34, shC: eqG(380, 2, 60), shR: 70, shakeK: 0.4 }),
    pilotWave: () => { const p = set.pilot.headWorld(); return gr({ p: eqG(376.6, 3.3, 141), at: [p.x, p.y - 0.25, p.z], fov: 34, shC: [p.x, p.y, p.z], shR: 12, shakeK: 0.5 }); },
    youSee: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 2.2, 0.6, -0.1), at: [h[0], h[1] - 0.15, h[2]], fov: 40, shC: h, shR: 8, shakeK: 0.7 }); },
    // ---- minute three
    jolt5: () => gr({ p: eqG(363.6, 3.7, 9.2), at: eqG(360.6, 4.6, 10.4), fov: 48, shC: eqG(361, 3, 10), shR: 8, shakeK: 1.1 }),
    everyone: () => gr({ p: eqG(327, 2.3, -1.5), at: eqG(380, 2.8, -8), fov: 48, shC: eqG(350, 2, -6), shR: 40, shakeK: 1.0 }),
    alert: () => gr({ p: eqG(364.6, 3.4, 2.8), at: eqG(368.3, 2.9, 5.0), fov: 40, shC: eqG(368, 2, 4.5), shR: 8, shakeK: 0.9 }),
    phones: () => gr({ p: eqG(402, 3.1, -6.5), at: eqG(350, 2.5, -8), fov: 44, shC: eqG(380, 2, -8), shR: 40, shakeK: 1.0 }),
    lowStreet: () => gr({ p: eqG(371, 2.45, -21), at: eqG(373, 6, -60), fov: 54, shC: eqG(372, 2, -35), shR: 40, shakeK: 1.0 }),
    crowd: () => gr({ p: eqG(371, 2.7, -22.5), at: eqG(372, 3.4, -52), fov: 54, shC: eqG(372, 2, -40), shR: 40, shakeK: 1.0 }),
    drop: () => gr({ p: eqG(378.5, 2.9, 2.3), at: eqG(375, 2.6, 10.5), fov: 50, shC: eqG(376, 2, 9), shR: 14, shakeK: 1.0 }),
    never: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 1.05, 0.15, 0.03), at: [h[0], h[1] - 0.03, h[2]], fov: 34, shC: h, shR: 6, shakeK: 0.6 }); },
    run: () => { const h = head(); return gr({ p: eqAhead(h, yaw, -3.6, 0.6, 0.35), at: eqAhead(h, yaw, 6, 0, -0.5), fov: 52, shC: h, shR: 14, shakeK: 1.0 }); },
    ferry: () => gr({ p: eqPush(eqG(262, 2.1, -8), eqG(254, 2.1, -8), u, 6), at: eqG(0, 48, 6), fov: 24, shC: eqG(0, 40, 6), shR: 60, shakeK: 0.5 }),
    pierRun: () => { const h = head(); return gr({ p: eqAhead(h, yaw, 5.5, 0.4, 0.05), at: [h[0], h[1] - 0.2, h[2]], fov: 44, shC: h, shR: 14, shakeK: 1.0 }); },
    pierTrack: () => { const h = head(), [, hv] = eqUV(h[0], h[2]); return gr({ p: eqG(396, 3.4, hv - 5), at: [h[0], h[1] - 0.3, h[2]], fov: 40, shC: h, shR: 16, shakeK: 1.0 }); },
    pierHeli: () => { const h = head(); return gr({ p: eqG(382.3, 3.5, 150), at: [h[0], h[1] - 0.4, h[2]], fov: 34, shC: eqG(380, 2, 135), shR: 30, shakeK: 1.0 }); },
    // ---- minute four
    jolt6: () => gr({ p: eqG(383.4, 2.7, 134.5), at: eqG(380.1, 2.6, 128.6), fov: 46, shC: eqG(380, 2, 130), shR: 10, shakeK: 1.3 }),
    skyline: () => gr({ p: eqG(385.5, 6.5, 152), at: eqG(220, 55, -320), fov: 46, shC: eqG(380, 2, 140), shR: 60, shakeK: 1.0 }),
    windows: () => gr({ p: eqG(396, 1.9, -31), at: eqG(380, 14, -52), fov: 56, shC: eqG(380, 2, -45), shR: 40, shakeK: 1.0 }),
    chimneys: () => gr({ p: eqG(393, 3.8, -38), at: eqG(377, 21, -62), fov: 48, shC: eqG(380, 2, -55), shR: 40, shakeK: 1.0 }),
    alarms: () => gr({ p: eqG(338, 1.7, -19.5), at: eqG(420, 1.6, -36), fov: 46, shC: eqG(370, 2, -30), shR: 40, shakeK: 1.0 }),
    streetcar: () => gr({ p: eqG(437, 2.1, -15.2), at: eqG(451, 2.3, -27), fov: 48, shC: eqG(450, 2, -26), shR: 20, shakeK: 1.0 }),
    in: () => ({ local: true, p: [3.9, 1.7, 2.6], at: [1.0, 1.25, 0.5], fov: 44, shR: 10, near: 0.05 }),
    start: () => ({ local: true, p: [0.08, 1.88, -0.15], at: [-0.32, 1.38, 1.75], fov: 52, inside: true, shR: 6, near: 0.03 }),
    startTwo: () => gr({ p: eqG(393, 3.6, 146), at: eqG(380, 5, 160), fov: 44, shC: eqG(380, 2, 158), shR: 16, shakeK: 0.8 }),
    fillDia: () => gr({ p: eqG(372, 2.7, -38), at: eqG(372, 2.0, -85), fov: 52, shC: eqG(372, 2, -60), shR: 40, shakeK: 0.9 }),
    mudBoil: () => gr({ p: eqG(344, 3.0, -55), at: eqG(352, 2.3, -64), fov: 46, shC: eqG(350, 2, -60), shR: 20, shakeK: 0.9 }),
    sink: () => gr({ p: eqG(388, 2.75, -31.4), at: eqG(396, 2.0, -38.5), fov: 44, shC: eqG(395, 2, -38), shR: 14, shakeK: 0.9 }),
    cockpitWait: () => ({ local: true, p: [-0.15, 1.72, 1.85], at: [0.45, 1.74, 0.78], fov: 40, inside: true, shR: 6, near: 0.03 }),
    rotorUp: () => gr({ p: eqG(370.5, 2.95, 166.5), at: eqG(380, 5.8, 160), fov: 52, shC: eqG(380, 2, 160), shR: 16, shakeK: 1.0 }),
    // ---- minute five
    jolt7: () => gr({ p: eqG(396, 9.5, 171), at: eqG(370, 9, -60), fov: 50, shC: eqG(380, 2, 60), shR: 120, shakeK: 1.0 }),
    haiti: () => gr({ p: eqG(387, 7.5, 163), at: eqG(150, 40, -260), fov: 44, shC: eqG(380, 2, 140), shR: 80, shakeK: 1.0 }),
    brick: () => gr({ p: eqG(371, 2.3, -6.5), at: eqG(381, 13, -60), fov: 54, shC: eqG(380, 2, -45), shR: 50, shakeK: 1.0 }),
    split: () => gr({ p: eqG(397, 3.3, -29.6), at: eqG(332, 1.4, -30), fov: 50, shC: eqG(375, 2, -30), shR: 40, shakeK: 1.0 }),
    pierBreak: () => ({ local: true, p: [0.2, 1.8, -0.25], at: [0.0, 0.2, 22], fov: 56, inside: true, shR: 60, shC: eqG(380, 2, 120), near: 0.03 }),
    lift: () => { const h = heliP(); return gr({ p: eqG(398, 5.5, 139), at: [h[0], h[1] + 1.8, h[2]], fov: 44, shC: h, shR: 24, shakeK: 0.9 }); },
    sky: () => ({ local: true, p: [-0.1, 1.74, 1.9], at: [0.45, 1.76, 0.78], fov: 38, inside: true, shR: 6, near: 0.03 }),
    skyWide: () => { const h = heliP(); const back = eqWL(380, 0, 900); return air({ p: [h[0] + (back[0] - h[0]) * 0.07, h[1] + 14, h[2] + (back[2] - h[2]) * 0.07], at: [h[0], h[1] - 6, h[2]], fov: 50, near: 0.5, shC: h, shR: 200 }); },
    bayBridge: () => air({ p: eqPush([2650, 115, 160], [2560, 112, 120], u, 5), at: [1650, 62, -620], fov: 44 }),
    bayDrop: () => air({ p: [1990, 82, -600], at: [1822, 52, -815], fov: 40, shR: 300, shC: [1822, 50, -815] }),
    heliOverBay: () => { H.g.updateMatrixWorld(true); const p = H.toWorld(-14, 3, 20), a = H.toWorld(0, 1.5, 0); return air({ p: [p.x, p.y, p.z], at: [a.x, a.y, a.z], fov: 42, near: 0.5, shC: [a.x, a.y, a.z], shR: 60 }); },
    downtown: () => air({ p: eqPush([620, 330, -1120], [570, 318, -1060], u, 6), at: [-700, 60, 300], fov: 44 }),
    // ---- minute six
    jolt8: () => air({ p: eqG(260, 88, 270), at: eqG(0, 36, 6), fov: 40, shC: eqG(0, 10, 0), shR: 200 }),
    y1906: () => air({ p: eqPush([760, 255, -260], [700, 250, -200], u, 7), at: [-600, 40, 500], fov: 42 }),
    fires: () => air({ p: [300, 390, -1300], at: [-1500, 40, 1500], fov: 50 }),
    wideCity: () => air({ p: eqPush([-200, 900, -3200], [-300, 880, -3100], u, 8), at: [-1500, 0, 1500], fov: 46 }),
    pyramid: () => air({ p: eqPush([-300, 170, -430], [-330, 165, -400], u, 9), at: [-801, 150, 33], fov: 36, shC: [-801, 100, 33], shR: 300 }),
    pyramidFall: () => air({ p: eqPush([-560, 120, -250], [-575, 118, -235], u, 6), at: [-801, 165, 33], fov: 42, shC: [-801, 100, 33], shR: 300 }),
    golden: () => air({ p: eqPush([-4700, 230, -2700], [-4800, 225, -2690], u, 5), at: [-7450, 95, -2370], fov: 30, fxRange: 4000 }),
    ggFall: () => air({ p: [-6250, 125, -2520], at: [-7450, 55, -2370], fov: 38, shC: [-7450, 40, -2370], shR: 900 }),
    phoneLap: () => ({ local: true, p: [0.32, 1.98, 0.52], at: [0.45, 1.36, 0.98], fov: 40, inside: true, shR: 6, near: 0.03 }),
    // ---- minute seven
    jolt9: () => air({ p: [-400, 720, -2650], at: [-1500, 0, 1200], fov: 50 }),
    japan: () => air({ p: eqPush([1950, 210, 330], [1900, 205, 300], u, 5), at: [1300, 40, -320], fov: 46 }),
    tsarBg: () => air({ p: [500, 520, -1500], at: [-900, 0, 900], fov: 48 }),
    calm: () => ({ local: true, p: [-0.62, 1.82, 1.95], at: [0.45, 1.74, 0.8], fov: 42, inside: true, shR: 6, near: 0.03 }),
    empty: () => air({ p: eqPush(eqG(380, 210, 900), eqG(380, 200, 860), u, 10), at: eqG(300, 0, 60), fov: 46 }),
    drained: () => air({ p: eqPush(eqG(720, 70, 560), eqG(690, 64, 530), u, 6), at: eqG(380, -6, 110), fov: 46, shC: eqG(400, 0, 200), shR: 400 }),
    back: () => air({ p: eqG(1200, 150, 1450), at: eqG(300, 0, 280), fov: 48 }),
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
    air: () => ({ local: true, p: [-0.62, 1.86, 1.92], at: [0.45, 1.72, 0.8], fov: 44, inside: true, shR: 6, near: 0.03 }),
    fuel: () => ({ local: true, p: [0.36, 1.82, 0.42], at: [-0.3, 1.45, 1.72], fov: 40, inside: true, shR: 6, near: 0.03 }),
    nowhere: () => { const h = heliP(); return air({ p: [h[0] + 600, h[1] + 260, h[2] - 700], at: [h[0] - 700, h[1] - 380, h[2] + 1900], fov: 54 }); },
    below: () => ({ local: true, p: [0.62, 1.78, 1.05], at: [7, -5, 5.5], fov: 52, inside: true, shR: 6, near: 0.03 }),
    // ---- minute ten
    melt: () => air({ p: eqPush([-720, 230, -720], [-760, 220, -690], u, 7), at: [-920, 0, -150], fov: 48 }),
    last: () => ({ local: true, p: [-0.05, 1.71, 1.95], at: [0.45, 1.76, 0.78], fov: 40, inside: true, shR: 6, near: 0.03 }),
    question: () => ({ local: true, p: [0.14, 1.76, 1.56], at: [0.45, 1.77, 0.78], fov: 32, inside: true, shR: 6, near: 0.03 }),
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
    cafeWide: () => [L(M.ferry.top, 'FERRY BUILDING', 'BUILT 1898'), L(head(), 'YOU', null, { you: true })],
    aerialSF: () => [L([-700, 260, 450], 'SAN FRANCISCO'), L(M.bay.label, 'BAY BRIDGE', '1936')],
    helipad: () => [L(heliTop(), 'YOUR HELICOPTER', 'TOUR OF THE BAY')],
    faultMap: () => { const sa = eqLL(37.66, -122.53), hw = eqLL(37.79, -122.19); return [L([sa[0], 600, sa[1]], 'SAN ANDREAS FAULT'), L([hw[0], 600, hw[1]], 'HAYWARD FAULT', null, { side: 'r' }), L(eqG(372, 400, 10), 'YOU', null, { you: true })]; },
    pier: () => [L(heliTop(), 'YOUR HELICOPTER', 'TOUR LEAVES AT 10:00')],
    ferry: () => [L(M.ferry.top, 'FERRY BUILDING', 'SURVIVED 1906')],
    skyline: () => [L(M.salesforce.label, 'SALESFORCE TOWER', '326 M · TALLEST IN THE CITY')],
    streetcar: () => [L(eqG(447, 5.2, -25), 'F-LINE STREETCAR', 'VINTAGE CARS, STILL RUNNING')],
    haiti: () => [L(M.pyramid.label, 'TRANSAMERICA PYRAMID', '260 M')],
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
