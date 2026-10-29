/* =====================================================================
   BAKE-SIM — the rigid-body simulation of "What if gravity kept tilting sideways every second?", run ONCE, offline,
   and stored as keyframes in simdata.js (the page only reads them: everything stays a pure function of time).
     npm i @dimforge/rapier3d-compat@0.21.0        (in any folder; then point RAPIER at it, or use NODE_PATH)
     RAPIER=/path/to/node_modules/@dimforge/rapier3d-compat node films/gravity-keeps-tilting/bake-sim.cjs
   Two worlds, built from layout.js: your living room (its walls, the radiator, the sill; the furniture and everything
   on it) and the street (the ground, the pavements, the railings, the blocks, the church; the cars, the bins, the
   balls, a bike). Down turns one degree on every whole second of story time (s ≥ 1: θ = floor(s)°), at 9.81 m/s².
   In the street every body also feels air drag (the air keeps its old down and stays still): F = −k|v|v, with k set
   from its terminal speed; balls feel rolling resistance. Story time runs from −3 (settling) and is recorded from −1 to
   END at 30 Hz; each body's track is then thinned to the keyframes linear interpolation needs (within a few mm and a
   degree). Impacts (sudden changes of velocity) are listed for the sound.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const RAPIER = require(process.env.RAPIER || '@dimforge/rapier3d-compat');

const DIR = __dirname, G = 9.81, DT = 1 / 240, HZ = 30, S0 = -3, REC0 = -1, END = 380;
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(DIR, 'layout.js'), 'utf8') + ';this.GK_ROOM = GK_ROOM; this.GK_ST = GK_ST;', ctx);
const { GK_ROOM, GK_ST } = ctx;
const theta = (s) => (s < 1 ? 0 : Math.floor(s + 1e-9)) * Math.PI / 180;
const grav = (s) => { const a = theta(s); return { x: G * Math.sin(a), y: -G * Math.cos(a), z: 0 }; };

function partVol(p) { if (p[0] === 'box') return 8 * p[1] * p[2] * p[3]; if (p[0] === 'cyl') return 2 * p[1] * Math.PI * p[2] * p[2]; return 4 / 3 * Math.PI * p[1] ** 3; }
function partMass(p) { const n = { box: 8, cyl: 7, ball: 6 }[p[0]]; return p.length >= n ? p[n - 1] : null; }
function partOff(p) { return p[0] === 'box' ? p.slice(4, 7) : p[0] === 'cyl' ? p.slice(3, 6) : p.slice(2, 5); }

function addBody(world, b, o = {}) {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(...b.pos).setCanSleep(false).setCcdEnabled(!!o.ccd).setLinearDamping(0).setAngularDamping(o.angDamp ?? 0.05));
  const explicit = b.parts.map(partMass), rest = b.m - explicit.reduce((a, m) => a + (m || 0), 0);
  const vol = b.parts.reduce((a, p, i) => a + (explicit[i] == null ? partVol(p) : 0), 0);
  b.parts.forEach((p, i) => {
    const d = p[0] === 'box' ? RAPIER.ColliderDesc.cuboid(p[1], p[2], p[3]) : p[0] === 'cyl' ? RAPIER.ColliderDesc.cylinder(p[1], p[2]) : RAPIER.ColliderDesc.ball(p[1]);
    const off = partOff(p), m = explicit[i] ?? Math.max(1e-3, rest * partVol(p) / Math.max(1e-9, vol));
    d.setTranslation(...off).setMass(m).setFriction(b.mu).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(o.rest ?? 0.04).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);
    world.createCollider(d, rb);
  });
  return rb;
}
function addStatic(world, hx, hy, hz, x, y, z, fr = 1.0) {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z));
  world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setFriction(fr).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(0.04).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min), rb);
  return rb;
}
function addStaticHull(world, pts, fr = 1.0) {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.convexHull(new Float32Array(pts.flat())).setFriction(fr).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min), rb);
}

// ---- thin a track [[t, x, y, z, qx, qy, qz, qw], …] to keyframes (greedy: extend while every sample in between is
// within tolerance of the straight line / slerp between the ends)
function qAngle(a, b) { const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); return 2 * Math.acos(Math.min(1, d)); }
function nlerp(a, b, u) { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], s = d < 0 ? -1 : 1; const q = [0, 1, 2, 3].map((k) => a[k] * (1 - u) + s * b[k] * u); const l = Math.hypot(...q); return q.map((v) => v / l); }
function thin(tr, tolP, tolR) {
  const keep = [0]; let i = 0;
  while (i < tr.length - 1) {
    let j = i + 1;
    for (let k = i + 2; k < tr.length; k++) {
      let ok = true;
      for (let m = i + 1; m < k && ok; m++) {
        const u = (tr[m][0] - tr[i][0]) / (tr[k][0] - tr[i][0]);
        const tp = typeof tolP === 'function' ? tolP(tr[m]) : tolP;
        for (let a = 1; a <= 3; a++) if (Math.abs(tr[i][a] + (tr[k][a] - tr[i][a]) * u - tr[m][a]) > tp) { ok = false; break; }
        if (ok && qAngle(nlerp(tr[i].slice(4), tr[k].slice(4), u), tr[m].slice(4)) > tolR) ok = false;
      }
      if (!ok) break;
      j = k;
      if (k - i > 900) break;                                   // (keys at least every 30 s)
    }
    keep.push(j); i = j;
  }
  return keep.map((k) => tr[k]);
}

function run(name, build, o) {
  const world = new RAPIER.World(grav(S0));
  world.integrationParameters.dt = DT;
  world.integrationParameters.numSolverIterations = o.iters || 8;
  const bodies = build(world);
  const tracks = bodies.map(() => []), events = [], lastV = bodies.map(() => [0, 0, 0]), lastHit = bodies.map(() => -9);
  const nSteps = Math.round((END - S0) / DT), every = Math.round(1 / (HZ * DT));
  let gPrev = null;
  for (let n = 0; n <= nSteps; n++) {
    const s = S0 + n * DT, g = grav(s);
    if (!gPrev || g.x !== gPrev.x || g.y !== gPrev.y) { world.gravity = g; gPrev = g; }
    if (o.forces) o.forces(bodies, g, s);
    world.step();
    // impacts: a change of velocity bigger than gravity and drag could make in one step
    bodies.forEach(({ rb, b }, i) => {
      const v = rb.linvel(), dv = Math.hypot(v.x - lastV[i][0] - g.x * DT, v.y - lastV[i][1] - g.y * DT, v.z - lastV[i][2]);
      if (dv > o.hit && s > 0 && s - lastHit[i] > 0.25) { const p = rb.translation(); events.push([+s.toFixed(3), b.id, +dv.toFixed(2), +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)]); lastHit[i] = s; }
      lastV[i] = [v.x, v.y, v.z];
    });
    if (s >= REC0 - 1e-9 && n % every === 0) bodies.forEach(({ rb }, i) => { const p = rb.translation(), q = rb.rotation(); tracks[i].push([+s.toFixed(4), p.x, p.y, p.z, q.x, q.y, q.z, q.w]); });
  }
  const out = { ids: bodies.map(({ b }) => b.id), tracks: [], events };
  bodies.forEach(({ b }, i) => {
    const k = thin(tracks[i], o.tolP, o.tolR);
    out.tracks.push(k.map((r) => [Math.round((r[0] - REC0) * HZ), ...r.slice(1, 4).map((v) => +v.toFixed(o.dp || 4)), ...r.slice(4).map((v) => +v.toFixed(4))]));
  });
  const nk = out.tracks.reduce((a, t) => a + t.length, 0);
  console.log(`${name}: ${bodies.length} bodies, ${nk} keyframes, ${events.length} impacts`);
  return out;
}

(async () => {
  await RAPIER.init();
  const t0 = Date.now();
  // ---------------------------------------------------------------- the room (room-local coordinates)
  const R = GK_ROOM;
  const room = run('room', (w) => {
    const T = 0.5, X = R.W / 2, Z = R.D / 2;
    addStatic(w, X + 1, T, Z + 1, 0, -T, 0); addStatic(w, X + 1, T, Z + 1, 0, R.H + T, 0);           // floor, ceiling
    addStatic(w, T, R.H, Z + 1, -X - T, R.H / 2, 0); addStatic(w, T, R.H, Z + 1, X + T, R.H / 2, 0);   // west, east walls
    addStatic(w, X + 1, R.H, T, 0, R.H / 2, -Z - T); addStatic(w, X + 1, R.H, T, 0, R.H / 2, Z + T);   // north (window), south walls
    const r = R.rad, sl = R.sill;
    addStatic(w, (r.x[1] - r.x[0]) / 2, (r.y[1] - r.y[0]) / 2, (r.z[1] - r.z[0]) / 2, (r.x[0] + r.x[1]) / 2, (r.y[0] + r.y[1]) / 2, (r.z[0] + r.z[1]) / 2);
    addStatic(w, (sl.x[1] - sl.x[0]) / 2, (sl.y[1] - sl.y[0]) / 2, (sl.z[1] - sl.z[0]) / 2, (sl.x[0] + sl.x[1]) / 2, (sl.y[0] + sl.y[1]) / 2, (sl.z[0] + sl.z[1]) / 2);
    return R.bodies.map((b) => ({ b, rb: addBody(w, b) }));
  }, { hit: 0.9, tolP: 0.003, tolR: 0.8 * Math.PI / 180, iters: 10 });

  // ---------------------------------------------------------------- the street (world coordinates)
  const S = GK_ST;
  const street = run('street', (w) => {
    addStatic(w, 2000, 0.5, 2000, 0, -0.5, 0, 1.0);                                                    // the ground
    const k = S.kerbH;
    for (const [z0, z1] of S.pav) addStatic(w, (S.east + 300) / 2, k / 2, (z1 - z0) / 2, (S.east - 300) / 2, k / 2, (z0 + z1) / 2);
    addStatic(w, (S.park.x[1] - S.park.x[0]) / 2, 0.55, 0.03, (S.park.x[0] + S.park.x[1]) / 2, 0.55, S.park.z[1] + 0.25, 0.6);     // the railings
    addStatic(w, 0.03, 0.55, (S.park.z[1] - S.park.z[0]) / 2, S.park.x[1], 0.55, (S.park.z[0] + S.park.z[1]) / 2, 0.6);
    for (const bl of [S.blockA, S.blockB]) addStatic(w, (bl.x[1] - bl.x[0]) / 2, bl.h / 2, (bl.z[1] - bl.z[0]) / 2, (bl.x[0] + bl.x[1]) / 2, bl.h / 2, (bl.z[0] + bl.z[1]) / 2);
    const N = S.church.nave, Tw = S.church.tower;
    addStatic(w, (N.x[1] - N.x[0]) / 2, N.h / 2, (N.z[1] - N.z[0]) / 2, (N.x[0] + N.x[1]) / 2, N.h / 2, (N.z[0] + N.z[1]) / 2, 0.7);
    addStaticHull(w, [[N.x[0], N.h, N.z[0]], [N.x[1], N.h, N.z[0]], [N.x[0], N.h, N.z[1]], [N.x[1], N.h, N.z[1]], [N.x[0], N.ridge, (N.z[0] + N.z[1]) / 2], [N.x[1], N.ridge, (N.z[0] + N.z[1]) / 2]], 0.6);
    addStatic(w, (Tw.x[1] - Tw.x[0]) / 2, Tw.h / 2, (Tw.z[1] - Tw.z[0]) / 2, (Tw.x[0] + Tw.x[1]) / 2, Tw.h / 2, (Tw.z[0] + Tw.z[1]) / 2, 0.7);
    return S.bodies.map((b) => ({ b, rb: addBody(w, b, { ccd: b.kind === 'car', angDamp: b.kind === 'ball' ? 0.02 : 0.08 }) }));
  }, {
    hit: 2.5, tolP: (r) => 0.01 + 0.004 * Math.max(0, r[2]), tolR: 1.0 * Math.PI / 180, dp: 3,
    // air drag (k = mg / vt²: the body falls at vt) and, for the balls, rolling resistance on the ground
    forces(bodies, g) {
      for (const { rb, b } of bodies) {
        const v = rb.linvel(), sp = Math.hypot(v.x, v.y, v.z), kd = b.m * G / (b.vt * b.vt);
        let fx = -kd * sp * v.x, fy = -kd * sp * v.y, fz = -kd * sp * v.z;
        if (b.rr) {
          const p = rb.translation(), r = b.parts[0][1], gn = -g.y;
          if (p.y < r + 0.03 && gn > 0) {
            const gt = Math.hypot(g.x, g.z);
            if (sp < 0.03 && gt < b.rr * gn) { rb.setLinvel({ x: 0, y: Math.min(0, v.y), z: 0 }, true); rb.setAngvel({ x: 0, y: 0, z: 0 }, true); fx = -b.m * g.x; fz = -b.m * g.z; }
            else if (sp > 1e-4) { const f = b.rr * b.m * gn / sp; fx -= f * v.x; fz -= f * v.z; }
          }
        }
        rb.resetForces(false); rb.addForce({ x: fx, y: fy, z: fz }, true);
      }
    },
  });
  const data = { hz: HZ, t0: REC0, end: END, room, street };
  const js = `/* The baked rigid-body simulation for gravity-keeps-tilting.html, written by bake-sim.cjs (do not edit by hand:
   change layout.js or bake-sim.cjs and re-run it). Tracks: [frame (${HZ} Hz from s = ${REC0}), x, y, z, qx, qy, qz, qw] keyframes,
   linear between them. Events: [s, body, Δv m/s, x, y, z]. */
window.GK_SIM = ${JSON.stringify(data)};
`;
  fs.writeFileSync(path.join(DIR, 'simdata.js'), js);
  console.log(`wrote simdata.js ${(js.length / 1e6).toFixed(2)} MB in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
