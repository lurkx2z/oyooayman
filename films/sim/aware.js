/* =====================================================================
   NPC_AWARE_01 — the man in the dark-green jacket with the coffee.
   The shared body (js/world/people.js) with a hero head built for
   close-ups: eyes (sclera, iris, pupil, a catchlight) that aim exactly at
   the lens — or at a point on your screen — lids that blink and follow the
   gaze, brows, lips that part when he speaks and purse for the shhh.
   Arm IK puts a fingertip on the lens, both palms on the glass, a finger
   on his lips. His whole performance is scripted on film time below.
   ===================================================================== */

LOOKS.aware = { skin: 1, build: 'avg', shirt: '#2e4636', sleeves: 'long', pants: '#25272b', shoes: '#2a2420', sole: '#171412', hair: '#2a1d14', jacket: true, collar: true, inner: '#4b4f4a' };

(() => {
  const cup = (p) => { p.rSh = [0.42, 0.1]; p.rEl = 1.6; return p; };
  Object.assign(ACTIONS, {
    holdCup(τ, c) { const p = cup(ACTIONS.idle(τ, c)); p.headYaw *= 0.5; return p; },
    stand(τ, c) { const p = cup(basePose()); return p; },                            // perfectly still (the reset that failed)
    sip(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.sin(Math.min(1, τ / 1.2) * Math.PI); p.rSh = [0.42 + 0.5 * k, 0.1 + 0.12 * k]; p.rEl = 1.6 + 0.62 * k; p.neck = 0.04 - 0.22 * k; p.headYaw = 0; return p; },
    walkCup(τ, c) { const p = cup(ACTIONS.walk(τ, c)); p.headYaw *= 0.4; return p; },
    talkCup(τ, c) { const p = cup(ACTIONS.talk(τ, c)); return p; },
    hands0(τ, c) { const p = ACTIONS.idle(τ, c); p.headYaw = 0; return p; },
    run(τ, c) { const p = ACTIONS.jog(τ, c); p.spine = 0.3; p.lSh = [0.9, 0.12]; p.rSh = [0.9, 0.12]; p.lEl = 0.5; p.rEl = 0.5; return p; },
    yank(τ, c) { const p = basePose(), k = Math.min(1, τ / 0.2); p.spine = -0.45 * k; p.neck = -0.3 * k; p.lSh = [1.5, 0.15]; p.rSh = [1.5, 0.15]; p.lEl = 0.15; p.rEl = 0.15;
      p.lHip = [0.5 * k, 0.05]; p.rHip = [0.35 * k, 0.05]; p.lKnee = 0.3; p.rKnee = 0.5; p.hipY = 0.85; return p; },
  });
  Object.assign(BLEND, { holdCup: 0.6, stand: 0.01, sip: 0.4, walkCup: 0.5, talkCup: 0.5, hands0: 0.4, run: 0.25, yank: 0.05 });
})();

// his places (metres) and the café conversation partner
const SX_G = {
  spot: [9.0, -5.0], spotYaw: -0.5,                   // where he belongs (the opening)
  walkTo: [[3.4, 9.0, -5.0], [5.53, 7.95, -2.3], [30, 7.95, 29.5]],
  replay: { dt: 4.1, dz: -SX.v * 4.1, swap: 6.2 },
  door: [12.45, -21.6], cafe: [10.45, -18.0], partner: [11.3, -17.1],
  front: [10.6, -15.13], near: [10.6, -13.75],        // 2.0 m and 0.36 m in front of you
};

function sxPath(keys, t) {
  if (t <= keys[0][0]) return { x: keys[0][1], z: keys[0][2], dist: 0, dir: null, moving: false };
  let d = 0;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i], L = Math.hypot(b[1] - a[1], b[2] - a[2]);
    if (t <= b[0]) { const f = (t - a[0]) / (b[0] - a[0]); return { x: a[1] + (b[1] - a[1]) * f, z: a[2] + (b[2] - a[2]) * f, dist: d + L * f, dir: Math.atan2(b[1] - a[1], b[2] - a[2]), moving: L > 1e-3 }; }
    d += L;
  }
  const n = keys.length - 1, a = keys[n - 1], b = keys[n];
  return { x: b[1], z: b[2], dist: d, dir: Math.atan2(b[1] - a[1], b[2] - a[2]), moving: false };
}

