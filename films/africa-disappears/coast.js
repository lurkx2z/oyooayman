/* =====================================================================
   SET · COAST — a European harbour town from above, time-lapse over weeks. As the basin fills, the world's oceans
   fall (the readout counts it): the harbour drains and its boats settle on the mud, the beach becomes a mudflat
   kilometres wide, sandbanks and an old river channel surface, and the shoreline walks out to sea. On "maps" a
   dashed line marks where the coast was a month ago.
   The seabed shelves gently (about 1 m deeper every 50 m), so each metre the sea falls moves the shore ~50 m.
   The water is drawn by the ground's own shader: below the current sea level a point is sea (coloured by depth,
   with a line of surf at the edge); above it, freshly exposed seabed is dark and wet and dries paler with time.
   ===================================================================== */

// the ground height (m) at (x, z): land to the north (z < 0), the shelf to the south
function afCoastH(x, z) {
  const n = 6 * fbm1(x * 0.0012 + 11, 3) + 3 * fbm1(x * 0.004 + z * 0.002, 5);
  if (z < 0) return 2.5 * MathX.smooth(-z, 0, 90) + Math.min(60, -z * 0.03) + n * MathX.smooth(-z, 60, 300) + 14 * fbm1(x * 0.0009 - z * 0.0011, 8) * MathX.smooth(-z, 200, 900);
  let y = -z * 0.019 - 2.2 * fbm1(x * 0.002 + z * 0.0011, 4) * MathX.smooth(z, 0, 400);
  y += 7 * Math.exp(-Math.pow((x - 900 - 0.25 * z) / 300, 2)) * Math.exp(-Math.pow((z - 2600) / 1400, 2));     // a sandbank
  y -= 14 * Math.exp(-Math.pow((x + 700 + 120 * Math.sin(z * 0.0012)) / 120, 2)) * MathX.smooth(z, 0, 600);       // the old river channel
  if (Math.abs(x) < 260 && z > 0 && z < 520) y = Math.min(y, -9);                                                  // the dredged harbour basin
  return y;
}

