/* =====================================================================
   SKY — the real southern sky at 9 PM on 7 November 2026 from latitude 33.9° S (local sidereal time 23.8 h), shared by
   every outdoor set: a night dome (the Milky Way drawn from galactic coordinates, with its bulge setting in the west,
   the dust lanes, the two Magellanic Clouds, the city's light pollution low in the south, which goes when the grid
   does), the named bright stars at their real places and ~7,000 seeded fainter ones (more along the Milky Way), and
   Saturn high in the north. Each star has a distance; a star goes out when light has swallowed all the light it sent
   before 9 PM (physics.js: LFP.kOut), nearest first.
     lfBuildSky(scene, o) → { dome, stars, dirOf(raH, decDeg), update(s, { glow, mw, k, px }) }
   ===================================================================== */

// equatorial (RA hours, Dec degrees) → our horizon frame (x east, y up, z south), for LF_SKY's place and time
function lfSkyFrame() {
  const ph = MathX.deg(LF_SKY.lat), th = LF_SKY.lst / 24 * Math.PI * 2;
  const Z = [Math.cos(ph) * Math.cos(th), Math.cos(ph) * Math.sin(th), Math.sin(ph)];
  const N = [-Math.sin(ph) * Math.cos(th), -Math.sin(ph) * Math.sin(th), Math.cos(ph)];
  const E = [-Math.sin(th), Math.cos(th), 0];
  return { Z, N, E };
}
const LF_SKYF = lfSkyFrame();
function lfEqVec(raH, decDeg) { const a = raH / 24 * Math.PI * 2, d = MathX.deg(decDeg); return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; }
function lfEqToDir(q) { const F = LF_SKYF, dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; return [dot(q, F.E), dot(q, F.Z), -dot(q, F.N)]; }
const lfSkyDir = (raH, decDeg) => lfEqToDir(lfEqVec(raH, decDeg));
// galactic (l, b degrees) → equatorial (J2000)
const LF_EG = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
function lfGalToEq(lDeg, bDeg) {
  const l = MathX.deg(lDeg), b = MathX.deg(bDeg), g = [Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)], T = LF_EG;
  return [T[0][0] * g[0] + T[1][0] * g[1] + T[2][0] * g[2], T[0][1] * g[0] + T[1][1] * g[1] + T[2][1] * g[2], T[0][2] * g[0] + T[1][2] * g[1] + T[2][2] * g[2]];
}

