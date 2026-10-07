/* =====================================================================
   CAST — the people around you (shared Person rig, js/world/people.js).
   In the rain: umbrellas, walking past; one stops and looks when you fall.
   The quake: people stumble, kneel, brace against a wall, run across the
   road. The seafront: a crowd at the railing (phones up), two walk down
   onto the drained seabed, then everyone runs inland; people run ahead of
   you up the avenue. Each person shows only in their window [t0, t1].
   ===================================================================== */

// [id, look, window [t0, t1], path [[t, x, z]…] (or one spot), facing (deg, 0 = toward the sea / −Z, 180 = inland; null = along
//  the path), states [[t, action]…], extra { umb: umbrella colour, faceAt, faceTo, dropUmb }]
const SL_PEOPLE = [
  // the rain, before you fall
  ['W1', 'casual8', [0, 7.4], [[0, 11.0, -15], [3.9, 11.0, -7.2], [7.4, 11.0, -7.2]], null, [[0, 'walkUmb'], [3.9, 'lookUmb']], { umb: '#1d2a3a', faceAt: 3.9, faceTo: 180 }],
  ['W2', 'casual1', [0, 7.4], [[0, 10.3, -1.5], [7.4, 10.5, -11.5]], null, [[0, 'walkUmb']], { umb: '#6a2622' }],
  ['W3', 'casual6', [0, 7.4], [[0, -10.6, -32], [7.4, -10.6, -22]], null, [[0, 'walkUmb']], { umb: '#2c463a' }],
  ['W4', 'casual5', [0, 7.4], [[0, -11.0, -3], [7.4, -11.0, -13]], null, [[0, 'walk']], {}],
  ['W5', 'casual2', [0, 7.4], [[0, -9.7, -50], [7.4, -9.7, -42]], null, [[0, 'walkUmb']], { umb: '#202224' }],
  ['W6', 'casual7', [0, 7.4], [[0, 9.9, -36], [7.4, 9.9, -27.5]], null, [[0, 'walkUmb']], { umb: '#cfc6b4' }],
  // the earthquake
  ['Q1', 'casual8', [24.6, 32], [[24.6, 10.9, -5.6]], 175, [[24.6, 'stumble'], [25.5, 'kneel']], { umb: '#8a2a24', dropUmb: 25.0 }],
  ['Q2', 'casual1', [24.6, 32], [[24.6, 10.3, -12.5], [25.4, 10.8, -11.2], [32, 10.8, -11.2]], null, [[24.6, 'jog'], [25.4, 'stumble'], [26.0, 'collapse']], {}],
  ['Q3', 'casual6', [24.6, 32], [[24.6, -11.4, -8.5]], 95, [[24.6, 'stumble'], [25.6, 'lean']], {}],
  ['Q4', 'casual5', [24.6, 32], [[24.6, -3.5, -16], [26.2, -6.5, -20], [27.2, -7.2, -21], [32, -10.6, -27]], null, [[24.6, 'jog'], [26.2, 'stumble'], [27.2, 'jog']], {}],
  ['Q5', 'casual2', [24.6, 32], [[24.6, -10.4, -31]], 10, [[24.6, 'stumble'], [25.3, 'kneel']], {}],
  ['Q6', 'casual7', [24.6, 32], [[24.6, 9.6, -24], [27, 9.4, -20], [32, 9.4, -20]], null, [[24.6, 'jog'], [27, 'brace']], {}],
  // the seafront: at the railing; phones up as the sea draws back; they run when the line appears
  ['P1', 'casual1', [39.2, 53.4], [[39.2, -3.4, -351.05], [50.9, -3.4, -351.05], [53.4, -1.5, -334]], 0, [[39.2, 'idle'], [40.6, 'lookDown'], [43.2, 'phoneUp'], [50.9, 'jog']], {}],
  ['P2', 'casual6', [39.2, 53.4], [[39.2, 5.8, -351.1], [50.6, 5.8, -351.1], [53.4, 4.5, -333]], -6, [[39.2, 'phoneUp'], [46.6, 'handMouth'], [50.6, 'jog']], {}],
  ['P3', 'casual8', [39.2, 53.4], [[39.2, -7.6, -351.0], [50.4, -7.6, -351.0], [53.4, -6, -332]], 4, [[39.2, 'lookDown'], [42.0, 'pointUp'], [44.5, 'phoneUp'], [50.4, 'jog']], {}],
  ['P4', 'casual3', [39.2, 53.4], [[39.2, 9.6, -351.0], [51.2, 9.6, -351.0], [53.4, 8, -337]], 8, [[39.2, 'idle'], [41.4, 'lookDown'], [47.0, 'handHead'], [51.2, 'jog']], {}],
  ['P5', 'casual2', [39.2, 53.4], [[39.2, -12.5, -350.9], [50.7, -12.5, -350.9], [53.4, -10, -333]], 0, [[39.2, 'lookDown'], [45.2, 'phoneUp'], [50.7, 'jog']], {}],
  ['P6', 'casual5', [39.2, 53.4], [[39.2, 14.0, -346], [41.6, 13.0, -350.9], [50.5, 13.0, -350.9], [53.4, 11, -334]], null, [[39.2, 'walk'], [41.6, 'lookDown'], [46.2, 'pointUp'], [50.5, 'jog']], { faceAt: 41.6, faceTo: -8 }],
  ['P7', 'casual7', [39.2, 53.4], [[39.2, -18.0, -351.0], [50.3, -18.0, -351.0], [53.4, -15, -334]], 6, [[39.2, 'phoneUp'], [50.3, 'jog']], {}],
  ['P8', 'casual4', [39.2, 53.4], [[39.2, 2.2, -347.2], [51.5, 2.2, -347.2], [53.4, 3.5, -336]], 2, [[39.2, 'lookDown'], [44.0, 'hugSelf'], [51.5, 'jog']], {}],
  // two who walk down the steps onto the seabed to look; they turn and run when the line appears
  ['B1', 'casual3', [39.2, 52.6], [[39.2, 31.6, -352.4], [40.2, 31.8, -355.6], [43.0, 16, -381], [46.2, 16, -381], [46.7, 16, -381], [52.6, 28, -357]], null, [[39.2, 'walk'], [46.2, 'lookUp'], [46.7, 'jog']], {}],
  ['B2', 'casual7', [39.2, 52.6], [[39.2, 33.2, -352.8], [40.4, 33.0, -355.8], [43.0, 21, -385], [46.2, 21, -385], [46.8, 21, -385], [52.6, 31.0, -360]], null, [[39.2, 'walk'], [46.2, 'pointUp'], [46.8, 'jog']], {}],
  // running inland up the avenue, ahead of and beside you
  ['R1', 'casual5', [52.4, 60.6], [[52.4, -2.5, -341], [60.6, -1.5, -282]], null, [[52.4, 'jog']], {}],
  ['R2', 'casual2', [52.4, 60.6], [[52.4, 4.5, -339], [60.6, 5.0, -287]], null, [[52.4, 'jog']], {}],
  ['R3', 'casual8', [52.4, 60.6], [[52.4, -5.5, -336], [60.6, -6.0, -278]], null, [[52.4, 'jog']], {}],
  ['R4', 'casual1', [52.4, 60.6], [[52.4, 1.0, -333], [60.6, 1.5, -274]], null, [[52.4, 'jog']], {}],
  ['R5', 'casual6', [52.4, 60.6], [[52.4, 9.6, -344], [60.6, 9.8, -296]], null, [[52.4, 'jog']], {}],
  ['R6', 'casual4', [52.4, 60.6], [[52.4, -9.8, -342], [60.6, -9.6, -292]], null, [[52.4, 'jog']], {}],
  ['L1', 'casual2', [52.4, 60.6], [[52.4, 6.0, -351.5], [60.6, 3.0, -312]], null, [[52.4, 'jog']], {}],
  ['L2', 'casual7', [52.4, 60.6], [[52.4, -4.0, -352.0], [60.6, -2.5, -316]], null, [[52.4, 'jog']], {}],
  ['L3', 'casual3', [52.4, 60.6], [[52.4, 16.0, -350.5], [60.6, 7.0, -318]], null, [[52.4, 'jog']], {}],
];

