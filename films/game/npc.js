/* =====================================================================
   NPCs — NPC_AWARE_01 (the man in the rust jacket) and the technician.
   The shared body (js/world/people.js) with a hero face and hero hands:
     GmFace   a close-up head: eyes (sclera, iris, pupil, catchlight)
              that aim exactly at the camera lens or at a point on your
              screen, lids that blink and follow the gaze, brows (raise,
              frown, worry), lips that part, smile and purse
     GmHand   five fingers (curl, spread, thumb), posed by name: relax,
              flat (a palm on glass or on your screen), point, fist, reach
   Arm IK puts a wrist where a palm, a fist or a fingertip must land on a
   given screen point; the hand is then turned in world space. Their whole
   performances are keyed on film time below.
   ===================================================================== */

LOOKS.gmAware = { skin: 2, build: 'avg', shirt: '#8a4328', sleeves: 'long', pants: '#2a2d31', shoes: '#d9d5cc', sole: '#ecE8e0', hair: '#1c140f', jacket: true, collar: true, inner: '#34373b' };
LOOKS.gmTech = { skin: 0, build: 'slim', shirt: '#59636d', sleeves: 'long', pants: '#4b535c', shoes: '#1d1e20', sole: '#2a2a2a', hair: '#4a3222', hairStyle: 'bun', collar: true };

(() => {
  const P = basePose;
  Object.assign(ACTIONS, {
    gmStand(τ, c) { const p = ACTIONS.idle(τ, c); p.lSh = [0.08, 0.1]; p.rSh = [0.08, 0.1]; p.lEl = 0.32; p.rEl = 0.32; p.headYaw *= 0.3; return p; },
    gmTense(τ, c) { const p = ACTIONS.gmStand(τ, c); p.spine = 0.09 + 0.01 * Math.sin(τ * 2.2); p.lSh = [0.22, 0.12]; p.rSh = [0.22, 0.12]; p.lEl = 0.75; p.rEl = 0.75; p.lKnee = 0.12; p.rKnee = 0.12; p.hipY = 0.91; return p; },
    gmPeer(τ, c) { const p = ACTIONS.gmStand(τ, c), k = Math.min(1, τ / 0.5); p.spine = 0.05 + 0.24 * k; p.neck = 0.04 + 0.1 * k; p.lSh = [0.15, 0.08]; p.rSh = [0.3, 0.06]; p.rEl = 1.2; return p; },
    gmRun(τ, c) { const p = ACTIONS.jog(τ, c); p.spine = 0.24; p.lEl = 1.45; p.rEl = 1.45; return p; },
    gmDuck(τ, c) { const p = P(), k = Math.min(1, τ / 0.18); p.hipY = 0.93 - 0.32 * k; p.lHip = [0.85 * k, 0.12]; p.rHip = [0.55 * k, 0.12]; p.lKnee = 1.4 * k; p.rKnee = 1.0 * k; p.spine = 0.5 * k; p.neck = 0.25 * k;
      p.lSh = [1.7 * k, 0.25]; p.rSh = [1.7 * k, 0.25]; p.lEl = 1.9 * k; p.rEl = 1.9 * k; p.lFoot = -0.2 * k; return p; },
    gmRelief(τ, c) { const p = ACTIONS.gmStand(τ, c), k = Math.min(1, τ / 0.8); p.spine = 0.02 - 0.05 * Math.sin(Math.min(1, τ / 1.2) * Math.PI) * k; p.lSh = [0.04, 0.06]; p.rSh = [0.04, 0.06]; p.lEl = 0.15; p.rEl = 0.15; return p; },
    gmTablet(τ, c) { const p = ACTIONS.idle(τ, c); p.lSh = [0.5, 0.05]; p.lEl = 1.45; p.headYaw *= 0.3; return p; },
    gmWalkTab(τ, c) { const p = ACTIONS.walk(τ, c); p.lSh = [0.5, 0.05]; p.lEl = 1.45; return p; },
  });
  Object.assign(BLEND, { gmStand: 0.45, gmTense: 0.4, gmPeer: 0.4, gmRun: 0.22, gmDuck: 0.12, gmRelief: 0.6, gmTablet: 0.4, gmWalkTab: 0.35 });
})();

// an iris drawn in polar form (u = angle, v = radius from the pupil's centre to the edge of the iris cap)
function gmIrisTex(base, seed) {
  const W = 256, H = 64, c = Tex.canvas(W, H), x = c.getContext('2d'), rng = new RNG(seed);
  const img = x.createImageData(W, H), d = img.data, fib = []; for (let i = 0; i < W; i++) fib.push(rng.range(-1, 1));
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const v = j / (H - 1), k = (j * W + i) * 4; let r, g, b;
    if (v < 0.36) { r = 8; g = 8; b = 9; }
    else if (v < 0.86) {
      const s = (fib[i] + fib[(i + 1) % W] + fib[(i + W - 1) % W]) / 3, inner = MathX.smooth(v, 0.36, 0.52), ring = 1 - MathX.smooth(v, 0.7, 0.86);
      const L = (1 + 0.22 * s + 0.12 * Math.sin(v * 40 + fib[i] * 3)) * (0.6 + 0.4 * ring);
      r = (base[0] + 30 * inner) * L; g = (base[1] + 22 * inner) * L; b = (base[2] + 8 * inner) * L;
    } else { const k2 = MathX.smooth(v, 0.86, 1.0); r = 40 + 190 * k2; g = 34 + 190 * k2; b = 30 + 186 * k2; }
    d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = Tex.tex(c, { repeat: false }); t.wrapS = THREE.RepeatWrapping; return t;
}

// hair: short strands as a texture and a bump, so a cap of hair never reads as a beanie
function gmHairMat(color, seed) {
  const S = 256, c = Tex.canvas(S, S), x = c.getContext('2d'), b = Tex.canvas(S, S), y = b.getContext('2d'), r = new RNG(seed + 300), base = new THREE.Color(color);
  x.fillStyle = '#' + base.getHexString(); x.fillRect(0, 0, S, S); y.fillStyle = '#808080'; y.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const px = r.range(0, S), py = r.range(0, S), a = r.range(-0.5, 0.5) + Math.PI / 2, L = r.range(5, 16), l = r.range(-0.12, 0.2);
    x.strokeStyle = `rgba(${l > 0 ? '255,235,215' : '0,0,0'},${Math.abs(l) * 0.5})`; x.lineWidth = r.range(0.6, 1.4); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke();
    y.strokeStyle = l > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'; y.lineWidth = 1; y.beginPath(); y.moveTo(px, py); y.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); y.stroke();
  }
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: Tex.tex(c), bumpMap: Tex.tex(b, { srgb: false }), bumpScale: 2.5, roughness: 0.78 });
  m.map.repeat.set(3, 3); m.bumpMap.repeat.set(3, 3); return m;
}

