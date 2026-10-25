/* =====================================================================
   SPACE — what the places beyond the Earth share:
     tfStarMap()            the whole sky as one equirectangular canvas (seeded): the Milky Way's band and bulge with
                            its dust lanes, ~45,000 stars of real colours; drawn once
     tfStarDome(scene, o)   that sky on a dome round the camera, tinted for a blue- or redshift (uniform k: brightness)
     tfLens(r, uS, N)       a light ray table for a camera hovering at r (in r_s) above a star of radius 1/uS (or a black
                            hole: uS = 1): for each view angle ψ from straight up, where the ray ends up (far sky angle,
                            or a point on the star's surface, or swallowed)
     tfLensDome(scene, o)   the sky as that camera sees it: each pixel's ray looked up in the table, the star map sampled
                            where it came from; an optional glowing ring of gas (the black hole) or the star's own face
                            (the neutron star) drawn where rays hit it
   Light paths are exact for a non-rotating mass (Schwarzschild): u = 1/r, (du/dφ)² = 1/b² − u²(1 − u), b = r sin ψ /
   √(1 − 1/r) for a camera hovering at r. (physics.js tfBhTable is the black hole's case; this adds the star surface.)
   ===================================================================== */

// ---- the star map ---------------------------------------------------------------------------------------------------
// equirectangular: u = 0.5 + atan2(x, −z) / 2π, v = 0.5 − asin(y) / π (v = 0 at the top). The galactic plane is the
// map's equator; the galactic centre at u = 0.5 (direction −z).
let TF_STARMAP = null;
function tfStarMap() {
  if (TF_STARMAP) return TF_STARMAP;
  const W = 4096, H = 2048, r = new RNG(CONFIG.seed + 77);
  const c = tfCanvas(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    // the band: brightness and dust from noise at low resolution, smoothed up
    const bw = 1024, bh = 512, n3 = EarthScene._noise3(CONFIG.seed + 78), band = tfCanvas(bw, bh, (b) => {
      const im = b.createImageData(bw, bh), d = im.data;
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const lat = (0.5 - (y + 0.5) / bh) * 180, lon = ((x + 0.5) / bw - 0.5) * 360;
        // fbm on the sphere (no seam)
        const ph = (lon * Math.PI) / 180, th = (lat * Math.PI) / 180, X = Math.cos(th) * Math.sin(ph), Y = Math.sin(th), Z = -Math.cos(th) * Math.cos(ph);
        let n = 0, a = 0.5, f = 3.1, nn = 0; for (let o = 0; o < 6; o++) { n += a * n3(X * f + 11.3, Y * f * 1.6, Z * f + o * 7.1); nn += a; a *= 0.5; f *= 2.07; } n /= nn;
        let dn = 0; a = 0.5; f = 5.3; nn = 0; for (let o = 0; o < 5; o++) { dn += a * n3(X * f + 3.7, Y * f * 2.4 + 9.1, Z * f + o * 3.3); nn += a; a *= 0.5; f *= 2.13; } dn /= nn;
        const wid = 7 + 3 * (n - 0.5) * 4, core = Math.exp(-Math.pow(lat / wid, 2)), wide = Math.exp(-Math.pow(lat / (wid * 2.6), 2));
        const bulge = Math.exp(-(Math.pow(lon / 18, 2) + Math.pow(lat / 11, 2)));
        let L = 0.1 * wide + 0.42 * core * (0.55 + 0.9 * (n - 0.3)) + 0.75 * bulge;
        const dust = MathX.smooth(dn, 0.48, 0.66) * Math.exp(-Math.pow(lat / 4.5, 2)) * (0.6 + 0.4 * core);
        L *= 1 - 0.85 * dust; L = Math.max(0, L);
        const warm = bulge * 0.8 + 0.25;
        const i = (y * bw + x) * 4;
        d[i] = 255 * Math.min(1, L * (0.85 + 0.3 * warm)); d[i + 1] = 255 * Math.min(1, L * (0.8 + 0.1 * warm)); d[i + 2] = 255 * Math.min(1, L * (0.95 - 0.3 * warm)); d[i + 3] = 255;
      }
      b.putImageData(im, 0, 0);
    });
    g.globalAlpha = 0.55; g.imageSmoothingEnabled = true; g.drawImage(band, 0, 0, W, H); g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';
    // the stars: a colour from a rough spectral mix (most faint ones reddish-white), crowded towards the band
    const col = (k) => k < 0.08 ? [170, 195, 255] : k < 0.22 ? [205, 220, 255] : k < 0.55 ? [255, 246, 232] : k < 0.82 ? [255, 222, 180] : [255, 190, 140];
    const put = (x, y, rad, rgb, a) => {
      // (equirectangular: a star near the poles is wider in x)
      const sx = 1 / Math.max(0.15, Math.cos((0.5 - y / H) * Math.PI));
      if (rad < 1.2) { g.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; g.fillRect(x - 0.6 * sx, y - 0.6, 1.2 * sx, 1.2); return; }
      const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`); gr.addColorStop(0.3, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a * 0.35})`); gr.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      g.save(); g.translate(x, y); g.scale(sx, 1); g.fillStyle = gr; g.fillRect(-rad, -rad, 2 * rad, 2 * rad); g.restore();
    };
    for (let i = 0; i < 46000; i++) {
      // latitude: half uniform over the sphere, half crowded into the band
      const inBand = r.next() < 0.55, lat = inBand ? (r.next() + r.next() + r.next() - 1.5) * 16 : Math.asin(r.range(-1, 1)) * 180 / Math.PI, lon = r.range(-180, 180);
      const x = (lon / 360 + 0.5) * W, y = (0.5 - lat / 180) * H, m = Math.pow(r.next(), 7);
      const a = 0.25 + 0.75 * Math.min(1, m * 6), rad = 0.9 + 3.6 * m;
      put(x, y, rad, col(r.next()), a);
    }
    for (let i = 0; i < 160; i++) { const lat = Math.asin(r.range(-1, 1)) * 180 / Math.PI, lon = r.range(-180, 180); put((lon / 360 + 0.5) * W, (0.5 - lat / 180) * H, r.range(5, 11), col(r.next()), 1); }
    g.globalCompositeOperation = 'source-over';
  });
  const tex = tfTex(c, { repeat: false, aniso: 8 });
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  TF_STARMAP = tex;
  return tex;
}
const TF_SKY_GLSL = /* glsl */`
vec2 tfEq(vec3 d) { return vec2(0.5 + atan(d.x, -d.z) / 6.2831853, 0.5 + asin(clamp(d.y, -1.0, 1.0)) / 3.14159265); }
// the star map along direction d; lod from how fast d changes across the pixel (no seam: from the 3D direction)
vec3 tfStars(sampler2D m, vec3 d, float px) {
  vec2 e = tfEq(d); float lod = log2(max(1.0, px * 2048.0 / 3.14159265));
  return textureLod(m, e, lod).rgb;
}`;

