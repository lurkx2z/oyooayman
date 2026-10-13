/* =====================================================================
   SET · MINE — a platinum open pit in South Africa's Bushveld, late afternoon, "the same second" as the vanish.
   Terraced benches spiral down to a green pool; yellow haul trucks crawl along the bench roads raising dust; a
   processing plant and a pale tailings dam sit on the dry veld. At AF.mineGo the land goes: a seam sweeps in from the
   horizon toward the camera and everything behind it is simply not there any more. The sky stays. Under it, 4 km
   down, is the floor of the new basin in shadow.
   ===================================================================== */

// the pit: an ellipse of benches (15 m high, 34 m wide), a flat floor with water, gentle veld outside
function afMineH(x, z) {
  const r = Math.hypot(x / 1.3, z), R0 = 560, bw = 34, bh = 15;
  const veld = 3 * fbm1(x * 0.004, 3) + 2 * fbm1(z * 0.005 + 40, 5);
  if (r >= R0) return veld * MathX.smooth(r, R0, R0 + 200);
  const d = (R0 - r) / bw, n = Math.floor(d), f = d - n;
  const h = -(n + MathX.smooth(f, 0.5, 0.92)) * bh;
  return Math.max(h, -bh * 12.4) - 0.6 * fbm1(x * 0.05 + z * 0.03, 9);
}

