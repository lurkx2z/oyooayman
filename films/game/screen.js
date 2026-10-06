/* =====================================================================
   SCREEN — effects on the SCREEN itself, after the world is rendered.
     GmRipple  a radial wave packet through an SVG displacement filter.
               On the canvas only it is a world effect (the glass under
               his palm); on the whole stage it bends everything — the
               picture, the HUD, the subtitles, the vignette — like a thin
               glass membrane (his palm on your screen)
     GmVoid    the backside of the simulation: wireframe rooms, bounding
               boxes, unused props, a camera frustum, light gizmos,
               half-loaded chunks, on black
     GmCrack   a crack fixed to the 9:16 frame: the picture is cut into
               shards (drawn from the world's render target); the middle
               ones fall away onto the void, with him still standing in it
               (he is rendered into the void pass on his own layer); at the
               reset they rise back, freeze, and snap home
     GmSafe    the platform safe zones and every touch target (?safe)
   ===================================================================== */

class GmRipple {
  constructor(id, target, { rings = 4.5, inner = 0.2 } = {}) {
    this.id = id; this.target = target;
    const S = 512, c = Tex.canvas(S, S), x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const dx = (i + 0.5) / S * 2 - 1, dy = (j + 0.5) / S * 2 - 1, r = Math.hypot(dx, dy), k = (j * S + i) * 4;
      const env = MathX.smooth(r, 0.0, inner) * (1 - MathX.smooth(r, 0.82, 1.0)) * (0.35 + 0.65 * MathX.smooth(r, 0.45, 0.8));
      const f = Math.sin(r * Math.PI * 2 * rings) * env, cx = r > 1e-4 ? dx / r : 0, cy = r > 1e-4 ? dy / r : 0;
      d[k] = 128 + 127 * f * cx; d[k + 1] = 128 + 127 * f * cy; d[k + 2] = 128; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    svg.innerHTML = `<filter id="${id}" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-color="rgb(128,128,128)" result="n"/><feImage class="w" preserveAspectRatio="none" result="w"/>
      <feMerge result="m0"><feMergeNode in="n"/><feMergeNode in="w"/></feMerge>
      <feImage class="k" x="0" y="0" preserveAspectRatio="none" result="k"/>
      <feComposite in="m0" in2="k" operator="arithmetic" k1="1" k2="0" k3="-0.5" k4="0.5" result="map"/>
      <feDisplacementMap class="d" in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    document.body.appendChild(svg);
    this.img = svg.querySelector('.w'); this.disp = svg.querySelector('.d'); this.mask = svg.querySelector('.k');
    const mc = Tex.canvas(128, 228), mx = mc.getContext('2d'), mi = mx.createImageData(128, 228);
    for (let j = 0; j < 228; j++) for (let i = 0; i < 128; i++) { const e = Math.min(i, 127 - i, Math.min(j, 227 - j) * 0.5625), v = 255 * MathX.smooth(e, 1, 9), k = (j * 128 + i) * 4; mi.data[k] = mi.data[k + 1] = mi.data[k + 2] = v; mi.data[k + 3] = 255; }
    mx.putImageData(mi, 0, 0); this.mask.setAttribute('href', mc.toDataURL('image/png'));
    this.img.setAttribute('href', c.toDataURL('image/png'));
    this.on = false;
  }
  // waves: [{ t0, x, y, R (design px the packet grows to), amp (design px), dur }]; the strongest active one is shown
  update(t, waves) {
    let best = null, bs = 0;
    for (const w of waves) { const u = t - w.t0; if (u < 0 || u > w.dur) continue; const s = w.amp * Math.exp(-u / (w.dur * 0.42)) * MathX.smooth(u, 0, 0.04); if (s > bs) { bs = s; best = w; } }
    const active = !!best && bs > 0.4;
    if (active !== this.on) { this.target.style.filter = active ? `url(#${this.id})` : ''; this.on = active; }
    if (!active) return;
    const W = this.target.clientWidth, H = this.target.clientHeight, U = H / 1920, u = t - best.t0;
    const cx = best.x * U, cy = best.y * U, R = (40 + best.R * Ease.outCubic(MathX.clamp(u / (best.dur * 0.92), 0, 1))) * U;
    this.mask.setAttribute('width', W); this.mask.setAttribute('height', H);
    this.img.setAttribute('x', (cx - R).toFixed(1)); this.img.setAttribute('y', (cy - R).toFixed(1));
    this.img.setAttribute('width', (2 * R).toFixed(1)); this.img.setAttribute('height', (2 * R).toFixed(1));
    this.disp.setAttribute('scale', (U * bs).toFixed(2));
  }
}

/* ---------------- the backside of the simulation ---------------- */
class GmVoid {
  constructor() {
    const s = new THREE.Scene(); s.background = new THREE.Color('#030405');
    const line = (c, o = 1) => new THREE.LineBasicMaterial({ color: c, transparent: o < 1, opacity: o });
    const grey = line('#8297aa', 0.6), dim = line('#465564', 0.55), yel = line('#ffd84a'), ora = line('#ff9b3d');
    const edges = (geo, mat, pos, rot = [0, 0, 0]) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), mat); l.position.set(...pos); l.rotation.set(...rot); s.add(l); return l; };
    const grid = new THREE.GridHelper(80, 80, '#3a4652', '#182027'); grid.position.set(1, -0.02, -16); s.add(grid);
    // the facility in outline: the hall, the corridor, the cell; a few rooms that were never finished
    const H = GF.hall, B = GF.corrB, C = GF.cell;
    edges(new THREE.BoxGeometry(H.x1 - H.x0, H.h, GF.corrB.z0 - H.z0), grey, [(H.x0 + H.x1) / 2, H.h / 2, (H.z0 + B.z0) / 2]);
    edges(new THREE.BoxGeometry(B.x1 - B.x0, B.h, C.z0 - B.z0), dim, [(B.x0 + B.x1) / 2, B.h / 2, (B.z0 + C.z0) / 2]);
    edges(new THREE.BoxGeometry(C.x1 - C.x0, C.h, C.z1 - C.z0), dim, [0, C.h / 2, (C.z0 + C.z1) / 2]);
    const rng = new RNG(4242);
    for (let i = 0; i < 14; i++) { const w = rng.range(3, 8), h = rng.range(2.5, 7), d = rng.range(3, 9); edges(new THREE.BoxGeometry(w, h, d), dim, [rng.range(-14, 16), h / 2 + rng.range(-1, 3), rng.range(-40, -14)], [0, rng.range(-0.4, 0.4), 0]); }
    // the core, in wire
    const core = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.CylinderGeometry(0.85, 0.85, H.h - 0.6, 16, 4, true)), grey); core.position.set(GF.core[0], H.h / 2, GF.core[1]); s.add(core);
    // floating unused props, each in a yellow bounding box
    this.float = [];
    const fl = (obj, pos, spin, box = true) => {
      const g = new THREE.Group(); g.add(obj); g.position.set(...pos); s.add(g);
      if (box) { const bb = new THREE.Box3().setFromObject(obj), hh = new THREE.Box3Helper(bb, '#ffd84a'); g.add(hh); }
      this.float.push({ g, pos, spin }); return g;
    };
    const wire = (geo, m = grey) => new THREE.LineSegments(new THREE.EdgesGeometry(geo, 15), m);
    const crate = new THREE.Group(); crate.add(wire(new THREE.BoxGeometry(0.8, 0.8, 0.8))); crate.add(wire(new THREE.BoxGeometry(0.6, 0.02, 0.82)));
    fl(crate, [-0.9, 1.4, -15.6], 0.3);
    const chair = new THREE.Group(); chair.add(wire(new THREE.BoxGeometry(0.45, 0.05, 0.45)).translateY(0.45)); chair.add(wire(new THREE.BoxGeometry(0.45, 0.5, 0.05)).translateY(0.72).translateZ(-0.2));
    for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) chair.add(wire(new THREE.BoxGeometry(0.04, 0.45, 0.04)).translateX(x).translateY(0.22).translateZ(z));
    fl(chair, [2.9, 0.9, -15.4], -0.25);
    const door = wire(new THREE.BoxGeometry(0.9, 2.1, 0.06)); fl(door, [-1.4, 2.6, -18.5], 0.12);
    const npc = new Person({ id: 'void', look: 'gmTech', states: [[0, 'idle']] }, null), tp = basePose();
    tp.lSh = [0, 1.5]; tp.rSh = [0, 1.5]; tp.lEl = 0; tp.rEl = 0; npc.apply(tp);
    const wf = new THREE.MeshBasicMaterial({ color: '#a6bccf', wireframe: true });
    npc.root.traverse((o) => { if (o.isMesh) o.material = wf; });
    fl(npc.root, [3.3, 0.3, -17.6], 0.25);
    const dr = new THREE.Group(); dr.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(0.25, 10, 6)), grey)); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; dr.add(wire(new THREE.TorusGeometry(0.12, 0.02, 4, 10)).translateX(Math.cos(a) * 0.36).translateZ(Math.sin(a) * 0.36).rotateX(Math.PI / 2)); }
    fl(dr, [0.0, 3.4, -16.4], 0.5);
    // half-loaded chunks: a wall and a floor patch with the missing-texture checker, triangles still arriving
    const cc = Tex.canvas(64, 64), cx = cc.getContext('2d');
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { cx.fillStyle = (i + j) % 2 ? '#0a0a0a' : '#c4169f'; cx.fillRect(i * 32, j * 32, 32, 32); }
    const ct = Tex.tex(cc); ct.magFilter = THREE.NearestFilter; ct.repeat.set(4, 3);
    const chunk = (w, h, pos, rot) => {
      const g = new THREE.PlaneGeometry(w, h, 8, 6).toNonIndexed(), P = g.attributes.position, keep = [];
      for (let i = 0; i < P.count; i += 3) if (rng.next() < 0.62) keep.push(i);
      const ng = new THREE.BufferGeometry(), pos2 = [], uv2 = [], U = g.attributes.uv;
      for (const i of keep) for (let k = 0; k < 3; k++) { pos2.push(P.getX(i + k), P.getY(i + k), P.getZ(i + k)); uv2.push(U.getX(i + k), U.getY(i + k)); }
      ng.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3)); ng.setAttribute('uv', new THREE.Float32BufferAttribute(uv2, 2));
      const m = new THREE.Mesh(ng, new THREE.MeshBasicMaterial({ map: ct, side: THREE.DoubleSide })); m.position.set(...pos); m.rotation.set(...rot); s.add(m);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), yel); e.position.set(...pos); e.rotation.set(...rot); s.add(e);
    };
    chunk(3.2, 2.4, [-2.6, 1.6, -17.0], [0, 0.5, 0]); chunk(2.4, 2.4, [4.0, 0.02, -15.6], [-Math.PI / 2, 0, 0.3]);
    // light gizmos
    for (const p of [[2.4, 3.6, -15.2], [-1.2, 4.2, -17.8], [1.07, 4.9, -19.6]]) {
      const g = new THREE.Group(); g.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.18, 0)), yel));
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(0.5, 0, 0), new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 0, -0.5), new THREE.Vector3(0, 0, 0.5)]), yel));
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1.6, 0)]), line('#ffd84a', 0.4)));
      fl(g, p, 0.6, false);
    }
    // a camera frustum floating behind him, pointed at you — the camera you are looking through, seen from outside
    const fr = new THREE.Group(), q = [new THREE.Vector3(-0.45, 0.8, -1.4), new THREE.Vector3(0.45, 0.8, -1.4), new THREE.Vector3(0.45, -0.8, -1.4), new THREE.Vector3(-0.45, -0.8, -1.4)], O = new THREE.Vector3();
    const pts = []; for (let i = 0; i < 4; i++) pts.push(O, q[i], q[i], q[(i + 1) % 4]);
    pts.push(new THREE.Vector3(-0.2, 0.88, -1.4), new THREE.Vector3(0, 1.1, -1.4), new THREE.Vector3(0, 1.1, -1.4), new THREE.Vector3(0.2, 0.88, -1.4));
    fr.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), ora));
    fr.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3, 0.22, 0.32)), ora));
    this.frustum = fl(fr, [-0.4, 2.3, -16.2], 0, false);
    // labels: tiny engine names next to things (sprites)
    const lab = (txt, pos) => { const c = Tex.canvas(512, 64), x = c.getContext('2d'); x.font = `600 34px ${'"JetBrains Mono", monospace'}`; x.fillStyle = '#ffd84a'; x.fillText(txt, 6, 44);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Tex.tex(c, { repeat: false }), transparent: true, depthWrite: false })); sp.scale.set(0.72, 0.09, 1); sp.position.set(...pos); sp.center.set(0, 0.5); s.add(sp); };
    lab('PROP_CRATE_02 · unused', [-0.6, 2.0, -15.6]); lab('NPC_TECH_01 · culled', [3.6, 2.4, -17.6]); lab('CAM_PLAYER · external', [-0.1, 3.3, -16.2]); lab('CHUNK_C3 · loading 62%', [-2.2, 3.0, -17.0]);
    // dust
    const dp = []; for (let i = 0; i < 500; i++) dp.push(rng.range(-8, 10), rng.range(0, 6), rng.range(-26, -12));
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
    s.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: '#7d8e9e', size: 0.025 })));
    // his light in here: cold, from the void
    this.scene = s;
  }
  update(t, cam) {
    for (const f of this.float) { f.g.position.set(f.pos[0], f.pos[1] + 0.2 * Math.sin(t * 0.9 + f.pos[0]), f.pos[2]); f.g.rotation.y = t * f.spin; }
    this.frustum.lookAt(cam.position); this.frustum.rotateY(Math.PI);
  }
}