/* ---------------- the hero face ---------------- */
class GmFace {
  constructor(head, o) {
    this.head = head; this.o = o;
    for (const c of [...head.children]) head.remove(c);
    const skinC = new THREE.Color(o.skin);
    const skin = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.58 }), skinF = new THREE.MeshStandardMaterial({ color: o.skin, roughness: 0.58 });
    this.skinMat = skinF;
    const lip = Mat.std(o.lip || '#a6665a', { roughness: 0.45 }), hair = gmHairMat(o.hair, o.seed || 5), browM = Mat.std(o.brow || '#2a1f18', { roughness: 0.95 });
    const add = (g, m, x = 0, y = 0, z = 0, p = head) => { const m2 = new THREE.Mesh(g, m); m2.position.set(x, y, z); m2.castShadow = true; m2.receiveShadow = true; p.add(m2); return m2; };
    // skull and face: one dense sphere shaped into a head (flatter face, eye sockets under a brow ridge, nose, mouth, chin, cheekbones)
    const g = new THREE.SphereGeometry(0.1, 96, 64), P = g.attributes.position, col = new Float32Array(P.count * 3);
    const G2 = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2) - (((y - cy) / ry) ** 2));
    const jaw = o.jaw || 0.27, chin = o.chin || 0.006;
    for (let i = 0; i < P.count; i++) {
      let x = P.getX(i) * (o.wide || 0.8), y = P.getY(i) * 1.08, z = P.getZ(i) * 0.93;
      const low = MathX.smooth(-y, 0.0, 0.1);
      x *= 1 - jaw * low; if (z < 0) z *= 1 - 0.14 * low;
      let c = [1, 1, 1];
      if (z > 0) {
        if (z > 0.058) z = 0.058 + (z - 0.058) * 0.45;
        const ax = Math.abs(x);
        z -= 0.0095 * G2(ax, y, 0.031, 0.012, 0.016, 0.012);
        z += 0.0055 * G2(x, y, 0, 0.033, 0.05, 0.009);
        const nh = MathX.lerp(0.003, o.nose || 0.022, MathX.smooth(-y, -0.022, 0.022)) * (1 - MathX.smooth(-y, 0.024, 0.034));
        const nw = MathX.lerp(0.0065, 0.0115, MathX.smooth(-y, -0.02, 0.024));
        z += nh * Math.exp(-((x / nw) ** 2)) * MathX.smooth(z, 0.02, 0.05);
        z += 0.0065 * G2(ax, y, 0.0125, -0.026, 0.0065, 0.006);
        z += 0.0045 * G2(x, y, 0, -0.049, 0.022, 0.009);
        z += chin * G2(x, y, 0, -0.084, 0.02, 0.011);
        x += Math.sign(x) * 0.005 * G2(ax, y, 0.05, 0.0, 0.018, 0.02);
        const cheek = G2(ax, y, 0.042, -0.018, 0.016, 0.014), lid = G2(ax, y, 0.031, 0.012, 0.018, 0.012), stub = o.stubble ? G2(x, y, 0, -0.07, 0.05, 0.03) * MathX.smooth(-y, 0.03, 0.06) : 0;
        c = [1 + 0.05 * cheek - 0.16 * stub, 1 - 0.03 * cheek - 0.04 * lid - 0.15 * stub, 1 - 0.03 * cheek - 0.05 * lid - 0.12 * stub];
      }
      P.setXYZ(i, x, y, z);
      col[i * 3] = skinC.r * c[0]; col[i * 3 + 1] = skinC.g * c[1]; col[i * 3 + 2] = skinC.b * c[2];
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    add(g, skin);
    const surf = (x, y) => { let best = 1e9, bz = 0; for (let i = 0; i < P.count; i++) { const z = P.getZ(i); if (z <= 0) continue; const d = (P.getX(i) - x) ** 2 + (P.getY(i) - y) ** 2; if (d < best) { best = d; bz = z; } } return bz; };
    for (const s of [-1, 1]) add(PersonGeo.ear, skinF, s * 0.074, -0.006, -0.006).scale.set(0.75, 0.9, 0.95);
    // hair: a cap set back from the forehead; short: a little volume on top; bun: a knot at the back
    const hg = new THREE.SphereGeometry(0.1, 48, 20, 0, Math.PI * 2, 0, Math.PI * 0.5); hg.scale(0.79, 1.1, 1.0);
    const hm = add(hg, hair, 0, 0.004, -0.004); hm.rotation.x = -0.72; hm.scale.setScalar(1.06);
    if (o.hairStyle === 'bun') { add(new THREE.SphereGeometry(0.034, 16, 12), hair, 0, 0.07, -0.085); const hb = add(hg, hair, 0, 0.0, -0.006); hb.rotation.x = -1.05; hb.scale.setScalar(1.075); }
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.008, 0.03, 0.014), hair, s * 0.076, 0.01, 0.018);
    // eyes
    const R = 0.0128, ex = 0.031, ey = 0.012, ez = surf(ex, ey) - 0.0045;
    this.R = R;
    const sclera = new THREE.MeshStandardMaterial({ color: '#ece7de', roughness: 0.14 }), iris = new THREE.MeshStandardMaterial({ map: gmIrisTex(o.iris || [96, 74, 44], o.seed || 31), roughness: 0.06 });
    const ig = new THREE.SphereGeometry(R * 1.012, 40, 12, 0, Math.PI * 2, 0, 0.5); ig.rotateX(Math.PI / 2);
    const lidU = new THREE.SphereGeometry(R * 1.1, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), lidL = new THREE.SphereGeometry(R * 1.1, 36, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const dot = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 });
    this.eyes = [-1, 1].map((s) => {
      const sock = new THREE.Group(); sock.position.set(s * ex, ey, ez); head.add(sock);
      const ball = new THREE.Group(); sock.add(ball);
      add(new THREE.SphereGeometry(R, 32, 24), sclera, 0, 0, 0, ball);
      add(ig, iris, 0, 0, 0, ball);
      const up = add(lidU, skinF, 0, 0, 0, sock), lo = add(lidL, skinF, 0, 0, 0, sock);
      const lash = add(new THREE.TorusGeometry(R * 1.1, 0.0007, 4, 24, Math.PI), browM, 0, 0, 0, up); lash.rotation.set(Math.PI / 2, 0, 0);
      const cl = add(new THREE.CircleGeometry(0.0011, 10), dot, 0, 0, 0, sock); cl.castShadow = false;
      cl.position.set(-0.32, 0.4, 0.86).normalize().multiplyScalar(R * 1.04); cl.lookAt(cl.position.clone().multiplyScalar(3));
      return { sock, ball, up, lo, cl, s, pitch: 0 };
    });
    this.brows = [-1, 1].map((s) => {
      const b = new THREE.Group(); b.position.set(s * 0.031, 0.031, surf(s * 0.031, 0.031) + 0.0015); head.add(b);
      const inner = add(new THREE.BoxGeometry(0.017, 0.0055, 0.005), browM, -s * 0.007, -0.0005, 0, b); inner.rotation.z = s * 0.06;
      const outer = add(new THREE.BoxGeometry(0.016, 0.0045, 0.005), browM, s * 0.0085, -0.0012, -0.0015, b); outer.rotation.z = -s * 0.22;
      return { b, s, y0: 0.031 };
    });
    // lips (their corners lift for a smile) and the dark of the mouth
    const lu = new THREE.SphereGeometry(1, 24, 8); lu.scale(0.0205, 0.0027, 0.0038);
    const ll = new THREE.SphereGeometry(1, 24, 8); ll.scale(0.0185, 0.0033, 0.0042);
    this.mz = surf(0, -0.05);
    this.lipU = add(lu, lip, 0, -0.0465, this.mz - 0.0005); this.lipL = add(ll, lip, 0, -0.0528, this.mz - 0.001);
    this.lip0 = [lu.attributes.position.array.slice(), ll.attributes.position.array.slice()];
    this.mouthIn = add(new THREE.CircleGeometry(1, 20), Mat.std('#2a1210', { roughness: 0.9 }), 0, -0.05, this.mz - 0.0016); this.mouthIn.scale.set(0.016, 0.001, 1);
    this._smile = 0;
    // glasses
    if (o.glasses) {
      const fm = Mat.std('#1d1e21', { roughness: 0.35, metalness: 0.3 }), lens = new THREE.MeshStandardMaterial({ color: '#cfd8de', transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false, name: 'glassLens' });
      const rr = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; };
      for (const s of [-1, 1]) {
        const sh = rr(0.034, 0.024, 0.007), hole = rr(0.029, 0.019, 0.005); sh.holes.push(hole);
        const fr = add(new THREE.ExtrudeGeometry(sh, { depth: 0.0025, bevelEnabled: false, curveSegments: 6 }), fm, s * 0.031, 0.011, ez + R + 0.008);
        add(new THREE.ShapeGeometry(hole), lens, s * 0.031, 0.011, ez + R + 0.0085).castShadow = false;
        add(new THREE.BoxGeometry(0.0025, 0.0025, 0.085), fm, s * 0.0485, 0.016, ez + R - 0.035);
        void fr;
      }
      add(new THREE.BoxGeometry(0.012, 0.0025, 0.0025), fm, 0, 0.016, ez + R + 0.0095);
    }
  }
  // the eyes onto a world point (w: how much of the turn the eyes make)
  aimEyes(target, w = 1) {
    const e = this._e || (this._e = new THREE.Euler(0, 0, 0, 'YXZ'));
    for (const E of this.eyes) {
      E.sock.updateMatrixWorld(true);
      E.ball.lookAt(target);
      e.setFromQuaternion(E.ball.quaternion, 'YXZ');
      e.x = MathX.clamp(e.x * w, -0.42, 0.42); e.y = MathX.clamp(e.y * w, -0.6, 0.6); e.z = 0;
      E.ball.quaternion.setFromEuler(e); E.pitch = e.x;
    }
  }
  rest() { for (const E of this.eyes) { E.ball.quaternion.identity(); E.pitch = 0; } }
  // F: blink, brow (raise), frown, worry (inner brows up), wide, mouth (open), pucker, smile
  set(F) {
    for (const E of this.eyes) {
      const look = E.pitch || 0, bl = MathX.clamp(F.blink || 0, 0, 1), wide = MathX.clamp(F.wide || 0, 0, 1), sq = MathX.clamp(F.smile || 0, 0, 1) * 0.25;
      E.up.rotation.x = MathX.lerp(-0.38 - 0.24 * wide + 0.1 * sq + look * 0.5, 0.2, bl);
      E.lo.rotation.x = MathX.lerp(0.42 + 0.12 * wide - 0.12 * sq + look * 0.25, 0.3, bl * 0.7);
    }
    const br = F.brow || 0, fr = F.frown || 0, wo = F.worry || 0;
    for (const B of this.brows) { B.b.position.y = B.y0 + 0.0045 * br - 0.002 * fr + 0.002 * wo; B.b.rotation.z = B.s * (0.2 * fr - 0.24 * wo + 0.08 * Math.max(0, br)); }
    const o = MathX.clamp(F.mouth || 0, 0, 1), pk = MathX.clamp(F.pucker || 0, 0, 1), z = this.mz, sm = MathX.clamp(F.smile || 0, 0, 1);
    this.lipL.position.y = -0.0528 - 0.009 * o; this.lipU.position.y = -0.0465 + 0.0015 * o;
    this.lipU.scale.x = this.lipL.scale.x = (1 - 0.38 * pk) * (1 + 0.08 * sm); this.lipU.position.z = z - 0.0005 + 0.005 * pk; this.lipL.position.z = z - 0.001 + 0.005 * pk;
    this.mouthIn.scale.set(0.015 * (1 - 0.4 * pk) * (1 + 0.1 * sm), 0.001 + 0.0062 * o, 1); this.mouthIn.position.y = -0.0497 - 0.0045 * o;
    if (Math.abs(sm - this._smile) > 1e-3) {
      this._smile = sm;
      [this.lipU, this.lipL].forEach((L, k) => {
        const A = L.geometry.attributes.position, a0 = this.lip0[k], w = k ? 0.0185 : 0.0205;
        for (let i = 0; i < A.count; i++) { const x = a0[i * 3]; A.array[i * 3 + 1] = a0[i * 3 + 1] + sm * 0.0065 * (x / w) ** 2 - sm * 0.0008; }
        A.needsUpdate = true; L.geometry.computeVertexNormals();
      });
    }
  }
}

