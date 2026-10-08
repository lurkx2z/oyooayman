/* =====================================================================
   WAVES — what the slower sound does that you can SEE (all pure functions of story time):
     · SndRipples  faint ripples on the ground where each sound front is (it travels at 34.3 m/s, so you can
                   watch a clap or a bang come toward you); the V-shaped shock wakes of the supersonic sources
     · SndDust     dust lifted where a shock front sweeps the ground (the car, the airliner, the police car)
     · SndPlaneFx  the airliner fighting its own shock waves: a faint Mach cone, vapour, surging engines, smoke
     · SndGlass    shop windows: the police car's shock bursts the weakest panes (shards fall, glass dust), cracks
                   others; the airliner's deep boom cracks only a few
   Every time comes from script.js (sndArriveFixed, snd*BoomAt): the picture and the sound agree by construction.
   ===================================================================== */

// the distance a sound front made at te has travelled by t (the speed of sound changes under the title)
const SND_RUN = (() => {
  const dt = 1 / 240, n = Math.ceil((CONFIG.duration + 2) / dt), R = new Float32Array(n + 1);
  for (let i = 1; i <= n; i++) R[i] = R[i - 1] + sndC((i - 0.5) * dt) * dt;
  const at = (t) => { const f = MathX.clamp(t / dt, 0, n - 1.001), i = Math.floor(f); return R[i] + (R[i + 1] - R[i]) * (f - i); };
  return (te, t) => at(t) - at(te);
})();

/* -------------------------------------------------------------------------------------------------------------------
   RIPPLES on the ground: point sources (claps, the shout, the pile driver, the siren, the cars) + the shock wakes
   ------------------------------------------------------------------------------------------------------------------- */
