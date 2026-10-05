/* =====================================================================
   LOOK — one place for the "older-game cinematic" material treatment.
   Runs once after the world is built:
   - matte pass: no polished PBR highlights or strong reflections
   - grime: low-frequency, non-repeating dirt in world space (patchy ground,
     darker splash zone at the base of walls, faint vertical streaks)
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
      dirt *= uGrime;
      float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * vec3(0.98, 0.99, 0.93), dirt * 0.6) * (1.0 - dirt);
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
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + Look.GRIME_FS);
    };
    mat.customProgramCacheKey = () => 'grime' + strength;
    mat.needsUpdate = true;
  },

  matte(mat) {
    if (mat.userData.matte) return;
    mat.userData.matte = true;
    const glass = /glass/i.test(mat.name || '');
    if (!glass) mat.roughness = Math.max(mat.roughness, mat.metalness > 0.5 ? 0.45 : 0.62);
    if ('envMapIntensity' in mat) mat.envMapIntensity *= glass ? 0.6 : 0.45;
    if (mat.isMeshPhysicalMaterial) { mat.clearcoat = 0; mat.sheen = 0; }
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
        Look.matte(m);
        if (!/glass/i.test(m.name || '')) Look.grime(m, vehicle ? 0.55 : 1.0);
      }
    });
  },
};