// an iris drawn in polar form (u = angle, v = radius from the pupil's centre to the edge of the iris cap)
function sxIrisTex() {
  const W = 256, H = 64, c = Tex.canvas(W, H), x = c.getContext('2d'), rng = new RNG(31);
  const img = x.createImageData(W, H), d = img.data;
  const fib = []; for (let i = 0; i < W; i++) fib.push(rng.range(-1, 1));
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const v = j / (H - 1), k = (j * W + i) * 4;
    let r, g, b;
    if (v < 0.36) { r = 8; g = 8; b = 9; }
    else if (v < 0.86) {
      const s = (fib[i] + fib[(i + 1) % W] + fib[(i + W - 1) % W]) / 3, inner = MathX.smooth(v, 0.36, 0.52), ring = 1 - MathX.smooth(v, 0.7, 0.86);
      const base = [96 + 30 * inner, 78 + 26 * inner, 46 + 8 * inner];                          // hazel: brown-gold round the pupil, green-brown outside
      const L = 1 + 0.22 * s + 0.12 * Math.sin(v * 40 + fib[i] * 3);
      r = base[0] * L * (0.6 + 0.4 * ring); g = (base[1] + 18 * (1 - inner)) * L * (0.6 + 0.4 * ring); b = base[2] * L * (0.6 + 0.4 * ring);
    } else { const k2 = MathX.smooth(v, 0.86, 1.0); r = 40 + 190 * k2; g = 34 + 190 * k2; b = 30 + 186 * k2; }
    d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = Tex.tex(c, { repeat: false }); t.wrapS = THREE.RepeatWrapping; return t;
}

