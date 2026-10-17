/* =====================================================================
   SET · SKY — way 1, the wing. A red-and-white aerobatic monoplane (generic, no markings) above a sea of evening
   clouds. Moving ribbons show the air: it meets the wing and leaves it bent DOWN (the downwash); the wing is pushed
   UP (lift, the amber arrow). Upside down, the pilot holds the nose up, so the wing still meets the air at an angle
   and still throws it down: lift still points at the sky (that is what aerobatic planes do). Then the speed bleeds
   away: lift goes with v² (L = ½ρv²SC_L); the pilot raises the nose to make up for it until the flow tears off the
   top of the wing (the stall), the lift collapses, the nose drops and it falls. A wing cannot hang still.
   The plane flies at the origin; the world (clouds) streams past at its airspeed.
   ===================================================================== */

// airspeed (m/s): 250 km/h cruising, bleeding to 80 km/h by the stall, picking up again in the fall
function trSkyV(t) {
  const slow = MathX.smooth(t, TR.slow, TR.stall + 0.2), fall = MathX.smooth(t, TR.fall, TR.suck);
  return MathX.lerp(MathX.lerp(69, 22, slow), 38, fall);
}
// lift as a fraction of the weight it can carry (1 = level flight): ∝ v², times what the angle of attack adds; after
// the stall it collapses
function trSkyLift(t) {
  const v = trSkyV(t), aoaBoost = 1 + 2.4 * MathX.smooth(t, TR.slow, TR.stall);
  const st = MathX.smooth(t, TR.stall - 0.1, TR.stall + 0.5);
  return Math.min(1.15, (v * v) / (69 * 69) * aoaBoost) * (1 - 0.75 * st);
}
// the plane's attitude: roll (rad, about its length), pitch (rad, nose up +), height (m) and sideways drift
function trSkyAtt(t) {
  const inv = MathX.smooth(t, TR.inv, TR.inv + 1.3) * (1 - MathX.smooth(t, TR.slow - 1.3, TR.slow - 0.1));
  const roll = Math.PI * inv + 0.06 * Math.sin(t * 0.9);
  const noseUpInv = 0.12 * MathX.smooth(t, TR.noseUp - 0.1, TR.noseUp + 0.6) * inv;
  const pull = 0.28 * MathX.smooth(t, TR.slow, TR.stall);                      // the pilot pulls to hold height
  const drop = MathX.smooth(t, TR.stall + 0.1, TR.fall + 1.0);
  const pitch = 0.035 + noseUpInv + pull * (1 - drop) - 0.75 * drop;
  // height: level, then it sinks after the stall and falls away
  const u = Math.max(0, t - TR.stall - 0.2), y = -0.5 * 4.5 * u * u * MathX.smooth(t, TR.stall, TR.stall + 0.6) - 0.25 * Math.sin(t * 0.7);
  return { roll, pitch, y, yaw: 0.02 * Math.sin(t * 0.5) + 0.25 * drop * Math.sin(u * 1.4) };
}
// the world's distance travelled (m), integrated once
const TR_SKYX = { dt: 1 / 60, xs: null };
function trSkyX(t) {
  if (!TR_SKYX.xs) { TR_SKYX.t0 = TR.plane - 2; const n = Math.ceil((TR.suck + 2 - TR_SKYX.t0) / TR_SKYX.dt); TR_SKYX.xs = new Float64Array(n + 1); for (let i = 1; i <= n; i++) TR_SKYX.xs[i] = TR_SKYX.xs[i - 1] + trSkyV(TR_SKYX.t0 + i * TR_SKYX.dt) * TR_SKYX.dt; }
  const f = MathX.clamp((t - TR_SKYX.t0) / TR_SKYX.dt, 0, TR_SKYX.xs.length - 1.001), i = Math.floor(f);
  return MathX.lerp(TR_SKYX.xs[i], TR_SKYX.xs[i + 1], f - i);
}

