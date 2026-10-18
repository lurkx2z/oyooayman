/* =====================================================================
   HOME — the flat (home-room.js builds it). One set, many scenes (shot modes):
     cold      the cold open: the lamp switches on and its light crawls across the floor (c = SL.cLamp)
     title     the evening room under the title card
     rule      on the sofa, the sunset; light starts slowing
     call      the video call with Gran (her picture arrives later and later)
     map       the map app: GPS is radio, radio is light
     window    at the glass: the Sun's light arrives slower, so less of it does; night comes early
     fireworks the balcony: flash and bang (home-fireworks.js)
     laser     the cat beats a laser dot to the wall (she runs faster than light; she reads as a dark silhouette)
     mirror    the hall mirror: your reflection two seconds late; walking: everything ahead blue, behind dark red
     lamp      switch off: the room stays lit, then the dark spills out of the lamp; switch on: the egg of light
     knock     you hear your knuckles on the table seconds before you see your hand land
     freeze    nothing new reaches you; the picture fades as light stops
     xray      (illustration) every light in the flat is on; its light goes nowhere
     after     the end card: the evening room
   ===================================================================== */

// your hands (camera space, the right hand; ViewerHands mirrors them for the left)
const SL_HPOSE = {
  phone:  { p: [0.115, -0.05, -0.31], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  phoneT: { p: [0.115, -0.048, -0.31], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.88, 0.75] },
  laser:  { p: [0.15, -0.21, -0.42], F: [-0.32, 0.16, -1], N: [-1, 0.15, -0.2], curl: [1.25, 1.35, 1.4, 1.45], thumb: [0.35, 0.75] },
  press:  { p: [0.15, -0.212, -0.42], F: [-0.32, 0.16, -1], N: [-1, 0.15, -0.2], curl: [1.25, 1.35, 1.4, 1.45], thumb: [0.2, 1.15] },
  waveA:  { p: [0.17, -0.07, -0.42], F: [-0.32, 1, -0.08], N: [0.05, 0.12, -1], curl: [0.08, 0.06, 0.1, 0.16], thumb: [0.85, 0.1] },
  waveB:  { p: [0.21, -0.065, -0.42], F: [0.3, 1, -0.08], N: [0.05, 0.12, -1], curl: [0.08, 0.06, 0.1, 0.16], thumb: [0.85, 0.1] },
  // a finger to the light switch (aimed each frame at the rocker)
  point:  { p: [0.3, -0.3, -0.5], F: [0.6, 0.0, -0.8], N: [-0.2, -0.6, -0.75], curl: [0.05, 1.35, 1.45, 1.5], thumb: [0.4, 0.9], aim: [0.009, 0.165, 0.0] },
  pointIn:{ p: [0.3, -0.3, -0.5], F: [0.6, 0.0, -0.8], N: [-0.2, -0.6, -0.75], curl: [0.05, 1.35, 1.45, 1.5], thumb: [0.4, 0.9], aim: [0.009, 0.165, 0.0] },
  // the knock: a loose fist over the table, the knuckles down onto it (aimed each frame at the table)
  fistUp: { p: [0.05, -0.1, -0.3], F: [-0.35, -0.45, -0.82], N: [-0.15, -0.85, 0.5], curl: [1.45, 1.55, 1.6, 1.6], thumb: [0.35, 0.95], aim: [0.0, 0.12, 0.03] },
  fistDn: { p: [0.05, -0.1, -0.3], F: [-0.35, -0.45, -0.82], N: [-0.15, -0.85, 0.5], curl: [1.45, 1.55, 1.6, 1.6], thumb: [0.35, 0.95], aim: [0.0, 0.1, 0.05] },
  lift:   { p: [0.05, -0.1, -0.3], F: [-0.35, -0.45, -0.82], N: [-0.15, -0.85, 0.5], curl: [1.45, 1.55, 1.6, 1.6], thumb: [0.35, 0.95], aim: [0.0, 0.12, 0.03] },
  // your hand resting flat on the table, palm down (aimed each frame)
  rest:   { p: [0.05, -0.15, -0.3], F: [-0.2, 0.7, -0.7], N: [0, -0.7, -0.7], curl: [0.22, 0.26, 0.3, 0.36], thumb: [0.55, 0.25], aim: [0.0, 0.06, 0.016] },
};
// the knock's hand directions in the world (F: wrist → fingers, N: out of the palm)
const SL_KNOCK_DIR = { rest: [[-0.22, 0, -1], [0, -1, 0]], fist: [[-0.12, -0.3, -0.95], [-0.05, -0.95, 0.3]] };
const SL_HBLEND = { phone: 0.55, phoneT: 0.12, laser: 0.6, press: 0.08, waveA: 0.2, waveB: 0.2, point: 0.45, pointIn: 0.1, fistUp: 0.11, fistDn: 0.06, lift: 0.75, rest: 0.6, hidden: 0.5 };
function slHandScript() {
  const R = [[0, 'hidden']];
  R.push([SL.call + 0.1, 'phone'], [SL.call + 3.7, 'phoneT'], [SL.call + 3.9, 'phone'], [SL.mapSea - 1.2, 'phoneT'], [SL.mapSea - 1.0, 'phone'], [SL.sun - 0.5, 'hidden']);
  R.push([SL.cat + 1.2, 'laser'], [SL.laserOn, 'press'], [SL.laserOn + 0.35, 'laser'], [SL.mirror - 0.2, 'hidden']);
  for (let k = 0; k < 8; k++) R.push([SL.wave + k * 0.24, k % 2 ? 'waveB' : 'waveA']);
  R.push([SL.wave + 8 * 0.24 + 0.1, 'hidden']);
  R.push([SL.lampOff - 0.75, 'point'], [SL.lampOff - 0.06, 'pointIn'], [SL.lampOff + 0.1, 'point'], [SL.lampOff + 0.9, 'hidden']);
  R.push([SL.lampOn - 0.75, 'point'], [SL.lampOn - 0.06, 'pointIn'], [SL.lampOn + 0.1, 'point'], [SL.lampOn + 0.9, 'hidden']);
  // the knock: your hand rests on the table; you lift it, knock three times (heard at SL.knockHit, +0.32, +0.64) and
  // rest it again (the knock scene only ever shows it from SL.knock + 0.7 on, as you see it: seconds late)
  R.push([SL.knock, 'rest'], [SL.knockHit - 1.3, 'lift']);
  for (let k = 0; k < 3; k++) R.push([SL.knockHit + k * 0.32 - 0.06, 'fistDn'], [SL.knockHit + k * 0.32 + 0.04, 'fistUp']);
  R.push([SL.knockHit + 1.1, 'rest'], [SL.last, 'hidden']);
  R.sort((a, b) => a[0] - b[0]);
  return { right: R, left: [[0, 'hidden']] };
}
// aim a pose so a point in the hand (hand units) lands on a world point, seen from the camera now
const _slAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3() };
function slAimHand(P, camera, world) {
  const A = _slAim;
  A.y.set(P.F[0], P.F[1], P.F[2]).normalize();
  A.z.set(P.N[0], P.N[1], P.N[2]); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize();
  A.x.crossVectors(A.y, A.z);
  camera.updateMatrixWorld(true);
  A.c.set(world[0], world[1], world[2]).applyMatrix4(camera.matrixWorldInverse);
  const l = P.aim;
  for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}

