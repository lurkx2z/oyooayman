/* =====================================================================
   THE SEA AND THE WAVE
   · the seabed: an analytic height field (the same function in JS and in
     the water shader, built from sines so both agree to the centimetre):
     a beach under the sea wall, a sandy shelf with bars and undulations,
     a dredged harbour basin inside a rubble breakwater, deep water beyond;
     wet sand → dark mud with algae as it gets deeper; rocks on it;
   · the water: one surface at the sea level (it drains by 38 m), coloured
     by its depth over the known seabed: see-through near the shore, a
     foam line at the waterline, overcast-sky reflections, rain rings;
   · the harbour: a breakwater with armour blocks and a lighthouse, moored
     boats that settle on the mud and tip over as the water leaves, a
     container ship on the horizon;
   · the wave (SlWave): a long body (an elevated sea behind a crest, a
     concave face) and a curling lip, both deformed on the GPU from one
     profile that varies along its length (height, curl, lead); a
     translucent green face, foam streaks running down it, a whitewater
     crest; spray and mist blown off the top, whitewater rolling at the
     foot, debris (boats, cars, timber) carried up the face. The front z,
     height and curl come from SL_WAVE (script.js).
   ===================================================================== */

const SL_BW = { x: -95, d1: 360, crest: 1.8, half: 3.2 };        // the breakwater: along z at x, out to d1 m from the wall
// the seabed height (m) at (x, z) — d = distance seaward from the foot of the sea wall
const SL_BED_GLSL = /* glsl */`
  float slSmooth(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
  float slBed(float x, float z){
    float d = ${(SL_FRONT.wallZ - 0.5).toFixed(2)} - z;
    float b = d < 12.0 ? -2.6 - d / 12.0 : (d < 1100.0 ? -3.6 - (d - 12.0) * 0.07 : -79.76 - (d - 1100.0) * 0.012);
    b = max(b, -130.0);
    b += 0.45 * sin(d * 0.09 + 0.021 * x + 1.6 * sin(x * 0.011)) * slSmooth(15.0, 60.0, d);
    b += (1.3 * sin(0.013 * x + 0.7) * sin(0.011 * z + 1.3) + 0.8 * sin(0.031 * x - 0.021 * z + 2.1) + 0.4 * sin(0.05 * x + 0.043 * z)) * slSmooth(6.0, 90.0, d);
    b -= 3.5 * slSmooth(-90.0, -80.0, x) * (1.0 - slSmooth(-26.0, -16.0, x)) * slSmooth(10.0, 40.0, d) * (1.0 - slSmooth(300.0, 340.0, d));
    return b;
  }`;
