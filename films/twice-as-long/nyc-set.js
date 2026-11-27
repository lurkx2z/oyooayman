/* =====================================================================
   NYC SET — New York from your stoop to Central Park (steps 1–15), and three visits home later (that evening, a
   month on in the snow, eleven years on). The world is nyc.js + street.js; this file adds you, the people, the
   traffic, the destruction, a camera for every shot (shots.js modes) and the labels.
   Story time: twStory(t) (steps.js) — the world slows down with a slowed stride and runs at film speed between them.
   ===================================================================== */

// when each step lands (film time) and where
const twLand = (n) => TW_T[n] + TW_D[n];
const TW_P_ = (n) => TW_ROUTE[n];
// the sonic boom: its centre (the middle of step ten) and the moment its front leaves it
const TW_BOOM = { o: [TW_ROUTE[9][0], (TW_ROUTE[9][2] + TW_ROUTE[10][2]) / 2], t: TW_T[10] + TW_D[10] - 0.22 };
const twBoomAt = (x, z) => TW_BOOM.t + Math.hypot(x - TW_BOOM.o[0], z - TW_BOOM.o[1]) / 343;
// the film time you pass a point d metres along your path (bisection on twDist, which only grows)
function twPassTime(d) { let lo = 0, hi = TW_T[16]; for (let i = 0; i < 48; i++) { const m = (lo + hi) / 2; if (twDist(m) < d) lo = m; else hi = m; } return (lo + hi) / 2; }

// the sun at 8:52 AM on a late-November Monday: south-east, 18° up
const TW_SUN = (() => { const az = 132 * Math.PI / 180, al = 18 * Math.PI / 180; return [Math.sin(az) * Math.cos(al), Math.sin(al), -Math.cos(az) * Math.cos(al)]; })();