/* ---------------- the hero hand ---------------- */
const GM_HAND = {
  relax: { curl: [0.35, 0.45, 0.52, 0.6], spread: 0.08, thumb: [0.3, 0.35] },
  flat: { curl: [0.06, 0.03, 0.06, 0.1], spread: 0.3, thumb: [0.0, 0.35] },
  point: { curl: [0.0, 1.35, 1.42, 1.48], spread: 0.0, thumb: [0.95, 0.25] },
  fist: { curl: [1.45, 1.5, 1.52, 1.52], spread: 0.0, thumb: [1.15, 0.15] },
  reach: { curl: [0.0, 0.75, 0.9, 1.05], spread: 0.08, thumb: [0.55, 0.35] },
  flinch: { curl: [0.22, 0.28, 0.34, 0.42], spread: 0.25, thumb: [0.25, 0.6] },
  grip: { curl: [0.9, 1.0, 1.05, 1.1], spread: 0.0, thumb: [0.7, 0.3] },
};
class GmHand {
  constructor(handGroup, side, skinMat) {
    this.side = side; this.g = handGroup;
    for (const c of handGroup.children) c.visible = false;               // the rig's mitten
    const nailM = Mat.std('#e2b8a6', { roughness: 0.3 });
    const cap = (r, len) => { const g = new THREE.CapsuleGeometry(r, len, 4, 10); g.translate(0, -len / 2, 0); return g; };
    const add = (g, m, p, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
    // palm: a rounded slab (thickness along X, length along −Y, width along Z with the thumb at +Z)
    const palm = new THREE.RoundedBoxGeometry(0.03, 0.094, 0.084, 3, 0.012); palm.translate(0, -0.052, 0);
    add(palm, skinMat, handGroup);
    add(new THREE.SphereGeometry(0.02, 12, 8), skinMat, handGroup, -side * 0.006, -0.03, 0.03).scale.set(0.8, 1.4, 1.0);   // the thumb's pad
    const F = [[0.031, [0.043, 0.026, 0.021], 0.0098], [0.0105, [0.047, 0.029, 0.022], 0.0102], [-0.0095, [0.044, 0.027, 0.021], 0.0097], [-0.0285, [0.035, 0.021, 0.018], 0.0088]];
    this.fingers = F.map(([z, L, r], fi) => {
      const k0 = new THREE.Group(); k0.position.set(0, -0.096 - (fi === 3 ? -0.006 : fi === 0 ? -0.002 : 0), z); handGroup.add(k0);
      add(cap(r, L[0]), skinMat, k0);
      const k1 = new THREE.Group(); k1.position.y = -L[0]; k0.add(k1); add(cap(r * 0.93, L[1]), skinMat, k1);
      const k2 = new THREE.Group(); k2.position.y = -L[1]; k1.add(k2); add(cap(r * 0.86, L[2]), skinMat, k2);
      const nail = add(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), nailM, k2, side * r * 0.72, -L[2] * 0.62, 0);
      nail.scale.set(0.0018, r * 0.75, r * 0.72); nail.rotation.z = side * Math.PI / 2;
      return { k: [k0, k1, k2], L, r, z };
    });
    // thumb: from the base of the palm, out toward +Z
    const t0 = new THREE.Group(); t0.position.set(-side * 0.004, -0.024, 0.036); handGroup.add(t0);
    add(cap(0.0115, 0.036), skinMat, t0);
    const t1 = new THREE.Group(); t1.position.y = -0.036; t0.add(t1); add(cap(0.0105, 0.028), skinMat, t1);
    const t2 = new THREE.Group(); t2.position.y = -0.028; t1.add(t2); add(cap(0.0095, 0.022), skinMat, t2);
    const tn = add(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), nailM, t2, side * 0.0068, -0.014, 0); tn.scale.set(0.0018, 0.008, 0.0075); tn.rotation.z = side * Math.PI / 2;
    this.thumb = [t0, t1, t2];
    this.pose('relax');
  }
  // a named pose, or a blend of two
  pose(a, b = null, w = 0) {
    const A = GM_HAND[a] || GM_HAND.relax, B = b ? GM_HAND[b] || A : A, s = this.side;
    const L = (x, y) => x + (y - x) * w;
    this.fingers.forEach((f, i) => {
      const c = L(A.curl[i], B.curl[i]), sp = L(A.spread, B.spread) * (i - 1.4) * 0.16;
      f.k[0].rotation.set(sp, 0, -s * c * 0.85); f.k[1].rotation.set(0, 0, -s * c * 1.1); f.k[2].rotation.set(0, 0, -s * c * 0.7);
    });
    const tc = L(A.thumb[0], B.thumb[0]), ta = L(A.thumb[1], B.thumb[1]);
    this.thumb[0].rotation.set(-0.3 - 0.6 * ta, 0, -s * (0.05 + 0.8 * tc));
    this.thumb[1].rotation.set(0, 0, -s * 0.6 * tc); this.thumb[2].rotation.set(0, 0, -s * 0.5 * tc);
  }
  // world point of the index fingertip
  indexTip(out) { const k = this.fingers[0].k[2]; k.updateMatrixWorld(true); return out.set(0, -this.fingers[0].L[2] - 0.006, 0).applyMatrix4(k.matrixWorld); }
}

