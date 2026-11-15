/* =====================================================================
   WORLD — everything that is GROUND (layout.js ES_F): it stops with the Earth at 5:42:00 and stays where it is. The
   sky of an equatorial evening, the plain, the hill and its rock face with the tunnel mouth, the quay wall, the
   railway's bed, sleepers and rails, the platforms, the floors and bolt stubs that the station and the town leave
   behind, the palms' stumps. And the sea (it is loose: its surface runs east with ESP.X).
     esBuildWorld(S) → { sky, water, update(s) }
   ===================================================================== */

// a grey noise texture (multiplied over vertex colours: grit, grass, gravel)
function esNoiseCanvas(seed, w = 512, h = 512, amp = 0.22, cell = 2) {
  const r = new RNG(seed);
  return esCanvas(w, h, (g) => {
    const img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = 0.82 + amp * (hash2(Math.floor(x / cell) + seed, Math.floor(y / cell)) - 0.5) + 0.12 * (noise1(x * 0.02 + y * 0.013, seed) + noise1(y * 0.021 - x * 0.007, seed + 3)) * 0.5 + 0.05 * Math.sin(x * 0.7 + r.next() * 0.01);
      const i = (y * w + x) * 4, c = MathX.clamp(v, 0, 1) * 255; d[i] = c; d[i + 1] = c; d[i + 2] = c; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
const esMix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// is (x, z) inside a town street block (packed earth)?
function esInTown(x, z) { return x > -246 && x < 126 && ((z < -24 && z > -126) || (z > 16 && z < 124)); }

// the ground's colour at (x, z, y)
function esGroundCol(x, z, y) {
  const F = ES_F, n = noise1(x * 0.05 + z * 0.031, 7), n2 = noise1(x * 0.011 - z * 0.017, 9), n3 = noise1(x * 0.21 + z * 0.17, 21);
  const hx = esHillX(z);
  if (x > hx - 0.8) {
    const cl = F.hill.cliff;
    if (y < cl * 0.9) {
      // the rock face: red-brown, in strata
      const band = 0.5 + 0.5 * Math.sin(y * 1.35 + 2.2 * noise1(z * 0.06, 31) + 0.6 * n3);
      return esMix3(esMix3([0.46, 0.3, 0.22], [0.33, 0.22, 0.17], band), [0.55, 0.42, 0.3], 0.25 + 0.25 * n);
    }
    const k = MathX.smooth(y, cl * 0.9, cl * 1.3);
    return esMix3([0.4, 0.3, 0.22], esMix3([0.2, 0.3, 0.13], [0.36, 0.37, 0.17], 0.5 + 0.5 * n2), k);
  }
  if (x < F.quay.apron) return esMix3([0.52, 0.5, 0.46], [0.6, 0.58, 0.53], 0.5 + 0.5 * n);                        // the quay's apron
  // the railway's bed (ballast)
  const mz = F.track.z2 * (1 - MathX.smooth(x, F.track.merge[0], F.track.merge[1]));
  const sz = F.track.z3 * MathX.smooth(x, F.track.siding[0], F.track.siding[0] + 36);
  if (x > F.buffers - 3 && (Math.abs(z) < 2.6 || Math.abs(z - mz) < 2.6 || (x > F.track.siding[0] && x < F.track.siding[1] + 3 && Math.abs(z - sz) < 2.6)))
    return esMix3([0.3, 0.27, 0.25], [0.4, 0.36, 0.32], 0.5 + 0.5 * n3);
  if (Math.abs(x - F.crossing.x) < F.crossing.w / 2 && Math.abs(z) > 2.4) return esMix3([0.2, 0.2, 0.21], [0.25, 0.25, 0.25], 0.5 + 0.5 * n3);   // the road
  if (esInTown(x, z)) return esMix3([0.56, 0.45, 0.33], [0.62, 0.52, 0.4], 0.5 + 0.5 * n);                       // the town's packed earth
  // the plain: red earth and dry grass
  let c = esMix3([0.5, 0.34, 0.22], [0.42, 0.41, 0.2], MathX.clamp(0.5 + 0.8 * n2 + 0.3 * n, 0, 1));
  if (n3 > 0.55) c = esMix3(c, [0.3, 0.36, 0.15], 0.5);
  return c;
}

// THE SCOUR — for the second, the air crosses the stopped ground at 465 m/s and tears its top layer off: streaks of
// dust run east over every ground surface (drawn in the ground's own material, so nothing can z-fight with it). One
// set of uniforms for every material hooked: uSX = how far the air has gone (ESP.X), uSA = how much dust
const ES_SCOUR = { uSX: { value: 0 }, uSA: { value: 0 }, tStreak: { value: null } };
function esScourMat(m) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, ES_SCOUR);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vEsW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvEsW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vEsW; uniform float uSX, uSA; uniform sampler2D tStreak;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        { vec2 q = vec2((vEsW.x - uSX) * 0.011, vEsW.z * 0.12);
          float n = texture2D(tStreak, q).r, n2 = texture2D(tStreak, q * vec2(0.31, 2.7) + 0.37).r;
          float k = uSA * smoothstep(0.4, 0.95, n * 0.7 + n2 * 0.5) * (1.0 - smoothstep(592.0, 600.0, vEsW.x));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.74, 0.58), k); }`);
  };
  return m;
}
// a thin layer lying on another (sleepers on ballast, lines on paving, plates, floors): pulled forward in depth so it
// can never z-fight with what it lies on, however far away
const esOff = (m, f = -2, u = -8) => { m.polygonOffset = true; m.polygonOffsetFactor = f; m.polygonOffsetUnits = u; return m; };

function esBuildWorld(S) {
  const scene = S.scene, F = ES_F, P = ESP, out = {};
  const RAIL = F.rail;
  // ------------------------------------------------------------------ the sky: an hour before sunset
  out.sky = esGradSky(scene, '#3d6fb4', '#f3c38c', '#8a765e', { sunDir: ES_SUN, sunGlow: '#ffb060', hw: 0.3, r: 8000 });
  {
    const sd = new THREE.Vector3(...ES_SUN).normalize();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(46, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 7.6, 4.6), fog: false, depthWrite: false }));
    disc.position.copy(sd).multiplyScalar(7400); disc.lookAt(0, 0, 0); disc.renderOrder = -9; scene.add(disc);
    const ct = esTex(esCanvas(256, 128, (g, w, h) => { for (let i = 0; i < 46; i++) { const x = w * (0.12 + 0.76 * hash1(i * 3 + 1)), y = h * (0.35 + 0.3 * hash1(i * 5 + 2)), r = 12 + 24 * hash1(i * 7 + 3); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }), { repeat: false });
    for (let i = 0; i < 12; i++) {
      const az = -Math.PI / 2 + (hash1(i * 11 + 4) - 0.5) * 3.6 + (i % 3 === 0 ? Math.PI : 0), el = 0.07 + 0.24 * hash1(i * 13 + 5), d = 6000;
      const warm = Math.max(0, Math.cos(az + Math.PI / 2));
      const cm = new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1.1, 0.78 + 0.2 * (1 - warm), 0.6 + 0.35 * (1 - warm)) });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2000 + 1600 * hash1(i * 17 + 2), 380 + 300 * hash1(i * 19 + 1)), cm);
      m.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, -Math.cos(az) * Math.cos(el) * d); m.lookAt(0, 0, 0); m.renderOrder = -8; scene.add(m);
    }
  }
  // ------------------------------------------------------------------ the ground: one tensor grid
  {
    const xs = [], zs = [];
    for (let x = -250; x < 560; x += 6) xs.push(x);
    for (let x = 560; x < 640; x += 1.2) xs.push(x);
    for (let x = 640; x < 900; x += 12) xs.push(x);
    for (let x = 900; x <= 2600; x += 60) xs.push(x);
    for (let z = -3200; z < -400; z += 100) zs.push(z);
    for (let z = -400; z < -130; z += 10) zs.push(z);
    for (let z = -130; z < -30; z += 3) zs.push(z);
    for (let z = -30; z < 30; z += 1.3) zs.push(z);
    for (let z = 30; z < 130; z += 3) zs.push(z);
    for (let z = 130; z < 400; z += 10) zs.push(z);
    for (let z = 400; z <= 3200; z += 100) zs.push(z);
    const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
    let k = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], y = x <= -250 ? 0 : esGroundY(x, z), c = esGroundCol(x, z, y);
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2]; uv[k * 2] = x / 9 + y / 9; uv[k * 2 + 1] = z / 9; k++;
    }
    const idx = [];
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const tex = esTex(esNoiseCanvas(17, 512, 512, 0.34, 2));
    // the streaks' noise (two octaves of blobs; stretched 11:1 along x by the shader)
    ES_SCOUR.tStreak.value = esTex(esCanvas(256, 256, (c, w, h) => {
      const img = c.createImageData(w, h), d = img.data, r = new RNG(61), G = 16, A = [], B = [];
      for (let i = 0; i < G * G; i++) A.push(r.next()); for (let i = 0; i < 64 * 64; i++) B.push(r.next());
      const smp = (T, n, x, y) => { const fx = x * n / w, fy = y * n / h, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), at = (a, b) => T[((b % n + n) % n) * n + ((a % n + n) % n)]; return (at(i, j) * (1 - su) + at(i + 1, j) * su) * (1 - sv) + (at(i, j + 1) * (1 - su) + at(i + 1, j + 1) * su) * sv; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = 0.62 * smp(A, G, x, y) + 0.38 * smp(B, 64, x, y), k = (y * w + x) * 4; d[k] = d[k + 1] = d[k + 2] = 255 * v; d[k + 3] = 255; }
      c.putImageData(img, 0, 0);
    }), { srgb: false });
    const m = new THREE.Mesh(g, esScourMat(new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 0.96 })));
    m.receiveShadow = true; m.castShadow = true; scene.add(m); out.ground = m;
  }
  // ------------------------------------------------------------------ the sea (its surface runs east with everything loose)
  {
    const nc = esCanvas(512, 512, (g, w, h) => {
      const img = g.createImageData(w, h), d = img.data, H = (x, y) => 0.5 * Math.sin(x * 0.05 + 1.3 * Math.sin(y * 0.031)) + 0.35 * Math.sin(y * 0.083 + 0.7 * Math.sin(x * 0.047)) + 0.25 * Math.sin((x + y) * 0.13) + 0.15 * (hash2(x >> 3, y >> 3) - 0.5);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1), i = (y * w + x) * 4;
        d[i] = 128 + 60 * dx; d[i + 1] = 128 + 60 * dy; d[i + 2] = 255; d[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    const nt = esTex(nc, { srgb: false }); nt.repeat.set(220, 440);
    const wm = new THREE.MeshStandardMaterial({ color: '#1d4a52', roughness: 0.22, metalness: 0.0, normalMap: nt, normalScale: new THREE.Vector2(0.9, 0.9), envMapIntensity: 0.55 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(8800, 17600), wm);
    water.rotation.x = -Math.PI / 2; water.position.set(F.quay.x - 4400, F.sea.level, 0); water.receiveShadow = true; scene.add(water);
    out.water = water; out.waterTex = nt;
  }
  // ------------------------------------------------------------------ the quay wall, its cap and bollards
  {
    const wt = esTex(esCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#8a857b'; g.fillRect(0, 0, w, h);
      const r = new RNG(9);
      for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < w; x += 64) { const k = r.range(-14, 12); g.fillStyle = `rgb(${132 + k},${126 + k},${116 + k})`; g.fillRect(x + 1, y + 1, 62, 30); }
      const gr = g.createLinearGradient(0, h * 0.2, 0, h); gr.addColorStop(0, 'rgba(30,40,28,0)'); gr.addColorStop(0.25, 'rgba(26,36,26,0.8)'); gr.addColorStop(1, 'rgba(20,28,22,0.9)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }));
    wt.repeat.set(1600, 1);
    const wallM = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.85 });
    esBox(1.2, -F.sea.bed + 0.02, 8000, wallM, F.quay.x - 0.6, F.sea.bed / 2, 0);
    esBox(1.6, 0.4, 8000, esStd('#9a958a', 0.9), F.quay.x - 0.5, 0.2, 0);
    const bm = esStd('#1c1d1f', 0.5, 0.6);
    for (let z = -150; z <= 150; z += 25) { esCyl(0.22, 0.27, 0.6, bm, F.quay.x + 1.4, 0.3, z); esCyl(0.32, 0.32, 0.09, bm, F.quay.x + 1.4, 0.62, z); }
  }
  // ------------------------------------------------------------------ the railway: sleepers, rails (all bolted to the ground)
  {
    const T = F.track, sm = esOff(esStd('#4a3a2c', 0.9)), rm = esOff(esStd('#8a8580', 0.4, 0.75), -3, -12);
    const zAt = { 1: () => T.z1, 2: (x) => T.z2 * (1 - MathX.smooth(x, T.merge[0], T.merge[1])), 3: (x) => T.z3 * MathX.smooth(x, T.siding[0], T.siding[0] + 36) };
    out.trackZ = zAt;
    const runs = [[1, F.buffers, F.hill.x + 40], [2, F.buffers, T.merge[1]], [3, T.siding[0], T.siding[1]]];
    let count = 0; for (const [, a, b] of runs) count += Math.ceil((b - a) / 0.65) + 1;
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.16, 2.5), sm, count), mt = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), ps = new THREE.Vector3();
    let n = 0;
    for (const [id, a, b] of runs) for (let x = a; x <= b; x += 0.65) {
      const z = zAt[id](x), dz = (zAt[id](x + 0.5) - zAt[id](x - 0.5));
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan(dz)); ps.set(x, 0.07, z); mt.compose(ps, q, sc); sl.setMatrixAt(n++, mt);
    }
    sl.count = n; sl.receiveShadow = true; scene.add(sl);
    // the rails: straight runs as long boxes, the curved parts in 3 m pieces
    const rail = (id, a, b, step) => {
      for (let x = a; x < b - 1e-6; x += step) {
        const x1 = Math.min(b, x + step), za = zAt[id](x), zb = zAt[id](x1), L = Math.hypot(x1 - x, zb - za), yaw = -Math.atan2(zb - za, x1 - x);
        for (const sgn of [-1, 1]) { const m = esBox(L + 0.02, 0.15, 0.07, rm, (x + x1) / 2 + sgn * Math.sin(yaw) * T.gauge / 2 * -1, RAIL - 0.075, (za + zb) / 2 + sgn * Math.cos(yaw) * T.gauge / 2); m.rotation.y = yaw; m.castShadow = false; }
      }
    };
    rail(1, F.buffers, F.hill.x + 40, 300); rail(2, F.buffers, T.merge[0], 300); rail(2, T.merge[0], T.merge[1], 3); rail(3, T.siding[0], T.siding[0] + 36, 3); rail(3, T.siding[0] + 36, T.siding[1], 300);
    // the level crossing's planks
    esBox(F.crossing.w, 0.12, 3.6, esOff(esStd('#5a4a3a', 0.9), -2, -10), F.crossing.x, RAIL - 0.07, 0).castShadow = false;
  }
  // ------------------------------------------------------------------ the tunnel mouth in the rock face
  {
    const stone = new THREE.MeshStandardMaterial({ color: '#8d7d6a', roughness: 0.9, map: esTex(esBrickCanvas(41, [150, 132, 110], 256, 256, '#6b5f50')) });
    const x = F.hill.x, dark = new THREE.MeshBasicMaterial({ color: '#050403' });
    esBox(1.4, 9.4, 2.0, stone, x - 0.1, 4.7, -3.9); esBox(1.4, 9.4, 2.0, stone, x - 0.1, 4.7, 3.9); esBox(1.4, 2.4, 9.8, stone, x - 0.1, 8.2, 0);
    esBox(1.8, 0.5, 10.6, stone, x - 0.2, 9.6, 0);
    for (const sgn of [-1, 1]) { const w = esBox(0.9, 9.4, 13, stone, x + 0.1, 4.7, sgn * 11.4); w.rotation.y = sgn * 0.12; }
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 7.0), dark); hole.rotation.y = -Math.PI / 2; hole.position.set(x - 0.82, 3.5, 0); scene.add(hole);
    const arch = new THREE.Mesh(new THREE.CircleGeometry(2.9, 20, 0, Math.PI), dark); arch.rotation.y = -Math.PI / 2; arch.position.set(x - 0.83, 6.2, 0); scene.add(arch);
    // inside: the bore (so the rails run into darkness, not into a wall)
    const bore = new THREE.Mesh(new THREE.BoxGeometry(60, 7.4, 5.8), new THREE.MeshBasicMaterial({ color: '#050403', side: THREE.BackSide })); bore.position.set(x + 29.4, 3.7, 0); scene.add(bore);
  }
  // ------------------------------------------------------------------ the platforms (earth-filled concrete: ground)
  {
    const Pl = F.plat, top = esTex(esCanvas(256, 256, (g, w, h) => {
      g.fillStyle = '#b3aea2'; g.fillRect(0, 0, w, h);
      const r = new RNG(3);
      for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const k = r.range(-9, 9); g.fillStyle = `rgb(${176 + k},${170 + k},${158 + k})`; g.fillRect(x + 1, y + 1, 30, 30); }
    }));
    top.repeat.set(1, 1);
    const side = esStd('#8f8a80', 0.9);
    const mk = (z0, z1, edgeZ) => {
      const L = Pl.x[1] - Pl.x[0], d = z1 - z0, tt = top.clone(); tt.repeat.set(L / 2.4, d / 2.4); tt.needsUpdate = true;
      const m = new THREE.Mesh(new THREE.BoxGeometry(L, Pl.h, d), [side, side, esScourMat(new THREE.MeshStandardMaterial({ map: tt, roughness: 0.9 })), side, side, side]);
      m.position.set((Pl.x[0] + Pl.x[1]) / 2, Pl.h / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; scene.add(m);
      // the white edge and the yellow line (raised 1.5 cm: no shared plane with the paving)
      const e = esBox(L, 0.03, 0.22, esOff(esStd('#e8e4d8', 0.8)), (Pl.x[0] + Pl.x[1]) / 2, Pl.h + 0.0, edgeZ + (edgeZ > (z0 + z1) / 2 ? -0.12 : 0.12)); e.castShadow = false;
      const y = esBox(L, 0.03, 0.12, esOff(esStd('#d8b02a', 0.8)), (Pl.x[0] + Pl.x[1]) / 2, Pl.h + 0.0, edgeZ + (edgeZ > (z0 + z1) / 2 ? -0.9 : 0.9)); y.castShadow = false;
      // the ramp at the east end
      const rg = new THREE.BoxGeometry(6.2, 0.1, d); const rp = new THREE.Mesh(rg, side); rp.position.set(Pl.x[1] + 3.0, Pl.h / 2 - 0.06, (z0 + z1) / 2); rp.rotation.z = -Math.atan(Pl.h / 6); rp.receiveShadow = true; scene.add(rp);
    };
    mk(Pl.p1[0], Pl.p1[1], Pl.p1[1]); mk(Pl.p2[0], Pl.p2[1], Pl.p2[0]);
  }
  // ------------------------------------------------------------------ what the station building leaves behind: its floor
  {
    const B = F.bldg, Pl = F.plat, L = B.x[1] - B.x[0], d = B.z[1] - B.z[0];
    const ft = esTex(esCanvas(256, 256, (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#c9b48c' : '#7a4a36'; g.fillRect(x * 32, y * 32, 32, 32); } g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 300; i++) g.fillRect(hash1(i) * w, hash1(i + 999) * h, 3, 3); }));
    ft.repeat.set(L / 3.2, d / 3.2);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(L, Pl.h + 0.04, d), [esStd('#8f8a80', 0.9), esStd('#8f8a80', 0.9), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.6 }), esStd('#8f8a80', 0.9), esStd('#8f8a80', 0.9), esStd('#8f8a80', 0.9)]);
    slab.position.set((B.x[0] + B.x[1]) / 2, (Pl.h + 0.04) / 2, (B.z[0] + B.z[1]) / 2); slab.receiveShadow = true; slab.castShadow = true; scene.add(slab);
    // the walls' broken stumps (a course or two of brick, ragged)
    const sm = esStd('#b8a38a', 0.95), r = new RNG(88), y0 = Pl.h + 0.04;
    const stub = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.1); for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, hh = r.range(0.06, 0.34); const m = esBox(Math.abs(x1 - x0) / n + 0.02 || 0.42, hh, Math.abs(z1 - z0) / n + 0.02 || 0.42, sm, x0 + (x1 - x0) * u, y0 + hh / 2, z0 + (z1 - z0) * u); m.castShadow = false; } };
    stub(B.x[0], B.z[0], B.x[1], B.z[0]); stub(B.x[0], B.z[1], B.x[1], B.z[1]); stub(B.x[0], B.z[0], B.x[0], B.z[1]); stub(B.x[1], B.z[0], B.x[1], B.z[1]);
    for (const x of [-112, -80]) stub(x, B.z[0], x, B.z[1] - 3);
    // the ticket hall's counter and the benches' feet (bolted: their tops went)
    for (let i = 0; i < 5; i++) esBox(0.5, 0.12, 0.5, esStd('#3a3a3c', 0.6, 0.5), -124 + i * 3, y0 + 0.06, -15).castShadow = false;
  }
  // ------------------------------------------------------------------ bolt stubs: where every column stood
  {
    const plates = [], y = F.plat.h + 0.012;
    for (let x = F.can1.x[0] + 2; x <= F.can1.x[1] - 1; x += F.can1.step) plates.push([x, F.can1.colZ]);
    for (let x = F.can2.x[0] + 2; x <= F.can2.x[1] - 1; x += F.can2.step) plates.push([x, F.can2.colZ]);
    out.plates = plates;
    const pm = esOff(esStd('#4a4d50', 0.5, 0.7)), bm = esOff(esStd('#c8ccd0', 0.3, 0.9), -3, -12);
    const pl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.024, 0.46), pm, plates.length), bo = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8), bm, plates.length * 4), mt = new THREE.Matrix4();
    plates.forEach(([x, z], i) => { mt.makeTranslation(x, y, z); pl.setMatrixAt(i, mt); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b], k) => { mt.makeTranslation(x + a * 0.17, y + 0.02, z + b * 0.17); bo.setMatrixAt(i * 4 + k, mt); }); });
    pl.receiveShadow = true; scene.add(pl); scene.add(bo);
  }
  // ------------------------------------------------------------------ the town's floors and the palms' stumps
  {
    const fm = esOff(esStd('#b9a98c', 0.9)), mt = new THREE.Matrix4(), q = new THREE.Quaternion(), ps = new THREE.Vector3(), sc = new THREE.Vector3();
    const fl = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.14, 1), fm, ES_TOWN.length);
    ES_TOWN.forEach(([x, z, w, d], i) => { ps.set(x, 0.07, z); sc.set(w, 1, d); mt.compose(ps, q, sc); fl.setMatrixAt(i, mt); });
    fl.receiveShadow = true; scene.add(fl);
    const st = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 8), esStd('#6a5a44', 0.95), ES_PALMS.length);
    ES_PALMS.forEach(([x, z], i) => { mt.makeTranslation(x, 0.25, z); st.setMatrixAt(i, mt); });
    scene.add(st);
  }

  out.update = (s) => {
    // the sea's surface: running east with everything loose, at 465 m/s, for the second (its ripples keep their own slow drift)
    const X = P.X(s), rep = out.waterTex.repeat.x / 8800;
    out.waterTex.offset.set(-(X * rep) % 1, (s * 0.3 * rep) % 1);
    // the scour: the dust streaks run east with the air; after 5:42:01 they stand where they are, thinning
    ES_SCOUR.uSX.value = X; ES_SCOUR.uSA.value = 0.8 * MathX.smooth(s, 0, 0.03) * (1 - 0.45 * MathX.smooth(s, 1, 1.3));
  };
  return out;
}
