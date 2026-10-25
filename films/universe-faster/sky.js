/* =====================================================================
   SKY — the night over your garden (late October, about 51° N, 7:30 p.m.), and what tonight does to it.
   Every point of light keeps its place; what changes is the light arriving:
     · old light (the stars, the Milky Way, Andromeda) has crossed space that grew by a(n) since 7:30: a blackbody of
       temperature θ stretched by s looks exactly like one of θ/s (physics.js). So each star's colour and brightness
       come from θ / a(n): red stars go dark first, the hottest last. (A star's dimming in magnitudes = −2.5 log of
       the visible brightness of θ/s over that of θ.)
     · the Moon and Saturn shine by sunlight only minutes (hours) old: their light is stretched far less, but they ride
       the growth away from you, so they shrink and dim (uxMoonSeen, uxSaturnSeen)
     · the town's glow on the horizon is local light: it stays
   The catalogue is a seeded random sky (≈ 2,600 naked-eye stars, more of the faint ones along the Milky Way) plus the
   bright stars and objects that are really up at that hour, at their real temperatures. Directions: the garden looks
   along azimuth UX_SKY.az0 (south-south-east); dir(az, alt) puts that azimuth at −z, east to the left.
   ===================================================================== */

const UX_SKY = {
  az0: 150,                                  // the garden faces SSE
  limit: 6.0,                                // the faintest star you can see from the garden (magnitude; a good night)
  // [name, az, alt, magnitude, temperature K]
  named: [
    ['VEGA', 292, 38, 0.03, 9600], ['DENEB', 300, 66, 1.25, 8525], ['ALTAIR', 236, 33, 0.77, 7670], ['FOMALHAUT', 172, 9, 1.16, 8590],
    ['CAPELLA', 42, 21, 0.08, 4970], ['ALPHERATZ', 118, 52, 2.06, 13800], ['MIRACH', 96, 50, 2.05, 3840], ['SCHEAT', 140, 56, 2.42, 3690],
    ['MARKAB', 146, 44, 2.48, 9800], ['ALGENIB', 128, 41, 2.83, 21500], ['ALCYONE', 76, 15, 2.87, 12300], ['ELECTRA', 75.6, 15.4, 3.7, 13400],
    ['ATLAS', 76.6, 14.8, 3.6, 12000], ['MAIA', 75.9, 15.7, 3.9, 13200], ['MEROPE', 76.3, 15.1, 4.1, 14000], ['TAYGETA', 75.5, 15.9, 4.3, 13000],
    ['SCHEDAR', 52, 58, 2.24, 4660], ['CAPH', 48, 61, 2.28, 7080], ['RUCHBAH', 44, 63, 2.68, 8400], ['ENIF', 178, 38, 2.39, 4380],
    ['POLARIS', 0, 51.5, 1.98, 6015], ['ALGOL', 62, 38, 2.1, 13000], ['MIRFAK', 50, 42, 1.79, 6350], ['HAMAL', 100, 30, 2.0, 4480],
    ['DIPHDA', 160, 18, 2.04, 4800], ['SADALSUUD', 190, 30, 2.9, 5700], ['ALBIREO', 262, 46, 3.05, 4400], ['SADR', 290, 62, 2.23, 5790],
  ],
  andromeda: { az: 88, alt: 55, len: 3.2, wid: 1.0, pa: 38 },
  moon: { az: 122, alt: 20, r: 0.26 },       // (degrees; r = its angular radius tonight at 19:30)
  saturn: { az: 154, alt: 26, mag: 0.6 },
};
function uxSkyDir(az, alt) {
  const r = (az - UX_SKY.az0) * Math.PI / 180, a = alt * Math.PI / 180;
  return [Math.sin(r) * Math.cos(a), Math.sin(a), -Math.cos(r) * Math.cos(a)];
}

