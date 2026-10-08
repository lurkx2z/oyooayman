/* =====================================================================
   BOW, FORK, WATCH — the things you hold. Pure functions of time.
     NeBow     a youth recurve bow in your left hand, an arrow on the string. Drawing bends the limbs (they resist as
               usual); let go and nothing bends them back: the string goes limp and the arrow just drops at your feet.
     NeTarget  the archery booth: a target boss on an easel 14.6 m away, a straw-bale backstop, a sign.
     NeFork    a tuning fork in your right hand. Struck on the café table, the struck prong is pushed in and stays in.
     NeWatch   the dial and hands on your left wrist (the engine's watch strap and case): stopped at 3:41:52.
   Bow space: origin at the grip, +Y up the bow, +Z toward you (the string side), +X your right.
   ===================================================================== */

const NE_BOW = {
  riser: 0.2, limb: 0.31, brace: 0.164,           // half-riser, limb length, brace height (m): a 1 m youth bow ("try it")
  bendZ: 0.15, bendY: 0.1,                         // full draw: the tips come back 15 cm and in a little
  shelf: [-0.021, 0.055, 0.0],                     // the arrow rests here (left side of the riser)
  arrow: 0.70, com: 0.42,                          // arrow length, its balance point from the nock
  drawMax: 0.5,                                    // the nock's distance behind the grip at full draw
  toe: 0.25,                                       // the bow turned left in the fist (radians) so the arrow points ahead
  cant: -0.44,                                     // and canted (top to the right, about 25°), as many archers hold it
};

// the limb's centre line at s ∈ [0, 1] (root → tip), for a limb bend b ∈ [0, 1]; sign = +1 upper, −1 lower
function neLimb(s, b, sign, out) {
  const B = NE_BOW, z0 = (0.25 * Math.pow(s, 1.5) - 0.06 * MathX.smooth(s, 0.7, 1.0)) * B.limb / 0.36;
  out.set(0, sign * (B.riser + B.limb * s * (1 - B.bendY * b * s)), z0 + b * B.bendZ * s * s);
  return out;
}