const AF_MINE_HAZE = new THREE.Color('#77726a');   // the haze over the abyss: cooler, darker
AF_SET_BUILDERS.mine = (app) => {
  const S = afSet(app, { sky: '#c9b79a', fog: 0.00005, fogColor: '#b4a896', fov: 38, sun: [620, 230, -260], sunColor: '#ffd3a0', sunI: 2.6,
    hemi: ['#b9c7d6', '#6b5240', 0.45], shadow: 2048, shadowR: 900, shadowFar: 2000, far: 70000, env: ['#9fb2c6', '#c9b79a', '#5b4a3c'] });
  const { scene, camera, U } = S;
  afSky(scene, '#6f8fb3', '#dcc6a2', '#5a5248', { sunDir: [0.86, 0.32, -0.36], sunGlow: '#ffc27a', r: 20000 });
  // ---- the ground: one heightfield (3.2 km) + a ring of veld to the horizon
  const N = 420, L = 3200, g = new THREE.PlaneGeometry(L, L, N, N); g.rotateX(-Math.PI / 2);
  const P = g.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
  const veldA = new THREE.Color('#857a50'), veldB = new THREE.Color('#9c8c62'), rockA = new THREE.Color('#5e4a3e'), rockB = new THREE.Color('#7d7268'), road = new THREE.Color('#c4b092'), pool = new THREE.Color('#2c4a40');
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), r = Math.hypot(x / 1.3, z);
    let y = afMineH(x, z);
    if (Math.hypot(x, z) > 1500) y = -3;            // hidden under the ring
    P.setY(i, y);
    if (r < 560) {
      const d = (560 - r) / 34, f = d - Math.floor(d), top = f < 0.5 ? 1 : 0;
      // rock strata: alternating rust and grey bands down the pit; the bench tops are dusty haul roads
      c.copy(rockA).lerp(rockB, MathX.clamp(0.5 + 0.5 * Math.sin(Math.floor(d) * 1.7) + 0.3 * fbm1(x * 0.02 + z * 0.013, 4)));
      if (top) c.lerp(road, 0.6);
      if (y < -15 * 12.2) c.copy(pool);
    } else {
      c.copy(veldA).lerp(veldB, 0.5 + 0.5 * fbm1(x * 0.006 - z * 0.004, 7));
      c.multiplyScalar(0.92 + 0.16 * hash2(Math.floor(x / 9), Math.floor(z / 9)));
    }
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const ground = new THREE.Mesh(g, afMat('#ffffff', { vertexColors: true, roughness: 0.95 }, U)); ground.receiveShadow = true; ground.castShadow = true; scene.add(ground);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1450, 26000, 96, 1), afMat('#968a62', { roughness: 1 }, U)); ring.rotation.x = -Math.PI / 2; ring.position.y = -0.4; ring.receiveShadow = true; scene.add(ring);
  // below the land: the floor of the new basin, 4 km down (hidden until the land above it has gone)
  afFloor(scene, 4000, { x: -760, z: 470, a: '#241f1b', b: '#6a5a4a' });
  // ---- scrub: dark bushes as instanced blobs on the veld
  const bushG = new THREE.IcosahedronGeometry(1, 0), bushM = afMat('#4d5532', { roughness: 1, flatShading: true }, U), NB = 2600;
  const bush = new THREE.InstancedMesh(bushG, bushM, NB), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
  let nb = 0;
  for (let i = 0; nb < NB && i < NB * 3; i++) {
    const x = (afR(i, 3) - 0.5) * 3000, z = (afR(i, 4) - 0.5) * 3000;
    if (Math.hypot(x / 1.3, z) < 600 || Math.hypot(x, z) > 1480) continue;
    const s = 2 + 4 * afR(i, 5);
    bush.setMatrixAt(nb++, m4.compose(sv.set(x, afMineH(x, z) + s * 0.4, z), q, new THREE.Vector3(s, s * 0.7, s)));
  }
  bush.count = nb; bush.castShadow = true; scene.add(bush);
  // ---- the plant: sheds, tanks, a stack; the tailings dam
  const steel = afMat('#9a9a96', { roughness: 0.55, metalness: 0.3 }, U), rust = afMat('#7a5a44', { roughness: 0.8 }, U), white = afMat('#d8d4cc', { roughness: 0.6 }, U);
  const plant = new THREE.Group(); plant.position.set(820, 0, -260); scene.add(plant);
  afBox(120, 34, 60, steel, 0, 17, 0, plant); afBox(70, 46, 40, rust, -110, 23, 30, plant); afBox(50, 22, 80, white, 90, 11, 60, plant);
  for (let i = 0; i < 4; i++) afCyl(14, 14, 26, white, 40 + i * 34, 13, -70, plant, 24);
  afCyl(4, 4, 90, steel, 60, 45, 10, plant, 12);   // a stack
  const dam = new THREE.Mesh(new THREE.CircleGeometry(340, 48), afMat('#cfc3a5', { roughness: 0.9 }, U)); dam.rotation.x = -Math.PI / 2; dam.position.set(-1050, 1.2, 520); dam.receiveShadow = true; scene.add(dam);
  // ---- haul trucks on the bench roads
  const yel = afMat('#d9a520', { roughness: 0.5 }, U), blk = afMat('#1d1c1b', { roughness: 0.9 }, U), grey = afMat('#59544c', { roughness: 0.7 }, U);
  const trucks = [];
  const mkTruck = () => {
    const t = new THREE.Group();
    afBox(13, 2.2, 7.5, yel, 0, 3.2, 0, t);                                 // chassis
    const bed = afBox(9.5, 4.2, 8.4, yel, -1.6, 6.2, 0, t); bed.rotation.z = 0.06;   // the dump body
    afBox(3.2, 3, 3.4, grey, 4.6, 6.3, -1.8, t);                            // cab
    afBox(2.6, 1.6, 7.6, yel, 5.6, 4.6, 0, t);                              // the canopy deck
    for (const [x, z] of [[4.4, 3.5], [4.4, -3.5], [-3.2, 3.6], [-3.2, -3.6]]) { const w = afCyl(1.9, 1.9, 1.9, blk, x, 1.9, z, t, 14); w.rotation.x = Math.PI / 2; }
    scene.add(t); return t;
  };
  const LANES = [[1, -0.03, 2.62], [4, -0.04, 1.7], [6, 0.045, 3.1], [3, -0.05, 4.4], [8, 0.04, 2.2], [5, 0.035, 5.3]];
  for (const l of LANES) trucks.push({ g: mkTruck(), bench: l[0], w: l[1], a0: l[2] });
  const dust = new BillboardSystem(scene, 700, false);
  const truckAt = (T, t) => {
    const r = 560 - (T.bench + 0.25) * 34, a = T.a0 + T.w * t;
    const x = Math.cos(a) * r * 1.3, z = Math.sin(a) * r, y = afMineH(x, z);
    return { x, y, z, yaw: -a - (T.w > 0 ? Math.PI / 2 : -Math.PI / 2) };
  };
  return {
    scene, camera,
    frame(t, shot) {
      const k = afK(t, AF.mine, AF.platinum, Ease.inOutSine);
      const dn = afK(t, AF.mineGo + 0.5, AF.platinum, Ease.inOutSine);
      // from just above the rim, across the pit; after the vanish the camera tips down into the abyss
      afCam(camera, afV([-820, 150, 520], [-700, 135, 430], k), afV(afV([200, -120, -60], [240, -130, -40], k), [300, -900, -60], dn), 40);
      const fk = MathX.smooth(t, AF.mineGo + 0.3, AF.mineGo + 1.8);
      scene.fog.density = afLerp(0.00005, 0.0000045, fk); scene.fog.color.set('#b4a896').lerp(AF_MINE_HAZE, fk);
      for (const T of trucks) { const p = truckAt(T, t); T.g.position.set(p.x, p.y, p.z); T.g.rotation.y = p.yaw; }
      // dust behind the trucks (each puff is born at the truck's past position and drifts, grows, fades)
      dust.begin(scene.fog);
      // the dust hangs in the air, not on the ground: when the ground goes, air rushes down into the void and takes it
      const fall = Math.max(0, t - AF.mineGo - 1.0), drop = 45 * fall * fall;
      for (let j = 0; j < trucks.length; j++) for (let i = 0; i < 14; i++) {
        const age = ((t * 1.6 + i / 14 + j * 0.37) % 1) * 5.5; if (t - age > AF.mineGo) continue;   // no new dust once the ground is gone
        const p = truckAt(trucks[j], t - age);
        dust.push(p.x + age * 3, p.y + 3 + age * 2.0 - drop, p.z - age * 1.5, 5 + age * 5 + drop * 0.15, i, 0.3 * (1 - age / 5.5), 1.0, 0.72, 0.6, 0.47);
      }
      dust.end();
      // the vanish: a seam from the horizon toward (and past) the camera. s = distance toward the camera / 4.2 km:
      // the horizon is at about -6, the pit at -0.3, the camera at 0; everything with s < K is gone
      const o = camera.position;
      U.uDisO.value.set(o.x, 0, o.z); U.uDisDir.value.set(o.x, 0, o.z).normalize(); U.uDisLen.value = 4200; U.uDisNoise.value = 0.012;
      // (paced so the seam spends its time where we can see it: the horizon in half a second, then the pit, then us at ~1.43 s)
      const u = t - AF.mineGo;
      U.uDisK.value = u < 0 ? -1e3 : u < 0.55 ? afLerp(-6.5, -0.5, 1 - Math.pow(1 - u / 0.55, 2)) : u < 1.4 ? afLerp(-0.5, -0.03, (u - 0.55) / 0.85) : afLerp(-0.03, 0.4, Math.min(1, (u - 1.4) / 0.25));
    },
    grade(t, p) { p.warmth = 0.06; p.saturation = 1.04; p.bloom = 0.35; p.bloomThreshold = 0.95; },
  };
};
