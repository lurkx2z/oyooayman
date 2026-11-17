/* =====================================================================
   SEA LIFE — what lives at 10 m, 1,500 km from land, and never notices the air going: a school of small silver fish
   (instanced) and an oceanic whitetip (Carcharhinus longimanus: long, rounded, white-tipped fins, about 2.6 m), its body
   swimming by a wave down its length (a vertex shader). Both are pure functions of story time s.
     atFish(scene, n) → { set(s, centre, show) }
     atShark(scene)   → { g, set(s, pos, dir, show) }
   ===================================================================== */

// a wave down a body that lies along +z (the head at +z): x moves with a wave travelling tailwards, growing to the tail
function atSwimShader(mat, U, len, amp, head) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSwim = U.uSwim; sh.uniforms.uAmp = U.uAmp;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uSwim; uniform float uAmp;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float zz = (${head.toFixed(3)} - position.z) / ${len.toFixed(3)};
        float env = uAmp * (0.15 + 0.85 * zz * zz);
        transformed.x += env * sin(zz * 5.5 - uSwim);`);
  };
  mat.customProgramCacheKey = () => 'atSwim' + len + head;
}

function atShark(scene) {
  const g = new THREE.Group(); scene.add(g);
  const U = { uSwim: { value: 0 }, uAmp: { value: 0.12 } };
  // the colours: bronze-grey above, white below (a canvas round the body: v 0 = belly … 1 = back)
  const tex = atTex(atCanvas(64, 256, (c, w, h) => { const gr = c.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#e8ece8'); gr.addColorStop(0.42, '#d8dcd8'); gr.addColorStop(0.5, '#8a8676'); gr.addColorStop(1, '#5a574c'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }), { repeat: false });
  const bodyM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 });
  const finM = new THREE.MeshStandardMaterial({ color: '#6a6658', roughness: 0.6, side: THREE.DoubleSide });
  const tipM = new THREE.MeshStandardMaterial({ color: '#f2f2ec', roughness: 0.6, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  for (const m of [bodyM, finM, tipM]) atSwimShader(m, U, 2.6, 1, 1.3);
  // the body: rings along z (head +1.3 … tail −1.3): blunt round snout, deep body, a slim tail stock
  const rings = []; const N = 26;
  for (let i = 0; i <= N; i++) { const u = i / N, z = 1.3 - 2.6 * u;
    const r = u < 0.12 ? 0.08 + 1.55 * Math.sqrt(u) * 0.19 : u < 0.5 ? 0.24 + 0.02 * Math.sin(u * 6) : 0.24 * Math.pow(1 - (u - 0.5) / 0.5, 1.1) + 0.035;
    rings.push([0, 0, z, r * 0.92, r * 1.08]); }
  const bg = atLoft(rings, 16, 0.7);
  // (u around, v along: colour by the ring's angle: the belly white, the back dark)
  { const p = bg.attributes.position, uv = bg.attributes.uv, col = new Float32Array(p.count * 3), c0 = new THREE.Color('#ecefea'), c1 = new THREE.Color('#5c594e');
    for (let i = 0; i < p.count; i++) { const yv = p.getY(i), xv = p.getX(i), a = Math.atan2(yv, Math.abs(xv) + 1e-4), k = MathX.smooth(a, -0.25, 0.25); const c = c0.clone().lerp(c1, k); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    bg.setAttribute('color', new THREE.BufferAttribute(col, 3)); bodyM.vertexColors = true; void uv; void tex; }
  const body = new THREE.Mesh(bg, bodyM); body.castShadow = true; g.add(body);
  // fins: flat shapes (the whitetip's are long and rounded, their tips white)
  const fin = (pts, x, y, z, rx, ry, rz, tipFrom) => {
    const sh = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b))); const fg = new THREE.ShapeGeometry(sh, 6);
    const m = new THREE.Mesh(fg, finM); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m);
    // the white tip: the outer part of the same shape, scaled about its base
    const tg = new THREE.ShapeGeometry(sh, 6); const tp = new THREE.Mesh(tg, tipM); tp.position.copy(m.position); tp.rotation.copy(m.rotation);
    const ps = tg.attributes.position;
    for (let i = 0; i < ps.count; i++) { if (tipFrom.y != null) { if (tipFrom.up ? ps.getY(i) < tipFrom.y : ps.getY(i) > tipFrom.y) ps.setY(i, tipFrom.y); } else if (Math.abs(ps.getX(i)) < tipFrom.x) ps.setX(i, Math.sign(ps.getX(i) || 1) * tipFrom.x); }
    g.add(tp);
    return m;
  };
  // the first dorsal: tall, rounded (in the y–z plane)
  fin([[0, 0], [0.18, 0.32], [0.05, 0.46], [-0.12, 0.44], [-0.18, 0.3], [-0.32, 0.05], [-0.3, 0]], 0, 0.2, 0.25, 0, ATPI / 2, 0, { y: 0.33, up: 1 });
  // the pectorals: very long, rounded paddles, out to the sides and down
  for (const sd of [1, -1]) fin([[0, 0], [0.2, -0.05], [0.68, -0.18], [0.76, -0.24], [0.7, -0.32], [0.36, -0.28], [0, -0.18]].map(([a, b]) => [a * sd, b]), 0, -0.12, 0.62, ATPI / 2 - 0.25, 0, sd * 0.25, { x: 0.55 });
  // the tail: a tall upper lobe, a smaller lower one (y–z plane)
  fin([[0, 0], [-0.1, 0.12], [-0.35, 0.5], [-0.42, 0.52], [-0.3, 0.18], [-0.25, 0.0], [-0.3, -0.24], [-0.24, -0.26], [-0.05, -0.05]], 0, 0.0, -1.12, 0, -ATPI / 2, 0, { y: 0.4, up: 1 });
  // the anal and second dorsal (small)
  fin([[0, 0], [-0.06, 0.08], [-0.12, 0.02]], 0, 0.15, -0.7, 0, -ATPI / 2, 0, { y: 0.06, up: 1 });
  fin([[0, 0], [-0.06, -0.08], [-0.12, -0.02]], 0, -0.15, -0.72, 0, -ATPI / 2, 0, { y: -0.06, up: 0 });
  // its eye
  for (const sd of [1, -1]) atMesh(new THREE.SphereGeometry(0.022, 8, 6), atStd('#0a0a0a', 0.2), sd * 0.1, 0.05, 1.08, g);
  g.traverse((m) => { if (m.isMesh) m.castShadow = false; });
  return {
    g, U,
    // pos [x, y, z], dir [x, y, z] (it faces dir), the swim phase from its speed
    set(s, pos, dir, show, rate = 1) {
      g.visible = show; if (!show) return;
      g.position.set(pos[0], pos[1], pos[2]);
      const yaw = Math.atan2(dir[0], dir[2]), pitch = -Math.asin(MathX.clamp(dir[1], -1, 1));
      g.rotation.set(pitch, yaw, 0, 'YXZ');
      U.uSwim.value = s * 4.2 * rate; U.uAmp.value = 0.1 + 0.05 * rate;
    },
  };
}

// the school: small silver fish (a body and a tail), wheeling round a centre that drifts; each fish its own lane
function atFish(scene, n = 260) {
  const fg = new THREE.ConeGeometry(0.035, 0.2, 6); fg.rotateX(ATPI / 2); fg.scale(0.55, 1.2, 1);
  const tg = new THREE.ConeGeometry(0.03, 0.07, 3); tg.rotateX(-ATPI / 2); tg.scale(0.15, 1.4, 1); tg.translate(0, 0, -0.12);
  const geo = THREE.mergeGeometries([fg.toNonIndexed(), tg.toNonIndexed()]);
  const mat = new THREE.MeshStandardMaterial({ color: '#c8d4dc', roughness: 0.25, metalness: 0.75 });
  const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; scene.add(m);
  const r = new RNG(888), L = [];
  for (let i = 0; i < n; i++) L.push({ R: r.range(1.6, 3.4), y: r.range(-0.9, 0.9), ph: r.range(0, 6.28), sp: r.range(0.42, 0.55), wob: r.range(0, 6.28), sc: r.range(0.8, 1.25) });
  const o = new THREE.Object3D();
  return {
    m,
    set(s, c, show, k = 1) {
      m.visible = show; if (!show) return;
      L.forEach((f, i) => {
        const a = f.ph + s * f.sp, rr = f.R * (0.85 + 0.15 * Math.sin(s * 0.3 + f.wob)) * k;
        const x = c[0] + Math.cos(a) * rr, z = c[2] + Math.sin(a) * rr * 0.7, y = c[1] + f.y + 0.25 * Math.sin(s * 0.7 + f.wob);
        o.position.set(x, y, z);
        const dx = -Math.sin(a), dz = Math.cos(a) * 0.7; o.rotation.set(0.1 * Math.sin(s * 2 + i), Math.atan2(dx, dz), 0, 'YXZ'); o.scale.setScalar(f.sc);
        o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    },
  };
}
