/* =====================================================================
   CAST — the people around you, for scale and reaction. Curiosity at
   first (one stops and looks up, then a crowd at the railing with phones),
   concern as the harbour drains, panic when the surge comes (everyone runs
   inland, wading), people stumbling in the tremors, and at the end a few
   silhouettes at the hilltop railing who brace as the light comes.
   Everything runs on story time S (so the rewind plays them backwards).
   Each person shows only in their scene's window [s0, s1].
   ===================================================================== */

// [id, look, window [s0, s1], path [[S, x, z]…] (or one spot), facing (deg, 0 = south/sea, 180 = inland; null = along the path),
//  states [[S, action]…], extra { y: height above the ground (a van roof), stride }]
const MN_PEOPLE = [
  // the cold open: in the flooded street, wading inland, one filming, one pulling another
  ['C1', 'casual3', [0, 52], [[49.5, 3.6, 49], [51.6, 3.9, 53]], 175, [[0, 'wade']]],
  ['C2', 'casual6', [0, 52], [[49.5, -4.5, 44], [51.6, -4.0, 47.5]], 170, [[0, 'wade']]],
  ['C3', 'casual1', [0, 52], [[0, -2.2, 54.5]], 10, [[0, 'phoneUp']]],
  ['C4', 'casual8', [0, 52], [[49.5, 6.5, 40], [51.6, 6.2, 44.5]], 185, [[0, 'wade']]],
  // evening on the main street: strollers heading for the sea; one stops and looks up, then points
  ['E1', 'casual2', [5.5, 13.2], [[5.6, 8.6, 70], [13, 8.6, 58]], null, [[5.6, 'walk'], [9.4, 'lookUp'], [10.6, 'pointUp']], { stopAt: 9.4 }],
  ['E2', 'casual5', [5.5, 13.2], [[5.6, 9.4, 70.8], [9.6, 9.4, 64.6], [13, 9.4, 64.6]], null, [[5.6, 'walk'], [9.6, 'lookUp']]],
  ['E3', 'casual7', [5.5, 13.2], [[5.6, -9.2, 44], [13, -9.2, 60]], null, [[5.6, 'walk'], [11.0, 'lookUp']]],
  ['E4', 'casual4', [5.5, 13.2], [[0, 10.4, 55]], 0, [[5.6, 'phone'], [11.6, 'lookUp']]],
  // the promenade: people at the railing, more arriving; phones up; the harbour drains; they run
  ['P1', 'casual1', [13, 34], [[13, 0.8, -18.9], [31.9, 0.8, -18.9], [34, 2.5, 4]], 0, [[13, 'idle'], [15.2, 'lookDown'], [17.6, 'handHead'], [19.4, 'lookDown'], [22, 'lookUp'], [31.9, 'jog']]],
  ['P2', 'casual6', [13, 34], [[13, -8.5, -8], [16.0, -6.2, -18.7], [31.8, -6.2, -18.7], [34, -5.5, 6]], null, [[13, 'walk'], [16.0, 'lookDown'], [21, 'phoneUp'], [31.8, 'jog']], { faceTo: 0, faceAt: 16.0 }],
  ['P3', 'casual8', [13, 34], [[13, -10.6, -18.8], [32.1, -10.6, -18.8], [34, -9, 3]], 0, [[13, 'idle'], [14.5, 'lookUp'], [16.4, 'pointUp'], [18.8, 'handMouth'], [22.5, 'phoneUp'], [32.1, 'jog']]],
  ['P4', 'casual3', [13, 34], [[13, -12.0, -18.6], [32.0, -12.0, -18.6], [34, -11, 4]], 5, [[13, 'idle'], [17.0, 'lookDown'], [22.0, 'lookUp'], [26, 'handHead'], [32.0, 'jog']]],
  ['P5', 'casual5', [13, 34], [[13, 6, 2], [22.5, 4.2, -18.6], [31.7, 4.2, -18.6], [34, 5, 8]], null, [[13, 'walk'], [22.5, 'phoneUp'], [31.7, 'jog']], { faceTo: -10, faceAt: 22.5 }],
  ['P6', 'casual2', [13, 34], [[13, 14, 6], [21.8, 7.0, -18.5], [31.6, 7.0, -18.5], [34, 7, 6]], null, [[13, 'walk'], [21.8, 'lookUp'], [25.5, 'pointUp'], [27.5, 'lookUp'], [31.6, 'jog']], { faceTo: -15, faceAt: 21.8 }],
  ['P7', 'casual7', [13, 34], [[13, -20, 4], [24.5, -15.5, -18.4], [31.9, -15.5, -18.4], [34, -14, 4]], null, [[13, 'walk'], [24.5, 'phoneUp'], [31.9, 'jog']], { faceTo: 8, faceAt: 24.5 }],
  ['P8', 'casual4', [13, 34], [[13, -1.5, -6], [26.0, -1.6, -18.2], [31.5, -1.6, -18.2], [34, -1, 7]], null, [[13, 'walk'], [26.0, 'lookUp'], [31.5, 'jog']], { faceTo: 0, faceAt: 26.0 }],
  // the run inland: people ahead and beside you, wading
  ['R1', 'casual5', [33.4, 39.2], [[33.4, 4.5, -12], [39.2, 5.5, 26]], null, [[33.4, 'jog'], [35.0, 'wade']]],
  ['R2', 'casual2', [33.4, 39.2], [[33.4, -6, -8], [39.2, -7, 30]], null, [[33.4, 'jog'], [34.8, 'wade']]],
  ['R3', 'casual1', [33.4, 39.2], [[33.4, 1.5, -4], [39.2, 2.6, 34]], null, [[33.4, 'jog'], [35.4, 'wade']]],
  ['R4', 'casual8', [33.4, 39.2], [[33.4, -3.5, 2], [39.2, -4.5, 38]], null, [[33.4, 'jog']]],
  // up the street: someone filming from a van roof against the Moon; others fleeing uphill; the tremor
  ['U1', 'casual3', [39, 55.2], [[0, 1.2, 95.6]], 8, [[39, 'phoneUp'], [48.3, 'stumble'], [49.6, 'brace'], [52, 'lookUp']], { y: 2.36 }],
  ['U2', 'casual6', [39, 55.2], [[0, 4.8, 90]], 5, [[39, 'lookUp'], [43, 'handMouth'], [48.2, 'stumble'], [49.5, 'brace'], [52.5, 'jog']]],
  ['U3', 'casual7', [39, 55.2], [[39, -2.0, 72], [47, -0.5, 104], [55.2, 0.5, 132]], null, [[39, 'jog'], [48.2, 'stumble'], [49.4, 'jog']]],
  ['U4', 'casual4', [39, 55.2], [[39, 6.5, 66], [48, 5.5, 101], [55.2, 4.5, 128]], null, [[39, 'jog'], [48.4, 'stumble'], [49.6, 'jog']]],
  ['U5', 'casual1', [39, 55.2], [[0, 9.6, 95]], 20, [[39, 'lookUp'], [48.3, 'brace']]],
  // the climb: people running uphill ahead of you
  ['H1', 'casual5', [55, 63.2], [[55, 2.5, 128], [63.2, 2.5, 196]], null, [[55, 'jog']]],
  ['H2', 'casual8', [55, 63.2], [[55, -4.5, 120], [63.2, -4.0, 186]], null, [[55, 'jog']]],
  ['H3', 'casual2', [55, 63.2], [[55, 5.5, 112], [63.2, 5.0, 182]], null, [[55, 'jog']]],
  ['H4', 'casual7', [55, 63.2], [[55, 0.5, 104], [63.2, 1.0, 176]], null, [[55, 'jog']]],
  ['H5', 'casual1', [55, 63.2], [[0, 7.8, 140]], 10, [[55, 'lookUp'], [57.2, 'handHead']]],
  // the hilltop: silhouettes at the railing, looking out at it; they brace as the light comes
  ['T1', 'casual1', [63, 80], [[0, -3.2, 335.2]], 0, [[63, 'lookUp'], [67, 'phoneUp'], [72.6, 'brace']]],
  ['T2', 'casual6', [63, 80], [[0, 2.6, 335.1]], -6, [[63, 'lookUp'], [69, 'handMouth'], [72.8, 'brace']]],
  ['T3', 'casual3', [63, 80], [[0, 4.0, 335.6]], 8, [[63, 'lookUp'], [70, 'hugSelf'], [73.0, 'brace']]],
  ['T4', 'casual7', [63, 80], [[0, -6.5, 335.4]], -4, [[63, 'pointUp'], [65.5, 'lookUp'], [72.4, 'brace']]],
  ['T5', 'casual4', [63, 80], [[0, 9.5, 336.5]], 12, [[63, 'lookUp'], [72.9, 'brace']]],
];

