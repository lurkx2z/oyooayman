/* =====================================================================
   WAVES — what the slower sound does that you can SEE (pure functions of story time):
     · SndRipples  thin rings on the grass where each sound front is: the gun's bang running down the start line,
                   the five loudspeakers, the whistle, the kick, the supersonic ball (its rings pile up into a V:
                   the Mach cone), every drum beat, and the thunder's front crossing the whole stadium
     · SndPuffs    the starting gun's smoke
   Every time comes from script.js: the picture and the sound agree by construction.
   ===================================================================== */

class SndRipples {
  constructor(scene) {
    const MAX = 64;
    this.MAX = MAX;
    // [x, z, te, height of the source above the grass, strength, life]
    const E = [], P = SND;
    E.push([P.gun.x, P.gun.z, P.gun.bang, P.gun.y, 3.4, 2.7]);
    for (const s of P.pa.speakers) E.push([s.x, s.z, P.pa.speak, s.y, 2.4, 4.2]);
    E.push([P.whistle.x, P.whistle.z, P.whistle.t, P.whistle.y, 2.6, 1.7]);
    E.push([P.kick.x, P.kick.z, P.kick.t, 0.15, 2.8, 1.3]);
    for (let te = P.kick.t + 0.005; te < SND_BALL.tGoal; te += 0.022) { const b = sndBall(te); E.push([b.x, b.z, te, b.y, 1.1, 0.5]); }
    for (let k = 0; k < P.drum.n; k++) E.push([P.drum.x, P.drum.z, P.drum.t0 + k * P.drum.period, P.drum.y + 0.8, 1.5, 4.4]);
    this.E = E;
    this.thunder = [SND_BOLT.x, SND_BOLT.z, P.flash.t];
    const U = this.uniforms = {
      uE: { value: Array.from({ length: MAX }, () => new THREE.Vector4()) },     // x, z, ground radius, width
      uS: { value: new Float32Array(MAX) },                                       // strength
      uN: { value: 0 },
      uFogColor: { value: new THREE.Color() }, uFogDensity: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: /* glsl */`
        varying vec3 vW; varying float vDepth;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        #define MAXE ${MAX}
        uniform vec4 uE[MAXE]; uniform float uS[MAXE]; uniform int uN;
        uniform vec3 uFogColor; uniform float uFogDensity;
        varying vec3 vW; varying float vDepth;
        // a crisp ring line (at least ~1.5 px wide; thinner than that on screen it dims instead of smearing into a glare band)
        float ring(float x, float w, float aa){ float W = max(w, aa * 1.5), k = min(1.0, 1.6 * w / W); return k * (exp(-(x / W) * (x / W)) + 0.25 * exp(-((x + 3.0 * W) / W) * ((x + 3.0 * W) / W))); }
        void main(){
          float a = 0.0;
          for (int i = 0; i < MAXE; i++) {
            if (i >= uN) break;
            vec4 e = uE[i];
            float d = length(vW.xz - e.xy);
            a += uS[i] * ring(d - e.z, e.w, fwidth(d));
          }
          float fog = 1.0 - exp(-uFogDensity * vDepth);
          a *= (1.0 - fog) * smoothstep(1.5, 6.0, vDepth);
          gl_FragColor = vec4(vec3(0.95, 0.97, 1.0) * a * 0.17, 1.0);
        }`,
    });
    const g = new THREE.PlaneGeometry(122, 82, 1, 1); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat); m.position.set(0, 0.014, 0); m.renderOrder = 3; m.frustumCulled = false;
    scene.add(m); this.mesh = m;
  }

  update(t, fog) {
    const U = this.uniforms, A = [];
    for (const e of this.E) {
      const age = t - e[2];
      if (age < 0 || age > e[5]) continue;
      const r = SND_RUN(e[2], t), rg2 = r * r - e[3] * e[3];
      if (rg2 <= 0) continue;
      const fade = MathX.smooth(age, 0, 0.1) * (1 - MathX.smooth(age, e[5] * 0.65, e[5]));
      A.push([e[0], e[1], Math.sqrt(rg2), 0.09 + 0.0015 * r, e[4] * fade]);
    }
    // the thunder's front: a ring 1.9 km across, so on the pitch it is an almost straight line sweeping toward you
    { const [x, z, te] = this.thunder, k = MathX.window(t, 55.6, 60.2, 0.6, 0.5);
      if (k > 0) { A.push([x, z, SND_RUN(te, t), 0.5, 2.6 * k]); A.push([x, z, SND_RUN(te, t) - 1.6, 0.9, 0.9 * k]); } }
    A.sort((a, b) => b[4] - a[4]);
    const n = Math.min(this.MAX, A.length);
    for (let i = 0; i < n; i++) { U.uE.value[i].set(A[i][0], A[i][1], A[i][2], A[i][3]); U.uS.value[i] = A[i][4]; }
    U.uN.value = n;
    if (fog) { U.uFogColor.value.copy(fog.color); U.uFogDensity.value = fog.density; }
  }
}

/* the starting gun's smoke: a quick white puff that rises and spreads */
class SndPuffs {
  constructor(scene) {
    this.sys = new BillboardSystem(scene, 64);
    const P = [], G = SND.gun;
    for (let k = 0; k < 14; k++) P.push([G.x + 0.35 + (hash1(k) - 0.5) * 0.3, G.y + 0.12 + hash1(k * 3) * 0.2, G.z + (hash1(k * 5) - 0.5) * 0.3, G.bang + k * 0.006, 0.5 + hash1(k * 7) * 0.4, 0.55, 2.8, k]);
    this.P = P;
  }
  update(t, fog) {
    const B = this.sys;
    B.begin(fog);
    for (const p of this.P) {
      const u = t - p[3];
      if (u < 0 || u > p[6]) continue;
      const k = u / p[6], grow = 1 - Math.exp(-u * 3), sd = p[7];
      B.push(p[0] + (hash1(sd * 11) - 0.5) * u * 0.8, p[1] + u * 0.45, p[2] + u * 0.25, p[4] * (0.4 + 2.2 * grow), hash1(sd) * 6.28, p[5] * MathX.smooth(u, 0, 0.04) * (1 - k) * (1 - k), 1.6, 0.95, 0.95, 0.93);
    }
    B.end();
  }
}
