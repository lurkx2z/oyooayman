/* =====================================================================
   WORLD — the open Atlantic round the ship: the sky (it darkens as the air goes: overhead first, the horizon's band
   last; the clouds dry away; stars come out beside the Sun), the Sun, the sea (swell, ripples, sun glitter, the ship's
   bow wave and wake while it moves, the boil at the end) and the sea seen from below (Snell's window).
     atSky(scene) → { mesh, set(s, cam) }       a dome centred on the camera
     atSea(scene) → { mesh, set(s, t, cam) }     a polar grid centred under the camera (no triangle over ~150 m)
   Both are pure functions of story time s (and film t for the ripples).
   ===================================================================== */

// the sky's colours at air share a: [zenith, horizon] (linear RGB), and how bright the clouds are
function atSkyCols(a) {
  const z = ATL.zenith(a), h = ATL.horizon(a);
  // overhead: a clear tropical blue, deepening to indigo as it thins (less light scattered twice), then black
  const blue = [0.16, 0.36, 0.78], deep = [0.05, 0.08, 0.32];
  const zc = blue.map((v, i) => MathX.lerp(deep[i], v, MathX.smooth(a, 0.15, 0.9)) * Math.pow(z, 0.9) * 1.0);
  // low: pale, hazy (through 30× more air), turning a thin cobalt band, then dark
  const pale = [0.62, 0.74, 0.88], band = [0.18, 0.3, 0.62];
  const hc = pale.map((v, i) => MathX.lerp(band[i], v, MathX.smooth(a, 0.12, 0.6)) * h);
  return { zen: zc, hor: hc };
}

