/* =====================================================================
   GARDEN — your back garden tonight (garden-build.js builds it) and everything the shrinking sky does to it. One set,
   many shots (modes); the light in every one of them comes from the sky as it is at that moment (sky.js, physics.js):
     cold      11:44 tonight (a flash-forward): from the kitchen, the window ablaze with light, the garden on fire
     title     7:29: the garden under the title: frost, stars, the Moon, the telescope, the cat on the wall
     frost0    the bird bath's ice, the frosty lawn
     begin     7:30:00 by the telescope, looking up at Andromeda and Mirach
     mirach    a long look at Mirach: red, then white          squeeze   wider: why (the HUD's diagram)
     half      9:14: the southern sky, every star twice as hot  more      up to the Milky Way: thousands more stars
     best      10:00: the whole sky, overhead                   glow      the dark between the stars starts to glow
     ebl       the light of every galaxy (the HUD's spectrum)   city      10:30 → 11:00: the garden in a city's sky,
                                                                          then twilight; the windows going out
     drown     the stars drowned by the sky                     frost     macro: the frost melting (23:25:37)
     zero      0 °C: the Milky Way over the house, inside out   warm      the cat runs for her flap
     boil      100 °C: you go in (the back door)
     steam … glass   from the kitchen window: the lawn steams, the leaves catch, the lawn and the tree, noon, the shed
                     and the fence, the telescope melts, the Moon fades, the panes sag
     bath      the bird bath boils                              red       the afterglow floods the sky
     melt      the house melts                                  bigbang   2,700 °C: the Big Bang's light
     vanish    everything as hot as the sky: no edges           sun       as hot as the Sun's surface
     last      the last second, slowed down                     same      (the end) the sky would end like this
     after     the closing question: the garden at 7:29 again
   How a surface is drawn (ucPatch): lit by the sky (a hemisphere light, π × the sky's display luminance), the Milky Way
   overhead and the Moon (directional lights); frost on what faces up while it is below 0 °C; wet, then dry; the fire
   front's char (a smooth front function shared with the flames) and its embers; and its own heat: a surface at
   temperature T (physics.js ucThermal) under a sky of luminance L looks like ρL + (1 − ρ)B(T), which is the lit
   surface blended into the sky by B/L. So as it nears the sky's temperature it fades into it (the cavity: shadows and
   edges gone). Kitchen surfaces are lit only by the window (an exact polygon form factor) and the pendant lamp.
   The flames burn hotter than an ordinary fire: the air and the fuel are preheated by the sky (ucFlameT).
   Pure function of film time: night time n = ucNight(t) drives the physics; flicker and drift run on ucVis(t), a clock
   that never runs faster than film time.
   ===================================================================== */

// the visual clock: dτ = min(1, dn/dt) dt (a table, built once)
const UC_VIS = (() => {
  const dt = 1 / 240, N = Math.ceil((UC.end + 2) / dt) + 1, T = new Float64Array(N);
  let acc = 0, prev = ucNight(0);
  for (let i = 1; i < N; i++) { const n = ucNight(i * dt), r = Math.abs(n - prev) / dt; acc += (Number.isFinite(r) ? Math.min(1, Math.max(0.35, r)) : 0.35) * dt; T[i] = acc; prev = n; }
  return { dt, T };
})();
function ucVis(t) { const x = MathX.clamp(t / UC_VIS.dt, 0, UC_VIS.T.length - 1.001), i = Math.floor(x), f = x - i; return UC_VIS.T[i] + (UC_VIS.T[i + 1] - UC_VIS.T[i]) * f; }

// tonight's events in night time (all from physics.js)
const UC_N = (() => {
  const T = (k, K) => ucNightForTemp(k, K);
  const o = {
    frostMelt: T('frost', 273.15), steam: T('grass', 368), grassDry: T('grass', 420), iceGone: T('ice', 0.999), boil: T('water', 373.15), dry: T('dry', 0.999),
    scopeMelt: T('scope', 933), glassSoft: T('glass', 950), metalMelt: T('metal', 1811), brickMelt: T('brick', 1600), catLawn: ucAt(22, 20), catRun: ucNight(UC.catRun),
    ign: {},
  };
  for (const k of ['grass', 'leaves', 'tree', 'shed', 'fence']) o.ign[k] = T(k, UC_STUFF[k].ign);
  return o;
})();
// the fire: how long each kind's front takes to cross (span) and how long a flame lasts (dur), night s
const UC_BURN = { grass: { span: 80, dur: 26 }, leaves: { span: 60, dur: 95 }, tree: { span: 46, dur: 64 }, shed: { span: 70, dur: 150 }, fence: { span: 64, dur: 130 } };
// the fire front's shape over the garden (range ≈ 0…1; the shader has the same function)
function ucFront(x, y, z) { return 0.5 + 0.22 * Math.sin(0.9 * x + 1.3) * Math.cos(0.7 * z + 0.4) + 0.16 * Math.sin(1.7 * x - 2.1 * z) + 0.1 * Math.sin(0.33 * z - 0.5 * y); }
// the moment the front reaches a place where the front function is f, and the char level at night time n
function ucCharAt(kind, f) { const B = UC_BURN[kind]; return UC_N.ign[kind] - 0.1 * B.span + 0.8 * B.span * f; }
function ucCharU(kind, n) { const B = UC_BURN[kind]; return (n - UC_N.ign[kind] + 0.1 * B.span) / (0.8 * B.span); }
// a flame's envelope: [0, 1] while it burns
function ucFlameEnv(age, dur) { return age <= 0 || age >= dur ? 0 : MathX.smooth(age, 0, 2.5) * (1 - MathX.smooth(age, dur * 0.55, dur)); }

