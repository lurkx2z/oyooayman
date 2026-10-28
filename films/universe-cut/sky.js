/* =====================================================================
   SKY — the sky over your garden, drawn from physics.js, a pure function of story time s:
     · the stars: 130 named bright stars at their real places, 8,000 fainter ones (seeded, crowding to the Milky Way)
       and, for the long lens, a dense field of very faint ones round the Moon. Each one beyond the cut goes out at its
       own moment (hvStarGone: 7.3 ms / sin β, β its angle past the line), so the dark half appears at once and then
       creeps the last fraction of a degree up to the line over a few seconds
     · the Moon: a disc whose every point has its own moment (baked once from hvMoonPoint): its far half wipes away
       from the far limb, 0.67 s to 1.20 s after 10:00:00. Later a dull orange glow along its straight edge: its hot
       insides blowing out of the cut face (seen almost edge-on from here: the face itself faces away from you)
     · the dome: the night (dark blue, the town's glow low down), the Milky Way; beyond the cut the starlight part of
       the night sky goes too (the air's own glow and the town's light are here, on this side, and stay)
     · an optional line along the cut (a drawn guide, labelled as one), dashed
   Frames: stars, the dome and the cut live in the equatorial frame inside a group turned into the garden's frame at
   story time s (the sky turns 0.9° in the film's four minutes). The garden: y up, −z down the garden (azimuth HVP.az0).
   ===================================================================== */

