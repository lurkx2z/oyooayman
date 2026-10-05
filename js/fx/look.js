/* =====================================================================
   LOOK — one place for the "older-game cinematic" material treatment.
   Runs once after the world is built:
   - surfaces: the environment stays matte, while cars, glass and metal props keep
     readable, controlled highlights (selective gloss, as in the POV reference)
   - grime: low-frequency, non-repeating dirt in world space (patchy ground,
     replaced slabs, damp patches, darker splash zone at the base of walls,
     faint streaks, slow tone drift between neighbouring buildings)
   People and the first-person hands are left alone.
   ===================================================================== */

const Look = {
  GRIME_VS: /* glsl */`
    vec4 grimeP = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      grimeP = instanceMatrix * grimeP;
    #endif
    vGrimeW = (modelMatrix * grimeP).xyz;
    vGrimeUp = abs(normalize(mat3(modelMatrix) * objectNormal).y);
  `,
  GRIME_FS: /* glsl */`
    {
      vec3 w = vGrimeW;
      float n1 = grimeNoise(w.xz * 0.09 + vec2(w.y * 0.04, 0.0));
      float n2 = grimeNoise(w.xz * 0.31 + vec2(17.0, w.y * 0.13));
      float n3 = grimeNoise(vec2((w.x + w.z) * 1.7, w.y * 0.09) + 5.0);
      float patchy = smoothstep(0.3, 0.85, n1 * 0.65 + n2 * 0.35);
      float ground = smoothstep(0.6, 0.9, vGrimeUp);
      float wall = 1.0 - ground;
      float splash = 1.0 - smoothstep(0.02, 0.7, w.y);
      float dirt = ground * (0.14 + 0.3 * patchy)
                 + wall * (0.16 * splash + 0.1 * patchy + 0.08 * smoothstep(0.55, 0.9, n3));
      // replaced slabs / patched asphalt: whole 1.25 m cells a shade darker or lighter
      vec2 cell = floor(w.xz / 1.25);
      float hc = grimeHash(cell + 3.7);
      dirt += ground * (step(0.88, hc) * 0.12 - step(hc, 0.06) * 0.07);
      dirt *= uGrime;
      float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * vec3(0.98, 0.99, 0.93), dirt * 0.6) * (1.0 - dirt);
      // neighbouring buildings never share exactly the same paint: slow drift in tone and warmth
      float tint = grimeNoise(w.xz * 0.045 + 31.0) - 0.5;
      diffuseColor.rgb *= 1.0 + wall * uGrime * vec3(0.16 * tint + 0.03, 0.14 * tint, 0.12 * tint - 0.03);
      grimeDamp = ground * uGrime * smoothstep(0.66, 0.82, grimeNoise(w.xz * 0.16 + 9.0));
    }
  `,

  grime(mat, strength) {
    if (mat.userData.grime !== undefined) return;
    mat.userData.grime = strength;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uGrime = { value: strength };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vGrimeW;\nvarying float vGrimeUp;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + Look.GRIME_VS);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vGrimeW; varying float vGrimeUp; uniform float uGrime;
          float grimeHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float grimeNoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(grimeHash(i), grimeHash(i + vec2(1, 0)), u.x), mix(grimeHash(i + vec2(0, 1)), grimeHash(i + vec2(1, 1)), u.x), u.y); }`)
        .replace('#include <color_fragment>', 'float grimeDamp = 0.0;\n#include <color_fragment>\n' + Look.GRIME_FS)
        // damp patches: a little sheen on the ground (older-game puddle look, very subtle)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= 1.0 - 0.5 * grimeDamp;');
    };
    mat.customProgramCacheKey = () => 'grime' + strength;
    mat.needsUpdate = true;
  },

  // environment matte; selected objects keep readable highlights (cars, glass, metal props)
  surface(mat, vehicle) {
    if (mat.userData.surface) return;
    mat.userData.surface = true;
    const name = mat.name || '';
    if (/glass/i.test(name)) { mat.roughness = Math.min(mat.roughness, 0.12); mat.envMapIntensity = 1.1; return; }
    if (mat.metalness > 0.5) { mat.roughness = MathX.clamp(mat.roughness, 0.25, 0.5); return; }   // metal: controlled specular
    if (vehicle && mat.isMeshPhysicalMaterial) {                                                    // car paint: satin with a thin clearcoat
      mat.roughness = MathX.clamp(mat.roughness, 0.42, 0.6); mat.clearcoat = 0.3; mat.clearcoatRoughness = 0.35; mat.envMapIntensity = 1.0;
      return;
    }
    if (vehicle) { mat.roughness = Math.max(mat.roughness, 0.5); return; }
    mat.roughness = Math.max(mat.roughness, 0.75);                                                  // concrete, walls, road, foliage
    if ('envMapIntensity' in mat) mat.envMapIntensity *= 0.5;
  },

  apply(scene, camera) {
    const skip = new Set();
    camera.traverse((o) => skip.add(o));
    scene.traverse((o) => {
      if (!o.isMesh || skip.has(o)) return;
      let p = o, person = false;
      while (p) { if (p.name && p.name.startsWith('person:')) { person = true; break; } p = p.parent; }
      if (person) return;
      const vehicle = (() => { let q = o; while (q) { if (q.name && q.name.startsWith('veh:')) return true; q = q.parent; } return false; })();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || !m.isMeshStandardMaterial || m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile && m.userData.grime === undefined) continue;
        Look.surface(m, vehicle);
        if (!/glass/i.test(m.name || '')) Look.grime(m, vehicle ? 0.55 : 1.0);
      }
    });
  },
};
