/* =====================================================================
   PARTICLES / VFX — flames, grinder sparks, smoke, exhaust puffs,
   birds and floating dust.  Every particle is computed directly from
   the timeline (birth time + age), so scrubbing is exact.
   ===================================================================== */

/* ---------------- Flames (billboards with a procedural shader) ---------------- */
class FlameSystem {
  constructor(scene) {
    this.scene = scene;
    this.flames = [];
    this.geo = new THREE.PlaneGeometry(1, 1);
    this.geo.translate(0, 0.5, 0);
  }

  _material(seed) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLevel: { value: 1 }, uSeed: { value: seed } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uLevel, uSeed;
        varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        void main(){
          float lvl = uLevel;
          float H = mix(0.12, 1.0, lvl);
          float y = vUv.y / H;
          float n1 = n(vec2(vUv.x * 3.0 + uSeed, vUv.y * 3.5 - uTime * 3.2));
          float n2 = n(vec2(vUv.x * 7.0 - uSeed * 2.0, vUv.y * 7.0 - uTime * 5.5));
          float x = (vUv.x - 0.5) * 2.0 + (n1 - 0.5) * 0.7 * y;
          float w = (1.0 - y) * 0.75 + 0.06;
          float shape = smoothstep(w, w * 0.25, abs(x)) * smoothstep(1.0, 0.45, y + (n2 - 0.5) * 0.45) * smoothstep(0.0, 0.06, vUv.y);
          vec3 hot = vec3(1.0, 0.86, 0.45), mid = vec3(1.0, 0.42, 0.08), tip = vec3(0.8, 0.12, 0.02);
          vec3 col = mix(hot, mid, smoothstep(0.1, 0.55, y));
          col = mix(col, tip, smoothstep(0.55, 1.0, y));
          col = mix(col, vec3(0.25, 0.45, 1.0), smoothstep(0.1, 0.0, vUv.y) * 0.6);
          float a = shape * lvl;
          gl_FragColor = vec4(col * 4.0, a);
        }`,
    });
  }

  add(pos, width, height, seed) {
    const m = new THREE.Mesh(this.geo, this._material(seed));
    m.position.copy(pos);
    m.scale.set(width, height, 1);
    m.renderOrder = 5;
    m.frustumCulled = false;
    this.scene.add(m);
    this.flames.push({ mesh: m, seed });
    return m;
  }

  update(t, level, camera) {
    for (const f of this.flames) {
      f.mesh.material.uniforms.uTime.value = t + f.seed * 3;
      f.mesh.material.uniforms.uLevel.value = level * (0.85 + 0.15 * noise1(t * 6 + f.seed * 10, 2));
      f.mesh.visible = level > 0.002;
      // cylindrical billboard
      f.mesh.rotation.y = Math.atan2(camera.position.x - f.mesh.position.x, camera.position.z - f.mesh.position.z);
    }
  }
}

/* ---------------- Streaks (sparks) ---------------- */
class StreakSystem {
  constructor(scene, max = 900) {
    this.max = max;
    const base = new THREE.InstancedBufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3));
    base.setIndex([0, 1, 2, 0, 2, 3]);
    this.aStart = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aEnd = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aWidth = new THREE.InstancedBufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    base.setAttribute('aStart', this.aStart); base.setAttribute('aEnd', this.aEnd);
    base.setAttribute('aColor', this.aColor); base.setAttribute('aWidth', this.aWidth);
    base.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec3 aStart, aEnd; attribute vec4 aColor; attribute float aWidth;
        varying vec4 vColor; varying float vSide;
        void main(){
          vec3 a = (modelViewMatrix * vec4(aStart, 1.0)).xyz;
          vec3 b = (modelViewMatrix * vec4(aEnd, 1.0)).xyz;
          vec3 d = b - a; float len = length(d);
          vec3 dir = len > 1e-5 ? d / len : vec3(0.0, 1.0, 0.0);
          vec3 p = mix(a, b, position.x);
          vec3 side = normalize(cross(dir, normalize(p)));
          p += side * position.y * aWidth + dir * (position.x * 2.0 - 1.0) * aWidth;
          gl_Position = projectionMatrix * vec4(p, 1.0);
          vColor = aColor; vSide = position.y;
        }`,
      fragmentShader: /* glsl */`
        varying vec4 vColor; varying float vSide;
        void main(){ float f = 1.0 - abs(vSide); gl_FragColor = vec4(vColor.rgb, vColor.a * f * f); }`,
    });
    this.mesh = new THREE.Mesh(base, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    scene.add(this.mesh);
    this.geo = base;
    this.n = 0;
  }
  begin() { this.n = 0; }
  push(ax, ay, az, bx, by, bz, r, g, b, a, w) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.aStart.array.set([ax, ay, az], i * 3); this.aEnd.array.set([bx, by, bz], i * 3);
    this.aColor.array.set([r, g, b, a], i * 4); this.aWidth.array[i] = w;
  }
  end() {
    this.geo.instanceCount = this.n;
    for (const at of [this.aStart, this.aEnd, this.aColor, this.aWidth]) at.needsUpdate = true;
  }
}

