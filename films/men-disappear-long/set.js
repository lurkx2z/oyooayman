/* =====================================================================
   WORLD SET — the valley, 7:42 to 10:21 AM on Tuesday 10 November: the viaduct and everything on it (your car, the
   lorry, the driverless cars, the people), the railway and its train, the river and its barge, the town and its
   kitchen fires, the airport and its tower, and flight 2207 (outside: the airliner on its path; inside: the cockpit,
   the cabin, the flight attendant, the 64 passengers who are left).
   Through your own eyes you see your hands (ViewerHands): on the wheel, on the parking-brake switch, holding your
   phone. One clock (script.js): every shot reads s = mgStoryAt(t).
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// your hands: fixed poses (camera space, right hand; the left is mirrored) and the ones set every frame from a point in
// the world (grip: on the wheel's rim; epb: a finger on the switch)
// ---------------------------------------------------------------------------------------------------------------------
const MG_HAND_POSES = {
  phone: { p: [0.045, -0.125, -0.255], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  phoneLow: { p: [0.07, -0.22, -0.3], F: [-0.86, 0.3, -0.25], N: [0.02, 0.5, 0.86], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  gripL: { p: [0.2, -0.3, -0.45], F: [0, 0.3, -1], N: [1, 0, 0], curl: [1.15, 1.2, 1.25, 1.3], thumb: [0.6, 0.6] },
  gripR: { p: [0.2, -0.3, -0.45], F: [0, 0.3, -1], N: [1, 0, 0], curl: [1.15, 1.2, 1.25, 1.3], thumb: [0.6, 0.6] },
  reachL: { p: [0.2, -0.3, -0.45], F: [0, 0.3, -1], N: [1, 0, 0], curl: [0.35, 0.4, 0.45, 0.5], thumb: [0.5, 0.2] },
  press: { p: [0.1, -0.3, -0.4], F: [0, -0.5, -1], N: [0, -1, 0], curl: [0.25, 1.3, 1.4, 1.45], thumb: [0.3, 0.5] },
};
const MG_HAND_BL = { phone: 0.01, phoneLow: 0.01, gripL: 0.01, gripR: 0.01, reachL: 0.01, press: 0.01, hidden: 0.01 };
// set a pose so the hand (side +1 right, −1 left) holds a world point: the wrist sits `back` metres short of it, on the
// line from the shoulder; N is the palm's normal (camera space, actual side)
function mgHandTo(hands, cam, name, side, world, o = {}) {
  const P = hands.poses[name], q = cam.worldToLocal(new THREE.Vector3(world[0], world[1], world[2])), sh = new THREE.Vector3(side * 0.19, -0.3, 0.06);
  const F = q.clone().sub(sh).normalize(); if (o.F) F.set(...o.F).normalize();
  const w = q.clone().addScaledVector(F, -(o.back ?? 0.1));
  P.p = [w.x * side, w.y, w.z]; P.F = [F.x * side, F.y, F.z]; const N = o.N || [-side, 0, 0]; P.N = [N[0] * side, N[1], N[2]];
  if (o.curl) P.curl = o.curl;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE PEOPLE IN THE PLANE: 168 seats; 128 were taken at 7:41; 64 of them are still there (women and girls; drawn as
// light proxies, the first rows as full people); in the other 64, what they left (a phone, a book, a cup on the tray)
// ---------------------------------------------------------------------------------------------------------------------
function mgBuildPax(A) {
  const IN = A.inside, Pp = MG_PL, fy = Pp.floorY, zs = [-1.28, -0.8, -0.32, 0.32, 0.8, 1.28], seats = [];
  IN.rows.forEach((x, r) => zs.forEach((z, k) => seats.push({ x, z, r, k, h: mgR(r * 6 + k, 55), h2: mgR(r * 6 + k, 56) })));
  const taken = seats.slice().sort((a, b) => a.h - b.h).slice(0, 128), stay = taken.slice().sort((a, b) => a.h2 - b.h2).slice(0, 64), gone = taken.filter((q) => !stay.includes(q));
  const G = { stay, gone, people: [] };
  // the full people (rows 0–2): sitting, looking about
  const near = stay.filter((q) => q.r <= 2), far = stay.filter((q) => q.r > 2);
  near.forEach((q, i) => { const kid = i % 3 === 2, p = mgPerson(kid ? MG_GIRLS[i % 4] : MG_WOMEN[(i * 3) % 8], IN, { id: 'pax' + i, kid }); p.q = q; G.people.push(p); });
  // the proxies (instanced): a head, hair, shoulders
  const n = far.length, head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.095, 12, 9), mgStd('#ffffff', 0.7), n), hair = new THREE.InstancedMesh(new THREE.SphereGeometry(0.105, 12, 9, 0, 6.29, 0, 1.9), mgStd('#ffffff', 0.85), n),
    body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.5, 0.4), mgStd('#ffffff', 0.9), n);
  const o = new THREE.Object3D(), c = new THREE.Color(), skins = ['#e9c4a6', '#d9a888', '#c08a68', '#9a6a4a', '#7a4f36', '#5c3a26'], hairs = ['#1a120c', '#3a2416', '#6a3a1a', '#b88a50', '#d8c08a', '#8a7a6a'], cl = ['#2f4a6a', '#b8462e', '#3a7a6a', '#56465e', '#d9b84a', '#e8e6e0', '#6a6052', '#8a2f4a'];
  far.forEach((q, i) => {
    const kid = mgR(i, 57) < 0.18, y = fy + (kid ? 1.02 : 1.27), lean = 0.04 * (mgR(i, 58) - 0.5);
    o.position.set(q.x - 0.06, y, q.z + lean); o.rotation.set(0, (mgR(i, 59) - 0.5) * 0.8, 0); o.scale.setScalar(kid ? 0.85 : 1); o.updateMatrix(); head.setMatrixAt(i, o.matrix); c.set(skins[Math.floor(mgR(i, 60) * 6)]); head.setColorAt(i, c);
    o.position.set(q.x - 0.08, y + 0.02, q.z + lean); o.updateMatrix(); hair.setMatrixAt(i, o.matrix); c.set(hairs[Math.floor(mgR(i, 61) * 6)]); hair.setColorAt(i, c);
    o.position.set(q.x - 0.06, y - 0.34, q.z); o.rotation.set(0, 0, 0); o.updateMatrix(); body.setMatrixAt(i, o.matrix); c.set(cl[Math.floor(mgR(i, 62) * 8)]); body.setColorAt(i, c);
  });
  IN.add(head, hair, body);
  // what the others left on their seats (instanced boxes: phones, books, bags, a cup on a lowered tray)
  const things = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mgStd('#ffffff', 0.6), gone.length * 2); let m = 0;
  const tc = ['#121416', '#e8e2d0', '#7a2a2a', '#2a3a5a', '#d8d4cc', '#3a5a3a'];
  gone.forEach((q, i) => {
    const kind = Math.floor(mgR(i, 63) * 4);
    if (kind === 0) { o.position.set(q.x + 0.02, fy + 0.535, q.z); o.scale.set(0.15, 0.01, 0.075); }                    // a phone
    else if (kind === 1) { o.position.set(q.x + 0.05, fy + 0.545, q.z + 0.05); o.scale.set(0.2, 0.03, 0.14); }         // a book
    else if (kind === 2) { o.position.set(q.x + 0.12, fy + 0.62, q.z); o.scale.set(0.3, 0.16, 0.36); }                 // a bag
    else { o.position.set(q.x + 0.5, fy + 0.74, q.z); o.scale.set(0.3, 0.02, 0.4); }                                   // the tray, down
    o.rotation.set(0, (mgR(i, 64) - 0.5) * 0.6, 0); o.updateMatrix(); things.setMatrixAt(m, o.matrix); c.set(kind === 3 ? '#4a4e56' : tc[Math.floor(mgR(i, 65) * 6)]); things.setColorAt(m++, c);
    if (kind === 3) { o.position.set(q.x + 0.5, fy + 0.8, q.z + 0.08); o.scale.set(0.07, 0.1, 0.07); o.rotation.set(0, 0, 0); o.updateMatrix(); things.setMatrixAt(m, o.matrix); c.set('#f0ece2'); things.setColorAt(m++, c); }
  });
  things.count = m; IN.add(things);
  // the light along the cabin's ceiling
  for (const x of [-10, -3, 4, 10]) { const l = new THREE.PointLight('#fff4e4', 1.1, 7, 1.6); l.position.set(x, 1.45, 0); IN.add(l); }
  return G;
}
// the other airliners (far away: a light shape is enough): fuselage, wings, fin
function mgBuildOtherPlanes(S, n) {
  const g = new THREE.BoxGeometry(38, 3.8, 3.8), w = new THREE.BoxGeometry(6, 0.5, 34).translate(2, -0.8, 0), f = new THREE.BoxGeometry(5, 6, 0.4).translate(-16, 3.5, 0), tp = new THREE.BoxGeometry(3, 0.3, 12).translate(-17, 0.6, 0);
  const geo = THREE.mergeGeometries([g, w, f, tp].map((x) => x.toNonIndexed()), false);
  const m = new THREE.InstancedMesh(geo, mgStd('#dcdad4', 0.45, 0.2), n); m.count = 0; m.frustumCulled = false; S.scene.add(m); return m;
}

MG_SETS.world = (app) => {
  const S = mgSet(app, { sky: '#a9bfd4', fov: 50, near: 0.05, far: 40000, hemi: ['#c6d6ea', '#6a6252', 0.62], sun: [500, 150, -400], sunColor: '#ffe0b4', sunI: 2.7, shadow: 2048, shadowR: 40, shadowFar: 4000, env: ['#9ab6d4', '#e8dcc6', '#6a6456'] });
  const scene = S.scene, cam = S.camera;
  scene.fog = new THREE.FogExp2('#c4cdd4', 0.00012);
  // ---- the valley
  const ground = mgBuildGround(S), river = mgBuildRiver(S), trees = mgBuildTrees(S), town = mgBuildTown(S), sky = mgBuildSky(S);
  const V = mgBuildViaduct(S), AP = mgBuildAirport(S), RL = mgBuildRail(S), BG = mgBuildBarge(S);
  // ---- on the deck
  const YC = mgBuildYourCar(S), LR = mgBuildLorry(S), TR = mgBuildTraffic(S), DP = mgBuildDeckPeople(S);
  // ---- flight 2207, its inside, the people in it; the other planes
  const A = mgBuildAirliner(); scene.add(A); A.rotation.order = 'YZX'; const IN = mgBuildCabin(A), PAX = mgBuildPax(A);
  const att = mgPerson('mgAtt', IN, { id: 'att' });
  { const dk = mgStd('#1d1e20', 0.5); for (const sd of [-1, 1]) { const hs = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.013, 6, 16, Math.PI), dk); hs.position.set(14.05, MG_PL.floorY + 1.42, sd * 0.55); hs.rotation.set(0, Math.PI / 2, 0.4); IN.add(hs); } }   // the pilots' headsets, hanging on their seats
  const attHs = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.014, 6, 16, Math.PI), mgStd('#1d1e20', 0.5)); att.j.head.add(attHs); attHs.visible = false;
  const others = mgBuildOtherPlanes(S, 30);
  // ---- soft points: sparks (additive), smoke (fires, contrails, tyre smoke, mud, coffee)
  const fx = mgPuffs(scene, 5000, { additive: true, soft: 1.3 }), smoke = mgPuffs(scene, 6000, { soft: 1.7 });
  const sparkL = new THREE.PointLight('#ffa040', 0, 14, 1.6); scene.add(sparkL);
  // ---- your hands; your own phone (9:31)
  const hands = new ViewerHands(cam, { script: { right: [[-9, 'hidden']], left: [[-9, 'hidden']] }, poses: MG_HAND_POSES, blends: MG_HAND_BL, skin: '#c99a7e', nail: '#e2bba8', sleeve: '#6a3f5a', cuff: '#583450', watch: false, sleeveLen: 0.36 });
  const myPhone = new THREE.Group(), MYP = mgCanvasTex(400, 840, mgDrawPhone);
  myPhone.add(new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.152, 0.0085), mgStd('#e8e2da', 0.35, 0.4)));
  { const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), new THREE.MeshBasicMaterial({ map: MYP.tex, toneMapped: false })); sc.position.z = 0.0058; myPhone.add(sc); }
  myPhone.position.set(0.034, 0.074, 0.024); myPhone.rotation.set(0, 0, -Math.PI / 2); hands.right.g.add(myPhone);
  const INSIDE = new Set(['title', 'empty', 'cluster', 'grab', 'hands', 'epb', 'lorryPOV', 'stopPOV', 'radio', 'phone']);
  const PLANE_IN = new Set(['cockpit', 'cabinAisle', 'keypad', 'cabinPax', 'doorWait', 'cockpitDoor', 'fuel', 'cabinHalf', 'cockpitApp', 'flaps', 'land3', 'finalCock']);
  const TOWER = new Set(['towerIn', 'radar', 'ctl', 'towerRead', 'finalTower']);

  const set = {
    scene, camera: cam, S, ground, river, trees, town, sky, V, AP, RL, BG, YC, LR, TR, DP, A, IN, PAX, att, attHs, others, fx, smoke, sparkL, hands, myPhone, MYP,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = mgStoryAt(t), kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._s = s; this._shot = shot; this._t = t;
      // ------------------------------------------------------------------ the world at s
      const inside = INSIDE.has(m);
      YC.update(s, { inside, radio: m === 'radio', phone: m === 'phone' });
      LR.update(s); TR.update(s); RL.update(s); BG.update(s); river.update(s);
      const q = mgPlaneAt(s), gear = s < MG.sFlap ? 0 : mgGearAt(s);
      A.position.set(q.p[0], q.p[1], q.p[2]); A.rotation.set(q.roll, Math.PI / 2 - q.h, q.pitch); A.updateMatrixWorld(true);
      A.update(s, { gear, lights: s > MG.sFlap - 20 });
      if (PLANE_IN.has(m)) A.glow.visible = false;                     // (its 14 m glow sprite would wash the cockpit's view)
      this._plane = q;
      IN.visible = PLANE_IN.has(m); if (IN.visible) this.cabin(s, t, m);
      AP.update(s, { radar: TOWER.has(m) && (m === 'radar' || m === 'towerIn' || m === 'ctl' || m === 'towerRead') });
      this.tower(s);
      const plWorld = [q.p[0], q.p[1], q.p[2]];
      DP.update(s, { lookAt: s > MG.sOverViaduct - 40 ? plWorld : (s > MG_AT(9, 47) ? [600, 2600, -6000] : null) });
      // ------------------------------------------------------------------ the camera
      const v = { p: [0, 50, 30], at: [0, 42, 0], fov: 50, near: 0.3, far: 40000, drift: 0.02, fogD: 0.00012, sh: [0, 42, 0], shR: 60, shake: 0, roll: 0 };
      mgWorldCam(this, m, s, t, kk, v);
      const dr = v.drift ? mgDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 61) * Math.sin(t * 11.3); dr[1] += j * 0.7 * Math.sin(t * 53 + 1); dr[2] += j * Math.sin(t * 47 + 2) * Math.sin(t * 7.1); }
      if (cam.near !== v.near || cam.far !== v.far) { cam.near = v.near; cam.far = v.far; }
      mgCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov, v.roll);
      if (v.up) { cam.up.set(...v.up); cam.lookAt(v.at[0], v.at[1], v.at[2]); cam.updateMatrixWorld(true); }
      scene.fog.density = v.fogD;
      // ------------------------------------------------------------------ the sun, the sky, the shadows
      const d = mgSunDir(s), el = mgSunAt(s)[1];
      S.sun.position.set(v.sh[0] + d[0] * 1500, v.sh[1] + d[1] * 1500, v.sh[2] + d[2] * 1500); S.sun.target.position.set(...v.sh); S.sun.target.updateMatrixWorld();
      { const c = S.sun.shadow.camera, R = v.shR; if (c.right !== R) { c.left = -R; c.right = R; c.top = R; c.bottom = -R; c.updateProjectionMatrix(); } }
      const warm = MathX.clamp(1 - (el - 4) / 16, 0, 1);
      S.sun.color.set('#fff2e0').lerp(new THREE.Color('#ffc98a'), warm); S.sun.intensity = 1.6 + 1.6 * MathX.clamp((el - 2) / 14, 0, 1);
      S.hemi.intensity = 0.5 + 0.3 * MathX.clamp((el - 2) / 14, 0, 1);
      scene.fog.color.set('#c8d0d6').lerp(new THREE.Color('#e2d4c0'), warm * 0.6);
      sky.update(s, cam.position, {});
      { const D = v.far * 0.7; sky.sun.position.set(cam.position.x + d[0] * D, cam.position.y + d[1] * D, cam.position.z + d[2] * D); sky.sun.scale.setScalar(0.104 * D); }
      // ------------------------------------------------------------------ your hands
      this.handsFor(m, s, t);
      // ------------------------------------------------------------------ the other planes (9:47 on: circling in their stacks round the airport)
      { let n = 0; const o = mgBuildOtherPlanes._o || (mgBuildOtherPlanes._o = new THREE.Object3D());
        if (s > 3000 && !PLANE_IN.has(m) && !inside) for (const p of mgTraffic(s)) { if (p.id === 'NRD2207') continue; o.position.set(p.x, p.y, p.z); o.rotation.set(0.35, Math.PI / 2 - (p.h || 0), 0); o.rotation.order = 'YZX'; o.updateMatrix(); others.setMatrixAt(n++, o.matrix); if (n >= 30) break; }
        others.count = n; others.instanceMatrix.needsUpdate = true; }
      // ------------------------------------------------------------------ sparks, smoke
      fx.begin(); smoke.begin(); sparkL.intensity = 0;
      this.sparks(s, m); this.fires(s); this.coffee(s, m); this.contrail(s, m); this.tyres(s); RL.fx(s, fx); BG.fx(s, smoke);
      fx.end(); smoke.end();
      this._v = v;
    },
    // ---- inside the plane: the attendant, the door, the passengers, the yokes, the screens
    cabin(s, t, m) {
      const P = MG_PL, fy = P.floorY, D = this.IN;
      const tA = mgStoryAt(mgB('door')), walk = MathX.smooth(s, tA, tA + 7.5), sc = MG.sCode, sd = MG.sDoor;
      let x, z, yaw = Math.PI / 2, pose;
      if (s < sd + 1.2) {
        x = mgLerp(2.2, 12.02, walk); z = mgLerp(0.0, -0.32, MathX.smooth(s, tA + 6.5, tA + 8));
        pose = walk < 0.99 ? mgWalkPose(s * 5.2, 0.8) : MG_POSES.standStill();
        if (walk >= 0.99) {
          if (s > sc - 2.5 && s < sc + 2) { pose = MG_POSES.phone(); pose.rSh = [1.35, -0.25]; pose.rEl = 0.9; pose.headYaw = -0.25; pose.neck = 0.15; }    // her hand at the keypad
          else if (s > sc + 8 && s < sc + 16) { pose = MG_POSES.talk(); pose.rSh = [1.4, -0.1]; pose.rEl = 1.6 + 0.35 * Math.max(0, Math.sin(s * 9)); pose.mouth = 1; }   // she knocks, calls through the door
          else { pose = MG_POSES.standStill(); pose.headYaw = 0.25 * Math.sin(s * 0.3); pose.lSh = [0.3, 0.1]; pose.lEl = 1.4; }
        }
      } else {
        // the door opens; she goes in and sits in the captain's seat (left)
        const k1 = MathX.smooth(s, sd + 1.2, sd + 3.4), k2 = MathX.smooth(s, sd + 3.4, sd + 5.2);
        x = mgLerp(mgLerp(12.02, 13.6, k1), P.seatL[0] - 0.05, k2); z = mgLerp(mgLerp(-0.32, -0.15, k1), P.seatL[2], k2);
        pose = k2 < 0.98 ? lerpPose(mgWalkPose(s * 4.5, 0.6), MG_POSES.sit(), k2) : MG_POSES.sit();
        if (k2 >= 0.98) { pose = MG_POSES.sit(); pose.lSh = [0.65, 0.1]; pose.lEl = 1.2; pose.rSh = [0.6, 0.1]; pose.rEl = 1.25; pose.neck = 0.05 + 0.05 * Math.sin(s * 0.4); pose.headYaw = 0.15 * Math.sin(s * 0.23);
          // the autoland: she sets the flaps and the wheels (her right hand on the pedestal)
          if (s > MG.sFlap - 8 && s < MG.sFlap + 18) { pose.rSh = [1.1, -0.35]; pose.rEl = 0.85; pose.headYaw = 0.4; pose.neck = 0.25; }
          pose.mouth = s > MG_AT(10, 14) && s < MG.sTD - 60 ? 0.3 + 0.3 * Math.sin(s * 5) : 0; }
      }
      const sitting = s > sd + 5.0;
      mgPose(this.att, pose, x, sitting ? fy + 0.08 : fy, z, yaw);
      this.attHsOn = s > MG_AT(9, 40); attHs.visible = this.attHsOn;
      // the door: locked (its light red), the code entered (amber, blinking: 30 s), unlocked (green); she pushes it open
      const led = s < sc ? '#ff2a1a' : s < sd ? (((s - sc) * 2) % 1 < 0.5 ? '#ffb020' : '#3a2a10') : '#3aff6a'; D.keyLed.material.color.set(led);
      D.door.rotation.y = 1.45 * MathX.smooth(s, sd + 0.6, sd + 2.0);
      // the passengers who are left: looking about, at each other, at the empty seats
      this.PAX.people.forEach((p, i) => { const pp = MG_POSES.sit(); pp.headYaw = 0.6 * noise1(s * 0.07, i + 1) + (i % 2 ? 0.3 : -0.3) * MathX.smooth(s, MG.sCode, MG.sCode + 5); pp.neck = 0.1 * noise1(s * 0.05, i + 9);
        pp.lSh = [0.5, 0.1]; pp.lEl = 1.3; pp.rSh = [0.5, 0.1]; pp.rEl = 1.2; if (i % 3 === 1) { pp.rSh = [0.8, -0.05]; pp.rEl = 2.0; }   // (a phone in her hand: no signal)
        mgPose(p, pp, p.q.x - 0.06, fy + 0.08, p.q.z, Math.PI / 2); });
      // the yokes move by themselves (the autopilot), the screens
      const q = this._plane;
      D.yokes.forEach((y, i) => { y.wheel.rotation.x = -q.roll * 1.2 + 0.02 * Math.sin(s * 0.7 + i); y.rotation.z = -0.03 * Math.sin(s * 0.31); });
      D.levers.forEach((l, i) => { l.rotation.z = i === 0 ? -0.5 * mgFlapAt(s) : 0.6 * mgGearAt(s) * (s > MG.sFlap ? 1 : 0); });
      const land3 = s > MG.sLand3, apOn = (b) => b.material.color.set(land3 || b.userData.i !== 4 ? '#7cff9a' : '#22402a');
      D.ap.forEach(apOn);
      if (m === 'cockpit' || m === 'cockpitDoor' || m === 'fuel' || m === 'cockpitApp' || m === 'flaps' || m === 'land3' || m === 'finalCock') {
        const st = { s: Math.round(s * 4) / 4, alt: q.p[1], spd: q.v, hdg: q.h, pitch: q.pitch * 57.3, roll: q.roll, fuel: MGP.fuel(s), land3, mode: land3 ? 'LOC  G/S  FLARE' : s > MG.sFlap - 30 ? 'LOC*  G/S' : 'LNAV  VNAV', wpt: q.phase === 'hold' || q.phase === 'turn' ? 'HOLD' : 'TOLVA', n1: q.phase === 'cruise' ? 0.86 : 0.62 };
        for (const k of Object.keys(D.screens)) { const sc2 = D.screens[k], what = k.startsWith('pfd') ? 'pfd' : k.startsWith('nd') ? 'nd' : k; if ((Math.round(t * 30) + k.length) % 2 === 0 || m === 'fuel' || m === 'land3') sc2.c.update(Object.assign({ what }, st)); }
      }
    },
    // ---- the tower's two controllers
    tower(s) {
      this.AP.ctl.forEach((p, i) => { const d = p.desk, pose = MG_POSES.desk(); const busy = s > 300;
        pose.mouth = busy ? MathX.clamp(0.5 + 0.5 * Math.sin(s * (5 + i) + i), 0, 1) * (noise1(s * 0.4, i + 3) > -0.2 ? 1 : 0) : 0;
        pose.headYaw = 0.35 * noise1(s * 0.13, i + 5) + (i ? -0.2 : 0.2); pose.neck = -0.05 + 0.1 * noise1(s * 0.11, i + 7);
        if (i === 0) { pose.rSh = [0.9, -0.3]; pose.rEl = 1.9; }                                   // her hand at the headset's mic
        mgPose(p, pose, d.cxp, MG_V.towerH + 0.08, d.czp, mgYaw(d.dx, d.dz)); });
    },
    // ---- your hands for the shot
    handsFor(m, s, t) {
      const H = this.hands, C = MG_CAR, YC = this.YC;
      let r = 'hidden', l = 'hidden';
      const rim = (a) => { const v = new THREE.Vector3(0, Math.sin(a) * C.wheelR, Math.cos(a) * C.wheelR); YC.spin.localToWorld(v); return [v.x, v.y, v.z]; };
      const grabbed = s > MGP.car.sGrab;
      if (m === 'grab' || m === 'hands' || m === 'lorryPOV' || m === 'stopPOV' || m === 'epb') {
        // your left hand: reaching across, then on the rim (its right side, the side nearest you)
        const k = MathX.smooth(s, MGP.car.sGrab - 0.6, MGP.car.sGrab), g = rim(0.25), rest = this.YC.toWorld([0.25, 0.75, 0.25]), w = mgV([rest.x, rest.y, rest.z], g, k);
        if (m !== 'epb') { mgHandTo(H, this.camera, grabbed ? 'gripL' : 'reachL', -1, w, { back: 0.085, N: [-0.6, -0.2, 0.75] }); l = grabbed ? 'gripL' : 'reachL'; }
        // your right hand: on the rim too, or on the parking-brake switch
        if (m === 'hands' || m === 'epb') { const e = this.YC.toWorld([C.epb[0] - 0.01, C.epb[1] + 0.012, C.epb[2]]), pr = s > MGP.car.sBrake - 0.05;
          mgHandTo(H, this.camera, 'press', 1, [e.x, e.y, e.z], { back: 0.135, N: [0, -1, 0.15], curl: pr ? [0.75, 1.3, 1.4, 1.45] : [0.2, 1.3, 1.4, 1.45] }); r = 'press'; }
        else if (s > MGP.car.sBrake + 0.6) { mgHandTo(H, this.camera, 'gripR', 1, rim(-0.6), { back: 0.085, N: [0.5, -0.2, 0.8] }); r = 'gripR'; }
      }
      if (m === 'alertPhone' || m === 'alertRead') r = m === 'alertRead' ? 'phone' : 'phoneLow';
      H.root.visible = r !== 'hidden' || l !== 'hidden';
      H.o.script = { right: [[-9, r]], left: [[-9, l]] };
      if (H.root.visible) H.update(t);
      this.myPhone.visible = r.startsWith('phone');
      if (this.myPhone.visible) this.MYP.update({ s: Math.floor(s), what: s > MG_AT(9, 31, 3) ? 'alert' : 'lock', bars: 1 });
    },
    // ---- the sparks: the lorry along the barrier; the drifting cars; their light
    sparks(s, m) {
      const fx = this.fx, LR = this.LR, sp = MGP.lorrySparks(s), cam = this.camera.position;
      if (sp > 0) {
        const [cx, cy, cz] = LR.contact, v = MGP.lorryV(s);
        for (let i = 0; i < 260; i++) { const life = 0.35 + 0.35 * mgR(i, 41), ph = ((s / life + mgR(i, 42)) % 1 + 1) % 1, u = ph * life;
          const vx = -(0.25 * v + 6 * mgR(i, 43)), vy = 1.2 + 3.2 * mgR(i, 44), vz = -(0.5 + 2.5 * mgR(i, 45)) * (mgR(i, 46) < 0.3 ? -1 : 1);
          for (let k = 0; k < 3; k++) { const w = Math.max(0, u - k * 0.012); fx.add(cx + vx * w + v * w * 0.0, cy + vy * w - 4.9 * w * w, cz + vz * w, (0.05 + 0.03 * mgR(i, 47)) * (1 - 0.25 * k), 0.95 * sp * (1 - ph) * (1 - 0.3 * k), 1, 0.7 - 0.12 * k, 0.3 - 0.08 * k); } }
        this.sparkL.position.set(cx - 0.6, cy + 0.4, cz - 0.3); this.sparkL.intensity = 22 * sp * (0.6 + 0.4 * Math.sin(s * 91) * Math.sin(s * 37));
      }
      for (const [x, y, z, v] of this.TR.sparks) for (let i = 0; i < 70; i++) { const life = 0.3 + 0.3 * mgR(i, 71), ph = ((s / life + mgR(i, 72)) % 1 + 1) % 1, u = ph * life;
        fx.add(x - (0.3 * v + 4 * mgR(i, 73)) * u * Math.sign(x), y + (1 + 2.5 * mgR(i, 74)) * u - 4.9 * u * u, z + (mgR(i, 75) - 0.5) * 2 * u, 0.045, 0.9 * Math.min(1, v / 6) * (1 - ph), 1, 0.72, 0.32); }
      void cam; void m;
    },
    // ---- the kitchen fires: each house's smoke (from its s0), a window glowing
    fires(s) {
      const sm = this.smoke, P = this.camera.position;
      for (const f of this.town.fires) {
        const on = MathX.smooth(s, f.s0, f.s0 + 240); f.glow.material.opacity = 0.85 * on * (0.75 + 0.25 * Math.sin(s * 7 + f.x));
        if (on <= 0) continue;
        const n = Math.round(46 * f.big);
        for (let i = 0; i < n; i++) { const life = 70 + 50 * mgR(i, 81), ph = ((s / life + mgR(i, 82)) % 1 + 1) % 1, a = ph * life;
          const h = 6 + a * 1.4 * (0.8 + 0.4 * mgR(i, 83)), wind = a * 0.9;
          const x = f.x + wind * 1.0 + 4 * Math.sin(a * 0.05 + i), z = f.z - wind * 0.35 + 4 * Math.cos(a * 0.04 + i * 2), y = f.y + h;
          const sz = (3 + a * 0.55) * f.big, dk = 0.18 + 0.32 * ph, dist = Math.hypot(x - P.x, y - P.y, z - P.z);
          sm.add(x, y, z, sz, 0.55 * on * (1 - ph) * Math.min(1, ph * 12) * MathX.clamp((dist - sz) / (2 * sz), 0, 1), dk, dk, dk * 1.04); }
      }
    },
    // ---- the coffee (7:42:00.3: the cup lands on the seat; the coffee splashes, in slow motion)
    coffee(s, m) {
      if (!INSIDE.has(m)) return;
      const sl = this.YC.sLand; if (!(s > sl && s < sl + 1.0)) return;
      const c = this.YC.cup.position;
      for (let i = 0; i < 40; i++) { const u = s - sl - 0.05 * mgR(i, 91); if (u < 0) continue; const a = mgR(i, 92) * 6.283, sp = 0.4 + 0.9 * mgR(i, 93);
        const lp = new THREE.Vector3(c.x + Math.cos(a) * sp * u * 0.5, c.y + 0.02 + sp * u * 1.2 - 4.9 * u * u, c.z + Math.sin(a) * sp * u * 0.5);
        if (lp.y < 0.575) continue; this.YC.inn.localToWorld(lp); this.smoke.add(lp.x, lp.y, lp.z, 0.006 + 0.004 * mgR(i, 94), 0.9, 0.16, 0.09, 0.05); }
    },
    // ---- flight 2207's contrail at 11,000 m (two trails from the engines, widening, fading)
    contrail(s, m) {
      if (s > 650 || !(m === 'skyUp' || m === 'planeExt' || m === 'planeMap')) return;
      const sm = this.smoke, A = this.A;
      for (let k = 0; k < 150; k++) { const age = 0.6 + k * 0.9, q = mgPlaneAt(s - age); if (q.phase !== 'cruise') continue;
        for (const sd of [-1, 1]) { const off = new THREE.Vector3(-3, -1.9, sd * 5.6), x = q.p[0] - Math.sin(q.h) * 0 + off.z * Math.cos(q.h) * 0, sp = (6 + age * 1.1);
          // (behind the plane along its path: the path itself carries the trail; the engines' spacing at the start)
          const fwd = [Math.sin(q.h), 0, -Math.cos(q.h)], rt = [Math.cos(q.h), 0, Math.sin(q.h)];
          sm.add(q.p[0] + rt[0] * sd * 5.6 * Math.exp(-age / 30) + fwd[0] * -3, q.p[1] - 1.9 + age * 0.05, q.p[2] + rt[2] * sd * 5.6 * Math.exp(-age / 30) + fwd[2] * -3, sp, 0.6 * Math.min(1, age / 2) * (1 - age / 140), 0.96, 0.97, 1.0); void x; void off; } }
      void A;
    },
    // ---- the tyres' smoke at touchdown
    tyres(s) {
      const a = s - MG.sTD; if (a < 0 || a > 6) return;
      const R = MG_V.runway;
      for (let i = 0; i < 70; i++) { const life = 2.5 + 2 * mgR(i, 101), ph = a / life; if (ph > 1) continue; const sd = i % 2 ? 1 : -1, zz = MG_FL.zTD + 18 * mgR(i, 102);
        this.smoke.add(R.x + sd * (2.9 + 2.5 * ph) + (mgR(i, 103) - 0.5) * 3 * ph, 0.6 + 2.2 * ph, zz + 10 * ph, 1.0 + 4 * ph, 0.55 * (1 - ph), 0.82, 0.82, 0.84); }
    },
    labels(t) { return mgWorldLabels(this, t); },
    grade(t, p, shot) {
      p.exposure = this._v && this._v.expo ? this._v.expo : 1.0; p.saturation = 0.98; p.contrast = 1.06; p.warmth = 0.02; p.blackLift = 0.006;
      p.vignette = 0.5; p.bloom = 0.32; p.bloomThreshold = 0.9; p.grain = 0.026;
      void t; void shot;
    },
  };
  return set;
};

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, near, far, drift, fogD, sh (the shadow's centre), shR, shake, expo }.
// World axes: x east, y up, z south. The deck: y 42, the eastbound lanes z 2.3 / 6.0 / 9.7, the shoulder 12.6; your
// car stops at x 95 (z 6.1), the lorry at x 108.7 across the fast and middle lanes. The runway: x 600, z 1800…4800.
// ---------------------------------------------------------------------------------------------------------------------
function mgWorldCam(set, m, s, t, k, v) {
  const E = Ease.inOutSine, into = (a, b) => mgV(a, b, E(k)), Y = MG_V.deckY, YC = set.YC, P = MGP;
  const CL = (p) => { const w = YC.toWorld(p); return [w.x, w.y, w.z]; };
  const AL = (p) => { const w = new THREE.Vector3(p[0], p[1], p[2]); set.A.localToWorld(w); return [w.x, w.y, w.z]; };
  const LL = (p) => { const w = new THREE.Vector3(p[0], p[1], p[2]); set.LR.G.localToWorld(w); return [w.x, w.y, w.z]; };
  const fy = MG_PL.floorY, eye = MG_CAR.eye, cx = P.carX(s), lx = P.lorryX(s), T = MG_V.tower, H = MG_V.towerH, R = MG_V.runway;
  const gy = (x, z) => mgGroundY(x, z);
  const inCar = (p, at, fov) => { v.p = CL(p); v.at = CL(at); v.fov = fov; v.near = 0.04; v.far = 30000; v.drift = 0.004; v.sh = CL([0, 1, 0]); v.shR = 8; };
  const inPlane = (p, at, fov) => { v.p = AL(p); v.at = AL(at); v.fov = fov; v.near = 0.04; v.far = 40000; v.drift = 0.004; v.sh = AL([10, 0, 0]); v.shR = 26; v.fogD = 0.00005; };
  set.YC.car.updateMatrixWorld(true); set.LR.G.updateMatrixWorld(true);
  switch (m) {
    // ---- 7:42:00: in the car (you sit on the right; your dad drives)
    case 'title': inCar(into([eye[0] - 0.1, eye[1] + 0.01, eye[2] + 0.1], [eye[0] - 0.08, eye[1] + 0.015, eye[2] + 0.08]), [0.42, 1.08, -0.62], 62); break;   // (your dad on the left, the road on the right)
    case 'empty': inCar(into([eye[0], eye[1] - 0.02, eye[2] - 0.04], [eye[0] + 0.04, eye[1] - 0.05, eye[2] - 0.1]), [0.2, 0.74, -0.32], 56); break;
    case 'ext1': v.p = into([cx - 150, Y + 40, 150], [cx - 120, Y + 36, 132]); v.at = [cx + 30, Y - 4, 0]; v.fov = 42; v.near = 1; v.sh = [cx, Y, 0]; v.shR = 120; break;
    case 'cluster': inCar(into([0.0, 1.13, 0.1], [0.04, 1.12, 0.05]), [0.8, 0.93, -0.38], 36); break;
    case 'grab': inCar(eye, [4, 1.05, -0.12], 62); break;
    case 'hands': inCar([eye[0] + 0.02, eye[1] - 0.02, eye[2] - 0.03], [0.6, 0.66, 0.0], 60); break;
    case 'epb': inCar(into([0.02, 0.98, 0.26], [0.04, 0.96, 0.22]), [MG_CAR.epb[0] + 0.05, MG_CAR.epb[1], MG_CAR.epb[2] - 0.02], 42); break;
    case 'lorryPOV': inCar(eye, [6, 1.06, -0.25], 62); v.shake = 0.002 * Math.min(1, P.carDecel(s) / 3); break;
    case 'lorryExt': { const h = P.lorryX(P.lorry.sHit) + 8; v.p = [h + 26, Y + 1.05, -2.4]; v.at = [h - 2, Y + 1.2, 0.8]; v.fov = 40; v.near = 0.2; v.sh = [h, Y, 0]; v.shR = 30; v.drift = 0.01; break; }
    case 'cabIn': v.p = LL(into([7.35, 2.85, -2.75], [7.2, 2.8, -2.6])); v.at = LL([6.95, 2.25, -0.62]); v.fov = 46; v.near = 0.1; v.sh = LL([6, 0, 0]); v.shR = 14; v.drift = 0.006; break;
    case 'cabWide': v.p = into([cx - 22, Y + 8, 12], [cx - 18, Y + 7.2, 11]); v.at = [lx + 2, Y + 1, 2.6]; v.fov = 46; v.near = 0.3; v.sh = [cx + 10, Y, 4]; v.shR = 30; break;
    case 'stopPOV': inCar(eye, [6, 1.12, -0.1], 60); break;
    case 'carsWide': v.p = into([cx - 80, Y + 46, 48], [cx - 40, Y + 44, 46]); v.at = [cx + 140, Y, -3]; v.fov = 50; v.near = 1; v.sh = [cx + 60, Y, 0]; v.shR = 120; break;
    case 'carsNew': { const c = MG_TRAFFIC.place(MG_TRAFFIC.heroNew, s); v.p = [158, Y + 1.5, -13.2]; v.at = [c.x + 1, Y + 0.8, c.z]; v.fov = 36; v.near = 0.2; v.sh = [165, Y, -8]; v.shR = 30; v.drift = 0.006; break; }
    case 'carsOld': { const c = MG_TRAFFIC.place(MG_TRAFFIC.heroOld, s); v.p = [122, Y + 1.55, 11.6]; v.at = [c.x + 3, Y + 0.7, 14.6]; v.fov = 42; v.near = 0.2; v.sh = [140, Y, 12]; v.shR = 30; v.drift = 0.006; break; }
    // ---- real speed: the radio, the gantry, his phone
    case 'radio': inCar(into([0.0, 1.12, 0.28], [0.03, 1.1, 0.24]), [0.708, 0.72, 0.0], 40); break;
    case 'gantry': v.p = into([262, Y + 1.7, 13.4], [266, Y + 1.75, 13.2]); v.at = [330, Y + 5.6, 6]; v.fov = 50; v.near = 0.2; v.sh = [300, Y, 6]; v.shR = 50; break;
    case 'phone': { const ph = YC.phone.position; inCar(into([ph.x - 0.42, ph.y + 0.62, ph.z + 0.36], [ph.x - 0.36, ph.y + 0.55, ph.z + 0.3]), [ph.x, ph.y, ph.z], 38); break; }
    // ---- the train, the barge
    case 'trainHigh': { const f = P.trainZ(s); v.p = into([152, Y + 1.55, -17.6], [151, Y + 1.5, -17.6]); v.at = [MG_V.railX, MG_RAIL.y + 2, f - 30]; v.fov = 34; v.near = 0.3; v.sh = [MG_V.railX, 0, f - 40]; v.shR = 70; break; }
    case 'trainCab': { const f = P.trainZ(s); v.p = into([MG_V.railX + 2.3, MG_RAIL.y + 3.05, f - 0.9], [MG_V.railX + 2.0, MG_RAIL.y + 3.0, f - 1.05]); v.at = [MG_V.railX - 0.5, MG_RAIL.y + 2.4, f - 1.5]; v.fov = 50; v.near = 0.1; v.sh = [MG_V.railX, 0, f - 3]; v.shR = 14; v.drift = 0.006; break; }
    case 'barge': { const b = P.bargeBow(s); v.p = into([22, Y + 1.55, 17.6], [21, Y + 1.5, 17.6]); v.at = [10, -1, b - 18]; v.fov = 40; v.near = 0.3; v.sh = [14, 0, b - 40]; v.shR = 70; break; }
    case 'bargeHit': { const b = P.bargeBow(s), x0 = 64, z0 = 478; v.p = [x0, gy(x0, z0) + 1.7, z0]; v.at = [12, 0.5, Math.min(b, 440) - 12]; v.fov = 46; v.near = 0.3; v.sh = [20, 0, 420]; v.shR = 60; v.drift = 0.01; break; }
    // ---- flight 2207 at 11,000 m (7:43)
    case 'skyUp': { const q = set._plane; v.p = [cx + 4, Y + 1.6, 10.5]; v.at = [q.p[0] + 120, q.p[1], q.p[2] + 260]; v.fov = mgLerp(34, 7, Ease.inOutSine(MathX.clamp(k * 1.6 - 0.2, 0, 1))); v.near = 0.5; v.far = 60000; v.drift = 0.003; v.fogD = 0.00003; v.sh = [cx, Y, 8]; v.shR = 40; break; }
    case 'cockpit': inPlane([13.25, fy + 1.32, 0.0], [16.2, fy + 1.05, 0.0], 64); break;
    case 'planeExt': v.p = AL(into([-34, 7, 30], [-30, 6, 27])); v.at = AL([4, 0, 0]); v.fov = 40; v.near = 0.5; v.far = 60000; v.fogD = 0.00003; v.sh = AL([0, 0, 0]); v.shR = 30; v.drift = 0.05; break;
    case 'planeMap': v.p = AL(into([16, -12, -40], [12, -11, -36])); v.at = AL([-6, 0, 0]); v.fov = 44; v.near = 0.5; v.far = 60000; v.fogD = 0.00003; v.sh = AL([0, 0, 0]); v.shR = 30; v.drift = 0.05; break;
    case 'cabinAisle': inPlane([-7.5, fy + 1.55, 0.05], [12.6, fy + 1.25, -0.1], 46); break;
    case 'keypad': inPlane(into([11.4, fy + 1.62, -1.22], [11.55, fy + 1.6, -1.18]), [12.35, fy + 1.32, -0.5], 46); break;
    case 'cabinPax': inPlane(into([11.6, fy + 1.62, 0.2], [11.4, fy + 1.6, 0.15]), [-12, fy + 0.75, -0.3], 52); break;
    case 'doorWait': inPlane(into([10.9, fy + 1.5, 0.95], [11.1, fy + 1.5, 0.9]), [12.3, fy + 1.45, -0.4], 42); break;
    case 'cockpitDoor': inPlane([15.55, fy + 1.4, 0.5], [12.5, fy + 1.15, -0.35], 60); break;
    case 'fuel': inPlane(into([14.45, fy + 1.32, -0.1], [14.6, fy + 1.25, -0.05]), [15.665, fy + 0.86, 0.15], 30); break;
    case 'cabinHalf': inPlane(into([10.6, fy + 1.86, 0.55], [10.2, fy + 1.84, 0.5]), [3.0, fy + 0.35, -0.7], 52); break;
    // ---- the tower
    case 'towerExt': v.p = into([900, 1.8, 2905], [905, 2.0, 2910]); v.at = [T[0], H + 1, T[2]]; v.fov = 46; v.near = 0.3; v.sh = [T[0], 20, T[2]]; v.shR = 60; break;
    case 'towerIn': v.p = into([T[0] + 3.4, H + 1.78, T[2] + 1.0], [T[0] + 3.0, H + 1.74, T[2] + 0.7]); v.at = [T[0] - 4.0, H + 1.0, T[2] - 0.3]; v.fov = 58; v.near = 0.1; v.sh = [T[0], H, T[2]]; v.shR = 10; v.drift = 0.006; break;
    // ---- the town (7:51), the hospital (8:04)
    case 'town': v.p = into([-236, Y + 1.6, 17.8], [-240, Y + 1.62, 17.8]); v.at = [-900, 28, 1100]; v.fov = 46; v.near = 0.3; v.sh = [-600, 0, 700]; v.shR = 500; break;
    case 'house': { const f = set.town.fires[0]; v.p = into([f.x + 34, gy(f.x + 34, f.z + 26) + 1.7, f.z + 26], [f.x + 32, gy(f.x + 32, f.z + 24) + 1.7, f.z + 24]); v.at = [f.x, f.y + 4, f.z]; v.fov = 48; v.near = 0.3; v.sh = [f.x, f.y, f.z]; v.shR = 60; break; }
    case 'townHigh': v.p = into([260, 190, 260], [240, 186, 300]); v.at = [-1100, 0, 1500]; v.fov = 50; v.near = 1; v.sh = [-800, 0, 1200]; v.shR = 900; break;
    case 'hospital': { const [x, , z] = MG_V.hospital; v.p = into([x + 74, gy(x + 74, z - 64) + 1.7, z - 64], [x + 70, gy(x + 70, z - 60) + 1.7, z - 60]); v.at = [x + 5, 9, z]; v.fov = 52; v.near = 0.3; v.sh = [x, 0, z]; v.shR = 80; break; }
    // ---- 9:10: walking home; 9:31: the alert
    case 'walkDeck': v.p = into([36, Y + 1.6, 12.1], [38, Y + 1.6, 12.0]); v.at = [110, Y + 1.2, 11.4]; v.fov = 44; v.near = 0.2; v.sh = [70, Y, 8]; v.shR = 50; break;
    case 'walkLong': v.p = [-220, Y + 3.0, 14.8]; v.at = [420, Y + 0.5, 5]; v.fov = 16; v.near = 0.5; v.sh = [100, Y, 6]; v.shR = 200; v.drift = 0.004; break;
    case 'walkPOV': v.p = [97.5, Y + 1.62, 11.1]; v.at = into([60, Y + 1.25, 12.8], [70, Y + 1.25, 13.2]); v.fov = 56; v.near = 0.05; v.sh = [90, Y, 10]; v.shR = 30; v.drift = 0.01; break;
    case 'alertPhone': case 'alertRead': v.p = [97.5, Y + 1.62, 11.1]; v.at = [80, Y + 0.4, 12.6]; v.fov = m === 'alertRead' ? 38 : 56; v.near = 0.03; v.sh = [90, Y, 10]; v.shR = 30; v.drift = 0.005; break;
    case 'leaders': v.p = into([-160, gy(-160, 170) + 1.7, 170], [-150, gy(-150, 165) + 1.7, 165]); v.at = [240, 34, 0]; v.fov = 52; v.near = 0.3; v.sh = [0, 20, 60]; v.shR = 200; break;
    // ---- 9:47: the hold; the radar; the stacks
    case 'hold': v.p = AL(into([-26, 5, -24], [-22, 4, -21])); v.at = AL([6, 0, 0]); v.fov = 42; v.near = 0.5; v.far = 50000; v.fogD = 0.00008; v.sh = AL([0, 0, 0]); v.shR = 30; v.drift = 0.04; break;
    case 'radar': { const r = set.AP.radarMesh.position, d = set.AP.desks[4]; v.p = into([r.x - d.dx * 0.95 + d.dz * 0.15, r.y + 0.12, r.z - d.dz * 0.95 - d.dx * 0.15], [r.x - d.dx * 0.8 + d.dz * 0.1, r.y + 0.08, r.z - d.dz * 0.8 - d.dx * 0.1]); v.at = [r.x, r.y, r.z]; v.fov = 42; v.near = 0.05; v.sh = [T[0], H, T[2]]; v.shR = 10; v.drift = 0.004; break; }
    case 'ctl': { const p = set.AP.ctl[0], d = p.desk, hd = [d.cxp, H + 1.25, d.czp]; v.p = [hd[0] + d.dx * 0.9 - d.dz * 0.9, H + 1.45, hd[2] + d.dz * 0.9 + d.dx * 0.9]; v.at = hd; v.fov = 40; v.near = 0.05; v.sh = [T[0], H, T[2]]; v.shR = 10; v.drift = 0.004; break; }
    case 'stack': v.p = into([cx + 4, Y + 1.6, -14], [cx + 4, Y + 1.6, -14]); v.at = into([700, 2400, -7000], [500, 2600, -7600]); v.fov = 54; v.near = 0.5; v.far = 50000; v.fogD = 0.00006; v.sh = [cx, Y, -10]; v.shR = 40; break;
    // ---- 10:14: the autoland
    case 'cockpitApp': inPlane(into([14.0, fy + 1.3, 0.78], [14.1, fy + 1.28, 0.72]), [14.75, fy + 1.0, -0.6], 54); break;
    case 'flaps': inPlane(into([14.45, fy + 1.42, 0.42], [14.5, fy + 1.38, 0.36]), [15.05, fy + 0.86, -0.02], 40); break;
    case 'towerRead': { const p = set.AP.ctl[0], d = p.desk; v.p = [d.cxp - d.dx * 0.9, H + 1.6, d.czp - d.dz * 0.9]; v.at = [d.cxp + d.dx * 6, H + 1.2, d.czp + d.dz * 6]; v.fov = 56; v.near = 0.05; v.sh = [T[0], H, T[2]]; v.shR = 10; v.drift = 0.005; break; }
    case 'land3': inPlane(into([15.05, fy + 0.98, -0.9], [15.15, fy + 0.95, -0.91]), [15.665, fy + 0.86, -0.92], 26); break;
    // ---- 10:21: the landing
    case 'finalVia': { const q = set._plane, c0 = [R.x - 30, Y + 1.55, 13.4], el = Math.min(Math.atan2(q.p[1] - c0[1], Math.max(1, c0[2] - q.p[2])), 0.62); v.p = c0; v.at = [R.x - 30 + 12 * Math.cos(el) * 0.1, c0[1] + 100 * Math.sin(el), c0[2] - 100 * Math.cos(el)]; v.fov = 58; v.near = 0.3; v.sh = [R.x - 20, Y, 8]; v.shR = 40; v.drift = 0.008; break; }
    case 'finalCock': inPlane([13.95, fy + 1.5, -0.12], [24, fy + 0.6, 0], 62); break;
    case 'finalTower': { const q = set._plane; v.p = [T[0] - 0.6, H + 1.72, T[2] + 0.7]; v.at = mgV([T[0] - 2.8, H + 1.2, T[2] - 1.9], [q.p[0], q.p[1], q.p[2]], 0.5 + 0.5 * Ease.inOutSine(MathX.clamp(k * 2, 0, 1))); v.fov = 38; v.near = 0.2; v.sh = [T[0], H, T[2]]; v.shR = 14; v.drift = 0.003; break; }
    case 'touchdown': { const q = set._plane; v.p = [R.x + 46, 1.5, MG_FL.zTD + 70]; v.at = [q.p[0], q.p[1] + 1.5, q.p[2]]; v.fov = 34; v.near = 0.5; v.sh = [R.x, 0, MG_FL.zTD + 60]; v.shR = 90; v.drift = 0.004; break; }
    case 'question': v.p = into([R.x - 24, Y + 1.5, 12.4], [R.x - 24, Y + 1.5, 12.4]); v.at = into([R.x - 80, Y + 300, -900], [R.x - 120, Y + 1400, -3000]); v.fov = 56; v.near = 0.3; v.far = 50000; v.fogD = 0.00008; v.sh = [R.x, Y, 8]; v.shR = 40; v.drift = 0.004; break;
  }
  void lx; void into;
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function mgWorldLabels(set, t) {
  const shot = mgShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = set._s;
  const lab = (p, text, sub, a0 = 0.8, side) => out.push({ p, text, sub, a: W(t, shot.t0 + a0, shot.t1 - 0.25, 0.35, 0.3), side });
  if (m === 'cabIn') { const w = new THREE.Vector3(6.95, 2.3, -0.62); set.LR.G.localToWorld(w); lab([w.x, w.y, w.z], 'THE DRIVER’S SEAT', 'empty', 1.0); }
  if (m === 'trainCab') lab([MG_V.railX - 0.55, MG_RAIL.y + 2.3, MGP.trainZ(s) - 1.6], 'THE SAFETY PEDAL', 'released: the brakes come on', 1.0);
  if (m === 'carsNew') { const c = MG_TRAFFIC.place(MG_TRAFFIC.heroNew, s); lab([c.x, MG_V.deckY + 1.9, c.z], 'NO ONE STEERING', 'it brakes itself, hazards on', 0.8, 'r'); }
  if (m === 'carsOld') { const c = MG_TRAFFIC.place(MG_TRAFFIC.heroOld, s); lab([c.x, MG_V.deckY + 1.8, c.z], 'NO ASSISTANT', 'it drifts until it hits', 0.8); }
  if (m === 'skyUp') { const q = set._plane; lab([q.p[0], q.p[1], q.p[2]], 'FLIGHT 2207', '11,000 m up', 1.0); }
  if (m === 'keypad') { const w = new THREE.Vector3(12.42, MG_PL.floorY + 1.25, -0.72); set.A.localToWorld(w); lab([w.x, w.y, w.z], 'EMERGENCY ACCESS', 'opens after 30 s', 1.2, 'r'); }
  if (m === 'towerExt') lab([MG_V.tower[0], MG_V.towerH + 4.5, MG_V.tower[2]], 'THE CONTROL TOWER', '2 of 9 controllers left', 1.0);
  if (m === 'barge') lab([MGP.barge.x, 3, MGP.bargeBow(s) - 40], 'BARGE ON AUTOPILOT', 'heading held: 180°', 1.0);
  if (m === 'hospital') lab([MG_V.hospital[0] + 30, 19, MG_V.hospital[2] - 13], 'THE HOSPITAL', 'maternity ward, 2nd floor', 1.0);
  if (m === 'hold') { const q = set._plane; lab([q.p[0], q.p[1] + 6, q.p[2]], 'FLIGHT 2207', 'circling at 1,200 m', 1.0, 'r'); }
  if (m === 'finalVia' || m === 'finalTower') { const q = set._plane; lab([q.p[0], q.p[1] + 8, q.p[2]], 'FLIGHT 2207', 'landing itself', 1.0, 'r'); }
  return out;
}
