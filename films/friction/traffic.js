/* =====================================================================
   TRAFFIC — the friction film's vehicles: the shared car factory
   (js/world/vehicles.js) plus a box truck, all placed from the
   simulation each frame. Wheels show what the tyres are doing — rolling,
   locked (brake lights on), or spinning uselessly (a radial blur, a puff
   of exhaust, and no smoke: no friction, no burnout). Front wheels steer
   without effect. Hits jolt the body; on the hill the cars tilt with the
   slope.
   ===================================================================== */

// a box truck (local frame like the factory's cars: forward +X, right +Z, origin on the ground at the centre)
function frBuildTruck(factory, color) {
  const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
  const L = FR_DIMS.truck[0], W = FR_DIMS.truck[1], r = 0.5;
  const paint = factory.paint(color), cabPaint = factory.paint('#2d5f8a'), M = factory.m;
  const tail = new THREE.MeshStandardMaterial({ color: '#5a0d0d', emissive: new THREE.Color('#ff1a0e'), emissiveIntensity: 0.6, roughness: 0.3 });
  const hazard = new THREE.MeshStandardMaterial({ color: '#7a4a10', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0, roughness: 0.3 });
  const add = (geo, mat, x, y, z, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const x0 = -L / 2, boxL = 5.45, boxX = x0 + boxL / 2, floorY = 1.0, boxH = 2.55;
  // chassis rails and the cargo box (with a logo on each side)
  add(new THREE.BoxGeometry(L - 0.4, 0.25, 1.1), M.trim, 0, 0.72, 0);
  add(new THREE.BoxGeometry(boxL, boxH, W), paint, boxX, floorY + boxH / 2, 0);
  add(new THREE.BoxGeometry(boxL + 0.04, 0.12, W + 0.04), M.trim, boxX, floorY + 0.06, 0);
  const logo = Tex.label([['FRESH & CO', 70], ['DELIVERIES', 34]], { w: 1024, h: 256, bg: '#f2efe6', fg: '#2d5f8a' });
  const lm = new THREE.MeshStandardMaterial({ map: logo, roughness: 0.6 });
  for (const sz of [-1, 1]) { const p = add(new THREE.PlaneGeometry(4.2, 1.05), lm, boxX + 0.2, floorY + 1.45, sz * (W / 2 + 0.006)); p.rotation.y = sz > 0 ? 0 : Math.PI; p.castShadow = false; }
  // the roll-up door at the back (it bursts open when the truck takes its big hit)
  const doorG = new THREE.Group(); doorG.position.set(x0 - 0.012, floorY, 0); body.add(doorG);
  const doorTex = Tex.canvas(64, 256), dx = doorTex.getContext('2d');
  dx.fillStyle = '#d9d6cc'; dx.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 16) { dx.fillStyle = '#b9b5aa'; dx.fillRect(0, y, 64, 2); }
  const door = add(new THREE.PlaneGeometry(W - 0.1, boxH - 0.08), new THREE.MeshStandardMaterial({ map: Tex.tex(doorTex), roughness: 0.6, side: THREE.DoubleSide }), 0, (boxH - 0.08) / 2, 0, doorG);
  door.rotation.y = -Math.PI / 2;
  // dark inside of the box, seen once the door is up
  const inside = add(new THREE.PlaneGeometry(W - 0.12, boxH - 0.1), new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 1 }), x0 + 0.04, floorY + boxH / 2, 0);
  inside.rotation.y = -Math.PI / 2; inside.visible = false;
  // cab: body, windscreen, side windows, grille, bumper, lights, mirrors
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
    add(new THREE.BoxGeometry(0.08, 0.32, 0.06), M.trim, cabX + 0.45, 2.45, sz * (W / 2 + 0.22));
  }
  // wheels: steering pair at the cab, dual pairs at the back
  const wheels = [], wg = factory.wheelGeo(r, 0.28);
  for (const [ax, dual] of [[x0 + 1.25, true], [cabX + 0.2, false]]) for (const sz of [-1, 1]) {
    const w = new THREE.Mesh(wg, [M.tire, M.rim, M.rim]); w.position.set(ax, r, sz * (W / 2 - 0.2)); group.add(w); wheels.push(w);
    if (dual) { const w2 = new THREE.Mesh(wg, [M.tire, M.rim, M.rim]); w2.position.set(ax, r, sz * (W / 2 - 0.5)); group.add(w2); w.userData.twin = w2; }
  }
  return { group, body, wheels, r, tail, hazard, L, W, height: floorY + boxH, door: doorG, inside, exhaust: new THREE.Vector3(x0 + boxL + 0.2, 0.4, -W / 2 + 0.2) };
}

