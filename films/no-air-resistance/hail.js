/* =====================================================================
   HAIL — the storm over the roof, on story time S.
   The rain the gust front brings: water, so the air still carries it; it
   flies almost sideways at the wind's speed. The confetti: a solid, so
   every flake flies the same parabola as a pebble and the cloud of it
   lands as one clump (its normal-air ghost stops in a metre and blows
   away). The cloud's ice (NR_ICE): every piece fell from rest at the
   change, so it lands in order of height, faster and faster. It is drawn
   as streaks (a 1/100 s shutter: 3–5 m long at 340–505 m/s), a spark of
   ice powder where each lands, chips thrown up that fall straight back
   (ice is a solid: no dust hangs in the air), and a little melt-water mist
   that does ride the wind. From the street the ice shows first as a grey
   veil coming down out of the cloud (the sky shader, city.js). The street
   and the roofs below go white as it lands.
   ===================================================================== */

// the neighbour's roof (a four-storey block, z 3–12.5)
const NR_NEIGH = { x0: 12.5, x1: 29.5, z0: 3.0, z1: 12.5, y: 4.4 + 4 * 3.3 };

// the height of what the ice lands on at (x, z); null where it is hidden inside other buildings (no spray drawn there)
function nrFloorAt(x, z) {
  const R = NR_ROOF, H = R.hut;
  if (x > R.x0 && x < R.x1 && z > R.z0 && z < R.z1) {
    if (x > H.x0 && x < H.x1 && z > H.z0 && z < H.z1) return R.y + H.h + 0.18;
    const P = R.platform; if (Math.abs(x - P.x) < P.w / 2 && Math.abs(z - P.z) < P.d / 2) return R.y + 0.04;
    return R.y;
  }
  if (x > NR_NEIGH.x0 && x < NR_NEIGH.x1 && z > NR_NEIGH.z0 && z < NR_NEIGH.z1) return NR_NEIGH.y;
  const ax = Math.abs(x);
  if (ax <= LAYOUT.roadHalf) return 0;
  if (ax <= LAYOUT.frontage) return LAYOUT.curbH;
  return null;
}

// the drawn ice: R landings a second at the peak over the field (a tiny share of the real number, which would be a white
// wall); slot j lands at t, at (x, z); k is its size (the lowest ice, which lands first, holds the biggest stones)
const NR_HAIL = {
  R: 24000, x0: -30, x1: 40, z0: -36, z1: 14,
  at(j, o) {
    o.t = NR_ICE.first + j / this.R;
    o.on = hash1(j * 5 + 1) < NR_ICE.flux(o.t);
    o.x = this.x0 + (this.x1 - this.x0) * hash1(j * 5 + 2);
    o.z = this.z0 + (this.z1 - this.z0) * hash1(j * 5 + 3);
    const early = 1 - MathX.smooth(o.t, NR_ICE.first, NR_ICE.first + 4);
    o.k = (0.35 + 0.65 * hash1(j * 5 + 4)) * (0.55 + 0.9 * early);
    return o;
  },
  // the landings near a point (for the sound): [t, distance, bearing (rad, world), k]
  near(t0, t1, cx, cz, rad, share) {
    const out = [], o = {}, j0 = Math.max(0, Math.floor((t0 - NR_ICE.first) * this.R)), j1 = Math.floor((t1 - NR_ICE.first) * this.R);
    for (let j = j0; j <= j1; j++) {
      if (hash1(j * 5 + 5) > share) continue;
      this.at(j, o); if (!o.on) continue;
      const dx = o.x - cx, dz = o.z - cz, d = Math.hypot(dx, dz);
      if (d < rad && nrFloorAt(o.x, o.z) !== null) out.push([o.t, d, Math.atan2(-dx, -dz), o.k]);
    }
    return out;
  },
};

class NrStorm {
  constructor(app) {
    this.app = app; const sc = app.scene;
    this.rain = new StreakSystem(sc, 3400);
    this.ice = new StreakSystem(sc, 5200);
    this.flash = new BillboardSystem(sc, 1600, true);
    this.spray = new StreakSystem(sc, 7000); this.spray.mesh.material.blending = THREE.NormalBlending;     // chips: white over the grey deck
    this.puff = new BillboardSystem(sc, 1800, false); this.puff.uniforms.uLight.value = 1.1;
    this.mist = new BillboardSystem(sc, 700, false); this.mist.uniforms.uLight.value = 1.0;
    this.bits = new BillboardSystem(sc, 900, false); this.bits.uniforms.uLight.value = 1.0;
    this._o = {};
    this._confetti();
    this._cover();
  }

