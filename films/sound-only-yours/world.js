/* =====================================================================
   WORLD — the film's main set at night, in the rain: your kitchen on the fifth floor (room.js; its window looks south
   over the park), the street and the park (street.js), the flats across the park, the tower block, the lamps, the rain,
   the lightning, the moving cars (night.js), the people and the dogs (cast.js), your cat (animals.js), your
   own hands and phone, the city's lights round it all, and the echo pictures in the dark (echo.js).
   Every shot (shots.js) is a mode: story time s comes from the one clock (script.js: soStoryAt), the world is posed
   with it (pure), and the mode places the camera (soShotCam).
   ===================================================================== */

const soAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const SO_CEIL = SO_ROOM.H;

// ---------------------------------------------------------------------------------------------------------------------
// YOUR HANDS (camera space poses: wrist p, fingers F, palm N; mirrored for the left) and the hand script (film time)
// ---------------------------------------------------------------------------------------------------------------------
const SO_HAND_POSES = {
  clapOpen: { p: [0.13, -0.15, -0.4], F: [-0.25, 0.82, -0.5], N: [-1, 0, -0.15], curl: [0.12, 0.14, 0.18, 0.22], thumb: [0.35, 0.1] },
  clapShut: { p: [0.028, -0.14, -0.39], F: [-0.08, 0.86, -0.5], N: [-1, 0, 0], curl: [0.06, 0.08, 0.1, 0.12], thumb: [0.2, 0.05], trem: 0.0004 },
  table: { p: [0.2, -0.36, -0.42], F: [-0.12, 0.25, -1], N: [0, -1, 0.2], curl: [0.3, 0.32, 0.36, 0.42], thumb: [0.4, 0.2], trem: 0.0008 },
  phone: { p: [0.085, -0.155, -0.3], F: [-0.95, 0.3, 0.06], N: [0.04, 0.1, 1], curl: [0.42, 0.46, 0.5, 0.55], thumb: [0.2, 0.25], trem: 0.0009 },
  phoneUp: { p: [0.07, -0.118, -0.235], F: [-0.95, 0.28, 0.05], N: [0.03, 0.08, 1], curl: [0.42, 0.46, 0.5, 0.55], thumb: [0.2, 0.25], trem: 0.0011 },
  sill: { p: [0.26, -0.3, -0.5], F: [0.0, 0.2, -1], N: [0, -1, 0.1], curl: [0.25, 0.28, 0.3, 0.36], thumb: [0.45, 0.2] },
};
const SO_HAND_BLENDS = { clapOpen: 0.22, clapShut: 0.075, table: 0.5, phone: 0.5, phoneUp: 0.45, sill: 0.45, hidden: 0.4 };
function soHandScript() {
  const tc = SO.tClap, t2 = SO.tClap2, b = soB, c = soC;
  const clap = (L) => { L.push([b('clap') - 0.1, 'clapOpen'], [tc - 0.075, 'clapShut'], [tc + 0.04, 'clapOpen'], [t2 - 0.075, 'clapShut'], [t2 + 0.05, 'clapOpen'], [b('body') - 0.3, 'table']); return L; };
  const R = clap([[-9, 'hidden'], [b('text') - 0.3, 'phoneUp'], [b('room') + 0.05, 'hidden']]); R.push([b('mum') - 0.2, 'phone'], [c('mum', 2) - 0.3, 'phoneUp'], [b('window') - 0.1, 'hidden'], [SO.tWin - 0.6, 'sill'], [SO.tWin + 1.2, 'hidden']);
  const L = clap([[-9, 'hidden']]); L.push([b('mum') - 0.2, 'hidden'], [SO.tWin - 0.6, 'sill'], [SO.tWin + 1.2, 'hidden']);
  return { right: R, left: L };
}
const SO_HAND_MODES = new Set(['clap', 'rule', 'body', 'mum', 'text', 'window']);

