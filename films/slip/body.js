/* =====================================================================
   YOUR BODY — the legs and shoes you see when you look down: walking, the
   right shoe landing on the wet plate and shooting forward, both legs in
   the air as you go down, then stretched out on the wet paving while you
   sit up. Jeans, dark sneakers with pale soles, the jacket's hem.
   Placed in the world under the camera every frame (they reflect in the
   puddles). Poses are keyframed (see SL_LEGS) and blended; walking is a
   gait cycle driven by the distance walked.
   ===================================================================== */

// [t, { hipY, hipZ (+ = behind the eye), lean (pelvis pitch), R: [hip flex, knee, ankle], L: [...] }] — angles in radians;
// hip flex + swings the leg forward, knee + bends it back, ankle + points the toe away from the shin (0 = foot at a right angle to the shin); 'walk' = the gait cycle
const SL_LEGS = [
  [0, 'walk'], [3.26, 'walk'],
  [3.3, { hipY: 0.93, hipZ: 0.12, lean: 0.0, R: [0.32, 0.05, 0.27], L: [-0.25, 0.35, -0.2] }],
  [3.42, { hipY: 0.86, hipZ: 0.02, lean: -0.15, R: [0.85, 0.05, 0.6], L: [0.05, 0.8, -0.5] }],
  [3.55, { hipY: 0.62, hipZ: -0.2, lean: -0.5, R: [1.5, 0.08, 0.55, 0.32], L: [0.85, 1.15, -0.1, 0.12] }],
  [3.66, { hipY: 0.42, hipZ: -0.38, lean: -0.8, R: [1.7, 0.15, 0.6, 0.36], L: [1.1, 1.2, 0.0, 0.14] }],
  [3.8, { hipY: 0.13, hipZ: -0.62, lean: -1.25, R: [1.45, 0.25, 0.3], L: [1.2, 0.9, 0.3] }],
  [4.0, { hipY: 0.12, hipZ: -0.66, lean: -1.4, R: [1.5, 0.15, 0.25], L: [1.25, 0.55, 0.25] }],
  [4.7, { hipY: 0.12, hipZ: -0.66, lean: -1.4, R: [1.5, 0.12, 0.25], L: [1.05, 1.1, 0.2] }],
  [5.9, { hipY: 0.12, hipZ: -0.4, lean: -0.15, R: [1.42, 0.35, 0.15], L: [1.25, 0.85, 0.1] }],
  [7.4, { hipY: 0.12, hipZ: -0.38, lean: -0.1, R: [1.4, 0.4, 0.15], L: [1.22, 0.9, 0.1] }],
];