class NeBow {
  constructor(scene, hands) {
    this.hands = hands;
    const g = new THREE.Group(); g.name = 'neBow'; this.g = g;
    // the bow sits in the left fist: bow +Y = hand −X (down the knuckles is down the bow), bow +Z = hand −Y, bow +X = hand +Z
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0));
    g.quaternion.setFromRotationMatrix(m); g.position.set(0.0, 0.066, 0.034);
    g.rotateY(NE_BOW.toe);      // the hand points a little right of the arrow (the bow arm comes in from your left shoulder)
    g.rotateZ(NE_BOW.cant);
    hands.left.g.add(g);
    const riserMat = Mat.std('#2b3a4a', { roughness: 0.35, metalness: 0.55 }), gripMat = Mat.std('#3a2b20', { roughness: 0.8 });
    this.limbMat = Mat.std('#1d1f22', { roughness: 0.4, metalness: 0.1, name: 'neLimb' });
    const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.frustumCulled = false; g.add(o); return o; };
    // the riser: a slim bar with the grip bulge and the sight window cut on the left
    add(new THREE.BoxGeometry(0.028, 2 * NE_BOW.riser, 0.042), riserMat, 0.004, 0, -0.004);
    add(new THREE.BoxGeometry(0.034, 0.11, 0.05), gripMat, 0.002, -0.02, 0.006);
    add(new THREE.BoxGeometry(0.012, 0.004, 0.03), Mat.std('#c9c3b6', { roughness: 0.6 }), -0.018, NE_BOW.shelf[1] - 0.004, 0);   // the arrow rest
    // limbs: tapered ribbons rebuilt each frame from the bend
    this.limbs = [1, -1].map((sign) => { const geo = new THREE.BufferGeometry(), o = add(geo, this.limbMat, 0, 0, 0); return { sign, geo, o }; });
    // the string (a thin tube, rebuilt each frame) and a dashed line where it sits when the bow is at rest
    this.stringMat = new THREE.MeshStandardMaterial({ color: '#e9e4d8', roughness: 0.6, name: 'neString' });
    this.string = add(new THREE.BufferGeometry(), this.stringMat, 0, 0, 0);
    { const lm = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false }), lg = new THREE.Group(), v0 = neLimb(1, 0, 1, new THREE.Vector3());
      for (let y = -v0.y; y < v0.y; y += 0.05) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.026, 0.004), lm); d.position.set(0, y + 0.013, v0.z); d.frustumCulled = false; lg.add(d); }
      lg.visible = false; g.add(lg); this.restLine = lg; }
    this.arrow = new NeArrow(scene);
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion();
    this._bendKey = -1; this._rel = null;
  }

  // where your right hand's string fingers are, in bow space (the nock point); y/x are pinned to the arrow line
  _nock(out) {
    const R = this.hands.right, j = R.fingers[1][1];       // the middle finger's middle joint hooks the string
    j.updateWorldMatrix(true, false); out.set(0, 0, 0).applyMatrix4(j.matrixWorld);
    this.g.updateWorldMatrix(true, false); this._m.copy(this.g.matrixWorld).invert(); out.applyMatrix4(this._m);
    return out;
  }

  // the draw (0 rest → 1 full) at story t: how far back the string is, from the scripted hand poses
  draw(t) { const D = NE.bow.draw; return t < D[0] ? 0 : t < NE.bow.release ? MathX.smooth(t, D[0], D[1]) : 1; }

  update(t, app) {
    const B = NE.bow, vis = t >= B.t0 && t < B.shot[0];
    this.g.visible = vis;
    this.arrow.update(t, app, this);
    if (!vis) return;
    // the limbs bend with the draw; after the release they keep the deepest bend (nothing springs back)
    const bend = this.draw(t);
    if (Math.abs(bend - this._bendKey) > 1e-4) { this._bendKey = bend; this._limbs(bend); }
    // the string: tip → nock → tip while drawn; limp after the release
    const top = neLimb(1, bend, 1, new THREE.Vector3()), bot = neLimb(1, bend, -1, new THREE.Vector3());
    const pts = [];
    if (t < B.release) {
      const n = this._nock(this._v), k = MathX.smooth(t, B.draw[0] - 0.05, B.draw[0] + 0.2);
      // before the draw the string is straight (the fingers rest on it); then it follows the fingers
      const nock = new THREE.Vector3(0, NE_BOW.shelf[1] + 0.006, NE_BOW.brace).lerp(new THREE.Vector3(0, NE_BOW.shelf[1] + 0.006, Math.max(NE_BOW.brace, n.z)), k);
      pts.push(top, nock, bot);
    } else {
      // limp: the string is longer than the gap between the bent tips; it hangs in a loose loop toward you and down
      const L = 2 * neLimb(1, 0, 1, this._w).y, D = top.distanceTo(bot), sag = Math.sqrt(Math.max(0, 3 * D * (L - D) / 8));
      const τ = t - B.release, sw = Math.exp(-τ * 3) * Math.sin(τ * 14) * 0.04;
      for (let i = 0; i <= 16; i++) {
        const u = i / 16, y = top.y + (bot.y - top.y) * u, w = 4 * u * (1 - u);
        pts.push(new THREE.Vector3(sag * 0.35 * w + sw * w, y - 0.04 * w, top.z + sag * 0.9 * w));
      }
    }
    this.string.geometry.dispose();
    this.string.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 40, 0.0016, 4, false);
    this.restLine.visible = false;   // (the slack string says it; a dashed rest line along the bow read as a road marking)
  }

  _limbs(bend) {
    const W0 = 0.03, W1 = 0.012, T0 = 0.009, T1 = 0.005, N = 16, v = new THREE.Vector3(), v2 = new THREE.Vector3();
    for (const L of this.limbs) {
      const pos = [], idx = [];
      for (let i = 0; i <= N; i++) {
        const s = i / N; neLimb(s, bend, L.sign, v); neLimb(Math.min(1, s + 0.02), bend, L.sign, v2);
        // the limb's thickness direction: perpendicular to its tangent in the Y–Z plane
        const ty = v2.y - v.y, tz = v2.z - v.z, tl = Math.hypot(ty, tz) || 1, ny = -tz / tl, nz = ty / tl;
        const w = W0 + (W1 - W0) * s, th = (T0 + (T1 - T0) * s) * 0.5;
        for (const [sx, sn] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pos.push(sx * w / 2, v.y + ny * th * sn * L.sign, v.z + nz * th * sn * L.sign);
      }
      for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + (k + 1) % 4, c = a + 4, d = b + 4; idx.push(a, b, d, a, d, c); }
      L.geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); L.geo.setIndex(idx); L.geo.computeVertexNormals();
      L.geo.attributes.position.needsUpdate = true;
    }
  }
}

