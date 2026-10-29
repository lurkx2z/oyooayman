/* =====================================================================
   WORLD — the film's main set: your house and bedroom (room.js), the street (street.js), the people and the cat
   (cast.js), your first-person hands; an autumn morning, 7:42 AM, the sun low in the east (at the bottom of the
   street). Every shot (shots.js) is a mode: story time s comes from the film's one clock (script.js: gtStoryAt), the
   world is posed with it (pure), and the mode places the camera.
   Camera "up": most shots during the hour are framed to the new down (east at the bottom of the frame, or, looking
   along the street, the ground on one side): that's what it feels like. A few stay in the old frame to show how odd
   it is. gtCamU(cam, p, at, fov, up) takes the up vector.
   ===================================================================== */

function gtCamU(cam, p, at, fov, up = [0, 1, 0]) {
  cam.position.set(p[0], p[1], p[2]); cam.up.set(up[0], up[1], up[2]).normalize(); cam.lookAt(at[0], at[1], at[2]);
  if (fov && cam.fov !== fov) cam.fov = fov;
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}
const gtAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const GT_UP = { old: [0, 1, 0], west: [-1, 0, 0] };

// your hands (keyed on FILM time: they're only seen through your eyes): the mug; flat on the glass; the phone; braced
const GT_HAND_POSES = {
  mug: { p: [0.14, -0.27, -0.4], F: [-0.15, 0.95, -0.25], N: [-0.95, 0.1, 0.25], curl: [1.0, 1.05, 1.1, 1.15], thumb: [0.35, 0.85] },
  glassR: { p: [0.2, -0.1, -0.2], F: [0.25, 0.95, -0.15], N: [0.05, 0.1, -1], curl: [0.08, 0.08, 0.1, 0.12], thumb: [0.7, 0.1] },
  phone: { p: [0.06, -0.08, -0.27], F: [-0.85, 0.25, -0.3], N: [-0.05, 0.3, 0.95], curl: [0.38, 0.42, 0.46, 0.5], thumb: [0.12, 0.3] },
  brace: { p: [0.2, -0.2, -0.3], F: [0.3, 0.2, -0.95], N: [0.2, -0.95, 0.1], curl: [0.3, 0.32, 0.35, 0.4], thumb: [0.55, 0.25] },
};
const GT_HAND_BLENDS = { mug: 0.2, glassR: 0.14, phone: 0.35, brace: 0.3, hidden: 0.25 };

