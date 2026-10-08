/* =====================================================================
   WAVES — what the slower sound does that you can SEE (pure functions of story time):
     · SndRipples  thin rings on the grass where each sound front is: the gun's bang running down the start line,
                   the five loudspeakers, the whistle, the kick, the supersonic ball (its rings pile up into a V:
                   the Mach cone), every drum beat, and the thunder's front crossing the whole stadium
     · SndShells   the same fronts in the air: faint, glassy spheres growing at 34.3 m/s from each source (a bright
                   rim where you look along the shell), so you can watch a bang travel down the line, over the stand,
                   or the thunder's front come across the stadium toward you
     · SndPuffs    the starting gun's smoke
   Every time comes from script.js: the picture and the sound agree by construction.
   ===================================================================== */

class SndRipples {
  constructor(scene) {
    const MAX = 64;
    this.MAX = MAX;
    // [x, z, te, height of the source above the grass, strength, life, base width (m), the shot it belongs to]
    // (a front is drawn only in its own shot: nothing carries across a cut)
    const E = [], P = SND;
    E.push([P.gun.x, P.gun.z, P.gun.bang, P.gun.y, 3.4, 2.9, 0.6, 0]);
    for (const s of P.pa.speakers) E.push([s.x, s.z, P.pa.speak, s.y, 2.4, 4.2, 0.6, 2]);
    E.push([P.whistle.x, P.whistle.z, P.whistle.t, P.whistle.y, 3.2, 2.4, 0.3, 3]);
    E.push([P.kick.x, P.kick.z, P.kick.t, 0.15, 3.4, 1.6, 0.25, 3]);
    for (let te = P.kick.t + 0.005; te < SND_BALL.tGoal; te += 0.03) { const b = sndBall(te); E.push([b.x, b.z, te, b.y, te < SND_BALL.tMach1 ? 2.4 : 1.2, 0.6, 0.12, 3]); }
    for (let k = 0; k < P.drum.n; k++) E.push([P.drum.x, P.drum.z, P.drum.t0 + k * P.drum.period, P.drum.y + 0.8, 1.5, 4.4, 0.3, 4]);
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
    const U = this.uniforms, A = [], shot = sndShotAt(t);
    for (const e of this.E) {
      const age = t - e[2];
      if (age < 0 || age > e[5] || e[7] !== shot) continue;
      const r = SND_RUN(e[2], t), rg2 = r * r - e[3] * e[3];
      if (rg2 <= 0) continue;
      const fade = MathX.smooth(age, 0, 0.1) * (1 - MathX.smooth(age, e[5] * 0.65, e[5]));
      A.push([e[0], e[1], Math.sqrt(rg2), e[6] + 0.004 * r, e[4] * fade]);
    }
    // the thunder's front: a ring 1.7 km across, so on the pitch it is an almost straight line sweeping toward you
    // (bold: a bright leading line with a broad glow behind it)
    { const [x, z, te] = this.thunder, k = MathX.window(t, SND.heard.thunder - 3.8, SND.heard.thunder + 0.8, 0.6, 0.5);
      if (k > 0) { const r = SND_RUN(te, t); A.push([x, z, r, 0.9, 7.0 * k]); A.push([x, z, r - 2.2, 2.4, 2.2 * k]); A.push([x, z, r - 7.0, 5.0, 0.8 * k]); } }
    A.sort((a, b) => b[4] - a[4]);
    const n = Math.min(this.MAX, A.length);
    for (let i = 0; i < n; i++) { U.uE.value[i].set(A[i][0], A[i][1], A[i][2], A[i][3]); U.uS.value[i] = A[i][4]; }
    U.uN.value = n;
    if (fog) { U.uFogColor.value.copy(fog.color); U.uFogDensity.value = fog.density; }
  }
}

/* the fronts in the air: one instanced sphere per live front (radius = distance the sound has run), and one big
   finely-divided sphere for the thunder (its centre 1.9 km away, so near the stadium it is a wall moving toward you) */