// the arrow: on the string (in your hands) until the release; then it falls off the rest and lands dead at your feet
class NeArrow {
  constructor(scene) {
    const g = new THREE.Group(); g.name = 'neArrow'; scene.add(g); this.g = g;
    // a bright fibreglass "try it" arrow (orange shaft, red and white vanes) so it reads at phone size
    const A = NE_BOW.arrow, shaft = Mat.std('#f08a24', { roughness: 0.45, metalness: 0.05 }), wrap = Mat.std('#f4efe2', { roughness: 0.6 }), vane = Mat.std('#e0301e', { roughness: 0.55 }), vane2 = Mat.std('#f6f3ea', { roughness: 0.55 });
    // arrow space: nock at the origin, the point toward −Z
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.frustumCulled = false; g.add(o); return o; };
    add(new THREE.CylinderGeometry(0.0042, 0.0042, A, 8), shaft, 0, 0, -A / 2, Math.PI / 2);
    add(new THREE.CylinderGeometry(0.0046, 0.0046, 0.1, 8), wrap, 0, 0, -0.07, Math.PI / 2);
    add(new THREE.ConeGeometry(0.0045, 0.03, 6), Mat.std('#b9bcc0', { roughness: 0.3, metalness: 0.8 }), 0, 0, -A - 0.013, -Math.PI / 2);
    add(new THREE.BoxGeometry(0.004, 0.009, 0.014), Mat.std('#f0c22a', { roughness: 0.5 }), 0, 0, 0.004);   // the nock
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const o = add(new THREE.BoxGeometry(0.0008, 0.016, 0.07), i ? vane2 : vane, Math.sin(a) * 0.011, Math.cos(a) * 0.011, -0.065, 0, 0, -a); o.castShadow = false; }
    this._rel = null; this._m = new THREE.Matrix4(); this._v = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler();
  }

  // the arrow on the bow (bow space): nock at the string's nock point, shaft over the rest
  _onBow(bow, nock) {
    const S = NE_BOW.shelf, d = new THREE.Vector3(S[0] - nock.x, S[1] - nock.y, S[2] - nock.z).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), d);
    bow.g.updateWorldMatrix(true, false);
    const p = nock.clone().applyMatrix4(bow.g.matrixWorld), wq = new THREE.Quaternion(); bow.g.getWorldQuaternion(wq);
    return { p, q: wq.multiply(q) };
  }

  // the world pose at the moment of release, evaluated once by posing the camera and hands at that instant (pure: the
  // same answer whatever frame asks first)
  _release(app, bow, t) {
    if (this._rel) return this._rel;
    const R = NE.bow.release;
    app.cam.update(R); app.camera.updateMatrixWorld(true); app.hands.update(R);
    const n = bow._nock(new THREE.Vector3()), nock = new THREE.Vector3(0, NE_BOW.shelf[1] + 0.006, Math.max(NE_BOW.brace, n.z));
    const P = this._onBow(bow, nock);
    app.cam.update(t); app.camera.updateMatrixWorld(true); app.hands.update(t);
    // its forward direction flattened (it falls in the vertical plane through the aim), and where it lands
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(P.q); f.y = 0; f.normalize();
    const com0 = P.p.clone().addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(P.q), NE_BOW.com);
    const yaw = Math.atan2(-f.x, -f.z), ground = 0.15 + 0.004;
    // fall: a short tip over the rest (nock drops, nose up), then free fall drifting back toward you; land flat, no bounce
    let land = 0;
    for (let s = 0; s < 2; s += 1 / 480) { if (this._fall(com0, f, s).y <= ground) { land = s; break; } }
    this._rel = { P, f, com0, yaw, ground, land };
    return this._rel;
  }
  _fall(com0, f, s) {
    const a = Math.min(s, 0.14), b = Math.max(0, s - 0.14), y = com0.y - 0.5 * NE_G * 0.3 * a * a - (NE_G * 0.3 * 0.14) * b - 0.5 * NE_G * b * b;
    const back = -0.05 * a - 0.32 * b;
    return this._v.set(com0.x + f.x * back, y, com0.z + f.z * back);
  }

  update(t, app, bow) {
    const B = NE.bow, inLapse = t >= NE.lapse[0];
    this.g.visible = (t >= B.t0 && t < NE.fork.t0) || t >= NE.clockShot[0];     // (it is still lying there in the time-lapse)
    if (!this.g.visible) return;
    if (t < B.release) {
      const n = bow._nock(new THREE.Vector3()), k = MathX.smooth(t, B.draw[0] - 0.05, B.draw[0] + 0.2);
      const nock = new THREE.Vector3(0, NE_BOW.shelf[1] + 0.006, NE_BOW.brace).lerp(new THREE.Vector3(0, NE_BOW.shelf[1] + 0.006, Math.max(NE_BOW.brace, n.z)), k);
      const P = this._onBow(bow, nock); this.g.position.copy(P.p); this.g.quaternion.copy(P.q);
      return;
    }
    const R = this._release(app, bow, t), s = Math.min(t - B.release, R.land), c = this._fall(R.com0, R.f, s).clone();
    // pitch: nose up while the nock drops off the string, then over toward level; flat on the ground once it lands
    const pitch = s < 0.14 ? 0.42 * (s / 0.14) ** 2 : Math.max(-0.05, 0.42 - 1.1 * (s - 0.14));
    const landed = t - B.release >= R.land, roll = landed ? 0.35 : 0.2 * s;
    this._e.set(landed ? 0 : pitch, R.yaw + (landed ? 0.06 : 0.03 * s), roll, 'YXZ'); this.g.quaternion.setFromEuler(this._e);
    // place the nock so that the balance point is at c
    const fwd = this._v.set(0, 0, -1).applyQuaternion(this.g.quaternion);
    this.g.position.copy(c).addScaledVector(fwd, -NE_BOW.com);
    if (landed) this.g.position.y = R.ground + 0.0035;
    void inLapse;
  }
  // where it lies (world), for the low shot and the time-lapse pile
  lying(app) { return this._rel ? { x: this.g.position.x, z: this.g.position.z, yaw: this._rel.yaw } : null; }
}

