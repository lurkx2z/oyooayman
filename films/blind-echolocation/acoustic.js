/* =====================================================================
   ACOUSTIC — the film's visual language for SOUND INFORMATION (reusable by later long-form films).
   An artistic, physically motivated visualization of what echoes can tell a listener. It is NOT what a blind person
   sees: it is a metaphor for the audience. Rules it follows:
     - darkness by default; only sound produces information, and that information FADES;
     - a click/impact is a PULSE: a front that leaves its origin at a visual speed (always labelled when slowed), sweeps
       across surfaces (a bright contact line) and leaves a brief afterglow that dies away;
     - what a surface returns depends on its MATERIAL (refl: how much it reflects; crisp: how mirror-like the return
       is — metal and glass return a strong, tight reflection mostly at normal incidence, fabric and foam little and
       diffuse), its DISTANCE (falloff) and whether it FACES the source;
     - the return is drawn as arrival-time contour lines + a sampled dot grid, broken by noise: partial and uncertain,
       never a continuous X-ray map;
     - background sounds (BeRings) give a direction and a rhythm, never geometry.
   Pieces:
     BE_AC                  the shared uniforms (the film sets them every frame)
     beAcoustic(mat, o)     adds the acoustic term to any MeshStandardMaterial (chains onBeforeCompile; keeps the rim)
     beAcousticScene(root)  applies it to every material in a set, with refl/crisp read from the material name
     BePulses               the pulse list → uniforms (pure function of time: pulses are scheduled data)
     BeWaves                3D wavefront shells in the air (outgoing sphere; reflected spheres from IMAGE SOURCES
                            behind walls, clipped to the room side: the physically correct shape of a plane reflection)
     BeRings                camera-facing ripple rings for sound sources (amber) and echo arrivals
   ===================================================================== */

const BE_AC = {
  uBeAc: { value: 0 },          // 0 = reality, 1 = acoustic view
  uBeT: { value: 0 },           // the pulse clock (film time, or a slowed clock in the science shots)
  uBeGain: { value: 1 },
  uBeDecay: { value: 0.4 },    // seconds a contact keeps glowing
  uBeLine: { value: 5.0 },      // contour lines per metre
  uBePO: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },   // origin xyz, t0
  uBePP: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },   // speed (m/s, visual), strength, width (m), kind (0 click, 1 source/amber, 2 weak/violet)
  uBeColA: { value: new THREE.Color('#62f3ff') },   // strong return
  uBeColB: { value: new THREE.Color('#7a5cff') },   // weak return
  uBeColC: { value: new THREE.Color('#ffb05a') },   // sound source
  // per-group reality brightness in the acoustic view (0 = black): world, people, light sources
  real: { world: { value: 0 }, hero: { value: 0 }, glow: { value: 0 } },
  // per-group acoustic gain (the hero's own body hardly "returns" his own click)
  gain: { world: { value: 1 }, hero: { value: 0.6 }, glow: { value: 1 } },
};

// material character from its name (sets are built with descriptive material names)
const BE_MATERIAL_CLASS = [
  [/metal|steel|chrome|brass|rail|panel|handle|lamp/i, 0.95, 0.9],
  [/glass|window|mirror|lens|screen/i, 0.9, 0.95],
  [/foam|wedge|absorb/i, 0.05, 0.0],
  [/fabric|duvet|pillow|curtain|cloth|rug|sofa|towel|gbtop|gbpants|felt|cushion|hair|coat/i, 0.34, 0.05],
  [/wood|door|table|cabinet|dresser|shelf|frame|floor|chair|bench/i, 0.6, 0.45],
  [/plaster|wall|concrete|stone|brick|tile|ceiling|pave|asphalt|kerb/i, 0.75, 0.55],
  [/skin|lip|eye|pupil|mouth|teeth/i, 0.3, 0.1],
];
function beClassify(name) {
  for (const [re, refl, crisp] of BE_MATERIAL_CLASS) if (re.test(name || '')) return { refl, crisp };
  return { refl: 0.5, crisp: 0.35 };
}

