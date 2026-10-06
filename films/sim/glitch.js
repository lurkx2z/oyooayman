/* =====================================================================
   GLITCH — the simulation showing through, and the fourth wall going.
     SxWire     the wireframe that spreads from your fingers over the wall
     SxLabels   engine debug labels with bounding boxes (yellow)
     SxBreaks   the LOD pop, the tree that turns into a flat card, the
                facade that loses its texture (checker) — all repaired later
     SxRipple   the whole picture (HUD and captions too) ripples like a
                membrane when his fingertip taps the lens: an SVG
                displacement filter on the stage
     SxCrack    the crack in the picture itself: the frame is cut into
                shards (drawn from the world's render target) over the
                void (SxVoid, rendered with the same camera); the crack
                lines are drawn over the interface too
   ===================================================================== */

/* ---------------- the wireframe on the wall ---------------- */
class SxWire {
  constructor(scene) {
    const W = SX_CITY.wall, h = 22, w = W.z1 - W.z0;
    this.u = { uP: { value: new THREE.Vector2() }, uR: { value: 0 }, uA: { value: 0 }, uCell: { value: 0.16 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform vec2 uP; uniform float uR, uA, uCell; varying vec2 vP;
        float lineAA(float d, float w){ float f = fwidth(d); return 1.0 - smoothstep(w * f, (w + 1.2) * f, d); }
        void main(){
          vec2 g = vP / uCell, f = fract(g);
          float dx = min(f.x, 1.0 - f.x), dy = min(f.y, 1.0 - f.y), dd = abs(f.x - f.y) * 0.7071;
          float l = max(max(lineAA(dx, 0.6), lineAA(dy, 0.6)), lineAA(dd, 0.5) * 0.8);
          vec2 v = abs(f - 0.5);
          float pt = 1.0 - smoothstep(0.42, 0.47, max(v.x, v.y)) * 0.0;
          float r = length(vP - uP);
          float front = smoothstep(uR, uR - 0.35, r) * (0.55 + 0.45 * smoothstep(uR - 1.2, uR - 0.1, r));
          float a = l * front * uA * pt;
          gl_FragColor = vec4(vec3(0.62, 0.86, 1.0) * a * 1.6, a);
        }`,
    });
    const g = new THREE.PlaneGeometry(w, h);
    this.m = new THREE.Mesh(g, mat);
    this.m.rotation.y = -Math.PI / 2;                                   // faces −X (toward the street)
    this.m.position.set(LAYOUT.frontage - 0.015, h / 2, (W.z0 + W.z1) / 2);
    this.m.renderOrder = 5; this.m.frustumCulled = false;
    scene.add(this.m);
    this.zc = (W.z0 + W.z1) / 2; this.h = h;
  }
  // a touch: the grid runs out from the fingers for ~0.45 s
  update(t) {
    const A = SX.wall, P = A.p;
    let a = 0, r = 0;
    for (const [t0, big] of [[A.touch, 1], [A.again, 0.55]]) {
      const u = t - t0;
      if (u < 0 || u > 0.6) continue;
      r = Math.max(r, (0.4 + 26 * u * u + 6 * u) * big); a = Math.max(a, MathX.smooth(u, 0, 0.03) * (1 - MathX.smooth(u, 0.42, 0.6)));
    }
    this.m.visible = a > 0.001;
    // plane-local coordinates: x runs along −z (after the turn), y up from the plane's centre
    this.u.uP.value.set(-(P[2] - this.zc), P[1] - this.h / 2);
    this.u.uR.value = r; this.u.uA.value = a;
  }
}

/* ---------------- debug labels ---------------- */
class SxLabels {
  constructor(hud) {
    const NS = 'http://www.w3.org/2000/svg';
    this.root = document.createElement('div'); this.root.className = 'sx-dbg'; hud.appendChild(this.root);
    this.svg = document.createElementNS(NS, 'svg'); this.svg.setAttribute('viewBox', '0 0 1080 1920'); this.svg.setAttribute('preserveAspectRatio', 'none');
    this.root.appendChild(this.svg);
    this.items = [
      { name: 'TREE_07', sub: 'static_mesh · LOD0', t0: 29.6 },
      { name: 'NPC_CIVILIAN_14', sub: 'agent · WALK → WAIT', t0: 30.0 },
      { name: 'SKY_ENV_02', sub: 'env_dome · hdr', t0: 30.45, screen: [540, 120, 1010, 470] },
      { name: 'VEHICLE_SEDAN_03', sub: 'vehicle · 4.5 m/s', t0: 30.9 },
    ].map((it) => {
      it.path = document.createElementNS(NS, 'path'); this.svg.appendChild(it.path);
      it.el = document.createElement('div'); it.el.className = 'sx-tag'; it.el.innerHTML = `<b>${it.name}</b><span>${it.sub}</span>`; this.root.appendChild(it.el);
      return it;
    });
    this.box = new THREE.Box3(); this.c = Array.from({ length: 8 }, () => new THREE.Vector3());
  }
  _boxOf(name, app) {
    const B = this.box;
    if (name === 'TREE_07') return B.setFromObject(app.env.tree07);
    if (name === 'NPC_CIVILIAN_14') return B.setFromObject(app.people.byId.B2.root);
    if (name === 'VEHICLE_SEDAN_03') return app.traffic.box('red', B);
    return null;
  }
  update(t, app) {
    const on = t >= SX.labels[0] && t < SX.labels[1];
    this.root.style.display = on ? 'block' : 'none';
    if (!on) return;
    const cam = app.camera, fr = Math.floor(t * 30);
    for (const it of this.items) {
      const vis = t >= it.t0 && !(t - it.t0 < 0.12 && fr % 2 === 1);
      it.path.style.display = it.el.style.display = vis ? '' : 'none';
      if (!vis) continue;
      let x0, y0, d = '';
      if (it.screen) {
        const [a, b, c, e] = it.screen, k = 40;
        d = `M${a} ${b + k}V${b}H${a + k}M${c - k} ${b}H${c}V${b + k}M${c} ${e - k}V${e}H${c - k}M${a + k} ${e}H${a}V${e - k}`;
        x0 = a; y0 = b;
      } else {
        const B = this._boxOf(it.name, app);
        if (!B || B.isEmpty()) { it.path.style.display = it.el.style.display = 'none'; continue; }
        const P = this.c; let bad = false;
        for (let i = 0; i < 8; i++) {
          P[i].set(i & 1 ? B.max.x : B.min.x, i & 2 ? B.max.y : B.min.y, i & 4 ? B.max.z : B.min.z).project(cam);
          if (P[i].z > 1) bad = true;
          P[i].set((P[i].x + 1) * 540, (1 - P[i].y) * 960, 0);
        }
        if (bad) { it.path.style.display = it.el.style.display = 'none'; continue; }
        for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) d += `M${P[a].x.toFixed(1)} ${P[a].y.toFixed(1)}L${P[b].x.toFixed(1)} ${P[b].y.toFixed(1)}`;
        x0 = Math.min(...P.map((p) => p.x)); y0 = Math.min(...P.map((p) => p.y));
      }
      it.path.setAttribute('d', d);
      it.el.style.left = `calc(var(--u) * ${MathX.clamp(x0, 10, 760).toFixed(1)})`;
      it.el.style.top = `calc(var(--u) * ${MathX.clamp(y0 - 64, 10, 1800).toFixed(1)})`;
    }
  }
}

/* ---------------- breaks: the LOD pop, the flat tree, the checker facade ---------------- */
class SxBreaks {
  constructor(app) {
    const scene = app.scene;
    // a crude low-detail copy of the parked car
    const L = app.traffic.lodCar, m = new THREE.MeshLambertMaterial({ color: '#7d8b96', flatShading: true }), k = new THREE.MeshLambertMaterial({ color: '#1c1d1f', flatShading: true });
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.75, 1.8), m); body.position.y = 0.68; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.55, 1.6), m); cab.position.set(-0.2, 1.3, 0); g.add(cab);
    for (const [x, z] of [[-1.4, 0.8], [1.4, 0.8], [-1.4, -0.8], [1.4, -0.8]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 6), k); w.rotation.x = Math.PI / 2; w.position.set(x, 0.33, z); g.add(w); }
    g.position.copy(L.v.group.position); g.rotation.copy(L.v.group.rotation); g.visible = false;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g); this.lod = g; this.lodReal = L.v.group;
    // the flat tree: a painted card that always turns to face you
    const c = Tex.canvas(256, 320), x = c.getContext('2d');
    x.fillStyle = '#4b3a2c'; x.fillRect(118, 170, 20, 150);
    const blobs = [[128, 120, 92], [72, 150, 58], [184, 146, 62], [128, 62, 62], [96, 92, 50], [164, 88, 52]];
    for (const [bx, by, r] of blobs) { x.fillStyle = '#34452a'; x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill(); }
    for (const [bx, by, r] of blobs) { x.fillStyle = '#4f6338'; x.beginPath(); x.arc(bx - r * 0.25, by - r * 0.3, r * 0.55, 0, 7); x.fill(); }
    const card = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 6.25), new THREE.MeshBasicMaterial({ map: Tex.tex(c, { repeat: false }), alphaTest: 0.5, side: THREE.DoubleSide }));
    card.geometry.translate(0, 3.125, 0);
    card.position.copy(app.env.tree07Pos); card.visible = false; scene.add(card); this.card = card;
    // the checker: the upper facade of the cream building across the street
    const C = SX_CITY.checker, H = 4.4 + C.floors * FACADE_STYLES[C.style].floorH;
    const cc = Tex.canvas(64, 64), cx = cc.getContext('2d');
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { cx.fillStyle = (i + j) % 2 ? '#0a0a0a' : '#ff00dc'; cx.fillRect(i * 32, j * 32, 32, 32); }
    const ct = Tex.tex(cc); ct.magFilter = THREE.NearestFilter; ct.minFilter = THREE.NearestFilter; ct.generateMipmaps = false;
    const w = C.z1 - C.z0, hh = H - 4.4;
    ct.repeat.set(w / 1.6, hh / 1.6);
    const chk = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.1, hh + 0.05), new THREE.MeshBasicMaterial({ map: ct, fog: true }));
    chk.rotation.y = Math.PI / 2; chk.position.set(-LAYOUT.frontage + 0.06, 4.4 + hh / 2, (C.z0 + C.z1) / 2); chk.visible = false;
    scene.add(chk); this.chk = chk;
    this.env = app.env;
  }
  update(t, cam) {
    const B = SX.brk, live = t < SX.repair;
    const lod = live && ((t >= B.lod && t < B.lod + 0.1) || (t >= B.lod + 0.17 && t < B.lod + 0.52));
    this.lod.visible = lod; this.lodReal.visible = !lod;
    const flat = live && t >= B.tree;
    this.card.visible = flat; this.env.tree07.visible = !flat;
    if (flat) this.card.rotation.y = Math.atan2(cam.position.x - this.card.position.x, cam.position.z - this.card.position.z);
    this.chk.visible = live && t >= B.checker;
  }
}

/* ---------------- the ripple (an SVG displacement over the whole stage) ---------------- */
class SxRipple {
  constructor(stage) {
    this.stage = stage;
    // a radial wave packet: R and G push pixels outward / inward along the radius; mid-grey (neutral) outside
    const S = 512, c = Tex.canvas(S, S), x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const dx = (i + 0.5) / S * 2 - 1, dy = (j + 0.5) / S * 2 - 1, r = Math.hypot(dx, dy), k = (j * S + i) * 4;
      const env = MathX.smooth(r, 0.0, 0.2) * (1 - MathX.smooth(r, 0.82, 1.0)) * (0.35 + 0.65 * MathX.smooth(r, 0.45, 0.8));
      const f = Math.sin(r * Math.PI * 2 * 4.5) * env, cx = r > 1e-4 ? dx / r : 0, cy = r > 1e-4 ? dy / r : 0;
      d[k] = 128 + 127 * f * cx; d[k + 1] = 128 + 127 * f * cy; d[k + 2] = 128; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    svg.innerHTML = `<filter id="sxRipple" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-color="rgb(128,128,128)" result="n"/>
      <feImage id="sxRippleImg" preserveAspectRatio="none" result="w"/>
      <feMerge result="m0"><feMergeNode in="n"/><feMergeNode in="w"/></feMerge>
      <feImage id="sxRippleMask" x="0" y="0" preserveAspectRatio="none" result="k"/>
      <feComposite in="m0" in2="k" operator="arithmetic" k1="1" k2="0" k3="-0.5" k4="0.5" result="map"/>
      <feDisplacementMap id="sxRippleDisp" in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    document.body.appendChild(svg);
    this.img = svg.querySelector('#sxRippleImg'); this.disp = svg.querySelector('#sxRippleDisp'); this.mask = svg.querySelector('#sxRippleMask');
    const mc = Tex.canvas(128, 228), mx = mc.getContext('2d'), mi = mx.createImageData(128, 228);
    for (let j = 0; j < 228; j++) for (let i = 0; i < 128; i++) { const e = Math.min(i, 127 - i, Math.min(j, 227 - j) * 0.5625), v = 255 * MathX.smooth(e, 1, 9), k = (j * 128 + i) * 4; mi.data[k] = mi.data[k + 1] = mi.data[k + 2] = v; mi.data[k + 3] = 255; }
    mx.putImageData(mi, 0, 0); this.mask.setAttribute('href', mc.toDataURL('image/png'));
    this.url = c.toDataURL('image/png');
    this.img.setAttribute('href', this.url);
    this.ready = new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = this.url; });
    this.on = false;
  }
  // centre in stage fractions; the packet expands from the touch and dies away
  update(t) {
    const u = t - SX.tap, active = u >= 0 && u < 1.7;
    if (active !== this.on) { this.stage.style.filter = active ? 'url(#sxRipple)' : ''; this.on = active; }
    if (!active) return;
    const W = this.stage.clientWidth, H = this.stage.clientHeight, U = H / 1920;
    const cx = W * (SX_TAP_NDC.x + 1) / 2, cy = H * (1 - SX_TAP_NDC.y) / 2;
    const R = (50 + 1900 * Ease.outCubic(MathX.clamp(u / 1.6, 0, 1))) * U;
    this.mask.setAttribute('width', W); this.mask.setAttribute('height', H);
    this.img.setAttribute('x', (cx - R).toFixed(1)); this.img.setAttribute('y', (cy - R).toFixed(1));
    this.img.setAttribute('width', (2 * R).toFixed(1)); this.img.setAttribute('height', (2 * R).toFixed(1));
    this.disp.setAttribute('scale', (U * 170 * Math.exp(-u / 0.75) * MathX.smooth(u, 0, 0.04)).toFixed(2));
  }
}
const SX_TAP_NDC = { x: 0.42, y: -0.42 };