/* ---------------- Soft billboard particles (smoke, puffs) ---------------- */
class BillboardSystem {
  constructor(scene, max = 600, additive = false) {
    this.max = max;
    const base = new THREE.InstancedBufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    base.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    base.setIndex([0, 1, 2, 0, 2, 3]);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aData = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage); // size, rot, alpha, shade
    this.aTint = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    base.setAttribute('aPos', this.aPos); base.setAttribute('aData', this.aData); base.setAttribute('aTint', this.aTint);
    base.instanceCount = 0;
    this.uniforms = { uMap: { value: Tex.softDot() }, uFogColor: { value: new THREE.Color() }, uFogDensity: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: /* glsl */`
        attribute vec3 aPos; attribute vec4 aData; attribute vec3 aTint;
        varying vec2 vUv; varying float vAlpha; varying vec3 vTint; varying float vDepth;
        void main(){
          vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
          float c = cos(aData.y), s = sin(aData.y);
          vec2 q = mat2(c, -s, s, c) * position.xy * aData.x;
          mv.xy += q;
          gl_Position = projectionMatrix * mv;
          vUv = uv; vAlpha = aData.z; vTint = aTint * aData.w; vDepth = -mv.z;
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uMap; uniform vec3 uFogColor; uniform float uFogDensity;
        varying vec2 vUv; varying float vAlpha; varying vec3 vTint; varying float vDepth;
        void main(){
          float a = texture2D(uMap, vUv).r * vAlpha;
          float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
          gl_FragColor = vec4(mix(vTint, uFogColor, fog), a);
        }`,
    });
    this.mesh = new THREE.Mesh(base, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    scene.add(this.mesh);
    this.geo = base;
    this.n = 0;
  }
  begin(fog) { this.n = 0; if (fog) { this.uniforms.uFogColor.value.copy(fog.color); this.uniforms.uFogDensity.value = fog.density; } }
  push(x, y, z, size, rot, alpha, shade, r = 1, g = 1, b = 1) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.aPos.array.set([x, y, z], i * 3);
    this.aData.array.set([size, rot, alpha, shade], i * 4);
    this.aTint.array.set([r, g, b], i * 3);
  }
  end() {
    this.geo.instanceCount = this.n;
    this.aPos.needsUpdate = this.aData.needsUpdate = this.aTint.needsUpdate = true;
  }
}

