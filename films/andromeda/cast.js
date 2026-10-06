/* =====================================================================
   CAST — the people at the lookout and in the park behind it. The shared
   adult rig (js/world/people.js) with actions for watching the sky:
   looking up, pointing up, filming with a phone held high, a hand to the
   mouth, hands on the head, arms wrapped round themselves.
   Reactions build: one notices, then several, phones up, newcomers walk
   up from the cars; fear at the passage; quiet awe at the end.
   ===================================================================== */

// [id, look, path [[t, x, z], …] (or a fixed spot), facing (deg, 0 = north), states [[t, action], …]]
const AM_PEOPLE = [
  ['A', 'casual6', [[0, -4.2, -2.45]], 4, [[0, 'idle'], [5.6, 'lookUp'], [7.6, 'pointUp'], [11.0, 'lookUp'], [15.8, 'phoneUp'], [30.2, 'lookUp'], [42.0, 'handMouth'], [47.5, 'lookUp'], [56.5, 'lookUp'], [66.0, 'hugSelf'], [73.0, 'lookUp']]],
  ['B', 'casual1', [[0, -3.4, -2.5]], -6, [[0, 'idle'], [6.6, 'lookUp'], [16.6, 'phoneUp'], [29.0, 'lookUp'], [42.6, 'handHead'], [49.0, 'lookUp'], [66.0, 'handHead'], [72.0, 'lookUp']]],
  ['C', 'casual5', [[0, 4.95, -1.25]], 12, [[0, 'phone'], [8.8, 'lookUp'], [14.0, 'lookUp'], [36.0, 'lookUp'], [43.0, 'recoil'], [44.4, 'lookUp']]],
  ['D', 'casual2', [[0, -2.2, 1.7]], 170, [[0, 'idle'], [10.5, 'lookUp'], [44.0, 'handMouth'], [50.0, 'lookUp'], [74.0, 'awe']]],
  // a jogger stops on the path; two come up from the parking lot; more later
  ['E', 'casual3', [[0, 9.0, 6.5], [9.5, 3.0, 2.6], [11.2, 2.2, 1.7]], null, [[0, 'jog'], [9.5, 'walk'], [11.2, 'lookUp'], [17.0, 'phoneUp'], [24.0, 'lookUp'], [43.0, 'handHead'], [48.0, 'lookUp']], 'face:6@11.2'],
  ['F', 'casual8', [[0, -0.6, 23.0], [22.0, -0.6, 23.0], [31.0, -0.9, 5.4], [33.5, -0.9, 3.1]], null, [[0, 'lookUp'], [22.0, 'walk'], [33.5, 'lookUp'], [44.0, 'handMouth'], [52.0, 'lookUp'], [74.0, 'awe']], 'face:170@33.5'],
  ['G', 'casual4', [[0, 1.2, 24.5], [23.5, 1.2, 24.5], [32.0, 0.9, 6.0], [34.5, 1.5, 3.9]], null, [[0, 'phone'], [23.5, 'walk'], [34.5, 'phoneUp'], [44.0, 'recoil'], [45.5, 'lookUp'], [66.0, 'pointUp'], [69.0, 'lookUp']], 'face:190@34.5'],
  // in the park behind you, under the galactic centre (seen when you turn south)
  ['H', 'casual7', [[0, -3.4, 9.5]], 175, [[0, 'lookUp'], [41.0, 'handHead'], [46.0, 'lookUp'], [52.0, 'pointUp'], [55.5, 'lookUp'], [74.0, 'awe']]],
  ['I', 'casual6', [[0, 3.6, 11.0]], 190, [[0, 'lookUp'], [42.0, 'hugSelf'], [58.0, 'lookUp']]],
];

