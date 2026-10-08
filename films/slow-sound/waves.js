/* =====================================================================
   WAVES — what the slower sound does that you can SEE (pure functions of story time):
     · SndRipples  thin rings on the grass where each sound front is: the gun's bang running down the start line,
                   the five loudspeakers, the whistle, the kick, the supersonic ball (its rings pile up into a V:
                   the Mach cone), every drum beat
     · SndFrontLine the thunder's front where it meets the world: a thin bright line on the ground, the roofs and
                   the steps, and a brief glow on everything it has just passed (buildings, the far stand, the fans)
     · SndShells   the same fronts in the air: faint, glassy spheres growing at 34.3 m/s from each source (a bright
                   rim where you look along the shell), so you can watch a bang travel down the line, over the stand,
                   or the thunder's front (a sheet of glass with a crisp top edge) come over the city toward you
     · SndPuffs    the starting gun's smoke
     · SndBirds    flocks on the city's roofs and pigeons on the far stand, lifting off as the thunder reaches them
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
    for (let k = 0; k < P.drum.n; k++) E.push([P.drum.x, P.drum.z, P.drum.t0 + k * P.drum.period, P.drum.y + 0.8, k % 4 ? 0.6 : 2.0, 4.4, 0.3, 4]);   // (the accented beats bright)
    this.E = E;
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
    // (the thunder's front on the grass is drawn by SndFrontLine, with everything else it crosses)
    A.sort((a, b) => b[4] - a[4]);
    const n = Math.min(this.MAX, A.length);
    for (let i = 0; i < n; i++) { U.uE.value[i].set(A[i][0], A[i][1], A[i][2], A[i][3]); U.uS.value[i] = A[i][4]; }
    U.uN.value = n;
    if (fog) { U.uFogColor.value.copy(fog.color); U.uFogDensity.value = fog.density; }
  }
}

/* the thunder's front where it meets the world: a thin bright line where it cuts the ground, the roofs and the treads
   (a few pixels wide at any distance and any lens), and a brief glow on everything it has just passed (walls, faces,
   fans), so you can watch it come over the city building by building, down the far stand, across the pitch and up the
   rows to you. The uniforms are shared by every patched material (the stadium's, below, and the crowd's, crowd.js). */