(() => {
  const arms = (p, l, r, le, re) => { p.lSh = l; p.rSh = r; p.lEl = le; p.rEl = re; };
  Object.assign(ACTIONS, {
    lookUp(τ, c) { const p = ACTIONS.idle(τ, c), w = Math.sin(τ * 0.7 + c.seed * 6); p.neck = -0.65 + 0.06 * w; p.spine = -0.07; p.headYaw = 0.2 * noise1(τ * 0.25, c.seedI + 9); arms(p, [0.08, 0.1], [0.08, 0.1], 0.25, 0.25); return p; },
    lookDown(τ, c) { const p = ACTIONS.idle(τ, c); p.neck = 0.45; p.spine = 0.12; arms(p, [0.35, 0.1], [0.35, 0.1], 0.9, 0.9); return p; },
    pointUp(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.5); p.rSh = [1.45 * k + 0.1, 0.18]; p.rEl = 0.12; p.neck = -0.1; p.lSh = [0.3, 0.15]; p.lEl = 0.5; return p; },
    phoneUp(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.6), w = 0.03 * Math.sin(τ * 1.3 + c.seed * 4); p.rSh = [1.45 * k + w, 0.25]; p.rEl = 0.65 * k; p.lSh = [1.4 * k - w, 0.3]; p.lEl = 0.72 * k; p.neck = -0.1; return p; },
    handMouth(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.4); p.rSh = [1.15 * k, 0.35]; p.rEl = 2.15 * k; p.neck = -0.2; return p; },
    hugSelf(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.6); p.lSh = [0.7 * k, -0.25 * k]; p.rSh = [0.7 * k, -0.25 * k]; p.lEl = 1.9 * k; p.rEl = 1.9 * k; return p; },
    brace(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.35); p.spine = 0.5 * k; p.neck = 0.4 * k; p.lSh = [2.6 * k, 0.4]; p.rSh = [2.6 * k, 0.4]; p.lEl = 2.0 * k; p.rEl = 2.0 * k;
      p.lHip = [0.7 * k, 0.1]; p.rHip = [0.7 * k, 0.1]; p.lKnee = 1.2 * k; p.rKnee = 1.2 * k; p.hipY -= 0.28 * k; return p; },
    // holding an umbrella in the right hand
    walkUmb(τ, c) { const p = ACTIONS.walk(τ, c); p.rSh = [0.75, 0.2]; p.rEl = 1.55; return p; },
    lookUmb(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [0.75, 0.2]; p.rEl = 1.55; p.neck = 0.2; p.headYaw = 0.15; return p; },
  });
  Object.assign(BLEND, { lookUp: 0.9, lookDown: 0.8, pointUp: 0.5, phoneUp: 0.7, handMouth: 0.45, hugSelf: 0.7, brace: 0.3, walkUmb: 0.4, lookUmb: 0.6 });
})();