/* ---------------- the void behind the picture ---------------- */
class SxVoid {
  constructor(app) {
    const s = new THREE.Scene(); s.background = new THREE.Color('#030405');
    const line = (c, o = 1) => new THREE.LineBasicMaterial({ color: c, transparent: o < 1, opacity: o });
    const grey = line('#7f93a6', 0.55), dim = line('#4a5866', 0.5), yel = line('#ffd84a'), ora = line('#ff9b3d');
    const edges = (geo, mat, pos, rot = [0, 0, 0]) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), mat); l.position.set(...pos); l.rotation.set(...rot); s.add(l); return l; };
    // a floor grid, the street's blocks in outline
    const grid = new THREE.GridHelper(260, 130, '#3a4652', '#1d252c'); grid.position.set(10, 0, -60); s.add(grid);
    const rng = new RNG(9090);
    for (const side of [-1, 1]) for (let z = 10; z > -200; z -= rng.range(9, 16)) {
      const h = rng.range(10, 28), w = rng.range(8, 14);
      edges(new THREE.BoxGeometry(14, h, w * 0.92), z > -60 ? grey : dim, [side * 19.5 + 4, h / 2, z - w / 2]);
    }
    // floating assets, each in a yellow bounding box
    this.float = [];
    const fl = (obj, pos, spin, box = true) => {
      const g = new THREE.Group(); g.add(obj); g.position.set(...pos); s.add(g);
      if (box) { const bb = new THREE.Box3().setFromObject(obj), h = new THREE.Box3Helper(bb, '#ffd84a'); g.add(h); }
      this.float.push({ g, pos, spin }); return g;
    };
    const car = new VehicleFactory().build('sedan', '#ffffff'), carL = new THREE.Group();
    car.group.traverse((o) => { if (o.isMesh) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), grey); o.updateWorldMatrix(true, false); l.applyMatrix4(o.matrixWorld); carL.add(l); } });
    fl(carL, [5.5, 3.2, -24], 0.25);
    const tree = new THREE.Group();
    tree.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.15, 0.2, 3, 7)), grey).translateY(1.5));
    for (const [x, y, z, r] of [[0, 3.6, 0, 1.5], [0.9, 3.2, 0.4, 1.1], [-0.8, 3.3, -0.3, 1.1]]) { const w = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(r, 1)), grey); w.position.set(x, y, z); tree.add(w); }
    fl(tree, [15.5, 2.0, -27], 0.18);
    const npc = new Person({ id: 'void', look: 'casual1', states: [[0, 'idle']] }, null), tp = basePose();
    tp.lSh = [0, 1.5]; tp.rSh = [0, 1.5]; tp.lEl = 0; tp.rEl = 0; npc.apply(tp);
    const wf = new THREE.MeshBasicMaterial({ color: '#9fb4c8', wireframe: true });
    npc.root.traverse((o) => { if (o.isMesh) o.material = wf; });
    fl(npc.root, [12.2, 0.6, -19.5], 0.3);
    // light gizmos: a sun (circle + rays) and two point lights (small spheres + axes)
    const sun = new THREE.Group();
    sun.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 24 }, (_, i) => new THREE.Vector3(Math.cos(i / 24 * 6.283), Math.sin(i / 24 * 6.283), 0))), yel));
    const rays = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; rays.push(new THREE.Vector3(Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0), new THREE.Vector3(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0)); }
    sun.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rays), yel));
    sun.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.5, -4, 3)]), yel));
    fl(sun, [3.5, 11, -34], 0.0, false);
    for (const p of [[17, 6.5, -22], [7.5, 5.2, -16.5]]) {
      const g = new THREE.Group(); g.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.25, 0)), yel));
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.6, 0, 0), new THREE.Vector3(0.6, 0, 0), new THREE.Vector3(0, -0.6, 0), new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0, 0, -0.6), new THREE.Vector3(0, 0, 0.6)]), yel));
      fl(g, p, 0.6, false);
    }
    // a camera frustum, floating, pointed back at you
    const fr = new THREE.Group(), q = [new THREE.Vector3(-0.9, 1.6, -2.4), new THREE.Vector3(0.9, 1.6, -2.4), new THREE.Vector3(0.9, -1.6, -2.4), new THREE.Vector3(-0.9, -1.6, -2.4)], O = new THREE.Vector3();
    const pts = []; for (let i = 0; i < 4; i++) pts.push(O, q[i], q[i], q[(i + 1) % 4]);
    pts.push(new THREE.Vector3(-0.35, 1.75, -2.4), new THREE.Vector3(0, 2.1, -2.4), new THREE.Vector3(0, 2.1, -2.4), new THREE.Vector3(0.35, 1.75, -2.4));
    fr.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), ora));
    fr.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.36, 0.5)), ora));
    this.frustum = fl(fr, [13.6, 3.0, -21.5], 0.0, false);
    // particles of dust: tiny points drifting
    const dp = []; for (let i = 0; i < 400; i++) dp.push(rng.range(-10, 30), rng.range(0, 14), rng.range(-80, -12));
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
    s.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: '#6f8090', size: 0.05 })));
    this.scene = s;
  }
  update(t, cam) {
    for (const f of this.float) {
      f.g.position.set(f.pos[0], f.pos[1] + 0.25 * Math.sin(t * 0.9 + f.pos[0]), f.pos[2]);
      f.g.rotation.y = t * f.spin;
    }
    this.frustum.lookAt(cam.position);
    this.frustum.rotateY(Math.PI);
  }
}