const BE_AC_GLSL = /* glsl */`
uniform float uBeAc, uBeT, uBeGain, uBeDecay, uBeLine, uBeRefl, uBeCrisp, uBeReal, uBeGrpGain;
uniform vec4 uBePO[16]; uniform vec4 uBePP[16];
uniform vec3 uBeColA, uBeColB, uBeColC;
varying vec3 vBeW;
float beH3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float beN3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(beH3(i), beH3(i + vec3(1, 0, 0)), f.x), mix(beH3(i + vec3(0, 1, 0)), beH3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(beH3(i + vec3(0, 0, 1)), beH3(i + vec3(1, 0, 1)), f.x), mix(beH3(i + vec3(0, 1, 1)), beH3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
vec3 beAcoustic(vec3 P, vec3 N) {
  vec3 acc = vec3(0.0);
  // a sparse, jittered sample grid on the surface (triplanar, by the dominant normal axis): the "points" of a return
  vec3 aN = abs(N);
  vec2 uv = (aN.x > aN.y && aN.x > aN.z ? P.yz : (aN.y > aN.z ? P.xz : P.xy)) * 14.0;
  vec2 ci = floor(uv), cell = fract(uv) - 0.5;
  float hr = beH3(vec3(ci, 3.1)), hj = beH3(vec3(ci, 7.7));
  cell -= (vec2(hr, hj) - 0.5) * 0.45;
  float dw = fwidth(uv.x) + 0.02;
  float dots = smoothstep(0.13 + dw, 0.13 - dw, length(cell)) * step(0.55, beH3(vec3(ci, 1.3)));
  float crease = clamp(length(fwidth(N)) * 3.0, 0.0, 1.0);
  float fres = pow(1.0 - abs(dot(N, normalize(cameraPosition - P))), 3.0);   // grazing surfaces outline the forms
  for (int i = 0; i < 16; i++) {
    vec4 o = uBePO[i], q = uBePP[i];
    if (q.y <= 0.0) continue;
    float age = uBeT - o.w;
    if (age <= 0.0) continue;
    vec3 D = o.xyz - P; float d = length(D) + 1e-4;
    float lag = q.x * age - d;
    if (lag < -2.5 * q.z) continue;
    float since = max(lag, 0.0) / q.x;
    if (since > uBeDecay * 6.0) continue;
    float w2 = q.z * q.z;
    // the contact front, and a few weaker trailing fronts (later reflections: the room's reverberation)
    float front = exp(-lag * lag / w2);
    float rev = 0.0;
    for (int n = 1; n <= 2; n++) { float l2 = lag - float(n) * (0.18 + 4.0 * q.z); rev += pow(0.42, float(n)) * exp(-l2 * l2 / (w2 * 0.5)); }
    float tail = lag > 0.0 ? exp(-since / uBeDecay) : 0.0;
    float facing = clamp(dot(N, D / d), 0.0, 1.0);
    float ret = mix(0.25 + 0.75 * facing, pow(facing, 5.0) * 1.4, uBeCrisp);
    float fall = 1.0 / (1.0 + d * d * 0.09);
    float mask = 0.25 + 0.75 * smoothstep(0.3, 0.72, beN3(P * 1.7 + float(i) * 3.7));
    float r = uBeRefl;
    float kf = (front + rev * mask) * (0.2 + 0.8 * facing) * (0.3 + 0.7 * r);
    float kt = tail * ret * r * mask;
    float k = q.y * fall * (kf + kt * (0.03 + 0.8 * dots + 0.5 * crease + 0.9 * fres));
    vec3 col = q.w > 0.5 && q.w < 1.5 ? uBeColC : (q.w > 1.5 ? uBeColB : mix(uBeColB, uBeColA, smoothstep(0.15, 0.8, r) * (0.55 + 0.45 * front)));
    acc += col * k;
  }
  return acc * uBeGain * uBeGrpGain;
}
`;