function slSmoothJ(a, b, x) { const t = MathX.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function slSeabedY(x, z) {
  const d = SL_FRONT.wallZ - 0.5 - z;
  let b = d < 12 ? -2.6 - d / 12 : (d < 1100 ? -3.6 - (d - 12) * 0.07 : -79.76 - (d - 1100) * 0.012);
  b = Math.max(b, -130);
  b += 0.45 * Math.sin(d * 0.09 + 0.021 * x + 1.6 * Math.sin(x * 0.011)) * slSmoothJ(15, 60, d);
  b += (1.3 * Math.sin(0.013 * x + 0.7) * Math.sin(0.011 * z + 1.3) + 0.8 * Math.sin(0.031 * x - 0.021 * z + 2.1) + 0.4 * Math.sin(0.05 * x + 0.043 * z)) * slSmoothJ(6, 90, d);
  b -= 3.5 * slSmoothJ(-90, -80, x) * (1 - slSmoothJ(-26, -16, x)) * slSmoothJ(10, 40, d) * (1 - slSmoothJ(300, 340, d));
  return b;
}
const slSeaLevel = (t) => SL_SEA0 + slDrain(t);
// thin the shared fog inside one material (three rewrites fogDensity every frame, so scale it in the shader)
function slThinFog(mat, k) {
  mat.uniforms.uFogMul = { value: k };
  mat.fragmentShader = 'uniform float uFogMul;\n' + mat.fragmentShader.replace('- fogDensity * vFogDepth', '- fogDensity * uFogMul * vFogDepth');
  mat.needsUpdate = true;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE WAVE'S PROFILE (in units of its height H, relative to the drained sea): s̃ = distance toward the shore from the
// crest. Behind: an elevated sea (0.42 H) rising to the crest; ahead: a concave face down to the toe. Along its length
// (x) the height, the curl and the lead vary.
// ---------------------------------------------------------------------------------------------------------------------
const SL_WAVE_GLSL = /* glsl */`
  float slBodyY(float s){ return s < 0.0 ? 0.36 + 0.06 * exp(s * 0.05) + 0.58 * exp(-pow(s / 1.35, 2.0)) : pow(max(0.0, 1.0 - s / 0.62), 2.0); }
  float slVar(float x, float k){ return 0.45 * sin(x * 0.0021 * k + 1.3) + 0.25 * sin(x * 0.0057 * k + 0.4) + 0.18 * sin(x * 0.013 * k + 2.2) + 0.12 * sin(x * 0.031 * k + 0.9); }
  float slHx(float x, float H){ return H * (0.88 + 0.2 * slVar(x, 1.0)); }
  float slCx(float x, float c){ return clamp(c + 0.35 * slVar(x + 900.0, 1.6), 0.0, 1.0); }
  float slZx(float x, float zf){ return zf + 0.00005 * x * x + 26.0 * slVar(x + 300.0, 0.8); }`;
const slWVar = (x, k) => 0.45 * Math.sin(x * 0.0021 * k + 1.3) + 0.25 * Math.sin(x * 0.0057 * k + 0.4) + 0.18 * Math.sin(x * 0.013 * k + 2.2) + 0.12 * Math.sin(x * 0.031 * k + 0.9);
const slBodyY = (s) => (s < 0 ? 0.36 + 0.06 * Math.exp(s * 0.05) + 0.58 * Math.exp(-Math.pow(s / 1.35, 2)) : Math.pow(Math.max(0, 1 - s / 0.62), 2));
const slHx = (x, H) => H * (0.88 + 0.2 * slWVar(x, 1));
const slCx = (x, c) => MathX.clamp(c + 0.35 * slWVar(x + 900, 1.6), 0, 1);
const slZx = (x, zf) => zf + 0.00005 * x * x + 26 * slWVar(x + 300, 0.8);
// the tip of the curling lip at x (same formula as the lip mesh)
function slLipTip(t, x, out) {
  const H = slHx(x, slWaveH(t)), c = slCx(x, slWaveCurl(t)), R = 0.13 + 0.07 * c, ph = Math.PI / 2 - (0.2 + 0.72 * c) * Math.PI;
  const qx = 0.1 * c + Math.cos(ph) * R * 1.4, qy = 1 - R + Math.sin(ph) * R + 0.03 * Math.sin(x * 0.071 + 1.7);
  return out.set(x, slSeaLevel(t) + qy * H, slZx(x, slWaveZ(t)) + qx * H);
}
// world point on the wave's face at x, s̃ (for debris, boats, the ship)
function slWavePoint(t, x, s, out) {
  const H = slHx(x, slWaveH(t)), base = slSeaLevel(t);
  return out.set(x, base + slBodyY(s) * H, slZx(x, slWaveZ(t)) + s * H);
}

class SlSea {
  constructor(app) {
    this.app = app; const scene = app.scene;
    this._seabed(scene);
    this._water(scene);
    this._harbour(scene);
    this.wave = new SlWave(scene);
  }

  /* ---------------- the seabed ---------------- */
  _seabed(scene) {
    const cap = CONFIG.captureMode, NX = cap ? 300 : 200, NZ = cap ? 260 : 180;
    const wx = (u) => Math.sign(u) * (Math.abs(u) < 0.3 ? Math.abs(u) / 0.3 * 260 : 260 + Math.pow((Math.abs(u) - 0.3) / 0.7, 2.2) * 2600);
    const wz = (v) => SL_FRONT.wallZ - 0.5 - (v < 0.45 ? v / 0.45 * 700 : 700 + Math.pow((v - 0.45) / 0.55, 2.2) * 5200);
    const pos = [], col = [], idx = [], c = new THREE.Color();
    const sand = new THREE.Color('#8a8068'), mud = new THREE.Color('#4b4a40'), algae = new THREE.Color('#3f4a36'), dark = new THREE.Color('#33352f');
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const x = wx(i / NX * 2 - 1), z = wz(j / NZ), y = slSeabedY(x, z), d = SL_FRONT.wallZ - 0.5 - z;
      pos.push(x, y, z);
      c.copy(sand).lerp(mud, slSmoothJ(10, 140, d)).lerp(dark, slSmoothJ(400, 1400, d));
      const n = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.sin(z * 0.05) * 2) * Math.sin(z * 0.06 + x * 0.01);
      c.lerp(algae, 0.45 * n * slSmoothJ(30, 120, d) * (1 - slSmoothJ(600, 900, d)));
      c.multiplyScalar(0.92 + 0.16 * Math.sin(x * 0.9 + z * 1.3) * Math.sin(x * 0.37 - z * 0.71));
      col.push(c.r, c.g, c.b);
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, cc = a + NX + 1, dd = cc + 1; idx.push(a, b, cc, b, dd, cc); }   // (z runs toward −Z: this winding faces up)
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const sb = Tex.sidewalk(17);
    this.bedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.26, metalness: 0.0, bumpMap: sb.bumpMap, bumpScale: 0.6, envMapIntensity: 1.6 });
    // the exposed seabed: sand ripples, darker weed, and pools of water left in the hollows (dark, glossy, reflecting the sky)
    this.bedMat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBW;').replace('#include <project_vertex>', '#include <project_vertex>\nvBW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vBW;
        float bh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float bn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(bh(i), bh(i + vec2(1, 0)), f.x), mix(bh(i + vec2(0, 1)), bh(i + vec2(1, 1)), f.x), f.y); }
        float bf(vec2 p){ return 0.5 * bn(p) + 0.25 * bn(p * 2.1 + 3.1) + 0.125 * bn(p * 4.3 + 7.7) + 0.0625 * bn(p * 8.9 + 1.3); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
        float bd = ${(SL_FRONT.wallZ - 0.5).toFixed(2)} - vBW.z;
        float rip = 0.5 + 0.5 * sin(vBW.x * 1.7 + bf(vBW.xz * 0.15) * 9.0);
        diffuseColor.rgb *= 0.86 + 0.2 * rip * smoothstep(2.0, 12.0, bd) * (1.0 - smoothstep(200.0, 500.0, bd));
        // the beach: drier and paler up by the wall, footprints and kelp lines, darker wet sand toward the water
        float beach = 1.0 - smoothstep(9.0, 13.0, bd);
        diffuseColor.rgb *= mix(1.0, 1.1 + 0.18 * bf(vBW.xz * 0.6) - 0.22 * smoothstep(6.0, 11.0, bd), beach);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.15, 0.1), beach * smoothstep(0.72, 0.8, bf(vBW.xz * vec2(0.08, 1.4) + 2.0)) * 0.7);
        diffuseColor.rgb *= 1.0 - beach * 0.25 * smoothstep(0.55, 0.75, bn(vBW.xz * 3.0));
        float weed = smoothstep(0.58, 0.72, bf(vBW.xz * 0.045 + 11.0)) * smoothstep(25.0, 80.0, bd);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.16, 0.1), weed * 0.75);
        float pool = smoothstep(0.745, 0.79, bf(vBW.xz * 0.009 + 4.0) + 0.04 * bn(vBW.xz * 0.25)) * smoothstep(14.0, 40.0, bd);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.07, 0.075), pool * 0.85);`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.04, pool);`);
    };
    this.bed = new THREE.Mesh(g, this.bedMat); this.bed.receiveShadow = true; scene.add(this.bed);
    // rocks scattered on the shelf (they show as the water leaves)
    const r = new RNG(81), n = 260, rg = new THREE.IcosahedronGeometry(1, 0);
    this.rocks = new THREE.InstancedMesh(rg, new THREE.MeshStandardMaterial({ color: '#4a4842', roughness: 0.55, flatShading: true }), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const cl = i < 120, x = cl ? r.range(-75, -20) + (r.next() < 0.5 ? 0 : 140) : r.range(-600, 600), d = cl ? r.range(20, 260) : r.range(40, 900), z = SL_FRONT.wallZ - 0.5 - d;
      const sz = r.range(0.4, 2.2) * (d > 300 ? 1.8 : 1);
      p.set(x, slSeabedY(x, z) + sz * 0.25, z); e.set(r.next() * 3, r.next() * 3, r.next() * 3); q.setFromEuler(e); s.set(sz, sz * r.range(0.5, 0.9), sz * r.range(0.7, 1.2));
      m.compose(p, q, s); this.rocks.setMatrixAt(i, m);
    }
    this.rocks.receiveShadow = true; scene.add(this.rocks);
  }

  /* ---------------- the water ---------------- */
  _water(scene) {
    const cap = CONFIG.captureMode, N = cap ? 320 : 220, pos = new Float32Array((N + 1) * (N + 1) * 3), idx = [];
    const wx = (u) => Math.sign(u) * (Math.abs(u) < 0.3 ? Math.abs(u) / 0.3 * 300 : 300 + Math.pow((Math.abs(u) - 0.3) / 0.7, 2.3) * 9000);
    const wz = (v) => SL_FRONT.wallZ - 0.5 - (v < 0.4 ? v / 0.4 * 600 : 600 + Math.pow((v - 0.4) / 0.6, 2.3) * 9000);
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const k = (j * (N + 1) + i) * 3; pos[k] = wx(i / N * 2 - 1); pos[k + 1] = 0; pos[k + 2] = wz(j / N); }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.WU = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
      uLevel: { value: SL_SEA0 }, uTime: { value: 0 }, uSkyH: { value: new THREE.Color('#9aa2a4') }, uSkyZ: { value: new THREE.Color('#58626a') },
      uDeep: { value: new THREE.Color('#16211f') }, uShallow: { value: new THREE.Color('#33504b') }, uSand: { value: new THREE.Color('#7d745e') }, uDrainK: { value: 0 },
    });
    this.waterMat = new THREE.ShaderMaterial({
      uniforms: this.WU, fog: true,
      vertexShader: /* glsl */`
        uniform float uLevel, uTime; varying vec3 vW; varying float vD;
        ${SL_BED_GLSL}
        ${THREE.ShaderChunk.fog_pars_vertex}
        void main(){
          vec3 p = position; p.y = uLevel;
          float D = uLevel - slBed(p.x, p.z);
          // a gentle swell (smaller in the shallows)
          float sw = 0.18 * clamp(D / 6.0, 0.0, 1.0);
          p.y += sw * (sin(p.x * 0.08 + p.z * 0.21 + uTime * 1.6) * 0.6 + sin(-p.x * 0.11 + p.z * 0.27 + uTime * 1.9) * 0.4);
          vW = p; vD = D;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
          ${THREE.ShaderChunk.fog_vertex}
        }`,
      fragmentShader: /* glsl */`
        uniform float uLevel, uTime, uDrainK; uniform vec3 uSkyH, uSkyZ, uDeep, uShallow, uSand; varying vec3 vW; varying float vD;
        ${THREE.ShaderChunk.fog_pars_fragment}
        float wh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float wn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(wh(i), wh(i + vec2(1, 0)), f.x), mix(wh(i + vec2(0, 1)), wh(i + vec2(1, 1)), f.x), f.y); }
        float fb2(vec2 p){ return 0.5 * wn(p) + 0.3 * wn(p * 2.3 + 1.7) + 0.2 * wn(p * 5.1 + 4.2); }
        void main(){
          if (vD < -0.05) discard;
          vec3 V = normalize(cameraPosition - vW);
          // a normal from a few small waves and the rain
          vec2 P = vW.xz; float fade = 1.0 / (1.0 + length(cameraPosition - vW) / 60.0);
          vec3 n = normalize(vec3(0.0, 1.0, 0.0) + fade * vec3(
            0.06 * sin(P.x * 0.31 + P.y * 0.53 + uTime * 2.1) + 0.04 * sin(P.x * 1.1 - P.y * 0.7 + uTime * 3.3) + 0.06 * (wn(P * 2.0 + uTime) - 0.5),
            0.0,
            0.06 * sin(-P.x * 0.27 + P.y * 0.61 + uTime * 1.9) + 0.04 * sin(P.x * 0.8 + P.y * 1.2 + uTime * 2.7) + 0.06 * (wn(P * 2.0 - uTime + 5.0) - 0.5)));
          vec3 R = reflect(-V, n);
          vec3 sky = mix(uSkyH, uSkyZ, pow(clamp(R.y, 0.0, 1.0), 0.5));
          float fres = 0.02 + 0.98 * pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 5.0);
          // the body colour: the seabed shows through in the shallows, dark green-grey when deep
          float k = exp(-max(vD, 0.0) / 1.6);
          vec3 body = mix(uDeep, uShallow, exp(-max(vD, 0.0) / 9.0));
          body = mix(body, uSand * 0.8, k * 0.85);
          float wind = fb2(P * 0.012 + vec2(uTime * 0.01, 0.0));
          vec3 col = mix(body * 0.75, sky * (0.62 + 0.25 * wind), clamp(fres * 0.8 + 0.06, 0.0, 1.0));
          // whitecaps far out
          col = mix(col, vec3(0.8, 0.83, 0.82), smoothstep(0.82, 0.92, wn(P * 0.09 + vec2(uTime * 0.3, 0.0)) * wind) * smoothstep(20.0, 80.0, vD) * 0.6);
          // foam at the waterline (more of it while the sea is draining: a churned, muddy edge)
          float fl = smoothstep(0.22 + 0.5 * uDrainK, 0.0, vD) * (0.45 + 0.55 * wn(P * 0.5 + vec2(0.0, uTime * 0.6)));
          col = mix(col, vec3(0.82, 0.84, 0.82), fl * 0.75);
          gl_FragColor = vec4(col, 1.0);
          ${THREE.ShaderChunk.fog_fragment}
        }`,
    });
    this.water = new THREE.Mesh(g, this.waterMat); this.water.frustumCulled = false; scene.add(this.water);
  }

  /* ---------------- the breakwater, the lighthouse, the boats, the ship ---------------- */
  _harbour(scene) {
    const B = new Batcher(), BW = SL_BW, rock = new THREE.MeshStandardMaterial({ map: Tex.concrete(83, [96, 94, 90]), roughness: 0.75 });
    // the mound: a trapezoid extruded along z, its foot following the seabed
    const segs = 70, pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const d = i / segs * BW.d1, z = SL_FRONT.wallZ - d, bed = Math.min(slSeabedY(BW.x - 8, z), slSeabedY(BW.x + 8, z)) - 0.5, h = BW.crest - bed, w = BW.half + h * 1.4;
      pos.push(BW.x - w, bed, z, BW.x - BW.half, BW.crest, z, BW.x + BW.half, BW.crest, z, BW.x + w, bed, z);
    }
    for (let i = 0; i < segs; i++) for (let k = 0; k < 3; k++) { const a = i * 4 + k, b = a + 1, c = a + 4, d = c + 1; idx.push(a, b, c, b, d, c); }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mg.setIndex(idx); mg.computeVertexNormals();
    const mu = new Float32Array(mg.attributes.position.count * 2); for (let i = 0; i < mu.length / 2; i++) { mu[i * 2] = mg.attributes.position.getX(i) * 0.15; mu[i * 2 + 1] = mg.attributes.position.getZ(i) * 0.15 + mg.attributes.position.getY(i) * 0.15; }
    mg.setAttribute('uv', new THREE.BufferAttribute(mu, 2));
    const mound = new THREE.Mesh(mg, rock); mound.receiveShadow = true; mound.castShadow = true; scene.add(mound);
    // armour blocks along both sides (dark, barnacled below the old waterline)
    const r = new RNG(84), blk = Mat.std('#6f6c66', { roughness: 0.8 }), blkLow = Mat.std('#3e3d37', { roughness: 0.7 });
    for (let i = 0; i < 260; i++) {
      const d = r.range(4, BW.d1 - 2), z = SL_FRONT.wallZ - d, side = r.next() < 0.5 ? -1 : 1, bed = slSeabedY(BW.x + side * 8, z), k = r.next();
      const y = MathX.lerp(BW.crest - 0.4, bed + 0.8, k), x = BW.x + side * (BW.half + (BW.crest - y) * 1.4 * 0.95), s = r.range(1.2, 2.2);
      B.add(new THREE.BoxGeometry(s, s * 0.8, s * 1.1), y < SL_SEA0 + 0.5 ? blkLow : blk, Geo.matrix(x, y, z, r.next() * 2, r.next() * 2, r.next() * 2));
    }
    // a concrete cap with a walkway and lamp posts
    B.box(BW.half * 2 - 0.4, 0.6, BW.d1, BW.x, BW.crest + 0.3, SL_FRONT.wallZ - BW.d1 / 2, Mat.std('#8f8c84', { roughness: 0.85 }));
    // the lighthouse at the tip: white with red bands, a gallery, the lantern
    const lx = BW.x, lz = SL_FRONT.wallZ - BW.d1 + 4, ly = BW.crest + 0.6, white = Mat.std('#e8e6df', { roughness: 0.6 }), red = Mat.std('#a8302a', { roughness: 0.6 });
    for (let i = 0; i < 6; i++) B.add(new THREE.CylinderGeometry(2.6 - (i + 1) * 0.12, 2.6 - i * 0.12, 3.4, 18), i % 2 ? red : white, Geo.matrix(lx, ly + 1.7 + i * 3.4, lz));
    B.add(new THREE.CylinderGeometry(2.4, 2.4, 0.3, 18), Mat.std('#2a2c2e', { roughness: 0.5 }), Geo.matrix(lx, ly + 20.55, lz));
    B.add(new THREE.CylinderGeometry(1.25, 1.25, 2.2, 12), new THREE.MeshStandardMaterial({ color: '#f7e7b8', emissive: '#ffe2a0', emissiveIntensity: 1.6, roughness: 0.2 }), Geo.matrix(lx, ly + 21.8, lz));
    B.add(new THREE.ConeGeometry(1.6, 1.5, 12), red, Geo.matrix(lx, ly + 23.6, lz));
    this.light = { x: lx, z: lz, y: ly };
    const hg = new THREE.Group(); B.build(hg, 'harbour'); scene.add(hg); this.harbourGroup = hg;
    this.siren = new THREE.Group(); this.siren.position.set(-6.5, LAYOUT.curbH, SL_FRONT.promZ[1] - 1.6);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.2, 8), Mat.std('#3a3d40', { roughness: 0.5 })); sp.position.y = 2.1; this.siren.add(sp);
    this.sirenR = new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false }); this.sirenB = new THREE.MeshBasicMaterial({ color: '#2a5aff', toneMapped: false });
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), this.sirenR); s1.position.set(-0.25, 4.35, 0); this.siren.add(s1);
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), this.sirenB); s2.position.set(0.25, 4.35, 0); this.siren.add(s2);
    this.sirenLight = new THREE.PointLight('#ff3020', 0, 30, 1.6); this.sirenLight.position.set(0, 4.3, 0); this.siren.add(this.sirenLight);
    scene.add(this.siren);
    // boats moored in the basin (and a few outside): they float, then settle on the mud and tip as the sea leaves
    const hull = (L, W, col) => {
      // a rounded hull: the lower half of a stretched sphere with a fuller stern, a deck, a rubbing strake, a cabin
      const g = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) { let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const st = x < 0 ? 1 - 0.35 * x * x : 1; pa.setXYZ(i, x * L / 2, y * W * 0.42 * (x > 0 ? 1 - 0.3 * x : 1), z * W / 2 * Math.max(st, 0.55) * (x > 0.6 ? 1 - (x - 0.6) * 1.6 : 1)); }
      g.computeVertexNormals();
      const grp = new THREE.Group(), pm = Mat.std(col, { roughness: 0.45 });
      grp.add(new THREE.Mesh(g, pm));
      const deck = new THREE.Mesh(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), Mat.std('#cfc8b6', { roughness: 0.8 })); deck.scale.set(L / 2 * 0.98, 1, W / 2 * 0.95); deck.position.y = 0.01; grp.add(deck);
      const rail = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 4, 24).rotateX(Math.PI / 2), Mat.std('#2a2c2e')); rail.scale.set(L / 2, 1, W / 2); rail.position.y = 0.02; grp.add(rail);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(L * 0.28, W * 0.5, W * 0.62), Mat.std('#ece9e1', { roughness: 0.6 })); cab.position.set(-L * 0.08, W * 0.25, 0); grp.add(cab);
      const win = new THREE.Mesh(new THREE.BoxGeometry(L * 0.285, W * 0.14, W * 0.63), Mat.std('#26313a', { roughness: 0.2 })); win.position.set(-L * 0.08, W * 0.38, 0); grp.add(win);
      return grp;
    };
    const rb = new RNG(85), cols = ['#f2f0ea', '#2a4a6a', '#a8302a', '#e8e4d8', '#3a5a3a', '#d8c070'];
    this.boats = [];
    const near = [[-9, 30, 7.5], [16, 46, 9], [-24, 66, 6.5], [-34, 92, 10]];
    for (let i = 0; i < 20; i++) {
      const inside = i < 12, nr = i >= 16 ? near[i - 16] : null, L = nr ? nr[2] : rb.range(6, 12), W = L * 0.34;
      const x = nr ? nr[0] : inside ? rb.range(-84, -26) : rb.range(-40, 160), d = nr ? nr[1] : inside ? rb.range(40, 290) : rb.range(320, 700), z = SL_FRONT.wallZ - d;
      const g = hull(L, W, rb.pick(cols)); g.rotation.y = rb.range(-0.4, 0.4) + (inside ? Math.PI / 2 : rb.range(0, 6));
      if (rb.next() < 0.5) { const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, L * 1.1, 5), Mat.std('#cfcfca')); mast.position.set(L * 0.05, L * 0.55, 0); g.add(mast); }
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      scene.add(g); this.boats.push({ g, x, z, draft: W * 0.3, roll: (rb.next() < 0.5 ? -1 : 1) * rb.range(0.6, 0.95), ry: g.rotation.y, seed: rb.next() * 10 });
    }
    // the container ship on the horizon
    const ship = new THREE.Group(), hullM = Mat.std('#2a2e33', { roughness: 0.6 }), redM = Mat.std('#7a2a22', { roughness: 0.7 });
    const sh1 = new THREE.Mesh(new THREE.BoxGeometry(190, 9, 30), hullM); sh1.position.y = 4.5; ship.add(sh1);
    const sh2 = new THREE.Mesh(new THREE.BoxGeometry(190, 4, 30.2), redM); sh2.position.y = 1; ship.add(sh2);
    const cc = ['#a8402a', '#2a5a8a', '#d8a030', '#3a7a4a', '#8a8a86', '#c8c4b8'];
    for (let i = 0; i < 22; i++) for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(7, 2.6, 26), Mat.std(cc[(i * 3 + k * 5) % cc.length], { roughness: 0.7 })); b.position.set(-78 + i * 7.3, 10.3 + k * 2.6, 0); ship.add(b); }
    const br = new THREE.Mesh(new THREE.BoxGeometry(12, 16, 28), Mat.std('#e8e6e0', { roughness: 0.6 })); br.position.set(84, 17, 0); ship.add(br);
    ship.rotation.y = 0.25; scene.add(ship); this.ship = { g: ship, x: 110, z: -3400 };
  }

  update(t, cam) {
    const lvl = slSeaLevel(t);
    this.WU.uLevel.value = lvl; this.WU.uTime.value = t; this.WU.uDrainK.value = MathX.smooth(t, 39.6, 41) * (1 - MathX.smooth(t, 46, 47));
    this.WU.fogColor.value.copy(this.app.scene.fog.color); this.WU.fogDensity.value = this.app.scene.fog.density;
    // boats: float while there is water under them; settle and tip on the mud; picked up by the wave when it arrives
    const W = this.wave, V = this._v || (this._v = new THREE.Vector3());
    for (const b of this.boats) {
      const bed = slSeabedY(b.x, b.z), wz = slZx(b.x, slWaveZ(t)), hit = t > SL.line && wz > b.z - 30;
      if (hit) {
        const u = Math.min(1, (wz - b.z + 30) / 120);
        slWavePoint(t, b.x, -0.25 + 0.2 * u, V); b.g.position.set(V.x, V.y + 1, V.z);
        b.g.rotation.set(u * 3 * b.roll, b.ry + u * 2, u * 4); continue;
      }
      const float = lvl + b.draft * 0.4, rest = bed + b.draft * 0.9, on = lvl < bed + b.draft * 1.4;
      const k = MathX.clamp((bed + b.draft * 1.4 - lvl) / (b.draft * 1.6), 0, 1);
      b.g.position.set(b.x, Math.max(float, rest) + (on ? 0 : 0.12 * Math.sin(t * 1.3 + b.seed)), b.z);
      b.g.rotation.set(b.roll * Ease.inOutSine(k), b.ry, (on ? 0 : 0.03 * Math.sin(t * 1.1 + b.seed)));
    }
    // the ship: rides the swell, then is lifted up the wave's face and carried
    const S = this.ship, swz = slZx(S.x, slWaveZ(t));
    if (t > SL.line && swz > S.z - 200) { const u = MathX.clamp((swz - S.z + 200) / 400, 0, 1); slWavePoint(t, S.x, -0.15 + 0.35 * u, V); S.g.position.set(V.x, V.y - 2, V.z); S.g.rotation.set(0.35 * u, 0.25 + u * 0.4, -0.25 * u); }
    else { S.g.position.set(S.x, lvl - 4, S.z); S.g.rotation.set(0.01 * Math.sin(t * 0.6), 0.25, 0.01 * Math.sin(t * 0.5)); }
    // the siren: alternating red and blue from when it starts wailing
    const on = t > 48.4 && t < SL.black, ph = Math.floor(t * 3.2) % 2;
    this.sirenR.color.setScalar(0).setRGB(on && ph === 0 ? 3 : 0.25, on && ph === 0 ? 0.25 : 0.05, 0.05);
    this.sirenB.color.setRGB(0.05, on && ph === 1 ? 0.5 : 0.08, on && ph === 1 ? 3 : 0.3);
    this.sirenLight.intensity = on ? 14 : 0; this.sirenLight.color.set(ph === 0 ? '#ff3020' : '#3060ff');
    W.update(t, cam);
  }
}

