/* =====================================================================
   VIEWER HANDS — the viewer's own forearms and hands, attached to the
   camera. Poses come from SCRIPT.hands:
     hidden · ear (hands jerk up to the ears when they pop) ·
     lighter (right hand clicks a piezo lighter: blue spark, no flame) ·
     tremble (late hypoxia: you look at your own shaking hand)
   ===================================================================== */

const HAND_POSES = {
  // [x, y, z] in camera space, [rx, ry, rz]
  right: {
    hidden:  { p: [0.22, -0.62, -0.32], r: [0.4, 0, 0.3] },
    ear:     { p: [0.2, 0.02, 0.05], r: [0.2, -0.4, 0.7] },
    lighter: { p: [0.095, -0.175, -0.44], r: [0.2, -0.6, 0.12] },
    tremble: { p: [0.06, -0.12, -0.34], r: [-0.2, -0.3, -0.1] },
  },
  left: {
    hidden:  { p: [-0.22, -0.62, -0.32], r: [0.4, 0, -0.3] },
    ear:     { p: [-0.2, 0.02, 0.05], r: [0.2, 0.4, -0.7] },
    lighter: { p: [-0.06, -0.15, -0.35], r: [0.1, 0.4, -0.1] },
    tremble: { p: [-0.095, -0.165, -0.5], r: [-0.45, 0.7, 0.3] },
  },
};
const HAND_BLEND = { hidden: 0.32, ear: 0.13, lighter: 0.3, tremble: 0.7 };

class ViewerHands {
  constructor(camera) {
    this.camera = camera;
    this.root = new THREE.Group();
    this.root.name = 'viewerHands';
    camera.add(this.root);
    const skin = Mat.std('#8f725f', { roughness: 0.78 });
    const sleeve = Mat.std('#252b33', { roughness: 0.92 });
    const cuff = Mat.std('#1d2228', { roughness: 0.92 });
    this.right = this._fist(skin, sleeve, cuff, 1);
    this.left = this._open(skin, sleeve, cuff, -1);
    this.right.g.scale.setScalar(0.8);
    this.left.g.scale.setScalar(0.8);
    this.root.add(this.right.g, this.left.g);
    this._v = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
  }

  _merge(parts, mat) {
    const m = new THREE.Mesh(THREE.mergeGeometries(parts.map((g) => Geo.prep(g))), mat);
    m.frustumCulled = false;
    return m;
  }

  _arm(side, sleeve, cuff) {
    const fa = new THREE.CapsuleGeometry(0.032, 0.3, 4, 10);
    fa.applyMatrix4(Geo.matrix(side * 0.075, -0.19, 0.06, -0.35, 0, side * 0.42));
    const cf = new THREE.CylinderGeometry(0.047, 0.05, 0.07, 14);
    cf.applyMatrix4(Geo.matrix(side * 0.022, -0.05, 0.015, -0.35, 0, side * 0.42));
    return [this._merge([fa], sleeve), this._merge([cf], cuff)];
  }