/* ---------------- Birds ---------------- */
class BirdFlock {
  constructor(scene, count = 12) {
    this.birds = [];
    const mat = Mat.std('#2a2a2e', { roughness: 0.9 });
    const bodyG = new THREE.ConeGeometry(0.06, 0.32, 6); bodyG.rotateX(Math.PI / 2);
    const wingG = new THREE.BufferGeometry();
    wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.08, 0.38, 0, -0.02, 0, 0, 0.1, 0.38, 0, -0.02, 0.3, 0, 0.06, 0, 0, 0.1], 3));
    wingG.computeVertexNormals();
    for (let i = 0; i < count; i++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(bodyG, mat));
      const wl = new THREE.Mesh(wingG, mat); const wr = new THREE.Mesh(wingG, mat);
      wr.scale.x = -1;
      wl.material = wr.material = new THREE.MeshStandardMaterial({ color: '#2a2a2e', side: THREE.DoubleSide, roughness: 0.9 });
      g.add(wl, wr);
      g.scale.setScalar(1.3);
      scene.add(g);
      this.birds.push({ g, wl, wr, seed: hash1(i * 17 + 3), i });
    }
  }
  update(t) {
    for (const b of this.birds) {
      const s = b.seed;
      const ang = t * 0.32 + b.i * 0.28 + s * 0.5;
      const R = 22 + s * 8;
      let x = -6 + Math.cos(ang) * R + Math.sin(t * 0.7 + s * 9) * 1.5;
      let z = -62 + Math.sin(ang) * R * 0.6;
      let y = 30 + Math.sin(t * 0.9 + s * 7) * 1.2 + s * 6;
      // hypoxic birds: erratic flapping, then they drop out of the sky
      const fail = MathX.smooth(t, 7.8 + s * 1.5, 10.5 + s * 1.5);
      const fall = Math.max(0, t - (9.0 + s * 1.6));
      y -= fall * fall * 2.6;
      x += fail * Math.sin(t * 5 + s * 20) * 0.8;
      b.g.position.set(x, y, z);
      // heading along the circle
      const dx = -Math.sin(ang), dz = Math.cos(ang) * 0.6;
      b.g.rotation.set(fail * Math.sin(t * 7 + s * 9) * 0.9, Math.atan2(dx, dz), fail * 0.6 * Math.sin(t * 3 + s * 4));
      const fr = MathX.lerp(9.5, 3 + 6 * Math.abs(noise1(t * 2 + s * 10, 5)), fail);
      const flap = Math.sin(t * fr + s * 30) * MathX.lerp(0.7, 0.25, fail);
      b.wl.rotation.z = flap; b.wr.rotation.z = -flap;
      b.g.visible = y > -1;
    }
  }
}

/* ===================================================================== */
class ParticleSystem {
  constructor(scene, env, traffic) {
    this.scene = scene;
    this.env = env;
    this.traffic = traffic;
    this.flames = new FlameSystem(scene);
    this.sparks = new StreakSystem(scene, 900);
    this.smoke = new BillboardSystem(scene, 700, false);
    this.glow = new BillboardSystem(scene, 64, true);
    this.birds = new BirdFlock(scene, 12);

    // grill flames
    const g = env.anchors.grill, gs = env.anchors.grillSize;
    for (let i = 0; i < 9; i++) {
      const fx = g.x + (hash1(i * 5 + 1) - 0.5) * gs.w * 0.7;
      const fz = g.z + (i / 8 - 0.5) * gs.d * 0.85;
      this.flames.add(new THREE.Vector3(fx, g.y - 0.12, fz), 0.24 + hash1(i) * 0.12, 0.32 + hash1(i * 3) * 0.28, i * 1.37);
    }
    // patio heater flame (gas)
    const ht = env.anchors.heater;
    this.flames.add(new THREE.Vector3(ht.x, ht.y - 0.18, ht.z), 0.12, 0.32, 9.1);

    // exhaust puffs for each combustion vehicle as its engine dies
    this.puffs = [];
    for (const v of traffic.vehicles) {
      if (!v.combustion || v.spec.fail === undefined) continue;
      const big = v.spec.type === 'bus' || v.spec.type === 'pickup';
      const n = big ? 6 : 4;
      for (let k = 0; k < n; k++) {
        this.puffs.push({ v, t0: v.spec.fail + 0.12 + k * (0.22 + hash1(k + v.seed * 99) * 0.12), big, k });
      }
    }
    // idling cars at the red light puff a little before they die
    for (const id of ['xw1', 'xw2', 'xe1']) {
      const v = traffic.byId[id];
      for (let k = 0; k < 8; k++) this.puffs.push({ v, t0: k * 0.38 + hash1(k * 3 + id.length) * 0.2, big: false, idle: true, k });
    }
  }

