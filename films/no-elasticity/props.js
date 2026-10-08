/* =====================================================================
   PROPS — the things that keep their dents. Every shape here is a pure
   function of time: the deformation is recomputed from the rest shape
   each frame (no state carried between frames).
     NeBall      the bounced solid rubber ball (lands dead at ≈ 1.45 s with a flat spot)
     NeTramp     the park trampoline (first landing stretches the mat for good)
     NeRacket    montage insert: the ball pockets the strings, the pocket stays
     NeShoe      montage insert: a running shoe's foam squashes and stays thin
     NeCushions  montage insert: the café bench cushions keep the sitter's dent
     NeBand      montage insert: a rubber band stretched once stays long and slack
   ===================================================================== */

const NE_G = 9.81;

// ---------------------------------------------------------------------------------------------------------------------
// the ball: SOLID rubber (no air inside, so nothing but the rubber itself could push it back into shape)
// ---------------------------------------------------------------------------------------------------------------------
const NE_BALL = { r: 0.09, ground: 0.15, top: 1.02, e3: 0.35, flat: 0.2 };   // flat: the dead flat spot's depth / r (10 % of the diameter)
// the contact where the rule bites, and the dead landing after the weak bounce (story s)
function neBallTimes() {
  const D = NE.dribble, B = NE_BALL, A = B.top - B.ground - B.r, tc3 = D.t0 + 3.5 * D.P, vin = 4 * A / D.P, v0 = B.e3 * vin;
  return { tc3, tc4: tc3 + 2 * v0 / NE_G, v0, A };
}
// height of the ball's centre and how flat it is, at time t (the bounce, the weak bounce, the dead landing)
function neBallY(t) {
  const D = NE.dribble, B = NE_BALL, g0 = B.ground + B.r, { tc3, tc4, v0, A } = neBallTimes();
  if (t < tc3) {
    const u = ((t - D.t0) / D.P) % 1, s = Math.abs(2 * u - 1), y = g0 + A * (1 - (1 - s) * (1 - s));
    const kc = Math.round((t - D.t0) / D.P - 0.5), tc = D.t0 + (kc + 0.5) * D.P, sq = Math.max(0, 1 - Math.abs(t - tc) / 0.035) * 0.2;
    return { y: y - sq * B.r * 0.4, flat: 0, squash: sq };
  }
  // the weak bounce (rebound speed = e × impact speed) keeps part of its squash; the dead landing keeps all of it
  if (t < tc4) { const τ = t - tc3; return { y: g0 + v0 * τ - 0.5 * NE_G * τ * τ, flat: 0.4 * MathX.smooth(τ, 0, 0.03), squash: 0 }; }
  const f = 0.4 + 0.6 * MathX.smooth(t, tc4, tc4 + 0.04);
  return { y: g0 - f * B.flat * B.r, flat: f, squash: 0 };
}