class SndRipples {
  constructor(scene) {
    const MAX = 40;
    this.MAX = MAX;
    // [x, z, te, height of the source above the ground, strength, life]
    const E = [], F = SND.friend;
    // (the claps, the shout and the bangs are the ones you are meant to watch travel: bright and long-lived)
    for (const t of F.claps) E.push([F.x, F.z, t, 1.1, 2.6, 1.6]);
    E.push([F.x, F.z, F.shout, 1.5, 3.0, 1.7]);
    for (const t of SND_PILE_HITS) E.push([SND.pile.x, SND.pile.z, t, 0.4, 3.2, 3.4]);
    for (let t = 17.5; t < 25.4; t += 0.3) { const q = sndAmb(t); E.push([q.x, q.z, t, 1.5, 0.9, 1.9]); }
    for (let t = 23.5; t < 37.2; t += 0.22) { const q = sndSport(t); E.push([q.x, q.z, t, q.y - 0.15, 0.5, 3.0]); }
    for (let t = 54.6; t < 60.4; t += 0.16) { const q = sndPolice(t); E.push([q.x, q.z, t, 1.25, 0.45, 1.4]); }
    this.E = E;
    const U = this.uniforms = {
      uE: { value: Array.from({ length: MAX }, () => new THREE.Vector4()) },     // x, z, ground radius, width
      uS: { value: new Float32Array(MAX) },                                       // strength
      uN: { value: 0 },
      uT: { value: 0 }, uC: { value: SND.C1 },
      uPol: { value: new THREE.Vector4(SND.police.x, SND.police.y, SND.police.tc, SND.police.v) },
      uPla: { value: new THREE.Vector4(SND.plane.x, SND.plane.h, SND.plane.tc, SND.plane.v) },
      uPla2: { value: new THREE.Vector4(SND.plane.glide, 0, 0, 0) },
      uSpo: { value: new THREE.Vector4(SND.sport.x, SND.sport.y, SND.sport.tc, SND.sport.v1) },
      uSpo2: { value: new THREE.Vector4(SND.sport.zA, 0, 0, 0) },
      uK: { value: new THREE.Vector3() },                                         // √(M²−1) police, plane, car
      uFront: { value: new THREE.Vector3(1, 1, 1) },                              // wake strengths
      uFogColor: { value: new THREE.Color() }, uFogDensity: { value: 0 },
    };
    const k = (v) => Math.sqrt(Math.max(0, (v / SND.C1) ** 2 - 1));
    U.uK.value.set(k(SND.police.v), k(SND.plane.v), k(SND.sport.v1));
    const mat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: /* glsl */`
        varying vec3 vW; varying float vDepth;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        #define MAXE ${MAX}
        uniform vec4 uE[MAXE]; uniform float uS[MAXE]; uniform int uN; uniform float uT, uC;
        uniform vec4 uPol, uPla, uPla2, uSpo, uSpo2; uniform vec3 uK, uFront;
        uniform vec3 uFogColor; uniform float uFogDensity;
        varying vec3 vW; varying float vDepth;
        float ripple(float x){ return exp(-x * x) + 0.38 * exp(-(x + 2.3) * (x + 2.3)) + 0.14 * exp(-(x + 4.6) * (x + 4.6)); }
        // a shock wake: how far (metres of sound travel) the front has gone past this point; bright at the front
        float wake(float tb, float w){ float f = (uT - tb) * uC; return f < -3.0 * w ? 0.0 : (f < 0.0 ? exp(-(f / w) * (f / w)) : exp(-f / (w * 2.5)) * 0.9 + 0.1 * exp(-f / 12.0)); }
        void main(){
          float a = 0.0;
          for (int i = 0; i < MAXE; i++) {
            if (i >= uN) break;
            vec4 e = uE[i];
            float d = length(vW.xz - e.xy);
            a += uS[i] * ripple((d - e.z) / e.w);
          }
          float h = vW.y + 1.2;
          // police car (straight, level): tb = tc + (z−1)/v + perp·k/v
          if (uFront.x > 0.0) { float tb = uPol.z + (vW.z - 1.0) / uPol.w + length(vec2(vW.x - uPol.x, h - uPol.y)) * uK.x / uPol.w; a += uFront.x * wake(tb, 0.55); }
          // the airliner (3° glide)
          if (uFront.y > 0.0) { float tz = uPla.z + (vW.z - 1.0) / uPla.w, y = uPla.y - uPla2.x * (vW.z - 1.0);
            float tb = tz + length(vec2(vW.x - uPla.x, y - h)) * uK.y / uPla.w + uPla2.y; a += uFront.y * wake(tb, 0.9); }
          // the car (only where it had been supersonic long enough)
          if (uFront.z > 0.0) { float perp = length(vec2(vW.x - uSpo.x, h - uSpo.y)); float run = perp / max(uK.z, 1e-3);
            if (vW.z - run >= uSpo2.x) { float tb = uSpo.z + (vW.z - 1.0) / uSpo.w + perp * uK.z / uSpo.w; a += uFront.z * wake(tb, 0.5); } }
          float fog = 1.0 - exp(-uFogDensity * vDepth);
          a *= (1.0 - fog) * smoothstep(1.5, 6.0, vDepth);
          gl_FragColor = vec4(vec3(0.93, 0.96, 1.0) * a * 0.16, 1.0);
        }`,
    });
    this.mat = mat;
    const h = LAYOUT.curbH;
    const mk = (x0, x1, z0, z1, y) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, 1, 1); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.renderOrder = 3; m.frustumCulled = false; scene.add(m); return m; };
    this.meshes = [mk(-LAYOUT.roadHalf, LAYOUT.roadHalf, -420, 60, 0.012), mk(-40, -LAYOUT.roadHalf, -420, 60, h + 0.012), mk(LAYOUT.roadHalf, 53, -420, 60, h + 0.012)];
  }

  update(t, fog) {
    const U = this.uniforms, A = [];
    for (const e of this.E) {
      const age = t - e[2];
      if (age < 0 || age > e[5]) continue;
      const r = SND_RUN(e[2], t), rg2 = r * r - e[3] * e[3];
      if (rg2 <= 0) continue;
      const fade = MathX.smooth(age, 0, 0.12) * (1 - MathX.smooth(age, e[5] * 0.6, e[5]));
      A.push([e[0], e[1], Math.sqrt(rg2), 0.45 + 0.012 * r, e[4] * fade]);
    }
    A.sort((a, b) => b[4] - a[4]);
    const n = Math.min(this.MAX, A.length);
    for (let i = 0; i < n; i++) { U.uE.value[i].set(A[i][0], A[i][1], A[i][2], A[i][3]); U.uS.value[i] = A[i][4]; }
    U.uN.value = n; U.uT.value = t;
    U.uPla2.value.y = SND.boom.planeFix;
    // the wakes show while their source is near (each shock reaches the whole street within a few seconds)
    // (a shock itself is invisible: only a faint shimmer line where it is — the dust and the glass carry it)
    U.uFront.value.set(
      MathX.window(t, 54.0, 62.5, 0.4, 1.5) * 0.22,
      MathX.window(t, 50.0, 57.0, 0.5, 1.5) * 0.2,
      MathX.window(t, 33.0, 39.0, 0.5, 1.2) * 0.15);
    if (fog) { U.uFogColor.value.copy(fog.color); U.uFogDensity.value = fog.density; }
  }
}