/* ---------------- the crack ---------------- */
const SX_CRACK = { x: 590, y: 930 };       // the impact, in design pixels (1080 × 1920)
class SxCrack {
  constructor(app) {
    this.app = app;
    this._geometry();
    // the overlay: crack lines over everything (also over the interface)
    this.cv = document.createElement('canvas'); this.cv.className = 'sx-crack'; this.cv.width = 1080; this.cv.height = 1920;
    app.stage.appendChild(this.cv); this.ctx = this.cv.getContext('2d');
    // the composite: shards of the world's picture over the void
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(0, 1080, 0, -1920, -10, 10);
    this.void = new SxVoid(app);
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
      const m = new THREE.ShaderMaterial({ uniforms: { tMap: this.worldTex, uShift: { value: new THREE.Vector2() }, uO: { value: 1 }, uDark: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform sampler2D tMap; uniform vec2 uShift; uniform float uO, uDark; varying vec2 vUv; void main(){ vec3 c = texture2D(tMap, vUv + uShift).rgb * (1.0 - uDark); gl_FragColor = vec4(c, uO); }' });
      const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 1 + i; this.scene.add(mesh);
      S.mesh = mesh; S.mat = m;
    });
    this.rt = null;
  }

  // the pattern: jagged rays from the impact, rings between them (a spider web); the cells between are the shards
  _geometry() {
    const rng = new RNG(6767), C = SX_CRACK, N = 11;
    const rings = [52, 130, 245, 400, 600, 860, 1200, 1700, 2400];
    this.rays = [];
    for (let i = 0; i < N; i++) {
      let a = (i / N) * Math.PI * 2 + rng.range(-0.18, 0.18), x = C.x, y = C.y, r = 0;
      const pts = [[x, y, 0]];
      while (r < 2500) { const st = rng.range(18, 48) * (1 + r / 900); a += rng.range(-0.22, 0.22) * (r < 120 ? 0.5 : 1); x += Math.cos(a) * st; y += Math.sin(a) * st; r = Math.hypot(x - C.x, y - C.y); pts.push([x, y, r]); }
      this.rays.push(pts);
    }
    // where each ray crosses each ring
    const at = (ray, R) => { for (let k = 1; k < ray.length; k++) if (ray[k][2] >= R) { const a = ray[k - 1], b = ray[k], f = (R - a[2]) / (b[2] - a[2]); return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], k }; } return { p: ray[ray.length - 1], k: ray.length }; };
    this.ringSegs = [];
    const ringMid = {};
    rings.forEach((R, ri) => {
      for (let i = 0; i < N; i++) {
        const A = at(this.rays[i], R).p, B = at(this.rays[(i + 1) % N], R).p;
        const m = [(A[0] + B[0]) / 2 + rng.range(-0.08, 0.08) * R * 0.3, (A[1] + B[1]) / 2 + rng.range(-0.08, 0.08) * R * 0.3];
        ringMid[ri + ':' + i] = m;
        this.ringSegs.push({ R, pts: [A, m, B], ri, show: ri < 4 || rng.next() < 0.85 });
      }
    });
    // shards: cell (ray i, ray i+1) between ring r−1 and ring r (the innermost cells reach the impact)
    this.shards = [];
    for (let ri = 0; ri < rings.length; ri++) for (let i = 0; i < N; i++) {
      const R0 = ri ? rings[ri - 1] : 0, R1 = rings[ri], ra = this.rays[i], rb = this.rays[(i + 1) % N];
      const poly = [];
      const a0 = R0 ? at(ra, R0) : { p: [C.x, C.y], k: 1 }, a1 = at(ra, R1), b0 = R0 ? at(rb, R0) : { p: [C.x, C.y], k: 1 }, b1 = at(rb, R1);
      poly.push(a0.p); for (let k = a0.k; k < a1.k; k++) poly.push([ra[k][0], ra[k][1]]); poly.push(a1.p);
      poly.push(ringMid[ri + ':' + i]); poly.push(b1.p);
      for (let k = b1.k - 1; k >= b0.k; k--) poly.push([rb[k][0], rb[k][1]]); poly.push(b0.p);
      if (R0) poly.push(ringMid[(ri - 1) + ':' + i]);
      const c = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]);
      // outer shards go first, the middle (where he is) last
      const fall = SX.shatter[1] + (1 - MathX.clamp(ri / 5, 0, 1)) * (SX.shatter[2] - SX.shatter[1] - 0.25) + rng.range(-0.15, 0.15);
      this.shards.push({ poly, c, ri, fall, spin: rng.range(-2.2, 2.2), drift: rng.range(-120, 120), shift: [rng.range(-1.6, 1.6) / 1080, rng.range(-1.6, 1.6) / 1920] });
    }
  }

  // how far the crack has spread (px from the impact); 0 = none
  reach(t) {
    if (t < SX.hit || t >= SX.white[1]) return 0;
    let g = 420 * MathX.smooth(t, SX.hit, SX.hit + 0.07);
    g = Math.max(g, MathX.lerp(420, 2500, Ease.outCubic(MathX.clamp((t - SX.shatter[0]) / (SX.shatter[1] - SX.shatter[0]), 0, 1))) * (t >= SX.shatter[0] ? 1 : 0));
    if (t > SX.rewind[0]) g *= 1 - MathX.smooth(t, SX.rewind[0] + 0.3, SX.rewind[1] - 0.1);
    return g;
  }
  active(t) { return t >= SX.hit && t < SX.white[1]; }
  // a shard's fall (0 in place … 1 gone); at the reset they fly back
  fallOf(S, t) {
    let f = MathX.clamp((t - S.fall) / 0.9, 0, 1);
    if (t > SX.rewind[0]) { const back = MathX.smooth(t, SX.rewind[0] + 0.15 + (1 - S.ri / 9) * 0.3, SX.rewind[1] - 0.15); f = Math.min(f, 1 - back); }
    return f;
  }

  update(t) {
    const g = this.reach(t), x = this.ctx;
    x.clearRect(0, 0, 1080, 1920);
    this.cv.style.display = g > 0 ? 'block' : 'none';
    if (g <= 0) return;
    // lines: a dark core with a bright edge (glass), only as far as the crack has run, not across shards that have gone
    const draw = (pts, w) => { x.beginPath(); let started = false; for (const p of pts) { const r = Math.hypot(p[0] - SX_CRACK.x, p[1] - SX_CRACK.y); if (r > g) break; if (!started) { x.moveTo(p[0], p[1]); started = true; } else x.lineTo(p[0], p[1]); } x.lineWidth = w; x.stroke(); };
    const fade = 1 - MathX.smooth(t, SX.shatter[2] - 0.2, SX.shatter[2] + 0.4) * 0.85;
    for (const [col, w] of [['rgba(10,12,14,0.55)', 4.2], ['rgba(235,242,248,0.9)', 1.5]]) {
      x.strokeStyle = col; x.globalAlpha = fade;
      for (const ray of this.rays) draw(ray, w);
      for (const s of this.ringSegs) if (s.show && s.R < g) draw(s.pts, w * 0.8);
    }
    x.globalAlpha = 1;
    // a white star at the impact
    const k = MathX.smooth(t, SX.hit, SX.hit + 0.05) * (1 - MathX.smooth(t, SX.shatter[1], SX.shatter[2]));
    const gr = x.createRadialGradient(SX_CRACK.x, SX_CRACK.y, 0, SX_CRACK.x, SX_CRACK.y, 60);
    gr.addColorStop(0, `rgba(255,255,255,${0.55 * k})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(SX_CRACK.x - 60, SX_CRACK.y - 60, 120, 120);
  }

  // render the world and the void into targets; place the shards
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
    R.setRenderTarget(null);
    this.worldTex.value = this.rt.texture; this.bg.material.uniforms.tMap.value = this.vrt.texture;
    const g = this.reach(t);
    for (const S of this.shards) {
      const f = this.fallOf(S, t), m = S.mesh, crack = MathX.smooth(g, Math.hypot(S.c[0] - SX_CRACK.x, S.c[1] - SX_CRACK.y) * 0.6, Math.hypot(S.c[0] - SX_CRACK.x, S.c[1] - SX_CRACK.y));
      m.position.set(S.c[0] + S.drift * f * f, -(S.c[1] + 2600 * f * f), 0);
      m.rotation.z = S.spin * f; m.scale.setScalar(1 - 0.25 * f);
      S.mat.uniforms.uO.value = 1 - MathX.smooth(f, 0.55, 1); S.mat.uniforms.uDark.value = 0.35 * f;
      S.mat.uniforms.uShift.value.set(S.shift[0] * crack, S.shift[1] * crack);
      m.visible = f < 0.999;
    }
  }
}