(() => {
  const arms = (p, l, r, le, re) => { p.lSh = l; p.rSh = r; p.lEl = le; p.rEl = re; };
  Object.assign(ACTIONS, {
    lookUp(τ, c) { const p = ACTIONS.idle(τ, c), w = Math.sin(τ * 0.7 + c.seed * 6); p.neck = -0.75 + 0.06 * w; p.spine = -0.07; p.headYaw = 0.2 * noise1(τ * 0.25, c.seedI + 9); arms(p, [0.08, 0.1], [0.08, 0.1], 0.25, 0.25); return p; },
    lookDown(τ, c) { const p = ACTIONS.idle(τ, c); p.neck = 0.45; p.spine = 0.12; arms(p, [0.35, 0.1], [0.35, 0.1], 0.9, 0.9); return p; },
    pointUp(τ, c) { const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.5); p.rSh = [2.0 * k + 0.1, 0.18]; p.rEl = 0.12; p.neck = -0.6; p.lSh = [0.3, 0.15]; p.lEl = 0.5; return p; },
    phoneUp(τ, c) { const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.6), w = 0.03 * Math.sin(τ * 1.3 + c.seed * 4); p.rSh = [1.75 * k + w, 0.25]; p.rEl = 0.55 * k; p.lSh = [1.7 * k - w, 0.3]; p.lEl = 0.62 * k; p.neck = -0.45; return p; },
    handMouth(τ, c) { const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.4); p.rSh = [1.15 * k, 0.35]; p.rEl = 2.15 * k; p.neck = -0.5; return p; },
    hugSelf(τ, c) { const p = ACTIONS.lookUp(τ, c), k = Math.min(1, τ / 0.6); p.lSh = [0.7 * k, -0.25 * k]; p.rSh = [0.7 * k, -0.25 * k]; p.lEl = 1.9 * k; p.rEl = 1.9 * k; return p; },
    // wading: slow, high steps, arms out for balance
    wade(τ, c) { const p = ACTIONS.walk(τ, c); p.lSh = [0.5, 0.55]; p.rSh = [0.5, 0.55]; p.lEl = 0.6; p.rEl = 0.6; p.spine = 0.18; p.lHip[0] *= 1.4; p.rHip[0] *= 1.4; return p; },
    // bracing: knees bent, arms over the head
    brace(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.35); p.spine = 0.5 * k; p.neck = 0.4 * k; p.lSh = [2.6 * k, 0.4]; p.rSh = [2.6 * k, 0.4]; p.lEl = 2.0 * k; p.rEl = 2.0 * k;
      p.lHip = [0.7 * k, 0.1]; p.rHip = [0.7 * k, 0.1]; p.lKnee = 1.2 * k; p.rKnee = 1.2 * k; p.hipY -= 0.28 * k; return p; },
  });
  Object.assign(BLEND, { lookUp: 1.0, lookDown: 0.8, pointUp: 0.5, phoneUp: 0.7, handMouth: 0.45, hugSelf: 0.7, wade: 0.5, brace: 0.3 });
})();