/* -------------------------------------------------------------------------------------------------------------------
   DUST: where a shock front sweeps loose ground, a low puff (each puff: a fixed point, a start time, a life)
   ------------------------------------------------------------------------------------------------------------------- */
class SndDust {
  constructor(scene) {
    this.sys = new BillboardSystem(scene, 2400);
    const P = [], h = LAYOUT.curbH;
    // [x, y, z, t0, size, alpha, life, seed, kind] kind 0 dust, 1 glass glitter
    let s = 1;
    // the car's shock across the lot (light: it is only just supersonic)
    for (let x = 14; x <= 52; x += 4.8) for (let z = -90; z <= 30; z += 4.8) {
      const jx = x + (hash1(s * 3) - 0.5) * 2.4, jz = z + (hash1(s * 5) - 0.5) * 2.4, tb = sndSportBoomAt(jx, jz, 0.3);
      if (tb !== null && tb > 33) P.push([jx, h, jz, tb, 1.7, 0.06, 1.8, s, 0]);
      s++;
    }
    // the car's wake on the highway deck (grit off the road behind it)
    for (let z = -330; z <= 60; z += 2.4) {
      const S = SND.sport, tz = (() => { let lo = 20, hi = 42; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (sndSport(m).z < z) lo = m; else hi = m; } return lo; })();
      P.push([S.x + (hash1(s * 3) - 0.5) * 2.6, SND_CITY.hwy.top, z, tz + 0.05, 1.7, 0.16, 1.8, s, 0]); s++;
    }
    // the airliner's shock: a low wall of dust that comes up the avenue (gutters and pavements dirtiest), the lot lighter
    for (let x = -12; x <= 12; x += 3.0) for (let z = -330; z <= 40; z += 3.0) {
      const jx = x + (hash1(s * 3) - 0.5) * 2.0, jz = z + (hash1(s * 5) - 0.5) * 2.6, edge = Math.abs(Math.abs(jx) - 7) < 1.6 || Math.abs(jx) > 8.5;
      P.push([jx, Math.abs(jx) < LAYOUT.roadHalf ? 0 : h, jz, sndPlaneBoomAt(jx, jz, 0.3), edge ? 3.4 : 2.6, edge ? 0.22 : 0.1, 2.1, s, 0]);
      s++;
    }
    for (let x = 15; x <= 50; x += 6) for (let z = -120; z <= 30; z += 6) {
      const jx = x + (hash1(s * 3) - 0.5) * 4, jz = z + (hash1(s * 5) - 0.5) * 4;
      P.push([jx, h, jz, sndPlaneBoomAt(jx, jz, 0.3), 2.2, 0.06, 2.0, s, 0]); s++;
    }
    // the police car's wake along the street (the gutters are dusty)
    for (const x of [-10.5, -7.6, -6.6, -3.6, 0.4, 3.6, 6.6, 7.6, 10.5]) for (let z = -260; z <= 40; z += 3.2) {
      const jz = z + hash1(s) * 3.2, gutter = Math.abs(Math.abs(x) - 6.8) < 1;
      P.push([x + (hash1(s * 7) - 0.5), Math.abs(x) < LAYOUT.roadHalf ? 0 : h, jz, sndPoliceBoomAt(x, jz, 0.3), gutter ? 2.0 : 1.5, gutter ? 0.13 : 0.06, 1.9, s, 0]);
      s++;
    }
    // the pile driver: a puff at the base of the pile with every blow
    for (const t of SND_PILE_HITS) for (let k = 0; k < 7; k++) P.push([SND.pile.x - 0.75 + (hash1(s) - 0.5) * 2.4, h + 0.2, SND.pile.z + (hash1(s * 3) - 0.5) * 2.4, t + 0.01 + k * 0.02, 2.6, 0.42, 2.0, s++, 0]);
    // the drone hits the ground
    for (let k = 0; k < 8; k++) P.push([SND.drone.x + 1.1 + (hash1(s) - 0.5) * 0.9, h - 0.15, SND.drone.z + (hash1(s * 3) - 0.5) * 0.9, SND.drone.down + 0.02 + k * 0.015, 0.45, 0.16, 1.2, s++, 0]);
    this.P = P.sort((a, b) => a[3] - b[3]);
    this.glitter = [];                                           // glass dust: added by SndGlass
  }

  update(t, fog) {
    const B = this.sys, E = sndEar(t);
    B.begin(fog);
    const push = (p) => {
      const u = t - p[3];
      if (u < 0 || u > p[6]) return;
      const k = u / p[6], sd = p[7];
      if (p[8] === 0) {
        const grow = 1 - Math.exp(-u * 2.2), size = p[4] * (0.35 + 1.1 * grow);
        // dust right at your face would only fog the lens: it thins out within a few metres of you
        const a = p[5] * MathX.smooth(u, 0, 0.12) * (1 - k) * (1 - k) * MathX.smooth(Math.hypot(p[0] - E.x, p[2] - E.z), 2.5, 9);
        B.push(p[0] + (hash1(sd * 11) - 0.5) * u * 1.4, p[1] + 0.15 + size * 0.28 + u * (0.35 + 0.4 * hash1(sd * 3)), p[2] + u * 0.6, size, hash1(sd) * 6.28 + u * 0.4 * (hash1(sd * 5) - 0.5), a, 1, 0.66, 0.61, 0.54);
      } else {
        const a = p[5] * (1 - k) * (0.5 + 0.5 * Math.sin(u * 40 + sd));
        B.push(p[0], p[1] - u * 0.8, p[2], p[4] * (0.6 + 0.6 * k), hash1(sd) * 6.28, a, 1.4, 0.92, 0.96, 1.0);
      }
    };
    for (const p of this.P) { if (p[3] > t) break; push(p); }
    for (const p of this.glitter) push(p);
    B.end();
  }
}

