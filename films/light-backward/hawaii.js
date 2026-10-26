/* =====================================================================
   HAWAII — Waikiki beach at noon (10 PM in your garden): the day side of the Earth. Modes:
     noon     a bright beach, the Sun high in the south; at 10:00:00 it goes out, and the sky with it
     black    the sky black, stars at noon (mirror images: Orion in the east, sped up), the beach in the dark
     wait     people on the dark beach looking up, phones out (the 8 minutes 16 seconds)
     return   12:08:16 their time: the Sun comes back, a dot (the centre of its disc) first, then the disc
     sun      the Sun through a filter: brighter and brighter, whiter (its surface heating up)
   Local frame (metres): −z looks out to sea (SSW, azimuth 200°), +x is WNW along the beach (the hotels), −x towards
   Diamond Head; the water's edge is at z ≈ −8.
   ===================================================================== */

const LB_HW = { az0: 200, shore: -8 };
const lbAimH = (p, az, alt, d = 40) => { const r = (az - LB_HW.az0) * LB_D2R, a = alt * LB_D2R; return [p[0] + Math.sin(r) * Math.cos(a) * d, p[1] + Math.sin(a) * d, p[2] - Math.cos(r) * Math.cos(a) * d]; };

Object.assign(ACTIONS, {
  // looking up at the black sky, a phone held up in the right hand
  lbLookUp(τ, c) { const p = ACTIONS.idle(τ, c); p.neck = -0.55 + 0.05 * Math.sin(τ * 0.4 + c.seed * 5); p.headYaw = 0.25 * Math.sin(τ * 0.17 + c.seed * 9); p.rSh = [1.45, 0.12]; p.rEl = 0.35; return p; },
  lbLookUp2(τ, c) { const p = ACTIONS.idle(τ, c); p.neck = -0.5; p.headYaw = 0.3 * Math.sin(τ * 0.13 + c.seed * 3); p.lSh = [0.3, 0.1]; p.lEl = 0.5; return p; },
});
Object.assign(BLEND, { lbLookUp: 0.8, lbLookUp2: 0.8 });

function lbSandCanvas(seed, w = 512) {
  return lbCanvas(w, w, (g) => {
    const im = g.createImageData(w, w), d = im.data;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const n = (hash2(x + seed, y) - 0.5) * 0.25 + (hash2(x >> 3, (y >> 3) + seed) - 0.5) * 0.12, i = (y * w + x) * 4; d[i] = 218 * (1 + n); d[i + 1] = 196 * (1 + n); d[i + 2] = 156 * (1 + n); d[i + 3] = 255; }
    g.putImageData(im, 0, 0);
  });
}
// a palm frond (a midrib with leaflets), on transparent canvas
function lbFrondTex() {
  return lbTex(lbCanvas(128, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#4e6a2c'; g.lineWidth = 5; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    for (let y = 8; y < h; y += 9) { const L = (w / 2 - 4) * Math.sin(Math.PI * (0.15 + 0.85 * y / h)); g.strokeStyle = y % 2 ? '#3f6326' : '#4a7230'; g.lineWidth = 4;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2 + s * L, y + 14); g.stroke(); } }
  }), { repeat: false });
}
function lbPalm(parent, x, z, h, lean, seed, frondM) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = lbR(seed, 3) * 6.28; parent.add(g);
  const rings = []; for (let i = 0; i <= 12; i++) { const u = i / 12; rings.push([lean * h * u * u, h * u, 0, 0.2 - 0.07 * u, 0.2 - 0.07 * u]); }
  const tr = new THREE.Mesh(lbLoft(rings, 10, 0.3), lbStd('#7a6a52', 0.95)); tr.castShadow = true; g.add(tr);
  const crown = new THREE.Group(); crown.position.set(lean * h, h, 0); g.add(crown);
  for (let k = 0; k < 11; k++) {
    const geo = new THREE.PlaneGeometry(1.1, 4.2, 1, 10); geo.translate(0, 2.1, 0);
    const P = geo.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i); P.setZ(i, -0.05 * y * y); }
    geo.computeVertexNormals();
    const f = new THREE.Mesh(geo, frondM); f.castShadow = true;
    f.rotation.set(0, 0, 0); f.rotation.order = 'YXZ'; f.rotation.y = k * 2.4 + lbR(seed, k) * 0.4; f.rotation.x = -(0.5 + 0.8 * lbR(seed, k + 20)); crown.add(f);
  }
  return g;
}
// a hotel tower: glass and concrete, a window grid; some rooms lit (they show once the beach goes dark)
function lbHotelTex(seed, floors, cols) {
  const r = new RNG(seed), W = 256, H = 512, lit = [];
  const map = lbCanvas(W, H, (g) => {
    g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, W, H);
    const fw = W / cols, fh = H / floors;
    for (let j = 0; j < floors; j++) for (let i = 0; i < cols; i++) { g.fillStyle = r.next() < 0.2 ? '#5d7890' : '#46607a'; g.fillRect(i * fw + 2, j * fh + 3, fw - 4, fh * 0.55); if (r.next() < 0.3) lit.push([i * fw + 2, j * fh + 3, fw - 4, fh * 0.55]);
      g.fillStyle = '#bdb8ae'; g.fillRect(i * fw, j * fh + fh * 0.62, fw, fh * 0.08); }
  });
  const glow = lbCanvas(W, H, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); for (const [x, y, w, h] of lit) { g.fillStyle = hash1(x * 7 + y) < 0.5 ? '#ffcf8a' : '#e8e0d0'; g.fillRect(x, y, w, h); } });
  return { map: lbTex(map, { repeat: false }), glow: lbTex(glow, { repeat: false }) };
}

