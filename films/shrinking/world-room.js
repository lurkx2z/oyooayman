/* =====================================================================
   WORLD · ROOM (0 → 124.4 s, metres) — the bedroom from 1.75 m down to a quarter of a millimetre.
     0–47     shrinking where you stand; the cat on the bedside table notices, jumps down (the glass smashes, the phone
              falls), sniffs you, and bolts when the phone buzzes
     47–73    to the toy brick; you lift its end over your head (its hollow underside) and let it fall
     74–84    you run, and jump fifty times your height onto your glowing phone (slow motion)
     84–117   across the message: letters, pixels, subpixels; the call; the vibration is an earthquake
     117–124  thrown off the edge, the fall to the floor (slow motion)
   ===================================================================== */

// the phone's resting place on the floor (after the fall) and its yaw; phone-local (x right, z down) → room
const SH_PH = { x: -0.40, z: -1.20, yaw: Math.PI / 2 + 0.12 };
function shPhoneW(xl, zl, y = SH_PHONE.t) {
  const c = Math.cos(SH_PH.yaw), s = Math.sin(SH_PH.yaw);
  return [SH_PH.x + xl * c + zl * s, y, SH_PH.z - xl * s + zl * c];
}
// the toy brick (2×4): body 31.8 × 15.8 × 9.6 mm, studs 4.8 × 1.7 mm; it lies with its long axis at yaw SH_BRICK.yaw
const SH_BRICK = { x: -0.2616, z: -0.9787, yaw: 1.4, L: 0.0318, W: 0.0158, H: 0.0096 };
const SH_CAT_SEAT = [-0.25, SH_TABLE.top, -2.17];

// ---------------------------------------------------------------------------------------------------------------------
// where you are: floor position keys [t, x, z], eye height as a fraction of your height, look direction keys [t, yaw, pitch]
// (yaw 0 = towards the window wall, + = to your left)
// ---------------------------------------------------------------------------------------------------------------------
const SH_RM_POS = [
  [0, -0.10, -0.18], [10.5, -0.10, -0.2], [14, -0.105, -0.36], [19, -0.115, -0.66], [23, -0.12, -0.78], [47.5, -0.12, -0.78],
  [50, -0.138, -0.82], [53, -0.1445, -0.86], [55.5, -0.16, -0.89], [60, -0.225, -0.955], [64.5, -0.2395, -0.9748], [72.6, -0.2395, -0.9748],
  [74, -0.24, -0.98], [76.5, -0.27, -1.025], [79.4, -0.33, -1.08],
];
const SH_RM_EYE = [[0, 0.93], [62, 0.93], [65.2, 0.93], [66.3, 0.62], [67.6, 0.66], [68.8, 0.97], [72.6, 0.97], [73.4, 0.9], [74, 0.93]];
const SH_RM_DIR = [
  [0, 0.06, 0.02], [3.2, 0.06, 0.02], [5.6, 0.04, 0.42], [8.2, 0.02, 0.34], [9.5, 0.04, -0.5], [12.2, 0.06, -0.42], [14, 0.12, -0.02], [19, 0.1, 0.08],
  [23.0, 0.11, 0.2], [28.5, 0.11, 0.33], [31.5, 0.11, 0.36], [32.4, 0.11, 0.33], [33.3, 0.12, 0.05], [35, 0.12, 0.12], [36.8, 0.1, 0.22],
  [42.8, 0.1, 0.22], [43.4, 0.35, 0.1], [45, -0.35, 0.08], [47.5, -0.2, 0.02],
  [49.5, 0.0, -0.3], [52, -0.04, -0.52], [55.5, -0.02, -0.42], [57.8, 0.85, -0.3], [62, 1.25, -0.12], [64.5, 1.4, -0.2],
  [65.6, 1.4, -0.62], [66.6, 1.4, -0.7], [67.6, 1.4, -0.35], [68.8, 1.4, 0.62], [71.8, 1.4, 0.66], [72.6, 1.4, 0.5], [73.2, 1.4, -0.28],
  [74.2, 0.95, -0.05], [76, 0.75, -0.1], [78.6, 0.72, -0.25], [79.4, 0.72, -0.2],
];
// on the phone: phone-local keys [t, xl, zl] and look keys [t, yaw, pitch] (yaw relative to the phone: 0 = towards its top)
// (written in screen pixels: x from the left, y from the top of the 1170 × 2532 screen)
const shPxL = (x, y) => [-SH_PHONE.scrW / 2 + x * SH_PHONE.scrW / SH_PHONE.px, -SH_PHONE.scrL / 2 + y * SH_PHONE.scrL / SH_PHONE.py];
const SH_RM_ONPH = [[83.6, 400, 1662], [86, 392, 1668], [90, 332, 1674], [95, 268, 1642], [100, 256, 1626], [104.5, 232, 1616], [110.8, 186, 1604], [113.2, 176, 1600]]
  .map(([t, x, y]) => [t, ...shPxL(x, y)]);
