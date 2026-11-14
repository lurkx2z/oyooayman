/* =====================================================================
   RIVER SET — the river, the yard, your boat and everything around them (river.js, yard.js, boat.js), and every camera
   in it. Your eyes are on the stern deck beside your mum; other cameras stand on the wharf, over the water, on the
   bridge, out by the turbines. Your hands are ViewerHands (only in the shot of your phone).
   ===================================================================== */

const MG_HAND_POSES = {
  phone: { p: [0.07, -0.13, -0.3], F: [-0.75, 0.3, -0.55], N: [0.15, 0.35, 1], curl: [0.55, 0.62, 0.7, 0.76], thumb: [0.95, 0.42] },
  // holding on against the pull: the hand dragged out toward the yard, the grip tight, trembling
  strain: { p: [0.095, -0.115, -0.37], F: [-0.68, 0.32, -0.62], N: [0.2, 0.35, 1], curl: [0.66, 0.74, 0.8, 0.86], thumb: [1.0, 0.55], trem: 0.0045 },
  open: { p: [0.1, -0.17, -0.38], F: [-0.2, 0.25, -1], N: [0.05, 1, 0.25], curl: [0.14, 0.17, 0.22, 0.3], thumb: [0.75, 0.1] },
  // the phone torn out of your fingers: the hand jerked after it, the fingers sprung open
  rip: { p: [0.1, -0.1, -0.4], F: [-0.5, 0.45, -0.75], N: [0.15, 0.4, 1], curl: [0.16, 0.2, 0.26, 0.32], thumb: [0.7, 0.14] },
};
const MG_HAND_BL = { phone: 0.01, hidden: 0.01, open: 0.01, rip: 0.22, strain: 3.0 };

// the phone's screen (a music app, playing; at 10:42 it still shows the song the radio was playing)
function mgDrawPhone(g, w, h, st) {
  g.fillStyle = '#0b0d10'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a2a5a'); gr.addColorStop(1, '#0b0d10'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.font = '600 18px Arial'; g.fillText('10:42', 18, 30);
  g.fillStyle = '#d88a3a'; mgRR(g, 30, 70, w - 60, w - 60, 14); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = '700 22px Arial'; g.fillText('Sunday Driver', 30, w + 50);
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = '500 17px Arial'; g.fillText('The Lock Keepers', 30, w + 76);
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(30, w + 110, w - 60, 5); g.fillStyle = '#fff'; g.fillRect(30, w + 110, (w - 60) * 0.41, 5);
  void st;
}

