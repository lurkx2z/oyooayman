/* =====================================================================
   SPACE — what is left of the Earth, from space (the land, sea, clouds and town lights are the shared EarthScene's
   textures; the cut, the face, the shock and the collapse are this film's). Modes:
     gone      over Europe at night, round to the cut face: what's left        face    the face: core, mantle, crust
     blow      low across the face: its insides blowing out into space         shock   (the cross-section is hud.js's)
     front     over Europe: the shock's ring racing north (the first two minutes replayed 25× faster, then real time)
     edge      the edge in the South Pacific (in daylight): the air pouring off, the sea spilling over
     others    from straight above the half that stays: who gets it when       paris   over France: the ring reaches Paris
     fall      TIME-LAPSE: the half-Earth falls in on itself, melts, boils      moonaway  the half-Moon balls up, drifts off
     sun       the half-Earth (its face glowing) and, beyond it, the Sun: on this side of the cut, Mercury and Venus by it
     orbit     TIME-LAPSE: the new Earth, a crescent of steam, the Sun beside it (still going round it, its path drawn in)
     forever   the new Earth under a sky that is half black
   Frame: Earth-fixed, as EarthScene's textures (x = lon 0 on the equator, y = north, z = lon 90° W); 1 unit = the Earth's
   radius. The cut's normal N points to the half that stays; e1 points along the face towards London, e2 = N × e1.
   One mesh is both shapes: a sphere whose lower half (seen from N) is flattened onto the face, morphing (uK) into a
   ball of 0.794 the radius round the half's centre of mass, 0.34 R along N (PLAN § 2).
   ===================================================================== */

const HV_SP = (() => {
  const N = [HVP.nEF[0], HVP.nEF[2], -HVP.nEF[1]];
  const ll = (lon, lat) => { const p = lat * HV_D2R, l = lon * HV_D2R; return [Math.cos(p) * Math.cos(l), Math.sin(p), -Math.cos(p) * Math.sin(l)]; };
  const L = ll(HVP.lon, HVP.lat), e1 = hvNrm(hvAdd(L, N, -hvDot(L, N))), e2 = hvCross(N, e1);
  const th = hvGmst(0) * 15 * HV_D2R, geo = (v) => { const x = v[0] * Math.cos(th) + v[1] * Math.sin(th), y = -v[0] * Math.sin(th) + v[1] * Math.cos(th); return [x, v[2], -y]; };
  return { N, e1, e2, L, ll, geo, sun: geo(hvSunDir(0)), C: 0.34, Rb: Math.cbrt(0.5), vKm: 1 / HVP.R };
})();
// the planets that stay tonight (on this side of the cut: calc/planets.py), for the space shots: [name, RA (h), Dec (°), mag]
const HV_PLANETS_KEPT = [['MERCURY', 15.0884, -19.833, 1.9, 5600], ['VENUS', 13.5891, -15.928, -3.7, 5800], ['MARS', 9.3327, 17.188, 0.9, 4200], ['JUPITER', 9.7656, 14.183, -1.9, 5400]];
const hvRim = (a) => hvAdd(hvSc(HV_SP.e1, Math.cos(a * HV_D2R)), HV_SP.e2, Math.sin(a * HV_D2R));   // a point on the edge, a° round from the one nearest London
// the inside of the Earth (°C) at a distance r (Earth radii) from the centre: PLAN § 2
function hvTempC(r) {
  const seg = [[0, 5400], [0.1917, 5200], [0.5462, 4000], [0.565, 2700], [0.896, 1900], [0.984, 1350], [1.0, 15]];
  for (let i = 1; i < seg.length; i++) if (r <= seg[i][0]) { const u = (r - seg[i - 1][0]) / (seg[i][0] - seg[i - 1][0]); return seg[i - 1][1] + (seg[i][1] - seg[i - 1][1]) * u; }
  return 15;
}
// a hot body's colour (linear RGB, max 1) at T kelvin, and how bright it is drawn (compressed, so the mantle still reads)
function hvBlackbody(T) {
  const t = T / 100, r = t <= 66 ? 1 : 1.292936 * Math.pow(t - 60, -0.1332047), g = t <= 66 ? 0.3900816 * Math.log(t) - 0.6318414 : 1.1298909 * Math.pow(t - 60, -0.0755148),
    b = t >= 66 ? 1 : t <= 19 ? 0 : 0.5432068 * Math.log(t - 10) - 1.1962541;
  return [r, g, b].map((x) => Math.pow(MathX.clamp(x, 0, 1), 2.2));
}
const hvGlowI = (T) => 4 * Math.pow(Math.max(T - 700, 0) / 5000, 2.2);