// the archery booth at the far end of the plaza: an easel with an 80 cm target face on a straw boss, a bale backstop
class NeTarget {
  constructor(scene) {
    const [tx, tz] = NE_ARCH.target, g = new THREE.Group(); g.position.set(tx, 0.15, tz); scene.add(g); this.g = g;
    const wood = Mat.std('#8a6a44', { roughness: 0.85 }), straw = Mat.std('#c9b071', { roughness: 0.95 });
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    // the face: 10 rings (white, black, blue, red, gold), painted on a canvas
    const c = Tex.canvas(512, 512), x = c.getContext('2d');
    x.fillStyle = '#c9b071'; x.fillRect(0, 0, 512, 512);
    const cols = ['#f4f2ec', '#f4f2ec', '#1d1d1f', '#1d1d1f', '#2f7fd0', '#2f7fd0', '#d8352a', '#d8352a', '#f2c230', '#f2c230'];
    for (let i = 0; i < 10; i++) { const r = 250 * (1 - i / 10); x.fillStyle = cols[i]; x.beginPath(); x.arc(256, 256, r, 0, Math.PI * 2); x.fill(); x.strokeStyle = i === 2 || i === 3 ? '#e8e4da' : '#1d1d1f'; x.lineWidth = 2; x.stroke(); }
    x.fillStyle = '#1d1d1f'; x.fillRect(254, 254, 4, 4);
    add(new THREE.CylinderGeometry(0.62, 0.62, 0.3, 28), straw, 0, 1.25, 0, Math.PI / 2);
    const face = add(new THREE.CircleGeometry(0.4, 40), new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.8, name: 'neTargetFace' }), 0, 1.25, 0.152);
    face.castShadow = false;
    // the easel: two front legs and a back leg
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.06, 2.0, 0.06), wood, s * 0.5, 0.95, 0.12, 0.1, 0, s * 0.18);
    add(new THREE.BoxGeometry(0.06, 2.0, 0.06), wood, 0, 0.9, -0.5, -0.45, 0, 0);
    add(new THREE.BoxGeometry(1.25, 0.06, 0.06), wood, 0, 0.6, 0.2);
    // the backstop: straw bales stacked behind it
    for (let i = -2; i <= 2; i++) for (let j = 0; j < 2; j++) add(new THREE.BoxGeometry(0.95, 0.45, 0.48), straw, i * 0.97 + (j ? 0.45 : 0), 0.225 + j * 0.45, -1.3);
    // a sign on a post beside the line (you stand at the line)
    const sign = Tex.label([['ARCHERY', 64], ['TRY IT', 44]], { w: 512, h: 256, bg: '#2a5a3c', fg: '#ffffff', border: '#f2f0e8' });
    const sp = new THREE.Group(); sp.position.set(NE_ARCH.x - 2.2, 0.15, NE_ARCH.z - 1.2); scene.add(sp);
    { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 6), Mat.std('#2a2c2e', { roughness: 0.5, metalness: 0.5 })); o.position.y = 1.0; o.castShadow = true; sp.add(o);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.03), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.6 })); b.position.y = 1.85; b.rotation.y = 0.5; b.castShadow = true; sp.add(b); }
    // the shooting line, painted across the paving
    const line = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.07), Mat.std('#f2f0e8', { roughness: 0.7 })); line.rotation.x = -Math.PI / 2; line.position.set(NE_ARCH.x, 0.153, NE_ARCH.z - 0.35); line.receiveShadow = true; scene.add(line);
  }
}

