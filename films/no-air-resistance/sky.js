/* =====================================================================
   SKY — the airliner (cruising at 11.4 km when the air lets go; with no
   lift it falls on a ballistic arc for 48 s, flying up the avenue towards
   you, and comes down in the river 2.1 km away), its impact (a fireball, a
   column of spray that water still lets the wind carry, and a fan of dark
   debris), the debris it throws (no drag: it flies 2 km and arrives at
   ~700 km/h), the sign board knocked off the building beside you, and the
   skydiver cut-away (its own scene, shown through FILM.view): a jumper in
   freefall whose parachute can't even open.
   ===================================================================== */

// an airliner from the shared model (js/world/aircraft.js), without its landing gear; fog off (it is seen from kilometres away)
function nrAirliner() {
  const fake = {}, g = AircraftSystem.prototype._build.call(fake);
  for (const o of g.children.slice()) if (o.geometry && o.geometry.type === 'CylinderGeometry') g.remove(o);
  for (const s of fake.strobes) s.visible = false;
  g.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.fog = false; o.userData.base = o.material.color.clone(); } });
  g.strobes = fake.strobes;
  return g;
}
// tint everything toward the haze colour by k (0..1)
function nrHaze(g, col, k) { g.traverse((o) => { if (o.material && o.userData.base) o.material.color.copy(o.userData.base).lerp(col, k); }); }

class NrPlane {
  constructor(scene) {
    this.g = nrAirliner(); this.g.rotation.y = Math.atan2(-NR_PLANE.dir[0], -NR_PLANE.dir[1]);   // nose the way it flies; it stays level (nothing can pitch it now)
    this.g.scale.setScalar(1.0); scene.add(this.g);
    this.haze = new THREE.Color('#bccbd8');
  }
  update(S, cam) {
    const g = this.g, on = S > 30 && S < NR.impact;
    g.visible = on;
    if (!on) return;
    NR_PLANE.pos(S, g.position);
    const d = g.position.distanceTo(cam.position);
    nrHaze(g, this.haze, MathX.clamp(d / 26000, 0.03, 0.3));
  }
}

/* ---------------- a broken cloud deck at ~5.5 km (water: it drifts with the wind); the airliner drops through it ---------------- */
// Only built where your line of sight to the plane crosses 5.5 km during the telephoto (story 34–38.2), with a clear
// gap where you first find it; after ≈ 36.7 it is below the deck and the clouds are behind it
class NrCloudDeck {
  constructor(scene) {
    this.bb = new BillboardSystem(scene, 720, false); this.bb.uniforms.uLight.value = 1.0;
    this.fog = { color: new THREE.Color('#b9cfe4'), density: 0.00003 };
    const r = new RNG(4242), P = new THREE.Vector3(), D = NR_WIND_DIR, base = 5450;
    const hit = (s) => { NR_PLANE.pos(s, P); const k = (base + 60 - 1.7) / Math.max(1, P.y - 1.7); return [NR_CAM.x + (P.x - NR_CAM.x) * k, NR_CAM.z + (P.z - NR_CAM.z) * k]; };
    this.puffs = []; this.w0 = nrWindDist(36.0);   // (positions are where the clouds are at story 36; they drift from there)
    for (let gx = -220; gx <= 140; gx += 72) for (let gz = -5900; gz <= -4850; gz += 72) {
      if (r.next() < 0.42) continue;
      const cx = gx + r.range(-25, 25), cz = gz + r.range(-25, 25);
      // keep the gap open while you find it (34.0–35.0)
      let clear = true;
      for (let s = 33.9; s <= 35.05; s += 0.05) { const [hx, hz] = hit(s), w = nrWindDist(s) - this.w0; if (Math.hypot(cx + D.x * w - hx, cz + D.z * w - hz) < 95) { clear = false; break; } }
      if (!clear) continue;
      const rad = r.range(30, 62), th = r.range(30, 95), n = 10 + r.int(0, 6);
      for (let i = 0; i < n; i++) {
        const a = r.range(0, 6.283), d = rad * Math.sqrt(r.next()), h = th * (1 - d / rad) * r.range(0.3, 1.0);
        this.puffs.push([cx + Math.cos(a) * d, base + r.range(0, 12) + h, cz + Math.sin(a) * d * 0.8, r.range(24, 50) * (1 - 0.35 * d / rad), r.range(0, 6.283), h / th]);
      }
    }
  }
  update(S) {
    const B = this.bb, D = NR_WIND_DIR; B.begin(this.fog);
    if (S > 33.3 && S < 39.3) {
      const w = nrWindDist(S) - this.w0;
      for (const [x, y, z, size, rot, up] of this.puffs) B.push(x + D.x * w, y, z + D.z * w, size, rot, 0.88, 0.62 + 0.36 * up, 0.93, 0.96, 1.0);
    }
    B.end();
  }
}

