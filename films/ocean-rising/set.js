/* =====================================================================
   SET — Harrow Rock (everything but Isla's hill): the sky, the sea, the far coast, the bell buoy, the island, the
   light station, your boat, you (and your hands, your phone, your torch). frame(t, shot) is a pure function of the
   story time s (clock.js) and the film time t: the sea's height, the Sun, the Moon, the lamp, the lights, the
   water inside, where you are, the shot's camera (set.cams[mode]).
   Coordinates: x east, y up (0 = high water at 6:42 PM), z south; the tower at the origin (layout.js).
   ===================================================================== */

// where you are at story time s (outside the POV shots): [x, y | null (on the ground), z, yaw, pose(u)]
const OC_YOU = (() => {
  const P = OCP, T = OC_F.tower;
  // the path from the rocks by the landing up to the tower's door (x, z), and how far along it you are
  const path = [[-61.0, 6.8], [-58, 7.0], [-49, 8.6], [-39, 10.0], [-29, 10.7], [-19, 10.6], [-12.6, 8.0], [-11.2, 4.4], [-8.0, 1.6], [-5.2, 0.25]];
  const lens = [0]; for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const along = (d) => { d = MathX.clamp(d, 0, lens[lens.length - 1]); let i = 1; while (i < lens.length - 1 && lens[i] < d) i++; const u = (d - lens[i - 1]) / (lens[i] - lens[i - 1]), a = path[i - 1], b = path[i]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[0] - a[0], b[1] - a[1])]; };
  const jog0 = 98, jog1 = 124, total = lens[lens.length - 1];
  return (s) => {
    if (s < 40) return [-69.6, 1.2, 4.7, -Math.PI / 2 - 0.25, (u) => (s < 20 ? OC_P.stand(u) : OC_P.lookDown(u))];
    if (s < 62) return [-73.25, 1.2, 4.25, -Math.PI / 2, (u) => OC_P.kneelLine(u)];
    if (s < 70) { const k = (s - 62) / 8; return [ocLerp(-73.0, -61.5, k), null, ocLerp(4.4, 6.8, k), Math.PI / 2 - 0.2, (u) => OC_P.walk(u * 7.5)]; }
    if (s < jog0) return [-61.0, null, 6.8, -Math.PI / 2 + 0.15, (u) => OC_P.lookDown(u)];
    if (s < jog1) { const [x, z, yaw] = along((s - jog0) / (jog1 - jog0) * total); return [x, null, z, yaw, (u) => OC_P.jog(u * 9.5)]; }
    if (s < 300) return [-5.6, null, 0.9, Math.PI / 2 + 0.35, (u) => OC_P.lookUp(u)];
    // the gallery (from the town's beat): at the rail, facing the coast
    if (s < 2705) return [-2.15, T.top, -2.15, -Math.PI * 0.75, (u) => OC_P.rail(u)];
    // the lantern's roof
    return [-0.05, T.eave + (1 - 0.95 / (T.lanternR + 0.2)) * (T.dome - T.eave) + 0.02, 0.95, Math.PI, (u) => OC_P.cling(u)];
  };
})();

