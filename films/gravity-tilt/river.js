/* =====================================================================
   RIVER — 4 km west of your street: the river through the fields, its straight reach running east into a bend that
   turns it north. With down turned east the straight reach is a chute: the water falls along its own bed (the bed is
   ground: it keeps its old down) at ~35 m/s; at the bend the bed turns and the water doesn't. It leaves the river as a
   sheet, breaks up into spray and drops, and falls on east, low over the fields, towards town (it arrives as rain at
   7:49:26). The water in the north reach just lies against its east bank. Its own set (a scene and a camera).
   Layout: metres; the bend starts at x 0; the channel is 26 m wide, 2.6 m deep; the town is ~4 km east (+x).
   ===================================================================== */

const GT_RV = { w: 13, depth: 2.6, R: 70, vMax: 35 };
// the channel's centre line: [x, z] from far west, east along z = 0, round the bend (centre (0, −70)) to the north
const GT_RV_LINE = (() => {
  const P = [];
  for (let x = -900; x < 0; x += 30) P.push([x, 0]);
  for (let k = 0; k <= 18; k++) { const a = k / 18 * Math.PI / 2; P.push([GT_RV.R * Math.sin(a), -GT_RV.R + GT_RV.R * Math.cos(a)]); }
  for (let z = -GT_RV.R - 30; z > -900; z -= 30) P.push([GT_RV.R, z]);
  return P;
})();
// how far the water in the straight reach has moved (m, along +x) by story time s: a gentle 0.8 m/s before, then the chute
function gtRvFlow(s) { if (s <= 0) return 0.8 * s; const k = GTP.g / GT_RV.vMax; return GT_RV.vMax * GT_RV.vMax / GTP.g * Math.log(Math.cosh(k * s)); }
const gtRvSpeed = (s) => (s <= 0 ? 0.8 : GT_RV.vMax * Math.tanh(GTP.g * s / GT_RV.vMax));

function gtStreakCanvas(seed, w = 512, h = 128) {
  const r = new RNG(seed);
  return gtCanvas(w, h, (g) => {
    g.fillStyle = '#3d5560'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { const y = r.range(0, h), x = r.range(-60, w), L = r.range(30, 160); g.fillStyle = `rgba(${r.next() < 0.5 ? '210,230,235' : '20,40,50'},${r.range(0.06, 0.3)})`; g.fillRect(x, y, L, r.range(0.6, 2.2)); g.fillRect(x - w, y, L, 1); }
  });
}