// the named bright stars: [name, RA h, Dec °, mag, distance ly, colour]
const LF_STARS = [
  ['Alpha Centauri', 14.660, -60.83, -0.27, 4.37, '#fff1d8'], ['Hadar', 14.064, -60.37, 0.61, 390, '#d4e0ff'],
  ['Acrux', 12.443, -63.10, 0.77, 320, '#d4e0ff'], ['Mimosa', 12.795, -59.69, 1.25, 280, '#d8e2ff'], ['Gacrux', 12.519, -57.11, 1.59, 88, '#ffcf9a'],
  ['Delta Crucis', 12.252, -58.75, 2.79, 345, '#dde6ff'], ['Canopus', 6.399, -52.70, -0.74, 310, '#fffbea'], ['Achernar', 1.629, -57.24, 0.46, 139, '#d2deff'],
  ['Fomalhaut', 22.961, -29.62, 1.16, 25, '#ffffff'], ['Rigel', 5.242, -8.20, 0.13, 860, '#cfe0ff'], ['Aldebaran', 4.599, 16.51, 0.85, 65, '#ffc488'],
  ['Altair', 19.846, 8.87, 0.77, 17, '#ffffff'], ['Peacock', 20.427, -56.73, 1.94, 180, '#d6e2ff'], ['Alnair', 22.137, -46.96, 1.74, 101, '#dfe8ff'],
  ['Diphda', 0.727, -17.99, 2.04, 96, '#ffdcae'], ['Ankaa', 0.438, -42.31, 2.38, 85, '#ffd2a0'], ['Hamal', 2.120, 23.46, 2.0, 66, '#ffcf9a'],
  ['Mira', 2.322, -2.98, 3.0, 300, '#ff9a70'], ['Menkar', 3.038, 4.09, 2.54, 250, '#ffb88a'], ['Alpha Pavonis', 20.427, -56.73, 1.94, 180, '#d6e2ff'],
  ['Beta Gruis', 22.711, -46.88, 2.07, 177, '#ffb070'], ['Miaplacidus', 9.220, -69.72, 1.67, 113, '#ffffff'], ['Avior', 8.375, -59.51, 1.86, 630, '#ffcf9a'],
  ['Aspidiske', 9.285, -59.28, 2.21, 690, '#ffffff'], ['Suhail', 9.133, -43.43, 2.21, 545, '#ffbf88'], ['Naos', 8.060, -40.0, 2.25, 1080, '#c8d8ff'],
  ['Atria', 16.811, -69.03, 1.91, 391, '#ffbe88'], ['Alpha Tucanae', 22.308, -60.26, 2.86, 199, '#ffc898'], ['Beta Hydri', 0.429, -77.25, 2.8, 24, '#fff6e0'],
  ['Alpha Eridani 2', 3.967, -13.51, 2.95, 221, '#ffe0b0'], ['Acamar', 2.971, -40.30, 2.88, 161, '#ffffff'], ['Deneb Kaitos', 0.727, -17.99, 2.04, 96, '#ffdcae'],
  ['Algenib', 0.221, 15.18, 2.83, 390, '#d8e2ff'], ['Alpheratz', 0.140, 29.09, 2.06, 97, '#e2e8ff'], ['Markab', 23.079, 15.21, 2.48, 133, '#e2e8ff'],
  ['Scheat', 23.063, 28.08, 2.42, 196, '#ffb080'], ['Enif', 21.736, 9.88, 2.39, 690, '#ffbf88'], ['Nunki', 18.921, -26.30, 2.05, 228, '#d8e2ff'],
  ['Kaus Australis', 18.403, -34.38, 1.85, 143, '#dfe8ff'], ['Shaula', 17.560, -37.10, 1.62, 570, '#d4e0ff'], ['Sargas', 17.622, -42.99, 1.86, 300, '#fff4d8'],
];
LF_STARS.push(['Saturn', 0.35, -1.6, 0.55, LFP.dSaturn / LFP.LY, '#ffe6b4']);

