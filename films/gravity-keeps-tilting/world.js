/* =====================================================================
   WORLD — the film's one set: your living room (room.js), the street, the park and the church (street.js), the
   people and the birds (cast.js); 4 PM on a clear Saturday in late October, the sun low in the west-south-west. Every
   shot (shots.js) is a mode: story time s comes from the one clock (script.js: gkStoryAt), the world is posed with it
   (pure), and the mode places the camera.
   Two kinds of camera:
     FIXED   to the building or the ground (up is the old up): you see things slide, hang and fall the way down points
     FELT    turned with down, the way your body feels it (gkFelt): the world steps round 1° each second, the room
             seems to roll; looking along the turning plane it needs the turned-direction form (gkFeltLook)
   ===================================================================== */

function gkCamU(cam, p, at, fov, up = [0, 1, 0]) {
  cam.position.set(p[0], p[1], p[2]); cam.up.set(up[0], up[1], up[2]).normalize(); cam.lookAt(at[0], at[1], at[2]);
  if (fov && cam.fov !== fov) cam.fov = fov;
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}
const gkAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
// the felt camera's angle: it catches up with each tick in ~0.15 s (your body re-finding down), so the picture steps
const gkFeltDeg = (s) => { if (s < 1) return 0; const k = Math.floor(s + 1e-9); return k - 1 + gkSm(s - k, 0, 0.16); };
// turn a vector by deg about z (east → up)
const gkRz = (v, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), n = Math.sin(a); return [v[0] * c - v[1] * n, v[0] * n + v[1] * c, v[2]]; };
const gkFeltUp = (s, off = 0) => gkRz([0, 1, 0], gkFeltDeg(s) + off);

// the crack in your ceiling (the slab you stand on once down points up): drawn up to fraction k
function gkCrackDraw(g, w, h, st) {
  g.clearRect(0, 0, w, h);
  const r = new RNG(907), n = 90, k = st.k;
  g.strokeStyle = 'rgba(40,34,28,0.92)'; g.lineCap = 'round';
  let x = 0, y = h * 0.5;
  for (let i = 0; i < n * k; i++) {
    const nx = x + w / n, ny = MathX.clamp(y + r.range(-1, 1) * h * 0.09, h * 0.2, h * 0.8);
    g.lineWidth = 1.5 + 2.6 * (1 - Math.abs(i / n - 0.45)); g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
    if (r.next() < 0.18) { g.lineWidth = 1; g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx + r.range(-12, 12), ny + r.range(-1, 1) * h * 0.3); g.stroke(); }
    x = nx; y = ny;
  }
}

