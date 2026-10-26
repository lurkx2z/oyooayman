/* =====================================================================
   STREET — your high street (an old terrace of shops and houses) running 800 m down to the church. You stand on the
   right-hand pavement at z = 0 looking down the street (−z); traffic keeps left, so the lane next to you brings cars
   towards you (+z). Every sound is drawn as rings (rings.js) from where it was really made, at the real speed.
     cold      3 PM: you walk with the Saturday crowd; every footstep a little sonic boom
     walk      11:00: you walk to the shops; cars both ways, their rings squeezed in front
     siren     the ambulance comes towards you and passes
     silent    11:41: cars faster than their sound (their rings trail behind in a cone)
     after     one passes close: the crack, then its sound from both sides
     backwards the music car
     noon      the church bell rings 800 m away; its ring crawls down the street (75 s)
     ball      a hard kick: the ball's cone
     horizon   from above the town: the bell's ring, spreading and slowing
     wind      1 PM: your friend shouts from downwind; the breeze carries every ring away from you
     van       2 PM: you step behind a parked van
     ears      a sound from your left
     walkers   3 PM: the crowd, every step cracking
   ===================================================================== */

const SS_SS = { HR: 4.2, PV: 3.6, x: 4.2 + 1.4, church: [0, 0, -805], bell: [0, 27, -797], wind: [0, -6] };
const SS_SS_KID = [-4.6, 0, -14];                       // the boy who kicks the ball (far pavement)
const SS_SS_FRIEND = [SS_SS.x + 0.4, 0, -15];           // your friend, 15 m down the pavement (downwind)
// cars that matter (lane x, speed m/s (+z: towards you), the film time it passes z = 0)
const SS_SS_CARS = {
  amb: { x: 2.0, v: 13.2, at: () => SS.sirenPass },
  close: { x: 2.0, v: 14.5, at: () => SS.carPass },
  music: { x: 2.0, v: 18, at: () => SS.musicPass },
};
const ssCarZ = (c, t) => (t - c.at()) * c.v;            // where a car is along the street (0 = level with you)
// the crowd walks in three stretches of the film (the cold open, 11:00, 1 PM to 3 PM): each person's z is centred on
// the middle of the stretch they are in (they are off screen in between)
const SS_SS_CROWD = [[-2, 14], [SS.eleven - 1, SS.siren], [SS.one - 1, SS.four + 0.5]];
function ssCrowdZ(W, t) { let a = SS_SS_CROWD[0]; for (const c of SS_SS_CROWD) if (t >= c[0] - 1) a = c; return W.z0 + W.v * (t - (a[0] + a[1]) / 2); }

// the rest of the traffic (both ways, 30 mph give or take), looping along the street; the sound renders the same cars
const SS_SS_TRAFFIC = Array.from({ length: 16 }, (_, i) => { const dir = i % 2 ? -1 : 1; return { dir, x: dir > 0 ? 2.0 : -2.0, ph: (i >> 1) * 58 + ssR(i, 9) * 24, v: SSP.car * (0.95 + 0.1 * ssR(i, 4)) }; });
function ssTrafficZ(T, t) { const span = 520, u = (((t + T.ph) * T.v % span) + span) % span; return T.dir > 0 ? -400 + u : 120 - u; }

