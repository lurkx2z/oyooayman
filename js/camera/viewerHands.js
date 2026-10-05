/* =====================================================================
   VIEWER HANDS — the viewer's own forearms and hands, attached to the camera.
   An authored low-poly model (smooth shaded): jacket sleeve with cuff, wrist,
   palm with a thenar pad, four three-segment fingers with nails, a two-joint
   thumb, a watch on the left wrist. Every finger joint is posable.

   Poses (SCRIPT.hands) are written as: wrist position in camera space,
   finger direction F, palm normal N, finger curls and thumb. Poses blend
   (position lerp, orientation slerp, curl lerp) — a pure function of time.
     hidden · ear · reach (toward someone) · look (your own shaking hand) · brace (hand to the pavement)
   ===================================================================== */

// smooth (indexed) loft through rings [y, halfWidth, halfDepth, zOffset]; rounded caps
function smoothLoft(rings, sides = 10, capTop = 0.6, capBottom = 0.4) {
  const pos = [], idx = [];
  const ring = ([y, hw, hd, zo = 0]) => {
    const base = pos.length / 3;
    for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2; pos.push(Math.sin(a) * hw, y, Math.cos(a) * hd + zo); }
    return base;
  };
  const R = rings.map(ring);
  for (let r = 0; r < R.length - 1; r++) for (let k = 0; k < sides; k++) {
    const k2 = (k + 1) % sides, a = R[r] + k, b = R[r] + k2, c = R[r + 1] + k2, d = R[r + 1] + k;
    idx.push(a, b, c, a, c, d);
  }
  const cap = (ri, dir, f) => {
    const [y, hw, hd, zo = 0] = rings[ri], c = pos.length / 3;
    pos.push(0, y + dir * Math.min(hw, hd) * f, zo);
    for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides; if (dir > 0) idx.push(R[ri] + k, R[ri] + k2, c); else idx.push(R[ri] + k2, R[ri] + k, c); }
  };
  cap(R.length - 1, 1, capTop); cap(0, -1, capBottom);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const HAND_POSES = {
  // p: wrist (camera space, right hand; mirrored for the left)  F: finger direction  N: palm normal
  // curl: [index, middle, ring, little] (radians per joint)  thumb: [spread, curl]
  hidden: { p: [0.22, -0.62, -0.3], F: [0, 1, -0.3], N: [-1, 0, 0], curl: [0.35, 0.4, 0.45, 0.5], thumb: [0.4, 0.3] },
  ear:    { p: [0.17, 0.0, 0.05], F: [0, 1, 0.1], N: [-1, 0, 0], curl: [0.15, 0.15, 0.2, 0.25], thumb: [0.6, 0.1] },
  reach:  { p: [0.085, -0.158, -0.4], F: [-0.18, 0.12, -1], N: [-0.3, -1, 0], curl: [0.18, 0.24, 0.32, 0.42], thumb: [0.55, 0.15] },
  look:   { p: [0.048, -0.118, -0.34], F: [-0.08, 1, -0.3], N: [0, 0.29, 1], curl: [0.14, 0.12, 0.2, 0.28], thumb: [0.75, 0.08] },
  // looking down ~35° while kneeling: fingers flat along the ground (which reads as 'up' in camera space), forearm down toward the body
  brace:  { p: [0.05, -0.1, -0.44], F: [-0.15, 0.5, -0.85], N: [0, -0.82, -0.57], curl: [0.04, 0.03, 0.06, 0.1], thumb: [0.42, 0.18] },
};
const HAND_BLEND = { hidden: 0.38, ear: 0.13, reach: 0.5, look: 0.55, brace: 0.32 };

class ViewerHands {
  constructor(camera) {
    this.camera = camera;
    this.root = new THREE.Group();
    this.root.name = 'viewerHands';
    camera.add(this.root);
    this.mats = {
      skin: new THREE.MeshStandardMaterial({ color: '#b98a70', roughness: 0.62, name: 'povSkin' }),
      nail: new THREE.MeshStandardMaterial({ color: '#d6b3a2', roughness: 0.35, name: 'povNail' }),
      sleeve: new THREE.MeshStandardMaterial({ color: '#2a3340', roughness: 0.92, name: 'povSleeve' }),
      cuff: new THREE.MeshStandardMaterial({ color: '#1f252d', roughness: 0.95, name: 'povCuff' }),
      band: new THREE.MeshStandardMaterial({ color: '#19191b', roughness: 0.55, name: 'povBand' }),
      bezel: new THREE.MeshStandardMaterial({ color: '#9aa0a6', roughness: 0.3, metalness: 0.9, name: 'povBezel' }),
      face: new THREE.MeshStandardMaterial({ color: '#202428', roughness: 0.2, metalness: 0.2, name: 'povFace' }),
    };
    this.right = this._arm(1);
    this.left = this._arm(-1);
    this.root.add(this.right.g, this.left.g);
    this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._m = new THREE.Matrix4();
    this._x = new THREE.Vector3(); this._y = new THREE.Vector3(); this._z = new THREE.Vector3();
  }