// move a sun's shadow box to `c` in whole texels (no crawling shadow edges)
function twShadowFollow(sun, c, R, size = 2048, far = 600) {
  const d = new THREE.Vector3(...TW_SUN).normalize(), up = Math.abs(d.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const rx = new THREE.Vector3().crossVectors(up, d).normalize(), ry = new THREE.Vector3().crossVectors(d, rx).normalize();
  const tex = (2 * R) / size, C = new THREE.Vector3(...c);
  const a = Math.round(C.dot(rx) / tex) * tex, b = Math.round(C.dot(ry) / tex) * tex, w = C.dot(d);
  const S = rx.multiplyScalar(a).add(ry.multiplyScalar(b)).add(d.clone().multiplyScalar(w));
  const cam = sun.shadow.camera;
  if (cam.right !== R || cam.far !== far) { cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R; cam.near = 1; cam.far = far; cam.updateProjectionMatrix(); }
  sun.target.position.copy(S); sun.position.copy(S).addScaledVector(d, far * 0.5); sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
}

// your pose in each shot: [expression, look ('cam' | [x,y,z] | null), extras]
const TW_YOU_MODE = {
  stoop: ['calm'], morning: ['neutral'], faceLate: ['worry', null, { phone: true }], stoopSide: ['neutral'], feet: ['neutral'],
  chase2: ['surprise'], front2: ['surprise', null, { neck: 0.3 }], wide3: ['surprise'], face3: ['wince', null, { neck: 0.42 }], leap4: ['shock'],
  busStop: ['worry'], busArrive: ['worry'], lookBack: ['determined'], overBus: ['scream'], busTop: ['shock'], busFaces: ['shock'],
  doorway: ['shock', 'cam'], stoopTop: ['awe', null, { neck: 0.35 }], ruleA: ['worry', null, { neck: 0.3 }], ruleB: ['worry'], sum: ['worry'], loop: ['worry'],
  remember: ['determined', 'cam'], officeMap: ['neutral'], walk: ['determined'], chase6: ['grin'], taxi: ['grin'], side7: ['grin'], speed7: ['surprise'],
  crack: ['grin', null, { neck: 0.4 }], phones: ['smile'], leap8: ['grin'], statue: ['grin'], leap9: ['determined'], awnings: ['determined'],
  promenade: ['worry'], leap10: ['determined'], esb: ['determined'], cone: ['surprise'], boomWide: ['surprise'], glass: ['shock'], boomStreet: ['shock'], windows: ['shock'],
  leap11: ['determined'], mach2: ['shock'], bridge: ['determined'], bridgeSide: ['determined'], squeeze: ['worry'], hot: ['determined'],
  leap13: ['scream'], mach9: ['scream'], glowing: ['awe'], impact: ['shock'], crater: ['shock'], trail: ['sad'], leap14: ['determined'], office: ['determined'],
  park: ['sad'], missed: ['sad'], leap15: ['determined'],
};
// which way you face while standing (film time → world yaw; 0 = south, ±π = north)
const TW_STAND_YAW = (() => {
  const s5 = Math.atan2(-Math.sin(10 * Math.PI / 180), -Math.cos(10 * Math.PI / 180));    // step five's heading (north)
  const h6 = Math.atan2(-23.6 + 0.13, -1.6 + 8.34), w = -Math.PI / 2 - 0.02;
  return [[-9, 0.175], [28.75, 0.175], [29.35, s5], [32.95, s5], [33.9, s5 + Math.PI], [62.6, s5 + Math.PI], [63.5, h6], [64.3, h6], [68.4, h6], [68.9, w],
    [96.6, w], [97.0, -1.95], [97.5, -Math.PI], [117.5, -Math.PI], [118.6, -2.25], [157.0, 2.64], [157.7, 2.64 - Math.PI], [162.6, 2.64 - Math.PI], [163.5, 2.64 - 2 * Math.PI]];
})();
function twStandYaw(t) { const K = TW_STAND_YAW; if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t < K[i][0]) { const u = (t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return MathX.lerp(K[i - 1][1], K[i][1], Ease.inOutSine(u)); } return K[K.length - 1][1]; }

TW_SETS.nyc = (app) => {
  const S = twSet(app, { sky: '#a8c8ea', fog: 0.00007, fogColor: '#c4d6e6', fov: 45, near: 0.05, far: 42000,
    hemi: ['#d6e6f6', '#8a7a66', 1.0], sun: TW_SUN.map((v) => v * 300), sunColor: '#fff0dc', sunI: 2.9, shadow: 2048, shadowR: 30, shadowFar: 600, env: ['#a8c8ea', '#d8dee6', '#6a6258'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  const sky = twGradSky(scene, '#4a86d0', '#cfe0ef', '#9fb4c4', { r: 38000, sunDir: TW_SUN, sunGlow: '#ffe6bc', hw: 0.3 });
  const world = twNycWorld(scene, app), st = twStreet(scene, world);
  const U = world.mat.userData.U;
  // ---- you
  const you = new YouCharacter(scene, { seed: 11 });
  you.cup(true);
  // ---- the people (film times: when you pass, when the boom reaches them)
  const L = twLand, B = twBoomAt;
  const crowdSpec = [];
  const add = (look, x, z, yaw, script, o = {}) => crowdSpec.push(Object.assign({ look, x, z, yaw, script }, o));
  // the bus stop (south pavement)
  add('twA', -3.4, 5.2, Math.PI, [[-1, 'idle'], [20.9, 'flinch'], [21.6, 'stare', -0.9], [B(-3, 5) + 0.05, 'duck'], [B(-3, 5) + 2.6, 'stare', -1.2]], { y: 0.15 });
  add('twC', -1.7, 5.9, Math.PI + 0.3, [[-1, 'phone'], [21.2, 'stare', -1.0], [29.6, 'stare', 0.6], [B(-1, 6) + 0.05, 'duck'], [B(-1, 6) + 2.4, 'film']], { y: 0.15 });
  add('twF', -3.0, 6.8, Math.PI, [[-1, 'sit'], [21.0, 'sitStare', -0.7], [29.6, 'sitStare', 0.3], [B(-3, 7), 'duck'], [B(-3, 7) + 2.8, 'sitStare', -0.8]], { y: 0.15 });
  add('twE', 0.8, 5.2, Math.PI - 0.4, [[-1, 'idle'], [21.0, 'flinch'], [21.5, 'point'], [23.5, 'stare', 0.2], [B(1, 5), 'duck'], [B(1, 5) + 2.5, 'stare', -1.4]], { y: 0.15 });
  // pavement walkers
  add('casual1', 30, 5.6, 0, [[-1, 'walk'], [B(30, 5.6), 'duck'], [B(30, 5.6) + 2.4, 'stare', -1.4]], { y: 0.15, walk: [-1, 0, 22] });
  add('twD', -38, -5.4, 0, [[-1, 'walk'], [64.4, 'stare', 1.2], [B(-38, -5.4), 'duck'], [B(-38, -5.4) + 3, 'point']], { y: 0.15, walk: [1, 0, 26] });
  add('casual3', 22, -5.8, 0, [[-1, 'walk'], [B(22, -5.8), 'duck'], [B(22, -5.8) + 2, 'film']], { y: 0.15, walk: [1, 0, 16] });
  // the café (seated at its tables, some standing)
  const cafe = [['twG', -112.6, -6.6, 0.5, 'sit'], ['twH', -111.4, -6.6, -0.5, 'sit'], ['casual2', -107.4, -6.6, 0.4, 'sit'], ['twB', -102.2, -6.6, -0.3, 'sit'], ['casual5', -97.2, -6.6, 0.3, 'sit'],
    ['casual6', -104.5, -5.2, 0.9, 'idle'], ['casual8', -99.0, -4.9, 1.1, 'idle'], ['twA', -115.5, -5.0, 0.8, 'idle']];
  cafe.forEach(([look, x, z, yaw, base], i) => {
    const sit = base === 'sit', toYou = Math.atan2(-71 - x, -1 - z);
    add(look, x, z, sit ? yaw : toYou, [[-1, base], [L(7) + 0.2 + i * 0.08, sit ? 'sitStare' : 'stare', sit ? toYou - yaw : 0], [twW('phones', 0) - 0.4 + i * 0.12, sit ? 'sitFilm' : 'film'], [B(x, z), 'duck'], [B(x, z) + 2.2 + i * 0.1, sit ? 'sitFilm' : 'film']], { y: sit ? 0.15 + 0.06 : 0.15 });
  });
  // the shops at the west end
  [['twE', -262, -5.2], ['casual1', -290, 5.6], ['twF', -318, -5.6], ['twC', -305, 5.0]].forEach(([look, x, z], i) => add(look, x, z, z < 0 ? 0.3 : Math.PI - 0.3, [[-1, i % 2 ? 'phone' : 'idle'], [twPassTime(twSum(8) + (-x - 167)) - 0.05, 'duck'], [twPassTime(twSum(8) + (-x - 167)) + 2.2, 'point'], [B(x, z), 'duck'], [B(x, z) + 2.5, 'stare', 1.0]], { y: 0.15 }));
  // the Promenade
  [['twB', -364, -30, -1.4], ['casual6', -364.5, 18, -1.6], ['twH', -349, -60, 1.6], ['twG', -364, -120, -1.5], ['casual2', -350, 40, 2.6], ['twD', -364, -250, -1.4], ['casual8', -355, -300, 0.2]].forEach(([look, x, z, yaw], i) =>
    add(look, x, z, yaw, [[-1, i === 2 ? 'walk' : 'idle'], [L(9) + 0.1, 'flinch'], [L(9) + 0.6, 'stare', 0.8 * (i % 2 ? 1 : -1)], [TW_T[10] + 0.3 + i * 0.25, 'duck'], [TW_T[10] + 3.4 + i * 0.2, 'stare', 1.3], [B(x, z), 'duck'], [B(x, z) + 2.6, 'point']], { y: 0.15, walk: i === 2 ? [0, 1, 20] : null }));
  // Lower Manhattan (step twelve lands), Union Square (thirteen), Central Park (fourteen)
  const site = (P, n, list) => list.forEach(([look, dx, dz, yaw], i) => { const x = P[0] + dx, z = P[2] + dz, a = Math.atan2(dx, dz);
    add(look, x, z, yaw, [[-1, i % 3 ? 'walk' : 'idle'], [L(n) + 0.05 * i, 'fallen'], [L(n) + 1.6 + 0.2 * i, 'run'], [L(n) + 7, 'stare', 0.4]], { walk: i % 3 ? [Math.cos(yaw), Math.sin(yaw), 12] : null, run: [Math.sin(a), Math.cos(a), 3.2, 4.5], range: 260 }); });
  site(TW_ROUTE[12], 12, [['twA', 14, 8, 0], ['twC', -12, 10, 1], ['casual3', 18, -12, 2], ['twH', -16, -9, 3], ['twD', 26, 3, 0.5], ['casual5', -24, 2, 2.4]]);
  site(TW_ROUTE[13], 13, [['twB', 34, 20, 0], ['twE', -30, 26, 1], ['casual1', 36, -22, 2], ['twG', -36, -18, 3], ['casual6', 48, 6, 0.5], ['twF', -46, 4, 2.4], ['casual2', 8, 44, 1.2]]);
  site(TW_ROUTE[14], 14, [['twC', 40, 30, 0], ['twD', -44, 28, 1], ['casual8', 46, -28, 2], ['twA', -38, -36, 3], ['casual3', 60, 6, 0.5]]);
  const crowd = twCrowd(scene, crowdSpec);
  // ---- the traffic: the bus (it stops at your stop as you cross), the taxi (alongside on step six), cars on the
  // cross street, the bridge, the avenues; the people on the bus and in the taxi
  const VF = new VehicleFactory();
  const seeThrough = (grp, op = 0.38) => grp.traverse((m) => { if (m.isMesh && m.material && m.material.name === 'carGlass') { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = op; m.material.depthWrite = false; } });
  const bus = VF.build('bus', '#eef0f2'); scene.add(bus.group); seeThrough(bus.group, 0.3); bus.group.rotation.y = Math.PI;
  {
    // the body is a solid extrusion: open its sides in the window band (and draw it two-sided) so the riders show
    let big = null, vol = 0;
    bus.group.traverse((m) => { if (!m.isMesh || !m.geometry || (m.material && m.material.name === 'carGlass')) return; m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox, v = (b.max.x - b.min.x) * (b.max.y - b.min.y) * (b.max.z - b.min.z); if (v > vol) { vol = v; big = m; } });
    if (big) {
      const m = big.material.clone(); m.side = THREE.DoubleSide;
      m.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBusL;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBusL = position;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBusL;').replace('void main() {', 'void main() {\n if (vBusL.x > -5.0 && vBusL.x < 4.9 && vBusL.y > 1.3 && vBusL.y < 2.6 && abs(vBusL.z) > 1.2) discard;');
      };
      m.customProgramCacheKey = () => 'twBusBody'; big.material = m;
    }
  }
  const riders = [['twB', -4.2, 0.6], ['casual2', -2.0, -0.5], ['twG', 0.6, 0.6], ['casual5', 2.8, -0.5], ['twH', -0.9, 0.6]].map(([look, x, z], i) => { const P = twPerson(look, bus.group, 90 + i); P.root.position.set(x, 0.75, z); return { P, i }; });
  const taxi = VF.build('taxi', '#f2c21a'); scene.add(taxi.group); seeThrough(taxi.group, 0.45); taxi.group.rotation.y = Math.PI;
  const driver = twPerson('twB', taxi.group, 99); driver.root.position.set(0.45, 0.25, 0.38);
  const cars = [];
  const car = (type, col, f) => { const v = VF.build(type, col); scene.add(v.group); cars.push({ v, f }); return v; };
  // the cross street (Henry St at x 46): two cars go by in the first minute
  car('sedan', '#3a4a5a', (t) => ({ x: 46 - 1.6, z: 50 - 9 * (t - 3), yaw: Math.PI / 2, on: t > 2 && t < 16 }));
  car('suv', '#8a2a24', (t) => ({ x: 46 + 1.6, z: -50 + 8 * (t - 30), yaw: -Math.PI / 2, on: t > 28 && t < 44 }));
  // the bridge: cars on the deck, braking as you land
  const deck = world.bridge, bd = deck.d, bT = deck.T0, lane = [bd[1], -bd[0]];
  [[-60, -4.5, '#2a2a30', 1], [-10, 4.5, '#e8e6e0', -1], [30, -7.5, '#6a7a8a', 1], [-110, 7.5, '#c8a040', -1], [75, 4.5, '#3a5a3a', -1], [-35, -1.5, '#9a2a2a', 1]].forEach(([k0, off, col, dir], i) => {
    car(i % 3 ? 'sedan' : 'suv', col, (t) => { const k = k0 + dir * 14 * Math.min(t - 110, twLand(11) - 110 + 0.4) * (t > twLand(11) ? 0 : 1) + dir * (t > twLand(11) ? 14 * (twLand(11) - 110 + 0.4) + 14 * Math.min(1.2, (t - twLand(11))) * 0.5 : 0);
      const p = [bT[0] + bd[0] * k + lane[0] * off, bT[1] + bd[1] * k + lane[1] * off]; return { x: p[0], z: p[1], y: deck.deckY(k) + 1.1, yaw: Math.atan2(bd[0] * dir, bd[1] * dir) - Math.PI / 2, on: t > 110 && t < 130, skid: t > twLand(11) ? MathX.clamp((t - twLand(11)) * 0.4, 0, 0.25) * (i % 2 ? 1 : -1) : 0 }; });
  });
  // the craters' cars: thrown and on their roofs
  const wrecks = [[12, 'sedan', '#4a4a52', 14, -6], [12, 'taxi', '#f2c21a', -18, 9], [13, 'suv', '#2a3a4a', 26, 12], [13, 'sedan', '#c8c4b8', -28, -14], [13, 'taxi', '#f2c21a', 20, -24], [13, 'van', '#e8e8e8', -34, 16]];
  wrecks.forEach(([n, type, col, dx, dz], i) => { const P = TW_ROUTE[n]; car(type, col, (t) => { const k = MathX.clamp((t - twLand(n)) / 0.7, 0, 1), fl = t > twLand(n) ? 1 : 0;
    return { x: P[0] + dx * (1 + 0.6 * k * fl), z: P[2] + dz * (1 + 0.6 * k * fl), y: fl ? 1.2 * Math.sin(k * Math.PI) * 2.5 : 0, yaw: i * 1.3, roll: fl ? k * Math.PI * (i % 2 ? 1 : 0.5) : 0, on: t > twLand(n) - 30 && t < 170 }; }); });
  // ---- the effects
  const soft = twPuffs(scene, 9000, { soft: 1.4, near: [0.6, 7] }), adds = twPuffs(scene, 6000, { additive: true, soft: 1.8, near: [0.3, 2] });
  const debrisM = twStd('#5a5650', 0.9), debris = twDebris(scene, 900, debrisM);
  const shock = twShock(scene), glow = twGlow(scene), blasts = [12, 13, 14].map((n) => ({ n, s: twShock(scene) }));
  const crackT = twCrackTex(3), craterT = twCrackTex(8, 512, { crater: true, arms: 20 });
  const decals = [[7, 7, crackT], [8, 11, crackT], [9, 12, crackT], [10, 16, craterT], [11, 9, crackT], [12, 30, craterT], [13, 48, craterT], [14, 58, craterT]].map(([n, size, tex]) => {
    const d = twDecal(scene, tex, size); const P = TW_ROUTE[n]; d.position.set(P[0], P[1] + (n === 11 ? 0.0 : 0.16) + 0.012, P[2]); d.rotation.z = n * 1.7; return { d, n };
  });
  // debris and dust at every hard landing, a blast at every take-off from step nine
  const DEB = [], DUST = [];
  for (let n = 7; n <= 15; n++) {
    const P = TW_ROUTE[n], k = Math.pow(2, n - 7);
    if (n <= 14) { DEB.push({ t: twLand(n), p: [P[0], P[1] + 0.2, P[2]], n: Math.min(140, 14 + 10 * n), v: 4 + 2.2 * Math.min(k, 12), up: 1.2, size: Math.min(1.6, 0.12 * Math.sqrt(k) + 0.08), seed: n, life: 12 });
      DUST.push({ t: twLand(n), p: [P[0], P[1] + 0.1, P[2]], kind: n >= 12 ? 'impact' : 'dust', size: Math.min(24, 1.0 * Math.sqrt(k) + 0.5), n: 22 + 3 * n, seed: n * 3, life: n >= 12 ? 22 : 6, alpha: n >= 12 ? 0.32 : 0.38 });
      if (n >= 12) DUST.push({ t: twLand(n), p: [P[0], P[1] + 1, P[2]], kind: 'fire', size: n * 1.4, n: 34, seed: n * 5, life: 10 });
      if (n >= 11) DUST.push({ t: twLand(n) + 0.4, p: [P[0], P[1], P[2]], kind: 'column', size: n === 11 ? 14 : 22 * (n - 10), n: 70, seed: n * 11, life: 70, far: true }); }
    if (n >= 9) { const Q = TW_ROUTE[n - 1]; DUST.push({ t: TW_T[n], p: [Q[0], Q[1] + 0.1, Q[2]], kind: n >= 12 ? 'impact' : 'dust', size: Math.min(20, 0.8 * Math.sqrt(k) + 0.4), n: 18 + 2 * n, seed: n * 7, life: n >= 12 ? 18 : 5, alpha: n >= 12 ? 0.3 : 0.34 }); }
  }
  // glass from every facade on your street when the boom's front reaches it; along Manhattan as you pass
  const GLASS = [];
  for (const [x, sgn] of st.houses) GLASS.push({ t: B(x, sgn * TW_ST.face), p: [x, 7.5, sgn * (TW_ST.face - 0.2)], dir: [0, -sgn], kind: 'glass', n: 18, wide: 5.2, spread: 9, seed: Math.round(x * 3 + sgn * 7 + 500) });
  {
    const a = TW_ROUTE[12], b = TW_ROUTE[14], l = Math.hypot(b[0] - a[0], b[2] - a[2]), n = [(b[0] - a[0]) / l, (b[2] - a[2]) / l], d0 = twSum(12);
    for (let d = 40; d < l; d += 45) for (const s of [-1, 1]) { const off = s * (34 + 18 * twR(d, s + 3)), p = [a[0] + n[0] * d - n[1] * off, a[2] + n[1] * d + n[0] * off];
      GLASS.push({ t: twPassTime(d0 + d) + 0.15, p: [p[0], 28 + 30 * twR(d, s), p[1]], dir: [-n[1] * s, n[0] * s], kind: 'glass', n: 22, wide: 30, spread: 40, seed: Math.round(d * 2 + s * 1000 + 3000) }); }
    U.uPath.value.set(a[0], a[2], b[0], b[2]);
  }
  // the walking route to your office (G1): a dotted line on the ground
  {
    const pts = [[0, -3], [-80, -420], [-60, -1060], [-470, -1420], [-820, -1700], [-650, -2100], [-300, -2900], [100, -4200], [600, -5300], [TW_PLACES.office[0], TW_PLACES.office[1]]];
    const pos = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 40); for (let k = 0; k < n; k++) pos.push(ax + (bx - ax) * k / n, 6, az + (bz - az) * k / n, ax + (bx - ax) * (k + 0.55) / n, 6, az + (bz - az) * (k + 0.55) / n); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    st.walkLine = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#ff6a1f', transparent: true, opacity: 0, depthTest: false })); st.walkLine.renderOrder = 9; scene.add(st.walkLine);
  }
  // the poster: your photo (drawn once from you, into a render target), and the snowfall
  const portrait = new THREE.WebGLRenderTarget(256, 320), pcam = new THREE.PerspectiveCamera(22, 256 / 320, 0.05, 50);
  const posterT = twTex(twCanvas(512, 724, (g) => { g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, 512, 724); g.fillStyle = '#c8202a'; g.fillRect(0, 0, 512, 120); g.fillStyle = '#fff'; g.font = '800 92px Inter, Arial'; g.textAlign = 'center'; g.fillText('MISSING', 256, 92);
    g.fillStyle = '#1a1a1a'; g.font = '800 34px Inter, Arial'; g.fillText('HAVE YOU SEEN THEM?', 256, 600); g.font = '600 26px Inter, Arial'; g.fillText('LAST SEEN MONDAY, 8:52 AM', 256, 640); g.fillText('LEAVING No. 44 FOR WORK', 256, 676); }), { repeat: false });
  const posterG = new THREE.Group(); scene.add(posterG); posterG.visible = false;
  twBox(0.52, 0.72, 0.01, new THREE.MeshStandardMaterial({ map: posterT, roughness: 0.85 }), 0, 0, 0, posterG);
  twBox(0.4, 0.42, 0.012, new THREE.MeshStandardMaterial({ map: portrait.texture, roughness: 0.7 }), 0, 0.06, 0.004, posterG);
  posterG.position.set(TW_ST.busStop[0], 1.62, TW_ST.busStop[1] - 0.06); posterG.rotation.y = Math.PI;
  const posters2 = [[11, -TW_ST.road - 0.55, 0], [-17, TW_ST.road + 0.55, Math.PI]].map(([x, z, ry]) => { const g = posterG.clone(); g.position.set(x, 1.55, z + (z < 0 ? 0.1 : -0.1)); g.rotation.y = ry; scene.add(g); return g; });
  let portraitDone = false;
  // ---- the cameras: mode → (t, u, ctx) → { p, at, fov, near?, far?, shR? (shadow box), shC? }
  const Y = new THREE.Vector3();
  const head = (t) => { const R = twRouteAt(t); return [R.p[0], R.p[1] + 1.7, R.p[2]]; };
  const P = (n) => TW_ROUTE[n];
  const dirOf = (n) => { const a = P(n - 1), b = P(n), l = Math.hypot(b[0] - a[0], b[2] - a[2]); return [(b[0] - a[0]) / l, (b[2] - a[2]) / l]; };
  const drift = (t, a = 0.03, s = 1) => twDrift(t, a, 0.5, s);
  const chase = (t, n, back, up, side = 0, ahead = 6, lag = 0) => { const R = twRouteAt(t - lag), d = dirOf(n), q = [-d[1], d[0]];
    return { p: [R.p[0] - d[0] * back + q[0] * side, R.p[1] + up, R.p[2] - d[1] * back + q[1] * side], at: [R.p[0] + d[0] * ahead, R.p[1] + 1.1, R.p[2] + d[1] * ahead] }; };
  const CAM = {
    stoop: (t, u) => ({ p: twV([2.3, 0.6, -4.4], [1.7, 0.6, -4.9], u / 3), at: [0.05, 1.15, -7.3], fov: 40 }),
    morning: (t, u) => ({ p: [28 - u * 2, 12.5, 8.5], at: [-8, 1.5, -5], fov: 52, shR: 70, shC: [-10, 0, 0] }),
    faceLate: (t, u) => ({ p: [0.9 + 0.03 * u, 1.62, -5.3], at: [0.12, 1.74, -6.86], fov: 32 }),
    stoopSide: (t, u) => ({ p: [5.4 - 0.25 * u, 1.25, -3.9], at: [0.1, 1.35, -7.1], fov: 36 }),
    feet: (t, u) => ({ p: [0.62, 0.14, -5.2 + 0.05 * u], at: [0.13, 0.95, -6.86], fov: 58 }),
    chase2: (t, u) => ({ p: [-0.5, 2.45, -8.55], at: [0.5, 0.55, -4.4], fov: 52 }),
    front2: (t, u) => ({ p: [0.95, 1.45, -3.25 - 0.05 * u], at: [0.39, 1.45, -5.38], fov: 34 }),
    wide3: (t, u) => ({ p: [-6.2 + 0.3 * u, 1.7, 6.6], at: [0.6, 0.9, -3.2], fov: 42 }),
    face3: (t, u) => ({ p: [1.35, 1.5, -1.45], at: [0.9, 1.6, -2.45], fov: 30 }),
    leap4: (t, u) => ({ p: [9.5 - 0.4 * u, 1.35, 0.8], at: [1.3, 1.0, 0.3], fov: 40 }),
    busStop: (t, u) => ({ p: [-5.8 + 0.2 * u, 1.55, 1.6], at: [-0.6, 1.45, 4.9], fov: 40 }),
    busArrive: (t, u) => ({ p: [-3.6, 1.7, 6.9], at: [3.2, 1.6, -1.2], fov: 46 }),
    lookBack: (t, u) => ({ p: [3.1, 1.55, 5.6], at: [0.2, 2.1, -4.5], fov: 42 }),
    overBus: (t, u) => ({ p: [13.5 - 0.6 * u, 2.3, -0.9], at: [0.6, 3.0 + 0.2 * u, -1.6], fov: 48 }),
    busTop: (t, u) => ({ p: [7, 15.5, 9.5], at: [-0.6, 1.2, -3.5], fov: 44, shR: 30 }),
    busFaces: (t, u) => ({ p: [4.6, 1.55, -4.6], at: [-1.2, 1.9, 1.4], fov: 42 }),
    doorway: (t, u) => ({ p: [0.45, 1.6, -5.1 + 0.1 * u], at: [-0.1, 1.9, -8.3], fov: 32 }),
    stoopTop: (t, u) => ({ p: [1.6, 4.3, -5.6], at: [0, 0.6, -7.9], fov: 40 }),
    ruleA: (t, u) => ({ p: [1.6, 1.1, -2.4 - 0.08 * u], at: [0, 2.6, -8.3], fov: 38 }),
    ruleB: (t, u) => ({ p: [4.4 - 0.15 * u, 1.65, -6.3], at: [0, 1.75, -8.2], fov: 30 }),
    sum: (t, u) => ({ p: [20 - 0.6 * u, 24, 15], at: [-26, 0, -3], fov: 46, shR: 80, shC: [-20, 0, 0] }),
    loop: (t, u) => ({ p: [-6, 42 + u, 16], at: [-6, 0, -4], fov: 40, shR: 70, shC: [-6, 0, 0] }),
    remember: (t, u) => ({ p: [0.6, 1.95, -6.35 - 0.04 * u], at: [-0.13, 2.02, -8.34], fov: 30 }),
    officeMap: (t, u) => ({ p: [-1500 + 40 * u, 2900 - 30 * u, 4100], at: [300, 0, -4600], fov: 40, near: 5, shR: 0, fog: 0.15 }),
    walk: (t, u) => ({ p: [-4.6, 1.25, -5.1], at: [-0.1, 1.6, -8.1], fov: 36 }),
    chase6: (t, u) => { const R = twRouteAt(t - 0.1), d = dirOf(6); return { p: [R.p[0] - d[0] * 5.5, 2.0, MathX.clamp(R.p[2] - d[1] * 5.5 + 3.0, -6.8, 6)], at: [R.p[0] + d[0] * 6, 1.1, R.p[2] + d[1] * 6], fov: 48 }; },
    taxi: (t, u) => { const R = twRouteAt(t), x = Math.max(-21, R.p[0]); return { p: [x + 2.2, 1.35, -6.2], at: [x - 1.4, 1.4, 0.2], fov: 46 }; },
    side7: (t, u) => { const R = twRouteAt(t), x = MathX.lerp(-26, -66, Ease.inOutSine(MathX.clamp(u / 2.5, 0, 1))); return { p: [x + 7, 1.9, 7.2], at: [R.p[0] * 0.5 + x * 0.5, 1.4, -1], fov: 52 }; },
    speed7: (t, u) => ({ p: [-90 + 0.5 * u, 2.4, 1.2], at: [-71.2, 1.0, -0.95], fov: 40, shR: 45, shC: [-78, 0, 0] }),
    crack: (t, u) => { const k = MathX.smooth(u, 1.2, 2.6); return { p: twV([-69.0, 0.45, 0.6], [-69.6, 2.6, 2.0], k), at: twV([-71.2, 0.7, -0.95], [-71.2, 0.0, -0.95], k), fov: 40 }; },
    phones: (t, u) => ({ p: [-113.5 + 0.2 * u, 1.72, -7.6], at: [-71, 1.3, -0.6], fov: 30, shR: 50, shC: [-90, 0, -3] }),
    leap8: (t, u) => { const R = twRouteAt(t); return { p: [-122, 5.5, 7.6], at: [R.p[0], R.p[1] + 1.0, R.p[2]], fov: 56, shR: 60, shC: [-120, 0, 0] }; },
    statue: (t, u) => ({ p: [-367, 2.0, 4.5], at: [TW_PLACES.statue[0], 48, TW_PLACES.statue[1]], fov: 3.6 - 0.12 * u, near: 1, shR: 0, fog: 0.25 }),
    leap9: (t, u) => { const c = chase(t, 9, 9, 1.1, -1.5, 24, 0.06); return { p: c.p, at: [c.at[0], 2.0, c.at[2]], fov: 56, shR: 40, shC: c.p }; },
    awnings: (t, u) => ({ p: [-247 - u * 0.6, 1.75, -5.2], at: [-300, 4.2, -1.6], fov: 52, shR: 60, shC: [-290, 0, 0] }),
    promenade: (t, u) => ({ p: [-355.4, 1.85, 3.6 - 0.1 * u], at: [-760, 50, -1550], fov: 40, shR: 30, shC: [-359, 0, 0] }),
    leap10: (t, u) => { const R = twRouteAt(t); return { p: [-385, 3.2, R.p[2] * 0.6 + 6], at: [R.p[0], R.p[1] + 1.2, R.p[2] - 6], fov: 50, shR: 60, shC: [-360, 0, R.p[2]] }; },
    esb: (t, u) => ({ p: [2600 - 6 * u, 150, -5600], at: [TW_PLACES.esb[0], 235, TW_PLACES.esb[1]], fov: 13 - 0.3 * u, near: 1, shR: 0, fog: 0.3 }),
    cone: (t, u) => { const R = twRouteAt(t); return { p: [R.p[0] - 13, R.p[1] - 2.5, R.p[2] + 6.5], at: [R.p[0], R.p[1] + 0.6, R.p[2] + 1.5], fov: 46, shR: 40, shC: R.p }; },
    boomWide: (t, u) => ({ p: [-120 + 4 * u, 140, 330], at: [-250, 0, -140], fov: 52, near: 1, shR: 500, shC: [-200, 0, -100] }),
    glass: (t, u) => ({ p: [-15, 1.55, 5.6], at: [6, 4.5, -6.5], fov: 52, shR: 40, shC: [-4, 0, 0] }),
    boomStreet: (t, u) => ({ p: [-92 + 0.4 * u, 1.65, -2.2], at: [10, 3.0, -2.6], fov: 40, shR: 80, shC: [-50, 0, 0] }),
    windows: (t, u) => ({ p: [-42 + 2.2 * u, 2.2, 6.2], at: [-46 + 2.2 * u, 7.5, -8.2], fov: 50, shR: 40, shC: [-42, 0, 0] }),
    leap11: (t, u) => { const R = twRouteAt(t); return { p: [-357, 3.0, -362], at: twV([-200, 30, -700], [R.p[0], R.p[1], R.p[2]], 0.5), fov: 46, near: 0.5, shR: 0 }; },
    mach2: (t, u) => { const d = dirOf(12), q = [-d[1], d[0]], A = P(11); return { p: [A[0] + d[0] * 5.5 + q[0] * 1.3, A[1] + 1.55, A[2] + d[1] * 5.5 + q[1] * 1.3], at: [A[0], A[1] + 1.25, A[2]], fov: 42, shR: 40, shC: A }; },
    bridge: (t, u) => { const R = twRouteAt(t), d = dirOf(12), q = [-d[1], d[0]]; return { p: [R.p[0] + q[0] * 55 - d[0] * 26, Math.max(60, R.p[1] + 28), R.p[2] + q[1] * 55 - d[1] * 26], at: [R.p[0] + d[0] * 40, R.p[1], R.p[2] + d[1] * 40], fov: 52, near: 0.5, shR: 260, shC: R.p }; },
    bridgeSide: (t, u) => ({ p: [-620 + 8 * u, 24, -830], at: [-170, 45, -1150], fov: 46, near: 1, shR: 0, fog: 0.4 }),
    squeeze: (t, u) => { const A = P(12); return { p: [A[0] - 4.2, 1.7, A[2] + 4.6 - 0.05 * u], at: [A[0] + 1.4, 1.5, A[2] - 0.4], fov: 40, shR: 40, shC: A }; },
    hot: (t, u) => { const A = P(12), d = dirOf(13); return { p: [A[0] + d[0] * 1.9 + 0.4, 1.78, A[2] + d[1] * 1.9], at: [A[0], 1.82, A[2]], fov: 34, shR: 30, shC: A }; },
    leap13: (t, u) => { const c = chase(t, 13, 16, 4.5, 3, 30, 0.05); return { p: c.p, at: c.at, fov: 58, near: 0.3, shR: 150, shC: c.p }; },
    mach9: (t, u) => { const R = twRouteAt(t), d = dirOf(13), q = [-d[1], d[0]]; return { p: [R.p[0] + q[0] * 170 - d[0] * 60, R.p[1] + 25, R.p[2] + q[1] * 170 - d[1] * 60], at: [R.p[0] + d[0] * 20, R.p[1], R.p[2] + d[1] * 20], fov: 50, near: 0.5, shR: 300, shC: R.p }; },
    glowing: (t, u) => { const R = twRouteAt(t), d = dirOf(13), q = [-d[1], d[0]]; return { p: [R.p[0] + d[0] * 3.4 + q[0] * 0.8, R.p[1] + 1.8, R.p[2] + d[1] * 3.4 + q[1] * 0.8], at: [R.p[0], R.p[1] + 1.5, R.p[2]], fov: 46, shR: 40, shC: R.p }; },
    impact: (t, u) => { const A = P(13), d = dirOf(13); return { p: [A[0] - d[0] * 380, 320 + 2 * u, A[2] - d[1] * 380], at: [A[0], 10, A[2]], fov: 42, near: 0.5, shR: 260, shC: A, fog: 0.5 }; },
    crater: (t, u) => { const A = P(13); return { p: [A[0] + 6.5 - 0.2 * u, 1.45, A[2] + 8.5], at: [A[0], 1.3, A[2]], fov: 38, shR: 50, shC: A }; },
    trail: (t, u) => ({ p: [1100, 720, -7000 + 30 * u], at: [-300, 0, -3200], fov: 50, near: 5, shR: 0, fog: 0.3 }),
    leap14: (t, u) => { const c = chase(t, 14, 22, 6, -5, 60, 0.04); return { p: c.p, at: c.at, fov: 60, near: 0.3, shR: 200, shC: c.p }; },
    office: (t, u) => { const o = TW_PLACES.office; return { p: [o[0] - 380, 250 + 3 * u, o[1] + 560], at: [o[0], 120, o[1]], fov: 40, near: 0.5, shR: 300, shC: [o[0], 0, o[1]], fog: 0.4 }; },
    park: (t, u) => { const A = P(14); return { p: [A[0] + 2.4, 1.85, A[2] - 4.2], at: [A[0] - 260, 90, A[2] + 1600], fov: 46, shR: 40, shC: A }; },
    missed: (t, u) => ({ p: [2100, 950, -5500], at: [2700, 0, -9000], fov: 48, near: 5, shR: 0, fog: 0.25 }),
    leap15: (t, u) => { const R = twRouteAt(t), d = dirOf(15); return { p: [R.p[0] - d[0] * 7 - d[1] * 4, R.p[1] - 2.2, R.p[2] - d[1] * 7 + d[0] * 4], at: [R.p[0], R.p[1] + 0.9, R.p[2]], fov: 50, near: 0.3, shR: 30, shC: R.p, fog: 0.5 }; },
    // the visits home
    evening: (t, u) => ({ p: [-21 + 0.6 * u, 1.7, 5.6], at: [4, 3.2, -8.2], fov: 46, shR: 50, shC: [-5, 0, 0] }),
    poster: (t, u) => { const k = MathX.smooth(u, 0, 4.5); return { p: twV([-1.6, 1.62, 1.6], [-0.58, 1.66, 2.55], k), at: [TW_ST.busStop[0], 1.62, TW_ST.busStop[1]], fov: 40, shR: 30, shC: [0, 0, 0] }; },
    future: (t, u) => ({ p: [0.9, 1.6, -3.6 + 0.08 * u], at: [-0.1, 1.6, -8.4], fov: 40, shR: 30, shC: [0, 0, -6] }),
  };

  // ---- labels (t, shot) → [{ p, text, sub, a, side, you }]
  const LAB = {
    morning: (t) => [{ p: head(t), text: 'YOU', a: 1, you: true }],
    busTop: () => [{ p: [bus.group.position.x, 3.4, bus.group.position.z], text: 'A BUS', sub: '12 METRES', a: 1 }],
    stoopTop: () => [{ p: [0, 0.5, -7.6], text: 'WHERE YOU STARTED', a: 1, side: 'r' }],
    officeMap: (t, sh) => [{ p: [TW_PLACES.office[0], 190, TW_PLACES.office[1]], text: 'YOUR OFFICE', sub: '8 KM ON FOOT', a: twWin(t, sh.t0 + 0.3, sh.t1, 0.3, 0.2) }, { p: [0, 30, 0], text: 'YOU', a: twWin(t, sh.t0, sh.t1, 0.3, 0.2), you: true }],
    statue: (t, sh) => [{ p: [TW_PLACES.statue[0] + 6, 95, TW_PLACES.statue[1]], text: 'STATUE OF LIBERTY', sub: '93 M TALL', a: twWin(t, sh.t0 + 0.2, sh.t1, 0.3, 0.2), side: 'r' }],
    esb: (t, sh) => [{ p: [TW_PLACES.esb[0] + 20, 381, TW_PLACES.esb[1]], text: 'EMPIRE STATE BUILDING', sub: '381 M TALL', a: twWin(t, sh.t0 + 0.2, sh.t1, 0.3, 0.2), side: 'r' }],
    bridgeSide: (t, sh) => [{ p: [-300, 92, -1260], text: 'BROOKLYN BRIDGE', sub: '1.8 KM LONG', a: twWin(t, sh.t0 + 0.2, sh.t1, 0.3, 0.2) }],
    impact: (t, sh) => [{ p: [TW_PLACES.flatiron[0], 95, TW_PLACES.flatiron[1]], text: 'FLATIRON BUILDING', a: twWin(t, sh.t0 + 0.6, sh.t1, 0.3, 0.2) }],
    office: (t, sh) => [{ p: [TW_PLACES.office[0], 192, TW_PLACES.office[1]], text: 'YOUR OFFICE', a: twWin(t, sh.t0 + 0.6, sh.t1, 0.3, 0.2) }],
    missed: (t, sh) => [{ p: [TW_PLACES.office[0], 195, TW_PLACES.office[1]], text: 'YOUR OFFICE', a: twWin(t, sh.t0 + 0.2, sh.t1, 0.3, 0.2) }, { p: [P(14)[0], 40, P(14)[2]], text: 'YOU', sub: '4 KM PAST IT', a: twWin(t, sh.t0 + 0.7, sh.t1, 0.3, 0.2), you: true }],
    park: (t, sh) => [{ p: [TW_PLACES.esb[0], 400, TW_PLACES.esb[1]], text: 'MIDTOWN', sub: 'YOUR OFFICE IS DOWN THERE', a: twWin(t, sh.t0 + 0.8, sh.t1, 0.3, 0.2) }],
    leap15: (t, sh) => [{ p: [P(14)[0], 10, P(14)[2] - 40], text: 'CENTRAL PARK', a: twWin(t, sh.t0 + 0.2, sh.t0 + 2.4, 0.3, 0.3) }],
    future: (t, sh) => [{ p: [0, 1.0, -8.95], text: 'STEP 57 WOULD LAND YOU HERE', a: twWin(t, sh.t0 + 0.8, sh.t1, 0.3, 0.2) }],
  };

  // ---- the look of each visit home
  const look = (mode) => mode === 'evening' ? 'eve' : mode === 'poster' ? 'snow' : mode === 'future' ? 'future' : 'day';
  const LOOKS_ = {
    day: { sky: ['#4a86d0', '#cfe0ef', '#9fb4c4'], sunC: '#fff0dc', sunI: 2.9, hemi: ['#d6e6f6', '#8a7a66', 1.0], fog: '#c4d6e6', fogD: 0.00007, lamp: 0, env: 1 },
    eve: { sky: ['#1c2a52', '#e88a5a', '#3a2a3a'], sunC: '#ff9a5a', sunI: 0.7, hemi: ['#6a6aa0', '#3a2a2a', 0.55], fog: '#8a6a6a', fogD: 0.0001, lamp: 2.4, env: 0.3 },
    snow: { sky: ['#8a96a6', '#c8ccd2', '#9aa0a8'], sunC: '#e8eef6', sunI: 0.9, hemi: ['#dfe6ee', '#9aa0a8', 1.25], fog: '#c8ccd2', fogD: 0.0009, lamp: 0.8, env: 0.75 },
    future: { sky: ['#5a92d8', '#d6e4ef', '#a0b4c4'], sunC: '#fff2e0', sunI: 2.7, hemi: ['#d6e6f6', '#8a7a66', 1.0], fog: '#c4d6e6', fogD: 0.00007, lamp: 0, env: 1 },
  };
  const sunDir = new THREE.Vector3(...TW_SUN);

  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const mode = shot.mode, u = t - shot.t0, lk = look(mode), Lk = LOOKS_[lk], away = lk !== 'day';
      // ---- light and sky for the visit
      sky.material.uniforms.a.value.set(Lk.sky[0]); sky.material.uniforms.b.value.set(Lk.sky[1]); sky.material.uniforms.c.value.set(Lk.sky[2]);
      sky.material.uniforms.sc.value.set(lk === 'eve' ? '#ff8a40' : lk === 'snow' ? '#000000' : '#ffe6bc');
      sun.color.set(Lk.sunC); sun.intensity = Lk.sunI; S.hemi.color.set(Lk.hemi[0]); S.hemi.groundColor.set(Lk.hemi[1]); S.hemi.intensity = Lk.hemi[2];
      scene.fog.color.set(Lk.fog); scene.background.set(Lk.fog); scene.environmentIntensity = Lk.env;
      st.lampM.emissiveIntensity = Lk.lamp; st.yours.lampM.emissiveIntensity = Lk.lamp;
      U.uLit.value = lk === 'eve' ? 0.9 : lk === 'snow' ? 0.25 : 0;
      for (const m of st.snow) m.visible = lk === 'snow';
      st.tape.visible = lk === 'eve';
      posterG.visible = lk === 'snow' || lk === 'eve' || lk === 'future'; for (const g of posters2) g.visible = lk === 'snow';
      if (lk === 'eve') posterG.visible = false;
      if (lk === 'future') posterG.visible = false;
      st.yours.doorM.color.set(lk === 'future' ? '#24456a' : '#7a2418');
      // ---- the windows: the boom's front, then your path through Manhattan (every visit home: they stay broken, or
      // were mended a month on)
      const tt = away ? (lk === 'eve' ? 300 : -100) : t;
      const R0 = 343 * (tt - TW_BOOM.t);
      U.uShatter.value.set(TW_BOOM.o[0], TW_BOOM.o[1], R0 > 0 ? Math.min(R0, 900) : -1, 30);
      const pd = twDist(Math.min(tt, TW_T[15])) - twSum(12);
      U.uPathK.value.set(pd, 75, tt > TW_T[13] ? 1 : 0);
      for (const g of st.yours.glass) { const br = tt >= B(g.x, -TW_ST.face); g.p.visible = !br; g.pb.visible = br && lk !== 'snow'; if (lk === 'snow') g.p.visible = true; }
      // ---- you (in New York until step fifteen takes you away; not here on the visits home)
      const showYou = !away && t < TW_T[15] + 6;
      you.visible(showYou);
      if (showYou) twPoseYou(you, t, shot, cam);
      // the portrait for the posters (once, from you on your stoop)
      if (lk === 'snow' && !portraitDone) {
        you.visible(true); you.place(0, 0.45, -7.6, 0.0); you.pose(YOU_POSES.stand(0), 'relax'); you.expr('smile', 1.2, 1); you.look(null); you.cup(false);
        const hp = you.headWorld(new THREE.Vector3()); pcam.position.set(hp.x + 0.05, hp.y + 0.02, hp.z + 1.25); pcam.lookAt(hp.x, hp.y - 0.04, hp.z); pcam.updateMatrixWorld(true);
        set._portrait = () => { const r = app.renderer, prev = r.getRenderTarget(); posterG.visible = false; r.setRenderTarget(portrait); r.render(scene, pcam); r.setRenderTarget(prev); posterG.visible = true; for (const g of posters2) g.visible = true; you.visible(false); you.cup(true); };
      }
      // ---- the people
      const cp = CAM[mode] ? CAM[mode](t, u) : CAM.morning(t, u);
      scene.fog.density = Lk.fogD * (cp.fog ?? 1);
      crowd.frame(away ? -50 : t, { position: { x: cp.p[0], z: cp.p[2] } });
      for (const { P } of crowd.people) if (away) P.root.visible = false;
      // ---- the bus: in from the east, stops at your stop, leaves after you've landed home
      {
        const tA = 23.0, tS = 26.4, tL = 34.6, xs = -1.2;
        let x; if (t < tA) x = 90; else if (t < tS) { const k = (t - tA) / (tS - tA); x = xs + (60 - xs) * (1 - k) * (1 - k); } else if (t < tL) x = xs; else x = xs - 4.5 * (t - tL) * (t - tL);
        bus.group.position.set(x, 0, 1.45); bus.group.visible = !away && x > -360 && t < 60;
        for (const { P, i } of riders) { const po = t > TW_T[5] ? TW_P.sitStare(t, i, 0.6 + 0.2 * Math.sin(i)) : TW_P.sit(t, i); P.apply(po); P.root.rotation.y = -Math.PI / 2; }
      }
      // ---- the taxi: west at 24 m/s (story) beside you on step six, brakes after step seven's crash
      {
        const s = twStory(t), s0 = twStory(TW_T[6]) - 0.15, sb = twStory(twLand(7));
        let x; if (s < s0) x = 24 * (s0 - s) + 1.5; else if (s < sb) x = 1.5 - 24 * (s - s0); else { const v0 = 24, a = 9, dt = Math.min(s - sb, v0 / a); x = 1.5 - 24 * (sb - s0) - (v0 * dt - 0.5 * a * dt * dt); }
        taxi.group.position.set(x, 0, 1.4); taxi.group.visible = !away && t > 55 && t < 120;
        const hz = t > twLand(7) && Math.floor(t * 2.5) % 2 === 0 ? 1.6 : 0; taxi.hazard.emissiveIntensity = hz;
        driver.apply(Object.assign(TW_P.sit(t, 3), { headYaw: t > TW_T[6] && t < twLand(7) + 4 ? 1.1 : 0 })); driver.root.rotation.y = -Math.PI / 2;
      }
      for (const c of cars) { const f = c.f(t); c.v.group.visible = !!f.on && !away; if (!f.on) continue; c.v.group.position.set(f.x, f.y || 0, f.z); c.v.group.rotation.set(0, f.yaw || 0, f.roll || 0); if (f.skid) c.v.group.rotation.y += f.skid; }
      // ---- the awnings: torn off by your wake (step nine), then blown west and down
      for (const a of st.awnings) {
        const b = a.base, tr = twPassTime(twSum(8) + (-b.x - 167)) + 0.12 + 0.2 * twR(a.seed, 2), k = t - tr;
        if (away || k < 0) { a.m.position.set(b.x, b.y, b.z); a.m.rotation.set(b.rx + (k > -0.6 && !away ? 0.25 * Math.sin(t * 40) * (1 + k / 0.6) : 0), 0, 0); a.m.visible = true; continue; }
        const v = 26 * (0.7 + 0.5 * twR(a.seed, 3)), kk = Math.min(k, 4.5), drag = (1 - Math.exp(-kk * 0.8)) / 0.8;
        a.m.position.set(b.x - v * drag, Math.max(0.2, b.y + 3.5 * drag - 1.6 * kk * kk), b.z - b.sgn * 2.5 * drag * twR(a.seed, 5));
        a.m.rotation.set(b.rx + kk * 4 * (twR(a.seed, 6) - 0.5), kk * 3 * (twR(a.seed, 7) - 0.5), kk * 5 * (twR(a.seed, 8) - 0.5));
      }
      // ---- the trees sway in your wake and the boom
      for (const c of st.crowns) {
        const tp = c.x > TW_ROUTE[6][0] ? TW_T[6] + 1.5 : twPassTime(twSum(5) + Math.max(0, -c.x - 23)), w1 = t > tp ? Math.exp(-(t - tp) * 0.9) : 0;
        const tb = B(c.x, c.z), w2 = t > tb ? Math.exp(-(t - tb) * 0.7) : 0, sway = (0.18 * w1 + 0.3 * w2) * Math.sin(t * 7 + c.x);
        c.g.rotation.set(sway * 0.6, 0, sway); c.g.visible = true;
      }
      // ---- decals, debris, dust, fire, glass
      for (const { d, n } of decals) d.visible = !away && t >= twLand(n);
      if (lk === 'eve') for (const { d, n } of decals) d.visible = n <= 10;
      debris.frame(away ? -100 : t, DEB, 0.16);
      soft.begin(); adds.begin();
      if (!away) {
        const cx = cp.p[0], cz = cp.p[2], near = (p, r) => Math.hypot(p[0] - cx, p[2] - cz) < r;
        for (const ev of DUST) if (near(ev.p, ev.far ? 12000 : 2500)) twBurst(soft, adds, t, ev);
        for (const ev of GLASS) if (t > ev.t && t < ev.t + 6 && near(ev.p, 260)) twBurst(soft, adds, t, ev);
        // the fiery trail behind you (from step twelve) and the hot air in front (the glow)
        const s = twStepAt(t);
        if (s.n >= 12 && s.n <= 15) for (let j = 0; j < 90; j++) {
          const te = t - j * 0.045, sj = twStepAt(te); if (sj.n < 12 || !sj.on) continue;
          const Rj = twRouteAt(te), age = t - te, heat = Math.exp(-age / 0.9) * (sj.n === 12 ? 0.35 : 1);
          adds.add(Rj.p[0], Rj.p[1] + 1.0 + age * 1.2, Rj.p[2], 1.4 + age * 2.4, 0.75 * heat, 1.0, 0.55, 0.2);
          soft.add(Rj.p[0], Rj.p[1] + 1.4 + age * 2.0, Rj.p[2], 2.0 + age * 3.4, 0.45 * Math.exp(-age / 3) * MathX.smooth(age, 0.3, 1.0), 0.32, 0.3, 0.3);
        }
      }
      // the snow (a month on)
      if (lk === 'snow') for (let i = 0; i < 1400; i++) { const h = (j) => twR(i, j), fall = (t * (0.9 + 0.5 * h(1)) + h(2) * 12) % 12, x = cp.p[0] - 14 + 28 * h(3) + Math.sin(t * 0.7 + i) * 0.4, z = cp.p[2] - 14 + 28 * h(4);
        soft.add(x, 12 - fall, z, 0.035 + 0.03 * h(5), 0.85, 1, 1, 1); }
      soft.end(); adds.end();
      // the glow, the vapour cone, the boom's ring
      {
        const s = twStepAt(t), R = twRouteAt(t), dv = s.n >= 1 && s.n <= 15 ? (() => { const a = TW_ROUTE[Math.min(s.n, 15) - 1], b = TW_ROUTE[Math.min(s.n, 15)]; return twN3([b[0] - a[0], 0, b[2] - a[2]]); })() : [0, 0, 1];
        const gk = away ? 0 : s.n === 12 && s.on ? 0.25 * MathX.smooth(s.u, 0.2, 0.5) : (s.n >= 13 && s.n <= 15 && (s.on || s.n === 15)) ? 0.9 : 0;
        glow.set([R.p[0] + dv[0] * 0.6, R.p[1] + 1.0, R.p[2] + dv[2] * 0.6], dv, gk, 1.9, '#ffa45a');
        const ck = away ? 0 : s.n === 10 && s.on ? MathX.smooth(s.u, 0.22, 0.35) * (1 - MathX.smooth(s.u, 0.9, 0.98)) : s.n === 11 && s.on ? 0.55 * MathX.smooth(s.u, 0.1, 0.3) * (1 - MathX.smooth(s.u, 0.8, 0.95)) : 0;
        shock.setCone([R.p[0] + dv[0] * 0.3, R.p[1] + 1.0, R.p[2] + dv[2] * 0.3], [-dv[0], 0, -dv[2]], ck, s.n === 11 ? 1.3 : 1.0);
        const rb = 343 * (t - TW_BOOM.t);
        shock.setRing([TW_BOOM.o[0], 19, TW_BOOM.o[1]], rb, away || rb < 0 ? 0 : 1.3 * Math.exp(-rb / 900));   // (just above the roofs)
      }
      // the blast rings of the big landings (just above the roofs, outrunning the dust)
      for (const { n, s: bs } of blasts) { const k = t - twLand(n), P = TW_ROUTE[n]; bs.setCone([0, 0, 0], [0, 1, 0], 0, 1);
        bs.setRing([P[0], n === 14 ? 2 : 24, P[2]], 30 + 380 * (1 - Math.exp(-k * 0.7)), away || k < 0 || k > 9 ? 0 : 1.6 * Math.exp(-k / 2.2)); }
      st.walkLine.material.opacity = mode === 'officeMap' ? 0.95 * MathX.smooth(u, 0.4, 1.2) : 0; st.walkLine.visible = mode === 'officeMap';
      // ---- the camera
      const dr = drift(t, cp.near && cp.near > 2 ? 0.0 : 0.012, shot.id.length);
      twCam(cam, [cp.p[0] + dr[0], cp.p[1] + dr[1], cp.p[2] + dr[2]], cp.at, cp.fov || 45);
      cam.near = cp.near || 0.05; cam.far = cp.far || 42000; cam.updateProjectionMatrix();
      // ---- the sun's shadow box: around the shot's subject, in whole texels
      const shR = cp.shR ?? 30;
      sun.castShadow = shR > 0;
      if (shR > 0) twShadowFollow(sun, cp.shC || (showYou ? twRouteAt(t).p : cp.at), shR, 2048, Math.max(400, shR * 4));
      set._mode = mode;
    },
    prerender() { if (set._portrait && !portraitDone) { set._portrait(); portraitDone = true; } },
    labels(t, shot) { const f = LAB[shot.mode]; return f ? f(t, shot) : []; },
    grade(t, p, shot) {
      const lk = look(shot.mode);
      if (lk === 'eve') { p.warmth = 0.12; p.exposure = 0.95; p.saturation = 1.1; p.vignette = 0.5; }
      else if (lk === 'snow') { p.warmth = -0.08; p.saturation = 0.85; p.exposure = 1.05; }
      else if (lk === 'future') { p.saturation = 0.9; p.soft = 0.12; p.bloom = 0.45; p.vignette = 0.55; }
      else { p.exposure = 1.04; p.saturation = 1.16; p.warmth = 0.04; }
      // the boom: a white flash and a shake
      const tb = twBoomAt(0, 0), fb = Math.exp(-Math.max(0, t - TW_BOOM.t) / 0.12) * (t > TW_BOOM.t ? 1 : 0);
      if (shot.mode === 'boomWide') p.flash = Math.max(p.flash, 0.5 * fb);
      if (shot.mode === 'glass' && t > tb) p.flash = Math.max(p.flash, 0.25 * Math.exp(-(t - tb) / 0.15));
      // a white-hot flash at the big landings
      for (const n of [12, 13, 14]) { const d = t - twLand(n); if (d > 0 && d < 0.6) { p.flash = Math.max(p.flash, 0.6 * Math.exp(-d / 0.12)); p.flashColor.setRGB(1, 0.92, 0.8); } }
      if (shot.mode === 'glowing' || shot.mode === 'mach9' || shot.mode === 'leap13') { p.bloom = 0.6; p.bloomThreshold = 0.75; p.warmth = 0.1; }
    },
  };
  return set;
};

// your pose, place, face for film time t in shot `shot`
function twPoseYou(you, t, shot, cam) {
  const R = twRouteAt(t), s = twStepAt(t), n = s.n, mode = shot.mode, M = TW_YOU_MODE[mode] || ['neutral'], X = M[2] || {};
  let pose, yaw = R.yaw, hands = 'relax', roll = 0, pitch = 0;
  const inStride = n >= 1 && (n >= 15 || t < TW_T[n] + TW_D[n]);
  const sinceLand = n >= 1 && n <= 14 ? t - (TW_T[n] + TW_D[n]) : 99;
  if (inStride) {
    const reach = n <= 2 ? 0.38 + 0.12 * n : n <= 4 ? 0.7 + 0.1 * (n - 3) : 1, lead = n % 2 ? 1 : -1;
    const arms = n === 5 ? 'flail' : n >= 15 ? 'up' : 'swing';
    pose = YOU_POSES.leap(n >= 15 ? Math.min(0.5, s.u * 3) : s.u, { lead, reach, arms, cup: true });
    if (n >= 10 && n <= 14) { pose.spine += 0.18 * Math.sin(Math.PI * s.u); pose.neck -= 0.12; }
    if (n >= 15) { pose.spine = -0.1; pose.neck = -0.3; }
    pitch = n >= 6 && n <= 14 ? -0.16 * Math.sin(Math.PI * s.u) : 0;
  } else if (sinceLand >= 0 && sinceLand < 0.9 && n >= 5) {
    pose = YOU_POSES.land(sinceLand / 0.9, { cup: true });
    yaw = twLerp(R.yaw, twStandYaw(t), 0);
  } else {
    pose = YOU_POSES.stand(t, { cup: true, neck: X.neck });
    yaw = twStandYaw(t);
    if (mode === 'lookBack') { const k = MathX.smooth(t - shot.t0, 0.2, 0.9) * (1 - MathX.smooth(t - shot.t0, 1.5, 1.9)); const lb = YOU_POSES.lookBack(t, k, 1); pose.spineYaw = lb.spineYaw; pose.headYaw = lb.headYaw; }
    if (mode === 'phones') pose.headYaw = 0.55;
    if (mode === 'stoop' && t > 2.9 && t < 3.9) { const k = Math.sin(MathX.clamp((t - 2.9) / 1.0, 0, 1) * Math.PI); pose.rSh = [0.55 + 0.75 * k, 0.12 + 0.1 * k]; pose.rEl = 1.35 + 0.6 * k; pose.neck = 0.05 - 0.15 * k; }
    if (mode === 'boomStreet' || mode === 'windows') { const lb = YOU_POSES.lookBack(t, 1, -1); pose.spineYaw = lb.spineYaw; pose.headYaw = lb.headYaw; }
    if (mode === 'park' || mode === 'missed') { pose.neck = 0.05; pose.lSh = [0.1, 0.1]; }
    if (mode === 'crater') { const k = 1 - MathX.smooth(t - shot.t0, 0.3, 1.8); const lp = YOU_POSES.land(1 - k, { cup: true }); pose = YouCharacter.mix(pose, lp, k); }
    if (X.phone) { pose.rSh = [0.95, 0.18]; pose.rEl = 1.6; pose.neck = 0.45; }
  }
  you.cup(!X.phone); you.phone(!!X.phone);
  you.place(R.p[0], R.p[1], R.p[2], yaw, roll, pitch);
  you.pose(pose, ['cup', 'relax']);
  you.expr(M[0], t, 1);
  if (M[1] === 'cam') you.look(cam.position); else if (Array.isArray(M[1])) you.look(M[1]); else you.look(null);
}