/* -------------------------------------------------------------------------------------------------------------------
   THE AIRLINER in trouble at Mach 2.1: a faint Mach cone, vapour on the wings, engines surging (flame), a smoke trail
   ------------------------------------------------------------------------------------------------------------------- */
class SndPlaneFx {
  constructor(scene, aircraft) {
    this.ac = aircraft;
    const g = aircraft.group, M = SND.plane.v / SND.C1, mu = Math.asin(1 / M), L = 320;
    // the Mach cone: apex at the nose, opening backwards (model: nose −Z)
    const cg = new THREE.ConeGeometry(L * Math.tan(mu), L, 64, 1, true);
    cg.rotateX(-Math.PI / 2); cg.translate(0, 0, -18.5 + L / 2);
    this.coneMat = new THREE.ShaderMaterial({
      uniforms: { uA: { value: 0 }, uL: { value: L } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`varying vec3 vN; varying vec3 vV; varying float vL; uniform float uL;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vL = (position.z + 18.5) / uL; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform float uA; varying vec3 vN; varying vec3 vV; varying float vL;
        void main(){ float r = 1.0 - abs(dot(normalize(vN), normalize(vV))); float a = pow(r, 6.0) * uA * (1.0 - smoothstep(0.15, 1.0, vL)) * smoothstep(0.0, 0.03, vL);
          gl_FragColor = vec4(vec3(0.95, 0.97, 1.0) * a, 1.0); }`,
    });
    this.cone = new THREE.Mesh(cg, this.coneMat); this.cone.frustumCulled = false; this.cone.renderOrder = 5; g.add(this.cone);
    // vapour: a soft collar where the shock sits on the wing, and streamers off the wingtips
    const vap = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide, fog: true });
    this.vapMat = vap;
    const col = new THREE.ConeGeometry(9.5, 10, 40, 1, true); col.rotateX(-Math.PI / 2); col.translate(0, -0.8, 2.5);
    this.collar = new THREE.Mesh(col, vap); g.add(this.collar);
    this.streams = [];
    // engine flames (surging) — additive glows at the exhausts
    this.flames = [];
    // (over-bright so the bloom catches them: they have to read from 200 m in daylight)
    const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.35, 0.42), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
    const gm = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.6, 2.4, 1.1), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
    this.glows = [];
    for (const s of [-1, 1]) {
      const fg = new THREE.ConeGeometry(1.25, 11, 14, 1, true); fg.rotateX(Math.PI / 2); fg.translate(0, 0, 5.5);
      const f = new THREE.Mesh(fg, fm.clone()); f.position.set(s * 5.9, -2.3, 1.8); g.add(f); this.flames.push(f);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), gm.clone()); gl.position.set(s * 5.9, -2.3, 2.2); g.add(gl); this.glows.push(gl);
    }
    // the airliner reads against the bright sky only without the street's haze on it
    g.traverse((o) => { if (o.isMesh && o.material && o.material.fog && o.material !== this.coneMat) { o.material = o.material.clone(); o.material.fog = false; } });
    this.vapMat = this.collar.material;
    this.smoke = new BillboardSystem(scene, 760);
    this._q = new THREE.Quaternion(); this._e = new THREE.Euler();
  }

  // engine exhaust in world space at time te (heading +Z; model +X → world −X)
  _exhaust(te, side) { const q = sndPlane(te); return [q.x - side * 5.9, q.y - 2.3, q.z - 1.8]; }

  update(t, fog) {
    const g = this.ac.group, on = g.visible;
    // shudder: it is flying through its own shock waves
    if (on) {
      const k = 1.0;
      this._e.set(MathX.deg(noise1(t * 6.1, 3) * 2.6 * k), MathX.deg(noise1(t * 4.3, 4) * 1.6 * k), MathX.deg(noise1(t * 7.2, 5) * 3.6 * k));
      this._q.setFromEuler(this._e); g.quaternion.multiply(this._q);
    }
    this.coneMat.uniforms.uA.value = on ? 0.1 : 0;
    this.vapMat.opacity = on ? 0.05 + 0.03 * noise1(t * 6, 9) : 0;
    this.collar.scale.set(1 + 0.05 * noise1(t * 9, 1), 1 + 0.05 * noise1(t * 8, 2), 1);
    this.flames.forEach((f, i) => {
      // compressor surges: the left engine bangs and spits flame, the right one flickers
      const surge = Math.max(0, noise1(t * (i ? 3.1 : 5.3), 20 + i)) * (i ? 0.6 : 1.4);
      f.material.opacity = on ? Math.min(0.9, 0.18 + surge * 1.2) : 0;
      f.scale.set(1, 1, 0.45 + surge * 1.5);
      this.glows[i].material.opacity = on ? Math.min(0.85, 0.25 + surge * 0.9) : 0;
      this.glows[i].scale.setScalar(0.8 + surge * 0.7);
    });
    // a dark smoke trail from the left (failing) engine + a thin grey one from the right
    const S = this.smoke;
    S.begin(fog);
    if (t > 40) {
      const DT = 0.03, k1 = Math.floor(Math.min(t, 58) / DT);   // (puffs close enough to merge into one ribbon)
      for (let k = k1; k > k1 - 360; k--) {
        const te = k * DT; if (te < 40) break;
        const age = t - te;
        for (const side of [-1, 1]) {
          if (side > 0 && k % 2) continue;
          const p = this._exhaust(te, side), sd = k * 2 + (side > 0 ? 1 : 0);
          const size = (side < 0 ? 5.0 : 3.0) + age * (side < 0 ? 4.0 : 2.5), a = (side < 0 ? 0.42 : 0.14) * Math.exp(-age / 7) * MathX.smooth(age, 0, 0.3);
          const sh = side < 0 ? 0.32 : 0.6;
          S.push(p[0] + (hash1(sd) - 0.5) * age * 1.6, p[1] - age * 0.6 + (hash1(sd * 3) - 0.5) * age, p[2] + (hash1(sd * 5) - 0.5) * age * 1.2, size, hash1(sd * 7) * 6.28, a, sh, 0.9, 0.86, 0.8);
        }
      }
    }
    S.end();
  }
}