function hvLocal(v, F, az0 = HVP.az0) {
  const u = hvDot(v, F.up), n = hvDot(v, F.north), e = hvDot(v, F.east), a = az0 * HV_D2R;
  return [e * Math.cos(a) - n * Math.sin(a), u, -(n * Math.cos(a) + e * Math.sin(a))];
}
function hvUnLocal(g, F, az0 = HVP.az0) {
  const a = az0 * HV_D2R, e = g[0] * Math.cos(a) - g[2] * Math.sin(a), n = -g[2] * Math.cos(a) - g[0] * Math.sin(a), u = g[1];
  return hvAdd(hvAdd(hvSc(F.east, e), F.north, n), F.up, u);
}
// equatorial → garden, as a rotation matrix (columns: where the equatorial axes point in the garden)
function hvEqMatrix(F, m = new THREE.Matrix4()) {
  const a = hvLocal([1, 0, 0], F), b = hvLocal([0, 1, 0], F), c = hvLocal([0, 0, 1], F);
  return m.set(a[0], b[0], c[0], 0, a[1], b[1], c[1], 0, a[2], b[2], c[2], 0, 0, 0, 0, 1);
}
// a star's colour from its temperature (linear RGB, max 1)
function hvStarRGB(T) {
  const K = [[3000, [1.0, 0.56, 0.32]], [4000, [1.0, 0.74, 0.52]], [5000, [1.0, 0.87, 0.74]], [6000, [1.0, 0.96, 0.92]], [7500, [0.92, 0.94, 1.0]], [10000, [0.8, 0.86, 1.0]], [20000, [0.68, 0.77, 1.0]], [40000, [0.62, 0.72, 1.0]]];
  if (T <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (T <= K[i][0]) { const u = (T - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return K[i - 1][1].map((x, k) => x + (K[i][1][k] - x) * u); }
  return K[K.length - 1][1];
}
// the Moon tonight as seen from the garden: its direction, angular radius, and the bake's axes (in the garden frame at
// 10:00:00: right = m × up, up' = −m × right, as Object3D.lookAt orients a quad facing the camera)
const HV_MOON = (() => {
  const F = HV_CUT.F, m = hvLocal(HV_CUT.Mdir, F), right = hvNrm(hvCross(m, [0, 1, 0])), up = hvCross(hvSc(m, -1), right);
  const nL = hvLocal(HVP.n, F), e2 = hvNrm([hvDot(nL, right), hvDot(nL, up), 0]);       // towards the half that stays, on the disc
  return { m, right, up, e2: [e2[0], e2[1]], rad: Math.asin(HVP.Rmoon / HV_CUT.L), t0: Infinity, t1: 0 };
})();
// the Moon's map: for each point of the disc, its moment (−1: it stays), how it is lit (n·Sun), and mu (towards you)
function hvMoonMap(N = 192) {
  const { m, right, up } = HV_MOON, F = HV_CUT.F, S = hvSunDir(0), d = new Float32Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N * 2 - 1, v = (j + 0.5) / N * 2 - 1, w2 = 1 - u * u - v * v, k = (j * N + i) * 4;
    if (w2 <= 0) continue;
    const ng = hvAdd(hvAdd(hvSc(right, u), up, v), m, -Math.sqrt(w2)), n = hvUnLocal(ng, F), p = hvMoonPoint(n);
    d[k] = p.keep ? -1 : p.t; d[k + 1] = hvDot(n, S); d[k + 2] = 0; d[k + 3] = Math.sqrt(w2);
    if (!p.keep) { HV_MOON.t0 = Math.min(HV_MOON.t0, p.t); HV_MOON.t1 = Math.max(HV_MOON.t1, p.t); }
  }
  const tex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
  return tex;
}
// the Moon's face (maria, a few bright craters)
function hvMoonFace() {
  return hvTex(hvCanvas(256, 256, (c, w) => {
    const im = c.createImageData(w, w), D = im.data;
    const maria = [[0.38, 0.36, 0.17], [0.6, 0.32, 0.13], [0.55, 0.55, 0.15], [0.33, 0.62, 0.1], [0.68, 0.6, 0.09], [0.45, 0.47, 0.08], [0.24, 0.45, 0.07]];
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      let s = 0.92 + 0.1 * (hash2(x >> 2, y >> 2) - 0.5) + 0.05 * (hash2(x, y) - 0.5);
      for (const [mx, my, mr] of maria) { const dd = Math.hypot((x / w) - mx, (y / w) - my); s -= 0.3 * MathX.smooth(-dd, -mr, -mr * 0.55); }
      const i = (y * w + x) * 4; D[i] = D[i + 1] = D[i + 2] = 255 * MathX.clamp(s, 0, 1); D[i + 3] = 255;
    }
    c.putImageData(im, 0, 0);
    c.globalCompositeOperation = 'lighter';
    for (const [cx, cy, r] of [[0.46, 0.82, 0.03], [0.3, 0.3, 0.015], [0.7, 0.42, 0.012]]) { const g = c.createRadialGradient(cx * w, cy * w, 0, cx * w, cy * w, r * w * 4); g.addColorStop(0, 'rgba(60,60,60,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }
  }), { repeat: false });
}
// a bright Moon's glow (the disc is the middle seventh of the sprite)
function hvMoonGlowTex() {
  return hvTex(hvCanvas(256, 256, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    for (const [u, a] of [[0, 0.9], [0.14, 0.6], [0.2, 0.25], [0.3, 0.1], [0.5, 0.03], [0.75, 0.008], [1, 0]]) gr.addColorStop(u, `rgba(255,255,255,${a})`);
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  }), { repeat: false });
}
// the very faint stars round the Moon (for the long lens and the telescope): magnitude 6.5 to 10, seeded
function hvMoonField(n = 900, seed = 20261029) {
  const r = new RNG(seed), M = HV_CUT.Mdir, a = hvNrm(hvCross(M, [0, 0, 1])), b = hvCross(M, a), out = [];
  for (let i = 0; i < n; i++) {
    const rr = 3.2 * HV_D2R * Math.sqrt(r.next()), th = r.next() * 6.2832, v = hvNrm(hvAdd(hvAdd(M, a, rr * Math.cos(th)), b, rr * Math.sin(th)));
    out.push([null, v, 6.5 + 3.5 * Math.pow(r.next(), 0.6), r.range(3500, 11000)]);
  }
  return out.map(([name, d, m, T]) => ({ name, d, m, T, t: hvStarGone(d), field: 1 }));
}

class HvSky {
  // o = { r (dome radius), town: glow colour }
  constructor(scene, o = {}) {
    this.o = o; const R = this.R = o.r || 2600;
    const g = this.g = new THREE.Group(); scene.add(g);          // (the garden frame: follows the camera)
    const eq = this.eq = new THREE.Group(); eq.matrixAutoUpdate = false; g.add(eq);   // (inside it, the equatorial frame)
    // ---- the stars
    const T = this.table = hvStarTable().concat(hvMoonField());
    const pos = [], col = [], mag = [], off = [], seed = [], fld = [];
    this.named = {};
    for (const st of T) {
      const c = hvStarRGB(st.T), sd = hash1(pos.length * 31 + 7);
      if (st.name) this.named[st.name] = st;
      pos.push(st.d[0] * R, st.d[1] * R, st.d[2] * R); col.push(...c); mag.push(st.m); off.push(isFinite(st.t) ? st.t : 1e9); seed.push(sd); fld.push(st.field || 0);
    }
    // (how many stars you can see (brighter than magnitude 6) are up in your sky at 10:00, and when each one beyond the cut goes)
    const F0 = HV_CUT.F;
    const up5 = T.filter((s) => !s.field && !s.planet && s.m < 6 && hvDot(s.d, F0.up) > 0.035);
    this.count0 = up5.length; this.goneTimes = up5.filter((s) => isFinite(s.t)).map((s) => s.t).sort((a, b) => a - b);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aMag', new THREE.Float32BufferAttribute(mag, 1)); geo.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 1));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1)); geo.setAttribute('aField', new THREE.Float32BufferAttribute(fld, 1));
    this.starU = { uS: { value: 0 }, uT: { value: 0 }, uPx: { value: 1 }, uK: { value: 1 }, uLim: { value: 6.0 }, uSize: { value: 1 }, uUp: { value: new THREE.Vector3(0, 0, 1) }, uField: { value: 0 } };
    this.stars = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: this.starU, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec3 aCol; attribute float aMag, aOff, aSeed, aField;
        uniform float uS, uT, uPx, uK, uLim, uSize, uField; uniform vec3 uUp;
        varying vec3 vC; varying float vA;
        void main() {
          float vis = 1.0 - step(aOff, uS);
          vec3 d = normalize(position); float sa = dot(d, uUp), alt = asin(clamp(sa, -1.0, 1.0));
          float ext = 0.25 / max(0.07, sin(max(alt, 0.0) + 0.04));
          float tw = 0.2 * sin(uT * (5.0 + 9.0 * aSeed) + aSeed * 80.0) * smoothstep(0.7, 0.05, alt);
          float m = aMag + ext + tw, I = pow(10.0, -0.4 * (m - 1.0));
          // (the faint field round the Moon only through the long lens: uLim is raised there)
          vA = vis * uK * smoothstep(uLim + 0.4, uLim - 0.9, m) * smoothstep(-0.02, 0.03, sa) * mix(1.0, uField, aField);
          vC = aCol * clamp(0.06 + 1.05 * pow(I, 0.45), 0.0, 3.2);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uPx * uSize * clamp(2.6 + 7.0 * pow(I, 0.4), 2.3, 36.0);
          if (vA < 0.003) gl_PointSize = 0.0;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vC; varying float vA;
        void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
          float a = (exp(-r * 6.0) * 0.85 + exp(-r * 22.0) * 0.6 + exp(-r * 2.2) * 0.12) * vA; gl_FragColor = vec4(vC * a, a); }`,
    }));
    this.stars.frustumCulled = false; this.stars.renderOrder = -8; eq.add(this.stars);
    // ---- the dome (equatorial frame: its altitude from uUp)
    const n = HVP.n, b1 = hvNrm(hvCross(n, [0, 0, 1])), b2 = hvCross(n, b1);
    this.domeU = {
      uS: { value: 0 }, uUp: { value: new THREE.Vector3(0, 0, 1) }, uPole: { value: new THREE.Vector3(...HV_GAL.pole) }, uCen: { value: new THREE.Vector3(...HV_GAL.centre) },
      uN: { value: new THREE.Vector3(...n) }, uB1: { value: new THREE.Vector3(...b1) }, uB2: { value: new THREE.Vector3(...b2) }, uTd: { value: HV_CUT.d / HVP.c },
      uNight: { value: new THREE.Color('#05070f') }, uNightHor: { value: new THREE.Color('#1c1e26') }, uTown: { value: new THREE.Color(o.town || '#3a2c22') },
      uMw: { value: 1 }, uK: { value: 1 }, uGround: { value: new THREE.Color('#050505') }, uVoid: { value: 0.6 },
      uLine: { value: 0 }, uLineW: { value: 0.002 }, uLineCol: { value: new THREE.Color('#ffcf8a') },
    };
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 96, 48), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.domeU,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform vec3 uUp, uPole, uCen, uN, uB1, uB2, uNight, uNightHor, uTown, uGround, uLineCol;
        uniform float uS, uTd, uMw, uK, uVoid, uLine, uLineW; varying vec3 vD;
        float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
        float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= 0.5; } return s; }
        float band(vec3 q) { float b = dot(q, uPole), c = max(dot(q, uCen), -1.0);
          float w = exp(-b * b / 0.012) * (0.55 + 0.45 * smoothstep(-0.3, 1.0, c)) + 0.15 * exp(-b * b / 0.06) * (0.4 + 0.6 * smoothstep(0.2, 1.0, c));
          float cl = fbm(q * 7.0) * 0.7 + fbm(q * 23.0) * 0.4 + fbm(q * 61.0) * 0.35, lane = smoothstep(0.45, 0.8, fbm(q * vec3(11.0, 15.0, 13.0) + 3.1)) * exp(-b * b / 0.004);
          return w * (0.25 + 0.9 * cl) * (1.0 - 0.5 * lane); }
        void main() {
          vec3 q = normalize(vD); float e = dot(q, uUp);
          // beyond the cut: gone once the last of its light has reached you (d / (c · sin β))
          float k = -dot(q, uN), gone = k > 0.0 ? step(uTd / max(k, 1e-6), uS) : 0.0;
          // the night: dark blue overhead (the air's own glow and the starlight it scatters), the town's glow low down
          vec3 night = mix(uNightHor, uNight, smoothstep(0.0, 0.5, e)) * (1.0 - uVoid * gone);
          vec3 col = night + uTown * exp(-max(e, 0.0) * 10.0);
          col += vec3(0.62, 0.64, 0.7) * 0.05 * band(q) * uMw * smoothstep(-0.02, 0.25, e) * (1.0 - gone);
          // the drawn line along the cut (dashed)
          if (uLine > 0.0) { float a = atan(dot(q, uB2), dot(q, uB1)), dash = step(0.42, fract(a * 57.29578 / 2.4));
            col += uLineCol * uLine * dash * (1.0 - smoothstep(uLineW * 0.5, uLineW, abs(dot(q, uN)))) * 0.9; }
          if (e < 0.0) col = mix(col, uGround, smoothstep(0.0, -0.05, e));
          gl_FragColor = vec4(col * uK, 1.0);
        }`,
    }));
    this.dome.renderOrder = -10; this.dome.frustumCulled = false; eq.add(this.dome);
    // ---- the Moon (garden frame), with the glow of its hot insides beyond the straight edge
    this.moonU = { uMap: { value: hvMoonMap() }, uFace: { value: hvMoonFace() }, uS: { value: 0 }, uK: { value: 1 }, uEarth: { value: 0.012 },
      uE2: { value: new THREE.Vector2(...HV_MOON.e2) }, uPlume: { value: 0 }, uH: { value: 0.03 }, uT: { value: 0 }, uQ: { value: 2.2 } };
    this.moon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: this.moonU,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform sampler2D uMap, uFace; uniform float uS, uK, uEarth, uPlume, uH, uT, uQ; uniform vec2 uE2; varying vec2 vUv;
        float h2(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
        void main() {
          vec2 q = (vUv * 2.0 - 1.0) * uQ;                 // (moon radii; the quad is uQ radii each way)
          vec3 col = vec3(0.0);
          float r = length(q);
          if (r < 1.0) {
            vec4 m = texture2D(uMap, q * 0.5 + 0.5);
            float mu = m.a, mu0 = max(m.g, 0.0);
            float here = m.r < 0.0 ? 1.0 : 1.0 - step(m.r, uS);
            // (Lommel–Seeliger: a dusty surface looks evenly bright right up to its terminator)
            float b = 2.0 * mu0 / (mu0 + mu + 1e-4) + uEarth;
            col = vec3(1.0, 0.98, 0.94) * texture2D(uFace, q * 0.5 + 0.5).rgb * b * uK * smoothstep(0.0, 0.03, mu) * here;
          }
          // its insides blowing out of the cut face: beyond the straight edge, hottest where the core was
          if (uPlume > 0.0) {
            vec2 p2 = vec2(-uE2.y, uE2.x);
            float across = -dot(q, uE2), along = dot(q, p2);                // (+: beyond the straight edge, away from the half that stays)
            float core = exp(-along * along / 0.12) * 0.75 + exp(-along * along / 0.4) * 0.35;
            float fl = n2(vec2(along * 9.0, across / max(uH, 0.01) * 1.6 - uT * 0.25)) * 0.6 + n2(vec2(along * 23.0, across / max(uH, 0.01) * 3.0 - uT * 0.5)) * 0.4;
            float sheet = exp(-max(across, 0.0) / max(uH, 1e-3)) * smoothstep(-0.015, 0.004, across) * step(abs(along), 1.0) * sqrt(max(1.0 - along * along, 0.0));
            float halo = exp(-max(across, 0.0) / max(3.0 * uH, 1e-3)) * smoothstep(-0.01, 0.01, across) * step(abs(along), 1.0) * sqrt(max(1.0 - along * along, 0.0)) * 0.22;
            float g = (sheet * (0.55 + 0.9 * fl) + halo) * core;
            col += vec3(1.0, 0.42, 0.1) * g * uPlume * uK * 2.2 + vec3(1.0, 0.75, 0.4) * g * g * uPlume * uK * 1.2;
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    this.moon.renderOrder = -7; this.moon.frustumCulled = false; g.add(this.moon);
    this.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: hvMoonGlowTex(), color: '#c8d4ea', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.moonGlow.renderOrder = -7; this.moonGlow.frustumCulled = false; g.add(this.moonGlow);
    this.moonDir = new THREE.Vector3(...HV_MOON.m);
    this._M = new THREE.Matrix4();
    this.state = {};
  }
  // where a named thing is, d metres from the camera ('MOON', a star's name)
  at(name, d = 400) {
    const v = name === 'MOON' ? this.moonDir.toArray() : hvLocal(this.named[name].d, this._F || HV_CUT.F);
    const p = this.g.position;
    return [p.x + v[0] * d, p.y + v[1] * d, p.z + v[2] * d];
  }
  // a point on the cut line in the sky, at angle a (degrees, round the line) — for labels
  lineAt(a, d = 400) {
    const U = this.domeU, q = hvAdd(hvSc(U.uB1.value.toArray(), Math.cos(a * HV_D2R)), U.uB2.value.toArray(), Math.sin(a * HV_D2R)), v = hvLocal(q, this._F || HV_CUT.F), p = this.g.position;
    return [p.x + v[0] * d, p.y + v[1] * d, p.z + v[2] * d];
  }
  // stars you can see (brighter than magnitude 6) left in your sky by story time s (of this.count0 at 10:00)
  starsLeft(s) { const A = this.goneTimes; let lo = 0, hi = A.length; while (lo < hi) { const m = (lo + hi) >> 1; if (A[m] <= s) lo = m + 1; else hi = m; } return this.count0 - lo; }
  // s: story time; cam; o: { skyS (the stars' / Moon's clock: default s), t (twinkle), k, lens (a long lens: the Moon drawn at
  //   least this many pixels-ish), starK, starSize, mw, moonK, field (the faint field round the Moon), lim, line, plume }
  update(s, cam, renderH, o = {}) {
    this.g.position.copy(cam.position);
    const R = this.R, px = renderH / 1080, skyS = o.skyS ?? s;
    const F = this._F = hvFrame(Math.max(-600, Math.min(600, skyS)));
    hvEqMatrix(F, this._M); this.eq.matrix.copy(this._M); this.eq.matrixWorldNeedsUpdate = true;
    const D = this.domeU;
    D.uS.value = skyS; D.uUp.value.set(...F.up); D.uK.value = o.k ?? 1; D.uMw.value = o.mw ?? 1;
    D.uLine.value = o.line ?? 0; D.uLineW.value = Math.max(1.2, 2.2 * px) * (cam.fov * HV_D2R) / Math.max(renderH, 1);
    const U = this.starU; U.uS.value = skyS; U.uT.value = o.t ?? 0; U.uPx.value = px; U.uSize.value = o.starSize ?? 1; U.uUp.value.set(...F.up);
    U.uK.value = o.starK ?? 1; U.uLim.value = o.lim ?? 6.0; U.uField.value = o.field ?? 0;
    // the Moon (its direction turns with the sky; the bake's orientation is close enough for four minutes)
    const md = hvLocal(HV_CUT.Mdir, F); this.moonDir.set(...md);
    const Rm = R * 0.96, Q = this.moonU.uQ.value;
    this.moon.position.set(md[0] * Rm, md[1] * Rm, md[2] * Rm);
    this.moon.updateMatrixWorld(); this.moon.lookAt(cam.position);
    const disc = Math.max(2 * Rm * Math.tan(HV_MOON.rad), Rm * (o.lens || 0) * 0.0009);
    this.moon.scale.setScalar(disc * Q);
    this.moonU.uS.value = skyS; this.moonU.uK.value = (o.moonK ?? 1) * 1.15; this.moonU.uT.value = o.t ?? 0;
    // (its hot insides: the face starts blowing out at 10:00:01; about a kilometre a second at first)
    const pl = skyS > 1.2 ? MathX.smooth(skyS, 1.2, 25) : 0;
    this.moonU.uPlume.value = (o.plume ?? 1) * pl; this.moonU.uH.value = MathX.clamp(0.004 + (skyS - 1.2) * 0.0006, 0.004, 0.16);
    // (the glow in the air round it: from the lit part that is left)
    const left = skyS < HV_MOON.t0 ? 1 : skyS > HV_MOON.t1 ? 0.5 : 1 - 0.5 * (skyS - HV_MOON.t0) / (HV_MOON.t1 - HV_MOON.t0);
    this.moonGlow.position.copy(this.moon.position); this.moonGlow.scale.setScalar(disc * 7);
    this.moonGlow.material.opacity = 0.32 * left * (o.moonK ?? 1) * (o.moonGlow ?? 1);
    this.moonGlow.visible = this.moonGlow.material.opacity > 0.002 && md[1] > -0.02;
    this.state = { F, skyS, left };
    return this.state;
  }
}