class SndShells {
  constructor(scene) {
    const P = SND, E = [];
    // [x, y, z, te, strength, life, the shot it belongs to]
    E.push([P.gun.x, P.gun.y, P.gun.z, P.gun.bang, 1.0, 2.9, 0]);
    for (const s of P.pa.speakers) E.push([s.x, s.y, s.z, P.pa.speak, 0.55, 3.6, 2]);
    E.push([P.whistle.x, P.whistle.y + 0.1, P.whistle.z, P.whistle.t, 0.9, 2.2, 3]);
    E.push([P.kick.x, 0.15, P.kick.z, P.kick.t, 0.9, 1.4, 3]);
    for (let te = P.kick.t + 0.02; te < SND_BALL.tGoal; te += 0.06) { const b = sndBall(te); E.push([b.x, b.y, b.z, te, te < SND_BALL.tMach1 + 0.03 ? 0.6 : 0.3, 0.6, 3]); }
    for (let k = 0; k < P.drum.n; k++) E.push([P.drum.x, P.drum.y + 1.0, P.drum.z, P.drum.t0 + k * P.drum.period, 0.42, 3.3, 4]);
    this.E = E;
    this.MAX = 12;
    const U = this.uniforms = { uFogDensity: { value: 0 } };
    const vs = /* glsl */`
      attribute float aS; varying vec3 vW, vC; varying float vS, vDepth;
      void main(){
        #ifdef USE_INSTANCING
          mat4 m = modelMatrix * instanceMatrix;
        #else
          mat4 m = modelMatrix;
        #endif
        vec4 w = m * vec4(position, 1.0); vW = w.xyz; vC = (m * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #ifdef USE_INSTANCING
          vS = aS;
        #else
          vS = 1.0;
        #endif
        vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
    const fs = /* glsl */`
      uniform float uFogDensity, uK; varying vec3 vW, vC; varying float vS, vDepth;
      void main(){
        if (vW.y < 0.02) discard;
        vec3 N = normalize(vW - vC), V = normalize(cameraPosition - vW);
        float f = 1.0 - abs(dot(N, V));
        float a = vS * uK * (0.06 + 1.0 * pow(f, 5.0));   // (one face now, so twice the old two-face strength)
        a *= exp(-uFogDensity * vDepth) * smoothstep(1.0, 9.0, vDepth);
        gl_FragColor = vec4(vec3(0.88, 0.94, 1.0) * a, 1.0);
      }`;
    const mk = () => new THREE.ShaderMaterial({ uniforms: { uFogDensity: U.uFogDensity, uK: { value: 1 } }, vertexShader: vs, fragmentShader: fs,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide });   // (the near half only: half the fill)
    const g = new THREE.SphereGeometry(1, 64, 32);
    this.aS = new THREE.InstancedBufferAttribute(new Float32Array(this.MAX), 1);
    g.setAttribute('aS', this.aS);
    this.mesh = new THREE.InstancedMesh(g, mk(), this.MAX);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 4; this.mesh.count = 0;
    scene.add(this.mesh);
    // the thunder's front: a curtain of air, brightest near the ground, with a bright rim where you look along it
    this.thunderMat = new THREE.ShaderMaterial({ uniforms: { uFogDensity: U.uFogDensity, uK: { value: 1 } }, vertexShader: vs,
      fragmentShader: /* glsl */`
        uniform float uFogDensity, uK; varying vec3 vW, vC; varying float vS, vDepth;
        void main(){
          if (vW.y < 0.02) discard;
          vec3 N = normalize(vW - vC), V = normalize(cameraPosition - vW);
          float f = 1.0 - abs(dot(N, V));
          float wall = exp(-vW.y / 24.0) * (0.8 + 0.2 * sin(vW.y * 0.7 + dot(vW.xz, vec2(0.21, 0.13))));
          float a = uK * (0.2 * wall + 0.06 + 0.9 * pow(f, 5.0));
          a *= exp(-uFogDensity * vDepth) * smoothstep(3.0, 14.0, vDepth);
          gl_FragColor = vec4(vec3(0.86, 0.92, 1.0) * a, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide });
    this.thunder = new THREE.Mesh(new THREE.SphereGeometry(1, 320, 160), this.thunderMat);
    this.thunder.position.set(SND_BOLT.x, 0, SND_BOLT.z);
    this.thunder.frustumCulled = false; this.thunder.renderOrder = 4; this.thunder.visible = false;
    scene.add(this.thunder);
    this._m = new THREE.Matrix4();
  }

  update(t, fog) {
    const A = [], shot = sndShotAt(t);
    for (const e of this.E) {
      const age = t - e[3];
      if (age <= 0 || age > e[5] || e[6] !== shot) continue;
      const r = SND_RUN(e[3], t);
      if (r < 0.3) continue;
      A.push([e[0], e[1], e[2], r, e[4] * MathX.smooth(age, 0, 0.12) * (1 - MathX.smooth(age, e[5] * 0.6, e[5]))]);
    }
    A.sort((a, b) => b[4] - a[4]);
    const n = Math.min(this.MAX, A.length);
    for (let i = 0; i < n; i++) {
      const [x, y, z, r, s] = A[i];
      this._m.makeScale(r, r, r).setPosition(x, y, z);
      this.mesh.setMatrixAt(i, this._m); this.aS.array[i] = s;
    }
    this.mesh.count = n; this.mesh.instanceMatrix.needsUpdate = true; this.aS.needsUpdate = true;
    // the thunder's front: from a little before it reaches the far stand until it is past you
    const k = MathX.window(t, SND.heard.thunder - 9.5, SND.heard.thunder + 1.0, 1.5, 0.6);
    this.thunder.visible = k > 0.001;
    if (k > 0) { const r = SND_RUN(SND.flash.t, t); this.thunder.scale.set(r, r, r); this.thunderMat.uniforms.uK.value = 1.15 * k; }
    if (fog) this.uniforms.uFogDensity.value = fog.density;
  }
}