/* -------------------------------------------------------------------------------------------------------------------
   GLASS: the shop windows near you. Each pane has a strength (hash); the police car's shock bursts the weakest,
   cracks some; the airliner's deeper but weaker boom cracks only a few.
   ------------------------------------------------------------------------------------------------------------------- */
const SND_GLASS_WATCH = [[-7.5, 2], [-12.5, 1], [-17.5, 2]];   // [z on the left-hand shopfronts, 1 cracks / 2 bursts]
class SndGlass {
  constructor(scene, env, dust) {
    this.panes = [];
    const units = env.units.filter((u) => u.zb > -175 && u.za < 45);
    const breakTex = this._decal(true), crackTex = this._decal(false);
    const broken = new THREE.MeshBasicMaterial({ map: breakTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const cracked = new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    let id = 0;
    for (const u of units) {
      const U = u.zb - u.za, side = u.side, xf = side * LAYOUT.frontage - side * 0.045;
      const winX = u.doorLeft ? 234 : 60, winW = 730;
      const zOf = (px) => (side > 0 ? u.za + (px / 1024) * U : u.zb - (px / 1024) * U);
      const y0 = 0.264, y1 = 3.033;
      for (const [a, b] of [[winX, winX + winW / 2 - 3], [winX + winW / 2 + 3, winX + winW]]) {
        const za = Math.min(zOf(a), zOf(b)), zb = Math.max(zOf(a), zOf(b)), zc = (za + zb) / 2;
        const w = hash1(id * 97 + 13), left = side < 0;
        const tP = sndPoliceBoomAt(xf, zc, 1.6), tQ = sndPlaneBoomAt(xf, zc, 1.6);
        // a shock of a few hundred pascals only finishes off panes that were already weak or strained: a few burst, more
        // crack, most hold. The police car passes 10.8 m from the left-hand shops and 14.2 m from yours (stronger on the left);
        // the airliner's long boom cracks a few others (its own weakness draw, wp)
        const wp = hash1(id * 53 + 7);
        let fate = 0, tf = 0;                                    // 0 holds, 1 cracks, 2 bursts
        if (wp < 0.06) { fate = 1; tf = tQ; }
        else if (w < (left ? 0.12 : 0.05)) { fate = 2; tf = tP; }
        else if (w < (left ? 0.3 : 0.14)) { fate = 1; tf = tP; }
        // the stretch of shopfront you watch as the police car goes by: two weak panes give way, one cracks, the rest hold
        if (left && zc > -24 && zc < -2) { fate = 0; tf = 0; const f = SND_GLASS_WATCH.find((q) => Math.abs(zc - q[0]) < (zb - za) / 2); if (f) { fate = f[1]; tf = tP; } }
        const p = { id, side, xf, za, zb, zc, y0, y1, w, fate, tf, wobble: [tQ, tP] };
        if (fate) {
          const g = new THREE.PlaneGeometry(zb - za, y1 - y0);
          const m = new THREE.Mesh(g, fate === 2 ? broken : cracked);
          m.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          m.position.set(xf, (y0 + y1) / 2, zc);
          if (fate === 2) { m.material = broken.clone(); m.material.map = breakTex.clone(); m.material.map.needsUpdate = true; m.material.map.offset.set(hash1(id) * 0.5, 0); m.material.map.repeat.set(0.5 + 0.1 * hash1(id * 3), 1); }
          m.visible = false; m.renderOrder = 2; scene.add(m); p.mesh = m;
        }
        this.panes.push(p); id++;
      }
    }
    // shards: every burst pane throws ~48 pieces out over the sidewalk (ballistic, then lying flat)
    const bursts = this.panes.filter((p) => p.fate === 2);
    const N = bursts.length * 48;
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0.1, 0, 0.35, 0.9, 0], 3)); sg.computeVertexNormals();
    sg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    const smat = new THREE.MeshStandardMaterial({ color: '#d8e6ec', roughness: 0.06, metalness: 0.75, transparent: true, opacity: 0.85, side: THREE.DoubleSide, envMapIntensity: 1.6 });
    this.shards = new THREE.InstancedMesh(sg, smat, Math.max(1, N)); this.shards.frustumCulled = false; this.shards.count = 0; scene.add(this.shards);
    this.S = [];
    for (const p of bursts) {
      for (let k = 0; k < 48; k++) {
        const r = (n) => hash1(p.id * 1013 + k * 31 + n * 7);
        const out = -p.side;                                     // toward the street
        this.S.push({
          t0: p.tf + r(1) * 0.05, x: p.xf + out * 0.03, y: p.y0 + 0.1 + r(2) * (p.y1 - p.y0 - 0.2), z: p.za + r(3) * (p.zb - p.za),
          vx: out * (0.5 + 2.6 * r(4)), vy: -0.4 + 2.2 * r(5), vz: (r(6) - 0.5) * 2.2, s: 0.08 + 0.26 * r(7) * r(7) + (r(8) < 0.1 ? 0.3 : 0),
          ax: r(9) * 6.28, ay: r(10) * 6.28, wx: (r(11) - 0.5) * 30, wy: (r(12) - 0.5) * 24, rest: r(13) * 6.28,
        });
      }
      // glass glitter at the burst: small sparks, not soft balls
      for (let k = 0; k < 16; k++) dust.glitter.push([p.xf - p.side * (0.2 + hash1(p.id * 5 + k) * 1.6), p.y0 + 0.3 + hash1(p.id * 9 + k) * 2.0, p.za + hash1(p.id * 3 + k) * (p.zb - p.za), p.tf + 0.02 + hash1(p.id * 13 + k) * 0.12, 0.26, 0.7, 0.9, p.id * 20 + k, 1]);
    }
    // the glass lying on the sidewalk in front of each burst pane (glints once the pieces have landed)
    const gl = this._glitterTex(), gm = new THREE.MeshBasicMaterial({ map: gl, transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.carpets = bursts.map((p) => {
      const g = new THREE.PlaneGeometry(2.6, p.zb - p.za + 0.6); g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, gm.clone()); m.material.map = gl.clone(); m.material.map.needsUpdate = true; m.material.map.offset.set(hash1(p.id * 7), hash1(p.id * 11));
      m.position.set(p.xf - p.side * 1.45, LAYOUT.curbH + 0.014, p.zc); m.renderOrder = 2; scene.add(m);
      return { m, t: p.tf + 0.5 };
    });
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
  }