class SlCast {
  constructor(scene) {
    this.people = SL_PEOPLE.map(([id, look, win, path, face, states, extra = {}]) => {
      const spec = { id, look, path: path.map(([t, x, z]) => [t, x, z]), states, stride: states.some((s) => s[1] === 'jog') ? 1.9 : 1.3 };
      if (face !== null) spec.face = face;
      const p = new Person(spec, scene);
      p.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      let umb = null;
      if (extra.umb) {
        umb = new THREE.Group();
        const can = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.24, 10, 1, true), new THREE.MeshStandardMaterial({ color: extra.umb, roughness: 0.35, side: THREE.DoubleSide }));
        can.position.y = 0.1; umb.add(can);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.85, 5), Mat.std('#222', { roughness: 0.4 })); shaft.position.y = -0.3; umb.add(shaft);
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 3), Mat.std('#111')); tip.position.set(Math.cos(a) * 0.56, -0.02, Math.sin(a) * 0.56); umb.add(tip); }
        umb.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        scene.add(umb);
      }
      return { p, spec, win, extra, umb };
    });
    this.blobs = new BlobShadows(scene, this.people.length);
  }

  // the ground under (x, z): the street / sidewalks / promenade, the steps, the seabed
  ground(x, z) {
    if (z < SL_FRONT.wallZ - 0.05) {
      if (Math.abs(x - 32) < 3.1 && z > SL_FRONT.wallZ - 3.9) return LAYOUT.curbH - (SL_FRONT.wallZ - 0.2 - z) / 0.42 * 0.31 - 0.31;
      return typeof slSeabedY !== 'undefined' ? slSeabedY(x, z) : SL_FRONT.beachY;
    }
    if (z < SL_FRONT.roadZ[0]) return LAYOUT.curbH;                       // the promenade
    if (z < SL_FRONT.roadZ[1]) return 0;                                  // the seafront road
    return Math.abs(x) > LAYOUT.roadHalf ? LAYOUT.curbH : 0;
  }

  update(t, q = 0) {
    this.blobs.begin();
    for (const o of this.people) {
      const P = o.p, on = t >= o.win[0] && t <= o.win[1];
      P.root.visible = on; if (o.umb) o.umb.visible = on;
      if (!on) continue;
      P.update(t);
      const st = this._state(o.spec.states, t);
      if (o.spec.face !== undefined && (st === 'jog' || st === 'walk' || st === 'walkUmb')) { const d = this._pathDir(o.spec.path, t); if (d !== null) P.root.rotation.y = d; }
      if (o.extra.faceAt !== undefined && t > o.extra.faceAt && st !== 'jog' && st !== 'walk' && st !== 'walkUmb') {
        const a = P.locate(o.extra.faceAt - 0.01).dir, b = Math.PI + MathX.deg(o.extra.faceTo);
        let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        P.root.rotation.y = a + d * Ease.inOutSine(MathX.clamp((t - o.extra.faceAt) / 0.6, 0, 1));
      }
      const x = P.root.position.x, z = P.root.position.z, gy = this.ground(x, z);
      P.root.position.y = gy + (q > 0 ? Math.max(0, noise1(t * 8 + x, 3) * 0.03 * q) : 0);
      if (q > 0) P.root.rotation.z = noise1(t * 6 + z, 4) * 0.05 * q;
      P.root.updateMatrixWorld(true);
      if (o.umb) {
        // held over the head (right hand); dropped and blown along the pavement in the quake
        const dr = o.extra.dropUmb, u = dr !== undefined ? Math.max(0, t - dr) : 0;
        const ry = P.root.rotation.y, s = P.scale || 1;
        const hx = x + Math.cos(ry) * 0.18 + Math.sin(ry) * 0.12, hz = z - Math.sin(ry) * 0.18 + Math.cos(ry) * 0.12;
        if (u <= 0) { o.umb.position.set(hx, gy + 2.02 * s, hz); o.umb.rotation.set(0.08 * Math.sin(t * 1.3 + x), 0, 0.1 + 0.05 * Math.sin(t * 1.1 + z)); }
        else { const k = Math.min(1, u / 0.5), sl = Math.min(u, 1.4); o.umb.position.set(hx - sl * 0.6, Math.max(gy + 0.35, gy + 2.02 - 4.9 * u * u), hz + sl * 0.4); o.umb.rotation.set(1.2 * k, sl * 1.5, 0.6 * k); }
      }
      if (gy > -1) this.blobs.push(x, gy + 0.02, z, 0.5, 0.5);
    }
    this.blobs.end();
  }
  _pathDir(P, t) {
    for (let i = 1; i < P.length; i++) if (t <= P[i][0] || i === P.length - 1) { const dx = P[i][1] - P[i - 1][1], dz = P[i][2] - P[i - 1][2]; return Math.hypot(dx, dz) > 1e-3 ? Math.atan2(dx, dz) : null; }
    return null;
  }
  _state(S, t) { let s = S[0][1]; for (const [a, n] of S) if (a <= t) s = n; return s; }
}
