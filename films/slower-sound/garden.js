/* =====================================================================
   GARDEN — your back garden, the sky over it and the kitchen behind the window (garden-build.js builds them; the
   house and garden are the universe-shrinking film's, lit here by an ordinary Saturday from 7 AM to the next dawn).
   One set, many shots (modes):
     title     6:59 AM: the garden under the title          seven     7:00: by the back door, down the garden
     bird      the blackbird on the fence                    plane     an airliner 11 km up (telephoto): its sound
                                                                       piles up at its nose (the sound barrier)
     boom      7:27: the cone sweeps the sky; the boom; more contrails      carpet   the sky (the HUD's map)
     neighbour 8:00: next door, over the fence ("Good morning")            kettle / radio   the kitchen
     echo      9:00: the kitchen; the spoon                  vowels    10:00: Mum at the table; the group chat
     motorway  10:27: over the back wall to the motorway     tv        4 PM: the TV, its words crawling to you
     clap      the clap and its echoes off every wall        earbuds   your phone, a song
     cat       5 PM: the cat outruns her meow                hum       you hum (the HUD's mouth)
     storm     6 PM: from the kitchen window, rain, lightning a kilometre away
     dusk      8 PM: the day's sounds hanging in the air     box / walkinto / wait   10 PM: the music box
     night     midnight → dawn: the farthest your voice can ever reach, a circle on the lawn, shrinking
     dawn      silence; the blackbird sings and you hear nothing; your heartbeat
     real      the hot chocolate on the patio table         question  sunrise
   Layout (metres, garden-build.js): the house's back wall is z = 0, the garden runs to −z (the back wall at −16.8);
   the kitchen is inside (x −4.6…0.95, z 0.36…3.7), its window over the sink. East is −x, south −z, west +x.
   ===================================================================== */

// the kitchen's furniture and where you sit (your ears at SS_K.ear)
const SS_K = { table: [-1.9, 2.25], ear: [-1.9, 1.22, 2.95], tvX: -3.62, worktopY: 0.9, worktopZ: 0.64, radio: [-2.45, 0.9, 0.6] };
// the music box sits on the worktop exactly SSP.box metres from your ears
SS_K.box = (() => { const dz = SS_K.worktopZ - SS_K.ear[2], dy = SS_K.worktopY + 0.06 - SS_K.ear[1]; return [SS_K.ear[0] + Math.sqrt(SSP.box * SSP.box - dz * dz - dy * dy), SS_K.worktopY, SS_K.worktopZ]; })();
SS_K.tv = [SS_K.tvX, SS_K.worktopY, SS_K.worktopZ - 0.05];
SS_K.tvDist = Math.hypot(SS_K.tv[0] - SS_K.ear[0], SS_K.tv[1] + 0.25 - SS_K.ear[1], SS_K.tv[2] - SS_K.ear[2]);
const SS_GD = { you: [-0.4, 1.62, -2.6], bird: [-4.62, 1.86, -7.4], nb: [5.6, 0.4, -4.6], cat0: [0.15, 0, -6.0], catEnd: [0.35, 0, -3.55] };

// the light of the day by the story clock H (hours, 7 = 7 AM … 31 = 7 AM next day): keys [H, top, horizon, sun dir,
// sun colour, sun I, hemi I, stars 0…1, lamps 0…1]
const SS_DAY = [
  [6.8, '#4a6a98', '#e8b890', [-0.92, 0.12, -0.38], '#ffb070', 1.2, 0.42, 0, 0.3],
  [7.5, '#5f8fc4', '#f0d2ae', [-0.86, 0.3, -0.42], '#ffd2a0', 2.3, 0.55, 0, 0],
  [10, '#4d80bd', '#d4dfe9', [-0.5, 0.65, -0.58], '#fff0dc', 2.8, 0.62, 0, 0],
  [13, '#4a7ebc', '#cfdbe8', [-0.05, 0.8, -0.6], '#fff4e6', 3.0, 0.65, 0, 0],
  [16, '#5585c0', '#dcdcd6', [0.55, 0.55, -0.62], '#ffe6c4', 2.6, 0.6, 0, 0],
  [17.3, '#5a7fb2', '#e8c8a0', [0.8, 0.32, -0.5], '#ffc890', 2.1, 0.52, 0, 0],
  [18, '#3a4652', '#6a7078', [0.85, 0.25, -0.45], '#c8c0b4', 0.35, 0.34, 0, 0.4],       // the storm
  [19.2, '#3c4a62', '#b88a72', [0.9, 0.08, -0.4], '#ff9a60', 0.6, 0.3, 0, 0.6],
  [20.2, '#1a2440', '#5a5a78', [0.9, -0.05, -0.4], '#8090c0', 0.12, 0.2, 0.25, 1],
  [21.5, '#060a16', '#1a2236', [0.4, 0.5, -0.75], '#9aa8c8', 0.22, 0.12, 0.9, 1],      // (the moon)
  [28.5, '#070b18', '#1c2438', [-0.2, 0.55, -0.8], '#9aa8c8', 0.22, 0.12, 1, 1],
  [29.6, '#2a3a62', '#d49a80', [-0.95, 0.02, -0.3], '#ff9a60', 0.5, 0.26, 0.3, 0.8],
  [30.2, '#5a84b8', '#f2c69a', [-0.92, 0.14, -0.36], '#ffb070', 1.4, 0.45, 0, 0.2],
];
function ssDayAt(H) {
  const K = SS_DAY, c1 = new THREE.Color(), c2 = new THREE.Color();
  let i = 0; while (i + 1 < K.length && K[i + 1][0] <= H) i++;
  const a = K[i], b = K[Math.min(K.length - 1, i + 1)], u = b === a ? 0 : MathX.clamp((H - a[0]) / (b[0] - a[0]), 0, 1), k = Ease.inOutSine(u);
  const mix = (x, y) => '#' + c1.set(x).lerp(c2.set(y), k).getHexString();
  return { top: mix(a[1], b[1]), hor: mix(a[2], b[2]), sd: ssN3(ssV(a[3], b[3], k)), sunC: mix(a[4], b[4]), sunI: ssLerp(a[5], b[5], k), hemi: ssLerp(a[6], b[6], k), stars: ssLerp(a[7], b[7], k), lamps: ssLerp(a[8], b[8], k) };
}

