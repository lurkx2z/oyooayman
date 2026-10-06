/* =====================================================================
   THE WORLD — the city, the sea, and everything the water moves.
     · boats float at the water's height (rolling with the swell), sit on the
       mud tilted when the harbour drains, tug at their moorings in the
       currents; in the surge some break loose and one ends up on the road;
     · cars: traffic on the coast road (headlights), parked cars along the
       streets; when the flood is deep enough they lift, turn and are carried
       inland, then settle where the water leaves them;
     · floating debris (crates, planks, bins, cones, fronds) rides the flood;
     · emergency vehicles with flashing lights arrive as things go wrong.
   All poses are functions of story time S (precomputed float/settle times).
   ===================================================================== */

class MnWorld {
  constructor(app) {
    this.app = app;
    const scene = app.scene;
    this.city = new MnCity(scene, app.rng);
    this.water = new MnWater(app);
    this.factory = new VehicleFactory();
    this.root = new THREE.Group(); this.root.name = 'movers'; scene.add(this.root);
    this._boats();
    this._cars();
    this._debris();
    this._dynLights();
    this.cast = new MnCast(scene);
  }

  groundAt(x, z) { return mnGround(x, z); }

  // the water depth at (x, z) at story time S (level + fronts − ground)
  depthAt(x, z, S) {
    let h = mnSea(S);
    for (const b of MN_BORES) {
      if (S < b.s0 - 0.5 || S > b.s1 + 1.5) continue;
      const u = MathX.clamp((S - b.s0) / (b.s1 - b.s0), 0, 1), zf = b.z0 + (b.z1 - b.z0) * (1 - (1 - u) * (1 - u));
      const env = MathX.smooth(S, b.s0 - 0.5, b.s0 + 0.3) * (1 - MathX.smooth(S, b.s1, b.s1 + 1.5)), wd = 4 + b.h * 2.5;
      h += b.h * env * (1 - MathX.smooth(z - zf, -wd, 0));
    }
    return h - mnGround(x, z);
  }