// the tuning fork. Fork space: the bend of the U at the origin, prongs up +Y (gap along X), the stem down −Y.
const NE_FORK = { prong: 0.11, gap: 0.009, w: 0.0062, d: 0.0046, push: 0.0068 };
class NeFork {
  constructor(hands) {
    const g = new THREE.Group(); g.name = 'neFork'; this.g = g;
    // in the right fist: fork +Y = hand +X (up out of the fist), fork +Z = hand −Y (toward you), fork +X = hand −Z
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0));
    g.quaternion.setFromRotationMatrix(m); g.position.set(0.044, 0.06, 0.03);
    hands.right.g.add(g);
    const steel = Mat.std('#c4c9cf', { roughness: 0.22, metalness: 0.9, name: 'neFork' });
    const add = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, steel); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.frustumCulled = false; g.add(o); return o; };
    const F = NE_FORK;
    add(new THREE.CylinderGeometry(0.0034, 0.0034, 0.08, 8), 0, -0.04 - 0.004, 0);
    add(new THREE.SphereGeometry(0.0055, 10, 8), 0, -0.088, 0);
    add(new THREE.TorusGeometry(F.gap, F.w / 2, 6, 14, Math.PI), 0, 0, 0, 0, 0, Math.PI);
    // the prongs (the −X one, under the fist when the palm is down, is the one that hits the table; it is a subdivided box so it can bend)
    add(new THREE.BoxGeometry(F.w, F.prong, F.d), F.gap, F.prong / 2, 0);
    this.pGeo = new THREE.BoxGeometry(F.w, F.prong, F.d, 1, 12, 1); this.pGeo.translate(-F.gap, F.prong / 2, 0); this.pBase = this.pGeo.attributes.position.array.slice();
    const p = new THREE.Mesh(this.pGeo, steel); p.frustumCulled = false; g.add(p);
    // a dashed line where the struck prong's outer edge was (it is straight; the prong now leans in from it)
    { const lm = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false }), lg = new THREE.Group();
      for (let y = 0.012; y < F.prong + 0.004; y += 0.012) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.0014, 0.0065, 0.0014), lm); d.position.set(-(F.gap + F.w / 2 + 0.0014), y, F.d / 2 + 0.0008); d.frustumCulled = false; lg.add(d); }
      lg.visible = false; g.add(lg); this.line = lg; }
    this._k = -1;
  }
  // the struck prong's tip in the world (for its label)
  tipWorld(t) { this.g.updateWorldMatrix(true, false); const v = new THREE.Vector3(-NE_FORK.gap + this.push(t), NE_FORK.prong, 0).applyMatrix4(this.g.matrixWorld); return [v.x, v.y, v.z]; }
  // how far the struck prong's tip is pushed in (it stays in)
  push(t) { return NE_FORK.push * MathX.smooth(t, NE.fork.strike, NE.fork.strike + 0.025); }
  update(t) {
    const vis = t >= NE.fork.t0 && t < NE.watch.t0 + 0.2; this.g.visible = vis; if (!vis) return;
    const k = this.push(t);
    if (Math.abs(k - this._k) > 1e-6) {
      this._k = k; const p = this.pGeo.attributes.position.array, b = this.pBase, L = NE_FORK.prong;
      for (let i = 0; i < p.length; i += 3) { const u = Math.max(0, b[i + 1]) / L; p[i] = b[i] + k * u * u; }
      this.pGeo.attributes.position.needsUpdate = true; this.pGeo.computeVertexNormals();
    }
    this.line.visible = t > NE.fork.up[1] - 0.2;
  }
}