GT_SETS.river = (app) => {
  const sunD = gtSunDir(80);
  const S = gtSet(app, { sky: '#b9cfe2', fov: 50, near: 0.1, far: 6000, hemi: ['#dbe8f5', '#7a6a58', 0.6], sun: [sunD[0] * 80, sunD[1] * 80, sunD[2] * 80], sunI: 3.6, sunColor: '#ffe2bc', shadow: 2048, shadowR: 60, shadowFar: 300, env: ['#9cc0e6', '#e2ddd2', '#6c6256'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  scene.fog = new THREE.FogExp2('#c9d6e0', 0.00032);
  gtSky(scene, '#4a8ad6', '#d6e2ea', '#8c8a84', { sunDir: sunD, sunGlow: '#ffd9a8', hw: 0.3 });
  const M = {
    field: gtStd('#ffffff', 1.0, 0, { map: (() => { const t = gtTex(gtGrassCanvas(31)); t.repeat.set(220, 220); return t; })() }),
    field2: gtStd('#8a8a52', 1.0), bank: gtStd('#5e5a46', 1.0), bed: gtStd('#3e3a30', 1.0), hedge: gtStd('#3f5e2c', 0.95, 0, { flatShading: true }),
    water: gtStd('#ffffff', 0.12, 0.1, { map: (() => { const t = gtTex(gtStreakCanvas(5)); t.repeat.set(30, 1); return t; })(), transparent: true, opacity: 0.92, envMapIntensity: 1.2 }),
    barn: gtStd('#7a3a2a', 0.8), roof: gtStd('#5a5c60', 0.7, 0.3), white: gtStd('#e8e4da', 0.8), bark: gtStd('#5a4a3a', 0.95), leaf: gtStd('#4e7838', 0.85, 0, { flatShading: true }), track: gtStd('#a89c84', 0.95),
  };
  // ---- the ground, with the channel cut out of it; the banks; the bed
  const L = GT_RV_LINE, n = L.length, w = GT_RV.w, D = GT_RV.depth;
  const norm = (i) => { const a = L[Math.max(0, i - 1)], b = L[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [-dz / l, dx / l]; };
  const edge = (side, off) => L.map((p, i) => { const q = norm(i); return [p[0] + q[0] * side * off, p[1] + q[1] * side * off]; });
  const outerL = edge(1, w), outerR = edge(-1, w), innerL = edge(1, w - 3.2), innerR = edge(-1, w - 3.2);
  { const sh = new THREE.Shape(); sh.moveTo(-3000, -3000); sh.lineTo(3000, -3000); sh.lineTo(3000, 3000); sh.lineTo(-3000, 3000); sh.closePath();
    const hole = new THREE.Path(); const poly = [...outerL, ...outerR.slice().reverse()]; hole.moveTo(poly[0][0], -poly[0][1]); for (const p of poly.slice(1)) hole.lineTo(p[0], -p[1]); hole.closePath(); sh.holes.push(hole);
    const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, M.field); m.receiveShadow = true; scene.add(m);
    // (the uv of a ShapeGeometry is its x, y: scale the repeat down to metres)
    M.field.map.repeat.set(1 / 14, 1 / 14); }
  const strip = (A, B, yA, yB, mat) => {
    const pos = [], idx = [];
    for (let i = 0; i < A.length; i++) pos.push(A[i][0], yA, A[i][1], B[i][0], yB, B[i][1]);
    for (let i = 0; i < A.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.material.side = THREE.DoubleSide; m.receiveShadow = true; scene.add(m); return m;
  };
  strip(outerL, innerL, 0, -D, M.bank); strip(outerR, innerR, 0, -D, M.bank); strip(innerL, innerR, -D, -D, M.bed);
  // ---- the water: in the straight reach (falling along it), and the slack water lying against the north reach's east bank
  const reach = L.filter((p) => p[1] === 0 && p[0] <= 0);
  const wl = reach.map((p) => [p[0], -(w - 2.5)]), wr = reach.map((p) => [p[0], w - 2.5]);
  const water = strip(wl, wr, -1.0, -1.0, M.water); water.renderOrder = 2;
  { const g = water.geometry, uv = []; for (let i = 0; i < reach.length; i++) uv.push(reach[i][0] / 40, 0, reach[i][0] / 40, 1); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); M.water.map.repeat.set(1, 1); }
  const northW = new THREE.Mesh(new THREE.PlaneGeometry(800, 2.0), gtStd('#4a6470', 0.1, 0.1, { envMapIntensity: 1.2 })); northW.rotation.y = -Math.PI / 2; northW.position.set(GT_RV.R + w - 3.4, -D + 1.0, -500); scene.add(northW);
  // ---- the fields: hedgerows, a track, a farm, telegraph poles, trees (rooted: they bend east)
  const B = new Batcher(), r = new RNG(12);
  for (const z of [-160, -60, 70, 190]) for (let x = -700; x < 900; x += r.range(18, 30)) if (!(x > -30 && x < 120 && Math.abs(z) < 90 && z < 0)) B.add(gtBlobGeo(r.range(2.2, 3.2), x), M.hedge, Geo.matrix(x, 1.0, z + r.range(-1, 1), 0, 0, 0, r.range(3.5, 5), 0.6, 1));
  for (let x = 200; x < 900; x += 40) { B.add(new THREE.CylinderGeometry(0.12, 0.15, 8, 6), M.bark, Geo.matrix(x, 4, 45)); B.add(new THREE.BoxGeometry(0.1, 0.1, 1.6), M.bark, Geo.matrix(x, 7.6, 45)); }
  B.add(new THREE.BoxGeometry(900, 0.04, 4), M.track, Geo.matrix(450, 0.02, 32));
  { const fx = 180, fz = 120; B.add(new THREE.BoxGeometry(22, 7, 12), M.barn, Geo.matrix(fx, 3.5, fz)); B.add(new THREE.BoxGeometry(23, 0.3, 13.5), M.roof, Geo.matrix(fx, 7.6, fz, 0.0, 0, 0));
    B.add(new THREE.BoxGeometry(10, 6, 9), M.white, Geo.matrix(fx - 30, 3, fz + 4)); B.add(new THREE.BoxGeometry(10.6, 0.3, 10), M.roof, Geo.matrix(fx - 30, 6.4, fz + 4)); }
  B.build(scene, 'fields');
  const trees = [];
  for (const [x, z] of [[-80, 30], [-40, -32], [120, 40], [150, -40], [230, 18], [-160, -28], [300, -60], [96, 70]]) trees.push(gtBuildTree(scene, x, z, r.range(8, 12), r.next(), { bark: M.bark, leaf: M.leaf, leaf2: M.hedge }));
  // ---- the spray: puffs and drop streaks leaving the bend and falling east
  const puffs = gtPuffs(scene, 3600, { soft: 1.4 });
  const N = 4000, sg = new THREE.BufferGeometry(), sp = new Float32Array(N * 6); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3).setUsage(THREE.DynamicDrawUsage));
  const streaks = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: '#e6eef2', transparent: true, opacity: 0.5, depthWrite: false })); streaks.frustumCulled = false; streaks.renderOrder = 6; scene.add(streaks);
  // where a drop leaves the bed: across the channel (z from −13 to 13), it leaves at the bend's outer edge
  const leaveX = (z) => Math.sqrt(Math.max(0, (GT_RV.R + w) ** 2 - (z + GT_RV.R) ** 2));
  // a drop launched at story time s0 from z0: its distance east after u seconds (35 m/s, slowing to 9.5)
  const dropX = (u) => { const vt = GT_RIVER.vDrop, v0 = GT_RV.vMax, tau = 2.2; return vt * u + (v0 - vt) * tau * (1 - Math.exp(-u / tau)); };
  // the sheet: the water slams into the bend's outer bank and is thrown up over it, still going east (a ski jump);
  // it thins and tears into spray over ~80 m
  const sheet = (() => {
    const NZ = 14, NL = 24, Ls = 80, pos = [], uv = [], idx = [];
    for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NL; j++) {
      const z = -w + 2 * w * i / NZ, l = Ls * Math.pow(j / NL, 1.3), q = l / Ls;
      pos.push(leaveX(z) + l, -0.6 + 0.6 + 4.2 * Math.pow(q, 0.6) * (0.7 + 0.3 * Math.cos(z * 0.4)), z * (1 + 0.5 * q)); uv.push(l, i / NZ);
    }
    for (let i = 0; i < NZ; i++) for (let j = 0; j < NL; j++) { const a = i * (NL + 1) + j, b = a + NL + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { off: { value: 0 }, k: { value: 0 } },
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float off; uniform float k; varying vec2 vU;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        void main(){ float q = vU.x / 80.0; float st = n(vec2((vU.x - off) * 0.18, vU.y * 40.0)) * 0.6 + n(vec2((vU.x - off) * 0.6, vU.y * 120.0)) * 0.4;
          float tear = smoothstep(0.15 + 0.7 * q, 0.35 + 0.7 * q, st);   // (it tears into strands as it goes)
          float a = k * (1.0 - smoothstep(0.35, 1.0, q)) * mix(0.85, tear, smoothstep(0.05, 0.5, q)) * smoothstep(0.0, 0.08, vU.y) * smoothstep(1.0, 0.92, vU.y);
          gl_FragColor = vec4(mix(vec3(0.62, 0.74, 0.8), vec3(0.95, 0.97, 0.98), 0.4 + 0.6 * st), a * 0.85); }` }));
    m.renderOrder = 5; m.frustumCulled = false; scene.add(m); return m;
  })();
  let _s = 0;
  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const s = gtStoryAt(t); _s = s; this._s = s;
      M.water.map.offset.x = -gtRvFlow(s) / 40;
      sheet.material.uniforms.off.value = gtRvSpeed(s) * s; sheet.material.uniforms.k.value = gtSm(s, 0.3, 1.2);
      for (const tr of trees) { const b = gtTreeBend(s, tr.stiff, tr.seed), ax = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), -tr.yaw); for (const g of tr.segs) g.quaternion.setFromAxisAngle(ax, -b / 3); }
      // the spray (from s 0.5 on): a sheet that breaks up; each particle's place from its launch time (pure)
      puffs.begin(); let m = 0;
      if (s > 0.5) for (let i = 0; i < 3400; i++) {
        const a = gtR(i, 901), b = gtR(i, 902), c = gtR(i, 903), u = ((s - 0.5) + a * 60) % 60;
        if (u > s - 0.5) continue;                                            // (launched before the water left: not yet)
        const z0 = -w + 2 * w * b, x = leaveX(z0) + dropX(u * (0.6 + 0.4 * c) * 1.0), spread = Math.min(1, u / 6);
        const y = -0.8 + (0.5 + 9 * c * c) * spread + 1.2 * Math.sin(i + u * 0.7) * spread, z = z0 + (c - 0.5) * 22 * spread;
        const al = (0.12 + 0.3 * (1 - spread)) * Math.min(1, u * 4) * (1 - Math.min(1, x / 2600)) * (1 - 0.6 * Math.min(1, x / 900));
        puffs.add(x, y, z, 1.2 + 5 * spread * (0.4 + c), al, 0.94, 0.96, 0.97);
      }
      puffs.end();
      if (s > 0.5) { cam.getWorldPosition(_gtV); for (let i = 0; i < N; i++) {
        const a = gtR(i, 911), b = gtR(i, 912), c = gtR(i, 913), uu = ((s - 0.5) + a * 40) % 40; if (uu > s - 0.5 || uu < 0.05) continue;
        const z0 = -w + 2 * w * b, x = leaveX(z0) + dropX(uu), spread = Math.min(1, uu / 5), y = -0.6 + (0.3 + 8 * c * c) * spread, z = z0 + (c - 0.5) * 20 * spread;
        const v = GT_RIVER.vDrop + (GT_RV.vMax - GT_RIVER.vDrop) * Math.exp(-uu / 2.2), len = v * 0.03;
        sp[m * 6] = x; sp[m * 6 + 1] = y; sp[m * 6 + 2] = z; sp[m * 6 + 3] = x - len; sp[m * 6 + 4] = y; sp[m * 6 + 5] = z; m++;
      } }
      sg.setDrawRange(0, m * 2); sg.attributes.position.needsUpdate = true; streaks.visible = m > 0;
      // the camera
      const k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      let p, at, fov = 50, up = [0, 1, 0];
      switch (shot.mode) {
        case 'river': p = gtV([-150, 95, 120], [-120, 85, 108], k); at = [70, -4, -12]; fov = 46; break;
        case 'bend': p = gtV([92, 13, 46], [88, 12, 44], k); at = [24, -1, -8]; fov = 50; break;
        case 'spray': p = gtV([8, 42, 30], [24, 38, 26], k); at = [500, 0, -4]; fov = 50; break;   // (behind it, looking the way it's falling: towards town)
        default: p = [-60, 40, 60]; at = [40, 0, 0];
      }
      const d = gtDrift(t, 0.05, 0.3, 21);
      gtCamU(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, up);
      const f = shot.mode === 'river' ? [20, 0, 0] : shot.mode === 'bend' ? [30, 0, 0] : [150, 0, 0];
      sun.position.set(f[0] + sunD[0] * 150, f[1] + sunD[1] * 150, f[2] + sunD[2] * 150); sun.target.position.set(f[0], f[1], f[2]); sun.target.updateMatrixWorld();
    },
    labels(t) {
      const sh = gtShotAt(t); if (sh.mode !== 'spray') return [];
      return [{ p: [4000, 30, 0], text: 'YOUR STREET', sub: '4 km EAST', a: StoryHUD.win(t, sh.t0 + 0.6, sh.t1 - 0.2, 0.3, 0.2) }];
    },
    grade(t, p) { p.exposure = 1.0; p.warmth = 0.03; p.saturation = 1.05; p.contrast = 1.06; p.vignette = 0.42; p.bloom = 0.28; },
  };
  return set;
};