  /* ---------------- boats ---------------- */
  _hull(L, W, col, sail, seed) {
    const g = new THREE.Group(), rng = new RNG(Math.floor(seed * 1e6));
    const hullMat = Mat.std(col, { roughness: 0.45 }), deck = Mat.std('#cfc8b8', { roughness: 0.7 }), dark = Mat.std('#222428', { roughness: 0.5 });
    // a lofted hull: stations along x, a deep V at the bow flattening aft
    const st = [], n = 9;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = (u - 0.5) * L, w = W / 2 * Math.pow(Math.sin(Math.min(1, u * 1.15 + 0.05) * Math.PI * 0.5 + (u > 0.5 ? (u - 0.5) * 1.2 : 0)), 0.8) * (u > 0.85 ? 1 - (u - 0.85) * 4.5 : 1);
      const d = 0.9 + 0.25 * (1 - u), sheer = 0.95 + 0.25 * u * u;
      st.push([x, Math.max(0.05, w), d, sheer]);
    }
    const pos = [], idx = [];
    st.forEach(([x, w, d, sh]) => { pos.push(x, sh, -w, x, -d * 0.35, -w * 0.75, x, -d, 0, x, -d * 0.35, w * 0.75, x, sh, w); });
    for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const a = i * 5 + k, b = a + 1, c = a + 5, d2 = c + 1; idx.push(a, c, b, b, c, d2); }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setIndex(idx); hg.computeVertexNormals();
    const hull = new THREE.Mesh(hg, hullMat); hull.material.side = THREE.DoubleSide; hull.castShadow = true; g.add(hull);
    // deck, cabin, mast
    const dk = new THREE.Mesh(new THREE.BoxGeometry(L * 0.86, 0.08, W * 0.78), deck); dk.position.y = 1.05; g.add(dk);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(L * (sail ? 0.3 : 0.38), sail ? 0.55 : 1.1, W * 0.6), Mat.std(sail ? '#e2ded4' : '#f0eee8', { roughness: 0.4 }));
    cab.position.set(sail ? -L * 0.05 : L * 0.02, sail ? 1.35 : 1.6, 0); g.add(cab);
    const win = new THREE.Mesh(new THREE.BoxGeometry(L * (sail ? 0.26 : 0.34), 0.16, W * 0.62), dark); win.position.set(cab.position.x, cab.position.y + 0.05, 0); g.add(win);
    if (sail) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, L * 1.25, 6), Mat.std('#c9ccd0', { metalness: 0.7, roughness: 0.35 }));
      mast.position.set(L * 0.08, 1.05 + L * 0.62, 0); g.add(mast);
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, L * 0.45, 6), mast.material); boom.rotation.z = Math.PI / 2; boom.position.set(-L * 0.12, 2.0, 0); g.add(boom);
      const furl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, L * 0.4, 6), Mat.std('#2a3a5a', { roughness: 0.8 })); furl.rotation.z = Math.PI / 2; furl.position.set(-L * 0.12, 2.12, 0); g.add(furl);
      g.userData.mastTop = new THREE.Vector3(L * 0.08, 1.05 + L * 1.25, 0);
    }
    return g;
  }

  _boats() {
    const C = this.city, rng = new RNG(CONFIG.seed + 301);
    this.boats = C.boats.map((b) => {
      const g = this._hull(b.L, b.W, b.col, b.sail, b.seed);
      g.rotation.order = 'YXZ'; this.root.add(g);
      // the surge: some break loose (drift toward the quay); one is lifted over the railing onto the coast road
      const loose = !b.anchored && rng.chance(0.35);
      return { ...b, g, loose, dx: rng.range(-6, 6), dz: loose ? rng.range(10, 40) : 0, spin: rng.range(-1.2, 1.2), draft: b.sail ? 1.3 : 0.7 };
    });
    // the hero: a white motor cruiser carried onto the coast road, left lying there when the water goes
    const hero = this.boats.find((b) => !b.sail && !b.anchored && b.x < 10 && b.x > -30) || this.boats[0];
    hero.hero = true; hero.loose = true;
    // pontoons
    this.pontoons = C.pontoons.map((P) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, P.len), Mat.std('#5a5048', { roughness: 0.9 }));
      m.castShadow = true; m.receiveShadow = true; this.root.add(m); return { ...P, m };
    });
  }

  _updateBoats(t, S) {
    const W = this.water;
    for (const P of this.pontoons) {
      const h = Math.max(W.heightAt(P.x, P.z, t), mnBed(P.z) + 0.35);
      P.m.position.set(P.x, h + 0.05, P.z); P.m.rotation.x = W.level < mnBed(P.z) + 0.6 ? 0.03 : 0;
    }
    for (const b of this.boats) {
      // where it is: moored (a little tug and sway) or carried by the surge
      let x = b.x, z = b.z, yaw = b.yaw;
      const sw = Math.sin(t * 0.7 + b.seed * 9) * 0.25;
      if (b.loose && S > 33.6) {
        const k = 1 - Math.exp(-(S - 33.6) / 1.4);
        if (b.hero) { x = MathX.lerp(b.x, 6.5, k); z = MathX.lerp(b.z, 2.5, k); yaw = b.yaw + 1.35 * k; }
        else { x += b.dx * k; z += b.dz * k; yaw += b.spin * k; }
      } else { const pull = MathX.clamp(this.water.U.uFlow.value.y * 0.2, -1, 1); z += pull * 0.8; x += sw; yaw += sw * 0.05; }
      const bed = z > MN_CITY.quayZ ? mnGround(x, z) : mnBed(z), wh = W.heightAt(x, z, t);
      let y = wh - b.draft * 0.55, roll = Math.sin(t * 1.1 + b.seed * 7) * 0.05 * (0.4 + W.U.uRough.value), pitch = Math.sin(t * 0.9 + b.seed * 3) * 0.03 * (0.4 + W.U.uRough.value);
      if (y < bed - 0.05) { y = bed + 0.15; roll = (b.seed - 0.5) * 0.5; pitch = 0.04; }      // grounded: lying over on the mud
      if (b.hero && S > 36.0 && W.level < 2.2) { y = mnGround(x, z) + 0.3; roll = 0.32; pitch = -0.06; }
      b.g.position.set(x, y, z); b.g.rotation.set(pitch, yaw, roll);
    }
  }

  /* ---------------- cars ---------------- */
  _cars() {
    const rng = new RNG(CONFIG.seed + 401), F = this.factory, C = MN_CITY;
    const pal = ['#2b2f36', '#c9c7c0', '#6b6e72', '#7a2620', '#203a5c', '#e2e0da', '#3c4a3a', '#151517', '#8a8f94'];
    const types = ['sedan', 'hatch', 'suv', 'sedan', 'ev', 'van', 'pickup'];
    this.cars = [];
    const add = (spec) => {
      const v = F.build(spec.type || rng.pick(types), spec.col || rng.pick(pal));
      v.group.rotation.order = 'YXZ'; this.root.add(v.group);
      v.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
      const car = { v, ...spec, seed: rng.next(), dx: rng.range(-2.5, 2.5), dz: rng.range(3, 12), spin: rng.range(-1.6, 1.6) };
      this.cars.push(car); return car;
    };
    // parked along both sides of the main street (facing along the street), on the flat and up the hill
    for (const s of [-1, 1]) for (let z = 20; z < 300; z += rng.range(5.6, 9)) if (rng.chance(0.78) && !(z > 158 && z < 174)) add({ x: s * 5.65, z, yaw: s > 0 ? -Math.PI / 2 : Math.PI / 2, parked: true });
    // parked along the coast road, building side
    for (let x = -120; x < 120; x += rng.range(5.4, 8)) if (Math.abs(x) > 12 && rng.chance(0.8)) add({ x, z: C.roadZ[1] - 1.2, yaw: 0, parked: true });
    // traffic on the coast road both ways: they slow and stop as people stare (20–28), then are abandoned
    for (let i = 0; i < 16; i++) {
      const dir = i % 2 ? 1 : -1, lane = dir > 0 ? 1.8 : -2.2;
      add({ traffic: true, dir, lane, x0: rng.range(-260, 260), speed: rng.range(9, 13), stopS: rng.range(20, 27.5) });
    }
    // a police car and an ambulance arrive down the coast road (lights flashing)
    this.police = add({ type: 'sedan', col: '#e8e8e8', traffic: true, dir: -1, lane: -2.2, x0: 180, speed: 15, stopS: 31.0, emergency: true, from: 24.0 });
    this.amb = add({ type: 'van', col: '#f2f0e8', traffic: true, dir: 1, lane: 1.8, x0: -220, speed: 14, stopS: 32.0, emergency: true, from: 26.0 });
    // when each car floats, and when it settles again (scan the depth at its spot)
    for (const c of this.cars) {
      const at = (S) => (c.traffic ? this._trafficX(c, S) : c.x);
      const zz = c.traffic ? c.lane : c.z;
      c.fS = null; c.sS = null;
      for (let S = 30; S < 62; S += 0.05) {
        const d = this.depthAt(at(S), zz, S);
        if (c.fS === null && d > 0.55) c.fS = S;
        if (c.fS !== null && c.sS === null && S > c.fS + 2 && d < 0.35) { c.sS = S; break; }
      }
    }
  }

  // a moving car's x along the coast road at story time S (it decelerates to a stop at stopS)
  _trafficX(c, S) {
    const s0 = c.from || 0, dt = Math.max(0, Math.min(S, c.stopS) - s0), brake = 2.0;
    let d = c.speed * dt;
    if (S > c.stopS - brake) { const u = MathX.clamp((S - (c.stopS - brake)) / brake, 0, 1); d = c.speed * (c.stopS - brake - s0) + c.speed * brake * (u - u * u / 2); }
    let x = c.x0 + c.dir * d;
    x = ((x + 300) % 600 + 600) % 600 - 300;           // (wrap round the visible stretch while driving)
    return x;
  }

  _updateCars(t, S) {
    const W = this.water;
    for (const c of this.cars) {
      const g = c.v.group;
      let x, z, yaw;
      if (c.traffic) { if (c.from && S < c.from) { g.visible = false; continue; } g.visible = true; x = this._trafficX(c, S); z = c.lane; yaw = c.dir > 0 ? 0 : Math.PI; }
      else { x = c.x; z = c.z; yaw = c.yaw; }
      let y = mnGround(x, z) + (z > MN_CITY.walkZ[0] && Math.abs(x) > 12.5 ? 0.14 : 0), roll = 0, pitch = 0;
      // the flood: lift, turn and carry; when the water leaves, settle where it was left
      if (c.fS !== null && S > c.fS) {
        const tau = Math.min(S, c.sS || 1e9) - c.fS, k = 1 - Math.exp(-tau / 2.2);
        const drain = c.sS ? 0 : MathX.smooth(S, 51, 55);
        x += c.dx * k; z += c.dz * k - 3.0 * drain * k; yaw += c.spin * k;
        const g0 = mnGround(x, z);
        if (!c.sS || S < c.sS) {
          const wh = W.heightAt(x, z, t);
          y = Math.max(g0, wh - 0.85); roll = Math.sin(t * 1.3 + c.seed * 9) * 0.06; pitch = Math.sin(t * 1.1 + c.seed * 5) * 0.05 + 0.05;
        } else { y = g0; roll = (c.seed - 0.5) * 0.08; }
      }
      g.position.set(x, y, z); g.rotation.set(pitch, yaw, roll);
      // lights: traffic moving at night has headlights (points), emergency vehicles flash
      if (c.tail && c.v.tail) c.v.tail.emissiveIntensity = 0.6;
    }
  }

  /* ---------------- floating debris ---------------- */
  _debris() {
    const rng = new RNG(CONFIG.seed + 501), kinds = [
      [new THREE.BoxGeometry(0.9, 0.5, 0.6), Mat.std('#6a5236', { roughness: 0.9 })],
      [new THREE.BoxGeometry(2.2, 0.06, 0.22), Mat.std('#7a6448', { roughness: 0.9 })],
      [new THREE.CylinderGeometry(0.3, 0.26, 0.95, 8), Mat.std('#2c4a3a', { roughness: 0.6 })],
      [new THREE.ConeGeometry(0.18, 0.6, 8), Mat.std('#d0581e', { roughness: 0.6 })],
      [new THREE.BoxGeometry(0.5, 0.12, 0.7), Mat.std('#3a6ea0', { roughness: 0.5 })],
    ];
    this.debris = [];
    for (let i = 0; i < 140; i++) {
      const [geo, mat] = rng.pick(kinds), m = new THREE.Mesh(geo, mat);
      m.castShadow = true; this.root.add(m);
      const zone = rng.next();
      let x = zone < 0.5 ? rng.range(-11, 11) : rng.range(-60, 60); const z = zone < 0.5 ? rng.range(-18, 60) : rng.range(-19, 12);
      if (Math.abs(x + 1.8) < 3.2 && z < 30) x += x > -1.8 ? 4 : -4;            // (keep clear of your run up the street)
      this.debris.push({ m, x, z, dz: rng.range(6, 22), dx: rng.range(-3, 3), spin: rng.range(-2, 2), seed: rng.next() });
    }
  }

  _updateDebris(t, S) {
    const W = this.water;
    for (const d of this.debris) {
      const k = S > 33.4 ? 1 - Math.exp(-(S - 33.4) / 3) : 0, drain = MathX.smooth(S, 50, 55);
      const x = d.x + d.dx * k + Math.sin(t * 0.4 + d.seed * 9) * 0.6, z = d.z + d.dz * k - d.dz * 0.6 * drain;
      const on = S > 33.4 && S < 56 && this.depthAt(x, z, S) > 0.12;
      d.m.visible = on;
      if (!on) continue;
      const wh = W.heightAt(x, z, t), g = mnGround(x, z);
      d.m.position.set(x, Math.max(g + 0.05, wh + 0.02), z);
      d.m.rotation.set(Math.sin(t * 1.2 + d.seed * 5) * 0.2, d.spin * k + d.seed * 6, Math.sin(t + d.seed * 3) * 0.2);
    }
  }

  /* ---------------- moving lights: headlights, flashing emergency lights, the lighthouse ---------------- */
  _dynLights() {
    const n = 64, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
    this.dynMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 1 } },
      vertexShader: /* glsl */`attribute vec3 aCol; attribute float aSize; uniform float uPx; varying vec3 vCol;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; float d = -mv.z; vCol = aCol;
          gl_PointSize = aSize > 0.0 ? max(aSize * uPx * clamp(220.0 / d, 0.8, 5.0), 1.5 * uPx) : 0.0; }`,
      fragmentShader: /* glsl */`varying vec3 vCol; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard; gl_FragColor = vec4(vCol * (exp(-r2 * 4.0) * 1.4 + exp(-r2 * 20.0) * 3.0), 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.dyn = new THREE.Points(g, this.dynMat); this.dyn.frustumCulled = false; this.dyn.renderOrder = 6; this.root.add(this.dyn);
    // the lighthouse beam (a long soft cone that sweeps)
    const cone = new THREE.ConeGeometry(6, 260, 24, 1, true); cone.translate(0, -130, 0); cone.rotateZ(Math.PI / 2);
    this.beam = new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: '#fff2d0', transparent: true, opacity: 0.012, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true }));
    this.beam.position.set(...this.city.lighthouse); this.root.add(this.beam);
  }

  _updateDyn(t, S, power) {
    const P = this.dyn.geometry.attributes.position, Cc = this.dyn.geometry.attributes.aCol, Z = this.dyn.geometry.attributes.aSize;
    let k = 0;
    const put = (x, y, z, r, g, b, s) => { if (k >= 64) return; P.setXYZ(k, x, y, z); Cc.setXYZ(k, r, g, b); Z.setX(k, s); k++; };
    for (const c of this.cars) {
      if (!c.traffic || !c.v.group.visible) continue;
      const g = c.v.group, fwd = new THREE.Vector3(Math.cos(g.rotation.y), 0, -Math.sin(g.rotation.y)), side = new THREE.Vector3(-fwd.z, 0, fwd.x), half = c.v.L / 2;
      const moving = S < c.stopS + 6 && !(c.fS && S > c.fS);
      if (moving) for (const s of [-0.6, 0.6]) put(g.position.x + fwd.x * half + side.x * s, g.position.y + 0.7, g.position.z + fwd.z * half + side.z * s, 1.0, 0.92, 0.8, 1.3);
      if (c.emergency && S < (c.fS || 99)) {
        const ph = Math.floor(t * 6 + c.seed * 4) % 2;
        put(g.position.x - side.x * 0.4, g.position.y + c.v.height + 0.15, g.position.z - side.z * 0.4, ph ? 1.0 : 0.05, 0.05, ph ? 0.05 : 1.0, 1.6);
        put(g.position.x + side.x * 0.4, g.position.y + c.v.height + 0.15, g.position.z + side.z * 0.4, ph ? 0.05 : 1.0, 0.05, ph ? 1.0 : 0.05, 1.6);
      }
    }
    // the lighthouse lamp
    const L = this.city.lighthouse; put(L[0], L[1], L[2], 1.0, 0.95, 0.8, 2.0 * (power > 0.05 && !this.lighthouseDown ? 1 : 0));
    for (; k < 64; k++) Z.setX(k, 0);
    P.needsUpdate = true; Cc.needsUpdate = true; Z.needsUpdate = true;
    this.beam.rotation.y = t * 0.9; this.beam.visible = power > 0.05 && !this.lighthouseDown;
  }

  update(t, S) {
    const q = mnQuake(S), pw = mnPower(S), app = this.app;
    this.city.update(t, S, q, pw);
    this.water.update(t, S);
    this._updateBoats(t, S);
    this._updateCars(t, S);
    this._updateDebris(t, S);
    this._updateDyn(t, S, pw);
    this.cast.update(S);
    const px = app.renderer.getDrawingBufferSize(this._sz || (this._sz = new THREE.Vector2())).y / 1920 * 2.0;
    this.city.lightMat.uniforms.uPx.value = px; this.dynMat.uniforms.uPx.value = px;
  }
}