/* the starting gun's smoke: a quick white puff that rises and spreads */
class SndPuffs {
  constructor(scene) {
    this.sys = new BillboardSystem(scene, 64);
    const P = [], G = SND.gun;
    for (let k = 0; k < 14; k++) P.push([G.x + 0.35 + (hash1(k) - 0.5) * 0.3, G.y + 0.12 + hash1(k * 3) * 0.2, G.z + (hash1(k * 5) - 0.5) * 0.3, G.bang + k * 0.006, 0.22 + hash1(k * 7) * 0.16, 0.42, 2.4, k]);
    this.P = P;
  }
  update(t, fog) {
    const B = this.sys;
    B.begin(fog);
    for (const p of this.P) {
      const u = t - p[3];
      if (u < 0 || u > p[6]) continue;
      const k = u / p[6], grow = 1 - Math.exp(-u * 3), sd = p[7];
      B.push(p[0] + (hash1(sd * 11) - 0.5) * u * 0.8, p[1] + u * 0.45, p[2] + u * 0.25, p[4] * (0.4 + 2.0 * grow), hash1(sd) * 6.28, p[5] * MathX.smooth(u, 0, 0.04) * (1 - k) * (1 - k), 1.1, 0.86, 0.86, 0.84);
    }
    B.end();
  }
}

/* the birds on the city's roofs beyond the far stand: each flock takes off when the thunder's front reaches its roof
   (they hear it), so you can watch the front come over the city toward the stadium */
class SndBirds {
  constructor(scene, city) {
    this.sys = new BillboardSystem(scene, 400);
    const E = SND_EYE[5], wallEl = Math.atan2(12.4 - E.y, E.z + 60.5);
    const view = Math.atan2(-4 - E.x, -(-42 - E.z));
    const roofs = (city || []).filter((b) => {
      if (b.z > -140) return false;
      const az = Math.atan2(b.x - E.x, -(b.z - E.z)), el = Math.atan2(b.h + 4 - E.y, Math.hypot(b.x - E.x, b.z - E.z));
      return Math.abs(az - view) < 0.24 && el > wallEl + 0.006 && sndThunderAt(b) > SND.cuts[4] + 2.5;
    }).sort((a, b) => sndThunderAt(a) - sndThunderAt(b)).slice(0, 9);
    this.B = [];
    roofs.forEach((b, fi) => {
      const tl = sndThunderAt(b) + 0.15, n = 22 + Math.floor(hash1(fi * 7) * 12);
      for (let i = 0; i < n; i++) {
        const sd = fi * 100 + i, a = hash1(sd) * 6.28;
        this.B.push({ x: b.x + (hash1(sd * 3) - 0.5) * b.w * 0.8, z: b.z + (hash1(sd * 5) - 0.5) * b.d * 0.8, y: b.h + 0.4, tl: tl + hash1(sd * 7) * 0.25,
          vx: Math.cos(a) * (3 + 3 * hash1(sd * 11)), vz: Math.sin(a) * (3 + 3 * hash1(sd * 11)) + 2.5, vy: 5 + 4 * hash1(sd * 13), ph: hash1(sd * 17) * 6.28, sz: 0.9 + 0.5 * hash1(sd * 19) });
      }
    });
  }
  update(t, fog) {
    const S = this.sys;
    S.begin(fog);
    if (sndShotAt(t) === 5) for (const b of this.B) {
      const u = t - b.tl;
      if (u < 0) { S.push(b.x, b.y, b.z, b.sz * 0.6, 0, 0.8, 1.0, 0.14, 0.14, 0.15); continue; }
      if (u > 9) continue;
      const k = 1 - Math.exp(-u / 1.4), flap = 0.7 + 0.3 * Math.abs(Math.sin(u * 14 + b.ph));
      S.push(b.x + b.vx * 1.6 * k + b.vx * 0.3 * u, b.y + b.vy * 1.6 * k + 0.8 * u, b.z + b.vz * 1.6 * k + b.vz * 0.3 * u, b.sz * flap, 0, 0.92, 1.0, 0.12, 0.12, 0.13);
    }
    S.end();
  }
}
