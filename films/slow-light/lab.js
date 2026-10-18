/* =====================================================================
   LAB — it's real (Harvard, Lene Hau's group). An optical table in a dark lab: a steel vacuum chamber in its coils,
   the lasers' amber beams (sodium light, 589 nm), and inside, a cloud of sodium atoms cooled to less than a millionth
   of a degree above absolute zero.
     1999  a pulse of light enters the cloud, squeezes up (slower light, shorter pulse), crawls through at 17 m/s
           (shown hugely magnified and slowed down: the real crossing takes a few millionths of a second) and leaves
     2001  the next pulse is stopped inside: the control laser switches off, the pulse fades into the atoms (they hold
           it), the control laser comes back on, the pulse comes out and goes on its way
   Illustrated; the times are stretched so you can see them.
   ===================================================================== */

const SL_LAB = {
  cloud: [0, 1.06, 0], cloudL: 0.07, cloudR: 0.012,                // the atom cloud (m, magnified for the picture)
  in1: slS('lab') + 6.5, out1: slS('lab') + 12.3,                  // 1999: the pulse enters, leaves the cloud
  in2: SL.held - 1.3,                                               // 2001: enters; stopped at SL.held; let go at SL.release
};

SL_SETS.lab = (app) => {
  const S = slSet(app, { sky: '#030405', fov: 45, near: 0.002, far: 200, hemi: ['#3a4250', '#151210', 0.12] });
  const scene = S.scene, cam = S.camera, C = SL_LAB.cloud;
  scene.environment = slEnv(app.renderer, '#0b0d12', '#2a2e36', '#0a0a0b');
  // ---- the room: dark walls, a work light over the table
  const room = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 10), slStd('#16181c', 0.95, 0, { side: THREE.BackSide })); room.position.set(0, 1.95, 0); scene.add(room);
  const work = new THREE.SpotLight('#dfe6f0', 0, 9, 0.62, 0.7, 1.4); work.position.set(-0.4, 3.4, 0.9); work.target.position.set(0, 0.8, 0); scene.add(work); scene.add(work.target);
  const fill = new THREE.PointLight('#ffb15a', 0, 4, 1.6); fill.position.set(0, 1.3, 0.5); scene.add(fill);
  // ---- the optical table (a grid of threaded holes), its legs
  const holes = slTex(slCanvas(512, 512, (g, W) => {
    g.fillStyle = '#3a3d42'; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.fillStyle = '#16171a'; g.beginPath(); g.arc(16 + i * 32, 16 + j * 32, 5.5, 0, 6.283); g.fill(); }
  }));
  holes.repeat.set(3.0 / 0.4, 1.5 / 0.4);
  const top = slMesh(new THREE.BoxGeometry(3.0, 0.1, 1.5), [slStd('#2a2c30', 0.6), slStd('#2a2c30', 0.6), slStd('#ffffff', 0.45, 0.4, { map: holes }), slStd('#2a2c30', 0.6), slStd('#2a2c30', 0.6), slStd('#2a2c30', 0.6)], 0, 0.85, 0);
  for (const [x, z] of [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]]) slCyl(0.08, 0.1, 0.8, slStd('#1d1f22', 0.7), x, 0.4, z, null, 16);
  // ---- the vacuum chamber: a steel drum along x with windows, end flanges, a pump, the coils round it
  const steel = slStd('#b9bec4', 0.32, 0.9), glassM = slStd('#7f98a8', 0.05, 0.1, { transparent: true, opacity: 0.18, depthWrite: false });
  const drum = slMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.62, 48, 1, true), slStd('#b9bec4', 0.32, 0.9, { side: THREE.DoubleSide }), C[0], C[1], C[2]); drum.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { const f = slMesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 48), steel, C[0] + s * 0.31, C[1], C[2]); f.rotation.z = Math.PI / 2; }
  // the big window facing you (a ring and its glass), and small ones where the beams go in
  { const ring = slMesh(new THREE.TorusGeometry(0.105, 0.016, 12, 48), steel, C[0], C[1], C[2] + 0.2); const g = slMesh(new THREE.CircleGeometry(0.1, 40), glassM, C[0], C[1], C[2] + 0.199); g.renderOrder = 3; }
  // (the drum is cut open where the big window is: a dark disc behind the glass would block the view)
  drum.geometry = (() => { const g = new THREE.CylinderGeometry(0.2, 0.2, 0.62, 64, 8, true); const p = g.attributes.position, idx = [];
    const keep = (i) => { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); return !(z > 0.15 && Math.hypot(x, y) < 0.105); };
    // (cylinder along y before the rotation: y is the drum's axis, x/z its round side; the window faces +z)
    for (let i = 0; i < g.index.count; i += 3) { const a = g.index.getX(i), b = g.index.getX(i + 1), c = g.index.getX(i + 2); if (keep(a) && keep(b) && keep(c)) idx.push(a, b, c); }
    g.setIndex(idx); return g; })();
  drum.material.side = THREE.FrontSide;
  { const inner = slMesh(drum.geometry, slStd('#0c0d0f', 0.9, 0.2, { side: THREE.BackSide, envMapIntensity: 0.05 }), C[0], C[1], C[2]); inner.rotation.z = Math.PI / 2; inner.scale.set(0.99, 1, 0.99); }
  for (const s of [-1, 1]) { const coil = slMesh(new THREE.TorusGeometry(0.25, 0.035, 14, 48), slStd('#b46a2e', 0.4, 0.8), C[0] + s * 0.17, C[1], C[2]); coil.rotation.y = Math.PI / 2; }
  slCyl(0.06, 0.06, 0.32, steel, C[0], C[1] - 0.36, C[2] - 0.05, null, 24);
  slBox(0.3, 0.2, 0.25, slStd('#4a5058', 0.5, 0.5), C[0] + 0.05, 0.99, C[2] - 0.45);
  // posts, mirrors, lenses on the table; two laser heads
  const postM = slStd('#c8ccd0', 0.3, 0.9), blackM = slStd('#1a1b1e', 0.5, 0.3);
  const mount = (x, z, ry, lens) => { slCyl(0.0125, 0.0125, 0.16, postM, x, 0.98, z, null, 12); const h = slMesh(lens ? new THREE.TorusGeometry(0.03, 0.008, 10, 24) : new THREE.CylinderGeometry(0.03, 0.03, 0.015, 24), lens ? postM : blackM, x, 1.06, z); h.rotation.set(lens ? 0 : Math.PI / 2, ry, 0); };
  for (const [x, z, ry, l] of [[-0.9, 0, Math.PI / 2, true], [-0.6, 0, Math.PI / 2, true], [0.7, 0, Math.PI / 2, true], [1.0, 0, Math.PI / 2, false], [0, 0.55, 0, true], [0, -0.55, 0, true], [-1.2, 0.0, 0.8, false], [-1.2, 0.5, 0.8, false]]) mount(x, z, ry, l);
  slBox(0.4, 0.12, 0.14, slStd('#2d3540', 0.4, 0.3), -1.25, 0.96, 0.5); slBox(0.4, 0.12, 0.14, slStd('#2d3540', 0.4, 0.3), 0.5, 0.96, 0.62);
  // ---- the beams (sodium amber): the probe along x through the cloud, the control laser across it (z)
  const beamM = (o) => new THREE.MeshBasicMaterial({ color: '#ffae3c', transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const ray = (a, b, r, m) => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).translate(0, 0.5, 0), m); mesh.position.set(...a); const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); mesh.scale.set(r, d.length(), r); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); mesh.userData.slSkip = true; scene.add(mesh); return mesh; };
  const probeM = beamM(0.12), ctrlM = beamM(0.3);
  ray([-1.2, 1.06, 0.5], [-1.2, 1.06, 0], 0.0025, probeM); ray([-1.2, 1.06, 0], [1.5, 1.06, 0], 0.0025, probeM);
  ray([0.5, 1.06, 0.62], [0, 1.06, 0.62], 0.004, ctrlM); ray([0, 1.06, 0.62], [0, 1.06, -0.75], 0.004, ctrlM);
  // ---- the atom cloud (a cigar of tiny glowing dots) and the pulse
  const puffs = slPuffs(scene, 2400, { additive: true, soft: 1.6 });
  const atoms = []; { const r = new RNG(3101); for (let i = 0; i < 900; i++) { let x, y, z; do { x = r.range(-1, 1); y = r.range(-1, 1); z = r.range(-1, 1); } while (x * x + y * y + z * z > 1); atoms.push([C[0] + x * SL_LAB.cloudL / 2, C[1] + y * SL_LAB.cloudR, C[2] + z * SL_LAB.cloudR, r.next()]); } }
  slPatchAll(scene);
  // the pulse's centre (x) and its length: fast outside, a slow short bead inside; 2001: held at x = 0 from SL.held
  const L2 = SL_LAB.cloudL / 2, vOut = 0.9;
  const pulse = (t) => {
    const runs = [[SL_LAB.in1, SL_LAB.out1, null], [SL_LAB.in2, SL.release + (SL.held - SL_LAB.in2) + 0.4, [SL.held, SL.release]]];
    for (const [a, b, hold] of runs) {
      const lo = a - 1.6, hi = b + 1.6; if (t < lo || t > hi) continue;
      if (t < a) return { x: -L2 - vOut * (a - t), len: 0.12, amp: 1, inside: false };
      if (t > b) return { x: L2 + vOut * (t - b), len: 0.12, amp: 1, inside: false };
      // inside: crawling (the hold, in 2001, stops it and hands it to the atoms)
      let u = t - a, dur = b - a;
      if (hold) { const h = hold[1] - hold[0]; dur -= h; if (t > hold[0]) u = t < hold[1] ? hold[0] - a : u - h; }
      const x = -L2 + 2 * L2 * MathX.clamp(u / dur, 0, 1);
      const amp = hold ? 1 - MathX.smooth(t, hold[0] - 0.1, hold[0] + 0.7) + MathX.smooth(t, hold[1] - 0.1, hold[1] + 0.5) : 1;
      return { x, len: 0.012, amp, inside: true, held: hold ? MathX.smooth(t, hold[0], hold[0] + 0.6) * (1 - MathX.smooth(t, hold[1], hold[1] + 0.5)) : 0 };
    }
    return null;
  };
  const api = {
    scene, camera: cam,
    frame(t, shot) {
      const tl = t - SL.real;
      // the lights come up in the lab; the lasers come on
      const up = MathX.smooth(tl, 0.3, 3.0);
      work.intensity = 26 * up; fill.intensity = 0.9 * up; S.hemi.intensity = 0.12 * up;
      const ctrlOn = !(t > SL.held && t < SL.release);
      probeM.opacity = 0.1 * up; ctrlM.opacity = (ctrlOn ? 0.3 : 0.0) * MathX.smooth(tl, 2.0, 3.0);
      // the camera: across the lab, in to the window, inside (the cloud, magnified), back out a little for 2001
      const kIn = slK(t, SL.lab - 0.5, SL.lab + 5.5), kIn2 = slK(t, SL.lab + 5.0, SL_LAB.in1 - 0.6);
      let eye = slV(slV([1.9, 1.75, 3.2], [0.35, 1.25, 0.9], kIn), [0.1, 1.08, 0.12], kIn2);
      let lk = slV(slV([0, 0.95, 0], [0, 1.06, 0], kIn), [0, 1.06, 0], kIn2);
      eye = slV(eye, [0.11, 1.09, 0.14], slK(t, SL.held - 3, SL.held));
      const dr = slDrift(t, 0.002 + 0.01 * (1 - kIn2), 0.3, 31);
      slCam(cam, [eye[0] + dr[0] + (1 - kIn) * -0.6 * slK(tl, 0, 8), eye[1] + dr[1], eye[2] + dr[2]], lk, slLerp(45, 40, kIn2));
      // the atoms: a faint blue-white haze; where the pulse is, they glow with it; held, they keep its imprint
      puffs.begin();
      const P = pulse(t), vis = MathX.smooth(tl, 1.0, 3.0);
      for (const a of atoms) {
        let k = 0.07 + 0.05 * Math.sin(t * 2 + a[3] * 30);
        if (P && P.inside) { const d = (a[0] - C[0] - P.x) / 0.008; k += 0.5 * Math.exp(-d * d) * P.amp + 0.6 * Math.exp(-d * d) * (P.held || 0); }
        const warm = P && P.held ? Math.exp(-Math.pow((a[0] - C[0] - P.x) / 0.008, 2)) * P.held : 0;
        puffs.add(a[0], a[1], a[2], 0.0016, k * vis, slLerp(0.7, 1, warm), slLerp(0.85, 0.7, warm), slLerp(1, 0.35, warm));
      }
      if (P && P.amp > 0.01) {
        const n = 40;
        for (let i = 0; i < n; i++) {
          const f = (i / (n - 1) - 0.5), x = C[0] + P.x + f * P.len, w = Math.exp(-f * f * 10);
          puffs.add(x, C[1], C[2], P.inside ? 0.006 : 0.012, 0.8 * w * P.amp, 1, 0.8, 0.45);
        }
        puffs.add(C[0] + P.x, C[1], C[2], P.inside ? 0.02 : 0.04, 0.35 * P.amp, 1, 0.75, 0.4);
      }
      puffs.end();
      SL_U.uSlFade.value = 1; SL_U.uSlDop.value = 0; SL_U.uSlFrontOn.value = 0; SL_U.uSlEye.value.copy(cam.position);
      api._P = P;
    },
    labels(t) {
      const L = [], a = (t0, t1) => slWin(t, t0, t1, 0.4, 0.4);
      L.push({ p: [C[0] - 0.02, C[1] + 0.02, C[2]], text: 'ATOM CLOUD', sub: 'LESS THAN A MILLIONTH OF A DEGREE ABOVE ABSOLUTE ZERO', a: a(slS('lab') + 3.0, SL_LAB.in1 - 0.2) });
      L.push({ p: [C[0], C[1] - 0.016, C[2] + 0.004], text: 'CONTROL LASER', sub: t > SL.held && t < SL.release ? 'OFF' : 'ON', a: a(SL.held - 0.8, SL.release + 1.2) });
      return L;
    },
    grade(t, p) { p.bloom = 0.75; p.bloomThreshold = 0.55; p.vignette = 0.6; p.exposure = 1.1; p.contrast = 1.08; p.fade = Math.max(p.fade, 1 - MathX.smooth(t, SL.real, SL.real + 1.2)); },
  };
  return api;
};