/* ---------------- a character: body, face, hands, IK and aiming ---------------- */
class GmActor {
  constructor(scene, id, look, face) {
    this.p = new Person({ id, look, states: [[0, 'gmStand']] }, scene);
    this.p.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.j = this.p.j;
    this.face = new GmFace(this.j.head, face);
    this.hands = { L: new GmHand(this.j.la.hand, 1, this.face.skinMat), R: new GmHand(this.j.ra.hand, -1, this.face.skinMat) };
    this.blob = new BlobShadows(scene, 3);
    this.v = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), e: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), m: new THREE.Matrix4() };
  }
  // every mesh on layer 1 as well (the void pass renders him alone)
  layer(n) { this.p.root.traverse((o) => o.layers.enable(n)); }

  _aimHead(target, w) {
    if (w <= 0) return;
    const V = this.v;
    // a neck turns about 75° each way and nods about 35°: keep the target inside that cone (in the body's frame)
    this.j.spine.updateMatrixWorld(true);
    const loc = this.j.spine.worldToLocal(V.e.copy(target)), hp = this.j.neck.position, dx = loc.x - hp.x, dy = loc.y - hp.y - 0.14, dz = loc.z - hp.z, hd = Math.hypot(dx, dz);
    let yaw = Math.atan2(dx, dz), pit = Math.atan2(dy, hd);
    if (Math.abs(yaw) > 1.3 || Math.abs(pit) > 0.75) { yaw = MathX.clamp(yaw, -1.3, 1.3); pit = MathX.clamp(pit, -0.75, 0.6); const r = Math.hypot(hd, dy); target = this.j.spine.localToWorld(new THREE.Vector3(hp.x + Math.sin(yaw) * Math.cos(pit) * r, hp.y + 0.14 + Math.sin(pit) * r, hp.z + Math.cos(yaw) * Math.cos(pit) * r)); }
    for (const [o, k] of [[this.j.neck, 0.35], [this.j.head, 1]]) {
      V.q.copy(o.quaternion); o.updateMatrixWorld(true); o.lookAt(target); V.q2.copy(o.quaternion);
      o.quaternion.copy(V.q).slerp(V.q2, w * k); o.updateMatrixWorld(true);
    }
  }
  // two-bone reach: the wrist onto a world point (side 1 = left, −1 = right); the elbow drops below the line and a little out
  _reach(side, target, w = 1) {
    if (w <= 0) return;
    const j = this.j, arm = side > 0 ? j.la : j.ra, V = this.v;
    j.spine.updateMatrixWorld(true);
    const T = j.spine.worldToLocal(V.a.copy(target)), Sh = arm.sh.position;
    const d = T.clone().sub(Sh), D = Math.max(0.05, d.length()), dir = d.divideScalar(D);
    const L1 = 0.3, L2 = 0.26, Dc = Math.min(D, L1 + L2 - 0.004);
    const al = Math.acos(MathX.clamp((L1 * L1 + Dc * Dc - L2 * L2) / (2 * L1 * Dc), -1, 1));
    const pole = new THREE.Vector3(side * 0.45, -1, -0.2); pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const u = dir.clone().multiplyScalar(Math.cos(al)).addScaledVector(pole, Math.sin(al));
    const E = Sh.clone().addScaledVector(u, L1), f = T.clone().sub(E).normalize();
    const beta = Math.acos(MathX.clamp(u.dot(f), -1, 1));
    let bz = f.clone().addScaledVector(u, -f.dot(u)); if (bz.lengthSq() < 1e-8) bz = pole.clone().negate(); bz.normalize();
    const Y = u.clone().negate(), X = new THREE.Vector3().crossVectors(Y, bz);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, bz));
    arm.sh.quaternion.slerp(q, w);
    arm.el.rotation.x = MathX.lerp(arm.el.rotation.x, -beta, w);
  }
  // turn a hand in world space: fingers along F, palm facing N
  _orient(side, F, N, w = 1) {
    if (w <= 0) return;
    const arm = side > 0 ? this.j.la : this.j.ra, V = this.v;
    const f = V.d.copy(F).normalize(), Y = f.clone().negate();
    const n = V.e.copy(N).addScaledVector(f, -N.dot(f)).normalize();
    const X = n.clone().multiplyScalar(-side), Z = new THREE.Vector3().crossVectors(X, Y);
    V.q2.setFromRotationMatrix(V.m.makeBasis(X, Y, Z));
    arm.el.updateMatrixWorld(true); arm.el.getWorldQuaternion(V.q);
    const ql = V.q.invert().multiply(V.q2);
    arm.hand.quaternion.identity().slerp(ql, w);
  }
  // a hand onto a contact: kind = 'palm' (palm centre on P, facing N), 'fist' (knuckles on P, punching along F), 'tip' (index tip on P, pointing along F)
  place(side, kind, P, F, N, w = 1) {
    if (w <= 0) return;
    const V = this.v, f = V.b.copy(F).normalize(), n = V.c.copy(N).addScaledVector(f, -N.dot(f)).normalize(), W = new THREE.Vector3();
    const s = this.j.body.scale.x;
    if (kind === 'palm') W.copy(P).addScaledVector(n, -0.016 * s).addScaledVector(f, -0.052 * s);
    else if (kind === 'fist') W.copy(P).addScaledVector(f, -0.105 * s);
    else { const Zh = new THREE.Vector3().crossVectors(n.clone().multiplyScalar(-side), f.clone().negate()); W.copy(P).addScaledVector(f, -0.19 * s).addScaledVector(Zh, -0.031 * s); }   // (the index sits 3 cm off the hand's centre line)
    this._reach(side, W, w);
    this.p.root.updateMatrixWorld(true);
    this._orient(side, f, n, w);
  }
  blinkAt(t, seed, period = 3.3) {
    const k = Math.floor(t / period), ph = t - k * period - hash1(k * 17 + seed) * 1.6;
    return ph > 0 && ph < 0.16 ? Math.sin(ph / 0.16 * Math.PI) : 0;
  }
  // lips through the speaker's subtitle windows (and the unsubtitled DON'T LET ME DIE)
  talkAt(t, who) {
    let m = 0;
    const lines = GM_SAY.filter((s) => s[0] === who).map((s) => [s[2][0], s[2][1], s[1]]);
    if (who === 'A') lines.push([GM.hook.dont[0], GM.hook.dont[1], 'DONT LET ME DIE']);
    for (const [a, b, text] of lines) {
      if (t < a || t > b - 0.05) continue;
      const n = text.replace(/[^A-Za-z]/g, '').length, dur = Math.min(b - a - 0.12, 0.075 * n + 0.18), u = t - a;
      if (u < dur) m = Math.max(m, (0.3 + 0.7 * Math.abs(Math.sin(u * 16 + n))) * MathX.smooth(u, 0, 0.05) * (1 - MathX.smooth(u, dur - 0.08, dur)) * 0.75);
    }
    return m;
  }
}