// a blackbird (low-poly): body, head, orange beak (upper and lower: it opens), tail
function ssBlackbird(parent) {
  const g = new THREE.Group(), black = ssStd('#141416', 0.55, 0, { flatShading: true }), beakM = ssStd('#f0a020', 0.4);
  const body = ssMesh(new THREE.IcosahedronGeometry(0.06, 1), black, 0, 0.07, 0, g); body.scale.set(0.85, 0.85, 1.35);
  const head = new THREE.Group(); head.position.set(0, 0.12, 0.065); g.add(head);
  ssMesh(new THREE.IcosahedronGeometry(0.036, 1), black, 0, 0, 0, head);
  const up = new THREE.Group(); up.position.set(0, 0.002, 0.03); head.add(up);
  const b1 = ssMesh(new THREE.ConeGeometry(0.009, 0.035, 6), beakM, 0, 0, 0.016, up); b1.rotation.x = Math.PI / 2;
  const lo = new THREE.Group(); lo.position.set(0, -0.006, 0.03); head.add(lo);
  const b2 = ssMesh(new THREE.ConeGeometry(0.007, 0.03, 6), beakM, 0, 0, 0.014, lo); b2.rotation.x = Math.PI / 2;
  const eye = ssMesh(new THREE.SphereGeometry(0.008, 8, 6), ssStd('#f0a020', 0.4), 0.025, 0.01, 0.018, head); ssMesh(new THREE.SphereGeometry(0.008, 8, 6), ssStd('#f0a020', 0.4), -0.025, 0.01, 0.018, head);
  const tail = ssBox(0.05, 0.012, 0.11, black, 0, 0.07, -0.11, g); tail.rotation.x = -0.35;
  for (const sx of [-1, 1]) { const l = ssCyl(0.004, 0.004, 0.05, beakM, sx * 0.02, 0.02, 0, g, 5); }
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  parent.add(g);
  return { g, head, lo, open(k) { lo.rotation.x = 0.55 * k; up.rotation.x = -0.15 * k; }, eye };
}
// an airliner (about 60 m): fuselage, wings, tail, engines — seen from 11 km, so simple
function ssAirliner(parent) {
  const g = new THREE.Group(), white = ssStd('#e8ecf0', 0.4, 0.2), grey = ssStd('#9aa2ac', 0.5, 0.3);
  const f = ssMesh(new THREE.CylinderGeometry(2.0, 2.0, 60, 12), white, 0, 0, 0, g); f.rotation.z = Math.PI / 2;
  const n = ssMesh(new THREE.ConeGeometry(2.0, 6, 12), white, 33, 0, 0, g); n.rotation.z = -Math.PI / 2;
  const w = ssBox(14, 0.6, 58, grey, 2, -0.6, 0, g); w.rotation.y = 0;
  const ts = ssBox(6, 0.4, 20, grey, -27, 0.5, 0, g); const tf = ssBox(7, 9, 0.5, white, -27, 5, 0, g);
  for (const z of [-11, 11]) { const e = ssMesh(new THREE.CylinderGeometry(1.4, 1.4, 5, 10), grey, 4, -2.2, z, g); e.rotation.z = Math.PI / 2; }
  g.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  parent.add(g);
  return g;
}
// a contrail: a long soft tube behind the plane (grows with time), as a camera-facing ribbon of puffs
function ssContrailPts(p0, dir, len, n = 60) { const out = []; for (let i = 0; i < n; i++) { const u = i / (n - 1); out.push([p0[0] - dir[0] * len * u, p0[1] - dir[1] * len * u, p0[2] - dir[2] * len * u, u]); } return out; }