// ---- a plain star dome (stars at infinity; tint = a colour multiplier; k = brightness) --------------------------------
function tfStarDome(scene, o = {}) {
  const U = { uMap: { value: tfStarMap() }, uTint: { value: new THREE.Color(o.tint || '#ffffff') }, uK: { value: o.k ?? 1 }, uRot: { value: new THREE.Matrix3() } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(o.r || 4000, 64, 32), new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform sampler2D uMap; uniform vec3 uTint; uniform float uK; uniform mat3 uRot; varying vec3 vD; ${TF_SKY_GLSL}
      void main(){ vec3 d = normalize(uRot * vD); float px = length(fwidth(d)); gl_FragColor = vec4(tfStars(uMap, d, px) * uTint * uK, 1.0); }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  return { mesh: m, U, follow(cam) { m.position.copy(cam.position); } };
}

// ---- light ray tables -----------------------------------------------------------------------------------------------
// camera hovering at r (r_s units), a surface at radius 1/uS (uS = 1: a black hole, no surface). For N view angles ψ
// (from straight up, i.e. from the direction away from the mass) → far: the far-sky angle the ray reaches (−1 if it
// doesn't), hit: the surface point's angle from the camera's foot (−1 if it misses), mu: cos of the ray's angle to the
// surface's vertical there (limb darkening, Doppler-free redshift is the same everywhere for a static surface)
function tfLens(r, uS = 1, N = 512) {
  const far = new Float32Array(N), hit = new Float32Array(N), mu = new Float32Array(N), lapse = Math.sqrt(1 - 1 / r), uo = 1 / r, bc = 1.5 * Math.sqrt(3);
  const Gf = (u, ib2) => ib2 - u * u * (1 - u);
  const integ = (a, b, ib2, M = 160) => {
    let sum = 0;
    for (let i = 0; i <= M; i++) {
      const s = i / M, w = i === 0 || i === M ? 1 : (i % 2 ? 4 : 2), s2 = Math.min(s, 1 - 1e-7), u = a + (b - a) * (1 - (1 - s2) * (1 - s2)), du = (b - a) * 2 * (1 - s2);
      const G = Gf(u, ib2); sum += w * (G > 0 ? du / Math.sqrt(G) : 0);
    }
    return Math.abs(sum / (3 * M));
  };
  const root = (lo, hi, ib2) => { for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (Gf(m, ib2) > 0) lo = m; else hi = m; } return 0.5 * (lo + hi); };
  const bmax = uS < 1 ? (1 / uS) / Math.sqrt(1 - uS) : 0;            // the surface's own edge (seen from far away)
  for (let i = 0; i < N; i++) {
    const psi = (i + 0.5) / N * Math.PI, sp = Math.sin(psi), cp = Math.cos(psi), b = r * sp / lapse, ib2 = 1 / (b * b);
    let f = -1, h = -1, m = 0;
    if (cp >= 0) {
      // outward: escapes unless inside the photon sphere with b > b_c (it turns back: towards the hole or the surface)
      // (a star's camera is always outside the photon sphere: R > 1.5 r_s)
      if (!(uo > 2 / 3 && b > bc)) f = integ(uo, 0, ib2);
    } else if (uS < 1 && b < bmax) {
      // inward and short of the edge: it reaches the surface
      h = integ(uo, uS, ib2);
    } else if (b > bc && uo < 2 / 3) {
      // inward from outside the photon sphere, passing by: turns round and escapes
      const ut = root(uo, 2 / 3, ib2); f = integ(uo, ut, ib2) + integ(0, ut, ib2);
    }
    if (h >= 0) { const sa = Math.min(1, b * uS * Math.sqrt(1 - uS)); m = Math.sqrt(1 - sa * sa); }
    far[i] = f; hit[i] = h; mu[i] = m;
  }
  return { far, hit, mu, lapse };
}