const _beMats = new Set();
// o: refl, crisp, group ('world' | 'hero' | 'glow'). Idempotent per material.
function beAcoustic(m, o = {}) {
  if (!m || m.userData.beAc) return m;
  const c = beClassify(m.name);
  const refl = o.refl ?? c.refl, crisp = o.crisp ?? c.crisp, grp = o.group || 'world';
  m.userData.beAc = { refl, crisp, grp };
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => '';
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(m, sh, r);
    Object.assign(sh.uniforms, {
      uBeAc: BE_AC.uBeAc, uBeT: BE_AC.uBeT, uBeGain: BE_AC.uBeGain, uBeDecay: BE_AC.uBeDecay, uBeLine: BE_AC.uBeLine,
      uBePO: BE_AC.uBePO, uBePP: BE_AC.uBePP, uBeColA: BE_AC.uBeColA, uBeColB: BE_AC.uBeColB, uBeColC: BE_AC.uBeColC,
      uBeRefl: { value: refl }, uBeCrisp: { value: crisp }, uBeReal: BE_AC.real[grp], uBeGrpGain: BE_AC.gain[grp],
    });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBeW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 beWP = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
          beWP = instanceMatrix * beWP;
          #endif
          vBeW = (modelMatrix * beWP).xyz; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + BE_AC_GLSL)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        if (uBeAc > 0.001) {
          vec3 beN = normalize(inverseTransformDirection(normal, viewMatrix));
          vec3 beA = beAcoustic(vBeW, beN);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * uBeReal + beA, uBeAc);
        }`);
    if (!/beAcoustic\(vBeW/.test(sh.fragmentShader)) console.warn('beAcoustic: injection failed for', m.name);
  };
  m.customProgramCacheKey = () => prevKey() + '|beac';
  m.needsUpdate = true;
  _beMats.add(m);
  return m;
}

// apply to every standard material under a root (group defaults to 'world')
function beAcousticScene(root, group = 'world', over = {}) {
  root.traverse((o) => {
    if (!o.isMesh || o.userData.beSkip) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m && m.isMeshStandardMaterial) beAcoustic(m, Object.assign({ group }, over[m.name] || {}));
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// PULSES: scheduled data → the 8 uniform slots. A pulse: { t, p: Vector3 | (t)=>Vector3, speed, str, w, kind, life }
// ---------------------------------------------------------------------------------------------------------------------
class BePulses {
  constructor() { this.list = []; }
  add(p) { this.list.push(Object.assign({ speed: 3.0, str: 1, w: 0.12, kind: 0, life: 4.0 }, p)); return this; }
  clear() { this.list.length = 0; }
  // write the (up to 16) most recent live pulses at clock T into the uniforms; scale = global strength multiplier
  apply(T, scale = 1, filter = null) {
    const live = this.list.filter((q) => T >= q.t - 0.001 && T < q.t + q.life && (!filter || filter(q))).sort((a, b) => b.t - a.t).slice(0, 16);
    for (let i = 0; i < 16; i++) {
      const O = BE_AC.uBePO.value[i], Q = BE_AC.uBePP.value[i], q = live[i];
      if (!q) { Q.set(0, 0, 0, 0); continue; }
      const p = typeof q.p === 'function' ? q.p(q.t) : q.p;
      O.set(p.x, p.y, p.z, q.t);
      // fade the whole pulse out over its last 30 % of life
      const fade = 1 - MathX.smooth(T, q.t + q.life * 0.7, q.t + q.life);
      Q.set(q.speed, q.str * scale * fade, q.w, q.kind);
    }
    return live;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// WAVES: additive wavefront shells in the air
// ---------------------------------------------------------------------------------------------------------------------
class BeWaves {
  constructor(scene, max = 12) {
    this.max = max; this.items = [];
    const geo = new THREE.IcosahedronGeometry(1, 5);
    for (let i = 0; i < max; i++) {
      const u = {
        uCol: { value: new THREE.Color('#62f3ff') }, uA: { value: 0 }, uR: { value: 1 }, uSeed: { value: i * 7.3 },
        uClipP: { value: new THREE.Vector3() }, uClipN: { value: new THREE.Vector3() }, uClip: { value: 0 },
        uClip2P: { value: new THREE.Vector3() }, uClip2N: { value: new THREE.Vector3() }, uClip2: { value: 0 }, uBand: { value: 0 },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          varying vec3 vW, vN; varying vec3 vV;
          void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
            vV = cameraPosition - w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol, uClipP, uClipN, uClip2P, uClip2N; uniform float uA, uR, uSeed, uClip, uClip2, uBand;
          varying vec3 vW, vN, vV;
          float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
          float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                       mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
          void main(){
            if (uClip > 0.5 && dot(vW - uClipP, uClipN) < 0.0) discard;
            if (uClip2 > 0.5 && dot(vW - uClip2P, uClip2N) < 0.0) discard;
            float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
            float edge = pow(f, 3.6);
            // fine latitude bands give the shell a "pressure front" texture without looking like a ball
            float band = uBand > 0.0 ? 0.65 + 0.35 * sin(dot(normalize(vN), vec3(0.0, 1.0, 0.0)) * 60.0) : 1.0;
            float nz = 0.55 + 0.45 * n3(vN * 3.0 + uSeed) ;
            float a = uA * (0.012 + edge) * nz * band;
            gl_FragColor = vec4(uCol * a, 1.0);
          }`,
      });
      const m = new THREE.Mesh(geo, mat); m.visible = false; m.frustumCulled = false; m.renderOrder = 6; m.userData.beSkip = true;
      scene.add(m); this.items.push(m);
    }
    this.n = 0;
  }
  begin() { this.n = 0; }
  // c: centre, r: radius, a: alpha, col: Color/hex, clip: [point, normal] keeps the side the normal points to
  push(c, r, a, col, clip, clip2, band = 0) {
    if (this.n >= this.max || r <= 0.001 || a <= 0.002) return;
    const m = this.items[this.n++], u = m.material.uniforms;
    m.visible = true; m.position.copy(c); m.scale.setScalar(r);
    u.uA.value = a; u.uR.value = r; u.uCol.value.set(col || '#62f3ff'); u.uBand.value = band;
    if (clip) { u.uClip.value = 1; u.uClipP.value.copy(clip[0]); u.uClipN.value.copy(clip[1]); } else u.uClip.value = 0;
    if (clip2) { u.uClip2.value = 1; u.uClip2P.value.copy(clip2[0]); u.uClip2N.value.copy(clip2[1]); } else u.uClip2.value = 0;
  }
  end() { for (let i = this.n; i < this.max; i++) this.items[i].visible = false; }
  // one click in a room: the outgoing shell + the reflected shell from each wall's image source.
  // walls: [{ p: point on the plane, n: unit normal pointing INTO the room, refl }]; T: pulse clock; speed visual m/s
  click(o, T, walls, opt = {}) {
    const age = T - o.t; if (age <= 0) return;
    const speed = opt.speed || o.speed || 3, R = speed * age, life = opt.life || 2.2;
    const fade = 1 - MathX.smooth(age, life * 0.55, life), a0 = (opt.a ?? 0.9) * fade;
    this.push(o.p, R, a0 * Math.exp(-R * 0.12), opt.col || '#9ff6ff', null, null, opt.band || 0);
    for (const W of walls) {
      const dist = o.p.clone().sub(W.p).dot(W.n);         // source's distance from the wall (> 0 inside)
      if (dist <= 0 || R < dist) continue;
      const img = o.p.clone().addScaledVector(W.n, -2 * dist);
      this.push(img, R, a0 * (W.refl ?? 0.7) * Math.exp(-R * 0.15), W.col || opt.ecol || '#62f3ff', [W.p, W.n], W.clip2 || null, opt.band || 0);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// RINGS: camera-facing ripples (sound sources: direction + rhythm, no geometry). One instance per ring.
// ---------------------------------------------------------------------------------------------------------------------
class BeRings {
  constructor(scene, max = 64, depthTest = true) {
    this.max = max;
    const base = new THREE.InstancedBufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    base.setIndex([0, 1, 2, 0, 2, 3]);
    this.aP = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);   // xyz, radius
    this.aC = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);   // rgb, alpha
    this.aW = new THREE.InstancedBufferAttribute(new Float32Array(max * 2), 2).setUsage(THREE.DynamicDrawUsage);   // thickness (rel), squash
    base.setAttribute('aP', this.aP); base.setAttribute('aC', this.aC); base.setAttribute('aW', this.aW);
    base.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec4 aP, aC; attribute vec2 aW; varying vec2 vQ; varying vec4 vC; varying float vTh;
        void main(){ vec4 mv = viewMatrix * vec4(aP.xyz, 1.0); mv.xy += position.xy * aP.w * vec2(1.0, aW.y); vQ = position.xy; vC = aC; vTh = aW.x;
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        varying vec2 vQ; varying vec4 vC; varying float vTh;
        void main(){ float d = length(vQ); float w = max(vTh, fwidth(d) * 1.5);
          float ring = exp(-pow((d - 0.86) / w, 2.0)) + 0.18 * exp(-pow(d / 0.5, 2.0)) * vTh * 4.0;
          if (d > 1.0) discard; gl_FragColor = vec4(vC.rgb * ring * vC.a, 1.0); }`,
    });
    this.mesh = new THREE.Mesh(base, mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 7; this.mesh.userData.beSkip = true;
    scene.add(this.mesh); this.geo = base; this.n = 0; this._c = new THREE.Color();
  }
  begin() { this.n = 0; }
  push(p, r, a, col, th = 0.06, squash = 1) {
    if (this.n >= this.max || a <= 0.003 || r <= 0) return;
    const i = this.n++; this._c.set(col);
    this.aP.array.set([p.x, p.y, p.z, r / 0.86], i * 4);
    this.aC.array.set([this._c.r, this._c.g, this._c.b, a], i * 4);
    this.aW.array.set([th, squash], i * 2);
  }
  // a source that emits at the given times: each emission is a ring growing to rMax over dur
  source(p, times, T, o = {}) {
    const dur = o.dur || 1.2, rMax = o.r || 0.35;
    for (const t0 of times) {
      const u = (T - t0) / dur; if (u < 0 || u > 1) continue;
      this.push(p, rMax * (0.15 + 0.85 * Ease.outCubic(u)), (o.a ?? 0.8) * Math.pow(1 - u, 1.6) * Math.min(1, u * 12), o.col || '#ffb05a', o.th || 0.07, o.squash || 1);
    }
  }
  end() { this.geo.instanceCount = this.n; this.aP.needsUpdate = this.aC.needsUpdate = this.aW.needsUpdate = true; }
}

// times of a periodic emitter between a and b (every `every` s, with a seeded jitter)
function beEvery(a, b, every, jit = 0, seed = 1) {
  const out = []; let i = 0;
  for (let t = a; t < b; t += every) out.push(t + jit * (hash1(seed * 977 + i++) - 0.5));
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// SLICE: the wavefronts drawn as rings on one horizontal plane inside a rectangular room (a plan-view diagram of the
// sound: the outgoing front and its first reflections from each wall's image source). Used for overhead shots, where
// 3D shells would read as sheets.
// ---------------------------------------------------------------------------------------------------------------------
class BeSlice {
  constructor(scene, x0, x1, z0, z1, y = 0.9, max = 8) {
    this.max = max; this.y = y;
    this.u = {
      uC: { value: Array.from({ length: max }, () => new THREE.Vector4()) },   // cx, cz, R, alpha
      uK: { value: Array.from({ length: max }, () => new THREE.Vector4()) },   // width, colour mix (0 cyan … 1 violet), -, -
      uA: { value: new THREE.Color('#8ff4ff') }, uB: { value: new THREE.Color('#8a6cff') }, uBox: { value: new THREE.Vector4(x0, x1, z0, z1) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */`
        uniform vec4 uC[${max}]; uniform vec4 uK[${max}]; uniform vec3 uA, uB; uniform vec4 uBox; varying vec3 vW;
        void main(){
          vec2 p = vW.xz; vec3 acc = vec3(0.0);
          float inside = step(uBox.x, p.x) * step(p.x, uBox.y) * step(uBox.z, p.y) * step(p.y, uBox.w);
          for (int i = 0; i < ${max}; i++) {
            vec4 c = uC[i]; if (c.w <= 0.0) continue;
            float d = length(p - c.xy), w = uK[i].x, e = (d - c.z) / w;
            float ring = exp(-e * e) + 0.35 * exp(-pow((d - c.z + 3.0 * w) / (1.6 * w), 2.0));   // a front with a soft wake behind it
            float dash = 0.75 + 0.25 * sin(atan(p.y - c.y, p.x - c.x) * 90.0);
            acc += mix(uA, uB, uK[i].y) * ring * dash * c.w;
          }
          gl_FragColor = vec4(acc * inside, 1.0);
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
    this.mesh.rotation.x = -Math.PI / 2; this.mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    this.mesh.renderOrder = 8; this.mesh.frustumCulled = false; this.mesh.userData.beSkip = true; this.mesh.visible = false;
    scene.add(this.mesh); this.box = [x0, x1, z0, z1];
  }
  // one click: the outgoing ring + one reflection per wall (image source across each side of the rectangle)
  click(o, T, opt = {}) {
    const age = T - o.t, C = this.u.uC.value, K = this.u.uK.value;
    for (let i = 0; i < this.max; i++) C[i].w = 0;
    if (age <= 0) { this.mesh.visible = false; return; }
    const sp = opt.speed || 3, R = sp * age, life = opt.life || 2.4, a0 = (opt.a ?? 1) * (1 - MathX.smooth(age, life * 0.5, life)) * Math.min(1, age * 20);
    const [x0, x1, z0, z1] = this.box, px = o.p.x, pz = o.p.z, w = opt.w || 0.035;
    const src = [[px, pz, 1, 0], [2 * x0 - px, pz, 0.8, 0.45], [2 * x1 - px, pz, 0.8, 0.45], [px, 2 * z0 - pz, 0.8, 0.45], [px, 2 * z1 - pz, 0.8, 0.45]];
    src.forEach(([cx, cz, k, col], i) => { C[i].set(cx, cz, R, a0 * k * Math.exp(-R * 0.18)); K[i].set(w * (1 + R * 0.12), col, 0, 0); });
    this.mesh.visible = a0 > 0.002;
  }
  hide() { this.mesh.visible = false; }
}