class FrTraffic {
  constructor(scene, world) {
    this.world = world;
    this.factory = new VehicleFactory();
    this.cars = [];
    // a radial blur disc laid over a spinning wheel
    const bc = Tex.canvas(128, 128), bx = bc.getContext('2d');
    const gr = bx.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(120,120,124,0.95)'); gr.addColorStop(0.55, 'rgba(70,70,74,0.9)'); gr.addColorStop(0.8, 'rgba(22,22,24,0.95)'); gr.addColorStop(1, 'rgba(22,22,24,0)');
    bx.fillStyle = gr; bx.beginPath(); bx.arc(64, 64, 64, 0, Math.PI * 2); bx.fill();
    for (let a = 0; a < 12; a++) { bx.strokeStyle = 'rgba(200,200,205,0.18)'; bx.lineWidth = 3; bx.beginPath(); bx.arc(64, 64, 22 + a * 3, a, a + 2.2); bx.stroke(); }
    const blurTex = Tex.tex(bc, { repeat: false });
    // a high-contrast five-spoke wheel face, so a spinning wheel and a still one look different
    const sc = Tex.canvas(128, 128), sx = sc.getContext('2d');
    sx.fillStyle = '#18181a'; sx.beginPath(); sx.arc(64, 64, 64, 0, Math.PI * 2); sx.fill();
    sx.fillStyle = '#d9dde0'; sx.beginPath(); sx.arc(64, 64, 44, 0, Math.PI * 2); sx.fill();
    sx.fillStyle = '#2a2c30'; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 + 0.3; sx.beginPath(); sx.moveTo(64, 64); sx.arc(64, 64, 40, a, a + 0.55); sx.closePath(); sx.fill(); }
    sx.fillStyle = '#9aa0a6'; sx.beginPath(); sx.arc(64, 64, 9, 0, Math.PI * 2); sx.fill();
    const spokeTex = Tex.tex(sc, { repeat: false });
    const all = FR_CARS.map(([id, type, color, , , , , o]) => ({ id, type, color, o: o || {} })).concat(FR_PARKED.map(([id, type, color]) => ({ id, type, color, o: { actions: [[0, 'brake']] }, parked: true })));
    for (const c of all) {
      const v = c.type === 'truck' ? frBuildTruck(this.factory, c.color) : this.factory.build(c.type, c.color);
      v.group.name = 'veh:' + c.id;
      scene.add(v.group);
      c.v = v;
      // (driver inputs are authored on the scenario clock: shift them onto the film's)
      c.steer = new Track((c.o.steer || [[0, 0]]).map(([t, v]) => [t - FR.shift, v]), 'linear');
      c.actions = (c.o.actions || [[0, 'roll']]).map(([t, a]) => [t - FR.shift, a]);
      // blur discs on both faces of every wheel (outer face only needed, but cars get turned around)
      c.blur = v.wheels.map((w) => {
        const m = new THREE.Mesh(new THREE.CircleGeometry(v.r * 0.98, 20), new THREE.MeshBasicMaterial({ map: blurTex, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide }));
        m.position.z = w.position.z > 0 ? 0.125 : -0.125;   // (in the wheel's frame, after its own rotation the axle is local z)
        w.add(m);
        return m;
      });
      for (const w of v.wheels) {
        const m = new THREE.Mesh(new THREE.CircleGeometry(v.r * 0.97, 24), new THREE.MeshStandardMaterial({ map: spokeTex, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide }));
        m.position.z = w.position.z > 0 ? 0.118 : -0.118; w.add(m);
      }
      c.hits = [];
      this.cars.push(c);
    }
    this.byId = Object.fromEntries(this.cars.map((c) => [c.id, c]));
    // each car's hits (for body jolts and the sound)
    for (const e of world.events) for (const id of [e.a, e.b]) if (this.byId[id] && e.dv > 1.2) this.byId[id].hits.push(e);
    this.blobs = new BlobShadows(scene, this.cars.length);
    // friction returns: a car sliding sideways trips on its tyres and rolls (whole quarter turns: on its side, roof, or back on its
    // wheels); one sliding along its heading skids to a stop with smoking tyres
    for (const c of this.cars) {
      const s = world.sample(c.id, FR.tBack - 0.01), hx = -Math.sin(s.yaw), hz = -Math.cos(s.yaw);
      const lon = s.vx * hx + s.vz * hz, lat = s.vx * Math.cos(s.yaw) - s.vz * Math.sin(s.yaw);
      if (s.speed < 0.8) continue;
      const R = { lat, lon, skid: Math.min(2.4, Math.abs(lon) / 7 + 0.3) };
      const rollV = c.type === 'truck' ? 2.2 : 2.8;
      if (Math.abs(lat) > 0.7 && Math.abs(lat) <= rollV) Object.assign(R, { rock: Math.min(0.5, 0.06 + lat * lat * 0.1) * Math.sign(lat), rockDur: 0.5 + Math.abs(lat) * 0.25 });
      if (Math.abs(lat) > rollV) {
        const q = Math.max(1, Math.min(5, Math.round(Math.abs(lat) / 2.4)));
        Object.assign(R, { roll: q * Math.PI / 2 * Math.sign(lat), dur: 0.3 + q * 0.32, lands: [] });
        for (let i = 1; i <= q; i++) R.lands.push([FR.tBack + 0.12 + (i / q) * (R.dur - 0.12), Math.min(1, Math.abs(lat) / 6)]);
      }
      c.ret = R;
    }
    this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._x = new THREE.Vector3(1, 0, 0); this._y = new THREE.Vector3(0, 1, 0); this._s = {};
  }

  action(c, t) { let a = 'roll'; for (const k of c.actions) if (k[0] <= t) a = k[1]; else break; return a; }

  // place an object from a sample: yaw + tilt onto the slope; returns the ground height
  static place(obj, s, q, q2, ax, ay) {
    const G = FrGround, y = G.h(s.x, s.z), slope = Math.atan(-G.dz(s.z));
    obj.position.set(s.x, y, s.z);
    q2.setFromAxisAngle(ax, slope); q.setFromAxisAngle(ay, s.yaw + Math.PI / 2);
    obj.quaternion.copy(q2).multiply(q);
    return y;
  }

  update(t) {
    const W = this.world, s = this._s;
    this.blobs.begin();
    for (const c of this.cars) {
      W.sample(c.id, t, s);
      const v = c.v;
      FrTraffic.place(v.group, s, this._q, this._q2, this._x, this._y);
      // wheels: their integrated spin; the front pair steers
      const steer = c.steer.value(t);
      v.wheels.forEach((w, i) => {
        w.rotation.z = -s.wheel;
        w.rotation.y = i >= v.wheels.length - 2 ? -steer : 0;
        if (w.userData.twin) w.userData.twin.rotation.z = -s.wheel;
        c.blur[i].material.opacity = MathX.smooth(Math.abs(s.wheelRate), 9, 26) * 0.92;
      });
      // brake lights while the wheels are locked
      const act = this.action(c, t);
      v.tail.emissiveIntensity = act === 'brake' && !c.parked ? 4.5 : 0.6;
      if (c.parked) v.tail.emissiveIntensity = 0.25;
      // hits jolt the body: a quick pitch / roll wobble and a little bounce
      let pitch = 0, roll = 0, bounce = 0;
      for (const e of c.hits) {
        const a = t - e.t;
        if (a < 0 || a > 1.2) continue;
        const k = Math.min(e.dv, 9) * Math.exp(-a / 0.22) * Math.sin(a * 26);
        // which side was hit, in the car's frame
        const dx = e.x - s.x, dz = e.z - s.z, fwd = dx * -Math.sin(s.yaw) + dz * -Math.cos(s.yaw), right = dx * Math.cos(s.yaw) + dz * -Math.sin(s.yaw);
        pitch += -Math.sign(fwd) * 0.006 * k; roll += Math.sign(right) * 0.008 * k; bounce += 0.006 * Math.abs(k);
      }
      // engine shake while floored
      if (act === 'gas' && t > FR.tLoss) bounce += Math.sin(t * 70 + c.id.length) * 0.004;
      v.body.rotation.set(roll, 0, pitch);
      v.body.position.y = bounce;
      // rolling over when friction returns: quarter turns about the car's length, lifting it off its wheels as it goes
      if (c.ret && c.ret.roll && t > FR.tBack) {
        const R = c.ret, u = MathX.clamp((t - FR.tBack - 0.06) / R.dur, 0, 1), e = 1 - (1 - u) * (1 - u), phi = R.roll * e;
        v.group.rotateX(phi);
        v.group.position.y += (v.W / 2) * Math.abs(Math.sin(phi)) * 0.95 + Math.max(0, Math.sin(u * Math.PI)) * 0.35 * Math.min(1, Math.abs(R.lat) / 6);
      }
      // …or lurching up onto two wheels and slamming back down
      if (c.ret && c.ret.rock && t > FR.tBack) {
        const R = c.ret, u = MathX.clamp((t - FR.tBack) / R.rockDur, 0, 1), k = Math.sin(Math.PI * Math.min(1, u * 1.15)) * (u < 1 ? 1 : 0) + (u >= 0.87 ? Math.exp(-(t - FR.tBack - R.rockDur * 0.87) / 0.08) * Math.sin((t - FR.tBack - R.rockDur * 0.87) * 40) * 0.08 : 0);
        v.group.rotateX(R.rock * Math.max(0, k)); v.group.position.y += (v.W / 2) * Math.abs(Math.sin(R.rock * Math.max(0, k))) * 0.5;
      }
      // the truck's roll-up door flies up on its big hit
      if (v.door) {
        const h = W.byId.T.bigHit, open = h !== undefined ? MathX.smooth(t, h + 0.05, h + 0.35) : 0;
        v.door.position.y = 1.0 + open * 2.3; v.door.scale.y = 1 - open * 0.92; v.inside.visible = open > 0.01;
      }
      this.blobs.push(s.x, FrGround.h(s.x, s.z) + 0.012, s.z, v.L * 1.12, 0.62, v.W * 1.35, s.yaw + Math.PI / 2);
    }
    this.blobs.end();
  }
}