  _mesh(g, m, parent, x = 0, y = 0, z = 0) {
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.frustumCulled = false; parent.add(o); return o;
  }

  // one arm. side +1 = right hand (thumb on +X with the palm facing +Z), -1 = left
  _arm(side) {
    const M = this.mats, g = new THREE.Group();
    // forearm skin above the cuff, sleeve and cuff
    this._mesh(smoothLoft([[-0.09, 0.031, 0.023], [-0.04, 0.029, 0.021], [0.004, 0.027, 0.0185]], 12), M.skin, g);
    this._mesh(smoothLoft([[-0.42, 0.058, 0.052], [-0.2, 0.051, 0.046], [-0.078, 0.046, 0.041], [-0.074, 0.044, 0.039]], 14, 0.1, 0.1), M.sleeve, g);
    this._mesh(smoothLoft([[-0.078, 0.047, 0.042], [-0.05, 0.046, 0.041], [-0.046, 0.044, 0.039]], 14, 0.1, 0.1), M.cuff, g);
    if (side < 0) {   // a watch on the left wrist (strap all round, face on the back of the wrist)
      this._mesh(smoothLoft([[-0.034, 0.0305, 0.0225], [-0.018, 0.0305, 0.0225]], 14, 0.05, 0.05), M.band, g);
      const face = this._mesh(new THREE.CylinderGeometry(0.0165, 0.0165, 0.007, 18), M.bezel, g, 0, -0.026, -0.024);
      face.rotation.x = Math.PI / 2;
      this._mesh(new THREE.CylinderGeometry(0.0138, 0.0138, 0.0075, 18), M.face, g, 0, -0.026, -0.025).rotation.x = Math.PI / 2;
    }
    // palm (wrist → knuckles), slightly cupped, with the thenar pad at the thumb's root
    this._mesh(smoothLoft([[0.0, 0.0285, 0.0175], [0.03, 0.0385, 0.019, 0.001], [0.06, 0.0435, 0.0178], [0.084, 0.044, 0.0152, -0.002]], 12, 0.35, 0.2), M.skin, g);
    for (const kx of [0.028, 0.009, -0.0105, -0.0275]) this._mesh(new THREE.SphereGeometry(0.0118, 10, 7), M.skin, g, side * kx, 0.08, -0.0065);   // knuckles (bumps on the back)
    const pad = this._mesh(new THREE.SphereGeometry(0.016, 12, 9), M.skin, g, side * 0.018, 0.026, 0.009);
    pad.scale.set(1.0, 1.4, 0.65);
    // fingers: [x at the knuckle, base y, radius, segment lengths, splay]
    const F = [[0.028, 0.082, 0.0108, [0.042, 0.025, 0.021], 0.06], [0.009, 0.085, 0.0112, [0.046, 0.028, 0.022], 0.0],
      [-0.0105, 0.083, 0.0106, [0.043, 0.027, 0.021], -0.05], [-0.0275, 0.077, 0.0094, [0.034, 0.021, 0.019], -0.12]];
    const fingers = F.map(([fx, fy, r, L, splay]) => {
      const joints = [];
      let parent = g, y0 = fy, rr = r;
      const base = new THREE.Group(); base.position.set(side * fx, y0, 0); base.rotation.z = -side * splay; g.add(base);
      parent = base;
      L.forEach((len, k) => {
        const j = k === 0 ? base : new THREE.Group();
        if (k > 0) { j.position.y = L[k - 1]; parent.add(j); }
        const tip = k === 2;
        // segments start a little below their joint so bending never opens a gap; tips are blunt
        const rings = tip ? [[-rr * 0.5, rr, rr * 0.92], [len * 0.55, rr * 0.94, rr * 0.86], [len * 0.92, rr * 0.8, rr * 0.74]]
          : [[-rr * 0.5, rr, rr * 0.93], [len * 0.5, rr * 0.93, rr * 0.86], [len, rr * 0.92, rr * 0.85]];
        this._mesh(smoothLoft(rings, 10, tip ? 0.6 : 0.3, 0.3), M.skin, j);
        if (tip) this._mesh(new THREE.BoxGeometry(rr * 1.3, len * 0.5, rr * 0.3), M.nail, j, 0, len * 0.6, -rr * 0.76);   // nail on the back
        joints.push(j);
        parent = j; rr *= 0.9;
      });
      return joints;
    });
    // thumb: metacarpal + two phalanges, rooted low on the palm
    const tb = new THREE.Group(); tb.position.set(side * 0.026, 0.012, 0.01); g.add(tb);
    const tLen = [0.036, 0.03, 0.025], tR = [0.0128, 0.0112, 0.0098], thumb = [];
    let tp = tb;
    tLen.forEach((len, k) => {
      const j = k === 0 ? tb : new THREE.Group();
      if (k > 0) { j.position.y = tLen[k - 1]; tp.add(j); }
      const r0 = tR[k];
      const rings = k === 2 ? [[-r0 * 0.5, r0, r0 * 0.9], [len * 0.6, r0 * 0.94, r0 * 0.85], [len * 0.92, r0 * 0.78, r0 * 0.72]] : [[-r0 * 0.5, r0, r0 * 0.92], [len, r0 * 0.94, r0 * 0.87]];
      this._mesh(smoothLoft(rings, 10, k === 2 ? 0.6 : 0.3, 0.3), M.skin, j);
      if (k === 2) this._mesh(new THREE.BoxGeometry(tR[k] * 1.25, len * 0.55, tR[k] * 0.35), M.nail, j, 0, len * 0.6, -tR[k] * 0.78);
      thumb.push(j); tp = j;
    });
    return { g, side, fingers, thumb };
  }