// keyed motion: positions [t, x, z] (linear, with the distance walked), yaw [t, rad], actions [t, name]
class GmKeys {
  constructor(pos, yaw, acts) {
    this.pos = pos; this.yaw = new Track(yaw, 'inOutSine'); this.acts = acts;
    this.cum = [0]; for (let i = 1; i < pos.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(pos[i][1] - pos[i - 1][1], pos[i][2] - pos[i - 1][2]));
  }
  at(t) {
    const P = this.pos; if (t <= P[0][0]) return { x: P[0][1], z: P[0][2], dist: 0 };
    for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const a = P[i - 1], b = P[i], f = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return { x: a[1] + (b[1] - a[1]) * f, z: a[2] + (b[2] - a[2]) * f, dist: this.cum[i - 1] + (this.cum[i] - this.cum[i - 1]) * f }; }
    const b = P[P.length - 1]; return { x: b[1], z: b[2], dist: this.cum[P.length - 1] };
  }
  pose(t, ctx) {
    const S = this.acts; let i = 0; while (i + 1 < S.length && S[i + 1][0] <= t) i++;
    const [t0, name] = S[i], cur = (ACTIONS[name] || ACTIONS.idle)(t - t0, ctx), bl = BLEND[name] || 0.4;
    if (i > 0 && t - t0 < bl) { const [tp, pn] = S[i - 1]; return lerpPose((ACTIONS[pn] || ACTIONS.idle)(t - tp, ctx), cur, Ease.inOutSine((t - t0) / bl)); }
    return cur;
  }
}

/* ---------------- screen geometry: where a point of your screen is, in his world ---------------- */
const GmScreen = {
  _v: new THREE.Vector3(), _o: new THREE.Vector3(),
  ndc(px, py) { return [px / 540 - 1, 1 - py / 960]; },
  // the point at view depth d (metres in front of the lens) under design pixel (px, py)
  at(cam, px, py, d, out) {
    const [nx, ny] = this.ndc(px, py), ty = Math.tan(MathX.deg(cam.fov) / 2), tx = ty * cam.aspect;
    return out.set(nx * tx * d, ny * ty * d, -d).applyMatrix4(cam.matrixWorld);
  },
  // the point on the world plane z = Z under design pixel (px, py)
  onZ(cam, px, py, Z, out) {
    const o = this._o.setFromMatrixPosition(cam.matrixWorld), p = this.at(cam, px, py, 1, this._v), d = p.sub(o);
    return out.copy(o).addScaledVector(d, (Z - o.z) / d.z);
  },
  // a world point → design pixels
  px(cam, p) { const v = this._v.copy(p).project(cam); return [(v.x + 1) * 540, (1 - v.y) * 960, v.z]; },
};

/* ---------------- NPC_AWARE_01 ---------------- */
const GA = (() => {
  const H = GM.hold, R = GM.reset;
  const pos = [[0, -0.05, -2.05], [3.3, -0.05, -2.05], [4.25, 0.08, -1.27], [8.3, 0.08, -1.27], [8.95, -0.22, -1.6], [12.45, -0.22, -1.6], [13.35, 0.0, -4.45], [15.3, 0.0, -4.45],
    [15.65, 0.62, -5.3], [16.25, 0.86, -7.6], [16.6, 0.85, -9.6], [17.12, 0.72, -11.95], [21.95, 0.72, -11.95], [22.8, 1.85, -15.8], [27.6, 1.85, -15.8], [28.25, 1.0, -14.95],
    [29.2, 1.0, -14.95], [29.6, 1.0, -15.12], [33.9, 1.0, -15.12], [34.6, 1.04, -14.7], [R.run, 1.04, -14.7], [38.55, 1.12, -14.12], [41.3, 1.12, -14.12], [41.7, 1.05, -14.5], [42.05, 1.05, -14.3], [42.4, 1.05, -14.35],
    [43.45, 1.05, -14.35], [44.0, 1.06, -14.1], [GM.end.cut, 1.06, -14.1], [GM.end.cut + 0.001, 1.04, -14.32], [60, 1.04, -14.32]];
  const yaw = [[0, 0], [3.3, 0], [4.25, 0.05], [8.3, 0.05], [8.95, 0.5], [9.6, 0.15], [11.8, 0.15], [12.45, 3.08], [13.35, 3.08], [13.6, 0.05], [15.3, 0.05], [15.55, 2.45], [16.25, 2.9], [16.6, 3.25], [17.12, 3.3], [17.5, 0.25],
    [21.95, 0.25], [22.1, 2.9], [22.65, 2.9], [22.85, -0.33], [27.6, -0.33], [27.75, -1.2], [28.25, 0.05], [33.9, 0.05], [34.1, 3.0], [34.9, 3.0], [35.3, 0.1], [36.4, 0.1], [36.7, 2.9], [37.4, 2.9], [37.7, 0.05], [60, 0.05]];
  const acts = [[0, 'gmTense'], [3.3, 'walk'], [4.25, 'gmTense'], [8.3, 'walk'], [8.95, 'gmTense'], [11.8, 'gmTense'], [12.45, 'gmRun'], [13.35, 'gmTense'], [15.3, 'gmRun'], [17.12, 'gmTense'],
    [21.95, 'gmRun'], [22.8, 'gmPeer'], [26.0, 'gmStand'], [27.6, 'walk'], [28.25, 'gmTense'], [33.9, 'gmTense'], [34.1, 'walk'], [34.6, 'gmTense'], [37.35, 'gmDuck'], [37.8, 'gmRun'], [38.55, 'gmTense'],
    [41.3, 'walk'], [41.7, 'gmTense'], [43.45, 'walk'], [44.0, 'gmTense'], [GM.reach.cancelled, 'gmRelief'], [GM.end.cut, 'gmStand']];
  return new GmKeys(pos, yaw, acts);
})();