// the watch's dial (a canvas): off-white, bar indices, serif numerals at 12, 3, 6, 9 (the macro replica reuses it)
function neWatchDial() {
  const c = Tex.canvas(512, 512), x = c.getContext('2d');
  x.fillStyle = '#f3f1ea'; x.beginPath(); x.arc(256, 256, 256, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#1b1c1e';
  for (let i = 0; i < 60; i++) { x.save(); x.translate(256, 256); x.rotate(i / 60 * Math.PI * 2); const big = i % 5 === 0; x.fillRect(-(big ? 7 : 2.5), -238, big ? 14 : 5, big ? 56 : 22); x.restore(); }
  x.font = '500 74px "Lora", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const [n, a] of [[12, 0], [3, 90], [6, 180], [9, 270]]) { const r = 140, A = MathX.deg(a); x.fillText(String(n), 256 + Math.sin(A) * r, 256 - Math.cos(A) * r + 4); }
  x.font = '500 26px "Lora", Georgia, serif'; x.fillText('QUARTZ', 256, 330);
  return c;
}

// your watch: a white dial with bar indices and a red seconds hand on the engine's watch case (left wrist, back of the hand)
class NeWatch {
  constructor(hands) {
    const g = new THREE.Group(); g.name = 'neWatch'; this.g = g;
    // the dial faces away from the palm (−Z), out of the case; 12 points across the wrist (hand +X), 3 toward the fingers (+Y)
    g.position.set(0, -0.026, -0.0291); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1)));
    hands.left.g.add(g);
    const c = neWatchDial();
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.0137, 40), new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.35, name: 'neDial' }));
    dial.frustumCulled = false; g.add(dial);
    const hand = (len, w, col, z, tail = 0) => { const h = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, len + tail, 0.0004), Mat.std(col, { roughness: 0.4 })); b.position.set(0, (len - tail) / 2, 0); b.frustumCulled = false; h.add(b); h.position.z = z; g.add(h); return h; };
    const S = NE_STOPPED;
    this.hr = hand(0.0072, 0.0016, '#1b1c1e', 0.0004); this.min = hand(0.0109, 0.0011, '#1b1c1e', 0.0009); this.sec = hand(0.0118, 0.00045, '#d22a1e', 0.0014, 0.003);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 0.0006, 10), Mat.std('#d22a1e', { roughness: 0.4 })); cap.rotation.x = Math.PI / 2; cap.position.z = 0.0017; g.add(cap);
    const ang = (u) => -u * Math.PI * 2;
    this.hr.rotation.z = ang((S.h % 12 + S.m / 60 + S.s / 3600) / 12); this.min.rotation.z = ang((S.m + S.s / 60) / 60); this.sec.rotation.z = ang(S.s / 60);
    // the crystal over it (a faint glassy disc)
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.0139, 32), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.2, depthWrite: false }));
    glass.position.z = 0.0022; glass.frustumCulled = false; g.add(glass);
  }
  update() {}
}
