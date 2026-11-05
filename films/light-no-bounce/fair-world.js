/* =====================================================================
   FAIR WORLD — the hilltop and the fair's fixed pieces (layout.js NB_F): the ground and the paths, the Fun House with
   its three wavy mirrors, the stalls with their lit signs and bulbs, the festoons of bulbs over the main path, the
   trucks and caravans behind, the trees round the edge, the fence at the top of the slope.
   Every surface is an ordinary lit material (black while nothing bounces); every bulb, sign, screen and coal is a
   source (nbLamps points or MeshBasicMaterial), which stays.
     nbBuildFairWorld(S) → { M, lamps(L, s), mirror, update(s) }
   No two surfaces share a plane: decals and strips stand off by ≥ 2 cm (the paths) or sit in front by ≥ 5 cm.
   ===================================================================== */

function nbBuildFairWorld(S) {
  const scene = S.scene, F = NB_F, W = { static: [] };
  const M = W.M = {
    grass: nbStd('#6f8a46', 0.95), path: nbStd('#8a7a62', 0.95), wood: nbStd('#7a5a3c', 0.8), dark: nbStd('#22252a', 0.6, 0.3),
    steel: nbStd('#8c9296', 0.45, 0.6), white: nbStd('#ece6da', 0.6), red: nbStd('#c42a2a', 0.5, 0.1), yellow: nbStd('#e8b82a', 0.5, 0.1),
    blue: nbStd('#2a5aa8', 0.55, 0.1), green: nbStd('#2e7a4a', 0.6), canvas: nbStd('#e8e2d2', 0.85), truck: nbStd('#d8d4cc', 0.5, 0.2),
    bark: nbStd('#4a3a2c', 0.95), tyre: nbStd('#141414', 0.9), fence: nbStd('#9aa0a2', 0.4, 0.6),
  };
  { const t = nbTex(nbGrassCanvas(31)); t.repeat.set(220, 220); M.grass.map = t; M.grass.color.set('#a8b880'); }
  { const t = nbTex(nbPavingCanvas(7)); t.repeat.set(1, 1); M.path.map = t; M.path.color.set('#b8a888'); }

  // ---- the ground: the hilltop and the fall into the valley (a displaced grid), coloured fields further out
  {
    const N = 180, SZ = 3600, g = new THREE.PlaneGeometry(SZ, SZ, N, N); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      // (the grid is denser near the fair: squeeze the coordinates towards the middle)
      let x = p.getX(i), z = p.getZ(i); const f = (v) => Math.sign(v) * Math.pow(Math.abs(v) / (SZ / 2), 1.9) * (SZ / 2); x = f(x); z = f(z);
      x += 1500 * Math.pow(Math.max(0, x / (SZ / 2)), 1.6); z += 600 * Math.pow(Math.max(0, z / (SZ / 2)), 1.6);   // (stretched east and south: the town, the airport)
      p.setXYZ(i, x, nbGroundY(x, z), z);
      const fld = noise1(Math.floor(x / 140) * 3.1 + Math.floor(z / 110) * 7.7, 9);
      c.set(fld > 0.25 ? '#8a9a58' : fld > -0.2 ? '#6f8a46' : '#9a8a5a'); const k = 0.9 + 0.1 * noise1(x * 0.02 + z * 0.03, 4); col.set([c.r * k, c.g * k, c.b * k], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = M.grass.clone(); m.vertexColors = true;
    const ground = new THREE.Mesh(g, m); ground.receiveShadow = true; scene.add(ground); W.ground = ground;
  }
  // ---- the paths (2.5 cm above the grass, pushed forward in depth too): the main path east–west, a cross path south
  // to the stalls and the wheel, and the trodden ground in front of the rides
  {
    const pm = M.path.clone(); pm.polygonOffset = true; pm.polygonOffsetFactor = -2; pm.polygonOffsetUnits = -2;
    const strip = (x0, x1, z0, z1) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.max(1, Math.round((x1 - x0) / 4)), Math.max(1, Math.round((z1 - z0) / 4))); g.rotateX(-Math.PI / 2);
      const t = g.attributes.uv; for (let i = 0; i < t.count; i++) t.setXY(i, t.getX(i) * (x1 - x0) / 2.4, t.getY(i) * (z1 - z0) / 2.4);
      const o = new THREE.Mesh(g, pm); o.position.set((x0 + x1) / 2, 0.025, (z0 + z1) / 2); o.receiveShadow = true; scene.add(o); return o; };
    strip(-62, 82, F.path.z[0], F.path.z[1]);
    strip(-3, 3, F.path.z[1], 18); strip(-48, -14, 13.5, 18.5); strip(-14, 40, 14.5, 18.5);
    strip(-40, -8, -12, -6); strip(66, 84, -9, 10);
  }

  // ---- the Fun House: a painted box, its face above three tall wavy mirrors, bulbs round everything
  {
    const fz = F.fun.z, x0 = F.fun.x[0], x1 = F.fun.x[1], h = F.fun.h, d = F.fun.d, my = F.fun.mirY;
    const g = new THREE.Group(); scene.add(g);
    const bodyM = nbStd('#3a2a6a', 0.7), trimM = nbStd('#e8c03a', 0.45, 0.3), pillarM = nbStd('#c8324a', 0.5, 0.1);
    nbBox(x1 - x0, h, d - 0.3, bodyM, (x0 + x1) / 2, h / 2, fz - d / 2 - 0.15, g);                         // the box (its front 15 cm behind the façade)
    // the façade, in pieces round the mirrors' opening (x −3.7…3.7, y 0.3…2.75)
    const face = new THREE.MeshStandardMaterial({ map: nbTex(nbFunFaceCanvas(), { repeat: false }), roughness: 0.6 });
    nbBox(x1 - x0, h - 3.25, 0.3, face, (x0 + x1) / 2, 3.25 + (h - 3.25) / 2, fz - 0.15, g);              // above the mirrors
    nbBox(x1 - x0, 0.3, 0.3, bodyM, (x0 + x1) / 2, 0.15, fz - 0.15, g);                                    // the sill
    nbBox(-3.7 - x0, 2.95, 0.3, bodyM, (x0 - 3.7) / 2, 0.3 + 2.95 / 2, fz - 0.15, g);                      // left of the mirrors
    nbBox(x1 - 3.7, 2.95, 0.3, bodyM, (x1 + 3.7) / 2, 0.3 + 2.95 / 2, fz - 0.15, g);                       // right
    nbBox(7.4, 0.5, 0.3, bodyM, 0, 3.0, fz - 0.15, g);                                                       // over the mirrors
    // gold trim round the opening and pillars between the mirrors (in front of the glass)
    for (const x of [-3.67, -1.225, 1.225, 3.67]) nbBox(0.2, 2.6, 0.22, pillarM, x, 0.3 + 1.3, fz + 0.11, g);
    nbBox(7.6, 0.18, 0.24, trimM, 0, my[1] + 0.09 + 0.02, fz + 0.12, g); nbBox(7.6, 0.14, 0.24, trimM, 0, my[0] - 0.07 - 0.01, fz + 0.12, g);
    // the steps up to the entrance (to the right) and a ticket booth (left)
    nbBox(3.2, 0.9, 1.6, nbStd('#5a3a2a', 0.8), 6.2, 0.45, fz + 0.8, g); nbBox(2.6, 2.6, 0.1, nbStd('#121218', 0.4), 6.2, 2.2, fz - 0.05, g);
    nbBox(1.8, 2.6, 1.6, nbStd('#c8324a', 0.6), -6.6, 1.3, fz + 0.85, g); nbBox(2.2, 0.25, 2.0, trimM, -6.6, 2.72, fz + 0.85, g);
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), nbSign('TICKETS', { w: 512, h: 146, bg: '#fff0c8', ink: '#a01020', k: 1.3 })); tk.position.set(-6.6, 2.3, fz + 1.66); g.add(tk);
    { const fs = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.35), nbSign('FUN HOUSE', { neon: true, color: '#ff3ad8', k: 2.6, w: 1024, h: 192, italic: true, fs: 0.62 })); fs.position.set(0, 5.0, fz + 0.04); g.add(fs); }   // (its neon: a source)
    W.funG = g;
    // the bulbs: round the painted face, along the roof, round the mirrors' opening, the entrance
    const B = [];
    for (let x = x0 + 0.3; x <= x1 - 0.3; x += 0.5) { B.push([x, h - 0.25, fz + 0.06, 'warm']); B.push([x, 3.35, fz + 0.06, (Math.round(x * 2) % 2) ? 'red' : 'yellow']); }
    for (let y = 3.6; y < h - 0.3; y += 0.5) { B.push([x0 + 0.25, y, fz + 0.06, 'warm']); B.push([x1 - 0.25, y, fz + 0.06, 'warm']); }
    for (let x = -3.6; x <= 3.6; x += 0.4) B.push([x, 2.98, fz + 0.26, 'white']);
    for (let y = 0.5; y < 2.9; y += 0.4) { B.push([-3.78, y, fz + 0.26, 'white']); B.push([3.78, y, fz + 0.26, 'white']); }
    for (let x = 4.8; x <= 7.6; x += 0.45) B.push([x, 3.25, fz + 0.06, 'amber']);
    W.static.push(...B.map((b) => [b[0], b[1], b[2], 0.05, b[3]]));
    // the mirrors: one reflector across the three panels (they share a plane), each panel bent differently
    const mir = new Mirror(7.34, my[1] - my[0], { resolution: 1100, tint: '#dfe6ea', see: [0, 1], smudge: 0.035, clipBias: 0.01 });
    mir.material.fragmentShader = mir.material.fragmentShader.replace('vec3 c = texture2DProj(tDiffuse, vUvP).rgb * uTint * uDim;', `
          vec4 pp = vUvP; float pu = vUv.x * 3.0, pi = floor(pu), lu = fract(pu) - 0.5, lv = vUv.y - 0.5;
          float dx = 0.0, dy = 0.0;
          if (pi < 0.5) { dx = -lu * 0.42 * (1.0 - 1.6 * lv * lv); dy = 0.03 * sin(vUv.y * 9.0); }        // thin and tall
          else if (pi < 1.5) { dx = 0.035 * sin(vUv.y * 13.0 + 1.0); dy = -lv * 0.28 + 0.02 * sin(vUv.x * 20.0); }   // wavy, squashed
          else { dx = lu * 0.35; dy = lv * 0.18 * cos(lu * 3.0); }                                       // short and wide
          pp.xy += vec2(dx * 0.16, dy * 0.12) * pp.w;
          vec3 c = texture2DProj(tDiffuse, pp).rgb * uTint * uDim;`);
    mir.material.needsUpdate = true;
    mir.mesh.position.set(0, (my[0] + my[1]) / 2, fz + 0.02); scene.add(mir.mesh);
    W.mirror = mir;
  }

  // ---- the stalls along the south side of the path: a hut, a striped awning, a lit sign, bulbs along the awning
  {
    const names = [['HOT DOGS', '#ff3a2a', 'neon'], ['DOUGHNUTS', '#ffb02a', 'box'], ['HOOK A DUCK', '#2ad0ff', 'neon'], ['CANDY FLOSS', '#ff5ab0', 'neon'], ['TOFFEE APPLES', '#ffd02a', 'box'], ['ROLL A PENNY', '#7aff6a', 'neon']];
    const stripes = [['#d8263a', '#f4ece0'], ['#2a5aa8', '#f4ece0'], ['#e8b82a', '#c8324a'], ['#d85aa8', '#f4ece0'], ['#2e7a4a', '#f4e6c0'], ['#7a3aa8', '#f4ece0']];
    W.stalls = [];
    for (let i = 0; i < F.stalls.n; i++) {
      const x = F.stalls.x[0] + i * (F.stalls.x[1] - F.stalls.x[0]) / (F.stalls.n - 1), z = F.stalls.z, g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      const hut = nbStd(['#f0e8da', '#e8d8c0', '#dfe6ee'][i % 3], 0.7);
      nbBox(5.4, 2.7, 0.12, hut, 0, 1.35, 1.5, g);                       // back wall
      for (const sx of [-1, 1]) nbBox(0.12, 2.7, 3.0, hut, sx * 2.64, 1.35, 0, g);
      nbBox(5.4, 1.05, 0.5, nbStd(stripes[i][0], 0.6), 0, 0.525, -1.22, g);   // the counter
      nbBox(5.6, 0.06, 0.62, nbStd('#f4f0e8', 0.5), 0, 1.08, -1.24, g);
      nbBox(5.4, 0.12, 3.0, hut, 0, 2.76, 0, g);                         // the roof
      // the awning: a sloping striped sheet out over the counter
      const aw = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 1.5), new THREE.MeshStandardMaterial({ map: nbTex(nbStripeCanvas(...stripes[i], 10), { repeat: false }), roughness: 0.8, side: THREE.DoubleSide }));
      aw.position.set(0, 2.55, -2.05); aw.rotation.x = -Math.PI / 2 + 0.55; aw.castShadow = aw.receiveShadow = true; g.add(aw);
      // goods on the back shelves (bright colours: prizes, sweets, ducks)
      const r = new RNG(90 + i);
      for (let k = 0; k < 18; k++) { const c = ['#ff4a4a', '#ffd23a', '#3a9aff', '#ff7ad0', '#6aff6a', '#ffffff'][r.int(0, 5)]; nbBox(r.range(0.2, 0.42), r.range(0.2, 0.45), r.range(0.2, 0.3), nbStd(c, 0.6), r.range(-2.2, 2.2), 1.3 + 0.55 * (k % 3), 1.25, g); }
      // the lit sign on the roof (a source)
      const sg = nbSign(names[i][0], { neon: names[i][2] === 'neon', color: names[i][1], bg: '#fff4d8', ink: '#b3122a', k: names[i][2] === 'neon' ? 2.2 : 1.5, w: 1024, h: 230 });
      nbBox(4.6, 0.95, 0.12, nbStd('#18161a', 0.6), 0, 3.35, 0.0, g);
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.9), sg); sm.position.set(0, 3.35, -0.08); sm.rotation.y = Math.PI; g.add(sm);   // (faces north, 2 cm off its board)
      // the bulbs along the awning's front edge and the sign's frame
      for (let k = 0; k <= 12; k++) W.static.push([x - 2.8 + k * 0.466, 1.92, z - 2.62, 0.045, NB_BULB_SET[(k + i) % 8]]);
      for (let k = 0; k <= 9; k++) W.static.push([x - 2.3 + k * 0.511, 3.86, z - 0.1, 0.04, 'warm']);
      for (let k = 0; k <= 9; k++) { W.static.push([x - 2.3 + k * 0.511, 2.84, z + 0.18, 0.04, 'warm']); W.static.push([x - 2.3 + k * 0.511, 2.84, z - 1.48, 0.04, NB_BULB_SET[(k + i + 3) % 8]]); }   // the roof's edges
      for (const sx of [-1, 1]) { for (let k = 0; k <= 5; k++) W.static.push([x + sx * 2.85, 1.92 + k * 0.17, z - 2.62 + k * 0.2, 0.04, 'warm']); for (let k = 0; k < 6; k++) W.static.push([x + sx * 2.72, 0.3 + k * 0.45, z - 1.5, 0.035, NB_BULB_SET[(k + i) % 8]]); }
      for (let k = 0; k < 4; k++) W.static.push([x - 1.8 + k * 1.2, 2.35, z - 0.2, 0.06, 'white']);   // bare bulbs hanging inside
      W.stalls.push({ x, z, g, name: names[i][0] });
    }
    // the hot dog stall's grill: coals glowing under the bars (a source: hot enough to glow)
    W.grill = [F.stalls.x[0] + 1.2, 1.12, F.stalls.z - 0.6];
    nbBox(1.2, 0.08, 0.5, nbStd('#2a2a2a', 0.5, 0.6), W.grill[0], W.grill[1] - 0.06, W.grill[2]);
  }

  // ---- festoons of bulbs over the main path: poles both sides, the strings swagging across
  {
    const poleM = nbStd('#3a3f44', 0.5, 0.5), zs = [F.path.z[0] - 0.45, F.path.z[1] + 0.45], H = 4.6;
    W.festoons = [];
    for (let x = -46; x <= 62; x += 9) for (const z of zs) { if (Math.abs(x) < 6 && z < 0) continue; nbCyl(0.06, 0.07, H, poleM, x, H / 2, z, null, 8); }
    for (let x = -46; x < 62; x += 9) {
      // a swag along each side and a zig-zag across
      const runs = [[[x, H, zs[0]], [x + 9, H, zs[0]]], [[x, H, zs[1]], [x + 9, H, zs[1]]], [[x, H, zs[0]], [x + 9, H, zs[1]]]];
      runs.forEach((r, j) => {
        if (Math.abs(r[0][0]) < 6 && r[0][2] < 0 || Math.abs(r[1][0]) < 6 && r[1][2] < 0) return;   // (not across the Fun House's front)
        const L = Math.hypot(r[1][0] - r[0][0], r[1][2] - r[0][2]), n = Math.round(L / 0.45), pts = [];
        for (let k = 0; k <= n; k++) { const u = k / n, y = H - 0.55 * 4 * u * (1 - u); pts.push(new THREE.Vector3(nbLerp(r[0][0], r[1][0], u), y, nbLerp(r[0][2], r[1][2], u))); if (k && k < n) W.static.push([pts[k].x, pts[k].y - 0.07, pts[k].z, 0.05, j === 2 ? NB_BULB_SET[((k + Math.round(x)) % 8 + 8) % 8] : 'warm']); }
        const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.008, 4, false), M.dark); wire.castShadow = false; scene.add(wire);
      });
    }
  }

  // ---- a helter-skelter (west) and a drop tower (north-east): more shapes drawn in bulbs
  {
    const hx = -54, hz = 14, Hh = 13; const g = new THREE.Group(); g.position.set(hx, 0, hz); scene.add(g);
    const twr = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.0, Hh, 24, 1, false), new THREE.MeshStandardMaterial({ map: nbTex(nbStripeCanvas('#d8263a', '#f4ece0', 12), { repeat: false }), roughness: 0.7 })); twr.position.y = Hh / 2; twr.castShadow = true; g.add(twr);
    nbMesh(new THREE.ConeGeometry(2.6, 3.2, 24), nbStd('#e8b82a', 0.5), 0, Hh + 1.6, 0, g);
    const pts = []; for (let k = 0; k <= 160; k++) { const u = k / 160, a = u * Math.PI * 2 * 3.0, r = 3.0 + (1 - u) * 0 + 1.4 - 0.9 * (1 - u), y = (Hh - 1.2) * (1 - u) + 0.6; pts.push(new THREE.Vector3(Math.cos(a) * (r + 0.4 * u), y, Math.sin(a) * (r + 0.4 * u))); }
    const slide = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.45, 8, false), nbStd('#e8b82a', 0.45, 0.2)); slide.castShadow = true; g.add(slide);
    pts.forEach((p, k) => { if (k % 2 === 0) W.static.push([hx + p.x * 1.12, p.y + 0.5, hz + p.z * 1.12, 0.045, NB_BULB_SET[(k / 2) % 8]]); });
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; W.static.push([hx + Math.cos(a) * 2.75, Hh + 0.05, hz + Math.sin(a) * 2.75, 0.05, 'warm']); }
    for (let y = 0.6; y < Hh; y += 0.5) for (const a of [0.4, 2.5, 4.6]) W.static.push([hx + Math.cos(a) * (3.0 - y / Hh) * 1.02, y, hz + Math.sin(a) * (3.0 - y / Hh) * 1.02, 0.04, 'warm']);
    W.static.push([hx, Hh + 3.3, hz, 0.12, 'red']);
    // the drop tower: a lattice mast 42 m tall, a ring of seats; lights chase up and down it (W.lamps)
    const dx = 50, dz = -24, DH = 42; nbCyl(0.9, 1.1, DH, nbStd('#c8ccd0', 0.4, 0.5), dx, DH / 2, dz, null, 12); nbBox(3.4, 1.6, 3.4, nbStd('#2a5aa8', 0.5, 0.3), dx, DH + 0.8, dz);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.35, 8, 24), nbStd('#d8263a', 0.5, 0.3)); ring.rotation.x = Math.PI / 2; ring.position.set(dx, 3, dz); scene.add(ring); W.drop = { x: dx, z: dz, H: DH, ring };
  }
  W.lamps = (L, s) => {
    const D = W.drop, ph = s * 0.9;
    for (let y = 1; y < D.H; y += 0.8) for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.785, on = ((y * 0.8 - ph * 6) % 6 + 6) % 6 < 2.2; const c = NB_BULB[on ? 'white' : 'blue'];
      L.add(D.x + Math.cos(a) * 1.05, y, D.z + Math.sin(a) * 1.05, 0.05, c[0] * (on ? 1 : 0.6), c[1] * (on ? 1 : 0.6), c[2] * (on ? 1 : 0.6)); }
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, c = NB_BULB[NB_BULB_SET[k % 8]]; L.add(D.x + Math.cos(a) * 2.4, D.ring.position.y - 0.3, D.z + Math.sin(a) * 2.4, 0.06, c[0], c[1], c[2]); }
    L.add(D.x, D.H + 1.8, D.z, 0.18, 4.0, 0.3, 0.2);
  };

  // ---- behind the fair: trucks and caravans (south of the stalls, north of the Fun House); a generator
  {
    const truck = (x, z, ry, c = M.truck) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      nbBox(9.0, 3.2, 2.5, c, 0, 2.05, 0, g); nbBox(2.2, 2.4, 2.4, nbStd('#c8c4bc', 0.5, 0.2), 5.7, 1.65, 0, g); nbBox(0.05, 0.9, 2.0, nbStd('#26323d', 0.15, 0.5), 6.82, 2.15, 0, g);
      for (const wx of [-3.2, -2.0, 4.8]) for (const wz of [-1.1, 1.1]) { const w = nbCyl(0.48, 0.48, 0.4, M.tyre, wx, 0.48, wz, g, 16); w.rotation.x = Math.PI / 2; } return g; };
    truck(-8, 26, 0.1); truck(12, 25, -0.05, nbStd('#b8c8d8', 0.5, 0.2)); truck(-18, -14, 0.0, nbStd('#e8dcc8', 0.5, 0.2)); truck(16, -12, Math.PI + 0.05);
    for (const [x, z, ry] of [[30, -16, 0.3], [40, -12, -0.2], [-44, -8, 1.2]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      nbMesh(nbRoundBox(6.5, 2.5, 2.3, 0.4, 0.06), nbStd('#efe9dc', 0.5, 0.1), 0, 0.45, 0, g); nbBox(6.4, 0.25, 0.04, nbStd('#5a8aa8', 0.5), 0, 1.4, 1.18, g); }
    // the generator: a box that thrums
    nbBox(3.2, 2.0, 1.6, nbStd('#2e7a4a', 0.6, 0.2), 22, 1.0, 24);
  }

  // ---- trees round the edge of the hilltop (open to the east: the view down the valley)
  {
    const r = new RNG(55), crownC = ['#7a6a2a', '#8a5a22', '#5a6a2a', '#9a6a2a', '#6a5a30', '#4a5a2a'];
    const crownM = crownC.map((c) => nbStd(c, 0.9)), trunkM = M.bark;
    for (let i = 0; i < 80; i++) {
      const a = r.range(0, Math.PI * 2), az = (Math.PI / 2 - a + Math.PI * 2) % (Math.PI * 2);   // azimuth from north (a: math angle from +x)
      if (az > MathX.deg(40) && az < MathX.deg(150)) continue;                                 // keep the valley view open
      if (az > MathX.deg(198) && az < MathX.deg(262)) continue;                                // and the low Sun's way in (south-west)
      const rr = r.range(78, 118), x = rr * Math.cos(a), z = -rr * Math.sin(a), y = nbGroundY(x, z), h = r.range(7, 14);
      nbCyl(0.22, 0.32, h * 0.55, trunkM, x, y + h * 0.27, z, null, 7);
      const c = nbMesh(nbBlobGeo(h * 0.33, i), crownM[i % crownM.length], x, y + h * 0.7, z); c.scale.set(1, 1.15, 1);
    }
  }
  // ---- the fence along the top of the slope (east): posts and two rails
  {
    // (it follows the hilltop's edge, a metre inside it: posts every 2.5 m, the rails as straight pieces between them)
    let prev = null;
    for (let z = -60; z <= 40; z += 2.5) {
      const x = nbEdgeX(z) - 1.0; nbBox(0.08, 1.1, 0.08, M.fence, x, 0.55, z);
      if (prev) { const L = Math.hypot(x - prev[0], z - prev[1]), a = Math.atan2(x - prev[0], z - prev[1]);
        for (const y of [0.55, 1.05]) { const rl = nbBox(0.05, 0.05, L, M.fence, (x + prev[0]) / 2, y, (z + prev[1]) / 2); rl.rotation.y = a; } }
      prev = [x, z];
    }
  }

  W.update = (s) => { const D = W.drop, c = ((s / 16) % 1 + 1) % 1; D.ring.position.y = c < 0.55 ? 3 + 36 * MathX.smooth(c, 0, 0.5) : c < 0.62 ? 39 - 36 * Math.min(1, ((c - 0.55) / 0.07) ** 2) : 3; };
  return W;
}
