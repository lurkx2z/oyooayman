/* =====================================================================
   SKY — the skydiver cut-away (its own scene, shown through FILM.view):
   a jumper in freefall at 2 km when the air lets go. With no drag his
   speed keeps climbing past the normal top speed, and his parachute can't
   even open (a NORMAL AIR ghost shows the canopy that would have opened).
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
    this.puffs = new BillboardSystem(this.scene, 900, false); this.puffs.uniforms.uLight.value = 1.05;
    const r = new RNG(77); this.cl = [];
    for (const [alt, n, spread] of [[2350, 7, 700], [1750, 9, 420], [1300, 9, 340], [900, 8, 300]]) {
      for (let c = 0; c < n; c++) {
        const a0 = r.range(0, 6.28), d0 = r.range(70, spread), cx = Math.cos(a0) * d0, cz = Math.sin(a0) * d0, R = r.range(30, 70);
        // a heap of smaller puffs: flat underneath, domed on top, shadowed low down (so it reads as a cloud, not a disc)
        for (let i = 0; i < 24; i++) { const a = r.range(0, 6.28), d = Math.sqrt(r.next()) * R, h = (1 - d / R) * R * 0.7 * r.range(0.2, 1); this.cl.push([cx + Math.cos(a) * d, alt - 0.1 * R + h, cz + Math.sin(a) * d * 0.8, r.range(14, 34) * (1 - 0.3 * d / R), r.range(0, 6.28), 0.7 + 0.3 * h / (0.7 * R)]); }
      }
    }
  }

  // a crumpled sheet of red-and-white canopy fabric (the wad, and the pilot chute that can't fill)
  _rag(w, h, cells, key) {
    const c = Tex.canvas(256, 64), x = c.getContext('2d');
    for (let i = 0; i < 9; i++) { x.fillStyle = i % 3 === 1 ? '#f4f1ea' : '#d8402c'; x.fillRect(i * 256 / 9, 0, 256 / 9 + 1, 64); }
    const U = { uK: { value: 1 }, uT: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.75, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uK, uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec3 p = position; float a = p.x * 0.9 + uT * 0.35, b = p.y * 1.7 - uT * 0.25;
        vec3 n = vec3(sin(a * 1.3 + p.y * 2.1) + 0.5 * sin(b * 2.7 + p.x * 3.3), sin(b * 1.1 + p.x * 1.9) * 0.6 + 0.4 * sin(a * 3.1 + uT * 0.4), sin(a * 1.7 + b * 1.3) + 0.6 * sin(p.x * 4.1 - p.y * 2.3));
        transformed = mix(p, p * 0.32, uK * 0.8) + n * (0.25 + 0.55 * uK) * ${(h / 3).toFixed(3)}; }`); };
    mat.customProgramCacheKey = () => key;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, cells[0], cells[1]), mat); this.scene.add(m);
    return { m, U };
  }

  // the parachute: with no drag the pilot chute can't fill and can't pull the canopy out. It is thrown out at the pull and
  // just drifts off at the speed it was given, on a slack bridle; the canopy spills half out of the container as a loose
  // wad on slack lines. Beside them, a "normal air" ghost of the canopy opening (and falling away above him, as it would)
  _canopy() {
    this.wad = this._rag(4.2, 1.6, [20, 8], 'nrWad');
    this.pc = this._rag(1.1, 0.9, [8, 6], 'nrPilot');
    // the lines: 12 suspension lines + the bridle, as polylines (weightless: they float in loose loops)
    this.nL = 13; this.seg = 18;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(this.nL * this.seg * 2 * 3), 3));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#d9d2c4', transparent: true, opacity: 0.55 })); this.lines.frustumCulled = false; this.scene.add(this.lines);
    // the ghost: an open round canopy (a dome everyone reads as a parachute), see-through and dark-edged (it reads on the
    // pale sky), its gores and lines running down to where his harness is
    const R = 3.8, cap = Math.PI * 0.42, rimY = R * Math.cos(cap) * 0.7, rimR = R * Math.sin(cap);
    const cg = new THREE.SphereGeometry(R, 24, 6, 0, Math.PI * 2, 0, cap); cg.scale(1, 0.7, 1); cg.translate(0, -rimY, 0);
    const gm = new THREE.MeshBasicMaterial({ color: '#1d2b3c', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const ghost = new THREE.Group(), body = new THREE.Mesh(cg, gm); ghost.add(body);
    const lp = [], top = (R * 0.7) - rimY;
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2;
      for (let j = 0; j < 6; j++) { const p0 = j / 6 * cap, p1 = (j + 1) / 6 * cap; lp.push(Math.cos(a) * R * Math.sin(p0), R * Math.cos(p0) * 0.7 - rimY, Math.sin(a) * R * Math.sin(p0), Math.cos(a) * R * Math.sin(p1), R * Math.cos(p1) * 0.7 - rimY, Math.sin(a) * R * Math.sin(p1)); }
      lp.push(Math.cos(a) * rimR, 0, Math.sin(a) * rimR, Math.cos(a1) * rimR, 0, Math.sin(a1) * rimR);
      lp.push(Math.cos(a) * rimR, 0, Math.sin(a) * rimR, 0, -2.6, 0);
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const em = new THREE.LineBasicMaterial({ color: '#1a2636', transparent: true, opacity: 0, fog: false });
    ghost.add(new THREE.LineSegments(lg, em)); this.scene.add(ghost);
    this.ghost = { g: ghost, fill: gm, edge: em };
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
    // the parachute: the pilot chute thrown out at the pull drifts off at its throw speed; the canopy spills half out
    const back = J.j.spine.localToWorld(this._v.set(0, 0.3, -0.22)).clone(), vis = u > 0;
    this.pc.m.visible = this.lines.visible = vis; this.wad.m.visible = u > 0.7;
    if (vis) {
      const pc = this.pc.m.position.set(-0.3 - 0.45 * u, 0.5 + 1.25 * u, 0.25 + 0.35 * u).add(back);
      this.pc.m.rotation.set(0.7 * Math.sin(u * 1.1), u * 0.6, 0.5 * Math.sin(u * 0.8)); this.pc.m.scale.setScalar(MathX.smooth(u, 0, 0.25)); this.pc.U.uT.value = u + 3;
      const ub = Math.max(0, u - 0.7), sw = MathX.smooth(ub, 0, 1.4);
      const wad = this.wad.m.position.set(0.35 * sw + 0.18 * ub, 0.25 + 0.55 * sw + 0.12 * ub, -0.05 + 0.4 * sw).add(back);
      this.wad.m.rotation.set(-1.2 + 0.25 * Math.sin(ub * 0.6), 0.5 + 0.12 * ub, 0.25 * Math.sin(ub * 0.7)); this.wad.m.scale.setScalar(0.25 + 0.3 * sw); this.wad.U.uT.value = ub;
      // lines: from his shoulders (risers) to the wad, 3 m long but slack (nothing pulls them); the bridle to the pilot chute
      const P = this.lines.geometry.attributes.position.array, sh = [J.j.la.sh, J.j.ra.sh].map((q) => q.getWorldPosition(new THREE.Vector3()));
      this.wad.m.updateMatrixWorld(true);
      let o = 0;
      const line = (a, b, slack, seed) => {
        let px = a.x, py = a.y, pz = a.z;
        for (let s = 1; s <= this.seg; s++) {
          const f = s / this.seg, bend = Math.sin(f * Math.PI) * slack;
          const x = a.x + (b.x - a.x) * f + bend * Math.sin(seed * 3 + u * 0.4 + f * 4), y = a.y + (b.y - a.y) * f + bend * 0.6 * Math.sin(seed * 5 + u * 0.3 + f * 3), z = a.z + (b.z - a.z) * f + bend * Math.cos(seed * 4 + u * 0.35 + f * 3.5);
          P.set([px, py, pz, x, y, z], o); o += 6; px = x; py = y; pz = z;
        }
      };
      for (let i = 0; i < 12; i++) {
        const e = u > 0.7 ? this.wad.m.localToWorld(this._t.set(-1.8 + (i % 6) * 0.72, -0.7 + (i >= 6 ? 0.9 : 0), 0)) : this._t.copy(back);
        const a = sh[i % 2], d = a.distanceTo(e);
        line(a, e, Math.sqrt(Math.max(0, 9 - d * d)) * 0.5 * MathX.smooth(u, 0.7, 1.3) + 0.06, i * 1.7);
      }
      const dp = back.distanceTo(pc); line(back, pc, Math.sqrt(Math.max(0, 6.25 - dp * dp)) * 0.5 + 0.1, 9.1);
      this.lines.geometry.attributes.position.needsUpdate = true;
    }
    // the ghost: in normal air the canopy would open above him (and he and it would slow: from here it falls away upwards)
    const gw = S - (NR.deploy + 0.35), Gh = this.ghost, ga = gw > 0 ? MathX.smooth(gw, 0, 0.3) * (1 - MathX.smooth(gw, 1.4, 1.9)) : 0;
    Gh.g.visible = ga > 0.001;
    if (Gh.g.visible) {
      const open = MathX.smooth(gw, 0, 0.45), up = 2.6 + 9 * Math.max(0, gw - 0.5) ** 2;
      Gh.g.position.set(J.root.position.x + 0.15, alt + up, J.root.position.z + 0.1); Gh.g.scale.set(0.25 + 0.75 * open, 0.6 + 0.4 * open, 0.25 + 0.75 * open); Gh.g.rotation.set(0, 0.5, 0.05);
      Gh.fill.opacity = 0.3 * ga; Gh.edge.opacity = 0.85 * ga;
    }
    // clouds rush up past
    this.puffs.begin(this.scene.fog);
    for (const [x, y, z, s, r, sh] of this.cl) { if (Math.abs(y - alt) > 900) continue; this.puffs.push(x, y, z, s, r, 0.72, sh, 1, 1, 1); }
    this.puffs.end();
    this._camera(S, alt);
  }

  // the camera falls with him: beside and below him (the sky), above him (the city), close on the pull, then wide
  _camera(S, alt) {
    const C = this.cam;
    // (always above or beside him, never swinging under: the city stays below)
    if (!this._k) this._k = {
      x: [[12.4, 3.2], [14.0, 3.6], [15.2, 2.2], [16.2, 2.4], [16.8, 4.4], [17.8, 5.0], [18.8, 5.0], [20.4, 4.6]],
      y: [[12.4, 2.4], [14.0, 2.8], [15.2, 4.2], [16.2, 3.8], [16.8, 0.4], [17.8, 0.2], [18.8, 1.0], [20.4, 1.0]],
      z: [[12.4, 2.6], [14.0, 2.4], [15.2, 2.4], [16.2, 2.0], [16.8, -2.6], [17.8, -3.4], [18.8, 2.8], [20.4, 2.6]],
      lx: [[12.4, 0], [14.0, 0], [15.2, 0], [16.2, 0], [16.8, 0], [17.8, 0.2], [18.8, 0.4], [20.4, 0.4]],
      ly: [[12.4, 0.3], [14.0, 0.1], [15.2, -2.2], [16.2, -2.4], [16.8, 1.6], [17.8, 2.2], [18.8, 1.2], [20.4, 1.1]],
      lz: [[12.4, -0.25], [14.0, -0.3], [15.2, -1.5], [16.2, -1.5], [16.8, 0.2], [17.8, 0.4], [18.8, 0.4], [20.4, 0.4]],
      fov: [[12.4, 60], [14.0, 62], [15.2, 66], [16.2, 66], [16.8, 66], [17.8, 68], [18.8, 62], [20.4, 58]],
    };
    const k = this._k, tr = (n) => (this['_t' + n] || (this['_t' + n] = new Track(k[n], 'inOutSine'))).value(S);
    C.position.set(tr('x'), alt + tr('y'), tr('z'));
    C.lookAt(tr('lx'), alt + tr('ly'), tr('lz'));
    C.rotation.z += 0.012 * Math.sin(S * 2.3) + 0.008 * noise1(S * 4, 81);
    const f = tr('fov'); if (Math.abs(C.fov - f) > 1e-3) { C.fov = f; C.updateProjectionMatrix(); }
    C.updateMatrixWorld(true);
  }
}
