/* =====================================================================
   GARDEN — your back garden tonight (garden-build.js builds it) and everything that happens to it. One set, many
   shots (modes):
     cold      11:41 tonight (a flash-forward): floating over the lawn; the ground has split; the sky is black
     title     7:29, the garden under the title: the stars, the Moon, the telescope, the cat on the wall
     rule      7:29:5x by the telescope: the cat leaps for a moth, and at 7:30:00 the night stops (slowed down)
     freeze    the first second, slowed down: round the cat in mid-leap
     andro     Andromeda, up in the east (frozen)
     letgo     the Milky Way overhead (frozen; the diagrams are the HUD's)
     stars     the sky to the south (frozen): labels on stars, each over the edge a fraction of a second in
     land      the first second ends: the cat lands
     sky       8 p.m. → 9:15: the stars redden and dim (the night sped up)
     moon      a long lens on the Moon: it shrinks (9:15 → 10)
     pleiades  the Pleiades, hot blue stars, the last to go (10:10 → 10:40)
     moon2     the long lens again: a quarter of the size, orange (10:45); 10:55, the Sun goes over the edge
     weight    11:00 on the patio: you're getting lighter
     fountain  the bird bath's jet climbs higher, falls slower
     moongo    the Moon, small and red, goes out
     jump      you jump at half your weight
     air       the air: your ears pop
     tea       your fresh tea boils at 74 °C
     flame     the candle flame goes round, small and blue
     zero      11:35: weightless; the water lifts out of the bird bath; the cat floats
     rise      everything loose falls up
     crack     the lawn splits; the lights go out (the cables break); red rock glows deep in the crack
     drift     11:41 (the cold open's moment)
     pieces    11:50: high above: Earth in pieces, the house still whole
     last      the last second, slowed down: the house lets go, then you, then everything
     after     the closing question: the garden at 7:29 again, the sky as it is
   Pure function of film time: night time n = uxNight(t) drives the physics; small motions (the fountain, the cat,
   the flame) run on uxVis(t), a clock that never goes faster than film time and freezes when the night does.
   ===================================================================== */

// the visual clock: dτ = min(1, dn/dt) dt (a table, built once)
const UX_VIS = (() => {
  const dt = 1 / 240, N = Math.ceil((UX.end + 2) / dt) + 1, T = new Float64Array(N);
  let acc = 0, prev = uxNight(0);
  for (let i = 1; i < N; i++) { const n = uxNight(i * dt), r = Math.abs(n - prev) / dt; acc += (Number.isFinite(r) ? Math.min(1, r) : 0) * dt; T[i] = acc; prev = n; }
  return { dt, T };
})();
function uxVis(t) { const x = MathX.clamp(t / UX_VIS.dt, 0, UX_VIS.T.length - 1.001), i = Math.floor(x), f = x - i; return UX_VIS.T[i] + (UX_VIS.T[i + 1] - UX_VIS.T[i]) * f; }

// tonight's events in night time
const UX_N = {
  crack: uxAt(23, 38, 20), lightsOut: uxAt(23, 38, 22), zero: uxAt(23, 35, 15), airGone: uxAt(23, 36, 0), sunEdge: uxAt(22, 55, 34),
  leap: -0.1, land: 0.945,                                   // the cat's leap for the moth (night s)
};
const UX_CAT_LEAP = { from: [-0.6, 1.705, -16.72], to: [-0.35, 0, -14.6], vy: 3.5, T: 1.045 };
function uxCatLeap(n) {   // the cat's position in her leap, n in night seconds
  const L = UX_CAT_LEAP, u = MathX.clamp((n - UX_N.leap) / L.T, 0, 1), tau = u * L.T;
  return [L.from[0] + (L.to[0] - L.from[0]) * u, L.from[1] + L.vy * tau - 4.905 * tau * tau, L.from[2] + (L.to[2] - L.from[2]) * u];
}
// the separation of plate B from A after the crack (m), and of the rest of the world (×)
function uxSplit(n) { const x = Math.max(0, n - UX_N.crack) / (uxAt(23, 41) - UX_N.crack); return 15 * x * x; }
// a free thing's rise off the ground after 11:35 (m): slow at first (the pull grows), drawn on the visual clock
function uxRiseAt(n) { const x = Math.max(0, n - UX_N.zero); return 0.5 * 4.6e-6 * x * x * 4 + 0.02 * x; }

