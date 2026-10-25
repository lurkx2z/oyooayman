/* =====================================================================
   SKY — the night over your garden (late October, about 51° N, 7:30 p.m.), and what tonight does to it. Every point
   of light keeps its place; what changes is the light arriving (physics.js):
     · the stars: their light set out long before 7:30 and crosses shrinking space, so it arrives squeezed. A blackbody
       of temperature θ squeezed by s looks exactly like one of θ·s: every star turns whiter, then bluer, and brighter
       (red stars most). Stars far too faint to see tonight come out by the tens of thousands (the catalogue goes to
       magnitude ≈ 10.3); later the glowing sky drowns them, faintest first (the limit comes from the sky's brightness)
     · the Milky Way: a ≈ 4,800 K population of stars, brightening the same way; its dark dust lanes are 18 K dust,
       whose own light is squeezed out of the far infrared into the visible later on: then the lanes glow
     · the dark between the stars: the light of every galaxy that ever shone, then the Big Bang's afterglow (ucSkyNow)
     · the Moon: sunlight only 8 minutes old, squeezed only a little; it fades into the sky when the sky matches it
   Everything is drawn in display units: luminance (cd/m²) × E, the eye's adaptation (physics.js, ucSkyNow().E).
   The catalogue is a seeded random sky plus the bright stars that are really up at that hour, at their real
   temperatures. Directions: the garden looks along azimuth UC_SKY.az0 (south-south-east); ucSkyDir(az, alt).
   ===================================================================== */

const UC_SKY = {
  az0: 150,                                  // the garden faces SSE
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
  andromeda: { az: 88, alt: 55 },
  moon: { az: 122, alt: 20, r: 0.26 },       // (degrees; r = its angular radius)
  cygnus: { az: 296, alt: 64 },              // the brightest part of the band overhead
};
function ucSkyDir(az, alt) {
  const r = (az - UC_SKY.az0) * Math.PI / 180, a = alt * Math.PI / 180;
  return [Math.sin(r) * Math.cos(a), Math.sin(a), -Math.cos(r) * Math.cos(a)];
}

