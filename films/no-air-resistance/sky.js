/* =====================================================================
   SKY — the airliner (cruising at 11.4 km when the air lets go; with no
   lift it falls on a ballistic arc for 48 s, flying up the avenue towards
   you, and comes down in the river 2.1 km away), its impact (a flash and a
   column of spray: water still rides the wind), the debris it throws (no
   drag: it flies 2 km and arrives at ~800 km/h), the sign board knocked off the
   building beside you, and the skydiver cut-away (its own scene, shown
   through FILM.view): a jumper in freefall whose canopy can't inflate.
   ===================================================================== */

// an airliner from the shared model (js/world/aircraft.js), without its landing gear; fog off (it is seen from kilometres away)
function nrAirliner() {
  const fake = {}, g = AircraftSystem.prototype._build.call(fake);
  for (const o of g.children.slice()) if (o.geometry && o.geometry.type === 'CylinderGeometry') g.remove(o);
  for (const s of fake.strobes) s.visible = false;
  g.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.fog = false; o.userData.base = o.material.color.clone(); } });
  g.strobes = fake.strobes;
  return g;
}
// tint everything toward the haze colour by k (0..1)
function nrHaze(g, col, k) { g.traverse((o) => { if (o.material && o.userData.base) o.material.color.copy(o.userData.base).lerp(col, k); }); }