class NeBall {
  constructor(scene) {
    // a bright marbled rubber ball (the kind sold as a "super ball"), no seams
    const c = Tex.canvas(512, 256), x = c.getContext('2d'), rng = new RNG(31);
    x.fillStyle = '#d8401f'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 22; i++) {
      x.strokeStyle = ['#f2a22a', '#b02818', '#f7d046', '#e8622b'][i % 4]; x.lineWidth = rng.range(6, 18); x.globalAlpha = rng.range(0.35, 0.7);
      x.beginPath(); const y0 = rng.range(0, 256), ph = rng.range(0, 6.3), am = rng.range(10, 40), fr = rng.range(1, 3);
      for (let u = 0; u <= 512; u += 8) { const v = y0 + am * Math.sin(u / 512 * Math.PI * 2 * fr + ph); u === 0 ? x.moveTo(u, v) : x.lineTo(u, v); }
      x.stroke();
    }
    x.globalAlpha = 1;
    this.geo = new THREE.SphereGeometry(NE_BALL.r, 36, 22);
    this.base = this.geo.attributes.position.array.slice();
    this.m = new THREE.Mesh(this.geo, new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.38, name: 'neBall' }));
    this.m.castShadow = true; this.m.receiveShadow = true;
    scene.add(this.m);
    this._key = '';
    this._dead = neBallTimes().tc4;
    // a dashed yellow ring: the ball's round outline before it died (the low insert turns it to face the camera)
    // only over the top (the sides bulge out a little: rubber keeps its volume, so a flat bottom pushes the middle out)
    { const lm = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false }), g = new THREE.Group(), n = 13, R = NE_BALL.r + 0.004;
      for (let i = 0; i < n; i++) { const a0 = MathX.deg(18 + 144 * (i + 0.5) / n); const d = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0045, 0.002), lm); d.position.set(Math.cos(a0) * R, Math.sin(a0) * R, 0); d.rotation.z = a0 + Math.PI / 2; g.add(d); }
      g.visible = false; scene.add(g); this.ring = g; }
  }

  // where the ball is (beside the teenager's right hand, where it died)
  spot(cast) {
    const T = cast.teen, th = MathX.deg(T.spec.face), fx = -Math.sin(th), fz = -Math.cos(th), rx = -fz, rz = fx;
    return [T.spec.path[0][1] + fx * 0.38 + rx * 0.24, T.spec.path[0][2] + fz * 0.38 + rz * 0.24];
  }

  update(t, cast) {
    const st = neBallY(t), B = NE_BALL, [bx, bz] = this.spot(cast);
    this.m.position.set(bx, st.y, bz);
    const spin = 0.7 + Math.min(t, this._dead) * 0.8;
    this.m.rotation.set(0.3, spin, 0.2);
    // deformation: the squash at each contact; after the rule, a flat spot on the ground that stays, the sides bulging a little
    const key = `${st.flat.toFixed(3)}_${st.squash.toFixed(3)}_${spin.toFixed(3)}`;
    if (key !== this._key) {
      this._key = key;
      const p = this.geo.attributes.position.array, b = this.base, r = B.r, f = st.flat, sq = st.squash;
      const d = r * (B.flat * f + 0.4 * sq), floor = -r + d;
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, spin, 0.2)), qi = q.clone().invert(), v = new THREE.Vector3();
      for (let i = 0; i < p.length; i += 3) {
        v.set(b[i], b[i + 1], b[i + 2]).applyQuaternion(q);            // into world orientation (the flat is always at the bottom)
        const yy = v.y, side = 1 + (0.06 * f + 0.12 * sq) * Math.max(0, 1 - Math.abs(yy + r * 0.45) / r);
        v.x *= side; v.z *= side;
        if (v.y < floor) v.y = floor + (v.y - floor) * 0.03;
        v.applyQuaternion(qi);
        p[i] = v.x; p[i + 1] = v.y; p[i + 2] = v.z;
      }
      this.geo.attributes.position.needsUpdate = true;
      this.geo.computeVertexNormals();
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// the plaza trampoline (round, 3.6 m): steel ring on U-legs, springs all round under a narrow blue pad, a black mat.
// The first landing stretches the mat for good: it stays a funnel.
// ---------------------------------------------------------------------------------------------------------------------
const NE_TRAMP = { x: 19.0, z: -12.5, R: 1.8, mat: 1.46, top: 0.95, depth: 0.36 };
// (and in the time-lapse each heavier jumper takes it further: neTrampLapse in clocks.js)
function neMatDepth(t) { return Math.max(NE_TRAMP.depth * Ease.outCubic(MathX.clamp((t - NE.land) / 0.3, 0, 1)) + 0.04 * MathX.smooth(t, NE.land2, NE.land2 + 0.15), neTrampLapse(t)); }