// a jagged lightning bolt from (x, top, z) to the ground: a seeded polyline, drawn as a thin ribbon
function ssBoltGeo(x, z, top, seed) {
  const r = new RNG(seed), pts = [];
  let px = x, pz = z;
  for (let y = top; y > 0; y -= top / 26) { pts.push([px, y, pz]); px += r.range(-1, 1) * top * 0.03; pz += r.range(-1, 1) * top * 0.02; }
  pts.push([x + r.range(-10, 10), 0, z]);
  const pos = []; for (let i = 0; i < pts.length - 1; i++) pos.push(...pts[i], ...pts[i + 1]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
}

SS_SETS.garden = (app) => {
  const S = ssSet(app, { sky: '#cfdce8', fov: 55, near: 0.02, far: 30000, hemi: ['#d6e2f0', '#7a6a56', 0.6], sun: [-40, 30, -30], sunColor: '#fff0dc', sunI: 2.6, shadow: 2048, shadowR: 22, shadowFar: 200,
    env: ['#a8c0dc', '#e2dcd2', '#7a6e60'] });
  const scene = S.scene, cam = S.camera, G = SS_G, K = ssK;
  scene.fog = new THREE.FogExp2('#cfdce8', 0.0016);
  const P = ssBuildGarden(app, S), M = P.M;
  P.scope.visible = false;                                   // (no telescope this time)
  P.bathIce.visible = false;
  const sky = ssSky(scene, '#4f7fb8', '#c6d6e6', '#6a6a60', { sunDir: [-0.8, 0.3, -0.4], sunGlow: '#fff2d8', hw: 0.3, r: 25000 });
  sky.material.fog = false;
  // the far town in daylight colours (it was a night silhouette)
  P.far.traverse((m) => { if (m.isMesh) m.material = ssStd('#6a6e74', 0.9); });
  // ---- stars (night)
  const starGeo = new THREE.BufferGeometry(), sp = [], sc = [];
  for (let i = 0; i < 2600; i++) { const u = ssR(i, 3), v = ssR(i, 4), az = u * 6.283, el = Math.asin(0.05 + 0.95 * v), R = 20000; sp.push(Math.cos(el) * Math.sin(az) * R, Math.sin(el) * R, -Math.cos(el) * Math.cos(az) * R); const b = Math.pow(ssR(i, 5), 3); sc.push(b, b, b * 0.95); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); starGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  const starMat = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const stars = new THREE.Points(starGeo, starMat); stars.renderOrder = -9; stars.frustumCulled = false; scene.add(stars);
  // ---- the lamps: the kitchen's spill on the patio, the string lights, the pendant over the table, a soft fill indoors
  const warm = '#ffb468';
  const spill = new THREE.SpotLight(warm, 0, 16, 0.95, 0.85, 1.6); spill.position.set(-1.6, 1.7, 0.6); spill.target.position.set(-1.4, 0, -5); scene.add(spill, spill.target);
  const strings = [-2.5, -8, -13.5].map((z) => { const p = new THREE.PointLight('#ffc070', 0, 6, 1.8); p.position.set(-G.lawnW / 2 + 0.25, 1.75, z); scene.add(p); return p; });
  const pendant = new THREE.PointLight('#ffcf96', 0, 9, 1.6); pendant.position.set(...P.lampAt); scene.add(pendant);
  const fill = new THREE.PointLight('#e8eef6', 0, 9, 1.4); fill.position.set(-1.8, 2.3, 2.6); scene.add(fill);
  const flash = new THREE.DirectionalLight('#dfe6ff', 0); flash.position.set(-300, 800, -900); scene.add(flash);

  // ---- the kitchen: a table and chairs, the radio, a small TV, the music box, a spoon, a mug
  const KR = P.kitchenRoom, ind = (m) => { m.userData.indoor = true; return m; };
  const oak = ind(ssStd('#9a7448', 0.6)), dark = ind(ssStd('#2a2826', 0.6)), cream = ind(ssStd('#e8e0cc', 0.5));
  const T = SS_K.table;
  ssBox(1.5, 0.04, 0.85, oak, T[0], 0.74, T[1], KR); for (const [dx, dz] of [[-0.68, -0.36], [0.68, -0.36], [-0.68, 0.36], [0.68, 0.36]]) ssBox(0.05, 0.72, 0.05, oak, T[0] + dx, 0.36, T[1] + dz, KR);
  const chair = (x, z, ry) => { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; KR.add(c); ssBox(0.42, 0.04, 0.42, oak, 0, 0.46, 0, c); for (const [a, b] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) ssBox(0.035, 0.46, 0.035, oak, a, 0.23, b, c); ssBox(0.42, 0.45, 0.03, oak, 0, 0.7, 0.2, c); return c; };
  chair(T[0], T[1] + 0.62, 0); chair(T[0], T[1] - 0.62, Math.PI); chair(T[0] - 0.95, T[1], Math.PI / 2);
  // the radio (on the worktop by the window)
  const radio = new THREE.Group(); radio.position.set(...SS_K.radio); KR.add(radio);
  ssMesh(ssRoundBox(0.28, 0.16, 0.1, 0.02, 0.006), ind(ssStd('#b8452e', 0.5)), 0, 0, 0, radio);
  { const gr = ssMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 18), dark, -0.06, 0.08, 0.052, radio); gr.rotation.x = Math.PI / 2; ssBox(0.08, 0.04, 0.01, cream, 0.07, 0.1, 0.052, radio); const ant = ssCyl(0.003, 0.003, 0.32, ind(ssStd('#c8c8c8', 0.3, 0.9)), 0.1, 0.3, -0.02, radio, 5); ant.rotation.z = -0.4; }
  // the TV (the afternoon's news: its picture is a canvas, the presenter's mouth moves with what she says)
  const tvScr = ssCanvasTex(480, 270, (g, w, h, s) => {
    g.fillStyle = '#1c2a44'; g.fillRect(0, 0, w, h); g.fillStyle = '#2c4470'; g.fillRect(0, h * 0.55, w, h * 0.45);
    g.fillStyle = '#c8402e'; g.fillRect(0, h - 44, w, 44); g.fillStyle = '#fff'; g.font = 'bold 22px Inter, Arial'; g.fillText('LIVE · SOUND SLOWS AGAIN', 14, h - 15);
    g.fillStyle = '#e0b090'; g.beginPath(); g.ellipse(w / 2, 108, 40, 50, 0, 0, 7); g.fill();
    g.fillStyle = '#2a1a12'; g.beginPath(); g.ellipse(w / 2, 82, 44, 34, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#3a3a52'; g.beginPath(); g.moveTo(w / 2 - 95, h - 44); g.quadraticCurveTo(w / 2, 140, w / 2 + 95, h - 44); g.fill();
    g.fillStyle = '#5a1e1e'; g.beginPath(); g.ellipse(w / 2, 132, 13, 2 + 10 * s.m, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(w / 2 - 14, 104, 4, 0, 7); g.arc(w / 2 + 14, 104, 4, 0, 7); g.fill();
  });
  const tv = new THREE.Group(); tv.position.set(...SS_K.tv); tv.rotation.y = Math.atan2(SS_K.ear[0] - SS_K.tv[0], SS_K.ear[2] - SS_K.tv[2]); KR.add(tv);
  ssBox(0.62, 0.38, 0.05, dark, 0, 0.3, 0, tv); ssBox(0.14, 0.1, 0.12, dark, 0, 0.05, 0, tv);
  const tvFace = ssMesh(new THREE.PlaneGeometry(0.57, 0.32), new THREE.MeshBasicMaterial({ map: tvScr.tex, toneMapped: false }), 0, 0.3, 0.027, tv);
  // the music box (walnut, lid up, a little brass crank)
  const box = new THREE.Group(); box.position.set(...SS_K.box); box.rotation.y = Math.atan2(SS_K.ear[0] - SS_K.box[0], SS_K.ear[2] - SS_K.box[2]); KR.add(box);
  ssMesh(ssRoundBox(0.16, 0.07, 0.11, 0.01, 0.004), ind(ssStd('#5a3622', 0.4)), 0, 0, 0, box);
  const lid = new THREE.Group(); lid.position.set(0, 0.07, -0.055); box.add(lid); ssMesh(ssRoundBox(0.16, 0.012, 0.11, 0.01, 0.003), ind(ssStd('#5a3622', 0.4)), 0, 0, 0.055, lid); lid.rotation.x = -1.9;
  ssBox(0.13, 0.004, 0.08, ind(ssStd('#c8a050', 0.25, 0.9)), 0, 0.07, 0, box);
  const crank = ssCyl(0.004, 0.004, 0.05, ind(ssStd('#c8a050', 0.25, 0.9)), 0.09, 0.035, 0, box, 6); crank.rotation.z = Math.PI / 2;
  // the spoon (falls in the echo shot) and the mug of hot chocolate (the real shot: the patio table's mug)
  const spoon = new THREE.Group(); scene.add(spoon); { const st = ssStd('#c8ccd2', 0.2, 0.9); const h = ssBox(0.012, 0.004, 0.15, st, 0, 0, -0.04, spoon); const bw = ssMesh(new THREE.SphereGeometry(0.022, 10, 6), st, 0, 0, 0.05, spoon); bw.scale.set(0.8, 0.3, 1.1); }
  spoon.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  P.teaTop.material = ssStd('#4a2a16', 0.25);
  // ---- people: next door (over the right fence), Mum at the kitchen table, your friend (none here)
  Object.assign(ACTIONS, {
    ssWave(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.4); p.rSh = [1.2 * k + 0.1, 0.5 * k]; p.rEl = 1.0 + 0.3 * Math.sin(τ * 8) * k; p.neck = -0.05; p.headYaw = 0; return p; },
    ssTalkSit(τ, c) { const p = ACTIONS.sit(τ, c), a = τ * 2.3; p.rSh = [0.75 + 0.15 * Math.sin(a), 0.15]; p.rEl = 1.2 + 0.25 * Math.sin(a * 1.3); p.lSh = [0.6, 0.08]; p.lEl = 1.3; p.neck = 0.05 + 0.05 * Math.sin(a * 0.7); p.headYaw = 0.1 * Math.sin(a * 0.4); p.spine = 0.08; return p; },
    ssShrugSit(τ, c) { const p = ACTIONS.sit(τ, c), k = Math.min(1, τ / 0.35); p.lSh = [0.5, 0.35 * k]; p.rSh = [0.5, 0.35 * k]; p.lEl = 1.4; p.rEl = 1.4; p.neck = -0.1 * k; return p; },
    ssPhoneSit(τ, c) { const p = ACTIONS.sit(τ, c); p.rSh = [0.9, 0.12]; p.rEl = 1.7; p.lSh = [0.85, 0.1]; p.lEl = 1.7; p.neck = 0.45; p.spine = 0.12; return p; },
  });
  Object.assign(BLEND, { ssWave: 0.4, ssTalkSit: 0.5, ssShrugSit: 0.3, ssPhoneSit: 0.5 });
  const nb = ssPerson({ id: 'ssNbr', look: 'ssNeighbour', y: SS_GD.nb[1], path: [[0, SS_GD.nb[0], SS_GD.nb[2]]], face: 70, states: [[0, 'idle'], [SS.morning - 0.5, 'ssWave'], [SS.morning + 2.6, 'idle']] }, scene);
  const mum = ssPerson({ id: 'ssMum', look: 'casual6', path: [[0, T[0], T[1] - 0.62]], face: 180, seat: 0.46, states: [[0, 'ssTalkSit'], [SS.text - 1.2, 'ssShrugSit'], [SS.text - 0.3, 'ssPhoneSit']] }, scene);
  // you, seen from the corner of the kitchen while you wait for the tune
  const you = ssPerson({ id: 'ssYou', look: 'ssVisitor', path: [[0, T[0], T[1] + 0.62]], face: 0, seat: 0.46, states: [[0, 'sit']] }, scene);
  you.root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  // ---- the blackbird, the airliners, the bolt, rain
  const bird = ssBlackbird(scene); bird.g.position.set(...SS_GD.bird); bird.g.rotation.y = 1.2;
  const planes = [0, 1, 2, 3].map(() => ssAirliner(scene));
  const trail = ssPuffs(scene, 2400, { soft: 1.2 }); trail.mesh.renderOrder = 4;
  const steam = ssPuffs(scene, 600, { soft: 1.8 });
  const boltM = new THREE.LineBasicMaterial({ color: '#f4f6ff', transparent: true, opacity: 0, fog: false });
  const bolt = new THREE.LineSegments(ssBoltGeo(-320, -950, 620, 7), boltM); bolt.frustumCulled = false; scene.add(bolt);
  const bolt2 = new THREE.LineSegments(ssBoltGeo(-320, -950, 620, 8), boltM); bolt2.position.x = 1.5; scene.add(bolt2);
  const rain = ssRain(scene, { n: 3000, r: 10, h: 8, opacity: 0.28 });
  // ---- the cat
  const catRoot = new THREE.Group(); scene.add(catRoot);
  const cat = ssBuildCat(catRoot);
  // ---- the rings, and the horizon circle on the lawn (the farthest your voice can ever reach)
  const R = ssRings(scene, 1400);
  const horizon = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 200), new THREE.MeshBasicMaterial({ color: '#ffd7a8', transparent: true, opacity: 0.85, fog: false, depthWrite: false, side: THREE.DoubleSide }));
  horizon.rotation.x = -Math.PI / 2; horizon.renderOrder = 7; scene.add(horizon);
  let horizonW = 0.02;
  // ---- the day's sounds, hanging in the air at 8 PM (made between 7 PM and 8 PM, so 0–2.5 m across now)
  const HANG = Array.from({ length: 70 }, (_, i) => ({ p: [-4 + 8 * ssR(i, 61), 0.2 + 2.2 * ssR(i, 62), -1.5 - 14 * ssR(i, 63)], h0: 12 + 0.98 * ssR(i, 64) }));

  // ---- your hands
  const hands = ssHands(cam, {
    right: [[-1, 'hidden'],
      [SS.spoon - 0.2, 'hold'], [SS.drop + 0.05, 'ssLetGo'], [SS.drop + 0.9, 'hidden'],
      [SS.text - 0.6, 'phone'], [SS.motorway - 0.2, 'hidden'],
      [SS.clapAt - 0.6, 'ssClapOpen'], [SS.clapAt - 0.08, 'ssClapShut'], [SS.clapAt + 0.25, 'ssClapOpen'], [SS.clapAt + 1.0, 'hidden'],
      [SS.earbuds - 0.3, 'phone'], [SS.five - 0.2, 'hidden'],
      [SS.box - 0.2, 'ssCrank'], [ssCap('box', 1).show - 0.4, 'hidden'],
      [SS.real3 + 1.0, 'ssSpoonTap'], [SS.real4 - 0.2, 'hidden']],
    left: [[-1, 'hidden'], [SS.clapAt - 0.6, 'ssClapOpen'], [SS.clapAt - 0.08, 'ssClapShut'], [SS.clapAt + 0.25, 'ssClapOpen'], [SS.clapAt + 1.0, 'hidden']],
  }, { sleeve: '#3c4a5a', cuff: '#2c3642', watch: true });
  Object.assign(hands.poses, {
    ssLetGo: { p: [0.07, -0.14, -0.34], F: [-0.3, 0.6, -0.75], N: [-0.2, -0.8, 0.5], curl: [0.25, 0.3, 0.4, 0.45], thumb: [0.6, 0.3] },
    ssClapOpen: { p: [0.12, -0.12, -0.36], F: [-0.25, 1, -0.35], N: [-1, 0, -0.1], curl: [0.1, 0.12, 0.15, 0.2], thumb: [0.35, 0.15] },
    ssClapShut: { p: [0.022, -0.1, -0.36], F: [-0.1, 1, -0.35], N: [-1, 0, 0], curl: [0.08, 0.1, 0.12, 0.15], thumb: [0.3, 0.1] },
    ssCrank: { p: [0.08, -0.16, -0.36], F: [-0.2, 0.2, -1], N: [-1, 0, -0.1], curl: [0.9, 1.1, 1.25, 1.3], thumb: [0.3, 0.7] },
    ssSpoonTap: { p: [0.08, -0.16, -0.4], F: [-0.4, -0.3, -0.85], N: [-0.2, -1, 0.2], curl: [0.75, 0.85, 1.05, 1.15], thumb: [0.35, 0.75] },
  });
  Object.assign(hands.blends, { ssLetGo: 0.08, ssClapOpen: 0.2, ssClapShut: 0.08, ssCrank: 0.4, ssSpoonTap: 0.3 });
  const handSpoon = new THREE.Group(); { const st = ssStd('#c8ccd2', 0.2, 0.9); ssBox(0.012, 0.004, 0.15, st, 0, 0, 0.04, handSpoon); const bw = ssMesh(new THREE.SphereGeometry(0.022, 10, 6), st, 0, 0, 0.13, handSpoon); bw.scale.set(0.8, 0.3, 1.1); }
  handSpoon.position.set(0.0, 0.06, 0.03); handSpoon.rotation.set(-1.2, 0, 0); hands.right.g.add(handSpoon); hands.props.spoon = handSpoon;
  handSpoon.traverse((m) => { if (m.isMesh) { m.frustumCulled = false; m.castShadow = false; } });

  // ---- light
  const lightAt = (t, mode) => {
    const H = 7 + ssH(t), D = ssDayAt(H);
    sky.material.uniforms.a.value.set(D.top); sky.material.uniforms.b.value.set(D.hor); sky.material.uniforms.sd.value.set(...D.sd).normalize();
    sky.material.uniforms.sc.value.set(D.sd[1] > -0.02 && D.sunI > 0.8 ? '#fff0d0' : '#000000');
    S.sun.color.set(D.sunC); S.sun.intensity = D.sunI; S.hemi.intensity = D.hemi; S.hemi.color.set(D.top).lerp(new THREE.Color('#ffffff'), 0.4);
    scene.fog.color.set(D.hor); scene.background = new THREE.Color(D.hor);
    starMat.opacity = D.stars;
    const L = D.lamps;
    spill.intensity = 10 * L; for (const s of strings) s.intensity = 1.2 * L; for (const b of P.bulbs) b.visible = L > 0.3;
    M.glassLit.emissiveIntensity = 1.25 * L;
    for (const f of P.neighbours || []) f.material.emissiveIntensity = L;
    pendant.intensity = mode === 'box' || mode === 'walkinto' || mode === 'wait' || mode === 'storm' ? 5.5 : 0;
    const inside = ['kettle', 'radio', 'echo', 'vowels', 'tv', 'clap', 'earbuds', 'storm', 'box', 'walkinto', 'wait'].includes(mode);
    fill.intensity = inside ? (L > 0.5 ? 0.6 : 2.2) : 0;
    return D;
  };
  const look = (p, at, fov, t, drift = 0.006, roll = 0) => { const d = ssDrift(t, drift, 0.3, 11); ssCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); };
  const placeSun = (D, c, R0 = 22) => { const d = D.sd; S.sun.position.set(c[0] + d[0] * 80, c[1] + Math.max(0.05, d[1]) * 80, c[2] + d[2] * 80); S.sun.target.position.set(c[0], 0, c[2]); S.sun.target.updateMatrixWorld();
    const sc = S.sun.shadow.camera; if (sc.right !== R0) { sc.left = -R0; sc.right = R0; sc.top = R0; sc.bottom = -R0; sc.updateProjectionMatrix(); } };

  // the airliner's path (story h → world): in the plane shot, 11 km up, crossing from east to west south of you;
  // in the boom shot a second pass, timed so that its cone reaches you at SS.boomAt (exactly: solved below)
  const PL = { dir: [1, 0, 0.08], alt: 11000, zOff: -5500 };
  const plane1 = (te) => { const s = (te - SS.plane) * SSP.plane; return [-2600 + s * PL.dir[0], PL.alt, PL.zOff + s * PL.dir[2]]; };
  const boomPlane = (() => {
    const zOff = -3200, you = SS_GD.you;
    const make = (x0) => (te) => [x0 + (te - SS.boom) * SSP.plane, PL.alt, zOff];
    // (the first moment its sound reaches you, for a start x0: bisection on x0 so that it is SS.boomAt)
    const firstHeard = (src) => { for (let t = SS.boom - 2; t < SS.boom + 40; t += 0.05) { if (ssHeardFrom(src, you, t, 120, 600).length) return t; } return Infinity; };
    let a = -30000, b = 0;
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2, f = firstHeard(make(m)); if (f > SS.boomAt) a = m; else b = m; }
    return make((a + b) / 2);
  })();
  SS_GARDEN.boomPlane = boomPlane; SS_GARDEN.plane1 = plane1;
  const otherTrails = [[-0.3, 0.55, -1, 1.0], [0.7, 0.5, -0.6, -0.4], [-0.9, 0.62, 0.3, 0.2]];

  const set = {
    scene, camera: cam,
    cuts() { return [ssCap('box', 1).show - 0.4, ssCap('wait', 0).show - 0.5]; },
    frame(t, shot) {
      const m = shot.mode, D = lightAt(t, m), h = ssH(t), H = 7 + h;
      let pos = SS_GD.you, at = [-0.6, 1.2, -12], fov = 55, drift = 0.006, roll = 0, show = null, phone = null;
      R.begin(); trail.begin(); steam.begin();
      for (const p of planes) p.visible = false;
      boltM.opacity = 0; flash.intensity = 0; rain.lines.visible = false; horizon.visible = false;
      catRoot.visible = false; nb.root.visible = false; mum.root.visible = false; spoon.visible = false; you.root.visible = false;
      cam.near = 0.02; cam.far = 30000;
      // the bird (on the fence in the morning and at dawn)
      bird.g.visible = H < 8.2 || H > 29;
      { const ph = (t - SS.song) % 3.1, sing = ph > 0 && ph < 1.6 ? Math.max(0, Math.sin(ph * 26)) : 0; bird.open(sing); bird.head.rotation.y = 0.3 * Math.sin(t * 0.7); bird.head.rotation.x = -0.15 * sing; }
      if (m === 'title' || m === 'seven') {
        const k = K(t, SS.titleShot, SS.bird, (x) => x);
        pos = ssV([0.6, 1.66, -0.9], [-0.2, 1.64, -2.4], k); at = ssV([-0.9, 1.5, -14], [-1.4, 1.35, -14], k); fov = 56;
      } else if (m === 'bird') {
        const k = K(t, SS.bird, SS.plane - 0.3);
        pos = [-1.0, 1.62, -3.2]; at = ssV([-3.6, 1.6, -7.2], [SS_GD.bird[0] + 0.1, SS_GD.bird[1] + 0.05, SS_GD.bird[2]], Ease.outCubic(k)); fov = ssLerp(48, 26, Ease.inOutSine(k));
      } else if (m === 'plane') {
        // telephoto on the airliner: its sound (rings) piles up at its nose as it reaches the speed of sound up there
        const p = plane1(t), k = K(t, SS.plane, SS.plane + 2.2);
        planes[0].visible = true; planes[0].position.set(...p); planes[0].rotation.y = -Math.atan2(PL.dir[2], PL.dir[0]);
        pos = [0, 1.6, -2]; at = ssV([p[0] - 3000, 3000, p[2] * 0.5], [p[0] + 120, p[1], p[2]], Ease.inOutSine(k)); fov = ssLerp(40, 5.2, Ease.inOutSine(k)); drift = 0.0006;
        ssShells(R, t, { src: plane1, every: 0.35, from: SS.plane - 9, life: 9, alpha: 0.55, scale: SSP.cAlt0 / SSP.c0 });
        for (const q of ssContrailPts(p, PL.dir, 2400, 90)) trail.add(q[0] - 40, q[1] - 2, q[2], 18 + 60 * q[3], 0.5 * (1 - q[3]), 1, 1, 1);
        cam.near = 5;
      } else if (m === 'boom' || m === 'carpet') {
        // the wide sky: the cone sweeps over the garden; then more airliners, more cones
        const p = boomPlane(t);
        planes[0].visible = true; planes[0].position.set(...p); planes[0].rotation.y = 0;
        ssShells(R, t, { src: boomPlane, every: 0.5, from: SS.boom - 30, life: 30, alpha: 0.5, maxR: 16000 });
        for (const q of ssContrailPts(p, [1, 0, 0], 6000, 80)) trail.add(q[0] - 40, q[1] - 2, q[2], 30 + 120 * q[3], 0.45 * (1 - q[3]), 1, 1, 1);
        const others = K(t, SS.others, SS.others + 4);
        otherTrails.forEach((o, i) => {
          if (others <= 0) return;
          const pl = planes[1 + i], d = [Math.cos(o[3]), 0, Math.sin(o[3])], c0 = [o[0] * 9000, 10500 + 600 * i, -6000 + o[2] * 5000], s = (t - SS.others) * SSP.plane - 4000;
          const pp = [c0[0] + d[0] * s, c0[1], c0[2] + d[2] * s];
          pl.visible = true; pl.position.set(...pp); pl.rotation.y = -o[3];
          for (const q of ssContrailPts(pp, d, 5000, 50)) trail.add(q[0], q[1], q[2], 30 + 120 * q[3], 0.4 * others * (1 - q[3]), 1, 1, 1);
          ssShells(R, t, { src: (te) => [c0[0] + d[0] * ((te - SS.others) * SSP.plane - 4000), c0[1], c0[2] + d[2] * ((te - SS.others) * SSP.plane - 4000)], every: 0.8, from: SS.others - 10, life: 24, alpha: 0.32 * others });
        });
        const kb = K(t, SS.boomAt - 6, SS.boomAt + 1.5), kc = K(t, SS.carpet, SS.eight - 1);
        pos = [0.2, 1.62, -3.0]; { const q = boomPlane(SS.boomAt), d = ssN3([q[0] - pos[0], q[1] - pos[1], q[2] - pos[2]]); const el = Math.max(d[1], 0.42); at = ssV(ssV([-2, 2.6, -14], [pos[0] + d[0] * 20, pos[1] + el * 20, pos[2] + d[2] * 20], Ease.inOutSine(K(t, SS.boom, SS.boom + 3))), [pos[0] + d[0] * 20, pos[1] + el * 20 - 2, pos[2] + d[2] * 20], kb); } fov = ssLerp(ssLerp(50, 64, kb), 72, kc); drift = 0.004;
        // the boom: a hard double knock of the camera
        const db = t - SS.boomAt; if (db > 0 && db < 1.2) { const s = Math.exp(-db * 5) * (Math.sin(db * 70) + 0.6 * Math.sin(db * 113)); at = [at[0] + 0.12 * s, at[1] + 0.2 * s, at[2]]; roll = 0.6 * s; }
        cam.near = 0.5;
      } else if (m === 'neighbour') {
        nb.root.visible = true; nb.update(t);
        const k = K(t, SS.eight, SS.throat + 1);
        pos = [0.4, 1.62, -3.0]; at = ssV([3.5, 1.7, -6], [SS_GD.nb[0] - 0.2, 1.95, SS_GD.nb[2]], k); fov = ssLerp(46, 32, k);
      } else if (m === 'kettle') {
        const kk = [-3.05, 1.01, 0.61], k = K(t, SS.kettle, SS.radio);
        pos = ssV([-1.95, 1.58, 2.3], [-2.25, 1.5, 2.0], k); at = [kk[0], 1.08, kk[2]]; fov = 42;
        for (let i = 0; i < 70; i++) { const a = ((t * 0.9 + i / 70) % 1), x = kk[0] + 0.12 + a * 0.25 + 0.05 * Math.sin(i * 3 + t * 2), y = kk[1] + 0.15 + a * 0.55; steam.add(x, y, kk[2] + 0.04 * Math.sin(i), 0.03 + 0.12 * a, 0.22 * (1 - a), 1, 1, 1); }
      } else if (m === 'radio') {
        const k = K(t, SS.radio, SS.nine);
        pos = ssV([-1.8, 1.5, 1.9], [-1.95, 1.45, 1.7], k); at = [SS_K.radio[0], 1.0, SS_K.radio[2]]; fov = 40;
      } else if (m === 'echo') {
        // the kitchen; the spoon slips from your hand and hits the floor
        const k = K(t, SS.spoon, SS.drop + 0.4);
        pos = [-1.5, 1.62, 2.7]; at = ssV([-1.7, 1.2, 0.3], [-1.55, 0.25, 1.85], Ease.inOutSine(k)); fov = 52;
        if (t >= SS.drop) {
          // (from your hand to the floor: free fall, one bounce)
          spoon.visible = true; const dt = t - SS.drop, y0 = 1.02, tf = Math.sqrt(2 * (y0 - 0.02) / 9.81);
          let y = y0 - 4.9 * dt * dt, spin = dt * 9;
          if (dt > tf) { const d2 = dt - tf; y = 0.02 + Math.max(0, 0.9 * d2 - 4.9 * d2 * d2); spin = tf * 9 + d2 * 3; if (d2 > 0.2) { y = 0.015; spin = tf * 9 + 0.6; } }
          spoon.position.set(-1.52, y, 2.12); spoon.rotation.set(spin * 0.4, spin, 0.2);
          if (dt > tf) ssShells(R, t, { src: () => [-1.52, 0.02, 2.12], every: 1, from: SS.drop + tf, to: SS.drop + tf, life: 2, alpha: 0.5 });
        }
        show = t < SS.drop + 0.05 ? 'spoon' : null;
      } else if (m === 'vowels') {
        mum.root.visible = true; mum.update(t);
        const k = K(t, SS.text - 0.8, SS.text + 0.3);
        pos = [T[0] + 1.25, 1.3, T[1] + 1.15]; at = ssV([T[0] - 0.1, 1.05, T[1] - 0.6], [T[0] + 0.15, 0.62, T[1] + 0.2], k); fov = 48;
        if (t > SS.text - 0.6) { show = 'phone'; phone = 'chat'; }
      } else if (m === 'motorway') {
        pos = [0.2, 1.62, -5]; at = [-6, 3, -120]; fov = 34; drift = 0.003;
      } else if (m === 'tv' || m === 'clap' || m === 'earbuds' || m === 'box' || m === 'wait' || m === 'walkinto') {
        // seated at the table, your ears 3 m from the TV / the music box
        const E = SS_K.ear;
        pos = E; at = [SS_K.tv[0], 1.1, SS_K.tv[2]]; fov = 50;
        if (m === 'tv') {
          const k = K(t, SS.four, SS.four + 3); at = ssV([-1.9, 1.15, 0.4], [SS_K.tv[0] + 0.3, 1.1, SS_K.tv[2]], k);
          // (her words: a ring for every syllable she says, crawling to you at 67 cm/s)
          tvScr.update({ m: Math.round(4 * Math.max(0, Math.sin(t * 9.1) * Math.sin(t * 3.3))) / 4 });
          ssShells(R, t, { src: () => [SS_K.tv[0], SS_K.tv[1] + 0.3, SS_K.tv[2] + 0.05], every: 0.28, from: SS.four - 8, life: 9, alpha: 0.45, maxR: SS_K.tvDist + 0.4 });
        }
        if (m === 'clap') {
          at = [-1.9, 1.15, 0.3];
          // the clap and its first echoes (image sources in the six walls)
          const c = [E[0], E[1] - 0.1, E[2] - 0.36], KD = SS_G.kitchen, wl = [[KD[0], 0], [KD[1], 0], [0.36, 2], [KD[2], 2], [0, 1], [2.5, 1]];
          const srcs = [c, ...wl.map(([w, ax]) => { const q = c.slice(); q[ax] = 2 * w - q[ax]; return q; })];
          srcs.forEach((q, i) => ssShells(R, t, { src: () => q, every: 1, from: SS.clapAt, to: SS.clapAt, life: 30, alpha: i ? 0.3 : 0.6 }));
        }
        if (m === 'earbuds') { at = [-1.9, 0.9, 1.2]; show = 'phone'; phone = 'music'; }
        if (m === 'box' && t < ssCap('box', 1).show - 0.4) { pos = [SS_K.box[0] - 0.05, 1.35, SS_K.box[2] + 0.55]; at = [SS_K.box[0], 0.95, SS_K.box[2]]; fov = 44; show = null; }
        if (m === 'box' || m === 'walkinto' || m === 'wait') {
          if (pos === E) at = [SS_K.box[0], 1.0, SS_K.box[2]];
          if (m === 'wait') {
            // (from the corner of the kitchen: you at the table, the box on the worktop, its tune crawling between)
            you.root.visible = true; you.update(t);
            const k = K(t, SS.wait, SS.wait + 6);
            pos = ssV([0.6, 1.95, 3.4], [0.8, 2.35, 3.55], k); at = ssV([-0.6, 1.0, 1.6], [-0.95, 0.95, 1.75], k); fov = 58;
          }
          if (m === 'walkinto') {
            const k = K(t, SS.walkinto + 0.3, ssCap('walkinto', 1).show + 0.5);
            pos = ssV([E[0], 1.22, E[2]], [SS_K.box[0] - 0.12, 1.25, SS_K.box[2] + 0.45], k); at = [SS_K.box[0], 0.98, SS_K.box[2]]; fov = ssLerp(50, 46, k);
            // (stood up: a little bob as you walk)
            pos = [pos[0], pos[1] + 0.3 * K(t, SS.walkinto, SS.walkinto + 0.6) + 0.012 * Math.sin(t * 11) * k * (1 - k) * 4, pos[2]];
          }
          // the tune: one ring per note, made in 6.4 s from 22:00:00, crawling at 1 cm/s
          const bp = [SS_K.box[0], SS_K.box[1] + 0.07, SS_K.box[2]];
          ssShells(R, t, { src: () => bp, every: SS.boxTune / 24, from: SS.boxGo, to: SS.boxGo + SS.boxTune, life: 1e9, alpha: 0.6 });
        }
        lid.rotation.x = -1.9; crank.rotation.x = t * (t < SS.boxGo + SS.boxTune ? 6 : 0);
      } else if (m === 'cat' || m === 'hum') {
        // low on the patio step: the cat sets off as she meows, and outruns it
        catRoot.visible = true;
        const go = SS.meow + 0.35, v = 0.72, L = Math.hypot(SS_GD.catEnd[0] - SS_GD.cat0[0], SS_GD.catEnd[2] - SS_GD.cat0[2]), arrive = go + L / v;
        const u = MathX.clamp((t - go) / (arrive - go), 0, 1), cp = ssV(SS_GD.cat0, SS_GD.catEnd, u);
        catRoot.position.set(cp[0], 0, cp[2]); catRoot.rotation.y = Math.atan2(SS_GD.catEnd[0] - SS_GD.cat0[0], SS_GD.catEnd[2] - SS_GD.cat0[2]);
        const walking = t > go && t < arrive, gp = (t - go) * 1.6;
        cat.pose(walking ? ssCatGallop(gp, 0.45) : t < go ? ssCatBlend(SS_CAT_POSES.sit, SS_CAT_POSES.alert, 0.5 + 0.5 * MathX.smooth(t, SS.meow - 0.5, SS.meow)) : ssCatBlend(SS_CAT_POSES.sit, SS_CAT_POSES.alert, 0.8), t);
        pos = m === 'cat' ? [0.4, 0.62, -2.85] : [0.3, 1.0, -2.6];
        cat.lookAt([pos[0], 0.6, pos[2]], 0.8); at = m === 'cat' ? ssV([SS_GD.cat0[0], 0.2, SS_GD.cat0[2]], [cp[0], 0.18, cp[2]], 0.7) : [0.2, 0.6, -5.5]; fov = m === 'cat' ? 46 : 50;
        if (m === 'cat') ssShells(R, t, { src: () => [SS_GD.cat0[0], 0.26, SS_GD.cat0[2] + 0.12], every: 0.12, from: SS.meow, to: SS.meow + 0.6, life: 30, alpha: 0.4 });
      } else if (m === 'storm') {
        // from the kitchen: rain on the garden, lightning a kilometre away over the town
        rain.lines.visible = true; rain.update(t, [-1.6, 1.5, -7]);
        pos = [-1.6, 1.62, 1.95]; at = [-2.6, 2.6, -40]; fov = 52;
        const fl = t - SS.flash; boltM.opacity = fl > 0 && fl < 0.5 ? (Math.sin(fl * 40) > -0.3 ? 1 : 0.2) * (1 - fl * 1.6) : 0;
        flash.intensity = fl > 0 && fl < 0.6 ? 4 * Math.exp(-fl * 6) : 0;
        if (flash.intensity > 0) S.hemi.intensity += 1.5 * Math.exp(-fl * 6);
      } else if (m === 'dusk') {
        catRoot.visible = true; catRoot.position.set(...G.catAt); catRoot.rotation.y = 0.4; cat.pose(SS_CAT_POSES.loaf, t);
        const k = K(t, SS.eight2, SS.box);
        pos = ssV([1.2, 1.62, -1.2], [0.2, 1.62, -4.0], k); at = [-1.0, 1.3, -14]; fov = 58;
        for (const q of HANG) { const r = ssDist(q.h0, h); R.add(q.p[0], q.p[1], q.p[2], r, 0.32 * (1 - MathX.smooth(r, 2.5, 6))); }
      } else if (m === 'night' || m === 'dawn' || m === 'question') {
        // the farthest a word you say now could ever reach: a circle on the lawn round you
        const you = [0.0, 0, -7.0];
        catRoot.visible = m !== 'night' || t < SS.stop; catRoot.position.set(...G.catAt); catRoot.rotation.y = 0.4; cat.pose(SS_CAT_POSES.loaf, t);
        const Hr = ssHorizon(h), down = K(t, ssCap('stop', 2).show - 1, ssCap('stop', 2).show + 0.8);
        horizon.visible = m === 'night'; horizon.scale.setScalar(Math.max(0.05, Hr)); horizon.position.set(you[0], 0.02, you[2]);
        // (a line about 6 cm wide whatever the radius: rebuild the ring when its relative width changes)
        { const w = MathX.clamp(0.06 / Math.max(0.05, Hr), 0.002, 0.5); if (Math.abs(w - horizonW) > 0.0005) { horizonW = w; horizon.geometry.dispose(); horizon.geometry = new THREE.RingGeometry(1 - w, 1, 200); } }
        if (m === 'night') {
          const k = K(t, SS.midnight, SS.stop);
          pos = ssV([2.2, 4.5, 2.5], [1.4, 3.2, -0.6], k); at = [0, 0, -9]; fov = 66;
          if (t > SS.stop) { pos = ssV([1.4, 3.2, -0.6], [0.35, 1.62, -6.4], K(t, SS.stop, ssCap('stop', 2).show + 0.6)); at = ssV([0, 0, -9], [0.0, 0.0, -7.05], down); fov = ssLerp(66, 50, down); }
        } else if (m === 'dawn') {
          const k = K(t, SS.last, SS.real);
          pos = ssV([0.6, 1.62, -3.4], [0.2, 1.62, -4.2], k); at = ssV([-2.5, 1.6, -7.5], [SS_GD.bird[0], SS_GD.bird[1], SS_GD.bird[2]], K(t, ssCap('last', 0).show, ssCap('last', 1).show + 1)); fov = ssLerp(54, 34, K(t, ssCap('last', 0).show, ssCap('last', 1).show + 1));
          bird.g.visible = true;
          const ph = (t - SS.last) % 2.6, sing = ph > 0.3 && ph < 1.6 ? Math.max(0, Math.sin(ph * 24)) : 0; bird.open(sing);
        } else {
          const k = K(t, SS.question, SS.end);
          pos = ssV([0.8, 1.66, -1.0], [0.4, 1.66, -2.2], k); at = [-0.8, 1.6, -14]; fov = 58;
        }
      } else if (m === 'real') {
        // the patio table: a fresh mug of hot chocolate; a spoon taps it
        const mg = new THREE.Vector3(); P.mug.getWorldPosition(mg);
        const k = K(t, SS.real, SS.real + 4);
        pos = ssV([mg.x + 0.8, 1.35, mg.z + 1.0], [mg.x + 0.35, 1.12, mg.z + 0.5], k); at = [mg.x, mg.y + 0.05, mg.z]; fov = 44;
        if (t > SS.real3 + 1.0 && t < SS.real4) show = 'spoon';
        for (let i = 0; i < 26; i++) { const a = ((t * 0.5 + i / 26) % 1); steam.add(mg.x + 0.01 * Math.sin(i * 2 + t), mg.y + 0.1 + a * 0.28, mg.z + 0.01 * Math.cos(i * 3), 0.02 + 0.05 * a, 0.16 * (1 - a), 1, 1, 1); }
      }
      look(pos, at, fov, t, drift, roll);
      placeSun(D, [pos[0], 0, pos[2] - 4], m === 'plane' || m === 'boom' || m === 'carpet' ? 26 : 16);
      R.end(); trail.end(); steam.end();
      if (show === 'phone' && phone) hands.props.phone.update(ssPhoneState(t, phone));
      hands.update(t); hands.show(show);
      this._t = t;
    },
    labels(t) {
      const m = ssShotAt(t).mode, out = [];
      if (m === 'motorway') out.push({ p: [-60, 4, -1200], text: 'THE MOTORWAY', sub: '3.2 km · EVERY CAR FASTER THAN SOUND', a: StoryHUD.win(t, ssS('motorway') + 0.8, SS.eleven - 0.3, 0.3, 0.2) });
      if (m === 'storm') out.push({ p: [-320, 40, -950], text: 'LIGHTNING', sub: '1.0 km AWAY', a: StoryHUD.win(t, SS.flash + 0.3, SS.eight2 - 0.4, 0.3, 0.2) });
      if (m === 'tv') out.push({ p: [SS_K.tv[0], SS_K.tv[1] + 0.62, SS_K.tv[2]], text: 'PICTURE: NOW', sub: 'ITS SOUND: 4.5 s LATE', a: StoryHUD.win(t, ssCap('four', 1).show, SS.clap - 0.2, 0.3, 0.2) });
      if (m === 'box' || m === 'walkinto') out.push({ p: [SS_K.box[0], SS_K.box[1] + 0.2, SS_K.box[2]], text: 'ITS TUNE', sub: t < SS.boxGo ? 'NOT PLAYING YET' : ssFmtDist(ssDist(ssH(SS.boxGo), ssH(t))) + ' FROM THE BOX', a: StoryHUD.win(t, SS.boxGo - 0.2, SS.wait - 0.2, 0.3, 0.2) });
      if (m === 'wait') out.push({ p: [SS_K.box[0], SS_K.box[1] + 0.2, SS_K.box[2]], text: 'ITS TUNE', sub: ssFmtDist(ssDist(ssH(SS.boxGo), ssH(t))) + ' FROM THE BOX · YOU: 3.0 m', a: StoryHUD.win(t, SS.wait + 0.3, SS.tuneHere + 3, 0.3, 0.3) });
      if (m === 'night') out.push({ p: [0.0 + Math.max(0.12, ssHorizon(ssH(t))) * 0.7, 0.05, -7 + Math.max(0.12, ssHorizon(ssH(t))) * 0.7], text: 'YOUR VOICE CAN NEVER GO FURTHER', sub: ssFmtDist(ssHorizon(ssH(t))), a: StoryHUD.win(t, ssCap('midnight', 2).show, SS.last - 0.3, 0.3, 0.2) });
      if (m === 'neighbour') out.push({ p: [SS_GD.nb[0], 2.2, SS_GD.nb[2]], text: 'NEXT DOOR', sub: '"GOOD MORNING!"', a: StoryHUD.win(t, SS.morning, SS.morning + 3.2, 0.2, 0.3) });
      if (m === 'cat') out.push({ p: [SS_GD.cat0[0], 0.55, SS_GD.cat0[2]], text: 'HER MEOW', sub: ssFmtDist(ssDist(ssH(SS.meow), ssH(t))) + ' SO FAR', a: StoryHUD.win(t, SS.meow + 0.6, SS.hum - 0.3, 0.3, 0.2) });
      if (m === 'bird') out.push({ p: [SS_GD.bird[0], SS_GD.bird[1] + 0.16, SS_GD.bird[2]], text: 'BLACKBIRD', sub: '5.5 m · HEARD 0.016 s LATE', a: StoryHUD.win(t, ssCap('bird', 1).show, SS.plane - 0.3, 0.3, 0.2) });
      return out;
    },
    grade(t, p, shot) {
      const m = shot.mode, H = 7 + ssH(t);
      p.warmth = H < 8 || H > 29 ? 0.08 : H > 16 && H < 18 ? 0.06 : 0.02;
      if (m === 'storm') { p.exposure = 1.05; p.saturation = 0.8; p.contrast = 1.1; }
      if (H > 20.5 && H < 29) { p.exposure = 1.25; p.saturation = 0.9; p.bloom = 0.5; }
      if (m === 'box' || m === 'walkinto' || m === 'wait') { p.exposure = 1.05; p.warmth = 0.08; }
      if (m === 'plane') { p.bloom = 0.2; p.contrast = 1.04; }
    },
  };
  return set;
};
const SS_GARDEN = {};
