/* =====================================================================
   SITE — the things that carry weight and give way, each a pure function of story time:
     GvCrane     the mobile crane in the far lanes lifting a 12 t bundle of steel beams off a flatbed:
                 the load sinks and swings when gravity doubles, the front outrigger punches into a patched
                 trench (30 s), the hoist brake slips (60 s) and lets go (62.6 s): the load falls 23 m at 2 G,
                 the unloaded boom whips back past vertical and falls backwards onto the junction.
     GvScaffold  the scaffold on your side: its cantilevered loading bay sags and breaks (15 s, the pallet falls
                 onto the builders' pickup), then the middle of the scaffold buckles and folds into the street (35 s).
     GvAwning    the old shop canopy: its tie rods let go (38 s) and it swings down against the window.
     GvTank      the wooden water tank on the roof across the street: its legs buckle (40.6 s), it tips, bursts,
                 and the water pours over the cornice.
   Free falls use 2 G (GV_G0 × 2); masses never change.
   ===================================================================== */

const GV_G = 2 * GV_G0;
const gvYellow = () => Mat.std('#e2a823', { roughness: 0.5, metalness: 0.15 });

function gvMesh(geo, mat, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = cast; m.receiveShadow = true;
  parent.add(m); return m;
}
function gvBox(w, h, d, mat, parent, x, y, z, rx, ry, rz, cast) { return gvMesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z, rx, ry, rz, cast); }
// a cylinder between two points (tubes, cables, rams); returns the mesh so it can be re-aimed with gvAim
const _gvUp = new THREE.Vector3(0, 1, 0), _gvD = new THREE.Vector3();
function gvTube(r, mat, parent, sides = 6) { const m = gvMesh(new THREE.CylinderGeometry(r, r, 1, sides), mat, parent); return m; }
function gvAim(m, a, b) {
  _gvD.subVectors(b, a); const L = Math.max(_gvD.length(), 1e-4);
  m.position.addVectors(a, b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_gvUp, _gvD.multiplyScalar(1 / L));
  m.scale.set(1, L, 1);
}
// a damped spring response to a step at t0 (0 → 1, overshooting)
function gvStep(t, t0, f = 1.2, z = 0.3) { return gvSpring(t, f, z, t0); }
// a quick decaying wobble after t0 (for jolts)
function gvJolt(t, t0, f = 3, decay = 0.35) { return t < t0 ? 0 : Math.sin((t - t0) * f * Math.PI * 2) * Math.exp(-(t - t0) / decay); }

// an I-beam along local X (flanges top and bottom)
function gvIBeam(L, mat, parent, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  gvBox(L, 0.022, 0.2, mat, g, 0, 0.14, 0); gvBox(L, 0.022, 0.2, mat, g, 0, -0.14, 0); gvBox(L, 0.26, 0.016, mat, g, 0, 0, 0);
  return g;
}

/* ===================================================================== */
class GvCrane {
  constructor(scene) {
    const C = GV_CITY.crane, F = GV_CITY.flatbed;
    this.scene = scene;
    this.root = new THREE.Group(); this.root.name = 'crane'; this.root.position.set(C.x, 0, C.z); scene.add(this.root);
    // the slew: the boom points at the flatbed
    this.slew = Math.atan2(F.x - C.x, F.z - C.z);                 // rotation.y that turns local +Z toward the flatbed
    this.boomL = 38.0; this.pivot = new THREE.Vector3(0, 3.55, 0.9);   // boom foot (superstructure frame)
    const r = Math.hypot(F.x - C.x, F.z - C.z) - this.pivot.z;
    this.phi0 = Math.acos(r / this.boomL);                         // luffing angle (from horizontal) that puts the tip over the flatbed
    this._build();
    this._simBoom();
    this._v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    this._fallXZ = this._hookXZAt(GV_FALL.load.t0 - 1e-3);       // where the hook was when the brake let go
  }

