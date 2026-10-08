/* =====================================================================
   GARDEN — outside the kitchen: the back of the house (z = 0 wall), a stone patio, a lawn, a small pond with
   lily pads, water striders and a duck, a potting bench under the kitchen window, a flower bed, a sunflower, trees,
   board fences; beyond the back fence a park, then fields, woods and hills. A subclass of the shared city
   (js/world/environment.js) so the art-directed trees, benches, materials and the PMREM sky reflections are reused.
   Time of day (the time-lapse), wilting, the storm and the rain are all pure functions of story time.
   ===================================================================== */

// Environment reads a global LAYOUT (only curbH matters here: the ground the trees stand on)
const LAYOUT = { curbH: 0, roadHalf: 7, frontage: 12.5, laneW: 3.5, crossZ: -48, crossHalf: 7, zNear: 40, zFar: -400, busStop: { x: 0, z: 0 }, lot: { x0: 0, x1: 0, z0: 0, z1: 0 } };

const NST_G = {
  pond: { x: -0.9, z: -6.6, r: 1.62, y: -0.055, depth: 0.42 },
  pads: [[-0.55, -5.42, 0.075, 0.4], [-0.78, -5.55, 0.06, 2.0], [-0.36, -5.62, 0.055, 4.1], [-1.4, -6.2, 0.08, 1.2], [-0.2, -6.9, 0.07, 5.0], [-1.7, -7.3, 0.065, 3.2], [-1.0, -7.8, 0.075, 0.6], [-0.4, -7.5, 0.05, 2.6]],
  bench: { x0: 1.72, x1: 3.28, z0: -0.72, z1: -0.12, top: 0.9 },
  potA: { x: 2.2, z: -0.43 },
  potB: { x: 2.86, z: -0.42 },
  fence: { x0: -7.0, x1: 5.0, z: -17.0, h: 1.8 },
  sunflower: { x: -2.49, z: -6.04 },      // among the pond's rim stones; its big leaf reaches out over the water
  duck: { from: [-0.66, -6.55], to: [-1.04, -6.22], drift: [[-1.38, -6.2], [-1.98, -6.76], [-2.25, -7.0]] },   // (x, z) at NST.duck, NST.dive, then at NST.land, NST.line2, NST.end
};

// the sun for a given garden day (1.0 = 10:00 on the morning of the change)
function nstSunDir(day, out) {
  const h = 10 + (day - 1) * 24;
  const ph = ((h - 6) / 12) * Math.PI;
  const el = Math.sin(ph);
  return out.set(Math.cos(ph), Math.max(el, -0.3) * 0.95 + 0.05, Math.max(0.15, Math.abs(Math.sin(ph))) * 0.85 + 0.1).normalize();
}
function nstDaylight(day) {
  const h = 10 + (day - 1) * 24, ph = ((h - 6) / 12) * Math.PI;
  return MathX.smooth(Math.sin(ph), -0.12, 0.22);       // 0 night → 1 day
}

class NstGarden extends Environment {
  build() {
    this._materials();
    this._sky();
    this._lights();
    this._grounds();
    this._house();
    this._pond();
    this._pottingBench();
    this._beds();
    this._gardenTrees();
    this._park();
    this._hills();
    this._sunflower();
    this.batch.build(this.root, 'env');
    this._environmentMap();
    this._rainSystems();
    this._duck();
  }