// the blackbody table: 256 temperatures (log-spaced 400 K … 50,000 K) → linear colour (max 1) and log10 visible brightness
const UX_BB = (() => {
  const N = 256, L0 = Math.log10(400), L1 = Math.log10(50000), d = new Float32Array(N * 4), rgb = [], lv = [];
  for (let i = 0; i < N; i++) {
    const th = Math.pow(10, L0 + (L1 - L0) * i / (N - 1)), c = uxBBRGB(th), v = Math.log10(Math.max(1e-40, uxBBVis(th)));
    rgb.push(c); lv.push(v); d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = v;
  }
  const tex = new THREE.DataTexture(d, N, 1, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const at = (th) => { const x = MathX.clamp((Math.log10(Math.max(400, th)) - L0) / (L1 - L0), 0, 1) * (N - 1), i = Math.min(N - 2, Math.floor(x)), f = x - i; return { rgb: [0, 1, 2].map((k) => rgb[i][k] + (rgb[i + 1][k] - rgb[i][k]) * f), lv: lv[i] + (lv[i + 1] - lv[i]) * f }; };
  return { tex, L0, L1, at };
})();
// a stretched blackbody: its colour (linear, max 1) and how many magnitudes fainter it looks
function uxStretchedBB(th, s) {
  const a = UX_BB.at(th), b = UX_BB.at(th / s);
  if (th / s < 420) return { rgb: b.rgb, dm: 99 };
  return { rgb: b.rgb, dm: -2.5 * (b.lv - a.lv) };
}

// how many stars you can still see from the garden at night time n (the same test the star shader makes, without the
// twinkle: above the horizon, its stretched brightness plus the air's extinction under the limit)
let UX_SKY_CAT = null; const UX_VISN = {};
function uxStarsVisible(n) {
  const C = UX_SKY_CAT; if (!C) return 0;
  const key = Math.round(Math.max(0, n)); if (UX_VISN[key] != null) return UX_VISN[key];
  const G = Math.max(0, n) > 0 ? uxA(Math.max(0, n)) : 1; let c = 0;
  for (let i = 0; i < C.n; i++) {
    const y = C.pos[i * 3 + 1] / Math.hypot(C.pos[i * 3], C.pos[i * 3 + 1], C.pos[i * 3 + 2]); if (y <= 0) continue;
    const th = C.tem[i] / G; if (th < 420) continue;
    const dm = -2.5 * (UX_BB.at(th).lv - C.lv0[i]), ext = 0.22 / Math.max(0.06, Math.sin(Math.asin(y) + 0.05));
    if (C.mag[i] + dm + ext < UX_SKY.limit) c++;
  }
  return (UX_VISN[key] = c);
}
class UxSky {
  constructor(scene, o = {}) {
    const g = this.g = new THREE.Group(); scene.add(g);
    const R = this.R = o.r || 2600, r = new RNG(CONFIG.seed + 77), gs = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, r.next()))) * Math.cos(6.2832 * r.next());
    // ---- the Milky Way's plane (a great circle through the NE horizon, Cassiopeia–Cygnus overhead, the SW horizon)
    const P1 = uxSkyDir(40, 0), P2 = uxSkyDir(300, 70);
    const nrm = new THREE.Vector3(...P1).cross(new THREE.Vector3(...P2)).normalize();
    this.mwN = nrm;
    // ---- the stars
    const pos = [], mag = [], tem = [], lv0 = [], seed = [];
    const tempOf = () => {
      const u = r.next();
      if (u < 0.1) return r.range(10500, 26000); if (u < 0.32) return r.range(7600, 10400); if (u < 0.5) return r.range(6000, 7500);
      if (u < 0.64) return r.range(5200, 6000); if (u < 0.95) return r.range(3900, 5200); return r.range(3000, 3900);
    };
    const v = new THREE.Vector3();
    let k = 0;
    while (pos.length / 3 < 2600 && k++ < 40000) {
      const m = Math.min(6.4, 6.4 + 2 * Math.log10(Math.max(1e-6, r.next())));
      if (m < 1.6) continue;                                  // (the bright ones are the named stars)
      v.set(gs(), gs(), gs()).normalize();
      if (v.y < -0.06) continue;
      // faint stars crowd towards the Milky Way's plane
      const b = Math.abs(v.dot(nrm));
      if (m > 4.2 && r.next() > 0.35 + 0.65 * Math.exp(-b * b / 0.06)) continue;
      pos.push(v.x * R, v.y * R, v.z * R); mag.push(m); const T = tempOf(); tem.push(T); lv0.push(UX_BB.at(T).lv); seed.push(r.next());
    }
    this.named = {};
    for (const [name, az, alt, m, T] of UX_SKY.named) {
      const d = uxSkyDir(az, alt);
      this.named[name] = { dir: d, mag: m, T };
      pos.push(d[0] * R, d[1] * R, d[2] * R); mag.push(m); tem.push(T); lv0.push(UX_BB.at(T).lv); seed.push(r.next());
    }
    // (kept for the readout: how many of them you can still see)
    UX_SKY_CAT = { pos, mag, tem, lv0, n: mag.length };
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aMag', new THREE.Float32BufferAttribute(mag, 1));
    geo.setAttribute('aTemp', new THREE.Float32BufferAttribute(tem, 1));
    geo.setAttribute('aLv0', new THREE.Float32BufferAttribute(lv0, 1));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    this.starU = { uG: { value: 1 }, uLut: { value: UX_BB.tex }, uL0: { value: UX_BB.L0 }, uL1: { value: UX_BB.L1 }, uLim: { value: UX_SKY.limit }, uPx: { value: 1 },
      uT: { value: 0 }, uK: { value: 1 }, uSize: { value: 1 }, uExt: { value: 1 } };
    const stars = this.stars = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: this.starU, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aMag, aTemp, aLv0, aSeed;
        uniform float uG, uL0, uL1, uLim, uPx, uT, uK, uSize, uExt;
        uniform sampler2D uLut;
        varying vec3 vC; varying float vA;
        void main() {
          // the stretched star: a blackbody of aTemp / uG
          float th = aTemp / uG, x = clamp((log(max(th, 400.0)) / log(10.0) - uL0) / (uL1 - uL0), 0.0, 1.0);
          vec4 L = texture2D(uLut, vec2(x * 255.0 / 256.0 + 0.5 / 256.0, 0.5));
          float dm = th < 420.0 ? 99.0 : -2.5 * (L.a - aLv0);
          vec3 d = normalize(position);
          float alt = asin(clamp(d.y, -1.0, 1.0));
          float ext = uExt * 0.22 / max(0.06, sin(max(alt, 0.0) + 0.05));     // (fainter through more air)
          float tw = 0.18 * sin(uT * (5.0 + 9.0 * aSeed) + aSeed * 80.0) * smoothstep(0.6, 0.05, alt);
          float m = aMag + dm + ext + tw;
          float I = pow(10.0, -0.4 * (m - 1.0));
          vA = smoothstep(uLim + 0.5, uLim - 0.7, m) * uK;
          vec3 sat = mix(vec3(dot(L.rgb, vec3(0.3, 0.5, 0.2))), L.rgb, 1.6);   // (star colours shown a little stronger than the eye sees them)
          vC = max(sat, 0.0) * clamp(0.7 + 1.1 * pow(I, 0.4), 0.0, 3.2);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPx * uSize * clamp(4.2 + 4.2 * pow(I, 0.33), 4.0, 15.0);
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vC; varying float vA;
        void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
          float a = (exp(-r * 3.2) * 0.8 + exp(-r * 14.0) * 0.6) * vA; gl_FragColor = vec4(vC * a, a); }`,
    }));
    stars.frustumCulled = false; stars.renderOrder = -8; g.add(stars);
    // ---- the dome: the town's glow, the Milky Way (old light, stretched like a 4,800 K population), Andromeda
    this.domeU = { uMwN: { value: nrm }, uMw: { value: 1 }, uMwC: { value: new THREE.Color(1, 1, 1) }, uK: { value: 1 },
      uAnd: { value: new THREE.Vector3(...uxSkyDir(UX_SKY.andromeda.az, UX_SKY.andromeda.alt)) }, uAndK: { value: 1 }, uAndC: { value: new THREE.Color(1, 1, 1) },
      uGlow: { value: new THREE.Color('#2c2a2e') }, uTop: { value: new THREE.Color('#05070d') }, uHor: { value: new THREE.Color('#1c2130') }, uAir: { value: 1 }, uGlowK: { value: 1 } };
    const dome = this.dome = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 64, 32), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.domeU,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p; }',
      fragmentShader: /* glsl */`
        uniform vec3 uMwN, uMwC, uAnd, uAndC, uGlow, uTop, uHor; uniform float uMw, uK, uAndK, uAir, uGlowK; varying vec3 vD;
        float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
        float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= 0.5; } return s; }
        void main() {
          vec3 d = normalize(vD); float h = d.y;
          vec3 col = mix(uHor, uTop, smoothstep(0.0, 0.55, h));
          col += uGlow * uAir * uGlowK * exp(-max(h, 0.0) * 9.0);              // the town's light on the haze, low down (out with the lights)
          col *= mix(0.25, 1.0, uAir);                                            // (no air: no glow from it at all)
          if (h < 0.0) col = mix(uHor * 0.6, vec3(0.01), smoothstep(0.0, -0.2, h));
          // the Milky Way: a soft band with dark dust lanes
          float b = dot(d, uMwN), band = exp(-b * b / 0.018) + 0.35 * exp(-b * b / 0.08);
          float cl = fbm(d * 7.0) * 0.8 + fbm(d * 23.0) * 0.4, dust = smoothstep(0.42, 0.75, fbm(d * 11.0 + 3.1)) * exp(-b * b / 0.004);
          float mw = band * (0.35 + 0.9 * cl) * (1.0 - 0.75 * dust) * smoothstep(-0.02, 0.35, h);
          col += uMwC * mw * 0.085 * uMw;
          // Andromeda: a faint tilted oval
          vec3 a = normalize(uAnd), e1 = normalize(cross(a, vec3(0.0, 1.0, 0.0))), e2 = cross(e1, a);
          float c38 = cos(0.66), s38 = sin(0.66);
          vec2 q = vec2(dot(d - a, e1), dot(d - a, e2)) / 0.0175; q = vec2(c38 * q.x - s38 * q.y, s38 * q.x + c38 * q.y);
          float ell = exp(-(q.x * q.x / 2.6 + q.y * q.y / 0.25)) * 0.6 + exp(-(q.x * q.x + q.y * q.y) / 0.035) * 0.9;
          col += uAndC * ell * 0.42 * uAndK * step(0.0, dot(d, a));
          gl_FragColor = vec4(col * uK, 1.0);
        }`,
    }));
    dome.renderOrder = -10; dome.frustumCulled = false; g.add(dome);
    // ---- the Moon: a lit disc (a canvas of maria, a little limb darkening), always facing you
    const moonTex = uxTex(uxCanvas(256, 256, (c, w) => {
      const im = c.createImageData(w, w), D = im.data, rr = new RNG(9);
      const maria = [[0.38, 0.36, 0.17], [0.6, 0.32, 0.13], [0.55, 0.55, 0.15], [0.33, 0.62, 0.1], [0.68, 0.6, 0.09], [0.45, 0.47, 0.08]];
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
        const u = (x + 0.5) / w * 2 - 1, vv = (y + 0.5) / w * 2 - 1, rad = u * u + vv * vv, i = (y * w + x) * 4;
        if (rad > 1) { D[i + 3] = 0; continue; }
        let s = 0.92 + 0.08 * (hash2(x >> 2, y >> 2) - 0.5);
        for (const [mx, my, mr] of maria) { const dd = Math.hypot((x / w) - mx, (y / w) - my); s -= 0.28 * MathX.smooth(-dd, -mr, -mr * 0.55); }
        s *= 0.55 + 0.45 * Math.pow(1 - rad, 0.25);
        const edge = MathX.smooth(-Math.sqrt(rad), -1, -0.985);
        D[i] = D[i + 1] = D[i + 2] = 255 * MathX.clamp(s, 0, 1); D[i + 3] = 255 * edge;
      }
      c.putImageData(im, 0, 0);
    }), { repeat: false });
    this.moonMat = new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1, 1, 1) });
    this.moon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.moonMat); this.moon.renderOrder = -7; g.add(this.moon);
    this.moonGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: uxDotTex(0.18), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.5, 0.52, 0.56) }));
    this.moonGlow.renderOrder = -7.5; g.add(this.moonGlow);
    this.moonDir = new THREE.Vector3(...uxSkyDir(UX_SKY.moon.az, UX_SKY.moon.alt));
    // ---- Saturn: a steady yellowish point
    const sd = uxSkyDir(UX_SKY.saturn.az, UX_SKY.saturn.alt); this.saturnDir = new THREE.Vector3(...sd);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute([sd[0] * R, sd[1] * R, sd[2] * R], 3));
    this.satU = { uC: { value: new THREE.Color(1, 0.9, 0.7) }, uA: { value: 1 }, uPx: { value: 1 }, uS: { value: 4 } };
    this.saturn = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: this.satU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float uPx, uS; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uPx * uS; }',
      fragmentShader: 'uniform vec3 uC; uniform float uA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; float a = exp(-r * 3.0) * uA; gl_FragColor = vec4(uC * a, a); }' }));
    this.saturn.frustumCulled = false; this.saturn.renderOrder = -7; g.add(this.saturn);
    this.state = {};
  }
  // n: night time; cam: the camera; o: { k (all of it), moonScale (a long lens may draw the Moon a little larger: no) }
  update(n, t, cam, renderH, o = {}) {
    this.g.position.copy(cam.position);
    const G = n > 0 ? uxA(n) : 1, px = renderH / 1080;
    const K = o.k ?? 1;
    Object.assign(this.starU.uG, { value: G }); this.starU.uPx.value = px; this.starU.uT.value = t; this.starU.uK.value = K * (o.starK ?? 1);
    this.starU.uSize.value = o.starSize ?? 1;
    // the Milky Way and Andromeda: old light, a 4,800 K and a 5,000 K population
    const mw = uxStretchedBB(4800, G), an = uxStretchedBB(5000, G);
    this.domeU.uMw.value = Math.pow(10, -0.4 * mw.dm) * (o.mwK ?? 1); this.domeU.uMwC.value.setRGB(...mw.rgb.map((x) => 0.4 + 0.6 * x));
    this.domeU.uAndK.value = Math.pow(10, -0.4 * an.dm) * (o.andK ?? 1); this.domeU.uAndC.value.setRGB(...an.rgb);
    this.domeU.uK.value = K; this.domeU.uAir.value = o.air ?? 1; this.domeU.uGlowK.value = o.glow ?? 1; this.starU.uExt.value = o.air ?? 1;
    // the Moon
    const M = n > 0 ? uxMoonSeen(n) : { size: 1, stretch: 1, bright: 1 };
    const mc = uxStretchedBB(5772, M.stretch).rgb, m0 = UX_BB.at(5772).rgb;
    const tint = mc.map((x, i) => x / m0[i]), mx = Math.max(...tint);
    const mag = -2.5 * Math.log10(Math.max(1e-30, M.bright)) - 12.7;
    const mbL = MathX.clamp(Math.pow(M.bright, 0.32), 0, 1);          // (the eye adapts: drawn on a compressed scale)
    const mb = Math.max(mbL, 0.14 * MathX.smooth(mag, 5, 1.5));       // (and when it's as faint as a star, it still shows like one)
    const vis = MathX.smooth(mag, 4.7, 2.4);                          // its magnitude against the garden's glow
    const md = this.moonDir, Rm = this.R * 0.98, ang = UX_SKY.moon.r * M.size * Math.PI / 180;
    this.moon.position.set(md.x * Rm, md.y * Rm, md.z * Rm); this.moon.lookAt(cam.position.x - this.g.position.x, cam.position.y - this.g.position.y, cam.position.z - this.g.position.z);
    this.moon.position.set(md.x * Rm, md.y * Rm, md.z * Rm);
    const sz = Math.max(2 * Rm * Math.tan(ang), Rm * 0.0016 * (o.lens || 1));
    this.moon.scale.setScalar(sz);
    this.moonMat.color.setRGB(...tint.map((x) => x / mx * mb * 1.9)); this.moonMat.opacity = K * vis;
    this.moonGlow.position.copy(this.moon.position); this.moonGlow.quaternion.copy(this.moon.quaternion); this.moonGlow.scale.setScalar(sz * 3.2);
    this.moonGlow.material.color.setRGB(...tint.map((x) => x / mx * 0.22 * mb * vis * K));
    this.moonLight = mbL * vis;                                        // (how much it lights the garden, 0…1)
    this.moonTint = tint.map((x) => x / mx);
    // Saturn
    const S = n > 0 ? uxSaturnSeen(n) : { size: 1, stretch: 1, bright: 1 };
    const sc = uxStretchedBB(5772, S.stretch).rgb, sm = UX_SKY.saturn.mag - 2.5 * Math.log10(Math.max(1e-30, S.bright)) + 0.3;
    const sI = Math.pow(10, -0.4 * (sm - 1));
    this.satU.uC.value.setRGB(...sc.map((x, i) => x / m0[i] * [1, 0.9, 0.7][i] * MathX.clamp(0.32 + 0.68 * Math.pow(sI, 0.42), 0, 2.6)));
    this.satU.uA.value = K * MathX.smooth(-sm, -(UX_SKY.limit + 0.5), -(UX_SKY.limit - 0.7)); this.satU.uPx.value = px; this.satU.uS.value = MathX.clamp(1.7 + 1.5 * Math.pow(sI, 0.3), 1.6, 6.5) * (o.starSize ?? 1);
    this.state = { G, moon: M, saturn: S, moonMag: -2.5 * Math.log10(Math.max(1e-30, M.bright)) - 12.7, satMag: sm };
  }
  // a direction for a named thing ('MOON', 'SATURN', 'ANDROMEDA', a star's name) × distance d from the camera
  at(name, d = 400) {
    let v;
    if (name === 'MOON') v = this.moonDir; else if (name === 'SATURN') v = this.saturnDir;
    else if (name === 'ANDROMEDA') v = new THREE.Vector3(...uxSkyDir(UX_SKY.andromeda.az, UX_SKY.andromeda.alt));
    else v = new THREE.Vector3(...this.named[name].dir);
    return [this.g.position.x + v.x * d, this.g.position.y + v.y * d, this.g.position.z + v.z * d];
  }
  // how a named star looks tonight at stretch G: { mag, rgb }
  starNow(name, G) { const s = this.named[name], b = uxStretchedBB(s.T, G); return { mag: s.mag + b.dm, rgb: b.rgb }; }
}
