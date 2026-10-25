/* =====================================================================
   COSMOS — the galaxies, illustrated (a god's-eye view; everything here is labelled ILLUSTRATION). One set, four
   shots (modes):
     grow    space growing, sped up: a field of galaxies drifts apart, each keeps its own size; a ruler between two of
             them grows (100 million light years and counting); then in to one galaxy, held together by its gravity
     edge    the first second, slowed down: the edge (c / H, where space carries things off faster than light) closes
             in from 14 billion light years towards the Milky Way. Distances are squeezed to fit (a self-similar zoom:
             the camera keeps the edge the same size on screen). Galaxies it has passed turn grey-red: cut off, still
             in sight, their old light still coming
     real    the real universe: gentle growth; a distant supernova flares (how the speeding up was found, 1998)
     future  the real future: the other galaxies speed away, redden and fade; one is left. Ours
   ===================================================================== */

// the galaxy atlas: 4 × 2 tiles of 256 px (four spirals, two tilted spirals, two ellipticals), drawn once (seeded)
function ucGalaxyAtlas() {
  const T = 256, r = new RNG(CONFIG.seed + 501);
  const c = ucCanvas(T * 4, T * 2, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, T * 4, T * 2);
    g.globalCompositeOperation = 'lighter';
    const dot = (x, y, rad, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    for (let k = 0; k < 8; k++) {
      const cx = (k % 4) * T + T / 2, cy = Math.floor(k / 4) * T + T / 2, tilt = k >= 4 && k < 6 ? 0.42 : 1, ell = k >= 6;
      g.save(); g.beginPath(); g.rect(cx - T / 2, cy - T / 2, T, T); g.clip();
      g.translate(cx, cy); g.rotate(r.range(0, 6.28)); g.scale(1, tilt);
      if (ell) {
        for (let i = 0; i < 260; i++) { const rr = Math.abs(r.gauss ? r.gauss() : (r.next() + r.next() + r.next() - 1.5)) * 42, a = r.range(0, 6.28); dot(Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 0.8, r.range(6, 16), '255,214,170', 0.07); }
        dot(0, 0, 70, '255,220,180', 0.55); dot(0, 0, 26, '255,240,215', 0.9);
      } else {
        const arms = 2 + (k % 2), pitch = r.range(0.22, 0.32), turns = r.range(1.6, 2.2);
        dot(0, 0, 90, '170,190,255', 0.12);
        for (let a = 0; a < arms; a++) for (let i = 0; i < 520; i++) {
          const u = i / 520, th = u * turns * 6.283 + a * 6.283 / arms, rad = 10 * Math.exp(pitch * th);
          if (rad > 118) continue;
          const sx = (r.next() - 0.5) * (6 + rad * 0.16), sy = (r.next() - 0.5) * (6 + rad * 0.16);
          const blue = r.next() < 0.8;
          dot(Math.cos(th) * rad + sx, Math.sin(th) * rad + sy, r.range(2.5, 7), blue ? '170,200,255' : '255,150,170', blue ? 0.22 : 0.3);
          if (r.next() < 0.12) dot(Math.cos(th) * rad + sx, Math.sin(th) * rad + sy, 1.6, '255,255,255', 0.8);
        }
        dot(0, 0, 46, '255,214,160', 0.6); dot(0, 0, 18, '255,240,210', 0.95);
      }
      g.restore();
    }
  });
  const t = ucTex(c, { repeat: false }); return t;
}
// the Milky Way, larger, for the close shots
function ucMilkyWayTex() {
  const r = new RNG(CONFIG.seed + 502), S = 1024;
  return ucTex(ucCanvas(S, S, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'lighter'; g.translate(S / 2, S / 2);
    const dot = (x, y, rad, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    dot(0, 0, 420, '150,170,230', 0.14);
    for (let a = 0; a < 4; a++) for (let i = 0; i < 2600; i++) {
      const u = i / 2600, th = u * 2.1 * 6.283 + a * 1.5708 + (a % 2) * 0.3, rad = 40 * Math.exp(0.21 * th);
      if (rad > 470) continue;
      const sp = 10 + rad * 0.14, sx = (r.next() - 0.5) * sp, sy = (r.next() - 0.5) * sp, blue = r.next() < 0.78;
      dot(Math.cos(th) * rad + sx, Math.sin(th) * rad + sy, r.range(3, 11), blue ? '165,195,255' : '255,140,160', blue ? 0.16 : 0.22);
      if (r.next() < 0.25) dot(Math.cos(th) * rad + sx, Math.sin(th) * rad + sy, 2.2, '255,255,255', 0.7);
      if (r.next() < 0.1) dot(Math.cos(th) * rad + sx * 0.5, Math.sin(th) * rad + sy * 0.5, r.range(4, 8), '40,20,10', 0.0);
    }
    // the bar and the bulge
    g.save(); g.rotate(0.5); g.scale(1, 0.38); dot(0, 0, 150, '255,210,150', 0.5); g.restore();
    dot(0, 0, 110, '255,215,165', 0.6); dot(0, 0, 40, '255,240,215', 0.95);
  }), { repeat: false });
}