MG_SETS.river = (app) => {
  const S = mgSet(app, { sky: '#c8d6e0', fov: 50, near: 0.05, far: 9000, sun: [0, 0, 0], sunColor: '#fff0dc', sunI: 3.0, shadow: 4096, shadowR: 48, shadowFar: 900,
    hemi: ['#a8c4e6', '#6a6450', 1.05], env: ['#6f9ad0', '#d4dce2', '#5a5a4a'] });
  const scene = S.scene, cam = S.camera;
  scene.fog = new THREE.FogExp2('#c4d0da', 0.00055);
  S.sun.shadow.bias = -0.0005; S.sun.shadow.normalBias = 0.05;
  const W = mgBuildRiverWorld(S), Yd = mgBuildYard(S), Bo = mgBuildBoat(S);
  const fxSp = mgPuffs(scene, 3000, { additive: true, soft: 1.2 }), fxDu = mgPuffs(scene, 4000, { soft: 1.6 });
  // your hands and your phone (only in the phone shot)
  const hands = new ViewerHands(cam, { script: { right: [[-9, 'hidden']], left: [[-9, 'hidden']] }, poses: MG_HAND_POSES, blends: MG_HAND_BL, skin: '#c9967a', nail: '#e2bba8', sleeve: '#4a5a4a', cuff: '#3a483a', watch: false, sleeveLen: 0.36 });
  const PT = mgCanvasTex(270, 576, mgDrawPhone); PT.update({ k: 1 });
  const phone = new THREE.Group();
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.152, 0.0085), mgStd('#2a2d33', 0.35, 0.4)));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), new THREE.MeshBasicMaterial({ map: PT.tex, color: new THREE.Color(1.3, 1.3, 1.3) })); screen.position.z = 0.0046; phone.add(screen);
  scene.add(phone);
  const grip = new THREE.Object3D(); grip.position.set(0.034, 0.074, 0.024); hands.right.g.add(grip);

  const set = {
    scene, camera: cam, W, Yd, Bo,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = mgStoryAt(t), kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1), u = t - shot.t0;
      this._s = s; this._shot = shot; this._t = t;
      W.update(s); Bo.update(s, t, m);
      const v = { p: [0, 5, 10], at: [0, 4, -20], fov: 50, drift: 0.01, near: 0.05, far: 9000, roll: 0, shake: 0 };
      mgRiverCam(this, m, s, t, kk, u, shot, v);
      const dr = v.drift ? mgDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 61) * Math.sin(t * 11.3); dr[1] += j * 0.7 * Math.sin(t * 53 + 1); dr[2] += j * Math.sin(t * 47 + 2) * Math.sin(t * 7.1); }
      if (cam.near !== v.near || cam.far !== v.far) { cam.near = v.near; cam.far = v.far; }
      scene.fog.density = v.fog ?? 0.00055;              // (thinner for the views 1.5 km out to the turbines)
      mgCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov, v.roll);
      // the sun's shadow box follows what the camera looks at
      const tg = new THREE.Vector3(MathX.clamp(v.at[0], cam.position.x - 60, cam.position.x + 60), 0, MathX.clamp(v.at[2], cam.position.z - 60, cam.position.z + 60));
      S.sun.shadow.camera.left = -(v.shadowR || 48); S.sun.shadow.camera.right = v.shadowR || 48; S.sun.shadow.camera.top = v.shadowR || 48; S.sun.shadow.camera.bottom = -(v.shadowR || 48); S.sun.shadow.camera.updateProjectionMatrix();
      S.sun.target.position.copy(tg); S.sun.position.copy(tg).addScaledVector(new THREE.Vector3(...MG_SUN), 400); S.sun.target.updateMatrixWorld();
      // the yard
      fxSp.begin(); fxDu.begin();
      Yd.update(s, { sp: fxSp, du: fxDu }, { rings: m === 'reach', ringT: u });
      mgRiverFx(this, s, fxDu, fxSp);
      fxSp.end(); fxDu.end();
      // your hand and your phone: the phone at the physics' offset from your hand
      // (you hold it until the pull passes 5 times its weight, at story s MG_SMALL.phone.rel; then it's torn away)
      const ph = MG_SMALL.phone, eye = m === 'phone' || m === 'rip', open = m === 'question', tRel = mgFilmAt(ph.rel), gone = s > ph.rel;
      hands.root.visible = eye || open;
      hands.o.script = { right: m === 'rip' ? [[-9, 'strain'], [tRel, 'rip']] : m === 'phone' ? [[-9, 'phone'], [shot.t0 + 1.2, 'strain']] : [[-9, open ? 'open' : 'hidden']], left: [[-9, open ? 'open' : 'hidden']] };
      {
        const hit = ph.hit, sp = Math.min(s, hit), P0 = ph.at(Math.max(0, sp)), H = mgOnBoat(Math.max(0, sp), ...MG_SMALL.hand), a = Math.max(0, sp - ph.rel);
        if (eye) {
          // once it's torn away it flies from where your fingers held it, not from wherever your hand goes next
          hands.update(gone ? tRel - 1e-3 : t);
          grip.updateWorldMatrix(true, false); const gw = grip.getWorldPosition(new THREE.Vector3()), gq = grip.getWorldQuaternion(new THREE.Quaternion());
          phone.position.set(gw.x + P0[0] - H[0], gw.y + P0[1] - H[1], gw.z + P0[2] - H[2]); phone.quaternion.copy(gq); phone.rotateZ(-Math.PI / 2);
          if (gone) { phone.rotateX(7 * a); phone.rotateY(3 * a); hands.update(t); }
        } else if (open) hands.update(t);
        if (!eye) { phone.position.set(...P0); phone.rotation.set(0.4 + 7 * a, 1.2 + 3 * a, 0.3); }
        phone.visible = (eye || gone) && s < hit && s < MGP.T;
        phone.scale.setScalar(eye ? 1 : m === 'phonehit' ? 1.3 : 2.2);   // (in the wide shots a little bigger, or it would be a single pixel)
      }
    },
    labels(t) { return mgRiverLabels(this, t); },
    grade(t, p) {
      p.exposure = 1.0; p.saturation = 1.06; p.contrast = 1.07; p.warmth = 0.015; p.vignette = 0.42; p.bloom = 0.28; p.bloomThreshold = 0.93; p.grain = 0.024; p.blackLift = 0.006;
      const s = this._s;
      // the crash into the wall (a jolt), the drop at 10:42:10
      if (MGB.hit != null && s > MGB.hit && s < MGB.hit + 0.3) p.flash = 0.12 * Math.exp(-(s - MGB.hit) / 0.05);
    },
  };
  return set;
};

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS (v: p, at, fov, drift, shake, near, far)
// ---------------------------------------------------------------------------------------------------------------------
function mgRiverCam(set, m, s, t, kk, u, shot, v) {
  const Bo = set.Bo, MB = MG_F.ballC, eye = (lx = -7.3, ly = 2.11, lz = -0.5) => Bo.world(lx, ly, lz);
  const ball = MGY.magAt(Math.min(s, MGP.T));
  switch (m) {
    case 'title': { v.p = eye(-7.35, 2.12, -0.35); v.at = mgV(Bo.world(4, 1.9, -4.5), [ball[0], ball[1] + 3, ball[2]], 0.55); v.fov = 52; v.drift = 0.012; break; }
    case 'yard': { v.p = eye(); const k = mgK(u, 0, 6); v.at = [ball[0] - 0.4, mgLerp(7.0, 6.2, k), ball[2]]; v.fov = mgLerp(30, 24, k); v.drift = 0.01; break; }
    case 'radio': { v.p = Bo.world(-6.85, 2.42, 0.45); v.at = Bo.world(-5.85, 2.1, -0.18); v.fov = 34; v.drift = 0.004; break; }
    case 'phone': { v.p = eye(-7.3, 2.1, -0.5); const d = mgN3([ball[0] - v.p[0], 0, ball[2] - v.p[2]]); v.at = [v.p[0] + d[0] * 10, v.p[1] - 1.5, v.p[2] + d[2] * 10]; v.fov = 50; v.drift = 0.006; break; }
    case 'pile': { const k = mgK(u, 0, 14); v.p = [mgLerp(13, 11, k), 3.1, -20.6]; v.at = [ball[0] + 1, mgLerp(6.5, 7.5, k), ball[2]]; v.fov = 52; v.drift = 0.01; break; }
    case 'rope': { const tp = set.Yd.tip; v.p = [9, 6.5, -14.5]; v.at = mgV([tp[0], tp[1] + 1.5, tp[2]], [tp[0], tp[1] - 4, tp[2]], mgK(u, 1.5, 5.5)); v.fov = 44; v.drift = 0.01; break; }
    case 'reach': { const k = mgK(u, 0, 10); v.p = [mgLerp(-6, -3, k), mgLerp(46, 52, k), mgLerp(16, 20, k)]; v.at = [1, 2, -28]; v.fov = 46; v.near = 0.5; v.shadowR = 60; break; }
    case 'hospitalExt': { v.p = eye(-7.2, 2.15, 0.7); v.at = [MG_F.hospital.mri[0] - 2, 4.4, MG_F.hospital.mri[2]]; v.fov = mgLerp(40, 32, mgK(u, 0, 8)); v.drift = 0.01; break; }
    case 'speed': { v.p = [7.5, 4.2, -20.4]; v.at = [ball[0] - 0.5, ball[1] + 0.2, ball[2]]; v.fov = mgLerp(44, 36, mgK(u, 0, 9)); v.drift = 0.01; break; }
    case 'boatAir': { const bx = MGB.x(s), bz = MGB.z(s), k = mgK(u, 0, 14); v.p = [bx - 14 + 4 * k, 24, bz + 16]; v.at = [(bx + MB[0]) / 2, 1.5, (bz + MB[2]) / 2 + 1]; v.fov = 48; v.near = 0.3; v.shadowR = 50; break; }
    case 'hull': { const bx = MGB.x(s), bz = MGB.z(s), k = mgK(u, 0, 10); v.p = [bx - mgLerp(14, 12.5, k), 0.62, bz + 3.2]; v.at = [bx + 3, mgLerp(1.6, 2.4, k), bz - 9]; v.fov = 46; v.drift = 0.008; v.near = 0.2; break; }
    case 'rip': {
      // your eyes again: your hand, your phone, and beyond them the ball; once it's torn away, you look up after it
      v.p = eye(-7.3, 2.1, -0.5); const d = mgN3([ball[0] - v.p[0], 0, ball[2] - v.p[2]]), tr = mgFilmAt(MG_SMALL.phone.rel) - shot.t0;
      v.at = mgV([v.p[0] + d[0] * 10, v.p[1] - 1.2, v.p[2] + d[2] * 10], [ball[0], mgLerp(v.p[1], ball[1], 0.45), ball[2]], mgK(u, tr + 0.2, tr + 3.0));
      v.fov = 50; v.drift = 0.005; if (u > tr) v.shake = 0.012 * Math.exp(-(u - tr) / 0.5);
      break;
    }
    case 'phonehit': {
      // side-on to the phone's last 4 metres: it streaks in and strikes the ball
      const ph = MG_SMALL.phone, hp = ph.at(ph.hit), a = ph.at(ph.hit - 0.02), d = mgN3([hp[0] - a[0], hp[1] - a[1], hp[2] - a[2]]), sd = mgN3([-d[2], 0, d[0]]);
      v.p = [hp[0] - d[0] * 2.2 + sd[0] * 6.8, hp[1] + 1.6, hp[2] - d[2] * 2.2 + sd[2] * 6.8]; v.at = [hp[0] - d[0] * 1.7, hp[1] - 0.1, hp[2] - d[2] * 1.7]; v.fov = 38; v.drift = 0.006;
      if (s > ph.hit) v.shake = 0.03 * Math.exp(-(s - ph.hit) / 0.02);
      break;
    }
    case 'real': { v.p = eye(); v.at = [ball[0], ball[1] + 0.3, ball[2]]; v.fov = mgLerp(28, 22, mgK(u, 0, 12)); v.drift = 0.008; break; }
    // the check-ins on your boat (short; each from a new place): over the ball's shoulder; low on the water; your own eyes
    case 'check1': { const bx = MGB.x(s), bz = MGB.z(s); v.p = [6.5, 7.6, -31.5]; v.at = [bx + 1, 1.0, bz - 1]; v.fov = 44; v.drift = 0.008; v.near = 0.3; v.shadowR = 40; break; }
    case 'check2': { const bx = MGB.x(s), bz = MGB.z(s), k = mgK(u, 0, 4); v.p = [bx + mgLerp(17, 15.5, k), 0.75, bz + 4.2]; v.at = [bx - 1, 1.4, bz - 3.2]; v.fov = 40; v.drift = 0.008; v.near = 0.2; break; }
    case 'check3': { v.p = eye(-7.3, 2.12, -0.55); v.at = [ball[0], ball[1] + 0.2, ball[2]]; v.fov = mgLerp(36, 31, mgK(u, 0, 4)); v.drift = 0.01; break; }
    case 'cars': { const k = mgK(u, 0, 10); v.p = [mgLerp(31, 29, k), 4.2, -21.6]; v.at = [mgLerp(12, 6, k), 3.8, -28]; v.fov = 50; v.drift = 0.01; break; }
    case 'bridge': { const B = MG_F.bridge; v.p = [B.x - 2.8, B.y + 3.2, -66]; v.at = [B.x, B.y + 0.5, -10]; v.fov = 44; v.drift = 0.012; break; }
    case 'bridgeWide': { const B = MG_F.bridge, k = mgK(u, 0, 6); v.p = [B.x - 34, B.y + 10, mgLerp(-32, -28, k)]; v.at = [B.x + 1, B.y + 0.8, 2]; v.fov = 42; v.drift = 0.01; v.near = 0.3; break; }
    case 'turbines': { const T = MG_F.turbines[1]; v.p = [64, 24, 6]; v.at = [T[0] - 30, mgGroundY(T[0], T[2]) + 50, T[2] + 20]; v.fov = mgLerp(9, 7.5, mgK(u, 0, 9)); v.drift = 0.004; v.far = 9000; v.near = 1; v.fog = 0.00007; break; }
    case 'blades': { const T = MG_F.turbines[0], gy = mgGroundY(T[0], T[2]); v.p = [T[0] - 75, gy + 5, T[2] + 105]; v.at = [T[0] + 4, gy + 50, T[2]]; v.fov = 52; v.near = 0.5; v.drift = 0.02; v.fog = 0.00025; break; }
    case 'mum': { v.p = Bo.world(-10.3, 2.0, 1.9); v.at = Bo.world(-6.6, 1.75, -1.0); v.fov = 44; v.drift = 0.01; break; }
    case 'inside': { v.p = Bo.world(-5.95, 1.42, -0.52); v.at = Bo.world(-4.05, 0.72, 0.42); v.fov = 60; v.drift = 0.004; v.near = 0.03; break; }
    case 'close': { const bx = MGB.x(s), bz = MGB.z(s); v.p = [bx - 16, 11, bz + 7]; v.at = [bx + 3, 0.8, (bz + MG_F.wharf.z) / 2]; v.fov = 46; v.near = 0.3; v.shadowR = 40; break; }
    case 'count': case 'bike': {
      v.p = eye(); v.fov = 54; v.drift = 0.01;
      if (m === 'count') v.at = mgV(Bo.world(3, 1.8, -4), [ball[0], ball[1], ball[2]], 0.6);
      else { v.at = mgV(Bo.world(1.2, 2.5, -0.3), [ball[0], ball[1] + 1, ball[2]], 0.45); v.fov = 64; }
      if (MGB.hit != null && s > MGB.hit) v.shake = 0.12 * Math.exp(-(s - MGB.hit) / 0.08);
      break;
    }
    case 'lift': case 'drop': {
      const bx = MGB.x(s), k = mgK(u, 0, 6); v.p = [bx + mgLerp(10.5, 9.5, k), 0.5, -13.6]; v.at = [bx + 0.5, 1.5, -18.6]; v.fov = 54; v.drift = 0.01; v.near = 0.1;
      if (MGB.hit != null && s > MGB.hit) v.shake = 0.06 * Math.exp(-(s - MGB.hit) / 0.08);
      if (s > MGP.T) v.shake = 0.03 * Math.exp(-(s - MGP.T - 0.3) * (s - MGP.T - 0.3) / 0.05);
      break;
    }
    case 'heap': { const k = mgK(u, 0, 7); v.p = [mgLerp(13, 11.5, k), mgLerp(6.2, 5.6, k), -16.8]; v.at = [-0.5, 3.2, -24.5]; v.fov = 50; v.drift = 0.012; v.near = 0.1; break; }
    case 'after': { const k = mgK(u, 0, 5); v.p = [mgLerp(8.98, 8.9, k), mgLerp(2.47, 2.44, k), mgLerp(-21.2, -21.25, k)]; v.at = [8.36, 2.3, -21.74]; v.fov = 44; v.drift = 0.004; v.near = 0.02; break; }
    case 'stuck': { const bx = MGB.x(s), k = mgK(u, 0, 5); v.p = [bx + mgLerp(8, 6.5, k), 3.0, -11.6]; v.at = [bx - 2.5, 1.0, -18.7]; v.fov = 46; v.drift = 0.008; v.near = 0.1; break; }
    case 'question': { v.p = eye(-7.3, 2.15, -0.2); const f = Bo.world(-3.0, 1.2, 1.6); v.at = f; v.fov = 54; v.drift = 0.005; break; }
    default: { v.p = eye(); v.at = ball; }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// EFFECTS (puffs): the boat's wake, chimney smoke, splashes (the crash, the drop), tyre smoke on the bridge
// ---------------------------------------------------------------------------------------------------------------------
function mgRiverFx(set, s, du, sp) {
  const Bo = set.Bo;
  // the chimney's wisp
  for (let i = 0; i < 14; i++) { const a = ((s * 0.35 + i / 14) % 1), p = Bo.world(4.6, MG_BOAT.roof + 0.6 + a * 2.2, -0.35); du.add(p[0] - a * 2.5, p[1], p[2] + a * 0.8, 0.18 + 0.7 * a, 0.18 * (1 - a), 0.75, 0.74, 0.72); }
  // the wake at the stern and the bow wave
  for (let i = 0; i < 24; i++) { const a = i / 24, p = Bo.world(-8.8 - a * 6, 0.02, (i % 2 ? 1 : -1) * (0.6 + a * 1.8)); du.add(p[0], 0.05, p[2], 0.35 + 0.5 * a, 0.12 * (1 - a), 0.9, 0.93, 0.95); }
  // the crash into the wall: spray up the gap; the drop at 10:42:10: a splash all along the hull
  if (MGB.hit != null) {
    const u = s - MGB.hit;
    if (u > 0 && u < 1.2) for (let i = 0; i < 70; i++) { const r = mgRand(i * 7 + 1), x = MGB.x(s) - 8 + 16 * r(), vy = 3 + 6 * r(), h = vy * u - 4.9 * u * u; if (h < 0) continue; du.add(x, h, MG_F.wharf.z + 0.3 + 0.4 * r(), 0.1 + 0.2 * r(), 0.45 * (1 - u / 1.2), 0.8, 0.86, 0.88); }
  }
  {
    const u = s - MGP.T - 0.2;
    if (u > 0 && u < 2.0) for (let i = 0; i < 160; i++) { const r = mgRand(i * 13 + 5), side = r() < 0.5 ? -1 : 1, x = MGB.x(s) - 8.5 + 17 * r(), z = MGB.z(s) + side * (1.15 + 0.5 * r()), vy = 2.5 + 5 * r(), vz = side * (1 + 2 * r()), h = vy * u - 4.9 * u * u; if (h < -0.1) continue; du.add(x, Math.max(0.05, h), z + vz * u, 0.12 + 0.24 * r(), 0.48 * (1 - u / 2), 0.8, 0.86, 0.88); }
  }
  // the heap's pieces that fell into the river: a splash each
  for (const b of MGY.bodies) {
    if (!b.track2) continue;
    const e = b.splashS ?? (b.splashS = (() => { const A = b.track2; for (let i = 0; i < A.length / 3; i++) if (A[i * 3 + 1] < 0.05 && A[i * 3 + 2] > MG_F.wharf.z) return MGP.T + i * MG_DS; return -1; })());
    if (e < 0) continue;
    const u = s - e; if (u < 0 || u > 1.2) continue;
    const p = MGY.pos(b, e);
    for (let i = 0; i < 10; i++) { const r = mgRand(b.seed * 3 + i), vy = 2 + 4 * r(), h = vy * u - 4.9 * u * u; if (h < 0) continue; du.add(p[0] + (r() - 0.5) * 1.5 * u, h, p[2] + (r() - 0.5) * 1.5 * u, 0.2 + 0.3 * r(), 0.6 * (1 - u / 1.2), 0.92, 0.95, 0.97); }
  }
  // your phone in flight: a streak behind it (longer the faster it goes); at the hit, a burst of sparks
  {
    const ph = MG_SMALL.phone, h = ph.hit;
    if (s > ph.rel + 0.01 && s < h + 0.03) {
      const q0 = Math.min(s, h), P1 = ph.at(q0), P2 = ph.at(q0 - 0.001), vel = Math.hypot(P1[0] - P2[0], P1[1] - P2[1], P1[2] - P2[2]) / 0.001;
      const fade = s < h ? MathX.clamp((s - ph.rel - 0.01) / 0.05, 0, 1) : Math.exp(-(s - h) / 0.004), Lt = Math.min(2, 0.3 + vel * 0.004), dq = Lt / Math.max(1, vel) / 26;
      for (let i = 0; i < 26; i++) { const q = q0 - i * dq; if (q < ph.rel) break; const p = ph.at(q); sp.add(p[0], p[1], p[2], 0.04 + 0.08 * (1 - i / 26), 0.55 * (1 - i / 26) * fade, 1, 0.86, 0.62); }
      if (s >= h) { const u = s - h; for (let i = 0; i < 50; i++) { const r = mgRand(i * 7 + 911), d = mgN3([r() - 0.5, r() - 0.25, r() - 0.5]), v2 = 40 + 110 * r(); sp.add(P1[0] + d[0] * v2 * u, P1[1] + d[1] * v2 * u - 4.9 * u * u, P1[2] + d[2] * v2 * u, 0.08 + 0.09 * r(), 0.95 * Math.exp(-u / 0.012), 1, 0.78, 0.42); } sp.add(P1[0], P1[1], P1[2], 0.5 + 40 * u, 0.9 * Math.exp(-u / 0.003), 1, 0.9, 0.7); }
    }
  }
  // the bridge's skidding electric cars: tyre smoke behind each locked wheel
  for (const { c, v } of set.W.bridgeCars) {
    const q = MGT_FAR.car(c, s); if (!q.skid) continue;
    const g = v.group;
    for (let i = 0; i < 6; i++) { const r = mgRand(i + 31 * c.z0), a = ((s * 2 + i / 6) % 1); du.add(g.position.x + (r() - 0.5) * 1.6, 0.3 + a * 1.5 + MG_F.bridge.y, g.position.z - c.dir * (1.8 + a * 3), 0.6 + 1.5 * a, 0.35 * (1 - a), 0.82, 0.82, 0.8); }
  }
  void sp;
}

// ---------------------------------------------------------------------------------------------------------------------
// LABELS pinned in the scene ([{ p, text, sub, a }])
// ---------------------------------------------------------------------------------------------------------------------
function mgRiverLabels(set, t) {
  const sh = set._shot, s = set._s, m = sh.mode, u = t - sh.t0, L = [], MB = MG_F.ballC, W = (a, b) => mgWin(u, a, b, 0.4, 0.4);
  if (m === 'reach') {
    L.push({ p: [MB[0] + MGP.reach1, MG_F.wharf.top + 0.2, MB[2]], text: 'NORMAL REACH', sub: `${MGP.reach1.toFixed(1)} m`, a: W(0.8, 99), side: 'l' });
    L.push({ p: [MB[0] + MGP.reachK * 0.72, MG_F.wharf.top + 0.2, MB[2] + MGP.reachK * 0.69], text: 'NOW', sub: `${MGP.reachK.toFixed(1)} m`, a: W(2.6, 99) });
  }
  if (m === 'boatAir') { const bz = MGB.z(s); L.push({ p: [MGB.x(s), 1.0, bz - MG_F.boat.B / 2], text: 'YOUR BOAT', sub: `${MGB.dist(s).toFixed(1)} m FROM THE BALL`, a: W(0.5, 99) }); }
  if (m === 'cars') { for (const { b } of set.Yd.cars.slice(0, 3)) { const p = MGY.pos(b, s); if (b.firstHit != null && s > b.firstHit) continue; const d = Math.hypot(p[0] - MB[0], p[2] - MB[2]); L.push({ p: [p[0], p[1] + 1.2, p[2]], text: `${d.toFixed(1)} m`, a: W(0.6, 99) * 0.95 }); } }
  if (m === 'turbines') { const T = MG_F.turbines[1], d = Math.hypot(T[0] - MGB.x(s), T[2] - MGB.z(s)); L.push({ p: [T[0], mgGroundY(T[0], T[2]) + MG_F.hub, T[2]], text: 'WIND TURBINES', sub: `${(d / 1000).toFixed(1)} km AWAY · HUB ${MG_F.hub} m UP`, a: W(0.6, 6) }); }
  if (m === 'close' || m === 'boatAir') { const g = MGB.gap(s); if (m === 'close') L.push({ p: [MGB.x(s) + 6.5, 1.0, (MGB.z(s) - MG_F.boat.B / 2 + MG_F.wharf.z) / 2], text: `${g.toFixed(1)} m`, sub: 'TO THE WALL', a: W(0.4, 99), side: 'l' }); }
  if (m === 'check1' || m === 'check2') L.push({ p: [MGB.x(s), 1.3, MGB.z(s)], text: 'YOUR BOAT', sub: `${MGB.dist(s).toFixed(1)} m FROM THE BALL`, a: W(0.3, 99) });
  if (m === 'check3') { const R = MGY.R(s); L.push({ p: [MB[0] - R * 0.8, MB[1] + R * 0.9, MB[2] + R * 0.4], text: 'THE BALL', sub: `${MGB.dist(s).toFixed(1)} m AWAY`, a: W(0.3, 99), side: 'l' }); }
  return L;
}