function trPlane() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const white = new THREE.MeshPhysicalMaterial({ color: '#efece6', roughness: 0.32, metalness: 0.1, clearcoat: 0.8 });
  const red = new THREE.MeshPhysicalMaterial({ color: '#c0281f', roughness: 0.32, metalness: 0.1, clearcoat: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1c1f24', roughness: 0.5, metalness: 0.4 });
  const canopyM = new THREE.MeshPhysicalMaterial({ color: '#16202a', roughness: 0.04, metalness: 0.4, clearcoat: 1, transparent: true, opacity: 0.85 });
  // fuselage: elliptical rings along x (nose at +x)
  const R = [[3.2, 0.42, 0.36, 0.05], [2.9, 0.5, 0.5, 0.02], [2.2, 0.56, 0.62, 0.05], [1.0, 0.56, 0.66, 0.1], [0.0, 0.5, 0.62, 0.12], [-1.2, 0.36, 0.46, 0.12], [-2.6, 0.18, 0.28, 0.15], [-3.6, 0.08, 0.16, 0.18]];
  {
    const seg = 18, pos = [], idx = [];
    R.forEach(([x, w, h, yc]) => { for (let k = 0; k < seg; k++) { const a = k / seg * Math.PI * 2; pos.push(x, yc + Math.sin(a) * h * 0.5, Math.cos(a) * w * 0.5 * (1 + 0.15 * Math.max(0, -Math.sin(a)))); } });
    for (let i = 0; i < R.length - 1; i++) for (let k = 0; k < seg; k++) { const a = i * seg + k, b = i * seg + (k + 1) % seg; idx.push(a, a + seg, b, b, a + seg, b + seg); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx); gg.computeVertexNormals();
    const m = new THREE.Mesh(gg, white); m.castShadow = true; body.add(m);
  }
  // a wing from an airfoil section, tapered toward the tips; low on the fuselage
  function wing(span, root, tip, thick, mat, y, x) {
    const sh = new THREE.Shape(); const pts = [];
    for (let k = 0; k <= 16; k++) { const u = k / 16, yt = thick * 5 * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u * u * u - 0.1015 * u * u * u * u); pts.push([0.25 - u, yt]); }
    sh.moveTo(pts[0][0], pts[0][1]); for (const p of pts) sh.lineTo(p[0], p[1]); for (let k = pts.length - 1; k >= 0; k--) sh.lineTo(pts[k][0], -pts[k][1]);
    const gg = new THREE.ExtrudeGeometry(sh, { depth: span, bevelEnabled: false, curveSegments: 4 }); gg.translate(0, 0, -span / 2);
    const P = gg.attributes.position;
    for (let i = 0; i < P.count; i++) { const zz = Math.abs(P.getZ(i)) / (span / 2), c = MathX.lerp(root, tip, zz); P.setX(i, P.getX(i) * c); P.setY(i, P.getY(i) * c); }
    gg.computeVertexNormals();
    const m = new THREE.Mesh(gg, mat); m.position.set(x, y, 0); m.castShadow = true; body.add(m); return m;
  }
  wing(7.6, 1.9, 1.0, 0.15, white, -0.12, 0.7);
  // red tips and a red band
  for (const sz of [-1, 1]) { const tipM = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.1, 0.7), red); tipM.position.set(0.55, -0.12, sz * 3.45); body.add(tipM); }
  wing(2.9, 0.95, 0.6, 0.1, red, 0.2, -3.0);
  {
    const sh = new THREE.Shape(); sh.moveTo(-3.6, 0.2); sh.lineTo(-2.7, 0.3); sh.lineTo(-3.3, 1.35); sh.lineTo(-3.85, 1.35); sh.lineTo(-3.95, 0.2);
    const gg = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false }); gg.translate(0, 0, -0.04);
    body.add(new THREE.Mesh(gg, red));
  }
  const can = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), canopyM); can.scale.set(1.1, 0.42, 0.34); can.position.set(0.6, 0.32, 0); body.add(can);
  // red sunburst stripes on the fuselage sides
  for (const sz of [-1, 1]) for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.07, 0.02), red); s.position.set(1.4 - k * 0.2, 0.05 - k * 0.12, sz * 0.31); s.rotation.z = 0.12 + k * 0.08; body.add(s); }
  // engine and propeller: spinner, a blurred disc, two faint blades
  const sp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 14), red); sp.rotation.z = -Math.PI / 2; sp.position.set(3.45, 0.06, 0); body.add(sp);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.0, 32), new THREE.MeshBasicMaterial({ color: '#202428', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); disc.rotation.y = Math.PI / 2; disc.position.set(3.3, 0.06, 0); body.add(disc);
  const prop = new THREE.Group(); prop.position.set(3.32, 0.06, 0); body.add(prop);
  for (let k = 0; k < 2; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.9, 0.14), new THREE.MeshStandardMaterial({ color: '#15171a', transparent: true, opacity: 0.35 })); b.rotation.x = k * Math.PI; prop.add(b); }
  // landing gear (fixed, with spats)
  for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.08), white); leg.position.set(1.6, -0.6, sz * 0.75); leg.rotation.x = sz * 0.35; body.add(leg);
    const spat = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), white); spat.scale.set(1.5, 0.75, 0.55); spat.position.set(1.6, -1.02, sz * 0.92); body.add(spat);
  }
  return { g, body, prop };
}

