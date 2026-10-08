/* =====================================================================
   TRAFFIC — the cars, each on springs. When gravity doubles every body
   sinks on its suspension (twice the weight compresses the springs twice
   as far) with a damped bounce; horizontally nothing changes (same mass,
   same inertia), so the traffic keeps moving.
     · the low coupe: now ~9 cm lower, it grounds on the raised crossing → sparks
     · the loaded box truck: its rear-right leaf spring snaps on the crossing, the corner drops, it limps to a stop
     · the builders' pickup on the sidewalk: the pallet lands on its cab (dented through a vertex shader),
       then the scaffold folds across it
     · the ambulance that arrives later
   Cars use the shared VehicleFactory (js/world/vehicles.js); the coupe profile and the box truck are this film's.
   ===================================================================== */

// a low coupe body for the factory (x from the rear bumper; heights in metres)
CAR_PROFILES.gvCoupe = {
  L: 4.5, W: 1.86, r: 0.32, axles: [0.92, 3.62], yb: 0.17,
  top: [[0.04, 0.2], [0.0, 0.42], [0.03, 0.74], [0.24, 0.84], [0.98, 0.86], [3.36, 0.84], [4.18, 0.66], [4.44, 0.52], [4.5, 0.36], [4.42, 0.18]],
  gh: [[0.98, 0.85], [1.86, 1.22], [2.58, 1.23], [3.42, 0.84]],
  win: [[[1.24, 0.9], [1.9, 1.17], [2.5, 1.18], [2.98, 0.9]]],
  rearGlass: [0, 1], windshield: [2, 3], head: 0.6, tail: 0.72, grille: false,
};