  _poseAt(which, t) {
    const S = SCRIPT.hands[which];
    let i = 0;
    while (i + 1 < S.length && S[i + 1][0] <= t) i++;
    const cur = S[i][1], prev = i > 0 ? S[i - 1][1] : cur;
    const blend = HAND_BLEND[cur] || 0.35;
    const w = i > 0 ? Ease.inOutSine(MathX.clamp((t - S[i][0]) / blend, 0, 1)) : 1;
    return { a: HAND_POSES[prev] || HAND_POSES.hidden, b: HAND_POSES[cur] || HAND_POSES.hidden, w, name: cur };
  }

  // quaternion whose +Y follows F and +Z follows the palm normal N (mirrored in X for the left hand)
  _orient(F, N, side, out) {
    const y = this._y.set(F[0] * side, F[1], F[2]).normalize();
    const z = this._z.set(N[0] * side, N[1], N[2]);
    z.addScaledVector(y, -z.dot(y)).normalize();
    const x = this._x.crossVectors(y, z);
    return out.setFromRotationMatrix(this._m.makeBasis(x, y, z));
  }

  update(t) {
    const hyp = SCRIPT_TRACKS.hypoxia.value(t), pov = SCRIPT_TRACKS.pov.value(t);
    for (const which of ['right', 'left']) {
      const h = this[which], s = h.side, { a, b, w, name } = this._poseAt(which, t);
      const L = (u, v) => u + (v - u) * w;
      let x = L(a.p[0], b.p[0]) * s, y = L(a.p[1], b.p[1]), z = L(a.p[2], b.p[2]);
      // micro motion + breathing; a strong tremor when you look at your own hand late in the hypoxia
      const trem = name === 'look' ? 0.004 + hyp * 0.008 : 0.0012;
      const seed = which === 'right' ? 3 : 4;
      x += noise1(t * 9, seed) * trem + Math.sin(t * 1.3 + seed) * 0.0015;
      y += noise1(t * 8, seed + 2) * trem + Math.sin(t * 1.3 + seed + 1) * 0.002;
      h.g.position.set(x, y, z);
      this._orient(a.F, a.N, s, this._q);
      this._orient(b.F, b.N, s, this._q2);
      h.g.quaternion.slerpQuaternions(this._q, this._q2, w);
      h.g.rotateZ(noise1(t * 7, seed + 5) * trem * 3);
      // fingers: base joint takes most of the curl, the tips a little less
      h.fingers.forEach((joints, k) => {
        const c = L(a.curl[k], b.curl[k]) + noise1(t * 5 + k, seed + 9) * trem * 6;
        joints[0].rotation.x = c * 1.0; joints[1].rotation.x = c * 1.15; joints[2].rotation.x = c * 0.8;
      });
      const spread = L(a.thumb[0], b.thumb[0]), tc = L(a.thumb[1], b.thumb[1]);
      h.thumb[0].rotation.set(0.5 + tc * 0.3, 0, -s * spread);
      h.thumb[1].rotation.x = tc; h.thumb[2].rotation.x = tc * 0.9;
      h.g.visible = pov > 0.5 && y > -0.58;
    }
  }

  // world position of the right wrist (kept for HUD anchors)
  nozzleWorld(out) { this.right.g.updateWorldMatrix(true, false); return this.right.g.getWorldPosition(out); }
}