  update(t, tl, camera) {
    // flames: shrink below ~18 % O2, out at ~15 %
    const level = FX_FLAME_LEVEL(t, tl);
    this.flames.update(t, level, camera);
    this._sparks(t, tl);
    this.smoke.begin(this.scene.fog);
    this.glow.begin(null);
    this._grillSmoke(t, tl);
    this._exhaust(t);
    this._glows(t, tl, level);
    this.smoke.end();
    this.glow.end();
    this.birds.update(t);
  }

  _glows(t, tl, level) {
    // soft glow sprites around the fire and the grinder contact point
    const g = this.env.anchors.grill;
    const gr = this.env.anchors.grinder;
    if (t < tl.at('grinder_stop')) {
      const o2 = SCRIPT_TRACKS.oxygen.value(t);
      const f = MathX.smooth(o2, 3, 16);
      const flick = 0.75 + 0.25 * noise1(t * 30, 8);
      this.glow.push(gr.x, gr.y, gr.z, MathX.lerp(0.12, 0.3, f), 0, (0.35 + 0.65 * f) * flick, 1, 2.2, MathX.lerp(0.7, 1.5, f), MathX.lerp(0.2, 0.6, f));
    }
  }

  _sparks(t, tl) {
    const S = this.sparks, o = this.env.anchors.grinder;
    S.begin();
    const R = 240, Lmax = 1.0, N = Math.ceil(R * Lmax) + 1;
    const tStop = tl.at('grinder_stop');
    const g = 9.8;
    for (let i = 0; i < N; i++) {
      const k = Math.floor((t * R - i) / N);
      const tb = (k * N + i) / R;
      if (tb < -2 || tb > tStop || tb > t) continue;
      const age = t - tb;
      const h1 = hash2(i, k), h2 = hash2(i + 999, k), h3 = hash2(i + 1999, k), h4 = hash2(i + 2999, k);
      // oxygen at the moment this spark was thrown off
      const o2 = SCRIPT_TRACKS.oxygen.value(tb);
      const f = MathX.smooth(o2, 2.5, 16);        // 1 = burning iron sparks, 0 = just hot metal
      const life = MathX.lerp(0.1 + 0.12 * h1, 0.35 + 0.6 * h1, f);
      if (age > life) continue;
      // emission cone: down, toward the street, fanned toward the viewer
      const sp = 6 + h2 * 7;
      let dx = -0.62 + (h3 - 0.5) * 0.7, dy = -0.38 + (h4 - 0.5) * 0.7, dz = 0.66 + (h1 - 0.5) * 0.5;
      const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      const vx = dx * sp, vy = dy * sp, vz = dz * sp;
      const pos = (a) => [o.x + vx * a, o.y + vy * a - 0.5 * g * a * a, o.z + vz * a];
      const tail = Math.max(0, age - 0.022);
      const [ax, ay, az] = pos(tail), [bx, by, bz] = pos(age);
      if (by < 0.15) continue;
      const fade = 1 - age / life;
      // colour: white-yellow when burning, dull orange-red without oxygen
      const br = MathX.lerp(1.4, 9, f) * (0.5 + 0.5 * fade);
      const r = br, gg = br * MathX.lerp(0.32, 0.72, f) * (0.6 + 0.4 * fade), b = br * MathX.lerp(0.06, 0.28, f) * fade;
      S.push(ax, ay, az, bx, by, bz, r, gg, b, 1, MathX.lerp(0.006, 0.011, f));
      // carbon "bursts" only happen when there is oxygen to burn the steel
      if (f > 0.6 && h2 > 0.72 && age > life * 0.45) {
        for (let j = 0; j < 3; j++) {
          const a = (j / 3) * Math.PI * 2 + h3 * 6, L = 0.06 + 0.05 * hash2(i * 3 + j, k);
          S.push(bx, by, bz, bx + Math.cos(a) * L, by + Math.sin(a) * L * 0.8, bz + Math.sin(a + 1.3) * L, r * 0.8, gg * 0.8, b, fade, 0.005);
        }
      }
    }
    S.end();
  }

