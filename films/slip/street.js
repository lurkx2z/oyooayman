/* =====================================================================
   THE AVENUE IN THE RAIN — the overcast street of the first film (the
   shared Environment), now wet: dark asphalt and paving with real
   reflections (a planar mirror sampled through a puddle mask, smeared
   where the surface is only damp, rippled by the rain), drizzle around the
   camera, parked cars, people. The avenue runs down to the sea: it ends at a
   seafront road (z = −330), a promenade with a railing and a sea wall
   (z = −352). The beach, the sea and the wave are in sea.js.
   During the earthquake: cars rock with their hazards on, a shop window
   bursts, a cornice falls, a bracket sign swings, a crack runs along the
   sidewalk, dust shakes off the facades.
   ===================================================================== */

// the street's dimensions (metres; you walk the right-hand sidewalk toward −Z, toward the sea)
const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -48, crossHalf: 7,
  zNear: 160, zFar: -343,
  busStop: { x: -10.2, z: -21 }, cafe: { x: -10.9, z: -28.0 },
  lot: { x0: 0, x1: 0, z0: 0, z1: 0 },
  cart: { x: 7.95, z: -3.8 }, works: { liftX: 6.15, z: -14.0, poleX: 7.45 },
};
// the seafront
const SL_FRONT = { roadZ: [-343, -333], promZ: [-352, -343], wallZ: -352, beachY: -2.6, rowZ: -330 };
// the wet steel plate you slip on (centre, size) and the big puddle around it
const SL_PLATE = { x: 9.55, z: 0.95, w: 1.0, d: 1.2 };
// the camera's ground plane for reflections
const SL_MIRROR_Y = 0.075;

// ---------------------------------------------------------------------------------------------------------------------
// WET SURFACES: a patch for MeshStandardMaterial (asphalt, paving, curbs, the plate)
// ---------------------------------------------------------------------------------------------------------------------
const SL_WET_U = {
  tSlRefl: { value: null }, uSlTex: { value: new THREE.Matrix4() }, uSlTime: { value: 0 }, uSlPlaneY: { value: SL_MIRROR_Y },
  uSlWet: { value: 1 }, uSlQuake: { value: 0 }, uSlRing: { value: new THREE.Vector4(0, 0, 0, 0) },
};
const SL_WET_PARS = /* glsl */`
  uniform sampler2D tSlRefl; uniform mat4 uSlTex; uniform float uSlTime, uSlPlaneY, uSlWet, uSlQuake; uniform vec4 uSlRing;
  varying vec3 vSlW;
  float slH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float slN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(slH(i), slH(i + vec2(1, 0)), f.x), mix(slH(i + vec2(0, 1)), slH(i + vec2(1, 1)), f.x), f.y); }
  float slFbm(vec2 p){ return 0.5 * slN(p) + 0.27 * slN(p * 2.07 + 3.1) + 0.14 * slN(p * 4.3 + 7.7) + 0.09 * slN(p * 8.9 + 1.3); }
  // rain rings: a jittered grid of drops, each ring expanding and fading (two scales)
  vec2 slRipple(vec2 p, float t){
    vec2 acc = vec2(0.0);
    for (int k = 0; k < 2; k++) {
      float sc = k == 0 ? 2.6 : 4.4;
      vec2 q = p * sc + float(k) * 7.3, c = floor(q), f = fract(q) - 0.5;
      vec2 o = vec2(slH(c + 1.7), slH(c + 3.1)) - 0.5;
      float ph = fract(t * (0.9 + 0.4 * slH(c + 5.0)) + slH(c));
      vec2 d = f - o * 0.6; float L = length(d), R = ph * 0.45;
      float ring = sin((L - R) * 70.0) * exp(-abs(L - R) * 30.0) * (1.0 - ph);
      acc += d / (L + 1e-3) * ring;
    }
    return acc;
  }`;