TR_SET_BUILDERS.sky = (app) => {
  const S = trSet(app, { sky: '#7f9cc0', fog: 0.0011, fogColor: '#c8b49a', fov: 40, sun: [-60, 40, 50], sunColor: '#ffe2b8', sunI: 3.0,
    hemi: ['#a9c4e6', '#8a7660', 0.9], shadow: null, far: 6000, env: ['#7f9cc0', '#f0c99a', '#7a6a5a'] });
  const { scene, camera } = S;
  trSky(scene, '#3a68a6', '#f1c58f', '#c9a682', { r: 5000, sunDir: [-0.55, 0.12, 0.8], sunGlow: '#ffb36a', hw: 0.2 });
  // the cloud sea: puffs of faceted spheres, in two layers, tiled along x so they stream past forever
  const SPAN = 1800;
  const cloudM = new THREE.MeshStandardMaterial({ color: '#f6efe6', roughness: 1, flatShading: true, emissive: new THREE.Color('#5a4a40'), emissiveIntensity: 0.25 });
  const NC = 900, clouds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), cloudM, NC);
  const base = [];
  for (let i = 0, k = 0; k < NC; i++) {
    const cx = trR(i, 1) * SPAN - SPAN / 2, layer = trR(i, 2) < 0.75 ? 0 : 1, cy = layer ? -35 + 30 * trR(i, 3) : -140 - 30 * trR(i, 3), cz = (trR(i, 4) - 0.5) * (layer ? 900 : 2400) - (layer ? 160 : 400);
    if (layer && Math.abs(cz) < 40) continue;
    const n = 4 + Math.floor(trR(i, 5) * 6), sc = (layer ? 9 : 26) * (0.6 + trR(i, 6));
    for (let j = 0; j < n && k < NC; j++, k++) base.push([cx + (trR(i * 9 + j, 7) - 0.5) * sc * 2.6, cy + trR(i * 9 + j, 8) * sc * 0.5, cz + (trR(i * 9 + j, 9) - 0.5) * sc * 1.6, sc * (0.55 + 0.6 * trR(i * 9 + j, 10))]);
  }
  clouds.count = base.length; scene.add(clouds);
  // far below: farmland through the haze
  {
    const g = new THREE.PlaneGeometry(9000, 9000, 60, 60); g.rotateX(-Math.PI / 2);
    const P = g.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); c.set(['#6c7a4a', '#8a8a5a', '#5a6a40', '#9a8a60'][Math.floor(hash2(Math.floor(x / 300), Math.floor(z / 300)) * 4)]); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })); m.position.y = -900; scene.add(m);
    S.ground = m;
  }
  const plane = trPlane(); scene.add(plane.g);
  // the air: ribbons streaming past the wing, a moving dash along each (the air's own speed)
  const NS = 14, NP = 64, X0 = 16, X1 = -26;
  const rib = new THREE.BufferGeometry(), rp = new Float32Array(NS * NP * 2 * 3), ru = new Float32Array(NS * NP * 2 * 2), ridx = [];
  for (let s = 0; s < NS; s++) for (let i = 0; i < NP - 1; i++) { const a = (s * NP + i) * 2; ridx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  rib.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rib.setAttribute('uv', new THREE.BufferAttribute(ru, 2)); rib.setIndex(ridx);
  const ribM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uA; varying vec2 vU;
      void main(){ float d = fract(vU.x * 0.16 - uT); float dash = smoothstep(0.0, 0.08, d) * (1.0 - smoothstep(0.55, 0.75, d));
        float edge = 1.0 - pow(abs(vU.y * 2.0 - 1.0), 2.0); float fade = smoothstep(0.0, 0.12, vU.x / 42.0) * (1.0 - smoothstep(0.82, 1.0, vU.x / 42.0));
        gl_FragColor = vec4(mix(vec3(0.75, 0.9, 1.0), vec3(1.0), 0.3), uA * (0.35 + 0.65 * dash) * edge * fade * 0.85); }` });
  const ribbons = new THREE.Mesh(rib, ribM); ribbons.frustumCulled = false; ribbons.renderOrder = 4; scene.add(ribbons);
  // the arrows: lift (amber, up from the wing), the air thrown down (blue, behind), the weight (white, in the stall)
  const ambM = new THREE.MeshStandardMaterial({ color: '#ffb066', emissive: new THREE.Color('#ff9a40'), emissiveIntensity: 2.2 });
  const bluM = new THREE.MeshStandardMaterial({ color: '#6ab4ff', emissive: new THREE.Color('#3d8fff'), emissiveIntensity: 2.0 });
  const whiM = new THREE.MeshStandardMaterial({ color: '#f4f0e8', emissive: new THREE.Color('#d8d4cc'), emissiveIntensity: 1.2 });
  const liftA = trArrow(1, 0.09, ambM), airA = trArrow(1, 0.08, bluM), wA = trArrow(1, 0.08, whiM);
  scene.add(liftA, airA, wA);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sv = new THREE.Vector3();
  const showArrow = (A, from, dir, L, a) => { A.visible = a > 0.01 && L > 0.05; A.position.copy(from); A.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); A.scale.set(1, Math.max(0.01, L * a), 1); };
  return {
    scene, camera,
    frame(t, shot) {
      const X = trSkyX(t), att = trSkyAtt(t), L = trSkyLift(t), V = trSkyV(t);
      // the plane
      plane.g.position.set(0, att.y, 0);
      plane.g.rotation.set(0, 0, 0); plane.g.rotation.order = 'YZX';
      plane.g.rotation.y = att.yaw; plane.g.rotation.z = att.pitch; plane.g.rotation.x = att.roll;
      plane.prop.rotation.x = t * 50;
      plane.g.updateMatrixWorld(true);
      // the clouds stream past
      for (let i = 0; i < base.length; i++) {
        const [bx, by, bz, sc] = base[i];
        let x = ((bx - X) % SPAN + SPAN * 1.5) % SPAN - SPAN / 2;
        clouds.setMatrixAt(i, m4.compose(v.set(x, by, bz), q.identity(), sv.set(sc * 1.4, sc * 0.75, sc)));
      }
      clouds.instanceMatrix.needsUpdate = true;
      S.ground.position.x = -((X * 0.15) % 600);
      // the air ribbons: world-frame, around the plane's wing; downwash behind the wing ∝ lift, torn after the stall
      const stall = MathX.smooth(t, TR.stall - 0.1, TR.stall + 0.6), wingC = new THREE.Vector3(0.7, -0.12, 0).applyMatrix4(plane.g.matrixWorld);
      const aoa = att.pitch, flow = (t - TR.plane) * V / 6.5;
      ribM.uniforms.uT.value = flow; ribM.uniforms.uA.value = MathX.smooth(t, TR.lift - 0.2, TR.lift + 0.6) * (1 - MathX.smooth(t, TR.fall + 0.6, TR.fall + 1.6));
      let k = 0;
      for (let s = 0; s < NS; s++) {
        const row = s % 7, side = s < 7 ? 1 : -1, h0 = (row - 3) * 0.55 + (row >= 3 ? 0.15 : -0.15), zz = side * (1.2 + 0.9 * (row % 3));
        for (let i = 0; i < NP; i++) {
          const xr = X0 + (X1 - X0) * i / (NP - 1);                                    // relative to the wing, + ahead
          const near = Math.exp(-Math.pow(h0 / 1.8, 2));
          // around the wing: up over the top ahead of it (upwash), then bent down behind it
          const up = 0.35 * L * near * Math.exp(-Math.pow((xr - 1.5) / 2.2, 2));
          const behind = MathX.smooth(-xr, -0.5, 6);
          let dy = up - L * (0.35 + 1.1 * near) * behind * (1 + 0.06 * -Math.min(0, xr));
          // the stall: behind the wing the top streams wander and curl
          const turb = stall * behind * near * (h0 > -0.2 ? 1 : 0.4);
          dy += turb * (0.9 * Math.sin(xr * 0.9 - t * 9 + s) + 0.5 * Math.sin(xr * 2.1 + t * 5 + s * 2));
          const y = wingC.y + h0 + dy + Math.sin(-aoa) * 0 + (xr > 0 ? xr * Math.sin(aoa) * 0.0 : 0);
          const a = (s * NP + i) * 2, w = 0.05;
          rp.set([wingC.x + xr, y - w, zz + turb * 0.3 * Math.sin(xr + t * 4)], a * 3); rp.set([wingC.x + xr, y + w, zz + turb * 0.3 * Math.sin(xr + t * 4)], (a + 1) * 3);
          ru.set([(X0 - xr), 0], a * 2); ru.set([(X0 - xr), 1], (a + 1) * 2);
        }
      }
      rib.attributes.position.needsUpdate = true; rib.attributes.uv.needsUpdate = true;
      const arA = MathX.smooth(t, TR.liftW - 0.4, TR.liftW + 0.2) * (1 - MathX.smooth(t, TR.fall + 0.6, TR.fall + 1.2));
      showArrow(liftA, wingC.clone().add(new THREE.Vector3(0, 0.35, 0)), new THREE.Vector3(0, 1, 0), 3.2 * L, arA);
      showArrow(airA, wingC.clone().add(new THREE.Vector3(-4.6, -0.6, 0)), new THREE.Vector3(-0.35, -1, 0), 2.6 * L, MathX.smooth(t, trW(5, 'down').start - 0.2, trW(5, 'down').start + 0.3) * (1 - MathX.smooth(t, TR.fall + 0.6, TR.fall + 1.2)));
      showArrow(wA, wingC.clone().add(new THREE.Vector3(0, -0.6, 0)), new THREE.Vector3(0, -1, 0), 3.0, MathX.smooth(t, TR.stall - 0.3, TR.stall + 0.3) * (1 - MathX.smooth(t, TR.fall + 0.8, TR.fall + 1.4)));
      // the camera
      const cam = camera, P = plane.g.position;
      if (t < TR.lift) {
        const kk = trK(t, TR.plane, TR.lift);
        trCamD(cam, [P.x + trLerp(10, 7, kk), P.y + trLerp(2.2, 1.0, kk), trLerp(13, 15, kk)], [P.x - 0.5, P.y, 0], trLerp(38, 42, kk), t, 0.7);
      } else if (t < TR.fall) {
        const kk = trK(t, TR.lift, TR.fall);
        trCamD(cam, [P.x - 3.2, P.y * 0.5 + trLerp(0.8, 0.2, kk), trLerp(25, 23, kk)], [P.x - 3.2, P.y * 0.6 - 0.4, 0], 44, t, 0.5);
      } else {
        // it falls away; the camera tips down and follows it, lagging, so it shrinks but stays in frame
        const kk = trK(t, TR.fall, TR.suck);
        trCamD(cam, [-3.2, P.y * 0.6 - 1.0, trLerp(23, 27, kk)], [P.x * 0.3 - 2, P.y * 0.92, 0], 46, t, 0.5);
      }
    },
    labels(t, shot, app) {
      const out = [], P = plane.g.position;
      trLab(out, camera, new THREE.Vector3(0.7, 3.3 * trSkyLift(t) + 0.8, 0).add(P), '<span class="d"></span>LIFT', MathX.smooth(t, TR.liftW - 0.1, TR.liftW + 0.3) * (1 - MathX.smooth(t, TR.inv - 0.3, TR.inv)));
      trLab(out, camera, new THREE.Vector3(-5.2, -3.4, 0).add(P), '<span class="d" style="box-shadow:0 0 0 calc(var(--u) * 3) #6ab4ff"></span>AIR PUSHED DOWN', MathX.smooth(t, trW(5, 'down').start, trW(5, 'down').start + 0.4) * (1 - MathX.smooth(t, TR.inv - 0.3, TR.inv)));
      trLab(out, camera, new THREE.Vector3(2.2, 1.4, 0).add(P), '<span class="d"></span>NOSE UP<small>THE WING STILL MEETS THE AIR AT AN ANGLE</small>', MathX.smooth(t, TR.noseUp + 0.2, TR.noseUp + 0.6) * (1 - MathX.smooth(t, TR.slow - 0.6, TR.slow - 0.2)));
      trLab(out, camera, new THREE.Vector3(-3.0, 1.6, 0).add(P), '<span class="d" style="background:#ff6a5a;box-shadow:0 0 0 calc(var(--u) * 3) #ff6a5a"></span>STALL<small>THE AIR TEARS OFF THE WING</small>', MathX.smooth(t, TR.stall + 0.1, TR.stall + 0.4) * (1 - MathX.smooth(t, TR.fall + 0.6, TR.fall + 1.0)));
      return out;
    },
    grade(t, p) { p.saturation = 1.1; p.contrast = 1.06; p.warmth = 0.05; p.bloom = 0.32; p.vignette = 0.48; },
  };
};
