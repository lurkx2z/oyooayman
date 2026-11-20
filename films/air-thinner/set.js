/* =====================================================================
   SET — the one world of the film: the open Atlantic, the cruise ship, the people on it, and the sea under it. Every
   shot's mode picks a camera here (set.cams) and the frame is a pure function of film time t (story time s from
   clock.js). The ship is the frame of reference: it stays put and the sea runs past it (its speed: physics.js ATV).
     what changes with s: the air (sky, sun, light, sound), the people (breathing hard, then still), the balloon, the
     things that swell, the drinks, the funnel's smoke, the power, the hot tubs / pool / sea boiling, you two below
   ===================================================================== */

// the shots under water (the camera below the surface)
const AT_UNDER = new Set(['underEst', 'lineUW', 'sink', 'pair', 'breathe', 'upHull', 'fish', 'sharkIn', 'circle', 'letGo', 'kick', 'catch', 'calm', 'ceiling', 'tankClose', 'up', 'question']);

// ---- who is where (pure functions of s) --------------------------------------------------------------------------
const AT_WHO = (() => {
  const E = ATE, F = AT_F, y15 = F.deck(15) + 0.03;
  const W = {
    y15,
    girl0: [-16.0, 4.95], you0: [38.0, 16.45],
    // (each of you has a right hand on the line: these roots put the hands of the 'hang' poses on the rope, hers 0.2 m lower)
    pairYou: [F.line.x + 0.50, -F.depth - 1.25, F.line.z + 0.04], pairHer: [F.line.x - 0.245, -F.depth - 1.12, F.line.z - 0.305],
    poolOut: atHMS(10, 41),                         // the swimmers get out (nobody sees the pool again until it's empty)
    oldDown: atHMS(10, 58), wifeDown: atHMS(11, 14),
    stair: { k: 11, step: 9 },                      // the girl sits on flight 11 (deck 12 → 11), step 9 of 16
  };
  // a crowd member's moment of passing out (pure, seeded): between 11:03 and 11:44
  W.fade = (i) => atHMS(11, 3) + Math.floor(atR(i, 31) * 41 * 60);
  // the girl's depth under water, her rise after she lets go, your chase, the catch, back down
  W.her = (s) => {
    const p = W.pairHer, top = AT_F.line;
    if (s < E.roll) return null;
    if (s < E.deep) { const u = atEase(s, E.roll, E.deep); return [p[0] + 0.4 * (1 - u), MathX.lerp(-1.1, p[1], Math.pow(u, 0.8)), p[2] - 0.5 * (1 - u)]; }
    if (s < E.letGo) return p;
    const rise = Math.min(s, E.catch) - E.letGo, back = s > E.catch ? atEase(s, E.catch + 1.2, E.catch + 24) : 0;
    const up = 0.45 * rise - 0.04 * rise * rise * 0.0;
    return [p[0] + 0.25 * Math.min(1, rise / 3), p[1] + up * (1 - back), p[2] - 0.6 * Math.min(1, rise / 4) * (1 - back)];
    void top;
  };
  W.you = (s) => {
    const p = W.pairYou;
    if (s < E.roll) return null;
    if (s < E.deep) { const u = atEase(s, E.roll, E.deep); return [p[0] + 0.5 * (1 - u), MathX.lerp(-1.5, p[1], Math.pow(u, 0.8)), p[2] + 0.3 * (1 - u)]; }
    const go = E.letGo + 1.6;
    if (s < go) return p;
    const h = W.her(Math.min(s, E.catch)), tc = Math.min(s, E.catch), u = atEase(tc, go, E.catch);
    // you kick up after her: your hand reaches her fin at the catch (her feet ~1.3 m under her chest, your hand ~2.2 m over your feet)
    // (measured: these offsets put your reaching hand on her right foot at the catch)
    const yc = MathX.lerp(p[1], h[1] - 1.9, u), back = s > E.catch ? atEase(s, E.catch + 1.2, E.catch + 24) : 0;
    return [MathX.lerp(p[0], h[0] - 0.37, u), MathX.lerp(yc, p[1], back), MathX.lerp(p[2], h[2] + 0.04, u * (1 - back))];
  };
  return W;
})();