OC_SETS.rock = (app) => {
  const T = OC_F.tower, E = OCE, P = OCP, H = OC_F.house;
  const o = ocSet(app, { sky: '#000000', fog: 0.00003, fogColor: '#8a90a0', fov: 40, near: 0.05, far: 90000, hemi: ['#9ab0d0', '#26343a', 0.6],
    sun: [100, 30, -10], sunColor: '#ffd2a0', sunI: 2.4, shadow: 2048, shadowR: 40, shadowFar: 1200 });
  const { scene, camera, sun, hemi } = o;
  const set = { scene, camera, sun, hemi, _s: 0, labels: [] };
  scene.environment = ocEnv(app.renderer, '#5a6f96', '#c9a58a', '#1e2a30');
  const airFog = scene.fog, seaFog = new THREE.FogExp2('#06262c', 0.09);
  // ---- the world
  const sky = ocSky(scene), isl = ocIsland(scene), sea = ocSea(scene, isl.terr), coast = ocCoast(scene, sky), buoy = ocBuoy(scene);
  // (the sea knows where the shore boulders are: clear shallow water over them, a swash line round them)
  isl.boulders.forEach((b, i) => { const [x, z, r, sy] = isl.boulderDims[i]; sea.U.uBld.value[i].set(x, z, r * 1.05, b.position.y); sea.U.uBldS.value[i] = sy; });
  const tower = ocTower(scene), house = ocHouse(scene), fogH = ocFogHouse(scene); ocOilHouse(scene, isl.hAt);
  const boat = ocBoat(scene);
  Object.assign(set, { sky, isl, sea, coast, buoy, tower, house, fogH, boat });
  // ---- you: the body (seen from outside), the hands (your view), the phone, the torch
  const you = ocPerson('ocKeeper', scene, { id: 'k' }); ocFace(you, { seed: 21, iris: [96, 112, 120], jaw: 0.3, stubble: true, brow: '#8a8078', lip: '#9a6a5e' });
  const hands = new ViewerHands(camera, { script: OC_HANDS, poses: OC_HAND_POSES, blends: OC_HAND_BLEND, skin: '#d0a083', sleeve: '#d9a91c', cuff: '#2a3346', watch: true, sleeveLen: 0.8 });
  const phone = ocPhone(hands.right.g); phone.g.position.set(0.034, 0.074, 0.024); phone.g.rotation.set(0, 0, -Math.PI / 2);
  const torch = ocTorch(hands);
  const torchL = new THREE.SpotLight('#fff1d8', 0, 45, 0.6, 0.95, 1.3); torchL.castShadow = false; camera.add(torchL); camera.add(torchL.target); torchL.position.set(0.1, -0.15, -0.62); torchL.target.position.set(0.04, -0.5, -6);
  const moonL = new THREE.DirectionalLight('#aebcdc', 0); moonL.castShadow = false; scene.add(moonL); scene.add(moonL.target);
  Object.assign(set, { you, hands, phone, torch });
  // ---- particles: spray, foam, bubbles (soft); sparks (added)
  const puffs = ocPuffs(scene, 6000, { soft: 1.4 }), adds = ocPuffs(scene, 600, { additive: true, soft: 0.9 });
  // ---- the water through the tower's door: sheets through its four seams, then the whole doorway
  const seamJets = [0, 1, 2, 3].map(() => ocJet(scene, { segs: 30 })), burstJet = ocJet(scene, { segs: 60 });

  // ---- the cameras ----------------------------------------------------------------------------------------------
  // cam(p, at, fov, o): o = { near, focus, R (the shadow box's radius), roll }
  const cam = (p, at, fov, q = {}) => { ocCam(camera, p, at, fov, q.roll || 0); camera.near = q.near ?? 0.05; camera.updateProjectionMatrix(); set._focus = q.focus || at; set._shR = q.R || 40; };
  const dr = (t, a, rate = 0.3, seed = 1) => ocDrift(t, a, rate, seed);
  const h0 = (s) => P.h(s);
  const head = () => { you.root.updateMatrixWorld(true); const v = new THREE.Vector3(); you.j.head.getWorldPosition(v); return [v.x, v.y, v.z]; };
  const Bt = OC_F.boat, R = OC_F.ring, L = OC_F.landing;
  const eye = 1.63, galEye = [-2.25, T.top + eye, -2.0];
  const azAt = (p, az, el, d = 100) => { const [x, z] = ocAzXZ(az), e = el * Math.PI / 180; return [p[0] + x * Math.cos(e) * d, p[1] + Math.sin(e) * d, p[2] + z * Math.cos(e) * d]; };
  set.cams = {
    // low over the water off the landing: the steps awash, the boat, the rock in the low sun, the tower
    title: (t, s, k) => { const d = dr(t, 0.05, 0.3, 1), u = MathX.smooth(k, 0, 1.4); cam([-158 + 62 * u + d[0], 2.3 - 0.4 * u + d[1], 27 - 11 * u + d[2]], [-22, 13 - 2 * u, -2], 40, { near: 0.2, focus: [-50, 8, 4], R: 70 }); },
    // a drone off the west, low: the whole rock, the tower, the sunset behind you
    aerial: (t, s, k) => { cam([-230 + 25 * k, 38 - 3 * k, 62 - 12 * k], [-5, 12, -4], 34, { near: 0.5, focus: [-25, 8, 0], R: 70 }); },
    // the tide board on the landing's north face: the water at 3.4, climbing past it
    tide: (t, s, k) => { const d = dr(t, 0.008, 0.3, 2), y = h0(s), B = OC_F.tideBoard; cam([B[0] - 0.95 + d[0], y + 1.1 + d[1], B[1] - 3.0 + d[2]], [B[0], y + 0.3, B[1]], 26, { near: 0.05, focus: [B[0], 0, B[1]], R: 8 }); },
    // you on the landing, looking down at the boat
    keeper: (t, s, k) => { const d = dr(t, 0.02, 0.3, 3); cam([-79.5 + d[0], 2.6 + d[1], 11.5 - 0.6 * k], [-70.5, 1.9, 4.6], 30, { near: 0.1, focus: [-72, 1, 5], R: 10 }); },
    // the bow line at the ring: taut
    rope: (t, s, k) => { const d = dr(t, 0.006, 0.3, 4); cam([R[0] - 3.3 + d[0], 1.75 + d[1], R[2] - 2.3 + d[2]], [R[0] - 0.5, R[1] - 0.1, R[2] + 0.1], 36, { near: 0.03, focus: [R[0], R[1], R[2]], R: 5 }); },
    // the bow held down, the sea pouring in; you on your knees at the edge
    bow: (t, s, k) => { const d = dr(t, 0.02, 0.3, 5); cam([-79.2 + d[0], 2.1 + d[1], 1.0 + d[2]], [-74.8, 0.85, 5.2], 38, { near: 0.05, focus: [-74.5, 1, 5], R: 9 }); },
    // the stern going under; the line down into the water from the ring; you on the rocks behind
    sunk: (t, s, k) => { const d = dr(t, 0.02, 0.3, 6), y = h0(s); cam([-80.2 + d[0], y + 1.25 + d[1], 9.6 + d[2]], [-74.8, y - 0.9, 4.9], 30, { near: 0.1, focus: [-74.5, 0, 5], R: 8 }); },
    // high over the sea to the east, looking back west past the rock to the sunset: all of it is rising
    ocean: (t, s, k) => { cam([330 - 30 * k, 260 - 15 * k, -150 + 10 * k], [-120, 0, 30], 44, { near: 2, focus: [-20, 5, 0], R: 90 }); },
    // a few metres over the swell, looking west into the afterglow
    horizon: (t, s, k) => { const y = h0(s) + 3.4 + 0.25 * Math.sin(t * 0.5); cam([-150 - 6 * k, y, 30], [-1100, y + 10, -60], 50, { near: 0.5, focus: [-60, 4, 0], R: 60 }); },
    // the path: you running up it from the landing
    path: (t, s, k) => { const q = OC_YOU(s), hy = isl.hAt(q[0], q[2]); const d = dr(t, 0.03, 0.3, 7); cam([q[0] + 6.5 + d[0], hy + 3.2 + d[1], q[2] + 11 + d[2]], [q[0] - 0.5, hy + 1.0, q[2] - 0.5], 40, { near: 0.1, focus: [q[0], hy, q[2]], R: 18 }); },
    // the tower from its foot, up into the dusk: the lamp 47 m over the sea
    towerUp: (t, s, k) => { const d = dr(t, 0.02, 0.3, 8); cam([-7.4 + d[0], 15.7 + d[1], 5.4], [0.3, 40 + 4 * k, -0.3], 56, { near: 0.1, focus: [-3, 25, 0], R: 30 }); },
    // you at the tower's door, looking up
    keeperUp: (t, s, k) => { const d = dr(t, 0.015, 0.3, 9); cam([-10.6 + d[0], 16.9 + d[1], -3.8 + 0.3 * k], [-5.4, 17.0, 0.6], 34, { near: 0.1, focus: [-5.5, 16, 0.8], R: 10 }); },
    // the orange lichen on the boulder by the shore, the sea over it
    lichen: (t, s, k) => { const b = isl.lichenRock, d = dr(t, 0.006, 0.3, 10), y = h0(s); cam([b[0] - 6.3 + 0.4 * k + d[0], y + 1.4 + d[1], b[1] - 1.0], [b[0] - 0.5, y - 0.15, b[1] + 0.2], 27, { near: 0.05, focus: [b[0], y, b[1]], R: 6 }); },
    // your phone (you, by the house, facing the mainland)
    phone: (t, s, k) => { const p = [-61.0, isl.hAt(-61.0, 6.8) + eye, 6.8]; cam(p, azAt(p, 296, -24), 44, { near: 0.02, focus: [-64, 1, 5], R: 20 }); },
    phoneType: (t, s, k) => { const p = [-61.0, isl.hAt(-61.0, 6.8) + eye, 6.8]; cam(p, azAt(p, 298, -27), 44, { near: 0.02, focus: [-64, 1, 5], R: 20 }); },
    phoneMid: (t, s, k) => { const p = [-12.4, 13.0 + eye, 6.2]; cam(p, azAt(p, 302, -26), 44, { near: 0.02, focus: [-14, 13, 3], R: 20 }); },
    // the coastguard radio in the kitchen, by the north window
    radio: (t, s, k) => { const d = dr(t, 0.004, 0.3, 11); cam([-22.62 + d[0], 14.36 + d[1], 1.72 - 0.08 * k], [-23.12, 14.06, 0.9], 34, { near: 0.02, focus: [-23, 14, 1], R: 6 }); },
    // out of the kitchen window: the sea on the rocks below the house
    window: (t, s, k) => { const d = dr(t, 0.008, 0.3, 12); cam([-23.0 + d[0], 14.75 + d[1], 1.9], [-24.5 - 3 * k, 9.0, -24], 46, { near: 0.03, focus: [-24, 9, -14], R: 24 }); },
    // the bell buoy, 320 m out to the east, under the rising Moon (a long lens from the rock)
    buoy: (t, s, k) => { const p = [18, 12.9, 2]; cam(p, azAt(p, 94.2 + 0.05 * k, -0.45), 3.6, { near: 2, focus: [20, 10, 2], R: 30 }); },
    // binoculars: the town, 22 km away (its waterfront's lights going out)
    binocs: (t, s, k) => { const p = [-21.5, 13.0 + eye + 1.4, -1.6], d = dr(t, 0.0008, 1.4, 13); const at = azAt(p, 313.4 + d[0] * 40, -0.02 + d[1] * 30, 1000); cam(p, at, 3.4, { near: 1, focus: [-20, 13, 0], R: 20 }); },
    // the path running down into the sea at 10 m
    tenM: (t, s, k) => { const d = dr(t, 0.02, 0.3, 14); cam([-22.5 + d[0], 15.6 + d[1], 15.5 - 0.6 * k], [-40, 8.6, 9.5], 40, { near: 0.1, focus: [-33, 10, 11], R: 16 }); },
    // the fog signal house on the east cliff, the sea round it
    fogHouse: (t, s, k) => { const d = dr(t, 0.02, 0.3, 15); cam([7.5 + d[0], 15.2 + d[1], -21 + 0.8 * k], [22, 11.6, -9], 38, { near: 0.1, focus: [22, 11, -9], R: 14 }); },
    // its horn, from the sea side: its last blast
    horn: (t, s, k) => { const d = dr(t, 0.01, 0.3, 16), y = Math.max(h0(s) + 1.2, 12.3); cam([30.5 + d[0], y + d[1], -4.0], [25.6, 12.45, -9.0], 32, { near: 0.05, focus: [25, 12, -9], R: 8 }); },
    // the kitchen floor at the front door: the sea coming in under it
    doorSeep: (t, s, k) => { const d = dr(t, 0.004, 0.3, 17); cam([-18.9 + d[0], 13.16 + d[1], 5.3], [-15.1, 13.18, 4.3], 46, { near: 0.02, focus: [-16, 13, 4.5], R: 6 }); },
    // the kitchen, knee-deep: the chairs afloat, the lamp still on
    kitchen: (t, s, k) => { const d = dr(t, 0.008, 0.3, 18), w = P.houseWater(s); cam([-24.1 + d[0], w + 0.32 + d[1], 7.3], [-16.5, w + 0.12, 3.0], 56, { near: 0.02, focus: [-20, 13, 4], R: 8 }); },
    // the island gone: the tower and the house's roof in the sea at dusk
    aerialSea: (t, s, k) => { cam([-150 + 15 * k, 62 - 4 * k, 120 - 10 * k], [-8, 14, -2], 36, { near: 1, focus: [-12, 15, 2], R: 50 }); },
    // low: the swell breaking over the drowned rock round the tower's foot
    breakers: (t, s, k) => { const y = h0(s); cam([-24 + 2 * k, y + 1.6, -20 + k], [-2, y + 2.2, 0], 40, { near: 0.1, focus: [-6, y, -4], R: 22 }); },
    // you, at the door inside: shoving it shut, the bolts across
    bolt: (t, s, k) => { const p = [-1.95, T.sill + eye, 0.12]; cam(p, [-3.9, T.sill + 1.05, 0.0], 50, { near: 0.02, focus: [-3, 16, 0], R: 6 }); },
    // the door from the stairs: the sea 4 m over it, the jets through its seams
    strain: (t, s, k) => { const d = dr(t, 0.008, 0.3, 19); cam([-0.3 + d[0], T.sill + 2.1 + d[1], 0.85], [-3.9, T.sill + 0.95, -0.05], 42, { near: 0.02, focus: [-3, 16, 0], R: 6 }); },
    // it gives: from higher on the stairs
    burst: (t, s, k) => { const d = dr(t, 0.02 + 0.03 * MathX.smooth(s, E.burst, E.burst + 0.5), 1.2, 20); cam([0.55 + d[0], T.sill + 6.6 + d[1], -1.25], [-3.4, T.sill + 0.6, 0.25], 50, { near: 0.02, focus: [-2, 16, 0], R: 8 }); },
    // the power room under water, in the dark (your torch)
    powerRoom: (t, s, k) => { const a = tower.stepA(34), r = 1.75, p = [Math.cos(a) * r, tower.stepY(34) + eye, Math.sin(a) * r]; cam(p, [T.inner - 0.3, P.towerWater(s) - 0.3, -0.4], 56, { near: 0.02, focus: [1.5, 16, 0], R: 6 }); },
    // outside: the tower in the sea, dark but for its lamp
    towerOut: (t, s, k) => { const y = h0(s); cam([-95 + 6 * k, y + 2.5, 58], [0, 30, 0], 34, { near: 0.3, focus: [0, 25, 0], R: 40 }); },
    // you on the stairs, looking down the well at the water coming up behind you
    stairsDown: (t, s, k) => { const st = (P.towerWater(s) - T.sill) / T.rise + 22, a = tower.stepA(st), r = 1.8, p = [Math.cos(a) * r, tower.stepY(st) + eye, Math.sin(a) * r]; cam(p, [Math.cos(a - 0.9) * 0.4, P.towerWater(s) - 0.5, Math.sin(a - 0.9) * 0.4], 64, { near: 0.02, focus: [0, p[1], 0], R: 8 }); },
    // climbing: the steps winding up into the dark in your torch's beam
    climb: (t, s, k) => { const st = (P.towerWater(s) - T.sill) / T.rise + 26 + 3.2 * (t - ocShotAt(t).t0), a = tower.stepA(st), r = 1.85, p = [Math.cos(a) * r, tower.stepY(st) + eye - 0.04 * Math.abs(Math.sin(t * 5.5)), Math.sin(a) * r];
      cam(p, [Math.cos(a + 0.75) * 1.85, p[1] + 1.25, Math.sin(a + 0.75) * 1.85], 62, { near: 0.02, focus: [0, p[1], 0], R: 8 }); },
    // your phone on the gallery: her text
    phoneTown: (t, s, k) => { cam(galEye, azAt(galEye, 312, -24), 44, { near: 0.02, focus: [0, 45, 0], R: 10 }); },
    // the town from the gallery, a long lens: every light in it goes out
    coastOut: (t, s, k) => { const d = dr(t, 0.0006, 1.2, 21); cam(galEye, azAt(galEye, 313.4 + d[0] * 30, -0.1 + d[1] * 20, 1000), 3.4, { near: 2, focus: [0, 45, 0], R: 10 }); },
    // up the coast: Owl Point's light, then dark
    owlPoint: (t, s, k) => { cam(galEye, azAt(galEye, 334 + 2 * k, -0.25, 1000), 11, { near: 2, focus: [0, 45, 0], R: 10 }); },
    // from the sea: yours, the one light left
    lastLight: (t, s, k) => { const y = h0(s); cam([-240 + 20 * k, y + 7, 150 - 10 * k], [0, 38, 0], 30, { near: 0.5, focus: [0, 38, 0], R: 30 }); },
    // a ship far out, lit, riding it out
    ship: (t, s, k) => { const sh = coast.shipAt(s), d = dr(t, 0.0006, 1.2, 22); cam(galEye, [sh[0] + d[0] * 900, sh[1] - 150 + d[1] * 300, sh[2]], 4.6, { near: 2, focus: [0, 45, 0], R: 10 }); },
    // from just over the water by the tower: your boat is down there (the diagram)
    section: (t, s, k) => { const y = h0(s); cam([-40 + 3 * k, y + 1.4, 26], [0, y + 7, 0], 42, { near: 0.1, focus: [0, y + 5, 0], R: 30 }); },
    // a drone at night: the tower alone on the sea, the Moon
    night: (t, s, k) => { cam([-250 + 20 * k, 72, 34], [0, 36, -12], 32, { near: 1, focus: [0, 36, 0], R: 40 }); },
    // over the gallery's rail, down at the sea on the tower's flank
    gallerySea: (t, s, k) => { const d = dr(t, 0.01, 0.3, 23); cam([-3.05 + d[0], T.top + eye + d[1], 1.25], [-6.2, h0(s) + 0.4, 3.6], 60, { near: 0.03, focus: [-4, 40, 2], R: 14 }); },
    phoneHill: (t, s, k) => { cam(galEye, azAt(galEye, 316, -22), 44, { near: 0.02, focus: [0, 45, 0], R: 10 }); },
    phoneLie: (t, s, k) => { const p = [-2.3, T.top + eye, 1.9]; cam(p, azAt(p, 250, -38), 46, { near: 0.02, focus: [0, 45, 0], R: 10 }); },
    // the watch room's radio: you call the ship (your torch on it)
    watchRadio: (t, s, k) => { const d = dr(t, 0.004, 0.3, 27); cam([-0.55 + d[0], T.watch + 1.5 + d[1], 0.85 + 0.1 * k], [0.15, T.watch + 0.86, T.inner - 0.32], 44, { near: 0.02, focus: [0, 43, 1], R: 5 }); },
    // the watch room: the sea coming up through the floor
    watchFlood: (t, s, k) => { const d = dr(t, 0.006, 0.3, 24); cam([-1.35 + d[0], T.watch + 1.5 + d[1], 1.35], [0.9, T.watch + 0.1, -1.0], 60, { near: 0.02, focus: [0, 43, 0], R: 6 }); },
    // up the ladder into the lantern: the lens over you
    ladder: (t, s, k) => { const p = [0.95, T.watch + 1.0 + 0.7 * k, 0.5]; cam(p, [0.95, T.top + 0.6, -0.05], 64, { near: 0.02, focus: [0, 46, 0], R: 6 }); },
    // the gallery awash: the lantern standing on the open sea; you at the rail
    gallery: (t, s, k) => { const y = h0(s); cam([-21 + 2 * k, y + 1.1, 11], [0, T.lamp - 0.4, 0], 34, { near: 0.1, focus: [0, 46, 0], R: 10 }); },
    // inside the lantern: the sea climbing the glass, then the lens
    lens: (t, s, k) => { const d = dr(t, 0.005, 0.3, 25); cam([1.15 + d[0], T.lamp + 1.25 + d[1], 0.75], [-0.1, T.lamp - 0.25, -0.1], 60, { near: 0.02, focus: [0, 47, 0], R: 5 }); },
    // from over the sea: the lamp still turning, under it
    underBeam: (t, s, k) => { const y = h0(s); cam([-30 + 4 * k, y + 19, 26], [0, y - 1, 0], 46, { near: 0.2, focus: [0, y, 0], R: 20 }); },
    // you on the lantern's roof, holding on; the sea at your boots
    roof: (t, s, k) => { const y = h0(s), d = dr(t, 0.01, 0.3, 26); cam([-5.6 + d[0], y + 1.05 + d[1], 3.6], [0, y + 0.85, 0.5], 34, { near: 0.05, focus: [0, y, 0], R: 6 }); },
    phoneLow: (t, s, k) => { const q = OC_YOU(s), p = [q[0] + 0.02, q[1] + 1.45, q[2] + 0.12]; cam(p, azAt(p, 120, -28), 46, { near: 0.02, focus: [0, 49, 0], R: 6 }); },
    // the question: a figure on a roof in the open sea, the light under it
    question: (t, s, k) => { const y = h0(s); cam([-46 + 4 * k, y + 6.5 - 0.5 * k, 34 - 3 * k], [0, y + 0.9, 0], 28, { near: 0.2, focus: [0, y, 0], R: 12 }); },
  };
  // the modes that are your own view (your hands, no body), and the ones under water
  const POV = new Set(Object.keys(OC_POV));
  set.pov = POV;

  // ---- frame --------------------------------------------------------------------------------------------------
  const _L = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  set.frame = (t, shot) => {
    const s = ocStoryAt(t), m = shot.mode, k = (t - shot.t0) / Math.max(1e-6, shot.t1 - shot.t0), h = P.h(s);
    set._s = s; set._mode = m;
    const pov = POV.has(m);
    // ---- you
    { const q = OC_YOU(s), pose = q[4](t); you.root.visible = !pov && !['tide', 'rope', 'lichen', 'buoy', 'binocs', 'radio', 'window', 'doorSeep', 'kitchen', 'horn', 'fogHouse', 'tenM', 'strain', 'burst', 'towerOut', 'coastOut', 'owlPoint', 'ship', 'lens', 'watchFlood'].includes(m);
      if (you.root.visible) { ocPlace(you, pose, q[0], q[1] == null ? isl.hAt(q[0], q[2]) : q[1], q[2], q[3]); ocFaceSet(you, t, { worry: 0.3 + 0.5 * MathX.smooth(s, 30, 600), frown: 0.3 }); } }
    hands.update(t); hands.root.visible = pov;
    const usePhone = ['phone', 'phoneType', 'phoneMid', 'phoneTown', 'phoneHill', 'phoneLie', 'phoneLow'].includes(m);
    phone.g.visible = usePhone; torch.g.visible = ['powerRoom', 'stairsDown', 'climb', 'watchRadio'].includes(m);
    (set.cams[m] || set.cams.title)(t, s, k);
    camera.updateMatrixWorld(true);
    const under = camera.position.y < h + ocSwellY(camera.position.x, camera.position.z, t) * 0.6 - 0.05 && Math.hypot(camera.position.x, camera.position.z) > T.inner;
    set._under = under;
    // ---- sky, sea, the far coast, the buoy
    const sk = sky.set(s, camera), sunA = sk.alt, skyK = ocSkyK(sunA), dark = 1 - skyK;
    sky.U.uUnder.value = under ? 1 : 0;
    sea.set(s, t, camera, sky);
    // (the sea's hole for the tower: its shaft while the tower stands out of it; just the lantern once it is over the gallery)
    sea.U.uTowerR.value = h < T.top - 0.3 ? T.inner + 0.05 : h < T.eave - 0.05 ? T.lanternR + 0.02 : 0;
    sea.U.uLampUnder.value = h > T.lamp - 0.05 ? 1 : 0; sea.U.uBeam.value = -tower.beamAng(s);
    coast.set(s, t, camera, { renderH: app.renderH, ship: s > ocSC('ship', 0) - 1 && ['ship', 'section', 'night', 'gallerySea', 'roof', 'underBeam', 'question'].includes(m) });
    buoy.set(s, t); isl.set(s); boat.set(s, t);
    // ---- the station
    tower.set(s, t, camera, { glare: !['ladder', 'lens'].includes(m) });
    house.set(s, t); fogH.set(s, t);
    // ---- the light: the Sun (until it has set), then the Moon; the sky's own light; the lamp; your torch
    const sunK = ocSunK(sunA), mo = sk.moon, moonK = ocMoonK(s);
    const keyMoon = s > 380;
    const L0 = keyMoon ? mo.v : sk.sun.v;
    sun.intensity = keyMoon ? 0.9 * moonK : 3.0 * sunK; sun.color.set(keyMoon ? '#b4c0dc' : '#ffcf9a');
    if (keyMoon) sun.color.setRGB(0.72 + 0.25 * (1 - MathX.smooth(mo.alt, 3, 14)), 0.78, 0.92 - 0.25 * (1 - MathX.smooth(mo.alt, 3, 14)));
    hemi.color.copy(sk.zen).lerp(sk.hor, 0.35).multiplyScalar(1.0); hemi.groundColor.setRGB(0.05, 0.08, 0.09); hemi.intensity = 0.06 + 1.2 * skyK + 0.25 * moonK;
    scene.environmentIntensity = 0.06 + 0.9 * skyK + 0.1 * moonK;
    // the shadow box: centred on the shot's focus, snapped to whole texels so it doesn't crawl
    { const Rr = set._shR || 40, f = set._focus || [0, 10, 0]; _L.set(L0[0], Math.max(0.03, L0[1]), L0[2]).normalize(); const upv = Math.abs(_L.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : _up;
      const rt = new THREE.Vector3().crossVectors(upv, _L).normalize(), u2 = new THREE.Vector3().crossVectors(_L, rt), tx = (2 * Rr) / 2048, P0 = new THREE.Vector3(...f);
      const a1 = Math.round(P0.dot(rt) / tx) * tx, a2 = Math.round(P0.dot(u2) / tx) * tx, a3 = P0.dot(_L), C = rt.clone().multiplyScalar(a1).add(u2.clone().multiplyScalar(a2)).add(_L.clone().multiplyScalar(a3));
      const sc = sun.shadow.camera; if (sc.right !== Rr) { sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.far = 1200; sc.updateProjectionMatrix(); }
      sun.position.copy(C).addScaledVector(_L, 500); sun.target.position.copy(C); sun.target.updateMatrixWorld(); }
    // your torch: on once the lights have gone, in the tower
    torchL.intensity = s > E.dark ? ({ powerRoom: 10, stairsDown: 5, climb: 9, watchFlood: 4, watchRadio: 3 })[m] || 0 : 0; torch.lensM.color.set(s > E.dark ? '#fff6e0' : '#444');
    phone.set(ocPhoneState(s, { light: dark, lowBat: m === 'phoneLow' && k > 0.62 }));
    // ---- fog: a thin haze over the sea; under the water, the water's own green
    if (under) { scene.fog = seaFog; const lk = 0.3 + 0.7 * skyK; seaFog.color.setRGB(0.01 * lk, 0.07 * lk + 0.05 * sea.U.uLampUnder.value, 0.08 * lk + 0.04 * sea.U.uLampUnder.value); seaFog.density = 0.12; sea.U.uUnderCol.value.copy(seaFog.color).multiplyScalar(1.8); sky.U.uUnderC.value.copy(seaFog.color); }
    else { scene.fog = airFog; airFog.color.copy(sk.hor); airFog.density = (0.000028 + 0.00002 * dark) * (['binocs', 'coastOut', 'owlPoint', 'ship', 'buoy'].includes(m) ? 0.25 : 1); }
    // ---- particles: spray at the rock, the water through the door, the burst, the sparks, bubbles over the boat
    puffs.begin(); adds.begin();
    fx(s, t, m, h);
    puffs.end(); adds.end();
  };
  // ---- the effects (all pure functions of s and t) -----------------------------------------------------------------
  function fx(s, t, m, h) {
    const near = (x, y, z, r) => camera.position.distanceTo(new THREE.Vector3(x, y, z)) < r;
    const sky = (0.1 + 0.9 * ocSkyK(ocSunAt(s).alt));
    // the swash: spray where the swell meets the rock near the camera (seeded points along the waterline round the tower / landing)
    if (['title', 'keeper', 'bow', 'sunk', 'tide', 'lichen', 'breakers', 'horn', 'fogHouse', 'tenM', 'gallerySea', 'gallery', 'roof', 'question'].includes(m)) {
      for (let i = 0; i < 160; i++) {
        const ang = ocR(i, 3) * 6.283, r = 3 + ocR(i, 4) * 40, x = camera.position.x + Math.cos(ang) * r, z = camera.position.z + Math.sin(ang) * r;
        const g = isl.hAt(x, z), dep = h - g; if (dep < -0.4 || dep > 0.5) continue;
        const per = 4 + ocR(i, 5) * 5, ph = ((t + ocR(i, 6) * per) % per) / per, b = Math.max(0, ocSwellY(x, z, t));
        if (ph > 0.3) continue; const u = ph / 0.3;
        // a burst of spray: a fan of small droplets thrown up off the rock and falling back
        for (let j = 0; j < 9; j++) { const a2 = ocR(i * 13 + j, 33) * 6.283, sp = 0.3 + 0.9 * ocR(i * 13 + j, 34), up = 1.2 + 1.6 * ocR(i * 13 + j, 35);
          const y = h + b * 0.6 + up * u - 2.2 * u * u; if (y < h - 0.05) continue;
          puffs.add(x + Math.cos(a2) * sp * u, y, z + Math.sin(a2) * sp * u, 0.06 + 0.22 * u, 0.42 * (1 - u) * sky, 0.92, 0.95, 0.97); }
      }
    }
    // the boat: the sea pouring in over its bow; its bubbles once it's under
    if (['bow', 'sunk', 'rope'].includes(m)) {
      const st = boat.state(s, t);
      if (s > E.flood - 1 && s < E.sunk) for (let i = 0; i < 70; i++) { const u = ((t * 1.3 + ocR(i, 8)) % 1); puffs.add(Bt.x + (ocR(i, 9) - 0.5) * 1.2, st.bow + 0.1 - 0.4 * u, Bt.bowZ + 0.4 + u * 1.1, 0.15 + 0.2 * u, 0.5 * (1 - u) * sky, 0.85, 0.9, 0.9); }
      if (s > E.sunk - 6) for (let i = 0; i < 90; i++) { const per = 1.2 + ocR(i, 10), ph = ((t + ocR(i, 11) * per) % per) / per, k = MathX.clamp(1 - (s - E.sunk) / 30, 0, 1);
        puffs.add(Bt.x + (ocR(i, 12) - 0.5) * 2.4, h + 0.05, Bt.bowZ + 1 + ocR(i, 13) * 4.4, 0.12 + 0.35 * ph, 0.55 * (1 - ph) * k * sky, 0.9, 0.93, 0.93); }
    }
    // the door: sheets of water through its seams (the deeper the sea over it, the harder), then the burst
    for (const j of seamJets) j.set({ a: 0 }); burstJet.set({ a: 0 });
    if (['bolt', 'strain', 'burst', 'powerRoom'].includes(m)) {
      const x0 = -ocTowerR(T.sill) + 0.3, dp = h - T.sill, light = s < E.dark ? 0.85 : 0.45, G = 9.81;
      if (s < E.burst && dp > 0) {
        // [y of the seam's middle, z, width, height, depth of the seam under the sea]
        const top = T.sill + T.door.h, wet = Math.min(T.door.h, dp), seams = [[T.sill + 0.02, 0, T.door.w * 0.92, 0.025], [top - 0.02, 0, T.door.w * 0.92, 0.02], [T.sill + wet / 2, T.door.w / 2 - 0.01, 0.025, wet * 0.95], [T.sill + wet / 2, -T.door.w / 2 + 0.01, 0.025, wet * 0.95]];
        seams.forEach(([y, z, w, hh], i) => { const d = h - y; if (d <= 0.02 || (i === 1 && h < top + 0.05)) return;
          const v = Math.sqrt(2 * G * d), len = Math.min(3.2, 0.35 + v * 0.16), tt = len / v;
          seamJets[i].set({ x: x0, y, z, len, w, h: hh, spread: [0.45, 0.35, 0.12, 0.12][i], drop: 0.5 * G * tt * tt, a: 0.6 * MathX.smooth(d, 0.02, 0.4), light, t, speed: v * 0.9 }); });
      }
      if (s >= E.burst && s < E.burst + P.filledS + 6) {
        const wy = P.towerWater(s), d = h - (T.sill + 1), v = Math.sqrt(2 * G * Math.max(0.2, d)), kb = MathX.smooth(s, E.burst, E.burst + 0.5), len = 6.4 * kb, tt = len / v;
        // (once the water inside is over the doorway the jet is under it: it fades as the doorway goes under)
        const sub = MathX.smooth(wy, T.sill + 1.0, T.sill + 2.2);
        burstJet.set({ x: x0 + 0.2, y: T.sill + 1.0, z: 0, len: Math.max(0.1, len), w: T.door.w * 0.95, h: T.door.h * 0.95, spread: 1.0, drop: 0.5 * G * tt * tt, a: (1 - sub) * kb, light, t, speed: v * 0.8 });
        // the spray where it hits the far wall and climbs it, and off the jet's top
        const kk = (1 - sub) * kb;
        for (let i = 0; i < 700; i++) { const u = ((t * 1.4 + ocR(i, 17)) % 1), side = ocR(i, 18) < 0.55;
          if (side) { const a = (ocR(i, 19) - 0.5) * 1.6, r = T.inner - 0.2 - 0.6 * u; puffs.add(Math.cos(a) * r, Math.max(wy, T.sill - 0.4) + u * (1.5 + 2.5 * ocR(i, 20)) - u * u * 1.2, Math.sin(a) * r, 0.06 + 0.3 * u, 0.5 * (1 - u) * kk, 0.82, 0.88, 0.88); }
          else { const xx = x0 + 0.2 + ocR(i, 21) * Math.max(0.2, len), q = (xx - x0) / Math.max(0.2, len); puffs.add(xx, T.sill + 1.0 + T.door.h * 0.5 * (1 + 0.6 * q) - 0.5 * G * Math.pow(q * tt, 2) + u * 0.4, (ocR(i, 22) - 0.5) * T.door.w * (1 + 1.2 * q), 0.04 + 0.14 * u, 0.45 * (1 - u) * kk, 0.85, 0.9, 0.9); } }
      }
      // sparks from the panel as the water reaches it
      if (s > E.dark - 0.6 && s < E.dark + 1.4) for (let i = 0; i < 60; i++) { const u = ((t * 3 + ocR(i, 21)) % 1); adds.add(T.inner - 0.3 - u * 0.6 * ocR(i, 22), T.sill + 1.3 + (ocR(i, 23) - 0.2) * 0.8 * u - u * u * 0.5, -0.5 + (ocR(i, 24) - 0.5) * u, 0.03 + 0.04 * (1 - u), 0.9 * (1 - u), 1.0, 0.75, 0.35); }
    }
    // the watch room: the water welling up through the stair's opening
    if (m === 'watchFlood') { for (let i = 0; i < 260; i++) { const a = tower.stepA(136) + (ocR(i, 25) - 0.5) * 2.5 * tower.dT, r = T.well + ocR(i, 26) * (T.inner - T.well), u = ((t * 0.9 + ocR(i, 27)) % 1);
      puffs.add(Math.cos(a) * r, Math.max(T.watch, P.towerWater(s)) + 0.03 + 0.12 * Math.sin(u * Math.PI), Math.sin(a) * r, 0.03 + 0.07 * u, 0.22 * (1 - u), 0.7, 0.8, 0.8); } }
    // the gallery: the swell washing over its deck
    if (m === 'gallery' && h > T.top - 0.8) for (let i = 0; i < 400; i++) { const a = ocR(i, 28) * 6.283, r = T.galleryR - 0.1 + ocR(i, 29) * 0.6, per = 2 + ocR(i, 30) * 3, ph = ((t + ocR(i, 31) * per) % per) / per; if (ph > 0.4) continue;
      const u = ph / 0.4; puffs.add(Math.cos(a) * r, h + 0.1 + 0.7 * Math.sin(u * Math.PI) * ocR(i, 32), Math.sin(a) * r, 0.3 + 0.5 * u, 0.3 * (1 - u), 0.6, 0.66, 0.72); }
    void near;
  }
  // ---- labels pinned to things (the HUD places them)
  set.labels = (t) => {
    const m = set._mode, s = set._s, out = [];
    const W = (a, b) => ocWin(t, a, b, 0.4, 0.4), sh = ocShotAt(t);
    if (m === 'tide') out.push({ p: [OC_F.tideBoard[0] - 0.16, 0.0 + 0.02, OC_F.tideBoard[1] - 0.05], text: 'HIGH WATER TONIGHT', sub: '3.4 m ON THE BOARD', a: W(sh.t0 + 0.4, sh.t1), side: 'r' });
    if (m === 'towerUp') out.push({ p: [0, T.lamp, 0], text: 'THE LAMP', sub: `${T.lamp} m OVER THE SEA AT 6:42`, a: W(sh.t0 + 0.6, sh.t1), side: 'r' });
    if (m === 'buoy') out.push({ p: [OC_F.bell.x, P.h(s) + 3.6, OC_F.bell.z], text: 'THE BELL BUOY', sub: `ON ${OC_F.bell.chain} m OF CHAIN, ${OC_F.bell.depth} m DOWN`, a: W(sh.t0 + 0.4, sh.t1 - 0.3) });
    if (m === 'binocs') out.push({ p: azAt([-21.5, 16, -1.6], 314.6, 0, 22000), text: 'PORT ELLERY', sub: '22 km', a: W(sh.t0 + 0.5, sh.t1) });
    if (m === 'owlPoint') { const l = coast.lights[1]; out.push({ p: [l.x, l.fh + 6, l.z], text: 'OWL POINT LIGHT', sub: `${l.fh} m · 19 km`, a: W(sh.t0 + 0.4, sh.t1) }); }
    if (m === 'ship') { const q = coast.shipAt(s); out.push({ p: [q[0], q[1] + 60, q[2]], text: 'A CONTAINER SHIP', sub: `${OCP.shipKm} km OUT · IT JUST FLOATS UP`, a: W(sh.t0 + 0.4, sh.t1) }); }
    if (m === 'coastOut') out.push({ p: azAt(galEye, 313.9, 0.25, 22000), text: 'PORT ELLERY', sub: '22 km', a: W(sh.t0 + 0.4, sh.t1) });
    return out;
  };
  set.grade = (t, p, shot) => {
    const s = set._s, m = shot.mode, sk = ocSkyK(ocSunAt(s).alt), dark = 1 - sk;
    // the camera opens up a little as the dusk deepens (but the blue hour stays blue and night stays night)
    p.exposure = 1.0 + 0.42 * Math.pow(dark, 1.3);
    p.saturation = 1.16 + 0.04 * dark; p.contrast = 1.12; p.warmth = 0.12 * sk - 0.04 * dark; p.blackLift = 0.005 + 0.006 * dark;
    p.bloom = 0.2 + 0.3 * dark; p.bloomThreshold = 0.95 - 0.15 * dark; p.vignette = 0.5 + 0.12 * dark; p.grain = 0.026 + 0.018 * dark; p.soft = 0.03;
    if (['phone', 'phoneType', 'phoneMid', 'phoneTown', 'phoneHill', 'phoneLie', 'phoneLow'].includes(m)) { p.edgeBlur = 0.6; p.bloom += 0.05; }
    if (m === 'binocs' || m === 'coastOut' || m === 'owlPoint' || m === 'ship') { p.exposure *= 0.7; p.contrast = 1.28; p.saturation += 0.04; p.grain += 0.015; p.blackLift = 0.0; }
    if (m === 'buoy') { p.exposure *= 0.72; p.contrast = 1.26; p.saturation += 0.16; }
    if (m === 'phoneLow') { p.exposure *= 0.72; }
    if (['powerRoom', 'stairsDown', 'climb', 'watchFlood', 'ladder'].includes(m) && s > OCE.dark) { p.exposure *= 1.15; p.vignette += 0.15; }
    if (set._under) { p.saturation *= 0.9; p.vignette += 0.12; }
  };
  return set;
};