const SND_TH = { uThO: { value: new THREE.Vector3(SND_BOLT.x, 0, SND_BOLT.z) }, uThR: { value: 0 }, uThK: { value: 0 }, uThPx: { value: 0.001 } };
const SND_TH_GLSL = {
  decl: 'uniform vec3 uThO; uniform float uThR, uThK, uThPx;',
  // (w: the world position; up: how much the surface faces up (its line is widened against foreshortening); glow: the
  //  glow's strength on what the front has just passed, an expression that may use the distance from the eye, thD)
  frag: (w, up, glow) => `if (uThK > 0.0) {
      vec3 thV = cameraPosition - ${w}; float thD = length(thV), thF = max(0.1, mix(1.0, abs(thV.y) / thD, ${up}));
      float thW = max(0.05, thD * uThPx / thF), thE = length(${w} - uThO) - uThR;
      float thL = exp(-thE * thE / (thW * thW)), thB = step(thE, 0.0) * exp(min(thE, 0.0) / 16.0);
      totalEmissiveRadiance += uThK * vec3(0.8, 0.9, 1.0) * (1.4 * thL + (${glow}) * thB);
    }`,
};
class SndFrontLine {
  constructor(scene) {
    // every material Look gave its world-space grime (so it already carries the world position, vGrimeW)
    this.n = 0;
    scene.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || m.userData.grime === undefined || m.userData.sndTh) continue;
        m.userData.sndTh = true; this.n++;
        const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
        m.onBeforeCompile = (sh, r) => {
          prev.call(m, sh, r);
          Object.assign(sh.uniforms, SND_TH);
          sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', '#include <common>\n' + SND_TH_GLSL.decl)
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + SND_TH_GLSL.frag('vGrimeW', 'vGrimeUp', '0.5 * (1.0 - 0.75 * vGrimeUp) * smoothstep(6.0, 40.0, thD)'));
        };
        m.customProgramCacheKey = () => key.call(m) + '|sndTh';
        m.needsUpdate = true;
      }
    });
  }
  update(t, camera) {
    // through the whole last shot, until the front is past you
    SND_TH.uThK.value = MathX.window(t, SND.cuts[4] + 0.6, SND.heard.thunder + 1.0, 1.6, 0.6);
    SND_TH.uThR.value = SND_RUN(SND.flash.t, t);
    SND_TH.uThPx.value = 2 * Math.tan(MathX.deg(camera.fov) / 2) * (2.6 / 1920);   // (a half-width of ~2.6 px on 1080×1920)
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
    for (let te = P.kick.t + 0.02; te < SND_BALL.tGoal; te += 0.1) { const b = sndBall(te); E.push([b.x, b.y, b.z, te, te < SND_BALL.tMach1 + 0.03 ? 0.5 : 0.2, 0.6, 3]); }
    for (let k = 0; k < P.drum.n; k++) E.push([P.drum.x, P.drum.y + 1.0, P.drum.z, P.drum.t0 + k * P.drum.period, k % 4 ? 0.14 : 0.5, 3.3, 4]);
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
        float a = vS * uK * (0.03 + 1.0 * pow(f, 5.0));   // (one face; a faint body, the rim carries the dome)
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
    this.thunderMat = new THREE.ShaderMaterial({ uniforms: { uFogDensity: U.uFogDensity, uK: { value: 1 }, uThPx: SND_TH.uThPx }, vertexShader: vs,
      fragmentShader: /* glsl */`
        uniform float uFogDensity, uK, uThPx; varying vec3 vW, vC; varying float vS, vDepth;
        void main(){
          if (vW.y < 0.02) discard;
          vec3 N = normalize(vW - vC), V = normalize(cameraPosition - vW);
          float f = 1.0 - abs(dot(N, V));
          // drawn as a sheet of glass 45 m tall moving toward you: a very faint body brightening up to a crisp top edge
          // (a few pixels wide at any distance); where it meets the ground and the buildings, SndFrontLine draws the line
          float y = vW.y, body = 1.0 - smoothstep(43.0, 44.6, y), hw = max(0.08, vDepth * uThPx);
          float edge = exp(-pow((y - 44.6) / hw, 2.0)), glow = body * exp((y - 44.6) / 7.0);
          float a = uK * (0.018 * body + 0.06 * glow + 0.7 * edge + 0.35 * pow(f, 5.0) * body);
          a *= exp(-uFogDensity * vDepth * 0.5) * smoothstep(3.0, 14.0, vDepth);
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
    // the thunder's front: through the whole last shot (over the city, the far stand, the pitch) until it is past you
    const k = MathX.window(t, SND.cuts[4] + 0.6, SND.heard.thunder + 1.0, 1.6, 0.6);
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
    // two sprite sheets of a bird's silhouette (wings up / wings down): a flap is a swap between them
    this.up = new BillboardSystem(scene, 700); this.dn = new BillboardSystem(scene, 700);
    this.up.uniforms.uMap.value = SndBirds.tex(true); this.dn.uniforms.uMap.value = SndBirds.tex(false);
    this.up.mesh.renderOrder = this.dn.mesh.renderOrder = 5;          // (after the thunder's curtain: dark against it)
    const E = SND_EYE[5], wallEl = Math.atan2(12.4 - E.y, E.z + 60.5);
    const view = Math.atan2(-4 - E.x, -(-42 - E.z));
    // (a roof counts only if its flock, 10 m up, shows over the far stand AND over every nearer block)
    const az = (b) => Math.atan2(b.x - E.x, -(b.z - E.z)), dist = (b) => Math.hypot(b.x - E.x, b.z - E.z);
    const hidden = (b, el) => (city || []).some((c) => c !== b && dist(c) < dist(b) - 2 && Math.abs(az(c) - az(b)) < Math.atan2(0.6 * Math.max(c.w, c.d), dist(c)) && Math.atan2(c.h - E.y, dist(c)) > el - 0.002);
    const roofs = (city || []).filter((b) => {
      if (b.z > -140) return false;
      const el = Math.atan2(b.h + 10 - E.y, dist(b));
      return Math.abs(az(b) - view) < 0.26 && el > wallEl + 0.006 && sndThunderAt(b) > SND.cuts[4] + 1.6 && !hidden(b, el);
    }).sort((a, b) => sndThunderAt(a) - sndThunderAt(b)).slice(0, 14);
    this.B = [];
    roofs.forEach((b, fi) => {
      const tl = sndThunderAt(b) + 0.15, n = 30 + Math.floor(hash1(fi * 7) * 16);
      for (let i = 0; i < n; i++) {
        const sd = fi * 100 + i, a = hash1(sd) * 6.28;
        this.B.push({ x: b.x + (hash1(sd * 3) - 0.5) * b.w * 0.8, z: b.z + (hash1(sd * 5) - 0.5) * b.d * 0.8, y: b.h + 0.4, tl: tl + hash1(sd * 7) * 0.25,
          vx: Math.cos(a) * (3 + 3 * hash1(sd * 11)), vz: Math.sin(a) * (3 + 3 * hash1(sd * 11)) + 2.5, vy: 5 + 4 * hash1(sd * 13), ph: hash1(sd * 17) * 6.28, sz: 4.2 + 2.4 * hash1(sd * 19) });   // drawn ~5× a gull: 200–400 m away they must read on a phone
      }
    });
    // pigeons sitting along the top of the far stand's back wall, in clumps: they go up as the front reaches them, just
    // before the back rows duck (110 m away, in the frame while the lens is on the far stand)
    for (let c = 0; c < 7; c++) {
      const cx = -25 + c * 6.5 + (hash1(c * 41) - 0.5) * 3, n = 4 + Math.floor(hash1(c * 43) * 6);
      for (let i = 0; i < n; i++) {
        const sd = 9000 + c * 20 + i, P = { x: cx + (hash1(sd) - 0.5) * 2.4, y: 12.52, z: -59.42 }, a = hash1(sd * 3) * 6.28;
        this.B.push({ x: P.x, y: P.y, z: P.z, tl: sndThunderAt(P) + 0.06 + hash1(sd * 7) * 0.22, vx: Math.cos(a) * 2.2, vz: -1.2 - 2.2 * hash1(sd * 11), vy: 3.2 + 2.6 * hash1(sd * 13),
          ph: hash1(sd * 17) * 6.28, sz: 1.0 + 0.3 * hash1(sd * 19), sit: 0.62 });
      }
    }
  }
  static tex(up) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    if (up) { g.moveTo(5, 16); g.quadraticCurveTo(20, 20, 32, 36); g.quadraticCurveTo(44, 20, 59, 16); }
    else { g.moveTo(5, 44); g.quadraticCurveTo(18, 30, 32, 35); g.quadraticCurveTo(46, 30, 59, 44); }
    g.stroke();
    g.beginPath(); g.ellipse(32, 35, 5, 4, 0, 0, 6.283); g.fill();
    const tx = new THREE.CanvasTexture(c); tx.needsUpdate = true;
    return tx;
  }
  update(t, fog) {
    const U = this.up, D = this.dn;
    U.begin(fog); D.begin(fog);
    U.uniforms.uFogDensity.value *= 0.35; D.uniforms.uFogDensity.value *= 0.35;   // (dark silhouettes, 200–400 m away)
    if (sndShotAt(t) === 5) for (const b of this.B) {
      const u = t - b.tl;
      if (u < 0) { D.push(b.x, b.y + (b.sit ? b.sz * 0.12 : 0), b.z, b.sz * (b.sit || 0.5), 0, 0.8, 1.0, 0.14, 0.14, 0.15); continue; }
      if (u > 9) continue;
      const k = 1 - Math.exp(-u / 1.4), S = Math.sin(u * 14 + b.ph) > 0 ? U : D;
      S.push(b.x + b.vx * 1.6 * k + b.vx * 0.3 * u, b.y + b.vy * 1.6 * k + 0.8 * u, b.z + b.vz * 1.6 * k + b.vz * 0.3 * u, b.sz, 0, 0.95, 1.0, 0.12, 0.12, 0.13);
    }
    U.end(); D.end();
  }
}
