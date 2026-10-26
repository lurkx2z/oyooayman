/* =====================================================================
   SKY — the sky over a place (your garden; Waikiki), drawn from physics.js, a pure function of story time s:
     · the stars: 130 named bright stars at their real places and 8,000 fainter ones (seeded, crowding to the Milky
       Way). Each has two copies: the real one (up until 10:00:00, then its light is gone for years) and its mirror
       image on the opposite side of the sky, which appears at its own exit time (lbExitTime: when this place gets out
       of the Earth's shadow for that star). The Milky Way the same way (a time map over the sky)
     · the Moon (garden): a gibbous disc whose every point has its own moment (baked once from lbMoonPoint): its lit
       side goes out at 10:00:00 and comes back at 10:08:18 (then twice as bright); its dark side lights up a few
       seconds after 10:00 as the old sunlight floods back
     · two suns: the real one (out from 10:00:00 until its new light arrives; the centre of its disc first; then ×2)
       and the second Sun at the opposite point (on at this place's exit time; first a red glow of light that grazed
       the old Earth's air, then the disc, growing from one edge)
     · the dome: the night (dark blue, the town's glow low down), the glow of distant high air lit before the second
       Sun reaches you, the daylight of each sun gated per direction by when that air gets the light (a time map), the
       Milky Way
   Local frame: y up; a place looks along azimuth az0 (−z). lbLocal(v, F, az0) turns an equatorial vector into it.
   ===================================================================== */