/* ---------------- the impact: a fireball, a tall column of spray (water: the wind still carries it), dark debris thrown out ---------------- */
class NrImpact {
  constructor(scene) {
    this.glow = new BillboardSystem(scene, 24, true);
    this.spray = new BillboardSystem(scene, 1000, false);
    this.spray.uniforms.uLight.value = 1.0;
    // the fireball: drawn opaque over the smoke (additive orange would just wash out to white against the pale sky)
    this.fire = new BillboardSystem(scene, 40, false);
    this.fire.uniforms.uLight.value = 1.0;
    // (the fan of debris: dark chunks, each stretched along its flight like a motion blur)
    this.fan = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#2a2622', fog: false }), 320); this.fan.frustumCulled = false; this.fan.count = 0; scene.add(this.fan);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(); this._d = new THREE.Vector3(); this._up = new THREE.Vector3(1, 0, 0);
    this.fog = { color: new THREE.Color('#c9d4dc'), density: 0.00005 };
    this.P = NR_PLANE.imp;
    this.sun = new THREE.Vector2(-0.3, 0.72).normalize();      // the sun's bearing (city.js): that side of the column is lit
  }
  update(S) {
    const I = this.P, u = S - NR.impact, G = this.glow, Sp = this.spray, Fi = this.fire, F = this.fan, D = NR_WIND_DIR;
    G.begin(); Sp.begin(this.fog); Fi.begin(); let nf = 0;
    if (u >= 0) {
      // the flash and the fireball (burning fuel: a gas, so it is not thrown about like the debris)
      const f = Math.exp(-u / 0.08);
      if (f > 0.01) G.push(I[0], 60 + 60 * u, I[1], 420 * (0.3 + u), 0, f, 1, 1.0, 0.95, 0.85);
      // the fireball: a dome of burning fuel that swells, then (hot gas, still buoyant) lifts, cools and greys out into the spray
      const R = 85 * (1 - Math.exp(-u / 0.3)), lift = 25 * Math.max(0, u - 0.4) ** 1.6, fade = Math.exp(-Math.max(0, u - 0.8) / 1.6) * MathX.smooth(u, 0, 0.05), cool = MathX.smooth(u, 0.5, 2.6);
      if (fade > 0.01) for (let k = 0; k < 30; k++) {
        const th = hash1(k * 7 + 1) * 6.283, ph = hash1(k * 3 + 2) * 1.45, e = 1 - k / 30, rr = R * (0.15 + 0.85 * e);
        const x = I[0] + Math.cos(th) * Math.cos(ph) * rr, z = I[1] + Math.sin(th) * Math.cos(ph) * rr * 0.6, y = R * 0.15 + Math.sin(ph) * rr * 0.9 + lift;
        const r = MathX.lerp(MathX.lerp(1.0, 0.7, e), 0.16, cool), g = MathX.lerp(MathX.lerp(0.5, 0.13, e), 0.17, cool), bl = MathX.lerp(MathX.lerp(0.16, 0.03, e), 0.19, cool);
        Fi.push(x, y, z, R * (0.4 + 0.35 * hash1(k * 5 + 3)), k, 0.92 * fade, 1 - 0.3 * e * hash1(k * 11 + 4), r, g, bl);
      }
      // the column: spray shot straight up, narrow and tall, slowing as it climbs, then leaning off with the wind
      for (let i = 0; i < 760; i++) {
        const born = (hash1(i * 3 + 1) ** 2) * 1.0, a = u - born;
        if (a < 0) continue;
        const v0 = 120 + 210 * hash1(i * 5 + 2), tau = 2.0 + 1.4 * hash1(i * 7 + 3), h = v0 * tau * (1 - Math.exp(-a / tau)) - 3 * a * a;
        const sp = 3 + 17 * hash1(i * 11 + 4), ang = hash1(i * 13 + 5) * 6.283, r = sp * tau * (1 - Math.exp(-a / tau)) * (0.3 + 0.7 * hash1(i * 17 + 6)) + 5 * a;
        const drift = nrWindDist(S) - nrWindDist(NR.impact + born), lean = MathX.clamp(h / 500, 0, 1);
        const x = I[0] + Math.cos(ang) * r + D.x * drift * 0.9 * lean, z = I[1] + Math.sin(ang) * r + D.z * drift * 0.9 * lean, y = Math.max(8, h);
        const k = MathX.clamp(a / 9, 0, 1), size = 40 + 60 * hash1(i * 19 + 7) + 110 * k;
        // dense spray from the river (water, so it rides the wind; any dust or soot in it is solid and falls straight back):
        // shadowed blue-grey low down, lighter on top, the sun side lighter (it has to read against a pale sky)
        const side = (Math.cos(ang) * this.sun.x + Math.sin(ang) * this.sun.y) * r / (r + 25);
        const shade = 0.1 + 0.26 * MathX.clamp(y / 900, 0, 1) + 0.05 * hash1(i * 23 + 8) + 0.16 * side, low = 1 - MathX.clamp(y / 260, 0, 1);
        Sp.push(x, y, z, size, i * 1.7, MathX.smooth(a, 0.05, 0.6) * (1 - 0.2 * k), shade, 0.84 - 0.08 * low, 0.92 - 0.08 * low, 1.0 - 0.06 * low);
      }
      // the base surge rolling out along the river
      for (let i = 0; i < 90; i++) { const a = u - 0.2 * hash1(i + 400); if (a < 0) continue; const ang = (i / 90) * 6.283, r = 200 * (1 - Math.exp(-a / 1.5)) + 30;
        Sp.push(I[0] + Math.cos(ang) * r, 14 + 18 * hash1(i + 500), I[1] + Math.sin(ang) * r, 60 + 50 * Math.min(1, a / 4), i, 0.7 * Math.min(1, a * 2) * (1 - MathX.clamp(a / 12, 0, 0.7)), 0.5, 0.92, 0.92, 0.94); }
      // the fan of dark debris thrown out low and wide (solid: plain ballistic arcs, nothing slows them)
      for (let i = 0; i < 320; i++) {
        const a = u - 0.12 * hash1(i * 29 + 1); if (a < 0) continue;
        const sp = 60 + 170 * hash1(i * 31 + 2), el = MathX.deg(18 + 50 * hash1(i * 37 + 3)), az = hash1(i * 41 + 4) * 6.283, vh = sp * Math.cos(el), vy = sp * Math.sin(el);
        const y = vy * a - 4.905 * a * a; if (y < 0) continue;
        this._p.set(I[0] + Math.cos(az) * vh * a, y, I[1] + Math.sin(az) * vh * a); this._d.set(Math.cos(az) * vh, vy - NR_G * a, Math.sin(az) * vh).normalize();
        const sz = 1.5 + 2.5 * hash1(i * 43 + 5); this._q.setFromUnitVectors(this._up, this._d); this._s.set(sz * 3, sz * 0.5, sz * 0.5);
        this._m.compose(this._p, this._q, this._s); this.fan.setMatrixAt(nf++, this._m);
      }
    }
    G.end(); Sp.end(); Fi.end(); this.fan.count = nf; this.fan.instanceMatrix.needsUpdate = true;
  }
}