// a look for the "you" in the mirror (the hands' sleeves: a slate hoodie)
LOOKS.slYou = { skin: 1, build: 'avg', shirt: '#3f4a5a', sleeves: 'long', pants: '#2e3138', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#2a1d16', jacket: true, hood: true };
LOOKS.slMum = { skin: 1, build: 'slim', shirt: '#6a4a3c', sleeves: 'long', pants: '#2b2b30', shoes: '#1a1a1a', sole: '#2a2a2a', hair: '#3a2418', hairStyle: 'bun', coat: true, collar: true, scarf: '#a8562a', shoulderBag: '#4a3426' };

// where you are (eye) and look in each scene
const SL_SOFA = [-0.35, 1.12, 1.35];
const SL_SWITCH_EYE = [2.75, 1.62, 2.15];
const SL_LASER_EYE = [-2.35, 1.55, 0.55];
const SL_TABLE_EYE = [-2.3, 1.06, -1.0];
const SL_KNOCK_AT = [-2.245, 0.755, -1.24];             // (SL.knockDist from SL_TABLE_EYE)
const SL_MIRROR_EYE = [SL_HOME.mirror.x - 0.012 - SL.mirrorDist, 1.62, SL_HOME.mirror.z];
SL.walkCut = slS('walk') - 0.55;                       // (a cut: you start at the far end of the hall)
SL.walkGo = slS('walk') + 0.2;
SL.walkU = 0.55;                                       // m/s (you walk at two-fifths of the speed of light)
// the moment the light you see now left a thing d metres away (light that set out at te has covered ∫ c from te to t)
function slSeenAcross(t, d) {
  let acc = 0, x = t;
  const dt = 0.02;
  for (let i = 0; i < 20000; i++) {
    const c = slC(x - dt * 0.5);
    if (acc + c * dt >= d) return x - (d - acc) / Math.max(c, 1e-9);
    acc += c * dt; x -= dt;
  }
  return x;
}
function slWalkX(t) {                                  // the hall walk: x of your eye (ease in, then steady)
  const x0 = 0.05, u = SL.walkU, a = 0.6;
  if (t < SL.walkGo) return x0;
  const dt = t - SL.walkGo;
  return dt < a ? x0 + u * dt * dt / (2 * a) : x0 + u * a / 2 + u * (dt - a);
}

SL_SETS.home = (app) => {
  const S = slSet(app, { sky: '#0b0d12', fov: 55, near: 0.02, far: 6000, hemi: ['#c7d6ea', '#6a5a4a', 0.5], sun: [-0.78 * 40, 0.07 * 40 + 3, -0.62 * 40], sunColor: '#ffbf80', sunI: 2.2, shadow: 2048, shadowR: 6, shadowFar: 80, env: ['#3d5a80', '#d7a070', '#2a2622'] });
  const scene = S.scene, cam = S.camera, H = SL_HOME;
  S.sun.target.position.set(0, 0, 0);
  const P = slBuildHome(app, S), O = P.outside;
  // ---- the cat
  const catRoot = new THREE.Group(); scene.add(catRoot);
  const cat = slBuildCat(catRoot);
  // ---- your hands, your phone, the laser pointer
  const hands = new ViewerHands(cam, { scale: 1.0, skin: '#d9a888', nail: '#e6c4b4', sleeve: '#3f4a5a', cuff: '#333c49', watch: false, sleeveLen: 1.0, sleeveFit: 0.85, poses: SL_HPOSE, blends: SL_HBLEND, script: slHandScript() });
  hands.root.traverse((o) => o.layers.set(2)); cam.layers.enable(2);
  const phoneTex = slPhoneScreen();
  const phone = new THREE.Group();
  { const b = new THREE.Mesh(slRoundBox(0.074, 0.0085, 0.158, 0.009, 0.002), slStd('#23262c', 0.35, 0.4)); b.rotation.x = Math.PI / 2; b.position.z = -0.0085; phone.add(b); }
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.0685, 0.148), new THREE.MeshBasicMaterial({ map: phoneTex.tex, toneMapped: true }));
  screen.position.z = 0.0007; phone.add(screen);
  phone.position.set(0.034, 0.074, 0.024); phone.rotation.set(0, 0, -Math.PI / 2);
  hands.right.g.add(phone);
  const laser = new THREE.Group();
  laser.add(new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0068, 0.14, 14), slStd('#2b2f36', 0.35, 0.7)));
  const lbtn = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.006), slStd('#b33a2c', 0.4)); lbtn.position.set(0, 0.02, -0.0066); laser.add(lbtn);
  laser.position.set(-0.005, 0.072, 0.012); hands.right.g.add(laser);
  for (const o of [phone, laser]) o.traverse((m) => { m.layers.set(2); m.frustumCulled = false; });
  // the laser's beam (a faint line through the dust), its leading edge, the dot on the wall
  const beamM = new THREE.MeshBasicMaterial({ color: '#ff2a1a', transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, 0.5, 0), beamM); beam.frustumCulled = false; beam.userData.slSkip = true; scene.add(beam);
  const glowTex = slDotTex(0.35);
  const sprite = (col, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); scene.add(s); return s; };
  const tip = sprite('#ff3a22', 0.05), dot = sprite('#ff2a14', 0.06), dotCore = sprite('#ffd0c0', 0.018);
  // ---- the "you" in the mirror (only the reflection camera sees layer 1), and Mum (the illustration)
  const you = new Person({ id: 'slYou', look: 'slYou' }, scene);
  you.root.traverse((o) => o.layers.set(1));
  const mum = new Person({ id: 'slMum', look: 'slMum' }, scene); mum.root.visible = false;
  // the frozen light around every bulb (the illustration)
  const frozen = [[H.lamp[0], H.lamp[1], H.lamp[2]], [4.9, 2.28, 3.3], [-0.6, 2.05, 0.25]].map((p) => { const s = sprite('#ffe2b0', 0.5); s.position.set(...p); s.visible = false; return s; });
  // a warm key light over the table for the knock (so the hand you are waiting to see reads)
  const keyL = new THREE.PointLight('#ffd9b0', 0, 1.6, 2); keyL.position.set(-2.08, 1.32, -1.08); scene.add(keyL);
  // ---- the fireworks
  const fw = slBuildFireworks(O);
  const envDusk = scene.environment, envNight = slEnv(app.renderer, '#06080e', '#151b2a', '#07080b');
  slPatchAll(scene);
  // (the bulbs and the lamp shade obey the light front; the far town, the screen and the beam do not)
  for (const m of O.townMats) slPatch(m, { em: 0 });
  const day = new THREE.Color(), tmp = new THREE.Color();
  const shiftCol = (base, s) => { const c = slShiftRGB([base.r, base.g, base.b], s); return tmp.setRGB(c[0], c[1], c[2]); };

  // the daylight: the Sun's light already on its way slows with everything else, so less arrives each second
  // (∝ c); the picture shows it on the eye's own (log-like) scale
  const dayK = (t) => t >= SL.fw ? 0 : MathX.clamp(Math.pow(slC(t) / SL_C0, 0.3), 0, 1);
  const outside = (t, night) => {
    const d = night ? 0 : dayK(t), k = Math.pow(d, 0.8);
    const U = O.sky.material.uniforms, N = O.skyNight, D = O.skyDusk;
    U.a.value.copy(N.a).lerp(D.a, k); U.b.value.copy(N.b).lerp(D.b, k); U.c.value.copy(N.c).lerp(D.c, k); U.sc.value.copy(N.g).lerp(D.g, k);
    U.k.value = 1;
    O.sun.material.opacity = d; O.sun.visible = d > 0.01;
    const on = 1 - MathX.smooth(d, 0.22, 0.62);                   // people switch their lights on as it gets dark
    for (const m of O.townMats) m.emissiveIntensity = 1.6 * on;
    O.lights.material.opacity = 0.25 + 0.75 * on;
    S.sun.intensity = 2.4 * d * d; S.hemi.intensity = 0.06 + 0.55 * d;
    scene.environment = d > 0.3 ? envDusk : envNight; O.lightsRefl.material.opacity = 0.35 * (0.25 + 0.75 * on);
    S.hemi.color.set('#c7d6ea').lerp(tmp.set('#8090b8'), 1 - d);
    return d;
  };
  const camAt = (p, at, fov = 55, roll = 0) => slCam(cam, p, at, fov, roll);
  const look = (p, yaw, pitch, fov = 55, roll = 0) => { const d = slDir(yaw, pitch); camAt(p, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], fov, roll); };

  // ---- the cat's evening: [t, x, z, facing, pose]
  const catOnSofa = () => { catRoot.position.set(-1.12, 0.58, 1.38); catRoot.rotation.y = -1.25; cat.pose(SL_CAT_POSES.loaf, 0); };
  // the laser: she sits on the rug watching your hand, sprints to the wall (actual time), sits under the dot
  const C0 = [-1.35, 0.78], C1 = [2.86, 0.76];
  const catRun = SL.catRun;                                         // (script.js)
  const catPos = (te) => { const u = MathX.clamp((te - SL.catGo) / catRun, 0, 1), k = u * u * (3 - 2 * u); return [slLerp(C0[0], C1[0], k), 0, slLerp(C0[1], C1[1], k)]; };
  const catVel = (te) => { const u = (te - SL.catGo) / catRun; if (u <= 0 || u >= 1) return [0, 0, 0]; const dk = 6 * u * (1 - u) / catRun; return [(C1[0] - C0[0]) * dk, 0, (C1[1] - C0[1]) * dk]; };
  const beamFrom = new THREE.Vector3(), _v = new THREE.Vector3();

  const api = {
    scene, camera: cam, P, cat, hands, fw,
    cuts() { return [SL.walkCut]; },
    frame(t, shot, app) {
      const m = shot.mode;
      api._mode = m;
      let night = !['cold', 'title', 'rule', 'call', 'map', 'window'].includes(m);
      if (m === 'cold') night = true;
      // defaults: the evening room, every light steady, plain light
      P.lamp.intensity = 5.5; P.M.bulb.emissiveIntensity = 6; P.M.shade.emissiveIntensity = 0.55; P.hall.intensity = 0;
      P.pend.intensity = night ? 2.6 : 0; P.M.pend.emissiveIntensity = night ? 1.4 : 0;
      P.lamp.visible = true; P.lampG.visible = true; P.mirror.mesh.visible = true;
      phone.visible = false; laser.visible = false; beam.visible = tip.visible = dot.visible = dotCore.visible = false;
      mum.root.visible = false; for (const s of frozen) s.visible = false;
      keyL.intensity = 0;
      P.rocker.rotation.z = 0;
      O.puffs.begin(); O.flash.intensity = 0; O.water.material.roughness = 0.22;
      catOnSofa(); slSetSrc(catRoot, [0, 0, 0]);
      const d = outside(t, night);
      if (night) { S.sun.intensity = 0; S.hemi.intensity = 0.05; }
      let handsT = t, fade = 1, eye;
      // the clock on the wall
      P.clock.update({ m: Math.floor(slClock(t)) });
      switch (m) {
        case 'cold': case 'lamp': {
          // the switch by the hall door; the lamp in the far corner; everything else off
          const tl = t - shot.t0;
          const p = [SL_SWITCH_EYE[0], SL_SWITCH_EYE[1], SL_SWITCH_EYE[2]];
          const dr = slDrift(t, 0.006, 0.3, 4);
          eye = [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]];
          const yaw = m === 'cold' ? slLerp(0.3, 0.22, slK(tl, 0, 6)) : 0.24 + 0.02 * Math.sin(t * 0.2), pitch = m === 'cold' ? slLerp(-0.36, -0.3, slK(tl, 0, 6)) : -0.3;
          look(eye, yaw, pitch, 55);
          S.hemi.intensity = 0.035; P.pend.intensity = 0; P.M.pend.emissiveIntensity = 0;
          P.lamp.intensity = 6.5; P.M.shade.emissiveIntensity = 0.75;
          P.rocker.rotation.z = (m === 'lamp' && t > SL.lampOff && t < SL.lampOn) ? 0.25 : -0.25;
          // the point of the finger on the rocker
          const sw = [H.sw[0] - 0.012, H.sw[1] + ((m === 'lamp' && t > SL.lampOff - 0.1 && t < SL.lampOn - 0.1) ? -0.012 : 0.012), H.sw[2]];
          const fwd = slN3([sw[0] - eye[0], sw[1] - eye[1] + 0.25, sw[2] - eye[2]]);
          for (const k of ['point', 'pointIn']) {
            const Q = hands.poses[k]; Q.F = [0, 0, 0];
            cam.updateMatrixWorld(true); _v.set(fwd[0], fwd[1], fwd[2]).transformDirection(cam.matrixWorldInverse);
            Q.F = [_v.x, _v.y, _v.z]; Q.N = [-_v.z * 0.3 - 0.2, -0.75, _v.x * 0.3 - 0.5];
            slAimHand(Q, cam, k === 'pointIn' ? sw : [sw[0] - 0.05 * fwd[0], sw[1] - 0.05 * fwd[1], sw[2] - 0.05 * fwd[2]]);
          }
          SL_U.uSlFrontOn.value = 1; SL_U.uSlLamp.value.set(H.lamp[0], H.lamp[1], H.lamp[2]); SL_U.uSlC.value = SL.cLamp; SL_U.uSlAmb.value = 0.1;
          if (m === 'cold') { SL_U.uSlOff.value = -1e9; SL_U.uSlOn.value = SL.coldOn; }
          else { SL_U.uSlOff.value = SL.lampOff; SL_U.uSlOn.value = SL.lampOn; }
          break;
        }
        case 'title': {
          const tl = t - shot.t0;
          eye = [slLerp(2.85, 2.55, slK(tl, 0, 5)), 1.66, slLerp(2.35, 2.1, slK(tl, 0, 5))];
          camAt(eye, [-1.6, 0.95, -2.4], 50);
          break;
        }
        case 'rule': {
          const tl = t - shot.t0, dr = slDrift(t, 0.008, 0.25, 2);
          eye = [SL_SOFA[0] + dr[0], SL_SOFA[1] + dr[1], SL_SOFA[2] + dr[2]];
          look(eye, slLerp(0.42, 0.3, slK(tl, 0, 7)), slLerp(-0.06, -0.02, slK(tl, 0, 7)), 55);
          break;
        }
        case 'call': case 'map': {
          const dr = slDrift(t, 0.006, 0.3, 3);
          eye = [SL_SOFA[0] + dr[0], SL_SOFA[1] + dr[1] - 0.02, SL_SOFA[2] + dr[2]];
          // (closing in on Gran as she falls behind, and again for her laugh; the map a little wider)
          const fv = m === 'call' ? 50 - 9 * slK(t, SL.call + 1, SL.lagThree + 1) - 7 * slK(t, SL.jokeLaugh - 1.2, SL.jokeLaugh + 0.3) + 4 * slK(t, SL.jokeLaugh + 2.2, SL.map) : 44 - 5 * slK(t, SL.map, SL.mapSea + 2);
          look(eye, 0.12 + (m === 'call' ? 0.012 * slK(t, SL.jokeLaugh - 1.2, SL.jokeLaugh + 0.3) : 0), -0.42, fv);
          phone.visible = true;
          const c = slC(t);
          if (m === 'call') {
            const D = slGranDelay(c), τ = t - D;               // what you see of Gran left her one delay ago
            phoneTex.update({ mode: 'call', g: slR4(slGranAt(τ)), y: slR4(slYouAt(t)), lag: Math.round(D * 10) / 10, m: Math.floor(slClock(t)), k: Math.round(τ * 30) / 30 });
          } else {
            phoneTex.update({ mode: 'map', sea: Math.round(slK(t, SL.mapSea, SL.mapSea + 2.2) * 60) / 60, m: Math.floor(slClock(t)), k: Math.round(t * 15) / 15 });
          }
          break;
        }
        case 'window': {
          const tl = t - shot.t0, dr = slDrift(t, 0.006, 0.25, 5);
          eye = [0.05 + dr[0], 1.62 + dr[1], -2.3 + dr[2] - 0.1 * slK(tl, 0, 9)];
          look(eye, slLerp(0.62, 0.72, slK(tl, 0, 10)), -0.035, 52);
          break;
        }
        case 'fireworks': {
          const tl = t - shot.t0, dr = slDrift(t, 0.004, 0.2, 6);
          eye = [SL_FW_EYE[0] + dr[0], SL_FW_EYE[1] + dr[1], SL_FW_EYE[2] + dr[2]];
          // (closing in on the last two, where the colours split)
          const zk = slK(t, SL.f5 + 1.6, SL.b6 - 0.2);
          // each bang arrives as a jolt (the glass and the rail shake a little)
          let sh = 0; for (const p of SL_FW_PAIRS) { const u = t - p.b; if (u > 0 && u < 0.9) sh = Math.max(sh, Math.exp(-u * 6) * (p.b === SL.b6 ? 1.6 : 1)); }
          const jx = sh * 0.0035 * Math.sin(t * 61), jy = sh * 0.0028 * Math.sin(t * 47 + 1);
          eye[0] += jx; eye[1] += jy;
          camAt(eye, [slLerp(slLerp(-25, 0, slK(tl, 0, 8)), -10, zk), SL_HOME.water + slLerp(190, 200, zk), -2000], slLerp(23, 20, zk), sh * 0.004 * Math.sin(t * 37));
          fw.draw(t, O.puffs, eye);
          const fl = fw.flashAt(t);
          O.flash.intensity = 0.14 * fl; O.water.material.roughness = 0.5;    // (a soft glint, not a white column under every burst)
          O.sky.material.uniforms.k.value = 1 + 0.6 * fl;
          break;
        }
        case 'laser': {
          const tl = t - shot.t0, dr = slDrift(t, 0.005, 0.3, 7);
          eye = [SL_LASER_EYE[0] + dr[0], SL_LASER_EYE[1] + dr[1], SL_LASER_EYE[2] + dr[2]];
          // you look at her, then follow her (as you see her) to the wall
          { const te0 = slSeen(t, SL.cCat, eye, (x) => { const q = catPos(x); return [q[0], 0.2, q[2]]; }, 8), q = catPos(te0);
            const f = MathX.clamp((q[0] - C0[0]) / (C1[0] - C0[0]), 0, 1), k = Ease.inOutSine(f);
            const at = [slLerp(slLerp(-0.6, -0.9, slK(tl, 0, 6)), 2.9, k), slLerp(0.35, 0.55, k), slLerp(0.8, 0.78, k)];
            camAt(eye, at, slLerp(slLerp(44, 38, slK(tl, 0, 6)), 24, k)); }
          P.hall.intensity = 1.2;
          laser.visible = t > SL.cat + 0.9;
          const c = SL.cCat;
          // the cat, as you see her: where she was when the light left her (she's faster than light while she runs)
          const te = slSeen(t, c, eye, (x) => { const q = catPos(x); return [q[0], 0.2, q[2]]; }, 8);
          const cp = catPos(te), cv = catVel(te), sp = Math.hypot(cv[0], cv[2]);
          catRoot.position.set(cp[0], 0, cp[2]);
          const facing = te < SL.catGo ? Math.atan2(eye[0] - cp[0], eye[2] - cp[2]) : Math.atan2(C1[0] - C0[0], C1[1] - C0[1]);
          catRoot.rotation.y = te > SL.catGo + catRun + 0.25 ? Math.PI / 2 : facing;
          let pose;
          if (te < SL.catGo - 0.12) pose = slCatBlend(SL_CAT_POSES.sit, SL_CAT_POSES.alert, slK(te, SL.laserOn - 3, SL.laserOn - 1.5));
          else if (te < SL.catGo) pose = slCatBlend(SL_CAT_POSES.alert, SL_CAT_POSES.crouch, slK(te, SL.catGo - 0.12, SL.catGo));
          else if (te < SL.catGo + catRun) pose = slCatGallop((te - SL.catGo) * 3.4, Math.min(1, sp / 3));
          else pose = slCatBlend(SL_CAT_POSES.stand, SL_CAT_POSES.sit, slK(te, SL.catGo + catRun, SL.catGo + catRun + 0.4));
          cat.pose(pose, te);
          // she watches your hand (the light from it reaches her late too, but she's close)
          if (te < SL.catGo) { hands.right.g.updateWorldMatrix(true, false); hands.right.g.getWorldPosition(_v); catRoot.updateMatrixWorld(true); const lp = catRoot.worldToLocal(_v.clone()); cat.lookAt([lp.x, lp.y, lp.z], 0.8); }
          else if (te > SL.catGo + catRun) { catRoot.updateMatrixWorld(true); const lp = catRoot.worldToLocal(_v.set(H.wallDot[0], H.wallDot[1], H.wallDot[2])); cat.lookAt([lp.x, lp.y, lp.z], 0.9); }
          slSetSrc(catRoot, [cv[0] / c, 0, cv[2] / c]);
          SL_U.uSlDop.value = 1; SL_U.uSlObs.value.set(0, 0, 0);
          // the beam: its far end (the light that has got there) as you see it, i.e. the scattered light that reaches
          // you now: x with laserOn + x / c + |p(x) − eye| / c = t
          if (laser.visible && t > SL.laserOn) {
            hands.update(t); laser.updateWorldMatrix(true, true);
            beamFrom.set(0, 0.07, 0).applyMatrix4(laser.matrixWorld);
            const A = [beamFrom.x, beamFrom.y, beamFrom.z], Bp = H.wallDot, L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1], Bp[2] - A[2]);
            const at = (x) => [A[0] + (Bp[0] - A[0]) * x / L, A[1] + (Bp[1] - A[1]) * x / L, A[2] + (Bp[2] - A[2]) * x / L];
            const g = (x) => { const q = at(x); return SL.laserOn + x / c + Math.hypot(q[0] - eye[0], q[1] - eye[1], q[2] - eye[2]) / c - t; };
            let x = 0;
            if (g(L) <= 0) x = L; else if (g(0) < 0) { let lo = 0, hi = L; for (let i = 0; i < 30; i++) { const mm = 0.5 * (lo + hi); if (g(mm) > 0) hi = mm; else lo = mm; } x = lo; }
            if (x > 0.005) {
              const q = at(x);
              beam.visible = true; beam.position.copy(beamFrom); _v.set(q[0] - A[0], q[1] - A[1], q[2] - A[2]);
              beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _v.clone().normalize()); beam.scale.set(0.0022, x, 0.0022);
              tip.visible = x < L - 0.01; tip.position.set(q[0], q[1], q[2]); tip.scale.setScalar(0.1 + 0.015 * Math.sin(t * 40));
              if (x >= L - 0.01) { dot.visible = dotCore.visible = true; dot.position.set(Bp[0] - 0.01, Bp[1], Bp[2]); dotCore.position.copy(dot.position); dot.scale.setScalar(0.12 + 0.01 * Math.sin(t * 23)); dotCore.scale.setScalar(0.035); }
            }
          }
          break;
        }
        case 'mirror': {
          const Mi = H.mirror, walking = t >= SL.walkCut;
          P.hall.intensity = 2.2; P.lamp.intensity = 4;
          const dr = slDrift(t, 0.005, 0.3, 8);
          let yaw = -Math.PI / 2, pitch = -0.08, x;
          if (!walking) x = SL_MIRROR_EYE[0];
          else {
            x = slWalkX(t);
            const bob = Math.sin(slWalkX(t) / 0.62 * Math.PI * 2) * 0.012 * slK(t, SL.walkGo, SL.walkGo + 0.6);
            dr[1] += bob;
            const back = slK(t, SL.behind, SL.behind + 0.9);
            yaw = -Math.PI / 2 + back * 2.75; pitch = -0.08 - back * 0.1;
          }
          eye = [x + dr[0], 1.62 + dr[1], Mi.z + dr[2] + (walking ? -0.05 : 0)];
          look(eye, yaw, pitch, walking ? 60 : 50);
          // your velocity (units of c): walking towards the mirror
          const u = walking && t > SL.walkGo ? SL.walkU * slK(t, SL.walkGo, SL.walkGo + 0.6, (q) => q) / SL.cMirror : 0;
          SL_U.uSlDop.value = 1; SL_U.uSlObs.value.set(u, 0, 0);
          // the you in the mirror: as you were when the light left you (path you → glass → your eye, at c)
          const mx = Mi.x - 0.012, body = (te) => { const bx = te < SL.walkCut ? SL_MIRROR_EYE[0] : slWalkX(te); return [2 * mx - bx, 1.5, Mi.z]; };
          const te = slSeen(t, SL.cMirror, eye, body, 12);
          const bx = te < SL.walkCut ? SL_MIRROR_EYE[0] : slWalkX(te);
          you.root.position.set(bx, 0, Mi.z); you.root.rotation.y = Math.PI / 2;
          const pose = basePose();
          const w = slWin(te, SL.wave, SL.wave + 2.0, 0.25, 0.3);
          pose.rSh = [0.25 + w * 1.15, 0.12 + w * (0.25 + 0.22 * Math.sin((te - SL.wave) * 13))]; pose.rEl = 0.2 + w * 1.25;
          pose.headYaw = 0; pose.neck = 0.05;
          if (te > SL.walkGo) { const wp = ACTIONS.walk(te, { seed: 0.3, seedI: 3, walkPhase: slWalkX(te) / 0.62 * Math.PI * 2 }); Object.assign(pose, wp); }
          you.apply(pose); you.root.updateMatrixWorld(true);
          api._mirrorU = u;
          break;
        }
        case 'knock': case 'freeze': {
          eye = SL_TABLE_EYE.slice();
          const kk = slK(t, SL.knock, SL.knockHit - 0.5);
          camAt(eye, [slLerp(-2.27, -2.25, kk), slLerp(0.66, 0.73, kk), slLerp(-1.55, -1.38, kk)], slLerp(52, 40, kk));
          P.pend.intensity = 3.6; P.lamp.intensity = 7; keyL.intensity = 1.6;
          // the light from your knuckles (39 cm away) left them a while ago: you see your hand as it was then. As light
          // slows to a stop, no newer light gets to you, so the hand you see stops too.
          handsT = Math.max(SL.knock + 0.7, slSeenAcross(t, SL.knockDist));
          cam.updateMatrixWorld(true);
          const K = SL_KNOCK_AT, toCam = (v) => { _v.set(v[0], v[1], v[2]).normalize().transformDirection(cam.matrixWorldInverse); return [_v.x, _v.y, _v.z]; };
          for (const k of ['rest', 'lift', 'fistUp', 'fistDn']) {
            const Q = hands.poses[k], D = SL_KNOCK_DIR[k === 'rest' ? 'rest' : 'fist'];
            Q.F = toCam(D[0]); Q.N = toCam(D[1]);
            slAimHand(Q, cam, k === 'fistDn' ? K : k === 'rest' ? [K[0] + 0.03, K[1], K[2] - 0.02] : [K[0] + 0.01, K[1] + 0.09, K[2] + 0.05]);
          }
          // the picture fades as light stops (the light still arriving arrives ∝ c)
          if (m === 'freeze' || t > SL.freeze - 1) fade = Math.pow(MathX.clamp(slC(t) / SL.cKnock, 0, 1), 0.33);
          break;
        }
        case 'xray': {
          // the illustration: the flat from above as a cut-away plan, lit only so you can see its shape. Mum comes in
          // through the front door and tries the switches; at "They're not." every bulb is shown on, its light piled up
          // round the bulb, going nowhere
          const tl = t - shot.t0, T0 = SL.door, rev = MathX.smooth(t, SL.on2 + 0.15, SL.on2 + 1.3);
          eye = [slLerp(1.7, 1.4, slK(tl, 0, 24)), slLerp(10.4, 9.4, slK(tl, 0, 24)), slLerp(5.2, 4.6, slK(tl, 0, 24))];
          camAt(eye, [slLerp(1.9, 1.4, slK(tl, 0, 24)), 0, slLerp(1.3, 0.9, slK(tl, 0, 24))], 50);
          P.lamp.intensity = 0; P.pend.intensity = 0; P.hall.intensity = 0;
          P.M.pend.emissiveIntensity = 1.4 * rev; P.M.bulb.emissiveIntensity = 6 * rev; P.M.shade.emissiveIntensity = 0.55 * rev;
          S.hemi.intensity = 0.75; S.hemi.color.set('#8aa2d6'); S.hemi.groundColor.set('#2a2c34');
          for (const s of frozen) { s.visible = rev > 0.01; s.material.opacity = rev; s.scale.setScalar((0.42 + 0.04 * Math.sin(t * 2 + s.position.x)) * (0.6 + 0.4 * rev)); }
          // Mum: the door opens, she steps in, shuts it, tries the hall switch; then walks to the living-room door
          const path = [[T0 + 2.0, 5.05, 4.3], [T0 + 2.3, 5.05, 4.3], [T0 + 4.4, 4.85, 3.35], [SL.on2 + 1.2, 4.85, 3.35], [SL.on2 + 4.6, 1.85, 3.15], [1e9, 1.85, 3.15]];
          let q = path[0], qn = path[0], f = 0;
          for (let i = 1; i < path.length; i++) if (t < path[i][0]) { q = path[i - 1]; qn = path[i]; f = MathX.clamp((t - q[0]) / (qn[0] - q[0]), 0, 1); break; }
          const fe = Ease.inOutSine(f), mx = slLerp(q[1], qn[1], fe), mz = slLerp(q[2], qn[2], fe), moving = (qn[1] !== q[1] || qn[2] !== q[2]) && f > 0 && f < 1;
          mum.root.visible = t >= T0 + 2.0; mum.root.position.set(mx, 0, mz);
          const flick = [slCap('door', 1).hide - 0.3, SL.on2 + 5.1];
          let face = Math.PI;
          if (moving) face = Math.atan2(qn[1] - q[1], qn[2] - q[2]);
          else if (t > T0 + 4.4 && t < SL.on2 + 1.2) face = Math.atan2(4.35 - mx, 3.98 - mz);
          mum.root.rotation.y = face;
          const mp = basePose();
          if (moving) Object.assign(mp, ACTIONS.walk(t, { seed: 0.6, seedI: 5, walkPhase: Math.hypot(mx - path[0][1], mz - path[0][2]) / 0.6 * Math.PI * 2 }));
          const up = Math.max(slWin(t, flick[0] - 0.35, flick[0] + 1.75, 0.3, 0.4), slWin(t, flick[1] - 0.35, flick[1] + 0.75, 0.3, 0.4));
          mp.rSh = [0.35 + 1.0 * up, 0.15]; mp.rEl = 0.9 - 0.4 * up; mp.headYaw = moving ? 0 : 0.3 * Math.sin(t * 0.6);
          mum.apply(mp); mum.root.updateMatrixWorld(true);
          api._mumP = [mx, mz];
          // the front door
          P.door.rotation.y = -1.2 * MathX.smooth(t, T0 + 1.8, T0 + 2.3) * (1 - MathX.smooth(t, T0 + 3.6, T0 + 3.85));
          // you, at the table where you knocked
          you.root.position.set(SL_HOME.table[0], 0, SL_HOME.table[2] + 0.66); you.root.rotation.y = Math.PI;
          const yp = ACTIONS.sit(t, { seat: 0.44, seedI: 2 }); yp.rSh = [1.25, 0.05]; yp.rEl = 0.35; yp.lSh = [1.2, 0.1]; yp.lEl = 0.5; yp.headYaw = 0.6;
          you.apply(yp); you.root.updateMatrixWorld(true);
          cam.layers.enable(1); P.slab.visible = true;
          break;
        }
        case 'after': default: {
          const tl = t - shot.t0;
          eye = [slLerp(2.6, 2.75, slK(tl, 0, 10)), 1.7, slLerp(2.2, 2.35, slK(tl, 0, 10))];
          camAt(eye, [-1.4, 0.85, -2.3], 50);
          break;
        }
      }
      if (m !== 'xray') { P.door.rotation.y = 0; cam.layers.disable(1); P.slab.visible = false; }
      // the ceiling hides for the cutaway
      api._xray = m === 'xray'; for (const c of P.ceil) c.visible = m !== 'xray';
      SL_U.uSlT.value = t; SL_U.uSlEye.value.set(cam.position.x, cam.position.y, cam.position.z); SL_U.uSlFade.value = fade;
      if (!['cold', 'lamp'].includes(m)) { SL_U.uSlFrontOn.value = 0; SL_U.uSlAmb.value = 1; }
      if (!['laser', 'mirror'].includes(m)) { SL_U.uSlDop.value = 0; SL_U.uSlObs.value.set(0, 0, 0); }
      hands.update(handsT);
      O.puffs.end();
    },
    // the illustration's labels: every bulb, you, Mum
    labels(t) {
      if (api._mode !== 'xray') return [];
      const a = (k) => MathX.smooth(t, SL.on2 + 0.6 + k * 0.35, SL.on2 + 1.1 + k * 0.35), m = api._mumP || [5, 3.5];
      const L = frozen.map((s, i) => ({ p: [s.position.x, s.position.y + 0.05, s.position.z], text: 'ON', a: a(i) * (1 - MathX.smooth(t, SL.text - 0.2, SL.text + 0.4)) }));
      L.push({ p: [SL_HOME.table[0], 1.35, SL_HOME.table[2] + 0.62], text: 'YOU', a: MathX.smooth(t, SL.door + 0.8, SL.door + 1.3) });
      L.push({ p: [m[0] + 0.05, 0.2, m[1] + 0.45], text: 'MUM', a: MathX.smooth(t, SL.door + 2.6, SL.door + 3.1) });
      return L;
    },
    prerender(app) {
      if (api._mode !== 'mirror') return;
      // the reflection: seen from your mirror image (the light arrives from ahead), you moving away from the glass
      const mx = SL_HOME.mirror.x - 0.012, e = cam.position, u = api._mirrorU || 0;
      SL_U.uSlEye.value.set(2 * mx - e.x, e.y, e.z); SL_U.uSlObs.value.set(-u, 0, 0);
      P.mirror.render(app.renderer, scene, cam);
      SL_U.uSlEye.value.copy(e); SL_U.uSlObs.value.set(u, 0, 0);
    },
    grade(t, p, shot) {
      const m = shot.mode;
      if (m === 'fireworks') { p.bloom = 0.65; p.bloomThreshold = 0.55; p.exposure = 1.08; p.vignette = 0.62; }
      if (m === 'cold' || m === 'lamp') { p.bloom = 0.42; p.bloomThreshold = 0.8; p.exposure = 1.05; }
      if (m === 'laser') { p.bloom = 0.5; p.bloomThreshold = 0.7; }
      if (m === 'xray') { p.fade = Math.max(p.fade, 1 - MathX.smooth(t, SL.door, SL.door + 0.9)); p.saturation = 0.45; p.contrast = 1.12; p.exposure = 1.1; p.warmth = -0.25; p.bloom = 0.7; p.bloomThreshold = 0.5; p.vignette = 0.7; }
      if (m === 'knock' || m === 'freeze') p.vignette = 0.62;
      if (m === 'after') { p.exposure = 1.0; }
      if (m === 'cold') p.fade = Math.max(p.fade, 0.55 * (1 - MathX.smooth(t, 0, 0.45)));
    },
  };
  return api;
};
// round a face's numbers (the phone redraws only when something visible changes)
function slR4(o) { const r = {}; for (const k in o) r[k] = Math.round(o[k] * 40) / 40; return r; }
// the cold open: the lamp is switched on so its bulb is seen at 0.9 s
SL.coldOn = 0.9 - Math.hypot(SL_SWITCH_EYE[0] - SL_HOME.lamp[0], SL_SWITCH_EYE[1] - SL_HOME.lamp[1], SL_SWITCH_EYE[2] - SL_HOME.lamp[2]) / SL.cLamp;