function atSky(scene) {
  const U = {
    uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunK: { value: 1 },
    uGlow: { value: 1 }, uStars: { value: 0 }, uCloud: { value: 1 }, uFlow: { value: 0 }, uCloudLit: { value: 1 }, uUnder: { value: 0 },
  };
  const m = new THREE.Mesh(new THREE.SphereGeometry(4500, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`
      uniform vec3 uZen, uHor, uSun; uniform float uSunK, uGlow, uStars, uCloud, uFlow, uCloudLit, uUnder; varying vec3 vD;
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float h2(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n2(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }
      void main(){
        vec3 D = normalize(vD); float h = D.y;
        float up = clamp(h, 0.0, 1.0);
        // the gradient: the horizon's band hugs the sea; overhead takes over above ~20°
        vec3 col = mix(uHor, uZen, pow(smoothstep(-0.02, 0.55, up), 0.65));
        if (h < 0.0) col = uHor * 0.85;
        // the Sun's aureole (the haze round it: gone with the air) and its disc
        float g = max(dot(D, uSun), 0.0);
        col += vec3(1.0, 0.93, 0.8) * (0.22 * pow(g, 12.0) + 0.6 * pow(g, 120.0)) * uGlow;
        col += vec3(1.0, 0.98, 0.94) * smoothstep(0.99991, 0.99996, g) * 30.0 * uSunK;
        // stars (fixed in the sky: cells on a sphere), only where the sky is dark enough
        if (uStars > 0.001 && h > 0.0) {
          vec3 q = D * 180.0, c = floor(q), f = fract(q) - 0.5; float r = h2(c);
          if (r > 0.9965) { float b = (r - 0.9965) / 0.0035; float s = smoothstep(0.17, 0.0, length(f)) * (0.35 + 1.6 * b * b);
            col += vec3(0.9 + 0.1 * h2(c + 3.1), 0.92, 1.0) * s * uStars * smoothstep(0.0, 0.08, h); }
        }
        // fair-weather cumulus at ~1.2 km, drifting; they dry away as the air (and its vapour) goes
        if (uCloud > 0.001 && h > 0.015) {
          vec2 P = D.xz / h * 1.2 + vec2(uFlow, 0.0);
          float c = fbm(P * 0.9) * 0.75 + fbm(P * 2.7 + 3.0) * 0.25;
          float cov = smoothstep(0.58, 0.74, c) * uCloud * smoothstep(0.015, 0.12, h);
          vec3 cc = mix(vec3(0.72, 0.76, 0.82), vec3(1.0, 0.99, 0.97), smoothstep(0.6, 0.85, c)) * uCloudLit;
          col = mix(col, cc, cov * 0.92);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  const zc = new THREE.Color(), hc = new THREE.Color();
  return {
    mesh: m, U,
    set(s, cam) {
      const a = ATP.air(s), C = atSkyCols(a), sun = atSunAt(s);
      U.uZen.value.setRGB(...C.zen); U.uHor.value.setRGB(...C.hor); U.uSun.value.set(...sun.v);
      U.uSunK.value = ATL.sunK(a); U.uGlow.value = Math.pow(a, 1.5) * 0.9 + 0.1; U.uStars.value = ATL.stars(a);
      U.uCloud.value = 1 - MathX.smooth(s, atHMS(10, 18), atHMS(10, 52)); U.uFlow.value = s * 0.0006; U.uCloudLit.value = 0.6 + 0.4 * Math.pow(a, 0.3);
      m.position.copy(cam.position);
      zc.setRGB(...C.zen); hc.setRGB(...C.hor);
      return { zen: zc, hor: hc, a };
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SEA
// ---------------------------------------------------------------------------------------------------------------------
// the swell (shared with JS: the ship's own motion and anything floating): height at (x, z) at film time t, the water
// having run px metres past the ship (+x: the ship sails west, so the sea runs aft)
const AT_SWELL = [[78, 0.34, 0.6, 0.8, 0.2], [46, 0.2, -0.3, 0.95, 1.7], [121, 0.26, 0.9, 0.42, 4.1], [27, 0.07, 0.2, -1.0, 2.6]];   // [wavelength m, amp m, dir x, dir z, phase]
function atSwellY(x, z, t, px) {
  let y = 0;
  for (const [L, A, dx, dz, ph] of AT_SWELL) { const k = 2 * Math.PI / L, l = Math.hypot(dx, dz), w = Math.sqrt(9.81 * k); y += A * Math.sin(k * ((x - px) * dx + z * dz) / l - w * t + ph); }
  return y;
}
const AT_SWELL_GLSL = (() => {
  const terms = AT_SWELL.map(([L, A, dx, dz, ph]) => { const k = 2 * Math.PI / L, l = Math.hypot(dx, dz), w = Math.sqrt(9.81 * k);
    return `y += ${A.toFixed(4)} * sin(${(k * dx / l).toFixed(6)} * (p.x - uFlow) + ${(k * dz / l).toFixed(6)} * p.y - ${w.toFixed(5)} * uTime + ${ph.toFixed(3)});`; }).join('\n');
  const dterms = AT_SWELL.map(([L, A, dx, dz, ph]) => { const k = 2 * Math.PI / L, l = Math.hypot(dx, dz), w = Math.sqrt(9.81 * k), kx = k * dx / l, kz = k * dz / l;
    return `{ float c = ${A.toFixed(4)} * cos(${kx.toFixed(6)} * (p.x - uFlow) + ${kz.toFixed(6)} * p.y - ${w.toFixed(5)} * uTime + ${ph.toFixed(3)}); g.x += ${kx.toFixed(6)} * c; g.y += ${kz.toFixed(6)} * c; }`; }).join('\n');
  return `float swellY(vec2 p){ float y = 0.0; ${terms} return y; }
  vec2 swellG(vec2 p){ vec2 g = vec2(0.0); ${dterms} return g; }`;
})();

function atSea(scene) {
  // a polar grid: rings from 0.5 m to 6 km (each 5 % further than the last), 256 spokes
  const N = 256, R = [0]; for (let r = 0.5; r < 6200; r *= 1.05) R.push(r);
  const pos = [], idx = [];
  R.forEach((r) => { for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } });
  for (let i = 0; i < R.length - 1; i++) for (let k = 0; k < N; k++) { const a = i * N + k, b = i * N + (k + 1) % N, c = a + N, d = b + N; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const U = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
    uTime: { value: 0 }, uFlow: { value: 0 }, uSpeed: { value: 10 }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 1, 1) },
    uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uDeep: { value: new THREE.Color('#062a4a') }, uBoil: { value: 0 }, uBoilT: { value: 0 },
    uSkyK: { value: 1 }, uUnderCol: { value: new THREE.Color('#0b4a78') }, uHull: { value: new THREE.Vector4(AT_HULL.stemX(0), AT_F.stern, AT_F.B / 2, 0) },
  });
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uTime, uFlow; varying vec3 vW; varying vec2 vG;
      ${AT_SWELL_GLSL}
      ${THREE.ShaderChunk.fog_pars_vertex}
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        float d = length(w.xz - cameraPosition.xz);
        float k = 1.0 - smoothstep(900.0, 2500.0, d);             // the swell fades far off (its triangles are big there)
        w.y = swellY(w.xz) * k; vG = swellG(w.xz) * k; vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        ${THREE.ShaderChunk.fog_vertex}
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFlow, uSpeed, uBoil, uBoilT, uSkyK; uniform vec3 uSun, uSunCol, uZen, uHor, uDeep, uUnderCol; uniform vec4 uHull;
      varying vec3 vW; varying vec2 vG;
      ${THREE.ShaderChunk.fog_pars_fragment}
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
      // the hull's half-width at x (as in layout.js, roughly): a fine bow, a full middle, a round stern
      float hullHalf(float x){ float u = clamp((x - uHull.x) / 95.0, 0.0, 1.0); return uHull.z * pow(sin(u * 1.5708), 0.653) * (1.0 - 0.1 * smoothstep(120.0, 145.0, x)); }
      void main(){
        vec2 P = vW.xz;
        // nothing inside the hull (the marina's doorway, the pool deck's view down past the side)
        if (P.x > uHull.x + 1.0 && P.x < uHull.y - 0.3 && abs(P.y) < hullHalf(P.x) - 0.4) discard;
        float dist = length(cameraPosition - vW);
        float fade = 1.0 / (1.0 + dist / 70.0);
        vec2 Q = vec2(P.x - uFlow, P.y);
        vec2 rip = vec2(n2(Q * 0.55 + vec2(0.0, uTime * 0.35)) - 0.5, n2(Q * 0.55 + vec2(7.3, -uTime * 0.31)) - 0.5) * 0.5
                 + vec2(n2(Q * 2.1 + uTime * 0.9) - 0.5, n2(Q * 2.1 + vec2(3.1, 1.7) - uTime * 0.8) - 0.5) * 0.22;
        vec3 N = normalize(vec3(-vG.x - rip.x * fade, 1.0, -vG.y - rip.y * fade));
        // ---- the ship's foam: along the hull while it moves, the bow wave, and the wake's V behind the stern
        float sp = clamp(uSpeed / 10.0, 0.0, 1.0), foam = 0.0;
        float side = abs(P.y) - hullHalf(clamp(P.x, uHull.x, uHull.y));
        if (P.x > uHull.x - 4.0 && P.x < uHull.y) foam += sp * smoothstep(3.0 + 3.0 * sp, 0.0, side) * (0.4 + 0.6 * n2(Q * 0.8)) * (P.x < uHull.x + 50.0 ? 1.0 : 0.65);
        if (P.x > uHull.y - 6.0) {
          float behind = P.x - uHull.y, wide = 13.0 + behind * 0.36, core = smoothstep(wide, wide * 0.25, abs(P.y));
          float arms = smoothstep(4.0, 0.0, abs(abs(P.y) - (12.0 + behind * 0.34)));
          foam += sp * (core * 0.85 + arms * 0.5) * exp(-behind / 520.0) * (0.35 + 0.65 * n2(Q * 0.45 + vec2(uTime * 0.2, 0.0)));
        }
        foam = clamp(foam, 0.0, 1.0);
        vec3 V = normalize(cameraPosition - vW);
        vec3 col;
        if (cameraPosition.y >= -0.05) {
          // ---- from above: the sky in it (Fresnel), the deep blue under it, the Sun's glitter
          vec3 R = reflect(-V, N); R.y = abs(R.y);
          vec3 sky = mix(uHor, uZen, pow(smoothstep(-0.02, 0.55, R.y), 0.65));
          float fres = 0.02 + 0.98 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
          vec3 body = uDeep * (0.25 + 0.75 * uSkyK) + uSunCol * uDeep * 0.6 * max(uSun.y, 0.0);
          col = mix(body, sky, clamp(fres, 0.0, 1.0));
          float spec = pow(max(dot(R, uSun), 0.0), 900.0) * 60.0 + pow(max(dot(R, uSun), 0.0), 80.0) * 0.6;
          col += uSunCol * spec * (0.35 + 0.65 * fade);
          col = mix(col, vec3(0.86, 0.9, 0.93) * (0.45 + 0.55 * max(uSun.y, 0.2)) * (0.55 + 0.45 * uSkyK), foam * 0.85);
        } else {
          // ---- from below: inside Snell's window (48.6° from straight up) the sky, bright; outside it, the sea's own blue
          vec3 d = normalize(vW - cameraPosition);
          vec3 Nu = normalize(vec3(-vG.x - rip.x * 0.9, 1.0, -vG.y - rip.y * 0.9));
          float cw = dot(d, Nu);
          float win = smoothstep(0.62, 0.7, cw);
          vec3 skyIn = mix(uHor, uZen, smoothstep(0.66, 1.0, cw)) * 1.5 + uSunCol * pow(max(dot(d, normalize(uSun + vec3(0.0, 1.5, 0.0))), 0.0), 60.0) * 2.5;
          col = mix(uUnderCol * 0.7, skyIn, win);
          col = mix(col, vec3(0.75, 0.82, 0.85) * (0.4 + 0.6 * uSkyK), foam * 0.6);
        }
        // ---- the boil: the surface seethes white, cells bursting
        if (uBoil > 0.001) {
          vec2 B = P * 3.1 + vec2(0.0, uBoilT * 1.3);
          float cells = smoothstep(0.55, 0.9, n2(B) * 0.6 + n2(B * 2.7 - uBoilT * 4.0) * 0.4);
          float k = uBoil * (0.55 + 0.45 * cells);
          col = mix(col, vec3(0.8, 0.86, 0.9) * (cameraPosition.y >= -0.05 ? (0.3 + 0.7 * max(uSun.y, 0.3)) : 1.1), k * 0.8);
        }
        gl_FragColor = vec4(col, 1.0);
        ${THREE.ShaderChunk.fog_fragment}
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = -5; scene.add(mesh);
  return {
    mesh, U,
    set(s, t, cam, sky) {
      const a = ATP.air(s), sun = atSunAt(s);
      U.uTime.value = t; U.uFlow.value = ATV.dist(s) % 100000; U.uSpeed.value = ATV.v(s);
      U.uSun.value.set(...sun.v); U.uSunCol.value.setRGB(1.0, 0.97, 0.9).multiplyScalar(ATL.sunK(a));
      U.uZen.value.copy(sky.zen); U.uHor.value.copy(sky.hor); U.uSkyK.value = ATL.zenith(a);
      U.uBoil.value = MathX.smooth(s, ATE.sea, ATE.sea + 14) * (0.85 + 0.15 * Math.sin(s * 3.1)); U.uBoilT.value = s;
      // (centred under the camera, snapped to 25 m so the grid doesn't swim)
      mesh.position.set(Math.round(cam.position.x / 25) * 25, 0, Math.round(cam.position.z / 25) * 25);
    },
  };
}