  _build() {
    const R = this.root, Y = gvYellow(), dark = Mat.std('#2a2c2e', { roughness: 0.6, metalness: 0.4 }), grey = Mat.std('#6e7072', { roughness: 0.55, metalness: 0.3 });
    const glass = new THREE.MeshStandardMaterial({ color: '#2b3a44', roughness: 0.14, metalness: 0.3, name: 'craneGlass' }), steel = Mat.std('#9aa0a6', { roughness: 0.35, metalness: 0.8 });
    const tire = Mat.std('#1b1b1c', { roughness: 0.85 }), rim = Mat.std('#8d8f91', { roughness: 0.4, metalness: 0.6 });
    // carrier: chassis, deck, five axles, the driver's cab at the junction end (−Z)
    gvBox(2.5, 0.55, 12.6, Y, R, 0, 1.3, 0);
    gvBox(2.3, 0.35, 12.0, dark, R, 0, 0.9, 0);
    for (const z of [-4.6, -3.1, 1.6, 3.1, 4.6]) for (const s of [-1, 1]) {
      const w = gvMesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 18), tire, R, s * 1.08, 0.6, z, 0, 0, Math.PI / 2);
      gvMesh(new THREE.CylinderGeometry(0.34, 0.34, 0.52, 10), rim, w, 0, 0, 0, 0, 0, 0, false);
    }
    const cab = new THREE.Group(); cab.position.set(0, 1.55, -5.5); R.add(cab);
    gvBox(2.5, 1.7, 1.7, Y, cab, 0, 0.85, 0); gvBox(2.3, 0.75, 0.05, glass, cab, 0, 1.15, -0.86); for (const s of [-1, 1]) gvBox(0.05, 0.7, 1.2, glass, cab, s * 1.26, 1.15, 0.1);
    gvBox(2.52, 0.18, 1.72, dark, cab, 0, 0.12, 0); gvBox(0.5, 0.1, 0.2, Mat.std('#ff8a1a', { roughness: 0.3 }), cab, 0, 1.76, 0.4);
    // outriggers: beams out to the pads, jack cylinders, pads (the front-right one, toward you, sinks)
    this.pads = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * 3.6, z = sz * 5.3;
      gvBox(3.6, 0.32, 0.36, Y, R, sx * 1.8, 1.0, z);
      const jack = gvBox(0.26, 0.9, 0.26, dark, R, x, 0.55, z);
      const pad = gvBox(0.9, 0.08, 0.9, Mat.std('#3b2a1c', { roughness: 0.9 }), R, x, 0.04, z);
      this.pads.push({ sx, sz, jack, pad });
    }
    // superstructure on the turntable
    const sup = new THREE.Group(); sup.position.set(0, 1.6, 0); sup.rotation.y = this.slew; R.add(sup); this.sup = sup;
    gvMesh(new THREE.CylinderGeometry(1.35, 1.45, 0.4, 20), dark, sup, 0, 0.2, 0);
    gvBox(2.5, 1.5, 4.6, Y, sup, 0, 1.15, -1.3);
    gvBox(2.7, 1.35, 1.5, Mat.std('#4a4d50', { roughness: 0.7 }), sup, 0, 1.1, -3.9);              // counterweight
    for (let i = 0; i < 4; i++) gvBox(2.72, 0.04, 1.52, dark, sup, 0, 0.55 + i * 0.34, -3.9, 0, 0, 0, false);
    const oc = new THREE.Group(); oc.position.set(1.45, 0.4, 0.6); sup.add(oc);                     // the operator's cab
    gvBox(0.95, 1.55, 1.9, Y, oc, 0, 0.78, 0); gvBox(0.9, 1.0, 0.05, glass, oc, 0, 1.0, 0.96); gvBox(0.05, 0.9, 1.4, glass, oc, 0.48, 1.0, 0.1);
    this.op = new Person({ id: 'craneOp', look: 'gvHiVis' }, null); oc.add(this.op.root); this.op.root.position.set(0, 0.02, 0.1); this.op.root.scale.setScalar(0.92);
    gvBox(0.3, 0.3, 0.3, Mat.std('#ff8a1a', { roughness: 0.3, emissive: '#ff6a00' }), sup, -0.9, 2.0, -2.8);   // beacon
    this.beacon = sup.children[sup.children.length - 1];
    // the boom: four telescopic sections along local +Y, luffed about X
    const boom = new THREE.Group(); boom.position.copy(this.pivot).sub(new THREE.Vector3(0, 1.6, 0)); sup.add(boom); this.boom = boom;
    const secs = [[0, 11, 1.25, 1.05], [10.3, 20.6, 1.08, 0.9], [19.9, 29.8, 0.93, 0.77], [29.1, 38.0, 0.8, 0.66]];
    for (const [a, b, w, d] of secs) {
      gvBox(w, b - a, d, Y, boom, 0, (a + b) / 2, 0);
      gvBox(w + 0.02, 0.06, d + 0.02, dark, boom, 0, b - 0.25, 0, 0, 0, 0, false);       // the collar at each section's end
      gvBox(0.03, b - a - 0.6, 0.1, dark, boom, w / 2 + 0.005, (a + b) / 2, 0, 0, 0, 0, false);
      gvBox(0.03, b - a - 0.6, 0.1, dark, boom, -w / 2 - 0.005, (a + b) / 2, 0, 0, 0, 0, false);
    }
    gvBox(0.7, 1.1, 0.9, dark, boom, 0, this.boomL + 0.2, 0.15);                              // the head with its sheaves
    gvMesh(new THREE.CylinderGeometry(0.38, 0.38, 0.5, 16), steel, boom, 0, this.boomL + 0.3, 0.55, 0, 0, Math.PI / 2);
    // the luffing ram (re-aimed each frame between the superstructure and the boom)
    this.ram = gvTube(0.2, steel, this.root, 10); this.ramC = gvTube(0.27, dark, this.root, 10);
    // the hoist rope (4 falls drawn as two pairs), hook block, two slings, and the load: 8 I-beams, 10 m long
    const rope = Mat.std('#2c2c2c', { roughness: 0.5, metalness: 0.6 });
    this.ropes = [0, 1].map(() => gvTube(0.026, rope, this.scene, 5));
    this.hook = new THREE.Group(); this.scene.add(this.hook);
    gvBox(0.55, 0.85, 0.42, Y, this.hook, 0, 0, 0); gvBox(0.6, 0.1, 0.46, dark, this.hook, 0, 0.4, 0);
    gvMesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12, Math.PI * 1.5), steel, this.hook, 0, -0.62, 0, 0, Math.PI / 2, 0);
    this.slings = [0, 1, 2, 3].map(() => gvTube(0.022, Mat.std('#c9b03a', { roughness: 0.6 }), this.scene, 4));
    this.load = new THREE.Group(); this.scene.add(this.load);
    const beamM = Mat.std('#7b4a33', { roughness: 0.65, metalness: 0.35 });
    for (let i = 0; i < 8; i++) gvIBeam(10.0, beamM, this.load, 0, 0.15 + Math.floor(i / 4) * 0.3, -0.33 + (i % 4) * 0.22);
    for (const x of [-3.2, 3.2]) gvBox(0.08, 0.68, 0.98, Mat.std('#2a2a2a', { roughness: 0.6 }), this.load, x, 0.32, 0.0, 0, 0, 0, false);   // banding straps
    this.load.rotation.y = this.slew + Math.PI / 2;                  // beams lie along the boom's direction (the flatbed's length)
  }

  // the boom after the load lets go: it whips back past vertical and falls backwards (rigid rod about its foot, 2 G)
  _simBoom() {
    const g = GV_G, L = this.boomL, dt = 1 / 600, out = [];
    let phi = this.phi0 + this._luff(GV.drop - 1e-3), w = 0.46, t = GV.drop;
    while (t < GV.end + 1) {
      out.push(phi);
      const alpha = -(3 * g / (2 * L)) * Math.cos(phi);
      w += alpha * dt; phi += w * dt; t += dt;
      if (phi > Math.PI + 0.06) { phi = Math.PI + 0.06; w = 0; }                       // lying on the road behind
    }
    this.boomTab = out; this.boomDt = dt;
    let k = out.findIndex((p) => p >= Math.PI + 0.059); this.boomLand = GV.drop + (k < 0 ? 99 : k * dt);
  }
  _boomFall(t) { const i = MathX.clamp((t - GV.drop) / this.boomDt, 0, this.boomTab.length - 1); return this.boomTab[Math.floor(i)]; }

  // luffing angle change: the boom bends down a little under the doubled load (and after the outrigger sinks)
  _luff(t) { return -MathX.deg(0.55) * gvStep(t, GV.g0 + 0.05, 0.8, 0.25) - MathX.deg(1.2) * gvStep(t, GV.outrigger, 0.9, 0.3); }
  // how far the front-right pad has punched into the road
  sink(t) { return 0.3 * gvStep(t, GV.outrigger, 1.4, 0.45) + 0.02 * gvJolt(t, GV.outrigger + 0.1, 5, 0.2); }
  // the load's underside height below the boom head (rope paid out): hoisting at first, the stretch at 2 G, the slips
  ropeLen(t) {
    let L = 12.6 + 1.5 * (1 - MathX.ramp(t, -0.5, GV.g0)) + 0.5 * gvStep(t, GV.g0 + 0.02, 0.9, 0.22);
    const S = GV.slips, d = [0.15, 0.2, 0.25];
    S.forEach((ts, i) => { L += d[i] * MathX.smooth(t, ts, ts + 0.12) + 0.06 * gvJolt(t, ts + 0.12, 2.2, 0.25); });
    return L;
  }

  update(t) {
    const R = this.root, sink = this.sink(t);
    // the whole crane tilts toward the sinking front-right pad (and rocks back when the load lets go)
    const rock = t > GV.drop ? -0.035 * Math.sin(Math.min((t - GV.drop) / 0.9, 1) * Math.PI) : 0;
    R.rotation.set(sink / 2 / 5.3 + rock, 0, -(sink / 2 / 3.6), 'XYZ');
    for (const P of this.pads) if (P.sx > 0 && P.sz > 0) { P.pad.position.y = 0.04 - sink * 0.0; }
    R.updateMatrixWorld(true);
    // boom angle
    let phi = this.phi0 + this._luff(t);
    if (t >= GV.drop) phi = this._boomFall(t);
    this.boom.rotation.x = Math.PI / 2 - phi;
    this.boom.updateMatrixWorld(true);
    // the luffing ram: from the superstructure to 9 m up the boom
    const a = this._v[0].set(0, 0.6, 2.6), b = this._v[1].set(0, 9.0, 0);
    this.sup.localToWorld(a); this.boom.localToWorld(b);
    const m = this._v[2].lerpVectors(a, b, 0.55);
    gvAim(this.ram, m, b); gvAim(this.ramC, a, m);
    // the boom head, and the hook / load hanging under it
    const head = this.boom.localToWorld(this._v[3].set(0, this.boomL + 0.3, 0.55));
    this.op.apply(ACTIONS.sit(t, { seed: 0.3, seedI: 3, seat: 0.42 }));
    this.beacon.material.emissiveIntensity = (t * 1.6) % 1 < 0.5 ? 2.2 : 0.2;
    // pendulum: the load lags behind the head when it moves (2 G: a faster swing), then swings back
    const Lp = this.ropeLen(t) + 2.2, w = Math.sqrt(GV_G / Lp);
    const swing = (t0, amp, ph = 0) => (t < t0 ? 0 : amp * Math.sin(w * (t - t0) + ph) * Math.exp(-(t - t0) / 9));
    const dir = new THREE.Vector3(Math.sin(this.slew), 0, Math.cos(this.slew)), side = new THREE.Vector3(dir.z, 0, -dir.x);
    const sOut = swing(GV.g0 + 0.1, 0.25) + swing(GV.outrigger + 0.15, -0.95) + GV.slips.reduce((s, ts) => s + swing(ts + 0.1, 0.12), 0);
    const sSide = swing(GV.g0 + 0.1, 0.12, 1.0) + swing(GV.outrigger + 0.15, 0.45, 0.6);
    let hx = head.x + dir.x * sOut + side.x * sSide, hz = head.z + dir.z * sOut + side.z * sSide, hy = head.y - this.ropeLen(t);
    const F = GV_FALL.load;
    this.loadY = hy - 3.1;                                          // the load's underside
    const falling = t >= F.t0;
    if (falling) {
      // free fall from where the swing had the hook at the drop moment (the slack rope pays out with it);
      // after the hit the bundle lies on the crushed flatbed with a short bounce
      const tau = t - F.t0;
      this.loadY = t < F.hit ? Math.max(F.h - 0.5 * GV_G * tau * tau, 0) : 0.55 + 0.25 * Math.exp(-(t - F.hit) / 0.12) * Math.abs(Math.sin((t - F.hit) * 14));
      hy = this.loadY + 3.1; hx = this._fallXZ[0]; hz = this._fallXZ[1];
    }
    this.hook.position.set(hx, hy, hz);
    this.hook.rotation.y = this.slew;
    this.load.position.set(hx, this.loadY, hz);
    this.load.rotation.z = falling && t > F.hit ? 0.06 * MathX.smooth(t, F.hit, F.hit + 0.2) : 0;
    this.load.rotation.x = falling ? 0.04 * MathX.smooth(t, F.t0, F.hit) : 0.02 * Math.sin(t * 0.7);
    // ropes: two pairs of falls from the head sheaves to the hook (slack and falling after the drop)
    const ropeVis = !(t > F.hit + 0.3);
    this.ropes.forEach((r, i) => {
      r.visible = ropeVis;
      const s = (i ? 1 : -1) * 0.14, A = this._v[0].set(head.x + side.x * s, head.y - 0.2, head.z + side.z * s), Bp = this._v[1].set(hx + side.x * s, hy + 0.4, hz + side.z * s);
      gvAim(r, A, Bp);
    });
    // slings from the hook to the bundle's quarter points
    const ends = [[-3.2, -0.3], [-3.2, 0.3], [3.2, -0.3], [3.2, 0.3]];
    this.load.updateMatrixWorld(true);
    this.slings.forEach((sl, i) => {
      const P = this.load.localToWorld(this._v[1].set(ends[i][0], 0.7, ends[i][1])), H = this._v[0].set(hx, hy - 0.66, hz);
      if (t > F.hit) H.set(P.x * 0.6 + hx * 0.4, P.y + 0.25, P.z * 0.6 + hz * 0.4);
      gvAim(sl, H, P);
    });
    if (t > F.hit) { this.hook.position.y = 1.1; this.hook.rotation.z = 1.3; }
  }
  _hookXZAt(t) {
    // re-evaluate the swing at a fixed time (no state)
    const R = this.root, sink = this.sink(t);
    R.rotation.set(sink / 2 / 5.3, 0, -(sink / 2 / 3.6), 'XYZ'); R.updateMatrixWorld(true);
    this.boom.rotation.x = Math.PI / 2 - (this.phi0 + this._luff(t)); this.boom.updateMatrixWorld(true);
    const head = this.boom.localToWorld(new THREE.Vector3(0, this.boomL + 0.3, 0.55));
    const Lp = this.ropeLen(t) + 2.2, w = Math.sqrt(GV_G / Lp);
    const swing = (t0, amp, ph = 0) => (t < t0 ? 0 : amp * Math.sin(w * (t - t0) + ph) * Math.exp(-(t - t0) / 9));
    const dir = new THREE.Vector3(Math.sin(this.slew), 0, Math.cos(this.slew)), side = new THREE.Vector3(dir.z, 0, -dir.x);
    const sOut = swing(GV.g0 + 0.1, 0.25) + swing(GV.outrigger + 0.15, -0.95) + GV.slips.reduce((s, ts) => s + swing(ts + 0.1, 0.12), 0);
    const sSide = swing(GV.g0 + 0.1, 0.12, 1.0) + swing(GV.outrigger + 0.15, 0.45, 0.6);
    return [head.x + dir.x * sOut + side.x * sSide, head.z + dir.z * sOut + side.z * sSide];
  }
  // world position of the boom tip (for the fall's dust and the camera)
  tip(out) { return this.boom.localToWorld(out.set(0, this.boomL, 0)); }
}