function lbLocal(v, F, az0) {
  const u = lbDot(v, F.up), n = lbDot(v, F.north), e = lbDot(v, F.east), a = az0 * LB_D2R;
  return [e * Math.cos(a) - n * Math.sin(a), u, -(n * Math.cos(a) + e * Math.sin(a))];
}
function lbUnLocal(g, F, az0) {
  const a = az0 * LB_D2R, e = g[0] * Math.cos(a) - g[2] * Math.sin(a), n = -g[2] * Math.cos(a) - g[0] * Math.sin(a), u = g[1];
  return lbAdd(lbAdd(lbSc(F.east, e), F.north, n), F.up, u);
}
// a star's colour from its temperature (linear RGB, max 1)
function lbStarRGB(T) {
  const K = [[3000, [1.0, 0.56, 0.32]], [4000, [1.0, 0.74, 0.52]], [5000, [1.0, 0.87, 0.74]], [6000, [1.0, 0.96, 0.92]], [7500, [0.92, 0.94, 1.0]], [10000, [0.8, 0.86, 1.0]], [20000, [0.68, 0.77, 1.0]], [40000, [0.62, 0.72, 1.0]]];
  if (T <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (T <= K[i][0]) { const u = (T - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return K[i - 1][1].map((x, k) => x + (K[i][1][k] - x) * u); }
  return K[K.length - 1][1];
}
// the time maps: over the sky (local az from −z towards +x, 0…360; alt −10…90), R = when the high air (40 km) there
// gets the second Sun (the glow), G = when the low air (8 km) does (the daylight), B = when a mirror image there appears
const LB_TMAP = { W: 120, H: 50 };
function lbTimeMap(F, X, az0, withSun) {
  const { W, H } = LB_TMAP, d = new Float32Array(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const az = (i + 0.5) / W * 2 * Math.PI, alt = (-10 + 100 * (j + 0.5) / H) * LB_D2R;
    const g = [Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)], v = lbUnLocal(g, F, az0);
    const k = (j * W + i) * 4;
    d[k + 2] = Math.min(1e6, lbExitTime(X, lbSc(v, -1), LB_SKY.U, LBP.R));
    if (withSun) {
      // (the air a line of sight meets at height h: horizontal distance D with D·tan(alt) + D²/2R = h)
      const airAt = (h) => { const ta = Math.tan(Math.max(alt, 0.0)), D = (-ta + Math.sqrt(ta * ta + 2 * h / LBP.R)) * LBP.R;
        const hd = lbNrm(lbAdd(v, F.up, -lbDot(v, F.up))), gg = D / LBP.R;
        return lbExitTime(lbSc(lbAdd(lbSc(F.up, Math.cos(gg)), hd, Math.sin(gg)), LBP.R + h), LB_SKY.S, LB_SKY.U, LBP.R); };
      d[k] = Math.min(1e6, airAt(40)); d[k + 1] = Math.min(1e6, airAt(8));
    } else { d[k] = 1e6; d[k + 1] = 1e6; }
  }
  const tex = new THREE.DataTexture(d, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = THREE.RepeatWrapping; tex.needsUpdate = true;
  return tex;
}
// the Moon's map (garden): for each point of the disc as seen from here, its moment and its lighting
function lbMoonMap(F, az0, N = 160) {
  const m = lbLocal(LB_SKY.M, F, az0), right = lbNrm(lbCross(m, [0, 1, 0])), up = lbCross(lbSc(m, -1), right), S = LB_SKY.S;
  const d = new Float32Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N * 2 - 1, v = (j + 0.5) / N * 2 - 1, w2 = 1 - u * u - v * v, k = (j * N + i) * 4;
    if (w2 <= 0) continue;
    const ng = lbAdd(lbAdd(lbSc(right, u), up, v), m, -Math.sqrt(w2)), n = lbUnLocal(ng, F, az0), p = lbMoonPoint(n);
    d[k] = Math.min(1e6, p.t); d[k + 1] = p.day; d[k + 2] = lbDot(n, S); d[k + 3] = Math.sqrt(w2);
  }
  const tex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
  return tex;
}
// the Moon's face (maria), and the Sun's (granulation, limb darkening and sunspot groups)
function lbMoonFace() {
  return lbTex(lbCanvas(256, 256, (c, w) => {
    const im = c.createImageData(w, w), D = im.data;
    const maria = [[0.38, 0.36, 0.17], [0.6, 0.32, 0.13], [0.55, 0.55, 0.15], [0.33, 0.62, 0.1], [0.68, 0.6, 0.09], [0.45, 0.47, 0.08], [0.24, 0.45, 0.07]];
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      let s = 0.92 + 0.1 * (hash2(x >> 2, y >> 2) - 0.5) + 0.05 * (hash2(x, y) - 0.5);
      for (const [mx, my, mr] of maria) { const dd = Math.hypot((x / w) - mx, (y / w) - my); s -= 0.3 * MathX.smooth(-dd, -mr, -mr * 0.55); }
      const i = (y * w + x) * 4; D[i] = D[i + 1] = D[i + 2] = 255 * MathX.clamp(s, 0, 1); D[i + 3] = 255;
    }
    c.putImageData(im, 0, 0);
    // a few bright young craters with rays (Tycho low down)
    c.globalCompositeOperation = 'lighter';
    for (const [cx, cy, r] of [[0.46, 0.82, 0.03], [0.3, 0.3, 0.015], [0.7, 0.42, 0.012]]) { const g = c.createRadialGradient(cx * w, cy * w, 0, cx * w, cy * w, r * w * 4); g.addColorStop(0, 'rgba(60,60,60,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }
  }), { repeat: false });
}
const LB_SPOTS = [[0.28, -0.18, 0.07], [0.34, -0.14, 0.035], [0.22, -0.22, 0.03], [-0.35, 0.12, 0.05], [-0.3, 0.16, 0.025], [0.05, 0.42, 0.03], [-0.1, -0.5, 0.022]];
function lbSunFace(mirror = false, N = 512) {
  return lbTex(lbCanvas(N, N, (c, w) => {
    const im = c.createImageData(w, w), D = im.data;
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w * 2 - 1, v = ((y + 0.5) / w * 2 - 1) * (mirror ? -1 : 1), r2 = u * u + v * v, i = (y * w + x) * 4;
      if (r2 > 1) { D[i + 3] = 0; continue; }
      const mu = Math.sqrt(1 - r2), limb = 0.3 + 0.7 * mu;                         // (limb darkening)
      let s = limb * (0.94 + 0.06 * (hash2(x >> 1, y >> 1) - 0.5) * 2 * (0.6 + 0.4 * hash2(x >> 3, y >> 3)));
      for (const [sx, sy, sr] of LB_SPOTS) { const dd = Math.hypot(u - sx, -v - sy) / sr; if (dd < 1) s *= dd < 0.45 ? 0.12 : 0.12 + 0.6 * MathX.smooth(dd, 0.45, 1.0); }
      D[i] = 255 * MathX.clamp(s, 0, 1); D[i + 1] = 255 * MathX.clamp(s * 0.97, 0, 1); D[i + 2] = 255 * MathX.clamp(s * 0.92, 0, 1); D[i + 3] = 255 * MathX.smooth(-Math.sqrt(r2), -1, -0.99);
    }
    c.putImageData(im, 0, 0);
  }), { repeat: false });
}

class LbSky {
  // o = { F, X, az0, r (dome radius), stars: bool, moon: bool, second: bool (the second Sun visible here), town: glow }
  constructor(scene, o) {
    this.o = o; const F = o.F, az0 = o.az0, R = this.R = o.r || 2600;
    const g = this.g = new THREE.Group(); scene.add(g);
    // ---- the stars (two copies each)
    const T = this.table = lbStarTable(o.X);
    const pos = [], col = [], mag = [], on = [], off = [], seed = [];
    this.named = {};
    for (const st of T) {
      const real = lbLocal(st.d, F, az0), mir = lbSc(real, -1), c = lbStarRGB(st.T), sd = hash1(pos.length * 31 + 7);
      if (st.name) this.named[st.name] = { real, mir, t: st.t, m: st.m };
      if (real[1] > -0.06) { pos.push(real[0] * R, real[1] * R, real[2] * R); col.push(...c); mag.push(st.m); on.push(-1e9); off.push(0); seed.push(sd); }
      if (mir[1] > -0.06 && isFinite(st.t)) { pos.push(mir[0] * R, mir[1] * R, mir[2] * R); col.push(...c); mag.push(st.m); on.push(st.t); off.push(1e9); seed.push(sd); }
    }
    // (how many mirror images are up, brighter than magnitude 5, by time t: the readout's count)
    this.mirTimes = T.filter((s) => s.m < 5 && lbLocal(s.d, F, az0)[1] < -0.035 && isFinite(s.t)).map((s) => s.t).sort((a, b) => a - b);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aMag', new THREE.Float32BufferAttribute(mag, 1)); geo.setAttribute('aOn', new THREE.Float32BufferAttribute(on, 1));
    geo.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 1)); geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    this.starU = { uS: { value: 0 }, uT: { value: 0 }, uPx: { value: 1 }, uK: { value: 1 }, uLim: { value: 6.0 }, uSize: { value: 1 } };
    this.stars = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: this.starU, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec3 aCol; attribute float aMag, aOn, aOff, aSeed;
        uniform float uS, uT, uPx, uK, uLim, uSize;
        varying vec3 vC; varying float vA;
        void main() {
          float vis = smoothstep(aOn, aOn + 0.35, uS) * (1.0 - step(aOff, uS));
          vec3 d = normalize(position); float alt = asin(clamp(d.y, -1.0, 1.0));
          float ext = 0.25 / max(0.07, sin(max(alt, 0.0) + 0.04));
          float tw = 0.2 * sin(uT * (5.0 + 9.0 * aSeed) + aSeed * 80.0) * smoothstep(0.7, 0.05, alt);
          float m = aMag + ext + tw, I = pow(10.0, -0.4 * (m - 1.0));
          vA = vis * uK * smoothstep(uLim + 0.4, uLim - 0.9, m) * smoothstep(-0.02, 0.03, d.y);
          vC = aCol * clamp(0.06 + 1.05 * pow(I, 0.45), 0.0, 3.2);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uPx * uSize * clamp(2.2 + 3.4 * pow(I, 0.3), 2.1, 15.0);
          if (vA < 0.003) gl_PointSize = 0.0;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vC; varying float vA;
        void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
          float a = (exp(-r * 3.4) * 0.8 + exp(-r * 14.0) * 0.6) * vA; gl_FragColor = vec4(vC * a, a); }`,
    }));
    this.stars.frustumCulled = false; this.stars.renderOrder = -8; g.add(this.stars);
    // ---- the dome
    const tmap = lbTimeMap(F, o.X, az0, !!o.second);
    const toEq = new THREE.Matrix3();
    { const ex = lbUnLocal([1, 0, 0], F, az0), ey = lbUnLocal([0, 1, 0], F, az0), ez = lbUnLocal([0, 0, 1], F, az0); toEq.set(ex[0], ey[0], ez[0], ex[1], ey[1], ez[1], ex[2], ey[2], ez[2]); }
    this.domeU = {
      uS: { value: 0 }, uMap: { value: tmap }, uToEq: { value: toEq }, uPole: { value: new THREE.Vector3(...LB_GAL.pole) }, uCen: { value: new THREE.Vector3(...LB_GAL.centre) },
      uL1: { value: new THREE.Vector3(0, -1, 0) }, uK1: { value: 0 }, uL2: { value: new THREE.Vector3(0, 1, 0) }, uK2: { value: 0 }, uGate2: { value: o.second ? 1 : 0 },
      uNight: { value: new THREE.Color('#05070f') }, uNightHor: { value: new THREE.Color('#1c1e26') }, uTown: { value: new THREE.Color(o.town || '#3a2c22') }, uNightK: { value: 1 },
      uMw: { value: 1 }, uGlow: { value: 1 }, uK: { value: 1 }, uGround: { value: new THREE.Color('#050505') }, uBlackDay: { value: 0 },
    };
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 64, 32), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.domeU,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform sampler2D uMap; uniform mat3 uToEq; uniform vec3 uPole, uCen, uL1, uL2, uNight, uNightHor, uTown, uGround;
        uniform float uS, uK1, uK2, uGate2, uNightK, uMw, uGlow, uK, uBlackDay; varying vec3 vD;
        float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
        float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= 0.5; } return s; }
        // the daylight one sun gives a direction d (its light everywhere in the air)
        vec3 sky(vec3 d, vec3 L) {
          float h = L.y, e = max(d.y, 0.0), day = smoothstep(-0.2, 0.1, h);
          vec3 zen = mix(vec3(0.025, 0.04, 0.1), vec3(0.15, 0.34, 0.76), smoothstep(-0.12, 0.35, h));
          vec3 hor = mix(vec3(0.62, 0.36, 0.2), vec3(0.72, 0.82, 0.93), smoothstep(-0.03, 0.3, h));
          vec3 col = mix(hor, zen, pow(smoothstep(0.0, 1.0, e), 0.5));
          float c = max(dot(d, L), 0.0);
          vec3 sc = mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.95, 0.88), smoothstep(-0.02, 0.25, h));
          col += sc * (0.3 * pow(c, 6.0) + 0.9 * pow(c, 64.0)) * smoothstep(-0.12, 0.04, h);
          vec2 dh = normalize(vec2(d.x, d.z) + 1e-5), lh = normalize(vec2(L.x, L.z) + 1e-5);
          col += vec3(1.0, 0.48, 0.2) * pow(max(dot(dh, lh), 0.0), 3.0) * exp(-e * 7.0) * (1.0 - smoothstep(0.0, 0.25, h)) * smoothstep(-0.2, -0.02, h) * 0.9;
          return col * day;
        }
        float band(vec3 q) { float b = dot(q, uPole), c = max(dot(q, uCen), -1.0);
          float w = exp(-b * b / 0.012) * (0.55 + 0.45 * smoothstep(-0.3, 1.0, c)) + 0.3 * exp(-b * b / 0.06) * (0.4 + 0.6 * smoothstep(0.2, 1.0, c));
          float cl = fbm(q * 7.0) * 0.8 + fbm(q * 23.0) * 0.4, lane = smoothstep(0.42, 0.75, fbm(q * 11.0 + 3.1)) * exp(-b * b / 0.004);
          return w * (0.3 + 0.9 * cl) * (1.0 - 0.7 * lane); }
        void main() {
          vec3 d = normalize(vD); float e = d.y;
          vec2 uv = vec2(atan(d.x, -d.z) / 6.2831853 + 0.5, clamp((asin(clamp(e, -1.0, 1.0)) * 57.29578 + 10.0) / 100.0, 0.0, 1.0));
          vec4 T = texture2D(uMap, uv);
          // the night: dark blue overhead, the town's glow low down
          vec3 col = (mix(uNightHor, uNight, smoothstep(0.0, 0.5, e)) + uTown * exp(-max(e, 0.0) * 10.0)) * uNightK;
          // the Milky Way: its real band until 10:00, its mirror image where that has come back
          vec3 q = normalize(uToEq * d);
          float mw = uS < 0.0 ? band(q) : band(-q) * smoothstep(T.b, T.b + 0.6, uS);
          col += vec3(0.62, 0.64, 0.7) * 0.05 * mw * uMw * smoothstep(-0.02, 0.25, e);
          // the glow: far, high air lit before the second Sun gets here (thin air: faint, like deep twilight)
          float gl = smoothstep(T.r - 1.5, T.r + 9.0, uS) * (1.0 - smoothstep(T.g - 1.0, T.g + 1.0, uS)) * uGate2;
          col += vec3(0.1, 0.2, 0.36) * 0.38 * gl * uGlow * (0.4 + 0.6 * exp(-max(e, 0.0) * 3.0)) * uK2;
          // the daylight of each sun (the second one only where its light has got to the air)
          col += sky(d, uL1) * uK1;
          col += sky(d, uL2) * uK2 * mix(1.0, smoothstep(T.g - 0.8, T.g + 0.8, uS), uGate2);
          if (e < 0.0) col = mix(col, uGround, smoothstep(0.0, -0.05, e));
          gl_FragColor = vec4(col * uK, 1.0);
        }`,
    }));
    this.dome.renderOrder = -10; this.dome.frustumCulled = false; g.add(this.dome);
    // ---- the suns: sprites (additive), drawn as discs with a glow
    const sunMat = (face) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uFace: { value: face }, uK: { value: 1 }, uR: { value: 1 }, uFrac: { value: 1 }, uEdge: { value: new THREE.Vector2(1, 0) }, uRed: { value: 0 }, uCol: { value: new THREE.Color(1, 0.97, 0.92) }, uGlow: { value: 1 }, uFace2: { value: 0 } },
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy * 2.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform sampler2D uFace; uniform float uK, uR, uFrac, uRed, uGlow, uFace2; uniform vec2 uEdge; uniform vec3 uCol; varying vec2 vQ;
        void main() {
          vec2 q = vQ * 8.0;                                   // (the quad is 16 sun-radii across: the disc is radius 1)
          float r = length(q);
          float disc = smoothstep(1.03, 0.97, r) * smoothstep(uR + 0.03, uR - 0.03, r);
          float cut = step(1.0 - 2.0 * uFrac, dot(q, uEdge));  // (the part of the disc that has arrived, from one edge)
          vec2 fq = q * 0.5 + 0.5;
          vec3 face = mix(vec3(0.3 + 0.7 * sqrt(max(0.0, 1.0 - r * r))), texture2D(uFace, fq).rgb, uFace2);
          vec3 c = uCol * face * disc * cut * 6.0 * uK;
          // the glow round it (falls off fast; the bloom does the rest), and the red glow before it rises
          float lit = max(uFrac * uR, 0.0);
          c += uCol * (0.5 * exp(-max(r - 1.0, 0.0) * 1.6) + 0.18 * exp(-max(r - 1.0, 0.0) * 0.35)) * step(1.0, r) * uK * uGlow * lit;
          c += vec3(1.0, 0.25, 0.08) * uRed * (0.9 * exp(-r * r * 0.25) + 0.25 * exp(-r * 0.4));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.sun1 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sunMat(lbSunFace(false))); this.sun1.renderOrder = -6; this.sun1.frustumCulled = false; g.add(this.sun1);
    this.sun2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sunMat(lbSunFace(true))); this.sun2.renderOrder = -6; this.sun2.frustumCulled = false; g.add(this.sun2);
    // ---- the Moon (where asked)
    if (o.moon) {
      this.moonU = { uMap: { value: lbMoonMap(F, az0) }, uFace: { value: lbMoonFace() }, uS: { value: 0 }, uDay: { value: 1 }, uK: { value: 1 }, uEarth: { value: 0.012 } };
      this.moon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: this.moonU,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: /* glsl */`
          uniform sampler2D uMap, uFace; uniform float uS, uDay, uK, uEarth; varying vec2 vUv;
          void main() {
            vec4 m = texture2D(uMap, vUv); if (m.a <= 0.0) discard;
            float mu = m.a, nl = m.b, b;
            // (Lommel–Seeliger: a dusty surface looks evenly bright right up to its terminator)
            if (m.g > 0.5) { float mu0 = max(nl, 0.0); b = (uS < 0.0 ? 1.0 : uDay) * 2.0 * mu0 / (mu0 + mu) ; }
            else { float mu0 = max(-nl, 0.0); b = smoothstep(m.r, m.r + 0.25, uS) * 2.0 * mu0 / (mu0 + mu) + (uS < 0.0 ? uEarth : 0.0); }
            vec3 face = texture2D(uFace, vUv).rgb;
            float edge = smoothstep(0.0, 0.03, mu);
            gl_FragColor = vec4(vec3(1.0, 0.98, 0.94) * face * b * uK * edge, 1.0);
          }`,
      }));
      this.moon.renderOrder = -7; this.moon.frustumCulled = false; g.add(this.moon);
      this.moonDir = new THREE.Vector3(...lbLocal(LB_SKY.M, F, az0));
    }
    this.state = {};
  }
  // where a named thing is, d metres from the camera ('MOON', 'SUN2', a star's name; mir: its mirror image)
  at(name, d = 400, mir = true) {
    let v;
    if (name === 'MOON') v = this.moonDir.toArray();
    else if (name === 'SUN2') v = this.state.L2 || [0, 1, 0];
    else if (name === 'SUN') v = this.state.L1 || [0, 1, 0];
    else { const st = this.named[name]; v = mir ? st.mir : st.real; }
    const p = this.g.position;
    return [p.x + v[0] * d, p.y + v[1] * d, p.z + v[2] * d];
  }
  // how many mirror images (brighter than magnitude 5) are up by story time s
  mirrored(s) { const A = this.mirTimes; let lo = 0, hi = A.length; while (lo < hi) { const m = (lo + hi) >> 1; if (A[m] <= s) lo = m + 1; else hi = m; } return lo; }
  // s: story time; cam; o: { skyS (the stars' / Moon's clock: default s), t (twinkle), sunS (where the suns are: default s),
  //   F (this place's frame at sunS), k, lens (a long lens: the discs are drawn at least this many pixels), black (Hawaii's
  //   dark noon), sun1 { k, r, on, col }, starK }
  update(s, cam, renderH, o = {}) {
    this.g.position.copy(cam.position);
    const R = this.R, px = renderH / 1080, az0 = this.o.az0, skyS = o.skyS ?? s;
    const Fs = o.F || this.o.F;
    const S = lbSunDir(o.sunS ?? s), L1 = lbLocal(S, Fs, az0), L2 = lbSc(L1, -1);
    this.state.L1 = L1; this.state.L2 = L2;
    // the real Sun as seen here: out from 10:00:00 until its new light arrives
    const sun = o.sun1 || lbSunSeen(o.sunS ?? s);
    const day1 = MathX.smooth(L1[1], -0.2, 0.1), day2 = MathX.smooth(L2[1], -0.2, 0.1);
    // the second Sun: on once this place gets its light (the garden: LB_SKY.on); before that, from 1.6 s ahead, the
    // red light that grazed the old Earth's air; then the disc, from one edge, in 0.75 s
    const on = this.o.second ? (o.on ?? LB_SKY.on) : Infinity, ds = skyS - on;
    const frac = this.o.second ? MathX.clamp(ds / 0.75, 0, 1) : 0, red = this.o.second ? MathX.smooth(ds, -1.8, -0.1) * (1 - MathX.smooth(ds, 0.2, 1.2)) : 0;
    const k2 = this.o.second ? MathX.smooth(ds, -0.3, 0.8) : 0;
    const k1 = sun.on ? sun.k * sun.r * sun.r : 0;
    const D = this.domeU;
    D.uS.value = skyS; D.uL1.value.set(...L1); D.uL2.value.set(...L2); D.uK1.value = k1 * (o.sky1 ?? 1); D.uK2.value = k2 * (o.sky2 ?? 1);
    D.uK.value = o.k ?? 1; D.uNightK.value = o.nightK ?? 1; D.uMw.value = o.mw ?? 1; D.uGlow.value = o.glow ?? 1;
    // the suns' discs
    const place = (mesh, L, rad) => { mesh.position.set(L[0] * R * 0.97, L[1] * R * 0.97, L[2] * R * 0.97); mesh.lookAt(cam.position.x - this.g.position.x, cam.position.y - this.g.position.y, cam.position.z - this.g.position.z);
      const ang = 0.2665 * LB_D2R, sz = Math.max(2 * R * 0.97 * Math.tan(ang), R * 0.97 * (o.lens || 0) * 0.0009) * 8; mesh.scale.setScalar(sz * (rad || 1)); };
    place(this.sun1, L1); place(this.sun2, L2);
    const U1 = this.sun1.material.uniforms, U2 = this.sun2.material.uniforms;
    U1.uK.value = k1 > 0 ? sun.k * (o.discK ?? 1) : 0; U1.uR.value = sun.r; U1.uFrac.value = 1; U1.uRed.value = 0; U1.uFace2.value = o.face1 ?? 0;
    // (a hotter Sun is whiter: 5,772 K → 6,864 K as its surface doubles its output)
    { const Tk = 5772 * Math.pow(Math.max(1, sun.k), 0.25), c = lbStarRGB(Tk); U1.uCol.value.setRGB(c[0], c[1], c[2]); }
    U2.uK.value = frac > 0 ? (o.discK ?? 1) : 0; U2.uR.value = 1; U2.uFrac.value = frac; U2.uRed.value = red * 0.9; U2.uFace2.value = o.face2 ?? 0;
    // (the disc arrives from the side away from where the old Earth's limb was: −e, seen in the sprite's own axes)
    if (this.o.second) { const x = lbNrm(lbCross(L2, [0, 1, 0])), y = lbNrm(lbAdd([0, 1, 0], L2, -L2[1])), e = lbLocal(LB_SKY.edge, Fs, az0);
      U2.uEdge.value.set(-lbDot(e, x), -lbDot(e, y)).normalize(); }
    this.sun1.visible = (k1 > 0) && L1[1] > -0.05; this.sun2.visible = (frac > 0 || red > 0) && L2[1] > -0.05;
    // the stars: drowned by the daylight
    const lum = 0.7 * (k1 * day1 + k2 * day2);
    const U = this.starU; U.uS.value = skyS; U.uT.value = o.t ?? 0; U.uPx.value = px; U.uSize.value = o.starSize ?? 1;
    U.uK.value = (o.starK ?? 1) * MathX.clamp(1 - lum * 30, 0, 1); U.uLim.value = 6.0 - 4 * MathX.clamp(lum * 6, 0, 1);
    // the Moon
    if (this.moon) {
      const md = this.moonDir, Rm = R * 0.96;
      this.moon.position.set(md.x * Rm, md.y * Rm, md.z * Rm);
      this.moon.lookAt(cam.position.x - this.g.position.x, cam.position.y - this.g.position.y, cam.position.z - this.g.position.z);
      this.moon.scale.setScalar(Math.max(2 * Rm * Math.tan(0.259 * LB_D2R), Rm * (o.lens || 0) * 0.0009));
      this.moonU.uS.value = skyS; this.moonU.uDay.value = lbSunGain(skyS - LB_MOON.dayBack); this.moonU.uK.value = (o.moonK ?? 1) * 1.15;
    }
    this.state = Object.assign(this.state, { k1, k2, frac, red, lum, day1, day2, sun });
    return this.state;
  }
}