// the morphing half-ball (the Earth, or with o.moon the Moon): o = { R (radius), tex (EarthScene) }
function hvHalfBall(o) {
  const geo = new THREE.SphereGeometry(1, o.moon ? 128 : 256, o.moon ? 64 : 160);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...HV_SP.N)));
  const U = {
    uN: { value: new THREE.Vector3(...HV_SP.N) }, uSun: { value: new THREE.Vector3(...HV_SP.sun) }, uK: { value: 0 }, uC: { value: HV_SP.C }, uRb: { value: HV_SP.Rb },
    uS: { value: 0 }, uFront: { value: 0 }, uMelt: { value: 0 }, uSteam: { value: 0 }, uT: { value: 0 }, uBurst: { value: 0 }, uMoon: { value: o.moon ? 1 : 0 }, uLights: { value: 1 }, uMoonlit: { value: 1 }, uRimK: { value: 1 }, uCloudK: { value: 1 },
    uDay: { value: o.tex ? o.tex.uniforms.uDay.value : null }, uMask: { value: o.tex ? o.tex.uniforms.uMask.value : null }, uNight: { value: o.tex ? o.tex.uniforms.uNight.value : null },
    uCloud: { value: o.tex ? o.tex.clouds.material.uniforms.uMap.value : null },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      uniform vec3 uN; uniform float uK, uC, uRb;
      varying vec3 vU, vNrm, vW; varying float vC;
      void main() {
        vec3 u = normalize(position); float c = dot(u, uN);
        vec3 hp = c >= 0.0 ? u : u - c * uN, hn = c >= 0.0 ? u : -uN;
        vec3 p = mix(hp, uN * uC + uRb * u, uK), nn = normalize(mix(hn, u, uK));
        vU = u; vC = c; vNrm = normalize(mat3(modelMatrix) * nn);
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uDay, uMask, uNight, uCloud; uniform vec3 uN, uSun;
      uniform float uS, uFront, uMelt, uSteam, uT, uBurst, uMoon, uK, uLights, uMoonlit, uRimK, uCloudK;
      varying vec3 vU, vNrm, vW; varying float vC;
      float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= 0.5; } return s; }
      vec3 bb(float T) { float t = T / 100.0;
        float r = t <= 66.0 ? 1.0 : 1.292936 * pow(t - 60.0, -0.1332047), g = t <= 66.0 ? 0.3900816 * log(t) - 0.6318414 : 1.1298909 * pow(t - 60.0, -0.0755148);
        float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : 0.5432068 * log(t - 10.0) - 1.1962541);
        return pow(clamp(vec3(r, g, b), 0.0, 1.0), vec3(2.2)); }
      float glowI(float T) { return 4.0 * pow(max(T - 700.0, 0.0) / 5000.0, 2.2); }
      float tempC(float r) {
        if (r < 0.1917) return mix(5400.0, 5200.0, r / 0.1917);
        if (r < 0.5462) return mix(5200.0, 4000.0, (r - 0.1917) / 0.3545);
        if (r < 0.565) return mix(4000.0, 2700.0, (r - 0.5462) / 0.0188);
        if (r < 0.896) return mix(2700.0, 1900.0, (r - 0.565) / 0.331);
        if (r < 0.984) return mix(1900.0, 1350.0, (r - 0.896) / 0.088);
        return mix(1350.0, 15.0, (r - 0.984) / 0.016);
      }
      void main() {
        vec3 u = normalize(vU), n = normalize(vNrm), v = normalize(cameraPosition - vW);
        float c = vC, ndl = dot(n, uSun);
        vec3 col;
        if (c >= 0.0) {
          // ---- the ground that stays
          vec3 alb; float land = 1.0, cl = 0.0; vec3 lights = vec3(0.0);
          if (uMoon > 0.5) { alb = vec3(0.32, 0.31, 0.3) * (0.7 + 0.5 * fbm(u * 9.0)) * (1.0 - 0.35 * smoothstep(0.55, 0.7, fbm(u * 3.0 + 2.0))); }
          else {
            float lon = atan(-u.z, u.x), lat = asin(clamp(u.y, -1.0, 1.0));
            vec2 euv = vec2(lon / 6.2831853 + 0.5, lat / 3.1415927 + 0.5);
            float u2 = fract(lon / 6.2831853); vec2 dx = dFdx(euv), dy = dFdy(euv); float dx2 = dFdx(u2), dy2 = dFdy(u2);
            vec2 gX = vec2(abs(dx.x) < abs(dx2) ? dx.x : dx2, dx.y), gY = vec2(abs(dy.x) < abs(dy2) ? dy.x : dy2, dy.y);
            alb = textureGrad(uDay, euv, gX, gY).rgb; land = textureGrad(uMask, euv, gX, gY).r; cl = textureGrad(uCloud, euv, gX, gY).r;
            lights = textureGrad(uNight, euv, gX, gY).rgb;
          }
          // (behind the shock: broken ground, the air full of dust; its towns dark)
          float phi = degrees(asin(clamp(c, 0.0, 1.0)));
          float broke = uS > 0.0 ? smoothstep(uFront + 0.08, uFront - 0.25, phi) : 0.0;
          float crack = smoothstep(0.035, 0.0, abs(fbm(u * 70.0) - 0.5)) * 0.8 + smoothstep(0.025, 0.0, abs(fbm(u * 210.0 + 3.0) - 0.5)) * 0.5;
          // (land turns to dark broken ground under dust; the sea stays sea, darker and churned)
          alb = mix(alb, vec3(0.15, 0.115, 0.085) * (0.65 + 0.5 * fbm(u * 60.0)) * (1.0 - 0.6 * crack), broke * 0.9 * land);
          alb = mix(alb, alb * 0.75 + vec3(0.03, 0.04, 0.05) * (0.6 + 0.8 * fbm(u * 90.0)), broke * (1.0 - land) * 0.6);
          cl *= 1.0 - broke * 0.6;
          col = alb * (0.025 + 1.15 * max(ndl, 0.0)) + alb * vec3(0.55, 0.65, 1.0) * 0.3 * smoothstep(0.05, -0.15, ndl) * (1.0 - uMoon) * uMoonlit * (1.0 - 0.75 * broke * land);   // (the night side, faintly moonlit)
          col = mix(col, vec3(0.2, 0.14, 0.09) * (0.012 + 0.7 * max(ndl, 0.0)), broke * land * 0.4 * fbm(u * 25.0 + vec3(uT * 0.01)));   // (brown dust over it)
          // (near the edge the sea is churned white: its water, and the air over it, pouring out of the cut into space)
          float nearEdge = uS > 0.0 ? smoothstep(2.2, 0.0, phi) * (1.0 - land) * (1.0 - uMoon) : 0.0;
          if (nearEdge > 0.0) {
            vec3 b1 = normalize(cross(uN, vec3(0.0, 1.0, 0.0))), b2 = cross(uN, b1); float ang = atan(dot(u, b2), dot(u, b1));
            float flow = fbm(vec3(ang * 1100.0, phi * 70.0 - uT * 0.35, 0.0)) * 0.65 + fbm(vec3(ang * 3300.0, phi * 210.0 - uT * 1.0, 3.0)) * 0.35;
            float foam = smoothstep(0.5, 0.78, flow) * smoothstep(1.6, 0.05, phi) + smoothstep(0.22, 0.0, phi) * (0.6 + 0.4 * flow);
            col *= 0.85 + 0.3 * flow * nearEdge;
            col = mix(col, vec3(0.86, 0.9, 0.96) * (0.04 + 0.95 * max(ndl, 0.0)), clamp(foam, 0.0, 1.0) * 0.85 * nearEdge);
          }
          lights *= 0.2 + 2.4 * smoothstep(0.58, 0.85, n3(u * 1400.0)) + 0.8 * smoothstep(0.5, 0.75, n3(u * 520.0 + 7.0));
          vec3 hv = normalize(uSun + v);
          col += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, hv), 0.0), 420.0) * 0.32 * (1.0 - land) * step(0.0, ndl) * (1.0 - broke);
          col = mix(col, vec3(0.92) * (0.004 + 0.92 * smoothstep(-0.07, 0.62, ndl)), cl * 0.88 * uCloudK);
          float night = smoothstep(0.06, -0.18, ndl);
          col += lights * night * 1.6 * (1.0 - broke) * (1.0 - 0.6 * cl) * uLights;
          // the ring: the shock front, a line of breaking ground and dust (bright enough to see at night)
          float ring = uS > 0.0 ? exp(-pow((phi - uFront) / 0.28, 2.0)) : 0.0, trail = uS > 0.0 && phi < uFront ? exp(-(uFront - phi) / 1.6) : 0.0;
          col += vec3(1.0, 0.72, 0.42) * ring * (0.45 + 1.0 * night) * (0.45 + 0.9 * n3(u * 400.0 + uT)) * (0.7 + 0.6 * crack);
          col += vec3(0.9, 0.45, 0.18) * trail * 0.07 * (0.3 + night) * (0.4 + crack) * land;          // (just behind it: the ground still breaking, dust thrown up)
          col += vec3(0.6, 0.42, 0.28) * broke * 0.012 * (0.5 + 0.5 * max(ndl, 0.0));
          // the air towards the limb; and at the edge, the air pouring off (lit where the sun is up)
          float rim = pow(1.0 - max(dot(n, v), 0.0), 2.5);
          col = mix(col, vec3(0.45, 0.66, 0.95) * max(ndl + 0.15, 0.0), rim * 0.62 * (1.0 - uMoon) * (1.0 - uK) * uRimK);
          float edgeHaze = uS > 0.0 ? exp(-phi / 0.35) * (1.0 - uMoon) : 0.0;
          col += vec3(0.5, 0.65, 0.95) * edgeHaze * 0.5 * max(ndl + 0.1, 0.03);
        } else {
          // ---- the face: still as hot as it was inside, each layer its own look; then blowing out
          float r = sqrt(max(1.0 - c * c, 0.0));
          vec3 fp = u - c * uN;                                                                    // (the point on the face)
          if (uMoon > 0.5) {
            float T = mix(1450.0, 200.0, smoothstep(0.2, 0.98, r)) * (0.9 + 0.2 * fbm(u * 20.0));
            col = bb(T + 273.0) * glowI(T + 273.0);
          } else {
            float T = tempC(r), tex = 1.0;
            if (r < 0.1917) tex = 0.94 + 0.12 * h3(floor(fp * 260.0));                              // inner core: solid iron, crystalline
            else if (r < 0.5462) {                                                                  // outer core: liquid iron, swirling
              float sw = fbm(vec3(r * 22.0 + 1.4 * fbm(fp * 5.0 + vec3(uT * 0.004)), atan(dot(fp, cross(uN, vec3(0.0, 1.0, 0.0))), dot(fp, vec3(0.0, 1.0, 0.0))) * 2.0, uT * 0.003));
              tex = 0.86 + 0.28 * sw;
            } else if (r < 0.984) {                                                                 // mantle: rock, slowly churning in cells
              float cl = fbm(fp * 16.0 + vec3(uT * 0.002)); float edge = smoothstep(0.04, 0.0, abs(fbm(fp * 7.0 + 4.0) - 0.5));
              T += 260.0 * (cl - 0.5) - 140.0 * edge; tex = 0.92 + 0.16 * cl;
            } else T *= 0.85 + 0.3 * fbm(fp * 220.0);                                             // crust: cold rock, glowing cracks low down
            float Tk = T + 273.0, I = (0.16 + 0.78 * pow(clamp((Tk - 600.0) / 5000.0, 0.0, 1.0), 1.5)) * smoothstep(650.0, 1150.0, Tk);
            float layer = exp(-pow((r - 0.1917) / 0.003, 2.0)) + exp(-pow((r - 0.5462) / 0.004, 2.0)) + 0.5 * exp(-pow((r - 0.896) / 0.003, 2.0)) + 0.8 * exp(-pow((r - 0.984) / 0.002, 2.0));
            col = bb(Tk * 0.7) * I * tex * (1.0 - 0.45 * layer) + vec3(0.03, 0.026, 0.024) * (1.0 - smoothstep(0.97, 0.99, r)) * 0.0;
            col += vec3(0.04, 0.035, 0.03) * smoothstep(0.984, 0.995, r) * (0.02 + max(ndl, 0.0));     // (the crust lit, where the Sun reaches it)
          }
          col *= 1.0 - 0.3 * uBurst * (0.5 + 0.5 * sin(dot(u, vec3(40.0, 31.0, 23.0)) + uT * 3.0) * fbm(u * 28.0));
        }
        // ---- the collapse: a dark crust over molten rock, glowing through its cracks and lava lakes (lit by the Sun on its
        // day side, a terminator like any planet's); then a sky of steam, in bands and billows, the glow showing through
        if (uMelt > 0.0) {
          vec3 wq = u * 4.0 + 1.6 * vec3(fbm(u * 2.6 + 5.0), fbm(u * 2.6 + 9.0), fbm(u * 2.6 + 13.0)) + vec3(0.0, uT * 0.003, 0.0);
          float vein = smoothstep(0.03, 0.0, abs(fbm(wq) - 0.5)) + 0.55 * smoothstep(0.018, 0.0, abs(fbm(u * 15.0 + 3.0) - 0.5));
          float pool = smoothstep(0.64, 0.76, fbm(u * 2.2 + 11.0));
          float hot = clamp(vein + pool, 0.0, 1.0) * (1.0 - 0.5 * uSteam);
          vec3 crust = (uMoon > 0.5 ? vec3(0.2, 0.195, 0.19) : vec3(0.085, 0.07, 0.062)) * (0.6 + 0.6 * fbm(u * 38.0));
          vec3 lava = crust * (0.02 + 1.1 * max(ndl, 0.0)) + bb(1500.0) * 2.0 * hot + bb(1150.0) * 0.1 * (1.0 - uMoon);
          col = mix(col, lava, uMelt);
        }
        if (uMoon > 0.5) col += bb(1450.0) * 1.6 * exp(-c * c / 0.0007) * uK;                    // (the half-Moon: a glowing seam where its cut face was)
        if (uSteam > 0.0) {
          float lat = u.y, bill = fbm(u * 6.5 + vec3(uT * 0.002, 0.0, 0.0) + 0.9 * vec3(fbm(u * 2.5 + 2.0)));
          float bands = 0.5 + 0.5 * sin(lat * 17.0 + 2.2 * fbm(u * 3.5 + vec3(uT * 0.0015, 0.0, 0.0)));
          float sc = clamp(0.22 * bands + 0.7 * bill - 0.08 + 0.45 * uSteam, 0.0, 1.0);
          float lit = max(ndl, 0.0);
          vec3 st = vec3(0.66, 0.67, 0.7) * (0.62 + 0.38 * bill) * (0.85 + 0.15 * bands) * (0.006 + 0.95 * lit)
                  + bb(1300.0) * 0.045 * smoothstep(0.15, -0.2, ndl) * (1.1 - sc);
          col = mix(col, st, uSteam * mix(sc, 1.0, 0.72 * uK));
          float rim2 = pow(1.0 - max(dot(n, v), 0.0), 2.2);
          col += vec3(0.55, 0.58, 0.66) * rim2 * 0.22 * uSteam * max(ndl + 0.15, 0.0);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  return { mesh, U };
}