GT_SETS.world = (app) => {
  const sun0 = gtSunDir(0);
  const S = gtSet(app, { sky: '#b9cfe2', fov: 50, near: 0.02, far: 6000, hemi: ['#dbe8f5', '#7a6a58', 0.55], sun: [sun0[0] * 60, sun0[1] * 60, sun0[2] * 60], sunI: 4.2, sunColor: '#ffe2bc', shadow: 2048, shadowR: 10, shadowFar: 260, env: ['#9cc0e6', '#e2ddd2', '#6c6256'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  scene.fog = new THREE.FogExp2('#cdd8e2', 0.0016);
  const sky = gtSky(scene, '#3f86d8', '#d6e2ea', '#8c8a84', { sunDir: sun0, sunGlow: '#ffd9a8', hw: 0.3 });
  const GT_GLOW = new THREE.Color('#ffd9a8');
  const R = gtBuildRoom(S), T = gtBuildStreet(S), C = gtBuildCast(S, R, T);
  // ---- inside: fill lights (the room is lit by the low sun through the window, and by the sky)
  const fillA = new THREE.PointLight('#ffe8d0', 0, 7, 1.4), fillB = new THREE.PointLight('#d8e4f0', 0, 7, 1.4); scene.add(fillA, fillB);
  // ---- your hands (a T-shirt: bare forearms), the mug and the phone in them
  const hands = new ViewerHands(cam, { script: GT.hands, poses: GT_HAND_POSES, blends: GT_HAND_BLENDS, skin: SKIN[LOOKS.gtYou.skin], nail: '#e0b9a8', sleeve: LOOKS.gtYou.shirt, cuff: '#33465a', watch: false, sleeveLen: 0.2 });
  const mugH = R.mug.clone(true); mugH.position.set(0.0, 0.03, 0.06); mugH.rotation.set(Math.PI / 2, 0, 0); mugH.scale.setScalar(1); hands.right.g.add(mugH);
  const phone = gtBuildPhone(); phone.position.set(0, 0.1, 0.03); phone.rotation.set(Math.PI / 2, 0, Math.PI / 2, 'ZYX'); hands.left.g.add(phone);
  // ---- the anchor bolt at your house's front corner (the cutaway): concrete footing, the sill plate, the bolt, washer, nut
  const BR = gtBuildBoltRig(scene);
  const set = {
    scene, camera: cam, R, T, C, hands,
    cuts() { return GT.subCuts; },
    frame(t, shot) {
      const m = shot.mode, s = gtStoryAt(t);
      this._s = s;
      const pov = !!shot.pov;
      // ------------------------------------------------------------------ pose the world
      R.update(s, { pov });
      T.update(s, {});
      C.update(s, { pov });
      gtBoltUpdate(BR, s);
      // the sun climbs (7:42 → 8:42); the sky's glow follows it
      const sd = gtSunDir(s); sky.material.uniforms.sd.value.set(sd[0], sd[1], sd[2]);
      // ------------------------------------------------------------------ the camera
      const k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      const RL = (x, y, z) => R.toWorld(x, y, z).toArray();               // room-local → world
      const v = { p: [0, 2, -5], at: [0, 1, 0], fov: 50, up: GT_UP.old, drift: 0.004, sh: { f: null, R: 10 }, inside: false, fog: 1, glow: 0.45 };
      gtShotCam(this, m, s, t, k, shot, v, RL);
      const d = v.drift ? gtDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      // (the near plane: close for your hands and the room, further out in the street, where the road lies 2 cm above
      // the grass and a near plane at 2 cm would let them fight)
      const near = v.near || (pov || v.inside ? 0.02 : 0.12); if (cam.near !== near) cam.near = near;
      gtCamU(cam, gtAdd(v.p, d), v.at, v.fov, v.up);
      scene.fog.density = 0.0009 * v.fog * (1 + 0.3 * gtRain(s));
      sky.material.uniforms.sc.value.copy(GT_GLOW).multiplyScalar(v.glow);
      // ------------------------------------------------------------------ your hands (through your eyes only)
      if (pov) { hands.root.visible = true; hands.update(t); mugH.visible = s < GT_YOU.hitGlass; }
      else hands.root.visible = false;
      gtPhoneScreen(phone, s);
      // ------------------------------------------------------------------ light: the sun's shadow round what we look at
      const f = v.sh.f || v.at, D = 120;
      sun.position.set(f[0] + sd[0] * D, f[1] + sd[1] * D, f[2] + sd[2] * D); sun.target.position.set(f[0], f[1], f[2]); sun.target.updateMatrixWorld();
      { const c = sun.shadow.camera; if (c.right !== v.sh.R) { c.left = -v.sh.R; c.right = v.sh.R; c.top = v.sh.R; c.bottom = -v.sh.R; c.updateProjectionMatrix(); } }
      sun.shadow.bias = v.sh.R > 20 ? -0.0006 : -0.0003; sun.shadow.normalBias = v.sh.R > 20 ? 0.06 : 0.02;
      this._inside = v.inside;
      S.hemi.intensity = v.inside ? 0.3 : 0.62; scene.environmentIntensity = v.inside ? 0.45 : 0.85;
      if (v.inside) { fillA.position.copy(R.toWorld(-1.0, 2.0, 0.6)); fillB.position.copy(R.toWorld(-2.8, 1.4, -0.8)); }
      fillA.intensity = v.inside ? 2.2 : 0; fillB.intensity = v.inside ? 1.4 : 0;
      R.bulb.intensity = v.inside ? 0.0 : 0;
      // ------------------------------------------------------------------ dust, rain, the rainbow
      gtDust(T, s, cam); gtRainUpdate(T, s, cam); gtBowUpdate(T, s, cam, sd); gtJetUpdate(R, s, cam);
    },
    labels(t) { return gtLabels(this, t); },
    grade(t, p, shot) {
      const m = shot.mode;
      if (this._inside) { p.exposure = 1.28; p.warmth = 0.04; p.bloom = 0.32; p.bloomThreshold = 0.88; }
      else { p.exposure = 1.0; p.warmth = 0.03; p.bloom = 0.28; }
      p.saturation = 1.05; p.contrast = 1.07; p.vignette = 0.44;
      const s = this._s;
      if (gtRain(s) > 0.05 && !this._inside) { p.saturation = 1.0 - 0.08 * gtRain(s); p.contrast = 1.04; }
      if (m === 'sick') { p.edgeBlur = 0.6 + 0.3 * Math.sin(t * 1.3); p.vignette = 0.62; p.chroma = 0.15; }
      // the bang of the bolt, the window going, the terrace's hit, the return: a kick
      for (const [tt, a] of [[GT.tBolt, 0.22], [GT.tGlass, 0.16], [GT.tTerHit, 0.18], [GT.tB, 0.28]]) { const u = t - tt; if (u > 0 && u < 0.6) { p.flash = Math.max(p.flash || 0, a * Math.exp(-u / 0.06)); p.chroma = Math.max(p.chroma || 0, 2 * a * Math.exp(-u / 0.2)); } }
    },
  };
  return set;
};

// a phone (the screen is a canvas: the lock screen, then the emergency alert)
function gtBuildPhone() {
  const g = new THREE.Group();
  gtMesh(gtRoundBox(0.072, 0.0085, 0.152, 0.009, 0.002), gtStd('#16181b', 0.35, 0.4), 0, 0, 0, g);
  const ct = gtCanvasTex(256, 540, gtPhoneDraw);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.143), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false }));
  scr.rotation.x = -Math.PI / 2; scr.position.y = 0.0089; g.add(scr);
  g.userData.ct = ct;
  return g;
}
function gtPhoneDraw(g, w, h, st) {
  g.fillStyle = '#0d1016'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#24324a'); gr.addColorStop(1, '#0b0f17'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8ecf2'; g.textAlign = 'center';
  if (!st.alert) { g.font = '300 64px Arial'; g.fillText(st.time, w / 2, 110); g.font = '400 18px Arial'; g.fillText('Thursday 29 October', w / 2, 140); return; }
  g.font = '400 26px Arial'; g.fillText(st.time, w / 2, 40);
  // the alert card (big, at the top: you read it at arm's length)
  g.fillStyle = 'rgba(240,242,246,0.97)'; gtRR(g, 10, 58, w - 20, 300, 18); g.fill();
  g.fillStyle = '#c0392b'; gtRR(g, 22, 72, 40, 40, 8); g.fill(); g.fillStyle = '#fff'; g.font = '700 30px Arial'; g.fillText('!', 42, 103);
  g.textAlign = 'left'; g.fillStyle = '#b22a1e'; g.font = '700 22px Arial'; g.fillText('EMERGENCY', 72, 90); g.fillText('ALERT', 72, 112);
  g.fillStyle = '#111'; g.font = '700 25px Arial';
  const L = ['Stay indoors.', 'Stay away', 'from windows.'];
  L.forEach((l, i) => g.fillText(l, 22, 168 + i * 34));
  g.font = '400 17px Arial'; g.fillStyle = '#444'; g.fillText('Gravity anomaly in', 22, 290); g.fillText('your area. Do not', 22, 312); g.fillText('go outside.', 22, 334);
}
function gtPhoneScreen(phone, s) {
  const c = gtClockParts(s);
  phone.userData.ct.update({ time: `${c.h}:${String(c.m).padStart(2, '0')}`, alert: s > 238 });
}