// a box truck (copied from the Friction film's frBuildTruck, owned here): forward +X, right +Z, origin on the ground
function gvBuildTruck(factory, color) {
  const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
  const L = 8.2, W = 2.4, r = 0.5;
  const paint = factory.paint(color), cabPaint = factory.paint('#2d5f8a'), M = factory.m;
  const tail = new THREE.MeshStandardMaterial({ color: '#5a0d0d', emissive: new THREE.Color('#ff1a0e'), emissiveIntensity: 0.6, roughness: 0.3 });
  const hazard = new THREE.MeshStandardMaterial({ color: '#7a4a10', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0, roughness: 0.3 });
  const add = (geo, mat, x, y, z, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const x0 = -L / 2, boxL = 5.45, boxX = x0 + boxL / 2, floorY = 1.0, boxH = 2.55;
  add(new THREE.BoxGeometry(L - 0.4, 0.25, 1.1), M.trim, 0, 0.72, 0);
  add(new THREE.BoxGeometry(boxL, boxH, W), paint, boxX, floorY + boxH / 2, 0);
  add(new THREE.BoxGeometry(boxL + 0.04, 0.12, W + 0.04), M.trim, boxX, floorY + 0.06, 0);
  const logo = Tex.label([['STONE & TILE', 64], ['BUILDING SUPPLIES · HEAVY LOADS', 30]], { w: 1024, h: 256, bg: '#efece4', fg: '#7a3a22' });
  const lm = new THREE.MeshStandardMaterial({ map: logo, roughness: 0.6 });
  for (const sz of [-1, 1]) { const p = add(new THREE.PlaneGeometry(4.2, 1.05), lm, boxX + 0.2, floorY + 1.45, sz * (W / 2 + 0.006)); p.rotation.y = sz > 0 ? 0 : Math.PI; p.castShadow = false; }
  const doorTex = Tex.canvas(64, 256), dx = doorTex.getContext('2d');
  dx.fillStyle = '#d9d6cc'; dx.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 16) { dx.fillStyle = '#b9b5aa'; dx.fillRect(0, y, 64, 2); }
  const door = add(new THREE.PlaneGeometry(W - 0.1, boxH - 0.08), new THREE.MeshStandardMaterial({ map: Tex.tex(doorTex), roughness: 0.6, side: THREE.DoubleSide }), x0 - 0.012, floorY + (boxH - 0.08) / 2, 0);
  door.rotation.y = -Math.PI / 2;
  const cabX = x0 + boxL + 1.05;
  add(new THREE.BoxGeometry(2.0, 1.25, W - 0.1), cabPaint, cabX, 0.95 + 0.62, 0);
  add(new THREE.BoxGeometry(1.45, 0.95, W - 0.14), cabPaint, cabX - 0.27, 2.2 + 0.47 - 0.05, 0);
  const ws = add(new THREE.BoxGeometry(0.06, 0.9, W - 0.3), M.glass, cabX + 0.55, 2.62, 0); ws.rotation.z = 0.32;
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.9, 0.62, 0.02), M.glass, cabX - 0.2, 2.62, sz * (W / 2 - 0.04));
  add(new THREE.BoxGeometry(0.06, 0.55, W * 0.62), M.trim, cabX + 1.0, 1.25, 0);
  add(new THREE.BoxGeometry(0.2, 0.3, W), M.trim, cabX + 1.02, 0.72, 0);
  for (const sz of [-1, 1]) {
    add(new THREE.BoxGeometry(0.06, 0.18, 0.32), M.head, cabX + 1.02, 1.0, sz * (W / 2 - 0.3));
    add(new THREE.BoxGeometry(0.05, 0.22, 0.14), tail, x0 - 0.03, 1.2, sz * (W / 2 - 0.16));
    add(new THREE.BoxGeometry(0.06, 0.08, 0.14), hazard, cabX + 1.02, 0.82, sz * (W / 2 - 0.12));
    add(new THREE.BoxGeometry(0.06, 0.1, 0.14), hazard, x0 - 0.03, 1.42, sz * (W / 2 - 0.16));
    add(new THREE.BoxGeometry(0.08, 0.32, 0.06), M.trim, cabX + 0.45, 2.45, sz * (W / 2 + 0.22));
  }
  // the rear leaf springs (visible under the box: they flatten, and the right one snaps)
  const leaf = Mat.std('#2a2b2d', { roughness: 0.6, metalness: 0.5 }), springs = [];
  for (const sz of [-1, 1]) { const s = add(new THREE.BoxGeometry(1.4, 0.12, 0.09), leaf, x0 + 1.25, 0.7, sz * 0.62, group); springs.push(s); }
  const wheels = [], wg = factory.wheelGeo(r, 0.28);
  for (const [ax, dual] of [[x0 + 1.25, true], [cabX + 0.2, false]]) for (const sz of [-1, 1]) {
    const w = new THREE.Mesh(wg, [M.tire, M.rim, M.rim]); w.position.set(ax, r, sz * (W / 2 - 0.2)); group.add(w); wheels.push(w);
    if (dual) { const w2 = new THREE.Mesh(wg, [M.tire, M.rim, M.rim]); w2.position.set(ax, r, sz * (W / 2 - 0.5)); group.add(w2); w.userData.twin = w2; }
  }
  return { group, body, wheels, r, tail, hazard, L, W, height: floorY + boxH, springs, axles: [x0 + 1.25, cabX + 0.2] };
}

// a vehicle body that can be dented: its materials are cloned and get a vertex dent (car-local centre, radius, depth)
function gvCrushable(group, n = 3) {
  const U = { uDent: { value: Array.from({ length: n }, () => new THREE.Vector4(0, 0, 1, 0)) }, uGlass: { value: 1 } };
  const cache = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const mats = [].concat(o.material).map((m) => {
      if (cache.has(m)) return cache.get(m);
      const c = m.clone(); c.name = (m.name || '') + '_crush';
      const glass = /glass/i.test(m.name || '');
      c.onBeforeCompile = (sh) => {
        sh.uniforms.uDent = U.uDent; sh.uniforms.uGlass = U.uGlass;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nuniform vec4 uDent[${n}];`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            for (int i = 0; i < ${n}; i++) {
              vec4 D = uDent[i]; vec2 q = transformed.xz - D.xy;
              float k = exp(-dot(q, q) / (D.z * D.z)) * smoothstep(0.35, 1.25, transformed.y);
              transformed.y -= D.w * k; transformed.xz += normalize(q + 1e-4) * D.w * k * 0.25;
            }`);
        if (glass) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlass;').replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb = mix(vec3(0.55, 0.58, 0.6), gl_FragColor.rgb, uGlass);');
      };
      c.customProgramCacheKey = () => 'gvcrush' + n + (glass ? 'g' : '');
      c.userData.grime = 0;
      cache.set(m, c); return c;
    });
    o.material = Array.isArray(o.material) ? mats : mats[0];
  });
  return U;
}