/* ---------------- the debris ---------------- */
// [x, y, z, arrival (s after the impact), size (m), kind] — most come down along the avenue, the nearest last; some fly over
const NR_DEBRIS_SPEC = (() => {
  const r = new RNG(9091), L = [];
  for (let i = 0; i < 70; i++) { const z = r.range(-420, -40); L.push([r.range(-6.5, 6.5), 0, z, 9.25 + (z + 420) / 380 * 1.25 + r.range(0, 0.15), r.range(0.3, 1.6), r.int(0, 2)]); }
  for (let i = 0; i < 26; i++) { const z = r.range(-40, 6); L.push([r.range(-6.8, 6.8), 0, z, 10.5 + (z + 40) / 46 * 0.7 + r.range(-0.05, 0.1), r.range(0.4, 1.8), r.int(0, 2)]); }
  for (let i = 0; i < 18; i++) { const side = r.next() < 0.5 ? -1 : 1, z = r.range(-80, 6); L.push([side * 12.45, r.range(2, 16), z, 10.4 + (z + 80) / 86 * 0.9, r.range(0.3, 1.2), r.int(0, 2)]); }
  for (let i = 0; i < 26; i++) { const z = r.range(30, 260); L.push([r.range(-14, 14), 0, z, 11.0 + (z - 30) / 230 * 1.2, r.range(0.4, 1.6), r.int(0, 2)]); }
  for (let i = 0; i < 40; i++) L.push([r.range(-300, 300), 0, r.range(-1500, -300), r.range(4.5, 9.2), r.range(0.8, 3.0), r.int(0, 2)]);
  // the hero hits: the façade above where you stood (it knocks the sign board off), the road where you stood, the bus shelter, a stopped car
  L.push([12.4, 12.4, 1.9, NR.board - NR.impact, 1.1, 0]);
  L.push([8.6, 0.15, 0.8, 61.1 - NR.impact, 1.6, 2]);
  L.push([-9.9, 1.2, -40.5, 10.15, 1.0, 1]);
  // the last few, still arriving as you look up: they pass high over your head and come down far behind you
  const I = NR.planeImp;
  for (const [S0, h, x0, size, kind] of [[62.9, 95, 7.0, 1.6, 0], [63.6, 140, 13.0, 2.0, 2], [64.4, 75, 4.0, 1.3, 1], [65.25, 115, 10.5, 1.8, 0]]) {
    const u0 = S0 - NR.impact, vh = (10 - I[1]) / u0, vy = (h + 0.5 * NR_G * u0 * u0) / u0, T = 2 * vy / NR_G;
    L.push([I[0] + (x0 - I[0]) * T / u0, 0, I[1] + vh * T, T, size, kind]);
  }
  return L;
})();