  _glitterTex() {
    const W = 256, c = Tex.canvas(W, W), x = c.getContext('2d'), r = new RNG(73);
    x.clearRect(0, 0, W, W);
    for (let i = 0; i < 420; i++) {
      const px = r.next() * W, py = r.next() * W, edge = Math.min(px, W - px, py, W - py) / (W * 0.5), a = Math.min(1, edge * 2.2) * (0.35 + r.next() * 0.65);
      const s = 1 + r.next() * r.next() * 7;
      x.fillStyle = `rgba(235,244,250,${(a * 0.8).toFixed(2)})`; x.beginPath(); x.moveTo(px, py); x.lineTo(px + s, py + s * 0.3); x.lineTo(px + s * 0.4, py + s); x.closePath(); x.fill();
    }
    return Tex.tex(c, { repeat: false });
  }

  // a pane's fracture: dark gaps where glass is gone, jagged pieces still in the frame (burst), or a crack web
  _decal(burst) {
    const W = 512, H = 512, c = Tex.canvas(W, H), x = c.getContext('2d'), r = new RNG(burst ? 71 : 72);
    x.clearRect(0, 0, W, H);
    if (burst) {
      // the hole: the shop seen without glass (darker: no more reflections)
      x.fillStyle = 'rgba(6,7,9,0.38)'; x.fillRect(0, 0, W, H);
      // irregular pieces still held by the frame: translucent, with bright broken edges
      const piece = (pts) => {
        x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.closePath();
        x.fillStyle = `rgba(200,216,226,${(0.22 + r.next() * 0.2).toFixed(2)})`; x.fill();
        x.strokeStyle = 'rgba(245,250,255,0.75)'; x.lineWidth = 1.4; x.stroke();
      };
      for (let side = 0; side < 4; side++) {
        const P = (u, v) => side === 0 ? [u * W, v] : side === 1 ? [W - v, u * H] : side === 2 ? [u * W, H - v] : [v, u * H];
        let u = r.next() * 0.08;
        while (u < 0.97) {
          const w = 0.04 + r.next() * 0.22, b = Math.min(1, u + w), long = r.next() < 0.22;
          const d1 = (long ? 90 + r.next() * 170 : 10 + r.next() * 60), d2 = d1 * (0.3 + r.next() * 0.6);
          if (r.next() < 0.75) piece([P(u, 0), P(b, 0), P(b - w * r.next() * 0.4, d2), P(u + w * (0.2 + r.next() * 0.5), d1)]);
          u = b + r.next() * 0.06;
        }
      }
      // a few cracks running through what is left near the frame
      x.strokeStyle = 'rgba(245,250,255,0.5)'; x.lineWidth = 1.1;
      for (let i = 0; i < 14; i++) { const e = r.int(0, 3), u = r.next(); let px = e === 0 ? u * W : e === 1 ? W : e === 2 ? u * W : 0, py = e === 0 ? 0 : e === 1 ? u * H : e === 2 ? H : u * H;
        x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (W / 2 - px) * 0.12 + (r.next() - 0.5) * 40; py += (H / 2 - py) * 0.12 + (r.next() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); }
    } else {
      x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 1.6;
      const cx = W * (0.3 + r.next() * 0.4), cy = H * (0.3 + r.next() * 0.4);
      for (let i = 0; i < 13; i++) {
        let a = (i / 13) * Math.PI * 2 + r.next() * 0.3, px = cx, py = cy;
        x.beginPath(); x.moveTo(px, py);
        for (let k = 0; k < 7; k++) { a += (r.next() - 0.5) * 0.5; const L = 25 + r.next() * 45; px += Math.cos(a) * L; py += Math.sin(a) * L; x.lineTo(px, py); }
        x.stroke();
      }
      for (let ring = 1; ring <= 3; ring++) { x.beginPath(); for (let i = 0; i <= 13; i++) { const a = (i / 13) * Math.PI * 2, R = ring * 28 + r.next() * 10; const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    }
    return Tex.tex(c, { repeat: false });
  }

  update(t) {
    for (const p of this.panes) if (p.mesh) p.mesh.visible = t >= p.tf;
    for (const c of this.carpets) c.m.material.opacity = 0.85 * MathX.smooth(t, c.t, c.t + 0.4);
    const I = this.shards, m = this._m, g = -9.81, h = LAYOUT.curbH, ground = (x) => (Math.abs(x) < LAYOUT.roadHalf ? 0.0 : h) + 0.012;
    let n = 0;
    for (const s of this.S) {
      const u = t - s.t0; if (u < 0) continue;
      // fall until it hits the ground (a pure function: solve y(u) = ground)
      const gy = ground(s.x + s.vx * 0.6), A = 0.5 * g, Bq = s.vy, Cq = s.y - gy;
      const tl = (-Bq - Math.sqrt(Bq * Bq - 4 * A * Cq)) / (2 * A);
      let x, y, z, ex, ey, ez;
      if (u < tl) { x = s.x + s.vx * u; y = s.y + s.vy * u + 0.5 * g * u * u; z = s.z + s.vz * u; ex = s.ax + s.wx * u; ey = s.ay + s.wy * u; ez = 0; }
      else { const sl = Math.min(u - tl, 0.25) * 0.35; x = s.x + s.vx * (tl + sl); y = ground(s.x + s.vx * tl); z = s.z + s.vz * (tl + sl); ex = -Math.PI / 2; ey = 0; ez = s.rest; }
      this._e.set(ex, ey, ez); this._q.setFromEuler(this._e);
      m.compose(this._p.set(x, y, z), this._q, this._s.set(s.s, s.s, s.s));
      I.setMatrixAt(n++, m);
    }
    I.count = n; I.instanceMatrix.needsUpdate = true;
  }
}