  // ---------------------------------------------------------------- sky: day → night cycle (time-lapse) + storm deck
  _sky() {
    this.sunDir = new THREE.Vector3(0.5, 0.78, 0.87).normalize();
    this.skyUniforms = {
      uZenith: { value: new THREE.Color('#5d86b3') }, uHorizon: { value: new THREE.Color('#c3d3dc') }, uGround: { value: new THREE.Color('#4f524f') },
      uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#fff1d8') }, uTime: { value: 0 }, uO2: { value: 1 },
      uCloud: { value: 0.35 }, uStorm: { value: 0 }, uNight: { value: 0 }, uFlash: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor;
        uniform float uTime, uO2, uCloud, uStorm, uNight, uFlash;
        varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<6;i++){ v += a*noise(p); p = p*2.02 + 7.1; a *= 0.5; } return v; }
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
          col = mix(col, uGround, smoothstep(0.0, -0.06, h));
          float sd = max(dot(d, uSunDir), 0.0);
          col += uSunColor * (pow(sd, 8.0) * 0.18 + pow(sd, 200.0) * 2.0) * (1.0 - uStorm);
          if (h > -0.02) {
            vec2 uv = d.xz / (h + 0.2) * 0.45 + vec2(uTime * 0.004, uTime * 0.002);
            float c = fbm(uv), c2 = fbm(uv * 2.7 + 3.1);
            float cover = mix(uCloud, 1.0, uStorm);
            float m = smoothstep(1.0 - cover - 0.15, 1.0 - cover + 0.25, c);
            vec3 lit = mix(vec3(1.0, 0.98, 0.95), uSunColor, 0.3) * mix(1.0, 0.85, uNight);
            vec3 shade = mix(uZenith * 0.95 + 0.12, vec3(0.32, 0.35, 0.38), uStorm);
            vec3 cl = mix(lit, shade, clamp(c2 * 0.9 + uStorm * 0.6, 0.0, 1.0));
            cl = mix(cl, vec3(0.2, 0.22, 0.25), uStorm * smoothstep(0.4, 0.8, c));
            col = mix(col, cl * (1.0 - 0.75 * uNight), m * smoothstep(-0.02, 0.25, h) * 0.95);
          }
          col += vec3(0.75, 0.8, 0.95) * uFlash * smoothstep(-0.05, 0.4, h);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), mat);
    sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    this.fogColor = new THREE.Color('#a8b4b4');
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.0035);
    this.scene.background = new THREE.Color('#c3d3dc');
    this.dayCols = { zen: new THREE.Color('#5d86b3'), hor: new THREE.Color('#c6d4da'), fog: new THREE.Color('#aab6b5') };
    this.nightCols = { zen: new THREE.Color('#1b2944'), hor: new THREE.Color('#3d4b6a'), fog: new THREE.Color('#2c3850') };
    this.stormCols = { zen: new THREE.Color('#3b4248'), hor: new THREE.Color('#6d767a'), fog: new THREE.Color('#5f686b') };
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffeed6', 3.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 120;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#b9cfe0', '#4a4636', 1.15); this.scene.add(this.hemi);
    this.focus = new THREE.Vector3(0, 0, -6);
  }

  // ---------------------------------------------------------------- lawn, patio, fences
  _grounds() {
    const B = this.batch, r = this.rng.fork(21);
    // the lawn (its colour drains toward straw as it wilts: driven per frame)
    const cv = Tex.canvas(512, 512), c = cv.getContext('2d');
    c.fillStyle = '#6c8050'; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 26000; i++) { const v = r.range(-1, 1); c.fillStyle = `rgba(${v > 0 ? '150,170,90' : '40,60,25'},${Math.abs(v) * 0.22})`; c.fillRect(r.range(0, 512), r.range(0, 512), 1.2, r.range(2, 5)); }
    // (blotches wrap around the tile edges: cut-off blotches made the repeats show as light and dark rectangles)
    for (let i = 0; i < 60; i++) {
      c.fillStyle = `rgba(60,80,35,${r.range(0.05, 0.14)})`; const bx = r.range(0, 512), by = r.range(0, 512), br = r.range(10, 40);
      for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) { c.beginPath(); c.arc(bx + ox, by + oy, br, 0, 6.28); c.fill(); }
    }
    const lt = Tex.tex(cv); lt.repeat.set(9, 9);
    this.lawnMat = new THREE.MeshStandardMaterial({ map: lt, roughness: 0.95, name: 'nstLawn' });
    this.lawnMat.userData.grime = 0;      // (no street grime: its 1.25 m "replaced slab" cells showed on the lawn as dark rectangles)
    // the lawn has a hole where the pond is (a ring of quads around an irregular rim)
    const P = NST_G.pond, rim = (a) => P.r * (1 + 0.1 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 5 + 2));
    this.pondRim = rim;
    const lawnGeo = new THREE.BufferGeometry(), pos = [], uv = [], idx = [];
    const NA = 64, outer = 24;
    for (let i = 0; i < NA; i++) {
      const a = (i / NA) * Math.PI * 2, rr = rim(a);
      for (const [k, R] of [[0, rr], [1, rr + 0.6], [2, rr + 3], [3, outer]]) {
        let x = P.x + Math.cos(a) * R, z = P.z + Math.sin(a) * R;
        if (k === 3) { const s = Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))); x = P.x + Math.cos(a) * R / s; z = P.z + Math.sin(a) * R / s; }
        pos.push(x, k === 0 ? 0.0 : 0.0, z); uv.push(x / 3, z / 3);
      }
    }
    for (let i = 0; i < NA; i++) { const j = (i + 1) % NA; for (let k = 0; k < 3; k++) { const a = i * 4 + k, b = j * 4 + k; idx.push(a, b, b + 1, a, b + 1, a + 1); } }
    lawnGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lawnGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); lawnGeo.setIndex(idx); lawnGeo.computeVertexNormals();
    // (winding check: normals must point up)
    if (lawnGeo.attributes.normal.getY(0) < 0) { lawnGeo.setIndex(idx.map((v, i) => idx[i - (i % 3) + (2 - (i % 3))])); lawnGeo.computeVertexNormals(); }
    const lawn = new THREE.Mesh(lawnGeo, this.lawnMat); lawn.receiveShadow = true; lawn.name = 'lawn'; this.root.add(lawn);
    // beyond the back fence: the park lawn (plain, same material)
    const park = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), this.lawnMat); park.rotation.x = -Math.PI / 2; park.position.set(0, -0.02, -170); park.receiveShadow = true; this.root.add(park);
    // patio stones by the house (they turn glossy-wet in the rain: driven per frame)
    const pcv = Tex.canvas(256, 256), pc = pcv.getContext('2d');
    pc.fillStyle = '#5c5a55'; pc.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = r.range(-12, 12); pc.fillStyle = `rgb(${148 + v},${142 + v},${130 + v})`; pc.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
    const pt = Tex.tex(pcv); pt.repeat.set(6, 1.5);
    this.patioMat = new THREE.MeshStandardMaterial({ map: pt, roughness: 0.85, name: 'nstPatio' });
    const patio = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 3.0), this.patioMat); patio.rotation.x = -Math.PI / 2; patio.position.set(-1.0, 0.012, -1.5); patio.receiveShadow = true; this.root.add(patio);
    // stepping stones to the pond
    for (let i = 0; i < 4; i++) B.add(new THREE.CylinderGeometry(0.26, 0.28, 0.04, 9), Mat.std('#8c877d', { roughness: 0.9 }), Geo.matrix(-0.6 + i * 0.05, 0.02, -3.2 - i * 0.55, 0, i, 0));
    // board fences
    const F = NST_G.fence, board = Mat.std('#6b5440', { roughness: 0.9 }), rail = Mat.std('#5a4634', { roughness: 0.9 });
    const fence = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0), n = Math.round(L / 0.16);
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, hh = F.h + 0.04 * Math.sin(i * 1.7); B.box(0.14, hh, 0.02, MathX.lerp(x0, x1, u), hh / 2, MathX.lerp(z0, z1, u), i % 7 === 3 ? rail : board, ry); }
      for (const y of [0.35, 1.4]) B.box(L, 0.08, 0.04, (x0 + x1) / 2, y, (z0 + z1) / 2, rail, ry);
    };
    fence(F.x0, F.z, -1.0, F.z); fence(0.2, F.z, F.x1, F.z);         // a gap for the gate
    fence(F.x0, -0.2, F.x0, F.z); fence(F.x1, -0.2, F.x1, F.z);
    B.box(1.2, 1.5, 0.04, -0.4, 0.78, F.z - 0.05, Mat.std('#55432f', { roughness: 0.85 }));   // the gate (shut)
  }

  // ---------------------------------------------------------------- the back of the house (the kitchen's outer wall continues)
  _house() {
    const B = this.batch, render = Mat.std('#d8d2c6', { roughness: 0.9 }), trim = Mat.std('#e9e6df', { roughness: 0.6 }), roofM = Mat.std('#4a4440', { roughness: 0.85 });
    // wall segments beyond the kitchen shell (the kitchen builds x −3.1 … 2.3 itself)
    B.box(3.0, 3.0, 0.2, -4.6, 1.5, 0.1, render);
    B.box(2.8, 3.0, 0.2, 3.7, 1.5, 0.1, render);
    B.box(5.4, 0.4, 0.2, -0.4, 2.8, 0.1, render);
    // a second (dark) window left of the door, frames outside
    B.box(1.0, 1.0, 0.03, -4.5, 1.55, -0.005, Mat.std('#1f2a30', { roughness: 0.15, name: 'nstHouseGlass' }));
    for (const [w, h, x, y] of [[1.1, 0.06, -4.5, 2.07], [1.1, 0.08, -4.5, 1.03], [0.06, 1.1, -5.03, 1.55], [0.06, 1.1, -3.97, 1.55]]) B.box(w, h, 0.06, x, y, -0.02, trim);
    for (const [w, h, x, y] of [[1.3, 0.06, 0.3, 2.09], [1.36, 0.08, 0.3, 1.04], [0.06, 1.06, -0.36, 1.565], [0.06, 1.06, 0.96, 1.565]]) B.box(w, h, 0.07, x, y, -0.02, trim);
    B.box(1.36, 0.04, 0.12, 0.3, 1.0, -0.06, trim);
    for (const [w, h, x, y] of [[0.97, 0.07, -2.325, 2.14], [0.07, 2.12, -2.78, 1.06], [0.07, 2.12, -1.87, 1.06]]) B.box(w, h, 0.07, x, y, -0.02, trim);
    // roof: a single slope rising away from the garden, a gutter and a downpipe
    const roof = new THREE.BoxGeometry(12.6, 0.12, 4.4); B.add(roof, roofM, Geo.matrix(-0.6, 3.75, 1.75, -0.42, 0, 0));
    B.add(new THREE.CylinderGeometry(0.06, 0.06, 12.6, 8, 1, true), Mat.std('#e2dfd8', { roughness: 0.5 }), Geo.matrix(-0.6, 2.93, -0.27, 0, 0, Math.PI / 2));
    B.add(new THREE.CylinderGeometry(0.04, 0.04, 2.9, 8), Mat.std('#e2dfd8', { roughness: 0.5 }), Geo.matrix(4.9, 1.45, -0.1));
    // a water butt under the downpipe, an outdoor tap
    B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.9, 16), Mat.std('#2c4a3a', { roughness: 0.6 }), Geo.matrix(4.55, 0.45, -0.45));
    B.add(new THREE.CylinderGeometry(0.31, 0.31, 0.04, 16), Mat.std('#1f3529', { roughness: 0.6 }), Geo.matrix(4.55, 0.92, -0.45));
  }

  // ---------------------------------------------------------------- the pond: rim stones, a dark bowl, the water, lily pads, striders
  _pond() {
    const P = NST_G.pond, B = this.batch, r = this.rng.fork(22), rim = this.pondRim;
    // bowl (dark, mossy) — a lathe-ish dish following the rim
    const NA = 64, NR = 8, pos = [], idx = [], col = [];
    for (let i = 0; i < NA; i++) {
      const a = (i / NA) * Math.PI * 2, R = rim(a);
      for (let k = 0; k <= NR; k++) {
        const u = k / NR, rr = R * (1 - u * 0.98), y = -P.depth * Math.sin(u * Math.PI / 2) - 0.01;
        pos.push(P.x + Math.cos(a) * rr, y, P.z + Math.sin(a) * rr);
        const sh = 0.55 + 0.3 * (1 - u) + 0.08 * hash2(i, k);
        col.push(0.22 * sh, 0.25 * sh, 0.17 * sh);
      }
    }
    for (let i = 0; i < NA; i++) { const j = (i + 1) % NA; for (let k = 0; k < NR; k++) { const a = i * (NR + 1) + k, b = j * (NR + 1) + k; idx.push(a, a + 1, b + 1, a, b + 1, b); } }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); bg.setIndex(idx); bg.computeVertexNormals();
    if (bg.attributes.normal.getY(NR) < 0) { const ix = bg.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } bg.computeVertexNormals(); }
    const bowl = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, name: 'nstPondBed', side: THREE.DoubleSide })); bowl.receiveShadow = true; this.root.add(bowl);
    // pebbles on the bed
    for (let i = 0; i < 40; i++) { const a = r.range(0, 6.28), rr = r.range(0.2, 1.3); B.add(new THREE.DodecahedronGeometry(r.range(0.025, 0.055), 0), Mat.std('#33372a', { roughness: 1 }), Geo.matrix(P.x + Math.cos(a) * rr, -P.depth * 0.9 * Math.sin((1 - rr / 1.6) * Math.PI / 2), P.z + Math.sin(a) * rr, r.next(), r.next(), 0, 1, 0.5, 1), { noShadow: true }); }
    // rim stones
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + r.range(-0.04, 0.04), R = rim(a) + r.range(0.0, 0.12), s = r.range(0.11, 0.2);
      B.add(new THREE.DodecahedronGeometry(s, 0), Mat.std(['#8a857a', '#77736a', '#9a948a'][i % 3], { roughness: 0.9 }), Geo.matrix(P.x + Math.cos(a) * R, s * 0.25, P.z + Math.sin(a) * R, r.next(), r.next() * 3, 0, 1.3, 0.55, 1.1));
    }
    // reeds at the far side
    this.reedMat = new THREE.MeshStandardMaterial({ color: '#5c7038', roughness: 0.8, name: 'nstReed' });     // (they dry out too: standing in water doesn't help without the pull)
    for (let i = 0; i < 70; i++) { const a = r.range(3.6, 5.6), R = rim(a) - r.range(0.0, 0.25), h = r.range(0.5, 1.1); B.add(new THREE.ConeGeometry(0.012, h, 4), this.reedMat, Geo.matrix(P.x + Math.cos(a) * R, h / 2 - 0.05, P.z + Math.sin(a) * R, r.range(-0.15, 0.15), 0, r.range(-0.15, 0.15)), { noShadow: true }); }
    // the water surface (reflective, slightly see-through; rain makes it misty, not ringed)
    const sg = new THREE.ShapeGeometry(new THREE.Shape(Array.from({ length: 72 }, (_, i) => { const a = (i / 72) * Math.PI * 2, R = rim(a) + 0.02; return new THREE.Vector2(Math.cos(a) * R, -Math.sin(a) * R); })));
    this.pondMat = nstWaterMat({ color: '#3d5a58', opacity: 0.5, fres: 0.35, rough: 0.06, env: 1.3 });
    const surf = new THREE.Mesh(sg, this.pondMat); surf.rotation.x = -Math.PI / 2; surf.position.set(P.x, P.y, P.z); surf.renderOrder = 3; surf.name = 'pondSurface'; this.root.add(surf);
    this.pondSurf = surf;
    // lily pads (a notch each), a couple of flowers
    // a vein texture so the pads read as leaves, not flat discs: radial veins, a darker rim, mottling
    const vcv = Tex.canvas(256, 256), vc = vcv.getContext('2d');
    vc.fillStyle = '#ffffff'; vc.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) { vc.fillStyle = `rgba(${hash1(i) > 0.5 ? '40,60,20' : '230,240,190'},${0.05 + 0.08 * hash1(i * 3)})`; vc.beginPath(); vc.arc(hash1(i * 7) * 256, hash1(i * 11) * 256, 3 + 9 * hash1(i * 13), 0, 6.28); vc.fill(); }
    vc.strokeStyle = 'rgba(225,240,175,0.6)'; vc.lineWidth = 2.2;
    for (let k = 0; k < 24; k++) { const a = (k / 24) * 6.283; vc.beginPath(); vc.moveTo(128, 128); vc.quadraticCurveTo(128 + Math.cos(a + 0.12) * 62, 128 + Math.sin(a + 0.12) * 62, 128 + Math.cos(a) * 124, 128 + Math.sin(a) * 124); vc.stroke(); }
    const gr = vc.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.85, 'rgba(0,0,0,0.05)'); gr.addColorStop(1, 'rgba(60,40,0,0.45)');
    vc.fillStyle = gr; vc.fillRect(0, 0, 256, 256);
    const vt = Tex.tex(vcv);
    const padM = new THREE.MeshStandardMaterial({ color: '#36612a', map: vt, roughness: 0.4, name: 'nstPad', side: THREE.DoubleSide }), padM2 = new THREE.MeshStandardMaterial({ color: '#416d30', map: vt, roughness: 0.45, name: 'nstPad2', side: THREE.DoubleSide });
    this.pads = NST_G.pads.map(([x, z, rr, ry], i) => {
      const g = new THREE.CircleGeometry(rr, 28, 0.25, Math.PI * 2 - 0.5);
      const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const px = p.getX(k), py = p.getY(k); p.setZ(k, 0.004 * (px * px + py * py) / (rr * rr)); } g.computeVertexNormals();
      const m = new THREE.Mesh(g, i % 2 ? padM2 : padM); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, P.y + 0.002, z); m.receiveShadow = true; m.castShadow = true; this.root.add(m);
      // vein lines on the near pads
      return m;
    });
    for (const [x, z, c] of [[-1.38, -6.17, '#f2d6dc'], [-1.0, -7.78, '#f7f2e8']]) {
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28; const pt = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 4), Mat.std(c, { roughness: 0.6 })); pt.position.set(x + Math.cos(a) * 0.02, P.y + 0.03, z + Math.sin(a) * 0.02); pt.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); this.root.add(pt); }
    }
    this._striders();
  }

  // water striders: a slim body, short front legs, long middle (rowing) and hind legs
  _striders() {
    const mk = (s = 1.3) => {
      const g = new THREE.Group(), dark = Mat.std('#1d1a16', { roughness: 0.55 }), leg = Mat.std('#2a251f', { roughness: 0.6 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.0016 * s, 0.011 * s, 4, 8), dark); body.rotation.x = Math.PI / 2; body.position.y = 0.004 * s; body.castShadow = true; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.0017 * s, 8, 6), dark); head.position.set(0, 0.0045 * s, -0.0078 * s); g.add(head);
      const legs = [];
      // [attach z, length, spread angle, knee height]
      for (const [az, L, ang, kh] of [[-0.004, 0.007, 0.5, 0.004], [-0.001, 0.022, 1.45, 0.007], [0.002, 0.019, 2.35, 0.006]]) {
        for (const side of [1, -1]) {
          const pg = new THREE.Group(); pg.position.set(0.0012 * s * side, 0.004 * s, az * s); g.add(pg);
          const a = new THREE.Mesh(new THREE.CylinderGeometry(0.00035 * s, 0.00035 * s, 1, 4), leg); pg.add(a);
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0003 * s, 0.00022 * s, 1, 4), leg); pg.add(b);
          legs.push({ pg, a, b, L: L * s, ang: side * ang, side, kh: kh * s });
        }
      }
      g.userData.legs = legs; g.userData.s = s;
      this.root.add(g);
      return g;
    };
    this.striders = [mk(1.35), mk(1.25), mk(1.3), mk(1.2)];
    this.ripples = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 64), new THREE.MeshBasicMaterial({ color: '#dfe9e6', transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; m.visible = false; this.root.add(m); return m; });
    this._sv = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  }

  // pose one leg from its attach point to a foot point (both in the strider's local frame)
  _leg(l, foot) {
    const [A, K, F] = this._sv;
    A.set(0, 0, 0);
    const fx = foot.x - l.pg.position.x, fy = foot.y - l.pg.position.y, fz = foot.z - l.pg.position.z;
    K.set(fx * 0.38, l.kh + fy * 0.3, fz * 0.38);
    F.set(fx, fy, fz);
    const seg = (m, p, q) => { const dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, L = Math.hypot(dx, dy, dz); m.position.set((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)); };
    seg(l.a, A, K); seg(l.b, K, F);
  }

  // ---------------------------------------------------------------- the potting bench, pots, the wick pot, the watering can
  _pottingBench() {
    const N = NST_G.bench, B = this.batch, wood = Mat.std('#8a6a48', { roughness: 0.85 }), wood2 = Mat.std('#6e5238', { roughness: 0.9 });
    for (let i = 0; i < 6; i++) B.box(N.x1 - N.x0, 0.03, 0.09, (N.x0 + N.x1) / 2, N.top - 0.015, N.z0 + 0.05 + i * 0.1, wood);
    for (const x of [N.x0 + 0.05, N.x1 - 0.05]) for (const z of [N.z0 + 0.05, N.z1 - 0.05]) B.box(0.06, N.top - 0.03, 0.06, x, (N.top - 0.03) / 2, z, wood2);
    B.box(N.x1 - N.x0, 0.03, 0.55, (N.x0 + N.x1) / 2, 0.3, (N.z0 + N.z1) / 2, wood2);
    // stacked pots and a bag on the lower shelf, a trowel on top
    for (let i = 0; i < 3; i++) B.add(new THREE.CylinderGeometry(0.09, 0.07, 0.14, 14, 1, true), Mat.std('#a95e3c', { roughness: 0.9, side: THREE.DoubleSide }), Geo.matrix(N.x0 + 0.25, 0.39 + i * 0.05, -0.45));
    B.box(0.4, 0.22, 0.26, N.x1 - 0.25, 0.43, -0.5, Mat.std('#5b5a48', { roughness: 0.95 }));
    B.box(0.03, 0.01, 0.2, N.x1 - 0.12, N.top + 0.005, -0.25, Mat.std('#7b5a3e'), 0.4);
    // pot A (the one you water): terracotta with drainage holes, a saucer, a leafy plant
    const A = NST_G.potA, top = N.top, potM = Mat.std('#b0643f', { roughness: 0.85 });
    const pa = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.08, 0.17, 24, 1, true), Mat.std('#b0643f', { roughness: 0.85, side: THREE.DoubleSide })); pa.position.set(A.x, top + 0.032 + 0.085, A.z); pa.castShadow = true; pa.receiveShadow = true; this.root.add(pa);
    const rimA = new THREE.Mesh(new THREE.TorusGeometry(0.107, 0.008, 6, 28), potM); rimA.rotation.x = Math.PI / 2; rimA.position.set(A.x, top + 0.2, A.z); this.root.add(rimA);
    const baseA = new THREE.Mesh(new THREE.CircleGeometry(0.08, 24), potM); baseA.rotation.x = Math.PI / 2; baseA.position.set(A.x, top + 0.033, A.z); this.root.add(baseA);
    this.soilAMat = new THREE.MeshStandardMaterial({ color: '#5a4636', roughness: 1, name: 'nstSoilA' });
    const soilA = new THREE.Mesh(new THREE.CircleGeometry(0.098, 24), this.soilAMat); soilA.rotation.x = -Math.PI / 2; soilA.position.set(A.x, top + 0.185, A.z); this.root.add(soilA);
    const sauc = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.115, 0.03, 26, 1, true), Mat.std('#a5583a', { roughness: 0.85, side: THREE.DoubleSide })); sauc.position.set(A.x, top + 0.015, A.z); this.root.add(sauc);
    const saucB = new THREE.Mesh(new THREE.CircleGeometry(0.115, 26), Mat.std('#8d4a31', { roughness: 0.9 })); saucB.rotation.x = -Math.PI / 2; saucB.position.set(A.x, top + 0.002, A.z); this.root.add(saucB);
    // water appearing in the saucer, then spilling over the bench top and off its front edge
    this.saucW = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.124, 32), nstWaterMat({ color: '#2a3638', opacity: 0.55, fres: 0.5, env: 0.5 })); this.saucW.rotation.x = -Math.PI / 2; this.saucW.position.set(A.x, top + 0.004, A.z); this.saucW.renderOrder = 3; this.root.add(this.saucW);
    this.benchSpill = new NstPuddle(this.root, nstWaterMat({ color: '#90a8ac', opacity: 0.42, fres: 0.55 }), { na: 56, nr: 6, seed: 41 });
    nstWetLook(this.benchSpill.mesh.material, 0.85);
    this.benchSpill.group.position.set(A.x, top + 0.0015, A.z - 0.06);
    // drainage streams out of the pot's holes into the saucer, and off the bench edge to the ground
    const dm = nstWaterMat({ color: '#c3d5d9', opacity: 0.38, fres: 0.7 });
    this.drains = [[-0.03, 0.02], [0.035, -0.01], [0.0, -0.04]].map(([dx, dz], i) => new NstStream(this.root, dm, { a: new THREE.Vector3(A.x + dx, top + 0.032, A.z + dz), v0: new THREE.Vector3(dx * 3, -0.15, dz * 3), r0: 0.0035, yEnd: top + 0.004, seed: 51 + i }));
    this.edgeDrips = [[-0.05, 0], [0.06, 0], [0.16, 0]].map(([dx], i) => new NstStream(this.root, dm, { a: new THREE.Vector3(A.x + dx, top - 0.02, N.z0 - 0.01), v0: new THREE.Vector3(0, -0.1, -0.08), r0: 0.003, yEnd: 0.02, seed: 61 + i }));
    // the plant in pot A (droops with the wilt)
    this.potPlantA = this._leafyPlant(A.x, top + 0.185, A.z, 0.85, 7);
    // pot B: a self-watering wick pot — a glass jar of water below, a cotton wick rising into a plastic pot of soil
    const Bp = NST_G.potB;
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.13, 28, 1, true), new THREE.MeshStandardMaterial({ color: '#dfeef0', roughness: 0.05, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, name: 'nstJarGlass' }));
    jar.position.set(Bp.x, top + 0.065, Bp.z); jar.renderOrder = 4; this.root.add(jar);
    const jw = new THREE.Mesh(new THREE.CylinderGeometry(0.071, 0.071, 0.085, 28), nstWaterMat({ color: '#6f8f98', opacity: 0.2, fres: 0.35 })); jw.position.set(Bp.x, top + 0.0435, Bp.z); jw.renderOrder = 3; this.root.add(jw);
    const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.14, 24), Mat.std('#2f3a33', { roughness: 0.55 })); pb.position.set(Bp.x, top + 0.13 + 0.07, Bp.z); pb.castShadow = true; this.root.add(pb);
    this.soilBMat = new THREE.MeshStandardMaterial({ color: '#8a7460', roughness: 1, name: 'nstSoilB' });
    const soilB = new THREE.Mesh(new THREE.CircleGeometry(0.08, 22), this.soilBMat); soilB.rotation.x = -Math.PI / 2; soilB.position.set(Bp.x, top + 0.265, Bp.z); this.root.add(soilB);
    // the wick: wet (dark) below the water line, dry (pale) above it — it doesn't climb
    const wick = new THREE.CatmullRomCurve3([new THREE.Vector3(Bp.x + 0.01, top + 0.012, Bp.z), new THREE.Vector3(Bp.x - 0.012, top + 0.06, Bp.z + 0.01), new THREE.Vector3(Bp.x + 0.006, top + 0.105, Bp.z - 0.004), new THREE.Vector3(Bp.x, top + 0.14, Bp.z)]);
    const wcv = Tex.canvas(16, 128), wc = wcv.getContext('2d');
    wc.fillStyle = '#f4efe2'; wc.fillRect(0, 0, 16, 128);
    wc.fillStyle = '#3a3024'; wc.fillRect(0, 0, 16, 67);                // tube v runs along the curve: the lower part (in the water) is wet
    for (let y = 0; y < 128; y += 4) { wc.fillStyle = 'rgba(0,0,0,0.12)'; wc.fillRect(0, y, 16, 1); }
    const wt = Tex.tex(wcv); wt.wrapS = wt.wrapT = THREE.ClampToEdgeWrapping;
    const wickM = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.95, name: 'nstWick' });
    const wm = new THREE.Mesh(new THREE.TubeGeometry(wick, 24, 0.009, 10), wickM);
    // TubeGeometry's u runs along the curve, v around it: rotate the texture so the wet band follows the length
    wt.center.set(0.5, 0.5); wt.rotation = Math.PI / 2;
    wm.castShadow = true; this.root.add(wm);
    // the plant in pot B (wilts more: it depends on the wick)
    this.potPlantB = this._leafyPlant(Bp.x, top + 0.265, Bp.z, 0.7, 5);
    // a big potted plant on the patio (a dark foreground shape in the time-lapse; it droops)
    const bp = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.45, 20), Mat.std('#4a4d50', { roughness: 0.7 })); bp.position.set(-2.75, 0.225, -2.15); bp.castShadow = true; bp.receiveShadow = true; this.root.add(bp);
    this.bigPlant = this._leafyPlant(-2.75, 0.44, -2.15, 3.0, 9);
  }

  // a leafy plant made of stems with leaves; group.userData.leaves for drooping
  _leafyPlant(x, y, z, s, n) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.root.add(g);
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.bezierCurveTo(0.03, 0.02, 0.035, 0.07, 0, 0.1); leafShape.bezierCurveTo(-0.035, 0.07, -0.03, 0.02, 0, 0);
    const lg = new THREE.ShapeGeometry(leafShape, 6);
    const lp = lg.attributes.position; for (let i = 0; i < lp.count; i++) lp.setZ(i, Math.abs(lp.getX(i)) * 0.5 - 0.08 * lp.getY(i) * lp.getY(i) * 10);
    lg.computeVertexNormals();
    const mats = [new THREE.MeshStandardMaterial({ color: '#46713a', roughness: 0.6, side: THREE.DoubleSide, name: 'nstLeaf' }), new THREE.MeshStandardMaterial({ color: '#5a8642', roughness: 0.6, side: THREE.DoubleSide, name: 'nstLeaf2' })];
    const stemM = Mat.std('#55703a', { roughness: 0.8 });
    const leaves = [];
    for (let i = 0; i < n; i++) {
      const a = i * 2.4 + hash1(i + x) * 0.5, h = (0.06 + 0.07 * hash1(i * 3 + z)) * s;
      const stem = new THREE.Group(); stem.rotation.set(0, a, 0); g.add(stem);
      const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.0025 * s, 0.003 * s, h, 5), stemM); sm.position.y = h / 2; sm.rotation.z = 0.12; stem.add(sm);
      for (let k = 0; k < 2; k++) {
        const lgp = new THREE.Group(); lgp.position.set(0.006 * s * (k ? -1 : 1), h * (0.65 + 0.35 * k), 0); stem.add(lgp);
        const leaf = new THREE.Mesh(lg, mats[(i + k) % 2]); leaf.scale.setScalar(s * (0.85 + 0.3 * hash1(i * 5 + k))); leaf.castShadow = true;
        const piv = new THREE.Group(); piv.rotation.set(0, k * Math.PI + 0.3, 0); lgp.add(piv); piv.add(leaf);
        leaf.rotation.x = -0.9 + 0.25 * hash1(i + k * 7);          // leaf tilted up-out (healthy)
        leaves.push({ leaf, base: leaf.rotation.x, stem, sm, k });
      }
    }
    g.userData.leaves = leaves; g.userData.mats = mats;
    return g;
  }

  // ---------------------------------------------------------------- flower bed along the left fence (tall flowers that bow)
  _beds() {
    const B = this.batch, r = this.rng.fork(23);
    B.box(1.9, 0.05, 11.0, -5.95, 0.02, -8.2, Mat.std('#3e3226', { roughness: 1 }), 0, { noShadow: true });
    B.box(0.06, 0.12, 11.0, -4.98, 0.06, -8.2, Mat.std('#6e5a44', { roughness: 0.9 }));
    this.flowers = [];
    const petal = [new THREE.MeshStandardMaterial({ color: '#e0b43a', roughness: 0.6, name: 'nstPetalY' }), new THREE.MeshStandardMaterial({ color: '#c96a8e', roughness: 0.6, name: 'nstPetalP' }), new THREE.MeshStandardMaterial({ color: '#e9e3d6', roughness: 0.6, name: 'nstPetalW' })];
    const stemM = new THREE.MeshStandardMaterial({ color: '#58733a', roughness: 0.8, name: 'nstStem' }), leafM = new THREE.MeshStandardMaterial({ color: '#4a6d35', roughness: 0.7, side: THREE.DoubleSide, name: 'nstBedLeaf' });
    this.bedMats = [...petal, stemM, leafM];
    for (let i = 0; i < 46; i++) {
      const x = -6.6 + r.range(0, 1.4), z = -2.9 - r.range(0, 10.6), h = r.range(0.7, 1.55), kind = i % 3;
      const g = new THREE.Group(); g.position.set(x, 0.03, z); g.rotation.y = r.range(0, 6.28); this.root.add(g);
      // a stem of 4 segments (bends from each joint), a head of petals, two leaves
      const segs = []; let parent = g;
      for (let k = 0; k < 4; k++) {
        const sg = new THREE.Group(); sg.position.y = k === 0 ? 0 : h / 4; parent.add(sg);
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, h / 4, 5), stemM); m.position.y = h / 8; m.castShadow = true; sg.add(m);
        if (k === 1 || k === 2) { const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.16), leafM); lf.position.set(0.04 * (k === 1 ? 1 : -1), h / 8, 0); lf.rotation.set(0.2, 0, (k === 1 ? -1 : 1) * 0.9); sg.add(lf); }
        segs.push(sg); parent = sg;
      }
      const head = new THREE.Group(); head.position.y = h / 4; parent.add(head);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10), Mat.std('#4a3320', { roughness: 0.9 })); head.add(disc);
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28, pm = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.07), petal[kind]); pm.position.set(Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05); pm.rotation.set(-Math.PI / 2 + 0.3, 0, 0); pm.rotation.y = -a + Math.PI / 2; pm.material.side = THREE.DoubleSide; head.add(pm); }
      head.rotation.x = -0.4;
      this.flowers.push({ segs, head, lag: r.range(0, 0.3), dir: r.range(-0.4, 0.4) });
    }
    // shrubs along the right fence
    for (let i = 0; i < 6; i++) this._shrub(4.3 - r.range(0, 0.4), -3.5 - i * 2.1, r.range(0.5, 0.8), r);
  }

  _shrub(x, z, s, r) {
    const B = this.batch;
    for (let k = 0; k < 3; k++) {
      const g = new THREE.IcosahedronGeometry(s * r.range(0.7, 1.0), 1);
      const cols = new Float32Array(g.attributes.position.count * 3), base = new THREE.Color().setHSL(r.range(0.22, 0.28), 0.3, 0.17);
      for (let i = 0; i < g.attributes.position.count; i++) { const y = g.attributes.position.getY(i) / s; const c = base.clone().offsetHSL(0, 0, 0.05 * y); cols.set([c.r, c.g, c.b], i * 3); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      B.add(g, this.m.foliage, Geo.matrix(x + r.range(-0.3, 0.3), s * 0.7, z + r.range(-0.4, 0.4), 0, r.next() * 3, 0, 1, 0.8, 1));
    }
  }

  _gardenTrees() {
    const r = this.rng.fork(24);
    this._tree(2.7, -8.8, r, 1.05);       // the apple tree (right, mid)
    this._tree(-4.4, -14.8, r, 1.4);      // the big one at the back left
    this._tree(3.6, -15.2, r, 1.15);
  }

  // ---------------------------------------------------------------- the park beyond the fence, neighbours' roofs
  _park() {
    const B = this.batch, r = this.rng.fork(25), m = this.m;
    // park trees
    for (let i = 0; i < 46; i++) { const x = r.range(-60, 60), z = -22 - r.range(0, 90); if (Math.abs(x + 0.4) < 3 && z > -40) continue; this._tree(x, z, r, r.range(1.2, 2.0)); }
    // a path, lamp posts, benches
    B.box(2.4, 0.02, 160, -0.4, 0.0, -100, Mat.std('#8f887a', { roughness: 0.95 }), 0, { noShadow: true });
    B.box(160, 0.02, 2.2, 0, 0.0, -34, Mat.std('#8f887a', { roughness: 0.95 }), 0, { noShadow: true });
    for (let z = -26; z > -120; z -= 18) { B.add(new THREE.CylinderGeometry(0.05, 0.07, 3.6, 8), m.metal, Geo.matrix(1.2, 1.8, z)); B.box(0.25, 0.3, 0.25, 1.2, 3.7, z, m.metal); }
    this._bench(-2.0, -30, Math.PI / 2); this._bench(2.4, -46, -Math.PI / 2);
    // neighbours' houses either side (roofs over the fences)
    const nh = (x, z, w, d, h, c) => { B.box(w, h, d, x, h / 2, z, Mat.std(c, { roughness: 0.9 })); B.add(new THREE.BoxGeometry(w + 0.4, 0.15, d * 0.62), Mat.std('#4d4743', { roughness: 0.85 }), Geo.matrix(x, h + 0.9, z - d * 0.23, 0.55, 0, 0)); B.add(new THREE.BoxGeometry(w + 0.4, 0.15, d * 0.62), Mat.std('#4d4743', { roughness: 0.85 }), Geo.matrix(x, h + 0.9, z + d * 0.23, -0.55, 0, 0)); };
    nh(-12.5, 3.0, 8, 7, 5.5, '#bfb6a6'); nh(10.5, 3.2, 8, 7, 5.2, '#a89580'); nh(-13, -24, 7, 6, 5.0, '#b3a894');
  }

  // ---------------------------------------------------------------- beyond the park: fields, woods and low hills
  // (they dry out with everything else: their grass and woods share the lawn's and the trees' wilting colours)
  _hills() {
    const B = this.batch, r = this.rng.fork(26), C = { x: 0, z: -60 };
    const hgt = (R, a) => Math.max(0, MathX.smooth(R, 200, 430) * (26 + 16 * Math.sin(a * 3 + 1.3) + 11 * Math.sin(a * 7 + R / 90) + 7 * Math.sin(R / 55 + a * 5)) + 9 * MathX.smooth(R, 260, 600) * Math.sin(a * 11 + R / 140)) - 0.08;
    this._hillH = (x, z) => { const R = Math.hypot(x - C.x, z - C.z), a = Math.atan2(z - C.z, x - C.x); return hgt(R, a); };
    const NA = 120, NR = 30, pos = [], idx = [];
    const Rs = Array.from({ length: NR }, (_, k) => 185 * Math.pow(1100 / 185, k / (NR - 1)));
    for (let i = 0; i < NA; i++) for (let k = 0; k < NR; k++) { const a = (i / NA) * Math.PI * 2, R = Rs[k]; pos.push(C.x + Math.cos(a) * R, hgt(R, a), C.z + Math.sin(a) * R); }
    for (let i = 0; i < NA; i++) { const j = (i + 1) % NA; for (let k = 0; k < NR - 1; k++) { const a = i * NR + k, b = j * NR + k; idx.push(a, b, b + 1, a, b + 1, a + 1); } }
    // a patchwork of fields (flat-shaded: each triangle one colour)
    let geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    geo = geo.toNonIndexed(); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { const P = geo.attributes.position; for (let i = 0; i < P.count; i += 3) for (let c = 0; c < 3; c++) { const t = P.getComponent(i + 1, c); P.setComponent(i + 1, c, P.getComponent(i + 2, c)); P.setComponent(i + 2, c, t); } geo.computeVertexNormals(); }
    const pal = ['#6f8a4b', '#7c9450', '#9a9d58', '#5f7a40', '#86904f', '#a7a35f'].map((c) => new THREE.Color(c));
    const P = geo.attributes.position, col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i += 3) {
      const x = (P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, z = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3;
      const c = pal[Math.floor(hash2(Math.floor(x / 70), Math.floor(z / 55)) * pal.length)], sh = 0.92 + 0.12 * hash1(i * 0.37);
      for (let v = 0; v < 3; v++) col.set([c.r * sh, c.g * sh, c.b * sh], (i + v) * 3);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.hillMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, name: 'nstHills' });
    this.hillMat.userData.grime = 0;
    const hills = new THREE.Mesh(geo, this.hillMat); hills.receiveShadow = false; hills.name = 'hills'; this.root.add(hills);
    // woods: clumps of low-poly crowns on the slopes and along the field edges
    for (let i = 0; i < 300; i++) {
      const a = r.range(0, Math.PI * 2), R = r.range(215, 720), x = C.x + Math.cos(a) * R, z = C.z + Math.sin(a) * R;
      if (z > -15 && Math.abs(x) < 60) continue;
      const s = r.range(5, 11) * (R / 400 + 0.5), g = new THREE.IcosahedronGeometry(s, 0);
      const cols = new Float32Array(g.attributes.position.count * 3), base = new THREE.Color().setHSL(r.range(0.22, 0.3), 0.32, r.range(0.13, 0.19));
      for (let k = 0; k < g.attributes.position.count; k++) { const c = base.clone().offsetHSL(0, 0, 0.04 * g.attributes.position.getY(k) / s); cols.set([c.r, c.g, c.b], k * 3); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      B.add(g, this.m.foliage, Geo.matrix(x, hgt(R, a) + s * 0.55, z, 0, r.next() * 3, 0, 1, 0.75, 1), { noShadow: true });
    }
  }

  // ---------------------------------------------------------------- the sunflower by the lawn (the plant you see wilt; the payoff's leaf)
  // a stem of jointed segments (it bows from each joint), big heart-shaped leaves, a heavy head
  _sunflower() {
    const S = NST_G.sunflower, g = new THREE.Group(); g.position.set(S.x, 0, S.z); g.rotation.y = 0.55; this.root.add(g);
    const stemM = new THREE.MeshStandardMaterial({ color: '#557a35', roughness: 0.6, name: 'nstSunStem' });
    // leaves: a vein texture (midrib, side veins, a paler edge) so the big hero leaf reads up close
    const lcv = Tex.canvas(256, 256), lc = lcv.getContext('2d');
    lc.fillStyle = '#dcdcdc'; lc.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 400; i++) { lc.fillStyle = `rgba(${hash1(i) > 0.5 ? '255,255,255' : '60,60,60'},${0.04 + 0.05 * hash1(i * 3)})`; lc.beginPath(); lc.arc(hash1(i * 7) * 256, hash1(i * 11) * 256, 2 + 6 * hash1(i * 13), 0, 6.28); lc.fill(); }
    lc.strokeStyle = 'rgba(255,255,235,0.75)'; lc.lineWidth = 4; lc.beginPath(); lc.moveTo(128, 0); lc.lineTo(128, 256); lc.stroke();
    lc.lineWidth = 2;
    for (let k = 0; k < 9; k++) { const y = 20 + k * 26; for (const sd of [1, -1]) { lc.beginPath(); lc.moveTo(128, y); lc.quadraticCurveTo(128 + sd * 50, y + 14, 128 + sd * 118, y + 46); lc.stroke(); } }
    const leafT = Tex.tex(lcv);
    const leafM = new THREE.MeshStandardMaterial({ color: '#5a8a3c', map: leafT, roughness: 0.45, side: THREE.DoubleSide, name: 'nstSunLeaf' });
    const petalM = new THREE.MeshStandardMaterial({ color: '#f0bf2a', roughness: 0.55, side: THREE.DoubleSide, name: 'nstSunPetal' });
    const discM = new THREE.MeshStandardMaterial({ color: '#3a2615', roughness: 0.9, flatShading: true, name: 'nstSunDisc' });
    this.sunMats = { stem: stemM, leaf: leafM, petal: petalM };
    this.sunBase = { stem: stemM.color.clone(), leaf: leafM.color.clone(), petal: petalM.color.clone() };
    const leafGeo = (L, W) => {
      const sh = new THREE.Shape(); sh.moveTo(0, 0);
      sh.bezierCurveTo(W * 0.62, L * 0.02, W * 0.6, L * 0.6, 0, L); sh.bezierCurveTo(-W * 0.6, L * 0.6, -W * 0.62, L * 0.02, 0, 0);
      const geo = new THREE.ShapeGeometry(sh, 12), P = geo.attributes.position, UV = geo.attributes.uv;
      for (let i = 0; i < P.count; i++) { UV.setXY(i, 0.5 + P.getX(i) / W, P.getY(i) / L); }
      for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, Math.abs(x) * 0.22 - 0.06 * Math.sin(x * 40) * (y / L) * 0.1 + 0.25 * (y / L) * (y / L) * L * -0.6); }
      geo.computeVertexNormals();
      return geo;
    };
    // the leaf shape lies in its XY plane along +Y (normal +Z): turn it so it runs along +X with its face up
    this._leafQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
    const segs = [], leaves = [], N = 6, H = 1.68;
    let parent = g;
    for (let k = 0; k < N; k++) {
      const sg = new THREE.Group(); sg.position.y = k === 0 ? 0 : H / N; parent.add(sg);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0115 - 0.0008 * k, 0.0125 - 0.0008 * k, H / N + 0.004, 7), stemM); m.position.y = H / (2 * N); m.castShadow = true; sg.add(m);
      if (k >= 1) for (const side of k === 3 ? [1, -1] : [k % 2 ? 1 : -1]) {
        const L = k === 3 && side > 0 ? 0.31 : 0.22 - 0.015 * Math.abs(k - 3), node = new THREE.Group();
        const hero = k === 3 && side > 0;
        node.position.y = H / N * 0.7; node.rotation.y = hero ? -0.22 : side > 0 ? 0.1 * k + 1.1 : Math.PI + 0.15 * k + 1.1; sg.add(node);     // (the hero leaf points out over the pond)
        const pet = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.08, 5), stemM); pet.rotation.z = -Math.PI / 2 + 0.6; pet.position.set(0.032, 0.022, 0); node.add(pet);
        const piv = new THREE.Group(); piv.position.set(0.066, 0.045, 0); node.add(piv);
        const lf = new THREE.Mesh(leafGeo(L, L * 0.9), leafM); lf.quaternion.copy(this._leafQ); lf.castShadow = true;
        const tilt = new THREE.Group(); tilt.add(lf); piv.add(tilt);
        leaves.push({ tilt, base: -0.35 + 0.08 * k, k, hero, L });
      }
      segs.push(sg); parent = sg;
    }
    // the head: a seed disc, two rings of petals, green bracts behind
    const head = new THREE.Group(); head.position.y = H / N; parent.add(head);
    const face = new THREE.Group(); face.rotation.x = 1.25; head.add(face);     // facing out, toward the house
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.035, 24), discM); face.add(disc);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), stemM); back.position.y = -0.005; face.add(back);
    for (let k = 0; k < 30; k++) {
      const a = k / 30 * Math.PI * 2 + (k % 2) * 0.1, pm = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.085), petalM);
      const pg = new THREE.Group(); pg.rotation.y = -a; face.add(pg);
      pm.position.set(0, 0.012 - 0.004 * (k % 2), 0.115 + 0.006 * (k % 2)); pm.rotation.x = -Math.PI / 2 + 0.12 + 0.1 * (k % 2); pg.add(pm);
      this._sunPetals = this._sunPetals || []; this._sunPetals.push(pm);
    }
    this.sunflower = { g, segs, leaves, head, face, hero: leaves.find((l) => l.hero) };
    // the thread of rain water running off the hero leaf's tip (no drop can form there)
    this.tipThread = new NstStream(this.root, nstWaterMat({ color: '#dce9ec', opacity: 0.62, fres: 0.85, env: 1.2 }), { a: new THREE.Vector3(), v0: new THREE.Vector3(0, -0.06, 0), r0: 0.0021, yEnd: 0.0, ns: 60, nrad: 7, seed: 91, spread: 0.35, frayLen: 0.4 });
    this.leafFilmMat = nstWaterMat({ color: '#9db8bd', opacity: 0, fres: 0.7, env: 1.3, side: THREE.DoubleSide, rough: 0.02 });
    const hl = this.sunflower.hero;
    const film = new THREE.Mesh(leafGeo(hl.L * 0.985, hl.L * 0.88), this.leafFilmMat); film.quaternion.copy(this._leafQ); film.position.y = 0.0012; film.renderOrder = 4; hl.tilt.add(film);
    this._tipW = new THREE.Vector3(); this._baseW = new THREE.Vector3();
  }

  // the hero leaf's tip in world space (the payoff camera and the thread use it)
  sunflowerTip(out, base = null) {
    const hl = this.sunflower.hero, lf = hl.tilt.children[0];
    this.sunflower.g.updateMatrixWorld(true);
    if (base) base.set(0, 0, 0).applyMatrix4(lf.matrixWorld);
    return out.set(0, hl.L * 0.999, -0.15 * hl.L).applyMatrix4(lf.matrixWorld);
  }

  _updateSunflower(t) {
    const F = this.sunflower, w = nstWilt(t), rain = nstRain(t);
    // the stem bows from each joint, more toward the top; the head hangs; leaves droop from the petiole
    const bend = [0.0, 0.05, 0.1, 0.17, 0.28, 0.42];        // most near the top; seen from the lawn it bows sideways, toward the water
    F.segs.forEach((s, k) => { s.rotation.z = -bend[k] * w; s.rotation.x = 0.03 * k * w; });     // (it bows out over the pond)
    F.face.rotation.x = 1.25 + 1.45 * w;
    // a gust on the closing line: the leaf dips and springs back, a surge of water runs down it and off the tip (still no drop)
    const gu = t - (NST.line2 + 0.1), gust = gu > 0 ? Math.exp(-gu / 0.8) * Math.sin(gu * 8.5) : 0, surge = gu > 0 ? MathX.smooth(gu, 0.2, 0.55) * Math.exp(-gu / 1.6) : 0;
    for (const l of F.leaves) l.tilt.rotation.set(0, 0, l.base - (l.hero ? 0.38 : 1.15 * (0.7 + 0.1 * l.k)) * w - (l.hero ? 0.16 : 0.08) * gust);     // (the hero leaf arches; the rest hang)
    // green → olive → brown; petals curl brown
    const S = this.sunMats, B = this.sunBase, dry = this._sunDry || (this._sunDry = { leaf: new THREE.Color('#7a6a36'), petal: new THREE.Color('#8a6a2a'), stem: new THREE.Color('#6d6a38') });
    S.leaf.color.copy(B.leaf).lerp(dry.leaf, 0.85 * w); S.petal.color.copy(B.petal).lerp(dry.petal, 0.9 * w); S.stem.color.copy(B.stem).lerp(dry.stem, 0.7 * w);
    S.leaf.emissive.copy(S.leaf.color).multiplyScalar(0.12 * MathX.smooth(t, NST.dive + 3, NST.land));      // (a little fill on the hero leaf for the close-up in the grey rain)
    // wet in the rain: glossy, a film of water over the hero leaf; the tip lets it go as a thread, never a drop
    S.leaf.roughness = MathX.lerp(0.45, 0.18, rain);
    this.leafFilmMat.opacity = (0.1 + 0.14 * surge) * rain;
    this.sunflowerTip(this._tipW);
    const th = this.tipThread;
    th.a.copy(this._tipW); th.yEnd = NST_G.pond.y; th.T = (th.v0.y + Math.sqrt(th.v0.y * th.v0.y + 2 * 9.81 * Math.max(0.02, th.a.y - th.yEnd))) / 9.81;     // (into the pond: no drop, no splash, no ring)
    th.update(t, MathX.smooth(t, NST.rain + 0.5, NST.rain + 2.0) * (0.8 + 0.2 * Math.sin(t * 2.3)) * (1 + 2.2 * surge), 1);
  }

  // ---------------------------------------------------------------- rain (torn spray), mist veils
  _rainSystems() {
    this.streaks = new StreakSystem(this.scene, 7600);
    this.mist = new BillboardSystem(this.scene, 900, false);
    this.mist.mesh.renderOrder = 6;
    this.mist.uniforms.uLight.value = 1.0;
  }

  // ---------------------------------------------------------------- a mallard drake on the pond, soaked through
  // A duck stays dry because water would have to squeeze into the tiny gaps between its feather barbs, and surface
  // tension won't let it. With none, water soaks in, the air trapped in the plumage is gone and it rides low, dark and
  // spiky-wet, paddling hard to stay up (the same thing happens to water birds caught in a detergent spill).
  _duck() {
    const wetK = 0.92;
    const paint = (geo, fn) => { const P = geo.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color(); for (let i = 0; i < P.count; i++) { fn(P.getX(i), P.getY(i), P.getZ(i), c); col.set([c.r * wetK, c.g * wetK, c.b * wetK], i * 3); } geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return geo; };
    const fm = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.3, envMapIntensity: 1.3, name: 'nstDuck' });
    fm.userData.grime = 0;
    const C = (h) => new THREE.Color(h);
    const cols = { tail: C('#1b1b1c'), tailW: C('#d6d4cc'), breast: C('#5a3323'), back: C('#776f63'), flank: C('#9b968c'), spec: C('#2b4f9e'), green: C('#1d5a39'), white: C('#e2e0d8') };
    const d = new THREE.Group(); this.root.add(d); this.duck = d;
    const body = new THREE.Group(); d.add(body); this.duckBody = body;
    // body: an egg with a raised, pointed tail; the wet feathers clump (vertices jittered in and out, the same at the seams)
    const bg = new THREE.SphereGeometry(1, 18, 12);
    paint(bg, (x, y, z, c) => {
      if (z > 0.78) c.copy(cols.tail); else if (z > 0.66) c.copy(cols.tailW);
      else if (z < -0.42 && y < 0.62) c.copy(cols.breast);
      else if (Math.abs(x) > 0.72 && z > 0.02 && z < 0.4 && y > 0.0 && y < 0.42) c.copy(cols.spec);
      else if (y > 0.38) c.copy(cols.back); else c.copy(cols.flank);
    });
    { const P = bg.attributes.position; for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), tail = Math.max(0, z - 0.45);
      const j = 1 + 0.16 * (hash1(Math.round(x * 40) * 7.13 + Math.round(y * 40) * 131.7 + Math.round(z * 40) * 17.9) - 0.5);
      P.setXYZ(i, x * 0.118 * (1 - 0.55 * tail) * j, (y * 0.082 + 0.1 * tail * tail) * j, z * 0.2);
    } bg.computeVertexNormals(); }
    const bm = new THREE.Mesh(bg, fm); bm.castShadow = true; body.add(bm);
    // neck and head (green, a white collar), yellow bill, black eyes
    const neck = new THREE.Group(); neck.position.set(0, 0.04, -0.15); body.add(neck); this.duckNeck = neck;
    const ng = paint(new THREE.CylinderGeometry(0.028, 0.042, 0.066, 10), (x, y, z, c) => c.copy(y < -0.016 ? cols.breast : y < -0.004 ? cols.white : cols.green));
    const nm = new THREE.Mesh(ng, fm); nm.position.y = 0.028; nm.rotation.x = -0.3; neck.add(nm);
    const hg = paint(new THREE.SphereGeometry(0.047, 12, 9), (x, y, z, c) => c.copy(cols.green));
    const head = new THREE.Mesh(hg, fm); head.scale.set(0.86, 0.95, 1.16); head.position.set(0, 0.074, -0.026); neck.add(head);
    const bill = new THREE.Mesh(new THREE.CylinderGeometry(0.0088, 0.0145, 0.058, 7), new THREE.MeshStandardMaterial({ color: '#cfa935', roughness: 0.45, flatShading: true, name: 'nstBill' }));
    bill.rotation.x = -Math.PI / 2; bill.scale.set(1, 1, 0.45); bill.position.set(0, 0.063, -0.084); neck.add(bill);
    for (const sd of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 6, 5), new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.2 })); e.position.set(sd * 0.03, 0.083, -0.044); neck.add(e); }
    // legs and webbed feet (under water: paddling)
    const legM = new THREE.MeshStandardMaterial({ color: '#f07a26', roughness: 0.5, side: THREE.DoubleSide, emissive: '#5a2008', name: 'nstDuckFoot' });
    const web = new THREE.Shape(); web.moveTo(0, 0); web.lineTo(-0.038, 0.06); web.lineTo(-0.014, 0.054); web.lineTo(0, 0.074); web.lineTo(0.014, 0.054); web.lineTo(0.038, 0.06); web.lineTo(0, 0);
    const wg = new THREE.ShapeGeometry(web);
    this.duckLegs = [1, -1].map((sd) => {
      const hip = new THREE.Group(); hip.position.set(sd * 0.045, -0.05, 0.04); body.add(hip);
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0065, 0.075, 6), legM); shin.position.y = -0.0375; hip.add(shin);
      const foot = new THREE.Group(); foot.position.y = -0.075; hip.add(foot);
      const fw = new THREE.Mesh(wg, legM); fw.rotation.x = -Math.PI / 2; foot.add(fw);
      return { hip, foot, sd };
    });
    d.visible = false;
  }

  // ---------------------------------------------------------------- per frame
  update(t, cam) {
    const day = nstDay(t), wilt = nstWilt(t), storm = nstStorm(t), rain = nstRain(t), U = this.skyUniforms;
    // time of day (only moves in the time-lapse), storm deck
    nstSunDir(day, this.sunDir);
    const dl = nstDaylight(day);
    U.uTime.value = t + Math.max(0, Math.min(t, NST.lapse1) - NST.lapse0) * 60;
    U.uNight.value = 1 - dl; U.uStorm.value = storm; U.uCloud.value = 0.32 + 0.2 * MathX.smooth(t, NST.lapse0, NST.lapse1);
    const zen = U.uZenith.value, hor = U.uHorizon.value, fogC = this.scene.fog.color;
    zen.copy(this.nightCols.zen).lerp(this.dayCols.zen, dl).lerp(this.stormCols.zen, storm);
    hor.copy(this.nightCols.hor).lerp(this.dayCols.hor, dl).lerp(this.stormCols.hor, storm);
    fogC.copy(this.nightCols.fog).lerp(this.dayCols.fog, dl).lerp(this.stormCols.fog, storm);
    // dusk warmth near the horizon when the sun is low
    const low = 1 - MathX.smooth(this.sunDir.y, 0.05, 0.35);
    hor.lerp(new THREE.Color('#e0a97c'), 0.45 * low * dl * (1 - storm));
    this.scene.background.copy(hor);
    this.scene.fog.density = MathX.lerp(0.0032, 0.012, storm) * (1 + 0.45 * rain) * (1 - 0.78 * (cam ? MathX.smooth(cam.position.y, 2.5, 14) : 0));   // thinner high up: you see the land
    // lightning: two flashes during the payoff
    const fl = nstFlash(t);
    U.uFlash.value = fl;
    // sun + sky light
    const f = this.focus;
    this.sun.position.copy(this.sunDir).multiplyScalar(60).add(f); this.sun.target.position.copy(f);
    this.sun.intensity = 3.2 * MathX.smooth(this.sunDir.y, -0.02, 0.18) * (1 - storm);      // (lightning lights the sky dome, not the sun: sun-cast flashes threw hard house shadows on the lawn)
    this.sun.color.setRGB(1, 0.93 - 0.18 * low, 0.84 - 0.3 * low);
    this.hemi.intensity = (0.8 + 0.45 * dl) * (1 - 0.35 * storm) + 4.0 * fl + 0.45 * MathX.smooth(t, NST.duck, NST.duck + 0.5);      // (moonlit nights, not black)
    this.hemi.color.copy(zen).lerp(new THREE.Color('#b9cfe0'), 0.5);
    this.scene.environmentIntensity = (0.18 + 0.24 * dl) * (1 - 0.3 * storm);

    // wilting: lawn toward straw, leaves toward olive, flowers bow, potted leaves droop
    // (pushed further toward straw under the storm light, which otherwise turns dry grass back to olive green)
    this.lawnMat.color.setRGB(0.85 + (0.8 + 0.45 * storm) * wilt, 0.85 + (0.12 + 0.06 * storm) * wilt, 0.85 - (0.25 + 0.2 * storm) * wilt);      // (linear multipliers: green → dry straw)
    this.m.foliage.color.setRGB(1 + 0.3 * wilt, 1 - 0.3 * wilt, 1 - 0.45 * wilt);         // (dull olive-brown, not autumn gold)
    this.hillMat.color.setRGB(0.92 + (0.75 + 0.35 * storm) * wilt, 0.92 + 0.1 * wilt, 0.92 - 0.32 * wilt);
    for (const fw of this.flowers) {
      const w = MathX.clamp(wilt * 1.25 - fw.lag, 0, 1);
      fw.segs.forEach((s, k) => { s.rotation.x = (k === 0 ? 0.08 : 0.2 * k * k) * w * 2.2; s.rotation.z = fw.dir * 0.15 * w; });
      fw.head.rotation.x = -0.4 + 2.2 * w;
    }
    if (!this._bedBase) this._bedBase = this.bedMats.map((mm) => mm.color.clone());
    const brown = this._brown || (this._brown = new THREE.Color('#7a5c3a'));
    this.bedMats.forEach((mm, i) => mm.color.copy(this._bedBase[i]).lerp(brown, (i < 3 ? 0.8 : 0.7) * wilt));
    this.reedMat.color.set('#5c7038').lerp(this._reedDry || (this._reedDry = new THREE.Color('#857a4c')), 0.85 * wilt);
    this._droop(this.potPlantA, t < NST.lapse ? 0 : wilt);
    this._droop(this.potPlantB, t < NST.lapse ? 0.25 * MathX.smooth(t, NST.wick - 2, NST.wick + 3) : Math.min(1, wilt * 1.3));
    this._droop(this.bigPlant, wilt);

    // the pond: striders. Before the change they would stand in dimples; now: crowded on a pad, one steps off and falls through
    this._updateStriders(t);
    this.pondMat.roughness = 0.06 + 0.25 * rain;
    this.pondMat.color.set('#3d5a58').lerp(new THREE.Color('#58686a'), 0.5 * rain);
    // the patio and the bench get a wet sheen in the rain
    this.patioMat.roughness = MathX.lerp(0.85, 0.32, rain);
    this.patioMat.color.setScalar(1 - 0.35 * rain);

    // the watering-can pour: soil darkens while water runs through, then dries; the saucer fills, overflows, drips off
    const T = NST, pr = MathX.smooth(t, T.pour + 0.25, T.pour + 0.6) * (1 - MathX.smooth(t, T.pourEnd - 0.1, T.pourEnd + 0.3));
    const through = MathX.smooth(t, T.pour + 0.55, T.pour + 0.85) * (1 - MathX.smooth(t, T.pourEnd + 0.2, T.pourEnd + 1.6));
    this.soilAMat.color.set('#6a5442').lerp(new THREE.Color('#2e2219'), MathX.smooth(t, T.pour + 0.4, T.pour + 0.8) * (1 - 0.75 * MathX.smooth(t, T.pourEnd + 0.4, T.pourEnd + 3.0)));
    this.drains.forEach((d, i) => d.update(t, through * (0.8 - i * 0.15), 1));
    const sf = MathX.smooth(t, T.pour + 0.7, T.pour + 1.4);
    this.saucW.visible = sf > 0.01; this.saucW.position.y = NST_G.bench.top + 0.004 + 0.022 * sf;
    const ds = t - (T.pour + 1.5);
    this.benchSpill.mesh.visible = ds > 0 && t < T.lapse;
    if (ds > 0) { const V = 60e-6 * MathX.clamp(ds / 3, 0.15, 1), R = 0.13 + nstSpreadR(V, ds) * 1.2; this.benchSpill.set(R, V / (Math.PI * R * R * 0.85), 1, 0.18, [1.25, 0.9]); }
    const ed = MathX.smooth(t, T.pour + 2.3, T.pour + 2.8) * (1 - MathX.smooth(t, T.pourEnd + 1.2, T.pourEnd + 3.2));
    this.edgeDrips.forEach((d, i) => d.update(t, ed * (0.7 - i * 0.18), 1));

    this._updateSunflower(t);
    this._updateDuck(t);

    // rain: torn streaks (falling water that can't hold drop shape breaks into ligaments) + drifting mist veils
    this._updateRain(t, rain, cam);
  }

  _updateDuck(t) {
    const T = NST, D = NST_G.duck, P = NST_G.pond, d = this.duck;
    d.visible = t > T.duck - 1.0;
    if (!d.visible) return;
    const ph = (t - T.duck) * Math.PI * 2 * 1.7;                   // paddling hard: ~1.7 strokes a second
    // past the camera at the waterline; later it paddles under the sunflower's leaf, through the close-up
    if (!this._duckPath) { const K = [[T.dive, D.to], [T.land, D.drift[0]], [T.line2, D.drift[1]], [T.end, D.drift[2]]]; this._duckPath = [0, 1].map((c) => new SmoothTrack(K.map(([tt, v]) => [tt, v[c]]))); }
    const at = (u) => u < T.dive ? [MathX.lerp(D.from[0], D.to[0], MathX.clamp((u - T.duck) / (T.dive - T.duck), 0, 1)), MathX.lerp(D.from[1], D.to[1], MathX.clamp((u - T.duck) / (T.dive - T.duck), 0, 1))] : [this._duckPath[0].value(u), this._duckPath[1].value(u)];
    let [x, z] = at(t);
    const nx = at(t < T.dive ? Math.min(t + 0.05, T.dive - 0.001) : t + 0.05), px = at(t < T.dive ? Math.min(t, T.dive - 0.051) : Math.max(t - 0.05, T.dive));
    let dx = nx[0] - px[0], dz = nx[1] - px[1]; if (Math.hypot(dx, dz) < 1e-5) { dx = D.to[0] - D.from[0]; dz = D.to[1] - D.from[1]; }
    const L = Math.hypot(dx, dz);
    x += (dx / L) * 0.006 * Math.sin(ph); z += (dz / L) * 0.006 * Math.sin(ph);       // a surge with each stroke
    d.position.set(x, P.y - 0.034 + 0.005 * Math.sin(ph * 2 + 0.6), z);               // riding low: only its back and head clear the water
    d.rotation.set(0, Math.atan2(-dx, -dz) + 0.12 * Math.sin(t * 0.7), 0);
    this.duckBody.rotation.set(0.07 + 0.03 * Math.sin(ph * 2), 0, 0.05 * Math.sin(ph));
    this.duckNeck.rotation.set(-0.12 + 0.1 * Math.sin(ph * 2 + 1.2), 0.35 * Math.sin(t * 0.9 + 0.5), 0);
    for (const l of this.duckLegs) {
      const p = ph + (l.sd > 0 ? 0 : Math.PI), sw = Math.sin(p), back = Math.cos(p) < 0;      // the backward stroke pushes with the web spread
      l.hip.rotation.x = 0.15 + 0.7 * sw;
      l.foot.rotation.x = back ? 0.9 : -0.5;
      l.foot.scale.x = back ? 1 : 0.4;
    }
  }

  _droop(plant, w) {
    for (const L of plant.userData.leaves) { L.leaf.rotation.x = L.base + 2.2 * w * (0.8 + 0.2 * L.k); L.sm.rotation.z = 0.12 + 0.75 * w; }
    // limp, then dry: dull olive → brown
    plant.userData.mats[0].color.set('#46713a').lerp(this._dryA || (this._dryA = new THREE.Color('#6b5530')), 0.85 * w);
    plant.userData.mats[1].color.set('#5a8642').lerp(this._dryB || (this._dryB = new THREE.Color('#7d6a3c')), 0.85 * w);
  }

  _updateStriders(t) {
    const P = NST_G.pond, pad = NST_G.pads[0], ys = P.y, T = NST;
    const foot = new THREE.Vector3();
    const place = (g, x, y, z, yaw, legFn) => {
      g.position.set(x, y, z); g.rotation.set(0, yaw, 0);
      for (const l of g.userData.legs) { legFn(l, foot); this._leg(l, foot); }
    };
    // standing legs: feet spread around the body at the support height (local y), slight idle twitch
    const stand = (yLocal, tw) => (l, out) => { const a = l.ang; out.set(Math.sin(a) * l.L, yLocal, -Math.cos(a) * l.L * 0.9 + tw * 0.002 * Math.sin(t * 7 + l.ang * 3)); };
    // 1, 2: on the lily pad (pad top ≈ ys + 0.004)
    place(this.striders[1], pad[0] + 0.022, ys + 0.006, pad[1] + 0.01, 0.6, stand(-0.004, 1));
    place(this.striders[2], pad[0] - 0.026, ys + 0.006, pad[1] - 0.014, -2.2, stand(-0.004, 1));
    // 0: the hero — walks to the pad's edge, steps onto the water, punches through, struggles, sinks
    const s0 = this.striders[0], u = t - T.strider;
    // (it walks to the pad's left edge, in open water, so you see it go through)
    const px = pad[0] - 0.074, pz = pad[1] - 0.004;
    if (u < 0) {
      const k = Ease.inOutSine(MathX.clamp((t - T.pond - 0.3) / (T.strider - T.pond - 0.3), 0, 1));
      place(s0, MathX.lerp(px + 0.05, px, k), ys + 0.006, MathX.lerp(pz + 0.02, pz, k), Math.PI / 2 - 0.3, stand(-0.004, 2));
    } else {
      // nothing holds its feet up: it goes through slowly enough to see, then hangs just under the surface, kicking
      const fall = Math.min(1, u / 0.6), sink = Math.max(0, u - 0.6);
      const y = ys + 0.006 - 0.011 * Ease.inQuad(fall) - 0.005 * (1 - Math.exp(-sink * 0.5)) - 0.0012 * sink;
      const flail = (l, out) => { const a = l.ang + 0.6 * Math.sin(u * 14 + l.ang * 4) * Math.exp(-sink * 0.25); out.set(Math.sin(a) * l.L, 0.004 * Math.sin(u * 11 + l.ang), -Math.cos(a) * l.L * 0.9); };
      place(s0, px - 0.014 * Math.min(1, u * 2) - 0.004 * sink, y, pz + 0.004 * Math.min(1, u * 3), Math.PI / 2 - 0.3 + 0.4 * Math.sin(u * 2) * Math.min(1, sink), u < 0.08 ? stand(-0.004 - u * 0.2, 0) : flail);
    }
    // the ripples from the break-through (gravity ripples: faint, slow)
    this.ripples.forEach((m, k) => {
      const ru = u - 0.15 - k * 0.6, on = ru > 0 && ru < 2.2;
      m.visible = on; if (!on) return;
      const R = 0.008 + 0.06 * ru; m.scale.set(R, R, 1);
      m.position.set(px - 0.014, ys + 0.0012, pz + 0.004);
      m.material.opacity = 0.16 * (1 - ru / 2.2) * MathX.smooth(ru, 0, 0.08) * (k ? 0.6 : 1);
    });
    // 3: already drowned under the surface near the pads, drifting
    place(this.striders[3], pad[0] - 0.09 + 0.004 * Math.sin(t * 0.3), ys - 0.035, pad[1] + 0.05, 1.2 + 0.05 * t, (l, out) => { const a = l.ang * 1.1; out.set(Math.sin(a) * l.L, -0.003 + 0.002 * Math.sin(t * 2 + l.ang), -Math.cos(a) * l.L); });
  }

  _updateRain(t, rain, cam) {
    const S = this.streaks, M = this.mist;
    S.begin(); M.begin(this.scene.fog);
    if (rain > 0.01 && cam) {
      const cp = cam.position, H = 10;
      // without surface tension falling water can't stay as drops: it falls as slow, wavy torn ribbons (like the tap's
      // stream) that twist and fray (≈1.5–3 m/s, not the 9 m/s of big raindrops) and drift on the wind. Each slot is
      // one ribbon drawn as a short twisting polyline; nothing is drawn right at the lens (up close they read as scratches).
      const N = Math.floor(950 * rain), box = 8, P = this._rp || (this._rp = new Float32Array(18)), WY = NST_G.pond.y;
      for (let i = 0; i < N; i++) {
        const vf = 1.5 + 1.5 * hash1(i * 1.3), per = H / vf;
        const ph = hash1(i * 2.7 + 1) * per, cyc = Math.floor((t + ph) / per), age = (t + ph) / per - cyc, tt = age * per;
        const hx = hash2(i, cyc), hz = hash2(i + 77, cyc), sz = 0.35 + hash1(i * 5 + cyc) * 0.65;
        const wind = 2.0 + 0.8 * Math.sin(t * 0.7 + hx * 3);
        const x0 = cp.x + (hx - 0.5) * 2 * box - wind * per * 0.5, z0 = cp.z + (hz - 0.5) * 2 * box, y = cp.y + 5 - vf * tt;
        const x = x0 + wind * tt + 0.15 * Math.sin(tt * 3 + i), z = z0 + 0.12 * Math.sin(tt * 2.3 + i * 1.7);
        const d = Math.hypot(x - cp.x, y - cp.y, z - cp.z), dn = cp.y > 1.8 ? 2.6 : t > NST.dive ? 1.5 : 1.0; if (d < dn) continue;
        const near = MathX.smooth(d, dn, dn * 1.85);
        // the ribbon trails up-wind of its head: length 0.2–0.6 m, a helical twist that travels along it
        const L = 0.2 + 0.4 * sz, hyp = Math.hypot(wind, vf), dx = -wind / hyp, dy = vf / hyp;
        const A = (0.018 + 0.03 * sz) * (1 - 0.7 * MathX.smooth(cp.y, 2, 6)), ph0 = hash1(i * 9.1 + cyc) * 6.283, gap = Math.floor(hash1(i * 4.4 + cyc) * 7);     // (seen from above, the twist reads as squiggles)
        const a = 0.2 * rain * (0.55 + 0.45 * sz) * Math.min(1, age * 8) * Math.min(1, (1 - age) * 8) * near;
        for (let k = 0; k < 6; k++) {
          const u = k / 5, w = A * (0.35 + 0.65 * u), q = ph0 + u * 7.5 - tt * 5;
          P[k * 3] = x + dx * L * u - dy * w * Math.sin(q);
          P[k * 3 + 1] = y + dy * L * u + dx * w * Math.sin(q);
          P[k * 3 + 2] = z + w * 0.8 * Math.cos(q);
        }
        for (let k = 0; k < 5; k++) {
          if (k === gap) continue;                                 // torn: one link missing on most ribbons
          // (water that reaches the pond just joins it: no splash, no ring. Nothing is drawn below its surface)
          const ya = P[k * 3 + 1], yb = P[k * 3 + 4];
          if (ya < WY && yb < WY) continue;
          if (ya < WY || yb < WY) { const f = (WY - ya) / (yb - ya), lo = ya < WY ? 0 : 3; for (let c = 0; c < 3; c++) P[k * 3 + lo + c] = P[k * 3 + c] + (P[k * 3 + 3 + c] - P[k * 3 + c]) * f; }
          const u = k / 5, ak = a * (1 - 0.55 * u), wk = (0.011 + 0.012 * sz) * (1 - 0.45 * u);     // (wide translucent strips: thin lines read as scratches)
          // the streak quad overhangs its ends by its width: pull the ends in so links don't overlap into bright beads
          const ex = P[k * 3 + 3] - P[k * 3], ey = P[k * 3 + 4] - P[k * 3 + 1], ez = P[k * 3 + 5] - P[k * 3 + 2], el = Math.hypot(ex, ey, ez) || 1, f = wk / el;
          S.push(P[k * 3] + ex * f, P[k * 3 + 1] + ey * f, P[k * 3 + 2] + ez * f, P[k * 3 + 3] - ex * f, P[k * 3 + 4] - ey * f, P[k * 3 + 5] - ez * f, 0.72, 0.82, 0.92, ak, wk);
        }
      }
      // mist: the falling water shreds into fine spray that drifts with the wind: a few huge, faint sheets far off
      // (never close to the lens: up close, soft billboards read as cotton balls)
      const NV = cp.y < 2.5 ? Math.floor(70 * rain) : 0;
      for (let i = 0; i < NV; i++) {
        const per = 5 + 3 * hash1(i * 3.1), ph = hash1(i * 1.9 + 4) * per, cyc = Math.floor((t + ph) / per), age = ((t + ph) / per - cyc);
        const R = 9 + 32 * hash1(i * 5.3 + cyc), an = hash2(i, cyc + 9) * 6.283;
        const x = cp.x + Math.cos(an) * R + (age - 0.5) * 10, z = cp.z + Math.sin(an) * R, y = 1.5 + 6 * hash1(i * 7.7 + cyc) - age * 2;
        const a = 0.035 * rain * Math.sin(age * Math.PI) * (1 - MathX.smooth(cp.y, 1.8, 2.5));   // (big sheets seen from above cut the ground in wedges)
        M.push(x, y, z, 12 + 10 * hash1(i * 9 + cyc), age * 0.3 + i, a, 1.0, 0.7, 0.74, 0.76);
      }
      // low over the pond: the rain arriving as mist, a soft grey hiss lying on the water (seen from the waterline)
      if (t > NST.duck - 0.5 && t < NST.dive) {
        const W = NST_G.pond;
        for (let i = 0; i < 34; i++) {
          const per = 4 + 3 * hash1(i * 2.3), ph = hash1(i * 5.9 + 2) * per, cyc = Math.floor((t + ph) / per), age = (t + ph) / per - cyc;
          const x = W.x + (hash2(i, cyc + 3) - 0.5) * 3.4 + (age - 0.5) * 1.2, z = W.z + (hash2(i + 40, cyc) - 0.6) * 3.0;
          const a = 0.05 * rain * Math.sin(age * Math.PI);
          M.push(x, W.y + 0.06 + 0.3 * hash1(i * 3.3 + cyc), z, 1.1 + 1.6 * hash1(i * 7.1 + cyc), age * 0.4 + i, a, 1.0, 0.72, 0.76, 0.78);
        }
      }
    }
    S.end(); M.end();
  }
}
