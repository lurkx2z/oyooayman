/* =====================================================================
   WORLD — the film's main set: your kitchen on the fifth floor (room.js; its window looks south over the park), the
   street and the park (street.js), the people, the dog and the pigeons (cast.js), what goes up outdoors (things.js),
   your cat (animals.js), your own hands, and the afternoon sky (Saturday, 3 PM, the sun in the south-west).
   Every shot (shots.js) is a mode: story time s comes from the one clock (script.js: saStoryAt), the world is posed
   with it (pure), and the mode places the camera.
   Your hands hold things where the things are: each held thing has a fixed place (room-local) until you let go, and
   the hand is posed onto it every frame (saGripPose), so a hand and what it holds never drift apart, whatever the
   camera does.
   ===================================================================== */

const saAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ---------------------------------------------------------------------------------------------------------------------
// WHAT YOU HOLD (room-local) and when you let go (story s)
// ---------------------------------------------------------------------------------------------------------------------
const SA_HELD = {
  glass: [0.38, 1.0, 0.3],                                 // the glass of water, over the table (let go at s = 0)
  spoon: [-0.12, 0.99, 0.3], grape: [0.2, 0.99, 0.3],      // the spoon (left hand) and the grape (right), SA.sSG
  spoonRest: [0.42, 0.757, 0.24], grapeRest: [0.63, 0.83, -0.03],   // (on the table, in the bowl, until you pick them up)
  apple: [0.85, 1.3, -2.62],                               // out of the open window (SA.sApple): 37 cm clear of the wall
  mug: [-1.98, 0.92, -0.06],                               // the mug you pour into (on the counter)
};
const SA_EYE = [-0.06, 1.18, 0.6];                         // you, sitting at the table (eye), facing the window
// the tap by the window: it drips. From 3:00 each drop creeps out over the top of the spout and falls up 28 cm into the
// underside of the wall cupboard, where a wet patch grows (room-local: the spout's tip; the cupboard's underside)
const SA_TAP = [-2.24, 1.214, -1.05], SA_TAP_TOP = SA_ROOM.wallCab.y[0], SA_TAP_P = 0.42;