class GvTraffic {
  constructor(scene) {
    const F = new VehicleFactory(); this.factory = F; this.scene = scene;
    this.cars = [];
    const add = (id, type, color, spec) => {
      const v = type === 'box' ? gvBuildTruck(F, color) : F.build(type, color);
      v.group.name = 'veh:' + id; scene.add(v.group);
      const P = CAR_PROFILES[type] || { axles: v.axles ? [v.axles[0] + 4.1, v.axles[1] + 4.1] : [1, 3.8], L: v.L || 4.7 };
      const L = v.L || P.L, ax = v.axles || P.axles.map((a) => a - L / 2);
      const car = Object.assign({ id, type, v, L, ax, x: 0, sag: 0.07, zt: null }, spec);
      if (spec.z) car.zt = new Track(spec.z, 'linear');
      this.cars.push(car); return car;
    };
    const C = GV_CITY;
    // moving (all heading away from you, −Z, in the two right-hand lanes; the far lanes are the crane's work zone)
    add('sedanA', 'sedan', '#7c8a96', { x: 1.75, z: [[0, 26], [12, -100]], sag: 0.075 });
    add('taxi', 'taxi', '#c4a24c', { x: 5.25, z: [[0, 14], [3.0, -10], [9, -58], [16, -118]], sag: 0.08 });
    add('suvA', 'suv', '#3d4a44', { x: 1.75, z: [[0, 60], [8, 4], [16, -60], [24, -124]], sag: 0.065 });
    add('hatchA', 'hatch', '#8a4a3c', { x: 5.25, z: [[0, 70], [12, 20], [17, -18], [22, -60], [30, -110]], sag: 0.075 });
    // the coupe (passes you at 30 km/h, grounds on the crossing) and the loaded truck behind it
    this.coupe = add('coupe', 'gvCoupe', '#2c3e57', { x: 5.15, z: [[0, 120], [GV.coupe - 3.0, 26.0], [GV.coupe + 4.0, -32.0], [GV.coupe + 9, -90]], sag: 0.095 });
    this.truck = add('truck', 'box', '#efece4', { x: 5.0, z: [[0, 140], [GV.truck - 3.0, 22.0], [GV.truck + 1.3, -3.2], [GV.truck + 4.6, -33.5, 'outQuad'], [80, -33.5]], sag: 0.13 });
    add('sedanB', 'sedan', '#5d6670', { x: 1.75, z: [[0, 150], [GV.truck - 3, 40], [GV.truck + 2, -30], [GV.truck + 7, -95]], sag: 0.075 });
    add('vanB', 'van', '#c9c4b8', { x: 1.75, z: [[0, 190], [38, 30], [44, -26], [50, -90]], sag: 0.1 });
    // the ambulance: comes up behind you, stops by the wreck, lights going
    this.amb = add('amb', 'van', '#f0eee8', { x: 1.75, z: [[0, 300], [46.0, 60], [50.2, -7.5, 'outQuad'], [80, -7.5]], sag: 0.1 });
    this._ambDress(this.amb);
    // parked: the left kerb (near you), far down both kerbs
    for (const [id, type, col, x, z] of [['pL1', 'sedan', '#6f6a62', -5.6, 3.5], ['pL2', 'suv', '#2f3b46', -5.6, 9.8], ['pL3', 'hatch', '#9a8f7a', -5.6, 16.2], ['pL4', 'ev', '#4a5a58', -5.6, 22.6],
      ['pR1', 'sedan', '#3b4049', 5.6, -42.0], ['pR2', 'van', '#d8d4ca', 5.6, -52.0], ['pL5', 'hatch', '#7a3a32', -5.6, -50.5], ['pR3', 'suv', '#55606a', 5.6, 36.0], ['pR4', 'sedan', '#8b8f92', 5.6, 43.0]]) add(id, type, col, { x, z0: z, parked: true, sag: 0.07 });
    // the builders' pickup on the sidewalk under the loading bay, nose toward the junction
    this.pickup = add('pickup', 'pickup', '#e9e7e1', { x: C.pickup.x, z0: C.pickup.z, parked: true, onKerb: true, sag: 0.08 });
    this.pickupDent = gvCrushable(this.pickup.v.group);
    // the cones round the crane's work zone
    const cone = Mat.std('#d2602a', { roughness: 0.6 }), white = Mat.std('#e8e6e0', { roughness: 0.6 });
    for (let z = -12; z > -44; z -= 3.2) { const c = gvMesh(new THREE.ConeGeometry(0.17, 0.62, 10), cone, scene, -0.15, 0.31, z); gvMesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 10), white, c, 0, 0.05, 0, 0, 0, 0, false); }
  }

  _ambDress(car) {
    const g = car.v.body, red = Mat.std('#b8231d', { roughness: 0.5 }), yel = Mat.std('#d8c23a', { roughness: 0.5 });
    for (const sz of [-1, 1]) { gvBox(4.0, 0.22, 0.02, red, g, -0.4, 1.05, sz * 1.02, 0, 0, 0, false); gvBox(4.0, 0.12, 0.02, yel, g, -0.4, 1.3, sz * 1.02, 0, 0, 0, false); }
    this.ambLights = [];
    for (const [x, z, c] of [[1.1, -0.55, '#ff2a22'], [1.1, 0.55, '#3a6bff'], [-2.5, -0.7, '#ff2a22'], [-2.5, 0.7, '#3a6bff']]) {
      const m = new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: 0, roughness: 0.3 });
      gvBox(0.3, 0.14, 0.5, m, g, x, 2.47, z, 0, 0, 0, false); this.ambLights.push(m);
    }
  }

  // the static sag every sprung body takes when gravity doubles (with its bounce)
  sagAt(c, t) { return c.sag * gvSpring(t, c.type === 'box' ? 1.0 : 1.35, c.type === 'box' ? 0.22 : 0.28, GV.g0 + 0.05 + hash1(c.id.length * 7.1 + c.sag * 100) * 0.08); }

  update(t) {
    for (const c of this.cars) {
      const g = c.v.group, body = c.v.body;
      const z = c.zt ? c.zt.value(t) : c.z0;
      const dz = c.zt ? (c.zt.value(t + 0.02) - c.zt.value(t - 0.02)) / 0.04 : 0;
      g.position.set(c.x, c.onKerb ? LAYOUT.curbH : 0, z);
      g.rotation.set(0, Math.PI / 2, 0);                          // local +X → world −Z
      // the wheels ride the road (the speed table): front and rear axle heights → body lift and pitch
      const zf = z - c.ax[1], zr = z - c.ax[0];
      const hf = c.onKerb ? 0 : gvRoadH(c.x, zf), hr = c.onKerb ? 0 : gvRoadH(c.x, zr);
      const wb = c.ax[1] - c.ax[0];
      let y = (hf + hr) / 2 - this.sagAt(c, t), pitch = Math.atan2(hf - hr, wb), roll = 0;
      // speed bump rebound: the body bobs after each axle passes a ramp
      const bob = c.parked ? 0 : 0.012 * Math.sin(t * 9) * Math.min(1, Math.abs(hf - hr) * 20);
      y += bob;
      if (c === this.coupe) { const s = this._coupe(t, z); y += s.y; pitch += s.p; }
      if (c === this.truck) { const s = this._truck(t, z); y += s.y; pitch += s.p; roll += s.r; }
      body.position.set(0, y, 0);
      body.rotation.set(roll, 0, pitch);                          // (car local: z-rotation = nose up/down, x-rotation = roll)
      // wheels: spin by distance; they stay on the road (the body moves on them)
      const dist = c.zt ? c.zt.value(0) - z : 0;
      for (const w of c.v.wheels) {
        w.rotation.z = -dist / (c.v.r || 0.33);
        const wz = w.position.x > 0 ? hf : hr;
        w.position.y = (c.v.r || 0.33) + wz;
        if (w.userData.twin) { w.userData.twin.rotation.z = w.rotation.z; w.userData.twin.position.y = w.position.y; }
      }
      // brake lights when slowing
      if (c.v.tail) c.v.tail.emissiveIntensity = c.parked ? 0.25 : (dz > -2 && !c.parked && c.zt && t > 1 ? 2.2 : 0.6);
    }
    // the truck's hazards after the spring goes; the ambulance's lights
    if (this.truck.v.hazard) this.truck.v.hazard.emissiveIntensity = t > GV.truck + 2.0 && (t * 1.5) % 1 < 0.5 ? 2.6 : 0;
    this.ambLights.forEach((m, i) => { m.emissiveIntensity = t > 46 ? ((t * 2.6 + (i % 2) * 0.5) % 1 < 0.5 ? 3.2 : 0.1) : 0; });
    // the pickup's cab: dented by the pallet, flattened further by the scaffold
    const P = GV_FALL.pallet, D = this.pickupDent.uDent.value;
    const hit = MathX.smooth(t, P.hit - 0.02, P.hit + 0.08), fold = MathX.smooth(t, GV.scaffold.fold + 0.75, GV.scaffold.fold + 1.0);
    D[0].set(0.35, 0.25, 0.85, 0.42 * hit + 0.12 * fold);                    // the cab roof (car-local x forward)
    D[1].set(-1.6, -0.3, 1.1, 0.22 * fold);                                  // the bed, under the scaffold
    D[2].set(1.6, 0.6, 0.7, 0.1 * hit);                                      // the bonnet's back edge
    this.pickupDent.uGlass.value = 1 - hit;
  }

  // the coupe: front lip grounds on the ramp up (sparks), the floor drags over the top edge, the tail kicks on the way off
  _coupe(t, z) {
    const T = GV_CITY.table;
    let y = 0, p = 0;
    const zf = z - this.coupe.ax[1];
    if (t > GV.g0) {
      const lip = MathX.window(zf, T.z1 - 0.2, T.z1 + T.ramp + 0.4, 0.3, 0.25);   // the nose rides on its lip up the ramp
      y += 0.03 * lip; p += -0.02 * lip;
      y += 0.02 * gvJolt(t, this.scrapeT(0), 7, 0.15) + 0.025 * gvJolt(t, this.scrapeT(1), 6, 0.2);
    }
    return { y, p };
  }
  // when the coupe's lip / floor scrape (story time): the front axle reaching the up-ramp, the rear reaching the down-ramp
  scrapeT(i) {
    if (!this._sc) {
      const T = GV_CITY.table, c = this.coupe, find = (zt, axle) => { for (let t = GV.coupe - 3; t < GV.coupe + 5; t += 0.005) if (c.zt.value(t) - axle < zt) return t; return GV.coupe; };
      this._sc = [find(T.z1 + T.ramp * 0.6, c.ax[1]), find(T.z0 - T.ramp * 0.2, c.ax[0])];
    }
    return this._sc[i];
  }
  // the truck: overloaded springs near their stops; the rear-right leaf snaps climbing the ramp
  _truck(t, z) {
    const snap = this.snapT();
    let y = 0, p = 0, r = 0;
    if (t > snap) {
      const k = MathX.smooth(t, snap, snap + 0.12);
      y -= 0.1 * k; p -= 0.035 * k; r += 0.065 * k;                          // rear-right corner down; the box leans
      r += 0.02 * gvJolt(t, snap + 0.12, 1.4, 0.5);
      this.truck.v.springs[1].rotation.z = 0.5 * k; this.truck.v.springs[1].position.y = 0.7 - 0.2 * k;
    } else { this.truck.v.springs[1].rotation.z = 0; this.truck.v.springs[1].position.y = 0.7; }
    return { y, p, r };
  }
  snapT() {
    if (!this._sn) { const T = GV_CITY.table, c = this.truck; for (let t = GV.truck - 2; t < GV.truck + 4; t += 0.005) if (c.zt.value(t) - c.ax[0] < T.z1 + 0.15) { this._sn = t; break; } }
    return this._sn || GV.truck + 1.2;
  }
  pos(id, out) { const c = this.cars.find((k) => k.id === id); return out.copy(c.v.group.position); }
}
