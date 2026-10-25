/* =====================================================================
   COSMOS — the galaxies, illustrated (a god's-eye view; everything here is labelled ILLUSTRATION). One set, seven
   shots (modes):
     rule     space today, growing (a field of galaxies drifting apart; a ruler between two of them); at 7:30 it turns
              round and shrinks, faster and faster
     held     in on one galaxy: it keeps its size while the gaps close; then everything runs together (midnight)
     promise  the history of the universe, rewound: the galaxies crowd together, turn young and blue, and dissolve into
              the glow everything came from (the Big Bang's light, 380,000 years in)
     close    out there tonight: the galaxies close in and crash together; light leaving them now can't reach you
     real     the real universe: growing, a little faster every year
     map      the biggest 3D map of the universe (DESI, 2025): two fans of galaxies, you at the point
     turn     a quiet field under the HUD's diagram (the size of the universe, past and future)
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
        for (let i = 0; i < 260; i++) { const rr = Math.abs(r.next() + r.next() + r.next() - 1.5) * 42, a = r.range(0, 6.28); dot(Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 0.8, r.range(6, 16), '255,214,170', 0.07); }
        dot(0, 0, 70, '255,220,180', 0.55); dot(0, 0, 26, '255,240,215', 0.9);
      } else {
        const arms = 2 + (k % 2), pitch = r.range(0.22, 0.32), turns = r.range(1.6, 2.2);
        dot(0, 0, 90, '170,190,255', 0.12);
        for (let a = 0; a < arms; a++) for (let i = 0; i < 520; i++) {
          const u = i / 520, th = u * turns * 6.283 + a * 6.283 / arms, rad = 10 * Math.exp(pitch * th);
          if (rad > 118) continue;
          const sx = (r.next() - 0.5) * (6 + rad * 0.16), sy = (r.next() - 0.5) * (6 + rad * 0.16), blue = r.next() < 0.8;
          dot(Math.cos(th) * rad + sx, Math.sin(th) * rad + sy, r.range(2.5, 7), blue ? '170,200,255' : '255,150,170', blue ? 0.22 : 0.3);
          if (r.next() < 0.12) dot(Math.cos(th) * rad + sx, Math.sin(th) * rad + sy, 1.6, '255,255,255', 0.8);
        }
        dot(0, 0, 46, '255,214,160', 0.6); dot(0, 0, 18, '255,240,210', 0.95);
      }
      g.restore();
    }
  });
  return ucTex(c, { repeat: false });
}
// the afterglow's mottled face (a seeded field of warm and cool spots, like the real maps)
function ucGlowTex() {
  const W = 512, H = 256, r = new RNG(CONFIG.seed + 509);
  return ucTex(ucCanvas(W, H, (g) => {
    const im = g.createImageData(W, H), d = im.data, sp = Array.from({ length: 900 }, () => [r.range(0, W), r.range(0, H), r.range(4, 22), r.range(-1, 1)]);
    const f = new Float32Array(W * H);
    for (const [x0, y0, s, a] of sp) for (let y = Math.max(0, Math.floor(y0 - 3 * s)); y < Math.min(H, y0 + 3 * s); y++) for (let x = Math.floor(x0 - 3 * s); x < x0 + 3 * s; x++) { const xx = (x + W) % W, q = ((x - x0) ** 2 + (y - y0) ** 2) / (s * s); f[y * W + xx] += a * Math.exp(-q); }
    for (let i = 0; i < W * H; i++) { const v = MathX.clamp(0.5 + 0.22 * f[i], 0, 1); d[i * 4] = 255 * (0.75 + 0.25 * v); d[i * 4 + 1] = 255 * (0.32 + 0.4 * v); d[i * 4 + 2] = 255 * (0.08 + 0.3 * v * v); d[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0);
  }));
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
      P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z; S[n] = size; A[n] = Math.min(1.8, alpha); C[n * 3] = r; C[n * 3 + 1] = gg; C[n * 3 + 2] = b; TL[n] = tile; RO[n] = rot; n++;
    },
    end() { g.instanceCount = n; for (const x of at) x.needsUpdate = true; },
  };
}

// the growth in the illustrations (the size of space, × today's): rule, held, promise, close, real
const UC_COS = {
  rule(t) { const g = Math.exp(0.025 * Math.max(0, Math.min(t, UC.shrinkAt) - UC.rule)), u = Math.max(0, t - UC.shrinkAt); return g * Math.exp(-(0.03 * u + 0.0045 * u * u * u)); },
  held(t) { const a0 = UC_COS.rule(UC.held), end = UC.promise - 0.25, u = MathX.clamp((t - UC.held) / (end - UC.held), 0, 1); return a0 * Math.pow(1 - u, 1.33) + 1e-4; },
  promise(t) { const u = MathX.clamp((t - UC.promise) / (UC.begin - UC.promise), 0, 1); return Math.exp(-4.2 * Math.pow(u, 1.3)); },
  close(t) { const u = Math.max(0, t - UC.close); return Math.exp(-(0.045 * u + 0.0012 * u * u * u)); },
  real(t) { const u = Math.max(0, t - UC.real); return Math.exp(0.012 * u + 0.0004 * u * u); },
};

UC_SETS.cosmos = (app) => {
  const S = ucSet(app, { sky: '#010102', fov: 50, near: 0.001, far: 1e6, hemi: ['#000000', '#000000', 0] });
  const scene = S.scene, cam = S.camera;
  const atlas = ucGalaxyAtlas(), gal = ucGalaxies(scene, atlas, 3000);
  // the faint background: very distant galaxies, a sphere of dim dots that rides with the camera
  const bg = new THREE.Group(); scene.add(bg);
  { const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), r = new RNG(CONFIG.seed + 503);
    for (let i = 0; i < N; i++) { const z = r.range(-1, 1), a = r.range(0, 6.283), s = Math.sqrt(1 - z * z), R = 9e5; pos[i * 3] = Math.cos(a) * s * R; pos[i * 3 + 1] = z * R; pos[i * 3 + 2] = Math.sin(a) * s * R; const b = 0.15 + 0.5 * Math.pow(r.next(), 3); col[i * 3] = b; col[i * 3 + 1] = b * 0.95; col[i * 3 + 2] = b * 1.05; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    bg.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false }))); }
  const bgMat = bg.children[0].material;
  // the ruler (rule), the light leaving a galaxy (close), the afterglow in front of the lens (promise)
  const rulerM = new THREE.LineDashedMaterial({ color: '#ffd7a8', dashSize: 0.06, gapSize: 0.05, transparent: true, depthWrite: false });
  const rulerG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
  const ruler = new THREE.Line(rulerG, rulerM); ruler.renderOrder = 7; scene.add(ruler);
  const ringU = { uA: { value: 0 }, uC: { value: new THREE.Color('#bfe0ff') } };
  const ring = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: ringU,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uA; uniform vec3 uC; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(vN, vV)); gl_FragColor = vec4(uC * (0.01 + 0.6 * pow(f, 6.0)) * uA, 1.0); }',
  }));
  ring.renderOrder = 4; scene.add(ring);
  const glowMat = new THREE.MeshBasicMaterial({ map: ucGlowTex(), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0, 0, 0) });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat); glow.renderOrder = 9; glow.position.set(0, 0, -2); cam.add(glow);
  // ---- the DESI map: two fans of points (galaxies by distance: bright nearby galaxies, red galaxies, young blue galaxies,
  // quasars), threaded into filaments; you at the point where they meet
  const map = (() => {
    const N = 90000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), r = new RNG(CONFIG.seed + 511);
    const fil = (x, y, z) => Math.sin(x * 0.9 + Math.sin(z * 0.6) * 2) * Math.sin(y * 1.1 + 1.3) * Math.sin(z * 0.8 + Math.sin(x * 0.5) * 2);
    let i = 0;
    while (i < N) {
      const side = r.next() < 0.6 ? 1 : -1, d = 12 * Math.pow(r.next(), 0.55), a = r.range(-0.62, 0.62), b = r.range(-0.035, 0.035);
      const x = Math.sin(a) * d, z = -side * Math.cos(a) * d, y = b * d;
      if (Math.abs(fil(x, y * 8, z)) < 0.12 + 0.5 * r.next() * r.next() && r.next() < 0.85) continue;
      const type = d < 2 ? [1, 0.92, 0.75] : d < 6 ? [1, 0.55, 0.42] : d < 9.5 ? [0.55, 0.7, 1] : [0.5, 1, 0.65];
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; const k = 0.55 + 0.45 * r.next(); col[i * 3] = type[0] * k; col[i * 3 + 1] = type[1] * k; col[i * 3 + 2] = type[2] * k; i++;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3 }));
    p.rotation.y = Math.PI / 2;                          // (the fans lie left and right of you)
    p.renderOrder = 3; scene.add(p); return p;
  })();
  const youDot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' })); scene.add(youDot);

  // ---- the field: a jittered lattice (comoving units: 1 = 10 million light years)
  const FIELD = [];
  { const r = new RNG(CONFIG.seed + 504);
    for (let x = -9; x <= 9; x++) for (let y = -5; y <= 5; y++) for (let z = -16; z <= 4; z++) {
      if (r.next() < 0.45) continue;
      FIELD.push({ p: [x + r.range(-0.45, 0.45), y * 0.9 + r.range(-0.45, 0.45), z + r.range(-0.45, 0.45)], s: r.range(0.1, 0.24), tile: r.int(0, 7), rot: r.range(0, 6.28), b: r.range(0.55, 1.1), warm: r.next() });
    } }
  // the ruler's two galaxies (near the middle of the view)
  const RA = { p: [-1.2, 0.15, -6.2], s: 0.26, tile: 1, rot: 0.4, b: 1.1, warm: 0.3 }, RB = { p: [1.35, -0.2, -6.8], s: 0.24, tile: 2, rot: 2.0, b: 1.1, warm: 0.6 };
  FIELD.push(RA, RB);
  const state = {};
  // draw the field at scale a; o.young: bluer, brighter (the young universe); o.merge: brighter where they crowd
  function field(a, o = {}) {
    gal.begin();
    const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z, yg = o.young || 0;
    for (const f of FIELD) {
      const x = f.p[0] * a, y = f.p[1] * a, z = f.p[2] * a;
      const d = Math.hypot(x - cx, y - cy, z - cz), near = MathX.smooth(d, 0.08, 0.45), far = 1 - MathX.smooth(d, 14, 22);
      const r = 1 - 0.3 * yg, g = (0.96 + 0.06 * f.warm) * (1 - 0.1 * yg), b = (0.92 + 0.14 * (1 - f.warm)) * (1 + 0.25 * yg);
      gal.add(x, y, z, f.s * (1 - 0.35 * yg), f.b * near * far * (o.k ?? 1), r, g, b, f.tile, f.rot);
    }
    gal.end();
  }
  const CAM = {
    rule(t) { const d = ucDrift(t, 0.05, 0.2, 5), k = ucK(t, UC.rule, UC.held, Ease.linear); ucCam(cam, [0.3 + d[0] - 0.3 * k, 0.35 + d[1], 2.2 - 0.4 * k], [0, 0, -7], 52); },
    held(t) {
      const a = UC_COS.held(t), A = [RA.p[0] * a, RA.p[1] * a, RA.p[2] * a], k = ucK(t, UC.held, UC.held + 2.5, Ease.inOutSine), out = ucK(t, UC.runout - 0.4, UC.promise - 0.2, Ease.inOutSine);
      const p0 = [0.0, 0.3, 1.8], p1 = [A[0] + 0.3, A[1] + 0.1, A[2] + 0.8], p2 = [0.2, 0.25, 2.6];
      ucCam(cam, ucV(ucV(p0, p1, k), p2, out), ucV(ucV([0, 0, -6], A, k), [0, 0, 0], out), ucLerp(ucLerp(52, 34, k), 46, out));
    },
    promise(t) { const k = ucK(t, UC.promise, UC.begin, Ease.inOutSine), d = ucDrift(t, 0.03, 0.2, 7); ucCam(cam, [0.2 + d[0], 0.3 + d[1], 2.4 - 1.6 * k], [0, 0, -4], 50 + 6 * k, -4 * k); },
    close(t) { const k = ucK(t, UC.close, UC.frost, Ease.linear), d = ucDrift(t, 0.04, 0.2, 8); ucCam(cam, [0.5 + d[0] - 0.6 * k, 0.4 + d[1], 1.9 - 1.1 * k], [0, 0, -3], 50); },
    real(t) { const k = ucK(t, UC.real, UC.clue, Ease.linear), d = ucDrift(t, 0.05, 0.2, 9); ucCam(cam, [0.6 + d[0] - 1.0 * k, 0.3 + d[1], 2.6 - 1.2 * k], [0.2 - 0.6 * k, 0, -8], 50); },
    // (from above, the way the map is published: a slow drift in, turning a little)
    map(t) { const k = ucK(t, UC.clue, UC.turn, Ease.inOutSine), a = 0.25 - 0.3 * k; ucCam(cam, [Math.sin(a) * 6.5, 25 - 7 * k, Math.cos(a) * 6.5], [0, 0, 0], 50); },
    turn(t) { const k = ucK(t, UC.turn, UC.same, Ease.linear), d = ucDrift(t, 0.03, 0.2, 11); ucCam(cam, [0.3 + d[0], 0.4 + d[1], 3.0 - 0.6 * k], [0, 0, -6], 52); },
  };

  return {
    scene, camera: cam,
    frame(t, shot) {
      (CAM[shot.mode] || CAM.rule)(t);
      bg.position.copy(cam.position);
      ruler.visible = false; ring.visible = false; glow.visible = false; map.visible = false; youDot.visible = false; bgMat.opacity = 1;
      const m = shot.mode;
      if (m === 'rule' || m === 'held') {
        const a = UC_COS[m](t); field(a, { k: m === 'held' ? 1 + 1.5 * MathX.smooth(t, UC.promise - 1.6, UC.promise - 0.2) : 1 });
        const A = new THREE.Vector3(...RA.p).multiplyScalar(a), B = new THREE.Vector3(...RB.p).multiplyScalar(a);
        if (m === 'rule') { rulerG.setFromPoints([A, B]); ruler.computeLineDistances(); ruler.visible = true; rulerM.opacity = ucWin(t, UC.rule + 0.6, UC.held + 0.1, 0.5, 0.3); }
        state.ruler = [(A.x + B.x) / 2, (A.y + B.y) / 2 + 0.22, (A.z + B.z) / 2]; state.rulerLy = 100 * a; state.hero = [A.x, A.y + 0.2 * Math.max(0.3, a), A.z]; state.a = a;
      } else if (m === 'promise') {
        const a = UC_COS.promise(t), u = MathX.clamp((t - UC.promise) / (UC.begin - UC.promise), 0, 1);
        field(a, { young: MathX.smooth(u, 0.2, 0.8), k: 1 + 1.2 * MathX.smooth(u, 0.4, 0.9) });
        // the afterglow: everything dissolves into it (it fills the lens in the last seconds)
        const gk = MathX.smooth(t, ucCap('promise', 1).show - 0.6, UC.begin - 0.4);
        glow.visible = gk > 0; glow.scale.set(5, 3, 1); glowMat.color.setRGB(1.25 * gk, 1.0 * gk, 0.9 * gk); bgMat.opacity = 1 - gk;
      } else if (m === 'close') {
        const a = UC_COS.close(t); field(a, { k: 1 + 0.8 * MathX.smooth(t, UC.crashAt - 1, UC.crashAt + 2) });
        // the light leaving one galaxy now: a shell that grows far slower than the galaxies close in
        const lt = ucCap('close', 2).show - 0.6;
        if (t > lt) { const g = FIELD[300 % FIELD.length]; ring.visible = true; ring.position.set(g.p[0] * a, g.p[1] * a, g.p[2] * a); ring.scale.setScalar(0.08 + 0.06 * (t - lt)); ringU.uA.value = MathX.smooth(t, lt, lt + 0.6); state.ring = [g.p[0] * a, g.p[1] * a + 0.3, g.p[2] * a]; }
      } else if (m === 'real') {
        field(UC_COS.real(t), { k: MathX.smooth(t, UC.real, UC.real + 1.0) });
      } else if (m === 'map') {
        gal.begin(); gal.end(); map.visible = true; youDot.visible = true; youDot.position.set(0, 0, 0); map.material.opacity = 0.3 * MathX.smooth(t, UC.clue, UC.clue + 1.0); bgMat.opacity = 0.4;
      } else if (m === 'turn') {
        field(1.0 - 0.02 * (t - UC.turn), { k: 0.45 });
      }
    },
    grade(t, p, shot) {
      p.exposure = 1.1; p.bloom = 0.6; p.bloomThreshold = 0.6; p.vignette = 0.6; p.grain = 0.022; p.saturation = 1.08; p.contrast = 1.05;
      if (shot.mode === 'real') p.fade = Math.max(p.fade, 1 - MathX.smooth(t, UC.real, UC.real + 0.8));
      if (shot.mode === 'promise') p.bloom = 0.7;
      if (shot.mode === 'map') { p.bloom = 0.3; p.bloomThreshold = 1.2; }
    },
    labels(t) {
      const s = ucShotAt(t), W = StoryHUD.win;
      if (s.mode === 'rule' && state.ruler) return [{ p: state.ruler, text: ucThousands(state.rulerLy) + ' MILLION LIGHT YEARS', a: W(t, UC.rule + 0.6, UC.held + 0.1, 0.5, 0.3) }];
      if (s.mode === 'held' && state.hero) return [{ p: state.hero, text: 'A GALAXY', sub: 'HELD TOGETHER · SAME SIZE', a: W(t, UC.held + 1.2, UC.runout - 0.3, 0.5, 0.4) }];
      if (s.mode === 'close' && state.ring && t > ucCap('close', 2).show - 0.3) return [{ p: state.ring, text: 'ITS LIGHT, LEAVING NOW', sub: 'NEEDS MILLIONS OF YEARS · MIDNIGHT IS MINUTES AWAY', a: W(t, ucCap('close', 2).show, UC.frost - 0.2, 0.4, 0.3) }];
      if (s.mode === 'map') return [{ p: [0, 0.15, 0], text: 'YOU', a: W(t, UC.clue + 0.8, UC.turn - 0.2, 0.4, 0.3) }];
      return [];
    },
  };
};
