/* =====================================================================
   CAST — the friend across the street, walkers, the drone pilot, the site crew; the avenue's traffic,
   the ambulance, the police car; the highway's traffic, the 110 km/h car and the car that goes supersonic;
   the parked cars in the lot (their alarms go off); the drone; pigeons on a roof.
   People react to each boom when it reaches THEM (sndPoliceBoomAt / sndPlaneBoomAt), not when it reaches you.
   ===================================================================== */

// (when each shock front reaches a point: sndPoliceBoomAt / sndPlaneBoomAt / sndSportBoomAt in script.js)

// --- film poses (add to the shared rig) --------------------------------------------------------------------------
Object.assign(ACTIONS, {
  // claps: hands meet 0.15 s after the action starts, then every 0.6 s
  clap(τ, c) {
    const p = ACTIONS.idle(τ, c), ph = ((τ - 0.15) / 0.6 % 1 + 1) % 1;
    const open = ph < 0.5 ? MathX.smooth(ph, 0.0, 0.45) : 1 - MathX.smooth(ph, 0.55, 1.0);
    const a = -0.32 + 0.6 * open;
    p.lSh = [1.2, a]; p.rSh = [1.2, a]; p.lEl = 0.95 + 0.25 * open; p.rEl = 0.95 + 0.25 * open;
    p.spine = 0.02; p.neck = -0.02; p.headYaw = 0;
    return p;
  },
  wave(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.rSh = [2.55, 0.42]; p.rEl = 0.55 + 0.4 * Math.sin(τ * 10); p.lSh = [0.1, 0.1]; p.headYaw = 0; p.neck = -0.05;
    return p;
  },
  shout(τ, c) {
    const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.25);
    p.lSh = [1.35 * k, 0.45 * k]; p.rSh = [1.35 * k, 0.45 * k]; p.lEl = 2.25 * k; p.rEl = 2.25 * k;
    p.spine = -0.08 * k; p.neck = -0.2 * k; p.mouth = 1; p.headYaw = 0;
    return p;
  },
  lookUp(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.neck = -0.55 + 0.06 * Math.sin(τ * 0.8 + c.seed * 5); p.spine = -0.08; p.headYaw = noise1(τ * 0.3, c.seedI) * 0.25;
    return p;
  },
  pointUp(τ, c) {
    const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.5);
    p.rSh = [2.35 * k, 0.25]; p.rEl = 0.15;
    return p;
  },
  pilot(τ, c) {     // holding the controller at the chest, looking at the drone
    const p = ACTIONS.idle(τ, c);
    p.lSh = [0.62, 0.05]; p.rSh = [0.62, 0.05]; p.lEl = 1.7; p.rEl = 1.7; p.neck = 0.12; p.headYaw = 0.1 * Math.sin(τ * 0.7);
    return p;
  },
  pilotUp(τ, c) { const p = ACTIONS.pilot(τ, c); p.neck = -0.35; return p; },
  // the shock hits: a flinch with the hands up to the ears, then a crouch
  duck(τ, c) {
    const p = basePose(), k = Math.min(1, τ / 0.18), cr = MathX.smooth(τ, 0.1, 0.6);
    p.lSh = [1.9 * k, 0.55]; p.rSh = [1.9 * k, 0.55]; p.lEl = 2.45 * k; p.rEl = 2.45 * k;
    p.spine = 0.25 + 0.35 * cr; p.neck = 0.35; p.hipY = 0.93 - 0.28 * cr;
    p.lHip = [0.55 * cr, 0.12]; p.rHip = [0.5 * cr, 0.12]; p.lKnee = 1.1 * cr; p.rKnee = 1.0 * cr; p.lFoot = 0.3 * cr; p.rFoot = 0.3 * cr;
    return p;
  },
  flinchUp(τ, c) {     // a short startle while standing (arms half up), then looking about
    const p = ACTIONS.idle(τ, c), k = Math.exp(-τ / 0.5) * Math.min(1, τ / 0.08);
    p.lSh = [0.9 * k, 0.35 * k]; p.rSh = [0.9 * k, 0.35 * k]; p.lEl = 1.6 * k; p.rEl = 1.6 * k; p.spine = 0.18 * k; p.neck = 0.2 * k;
    p.headYaw = (1 - k) * Math.sin(τ * 1.4 + c.seed * 3) * 0.6;
    return p;
  },
});
Object.assign(BLEND, { clap: 0.25, wave: 0.3, shout: 0.18, lookUp: 0.8, pointUp: 0.4, pilot: 0.5, pilotUp: 0.6, duck: 0.08, flinchUp: 0.06 });
Object.assign(LOOKS, {
  sndFriend: { skin: 1, build: 'avg', shirt: '#b8862c', sleeves: 'long', pants: '#2c3440', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#2a1a12', jacket: true, collar: true, inner: '#e8e2d4' },
  sndPilot: { skin: 4, build: 'avg', shirt: '#3b5f7a', sleeves: 'long', pants: '#3a3a36', shoes: '#cfcac0', sole: '#e8e4dc', hair: '#111', hat: { type: 'cap', color: '#a33a2a' }, backpack: '#2b2e30' },
  sndCop: { skin: 2, build: 'broad', shirt: '#22344f', sleeves: 'long', pants: '#1c2533', shoes: '#111', sole: '#222', hair: '#1a1410' },
});

// --- the cast: [id, look, path [[t,x,z]...], states, face?] ------------------------------------------------------
const SND_PEOPLE = [
  ['F', 'sndFriend', [[0, SND.friend.x, SND.friend.z]], [[0, 'idle'], [0.4, 'clap'], [3.15, 'idle'], [4.2, 'wave'], [4.95, 'clap'], [6.6, 'idle'], [7.1, 'shout'], [8.3, 'wave'], [9.5, 'idle'], [11.5, 'look']], -140],
  ['P', 'sndPilot', [[0, SND.pilot.x, SND.pilot.z]], [[0, 'pilot'], [SND.drone.up - 0.2, 'pilotUp'], [SND.drone.fall + 0.25, 'pilot']], 137],
  // walkers on your sidewalk: one comes toward you under the title and passes on your right; one walks away
  // down the avenue later (they never cross the views you look along)
  ['W1', 'casual6', [[0, 11.5, -14], [12, 11.5, 14], [40, 11.6, 48]], [[0, 'walk']]],
  ['W3', 'casual3', [[40, 11.4, 10], [71, 11.4, -28]], [[0, 'walk']]],
  // across the street
  ['L1', 'casual2', [[0, -10.6, 8], [45, -10.6, -40], [71, -10.6, -62]], [[0, 'walk']]],
  ['L2', 'casual8', [[0, -9.4, -60], [52, -9.4, 6], [71, -9.4, 26]], [[0, 'walk']]],
  ['L3', 'casual5', [[0, -11.2, -66], [71, -11.2, -18]], [[0, 'walk']]],   // (never beside the friend while you watch them)
  ['L4', 'casual7', [[0, -10.2, -12], [30, -10.2, -12]], [[0, 'idle'], [20, 'look']], 110],
  ['B1', 'casual6', [[0, -10.6, -44.5]], [[0, 'phone']], 80],
  ['B2', 'casual1', [[0, -10.9, -42.2]], [[0, 'idle'], [15, 'look']], 95],
  // lot: a couple walking to their car
  ['C1', 'casual7', [[0, 24.5, -40], [40, 24.5, -8], [71, 24.5, -8]], [[0, 'walk']]],
  ['C2', 'casual3', [[0, 25.3, -41], [40, 25.3, -9], [71, 25.3, -9]], [[0, 'walk']]],
  // the site crew by the pile driver
  ['S1', 'worker', [[0, 36.5, -89]], [[0, 'idle']], -60],
  ['S2', 'worker', [[0, 43.5, -92.5]], [[0, 'look']], 80],
];

class SndCast {
  constructor(app) {
    const scene = app.scene;
    this.app = app;
    // people (+ when each boom reaches each of them → their reaction)
    this.people = SND_PEOPLE.map(([id, look, path, states, face]) => {
      const st = states.slice();
      const p0 = path[path.length - 1], lead = path[0];
      const posAt = (t) => { let q = path[0]; for (let i = 1; i < path.length; i++) if (path[i][0] <= t) q = path[i]; return q; };
      // the airliner's shock: a startle; the police car's (closer, stronger, the glass going): a duck; then looking about
      const cut = 54.2;
      if (id !== 'S1' && id !== 'S2') {
        const pAt = (t) => {   // position at time t (they stop walking at the first shock)
          t = Math.min(t, cut);
          for (let i = 1; i < path.length; i++) if (t <= path[i][0]) { const a = path[i - 1], b = path[i], f = (t - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
          return [p0[1], p0[2]];
        };
        const [qx, qz] = pAt(cut), tQ = sndPlaneBoomAt(qx, qz), tP = sndPoliceBoomAt(qx, qz);
        const keep = st.filter((s) => s[0] < Math.min(tQ, cut));
        keep.push([tQ, 'flinchUp'], [tP, 'duck'], [tP + 2.4 + hash1(id.charCodeAt(0) * 7 + id.length) * 1.2, 'look']);
        st.length = 0; st.push(...keep);
      }
      // reacting people stop walking where they are
      let pth = path;
      if (path.length > 1 && id !== 'S1' && id !== 'S2') {
        const out = [];
        for (const k of path) if (k[0] < cut) out.push(k);
        const a = path.find((k) => k[0] >= cut);
        if (a && out.length) { const b = out[out.length - 1], f = (cut - b[0]) / (a[0] - b[0]); out.push([cut, b[1] + (a[1] - b[1]) * f, b[2] + (a[2] - b[2]) * f]); }
        pth = out.length > 1 ? out : path;
      }
      return new Person({ id, look, y: LAYOUT.curbH, path: pth, states: st, face, faceUntil: undefined }, scene);
    });
    this.shadows = new BlobShadows(scene, 64);

    const F = new VehicleFactory();
    const mk = (type, color, name) => { const c = F.build(type, color); c.group.name = 'veh:' + (name || type); scene.add(c.group); return c; };
    // --- avenue traffic: lane x, start z, speed m/s (+ = toward you); everybody slows when the booms hit
    const lanes = [
      ['sedan', '#6c7a86', 1.75, -10, -12.0], ['suv', '#3d4a44', 5.25, 30, -11.0], ['hatch', '#8a4a3c', 1.75, 175, -12.5], ['van', '#c9c4b8', 5.25, -80, -10.5],
      ['taxi', '#c4a24c', 1.75, -120, -12.0], ['ev', '#2f5d6a', 5.25, 120, -11.5], ['sedan', '#2b2f36', 1.75, 140, -12.2], ['hatch', '#5e6b52', 5.25, 220, -11.0],
      ['pickup', '#7a6a58', 1.75, 250, -12.0], ['sedan', '#9a9a94', 5.25, 330, -11.5], ['suv', '#5a3a36', 1.75, 380, -12.4], ['taxi', '#c4a24c', 5.25, 460, -11.2],
      ['suv', '#4a5866', -5.25, -40, 11.5], ['sedan', '#8c8a84', -5.25, -150, 12.0], ['hatch', '#3a4c5c', -5.25, -260, 11.0], ['van', '#d8d2c4', -5.25, -380, 11.5],
      ['sedan', '#6a3a34', -5.25, -500, 12.0], ['ev', '#c8c8c2', -5.25, -620, 11.2], ['sedan', '#2c3a2e', -5.25, -760, 12.0],
      ['hatch', '#6b6f78', -5.25, -880, 12.5], ['sedan', '#384048', -5.25, 60, 12.0],
    ];
    this.cars = lanes.map(([type, color, x, z0, v], i) => ({ c: mk(type, color), x, z0, v, i, table: null }));
    for (const k of this.cars) k.table = this._driveTable(k);
    // two drivers who stop dead after the police car's shock, in the view you end on (brake lights, hazards):
    // each one's start is solved so it comes to rest at its spot
    for (const [type, color, x, v, zEnd] of [['sedan', '#5d6f7e', 1.75, -11.8, -12.5], ['suv', '#8a8478', -5.25, 11.2, -21.5]]) {
      const k = { c: mk(type, color), x, v, i: this.cars.length, stop: true, z0: 0, table: null };
      let lo = zEnd - v * 80, hi = zEnd;
      if (lo > hi) [lo, hi] = [hi, lo];
      for (let it = 0; it < 36; it++) { k.z0 = (lo + hi) / 2; const zt = this._driveTable(k), zf = zt[zt.length - 1]; if ((zf - zEnd) * Math.sign(v) > 0) { if (v > 0) hi = k.z0; else lo = k.z0; } else { if (v > 0) lo = k.z0; else hi = k.z0; } }
      k.table = this._driveTable(k);
      this.cars.push(k);
    }
    // --- the ambulance and the police car (sirens, light bars)
    this.amb = this._ambulance(F, scene);
    this.police = this._policeCar(F, scene);
    // --- the highway: heroes + steady traffic both ways
    // the car that goes supersonic: low, bright yellow, headlights on (it has to read from 400 m away)
    this.sport = mk('ev', '#ffc21a', 'sport');
    { const hl = new THREE.MeshStandardMaterial({ color: '#fffbe8', emissive: new THREE.Color('#fff4dc'), emissiveIntensity: 7, roughness: 0.2 });
      this.sport.group.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'headlight') o.material = hl; }); }
    const hw = [];
    const lanesH = [[60.0, 1, 27.5], [64.0, -1, 28.5], [66.8, -1, 26.0]];   // (the near +Z lane at SND.sport.x is the hero's)
    lanesH.forEach(([x, dir, v], li) => {
      for (let j = 0; j < 9; j++) {
        const type = ['sedan', 'suv', 'hatch', 'van', 'pickup', 'ev'][(j + li * 2) % 6];
        const col = ['#6c7a86', '#3d4a44', '#8a8478', '#d8d2c4', '#2b2f36', '#5e6b52', '#7a3a34', '#9aa0a6', '#c4a24c'][(j * 3 + li) % 9];
        hw.push({ c: mk(type, col), x, dir, v: v + hash1(j * 13 + li) * 3, z0: -700 + j * 150 + hash1(j * 7 + li * 3) * 60 });
      }
    });
    this.hwCars = hw;
    // --- parked cars in the lot (some will have their alarms go off at the airliner's boom)
    this.parked = [];
    const types = ['sedan', 'hatch', 'suv', 'ev', 'pickup', 'sedan', 'hatch'], cols = ['#6c7a86', '#3d4a44', '#8a4a3c', '#c9c4b8', '#2f5d6a', '#2b2f36', '#5e6b52', '#7a6a58', '#9a9a94', '#5a3a36', '#4a5866', '#b7b2a6'];
    let n = 0;
    for (const x0 of [16.0, 26.0, 36.0]) for (const side of [-1, 1]) for (let z = 0.7; z > -73; z -= 2.6) {
      const hsh = hash2(Math.round(x0 * 10 + side), Math.round(z * 10));
      if (hsh < 0.42) continue;
      if (x0 === 26.0 && side < 0 && z < -6 && z > -42) continue;   // the couple's aisle
      if (x0 === 16.0 && z > -11) continue;                             // the lot entrance: the drone and its pilot
      { const px = x0 + side * 1.35 - 9.4, pz = z - 1.3 - 1, L = Math.hypot(30.6, 96);   // keep the line of sight to the pile driver clear
        if (Math.abs(px * (-96 / L) - pz * (30.6 / L)) < 3.6) continue;
        // ... and the wedge you watch the highway car through (nothing big and boxy under it in the long lens)
        const brg = Math.atan2(-px, -pz) * 180 / Math.PI;
        if (brg > -38 && brg < -3 && Math.hypot(px, pz) < 75) continue; }
      const type = types[n % types.length], c = mk(type, cols[(n * 5) % cols.length], 'parked');
      const x = x0 + side * 1.35;
      c.group.position.set(x, LAYOUT.curbH, z - 1.3);
      c.group.rotation.y = side > 0 ? Math.PI : 0;
      this.parked.push({ c, x, z: z - 1.3, alarm: hsh > 0.7, tA: sndPlaneBoomAt(x, z - 1.3) });
      n++;
    }
    // --- the drone and the pigeons
    this.drone = this._drone(scene);
    this.birds = this._birds(scene);
    this._v = new THREE.Vector3();
  }

  // speed over time for an avenue car: cruise, then slow right down when the booms come, then creep on
  _driveTable(k) {
    const dt = 1 / 30, n = Math.ceil((CONFIG.duration + 1) / dt), zs = new Float32Array(n + 1);
    let z = k.z0;
    for (let i = 0; i <= n; i++) {
      zs[i] = z;
      const t = i * dt;
      let f = 1;
      const tQ = sndPlaneBoomAt(k.x, z);
      f *= 1 - 0.6 * MathX.smooth(t, tQ, tQ + 1.4);                                       // after the airliner's boom: brake
      const tP = sndPoliceBoomAt(k.x, z);
      if (k.stop) f *= 1 - MathX.smooth(t, tP, tP + 1.6);                                     // (or stop dead)
      else f *= 1 - 0.9 * MathX.smooth(t, tP, tP + 1.0) + 0.3 * MathX.smooth(t, tP + 3.5, tP + 7);    // after the police car's: almost stop, then creep
      z += k.v * f * dt;
    }
    return zs;
  }
  _zAt(table, t) { const f = MathX.clamp(t * 30, 0, table.length - 1.001), i = Math.floor(f); return table[i] + (table[i + 1] - table[i]) * (f - i); }

  _lightBar(group, y, L, colors) {
    const bar = new THREE.Group(), m = [];
    for (let i = 0; i < 2; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: '#222', emissive: new THREE.Color(colors[i]), emissiveIntensity: 0, roughness: 0.3 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.5), mat); b.position.set(0, y, (i ? 1 : -1) * 0.3); bar.add(b); m.push(mat);
    }
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 1.2), Mat.std('#1b1d20', { roughness: 0.5 })); base.position.set(0, y - 0.08, 0); bar.add(base);
    bar.position.x = L * 0.12; group.add(bar);
    return m;
  }
  _ambulance(F, scene) {
    const c = F.build('van', '#e9e6de'); c.group.name = 'veh:amb'; scene.add(c.group);
    const red = Mat.std('#b8231d', { roughness: 0.5 });
    for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.02), red); st.position.set(-0.4, 1.15, s * 1.02); c.group.add(st); }
    c.bar = this._lightBar(c.group, 2.5, 0.5, ['#ff2a1a', '#ff2a1a']);
    return c;
  }
  _policeCar(F, scene) {
    const c = F.build('sedan', '#e8e6e0'); c.group.name = 'veh:police'; scene.add(c.group);
    const dark = Mat.std('#1d2a40', { roughness: 0.5 });
    for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.02), dark); st.position.set(0.1, 0.62, s * 0.92); c.group.add(st); }
    c.bar = this._lightBar(c.group, 1.5, -0.6, ['#ff2a1a', '#2a6bff']);
    return c;
  }

  _drone(scene) {
    const g = new THREE.Group(), dark = Mat.std('#2a2d31', { roughness: 0.45 }), grey = Mat.std('#8e959c', { roughness: 0.4, metalness: 0.3 });
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    add(new THREE.BoxGeometry(0.34, 0.1, 0.22), dark, 0, 0, 0);
    add(new THREE.BoxGeometry(0.18, 0.06, 0.14), grey, 0, 0.07, 0);
    add(new THREE.SphereGeometry(0.05, 10, 8), Mat.std('#111', { roughness: 0.2 }), 0.17, -0.07, 0);
    this.droneProps = [];
    const blur = new THREE.MeshBasicMaterial({ color: '#c8ccd0', transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const arm = add(new THREE.BoxGeometry(0.36, 0.03, 0.04), dark, sx * 0.17, 0, sz * 0.13); arm.rotation.y = Math.atan2(sz * 0.13, sx * 0.17) * -1;
      add(new THREE.CylinderGeometry(0.035, 0.04, 0.06, 10), grey, sx * 0.32, 0.03, sz * 0.25);
      const disc = add(new THREE.CircleGeometry(0.17, 24), blur, sx * 0.32, 0.07, sz * 0.25); disc.rotation.x = -Math.PI / 2; disc.castShadow = false;
      const blade = add(new THREE.BoxGeometry(0.34, 0.006, 0.035), dark, sx * 0.32, 0.07, sz * 0.25);
      this.droneProps.push({ disc, blade });
    }
    const led = new THREE.MeshBasicMaterial({ color: '#ff3b2e', toneMapped: false }); add(new THREE.SphereGeometry(0.018, 6, 4), led, 0.33, 0.0, 0.25);
    g.scale.setScalar(1.25);
    scene.add(g);
    return g;
  }

  // pigeons on the roof edge across the street; they burst off when the airliner's boom reaches them
  _birds(scene) {
    const mat = new THREE.MeshStandardMaterial({ color: '#4a4c52', roughness: 0.9, side: THREE.DoubleSide });
    const bodyG = new THREE.ConeGeometry(0.07, 0.34, 6); bodyG.rotateX(Math.PI / 2);
    const wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.08, 0.38, 0, -0.02, 0, 0, 0.1, 0.38, 0, -0.02, 0.3, 0, 0.06, 0, 0, 0.1], 3)); wingG.computeVertexNormals();
    const out = [];
    // (a row on the near roof across the street, then little flocks of five along both sides, far down the avenue:
    //  they go up one flock after another as the shock comes up the street)
    for (let i = 0; i < 110; i++) {
      const g = new THREE.Group(); g.add(new THREE.Mesh(bodyG, mat));
      const wl = new THREE.Mesh(wingG, mat), wr = new THREE.Mesh(wingG, mat); wr.scale.x = -1; g.add(wl, wr);
      g.scale.setScalar(1.9); scene.add(g);
      const fl = Math.floor((i - 20) / 5), side = i < 20 || fl % 2 ? -1 : 1;
      const z = i < 20 ? -14 - i * 1.1 - hash1(i) * 0.6 : -40 - fl * 15 - ((i - 20) % 5) * 0.9 - hash1(i) * 2;
      const x = side * (12.75 + hash1(i * 31) * 0.25), y = this._roofAt(side, z) + 0.15;
      out.push({ g, wl, wr, x, y, z, s: hash1(i * 17 + 3), tA: sndPlaneBoomAt(x, z) - 0.05 + hash1(i * 5) * 0.15 });
    }
    return out;
  }

  _roofAt(side, z) { const r = (this.app.env.roofs || []).find((b) => b.side === side && z >= b.z0 && z <= b.z1); return r ? r.H : 17.8; }

  update(t) {
    const B = this.shadows, h = LAYOUT.curbH;
    B.begin();
    for (const p of this.people) { p.update(t); const q = p.root.position; B.push(q.x, q.y + 0.012, q.z, 0.55, 0.45); }
    // avenue cars
    const place = (c, x, y, z, dir) => { const g = c.group; g.position.set(x, y, z); g.rotation.y = (dir > 0 ? Math.PI : 0) + Math.PI / 2; for (const w of c.wheels) w.rotation.z = -(dir > 0 ? z : -z) / c.r; };
    for (const k of this.cars) { const z = this._zAt(k.table, t); place(k.c, k.x, 0, z, k.v); const br = this._zAt(k.table, t - 0.12) - z, br2 = this._zAt(k.table, t - 0.24) - this._zAt(k.table, t - 0.12); const tPk = sndPoliceBoomAt(k.x, z); k.c.tail.emissiveIntensity = Math.abs(br2) - Math.abs(br) > 0.004 || (k.stop && t > tPk) ? 5.5 : 0.6; k.c.hazard.emissiveIntensity = t > tPk + 1.2 && (k.stop || k.i % 3 === 0) && Math.floor(t * 2.2) % 2 ? 6 : 0; if (Math.abs(z) < 120) B.push(k.x, 0.01, z, 1.2, 0.5, 2.6); }
    // ambulance: drives through; its lights flash
    { const q = sndAmb(t), c = this.amb; place(c, q.x, 0, q.z, 1); c.group.visible = t > 12 && t < 32; const on = Math.floor(t * 5) % 2; c.bar[0].emissiveIntensity = on ? 7 : 0.3; c.bar[1].emissiveIntensity = on ? 0.3 : 7; if (c.group.visible) B.push(q.x, 0.01, q.z, 1.3, 0.5, 2.9); }
    { const q = sndPolice(t), c = this.police; place(c, q.x, 0, q.z, 1); c.group.visible = t > 49 && t < 60; const on = Math.floor(t * 7) % 2; c.bar[0].emissiveIntensity = on ? 8 : 0.3; c.bar[1].emissiveIntensity = on ? 0.3 : 8; if (c.group.visible) B.push(q.x, 0.01, q.z, 1.2, 0.5, 2.6); }
    // highway
    const top = SND_CITY.hwy.top;
    { const q = sndSport(t); place(this.sport, SND.sport.x, top, q.z, 1); this.sport.group.visible = t > 22 && t < 42; }
    for (const k of this.hwCars) { const z = k.z0 + k.dir * k.v * t; place(k.c, k.x, top, z, k.dir); }
    // parked cars: alarms (hazards) from the airliner's boom on
    for (const k of this.parked) { const on = k.alarm && t > k.tA + 0.25 && Math.floor((t - k.tA) * 2.2) % 2 === 0; k.c.hazard.emissiveIntensity = on ? 6 : 0; if (Math.abs(k.z) < 70) B.push(k.x, h + 0.01, k.z, 1.15, 0.45, 2.5); }
    B.end();
    // drone
    {
      const d = sndDrone(t), g = this.drone;
      g.position.set(d.x, LAYOUT.curbH + d.y, d.z); g.rotation.set(d.pitch, 0.6, d.roll);
      this.droneProps.forEach((p, i) => { p.disc.visible = d.spin > 0; p.blade.visible = d.spin === 0; p.disc.material.opacity = 0.26 + 0.1 * Math.sin(t * 60 + i); p.disc.rotation.z = t * 90 + i; });
    }
    // pigeons
    for (const b of this.birds) {
      const u = t - b.tA;
      if (u < 0) { b.g.position.set(b.x, b.y, b.z); b.g.rotation.set(0, Math.PI / 2 + (b.s - 0.5), 0); b.wl.rotation.z = b.wr.rotation.z = 1.2; continue; }
      const ang = (b.s - 0.5) * 1.6;
      b.g.position.set(b.x - u * (3 + b.s * 3) * Math.cos(ang) * 0.4, b.y + u * (2.5 + b.s * 2) - 0.3 * Math.sin(u * 3), b.z - u * (5 + 4 * b.s) * Math.sin(ang + 1.2));
      b.g.rotation.set(-0.3, Math.PI / 2 + ang, 0);
      const f = Math.sin(u * 26 + b.s * 9) * 0.9; b.wl.rotation.z = f; b.wr.rotation.z = -f;
    }
  }
}