class NeTramp {
  constructor(scene) {
    const T = NE_TRAMP, g = new THREE.Group(); g.position.set(T.x, 0.15, T.z); scene.add(g); this.g = g;
    const steel = Mat.std('#69737a', { roughness: 0.4, metalness: 0.7 }), pad = Mat.std('#2d63a0', { roughness: 0.75 });
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    const y0 = T.top - 0.15; this.y0 = y0;
    // the frame ring, six legs and three U-shaped ground bars
    add(new THREE.TorusGeometry(T.R, 0.032, 8, 72), steel, 0, y0, 0, Math.PI / 2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.26; add(new THREE.CylinderGeometry(0.028, 0.028, y0, 8), steel, Math.cos(a) * T.R, y0 / 2, Math.sin(a) * T.R); }
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.26; add(new THREE.TorusGeometry(T.R, 0.026, 6, 16, Math.PI / 3), steel, 0, 0.03, 0, Math.PI / 2, 0, a); }
    // the pad: a flat blue ring over the outer half of the springs, with a skirt
    const ring = new THREE.RingGeometry(T.R - 0.16, T.R + 0.1, 72, 1); ring.rotateX(-Math.PI / 2);
    add(ring, pad, 0, y0 + 0.055, 0).castShadow = true;
    const skirt = new THREE.CylinderGeometry(T.R + 0.1, T.R + 0.1, 0.07, 72, 1, true); add(skirt, pad, 0, y0 + 0.02, 0);
    const inner = new THREE.CylinderGeometry(T.R - 0.16, T.R - 0.16, 0.05, 72, 1, true); add(inner, pad, 0, y0 + 0.03, 0);
    this.padTop = 0.15 + y0 + 0.058;
    // the mat: a polar grid (deformed every frame), black with a white border ring
    this.matGeo = new THREE.RingGeometry(0.0, T.mat, 64, 20); this.matGeo.rotateX(-Math.PI / 2);
    this.matBase = this.matGeo.attributes.position.array.slice();
    const mc = Tex.canvas(256, 256), mx = mc.getContext('2d'); mx.fillStyle = '#34373c'; mx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 8) { mx.fillStyle = 'rgba(255,255,255,0.16)'; mx.fillRect(i, 0, 1, 256); mx.fillRect(0, i, 256, 1); }
    mx.strokeStyle = '#d8d2c2'; mx.lineWidth = 5; mx.beginPath(); mx.arc(128, 128, 120, 0, Math.PI * 2); mx.stroke();
    mx.lineWidth = 3; mx.beginPath(); mx.arc(128, 128, 22, 0, Math.PI * 2); mx.stroke();
    this.mat = new THREE.Mesh(this.matGeo, new THREE.MeshStandardMaterial({ map: Tex.tex(mc), roughness: 0.85, side: THREE.DoubleSide, name: 'neMat' }));
    this.mat.position.y = y0 - 0.01; this.mat.receiveShadow = true; this.mat.castShadow = true; g.add(this.mat);
    // springs: one instanced helix (unit length along +X), radial from the frame ring to the mat's edge
    const pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2 * 9; pts.push(new THREE.Vector3(i / 64, Math.cos(a) * 0.02, Math.sin(a) * 0.02)); }
    const helix = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.005, 4, false);
    this.springs = [];
    for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); this.springs.push({ ox: c * (T.R - 0.02), oz: s * (T.R - 0.02), ix: c * T.mat, iz: s * T.mat }); }
    this.inst = new THREE.InstancedMesh(helix, Mat.std('#c3c9ce', { roughness: 0.3, metalness: 0.8 }), this.springs.length);
    this.inst.castShadow = false; g.add(this.inst);
    this._d = -1;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(); this._a = new THREE.Vector3(1, 0, 0); this._u = new THREE.Vector3();
  }

  // the mat's height (local, relative to the frame plane) at local (x, z) for a centre depth d: a membrane funnel
  sinkAt(lx, lz, d) {
    const rho = Math.min(1, Math.hypot(lx, lz) / NE_TRAMP.mat), k = Math.pow(1 - rho, 1.3), core = MathX.smooth(rho, 0.0, 0.14);
    return -d * (k * core + (1 - core) * Math.pow(1 - 0.14, 1.3)) - 0.05 * d * (1 - rho);
  }
  // the edge of the stretched mat sits a little lower too (its springs are stretched)
  pull(d) { return 0.06 * d / NE_TRAMP.depth; }
  // world height of the mat's surface under someone standing at trampoline-local (lx, lz) at time t
  surfaceY(lx, lz, t) { const d = neMatDepth(t); return Math.max(0.158, 0.15 + this.y0 - 0.01 + this.sinkAt(lx, lz, d) - this.pull(d)); }

  update(t) {
    const d = neMatDepth(t);
    if (Math.abs(d - this._d) < 1e-4) return;
    this._d = d;
    // (stretched far enough, its middle lies flat on the paving)
    const p = this.matGeo.attributes.position.array, b = this.matBase, pull = this.pull(d), floor = 0.008 - (this.y0 - 0.01);
    for (let i = 0; i < p.length; i += 3) p[i + 1] = Math.max(floor, b[i + 1] + this.sinkAt(b[i], b[i + 2], d) - pull);
    this.matGeo.attributes.position.needsUpdate = true; this.matGeo.computeVertexNormals();
    // springs: from the frame to the (lowered) mat edge; stretched springs show their coils spread apart
    this.springs.forEach((s, i) => {
      const a = this._v.set(s.ox, this.y0 + 0.005, s.oz), by = this.y0 - 0.01 - pull;
      const dx = s.ix - a.x, dy = by - a.y, dz = s.iz - a.z, len = Math.hypot(dx, dy, dz);
      this._q.setFromUnitVectors(this._a, this._u.set(dx / len, dy / len, dz / len));
      this._s.set(len * (1 + 0.5 * pull), 1 - 2.5 * pull, 1 - 2.5 * pull);
      this._m.compose(a, this._q, this._s);
      this.inst.setMatrixAt(i, this._m);
    });
    this.inst.instanceMatrix.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// montage insert 1: a tennis racket. The ball pockets the strings; only the air inside it pushes back, so it barely
// leaves the strings and drops; the pocket stays.
// ---------------------------------------------------------------------------------------------------------------------
const NE_RACKET = { p: [22.0, 1.25, -6.0], hit: 6.25, a: 0.165, b: 0.128, pocket: 0.05 };
class NeRacket {
  constructor(scene) {
    const R = NE_RACKET, g = new THREE.Group(); g.position.set(...R.p); g.rotation.set(0.12, 0.05, 0.42); scene.add(g); this.g = g;
    // face normal = local +Z (toward the incoming ball); the handle runs down local −Y
    const frameMat = Mat.std('#22262b', { roughness: 0.35, metalness: 0.3 }), accent = Mat.std('#c23a2b', { roughness: 0.4, metalness: 0.2 }), grip = Mat.std('#e8e4da', { roughness: 0.8 });
    const ell = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2; ell.push(new THREE.Vector3(Math.sin(a) * R.b, Math.cos(a) * R.a, 0)); }
    const frame = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ell, true), 120, 0.011, 8, true), frameMat); frame.scale.set(1, 1, 1.6); frame.castShadow = true; g.add(frame);
    const strip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ell.slice(10, 27)), 30, 0.0118, 8, false), accent); strip.scale.set(1.01, 1.01, 1.7); g.add(strip);
    // throat (two arms) and the handle running out of frame
    for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.01, 0.17, 8), frameMat); arm.position.set(s * 0.04, -R.a - 0.06, 0); arm.rotation.z = -s * 0.42; g.add(arm); }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.24, 8), frameMat); shaft.position.set(0, -R.a - 0.24, 0); g.add(shaft);
    const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.018, 0.26, 8), grip); hg.position.set(0, -R.a - 0.45, 0); g.add(hg);
    // the string bed: a subdivided ellipse-masked plane with a string-grid texture; deformed toward −Z by the pocket
    const c = Tex.canvas(256, 320), x = c.getContext('2d'); x.clearRect(0, 0, 256, 320);
    x.strokeStyle = 'rgba(235,232,220,1)'; x.lineWidth = 3;
    for (let i = 8; i < 256; i += 15) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 320); x.stroke(); }
    for (let i = 8; i < 320; i += 15) { x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
    const tex = Tex.tex(c);
    this.sGeo = new THREE.PlaneGeometry(2 * R.b, 2 * R.a, 28, 34); this.sBase = this.sGeo.attributes.position.array.slice();
    this.strings = new THREE.Mesh(this.sGeo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.5, name: 'neStrings' }));
    this.strings.onBeforeRender = () => {};
    g.add(this.strings);
    // ellipse mask through the UVs: hide string texels outside the frame
    this.strings.material.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <alphatest_fragment>', `{ vec2 q = (vMapUv - 0.5) * 2.0; if (dot(q, q) > 0.97) discard; }\n#include <alphatest_fragment>`);
    };
    // the tennis ball (felt + the white seam)
    const bc = Tex.canvas(256, 128), bx = bc.getContext('2d'), rng = new RNG(5);
    bx.fillStyle = '#c9d63e'; bx.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 1800; i++) { bx.fillStyle = `rgba(255,255,220,${rng.range(0.04, 0.12)})`; bx.fillRect(rng.range(0, 256), rng.range(0, 128), 2, 2); }
    bx.strokeStyle = '#f2f0e4'; bx.lineWidth = 5; bx.beginPath(); for (let u = 0; u <= 256; u += 2) { const v = 64 + 34 * Math.sin(u / 256 * Math.PI * 4); u === 0 ? bx.moveTo(u, v) : bx.lineTo(u, v); } bx.stroke();
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.034, 24, 16), new THREE.MeshStandardMaterial({ map: Tex.tex(bc), roughness: 0.95 }));
    this.ball.castShadow = true; scene.add(this.ball);
    this._v = new THREE.Vector3(); this._k = -1;
  }

  // the pocket depth at time t (the strings stretch as the ball sinks in, and stay stretched)
  pocket(t) { return NE_RACKET.pocket * Ease.outCubic(MathX.clamp((t - NE_RACKET.hit) / 0.05, 0, 1)); }

  update(t) {
    const R = NE_RACKET, vis = t > 5.3 && t < 7.8;
    this.g.visible = vis; this.ball.visible = vis;
    if (!vis) return;
    const pk = this.pocket(t);
    // the racket recoils 2 cm as it takes the hit
    this.g.position.set(R.p[0], R.p[1], R.p[2] - 0.02 * MathX.smooth(t, R.hit, R.hit + 0.08));
    if (Math.abs(pk - this._k) > 1e-5) {
      this._k = pk;
      const p = this.sGeo.attributes.position.array, b = this.sBase;
      for (let i = 0; i < p.length; i += 3) {
        const u = b[i] / R.b, v = (b[i + 1] - 0.015) / R.a, rr = Math.sqrt(u * u + v * v);
        p[i + 2] = -pk * Math.pow(Math.max(0, 1 - rr), 1.6) * (rr < 0.18 ? 1 : 1) ;
      }
      this.sGeo.attributes.position.needsUpdate = true; this.sGeo.computeVertexNormals();
    }
    // the ball: flies in along −Z (local), sinks into the pocket, sits, rolls out of it and falls
    this.g.updateMatrixWorld(true);
    const L = this._v, τ = t - R.hit;
    if (τ < 0) L.set(-0.12 * τ * 3, 0.015 - 0.4 * τ, 0.034 - 22 * τ);
    else if (τ < 0.14) L.set(0, 0.015 - 0.01 * MathX.smooth(τ, 0.05, 0.14), 0.034 - pk - 0.006 * MathX.smooth(τ, 0, 0.05) + 0.006 * MathX.smooth(τ, 0.05, 0.14));
    else { const k = τ - 0.14; L.set(0.02 * k, 0.005 - 0.2 * k - 0.5 * NE_G * k * k, 0.034 - pk + 0.6 * k); }
    this.ball.position.copy(L.applyMatrix4(this.g.matrixWorld));
    // squashed by the hit; its air rounds it out again (air is unchanged)
    const sq = τ > 0 ? 0.8 + 0.17 * MathX.smooth(τ, 0.04, 0.2) : 1;
    this.ball.scale.set(1 + (1 - sq) * 0.22, 1 + (1 - sq) * 0.22, sq); this.ball.quaternion.copy(this.g.quaternion);
    this.ball.rotateX(t * 6);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// montage insert 2: a running shoe striking the paving. The midsole foam squashes under the load and stays squashed.
// ---------------------------------------------------------------------------------------------------------------------
const NE_SHOE = { p: [16.0, 0.15, -24.0], strike: 7.85, flat: 8.0, lift: 8.35, off: 8.55 };
class NeShoe {
  constructor(scene) {
    const g = new THREE.Group(); scene.add(g); this.g = g;
    const foot = new THREE.Group(); g.add(foot); this.foot = foot;   // origin: heel bottom; +X toward the toe
    const upper = Mat.std('#2f6f7a', { roughness: 0.7 }), white = Mat.std('#ecebe5', { roughness: 0.8 }), dark = Mat.std('#2a2b2d', { roughness: 0.9 }), lace = Mat.std('#f4f3ee', { roughness: 0.7 });
    const tights = Mat.std('#26282c', { roughness: 0.85 }), sock = Mat.std('#e6e3db', { roughness: 0.9 });
    // the outline of the sole (top view, heel at x = 0 → toe at x = 0.29)
    const outline = (x) => { const u = x / 0.29; return 0.036 + 0.018 * Math.sin(Math.PI * Math.min(1, u * 1.15)) + (u > 0.6 ? 0.008 * Math.sin((u - 0.6) / 0.4 * Math.PI) : 0) - (u > 0.92 ? (u - 0.92) * 0.35 : 0); };
    const shape = new THREE.Shape(), N = 28;
    for (let i = 0; i <= N; i++) { const x = 0.29 * i / N; shape[i ? 'lineTo' : 'moveTo'](x, outline(x)); }
    for (let i = N; i >= 0; i--) { const x = 0.29 * i / N; shape.lineTo(x, -outline(x) * 0.92); }
    const slab = (h, mat, y) => { const ge = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 4 }); ge.rotateX(Math.PI / 2); ge.translate(0, y + h, 0); const m = new THREE.Mesh(ge, mat); m.castShadow = true; m.receiveShadow = true; return m; };
    foot.add(slab(0.007, dark, 0));
    this.mid = slab(0.034, white, 0.007); this.mid.geometry.translate(0, -0.007, 0); this.mid.position.y = 0.007; foot.add(this.mid);   // scaled in Y from its bottom
    // the upper: lofted rings along the foot (height grows toward the ankle collar), on its own group so it rides on the foam
    const up = new THREE.Group(); foot.add(up); this.up = up;
    const rings = [];
    for (let i = 0; i <= 14; i++) {
      const x = 0.005 + 0.28 * i / 14, u = x / 0.29;
      const hgt = u < 0.35 ? 0.085 - 0.02 * u : 0.085 - 0.07 * Math.pow((u - 0.35) / 0.65, 1.4);
      rings.push([x, outline(x) * 0.97, Math.max(0.015, hgt)]);
    }
    const pos = [], idx = [], S = 12;
    rings.forEach(([x, w, h]) => { for (let k = 0; k < S; k++) { const a = k / S * Math.PI * 2; const cy = Math.sin(a), cz = Math.cos(a); pos.push(x, h * 0.5 + cy * h * 0.5 * (cy > 0 ? 1 : 0.95), cz * w * (cy > 0 ? 0.92 - 0.25 * cy : 1)); } });
    for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < S; k++) { const a = r * S + k, b2 = r * S + (k + 1) % S, c2 = a + S, d = b2 + S; idx.push(a, c2, b2, b2, c2, d); }
    const ug = new THREE.BufferGeometry(); ug.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ug.setIndex(idx); ug.computeVertexNormals();
    const um = new THREE.Mesh(ug, upper); um.castShadow = true; up.add(um);
    // toe cap, heel counter, laces, a white swoosh-free stripe
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), white); cap.scale.set(1.2, 0.5, 1.15); cap.position.set(0.255, 0.004, 0); up.add(cap);
    const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 12, 1, true, Math.PI * 0.5, Math.PI), white); heel.position.set(0.03, 0.035, 0); heel.rotation.y = 0; up.add(heel);
    for (let i = 0; i < 5; i++) { const lx = 0.13 + i * 0.022; const l = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.004, 0.05), lace); l.position.set(lx, 0.082 - i * 0.008, 0); l.rotation.z = -0.35; up.add(l); }
    for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.012, 0.003), white); st.position.set(0.14, 0.035, s * 0.049); st.rotation.z = 0.12; up.add(st); }
    // ankle sock + the leg in dark running tights (rises out of frame)
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.05, 12), sock); sk.position.set(0.055, 0.105, 0); up.add(sk);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.037, 0.5, 12), tights); leg.geometry.translate(0, 0.25, 0); leg.position.set(0.055, 0.12, 0); leg.castShadow = true; up.add(leg); this.leg = leg;
    // a dashed yellow line on the near side where the top of the foam was (it rides with the foot)
    { const lm = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false }), lg = new THREE.Group();
      for (let x = 0.01; x < 0.27; x += 0.03) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.0025, 0.002), lm); d.position.set(x + 0.008, 0.041, 0.064); lg.add(d); }
      lg.visible = false; foot.add(lg); this.line = lg; }
    this.g.position.set(...NE_SHOE.p);
  }

  // midsole thickness factor: 1 → 0.36 under the load, and it stays there
  foam(t) { return 1 - 0.64 * MathX.smooth(t, NE_SHOE.strike, NE_SHOE.flat + 0.04); }

  update(t) {
    const S = NE_SHOE, vis = t > 7.3 && t < 9.8; this.g.visible = vis; if (!vis) return;
    const f = this.foam(t);
    this.mid.scale.y = f; this.up.position.y = 0.036 - 0.034 * (1 - f);
    // the step (slow motion): swing in toe-first from the left, heel strike, roll flat, heel lift, toe off, then the foot
    // hangs just off the ground (unloaded: the foam would spring back now; it doesn't)
    const F = this.foot, heelX = 0.0;
    let px, py, pitch;
    if (t < S.strike) { const k = (S.strike - t); px = heelX - 0.9 * k; py = 0.6 * k * k + 0.12 * k; pitch = 0.32 + 0.4 * k; F.position.set(px, py, 0); F.rotation.z = pitch; }
    else if (t < S.flat) { const k = MathX.smooth(t, S.strike, S.flat); F.position.set(heelX, 0, 0); F.rotation.z = 0.32 * (1 - k); }
    else if (t < S.lift) { F.position.set(heelX, 0, 0); F.rotation.z = 0; }
    else if (t < S.off) {   // rotate about the toe (x = 0.27)
      const k = MathX.smooth(t, S.lift, S.off), a = -0.62 * k, tx = 0.27;
      F.rotation.z = a; F.position.set(heelX + tx - tx * Math.cos(a), -tx * Math.sin(a), 0);
    } else { const k = MathX.smooth(t, S.off, S.off + 0.4), a = -0.62 + 0.52 * k; F.rotation.z = a; F.position.set(heelX + 0.0497 - 0.02 * k, 0.157 - 0.067 * k, 0); }
    // the shin: leaning back at heel strike (knee behind the ankle), forward over the toe at push-off, then swinging away
    const tilt = 0.3 * MathX.smooth(t, S.strike - 0.5, S.strike) - 0.75 * MathX.smooth(t, S.strike, S.off) + 0.5 * MathX.smooth(t, S.off, S.off + 0.4);
    this.line.visible = t > S.flat + 0.05;
    this.leg.rotation.z = tilt - F.rotation.z;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// montage insert 3: the café bench cushions. The dent of whoever sat there stays when they stand up.
// ---------------------------------------------------------------------------------------------------------------------
const NE_CUSH = { w: 0.46, h: 0.11, d: 0.98, seat: 0.56 };
class NeCushions {
  constructor(scene) {
    const N = NE_CITY.bench, C = NE_CUSH;
    const c = Tex.canvas(128, 128), x = c.getContext('2d'), rng = new RNG(9);
    x.fillStyle = '#a8833e'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 3) { x.fillStyle = `rgba(0,0,0,${0.04 + 0.03 * (i % 2)})`; x.fillRect(i, 0, 1, 128); x.fillRect(0, i, 128, 1); }
    for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(255,240,200,${rng.range(0.02, 0.07)})`; x.fillRect(rng.range(0, 128), rng.range(0, 128), 3, 1); }
    const mat = new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: true }), roughness: 0.95, name: 'neCushion' });
    this.list = [];
    for (const dz of [-0.52, 0.52]) {
      const g = new THREE.RoundedBoxGeometry(C.w, C.h, C.d, 6, 0.035);
      // densify isn't possible on a rounded box; displace the top face vertices that exist (6 segments per side)
      const m = new THREE.Mesh(g, mat); m.position.set(N.x - 0.02, LAYOUT.curbH + 0.41 + C.h / 2, N.z + dz); m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      this.list.push(m);
    }
    // the sat-on cushion gets a finer top so the dent reads: a subdivided box instead of the rounded one
    const fine = new THREE.BoxGeometry(C.w, C.h, C.d, 24, 2, 40);
    const p = fine.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x0 = p[i], y0 = p[i + 1], z0 = p[i + 2];
      // rounded edges: pull the top/bottom rim in a little
      const ex = Math.max(0, Math.abs(x0) / (C.w / 2) - 0.85) / 0.15, ez = Math.max(0, Math.abs(z0) / (C.d / 2) - 0.9) / 0.1, e = Math.min(1, Math.hypot(ex, ez));
      if (y0 > 0) {
        // the dent: two hollows (where the sitter's weight was) + a softer spread; deepest a little behind the middle
        const dx = x0 - 0.02;
        const hol = (zc) => Math.exp(-((dx / 0.13) ** 2) - (((z0 - zc) / 0.11) ** 2));
        const dent = 0.062 * (hol(-0.1) + hol(0.1)) + 0.02 * Math.exp(-((dx / 0.22) ** 2) - ((z0 / 0.3) ** 2));
        p[i + 1] = y0 - Math.min(0.075, dent) - 0.02 * e * e;
      } else p[i + 1] = y0 + 0.01 * e * e;
    }
    fine.computeVertexNormals();
    this.list[0].geometry = fine;
  }
  update() {}
}

// ---------------------------------------------------------------------------------------------------------------------
// montage insert 4: a rubber band round your two index fingers. Pulled apart once, it stays that long: slack, drooping.
// ---------------------------------------------------------------------------------------------------------------------
class NeBand {
  constructor(scene, hands) {
    this.hands = hands; this.scene = scene;
    this.mat = new THREE.MeshStandardMaterial({ color: '#c08a4a', roughness: 0.55, name: 'neBand' });
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat); this.mesh.frustumCulled = false; scene.add(this.mesh);
    this.mesh.layers.set(0);
    this._a = new THREE.Vector3(); this._b = new THREE.Vector3(); this._u = new THREE.Vector3(); this.maxGap = 0;
    this._last = '';
  }
  tip(h, out) { const j = h.fingers[0][2]; j.updateWorldMatrix(true, false); return out.set(0, 0.012, 0).applyMatrix4(j.matrixWorld); }
  update(t, camera) {
    const vis = t >= NE.mont[3][0] && t < NE.mont[3][1];
    this.mesh.visible = vis; if (!vis) return;
    const A = this.tip(this.hands.left, this._a), B = this.tip(this.hands.right, this._b);
    const D = A.distanceTo(B), rf = 0.011;
    // the loop's length: its rest length, or the longest it has ever been stretched (it never comes back)
    const rest = 0.08;
    let Lh = rest;
    for (let s = NE.mont[3][0]; s <= t + 1e-6; s += 1 / 60) { const pa = this._probe(s); if (pa > Lh) Lh = pa; }
    // one strand on each side of the fingers; slack strands hang in a parabola (arc length ≈ D + 8s²/3D)
    const sag = Lh > D ? Math.sqrt(Math.max(0, 3 * D * (Lh - D) / 8)) : 0;
    const u = this._u.copy(B).sub(A).normalize(), cam = camera.getWorldDirection(new THREE.Vector3());
    const side = new THREE.Vector3().crossVectors(u, new THREE.Vector3(0, 1, 0)).normalize();
    if (side.dot(cam) > 0) side.negate();
    const pts = [];
    const ring = (C, outward, from) => { for (let i = 0; i <= 8; i++) { const a = from + i / 8 * Math.PI; pts.push(new THREE.Vector3().copy(C).addScaledVector(outward, Math.cos(a) * -rf).addScaledVector(side, Math.sin(a) * rf)); } };
    // front strand A → B (sagging), around B, back strand B → A (sagging), around A
    const strand = (P, Q, s, off) => { for (let i = 1; i < 12; i++) { const k = i / 12; pts.push(new THREE.Vector3().lerpVectors(P, Q, k).addScaledVector(side, off).add(new THREE.Vector3(0, -s * 4 * k * (1 - k), 0))); } };
    ring(A, u.clone().negate(), -Math.PI / 2);
    strand(A.clone().addScaledVector(side, 0), B, sag, rf);
    ring(B, u, Math.PI / 2);
    strand(B, A, sag * 0.9, -rf);
    const curve = new THREE.CatmullRomCurve3(pts, true);
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.TubeGeometry(curve, 90, 0.0024, 5, true);
  }
  // the gap between your fingertips at time s, from the scripted hand poses (bandIn 8 cm → bandOut 26 cm → bandIn)
  _probe(s) { const k = MathX.smooth(s, 11.8, 12.3) - MathX.smooth(s, 12.5, 13.0); return 0.08 + 0.18 * Math.max(0, k); }
}