(() => {
  const P0 = () => basePose();
  const arms = (p, l, r, le, re) => { p.lSh = l; p.rSh = r; p.lEl = le; p.rEl = re; };
  Object.assign(ACTIONS, {
    // head tipped back to the sky, weight back, arms loose; a slow sway
    lookUp(τ, c) {
      const p = ACTIONS.idle(τ, c), w = Math.sin(τ * 0.7 + c.seed * 6);
      p.neck = -0.82 + 0.06 * w; p.spine = -0.08; p.headYaw = 0.25 * noise1(τ * 0.25, c.seedI + 9);
      arms(p, [0.08, 0.1], [0.08, 0.1], 0.25, 0.25);
      return p;
    },
    pointUp(τ, c) {
      const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.5);
      p.rSh = [2.15 * k + 0.1, 0.18]; p.rEl = 0.12; p.neck = -0.7;
      p.lSh = [0.3, 0.15]; p.lEl = 0.5;
      return p;
    },
    // filming: phone held up in both hands at arm's length, tilted to the sky
    phoneUp(τ, c) {
      const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.6), w = 0.03 * Math.sin(τ * 1.3 + c.seed * 4);
      p.rSh = [1.85 * k + w, 0.25]; p.rEl = 0.55 * k; p.lSh = [1.8 * k - w, 0.3]; p.lEl = 0.62 * k; p.neck = -0.55;
      return p;
    },
    handMouth(τ, c) {
      const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.4);
      p.rSh = [1.15 * k, 0.35]; p.rEl = 2.15 * k; p.neck = -0.6;
      return p;
    },
    hugSelf(τ, c) {
      const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.6);
      p.lSh = [0.7 * k, -0.25 * k]; p.rSh = [0.7 * k, -0.25 * k]; p.lEl = 1.9 * k; p.rEl = 1.9 * k; p.spine = -0.02;
      return p;
    },
    awe(τ, c) {
      const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.8);
      p.lSh = [0.45 * k, 0.2]; p.rSh = [0.5 * k, 0.2]; p.lEl = 1.5 * k; p.rEl = 1.45 * k; p.neck = -0.7;
      return p;
    },
  });
  Object.assign(BLEND, { lookUp: 1.0, pointUp: 0.5, phoneUp: 0.7, handMouth: 0.45, hugSelf: 0.7, awe: 0.9 });
})();

class AmCast {
  constructor(scene) {
    this.people = AM_PEOPLE.map(([id, look, path, face, states, extra]) => {
      const spec = { id, look, path: path.map(([t, x, z]) => [t, x, z]), states, stride: 1.3 };
      if (face !== null) spec.face = face;
      // (walkers face along their path, then turn to the sky: the final facing is kept apart from spec.face)
      if (extra && extra.startsWith('face:')) { const [f, at] = extra.slice(5).split('@').map(Number); spec.faceTo = f; spec.faceFrom = at; }
      const p = new Person(spec, scene);
      // a phone in the right hand, its screen lit while filming
      const ph = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.15, 0.009), Mat.std('#1a1c20', { roughness: 0.3 }));
      ph.position.set(0, -0.07, 0.03); ph.rotation.x = -0.3; p.j.ra.hand.add(ph);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.135), new THREE.MeshBasicMaterial({ color: '#8fb6ff', transparent: true, opacity: 0 }));
      scr.position.z = -0.0055; scr.rotation.y = Math.PI; ph.add(scr);
      return { p, ph, scr, spec };
    });
    this.blobs = new BlobShadows(scene, this.people.length);
  }

  update(t) {
    this.blobs.begin();
    for (const q of this.people) {
      const P = q.p, S = q.spec;
      P.update(t);
      // (people who walk up turn from their path to the sky over half a second)
      if (S.faceFrom !== undefined && t > S.faceFrom) {
        const a = P.locate(S.faceFrom - 0.01).dir, b = Math.PI + MathX.deg(S.faceTo);
        let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        P.root.rotation.y = a + d * Ease.inOutSine(MathX.clamp((t - S.faceFrom) / 0.6, 0, 1));
      }
      P.root.position.y = ovH(P.root.position.x, P.root.position.z) * (Math.abs(P.root.position.x) < 8 && P.root.position.z < 5.4 && P.root.position.z > -3.2 ? 0 : 1);
      P.root.updateMatrixWorld(true);
      // the phone shows only when used; the screen glows while filming
      const st = this._state(S.states, t), using = st === 'phoneUp' || st === 'phone';
      q.ph.visible = using; q.scr.material.opacity = st === 'phoneUp' ? 0.95 : st === 'phone' ? 0.6 : 0;
      this.blobs.push(P.root.position.x, P.root.position.y + 0.02, P.root.position.z, 0.5, 0.5);
    }
    this.blobs.end();
  }
  _state(S, t) { let s = S[0][1]; for (const [a, n] of S) if (a <= t) s = n; return s; }
}