// the blackbody table: 320 temperatures (log-spaced 400 K … 10 million K) → linear colour (max 1) and log10 visible
// brightness per unit area
const UC_BB = (() => {
  const N = 320, L0 = Math.log10(400), L1 = Math.log10(1e7), d = new Float32Array(N * 4), rgb = [], lv = [];
  for (let i = 0; i < N; i++) {
    const th = Math.pow(10, L0 + (L1 - L0) * i / (N - 1)), c = ucBBRGB(th), v = Math.log10(Math.max(1e-40, ucBBVis(th)));
    rgb.push(c); lv.push(v); d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = v;
  }
  const tex = new THREE.DataTexture(d, N, 1, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const at = (th) => { const x = MathX.clamp((Math.log10(Math.max(400, th)) - L0) / (L1 - L0), 0, 1) * (N - 1), i = Math.min(N - 2, Math.floor(x)), f = x - i; return { rgb: [0, 1, 2].map((k) => rgb[i][k] + (rgb[i + 1][k] - rgb[i][k]) * f), lv: lv[i] + (lv[i + 1] - lv[i]) * f }; };
  return { tex, L0, L1, N, at };
})();
// a colour (linear, max 1) → one with the same hue whose luminance is about 1 (so components add by luminance), tamed
// for pure blues and reds
function ucUnitLum(rgb) { const l = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; const k = 1 / Math.max(0.3, l); return [rgb[0] * k, rgb[1] * k, rgb[2] * k]; }

class UcSky {
  constructor(scene, o = {}) {
    const g = this.g = new THREE.Group(); scene.add(g);
    const R = this.R = o.r || 2600, r = new RNG(CONFIG.seed + 77), gs = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, r.next()))) * Math.cos(6.2832 * r.next());
    // ---- the Milky Way's plane (a great circle through the NE horizon, Cassiopeia–Cygnus overhead, the SW horizon)
    const P1 = ucSkyDir(40, 0), P2 = ucSkyDir(300, 70);
    const nrm = new THREE.Vector3(...P1).cross(new THREE.Vector3(...P2)).normalize();
    this.mwN = nrm;
    // ---- the stars: ≈ 120,000 to magnitude 10.3 (most far too faint to see tonight), the faint ones crowding towards
    // the Milky Way's plane; the faint ones are mostly cooler stars
    const pos = [], mag = [], tem = [], lv0 = [], seed = [];
    const tempOf = (m) => {
      const u = r.next(), cool = MathX.smooth(m, 5, 9) * 0.25;
      if (u < 0.08 - 0.04 * cool) return r.range(10500, 26000); if (u < 0.28 - 0.08 * cool) return r.range(7600, 10400); if (u < 0.45 - 0.1 * cool) return r.range(6000, 7500);
      if (u < 0.6 - 0.1 * cool) return r.range(5200, 6000); if (u < 0.9) return r.range(3900, 5200); return r.range(3000, 3900);
    };
    const v = new THREE.Vector3();
    let k = 0;
    while (pos.length / 3 < 120000 && k++ < 2e6) {
      const m = 10.3 + Math.log10(Math.max(1e-9, r.next())) / 0.42;
      if (m < 1.6) continue;                                  // (the bright ones are the named stars)
      v.set(gs(), gs(), gs()).normalize();
      if (v.y < -0.08) continue;
      const b = Math.abs(v.dot(nrm));
      if (m > 4.2 && r.next() > 0.3 + 0.7 * Math.exp(-b * b / (m > 7 ? 0.04 : 0.06))) continue;
      pos.push(v.x * R, v.y * R, v.z * R); mag.push(m); const T = tempOf(m); tem.push(T); lv0.push(UC_BB.at(T).lv); seed.push(r.next());
    }
    this.named = {};
    for (const [name, az, alt, m, T] of UC_SKY.named) {
      const d = ucSkyDir(az, alt);
      this.named[name] = { dir: d, mag: m, T };
      pos.push(d[0] * R, d[1] * R, d[2] * R); mag.push(m); tem.push(T); lv0.push(UC_BB.at(T).lv); seed.push(r.next());
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aMag', new THREE.Float32BufferAttribute(mag, 1));
    geo.setAttribute('aTemp', new THREE.Float32BufferAttribute(tem, 1));
    geo.setAttribute('aLv0', new THREE.Float32BufferAttribute(lv0, 1));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    this.starU = { uS: { value: 1 }, uLut: { value: UC_BB.tex }, uL0: { value: UC_BB.L0 }, uL1: { value: UC_BB.L1 }, uLim: { value: 6.2 }, uPx: { value: 1 },
      uT: { value: 0 }, uK: { value: 1 }, uSize: { value: 1 }, uExt: { value: 1 }, uGain: { value: 1 } };
    const stars = this.stars = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: this.starU, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aMag, aTemp, aLv0, aSeed;
        uniform float uS, uL0, uL1, uLim, uPx, uT, uK, uSize, uExt, uGain;
        uniform sampler2D uLut;
        varying vec3 vC; varying float vA;
        void main() {
          // the squeezed star: a blackbody of aTemp · uS
          float th = aTemp * uS, x = clamp((log(max(th, 400.0)) / log(10.0) - uL0) / (uL1 - uL0), 0.0, 1.0);
          vec4 L = texture2D(uLut, vec2(x * ${(UC_BB.N - 1).toFixed(1)} / ${UC_BB.N.toFixed(1)} + 0.5 / ${UC_BB.N.toFixed(1)}, 0.5));
          float dm = -2.5 * (L.a - aLv0);
          vec3 d = normalize(position);
          float alt = asin(clamp(d.y, -1.0, 1.0));
          float ext = uExt * 0.22 / max(0.06, sin(max(alt, 0.0) + 0.05));     // (fainter through more air)
          float tw = 0.18 * sin(uT * (5.0 + 9.0 * aSeed) + aSeed * 80.0) * smoothstep(0.6, 0.05, alt);
          float m = aMag + dm + ext + tw;
          float I = pow(10.0, -0.4 * (m - 1.0));
          vA = smoothstep(uLim + 0.4, uLim - 0.9, m) * uK;
          vec3 sat = mix(vec3(dot(L.rgb, vec3(0.3, 0.5, 0.2))), L.rgb, 1.45);   // (star colours a little stronger than the eye sees them)
          vC = max(sat, 0.0) * clamp(0.05 + 1.1 * pow(I, 0.42), 0.0, 3.4) * uGain;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPx * uSize * clamp(2.3 + 3.3 * pow(I, 0.3), 2.2, 15.0);
          if (vA < 0.003) gl_PointSize = 0.0;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vC; varying float vA;
        void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
          float a = (exp(-r * 3.2) * 0.8 + exp(-r * 14.0) * 0.6) * vA; gl_FragColor = vec4(vC * a, a); }`,
    }));
    stars.frustumCulled = false; stars.renderOrder = -8; g.add(stars);
    // ---- the dome: the night's own glow (and the town's on the haze), the light of every galaxy and the afterglow (a
    // uniform background), the Milky Way's starlight with its dark lanes, the lanes' own glow, Andromeda
    this.domeU = { uMwN: { value: nrm }, uMw: { value: new THREE.Color() }, uDust: { value: new THREE.Color() }, uBg: { value: new THREE.Color() },
      uAnd: { value: new THREE.Vector3(...ucSkyDir(UC_SKY.andromeda.az, UC_SKY.andromeda.alt)) }, uAndC: { value: new THREE.Color() },
      uNight: { value: 1 }, uGlow: { value: new THREE.Color('#2c2a2e') }, uTop: { value: new THREE.Color('#05070d') }, uHor: { value: new THREE.Color('#1c2130') }, uGlowK: { value: 1 },
      uGround: { value: new THREE.Color('#000000') }, uK: { value: 1 }, uRip: { value: 0 } };
    const dome = this.dome = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 64, 32), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.domeU,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p; }',
      fragmentShader: /* glsl */`
        uniform vec3 uMwN, uMw, uDust, uBg, uAnd, uAndC, uGlow, uTop, uHor, uGround; uniform float uNight, uGlowK, uK, uRip; varying vec3 vD;
        float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
        float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= 0.5; } return s; }
        void main() {
          vec3 d = normalize(vD); float h = d.y;
          // the night's own glow: dark blue overhead, the town's light low down
          vec3 col = mix(uHor, uTop, smoothstep(0.0, 0.55, h)) + uGlow * uGlowK * exp(-max(h, 0.0) * 9.0);
          col *= uNight;
          // the background (every galaxy's light, then the afterglow): the same in every direction
          col += uBg;
          // the Milky Way: a soft band, dark dust lanes in it; the lanes' own glow once it is squeezed into view
          float b = dot(d, uMwN), band = exp(-b * b / 0.018) + 0.35 * exp(-b * b / 0.08);
          float cl = fbm(d * 7.0) * 0.8 + fbm(d * 23.0) * 0.4, lane = smoothstep(0.42, 0.75, fbm(d * 11.0 + 3.1)) * exp(-b * b / 0.004);
          float up = smoothstep(-0.02, 0.3, h);
          col += uMw * band * (0.35 + 0.9 * cl) * (1.0 - 0.75 * lane) * up * 0.62;
          col += uDust * (0.22 * band * (0.5 + 0.6 * cl) + 1.25 * lane * (0.6 + 0.5 * fbm(d * 31.0 + 7.0))) * up;
          // Andromeda: a faint tilted oval
          vec3 a = normalize(uAnd), e1 = normalize(cross(a, vec3(0.0, 1.0, 0.0))), e2 = cross(e1, a);
          float c38 = cos(0.66), s38 = sin(0.66);
          vec2 q = vec2(dot(d - a, e1), dot(d - a, e2)) / 0.0175; q = vec2(c38 * q.x - s38 * q.y, s38 * q.x + c38 * q.y);
          float ell = exp(-(q.x * q.x / 2.6 + q.y * q.y / 0.25)) * 0.6 + exp(-(q.x * q.x + q.y * q.y) / 0.035) * 0.9;
          col += uAndC * ell * step(0.0, dot(d, a));
          // the afterglow's ripples (one part in 100,000), drawn exaggerated when uRip > 0, in the colours of the
          // published maps: cooler blue, warmer red
          if (uRip > 0.0) { float v = fbm(d * 5.0 + 11.0) + 0.55 * fbm(d * 16.0 + 4.0) - 0.78;
            // (a tint on the sky's own colour, so the orange stays orange: cooler patches bluer, warmer ones redder)
            vec3 pc = v < 0.0 ? mix(vec3(1.0), vec3(0.5, 0.7, 1.8), smoothstep(0.0, 0.2, -v)) : mix(vec3(1.0), vec3(1.3, 0.75, 0.45), smoothstep(0.0, 0.2, v));
            col *= mix(vec3(1.0), pc, uRip); }
          // below the horizon: the ground far off (lit by the sky)
          if (h < 0.0) col = mix(col, uGround, smoothstep(0.0, -0.06, h));
          gl_FragColor = vec4(col * uK, 1.0);
        }`,
    }));
    dome.renderOrder = -10; dome.frustumCulled = false; g.add(dome);
    // ---- the Moon: a lit disc (a canvas of maria, a little limb darkening), always facing you; nearly full
    const moonTex = ucTex(ucCanvas(256, 256, (c, w) => {
      const im = c.createImageData(w, w), D = im.data;
      const maria = [[0.38, 0.36, 0.17], [0.6, 0.32, 0.13], [0.55, 0.55, 0.15], [0.33, 0.62, 0.1], [0.68, 0.6, 0.09], [0.45, 0.47, 0.08]];
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
        const u = (x + 0.5) / w * 2 - 1, vv = (y + 0.5) / w * 2 - 1, rad = u * u + vv * vv, i = (y * w + x) * 4;
        if (rad > 1) { D[i + 3] = 0; continue; }
        let s = 0.92 + 0.08 * (hash2(x >> 2, y >> 2) - 0.5);
        for (const [mx, my, mr] of maria) { const dd = Math.hypot((x / w) - mx, (y / w) - my); s -= 0.28 * MathX.smooth(-dd, -mr, -mr * 0.55); }
        s *= 0.55 + 0.45 * Math.pow(1 - rad, 0.25);
        const term = MathX.smooth(u, -0.98, -0.8);                 // (a sliver short of full: the terminator on the left)
        const edge = MathX.smooth(-Math.sqrt(rad), -1, -0.985);
        D[i] = D[i + 1] = D[i + 2] = 255 * MathX.clamp(s * (0.1 + 0.9 * term), 0, 1); D[i + 3] = 255 * edge;
      }
      c.putImageData(im, 0, 0);
    }), { repeat: false });
    this.moonMat = new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1, 1, 1) });
    this.moon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.moonMat); this.moon.renderOrder = -7; g.add(this.moon);
    this.moonGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ucDotTex(0.18), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.5, 0.52, 0.56) }));
    this.moonGlow.renderOrder = -7.5; g.add(this.moonGlow);
    this.moonDir = new THREE.Vector3(...ucSkyDir(UC_SKY.moon.az, UC_SKY.moon.alt));
    this.bandDir = new THREE.Vector3(...ucSkyDir(UC_SKY.cygnus.az, UC_SKY.cygnus.alt));
    this.state = {};
  }
  // n: night time; t: the visual clock (twinkle); o: { E (display per cd/m²; default the sky's own), k (all of it), starSize,
  // starGain, lens (a long lens draws the Moon at least this many pixels), glow (the town's lights) }
  update(n, t, cam, renderH, o = {}) {
    this.g.position.copy(cam.position);
    const S = ucSkyNow(Math.max(0, n)), E = o.E ?? S.E, px = renderH / 1080, K = o.k ?? 1;
    const U = this.starU;
    U.uS.value = S.s; U.uPx.value = px; U.uT.value = t; U.uK.value = K * (o.starK ?? 1); U.uSize.value = o.starSize ?? 1; U.uGain.value = o.starGain ?? 1;
    U.uLim.value = S.lim + (o.limBoost ?? 0);
    const D = this.domeU, set = (c, rgb, Lum) => { const u = ucUnitLum(rgb); c.setRGB(u[0] * Lum * E, u[1] * Lum * E, u[2] * Lum * E); };
    // the night's own glow, as the faster film drew it (its colours are display values at the night's adaptation)
    D.uNight.value = MathX.clamp(E / 5, 0, 1); D.uGlowK.value = o.glow ?? 1;
    set(D.uBg.value, ucMixRGB([[S.ebl, S.eblRGB], [S.cmb, S.cmbRGB]]), S.ebl + S.cmb);
    set(D.uMw.value, S.mwRGB, S.mw);
    set(D.uDust.value, S.dustRGB[0] + S.dustRGB[1] + S.dustRGB[2] > 0 ? S.dustRGB : [1, 0.2, 0], S.dust);
    set(D.uAndC.value, S.mwRGB, S.mw * 0.7);
    // the ground far off: lit by the whole sky (ρ ≈ 0.15), later glowing at its own heat
    { const gL = 0.15 * S.Lavg; set(D.uGround.value, S.rgb, gL); }
    D.uK.value = K;
    // the Moon
    const md = this.moonDir, Rm = this.R * 0.98, ang = UC_SKY.moon.r * Math.PI / 180;
    this.moon.position.set(md.x * Rm, md.y * Rm, md.z * Rm);
    this.moon.lookAt(cam.position.x - this.g.position.x, cam.position.y - this.g.position.y, cam.position.z - this.g.position.z);
    const sz = Math.max(2 * Rm * Math.tan(ang), Rm * 0.0016 * (o.lens || 1));
    this.moon.scale.setScalar(sz);
    // (the disc hides the sky behind it: it shows sunlight off its face, the sky's own light off its face (albedo 0.12),
    // and later its own heat (its dusty surface warms as fast as dead leaves). When that matches the sky it is gone; for a
    // few minutes after, it is a little darker than the sky; then it glows with it)
    const heat = 0.95 * ucBBLum(ucTempAt('leaves', Math.max(0, n))), mL = S.moonL + 0.12 * S.L + heat;
    const mDisp = E * mL, mc = ucMixRGB([[S.moonL, S.moonRGB], [0.12 * S.L, S.rgb], [heat, UC_BB.at(ucTempAt('leaves', Math.max(0, n))).rgb]]);
    const mu = ucUnitLum(mc), sc = Math.min(1, 2.2 / Math.max(1e-9, mDisp * Math.max(...mu)));
    const skyBehind = E * S.L, vis = 1;
    this.moonMat.color.setRGB(mu[0] * mDisp * sc / 0.72, mu[1] * mDisp * sc / 0.72, mu[2] * mDisp * sc / 0.72); this.moonMat.opacity = K;   // (÷ the face's mean shade)
    const over = Math.max(0, mDisp - skyBehind) / Math.max(1e-6, mDisp);
    this.moonGlow.position.copy(this.moon.position); this.moonGlow.quaternion.copy(this.moon.quaternion); this.moonGlow.scale.setScalar(sz * 3.2);
    this.moonGlow.material.color.setRGB(...mu.map((x) => x * 0.2 * Math.min(1, mDisp) * over * K * MathX.smooth(-skyBehind, -0.3, -0.05)));
    // what the sky sends down into the garden (display units, for a white surface): the Moon, the uniform sky, the band
    this.moonLight = E * 0.25 * S.moonL / 2500;                       // (lux → a white surface's display ×π)
    this.skyLight = E * S.L;
    this.bandLight = E * (0.16 * S.mw + 0.05 * S.dust);
    this.state = { S, E, vis, skyBehind, moonDisp: mDisp };
  }
  // a direction for a named thing ('MOON', 'ANDROMEDA', a star's name) × distance d from the camera
  at(name, d = 400) {
    let v;
    if (name === 'MOON') v = this.moonDir;
    else if (name === 'ANDROMEDA') v = new THREE.Vector3(...ucSkyDir(UC_SKY.andromeda.az, UC_SKY.andromeda.alt));
    else v = new THREE.Vector3(...this.named[name].dir);
    return [this.g.position.x + v.x * d, this.g.position.y + v.y * d, this.g.position.z + v.z * d];
  }
  // how a named star looks tonight at shrink s: { mag, rgb, T }
  starNow(name, s) { const st = this.named[name], a = UC_BB.at(st.T), b = UC_BB.at(st.T * s); return { mag: st.mag - 2.5 * (b.lv - a.lv), rgb: b.rgb, T: st.T * s }; }
}
// colours mixed by luminance: [[L, rgb], …] → rgb (max 1)
function ucMixRGB(list) {
  let r = 0, g = 0, b = 0, w = 0;
  for (const [L, c] of list) { if (!(L > 0)) continue; const u = ucUnitLum(c); r += L * u[0]; g += L * u[1]; b += L * u[2]; w += L; }
  if (!(w > 0)) return [0, 0, 0];
  const m = Math.max(r, g, b); return [r / m, g / m, b / m];
}