// ---- the lensed sky round a camera near a mass ------------------------------------------------------------------------
// o: { ring: true (the black hole's glowing gas), surface: { map, glow } (a star's face) }. update(cam, massPos, r, k)
// recomputes the table for radius r (r_s) and points it at the mass.
function tfLensDome(scene, o = {}) {
  const N = 1024, data = new Float32Array(N * 4), tab = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.FloatType);
  tab.minFilter = tab.magFilter = THREE.LinearFilter; tab.wrapS = tab.wrapT = THREE.ClampToEdgeWrapping; tab.needsUpdate = true;
  const U = {
    uMap: { value: tfStarMap() }, uTab: { value: tab }, uUp: { value: new THREE.Vector3(0, 1, 0) }, uK: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) },
    uR: { value: 10 }, uLapse: { value: 1 }, uRing: { value: o.ring ? 1 : 0 }, uRingK: { value: 1 }, uRingC: { value: new THREE.Color('#ff9a4a') }, uRingAx: { value: new THREE.Vector3(1, 0, 0) },
    uSurf: { value: o.surface ? 1 : 0 }, uSurfMap: { value: o.surface ? o.surface.map : null }, uSurfC: { value: new THREE.Color(o.surface ? o.surface.color || '#cfe0ff' : '#000') }, uSurfK: { value: 1 },
    uSpin: { value: new THREE.Matrix3() }, uStarRot: { value: new THREE.Matrix3() }, uGlow: { value: 0 },
  };
  const m = new THREE.Mesh(new THREE.SphereGeometry(o.r || 4000, 96, 48), new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform sampler2D uMap, uTab, uSurfMap; uniform vec3 uUp, uTint, uRingC, uSurfC, uRingAx; uniform float uK, uR, uLapse, uRing, uRingK, uSurf, uSurfK, uGlow; uniform mat3 uSpin, uStarRot;
      varying vec3 vD; ${TF_SKY_GLSL}
      void main(){
        vec3 d = normalize(vD);
        float cp = clamp(dot(d, uUp), -1.0, 1.0), psi = acos(cp);
        vec3 e = d - cp * uUp; float el = length(e); e = el > 1e-6 ? e / el : vec3(1.0, 0.0, 0.0);
        vec4 T = texture2D(uTab, vec2(psi / 3.14159265, 0.5));
        vec3 col = vec3(0.0);
        if (T.r >= 0.0) {
          vec3 F = cos(T.r) * uUp + sin(T.r) * e;
          F = uStarRot * F;
          col = tfStars(uMap, F, length(fwidth(F))) * uTint * uK + uGlow * uTint;   // (uGlow: the whole sky's light, squeezed into a small circle)
        }
        // the black hole's gas: a glowing ring a little outside the shadow's edge, brighter on the side coming towards you
        if (uRing > 0.5) {
          float b = uR * sin(psi) / uLapse, bc = 2.598;
          float g = exp(-pow((b - bc * 1.02) / 0.22, 2.0)) * 1.4 + exp(-pow((b - bc * 1.35) / 0.9, 2.0)) * 0.55 * smoothstep(bc * 0.98, bc * 1.05, b);
          float side = 0.55 + 0.45 * dot(e, uRingAx);
          col += uRingC * g * side * uRingK;
        }
        // a star's face: where the ray lands, its pattern, darker towards the edge
        if (uSurf > 0.5 && T.g >= 0.0) {
          vec3 Np = uSpin * (cos(T.g) * uUp + sin(T.g) * e);
          vec2 st = tfEq(Np);
          vec3 s = texture2D(uSurfMap, st).rgb;
          col = s * uSurfC * uSurfK * (0.35 + 0.65 * pow(T.b, 0.6));
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  let lastKey = null;
  return {
    mesh: m, U,
    // massDir: the direction from the camera to the mass (world); r in r_s; uS = 1/R (r_s units) for a star, 1 for a hole
    update(cam, massDir, r, uS = 1) {
      m.position.copy(cam.position);
      U.uUp.value.set(-massDir[0], -massDir[1], -massDir[2]).normalize();
      const key = r.toPrecision(7) + '|' + uS;
      if (key !== lastKey) {
        lastKey = key;
        const L = tfLens(r, uS, N);
        for (let i = 0; i < N; i++) { data[i * 4] = L.far[i]; data[i * 4 + 1] = L.hit[i]; data[i * 4 + 2] = L.mu[i]; data[i * 4 + 3] = 1; }
        tab.needsUpdate = true; U.uR.value = r; U.uLapse.value = L.lapse;
        // the circle of sky (below the photon sphere) gathers the whole sky's light: brighter as it shrinks
        const bc = 1.5 * Math.sqrt(3), sc = Math.min(1, bc * L.lapse / r), cosc = r < 1.5 ? Math.sqrt(1 - sc * sc) : -1;
        U.uGlow.value = Math.min(2.5, 0.012 / Math.max(1e-6, 1 - cosc));
      }
    },
  };
}

// a soft bright point (a star seen up close, the circle of sky above a black hole): a camera-facing sprite
function tfGlowSprite(scene, color = '#ffffff', size = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tfDotTex(0.18), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  s.scale.setScalar(size); s.renderOrder = -5; scene.add(s);
  return s;
}