// galaxy billboards (instanced quads facing the camera, a tile of the atlas each)
function ucGalaxies(scene, atlas, max) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  const P = new Float32Array(max * 3), S = new Float32Array(max), A = new Float32Array(max), C = new Float32Array(max * 3), TL = new Float32Array(max), RO = new Float32Array(max);
  const at = [[P, 3, 'iPos'], [S, 1, 'iSize'], [A, 1, 'iAlpha'], [C, 3, 'iCol'], [TL, 1, 'iTile'], [RO, 1, 'iRot']].map(([arr, k, name]) => { const x = new THREE.InstancedBufferAttribute(arr, k); x.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, x); return x; });
  g.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uAtlas: { value: atlas } },
    vertexShader: `attribute vec3 iPos; attribute float iSize, iAlpha, iTile, iRot; attribute vec3 iCol; varying float vA; varying vec3 vC; varying vec2 vUv;
      void main(){ vA = iAlpha; vC = iCol; float c = cos(iRot), s = sin(iRot); vec2 p = vec2(c * position.x - s * position.y, s * position.x + c * position.y);
        vec2 tile = vec2(mod(iTile, 4.0), floor(iTile / 4.0)); vUv = (tile + uv) / vec2(4.0, 2.0); vUv.y = 1.0 - ((1.0 - uv.y) + tile.y) / 2.0;
        vec4 mv = viewMatrix * vec4(iPos, 1.0); mv.xy += p * iSize; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uAtlas; varying float vA; varying vec3 vC; varying vec2 vUv;
      void main(){ vec3 c = texture2D(uAtlas, vUv).rgb; gl_FragColor = vec4(c * vC * vA, 1.0); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; scene.add(mesh);
  let n = 0;
  return {
    begin() { n = 0; },
    add(x, y, z, size, alpha, r, gg, b, tile, rot) {
      if (n >= max || !(alpha > 0.003) || !isFinite(x + y + z + size)) return;
      P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z; S[n] = size; A[n] = Math.min(1.6, alpha); C[n * 3] = r; C[n * 3 + 1] = gg; C[n * 3 + 2] = b; TL[n] = tile; RO[n] = rot; n++;
    },
    end() { g.instanceCount = n; for (const x of at) x.needsUpdate = true; },
  };
}

UC_SETS.cosmos = (app) => {
  const S = ucSet(app, { sky: '#010102', fov: 50, near: 0.001, far: 1e6, hemi: ['#000000', '#000000', 0] });
  const scene = S.scene, cam = S.camera;
  const atlas = ucGalaxyAtlas(), gal = ucGalaxies(scene, atlas, 2400);
  // the faint background: very distant galaxies, a sphere of dim dots that rides with the camera
  const bg = new THREE.Group(); scene.add(bg);
  { const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), r = new RNG(CONFIG.seed + 503);
    for (let i = 0; i < N; i++) { const z = r.range(-1, 1), a = r.range(0, 6.283), s = Math.sqrt(1 - z * z), R = 9e5; pos[i * 3] = Math.cos(a) * s * R; pos[i * 3 + 1] = z * R; pos[i * 3 + 2] = Math.sin(a) * s * R; const b = 0.15 + 0.5 * Math.pow(r.next(), 3); col[i * 3] = b; col[i * 3 + 1] = b * 0.95; col[i * 3 + 2] = b * 1.05; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    bg.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false }))); }
  // the Milky Way (and Andromeda) up close
  const mwTex = ucMilkyWayTex();
  const mw = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: mwTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1, 1, 1) }));
  mw.renderOrder = 2; scene.add(mw);
  // the edge: a sphere, its rim glowing
  const edgeU = { uA: { value: 1 }, uC: { value: new THREE.Color('#ffcf8a') } };
  const edge = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: edgeU,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uA; uniform vec3 uC; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(vN, vV)); float a = (0.008 + 0.55 * pow(f, 5.0)) * uA; gl_FragColor = vec4(uC * a, 1.0); }',
  }));
  edge.renderOrder = 4; scene.add(edge);
  // a supernova (the real section) and the ruler (grow)
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ucDotTex(0.25), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1, 1, 1) }));
  flash.renderOrder = 6; scene.add(flash);
  const rulerM = new THREE.LineDashedMaterial({ color: '#ffd7a8', dashSize: 0.06, gapSize: 0.05, transparent: true, depthWrite: false });
  const rulerG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
  const ruler = new THREE.Line(rulerG, rulerM); ruler.renderOrder = 7; scene.add(ruler);

  // ---- the field for grow / real / future: a jittered lattice (comoving units: 1 = 10 million light years)
  const FIELD = [];
  { const r = new RNG(CONFIG.seed + 504);
    for (let x = -9; x <= 9; x++) for (let y = -5; y <= 5; y++) for (let z = -16; z <= 4; z++) {
      if (r.next() < 0.45) continue;
      FIELD.push({ p: [x + r.range(-0.45, 0.45), y * 0.9 + r.range(-0.45, 0.45), z + r.range(-0.45, 0.45)], s: r.range(0.1, 0.24), tile: r.int(0, 7), rot: r.range(0, 6.28), b: r.range(0.55, 1.1), warm: r.next() });
    } }
  // the ruler's two galaxies and the hero (held together), near the middle of the view
  const RA = { p: [-1.2, 0.15, -6.2], s: 0.26, tile: 1, rot: 0.4, b: 1.1, warm: 0.3 }, RB = { p: [1.35, -0.2, -6.8], s: 0.24, tile: 2, rot: 2.0, b: 1.1, warm: 0.6 };
  FIELD.push(RA, RB);
  // ---- the edge shot's universe around the Milky Way: log-uniform in distance (so every zoom has galaxies)
  const SKY = [];
  { const r = new RNG(CONFIG.seed + 505);
    for (let i = 0; i < 1500; i++) {
      const d = Math.pow(10, r.range(Math.log10(0.6), Math.log10(9000))), z = r.range(-1, 1), a = r.range(0, 6.283), s = Math.sqrt(1 - z * z);
      SKY.push({ d, p: [Math.cos(a) * s * d, z * d * 0.8, Math.sin(a) * s * d], s: r.range(0.02, 0.05), tile: r.int(0, 7), rot: r.range(0, 6.28), b: r.range(0.6, 1.1) });
    } }
  const MPC = 3.0857e22, VIRGO = [-9.5, 4.2, -12.9], AND = [0.55, 0.32, -0.42];     // (Mpc: Virgo 16.5, Andromeda 0.78)
  for (let i = 0; i < 40; i++) { const r = ucR(i, 61), a = ucR(i, 62) * 6.28, rr = 0.6 + 1.6 * r; SKY.push({ d: 16.5, p: [VIRGO[0] + Math.cos(a) * rr, VIRGO[1] + (ucR(i, 63) - 0.5) * 1.6, VIRGO[2] + Math.sin(a) * rr], s: 0.05, tile: 6 + (i % 2), rot: a, b: 0.9 }); }
  SKY.push({ d: 0.78, p: AND, s: 0.06, tile: 4, rot: 0.6, b: 1.3, and: 1 });

  const _v = new THREE.Vector3();
  // the growth in the illustrations (× per second of film): grow, real, future
  const aGrow = (t) => Math.exp(0.034 * Math.max(0, t - UC.grow));
  const aReal = (t) => Math.exp(0.018 * Math.max(0, t - UC.real));
  const aFut = (t) => { const u = Math.max(0, t - UC.future); return Math.exp(0.05 * u + 0.012 * u * u * u / 6); };
  // the edge shot: the edge in Mpc, and the camera that keeps it the same size on screen
  const edgeMpc = (t) => ucEdge(Math.max(1e-30, ucNight(t))) / MPC;
  // (the camera pulls in a little slower than the edge closes, so the edge visibly shrinks, about 3× across the shot)
  const edgeD = (t) => { const E0 = edgeMpc(UC.far); return 2.15 * E0 * Math.pow(edgeMpc(t) / E0, 0.85); };

  const state = {};
  function field(t, a, o = {}) {
    gal.begin();
    const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    for (const f of FIELD) {
      const x = f.p[0] * a, y = f.p[1] * a, z = f.p[2] * a;
      const d = Math.hypot(x - cx, y - cy, z - cz), near = MathX.smooth(d, 0.15, 0.6), far = 1 - MathX.smooth(d, 14, 22);
      let r = 1, g = 0.96 + 0.06 * f.warm, b = 0.92 + 0.14 * (1 - f.warm), al = f.b * near * far;
      if (o.leave && f !== o.keep) { const k = o.leave(f, d); al *= k.a; r *= 1; g *= k.g; b *= k.b; }
      gal.add(x, y, z, f.s, al, r, g, b, f.tile, f.rot);
    }
    gal.end();
  }
  const CAM = {
    grow(t) {
      const k = ucK(t, UC.grow, UC.held + 1.5, Ease.linear), h = ucK(t, UC.held, UC.scope, Ease.inOutSine), d = ucDrift(t, 0.06, 0.2, 5);
      // (then in to the ruler's left galaxy: it keeps its size while the gaps grow)
      const a = aGrow(t), A = [RA.p[0] * a, RA.p[1] * a, RA.p[2] * a];
      const p0 = [0.3 + d[0] - 0.4 * k, 0.35 + d[1], 2.2 - 0.5 * k], p1 = [A[0] + 0.25, A[1] + 0.12, A[2] + 0.75];
      ucCam(cam, ucV(p0, p1, h), ucV([0, 0, -7], A, Math.min(1, h * 1.6)), ucLerp(52, 34, h));
    },
    edge(t) {
      const k = ucK(t, UC.far, UC.andro, Ease.linear), D = edgeD(t), az = -0.5 + 0.7 * k;
      ucCam(cam, [Math.sin(az) * D, D * (0.32 - 0.1 * k), Math.cos(az) * D], [0, 0, 0], 50);
    },
    real(t) { const k = ucK(t, UC.real, UC.future, Ease.linear), d = ucDrift(t, 0.05, 0.2, 9); ucCam(cam, [0.6 + d[0] - 1.2 * k, 0.3 + d[1], 2.6 - 1.4 * k], [0.2 - 0.6 * k, 0, -8], 50); },
    future(t) { const k = ucK(t, UC.future, UC.question, Ease.linear), d = ucDrift(t, 0.02, 0.2, 11); ucCam(cam, [0.12 + d[0], 0.62 + d[1] - 0.08 * k, 1.45 + 0.1 * k], [0, 0, -2.5], 52 - 4 * k, -6); },
  };

  return {
    scene, camera: cam,
    frame(t, shot) {
      (CAM[shot.mode] || CAM.grow)(t);
      bg.position.copy(cam.position);
      mw.visible = false; edge.visible = false; flash.visible = false; ruler.visible = false;
      if (shot.mode === 'grow') {
        const a = aGrow(t); field(t, a);
        // the ruler between RA and RB, its length in light years over it (the HUD pins the label)
        const A = new THREE.Vector3(...RA.p).multiplyScalar(a), B = new THREE.Vector3(...RB.p).multiplyScalar(a);
        rulerG.setFromPoints([A, B]); ruler.computeLineDistances(); ruler.visible = true;
        rulerM.opacity = ucWin(t, ucCap('grow', 1).show - 0.2, UC.held + 2.5, 0.5, 0.8);
        state.ruler = [(A.x + B.x) / 2, (A.y + B.y) / 2 + 0.22, (A.z + B.z) / 2]; state.rulerLy = 100 * a;
        state.hero = [RA.p[0] * a, RA.p[1] * a + 0.2, RA.p[2] * a];
      } else if (shot.mode === 'edge') {
        const E = edgeMpc(t), D = edgeD(t);
        edge.visible = true; edge.scale.setScalar(E); edgeU.uA.value = 1;
        gal.begin();
        const cpos = cam.position;
        for (const g of SKY) {
          const dc = Math.hypot(g.p[0] - cpos.x, g.p[1] - cpos.y, g.p[2] - cpos.z);
          const size = Math.max(g.s, dc * 0.016) * (g.and ? 1.4 : 1), out = g.d > E;
          // (fade the ones far behind the view, and the ones too close to the lens)
          const vis = MathX.smooth(dc, D * 0.08, D * 0.3) * (1 - MathX.smooth(g.d, E * 6, E * 14));
          const k = out ? 0.42 : 1;
          gal.add(g.p[0], g.p[1], g.p[2], size, g.b * vis * k * (g.and ? 1.4 : 1), out ? 1.0 : 1, out ? 0.62 : 0.97, out ? 0.55 : 1.04, g.tile, g.rot);
        }
        gal.end();
        // the Milky Way at the centre: a bright little spiral (you)
        mw.visible = true; mw.position.set(0, 0, 0); mw.scale.setScalar(Math.max(0.03, D * 0.035)); mw.quaternion.copy(cam.quaternion); mw.material.opacity = 1;
        state.E = E; state.D = D;
      } else if (shot.mode === 'real') {
        const a = aReal(t); field(t, a);
        // the supernova: one star in a distant galaxy outshines it for a few weeks (here a few seconds)
        const at = ucCap('real', 2).show - 0.4, u = t - at, g = FIELD[260 % FIELD.length];
        if (u > 0) { flash.visible = true; flash.position.set(g.p[0] * a + 0.04, g.p[1] * a + 0.02, g.p[2] * a); flash.quaternion.copy(cam.quaternion);
          const k = Math.min(1, u / 0.35) * Math.exp(-Math.max(0, u - 0.35) / 2.6); flash.scale.setScalar(0.18 + 0.12 * k); flash.material.color.setRGB(1.6 * k, 1.5 * k, 1.35 * k); }
        state.sn = [g.p[0] * a, g.p[1] * a + 0.12, g.p[2] * a];
      } else if (shot.mode === 'future') {
        const a = aFut(t), last = ucCap('future', 2).show - 0.6;
        field(t, a, { leave: (f, d) => { if (Math.hypot(f.p[0], f.p[1], f.p[2] + 1.1) < 1.7) return { a: 0, g: 1, b: 1 }; const red = MathX.smooth(a, 1.2, 6); return { a: 1 - MathX.smooth(t, last - 5 - 3 * ucR(Math.round(f.rot * 1000), 3), last), g: 1 - 0.5 * red, b: 1 - 0.75 * red }; } });
        // ours: the Milky Way (and Andromeda, long since merged into it), in front of you
        mw.visible = true; mw.position.set(0, 0, -1.1); mw.scale.setScalar(1.15); mw.rotation.set(-1.05, 0, 0.3); mw.material.opacity = 1;
        state.ours = [0.0, 0.42, -1.1];
      }
    },
    grade(t, p, shot) { p.exposure = 1.1; p.bloom = 0.6; p.bloomThreshold = 0.6; p.vignette = 0.6; p.grain = 0.022; p.saturation = 1.08; p.contrast = 1.05; },
    labels(t) {
      const s = ucShotAt(t), W = StoryHUD.win;
      if (s.mode === 'grow' && state.ruler) {
        const L = [{ p: state.ruler, text: ucThousands(state.rulerLy) + ' MILLION LIGHT YEARS', a: W(t, ucCap('grow', 1).show, UC.held + 2.2, 0.5, 0.5) }];
        if (t > UC.held + 0.6) L.push({ p: state.hero, text: 'A GALAXY', sub: 'HELD TOGETHER BY ITS GRAVITY', a: W(t, ucCap('held', 1).show - 0.6, UC.scope - 0.2, 0.5, 0.3) });
        return L;
      }
      if (s.mode === 'edge' && state.E) {
        const E = state.E, L = [{ p: [0, -Math.max(0.03, state.D * 0.035) * 0.3, 0], text: 'YOU', sub: 'THE MILKY WAY', a: W(t, UC.far + 0.6, UC.andro, 0.5, 0.2) }];
        // (on the sphere's rim, right of centre and a little up, as seen from the camera)
        cam.updateMatrixWorld(); const rx = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), uy = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
        const rim = rx.multiplyScalar(E * 0.9).add(uy.multiplyScalar(E * 0.42));
        L.push({ p: [rim.x, rim.y, rim.z], text: 'THE EDGE', sub: ucFmtLy(E * MPC), a: W(t, UC.far + 0.3, UC.andro, 0.5, 0.2) });
        if (E < 120 && E > 2) L.push({ p: [VIRGO[0], VIRGO[1] + 1.4, VIRGO[2]], text: 'THE VIRGO CLUSTER', sub: E < 16.5 ? 'OVER THE EDGE' : '54 MILLION LIGHT YEARS', a: W(t, UC.far + 2.0, UC.andro, 0.4, 0.2) * MathX.smooth(E, 120, 70) });
        return L;
      }
      if (s.mode === 'real' && state.sn && t > ucCap('real', 2).show - 0.2) return [{ p: state.sn, text: 'A SUPERNOVA', sub: 'DIMMER THAN IT SHOULD BE', a: W(t, ucCap('real', 2).show, ucS('rip') - 0.4, 0.4, 0.4) }];
      if (s.mode === 'future' && state.ours) return [{ p: state.ours, text: 'OURS', a: W(t, ucCap('future', 2).show, UC.question - 0.2, 0.4, 0.3) }];
      return [];
    },
  };
};