class MnCast {
  constructor(scene) {
    this.people = MN_PEOPLE.map(([id, look, win, path, face, states, extra = {}]) => {
      const spec = { id, look, path: path.map(([t, x, z]) => [t, x, z]), states, stride: extra.stride || (states.some((s) => s[1] === 'jog') ? 1.9 : 1.3) };
      if (face !== null) spec.face = face;
      const p = new Person(spec, scene);
      const ph = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.15, 0.009), Mat.std('#1a1c20', { roughness: 0.3 }));
      ph.position.set(0, -0.07, 0.03); ph.rotation.x = -0.3; p.j.ra.hand.add(ph);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.135), new THREE.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0 }));
      scr.position.z = -0.0055; scr.rotation.y = Math.PI; ph.add(scr);
      p.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return { p, ph, scr, spec, win, extra };
    });
    this.blobs = new BlobShadows(scene, this.people.length);
  }

  update(S) {
    this.blobs.begin();
    for (const q of this.people) {
      const P = q.p, on = S >= q.win[0] && S <= q.win[1];
      P.root.visible = on;
      if (!on) continue;
      P.update(S);
      // (people with a set facing still run or wade along their path)
      const st0 = this._state(q.spec.states, S);
      if (q.spec.face !== undefined && (st0 === 'jog' || st0 === 'walk' || st0 === 'wade')) { const d = this._pathDir(q.spec.path, S); if (d !== null) P.root.rotation.y = d; }
      // walkers who arrive turn to face the sea (or the Moon)
      if (q.extra.faceAt !== undefined && S > q.extra.faceAt) {
        const a = P.locate(q.extra.faceAt - 0.01).dir, b = Math.PI + MathX.deg(q.extra.faceTo);
        let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        const st = this._state(q.spec.states, S);
        if (st !== 'jog' && st !== 'walk') P.root.rotation.y = a + d * Ease.inOutSine(MathX.clamp((S - q.extra.faceAt) / 0.6, 0, 1));
      }
      const x = P.root.position.x, z = P.root.position.z;
      const walk = Math.abs(x) > MN_CITY.street.half && z > MN_CITY.walkZ[0] ? 0.14 : 0;
      P.root.position.y = mnGround(x, z) + walk + (q.extra.y || 0);
      P.root.updateMatrixWorld(true);
      const st = this._state(q.spec.states, S), using = st === 'phoneUp' || st === 'phone';
      q.ph.visible = using; q.scr.material.opacity = st === 'phoneUp' ? 0.95 : st === 'phone' ? 0.6 : 0;
      if (!q.extra.y) this.blobs.push(x, P.root.position.y + 0.02, z, 0.5, 0.5);
    }
    this.blobs.end();
  }
  _pathDir(P, S) {
    for (let i = 1; i < P.length; i++) if (S <= P[i][0] || i === P.length - 1) { const dx = P[i][1] - P[i - 1][1], dz = P[i][2] - P[i - 1][2]; return Math.hypot(dx, dz) > 1e-3 ? Math.atan2(dx, dz) : null; }
    return null;
  }
  _state(S, t) { let s = S[0][1]; for (const [a, n] of S) if (a <= t) s = n; return s; }
}