class NrPlane {
  constructor(scene) {
    this.g = nrAirliner(); this.g.rotation.y = Math.atan2(-NR_PLANE.dir[0], -NR_PLANE.dir[1]);   // nose the way it flies; it stays level (nothing can pitch it now)
    this.g.scale.setScalar(1.0); scene.add(this.g);
    this.haze = new THREE.Color('#bccbd8');
    // its path since the air let go: a faint dotted arc (drawn while you watch it)
    const pts = [];
    for (let s = NR.loss; s <= NR.impact; s += 0.25) { const p = NR_PLANE.pos(s, new THREE.Vector3()); pts.push(p.x, p.y, p.z); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.trail = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    this.trail.frustumCulled = false; scene.add(this.trail);
    this.nTrail = pts.length / 3;
    this._v = new THREE.Vector3();
  }
  update(S, cam) {
    const g = this.g, on = S > 30 && S < NR.impact;
    g.visible = on; this.trail.visible = on;
    if (!on) return;
    NR_PLANE.pos(S, g.position);
    const d = g.position.distanceTo(cam.position);
    nrHaze(g, this.haze, MathX.clamp(d / 22000, 0.05, 0.4));
    const n = Math.max(0, Math.min(this.nTrail, Math.floor((S - NR.loss) / 0.25)));
    this.trail.geometry.setDrawRange(0, n);
    this.trail.material.opacity = 0.75 * (StoryHUD.win(S, 35.2, 40.4, 0.6, 0.4) + StoryHUD.win(S, 48.0, NR.impact, 0.4, 0.05));
  }
}

/* ---------------- the impact: a flash, then a column of spray that drifts with the wind ---------------- */
class NrImpact {
  constructor(scene) {
    this.glow = new BillboardSystem(scene, 8, true);
    this.spray = new BillboardSystem(scene, 700, false);
    this.spray.uniforms.uLight.value = 0.95;
    this.fog = { color: new THREE.Color('#c9d4dc'), density: 0.00022 };
    this.P = NR_PLANE.imp;
  }
  update(S) {
    const I = this.P, u = S - NR.impact, G = this.glow, Sp = this.spray, D = NR_WIND_DIR;
    G.begin(); Sp.begin(this.fog);
    if (u >= 0) {
      const f = Math.exp(-u / 0.35);
      if (f > 0.01) { G.push(I[0], 40 + 80 * u, I[1], 700 * (0.6 + u), 0, 0.9 * f, 1, 1.0, 0.92, 0.75); G.push(I[0], 15, I[1], 260, 0, f, 1, 1.0, 0.75, 0.45); }
      // the column: puffs shot up from the impact, slowing as they climb (spray is water: it still feels the air), then drifting off with the wind
      for (let i = 0; i < 340; i++) {
        const born = (hash1(i * 3 + 1) ** 2) * 1.4, a = u - born;
        if (a < 0) continue;
        const v0 = 60 + 170 * hash1(i * 5 + 2), tau = 1.6 + 1.2 * hash1(i * 7 + 3), h = v0 * tau * (1 - Math.exp(-a / tau)) - 6 * a * a * 0.5;
        const sp = 18 + 60 * hash1(i * 11 + 4), ang = hash1(i * 13 + 5) * 6.283, r = sp * tau * (1 - Math.exp(-a / tau)) * (0.3 + 0.7 * hash1(i * 17 + 6));
        const drift = nrWindDist(S) - nrWindDist(NR.impact + born);
        const x = I[0] + Math.cos(ang) * r + D.x * drift * 0.9, z = I[1] + Math.sin(ang) * r + D.z * drift * 0.9, y = Math.max(5, h);
        const k = MathX.clamp(a / 9, 0, 1), size = 40 + 90 * hash1(i * 19 + 7) + 160 * k;
        const shade = 0.82 + 0.16 * hash1(i * 23 + 8) - 0.18 * (1 - y / 600);
        Sp.push(x, y, z, size, i * 1.7, 0.85 * Math.min(1, a * 3) * (1 - 0.6 * k), shade, 0.94, 0.96, 1.0);
      }
      // a low skirt of spray rolling out along the river
      for (let i = 0; i < 90; i++) { const a = u - 0.2 * hash1(i + 400); if (a < 0) continue; const ang = (i / 90) * 6.283, r = 220 * (1 - Math.exp(-a / 1.5)) + 40;
        Sp.push(I[0] + Math.cos(ang) * r, 18 + 25 * hash1(i + 500), I[1] + Math.sin(ang) * r, 70 + 60 * Math.min(1, a / 4), i, 0.7 * Math.min(1, a * 2) * (1 - MathX.clamp(a / 12, 0, 0.7)), 0.9, 0.94, 0.96, 1.0); }
    }
    G.end(); Sp.end();
  }
}

/* ---------------- the debris ---------------- */
// [x, y, z, arrival (s after the impact), size (m), kind] — most come down along the avenue, the nearest last; some fly over
const NR_DEBRIS_SPEC = (() => {
  const r = new RNG(9091), L = [];
  for (let i = 0; i < 70; i++) { const z = r.range(-420, -40); L.push([r.range(-6.5, 6.5), 0, z, 9.25 + (z + 420) / 380 * 1.25 + r.range(0, 0.15), r.range(0.3, 1.6), r.int(0, 2)]); }
  for (let i = 0; i < 26; i++) { const z = r.range(-40, 6); L.push([r.range(-6.8, 6.8), 0, z, 10.5 + (z + 40) / 46 * 0.7 + r.range(-0.05, 0.1), r.range(0.4, 1.8), r.int(0, 2)]); }
  for (let i = 0; i < 18; i++) { const side = r.next() < 0.5 ? -1 : 1, z = r.range(-80, 6); L.push([side * 12.45, r.range(2, 16), z, 10.4 + (z + 80) / 86 * 0.9, r.range(0.3, 1.2), r.int(0, 2)]); }
  for (let i = 0; i < 26; i++) { const z = r.range(30, 260); L.push([r.range(-14, 14), 0, z, 11.0 + (z - 30) / 230 * 1.2, r.range(0.4, 1.6), r.int(0, 2)]); }
  for (let i = 0; i < 40; i++) L.push([r.range(-300, 300), 0, r.range(-1500, -300), r.range(4.5, 9.2), r.range(0.8, 3.0), r.int(0, 2)]);
  // the hero hits: the façade above where you stood (it knocks the sign board off), the road where you stood, the bus shelter, a stopped car
  L.push([12.4, 12.4, 1.9, NR.board - NR.impact, 1.1, 0]);
  L.push([8.6, 0.15, 0.8, 61.1 - NR.impact, 1.6, 2]);
  L.push([-9.9, 1.2, -40.5, 10.15, 1.0, 1]);
  // the last few, still arriving as you look up: they pass high over your head and come down far behind you
  const I = NR.planeImp;
  for (const [S0, h, x0, size, kind] of [[62.9, 95, 7.0, 1.6, 0], [63.6, 140, 13.0, 2.0, 2], [64.4, 75, 4.0, 1.3, 1], [65.25, 115, 10.5, 1.8, 0]]) {
    const u0 = S0 - NR.impact, vh = (10 - I[1]) / u0, vy = (h + 0.5 * NR_G * u0 * u0) / u0, T = 2 * vy / NR_G;
    L.push([I[0] + (x0 - I[0]) * T / u0, 0, I[1] + vh * T, T, size, kind]);
  }
  return L;
})();

class NrDebris {
  constructor(scene, app) {
    this.app = app;
    const geos = [new THREE.TetrahedronGeometry(0.6, 0), new THREE.BoxGeometry(1.0, 0.25, 0.7), new THREE.BoxGeometry(1.4, 0.05, 1.0)];
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0.5, fog: false });
    this.kinds = geos.map((g) => { const m = new THREE.InstancedMesh(g, mat, NR_DEBRIS_SPEC.length); m.frustumCulled = false; m.castShadow = true; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NR_DEBRIS_SPEC.length * 3), 3); scene.add(m); return m; });
    this.list = NR_DEBRIS_SPEC.map(([x, y, z, T, size, kind], i) => {
      const P = nrDebrisPiece(x, y, z, T), c = new THREE.Color().setHSL(0.58, 0.04, 0.2 + 0.45 * hash1(i * 3.3));
      return { P, size, kind, i, c, land: NR.impact + T, x, y, z, spin: [hash1(i + 1) * 14 - 7, hash1(i + 2) * 14 - 7, hash1(i + 3) * 14 - 7], near: Math.abs(z) < 300 && Math.abs(x) < 20 };
    });
    // what an impact throws up: sparks and grit (grit is solid too: it flies out and falls straight back, no dust cloud hangs)
    this.sparks = new StreakSystem(scene, 900);
    const chipG = new THREE.BoxGeometry(0.06, 0.04, 0.05);
    this.chips = new THREE.InstancedMesh(chipG, new THREE.MeshStandardMaterial({ color: '#77736c', roughness: 0.9 }), 1600); this.chips.frustumCulled = false; scene.add(this.chips);
    this.marks = new BlobShadows(scene, 140);
    this.haze = new THREE.Color('#c3cfd8');
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(); this._c = new THREE.Color();
  }
  // the cloud of debris in the air (for the HUD tag): the mean position of the near pieces still flying
  cloud(S, out) {
    let n = 0; out.set(0, 0, 0);
    for (const d of this.list) { const u = S - NR.impact; if (!d.near || u < 0 || S >= d.land) continue; d.P.at(u, this._p); out.add(this._p); n++; }
    return n ? out.multiplyScalar(1 / n) : null;
  }
  update(S, cam) {
    const u = S - NR.impact, cnt = [0, 0, 0];
    const Sp = this.sparks; Sp.begin(); let nc = 0; this.marks.begin();
    for (const d of this.list) {
      const M = this.kinds[d.kind];
      if (u > 0 && S < d.land) {
        d.P.at(u, this._p);
        this._e.set(d.spin[0] * u, d.spin[1] * u, d.spin[2] * u); this._q.setFromEuler(this._e); this._s.setScalar(d.size);
        this._m.compose(this._p, this._q, this._s); M.setMatrixAt(cnt[d.kind], this._m);
        const dist = this._p.distanceTo(cam.position); this._c.copy(d.c).lerp(this.haze, MathX.clamp(dist / 2600, 0, 0.75));
        M.setColorAt(cnt[d.kind], this._c); cnt[d.kind]++;
        // a short bright streak behind the near ones in their last second (they are that fast)
        if (d.near && d.land - S < 0.6) { const v = this._p, dx = d.P.dir[0] * d.P.vh * 0.025, dz = d.P.dir[1] * d.P.vh * 0.025; Sp.push(v.x - dx, v.y + 0.02, v.z - dz, v.x, v.y, v.z, 0.9, 0.85, 0.75, 0.25, 0.04 * d.size); }
      }
      // the hit: sparks, grit thrown out along its path, a scar on the ground
      const w = S - d.land;
      if (d.near && w >= 0) {
        if (w < 0.45) for (let k = 0; k < 10; k++) {
          const a = hash1(d.i * 31 + k) * 6.283, sp = 8 + 30 * hash1(d.i * 37 + k), up = 2 + 9 * hash1(d.i * 41 + k), fw = 0.6 + 0.4 * hash1(d.i * 43 + k);
          const vx = Math.cos(a) * sp * 0.5 + d.P.dir[0] * sp * fw, vz = Math.sin(a) * sp * 0.5 + d.P.dir[1] * sp * fw, t0 = w, t1 = Math.max(0, w - 0.035);
          const y0 = d.y + up * t0 - 4.9 * t0 * t0, y1 = d.y + up * t1 - 4.9 * t1 * t1;
          if (y0 > -0.1) Sp.push(d.x + vx * t1, y1, d.z + vz * t1, d.x + vx * t0, y0, d.z + vz * t0, 1.0, 0.82, 0.5, 1.4 * (1 - w / 0.45), 0.025);
        }
        if (w < 2.6) for (let k = 0; k < 12 && nc < 1600; k++) {
          const a = hash1(d.i * 53 + k) * 6.283, sp = 3 + 18 * hash1(d.i * 59 + k), up = 2 + 8 * hash1(d.i * 61 + k);
          const vx = Math.cos(a) * sp * 0.6 + d.P.dir[0] * sp, vz = Math.sin(a) * sp * 0.6 + d.P.dir[1] * sp, tl = (up + Math.sqrt(up * up + 2 * 9.81 * Math.max(0, d.y - 0.15))) / 9.81, ww = Math.min(w, tl);
          this._p.set(d.x + vx * ww, Math.max(0.17, d.y + up * ww - 4.905 * ww * ww), d.z + vz * ww);
          this._e.set(ww * 9 + k, ww * 7, ww * 5); this._q.setFromEuler(this._e); this._s.setScalar(1 + 3 * hash1(d.i * 67 + k));
          this._m.compose(this._p, this._q, this._s); this.chips.setMatrixAt(nc++, this._m);
        }
        if (d.y < 0.5) this.marks.push(d.x + d.P.dir[0] * 0.8, (Math.abs(d.x) < 7 ? 0 : LAYOUT.curbH) + 0.014, d.z + d.P.dir[1] * 0.8, 0.9 + d.size, 0.75 * Math.min(1, w * 20), 2.4 + 2 * d.size, Math.atan2(d.P.dir[0], d.P.dir[1]));
      }
    }
    this.kinds.forEach((M, k) => { M.count = cnt[k]; M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true; });
    this.chips.count = nc; this.chips.instanceMatrix.needsUpdate = true;
    Sp.end(); this.marks.end();
  }
}