function lfBuildSky(scene, o = {}) {
  const R = o.r || 9000, F = LF_SKYF;
  // ---- the dome: night gradient, Milky Way (galactic coordinates), Magellanic Clouds, light pollution
  const hg = new THREE.Matrix3();
  { // horizon dir → equatorial: eq = x E + y Z − z N ; then galactic = T eq
    const H = new THREE.Matrix3().set(F.E[0], F.Z[0], -F.N[0], F.E[1], F.Z[1], -F.N[1], F.E[2], F.Z[2], -F.N[2]);
    const T = new THREE.Matrix3().set(...LF_EG[0], ...LF_EG[1], ...LF_EG[2]);
    hg.multiplyMatrices(T, H);
  }
  const dirG = (l, b) => new THREE.Vector3(...lfEqToDir(lfGalToEq(l, b)));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uHG: { value: hg }, uGlow: { value: 1 }, uMw: { value: 1 }, uK: { value: 1 }, uCity: { value: new THREE.Vector3(0, 0, 1) },
      uLmc: { value: dirG(280.5, -32.9) }, uSmc: { value: dirG(302.8, -44.3) }, uTop: { value: new THREE.Color(o.top || '#03060c') }, uHor: { value: new THREE.Color(o.hor || '#0b1424') },
      uGlowC: { value: new THREE.Color(o.glowC || '#c9884a') }, uLow: { value: new THREE.Color(o.low || '#04070c') } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform mat3 uHG; uniform float uGlow, uMw, uK; uniform vec3 uCity, uLmc, uSmc, uTop, uHor, uGlowC, uLow; varying vec3 vD;
      float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.07; a *= 0.5; } return s; }
      void main(){
        vec3 d = normalize(vD); float h = d.y;
        vec3 col = mix(uHor, uTop, smoothstep(0.0, 0.55, h));
        if (h < 0.0) col = mix(uHor, uLow, smoothstep(0.0, -0.08, h));
        // the Milky Way: galactic latitude b, longitude l
        vec3 g = uHG * d; float b = asin(clamp(g.z, -1.0, 1.0)), l = atan(g.y, g.x);
        float n = fbm(g * 7.0), n2 = fbm(g * 23.0 + 3.1);
        float band = exp(-pow(b / (0.13 + 0.05 * n), 2.0)) * (0.55 + 0.6 * n);
        float bulge = exp(-pow(l / 0.55, 2.0)) * exp(-pow(b / 0.2, 2.0));
        float dust = 1.0 - 0.75 * exp(-pow((b + 0.012 * sin(l * 9.0)) / (0.03 + 0.02 * n2), 2.0)) * smoothstep(1.9, 0.3, abs(l));
        float clumps = 0.6 + 0.8 * smoothstep(0.42, 0.75, n2);
        float mw = (band * (0.8 + 1.6 * bulge) + 0.9 * bulge) * dust * clumps;
        vec3 mwc = mix(vec3(0.55, 0.62, 0.78), vec3(0.92, 0.82, 0.66), smoothstep(0.0, 0.6, bulge + 0.2 * n));
        // the Magellanic Clouds
        // (faint, ragged smudges, not discs: the Large one ~10° with its bar, the Small one ~5° and lopsided)
        vec3 tL = normalize(cross(uLmc, vec3(0.0, 1.0, 0.0))), bL = cross(uLmc, tL), dl = d - uLmc;
        float lx = dot(dl, tL), ly = dot(dl, bL), lx2 = 0.8 * lx + 0.6 * ly, ly2 = -0.6 * lx + 0.8 * ly;
        float nm = fbm(g * 38.0 + 7.3), rag = 0.25 + 1.1 * smoothstep(0.38, 0.78, nm);
        float lmc = (exp(-(lx * lx / 0.0049 + ly * ly / 0.0021)) * rag + 0.7 * exp(-(lx2 * lx2 / 0.0011 + ly2 * ly2 / 0.00012)) * (0.5 + 0.5 * nm)) * step(0.0, dot(d, uLmc));
        vec3 tS = normalize(cross(uSmc, vec3(0.0, 1.0, 0.0))), bS = cross(uSmc, tS), ds = d - uSmc;
        float sx = dot(ds, tS) + 0.25 * dot(ds, bS), sy2 = dot(ds, bS);
        float smc = exp(-(sx * sx / 0.0012 + sy2 * sy2 / 0.00045)) * (0.3 + 0.9 * smoothstep(0.35, 0.8, fbm(g * 44.0 + 1.7))) * step(0.0, dot(d, uSmc));
        float hz = smoothstep(-0.02, 0.18, h);
        // light pollution (low in the south, over the city), which hides the faint sky
        vec2 hd = normalize(vec2(d.x, d.z) + 1e-5);
        float lp = uGlow * exp(-max(h, 0.0) / 0.13) * (0.3 + 0.7 * pow(max(dot(hd, normalize(uCity.xz)), 0.0), 2.0)) * smoothstep(-0.05, 0.02, h);
        float vis = uMw * (1.0 - 0.8 * uGlow);
        col += vis * hz * (mwc * mw * 0.085 + vec3(0.8, 0.82, 0.9) * (lmc * 0.045 + smc * 0.035));
        col += uGlowC * lp * 0.26;
        // faint airglow near the horizon
        col += vec3(0.02, 0.035, 0.03) * exp(-max(h, 0.0) / 0.2) * hz * 0.6;
        gl_FragColor = vec4(col * uK, 1.0);
      }`,
  }));
  dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);

  // ---- the stars: the named ones, then the seeded faint field (more along the Milky Way)
  const P = [], M = [], Cl = [], D = [], S = [], names = {};
  const addStar = (q, mag, dist, col, seed) => {
    const v = lfEqToDir(q); if (v[1] < -0.06) return -1;
    P.push(v[0] * R * 0.97, v[1] * R * 0.97, v[2] * R * 0.97); M.push(mag); D.push(dist); S.push(seed);
    const c = new THREE.Color(col); Cl.push(c.r, c.g, c.b); return M.length - 1;
  };
  LF_STARS.forEach(([nm, ra, de, mag, dist, col], i) => { const k = addStar(lfEqVec(ra, de), mag, dist, col, lfR(i, 3)); if (k >= 0) names[nm] = { i: k, dir: lfSkyDir(ra, de), mag, dist }; });
  const rr = new RNG(4407), tint = ['#cbd8ff', '#e2e8ff', '#ffffff', '#fff4e2', '#ffe2bc', '#ffc896'];
  for (let n = 0, guard = 0; n < 7200 && guard < 60000; guard++) {
    const z = rr.range(-1, 1), a = rr.range(0, Math.PI * 2), q = [Math.sqrt(1 - z * z) * Math.cos(a), Math.sqrt(1 - z * z) * Math.sin(a), z];
    const T = LF_EG, gz = T[2][0] * q[0] + T[2][1] * q[1] + T[2][2] * q[2];     // sin(b)
    if (rr.next() > 0.3 + 0.7 * Math.exp(-Math.pow(Math.asin(gz) / 0.22, 2))) continue;
    const mag = Math.max(2.6, 7.2 + 2 * Math.log10(Math.max(1e-4, rr.next())));
    const dist = Math.exp(rr.range(Math.log(15), Math.log(3000)));
    if (addStar(q, mag, dist, tint[Math.floor(rr.next() * tint.length)], rr.next()) >= 0) n++;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aMag', new THREE.Float32BufferAttribute(M, 1));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(Cl, 3));
  g.setAttribute('aDist', new THREE.Float32BufferAttribute(D, 1));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(S, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uPx: { value: 1 }, uLim: { value: 6.8 }, uOut: { value: 0 }, uT: { value: 0 }, uK: { value: 1 }, uSize: { value: o.size || 1 } },
    vertexShader: `attribute float aMag, aDist, aSeed; attribute vec3 aCol; uniform float uPx, uLim, uOut, uT, uK, uSize; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_Position.z = gl_Position.w * 0.99999;
        float alt = normalize(position).y, tw = 1.0 + (0.12 + 0.35 * (1.0 - smoothstep(0.0, 0.5, alt))) * sin(uT * (2.0 + 5.0 * aSeed) + aSeed * 60.0);
        float f = pow(10.0, -0.4 * (aMag - 1.0)), on = aDist > uOut ? 1.0 : 0.0, ext = mix(0.35, 1.0, smoothstep(0.0, 0.35, alt));
        float lim = smoothstep(uLim + 0.6, uLim - 0.6, aMag);
        vA = clamp(0.32 + 0.68 * sqrt(f), 0.0, 1.6) * on * tw * ext * lim * uK;
        vC = aCol;
        gl_PointSize = uPx * uSize * clamp(2.2 + 1.5 * sqrt(f), 1.5, 9.0); }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
        float a = vA * (exp(-r * 5.0) + 0.45 * exp(-r * 22.0)); gl_FragColor = vec4(vC * a, a); }`,
  });
  const stars = new THREE.Points(g, mat); stars.frustumCulled = false; stars.renderOrder = -9; scene.add(stars);
  return {
    dome, stars, names,
    dir: lfSkyDir,
    // s: story s; o.glow 0…1 (light pollution), o.mw (the Milky Way's brightness), o.k (overall), o.px (pixel scale), o.lim (faintest mag)
    update(s, u = {}) {
      const du = dome.material.uniforms, su = mat.uniforms;
      du.uGlow.value = u.glow ?? 0; du.uMw.value = u.mw ?? 1; du.uK.value = u.k ?? 1;
      su.uPx.value = u.px ?? 1; su.uT.value = s; su.uK.value = u.starK ?? 1;
      su.uLim.value = u.lim ?? (6.9 - 3.4 * (u.glow ?? 0));
      // a star is out once light has swallowed all the light it sent before 9 PM
      su.uOut.value = s > 0 ? (LFP.k(s) - 1) / LFP.LN / LFP.LY : 0;
      if (u.at) { dome.position.copy(u.at); stars.position.copy(u.at); }
    },
  };
}
