/* =====================================================================
   HEROES — close-up characters on the shared body (js/world/people.js):
     HeroFace   a hero head: eyes that aim at a world point (the lens),
                lids, brows (raise, frown, worry), lips (part, smile,
                purse), hair with strands, optional glasses
     HeroHand   five fingers posed by name (relax, flat, point, fist,
                reach, flinch, grip)
     HeroActor  body + face + hands, arm IK onto world points, palm /
                fist / fingertip contacts, head and eye aiming
     HeroKeys   keyed motion: positions, yaw, actions (blended)
     ScreenGeo  screen pixels ↔ world points for a camera
   (First made for films/game; shared from here on.)
   ===================================================================== */

// an iris drawn in polar form (u = angle, v = radius from the pupil's centre to the edge of the iris cap)
function heroIrisTex(base, seed) {
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
function heroHairMat(color, seed) {
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
class HeroFace {
  constructor(head, o) {
    this.head = head; this.o = o;
    for (const c of [...head.children]) head.remove(c);
    const skinC = new THREE.Color(o.skin);
    const skin = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.58 }), skinF = new THREE.MeshStandardMaterial({ color: o.skin, roughness: 0.58 });
    this.skinMat = skinF;
    const lip = Mat.std(o.lip || '#a6665a', { roughness: 0.45 }), hair = heroHairMat(o.hair, o.seed || 5), browM = Mat.std(o.brow || '#2a1f18', { roughness: 0.95 });
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
    const sclera = new THREE.MeshStandardMaterial({ color: '#ece7de', roughness: 0.14 }), iris = new THREE.MeshStandardMaterial({ map: heroIrisTex(o.iris || [96, 74, 44], o.seed || 31), roughness: 0.06 });
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
const HERO_HAND = {
  relax: { curl: [0.35, 0.45, 0.52, 0.6], spread: 0.08, thumb: [0.3, 0.35] },
  flat: { curl: [0.06, 0.03, 0.06, 0.1], spread: 0.3, thumb: [0.0, 0.35] },
  point: { curl: [0.0, 1.35, 1.42, 1.48], spread: 0.0, thumb: [0.95, 0.25] },
  fist: { curl: [1.45, 1.5, 1.52, 1.52], spread: 0.0, thumb: [1.15, 0.15] },
  reach: { curl: [0.0, 0.75, 0.9, 1.05], spread: 0.08, thumb: [0.55, 0.35] },
  flinch: { curl: [0.22, 0.28, 0.34, 0.42], spread: 0.25, thumb: [0.25, 0.6] },
  grip: { curl: [0.9, 1.0, 1.05, 1.1], spread: 0.0, thumb: [0.7, 0.3] },
};
class HeroHand {
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
    const A = HERO_HAND[a] || HERO_HAND.relax, B = b ? HERO_HAND[b] || A : A, s = this.side;
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
class HeroActor {
  constructor(scene, id, look, face) {
    this.p = new Person({ id, look, states: [[0, 'gmStand']] }, scene);
    this.p.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.j = this.p.j;
    this.face = new HeroFace(this.j.head, face);
    this.hands = { L: new HeroHand(this.j.la.hand, 1, this.face.skinMat), R: new HeroHand(this.j.ra.hand, -1, this.face.skinMat) };
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
  // lips through subtitle windows: lines = [[t0, t1, text], ...]
  talkAt(t, lines) {
    let m = 0;
    for (const [a, b, text] of lines) {
      if (t < a || t > b - 0.05) continue;
      const n = text.replace(/[^A-Za-z]/g, '').length, dur = Math.min(b - a - 0.12, 0.075 * n + 0.18), u = t - a;
      if (u < dur) m = Math.max(m, (0.3 + 0.7 * Math.abs(Math.sin(u * 16 + n))) * MathX.smooth(u, 0, 0.05) * (1 - MathX.smooth(u, dur - 0.08, dur)) * 0.75);
    }
    return m;
  }
}

// keyed motion: positions [t, x, z] (linear, with the distance walked), yaw [t, rad], actions [t, name]
class HeroKeys {
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
const ScreenGeo = {
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