// ---------------------------------------------------------------------------------------------------------------------
// THE CAT on the counter (room-local), facing the glass: it pats it twice and sends it over the edge (SO.sKnock); it
// startles at the smash it can't hear, stares at it, looks at you, and later miaows at you: nothing comes out
// ---------------------------------------------------------------------------------------------------------------------
const SO_CATP = { p: [-2.2, SO_ROOM.counter.top, -0.38], yaw: 2.3 };
function soCatState(t, s) {
  const P = SO_CATP, k = SO.sKnock, pat = (a, b) => Math.sin(Math.PI * MathX.clamp((s - a) / (b - a), 0, 1));
  const paw = s < k + 0.3 ? Math.max(pat(-0.6, -0.15), pat(0.05, 0.38), pat(k - 0.12, k + 0.18)) : 0;
  const jump = soSm(s, k + 0.5, k + 0.62) * (1 - soSm(s, k + 1.6, k + 2.6));                // startled (it never heard it)
  const look = soSm(s, k + 2.2, k + 3.2);                                                   // ...down at the floor, then at you
  const tm = soW('room', 0, 'cat'), mi = MathX.clamp((t - tm - 0.25) / 1.2, 0, 1), meow = Math.sin(Math.PI * mi) * (t > tm ? 1 : 0);
  const yaw = P.yaw + 0.6 * look + 0.3 * soSm(t, tm - 0.4, tm + 0.1);
  return { p: P.p, yaw, paw, jump, meow, pose: soQuadPose({ crouch: 0.85 - 0.5 * jump - 0.25 * paw, stretch: 0.25 * jump, head: [0.35 - 0.6 * look + 0.25 * meow - 0.15 * paw, 0.15 * noise1(s * 0.3, 5)], tail: [0.4 + 0.8 * jump, 0.5 * Math.sin(s * 1.6)],
    legs: [[0, 0], [-1.25 * paw, 0.45 * paw], [0, 0], [0, 0]] }) };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CITY'S LIGHTS round the park (points: windows, street lamps along a grid), out to 6.5 km: you see them from the
// window and from the air, under the 500 m and 5 km rings
// ---------------------------------------------------------------------------------------------------------------------
function soBuildCity(scene) {
  const r = new RNG(6611), P = [], C = [], c = new THREE.Color();
  const near = (x, z) => x > -95 && x < 140 && z > -260 && z < 30;
  for (let i = 0; i < 26000; i++) {
    const a = r.next() * Math.PI * 2, d = 120 + Math.pow(r.next(), 0.75) * 6400, x = 28 + Math.cos(a) * d, z = -50 + Math.sin(a) * d;
    if (near(x, z)) continue;
    const lamp = r.next() < 0.45;
    let px = x, pz = z;
    if (lamp) { if (r.next() < 0.5) px = Math.round(x / 90) * 90; else pz = Math.round(z / 90) * 90; }
    P.push(px, lamp ? 6 : 3 + r.next() * 30, pz);
    if (lamp) c.set('#ffae5c').multiplyScalar(0.85 + 0.3 * r.next()); else c.set(r.next() < 0.7 ? '#ffd9a0' : '#cfe0ff').multiplyScalar(0.5 + 0.6 * r.next());
    C.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  const m = new THREE.PointsMaterial({ size: 11, sizeAttenuation: true, map: soDotTex(0.3), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 1; scene.add(pts);
  return { pts, m };
}

// the people coming to your shout, seen by their phone torches: hundreds of lights walking in from every street round
// the park, stopping in a loose ring round you (the 46 drawn people walk among them)
const SO_GATES = [[0, -12.4], [-60, -40], [60, -60], [-30, -95], [70, -20]];
function soBuildProcession(scene) {
  const r = new RNG(515), N = 420, Y = SO_ST.you.park, L = [];
  for (let i = 0; i < N; i++) {
    let x0, z0;
    if (i % 10 < 3) { let a = r.range(0, 6.283); if (Math.sin(a) < -0.55) a += Math.PI; const rr = r.range(35, 110);   // (not across the pond, west of you)
      x0 = Y[0] + Math.sin(a) * rr; z0 = Y[2] + Math.cos(a) * rr; }   // already in the park
    else { const g = SO_GATES[i % SO_GATES.length], dx = g[0] - Y[0], dz = g[1] - Y[2], d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, back = Math.pow(r.next(), 0.8) * 90, lat = r.range(-6, 6);
      x0 = g[0] + ux * back - uz * lat; z0 = g[1] + uz * back + ux * lat; }   // coming in through the gates, up the streets behind them
    L.push({ x0, z0, d0: Math.hypot(x0 - Y[0], z0 - Y[2]), v: r.range(1.0, 1.5), ds: r.range(0, 5), stop: r.range(8, 24), h: r.range(1.2, 1.45), ph: r.range(0, 6.28), b: r.range(0.6, 1.0) });
  }
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 2.0, sizeAttenuation: true, map: soDotTex(0.3), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 2; pts.visible = false; scene.add(pts);
  return { pts, update(s, on) {
    pts.visible = on; if (!on) return;
    const s0 = soStoryAt(soS('coming')) + 0.5;
    L.forEach((e, i) => {
      const walked = Math.max(0, s - s0 - e.ds) * e.v, d = Math.max(e.stop, e.d0 - walked), go = Math.min(1, Math.max(0, (s - s0 - e.ds) / 1.5));
      const ax = Y[0] + (e.x0 - Y[0]) * d / e.d0, az = Y[2] + (e.z0 - Y[2]) * d / e.d0, moving = d > e.stop + 0.01 ? 1 : 0;
      pos[3 * i] = ax; pos[3 * i + 1] = e.h + 0.03 * moving * Math.sin(e.ph + walked * 4.4); pos[3 * i + 2] = az;
      const b = e.b * go * (0.85 + 0.15 * Math.sin(e.ph + s * 1.7));
      col[3 * i] = 1.35 * b; col[3 * i + 1] = 1.42 * b; col[3 * i + 2] = 1.55 * b;
    });
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
  } };
}

// a flat glowing ring on the ground (the reach of a sound): radius set per frame
function soBuildRing(scene, col) {
  const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide });
  const g = new THREE.RingGeometry(0.985, 1.0, 256); g.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(g, m); ring.visible = false; ring.renderOrder = 8; scene.add(ring);
  const fm = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.03, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide });
  const fg = new THREE.CircleGeometry(1, 128); fg.rotateX(-Math.PI / 2);
  const fill = new THREE.Mesh(fg, fm); fill.visible = false; fill.renderOrder = 7; scene.add(fill);
  return { ring, fill, set(c, r, a = 1, w = 0.015, y = 0.3) { const on = r > 0.01 && a > 0.002; ring.visible = fill.visible = on; if (!on) return;
    ring.position.set(c[0], y, c[2]); ring.scale.set(r, 1, r); m.opacity = 0.9 * a; fill.position.set(c[0], y - 0.05, c[2]); fill.scale.set(r, 1, r); fm.opacity = 0.0;
    if (Math.abs(ring.geometry.parameters.innerRadius - (1 - w)) > 1e-4) { ring.geometry.dispose(); const gg = new THREE.RingGeometry(1 - w, 1.0, 256); gg.rotateX(-Math.PI / 2); ring.geometry = gg; } } };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------------------------------------------------
SO_SETS.world = (app) => {
  const S = soSet(app, { sky: '#06080d', fov: 50, near: 0.02, far: 14000, hemi: ['#4a5a78', '#14110e', 0.22], sun: [-30, 80, 40], sunI: 0.35, sunColor: '#9fb4dc',
    shadow: 2048, shadowR: 14, shadowFar: 300, env: ['#1a2234', '#3a3428', '#0e0d0c'] });
  const scene = S.scene, cam = S.camera, moon = S.sun;
  scene.fog = new THREE.FogExp2('#0d1219', 0.004);
  const sky = soGradSky(scene, '#04060b', '#1d2129', '#0c0d10', { sunDir: [-0.2, 0.08, -1], sunGlow: '#2a2018', hw: 0.25 });
  sky.material.uniforms.k.value = 1;
  const R = soBuildRoom(S), T = soBuildStreet(S), C = soBuildCast(S);
  // night: the flats across the park, the tower, lamplight, the rain, the lightning, the cars that move, the city
  soFlatsSchedule();
  const F = soBuildFlats(T.root), TW = soBuildTower(T.root), LP = soBuildLampPools(scene, soLampSpots(T));
  const rain = soBuildRain(scene, 4200), bolt = soBuildBolt(scene), MV = soBuildMovers(T.root, T), city = soBuildCity(scene), proc = soBuildProcession(scene);
  const lamps = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight('#ffc98a', 0, 26, 1.7); scene.add(l); return l; });
  for (const m of SO_LIT) if (!m.userData.keep) m.emissiveIntensity = 0.12;                        // (your block: most of your neighbours' windows dark)
  T.M.lampGlass.emissiveIntensity = 2.2;
  // your kitchen at night: the lamp over the table on, the laptop with the news, your cat
  R.M.shadeIn.emissiveIntensity = 1.2;
  const lampP = R.toWorld(SO_ROOM.lamp.x, SO_CEIL - SO_ROOM.lamp.cord - 0.12, SO_ROOM.lamp.z);
  const bulb = new THREE.PointLight('#ffd6a0', 0, 9, 1.5); bulb.position.copy(lampP); scene.add(bulb);
  const fill = new THREE.PointLight('#ffe2c0', 0, 6, 1.6); R.room.add(fill); fill.position.set(-1.4, 1.5, 0.6);
  const LT = soBuildLaptop(R);
  const cat = soBuildQuad(SO_CAT); R.room.add(cat.root);
  { const jaw = new THREE.Group(); jaw.position.set(0, -SO_CAT.head * 0.42, SO_CAT.head * 0.55); cat.head.add(jaw); soMesh(new THREE.BoxGeometry(SO_CAT.snout * 1.5, SO_CAT.snout * 0.4, SO_CAT.head * 0.7).translate(0, 0, SO_CAT.head * 0.3), soStd('#2b2724', 0.8), 0, 0, 0, jaw);
    soMesh(new THREE.BoxGeometry(SO_CAT.snout * 1.2, SO_CAT.snout * 0.3, SO_CAT.head * 0.5).translate(0, SO_CAT.snout * 0.3, SO_CAT.head * 0.35), soStd('#7a2a2a', 0.6), 0, 0, 0, jaw); cat.jaw = jaw; }
  // you, at your window (seen from across the park): a silhouette against the kitchen light
  const you = new Person({ id: 'soYou', look: 'soHood' }, null); R.room.add(you.root); you.root.visible = false;
  // your hands and your phone (in your right hand)
  const hands = new ViewerHands(cam, { script: soHandScript(), poses: SO_HAND_POSES, blends: SO_HAND_BLENDS, skin: '#c9967a', nail: '#e2bba8', sleeve: '#2b2f36', cuff: '#23272e', watch: true, sleeveLen: 0.36 });
  // (the phone lies on your palm, its long side along your thumb: hand +X; its screen faces out of the palm, +Z)
  const PH = soBuildPhone(hands.right.g); PH.g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0))); PH.g.position.set(0.018, 0.088, 0.016); PH.g.visible = false;
  const phLight = new THREE.PointLight('#bcd2ff', 0, 0.8, 2); hands.right.g.add(phLight); phLight.position.set(0.02, 0.09, 0.2);
  // the rings: your voice from the window (500 m); your shout (5 km); the shout's wave in the park, and its echoes
  const ringV = soBuildRing(scene, '#ffcf8a'), ringS = soBuildRing(scene, '#ffcf8a'), wave = soBuildRing(scene, '#bfe6ff'), echoes = SO_ECHO.map(() => soBuildRing(scene, '#ffcf8a'));
  // the pulse of air from your clap (slowed right down): a thin shell
  const shellM = new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, wireframe: true });
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), shellM); shell.visible = false; shell.renderOrder = 9; scene.add(shell);
  const EV = soBuildEcho(scene);
  // a cold light that catches the big dog as it comes at you (as if from the lamp behind you)
  const dogL = new THREE.PointLight('#b8c8e0', 0, 5, 1.6); scene.add(dogL);
  const hideL = new THREE.PointLight('#93a6c8', 0, 7, 1.5); hideL.position.set(SO_ST.you.hide[0] + 0.6, 0.5, SO_ST.you.hide[2] + 1.4); scene.add(hideL);
  // the plane tree's low bough hanging into your hiding place (leaves over you, black against the lamps)
  const bough = (() => { const Hh = SO_ST.you.hide, mL = soStd('#3e3a1c', 0.9, 0, { flatShading: true }), out = [];
    for (const [dx, y, dz, r, sd] of [[0.9, 1.75, 1.6, 0.55, 3], [1.5, 2.05, 2.4, 0.7, 5], [-0.4, 2.1, 2.1, 0.5, 7], [2.2, 1.65, 1.2, 0.45, 9], [0.2, 2.4, 3.2, 0.8, 11]])
      out.push(soMesh(soBlobGeo(r, 120 + sd), mL, Hh[0] + dx, y, Hh[2] + dz, scene));
    return out; })();
  const RL = (x, y, z) => R.toWorld(x, y, z).toArray();
  const hideInEcho = [sky, LP.pools, LP.glow, rain.ls, bolt.g, city.pts, shell, F.who, ...(T.planeLeaves || []), ...bough];   // (the crown's blobs read as flat cards in echo light)
  const set = {
    scene, camera: cam, R, T, C, hands, cat, F, MV, EV,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = soStoryAt(t), k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._s = s; this._shot = shot; this._t = t;
      // ------------------------------------------------------------------ pose the world
      T.update(s, { t, mode: m });
      R.update(s, {});
      F.update(t);
      const youAt = soYouAt(m, t, RL);
      C.update(s, { mode: m, t, you: youAt });
      soMoversUpdate(MV, t, m);
      proc.update(s, m === 'coming');
      // (from behind it as you see it: a cold rim round its back and head, so the shape reads in the dark)
      if (m === 'dog') { const d = C.dog2.root.position, Hh = SO_ST.you.hide, dx = d.x - Hh[0], dz = d.z - Hh[2], L = Math.max(0.5, Math.hypot(dx, dz)); dogL.position.set(d.x + dx / L * 1.1, 1.3, d.z + dz / L * 1.1); dogL.intensity = 9; } else dogL.intensity = 0;
      for (const b of bough) b.visible = m === 'hide' || m === 'dog';
      hideL.intensity = m === 'hide' ? 1.4 : 0;   // (a lamp's spill from across the path: the trunk and the bough over you, just)
      // the casement: shut until you open it
      R.casement.rotation.y = -1.25 * soSm(t, SO.tWin, SO.tWin + 1.1) * (t > soB('window') - 0.01 ? 1 : 0);
      // the cat
      { const cs = soCatState(t, s); cat.root.position.set(cs.p[0], cs.p[1], cs.p[2]); cat.root.rotation.set(0, cs.yaw, 0); soPoseQuad(cat, cs.pose); cat.jaw.rotation.x = 0.7 * cs.meow; cat.root.position.y += 0.05 * cs.jump * Math.sin(Math.PI * MathX.clamp((s - SO.sKnock - 0.5) / 0.35, 0, 1)); }
      // the laptop: the news (the presenter talking: you can't hear a word)
      LT.scr.update({ talk: Math.round(Math.max(0, Math.sin(t * 9) * Math.sin(t * 2.3 + 1)) * 6) / 6, late: s > 30, tick: 0 });
      // you at your window (only in the reverse shot from across the park)
      you.root.visible = m === 'faces' && shot.cam === 'reverse';
      if (you.root.visible) { const p = basePose(); p.lSh = [0.35, 0.12]; p.rSh = [0.3, 0.12]; p.neck = 0.05; p.headYaw = 0.1 * noise1(t * 0.2, 3); you.apply(p); you.root.position.set(0.25, 0, -1.55); you.root.rotation.y = Math.PI; }
      // ------------------------------------------------------------------ the camera
      const v = { p: [0, 2, -5], at: [0, 1, 0], fov: 50, drift: 0.004, sh: { f: null, R: 14 }, inside: false, far: 14000, near: 0.05, roll: 0, fogK: 1, expo: 1, rain: true };
      soShotCam(this, m, s, t, k, shot, v, RL, youAt);
      const dr = v.drift ? soDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 71) * Math.sin(t * 13.3); dr[1] += j * 0.6 * Math.sin(t * 57 + 1); dr[2] += j * Math.sin(t * 63 + 2) * Math.sin(t * 9.1); }
      if (cam.near !== v.near) cam.near = v.near;
      if (cam.far !== v.far) cam.far = v.far;
      soCam(cam, soAdd(v.p, dr), soAdd(v.at, dr), v.fov, v.roll || 0);
      this._inside = v.inside; this._expo = v.expo; this._v = v;
      // ------------------------------------------------------------------ your hands and phone
      const handsOn = SO_HAND_MODES.has(m);
      hands.root.visible = handsOn;
      if (handsOn) hands.update(t);
      const phoneOn = m === 'mum' || m === 'text';
      PH.g.visible = phoneOn; phLight.intensity = phoneOn ? 0.08 : 0;
      if (phoneOn) {
        const c0 = soC('mum', 0) + 0.8, cm = soC('mum', 2) - 0.3;
        if (m === 'mum' && t < cm) PH.scr.update({ mode: 'call', secs: Math.max(0, Math.floor(t - c0)), min: 2 });
        else if (m === 'mum') PH.scr.update({ mode: 'mum', k: Math.floor((t - cm - 0.4) * 5) / 5, min: 2 });
        else PH.scr.update({ mode: 'unknown', k: Math.floor((t - soC('text', 0) - 0.2) * 5) / 5, min: 1 });
      }
      // ------------------------------------------------------------------ the light
      const inside = v.inside, flash = soBoltAt(t);
      bulb.intensity = inside ? 3.2 : 1.6; fill.intensity = inside ? 0.7 : 0; LT.glow.intensity = inside ? 0.6 : 0;
      S.hemi.intensity = (inside ? 0.12 : 0.2) + 1.6 * flash; moon.intensity = 0.3 + 4 * flash;
      scene.environmentIntensity = inside ? 0.35 : 0.3;
      scene.fog.density = 0.004 * v.fogK;
      sky.material.uniforms.k.value = 1 + 5 * flash;
      bolt.g.visible = flash > 0.02; bolt.m.opacity = Math.min(1, flash * 1.4);
      const f = v.sh.f || v.at, D = 120;
      moon.position.set(f[0] - 30 / 98 * D, f[1] + 80 / 98 * D, f[2] + 40 / 98 * D); moon.target.position.set(f[0], f[1], f[2]); moon.target.updateMatrixWorld();
      { const c = moon.shadow.camera; if (c.right !== v.sh.R) { c.left = -v.sh.R; c.right = v.sh.R; c.top = v.sh.R; c.bottom = -v.sh.R; c.updateProjectionMatrix(); } }
      soLampsUpdate(LP, lamps, cam, 1);
      // the rain (none inside the dark under the trees: it stopped at 10:00)
      rain.update(t, cam, { on: v.rain && m !== 'echo' && m !== 'who' && m !== 'question', box: v.rainBox || 26, h: v.rainH || 18, len: v.rainLen || 0.32 });
      rain.mat.opacity = v.rainA ?? 0.32;
      // ------------------------------------------------------------------ the rings (what reaches how far)
      ringV.set(youAt, 0); ringS.set(youAt, 0); wave.set(youAt, 0); echoes.forEach((e) => e.set(youAt, 0));
      if (m === 'window' && shot.cam === 'map') { const tv = soC('window', 2); ringV.set(RL(0.2, -12, -2.4), SO_NUM.voiceR * Ease.outCubic(MathX.clamp((t - tv) / 2.2, 0, 1)), 1, 0.012, 1.0); }
      if (m === 'far') { const r = SO_NUM.shoutR * Ease.outCubic(MathX.clamp((t - soS('far') - 0.4) / 3.0, 0, 1)); ringS.set(SO_ST.you.park, r, 1, 0.006, 2); }
      if (m === 'shout' && shot.cam === 'map') soEchoMap(t, shot, wave, echoes);
      // the clap's pulse of air (slowed down 200×)
      shell.visible = false;
      if (m === 'rule') { const u = (t - SO.tClap2) / 2.6; if (u > 0 && u < 1) { const c = cam.localToWorld(new THREE.Vector3(0, -0.14, -0.39)); shell.visible = true; shell.position.copy(c); shell.scale.setScalar(0.05 + 2.2 * u); shellM.opacity = 0.45 * (1 - u); } }
      // ------------------------------------------------------------------ the echo pictures (in the dark)
      const echo = m === 'echo' || m === 'who' || m === 'question';
      EV.set(echo, t, youAt);
      for (const o of hideInEcho) o.visible = o.visible && !echo;
      if (echo) { LP.pools.visible = LP.glow.visible = false; }
      else { LP.pools.visible = LP.glow.visible = true; city.pts.visible = true; F.who.visible = true; sky.visible = true; }
      void TW;
    },
    labels(t) { return soLabels(this, t); },
    grade(t, p, shot) {
      const v = this._v || {};
      p.exposure = (this._inside ? 1.25 : 1.55) * (this._expo || 1);
      p.saturation = 0.9; p.warmth = -0.03; p.vignette = 0.62; p.bloom = 0.55; p.bloomThreshold = 0.75; p.grain = 0.04; p.contrast = 1.08; p.blackLift = 0.01;
      const fl = soBoltAt(t); if (fl > 0) p.exposure *= 1 + 0.6 * fl;
      if (shot && (shot.mode === 'echo' || shot.mode === 'who' || shot.mode === 'question')) { p.exposure = 1.0; p.saturation = 1.0; p.warmth = 0; p.bloom = 0.8; p.bloomThreshold = 0.35; p.vignette = 0.7; p.grain = 0.05; }
      // the ringing in your ears: the picture breathes (a slow chromatic shimmer)
      // your heartbeat (body): a soft pulse in the vignette
      if (shot && shot.mode === 'body') { const hb = (t * 1.25) % 1; p.vignette += 0.12 * (Math.exp(-hb / 0.06) + 0.6 * Math.exp(-Math.max(0, hb - 0.2) / 0.06) * (hb > 0.2 ? 1 : 0)); }
      void v;
    },
  };
  return set;
};