class SlLegs {
  constructor(scene) {
    const jean = new THREE.MeshStandardMaterial({ color: '#2a3446', roughness: 0.85, flatShading: false });
    const shoe = new THREE.MeshStandardMaterial({ color: '#25211f', roughness: 0.55 });
    const sole = new THREE.MeshStandardMaterial({ color: '#d9d3c7', roughness: 0.7 });
    const jacket = new THREE.MeshStandardMaterial({ color: '#2b3038', roughness: 0.8 });
    this.root = new THREE.Group(); scene.add(this.root);
    this.pelvis = new THREE.Group(); this.root.add(this.pelvis);
    this.legs = {};
    for (const side of [1, -1]) {
      const hipJ = new THREE.Group(); hipJ.position.set(side * 0.1, -0.04, 0); this.pelvis.add(hipJ);
      const thigh = new THREE.Mesh(smoothLoft([[-0.46, 0.062, 0.066], [-0.3, 0.072, 0.078], [-0.1, 0.085, 0.09], [0.02, 0.088, 0.092]], 10), jean); hipJ.add(thigh);
      const knee = new THREE.Group(); knee.position.y = -0.44; hipJ.add(knee);
      const shin = new THREE.Mesh(smoothLoft([[-0.45, 0.052, 0.056], [-0.3, 0.056, 0.062], [-0.1, 0.064, 0.07], [0.02, 0.066, 0.072]], 10), jean); knee.add(shin);
      const ank = new THREE.Group(); ank.position.y = -0.44; knee.add(ank);
      // the sneaker: upper + toe cap + a pale sole (toe toward −Z)
      const up = new THREE.Mesh(smoothLoft([[-0.06, 0.05, 0.06, -0.02], [0.0, 0.052, 0.07, -0.05], [0.04, 0.05, 0.06, -0.06]], 10), shoe);
      up.rotation.x = 0; ank.add(up);
      const toe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.075, 0.2), shoe); toe.position.set(0, -0.045, -0.11); ank.add(toe);
      const toeR = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), shoe); toeR.scale.set(0.98, 0.72, 0.9); toeR.position.set(0, -0.05, -0.2); ank.add(toeR);
      const so = new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.028, 0.3), sole); so.position.set(0, -0.092, -0.085); ank.add(so);
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.09), sole); lace.position.set(0, -0.006, -0.09); lace.rotation.x = 0.35; ank.add(lace);
      this.legs[side > 0 ? 'R' : 'L'] = { hipJ, knee, ank };
    }
    this.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this._yaw = new THREE.Euler();
  }

  _gait(app, t) {
    const d = app.cam.walked(t), ph = d / 0.72 * Math.PI;   // a step every 0.72 m
    const g = (p) => ({ h: 0.38 * Math.sin(p), k: 0.15 + 0.55 * Math.max(0, Math.sin(p + 1.3)), a: 0.38 * Math.sin(p) - (0.15 + 0.55 * Math.max(0, Math.sin(p + 1.3))) + 0.2 * Math.sin(p - 0.8) });
    const r = g(ph), l = g(ph + Math.PI);
    return { hipY: 0.93 + 0.02 * Math.cos(ph * 2), hipZ: 0.12, lean: 0, R: [r.h, r.k, r.a], L: [l.h, l.k, l.a] };
  }

  _pose(app, t) {
    let i = 0; while (i + 1 < SL_LEGS.length && SL_LEGS[i + 1][0] <= t) i++;
    const [ta, A] = SL_LEGS[i], nx = SL_LEGS[i + 1];
    const a = A === 'walk' ? this._gait(app, t) : A;
    if (!nx) return a;
    const [tb, Bk] = nx, b = Bk === 'walk' ? this._gait(app, t) : Bk;
    const w = Ease.inOutSine(MathX.clamp((t - ta) / (tb - ta), 0, 1));
    const L = (u, v) => u + (v - u) * w;
    return { hipY: L(a.hipY, b.hipY), hipZ: L(a.hipZ, b.hipZ), lean: L(a.lean, b.lean), R: [0, 1, 2, 3].map((k) => L(a.R[k] || 0, b.R[k] || 0)), L: [0, 1, 2, 3].map((k) => L(a.L[k] || 0, b.L[k] || 0)) };
  }

  // the body follows the camera's ground position and its yaw (not the head's pitch)
  update(app, t, on) {
    this.root.visible = on; if (!on) return;
    const cam = app.camera, P = this._pose(app, t);
    const yaw = 0, c = 1, s = 0;      // (your body faces down the street; your head turns on its own)
    this.root.position.set(cam.position.x + s * P.hipZ, LAYOUT.curbH + P.hipY, cam.position.z + c * P.hipZ);
    this.root.rotation.set(0, yaw, 0);
    this.pelvis.rotation.set(P.lean, 0, 0);
    for (const k of ['R', 'L']) {
      const leg = this.legs[k], q = P[k];
      leg.hipJ.rotation.x = q[0] - P.lean; leg.knee.rotation.x = -q[1]; leg.ank.rotation.x = -q[2];
      leg.hipJ.rotation.z = (k === 'R' ? -1 : 1) * (q[3] || 0.04);
    }
    this.root.updateMatrixWorld(true);
  }
}