LB_SETS.hawaii = (app) => {
  const S = lbSet(app, { sky: '#000000', fov: 60, near: 0.05, far: 7000, hemi: ['#bcd4ee', '#c8b490', 0.6], sun: [0, 80, -40], sunI: 2.6, shadow: 2048, shadowR: 30, shadowFar: 400 });
  const scene = S.scene, cam = S.camera, K = lbK;
  scene.environment = lbEnv(app.renderer, '#8fb4e0', '#dfe6ee', '#b8a888');
  scene.fog = new THREE.FogExp2('#c8d8e8', 0.00011);
  const HF = lbFrame(0, LBP.hawaii.lat, LBP.hawaii.lon), HX = lbEarthPoint(HF), AZ = LB_HW.az0;
  const sky = new LbSky(scene, { F: HF, X: HX, az0: AZ, moon: false, second: false, town: '#1c2026' });
  // ---- the beach, the sea
  const st = lbTex(lbSandCanvas(3)); st.repeat.set(120, 60);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(1200, 400, 1, 1), lbStd('#ffffff', 0.95, 0, { map: st })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0, 192); sand.receiveShadow = true; scene.add(sand);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(1200, 5), lbStd('#a8906a', 0.55, 0.05)); wet.rotation.x = -Math.PI / 2; wet.position.set(0, 0.004, LB_HW.shore + 2.3); wet.receiveShadow = true; scene.add(wet);
  const seaU = { uT: { value: 0 }, uK: { value: 1 }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uTop: { value: new THREE.Color('#3c78c0') }, uHor: { value: new THREE.Color('#b8d0e6') }, uShore: { value: LB_HW.shore }, uLamp: { value: 0 } };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(5200, 2700, 1, 1), new THREE.ShaderMaterial({
    uniforms: seaU, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      uniform float uT, uK, uShore, uLamp; uniform vec3 uSun, uTop, uHor; varying vec3 vW;
      void main() {
        vec2 p = vW.xz; float d = uShore - vW.z;                         // (metres offshore)
        vec2 g = vec2(0.0);
        g += vec2(0.20, 0.98) * cos(dot(p, vec2(0.20, 0.98)) * 0.55 + uT * 1.4) * 0.09;
        g += vec2(-0.6, 0.8) * cos(dot(p, vec2(-0.6, 0.8)) * 1.3 + uT * 2.1) * 0.05;
        g += vec2(0.8, 0.6) * cos(dot(p, vec2(0.8, 0.6)) * 2.9 + uT * 3.3) * 0.03;
        g += vec2(0.1, -1.0) * cos(dot(p, vec2(0.1, -1.0)) * 6.1 + uT * 4.6) * 0.016;
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 v = normalize(cameraPosition - vW), r = reflect(-v, n);
        float fr = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 skyc = mix(uHor, uTop, smoothstep(0.0, 0.5, max(r.y, 0.0)));
        vec3 body = mix(vec3(0.05, 0.35, 0.38), vec3(0.01, 0.1, 0.2), smoothstep(5.0, 120.0, d));
        vec3 col = mix(body * uK, skyc * uK, fr);
        col += vec3(1.0, 0.96, 0.88) * pow(max(dot(r, uSun), 0.0), 600.0) * 26.0 * uK * step(0.0, uSun.y);
        // the surf: bands of foam rolling in
        float band = pow(max(0.0, sin(d * 0.55 + uT * 1.3)), 18.0) * exp(-max(d, 0.0) / 14.0);
        float edge = smoothstep(1.4, 0.0, d + 0.5 * sin(vW.x * 0.3 + uT * 0.9));
        col += vec3(0.9, 0.92, 0.94) * (band * 0.7 + edge * 0.5) * (uK * 0.9 + uLamp * 0.06);
        // the far haze
        float fz = 1.0 - exp(-pow(length(vW.xz - cameraPosition.xz) * 0.00034, 2.0));
        col = mix(col, uHor * uK, fz * 0.75);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.02, LB_HW.shore - 1350); scene.add(sea);
  // Diamond Head (3.5 km to the ESE)
  { const dh = lbMesh(lbBlob(1, 77, 3), lbStd('#6a6648', 0.95, 0, { flatShading: true }), 0, 0, 0, scene);
    const dir = lbAimH([0, 0, 0], 112, 0, 3400); dh.position.set(dir[0], -40, dir[2]); dh.scale.set(950, 270, 650); dh.rotation.y = 0.5; dh.castShadow = false; dh.receiveShadow = false; }
  // ---- the hotels (behind the beach and along it to the WNW), palms, umbrellas, people
  const hotels = [];
  { const r = new RNG(55);
    for (let i = 0; i < 16; i++) {
      const x = -140 + i * 34 + r.range(-6, 6), z = 46 + r.range(0, 40) + Math.max(0, x) * 0.12, fl = r.int(10, 30), h = fl * 3.2, w = r.range(18, 30), d = r.range(14, 22);
      const tx = lbHotelTex(100 + i, fl, Math.round(w / 3.2));
      const m = new THREE.MeshStandardMaterial({ map: tx.map, emissiveMap: tx.glow, emissive: '#ffffff', emissiveIntensity: 0.0, roughness: 0.6, metalness: 0.1 });
      const b = lbBox(w, h, d, m, x, h / 2, z, scene); hotels.push(m); b.receiveShadow = true;
    }
  }
  const frondM = new THREE.MeshStandardMaterial({ map: lbFrondTex(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 });
  for (const [x, z, h, l, sd] of [[-16, 14, 9, 0.22, 1], [-7, 17, 10.5, 0.12, 2], [5, 13, 8.5, 0.3, 3], [14, 16, 11, 0.1, 4], [24, 12, 9.5, 0.25, 5], [-26, 11, 8, 0.3, 6], [36, 15, 10, 0.18, 7], [-9, 4.5, 7.5, 0.35, 8]]) lbPalm(scene, x, z, h, l, sd, frondM);
  const canvasT = lbTex(lbCanvas(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f2efe6' : '#d0503a'; g.fillRect(i * w / 8, 0, w / 8, h); } }), { repeat: false });
  const umbM = lbStd('#ffffff', 0.8, 0, { map: canvasT, side: THREE.DoubleSide });
  for (const [x, z] of [[-6, 0.5], [3.5, -1.5], [10, 1.5], [-14, -0.5], [18, -2]]) {
    const u = new THREE.Group(); u.position.set(x, 0, z); scene.add(u);
    lbCyl(0.025, 0.025, 2.3, lbStd('#dcd8d0', 0.4, 0.5), 0, 1.15, 0, u, 6);
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.45, 16, 1, true), umbM); c.position.y = 2.2; c.castShadow = true; u.add(c);
  }
  const towelM = [lbStd('#2f6fae', 0.9), lbStd('#e2b640', 0.9), lbStd('#c8433a', 0.9)];
  [[-5, -0.8], [4.2, -2.8], [11, 0.2]].forEach(([x, z], i) => { const tw = lbBox(0.9, 0.01, 1.8, towelM[i], x, 0.006, z, scene); tw.rotation.y = 0.2 * i; });
  const people = [
    { id: 'lbH1', look: 'casual4', at: [-2.2, -3.0], face: 200 - 200, act: 'lbLookUp' },
    { id: 'lbH2', look: 'lbNeighbour', at: [1.2, -4.4], face: -20, act: 'lbLookUp2' },
    { id: 'lbH3', look: 'casual7', at: [4.8, -2.2], face: 10, act: 'lbLookUp' },
    { id: 'lbH4', look: 'casual3', at: [-8.5, -4.8], face: -30, act: 'lbLookUp2' },
    { id: 'lbH5', look: 'casual1', at: [8.6, -5.2], face: 25, act: 'lbLookUp' },
    { id: 'lbH6', look: 'casual8', at: [-12.5, -2.5], face: 5, act: 'lbLookUp2' },
    { id: 'lbH7', look: 'lbStudent2', at: [13.5, -3.6], face: -10, act: 'lbLookUp' },
  ].map((q) => {
    const p = lbPerson({ id: q.id, look: q.look, path: [[0, q.at[0], q.at[1]]], face: q.face, states: [[0, 'idle'], [LB.out + 1.2 + lbR(q.at[0] * 10, 4) * 1.5, q.act]] }, scene);
    p.root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    // (a phone in the right hand: its screen, and its torch once it is dark)
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.14), new THREE.MeshBasicMaterial({ color: '#cfe2ff' })); ph.position.set(0, -0.06, 0.03); ph.rotation.x = -Math.PI / 2; p.j.ra.hand.add(ph);
    p.phone = ph; p.lbAct = q.act; return p;
  });
  const torches = lbPuffs(scene, 200, { additive: true, soft: 1.5 });

  const set = {
    scene, camera: cam, sky,
    cuts() { return [lbCap('black', 2).show - 0.4]; },
    frame(t, shot) {
      const m = shot.mode, s = lbStoryAt(t);
      let pos = [1.5, 1.6, 4.5], at = lbAimH(pos, 192, 22), fov = 72, drift = 0.004, sk = { t, F: lbFrame(s, LBP.hawaii.lat, LBP.hawaii.lon) };
      cam.near = 0.05; cam.far = 7000;
      const Ls = lbLocal(lbSunDir(s), sk.F, AZ);
      if (m === 'noon') { const k = K(t, LB.hawaii, LB.black, (x) => x); pos = [lbLerp(1.6, 1.2, k), 1.62, lbLerp(5.5, 4.2, k)]; at = lbAimH(pos, lbLerp(190, 186, k), lbLerp(20, 24, k)); fov = 76; }
      else if (m === 'black') {
        const c2 = lbCap('black', 2).show - 0.4;
        if (t < c2) {
          // (from over the dark sea round to the east, where Orion's mirror image comes out)
          const k = K(t, LB.black, c2); pos = [0.5, 1.5, 3.0]; at = lbAimH(pos, lbLerp(165, 114, k), lbLerp(18, 22, k)); fov = 64; sk.starSize = 1.5; }
        else { const k = K(t, c2, LB.half, (x) => x); pos = [lbLerp(-1.0, -1.6, k), 1.55, -6.5]; at = lbAimH(pos, lbLerp(25, 15, k), 8); fov = 66; }
      } else if (m === 'wait') { const k = K(t, LB.wait, LB.voyager, (x) => x); pos = [lbLerp(-3.6, -3.2, k), 0.55, lbLerp(-6.4, -6.9, k)]; at = lbAimH(pos, 30, 18); fov = 62; drift = 0.003; sk.starSize = 1.5; }
      else if (m === 'return') { const k = K(t, LB.ret, LB.sunClose, (x) => x);
        const a = (Math.atan2(Ls[0], -Ls[2]) / LB_D2R + AZ + 360) % 360, e = Math.asin(Ls[1]) / LB_D2R;
        pos = [lbLerp(-0.6, -0.4, k), 1.3, lbLerp(1.0, 0.6, k)]; at = lbAimH(pos, a, e - lbLerp(18, 12, k)); fov = 70; }
      else if (m === 'sun') { pos = [0, 1.6, 0]; at = [Ls[0] * 40, 1.6 + Ls[1] * 40, Ls[2] * 40]; fov = 0.8; drift = 0.00001; cam.near = 1; Object.assign(sk, { k: 0, discK: 0.07, face1: 1, starK: 0 }); }
      { const d = lbDrift(t, drift, 0.3, 17); lbCam(cam, [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]], at, fov); }
      const stt = sky.update(s, cam, app.renderH || 1080, sk);
      const L1 = stt.L1, k1 = stt.k1 * stt.day1, dayK = MathX.clamp(k1, 0, 2.2);
      // the light: the Sun (out from 10:00:00), the sky; when it's dark only the hotels' rooms and the phones
      S.sun.intensity = 2.7 * k1; { const c = [cam.position.x, 0, cam.position.z - 6]; S.sun.position.set(c[0] + L1[0] * 150, L1[1] * 150, c[2] + L1[2] * 150); S.sun.target.position.set(...c); S.sun.target.updateMatrixWorld(); S.sun.castShadow = k1 > 0.02; }
      { const T = 5772 * Math.pow(Math.max(1, stt.sun.k), 0.25), c = lbStarRGB(T); S.sun.color.setRGB(c[0], c[1], c[2]); }
      S.hemi.intensity = 0.035 + 0.55 * Math.min(dayK, 1.6); scene.environmentIntensity = 0.01 + 0.6 * Math.min(dayK, 1.6);
      scene.fog.color.setRGB(0.78 * Math.min(1, dayK), 0.85 * Math.min(1, dayK), 0.91 * Math.min(1, dayK));
      seaU.uT.value = t; seaU.uK.value = Math.min(dayK, 1.8); seaU.uSun.value.set(...L1); seaU.uLamp.value = 1 - Math.min(1, dayK);
      seaU.uTop.value.setRGB(0.24 * dayK, 0.47 * dayK, 0.75 * dayK).multiplyScalar(1 / Math.max(1, dayK)); seaU.uHor.value.setRGB(0.72, 0.82, 0.9);
      const night = 1 - MathX.smooth(dayK, 0.0, 0.25);
      for (const h of hotels) h.emissiveIntensity = 0.15 + 0.75 * night;
      torches.begin();
      for (const p of people) {
        p.update(t);
        const on = night > 0.5 && s > 1.5;
        p.phone.material.color.set(on ? '#dbe8ff' : '#1a1c20');
        if (on && p.lbAct === 'lbLookUp') { const w = new THREE.Vector3(); p.j.ra.hand.getWorldPosition(w); torches.add(w.x, w.y + 0.05, w.z, 0.16, 0.22 * night, 1, 0.97, 0.9); torches.add(w.x, w.y + 0.05, w.z, 0.04, 0.8 * night, 1, 1, 1); }
      }
      torches.end();
      this._k = dayK; this._s = s; this._st = stt;
    },
    labels(t) {
      const m = lbShotAt(t).mode, out = [], W = StoryHUD.win;
      if (m === 'black' && t < lbCap('black', 2).show - 0.4 && sky.named.ALNILAM) out.push({ p: sky.at('ALNILAM', 400), text: 'ORION', sub: 'AT NOON', a: W(t, lbFilmAt(sky.named.ALNITAK.t, LB.black, lbCap('black', 2).show) + 0.5, lbCap('black', 2).show - 0.6, 0.3, 0.2) });
      if (m === 'return') out.push({ p: sky.at('SUN', 400), text: 'THE SUN', sub: 'BACK AFTER 8 MIN 16 s', a: W(t, LB.back + 0.6, LB.sunClose - 0.3, 0.3, 0.2) });
      return out;
    },
    grade(t, p, shot) {
      const k = this._k || 0, m = shot.mode;
      p.exposure = lbLerp(1.4, 1.0, MathX.clamp(k, 0, 1)) - 0.12 * MathX.clamp(k - 1, 0, 1); p.bloom = lbLerp(0.3, 0.3, MathX.clamp(k, 0, 1)); p.saturation = lbLerp(0.85, 1.08, MathX.clamp(k, 0, 1));
      if (m === 'sun') { p.exposure = 1.0; p.bloom = 0.25; p.vignette = 0.3; }
    },
  };
  return set;
};