HV_SETS.space = (app) => {
  const S = hvSet(app, { sky: '#000000', fov: 35, near: 0.001, far: 2000, hemi: ['#1a2030', '#000000', 0.0] });
  const scene = S.scene, cam = S.camera, K = hvK, SP = HV_SP, N = SP.N, e1 = SP.e1, e2 = SP.e2;
  // ---- the stars (the real sky, as seen from here at 10 PM): the ones beyond the cut go out at 10:00:00
  const starU = { uS: { value: 0 }, uN: { value: new THREE.Vector3(...N) }, uPx: { value: 1 }, uB: { value: 1 } };
  { const T = hvStarTable().concat(HV_PLANETS_KEPT.map(([name, ra, dec, m, Tk]) => ({ name, d: hvRaDec(ra, dec), m, T: Tk, planet: true }))), pos = [], col = [], mag = [];
    for (const st of T) { const d = SP.geo(st.d), c = hvStarRGB(st.T); pos.push(d[0] * 900, d[1] * 900, d[2] * 900); col.push(...c); mag.push(st.m); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aMag', new THREE.Float32BufferAttribute(mag, 1));
    const st = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: starU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aCol; attribute float aMag; uniform float uS, uPx, uB; uniform vec3 uN; varying vec3 vC; varying float vA;
        void main(){ vec3 d = normalize(position); float I = pow(10.0, -0.4 * (aMag - 1.0)); vA = (uS > 0.0 && dot(d, uN) < 0.0) ? 0.0 : smoothstep(6.6, 5.0, aMag);
          vC = aCol * clamp(0.1 + 1.0 * pow(I, 0.45), 0.0, 2.6) * uB; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = vA > 0.0 ? uPx * clamp(2.2 + 5.0 * pow(I, 0.4), 2.0, 22.0) * (0.6 + 0.4 * uB) : 0.0; }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; float a = (exp(-r * 6.0) * 0.85 + exp(-r * 22.0) * 0.6) * vA; gl_FragColor = vec4(vC * a, a); }` }));
    st.frustumCulled = false; st.renderOrder = -9; scene.add(st); }
  // ---- the Milky Way and the faint star-dust behind the stars (the same band as the garden's sky): gone beyond the cut
  const mwU = { uS: { value: 0 }, uN: { value: new THREE.Vector3(...N) }, uPole: { value: new THREE.Vector3(...SP.geo(HV_GAL.pole)) }, uCen: { value: new THREE.Vector3(...SP.geo(HV_GAL.centre)) }, uK: { value: 1 } };
  const mw = new THREE.Mesh(new THREE.SphereGeometry(950, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: mwU,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform vec3 uN, uPole, uCen; uniform float uS, uK; varying vec3 vD;
      float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= 0.5; } return s; }
      void main() {
        vec3 q = normalize(vD); float b = dot(q, uPole), c = max(dot(q, uCen), -1.0);
        float w = exp(-b * b / 0.012) * (0.55 + 0.45 * smoothstep(-0.3, 1.0, c)) + 0.15 * exp(-b * b / 0.06) * (0.4 + 0.6 * smoothstep(0.2, 1.0, c));
        float cl = fbm(q * 7.0) * 0.7 + fbm(q * 23.0) * 0.4 + fbm(q * 61.0) * 0.35, lane = smoothstep(0.45, 0.8, fbm(q * vec3(11.0, 15.0, 13.0) + 3.1)) * exp(-b * b / 0.004);
        float dust = pow(h3(floor(q * 900.0)), 60.0) * 0.5 + pow(h3(floor(q * 420.0) + 3.0), 40.0) * 0.35;   // (unresolved faint stars)
        float keep = uS > 0.0 ? step(0.0, dot(q, uN)) : 1.0;
        vec3 col = (vec3(0.62, 0.64, 0.72) * 0.06 * w * (0.25 + 0.9 * cl) * (1.0 - 0.5 * lane) + vec3(0.8, 0.82, 0.9) * dust * (0.4 + 2.0 * w)) * keep * uK;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  mw.renderOrder = -10; mw.frustumCulled = false; scene.add(mw);
  // ---- the Earth
  const ES = new EarthScene();
  const earth = hvHalfBall({ tex: ES }); scene.add(earth.mesh);
  // its air (the half that stays), a thin glow at the limb
  const atmoU = { uSun: { value: new THREE.Vector3(...SP.sun) }, uN: { value: new THREE.Vector3(...N) }, uA: { value: 1 } };
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.03, 96, 48), new THREE.ShaderMaterial({
    uniforms: atmoU, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vW; varying vec3 vP; void main(){ vP = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uSun, uN; uniform float uA; varying vec3 vN; varying vec3 vW; varying vec3 vP;
      void main(){ if (dot(vP, uN) < 0.0) discard; vec3 v = normalize(cameraPosition - vW); float f = pow(max(0.0, 1.0 - abs(dot(normalize(vN), v)) * 1.05), 3.0);
        float lit = smoothstep(-0.35, 0.4, dot(normalize(vN), uSun)); gl_FragColor = vec4(vec3(0.32, 0.55, 1.0) * f * (0.12 + 1.1 * lit) * uA * smoothstep(0.0, 0.03, dot(vP, uN)), 1.0); }`,
  }));
  scene.add(atmo);
  // ---- the half-Moon (only in 'moonaway': placed for the shot, not to scale)
  const moonG = new THREE.Group(); scene.add(moonG);
  const moon = hvHalfBall({ moon: true }); moonG.add(moon.mesh); moonG.scale.setScalar(0.273); moon.U.uC.value = 0.375;
  // ---- the plume off the face, the air and the sea off the edge (pools rewritten every frame)
  const glow = hvPuffs(scene, 4200, { additive: true, soft: 1.5 });
  const mist = hvPuffs(scene, 2600, { additive: false, soft: 1.3 });
  // which stretches of the edge are sea (sampled from the land outlines)
  const inPoly = (lon, lat, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) c = !c; } return c; };
  const seaAt = Array.from({ length: 360 }, (_, a) => { const u = hvRim(a), lat = Math.asin(u[1]) / HV_D2R, lon = Math.atan2(-u[2], u[0]) / HV_D2R; return !EARTH_LAND.some((p) => inPoly(lon, lat, p)); });
  const faceP = (r, a) => hvAdd(hvSc(e1, r * Math.cos(a)), e2, r * Math.sin(a));

  const sun = new THREE.DirectionalLight('#fff4e6', 2.4); sun.position.set(...hvSc(SP.sun, 100)); scene.add(sun);
  // the Sun itself (only in 'orbit': a bright core and its glare, far behind everything)
  const sunTex = hvTex(hvCanvas(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    for (const [u, a] of [[0, 1], [0.025, 1], [0.05, 0.55], [0.1, 0.2], [0.2, 0.07], [0.35, 0.025], [0.6, 0.006], [1, 0]]) gr.addColorStop(u, `rgba(255,${Math.round(250 - 50 * u)},${Math.round(240 - 110 * u)},${a})`);
    g.fillStyle = gr; g.fillRect(0, 0, w, w); }), { repeat: false });
  const sunSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  sunSp.material.color.setScalar(2.2); sunSp.visible = false; scene.add(sunSp);
  // a camera that puts the body at Ec on screen at (ex, ey)° off its axis and the Sun at (sx, sy)°, D from the body
  // (the sky to the camera is mapped so the Sun's direction and the body's land where asked); side ±1: which way round
  const twoBody = (Ec, ex, ey, sx, sy, D, sideK = 1) => {
    const S = SP.sun, side = hvSc(hvNrm(hvCross(S, N)), sideK), tn = (d) => Math.tan(d * HV_D2R);
    const dE = hvNrm([tn(ex), tn(ey), -1]), dS = hvNrm([tn(sx), tn(sy), -1]), th = Math.acos(hvDot(dE, dS));
    const v = hvNrm(hvAdd(hvSc(S, Math.cos(th)), side, Math.sin(th)));
    const a2 = hvNrm(hvAdd(dE, dS, -hvDot(dE, dS))), a3 = hvCross(dS, a2), b2 = hvNrm(hvAdd(v, S, -hvDot(v, S))), b3 = hvCross(S, b2);
    const toW = (c) => hvAdd(hvAdd(hvSc(S, hvDot(c, dS)), b2, hvDot(c, a2)), b3, hvDot(c, a3));
    const P = hvAdd(Ec, v, -D); return { pos: P, at: hvAdd(P, toW([0, 0, -1]), 10), up: toW([0, 1, 0]) };
  };
  // the new Earth's path round the Sun (drawn in for the 'orbit' shot): a dashed line through it along its motion
  const Pe = SP.geo([0, -Math.sin(23.44 * HV_D2R), Math.cos(23.44 * HV_D2R)]), vOrb = hvNrm(hvCross(SP.sun, Pe));
  const path = new THREE.Line(new THREE.BufferGeometry().setFromPoints([-90, 90].map((d) => new THREE.Vector3(...hvAdd(hvSc(N, SP.C), vOrb, d)))), new THREE.LineDashedMaterial({ color: '#ffcf8a', dashSize: 0.5, gapSize: 0.35, transparent: true, opacity: 0.7, depthWrite: false, fog: false }));
  path.computeLineDistances(); path.visible = false; scene.add(path);
  const look = (p, at, fov, t, drift = 0.0, roll = 0, up = null) => { const d = hvDrift(t, drift, 0.3, 17); cam.up.set(...(up || [0, 1, 0])); cam.position.set(p[0] + d[0], p[1] + d[1], p[2] + d[2]); cam.lookAt(at[0], at[1], at[2]); if (roll) cam.rotateZ(roll * HV_D2R); if (cam.fov !== fov) cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); };
  // the story clock per shot (the space shots after the shock are time-lapses: each its own clock)
  const storyOf = (t, m) => {
    if (m === 'front') { const r1 = HV.front + 5.0; return t < r1 ? hvStoryAt(r1) * K(t, HV.front + 0.3, r1, (x) => x) : hvStoryAt(t); }   // (the first two minutes again, 25× faster)
    if (m === 'fall') return HVP.tHit * Math.pow(5400 / HVP.tHit, K(t, HV.fall, HV.moonaway, (x) => x));
    if (m === 'moonaway') return 5400 * Math.pow(48 * 3600 / 5400, K(t, HV.moonaway, HV.orbit, (x) => x));
    if (m === 'orbit') return 48 * 3600 * Math.pow(1.5, K(t, HV.orbit, HV.forever, (x) => x));
    if (m === 'forever') return 3 * 86400 * Math.pow(400, K(t, HV.forever, HV.real, (x) => x));
    return hvStoryAt(t);
  };
  HV_SPACE.storyOf = storyOf;

  const W0 = (t, a, b, fi, fo) => StoryHUD.win(t, a, b, fi, fo);
  const set = {
    scene, camera: cam,
    cuts() { return [HV.front + 5.0]; },
    frame(t, shot, app) {
      const m = shot.mode, s = storyOf(t, m);
      let pos, at = [0, 0, 0], fov = 35, drift = 0, up = null, roll = 0;
      earth.mesh.visible = true; atmo.visible = true; moonG.visible = false; sunSp.visible = false; path.visible = false;
      glow.begin(); mist.begin();
      // ------------------------------------------------------------------ the cameras
      if (m === 'gone') {
        // high over Europe at night, swinging round past the edge to look at the face
        const k = Ease.inOutSine(K(t, HV.gone, HV.face, (x) => x));
        const a0 = hvNrm(hvAdd(hvAdd(hvSc(e1, 0.86), N, 0.1), e2, 0.5)), a1 = hvNrm(hvAdd(hvAdd(hvSc(e1, 0.8), N, -0.3), e2, 0.52));
        pos = hvSc(hvNrm(hvV(a0, a1, k)), hvLerp(4.1, 3.7, k)); at = hvSc(N, hvLerp(0.22, 0.06, k)); fov = 36; up = N;
      } else if (m === 'face') {
        const k = Ease.inOutSine(K(t, HV.face, HV.blow, (x) => x));
        pos = hvSc(hvNrm(hvAdd(hvAdd(hvSc(e1, hvLerp(0.5, 0.3, k)), N, -0.85), e2, hvLerp(0.22, -0.12, k))), hvLerp(3.7, 2.9, k)); at = hvSc(N, -0.1); fov = 38; up = e1;
      } else if (m === 'blow') {
        // low across the face: its insides blowing out, a glowing wall rising off it
        const k = Ease.inOutSine(K(t, HV.blow, HV.shock, (x) => x));
        pos = hvAdd(hvAdd(hvSc(e2, hvLerp(1.42, 1.22, k)), N, hvLerp(-0.06, -0.1, k)), e1, hvLerp(0.42, 0.1, k)); at = hvAdd(hvAdd(hvSc(N, -0.05), e1, hvLerp(0.2, -0.05, k)), e2, 0.55); fov = 46; up = N;
      } else if (m === 'shock') {
        const k = K(t, HV.shock, HV.calls, (x) => x);
        pos = hvSc(hvNrm(hvAdd(hvSc(e2, -1), e1, 0.15)), hvLerp(4.4, 4.6, k)); at = [0, 0, 0]; fov = 34; up = N;
      } else if (m === 'front') {
        // over Europe, looking down the line from London to the edge
        const k = K(t, HV.front, HV.edge, (x) => x), Tg = hvNrm(hvAdd(e1, N, 0.3));
        pos = hvAdd(hvAdd(hvSc(Tg, hvLerp(1.62, 1.52, k)), N, hvLerp(0.95, 0.85, k)), e2, hvLerp(0.12, 0.02, k)); at = hvSc(hvNrm(hvAdd(e1, N, 0.24)), 1.0); fov = 34; up = N;
      } else if (m === 'edge') {
        // the edge in the South Pacific, in sunshine, seen side-on from just off the cliff and looking along the edge: the
        // ocean on the left (churned white as it reaches the lip), the cut face dropping away below it (cold crust, then
        // glowing rock deeper in), the sea's water and the air pouring off the corner, out over the void on the right
        const k = Ease.inOutSine(K(t, HV.edge, HV.moonedge, (x) => x)), Rp = hvRim(200), tg = hvRim(290), oN = hvSc(N, -1);
        pos = hvAdd(hvAdd(hvAdd(Rp, Rp, hvLerp(0.010, 0.006, k)), oN, hvLerp(0.034, 0.026, k)), tg, hvLerp(-0.085, -0.07, k));
        at = hvAdd(hvAdd(hvAdd(Rp, Rp, -0.004), oN, 0.006), tg, 0.01); fov = 40; up = Rp;
      } else if (m === 'others') {
        const k = K(t, HV.others, HV.tea, (x) => x);
        pos = hvAdd(hvAdd(hvSc(N, hvLerp(3.6, 3.4, k)), e1, 0.35), e2, 0.55); at = hvAdd(hvSc(N, 0.2), e2, 0.55); fov = 42; up = hvSc(e1, 1);
      } else if (m === 'paris') {
        const k = K(t, HV.paris, HV.count2, (x) => x);
        pos = hvSc(SP.ll(hvLerp(-2.5, -2.0, k), hvLerp(40.5, 41.2, k)), hvLerp(1.62, 1.55, k)); at = SP.ll(1.4, 50.2); fov = 30; up = [0, 1, 0];
      } else if (m === 'fall') {
        const k = K(t, HV.fall, HV.moonaway, (x) => x);
        pos = hvSc(hvNrm(hvAdd(hvAdd(hvSc(e1, 0.75), N, -0.45), e2, hvLerp(0.35, 0.05, k))), hvLerp(3.9, 3.6, k)); at = hvSc(N, 0.15); fov = 36;
      } else if (m === 'moonaway') {
        // ILLUSTRATION, not to scale: the half-Moon in front, the new Earth behind it
        // (from behind the new Earth and off to one side: the Earth large in front, the half-Moon beyond it, balling up, then
        // drifting off past its edge)
        const k = K(t, HV.moonaway, HV.orbit, (x) => x), dir = hvNrm(hvAdd(hvSc(e2, 1), N, 0.25)), away = MathX.smooth(k, 0.45, 1.0), Ec = hvSc(N, SP.C);
        moonG.visible = true; moonG.position.set(...hvAdd(Ec, dir, 4.2 + 4.0 * away * away));
        const mp = moonG.position.toArray(), sd = hvNrm(hvCross(dir, N)); this._moonP = mp;
        pos = hvAdd(hvAdd(hvAdd(Ec, dir, -hvLerp(2.6, 2.9, k)), sd, 1.55), N, 0.5); at = hvAdd(hvV(Ec, mp, hvLerp(0.42, 0.36, k)), sd, 0.3); fov = 42;
      } else if (m === 'orbit') {
        // the new Earth from its night side, the Sun about 50° from it: a sunlit crescent of steam round a dull red glow
        // (the camera is built so the Earth's middle sits at (−14°, −3°) off the axis and the Sun at (22°, 12°): the sky to
        // the camera is mapped so dS → the Sun's direction, dE → the Earth's)
        const k = Ease.inOutSine(K(t, HV.orbit, HV.forever, (x) => x)), c = twoBody(hvSc(N, SP.C), hvLerp(-16, -11, k), hvLerp(-4, -2, k), 22, 12, hvLerp(5.4, 4.4, k));
        pos = c.pos; at = c.at; up = c.up; fov = 50;
        sunSp.visible = true;
      } else if (m === 'sun') {
        // the half-Earth from out beyond its night side, a little below the cut, so its glowing face shows under it; the Sun
        // beyond, on the starry side of the line, Mercury and Venus beside it
        const k = Ease.inOutSine(K(t, HV.sun, HV.cat2, (x) => x)), c = twoBody([0, 0, 0], hvLerp(-19, -15, k), hvLerp(-2, -1, k), hvLerp(19, 17, k), 12, hvLerp(5.6, 5.0, k));
        pos = c.pos; at = c.at; up = c.up; fov = 50;
        sunSp.visible = true;
      } else if (m === 'forever') {
        // the new Earth, a sky with stars on one side of a line and none on the other
        const k = K(t, HV.forever, HV.real, (x) => x);
        pos = hvAdd(hvAdd(hvSc(N, 0.84), e1, hvLerp(-3.3, -2.7, k)), e2, hvLerp(1.5, 1.2, k)); at = hvAdd(hvAdd(pos, e1, 10), e2, hvLerp(-0.75, -0.5, k)); fov = 46; up = N; roll = hvLerp(10, 7, k);
      } else { pos = [0, 0, 4]; }
      look(pos, at, fov, t, drift, roll, up);
      if (sunSp.visible) { const S = SP.sun, D = 800; sunSp.position.set(cam.position.x + S[0] * D, cam.position.y + S[1] * D, cam.position.z + S[2] * D); sunSp.scale.setScalar(D * (m === 'sun' ? 0.24 : 0.3)); this._sunP = sunSp.position.toArray(); }
      // ------------------------------------------------------------------ the Earth's state
      const E = earth.U;
      E.uS.value = s; E.uT.value = t; E.uFront.value = hvFrontPhi(s);
      E.uRimK.value = m === 'edge' ? 0.3 : 1; E.uCloudK.value = m === 'edge' ? 0.15 : 1;
      E.uBurst.value = MathX.smooth(s, 0.5, 20);
      const collapse = MathX.smooth(s, 300, 3600);
      E.uK.value = collapse; E.uMelt.value = MathX.smooth(s, 500, 3000); E.uSteam.value = MathX.smooth(s, 2400, 5400);
      if (m === 'forever' || m === 'orbit') { E.uK.value = 1; E.uMelt.value = 1; E.uSteam.value = 1; }
      if (m === 'moonaway') { E.uK.value = 1; E.uMelt.value = 1; E.uSteam.value = MathX.smooth(s, 2400, 40000); }
      atmoU.uA.value = 1 - MathX.smooth(s, 300, 1200);
      starU.uS.value = s; starU.uPx.value = (app.renderH || 1080) / 1080; starU.uB.value = m === 'forever' ? 2.2 : 1.3;
      mw.position.copy(cam.position); mwU.uS.value = s; mwU.uK.value = m === 'forever' ? 2.4 : 1.2;
      // the Moon: balling up, then off
      if (moonG.visible) { const k = K(t, HV.moonaway, HV.orbit, (x) => x); moon.U.uK.value = MathX.smooth(k, 0.1, 0.6); moon.U.uS.value = s; moon.U.uT.value = t; moon.U.uMelt.value = 0.25 * MathX.smooth(k, 0.15, 0.5) * (1 - MathX.smooth(k, 0.6, 1.0)); }
      // ------------------------------------------------------------------ the plume off the face (before the collapse)
      if (s > 0.5 && collapse < 0.6) {
        const fade = 1 - MathX.smooth(collapse, 0.2, 0.6), nP = m === 'blow' ? 4000 : 2600;
        for (let i = 0; i < nP; i++) {
          const r = Math.sqrt(hvR(i, 1)), a = 6.2832 * hvR(i, 2), f = 0.55 + 0.9 * hvR(i, 3), born = hvR(i, 4) * Math.min(s, 400);
          const v = (6.0 * f * Math.sqrt(Math.max(0, 1 - r * r)) + 0.25) * SP.vKm;                       // (Earth radii per second)
          const h = v * (s - born); if (h <= 0) continue;
          const spread = 1 + 0.25 * h + 0.05 * hvR(i, 5);
          const p = hvAdd(faceP(Math.min(r * spread, 1.15), a + 0.05 * (hvR(i, 6) - 0.5)), N, -h);
          const T0 = hvTempC(r) + 273, T = Math.max(900, T0 / (1 + 6 * h)), c = hvBlackbody(T), I = Math.min(2.4, hvGlowI(T) * 0.9 + 0.05);
          glow.add(p[0], p[1], p[2], 0.012 + 0.35 * h, 0.06 * fade * (m === 'blow' ? 1.2 : 1), c[0] * I, c[1] * I, c[2] * I);
        }
      }
      // ------------------------------------------------------------------ the air and the sea off the edge
      if (s > 0 && collapse < 0.3 && (m === 'edge' || m === 'gone' || m === 'face' || m === 'blow' || m === 'front')) {
        const a0 = m === 'edge' ? 200.8 : 0, a1 = m === 'edge' ? 222 : 360, n = m === 'edge' ? 2400 : 900, zS = m === 'edge' ? 0.4 : 1, zA = m === 'edge' ? 0.45 : 1;
        for (let i = 0; i < n; i++) {
          const a = a0 + (a1 - a0) * hvR(i, 7), Rp = hvRim(a), out = hvNrm(hvAdd(hvSc(Rp, 0.55), N, -0.85)), born = hvR(i, 8) * s;
          const sea = seaAt[((Math.round(a) % 360) + 360) % 360] && hvR(i, 9) < 0.45, lit = Math.max(0, hvDot(Rp, SP.sun) + 0.1);
          const v = (sea ? 0.05 + 0.23 * hvR(i, 10) : 0.3 + 1.4 * hvR(i, 10)) * SP.vKm, d = v * (s - born);
          const p = hvAdd(hvAdd(hvSc(Rp, 1.0 + 0.002 * hvR(i, 11)), out, d), hvRim(a + 90), (hvR(i, 12) - 0.5) * 0.004);
          if (sea) mist.add(p[0], p[1], p[2], (0.0015 + 0.6 * d) * zS, 0.5 * (0.2 + lit) * zA, 0.85 * (0.15 + lit), 0.88 * (0.15 + lit), 0.92 * (0.15 + lit));
          else mist.add(p[0], p[1], p[2], (0.003 + 0.8 * d) * zS, 0.12 * (0.1 + lit) * zA, 0.55 * (0.1 + lit), 0.7 * (0.1 + lit), 1.0 * (0.12 + lit));
        }
      }
      // ------------------------------------------------------------------ the new Earth's path ahead of it (drawn in, dotted)
      if (m === 'orbit') { const Ec = hvSc(N, SP.C), pa = W0(t, HV.orbit + 1.2, HV.forever - 0.3, 0.6, 0.3); for (let d = SP.Rb + 0.12; d <= 70; d += 0.2) { const p = hvAdd(Ec, vOrb, d); glow.add(p[0], p[1], p[2], 0.075, 0.7 * pa, 1.0, 0.72, 0.4); } }   // (the way it is going)
      glow.end(); mist.end();
      this._s = s;
    },
    labels(t) {
      const m = hvShotAt(t).mode, out = [], W = StoryHUD.win, s = this._s ?? 0, SPc = HV_SP;
      const place = (name, a, sub, side) => { const P = hvCity(name); out.push({ p: hvSc(SPc.ll(P.lon, P.lat), 1.004), text: name, sub, a, side }); };
      const at = (P) => (P.name === 'LONDON' ? HVP.tHit : P.t);
      const hitSub = (name) => { const P = hvCity(name), T = at(P); return (s >= T ? 'HIT AT ' : 'GETS IT AT ') + hvClockText(Math.floor(T + 0.49), true); };
      if (m === 'gone') {
        place('LONDON', W(t, HV.gone + 0.6, HV.face - 0.3, 0.3, 0.2), 'YOU', 'r');
        out.push({ p: hvRim(32), text: 'THE CUT', sub: '2,240 km FROM YOU', a: W(t, hvCap('gone', 1).show, HV.face - 0.3, 0.3, 0.2), side: 'l' });
      }
      if (m === 'face') {
        const a = (i) => W(t, hvCap('face', 1).show + 0.2 + i * 0.35, HV.blow - 0.3, 0.3, 0.2), lab = (r, ang, text, sub, i, side) => out.push({ p: hvAdd(faceP(r, ang * HV_D2R), N, -0.005), text, sub, a: a(i), side });
        lab(0.05, 100, 'INNER CORE', '5,400 °C', 0, 'r'); lab(0.38, 150, 'OUTER CORE', 'LIQUID IRON', 1); lab(0.73, 200, 'MANTLE', 'ROCK', 2); lab(0.97, 240, 'CRUST', '', 3);
      }
      if (m === 'front' || m === 'paris') {
        const a = W(t, (m === 'front' ? hvCap('front', 1).show : HV.paris + 0.4), (m === 'front' ? HV.edge : HV.count2) - 0.3, 0.3, 0.2);
        for (const n of m === 'front' ? ['ROME', 'MADRID', 'PARIS', 'LONDON'] : ['PARIS', 'LONDON']) place(n, a, hitSub(n), m === 'front' && (n === 'LONDON' || n === 'MADRID') ? 'r' : undefined);
      }
      if (m === 'others') { const a = W(t, HV.others + 0.5, HV.tea - 0.3, 0.3, 0.2); for (const n of ['LONDON', 'NEW YORK', 'TOKYO', 'MOSCOW', 'BEIJING']) place(n, a, hitSub(n), n === 'MOSCOW' ? 'r' : n === 'LONDON' ? 'l' : undefined); }
      if (m === 'moonaway') {
        const a = W(t, HV.moonaway + 0.6, hvCap('moonaway', 1).show - 0.2, 0.3, 0.2), mp = this._moonP || [0, 0, 0];
        out.push({ p: hvAdd(mp, N, 0.25), text: 'THE MOON', sub: 'WHAT IS LEFT OF IT', a });
        out.push({ p: hvAdd(hvSc(N, 0.34), N, 0.6), text: 'THE EARTH', sub: 'WHAT IS LEFT OF IT', a });
      }
      // (a point on a ball's outline as the camera sees it: ang° round from the camera's right, anticlockwise)
      const limb = (c, R, ang) => { const cr = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), cu = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1), a = ang * HV_D2R;
        return hvAdd(hvAdd(c, cr.toArray(), R * Math.cos(a)), cu.toArray(), R * Math.sin(a)); };
      if (m === 'orbit') {
        const a = W(t, HV.orbit + 0.7, HV.forever - 0.3, 0.3, 0.2);
        if (this._sunP) out.push({ p: this._sunP, text: 'THE SUN', sub: 'STILL ON THIS SIDE', a });
        out.push({ p: limb(hvSc(N, SPc.C), SPc.Rb, -35), text: 'THE NEW EARTH', sub: 'HALF THE MASS · ABOUT 4/5 AS WIDE', a, side: 'l' });
      }
      if (m === 'sun') {
        const a = (i) => W(t, HV.sun + 0.8 + 0.4 * i, HV.cat2 - 0.3, 0.3, 0.2), pl = (n) => { const P = HV_PLANETS_KEPT.find((x) => x[0] === n); return hvSc(SPc.geo(hvRaDec(P[1], P[2])), 900); };
        if (this._sunP) out.push({ p: this._sunP, text: 'THE SUN', sub: 'ON THIS SIDE OF THE CUT', a: a(0), side: 'l' });
        out.push({ p: pl('VENUS'), text: 'VENUS', sub: '', a: a(1), side: 'r' });
        out.push({ p: pl('MERCURY'), text: 'MERCURY', sub: '', a: a(2) });
      }
      if (m === 'forever') out.push({ p: limb(hvSc(N, SPc.C), SPc.Rb * 1.01, 140), text: 'THE NEW EARTH', sub: 'UNDER A SKY OF STEAM', a: W(t, HV.forever + 0.8, HV.real - 0.4, 0.3, 0.3), side: 'r' });
      if (m === 'edge') { const Rp = hvRim(200); out.push({ p: hvAdd(Rp, N, 0.004), text: 'THE EDGE', sub: 'SOUTH PACIFIC', a: W(t, HV.edge + 0.6, hvCap('edge', 2).show - 0.3, 0.3, 0.2) }); }
      return out;
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.exposure = 1.0; p.bloom = 0.5; p.bloomThreshold = 0.85; p.vignette = 0.45; p.grain = 0.02; p.saturation = 1.06;
      if (m === 'blow' || m === 'face') { p.bloom = 0.62; p.exposure = 0.9; }
      if (m === 'shock') { p.exposure = 0.45; p.saturation = 0.8; }
      if (m === 'fall') p.bloom = 0.6;
    },
  };
  return set;
};
const HV_SPACE = {};