const SH_RM_PHDIR = [
  [83.6, 0.15, -0.6], [85, 0.1, -0.28], [87.5, 0.05, -0.3], [90, 0.3, -0.42], [93, 0.4, -0.7], [95, 0.25, -0.95], [98, 0.15, -1.12],
  [100, 0.2, -1.28], [103, 0.4, -1.05], [104.5, 0.9, -0.72], [108.5, 1.2, -0.62], [110.8, 0.7, -0.45], [112.4, 0.25, -0.2], [113.2, 0.9, -0.3],
];

function shRoomCam(t, h) {
  let p, dir, roll = 0;
  const top = SH_PHONE.t;
  if (t < SH.jump) {
    const [x, z] = shSpline(SH_RM_POS, t), e = shKey(SH_RM_EYE, t)[0];
    let y = e * h;
    // running: a quick bob
    if (t > SH.run && t < SH.jump) { const k = shWin(t, SH.run, SH.jump, 0.6, 0.4); y += Math.abs(Math.sin((t - SH.run) * 7.5)) * 0.06 * h * k; roll = Math.sin((t - SH.run) * 7.5) * 0.02 * k; }
    p = [x, y, z];
    const [yw, pt] = shKey(SH_RM_DIR, t);
    dir = shDir(yw, pt);
  } else if (t < SH.land) {
    // the jump: slow-motion ballistic arc, 28 cm up (about fifty times your height), onto the screen
    const u = (t - SH.jump) / (SH.land - SH.jump), a = [-0.33, 0, -1.08], b = shPhoneW(SH_RM_ONPH[0][1], SH_RM_ONPH[0][2], top);
    const uh = Ease.inOutSine(u) * 0.85 + u * 0.15;
    const y = a[1] + (b[1] - a[1]) * u + 4 * 0.28 * u * (1 - u);
    p = [a[0] + (b[0] - a[0]) * uh, y + 0.93 * h, a[2] + (b[2] - a[2]) * uh];
    // look: the phone below; at the top, the whole floor
    const tgt = shPhoneW(0, 0.01, top);
    const toP = shN3([tgt[0] - p[0], tgt[1] - p[1], tgt[2] - p[2]]);
    const fwd = shDir(0.72, -0.15);
    dir = shN3(shMix3(fwd, toP, MathX.smooth(u, 0.05, 0.4)));
    roll = Math.sin(u * Math.PI) * -0.08;
  } else {
    // on the phone (phone-local keys), then the quake and the fall
    const [xl, zl] = shSpline(SH_RM_ONPH, Math.min(t, SH.quake));
    let [yl, pl] = shKey(SH_RM_PHDIR, Math.min(t, SH.quake));
    let q = shPhoneW(xl, zl, top), y = top;
    // the landing: knees bend
    const land = MathX.impulse(t, SH.land, 0.35) * 0.35;
    if (t >= SH.quake) {
      // hops towards the edge (phone-local −x), each a small arc; then the big launch over the edge at SH.thrown
      const edgeX = -0.0356, u = MathX.clamp((t - SH.quake) / (SH.thrown - SH.quake), 0, 1);
      const nx = xl + (edgeX + 0.0012 - xl) * Ease.inOutSine(u), nz = zl + Math.sin(u * 5) * 0.0006;
      q = shPhoneW(nx, nz, top);
      const hopT = (t - SH.quake) * 2.3, ph = hopT - Math.floor(hopT), amp = (0.6 + 0.5 * hash1(Math.floor(hopT) + 7)) * h;
      y = top + Math.sin(ph * Math.PI) * amp * shWin(t, SH.quake, SH.thrown + 0.2, 0.3, 0.1);
      yl = 0.9 + Math.sin(t * 3.1) * 0.5 + noise1(t * 2, 5) * 0.4; pl = -0.25 + noise1(t * 1.7, 9) * 0.25;
      roll = noise1(t * 4, 11) * 0.12;
      // the buzz itself: a hard, fast shake while the motor runs (1.2 s on, 0.8 s off)
      const c = (t - SH.quake) % 2.0, vb = t < SH.thrown ? MathX.clamp(Math.min(c / 0.03, (1.2 - c) / 0.06), 0, 1) : 0;
      q = [q[0] + noise1(t * 37, 3) * 0.06 * h * vb, q[1], q[2] + noise1(t * 39, 6) * 0.06 * h * vb]; y += Math.abs(noise1(t * 43, 4)) * 0.08 * h * vb;
      roll += noise1(t * 31, 5) * 0.06 * vb; pl += noise1(t * 29, 7) * 0.05 * vb;
      if (t >= SH.thrown) {
        // over the edge: out and down 7.8 mm to the floor, tumbling (slow motion)
        const v = MathX.clamp((t - SH.thrown) / (SH.floor - SH.thrown), 0, 1);
        const e0 = shPhoneW(edgeX + 0.0012, nz, top), e1 = shPhoneW(edgeX - 0.0042, nz + 0.0012, 0);
        const vx = Ease.outCubic(v), vy = v * v * 0.8 + v * 0.2;
        q = [e0[0] + (e1[0] - e0[0]) * vx, top + (0 - top) * vy + Math.sin(Math.min(1, v * 3) * Math.PI) * 0.0006 * (1 - v), e0[2] + (e1[2] - e0[2]) * vx];
        y = q[1];
        // turn to look back up at the phone's edge (its buttons go past), then down at the floor rushing up
        const back = MathX.smooth(v, 0.05, 0.3) * (1 - MathX.smooth(v, 0.5, 0.75));
        yl = 0.9 + back * (-Math.PI / 2 - 0.9 + 0.35) + MathX.smooth(v, 0.5, 0.75) * 0.6;
        pl = -0.25 + back * 0.55 - MathX.smooth(v, 0.5, 0.8) * 0.95;
        roll = Math.sin(v * 4.5) * 0.35 * (1 - v * 0.5);
      }
    }
    p = [q[0], y + h * (0.93 - land), q[2]];
    dir = shDir(SH_PH.yaw + yl, pl);
  }
  return { p, dir, roll };
}