Object.assign(ACTIONS, {
  // shouting with a hand cupped to the mouth, the other waving
  ssShout(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.4); p.lSh = [1.25 * k, 0.15]; p.lEl = 1.9 * k; p.rSh = [1.5 * k + 0.1, 0.45 * k]; p.rEl = 0.6 + 0.35 * Math.sin(τ * 7) * k; p.neck = -0.12 * k; p.spine = -0.05 * k; p.headYaw = 0; return p; },
  // a kick: the right leg swings through
  ssKick(τ, c) { const p = ACTIONS.idle(τ, c), s = MathX.clamp(τ / 0.35, 0, 1), sw = s < 0.5 ? -0.9 * s * 2 : -0.9 + 2.4 * (s - 0.5) * 2; p.rHip = [sw * (1 - MathX.smooth(τ, 0.6, 1.1)), 0.05]; p.rKnee = 0.6 * (1 - s); p.spine = -0.1; p.lSh = [0.4, 0.5]; p.rSh = [-0.3, 0.3]; return p; },
});
Object.assign(BLEND, { ssShout: 0.3, ssKick: 0.06 });
Object.assign(LOOKS, {
  ssFriend: { skin: 3, build: 'slim', shirt: '#c85a3a', sleeves: 'long', pants: '#2a2c34', shoes: '#e8e4dc', sole: '#f4f2ec', hair: '#1a120c', hairStyle: 'long', jacket: true, scarf: '#e8c24a' },
  ssKid: { skin: 1, build: 'slim', shirt: '#2a5aa8', sleeves: 'short', pants: '#1c1e24', shoes: '#e8e4dc', sole: '#f4f2ec', hair: '#6a4a2a' },
});