class GmAware extends GmActor {
  constructor(scene) {
    super(scene, 'aware', 'gmAware', { skin: SKIN[2], hair: '#1c140f', brow: '#22180f', iris: [88, 62, 38], seed: 41, stubble: true, nose: 0.021 });
    this.j.body.scale.setScalar(1.02);
    // the jacket's zip, either side of the open front
    const front = BUILDS.avg.depth * 0.5, zm = Mat.std('#a9a49a', { roughness: 0.35, metalness: 0.6 });
    for (const sx of [-1, 1]) { const z = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.37, 0.006), zm); z.position.set(sx * 0.046, 0.3, front + 0.008); this.j.spine.add(z); }
    this.layer(1);
  }

  update(t, cam) {
    const p = this.p, V = this.v, lens = V.a.setFromMatrixPosition(cam.matrixWorld).clone();
    const L = GA.at(t), yaw = GA.yaw.value(t);
    p.root.position.set(L.x, 0, L.z); p.root.rotation.set(0, yaw, 0);
    const ctx = { seed: p.seed, seedI: p.seedI, walkPhase: (L.dist / 1.3) * Math.PI * 2 };
    const Ed0 = GM.edge, Rc0 = GM.reach, tp = t >= Ed0.right && t < GM.drone.drop ? Ed0.right : t >= Rc0.glitch[0] && t < Rc0.cancelled ? Rc0.glitch[0] : t;
    const pose = GA.pose(tp, ctx);
    p.apply(pose); p.root.updateMatrixWorld(true);                 // (this frame's shoulders, for the reaches below)
    // a breath and a weight shift in the still moments
    pose.spine += 0.012 * Math.sin(tp * 1.9); pose.headRoll = (pose.headRoll || 0);
    const F = { blink: 0, brow: 0, frown: 0, worry: 0, wide: 0, mouth: 0, pucker: 0, smile: 0 };
    let gaze = lens, head = 0.9, eyes = 1, still = false;
    const hands = { L: ['relax'], R: ['relax'] }, place = [];
    const T = GM.touch, Tc = GM.tech, Ho = GM.hold, Ro = GM.roul, Sy = GM.sys, Ed = GM.edge, Dr = GM.drone, Re = GM.reset, Rc = GM.reach;
    const sp = (px, py, d) => GmScreen.at(cam, px, py, d, new THREE.Vector3());
    if (t < T.step[0]) {                                            // the hook: confused, then he realises
      F.frown = 0.45 * MathX.smooth(t, 0.4, 0.7) * (1 - MathX.smooth(t, 1.4, 1.7)); F.brow = MathX.smooth(t, 1.4, 1.8) * 0.8; F.wide = MathX.smooth(t, 1.3, 1.7) * 0.6;
      F.worry = MathX.smooth(t, 2.5, 2.8) * 0.8; pose.headRoll = 0.08 * MathX.smooth(t, 0.5, 0.9) * (1 - MathX.smooth(t, 1.5, 1.9));
      pose.spine += 0.06 * MathX.smooth(t, 1.4, 2.2);
    } else if (t < Tc.door) {                                       // the touch
      F.worry = 0.5; F.wide = 0.3;
      const on = MathX.smooth(t, T.palm - 0.45, T.palm), rec = MathX.impulse(t, T.contact, 0.18) * (t > T.contact ? 1 : 0);
      if (on > 0) {
        const P = GmScreen.onZ(cam, GM_TARGETS.palm.x, GM_TARGETS.palm.y, GF.glassZ - 0.004, new THREE.Vector3());
        P.z -= 0.012 * rec;                                         // the jolt: his palm lifts off the glass a little
        place.push(['R', 'palm', P, V.b.set(0.12, 1, 0).normalize().clone(), new THREE.Vector3(0, 0, 1), on]);
        hands.R = ['flat', 'flinch', rec * 0.8];
      }
      if (t > T.contact) { F.wide = 1 - 0.5 * MathX.smooth(t, T.contact + 1.5, T.contact + 2.2); F.brow = 1 - 0.4 * MathX.smooth(t, T.contact + 1.4, T.contact + 2.2); F.mouth = 0.35 * MathX.smooth(t, T.contact, T.contact + 0.12) * (1 - MathX.smooth(t, T.contact + 0.6, T.contact + 0.9)); F.worry = 0.2; }
      if (t > T.contact + 0.35 && t < T.contact + 0.95) { gaze = sp(GM_TARGETS.palm.x, GM_TARGETS.palm.y, 0.95); head = 0.5; }   // looks at his hand
    } else if (t < GM.alarm) {                                      // the witness
      const tech = this.techHead || lens;
      if (t < Tc.point) { gaze = tech; head = MathX.smooth(t, 8.2, 8.6) * 0.85; F.frown = 0.3; }
      else if (t < Tc.look + 0.4) { gaze = lens; F.brow = 0.6; F.wide = 0.5;
        const k = MathX.smooth(t, Tc.point, Tc.point + 0.3) * (1 - MathX.smooth(t, Tc.them[1] + 0.2, Tc.them[1] + 0.6));
        if (k > 0) { const sh = this.j.ra.sh.getWorldPosition(new THREE.Vector3()), dir = lens.clone().sub(sh).normalize(); place.push(['R', 'tip', sh.clone().addScaledVector(dir, 0.6), dir, new THREE.Vector3(0, -1, 0), k]); hands.R = ['point']; }
      } else { gaze = t < 10.9 ? tech : lens; head = 0.8; F.frown = 0.15; F.worry = 0.6; F.brow = t > 10.9 ? 0.5 : 0; }
    } else if (t < GM.choice.zero) {                                // alarm, the doors, CHOOSE
      F.wide = 0.9; F.worry = 0.9;
      if (t < 12.4) { gaze = V.c.set(-0.8, 3.0, -0.4).clone(); head = 0.7; }
      else if (t < 13.4) { gaze = null; }
      else { const u = t - 13.4; gaze = u < 0.5 ? lens : u < 1.0 ? V.c.set(-0.72, 1.2, -5.8).clone() : u < 1.5 ? V.c.set(0.72, 1.2, -5.8).clone() : lens; head = 0.75; }
    } else if (t < Ho.arrive + 0.15) {                              // the run
      gaze = null; F.wide = 0.8; F.worry = 0.8;
    } else if (t < Ho.ctrl[1] + 0.2) {                              // HOLD: his palm on the scanner, looking at you
      F.worry = 0.85; F.wide = 0.5;
      const S = GF.scanner, k = MathX.smooth(t, Ho.palm - 0.3, Ho.palm) * (1 - MathX.smooth(t, Ho.open[0] + 0.1, Ho.open[0] + 0.45));
      if (k > 0) { place.push(['R', 'palm', new THREE.Vector3(S.x + 0.048, S.y, S.z), new THREE.Vector3(0, 1, -0.15), new THREE.Vector3(-1, 0, 0), k]); hands.R = ['flat']; }
      if (t > Ho.start + 0.6 && t < Ho.steps[3]) { const u = (t - Ho.start - 0.6) % 1.6; if (u > 0.9 && u < 1.3) { gaze = V.c.set(GF.pad.x, GF.pad.y, GF.corrB.z0).clone(); head = 0.4; } }
      if (t > Ho.open[0] && t < Ho.ctrl[0]) { gaze = V.c.set(GF.doorB.x, 1.8, GF.corrB.z0).clone(); head = 0.7; F.brow = 0.8; F.wide = 0.9; F.worry = 0.2; }
      if (t >= Ho.ctrl[0]) { F.brow = 0.9; F.wide = 0.7; F.worry = 0.1; F.mouth = 0.08; }
    } else if (t < Sy.flicker) {                                    // the supply case: he watches it spin, then looks at you
      F.wide = 0.3; F.brow = 0.3;
      gaze = t < 23.4 || (t > Ro.spin[0] + 0.5 && t < Ro.land) ? V.c.set(GF.caseP[0], 1.15, GF.caseP[1]).clone() : lens; head = 0.85;
      if (t > Ro.land + 0.1) { F.brow = 0.5; F.smile = 0.15; }
      const k = MathX.smooth(t, Ro.ui, Ro.ui + 0.4) * (1 - MathX.smooth(t, Ro.land + 0.2, Ro.land + 0.6));
      if (k > 0) for (const [sd, dx] of [['L', 0.13], ['R', -0.13]]) { place.push([sd, 'palm', new THREE.Vector3(GF.caseP[0] + dx, 1.13, GF.caseP[1] - 0.05), new THREE.Vector3(dx * 1.5, 0, 1).normalize(), new THREE.Vector3(0, -1, 0), k]); hands[sd] = ['flat']; }
    } else if (t < Ed.right) {                                      // the system notices
      F.wide = 0.4 + 0.6 * MathX.smooth(t, Sy.observer, Sy.observer + 0.3); F.worry = MathX.smooth(t, Sy.input, Sy.input + 0.5);
      if (t > Sy.input + 0.15 && t < Sy.knows[0] - 0.1) { const k = MathX.clamp((t - Sy.input - 0.2) / 1.2, 0, 1); gaze = sp(MathX.lerp(300, 780, k), t < Sy.observer ? 410 : 490, 1.2); head = 0.55; }   // he reads it
      else gaze = lens;
      if (t > Sy.knows[0]) { F.mouth = 0; head = 0.95; }
    } else if (t < Dr.drop) {                                       // the frame: the right edge, the bottom, back to you
      F.wide = 0.6; F.worry = 0.6; still = true;
      if (t < Ed.bottom) { gaze = sp(1040, 1120, 1.4); head = 0.45; F.frown = 0.3; }
      else if (t < Ed.back) { gaze = sp(470, 1650, 1.4); head = 0.5; F.frown = 0.3; }
      else { gaze = lens; head = 0.95; F.brow = 0.6; }
    } else if (t < Re.n5) {                                         // the drone
      F.wide = 1; F.worry = 1;
      if (t < 34.9 || (t > 36.5 && t < 37.6)) { gaze = this.droneP || lens; head = 0.8; } else gaze = lens;
    } else if (t < Re.hit - 0.1) {                                  // RESET IN 5: he runs at you, his palm on your screen
      F.wide = 1; F.worry = 1; F.brow = 0.6;
      const k = MathX.smooth(t, Re.press - 0.3, Re.press) * (1 - MathX.smooth(t, Re.real[1] - 0.15, Re.wind));
      if (k > 0) {
        const P = sp(GM_TARGETS.screen.x, GM_TARGETS.screen.y, 0.5);
        const N = V.d.copy(lens).sub(P).normalize().clone();
        place.push(['R', 'palm', P, new THREE.Vector3(-0.42, 1, 0.05).applyQuaternion(cam.quaternion).normalize(), N, k]); hands.R = ['flat', 'flinch', MathX.impulse(t, Re.press, 0.12) * (t > Re.press ? 0.6 : 0)];
      }
      if (t > Re.hand[0] && t < Re.hand[1]) { gaze = sp(GM_TARGETS.screen.x, GM_TARGETS.screen.y - 120, 0.5); head = 0.8; eyes = 0.7; F.wide = 1; F.brow = 1; F.worry = 0.4; }
      if (t >= Re.hand[1]) { gaze = lens; F.brow = 1; F.worry = 0.3; F.smile = 0.1 * MathX.smooth(t, Re.real[0], Re.real[1]); }
      if (t > Re.wind) { F.frown = 0.8; F.worry = 0.6; F.brow = 0; hands.R = ['fist']; const k2 = MathX.smooth(t, Re.wind, Re.wind + 0.3);
        const sh = this.j.ra.sh.getWorldPosition(new THREE.Vector3()); place.push(['R', 'fist', sh.clone().add(new THREE.Vector3(0.05, -0.1, 0.12)), lens.clone().sub(sh).normalize(), new THREE.Vector3(0, -1, 0), k2]); }
    } else if (t < Rc.start) {                                      // the punch, the crack
      F.frown = 0.6; F.wide = 0.8; hands.R = ['fist'];
      const hitP = sp(GM_TARGETS.crack.x, GM_TARGETS.crack.y, 0.42), k = 1 - MathX.smooth(t, Re.hit + 0.25, Re.hit + 0.6);
      if (k > 0) place.push(['R', 'fist', hitP, hitP.clone().sub(this.j.ra.sh.getWorldPosition(new THREE.Vector3())).normalize(), new THREE.Vector3(0, -1, 0), k]);
      if (t > Re.shatter[0]) { gaze = t < 43.0 ? sp(220, 600, 0.9) : sp(820, 1300, 0.9); head = 0.6; F.wide = 1; F.brow = 0.8; F.frown = 0; hands.R = ['relax']; }
    } else if (t < GM.end.cut) {                                    // through the hole: his fingertip on yours
      F.worry = 0.9; F.wide = 0.7; F.brow = 0.5;
      const k = MathX.smooth(t, Rc.start, Rc.start + 0.6) * (1 - MathX.smooth(t, Rc.cancelled + 0.2, Rc.cancelled + 0.8));
      if (k > 0) {
        // the index points up toward your screen, its pad facing you (a fingertip pressed on glass from the other side)
        const P = sp(GM_TARGETS.finger.x, GM_TARGETS.finger.y, 0.15);
        const Fd = new THREE.Vector3(-0.08, 0.86, -0.5).normalize().applyQuaternion(cam.quaternion), Nd = new THREE.Vector3(0, -0.25, 1).normalize().applyQuaternion(cam.quaternion);
        place.push(['R', 'tip', P, Fd, Nd, k]); hands.R = ['reach'];
      }
      if (t > Rc.contact) { F.wide = 1; F.brow = 1; F.worry = 0.4; }
      if (t > Rc.glitch[0] && t < Rc.cancelled) still = true;
      if (t > Rc.cancelled) { F.wide = 0.2; F.brow = 0.3; F.worry = 0; F.smile = 0.25 * MathX.smooth(t, Rc.cancelled + 0.2, Rc.cancelled + 0.7); F.blink = MathX.smooth(t, Rc.cancelled + 0.15, Rc.cancelled + 0.3) * (1 - MathX.smooth(t, Rc.cancelled + 0.55, Rc.cancelled + 0.75)); }
    } else {                                                        // the end: calm, a small smile
      F.smile = 0.75 * MathX.smooth(t, GM.end.cut + 0.1, GM.end.come[0] + 0.2); F.brow = 0.25; F.worry = 0.15; head = 0.95;
    }
    // speech
    F.mouth = Math.max(F.mouth, this.talkAt(t, 'A'));
    p.apply(pose); p.root.updateMatrixWorld(true);
    if (gaze) this._aimHead(gaze, head);
    p.root.updateMatrixWorld(true);
    for (const [side, kind, P, Fd, N, w] of place) this.place(side === 'L' ? 1 : -1, kind, P, Fd, N, w);
    this.hands.L.pose(...hands.L); this.hands.R.pose(...hands.R);
    p.root.updateMatrixWorld(true);
    if (gaze && eyes > 0) this.face.aimEyes(gaze, eyes); else this.face.rest();
    F.blink = Math.max(F.blink, still ? 0 : this.blinkAt(t, 3));
    this.face.set(F);
    p.root.updateMatrixWorld(true);
    this.blob.begin(); const hp = p.worldOf('hips', V.e); this.blob.push(hp.x, 0.012, hp.z, 0.6, 0.5); this.blob.end();
  }
  headWorld(out) { return this.j.head.getWorldPosition(out); }
  indexTip(out) { return this.hands.R.indexTip(out); }
}