// kind: 0 = asphalt (big puddles), 1 = paving (smaller, along the joints), 2 = steel plate (a film of water all over)
function slWetMain(kind) {
  return /* glsl */`
  {
    vec2 P = vSlW.xz;
    float pud = ${kind === 2 ? '1.0' : kind === 0 ? 'smoothstep(0.55, 0.62, slFbm(P * 0.21) + 0.1 * slN(P * 1.7))' : 'smoothstep(0.6, 0.66, slFbm(P * 0.33 + 4.0) + 0.08 * slN(P * 2.3))'};
    // (the big puddle around the steel plate)
    float dp = length((P - vec2(${SL_PLATE.x.toFixed(2)}, ${SL_PLATE.z.toFixed(2)})) * vec2(0.85, 0.6));
    pud = max(pud, smoothstep(1.35, 1.05, dp + 0.18 * slN(P * 3.0)));
    vec2 rip = slRipple(P, uSlTime) * (0.25 + 0.75 * pud) * (1.0 + 2.0 * uSlQuake);
    // the ring from your fall (x, z, radius, strength): a few crests spreading through the puddle
    vec2 rd = P - uSlRing.xy; float rl = length(rd);
    float crest = sin((rl - uSlRing.z) * 26.0) * exp(-abs(rl - uSlRing.z) * 5.0);
    rip += rd / (rl + 1e-3) * uSlRing.w * crest * smoothstep(0.0, 0.15, rl);
    vec3 V = normalize(cameraPosition - vSlW);
    float fres = 0.04 + 0.96 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
    vec2 jit = (1.0 - pud) * (vec2(slN(P * 7.0), slN(P * 7.0 + 5.0)) - 0.5) * 0.4;
    vec2 off = rip * 0.035 + jit;
    vec4 rp = uSlTex * vec4(vSlW.x + off.x, uSlPlaneY, vSlW.z + off.y, 1.0);
    // damp surfaces smear the reflection into vertical streaks (lights stretch toward you); puddles stay sharp
    float sm = (1.0 - pud) * 0.045 * rp.w;
    vec3 refl = texture2DProj(tSlRefl, rp).rgb * 0.4 + texture2DProj(tSlRefl, rp + vec4(0.0, sm, 0.0, 0.0)).rgb * 0.25
      + texture2DProj(tSlRefl, rp + vec4(0.0, -sm, 0.0, 0.0)).rgb * 0.2 + texture2DProj(tSlRefl, rp + vec4(0.0, 2.2 * sm, 0.0, 0.0)).rgb * 0.15;
    float k = uSlWet * mix(0.12 + 0.55 * fres, 0.42 + 0.58 * fres, pud) * ${kind === 2 ? '0.7' : '1.0'};
    gl_FragColor.rgb = mix(gl_FragColor.rgb * mix(0.78, ${kind === 2 ? '0.8' : '0.45'}, pud * uSlWet), refl, clamp(k, 0.0, 0.94));
    gl_FragColor.rgb += vec3(0.75, 0.85, 0.95) * max(crest, 0.0) * uSlRing.w * 0.07 * pud;   // (the ring's crests catch the sky)
  }`;
}
function slWet(mat, kind) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SL_WET_U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSlW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSlW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + SL_WET_PARS)
      .replace('#include <fog_fragment>', slWetMain(kind) + '\n#include <fog_fragment>');
  };
  mat.customProgramCacheKey = () => 'slwet' + kind;
  mat.needsUpdate = true;
  return mat;
}

class SlStreet extends Environment {
  build() {
    this._materials();
    this._wetten();
    this._sky();
    this._lights();
    this._ground();
    this._markings();
    this._buildings();
    this._skyline();
    this._trees();
    this._streetFurniture();
    this._signals();
    this._cafe();
    this._seafront();
    this._plate();
    this.batch.build(this.root, 'env');
    this._environmentMap();
    this._hazeCards();
    this._cars();
    this._quakeProps();
    this._rain();
    this._mirror();
  }