class NrDebris {
  constructor(scene, app) {
    this.app = app;
    const geos = [new THREE.TetrahedronGeometry(0.6, 0), new THREE.BoxGeometry(1.0, 0.25, 0.7), new THREE.BoxGeometry(1.4, 0.05, 1.0)];
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0.5, fog: false });
    this.kinds = geos.map((g) => { const m = new THREE.InstancedMesh(g, mat, NR_DEBRIS_SPEC.length); m.frustumCulled = false; m.castShadow = true; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NR_DEBRIS_SPEC.length * 3), 3); scene.add(m); return m; });
    this.list = NR_DEBRIS_SPEC.map(([x, y, z, T, size, kind], i) => {
      const P = nrDebrisPiece(x, y, z, T), c = new THREE.Color().setHSL(0.07, 0.08, 0.08 + 0.24 * hash1(i * 3.3) ** 2);   // charred and torn metal
      return { P, size, kind, i, c, land: NR.impact + T, x, y, z, spin: [hash1(i + 1) * 14 - 7, hash1(i + 2) * 14 - 7, hash1(i + 3) * 14 - 7], near: Math.abs(z) < 300 && Math.abs(x) < 20 };
    });
    // what an impact throws up: sparks and grit (grit is solid too: it flies out and falls straight back, no dust cloud hangs)
    this.sparks = new StreakSystem(scene, 900);
    const chipG = new THREE.BoxGeometry(0.06, 0.04, 0.05);
    this.chips = new THREE.InstancedMesh(chipG, new THREE.MeshStandardMaterial({ color: '#a59f94', roughness: 0.9 }), 2600); this.chips.frustumCulled = false; scene.add(this.chips);
    this.marks = new BlobShadows(scene, 140);
    this.haze = new THREE.Color('#c3cfd8');
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(); this._c = new THREE.Color();
  }
  // the cloud of debris in the air (for the HUD tag): the mean position of the near pieces still flying
  cloud(S, out) {
    let n = 0; out.set(0, 0, 0);
    for (const d of this.list) { const u = S - NR.impact; if (!d.near || u < 0 || S >= d.land) continue; d.P.at(u, this._p); out.add(this._p); n++; }
    return n ? out.multiplyScalar(1 / n) : null;
  }
  update(S, cam) {
    const u = S - NR.impact, cnt = [0, 0, 0];
    const Sp = this.sparks; Sp.begin(); let nc = 0; this.marks.begin();
    for (const d of this.list) {
      const M = this.kinds[d.kind];
      if (u > 0 && S < d.land) {
        d.P.at(u, this._p);
        this._e.set(d.spin[0] * u, d.spin[1] * u, d.spin[2] * u); this._q.setFromEuler(this._e); this._s.setScalar(d.size);
        this._m.compose(this._p, this._q, this._s); M.setMatrixAt(cnt[d.kind], this._m);
        const dist = this._p.distanceTo(cam.position); this._c.copy(d.c).lerp(this.haze, MathX.clamp(dist / 2600, 0, 0.75));
        M.setColorAt(cnt[d.kind], this._c); cnt[d.kind]++;
        // a short bright streak behind the near ones in their last second (they are that fast)
        if (d.near && d.land - S < 0.6) { const v = this._p, dx = d.P.dir[0] * d.P.vh * 0.025, dz = d.P.dir[1] * d.P.vh * 0.025; Sp.push(v.x - dx, v.y + 0.02, v.z - dz, v.x, v.y, v.z, 0.9, 0.85, 0.75, 0.25, 0.04 * d.size); }
      }
      // the hit: sparks, grit thrown out along its path, a scar on the ground
      const w = S - d.land;
      if (d.near && w >= 0) {
        if (w < 0.45) for (let k = 0; k < 10; k++) {
          const a = hash1(d.i * 31 + k) * 6.283, sp = 8 + 30 * hash1(d.i * 37 + k), up = 2 + 9 * hash1(d.i * 41 + k), fw = 0.6 + 0.4 * hash1(d.i * 43 + k);
          const vx = Math.cos(a) * sp * 0.5 + d.P.dir[0] * sp * fw, vz = Math.sin(a) * sp * 0.5 + d.P.dir[1] * sp * fw, t0 = w, t1 = Math.max(0, w - 0.035);
          const y0 = d.y + up * t0 - 4.9 * t0 * t0, y1 = d.y + up * t1 - 4.9 * t1 * t1;
          if (y0 > -0.1) Sp.push(d.x + vx * t1, y1, d.z + vz * t1, d.x + vx * t0, y0, d.z + vz * t0, 1.0, 0.82, 0.5, 1.4 * (1 - w / 0.45), 0.025);
        }
        if (w < 2.6) for (let k = 0; k < 18 && nc < 2600; k++) {
          const a = hash1(d.i * 53 + k) * 6.283, sp = 3 + 18 * hash1(d.i * 59 + k), up = 2 + 8 * hash1(d.i * 61 + k);
          const vx = Math.cos(a) * sp * 0.6 + d.P.dir[0] * sp, vz = Math.sin(a) * sp * 0.6 + d.P.dir[1] * sp, tl = (up + Math.sqrt(up * up + 2 * 9.81 * Math.max(0, d.y - 0.15))) / 9.81, ww = Math.min(w, tl);
          this._p.set(d.x + vx * ww, Math.max(0.17, d.y + up * ww - 4.905 * ww * ww), d.z + vz * ww);
          this._e.set(ww * 9 + k, ww * 7, ww * 5); this._q.setFromEuler(this._e); this._s.setScalar(1.5 + 4 * hash1(d.i * 67 + k));
          this._m.compose(this._p, this._q, this._s); this.chips.setMatrixAt(nc++, this._m);
        }
        if (d.y < 0.5) this.marks.push(d.x + d.P.dir[0] * 0.8, (Math.abs(d.x) < 7 ? 0 : LAYOUT.curbH) + 0.014, d.z + d.P.dir[1] * 0.8, 0.45 + 0.5 * d.size, 0.4 * Math.min(1, w * 20), 1.5 + 1.1 * d.size, Math.atan2(d.P.dir[0], d.P.dir[1]));
      }
    }
    this.kinds.forEach((M, k) => { M.count = cnt[k]; M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true; });
    this.chips.count = nc; this.chips.instanceMatrix.needsUpdate = true;
    Sp.end(); this.marks.end();
  }
}