// a church: nave, tower, spire, in pale stone (seen from 800 m, so simple)
function ssChurch(parent) {
  const g = new THREE.Group(), st = ssStd('#9a8e7a', 0.9), roof = ssStd('#2c2c34', 0.8), dark = ssStd('#2a2826', 0.9);
  ssBox(14, 13, 34, st, 0, 6.5, -14, g); const r = ssBox(15, 15, 35, roof, 0, 13, -14, g); r.rotation.z = Math.PI / 4; r.scale.set(0.68, 0.68, 1);
  ssBox(9, 30, 9, st, 0, 15, 4, g); ssBox(9.6, 1.2, 9.6, st, 0, 30.2, 4, g);
  const sp = ssMesh(new THREE.ConeGeometry(5.2, 26, 8), roof, 0, 43.5, 4, g); sp.rotation.y = Math.PI / 8;
  for (const y of [8, 20, 26]) ssBox(0.2, 3.2, 1.6, dark, 0, y, 8.55, g).rotation.y = Math.PI / 2;
  ssBox(1.2, 2.2, 0.2, ssStd('#d8c070', 0.4, 0.6), 0, 22, 8.6, g);     // (the clock face)
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  parent.add(g); return g;
}
// a flat ring on the ground (a sound's front where it meets the ground), radius 1, scaled
function ssGroundRing(scene, col = '#ffd7a8', w = 0.012) {
  const m = new THREE.Mesh(new THREE.RingGeometry(1 - w, 1, 256), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, fog: false, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 7; scene.add(m); return m;
}

SS_SETS.street = (app) => {
  const S = ssSet(app, { sky: '#9ab4d4', fov: 55, near: 0.03, far: 20000, fog: 0.0006, fogColor: '#c4ced8', hemi: ['#d6e2f0', '#8a7a66', 0.7],
    sun: [-35, 80, -45], sunColor: '#fff1dc', sunI: 2.6, shadow: 2048, shadowR: 40, shadowFar: 260 });
  const { scene, camera: cam } = S, K = ssK, A = SS_SS;
  const sky = ssSky(scene, '#4f7fb8', '#c6d6e6', '#8a8680', { sunDir: [-0.4, 0.8, -0.45], sunGlow: '#fff2d8', hw: 0.3, r: 15000 });
  sky.material.fog = false;
  scene.environment = ssEnv(app.renderer, '#a8c0dc', '#e2dcd2', '#7a6e60');
  const VF = new VehicleFactory();
  // ---- the high street (to z = −690), a green square, the church; the land around (for the view from above)
  const ST = ssStreet(scene, { len: 860, zMid: -269.5, kind: 'terrace', seed: 33, night: false, crossingZ: 60, halfRoad: A.HR, pave: A.PV, parked: false });
  const land = ssMesh(new THREE.PlaneGeometry(30000, 30000), ssStd('#6f7a5a', 0.95), 0, -0.4, 0, scene); land.rotation.x = -Math.PI / 2; land.castShadow = false;
  const sq = ssMesh(new THREE.PlaneGeometry(80, 120), ssStd('#5f7a44', 0.95), 0, -0.05, -770, scene); sq.rotation.x = -Math.PI / 2; sq.castShadow = false;
  const roadOn = ssMesh(new THREE.PlaneGeometry(2 * A.HR, 90), ssStd('#3a3a3c', 0.8), 0, -0.02, -720, scene); roadOn.rotation.x = -Math.PI / 2; roadOn.castShadow = false;
  ssChurch(scene).position.set(...A.church);
  // the rest of the town seen from above: blocks of roofs either side, in rows (instanced)
  {
    const N = 900, geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), mat = ssStd('#8a7a6a', 0.9), im = new THREE.InstancedMesh(geo, mat, N), m4 = new THREE.Matrix4(), col = new THREE.Color();
    let n = 0;
    for (let i = 0; i < 4000 && n < N; i++) {
      const x = (ssR(i, 21) - 0.5) * 2600, z = (ssR(i, 22) - 0.5) * 2600 - 300;
      if (Math.abs(x) < A.HR + A.PV + 16 && z > -700 && z < 180) continue;          // (the street itself)
      if (Math.hypot(x, z + 790) < 70 || Math.hypot(x, z) > 1300) continue;
      const w = 8 + 10 * ssR(i, 23), d = 8 + 14 * ssR(i, 24), h = 6 + 6 * ssR(i, 25);
      m4.makeScale(w, h, d).setPosition(x, 0, z); im.setMatrixAt(n, m4); im.setColorAt(n, col.set(['#8a6a5a', '#7a6a62', '#9a8a7a', '#6a5a52'][i % 4])); n++;
    }
    im.count = n; im.castShadow = false; im.receiveShadow = true; scene.add(im);
  }
  // ---- traffic: the cars that matter (above), plus the rest, both ways
  const car = (type, color) => { const c = VF.build(type, color); c.group.traverse((m) => { if (m.isMesh) m.castShadow = true; }); c.tail.emissiveIntensity = 0; scene.add(c.group); return c; };
  const amb = car('van', '#f2f0ea');
  { // (an ambulance: a yellow-green band, blue lights on the roof)
    const band = ssBox(5.32, 0.32, 2.06, ssStd('#c8e02a', 0.5), 0, 1.15, 0, amb.group); band.castShadow = false;
    amb.blue = ssStd('#1030ff', 0.3, 0, { emissive: new THREE.Color('#2a50ff'), emissiveIntensity: 0 });
    for (const z of [-0.6, 0.6]) ssBox(0.3, 0.16, 0.45, amb.blue, 2.0, 2.45, z, amb.group);
  }
  const closeCar = car('hatch', '#2e3a4c'), musicCar = car('sedan', '#b82a24');
  const traffic = SS_SS_TRAFFIC.map((T, i) => Object.assign({ c: car(['sedan', 'hatch', 'suv', 'sedan', 'van', 'hatch', 'pickup', 'ev'][i % 8], ['#e8e6e0', '#1f2226', '#8a8f94', '#2e3a4c', '#6a2a2a', '#c9c6be', '#304a3a', '#3a3a40'][(i * 3) % 8]) }, T));
  VF.m.head.emissiveIntensity = 0;
  const parked = [];
  for (const [ty, col, sx, z] of [['hatch', '#8a8f94', -1, 6], ['sedan', '#3a3a40', -1, -9], ['suv', '#1f2226', -1, -31], ['hatch', '#c9c6be', -1, -52], ['sedan', '#7a6a50', -1, -70], ['hatch', '#304a3a', 1, -64], ['sedan', '#6a2a2a', 1, -90]]) {
    const c = car(ty, col); c.group.position.set(sx * (A.HR - 1.05), 0, z); c.group.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; parked.push(c);
  }
  // the van you step behind (2 PM), parked at your kerb
  const van = car('van', '#e8e6e0'); van.group.position.set(A.HR - 1.05, 0, -6); van.group.rotation.y = -Math.PI / 2;
  // ---- people: the crowd on both pavements (two speeds of a Saturday stroll), your friend, the boy with the ball
  const walkers = [];
  const looks = ['casual1', 'casual5', 'ssWalker', 'casual7', 'ssShopper', 'casual3', 'casual6', 'ssStudent1', 'casual8', 'ssStudent2', 'casual4', 'ssVisitor'];
  for (let i = 0; i < 26; i++) {
    const right = i % 2 === 0, lane = right ? A.HR + 0.9 + 1.6 * ssR(i, 31) : -(A.HR + 0.8 + 2.0 * ssR(i, 32)), v = (ssR(i, 33) < 0.5 ? 1 : -1) * (1.25 + 0.3 * ssR(i, 34)), z0 = -70 + 80 * ssR(i, 35);
    if (right && Math.abs(lane - A.x) < 0.55) continue;                                // (not through you)
    const W = { x: lane, v, z0, look: looks[i % looks.length], stride: 1.25 + 0.15 * ssR(i, 36) };
    W.p = ssPerson({ id: 'ssW' + i, look: W.look, y: 0.15, path: SS_SS_CROWD.flatMap(([a0, a1]) => [[a0, lane, ...[ssCrowdZ(W, a0)]], [a1, lane, ssCrowdZ(W, a1)]]), states: [[-100, 'walk']], stride: W.stride }, scene);
    W.p.root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    walkers.push(W);
  }
  const friend = ssPerson({ id: 'ssFr', look: 'ssFriend', y: 0.15, path: [[0, SS_SS_FRIEND[0], SS_SS_FRIEND[2]]], face: 180, states: [[0, 'idle'], [SS.shout - 0.4, 'ssShout'], [SS.shout + 3.2, 'idle']] }, scene);
  const kid = ssPerson({ id: 'ssKid', look: 'ssKid', y: 0.15, path: [[0, SS_SS_KID[0], SS_SS_KID[2]]], face: 120, states: [[0, 'idle'], [SS.kick - 0.3, 'ssKick'], [SS.kick + 1.2, 'idle']] }, scene);
  for (const p of [friend, kid]) p.root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  const ball = ssMesh(new THREE.IcosahedronGeometry(0.11, 2), ssStd('#f4f2ec', 0.5), 0, 0, 0, scene);
  // the kick: from the boy's foot up the street (−z) and across, 25 m/s, a gentle arc
  const BALL = { v: 25, dir: ssN3([0.35, 0, -1]) };
  const ballAt = (te) => { const d = Math.max(0, te - SS.kick); const s = BALL.v * d; return [SS_SS_KID[0] + 0.3 + BALL.dir[0] * s, 0.26 + Math.max(0, 3.2 * d - 4.9 * d * d), SS_SS_KID[2] - 0.2 + BALL.dir[2] * s]; };
  // ---- the rings, the bell's ring on the ground, leaves in the wind
  const R = ssRings(scene, 1400);
  const bellRing = ssGroundRing(scene, '#ffd7a8', 0.01);
  const leaves = ssPuffs(scene, 400, { soft: 0.6 });

  // where a walker is (and the moments they put a foot down)
  const wPos = (W, t) => [W.x, 0.17, ssCrowdZ(W, t)];
  const stepEvery = (W) => W.stride / 2 / Math.abs(W.v);
  // you, walking down the right pavement (cold open, 11:00)
  const youWalk = (t, t0) => [A.x, 1.62 + 0.025 * Math.abs(Math.sin((t - t0) * 1.4 / 0.66 * Math.PI)), 6 - 1.4 * (t - t0)];
  // a car's world position and rotation
  const placeCar = (c, x, z, dirZ) => { c.group.position.set(x, 0, z); c.group.rotation.y = dirZ > 0 ? -Math.PI / 2 : Math.PI / 2; };
  // the rings of a moving car (its engine, at its middle)
  const carShells = (C, t, o = {}) => ssShells(R, t, Object.assign({ src: (te) => [C.x, 0.7, ssCarZ(C, te)], every: 0.22, from: t - 12, life: 12, alpha: 0.42, maxR: 120 }, o));

  const set = {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, h = ssH(t);
      let pos = [A.x, 1.62, 0], at = [A.x - 1.5, 1.4, -40], fov = 55, drift = 0.006, roll = 0;
      R.begin(); leaves.begin();
      bellRing.visible = false; ball.visible = false; friend.root.visible = false; kid.root.visible = false;
      amb.group.visible = false; closeCar.group.visible = false; musicCar.group.visible = false; van.group.visible = m === 'van' || m === 'ears' || m === 'walkers';
      amb.blue.emissiveIntensity = 0;
      cam.near = 0.1; cam.far = 20000; scene.fog.density = 0.0006;
      // the crowd (from 3 PM the steps make rings; at 11:00 the crowd is quieter, no rings)
      const busy = m === 'cold' || m === 'walkers' || m === 'walk' || m === 'van' || m === 'ears' || m === 'wind';
      for (const W of walkers) { W.p.root.visible = busy; if (busy) W.p.update(t); }
      // background traffic (thinned to nothing when the scene is about one car; none at 3 PM)
      const tr = m === 'walk' || m === 'silent' || m === 'van' ? 1 : 0;
      traffic.forEach((T, i) => {
        const vis = tr && (m !== 'silent' || i < 6);
        T.c.group.visible = !!vis; if (!vis) return;
        const z = ssTrafficZ(T, t);
        placeCar(T.c, T.x, z, T.dir);
        if (m === 'walk' || m === 'silent') { if (Math.abs(z) < 90) ssShells(R, t, { src: (te) => [T.x, 0.7, z - T.dir * T.v * (t - te)], every: 0.25, from: t - 7, life: 7, alpha: 0.3, maxR: 100 }); }
      });

      if (m === 'cold' || m === 'walkers' || m === 'ears') {
        // every step: a ring from the foot that made it (walkers outpace their rings from 3 PM)
        const near = (W) => Math.abs(wPos(W, t)[2] - (m === 'cold' ? youWalk(t, -1)[2] : 0)) < 45;
        for (const W of walkers) {
          if (!near(W)) continue;
          const e = stepEvery(W);
          ssShells(R, t, { src: (te) => wPos(W, te), every: e, from: t - 9 - ((t - 9) % e), life: 9, alpha: 0.2, maxR: 8, fadeR: 8 });
        }
        if (m === 'cold') {
          pos = youWalk(t, -1); at = [pos[0] - 2.2, 1.35, pos[2] - 30]; fov = 56;
          ssShells(R, t, { src: (te) => { const p = youWalk(te, -1); return [p[0], 0.17, p[2]]; }, every: 0.47, from: t - 9 - ((t - 9) % 0.47), life: 9, alpha: 0.28, maxR: 14, fadeR: 14 });
        } else if (m === 'walkers') {
          const k = K(t, SS.three, SS.four);
          pos = ssV([A.x - 0.2, 2.3, 4], [A.x - 0.6, 2.3, 1], k); at = [-1, 0.6, -22]; fov = 62;
        } else {
          // (ears: you turn your head to the left, where a sound starts)
          const k = K(t, SS.ears + 0.6, SS.ears + 2.4);
          pos = [A.x, 1.62, 0]; at = ssV([A.x - 1.5, 1.4, -40], [-20, 1.4, -6], k); fov = 58;
        }
      } else if (m === 'walk') {
        pos = youWalk(t, SS.eleven); at = [pos[0] - 2.4, 1.4, pos[2] - 40]; fov = 56;
      } else if (m === 'siren') {
        const C = SS_SS_CARS.amb, z = ssCarZ(C, t);
        amb.group.visible = true; placeCar(amb, C.x, z, 1); amb.blue.emissiveIntensity = Math.sin(t * 22) > 0 ? 3 : 0.2;
        carShells(C, t, { every: 0.16, alpha: 0.5 });
        const k = K(t, SS.sirenPass - 1.2, SS.sirenPass + 1.4);
        pos = [A.x + 0.2, 1.62, 1.5]; at = ssV([C.x, 1.3, Math.min(-6, z - 4)], [C.x - 1, 1.2, z + 20], k); fov = ssLerp(40, 58, K(t, SS.siren, SS.sirenPass - 1.5));
      } else if (m === 'silent' || m === 'after' || m === 'backwards') {
        const C = m === 'backwards' ? SS_SS_CARS.music : SS_SS_CARS.close, cc = m === 'backwards' ? musicCar : closeCar, z = ssCarZ(C, t);
        if (m !== 'silent') { cc.group.visible = true; placeCar(cc, C.x, z, 1); carShells(C, t, { every: m === 'backwards' ? 0.12 : 0.18, alpha: 0.5, col: m === 'backwards' ? SS_RING_BLUE : SS_RING_COL }); }
        if (m === 'silent') { pos = [A.x + 0.2, 1.62, 1.5]; at = [0.5, 1.2, -60]; fov = 46; }
        else {
          const pass = m === 'backwards' ? SS.musicPass : SS.carPass, k = K(t, pass - 0.5, pass + 1.2);
          pos = [A.x + 0.2, 1.62, 1.5]; at = ssV([C.x, 1.2, Math.min(-8, z - 6)], [C.x - 2, 1.1, z + 18], k); fov = 52;
          const dc = t - (pass + 0.08); if (m === 'after' && dc > 0 && dc < 0.8) { const s = Math.exp(-dc * 7) * Math.sin(dc * 80); at = [at[0], at[1] + 0.08 * s, at[2]]; roll = 0.4 * s; }
        }
      } else if (m === 'noon' || m === 'horizon') {
        // the bell's ring: a ring on the ground (where its sound front meets the ground) and the shell above it
        if (t >= SS.bell) {
          const r = ssDist(ssH(SS.bell), h);
          bellRing.visible = true; bellRing.scale.setScalar(Math.max(0.5, r)); bellRing.position.set(A.bell[0], 0.25, A.bell[2]);
          ssShells(R, t, { src: () => A.bell, every: 0.8, from: SS.bell, to: SS.bell + 4, life: 1e9, alpha: 0.5 });
        }
        if (m === 'noon') {
          const k = K(t, SS.noon, SS.bell - 0.3), back = K(t, SS.bellHeard - 1.5, SS.bellHeard + 0.5);
          pos = [3.0, 1.62, 1]; at = ssV([1, 3, -200], [0, 38, -805], k); at = ssV(at, [0, 6, -120], back); fov = ssLerp(ssLerp(50, 14, k), 54, back); drift = 0.002;
          const hit = t - SS.bellHeard; if (hit > 0 && hit < 1.2) roll = 0.25 * Math.exp(-hit * 4) * Math.sin(hit * 30);
        } else {
          const k = K(t, SS.flying, SS.one);
          pos = ssV([300, 1400, 600], [500, 4200, 900], Ease.inOutSine(k)); at = ssV([0, 0, -700], [0, 0, -800], k); fov = 56; cam.near = 5; drift = 0; scene.fog.density = 0.00004;
        }
      } else if (m === 'ball') {
        kid.root.visible = true; kid.update(t);
        ball.visible = true; ball.position.set(...ballAt(t)); ball.rotation.set(t * 20, t * 13, 0);
        ssShells(R, t, { src: ballAt, every: 0.04, from: SS.kick, to: SS.kick + 1.6, life: 8, alpha: 0.42, maxR: 60 });
        const k = K(t, SS.kick - 0.1, SS.kick + 1.4);
        pos = [A.x - 0.3, 1.62, 3]; at = ssV([SS_SS_KID[0], 0.8, SS_SS_KID[2]], [SS_SS_KID[0] + 4, 1, SS_SS_KID[2] - 30], k); fov = 54;
      } else if (m === 'wind') {
        // the wind blows from you towards her: every ring she makes drifts away faster than it spreads
        friend.root.visible = true; friend.update(t);
        const mouth = [SS_SS_FRIEND[0], 1.72, SS_SS_FRIEND[2]];
        ssShells(R, t, { src: () => mouth, every: 0.12, from: SS.shout, to: SS.shout + 2.4, life: 14, alpha: 0.5, wind: A.wind });
        for (let i = 0; i < 120; i++) { const ph = (t * 0.9 + ssR(i, 41)) % 1, x = A.x - 4 + 8 * ssR(i, 42), y = 0.2 + 2.5 * ssR(i, 43) + 0.3 * Math.sin(t * 3 + i); leaves.add(x, y, 4 + A.wind[1] * 6 * ph, 0.05, 0.5 * Math.sin(Math.PI * ph), 0.6, 0.5, 0.25); }
        pos = [A.x - 0.2, 1.62, 2]; at = [SS_SS_FRIEND[0] - 0.3, 1.5, SS_SS_FRIEND[2]]; fov = ssLerp(52, 40, K(t, SS.one, SS.shout));
      } else if (m === 'van') {
        // you walk along and step in behind the van (the street's noise now goes past it, not round it)
        const k = K(t, SS.behind - 1.6, SS.behind + 0.4);
        pos = ssV([A.x + 0.4, 1.62, 6], [A.HR + 0.35, 1.62, -3.4], k); at = ssV([A.x - 1, 1.4, -30], [A.HR - 0.6, 1.3, -6.5], k); fov = 56;
      }
      ssCam(cam, (() => { const d = ssDrift(t, drift, 0.3, 17); return [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]]; })(), at, fov, roll);
      // the sun: a little lower as the afternoon goes on; the shadow box follows you
      const H = 7 + h, sd = ssN3([-0.4 + 0.12 * (H - 12), 0.8 - 0.05 * Math.abs(H - 13), -0.45]);
      S.sun.position.set(pos[0] + sd[0] * 90, Math.max(20, sd[1] * 90), pos[2] + sd[2] * 90); S.sun.target.position.set(pos[0], 0, pos[2] - 10); S.sun.target.updateMatrixWorld();
      sky.material.uniforms.sd.value.set(...sd).normalize();
      R.end(); leaves.end();
    },
    labels(t) {
      const m = ssShotAt(t).mode, out = [], W = StoryHUD.win;
      if (m === 'noon') out.push({ p: [A.bell[0] + 6, A.bell[1] + 8, A.bell[2]], text: 'THE CHURCH', sub: '800 m AWAY', a: W(t, SS.noon + 1.5, SS.bellHeard - 2, 0.3, 0.3) });
      if (m === 'siren') { const z = ssCarZ(SS_SS_CARS.amb, t); out.push({ p: [SS_SS_CARS.amb.x, 3.4, z], text: 'AMBULANCE', sub: '13 m/s', a: W(t, SS.siren + 0.5, SS.sirenPass - 2.2, 0.3, 0.3) }); }
      if (m === 'wind') out.push({ p: [SS_SS_FRIEND[0], 2.4, SS_SS_FRIEND[2]], text: 'YOUR FRIEND', sub: '15 m · DOWNWIND', a: W(t, SS.one + 0.8, SS.two - 0.4, 0.3, 0.3) });
      if (m === 'ball') out.push({ p: ballAt(Math.max(t, SS.kick + 0.15)), text: 'THE BALL', sub: '25 m/s', a: W(t, SS.kick + 0.3, SS.flying - 0.3, 0.2, 0.3) });
      if (m === 'horizon') out.push({ p: [A.bell[0], 40, A.bell[2]], text: 'THE NOON BELL', sub: ssFmtDist(ssDist(5, ssH(t))) + ' SO FAR', a: W(t, SS.flying + 0.5, SS.one - 0.3, 0.3, 0.3) });
      return out;
    },
    grade(t, p, shot) {
      const H = 7 + ssH(t);
      p.warmth = H > 14.5 ? 0.06 : 0.03;
      if (shot.mode === 'horizon') { p.contrast = 1.05; p.saturation = 0.95; }
    },
  };
  return set;
};