/* ---------------- the crack ---------------- */
class GmCrack {
  constructor(app) {
    this.app = app; this.C = GM_TARGETS.crack;
    this._geometry();
    this.cv = document.createElement('canvas'); this.cv.className = 'gm-crack'; this.cv.width = 1080; this.cv.height = 1920;
    app.stage.appendChild(this.cv); this.ctx = this.cv.getContext('2d');
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(0, 1080, 0, -1920, -10, 10);
    this.void = new GmVoid();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1080, 1920), new THREE.ShaderMaterial({ uniforms: { tMap: { value: null } }, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tMap; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tMap, vUv).rgb, 1.0); }' }));
    bg.position.set(540, -960, -5); bg.renderOrder = 0; this.scene.add(bg); this.bg = bg;
    this.worldTex = { value: null };
    this.shards.forEach((S, i) => {
      const shape = new THREE.Shape(S.poly.map(([x, y]) => new THREE.Vector2(x - S.c[0], -(y - S.c[1]))));
      const g = new THREE.ShapeGeometry(shape), P = g.attributes.position, uv = new Float32Array(P.count * 2);
      for (let k = 0; k < P.count; k++) { uv[k * 2] = (P.getX(k) + S.c[0]) / 1080; uv[k * 2 + 1] = 1 - (S.c[1] - P.getY(k)) / 1920; }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const m = new THREE.ShaderMaterial({ uniforms: { tMap: this.worldTex, uShift: { value: new THREE.Vector2() }, uO: { value: 1 }, uDark: { value: 0 }, uEdge: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform sampler2D tMap; uniform vec2 uShift; uniform float uO, uDark, uEdge; varying vec2 vUv; void main(){ vec3 c = texture2D(tMap, vUv + uShift).rgb * (1.0 - uDark) * (1.0 - 0.04 * uEdge); gl_FragColor = vec4(c, uO); }' });
      const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 1 + i; this.scene.add(mesh);
      S.mesh = mesh; S.mat = m;
    });
    this.rt = null;
  }

  _geometry() {
    const rng = new RNG(9191), C = this.C, N = 12;
    const rings = [48, 120, 225, 360, 540, 780, 1100, 1600, 2300];
    this.rays = [];
    for (let i = 0; i < N; i++) {
      let a = (i / N) * Math.PI * 2 + rng.range(-0.16, 0.16), x = C.x, y = C.y, r = 0; const pts = [[x, y, 0]];
      while (r < 2400) { const st = rng.range(16, 44) * (1 + r / 900); a += rng.range(-0.2, 0.2) * (r < 120 ? 0.5 : 1); x += Math.cos(a) * st; y += Math.sin(a) * st; r = Math.hypot(x - C.x, y - C.y); pts.push([x, y, r]); }
      this.rays.push(pts);
    }
    const at = (ray, R) => { for (let k = 1; k < ray.length; k++) if (ray[k][2] >= R) { const a = ray[k - 1], b = ray[k], f = (R - a[2]) / (b[2] - a[2]); return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], k }; } return { p: ray[ray.length - 1], k: ray.length }; };
    this.ringSegs = []; const mid = {};
    rings.forEach((R, ri) => { for (let i = 0; i < N; i++) { const A = at(this.rays[i], R).p, B = at(this.rays[(i + 1) % N], R).p, m = [(A[0] + B[0]) / 2 + rng.range(-0.08, 0.08) * R * 0.3, (A[1] + B[1]) / 2 + rng.range(-0.08, 0.08) * R * 0.3]; mid[ri + ':' + i] = m; this.ringSegs.push({ R, pts: [A, m, B], show: ri < 4 || rng.next() < 0.8 }); } });
    this.shards = [];
    const Re = GM.reset;
    for (let ri = 0; ri < rings.length; ri++) for (let i = 0; i < N; i++) {
      const R0 = ri ? rings[ri - 1] : 0, R1 = rings[ri], ra = this.rays[i], rb = this.rays[(i + 1) % N], poly = [];
      const a0 = R0 ? at(ra, R0) : { p: [C.x, C.y], k: 1 }, a1 = at(ra, R1), b0 = R0 ? at(rb, R0) : { p: [C.x, C.y], k: 1 }, b1 = at(rb, R1);
      poly.push(a0.p); for (let k = a0.k; k < a1.k; k++) poly.push([ra[k][0], ra[k][1]]); poly.push(a1.p); poly.push(mid[ri + ':' + i]); poly.push(b1.p);
      for (let k = b1.k - 1; k >= b0.k; k--) poly.push([rb[k][0], rb[k][1]]); poly.push(b0.p); if (R0) poly.push(mid[(ri - 1) + ':' + i]);
      const c = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]);
      // the middle falls away (a hole round the impact), the outside stays cracked
      const falls = ri <= 4 || (ri === 5 && rng.next() < 0.45);
      const fall = Re.shatter[0] + (ri / 5) * (Re.shatter[1] - Re.shatter[0] - 0.35) + rng.range(-0.08, 0.12);
      this.shards.push({ poly, c, ri, falls, fall, spin: rng.range(-2.4, 2.4), drift: rng.range(-140, 140), shift: [rng.range(-1.8, 1.8) / 1080, rng.range(-1.8, 1.8) / 1920] });
    }
  }
  // how far the crack has run (px from the impact)
  reach(t) {
    const Re = GM.reset, R = GM.reach; if (t < Re.hit || t >= R.cancelled + 0.6) return 0;
    let g = 380 * MathX.smooth(t, Re.hit, Re.hit + 0.06);
    g = Math.max(g, MathX.lerp(380, 2400, Ease.outCubic(MathX.clamp((t - Re.shatter[0] + 0.15) / 0.5, 0, 1))) * (t >= Re.shatter[0] - 0.15 ? 1 : 0));
    return g * (1 - MathX.smooth(t, R.cancelled, R.cancelled + 0.55));
  }
  active(t) { return t >= GM.reset.hit && t < GM.reach.cancelled + 0.6; }
  // 0 in place … 1 gone. RESET—: they rise back toward the frame; OVERRIDE: they hang, shaking; CANCELLED: home
  fallOf(S, t) {
    if (!S.falls) return 0;
    const R = GM.reach; let f = MathX.clamp((t - S.fall) / 0.85, 0, 1);
    if (t >= R.glitch[0]) {
      const back = MathX.smooth(t, R.glitch[0] + 0.05, R.override) * 0.55;            // the reset pulls them back
      const hang = t >= R.override && t < R.cancelled ? 0.02 * Math.sin(t * 60 + S.ri) : 0;
      const home = MathX.smooth(t, R.cancelled, R.cancelled + 0.45);
      f = (f * (1 - back) + hang) * (1 - home);
    }
    return MathX.clamp(f, 0, 1);
  }

  update(t) {
    const g = this.reach(t), x = this.ctx, C = this.C;
    x.clearRect(0, 0, 1080, 1920);
    this.cv.style.display = g > 0 ? 'block' : 'none';
    if (g <= 0) return;
    const draw = (pts, w) => { x.beginPath(); let st = false; for (const p of pts) { const r = Math.hypot(p[0] - C.x, p[1] - C.y); if (r > g) break; if (!st) { x.moveTo(p[0], p[1]); st = true; } else x.lineTo(p[0], p[1]); } x.lineWidth = w; x.stroke(); };
    const fade = 1 - MathX.smooth(t, GM.reset.shatter[1] - 0.1, GM.reset.shatter[1] + 0.5) * 0.6;
    for (const [col, w] of [['rgba(8,10,12,0.6)', 4.4], ['rgba(236,243,250,0.92)', 1.6]]) {
      x.strokeStyle = col; x.globalAlpha = fade;
      for (const ray of this.rays) draw(ray, w);
      for (const s of this.ringSegs) if (s.show && s.R < g) draw(s.pts, w * 0.8);
    }
    x.globalAlpha = 1;
    const k = MathX.smooth(t, GM.reset.hit, GM.reset.hit + 0.04) * (1 - MathX.smooth(t, GM.reset.shatter[0], GM.reset.shatter[1]));
    const gr = x.createRadialGradient(C.x, C.y, 0, C.x, C.y, 70); gr.addColorStop(0, `rgba(255,255,255,${0.6 * k})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(C.x - 70, C.y - 70, 140, 140);
  }

  // the world into one target; the void and him (layer 1) into another; place the shards
  render(t, app) {
    const R = app.renderer, size = R.getDrawingBufferSize(new THREE.Vector2());
    if (!this.rt || this.rt.width !== size.x || this.rt.height !== size.y) {
      if (this.rt) { this.rt.dispose(); this.vrt.dispose(); }
      this.rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: CONFIG.render.msaa });
      this.vrt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: CONFIG.render.msaa });
    }
    R.setRenderTarget(this.rt); R.render(app.scene, app.camera);
    this.void.update(t, app.camera);
    R.setRenderTarget(this.vrt); R.render(this.void.scene, app.camera);
    // him, alone, lit by the same lights, over the void (the world's shadow maps are reused)
    const cam = app.camera, ac = R.autoClear, su = R.shadowMap.autoUpdate;
    R.autoClear = false; R.shadowMap.autoUpdate = false; cam.layers.set(1);
    R.render(app.scene, cam);
    cam.layers.set(0); R.autoClear = ac; R.shadowMap.autoUpdate = su;
    R.setRenderTarget(null);
    this.worldTex.value = this.rt.texture; this.bg.material.uniforms.tMap.value = this.vrt.texture;
    const g = this.reach(t);
    for (const S of this.shards) {
      const f = this.fallOf(S, t), m = S.mesh, d = Math.hypot(S.c[0] - this.C.x, S.c[1] - this.C.y), crack = MathX.smooth(g, d * 0.6, d);
      m.position.set(S.c[0] + S.drift * f * f, -(S.c[1] + 2400 * f * f), 0);
      m.rotation.z = S.spin * f; m.scale.setScalar(1 - 0.25 * f);
      S.mat.uniforms.uO.value = 1 - MathX.smooth(f, 0.6, 1); S.mat.uniforms.uDark.value = 0.4 * f;
      S.mat.uniforms.uShift.value.set(S.shift[0] * crack, S.shift[1] * crack); S.mat.uniforms.uEdge.value = crack * (1 - f);
      m.visible = f < 0.999;
    }
  }
}

/* ---------------- safe zones and targets (?safe) ---------------- */
class GmSafe {
  constructor(hud) {
    const d = document.createElement('div'); d.className = 'gm-safe'; hud.appendChild(d);
    const Z = GM_SAFE, T = GM_TARGETS;
    d.innerHTML = `<svg viewBox="0 0 1080 1920" preserveAspectRatio="none">
      <rect x="0" y="0" width="1080" height="${Z.top}" class="z"/><rect x="${Z.right}" y="${Z.rightY[0]}" width="${1080 - Z.right}" height="${Z.rightY[1] - Z.rightY[0]}" class="z"/>
      <rect x="0" y="${Z.bottom}" width="1080" height="${1920 - Z.bottom}" class="z"/>
      <rect x="60" y="220" width="840" height="1220" class="ok"/>
      ${Object.entries(T).map(([k, p]) => `<circle cx="${p.x}" cy="${p.y}" r="70" class="t"/><text x="${p.x + 80}" y="${p.y + 10}" class="l">${k} (${p.x}, ${p.y})</text>`).join('')}
      <text x="20" y="120" class="l">PLATFORM TOP BAR</text><text x="${Z.right + 8}" y="${Z.rightY[0] + 40}" class="l">BUTTONS</text><text x="20" y="${Z.bottom + 60}" class="l">CAPTION / USER / PROGRESS</text></svg>`;
  }
}