// ---------------------------------------------------------------------------------------------------------------------
// THE ANCHOR BOLT (your house's north-east corner, in a cutaway): the concrete footing (ground), the timber sill plate
// on it, an anchor bolt up through the sill, a washer and a nut; it stretches, then snaps at 8:37:30
// ---------------------------------------------------------------------------------------------------------------------
function gtBuildBoltRig(scene) {
  const g = new THREE.Group(); g.position.set(-0.6, 0, -4.2); scene.add(g);
  const conc = gtStd('#9a968e', 0.95), wood = gtStd('#ffffff', 0.7, 0, { map: (() => { const t = gtTex(gtWoodCanvas(41, 256, 1024, [176, 136, 92])); t.rotation = Math.PI / 2; return t; })() }), steel = gtStd('#8d9297', 0.35, 0.85), zinc = gtStd('#b8bcc0', 0.3, 0.9);
  gtBox(1.6, 0.6, 0.4, conc, 0, -0.3, 0, g);                              // the footing (ground: it holds)
  const up = new THREE.Group(); g.add(up);                                  // (what moves with the house)
  gtBox(1.6, 0.1, 0.16, wood, 0, 0.05, 0, up);                              // the sill plate
  gtBox(0.05, 0.6, 0.12, wood, -0.5, 0.4, 0, up); gtBox(0.05, 0.6, 0.12, wood, 0.3, 0.4, 0, up);   // studs
  const lower = gtCyl(0.008, 0.008, 0.36, steel, 0, -0.08, 0, g, 12);      // the bolt below the break
  const upper = new THREE.Group(); up.add(upper);
  gtCyl(0.008, 0.008, 0.12, steel, 0, 0.1, 0, upper, 12);
  gtCyl(0.026, 0.026, 0.005, zinc, 0, 0.103, 0, upper, 20);                 // washer
  gtCyl(0.016, 0.016, 0.014, zinc, 0, 0.115, 0, upper, 6);                  // nut
  return { g, up, upper, lower };
}
function gtBoltUpdate(B, s) {
  const lean = gtLean(s), sn = GT_BOLT.snap;
  // (the house lifts a hair at this corner as it racks; at the snap the bolt's top flies up and the sill jumps)
  const lift = 0.0015 * Math.min(1, lean / 1.4) + (s > sn ? 0.004 * gtSm(s, sn, sn + 0.12) : 0);
  B.up.position.set(0.004 * lean, lift, 0);
  const u = s - sn;
  if (u > 0 && s < GTP.tBack) { const r = gtFall(s, 0.3, { s0: sn, e: 0.2 }); B.upper.position.set(0.02 * Math.min(1, u * 4), 0.02 * Math.min(1, u * 6) + r.x * 0.0, 0); B.upper.rotation.set(0, 0, -0.6 * gtSm(u, 0, 0.25)); }
  else if (u <= 0) { B.upper.position.set(0, 0, 0); B.upper.rotation.set(0, 0, 0); }
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, up, drift, sh: { f, R }, inside }. RL(x, y, z): room-local → world
// ---------------------------------------------------------------------------------------------------------------------
function gtShotCam(set, m, s, t, k, shot, v, RL) {
  const W = GT_UP.west, V = gtV, j = gtJog(s);
  const into = (a, b, u) => V(a, b, Ease.inOutSine(u));
  switch (m) {
    // ---- 1: the first seconds
    case 'pov0': {                                          // your eyes at the window: the street; thrown onto the glass
      const f = gtFall(s, GT_ROOM.you.d, { e: 0.04 }), x = -0.32 + 0.08 + f.x;
      const turn = gtSm(s, 0.2, 1.4), dip = gtSm(s, 0.0, 0.25);
      const yaw = -0.04 + 0.22 * turn, pitch = -0.1 - 0.12 * dip - 0.12 * turn;
      v.p = RL(x, 1.63 - 0.03 * dip, 0.1 - 0.05 * turn); v.at = gtAdd(v.p, [Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), Math.cos(pitch) * Math.sin(yaw)]);
      v.fov = 58; v.up = [0, Math.cos(0.3 * turn), -Math.sin(0.3 * turn)]; v.drift = 0.002; v.sh = { f: [14, 0, 0], R: 20 }; break; }
    case 'room0': v.p = RL(-3.3, 2.28, 1.38); v.at = RL(-0.9, 0.85, -0.45); v.fov = 66; v.inside = true; v.sh = { f: RL(-1.5, 1, 0), R: 4 }; break;
    case 'master': v.p = into([1.2, 4.6, -0.3], [2.8, 4.4, -0.3], k); v.at = [200, 1.0, 0.5]; v.fov = 56; v.up = [0, 0, 1]; v.drift = 0.004; v.fog = 0.5; v.sh = { f: [70, 0, 0], R: 80 }; break;   // (the view from your window, turned 90°)
    case 'chair': { const F = GT_FALLERS.find((f) => f.k === 'gchair'), x = gtFaller(F, s).x;
      v.p = [x - 0.4, 2.5, F.z + 0.15]; v.at = [x + 1.1, 0, F.z - 0.25]; v.fov = 70; v.up = W; v.drift = 0.02; v.sh = { f: [x + 2, 0, F.z], R: 14 }; break; }   // (falling with it: the lawn streams past)
    case 'bottom': v.p = into([258, 16, 24], [261, 15.5, 23], k); v.at = [282, 2, -1]; v.fov = 50; v.up = W; v.drift = 0.006; v.glow = 0.1; v.fog = 0.6; v.sh = { f: [278, 0, 0], R: 28 }; break;   // (the bottom: the pile against the retaining wall)
    // ---- 2: the glass
    case 'front': v.p = into([5.2, 1.6, 1.6], [4.8, 1.8, 1.4], k); v.at = RL(0.0, 1.45, 0.05); v.fov = 46; v.up = W; v.drift = 0.004; v.sh = { f: RL(0, 1.5, 0), R: 4 }; break;
    case 'povglass': v.p = RL(-0.06, 1.5, 0.05); v.at = gtAdd(v.p, [1, -0.42, 0.05]); v.fov = 64; v.up = [0, 0.35, -1]; v.drift = 0.0015; v.sh = { f: [10, 0, 0], R: 16 }; break;
    case 'crawl': v.p = RL(-3.1, 1.9, -1.3); v.at = RL(-0.2, 1.45, 0.55); v.fov = 60; v.up = W; v.inside = true; v.sh = { f: RL(-0.5, 1.3, 0.4), R: 4 }; break;
    case 'roomroll': { const r = gtSm(t, gtC('nuance', 1) + 0.6, gtC('nuance', 2) - 1.0);
      v.p = RL(-3.25, 1.35, -1.25); v.at = RL(-0.6, 1.25, 0.5); v.fov = 62; v.up = [-Math.sin(r * Math.PI / 2), Math.cos(r * Math.PI / 2), 0]; v.inside = true; v.drift = 0.002; v.sh = { f: RL(-1, 1, 0), R: 4 }; break; }
    case 'tipped': v.p = into([12, 6, -7.6], [11, 5.8, -7.2], k); v.at = [-4.5, 4, 0.5]; v.fov = 48; v.up = W; v.sh = { f: [-4, 3, 0], R: 14 }; break;
    // ---- 3: the air; the river (river.js); the jogger
    case 'dust': v.p = into([168, 2.6, -1.8], [174, 2.7, -1.8], k); v.at = [285, 7, 1]; v.fov = 50; v.fog = 0.7; v.sh = { f: [240, 0, 0], R: 60 }; break;
    case 'dust2': v.p = [262, 3.2, 9.5]; v.at = [282, 6, 0]; v.fov = 50; v.sh = { f: [278, 0, 0], R: 14 }; break;
    case 'town': v.p = into([-140, 160, 210], [-120, 150, 190], k); v.at = [110, 0, -10]; v.fov = 46; v.drift = 0.02; v.fog = 0.3; v.sh = { f: [120, 0, 0], R: 160 }; break;
    case 'jogger': v.p = into([25.4, 1.9, 1.6], [25.2, 1.8, 1.2], k); v.at = [24.9, 1.4, -3.9]; v.fov = 42; v.up = W; v.sh = { f: [25, 1, -4], R: 5 }; break;
    case 'climb': v.p = [23.2, 2.4, 1.0]; v.at = [24.4, 1.35, -3.9]; v.fov = 44; v.up = W; v.sh = { f: [24.5, 1, -4], R: 5 }; break;
    // ---- 4: the pit; the cat; the bath; the phone; the trees; the sun
    case 'pit': v.p = into(RL(-0.25, 1.2, -0.9), RL(-0.35, 1.25, -0.85), k); v.at = RL(-3.6, 1.1, 0.9); v.fov = 70; v.up = W; v.inside = true; v.sh = { f: RL(-2, 1, 0), R: 4 }; break;
    case 'house': v.p = into([17, 4.3, 0.8], [13.5, 4.3, 0.8], k); v.at = [0, 4.3, 0]; v.fov = 50; v.up = [0, 0, 1]; v.sh = { f: [-2, 4, 0], R: 12 }; break;   // (your house, face on, turned 90°)
    case 'sick': { const sw = Math.sin(t * 0.9) * 0.05 + Math.sin(t * 0.37) * 0.04, Y = GT_YOU.seatP;
      v.p = RL(-0.78, Y[1] - 0.15, Y[2] - 0.05); v.at = RL(-1.7 + 0.2 * Math.sin(t * 0.5), 0.9, -0.5 + 0.25 * Math.sin(t * 0.31)); v.fov = 62; v.up = [-Math.cos(sw), Math.sin(sw), 0]; v.inside = true; v.drift = 0.004; v.sh = { f: RL(-1, 1, 0), R: 4 }; break; }
    case 'cat': { const C = GT_CAT; v.p = RL(-0.75, C.y + 0.15, C.z + 0.62); v.at = RL(-0.2, C.y, C.z); v.fov = 44; v.up = W; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, C.y, C.z), R: 2 }; break; }
    case 'bath': v.p = RL(-0.5, 0.55, -1.25); v.at = RL(-3.5, 1.15, 0.9); v.fov = 64; v.up = W; v.inside = true; v.sh = { f: RL(-2, 1, 0.5), R: 4 }; break;
    case 'phone': { const Y = GT_YOU.seatP; v.p = RL(-0.78, Y[1] - 0.15, Y[2] - 0.05); v.at = RL(-0.25, Y[1] - 0.45, Y[2] - 0.15); v.fov = 56; v.up = W; v.inside = true; v.drift = 0.0012; v.sh = { f: RL(-0.5, 1.5, 0.8), R: 3 }; break; }
    case 'trees': v.p = into([196, 2.6, -5.0], [200, 2.5, -5.0], k); v.at = [212, 4.5, 14]; v.fov = 50; v.up = W; v.sh = { f: [210, 2, 14], R: 20 }; break;
    case 'sun': v.p = into([-3, 9.5, 0.2], [-2.6, 9.4, 0.2], k); v.at = [200, 4.0, -2]; v.fov = 46; v.glow = 1.0; v.up = [0, 0, 1]; v.sh = { f: [60, 0, 0], R: 60 }; break;
    // ---- 5: the terrace; the rain
    case 'terrace': v.p = into([62, 1.3, -4.6], [70, 1.3, -4.6], k); v.at = [90, 3.6, 9.5]; v.fov = 50; v.up = W; v.sh = { f: [88, 2, 12], R: 26 }; break;
    case 'dpc': v.p = [13.15, 0.42, 9.0]; v.at = [14.25, 0.13, 9.6]; v.fov = 40; v.sh = { f: [14, 0, 9.5], R: 3 }; break;
    case 'slip': v.p = [13.55, 0.22, 9.25]; v.at = [14.05, 0.15, 9.55]; v.fov = 34; v.drift = 0.0006; v.sh = { f: [14, 0, 9.5], R: 2 }; break;
    case 'rainfront': v.p = into([96, 1.7, 0.8], [90, 1.7, 0.8], k); v.at = [-20, 13, 0]; v.fov = 50; v.up = GT_UP.old; v.glow = 0.3; v.sh = { f: [40, 0, 0], R: 60 }; break;   // (down the street, the old way up: the rain coming at you like a wall)
    case 'rainjog': v.p = [23.0, 1.0, 0.7]; v.at = [24.5, 1.45, -3.95]; v.fov = 40; v.up = W; v.drift = 0.0015; v.sh = { f: [24.4, 1.4, -4], R: 5 }; break;   // (her, in the rain)
    case 'rainwin': { const Y = GT_YOU.seatP; v.p = RL(-0.8, Y[1] - 0.1, Y[2] - 0.1); v.at = RL(0.05, 1.4, 0.0); v.fov = 58; v.up = W; v.inside = true; v.drift = 0.0012; v.sh = { f: RL(0, 1.4, 0), R: 3 }; break; }
    case 'bow': v.p = into([60, 2.6, 2.2], [58, 2.6, 2.2], k); v.at = [-20, 9, 0]; v.fov = 62; v.up = [0, 0, -1]; v.sh = { f: [20, 0, 0], R: 40 }; break;
    // ---- 6: the wood; the terrace goes
    case 'wood': v.p = into([16, 5.2, -14], [15, 5.0, -13], k); v.at = [-4, 3.6, 0.5]; v.fov = 46; v.sh = { f: [-4, 3, 0], R: 14 }; break;
    case 'creak': v.p = RL(-3.2, 2.3, 1.3); v.at = RL(-1.2, 1.9, -0.3); v.fov = 58; v.up = W; v.inside = true; v.sh = { f: RL(-1.5, 1, 0), R: 4 }; break;
    case 'creep': v.p = [-0.15, 0.32, -4.55]; v.at = [-0.6, 0.08, -4.2]; v.fov = 40; v.drift = 0.0006; v.sh = { f: [-0.6, 0, -4.2], R: 2 }; break;
    case 'going': v.p = into([40, 1.0, -3.0], [44, 1.0, -3.0], k); v.at = [60, 1.4, 9.5]; v.fov = 46; v.up = W; v.sh = { f: [60, 1, 10], R: 22 }; break;
    case 'still': v.p = [12.8, 0.5, 8.6]; v.at = [16, 0.3, 9.6]; v.fov = 42; v.drift = 0.001; v.sh = { f: [15, 0, 9.5], R: 4 }; break;
    case 'release': v.p = into([7, 14.5, 13.2], [8, 14.2, 13.2], k); v.at = [120, 2.5, 13.5]; v.fov = 60; v.up = [0, 0, 1]; v.drift = 0.004; v.fog = 0.5; v.sh = { f: [60, 0, 13], R: 70 }; break;   // (from above its end: it falls away down the street)
    case 'impact': v.p = [266, 20, -34]; v.at = [274, 3, 12]; v.fov = 50; v.up = W; v.drift = 0.006 + 0.05 * Math.exp(-Math.max(0, s - GT_TER.hit0) / 0.5) * (s > GT_TER.hit0 ? 1 : 0); v.fog = 0.6; v.sh = { f: [272, 0, 8], R: 40 }; break;
    case 'cloud': v.p = into([150, 6, -9], [156, 6.2, -9], k); v.at = [250, 14, 6]; v.fov = 54; v.sh = { f: [220, 0, 10], R: 80 }; break;
    // ---- 7: the pool; the window goes
    case 'pool': v.p = RL(-1.5, 1.9, -0.95); v.at = RL(0.0, 1.35, 0.1); v.fov = 54; v.up = W; v.inside = true; v.sh = { f: RL(0, 1.4, 0), R: 3 }; break;
    case 'glassclose': v.p = RL(-0.42, 1.62, 0.32); v.at = RL(0.05, 1.3, -0.05); v.fov = 44; v.up = W; v.inside = true; v.drift = 0.001; v.sh = { f: RL(0, 1.4, 0), R: 2 }; break;
    case 'glassgo': v.p = [16, 3.2, 3.2]; v.at = RL(0, 1.5, 0); v.fov = 44; v.up = [0, 0, 1]; v.drift = 0.006; v.sh = { f: [4, 3, 0], R: 12 }; break;
    // ---- 8: ten minutes; the bolt; the last minute
    case 'ready': v.p = RL(-2.6, 2.1, 0.9); v.at = RL(-0.3, 0.6, 0.0); v.fov = 60; v.up = W; v.inside = true; v.sh = { f: RL(-0.5, 1, 0.8), R: 4 }; break;
    case 'jogdown': v.p = [25.6, 1.3, 0.8]; v.at = [24.2, 0.9, -3.95]; v.fov = 46; v.up = W; v.sh = { f: [24.5, 1, -4], R: 5 }; break;
    case 'bolt': v.p = [-0.48, 0.2, -4.42]; v.at = [-0.6, 0.1, -4.2]; v.fov = 36; v.near = 0.03; v.drift = 0.0006; v.sh = { f: [-0.6, 0, -4.2], R: 1.5 }; break;
    case 'lurch': v.p = into([18, 3.2, -7.6], [17.5, 3.1, -7.2], k); v.at = [-4, 4.0, 0]; v.fov = 44; v.sh = { f: [-4, 3, 0], R: 14 }; break;
    case 'last': v.p = into([-1.5, 10.6, -0.4], [-0.5, 10.2, -0.4], k); v.at = [285, 0.5, 0.5]; v.fov = 58; v.up = [0, 0, 1]; v.drift = 0.004; v.fog = 0.5; v.glow = 0.25; v.sh = { f: [80, 0, 0], R: 90 }; break;
    case 'lastin': v.p = RL(-2.4, 1.6, 1.0); v.at = RL(-0.3, 0.4, 0.0); v.fov = 56; v.up = W; v.inside = true; v.sh = { f: RL(-0.5, 0.5, 0.8), R: 3 }; break;
    case 'count': gtCountCam(set, s, t, v, RL); break;
    // ---- 9: down is down
    case 'back': v.p = RL(-3.0, 2.1, 0.45); v.at = RL(-0.6, 0.15, 0.0); v.fov = 66; v.inside = true; v.sh = { f: RL(-1.5, 1, 0), R: 4 }; break;
    case 'backstreet': v.p = into([30, 1.8, 2.6], [31, 1.8, 2.6], k); v.at = [20, 1.6, -4.5]; v.fov = 56; v.sh = { f: [24, 0, -4], R: 10 }; break;
    case 'rainfall': v.p = [44, 0.55, 1.2]; v.at = [60, 0.2, -1.5]; v.fov = 50; v.sh = { f: [52, 0, 0], R: 12 }; break;
    case 'after': v.p = into([22, 2.0, -0.6], [19, 2.2, -0.4], k); v.at = [-4, 4.2, 0]; v.fov = 42; v.sh = { f: [-4, 3, 0], R: 14 }; break;
    case 'question': v.p = into(RL(-3.3, 1.75, 1.2), RL(-2.6, 1.7, 0.8), k); v.at = RL(0.4, 1.3, -0.05); v.fov = 56; v.inside = true; v.sh = { f: RL(-1, 1, 0), R: 4 }; break;
  }
}
// the last ten seconds: quick cuts (GT.subCuts) round everyone
function gtCountCam(set, s, t, v, RL) {
  const n = GT.subCuts.filter((c) => t >= c).length; set._sub = n;
  const W = GT_UP.west;
  if (n === 0) { v.p = [25.4, 1.6, 0.9]; v.at = [24.2, 0.6, -3.95]; v.fov = 42; v.up = W; v.sh = { f: [24, 0.5, -4], R: 4 }; }
  else if (n === 1) { const C = GT_CAT; v.p = RL(-0.7, C.y + 0.1, C.z + 0.55); v.at = RL(-0.15, C.y, C.z); v.fov = 44; v.up = W; v.inside = true; v.sh = { f: RL(0, C.y, C.z), R: 2 }; }
  else if (n === 2) { v.p = RL(-0.45, 0.95, 1.05); v.at = RL(-0.6, 1.0, -1.0); v.fov = 56; v.up = W; v.inside = true; v.sh = { f: RL(-0.5, 1, -0.8), R: 3 }; }   // (the bed and the wardrobe, lying on the window wall beside you)
  else if (n === 3) { v.p = [150, 3.5, 2.5]; v.at = [20, 8, -1]; v.fov = 52; v.up = [0, 0, -1]; v.sh = { f: [80, 0, 0], R: 60 }; }
  else if (n === 4) { v.p = RL(-1.45, 1.45, 0.45); v.at = RL(-0.45, 0.4, 0.0); v.fov = 50; v.up = W; v.inside = true; v.sh = { f: RL(-0.4, 0.4, 0.8), R: 2 }; }   // (you, braced in the corner, from above)
  else { v.p = [-1.5, 10.4, -0.4]; v.at = [285, 0.5, 0.5]; v.fov = 58; v.up = [0, 0, 1]; v.fog = 0.5; v.sh = { f: [80, 0, 0], R: 90 }; }
  v.drift = 0.004;
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function gtLabels(set, t) {
  const shot = gtShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = set._s, R = set.R;
  const RL = (x, y, z) => R.toWorld(x, y, z).toArray();
  if (m === 'master' && t > gtC('tilt', 1) + 0.3) out.push({ p: [GT_W.end - 2, 3, 0], text: 'THE END OF THE STREET', sub: '285 m DOWN', a: W(t, gtC('tilt', 1) + 0.4, shot.t1 - 0.2, 0.3, 0.2) });
  if (m === 'front') out.push({ p: RL(0.06, 1.75, -0.35), text: 'YOU', a: W(t, shot.t0 + 0.5, gtC('glass', 1) - 0.1, 0.3, 0.3) });
  if (m === 'jogger') out.push({ p: [GT_JOG.post.x, 3.5, GT_JOG.post.z], text: 'A LAMP POST', sub: 'SET IN CONCRETE: IT HOLDS', a: W(t, shot.t0 + 0.6, gtC('jogger', 1) - 0.2, 0.3, 0.3) });
  if (m === 'dust2') out.push({ p: [281, 8.5, 0], text: 'DUST', sub: 'RISING, THE OLD WAY', a: W(t, gtC('air', 2) + 0.3, shot.t1 - 0.2, 0.3, 0.2) });
  if (m === 'pit') out.push({ p: RL(-3.58, GT_W.door.h * 0.55, (GT_W.door.z[0] + GT_W.door.z[1]) / 2), text: 'YOUR DOOR', a: W(t, gtC('pit', 1) + 0.2, shot.t1 - 0.2, 0.3, 0.2), side: 'r' });
  if (m === 'dpc') out.push({ p: [16.2, 0.154, 9.5], text: 'DAMP-PROOF COURSE', sub: 'A STRIP OF PLASTIC', a: W(t, shot.t0 + 0.5, shot.t1 - 0.3, 0.3, 0.3), side: 'l' });
  if (m === 'creep') out.push({ p: [-0.6, 0.12, -4.2], text: 'AN ANCHOR BOLT', sub: '1 OF 22', a: W(t, shot.t0 + 0.6, shot.t1 - 0.3, 0.3, 0.3), side: 'r' });
  if (m === 'bow') out.push({ p: RL(0.05, 1.5, 0), text: 'YOUR WINDOW', a: W(t, shot.t0 + 0.5, shot.t0 + 2.6, 0.3, 0.3) });
  return out;
}
