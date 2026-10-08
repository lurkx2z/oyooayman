/* =====================================================================
   STEM — inside a sunflower stem, magnified: three of the hair-thin tubes (xylem vessels) that carry water up to the
   leaves, with ringed walls and pits (thin spots in the wall shared with the next tube). The water in them is PULLED
   up by the leaves: it is under tension. Normally the tiny pores in each pit hold air back, because the water surface
   stretched across a pore needs a big pressure to push through (∝ surface tension / pore size). With none, air from an
   already-empty neighbour is sucked straight through, a gap blows open and the column snaps; the next tube follows.
   Built far below the garden (NST_S.o) with its own unlit materials, so the garden's light doesn't touch it.
   Pure function of story time.
   ===================================================================== */

const NST_S = { o: [60, -40, 60], R: 0.046, gap: 0.122, H: 2.6, y0: 0.0 };     // y0: where the air gets in (set-local)

// a glassy, unlit, view-dependent material: faint in the middle, brighter at grazing angles (tube walls, water)
function nstGlassy(color, base, rim, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uBase: { value: base }, uRim: { value: rim }, uK: { value: 1 } },
    transparent: true, depthWrite: false, side: opts.side || THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vN, vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uC; uniform float uBase, uRim, uK; varying vec3 vN, vV;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(uC * (0.75 + 0.6 * f), (uBase + uRim * f) * uK); }`,
  });
}

class NstStem {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group(); this.root.name = 'stem'; this.root.position.set(...NST_S.o); scene.add(this.root);
    this.root.visible = false;
  }

  build() {
    const S = NST_S, g = this.root;
    // the stem's soft inner tissue all around: pale green cells with darker walls (seen through a haze)
    const cv = Tex.canvas(512, 512), c = cv.getContext('2d');
    c.fillStyle = '#4f6b3a'; c.fillRect(0, 0, 512, 512);
    const pts = []; for (let i = 0; i < 70; i++) pts.push([hash1(i * 3.1) * 512, hash1(i * 7.7 + 1) * 512]);
    const img = c.getImageData(0, 0, 512, 512), D = img.data;
    for (let y = 0; y < 512; y += 2) for (let x = 0; x < 512; x += 2) {
      // distance to the nearest and second-nearest cell centre (wrapped): walls where they are nearly equal
      let d1 = 1e9, d2 = 1e9;
      for (const [px, py] of pts) { let dx = Math.abs(x - px), dy = Math.abs(y - py); dx = Math.min(dx, 512 - dx); dy = Math.min(dy, 512 - dy); const d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
      const w = Math.sqrt(d2) - Math.sqrt(d1), k = w < 3 ? 0.45 : w < 7 ? 0.8 : 1.0, sh = 0.9 + 0.2 * (Math.sqrt(d1) / 40);
      for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = ((y + oy) * 512 + x + ox) * 4; D[i] = 120 * k * sh; D[i + 1] = 156 * k * sh; D[i + 2] = 92 * k * sh; }
    }
    c.putImageData(img, 0, 0);
    const ct = Tex.tex(cv); ct.repeat.set(5, 3);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 7, 40, 1, true), new THREE.MeshBasicMaterial({ map: ct, side: THREE.BackSide, fog: false, color: '#5d6a53' }));
    g.add(back);
    // a few big out-of-focus cells close in front and behind (depth)
    const cellM = new THREE.MeshBasicMaterial({ color: '#8fae6e', transparent: true, opacity: 0.1, depthWrite: false, fog: false });
    for (const [x, y, z, s] of [[-0.42, 0.25, 0.25, 0.22], [0.45, -0.3, 0.2, 0.26], [0.38, 0.42, -0.5, 0.3], [-0.5, -0.45, -0.45, 0.32], [0.0, 0.62, -0.7, 0.4]]) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), cellM); m.position.set(x, y, z); m.scale.set(1, 1.6, 0.7); g.add(m);
    }
    // the three tubes: glassy walls with spiral thickenings and rows of pits on the shared sides
    const wallM = nstGlassy('#dfeac8', 0.04, 0.42);
    const ringM = new THREE.MeshBasicMaterial({ color: '#c9cf9a', transparent: true, opacity: 0.28, depthWrite: false, fog: false });
    const pitM = new THREE.MeshBasicMaterial({ color: '#c9d4a2', transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const pitIn = new THREE.MeshBasicMaterial({ color: '#33452a', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, fog: false });
    this.waterM = []; this.airM = []; this.tubes = [];
    const ringGeo = new THREE.TorusGeometry(S.R * 0.985, 0.0019, 5, 28), pitGeo = new THREE.RingGeometry(0.0045, 0.0085, 16), pitHole = new THREE.CircleGeometry(0.0045, 12);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * S.gap, tg = new THREE.Group(); tg.position.x = x; g.add(tg);
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(S.R, S.R, S.H, 32, 1, true), wallM); wall.renderOrder = 3; tg.add(wall);
      // spiral thickening: a helix of rings (a tilted torus every 2.6 cm)
      const nR = Math.floor(S.H / 0.04), rings = new THREE.InstancedMesh(ringGeo, ringM, nR);
      for (let k = 0; k < nR; k++) { Q.setFromEuler(new THREE.Euler(Math.PI / 2 + 0.12, 0, 0)); P.set(0, -S.H / 2 + (k + 0.5) * 0.04, 0); M.compose(P, Q, SC); rings.setMatrixAt(k, M); }
      rings.renderOrder = 4; tg.add(rings);
      // pits on the sides facing the neighbours (bordered: a pale ring round a dark pore field)
      const sides = i === 0 ? [1] : i === 2 ? [-1] : [-1, 1], nP = 26;
      for (const sd of sides) {
        const pr = new THREE.InstancedMesh(pitGeo, pitM, nP), ph = new THREE.InstancedMesh(pitHole, pitIn, nP);
        for (let k = 0; k < nP; k++) {
          const y = -0.62 + k * 0.048 + 0.012 * Math.sin(k * 2.3), a = 0.32 * Math.sin(k * 1.7 + i);
          P.set(sd * Math.cos(a) * S.R * 1.003, y, Math.sin(a) * S.R * 1.003);
          Q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(sd * Math.cos(a), 0, Math.sin(a)));
          M.compose(P, Q, new THREE.Vector3(0.8, 1.35, 1)); pr.setMatrixAt(k, M); ph.setMatrixAt(k, M);
        }
        pr.renderOrder = 5; ph.renderOrder = 5; tg.add(pr, ph);
      }
      // the water column (two pieces either side of the gap that opens) and the air that replaces it (nearly invisible:
      // an empty tube just shows the tissue behind it); bright lines mark the water's two ends at the gap
      const wm = nstGlassy('#3f8fd2', 0.66, 0.3), am = nstGlassy('#eef2ee', 0.0, 0.12);
      const lo = new THREE.Mesh(new THREE.CylinderGeometry(S.R * 0.93, S.R * 0.93, 1, 28), wm), hi = new THREE.Mesh(new THREE.CylinderGeometry(S.R * 0.93, S.R * 0.93, 1, 28), wm);
      const air = new THREE.Mesh(new THREE.CylinderGeometry(S.R * 0.92, S.R * 0.92, 1, 28), am);
      lo.renderOrder = 2; hi.renderOrder = 2; air.renderOrder = 2; tg.add(lo, hi, air);
      const endM = new THREE.MeshBasicMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.85, depthWrite: false, fog: false });
      const e1 = new THREE.Mesh(new THREE.CylinderGeometry(S.R * 0.94, S.R * 0.94, 0.005, 28, 1, true), endM), e2 = e1.clone(); e1.renderOrder = e2.renderOrder = 6; tg.add(e1, e2);
      this.waterM.push(wm); this.airM.push(am);
      this.tubes.push({ tg, lo, hi, air, x, e1, e2 });
    }
    // the air pushing through the pit into the middle tube: a pale tongue that blows up into the gap
    this.tongue = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), nstGlassy('#ffffff', 0.03, 0.95)); this.tongue.renderOrder = 6; g.add(this.tongue);
    // flow markers: specks drifting up with the water (drawn as short vertical dashes)
    this.flow = new StreakSystem(this.scene, 600);
  }

  // how far the gap in tube i has opened (m above/below the entry point); i = 0 is empty from the start
  gapAt(i, t) {
    if (i === 0) return 9;
    const t0 = i === 1 ? NST.snap : NST.snap + 1.15, u = t - t0;
    if (u <= 0) return 0;
    return 0.004 + 0.4 * (1 - Math.exp(-u / 0.5)) + 0.1 * u;     // it bangs open (the two ends race apart across the frame), then keeps emptying
  }

  update(t, cam) {
    const on = t >= NST.stem - 0.2 && t < NST.lapse;
    this.root.visible = on;
    const F = this.flow; F.begin();
    if (!on) { F.end(); return; }
    const S = NST_S, hH = S.H / 2, o = this.root.position;
    // the cascade: middle (seeded from the empty left tube), then right (seeded from the middle)
    const yE = [0, S.y0, S.y0 - 0.05];
    for (let i = 0; i < 3; i++) {
      const T = this.tubes[i], e = this.gapAt(i, t), y = yE[i];
      const y1 = Math.max(-hH, y - e * 0.8), y2 = Math.min(hH, y + e);          // (the upper part is yanked up harder: the leaves are still pulling)
      const loL = y1 + hH, hiL = hH - y2;
      T.lo.visible = loL > 0.002; T.lo.scale.set(1, Math.max(loL, 1e-4), 1); T.lo.position.y = -hH + loL / 2;
      T.hi.visible = hiL > 0.002; T.hi.scale.set(1, Math.max(hiL, 1e-4), 1); T.hi.position.y = hH - hiL / 2;
      const aL = y2 - y1; T.air.visible = aL > 0.002; T.air.scale.set(1, Math.max(aL, 1e-4), 1); T.air.position.y = (y1 + y2) / 2;
      T.e1.visible = i > 0 && aL > 0.002 && y1 > -hH; T.e1.position.y = y1;
      T.e2.visible = i > 0 && aL > 0.002 && y2 < hH; T.e2.position.y = y2;
      // the water: a little jolt sideways when its tube snaps
      const j = i > 0 ? MathX.impulse(t, i === 1 ? NST.snap : NST.snap + 1.15, 0.25) : 0;
      T.tg.position.x = T.x + 0.002 * j * Math.sin(t * 90);
      // markers riding up the water (they stop dead when the column breaks)
      if (i > 0) for (let k = 0; k < 46; k++) {
        const ph = hash1(k * 3.3 + i * 17), a = hash1(k * 7.1 + i) * 6.283, rr = S.R * 0.75 * Math.sqrt(hash1(k * 5.7 + i * 3));
        const tS = i === 1 ? NST.snap : NST.snap + 1.15, tm = Math.min(t, tS);         // (their clock freezes at the snap)
        const v = 0.2 * (1 - 0.7 * Math.pow(rr / S.R, 2));                              // faster in the middle of the tube
        let yy = -hH + ((ph * S.H + v * (tm - NST.stem)) % S.H);
        if (t > tS) { const eg = this.gapAt(i, t); yy += yy > y ? eg : -0.8 * eg; }     // carried away from the gap with the water
        if (yy > y1 && yy < y2) continue;
        if (yy < -hH || yy > hH) continue;
        const x = o.x + T.tg.position.x + Math.cos(a) * rr, z = o.z + Math.sin(a) * rr, yw = o.y + yy;
        F.push(x, yw, z, x, yw + 0.022, z, 0.8, 0.92, 1.0, 0.7, 0.0026);
      }
    }
    // the air tongue: it pokes through the pit (left wall of the middle tube) just before the snap, then is the gap
    const u = t - NST.seed, s = MathX.smooth(t, NST.seed, NST.snap + 0.02) * (1 - MathX.smooth(t, NST.snap + 0.05, NST.snap + 0.3));
    this.tongue.visible = s > 0.01;
    if (this.tongue.visible) { const r = 0.004 + 0.03 * s; this.tongue.scale.set(r * 1.1, r * (1 + 0.6 * s), r); this.tongue.position.set(-S.R + r * 0.9, S.y0, 0); }
    F.end();
  }
}