// SPECKS: a dot of at least minPx pixels for each small thing in the sky (a leaf 170 m up, a car 7 km up is far below
// a pixel; a real eye sees a flock of them as specks). A dot fades out once the thing itself is big enough to see.
function gkSpecks(scene, max) {
  const geo = new THREE.BufferGeometry(), P = new Float32Array(max * 3), Sz = new Float32Array(max), Cc = new Float32Array(max * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('size', new THREE.BufferAttribute(Sz, 1).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('color', new THREE.BufferAttribute(Cc, 3).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { minPx: { value: 2 }, scale: { value: 500 } },
    vertexShader: `attribute float size; attribute vec3 color; uniform float minPx, scale; varying vec3 vC; varying float vA;
      void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; float mp = minPx * (size > 2.0 ? 1.8 : 1.0), px = size * scale / max(0.001, -mv.z); vA = 1.0 - smoothstep(mp, mp * 2.5, px); gl_PointSize = mp; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0 || vA < 0.01) discard; gl_FragColor = vec4(vC, vA * (1.0 - r * r * r * r)); }` });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 6; scene.add(pts);
  let n = 0;
  return { pts, mat, begin() { n = 0; }, add(x, y, z, size, c) { if (n >= max) return; P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z; Sz[n] = size; Cc[n * 3] = c[0]; Cc[n * 3 + 1] = c[1]; Cc[n * 3 + 2] = c[2]; n++; },
    end() { geo.setDrawRange(0, n); for (const a of ['position', 'size', 'color']) geo.attributes[a].needsUpdate = true; } };
}
const GK_SPECK_C = { leaf: [0.74, 0.3, 0.07], tile: [0.42, 0.18, 0.12], car: [0.1, 0.1, 0.12], bin: [0.12, 0.14, 0.12], drop: [0.92, 0.96, 1.0] };

GK_SETS.world = (app) => {
  const sun0 = gkSunDir();
  const S = gkSet(app, { sky: '#a9c3dc', fov: 50, near: 0.02, far: 6000, hemi: ['#d6e2ef', '#6f6252', 0.55], sun: [sun0[0] * 60, sun0[1] * 60, sun0[2] * 60], sunI: 4.0, sunColor: '#ffd9a6', shadow: 2048, shadowR: 10, shadowFar: 300, env: ['#8db4dc', '#ead8c0', '#6c6256'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  scene.fog = new THREE.FogExp2('#d9d2c6', 0.0012);
  const sky = gkSky(scene, '#4a7fc4', '#ecd9c0', '#8c8a84', { sunDir: sun0, sunGlow: '#ffcf9a', hw: 0.3, r: 4000 });
  const GK_GLOW = new THREE.Color('#ffcf9a');
  const R = gkBuildRoom(S), T = gkBuildStreet(S), C = gkBuildCast(S, R, T);
  // ---- inside: the daylight from the north window (cool) and a warm bounce from the lamps
  const fillA = new THREE.PointLight('#dfe8f2', 0, 8, 1.3), fillB = new THREE.PointLight('#ffd9b0', 0, 7, 1.4); scene.add(fillA, fillB);
  // ---- the crack (on the ceiling by the window wall)
  const crack = gkCanvasTex(1024, 64, gkCrackDraw);
  const crackM = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.22), new THREE.MeshBasicMaterial({ map: crack.tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  crackM.rotation.x = Math.PI / 2; crackM.position.set(-0.1, GK_ROOM.H - 0.002, 1.72); crackM.renderOrder = 3; R.room.add(crackM);
  const flakes = gkPuffs(scene, 300, { soft: 0.8 });
  const specks = gkSpecks(scene, 12000);
  const set = {
    scene, camera: cam, R, T, C,
    cuts() { return GK.subCuts; },
    frame(t, shot) {
      const m = shot.mode, s = gkStoryAt(t);
      this._s = s;
      const pov = !!shot.pov;
      // ------------------------------------------------------------------ the camera
      const k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      const RL = (x, y, z) => R.toWorld(x, y, z).toArray();               // room-local → world
      const v = { p: [0, 2, -5], at: [0, 1, 0], fov: 50, up: [0, 1, 0], drift: 0.004, sh: { f: null, R: 12 }, inside: false, fog: 1, glow: 0.45, far: 6000 };
      if (GK_SKY_MODES.includes(m) || (m === 'count' && GK.subCuts.filter((c) => t >= c).length === 3)) { T.update(s, {}); this._leafC = gkLeafCentroid(T); this._dropC = gkDropCentroid(s); }
      gkShotCam(this, m, s, t, k, shot, v, RL);
      const d = v.drift ? gkDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      const near = v.near || (pov || v.inside ? 0.02 : 0.15); if (cam.near !== near) cam.near = near;
      if (cam.far !== v.far) cam.far = v.far;
      gkCamU(cam, gkAdd(v.p, d), gkAdd(v.at, d), v.fov, v.up);
      // ------------------------------------------------------------------ pose the world
      R.update(s, { pov });
      T.update(s, { cam });
      C.update(s, { pov });
      { const kk = Math.round(60 * gkSm(s, 210.5, 217.5)) / 60; crackM.visible = kk > 0 && gkDeg(s) < 300; if (crackM.visible) crack.update({ k: kk }); }
      flakes.begin();
      if (gkDeg(s) >= 210 && gkDeg(s) < 230) for (let i = 0; i < 70; i++) { const u = (s * 0.35 + gkR(i, 3)) % 1, x = -1.6 + 3.6 * gkR(i, 5), p = R.toWorld(x - 0.25, GK_ROOM.H - 0.02, 1.72 + 0.08 * (gkR(i, 7) - 0.5)); flakes.add(p.x, p.y - 0.01 - 0.25 * u * u, p.z, 0.012, 0.6 * (1 - u) * gkSm(s, 211, 213), 0.9, 0.88, 0.84); }
      flakes.end();
      // ------------------------------------------------------------------ specks for what's up in the sky
      specks.begin();
      if (gkDeg(s) >= 20 && !v.inside) {
        const e = T.leaves.im.instanceMatrix.array;
        for (let i = 0; i < T.leaves.L.length; i++) { const y = e[i * 16 + 13]; if (T.leaves.fly[i] && y > 2.5) specks.add(e[i * 16 + 12], y, e[i * 16 + 14], 0.12, GK_SPECK_C.leaf); }
        const tl = T.tiles.im.instanceMatrix.array;
        for (let i = 0; i < T.tiles.Tl.length; i++) if (s > T.tiles.Tl[i].go) specks.add(tl[i * 16 + 12], tl[i * 16 + 13], tl[i * 16 + 14], 0.4, GK_SPECK_C.tile);
        if (T.drops.mesh.visible) { const P = T.drops.pos; for (let i = 0; i < T.drops.D.length; i++) if (P[i * 12 + 1] > 1) specks.add(P[i * 12 + 6], P[i * 12 + 7], P[i * 12 + 8], 0.05, GK_SPECK_C.drop); }
        for (const it of T.sim) if (it.g.position.y > 3) specks.add(it.g.position.x, it.g.position.y, it.g.position.z, it.b.kind === 'car' ? 4.5 : 1, it.b.kind === 'car' ? GK_SPECK_C.car : GK_SPECK_C.bin);
      }
      specks.end();
      specks.mat.uniforms.minPx.value = Math.max(1.5, 2.6 * (app.renderH || 1080) / 1080);
      specks.mat.uniforms.scale.value = (app.renderH || 1080) / (2 * Math.tan(cam.fov * Math.PI / 360));
      // ------------------------------------------------------------------ fog, sky
      scene.fog.density = 0.0012 * v.fog;
      sky.material.uniforms.sc.value.copy(GK_GLOW).multiplyScalar(v.glow);
      // ------------------------------------------------------------------ light: the sun's shadow round what we look at
      const f = v.sh.f || v.at, D = 150;
      sun.position.set(f[0] + sun0[0] * D, f[1] + sun0[1] * D, f[2] + sun0[2] * D); sun.target.position.set(f[0], f[1], f[2]); sun.target.updateMatrixWorld();
      { const c = sun.shadow.camera; if (c.right !== v.sh.R) { c.left = -v.sh.R; c.right = v.sh.R; c.top = v.sh.R; c.bottom = -v.sh.R; c.updateProjectionMatrix(); } }
      sun.shadow.bias = v.sh.R > 20 ? -0.0006 : -0.0003; sun.shadow.normalBias = v.sh.R > 20 ? 0.06 : 0.02;
      this._inside = v.inside;
      S.hemi.intensity = v.inside ? 0.32 : 0.6; scene.environmentIntensity = v.inside ? 0.45 : 0.85;
      if (v.inside) { fillA.position.copy(R.toWorld(0.2, 1.6, -1.2)); fillB.position.copy(R.toWorld(-0.6, 1.4, 0.8)); }
      // (the room darkens as its lamps go: the table lamp, the floor lamp, then the ceiling lamp; the window stays)
      const lit = 0.55 + 0.15 * (s < GK_LAMPS.tlamp) + 0.1 * (s < GK_LAMPS.flamp) + 0.2 * (s < GK_ROOM.lamp.broken);
      fillA.intensity = v.inside ? 2.0 : 0; fillB.intensity = v.inside ? 1.6 * lit : 0;
    },
    labels(t) { return gkLabels(this, t); },
    grade(t, p, shot) {
      const m = shot.mode, s = this._s;
      if (this._inside) { p.exposure = 1.3; p.warmth = 0.05; p.bloom = 0.34; p.bloomThreshold = 0.86; }
      else { p.exposure = 1.0; p.warmth = 0.05; p.bloom = 0.28; }
      p.saturation = 1.06; p.contrast = 1.07; p.vignette = 0.46;
      if (m === 'ear') { p.edgeBlur = 0.25 + 0.2 * Math.sin(t * 1.1); p.vignette = 0.56; }
      if (m === 'sky0') { p.vignette = 0.6; }
      // the big hits: a kick (the spire, the cars into the church, the lamp, the two avalanches)
      for (const [ss, a] of GK_KICKS) { const u = s - ss; if (u > 0 && u < 0.6) { p.flash = Math.max(p.flash || 0, a * Math.exp(-u / 0.06)); if (u < 0.07) p.chroma = Math.max(p.chroma || 0, 0.6 * a); } }
    },
  };
  return set;
};
// story times of the big hits (the grade's kick; the sound reads them too)
const GK_KICKS = [[GK_SPIRE.hitS + 1.9, 0.14], [41.4, 0.12], [43.2, 0.16], [GK_ROOM.lamp.broken, 0.12]];

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, up, drift, sh: { f, R }, inside, fog, far }. RL(x, y, z): room → world
// ---------------------------------------------------------------------------------------------------------------------
function gkShotCam(set, m, s, t, k, shot, v, RL) {
  const V = gkV, into = (a, b, u) => V(a, b, Ease.inOutSine(u));
  const felt = (off = 0) => { v.up = gkFeltUp(s, off); };
  // a felt camera looking along (yaw, pitch) in the felt frame (yaw 0 = north, + = west; pitch + = up)
  const feltLook = (p, yaw, pitch, off = 0) => { const a = gkFeltDeg(s) + off; v.p = p; v.at = gkAdd(p, gkRz(gkDir(yaw, pitch), a)); v.up = gkRz([0, 1, 0], a); };
  const E = -Math.PI / 2, W = Math.PI / 2;
  // a point to look at: towards tgt's bearing, at a given elevation (deg) — for sky shots that keep the ground in frame
  const aimEl = (p, tgt, el) => { const dx = tgt[0] - p[0], dz = tgt[2] - p[2], h = Math.hypot(dx, dz) || 1, e = el * Math.PI / 180; return [p[0] + dx / h * Math.cos(e) * 100, p[1] + Math.sin(e) * 100, p[2] + dz / h * Math.cos(e) * 100]; };
  switch (m) {
    // ---- 1: the first ticks
    case 'room0': {                                       // your room, as you feel it: it steps round 1° a second
      v.p = into(RL(-1.95, 1.95, 1.9), RL(-1.6, 1.85, 1.55), k); v.at = RL(0.55, 0.85, -1.3); v.fov = 60; felt(); v.inside = true; v.drift = 0.002; v.sh = { f: RL(0, 1, 0), R: 4 }; break; }
    case 'ball': v.p = into(RL(2.0, 0.26, -0.9), RL(1.97, 0.28, -0.88), k); v.at = RL(-0.7, 0.12, -1.3); felt(); v.fov = 50; v.inside = true; v.drift = 0.0012; v.near = 0.02; v.sh = { f: RL(0.8, 0.1, -0.9), R: 3 }; break;
    case 'pond0': v.p = into([5, 1.3, -67], [7, 1.3, -66.2], k); v.at = [24, 0.5, -46]; v.fov = 44; v.drift = 0.002; v.fog = 0.6; v.sh = { f: [22, 0, -44], R: 26 }; break;
    case 'spire': v.p = into([80, 1.7, -64], [81.5, 1.8, -61], k); v.at = gkV([90.5, 27, -20.5], [103, 5, -20.5], gkSm(s, GK_SPIRE.hitS - 0.6, GK_SPIRE.hitS + 1.7)); v.fov = 46 + 6 * gkSm(s, GK_SPIRE.hitS - 0.6, GK_SPIRE.hitS + 1.7); v.drift = 0.003; v.fog = 0.6; v.sh = { f: [92, 10, -20], R: 30 }; break;
    case 'ear': v.p = into(RL(-0.6, 1.75, 1.8), RL(-0.45, 1.7, 1.65), k); v.at = RL(0.45, 1.1, -1.3); v.fov = 56; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'cars0': feltLook(into([-14, 1.55, -1.0], [-12.5, 1.55, -1.0], k), -0.8, -0.12); v.fov = 56; v.drift = 0.004; v.fog = 0.7; v.sh = { f: [20, 0, -5], R: 40 }; break;
    case 'slide': v.p = RL(-2.25, 2.05, -1.75); v.at = RL(1.1, 0.35, 0.65); v.fov = 64; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'hold': v.p = into(RL(-0.75, 1.05, -0.55), RL(-0.6, 1.0, -0.65), k); v.at = RL(0.35, 0.55, -1.6); v.fov = 54; felt(); v.inside = true; v.drift = 0.002; v.sh = { f: RL(0.3, 0.5, -1.5), R: 3 }; break;
    // ---- 2: everything slides east
    case 'street1': v.p = into([3, 3.2, -12.4], [6, 3.0, -12.4], k); v.at = [62, 0.6, -5.5]; v.fov = 54; v.drift = 0.003; v.fog = 0.6; v.sh = { f: [30, 0, -6], R: 40 }; break;
    case 'church0': v.p = into([64, 3.0, -19], [65.5, 3.1, -18.5], k); v.at = [86, 2.2, -5]; v.fov = 50; v.drift = 0.004; v.sh = { f: [82, 1, -6], R: 22 }; break;
    case 'dome0': v.p = into([28.0, 1.8, -24.6], [29.0, 1.7, -25.4], k); v.at = [34.6, 1.2, -30]; v.fov = 50; v.drift = 0.003; v.sh = { f: [34, 1, -30], R: 8 }; break;
    case 'follow': v.p = RL(-2.15, 1.85, -0.35); v.at = RL(1.4, 0.45, -1.3); v.fov = 60; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0.5, 0.5, -1), R: 4 }; break;
    case 'ski': feltLook(into([-44, 1.8, -18], [-42, 1.8, -19], k), -0.35, -0.12); v.fov = 62; v.drift = 0.004; v.fog = 0.7; v.sh = { f: [0, 0, -45], R: 70 }; break;
    case 'pond': v.p = into([-17, 3.4, -38], [-15, 3.2, -39], k); v.at = [3, -0.4, -52]; v.fov = 50; v.drift = 0.003; v.sh = { f: [0, 0, -52], R: 24 }; break;
    case 'wall': v.p = into(RL(-1.6, 1.55, 1.75), RL(-1.45, 1.5, 1.6), k); v.at = RL(1.6, 0.8, -1.1); felt(); v.fov = 64; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'win2': { const e = RL(0.75, 1.55, -1.25); v.p = e; v.at = RL(0.25, 1.15, -2.4); felt(); v.fov = 66; v.drift = 0.0015; v.sh = { f: [10, 0, -30], R: 40 }; v.fog = 0.7; break; }
    case 'dome1': { const q = gkKidState(s).pos; v.p = into([q[0] - 1.6, q[1] + 0.7, q[2] + 3.4], [q[0] - 1.3, q[1] + 0.75, q[2] + 3.0], k); v.at = [q[0] - 0.2, q[1] + 0.35, q[2] + 0.2]; felt(); v.fov = 50; v.drift = 0.0015; v.near = 0.05; v.sh = { f: q, R: 8 }; break; }
    case 'ninety': v.p = into([46, 1.7, -34], [47.5, 1.7, -35], k); v.at = [72, 0.8, -50]; v.fov = 58; v.drift = 0.003; v.fog = 0.5; v.sh = { f: [64, 0, -48], R: 30 }; break;
    // ---- 3: into the sky
    case 'stack': v.p = into([52, 2.0, -7.0], [54, 2.1, -7.0], k); v.at = [86, 13, -6]; v.fov = 54; v.drift = 0.004; v.sh = { f: [84, 6, -6], R: 24 }; break;
    case 'up0': v.p = [62, 1.6, -12]; v.at = (() => { const P = [0, 0, 0], Q = [0, 0, 0, 1]; let x = 0, y = 0, z = 0; for (const id of GK_CARS) { gkSimPose('street', id, s, P, Q); x += P[0]; y += P[1]; z += P[2]; } return [x / GK_CARS.length, y / GK_CARS.length, z / GK_CARS.length]; })(); v.fov = 50; v.drift = 0.004; v.fog = 0.3; v.far = 20000; v.sh = { f: [80, 10, -8], R: 40 }; break;
    case 'leaves0': v.p = into([38, 0.9, -44], [40, 1.0, -45], k); v.at = [92, 5, -52]; v.fov = 60; v.drift = 0.002; v.fog = 0.5; v.sh = { f: [60, 0, -48], R: 30 }; break;
    case 'circle': v.p = into([-120, 55, 70], [-110, 60, 62], k); v.at = [30, 60, -50]; v.fov = 52; v.drift = 0.004; v.fog = 0.35; v.far = 12000; v.sh = { f: [0, 0, -40], R: 90 }; break;
    case 'rainup': v.p = into([63, 1.5, -54], [65, 1.7, -55], k); v.at = aimEl(v.p, [170, 0, -56], 24); v.fov = 64; v.drift = 0.003; v.fog = 0.35; v.far = 4000; v.sh = { f: [70, 0, -54], R: 30 }; break;
    case 'tiles': v.p = into([2, 5.6, -86], [3, 5.9, -88], k); v.at = [3, 8.4, -104]; v.fov = 52; v.drift = 0.002; v.sh = { f: [3, 8, -104], R: 16 }; break;
    case 'climb': v.p = into([27.2, 2.6, -25.6], [27.8, 2.4, -26.2], k); v.at = [34.6, 1.7, -30]; v.fov = 50; v.drift = 0.003; v.sh = { f: [34, 1, -30], R: 8 }; break;
    case 'balcony': { const b = GK_BALC[1], o = gkBalcony(b, s); v.p = into([43.4, 2.4, -5.4], [43.8, 2.5, -5.2], k); v.at = [b.x + 0.9 * o.off[0], b.y + 0.4 + 0.9 * o.off[1], -0.9]; v.fov = 50; v.drift = 0.0015; v.sh = { f: [46, 3, -1], R: 10 }; break; }
    case 'balcony2': { const b = GK_BALC[12], o = gkBalcony(b, s); v.p = into([51.6, 8.4, -5.6], [52.0, 8.5, -5.4], k); v.at = [b.x + 0.9 * o.off[0], b.y + 0.4 + 0.9 * o.off[1], -0.9]; v.fov = 50; v.drift = 0.0015; v.sh = { f: [54, 9, -1], R: 10 }; break; }
    case 'trees': v.p = into([-12, 1.3, -40], [-14, 1.3, -41], k); v.at = aimEl(v.p, [-42, 0, -74], 14); v.fov = 62; v.drift = 0.002; v.fog = 0.35; v.far = 3000; v.sh = { f: [-36, 6, -66], R: 40 }; break;
    case 'ten': v.p = into(RL(-2.05, 1.2, 1.2), RL(-1.9, 1.15, 1.1), k); v.at = RL(1.6, 2.0, -0.9); felt(); v.fov = 62; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    // ---- 4: upside down
    case 'ceiling': v.p = into(RL(-1.6, 1.05, 1.5), RL(-1.3, 1.0, 1.3), k); v.at = RL(1.2, 1.7, -1.5); felt(); v.fov = 60; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'block': v.p = into([4, 1.7, -42], [4, 1.8, -38], k); v.at = [4, 9, 0]; felt(); v.fov = 52; v.drift = 0.003; v.sh = { f: [4, 6, 0], R: 30 }; break;
    case 'again': v.p = RL(-2.25, 0.45, 1.75); v.at = RL(0.6, 2.15, -0.5); felt(); v.fov = 66; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'crack': v.p = into(RL(1.05, 1.3, 0.75), RL(0.9, 1.3, 0.85), k); v.at = RL(-0.55, 2.6, 1.72); felt(); v.fov = 52; v.inside = true; v.drift = 0.001; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'sky0': { const it = set.T.sim.find((x) => x.b.id === 'car4'), P = [0, 0, 0];
      if (it) { it.g.updateMatrixWorld(true); (set._box || (set._box = new THREE.Box3())).setFromObject(it.g).getCenter(new THREE.Vector3()).toArray(P); } else gkSimPose('street', 'car4', s, P, [0, 0, 0, 1]);
      // a long lens locked on one car 7-8 km up: it fills a third of the frame (near/far hug it for depth precision)
      v.p = [60, 1.6, -9]; v.at = [P[0], P[1], P[2]]; const d = Math.hypot(P[0] - 60, P[1] - 1.6, P[2] + 9);
      v.fov = (414 / d) * gkLerp(3.2, 1.0, Ease.inOutSine(Math.min(1, k * 1.6))); v.drift = 0; v.near = d - 40; v.fog = 0.02; v.far = d + 40; v.glow = 0.2; v.sh = { f: [P[0], P[1], P[2]], R: 6 }; break; }
    case 'birds': { const b = gkBirdState(0, s, 'pigeon'), f = b.fwd, fl = Math.hypot(...f); v.p = [b.pos[0] - 2.6 * f[0] / fl + 0.9, b.pos[1] + 0.25, b.pos[2] - 2.6 * f[2] / fl + 0.6]; v.at = [b.pos[0] + 0.4 * f[0] / fl, b.pos[1], b.pos[2] + 0.4 * f[2] / fl]; v.fov = 44; v.drift = 0.001; v.fog = 0.5; v.near = 0.05; v.sh = { f: b.pos, R: 10 }; break; }
    case 'swings': v.p = into([40.5, 1.4, -19.5], [41.2, 1.5, -20.2], k); v.at = [46, 2.6, -24]; v.fov = 50; v.drift = 0.003; v.sh = { f: [46, 1, -24], R: 8 }; break;
    case 'kid': { const q = gkKidState(s).pos, a = gkLerp(2.5, 3.5, k); v.p = [q[0] - 2.6 * Math.cos(a) * -1, q[1] + 0.5, q[2] + 2.6 * Math.sin(a)]; v.at = [q[0], q[1] + 0.25, q[2]]; felt(); v.fov = 46; v.drift = 0.0015; v.near = 0.05; v.sh = { f: q, R: 6 }; break; }
    // the sky shots: always something on the ground in frame for scale (the tower, a block's face, the dome, roofs)
    case 'rising': v.p = into([82.5, 1.5, -29], [82.8, 1.5, -29.8], k); v.at = gkV([92, 30, -24], set._dropC, 0.55); v.fov = 66; v.drift = 0.002; v.fog = 0.06; v.far = 30000; v.sh = { f: [90, 10, -20], R: 30 }; break;
    case 'rising2': v.p = into([30.2, 0.6, -26.6], [30.5, 0.65, -27.4], k); v.at = aimEl(v.p, gkV([34, 0, -30], set._leafC, 0.5), 30); v.fov = 72; v.drift = 0.002; v.fog = 0.08; v.far = 30000; v.sh = { f: [34, 1, -30], R: 10 }; break;
    // ---- 5: coming back
    case 'high': v.p = into([50, 1.4, -2.6], [52, 1.4, -2.6], k); v.at = [gkV(set._leafC, set._dropC, 0.4)[0], 900, -60]; v.fov = 76; v.drift = 0.0015; v.fog = 0.06; v.far = 30000; v.sh = { f: [52, 6, 0], R: 30 }; break;
    case 'westwall': v.p = into(RL(-0.55, 1.25, 1.75), RL(-0.6, 1.2, 1.6), k); v.at = RL(-1.95, 1.35, -0.7); felt(); v.fov = 64; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'back': v.p = into([3, 1.4, -2.7], [1, 1.4, -2.7], k); v.at = gkV([-4, 40, 0], set._dropC, 0.7); v.fov = 70; v.drift = 0.0015; v.fog = 0.08; v.far = 30000; v.sh = { f: [0, 8, 0], R: 30 }; break;
    case 'back2': v.p = into([31.4, 0.6, -33.6], [31.2, 0.65, -33.0], k); v.at = aimEl(v.p, gkV([34, 0, -30], set._leafC, 0.5), 32); v.fov = 72; v.drift = 0.002; v.fog = 0.08; v.far = 30000; v.sh = { f: [34, 1, -30], R: 10 }; break;
    case 'home': v.p = into(RL(2.2, 1.55, 0.35), RL(2.1, 1.5, 0.2), k); v.at = RL(-2.3, 1.0, -0.1); v.fov = 62; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'down0': v.p = into([72, 1.5, -11], [73, 1.5, -12], k); v.at = aimEl(v.p, [90, 0, -22], 42); v.fov = 70; v.drift = 0.002; v.fog = 0.08; v.far = 30000; v.sh = { f: [90, 10, -20], R: 30 }; break;
    case 'down1': v.p = into([4, 3.0, -82], [5, 3.2, -84], k); v.at = aimEl(v.p, [-6, 0, -104], 33); v.fov = 70; v.drift = 0.002; v.fog = 0.1; v.far = 30000; v.sh = { f: [3, 8, -104], R: 16 }; break;
    case 'dome2': v.p = into([28.0, 1.5, -34.4], [28.6, 1.4, -34.0], k); v.at = [33.4, 0.9, -30]; v.fov = 48; v.drift = 0.002; v.sh = { f: [34, 1, -30], R: 8 }; break;
    case 'thirty': { const e = RL(1.25, 1.2, -0.95); v.p = e; v.at = RL(-0.35, 1.35, -2.2); felt(); v.fov = 64; v.drift = 0.0015; v.sh = { f: [0, 0, -30], R: 40 }; v.fog = 0.7; break; }
    case 'straight': v.p = into([-36, 1.5, -30], [-38, 1.5, -31], k); v.at = aimEl(v.p, set._leafC, 28); v.fov = 68; v.drift = 0.002; v.fog = 0.3; v.far = 12000; v.sh = { f: [-40, 0, -58], R: 40 }; break;
    case 'straight2': v.p = into([60, 2.0, -11], [58, 2.0, -11.5], k); v.at = gkV([-60, 10, -104], set._dropC, 0.6); v.fov = 62; v.drift = 0.002; v.fog = 0.15; v.far = 30000; v.sh = { f: [20, 0, -50], R: 60 }; break;
    case 'count': gkCountCam(set, s, t, v, RL); break;
    case 'down': v.p = into(RL(1.2, 1.45, 0.4), RL(1.0, 1.45, 0.25), k); v.at = RL(-1.1, 1.05, -1.5); v.fov = 54; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
    case 'comes': v.p = into([-8, 1.6, -5.5], [-10, 1.6, -5.5], k); v.at = [-420, 280, -12]; v.fov = 62; v.drift = 0.003; v.fog = 0.12; v.far = 30000; v.sh = { f: [-10, 0, -5], R: 30 }; break;
    case 'question': v.p = into(RL(1.35, 1.55, 0.9), RL(1.1, 1.52, 0.7), k); v.at = RL(-1.6, 1.15, -1.35); v.fov = 56; v.inside = true; v.drift = 0.0015; v.sh = { f: RL(0, 1, 0), R: 4 }; break;
  }
}
// the last ten seconds: quick cuts (GK.subCuts) round everyone
function gkCountCam(set, s, t, v, RL) {
  const n = GK.subCuts.filter((c) => t >= c).length; set._sub = n;
  const up = gkFeltUp(s);
  if (n === 0) { v.p = [28.4, 1.4, -34.2]; v.at = [33.6, 0.8, -30]; v.fov = 46; }
  else if (n === 1) { v.p = RL(1.6, 1.3, -0.6); v.at = RL(-2.0, 0.85, 0.2); v.fov = 58; v.up = up; v.inside = true; }
  else if (n === 2) { v.p = [30, 1.7, -2.5]; v.at = [80, 2.0, -6]; v.fov = 50; }
  else if (n === 3) { const P = [0, 0, 0], Q = [0, 0, 0, 1]; gkSimPose('street', 'car4', s, P, Q); v.p = [60, 1.6, -9]; v.at = [P[0], P[1], P[2]]; v.fov = 8; v.fog = 0.02; v.far = 30000; }
  else if (n === 4) { v.p = RL(1.25, 1.2, -0.95); v.at = RL(-0.35, 1.35, -2.2); v.fov = 64; v.up = up; }
  else { v.p = RL(2.15, 1.85, 1.6); v.at = RL(-1.2, 0.8, -1.0); v.fov = 62; v.inside = true; }
  v.drift = 0.003; v.sh = { f: v.inside ? RL(0, 1, 0) : v.at, R: v.inside ? 4 : 20 };
}

// the shots that look up at the sky aim at where things are (the leaves' cloud, the pond's drops): posed first
const GK_SKY_MODES = ['leaves0', 'rising', 'rising2', 'high', 'back', 'back2', 'down0', 'down1', 'straight', 'straight2', 'rainup', 'sky0'];
function gkLeafCentroid(T) {
  const e = T.leaves.im.instanceMatrix.array; let x = 0, y = 0, z = 0, n = 0;
  for (let i = 0; i < T.leaves.L.length; i++) if (T.leaves.fly[i]) { x += e[i * 16 + 12]; y += e[i * 16 + 13]; z += e[i * 16 + 14]; n++; }
  return n ? [x / n, y / n, z / n] : [0, 10, -50];
}
// the pond's drops: the middle of the cloud (a drop at the median speed, 6 m/s, that left at 97°, from the park's east end)
function gkDropCentroid(s) { const o = [0, 0]; gkFly(63, 0.3, 97, 6, Math.max(97, gkDegC(s)), o); return [o[0], o[1], -55]; }

// labels pinned in the scene: [{ p, text, sub, a, side }]
function gkLabels(set, t) {
  const shot = gkShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = set._s, R = set.R;
  const RL = (x, y, z) => R.toWorld(x, y, z).toArray(), sp = GK_ST.church.tower;
  if (m === 'spire' && s > GK_SPIRE.hitS + 1.0) out.push({ p: [(sp.x[0] + sp.x[1]) / 2 - 2, sp.h * 0.55, sp.z[0]], text: 'THE TOWER', sub: 'CONCRETE, STEEL INSIDE: IT HOLDS', a: W(s, GK_SPIRE.hitS + 1.0, gkStoryAt(shot.t1) - 0.1, 0.3, 0.2), side: 'r' });
  if (m === 'spire' && t < gkC('spire', 1) + 0.4) out.push({ p: [(sp.x[0] + sp.x[1]) / 2, sp.h + 12, (sp.z[0] + sp.z[1]) / 2], text: 'THE SPIRE', sub: '17 m OF STONE', a: W(t, shot.t0 + 0.6, gkC('spire', 1) + 0.3, 0.3, 0.3), side: 'r' });
  if (m === 'pond0') { out.push({ p: [GK_ST.pond.x + GK_ST.pond.rx - 3, 0.8, GK_ST.pond.z + 2], text: 'THE POND', sub: 'SPILLING OVER ITS BANK', a: W(t, shot.t0 + 0.3, shot.t1 - 0.2, 0.3, 0.2) });
    out.push({ p: [GK_ST.dome.x, 3.0, GK_ST.dome.z], text: 'A MOTHER AND HER DAUGHTER', sub: 'THE CLIMBING DOME', a: W(t, shot.t0 + 0.9, shot.t1 - 0.2, 0.3, 0.2), side: 'r' }); }
  if (m === 'church0') out.push({ p: [86, 9, -6], text: 'THE CHURCH', sub: 'THE END OF THE STREET', a: W(t, shot.t0 + 0.4, shot.t0 + 2.8, 0.3, 0.3), side: 'r' });
  if (m === 'pond') out.push({ p: [GK_ST.pond.x, 0.6, GK_ST.pond.z], text: 'THE POND', sub: 'EMPTY', a: W(t, shot.t0 + 0.6, shot.t1 - 0.3, 0.3, 0.3) });
  if (false && m === 'sky0') out.push({ p: (() => { const P = [0, 0, 0], Q = [0, 0, 0, 1]; gkSimPose('street', 'car4', s, P, Q); return P; })(), text: 'THE CARS', sub: Math.round(gkSimCarY(s) / 100) / 10 + ' km UP', a: W(t, shot.t0 + 0.8, shot.t1 - 0.3, 0.3, 0.3) });
  if (m === 'block') out.push({ p: RL(0.2, 1.6, -2.4), text: 'YOUR WINDOW', a: W(t, shot.t0 + 0.6, shot.t0 + 3.6, 0.3, 0.3) });
  if (m === 'balcony' || m === 'balcony2') for (const b of GK_BALC) if (b.go && s > b.go - 0.5 && s < b.go + GK_BALC_FOLD + 0.2) out.push({ p: [b.x - 1.2, b.y + 0.2, b.z - 0.5], text: 'ITS STEEL', sub: 'GIVING WAY', a: W(s, b.go + 0.2, b.go + GK_BALC_FOLD, 0.2, 0.15), side: 'r' });
  return out;
}
// the cars' mean height (m, from the simulation)
function gkSimCarY(s) { const P = [0, 0, 0], Q = [0, 0, 0, 1]; let y = 0, n = 0; for (const id of GK_SIM.street.ids) if (id.startsWith('car')) { gkSimPose('street', id, s, P, Q); y += P[1]; n++; } return y / n; }
