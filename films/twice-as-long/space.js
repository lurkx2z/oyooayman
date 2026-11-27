/* =====================================================================
   SPACE SET — from step 21 (you're in space) to step 56 (Proxima Centauri), and the Sun six billion years on.
   One frame for everything: the tangent frame at Central Park (x east, y up, z south; the Earth's centre 6,371 km
   below). Your path is the straight line of sky.js (twSkyPos), forever. Every position is worked out relative to you
   in double precision, then relative to the shot's origin (you, or the thing the shot looks at), so the GPU never
   sees a big number. Far bodies are drawn as background at their true direction and angular size (cosmos.js).
   The Moon, Mars, Jupiter, Saturn, Pluto, Voyager 1, the Station and Proxima are placed on (beside) your path at
   their real distances (the honest tag says so); the Sun and the Earth are where they really are.
   The stars carry your speed: aberration and Doppler from twBetaAt (steps.js).
   ===================================================================== */

const TW_AU = 1.496e11;
const TW_HEAD3 = (() => { const v = new THREE.Vector3(TW_SKY_HEAD[0], TW_CLIMB, TW_SKY_HEAD[1]); return v.normalize(); })();
const TW_SIDE3 = new THREE.Vector3(-TW_SKY_HEAD[1], 0, TW_SKY_HEAD[0]).normalize();            // (to your left)
const TW_UP3 = new THREE.Vector3(0, 1, 0).sub(TW_HEAD3.clone().multiplyScalar(TW_HEAD3.y)).normalize();
// distance along your path (the measure twSkyPos uses), and when you reach a given distance
const twPathD = (t) => Math.max(0, twDist(t) - twSum(14));
function twPassT(dB) { let lo = TW_T[15], hi = TW.end + 20; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (twPathD(m) < dB) lo = m; else hi = m; } return (lo + hi) / 2; }
// a point on (beside) your path, relative to you at time t: dB metres along it, then side / up offsets
function twOnPath(t, dB, side = 0, up = 0) {
  const k = dB - twPathD(t), H = [TW_SKY_HEAD[0], TW_CLIMB, TW_SKY_HEAD[1]];
  return [H[0] * k + TW_SIDE3.x * side + TW_UP3.x * up, H[1] * k + TW_SIDE3.y * side + TW_UP3.y * up, H[2] * k + TW_SIDE3.z * side + TW_UP3.z * up];
}
// the Earth's centre and the Sun, relative to you
function twEarthRel(t) { const p = twSkyPos(t); return [-p[0], -TW_R - p[1], -p[2]]; }
function twSunRel(t) { const e = twEarthRel(t), s = TW_SUN; return [e[0] + s[0] * TW_AU, e[1] + s[1] * TW_AU, e[2] + s[2] * TW_AU]; }
// the things on your path: [distance along it, side, up] (m)
const TW_ON = {
  moon: [384.4e6, 21e6, 2e6], mars: [54.6e9, 22e6, 6e6], jupiter: [1.2e12, -4.2e8, 0.6e8], saturn: [2.45e12, 5.2e8, 1.3e8], pluto: [7.6e12, -1.1e7, 2e6],
  voyager: [25.4e12, 26, 5], proxima: [4.01e16, 1.4e9, 2e8],
};
// the Station: where your path climbs through 400 km, 45 m under it and 22 m to the side
const TW_ISS_D = (() => { let lo = 0, hi = 5e6; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2, r = Math.hypot(m * TW_SKY_HEAD[0], m * TW_SKY_HEAD[1]), a = Math.hypot(r, TW_R + m * TW_CLIMB) - TW_R; if (a < 400e3) lo = m; else hi = m; } return lo; })();
TW_ON.iss = [TW_ISS_D, -22, -45];