// ---------------------------------------------------------------------------------------------------------------------
// THE MATERIAL PATCH: every surface in the garden gets the night's uniforms (shared per kind of thing)
// ---------------------------------------------------------------------------------------------------------------------
const UC_KINDS = ['grass', 'leaves', 'fence', 'shed', 'tree', 'water', 'glass', 'brick', 'roof', 'metal', 'scope', 'soil', 'stone', 'none'];
const UC_FROSTK = { grass: 1, leaves: 0.85, fence: 0.4, shed: 0.6, tree: 0.5, roof: 0.8, metal: 0.65, scope: 0.45, stone: 0.5, brick: 0.15, glass: 0.2, water: 0, soil: 0, none: 0 };
function ucKindU() { return { uEmb: { value: new THREE.Color(0, 0, 0) }, uEq: { value: 0 }, uChar: { value: -1 }, uFrost: { value: 0 }, uWet: { value: 0 } }; }
const UC_GU = {
  uEqCol: { value: new THREE.Color(0, 0, 0) },
  uWin: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
  uWinL: { value: new THREE.Color(0, 0, 0) }, uLampP: { value: new THREE.Vector3() }, uLampC: { value: new THREE.Color(0, 0, 0) },
};
const UC_PATCH_FRAG = /* glsl */`
uniform vec3 uEmb, uEqCol, uWinL, uLampC, uLampP; uniform float uEq, uChar, uFrost, uWet, uIn; uniform vec3 uWin[4];
varying vec3 vUcW; varying vec3 vUcN;
float ucH3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float ucN3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ucH3(i), ucH3(i + vec3(1,0,0)), f.x), mix(ucH3(i + vec3(0,1,0)), ucH3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ucH3(i + vec3(0,0,1)), ucH3(i + vec3(1,0,1)), f.x), mix(ucH3(i + vec3(0,1,1)), ucH3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float ucFront(vec3 w) { return 0.5 + 0.22 * sin(0.9 * w.x + 1.3) * cos(0.7 * w.z + 0.4) + 0.16 * sin(1.7 * w.x - 2.1 * w.z) + 0.1 * sin(0.33 * w.z - 0.5 * w.y); }
float ucEdge(vec3 p, vec3 n, vec3 a, vec3 b) { vec3 u = normalize(a - p), v = normalize(b - p); return acos(clamp(dot(u, v), -1.0, 1.0)) * dot(n, normalize(cross(u, v))); }
// the irradiance from the window (radiance 1) at p, normal n: Lambert's polygon formula
float ucWinE(vec3 p, vec3 n) { return max(0.0, -0.5 * (ucEdge(p, n, uWin[0], uWin[1]) + ucEdge(p, n, uWin[1], uWin[2]) + ucEdge(p, n, uWin[2], uWin[3]) + ucEdge(p, n, uWin[3], uWin[0]))); }
`;
function ucPatch(mat, KU, inU) {
  mat.userData.ucPatched = true;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, KU, UC_GU, { uIn: inU });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vUcW; varying vec3 vUcN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 ucw = vec4(transformed, 1.0); vec3 ucn = objectNormal;
          #ifdef USE_INSTANCING
            ucw = instanceMatrix * ucw; ucn = mat3(instanceMatrix) * ucn;
          #endif
          vUcW = (modelMatrix * ucw).xyz; vUcN = normalize(mat3(modelMatrix) * ucn); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + UC_PATCH_FRAG)
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec3 ucNn = normalize(vUcN); float ucNz = ucN3(vUcW * 2.3), ucNf = ucN3(vUcW * 11.0);
        // frost: white crystals on whatever faces up (while it is below 0 °C)
        float ucFr = uFrost * smoothstep(0.15, 0.65, ucNn.y + 0.35 * (ucNz - 0.5)) * (0.6 + 0.4 * ucNf);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.8, 0.83, 0.88), ucFr);
        diffuseColor.rgb *= 1.0 - 0.4 * uWet;
        // the fire front: scorched just ahead of it, char behind it
        float ucF = ucFront(vUcW) + 0.12 * (ucNz - 0.5) + 0.05 * (ucNf - 0.5);
        float ucCh = smoothstep(ucF - 0.035, ucF + 0.035, uChar), ucSc = smoothstep(ucF - 0.14, ucF - 0.03, uChar) * (1.0 - ucCh);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.1, 0.05) * (0.6 + 0.4 * ucNf), ucSc * 0.8);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.028, 0.024, 0.02) * (0.7 + 0.6 * ucNf), ucCh);
        float ucEb = ucCh * (1.0 - smoothstep(ucF + 0.04, ucF + 0.22, uChar)) * smoothstep(0.35, 0.75, ucN3(vUcW * 6.0 + 1.7));   // embers just behind the front`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.9, ucFr); roughnessFactor = mix(roughnessFactor, 0.2, uWet * (1.0 - ucCh)); roughnessFactor = mix(roughnessFactor, 0.95, ucCh);`)
      .replace('#include <aomap_fragment>', `
        if (uIn > 0.5) {
          // indoors: no sky, no Moon; the window (exact) and the lamp (a soft point, plus its bounce)
          reflectedLight.directDiffuse = vec3(0.0); reflectedLight.directSpecular = vec3(0.0); reflectedLight.indirectSpecular *= 0.15;
          vec3 ucLd = uLampP - vUcW; float ucD2 = dot(ucLd, ucLd);
          vec3 ucIrr = uWinL * ucWinE(vUcW, ucNn) * mix(1.0, 0.4, max(0.0, -ucNn.y)) + uLampC * (max(dot(ucNn, ucLd * inversesqrt(ucD2)), 0.0) / (ucD2 + 0.08) + 0.18);
          reflectedLight.indirectDiffuse = ucIrr * BRDF_Lambert(material.diffuseColor);
        }
        #include <aomap_fragment>`)
      .replace('#include <opaque_fragment>', `
        outgoingLight += uEmb * ucEb * (0.35 + 0.65 * ucNf);         // embers
        outgoingLight = mix(outgoingLight, uEqCol, uEq);             // its own heat: ρL + (1 − ρ)B, i.e. into the sky by B/L
        #include <opaque_fragment>`);
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// CPU deformation (for things that melt): rest positions in world space; fn(x, y, z, out) writes a world offset
// ---------------------------------------------------------------------------------------------------------------------
function ucDeformer(meshes) {
  const items = meshes.filter((m) => m.isMesh && m.geometry && m.geometry.attributes.position).map((m) => {
    m.updateMatrixWorld(true);
    if (!m.geometry.userData.ucOwn) { m.geometry = m.geometry.clone(); m.geometry.userData.ucOwn = true; }
    const g = m.geometry; g.attributes.position.setUsage(THREE.DynamicDrawUsage);
    return { m, g, base: Float32Array.from(g.attributes.position.array), M: m.matrixWorld.clone(), Mi: m.matrixWorld.clone().invert(), dirty: false };
  });
  const v = new THREE.Vector3(), d = [0, 0, 0];
  return {
    apply(fn) {
      for (const it of items) {
        const a = it.g.attributes.position.array, b = it.base;
        for (let i = 0; i < a.length; i += 3) {
          v.set(b[i], b[i + 1], b[i + 2]).applyMatrix4(it.M); d[0] = d[1] = d[2] = 0; fn(v.x, v.y, v.z, d);
          v.x += d[0]; v.y += d[1]; v.z += d[2]; v.applyMatrix4(it.Mi); a[i] = v.x; a[i + 1] = v.y; a[i + 2] = v.z;
        }
        it.g.attributes.position.needsUpdate = true; it.g.computeVertexNormals(); it.g.computeBoundingSphere(); it.dirty = true;
      }
    },
    reset() { for (const it of items) if (it.dirty) { it.g.attributes.position.array.set(it.base); it.g.attributes.position.needsUpdate = true; it.g.computeVertexNormals(); it.g.computeBoundingSphere(); it.dirty = false; } },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// FLAMES — tongues of fire: quads that turn about the vertical to face the camera, the flame drawn in the shader (a
// teardrop warped by rising noise: a white-yellow core, orange edges, dimmer red tips). Additive: a flame is light.
// add(x, y, z, width, height, level, r, g, b, seed); (r, g, b) the flame's colour at unit luminance, level its display
// brightness. A pool rewritten every frame (pure).
// ---------------------------------------------------------------------------------------------------------------------
function ucFlames(scene, max = 4000) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1); q.translate(0, 0.5, 0);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  const P = new Float32Array(max * 4), C = new Float32Array(max * 4), S = new Float32Array(max * 2);
  const iP = new THREE.InstancedBufferAttribute(P, 4), iC = new THREE.InstancedBufferAttribute(C, 4), iS = new THREE.InstancedBufferAttribute(S, 2);
  for (const x of [iP, iC, iS]) x.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iP', iP); g.setAttribute('iC', iC); g.setAttribute('iS', iS); g.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, fogDen: { value: 0 } },
    vertexShader: `attribute vec4 iP; attribute vec4 iC; attribute vec2 iS; varying vec2 vUv; varying vec4 vC; varying float vS; varying float vD;
      void main(){ vUv = uv; vC = iC; vS = iP.w;
        vec3 c = iP.xyz, tc = cameraPosition - c; vec3 rt = normalize(vec3(tc.z, 0.0, -tc.x) + vec3(1e-5, 0.0, 0.0));
        vec4 mv = viewMatrix * vec4(c + rt * position.x * iS.x + vec3(0.0, position.y * iS.y, 0.0), 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uT, fogDen; varying vec2 vUv; varying vec4 vC; varying float vS; varying float vD;
      float fh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float fn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(fh(i), fh(i + vec2(1.0, 0.0)), f.x), mix(fh(i + vec2(0.0, 1.0)), fh(i + vec2(1.0, 1.0)), f.x), f.y); }
      float fb(vec2 p){ return 0.55 * fn(p) + 0.3 * fn(p * 2.13 + 3.1) + 0.15 * fn(p * 4.37 + 7.7); }
      void main(){
        float y = vUv.y, x = vUv.x * 2.0 - 1.0, t = uT * 1.7 + vS * 17.0;
        vec2 q = vec2(x * 1.25 + vS * 5.3, y * 2.3 - t);
        float n = fb(q), m = fb(q * 2.4 + vec2(1.7, -t * 0.7));
        float xs = x + (n - 0.5) * 1.0 * y + (m - 0.5) * 0.22;
        float w = 1.2 * pow(max(y, 0.0), 0.32) * pow(max(1.0 - y, 0.0), 0.7);
        float d = (1.0 - smoothstep(w * 0.45, w, abs(xs))) * (1.0 - smoothstep(0.5, 0.98, y + 0.5 * (n - 0.5) + 0.3 * (m - 0.5))) * smoothstep(0.0, 0.07, y);
        if (d < 0.004) discard;
        float core = (1.0 - smoothstep(0.0, max(0.02, w * 0.7), abs(xs))) * (1.0 - smoothstep(0.05, 0.62, y));
        vec3 col = mix(vC.rgb * vec3(1.0, 0.62, 0.36), mix(vC.rgb, vec3(1.0), 0.35), core) * mix(1.0, 0.5, smoothstep(0.35, 0.95, y));
        gl_FragColor = vec4(col * vC.a * pow(d, 1.7) * (0.45 + 1.0 * core) * exp(-fogDen * vD), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 7; scene.add(mesh);
  let n = 0;
  return {
    mesh, mat,
    begin(vt) { n = 0; mat.uniforms.uT.value = vt; mat.uniforms.fogDen.value = scene.fog ? scene.fog.density : 0; },
    add(x, y, z, w, h, lv, r, gg, b, seed) {
      if (n >= max || !(lv > 1e-4) || !(h > 0.005)) return;
      P[n * 4] = x; P[n * 4 + 1] = y; P[n * 4 + 2] = z; P[n * 4 + 3] = seed; C[n * 4] = r; C[n * 4 + 1] = gg; C[n * 4 + 2] = b; C[n * 4 + 3] = lv; S[n * 2] = w; S[n * 2 + 1] = h; n++;
    },
    end() { g.instanceCount = n; for (const x of [iP, iC, iS]) x.needsUpdate = true; },
  };
}
// a flame's temperature tonight: the air and the fuel arrive preheated by the sky, so it burns hotter than an
// ordinary wood fire (≈ 1,450 K soot) by most of the preheat; its luminance: soot at that temperature, emissivity 0.6
function ucFlameT(n) { return 1450 + 0.85 * Math.max(0, ucTempAt('grass', n) - 290); }
function ucFlameLum(n) { return 0.6 * ucBBLum(ucFlameT(n)); }

UC_SETS.garden = (app) => {
  const S = ucSet(app, { sky: '#05070d', fov: 55, near: 0.02, far: 8000, hemi: ['#000000', '#000000', 1], sun: [-40, 30, -30], sunColor: '#aebbd6', sunI: 1.0, shadow: 2048, shadowR: 22, shadowFar: 200, env: ['#ffffff', '#a8a8a8', '#404040'] });
  const scene = S.scene, cam = S.camera, G = UC_G;
  scene.fog = new THREE.FogExp2('#0c1018', 0.005);
  const P = ucBuildGarden(app, S), M = P.M;
  const sky = new UcSky(scene);
  // the Moon's light comes from the Moon; the Milky Way's from overhead (Cygnus, behind the house)
  const md = sky.moonDir; S.sun.position.set(md.x * 60, md.y * 60, md.z * 60 - 6); S.sun.target.position.set(0, 0, -6);
  const band = new THREE.DirectionalLight('#ffffff', 0); { const b = sky.bandDir; band.position.set(b.x * 60, b.y * 60, b.z * 60 - 6); band.target.position.set(0, 0, -6); scene.add(band, band.target); }
  // ---- the lamps: the kitchen's spill on the patio, the hall, the bedroom, the solar string lights (their display fades
  // as the sky outshines them: ucLampFade)
  const warm = '#ffb468';
  const kit = new THREE.SpotLight(warm, 14, 16, 0.95, 0.85, 1.6); kit.position.set(-1.6, 1.7, 0.6); kit.target.position.set(-1.4, 0, -5); scene.add(kit, kit.target);
  const door = new THREE.SpotLight(warm, 6, 10, 0.8, 0.9, 1.6); door.position.set(1.6, 1.9, 0.5); door.target.position.set(1.6, 0, -4); scene.add(door, door.target);
  const bed = new THREE.SpotLight(warm, 8, 22, 0.6, 0.9, 1.6); bed.position.set(-1.6, 4.4, 0.6); bed.target.position.set(-1.2, 0, -9); scene.add(bed, bed.target);
  for (const L of [kit, door, bed]) L.castShadow = false;
  const strings = [-2.5, -8, -13.5].map((z) => { const p = new THREE.PointLight('#ffc070', 1.1, 6, 1.8); p.position.set(-G.lawnW / 2 + 0.25, 1.75, z); scene.add(p); return p; });
  // the window, for the kitchen's light (world corners, ordered for ucWinE)
  { const K = G.kWin, z = 0.03; [[K[0], K[2]], [K[1], K[2]], [K[1], K[3]], [K[0], K[3]]].forEach(([x, y], i) => UC_GU.uWin.value[i].set(x, y, z)); }
  P.house.updateMatrixWorld(true); UC_GU.uLampP.value.set(...P.lampAt);

  // ---- the cat (outdoors, then on the kitchen worktop)
  const catRoot = new THREE.Group(); scene.add(catRoot);
  const cat = ucBuildCat(catRoot);
  // ---- dead leaves on the lawn (most under the apple tree)
  const NLF = 220, LEAF = Array.from({ length: NLF }, (_, i) => {
    const under = ucR(i, 3) < 0.6, a = ucR(i, 4) * 6.283, rr = under ? 0.3 + 2.6 * Math.sqrt(ucR(i, 5)) : 0;
    const x = under ? G.tree[0] + Math.cos(a) * rr : -4.2 + 8.4 * ucR(i, 6), z = under ? G.tree[2] + Math.sin(a) * rr * 0.8 : -3.6 - 12.6 * ucR(i, 7);
    return { x, z, ry: ucR(i, 8) * 6.28, s: 0.7 + 0.6 * ucR(i, 9), tilt: (ucR(i, 10) - 0.5) * 0.5, f: ucFront(x, 0, z) };
  }).filter((L) => Math.hypot(L.x - G.bath[0], L.z - G.bath[2]) > 0.45 && !(L.x > 2.0 && L.z < -13.9));
  // (and a drift the wind left along the edge of the patio, in view of the kitchen window)
  const NDR = 150; for (let i = 0; i < NDR; i++) { const x = -3.5 + 3.9 * Math.pow(ucR(i, 13), 0.8), z = -3.12 - 1.1 * Math.pow(ucR(i, 14), 1.6) * (0.6 + 0.4 * Math.sin(x * 1.3 + 0.5) ** 2);
    LEAF.push({ x, z, ry: ucR(i, 15) * 6.28, s: 0.9 + 0.5 * ucR(i, 16), tilt: (ucR(i, 17) - 0.5) * 0.6, f: ucFront(x, 0, z), drift: true }); }
  const leafGeo = new THREE.PlaneGeometry(0.075, 0.05, 2, 1); { const p = leafGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.008 * Math.abs(p.getX(i)) / 0.037); leafGeo.rotateX(-Math.PI / 2); leafGeo.computeVertexNormals(); }
  const leafMat = ucStd('#6a4a26', 0.85, 0, { side: THREE.DoubleSide });
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, LEAF.length); leaves.castShadow = false; leaves.receiveShadow = true; scene.add(leaves);
  // ---- the macro patch of frosty grass (the frost shot): blades, frost crystals on them, then droplets
  const FA = G.frostAt, NBL = 1300;
  const bladeGeo = (() => { const g = new THREE.PlaneGeometry(0.0045, 0.085, 1, 5); g.translate(0, 0.0425, 0); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), u = y / 0.085; p.setX(i, p.getX(i) * (1 - 0.85 * u)); p.setZ(i, 0.022 * u * u); } g.computeVertexNormals(); return g; })();
  const bladeMat = ucStd('#3c6630', 0.55, 0, { side: THREE.DoubleSide });
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, NBL); blades.castShadow = false; scene.add(blades);
  const BL = Array.from({ length: NBL }, (_, i) => { const a = ucR(i, 31) * 6.283, r = 0.36 * Math.sqrt(ucR(i, 32)); return { x: FA[0] + Math.cos(a) * r, z: FA[2] + Math.sin(a) * r, ry: ucR(i, 33) * 6.28, s: 0.65 + 0.7 * ucR(i, 34), lean: (ucR(i, 35) - 0.5) * 0.6 }; });
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
  BL.forEach((b, i) => { _e.set(b.lean, b.ry, 0); _q.setFromEuler(_e); _s.set(1, b.s, 1); _m4.compose(_v.set(b.x, 0.0, b.z), _q, _s); blades.setMatrixAt(i, _m4); });
  blades.instanceMatrix.needsUpdate = true;
  // (a crystal or a droplet sits at a point on a blade: u along it, on one side)
  const NCR = 2600, CR = Array.from({ length: NCR }, (_, i) => {
    const b = BL[i % NBL], u = 0.15 + 0.8 * ucR(i, 41), sd = ucR(i, 42) < 0.5 ? -1 : 1;
    _e.set(b.lean, b.ry, 0); _q.setFromEuler(_e);
    const lp = new THREE.Vector3(sd * 0.0022 * (1 - 0.85 * u), 0.085 * u * b.s, 0.022 * u * u + 0.0012).applyQuaternion(_q);
    return { x: b.x + lp.x, y: lp.y, z: b.z + lp.z, s: 0.0012 + 0.0022 * ucR(i, 43), r: ucR(i, 44) * 6.28, j: (ucR(i, 45) - 0.5) * 16, d: ucR(i, 46) < 0.45 };
  });
  const crystals = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), ucStd('#f2f6fa', 0.2, 0, { flatShading: true }), NCR); crystals.castShadow = false; scene.add(crystals);
  // (a droplet is a tiny lens: the bright sky upside down in its lower half, the dark grass above, a dark rim, a glint;
  // drawn as discs facing the camera, lit as bright as the sky they show)
  const dropTex = ucTex(ucCanvas(64, 64, (c, w) => {
    const g = c.createLinearGradient(0, 0, 0, w); g.addColorStop(0, '#26401f'); g.addColorStop(0.42, '#6d8a6f'); g.addColorStop(0.66, '#dfe8ea'); g.addColorStop(1, '#ffffff');
    c.save(); c.beginPath(); c.arc(w / 2, w / 2, w * 0.46, 0, 6.283); c.clip(); c.fillStyle = g; c.fillRect(0, 0, w, w);
    const rr = c.createRadialGradient(w / 2, w / 2, w * 0.28, w / 2, w / 2, w * 0.47); rr.addColorStop(0, 'rgba(0,0,0,0)'); rr.addColorStop(1, 'rgba(12,22,14,0.8)'); c.fillStyle = rr; c.fillRect(0, 0, w, w); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); c.arc(w * 0.37, w * 0.31, w * 0.065, 0, 6.283); c.fill();
  }), { repeat: false });
  const drops = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: dropTex, transparent: true, alphaTest: 0.02, depthWrite: false }), NCR); drops.castShadow = false; drops.renderOrder = 2; scene.add(drops);
  // ---- particles: flames (additive), smoke and steam (normal)
  const flames = ucFlames(scene, 5000), fire = ucPuffs(scene, 3000, { additive: true, soft: 2.2 });
  const smoke = ucPuffs(scene, 9000, { soft: 1.6 });
  fire.mesh.renderOrder = 7; smoke.mesh.renderOrder = 6; flames.mesh.renderOrder = 8;

  // ---- patch every surface
  const KU = Object.fromEntries(UC_KINDS.map((k) => [k, ucKindU()]));
  const inOff = { value: 0 }, inOn = { value: 1 }, catIn = { value: 0 };
  const kindOf = new Map(), put = (k, ...ms) => ms.forEach((m) => m && kindOf.set(m, k));
  put('grass', M.grass, bladeMat); put('soil', M.strata, M.soil); put('stone', M.slab, M.stoneDark, M.stone, M.coping, M.pot, M.sill); put('brick', M.brick, M.wallBrick);
  put('fence', M.fence, M.post, M.door, M.frame); put('shed', M.shed); put('roof', M.roof); put('tree', M.leaf, M.leaf2, M.bark); put('water', M.water, M.ice);
  put('glass', M.glassLit, M.glassDark, M.pane); put('metal', M.metal, M.black, M.wire); put('scope', M.white); put('leaves', leafMat);
  const facades = new Set((P.neighbours || []).map((f) => f.parent));
  const under = (o, g) => { for (let p = o; p; p = p.parent) if (p === g) return true; return false; };
  const underAny = (o, set) => { for (let p = o; p; p = p.parent) if (set.has(p)) return true; return false; };
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || under(o, catRoot)) return;
    for (const m of [].concat(o.material)) {                 // (the ground slabs carry two materials: turf, strata)
      if (!m.isMeshStandardMaterial || m.userData.ucPatched) continue;
      const indoor = !!m.userData.indoor;
      let k = kindOf.get(m);
      if (!k) k = indoor ? 'none' : under(o, P.door) ? 'fence' : under(o, P.shed) ? 'shed' : under(o, P.far) ? 'roof' : underAny(o, facades) ? 'brick' : under(o, P.house) ? 'brick' : under(o, P.scope) ? 'metal' : 'none';
      ucPatch(m, KU[k], indoor ? inOn : inOff);
    }
  });
  catRoot.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && !o.material.userData.ucPatched) ucPatch(o.material, KU.none, catIn); });
  const catMats = []; catRoot.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) catMats.push(o.material); });

  // ---- the fire: every place that can burn, with the night time the front reaches it
  const FIRE = [];
  const addF = (x, y, z, s, kind, o = {}) => { const f = ucFront(x, y, z); FIRE.push({ x, y, z, s, kind, at: ucCharAt(kind, f) - (o.lead ?? 6) + (o.jit || 0), dur: (o.dur ?? UC_BURN[kind].dur) * (0.8 + 0.4 * ucR(FIRE.length, 71)), k: FIRE.length, smoke: o.smoke ?? 2, sm: o.sm ?? 1 }); };
  // the lawn (and next door's), on a jittered grid; not under the shed, the bath or on the patio
  for (let x = -4.2; x <= 4.21; x += 0.62) for (let z = -3.5; z >= -16.3; z -= 0.66) {
    const i = FIRE.length, xx = x + (ucR(i, 72) - 0.5) * 0.4, zz = z + (ucR(i, 73) - 0.5) * 0.4;
    if (Math.hypot(xx - G.bath[0], zz - G.bath[2]) < 0.5 || (xx > 1.9 && zz < -13.9)) continue;
    addF(xx, 0.0, zz, 0.2 + 0.1 * ucR(i, 74), 'grass', { smoke: 1, sm: 0.7 });
  }
  for (const [x0, x1, z0, z1, st] of [[-12, -5.3, -1, -16, 1.5], [5.3, 12, -1, -16, 1.5], [-14, 14, -18.5, -30, 2.2]])
    for (let x = x0; x <= x1; x += st) for (let z = z0; z >= z1; z -= st) { const i = FIRE.length; addF(x + (ucR(i, 75) - 0.5) * st * 0.6, 0, z + (ucR(i, 76) - 0.5) * st * 0.6, 0.3, 'grass', { smoke: 1, sm: 0.8 }); }
  // the dead leaves (in clusters)
  for (let i = 0; i < LEAF.length; i += LEAF[i].drift ? 3 : 4) addF(LEAF[i].x, 0.0, LEAF[i].z, LEAF[i].drift ? 0.17 : 0.13, 'leaves', { smoke: 1, sm: 0.6, lead: 2.5 });
  // every shrub and crown
  P.foliage.forEach((o, i) => { o.updateMatrixWorld(true); const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld), r = o.geometry.boundingSphere ? (o.geometry.computeBoundingSphere(), o.geometry.boundingSphere.radius) : 0.5;
    o.userData.base = o.scale.clone(); o.userData.f = ucFront(p.x, p.y, p.z);
    const nn = r > 0.8 ? 4 : r > 0.5 ? 2 : 1;
    for (let k = 0; k < nn; k++) { const a = ucR(i * 7 + k, 77) * 6.28; addF(p.x + Math.cos(a) * r * 0.5, p.y + r * (0.2 + 0.4 * ucR(i * 7 + k, 78)), p.z + Math.sin(a) * r * 0.5, 0.3 + 0.35 * r, 'tree', { smoke: 3, sm: 1.4 }); } });
  // the shed (walls and roof) and the fences
  for (let i = 0; i < 34; i++) { const u = ucR(i, 81), side = i % 3; const x = G.shed[0] + (side === 2 ? (ucR(i, 82) < 0.5 ? -1.12 : 1.12) : (u - 0.5) * 2.1), z = G.shed[2] + (side === 0 ? 0.92 : side === 1 ? (ucR(i, 83) - 0.5) * 1.7 : (ucR(i, 84) - 0.5) * 1.7), y = side === 1 ? 2.1 + 0.3 * ucR(i, 85) : 0.3 + 1.6 * ucR(i, 86);
    addF(x, y, z, 0.5 + 0.35 * ucR(i, 87), 'shed', { smoke: 4, sm: 2.2 }); }
  for (const sx of [-1, 1]) for (let z = -0.6; z >= -16.6; z -= 0.7) { const i = FIRE.length; addF(sx * (G.lawnW / 2 + 0.06), 0.2 + 0.9 * ucR(i, 89), z + (ucR(i, 88) - 0.5) * 0.4, 0.34 + 0.16 * ucR(i, 87), 'fence', { smoke: 2, sm: 1.6 }); }
  for (const x of [-10.9, -5.45, 5.45, 10.9]) for (let z = -18; z >= -31; z -= 1.4) addF(x, 0.9, z, 0.5, 'fence', { smoke: 2, sm: 1.5 });
  for (const sx of [-1, 1]) for (let z = -1; z >= -16.5; z -= 1.3) addF(sx * (G.lawnW / 2 + 6.4), 0.9, z, 0.5, 'fence', { smoke: 2, sm: 1.5 });

  // ---- what melts: the telescope, the panes, the house
  const scopeDef = ucDeformer((() => { const a = []; P.scope.traverse((o) => o.isMesh && a.push(o)); return a; })());
  P.scopeHead.updateMatrixWorld(true); const scopePivot = new THREE.Vector3().setFromMatrixPosition(P.scopeHead.matrixWorld);
  const houseDef = ucDeformer((() => { const a = []; P.house.traverse((o) => { if (o.isMesh && !P.panes.includes(o) && !under(o, P.door)) a.push(o); }); return a; })());
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 28), ucStd('#c8ccd0', 0.18, 0.9)); puddle.rotation.x = -Math.PI / 2; puddle.position.set(G.scope[0], 0.012, G.scope[2]); scene.add(puddle);
  const state = { scopeOn: false, houseOn: false };

  // ---- the frame's lights, for a white surface, in display units (the Sky's E × luminance)
  function lampFade(E) { const x = E * 25 / 1.2; return x / (1 + x); }
  // --------------------------------------------------------------------------------------------------------------
  // what happens tonight, at night time n (the same in every shot)
  function world(t, n, vt, shot) {
    const Ss = sky.state.S, E = sky.state.E, skyD = E * Ss.L, rgb = ucUnitLum(Ss.rgb);
    const lf = lampFade(E);
    // ---- the light from the sky: the hemisphere (π × display), a little fill at night (moonlit haze, the town)
    const fill = E * 0.035, nc = [0.55, 0.66, 1.0];
    S.hemi.intensity = 1;
    S.hemi.color.setRGB(Math.PI * (skyD * rgb[0] + fill * nc[0]), Math.PI * (skyD * rgb[1] + fill * nc[1]), Math.PI * (skyD * rgb[2] + fill * nc[2]));
    const Tg = ucTempAt('grass', n), gB = E * 0.9 * ucBBLum(Tg), gc = ucUnitLum(UC_BB.at(Tg).rgb), gnd = 0.12 * E * Ss.Lavg;
    S.hemi.groundColor.setRGB(Math.PI * (gnd * rgb[0] + 0.5 * gB * gc[0] + 0.1 * fill), Math.PI * (gnd * rgb[1] + 0.5 * gB * gc[1] + 0.1 * fill), Math.PI * (gnd * rgb[2] + 0.5 * gB * gc[2] + 0.12 * fill));
    // the Moon (its light: sunlight, a little bluer to the eye at night) and the Milky Way overhead
    const mc = ucUnitLum(Ss.moonRGB); S.sun.intensity = sky.moonLight; S.sun.color.setRGB(0.5 * mc[0] + 0.38, 0.5 * mc[1] + 0.42, 0.5 * mc[2] + 0.5);
    const bc = ucMixRGB([[0.16 * Ss.mw, Ss.mwRGB], [0.05 * Ss.dust, Ss.dustRGB[0] + Ss.dustRGB[1] + Ss.dustRGB[2] > 0 ? Ss.dustRGB : [1, 0.3, 0.1]]]), bu = ucUnitLum(bc);
    band.intensity = Math.PI * sky.bandLight / 0.9; band.color.setRGB(bu[0], bu[1], bu[2]);
    scene.environmentIntensity = 1.2 * (skyD + fill + sky.bandLight * 0.5);
    // ---- the lamps (they fade as the sky outshines them)
    kit.intensity = 14 * lf; door.intensity = 6 * lf; bed.intensity = 8 * lf; strings.forEach((p) => (p.intensity = 1.1 * lf));
    M.glassLit.emissiveIntensity = 1.25 * lf; for (const h of P.neighbours || []) h.material.emissiveIntensity = lf;
    M.bulb.color.setRGB(1.0 * lf, 0.81 * lf, 0.53 * lf); P.bulbIn.material.color.setRGB(1.4 * lf, 1.1 * lf, 0.75 * lf);
    UC_GU.uLampC.value.setRGB(0.9 * lf, 0.66 * lf, 0.42 * lf);
    UC_GU.uWinL.value.setRGB(skyD * rgb[0] + 0.25 * sky.bandLight, skyD * rgb[1] + 0.25 * sky.bandLight, skyD * rgb[2] + 0.25 * sky.bandLight);
    // ---- every kind of thing: its temperature → frost, wet, char, its glow, and the cavity
    UC_GU.uEqCol.value.setRGB(skyD * rgb[0], skyD * rgb[1], skyD * rgb[2]);
    const wet = MathX.smooth(n, UC_N.frostMelt - 5, UC_N.frostMelt + 25) * (1 - MathX.smooth(n, ucAt(23, 31), ucAt(23, 34, 30)));
    // the cavity: a surface at temperature T under a sky of luminance L looks like ρL + (1 − ρ)B(T), i.e. it blends into
    // the sky by B/L; its last faint edges (a few per cent: shadows, corners) go by 11:53
    const eqCap = 0.96 + 0.037 * MathX.smooth(n, ucAt(23, 52, 30), ucAt(23, 53, 30));
    for (const k of UC_KINDS) {
      const U = KU[k];
      if (k === 'none') continue;
      const T = ucTempAt(k === 'grass' ? 'frost' : k, n), B = ucBBLum(ucTempAt(k, n));
      U.uEq.value = Math.min(eqCap, B / Math.max(1e-30, Ss.L));
      U.uChar.value = UC_BURN[k] ? ucCharU(k, n) : -1;
      if (UC_BURN[k]) { const Te = ucFlameT(n) - 250, ce = ucUnitLum(UC_BB.at(Te).rgb), le = E * 0.9 * ucBBLum(Te); U.uEmb.value.setRGB(ce[0] * le, ce[1] * le, ce[2] * le); }
      U.uFrost.value = UC_FROSTK[k] * (1 - MathX.smooth(T, 272.95, 273.6));
      U.uWet.value = k === 'grass' || k === 'stone' || k === 'leaves' ? wet : 0;
    }
    KU.none.uEq.value = KU.stone.uEq.value;
    KU.leaves.uChar.value = ucCharU('leaves', n); KU.leaves.uEmb.value.copy(KU.grass.uEmb.value);
    // ---- the fog: the sky's colour at the horizon; with the smoke a little thicker, and the colour of smoke in it
    const smokeK = MathX.smooth(n, ucAt(23, 38), ucAt(23, 43)) * (1 - MathX.smooth(n, ucAt(23, 47), ucAt(23, 50)));
    { const sk = 1 - 0.4 * smokeK; scene.fog.color.setRGB(skyD * rgb[0] * sk * 1.02 + 0.06 * fill, skyD * rgb[1] * sk * 0.97 + 0.07 * fill, skyD * rgb[2] * sk * 0.9 + 0.1 * fill); }
    scene.fog.density = 0.004 + 0.005 * smokeK;
    // the far ground (below the dome's horizon): the sky's light off it, later its own glow
    { const eq = KU.grass.uEq.value, gl = 0.15 * E * Ss.Lavg + gB; sky.domeU.uGround.value.setRGB(ucLerp(gl * gc[0] * 0.3 + 0.15 * E * Ss.Lavg * rgb[0], skyD * rgb[0], eq), ucLerp(gl * gc[1] * 0.3 + 0.15 * E * Ss.Lavg * rgb[1], skyD * rgb[1], eq), ucLerp(gl * gc[2] * 0.3 + 0.15 * E * Ss.Lavg * rgb[2], skyD * rgb[2], eq)); }

    // ---- the bird bath: ice → water → boiling → dry
    { const ice = ucTempAt('ice', n), dry = ucTempAt('dry', n);
      P.bathIce.visible = ice < 0.995; P.bathIce.scale.set(1, Math.max(0.15, 1 - ice), 1);
      M.ice.color.setRGB(1 - 0.5 * ice, 1 - 0.48 * ice, 1 - 0.45 * ice); M.ice.roughness = 0.45 - 0.35 * ice;
      P.bathWater.visible = dry < 0.985; P.bathWater.position.y = 0.98 - 0.075 * dry; P.bathWater.scale.set(1 - 0.32 * dry, 1, 1 - 0.32 * dry); }
    // ---- the leaves on the lawn (burnt ones curl up and shrink)
    LEAF.forEach((L, i) => { const bt = MathX.smooth(n, ucCharAt('leaves', L.f) + 4, ucCharAt('leaves', L.f) + 14);
      _e.set(L.tilt * (1 + 2 * bt), L.ry, 0); _q.setFromEuler(_e); _s.setScalar(L.s * (1 - 0.55 * bt)); _m4.compose(_v.set(L.x, 0.012, L.z), _q, _s); leaves.setMatrixAt(i, _m4); });
    leaves.instanceMatrix.needsUpdate = true;
    // ---- shrubs and crowns burn back to char
    for (const o of P.foliage) { const a = ucCharAt('tree', o.userData.f), bt = MathX.smooth(n, a + 6, a + 52); o.scale.copy(o.userData.base).multiplyScalar(1 - 0.6 * bt); }
    // ---- the shed's roof falls in
    { const k = MathX.smooth(n, UC_N.ign.shed + 150, UC_N.ign.shed + 175); P.shedRoof.position.y = 2.0 - 1.3 * k; P.shedRoof.rotation.z = 0.35 * k; }
    // ---- the telescope melts (its aluminium tube: it bends, flows down over the head; later the steel tripod goes too)
    { const m1 = MathX.smooth(n, UC_N.scopeMelt - 2, UC_N.scopeMelt + 24), m2 = MathX.smooth(n, UC_N.metalMelt - 10, UC_N.metalMelt + 50);
      if (m1 > 0) {
        const px = scopePivot.x, py = scopePivot.y, pz = scopePivot.z;
        scopeDef.apply((x, y, z, d) => {
          const top = MathX.smooth(y, py - 0.18, py - 0.02), dd = Math.hypot(x - px, z - pz), dyz = y - py;
          let dy = -m1 * top * (1.5 * dd * dd + 0.6 * dd + 0.08 * Math.max(0, dyz)) - m1 * m1 * top * 0.12;
          const yy = Math.max(0.03 + 0.02 * ucR(Math.round(x * 97 + z * 41), 5), y + dy);
          const fl = 0.02 + 0.025 * (0.5 + 0.5 * Math.sin(x * 23 + z * 17));
          d[0] = (x - px) * 0.5 * m2; d[2] = (z - pz) * 0.5 * m2; d[1] = ucLerp(yy, fl, m2 * m2) - y;
        });
        state.scopeOn = true;
      } else if (state.scopeOn) { scopeDef.reset(); state.scopeOn = false; }
      puddle.visible = m1 > 0.3; puddle.scale.setScalar(0.08 + 0.25 * m1 + 0.4 * m2); }
    // ---- the panes sag (the glass softens at 950 K: it flows down, a gap opens at the top)
    { const a = MathX.smooth(n, UC_N.glassSoft - 8, UC_N.glassSoft + 110) * 0.9 + 0.1 * MathX.smooth(n, UC_N.glassSoft + 110, UC_N.glassSoft + 300);
      for (const pm of P.panes) {
        const pa = pm.geometry.attributes.position, b = pm.userData.base, h = pm.userData.h, w = pm.geometry.parameters.width;
        for (let i = 0; i < pa.count; i++) {
          const x = b[i * 3], y = b[i * 3 + 1], u = (y + h / 2) / h, edge = 1 - Math.pow(Math.abs(x) / (w / 2), 4);
          pa.setXYZ(i, x * (1 - 0.06 * a * (1 - u)), y - a * h * 0.5 * Math.pow(u, 1.25) * (0.75 + 0.25 * edge), -a * 0.07 * Math.sin(Math.PI * Math.min(1, u * 1.6)) * edge);
        }
        pa.needsUpdate = true; pm.geometry.computeVertexNormals(); pm.visible = n < UC_N.brickMelt;
      }
      M.pane.opacity = 0.12 + 0.26 * a; M.pane.color.setRGB(0.87 - 0.2 * a, 0.91 - 0.12 * a, 0.93 - 0.18 * a); }
    // ---- the house melts (brick: from 1,600 K; the walls slump and run out at the foot)
    { const m = MathX.smooth(n, UC_N.brickMelt - 15, UC_N.brickMelt + 160) * 0.85 + 0.15 * MathX.smooth(n, UC_N.brickMelt + 160, UC_N.brickMelt + 420);
      if (m > 0) {
        houseDef.apply((x, y, z, d) => {
          const w = 0.8 + 0.2 * Math.sin(x * 1.7 + 0.4) + 0.1 * Math.sin(x * 4.1 + z * 2.3);
          d[1] = -m * y * 0.5 * w - m * m * 0.35 * Math.max(0, y - 5.5);
          d[2] = -m * (0.9 * Math.exp(-Math.max(0, y + d[1]) / 1.2)) * w * MathX.smooth(-z, -1.5, 0.2) + m * 0.15 * Math.sin(y * 1.3 + x);
          d[0] = m * 0.05 * x * Math.exp(-y / 3);
        });
        state.houseOn = true;
      } else if (state.houseOn) { houseDef.reset(); state.houseOn = false; }
      for (const f of facades) f.scale.y = 1 - 0.45 * m; }

    // ---- flames, smoke, steam
    flames.begin(vt); fire.begin(); smoke.begin();
    const Tf = ucFlameT(n), fd = E * ucFlameLum(n), fcol = ucUnitLum(UC_BB.at(Tf).rgb);
    const sdisp = E * Ss.Lavg * 0.16, sc = [sdisp * rgb[0] * 0.95 + 0.03 * fill, sdisp * rgb[1] * 0.88 + 0.03 * fill, sdisp * rgb[2] * 0.8 + 0.035 * fill];
    const cx = cam.position.x, cz = cam.position.z;
    for (const F of FIRE) {
      const age = n - F.at; if (age < -1 || age > F.dur + 60) continue;
      const env = ucFlameEnv(age, F.dur), far = Math.hypot(F.x - cx, F.z - cz), lod = far > 30 ? 1 : far > 12 ? 2 : 3;
      if (env > 0.01) {
        // a few tongues per burning place, each its own height and sway; a soft glow round the base
        for (let j = 0; j < lod; j++) {
          const sd = F.k * 3.7 + j * 1.31, fl = 0.7 + 0.3 * noise1(vt * (2.2 + 0.4 * j) + sd, 7), ox = (ucR(F.k * 5 + j, 91) - 0.5) * F.s * 1.3, oz = (ucR(F.k * 5 + j, 92) - 0.5) * F.s * 1.3;
          const h = F.s * (1.8 + 2.6 * ucR(F.k * 5 + j, 93)) * fl * (0.35 + 0.65 * env), w = F.s * (0.9 + 0.5 * ucR(F.k * 5 + j, 94)) * (0.6 + 0.4 * env);
          flames.add(F.x + ox, F.y - 0.02, F.z + oz, w, h, 0.55 * fd * env * (j ? 0.7 : 1), fcol[0], fcol[1], fcol[2], (sd % 10) / 10);
        }
        fire.add(F.x, F.y + F.s * 0.5, F.z, F.s * 2.4, 0.22 * env, fcol[0] * fd * 0.25, fcol[1] * fd * 0.17, fcol[2] * fd * 0.1);
      }
      // smoke (soot: dark): while it burns and smoulders after
      const se = MathX.smooth(age, 0, 4) * (1 - MathX.smooth(age, F.dur, F.dur + 55)) * F.sm, K = far > 30 ? 1 : F.smoke;
      if (se > 0.01) for (let j = 0; j < K; j++) {
        const u = ((vt * (0.09 + 0.05 * ucR(F.k, 9)) + j / K + ucR(F.k, 10)) % 1 + 1) % 1, H = F.s * 10 * (0.6 + 0.4 * se);
        const sz = F.s * (1.0 + 5.5 * u), a = 0.32 * Math.min(1, se) * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 - 0.3 * u);
        smoke.add(F.x + 0.45 * u * H + 0.2 * F.s * Math.sin(vt * 0.7 + F.k), F.y + F.s * 1.2 + u * H, F.z - 0.15 * u * H, sz, a, sc[0], sc[1], sc[2]);
      }
    }
    // the lawn steams (it boils dry at 100 °C, 23:36), and the bird bath (it boils at 23:47:46 until it's dry)
    { const st = MathX.smooth(n, UC_N.steam - 25, UC_N.steam + 15) * (1 - MathX.smooth(n, UC_N.steam + 70, UC_N.ign.grass - 20));
      if (st > 0.01) { const w = [skyD * rgb[0] * 0.95 + 0.05 * fill, skyD * rgb[1] * 0.95 + 0.05 * fill, skyD * rgb[2] * 0.95 + 0.06 * fill];
        for (let i = 0; i < 520; i++) { const x = -4.3 + 8.6 * ucR(i, 51), z = -3.3 - 13.2 * ucR(i, 52), u = ((vt * (0.16 + 0.1 * ucR(i, 53)) + ucR(i, 54)) % 1 + 1) % 1;
          if (x > 1.9 && z < -13.9) continue;
          smoke.add(x + 0.5 * u + 0.1 * Math.sin(vt + i), 0.05 + u * 1.9, z - 0.2 * u, 0.25 + 1.0 * u, 0.13 * st * Math.sin(Math.PI * u), w[0], w[1], w[2]); } }
      const bo = n > UC_N.boil && n < UC_N.dry ? MathX.smooth(n, UC_N.boil, UC_N.boil + 6) * (1 - MathX.smooth(n, UC_N.dry - 20, UC_N.dry)) : 0;
      if (bo > 0.01) { const by = P.bathWater.position.y + 0.006, w = [skyD * rgb[0], skyD * rgb[1], skyD * rgb[2]], rr = 0.36 * P.bathWater.scale.x;
        for (let i = 0; i < 70; i++) { const ph = ((vt * (1.4 + 1.6 * ucR(i, 61)) + ucR(i, 62)) % 1 + 1) % 1, a = ucR(i, 63) * 6.28, r = rr * Math.sqrt(ucR(i, 64));
          smoke.add(G.bath[0] + Math.cos(a) * r, by, G.bath[2] + Math.sin(a) * r, 0.012 + 0.03 * Math.sin(Math.PI * ph), 0.7 * bo * Math.sin(Math.PI * ph), w[0] * 1.1, w[1] * 1.1, w[2] * 1.1); }
        for (let i = 0; i < 60; i++) { const u = ((vt * (0.35 + 0.2 * ucR(i, 65)) + ucR(i, 66)) % 1 + 1) % 1, a = ucR(i, 67) * 6.28;
          smoke.add(G.bath[0] + Math.cos(a) * 0.2 + 0.4 * u, by + u * 1.6, G.bath[2] + Math.sin(a) * 0.2, 0.08 + 0.5 * u, 0.22 * bo * Math.sin(Math.PI * u), w[0], w[1], w[2]); } } }
    flames.end(); fire.end(); smoke.end();
    return { E, skyD, lf };
  }

  // ---- the frost macro (only in the frost shot)
  function frostMacro(n, on) {
    blades.visible = crystals.visible = drops.visible = on;
    if (!on) return;
    CR.forEach((c, i) => {
      const melt = MathX.smooth(n, UC_N.frostMelt - 12 + c.j, UC_N.frostMelt + 8 + c.j), dry = MathX.smooth(n, ucAt(23, 31) + c.j * 4, ucAt(23, 33) + c.j * 4);
      _e.set(c.r, c.r * 1.7, c.r * 0.6); _q.setFromEuler(_e); _s.set(c.s * (1 - melt), c.s * 0.45 * (1 - melt), c.s * (1 - melt));
      _m4.compose(_v.set(c.x, c.y, c.z), _q, _s); crystals.setMatrixAt(i, _m4);
      const ds = c.d ? c.s * 0.9 * MathX.smooth(melt, 0.25, 1) * (1 - dry) : 0, slide = 0.006 * MathX.smooth(n, UC_N.frostMelt + 6 + c.j, UC_N.frostMelt + 30 + c.j);
      _s.set(ds, ds * 1.08, ds); _m4.compose(_v.set(c.x, Math.max(0.002, c.y - slide - ds * 0.3), c.z), cam.quaternion, _s); drops.setMatrixAt(i, _m4);
    });
    { const Ss = sky.state.S, d = 1.15 * sky.state.E * Ss.L, rgb = ucUnitLum(Ss.rgb); drops.material.color.setRGB(d * rgb[0], d * rgb[1], d * rgb[2]); }
    crystals.instanceMatrix.needsUpdate = true; drops.instanceMatrix.needsUpdate = true;
  }

  // ---- the cat, per shot: on the wall until 10:20, then on the lawn; at 11:29 she runs for her flap; later she is on
  // the kitchen worktop by the window
  const CAT_WALL = [-0.6, G.wallH + 0.085, -16.72], CAT_LAWN = [-0.5, 0, -6.6], FLAP = [(G.door[0] + G.door[1]) / 2, 0, -0.12], CAT_TOP = [-2.0, 0.9, 0.6];
  const KITCHEN = ['cold', 'steam', 'leaves', 'lawn', 'noon', 'shed', 'glass'];
  function poseCat(t, n, vt, shot) {
    catRoot.visible = true; catRoot.rotation.set(0, 0, 0); catIn.value = 0;
    if (KITCHEN.includes(shot.mode)) {                 // on the worktop, watching the garden
      catIn.value = 1; catRoot.position.set(...CAT_TOP); catRoot.rotation.y = Math.PI + 0.25;
      cat.pose(ucCatBlend(UC_CAT_POSES.sit, UC_CAT_POSES.alert, 0.6 + 0.4 * Math.sin(vt * 0.3)), vt);
      cat.lookAt([-1.2 + 1.5 * Math.sin(vt * 0.21), 0.6, -10], 0.7); return;
    }
    if (n < UC_N.catLawn) {                            // on the wall
      catRoot.position.set(...CAT_WALL); catRoot.rotation.y = 0.2;
      cat.pose(ucCatBlend(UC_CAT_POSES.sit, UC_CAT_POSES.alert, 0.5 + 0.5 * Math.sin(vt * 0.4)), vt);
      cat.lookAt([0.4 + 3 * Math.sin(vt * 0.17), 1.6 + 2 * Math.max(0, Math.sin(vt * 0.13)), -8], 0.6); return;
    }
    const tg = Math.hypot(FLAP[0] - CAT_LAWN[0], FLAP[2] - CAT_LAWN[2]) / 4.3, tr = t - UC.catRun;
    if (n < UC_N.catRun || shot.mode !== 'warm') {     // on the lawn, looking up; then (outside the run) gone in
      if (n >= UC_N.catRun) { catRoot.visible = false; return; }
      catRoot.position.set(...CAT_LAWN); catRoot.rotation.y = 0.35;
      const k = shot.mode === 'warm' ? MathX.smooth(t, UC.catRun - 1.2, UC.catRun - 0.1) : 0;
      cat.pose(ucCatBlend(UC_CAT_POSES.alert, UC_CAT_POSES.crouch, k), vt);
      cat.lookAt(k > 0 ? [FLAP[0], 0.3, FLAP[2]] : [0.5, 3 + Math.sin(vt * 0.2), -14], 0.7); return;
    }
    if (tr > tg) { catRoot.visible = false; return; }  // through the flap
    const u = MathX.clamp(tr / tg, 0, 1), q = Ease.inOutSine(u) * 0.35 + u * 0.65;
    const x = ucLerp(CAT_LAWN[0], FLAP[0], q), z = ucLerp(CAT_LAWN[2], FLAP[2], q) + 0.5 * Math.sin(Math.PI * q) * 0.6;
    catRoot.position.set(x, 0, z); catRoot.rotation.y = Math.atan2(FLAP[0] - CAT_LAWN[0], FLAP[2] - CAT_LAWN[2]) - 0.35 * Math.cos(Math.PI * q);
    cat.pose(ucCatGallop(tr * 3.4, MathX.smooth(tr, 0, 0.18) * (1 - 0.5 * MathX.smooth(u, 0.9, 1))), vt);
  }

  // --------------------------------------------------------------------------------------------------------------
  // the camera, per shot
  const look = (p, at, fov, roll = 0) => ucCam(cam, p, at, fov, roll);
  const skyAt = (az, alt, from, d = 100) => { const v = ucSkyDir(az, alt); return [from[0] + v[0] * d, from[1] + v[1] * d, from[2] + v[2] * d]; };
  const dr = (t, a = 0.012, s = 1) => ucDrift(t, a, 0.3, s);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const k01 = (t, a, b, e = Ease.inOutSine) => ucK(t, a, b, e);
  const CAM = {
    cold(t) { const k = k01(t, 0, UC.titleShot, Ease.outSine), d = dr(t, 0.006, 2); look(add(ucV([-1.2, 1.62, 3.15], [-1.52, 1.58, 1.3], k), d), [-1.1, 1.05 + 0.2 * k, -9], 50 - 4 * k); },
    title(t) { const k = k01(t, UC.titleShot, UC.frost0, Ease.linear), d = dr(t); look(add([0.5 - 0.2 * k, 1.66, -1.1 - 0.9 * k], d), [-0.5, 4.0 - 0.3 * k, -17], 58); },
    frost0(t) { const k = k01(t, UC.frost0, UC.rule, Ease.linear), b = G.bath, d = dr(t, 0.004, 4); look(add([b[0] - 0.62 + 0.08 * k, 1.42 - 0.08 * k, b[2] + 0.95 - 0.12 * k], d), [b[0] + 0.05, 0.9, b[2] - 0.15], 40); },
    begin(t) { const k = k01(t, UC.begin, UC.mirach, Ease.linear), p = [2.15, 1.5, -4.75], d = dr(t, 0.004, 5); look(add(p, d), skyAt(104 - 3 * k, 27 + 3 * k, p), 56); },
    mirach(t) { const k = k01(t, UC.mirach, UC.squeeze, Ease.linear), p = [0.6, 1.62, -5]; look(p, skyAt(UC_SKY.named[6][1] - 1.0 + 0.6 * k, UC_SKY.named[6][2] - 0.6, p), 24 - 2 * k); },
    squeeze(t) { const k = k01(t, UC.squeeze, UC.half, Ease.inOutSine), p = [0.6, 1.62, -5]; look(p, skyAt(UC_SKY.named[6][1] + 14 * k, UC_SKY.named[6][2] - 2 - 4 * k, p), 24 + 24 * k); },
    half(t) { const k = k01(t, UC.half, UC.more, Ease.linear), p = [0.3, 1.62, -3.6], d = dr(t, 0.004, 6); look(add(p, d), skyAt(150 - 6 * k, 30 + 2 * k, p), 64); },
    more(t) { const k = k01(t, UC.more, UC.best, Ease.inOutSine), p = [0.3, 1.62, -4.4]; look(p, skyAt(150 + 105 * k, 34 + 38 * k, p), 66 + 6 * k); },
    best(t) { const k = k01(t, UC.best, UC.glow, Ease.linear), p = [0.2, 1.3, -8.2]; look(p, skyAt(268 + 8 * k, 66 + 2 * k, p), 82); },
    glow(t) { const k = k01(t, UC.glow, UC.ebl, Ease.linear), p = [0.2, 1.3, -8.2]; look(p, skyAt(276 + 6 * k, 68 - 2 * k, p), 82 - 2 * k); },
    ebl(t) { const k = k01(t, UC.ebl, UC.city, Ease.linear), p = [0.2, 1.62, -6.2], d = dr(t, 0.004, 7); look(add(p, d), skyAt(160 - 8 * k, 26 - 2 * k, p), 60); },
    city(t) { const k = k01(t, UC.city, UC.drown, Ease.linear), d = dr(t, 0.008, 8); look(add([-1.1 + 0.2 * k, 1.62, -0.9 - 0.8 * k], d), [0.6, 1.8, -16], 56); },
    drown(t) { const k = k01(t, UC.drown, UC.close, Ease.linear), p = [0.3, 1.62, -5.2]; look(p, skyAt(118 + 6 * k, 23 + 3 * k, p), 58); },
    frost(t) { const k = k01(t, UC.frost, UC.zero, Ease.linear), f = G.frostAt; look([f[0] + 0.17 - 0.03 * k, 0.085 - 0.01 * k, f[2] + 0.2 - 0.04 * k], [f[0] - 0.02, 0.045, f[2] - 0.02], 30); },
    zero(t) { const k = k01(t, UC.zero, UC.warm, Ease.inOutSine), p = [0.6, 1.45, -9.2 + 0.4 * k]; look(p, skyAt(292 + 4 * k, 63 + 5 * k, p), 66); },
    warm(t) {
      const k = k01(t, UC.catRun - 0.2, UC.catRun + 1.5, Ease.inOutSine), d = dr(t, 0.006, 9);
      look(add([0.25, 0.95, -1.75], d), ucV([-0.3, 0.35, -7.5], [1.6, 0.25, -0.2], k), 52 - 4 * k);
    },
    boil(t) {
      const tu = k01(t, UC.goIn - 0.7, UC.goIn + 0.5, Ease.inOutSine), w = k01(t, UC.goIn + 0.3, UC.steam, Ease.inOutSine), d = dr(t, 0.01, 10);
      const p0 = [0.8, 1.62, -3.4], p1 = [1.6, 1.62, -0.75], p2 = [1.62, 1.6, 0.9];
      const p = w < 0.6 ? ucV(p0, p1, w / 0.6) : ucV(p1, p2, (w - 0.6) / 0.4);
      look(add(p, d), ucV([0.0, 1.8, -16], [1.62, 1.35, 4], tu), 56);
    },
    steam(t) { const k = k01(t, UC.steam, UC.leaves, Ease.linear), d = dr(t, 0.003, 11); look(add([-1.42, 1.62, 1.75 - 0.15 * k], d), [-1.1, 0.95, -9], 50); },
    leaves(t) { const k = k01(t, UC.leaves, UC.lawn, Ease.linear), d = dr(t, 0.003, 12); look(add([-1.45, 1.68, 0.8 - 0.1 * k], d), [-0.9 - 0.4 * k, -0.2, -9.5], 44); },
    lawn(t) { const k = k01(t, UC.lawn, UC.noon, Ease.linear), d = dr(t, 0.003, 13); look(add([-1.6, 1.62, 0.95], d), [-2.4 - 0.3 * k, 1.5, -12.5], 46); },
    noon(t) { const k = k01(t, UC.shedAt - 0.9, UC.shedAt + 0.6, Ease.inOutSine), d = dr(t, 0.003, 14); look(add([-1.62, 1.45, 0.72], d), ucV([-1.5, 4.8, -10], [2.7, 1.3, -15], k), 48); },
    shed(t) { const k = k01(t, UC.moonGo - 1.5, UC.moonGo + 0.1, Ease.inOutSine), p = [ucLerp(-1.3, -1.02, k), 1.55, 0.62]; look(p, ucV([1.25, 0.85, -5.6], skyAt(122, 20, p, 50), k), ucLerp(32, 5, k)); },
    glass(t) { const k = k01(t, UC.glass, UC.bath, Ease.linear), d = dr(t, 0.003, 15); look(add([-1.6, 1.56, 1.45 - 0.2 * k], d), [-1.6, 1.45, -1], 52); },
    bath(t) { const k = k01(t, UC.bath, UC.red, Ease.linear), b = G.bath, d = dr(t, 0.005, 16); look(add([b[0] - 0.7 + 0.1 * k, 1.3, b[2] + 0.85 - 0.1 * k], d), [b[0] + 0.05, 0.98, b[2] - 0.1], 40); },
    red(t) { const k = k01(t, UC.red, UC.melt, Ease.inOutSine), p = [-0.6, 1.55, -9.6], d = dr(t, 0.006, 17); look(add(p, d), ucV(skyAt(132, 42, p), skyAt(146, 9, p), k), 64); },
    melt(t) { const k = k01(t, UC.melt, UC.vanish, Ease.linear), d = dr(t, 0.006, 18); look(add([0.9 - 0.2 * k, 1.6, -10.2 + 0.6 * k], d), [-0.6, 3.0, 0], 50); },
    vanish(t) { const k = k01(t, UC.vanish, UC.bigbang, Ease.linear), d = dr(t, 0.008, 20); look(add([2.3 - 0.6 * k, 1.65, -9.6 + 1.2 * k], d), [-0.6, 1.9, -0.5], 60); },
    // (up, where nothing is left: only the light)
    bigbang(t) { const k = k01(t, UC.bigbang, UC.sun, Ease.linear), p = [0.2, 1.6, -7], d = dr(t, 0.006, 19); look(add(p, d), skyAt(148 + 4 * k, 52 + 8 * k, p), 62); },
    sun(t) { const k = k01(t, UC.sun, UC.last, Ease.linear), p = [0.2, 1.6, -7]; look(p, skyAt(170 + 10 * k, 18 + 30 * k, p), 64); },
    last(t) { const k = k01(t, UC.last, UC.midnight, Ease.linear), p = [0.2, 1.6, -7]; look(p, skyAt(180 + 6 * k, 48 + 10 * k, p), 64 - 10 * k); },
    same(t) { const k = k01(t, UC.same, UC.question, Ease.linear), d = dr(t, 0.008, 21); look(add([0.6 - 0.3 * k, 1.6, -2.4 - 0.8 * k], d), [-0.2, 2.6, -17], 58); },
    after(t) { const k = k01(t, UC.question, UC.end, Ease.linear), d = dr(t); look(add([0.3 - 0.15 * k, 1.64, -1.5 - 0.6 * k], d), [-0.4, 4.2, -17], 58); },
  };
  // the night time each shot shows
  function nightFor(t, shot) {
    if (shot.mode === 'after') return ucAt(19, 29, 25) + (t - UC.question);
    if (shot.mode === 'same') return ucAt(23, 49, 35) + (t - UC.same) * 3;
    return ucNight(t);
  }

  return {
    scene, camera: cam, sky, P,
    frame(t, shot, app) {
      const n = nightFor(t, shot), vt = ucVis(t);
      (CAM[shot.mode] || CAM.title)(t);
      sky.update(Math.max(0, n), vt, cam, app.renderH || 1080, { lens: shot.mode === 'mirach' ? 3 : 1, glow: lampFade(ucSkyNow(Math.max(0, n)).E) });
      sky.domeU.uRip.value = shot.mode === 'bigbang' ? MathX.smooth(t, UC.ripples - 0.3, UC.ripples + 1.6) : 0;
      const W = world(t, n, vt, shot);
      frostMacro(n, shot.mode === 'frost');
      poseCat(t, n, vt, shot);
      // the back door: you open it and go in; the cat flap swings when she goes through
      P.door.rotation.y = shot.mode === 'boil' ? 1.45 * k01(t, UC.goIn - 0.1, UC.goIn + 1.0, Ease.inOutSine) : 0;
      { const tg = Math.hypot(FLAP[0] - CAT_LAWN[0], FLAP[2] - CAT_LAWN[2]) / 4.3, u = t - UC.catRun - tg + 0.05;
        P.flap.rotation.x = shot.mode === 'warm' && u > 0 ? 1.1 * Math.exp(-u * 2.2) * Math.cos(u * 9) : 0; }
      this._W = W; this._n = n;
    },
    grade(t, p, shot) {
      const n = this._n ?? 0, A = ucSkyNow(Math.max(0, n)).A, g = MathX.smooth(Math.log10(A), 1.5, 4.5);
      // (the display is normalised to the sky, so once it is bright only what outshines it may bloom: the flames)
      p.exposure = 1.18 + 0.3 * g; p.saturation = 1.03; p.contrast = 1.08 - 0.02 * g; p.bloom = 0.42 + 0.06 * g; p.bloomThreshold = 0.85 + 0.85 * g; p.vignette = 0.56 - 0.18 * g; p.grain = 0.03; p.blackLift = 0.008;
      p.keepWarm = 1;
      if (shot.mode === 'frost') { p.vignette = 0.62; p.bloom = 0.5; }
      // looking straight at the glowing band, your eyes adapt to it (the rest of the sky darkens)
      if (shot.mode === 'zero') { const S = ucSkyNow(Math.max(0, n)); p.exposure *= ucExpoFor(S.A + 0.6 * S.dust) / S.E; p.bloomThreshold = 1.4; }
      if (KITCHEN.includes(shot.mode)) { p.vignette = 0.6; p.bloom = 0.5; }
      // (the long look at the Moon: your eyes adapt to the bright sky around it, so the last of its contrast shows)
      if (shot.mode === 'shed') { const k = k01(t, UC.moonGo - 1.5, UC.moonGo + 0.1, Ease.inOutSine); p.exposure *= ucLerp(1, 0.32, k); p.vignette = ucLerp(0.6, 0.35, k); }
      if (shot.mode === 'cold') { p.fade = Math.max(p.fade, 1 - MathX.smooth(t, 0, 0.6)); }
      if (['bigbang', 'sun', 'last'].includes(shot.mode)) { p.vignette = 0.25; p.contrast = 1.0; p.uneven = 0.12; }
      if (shot.mode === 'last') {
        // the last second: the light shimmers; at the end, physics runs out (a flash, then black)
        const y = MathX.smooth(t, UC.nuclei - 0.3, UC.planck);
        p.chroma = 0.6 * y; p.edgeBlur = 0.8 * y; p.grain = 0.03 + 0.06 * y; p.uneven = 0.4 * y;
        const f = MathX.smooth(t, UC.planck - 0.2, UC.planck + 0.8); p.flash = f * 0.9; p.flashColor.setRGB(0.85, 0.9, 1.0);
      }
      if (shot.mode === 'after') { p.bloomThreshold = 1.0; p.bloom = 0.32; }
    },
    labels(t) { return ucGardenLabels(t, this); },
  };
};

// the labels the garden pins to things (by shot)
function ucGardenLabels(t, set) {
  const s = ucShotAt(t), sky = set.sky, n = set._n ?? ucNight(t), W = StoryHUD.win, ss = ucShrink(Math.max(0, n));
  const looks = (name) => { const st = sky.starNow(name, ss); return 'LOOKS ' + ucThousands(Math.round((st.T - 273.15) / 10) * 10) + ' °C'; };
  if (s.mode === 'mirach') return [{ p: sky.at('MIRACH', 300), text: 'MIRACH', sub: n < ucAt(20, 30) ? 'A RED STAR · ' + looks('MIRACH') : looks('MIRACH'), a: W(t, UC.mirach + 0.4, UC.squeeze, 0.5, 0.3) }];
  if (s.mode === 'squeeze') return [{ p: sky.at('MIRACH', 300), text: 'MIRACH', sub: looks('MIRACH'), a: W(t, UC.squeeze, UC.half - 0.3, 0.2, 0.4) * (1 - MathX.smooth(t, UC.squeeze + 2.5, UC.squeeze + 3.5)) }];
  if (s.mode === 'half') return ['SCHEAT', 'MARKAB', 'ENIF'].map((k, i) => ({ p: sky.at(k, 300), text: k, sub: looks(k), a: W(t, ucCap('half', 1).show - 0.2 + i * 0.25, UC.more - 0.2, 0.4, 0.3) }));
  if (s.mode === 'zero') return [{ p: sky.at('SADR', 300), text: 'THE MILKY WAY', sub: 'ITS DARK DUST, GLOWING', a: W(t, ucCap('zero', 1).show + 0.3, UC.warm - 0.2, 0.5, 0.3) }];
  if (s.mode === 'shed' && t < UC.moonGo - 0.6) return [{ p: [UC_G.scope[0], 1.45, UC_G.scope[2]], text: 'YOUR TELESCOPE', sub: 'ALUMINIUM · MELTS AT 660 °C', a: W(t, UC.shed + 0.3, UC.moonGo - 0.6, 0.4, 0.3) }];
  if (s.mode === 'bath') return [{ p: [UC_G.bath[0], 1.25, UC_G.bath[2]], text: 'THE BIRD BATH', sub: '100 °C · BOILING', a: W(t, UC.bath + 0.5, UC.red - 0.3, 0.4, 0.3) }];
  if (s.mode === 'bigbang') { const c = set.camera, f = new THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion), u = new THREE.Vector3(0, 1, 0).applyQuaternion(c.quaternion);
    return [{ p: [c.position.x + 50 * f.x + 9 * u.x, c.position.y + 50 * f.y + 9 * u.y, c.position.z + 50 * f.z + 9 * u.z], text: 'ITS RIPPLES', sub: 'SHOWN 10,000× STRONGER · REALLY 1 PART IN 100,000', a: W(t, UC.ripples + 0.6, UC.sun - 0.3, 0.5, 0.3) }]; }
  return [];
}