AF_SET_BUILDERS.coast = (app) => {
  const S = afSet(app, { sky: '#9fb3c6', fog: 0.000022, fogColor: '#a3b6c8', fov: 40, sun: [-900, 1300, 700], sunColor: '#fff4e2', sunI: 2.0,
    hemi: ['#c4d2e0', '#5a5040', 0.45], shadow: 2048, shadowR: 1800, shadowFar: 5000, far: 40000, env: ['#c4d2e0', '#a9b7c4', '#4a4840'] });
  const { scene, camera } = S;
  afSky(scene, '#6f8fb0', '#c9d4dc', '#8899a6', { r: 30000 });
  const U = { uLevel: { value: 0 }, uT: { value: 0 }, uSea0: { value: 0 }, uSea1: { value: 0 }, uTs0: { value: 0 }, uTs1: { value: 1 }, uOld: { value: 0 } };
  // ---- the ground (one heightfield, 16 × 16 km, finer near the harbour by a warped grid)
  const N = 420, g = new THREE.PlaneGeometry(2, 2, N, N); g.rotateX(-Math.PI / 2);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const u = P.getX(i), w = P.getZ(i), x = Math.sign(u) * Math.pow(Math.abs(u), 1.8) * 8000, z = Math.sign(w) * Math.pow(Math.abs(w), 1.8) * 8000 + 2500;
    P.setXYZ(i, x, afCoastH(x, z), z);
  }
  g.computeVertexNormals();
  const gm = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 });
  gm.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCW;').replace('#include <project_vertex>', '#include <project_vertex>\nvCW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vCW; uniform float uLevel, uT, uSea0, uSea1, uTs0, uTs1, uOld;
      float ch(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float cn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(ch(i), ch(i + vec2(1,0)), f.x), mix(ch(i + vec2(0,1)), ch(i + vec2(1,1)), f.x), f.y); }
      float cf(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * cn(p); p = p * 2.1 + 1.7; a *= 0.5; } return v; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      float y = vCW.y, depth = uLevel - y;
      vec2 q = vCW.xz;
      // land: fields and scrub inland, sand at the old beach
      vec3 land = mix(vec3(0.20, 0.25, 0.13), vec3(0.32, 0.31, 0.2), cf(q * 0.004));
      land = mix(vec3(0.62, 0.56, 0.44), land, smoothstep(-70.0, -110.0, vCW.z));     // the beach
      // the seabed: when did it surface? (the sea level falls monotonically: invert it)
      float seaAtY = -y;                                                    // the drop needed to expose this point (m)
      float tExp = mix(uTs0, uTs1, clamp((seaAtY - uSea0) / max(uSea1 - uSea0, 1e-3), 0.0, 1.0));
      float dry = smoothstep(0.0, 2.2, uT - tExp);
      // fresh seabed: dark and wet at the waterline, drying to pale sand; strandlines where the sea paused each day;
      // dark weed beds; pools left behind that hold the sky
      vec3 mud = mix(vec3(0.05, 0.045, 0.035), vec3(0.34, 0.27, 0.17), dry) * (0.75 + 0.5 * cf(q * 0.02));
      mud = mix(mud, vec3(0.06, 0.07, 0.04), smoothstep(0.6, 0.75, cf(q * 0.0045 + 7.0)) * 0.7);
      mud *= 1.0 - 0.3 * smoothstep(0.88, 0.98, fract(seaAtY / 3.0)) * step(0.0, seaAtY);
      float pool = smoothstep(0.66, 0.7, cf(q * 0.009 + 3.0)) * (1.0 - dry * 0.6);
      mud = mix(mud, vec3(0.22, 0.30, 0.38), pool);
      vec3 ground = vCW.z < 0.0 ? land : mud;
      // the sea: shallow turquoise over sand, deep blue
      vec3 sea = mix(vec3(0.05, 0.24, 0.26), vec3(0.008, 0.04, 0.085), smoothstep(0.0, 12.0, depth));
      float surf = (1.0 - smoothstep(0.0, 1.4, abs(depth))) * (0.6 + 0.4 * cn(q * 0.08 + uT));
      diffuseColor.rgb = depth > 0.0 ? sea : ground;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.94, 0.92), surf * 0.8);
      // the old coastline (a dashed map line), shown on "maps"
      float oldC = (1.0 - smoothstep(4.0, 11.0, abs(vCW.z - 6.0))) * step(0.45, fract(vCW.x / 70.0)) * uOld;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.86, 0.35), oldC);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = (uLevel - vCW.y) > 0.0 ? 0.3 : roughnessFactor;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.86, 0.35) * 1.4 * (1.0 - smoothstep(4.0, 11.0, abs(vCW.z - 6.0))) * step(0.45, fract(vCW.x / 70.0)) * uOld;');
  };
  gm.customProgramCacheKey = () => 'afCoast';
  const ground = new THREE.Mesh(g, gm); ground.receiveShadow = true; scene.add(ground);
  scene.environmentIntensity = 0.45;
  // ---- the town: blocks of houses up the slope behind the promenade (walls + roof slabs, instanced)
  const NB = 2600, walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), afMat('#ffffff', { roughness: 0.85 }), NB), roofs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), afMat('#ffffff', { roughness: 0.8 }), NB);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sv = new THREE.Vector3(), c = new THREE.Color();
  const WALLS = ['#e6dccb', '#d8cbb4', '#efe8dc', '#cdbfa8', '#e2d2bd', '#c9c2b6'], ROOFS = ['#9a4b32', '#8a4430', '#5c5a58', '#a65a3a', '#6e6a66'];
  let nb = 0;
  for (let i = 0; nb < NB && i < 9000; i++) {
    const x = (afR(i, 61) - 0.5) * 3200, z = -60 - Math.pow(afR(i, 62), 1.4) * 1300;
    if (Math.abs(x % 90) < 9 || Math.abs(z % 70) < 8) continue;                 // streets
    if (Math.abs(x + 700 + 120 * Math.sin(z * 0.0012)) < 70) continue;          // the river
    const w = 9 + 10 * afR(i, 63), d = 9 + 8 * afR(i, 64), h = 7 + 16 * afR(i, 65) * (1 - MathX.smooth(-z, 300, 1300) * 0.6), y0 = afCoastH(x, z);
    walls.setMatrixAt(nb, m4.compose(v.set(x, y0 + h / 2, z), q, sv.set(w, h, d))); walls.setColorAt(nb, c.set(WALLS[Math.floor(afR(i, 66) * WALLS.length)]));
    roofs.setMatrixAt(nb, m4.compose(v.set(x, y0 + h + 0.6, z), q, sv.set(w + 0.6, 1.2, d + 0.6))); roofs.setColorAt(nb, c.set(ROOFS[Math.floor(afR(i, 67) * ROOFS.length)]));
    nb++;
  }
  walls.count = roofs.count = nb; walls.castShadow = roofs.castShadow = true; walls.receiveShadow = true; scene.add(walls, roofs);
  // ---- the harbour: two breakwaters, a quay, a lighthouse
  const stone = afMat('#8d8a82', { roughness: 0.9 });
  afBox(30, 16, 560, stone, -275, -4, 260); afBox(30, 16, 470, stone, 275, -4, 215);
  afBox(220, 16, 30, stone, 175, -4, 520 - 70);
  afBox(560, 6, 40, afMat('#a29c90', { roughness: 0.9 }), 0, 0.5, -10);
  afCyl(5, 6, 22, afMat('#e8e4dc', { roughness: 0.6 }), -275, 15, 540); afCyl(5.4, 5.4, 4, afMat('#b8402e'), -275, 27, 540);
  // ---- boats: they float at the sea level until it falls below their keel, then sit (and tilt) on the mud
  const boats = [];
  const hullW = afMat('#f0eee8', { roughness: 0.5 }), deckM = afMat('#b89a6a', { roughness: 0.7 }), blueM = afMat('#2c4a6e', { roughness: 0.5 });
  for (let i = 0; i < 46; i++) {
    const inH = i < 34, x = inH ? -220 + (i % 9) * 52 + 10 * afR(i, 71) : -800 + 1700 * afR(i, 72), z = inH ? 90 + Math.floor(i / 9) * 95 + 14 * afR(i, 73) : 900 + 2500 * afR(i, 74);
    const L = inH ? 10 + 12 * afR(i, 75) : 20 + 30 * afR(i, 75), grp = new THREE.Group(); scene.add(grp);
    afBox(L, L * 0.18, L * 0.32, i % 4 ? hullW : blueM, 0, L * 0.09, 0, grp); afBox(L * 0.4, L * 0.14, L * 0.24, deckM, -L * 0.1, L * 0.25, 0, grp);
    if (i % 3 === 0) afCyl(0.25, 0.25, L * 1.2, hullW, 0, L * 0.6, 0, grp, 6);
    boats.push({ grp, x, z, L, yaw: inH ? Math.PI / 2 + (afR(i, 76) - 0.5) * 0.3 : afR(i, 76) * 6.3, draft: L * 0.08, tilt: (afR(i, 77) - 0.5) * 0.5 });
  }
  const T0 = AF.coast + 0.5, T1 = AF.earth;
  return {
    scene, camera,
    frame(t) {
      const drop = afSea(t) * 300;
      U.uLevel.value = -drop; U.uT.value = t;
      // the inverse of the fall (for "how long has this mud been dry"): sample the drop curve over the shot
      U.uSea0.value = 0; U.uSea1.value = afSea(T1 - 1e-3) * 300; U.uTs0.value = T0; U.uTs1.value = T1;
      U.uOld.value = MathX.smooth(t, AF.maps - 0.2, AF.maps + 0.5);
      for (const b of boats) {
        const bed = afCoastH(b.x, b.z), float = -drop - b.draft * 0.3, aground = float < bed + b.draft * 0.2;
        const y = aground ? bed : float, ag = MathX.smooth(bed + b.draft * 0.2 - float, 0, 2);
        b.grp.position.set(b.x, y, b.z); b.grp.rotation.set(b.tilt * ag, b.yaw, 0.04 * Math.sin(t * 1.3 + b.x) * (1 - ag));
      }
      const k = afK(t, AF.coast, AF.earth, Ease.inOutSine);
      afCam(camera, [afLerp(-260, -900, k), afLerp(320, 2400, k), afLerp(-520, -2100, k)], [afLerp(0, 100, k), 0, afLerp(300, 1500, k)], afLerp(42, 46, k));
    },
    labels(t, shot, app) {
      const a = MathX.smooth(t, AF.maps + 0.2, AF.maps + 0.8) * (1 - MathX.smooth(t, AF.earth - 0.4, AF.earth - 0.1));
      if (a <= 0) return [];
      const p = new THREE.Vector3(-160, 2, 6).project(camera);
      return [{ x: p.x * 0.5 + 0.5, y: 0.5 - p.y * 0.5, a, html: '<span class="d"></span>THE COAST · A MONTH AGO' }];
    },
    grade(t, p) { p.warmth = 0.03; p.saturation = 1.08; p.contrast = 1.12; },
  };
};