/* ===================================================================== */
// the flatbed under the load: a tractor and a trailer of steel; crushed when the bundle lands
class GvFlatbed {
  constructor(scene, factory) {
    const F = GV_CITY.flatbed;
    this.root = new THREE.Group(); this.root.position.set(F.x, 0, F.z); this.root.name = 'veh:flatbed'; scene.add(this.root);
    const red = Mat.std('#7d2b26', { roughness: 0.45 }), dark = Mat.std('#232527', { roughness: 0.6, metalness: 0.4 }), deckM = Mat.std('#4b4239', { roughness: 0.85 });
    const tire = Mat.std('#1b1b1c', { roughness: 0.85 }), rim = Mat.std('#8d8f91', { roughness: 0.4, metalness: 0.6 }), glass = new THREE.MeshStandardMaterial({ color: '#25323b', roughness: 0.14, name: 'fbGlass' });
    // tractor at +Z (facing you), trailer behind it
    const tr = new THREE.Group(); tr.position.z = 7.4; this.root.add(tr);
    gvBox(2.45, 2.2, 2.3, red, tr, 0, 2.15, 0.6); gvBox(2.3, 0.85, 0.05, glass, tr, 0, 2.65, 1.76); gvBox(2.47, 0.5, 2.32, dark, tr, 0, 0.95, 0.6);
    gvBox(2.2, 0.35, 4.2, dark, tr, 0, 1.0, -0.6); gvBox(0.4, 0.9, 0.08, Mat.std('#cfd2d4', { roughness: 0.3, metalness: 0.7 }), tr, 0, 1.3, 1.8);
    for (const z of [1.0, -1.5]) for (const s of [-1, 1]) { const w = gvMesh(new THREE.CylinderGeometry(0.52, 0.52, 0.42, 16), tire, tr, s * 1.05, 0.52, z, 0, 0, Math.PI / 2); gvMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.44, 10), rim, w, 0, 0, 0, 0, 0, 0, false); }
    // the trailer deck in two halves (they fold into a V when the load lands)
    this.halves = [-1, 1].map((s) => {
      const h = new THREE.Group(); h.position.set(0, 1.35, 0); this.root.add(h);
      gvBox(2.5, 0.22, 6.0, deckM, h, 0, 0, s * 3.0); gvBox(2.52, 0.3, 6.0, dark, h, 0, -0.24, s * 3.0);
      for (let i = 0; i < 4; i++) gvBox(0.08, 0.5, 0.08, dark, h, (i % 2 ? 1 : -1) * 1.2, 0.3, s * (1.2 + Math.floor(i / 2) * 3.4));
      return { h, s };
    });
    for (const z of [-3.6, -4.9]) for (const s of [-1, 1]) { const w = gvMesh(new THREE.CylinderGeometry(0.48, 0.48, 0.42, 16), tire, this.root, s * 1.05, 0.48, z, 0, 0, Math.PI / 2); gvMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.44, 10), rim, w, 0, 0, 0, 0, 0, 0, false); }
    // what's left on the trailer: a few beams on dunnage
    const beamM = Mat.std('#7b4a33', { roughness: 0.65, metalness: 0.35 });
    this.cargo = new THREE.Group(); this.halves[0].h.add(this.cargo);
    for (let i = 0; i < 3; i++) { const b = gvIBeam(5.0, beamM, this.cargo, 0, 0.27, -2.6); b.rotation.y = Math.PI / 2; b.position.x = -0.5 + i * 0.5; }
  }
  update(t) {
    const F = GV_FALL.load, k = MathX.smooth(t, F.hit - 0.02, F.hit + 0.18);
    for (const H of this.halves) { H.h.rotation.x = -H.s * 0.2 * k; H.h.position.y = 1.35 - 0.75 * k; }
    this.root.rotation.z = 0.03 * k * Math.sin(Math.min((t - F.hit) * 9, Math.PI)) * (t > F.hit ? 1 : 0);
  }
}

