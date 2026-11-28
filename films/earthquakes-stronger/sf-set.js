/* =====================================================================
   SF SET — San Francisco, the whole film's home set: the terrain, the bay, the city (sf-geo.js), its landmarks
   (sf-marks.js), the waterfront where you wait (waterfront.js), your helicopter (heli.js), you, the pilot, the people
   (cast.js), the gulls, the dust, the fires, the glass (fx.js), and a camera for every shot mode (shots.js).
   Story time: eqStoryOf(t, shot) (film.js) — real time from the first tick; the cold open pins the last minute.
   ===================================================================== */

// the sun at 9:56 AM on a Saturday in early October in San Francisco: south-east, 41° up
const EQ_SUN = (() => { const az = 128 * Math.PI / 180, al = 41 * Math.PI / 180; return [Math.sin(az) * Math.cos(al), Math.sin(al), -Math.cos(az) * Math.cos(al)]; })();
// move the sun's shadow box to `c` in whole texels (no crawling shadow edges)
function eqShadowFollow(sun, c, R, size = 2048, far = 600) {
  const d = new THREE.Vector3(...EQ_SUN).normalize(), up = new THREE.Vector3(0, 1, 0);
  const rx = new THREE.Vector3().crossVectors(up, d).normalize(), ry = new THREE.Vector3().crossVectors(d, rx).normalize();
  const tex = (2 * R) / size, C = new THREE.Vector3(c[0], c[1], c[2]);
  const a = Math.round(C.dot(rx) / tex) * tex, b = Math.round(C.dot(ry) / tex) * tex, w = C.dot(d);
  const S = rx.multiplyScalar(a).add(ry.multiplyScalar(b)).add(d.clone().multiplyScalar(w));
  const cam = sun.shadow.camera;
  if (cam.right !== R || cam.far !== far) { cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R; cam.near = 1; cam.far = far; cam.updateProjectionMatrix(); }
  sun.target.position.copy(S); sun.position.copy(S).addScaledVector(d, far * 0.5); sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
}

// ---- your morning (story seconds): at your table; up; drop and cover; run down the pier; knocked down; to the door;
// in. The run's keys: [s, u, v]
const EQ_RUN = [[155.4, 372.55, 10.0], [156.6, 375.0, 12.6], [158.0, 379.2, 17.6], [159.0, 380.0, 21.0], [179.9, 380.1, 128.0]];
const EQ_RUN2 = [[183.9, 380.1, 129.6], [188.2, 380.0, 150.0]];
const EQ_YT = { stand: 113.0, grab: 119.8, cover: eqW('drop') - EQ.tick0 + 2.2, up: eqW('never') - EQ.tick0 + 0.4, run: eqW('run') - EQ.tick0 - 0.1,
  fall: 180.25, rise: 183.9, door: 192.0, climb: eqW('in') - EQ.tick0 + 0.1, seated: eqW('in') - EQ.tick0 + 1.9, phone: eqW('phone') - EQ.tick0 - 0.3 };

// your face in each shot mode: [expression, look ('cam' | 'out' | null)]
const EQ_YOU_FACE = {
  openFace: ['scream', 'out'], cafeWide: ['calm'], faceFelt: ['surprise', 'cam'], cupRipple: ['neutral'], ruleFace: ['worry'], terraceRise: ['neutral'], jolt4: ['surprise'],
  youSee: ['worry'], jolt5: ['shock'], everyone: ['shock'], alert: ['worry'], drop: ['worry'], never: ['determined', 'cam'], run: ['determined'], pierRun: ['determined'],
  jolt6: ['scream'], in: ['determined'], start: ['worry', 'out'], cockpitWait: ['worry', 'out'], pierBreak: ['shock', 'out'], sky: ['awe', 'out'], phone: ['worry'],
  calm: ['sad', 'out'], air: ['scream', 'out'], fuel: ['worry'], last: ['sad', 'out'], question: ['awe', 'cam'],
};