// where you are (world) in each mode: people turn to you; sound starts from you
function soYouAt(m, t, RL) {
  const Y = SO_ST.you;
  if (m === 'street') return [Y.door[0], 1.62, Y.door[2] - 0.4];
  if (m === 'car' || m === 'warn' || m === 'heads') return [Y.kerb[0], 1.62, Y.kerb[2] - (t > SO.tKerb ? 0.55 * soSm(t, SO.tKerb, SO.tKerb + 0.6) * (1 - soSm(t, SO.tCar - 0.5, SO.tCar + 0.1)) : 0)];
  if (m === 'storm') return [0, 1.62, -12.0];
  if (m === 'park' || m === 'shout' || m === 'far' || m === 'coming') return [Y.park[0], 1.62, Y.park[2]];
  if (m === 'hide' || m === 'dog' || m === 'echo' || m === 'who' || m === 'question') return [Y.hide[0], 0.95, Y.hide[2]];
  return RL(...SO_K.you);
}

// the shout from above, slowed down: the wave goes out; each building sends it back (a ring from where it bounced)
function soEchoMap(t, shot, wave, echoes) {
  const Y = SO_ST.you.park, slow = 6, t0 = shot.t0 + 0.6, u = Math.max(0, (t - t0) / slow);       // u: real seconds since the shout
  wave.set(Y, SOP.c * u, MathX.clamp(1.4 - u, 0, 1), 0.01, 0.5);
  SO_ECHO.forEach((e, i) => { const tb = e.d / SOP.c, back = SOP.c * (u - tb); echoes[i].set(soEchoPoint(i), back > 0 ? Math.min(back, e.d) : 0, back > 0 && back < e.d * 1.05 ? 1 : 0, 0.02, 0.6 + 0.1 * i); });
}
// where each echo bounces (world): your block, the flats, the church, the tower, the terraces (along each one's bearing)
const SO_ECHO_DIR = [[-0.45, 0.89], [0.12, -0.99], [0.85, 0.53], [0.0, -1], [-0.95, -0.3]];
function soEchoPoint(i) { const Y = SO_ST.you.park, d = SO_ECHO[i].d, b = SO_ECHO_DIR[i], L = Math.hypot(b[0], b[1]); return [Y[0] + b[0] / L * d, 0, Y[2] + b[1] / L * d]; }

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, drift, sh: { f, R }, inside, far, near, fogK, expo, shake, roll, rain }.
// RL(x, y, z): room → world. Your kitchen's window is in its south wall (z −2), the counter on the left, the table in the
// middle. Outdoors: your block's front is z = 0 (your door at x −4), the street z −9…−2, the park from z −12.35 (the
// gate at x 0), the plane tree at (−9, −19.2), the pond at (0, −52), the flats across the park z −106, the tower z −228.
// ---------------------------------------------------------------------------------------------------------------------
function soShotCam(set, m, s, t, k, shot, v, RL, you) {
  const into = (a, b, u) => soV(a, b, Ease.inOutSine(u));
  const room = (R = 5) => { v.inside = true; v.sh = { f: RL(0, 1.2, -0.6), R }; v.drift = 0.0018; v.near = 0.02; v.rainBox = 30; };
  const K = SO_K, G = SO_K.glass, cam = set.camera, c = soC, Y = SO_ST.you;
  switch (m) {
    // ---- 1: your kitchen, 9:41
    // the title: the cat on the counter pats the glass over the edge; it falls (slow motion) and smashes, silently
    case 'title': { room(); const fall = soSm(s, SO.sKnock + 0.05, SO.sKnock + 0.5);
      v.p = into(RL(-0.95, 1.42, 0.35), RL(-1.02, 1.36, 0.22), k); v.at = soV(RL(-2.02, 1.28, -0.52), RL(-1.72, 0.12, -0.6), Ease.inOutSine(fall)); v.fov = 44 - 4 * k; break; }
    // "What...?": the glass in pieces, the water spreading; up to the cat, who heard nothing either
    case 'what': { room(); const w = Ease.inOutSine(soSm(k, 0.45, 1)); v.p = into(RL(-0.85, 1.6, 0.4), RL(-0.9, 1.6, 0.32), k); v.at = soV(RL(-1.7, 0.05, -0.55), RL(-2.1, 1.0, -0.38), w); v.fov = 52; break; }
    // 9:41 PM: the clock; then the whole kitchen: the news on, the rain on the window
    case 'start': { room(); if (shot.cam === 'clock') { const ck = SO_ROOM.clock; v.p = into(RL(ck.x - 0.75, ck.y - 0.08, ck.z - 0.3), RL(ck.x - 0.62, ck.y - 0.05, ck.z - 0.22), k); v.at = RL(ck.x, ck.y, ck.z); v.fov = 34; break; }
      v.p = into(RL(1.6, 1.62, 1.55), RL(1.45, 1.6, 1.4), k); v.at = RL(-0.2, 1.05, -1.2); v.fov = 66; break; }
    // "Hello?": towards the door to the hall (nobody answers)
    case 'hello': { room(); v.p = into(RL(-0.2, 1.62, -0.45), RL(0.1, 1.62, 0.05), k); v.at = soV(RL(1.3, 1.3, 1.8), RL(1.55, 1.2, 3.0), Ease.inOutSine(k)); v.fov = 56 - 6 * k; break; }
    // the news, the rain, the cat (miaowing), nothing
    case 'room': { room();
      if (shot.cam === 'news') { const L = K.laptop; v.p = into(RL(L[0] - 0.18, 1.0, L[2] + 0.42), RL(L[0] - 0.14, 0.98, L[2] + 0.36), k); v.at = RL(L[0] + 0.03, 0.85, L[2] - 0.05); v.fov = 34; break; }
      if (shot.cam === 'rain') { v.p = into(RL(0.35, 1.55, -1.45), RL(0.37, 1.55, -1.62), k); v.at = [6, 4, -40]; v.fov = 40; v.rainBox = 18; v.rainA = 0.5; break; }
      if (shot.cam === 'cat') { const P = SO_CATP.p; v.p = into(RL(P[0] + 1.45, 1.42, P[2] - 0.55), RL(P[0] + 1.3, 1.38, P[2] - 0.5), k); v.at = RL(P[0] + 0.02, 1.08, P[2] + 0.02); v.fov = 34; v.near = 0.02; break; }
      v.p = into(RL(0.9, 1.62, 1.3), RL(0.85, 1.62, 1.25), k); v.at = RL(-0.4, 1.1, -1.0); v.fov = 62; v.drift = 0.0008; break; }
    // you clap (your hands, in front of you); and again, slowly: the pulse of air going out
    case 'clap': { room(); v.p = RL(...K.you); v.at = RL(K.you[0] + 0.05, 1.45, K.you[2] - 1.6); v.fov = 54; v.drift = 0.001; break; }
    case 'rule': { room(); v.p = into(RL(...K.you), RL(K.you[0], K.you[1], K.you[2] + 0.02), k); v.at = RL(K.you[0] + 0.05, 1.45, K.you[2] - 1.6); v.fov = 56; v.drift = 0.001; break; }
    // sitting at the table, hands flat, facing the black window: your breath, your heart
    case 'body': { room(); v.p = into(RL(...K.sit), RL(K.sit[0], K.sit[1] - 0.01, K.sit[2] - 0.04), k); v.at = RL(0.25, 0.95, -2.0); v.fov = 56 - 6 * k; v.drift = 0.0012; break; }
    // your phone: the call (connected, nothing comes through); Mum's texts; the stranger's texts
    case 'mum': case 'text': { room(); v.p = RL(...K.you); v.at = RL(K.you[0] - 0.05, 0.75, K.you[2] - 1.2); v.fov = 50 - (m === 'text' || t > soC('mum', 2) - 0.3 ? 8 : 0); v.drift = 0.0012; break; }
    // the window: open it, lean out into the rain over the street and the park (9:43)
    case 'window': { room();
      if (shot.cam === 'map') { const c0 = RL(0.2, -12, -2.4), w = Ease.inOutSine(k); v.inside = false; v.p = soAdd(c0, [180 + 60 * w, 900 + 260 * w, 520 + 140 * w]); v.at = soAdd(c0, [0, 0, -40]); v.fov = 50; v.far = 14000; v.fogK = 0.12; v.drift = 0; v.rain = false; v.sh = { f: c0, R: 60 }; break; }
      const lean = Ease.inOutSine(soSm(t, SO.tWin + 0.9, SO.tWin + 2.6));
      v.p = soV(into(RL(0.4, 1.62, -0.9), RL(0.6, 1.6, -1.45), soSm(t, shot.t0, SO.tWin)), RL(0.78, 1.52, -2.32), lean);
      v.at = soV(RL(0.6, 1.45, -3.0), [10, 2, -48], Ease.inOutSine(soSm(t, SO.tWin + 1.2, SO.tWin + 3.2))); v.fov = 56; v.rainBox = 20; break; }
    // the windows across the park light up, one by one (telephoto from yours); then from over there: your lit window
    case 'faces': { if (shot.cam === 'reverse') { const w = RL(0.25, 1.45, -2.2); v.p = into([w[0] + 6, 9.6, -105.0], [w[0] + 5.8, 9.7, -104.6], k); v.at = w; v.fov = 9; v.fogK = 0.4; v.sh = { f: w, R: 6 }; v.drift = 0.0035; v.near = 0.5; break; }
      room(); v.p = RL(0.78, 1.52, -2.32); const W = SO_ST.blockS; v.at = into([2, 9.5, W.z[1]], [-1, 9.0, W.z[1]], k); v.fov = 24 - 6 * Ease.inOutSine(k); v.fogK = 0.45; v.drift = 0.0014; v.near = 0.1; break; }
    // ---- 3: the street, 9:52
    // out of your door: the people under the rain, the car alarm flashing, the dog barking at you
    case 'street': { v.sh = { f: [2, 1, -4], R: 14 };
      if (shot.cam === 'alarm') { v.p = into([6.4, 1.25, -1.15], [6.8, 1.27, -1.2], k); v.at = [11, 0.8, -3.05]; v.fov = 40; v.sh = { f: [11, 1, -3], R: 6 }; break; }
      if (shot.cam === 'dog') { v.p = into([-1.7, 0.75, -6.2], [-1.65, 0.72, -6.5], k); v.at = [-1.1, 0.42, -9.9]; v.fov = 34; v.sh = { f: [-1.2, 0.5, -10], R: 5 }; break; }
      v.p = into([Y.door[0], 1.62, Y.door[2] - 0.2], [Y.door[0] + 0.5, 1.62, Y.door[2] - 0.9], k); v.at = [7, 1.35, -5]; v.fov = 58; break; }
    // the kerb: you step out; a car glides past, a metre in front of you (you never heard it)
    case 'car': { const step = soSm(t, SO.tKerb, SO.tKerb + 0.6), back = soSm(t, SO.tCar - 0.45, SO.tCar - 0.1);
      v.p = soAdd([Y.kerb[0], 1.62 - 0.08 * step * (1 - back), Y.kerb[2]], [0, 0, -0.55 * step * (1 - back) + 0.1 * back]);
      const look = Ease.inOutSine(soSm(t, SO.tKerb - 1.2, SO.tKerb - 0.3)) * (1 - Ease.inOutSine(soSm(t, SO.tKerb + 0.2, SO.tKerb + 0.8)));
      v.at = soAdd(v.p, [-6 * look + 0.4, -0.25, -6 + 2 * look]);
      // it's past: you watch its tail-lights go, silent, down the wet street ("Now every car is silent.")
      if (t > SO.tCar - 0.55) { const ev = set.MV.ev.g.position; v.at = soV(v.at, [ev.x + 2.36 + 1.4, 0.8, ev.z], 0.35 * soSm(t, SO.tCar - 0.55, SO.tCar - 0.2) + 0.6 * soSm(t, SO.tCar + 0.3, SO.tCar + 1.8)); }
      v.fov = 62 - 18 * Ease.inOutSine(soSm(t, SO.tCar + 0.8, SO.tCar + 4.5)); v.shake = t > SO.tCar - 0.3 && t < SO.tCar + 0.6 ? 0.006 : 0; v.sh = { f: [0, 1, -4], R: 10 }; break; }
    // the ambulance, blue lights going, siren on (nothing): people don't move out of its way
    case 'warn': { v.p = into([Y.kerb[0] + 0.3, 1.62, Y.kerb[2] + 0.1], [Y.kerb[0] + 0.25, 1.62, Y.kerb[2] + 0.05], k); const a = set.MV.amb.g.position;
      v.at = soV([-30, 1.5, -7], [a.x, 1.5, a.z], soSm(t, shot.t0 + 0.8, shot.t0 + 2.4)); v.fov = 56; v.sh = { f: [a.x, 1, -6], R: 12 }; break; }
    // "Can anyone hear me?": every head in the street turns to you
    case 'heads': { v.p = into([Y.kerb[0] + 0.2, 1.62, Y.kerb[2] - 0.2], [Y.kerb[0] + 0.45, 1.62, Y.kerb[2] - 0.3], k); v.at = into([12, 1.45, -5.0], [10, 1.5, -6.2], k); v.fov = 58 - 12 * Ease.inOutSine(k); v.sh = { f: [6, 1, -4], R: 14 }; break; }
    // the park gate: lightning over the rooftops 2 km south; you count
    case 'storm': { v.p = into([3.2, 1.62, -13.2], [3.1, 1.62, -13.6], k); v.at = [-120, 120, -1000]; v.fov = 58; v.fogK = 0.6; v.sh = { f: [0, 1, -16], R: 12 }; break; }
    // ---- 4: the park, 9:56
    case 'park': { const a = soLerp(0.5, -0.35, Ease.inOutSine(k)) * Math.PI; v.p = [Y.park[0], 1.62, Y.park[2]]; v.at = [Y.park[0] + Math.sin(a) * 30, 3.5, Y.park[2] - Math.cos(a) * 30]; v.fov = 62; v.fogK = 0.7; v.sh = { f: [Y.park[0], 1, Y.park[2] - 8], R: 20 }; break; }
    // "HELLO!": first person, at the tower; the tower block (the echo comes back); from above: the wave and its echoes
    case 'shout': { const Tw = SO_ST.tower, tc = [(Tw.x[0] + Tw.x[1]) / 2, Tw.h * 0.84, Tw.z[1]];
      if (shot.cam === 'tower') { v.p = into([Y.park[0] + 0.3, 1.6, Y.park[2] - 1], [Y.park[0] + 0.25, 1.6, Y.park[2] - 1.4], k); v.at = tc; v.fov = 15; v.fogK = 0.4; v.near = 0.3; v.sh = { f: [Y.park[0], 1, Y.park[2] - 10], R: 20 }; break; }
      if (shot.cam === 'map') { const w = Ease.inOutSine(k); v.p = [Y.park[0] + 30 + 20 * w, 300 + 60 * w, Y.park[2] + 140 + 30 * w]; v.at = [Y.park[0], 0, Y.park[2] - 30]; v.fov = 58; v.fogK = 0.12; v.drift = 0; v.rain = false; v.sh = { f: [Y.park[0], 0, Y.park[2]], R: 80 }; break; }
      const sh = SO.tShout, j = soSm(t, sh, sh + 0.15) * (1 - soSm(t, sh + 0.9, sh + 1.6));
      v.p = [Y.park[0], 1.62 + 0.03 * j, Y.park[2]]; v.at = soV([Y.park[0] - 2, 2.2, Y.park[2] - 30], tc, 0.4); v.fov = 56 + 4 * j; v.shake = 0.004 * j; v.sh = { f: [Y.park[0], 1, Y.park[2] - 8], R: 20 }; break; }
    // 5 km: up and up, over the city's lights
    case 'far': { const w = Ease.inOutCubic(k); v.p = [Y.park[0] + 40 + 1500 * w, 60 + 2600 * w, Y.park[2] + 120 + 6200 * w]; v.at = [Y.park[0], 0, Y.park[2] - 1200 * w]; v.fov = 56; v.fogK = 0.04; v.far = 30000; v.drift = 0; v.rain = false; v.sh = { f: [Y.park[0], 0, Y.park[2]], R: 60 }; v.near = 1; break; }
    // they come: from every gate, phones lit
    case 'coming': { if (shot.cam === 'high') { const w = Ease.inOutSine(k); v.p = [Y.park[0] - 40 - 10 * w, 32 + 6 * w, Y.park[2] + 40]; v.at = [Y.park[0] - 12, 0, Y.park[2] - 4]; v.fov = 54; v.fogK = 0.5; v.rainA = 0.18; v.sh = { f: [Y.park[0] - 15, 0, Y.park[2]], R: 50 }; break; }
      v.p = into([Y.park[0], 1.62, Y.park[2]], [Y.park[0] - 0.1, 1.62, Y.park[2] + 0.3], k); v.at = into([0, 1.4, -12.4], [-10, 1.3, -20], k); v.fov = 58; v.sh = { f: [14, 1, -30], R: 24 }; break; }
    // ---- 5: the dark, 10:09. You crouch under the plane tree; the dog that comes out of nowhere
    case 'hide': { const H = Y.hide; v.p = into([H[0] + 0.1, 0.95, H[2]], [H[0], 0.92, H[2] + 0.05], k); v.at = into([H[0] - 2.4, 1.3, H[2] + 8], [H[0] - 4.8, 0.9, H[2] + 7], k); v.fov = 58; v.expo = 0.5; v.rain = false; v.sh = { f: [H[0], 1, H[2]], R: 10 }; break; }
    case 'dog': { const H = Y.hide, d = set.C.dog2.root.position; v.p = [H[0], 0.95, H[2]]; v.at = soV([H[0] - 6, 0.4, H[2] - 4], [d.x, 0.45, d.z], soSm(t, SO.tDog - 0.2, SO.tDog + 0.3)); v.fov = 60; v.expo = 0.55; v.rain = false; v.shake = t > SO.tDog + 0.3 && t < SO.tDog + 1.1 ? 0.007 : 0; v.sh = { f: [H[0], 1, H[2]], R: 10 }; break; }
    // the echo pictures: you click; every surface the click reaches lights up as its echo comes back (slowed down)
    case 'echo': case 'who': case 'question': { const H = Y.hide; v.p = [H[0], 0.95, H[2]]; v.rain = false; v.drift = 0.0016; v.fov = 64;
      let yaw = -0.3;                                                               // 0: north (the tree, the bench); + left (west)
      if (m === 'echo') yaw = -0.3 + 0.55 * Ease.inOutSine(soSm(t, c('echo', 4) - 0.6, c('echo', 4) + 0.6)) - 1.15 * Ease.inOutSine(soSm(t, c('echo', 5) + 0.4, c('echo', 5) + 3.6));
      if (m === 'who') yaw = -1.15 + 1.5 * Ease.inOutSine(soSm(t, c('who', 1) - 0.8, c('who', 2) + 0.4));
      let up = 0.85;
      // the last click: you turn round, and it finds what's right behind you (0.95 m): you look up at it
      if (m === 'question') { const tq = SO.tClicks[SO.tClicks.length - 1], u = Ease.inOutCubic(soSm(t, tq - 0.85, tq + 0.05)), B = SO_BEHIND;
        yaw = 0.35 + (B.a - 0.35) * u; up = 0.85 + (0.95 + (1.56 - 0.95) * 10 / B.d1 - 0.85) * u; v.fov = 62 - 16 * u - 4 * soSm(t, tq + 0.3, SO.end); v.drift = 0.0012; }
      v.at = [H[0] + Math.sin(yaw) * 10, up, H[2] + Math.cos(yaw) * 10]; break; }
  }
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function soLabels(set, t) {
  const shot = soShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, Y = SO_ST.you;
  if (m === 'shout' && shot.cam === 'tower') { const Tw = SO_ST.tower; out.push({ p: [(Tw.x[0] + Tw.x[1]) / 2, Tw.h + 2, Tw.z[0]], text: 'THE TOWER BLOCK', sub: `170 m · BACK IN ${(2 * 170 / SOP.c).toFixed(2)} s`, a: W(t, shot.t0 + 0.4, shot.t1 - 0.2, 0.3, 0.3), side: 'r' }); }
  if (m === 'shout' && shot.cam === 'map') SO_ECHO.forEach((e, i) => { const p = soEchoPoint(i); out.push({ p: [p[0], 6, p[2]], text: e.name, sub: `${Math.round(e.d)} m · ${e.dt.toFixed(2)} s`, a: W(t, shot.t0 + 0.6 + (shot.t1 - shot.t0 - 1.2) * 0.12 * i, shot.t1 - 0.2, 0.3, 0.3), side: i % 2 ? 'r' : '' }); });
  if (m === 'echo') {
    const H = Y.hide, P = SO_ST.plane;
    // each label appears as its echo comes back (the click that shows it, plus the distance at the picture's speed)
    const back = (k, x, z) => SO.tClicks[k] + Math.hypot(x - H[0], z - H[2]) / SO_ECHO_V;
    out.push({ p: [P.x, 1.4, P.z], text: 'A TREE', sub: '3 m', a: W(t, back(3, P.x, P.z), soC('echo', 3) + 1.2, 0.25, 0.4), side: '' });
    out.push({ p: [-8, 0.6, -17.2], text: 'A BENCH', sub: '5 m', a: W(t, back(3, -8, -17.2), soC('echo', 3) + 1.2, 0.25, 0.4), side: 'r' });
    const p0 = set.C.ring[0].root.position; out.push({ p: [p0.x, 1.9, p0.z], text: '?', sub: '7 m', a: W(t, back(4, p0.x, p0.z), soC('echo', 4) + 0.2, 0.25, 0.3), side: 'r' });
    void H;
  }
  return out;
}
