/* =====================================================================
   CASCADE — v3: what fails after the first minute, all as pure functions of story time.
     · the light: late afternoon → smoky afternoon (+20 min) → dusk and night (+6 h) → a grey morning (+2 days)
       → an overcast afternoon (+2 weeks) → night again for the close (mdSky);
     · the city's windows at dusk, and the blackout that sweeps across it district by district (MdCityLights);
     · fires: a car fire under the viaduct, the airliner's fuel burning on the water, buildings across the city
       that nobody puts out (flames, smoke columns, the glow on the clouds);
     · the airliner on final approach that nobody is flying (the shared AircraftSystem flies SCRIPT.aircraft);
     · the nuclear power station across the harbour: shut down safely, cooled by diesel generators, until the
       diesel runs out (the reactor building's roof blows off, as the hydrogen explosions did at Fukushima in 2011);
     · sewage in the harbour once the pumps lose power.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// the airliner: final approach over the harbour toward the airport ahead, about 70 m up, wings level, gear down.
// Approaches are flown by hand below a few hundred metres; with nobody at the controls the trim it was flying with
// carries it on down, a wing drops, and it flies into the water short of the runway.
// ---------------------------------------------------------------------------------------------------------------------
const MD_PLANE_HIT = [330, 0, 110];
SCRIPT.aircraft = {
  path: [
    [MD.plane[0] - 1.0, -25, 64, 345],
    [MD.plane[0], 40, 54, 280],
    [MD.plane[0] + 1.6, 145, 40, 218],
    [MD.planeHit - 1.0, 262, 22, 145],
    [MD.planeHit, MD_PLANE_HIT[0], 1.5, MD_PLANE_HIT[2]],
  ],
  bank: [[MD.plane[0] - 1, 0], [MD.plane[0] + 0.6, 4], [MD.planeHit - 1.4, 18], [MD.planeHit, 34]],
};

// ---------------------------------------------------------------------------------------------------------------------
// the light through the film: night 0..1, smoke haze 0..1, the glow of fires on the cloud 0..1
// ---------------------------------------------------------------------------------------------------------------------
function mdSky(t) {
  const S = { night: 0, haze: 0, glow: 0, grey: 0 };
  if (t < MD.fires[0]) { S.haze = 0.25 * MathX.smooth(t, MD.planeHit, MD.planeHit + 8); return S; }
  if (t < MD.grid[0]) { S.haze = 0.45; S.grey = 0.2; return S; }
  if (t < MD.water[0]) {
    const u = t - MD.grid[0];
    S.night = 0.5 + 0.38 * MathX.smooth(u, 0, 5.5); S.haze = 0.5; S.grey = 0.2;
    S.glow = 0.35 + 0.65 * MathX.smooth(t, MD.blackout, MD.blackout + 2.5);
    return S;
  }
  if (t < MD.food[0]) { S.night = 0.12; S.haze = 0.2; S.grey = 0.75; S.glow = 0.1; return S; }
  if (t < MD.end[0]) { S.night = 0.78; S.haze = 0.3; S.grey = 0.6; S.glow = 0.15; return S; }
  S.night = 0.93; S.haze = 0.6; S.grey = 0.4; S.glow = 1.0;
  return S;
}

// ---------------------------------------------------------------------------------------------------------------------
// fires: [x, y, z, start (world minutes), grow (min), width, height, burn (min, then dies down), smoke strength]
// ---------------------------------------------------------------------------------------------------------------------
const MD_FIRES = [
  [-25.5, 2.6, 62.5, 0.4, 3, 4.5, 6, 600, 0.7],                  // the SUV and the van under the viaduct
  [MD_PLANE_HIT[0], 0.5, MD_PLANE_HIT[2], 0, 0.02, 34, 22, 400, 1.6],   // the jet fuel on the water
  [-44.5, 12, 128, 4, 10, 14, 16, 900, 1.0],                     // a waterfront block (a kitchen; then the floors above)
  [-43.5, 18, 214, 9, 14, 18, 20, 1200, 1.1],
  [-88, 40, 300, 30, 60, 22, 26, 1500, 1.2],
  [-260, 70, 380, 60, 120, 30, 34, 2400, 1.3],
  [-140, 30, 160, 140, 90, 24, 26, 2000, 1.1],
  [-42, 24, 176, 12, 12, 12, 14, 1000, 0.9],                     // more of the waterfront: an upper floor
  [-24, 2.6, 96, 1.5, 4, 4, 5, 500, 0.6],                        // a car that ran into a lamp post
  [-42, 6, 246, 15, 10, 14, 12, 900, 1.0],
  [-420, 50, 620, 200, 180, 34, 40, 3000, 1.4],
  [-75, 14, 470, 300, 120, 20, 22, 2400, 1.0],
  [-560, 60, 260, 400, 300, 40, 44, 4000, 1.5],
  [-330, 40, 840, 500, 300, 36, 40, 4000, 1.4],
  [1230, 10, -260, 120, 200, 40, 30, 5000, 1.5],                 // across the harbour: the terminal's fuel store
];
function mdFireLevel(F, w) { return MathX.smooth(w, F[3], F[3] + F[4]) * (1 - 0.75 * MathX.smooth(w, F[3] + F[7], F[3] + F[7] * 2.5)); }

// the power station across the harbour (on the terminal side, to the right)
const MD_OUTFALL = [-30];
const MD_NUKE = { x: 1330, z: 700, ry: -0.35 };

class MdCascade {
  constructor(app) {
    const scene = app.scene;
    this.app = app;
    this.env = app.env;
    // the airliner
    this.plane = new AircraftSystem(scene);
    this.plane.group.scale.setScalar(1.0);
    // flames (additive procedural billboards), glows, smoke
    this.flames = new FlameSystem(scene);
    // a fire placed inside a building moves out to the face that looks at the viaduct (+x), below the roof
    for (const F of MD_FIRES) {
      const B = (this.env.cityRects || []).find((r) => F[0] > r.x0 && F[0] < r.x1 && F[2] > r.z0 && F[2] < r.z1);
      if (B) { F[5] *= 1.5; F[6] *= 1.6; F[0] = B.x1 + 0.6; F[1] = Math.max(B.y0 + 1, Math.min(F[1], B.y0 + B.h - F[6] * 0.55)); }
    }
    this.flameMeshes = MD_FIRES.map((F, i) => { const m = this.flames.add(new THREE.Vector3(F[0], F[1], F[2]), F[5], F[6], i * 1.37 + 0.2); m.visible = false; return m; });
    this.glows = new BillboardSystem(scene, 400, true);
    this.glows.mesh.renderOrder = 6;
    this.smoke = new BillboardSystem(scene, 2600, false);
    this.smoke.mesh.renderOrder = 3;
    this.fireLights = [0, 1, 2].map(() => { const L = new THREE.PointLight('#ff8a3a', 0, 160, 1.6); scene.add(L); return L; });
    // the city's windows
    this.city = this._cityLights(scene);
    // the wreck: the tail fin standing out of the water after the crash
    this.tail = this._tail(scene);
    // the power station
    this.nuke = this._nuke(scene);
    // the storm outfall in the quay wall (the sewage comes out here once the lift stations stop)
    const pm = new THREE.MeshStandardMaterial({ color: '#3b3a36', roughness: 0.9 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3.2, 16, 1, true), pm); pipe.material.side = THREE.DoubleSide;
    pipe.rotation.x = Math.PI / 2; pipe.position.set(MD_OUTFALL[0], 0.9, MD_G.shoreZ - 0.8); scene.add(pipe);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.25, 8, 20), pm); ring.position.set(MD_OUTFALL[0], 0.9, MD_G.shoreZ - 2.4); scene.add(ring);
  }

  /* ---------------- the city's lit windows: one merged mesh; the blackout runs on a uniform ---------------- */
  _cityLights(scene) {
    const pos = [], seed = [], order = [];
    const rng = new RNG(8811);
    const push = (ax, ay, az, bx, bz, w, h, sd, od) => {
      // a quad from (ax, ay, az) across the facade (direction bx, bz) w wide, h tall
      const x1 = ax + bx * w, z1 = az + bz * w;
      const q = [[ax, ay, az], [x1, ay, z1], [x1, ay + h, z1], [ax, ay + h, az]];
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...q[k]); seed.push(sd); order.push(od); }
    };
    for (const B of this.env.cityRects || []) {
      // which district goes dark when: a wave from the harbour edge inland, broken into blocks
      const cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2;
      const district = Math.floor(cx / 140) * 31 + Math.floor(cz / 160) * 17;
      const od = MathX.clamp(0.08 + Math.hypot(cx + 20, cz - 60) / 1300 + hash1(district) * 0.25, 0, 1);
      const floorH = B.kind === 'tower' ? 3.6 : 3.3, bay = B.kind === 'tower' ? 3.4 : 3.1;
      const lit = B.kind === 'tower' ? 0.42 : 0.5;
      // the faces toward the harbour (+x) and toward the basin and the viaduct (−z)
      for (const [fx, fz, len, bx, bz] of [[B.x1 + 0.12, B.z1, B.z1 - B.z0, 0, -1], [B.x0, B.z0 - 0.12, B.x1 - B.x0, 1, 0]]) {
        const cols = Math.floor((len - 1) / bay);
        for (let f = 0; B.y0 + f * floorH + 2.2 < B.h - 0.6; f++) {
          for (let c = 0; c < cols; c++) {
            if (rng.next() > lit) continue;
            const a = 0.6 + c * bay + 0.5;
            push(fx + bx * a, B.y0 + f * floorH + 0.9, fz + bz * a, bx, bz, bay * 0.55, floorH * 0.48, rng.next(), od);
          }
        }
      }
    }
    // the street lamps along the waterfront road
    for (let z = MD_G.shoreZ + 12; z < 900; z += 24) push(MD_G.roadX + 7 + 3.0 - 0.35, MD_G.quay + 7.2, z - 0.35, 0, 1, 0.7, 0.18, 0.99, MathX.clamp(0.05 + (z - 20) / 2600, 0, 1));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    g.setAttribute('aOrder', new THREE.Float32BufferAttribute(order, 1));
    const U = this.cityU = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uOn: { value: 0 }, uCut: { value: -1 }, uTime: { value: 0 } });
    const mat = new THREE.ShaderMaterial({
      uniforms: U, fog: true, side: THREE.DoubleSide, depthWrite: true,
      vertexShader: /* glsl */`
        attribute float aSeed, aOrder; varying float vSeed, vOrder;
        ${THREE.ShaderChunk.fog_pars_vertex}
        void main(){ vSeed = aSeed; vOrder = aOrder; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          ${THREE.ShaderChunk.fog_vertex}
        }`,
      fragmentShader: /* glsl */`
        uniform float uOn, uCut, uTime; varying float vSeed, vOrder;
        ${THREE.ShaderChunk.fog_pars_fragment}
        void main(){
          // the blackout: each district flickers for a moment, then goes dark
          float d = uCut - vOrder;
          float flick = step(0.0, d + 0.05) * step(d, 0.0) * step(0.5, fract(sin((uTime + vSeed) * 91.7) * 4375.5));
          float on = uOn * (1.0 - step(0.0, d)) * (1.0 - flick);
          if (on < 0.01) discard;
          vec3 warm = mix(vec3(1.0, 0.78, 0.48), vec3(0.85, 0.9, 1.0), step(0.8, vSeed));
          gl_FragColor = vec4(warm * (0.9 + 0.5 * vSeed) * on * 1.6, 1.0);
          ${THREE.ShaderChunk.fog_fragment}
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'cityLights'; mesh.frustumCulled = false; mesh.renderOrder = 1;
    scene.add(mesh);
    return mesh;
  }

  _tail(scene) {
    const g = new THREE.Group(); g.name = 'wreck';
    const m = new THREE.MeshStandardMaterial({ color: '#34465e', roughness: 0.6, side: THREE.DoubleSide });
    const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(6.5, 0); fin.lineTo(4.2, 8.5); fin.lineTo(1.8, 8.5); fin.closePath();
    const f = new THREE.Mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.4, bevelEnabled: false }), m); f.position.set(-3, 1.5, -0.2); g.add(f);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 7, 12), new THREE.MeshStandardMaterial({ color: '#d8d8d4', roughness: 0.5 })); body.rotation.z = Math.PI / 2 - 0.35; body.position.set(0, 0.6, 0); g.add(body);
    g.position.set(MD_PLANE_HIT[0] + 22, 0, MD_PLANE_HIT[2] - 6); g.rotation.set(0.12, 0.9, -0.25);
    g.visible = false; scene.add(g);
    return g;
  }

  /* ---------------- the nuclear power station across the harbour ---------------- */
  _nuke(scene) {
    const g = new THREE.Group(); g.name = 'nuke';
    const Q = MD_G.quay, wall = Mat.std('#cfcabd', { roughness: 0.8 }), grey = Mat.std('#8f9296', { roughness: 0.7 }), dark = Mat.std('#3a3d40', { roughness: 0.8 }), blue = Mat.std('#5f7b93', { roughness: 0.6 });
    const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); g.add(o); return o; };
    // two hyperbolic cooling towers
    const prof = []; for (let i = 0; i <= 12; i++) { const y = i / 12 * 140; const r = 38 - 22 * Math.sin(i / 12 * Math.PI * 0.82) + (i > 9 ? (i - 9) * 1.6 : 0); prof.push(new THREE.Vector2(r, y)); }
    const tw = new THREE.LatheGeometry(prof, 32);
    const towerM = Mat.std('#c9c5bb', { roughness: 0.9, side: THREE.DoubleSide });
    this.towers = [add(tw, towerM, 150, Q, 90), add(tw, towerM, 150, Q, -50)];
    // two reactor buildings (boxy, Fukushima-like) with the turbine hall in front
    this.reactors = [];
    for (const [dz, k] of [[60, 0], [-10, 1]]) {
      const base = add(new THREE.BoxGeometry(46, 38, 46), wall, -60, Q + 19, dz);
      const roof = add(new THREE.BoxGeometry(46, 14, 46), blue, -60, Q + 45, dz);       // the upper floor (refuelling level): what the explosion removes
      add(new THREE.BoxGeometry(46.4, 1.2, 46.4), grey, -60, Q + 38.4, dz);
      this.reactors.push({ base, roof, k });
    }
    add(new THREE.BoxGeometry(40, 26, 150), wall, 20, Q + 13, 25);                    // turbine hall
    add(new THREE.BoxGeometry(41, 2, 151), dark, 20, Q + 26.5, 25);
    add(new THREE.CylinderGeometry(2.2, 3, 110, 10), grey, 90, Q + 55, 25);           // the stack
    for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(10, 30, 4), grey, -60 - i * 16, Q + 15, -110);   // pylons
    g.position.set(MD_NUKE.x, 0, MD_NUKE.z); g.rotation.y = MD_NUKE.ry;
    scene.add(g);
    return g;
  }

  // world position of a point in the power station's frame
  _nukePt(x, y, z, out) { const c = Math.cos(MD_NUKE.ry), s = Math.sin(MD_NUKE.ry); return out.set(MD_NUKE.x + x * c + z * s, y, MD_NUKE.z - x * s + z * c); }

  update(t, camera) {
    const W = mdWorldMin(t), sky = mdSky(t), V = this._v || (this._v = new THREE.Vector3());
    this.plane.update(t);
    // --- the city's windows: on at dusk; the blackout sweeps across from MD.blackout
    const U = this.cityU;
    U.uOn.value = MathX.smooth(sky.night, 0.35, 0.7) * (t >= MD.grid[0] && t < MD.water[0] ? 1 : 0);
    const db = t - MD.blackout; U.uCut.value = db < 0 ? -1 : db < 0.55 ? 0.42 : db < 1.1 ? 0.72 : 1.6;   // three hard steps
    U.uTime.value = Math.floor(t * 12) / 12;
    U.fogColor.value.copy(this.app.scene.fog.color); U.fogDensity.value = this.app.scene.fog.density;
    this.city.visible = U.uOn.value > 0.01;
    // --- the wreck's tail stands out of the water once the spray settles (the fuel burns around it)
    this.tail.visible = t > MD.planeHit + 0.6;
    // --- fires, glows, smoke
    const G = this.glows, S = this.smoke, fog = this.app.scene.fog;
    G.begin(fog); S.begin(fog);
    S.uniforms.uLight.value = MathX.lerp(0.62, 0.16, sky.night);
    G.uniforms.uLight.value = 1;
    const lightsUsed = [];
    MD_FIRES.forEach((F, i) => {
      let lv = mdFireLevel(F, W);
      if (i === 1) lv = t < MD.planeHit ? 0 : MathX.smooth(t, MD.planeHit, MD.planeHit + 0.25) * (t < MD.fires[0] ? 1 : 0.55);
      const m = this.flameMeshes[i];
      m.visible = lv > 0.01;
      if (m.visible) {
        m.material.uniforms.uTime.value = t + i * 3.1;
        m.material.uniforms.uLevel.value = lv * (0.85 + 0.15 * noise1(t * 5 + i * 10, 2));
        m.rotation.y = Math.atan2(camera.position.x - F[0], camera.position.z - F[2]);
        m.scale.set(F[5] * (0.6 + 0.4 * lv), F[6] * (0.5 + 0.5 * lv), 1);
        // a warm glow around the fire (bigger at night)
        const gs = F[5] * (0.8 + 0.7 * sky.night) * lv;
        G.push(F[0] + 5, F[1] + F[6] * 0.5, F[2], gs, 0, 0.2 * lv * (0.35 + 0.65 * sky.night), 1, 1.0, 0.5, 0.18);
        const dcam = Math.hypot(camera.position.x - F[0], camera.position.z - F[2]);
        lightsUsed.push([dcam, F, lv]);
      }
      // the smoke column: puffs rising and drifting downwind (+x, a little −z)
      const sm = F[8] * lv;
      if (sm > 0.02) this._column(S, F[0], F[1] + F[6] * 0.6, F[2], t, sm, F[5], i, sky);
    });
    // the three nearest fires light their surroundings
    lightsUsed.sort((a, b) => a[0] - b[0]);
    this.fireLights.forEach((L, k) => {
      const e = lightsUsed[k];
      if (!e) { L.intensity = 0; return; }
      const [, F, lv] = e;
      L.position.set(F[0], F[1] + F[6] * 0.4, F[2]);
      L.distance = F[5] * 9; L.intensity = lv * F[5] * 40 * (0.3 + 0.7 * sky.night) * (0.85 + 0.15 * noise1(t * 7 + k, 2));
    });
    // --- the plane's impact: a fireball and a wall of spray
    const dp = t - MD.planeHit;
    if (dp > 0 && dp < 6) {
      const [hx, , hz] = MD_PLANE_HIT;
      for (let i = 0; i < 70; i++) {
        const h1 = hash1(i * 3.1 + 1), h2 = hash1(i * 5.7 + 2), h3 = hash1(i * 9.3 + 3), a = h1 * 6.283;
        const u = Math.max(0, dp - h3 * 0.25), r = (6 + 34 * h2) * (1 - Math.exp(-u / 0.45));
        const x = hx - 30 * h2 * (1 - Math.exp(-u)) + Math.cos(a) * r, z = hz + Math.sin(a) * r * 0.6, y = 2 + (10 + 40 * h3) * (1 - Math.exp(-u / 0.6)) + u * 3;
        G.push(x, y, z, 14 + 26 * h2 + u * 6, h1 * 6, 0.9 * Math.exp(-u / 0.55) * Math.min(1, u / 0.05), 1, 1.0, 0.55 + 0.3 * h3, 0.2);
        S.push(x + u * 3, y + u * 5, z, 16 + u * 14, h2 * 6, 0.55 * Math.min(1, u / 0.4) * Math.exp(-u / 4), 0.22, 0.25, 0.23, 0.22);
      }
      // a tall white spray column, then a dark smoke stalk from the burning fuel
      for (let i = 0; i < 40; i++) {
        const h1 = hash1(i * 1.9 + 31), h2 = hash1(i * 4.3 + 32), k = i / 40, rise = (1 - Math.exp(-dp / 0.5)) * (15 + 70 * k);
        const fall = Math.max(0, dp - 1.2) * Math.max(0, dp - 1.2) * 4.9 * 0.6;
        const y = Math.max(1, rise - fall), al = 0.8 * Math.min(1, dp / 0.06) * Math.exp(-Math.max(0, dp - 1.5) / 1.2);
        S.push(hx + (h1 - 0.5) * (8 + 14 * k), y, hz + (h2 - 0.5) * 8, 10 + 12 * k + dp * 4, h1 * 6, al, 1.0, 0.96, 0.97, 0.98);
      }
      for (let i = 0; i < 30; i++) {
        const h1 = hash1(i * 6.1 + 41), ph = (dp * 0.12 + i / 30) % 1, up = 4 + ph * 90 * Math.min(1, dp / 2);
        S.push(hx - 10 + ph * 30 + (h1 - 0.5) * 8, up, hz + (h1 - 0.5) * 10, 10 + 22 * ph, h1 * 6, 0.75 * Math.min(1, (dp - 0.4) / 0.8) * (1 - ph) * (dp > 0.4 ? 1 : 0), 0.12, 0.25, 0.23, 0.22);
      }
      for (let i = 0; i < 60; i++) {
        const h1 = hash1(i * 7.7 + 5), h2 = hash1(i * 2.3 + 6), u = Math.min(dp, 2.8), vy = 14 + 26 * h2, vx = -20 - 30 * h1;
        const y = Math.max(0.5, vy * u - 4.9 * u * u), x = hx + 40 * h1 - 20 + vx * 0.15 * u, z = hz + (h2 - 0.5) * 50;
        S.push(x, y, z, 6 + dp * 5, h1 * 6, 0.65 * Math.exp(-dp / 1.3) * Math.min(1, dp / 0.08), 1.0, 0.97, 0.97, 0.98);
      }
    }
    // --- the power station: steam from the towers while it runs; after the hit, the reactor building's top floor goes
    this._nukeUpdate(t, W, G, S);
    // --- the outfall: a brown gush into the basin
    if (t >= MD.water[0]) {
      const ox = MD_OUTFALL[0], oz = MD_G.shoreZ - 2.4;
      for (let i = 0; i < 46; i++) {
        const h1 = hash1(i * 3.3 + 70), ph = (t * 0.9 + i / 46) % 1, u = ph * 1.1, v = 4.5 + 1.5 * h1;
        const y = 0.9 - 4.9 * u * u * 0.6, z = oz - v * u, x = ox + (h1 - 0.5) * 1.6;
        if (y < -0.2) continue;
        S.push(x, Math.max(0.9, y), z, 0.9 + 0.9 * ph, h1 * 6, 0.85 * (1 - ph * 0.5), 0.3, 0.42, 0.33, 0.2);
      }
      for (let i = 0; i < 26; i++) {   // foam where it lands
        const h1 = hash1(i * 5.1 + 90), h2 = hash1(i * 7.9 + 91), ph = (t * 0.25 + h1) % 1;
        S.push(ox + (h2 - 0.5) * 6 + ph * 2, 1.0, oz - 4 - h1 * 8 - ph * 6, 1.2 + 1.5 * ph, h2 * 6, 0.4 * (1 - ph), 0.35, 0.5, 0.42, 0.28);
      }
    }
    G.end(); S.end();
    // --- the sky's fire glow, toward the city (−x, +z)
    const EU = this.env.skyUniforms;
    EU.uGlow.value.set(-0.75, 0.66, 2.0, 0.5 * sky.glow);
  }

  _column(S, x, y, z, t, k, w, seed, sky) {
    const n = Math.round(10 + 22 * Math.min(1, k)), life = 9 + 6 * hash1(seed * 7.1), rise = 4.5 + 3 * k;
    for (let j = 0; j < n; j++) {
      const ph = (t / life + j / n + hash1(seed * 13 + j) * 0.05) % 1, age = ph * life;
      const h1 = hash1(seed * 31 + j * 1.7), up = age * rise * (1 + 0.15 * h1);
      const px = x + (h1 - 0.5) * w * 0.4 + age * age * 0.12 + up * 0.32, pz = z + (hash1(j + seed) - 0.5) * w * 0.4 - up * 0.08;
      const size = w * (0.7 + 0.25 * age) * (0.8 + 0.4 * h1);
      const al = 0.55 * Math.min(1, k) * Math.min(1, ph / 0.08) * (1 - ph) ;
      const shade = MathX.lerp(0.2, 0.1, h1);
      S.push(px, y + up, pz, size, h1 * 6 + t * 0.05, al, shade, 0.9, 0.86, 0.84);
    }
  }

  _nukeUpdate(t, W, G, S) {
    const V = this._nv || (this._nv = new THREE.Vector3());
    // the towers steam only while the plant runs (it trips off when the grid fails)
    const running = t < MD.blackout ? 1 : 0;
    if (running) for (const tw of this.towers) {
      tw.getWorldPosition(V);
      for (let j = 0; j < 12; j++) { const ph = (t / 10 + j / 12) % 1; S.push(V.x + ph * 60, 150 + ph * 70, V.z - ph * 10, 50 + ph * 70, j, 0.35 * (1 - ph) * Math.min(1, ph / 0.1), 0.95, 1, 1, 1); }
    }
    // the hydrogen explosion: the top floor of reactor 1 disappears in a white-grey burst; a plume rises after
    const d = t - MD.nukeBang, R = this.reactors[0];
    R.roof.visible = d < 0.08;
    if (d > 0) {
      this._nukePt(-60, MD_G.quay + 45, 60, V);
      for (let i = 0; i < 80; i++) {
        const h1 = hash1(i * 4.1 + 11), h2 = hash1(i * 6.3 + 12), h3 = hash1(i * 8.9 + 13), a = h1 * 6.283, u = Math.max(0, d - h3 * 0.15);
        const r = (14 + 95 * h2) * (1 - Math.exp(-u / 0.35)), up = (25 + 190 * h3) * (1 - Math.exp(-u / 0.7)) + u * 8;
        const al = 0.8 * Math.min(1, u / 0.04) * Math.exp(-u / 6);
        S.push(V.x + Math.cos(a) * r + u * 4, V.y + up, V.z + Math.sin(a) * r * 0.7, 26 + 55 * h2 + u * 10, h1 * 6, al, MathX.lerp(0.4, 0.16, h3), 0.9, 0.85, 0.78);
        if (i < 24) G.push(V.x + Math.cos(a) * r * 0.5, V.y + up * 0.4, V.z, 14 + 22 * h2, h1, 0.55 * Math.exp(-u / 0.12), 1, 1, 0.6, 0.25);
      }
      // debris (dark specks thrown out)
      for (let i = 0; i < 40; i++) {
        const h1 = hash1(i * 2.9 + 21), h2 = hash1(i * 3.7 + 22), u = Math.min(d, 4), a = h1 * 6.283, vh = 25 + 45 * h2, vy = 30 + 50 * hash1(i + 40);
        const y = V.y + vy * u - 4.9 * u * u; if (y < MD_G.quay) continue;
        G.push(V.x + Math.cos(a) * vh * u, y, V.z + Math.sin(a) * vh * u * 0.7, 2 + 2.5 * h2, h1, 0.9 * Math.exp(-u / 1.6), 1, 1.0, 0.55, 0.2);   // burning debris
      }
    }
  }
}