  /* ---------------- wet materials ---------------- */
  _wetten() {
    const m = this.m;
    m.asphalt.roughnessMap = null; m.asphalt.roughness = 0.42; m.asphalt.bumpScale = 0.7; m.asphalt.color.setScalar(0.62);
    m.sidewalk.roughness = 0.5; m.sidewalk.bumpScale = 1.2; m.sidewalk.color.setScalar(0.72);
    m.curb.roughness = 0.45; m.curb.color.setScalar(0.7);
    m.concrete.color.setScalar(0.8);
    slWet(m.asphalt, 0); slWet(m.sidewalk, 1); slWet(m.curb, 1);
    // the plate: diamond-tread steel under a film of water
    const c = Tex.canvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#6a6f73'; x.fillRect(0, 0, 256, 256);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const cx = i * 16 + 8 + (j % 2) * 8, cy = j * 16 + 8, a = (i + j) % 2 ? 0.6 : -0.6;
      x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = '#9aa0a4'; x.fillRect(-6, -1.6, 12, 3.2); x.fillStyle = '#3a3e41'; x.fillRect(-6, 1.2, 12, 0.8); x.restore();
    }
    x.strokeStyle = '#1d1f21'; x.lineWidth = 6; x.strokeRect(3, 3, 250, 250);
    this.plateMat = slWet(new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.22, metalness: 0.35, name: 'plate' }), 2);
    this.lampLens = new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 1.6, roughness: 0.4 });
  }

  /* ---------------- rain light: low, grey, soft ---------------- */
  _sky() {
    super._sky();
    const U = this.skyUniforms;
    U.uZenith.value.set('#4d575f'); U.uHorizon.value.set('#949c9e'); U.uGround.value.set('#4a4e4e'); U.uSunColor.value.set('#c9cfd0');
    this.horizonColor.set('#949c9e');
    this.fogColor = new THREE.Color('#858e91');
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.0026);
    this.scene.background = new THREE.Color('#949c9e');
  }
  _lights() {
    super._lights();
    this.sun.intensity = 1.05; this.sun.color.set('#dfe4e6');
    this.hemi.intensity = 1.3; this.hemi.color.set('#a3adb0'); this.hemi.groundColor.set('#34332f');
  }

  /* ---------------- ground: the avenue down to the seafront ---------------- */
  _ground() {
    const L = LAYOUT, B = this.batch, m = this.m, F = SL_FRONT;
    const cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf;
    B.add(Geo.flat(-L.roadHalf, L.roadHalf, F.roadZ[0], L.zNear, 0, 8), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(-600, -L.roadHalf, cz0, cz1, 0, 8), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(L.roadHalf, 600, cz0, cz1, 0, 8), m.asphalt, null, { noShadow: true });
    // the seafront road (along X)
    B.add(Geo.flat(-700, -L.roadHalf, F.roadZ[0], F.roadZ[1], 0, 8), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(L.roadHalf, 700, F.roadZ[0], F.roadZ[1], 0, 8), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(-900, 900, -330, 600, -0.02, 10), m.dirt, null, { noShadow: true });
    // sidewalks along the avenue (to the seafront road) and along the seafront buildings
    for (const s of [-1, 1]) {
      this._sidewalk(s * L.roadHalf, s * (L.frontage + 0.5), cz1, L.zNear);
      this._sidewalk(s * L.roadHalf, s * (L.frontage + 0.5), F.roadZ[1], cz0);
      // the sidewalk in front of the seafront row (with its curb face to the road)
      B.add(Geo.flat(Math.min(s * 13, s * 700), Math.max(s * 13, s * 700), F.roadZ[1], F.rowZ, L.curbH, 2.5), m.sidewalk, null, { noShadow: true });
      B.add(Geo.flat(Math.min(s * 13, s * 700), Math.max(s * 13, s * 700), F.roadZ[1], F.roadZ[1] + 0.32, L.curbH + 0.001, 1), m.curb, null, { noShadow: true });
      B.add(s > 0 ? Geo.quad([13, 0, F.roadZ[1]], [700, 0, F.roadZ[1]], [700, L.curbH, F.roadZ[1]], [13, L.curbH, F.roadZ[1]], 0, 0, 340, 0.15) : Geo.quad([-700, 0, F.roadZ[1]], [-13, 0, F.roadZ[1]], [-13, L.curbH, F.roadZ[1]], [-700, L.curbH, F.roadZ[1]], 0, 0, 340, 0.15), m.curb, null, { noShadow: true });
      this._sidewalkX(s * L.roadHalf, s * 600, cz1, cz1 + 5.5);
      this._sidewalkX(s * L.roadHalf, s * 600, cz0 - 5.5, cz0);
    }
    // the promenade: one long slab from the road to the sea wall, a curb on the road side
    B.add(Geo.flat(-700, 700, F.promZ[0], F.promZ[1], L.curbH, 3), m.sidewalk, null, { noShadow: true });
    B.add(Geo.quad([-700, 0, F.promZ[1]], [700, 0, F.promZ[1]], [700, L.curbH, F.promZ[1]], [-700, L.curbH, F.promZ[1]], 0, 0, 700, 0.15), m.curb, null, { noShadow: true });
    // the sea wall: concrete, stained dark near the bottom
    const wall = new THREE.MeshStandardMaterial({ map: Tex.concrete(41, [112, 110, 104]), roughness: 0.85 });
    B.add(Geo.quad([700, F.beachY - 1.5, F.wallZ], [-700, F.beachY - 1.5, F.wallZ], [-700, L.curbH, F.wallZ], [700, L.curbH, F.wallZ], 0, 0, 280, 1.2), wall, null, { noShadow: true });
    B.box(1400, 0.3, 0.5, 0, L.curbH + 0.05, F.wallZ + 0.25, m.curb, 0, { noShadow: true });
    // manholes
    const disc = new THREE.CircleGeometry(0.42, 18);
    for (const [x, z] of [[-1.6, -9], [3.4, -27], [-3.6, -74], [1.2, -110], [2.1, 18], [-2.4, -190], [2.8, -262]]) B.add(disc, m.manhole, Geo.matrix(x, 0.008, z, -Math.PI / 2), { noShadow: true });
  }

  /* ---------------- buildings: both sides to the seafront, a seafront row facing the sea ---------------- */
  _buildings() {
    const L = LAYOUT, rng = this.rng.fork(1);
    const cz0 = L.crossZ - L.crossHalf - 5.5, cz1 = L.crossZ + L.crossHalf + 5.5;
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'];
    let shopIdx = 0;
    const nextShop = () => SHOPS[(shopIdx++ * 5) % SHOPS.length];
    const row = (side, zStart, zEnd, opts) => {
      let z = zStart, prev = '';
      while (z > zEnd + 4) {
        let w = rng.range(opts.wMin || 9, opts.wMax || 19);
        if (z - w < zEnd + 6) w = z - zEnd;
        let style = rng.pick(near); if (style === prev) style = rng.pick(near); prev = style;
        this._building({ side, z0: z - w, z1: z, depth: rng.range(16, 22), style, floors: rng.int(opts.fMin, opts.fMax), shops: true, nextShop, rng });
        z -= w;
      }
    };
    for (const s of [-1, 1]) { row(s, L.zNear, cz1, { fMin: 3, fMax: 6 }); row(s, cz0, -312, { fMin: 3, fMax: 7 }); }
    for (const s of [-1, 1]) {
      this._rowX(s, 34, 260, cz1, 1, rng); this._rowX(s, 34, 260, cz0, -1, rng);
      this._seaRow(s, rng);
    }
    // a second row behind (taller, depth above the rooftops)
    for (const s of [-1, 1]) {
      let z = 140;
      while (z > -300) {
        const w = rng.range(14, 30), h = rng.range(24, 60);
        if (!(z - w < cz1 + 2 && z > cz0 - 2)) {
          const st = this.facades[rng.pick(['modern', 'stone', 'cream', 'tanbrick', 'redbrick', 'whitebrick'])];
          const x0 = s > 0 ? 40 : -40 - rng.range(16, 26), x1 = s > 0 ? 40 + rng.range(16, 26) : -40;
          this.batch.add(Geo.boxSides(x0, x1, 0, h, z - w, z, st.tileW, st.tileH), st.mat, null);
          this.batch.add(Geo.flat(x0, x1, z - w, z, h, 4), this.m.roof, null, { noShadow: true });
        }
        z -= w + rng.range(0, 6);
      }
    }
  }
  // the seafront row: buildings facing the sea from the avenue corner outward
  _seaRow(s, rng) {
    let x = 12.5;
    while (x < 480) {
      const w = rng.range(12, 24), fl = rng.int(4, 9);
      const st = this.facades[rng.pick(['cream', 'whitebrick', 'stone', 'salmon', 'modern', 'sage'])];
      const H = 4.4 + fl * st.style.floorH;
      const x0 = s > 0 ? x : -x - w, x1 = s > 0 ? x + w : -x, z0 = SL_FRONT.rowZ, z1 = SL_FRONT.rowZ + 18;
      this.batch.add(Geo.boxSides(x0, x1, 0, 4.4, z0, z1, 3, 4.4), st.wall, null);
      this.batch.add(Geo.boxSides(x0, x1, 4.4, H, z0, z1, st.tileW, st.tileH), st.mat, null);
      this.batch.add(Geo.flat(x0, x1, z0, z1, H, 4), this.m.roof, null, { noShadow: true });
      x += w + (rng.next() < 0.2 ? rng.range(6, 10) : 0);
    }
  }
  // inland, at the top of the avenue: towers (you see them when you run)
  _skyline() {
    const rng = this.rng.fork(2), B = this.batch, styles = ['glassblue', 'glassteal', 'modern', 'stone', 'glassblue'];
    for (let i = 0; i < 46; i++) {
      const z = rng.range(240, 700); let x = rng.range(-260, 260);
      if (Math.abs(x) < 26) x += Math.sign(x || 1) * 30;
      const w = rng.range(22, 44), d = rng.range(22, 40), h = rng.range(45, 170) * (Math.abs(x) < 120 ? 1 : 0.7);
      const st = this.facades[rng.pick(styles)];
      B.add(Geo.boxSides(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, st.tileW, st.tileH), st.mat, null, { noShadow: true });
      B.add(Geo.flat(x - w / 2, x + w / 2, z - d / 2, z + d / 2, h, 5), this.m.roof, null, { noShadow: true });
    }
  }

  _trees() {
    const rng = this.rng.fork(3), L = LAYOUT, cz0 = L.crossZ - L.crossHalf - 6, cz1 = L.crossZ + L.crossHalf + 6;
    for (let z = 30; z > -318; z -= 9.5) {
      if ((z < cz1 && z > cz0) || Math.abs(z - L.busStop.z) < 4) continue;
      this._tree(-8.15, z + rng.range(-0.8, 0.8), rng, rng.range(0.75, 1.25));
    }
    for (let z = 40; z > -318; z -= 9.5) {
      if ((z < cz1 && z > cz0) || (z < 26 && z > -56)) continue;
      this._tree(8.15, z + rng.range(-0.8, 0.8), rng, rng.range(0.75, 1.25));
    }
  }
  _streetLight(x, z, side) {
    const B = this.batch, h = LAYOUT.curbH, m = this.m;
    B.add(new THREE.CylinderGeometry(0.07, 0.11, 8.0, 8), m.metal, Geo.matrix(x, h + 4.0, z));
    B.add(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), m.metal, Geo.matrix(x, h + 0.25, z));
    B.add(new THREE.CylinderGeometry(0.045, 0.05, 2.2, 6), m.metal, Geo.matrix(x - side * 1.0, h + 7.95, z, 0, 0, Math.PI / 2 - side * 0.12));
    B.box(0.75, 0.16, 0.36, x - side * 2.05, h + 7.95, z, m.metal);
    B.box(0.6, 0.03, 0.26, x - side * 2.05, h + 7.86, z, this.lampLens, 0, { noShadow: true });
  }
  _streetFurniture() {
    const B = this.batch, m = this.m, L = LAYOUT, h = L.curbH, cz0 = L.crossZ - L.crossHalf - 3, cz1 = L.crossZ + L.crossHalf + 3;
    for (let z = 40; z > -320; z -= 30) {
      if (!(z < cz1 && z > cz0) && !(z < 14 && z > -4)) this._streetLight(7.45, z, 1);
      if (!(z - 15 < cz1 && z - 15 > cz0)) this._streetLight(-7.45, z - 15, -1);
    }
    for (const [x, z] of [[7.7, -24], [-7.7, -33], [7.7, -63], [-7.7, 14], [7.7, -150], [-7.7, -240]]) {
      B.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10), m.red, Geo.matrix(x, h + 0.3, z));
      B.add(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.red, Geo.matrix(x, h + 0.6, z));
    }
    for (const [x, z] of [[7.75, -27], [-7.8, -14], [-7.8, 8], [7.75, -62.5], [7.9, -9.5]]) {
      B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(x, h + 0.475, z));
      B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(x, h + 0.99, z));
    }
    for (const [x, z, r] of [[-12.0, -10, Math.PI / 2], [12.0, 14, -Math.PI / 2]]) this._bench(x, z, r);
    this._busShelter(L.busStop.x, L.busStop.z);
    const np = Tex.label([['NO', 40], ['STOPPING', 44], ['ANY TIME', 30]], { w: 192, h: 256, bg: '#f4f4f0', fg: '#c0392b', border: '#c0392b' });
    const npm = new THREE.MeshStandardMaterial({ map: np, roughness: 0.6 });
    for (const [x, z] of [[7.5, 8], [-7.5, -26], [7.6, -40]]) {
      B.add(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 6), m.metal, Geo.matrix(x, h + 1.3, z));
      B.box(0.02, 0.6, 0.45, x, h + 2.35, z, npm, 0, { noShadow: true });
    }
  }

  /* ---------------- the seafront: railing, lamps, benches, steps to the beach ---------------- */
  _seafront() {
    const B = this.batch, h = LAYOUT.curbH, F = SL_FRONT, z = F.wallZ + 0.22;
    const rail = Mat.std('#cfd6d6', { roughness: 0.4, metalness: 0.5 });
    for (let x = -300; x <= 300; x += 2.0) { if (x > 29 && x < 35) continue; B.box(0.06, 1.05, 0.06, x, h + 0.53, z, rail); }
    for (const y of [0.5, 1.05]) for (const [a, b] of [[-300, 29], [35, 300]]) B.box(b - a, 0.05, 0.06, (a + b) / 2, h + y, z, rail);
    for (let x = -290; x <= 290; x += 24) {
      B.add(new THREE.CylinderGeometry(0.06, 0.09, 5.2, 8), this.m.metal, Geo.matrix(x, h + 2.6, F.promZ[1] - 1.0));
      B.add(new THREE.SphereGeometry(0.22, 10, 8), this.lampLens, Geo.matrix(x, h + 5.3, F.promZ[1] - 1.0));
      if (Math.abs(x) > 20) this._bench(x + 8, F.promZ[1] - 2.5, Math.PI);
    }
    // steps down to the beach (x 29…35)
    const step = Mat.std('#8e8b84', { roughness: 0.9 });
    for (let i = 0; i < 9; i++) { const y = h - (i + 1) * 0.31, zz = F.wallZ - 0.2 - i * 0.42; B.box(6, 0.31, 0.42, 32, y + 0.155, zz, step); }
    // a kiosk and a sign by the steps
    B.box(3.2, 2.6, 2.4, 44, h + 1.3, F.promZ[1] - 3.6, Mat.std('#d9d2c2', { roughness: 0.8 }));
    B.box(3.6, 0.2, 2.8, 44, h + 2.7, F.promZ[1] - 3.6, Mat.std('#2f6b5a', { roughness: 0.6 }));
    const sg = Tex.label([['NORTH BEACH', 52]], { w: 512, h: 96, bg: '#1d4d5a', fg: '#f1efe6' });
    B.add(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), this.m.metal, Geo.matrix(37, h + 1.2, z + 0.4));
    B.box(1.6, 0.32, 0.04, 37, h + 2.3, z + 0.4, new THREE.MeshStandardMaterial({ map: sg, roughness: 0.5 }));
  }

  _plate() {
    const P = SL_PLATE, h = LAYOUT.curbH;
    const g = new THREE.BoxGeometry(P.w, 0.02, P.d);
    const mesh = new THREE.Mesh(g, this.plateMat); mesh.position.set(P.x, h + 0.008, P.z); mesh.receiveShadow = true;
    this.root.add(mesh); this.plate = mesh;
  }

  /* ---------------- cars: parked along the curb (they rock in the quake), one passing at the start ---------------- */
  _cars() {
    const F = new VehicleFactory(), dim = new THREE.MeshStandardMaterial({ color: '#d8d6d0', roughness: 0.25 });
    this.cars = [];
    const park = [['sedan', '#2c3a4a', 5.35, -4.2, 0], ['hatch', '#8a2a22', 5.35, -10.6, 0], ['suv', '#d8d8d4', 5.35, -17.5, 0], ['sedan', '#3a3d40', -5.35, -6.5, 1], ['hatch', '#4a5a3a', -5.35, -14.0, 1], ['suv', '#20252a', 5.35, -36, 0], ['sedan', '#9a9890', -5.35, -40, 1]];
    for (const [type, col, x, z, dir] of park) {
      const v = F.build(type, col);
      v.group.traverse((o) => { if (o.isMesh && o.material === F.m.head) o.material = dim; if (o.isMesh) o.castShadow = true; });
      v.group.position.set(x, 0, z); v.group.rotation.y = dir ? -Math.PI / 2 : Math.PI / 2;
      this.scene.add(v.group); this.cars.push({ v, x, z, ry: v.group.rotation.y, seed: x * 3.1 + z });
    }
    // the passing car: headlights on, toward you in the far lane
    const p = F.build('sedan', '#5e6870'); p.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    p.group.rotation.y = -Math.PI / 2; this.scene.add(p.group); this.passer = p;
    this.passLight = new THREE.SpotLight('#fff1d8', 0, 40, 0.5, 0.6, 1.2); this.passLight.position.set(0, 0.7, 0); p.group.add(this.passLight); p.group.add(this.passLight.target); this.passLight.target.position.set(10, 0, 0);
  }

  /* ---------------- the earthquake's props near you ---------------- */
  _quakeProps() {
    const h = LAYOUT.curbH;
    // the shop window on your right that bursts
    this.glass = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.5), new THREE.MeshPhysicalMaterial({ color: '#c7d7dc', roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.32, envMapIntensity: 1.6 }));
    this.glass.position.set(12.42, h + 1.55, -3.4); this.glass.rotation.y = -Math.PI / 2; this.scene.add(this.glass);
    const shardMat = new THREE.MeshStandardMaterial({ color: '#dfeaee', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    this.shards = new SlChunks(this.scene, 70, shardMat, 61, (i, r) => ({ p: new THREE.Vector3(12.35, h + 0.4 + r.next() * 2.3, -3.4 + r.range(-1.6, 1.6)), v: new THREE.Vector3(r.range(-3.5, -0.8), r.range(-0.5, 2.0), r.range(-1.2, 1.2)), t0: 27.05 + r.next() * 0.12, size: r.range(0.06, 0.28), flat: 0.06, spin: new THREE.Vector3(r.range(-12, 12), r.range(-12, 12), r.range(-12, 12)) }));
    // a cornice breaking off across the street and a chunk near you
    const stone = Mat.std('#9b958a', { roughness: 0.9 });
    this.cornice = new SlChunks(this.scene, 34, stone, 62, (i, r) => {
      const near = i < 8;
      return { p: near ? new THREE.Vector3(12.0 + r.range(-0.3, 0.3), 9.5 + r.next(), -7.5 + r.range(-1.5, 1.5)) : new THREE.Vector3(-12.6, 14 + r.next() * 2, -12 + r.range(-3, 3)),
        v: near ? new THREE.Vector3(r.range(-2.5, -0.5), r.range(0, 1.5), r.range(-1, 1)) : new THREE.Vector3(r.range(0.5, 3.0), r.range(0, 2), r.range(-1, 1)),
        t0: (near ? 29.3 : 28.2) + r.next() * 0.3, size: r.range(0.12, near ? 0.45 : 0.7), flat: 0.6, spin: new THREE.Vector3(r.range(-5, 5), r.range(-5, 5), r.range(-5, 5)) };
    });
    // a bracket sign over the sidewalk (it swings) and the lamp post by the curb (it sways)
    const sg = Tex.label([['PHARMACY', 46]], { w: 384, h: 128, bg: '#1b7a4e', fg: '#ffffff' });
    this.sign = new THREE.Group(); this.sign.position.set(12.0, h + 3.6, -1.4);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.05), this.m.metal); bar.position.set(-0.6, 0, 0); this.sign.add(bar);
    const pan = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.05), new THREE.MeshStandardMaterial({ map: sg, roughness: 0.5, emissive: '#ffffff', emissiveMap: sg, emissiveIntensity: 0.35 }));
    pan.position.set(-0.7, -0.32, 0); pan.rotation.y = Math.PI / 2; this.sign.add(pan); this.scene.add(this.sign);
    this.post = new THREE.Group(); this.post.position.set(7.45, h, 7.0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 8, 8), this.m.metal); pole.position.y = 4; this.post.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 2.2, 6), this.m.metal); arm.position.set(-1.0, 7.95, 0); arm.rotation.z = Math.PI / 2 - 0.12; this.post.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.36), this.m.metal); head.position.set(-2.05, 7.95, 0); this.post.add(head);
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.26), this.lampLens); lens.position.set(-2.05, 7.86, 0); this.post.add(lens);
    this.scene.add(this.post);
    // the crack: a dark seam that runs along the sidewalk toward your hand and opens
    const cg = new THREE.PlaneGeometry(1, 1, 60, 1); cg.rotateX(-Math.PI / 2);
    this.crackU = { uLen: { value: 0 }, uOpen: { value: 0 } };
    this.crack = new THREE.Mesh(cg, new THREE.ShaderMaterial({
      uniforms: this.crackU, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.x += 0.12 * sin(uv.x * 23.0) + 0.06 * sin(uv.x * 61.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
      fragmentShader: `uniform float uLen, uOpen; varying vec2 vUv;
        void main(){ if (vUv.x > uLen) discard; float w = (0.15 + 0.85 * uOpen) * (0.6 + 0.4 * sin(vUv.x * 37.0)) * smoothstep(uLen, uLen - 0.06, vUv.x);
          float d = abs(vUv.y - 0.5) * 2.0; float a = smoothstep(w, w * 0.6, d); gl_FragColor = vec4(vec3(0.015), a * 0.95); }`,
    }));
    this.crack.position.set(9.9, LAYOUT.curbH + 0.012, -4.0); this.crack.rotation.y = Math.PI / 2 + 0.1; this.crack.scale.set(11, 1, 0.16);
    this.crack.visible = false; this.scene.add(this.crack);
    // dust shaken off the facades
    this.dust = new XBill(this.scene, { n: 90, kind: 'soft', color: '#b9b2a6', seed: 63, alpha: 0.32, fadeIn: 0.15, fadeOut: 0.4,
      spawn: (i, r) => { const side = r.next() < 0.5 ? -1 : 1; return { p: new THREE.Vector3(side * 12.4, r.range(4, 16), r.range(-40, 6)), v: new THREE.Vector3(-side * r.range(0.3, 1.2), r.range(-1.6, -0.4), r.range(-0.3, 0.3)), t0: 25.4 + r.next() * 6, life: r.range(2.0, 3.5), s0: 1.2, s1: 4.5 }; } });
  }

  /* ---------------- rain: streaks in a box that follows the camera ---------------- */
  _rain() {
    const N = CONFIG.captureMode ? 2600 : 1600, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const seed = new Float32Array(N * 4), r = new RNG(64);
    for (let i = 0; i < N; i++) { seed[i * 4] = r.next(); seed[i * 4 + 1] = r.next(); seed[i * 4 + 2] = r.next(); seed[i * 4 + 3] = r.next(); }
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = N;
    this.rainU = { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uAmt: { value: 1 }, uCol: { value: new THREE.Color('#c9d2d6') } };
    this.rain = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: this.rainU, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        attribute vec4 aSeed; uniform float uTime; uniform vec3 uCam; varying float vA; varying float vU;
        void main(){
          vec3 box = vec3(22.0, 14.0, 22.0), vel = vec3(-0.8, -9.0, 0.6);
          vec3 p = aSeed.xyz * box + vel * (uTime * (0.85 + 0.3 * aSeed.w));
          p = mod(p - uCam + box * 0.5, box) - box * 0.5 + uCam;
          float len = 0.42 + 0.3 * aSeed.w;
          vec3 dir = normalize(vel);
          vec4 a = viewMatrix * vec4(p, 1.0), b = viewMatrix * vec4(p + dir * len, 1.0);
          vec2 sd = normalize(vec2(-(b.y - a.y), b.x - a.x) + 1e-5);
          vec4 q = mix(a, b, position.y); q.xy += sd * position.x * 0.0045 * (0.6 - q.z * 0.03);
          float dist = -q.z; vA = smoothstep(0.25, 1.2, dist) * (1.0 - smoothstep(6.0, 11.0, dist)); vU = position.y;
          gl_Position = projectionMatrix * q;
        }`,
      fragmentShader: 'uniform vec3 uCol; uniform float uAmt; varying float vA; varying float vU; void main(){ gl_FragColor = vec4(uCol, vA * uAmt * 0.32 * sin(vU * 3.1416)); }',
    }));
    this.rain.frustumCulled = false; this.rain.renderOrder = 8; this.scene.add(this.rain);
  }

  /* ---------------- reflections for the wet ground ---------------- */
  _mirror() {
    this.mirror = new Mirror(1, 1, { resolution: CONFIG.captureMode ? 720 : 512, see: [0, 1], clip: true, clipBias: 0.02 });
    this.mirror.mesh.rotation.x = -Math.PI / 2; this.mirror.mesh.position.y = SL_MIRROR_Y; this.mirror.mesh.material.visible = false;
    this.scene.add(this.mirror.mesh);
    SL_WET_U.tSlRefl.value = this.mirror.rt.texture;
  }
  renderMirror(renderer, camera) {
    const keep = this.rain.visible; this.rain.visible = false;
    // (the wet ground must not sample its own reflection while the reflection renders)
    if (!this._black) { const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }), cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha(); renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.setClearColor(cc, ca); renderer.setRenderTarget(null); this._black = rt.texture; }
    SL_WET_U.tSlRefl.value = this._black; SL_WET_U.uSlWet.value = 0;
    this.mirror.render(renderer, this.scene, camera);
    SL_WET_U.tSlRefl.value = this.mirror.rt.texture; SL_WET_U.uSlWet.value = 1;
    this.rain.visible = keep;
    const c = this.mirror.cam;
    SL_WET_U.uSlTex.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
  }

  /* ---------------- per frame ---------------- */
  // q = quake strength (0..1), Q = the shaking itself (a vector, m) from film.js
  update(t, cam, q = 0, Q = null) {
    if (this.haze) for (const hz of this.haze) {
      const cp = cam.position;
      hz.m.rotation.y = Math.atan2(cp.x - hz.m.position.x, cp.z - hz.m.position.z);
      hz.mat.uniforms.uOff.value.x = hash1(hz.drift * 1000) + t * hz.drift;
      hz.mat.uniforms.uColor.value.copy(this.scene.fog.color).multiplyScalar(1.04);
      hz.mat.uniforms.uNear.value = MathX.smooth(Math.hypot(cp.x - hz.m.position.x, cp.z - hz.m.position.z), 14, 30);
    }
    this.skyUniforms.uTime.value = t; this.skyUniforms.uO2.value = 1;
    SL_WET_U.uSlTime.value = t; SL_WET_U.uSlQuake.value = q;
    this.rainU.uTime.value = t; this.rainU.uCam.value.copy(cam.position);
    for (const m of this.shopMats) m.emissiveIntensity = 0.75;
    if (this.dynamic.ad) this.dynamic.ad.emissiveIntensity = 1.0;
    // the passing car (0–6 s): toward you in the far lane, spray behind it
    const pz = -70 + 16 * t;
    this.passer.group.position.set(-1.9, 0, pz); this.passer.group.visible = t < 9;
    this.passLight.intensity = t < 9 ? 22 : 0;
    for (const w of this.passer.wheels) w.rotation.z = -pz / this.passer.r;
    // quake: cars rock on their springs, hazards blink; the sign swings, the post sways; glass, cornice, crack, dust
    const blink = q > 0.05 && Math.floor(t * 2.6) % 2 === 0;
    for (const c of this.cars) {
      const s = c.seed, k = q * (0.7 + 0.3 * Math.sin(s));
      c.v.group.position.set(c.x + (Q ? Q.x * 1.3 : 0), Math.max(0, noise1(t * 7 + s, 5) * 0.06 * k), c.z + (Q ? Q.z * 1.3 : 0));
      c.v.group.rotation.set(noise1(t * 6.5 + s, 6) * 0.05 * k, c.ry + noise1(t * 2 + s, 8) * 0.02 * k, noise1(t * 7.3 + s, 7) * 0.06 * k);
      if (c.v.hazard) c.v.hazard.emissiveIntensity = blink ? 2.4 : 0;
    }
    this.sign.rotation.z = q * (0.35 * Math.sin(t * 4.1) + 0.15 * noise1(t * 3, 9));
    this.sign.rotation.x = q * 0.25 * Math.sin(t * 3.3 + 1);
    this.post.rotation.z = q * (0.035 * Math.sin(t * 2.2) + 0.02 * noise1(t * 4, 10)); this.post.rotation.x = q * 0.025 * Math.sin(t * 1.9 + 2);
    this.glass.visible = t < 27.05;
    this.shards.update(t); this.cornice.update(t); this.dust.update(q > 0.01 ? t : -1e9);
    this.crack.visible = t > 26.0 && t < SL.earth;
    this.crackU.uLen.value = MathX.smooth(t, 26.2, 28.6); this.crackU.uOpen.value = MathX.smooth(t, 27.5, 31.0);
  }
}

/* ---------------- tumbling chunks on ballistic arcs that come to rest on the ground (glass, stone) ---------------- */
class SlChunks {
  constructor(scene, n, mat, seed, spawn, ground = () => LAYOUT.curbH) {
    this.r = new RNG(seed); this.P = []; for (let i = 0; i < n; i++) this.P.push(spawn(i, this.r));
    this.ground = ground;
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, n); this.mesh.castShadow = true; this.mesh.frustumCulled = false; scene.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
  }
  update(t) {
    let any = false;
    this.P.forEach((o, i) => {
      const u = t - o.t0;
      if (u < 0) { this._m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this._m); return; }
      any = true;
      const gy = this.ground(o.p.x, o.p.z), tl = (o.v.y + Math.sqrt(o.v.y * o.v.y + 2 * 9.8 * Math.max(0, o.p.y - gy))) / 9.8, uu = Math.min(u, tl);
      // after landing: a short skid
      const sk = Math.max(0, u - tl), sl = Math.min(sk, 0.35) * 0.5;
      this._p.set(o.p.x + o.v.x * (uu + sl), Math.max(gy + o.size * (o.flat || 0.7) * 0.5, o.p.y + o.v.y * uu - 4.9 * uu * uu), o.p.z + o.v.z * (uu + sl));
      const su = uu + Math.min(sk, 0.3) * 0.3;
      this._e.set(o.spin.x * su, o.spin.y * su, o.spin.z * su); this._q.setFromEuler(this._e);
      this._m.compose(this._p, this._q, this._s.set(o.size, o.size * (o.flat || 0.7), o.size * 0.85)); this.mesh.setMatrixAt(i, this._m);
    });
    this.mesh.visible = any; if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
