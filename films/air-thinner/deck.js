/* =====================================================================
   DECK — deck 15 (the pool deck), the dive shop on deck 2 and the line under the stern. Static parts are merged per
   material (Batcher); what changes is returned: the pool's and the hot tubs' water (they boil), the big screen (it dies
   with the power), the bar's glasses (they foam over), the sealed things that swell (crisp packets, sun cream, the
   flamingo float), the line and its six tanks.
     atDeck(set, ship) → { pool, tubs, screen, glasses, swell, seats, tankLine, shop }
   Layout: layout.js (AT_F). Nothing coplanar touches (3 cm apart); nothing longer than 25 m in one piece.
   ===================================================================== */

// ---- water (the pool, the hot tubs): see-through turquoise over the tiles, the sky in it, ripples; uBoil 0…1 seethes
function atWaterMat(o = {}) {
  const U = {
    uTime: { value: 0 }, uBoil: { value: 0 }, uBoilT: { value: 0 }, uSeed: { value: o.seed || 0 }, uZen: { value: new THREE.Color(0.2, 0.4, 0.8) }, uHor: { value: new THREE.Color(0.6, 0.7, 0.85) },
    uSun: { value: new THREE.Vector3(0, 1, 0) }, uLight: { value: 1 }, uSkyK: { value: 1 }, uScale: { value: o.scale || 1 },
    uDeep: { value: new THREE.Color(o.deep || '#0f6f86') }, uShallow: { value: new THREE.Color(o.shallow || '#48c6d6') }, uBubbles: { value: o.jets || 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: true,
    vertexShader: 'varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      uniform float uTime, uBoil, uBoilT, uSeed, uLight, uSkyK, uScale, uBubbles; uniform vec3 uZen, uHor, uSun, uDeep, uShallow; varying vec3 vW; varying vec2 vUv;
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vec2 P = vW.xz * uScale + uSeed * 13.1;
        vec2 rip = vec2(n2(P * 1.3 + vec2(0.0, uTime * 0.5)) - 0.5, n2(P * 1.3 + vec2(5.2, -uTime * 0.45)) - 0.5) * 0.35 + vec2(n2(P * 4.0 + uTime) - 0.5, n2(P * 4.0 - uTime * 0.9) - 0.5) * 0.12;
        // the jets (hot tubs) and the boil roughen it
        float ch = uBubbles * smoothstep(0.55, 0.8, n2(P * 5.0 + vec2(uTime * 1.7, 0.0))) + uBoil * (0.25 + 0.75 * smoothstep(0.45, 0.82, n2(P * 9.0 + vec2(0.0, uBoilT * 3.1)) * 0.55 + n2(P * 23.0 - uBoilT * 7.3) * 0.45));
        vec3 N = normalize(vec3(-rip.x * (1.0 + 3.0 * ch), 1.0, -rip.y * (1.0 + 3.0 * ch)));
        vec3 V = normalize(cameraPosition - vW), R = reflect(-V, N); R.y = abs(R.y);
        float fres = 0.03 + 0.97 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
        vec3 sky = mix(uHor, uZen, smoothstep(0.0, 0.6, R.y));
        float caust = pow(n2(P * 2.4 + rip * 3.0 + uTime * 0.3), 3.0) * 1.6;
        vec3 body = mix(uDeep, uShallow, 0.55 + 0.45 * caust) * (0.25 + 0.75 * max(uSun.y, 0.05) * mix(0.25, 1.0, uSkyK)) + uShallow * 0.25 * uLight;
        vec3 col = mix(body, sky, fres);
        col += vec3(1.0, 0.97, 0.9) * pow(max(dot(R, uSun), 0.0), 600.0) * 18.0;
        float foam = clamp(ch * 1.3, 0.0, 1.0);
        col = mix(col, vec3(0.88, 0.92, 0.95) * (0.35 + 0.65 * max(uSun.y, 0.2)), foam * (0.75 - 0.3 * uBoil));
        gl_FragColor = vec4(col, mix(0.72, 0.95, max(fres, foam)));
      }`,
  });
  return { mat, U };
}

// a sun lounger (local: its length along +z, the head end at +z): white frame; flat, or its back raised
function atLoungerGeos(raised) {
  const fr = [], cu = [];
  const bx = (arr, w, h, d, x, y, z, rx = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.applyMatrix4(Geo.matrix(x, y, z, rx, 0, 0)); arr.push(g); };
  for (const sx of [-0.31, 0.31]) { bx(fr, 0.045, 0.05, 1.95, sx, 0.31, 0); for (const z of [-0.88, 0.4]) bx(fr, 0.045, 0.31, 0.045, sx, 0.155, z); }
  bx(fr, 0.66, 0.035, 0.05, 0, 0.31, -0.95); bx(fr, 0.66, 0.035, 0.05, 0, 0.31, 0.95);
  bx(cu, 0.62, 0.07, 1.25, 0, 0.37, -0.3);
  const a = raised ? 0.75 : 0.0, L = 0.66;
  bx(cu, 0.62, 0.07, L, 0, 0.37 + Math.sin(a) * L / 2, 0.33 + Math.cos(a) * L / 2, -a);
  return { frame: THREE.mergeGeometries(fr.map((g) => g.toNonIndexed())), cushion: THREE.mergeGeometries(cu.map((g) => g.toNonIndexed())) };
}

function atDeck(set, ship) {
  const F = AT_F, S = set.scene, B = new Batcher(), D = F.deck, y = D(15), zh = F.B / 2 - 0.4, out = {};
  const M = ship.mats, white = M.white, steel = M.steel, glassM = M.glassM;
  const teakT = atTeakTex(); teakT.wrapS = teakT.wrapT = THREE.RepeatWrapping;
  const teak = new THREE.MeshStandardMaterial({ map: teakT, roughness: 0.78 });
  const stone = atStd('#e9e5dc', 0.6), tileT = atTileTex(); tileT.wrapS = tileT.wrapT = THREE.RepeatWrapping;
  const tile = new THREE.MeshStandardMaterial({ map: tileT, roughness: 0.35 });
  const P = F.pool, hx0 = P.x0 - 0.5, hx1 = P.x1 + 0.5, hz0 = P.z0 - 0.5, hz1 = P.z1 + 0.5;
  // ---- the floor: teak over the open area (x −78 … 44), in pieces; round the pool's coping
  { const xs = [F.open.x0, -60, -40, hx0, hx1, 5, 25, F.open.x1];
    for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1];
      if (a === hx0) { B.add(atUVMetres(Geo.flat(a, b, -zh, hz0, y + 0.03), 4, 'y'), teak, null); B.add(atUVMetres(Geo.flat(a, b, hz1, zh, y + 0.03), 4, 'y'), teak, null); }
      else B.add(atUVMetres(Geo.flat(a, b, -zh, zh, y + 0.03), 4, 'y'), teak, null); }
    // the coping: white stone, 0.5 m wide, a little proud of the teak
    B.box(hx1 - hx0, 0.08, 0.5, (hx0 + hx1) / 2, y + 0.04, P.z0 - 0.25, stone); B.box(hx1 - hx0, 0.08, 0.5, (hx0 + hx1) / 2, y + 0.04, P.z1 + 0.25, stone);
    B.box(0.5, 0.08, P.z1 - P.z0, P.x0 - 0.25, y + 0.04, 0, stone); B.box(0.5, 0.08, P.z1 - P.z0, P.x1 + 0.25, y + 0.04, 0, stone);
  }
  // ---- the pool's basin (tiled) and its water
  { const yb = y - P.depth, tu = (a) => a / 2;
    B.add(Geo.quad([P.x0, yb, P.z1], [P.x1, yb, P.z1], [P.x1, y, P.z1], [P.x0, y, P.z1], tu(P.x0), 0, tu(P.x1), tu(P.depth)).rotateY(0), tile, null);
    B.add(Geo.quad([P.x1, yb, P.z0], [P.x0, yb, P.z0], [P.x0, y, P.z0], [P.x1, y, P.z0], tu(P.x1), 0, tu(P.x0), tu(P.depth)), tile, null);
    B.add(Geo.quad([P.x0, yb, P.z0], [P.x0, yb, P.z1], [P.x0, y, P.z1], [P.x0, y, P.z0], 0, 0, tu(P.z1 - P.z0), tu(P.depth)), tile, null);
    B.add(Geo.quad([P.x1, yb, P.z1], [P.x1, yb, P.z0], [P.x1, y, P.z0], [P.x1, y, P.z1], 0, 0, tu(P.z1 - P.z0), tu(P.depth)), tile, null);
    B.add(atUVMetres(Geo.flat(P.x0, P.x1, P.z0, P.z1, yb), 2, 'y'), tile, null);
    // (the walls face inwards: Geo.quad's winding gives the normal; the quads above are wound to face the water)
    const w = atWaterMat({ seed: 1, scale: 1 }); const wm = new THREE.Mesh(atUVMetres(Geo.flat(P.x0, P.x1, P.z0, P.z1, y - 0.15), 1, 'y'), w.mat); wm.renderOrder = 2; S.add(wm);
    out.pool = { mesh: wm, U: w.U, y: y - 0.15 };
    // the steps' rail at the pool's aft end
    for (const sz of [-1.2, 1.2]) { const g = new THREE.TorusGeometry(0.45, 0.025, 6, 12, Math.PI); B.add(g, steel, Geo.matrix(P.x1 - 0.05, y + 0.45, sz, 0, Math.PI / 2, 0)); }
  }
  // ---- the hot tubs: raised (0.75 m), a teak skirt, a white rim, the water 0.13 m under it
  out.tubs = F.tubs.map(([x, z], i) => {
    B.add(new THREE.CylinderGeometry(1.75, 1.8, 0.72, 28, 1, true), teak, Geo.matrix(x, y + 0.03 + 0.36, z));
    const rim = new THREE.RingGeometry(1.45, 1.78, 28); rim.rotateX(-Math.PI / 2); B.add(rim, stone, Geo.matrix(x, y + 0.76, z));
    B.add(new THREE.CylinderGeometry(1.45, 1.45, 0.6, 28, 1, true), tile, Geo.matrix(x, y + 0.45, z, 0, 0, 0));
    const w = atWaterMat({ seed: 3 + i * 2.3, scale: 1.6, jets: 1, deep: '#127c8f', shallow: '#5fd2df' });
    const g = new THREE.CircleGeometry(1.45, 32); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, w.mat); m.position.set(x, y + 0.63, z); m.renderOrder = 2; S.add(m);
    // its two steps
    B.box(0.9, 0.24, 0.5, x, y + 0.15, z + (z > 0 ? -2.05 : 2.05), stone); B.box(0.9, 0.48, 0.4, x, y + 0.27, z + (z > 0 ? -1.86 : 1.86), stone);
    return { x, z, y: y + 0.63, mesh: m, U: w.U };
  });
  // ---- the glass windbreaks down both sides, a steel rail along their top
  for (const sd of [1, -1]) for (let x = F.open.x0; x < F.open.x1 - 0.01; x += 12) { const e = Math.min(F.open.x1, x + 12), z = sd * F.open.z;
    B.box(e - x, 1.4, 0.04, (x + e) / 2, y + 0.73, z, glassM, 0, { noShadow: true }); B.box(e - x, 0.07, 0.09, (x + e) / 2, y + 1.47, z, steel);
    for (let xp = x; xp < e - 0.01; xp += 2) B.box(0.06, 1.42, 0.06, xp + 0.03, y + 0.74, z, steel); }
  // ---- the sun loungers: two rows by the pool, rows down both sides, a row under parasols by the windbreaks
  const LG = [atLoungerGeos(false), atLoungerGeos(true)], cushCols = ['#f4f1ea', '#1f6fb2', '#f4f1ea', '#e8c547'];
  const cushM = cushCols.map((c) => atStd(c, 0.9)), frameM = atStd('#f7f7f4', 0.4, 0.1);
  const towelM = ['#2f8fd0', '#f0a12a', '#e0503c', '#2fb39a', '#f4f1ea', '#9a5fd0'].map((c) => atStd(c, 0.95));
  const seats = []; const r = new RNG(1515);
  const lounger = (x, z, yaw, raised) => {
    const m = Geo.matrix(x, y + 0.03, z, 0, yaw, 0), L = LG[raised ? 1 : 0];
    B.add(L.frame, frameM, m); B.add(L.cushion, cushM[(Math.abs(Math.round(x * 3 + z)) >> 1) % cushM.length], m);
    if (r.next() < 0.35) { const tg = new THREE.BoxGeometry(0.58, 0.012, 1.0); B.add(tg, towelM[r.int(0, towelM.length - 1)], new THREE.Matrix4().multiplyMatrices(m, Geo.matrix(0, 0.415, -0.35))); }
    seats.push({ x, z, yaw, raised, y: y + 0.03 });
  };
  const free = (x, z, rr) => {
    for (const [tx, tz] of F.tubs) if (Math.hypot(x - tx, z - tz) < 2.6 + rr) return false;
    if (x > 24 && x < 37 && Math.abs(z) < 5) return false;                    // the bar
    if (x > 33 && z < -5 && z > -16) return false;                           // the waterslide's tower and its run-outs
    if (x > F.pool.x0 - 1.4 - rr && x < F.pool.x1 + 1.4 + rr && Math.abs(z) < F.pool.z1 + 1.3 + rr) return false;
    return true;
  };
  // by the pool: heads away from the water
  for (const sd of [1, -1]) for (let x = F.pool.x0 + 0.4; x < F.pool.x1 - 0.2; x += 0.92) lounger(x, sd * 6.3, sd > 0 ? 0 : Math.PI, (Math.round(x) & 1) === 0);
  // the side rows (z ±11.6) and the parasol rows (z ±15.0)
  for (const sd of [1, -1]) for (const zr of [11.6, 15.0]) for (let x = F.open.x0 + 3; x < F.open.x1 - 1.5; x += 0.95) {
    if (!free(x, sd * zr, 0.8)) continue;
    lounger(x, sd * zr, sd > 0 ? 0 : Math.PI, ((x * 7) | 0) % 3 === 0);
  }
  out.seats = seats;
  // ---- parasols over the outer rows: a pole, a striped canopy (eight panels)
  { const cA = atStd('#f6f2e8', 0.85), cB = atStd('#1d6fa8', 0.85), pole = atStd('#d8d2c4', 0.5); cA.side = cB.side = THREE.DoubleSide;   // (seen from under them too)
    for (const sd of [1, -1]) for (let x = F.open.x0 + 5; x < F.open.x1 - 3; x += 5.6) { if (!free(x, sd * 15, 1.5)) continue;
      const z = sd * 13.9; B.add(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6), pole, Geo.matrix(x, y + 1.28, z));
      for (let i = 0; i < 8; i++) { const g = new THREE.ConeGeometry(1.45, 0.42, 2, 1, true, i / 8 * Math.PI * 2, Math.PI / 4); B.add(g, i % 2 ? cA : cB, Geo.matrix(x, y + 2.42, z)); } } }
  // ---- side tables between loungers (a few) with the sealed things that swell
  const tbl = atStd('#f0ece2', 0.5); const tables = [];
  for (const [x, z] of [[-14.6, 7.5], [-10.2, -7.5], [-19.3, -7.5], [-62.5, 10.2], [8.2, 10.2], [-38.5, -10.2]]) { B.add(new THREE.CylinderGeometry(0.24, 0.2, 0.05, 16), tbl, Geo.matrix(x, y + 0.5, z)); B.add(new THREE.CylinderGeometry(0.025, 0.025, 0.47, 6), steel, Geo.matrix(x, y + 0.265, z)); tables.push([x, z]); }
  out.tables = tables;
  // ---- the bar: a counter (an island), its canopy on four posts, shelves of bottles, stools round it
  { const bx = F.bar.x, bz = F.bar.z, top = atStd('#2b2f33', 0.25, 0.2), front = atStd('#1a5f80', 0.5), wood = atStd('#8a5a34', 0.6);
    B.box(8.6, 1.06, 0.6, bx, y + 0.56, bz - 1.9, front); B.box(8.6, 1.06, 0.6, bx, y + 0.56, bz + 1.9, front);
    B.box(0.6, 1.06, 3.2, bx - 4.0, y + 0.56, bz, front); B.box(0.6, 1.06, 3.2, bx + 4.0, y + 0.56, bz, front);
    B.box(9.0, 0.06, 0.9, bx, y + 1.12, bz - 1.95, top); B.box(9.0, 0.06, 0.9, bx, y + 1.12, bz + 1.95, top); B.box(0.9, 0.06, 3.0, bx - 4.15, y + 1.12, bz, top); B.box(0.9, 0.06, 3.0, bx + 4.15, y + 1.12, bz, top);
    // the back bar: shelves and bottles (a few colours)
    B.box(5.6, 1.6, 0.5, bx, y + 0.83, bz, wood);
    const bottleCols = ['#3a6b2a', '#8a3a1a', '#c9b98a', '#2a3a6a', '#d8d8d0', '#6a2a3a'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }));
    for (let i = 0; i < 26; i++) { const sd = i % 2 ? 1 : -1, x = bx - 2.5 + (i >> 1) * 0.4; B.add(new THREE.CylinderGeometry(0.04, 0.045, 0.3, 8), bottleCols[i % 6], Geo.matrix(x, y + 1.78, bz + sd * 0.12)); }
    for (const [px, pz] of [[-4.2, -2.2], [4.2, -2.2], [-4.2, 2.2], [4.2, 2.2]]) B.box(0.14, 2.7, 0.14, bx + px, y + 1.38, bz + pz, white);
    B.box(10.2, 0.18, 5.6, bx, y + 2.8, bz, white); B.box(10.6, 0.06, 6.0, bx, y + 2.93, bz, atStd('#e8e4da', 0.6));
    const stool = atStd('#f2f0ea', 0.5);
    for (const sd of [1, -1]) for (let i = 0; i < 7; i++) { const x = bx - 3.3 + i * 1.1, z = bz + sd * 2.75; B.add(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), stool, Geo.matrix(x, y + 0.78, z)); B.add(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), steel, Geo.matrix(x, y + 0.4, z)); }
  }
  // the glasses on the counter: colas, beers, spritzes (each an open glass and its drink; the foam is fx.js's)
  { const gl = new THREE.MeshStandardMaterial({ color: '#dfeef2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false });
    const drink = [atStd('#3a1a0c', 0.2), atStd('#d99a2a', 0.2), atStd('#f06a2a', 0.2)].map((m) => { m.transparent = true; m.opacity = 0.9; return m; });
    out.glasses = [];
    for (let i = 0; i < 14; i++) { const sd = i % 2 ? 1 : -1, x = F.bar.x - 3.6 + (i >> 1) * 1.05 + (i % 3) * 0.12, z = F.bar.z + sd * 2.12, kind = i % 3, h = kind === 1 ? 0.18 : 0.15, r0 = kind === 1 ? 0.042 : 0.036;
      B.add(new THREE.CylinderGeometry(r0, r0 * 0.85, h, 14, 1, true), gl, Geo.matrix(x, y + 1.15 + h / 2, z), { noShadow: true });
      B.add(new THREE.CylinderGeometry(r0 * 0.94, r0 * 0.82, h * 0.82, 14), drink[kind], Geo.matrix(x, y + 1.15 + h * 0.41, z), { noShadow: true });
      out.glasses.push({ x, y: y + 1.15 + h * 0.82, z, r: r0, kind, rim: y + 1.15 + h }); }
    // the foam: a head rising out of each glass (the gas comes out of the drink as the air over it thins), spilling over
    // the rim; drips running down the outside (instanced; set(f, t) with f the strength 0…1)
    const N = out.glasses.length, foamM = atStd('#f3ede0', 0.85), dripM = atStd('#efe6d4', 0.7);
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 18, 10), foamM, N), drips = new THREE.InstancedMesh(new THREE.CapsuleGeometry(1, 1, 3, 6), dripM, N * 3);
    for (const m of [heads, drips]) { m.castShadow = false; m.frustumCulled = false; S.add(m); }
    const ob = new THREE.Object3D();
    out.foam = { heads, drips, set(f, t) {
      heads.visible = drips.visible = f > 0.01; if (!heads.visible) return;
      out.glasses.forEach((g, i) => {
        const fk = g.kind === 1 ? f : Math.max(0, f - 0.15) / 0.85, lift = (g.rim - g.y) + 0.004 + 0.045 * fk * (0.92 + 0.08 * Math.sin(t * 2.1 + i)), over = MathX.clamp((lift - (g.rim - g.y)) / 0.04, 0, 1);
        // the head: an ellipsoid whose top is lift over the drink; wider than the glass once it's over the rim
        const rr = g.r * (0.93 + 0.2 * over), hh = Math.max(0.004, lift * 0.62);
        ob.position.set(g.x, g.y + lift - hh, g.z); ob.rotation.set(0, i, 0); ob.scale.set(rr, hh, rr); ob.updateMatrix(); heads.setMatrixAt(i, ob.matrix);
        for (let j = 0; j < 3; j++) { const a = i * 2.3 + j * 2.1, L = 0.004 + 0.11 * over * (0.4 + 0.6 * atR(i * 3 + j, 61)) * MathX.clamp(fk * 1.4 - 0.2 * j, 0, 1), w = 0.0045 + 0.002 * atR(i * 3 + j, 62);
          ob.position.set(g.x + Math.cos(a) * g.r * 1.03, g.rim - L / 2, g.z + Math.sin(a) * g.r * 1.03); ob.rotation.set(0, 0, 0); ob.scale.set(w, Math.max(0.001, L), w); ob.updateMatrix(); drips.setMatrixAt(i * 3 + j, ob.matrix); }
      });
      heads.instanceMatrix.needsUpdate = true; drips.instanceMatrix.needsUpdate = true;
    } };
  }
  // ---- the big screen on the forward block's aft face (it shows the sea and the ship's name; off with the power)
  { const Sc = F.screen, tex = atTex(atCanvas(1024, 572, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b4f8a'); gr.addColorStop(0.55, '#2aa6c9'); gr.addColorStop(0.56, '#0d6a8a'); gr.addColorStop(1, '#063a5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,240,200,0.9)'; g.beginPath(); g.arc(w * 0.72, h * 0.34, 46, 0, 6.29); g.fill();
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect((i * 97) % w, h * 0.58 + (i * 37) % (h * 0.4), 60, 3); }
      g.fillStyle = '#ffffff'; g.font = '600 64px sans-serif'; g.textAlign = 'center'; g.fillText('CORAL MERIDIAN', w / 2, h * 0.84);
      g.font = '500 30px sans-serif'; g.fillText('SEA DAY · POOL PARTY 11:00', w / 2, h * 0.93); }), { repeat: false });
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1.1, roughness: 0.3, color: '#111' });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Sc.w, Sc.h), mat); m.position.set(Sc.x + 0.12, Sc.y, 0); m.rotation.y = Math.PI / 2; S.add(m);
    B.box(0.2, Sc.h + 0.5, Sc.w + 0.5, Sc.x + 0.02, Sc.y, 0, atStd('#14181c', 0.4));
    out.screen = { mat, mesh: m, tex };
  }
  // ---- the sealed things that swell (on the side tables and in the pool): a crisp packet, a sun-cream bottle, a float
  { const crispM = new THREE.MeshStandardMaterial({ map: atTex(atCanvas(128, 128, (g, w, h) => { g.fillStyle = '#d7262c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.beginPath(); g.ellipse(64, 60, 40, 26, 0, 0, 6.29); g.fill(); g.fillStyle = '#d7262c'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('CRISPS', 64, 68); g.fillStyle = '#b01a20'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); }), { repeat: false }), roughness: 0.35, metalness: 0.4 });
    const creamM = atStd('#f3a51c', 0.35), capM = atStd('#ffffff', 0.4);
    const sw = [];
    tables.forEach(([x, z], i) => {
      const cg = new THREE.BoxGeometry(1, 1, 1, 10, 2, 12), cp = cg.attributes.position;
      for (let v = 0; v < cp.count; v++) { const px = cp.getX(v), py = cp.getY(v), pz = cp.getZ(v), puff = Math.pow(Math.max(0, 1 - Math.pow(2 * px, 4)), 0.5) * Math.pow(Math.max(0, 1 - Math.pow(2 * pz, 6)), 0.6);
        cp.setXYZ(v, px * 0.15 * (1 - 0.06 * puff), py * 2 * (0.003 + 0.03 * puff), pz * 0.21); }
      cg.computeVertexNormals();
      const c = atMesh(cg, crispM, x - 0.06, y + 0.562, z + 0.02, S); c.rotation.y = i * 0.9; c.userData.y0 = y + 0.562;
      const bg = new THREE.CylinderGeometry(0.03, 0.035, 0.16, 12); const b = atMesh(bg, creamM, x + 0.1, y + 0.61, z - 0.06, S); const cap = atMesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 10), capM, 0, 0.095, 0, b);
      sw.push({ c, b, cap, k: i });
    });
    // the flamingo float in the pool (a ring, a neck and a head)
    const pink = atStd('#ff86b4', 0.35), fl = new THREE.Group(); S.add(fl);
    atMesh(new THREE.TorusGeometry(0.55, 0.2, 10, 24), pink, 0, 0, 0, fl).rotation.x = Math.PI / 2;
    const neck = new THREE.CatmullRomCurve3([new THREE.Vector3(0.55, 0.05, 0), new THREE.Vector3(0.75, 0.6, 0), new THREE.Vector3(0.62, 0.95, 0), new THREE.Vector3(0.82, 1.0, 0)]);
    atMesh(new THREE.TubeGeometry(neck, 16, 0.09, 8), pink, 0, 0, 0, fl); atMesh(new THREE.SphereGeometry(0.13, 10, 8), pink, 0.84, 1.0, 0, fl); atMesh(new THREE.ConeGeometry(0.05, 0.16, 8), atStd('#222', 0.4), 0.98, 0.97, 0, fl).rotation.z = -1.8;
    fl.position.set(-12.5, y - 0.1, 1.6); fl.rotation.y = 0.7;
    out.swell = { items: sw, float: fl };
  }
  // ---- the dive shop: a room behind deck 2's door in the transom (6 m deep), the rack of six tanks on its port wall
  { const x0 = F.stern - 6.2, x1 = F.stern - 0.05, yb = F.marina.y, yt = yb + 2.6, zw = 3.2, wall = atStd('#d9dde0', 0.7), fl = atStd('#55606a', 0.9);
    B.add(atUVMetres(Geo.flat(x0, x1, -zw, zw, yb + 0.03), 1, 'y'), fl, null);
    B.add(Geo.quad([x0, yt, -zw], [x1, yt, -zw], [x1, yt, zw], [x0, yt, zw]), wall, null);                    // the ceiling (faces down)
    B.add(Geo.quad([x0, yb, zw], [x0, yb, -zw], [x0, yt, -zw], [x0, yt, zw]), wall, null);                      // the back wall (faces aft)
    B.add(Geo.quad([x1, yb, zw], [x0, yb, zw], [x0, yt, zw], [x1, yt, zw]), wall, null);                        // the port wall (faces in, −z)
    B.add(Geo.quad([x0, yb, -zw], [x1, yb, -zw], [x1, yt, -zw], [x0, yt, -zw]), wall, null);                    // the starboard wall
    const light = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e6', emissiveIntensity: 1.4 }); const lm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.3), light); lm.rotation.x = Math.PI / 2; lm.position.set(x0 + 3, yt - 0.03, 0); S.add(lm);
    // wetsuits on a rail (starboard), fins and masks on a shelf (back wall)
    B.box(4.4, 0.04, 0.04, x0 + 3, yt - 0.35, -zw + 0.35, steel);
    const suitM = atStd('#16191d', 0.85), suitB = atStd('#1a7f9a', 0.7);
    for (let i = 0; i < 9; i++) { const x = x0 + 1.1 + i * 0.45; B.box(0.42, 1.25, 0.1, x, yt - 1.05, -zw + 0.38, i % 3 === 1 ? suitB : suitM); }
    B.box(0.4, 0.04, 5.6, x0 + 0.25, yb + 1.3, 0, wall);
    const finM = ['#f2c21a', '#1a9ad6', '#f2c21a'].map((c) => atStd(c, 0.6)); for (let i = 0; i < 10; i++) B.box(0.22, 0.04, 0.55, x0 + 0.25, yb + 1.34, -2.5 + i * 0.55, finM[i % 3]);
    // the rack: six yellow tanks standing in a row on the port wall, a strap round them
    const tankM = atStd('#f2c21a', 0.35, 0.3), valveM = atStd('#c8ccd0', 0.25, 0.9);
    out.shop = { x0, x1, yb, yt, light, rack: [] };
    for (let i = 0; i < 6; i++) { const x = x0 + 1.4 + i * 0.36, z = zw - 0.25;
      B.add(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 16), tankM, Geo.matrix(x, yb + 0.33, z)); B.add(new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), tankM, Geo.matrix(x, yb + 0.605, z));
      B.add(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), valveM, Geo.matrix(x, yb + 0.73, z)); out.shop.rack.push([x, yb, z]); }
    B.box(2.3, 0.05, 0.03, x0 + 2.3, yb + 0.5, zw - 0.13, atStd('#222', 0.6));
  }
  const grp = new THREE.Group(); B.build(grp, 'deck'); S.add(grp); out.group = grp;
  return out;
}

// ---- the line under the stern: from the davit's arm down to a weight 12.2 m below the sea; six tanks clipped along it
// (each with its regulator; two of them are in your and her hands, the rest hang). The line's foot drifts a little.
function atTankLine(set) {
  const F = AT_F, S = set.scene, L = F.line, g = new THREE.Group(); S.add(g);
  const rope = atMesh(new THREE.CylinderGeometry(1, 1, 1, 6), atStd('#e8e2c8', 0.9), 0, 0, 0, g);
  const tankM = atStd('#f2c21a', 0.4, 0.25), bootM = atStd('#1a1a1a', 0.8), valveM = atStd('#c8ccd0', 0.25, 0.9), hoseM = atStd('#16181a', 0.6);
  const tanks = [];
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Group(); g.add(t);
    atMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.56, 16), tankM, 0, 0, 0, t); atMesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), tankM, 0, 0.28, 0, t);
    atMesh(new THREE.CylinderGeometry(0.105, 0.105, 0.12, 16), bootM, 0, -0.24, 0, t); atMesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), valveM, 0, 0.42, 0, t);
    const hose = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.44, 0.02), new THREE.Vector3(0.1, 0.55, 0.1), new THREE.Vector3(0.18, 0.4, 0.2), new THREE.Vector3(0.2, 0.15, 0.22)]);
    atMesh(new THREE.TubeGeometry(hose, 10, 0.012, 5), hoseM, 0, 0, 0, t); atMesh(new THREE.SphereGeometry(0.035, 8, 6), hoseM, 0.2, 0.12, 0.22, t);
    tanks.push(t);
  }
  const weight = atMesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), atStd('#3a3f44', 0.7, 0.4), 0, 0, 0, g);
  // the line's foot sways a little (pure); tank i clipped at depth dep[i]
  const dep = [8.6, 9.2, 9.8, 10.4, 11.0, 11.6];
  const at = (s, d) => { const sw = 0.25 * Math.sin(s * 0.21) + 0.12 * Math.sin(s * 0.53 + 1); const u = MathX.clamp(d / -L.y1, 0, 1); return [L.x + sw * u, -d, L.z + 0.15 * Math.sin(s * 0.17) * u]; };
  const top = [L.x, F.marina.y + 3.3, L.z];
  return {
    g, tanks, dep, at,
    set(s, show) {
      g.visible = show;
      if (!show) return;
      const foot = at(s, -L.y1);
      // the line: two straight pieces (davit → sea → foot)
      atStrut(rope, top, [foot[0], foot[1], foot[2]], 0.012);
      weight.position.set(foot[0], foot[1] - 0.1, foot[2]);
      tanks.forEach((t, i) => { const p = at(s, dep[i]); t.position.set(p[0] + 0.13, p[1], p[2]); t.rotation.set(0.08 * Math.sin(s * 0.3 + i), i * 1.1, 0.06 * Math.sin(s * 0.27 + i * 2)); });
    },
  };
}