EQ_SETS.sf = (app) => {
  const S = eqSet(app, { sky: '#8fc0ee', fog: 0.000055, fogColor: '#c3d8ea', fov: 45, near: 0.05, far: 60000,
    hemi: ['#d8e8f8', '#8a7a66', 1.05], sun: EQ_SUN.map((v) => v * 300), sunColor: '#fff2de', sunI: 3.0, shadow: 2048, shadowR: 40, shadowFar: 600, env: ['#8fc0ee', '#dfe6ee', '#6a6258'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  const sky = eqGradSky(scene, '#3d7fd4', '#cde2f2', '#a9bccb', { r: 55000, sunDir: EQ_SUN, sunGlow: '#fff0d0', hw: 0.28 });
  // ---- the world
  const ground = eqTerrain(scene), water = eqWater(scene);
  const marks = eqMarks(scene, app);
  const avoid = [[...eqLL(37.7952, -122.4028), 60], [...eqLL(37.7898, -122.3968), 50], [...eqLL(37.8024, -122.4058), 40], [...eqLL(37.7552, -122.4528), 50]];
  const city = eqCity(scene, avoid), crack = eqCrack(scene), faults = eqMapFaults(scene);
  const wf = eqWaterfront(scene, app), heli = eqHeli(scene);
  // the far ocean (under everything, past the terrain's edge)
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(300000, 300000), new THREE.MeshStandardMaterial({ color: '#2f6a86', roughness: 0.3, metalness: 0.1 })); m.rotation.x = -Math.PI / 2; m.position.y = -12; scene.add(m); }
  // ---- you, the pilot, the people
  const you = new YouCharacter(scene, { seed: 11 });
  const pilot = new YouCharacter(scene, { id: 'Pilot', seed: 23, head: 1.12, look: { skin: 4, shirt: '#1d2f4a', inner: '#e8e4da', pants: '#2b2f36', shoes: '#1a1a1a', sole: '#2a2a2a', hair: '#1a120c', hairStyle: 'pony', backpack: null, jacket: true }, iris: [60, 42, 28] });
  const hsYou = heli.headset(you.j.head), hsPilot = heli.headset(pilot.j.head);
  hsYou.position.y = 0.02; hsPilot.position.y = 0.02;
  const crowd = eqCrowd(scene, eqCrowdSpec());
  // ---- the gulls on the pier's railings (they leave in minute two)
  const birds = eqGulls(scene);
  // ---- particles and debris
  const soft = eqPuffs(scene, 14000, { soft: 1.4, near: [0.5, 6] }), adds = eqPuffs(scene, 7000, { additive: true, soft: 1.8, near: [0.3, 2] });
  const debris = eqDebris(scene, 900, eqStd('#8a7a68', 0.95));
  // the waterfront's events (story seconds): glass from the facades, the chimneys, the brick building, the split, the
  // pier, the sand boils, the rotor's spray
  const EV = [];
  for (const b of wf.blocks) {
    if (b.kind === 1 && !b.brick) continue;
    const uc = (b.u0 + b.u1) / 2, [x, z] = eqWF(uc, -52.3), n = EQ_WF.n;
    EV.push({ t: EQ_WFT.glass + eqR(Math.round(uc), 3) * 0.6, p: [x, EQ_GROUND_Y + Math.min(b.h, 40) * 0.55, z], kind: 'glass', dir: [n[0], n[1]], wide: b.u1 - b.u0, spread: Math.min(b.h, 40) * 0.9, n: 90, seed: Math.round(uc) + 7, life: 9, linger: 2.5, gs: 1.4 });
  }
  { const [x, z] = eqWF(380, -60);
    EV.push({ t: EQ_WFT.brick + 1.2, p: [x, EQ_GROUND_Y, z], kind: 'dust', size: 16, n: 70, seed: 41, life: 30, alpha: 0.7 });
    EV.push({ t: EQ_WFT.brick + 2.4, p: [x, EQ_GROUND_Y, z + 8], kind: 'impact', size: 9, n: 50, seed: 43, life: 22, alpha: 0.6 }); }
  for (let k = 0; k < 14; k++) { const [x, z] = eqWF(200 + k * 25, -30); EV.push({ t: eqW('split') - EQ.tick0 - 0.1 + k * 0.08, p: [x, EQ_GROUND_Y, z], kind: 'dust', size: 3.2, n: 12, seed: 60 + k, life: 9, alpha: 0.45 }); }
  for (const pc of wf.pier) { const [x, z] = eqWF(380, pc.v); EV.push({ t: pc.f + 0.9, p: [x, -0.5, z], kind: 'dust', size: 4.5, n: 22, seed: 90 + pc.k, life: 5, alpha: 0.75, white: true }); }
  const debrisEv = [{ t: EQ_WFT.brick + 1.6, p: [...(() => { const [x, z] = eqWF(380, -54); return [x, EQ_GROUND_Y + 10, z]; })()], n: 140, v: 7, up: 0.6, size: 1.1, seed: 7, life: 120, dir: [EQ_WF.n[0], EQ_WF.n[1]] },
    ...wf.chimneys.map((c, i) => ({ t: EQ_WFT.chimneys + c.i * 0.35 + Math.sqrt(2 * c.h / 9.8), p: (() => { const [x, z] = eqWF(c.u + 3, -c.v + 6); return [x, EQ_GROUND_Y + 0.5, z]; })(), n: 18, v: 3, up: 0.6, size: 0.35, seed: 20 + i, life: 120 }))];
  const boils = []; for (let k = 0; k < 60; k++) { const u = 230 + eqR(k, 3) * 300, v = -125 + eqR(k, 5) * 108; boils.push([u, v, eqR(k, 7)]); }

  const set = { scene, camera: cam, sun, sky, ground, water, city, crack, faults, marks, wf, heli, you, pilot, crowd, birds, soft, adds };
  const X = {};                                          // the shot's context (cameras, labels)
  const v3 = new THREE.Vector3();
  const WL = eqWL;

  // =================================================================================================================
  // per frame
  // =================================================================================================================
  set.frame = (t, shot, app2) => {
    void app2;
    const s = eqStoryOf(t, shot), mode = shot.mode, u = t - shot.t0, lvl = eqLevel(s);
    X.s = s; X.u = u; X.lvl = lvl;
    // ---- the world's shaders
    for (const M of [ground.mat]) { M.userData.U.uS.value = s; M.userData.U.uWaveA.value = eqWaveA(s); M.userData.U.uWet.value = MathX.smooth(s, EQ_WFT.wet, EQ_WFT.wet + 20); M.userData.U.uDust.value = MathX.smooth(s, 250, 330) * 0.7 + MathX.smooth(s, 420, 480) * 0.3; }
    water.mat.userData.U.uS.value = s;
    const CU = city.U; CU.uS.value = s; CU.uLevel.value = lvl; CU.uWaveA.value = eqWaveA(s); CU.uBreak.value = s < 186 ? 0 : 0.35 + 0.12 * Math.min(5, eqMinOf(s) - 4); CU.uDust.value = MathX.smooth(s, 250, 340) * 0.6;
    crack.frame(s);
    const fk = { faultMap: 1, fault: 1 }[mode] ? MathX.smooth(u, 0.8, 2.2) : 0; faults.mat.opacity = fk * 0.85; for (const m of faults.meshes) m.visible = fk > 0.01;
    marks.frame(s, lvl);
    wf.frame(s, lvl, cam.position);
    // ---- the helicopter (on the pad until lift-off; the pad's top moves as the pad shakes)
    const padTop = (() => { wf.pad.pad.updateMatrixWorld(true); const p = new THREE.Vector3(0, 0, 0).applyMatrix4(wf.pad.pad.matrixWorld); return [p.x, p.y, p.z]; })();
    heli.frame(s, padTop, lvl);
    // ---- you and the pilot
    eqPoseYou(you, s, t, shot, heli, wf, cam);
    eqPosePilot(pilot, s, t, shot, heli);
    hsYou.visible = s > EQ_YT.seated - 0.8; hsPilot.visible = s > EQ_HT.start - 1;
    // ---- the people, the gulls
    crowd.frame(s, cam, lvl);
    birds.frame(s);
    // ---- the camera
    const cp = eqSfCam(mode, u, s, set, X, shot) || { p: [600, 300, 600], at: [0, 0, 0], fov: 45 };
    let [px, py, pz] = cp.p; let roll = cp.roll || 0;
    if (cp.shake === 'ground') { const a = eqGround(s, 0.02, 101), k = cp.shakeK ?? 1; px += a[0] * k; py += a[1] * k * 0.7; pz += a[2] * k; roll += a[0] * k * 12 * (cp.shakeRoll ?? 1); }
    if (cp.shake === 'heli' || cp.local) { /* (riding the helicopter: the camera is in its frame) */ }
    const dr = eqDrift(t, cp.drift ?? 0.012, shot.id.length);
    if (cp.local) {
      heli.toWorld(cp.p[0], cp.p[1], cp.p[2], v3); const P = [v3.x + dr[0] * 0.3, v3.y + dr[1] * 0.3, v3.z + dr[2] * 0.3];
      heli.toWorld(cp.at[0], cp.at[1], cp.at[2], v3); const A = [v3.x, v3.y, v3.z];
      eqCam(cam, P, A, cp.fov || 45, roll); cam.up.set(0, 1, 0);
      // (the camera rolls with the helicopter)
      const q = new THREE.Quaternion().setFromEuler(heli.g.rotation); const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(q); cam.up.copy(upv); cam.lookAt(A[0], A[1], A[2]); if (roll) cam.rotateZ(MathX.deg(roll));
    } else eqCam(cam, [px + dr[0], py + dr[1], pz + dr[2]], cp.at, cp.fov || 45, roll, cp.tilt || 0);
    cam.near = cp.near || 0.05; cam.far = cp.far || 60000; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    X.cp = cp;
    // ---- particles
    soft.begin(); adds.begin();
    const near = cam.position.y < 140 && Math.hypot(...[cam.position.x - EQ_EPI[0], cam.position.z - EQ_EPI[1]]) < 1500;
    if (near) {
      for (const ev of EV) { if (s < ev.t - 0.1 || s > ev.t + (ev.life || 9)) continue; if (ev.white) { const e = Object.assign({}, ev, { kind: 'dust' }); eqBurst(soft, adds, s, e); } else eqBurst(soft, adds, s, ev); }
      // the sand boils: spurts of grey water from the fill (from "Shaking turns it into mud")
      if (s > EQ_WFT.wet - 1 && s < 400) for (const [bu, bv, r] of boils) {
        const per = 2.2 + r * 2.5, ph = ((s + r * 9) % per) / per, [x, z] = eqWF(bu, bv); if (s < EQ_WFT.wet + r * 8) continue;
        for (let k = 0; k < 4; k++) soft.add(x + (eqR(k, r * 99) - 0.5) * 0.6, EQ_GROUND_Y + 0.2 + ph * (1.2 + r) * (1 - ph) * 3, z + (eqR(k + 9, r * 99) - 0.5) * 0.6, 0.35 + 0.4 * ph, 0.5 * (1 - ph), 0.45, 0.42, 0.36);
      }
      // the rotor's downwash (spray off the water once it's moving out over the bay)
      if (s > EQ_HT.lift - 6 && s < EQ_HT.lift + 12) {
        const hp = heli.g.position, k = MathX.smooth(s, EQ_HT.lift - 6, EQ_HT.lift) * (1 - MathX.smooth(s, EQ_HT.lift + 6, EQ_HT.lift + 12)), gy = Math.max(-0.3, Math.min(hp.y - 1, 2.6));
        for (let i = 0; i < 70; i++) { const a = eqR(i, 3) * 6.283, ph = ((s * 0.9 + eqR(i, 5)) % 1), r = 3 + ph * 11; soft.add(hp.x + Math.cos(a) * r, gy + 0.4 + ph * 1.5, hp.z + Math.sin(a) * r, 0.8 + ph * 2.2, 0.32 * k * (1 - ph), 0.88, 0.9, 0.9); }
      }
    }
    // the city's dust and fires (the aerial shots), the wave's spray
    if (cam.position.y > 60 || !near) eqCityFx(soft, adds, s, city.info, cam, { range: cp.fxRange || 7000, max: 220, fires: 80 });
    if (s > EQ_BAY.out1 && s < EQ_BAY.wave + 16) {
      const front = (EQ_BAY.wave - s) * EQ_BAY.speed + 120;
      for (let i = 0; i < 160; i++) { const uu = -600 + eqR(i, 3) * 1500, vv = front + (eqR(i, 5) - 0.3) * 30, [x, z] = eqWF(uu, vv), y = eqBayY(vv, s) + 1 + eqR(i, 7) * 6;
        soft.add(x, y, z, 6 + eqR(i, 9) * 8, 0.55 * MathX.smooth(s, EQ_BAY.out1, EQ_BAY.out1 + 3), 0.93, 0.95, 0.96); }
    }
    soft.end(); adds.end();
    debris.frame(s, near ? debrisEv : [], EQ_GROUND_Y + 0.15);
    // ---- the sun's shadow box: around the shot's subject, in whole texels
    const shR = cp.shR ?? 40;
    sun.castShadow = shR > 0;
    if (shR > 0) eqShadowFollow(sun, cp.shC || cp.at, shR, 2048, Math.max(600, shR * 5));
    sky.material.uniforms.k.value = cp.skyK || 1;
    scene.fog.density = cp.fog ?? (0.000055 + MathX.smooth(s, 250, 420) * 0.00005);
    set._mode = mode;
  };
  set.labels = (t, shot) => eqSfLabels(shot.mode, t - shot.t0, eqStoryOf(t, shot), set, X);
  set.grade = (t, p, shot) => {
    const s = eqStoryOf(t, shot), cp = X.cp || {};
    p.exposure = 1.04; p.saturation = 1.18; p.warmth = 0.03; p.contrast = 1.08;
    // the dust in the air lowers the contrast and warms the light as the city falls
    const dust = MathX.smooth(s, 250, 420) * 0.6 + MathX.smooth(s, 420, 540) * 0.3;
    p.contrast -= dust * 0.08; p.warmth += dust * 0.08; p.saturation -= dust * 0.12;
    if (cp.inside) { p.vignette = 0.5; p.exposure = 1.0; }
    // the molten crack (minute ten): a red light from below
    if (s > 545) { p.warmth += 0.08; p.bloom = 0.5; p.bloomThreshold = 0.8; }
    if (cp.grade) cp.grade(p, s);
  };
  return set;
};

// ---------------------------------------------------------------------------------------------------------------------
// YOU: where you are and how you stand at story time s
// ---------------------------------------------------------------------------------------------------------------------
function eqPoseYou(you, s, t, shot, heli, wf, cam) {
  const mode = shot.mode, F = EQ_YOU_FACE[mode] || ['neutral'], Y0 = EQ_GROUND_Y + 0.35, T = EQ_YT;
  let pose, pos, yaw, hands = 'relax';
  const seatW = eqWL(EQ_SEAT.u, Y0, EQ_SEAT.v), faceFerry = eqYawWF(1, 0);   // (you face the Bay Bridge, south-east)
  you.cup(false); you.phone(false); you.visible(true);
  if (s < T.stand) {
    pose = EQ_P.sit(s, 3); pose.rSh = [0.62, 0.16]; pose.rEl = 1.45; pose.headYaw = 0.12 * noise1(s * 0.2, 4);
    if (mode === 'faceFelt' || mode === 'cupRipple') { pose.neck = mode === 'cupRipple' ? 0.5 : -0.12; pose.headYaw = 0.25; }
    if (mode === 'ruleFace' || mode === 'cupMacro' || mode === 'cup') pose.neck = 0.45;
    if (s > 64 && s < 70) pose.headYaw = 0.6 * Math.sin(MathX.clamp((s - 64.5) / 5, 0, 1) * Math.PI);
    if (s > 108 && s < T.stand) pose.headYaw = MathX.lerp(0, 1.0, MathX.smooth(s, 108, 110));     // (left: to the pier)
    pos = seatW; yaw = faceFerry;
  } else if (s < T.run) {
    // standing by your table, facing the pier; the jolt: grab the table; drop and cover; up again
    const stand = YOU_POSES.stand(s, {}), sitp = EQ_P.sit(s, 3), k = MathX.smooth(s, T.stand, T.stand + 1.4);
    pose = YouCharacter.mix(sitp, stand, k);
    if (s > T.grab && s < T.cover) { const g = EQ_P.stagger(s - T.grab, 5); pose = YouCharacter.mix(pose, g, MathX.smooth(s, T.grab, T.grab + 0.3) * 0.8); }
    if (s > eqW('alert') - EQ.tick0 && s < eqW('crowd') - EQ.tick0) { pose.rSh = [0.95, 0.18]; pose.rEl = 1.55; pose.neck = 0.42; you.phone(true); }
    if (s > T.cover - 0.3 && s < T.up + 0.8) pose = YouCharacter.mix(pose, EQ_P.cover(s - T.cover, 5), MathX.smooth(s, T.cover - 0.3, T.cover + 0.3) * (1 - MathX.smooth(s, T.up, T.up + 0.8)));
    pos = eqWL(EQ_SEAT.u - 0.1 * k, Y0, EQ_SEAT.v + 0.6 * k);
    yaw = MathX.lerp(faceFerry, eqYawWF(0.35, 1), k);
  } else if (s < T.fall) {
    const K = s < EQ_RUN[EQ_RUN.length - 1][0] ? EQ_RUN : EQ_RUN;
    const q = eqKey(K, s, (x) => x), q2 = eqKey(K, s + 0.2, (x) => x);
    const onPier = q[1] > 20.5, y = onPier ? EQ_GROUND_Y + 0.4 : Y0;
    pose = YOU_POSES.run(s * 10.5, 0.85, {}); const g = eqGround(s, 0, 17); pose.spineRoll = g[0] * 2.5; pose.lSh[1] += Math.abs(g[2]) * 4;
    pos = eqWL(q[0], y, q[1]); yaw = eqYawWF(q2[0] - q[0] || 0.0001, q2[1] - q[1]);
  } else if (s < T.rise) {
    // thrown down by the magnitude-six jolt, on hands and knees, up again
    const k = MathX.smooth(s, T.fall, T.fall + 0.5), r = MathX.smooth(s, T.rise - 1.2, T.rise);
    const down = EQ_P.cover(s, 5); down.spine = 0.9; down.neck = -0.2;
    pose = YouCharacter.mix(YouCharacter.mix(YOU_POSES.run(s * 10, 0.8), down, k), YOU_POSES.stand(s), r);
    pos = eqWL(380.1, EQ_GROUND_Y + 0.4, 128 + 1.6 * k); yaw = eqYawWF(0, 1);
  } else if (s < T.climb) {
    const door = heli.toWorld(1.55, 0.0, 0.7), D = eqUV(door.x, door.z);
    const K = [...EQ_RUN2, [T.door, D[0], D[1]]], q = eqKey(K, Math.min(s, T.door), (x) => x), q2 = eqKey(K, Math.min(s, T.door) + 0.2, (x) => x);
    if (s < T.door) { pose = YOU_POSES.run(s * 9.5, 0.6); const g = eqGround(s, 0, 19); pose.spineRoll = g[0] * 3; pos = eqWL(q[0], EQ_GROUND_Y + 0.4 + 0.25, q[1]); yaw = eqYawWF(q2[0] - q[0] || 0.0001, q2[1] - q[1]); }
    else { pose = EQ_P.stagger(s, 5); pose.rSh = [1.7, 0.4]; pose.rEl = 0.3; pos = [door.x, door.y, door.z]; const c = heli.toWorld(0.45, 1.0, 0.8); yaw = Math.atan2(c.x - door.x, c.z - door.z); }
  } else {
    // into the cabin (over 1.8 s), then seated on the left, the headset on
    const door = heli.toWorld(1.55, 0.0, 0.7), seat = heli.toWorld(0.45, 0.93, 0.80), k = MathX.smooth(s, T.climb, T.seated);
    const sitp = EQ_P.sit(s, 3);
    pose = YouCharacter.mix(YOU_POSES.stand(s), sitp, MathX.smooth(k, 0.4, 1));
    const lift = Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5) * 0.95;
    pos = [MathX.lerp(door.x, seat.x, k), MathX.lerp(door.y, seat.y, MathX.smooth(k, 0.5, 1)) + (k < 1 ? lift * (1 - MathX.smooth(k, 0.6, 1)) : 0), MathX.lerp(door.z, seat.z, k)];
    const fw = heli.toWorld(0.45, 0.93, 3.0), toSeat = Math.atan2(seat.x - door.x, seat.z - door.z), fwd = Math.atan2(fw.x - seat.x, fw.z - seat.z);
    yaw = k < 1 ? MathX.lerp(toSeat, fwd, MathX.smooth(k, 0.5, 1)) : fwd;
    if (s > T.seated) {
      // in flight: hands on the knees; gripping in the jolts; your phone (minute six); leaning to the window
      const jolt = eqMinOf(s) !== eqMinOf(s - 2.5) || (s > eqW('air') - EQ.tick0 - 0.4 && s < eqW('tokyo') - EQ.tick0);
      if (jolt) { const g = EQ_P.sitGrip(s, 3); pose.lSh = g.lSh; pose.rSh = g.rSh; pose.lEl = g.lEl; pose.rEl = g.rEl; pose.spine = g.spine; }
      if (s > T.phone && s < eqW('notjust') - EQ.tick0 + 1) { pose.rSh = [0.85, 0.12]; pose.rEl = 1.75; pose.lSh = [0.7, 0.1]; pose.lEl = 1.6; pose.neck = 0.5; you.phone(true); }
      if (F[1] === 'out') { pose.headYaw = 0.55; pose.neck = 0.18; }
      // (the helicopter tilts: you tilt with it)
      const r = heli.g.rotation; you.place(pos[0], pos[1], pos[2], yaw, r.z * Math.cos(yaw - r.y) - r.x * Math.sin(yaw - r.y), r.x * Math.cos(yaw - r.y) + r.z * Math.sin(yaw - r.y));
      you.pose(pose, hands); you.expr(F[0], s, 1);
      if (F[1] === 'cam') you.look(cam.position); else if (F[1] === 'out') you.look(heli.toWorld(8, 0, 30)); else you.look(null);
      return;
    }
  }
  you.place(pos[0], pos[1], pos[2], yaw);
  you.pose(pose, hands);
  you.expr(F[0], s, 1);
  if (F[1] === 'cam') you.look(cam.position); else you.look(null);
}
function eqPosePilot(pilot, s, t, shot, heli) {
  void t;
  if (s < EQ_HT.start - 0.6) {
    // by the nose of the helicopter, then beckoning you over
    const p = heli.toWorld(-0.5, 0, 3.6), f = heli.toWorld(-0.5, 0, 9);
    let pose = s > eqW('pilot') - EQ.tick0 - 0.2 ? EQ_P.beckon(s, 2) : EQ_P.phone(s, 2);
    pilot.place(p.x, p.y, p.z, Math.atan2(f.x - p.x, f.z - p.z)); pilot.pose(pose); pilot.expr(s > eqW('pilot') - EQ.tick0 ? 'worry' : 'neutral', s, 1);
    pilot.phone(pose === undefined ? false : s < eqW('pilot') - EQ.tick0 - 0.2); pilot.look(null);
    return;
  }
  const seat = heli.toWorld(-0.45, 0.93, 0.8), fw = heli.toWorld(-0.45, 0.93, 3), yaw = Math.atan2(fw.x - seat.x, fw.z - seat.z);
  const pose = EQ_P.sit(s, 2); pose.rSh = [0.85, -0.05]; pose.rEl = 0.9; pose.lSh = [0.55, 0.25]; pose.lEl = 1.1; pose.neck = 0.05;
  if (s > eqW('fuel') - EQ.tick0 - 0.3 && s < eqW('nowhere') - EQ.tick0) { pose.lSh = [1.25, -0.2]; pose.lEl = 0.6; pose.neck = 0.35; pose.headYaw = 0.25; }
  if (s < EQ_HT.lift) { pose.lSh = [1.1, 0.1]; pose.lEl = 0.7 + 0.2 * Math.sin(s * 2); pose.headYaw = 0.2 * Math.sin(s * 0.7); }
  const r = heli.g.rotation;
  pilot.place(seat.x, seat.y, seat.z, yaw, r.z * Math.cos(yaw - r.y) - r.x * Math.sin(yaw - r.y), r.x * Math.cos(yaw - r.y) + r.z * Math.sin(yaw - r.y));
  pilot.pose(pose); pilot.phone(false);
  pilot.expr(s > 300 ? 'determined' : 'worry', s + 3, 1); pilot.look(null);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE PEOPLE: who is where, and what they do (story seconds)
// ---------------------------------------------------------------------------------------------------------------------
function eqCrowdSpec() {
  const L = [], st = EQ_GROUND_Y + 0.15, terrace = EQ_GROUND_Y + 0.35, alert = eqW('alert') - EQ.tick0, crowdS = eqW('crowd') - EQ.tick0, cover = eqW('drop') - EQ.tick0 + 1.5;
  const add = (o) => L.push(o);
  let li = 0; const look = () => EQ_LOOKS[(li++ * 7) % EQ_LOOKS.length];
  // the terrace: two at most of the other tables
  [[368, 4.5], [376, 5.0], [383, 11.5], [377, 16.5], [366.5, 15.5], [385.5, 4.5], [384, 17.5]].forEach(([u, v], i) => {
    for (const side of i % 3 === 2 ? [1] : [1, -1]) {
      const cu = u + side * 0.66, base = ['sitTalk', 'sitPhone', 'sit'][(i + (side > 0 ? 0 : 1)) % 3];
      add({ look: look(), u: cu, v, yaw: [-side, 0], y: terrace, script: [[-9, base], [65.2 + i * 0.3, 'sitStare', 0.7 * side], [67.5 + i * 0.2, base], [119.9, 'sitGrip'], [124.3 + i * 0.1, 'stagger'], [alert + i * 0.15, 'phone'], [cover - 0.6 + i * 0.2, 'cover'], [eqW('run') - EQ.tick0 + 0.4 + i * 0.3, 'run']],
        run: [-0.4 + side * 0.3, -1, 7, 4.2], until: 396 });
    }
  });
  // the promenade: people walking up and down, a couple at the railing, joggers
  for (let k = 0; k < 14; k++) {
    const u = 250 + k * 19 + eqR(k, 3) * 8, v = -2.5 - eqR(k, 5) * 10, dir = k % 2 ? 1 : -1;
    add({ look: look(), u, v, yaw: [dir, 0], y: st, walk: [dir, 0, 18 + eqR(k, 7) * 20], script: [[-9, 'walk'], [124.2 + eqR(k, 9) * 0.6, 'stagger'], [alert + 0.2 + eqR(k, 11) * 0.8, 'phone'], [cover + eqR(k, 13), 'duck'], [eqW('run') - EQ.tick0 + 0.8 + eqR(k, 15) * 2, 'run'], [178 + k * 0.3, 'stagger'], [181 + k * 0.2, 'run']],
      run: [eqR(k, 17) - 0.5, -1, 12, 4.6], until: 396 });
  }
  // the inland pavement, and the people who pour out of the shops and offices (from "People pour out…")
  for (let k = 0; k < 10; k++) {
    const u = 240 + k * 26 + eqR(k, 21) * 10, dir = k % 2 ? 1 : -1;
    add({ look: look(), u, v: -49 + eqR(k, 23) * 2, yaw: [dir, 0], y: st, walk: [dir, 0, 22], script: [[-9, 'walk'], [124.5, 'stagger'], [alert + 0.5, 'phone'], [crowdS + 1, 'lookUp', 0.4], [cover + 0.5, 'duck'], [eqW('run') - EQ.tick0 + 1.5, 'run']], run: [eqR(k, 25) - 0.5, 1, 9, 4.4], until: 396 });
  }
  for (let k = 0; k < 16; k++) {
    const u = 262 + k * 22 + eqR(k, 31) * 9;
    add({ look: look(), u, v: -53.5, yaw: [0, 1], y: st, from: crowdS - 0.5, script: [[-9, 'idle'], [crowdS - 0.4 + eqR(k, 33) * 1.5, 'run'], [cover + eqR(k, 35), 'duck'], [eqW('run') - EQ.tick0 + 1 + eqR(k, 37) * 2, 'run']],
      run: [eqR(k, 39) - 0.5, 1, 3.5 + eqR(k, 41) * 3, 4.0], until: 396 });
  }
  // two people fishing on the pier (they watch the gulls go, then run back)
  [[60, 'eqF'], [96, 'eqB']].forEach(([v, lk], k) => add({ look: lk, u: 384.6, v, yaw: [1, 0], y: EQ_GROUND_Y + 0.4, script: [[-9, 'idle'], [eqW('birds') - EQ.tick0, 'lookUp', 0.6], [124.5, 'stagger'], [128 + k, 'run']], run: [-0.06, -1, 18 + k * 6, 4.5], until: 300 }));
  return L;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE GULLS: sitting on the railings; at "The birds have already left" they lift off together and fly out over the bay
// ---------------------------------------------------------------------------------------------------------------------
function eqGulls(scene) {
  const white = eqStd('#f4f4f0', 0.7), grey = eqStd('#9aa0a6', 0.7), list = [];
  const t0 = eqW('birds') - EQ.tick0 - 2.6;
  for (let i = 0; i < 18; i++) {
    const g = new THREE.Group(); scene.add(g);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), white); body.scale.set(1, 0.9, 2.4); g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), white); head.position.set(0, 0.08, 0.24); g.add(head);
    const wings = [-1, 1].map((sd) => { const w = new THREE.Group(); w.position.set(sd * 0.06, 0.04, 0); g.add(w); const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.015, 0.22), grey); m.position.x = sd * 0.3; w.add(m); return w; });
    const onPier = i < 12, u = onPier ? 374.2 + (i % 2) * 11.6 : 362 + (i - 12) * 4.2, v = onPier ? 28 + i * 9.5 : 20;
    list.push({ g, wings, u, v, y: (onPier ? EQ_GROUND_Y + 0.4 : EQ_GROUND_Y + 0.35) + 1.15, i, t: t0 + eqR(i, 3) * 1.4 });
  }
  return {
    frame(s) {
      for (const b of list) {
        const u = s - b.t, [x0, z0] = eqWF(b.u, b.v);
        if (u < 0) { b.g.position.set(x0, b.y, z0); b.g.rotation.set(0, eqYawWF(0, 1) + b.i, 0); b.wings.forEach((w, k) => { w.rotation.z = (k ? -1 : 1) * 1.35; }); b.g.visible = true; continue; }
        // up and away: north-east over the bay, climbing, flapping
        const d = 8 * u + 2.2 * u * u, [x, z] = eqWF(b.u + (eqR(b.i, 5) - 0.5) * d * 0.5, b.v + d), y = b.y + 2.2 * u + 0.4 * u * u;
        b.g.position.set(x, y, z); b.g.rotation.set(-0.25, eqYawWF((eqR(b.i, 5) - 0.5) * 0.5, 1), 0.15 * Math.sin(u * 2 + b.i));
        const f = Math.sin(u * (11 + b.i % 3) + b.i) * 0.9; b.wings.forEach((w, k) => { w.rotation.z = (k ? -1 : 1) * f; });
        b.g.visible = u < 30;
      }
    },
  };
}