TW_SETS.space = (app) => {
  const S = twSet(app, { sky: '#000000', fov: 50, near: 0.05, far: 1e7, hemi: ['#3a4a66', '#0a0c10', 0.25], sun: [1, 0, 0], sunColor: '#fff6ea', sunI: 3.2, env: ['#0a0e18', '#141a26', '#05070a'] });
  const scene = S.scene, cam = S.camera;
  const sky = twStarSky(scene, 9000, 5);
  const B = {
    earth: twBody(scene, 'earth', { halo: '#5aa0ff', haloS: 1.045 }), moon: twBody(scene, 'moon'), mars: twBody(scene, 'mars', { halo: '#e0a080', haloS: 1.02, haloK: 0.3 }),
    jupiter: twBody(scene, 'jupiter'), saturn: twBody(scene, 'saturn'), pluto: twBody(scene, 'pluto'),
    sun: twBody(scene, 'star', { halo: '#ffd9a0', haloS: 4.5, star: true, haloK: 1.6 }), proxima: twBody(scene, 'star', { halo: '#ff5a2a', haloS: 3.2, star: true, haloK: 1.1 }),
    giant: twBody(scene, 'giant', { halo: '#ff5a20', haloS: 1.5, star: true, haloK: 0.9 }), burnt: twBody(scene, 'burnt'),
  };
  const rings = twRings(scene);
  const iss = twISS(scene), voy = twVoyager(scene);
  const you = new YouCharacter(scene, { seed: 11 }); you.cup(false);
  const watch = twWatch(you);
  // the astronaut on a spacewalk (the channel's character rig in a white suit; a clear helmet, so the face reads)
  const astro = new YouCharacter(scene, { id: 'Astro', seed: 4, look: { skin: 4, shirt: '#eceae4', pants: '#e4e2dc', shoes: '#d8d6d0', sole: '#bcbab4', jacket: false, collar: false, inner: '#eceae4', backpack: '#e0ded8', hair: '#151010', gloves: '#e8e6e0' } });
  {
    const hm = new THREE.MeshStandardMaterial({ color: '#cfe4ff', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, envMapIntensity: 2 });
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.205, 32, 24), hm); helm.position.set(0, 0.02, 0.02); astro.j.head.add(helm);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.212, 32, 16, Math.PI * 0.5, Math.PI, 0, Math.PI), twStd('#f2f0ea', 0.5)); back.position.copy(helm.position); astro.j.head.add(back);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 8, 32), twStd('#d8d6d0', 0.5, 0.3)); rim.position.set(0, -0.1, 0.02); rim.rotation.x = Math.PI / 2; astro.j.head.add(rim);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.26), twStd('#ecebe6', 0.6)); pack.position.set(0, 0.32, -0.24); astro.j.spine.add(pack);
    helm.renderOrder = 9;
  }
  const soft = twPuffs(scene, 3000, { soft: 1.4 }), adds = twPuffs(scene, 4000, { additive: true, soft: 1.6 });
  const fill = new THREE.DirectionalLight('#dfe8ff', 1.2); scene.add(fill); scene.add(fill.target);
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const H = TW_HEAD3, SD = TW_SIDE3, UP = TW_UP3;
  const rel = (f, s, u) => [H.x * f + SD.x * s + UP.x * u, H.y * f + SD.y * s + UP.y * u, H.z * f + SD.z * s + UP.z * u];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const n3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const yawY = Math.atan2(H.x, H.z);
  // the Earth's orientation: Central Park straight up, the North Pole tilted north (−z) by the latitude
  const EARTH_AX = (() => {
    const la = TW_LL0[0] * Math.PI / 180, lo = TW_LL0[1] * Math.PI / 180;
    const w1 = new THREE.Vector3(0, 1, 0), w2 = new THREE.Vector3(0, Math.sin(la), -Math.cos(la));
    const e1 = new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)), e2 = new THREE.Vector3(0, 1, 0);
    const o2 = (a, b) => b.clone().sub(a.clone().multiplyScalar(a.dot(b))).normalize();
    const w2p = o2(w1, w2), w3 = new THREE.Vector3().crossVectors(w1, w2p), e2p = o2(e1, e2), e3 = new THREE.Vector3().crossVectors(e1, e2p);
    const Mw = new THREE.Matrix3().set(w1.x, w2p.x, w3.x, w1.y, w2p.y, w3.y, w1.z, w2p.z, w3.z), Me = new THREE.Matrix3().set(e1.x, e2p.x, e3.x, e1.y, e2p.y, e3.y, e1.z, e2p.z, e3.z);
    return Me.multiply(Mw.transpose());
  })();
  const ID3 = new THREE.Matrix3();
  // when you pass each thing on your path
  const PASS = {}; for (const k in TW_ON) PASS[k] = twPassT(TW_ON[k][0]);

  // ---- you: a stride for every step (a long leap), drifting while you wait; the shot can override
  function youPose(t, o = {}) {
    const s = twStepAt(t), held = s.n >= 21 && TW_D[s.n] < TW_T[s.n + 1] - TW_T[s.n] - 1e-6;
    let p;
    if (o.pose) p = o.pose;
    else if (s.n >= 15 && s.u < 1) p = YOU_POSES.leap(0.12 + 0.76 * s.u, { lead: s.n % 2 ? 1 : -1, reach: 0.9, arms: 'swing' });
    else { const k = MathX.smooth(t - (TW_T[s.n] + TW_D[s.n]), 0, 0.8); p = YouCharacter.mix(YOU_POSES.leap(0.88, { lead: s.n % 2 ? 1 : -1, reach: 0.9 }), YOU_POSES.drift(t), k); }
    if (o.neck !== undefined) p.neck = o.neck;
    if (o.headYaw !== undefined) p.headYaw = o.headYaw;
    return p;
  }
  // a pose: looking at your watch (left arm up across the chest)
  const watchPose = (t, k = 1) => { const p = YOU_POSES.drift(t); const w = { lSh: [1.15, -0.55], lEl: 1.85, neck: 0.42, headYaw: 0.42, spine: 0.08 }; for (const key in w) p[key] = Array.isArray(w[key]) ? [MathX.lerp(p[key][0], w[key][0], k), MathX.lerp(p[key][1], w[key][1], k)] : MathX.lerp(p[key], w[key], k); return p; };
  const phonePose = (t) => { const p = YOU_POSES.drift(t); p.rSh = [0.95, 0.18]; p.rEl = 1.55; p.neck = 0.45; p.headYaw = -0.15; p.spine = 0.1; return p; };

  // ---- the shots: mode → (t, u, shot) → a stage { O, cam: { p, at, fov, roll }, you, bodies, … }
  //   O: the scene's origin relative to you (default: you). Every position below is relative to O.
  const portrait = (key, R, dirFrom, dist, fov, aim = [0, 0]) => (t, u) => {
    const on = TW_ON[key], O = twOnPath(t, on[0], on[1], on[2]);
    return { O, cam: { p: mul3(n3(dirFrom), dist * R), at: [0, 0, 0], fov, aim }, you: { on: false } };
  };
  const STAGE = {
    space: (t, u) => ({ cam: { p: rel(-3.4 + 0.35 * u, 2.6, 1.3), at: rel(0.8, 0, -0.3), fov: 52 }, you: { expr: 'awe' }, glow: 1 - MathX.smooth(t, TW_T[20] + 0.6, TW_T[21] + 0.5) }),
    push: (t, u) => ({ cam: { p: rel(-0.6 + 0.15 * u, -4.4, -0.35), at: rel(0.15, 0, -0.3), fov: 44 }, you: { expr: 'determined' } }),
    station: (t, u) => {
      const O = twOnPath(t, TW_ON.iss[0], TW_ON.iss[1], TW_ON.iss[2]);
      return { O, cam: { p: rel(-58 + 3 * u, -36, 6), at: rel(2, 0, -16), fov: 46 }, you: { on: false }, iss: true, tracer: { key: 'iss', w: 1.2 },
        labels: [{ at: rel(0, 0, 9), text: 'SPACE STATION', sub: '400 KM UP', a: twWin(t, shot0(t) + 0.3, 1e9, 0.3) }] };
    },
    ninemin: (t, u) => {
      const O = twOnPath(t, TW_ON.iss[0], TW_ON.iss[1], TW_ON.iss[2]);
      return { O, cam: { p: rel(2.6 + 0.2 * u, 1.6, 10.7), at: rel(0, -1.4, 10.2), fov: 38 }, you: { on: false }, iss: true, astro: [0, -1.4, 10.4], tracer: { key: 'iss', w: 1.2 } };
    },
    radius: (t, u) => earthWide(t, u, 0),
    across: (t, u) => earthWide(t, u, 1),
    look: (t, u) => {
      const e = n3(twEarthRel(t));
      return { cam: { p: add3(rel(1.7 - 0.15 * u, -0.85, 0.75), mul3(e, -0.2)), at: mul3(e, 12), fov: 44, aim: [0.12, 0.03] }, you: { turn: MathX.smooth(u, 0.2, 1.8), pose: YOU_POSES.lookBack(t, 1 - MathX.smooth(u, 0.4, 1.8), -1), expr: u < 2.2 ? 'awe' : 'sad', look: mul3(e, 1000) },
        labels: [{ key: 'earth', text: 'HOME', sub: '8 BILLION PEOPLE', a: twWin(t, shot0(t) + 2.0, 1e9, 0.4) }] };
    },
    fifty: (t, u) => ({ cam: { p: rel(4.8 - 0.3 * u, -1.1, 0.7), at: rel(-1, 0.25, 0.2), fov: 44 }, you: { expr: 'determined' }, streak: 0.15 }),
    moon: (t, u) => ({ cam: { p: rel(0.5, -3.9, 0.35), at: rel(0.4, 0, 0.15), fov: 50 }, you: { expr: t < PASS.moon + 0.2 ? 'determined' : 'shock' },
      labels: [{ key: 'moon', text: 'THE MOON', sub: '384,400 KM FROM EARTH', a: twWin(t, PASS.moon - 0.5, 1e9, 0.2) }] }),
    problem: (t, u) => ({ cam: { p: rel(1.25, -0.45, 0.82), at: rel(0, 0, 0.75), fov: 28 }, you: { expr: 'worry', pose: YouCharacter.mix(YOU_POSES.drift(t), YOU_POSES.stand(t), 0.5) } }),
    barrier: (t, u) => ({ cam: { p: rel(2.6, -1.7, 1.3), at: rel(-9, 0.6, -1.3), fov: 46, aim: [0, -0.16] }, you: { expr: 'worry' },
      labels: [{ key: 'moon', text: 'THE MOON', a: twWin(t, shot0(t) + 0.3, 1e9, 0.3) }, { key: 'earth', text: 'EARTH', a: twWin(t, shot0(t) + 0.6, 1e9, 0.3) }] }),
    nothing: (t, u) => ({ cam: { p: rel(-4.0 + 0.6 * u, -1.4, 0.9), at: rel(6, 1.2, 0.6), fov: 52 }, you: { expr: 'shock', look: rel(40, 4, 1) }, beam: u,
      labels: [{ beamHead: true, text: 'LIGHT', sub: '300,000 KM EVERY SECOND', a: twWin(t, shot0(t) + 0.5, 1e9, 0.2) }] }),
    time: (t, u) => ({ watchCam: true, you: { pose: watchPose(t, 1), expr: 'worry' } }),
    clocks: (t, u) => ({ cam: { p: rel(2.4, 1.4, 0.95), at: rel(0, 0, 0.6), fov: 40, aim: [-0.33, 0] }, you: { pose: watchPose(t, 1 - MathX.smooth(u, 5.0, 6.0)), expr: 'worry' } }),
    earth: (t, u) => ({ cam: { p: rel(2.8, 1.8, 0.9), at: rel(0, 0, 0.4), fov: 42, aim: [-0.33, 0] }, you: { expr: 'determined' }, streak: 0.25 }),
    issAge: (t, u) => {
      const O = twOnPath(t, TW_ON.iss[0], TW_ON.iss[1], TW_ON.iss[2]);
      return { O, cam: { p: rel(4.2 + 0.3 * u, 3.4, 11.6), at: rel(0, -1.4, 10.3), fov: 44, aim: [0.18, 0] }, you: { on: false }, iss: true, astro: [0, -1.4, 10.4], earthTime: true };
    },
    outward: (t, u) => ({ cam: { p: rel(-3.0, 0.75, 1.05), at: rel(8, -0.2, 0.3), fov: 58 }, you: { expr: 'determined' }, streak: 0.35 }),
    mars: portrait('mars', 3.39e6, [-0.35, 0.25, 0.9], 3.6, 46, [0.12, 0]),
    marstime: (t, u) => ({ cam: { p: rel(2.2, 1.9, 0.5), at: rel(0, 0, 0.2), fov: 44, aim: [-0.3, 0] }, you: { pose: watchPose(t, MathX.smooth(u, 0.5, 1.6)), expr: 'awe' } }),
    sun: (t, u) => { const L = n3(twSunRel(t)); return { cam: { p: add3(mul3(L, -90 + 2 * u), rel(0, 1.6, 0.35)), at: add3(mul3(L, 10), rel(0, 0.75, 0.35)), fov: 3.2 }, you: { expr: 'awe', look: mul3(L, 1000) }, sunPoint: 1, labels: [{ key: 'sun', text: 'THE SUN', a: twWin(t, shot0(t) + 0.6, 1e9, 0.3) }] }; },
    light8: (t, u) => { const L = n3(twSunRel(t)); return { cam: { p: add3(mul3(L, -44 - u), rel(0, 1.2, -0.6)), at: add3(mul3(L, 10), rel(0, 0, 0.3)), fov: 7.5, aim: [0, -0.022] }, you: { expr: 'determined', look: mul3(L, 1000) }, sunPoint: 1 }; },
    jupiter: portrait('jupiter', 6.99e7, [0.3, 0.12, 0.95], 3.3, 48, [-0.08, 0]),
    saturn: portrait('saturn', 5.82e7, [-0.6, 0.35, 0.75], 5.6, 44, [0.0, 0.02]),
    pluto: portrait('pluto', 1.188e6, [0.5, 0.2, 0.85], 3.2, 44, [0.05, 0]),
    boss: (t, u) => ({ cam: { p: rel(1.9, 1.5, 0.75), at: rel(0, 0, 0.75), fov: 34, aim: [-0.32, 0] }, you: { pose: phonePose(t), expr: 'sad', phone: true } }),
    voyager: (t, u) => {
      const on = TW_ON.voyager, O = twOnPath(t, on[0], on[1], on[2]);
      return { O, cam: { p: rel(-6.5 + 0.5 * u, -8.5, 2.6), at: rel(0.5, 0, 0.3), fov: 40 }, you: { on: false }, voyager: true, tracer: { key: 'voyager', w: 0.5 },
        labels: [{ at: [0, 3.4, 0], text: 'VOYAGER 1', sub: 'LAUNCHED IN 1977', a: twWin(t, shot0(t) + 0.4, 1e9, 0.3) }] };
    },
    caught: (t, u) => {
      const on = TW_ON.voyager, O = twOnPath(t, on[0], on[1], on[2]);
      return { O, cam: { p: rel(-11 - 4 * u, -14 - 3 * u, 4.5), at: rel(0.5, 0, -2.6), fov: 40 }, you: { on: false }, voyager: true };
    },
    day: (t, u) => ({ cam: { p: rel(2.6, 2.0, 0.8), at: rel(0, 0, 0.3), fov: 44, aim: [-0.3, 0] }, you: { expr: 'determined' }, streak: 0.3 }),
    star: (t, u) => { const L = n3(twSunRel(t)); return { cam: { p: add3(add3(mul3(L, -3.2), rel(0, -0.9, 1.25)), [0, 0, 0]), at: add3(mul3(L, 30), [0, 0, 0]), fov: 40, aim: [0.1, 0.02] }, you: { pose: YOU_POSES.lookBack(t, 1, 1), expr: 'sad', look: mul3(L, 1000) }, sunPoint: 1,
      labels: [{ key: 'sun', text: 'THE SUN', a: twWin(t, shot0(t) + 0.8, 1e9, 0.4) }] }; },
    month: (t, u) => ({ cam: { p: rel(1.5, 0.55, 0.85), at: rel(0, 0, 0.72), fov: 30 }, you: { expr: 'sad' } }),
    ninemonths: (t, u) => ({ cam: { p: rel(-2.6 + 0.4 * u, -1.2, -0.6), at: rel(6, 0.3, 1.2), fov: 60 }, you: { expr: 'determined' }, streak: 0.5 }),
    proxima: portrait('proxima', 1.07e8, [-0.2, 0.3, 0.92], 5.0, 46, [0.1, 0]),
    sixyears: (t, u) => { const L = n3(twSunRel(t)); return { cam: { p: add3(mul3(L, -3.0), rel(0, 1.0, 1.1)), at: mul3(L, 30), fov: 42, aim: [-0.12, 0.02] }, you: { pose: YOU_POSES.lookBack(t, 1, -1), expr: 'sad', look: mul3(L, 1000) }, sunPoint: 1,
      labels: [{ key: 'sun', text: 'HOME', a: twWin(t, shot0(t) + 0.8, 1e9, 0.4) }] }; },
    redgiant: (t, u) => future(t, u, 0),
    swallow: (t, u) => future(t, u, 1),
  };
  const shot0 = (t) => (set._shot ? set._shot.t0 : t);
  // the Earth from far away, your path leaving it (the diagram sits on the right)
  function earthWide(t, u, which) {
    const E = twEarthRel(t), up = [0, 1, 0], sunD = TW_SUN, dir = n3(add3(add3(up, mul3(sunD, 0.8)), mul3([SD.x, SD.y, SD.z], 0.9)));
    const dist = which ? 52e6 : 38e6, p = add3(E, mul3(dir, dist + 2e6 * u));
    const mid = add3(mul3(E, 0.62), mul3([0, 0, 0], 0.38));
    return { O: [0, 0, 0], cam: { p, at: mid, fov: 40, aim: [0.32, 0.02] }, you: { on: false }, path: true, still: true, labels: [{ youDot: true, text: 'YOU', a: twWin(t, shot0(t) + 0.5, 1e9, 0.3), you: true }] };
  }
  // six billion years on: the Sun a red giant, the Earth at its edge
  function future(t, u, which) {
    // (its own little frame: the giant at the origin, the Earth 1 AU out; the camera beyond the Earth)
    return { future: which, cam: null, you: { on: false } };
  }

  // a far point drawn about the camera (as the bodies are): [position, scale]
  const comp = (q, cp) => { const r = sub3(q, cp), d = Math.hypot(...r), k = d > TW_FAR ? TW_FAR / d : 1; return [add3(cp, mul3(r, k)), k]; };
  // your path from d0 to d1 (m along it) as a glowing line, w: its width as an angle (rad)
  function pathLine(t, d0, d1, n, O, cp, w, a, col) {
    for (let i = 0; i <= n; i++) {
      const f = i / n, q = sub3(twOnPath(t, d0 + (d1 - d0) * f, 0, 0), O), dc = Math.hypot(...sub3(q, cp)), [qq, k] = comp(q, cp);
      adds.add(qq[0], qq[1], qq[2], Math.max(0.02, dc * w) * k, a * (0.35 + 0.65 * f), col[0], col[1], col[2]);
    }
  }
  const set = {
    scene, camera: cam, _B: B, _adds: adds,
    frame(t, shot) {
      set._t = t; set._shot = shot;
      const mode = shot.mode, u = t - shot.t0;
      TW_PX = app.renderer.domElement.height || 1080;
      const st = (STAGE[mode] || STAGE.space)(t, u, shot);
      const O = st.O || [0, 0, 0];
      // ---- the camera (relative to O; `aim` turns it after aiming: [yaw, pitch] in radians)
      if (st.future !== undefined) return frameFuture(t, u, shot, st);
      // ---- you
      const yon = st.you.on !== false, yp = sub3([0, 0, 0], O);
      you.visible(yon); astro.visible(!!st.astro);
      if (yon) {
        you.place(yp[0] - UP.x * 0.95, yp[1] - UP.y * 0.95, yp[2] - UP.z * 0.95, yawY + Math.PI * (st.you.turn || 0), 0, 0);
        you.pose(youPose(t, { pose: st.you.pose }), ['relax', 'relax']);
        you.expr(st.you.expr || 'determined', t, 1); you.look(st.you.look ? V(sub3(st.you.look, O)) : null);
        you.phone(!!st.you.phone);
        watch.set(t * 1.0, true);
      }
      // ---- the camera
      let cp, ca, fov = 50;
      if (st.watchCam) {
        const w = new THREE.Vector3(), nrm = new THREE.Vector3(1, 0, 0); watch.G.getWorldPosition(w);
        nrm.applyQuaternion(watch.G.getWorldQuaternion(new THREE.Quaternion())).normalize();
        const side2 = new THREE.Vector3().crossVectors(nrm, UP).normalize();
        cp = w.clone().addScaledVector(nrm, 0.3 - 0.03 * u).addScaledVector(side2, 0.08).addScaledVector(UP, 0.06); ca = w.clone(); fov = 34;
        twCam(cam, cp.toArray(), ca.toArray(), fov);
      } else {
        const dr = twDrift(t, 0.02, 0.5, 5);
        cp = add3(st.cam.p, dr); ca = st.cam.at; fov = st.cam.fov;
        twCam(cam, cp, ca, fov);
        if (st.cam.aim) { cam.rotateOnWorldAxis(new THREE.Vector3(...cam.up.toArray()), st.cam.aim[0]); cam.rotateX(st.cam.aim[1]); cam.updateMatrixWorld(true); }
        cp = cam.position.toArray();
      }
      cam.near = 0.05; cam.far = 1e7; cam.updateProjectionMatrix();
      // ---- the bodies (true positions relative to O), far first
      const E = sub3(twEarthRel(t), O), SN = sub3(twSunRel(t), O), L = (p) => n3(sub3(SN, p));
      const list = [];
      const tE = twEarthS(t), spin = -tE * 6.2832 / 86164;
      list.push([B.earth, E, TW_R, { spin, ax: EARTH_AX, t: t }]);
      list.push([B.sun, SN, 6.96e8, { col: '#fff1d8', I: 3.2, t }]);
      for (const k of ['moon', 'mars', 'jupiter', 'saturn', 'pluto', 'proxima']) {
        const on = TW_ON[k], p = sub3(twOnPath(t, on[0], on[1], on[2]), O);
        const R = { moon: 1.737e6, mars: 3.39e6, jupiter: 6.99e7, saturn: 5.82e7, pluto: 1.188e6, proxima: 1.07e8 }[k];
        list.push([B[k], p, R, k === 'proxima' ? { col: '#ff5528', I: 1.25, t } : { spin: k === 'jupiter' ? t * 0.02 : k === 'moon' ? 2.4 : 0.6, ax: ID3, t }]);
      }
      B.giant.hide(); B.burnt.hide();
      const camV = cam;
      list.sort((a, b) => Math.hypot(...sub3(b[1], cp)) - Math.hypot(...sub3(a[1], cp)));
      list.forEach(([b, p, R, o], i) => {
        const isStar = b === B.sun || b === B.proxima;
        b.set(p, R, isStar ? [0, 1, 0] : L(p), Object.assign({ rank: i, cam: camV }, o));
      });
      // the Sun from very far: a point of light that never shrinks below a few pixels
      // Saturn's rings (tilted 27° to its path round the Sun; here: to your path)
      { const sp = B.saturn.mesh.position; rings.set(B.saturn, L(sub3(twOnPath(t, ...TW_ON.saturn), O)), [0.32, 0.9, 0.28], B.saturn.mesh.visible); }
      // ---- the lights: the Sun on you and on the Station; a little earthshine near home
      const Ly = L([0, 0, 0]);
      S.sun.position.set(Ly[0] * 100 + yp[0], Ly[1] * 100 + yp[1], Ly[2] * 100 + yp[2]); S.sun.target.position.set(yp[0], yp[1], yp[2]); S.sun.target.updateMatrixWorld();
      const dE = Math.hypot(...E);
      S.hemi.intensity = 0.35 + 0.5 * Math.exp(-dE / 3e7); S.hemi.color.set('#7a96c8'); S.hemi.groundColor.set('#141820');
      // (a soft light from the camera's side, so you always read against black)
      const fa = Array.isArray(ca) ? ca : ca.toArray(); fill.position.set(cp[0], cp[1] + 0.6, cp[2]); fill.target.position.set(fa[0], fa[1], fa[2]); fill.target.updateMatrixWorld(); fill.intensity = st.astro ? 0.55 : st.O ? 0.5 : 1.25;
      // ---- the stars: your speed bends them forwards
      const beta = st.O ? 0 : twBetaAt(t), sk = st.streak ?? 0;   // (shots that look at something else are at rest)
      sky.set(cam, [H.x, H.y, H.z], Math.min(beta, 0.94), { streak: sk * MathX.smooth(beta, 0.05, 0.5), bright: dE < 4e7 ? 0.55 : 0.9, band: 1 });
      // ---- the Station, Voyager, the astronaut
      iss.visible = !!st.iss;
      if (st.iss) {
        const ip = sub3(twOnPath(t, TW_ON.iss[0], TW_ON.iss[1], TW_ON.iss[2]), O), upI = n3(sub3(ip, E));
        iss.position.set(...ip); iss.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(n3([SD.x, SD.y, SD.z])), V(upI), V(n3([H.x, H.y, H.z]).map((v) => -v))));
        iss.updateMatrixWorld(true);
      }
      if (st.astro) {
        const ap = add3(sub3(twOnPath(t, TW_ON.iss[0], TW_ON.iss[1], TW_ON.iss[2]), O), [0, 0, 0]);
        const a3 = rel(...st.astro);
        const pos = add3(ap, a3);
        const tc = sub3(cp, pos), ayaw = Math.atan2(tc[0], tc[2]) + 0.55;
        astro.place(pos[0] - UP.x * 0.95, pos[1] - UP.y * 0.95, pos[2] - UP.z * 0.95, ayaw, 0, -0.08);
        const tp = PASS.iss, k = MathX.smooth(t - tp, 0.15, 0.9);
        const ap0 = YOU_POSES.drift(t); ap0.rSh = [1.1, 0.4]; ap0.rEl = 0.5; ap0.lSh = [0.9, 0.3]; ap0.lEl = 0.7;
        ap0.neck = -0.5 * k - 0.05; ap0.headYaw = 0.35 * k;
        if (mode === 'ninemin') { ap0.lSh = [0.9 + 1.4 * MathX.smooth(t - tp, 1.8, 2.4), 0.25]; ap0.lEl = 0.2; }
        astro.pose(ap0, ['relax', 'relax']); astro.expr(k > 0.5 ? 'shock' : 'calm', t, 1);
        astro.look(V(add3(pos, rel(-60, 0, 80))), 1);
      }
      voy.visible = !!st.voyager;
      if (st.voyager) {
        // the dish points home (at the Earth)
        const vp = [0, 0, 0], toE = n3(sub3(E, vp));
        voy.position.set(...vp); voy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), V(toE)); voy.rotateZ(0.7); voy.updateMatrixWorld(true);
      }
      // ---- effects: the heat glow fading (space), your tracer past things, the light beam, your path from the Earth
      soft.begin(); adds.begin();
      if (st.tracer) {
        // your path through the scene, lit for a moment after you pass (you cross the whole frame in under a frame)
        const k = st.tracer.key, on = TW_ON[k], tp = PASS[k], a = t >= tp ? Math.exp(-(t - tp) / 0.9) : 0;
        if (a > 0.01) {
          const camD = Math.hypot(cp[0] - (twOnPath(t, on[0], 0, 0)[0] - O[0]), cp[1] - (twOnPath(t, on[0], 0, 0)[1] - O[1]), cp[2] - (twOnPath(t, on[0], 0, 0)[2] - O[2])), L2 = Math.max(400, camD * 5);
          pathLine(t, on[0] - L2, on[0] + L2, 220, O, cp, 0.0022 * st.tracer.w, a * 0.85, [1.0, 0.68, 0.3]);
          const flash = Math.exp(-(t - tp) / 0.2), q = sub3(twOnPath(t, on[0], 0, 0), O), [qq, kq] = comp(q, cp);
          adds.add(qq[0], qq[1], qq[2], camD * 0.05 * st.tracer.w * kq, flash, 1, 0.85, 0.6);
        }
      }
      if (st.glow) { const g = st.glow; for (let j = 0; j < 30; j++) adds.add(-H.x * j * 0.6, -H.y * j * 0.6 - 0.2, -H.z * j * 0.6, 1.2 + j * 0.08, 0.5 * g * Math.exp(-j / 12), 1.0, 0.55, 0.25); }
      if (st.beam !== undefined) {
        // a pulse of light passing you (slowed right down: in truth it crosses this frame in a hundred-millionth of a second)
        const hx = -30 + st.beam * 16, b0 = rel(-200, 4.5, 0.6);
        set._beamHead = rel(hx, 4.5, 0.6);
        twTracer(adds, b0, set._beamHead, 0.55, 0.16, [0.75, 0.88, 1.0]);
        adds.add(...set._beamHead, 0.7, 1.0, 0.85, 0.92, 1.0);
      }
      if (st.path) {
        // your path from Central Park to you, drawn about the camera like the far bodies (true size and place)
        pathLine(t, 0, twPathD(t), 160, O, cp, 0.003, 0.95, [1.0, 0.55, 0.2]);
        const [yd, kk] = comp(sub3([0, 0, 0], O), cp); set._youDot = yd;
        adds.add(...yd, Math.hypot(...sub3(O, cp)) * 0.012 * kk, 1, 1, 0.75, 0.4);
      }
      // the Sun from far away: a point that never shrinks below a few pixels, and its glow
      if (B.sun.mesh.visible && !st.watchCam) {
        const sp = B.sun.mesh.position, dd = Math.hypot(sp.x - cp[0], sp.y - cp[1], sp.z - cp[2]), ang = B.sun.mesh.scale.x / dd, px = Math.tan(cam.fov * Math.PI / 360) * 2 / 1080;
        adds.add(sp.x, sp.y, sp.z, dd * Math.max(ang * 2.2, px * 14), 1, 1, 0.96, 0.88);
        adds.add(sp.x, sp.y, sp.z, dd * Math.max(ang * 7, px * 40), 0.35 * (st.sunPoint ? 1 : 0.6), 1, 0.85, 0.6);
      }
      soft.end(); adds.end();
      set._st = st; set._O = O;
    },
    labels(t, shot) {
      const st = set._st; if (!st || !st.labels) return [];
      return st.labels.map((l) => {
        let p = null;
        if (l.key) { const b = B[l.key]; if (!b.mesh.visible) return null; const m = b.mesh; p = [m.position.x, m.position.y + m.scale.x * 1.15, m.position.z]; }
        else if (l.youDot) p = set._youDot;
        else if (l.beamHead) p = set._beamHead;
        else if (l.at) p = l.at;
        return p ? { p, text: l.text, sub: l.sub, a: l.a, you: l.you } : null;
      }).filter(Boolean);
    },
    grade(t, p, shot) {
      p.exposure = 1.0; p.saturation = 1.12; p.contrast = 1.1; p.bloom = 0.5; p.bloomThreshold = 1.05; p.vignette = 0.5; p.grain = 0.02; p.blackLift = 0.0;
      if (shot.mode === 'sun' || shot.mode === 'light8') { p.bloom = 0.8; p.bloomThreshold = 0.9; p.exposure = 0.95; }
      if (shot.mode === 'redgiant' || shot.mode === 'swallow') { p.bloom = 0.7; p.warmth = 0.12; }
    },
  };

  // ---- six billion years later (AN, AO): the giant Sun, the Earth at its edge
  function frameFuture(t, u, shot, st) {
    you.visible(false); astro.visible(false); iss.visible = false; voy.visible = false;
    for (const k in B) B[k].hide(); rings.set(B.saturn, [0, 1, 0], [0, 1, 0], false);
    const Rg = 0.9 * TW_AU, earthD = 1.02 * TW_AU;
    // the giant at G; the Earth 1 AU out along +x; the camera (at the origin) beyond the Earth, looking back
    const ang = st.future ? 0.02 + 0.03 * u : -0.22 + 0.02 * u;
    const Ew = [earthD * Math.cos(ang), 0, earthD * Math.sin(ang)];
    const cw = st.future ? [Ew[0] + 3.2e7, Ew[1] + 0.9e7, Ew[2] + 1.6e7] : [2.7 * TW_AU, 0.25 * TW_AU, -0.55 * TW_AU];
    const aw = st.future ? [Ew[0], Ew[1], Ew[2] - 0.6e7] : [0.6 * TW_AU, 0.0, 0.1 * TW_AU];
    const G = sub3([0, 0, 0], cw), Ep = sub3(Ew, cw);
    twCam(cam, [0, 0, 0], sub3(aw, cw), st.future ? 34 : 44);
    cam.near = 0.05; cam.far = 1e7; cam.updateProjectionMatrix();
    B.giant.set(G, Rg, [1, 0, 0], { col: '#ff3c12', I: 1.25, rank: 0, cam, t: t * 3 });
    B.burnt.set(Ep, TW_R, n3(sub3(G, Ep)), { rank: 1, cam, I: st.future ? 0.8 + 0.6 * MathX.smooth(u, 0.5, 5) : 1.0, t });
    sky.set(cam, [H.x, H.y, H.z], 0, { bright: 0.5, band: 0.6 });
    soft.begin(); adds.begin(); soft.end(); adds.end();
    set._st = { labels: st.future ? [{ key: 'burnt', text: 'EARTH', a: twWin(t, shot.t0 + 0.4, 1e9, 0.3) }] : [{ key: 'giant', text: 'THE SUN', sub: '6 BILLION YEARS FROM NOW', a: twWin(t, shot.t0 + 0.8, 1e9, 0.4) }, { key: 'burnt', text: 'EARTH', a: twWin(t, shot.t0 + 2.4, 1e9, 0.4) }] };
  }
  return set;
};