/* ---------------- the sign board on the building beside you (12 m up) ---------------- */
class NrBoard {
  constructor(scene) {
    const c = Tex.canvas(512, 300), x = c.getContext('2d');
    x.fillStyle = '#f3efe4'; x.fillRect(0, 0, 512, 300); x.fillStyle = '#1f4e79'; x.fillRect(0, 0, 512, 92);
    x.fillStyle = '#ffffff'; x.font = `700 64px ${Tex.fontCond}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('OFFICES', 256, 48);
    x.fillStyle = '#1f4e79'; x.font = `700 92px ${Tex.fontCond}`; x.fillText('TO LET', 256, 170); x.font = `500 30px ${Tex.fontSans}`; x.fillText('1,200 sq ft · 3rd floor', 256, 255);
    const face = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.6 }), edge = Mat.std('#d8d6d0', { roughness: 0.5, metalness: 0.3 });
    const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.5, 2.6), [edge, face, edge, edge, edge, edge]); g.add(b);
    b.castShadow = true; b.receiveShadow = true;
    this.g = g; scene.add(g);
    this.home = new THREE.Vector3(12.43, NR_BOARD.y0, 1.6);
    // its brackets stay on the wall
    for (const dz of [-0.9, 0.9]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), Mat.std('#3a3d40', { roughness: 0.5 })); br.position.set(12.47, NR_BOARD.y0 + 0.5, 1.6 + dz); scene.add(br); }
    // the normal-air ghost: the same board, sailing down slowly
    const gm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
    this.ghost = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.5, 2.6), gm); scene.add(this.ghost);
    this.ghostEdge = new THREE.LineSegments(new THREE.EdgesGeometry(this.ghost.geometry), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })); this.ghost.add(this.ghostEdge);
    this.v0 = [-1.4, 0.6, 1.2]; this.w0 = [0.6, 1.1, 1.5];
    const y0 = NR_BOARD.y0, yG = LAYOUT.curbH + 0.03; this.tf = (this.v0[1] + Math.sqrt(this.v0[1] ** 2 + 2 * NR_G * (y0 - yG))) / NR_G;
    this.landT = NR.board + this.tf;
  }
  pos(S, out) { const u = Math.max(0, Math.min(S - NR.board, this.tf)); return out.set(this.home.x + this.v0[0] * u, this.home.y + this.v0[1] * u - 0.5 * NR_G * u * u, this.home.z + this.v0[2] * u); }
  speed(S) { const u = MathX.clamp(S - NR.board, 0, this.tf); return Math.hypot(this.v0[0], this.v0[1] - NR_G * u, this.v0[2]); }
  update(S) {
    const g = this.g, u = S - NR.board;
    this.pos(S, g.position);
    if (u < 0) g.rotation.set(0, 0, 0);
    else if (u < this.tf) g.rotation.set(this.w0[0] * u, this.w0[1] * u, this.w0[2] * u);
    else { const w = S - this.landT, k = Math.exp(-w * 8); g.position.y = LAYOUT.curbH + 0.03 + 0.12 * Math.abs(Math.sin(Math.min(w, 0.4) * 8)) * k; g.rotation.set(0, this.w0[1] * this.tf + 0.15 * k, Math.PI / 2); }
    // the ghost: from the same spot, sailing and rocking down (≈ 4 m/s); it fades once the real one has landed
    const gh = NR_BOARD.ghost(u), vis = u > 0.05 && S < this.landT + 1.4, a = vis ? 0.22 * MathX.smooth(u, 0.05, 0.35) * (1 - MathX.smooth(S, this.landT + 0.6, this.landT + 1.4)) : 0;
    this.ghost.visible = vis; this.ghost.material.opacity = a; this.ghostEdge.material.opacity = a * 3.5;
    this.ghost.position.set(this.home.x - 0.6 * Math.min(u, 1) + gh[1] * 0.4, this.home.y - gh[0], this.home.z + gh[1]); this.ghost.rotation.set(gh[2], 0.2 * gh[1], 0.35 * gh[2]);
  }
}

/* =====================================================================
   THE SKYDIVER — a separate scene: sky, a city 0.4–2 km below, the jumper
   in freefall (the camera falls with him), his canopy that can't inflate.
   ===================================================================== */
LOOKS.nrJumper = { skin: 0, build: 'avg', shirt: '#c8402a', sleeves: 'long', pants: '#2a2d33', shoes: '#1a1a1a', sole: '#333', hair: '#222', hat: { type: 'helmet', color: '#f0eee8' }, gloves: '#1a1a1a', backpack: '#1d2026' };

class NrAerial {
  constructor(app) {
    const sc = new THREE.Scene(); this.scene = sc;
    this.cam = new THREE.PerspectiveCamera(64, 9 / 16, 0.2, 60000); this.cam.rotation.order = 'YXZ'; sc.add(this.cam);
    sc.fog = new THREE.FogExp2(new THREE.Color('#b4c4d2'), 0.00016);
    sc.background = new THREE.Color('#b9c9d6');
    this._sky(); this._ground(); this._clouds();
    const sun = new THREE.DirectionalLight('#fff0dc', 2.6); sun.position.set(-0.3, 0.62, 0.72).multiplyScalar(1000); sc.add(sun, sun.target); this.sun = sun;
    sc.add(new THREE.HemisphereLight('#bcd2ec', '#6f6a60', 0.95));
    // the jumper
    this.p = new Person({ id: 'jumper', look: 'nrJumper', states: [[0, 'idle']] }, sc);
    this.p.root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    this._canopy();
    // the airliner far above (the same one): seen as a speck at the start
    this.plane = nrAirliner(); this.plane.rotation.y = -Math.PI / 2; sc.add(this.plane);
    this.haze = new THREE.Color('#c4d3df');
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._t = new THREE.Vector3();
  }

  _sky() {
    const U = { uSun: { value: new THREE.Vector3(-0.3, 0.62, 0.72).normalize() } };
    const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 uSun; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float h = d.y;
          vec3 col = mix(vec3(0.74, 0.8, 0.86), vec3(0.29, 0.5, 0.78), pow(clamp(h, 0.0, 1.0), 0.5));
          col = mix(col, vec3(0.72, 0.78, 0.84), smoothstep(0.0, -0.3, h));
          float s = max(dot(d, uSun), 0.0); col += vec3(1.0, 0.92, 0.78) * (pow(s, 6.0) * 0.18 + pow(s, 300.0) * 1.2);
          gl_FragColor = vec4(col, 1.0); }` });
    const m = new THREE.Mesh(new THREE.SphereGeometry(30000, 32, 16), mat); m.frustumCulled = false; m.renderOrder = -10; this.scene.add(m); this.skyM = m;
  }

  // the city below: a painted ground (streets, blocks, parks, a river) and 3D blocks of buildings around the fall line
  _ground() {
    const N = 4096, W = 9000, c = Tex.canvas(N, N), x = c.getContext('2d'), r = new RNG(3131), px = N / W;
    x.fillStyle = '#5c5a56'; x.fillRect(0, 0, N, N);
    const blk = 84, road = 14;
    for (let gx = 0; gx < W; gx += blk) for (let gz = 0; gz < W; gz += blk) {
      const park = r.next() < 0.07, tone = r.range(0.85, 1.15);
      x.fillStyle = park ? `rgb(${62 * tone | 0},${92 * tone | 0},${52 * tone | 0})` : `rgb(${118 * tone | 0},${108 * tone | 0},${96 * tone | 0})`;
      x.fillRect((gx + road / 2) * px, (gz + road / 2) * px, (blk - road) * px, (blk - road) * px);
      if (!park) for (let k = 0; k < 6; k++) { const s = r.range(10, 30); x.fillStyle = `rgba(${r.int(60, 200)},${r.int(60, 190)},${r.int(60, 180)},0.35)`; x.fillRect((gx + road / 2 + r.range(0, blk - road - s)) * px, (gz + road / 2 + r.range(0, blk - road - s)) * px, s * px, s * px); }
    }
    x.strokeStyle = '#4f6f80'; x.lineWidth = 240 * px; x.beginPath(); x.moveTo(0, N * 0.78); x.bezierCurveTo(N * 0.3, N * 0.7, N * 0.6, N * 0.9, N, N * 0.82); x.stroke();
    x.strokeStyle = '#6a6862'; x.lineWidth = 34 * px; x.beginPath(); x.moveTo(N * 0.2, 0); x.lineTo(N * 0.62, N); x.stroke();
    const tex = Tex.tex(c, { repeat: false }); tex.anisotropy = 4;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshLambertMaterial({ map: tex })); g.rotation.x = -Math.PI / 2; this.scene.add(g);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(120000, 120000), new THREE.MeshLambertMaterial({ color: '#6b6862' })); far.rotation.x = -Math.PI / 2; far.position.y = -0.5; this.scene.add(far);
    // 3D blocks within ~1.4 km (the last seconds before the cut are at ~430 m)
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    const n = 3200, im = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: '#ffffff' }), n), M = new THREE.Matrix4(), col = new THREE.Color();
    let i = 0;
    for (let gx = -1400; gx < 1400 && i < n; gx += blk) for (let gz = -1400; gz < 1400 && i < n; gz += blk) {
      // (aligned with the painted blocks)
      const ox = gx - ((-W / 2) % blk), oz = gz - ((-W / 2) % blk);
      for (let k = 0; k < 4 && i < n; k++) {
        const w = r.range(14, 30), d = r.range(14, 30), h = r.range(9, 46) * (Math.hypot(gx, gz) < 500 ? 1.25 : 1), cx = ox + road / 2 + r.range(w / 2, blk - road - w / 2), cz = oz + road / 2 + r.range(d / 2, blk - road - d / 2);
        M.makeScale(w, h, d).setPosition(cx, 0, cz); im.setMatrixAt(i, M);
        col.setHSL(r.next() < 0.3 ? r.range(0.55, 0.62) : r.range(0.03, 0.11), r.range(0.08, 0.3), r.range(0.22, 0.5)); im.setColorAt(i, col); i++;
      }
    }
    im.count = i; this.scene.add(im);
  }

  // clouds (water droplets) at different heights near the fall line: they rush up past you
  _clouds() {
    this.puffs = new BillboardSystem(this.scene, 500, false); this.puffs.uniforms.uLight.value = 1.05;
    const r = new RNG(77); this.cl = [];
    for (const [alt, n, spread] of [[2350, 7, 700], [1750, 9, 420], [1300, 9, 340], [900, 8, 300]]) {
      for (let c = 0; c < n; c++) {
        const a0 = r.range(0, 6.28), d0 = r.range(70, spread), cx = Math.cos(a0) * d0, cz = Math.sin(a0) * d0, R = r.range(30, 70);
        for (let i = 0; i < 16; i++) { const a = r.range(0, 6.28), d = Math.sqrt(r.next()) * R; this.cl.push([cx + Math.cos(a) * d, alt + r.range(-0.4, 0.5) * R * 0.6, cz + Math.sin(a) * d * 0.8, r.range(22, 48), r.range(0, 6.28), r.range(0.86, 1.0)]); }
      }
    }
  }

  // the canopy: a ram-air wing that never fills — a loose sheet that spills out and floats beside him (everything falls together)
  _canopy() {
    const c = Tex.canvas(256, 64), x = c.getContext('2d');
    for (let i = 0; i < 9; i++) { x.fillStyle = i % 3 === 1 ? '#f4f1ea' : '#d8402c'; x.fillRect(i * 256 / 9, 0, 256 / 9 + 1, 64); }
    this.cU = { uK: { value: 1 }, uT: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.75, side: THREE.DoubleSide }), U = this.cU;
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uK, uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec3 p = position; float a = p.x * 0.9 + uT * 0.35, b = p.y * 1.7 - uT * 0.25;
        vec3 n = vec3(sin(a * 1.3 + p.y * 2.1) + 0.5 * sin(b * 2.7 + p.x * 3.3), sin(b * 1.1 + p.x * 1.9) * 0.6 + 0.4 * sin(a * 3.1 + uT * 0.4), sin(a * 1.7 + b * 1.3) + 0.6 * sin(p.x * 4.1 - p.y * 2.3));
        transformed = mix(p, p * 0.32, uK * 0.8) + n * (0.25 + 0.55 * uK); }`); };
    mat.customProgramCacheKey = () => 'nrCanopy';
    this.canopy = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 3.0, 28, 10), mat); this.scene.add(this.canopy);
    this.pc = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: 0.8, side: THREE.DoubleSide })); this.scene.add(this.pc);
    this.bag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.3), Mat.std('#1d2026')); this.scene.add(this.bag);
    // the lines: 12 suspension lines + the bridle, as polylines (weightless: they float in loose curves)
    this.nL = 13; this.seg = 18;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(this.nL * this.seg * 2 * 3), 3));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#efe9de', transparent: true, opacity: 0.9 })); this.lines.frustumCulled = false; this.scene.add(this.lines);
  }

  // the arch: face down, arms out and up, legs bent; the right hand goes back to pull at NR.deploy
  _pose(S) {
    const p = basePose(), u = S - NR.deploy, w = 0.04 * Math.sin(S * 3.1), pull = u > -0.4 && u < 0.5 ? Math.sin(MathX.clamp((u + 0.4) / 0.9, 0, 1) * Math.PI) : 0;
    p.spine = -0.3; p.neck = -0.55; p.lSh = [2.0, 1.0]; p.rSh = [MathX.lerp(2.0, -0.3, pull), MathX.lerp(1.0, 0.5, pull)]; p.lEl = 1.0 + w; p.rEl = MathX.lerp(1.0, 1.4, pull);
    p.lHip = [-0.25, 0.28]; p.rHip = [-0.25, 0.28]; p.lKnee = 1.25 + w; p.rKnee = 1.25 - w; p.lFoot = 0.4; p.rFoot = 0.4; p.hipY = 0;
    return p;
  }

  update(S) {
    const alt = NR_JUMP.alt(S), J = this.p, u = S - NR.deploy;
    J.root.position.set(0, alt, 0); J.root.rotation.set(Math.PI / 2 + 0.06 * Math.sin(S * 0.9), 0.15 * Math.sin(S * 0.37), 0.05 * Math.sin(S * 1.3), 'YXZ');
    J.apply(this._pose(S)); J.root.updateMatrixWorld(true);
    // the canopy and its parts: thrown out at the pull, drifting off at the speed they were given (nothing slows them)
    const back = J.j.spine.localToWorld(this._v.set(0, 0.3, -0.22)), vis = u > 0;
    this.pc.visible = this.bag.visible = this.canopy.visible = this.lines.visible = vis;
    if (vis) {
      const pcO = this._w.set(-0.25 + 0.4 * u, 0.6 + 2.6 * Math.min(u, 0.9) + 0.9 * Math.max(0, u - 0.9), 0.4 + 0.6 * u).add(back);
      this.pc.position.copy(pcO); this.pc.rotation.set(0.6 * Math.sin(u * 1.3), u * 0.8, 0.4 * Math.sin(u * 0.9));
      const ub = Math.max(0, u - 0.85), bag = this._t.set(-0.1 + 0.35 * ub, 0.1 + 1.6 * ub, 0.1 + 0.3 * ub).add(back);
      this.bag.position.copy(bag); this.bag.rotation.set(ub * 1.2, ub * 0.7, 0);
      const k = MathX.smooth(u, 0.95, 2.6);
      this.canopy.visible = u > 0.95;
      this.canopy.position.set(bag.x + 0.4 * k + 0.25 * ub, bag.y + 0.9 * k + 0.5 * ub, bag.z + 0.6 * k);
      this.canopy.scale.setScalar(0.12 + 0.88 * k); this.canopy.rotation.set(-0.9 + 0.3 * Math.sin(u * 0.5), 0.6 + 0.15 * u, 0.2 * Math.sin(u * 0.7));
      this.cU.uK.value = 1 - 0.55 * k; this.cU.uT.value = u;
      // lines: from his shoulders (risers) to the canopy's lower edge; the bridle from his back to the pilot chute
      const P = this.lines.geometry.attributes.position.array, sh = [J.j.la.sh, J.j.ra.sh].map((q) => q.getWorldPosition(new THREE.Vector3()));
      this.canopy.updateMatrixWorld(true);
      let o = 0;
      const line = (a, b, slack, seed) => {
        let px = a.x, py = a.y, pz = a.z;
        for (let s = 1; s <= this.seg; s++) {
          const f = s / this.seg, bend = Math.sin(f * Math.PI) * slack;
          const x = a.x + (b.x - a.x) * f + bend * Math.sin(seed * 3 + u * 0.4 + f * 2), y = a.y + (b.y - a.y) * f + bend * 0.5 * Math.sin(seed * 5 + u * 0.3), z = a.z + (b.z - a.z) * f + bend * Math.cos(seed * 4 + u * 0.35 + f * 1.5);
          P.set([px, py, pz, x, y, z], o); o += 6; px = x; py = y; pz = z;
        }
      };
      for (let i = 0; i < 12; i++) {
        const e = this.canopy.localToWorld(this._v.set(-3.6 + (i % 6) * 1.44, -1.3 + (i >= 6 ? 1.5 : 0), 0));
        const a = sh[i % 2], dist = a.distanceTo(e), L = Math.max(dist, 3.2 * k + 0.6);
        line(a, e, Math.sqrt(Math.max(0, L * L - dist * dist)) * 0.45 + 0.08, i * 1.7);
      }
      line(back, this.pc.position, 0.25, 9.1);
      this.lines.geometry.attributes.position.needsUpdate = true;
    }
    // clouds rush up past
    this.puffs.begin(this.scene.fog);
    for (const [x, y, z, s, r, sh] of this.cl) { if (Math.abs(y - alt) > 900) continue; this.puffs.push(x, y, z, s, r, 0.42, sh, 1, 1, 1); }
    this.puffs.end();
    // the airliner, far above
    this.plane.position.set(-2200 + NR_PLANE.v * (S - NR.sky[0]), NR_PLANE.alt(S), -4200);
    nrHaze(this.plane, this.haze, 0.45);
    this._camera(S, alt);
  }

  // the camera falls with him: beside and below him (the sky, the airliner), above him (the city), close on the pull, then wide
  _camera(S, alt) {
    const C = this.cam;
    if (!this._k) this._k = {
      x: [[12.4, 3.0], [13.9, 3.4], [14.9, 1.6], [16.0, 1.8], [16.5, 2.6], [17.7, 3.0], [18.6, 8.0], [20.4, 7.0]],
      y: [[12.4, -4.4], [13.9, -4.6], [14.9, 4.6], [16.0, 4.2], [16.5, 1.0], [17.7, 1.6], [18.6, 3.0], [20.4, 2.6]],
      z: [[12.4, 1.8], [13.9, 1.4], [14.9, 2.6], [16.0, 2.2], [16.5, -1.8], [17.7, -2.6], [18.6, 4.4], [20.4, 3.8]],
      lx: [[12.4, -0.6], [13.9, -0.8], [14.9, 0], [16.0, 0], [16.5, 0], [17.7, 0.2], [18.6, 0.5], [20.4, 0.5]],
      ly: [[12.4, 3.0], [13.9, 3.4], [14.9, -6.0], [16.0, -6.0], [16.5, 0.6], [17.7, 1.6], [18.6, 1.9], [20.4, 1.9]],
      lz: [[12.4, -1.4], [13.9, -1.6], [14.9, -1.5], [16.0, -1.5], [16.5, 0.2], [17.7, 0.4], [18.6, 0.4], [20.4, 0.4]],
      fov: [[12.4, 62], [13.9, 64], [14.9, 70], [16.0, 70], [16.5, 64], [17.7, 66], [18.6, 62], [20.4, 58]],
    };
    const k = this._k, tr = (n) => (this['_t' + n] || (this['_t' + n] = new Track(k[n], 'inOutSine'))).value(S);
    C.position.set(tr('x'), alt + tr('y'), tr('z'));
    C.lookAt(tr('lx'), alt + tr('ly'), tr('lz'));
    C.rotation.z += 0.012 * Math.sin(S * 2.3) + 0.008 * noise1(S * 4, 81);
    const f = tr('fov'); if (Math.abs(C.fov - f) > 1e-3) { C.fov = f; C.updateProjectionMatrix(); }
    C.updateMatrixWorld(true);
  }
}