function atShipSet(app) {
  const F = AT_F, E = ATE, D = F.deck, W = AT_WHO, y15 = W.y15;
  const o = atSet(app, { sky: '#6f9fd6', fog: 0.00009, fogColor: '#a9c4e0', fov: 50, near: 0.05, far: 9000, hemi: ['#9cc2ee', '#8a7a64', 0.9],
    sun: [100, 300, 50], sunColor: '#fff4e2', sunI: 2.6, shadow: 2048, shadowR: 40, shadowFar: 900 });
  const { scene, camera, sun, hemi } = o;
  const set = { scene, camera, sun, hemi, _s: 0 };
  scene.background = new THREE.Color('#000000');
  const airFog = scene.fog, sea0 = new THREE.FogExp2('#0a2f4a', 0.03);
  scene.environment = atEnv(app.renderer, '#4a7ab8', '#bcd2e8', '#2a4a66');
  // ---- the world
  const sky = atSky(scene), sea = atSea(scene);
  const ship = atShip(set), deck = atDeck(set, ship), line = atTankLine(set);
  const shark = atShark(scene), fish = atFish(scene, 260);
  set.ship = ship; set.deck = deck;
  // ---- the people
  const you = atPerson('atYou', scene, { id: 'y', legs: 'skin' }), youS = atPerson('atYouSuit', scene, { id: 'ys' });
  const girl = atPerson('atGirl', scene, { id: 'g', kid: 0.74, legs: 'skin' }), girlS = atPerson('atGirlSuit', scene, { id: 'gs', kid: 0.74, legs: 'skin' });
  // (real faces for the people seen close; before the dive gear goes on over them)
  atFace(you, { seed: 3, iris: [70, 52, 34], jaw: 0.28, lip: '#9a6052' }); atFace(youS, { seed: 3, iris: [70, 52, 34], jaw: 0.28, lip: '#9a6052' });
  atFace(girl, { seed: 11, iris: [92, 70, 40], jaw: 0.33, nose: 0.016, lip: '#c07a6c' }); atFace(girlS, { seed: 11, iris: [92, 70, 40], jaw: 0.33, nose: 0.016, lip: '#c07a6c' });
  const gearY = atDiveGear(youS, { finCol: '#1a1d22' }), gearG = atDiveGear(girlS, { finCol: '#f2c21a' });
  const old = atPerson('atOld', scene, { id: 'o', legs: 'skin' }), wife = atPerson('atWife', scene, { id: 'w' }), barman = atPerson('atBarman', scene, { id: 'b' });
  const officer = atPerson('atOfficer', scene, { id: 'of' }); atFace(officer, { seed: 17, iris: [60, 50, 40], jaw: 0.27 }); const ofMask = atO2Mask(officer);
  const jaw = atPerson('atJaw', scene, { id: 'j', legs: 'skin', arms: 'skin' });
  atFace(jaw, { seed: 5, iris: [80, 100, 120], jaw: 0.26, stubble: true }); atFace(old, { seed: 9, iris: [90, 90, 80], jaw: 0.24, nose: 0.025, brow: '#cfc8bc', lip: '#a07068' }); atFace(wife, { seed: 13, iris: [70, 90, 110], jaw: 0.3, brow: '#b8aea0', lip: '#b06a64' });
  set.cast = { you, youS, girl, girlS, old, wife, barman, officer, jaw };
  // the crowd round the pool: [kind, where, look]
  const seats = deck.seats, near = (x, z) => seats.reduce((b, q) => (Math.hypot(q.x - x, q.z - z) < Math.hypot(b.x - x, b.z - z) ? q : b), seats[0]);
  const crowdPlan = [
    ['pool', [-20.0, -2.0]], ['pool', [-18.4, 1.4]], ['pool', [-15.8, -2.6]], ['pool', [-12.4, -0.8]], ['pool', [-10.6, 2.4]], ['pool', [-14.0, 2.5]],
    ['seat', near(-16.6, 6.3)], ['seat', near(-15.6, 6.3)], ['seat', near(-19.3, 6.3)], ['seat', near(-10.2, 6.3)], ['seat', near(-17.4, -6.3)], ['seat', near(-11.1, -6.3)],
    ['seat', near(-30.0, 11.6)], ['seat', near(-26.2, 11.6)], ['seat', near(-6.0, 11.6)], ['seat', near(-22.0, -11.6)], ['seat', near(-4.0, -11.6)], ['seat', near(-44, 11.6)],
    ['stool', [27.8, 2.75]], ['stool', [30.0, 2.75]], ['stool', [31.1, -2.75]],
    ['rail', [-34.0, 16.55]], ['rail', [-33.2, 16.55]], ['rail', [-8.0, -16.55]],
  ];
  const crowd = crowdPlan.map(([kind, w], i) => ({ kind, w, i, P: atPerson(AT_CROWD_LOOKS[i % AT_CROWD_LOOKS.length], scene, { id: 'c' + i, legs: 'skin', arms: LOOKS[AT_CROWD_LOOKS[i % AT_CROWD_LOOKS.length]].shirt === AT_SKIN(LOOKS[AT_CROWD_LOOKS[i % AT_CROWD_LOOKS.length]].skin) ? 'skin' : undefined }), tf: W.fade(i) }));
  const usedSeats = new Set(crowd.filter((c) => c.kind === 'seat').map((c) => c.w));
  const oldSeat = near(-13.0, -6.3), wifeSeat = near(oldSeat.x + 0.92, oldSeat.z); usedSeats.add(oldSeat); usedSeats.add(wifeSeat);
  // he sits up on his lounger's foot end (facing the pool); she kneels beside him, facing him
  const OM = (() => { const f = [Math.sin(oldSeat.yaw), Math.cos(oldSeat.yaw)], o = [oldSeat.x - f[0] * 0.82, oldSeat.z - f[1] * 0.82], w = [oldSeat.x + 0.62, oldSeat.z - f[1] * 1.3];
    return { f, o, w, oy: oldSeat.yaw + ATPI, wy: Math.atan2(o[0] - w[0], o[1] - w[1]) }; })();
  // everyone else on the deck: simple figures lying on the loungers (instanced; they never move): a head and hair, a
  // torso (bare or a swimsuit), the hips in a swimsuit, two arms at the sides, two legs
  { const fr = new RNG(77), list = seats.filter((q) => !usedSeats.has(q) && fr.next() < 0.42), n = list.length;
    const I = (geo, mat, cnt = n) => { const m = new THREE.InstancedMesh(geo, mat, cnt); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
    const torso = I(new THREE.CapsuleGeometry(0.125, 0.3, 3, 10).scale(1, 1, 0.72), atStd('#ffffff', 0.7)), hips = I(new THREE.CapsuleGeometry(0.12, 0.1, 3, 10).scale(1, 1, 0.7), atStd('#ffffff', 0.8));
    const legs = I(new THREE.CapsuleGeometry(0.058, 0.74, 3, 8), atStd('#ffffff', 0.72), n * 2), arms = I(new THREE.CapsuleGeometry(0.04, 0.5, 3, 6), atStd('#ffffff', 0.72), n * 2);
    const headI = I(new THREE.SphereGeometry(0.098, 12, 9).scale(0.92, 1, 1.05), atStd('#ffffff', 0.7)), hair = I(new THREE.SphereGeometry(0.104, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), atStd('#ffffff', 0.85));
    const ob = new THREE.Object3D(), cols = ['#f1c9a5', '#e0ac85', '#c68863', '#8d5b3e', '#f6d7bd', '#5e3b26'].map((c) => new THREE.Color(c)), sw = ['#2a6ab0', '#e0503c', '#1f8f7a', '#f0a12a', '#1a1d22', '#ff86b4', '#ffffff', '#6a3fa0'].map((c) => new THREE.Color(c));
    const hc = ['#2a1d14', '#4a3222', '#c9a46a', '#141210', '#7a5a3a', '#9a9a96'].map((c) => new THREE.Color(c));
    const put = (m, i, p, rx, ry, rz = 0) => { ob.position.set(p[0], p[1], p[2]); ob.rotation.set(rx, ry, rz, 'YXZ'); ob.scale.setScalar(1); ob.updateMatrix(); m.setMatrixAt(i, ob.matrix); };
    list.forEach((q, i) => { const f = [Math.sin(q.yaw), Math.cos(q.yaw)], v = [f[1], -f[0]], up = q.raised, yy = q.y + 0.47, c = cols[fr.int(0, 5)], suit = sw[fr.int(0, 7)], bare = fr.next() < 0.5;
      const at = (u, w, h) => [q.x + f[0] * u + v[0] * w, yy + h, q.z + f[1] * u + v[1] * w];
      // (head at the lounger's +f end; a raised back sits the torso, the arms and the head up)
      for (const sd of [1, -1]) { put(legs, i * 2 + (sd > 0 ? 0 : 1), at(-0.5, sd * 0.085, 0.0), ATPI / 2, q.yaw); legs.setColorAt(i * 2 + (sd > 0 ? 0 : 1), c); }
      put(hips, i, at(-0.05, 0, 0.02), ATPI / 2, q.yaw, ATPI / 2); hips.setColorAt(i, suit);
      const tilt = up ? 0.75 : 0;
      put(torso, i, at(up ? 0.22 : 0.27, 0, up ? 0.15 : 0.03), ATPI / 2 - tilt, q.yaw, 0); torso.setColorAt(i, bare ? c : suit);
      for (const sd of [1, -1]) { put(arms, i * 2 + (sd > 0 ? 0 : 1), at(up ? 0.16 : 0.2, sd * 0.19, up ? 0.12 : 0.02), ATPI / 2 - tilt, q.yaw); arms.setColorAt(i * 2 + (sd > 0 ? 0 : 1), c); }
      put(headI, i, at(up ? 0.5 : 0.64, 0, up ? 0.47 : 0.06), 0, q.yaw); headI.setColorAt(i, c);
      put(hair, i, at(up ? 0.53 : 0.69, 0, up ? 0.49 : 0.07), up ? 0.82 : 1.5, q.yaw); hair.setColorAt(i, hc[fr.int(0, 5)]); });
  }
  // ---- the balloon (red, helium, on a string from her right hand); its scrap after it bursts
  const balloonM = new THREE.MeshStandardMaterial({ color: '#d8141e', roughness: 0.18, metalness: 0.05 });
  const balloon = atMesh(new THREE.SphereGeometry(1, 28, 20).scale(1, 1.15, 1), balloonM, 0, 0, 0, scene); const knot = atMesh(new THREE.ConeGeometry(0.02, 0.04, 8), balloonM, 0, 0, 0, scene);
  const str = atMesh(new THREE.CylinderGeometry(1, 1, 1, 4), atStd('#f4f4f0', 0.8), 0, 0, 0, scene); str.castShadow = false;
  const scrap = atMesh(new THREE.SphereGeometry(0.035, 8, 6).scale(1, 0.6, 1.4), balloonM, 0, 0, 0, scene);
  // its size at 10:00 (a faint ring, shown with it in the close shot)
  const ring0 = new THREE.Mesh(new THREE.RingGeometry(0.985, 1.0, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthTest: false, fog: false })); ring0.renderOrder = 20; scene.add(ring0);
  // ---- particles: soft (smoke, steam, splash, foam, bubbles) and the light shafts under water (added)
  const puffs = atPuffs(scene, 9000, { soft: 1.5 }), glow = atPuffs(scene, 400, { additive: true, soft: 1.0 }); set._puffs = puffs;
  // the boiling sea's vapour domes: real glossy half-bubbles on the water (instanced), so they read as bubbles, not snow
  const domes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 8, 0, ATPI * 2, 0, ATPI / 2),
    new THREE.MeshStandardMaterial({ color: '#d6e6ee', roughness: 0.06, metalness: 0.0, envMapIntensity: 2.0, transparent: true, opacity: 0.8 }), 1400);
  domes.frustumCulled = false; domes.count = 0; domes.castShadow = false; domes.receiveShadow = false; scene.add(domes);
  const domeO = new THREE.Object3D();
  // ---- the light shafts under water: long soft planes hanging from the surface, facing the camera about y
  const shaftM = new THREE.MeshBasicMaterial({ map: atTex(atCanvas(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.15, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, w, h); }), { repeat: false }),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: new THREE.Color(0.1, 0.16, 0.18) });
  const shafts = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shaftM); m.renderOrder = 6; m.frustumCulled = false; scene.add(m); shafts.push(m); }
  // ---- the officer's mask hose (mask → bottle): eight short struts, only on the bridge wing shot
  const hoseM = atStd('#e6e2cc', 0.5), hose = [0, 1, 2, 3, 4, 5, 6, 7].map(() => { const m = atMesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6).translate(0, 0.5, 0), hoseM, 0, 0, 0, scene); m.castShadow = false; m.visible = false; return m; });
  const _ha = new THREE.Vector3(), _hb = new THREE.Vector3(), _hp = new THREE.Vector3(), _hq = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  // ---- the bridge wing's oxygen bottle (green), by the officer
  const o2b = atMesh(new THREE.CylinderGeometry(0.09, 0.09, 0.62, 12), atStd('#2f7d3a', 0.4, 0.3), 0, 0, 0, scene);
  const shopL = new THREE.PointLight('#fff2dc', 0, 9, 1.5); shopL.position.set(deck.shop.x0 + 3.0, deck.shop.yt - 0.45, 0.4); shopL.castShadow = false; scene.add(shopL);
  // ---- two more people on the aft stairs at 10:44 (only that shot sees them)
  const cl1 = atPerson('atC9', scene, { id: 'cl1', legs: 'skin' }), cl2 = atPerson('atC14', scene, { id: 'cl2', legs: 'skin' });
  // ---- the swimmers' cannonball at the start: a boy jumps into the pool (−2.6 s)
  const boy = atPerson('atC5', scene, { id: 'boy', kid: 0.7, legs: 'skin', arms: 'skin' });

  // ---- the cameras: each sets the camera and where the sun's shadows are needed (focus, radius)
  const cam = (p, at, fov, roll = 0, focus, R = 40) => { atCam(camera, p, at, fov, roll); set._focus = focus || at; set._shR = R; };
  const head = (P) => { P.root.updateMatrixWorld(true); const v = new THREE.Vector3(); P.j.head.getWorldPosition(v); return [v.x, v.y, v.z]; };
  const hand = (P, side = 'ra') => { P.root.updateMatrixWorld(true); const v = new THREE.Vector3(); P.j[side].hand.getWorldPosition(v); return [v.x, v.y, v.z]; };
  const dr = (t, a, rate = 0.3, seed = 1) => atDrift(t, a, rate, seed);
  // which way a person faces (their root's +z, flat): [x, z]
  const fwd = (P) => { const y = P.root.rotation.y; return [Math.sin(y), Math.cos(y)]; };
  const G0 = W.girl0, ST = ship.stairs.find((q) => q.k === W.stair.k), ST13 = ship.stairs.find((q) => q.k === 13), ST14 = ship.stairs.find((q) => q.k === 14);
  set.ofAt = [ship.bridgeWing[0] + 2.2, ship.bridgeWing[1], ship.bridgeWing[2] - 0.4];       // aft of the wing's cab, against its wall
  set.stairAt = (q, i) => { const u = (i + 0.5) / 16; return [q.x0 + u * (q.x1 - q.x0), q.y0 - (i + 1) * (q.y0 - q.y1) / 16 + 0.06, q.z]; };
  const Mr = F.marina, L = F.line;
  const PM = [(W.pairYou[0] + W.pairHer[0]) / 2, (W.pairYou[1] + W.pairHer[1]) / 2, (W.pairYou[2] + W.pairHer[2]) / 2];
  set.cams = {
    // the pool deck from the aft block's front, deck 16: the pool, the loungers, the big screen far off
    title: (t, s, k) => { const d = dr(t, 0.03, 0.3, 1); cam([-5.6 - 0.8 * k + d[0], y15 + 2.3 + d[1], -9.4 + 0.5 * k], [-12.0, y15 + 1.25, 0.0], 48, 0, [-11, y15, -2], 14); },
    // a drone off the port quarter, high: the ship, the wake, nothing else to the horizon
    aerial: (t, s, k) => { cam([380 - 60 * k, 150 - 10 * k, 300 - 20 * k], [-30, 15, 0], 34, 0, [0, 20, 0], 160); },
    // along the side row at deck height: people on loungers in the sun
    deck: (t, s, k) => { const d = dr(t, 0.03, 0.3, 2); cam([-44 + 3 * k + d[0], y15 + 1.25 + d[1], 9.2], [-10, y15 + 0.6, 12.6], 40, 0, [-28, y15, 11], 22); },
    // the girl and her balloon, from over the pool
    girl: (t, s, k) => { const d = dr(t, 0.02, 0.3, 3); cam([G0[0] + 0.95 + d[0], y15 + 1.2 + d[1], G0[1] - 2.0 + 0.2 * k], [G0[0] - 0.05, y15 + 1.12, G0[1]], 44, 0, [G0[0], y15 + 1.1, G0[1]], 8); },
    // lying on the deck, looking up past a parasol at the sky (a square metre marked under it)
    sky: (t, s, k) => { cam([-50.4, y15 + 0.4, 12.1], [-49.0 + 1.5 * k, y15 + 24, 21.0], 62, 0, [-50, y15, 13], 16); },
    // the bar's terrace: people at the counter, the sea beyond the glass
    terrace: (t, s, k) => { const d = dr(t, 0.03, 0.3, 4); cam([21.5 + d[0], y15 + 1.6 + d[1], 9.6 - 0.8 * k], [31, y15 + 1.1, 0.5], 40, 0, [29, y15, 3], 16); },
    // off the port side, rising past the funnel's top to 85 m over the sea
    climb: (t, s, k) => { const u = Ease.inOutSine(k); cam([-60 + 10 * u, 22 + 70 * u, 135 - 15 * u], [-10, 34 - 6 * u, 0], 40, 0, [0, 30, 0], 150); },
    // over the windbreak, straight down the ship's side: the sea, 40 m down, running past
    rail: (t, s, k) => { const d = dr(t, 0.02, 0.3, 5); cam([-62 + d[0], y15 + 1.9 + d[1], -19.0], [-98, 0, -26 - 2 * k], 44, 0, [-80, 20, -20], 60); },
    // a metre over the sea, 28 m off the port side, keeping pace with the ship
    seaLevel: (t, s, k) => { cam([-30 + 6 * k, 1.6 + 0.3 * Math.sin(t * 0.7), 46], [-60, 6, 10], 38, 0, [-40, 10, 20], 80); },
    // the man pinching his nose by the pool
    jaw: (t, s, k) => { const h = head(jaw), f = fwd(jaw), d = dr(t, 0.01, 0.3, 6), u = 2.3 - 0.3 * k; cam([h[0] + f[0] * u + f[1] * 0.8 + d[0], h[1] + 0.05 + d[1], h[2] + f[1] * u - f[0] * 0.8], [h[0], h[1] - 0.15, h[2]], 34, 0, [h[0], y15, h[2]], 10); },
    // close: the balloon against the sky (its size at 10:00 drawn round it)
    balloon: (t, s, k) => { const b = balloon.position, d = dr(t, 0.008, 0.3, 7); cam([b.x + 0.9 + d[0], b.y - 0.45 + d[1], b.z - 1.0], [b.x, b.y - 0.05, b.z], 34, 0, [b.x, b.y, b.z], 6); },
    // the bow: up at the bridge's dark windows (the barometer is in there)
    bridge: (t, s, k) => { const d = dr(t, 0.03, 0.3, 8); cam([-134 + 2 * k + d[0], 15.3 + d[1], 7.5], [-100, 36, -2], 42, 0, [-115, 25, 0], 40); },
    // low over the sea off the port bow, keeping pace: the bridge's windows (the barometer is in there), the open sea
    bow: (t, s, k) => { const d = dr(t, 0.05, 0.3, 9); cam([-205 + 5 * k + d[0], 4.5 + d[1] + 0.25 * Math.sin(t * 0.6), 60], [-150, 14, 57], 44, 0, [-130, 10, 10], 60); },
    // the pool deck from the sun deck, 10:29: busy, bright
    cabinDeck: (t, s, k) => { const d = dr(t, 0.04, 0.3, 10); cam([42 - 3 * k + d[0], D(17) + 2.6 + d[1], -13.5], [-14, y15 + 0.3, 5], 40, 0, [-6, y15, 0], 36); },
    // close: a side table: the crisp packet tight as a drum, the sun cream bulging; the flamingo in the pool beyond
    swell: (t, s, k) => { const tb = deck.tables[0], d = dr(t, 0.004, 0.3, 11); cam([tb[0] + 0.55 + d[0], y15 + 0.95 + d[1], tb[1] + 0.95 - 0.1 * k], [tb[0] - 0.05, y15 + 0.55, tb[1] - 0.05], 36, 0, [tb[0], y15, tb[1]], 5); },
    // the girl as her balloon bursts
    pop: (t, s, k) => { const d = dr(t, 0.01, 0.3, 12); cam([G0[0] + 1.9 + d[0], y15 + 1.25 + d[1], G0[1] - 2.2], [G0[0] - 0.1, y15 + 1.6, G0[1] + 0.1], 36, 0, [G0[0], y15, G0[1]], 10); },
    // the bar: a row of drinks foaming over
    bar: (t, s, k) => { const d = dr(t, 0.008, 0.3, 13); cam([F.bar.x - 3.8 + 0.6 * k + d[0], y15 + 1.55 + d[1], F.bar.z + 3.3], [F.bar.x - 1.0, y15 + 1.18, F.bar.z + 2.1], 36, 0, [F.bar.x, y15, 2], 8); },
    glass: (t, s, k) => { const g = deck.glasses[1], d = dr(t, 0.003, 0.3, 14); cam([g.x + 0.32 + d[0], g.y + 0.1 + d[1], g.z + 0.42], [g.x, g.y - 0.02, g.z], 30, 0, [g.x, g.y, g.z], 4); },
    // the aft stairs: people climbing from deck 14 to 15, stopping, gasping
    climbers: (t, s, k) => { const q = ST14, d = dr(t, 0.02, 0.3, 15); cam([q.x1 + 3.5 + d[0], q.y1 + 1.5 + d[1], q.z - 4.5], [q.x0 + 1.5, q.y0 - 0.6, q.z + 0.3], 40, 0, [q.x1, q.y1, q.z], 14); },
    // the man by the pool: sitting up, fighting for breath; his wife beside him
    oldMan: (t, s, k) => { const d = dr(t, 0.01, 0.3, 16), o = OM.o; cam([o[0] - 1.25 + d[0], y15 + 1.0 + d[1], o[1] - OM.f[1] * 2.3 - 0.15 * k], [o[0] + 0.3, y15 + 0.78, o[1] - OM.f[1] * 0.25], 36, 0, [o[0], y15, o[1]], 8); },
    // from the top terrace, straight down the stepped terraces to the sea and the platform on deck 2
    down13: (t, s, k) => { const d = dr(t, 0.02, 0.3, 17); cam([144.0 + 0.6 * k + d[0], D(15) + 2.2 + d[1], 15.0 - 1.5 * k], [150, 1.3, 4.0 - 1.0 * k], 50, 0, [149, 1.3, 1.0], 45); },
    // you, the ship's dive instructor, at the windbreak
    you: (t, s, k) => { const h = head(you), f = fwd(you), d = dr(t, 0.01, 0.3, 18), u = 1.8 - 0.15 * k; cam([h[0] + f[0] * u + f[1] * 1.3 + d[0], h[1] - 0.05 + d[1], h[2] + f[1] * u - f[0] * 1.3], [h[0], h[1] - 0.1, h[2]], 36, 0, [h[0], y15, h[2]], 10); },
    // the deck, wide and slow (the regulator inset is on the right)
    gasping: (t, s, k) => { const d = dr(t, 0.03, 0.3, 19); cam([-3 - 2 * k + d[0], y15 + 2.6 + d[1], -12.5], [-26, y15 + 0.4, 4], 40, 0, [-16, y15, 0], 22); },
    // under water, 10 m down behind the stern: the hull, the pods, the light
    underEst: (t, s, k) => { cam([158, -10.5, 12 - 2 * k], [128, -2.5, 0], 50, 0, [140, -2, 0], 30); },
    // inside the dive shop: the six tanks in their rack
    rack: (t, s, k) => { const x0 = deck.shop.x0, yb = deck.shop.yb, d = dr(t, 0.004, 0.3, 20); cam([x0 + 4.6 - 0.8 * k + d[0], yb + 1.45 - 0.15 * k + d[1], -0.9 + 0.9 * k], [x0 + 2.1, yb + 0.75, 2.7], 44, 0, [x0 + 2.2, yb + 0.6, 2.9], 8); },
    // you going down the aft stairs (deck 14 → 13)
    stairsDown: (t, s, k) => { const q = ST13, d = dr(t, 0.02, 0.3, 21); cam([q.x1 + 3.2 + d[0], q.y1 + 1.0 + d[1], q.z - 3.8], [q.x0 + 1.4, q.y0 + 0.2 - 1.8 * k, q.z], 42, 0, [q.x1, q.y1, q.z], 14); },
    // the girl sitting on the stairs, two decks down
    girlStairs: (t, s, k) => { const h = head(girl), f = fwd(girl), d = dr(t, 0.01, 0.3, 22), u = 1.35 - 0.15 * k; cam([h[0] + f[0] * u + f[1] * 0.3 + d[0], h[1] + 0.1 + d[1], h[2] + f[1] * u - f[0] * 0.3], [h[0], h[1] - 0.1, h[2]], 36, 0, [h[0], h[1], h[2]], 8); },
    hand: (t, s, k) => { const p = set.stairAt(ST, W.stair.step), h = [p[0] + 0.54, p[1] + 0.39, p[2] - 0.2], d = dr(t, 0.004, 0.3, 23); cam([h[0] + 0.2 + d[0], h[1] + 0.05 + d[1], h[2] - 1.25 + 0.1 * k], [h[0] - 0.05, h[1] - 0.05, h[2]], 40, 0, [h[0], h[1], h[2]], 5); },
    // the funnel from the sun deck: black smoke
    funnel: (t, s, k) => { const d = dr(t, 0.05, 0.3, 24); cam([112 - 6 * k + d[0], 74 + d[1], 44], [73, 66, 0], 44, 0, [70, 50, 0], 40); },
    smokeAerial: (t, s, k) => { cam([-60 + 30 * k, 110, 330], [60, 35, 0], 40, 0, [40, 30, 0], 150); },   // (from port: the plume streams clear to the right)
    // the pool deck at 11:13: the big screen dies
    screen: (t, s, k) => { const d = dr(t, 0.02, 0.3, 25); cam([-36 + d[0], y15 + 1.55 + d[1], -8.5], [-77, F.screen.y - 0.8, 0.8], 40, 0, [-55, y15, -3], 30); },
    // the platform on deck 2, from off the stern: you, the girl, the tanks
    marina: (t, s, k) => { const d = dr(t, 0.04, 0.3, 26); cam([Mr.x1 + 5.5 + d[0], Mr.y + 3.4 + d[1], -6.5 + 0.5 * k], [Mr.x1 - 1.8, Mr.y + 0.6, 0.2], 42, 0, [148, 1, 0], 12); },
    // what you see: your hands on the tank's strap, the edges going dark
    pov: (t, s, k) => { const h = head(youS), g = head(girlS), yw = youS.root.rotation.y, d = dr(t, 0.015, 0.6, 27); cam([h[0] + Math.sin(yw) * 0.17 + d[0], h[1] + 0.06 + d[1], h[2] + Math.cos(yw) * 0.17], [g[0], g[1] - 0.3, g[2]], 56, 2.5 * Math.sin(t * 0.7), [h[0], Mr.y, h[2]], 6); },
    girlMask: (t, s, k) => { const h = head(girlS), d = dr(t, 0.006, 0.3, 28); cam([h[0] + 0.95 + d[0], h[1] - 0.3 + d[1], h[2] - 0.4 + 0.08 * k], [h[0], h[1] + 0.02, h[2]], 34, 0, [h[0], h[1], h[2]], 5); },   // (from a little below: her face, not her crown)
    // under water: the line with its six tanks, down into the blue; the stern above
    lineUW: (t, s, k) => { cam([L.x + 4.5, -13.5 + 1.5 * k, L.z + 3.8], [L.x, -7.0, L.z], 48, 0, [L.x, -6, 0], 20); },
    // the backward roll off the platform's end
    roll: (t, s, k) => { const d = dr(t, 0.006, 0.3, 27); cam([Mr.x1 - 0.7 + d[0], Mr.y + 1.65 + d[1], -4.0], [Mr.x1 + 0.45, Mr.y - 0.25, 0.3], 42, 0, [Mr.x1, Mr.y, 0], 10); },
    sink: (t, s, k) => { const p = W.you(s) || W.pairYou; cam([p[0] + 0.8, p[1] - 1.6, p[2] + 4.4], [p[0] - 0.35, p[1] + 0.3, p[2] - 0.3], 50, 0, [p[0], p[1], p[2]], 12); },
    // you two on the line at 10 m
    pair: (t, s, k) => { const p = PM, d = dr(t, 0.03, 0.3, 29); cam([p[0] - 1.55 + 0.3 * k + d[0], p[1] + 1.5 + d[1], p[2] + 3.4], [p[0], p[1] + 1.2, p[2]], 44, 0, [p[0], p[1], p[2]], 10); },
    breathe: (t, s, k) => { const h = head(girlS), d = dr(t, 0.006, 0.3, 30); cam([h[0] + 0.85 + d[0], h[1] - 0.05 + d[1], h[2] - 0.75], [h[0], h[1] + 0.05, h[2]], 34, 0, [h[0], h[1], h[2]], 6); },
    upHull: (t, s, k) => { const p = W.pairYou; cam([p[0] + 1.6, p[1] - 0.6, p[2] + 1.8], [p[0] - 6, 0, p[2] - 1.0], 62, 0, [140, -2, 0], 30); },
    // the pool deck from high up: everyone still
    still: (t, s, k) => { cam([-4 - 2 * k, y15 + 15, -14], [-19, y15 + 0.2, 3], 40, 0, [-16, y15, 1], 24); },
    // close over the man by the pool: lying on his lounger, eyes shut, his hands limp
    stillHand: (t, s, k) => { const h = head(old), d = dr(t, 0.004, 0.3, 31); cam([h[0] + 1.4 + d[0], h[1] + 0.9 + d[1] - 0.08 * k, h[2] + 0.5], [h[0] + 0.1, h[1] - 0.05, h[2] + 0.35 + 0.1 * k], 34, 0, [h[0], h[1], h[2]], 6); },
    // the fish round you two
    fish: (t, s, k) => { const p = PM, d = dr(t, 0.03, 0.3, 32); cam([p[0] - 2.8 + d[0], p[1] + 0.8 + d[1], p[2] + 3.6 - 0.3 * k], [p[0], p[1] + 1.2, p[2]], 46, 0, [p[0], p[1], p[2]], 10); },
    // the whitetip coming out of the blue (side on, a longer lens)
    sharkIn: (t, s, k) => { const p = PM, d = dr(t, 0.03, 0.3, 33); cam([p[0] - 1.55 + d[0], p[1] + 1.3 + d[1], p[2] + 3.4], [p[0] - 1.6 + 0.6 * k, p[1] + 1.4, p[2] - 4.6], 50, 0, [p[0], p[1], p[2]], 12); },
    circle: (t, s, k) => { const p = PM, d = dr(t, 0.02, 0.3, 34); cam([p[0] - 2.4 + d[0], p[1] + 1.8 + d[1], p[2] + 4.4], [p[0] + 0.6, p[1] + 0.9, p[2] - 3.0], 56, 0, [p[0], p[1], p[2]], 12); },
    // the bridge wing: the officer, an oxygen mask on
    officer: (t, s, k) => { const h = head(officer), f = fwd(officer), d = dr(t, 0.008, 0.3, 35), u = 2.25 - 0.4 * k; cam([h[0] + f[0] * u + f[1] * 0.9 + d[0], h[1] + 0.35 + d[1], h[2] + f[1] * u - f[0] * 0.9], [h[0] + f[0] * 0.3, h[1] - 0.35, h[2] + f[1] * 0.3], 40, 0, [h[0], h[1] - 0.3, h[2]], 6); },
    // she lets go; she kicks for the light; you catch her fin
    letGo: (t, s, k) => { const p = PM, d = dr(t, 0.02, 0.3, 36); cam([p[0] - 1.3 + d[0], p[1] + 1.1 + d[1], p[2] + 3.6], [p[0] - 0.1, p[1] + 1.8 + 1.0 * k, p[2]], 44, 0, [p[0], p[1], p[2]], 10); },
    kick: (t, s, k) => { const h = W.her(s), d = dr(t, 0.02, 0.4, 37); cam([h[0] + 0.6 + d[0], h[1] + 3.6 + d[1], h[2] + 1.0], [h[0], h[1] - 1.4, h[2]], 50, 0, [h[0], h[1], h[2]], 10); },
    catch: (t, s, k) => { const h = W.her(s), d = dr(t, 0.01, 0.4, 38); cam([h[0] + 2.8 + d[0], h[1] - 1.9 + d[1], h[2] + 2.4], [h[0], h[1] - 1.2, h[2]], 46, 0, [h[0], h[1], h[2]], 8); },
    // the ship under a deep blue sky, from a drone ahead and above
    darkSky: (t, s, k) => { cam([-240 + 15 * k, 50, 200], [20, 72 + 6 * k, 0], 46, 0, [0, 20, 0], 160); },   // (the ship above the caption, the darkening sky over it)
    // a hot tub starting to boil; then the deck, the tubs steaming
    tub: (t, s, k) => { const tb = deck.tubs[1], d = dr(t, 0.006, 0.3, 39); cam([tb.x + 1.7 + d[0], tb.y + 1.05 + d[1], tb.z - 2.4 + 0.2 * k], [tb.x - 0.1, tb.y, tb.z], 38, 0, [tb.x, tb.y, tb.z], 8); },
    tubWide: (t, s, k) => { cam([12 - 2 * k, y15 + 6.5, -14], [-16, y15, 6], 42, 0, [-14, y15, 2], 30); },
    // high over the starboard rows: the hot tub steaming, the people still on their loungers, the pool
    bodyTemp: (t, s, k) => { const d = dr(t, 0.03, 0.3, 40); cam([-36 + 1.5 * k + d[0], y15 + 5.5 + d[1], -1 + 0.5 * k], [-26, y15 + 0.3, -9], 46, 0, [-28, y15, -8], 18); },
    calm: (t, s, k) => { const p = PM, d = dr(t, 0.02, 0.3, 41); cam([p[0] - 1.2 + d[0], p[1] + 1.0 + d[1], p[2] + 3.3 - 0.2 * k], [p[0], p[1] + 1.2, p[2]], 40, 0, [p[0], p[1], p[2]], 8); },
    // stars in full sunshine over the dead ship
    // (off the starboard quarter, low: the ship's flank in full sun, the Sun up to the left, the sky black round it)
    stars: (t, s, k) => { cam([260 - 12 * k, 10 + 2 * k, 90], [-200, 170 + 8 * k, 60], 58, 0, [0, 20, 0], 160); },
    starsFunnel: (t, s, k) => { cam([24, y15 + 1.4, 12.5], [70, 64 + 10 * k, -4], 54, 0, [50, 50, 0], 30); },
    poolBoil: (t, s, k) => { const d = dr(t, 0.008, 0.3, 42); cam([F.pool.x1 + 3.2 + d[0], y15 + 1.3 + d[1], F.pool.z1 + 3.0], [F.pool.x0 + 3.0, y15 - 0.3, -0.5], 40, 0, [-15, y15, 0], 14); },
    // a metre over the water off the starboard quarter: the ship's flank, the Sun low ahead, the black sky; the sea erupts
    seaBoil: (t, s, k) => { const d = dr(t, 0.03, 0.3, 45); cam([168 - 2 * k + d[0], 1.3 + d[1], -32], [95, 9 - 1.5 * k, -6], 48, 0, [150, 1, -20], 30); },
    // under the boiling surface: you two from below, dark against the bright churning ceiling; the hull's edge
    ceiling: (t, s, k) => { const a = head(youS), b = head(girlS), p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], d = dr(t, 0.02, 0.3, 43);
      cam([p[0] + 0.95 + d[0], p[1] - 1.55 + d[1] - 0.15 * k, p[2] + 1.15], [p[0] - 0.25, p[1] + 1.3, p[2] - 0.35], 60, 0, [p[0], p[1], p[2]], 12); },
    // close: you, your mask and regulator, the tank on the line; her behind you
    tankClose: (t, s, k) => { const h = head(youS), d = dr(t, 0.006, 0.3, 44); cam([h[0] - 0.55 + d[0], h[1] + 0.05 + d[1], h[2] + 0.85 - 0.06 * k], [h[0] + 0.15, h[1] - 0.1, h[2]], 36, 0, [h[0], h[1], h[2]], 6); },
    // her from just behind, silhouetted against the light she's looking up at (beside the line, never through its tanks)
    up: (t, s, k) => { const h = head(girlS), d = dr(t, 0.006, 0.3, 46); let lx = L.x - h[0], lz = L.z - h[2]; const ln = Math.hypot(lx, lz) || 1; lx /= ln; lz /= ln; const D = 0.75 - 0.2 * k;
      cam([h[0] - lz * D - lx * 0.12 + d[0], h[1] - 0.25 + 0.05 * k + d[1], h[2] + lx * D - lz * 0.12], [h[0] - lx * 0.12, h[1] + 0.12, h[2] - lz * 0.12], 48, 0, [h[0], h[1], h[2]], 6); },
    // the last shot: the two of you from below, small against the white ceiling, the hull over you
    question: (t, s, k) => { const a = head(youS), b = head(girlS), p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      // from 4.5 m below: the two of you small and dark in the middle of the frame, the hull's edge and the light over you
      cam([p[0] - 1.2 - 0.4 * k, p[1] - 4.5 - 0.6 * k, p[2] + 1.8 + 0.4 * k], [p[0], p[1] + 0.4, p[2]], 60, 0, [p[0], p[1], p[2]], 14); },
  };
  set.under = AT_UNDER;

  // ---- the shark's swim: out of the blue (12:30:20), crossing in front of you side-on, then round and round behind
  // you two, on the open side away from the hull (an ellipse 4.5 × 3 m whose near edge passes 2.5 m behind you); at the
  // rise it lifts to her height, still 2.5 m off
  const sharkAt = (s) => {
    const c = [PM[0] + 1.0, PM[1] + 1.2, PM[2] - 6.6], RX = 5.0, RZ = 3.0,   // (never nearer than 3.6 m to you two)
      s0 = atSC('shark', 1, -0.8), s1 = s0 + 6.5, w = 2 * ATPI / 20, aj = ATPI / 2 + 0.6;
    const lift = s > E.letGo - 6 && s < E.catch + 8 ? atEase(s, E.letGo - 6, E.letGo + 2) * (1 - atEase(s, E.catch + 2, E.catch + 8)) : 0;
    const on = (a, ss) => [c[0] + RX * Math.cos(a), c[1] + 0.4 * Math.sin((ss - s1) * 0.13) + 4.0 * lift, c[2] + RZ * Math.sin(a)];
    if (s < s0 - 60) return null;
    if (s < s1) { const u = MathX.clamp((s - s0) / (s1 - s0), 0, 1), to = on(aj, s1), tg = atN3([RX * Math.sin(aj), 0, -RZ * Math.cos(aj)]), from = [to[0] - tg[0] * 14, to[1] + 1.2, to[2] - tg[2] * 14];
      return { p: atV(from, to, u), d: atN3([to[0] - from[0], (to[1] - from[1]) * 0.5, to[2] - from[2]]), rate: 1 }; }
    const a = aj - (s - s1) * w, q = on(a, s), q2 = on(a - 0.05, s + 0.05 / w);
    return { p: q, d: atN3([q2[0] - q[0], q2[1] - q[1], q2[2] - q[2]]), rate: 0.8 };
  };
  set.sharkAt = sharkAt;

  // ---- the frame -----------------------------------------------------------------------------------------------
  const _v = new THREE.Vector3();
  set.frame = (t, shot) => {
    const s = atStoryAt(t), m = shot.mode, k = (t - shot.t0) / Math.max(1e-6, shot.t1 - shot.t0), a = ATP.air(s);
    set._s = s; set._mode = m; set._a = a;
    const power = s < E.blackout;
    // ---- the people first (some cameras look at them)
    poseAll(s, t, m);
    // ---- the faces: worry as the air goes, gasping mouths, eyes shut once they're out
    { const P = (x) => x.pose || {}, out = (tf) => (s > tf + 3 ? 1 : 0);
      atFaceSet(jaw, t, { mouth: P(jaw).mouth || 0, worry: 0.25 + 0.5 * MathX.smooth(s, atHMS(10, 20), atHMS(10, 50)), shut: out(W.fade(41)) });
      atFaceSet(old, t, { mouth: s > atHMS(10, 40) ? 0.55 + 0.35 * Math.max(0, Math.sin(t * 3.4)) : 0, worry: s > atHMS(10, 40) ? 0.8 : 0, shut: s > W.oldDown + 4 ? 1 : 0, wide: s > atHMS(10, 40) && s < W.oldDown ? 0.5 : 0 });
      atFaceSet(wife, t, { mouth: s > atHMS(10, 42) ? 0.35 : 0, worry: s > atHMS(10, 40) ? 1 : 0, shut: s > W.wifeDown + 3 ? 1 : 0 });
      atFaceSet(girl, t, { mouth: s > E.balloonPop ? 0.3 : 0.1, worry: s > E.balloonPop ? 1 : 0.1, brow: s < E.balloonPop ? 0.3 : 0 });
      atFaceSet(officer, t, { shut: 1, mouth: 0.2 });
      atFaceSet(you, t, { worry: 0.2 + 0.5 * MathX.smooth(s, atHMS(10, 40), atHMS(11, 0)), frown: 0.3 });
      atFaceSet(youS, t, { worry: 0.4, frown: 0.2 }); atFaceSet(girlS, t, { worry: 0.7 - 0.5 * MathX.smooth(s, atSC('last', 1, -1), atSC('last', 1, 1)), wide: 0.3 });
      // (her eyes up to the light at the end)
      if (girlS.face && girlS.root.visible) { if (s > atSC('last', 1, -1)) { const h = head(girlS); girlS.face.aimEyes(new THREE.Vector3(h[0], h[1] + 6, h[2]), 0.9); } else girlS.face.rest(); } }
    (set.cams[m] || set.cams.title)(t, s, k);
    camera.updateMatrixWorld(true);
    const under = camera.position.y < -0.05;
    set._under = under;
    // ---- sky, sea, light
    const sk = sky.set(s, camera); sea.set(s, t, camera, sk); sky.U.uUnder.value = camera.position.y < -0.05 ? 1 : 0;
    const sv = atSunAt(s).v;
    sun.intensity = 2.7 * ATL.sunK(a) * (under ? 0.55 : 1); sun.color.setRGB(1.0, 0.96 + 0.03 * (1 - a), 0.9 + 0.08 * (1 - a));
    const zk = ATL.zenith(a);
    hemi.color.setRGB(0.32 + 0.3 * zk, 0.45 + 0.35 * zk, 0.7 + 0.25 * zk).multiplyScalar(0.25 + 0.75 * zk);
    hemi.groundColor.setRGB(0.42, 0.38, 0.32); hemi.intensity = under ? 0.7 : 0.55 + 0.35 * zk;
    scene.environment && (scene.environmentIntensity = 0.25 + 0.75 * zk);
    // the shadow box: centred on the shot's focus, snapped to whole texels so it doesn't crawl
    { const R = set._shR || 40, f = set._focus || [0, y15, 0], L = new THREE.Vector3(...sv).normalize(), up = Math.abs(L.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const rt = new THREE.Vector3().crossVectors(up, L).normalize(), u2 = new THREE.Vector3().crossVectors(L, rt), tx = (2 * R) / 2048, P0 = new THREE.Vector3(...f);
      const a1 = Math.round(P0.dot(rt) / tx) * tx, a2 = Math.round(P0.dot(u2) / tx) * tx, a3 = P0.dot(L), C = rt.clone().multiplyScalar(a1).add(u2.clone().multiplyScalar(a2)).add(L.clone().multiplyScalar(a3));
      const sc = sun.shadow.camera; if (sc.right !== R) { sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.far = 600; sc.updateProjectionMatrix(); }
      sun.position.copy(C).addScaledVector(L, 300); sun.target.position.copy(C); sun.target.updateMatrixWorld(); }
    // ---- fog: thin haze over the sea; under it, the water's own blue (darker with depth and as the sky dims)
    if (under) { scene.fog = sea0; const dk = MathX.clamp(-camera.position.y / 30, 0, 1), lk = 0.35 + 0.65 * zk; sea0.color.setRGB(0.004 + 0.006 * lk, (0.05 + 0.035 * lk) * (1 - 0.35 * dk), (0.11 + 0.08 * lk) * (1 - 0.3 * dk)); sea0.density = 0.028; sea.U.uUnderCol.value.copy(sea0.color).multiplyScalar(1.7); sky.U.uUnderC.value.copy(sea0.color); }
    else { scene.fog = airFog; airFog.color.setRGB(...sk.hor.toArray().map((v) => v * 1.0 + 0.0)); airFog.density = 0.00009 * Math.max(0.05, a); }
    // ---- the pool, the tubs: ripples, the boil; the pool's lights go with the power
    { const P = deck.pool.U; P.uTime.value = t; P.uZen.value.copy(sk.zen); P.uHor.value.copy(sk.hor); P.uSun.value.set(...sv); P.uSkyK.value = zk; P.uLight.value = power ? 1 : 0;
      P.uBoil.value = MathX.smooth(s, E.pool - 0.3, E.pool + 2.5); P.uBoilT.value = s; }
    deck.tubs.forEach((tb, i) => { const U = tb.U; U.uTime.value = t; U.uZen.value.copy(sk.zen); U.uHor.value.copy(sk.hor); U.uSun.value.set(...sv); U.uSkyK.value = zk; U.uLight.value = power ? 1 : 0;
      U.uBubbles.value = power ? 1 : 0; U.uBoil.value = MathX.smooth(s, E.tub - 0.3 + i * 4, E.tub + i * 4 + 2.5); U.uBoilT.value = s + i * 17; });
    // ---- the big screen: on until the power fails
    // (it flickers for the last half second, then the picture collapses to a dim glow and goes)
    { const u = s - E.blackout, fl = u > -0.6 && u < 0 ? (Math.sin(t * 47) > -0.2 ? 1 : 0.15) * (0.6 + 0.4 * Math.sin(t * 13)) : 1;
      deck.screen.mat.emissiveIntensity = power ? 1.5 * fl : 0.5 * Math.max(0, 1 - u / 0.3); deck.screen.mat.color.set(power || u < 0.3 ? '#111' : '#050607'); }
    deck.shop.light.emissiveIntensity = power ? 1.4 : 0; shopL.intensity = power && m === 'rack' ? 5 : 0;
    // ---- the drinks' foam (from 10:20, strongest at 10:35, still at 11:00)
    deck.foam.set(!under && (m === 'bar' || m === 'glass' || m === 'terrace') ? MathX.smooth(s, atHMS(10, 20), atHMS(10, 34)) * (1 - MathX.smooth(s, atHMS(11, 5), atHMS(11, 30))) : 0, t);
    // ---- the sealed things: a gas's volume goes as 1/p until the wrapper is tight (crisps tight by ~10:12)
    { const g = 1 / a; deck.swell.items.forEach((q) => { const c = Math.min(g, 1.32); q.c.scale.set(1 + 0.08 * (c - 1), 1 + 2.4 * (c - 1), 1 + 0.08 * (c - 1)); q.c.position.y = q.c.userData.y0 + 0.033 * 2.4 * (c - 1); const b = Math.min(g, 1.12); q.b.scale.set(1 + 0.5 * (b - 1), 1, 1 + 0.5 * (b - 1)); });
      const f = Math.min(Math.pow(g, 1 / 3), 1.06); deck.swell.float.scale.setScalar(f); deck.swell.float.visible = s < atHMS(11, 30); }
    // ---- the line and its tanks (rigged at 11:22)
    line.set(s, s > atHMS(11, 22, 30) && (under || m === 'roll' || m === 'marina' || m === 'seaBoil'));
    // ---- the shark, the fish
    { const q = under ? sharkAt(s) : null; shark.set(s, q ? q.p : [0, 0, 0], q ? q.d : [0, 0, 1], !!q, q ? q.rate : 1); }
    fish.set(s, [W.pairYou[0] - 1.5, W.pairYou[1] + 1.6, W.pairYou[2] + 1.0], under && s > E.deep && s < atHMS(13, 0), 1, camera.position);
    // ---- the light shafts (under water): round the camera, swaying, fading with depth and as the Sun gets lower
    shafts.forEach((sh, i) => { sh.visible = under; if (!under) return;
      const ang = atR(i, 5) * 6.283, r = 3 + atR(i, 6) * 14, x = camera.position.x + Math.cos(ang) * r, z = camera.position.z + Math.sin(ang) * r;
      const w = 0.5 + atR(i, 7) * 1.6, h = 26; sh.scale.set(w, h, 1); sh.position.set(x + sv[0] * 4, -h / 2 + 0.2, z + sv[2] * 4);
      sh.rotation.set(0, Math.atan2(camera.position.x - x, camera.position.z - z), (sv[0] * 0.25)); sh.material.opacity = 1; });
    shaftM.color.setRGB(0.05, 0.085, 0.095).multiplyScalar(0.6 + 0.6 * Math.max(0, sv[1]) * (0.6 + 0.4 * Math.sin(t * 0.7)));
    // ---- the balloon
    poseBalloon(s, t, m);
    // ---- particles
    puffs.begin(); glow.begin(); domes.count = 0;
    fxAll(s, t, m, under);
    puffs.end(); glow.end(); domes.instanceMatrix.needsUpdate = true;
    // ---- the officer's oxygen bottle
    { const o = set.ofAt; o2b.position.set(o[0] + 0.35, o[1] + 0.31, o[2] - 0.62); }
    { const on = m === 'officer'; for (const h of hose) h.visible = on;
      if (on) { officer.root.updateMatrixWorld(true); ofMask.getWorldPosition(_ha); _hb.set(o2b.position.x, o2b.position.y + 0.31, o2b.position.z);
        const bz = (u, v) => { const w = 1 - u; v.set(w * w * _ha.x + 2 * w * u * (_ha.x + _hb.x) / 2 + u * u * _hb.x, w * w * _ha.y + 2 * w * u * (Math.min(_ha.y, _hb.y) - 0.45) + u * u * _hb.y, w * w * _ha.z + 2 * w * u * (_ha.z + _hb.z) / 2 + u * u * _hb.z); };
        hose.forEach((h, i) => { bz(i / 8, _hp); bz((i + 1) / 8, _hq); h.position.copy(_hp); _hq.sub(_hp); h.scale.set(1, _hq.length(), 1); h.quaternion.setFromUnitVectors(_up, _hq.normalize()); }); } }
  };

  // ---- posing everyone ----------------------------------------------------------------------------------------
  const stairWalk = (P, q, u, ph, look) => { const i = MathX.clamp(u * 16, 0, 15.99); const p = set.stairAt(q, Math.floor(i)), n = set.stairAt(q, Math.min(15, Math.floor(i) + 1)), f = i - Math.floor(i);
    atPlace(P, { p: look === 'up' ? AT_P.climb(ph) : AT_P.down(ph), lay: 0, y: 0 }, MathX.lerp(p[0], n[0], f), q.z + 0.35, look === 'up' ? -ATPI / 2 : ATPI / 2, MathX.lerp(p[1], n[1], f)); };
  function poseAll(s, t, m) {
    const under = set.under.has(m);
    // you, in your crew polo (on the pool deck, down the stairs) — then in your wetsuit (the marina, under water)
    const suit = s >= atHMS(11, 19);
    you.root.visible = !suit && !under && m !== 'girlStairs'; youS.root.visible = suit; // D2 is your view of her: you are the camera
    if (!suit) {
      if (s < atHMS(10, 50)) { const q = AT_P.rail(t, 2); q.headYaw = s > atSC('tanks', 0, 1.5) ? 0.9 * atEase(s, atSC('tanks', 0, 1.5), atSC('tanks', 0, 3.0)) : 0; atPlace(you, { p: atBreathe(q, t, 22, 0.4), lay: 0, y: 0 }, W.you0[0], W.you0[1], 0, y15); }
      else if (s < atSC('down', 1, -1.0)) { const s0 = atSC('down', 0, -0.6), u = MathX.clamp((s - s0 - 0.6) / 5.2, 0, 1); stairWalk(you, ST13, u, (s - s0) * 6.5, 'down'); }
      else { // three steps below her, facing up the stairs; your left hand out to hers (the two hands meet: solved for these poses)
        const p = set.stairAt(ST, W.stair.step + 3), q = atBreathe(AT_P.stand(t, 1), t, 24, 0.5), tk = atSC('down', 2, 0.3), w = atEase(s, tk - 0.6, tk + 0.6);
        q.lSh = [0.15 + 0.35 * w, 0.1]; q.lEl = 0.2 + 0.3 * (1 - w); q.spine = 0.2; q.neck = 0.3; atPlace(you, { p: q, lay: 0, y: 0 }, p[0], ST.z - 0.45, -ATPI / 2, p[1]); }
    } else {
      const sp = W.you(s);
      if (!sp) {
        // on the platform: carrying, crouching to fit her gear, sitting on the edge with her, the roll
        if (s < atSC('marina', 1, -0.5)) { const q = AT_P.fumble(t); atPlace(youS, { p: q, lay: 0, y: 0 }, Mr.x1 - 2.6, 0.9, -ATPI / 2 - 0.4, Mr.y + 0.03); }
        else if (s < atSC('dive', 1, -0.6)) { const q = AT_P.fumble(t); atPlace(youS, { p: q, lay: 0, y: 0 }, Mr.x1 - 1.9, 0.6, -ATPI / 2 - 0.2, Mr.y + 0.03); }
        else { const u = atEase(s, E.roll - 0.4, E.roll + 0.5), q = AT_P.rollBack(u); youS.root.rotation.order = 'YXZ'; youS.root.rotation.set(-1.6 * u, -ATPI / 2, 0);
          youS.root.position.set(Mr.x1 - 0.25 + 0.9 * u, Mr.y + 0.03 - 1.1 * u * u, 0.5); youS.apply(q); }
      } else {
        // under water: hanging on the line; kicking up after her; reaching
        const reach = s > E.letGo + 1.6 && s < E.catch + 2 ? atEase(s, E.letGo + 1.6, E.catch - 0.4) : 0;
        const q = reach > 0 ? AT_P.reach(t, reach) : AT_P.hang(t, 0, s > E.catch + 3 ? 1 : (s < E.letGo ? 1 : 0));
        atSwim(youS, atBreathe(q, t, 12, 0.2), sp, -ATPI / 2 + 0.5, reach > 0 ? -0.25 * reach : 0.08);
      }
    }
    // the girl: by the pool with her balloon; on the stairs; on the platform; under water
    const gs = s >= atHMS(11, 19);
    girl.root.visible = !gs && !under; girlS.root.visible = gs;
    if (!gs) {
      if (s < atHMS(10, 45)) { const u = s - E.balloonPop; const q = u > 0 && u < 6 ? AT_P.flinch(u) : (u >= 6 ? (() => { const p = AT_P.stand(t, 3); p.neck = 0.4; p.mouth = 0.6; return atBreathe(p, t, 30, 0.5); })() : AT_P.balloon(t)); atPlace(girl, { p: q, lay: 0, y: 0 }, G0[0], G0[1], ATPI + 0.25, y15); }
      else { const p = set.stairAt(ST, W.stair.step); let q = AT_P.stairSit(t);
        const tk = atSC('down', 2, 0.3); if (s > tk) { const w = atEase(s, tk, tk + 1.2); q.lSh = [0.9 + 0.9 * w, -0.2 + 0.5 * w]; q.lEl = 1.5 - 1.25 * w; q.neck = 0.45 - 0.45 * w; }
        atPlace(girl, { p: q, lay: 0, y: 0 }, p[0] + 0.05, p[2] + 0.1, ATPI / 2 + 0.15, p[1] - 0.12); }
    } else {
      const hp = W.her(s);
      if (!hp) {
        if (s < atSC('dive', 1, -0.6)) { const q = AT_P.sitPlatform(t); q.neck = 0.25; atPlace(girlS, { p: q, lay: 0, y: 0 }, Mr.x1 - 2.2, -0.3, ATPI / 2 + 0.3, Mr.y + 0.03); }
        else { const u = atEase(s, E.roll - 0.4, E.roll + 0.5), q = AT_P.sitPlatform(t); q.lSh = [1.5, -0.2]; q.rSh = [1.5, -0.2]; q.lEl = 1.6; q.rEl = 1.6; girlS.root.rotation.order = 'YXZ'; girlS.root.rotation.set(-1.6 * u, -ATPI / 2, 0);
          girlS.root.position.set(Mr.x1 - 0.55 + 0.9 * u, Mr.y + 0.25 - 1.1 * u * u, 0.2); girlS.apply(q); }
      } else {
        const rising = s > E.letGo && s < E.catch + 1.5;
        if (rising) atSwim(girlS, AT_P.kickUp(t), hp, ATPI / 2 + 0.3, -0.35, 0.1);
        else { const q = AT_P.hang(t, 3, 0); q.rSh = [2.5, 0.15]; q.lSh = [0.6, 0.35]; q.lEl = 0.9;
          // (at the end she tips her head back to look up at the light)
          const lk = atEase(s, atSC('last', 1, -1.5), atSC('last', 1, 1.0)); q.neck = (q.neck || 0) * (1 - lk) - 0.65 * lk; q.headYaw = (q.headYaw || 0) * (1 - lk);
          atSwim(girlS, atBreathe(q, t, 16, 0.3), hp, ATPI / 2 - 0.4, 0.06); }
      }
    }
    // the man by the pool and his wife
    { const gasp = s > atHMS(10, 40), down = atEase(s, W.oldDown, W.oldDown + 6), seat = oldSeat;
      if (!gasp) atPlace(old, { p: AT_P.recline(t, 4), lay: 0, y: 0 }, seat.x, seat.z - 0.55 * Math.cos(seat.yaw), seat.yaw, seat.y);
      else if (down < 1) atPlace(old, { p: lerpPose(AT_P.oldGasp(t, 1), AT_P.slumpEdge(t, 1), down), lay: 0, y: 0 }, OM.o[0], OM.o[1], OM.oy, seat.y);
      else { const f = [Math.sin(seat.yaw), Math.cos(seat.yaw)]; atLie(old, AT_P.lieLimp(t, 1), [seat.x - f[0] * 0.95, seat.z - f[1] * 0.95], [seat.x + f[0], seat.z + f[1]], seat.y + 0.4); }
      const wd = atEase(s, W.wifeDown, W.wifeDown + 5);
      if (s < atHMS(10, 40)) atPlace(wife, { p: AT_P.sitEdge(t, 5), lay: 0, y: 0 }, wifeSeat.x - OM.f[0] * 0.8, wifeSeat.z - OM.f[1] * 0.8, OM.oy, seat.y);
      else atPlace(wife, { p: wd < 1 ? lerpPose(atBreathe(AT_P.kneel(t, 5), t, 30, 0.8), AT_P.slumpSit(t, 2), wd) : AT_P.slumpSit(t, 2), lay: 0, y: 0 }, OM.w[0], OM.w[1], OM.wy, y15);
    }
    // the barman (behind the bar), the man with his ears, the officer
    { const tf = W.fade(40); atPlace(barman, { p: s < tf ? atBreathe(AT_P.stand(t, 6), t, s > atHMS(10, 35) ? 26 : 14, s > atHMS(10, 35) ? 0.6 : 0) : AT_P.slumpSit(t, 3), lay: 0, y: 0 }, F.bar.x - 1.2, F.bar.z + 1.0, 0, y15); }
    { const tf = W.fade(41); atPlace(jaw, { p: s < atHMS(10, 20) ? AT_P.jaw(t) : s < tf ? atBreathe(AT_P.stand(t, 7), t, 26, 0.6) : AT_P.slumpSit(t, 4), lay: 0, y: 0 }, -24, 9.0, ATPI - 0.6, y15); }
    { const o = set.ofAt; atPlace(officer, { p: AT_P.officer(), lay: 0, y: 0 }, o[0], o[2], ATPI / 2 - 0.15, o[1]); }
    // the crowd
    for (const c of crowd) {
      const P = c.P, tf = c.tf, lim = atEase(s, tf, tf + 4), heavy = MathX.smooth(s, atHMS(10, 33), atHMS(10, 50)), i = c.i;
      if (c.kind === 'pool') { P.root.visible = s < W.poolOut; if (!P.root.visible) continue; atPlace(P, { p: AT_P.pool(t, i), lay: 0, y: 0 }, c.w[0], c.w[1], atR(i, 3) * 6.28, y15 - F.pool.depth); continue; }
      if (c.kind === 'seat') { const q = c.w, f = [Math.sin(q.yaw), Math.cos(q.yaw)];
        if (q.raised) atPlace(P, { p: lim > 0 ? lerpPose(AT_P.recline(t, i), AT_P.slumpRecline(t, i), lim) : atBreathe(AT_P.recline(t, i), t, 14 + 14 * heavy, heavy * 0.6, i), lay: 0, y: 0 }, q.x - f[0] * 0.55, q.z - f[1] * 0.55, q.yaw, q.y);
        else atLie(P, lim > 0 ? AT_P.lieLimp(t, i) : atBreathe(AT_P.lieFlat(t, i), t, 14 + 14 * heavy, heavy * 0.5, i), [q.x - f[0] * 0.95, q.z - f[1] * 0.95], [q.x + f[0], q.z + f[1]], q.y + 0.4);
        continue; }
      if (c.kind === 'stool') { const z = c.w[1]; atPlace(P, { p: lim > 0 ? lerpPose(AT_P.stool(t, i), AT_P.slumpStool(t, i), lim) : atBreathe(AT_P.stool(t, i), t, 14 + 14 * heavy, heavy * 0.6), lay: 0, y: 0 }, c.w[0], z, z > 0 ? ATPI : 0, y15); continue; }
      if (c.kind === 'rail') { const z = c.w[1]; atPlace(P, { p: lim > 0 ? lerpPose(AT_P.rail(t, i), AT_P.slumpSit(t, i), lim) : atBreathe(heavy > 0.3 ? AT_P.handsKnees(t, i) : AT_P.rail(t, i), t, 14 + 16 * heavy, heavy * 0.8), lay: 0, y: lim > 0 ? 0 : 0 }, c.w[0], z - Math.sign(z) * (0.35 + 0.15 * lim), z > 0 ? 0 : ATPI, y15); }
    }
    // the people on the stairs at 10:44 (two of the crowd's looks, climbing; one bent over on the landing)
    // (drawn by the climbers' shot only: they reuse the boy and two crowd people who are elsewhere unseen then)
    { const on = m === 'climbers', q = ST14;
      cl1.root.visible = cl2.root.visible = on;
      if (on) { atPlace(cl1, { p: atBreathe(AT_P.handsKnees(t, 2), t, 34, 1.0), lay: 0, y: 0 }, q.x0 - 0.9, q.z + 0.3, -ATPI / 2 - 0.3, q.y0);
        const p = set.stairAt(q, 6); atPlace(cl2, { p: AT_P.stairSit(t + 1.3), lay: 0, y: 0 }, p[0] + 0.05, q.z - 0.25, ATPI / 2 + 0.2, p[1] - 0.12); }
      boy.root.visible = on || (s < 1 && m === 'title');
      if (on) { const u = MathX.clamp(0.95 - (s - atSC('stairs', 0, -0.6)) / 26, 0, 1); stairWalk(boy, q, u, s * 4, 'up'); }
      else if (m === 'title') {
        // the cannonball: off the pool's corner (−2.6 s), into the water
        const j0 = -2.7, u = MathX.clamp((s - j0) / 0.75, 0, 1), x = MathX.lerp(-9.0, -10.8, u), z = MathX.lerp(-4.8, -2.4, u), yy = y15 + 0.05 + 2.6 * u - 3.6 * u * u - (s > j0 + 0.75 ? 9 : 0);
        const q = AT_P.flinch(0.25); q.lHip = [1.8, 0.1]; q.rHip = [1.8, 0.1]; q.lKnee = 2.3; q.rKnee = 2.3; q.spine = 0.5; atPlace(boy, { p: s < j0 ? AT_P.stand(t, 1) : q, lay: 0, y: 0 }, x, z, 0.4, yy);
      }
    }
  }
  // the extra climbers (crowd 21, 22 are at the windbreak forward: unseen in the climbers' shot)
  // ---- the balloon: r ∝ (p0/p)^(1/3) (its gas expands as the air round it thins), on its string, tugged aft by the wind
  function poseBalloon(s, t, m) {
    const pop = s >= E.balloonPop, on = !pop && s < atHMS(10, 45) && girl.root.visible;
    balloon.visible = knot.visible = on; ring0.visible = on && m === 'balloon';
    const hd = hand(girl, 'ra');
    if (on) {
      const r = 0.16 * Math.pow(1 / ATP.air(s), 1 / 3), L0 = 0.95, sw = 0.12 * Math.sin(t * 1.3), lean = 0.38 + 0.08 * Math.sin(t * 0.9);
      const top = [hd[0] + L0 * Math.sin(lean) + sw * 0.3, hd[1] + L0 * Math.cos(lean), hd[2] + sw];
      atStrut(str, hd, top, 0.003); str.visible = true;
      balloon.scale.setScalar(r); balloon.position.set(top[0] + 0.0, top[1] + r * 1.12, top[2]); knot.position.set(top[0], top[1] + 0.015, top[2]);
      if (ring0.visible) { const r0 = 0.16 * 1.15; ring0.scale.setScalar(r0); ring0.position.copy(balloon.position); ring0.quaternion.copy(camera.quaternion); ring0.material.opacity = 0.75; }
      scrap.visible = false;
    } else if (pop && girl.root.visible && s < atHMS(11, 19)) {
      // the string, a scrap of red rubber on its end, hanging from her hand
      const end = [hd[0] + 0.02, hd[1] - 0.55, hd[2] + 0.04]; atStrut(str, hd, end, 0.003); str.visible = true; scrap.visible = true; scrap.position.set(end[0], end[1], end[2]);
    } else { str.visible = false; scrap.visible = false; }
  }

  // ---- particles ---------------------------------------------------------------------------------------------------
  function fxAll(s, t, m, under) {
    const sv = atSunAt(s).v, a = ATP.air(s), lit = 0.35 + 0.65 * Math.max(0.15, sv[1]);
    // the funnel: a thin heat haze while the engines run well; black smoke as they choke (11:07:20 → the blackout); then nothing
    if (!under) for (const ft of ship.funnelTop) {
      const v = ATV.v(s), R = 12, N = 640;
      for (let i = 0; i < N; i++) {
        const age = (i + ((s * R) % 1)) / R, tb = s - age, black = MathX.smooth(tb, E.choke - 40, E.choke + 4) * (1 - MathX.smooth(tb, E.blackout, E.blackout + 25));
        if (tb > E.blackout + 40) continue;
        const thin = tb < E.blackout ? 1 : 0, alpha = (0.04 * thin + 0.8 * black) * Math.exp(-age / (7 + 30 * black)) * MathX.smooth(age, 0, 0.3);
        if (alpha < 0.004) continue;
        const pid = Math.floor(s * R) - i + 100000, sd = atR(pid, 9), x = ft[0] + (v + 1.5) * age + 3.0 * noise1(age * 0.35, sd * 50) * Math.sqrt(age), y = ft[1] + 2.6 * Math.pow(age, 0.72) + 2.4 * noise1(age * 0.3, sd * 30) * Math.sqrt(age), z = ft[2] + 3.2 * noise1(age * 0.25, sd * 70) * Math.sqrt(age);
        const sz = (0.8 + 1.8 * black + (0.3 + 0.75 * black) * age) * (0.7 + 0.6 * atR(pid, 19)), g = black > 0.1 ? 0.07 + 0.05 * atR(pid, 39) : 0.75;
        puffs.add(x, y, z, sz, Math.min(0.9, alpha * (0.7 + 0.6 * atR(pid, 29))), g * lit, g * lit * 0.95, g * lit * 0.9);
      }
    }
    // the cannonball's splash (the title)
    // (a crown of drops thrown out and up, a white column in the middle, and the spray falling back)
    if (m === 'title') { const u = s - (-2.7 + 0.72); if (u > 0 && u < 2.6) {
      for (let i = 0; i < 220; i++) { const ang = atR(i, 11) * 6.283, col = i < 60, sp = col ? 0.3 + 0.5 * atR(i, 12) : 1.4 + atR(i, 12) * 2.8, up = col ? 4.5 + 2.5 * atR(i, 13) : 2.6 + atR(i, 13) * 3.8, tt = u - 0.05 * atR(i, 15);
        if (tt <= 0) continue;
        const x = -10.8 + Math.cos(ang) * sp * tt, z = -2.4 + Math.sin(ang) * sp * tt, y = deck.pool.y + up * tt - 4.9 * tt * tt; if (y < deck.pool.y - 0.02) continue;
        puffs.add(x, y, z, (col ? 0.2 : 0.09) + (col ? 0.25 : 0.14) * atR(i, 14) + 0.08 * tt, 0.85 * (1 - u / 2.6), 0.94, 0.97, 1.0); }
      // the white water where he went in
      for (let i = 0; i < 40; i++) { const ang = atR(i, 16) * 6.283, r = (0.3 + 1.6 * Math.sqrt(atR(i, 17))) * Math.min(1, u * 2.5); puffs.add(-10.8 + Math.cos(ang) * r, deck.pool.y + 0.04, -2.4 + Math.sin(ang) * r, 0.35 + 0.3 * atR(i, 18), 0.6 * (1 - u / 2.6), 0.95, 0.98, 1.0); } } }
    // the backward roll's splash off the platform's end (you two go in together)
    if (m === 'roll') { const u = s - E.roll + 0.06; if (u > 0 && u < 3.0) { for (const [z0, sd] of [[0.7, 0], [-0.05, 1]]) {
      for (let i = 0; i < 130; i++) { const ang = atR(i, 31 + sd) * 6.283, col = i < 40, sp = col ? 0.2 + 0.4 * atR(i, 32 + sd) : 0.9 + atR(i, 32 + sd) * 1.8, up = col ? 3.2 + 1.8 * atR(i, 33 + sd) : 1.8 + atR(i, 33 + sd) * 2.6, tt = u - 0.05 * atR(i, 35 + sd);
        if (tt <= 0) continue; const x = Mr.x1 + 0.65 + Math.cos(ang) * sp * tt, z = z0 + Math.sin(ang) * sp * tt, y = 0.05 + up * tt - 4.9 * tt * tt; if (y < 0) continue;
        puffs.add(x, y, z, (col ? 0.14 : 0.07) + 0.12 * atR(i, 34 + sd) + 0.06 * tt, 0.8 * (1 - u / 3.0), 0.94, 0.97, 1.0); }
      for (let i = 0; i < 30; i++) { const ang = atR(i, 36 + sd) * 6.283, r = (0.2 + 1.1 * Math.sqrt(atR(i, 37 + sd))) * Math.min(1, u * 2.2); const wx = Mr.x1 + 0.65 + Math.cos(ang) * r, wz = z0 + Math.sin(ang) * r; puffs.add(wx, atSwellY(wx, wz, t, ATV.dist(s)) + 0.12, wz, 0.18 + 0.14 * atR(i, 38 + sd), 0.5 * (1 - u / 3.0), 0.95, 0.98, 1.0); } } } }
    // the balloon bursting: red shreds flying
    { const u = s - E.balloonPop; if (u > 0 && u < 1.4 && !under) { const c = balloon.position; for (let i = 0; i < 26; i++) { const d = atN3([atR(i, 21) - 0.5, atR(i, 22) - 0.3, atR(i, 23) - 0.5]), sp = 2.5 + 3 * atR(i, 24);
      puffs.add(c.x + d[0] * sp * u, c.y + d[1] * sp * u - 3 * u * u, c.z + d[2] * sp * u, 0.03 + 0.03 * atR(i, 25), 0.95 * (1 - u / 1.4), 0.75, 0.05, 0.08); } } }
    // the drinks foaming over (from 10:20, strongest at 10:35, still at 11:00)
    if (!under && (m === 'bar' || m === 'glass' || m === 'terrace')) { const f = MathX.smooth(s, atHMS(10, 20), atHMS(10, 34)) * (1 - MathX.smooth(s, atHMS(11, 5), atHMS(11, 30)));
      deck.glasses.forEach((g, gi) => { if (g.kind === 1 && f < 0.2) return; const n = Math.round(18 * f); for (let i = 0; i < n; i++) { const ph = (t * (0.35 + 0.2 * atR(i, gi)) + atR(i, 41 + gi)) % 1, ang = atR(i, 42 + gi) * 6.283, rr = g.r * (0.3 + 0.8 * atR(i, 43));
        const over = ph > 0.5 ? (ph - 0.5) * 2 : 0, x = g.x + Math.cos(ang) * (rr + over * 0.01), z = g.z + Math.sin(ang) * (rr + over * 0.01), y = g.y + 0.02 + 0.05 * Math.min(ph * 2, 1) - 0.14 * over;
        puffs.add(x, y + 0.02 * f, z, 0.006 + 0.006 * atR(i, 44), 0.8, g.kind === 0 ? 0.82 : 0.95, g.kind === 0 ? 0.72 : 0.92, g.kind === 0 ? 0.6 : 0.85); } }); }
    // steam: the hot tubs (2:26 on), the pool (3:27 on), the sea (3:39 on); faint in the sun, white
    if (!under) {
      const st = (x, y, z, R, k, n, seed) => { for (let i = 0; i < n; i++) { const ph = (t * 0.22 + atR(i, seed)) % 1, ang = atR(i, seed + 1) * 6.283, r = R * Math.sqrt(atR(i, seed + 2));
        puffs.add(x + Math.cos(ang) * r + 1.4 * ph * ph, y + 0.1 + 2.6 * ph, z + Math.sin(ang) * r, 0.35 + 1.4 * ph, k * 0.38 * Math.sin(ph * ATPI), 0.9 * lit, 0.92 * lit, 0.95 * lit); } };
      deck.tubs.forEach((tb, i) => { const k = MathX.smooth(s, E.tub + i * 4, E.tub + i * 4 + 10); if (k > 0) st(tb.x, tb.y, tb.z, 1.3, k, 40, 50 + i * 5); });
      { const k = MathX.smooth(s, E.pool, E.pool + 10); if (k > 0) for (let j = 0; j < 6; j++) st(MathX.lerp(F.pool.x0 + 1.5, F.pool.x1 - 1.5, j / 5), deck.pool.y, 0, 3.3, k, 34, 80 + j * 3); }
      { const k = MathX.smooth(s, E.sea - 0.3, E.sea + 3); if (k > 0) { const c = camera.position; for (let i = 0; i < 260; i++) { const ph = (t * 0.18 + atR(i, 91)) % 1, x = c.x + (atR(i, 92) - 0.3) * 90, z = c.z + (atR(i, 93) - 0.5) * 90;
        if (x > F.bow - 5 && x < F.stern + 0.5 && Math.abs(z) < F.B / 2 + 1) continue; puffs.add(x, 0.2 + 1.8 * ph, z, 0.8 + 2.2 * ph, k * (m === 'seaBoil' ? 0.06 : 0.22) * Math.sin(ph * ATPI), 0.85 * lit, 0.88 * lit, 0.92 * lit); } } }
    }
    // the boiling sea (seen from just over it): vapour domes swelling out of the surface and bursting into spray, all
    // over the water in front of the lens, densest close by; the hull's own patch of sea left out
    if (!under && m === 'seaBoil') { const k = MathX.smooth(s, E.sea - 0.3, E.sea + 2.5), c = camera.position, fw = new THREE.Vector3(); camera.getWorldDirection(fw);
      const fa = Math.atan2(fw.z, fw.x), sh = (x, z) => x > F.bow - 3 && x < F.stern + 1 && Math.abs(z) < F.B / 2 + 0.8;
      for (let i = 0; i < 1100; i++) { const rate = 1.1 + 1.1 * atR(i, 121), cy = t * rate + atR(i, 122), cyc = Math.floor(cy), ph = cy - cyc, sd = i * 7 + cyc;
        const r = 1.5 + 55 * Math.pow(atR(sd, 123), 1.9), an = fa + (atR(sd, 124) - 0.5) * 1.9, x = c.x + Math.cos(an) * r, z = c.z + Math.sin(an) * r;
        if (sh(x, z) || atR(sd, 126) > k) continue;
        const sw = atSwellY(x, z, t, ATV.dist(s)), R0 = (0.05 + 0.3 * Math.pow(atR(sd, 125), 2)) * (1 + r / 22);
        if (ph < 0.62) { const g = Math.sqrt(ph / 0.62); if (domes.count < 1400) { domeO.position.set(x, sw - R0 * 0.25 * (1 - g), z); domeO.scale.set(R0 * g, R0 * g * (0.55 + 0.4 * g), R0 * g); domeO.updateMatrix(); domes.setMatrixAt(domes.count++, domeO.matrix); } }
        else { const u = (ph - 0.62) / 0.38; for (let j = 0; j < 3; j++) { const da = atR(sd, 127 + j) * 6.283, up = 1.2 + 2.2 * atR(sd, 130 + j);
          puffs.add(x + Math.cos(da) * R0 * 1.6 * u, sw + up * u * 0.5 - 1.6 * u * u * 0.5, z + Math.sin(da) * R0 * 1.6 * u, R0 * 0.32, 0.8 * (1 - u), 0.95 * lit, 0.97 * lit, 1.0 * lit); } } }
      // low sheets of vapour streaming off the surface, lit by the sun
      for (let i = 0; i < 160; i++) { const ph = (t * 0.16 + atR(i, 141)) % 1, r = 4 + 50 * Math.pow(atR(i, 142), 1.4), an = fa + (atR(i, 143) - 0.5) * 1.9, x = c.x + Math.cos(an) * r + 3 * ph, z = c.z + Math.sin(an) * r;
        if (sh(x, z)) continue; puffs.add(x, 0.15 + 1.1 * ph, z, (1.4 + 2.6 * ph) * (1 + r / 40), k * 0.09 * Math.sin(ph * ATPI), 0.9 * lit, 0.92 * lit, 0.95 * lit); } }
    // under water: your and her exhaled breath (a burst every few seconds, the bubbles growing as they rise: Boyle's law,
    // with the thin air on top: at the surface they're (1.02 + a)/a times bigger than at 10 m); the roll's white water
    if (under) {
      // nothing small drifts right past the lens (a bubble 20 cm from the camera fills the frame as a glowing orb)
      const cp = camera.position, nearF = (x, y, z) => MathX.clamp((Math.hypot(x - cp.x, y - cp.y, z - cp.z) - 0.8) / 0.9, 0, 1);
      const surf = (y) => { const pw = 1.0156 * MathX.clamp(-y / 10.1, 0, 2) + a; return Math.pow((1.0156 + a) / pw, 1 / 3); };
      const breath = (P, per, ph0, seed) => { if (!P.root.visible) return; const h = head(P), cyc = (s + ph0) / per, nb = Math.floor(cyc);
        for (let b = nb - 2; b <= nb; b++) { const age = (cyc - b) * per - 0.0; if (age < 0) continue; for (let i = 0; i < 22; i++) { const sd = b * 31 + i, up = 0.35 + 0.5 * atR(sd, seed), tt = age * (0.9 + 0.3 * atR(sd, seed + 1)), y = h[1] - 0.06 + up * tt * 1.2;
          if (y > -0.1) continue; const x = h[0] + 0.06 + 0.12 * Math.sin(tt * 4 + sd) + 0.15 * (atR(sd, seed + 2) - 0.5) * tt, z = h[2] + 0.1 + 0.12 * Math.cos(tt * 3.3 + sd) + 0.15 * (atR(sd, seed + 3) - 0.5) * tt;
          const nf = nearF(x, y, z); if (nf <= 0) continue; puffs.add(x, y, z, (0.012 + 0.03 * atR(sd, seed + 4)) * surf(y), 0.85 * nf, 0.78, 0.9, 0.98); } } };
      breath(youS, 5.0, 0.0, 61); breath(girlS, 3.6, 1.7, 71);
      // the props' wash while the ship is under way (10:46)
      if (m === 'underEst') for (const sd of [1, -1]) for (let i = 0; i < 160; i++) { const ph = (t * 0.9 + atR(i, 81 + sd)) % 1, x = 121 + 30 * ph, y = AT_HULL.keelY(126) - 2.6 + 1.5 * (atR(i, 83) - 0.5) + 2 * ph, z = sd * 7.6 + 2.2 * (atR(i, 84) - 0.5) * (1 + ph);
        puffs.add(x, y, z, 0.05 + 0.25 * ph, 0.6 * (1 - ph), 0.85, 0.92, 0.98); }
      // the roll's entry: a cloud of white bubbles round you two, rising
      { const u = s - E.roll; if (u > 0 && u < 12) { const c = W.you(s) || W.pairYou; for (let i = 0; i < 240; i++) { const age = (u * 1.0 + atR(i, 85) * 2) % 3, y = c[1] + 1.2 + age * 1.6 - 1.5 * atR(i, 86); if (y > -0.08) continue;
        puffs.add(c[0] + 1.6 * (atR(i, 87) - 0.5), y, c[2] + 1.6 * (atR(i, 88) - 0.5), 0.02 + 0.06 * atR(i, 89), 0.8 * (1 - u / 12), 0.85, 0.93, 1.0); } } }
      // dust in the water (plankton), drifting: the sense of depth
      { const c = camera.position; for (let i = 0; i < 260; i++) { const x = c.x + ((atR(i, 95) * 24 + s * 0.05) % 24) - 12, y = c.y + ((atR(i, 96) * 16 + s * 0.03) % 16) - 8, z = c.z + ((atR(i, 97) * 24) % 24) - 12; if (y > -0.2) continue;
        const nf = nearF(x, y, z); if (nf > 0) puffs.add(x, y, z, 0.012, 0.5 * nf, 0.75, 0.85, 0.85); } }
      // the boiling sea seen from below: bursting vapour pockets just under the surface
      { const k = MathX.smooth(s, E.sea, E.sea + 8); if (k > 0) { const c = camera.position; for (let i = 0; i < 220; i++) { const ph = (t * 0.6 + atR(i, 98)) % 1, x = c.x + (atR(i, 99) - 0.5) * 36, z = c.z + (atR(i, 100) - 0.5) * 36;
        puffs.add(x, -0.15 - 0.7 * (1 - ph) * atR(i, 101), z, 0.04 + 0.12 * ph, k * 0.35 * Math.sin(ph * ATPI), 0.55, 0.66, 0.72); } } }
    }
    void glow;
  }

  // ---- labels pinned to things: [{ p, text, sub, a }]
  const Lb = (p, text, sub, a = 1, side) => ({ p, text, sub, a, side });
  set.labels = (t) => {
    const s = set._s, m = set._mode, sh = FILM._shot, w = sh ? StoryHUD.win(t, sh.t0 + 0.5, sh.t1 - 0.2, 0.3, 0.2) : 0;
    if (!w) return [];
    if (m === 'balloon') { const b = balloon.position, r = balloon.scale.x; return [Lb([b.x + r * 1.05, b.y, b.z], 'HER BALLOON', `+${Math.round((1 / ATP.air(s) - 1) * 100)}% BIGGER THAN AT 10:00`, w, 'r')]; }
    if (m === 'swell') { const tb = deck.tables[0]; return [Lb([tb[0] - 0.05, y15 + 0.6, tb[1]], 'CRISP PACKET', 'SEALED AT SEA LEVEL', w)]; }
    if (m === 'rack') { const r = deck.shop.rack[0]; return [Lb([r[0], 2.0, r[2]], '6 × 12 LITRES', 'AT 200 bar', w)]; }
    if (m === 'down13') return [Lb([F.marina.x1 - 2, F.marina.y + 0.6, 0], 'DECK 2', 'THE DIVE SHOP', w)];
    if (m === 'funnel') return [Lb([ship.funnelTop[0][0] + 1, ship.funnelTop[0][1] + 2, ship.funnelTop[0][2]], 'THE FUNNEL', 'TOO LITTLE OXYGEN TO BURN THE FUEL', w, 'r')];
    if (m === 'lineUW') { const p = line.at(s, line.dep[2]); return [Lb([p[0] + 0.3, p[1], p[2]], 'YOUR 6 TANKS', '8.6 TO 11.6 m DOWN', w)]; }
    if (m === 'sharkIn') { const q = set.sharkAt(s); if (q) return [Lb([q.p[0], q.p[1] - 0.7, q.p[2]], 'OCEANIC WHITETIP', 'ABOUT 2.6 m', w, 'r')]; }   // (under it: clear of the air panel)
    if (m === 'stars') { const v = atSunAt(s).v, c = camera.position; return [Lb([c.x + v[0] * 2000, c.y + v[1] * 2000, c.z + v[2] * 2000], 'THE SUN', 'THE SKY AROUND IT: ALMOST BLACK', w)]; }
    // (the officer's shot has no label: the HUD's panel says it, and a label there printed over it)
    if (m === 'tub') { const tb = deck.tubs[1]; return [Lb([tb.x, tb.y + 0.1, tb.z], 'HOT TUB', '39 °C · BOILING', w)]; }
    return [];
  };
  // ---- the look: above water (tropical, bright → stark), under water (blue, soft), the last minutes before you pass out
  set.grade = (t, p, shot) => {
    const s = set._s, a = set._a, m = shot.mode;
    if (set._under) { p.exposure = 1.0; p.saturation = 0.95; p.contrast = 1.08; p.warmth = -0.3; p.blackLift = 0.01; p.vignette = 0.66; p.soft = 0.16; p.bloom = 0.42; p.bloomThreshold = 0.9; p.grain = 0.03; return; }
    p.exposure = 1.0 + 0.04 * (1 - a); p.saturation = 1.06 - 0.12 * (1 - a); p.contrast = 1.06 + 0.1 * (1 - a); p.warmth = 0.12 * a; p.vignette = 0.5 + 0.12 * (1 - a);
    if (m === 'pov') { const k = MathX.smooth(t - shot.t0, 0, 2.5); p.tunnel = 0.62 - 0.12 * k; p.tunnelSoft = 0.35; p.tunnelDark = 0.85; p.soft = 0.35; p.saturation = 0.6; }
    if (m === 'marina' || m === 'girlMask' || m === 'roll') { p.tunnel = 0.95; p.tunnelSoft = 0.5; p.tunnelDark = 0.4; p.saturation = 0.85; }
  };
  return set;
}

AT_SETS.ship = (app) => atShipSet(app);