class SxAware {
  constructor(scene) {
    this.scene = scene;
    this.p = new Person({ id: 'aware', look: 'aware', states: [[0, 'holdCup']] }, scene);
    this.p.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.j = this.p.j;
    this.j.body.scale.setScalar(1.03);
    this._heroHead();
    this._props();
    this.blob = new BlobShadows(scene, 1);
    this.v = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), m: new THREE.Matrix4() };
  }

  /* ---------------- the hero head ---------------- */
  _heroHead() {
    const H = this.j.head;
    for (const c of [...H.children]) H.remove(c);
    const skinC = new THREE.Color(SKIN[1]);
    const skin = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.6 }), skinF = Mat.std(SKIN[1], { roughness: 0.6 });
    const lip = Mat.std('#a8695e', { roughness: 0.48 }), hair = Mat.std('#2a1d14', { roughness: 0.92 }), browM = Mat.std('#2c2018', { roughness: 0.95 });
    const add = (g, m, x = 0, y = 0, z = 0, p = H) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
    // skull and face: one dense sphere shaped into a head — a flatter face, eye sockets under a brow ridge, a nose with
    // nostril wings, a mouth, a chin, cheekbones, a jaw that narrows; a little colour in the cheeks and lips
    const g = new THREE.SphereGeometry(0.1, 96, 64), P = g.attributes.position, col = new Float32Array(P.count * 3);
    const G2 = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2) - (((y - cy) / ry) ** 2));
    for (let i = 0; i < P.count; i++) {
      let x = P.getX(i) * 0.8, y = P.getY(i) * 1.08, z = P.getZ(i) * 0.93;
      const low = MathX.smooth(-y, 0.0, 0.1);
      x *= 1 - 0.27 * low; if (z < 0) z *= 1 - 0.14 * low;
      let c = [1, 1, 1];
      if (z > 0) {
        if (z > 0.058) z = 0.058 + (z - 0.058) * 0.45;                                            // a flatter face
        const ax = Math.abs(x);
        z -= 0.0095 * G2(ax, y, 0.031, 0.012, 0.016, 0.012);                                      // eye sockets
        z += 0.0055 * G2(x, y, 0, 0.033, 0.05, 0.009);                                             // brow ridge
        const nh = MathX.lerp(0.003, 0.022, MathX.smooth(-y, -0.022, 0.022)) * (1 - MathX.smooth(-y, 0.024, 0.034));
        const nw = MathX.lerp(0.0065, 0.0115, MathX.smooth(-y, -0.02, 0.024));
        z += nh * Math.exp(-((x / nw) ** 2)) * MathX.smooth(z, 0.02, 0.05);                        // nose
        z += 0.0065 * G2(ax, y, 0.0125, -0.026, 0.0065, 0.006);                                    // nostril wings
        z += 0.0045 * G2(x, y, 0, -0.049, 0.022, 0.009);                                           // the mouth's muzzle
        z += 0.006 * G2(x, y, 0, -0.084, 0.02, 0.011);                                             // chin
        x += Math.sign(x) * 0.005 * G2(ax, y, 0.05, 0.0, 0.018, 0.02);                             // cheekbones
        const cheek = G2(ax, y, 0.042, -0.018, 0.016, 0.014), lid = G2(ax, y, 0.031, 0.012, 0.018, 0.012);
        c = [1 + 0.05 * cheek, 1 - 0.03 * cheek - 0.04 * lid, 1 - 0.03 * cheek - 0.05 * lid];
      }
      P.setXYZ(i, x, y, z);
      col[i * 3] = skinC.r * c[0]; col[i * 3 + 1] = skinC.g * c[1]; col[i * 3 + 2] = skinC.b * c[2];
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    add(g, skin);
    // the face's depth at (x, y): the nearest front vertex
    const surf = (x, y) => { let best = 1e9, bz = 0; for (let i = 0; i < P.count; i++) { const z = P.getZ(i); if (z <= 0) continue; const d = (P.getX(i) - x) ** 2 + (P.getY(i) - y) ** 2; if (d < best) { best = d; bz = z; } } return bz; };
    // ears, hair (a cap set back from the forehead, sideburns)
    for (const s of [-1, 1]) add(PersonGeo.ear, skinF, s * 0.077, -0.006, -0.006).scale.set(1, 1.1, 1.15);
    const hg = new THREE.SphereGeometry(0.1, 48, 20, 0, Math.PI * 2, 0, Math.PI * 0.53); hg.scale(0.84, 1.1, 1.0);
    const hm = add(hg, hair, 0, 0.004, -0.004); hm.rotation.x = -0.72; hm.scale.setScalar(1.06);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.008, 0.03, 0.014), hair, s * 0.076, 0.01, 0.018);
    // eyes: a socket group (fixed in the head) with the eyeball (aims), the lids (blink, follow the gaze) and a catchlight
    const R = 0.0128, ex = 0.031, ey = 0.012, ez = surf(ex, ey) - 0.0045;
    this.R = R;
    const sclera = new THREE.MeshStandardMaterial({ color: '#ebe6dd', roughness: 0.14 });
    const iris = new THREE.MeshStandardMaterial({ map: sxIrisTex(), roughness: 0.06 });
    const ig = new THREE.SphereGeometry(R * 1.012, 40, 12, 0, Math.PI * 2, 0, 0.5); ig.rotateX(Math.PI / 2);
    const lidU = new THREE.SphereGeometry(R * 1.1, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), lidL = new THREE.SphereGeometry(R * 1.1, 36, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const dot = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 });
    this.eyes = [-1, 1].map((s) => {
      const sock = new THREE.Group(); sock.position.set(s * ex, ey, ez); H.add(sock);
      const ball = new THREE.Group(); sock.add(ball);
      add(new THREE.SphereGeometry(R, 32, 24), sclera, 0, 0, 0, ball);
      add(ig, iris, 0, 0, 0, ball);
      const up = add(lidU, skinF, 0, 0, 0, sock), lo = add(lidL, skinF, 0, 0, 0, sock);
      const lash = add(new THREE.TorusGeometry(R * 1.1, 0.0007, 4, 24, Math.PI), browM, 0, 0, 0, up); lash.rotation.set(Math.PI / 2, 0, 0);
      const cl = add(new THREE.CircleGeometry(0.0011, 10), dot, 0, 0, 0, sock); cl.castShadow = false;
      cl.position.set(-0.32, 0.4, 0.86).normalize().multiplyScalar(R * 1.04); cl.lookAt(cl.position.clone().multiplyScalar(3));
      return { sock, ball, up, lo, cl, s };
    });
    // brows: two short pieces each, on the brow ridge
    this.brows = [-1, 1].map((s) => {
      const b = new THREE.Group(); b.position.set(s * 0.031, 0.031, surf(s * 0.031, 0.031) + 0.0015); H.add(b);
      const inner = add(new THREE.BoxGeometry(0.017, 0.0055, 0.005), browM, -s * 0.007, -0.0005, 0, b); inner.rotation.z = s * 0.06;
      const outer = add(new THREE.BoxGeometry(0.016, 0.0045, 0.005), browM, s * 0.0085, -0.0012, -0.0015, b); outer.rotation.z = -s * 0.22;
      return { b, s, y0: 0.031 };
    });
    // lips + the dark of the mouth
    const lu = new THREE.SphereGeometry(1, 20, 8); lu.scale(0.0205, 0.0027, 0.0038);
    const ll = new THREE.SphereGeometry(1, 20, 8); ll.scale(0.0185, 0.0033, 0.0042);
    this.mz = surf(0, -0.05);
    this.lipU = add(lu, lip, 0, -0.0465, this.mz - 0.0005); this.lipL = add(ll, lip, 0, -0.0528, this.mz - 0.001);
    this.mouthIn = add(new THREE.CircleGeometry(1, 20), Mat.std('#2a1210', { roughness: 0.9 }), 0, -0.05, this.mz - 0.0016); this.mouthIn.scale.set(0.016, 0.001, 1);
  }

  _props() {
    // the coffee: kept upright in the world, carried by the right hand
    const g = new THREE.Group(), cupM = Mat.std('#f4f1ea', { roughness: 0.45 }), band = Mat.std('#8a5a36', { roughness: 0.8 }), lid = Mat.std('#2a2a2c', { roughness: 0.5 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.033, 0.13, 16), cupM); g.add(c);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0405, 0.036, 0.05, 16), band); b.position.y = -0.005; g.add(b);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.014, 16), lid); l.position.y = 0.071; g.add(l);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.cup = g; this.scene.add(g);
    // an index finger on the left hand (extends to tap, slam, shush)
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.05, 3, 8), Mat.std(SKIN[1], { roughness: 0.6 }));
    f.geometry.translate(0, -0.034, 0); f.position.set(0, -0.115, 0.012); f.castShadow = true;
    this.j.la.hand.add(f); this.finger = f;
  }

  /* ---------------- aiming ---------------- */
  // a point on your screen, as he sees it: NDC (x, y) pushed out d metres in front of the lens
  screenPoint(cam, nx, ny, d, out) {
    const vf = MathX.deg(cam.fov) / 2, ty = Math.tan(vf), tx = ty * cam.aspect;
    return out.set(nx * tx * d, ny * ty * d, -d).applyMatrix4(cam.matrixWorld);
  }
  _aimHead(target, w, clampYaw = 1.4) {
    if (w <= 0) return;
    const H = this.j.head, N = this.j.neck, V = this.v;
    for (const [o, k] of [[N, 0.35], [H, 1]]) {
      V.q.copy(o.quaternion);
      o.updateMatrixWorld(true);
      o.lookAt(target);
      V.q2.copy(o.quaternion);
      o.quaternion.copy(V.q).slerp(V.q2, w * k * (o === N ? 1 : 1));
      if (o === N) o.updateMatrixWorld(true);
    }
    void clampYaw;
  }
  _aimEyes(target, w = 1) {
    const V = this.v;
    for (const E of this.eyes) {
      E.sock.updateMatrixWorld(true);
      E.ball.lookAt(target);
      V.e.setFromQuaternion(E.ball.quaternion, 'YXZ');
      V.e.x = MathX.clamp(V.e.x * w, -0.42, 0.42); V.e.y = MathX.clamp(V.e.y * w, -0.6, 0.6); V.e.z = 0;
      E.ball.quaternion.setFromEuler(V.e);
      E.pitch = V.e.x;
    }
  }
  // two-bone reach: put the arm's tip (finger or palm) on a world point; side = 1 left, −1 right. The elbow drops below the
  // line to the target (and a little outward); the upper arm is turned so the elbow bends straight at it
  _reach(side, target, tip = 0.45, w = 1) {
    if (w <= 0) return;
    const j = this.j, arm = side > 0 ? j.la : j.ra, V = this.v;
    j.spine.updateMatrixWorld(true);
    const T = j.spine.worldToLocal(V.a.copy(target)), Sh = arm.sh.position;
    const d = T.clone().sub(Sh), D = Math.max(0.05, d.length()), dir = d.divideScalar(D);
    const L1 = 0.3, L2 = 0.26 + tip, Dc = Math.min(D, L1 + L2 - 0.002);
    const al = Math.acos(MathX.clamp((L1 * L1 + Dc * Dc - L2 * L2) / (2 * L1 * Dc), -1, 1));
    const pole = new THREE.Vector3(side * 0.35, -1, -0.15); pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const u = dir.clone().multiplyScalar(Math.cos(al)).addScaledVector(pole, Math.sin(al));     // upper arm
    const E = Sh.clone().addScaledVector(u, L1), f = T.clone().sub(E).normalize();                 // forearm
    const beta = Math.acos(MathX.clamp(u.dot(f), -1, 1));
    let bz = f.clone().addScaledVector(u, -f.dot(u));
    if (bz.lengthSq() < 1e-8) bz = pole.clone().negate(); bz.normalize();
    const Y = u.clone().negate(), X = new THREE.Vector3().crossVectors(Y, bz);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, bz));
    arm.sh.quaternion.slerp(q, w);
    arm.el.rotation.x = MathX.lerp(arm.el.rotation.x, -beta, w);
  }

  /* ---------------- expression ---------------- */
  _face(t, F) {
    for (const E of this.eyes) {
      const look = E.pitch || 0, bl = MathX.clamp(F.blink, 0, 1), wide = MathX.clamp(F.wide, 0, 1);
      E.up.rotation.x = MathX.lerp(-0.38 - 0.24 * wide + look * 0.75, 0.2, bl);
      E.lo.rotation.x = MathX.lerp(0.42 + 0.12 * wide + look * 0.25, 0.3, bl * 0.7);
    }
    for (const B of this.brows) { B.b.position.y = B.y0 + 0.0045 * F.brow - 0.002 * F.frown; B.b.rotation.z = B.s * (-0.2 * F.frown + 0.08 * Math.max(0, F.brow)); }
    const o = MathX.clamp(F.mouth, 0, 1), pk = MathX.clamp(F.pucker, 0, 1), z = this.mz;
    this.lipL.position.y = -0.0528 - 0.009 * o; this.lipU.position.y = -0.0465 + 0.0015 * o;
    this.lipU.scale.x = this.lipL.scale.x = 1 - 0.38 * pk; this.lipU.position.z = z - 0.0005 + 0.005 * pk; this.lipL.position.z = z - 0.001 + 0.005 * pk;
    this.mouthIn.scale.set(0.015 * (1 - 0.4 * pk), 0.001 + 0.0062 * o, 1); this.mouthIn.position.y = -0.0497 - 0.0045 * o;
  }

  // the man's speech: lips move through the subtitle's window
  _talk(t) {
    let m = 0;
    for (const s of SCRIPT.hud.says) {
      if (t < s.t || t > s.until - 0.1) continue;
      const n = s.text.replace(/[^A-Za-z]/g, '').length, dur = Math.min(s.until - s.t - 0.15, 0.09 * n + 0.15), u = t - s.t;
      if (u < dur) m = Math.max(m, (0.35 + 0.65 * Math.abs(Math.sin(u * 15 + n))) * MathX.smooth(u, 0, 0.05) * (1 - MathX.smooth(u, dur - 0.08, dur)) * (s.text === s.text.toUpperCase() ? 1 : 0.7));
    }
    return m;
  }
  _blink(t, still) {
    if (still) return 0;
    const period = 3.1, k = Math.floor(t / period), ph = t - k * period - hash1(k * 17 + 3) * 1.6;
    return ph > 0 && ph < 0.16 ? Math.sin(ph / 0.16 * Math.PI) : 0;
  }

  /* ---------------- the performance ---------------- */
  // where he is and what he does at film time t
  _state(t, cam) {
    const S = { show: true, x: 0, z: 0, yaw: 0, act: 'holdCup', τ: t, dist: 0, gaze: null, head: 0, eyes: 1, F: { blink: 0, brow: 0, frown: 0, wide: 0, mouth: 0, pucker: 0 }, still: false, cup: true, finger: 0, reach: null, y: LAYOUT.curbH };
    const G = SX_G, lens = cam.position, V = this.v;
    const opening = (u, dz) => {                         // the opening: stand with the coffee, sip, then walk toward you and past
      const pth = sxPath(G.walkTo, u);
      S.x = pth.x; S.z = pth.z + dz; S.dist = pth.dist;
      if (u < G.walkTo[0][0]) { S.yaw = G.spotYaw; S.act = u > 1.0 && u < 2.2 ? 'sip' : 'holdCup'; S.τ = u > 1.0 && u < 2.2 ? u - 1.0 : u; }
      else { S.yaw = pth.dir; S.act = 'walkCup'; S.τ = u; }
      if (u > 4.85 && u < 5.45) { S.gaze = lens; S.eyes = MathX.smooth(u, 4.85, 4.95) * (1 - MathX.smooth(u, 5.35, 5.45)); }   // a passer-by's glance
    };
    if (t < G.replay.swap) { opening(t, 0); return S; }
    if (t < 13.5) { opening(t - G.replay.dt, G.replay.dz); return S; }
    if (t < 17.6) { S.show = false; return S; }
    // the café: out of the door, to the woman, talking; the freeze, the look, the snap back
    if (t < 38.4) {
      const pth = sxPath([[17.6, G.door[0] - 0.3, G.door[1]], [19.7, G.cafe[0], G.cafe[1]]], t);
      S.x = pth.x; S.z = pth.z; S.dist = pth.dist;
      const face = Math.atan2(G.partner[0] - G.cafe[0], G.partner[1] - G.cafe[1]);
      if (t < 19.7) { S.yaw = pth.dir; S.act = 'walkCup'; } else { S.yaw = face; S.act = 'talkCup'; }
      const L = SX.look;
      if (t >= L.freeze && t < L.snap) {
        S.τ = L.freeze; S.still = true;                          // frozen mid-gesture
        S.gaze = lens; S.eyes = MathX.smooth(t, L.turn, L.turn + 0.12); S.head = Ease.inOutSine(MathX.clamp((t - L.turn - 0.06) / 0.38, 0, 1));
        S.F.wide = 0.6; S.F.frown = t > L.who ? 0.5 : 0.2; S.F.mouth = this._talk(t);
      }
      return S;
    }
    if (t < SX.front) { S.show = false; return S; }
    // in front of you (2.0 m), then close (0.36 m)
    if (t < SX.snapBack) {
      const ap = SX.approach;
      const z = t < ap[0] ? G.front[1] : t < ap[1] ? MathX.lerp(G.front[1], G.near[1], Ease.inOutSine((t - ap[0]) / (ap[1] - ap[0]))) : t < 60.2 ? G.near[1] : t < 60.8 ? MathX.lerp(G.near[1], -14.03, Ease.outQuad((t - 60.2) / 0.6)) : -14.03;
      S.x = G.front[0]; S.z = z; S.yaw = 0; S.act = t > ap[0] && t < ap[1] ? 'walkCup' : 'holdCup'; S.dist = Math.abs(z - G.front[1]);
      S.gaze = lens; S.head = 0.85; S.F.mouth = this._talk(t);
      const C = SX.cap, E = SX.edge;
      if (t > C.t + 0.3 && t < C.wait) { const k = MathX.clamp((t - C.t - 0.5) / 1.2, 0, 1); S.gaze = this.screenPoint(cam, -0.45 + 0.9 * k, -0.42, 1.0, V.b); S.head = 0.6; }   // reads the caption
      if (t >= C.wait && t < C.end) { S.F.brow = 1; S.F.wide = 0.8; }
      if (t > 47.2 && t < 48.5) { S.gaze = this.screenPoint(cam, -0.62, 0.78, 1.0, V.b); S.head = 0.65; }     // the counter, top left
      if (t > E.out && t < E.back) { S.gaze = this.screenPoint(cam, 0.95, -0.12, 1.3, V.b); S.head = 0.55; S.F.frown = 0.4; }   // the right edge
      if (t > 55.35 && t < 56.05) { S.gaze = V.b.set(0.02, -0.3, -0.05).applyMatrix4(cam.matrixWorld); S.head = 0.7; S.shake = t - 55.35; }     // "Not you." (you, the body)
      if (t > 53.6 && t < 57.2) { S.F.brow = 0.5; S.F.wide = 0.4; }
      // the taps: the fingertip to the lens (the cup stays in the right hand)
      const tapW = (t0) => MathX.smooth(t, t0 - 0.55, t0) * (1 - MathX.smooth(t, t0 + 0.05, t0 + 0.38));
      const tw = Math.max(tapW(SX.tap), tapW(SX.tap2) * (t < SX.pause[0] + 0.25 ? 1 : 1 - MathX.smooth(t, SX.pause[0] + 0.25, SX.pause[0] + 0.55)));
      if (tw > 0) { S.reach = { side: 1, p: this.screenPoint(cam, SX_TAP_NDC.x, SX_TAP_NDC.y, 0.028, V.c), tip: 0.1825, w: tw }; S.finger = tw; }
      if (t > SX.tap + 0.4 && t < 58.3) { S.gaze = V.d.copy(lens); S.gazeFinger = true; S.head = 0.4; }   // looks at his finger
      // the pause: only he moves — he looks around at the stopped world
      const P = SX.pause;
      if (t >= P[0] + 0.15 && t < P[1]) { const k = (t - P[0] - 0.15) / (P[1] - P[0] - 0.15); S.gaze = V.b.set(G.front[0] - 6 * Math.sin(k * Math.PI * 2), 1.4 + 0.6 * Math.sin(k * Math.PI), S.z + 3.5); S.head = 0.85; S.F.wide = 1; }
      if (t >= P[1] && t < 61) { S.F.wide = 1; S.F.brow = 1; }
      if (t >= SX.session[0]) { S.F.brow = 0.8; S.F.frown = 0.3; }
      if (t >= SX.alarm && t < SX.snapBack) { S.gaze = this.screenPoint(cam, Math.sin(t * 9) * 0.6, 0.6, 2, V.b); S.F.wide = 1; }
      return S;
    }
    // snapped back to the café (the repair), breaks free, runs at you, hits the screen, recoils, comes back, is yanked away
    if (t < SX.rewind[0] + 0.6) {
      const cafeYaw = Math.atan2(G.partner[0] - G.cafe[0], G.partner[1] - G.cafe[1]);
      S.cup = false; S.F.wide = 1; S.F.brow = 1;
      if (t < 65.6) { S.x = G.cafe[0]; S.z = G.cafe[1]; S.yaw = cafeYaw; S.act = 'talkCup'; S.τ = 30 + noise1(t * 30, 2) * 0.05; S.still = true;
        S.gaze = lens; S.head = MathX.smooth(t, 65.0, 65.5) * 0.7; return S; }
      if (t < SX.run) { S.x = G.cafe[0]; S.z = G.cafe[1]; S.yaw = MathX.lerp(cafeYaw, Math.PI * 0, MathX.smooth(t, 65.6, 66.0)); S.act = 'hands0'; S.gaze = lens; S.head = 1; return S; }
      const hitZ = -13.62, back = -14.3;
      if (t < SX.hit) {
        const k = (t - SX.run) / (SX.hit - SX.run), pth = sxPath([[SX.run, G.cafe[0], G.cafe[1]], [SX.hit, 10.62, hitZ]], t);
        S.x = pth.x; S.z = pth.z; S.yaw = 0; S.act = 'run'; S.dist = pth.dist; S.gaze = lens; S.head = 1;
        const rw = MathX.smooth(k, 0.75, 1);
        if (rw > 0) S.reach = { both: true, w: rw, tip: 0.07 };
        S.F.mouth = this._talk(t); return S;
      }
      S.gaze = lens; S.head = 1; S.yaw = 0; S.act = 'hands0'; S.x = 10.62;
      const hold = SX.hit + 0.18;
      if (t < hold) { S.z = hitZ; S.reach = { both: true, w: 1, tip: 0.07 }; return S; }
      if (t < 68.6) { S.z = MathX.lerp(hitZ, back, Ease.outQuad(MathX.clamp((t - hold) / 0.5, 0, 1))); S.reach = { both: true, w: 1 - MathX.smooth(t, hold, hold + 0.35), tip: 0.07 };
        S.gaze = this.screenPoint(cam, FILM.crackNDC ? FILM.crackNDC.x : 0, FILM.crackNDC ? FILM.crackNDC.y : 0, 0.05, V.b); S.head = 0.8; return S; }
      if (t < SX.rewind[0]) {
        S.z = MathX.lerp(back, -13.8, MathX.smooth(t, 68.7, 69.2)); S.F.mouth = this._talk(t);
        S.reach = { side: 1, p: V.c.set(0.04, -0.02, -0.03).applyMatrix4(cam.matrixWorld), tip: 0.07, w: MathX.smooth(t, 68.8, 69.25) };
        return S;
      }
      // yanked: pulled straight back, away from you
      const k = (t - SX.rewind[0]) / 0.6;
      S.z = -13.8 - 34 * Ease.inCubic(MathX.clamp(k, 0, 1)); S.y = LAYOUT.curbH + 0.6 * Math.sin(Math.min(1, k) * Math.PI) * 0.4; S.act = 'yank'; S.τ = t - SX.rewind[0];
      S.show = k < 0.98; return S;
    }
    if (t < SX.restart) { S.show = false; return S; }
    // the reset that failed: he stands where he belongs, perfectly still — then turns to you; RESET FAILED; shhh
    const u = t - SX.restart, F = SX.failed;
    S.x = G.spot[0]; S.z = G.spot[1]; S.act = 'stand'; S.τ = 0; S.still = true;
    const turn = Ease.inOutSine(MathX.clamp((t - F.turn) / 1.4, 0, 1));
    const toYou = Math.atan2(lens.x - G.spot[0], lens.z - G.spot[1]);
    S.yaw = MathX.lerp(G.spotYaw, toYou, turn * 0.55);
    S.gaze = lens; S.head = turn; S.eyes = MathX.smooth(t, F.turn - 0.1, F.turn + 0.3);
    const sh = MathX.smooth(t, F.shh, F.shh + 0.45);
    if (sh > 0) { S.reach = { side: 1, lips: true, tip: 0.18, w: sh }; S.finger = sh; S.F.pucker = sh; }
    void u;
    return S;
  }

  update(t, cam) {
    const S = this._state(t, cam), p = this.p, V = this.v;
    p.root.visible = S.show; this.cup.visible = S.show && S.cup;
    if (!S.show) { this.blob.begin(); this.blob.end(); return; }
    p.root.position.set(S.x, S.y, S.z); p.root.rotation.set(0, S.yaw, 0);
    const ctx = { seed: p.seed, seedI: p.seedI, walkPhase: (S.dist / 1.32) * Math.PI * 2 };
    const pose = (ACTIONS[S.act] || ACTIONS.idle)(S.still ? S.τ : S.τ, ctx);
    if (S.still) { pose.headYaw = pose.headYaw || 0; }
    p.apply(pose);
    p.root.updateMatrixWorld(true);
    // head toward the gaze target (a small shake on "Not you."), then the arms, then the eyes exactly onto the target
    if (S.gaze) this._aimHead(S.gaze, S.head);
    if (S.shake !== undefined) this.j.head.rotateY(0.09 * Math.sin(S.shake * 19) * Math.exp(-S.shake * 2.5));
    p.root.updateMatrixWorld(true);
    if (S.reach) {
      if (S.reach.both) for (const side of [1, -1]) this._reach(side, V.d.set(side * 0.085, -0.03, -0.04).applyMatrix4(cam.matrixWorld), S.reach.tip, S.reach.w);
      else if (S.reach.lips) this._reach(1, V.c.set(0, -0.05, this.mz + 0.012).applyMatrix4(this.j.head.matrixWorld), S.reach.tip, S.reach.w);
      else this._reach(S.reach.side, S.reach.p, S.reach.tip, S.reach.w);
      p.root.updateMatrixWorld(true);
    }
    if (S.gazeFinger) { this.finger.scale.y = 1; S.gaze = this.fingerTip(V.d); }
    if (S.gaze && S.eyes > 0) this._aimEyes(S.gaze, S.eyes);
    else for (const E of this.eyes) { E.ball.quaternion.identity(); E.pitch = 0; }
    this.finger.scale.setScalar(1); this.finger.scale.y = 0.35 + 0.65 * MathX.clamp(S.finger, 0, 1);
    // expression
    S.F.blink = Math.max(S.F.blink, this._blink(t, S.still || (t > SX.front && t < SX.snapBack && (t % 7) > 2.5)));
    this._face(t, S.F);
    p.root.updateMatrixWorld(true);
    // the cup: upright in the world, in the right hand
    if (this.cup.visible) {
      const h = this.j.ra.hand.getWorldPosition(V.a);
      this.cup.position.set(h.x, h.y - 0.02, h.z); this.cup.rotation.set(0, S.yaw, 0);
      if (S.act === 'sip') { this.cup.rotation.x = -0.6 * Math.sin(Math.min(1, S.τ / 1.2) * Math.PI); }
    }
    this.blob.begin(); const hp = this.p.worldOf('hips', V.a); this.blob.push(hp.x, LAYOUT.curbH + 0.012, hp.z, 0.55, 0.45); this.blob.end();
  }

  // world positions for the debug labels / the crack
  headWorld(out) { return this.j.head.getWorldPosition(out); }
  fingerTip(out) { this.finger.updateMatrixWorld(true); return out.set(0, -0.068, 0).applyMatrix4(this.finger.matrixWorld); }
}