// ---------------------------------------------------------------------------------------------------------------------
SH_WORLDS.room = (app) => {
  const W = shMakeWorld(60), R = W.root;
  W.scene.background = new THREE.Color('#0b0a0c');
  const set = shBuildBedroom(W, app);
  const phone = shBuildPhone(R);
  const cat = shBuildCat(R);
  // ---- the toy brick
  const brickM = new THREE.MeshPhysicalMaterial({ color: '#c3141c', roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 0.9 });
  const brick = new THREE.Group(); R.add(brick);
  const brickBody = new THREE.Group(); brick.add(brickBody);
  const brickIn = new THREE.Group(); brickBody.add(brickIn);
  {
    const B = SH_BRICK, wall = 0.0012, bat = new Batcher();
    // walls and top (the underside is hollow, with three tubes)
    bat.add(shRoundBox(B.L, 0.001, B.W, 0.0004, 0, 2), brickM, Geo.matrix(0, B.H - 0.001, 0));
    for (const s of [-1, 1]) {
      bat.box(B.L, B.H - 0.001, wall, 0, (B.H - 0.001) / 2, s * (B.W / 2 - wall / 2), brickM);
      bat.box(wall, B.H - 0.001, B.W - 2 * wall, s * (B.L / 2 - wall / 2), (B.H - 0.001) / 2, 0, brickM);
    }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) bat.add(new THREE.CylinderGeometry(0.0024, 0.0024, 0.0017, 28), brickM, Geo.matrix((i - 1.5) * 0.008, B.H + 0.00085, (j - 0.5) * 0.008));
    for (let i = 0; i < 3; i++) {
      bat.add(new THREE.CylinderGeometry(0.00325, 0.00325, B.H - 0.001, 28, 1, true), brickM, Geo.matrix((i - 1) * 0.008, (B.H - 0.001) / 2, 0));
      bat.add(new THREE.CylinderGeometry(0.0024, 0.0024, B.H - 0.0011, 24, 1, true), brickM, Geo.matrix((i - 1) * 0.008, (B.H - 0.001) / 2, 0));
    }
    bat.build(brickIn, 'brick').forEach((m) => { m.castShadow = m.receiveShadow = true; m.material.side = THREE.DoubleSide; });
    // two more bricks further off (a blue 2×2, a yellow 1×4)
    for (const [x, z, w, d, c, ry] of [[-0.62, -0.72, 0.0158, 0.0158, '#1d4fb8', 0.4], [0.18, -0.55, 0.0318, 0.0078, '#e6b31e', 1.1]]) {
      const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; R.add(o);
      shAddMesh(o, shRoundBox(w, B.H, d, 0.0004, 0, 2), shStd(c, 0.3), 0, 0, 0);
      for (let i = 0; i < Math.round(w / 0.008); i++) for (let j = 0; j < Math.round(d / 0.008); j++) shAddMesh(o, new THREE.CylinderGeometry(0.0024, 0.0024, 0.0017, 20), shStd(c, 0.3), (i - (w / 0.008 - 1) / 2) * 0.008, B.H + 0.00085, (j - (d / 0.008 - 1) / 2) * 0.008);
    }
  }
  // ---- the glass of water (and its pieces)
  const glassM = new THREE.MeshStandardMaterial({ color: '#dcebf2', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.22, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
  const waterM = new THREE.MeshStandardMaterial({ color: '#9cc6da', roughness: 0.05, transparent: true, opacity: 0.38, envMapIntensity: 1.4, depthWrite: false });
  const glass = new THREE.Group(); R.add(glass);
  { const g1 = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.031, 0.11, 32, 1, true), glassM); g1.position.y = 0.055; g1.renderOrder = 3; glass.add(g1);
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.008, 32), glassM); b1.position.y = 0.004; glass.add(b1);
    const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.031, 0.072, 32), waterM); w1.position.y = 0.044; w1.renderOrder = 2; glass.add(w1); }
  const shards = [];
  { const r = new RNG(12);
    for (let i = 0; i < 46; i++) {
      const s = r.range(0.004, 0.018), gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, s * r.range(0.5, 1), 0, s * r.range(-0.3, 0.3), s * r.range(-0.2, 0.6), 0, s * r.range(0.4, 1)], 3));
      gg.computeVertexNormals();
      const m = new THREE.Mesh(gg, glassM); m.visible = false; m.renderOrder = 3; R.add(m);
      const a = r.range(0, 6.283), sp = r.range(0.25, 1.1);
      shards.push({ m, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp * 0.8 + 0.15, vy: r.range(0.4, 1.4), spin: [r.range(-14, 14), r.range(-14, 14), r.range(-14, 14)], drag: r.range(2.5, 5) });
    } }
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: '#0f1418', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.55, envMapIntensity: 2.0, depthWrite: false }));
  puddle.rotation.x = -Math.PI / 2; puddle.visible = false; puddle.renderOrder = 1; R.add(puddle);
  // splash droplets
  const dropN = 90, dropG = new THREE.BufferGeometry(), dropP = new Float32Array(dropN * 3);
  dropG.setAttribute('position', new THREE.BufferAttribute(dropP, 3));
  const drops = new THREE.Points(dropG, new THREE.PointsMaterial({ color: '#cfe6f2', map: shDotTex(0.4), transparent: true, depthWrite: false, size: 0.006, opacity: 0.8 }));
  drops.frustumCulled = false; R.add(drops);
  // dust floating in the lamp light
  const moteN = 260, moteG = new THREE.BufferGeometry(), moteP = new Float32Array(moteN * 3);
  moteG.setAttribute('position', new THREE.BufferAttribute(moteP, 3));
  const motes = new THREE.Points(moteG, new THREE.PointsMaterial({ color: '#ffd7a6', map: shDotTex(0.3), transparent: true, depthWrite: false, size: 0.004, opacity: 0.55, blending: THREE.AdditiveBlending }));
  motes.frustumCulled = false; R.add(motes);
  // ---- your hands (the world is scaled so you are one unit tall; the hands are modelled for 1.75 m)
  const hands = new ViewerHands(W.camera, {
    skin: '#c08f74', sleeve: '#3b4a5c', cuff: '#2c3846', watch: true,
    poses: {
      grab: { p: [0.1, -0.36, -0.36], F: [-0.05, -0.15, -1], N: [0, 1, 0.1], curl: [0.55, 0.6, 0.62, 0.66], thumb: [0.3, 0.5] },
      palms: { p: [0.05, -0.21, -0.36], F: [-0.08, 1, -0.45], N: [0, 0.4, 1], curl: [0.18, 0.16, 0.24, 0.3], thumb: [0.7, 0.1] },
      lift: { p: [0.12, -0.2, -0.4], F: [-0.15, 0.25, -1], N: [0.05, 1, 0.3], curl: [0.45, 0.5, 0.55, 0.6], thumb: [0.35, 0.4], trem: 0.006 },
    },
    blends: { grab: 0.5, lift: 0.6, palms: 0.55 },
    script: { right: [[0, 'hidden'], [9.1, 'palms'], [12.6, 'hidden'], [65.3, 'grab'], [67.6, 'lift'], [72.5, 'hidden']], left: [[0, 'hidden'], [9.25, 'palms'], [12.5, 'hidden'], [65.4, 'grab'], [67.7, 'lift'], [72.55, 'hidden']] },
  });
  hands.root.scale.setScalar(1 / 1.75);

  const _cp = new THREE.Vector3();
  const api = {
    scene: W.scene, camera: W.camera, W, set, phone, cat, brick, hands,
    frame(t, h, app) {
      const s = W.setH(h);
      const cam = shRoomCam(t, h);
      api._camNat = cam.p;
      // ---- the cat (posed before the camera turns: you look at its face when it comes to you)
      this._cat(t);
      let dir = cam.dir;
      const kc = 0.75 * shWin(t, 33.4, 43.3, 1.2, 0.5);
      if (kc > 0 && cat.g.visible) {
        R.updateMatrixWorld(true);
        const hp = cat.head.getWorldPosition(_cp).divideScalar(s);
        dir = shN3(shMix3(dir, shN3([hp.x - cam.p[0], hp.y - 0.012 - cam.p[1], hp.z - cam.p[2]]), kc));
      }
      W.lookDir(cam.p, dir, cam.roll);
      W.camera.fov = 60; shClip(W.camera, 0.04, Math.min(60000, 9 * s));
      // ---- lights follow the scale (point/spot falloff is in world units)
      set.spot.intensity = 9 * s * s; set.glow.intensity = 2.2 * s * s;
      set.spot.shadow.focus = MathX.clamp(Math.pow(h / 1.75, 0.25), 0.12, 1);
      set.spot.shadow.normalBias = 0.0006 * s * Math.max(0.15, Math.pow(h / 1.75, 0.3));
      shShadowCone(set.spot, 0.05, 6, s);
      // the shadow aims at where you are looking once you are small (the spot itself stays wide)
      const aim = t < 47 ? [-0.2, 0, -1.3] : t < 74 ? [-0.25, 0, -1.0] : [SH_PH.x + 0.02, 0, SH_PH.z + 0.02];
      set.spot.target.position.set(...aim);
      // ---- the phone: on the table, knocked off, on the floor; its screen; vibrating
      this._phone(t, h, s);
      this._glass(t);
      this._brick(t);
      // dust motes drifting in the lamp's cone
      for (let i = 0; i < moteN; i++) {
        const a = hash1(i * 3 + 1), b = hash1(i * 3 + 2), c = hash1(i * 3 + 3);
        moteP[i * 3] = -0.5 + a * 0.75 + Math.sin(t * 0.07 + i) * 0.04;
        moteP[i * 3 + 1] = 0.05 + ((b + t * 0.004 * (0.5 + c)) % 1) * 1.1;
        moteP[i * 3 + 2] = -2.1 + c * 1.3 + Math.cos(t * 0.05 + i * 1.7) * 0.04;
      }
      moteG.attributes.position.needsUpdate = true;
      motes.material.size = 0.0035 * s; motes.material.opacity = 0.5 * (1 - MathX.smooth(h, 0.05, 0.01) * 0.85);
      hands.update(t);
      if (window.SH_DBG && SH_DBG.room) SH_DBG.room(api, t, h);   // (look-dev hook for the stills tool's --eval)
    },

    _cat(t) {
      if (t > SH.catGone + 0.5) { cat.g.visible = false; return; }
      cat.g.visible = true;
      const seat = SH_CAT_SEAT, land = [-0.17, 0, -1.55], near = [-0.125, 0, -1.2];
      let pos, yaw, P;
      // pose keys
      const K = [[0, 'sit'], [31.0, 'crouch', 0.6], [SH.catJump, 'leap', 0.12], [SH.catLand, 'crouch', 0.12], [33.9, 'stand', 0.4],
        [36.5, 'sniff', 0.9], [SH.buzz1, 'startle', 0.12], [43.7, 'crouch', 0.25]];
      P = shCatPoseAt(K, t);
      const toYou = Math.atan2(-0.12 - seat[0], -0.78 - seat[2]);
      if (t < SH.catJump) {
        pos = seat; yaw = toYou + 0.05;
        // a little butt wiggle before the jump
        if (t > 31.6) { P.pz += Math.sin((t - 31.6) * 26) * 0.006 * shWin(t, 31.6, SH.catJump, 0.2, 0.1); }
      } else if (t < SH.catLand) {
        const u = (t - SH.catJump) / (SH.catLand - SH.catJump);
        pos = [seat[0] + (land[0] - seat[0]) * u, seat[1] * (1 - u) + 0.13 * Math.sin(u * Math.PI) - 0.02 * u, seat[2] + (land[2] - seat[2]) * u];
        yaw = toYou; P.pp += (u - 0.4) * 0.5;
      } else if (t < 36.6) {
        const u = shE(t, 34.0, 36.6, Ease.inOutSine);
        pos = [land[0] + (near[0] - land[0]) * u, 0, land[2] + (near[2] - land[2]) * u];
        yaw = Math.atan2(-0.12 - pos[0], -0.78 - pos[2]);
        // a walk: lateral sequence gait while moving
        const wk = shWin(t, 34.0, 36.6, 0.4, 0.5), ph = (t - 34.0) * 2.2 * Math.PI * 2;
        const step = (o) => [0.011 + Math.max(0, Math.sin(ph + o)) * 0.03 * wk, Math.cos(ph + o) * 0.05 * wk];
        const a = step(0), b = step(Math.PI * 0.5), c = step(Math.PI), d = step(Math.PI * 1.5);
        P.bl = [a[0], P.bl[1] + a[1]]; P.fl = [b[0], P.fl[1] + b[1]]; P.br = [c[0], P.br[1] + c[1]]; P.fr = [d[0], P.fr[1] + d[1]];
        P.py += Math.sin(ph * 2) * 0.004 * wk;
      } else if (t < 43.7) {
        pos = near; yaw = Math.atan2(-0.12 - near[0], -0.78 - near[2]);
        // sniffing: little bobs of the head
        P.hp += Math.sin(t * 19) * 0.03 * shWin(t, 37.2, 42.8, 0.3, 0.3); P.np += Math.sin(t * 9.5) * 0.02;
      } else {
        // the bolt: spin to the right and run for the door
        const u = shE(t, 43.7, SH.catGone, Ease.inQuad);
        const turn = shE(t, 43.55, 44.1);
        yaw = Math.atan2(-0.12 - near[0], -0.78 - near[2]) * (1 - turn) + (-1.9) * turn;
        pos = [near[0] + u * 2.3, 0, near[2] + u * 0.9];
        const ph = (t - 43.7) * 3.6 * Math.PI * 2, rk = shWin(t, 43.9, SH.catGone + 1, 0.3, 0.1);
        const fr = [0.011 + Math.max(0, Math.sin(ph)) * 0.06 * rk, Math.cos(ph) * 0.11 * rk], bk = [0.011 + Math.max(0, Math.sin(ph + Math.PI)) * 0.06 * rk, Math.cos(ph + Math.PI) * 0.12 * rk];
        P.fl = [fr[0], P.fl[1] + fr[1]]; P.fr = [fr[0], P.fr[1] + fr[1] * 0.85]; P.bl = [bk[0], P.bl[1] + bk[1]]; P.br = [bk[0], P.br[1] + bk[1] * 0.9];
        P.pp += Math.sin(ph) * 0.12 * rk; P.cp += Math.sin(ph + 0.6) * 0.15 * rk; P.py += Math.sin(ph * 2) * 0.01 * rk;
      }
      // slow blinks; ear twitches
      P.blink = Math.max(P.blink, shWin(t, 14.0, 14.35, 0.1, 0.15), shWin(t, 26.5, 26.95, 0.12, 0.2), shWin(t, 40.4, 41.1, 0.25, 0.3));
      P.ear = Math.max(P.ear, 0.25 * shWin(t, 18.2, 18.5, 0.08, 0.15), 0.2 * shWin(t, 38.5, 38.8, 0.08, 0.15));
      cat.g.position.set(pos[0], pos[1], pos[2]); cat.g.rotation.y = yaw;
      cat.pose(P, t);
      // the head looks at the window, then at you, then at the phone
      const camP = this._camNat || [-0.12, 0.3, -0.78];
      const win = [-1.3, 1.4, -2.6];
      let tgt = win, k = 0.85;
      if (t >= SH.catLook - 0.3) { const u = shE(t, SH.catLook - 0.3, SH.catLook + 0.45); tgt = shMix3(win, camP, u); }
      if (t >= SH.catJump - 0.6 && t < 33.8) k = 0.4;
      if (t >= SH.buzz1) { const u = shE(t, SH.buzz1, SH.buzz1 + 0.2); tgt = shMix3(camP, [SH_PH.x, 0.02, SH_PH.z], u); k = 0.9 * (1 - shE(t, 43.6, 44.0)); }
      cat.lookAt(tgt, k);
    },

    _phone(t, h, s) {
      const g = phone.g;
      const onTable = [-0.39, SH_TABLE.top, -2.025], yawT = Math.PI / 2 + 0.45;
      const hit = SH.phoneHit, push = 32.62;
      let pos, rx = 0, rz = 0, ry;
      if (t < push) { pos = onTable; ry = yawT; }
      else if (t < hit) {
        // pushed over the edge, tipping and falling
        const u = (t - push) / (hit - push), edge = SH_TABLE.z1 + 0.02;
        pos = [onTable[0] + 0.02 * u, onTable[1] * (1 - u * u), onTable[2] + (edge - onTable[2]) * Math.min(1, u * 2.2) + (-1.32 - edge) * Math.max(0, u - 0.45) / 0.55];
        rx = Math.min(1, u * 1.8) * 1.05 - Math.max(0, u - 0.55) * 2.33; ry = yawT - u * 0.18; rz = Math.sin(u * Math.PI) * 0.25;
      } else {
        // a small bounce, then it slides to rest face-up
        const u = MathX.clamp((t - hit) / 0.7, 0, 1), e = Ease.outCubic(u);
        pos = [(onTable[0] + 0.02) * (1 - e) + SH_PH.x * e, Math.abs(Math.sin(u * Math.PI)) * 0.012 * (1 - u), -1.32 + (SH_PH.z + 1.32) * e];
        ry = (yawT - 0.18) + (SH_PH.yaw - yawT + 0.18) * e; rx = Math.sin(u * Math.PI) * 0.05 * (1 - u);
      }
      // vibrating: two short buzzes with the message; the call's ring (on 1.2 s, off 0.8 s) from the quake
      let vib = 0;
      vib = Math.max(shWin(t, SH.buzz1, SH.buzz1 + 0.35, 0.02, 0.05), shWin(t, SH.buzz1 + 0.55, SH.buzz1 + 0.9, 0.02, 0.05));
      if (t >= SH.quake && t < SH.floor + 2) { const c = (t - SH.quake) % 2.0; vib = Math.max(vib, c < 1.2 ? shWin(c, 0, 1.2, 0.03, 0.06) : 0); }
      api._vib = vib;
      const jit = 0.00003 * vib;
      g.position.set(pos[0] + noise1(t * 60, 1) * jit, pos[1] + Math.abs(noise1(t * 71, 2)) * jit * 0.6, pos[2] + noise1(t * 57, 3) * jit);
      g.rotation.set(rx, ry, rz, 'YXZ');
      // the screen: dark until the message; the lock screen; the call
      let bright = 0, scr = 'lock';
      if (t >= SH.buzz1) bright = MathX.smooth(t, SH.buzz1, SH.buzz1 + 0.15);
      if (t >= SH.call) scr = 'call';
      const flick = t >= SH.call && t < SH.call + 0.12 ? 0.4 : 1;
      phone.setScreen(scr, bright * flick);
      phone.light.intensity = 0.05 * bright * s * s;
      const gu = phone.glass.material.uniforms, pp = g.position;
      gu.lampDir.value.set(SH_LAMP[0] - pp.x, SH_LAMP[1] + 0.29 - pp.y, SH_LAMP[2] - pp.z).normalize();
      gu.winDir.value.set(-1.3 - pp.x, 1.55 - pp.y, -2.4 - pp.z).normalize();
    },

    _glass(t) {
      const seat = [-0.02, SH_TABLE.top, -2.0], hitT = SH.glassHit, push = 32.58, floorAt = [0.035, 0, -1.74];
      const broken = t >= hitT;
      glass.visible = !broken;
      if (!broken) {
        if (t < push) { glass.position.set(...seat); glass.rotation.set(0, 0, 0); }
        else {
          const u = (t - push) / (hitT - push);
          glass.position.set(seat[0] + (floorAt[0] - seat[0]) * u, seat[1] * (1 - u * u) + 0.02 * Math.sin(u * Math.PI), seat[2] + (floorAt[2] - seat[2]) * u);
          glass.rotation.set(u * 1.6, 0, -u * 0.5);
        }
      }
      // shards and the splash
      const dt = t - hitT;
      for (const sh of shards) {
        sh.m.visible = broken;
        if (!broken) continue;
        const k = (1 - Math.exp(-dt * sh.drag)) / sh.drag;
        const fly = Math.min(dt, 0.6);
        const y = Math.max(0.0008, sh.vy * fly - 4.9 * fly * fly * 1.2);
        sh.m.position.set(floorAt[0] + sh.vx * k * 0.35, dt < 0.6 ? y * 0.25 + 0.0008 : 0.0008, floorAt[2] + sh.vz * k * 0.35);
        const sp = Math.min(dt, 0.45);
        sh.m.rotation.set(sh.spin[0] * sp, sh.spin[1] * sp, sh.spin[2] * sp);
        if (dt > 0.45) sh.m.rotation.x = Math.round(sh.m.rotation.x / Math.PI) * Math.PI;
      }
      for (let i = 0; i < dropN; i++) {
        const a = hash1(i + 400) * 6.283, sp = 0.3 + hash1(i + 500) * 1.2, vy = 0.6 + hash1(i + 600) * 1.6;
        const tt = MathX.clamp(dt, 0, 0.7);
        const y = vy * tt - 4.9 * tt * tt;
        dropP[i * 3] = floorAt[0] + Math.cos(a) * sp * tt * 0.45; dropP[i * 3 + 1] = broken ? Math.max(0.0005, y * 0.5) : -1;
        dropP[i * 3 + 2] = floorAt[2] + Math.sin(a) * sp * tt * 0.45;
      }
      dropG.attributes.position.needsUpdate = true;
      drops.visible = broken && dt < 0.8;
      // the puddle spreads (towards the phone, slowly, all evening)
      puddle.visible = broken;
      if (broken) {
        const r = 0.11 * Ease.outCubic(MathX.clamp(dt / 2.5, 0, 1)) + 0.0009 * Math.max(0, dt - 2.5);
        puddle.scale.set(r * 1.25, r, 1); puddle.position.set(floorAt[0] - r * 0.25, 0.0004, floorAt[2] + r * 0.2);
        puddle.rotation.z = 0.5;
      }
    },

    _brick(t) {
      const B = SH_BRICK;
      brick.position.set(B.x, 0, B.z); brick.rotation.y = B.yaw - Math.PI / 2;   // local +x (the end you lift) points back at you
      // lifting your end (the near end, local +x) over your head: the brick pivots on its far edge
      let ang = 0;
      const liftA = Math.asin(Math.min(0.95, 0.0135 / B.L));
      if (t >= SH.grab) {
        ang = liftA * shE(t, 67.0, 68.9, Ease.inOutCubic) + Math.sin(t * 13) * 0.004 * shWin(t, 68.9, SH.drop, 0.4, 0.1);
        if (t >= SH.drop) {
          const u = (t - SH.drop) / 0.32;
          ang = u < 1 ? liftA * (1 - u * u) : Math.abs(Math.sin((u - 1) * 6)) * 0.03 * Math.exp(-(u - 1) * 3);
        }
      }
      // pivot at the far bottom edge (local −x end)
      brickBody.position.set(-B.L / 2, 0, 0);
      brickBody.rotation.z = ang;
      brickIn.position.set(B.L / 2, 0, 0);
    },
  };
  return api;
};