/* ===================================================================== */
class GvScaffold {
  constructor(scene) {
    const S = GV_CITY.scaffold, Bay = GV_CITY.bay;
    this.root = new THREE.Group(); this.root.name = 'scaffold'; scene.add(this.root);
    const tube = Mat.std('#a9afb3', { roughness: 0.45, metalness: 0.6 }), board = Mat.std('#a8834f', { roughness: 0.9 }), toe = Mat.std('#9a7547', { roughness: 0.9 });
    const net = new THREE.MeshStandardMaterial({ color: '#3f5a4a', roughness: 0.9, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    this.mat = { tube, board, toe, net };
    // three sections along the facade: A (near you) and C stand; B (the middle, under the bay) buckles and folds
    const zA = S.z1, zB1 = -13.6, zB0 = -22.0, zC = S.z0;
    this.sections = [['A', zB1, zA], ['B', zB0, zB1], ['C', zC, zB0]].map(([id, z0, z1]) => this._section(id, z0, z1));
    // the cantilevered loading bay off the top lift (over the pickup), with the pallet of bricks on it
    const bay = new THREE.Group(); bay.position.set(0, S.lift, (Bay.z0 + Bay.z1) / 2); this.sections[1].segs[S.lifts - 1].add(bay); this.bay = bay;
    // (bay is parented to the top segment of section B, in that segment's frame: shift into it)
    const len = S.x0 - Bay.x0, wz = Bay.z1 - Bay.z0;
    for (const dz of [-wz / 2, wz / 2]) {
      const beam = gvBox(len + 0.2, 0.08, 0.08, tube, bay, -len / 2, 0, dz);
      const strut = gvTube(0.03, tube, bay); gvAim(strut, new THREE.Vector3(0, -2.0, dz), new THREE.Vector3(-len * 0.8, 0, dz));
      gvBox(0.06, 1.1, 0.06, tube, bay, -len, 0.55, dz);
    }
    for (let i = 0; i < 9; i++) gvBox(len, 0.05, 0.22, board, bay, -len / 2, 0.065, -wz / 2 + 0.2 + i * (wz - 0.4) / 8);
    gvBox(0.05, 0.05, wz, tube, bay, -len, 1.05, 0);
    // the pallet: bricks on a wooden pallet, strapped (its own group so it can fall)
    this.pallet = this._pallet(scene); this.palletHome = new THREE.Vector3(-len * 0.52, 0.09, 0.15);
    bay.add(this.pallet);
    // the faint 1 G "ghost" of the pallet (it would still be falling when the real one lands)
    this.ghost = this._pallet(scene, true); this.ghost.visible = false;
    // a ladder inside section A, and the bricklayer's mortar tub up top
    this.v = new THREE.Vector3();
  }

  _pallet(scene, ghost = false) {
    const g = new THREE.Group();
    const brickM = ghost ? new THREE.MeshBasicMaterial({ color: '#e8eef2', transparent: true, opacity: 0.18, depthWrite: false })
      : Mat.std('#9c4a32', { roughness: 0.9 });
    const wood = ghost ? brickM : Mat.std('#b58d55', { roughness: 0.9 });
    gvBox(1.1, 0.14, 1.0, wood, g, 0, 0.07, 0, 0, 0, 0, !ghost);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) gvBox(1.04, 0.12, 0.47, brickM, g, 0, 0.21 + r * 0.13, -0.24 + c * 0.49, 0, 0, 0, !ghost);
    if (!ghost) for (const x of [-0.3, 0.3]) gvBox(0.04, 0.95, 1.02, Mat.std('#2a2a2a'), g, x, 0.55, 0, 0, 0, 0, false);
    if (ghost) scene.add(g);
    return g;
  }

  // one section of the scaffold, built as six lift segments (each 2 m) so it can bow and fold
  _section(id, z0, z1) {
    const S = GV_CITY.scaffold, M = this.mat, sec = { id, z0, z1, segs: [] };
    const zs = []; for (let z = z0; z <= z1 + 1e-6; z += (z1 - z0) / Math.max(1, Math.round((z1 - z0) / 2.1))) zs.push(z);
    let parent = this.root;
    for (let k = 0; k < S.lifts; k++) {
      const seg = new THREE.Group(); seg.position.set(k === 0 ? S.x0 : 0, k === 0 ? LAYOUT.curbH : S.lift, 0); parent.add(seg);
      // (each segment's origin: the outer standard line at its bottom; children in that frame, x measured from S.x0)
      const W = S.x1 - S.x0, y1 = S.lift;
      for (const z of zs) for (const x of [0, W]) gvBox(0.05, S.lift, 0.05, M.tube, seg, x, y1 / 2, z, 0, 0, 0, x === 0);
      for (const x of [0, W]) gvBox(0.05, 0.05, z1 - z0, M.tube, seg, x, y1, (z0 + z1) / 2);             // ledgers
      for (const z of zs) gvBox(W + 0.25, 0.05, 0.05, M.tube, seg, W / 2, y1 + 0.06, z, 0, 0, 0, false);   // transoms
      for (let i = 0; i < 5; i++) gvBox(0.22, 0.05, z1 - z0 - 0.1, M.board, seg, 0.15 + i * (W - 0.3) / 4, y1 + 0.11, (z0 + z1) / 2);
      gvBox(0.03, 0.15, z1 - z0, M.toe, seg, -0.02, y1 + 0.2, (z0 + z1) / 2);
      for (const yy of [0.55, 1.05]) gvBox(0.045, 0.045, z1 - z0, M.tube, seg, -0.04, y1 + yy, (z0 + z1) / 2, 0, 0, 0, false);
      // a facade brace every other lift
      if (k % 2 === 0) { const br = gvTube(0.024, M.tube, seg); gvAim(br, new THREE.Vector3(-0.03, 0, z0 + 0.05), new THREE.Vector3(-0.03, y1, Math.min(z1, z0 + 2.1))); }
      sec.segs.push(seg); parent = seg;
    }
    // a ladder in section A
    if (id === 'A') for (let k = 0; k < S.lifts; k++) { const seg = sec.segs[k]; for (const dz of [-0.22, 0.22]) gvBox(0.04, S.lift, 0.04, M.tube, seg, 0.75, S.lift / 2, z1 - 0.7 + dz, 0, 0, 0, false); for (let r = 0; r < 7; r++) gvBox(0.03, 0.03, 0.44, M.tube, seg, 0.75, 0.15 + r * 0.29, z1 - 0.7, 0, 0, 0, false); }
    return sec;
  }

  // the bay: a small sag at the change, a deeper sag (creak), the crack, then it hangs
  bayAngle(t) {
    const B = GV.bay;
    return MathX.deg(1.2) * gvStep(t, GV.g0 + 0.05, 1.6, 0.3) + MathX.deg(2.5) * MathX.smooth(t, B.creak, B.crack) + MathX.deg(9) * gvStep(t, B.crack, 2.2, 0.35) + MathX.deg(26) * MathX.smooth(t, B.drop - 0.05, B.drop + 0.35) + MathX.deg(3) * gvJolt(t, B.drop + 0.35, 1.6, 0.6);
  }

  // the buckling of section B: bow (standards bend outward at mid-height), then fold (the top half goes over)
  _bend(t) {
    const C = GV.scaffold;
    const bow = 0.06 * MathX.smooth(t, C.bow - 0.6, C.bow) + 0.22 * MathX.smooth(t, C.bow, C.fold);
    // fold: the lower half leans out to 32°, the top half pivots over to 138° and lands across the pickup and the road
    const u = MathX.clamp((t - C.fold) / 1.05, 0, 1), f = u * u;                 // accelerating fall
    const lower = MathX.deg(32) * f, upper = MathX.deg(138 - 32) * Math.min(1, f * 1.04);
    const bounce = t > C.fold + 1.05 ? MathX.deg(3) * gvJolt(t, C.fold + 1.05, 1.8, 0.3) : 0;
    return { bow, lower, upper: upper + bounce };
  }

  update(t) {
    const S = GV_CITY.scaffold, B = this._bend(t);
    // every section sags a hair at the change (joints take up slack); B bows, then folds
    for (const sec of this.sections) {
      const isB = sec.id === 'B';
      sec.segs.forEach((seg, k) => {
        const y = (k + 0.5) / S.lifts;
        let a = 0.004 * gvStep(t, GV.g0 + 0.05, 1.8, 0.3) * Math.cos(y * Math.PI);
        if (isB) {
          a += B.bow * Math.cos(y * Math.PI) * 1.2;                                  // a half-sine buckle: lean out low, back in high
          if (k === 0) a += B.lower; if (k === 3) a += B.upper;                      // the fold: the bottom hinge and the mid hinge
          if (k === 4 || k === 5) a += MathX.deg(4) * MathX.smooth(t, GV.scaffold.fold + 0.3, GV.scaffold.fold + 1.0) * (k - 3);
        } else if (t > GV.scaffold.fold) {
          a += MathX.deg(sec.id === 'A' ? 2.5 : 3.5) * MathX.smooth(t, GV.scaffold.fold, GV.scaffold.fold + 0.8) * (k > 2 ? 1 : 0.3);   // the neighbours get dragged out
        }
        seg.rotation.z = a;                                                          // + = top toward the street (−X)
        seg.position.y = k === 0 ? LAYOUT.curbH - (isB ? 0.06 * MathX.smooth(t, GV.scaffold.fold, GV.scaffold.fold + 0.5) : 0) : S.lift - (isB && (k === 1 || k === 2) ? 0.35 * MathX.smooth(t, GV.scaffold.fold, GV.scaffold.fold + 0.6) : 0);
      });
    }
    // the bay (in the top segment of B): sagging about its wall end
    this.bay.rotation.z = this.bayAngle(t);
    // the pallet: on the bay until it slides off; then a free fall at 2 G onto the pickup's cab; then broken up (fx)
    const P = GV_FALL.pallet, Bay = GV_CITY.bay;
    if (t < P.t0) {
      this.pallet.visible = true;
      if (this.pallet.parent !== this.bay) this.bay.add(this.pallet);
      const slide = MathX.smooth(t, GV.bay.crack, P.t0) * 0.75;
      this.pallet.position.copy(this.palletHome).x -= slide;
      this.pallet.rotation.set(0, 0, 0);
      this.ghost.visible = false;
    } else {
      if (this.pallet.parent !== this.root.parent) this.root.parent.add(this.pallet);
      const tau = t - P.t0, x0 = Bay.x0 + 0.95, z0 = (Bay.z0 + Bay.z1) / 2 + 0.15;
      const yHit = 1.92, yTop = yHit + P.h;                      // the pallet's base when it leaves the tilted bay
      const hitT = Math.sqrt(2 * (yTop - yHit) / GV_G);
      if (tau < hitT) {
        this.pallet.position.set(x0 - 0.35 * tau, yTop - 0.5 * GV_G * tau * tau, z0);
        this.pallet.rotation.set(0.1 * tau, 0, 1.1 * tau);
        this.pallet.visible = true;
      } else this.pallet.visible = false;            // it bursts on the cab (fx.js scatters the bricks)
      // the 1 G ghost, falling beside it
      const gy = yTop - 0.5 * GV_G0 * tau * tau;
      this.ghost.visible = t < P.hit + 0.45 && gy > yHit - 0.2;
      this.ghost.position.set(x0 - 0.35 * tau, Math.max(gy, yHit), z0);
      this.ghost.rotation.set(0.07 * tau, 0, 0.75 * tau);
      this.ghost.children.forEach((c) => { c.material.opacity = 0.2 * (1 - MathX.smooth(t, P.hit + 0.1, P.hit + 0.45)) * MathX.smooth(tau, 0, 0.15); });
      this.palletHitT = P.t0 + hitT;
    }
  }
}

/* ===================================================================== */
class GvAwning {
  constructor(scene) {
    const A = GV_CITY.awning, fx = LAYOUT.frontage - 0.02;
    this.root = new THREE.Group(); this.root.position.set(fx, A.y, (A.z0 + A.z1) / 2); scene.add(this.root);
    const frame = Mat.std('#3a3d3f', { roughness: 0.5, metalness: 0.5 }), cloth = Mat.std('#6f3b2e', { roughness: 0.85, side: THREE.DoubleSide }), stripe = Mat.std('#d7cbb4', { roughness: 0.85, side: THREE.DoubleSide });
    const L = A.z1 - A.z0, D = A.out, drop = 0.55;
    // the canopy: a sloping cloth over a steel frame, a valance, tie rods to the wall above
    const can = new THREE.Group(); this.root.add(can); this.can = can;
    const slope = Math.atan2(drop, D);
    const sheet = new THREE.Group(); sheet.rotation.z = -slope; can.add(sheet);
    const n = 8;
    for (let i = 0; i < n; i++) gvBox(Math.hypot(D, drop), 0.03, L / n, i % 2 ? stripe : cloth, sheet, -Math.hypot(D, drop) / 2, 0, -L / 2 + (i + 0.5) * L / n);
    for (const dz of [-L / 2, L / 2, 0]) gvBox(Math.hypot(D, drop), 0.05, 0.05, frame, sheet, -Math.hypot(D, drop) / 2, -0.04, dz);
    gvBox(0.04, 0.32, L, cloth, can, -D, -drop - 0.15, 0);
    // the old shop's name board sits on the canopy's front edge (heavy, painted wood)
    const sm = new THREE.MeshStandardMaterial({ map: Tex.label([['GRAHAM & SONS', 64], ['HARDWARE · EST. 1958', 30]], { w: 768, h: 192, bg: '#2a3a2c', fg: '#e8dcc0', border: '#c9b98a' }), roughness: 0.7 });
    this.sign = gvBox(0.12, 0.7, L * 0.8, sm, can, -D + 0.12, -drop + 0.35, 0);
    { const pl = Mat.std('#2a3a2c', { roughness: 0.7 }); this.sign.material = [pl, sm, pl, pl, pl, pl]; }
    this.sign.geometry = new THREE.BoxGeometry(0.12, 0.7, L * 0.8);
    this.rods = [-1, 1].map((s) => { const r = gvTube(0.018, frame, scene, 5); r.userData.z = s * L * 0.42; return r; });
    this.v = [new THREE.Vector3(), new THREE.Vector3()];
  }
  angle(t) {
    const T = GV.awning;
    // sag at the change, a creak, the rods let go, it swings down and slaps the window
    return MathX.deg(1.2) * gvStep(t, GV.g0 + 0.05, 1.5, 0.3) + MathX.deg(3) * MathX.smooth(t, T - 0.8, T - 0.1) + MathX.deg(82) * Math.min(1, Math.pow(MathX.clamp((t - T) / 0.42, 0, 1), 2)) - (t > T + 0.42 ? MathX.deg(6) * Math.abs(gvJolt(t, T + 0.42, 1.4, 0.3)) : 0);
  }
  update(t) {
    this.can.rotation.z = this.angle(t);                  // + : outer edge drops (about the wall hinge)
    this.root.updateMatrixWorld(true);
    // the sign tears off the edge as the canopy swings and drops to the pavement (2 G)
    const T = GV.awning + 0.25;
    if (t > T) {
      if (!this._sp) { this._sp = true; }
      const tau = t - T, y0 = GV_CITY.awning.y - 0.6, yG = LAYOUT.curbH + 0.35;
      const yy = Math.max(yG, y0 - 0.5 * GV_G * tau * tau);
      if (this.sign.parent !== this.root.parent) this.root.parent.add(this.sign);
      this.sign.position.set(LAYOUT.frontage - GV_CITY.awning.out - 0.25 - 0.4 * tau, yy, (GV_CITY.awning.z0 + GV_CITY.awning.z1) / 2);
      this.sign.rotation.set(0, 0, yy <= yG + 1e-3 ? MathX.deg(78) : 0.4 * tau);
      if (yy <= yG + 1e-3) this.sign.position.y = LAYOUT.curbH + 0.08;
    } else if (this.sign.parent !== this.can) { this.can.add(this.sign); this.sign.position.set(-GV_CITY.awning.out + 0.12, -0.55 + 0.35, 0); this.sign.rotation.set(0, 0, 0); }
    // tie rods: from the wall above to the canopy's outer edge; they snap and swing free
    for (const r of this.rods) {
      const z = this.root.position.z + r.userData.z, A = this.v[0].set(LAYOUT.frontage - 0.02, GV_CITY.awning.y + 1.5, z);
      const E = this.can.localToWorld(this.v[1].set(-GV_CITY.awning.out + 0.1, -0.5, r.userData.z));
      if (t > GV.awning) E.set(A.x - 0.12, A.y - 0.95, z);
      gvAim(r, A, E);
    }
  }
}

/* ===================================================================== */
class GvTank {
  constructor(scene) {
    const T = GV_CITY.tank, H = 4.4 + GV_CITY.tankHouse.floors * FACADE_STYLES[GV_CITY.tankHouse.style].floorH;
    this.roofY = H; this.T = T;
    this.root = new THREE.Group(); this.root.position.set(T.x, H, T.z); scene.add(this.root);
    const steel = Mat.std('#2c3034', { roughness: 0.45, metalness: 0.6 }), wood = Mat.std('#6d5340', { roughness: 0.95 }), hoop = Mat.std('#3a3a3a', { roughness: 0.5, metalness: 0.6 });
    // four legs (the two toward the street buckle) with cross bracing, a grillage on top
    this.legs = [];
    for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const lo = gvBox(0.2, T.legs / 2, 0.2, steel, this.root, dx * 1.35, T.legs / 4, dz * 1.35);
      const hi = gvBox(0.2, T.legs / 2, 0.2, steel, this.root, dx * 1.35, T.legs * 0.75, dz * 1.35);
      this.legs.push({ dx, dz, lo, hi });
    }
    for (const dz of [-1.35, 1.35]) for (const dx of [-1.35, 1.35]) { const b = gvTube(0.04, steel, this.root); gvAim(b, new THREE.Vector3(dx, 0.3, dz), new THREE.Vector3(-dx, T.legs - 0.3, dz)); }
    // the tank (its own group: tips, falls, bursts)
    const tank = new THREE.Group(); tank.position.set(0, T.legs, 0); this.root.add(tank); this.tank = tank;
    gvBox(3.3, 0.25, 3.3, steel, tank, 0, 0.12, 0);
    const staves = new THREE.CylinderGeometry(T.r, T.r * 1.04, T.h, 22, 1, true);
    gvMesh(staves, wood, tank, 0, 0.25 + T.h / 2, 0);
    gvMesh(new THREE.CircleGeometry(T.r, 22), wood, tank, 0, 0.26, 0, -Math.PI / 2);
    gvMesh(new THREE.ConeGeometry(T.r * 1.08, 1.2, 22), Mat.std('#3d3a36', { roughness: 0.8 }), tank, 0, 0.25 + T.h + 0.6, 0);
    for (const h of [0.6, 1.5, 2.4, 3.3]) gvMesh(new THREE.TorusGeometry(T.r * 1.02 + 0.01 * h, 0.04, 4, 26), hoop, tank, 0, 0.25 + h, 0, Math.PI / 2);
    // vertical stave lines (texture by geometry: thin dark battens)
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; gvBox(0.03, T.h, 0.05, Mat.std('#4a3828', { roughness: 0.95 }), tank, Math.cos(a) * (T.r + 0.01), 0.25 + T.h / 2, Math.sin(a) * (T.r + 0.01), 0, -a, 0, false); }
    // the burst staves (hidden until the burst)
    this.burst = [];
    for (let i = 0; i < 14; i++) { const s = gvBox(0.42, T.h * (0.6 + 0.4 * hash1(i * 3.1)), 0.08, wood, scene.parent || scene, 0, -100, 0); s.visible = false; this.burst.push(s); }
    this.scene = scene;
  }
  // the failure: front (street-side, +X) legs kink at mid-height; the tank tips toward the street, drops onto the roof, bursts
  state(t) {
    const T0 = GV.tank, k = MathX.smooth(t, T0 - 0.5, T0), u = MathX.clamp((t - T0) / 0.85, 0, 1);
    return { kink: MathX.deg(4) * k + MathX.deg(48) * u * u, tip: MathX.deg(3) * k + MathX.deg(62) * u * u * u, drop: 3.4 * u * u, burst: t > T0 + 0.85 ? t - (T0 + 0.85) : -1 };
  }
  update(t) {
    const S = this.state(t), T = this.T;
    for (const L of this.legs) {
      const front = L.dx > 0;
      L.lo.rotation.z = front ? -S.kink * 0.5 : -S.kink * 0.08;
      L.hi.rotation.z = front ? S.kink : S.kink * 0.15;
      L.hi.position.x = L.dx * 1.35 + (front ? Math.sin(S.kink * 0.5) * T.legs * 0.25 : 0);
      L.hi.position.y = T.legs * 0.75 - (front ? S.drop * 0.4 : S.drop * 0.15);
      L.hi.visible = L.lo.visible = true;
    }
    // tipping about the street-side bottom edge; the tank drops as the legs fold
    const tk = this.tank;
    tk.rotation.z = -S.tip;
    tk.position.set(Math.sin(S.tip) * 1.3 + S.drop * 0.25, T.legs - S.drop - Math.sin(S.tip) * 0.4, 0);
    tk.visible = S.burst < 0.05;
    // the burst: staves fly out toward the street and fall at 2 G onto the roof / over the edge
    this.burst.forEach((s, i) => {
      if (S.burst < 0) { s.visible = false; return; }
      const a = (i / this.burst.length) * Math.PI * 2, sp = 3 + 4 * hash1(i * 7.7), up = 2 + 3 * hash1(i * 5.3), tau = S.burst;
      const x0 = T.x + 2.4, z0 = T.z, y0 = this.roofY + 1.2;
      const vx = Math.cos(a) * sp * 0.6 + 3.2, vz = Math.sin(a) * sp;
      let x = x0 + vx * tau, z = z0 + vz * tau, y = y0 + up * tau - 0.5 * GV_G * tau * tau;
      const floor = x < -LAYOUT.frontage ? this.roofY + 0.05 : LAYOUT.curbH + 0.05;
      if (y < floor) y = floor;
      s.position.set(x, y, z); s.rotation.set(a + tau * 3 * (hash1(i) - 0.5), a, tau * 4 * (hash1(i * 2) - 0.5) + (y <= floor + 1e-3 ? Math.PI / 2 : 0));
      s.visible = true;
    });
  }
}