  /* ---------------- the confetti cannon's load (and its normal-air ghost) ---------------- */
  _confetti() {
    const g = new THREE.PlaneGeometry(0.06, 0.04), n = 720, rng = new RNG(4401);
    const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), n);
    const pal = ['#f2c14e', '#e8577e', '#4fb3e8', '#f4f1e8', '#62c46d', '#e34234', '#b07be0'], c = new THREE.Color();
    this.flakes = [];
    for (let i = 0; i < n; i++) {
      m.setColorAt(i, c.set(pal[i % pal.length]));
      const a = rng.range(0, Math.PI * 2), r = Math.sqrt(rng.next()) * 0.85;
      this.flakes.push({ d: { dx: Math.cos(a) * r - 0.25, dz: Math.sin(a) * r + 0.1, vk: rng.range(0.86, 1.06), floor: 0 }, sx: rng.range(-14, 14), sy: rng.range(-10, 10), sz: rng.range(-14, 14), ry: rng.range(0, 6.3) });
    }
    m.frustumCulled = false; m.castShadow = false; m.visible = false; this.app.scene.add(m); this.confetti = m;
    // the ghost: the same flakes in normal air (they stop within a metre, then the 50 km/h wind takes them)
    const gn = 260, gm = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }), gn);
    this.ghosts = [];
    for (let i = 0; i < gn; i++) { const a = rng.range(0, Math.PI * 2), r = Math.sqrt(rng.next()) * 0.85; this.ghosts.push({ dx: Math.cos(a) * r, dz: Math.sin(a) * r, vk: rng.range(0.7, 1.1), tw: rng.range(0.22, 0.45), sink: rng.range(0.3, 0.7), ph: rng.range(0, 6.3) }); }
    gm.frustumCulled = false; gm.visible = false; gm.renderOrder = 7; this.app.scene.add(gm); this.ghostC = gm;
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1);
  }
  // where the cannon fires from (the guest's hand at NR.pop; computed once so every frame agrees)
  muzzle() {
    if (!this._mz) { const G = this.app.people.byId.G1; G.update(NR.pop); this._mz = G.handWorld(-1, new THREE.Vector3()); this._mz.y += 0.32; G.update(this.app.S || NR.pop); }
    return this._mz;
  }
  // the centre of the flying clump (for the tags)
  clump(S, out) {
    const p0 = this.muzzle(), u = S - NR.pop, v = NR_CONFETTI.v0 * 0.96, fl = nrFloorAt(p0.x, p0.z) + 0.01;
    const y = Math.max(fl, p0.y + v * u - 0.5 * NR_G * u * u);
    return out.set(p0.x - 0.25 * u, y, p0.z + 0.1 * u);
  }
  ghostAt(S, out) {
    const p0 = this.muzzle(), u = Math.max(0, S - NR.pop), U = 50 / 3.6, D = NR_WIND_DIR, tw = 0.32;
    const along = U * (u - tw * (1 - Math.exp(-u / tw)));
    return out.set(p0.x + D.x * along, p0.y + 11 * 0.08 * (1 - Math.exp(-u / 0.08)) - 0.5 * u, p0.z + D.z * along);
  }
  _confettiUpdate(S) {
    const u = S - NR.pop, on = u >= 0;
    this.confetti.visible = on && S >= NR.sky[1];
    this.ghostC.visible = on && u < 2.2;
    if (!on) return;
    const p0 = this.muzzle(), o = this._p, fl = nrFloorAt(p0.x, p0.z) + 0.006;
    this.flakes.forEach((F, i) => {
      F.d.floor = fl + (i % 7) * 0.0012;
      NR_CONFETTI.at(Math.max(0, u), F.d, p0, o);
      if (o.air) this._e.set(F.sx * u, F.sy * u, F.sz * u); else this._e.set(-Math.PI / 2, 0, F.ry);
      this._q.setFromEuler(this._e); this._m4.compose(o, this._q, this._s); this.confetti.setMatrixAt(i, this._m4);
    });
    this.confetti.instanceMatrix.needsUpdate = true;
    if (this.ghostC.visible) {
      const U = 50 / 3.6, D = NR_WIND_DIR;
      this.ghosts.forEach((G, i) => {
        const along = U * (u - G.tw * (1 - Math.exp(-u / G.tw))), up = NR_CONFETTI.v0 * G.vk * 0.07 * (1 - Math.exp(-u / 0.07));
        o.set(p0.x + D.x * along + G.dx * 0.6 * Math.min(u, 0.3) + 0.15 * Math.sin(u * 7 + G.ph), p0.y + up - G.sink * u + 0.1 * Math.sin(u * 9 + G.ph), p0.z + D.z * along + G.dz * 0.6 * Math.min(u, 0.3));
        this._e.set(u * 9 + G.ph, u * 6, u * 11); this._q.setFromEuler(this._e); this._m4.compose(o, this._q, this._s); this.ghostC.setMatrixAt(i, this._m4);
      });
      this.ghostC.instanceMatrix.needsUpdate = true;
      this.ghostC.material.opacity = 0.9 * MathX.smooth(u, 0, 0.1) * (1 - MathX.smooth(u, 1.5, 2.2));
    }
  }

  /* ---------------- ice powder piling up on the street and the roofs below (an overlay, white as the ice lands) ---------------- */
  _cover() {
    const c = Tex.canvas(256, 256), x = c.getContext('2d'), r = new RNG(4402);
    x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { const v = Math.floor(120 + r.next() * 135); x.fillStyle = `rgb(${v},${v},${v})`; x.beginPath(); x.arc(r.next() * 256, r.next() * 256, 1 + r.next() * 5, 0, 6.3); x.fill(); }
    const tex = Tex.tex(c); tex.repeat.set(8, 40);
    const mat = new THREE.MeshStandardMaterial({ color: '#e6edf3', roughness: 0.75, transparent: true, opacity: 0, alphaMap: tex, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const add = (x0, x1, z0, z1, y) => { const m = new THREE.Mesh(Geo.flat(x0, x1, z0, z1, y, 1), mat); m.receiveShadow = true; this.app.scene.add(m); };
    add(-LAYOUT.roadHalf, LAYOUT.roadHalf, -160, 80, 0.012);
    add(LAYOUT.roadHalf, LAYOUT.frontage, -160, 80, LAYOUT.curbH + 0.006); add(-LAYOUT.frontage, -LAYOUT.roadHalf, -160, 80, LAYOUT.curbH + 0.006);
    add(NR_NEIGH.x0, NR_NEIGH.x1, NR_NEIGH.z0, NR_NEIGH.z1, NR_NEIGH.y + 0.01);
    this.coverMat = mat;
  }

  /* ---------------- per frame ---------------- */
  update(S, cam) {
    this._confettiUpdate(S);
    this._rainUpdate(S, cam);
    this._iceUpdate(S, cam);
    this.coverMat.opacity = 0.92 * MathX.smooth(NR_ICE.landed(S), 0.02, 0.6);
  }

  // rain: light, flying at the wind's speed (~30 m/s), falling ~6.5 m/s: 12° off the horizontal. Drops live in a box that
  // wraps round you (in world space, so they don't move with your head); none inside the stair housing or below a floor
  _rainUpdate(S, cam) {
    const R = this.rain, k = MathX.smooth(S, NR.gale[0], NR.gale[0] + 1.2) * (S < NR.sky[0] || S >= NR.sky[1] ? 1 : 0);
    R.begin();
    if (k > 0) {
      const U = nrWindKmh(S) / 3.6, D = NR_WIND_DIR, vx = D.x * U, vz = D.z * U, vy = -6.5, H = NR_ROOF.hut, Y = NR_ROOF.y, c = cam.position;
      const bx = 30, by = 18, bz = 30, x0 = c.x - bx / 2, y0 = c.y - 7, z0 = c.z - bz / 2, n = Math.floor(3300 * k), sh = 1 / 30;
      const wrap = (v, s) => v - s * Math.floor(v / s);
      for (let i = 0; i < n; i++) {
        const gs = 0.85 + 0.3 * hash1(i * 7 + 3);
        const x = x0 + wrap(hash1(i * 7 + 1) * 977 + vx * gs * S - x0, bx), y = y0 + wrap(hash1(i * 7 + 2) * 977 + vy * S - y0, by), z = z0 + wrap(hash1(i * 7 + 4) * 977 + vz * gs * S - z0, bz);
        if (x > H.x0 - 0.05 && x < H.x1 && z > H.z0 && z < H.z1 && y < Y + H.h + 0.3) continue;
        const f = nrFloorAt(x, z); if (f !== null && y < f) continue;
        const ddx = x - c.x, ddy = y - c.y, ddz = z - c.z; if (ddx * ddx + ddy * ddy + ddz * ddz < 1.4) continue;
        const a = (0.3 + 0.25 * hash1(i * 7 + 5)) * k;
        R.push(x, y, z, x - vx * gs * sh, y - vy * sh, z - vz * gs * sh, 0.8, 0.85, 0.94, a, 0.009 + 0.004 * hash1(i * 7 + 6));
      }
    }
    R.end();
  }

  _iceUpdate(S, cam) {
    const I = this.ice, Fl = this.flash, Sp = this.spray, Pu = this.puff, Mi = this.mist, o = this._o, c = cam.position;
    I.begin(); Fl.begin(null); Sp.begin(); Pu.begin(this.app.scene.fog); Mi.begin(this.app.scene.fog);
    const fw = this._fw || (this._fw = new THREE.Vector3()); cam.getWorldDirection(fw); const fl = Math.hypot(fw.x, fw.z) || 1, fx = fw.x / fl, fz = fw.z / fl;
    const sky = S >= NR.sky[0] && S < NR.sky[1];
    if (!sky && S > NR_ICE.first - 0.2 && S < NR_ICE.last + 0.6) {
      const sh = 1 / 100, D = NR_ICE.drift, j0 = Math.max(0, Math.floor((S - 0.9 - NR_ICE.first) * NR_HAIL.R)), j1 = Math.floor((S + 0.14 - NR_ICE.first) * NR_HAIL.R);
      for (let j = j1; j >= j0; j--) {
        NR_HAIL.at(j, o); if (!o.on) continue;
        const age = S - o.t, f = nrFloorAt(o.x, o.z), fy = f === null ? 0 : f;
        if (age < sh) {
          // in flight: a streak (what a 1/100 s exposure sees)
          const v = NR_ICE.v(o.t), hb = Math.max(0, -age * v), ha = (sh - age) * v;
          if (hb > 80) continue;
          const xa = o.x + D[0] * ha, za = o.z + D[1] * ha, xb = o.x + D[0] * hb, zb = o.z + D[1] * hb;
          I.push(xa, fy + ha, za, xb, fy + hb, zb, 0.86, 0.93, 1.0, 0.5 + 0.4 * Math.min(1, o.k), 0.006 + 0.012 * o.k);
        }
        if (f === null || age < 0) continue;
        const dx = o.x - c.x, dz = o.z - c.z, d2 = dx * dx + dz * dz, d = Math.sqrt(d2);
        if (dx * fx + dz * fz < 0.25 * d - 1.0) continue;                 // behind you: nothing drawn
        // the spark where it lands (small: it's a flash of ice turning to powder)
        if (age < 0.05 && d2 < 1600) { const sz = (0.07 + 0.18 * o.k) * (1 + 1.2 * age / 0.05); Fl.push(o.x, fy + 0.5 * sz, o.z, sz, hash1(j) * 6.3, 0.7 * (1 - age / 0.05), 1, 0.95, 0.98, 1.0); }
        // a brief puff of ice powder, low over the spot (a solid: it falls straight back, no dust hangs in the air)
        if (age < 0.16 && d2 < 520 && d2 > 12) { const w = age / 0.16, sz = (0.08 + 0.2 * o.k) * (0.7 + 1.3 * w); Pu.push(o.x, fy + 0.5 * sz, o.z, sz, hash1(j * 3) * 6.3, 0.3 * (1 - w) ** 1.5, 1.0, 0.93, 0.95, 0.98); }
        // a splash of chips: thrown out fast and low, falling straight back down (drawn with a 1/50 s blur)
        if (d2 < 520 && age < 0.9 && hash1(j * 5 + 6) < 0.7) {
          const nq = o.k > 0.6 ? 7 : 5, sb = Math.min(age, 1 / 50), lw = 0.005 + 0.007 * o.k;
          for (let q = 0; q < nq; q++) {
            const h = hash1(j * 11 + q), a = hash1(j * 13 + q) * 6.283, vh = (2.0 + 6.0 * h) * (0.6 + o.k), vy = (0.6 + 2.4 * hash1(j * 17 + q)) * (0.6 + 0.8 * o.k);
            const y = fy + vy * age - 0.5 * NR_G * age * age; if (y < fy) continue;
            const ca = Math.cos(a) * vh, sa = Math.sin(a) * vh, ta = age - sb, yb = fy + vy * ta - 0.5 * NR_G * ta * ta;
            Sp.push(o.x + ca * ta, yb, o.z + sa * ta, o.x + ca * age, y, o.z + sa * age, 0.93, 0.96, 1.0, 0.9 * (1 - age / 0.9), lw);
          }
        }
      }
      // the melt-water mist the impacts make: water, so the wind takes it (a coarser set of slots)
      const rm = 520, U = nrWindKmh(S) / 3.6, Dw = NR_WIND_DIR;
      for (let m = Math.floor((S - 1.4 - NR_ICE.first) * rm); m <= Math.floor((S - NR_ICE.first) * rm); m++) {
        if (m < 0) continue;
        const t = NR_ICE.first + m / rm, age = S - t; if (age < 0) continue;
        if (hash1(m * 3 + 1) > NR_ICE.flux(t)) continue;
        const x = c.x - 26 + 44 * hash1(m * 3 + 2), z = c.z - 22 + 44 * hash1(m * 3 + 3), f = nrFloorAt(x, z); if (f === null) continue;
        const k = age / 1.4, gx = x + Dw.x * U * age * 0.85, gz = z + Dw.z * U * age * 0.85;
        if ((gx - c.x) ** 2 + (gz - c.z) ** 2 < 25) continue;
        const ms = 0.6 + 2.0 * k;
        Mi.push(gx, f + 0.5 * ms + 0.8 * k, gz, ms, m * 0.7, 0.1 * Math.sin(Math.PI * Math.min(1, k * 1.15)), 1.0, 0.92, 0.94, 0.97);
      }
    }
    I.end(); Fl.end(); Sp.end(); Pu.end(); Mi.end();
  }

  // shards of something broken (glass, terracotta): thrown out of a box at t0, falling ½gt² until floorY. A small pool shared by
  // every breakage (called from roof.js once per frame per breakage, between beginBits() and endBits())
  beginBits() { this.bits.begin(this.app.scene.fog); }
  shards(S, t0, box, n, seed, floorY, col, vyR = [-5, 2.5], vhR = [0.4, 2.2], size = [0.025, 0.07]) {
    const u = S - t0; if (u < 0) return;
    for (let i = 0; i < n; i++) {
      const h = (k) => hash1(seed * 7919 + i * 13 + k);
      const x0 = box[0] + (box[1] - box[0]) * h(1), z0 = box[2] + (box[3] - box[2]) * h(2), y0 = box[4];
      const a = h(3) * 6.283, vh = vhR[0] + (vhR[1] - vhR[0]) * h(4), vy = vyR[0] + (vyR[1] - vyR[0]) * h(5);
      const y = y0 + vy * u - 0.5 * NR_G * u * u;
      const fl = floorY === null ? -1e9 : floorY;
      const yy = Math.max(fl + 0.01, y), still = y <= fl;
      const tl = still ? (vy + Math.sqrt(vy * vy + 2 * NR_G * (y0 - fl))) / NR_G : u;
      this.bits.push(x0 + Math.cos(a) * vh * tl, yy, z0 + Math.sin(a) * vh * tl, size[0] + (size[1] - size[0]) * h(6), h(7) * 6.3 + (still ? 0 : u * 9), still && floorY !== null && floorY < NR_ROOF.y - 0.1 ? 0 : 0.95, 1.0, col[0], col[1], col[2]);
    }
  }
  endBits() { this.bits.end(); }
}
