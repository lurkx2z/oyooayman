/* =====================================================================
   FX — everything that is dust, sparks, fire and water in the air. All of it is rebuilt from scratch every frame as a
   pure function of story time s (physics.js) and, for slow boiling only, film time t.
     the scour     (world.js, in the ground's own material) the air tearing dust off the stopped ground
     motes         specks in the air: they travel with it (still beside a travelling camera, streaming past a standing one)
     trails        the dust behind everything that slides: buildings, the station, people and things once they land
     sparks        steel on stone and steel on steel: column feet, the train's locked wheels, the wagons
     the hill      everything that reaches the rock (physics.js ES_HITS): a flash, a splash of dust; the curtain of dust
                   the wind drives up the face; the six fuel wagons: a carpet of fire laid on the rock face and the
                   slope above it (one shader on a sheet that follows the ground), black smoke driven over the top
     the sea       a wall of water climbing from the quay (ESP.wallH), its top torn east by the wind; foam at its foot;
                   the ferry. The sun is low in the west, behind it: from the land the wall is a dark body with the sun
                   in its spray, and it throws a real shadow (an unseen sheet in the sun's shadow map) that crosses
                   the station, the town and the plain within a third of a second. lit(x, y) is that shadow for
                   everything drawn without the lights (dust, smoke, spray)
     5:42:01       everything the ground stopped is thrown west at 465 m/s (ESP.blastX): the fire, the dust, the wall
     esBuildFx(S, { W, St, Tr }) → { update(s, t, mode, camera) , fire(s) → 0…1 , light , lit(x, y, s) → 0…1 , firePos(s) }
   ===================================================================== */

const ES_FXGLSL = `
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
  float fbm(vec2 p){ return 0.5 * vn(p) + 0.25 * vn(p * 2.03 + 1.7) + 0.125 * vn(p * 4.01 + 3.1) + 0.0625 * vn(p * 8.1 + 0.7); }
  // black smoke → deep red → orange → yellow (h = 0…1)
  vec3 fireCol(float h){ vec3 c = mix(vec3(0.028, 0.024, 0.022), vec3(0.62, 0.05, 0.008), smoothstep(0.12, 0.34, h)); c = mix(c, vec3(2.3, 0.56, 0.05), smoothstep(0.32, 0.6, h)); return mix(c, vec3(3.3, 2.1, 0.72), smoothstep(0.64, 0.97, h)); }`;