  _grillSmoke(t, tl) {
    const g = this.env.anchors.grill, B = this.smoke;
    const tOut = tl.at('flames_out');
    // phase 1: thick cooking smoke while flames burn; phase 2: thin wisps (fat still pyrolyses on hot coals)
    const R = 10, life = 5.5, N = Math.ceil(R * life) + 1;
    for (let i = 0; i < N; i++) {
      const k = Math.floor((t * R - i) / N);
      const tb = (k * N + i) / R;
      if (tb > t) continue;
      const age = t - tb;
      if (age > life) continue;
      const h1 = hash2(i + 7, k), h2 = hash2(i + 77, k), h3 = hash2(i + 777, k);
      let strength = 1;
      if (tb > tOut) {
        strength = 0.35 * (1 - MathX.smooth(tb, tOut, tOut + 6));
        if (h1 > 0.45) continue;
      }
      if (strength <= 0.01) continue;
      const rise = 0.55 + h2 * 0.4;
      const x = g.x + (h1 - 0.5) * 0.4 + 0.18 * age + Math.sin(age * 1.3 + h3 * 6) * 0.12 * age;
      const y = g.y + 0.1 + rise * age + 0.05 * age * age;
      const z = g.z + (h3 - 0.5) * 0.5 + 0.3 * age;
      const size = 0.22 + age * 0.3;
      const a = Math.min(1, age * 3) * Math.pow(1 - age / life, 1.5) * 0.2 * strength;
      B.push(x, y, z, size, h1 * 6 + age * (h2 - 0.5), a, 0.62 + 0.1 * h3, 0.86, 0.82, 0.78);
    }
  }

  _exhaust(t) {
    const B = this.smoke;
    for (const p of this.puffs) {
      const age = t - p.t0;
      const life = p.big ? 2.4 : 1.6;
      if (age < 0 || age > life) continue;
      if (p.idle && p.t0 > (p.v.spec.fail || 2.9)) continue;
      const tb = p.t0;
      const w = p.v.worldPoint(tb, p.v.exhaust);
      const h = hash1(p.k * 13 + Math.floor(p.t0 * 100));
      const sub = p.big ? 4 : 2;
      for (let j = 0; j < sub; j++) {
        const hj = hash2(p.k * 7 + j, Math.floor(p.t0 * 50));
        const x = w.x + (hj - 0.5) * 0.4 + Math.sin(age + j) * 0.1;
        const y = w.y + 0.1 + age * (0.45 + hj * 0.3);
        const z = w.z + (hash2(j, p.k) - 0.5) * 0.4;
        const size = (p.idle ? 0.18 : p.big ? 0.5 : 0.3) + age * (p.big ? 0.9 : 0.6);
        const dark = p.big ? 0.22 : p.idle ? 0.75 : 0.45;
        const a = Math.min(1, age * 6) * (1 - age / life) * (p.idle ? 0.12 : p.big ? 0.55 : 0.38);
        B.push(x, y, z, size, h * 6 + j, a, dark, 0.9, 0.9, 0.92);
      }
    }
  }
}