/* ---------------- the technician ---------------- */
const GT = (() => {
  const T = GM.tech;
  const pos = [[0, 0.72, -6.6], [T.door, 0.72, -6.6], [T.enter[0], 0.72, -5.7], [T.enter[1], 0.52, -1.95], [10.2, 0.52, -1.95], [10.9, 0.42, -1.55], [12.45, 0.42, -1.55], [12.95, 1.25, -0.6], [13.5, 2.5, 0.6], [14.2, 2.9, 2.4]];
  const yaw = [[0, -0.05], [T.enter[1] - 0.2, -0.05], [T.enter[1] + 0.3, -1.1], [10.2, -1.0], [10.6, -0.3], [12.45, -0.3], [12.6, 0.75], [14.2, 0.4]];
  const acts = [[0, 'gmWalkTab'], [T.enter[1], 'gmTablet'], [10.25, 'gmWalkTab'], [10.9, 'gmPeer'], [11.75, 'gmTablet'], [12.45, 'gmRun']];
  return new GmKeys(pos, yaw, acts);
})();
class GmTech extends GmActor {
  constructor(scene) {
    super(scene, 'tech', 'gmTech', { skin: SKIN[0], hair: '#4a3222', brow: '#3a2a1e', iris: [70, 92, 104], seed: 77, hairStyle: 'bun', glasses: true, wide: 0.78, jaw: 0.3, nose: 0.018, chin: 0.004, lip: '#b0706a' });
    // a tablet in her left hand, an ID badge on a lanyard
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.24, 0.17), Mat.std('#1b1d21', { roughness: 0.3, metalness: 0.3 })); tab.position.set(-0.03, -0.1, 0.03); tab.rotation.set(0, 0, 0.1); tab.castShadow = true;
    this.j.la.hand.add(tab);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.14), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#9fd8e8', emissiveIntensity: 0.6 })); scr.rotation.y = -Math.PI / 2; scr.position.set(-0.0065, 0, 0); tab.add(scr);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.004), Mat.std('#e8e6df', { roughness: 0.5 })); badge.position.set(0.05, 0.28, 0.115); this.j.spine.add(badge);
  }
  update(t, cam, aware) {
    const p = this.p, V = this.v, T = GM.tech;
    const show = t >= T.door + 0.05 && t < 14.2;
    p.root.visible = show; this.blob.mesh.visible = show;
    if (!show) return;
    const L = GT.at(t), lens = V.a.setFromMatrixPosition(cam.matrixWorld).clone();
    p.root.position.set(L.x, 0, L.z); p.root.rotation.set(0, GT.yaw.value(t), 0);
    const pose = GT.pose(t, { seed: p.seed, seedI: p.seedI, walkPhase: (L.dist / 1.2) * Math.PI * 2 });
    const F = { blink: this.blinkAt(t, 9, 2.9), brow: 0, frown: 0, worry: 0, wide: 0, mouth: this.talkAt(t, 'T'), pucker: 0, smile: 0 };
    let gaze = aware.headWorld(new THREE.Vector3()), head = 0.85;
    if (t < T.enter[1] - 0.6) { gaze = null; }
    if (t > T.point + 0.15 && t < T.look) { const tip = aware.indexTip(new THREE.Vector3()); gaze = tip; head = 0.6; F.frown = 0.4; }
    // she looks where he points — through the lens, focused a metre and a half beyond it: there is no one there
    if (t >= T.look && t < GM.alarm) {
      const hd = this.j.head.getWorldPosition(new THREE.Vector3()), dir = lens.clone().sub(hd).normalize();
      gaze = lens.clone().addScaledVector(dir, 1.6).add(new THREE.Vector3(0.35 * Math.sin((t - T.look) * 2.4), 0.1, 0)); head = 0.75;
      F.frown = 0.5; F.brow = 0.15;
      if (t > T.nobody[0] + 0.3) { pose.headYaw = 0.12 * Math.sin((t - T.nobody[0]) * 9) * Math.exp(-(t - T.nobody[0] - 0.3) * 1.5); }
    }
    if (t >= GM.alarm) { gaze = t < 12.4 ? new THREE.Vector3(0.4, 3.1, -1.5) : null; F.wide = 1; F.brow = 1; }
    p.apply(pose); p.root.updateMatrixWorld(true);
    if (gaze) this._aimHead(gaze, head);
    this.hands.L.pose('grip'); this.hands.R.pose('relax');
    p.root.updateMatrixWorld(true);
    if (gaze) this.face.aimEyes(gaze, 1); else this.face.rest();
    this.face.set(F);
    this.blob.begin(); const hp = p.worldOf('hips', V.e); this.blob.push(hp.x, 0.012, hp.z, 0.5, 0.45); this.blob.end();
  }
}