function esBuildFx(S, parts) {
  const scene = S.scene, P = ESP, F = ES_F, { St, Tr } = parts, out = {};
  const duP = esPuffs(scene, 16000, { soft: 1.1, billow: 0.9 });                              // dust, smoke, spray
  const fi = esPuffs(scene, 7000, { additive: true, soft: 0.8, billow: 0.9, fogK: 0.35 });    // fire
  const sp = esPuffs(scene, 9000, { additive: true, soft: 1.0, fogK: 0.5 });                  // sparks, flashes
  duP.mesh.renderOrder = 5; fi.mesh.renderOrder = 6; sp.mesh.renderOrder = 7;
  const H = (i, k = 0) => hash1(i * 131.7 + k * 17.31 + 3.3);
  const CL = F.hill.cliff, V = P.v, G = P.g;
  // ------------------------------------------------------------------ the sea's shadow
  // a ray from (x, y) to the sun crosses the quay's plane 0.12 m higher for every metre of x: below the wall's top
  // there, the point is in its shadow. (The wall's torn top third lets about half the light through.)
  const SLOPE = ES_SUN[1] / -ES_SUN[0], WTOP = 0.86;
  let _hw = 0, _xw = F.quay.x;                              // this frame's wall: its height and where it stands
  const litAt = (x, y) => (_hw < 1 || x < _xw ? 1 : MathX.smooth(y + SLOPE * (x - _xw) - _hw * WTOP, -0.2 * _hw, 0.1 * _hw));
  out.lit = (x, y, s) => { const h = P.wallH(s) * WTOP; return h < 1 || x < F.quay.x + 0.1 * h ? 1 : MathX.smooth(y + SLOPE * (x - F.quay.x) - h, -0.2 * h / WTOP, 0.1 * h / WTOP); };
  // dust, smoke and spray are drawn without the lights: in the shadow they go to 40% and cooler
  const du = {
    add(x, y, z, size, a, r, g, b, seed) { const k = litAt(x, y); duP.add(x, y, z, size, a, r * (0.36 + 0.64 * k), g * (0.4 + 0.6 * k), b * (0.47 + 0.53 * k), seed); },
    begin() { duP.begin(); }, end() { duP.end(); },
  };

  // ------------------------------------------------------------------ what slides (rest position; s0 = when it starts)
  const emit = St.emit.map((e, i) => ({ id: i, xW: e[1], z0: e[2], z1: e[3], k: e[4], s0: 0, w: e[0] - e[1] }));
  for (const q of St.people) {                             // people: once they have dropped off the platform's end
    const sEnd = (F.plat.x[1] - q.x) / V, land = sEnd + Math.sqrt(2 * (q.y - 0.1) / G);
    emit.push({ id: emit.length, xW: q.x - 0.4, z0: q.z - 0.5, z1: q.z + 0.5, k: 0.45, s0: land, w: 0.8 });
  }
  // steel on the ground: [rest x, z, y, kind]   kind 0 = a canopy column's foot, 1 = a wheel of your train, 2 = a wagon's wheel
  const contacts = [];
  St.colFeet.forEach(([x, z]) => contacts.push({ x, z, kind: 0 }));
  Tr.wheels.forEach(([dx, z]) => contacts.push({ dx, z, kind: 1 }));
  for (let k = 0; k < F.wagons.n; k++) for (const dx of [-2, -11.5]) for (const sz of [-1, 1]) contacts.push({ x: F.wagons.front - k * F.wagons.L + dx, z: F.wagons.z + sz * 0.72, kind: 2, wagon: k });
  const sFold = P.roofFree + Math.sqrt(2 * F.plat.h / G);
  // the rock face's height at z; a point pushed against the hill: above the rock face it lies back onto the slope
  const pin = (x, y, z, o) => {
    const hx = esHillX(z);
    if (y > CL * 0.96) { const xx = hx + 4 + (y - CL * 0.96) * 2.3; o[0] = xx; o[1] = esGroundY(xx, z) + 2 + (y - CL) * 0.16; o[2] = z; }
    else { o[0] = Math.min(x, hx - 0.6); o[1] = y; o[2] = z; }
    return o;
  };
  const _o = [0, 0, 0];

  // ------------------------------------------------------------------ the sea's wall: three sheets (a shader each)
  const fogU = { fogCol: { value: new THREE.Color('#e8c8a0') }, fogDen: { value: 0.0003 } };
  const sunU = { value: new THREE.Vector3(...ES_SUN).normalize() }, backU = { value: 1 }, sharpU = { value: 0 };   // (sharpU: 1 on the long lens of the Sun's shot: a harder, finer edge)
  const sheet = (seed, a, order, rim = 1) => {
    const g = new THREE.PlaneGeometry(9000, 1, 180, 28); g.translate(0, 0.5, 0);
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: Object.assign({ uH: { value: 1 }, uX0: { value: F.quay.x }, uLean: { value: 0.3 }, uT: { value: 0 }, uA: { value: a }, uSeed: { value: seed }, uRise: { value: 0 }, uSun: sunU, uBack: backU, uSharp: sharpU, uRim: { value: rim } }, fogU),
      vertexShader: `uniform float uH, uX0, uLean, uT, uSeed; varying vec2 vUv; varying vec3 vW; varying float vD;
        void main(){ vUv = uv; float h = uv.y * uH, zz = position.x;
          float wob = (sin(zz * 0.013 + uv.y * 5.0 + uT * 0.7 + uSeed) * 0.012 + sin(zz * 0.041 + uT + uSeed * 3.0) * 0.006) * uH * (0.3 + uv.y);
          vec3 w = vec3(uX0 + uLean * pow(uv.y, 1.7) * uH + wob, h - 4.0, zz);
          vW = w; vec4 mv = viewMatrix * vec4(w, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uH, uT, uA, uSeed, uRise, uBack, uSharp, uRim, fogDen; uniform vec3 fogCol, uSun; varying vec2 vUv; varying vec3 vW; varying float vD; ${ES_FXGLSL}
        void main(){
          float yy = vW.y - uRise;                                                    // (the pattern is carried up with the water)
          vec2 q = vec2(vW.z * 0.021 + uSeed * 7.0, yy * 0.0055);
          float n = fbm(q), n2 = fbm(q * vec2(3.3, 0.5) + 5.0 + uSeed), n3 = fbm(vec2(vW.z * 0.17, yy * 0.028) + uSeed * 3.0), n4 = fbm(vec2(vW.z * 0.6, yy * 0.05) + 9.0);
          float crest = fbm(vec2(vW.z * 0.0045 + uSeed * 3.0, 0.3)) - 0.5;            // (its top's height wanders along the shore)
          float n5 = fbm(vec2(vW.z * 2.6 + uSeed * 11.0, yy * 0.33));                         // (fine teeth: they only show on the long lens)
          float rag = vUv.y + crest * 0.3 + (n - 0.5) * 0.12 + (n3 - 0.5) * 0.08 + (n4 - 0.5) * 0.04 + (n5 - 0.5) * 0.022 * uSharp;
          float top = 1.0 - smoothstep(mix(0.86, 0.9, uSharp), mix(0.97, 0.908, uSharp), rag);                              // torn at the top
          float thick = 1.0 - smoothstep(mix(0.74, 0.878, uSharp), mix(0.9, 0.9, uSharp), rag);                            // 1: the body of water · 0: spray
          float veins = smoothstep(0.5, 0.78, n2 * 0.62 + n3 * 0.4 + n4 * 0.12);      // white water running up it
          float mist = 1.0 - smoothstep(0.0, 0.16, vUv.y + (n3 - 0.5) * 0.1);         // white water at its foot
          vec3 body = mix(vec3(0.03, 0.115, 0.125), vec3(0.11, 0.3, 0.3), n * 0.9);
          vec3 V = normalize(vW - cameraPosition);
          float back = uBack;                                                         // 1: seen from the land (the sun is behind it)
          float toSun = pow(max(dot(V, uSun), 0.0), 7.0);
          vec3 sunC = vec3(1.0, 0.68, 0.38);
          // the side in the sun: green water, white foam, all of it golden
          vec3 lit = mix(body * (0.55 + 0.7 * n4), vec3(0.86, 0.87, 0.82), min(1.0, veins * 0.75 + (1.0 - thick) * 0.7 + mist)) * (0.25 + 0.95 * sunC);
          // the dark side: slate water, its foam grey; only the spray torn off its top is full of the sun
          vec3 dark = mix(body * 0.2, vec3(0.1, 0.125, 0.15), veins * (0.5 + 0.5 * n4));
          dark = mix(dark, vec3(0.2, 0.235, 0.27), mist * 0.8);
          dark = mix(dark, mix(vec3(0.17, 0.2, 0.235), sunC * (0.8 + 2.8 * toSun) * (0.5 + 0.7 * n3), uRim), (1.0 - thick) * 0.95);   // (uRim: only the tallest sheet's top is in the sun)
          vec3 col = mix(lit, dark, back);
          float a = uA * top * mix(0.5, 1.0, thick) * smoothstep(0.0, 0.004, vUv.y);
          a = min(1.0, a + back * thick * top * 0.3);
          float f = (1.0 - exp(-fogDen * vD)) * (1.0 - 0.5 * (1.0 - thick) * back); gl_FragColor = vec4(mix(col, fogCol, f), a); }`,
    });
    const o = new THREE.Mesh(g, m); o.frustumCulled = false; o.renderOrder = order; o.rotation.y = 0; scene.add(o);
    return o;
  };
  // (the sheets' geometry runs along x: the shader lays it out along z itself)
  const wall = [sheet(0.11, 0.96, 3), sheet(0.57, 0.8, 3.2, 0.12), sheet(0.83, 0.7, 2.8, 0.12)];
  // what throws the wall's shadow: an unseen sheet standing where the wall stands (it writes no colour and no depth;
  // the sun's shadow map draws it), with a ragged top
  const caster = (() => {
    const tex = esTex(esCanvas(1024, 256, (g, w, h) => {
      const img = g.createImageData(w, h), d = img.data;
      for (let x = 0; x < w; x++) {
        const edge = 0.8 + 0.13 * noise1(x * 0.011, 71) + 0.05 * noise1(x * 0.06, 73) + 0.02 * noise1(x * 0.3, 79);   // its top (0…1 of the height)
        for (let y = 0; y < h; y++) {
          const v = 1 - y / h, over = (v - edge) / 0.26;                                              // > 0: in the torn part
          const on = over < 0 ? 1 : 0;
          const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = on * 255;
        }
      }
      g.putImageData(img, 0, 0);
    }), { srgb: false });
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(9, 1);
    const g = new THREE.PlaneGeometry(9000, 1, 1, 1); g.translate(0, 0.5, 0); g.rotateY(Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, colorWrite: false, depthWrite: false, side: THREE.DoubleSide });
    const o = new THREE.Mesh(g, m); o.castShadow = true; o.frustumCulled = false; o.visible = false; o.position.set(F.quay.x, -2, 0); scene.add(o);
    return o;
  })();
  // foam where the sea meets the quay (a strip on the surface)
  const foam = (() => {
    const g = new THREE.PlaneGeometry(1, 9000, 1, 1); g.rotateX(-Math.PI / 2);
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -16,
      uniforms: Object.assign({ uA: { value: 0 }, uX: { value: 0 }, uW: { value: 100 }, uX0: { value: F.quay.x } }, fogU),
      vertexShader: `uniform float uW, uX0; varying vec3 vW; varying float vD, vK; void main(){ vK = position.x + 0.5; vec3 w = vec3(uX0 - (0.5 - position.x) * uW, ${(F.sea.level + 0.3).toFixed(2)}, position.z); vW = w; vec4 mv = viewMatrix * vec4(w, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uA, uX, fogDen; uniform vec3 fogCol; varying vec3 vW; varying float vD, vK; ${ES_FXGLSL}
        void main(){ float n = fbm(vec2((vW.x - uX) * 0.05, vW.z * 0.09)), n2 = fbm(vec2((vW.x - uX) * 0.3, vW.z * 0.5) + 3.0);
          float v = n * 0.6 + n2 * 0.4, th = mix(0.74, 0.4, vK * vK); float a = uA * smoothstep(th, th + 0.12, v);
          float f = 1.0 - exp(-fogDen * vD); gl_FragColor = vec4(mix(vec3(0.93, 0.95, 0.94) * (0.8 + 0.25 * n2), fogCol, f), a); }`,
    });
    const o = new THREE.Mesh(g, m); o.frustumCulled = false; o.renderOrder = 2; scene.add(o); return o;
  })();
  // ------------------------------------------------------------------ the fire: a carpet on the rock face and the slope
  // a sheet that follows the ground: up the rock face (1.7 m off it), over its top and 520 m up the slope beyond
  // (2 m above it). vA = the way along it from the foot of the rock, in metres: the wind drives the fire that way
  const carpet = (() => {
    const NZ = 220, NA = 76, Z0 = -520, Z1 = 520, pos = [], aa = [], idx = [];
    for (let j = 0; j <= NZ; j++) {
      const z = Z0 + (Z1 - Z0) * j / NZ, hx = esHillX(z), cl = esGroundY(hx + 3.1, z);
      for (let i = 0; i <= NA; i++) {
        const u = i / NA; let x, y, a;
        if (u < 0.2) { const k = u / 0.2; y = 0.15 + k * (cl + 1.6); x = hx - 1.7 + 2.4 * k * k * k; a = y; }
        else { const d = 520 * Math.pow((u - 0.2) / 0.8, 1.45); x = hx + 0.7 + d; y = Math.max(cl + 1.75, esGroundY(x, z) + 2.0) + 0.012 * d; a = cl + 1.75 + d; }
        pos.push(x, y, z); aa.push(a);
      }
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const k = j * (NA + 1) + i; idx.push(k, k + 1, k + NA + 1, k + 1, k + NA + 2, k + NA + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(aa, 1)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: Object.assign({ uR: { value: 5 }, uFire: { value: 0 }, uT: { value: 0 }, uShift: { value: 0 }, uZc: { value: F.wagons.z }, uSmoke: { value: 0 }, uA: { value: 1 } }, fogU),
      vertexShader: `attribute float aA; uniform float uShift; varying vec3 vW; varying float vA, vD; void main(){ vec3 w = position; w.x -= uShift; vW = w; vA = aA; vec4 mv = viewMatrix * vec4(w, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uR, uFire, uT, uZc, uSmoke, uA, fogDen; uniform vec3 fogCol; varying vec3 vW; varying float vA, vD; ${ES_FXGLSL}
        void main(){
          float zr = (vW.z - uZc) / (uR * 1.3), ar = (vA - 2.0) / (uR * 2.5 + 8.0);
          vec2 q = vec2(vW.z * 0.034, vA * 0.017 - uT * 1.15);                         // tongues, running up and over
          float w1 = fbm(q * 0.6 + vec2(0.0, uT * 0.23)), n = fbm(q + vec2(w1 * 1.5, w1 * 0.7)), n2 = fbm(q * 3.4 + vec2(3.0, -uT * 1.9));
          float d = length(vec2(zr, ar));
          float core = uFire * (1.0 - smoothstep(0.1, 1.0, d + (n - 0.5) * 0.75));
          float heat = clamp(core * (0.1 + 2.1 * n * n2 + 0.25 * n2), 0.0, 1.0);
          // its smoke: wider, and far longer down the wind
          float ds = length(vec2(zr * 0.75, (vA - 2.0) / (uR * 5.5 + 30.0)));
          float smoke = uSmoke * (1.0 - smoothstep(0.25, 1.0, ds + (n - 0.5) * 0.6)) * (0.55 + 0.6 * n2);
          vec3 col = fireCol(heat);
          float a = max(smoothstep(0.03, 0.22, core) * (0.72 + 0.28 * n2), smoothstep(0.08, 0.5, smoke) * 0.9);
          float f = (1.0 - exp(-fogDen * vD)) * (1.0 - 0.8 * heat); gl_FragColor = vec4(mix(col, fogCol, f), a * uA); }`,
    });
    const o = new THREE.Mesh(g, m); o.frustumCulled = false; o.renderOrder = 4; o.visible = false; scene.add(o); return o;
  })();
  // ------------------------------------------------------------------ 5:42:01: the wall of everything the hill stopped
  const blast = (() => {
    const g = new THREE.PlaneGeometry(2400, 1, 120, 24); g.translate(0, 0.5, 0);
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: Object.assign({ uH: { value: 120 }, uX0: { value: 600 }, uT: { value: 0 }, uA: { value: 0 }, uHot: { value: 1 }, uLit: { value: 0.4 } }, fogU),
      vertexShader: `uniform float uH, uX0, uT; varying vec2 vUv; varying vec3 vW; varying float vD;
        void main(){ vUv = uv; float zz = position.x, h = uv.y * uH;
          float bulge = (sin(zz * 0.021 + uT * 0.6) + sin(zz * 0.057 - uT * 0.4 + uv.y * 4.0)) * 4.0 - 30.0 * uv.y * uv.y - 0.00018 * zz * zz;   // (its foot leads; it lies back with height and to the sides)
          vec3 w = vec3(uX0 - bulge, h - 1.0, zz - 9.0); vW = w; vec4 mv = viewMatrix * vec4(w, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uH, uT, uA, uHot, uLit, fogDen; uniform vec3 fogCol; varying vec2 vUv; varying vec3 vW; varying float vD; ${ES_FXGLSL}
        void main(){
          vec2 q = vec2(vW.z * 0.019, vW.y * 0.024 - uT * 0.5);
          float w1 = fbm(q * 1.4 + vec2(uT * 0.13, 0.0)), n = fbm(q + vec2(w1 * 1.7, w1 * 1.0)), n2 = fbm(q * 3.3 + 7.0 - vec2(0.0, uT * 0.9));
          float zf = abs(vW.z + 9.0), hot = uHot * (1.0 - smoothstep(90.0, 400.0, zf)) * (1.0 - smoothstep(0.3, 1.0, vUv.y) * 0.8);
          float heat = clamp(hot * (0.06 + 2.0 * n * n2 + 0.2 * n2), 0.0, 1.0);
          // dust and torn ground where it is not burning: brown, boiling, darker in the folds
          vec3 dust = mix(vec3(0.13, 0.105, 0.085), vec3(0.62, 0.5, 0.37), smoothstep(0.25, 0.85, n2 * 0.7 + n * 0.4)) * uLit;
          vec3 col = mix(dust, fireCol(heat), smoothstep(0.1, 0.3, heat) * 0.92 + 0.08 * hot);
          float a = uA * (1.0 - smoothstep(0.6, 1.0, vUv.y + (n - 0.5) * 0.55)) * (1.0 - smoothstep(900.0, 1200.0, zf));
          float f = (1.0 - exp(-fogDen * vD)) * (1.0 - 0.75 * heat); gl_FragColor = vec4(mix(col, fogCol, f), a); }`,
    });
    const o = new THREE.Mesh(g, m); o.frustumCulled = false; o.renderOrder = 4.5; o.visible = false; scene.add(o); return o;
  })();
  // the fire's light on everything (no fall-off of its own: the set gives it one from how far its subject is)
  const light = new THREE.PointLight('#ff7a2e', 0, 0, 0); light.position.set(590, 30, -9); scene.add(light); out.light = light;

  // how much fuel fire there is at story s (0…1)
  const WH = []; for (let k = 0; k < F.wagons.n; k++) WH.push(P.wagonHit(k));
  out.fire = (s) => { let f = 0; for (const w of WH) if (s > w) f += (1 - Math.exp(-(s - w) / 0.03)) / WH.length; return f; };
  // where the fire is (its foot): at the rock; after 5:42:01, thrown west with everything the hill stopped
  out.firePos = (s) => [s < P.T ? 594 : P.blastX(s) - 6, 22, F.wagons.z];
  // the fire's reach along the rock (m) at story s
  const fireR = (s) => (s <= WH[0] ? 0 : 6 + 150 * (1 - Math.exp(-(s - WH[0]) / 0.11)));
  // the ferry's and the boats' moments at the quay
  const boatHit = F.boats.map(([x]) => (F.quay.x - 1.2 - (x + 4.5)) / V);

  out.update = (s, t, m, cam) => {
    const X = P.X(s), on = MathX.smooth(s, 0, 0.004), cx = cam.position.x, cy = cam.position.y, cz = cam.position.z, N = P.nose(s);
    const w1 = Math.max(0, s - P.T), shift = V * w1;       // after 5:42:01: how far west the stopped things have been thrown
    const far = (x, z) => Math.hypot(x - cx, z - cz);
    const Hh = Math.max(0.5, P.wallH(s));
    _hw = s > 0.0005 ? Hh : 0; _xw = F.quay.x + 0.1 * Hh - shift;
    du.begin(); fi.begin(); sp.begin();
    if (scene.fog) { fogU.fogCol.value.copy(scene.fog.color); fogU.fogDen.value = scene.fog.density; }
    const inside = m === 'inside' || m === 'question';

    // ---------------------------------------------------------------- motes: specks carried by the air
    if (on > 0 && !inside) {
      for (let i = 0; i < 120; i++) {
        const bx = ((H(i, 1) * 80 + X - cx) % 80 + 80) % 80 - 40, bz = ((H(i, 2) * 56 - cz) % 56 + 56) % 56 - 28, y = 0.25 + H(i, 3) * H(i, 3) * 15;
        const d = Math.hypot(bx, bz, y - cy); if (d < 2.2) continue;
        const wx = cx + bx, wz = cz + bz; if (y < esGroundY(wx, wz) + 0.1 || wx > esHillX(wz) - 1) continue;
        du.add(wx, y + 0.3 * noise1(t * 0.2, i), wz, 0.04 + 0.06 * H(i, 4), 0.34 * on * MathX.clamp((40 - d) / 12, 0, 1), 0.86, 0.74, 0.56, H(i, 5));
      }
    }
    // ---------------------------------------------------------------- trails: the dust behind everything that slides
    if (on > 0) {
      const sl = Math.min(s, P.T);
      for (const e of emit) {
        if (sl <= e.s0) continue;
        const len = V * (sl - e.s0), rear = e.xW + X, zc = (e.z0 + e.z1) / 2, d = far(rear, zc);
        if (d > 1100) continue;
        const n = d < 160 ? 13 : d < 420 ? 8 : 4, L = Math.min(len, 60 + 40 * e.k), fade = Math.min(1, len / 6);
        for (let i = 0; i < n; i++) {
          const h = H(e.id * 37 + i, 6), f = (i + h) / n, dd = f * f * L, x = rear + e.w * 0.3 - dd + 1.5 * noise1(t * 0.25 + i, e.id);
          const z = e.z0 + (e.z1 - e.z0) * H(e.id * 37 + i, 7), y = 0.5 + (0.6 + 1.4 * e.k) * (0.35 + f * 1.3) * (0.6 + 0.8 * h);
          const sz = (1.6 + 2.6 * e.k) * (0.6 + 1.5 * f) * (0.75 + 0.5 * h), c = 0.8 + 0.3 * H(e.id * 37 + i, 8);
          du.add(x, y, z, sz, 0.3 * fade * (1 - f * 0.75), 0.74 * c, 0.6 * c, 0.44 * c, h);
        }
      }
      // the palms' trunks dragging (near the camera only)
      for (let i = 0; i < ES_PALMS.length; i++) {
        const p = ES_PALMS[i], x = p[0] + X; if (far(x, p[1]) > 140 || x > esHillX(p[1]) - 2) continue;
        for (let j = 0; j < 3; j++) du.add(x - 0.5 - j * 2.2, 0.4 + 0.3 * j, p[1] + 0.4 * (H(i, j) - 0.5), 0.9 + 0.6 * j, 0.28 * on * (1 - j * 0.28), 0.72, 0.6, 0.44, H(i, 9 + j));
      }
    }
    // ---------------------------------------------------------------- sparks
    if (s > 0 && s < P.T + 0.004) {
      const off = s < P.T ? 1 : 1 - (s - P.T) / 0.004;
      for (let c = 0; c < contacts.length; c++) {
        const q = contacts[c];
        let x, y, z = q.z, str = 1, n = 12;
        if (q.kind === 0) { x = q.x + X; if (x < F.plat.x[1]) y = F.plat.h + 0.03; else if (s > sFold) { y = 0.05; str = 0.8; } else continue; }
        else if (q.kind === 1) { x = N + q.dx; y = F.rail + 0.02; n = 22; str = 1.3; }
        else { x = q.x + X - 0.5; if (x > esHillX(F.wagons.z) - 1) continue; y = F.rail + 0.02; n = 11; }
        const d = far(x, z);
        if (d > 520) continue;
        // (far away: one glow per contact, so the wide views show lines of glowing points)
        sp.add(x - 0.25, y + 0.06, z, d < 40 ? 0.26 : 0.5 + d * 0.012, (d < 40 ? 0.6 : 0.8) * off * str, 1, 0.7, 0.3);
        if (d > 110) continue;
        for (let j = 0; j < n; j++) {
          const id = c * 53 + j, life = 0.025 + 0.06 * H(id, 1), a = ((s / life + H(id, 2)) % 1) * life;
          if (s - a < 0) continue;
          const tau = 0.01 + 0.022 * H(id, 3), k = 1 - a / life, back = V * tau * (1 - Math.exp(-a / tau));
          const vy = 3 + 34 * H(id, 4) * H(id, 4), vz = (H(id, 5) - 0.5) * 22;
          sp.add(x - back, y + vy * a - 0.5 * G * a * a + 0.02, z + vz * a, (0.03 + 0.05 * H(id, 6)) * (0.6 + 0.4 * k) * (d > 25 ? 1 + (d - 25) * 0.03 : 1), 1.0 * off * k, 1, 0.5 + 0.4 * k, 0.1 + 0.5 * k * k);
        }
      }
      // ground dust where the wagons plough on beyond the end of their rails (x > 404)
      for (let k = 0; k < F.wagons.n; k++) {
        const fx = F.wagons.front - k * F.wagons.L + X; if (fx < F.track.siding[1] || fx - 14 > esHillX(F.wagons.z) || far(fx, F.wagons.z) > 300) continue;
        for (let j = 0; j < 8; j++) { const h = H(k * 19 + j, 11); du.add(Math.min(fx, 599) - 2 - j * 2.4, 0.5 + 0.35 * j * h, F.wagons.z + (h - 0.5) * 3, 1.3 + 0.5 * j, 0.42 * (1 - j / 9), 0.66, 0.55, 0.42, h); }
      }
    }
    // ---------------------------------------------------------------- the hill
    const fire = out.fire(s), hot = fire * (s < P.T ? 1 : Math.max(0.6, 1 - w1 * 0.7)), R = fireR(s);
    if (s > 0) {
      // the curtain: dust and torn ground driven up the rock face and over its top by the wind
      const ramp = MathX.smooth(s, 0.01, 0.35);
      for (let i = 0; i < 230; i++) {
        const z = -330 + 660 * H(i, 21), ph = (H(i, 22) + s * 1.9 + t * 0.012) % 1, y = ph * (CL + 30);
        if (Math.abs(z - cz) + Math.abs(600 - cx) > 900) continue;
        pin(esHillX(z) - 1.5 - 2.5 * H(i, 23), y, z, _o);
        du.add(_o[0] - shift * (0.9 + 0.1 * H(i, 24)), _o[1], _o[2], 4 + 7 * ph + 3 * H(i, 25), 0.2 * ramp * Math.sin(Math.PI * Math.min(1, ph * 1.15)), 0.5, 0.4, 0.3, H(i, 26));
      }
      // everything that reaches the rock (but the wagons): a flash, a splash of dust and splinters spreading on the face
      for (let hI = 0; hI < ES_HITS.length; hI++) {
        const h = ES_HITS[hI]; if (h.kind === 'wagon') continue;
        const u = s - h.s; if (u <= 0 || u > 0.9) continue;
        if (far(h.x, h.z) > 900) continue;
        const palm = h.kind === 'palm', n = palm ? 6 : 18, Rm = palm ? 8 : 26, grow = 1 - Math.exp(-u / 0.07);
        if (u < 0.008) sp.add(h.x - 1.5 - shift, h.y, h.z, (palm ? 5 : 16) * (1 + u * 260), 0.9 * (1 - u / 0.008), 1, 0.8, 0.5);
        for (let j = 0; j < n; j++) {
          const id = hI * 29 + j, ang = Math.PI * H(id, 31), rad = Rm * Math.sqrt(H(id, 32)) * grow, rise = 42 * u * (0.4 + H(id, 33));
          pin(h.x - 1 - 4 * H(id, 34) * grow, h.y + Math.sin(ang) * rad * 0.8 + rise, h.z + Math.cos(ang) * rad, _o);
          const c = palm ? [0.33, 0.35, 0.22] : h.kind === 'truck' ? [0.26, 0.24, 0.23] : [0.46, 0.4, 0.33];
          du.add(_o[0] - shift, _o[1], _o[2], (1.6 + 4.6 * grow) * (palm ? 1 : 2.1) * (0.7 + 0.6 * H(id, 35)), 0.55 * Math.exp(-u / 0.5) * Math.min(1, u / 0.0015), c[0], c[1], c[2], H(id, 36));
        }
        // splinters and scraps thrown back off the rock (glowing where they were steel)
        if (u < 0.25) for (let j = 0; j < (palm ? 3 : 10); j++) { const id = hI * 41 + j, vx = 20 + 120 * H(id, 37), vy = 10 + 60 * H(id, 38), vz = (H(id, 39) - 0.5) * 90, dk = 1 - Math.exp(-u / 0.06); sp.add(h.x - 1 - vx * 0.06 * dk - shift, h.y + vy * u - 0.5 * G * u * u, h.z + vz * 0.06 * dk, palm ? 0.12 : 0.22, (palm ? 0.5 : 0.9) * (1 - u / 0.25), 1, 0.7, 0.35); }
      }
    }
    // the fuel wagons: the carpet of fire (laid on the rock and the slope), its body in front of the rock, its smoke
    carpet.visible = R > 0;
    if (R > 0) {
      const U = carpet.material.uniforms, hz = esHillX(F.wagons.z), u0 = s - WH[0];
      U.uR.value = R; U.uFire.value = Math.min(1, 0.4 + 0.75 * fire) * (s < P.T ? 1 : Math.max(0.5, 1 - w1 * 1.2)); U.uT.value = t * 0.42 + s * 26; U.uShift.value = shift; U.uSmoke.value = MathX.smooth(u0, 0.01, 0.2);
      U.uA.value = 1 - MathX.smooth(w1, 0.1, 0.3) * 0.6;
      for (let k = 0; k < WH.length; k++) {
        const u = s - WH[k]; if (u <= 0) continue;
        // each wagon: a white flash, then a ball of fire that the wind flattens on the rock
        if (u < 0.012) sp.add(hz - 3 - shift, 3.5, F.wagons.z, 34 * (1 + u * 220), 1.0 * (1 - u / 0.012), 1, 0.86, 0.62);
        const Rk = 5 + 60 * (1 - Math.exp(-u / 0.2)), heat = 0.4 + 0.6 * Math.exp(-u / 0.3), zc = F.wagons.z + (k - 2.5) * 4;
        for (let j = 0; j < 46; j++) {
          const id = k * 97 + j, ang = Math.PI * H(id, 41), rf = Math.pow(H(id, 42), 0.6), bo = Rk * 0.07;
          const y = 2 + rf * Rk * Math.sin(ang) * 0.8 + 50 * u * H(id, 43) + bo * noise1(t * 0.55 + j, id), z = zc + rf * Rk * Math.cos(ang) * 1.25 + bo * noise1(t * 0.5 + j * 1.7, id + 9);
          pin(hz - 2 - (1.5 + Rk * 0.3 * H(id, 44) * (1 - rf * 0.6)), y, z, _o);
          const T = heat * (1 - 0.7 * rf) + 0.12 * noise1(t * 0.9 + j, id + 5), sz = 2.2 + Rk * (0.14 + 0.2 * H(id, 45));
          // (added light: deep orange, so only where many overlap does it go to yellow)
          fi.add(_o[0] - shift * (0.94 + 0.06 * H(id, 46)), _o[1], _o[2], sz, (0.1 + 0.16 * H(id, 47)) * (0.5 + 0.8 * Math.max(0, T)) * Math.min(1, u / 0.004) * U.uA.value, 1, 0.34 + 0.2 * Math.max(0, T), 0.04 + 0.1 * Math.max(0, T), H(id, 48));
        }
      }
      // the smoke: black, boiling up off the fire, driven up the slope and over the top by the wind (its top comes
      // out of the sea's shadow into the last of the sun)
      const reach = Math.min(820, 40 + V * 0.9 * u0), nS = 460;
      if (far(620, -9) < 2600) for (let i = 0; i < nS; i++) {
        const g0 = H(i, 51), ph = (g0 + s * 0.9 + t * 0.006) % 1, d = ph * reach, zs = (H(i, 52) - 0.5) * 2 * Math.min(R * 1.25, 40 + d * 0.5) * (0.5 + 0.5 * H(i, 59));
        const z = F.wagons.z + zs, hx = esHillX(z), up = (8 + 0.2 * d) * (0.3 + 1.2 * H(i, 53)) + 26 * Math.sqrt(ph) * H(i, 54);
        let x, y;
        if (d < 26) { x = hx - 3 - 6 * H(i, 55); y = d + up * 0.3; } else { x = hx + (d - 26); y = esGroundY(x, z) + 4 + up; }
        const big = H(i, 56), sz = (6 + 0.07 * d + 16 * ph) * (0.5 + 1.2 * big * big), k = 0.7 + 0.6 * H(i, 57);
        // (black; its underside near the fire glows with it)
        const glow = hot * Math.max(0, 1 - d / (40 + R)) * Math.max(0, 1 - up / 40) * 0.5;
        du.add(x - shift * (0.93 + 0.07 * H(i, 58)), y, z, sz, 0.8 * MathX.smooth(u0, 0.004, 0.08) * (1 - 0.5 * ph) * U.uA.value, 0.07 * k + 0.9 * glow, 0.062 * k + 0.25 * glow, 0.056 * k + 0.03 * glow, H(i, 60));
      }
    }

    // ---------------------------------------------------------------- the sea
    {
      const tt = t * 0.25 + s * 30, rise = P.wallK * V * Math.min(s, P.T);
      wall.forEach((o, i) => {
        const U = o.material.uniforms;
        U.uH.value = Hh * [1, 0.9, 0.72][i]; U.uX0.value = F.quay.x + [-1.5, 3.5, -5][i] - shift; U.uT.value = tt; U.uRise.value = rise * [1, 0.92, 0.8][i];
        U.uLean.value = [0.3, 0.38, 0.22][i] * (1 - Math.min(1.5, w1 * 3));
        o.visible = s > 0.0005;
      });
      caster.visible = s > 0.0005; caster.scale.y = Hh; caster.position.x = _xw;
      sharpU.value = m === 'sun' ? 1 : 0;
      backU.value = MathX.smooth(cx - (F.quay.x - shift + 0.3 * Hh * Math.pow(MathX.clamp(cy / Hh, 0, 1), 1.7)), -8, 8);
      foam.material.uniforms.uA.value = 0.8 * MathX.smooth(s, 0, 0.05) * (1 - MathX.smooth(s, 1, 1.2)); foam.material.uniforms.uX.value = X; foam.material.uniforms.uW.value = 30 + 130 * MathX.smooth(s, 0, 0.4);
      foam.visible = s > 0;
      // spray at its foot and blown east off it (near the camera only)
      if (s > 0 && Math.abs(cx - F.quay.x) < 420) {
        for (let i = 0; i < 150; i++) {
          const z = cz + (H(i, 61) - 0.5) * 500, hh = H(i, 62), y = hh * hh * Math.min(Hh, 120), ph = (H(i, 63) + s * 3 + t * 0.02) % 1;
          du.add(F.quay.x + 2 + ph * (20 + 0.5 * y) - shift + 0.3 * Hh * Math.pow(y / Hh, 1.7), y + 1, z, 7 + 11 * ph + 0.05 * y, 0.1 * on * (1 - ph), 0.9, 0.92, 0.92, H(i, 64));
        }
      }
      // the ferry (and the boats) reaching the quay: a burst of spray and torn steel
      const bursts = [[P.ferryHit, F.ferry.z, 3, 1]].concat(boatHit.map((b, i) => [b, F.boats[i][1], 0.5, 0.3]));
      for (let b = 0; b < bursts.length; b++) {
        const [hs, bz, by, big] = bursts[b], u = s - hs; if (u <= 0 || u > 0.5 || far(F.quay.x, bz) > 700) continue;
        if (u < 0.008) sp.add(F.quay.x - 3, by + 2, bz, 26 * big * (1 + u * 200), 0.9 * (1 - u / 0.008), 1, 0.9, 0.75);
        for (let j = 0; j < 70 * big + 10; j++) {
          const id = b * 211 + j, g1 = 1 - Math.exp(-u / 0.09), ang = Math.PI * H(id, 71), rad = 46 * big * Math.sqrt(H(id, 72)) * g1 + 3;
          du.add(F.quay.x - 2 - 14 * big * H(id, 73) * g1, by + Math.sin(ang) * rad + 50 * u * H(id, 74), bz + Math.cos(ang) * rad * 1.3, (5 + 14 * g1) * (0.5 + big * 0.6) * (0.7 + 0.6 * H(id, 75)), (0.22 + 0.3 * big) * Math.exp(-u / 0.4), 0.9, 0.92, 0.92, H(id, 76));
        }
        if (u < 0.2) for (let j = 0; j < 40 * big; j++) { const id = b * 223 + j, dk = 1 - Math.exp(-u / 0.05); sp.add(F.quay.x - 2 - (10 + 60 * H(id, 77)) * 0.05 * dk, by + (20 + 90 * H(id, 78)) * u - 0.5 * G * u * u, bz + (H(id, 79) - 0.5) * 60 * dk, 0.3, 0.9 * (1 - u / 0.2), 1, 0.75, 0.4); }
      }
    }
    // ---------------------------------------------------------------- 5:42:01: thrown west
    blast.visible = w1 > 0.002;
    if (w1 > 0.002) {
      const xf = P.blastX(s), U = blast.material.uniforms, grow = MathX.smooth(w1, 0, 0.22), A = MathX.smooth(w1, 0.002, 0.03);
      U.uX0.value = xf + 7; U.uH.value = 50 + 115 * grow; U.uT.value = t * 0.5 + s * 40; U.uA.value = A; U.uHot.value = 0.3 + 0.5 * hot; U.uLit.value = 0.42 + 0.58 * litAt(xf, 30);
      // its face: fire and smoke boiling ahead of the sheet; dust torn off the ground at its foot
      for (let i = 0; i < 300; i++) {
        const near = H(i, 82) < 0.6, zf = (H(i, 81) - 0.5) * (near ? 150 : 520), z = (near ? MathX.clamp(cz, -60, 60) * 0.6 : -9) + zf, hh = H(i, 83), y = 1 + hh * hh * (36 + 80 * grow);
        const lay = 30 * (y / 120) * (y / 120) + 0.00018 * (z + 9) * (z + 9), bo = 3 * noise1(t * 0.7 + i, 77 + i);
        const hotz = 1 - MathX.smooth(Math.abs(z + 9), 90, 380), T = hot * hotz * (1 - 0.5 * hh) + 0.15 * noise1(t * 0.8 + i * 1.3, i);
        if (H(i, 84) < 0.4 * hotz) fi.add(xf + 1 + lay + 9 * H(i, 85) + bo, y, z, 6 + 14 * H(i, 86) + 7 * grow, (0.06 + 0.1 * H(i, 87)) * (0.45 + 0.8 * Math.max(0, T)) * A, 1, 0.34 + 0.2 * Math.max(0, T), 0.04 + 0.1 * Math.max(0, T), H(i, 88));
        else { const c = 0.12 + 0.5 * (1 - hotz) * H(i, 89); du.add(xf - 1 + lay + 6 * H(i, 85) + bo, y, z, 8 + 16 * H(i, 86) + 10 * grow, 0.66 * A, c, c * 0.84, c * 0.68, H(i, 88)); }
      }
      for (let i = 0; i < 110; i++) { const z = cz * 0.5 + (H(i, 91) - 0.5) * 300, ph = H(i, 92); du.add(xf - 2 - 11 * ph + 2 * noise1(t + i, i), 0.8 + 3.5 * ph * H(i, 93), z, 3 + 5 * ph, 0.55 * A * (1 - ph * 0.6), 0.7, 0.58, 0.44, H(i, 94)); }
    }
    du.end(); fi.end(); sp.end();
  };
  return out;
}