// a flame: a teardrop drawn in a 1 × 2 quad (base at the bottom). uH = convection (1 normal: tall, tapered, yellow
// with a blue foot; 0 weightless: a small blue sphere, as candle flames in orbit are); uY = the yellow soot glow
function uxFlame() {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uH: { value: 1 }, uY: { value: 1 }, uA: { value: 1 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vQ; void main(){ vQ = vec2(uv.x - 0.5, (uv.y - 0.5) * 2.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform float uH, uY, uA, uT; varying vec2 vQ;
      void main() {
        float cy = mix(-0.62, -0.42, uH), Y = vQ.y;
        float x = vQ.x + 0.025 * uH * sin(uT * 13.0 + Y * 6.0) * max(Y - cy + 0.2, 0.0);
        float up = max(Y - cy, 0.0);
        float rx = mix(0.17, 0.15, uH) * (1.0 - uH * 0.8 * smoothstep(0.0, 0.9, up));
        float ry = Y > cy ? mix(0.17, 0.95, uH) : mix(0.17, 0.13, uH);
        float d = length(vec2(x / max(rx, 0.015), (Y - cy) / ry));
        float body = smoothstep(1.0, 0.45, d), core = smoothstep(0.55, 0.0, d), halo = exp(-d * d * 0.9) * 0.12;
        vec3 yel = vec3(1.0, 0.5, 0.12) * body * 0.75 + vec3(1.0, 0.82, 0.55) * core * 0.9;
        float foot = smoothstep(0.12, -0.12, Y - cy) * body;
        yel = mix(yel, vec3(0.18, 0.32, 0.95) * body * 0.9, foot * 0.75);
        vec3 blu = vec3(0.16, 0.3, 0.95) * body * 0.7 + vec3(0.45, 0.6, 1.0) * core * 0.3;
        vec3 c = mix(blu, yel, uY) + vec3(1.0, 0.6, 0.3) * halo * uY;
        gl_FragColor = vec4(c * uA, 1.0);
      }`,
  });
  const o = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), m); o.renderOrder = 6; return o;
}

// the light from below after the crack: glowing pieces of the Earth's hot inside (blackbody colours, 1,300–4,500 K)
const UX_DEEP = Array.from({ length: 240 }, (_, i) => {
  const a = uxR(i, 91) * 6.283, d = 6 + Math.pow(uxR(i, 92), 0.8) * 420, T = 1300 + Math.pow(uxR(i, 93), 2.2) * 3200;
  return { x: Math.cos(a) * d, z: Math.sin(a) * d - 10, y: -30 - Math.pow(uxR(i, 94), 0.7) * 380, s: 2 + Math.pow(uxR(i, 95), 2) * 22, T, rgb: uxBBRGB(T), k: uxR(i, 96) };
});
function uxLightsOn(n) { return n > UX_N.lightsOut ? (n > UX_N.lightsOut + 1.2 ? 0 : (Math.sin(n * 47) > 0.3 ? 0.7 : 0.1)) : 1; }

UX_SETS.garden = (app) => {
  const S = uxSet(app, { sky: '#05070d', fov: 55, near: 0.02, far: 8000, hemi: ['#5a6e9c', '#28241e', 0.85], sun: [-40, 30, -30], sunColor: '#aebbd6', sunI: 1.0, shadow: 2048, shadowR: 22, shadowFar: 200, env: ['#0d1220', '#1e2230', '#0c0a08'] });
  const scene = S.scene, cam = S.camera, G = UX_G;
  scene.fog = new THREE.FogExp2('#0c1018', 0.006);
  const P = uxBuildGarden(app, S);
  const sky = new UxSky(scene);
  // the moonlight comes from the Moon
  const md = sky.moonDir; S.sun.position.set(md.x * 60, md.y * 60, md.z * 60 - 6); S.sun.target.position.set(0, 0, -6);
  // ---- the lights: the kitchen window and the back door, the bedroom, the string lights, the candle
  const warm = '#ffb468';
  const kit = new THREE.SpotLight(warm, 14, 16, 0.95, 0.85, 1.6); kit.position.set(-1.6, 1.7, 0.6); kit.target.position.set(-1.4, 0, -5); scene.add(kit, kit.target);
  const door = new THREE.SpotLight(warm, 6, 10, 0.8, 0.9, 1.6); door.position.set(1.6, 1.9, 0.5); door.target.position.set(1.6, 0, -4); scene.add(door, door.target);
  const bed = new THREE.SpotLight(warm, 8, 22, 0.6, 0.9, 1.6); bed.position.set(-1.6, 4.4, 0.6); bed.target.position.set(-1.2, 0, -9); scene.add(bed, bed.target);
  for (const L of [kit, door, bed]) { L.castShadow = false; }
  kit.castShadow = true; kit.shadow.mapSize.set(1024, 1024); kit.shadow.bias = -0.0005;
  const strings = [-2.5, -8, -13.5].map((z) => { const p = new THREE.PointLight('#ffc070', 1.1, 6, 1.8); p.position.set(-G.lawnW / 2 + 0.25, 1.75, z); scene.add(p); return p; });
  const candle = new THREE.PointLight('#ffa040', 0.9, 3.2, 1.8); scene.add(candle);
  // (the kitchen window's light spreading up and out over the patio: only needed when things float up through it)
  const spill = new THREE.PointLight(warm, 0, 7, 1.6); spill.position.set(-1.9, 2.4, -0.8); scene.add(spill);
  const flame = uxFlame(); scene.add(flame);
  // the red glow down in the crack, and the field of the world's other pieces (11:41 on)
  // (a glowing rock: brightest where it faces you, faceted, its rims darker and cooler)
  const deepM = new THREE.ShaderMaterial({
    vertexShader: /* glsl */`varying vec3 vC, vW;
      void main() { vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz;
        #ifdef USE_INSTANCING_COLOR
          vC = instanceColor;
        #else
          vC = vec3(1.0);
        #endif
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`varying vec3 vC, vW;
      void main() { vec3 n = normalize(cross(dFdx(vW), dFdy(vW))), v = normalize(cameraPosition - vW); float f = abs(dot(n, v));
        gl_FragColor = vec4(vC * (0.28 + 0.85 * pow(f, 1.4)) * vec3(1.0, 0.92 + 0.08 * f, 0.85 + 0.15 * f), 1.0); }`,
  });
  const deep = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), deepM, UX_DEEP.length); deep.castShadow = deep.receiveShadow = false; deep.frustumCulled = false; scene.add(deep);
  const _dc = new THREE.Color();
  const crackL = new THREE.PointLight('#ff6a2a', 0, 60, 1.2); scene.add(crackL);
  const coreL = new THREE.PointLight('#ff8a3a', 0, 400, 1.0); coreL.position.set(-40, -26, -30); scene.add(coreL);
  // the crack itself: a glowing line that runs across the lawn (it travels from the left fence to the right in a
  // moment), and the light spilling out of it, low over the grass, before the two halves pull apart
  const crackRib = (() => {
    const C = G.crack, pos = [], au = [], ac = [], idx = [];
    let L = 0; const seg = []; for (let i = 1; i < C.length; i++) { const d = Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]); seg.push(d); L += d; }
    let acc = 0;
    for (let i = 0; i < C.length; i++) {
      const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], ln = Math.hypot(dx, dz), nx = -dz / ln, nz = dx / ln;
      for (const sd of [-1, 1]) { pos.push(C[i][0] + sd * nx * 0.16, 0.03, C[i][1] + sd * nz * 0.16); au.push(acc / L); ac.push(sd); }
      if (i < C.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); acc += seg[i]; }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1)); g.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 1)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uP: { value: 0 }, uK: { value: 0 } },
      vertexShader: 'attribute float aU, aC; varying float vU, vC; void main(){ vU = aU; vC = aC; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uP, uK; varying float vU, vC; float h(float x){ return fract(sin(x * 127.1) * 43758.5); } float n1(float x){ float i = floor(x), f = fract(x); return mix(h(i), h(i + 1.0), f * f * (3.0 - 2.0 * f)); } void main(){ float on = smoothstep(uP + 0.02, uP - 0.02, vU), w = 0.35 + 0.9 * n1(vU * 55.0) * n1(vU * 13.0 + 4.0), x = (vC - 0.25 * (n1(vU * 31.0) - 0.5)) / w, core = exp(-x * x * 7.0), hot = exp(-x * x * 40.0); gl_FragColor = vec4((vec3(0.9, 0.32, 0.07) * core * 1.3 + vec3(1.0, 0.72, 0.3) * hot * 1.4) * (0.6 + 0.4 * n1(vU * 90.0)) * on * uK, 1.0); }' });
    const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 3; mesh.frustumCulled = false; scene.add(mesh); return mesh;
  })();
  const crackTop = new THREE.PointLight('#ff7a30', 0, 16, 1.4); crackTop.position.set(0, 0.35, -9.5); scene.add(crackTop);
  // ---- the cat, a moth
  const catRoot = new THREE.Group(); scene.add(catRoot);
  const cat = uxBuildCat(catRoot);
  const moth = new THREE.Group(); scene.add(moth);
  const mothM = uxStd('#b8a890', 0.9, 0, { side: THREE.DoubleSide });
  const wing = (s) => { const g = new THREE.Shape(); g.moveTo(0, 0); g.quadraticCurveTo(0.03 * s, 0.025, 0.028 * s, -0.006); g.quadraticCurveTo(0.015 * s, -0.02, 0, 0); const m = new THREE.Mesh(new THREE.ShapeGeometry(g), mothM); moth.add(m); return m; };
  const wL = wing(-1), wR = wing(1); uxMesh(new THREE.CylinderGeometry(0.003, 0.002, 0.02, 5), uxStd('#6a5a48'), 0, 0, 0, moth).rotation.x = Math.PI / 2;
  // ---- the fountain's water, the debris, the tea's bubbles, the steam: soft particles
  const puffs = uxPuffs(scene, 3000);
  const water = uxPuffs(scene, 1200, { soft: 1.2 });
  // ---- loose things that fall up after 11:35: leaves (instanced) and gravel
  const leafG = new THREE.PlaneGeometry(0.05, 0.035), leafM = uxStd('#3a3420', 0.9, 0, { side: THREE.DoubleSide });
  const leaves = new THREE.InstancedMesh(leafG, leafM, 260); leaves.castShadow = false; scene.add(leaves);
  const LEAF = Array.from({ length: 260 }, (_, i) => ({ x: (uxR(i, 3) - 0.5) * 8.6, z: -3.2 - uxR(i, 4) * 13, k: 0.5 + uxR(i, 5), s: uxR(i, 6) * 6.28, w: uxR(i, 7) }));
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
  // the world's other pieces, far off (from 11:41): dark slabs with turf tops, some still lit
  const chunkG = new THREE.BoxGeometry(1, 1, 1), chunkM = uxStd('#3a332c', 0.95), chunkTopM = uxStd('#2a3a20', 0.95);
  const NCH = 160, chunks = new THREE.InstancedMesh(chunkG, chunkM, NCH), tops = new THREE.InstancedMesh(chunkG, chunkTopM, NCH);
  chunks.castShadow = tops.castShadow = false; scene.add(chunks, tops);
  const CH = Array.from({ length: NCH }, (_, i) => { const a = uxR(i, 11) * 6.283, d = 45 + Math.pow(uxR(i, 12), 0.7) * 400; return { x: Math.cos(a) * d, z: Math.sin(a) * d - 8, w: 18 + uxR(i, 13) * 40, h: 6 + uxR(i, 14) * 12, ry: uxR(i, 15) * 3, tilt: (uxR(i, 16) - 0.5) * 0.3 }; });

  // the last second: bricks coming off the house as it lets go
  const brickM = uxStd('#7a4a3a', 0.9), NBR = 420, bricks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.215, 0.065, 0.1), brickM, NBR); bricks.castShadow = false; bricks.frustumCulled = false; scene.add(bricks);
  const BR = Array.from({ length: NBR }, (_, i) => ({ x: (uxR(i, 51) - 0.5) * (G.houseW - 0.4), y: 0.1 + uxR(i, 52) * 6.0, k: 0.4 + uxR(i, 53), a: uxR(i, 54) * 6.28, at: uxR(i, 55) }));
  const state = { lightsOn: 1 };
  // --------------------------------------------------------------------------------------------------------------
  // what happens tonight, at night time n (the same in every shot)
  function world(t, n, vt, shot) {
    const w = uxWeight(n), p = Math.max(0, w);
    scene.fog.density = 0.006 * MathX.clamp(uxPressure(n), 0.03, 1);   // (no air, no haze)
    // ---- the lights: on until the cables break with the ground (a flicker), the string lights are solar (battery)
    const out = uxLightsOn(n);
    state.lightsOn = out;
    const lastK = shot.mode === 'last' ? 1 - MathX.smooth(uxLeft(t), 0.79, 0.5) : 0;
    P.M.glassLit.emissiveIntensity = 1.25 * out; kit.intensity = 14 * out; door.intensity = 6 * out; bed.intensity = 8 * out;
    spill.intensity = (shot.mode === 'rise' ? 3.2 : 0) * out;
    for (const h of P.neighbours || []) h.material.emissiveIntensity = out;
    // ---- the moonlight: as bright as the Moon still is (it fades with it)
    S.sun.intensity = 1.0 * sky.moonLight; S.sun.color.setRGB(0.68 + 0.32 * sky.moonTint[0], 0.73 + 0.27 * sky.moonTint[1], 0.84 + 0.16 * sky.moonTint[2]);
    // ---- the candle: a flame shaped by convection (∝ weight), out when the air goes
    { const wp = P.table.position, L = P.lantern.position; const at = [wp[0] + L.x + P.wickAt[0], 0.735 + L.y + P.wickAt[1], wp[2] + L.z + P.wickAt[2]];
      const air = MathX.smooth(p, 0.02, 0.12), hk = Math.pow(MathX.clamp(p, 0, 1), 0.6);
      const fl = 0.85 + 0.15 * Math.sin(vt * 11) * Math.sin(vt * 7.3 + 1);
      P.table.updateMatrixWorld(true); _v.set(L.x, L.y + P.wickAt[1] + 0.012 + 0.012 * hk, L.z).applyMatrix4(P.table.matrixWorld);
      // (the quad's base sits on the wick; it turns to face you about its upright)
      const sz = 0.045, yel = MathX.smooth(p, 0.06, 0.55);
      flame.position.set(_v.x, _v.y + 0.62 * sz - 0.012, _v.z); flame.rotation.set(0, Math.atan2(cam.position.x - _v.x, cam.position.z - _v.z), 0); flame.scale.setScalar(sz);
      const U = flame.material.uniforms; U.uH.value = hk; U.uY.value = yel; U.uA.value = air * (0.6 + 0.4 * yel) * fl; U.uT.value = vt;
      candle.position.set(_v.x, _v.y + 0.09, _v.z); candle.intensity = 0.12 * air * (0.15 + 0.85 * yel) * fl; candle.color.setRGB(1 - 0.5 * (1 - yel), 0.62 - 0.0 * (1 - yel), 0.3 + 0.7 * (1 - yel)); }
    // ---- the plates: B and the neighbours drift off once the ground splits
    const s = uxSplit(n);
    P.plates.B.position.set(0, -0.02 * s, -s); P.plates.B.rotation.x = -0.006 * s;
    P.plates.back.position.set(0, -0.03 * s, -1.7 * s); P.plates.back.rotation.x = -0.004 * s;
    P.plates.left.position.set(-1.2 * s, -0.02 * s, 0.2 * s); P.plates.left.rotation.z = 0.004 * s;
    P.plates.right.position.set(1.3 * s, -0.025 * s, -0.1 * s); P.plates.right.rotation.z = -0.004 * s;
    // the glow from below: the Earth's hot inside, in pieces (from the crack on; brighter as the core comes apart)
    { const on = MathX.smooth(n, UX_N.crack, UX_N.crack + 40), core = MathX.smooth(n, uxAt(23, 41), uxAt(23, 45)), sp = 1 + 0.004 * Math.max(0, n - uxAt(23, 41)) + Math.pow(Math.max(0, n - uxAt(23, 44)) / 300, 2);
      deep.visible = on > 0;
      for (let i = 0; i < UX_DEEP.length; i++) {
        const D = UX_DEEP[i], hot = D.T > 2600 ? core : 1, sc = D.s * on * (D.T > 2600 ? core : 1);
        _v.set(D.x * sp, D.y * sp, D.z * sp); _e.set(D.k * 6 + vt * 0.02 * D.k, D.k * 3, 0); _q.setFromEuler(_e); _s.setScalar(sc); _m4.compose(_v, _q, _s); deep.setMatrixAt(i, _m4);
        const g = (D.T - 1000) / 3500 * 2.2 * hot; _dc.setRGB(D.rgb[0] * g, D.rgb[1] * g, D.rgb[2] * g); deep.setColorAt(i, _dc);
      }
      deep.instanceMatrix.needsUpdate = true; if (deep.instanceColor) deep.instanceColor.needsUpdate = true;
      const gl = MathX.smooth(s, 0, 3) * 0.6 + 0.9 * core;
      crackL.position.set(0, -6, -9.6 - Math.min(s, 8) / 2); crackL.intensity = 40 * gl * (1 - 0.6 * lastK);
      coreL.intensity = 90 * core;
      // the glowing line and its light: from the crack, fading as the gap opens wide (then the glow comes from below)
      { const run = n >= UX_N.crack - 0.5 ? MathX.smooth(t, UX.crackAt - 0.1, UX.crackAt + 0.8) : 0, k = run * (1 - MathX.smooth(s, 1.5, 6));
        crackRib.material.uniforms.uP.value = run * 1.05; crackRib.material.uniforms.uK.value = k * (0.85 + 0.15 * Math.sin(vt * 7.0));
        crackRib.visible = k > 0.002; crackTop.intensity = 9 * k * (1 - 0.5 * lastK); }
      S.hemi.color.setRGB(0.35 * out + 0.07, 0.43 * out + 0.08, 0.61 * out + 0.12);
      S.hemi.groundColor.setRGB(0.16 * out + 0.9 * gl, 0.14 * out + 0.32 * gl, 0.12 * out + 0.1 * gl);
      S.hemi.intensity = 0.85 * Math.max(0.25, out) + 0.4 * gl;
      P.far.visible = n < UX_N.crack + 20; }
    // ---- the far pieces of the world (11:41 on)
    { const k = Math.max(0, n - uxAt(23, 40)), sp = 1 + k / 60 * 0.6 + Math.pow(k / 300, 2) * 2;
      for (let i = 0; i < NCH; i++) { const c = CH[i], vis = n > uxAt(23, 39) ? 1 : 0;
        _v.set(c.x * sp, -c.h / 2 - 0.4 * k / 60 * (1 + uxR(i, 17)) - 2, c.z * sp); _e.set(c.tilt * (1 + k / 200), c.ry, c.tilt * 0.5); _q.setFromEuler(_e);
        _s.set(c.w * vis, c.h * vis, c.w * 0.8 * vis); _m4.compose(_v, _q, _s); chunks.setMatrixAt(i, _m4);
        _v.y += c.h / 2 + 0.15; _s.set(c.w * vis, 0.3 * vis, c.w * 0.8 * vis); _m4.compose(_v, _q, _s); tops.setMatrixAt(i, _m4); }
      chunks.instanceMatrix.needsUpdate = tops.instanceMatrix.needsUpdate = true; chunks.visible = tops.visible = n > uxAt(23, 39); }
    // ---- the house lets go (0.79 s before midnight): its walls, roof, windows drift apart; bricks come away
    { if (!P.houseBase) P.houseBase = P.house.children.map((c) => ({ p: c.position.clone(), r: c.rotation.clone() }));
      const hl = shot.mode === 'last' && t > UX.house ? Math.log(0.79 / Math.max(1e-30, uxLeft(t))) : 0;
      P.house.children.forEach((c, i) => {
        const b = P.houseBase[i], f = 0.3 * hl * (0.6 + uxR(i, 74));
        c.position.set(b.p.x + (b.p.x / 6 + uxR(i, 71) - 0.5) * f, b.p.y + ((b.p.y - 3) / 6 + uxR(i, 72) - 0.3) * f, b.p.z + ((b.p.z - 2) / 6 + uxR(i, 73) - 0.5) * f);
        c.rotation.set(b.r.x + (uxR(i, 75) - 0.5) * 0.06 * hl, b.r.y + (uxR(i, 76) - 0.5) * 0.06 * hl, b.r.z + (uxR(i, 77) - 0.5) * 0.06 * hl);
      });
      bricks.visible = hl > 0;
      if (hl > 0) { for (let i = 0; i < NBR; i++) { const B = BR[i], f = Math.max(0, hl - B.at * 1.5) * B.k;
        _v.set(B.x * (1 + 0.04 * f), B.y + 0.1 * f * (uxR(i, 56) - 0.4), -0.06 - 0.35 * f); _e.set(B.a + 0.3 * f * B.k, B.a * 2 + 0.2 * f, 0.15 * f); _q.setFromEuler(_e); _s.setScalar(f > 0 ? 1 : 0); _m4.compose(_v, _q, _s); bricks.setMatrixAt(i, _m4); }
        bricks.instanceMatrix.needsUpdate = true; } }
    // ---- loose things fall up after 11:35 (leaves, the chairs, the mug, the telescope)
    const rise = uxRiseAt(n);
    for (let i = 0; i < LEAF.length; i++) {
      const L = LEAF[i], h = rise * L.k * (0.6 + 0.8 * L.w), vis = n > UX_N.zero ? 1 : 0;
      _v.set(L.x + 0.3 * Math.sin(vt * 0.3 + L.s) * MathX.smooth(h, 0, 1), 0.02 + h, L.z + (L.z < -9.4 ? -s : 0)); _e.set(L.s + vt * 0.4 * L.k * MathX.smooth(h, 0, 0.5), L.s * 2, L.w * 3 + vt * 0.3 * MathX.smooth(h, 0, 0.5)); _q.setFromEuler(_e);
      _s.setScalar(vis * (0.7 + 0.6 * L.w)); _m4.compose(_v, _q, _s); leaves.setMatrixAt(i, _m4);
    }
    leaves.instanceMatrix.needsUpdate = true; leaves.visible = n > UX_N.zero;
    const lift = (o, base, k, spin) => { o.position.y = base + rise * k; o.rotation.x = spin * rise * 0.12; o.rotation.z = spin * rise * 0.07; };
    lift(P.chairs[0], 0, 0.8, 1); lift(P.chairs[1], 0, 0.65, -1);
    P.mug.position.y = 0.735 + rise * 1.1; P.mug.rotation.z = rise * 0.4;
    P.scope.position.y = rise * 0.5; P.scope.rotation.z = rise * 0.05;
    P.table.position.y = rise * 0.25;
    // ---- the fountain: a jet of drops (apex ∝ 1 / weight); at zero weight the water lifts out of the bowl in blobs
    water.begin();
    { P.plates.B.updateMatrixWorld(true); _v.set(G.bath[0], 1.0, G.bath[2]).applyMatrix4(P.plates.B.matrixWorld);
      const nz = _v.clone(), v0 = 2.3, ge = 9.81 * Math.max(0.035, w);
      if (n < UX_N.zero + 5) for (let i = 0; i < 140; i++) {
        const per = 0.0045, age = ((vt / per - i) % 140 + 140) % 140 * per + (vt % per), a = uxR(i, 21) * 6.283, sp = 0.05 + 0.08 * uxR(i, 22), vy = v0 * (0.92 + 0.08 * uxR(i, 23));
        const T = 2 * vy / ge; if (age > T * 1.05) continue;
        const y = vy * age - 0.5 * ge * age * age; if (y < -0.03) continue;
        water.add(nz.x + Math.cos(a) * sp * age, nz.y + y, nz.z + Math.sin(a) * sp * age, 0.012 + 0.006 * uxR(i, 24), 0.55, 0.75, 0.85, 1.0);
      }
      // the bowl's water, rising off in wobbling blobs
      const up = Math.max(0, n - UX_N.zero);
      P.bathWater.visible = up < 25;
      if (up > 0) for (let i = 0; i < 46; i++) {
        const st = uxR(i, 31) * 30, k = Math.max(0, up - st); if (k <= 0) continue;
        const a = uxR(i, 32) * 6.283, rr = 0.3 * Math.sqrt(uxR(i, 33));
        water.add(nz.x + Math.cos(a) * rr + 0.05 * Math.sin(vt + i), nz.y - 0.02 + 0.0022 * k * k * (0.6 + uxR(i, 34)) + 0.02 * k, nz.z + Math.sin(a) * rr, 0.02 + 0.05 * uxR(i, 35), 0.65, 0.7, 0.8, 0.95);
      } }
    water.end();
    // ---- the tea: steam, and bubbles once it boils (fresh tea, 75 °C; water boils at uxBoil(p))
    puffs.begin();
    { P.table.updateMatrixWorld(true); _v.set(P.mug.position.x, P.mug.position.y + 0.085, P.mug.position.z).applyMatrix4(P.table.matrixWorld);
      const boil = uxBoil(p), b = p > 0.005 ? MathX.smooth(UX_TEA - boil, -0.5, 4) : 0, on = n > uxAt(23, 26) && n < UX_N.zero;
      if (on) {
        for (let i = 0; i < 22; i++) { const ph = (vt * (0.35 + 0.4 * uxR(i, 41)) + uxR(i, 42)) % 1, a = uxR(i, 43) * 6.28, sw = 0.012 * Math.sin(vt * 1.3 + i) * ph; puffs.add(_v.x + Math.cos(a) * 0.014 + sw + 0.02 * ph, _v.y + ph * 0.2, _v.z + Math.sin(a) * 0.014, 0.012 + 0.04 * ph, 0.035 * Math.sin(ph * 3.14) * (0.6 + 1.4 * b), 0.9, 0.9, 0.92); }
        for (let i = 0; i < 46 * b; i++) { const ph = (vt * (1.6 + 2 * uxR(i, 44)) + uxR(i, 45)) % 1, a = uxR(i, 46) * 6.28, rr = 0.03 * Math.sqrt(uxR(i, 47)); puffs.add(_v.x + Math.cos(a) * rr, _v.y + 0.0015, _v.z + Math.sin(a) * rr, 0.0018 + 0.0035 * Math.sin(ph * 3.14), 0.55 * Math.sin(ph * 3.14), 0.75, 0.52, 0.32); }
      } }
    puffs.end();
    // ---- the cat (night time: her leap; then per shot)
    return { w, p, s, rise, lastK };
  }

  // the cat, per shot
  function poseCat(t, n, vt, shot, W) {
    catRoot.visible = true;
    if (n < UX_N.leap) {                                 // on the wall, watching the moth
      catRoot.position.set(...UX_CAT_LEAP.from); catRoot.rotation.set(0, 0.15, 0);
      const k = uxK(n, UX_N.leap - 1.2, UX_N.leap);
      cat.pose(uxCatBlend(UX_CAT_POSES.alert, UX_CAT_POSES.crouch, k), vt);
      return;
    }
    if (n < UX_N.land) {                                 // in mid-leap, reaching for the moth
      const q = uxCatLeap(n), u = (n - UX_N.leap) / UX_CAT_LEAP.T;
      catRoot.position.set(q[0], q[1], q[2]); catRoot.rotation.set(-0.5 + 0.9 * u, 0.15, 0);
      cat.pose(uxCatBlend(UX_CAT_POSES.leap, UX_CAT_POSES.stand, MathX.smooth(u, 0.55, 1)), vt);
      return;
    }
    if (n < UX_N.zero) {                                 // on the lawn: lands, sits, looks up
      catRoot.position.set(...UX_CAT_LEAP.to); catRoot.rotation.set(0, 0.15 + 0.4 * MathX.smooth(n, 30, 4000), 0);
      const k = MathX.smooth(n, UX_N.land, UX_N.land + 0.25), k2 = MathX.smooth(n, UX_N.land + 0.3, UX_N.land + 1.2);
      let pose = uxCatBlend(UX_CAT_POSES.crouch, UX_CAT_POSES.sit, k2); if (k < 1) pose = uxCatBlend(UX_CAT_POSES.leap, pose, k);
      cat.pose(n > 3000 ? UX_CAT_POSES.alert : pose, vt);
      return;
    }
    // weightless: she floats up off the lawn, legs out, turning slowly
    const r = uxRiseAt(n) * 0.9;
    catRoot.position.set(UX_CAT_LEAP.to[0] + 0.1 * r, 0.05 + r, UX_CAT_LEAP.to[2] + 0.2 * r);
    catRoot.rotation.set(0.25 * r, 0.15 + 0.3 * r, 0.18 * r);
    cat.pose(uxCatBlend(UX_CAT_POSES.alert, UX_CAT_POSES.startle, MathX.smooth(r, 0, 0.3)), vt);
  }

  // --------------------------------------------------------------------------------------------------------------
  // the camera, per shot
  const L = (a, b, t0, t1, t, e) => uxV(a, b, uxK(t, t0, t1, e));
  const look = (p, at, fov, roll = 0) => uxCam(cam, p, at, fov, roll);
  const skyAt = (az, alt, d = 100, from = [0, 1.62, -6]) => { const v = uxSkyDir(az, alt); return [from[0] + v[0] * d, from[1] + v[1] * d, from[2] + v[2] * d]; };
  const drift = (t, a = 0.012, s = 1) => uxDrift(t, a, 0.3, s);
  const CAM = {
    cold(t, W) {
      const u = uxK(t, 0, UX.titleShot, Ease.linear), d = drift(t, 0.05, 3);
      const p = [2.4 + d[0] + 0.3 * u, 4.2 + 1.6 * u + d[1], -12 - 1.2 * u + d[2]];
      look(p, [0, 2.6 - 0.4 * u, 0], 56, -5 + 3 * u);
    },
    title(t) { const k = uxK(t, UX.titleShot, UX.grow, Ease.linear), d = drift(t); look([0.5 + d[0] - 0.25 * k, 1.66 + d[1], -0.9 - 1.1 * k], [-0.4, 3.6 - 0.3 * k, -17], 56); },
    rule(t) { const d = drift(t, 0.008); look([2.0 + d[0], 1.6 + d[1], -6.2], L([-0.4, 2.3, -16.6], [-0.55, 2.05, -16.6], UX.rule, UX.onset, t), slLerpFov(44, 30, uxK(t, UX.rule, UX.onset + 0.5))); },
    freeze(t) {
      const c = uxCatLeap(0), k = uxK(t, UX.second, UX.far, Ease.inOutSine), a = -0.75 + 1.3 * k, r = 1.25 - 0.15 * k;
      look([c[0] + Math.sin(a) * r, c[1] + 0.1 - 0.15 * k, c[2] + Math.cos(a) * r], [c[0], c[1] + 0.05, c[2]], 42);
    },
    andro(t) { const k = uxK(t, UX.andro, UX.letgo, Ease.linear), d = drift(t, 0.004); look([0.2 + d[0], 1.62 + d[1], -7], skyAt(UX_SKY.andromeda.az + 4 - 3 * k, 31 + 3 * k, 100, [0.2, 1.62, -7]), 58 - 5 * k); },
    letgo(t) { const k = uxK(t, UX.letgo, UX.stars, Ease.linear); look([0.4, 1.62, -6.5], skyAt(310 - 20 * k, 62, 100, [0.4, 1.62, -6.5]), 66, 0); },
    stars(t) { const k = uxK(t, UX.stars, UX.resume, Ease.linear), d = drift(t, 0.004); look([0.6 + d[0], 1.62 + d[1], -4.2], skyAt(150 - 8 * k, 24 + 2 * k, 100, [0.6, 1.62, -4.2]), 62); },
    land(t) { const k = uxK(t, UX.resume, UX.stretch, Ease.linear), d = drift(t, 0.01); const c = UX_CAT_LEAP.to; look([c[0] + 1.6 + d[0] - 0.3 * k, 0.75 + d[1], c[2] + 2.4 - 0.3 * k], [c[0], 0.4, c[2] - 0.3], 40); },
    sky(t) { const k = uxK(t, UX.stretch, UX.moon, Ease.inOutSine), d = drift(t, 0.004); look([0.6 + d[0], 1.62 + d[1], -4.5], skyAt(136 - 42 * k, 28 + 12 * k, 100, [0.6, 1.62, -4.5]), 64); },
    moon(t) { look([0, 1.62, -6], skyAt(UX_SKY.moon.az, UX_SKY.moon.alt, 100, [0, 1.62, -6]), 3.4); },
    moon2(t) { look([0, 1.62, -6], skyAt(UX_SKY.moon.az, UX_SKY.moon.alt, 100, [0, 1.62, -6]), 3.0); },
    moongo(t) { look([0, 1.62, -6], skyAt(UX_SKY.moon.az, UX_SKY.moon.alt, 100, [0, 1.62, -6]), 1.2); },
    pleiades(t) { const k = uxK(t, UX.blue, UX.moon2, Ease.linear); look([0.3, 1.62, -6.5], skyAt(78, 14 + 2 * k, 100, [0.3, 1.62, -6.5]), 30 - 4 * k); },
    weight(t) { const k = uxK(t, UX.weight, UX.fountain, Ease.linear), d = drift(t, 0.01); look([-1.5 + d[0], 1.62 + d[1], -2.6 - 0.6 * k], [0.4, 1.0, -12], 58); },
    fountain(t) { const k = uxK(t, UX.fountain, UX.moongo, Ease.linear), d = drift(t, 0.006); const b = G.bath; look([b[0] - 1.1 + d[0], 1.25 + d[1], b[2] + 1.9 - 0.3 * k], [b[0], 1.25, b[2]], 36); },
    jump(t, W) {
      // a jump with take-off speed v0, at the weight of the moment (g × w)
      const t0 = UX.jump, v0 = 2.7, ge = 9.81 * Math.max(0.05, W.w), T = 2 * v0 / ge, u = t - t0;
      const y = u > 0 && u < T ? v0 * u - 0.5 * ge * u * u : 0, crouch = -0.12 * (Math.exp(-Math.pow((u + 0.12) / 0.1, 2)) + Math.exp(-Math.pow((u - T - 0.08) / 0.09, 2)));
      const d = drift(t, 0.006);
      look([0.2 + d[0], 1.62 + y + crouch, -6.8], [-0.2, 2.6 - 1.1 * y, -17], 58, 0);   // (looking down a little as you rise: the lawn drops away)
    },
    air(t) { const k = uxK(t, UX.air, UX.tea, Ease.linear), d = drift(t, 0.008); look([-0.6 + d[0], 1.6 + d[1], -4.2 + 0.3 * k], [-2.0, 1.3, 0.5], 56); },
    tea(t) { const k = uxK(t, UX.tea, UX.flame, Ease.linear); const m = [G.table[0] + 0.12, 0.82, G.table[2] + 0.08]; look([m[0] + 0.25 - 0.05 * k, m[1] + 0.22 - 0.03 * k, m[2] - 0.32 + 0.04 * k], [m[0], m[1] + 0.01, m[2]], 34); },
    flame(t) { const k = uxK(t, UX.flame, UX.zero, Ease.linear); const m = [G.table[0] - 0.14, 0.86, G.table[2] - 0.06]; look([m[0] + 0.02, m[1] + 0.05, m[2] - 0.36 + 0.05 * k], [m[0], m[1] - 0.01, m[2]], 30); },
    zero(t, W) { const k = uxK(t, UX.zero, UX.rise, Ease.linear), d = drift(t, 0.02); look([0.8 + d[0], 1.62 + d[1] + 0.25 * k, -8.2], [1.0, 0.9 + 0.5 * k, -13.5], 52); },
    // (you float up too, turned to the patio: the chairs, the mug, the leaves going up past the house)
    rise(t, W) { const k = uxK(t, UX.rise, UX.crack, Ease.inOutSine), d = drift(t, 0.03), r = uxRiseAt(uxNight(t)); look([1.9 + d[0], 1.4 + 0.3 * r + d[1], -3.6 + 0.2 * k], [-2.9, 1.2 + 0.75 * r, -1.4], 52, -2 * k); },
    crack(t, W) { const k = uxK(t, UX.crack, UX.drift, Ease.inOutSine), d = drift(t, 0.03); look([0.6 + d[0], 3.6 + 0.9 * k + d[1], -4.6 + 0.4 * k], [0.0, -0.8 - 0.6 * k, -12 - 3 * k], 60, -2); },
    drift(t, W) { const k = uxK(t, UX.drift, UX.pieces, Ease.inOutSine), d = drift(t, 0.05, 3); look([2.7 + 1.2 * k + d[0], 5.8 + 4 * k + d[1], -13.2 - 5 * k + d[2]], [0, 2.2 - 1.2 * k, 0], 56 + 4 * k, -2 + 2 * k); },   // (the cold open's view, caught up with: it pulls back)
    pieces(t, W) { const k = uxK(t, UX.pieces, UX.last, Ease.inOutSine); look([9 + 3 * k, 8 + 4 * k, -14 - 4 * k], [0, 3.5, 3], 48, -3); },
    last(t, W) { const k = uxK(t, UX.last, UX.midnight, Ease.inOutSine), d = drift(t, 0.02); look([3.0 + d[0] - 0.8 * k, 3.4 + d[1], -6 + 1.0 * k], [-0.6, 2.2, 1.0], 54); },
    after(t) { const k = uxK(t, UX.question, UX.end, Ease.linear), d = drift(t); look([0.2 + d[0], 1.64 + d[1], -2.0 - 0.6 * k], [-0.3, 4.4, -17], 58); },
  };
  function slLerpFov(a, b, k) { return a + (b - a) * k; }

  return {
    scene, camera: cam, sky, P,
    frame(t, shot, app) {
      const n = shot.mode === 'after' ? uxAt(19, 29, 30) + (t - UX.question) : uxNight(t), vt = uxVis(t);
      // (the camera and the sky first: the moonlight in the garden comes from the sky as it is now)
      (CAM[shot.mode] || CAM.title)(t, { w: uxWeight(n) });
      sky.update(Math.max(0, n), vt, cam, app.renderH || 1080, { air: MathX.clamp(uxPressure(n), 0, 1), glow: uxLightsOn(n) });
      const W = world(t, n, vt, shot);
      poseCat(t, n, vt, shot, W);
      // the moth, by the cat's leap (frozen with the night)
      { const c = uxCatLeap(0.42), fl = Math.sin(vt * 60) * 0.9; moth.position.set(c[0] + 0.05 + 0.03 * Math.sin(vt * 2.3), c[1] + 0.28 + 0.02 * Math.sin(vt * 3.1), c[2] + 0.02); wL.rotation.y = fl; wR.rotation.y = -fl; moth.rotation.y = 0.6 + 0.4 * Math.sin(vt * 0.7); moth.visible = n < 2; }
      this._W = W; this._n = n;
    },
    grade(t, p, shot) {
      p.exposure = 1.18; p.saturation = 1.02; p.contrast = 1.08; p.bloom = 0.42; p.bloomThreshold = 0.85; p.vignette = 0.56; p.grain = 0.03; p.blackLift = 0.008;
      if (['moon', 'moon2', 'moongo'].includes(shot.mode)) { p.vignette = 0.3; p.bloom = 0.25; p.grain = 0.02; }
      if (['tea', 'flame'].includes(shot.mode)) { p.exposure = 1.3; p.bloom = 0.5; }
      if (shot.mode === 'last') {
        // "Then you.": your eyes come apart — the picture smears, splits, blurs; then the atoms: black
        const y = MathX.smooth(t, UX.you - 0.1, UX.atoms - 0.3);
        p.chroma = 0.9 * y; p.edgeBlur = 1.2 * y; p.smear.set(0.012 * y, 0.004 * y); p.grain = 0.03 + 0.08 * y; p.vignette = 0.56 + 0.3 * y;
        p.fade = Math.max(p.fade, MathX.smooth(t, UX.atoms - 0.6, UX.atoms + 0.5) * 0.97);
      }
      if (['crack', 'drift', 'pieces', 'cold'].includes(shot.mode)) { p.exposure = 1.3; p.warmth = 0.04; p.bloomThreshold = 0.75; }
      if (shot.mode === 'after') { p.bloomThreshold = 1.1; p.bloom = 0.3; }
    },
    labels(t) { return uxGardenLabels(t, this); },
  };
};
const UX_TEA = 75;                                       // °C, your fresh cup