// ---------------------------------------------------------------------------------------------------------------------
// THE KETTLE (local: its base at the origin, the spout along +x, the handle at −x). In your right hand in the kettle
// shot: lifted off its base, tipped over the mug (SA.sPour), set upright again
// ---------------------------------------------------------------------------------------------------------------------
const SA_KET = { tip: [0.142, 0.212, 0], grip: [-0.122, 0.118, 0], tilt: 0.9 };
function saBuildKettle() {
  const g = new THREE.Group(), body = saStd('#ece6da', 0.32), dark = saStd('#26272a', 0.45), steel = saStd('#c9ccce', 0.25, 0.85);
  const pts = [[0, 0], [0.078, 0], [0.086, 0.012], [0.088, 0.05], [0.085, 0.13], [0.078, 0.18], [0.066, 0.206], [0.05, 0.214], [0, 0.216]].map(([x, y]) => new THREE.Vector2(x, y));
  saMesh(new THREE.LatheGeometry(pts, 32), body, 0, 0, 0, g);
  saCyl(0.087, 0.087, 0.014, dark, 0, 0.007, 0, g, 32);                                  // the dark base band
  saCyl(0.052, 0.054, 0.012, steel, 0, 0.218, 0, g, 24);                                 // the lid
  saMesh(new THREE.SphereGeometry(0.014, 12, 8).scale(1.4, 0.8, 1.0), dark, 0, 0.228, 0, g);
  // the spout: a tapered tube from the body's shoulder up and out to the tip
  { const a = new THREE.Vector3(0.062, 0.15, 0), b = new THREE.Vector3(...SA_KET.tip), d = b.clone().sub(a), L = d.length();
    const sp = saMesh(new THREE.CylinderGeometry(0.009, 0.019, L, 14, 1, true), body, (a.x + b.x) / 2, (a.y + b.y) / 2, 0, g);
    sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); sp.material = body; }
  // the handle: a vertical grip with two arms back to the body
  { saMesh(saRoundBox(0.022, 0.15, 0.03, 0.009, 0.004), dark, SA_KET.grip[0], SA_KET.grip[1] - 0.075, 0, g);
    for (const y of [0.04, 0.19]) saBox(0.05, 0.022, 0.028, dark, SA_KET.grip[0] + 0.03, y, 0, g); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
function saBuildMug() {
  const g = new THREE.Group(), m = saStd('#c8553a', 0.35);
  const pts = [[0, 0.002], [0.036, 0.002], [0.04, 0.008], [0.042, 0.095], [0.039, 0.095], [0.036, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
  const b = saMesh(new THREE.LatheGeometry(pts, 28), m, 0, 0, 0, g); b.material.side = THREE.DoubleSide;
  const h = saMesh(new THREE.TorusGeometry(0.026, 0.006, 8, 16, Math.PI * 1.2), m, 0.04, 0.05, 0, g); h.rotation.z = -Math.PI * 0.6;
  return g;
}
// the kettle's pose (room-local position of its base, its tilt) at story s
function saKettleAt(s) {
  const P = SA.sPour, rest = [SA_ROOM.kettle[0], SA_ROOM.counter.top + 0.02, SA_ROOM.kettle[2]];
  const a = SA_KET.tilt * (saSm(s, P[0] - 0.55, P[0] + 0.05) - saSm(s, P[1], P[1] + 0.6));
  // over the mug: the tip right above its middle when fully tipped (the spout points north, +z: yaw −90°)
  const tx = SA_KET.tip[0] * Math.cos(SA_KET.tilt) + SA_KET.tip[1] * Math.sin(SA_KET.tilt), ty = -SA_KET.tip[0] * Math.sin(SA_KET.tilt) + SA_KET.tip[1] * Math.cos(SA_KET.tilt);
  const pour = [SA_HELD.mug[0], SA_HELD.mug[1] + 0.2 - ty, SA_HELD.mug[2] - tx];
  const lift = [rest[0] + 0.06, rest[1] + 0.13, rest[2] - 0.02];
  const u1 = saSm(s, P[0] - 2.6, P[0] - 1.2), u2 = saSm(s, P[0] - 1.2, P[0] - 0.2), u3 = saSm(s, P[1] + 0.6, P[1] + 1.8);
  let p = saV(rest, lift, u1); p = saV(p, pour, u2); p = saV(p, lift, u3);
  return { p, a };
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR HANDS. A pose from a grip: g = the world point the hand holds, F = the way the fingers point, N = the way the
// palm faces (world directions); off = where g sits in the hand's own frame ([toward the thumb, along the fingers,
// out of the palm], m). Returns the ViewerHands pose for the current camera (camera space; x mirrored for the left)
// ---------------------------------------------------------------------------------------------------------------------
const _fuGq = new THREE.Quaternion(), _fuGf = new THREE.Vector3(), _fuGn = new THREE.Vector3(), _fuGx = new THREE.Vector3(), _fuGw = new THREE.Vector3();
function saGripPose(cam, g, F, N, off, side, curl, thumb) {
  const f = _fuGf.set(F[0], F[1], F[2]).normalize(), n = _fuGn.set(N[0], N[1], N[2]); n.addScaledVector(f, -n.dot(f)).normalize();
  const x = _fuGx.crossVectors(f, n);                                   // toward the thumb (right hand); the left hand's thumb is −x
  const w = _fuGw.set(g[0], g[1], g[2]).addScaledVector(x, -off[0] * side).addScaledVector(f, -off[1]).addScaledVector(n, -off[2]);
  cam.updateMatrixWorld(true);
  const pc = cam.worldToLocal(w.clone()), qi = _fuGq.copy(cam.quaternion).invert();
  const fc = f.clone().applyQuaternion(qi), nc = n.clone().applyQuaternion(qi);
  return { p: [pc.x * side, pc.y, pc.z], F: [fc.x * side, fc.y, fc.z], N: [nc.x * side, nc.y, nc.z], curl, thumb, trem: 0.0006 };
}
// the hand keyframes (film time) are built once the shots exist: saHandScript()
function saHandScript() {
  const sh = (m) => saShot(m), tG = saFilmAt(0), tSG = saFilmAt(SA.sSG), tA = saFilmAt(SA.sApple);
  const A0 = sh('title'), A2 = sh('sg'), A4 = sh('kettle'), A8 = sh('apple');
  return {
    right: [[-9, 'glass'], [tG - 0.02, 'glassOpen'], [A0.t1, 'hidden'], [A2.t0 - 0.6, 'pinchR'], [tSG - 0.02, 'pinchOpenR'], [A2.t1, 'hidden'],
      [A4.t0 - 0.6, 'kettle'], [A4.t1, 'hidden'], [A8.t0 - 0.6, 'apple'], [tA - 0.02, 'appleOpen'], [A8.t1, 'hidden']],
    left: [[-9, 'hidden'], [A2.t0 - 0.6, 'pinchL'], [tSG - 0.02, 'pinchOpenL'], [A2.t1, 'hidden']],
  };
}
const SA_HAND_BLENDS = { glass: 0.2, glassOpen: 0.14, pinchR: 0.3, pinchL: 0.3, pinchOpenR: 0.1, pinchOpenL: 0.1, kettle: 0.3, apple: 0.3, appleOpen: 0.22, hidden: 0.45 };
// the shots in which your hands can be on screen
const SA_HAND_MODES = new Set(['title', 'sg', 'kettle', 'apple']);

// ---------------------------------------------------------------------------------------------------------------------
// THE CAT (room-local). It sits on the counter by the hob; at SA.sCat it hops down for the floor and falls up instead,
// turning over in the air (the righting reflex: front half first) to land on the ceiling on its feet. It tries twice
// to jump down (SA.sCatHop): each jump takes it 29 cm off the ceiling and back. By 3:08 it has walked over to above the
// middle of your table. At 3:10 it falls, turns over again, and lands on the table on its feet.
// → { p (its feet: the quad's origin), q, pose }
// ---------------------------------------------------------------------------------------------------------------------
const SA_CATP = { sit: [-2.12, SA_ROOM.counter.top, 0.82], vx: 1.6, vy: -0.8, hc: 0.2, later: SA_CAT_TABLE, yawLater: 2.2 };
function saCatFlight() {
  const P = SA_CATP, a = 4.905, b = P.vy, c = P.sit[1] + P.hc - (SA_CEIL - P.hc);           // a τ² + b τ + c = 0: centre reaches the ceiling stand
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}
const SA_CAT_LAND = saCatFlight();                                                         // ≈ 0.60 s after the jump
function saCatState(s) {
  const P = SA_CATP, C = SA_CEIL, s0 = SA.sCat, hc = P.hc, yaw0 = Math.PI / 2;
  const qOf = (yaw, roll, pitch = 0) => { const q = new THREE.Quaternion().setFromAxisAngle(_fuCy, yaw); q.multiply(new THREE.Quaternion().setFromAxisAngle(_fuCz, roll)); if (pitch) q.multiply(new THREE.Quaternion().setFromAxisAngle(_fuCx, pitch)); return q; };
  const feetFrom = (c, q) => { const up = new THREE.Vector3(0, hc, 0).applyQuaternion(q); return [c[0] - up.x, c[1] - up.y, c[2] - up.z]; };
  // sitting on the counter, looking round; it crouches to jump
  if (s < s0) {
    const k = saSm(s, s0 - 0.9, s0 - 0.15);
    const up = saSm(s, s0 - 2.4, s0 - 1.6);                                                 // a loaf; it gets up; it crouches to jump
    return { p: P.sit.slice(), q: qOf(yaw0 + 0.25 * (1 - k) * Math.sin(s * 0.4), 0), pose: saQuadPose({ crouch: 0.85 * (1 - up) + 0.15 * up + 0.55 * k, head: [0.25 - 0.85 * k, (1 - k) * 0.5 * Math.sin(s * 0.33)], tail: [0.5, 0.6 * Math.sin(s * 1.3)] }) };
  }
  const tau = s - s0, L = SA_CAT_LAND;
  if (tau < L) {                                                                            // in the air: it turns over
    const c = [P.sit[0] + P.vx * tau, P.sit[1] + hc + P.vy * tau + 4.905 * tau * tau, P.sit[2]];
    const rf = Math.PI * saSm(tau, 0.1, 0.38), rb = Math.PI * saSm(tau, 0.18, 0.48), roll = (rf + rb) / 2;
    const q = qOf(yaw0, roll);
    return { p: feetFrom(c, q), q, pose: saQuadPose({ twistF: rf - roll, twistB: rb - roll, stretch: 0.9 * (1 - saSm(tau, 0.3, 0.55)), crouch: 0.4 * saSm(tau, 0.45, L), head: [0.3, 0], tail: [0.1, 1.2 * Math.sin(tau * 14)] }) };
  }
  if (s < SAP.T) {                                                                          // on the ceiling, upside down
    const land = [P.sit[0] + P.vx * L, P.sit[2]];
    const w = saSm(s, 95, 140), x = saLerp(land[0], P.later[0], w), z = saLerp(land[1], P.later[1], w), yaw = saLerp(yaw0, P.yawLater, w);
    let d = 0, crouch = 0.7 * Math.exp(-(s - s0 - L) / 0.5) + 0.45, stretch = 0;
    for (const h of SA.sCatHop) {
      const u = s - h;
      if (u > -0.5 && u < 0) crouch = Math.max(crouch, 0.85 * saSm(u, -0.5, -0.1));
      if (u >= 0 && u < 0.489) { d = 2.4 * u - 4.905 * u * u; stretch = 0.8 * Math.sin(Math.PI * u / 0.489); crouch = 0; }
      if (u >= 0.489 && u < 1.2) crouch = Math.max(crouch, 0.8 * (1 - saSm(u, 0.6, 1.2)));
    }
    const walking = w > 0.01 && w < 0.99;
    const q = qOf(yaw, Math.PI);
    const c = [x, C - hc - d, z];
    return { p: feetFrom(c, q), q, pose: saQuadPose({ crouch: walking ? 0.2 : crouch, stretch, gait: walking ? s * 9 : null, head: [0.55 + 0.15 * Math.sin(s * 0.5), 0.4 * Math.sin(s * 0.27)], tail: [0.15, 0.9 * Math.sin(s * 2.1)] }) };
  }
  // 3:10: it falls, turns over again, and lands on your table on its feet
  const x = P.later[0], z = P.later[1], fy = saRestY(x, z);
  const u = s - SAP.T, top = C - hc, rest = fy + hc, tf = Math.sqrt(2 * (top - rest) / SAP.g);
  if (u < tf) {
    const c = [x, top - 4.905 * u * u, z], rf = Math.PI + Math.PI * saSm(u, 0.06, 0.3), rb = Math.PI + Math.PI * saSm(u, 0.12, 0.38), roll = (rf + rb) / 2, q = qOf(P.yawLater, roll);
    return { p: feetFrom(c, q), q, pose: saQuadPose({ twistF: rf - roll, twistB: rb - roll, stretch: 0.7 * saSm(u, 0.25, tf), head: [0.3, 0], tail: [0.1, 1.0 * Math.sin(u * 12)] }) };
  }
  const v = u - tf, q = qOf(P.yawLater + 0.6 * saSm(v, 1.0, 2.2), 0);
  return { p: [x, fy, z], q, pose: saQuadPose({ crouch: 0.85 * Math.exp(-v / 0.35) + 0.15 * (1 - saSm(v, 0.8, 1.6)), head: [0.4 * Math.exp(-v / 0.6) + 0.35, 0.5 * Math.sin(v * 0.9)], tail: [0.8, 0.5 * Math.sin(v * 3)] }) };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------------------------------------------------
SA_SETS.world = (app) => {
  const S = saSet(app, { sky: '#9fbcd8', fov: 50, near: 0.02, far: 6000, hemi: ['#d6e2ef', '#6f6252', 0.6], sun: SA_SUN.map((x) => x * 60), sunI: 3.4, sunColor: '#ffe6c4',
    shadow: 2048, shadowR: 10, shadowFar: 340, env: ['#8db4dc', '#ead8c0', '#6c6256'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  scene.fog = new THREE.FogExp2('#cdd8e2', 0.0011);
  const sky = saGradSky(scene, '#3a74c0', '#cfdde8', '#7a766c', { sunDir: SA_SUN, sunGlow: '#ffd9a8', hw: 0.3 });
  const R = saBuildRoom(S), T = saBuildStreet(S), C = saBuildCast(S, T), X = saBuildThings(S, T);
  // your kettle and mug; your cat
  const kettle = saBuildKettle(); R.room.add(kettle);
  const mug = saBuildMug(); mug.position.set(SA_HELD.mug[0], SA_HELD.mug[1], SA_HELD.mug[2]); mug.rotation.y = 2.4; R.room.add(mug);
  const cat = saBuildQuad(SA_CAT); R.room.add(cat.root);
  // the dripping tap: a few beads, and the wet patch they make on the cupboard's underside
  const tapDrops = []; for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), R.M.water); d.visible = false; R.room.add(d); tapDrops.push(d); }
  const tapWet = new THREE.Mesh(new THREE.CircleGeometry(1, 32), R.M.wet); tapWet.rotation.x = Math.PI / 2; tapWet.position.set(SA_TAP[0], SA_TAP_TOP - 0.0015, SA_TAP[2]); R.room.add(tapWet);
  // your hands
  const hands = new ViewerHands(cam, { script: saHandScript(), poses: {}, blends: SA_HAND_BLENDS, skin: '#c9967a', nail: '#e2bba8', sleeve: '#4a5a74', cuff: '#3c4a60', watch: true, sleeveLen: 0.34 });
  // the light that bounces round your kitchen (off the floor, the table, the walls): it lights the ceiling we keep looking at
  const fillA = new THREE.PointLight('#fff1dc', 0, 7, 1.4), fillB = new THREE.PointLight('#dce8f6', 0, 7, 1.4), fillC = new THREE.PointLight('#ffe8cc', 0, 5, 1.6);
  R.room.add(fillA, fillB, fillC); fillA.position.set(0.2, 0.9, -0.4); fillB.position.set(0.3, 1.9, -1.5); fillC.position.set(-1.6, 1.4, 0.3);
  const drops = saPuffs(scene, 4200, { soft: 1.2 });
  const RL = (x, y, z) => R.toWorld(x, y, z).toArray();
  const rel = { room: null, world: null };
  // where the people's props are at the moment they let go (each one posed once, then the cast is re-posed per frame)
  const relWorld = () => { if (!rel.world) { rel.world = {}; for (const k of Object.keys(SA_REL)) rel.world[k] = C.relAt(k); rel.world.apple = RL(...SA_HELD.apple); } return rel.world; };
  const set = {
    scene, camera: cam, R, T, C, X, hands, cat, kettle,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = saStoryAt(t), rate = saRateAt(t), k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._s = s; this._shot = shot; this._rate = rate; this._t = t;
      const RW = relWorld();
      // ------------------------------------------------------------------ pose the world first (some cameras follow things)
      T.update(s, { t, mode: m });
      C.update(s, { mode: m });
      // the kettle (on its base, or in your hand), the cat
      const K = saKettleAt(s); kettle.position.set(K.p[0], K.p[1], K.p[2]); kettle.quaternion.setFromAxisAngle(_fuCy, -Math.PI / 2).multiply(new THREE.Quaternion().setFromAxisAngle(_fuCz, -K.a));
      const cs = saCatState(s); cat.root.position.set(cs.p[0], cs.p[1], cs.p[2]); cat.root.quaternion.copy(cs.q); saPoseQuad(cat, cs.pose);
      this.tapDrips(s);
      // the room: what you let go of (held until then), the tea's stream and where it lands on the ceiling
      const held = {}, H = SA_HELD;
      if (s < 0) held.glass = new THREE.Vector3(...H.glass);
      const onTable = s < 12;                                              // (picked up off camera, between two shots)
      if (s < SA.sSG) { held.spoon = new THREE.Vector3(...(onTable ? H.spoonRest : H.spoon)); held.grape = new THREE.Vector3(...(onTable ? H.grapeRest : H.grape)); }
      const roomDrops = [], tea = this.teaStream(s, kettle, roomDrops);
      R.update(s, { rel: { glass: H.glass, spoon: H.spoon, grape: H.grape }, held, teaHit: tea.hit, drops: roomDrops });
      if (onTable) R.spoon.rotation.set(0, 2.2, 0);
      // ------------------------------------------------------------------ the camera
      const v = { p: [0, 2, -5], at: [0, 1, 0], fov: 50, drift: 0.004, sh: { f: null, R: 14 }, inside: false, far: 6000, near: 0.05, roll: 0 };
      X.update(s, { rel: RW, mode: m });                                  // (positions only: some cameras follow them)
      saShotCam(this, m, s, t, k, shot, v, RL);
      const dr = v.drift ? saDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 71) * Math.sin(t * 13.3); dr[1] += j * 0.6 * Math.sin(t * 57 + 1); dr[2] += j * Math.sin(t * 63 + 2) * Math.sin(t * 9.1); }
      if (cam.near !== v.near) cam.near = v.near;
      if (cam.far !== v.far) cam.far = v.far;
      saCam(cam, saAdd(v.p, dr), saAdd(v.at, dr), v.fov, v.roll || 0);
      this._inside = v.inside; this._expo = v.expo || 0;
      // ------------------------------------------------------------------ things outdoors (some follow the camera: puffs)
      const worldDrops = [];
      X.update(s, { rel: RW, drops: worldDrops, mode: m, cam });
      if (m === 'apple' && s < SA.sApple) { X.apple.visible = true; X.apple.position.set(...RW.apple); X.apple.rotation.set(0.3, 0.8, 0); }   // (in your hand)
      // ------------------------------------------------------------------ your hands (posed onto what they hold)
      const handsOn = SA_HAND_MODES.has(m);
      hands.root.visible = handsOn;
      if (handsOn) { this.posHands(s, t, kettle, RL); hands.update(t); }
      // ------------------------------------------------------------------ the light
      const inside = v.inside;
      sun.intensity = 3.4; S.hemi.intensity = inside ? 0.42 : 0.62;
      scene.environmentIntensity = inside ? 0.5 : 0.85;
      fillA.intensity = inside ? 2.2 : 0; fillB.intensity = inside ? 1.4 : 0; fillC.intensity = inside ? 0.9 : 0;
      scene.fog.density = (inside ? 0.0005 : 0.0011) * (v.fogK ?? 1);
      const f = v.sh.f || v.at, D = 160;
      sun.position.set(f[0] + SA_SUN[0] * D, f[1] + SA_SUN[1] * D, f[2] + SA_SUN[2] * D); sun.target.position.set(f[0], f[1], f[2]); sun.target.updateMatrixWorld();
      { const c = sun.shadow.camera; if (c.right !== v.sh.R) { c.left = -v.sh.R; c.right = v.sh.R; c.top = v.sh.R; c.bottom = -v.sh.R; c.updateProjectionMatrix(); } }
      sun.shadow.bias = v.sh.R > 20 ? -0.0006 : -0.0003; sun.shadow.normalBias = v.sh.R > 20 ? 0.06 : 0.02;
      // ------------------------------------------------------------------ the drops (soft points): the room's, then the world's
      drops.begin();
      const o = R.room.position;
      for (const d of roomDrops) drops.add(d[0] + o.x, d[1] + o.y, d[2] + o.z, d[3], d[4], d[5], d[6], d[7]);
      for (const d of worldDrops) drops.add(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7]);
      drops.end();
      void sky; void tea;
    },
    // the tea: a stream from the spout while the kettle is tipped. It leaves the spout at 0.6 m/s and falls up (no drag
    // over a metre and a half). Rebuilt each frame between the drop that left first and the one that left last (pure)
    teaStream(s, ket, out) {
      const P = SA.sPour, mesh = R.stream, K = saKettleAt(P[0] + 0.3);
      // the spout's tip and its direction when fully tipped (room-local)
      const q = new THREE.Quaternion().setFromAxisAngle(_fuCy, -Math.PI / 2).multiply(new THREE.Quaternion().setFromAxisAngle(_fuCz, -SA_KET.tilt));
      const tip = new THREE.Vector3(...SA_KET.tip).applyQuaternion(q).add(new THREE.Vector3(...K.p));
      const dir = new THREE.Vector3(0.6, 0.8, 0).normalize().applyQuaternion(q);
      const v0 = 0.6, path = (tau) => [tip.x + dir.x * v0 * tau, tip.y + dir.y * v0 * tau + 4.905 * tau * tau, tip.z + dir.z * v0 * tau];
      const top = SA_CEIL - 0.004, a = 4.905, b = dir.y * v0, c = tip.y - top, tH = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a), hp = path(tH);
      const hit = [hp[0], hp[2], P[0] + tH];
      const ta = Math.max(0, s - P[1]), tb = Math.min(tH, s - P[0]);
      mesh.visible = tb > ta + 0.004;
      if (mesh.visible) {
        const n = 26, pts = [];
        for (let i = 0; i <= n; i++) { const tau = ta + (tb - ta) * i / n; pts.push(new THREE.Vector3(...path(tau))); }
        const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, 40, 1, 8, false);
        // thinner as it speeds up (the same flow through a smaller section): r ∝ 1/√v
        const pa = geo.attributes.position, nrm = geo.attributes.normal, segs = 41;
        for (let i = 0; i < pa.count; i++) { const j = Math.floor(i / 9), u = Math.min(1, j / (segs - 1)), tau = ta + (tb - ta) * u, vv = Math.hypot(v0, 9.81 * tau), r = Math.max(0.0028, 0.0068 * Math.sqrt(v0 / vv));
          const cp = curve.getPointAt(Math.min(1, u)); pa.setXYZ(i, cp.x + nrm.getX(i) * r, cp.y + nrm.getY(i) * r, cp.z + nrm.getZ(i) * r); }
        pa.needsUpdate = true; geo.computeVertexNormals();
        if (mesh.geometry) mesh.geometry.dispose(); mesh.geometry = geo;
      }
      // the splash where it hits the ceiling: drops flung out along it, falling back up onto it
      if (out && s > hit[2] && s < P[1] + tH + 0.3) for (let i = 0; i < 70; i++) { const u = ((s * 3 + saR(i, 61)) % 1) / 3, a2 = saR(i, 62) * 6.283, vh = 0.3 + 0.9 * saR(i, 63), vd = 0.3 + 0.7 * saR(i, 64);
        const d = vd * u - 4.905 * u * u; if (d < 0) continue; out.push([hit[0] + Math.cos(a2) * vh * u, SA_CEIL - d - 0.004, hit[1] + Math.sin(a2) * vh * u, 0.005 + 0.006 * saR(i, 65), 0.8, 0.6, 0.36, 0.14]); }
      return { hit, tip: tip.toArray(), tH };
    },
    // the tap's drops (pure: drop i forms from i·P, lets go at i·P + 0.8P, falls up to the cupboard)
    tapDrips(s) {
      const T = SA_TAP, P = SA_TAP_P, up = s >= 0 && s < SAP.T, g = SAP.g, rise = SA_TAP_TOP - T[1], tr = Math.sqrt(2 * rise / g);
      tapWet.visible = s > 0.4; const rw = 0.02 + 0.045 * (1 - Math.exp(-Math.max(0, Math.min(s, SAP.T)) / 25)); tapWet.scale.set(rw, rw, 1);
      tapDrops.forEach((d, j) => { d.visible = false; });
      if (!up) return;
      const i0 = Math.floor(s / P);
      for (let j = 0; j < 2; j++) {
        const i = i0 - j, s0 = i * P, sr = s0 + 0.8 * P, d = tapDrops[(i % 4 + 4) % 4], r = 0.006 + 0.002 * saR(i, 71);
        if (i < 0) continue;
        if (s < sr) { const gr = (s - s0) / (0.8 * P); d.visible = true; d.scale.set(r * gr, r * gr * (1 + 0.5 * gr), r * gr); d.position.set(T[0], T[1] + r * gr, T[2]); continue; }
        const u = s - sr; if (u > tr) continue;
        const v = g * u, y = T[1] + r + 0.5 * g * u * u; d.visible = true; d.scale.set(r * 0.9, r * (1 + 0.12 * v), r * 0.9); d.position.set(T[0], Math.min(y, SA_TAP_TOP - r), T[2]);
      }
    },
    // your hands onto what they hold (world points: the room's held places; the kettle's handle; the apple)
    posHands(s, t, ket, RL) {
      const P = hands.poses, H = SA_HELD;
      { const g = RL(...H.glass), F = [-0.3, 0.16, -0.94], N = [-0.96, 0.0, 0.3];
        P.glass = saGripPose(cam, g, F, N, [0.0, 0.058, 0.054], 1, [0.82, 0.88, 0.92, 0.98], [0.25, 0.7]);
        P.glassOpen = saGripPose(cam, saAdd(g, [0.03, -0.03, 0.06]), F, N, [0.0, 0.058, 0.07], 1, [0.18, 0.22, 0.26, 0.3], [0.55, 0.15]); }
      { const F = [-0.12, 0.62, -0.78], N = [-0.92, -0.05, -0.38];
        P.pinchR = saGripPose(cam, RL(...H.grape), F, N, [0.022, 0.118, 0.042], 1, [0.55, 1.15, 1.3, 1.4], [0.45, 0.55]);
        P.pinchOpenR = saGripPose(cam, saAdd(RL(...H.grape), [0.01, -0.02, 0.03]), F, N, [0.022, 0.118, 0.05], 1, [0.25, 0.9, 1.1, 1.2], [0.7, 0.2]);
        const FL = [0.12, 0.62, -0.78], NL = [0.92, -0.05, -0.38];
        P.pinchL = saGripPose(cam, RL(...H.spoon), FL, NL, [0.022, 0.118, 0.042], -1, [0.55, 1.15, 1.3, 1.4], [0.45, 0.55]);
        P.pinchOpenL = saGripPose(cam, saAdd(RL(...H.spoon), [-0.01, -0.02, 0.03]), FL, NL, [0.022, 0.118, 0.05], -1, [0.25, 0.9, 1.1, 1.2], [0.7, 0.2]); }
      { ket.updateMatrixWorld(true); const g = ket.localToWorld(new THREE.Vector3(...SA_KET.grip)).toArray(), qk = ket.getWorldQuaternion(new THREE.Quaternion());
        const F = new THREE.Vector3(0, 0, 1).applyQuaternion(qk).toArray(), N = new THREE.Vector3(1, 0, 0).applyQuaternion(qk).toArray();
        P.kettle = saGripPose(cam, g, F, N, [0.0, 0.07, 0.022], 1, [1.15, 1.2, 1.25, 1.3], [0.35, 0.85]); }
      { const g = RL(...H.apple), F = [0.05, 0.12, -1], N = [0.0, 1, 0.12];
        P.apple = saGripPose(cam, g, F, N, [0.0, 0.07, 0.056], 1, [0.42, 0.45, 0.5, 0.55], [0.55, 0.25]);
        P.appleOpen = saGripPose(cam, saAdd(g, [0, -0.02, 0.03]), F, N, [0.0, 0.07, 0.056], 1, [0.2, 0.22, 0.26, 0.3], [0.65, 0.12]); }
      void s; void t;
    },
    labels(t) { return saLabels(this, t); },
    grade(t, p, shot) {
      p.exposure = (this._inside ? 1.22 : 1.0) * (this._expo || 1);
      p.saturation = 1.05; p.warmth = 0.03; p.vignette = 0.5; p.bloom = 0.3; p.bloomThreshold = 0.92;
      if (shot && shot.mode === 'drop') { const u = saStoryAt(t) - SAP.T; if (u > 0.55 && u < 1.0) p.chroma = Math.max(p.chroma || 0, 0.025 * Math.sin(Math.PI * (u - 0.55) / 0.45)); }
    },
  };
  return set;
};

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, drift, sh: { f, R }, inside, far, near, fogK, expo, shake, roll }.
// RL(x, y, z): room → world. The kitchen's window is in its south wall (z −2); you sit at the table facing it.
// Outdoors: your block's front is z = 0, the street z −9…−2, the park from z −12.35 (railings), the path z −15.5, the
// plane tree at (−9, −19.2) with its low branch out over the path, the pond (and its fountain) at (0, −52).
// ---------------------------------------------------------------------------------------------------------------------
// look from p towards q, but never steeper than maxEl (rad) above the horizontal (the lintel, the up vector)
function saLookCap(p, q, maxEl) {
  const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], hz = Math.hypot(d[0], d[2]) || 1e-6, el = Math.atan2(d[1], hz);
  if (el <= maxEl) return q;
  const L = Math.hypot(hz, d[1]); return [p[0] + d[0] / hz * L * Math.cos(maxEl), p[1] + L * Math.sin(maxEl), p[2] + d[2] / hz * L * Math.cos(maxEl)];
}
function saHandsCam(v, B, k, into) { v.p = into(saAdd(B, [0.95, -0.4, -0.95]), saAdd(B, [0.8, -0.35, -0.8]), k); v.at = saAdd(B, [0, 0.32, 0.05]); v.fov = 42; v.near = 0.03; }
function saShotCam(set, m, s, t, k, shot, v, RL) {
  const into = (a, b, u) => saV(a, b, Ease.inOutSine(u));
  const room = (R = 5) => { v.inside = true; v.sh = { f: RL(0, 1.2, -0.6), R }; v.drift = 0.0015; v.near = 0.02; };
  const H = SA_HELD, E = SA_EYE;
  const X = set.X, C = set.C, T = set.T;
  const B = T.branchAt(SA_RUN.grabU);
  switch (m) {
    // ---- 1: your kitchen
    // the title: at the table with a glass of water; it slips (slow motion) and falls up; we follow it to the ceiling
    case 'title': { room(); v.p = into(RL(E[0], E[1], E[2]), RL(E[0] + 0.01, E[1] - 0.01, E[2] - 0.05), k);
      const w = Ease.inOutSine(saSm(s, 0.04, 0.62)); v.at = saV(RL(0.22, 0.88, 0.05), RL(H.glass[0], SA_CEIL, H.glass[2] - 0.05), w); v.fov = 48 + 6 * w; break; }
    // the ceiling: the glass in pieces, its water spreading
    // (then back and down, out to the whole kitchen: the window, the cat asleep on the counter, the clock)
    case 'ceiling': { room(); const w = Ease.inOutSine(saSm(k, 0.05, 1));
      v.p = saV(RL(0.95, 1.4, 0.95), RL(1.95, 1.5, 1.78), w); v.at = saV(RL(H.glass[0] - 0.05, SA_CEIL, H.glass[2] - 0.05), RL(-0.55, 1.72, -0.45), w); v.fov = 56 + 10 * w; break; }
    // the tap by the window drips: each drop falls up into the cupboard over it (tilting up after them)
    case 'tap': { room(); const T = SA_TAP, w = Ease.inOutSine(saSm(k, 0.25, 0.95));
      v.p = into(RL(T[0] + 0.25, T[1] - 0.02, T[2] + 0.17), RL(T[0] + 0.22, T[1] - 0.01, T[2] + 0.15), k); v.at = saV(RL(T[0], T[1] + 0.07, T[2]), RL(T[0], T[1] + 0.1, T[2]), w); v.fov = 60; v.near = 0.01; break; }
    // the spoon and the grape: in your hands, let go together, followed up
    case 'sg': { room();
      if (shot.cam === 'close') { const sp = H.spoon, gr = H.grape, mx = (sp[0] + gr[0]) / 2; v.p = into(RL(mx + 0.06, 2.18, 0.8), RL(mx + 0.04, 2.24, 0.72), k); v.at = RL(mx, SA_CEIL, sp[2]); v.fov = 36; break; }
      v.p = into(RL(E[0], E[1], E[2]), RL(E[0], E[1] - 0.01, E[2] - 0.04), k);
      const w = Ease.inOutSine(saSm(s, SA.sSG + 0.04, SA.sSG + 0.62)); v.at = saV(RL(0.04, 0.92, 0.22), RL(0.05, SA_CEIL, 0.26), w); v.fov = 55 - 9 * Ease.inOutSine(saSm(s, SA.sSG + 0.7, SA.sSG + 2.5)) - 16 * Ease.inOutSine(saSm(s, SA.sSG + 2.6, SA.sSG + 7.5)); break; }
    // the window: the park below (leaves going up, the fountain's column), people still out walking
    case 'window': { room();
      if (shot.cam === 'tree') { const P = SA_ST.plane; v.p = into(RL(0.0, 1.6, -1.72), RL(-0.04, 1.62, -1.8), k); v.at = saV([P.x + 0.2, 9.5, P.z + 0.6], [P.x + 0.4, 16.5, P.z + 0.6], Ease.inOutSine(saSm(k, 0.1, 1))); v.fov = 26; v.sh = { f: RL(0, 1, -1.2), R: 6 }; break; }
      v.p = into(RL(0.62, 1.62, -1.62), RL(0.62, 1.62, -1.84), k); const w = Ease.inOutSine(k); v.at = saV([-1, 5, -60], [0, 16, -52], Ease.inOutSine(saSm(k, 0.35, 1))); v.fov = 54 - 28 * w; v.sh = { f: RL(0, 1, -1.2), R: 6 }; break; }
    // the kettle: you lift it, pour, and the tea goes up; the camera follows the stream up, then back down it
    case 'kettle': { room(); v.p = into(RL(-1.55, 1.6, -0.18), RL(-1.6, 1.6, -0.14), k);
      const P = SA.sPour, w1 = Ease.inOutSine(saSm(s, P[0] + 0.1, P[0] + 1.3)), w2 = Ease.inOutSine(saSm(s, P[0] + 2.4, P[0] + 3.8));
      v.at = saV(saV(RL(-2.0, 1.0, -0.14), RL(-1.98, 2.45, 0.2), w1), RL(-1.98, 1.4, 0.02), w2); v.fov = 64; break; }
    // the puddle of tea on the ceiling (and the cat on the counter under it)
    case 'puddle': { room(); v.p = into(RL(-0.95, 1.45, 0.78), RL(-1.0, 1.43, 0.72), k); v.at = RL(-1.95, 2.45, 0.35); v.fov = 62; break; }
    // the cat: it jumps down from the counter, and lands on the ceiling
    case 'cat': { room(); const cs = saCatState(s), c = new THREE.Vector3(0, SA_CATP.hc + 0.04, 0).applyQuaternion(cs.q), cc = RL(cs.p[0] + c.x, cs.p[1] + c.y, cs.p[2] + c.z);
      if (shot.cam === 'land') {                                        // just under the ceiling, rolled over: the ceiling is its floor
        const sL = SA.sCat + SA_CAT_LAND, r = Ease.inOutSine(saSm(s, sL + 0.9, sL + 3.2));
        const a0 = saV(RL(-1.4, 1.72, 0.82), RL(-1.25, 2.3, 0.82), Ease.inOutSine(saSm(s, SA.sCat + 0.32, sL + 0.05)));
        v.p = into(RL(-0.3, 2.38, 0.42), RL(-0.36, 2.36, 0.46), k); v.at = saV(a0, RL(-1.2, 2.22, 0.82), r); v.fov = 56; v.roll = 180 * (1 - r); break; }                       // (degrees)
      v.p = into(RL(-1.58, 1.12, -0.3), RL(-1.52, 1.16, -0.24), k); v.at = saLookCap(v.p, cc, 1.1); v.fov = 50; break; }
    case 'stuck': { room(); v.p = into(RL(-0.3, 1.5, 0.3), RL(-0.34, 1.5, 0.28), k); v.at = RL(-1.12, SA_CEIL - 0.15, 0.82); v.fov = 58; break; }
    // the apple: held out of the open window; let go; followed up (as far as the lintel lets you look)
    case 'apple': { room(); v.p = into(RL(0.78, 1.46, -1.88), RL(0.8, 1.45, -1.96), k); v.sh = { f: RL(0.8, 1.2, -2.4), R: 4 };
      const a0 = RL(1.05, 0.72, -3.7), A = X.apple.visible ? X.apple.position.toArray() : RL(...H.apple), w = Ease.inOutSine(saSm(s, SA.sApple + 0.05, SA.sApple + 0.7));
      v.at = saLookCap(v.p, saV(a0, saAdd(A, [0, 0.15, 0]), w), 1.08); v.fov = 56; break; }
    // the apple from the park: a speck going up past your block
    // ... and alongside it: just above the apple, looking down past it at your block, the street and the park falling away
    case 'appleUp': { const A = X.apple.position.toArray(), w = Ease.inOutSine(k);
      v.p = saAdd(A, [-0.12 - 0.06 * w, 0.36 + 0.12 * w, 0.52 + 0.08 * w]); v.at = saAdd(A, [0.1, -0.95, -0.95]); v.fov = 52; v.drift = 0.0008; v.near = 0.03; v.fogK = 0.25; v.sh = { f: [2, 0, -8], R: 40 }; break; }
    // the street: keys, coffee, a phone
    case 'street': {
      // on the person, then up after what they lost (no steeper than cap rad)
      const up = (o, d, s0, cap) => saV(d, X[o].visible ? saLookCap(v.p, X[o].position.toArray(), cap) : d, Ease.inOutSine(saSm(s, s0 + 0.05, s0 + 0.55)));
      v.sh = { f: [1, 1, -1.5], R: 12 };
      if (shot.cam === 'keys') { v.p = into([-1.75, 1.32, -3.0], [-1.85, 1.34, -2.85], k); v.at = up('keys', [-2.8, 1.2, -0.9], SA.sKeys, 0.95); v.fov = 46; break; }
      if (shot.cam === 'coffee') { v.p = into([1.55, 1.38, -3.25], [1.45, 1.4, -3.1], k); v.at = up('cup', [0.46, 1.3, -1.35], SA.sCoffee, 0.95); v.fov = 46; break; }
      if (shot.cam === 'phone') { v.p = into([9.5, 1.42, -2.95], [9.4, 1.44, -2.8], k); v.at = up('phone', [8.6, 1.38, -0.7], SA.sPhone, 0.9); v.fov = 42; break; }
      v.p = into([1.0, 1.45, -5.6], [1.15, 1.45, -5.3], k); v.at = [-0.4, 1.5, -0.9]; v.fov = 64; break; }
    // ---- 2: the park
    case 'leaves': { if (shot.cam === 'close') { const P = SA_ST.plane; v.p = into([P.x + 4.4, 11.0, P.z + 7.2], [P.x + 4.2, 11.4, P.z + 6.9], k); v.at = [P.x + 0.6, 13.2 + 1.6 * Ease.inOutSine(k), P.z + 0.8]; v.fov = 42; v.near = 0.03; v.sh = { f: [P.x, 11, P.z], R: 7 }; break; }
      const w = Ease.inOutSine(k); v.p = saV([-17.5, 1.5, -14.6], [-17.0, 2.4, -14.8], w); v.at = saV([-9.5, 4.5, -19.2], [-7, 11, -21], w); v.fov = 64; v.sh = { f: [-12, 6, -18], R: 22 }; break; }
    case 'fountain': { if (shot.cam === 'up') { const F = SA_ST.fountain; v.p = into([F.x + 1.3, 0.85, F.z + 0.8], [F.x + 1.2, 0.9, F.z + 0.7], k); v.at = [F.x + 0.12, 30, F.z - 0.25]; v.fov = 62; v.roll = 8 + 10 * Ease.inOutSine(k); v.sh = { f: [F.x, 1, F.z], R: 8 }; break; }
      v.p = into([2.4, 1.05, -41.4], [2.2, 1.05, -41.7], k); v.at = saLookCap(v.p, [0, 3 + 42 * Ease.inOutSine(saSm(k, 0.12, 0.85)), -52], 0.5); v.fov = 62; v.sh = { f: [0, 2, -48], R: 18 }; break; }
    case 'fish': { if (shot.cam === 'chase' && X.fish.visible) { const F = X.fish.position.toArray(), w = Ease.inOutSine(k);
        v.p = saAdd(F, [0.75 + 0.2 * w, 0.55 + 0.25 * w, 0.9]); v.at = saAdd(F, [-0.35, -1.0, -1.1]); v.fov = 54; v.near = 0.03; v.fogK = 0.5; v.drift = 0.001; v.sh = { f: [4, 0, -46], R: 30 }; break; }
      v.p = into([11.5, 1.5, -34.5], [11.2, 1.5, -34.8], k); const F = X.fish.visible ? X.fish.position.toArray() : [SA_SPOT.fish[0], 0, SA_SPOT.fish[1]]; const w = Ease.inOutSine(saSm(s, SA.sFish + 0.15, SA.sFish + 1.6));
      v.at = saLookCap(v.p, saV([4, 0.6, -46.3], F, w), 1.0); v.fov = 56; v.sh = { f: [4, 1, -46], R: 10 }; break; }
    case 'ball': { if (shot.cam === 'chase' && X.ball.visible) { const b = X.ball.position.toArray(), w = Ease.inOutSine(k);
        v.p = saAdd(b, [0.7 + 0.2 * w, 0.5 + 0.2 * w, 0.85]); v.at = saAdd(b, [-0.3, -1.0, -1.0]); v.fov = 54; v.near = 0.03; v.fogK = 0.5; v.drift = 0.001; v.sh = { f: [-28, 0, -46], R: 30 }; break; }
      v.p = into([-26.2, 1.25, -42.4], [-26.4, 1.25, -42.6], k); const b = X.ball.position.toArray(), w = Ease.inOutSine(saSm(s, SA.sKick + 0.15, SA.sKick + 0.9));
      v.at = saLookCap(v.p, saV([-28, 0.6, -46.5], b, w), 1.15); v.fov = 56; v.sh = { f: [-28, 1, -46], R: 10 }; break; }
    case 'scoop': { v.p = into([19.45, 1.05, -16.05], [19.4, 1.07, -15.98], k); const sc = X.scoop.visible ? X.scoop.position.toArray() : [20.2, 1.0, -17], w = Ease.inOutSine(saSm(s, SA.sScoop + 0.15, SA.sScoop + 0.9));
      v.at = saLookCap(v.p, saV([20.2, 0.95, -17], sc, w), 0.38); v.fov = 50; v.sh = { f: [20, 1, -17], R: 8 }; break; }
    // walking: low, beside the old man's feet as he goes (he walks east, −x, along the path)
    case 'walk': { const xw = -24 - 0.32 * (s - 228); v.p = [xw - 0.55, 0.78, -13.25]; v.at = [xw - 1.25, 0.55, -15.4]; v.fov = 60; v.drift = 0.002; v.sh = { f: [xw, 0.5, -15.3], R: 6 }; break; }
    // the runner: stretching, she starts, and on her first stride she falls up into the plane tree
    case 'jogger': { v.p = into([-0.4, 1.45, -20.6], [-0.75, 1.45, -20.5], k); const r = saRunner(s, C), w = Ease.inOutSine(saSm(s, SA.sLift + 0.05, SA.sLift + 0.7));
      v.at = saV([r.pos[0] - 0.7, 1.1, SA_RUN.z], [B[0], B[1] + 0.5, B[2]], w); v.fov = 54; v.sh = { f: [-2, 2, -15], R: 10 }; break; }
    case 'hold': { v.sh = { f: [B[0], B[1], B[2]], R: 8 };
      if (shot.cam === 'hands') { saHandsCam(v, B, k, into); break; }
      if (shot.cam === 'above') { v.p = into(saAdd(B, [1.3, 3.3, -1.5]), saAdd(B, [1.1, 3.0, -1.3]), k); v.at = saAdd(B, [0.1, 0.2, 0.15]); v.fov = 56; v.near = 0.03; break; }
      v.p = into([-2.9, 1.4, -19.8], [-3.2, 1.55, -18.7], k); v.at = [B[0], B[1] + 0.8, B[2]]; v.fov = 52 - 6 * Ease.inOutSine(k); break; }
    case 'rope': { v.p = into([-1.4, 1.5, -20.2], [-1.6, 1.5, -20.0], k); v.at = [-3.4, 2.5 + 2.4 * Ease.inOutSine(saSm(s, SA.sCoat + 0.3, SA.sCoat + 1.8)), -14.4]; v.fov = 60; v.sh = { f: [-3, 2, -14], R: 9 }; break; }
    case 'dog': { v.p = into([14.4, 0.8, -26.0], [14.2, 0.82, -25.9], k); v.at = [12, 1.0 + 1.7 * Ease.inOutSine(saSm(s, SA.sDog + 0.2, SA.sDog + 1.4)), -24.2]; v.fov = 58; v.sh = { f: [12, 1, -24], R: 8 }; break; }
    case 'pigeons': { v.p = into([-6.1, 1.3, -13.5], [-6.3, 1.3, -13.6], k); v.at = [-6.4, 3.2, -16.4]; v.fov = 56; v.sh = { f: [-6, 3, -16], R: 7 }; break; }
    case 'warn': { if (shot.cam === 'post') { v.p = into([1.75, 1.35, -15.25], [1.55, 1.36, -15.08], k); v.at = [0.0, 1.3, -14.25]; v.fov = 36; v.sh = { f: [0, 1, -14.3], R: 4 }; break; }   // the old man, his arms round a lamp post
      v.p = into([9, 1.6, -10.6], [8.2, 1.6, -10.7], k); v.at = [-4, 2.5, -14.2]; v.fov = 56; v.sh = { f: [2, 1, -13], R: 16 }; break; }
    // ---- 3: 3:08 and after
    // home: your ceiling, full; then down to your table, right under it
    case 'home': { room(); v.p = into(RL(1.55, 1.62, 1.6), RL(1.45, 1.6, 1.5), k); const c1 = saC('home', 1), w = Ease.inOutSine(saSm(t, c1 - 0.2, c1 + 1.6));
      v.at = saV(RL(0.15, 2.5, -0.2), RL(0.2, 1.55, -0.15), w); v.fov = 64 + 10 * w; break; }
    case 'hold2': { v.p = into([-2.6, 3.0, -17.9], [-2.75, 3.05, -17.8], k); v.at = [B[0], B[1] + 0.35, B[2]]; v.fov = 50; v.sh = { f: [B[0], B[1], B[2]], R: 5 }; break; }
    case 'count': { if (shot.cam === 'hands') { v.sh = { f: [B[0], B[1], B[2]], R: 8 }; saHandsCam(v, B, k, into); break; }
      if (shot.cam === 'crowd') { v.p = into(saAdd(B, [0.7, -3.05, 2.1]), saAdd(B, [0.6, -3.0, 1.9]), k); v.at = saAdd(B, [-0.1, 0.5, -0.1]); v.fov = 64; v.sh = { f: [B[0], 1, B[2]], R: 9 }; break; }
      if (shot.cam === 'ceil') { room(); v.p = into(RL(SA_EYE[0], SA_EYE[1] - 0.02, SA_EYE[2]), RL(SA_EYE[0], SA_EYE[1] - 0.06, SA_EYE[2] - 0.03), k); v.at = RL(0.12, SA_CEIL, -0.12); v.fov = 72; v.drift = 0.003; break; }
      v.p = into([-2.6, 1.3, -21.0], [-2.8, 1.32, -20.8], k); v.at = [B[0] + 0.9, B[1] + 0.3, B[2]]; v.fov = 58; v.sh = { f: [B[0], 2, B[2]], R: 9 }; break; }
    // 3:10 in your kitchen: everything on the ceiling comes down at once (slow motion)
    case 'drop': { room(); v.p = into(RL(1.72, 1.5, 1.28), RL(1.66, 1.47, 1.22), k); const u = s - SAP.T;
      const wd = Ease.inOutSine(saSm(u, 0.04, 0.72)); v.at = saV(RL(0.18, 2.1, -0.12), RL(0.1, 0.95, -0.05), wd); v.fov = 64 - 12 * Ease.inOutSine(saSm(u, 0.3, 1.3)); v.drift = 0.0005; v.shake = u > 0.56 && u < 2.0 ? 0.009 * Math.exp(-(u - 0.56) / 0.35) : 0; break; }
    // back in the park: she drops to the path; the fountain's water pours back down
    case 'down': { v.p = into([-3.4, 1.55, -11.7], [-3.3, 1.55, -11.8], k); const w = Ease.inOutSine(saSm(s, 609.5, 613.5));
      v.at = saV([B[0], 2.2, B[2]], [0, 9, -52], w); v.fov = 56; v.sh = { f: saV([B[0], 1, B[2]], [0, 2, -40], w), R: 16 }; break; }
    // the question: people in the park looking up at what is still to come down
    case 'question': { v.p = into([-0.5, 1.2, -19.5], [-0.6, 1.2, -19.7], k); v.at = [2, 9, -40]; v.fov = 60; v.sh = { f: [0, 0, -26], R: 14 }; break; }
  }
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function saLabels(set, t) {
  const shot = saShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = set._s, X = set.X;
  const nz = [SA_ST.fountain.x, SA_ST.fountain.h + 0.16, SA_ST.fountain.z], top = () => saHt(nz[1] + saWaterH(0, s));
  if (m === 'appleUp' && X.apple.visible) out.push({ p: X.apple.position.toArray(), text: 'YOUR APPLE', sub: saHt(X.apple.position.y) + ' UP', a: W(t, shot.t0 + 0.5, shot.t1 - 0.2, 0.3, 0.3), side: 'r' });
  if (m === 'window' && !shot.cam) out.push({ p: [nz[0], 28, nz[2]], text: 'THE FOUNTAIN', sub: 'ITS TOP: ' + top() + ' UP', a: W(t, shot.t0 + 1.0, shot.t1 - 0.3, 0.4, 0.3), side: 'r' });
  if (m === 'fish' && X.fish.visible && s > SA.sFish + 1.2) out.push({ p: X.fish.position.toArray(), text: 'THE CARP', sub: saHt(X.fish.position.y) + ' UP', a: W(t, saFilmAt(SA.sFish + 1.2), shot.t1 - 0.2, 0.3, 0.3), side: 'r' });
  if (m === 'fountain') out.push({ p: [nz[0], shot.cam === 'up' ? 260 : 34, nz[2]], text: 'ITS TOP', sub: top() + ' UP', a: W(t, shot.t0 + 2.5, shot.t1 - 0.3, 0.4, 0.3), side: 'r' });
  return out;
}