  // right hand: a fist holding a lighter, thumb on the button
  _fist(skin, sleeve, cuff, side) {
    const g = new THREE.Group();
    const [arm, c] = this._arm(side, sleeve, cuff);
    const parts = [];
    const fist = new THREE.RoundedBoxGeometry(0.078, 0.092, 0.062, 3, 0.024); fist.translate(0, 0.045, 0); parts.push(fist);
    for (let i = 0; i < 4; i++) {
      const k = new THREE.CapsuleGeometry(0.0125, 0.05, 3, 8);
      k.applyMatrix4(Geo.matrix(0.004, 0.078 - i * 0.021, -0.031, 0, 0, Math.PI / 2));
      parts.push(k);
    }
    const hand = this._merge(parts, skin);
    // thumb (animated)
    const thumb = new THREE.Group();
    thumb.position.set(-side * 0.03, 0.08, -0.004);
    const tm = new THREE.Mesh(new THREE.CapsuleGeometry(0.0125, 0.042, 3, 8), skin);
    tm.position.set(side * 0.012, 0.022, 0); tm.rotation.z = -side * 0.7;
    tm.frustumCulled = false;
    thumb.add(tm);
    // lighter
    const lighter = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.074, 0.014), Mat.std('#3f5f78', { roughness: 0.45 }));
    body.position.set(0.004, 0.105, -0.004);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.018, 0.014), Mat.std('#b9bfc6', { roughness: 0.25, metalness: 0.9 }));
    head.position.set(0.004, 0.151, -0.004);
    const btn = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.008, 0.012), Mat.std('#c4281c', { roughness: 0.4 }));
    btn.position.set(-0.002, 0.142, -0.004);
    for (const o of [body, head, btn]) { o.frustumCulled = false; lighter.add(o); }
    this.nozzle = new THREE.Object3D(); this.nozzle.position.set(0.01, 0.163, -0.004); lighter.add(this.nozzle);
    g.add(arm, c, hand, thumb, lighter);
    return { g, thumb, lighter, side };
  }

  // left hand: open, fingers slightly spread and curled, two segments each, visible thumb
  _open(skin, sleeve, cuff, side) {
    const g = new THREE.Group();
    const [arm, c] = this._arm(side, sleeve, cuff);
    const parts = [];
    const palm = new THREE.RoundedBoxGeometry(0.076, 0.084, 0.022, 3, 0.01); palm.translate(0, 0.046, 0); parts.push(palm);
    // [x at knuckle, proximal length, distal length, spread angle]
    const fingers = [[-0.027, 0.03, 0.026, 0.12], [-0.009, 0.034, 0.03, 0.04], [0.009, 0.033, 0.028, -0.03], [0.027, 0.026, 0.022, -0.12]];
    for (const [fx, l1, l2, spread] of fingers) {
      const x = fx * -side, sp = spread * -side;
      const p1 = new THREE.CapsuleGeometry(0.0092, l1, 3, 8);
      p1.applyMatrix4(Geo.matrix(x + Math.sin(-sp) * l1 / 2, 0.09 + Math.cos(sp) * l1 / 2, -0.004, 0.18, 0, sp));
      parts.push(p1);
      const bx = x + Math.sin(-sp) * l1, by = 0.09 + Math.cos(sp) * l1;
      const p2 = new THREE.CapsuleGeometry(0.0085, l2, 3, 8);
      p2.applyMatrix4(Geo.matrix(bx + Math.sin(-sp) * l2 / 2, by + Math.cos(sp) * l2 / 2 - 0.002, -0.012, 0.42, 0, sp));
      parts.push(p2);
    }
    const t1 = new THREE.CapsuleGeometry(0.0115, 0.03, 3, 8);
    t1.applyMatrix4(Geo.matrix(side * 0.042, 0.03, -0.006, 0.3, 0.2 * side, side * 0.75));
    const t2 = new THREE.CapsuleGeometry(0.0105, 0.026, 3, 8);
    t2.applyMatrix4(Geo.matrix(side * 0.062, 0.058, -0.014, 0.4, 0.2 * side, side * 0.35));
    parts.push(t1, t2);
    g.add(arm, c, this._merge(parts, skin));
    return { g, side };
  }

  _poseAt(which, t) {
    const S = SCRIPT.hands[which], P = HAND_POSES[which];
    let i = 0;
    while (i + 1 < S.length && S[i + 1][0] <= t) i++;
    const cur = P[S[i][1]];
    const blend = HAND_BLEND[S[i][1]] || 0.3;
    if (i > 0 && t - S[i][0] < blend) {
      const prev = P[S[i - 1][1]];
      const w = Ease.inOutSine((t - S[i][0]) / blend);
      return { p: prev.p.map((v, k) => v + (cur.p[k] - v) * w), r: prev.r.map((v, k) => v + (cur.r[k] - v) * w), name: S[i][1] };
    }
    return { p: cur.p, r: cur.r, name: S[i][1] };
  }

  update(t) {
    const hyp = SCRIPT_TRACKS.hypoxia.value(t);
    for (const which of ['right', 'left']) {
      const h = this[which], pose = this._poseAt(which, t);
      let [x, y, z] = pose.p, [rx, ry, rz] = pose.r;
      // natural micro motion + breathing; strong tremor when hypoxic
      const trem = (pose.name === 'tremble' ? 0.006 + hyp * 0.01 : 0.0015);
      x += noise1(t * 9, which === 'right' ? 3 : 4) * trem + Math.sin(t * 1.4) * 0.002;
      y += noise1(t * 8, which === 'right' ? 5 : 6) * trem + Math.sin(t * 1.4 + 1) * 0.003;
      rz += noise1(t * 7, 7) * trem * 4;
      h.g.position.set(x, y, z);
      h.g.rotation.set(rx, ry, rz);
      h.g.visible = y > -0.6;
    }
    // lighter only exists while the right hand holds it; thumb presses on each click
    const r = this.right;
    const holding = this._poseAt('right', t).name === 'lighter';
    r.lighter.visible = holding || (t > 3.2 && t < 5.6);
    let press = 0;
    for (const f of SCRIPT.hands.flicks) press = Math.max(press, MathX.window(t, f - 0.12, f + 0.06, 0.1, 0.06));
    r.thumb.rotation.z = -0.45 * press;
    r.thumb.position.y = 0.08 - 0.008 * press;
  }

  nozzleWorld(out) { this.nozzle.updateWorldMatrix(true, false); return this.nozzle.getWorldPosition(out); }
}