/* =====================================================================
   THE WAVE
   ===================================================================== */
class SlWave {
  constructor(scene) {
    const cap = CONFIG.captureMode;
    this.U = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
      uZ: { value: -6000 }, uH: { value: 0 }, uC: { value: 0 }, uBase: { value: SL_SEA0 - 38 }, uTime: { value: 0 }, uLip: { value: 0 },
      uSkyH: { value: new THREE.Color('#9aa2a4') }, uSkyZ: { value: new THREE.Color('#58626a') },
    });
    const vs = /* glsl */`
      uniform float uZ, uH, uC, uBase, uTime, uLip; varying vec3 vW; varying vec3 vN; varying float vS; varying float vY; varying float vV;
      ${SL_WAVE_GLSL}
      ${THREE.ShaderChunk.fog_pars_vertex}
      // body: v → s̃ (far behind … crest … face … toe); lip: v → the curl from the crest
      vec3 pt(float u, float v){
        float x = (u - 0.5) * 6000.0;
        float H = slHx(x, uH), c = slCx(x, uC), zf = slZx(x, uZ);
        if (uLip < 0.5) {
          float s = v < 0.55 ? -45.0 * pow(1.0 - v / 0.55, 2.6) : (v - 0.55) / 0.45 * 0.66;
          float y = slBodyY(s) + (0.03 * sin(x * 0.071 + 1.7) + 0.018 * sin(x * 0.19 + uTime * 0.7)) * exp(-pow(s / 0.22, 2.0));   // (a ragged crest)
          // the face leans forward as the lip forms
          s += 0.12 * c * smoothstep(0.0, 0.62, 0.62 - s) * step(0.0, s) * y;
          return vec3(x, uBase + y * H, zf + s * H);
        }
        // the lip: an arc from the crest, thrown forward and down; it grows with the curl
        float R = 0.13 + 0.07 * c, ext = (0.2 + 0.72 * c) * 3.14159;
        float ph = 1.5708 - v * ext;
        vec2 C = vec2(0.1 * c * smoothstep(0.0, 0.35, v), 1.0 - R);
        vec2 q = C + vec2(cos(ph) * R * 1.4, sin(ph) * R) + vec2(0.0, 0.03 * sin(x * 0.071 + 1.7) + 0.018 * sin(x * 0.19 + uTime * 0.7));
        return vec3(x, uBase + q.y * H, zf + q.x * H);
      }
      void main(){
        float u = position.x, v = position.y;
        vec3 p = pt(u, v), pu = pt(u + 0.0005, v), pv = pt(u, v + 0.004);
        vec3 n = normalize(cross(pv - p, pu - p));
        if (uLip > 0.5) n = -n;
        // small ripples running down the face
        p += n * 0.012 * uH * sin(p.x * 0.02 + p.y * 0.09 - uTime * 3.0) * smoothstep(0.0, 0.2, v);
        vW = p; vN = n; vV = v;
        float x = (u - 0.5) * 6000.0; vY = (p.y - uBase) / max(slHx(x, uH), 1.0); vS = (p.z - slZx(x, uZ)) / max(slHx(x, uH), 1.0);
        vec4 mvPosition = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        ${THREE.ShaderChunk.fog_vertex}
      }`;
    const fs = /* glsl */`
      uniform float uTime, uLip, uH, uC; uniform vec3 uSkyH, uSkyZ; varying vec3 vW; varying vec3 vN; varying float vS; varying float vY; varying float vV;
      ${THREE.ShaderChunk.fog_pars_fragment}
      float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float nn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hh(i), hh(i + vec2(1, 0)), f.x), mix(hh(i + vec2(0, 1)), hh(i + vec2(1, 1)), f.x), f.y); }
      float fb(vec2 p){ return 0.5 * nn(p) + 0.25 * nn(p * 2.1 + 3.0) + 0.125 * nn(p * 4.3 + 7.0) + 0.0625 * nn(p * 8.7 + 1.0); }
      vec3 SR(vec3 c){ return pow(c, vec3(2.2)); }   // (colours written as display values)
      void main(){
        vec3 V = normalize(cameraPosition - vW), n = normalize(vN);
        if (!gl_FrontFacing) n = -n;
        vec2 tq = vec2(vW.x * 0.02, vW.y * 0.03 + uTime * 0.3);
        n = normalize(n + 0.35 * vec3(fb(tq) - 0.5, fb(tq + 7.3) - 0.5, fb(tq + 3.1) - 0.5));
        float fres = 0.03 + 0.97 * pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 4.0);
        vec3 R = reflect(-V, n); vec3 sky = mix(uSkyH, uSkyZ, pow(clamp(R.y, 0.0, 1.0), 0.5));
        // the body: near-black at the foot (carrying mud), dark bottle green up the face, translucent green where it thins
        // toward the crest and in the lip; the sky in it at grazing angles; it is darker than the sky behind it
        float h = clamp(vY, 0.0, 1.3), face = step(-0.05, vS);
        vec3 col = mix(SR(vec3(0.05, 0.1, 0.12)), SR(vec3(0.11, 0.25, 0.27)), smoothstep(0.0, 0.85, h)) * (0.78 + 0.3 * clamp(abs(n.y), 0.0, 1.0));
        col *= 0.84 + 0.16 * sin(vY * 15.0 - uTime * 1.8 + fb(vec2(vW.x * 0.008, 0.0)) * 6.0);           // bands climbing the face
        col *= 1.0 - (uLip > 0.5 ? 0.0 : 0.5 * smoothstep(0.5, 0.78, h) * smoothstep(0.96, 0.8, h) * smoothstep(0.2, 0.6, uC) * face);   // the shadow under the lip
        float trans = uLip > 0.5 ? 0.95 * (1.0 - 0.8 * vV) : 0.85 * smoothstep(0.84, 1.0, h) * smoothstep(0.3, 0.0, vS) * face;
        col = mix(col, SR(vec3(0.32, 0.6, 0.55)), trans * (0.45 + 0.55 * pow(1.0 - abs(dot(n, V)), 1.2)));
        // big foam blotches and the churned surface give the face scale
        float blot = smoothstep(0.6, 0.78, fb(vec2(vW.x * 0.008, vW.y * 0.012 + uTime * 0.08)));
        col = mix(col, col * 1.8 + 0.006, blot * face * 0.5);
        col = mix(col, SR(vec3(0.2, 0.18, 0.13)), smoothstep(0.22, 0.0, h) * face * 0.65);
        if (uLip > 0.5 && !gl_FrontFacing) col *= 0.45;          // (inside the curl: in its own shadow)
        col = mix(col, sky * 0.6, fres * 0.55);
        // foam: lacing pulled down the face, streaks, whitewater along the crest and the lip's edge, patches behind, churn at the foot
        float lace = fb(vec2(vW.x * 0.035, vW.y * 0.011 + uTime * 0.45)) * 0.6 + fb(vec2(vW.x * 0.11, vW.y * 0.035 + uTime * 0.9)) * 0.4;
        float streak = smoothstep(0.54, 0.74, lace) * face * (0.3 + 0.55 * smoothstep(0.1, 0.95, h));
        float crest = uLip > 0.5 ? 0.0 : smoothstep(0.9, 1.0, vY) * (0.75 + 0.25 * fb(vec2(vW.x * 0.05, uTime)));
        float back = step(vS, -0.5) * smoothstep(0.52, 0.75, fb(vW.xz * 0.006 + vec2(0.0, uTime * 0.04))) * 0.75;
        float lipFoam = uLip > 0.5 ? smoothstep(0.3, 0.75, vV + 0.25 * (fb(vec2(vW.x * 0.03, uTime * 0.5)) - 0.5)) : 0.0;
        float toe = smoothstep(0.3, 0.0, vY) * face * (0.55 + 0.45 * fb(vec2(vW.x * 0.025, uTime * 0.6)));
        float pour = uLip > 0.5 ? 0.0 : smoothstep(0.4, 0.9, uC) * smoothstep(0.45, 0.8, h) * face * smoothstep(0.45, 0.75, fb(vec2(vW.x * 0.01, vW.y * 0.004 + uTime * 0.25)));
        toe += pour * 0.8;
        float foam = clamp(streak + crest + back + lipFoam + toe, 0.0, 1.0);
        col = mix(col, SR(vec3(0.86, 0.89, 0.88)) * (0.75 + 0.25 * h), foam * 0.93);
        gl_FragColor = vec4(col, 1.0);
        ${THREE.ShaderChunk.fog_fragment}
      }`;
    const grid = (nu, nv) => {
      const pos = [], idx = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(i / nu, j / nv, 0);
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
      return g;
    };
    const mk = (lip, nu, nv) => {
      const U = Object.assign({}, this.U, { uLip: { value: lip } });
      const m = new THREE.Mesh(grid(nu, nv), new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.renderOrder = 2; scene.add(m); return m;
    };
    this.body = mk(0, cap ? 520 : 300, cap ? 130 : 90);
    this.lip = mk(1, cap ? 520 : 300, cap ? 36 : 24);
    for (const m of [this.body, this.lip]) slThinFog(m.material, 0.45);
    // spray off the crest, blown back; mist over the whole front; whitewater rolling at the foot
    this.spray = new XBill(scene, { n: cap ? 300 : 180, kind: 'soft', color: '#e6ebea', seed: 91, alpha: 0.4, fadeIn: 0.15, fadeOut: 0.55, order: 6,
      spawn: (i, r) => ({ ux: r.range(-0.5, 0.5), p: new THREE.Vector3(), v: new THREE.Vector3(), t0: 0, life: r.range(1.2, 2.4), s0: 0.08, s1: 0.32, rot: r.next() * 6, spin: r.range(-0.4, 0.4), loop: r.range(1.2, 2.4), ph: r.next(), kind: r.next() < 0.55 ? 0 : 1 }) });
    this.mist = new XBill(scene, { n: cap ? 90 : 60, kind: 'soft', color: '#cfd6d6', seed: 92, alpha: 0.18, fadeIn: 0.2, fadeOut: 0.6, order: 5,
      spawn: (i, r) => ({ ux: r.range(-0.5, 0.5), p: new THREE.Vector3(), v: new THREE.Vector3(), t0: 0, life: 9, s0: 1, s1: 1, rot: r.next() * 6, spin: r.range(-0.05, 0.05), loop: 0, ph: r.next(), hk: r.range(0.6, 1.25) }) });
    this.foot = new XBill(scene, { n: cap ? 260 : 160, kind: 'soft', color: '#e9eeec', seed: 93, alpha: 0.7, fadeIn: 0.1, fadeOut: 0.5, order: 6,
      spawn: (i, r) => ({ ux: r.range(-0.5, 0.5), p: new THREE.Vector3(), v: new THREE.Vector3(), t0: 0, life: 9, s0: 1, s1: 1, rot: r.next() * 6, spin: r.range(-0.3, 0.3), loop: 0, ph: r.next(), hk: r.range(0.05, 0.3) }) });
    // the front hits the sea wall: whitewater thrown up the face of the city; then foam rushing past you
    this.burst = new XBill(scene, { n: cap ? 180 : 120, kind: 'soft', color: '#eef2f0', seed: 95, alpha: 0.85, fadeIn: 0.05, fadeOut: 0.6, g: 9.8, drag: 0.6, order: 7,
      spawn: (i, r) => ({ p: new THREE.Vector3(r.range(-90, 90), SL_FRONT.beachY + r.range(0, 6), SL_FRONT.wallZ - r.range(0, 12)), v: new THREE.Vector3(r.range(-8, 8), r.range(30, 75), r.range(4, 26)), t0: 59.2 + r.next() * 0.35, life: r.range(1.6, 2.6), s0: r.range(8, 16), s1: r.range(26, 48), rot: r.next() * 6, spin: r.range(-0.6, 0.6) }) });
    this.engulf = new XBill(scene, { n: 90, kind: 'soft', color: '#d9e6e3', seed: 96, alpha: 0.95, fadeIn: 0.12, fadeOut: 0.7, order: 8,
      spawn: (i, r) => ({ off: new THREE.Vector3(r.range(-14, 14), r.range(-3, 16), r.range(-60, -25)), sp: r.range(55, 90), p: new THREE.Vector3(), v: new THREE.Vector3(), t0: 59.55 + r.next() * 0.3, life: 1.4, s0: r.range(5, 9), s1: r.range(12, 22), rot: r.next() * 6, spin: r.range(-1, 1) }) });
    // a thick, broken band of whitewater riding the lip's edge
    this.lipFoam = new XBill(scene, { n: cap ? 260 : 170, kind: 'soft', color: '#f0f4f2', seed: 97, alpha: 0.75, fadeIn: 0.1, fadeOut: 0.5, order: 6,
      spawn: (i, r) => ({ ux: r.range(-0.5, 0.5), p: new THREE.Vector3(), v: new THREE.Vector3(), t0: 0, life: 9, s0: 1, s1: 1, rot: r.next() * 6, spin: r.range(-0.8, 0.8), loop: 0, ph: r.next(), hk: r.range(0.4, 1.2) }) });
    for (const b of [this.spray, this.mist, this.foot, this.lipFoam]) slThinFog(b.mesh.material, 0.3);
    // debris carried up the face: boat hulls, cars, timber, containers
    const dm = [Mat.std('#e8e6e0', { roughness: 0.5 }), Mat.std('#2a4a6a', { roughness: 0.5 }), Mat.std('#5a4a3a', { roughness: 0.9 }), Mat.std('#a8402a', { roughness: 0.6 }), Mat.std('#3a3d40', { roughness: 0.5 })];
    this.debris = dm.map((mat, k) => { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, 30); im.frustumCulled = false; scene.add(im); return im; });
    const r = new RNG(94); this.D = [];
    for (let i = 0; i < 150; i++) this.D.push({ k: i % 5, x: r.range(-900, 900) * (i < 60 ? 0.3 : 1), s: r.range(-0.3, 0.3), sz: [r.range(6, 14), r.range(2, 4), r.range(2.5, 5)], spin: [r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)], ph: r.next() });
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
  }

  update(t, cam) {
    const on = t >= SL.line - 0.2 && t < SL.black, U = this.U;
    this.body.visible = this.lip.visible = on;
    for (const im of this.debris) im.visible = on && t > 53;
    if (!on) { this.spray.update(-1e9); this.mist.update(-1e9); this.foot.update(-1e9); this.burst.update(-1e9); this.engulf.update(-1e9); this.lipFoam.update(-1e9); return; }
    const H = slWaveH(t), zf = slWaveZ(t), c = slWaveCurl(t), base = slSeaLevel(t);
    U.uZ.value = zf; U.uH.value = H; U.uC.value = c; U.uBase.value = base; U.uTime.value = t;
    // billboards follow the front: each one has a place along it (ux) and a phase
    const P = this._p;
    const place = (o, s, hk) => { const x = o.ux * 3800 + cam.position.x * 0.0; slWavePoint(t, x, s, P); return P; };
    for (const o of this.spray.P) {
      const ph = ((t / o.loop + o.ph) % 1 + 1) % 1, x = o.ux * 3600, Hx = slHx(x, H);
      const q = place(o, o.kind ? 0.1 + 0.25 * slCx(x, c) : -0.05, 0);
      o.p.set(q.x, q.y + Hx * (0.03 + 0.3 * ph), q.z - Hx * 0.3 * ph); o.v.set(0, 0, 0); o.t0 = t - ph * o.life; o.s0 = Hx * 0.07; o.s1 = Hx * 0.26; o.loop = 0;
    }
    for (const o of this.mist.P) { const x = o.ux * 4200, Hx = slHx(x, H), q = place(o, 0.05, 0); o.p.set(q.x, q.y + Hx * (0.05 + 0.1 * o.hk) + 8, q.z - Hx * 0.6 * o.hk); o.t0 = t - 1; o.s0 = o.s1 = Hx * 0.5 * o.hk + 10 + 26 * (1 - MathX.smooth(t, 51.5, 54)); }
    for (const o of this.foot.P) { const x = o.ux * 4000, Hx = slHx(x, H); slWavePoint(t, x, 0.45 + 0.3 * slCx(x, c) + 0.15 * Math.sin(t * 2 + o.ph * 6), P); o.p.set(P.x, base + Hx * o.hk * 0.7 + 2, P.z + Hx * 0.06); o.t0 = t - 1; o.s0 = o.s1 = Hx * (0.12 + 0.22 * o.hk) + 4; }
    const far = 1 - MathX.smooth(t, 51.5, 54); this.spray.s.alpha = 0.6 * MathX.smooth(H, 3, 20); this.mist.s.alpha = 0.14 + 0.36 * far; this.foot.s.alpha = 0.55 + 0.3 * far;
    this.spray.update(t); this.mist.update(t); this.foot.update(t);
    for (const o of this.lipFoam.P) { const x = o.ux * 3600, Hx = slHx(x, H); slLipTip(t, x, P); const w = Math.sin(t * 1.7 + o.ph * 6.28); o.p.set(P.x, P.y + Hx * 0.02 * w, P.z + Hx * 0.02 * w); o.t0 = t - 1; o.s0 = o.s1 = Hx * 0.07 * o.hk + 3; }
    this.lipFoam.s.alpha = 0.75 * MathX.smooth(slWaveCurl(t), 0.15, 0.4);
    this.lipFoam.update(t);
    this.burst.update(t);
    for (const o of this.engulf.P) { const u = Math.max(0, t - o.t0); o.p.set(cam.position.x + o.off.x, cam.position.y + o.off.y, cam.position.z + o.off.z + o.sp * u); o.v.set(0, 0, 0); }
    this.engulf.update(t);
    // debris on the face: rising and tumbling
    const cnt = [0, 0, 0, 0, 0];
    for (const d of this.D) {
      const s = d.s + 0.1 * Math.sin(t * 0.7 + d.ph * 6), ph = (t * 0.08 + d.ph) % 1, sv = -0.15 + 0.6 * ph;
      slWavePoint(t, d.x, Math.min(sv, 0.5) + s * 0.1, P);
      this._e.set(d.spin[0] * t, d.spin[1] * t, d.spin[2] * t); this._q.setFromEuler(this._e);
      const k = MathX.smooth(H, 40, 120), sz = this._s.set(d.sz[0] * k, d.sz[1] * k, d.sz[2] * k);
      this._m.compose(P, this._q, sz); this.debris[d.k].setMatrixAt(cnt[d.k]++, this._m);
    }
    this.debris.forEach((im, k) => { im.count = cnt[k]; im.instanceMatrix.needsUpdate = true; });
  }
}