/* ---------------- the sign board on the building beside you (12 m up) ---------------- */
// knocked off by a piece of debris, it drops 12 m in 1.6 s and lands flat on the spot where you stood (on your paper and ball)
class NrBoard {
  constructor(scene) {
    const c = Tex.canvas(512, 300), x = c.getContext('2d');
    x.fillStyle = '#f3efe4'; x.fillRect(0, 0, 512, 300); x.fillStyle = '#1f4e79'; x.fillRect(0, 0, 512, 92);
    x.fillStyle = '#ffffff'; x.font = `700 64px ${Tex.fontCond}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('OFFICES', 256, 48);
    x.fillStyle = '#1f4e79'; x.font = `700 92px ${Tex.fontCond}`; x.fillText('TO LET', 256, 170); x.font = `500 30px ${Tex.fontSans}`; x.fillText('1,200 sq ft · 3rd floor', 256, 255);
    const face = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.6 }), edge = Mat.std('#8a8d90', { roughness: 0.5, metalness: 0.4 });
    // printed on both faces (so it reads whichever way it tumbles), on a 6 cm aluminium-framed panel
    const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 2.6), [face, face, edge, edge, edge, edge]); g.add(b);
    b.castShadow = true; b.receiveShadow = true;
    this.g = g; scene.add(g);
    this.home = new THREE.Vector3(12.43, NR_BOARD.y0, 1.6);
    // its brackets stay on the wall
    for (const dz of [-0.9, 0.9]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), Mat.std('#3a3d40', { roughness: 0.5 })); br.position.set(12.47, NR_BOARD.y0 + 0.5, 1.6 + dz); scene.add(br); }
    this.v0 = [-1.75, 0.6, -0.2]; this.w0 = [0.6, 1.1, 1.5];
    const y0 = NR_BOARD.y0, yG = LAYOUT.curbH + 0.03; this.tf = (this.v0[1] + Math.sqrt(this.v0[1] ** 2 + 2 * NR_G * (y0 - yG))) / NR_G;
    this.landT = NR.board + this.tf;
    // the grit it throws up when it lands (solid: out and straight back down)
    this.chips = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.03, 0.04), new THREE.MeshStandardMaterial({ color: '#b4ada2', roughness: 0.9 }), 40); this.chips.frustumCulled = false; scene.add(this.chips);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1);
  }
  // aim it so it lands on (x, z) (the fall time depends only on the height and the upward kick)
  aim(x, z) { this.v0[0] = (x - this.home.x) / this.tf; this.v0[2] = (z - this.home.z) / this.tf; this.aimed = true; }
  pos(S, out) { const u = Math.max(0, Math.min(S - NR.board, this.tf)); return out.set(this.home.x + this.v0[0] * u, this.home.y + this.v0[1] * u - 0.5 * NR_G * u * u, this.home.z + this.v0[2] * u); }
  speed(S) { const u = MathX.clamp(S - NR.board, 0, this.tf); return Math.hypot(this.v0[0], this.v0[1] - NR_G * u, this.v0[2]); }
  update(S) {
    const g = this.g, u = S - NR.board;
    this.pos(S, g.position);
    if (u < 0) g.rotation.set(0, 0, 0);
    else if (u < this.tf) g.rotation.set(this.w0[0] * u, this.w0[1] * u, this.w0[2] * u);
    else { const w = S - this.landT, k = Math.exp(-w * 8); g.position.y = LAYOUT.curbH + 0.03 + 0.12 * Math.abs(Math.sin(Math.min(w, 0.4) * 8)) * k; g.rotation.set(0, this.w0[1] * this.tf + 0.15 * k, Math.PI / 2); }
    const w = S - this.landT; let n = 0;
    if (w > 0 && w < 1.2) for (let i = 0; i < 40; i++) {
      const a = hash1(i * 7 + 3) * 6.283, sp = 1.5 + 4 * hash1(i * 11 + 5), up = 1.5 + 3.5 * hash1(i * 13 + 7), tl = 2 * up / NR_G, ww = Math.min(w, tl), r = 1.0 + 0.3 * hash1(i * 17);
      this._p.set(g.position.x + Math.cos(a) * (r + sp * ww), LAYOUT.curbH + 0.02 + up * ww - 4.905 * ww * ww, g.position.z + Math.sin(a) * (r * 1.3 + sp * ww));
      this._e.set(ww * 9 + i, ww * 7, 0); this._q.setFromEuler(this._e); this._s.setScalar(1 + 2 * hash1(i * 19));
      this._m.compose(this._p, this._q, this._s); this.chips.setMatrixAt(n++, this._m);
    }
    this.chips.count = n; this.chips.instanceMatrix.needsUpdate = true;
  }
}

/* =====================================================================
   THE SKYDIVER — a separate scene: sky, a city 0.4–2 km below, the jumper
   in freefall (the camera falls with him), his canopy that can't inflate.
   ===================================================================== */
LOOKS.nrJumper = { skin: 0, build: 'avg', shirt: '#c8402a', sleeves: 'long', pants: '#2a2d33', shoes: '#1a1a1a', sole: '#333', hair: '#222', hat: { type: 'helmet', color: '#f0eee8' }, gloves: '#1a1a1a', backpack: '#1d2026' };

class NrAerial {
  constructor(app) {
    const sc = new THREE.Scene(); this.scene = sc;
    this.cam = new THREE.PerspectiveCamera(64, 9 / 16, 0.2, 60000); this.cam.rotation.order = 'YXZ'; sc.add(this.cam);
    sc.fog = new THREE.FogExp2(new THREE.Color('#b4c4d2'), 0.00016);
    sc.background = new THREE.Color('#b9c9d6');
    this._sky(); this._ground(); this._clouds();
    const sun = new THREE.DirectionalLight('#fff0dc', 2.6); sun.position.set(-0.3, 0.62, 0.72).multiplyScalar(1000); sc.add(sun, sun.target); this.sun = sun;
    sc.add(new THREE.HemisphereLight('#bcd2ec', '#6f6a60', 0.95));
    // the jumper
    this.p = new Person({ id: 'jumper', look: 'nrJumper', states: [[0, 'idle']] }, sc);
    this.p.root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    this._canopy();
    // the airliner far above (the same one): seen as a speck at the start
    this.plane = nrAirliner(); this.plane.rotation.y = -Math.PI / 2; sc.add(this.plane);
    this.haze = new THREE.Color('#c4d3df');
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._t = new THREE.Vector3();
  }

  _sky() {
    const U = { uSun: { value: new THREE.Vector3(-0.3, 0.62, 0.72).normalize() } };
    const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 uSun; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float h = d.y;
          vec3 col = mix(vec3(0.74, 0.8, 0.86), vec3(0.29, 0.5, 0.78), pow(clamp(h, 0.0, 1.0), 0.5));
          col = mix(col, vec3(0.72, 0.78, 0.84), smoothstep(0.0, -0.3, h));
          float s = max(dot(d, uSun), 0.0); col += vec3(1.0, 0.92, 0.78) * (pow(s, 6.0) * 0.18 + pow(s, 300.0) * 1.2);
          gl_FragColor = vec4(col, 1.0); }` });
    const m = new THREE.Mesh(new THREE.SphereGeometry(30000, 32, 16), mat); m.frustumCulled = false; m.renderOrder = -10; this.scene.add(m); this.skyM = m;
  }

  // the city below: a painted ground (streets, blocks, parks, a river) and 3D blocks of buildings around the fall line
  _ground() {
    const N = 4096, W = 9000, c = Tex.canvas(N, N), x = c.getContext('2d'), r = new RNG(3131), px = N / W;
    x.fillStyle = '#5c5a56'; x.fillRect(0, 0, N, N);
    const blk = 84, road = 14;
    for (let gx = 0; gx < W; gx += blk) for (let gz = 0; gz < W; gz += blk) {
      const park = r.next() < 0.07, tone = r.range(0.85, 1.15);
      x.fillStyle = park ? `rgb(${62 * tone | 0},${92 * tone | 0},${52 * tone | 0})` : `rgb(${118 * tone | 0},${108 * tone | 0},${96 * tone | 0})`;
      x.fillRect((gx + road / 2) * px, (gz + road / 2) * px, (blk - road) * px, (blk - road) * px);
      if (!park) for (let k = 0; k < 6; k++) { const s = r.range(10, 30); x.fillStyle = `rgba(${r.int(60, 200)},${r.int(60, 190)},${r.int(60, 180)},0.35)`; x.fillRect((gx + road / 2 + r.range(0, blk - road - s)) * px, (gz + road / 2 + r.range(0, blk - road - s)) * px, s * px, s * px); }
    }
    x.strokeStyle = '#4f6f80'; x.lineWidth = 240 * px; x.beginPath(); x.moveTo(0, N * 0.78); x.bezierCurveTo(N * 0.3, N * 0.7, N * 0.6, N * 0.9, N, N * 0.82); x.stroke();
    x.strokeStyle = '#6a6862'; x.lineWidth = 34 * px; x.beginPath(); x.moveTo(N * 0.2, 0); x.lineTo(N * 0.62, N); x.stroke();
    const tex = Tex.tex(c, { repeat: false }); tex.anisotropy = 4;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshLambertMaterial({ map: tex })); g.rotation.x = -Math.PI / 2; this.scene.add(g);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(120000, 120000), new THREE.MeshLambertMaterial({ color: '#6b6862' })); far.rotation.x = -Math.PI / 2; far.position.y = -0.5; this.scene.add(far);
    // 3D blocks within ~1.4 km (the last seconds before the cut are at ~430 m)
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    const n = 3200, im = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: '#ffffff' }), n), M = new THREE.Matrix4(), col = new THREE.Color();
    let i = 0;
    for (let gx = -1400; gx < 1400 && i < n; gx += blk) for (let gz = -1400; gz < 1400 && i < n; gz += blk) {
      // (aligned with the painted blocks)
      const ox = gx - ((-W / 2) % blk), oz = gz - ((-W / 2) % blk);
      for (let k = 0; k < 4 && i < n; k++) {
        const w = r.range(14, 30), d = r.range(14, 30), h = r.range(9, 46) * (Math.hypot(gx, gz) < 500 ? 1.25 : 1), cx = ox + road / 2 + r.range(w / 2, blk - road - w / 2), cz = oz + road / 2 + r.range(d / 2, blk - road - d / 2);
        M.makeScale(w, h, d).setPosition(cx, 0, cz); im.setMatrixAt(i, M);
        col.setHSL(r.next() < 0.3 ? r.range(0.55, 0.62) : r.range(0.03, 0.11), r.range(0.08, 0.3), r.range(0.22, 0.5)); im.setColorAt(i, col); i++;
      }
    }
    im.count = i; this.scene.add(im);
  }

  // clouds (water droplets) at different heights near the fall line: they rush up past you
  _clouds() {
    this.puffs = new BillboardSystem(this.scene, 900, false); this.puffs.uniforms.uLight.value = 1.05;
    const r = new RNG(77); this.cl = [];
    for (const [alt, n, spread] of [[2350, 7, 700], [1750, 9, 420], [1300, 9, 340], [900, 8, 300]]) {
      for (let c = 0; c < n; c++) {
        const a0 = r.range(0, 6.28), d0 = r.range(70, spread), cx = Math.cos(a0) * d0, cz = Math.sin(a0) * d0, R = r.range(30, 70);
        // a heap of smaller puffs: flat underneath, domed on top, shadowed low down (so it reads as a cloud, not a disc)
        for (let i = 0; i < 24; i++) { const a = r.range(0, 6.28), d = Math.sqrt(r.next()) * R, h = (1 - d / R) * R * 0.7 * r.range(0.2, 1); this.cl.push([cx + Math.cos(a) * d, alt - 0.1 * R + h, cz + Math.sin(a) * d * 0.8, r.range(14, 34) * (1 - 0.3 * d / R), r.range(0, 6.28), 0.7 + 0.3 * h / (0.7 * R)]); }
      }
    }
  }

  // a crumpled sheet of red-and-white canopy fabric (the wad, and the pilot chute that can't fill)
  _rag(w, h, cells, key) {
    const c = Tex.canvas(256, 64), x = c.getContext('2d');
    for (let i = 0; i < 9; i++) { x.fillStyle = i % 3 === 1 ? '#f4f1ea' : '#d8402c'; x.fillRect(i * 256 / 9, 0, 256 / 9 + 1, 64); }
    const U = { uK: { value: 1 }, uT: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), roughness: 0.75, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uK, uT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec3 p = position; float a = p.x * 0.9 + uT * 0.35, b = p.y * 1.7 - uT * 0.25;
        vec3 n = vec3(sin(a * 1.3 + p.y * 2.1) + 0.5 * sin(b * 2.7 + p.x * 3.3), sin(b * 1.1 + p.x * 1.9) * 0.6 + 0.4 * sin(a * 3.1 + uT * 0.4), sin(a * 1.7 + b * 1.3) + 0.6 * sin(p.x * 4.1 - p.y * 2.3));
        transformed = mix(p, p * 0.32, uK * 0.8) + n * (0.25 + 0.55 * uK) * ${(h / 3).toFixed(3)}; }`); };
    mat.customProgramCacheKey = () => key;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, cells[0], cells[1]), mat); this.scene.add(m);
    return { m, U };
  }

  // the parachute: with no drag the pilot chute can't fill and can't pull the canopy out. It is thrown out at the pull and
  // just drifts off at the speed it was given, on a slack bridle; the canopy spills half out of the container as a loose
  // wad on slack lines. Beside them, a "normal air" ghost of the canopy opening (and falling away above him, as it would)
  _canopy() {
    this.wad = this._rag(4.2, 1.6, [20, 8], 'nrWad');
    this.pc = this._rag(1.1, 0.9, [8, 6], 'nrPilot');
    // the lines: 12 suspension lines + the bridle, as polylines (weightless: they float in loose loops)
    this.nL = 13; this.seg = 18;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(this.nL * this.seg * 2 * 3), 3));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#d9d2c4', transparent: true, opacity: 0.55 })); this.lines.frustumCulled = false; this.scene.add(this.lines);
    // the ghost: an open round canopy (a dome everyone reads as a parachute), see-through and dark-edged (it reads on the
    // pale sky), its gores and lines running down to where his harness is
    const R = 3.8, cap = Math.PI * 0.42, rimY = R * Math.cos(cap) * 0.7, rimR = R * Math.sin(cap);
    const cg = new THREE.SphereGeometry(R, 24, 6, 0, Math.PI * 2, 0, cap); cg.scale(1, 0.7, 1); cg.translate(0, -rimY, 0);
    const gm = new THREE.MeshBasicMaterial({ color: '#1d2b3c', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const ghost = new THREE.Group(), body = new THREE.Mesh(cg, gm); ghost.add(body);
    const lp = [], top = (R * 0.7) - rimY;
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2;
      for (let j = 0; j < 6; j++) { const p0 = j / 6 * cap, p1 = (j + 1) / 6 * cap; lp.push(Math.cos(a) * R * Math.sin(p0), R * Math.cos(p0) * 0.7 - rimY, Math.sin(a) * R * Math.sin(p0), Math.cos(a) * R * Math.sin(p1), R * Math.cos(p1) * 0.7 - rimY, Math.sin(a) * R * Math.sin(p1)); }
      lp.push(Math.cos(a) * rimR, 0, Math.sin(a) * rimR, Math.cos(a1) * rimR, 0, Math.sin(a1) * rimR);
      lp.push(Math.cos(a) * rimR, 0, Math.sin(a) * rimR, 0, -2.6, 0);
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const em = new THREE.LineBasicMaterial({ color: '#1a2636', transparent: true, opacity: 0, fog: false });
    ghost.add(new THREE.LineSegments(lg, em)); this.scene.add(ghost);
    this.ghost = { g: ghost, fill: gm, edge: em };
  }

  // the arch: face down, arms out and up, legs bent; the right hand goes back to pull at NR.deploy
  _pose(S) {
    const p = basePose(), u = S - NR.deploy, w = 0.04 * Math.sin(S * 3.1), pull = u > -0.4 && u < 0.5 ? Math.sin(MathX.clamp((u + 0.4) / 0.9, 0, 1) * Math.PI) : 0;
    p.spine = -0.3; p.neck = -0.55; p.lSh = [2.0, 1.0]; p.rSh = [MathX.lerp(2.0, -0.3, pull), MathX.lerp(1.0, 0.5, pull)]; p.lEl = 1.0 + w; p.rEl = MathX.lerp(1.0, 1.4, pull);
    p.lHip = [-0.25, 0.28]; p.rHip = [-0.25, 0.28]; p.lKnee = 1.25 + w; p.rKnee = 1.25 - w; p.lFoot = 0.4; p.rFoot = 0.4; p.hipY = 0;
    return p;
  }

  update(S) {
    const alt = NR_JUMP.alt(S), J = this.p, u = S - NR.deploy;
    J.root.position.set(0, alt, 0); J.root.rotation.set(Math.PI / 2 + 0.06 * Math.sin(S * 0.9), 0.15 * Math.sin(S * 0.37), 0.05 * Math.sin(S * 1.3), 'YXZ');
    J.apply(this._pose(S)); J.root.updateMatrixWorld(true);
    // the parachute: the pilot chute thrown out at the pull drifts off at its throw speed; the canopy spills half out
    const back = J.j.spine.localToWorld(this._v.set(0, 0.3, -0.22)).clone(), vis = u > 0;
    this.pc.m.visible = this.lines.visible = vis; this.wad.m.visible = u > 0.7;
    if (vis) {
      const pc = this.pc.m.position.set(-0.3 - 0.45 * u, 0.5 + 1.25 * u, 0.25 + 0.35 * u).add(back);
      this.pc.m.rotation.set(0.7 * Math.sin(u * 1.1), u * 0.6, 0.5 * Math.sin(u * 0.8)); this.pc.m.scale.setScalar(MathX.smooth(u, 0, 0.25)); this.pc.U.uT.value = u + 3;
      const ub = Math.max(0, u - 0.7), sw = MathX.smooth(ub, 0, 1.4);
      const wad = this.wad.m.position.set(0.35 * sw + 0.18 * ub, 0.25 + 0.55 * sw + 0.12 * ub, -0.05 + 0.4 * sw).add(back);
      this.wad.m.rotation.set(-1.2 + 0.25 * Math.sin(ub * 0.6), 0.5 + 0.12 * ub, 0.25 * Math.sin(ub * 0.7)); this.wad.m.scale.setScalar(0.25 + 0.3 * sw); this.wad.U.uT.value = ub;
      // lines: from his shoulders (risers) to the wad, 3 m long but slack (nothing pulls them); the bridle to the pilot chute
      const P = this.lines.geometry.attributes.position.array, sh = [J.j.la.sh, J.j.ra.sh].map((q) => q.getWorldPosition(new THREE.Vector3()));
      this.wad.m.updateMatrixWorld(true);
      let o = 0;
      const line = (a, b, slack, seed) => {
        let px = a.x, py = a.y, pz = a.z;
        for (let s = 1; s <= this.seg; s++) {
          const f = s / this.seg, bend = Math.sin(f * Math.PI) * slack;
          const x = a.x + (b.x - a.x) * f + bend * Math.sin(seed * 3 + u * 0.4 + f * 4), y = a.y + (b.y - a.y) * f + bend * 0.6 * Math.sin(seed * 5 + u * 0.3 + f * 3), z = a.z + (b.z - a.z) * f + bend * Math.cos(seed * 4 + u * 0.35 + f * 3.5);
          P.set([px, py, pz, x, y, z], o); o += 6; px = x; py = y; pz = z;
        }
      };
      for (let i = 0; i < 12; i++) {
        const e = u > 0.7 ? this.wad.m.localToWorld(this._t.set(-1.8 + (i % 6) * 0.72, -0.7 + (i >= 6 ? 0.9 : 0), 0)) : this._t.copy(back);
        const a = sh[i % 2], d = a.distanceTo(e);
        line(a, e, Math.sqrt(Math.max(0, 9 - d * d)) * 0.5 * MathX.smooth(u, 0.7, 1.3) + 0.06, i * 1.7);
      }
      const dp = back.distanceTo(pc); line(back, pc, Math.sqrt(Math.max(0, 6.25 - dp * dp)) * 0.5 + 0.1, 9.1);
      this.lines.geometry.attributes.position.needsUpdate = true;
    }
    // the ghost: in normal air the canopy would open above him (and he and it would slow: from here it falls away upwards)
    const gw = S - (NR.deploy + 0.35), Gh = this.ghost, ga = gw > 0 ? MathX.smooth(gw, 0, 0.3) * (1 - MathX.smooth(gw, 1.4, 1.9)) : 0;
    Gh.g.visible = ga > 0.001;
    if (Gh.g.visible) {
      const open = MathX.smooth(gw, 0, 0.45), up = 2.6 + 9 * Math.max(0, gw - 0.5) ** 2;
      Gh.g.position.set(J.root.position.x + 0.15, alt + up, J.root.position.z + 0.1); Gh.g.scale.set(0.25 + 0.75 * open, 0.6 + 0.4 * open, 0.25 + 0.75 * open); Gh.g.rotation.set(0, 0.5, 0.05);
      Gh.fill.opacity = 0.3 * ga; Gh.edge.opacity = 0.85 * ga;
    }
    // clouds rush up past
    this.puffs.begin(this.scene.fog);
    for (const [x, y, z, s, r, sh] of this.cl) { if (Math.abs(y - alt) > 900) continue; this.puffs.push(x, y, z, s, r, 0.72, sh, 1, 1, 1); }
    this.puffs.end();
    // the airliner, far above
    this.plane.position.set(-2200 + NR_PLANE.v * (S - NR.sky[0]), NR_PLANE.alt(S), -4200);
    nrHaze(this.plane, this.haze, 0.45);
    this._camera(S, alt);
  }

  // the camera falls with him: beside and below him (the sky, the airliner), above him (the city), close on the pull, then wide
  _camera(S, alt) {
    const C = this.cam;
    // (always above or beside him, never swinging under: the city stays below)
    if (!this._k) this._k = {
      x: [[12.4, 3.2], [14.0, 3.6], [15.2, 2.2], [16.2, 2.4], [16.8, 4.4], [17.8, 5.0], [18.8, 5.0], [20.4, 4.6]],
      y: [[12.4, 2.4], [14.0, 2.8], [15.2, 4.2], [16.2, 3.8], [16.8, 0.4], [17.8, 0.2], [18.8, 1.0], [20.4, 1.0]],
      z: [[12.4, 2.6], [14.0, 2.4], [15.2, 2.4], [16.2, 2.0], [16.8, -2.6], [17.8, -3.4], [18.8, 2.8], [20.4, 2.6]],
      lx: [[12.4, 0], [14.0, 0], [15.2, 0], [16.2, 0], [16.8, 0], [17.8, 0.2], [18.8, 0.4], [20.4, 0.4]],
      ly: [[12.4, 0.3], [14.0, 0.1], [15.2, -2.2], [16.2, -2.4], [16.8, 1.6], [17.8, 2.2], [18.8, 1.2], [20.4, 1.1]],
      lz: [[12.4, -0.25], [14.0, -0.3], [15.2, -1.5], [16.2, -1.5], [16.8, 0.2], [17.8, 0.4], [18.8, 0.4], [20.4, 0.4]],
      fov: [[12.4, 60], [14.0, 62], [15.2, 66], [16.2, 66], [16.8, 66], [17.8, 68], [18.8, 62], [20.4, 58]],
    };
    const k = this._k, tr = (n) => (this['_t' + n] || (this['_t' + n] = new Track(k[n], 'inOutSine'))).value(S);
    C.position.set(tr('x'), alt + tr('y'), tr('z'));
    C.lookAt(tr('lx'), alt + tr('ly'), tr('lz'));
    C.rotation.z += 0.012 * Math.sin(S * 2.3) + 0.008 * noise1(S * 4, 81);
    const f = tr('fov'); if (Math.abs(C.fov - f) > 1e-3) { C.fov = f; C.updateProjectionMatrix(); }
    C.updateMatrixWorld(true);
  }
}
