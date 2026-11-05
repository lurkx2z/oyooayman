/* =====================================================================
   SKY — the sky over the fair (shared by the fair set and the valley shots): the daylight dome (Rayleigh blue overhead,
   the low Sun's gold in the south-west), the Sun, the Moon, Saturn and the stars at their real places for 3:30 PM on
   21 November 2026 from 51.5° N (local sidereal time 19.6 h), approximately.
   While nothing scatters (physics.js), the dome is black: what is left is what makes or carries its own light.
     the dome        scattered sunlight: × bounce (and the dusk colours at 4:42 PM)
     the Sun        a disc and a small glare; orange through 11 air masses when the air scatters, white and 3× brighter
                     when it doesn't
     the Moon       sunlit (an 11.6-day gibbous), its light 1.28 s old: NBP.moonOn
     Saturn         0.7 mag, its light 72 minutes old: NBP.saturnOn
     the stars      shown down to the limiting magnitude of your eyes at that moment (NBP.limMag): the bright ones
                     first, more as your pupils open
     nbBuildSky(scene, o) → { dirOf(raH, decDeg), sunDir, update(s, { bounce, dusk, lim, px }) }
   ===================================================================== */

function nbSkyFrame() {
  const ph = MathX.deg(NB_SKY.lat), th = NB_SKY.lst / 24 * Math.PI * 2;
  const Z = [Math.cos(ph) * Math.cos(th), Math.cos(ph) * Math.sin(th), Math.sin(ph)];
  const N = [-Math.sin(ph) * Math.cos(th), -Math.sin(ph) * Math.sin(th), Math.cos(ph)];
  const E = [-Math.sin(th), Math.cos(th), 0];
  return { Z, N, E };
}
const NB_SKYF = nbSkyFrame();
// equatorial (RA hours, Dec degrees) → our frame (x east, y up, z south)
function nbSkyDir(raH, decDeg) {
  const a = raH / 24 * Math.PI * 2, d = MathX.deg(decDeg), q = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)], F = NB_SKYF;
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  return [dot(q, F.E), dot(q, F.Z), -dot(q, F.N)];
}

// the bright stars of the northern sky: [name, RA h, Dec °, mag, colour]
const NB_STARS = [
  ['Vega', 18.615, 38.78, 0.03, '#e8eeff'], ['Deneb', 20.690, 45.28, 1.25, '#f0f4ff'], ['Altair', 19.846, 8.87, 0.77, '#ffffff'], ['Arcturus', 14.261, 19.18, -0.05, '#ffc68a'],
  ['Capella', 5.278, 46.00, 0.08, '#fff0c8'], ['Polaris', 2.530, 89.26, 1.98, '#fff4d8'], ['Dubhe', 11.062, 61.75, 1.79, '#ffcf9a'], ['Merak', 11.031, 56.38, 2.37, '#f4f6ff'],
  ['Phecda', 11.897, 53.69, 2.44, '#f4f6ff'], ['Megrez', 12.257, 57.03, 3.31, '#f4f6ff'], ['Alioth', 12.900, 55.96, 1.77, '#f4f6ff'], ['Mizar', 13.399, 54.93, 2.23, '#f4f6ff'],
  ['Alkaid', 13.792, 49.31, 1.86, '#dfe8ff'], ['Schedar', 0.675, 56.54, 2.24, '#ffcf9a'], ['Caph', 0.153, 59.15, 2.28, '#fff6e8'], ['Gamma Cas', 0.945, 60.72, 2.15, '#dfe8ff'],
  ['Ruchbah', 1.430, 60.24, 2.66, '#f4f6ff'], ['Segin', 1.907, 63.67, 3.35, '#dfe8ff'], ['Mirfak', 3.405, 49.86, 1.79, '#fff6e0'], ['Algol', 3.136, 40.96, 2.12, '#dfe8ff'],
  ['Almach', 2.065, 42.33, 2.10, '#ffc890'], ['Mirach', 1.162, 35.62, 2.07, '#ffb880'], ['Alpheratz', 0.140, 29.09, 2.06, '#e2e8ff'], ['Scheat', 23.063, 28.08, 2.42, '#ffb080'],
  ['Markab', 23.079, 15.21, 2.48, '#e2e8ff'], ['Algenib', 0.221, 15.18, 2.83, '#d8e2ff'], ['Enif', 21.736, 9.88, 2.39, '#ffbf88'], ['Hamal', 2.120, 23.46, 2.00, '#ffcf9a'],
  ['Sheratan', 1.911, 20.81, 2.64, '#f4f6ff'], ['Diphda', 0.727, -17.99, 2.04, '#ffdcae'], ['Fomalhaut', 22.961, -29.62, 1.16, '#ffffff'], ['Sadr', 20.370, 40.26, 2.23, '#fff6e0'],
  ['Gienah Cygni', 20.770, 33.97, 2.48, '#ffd8a8'], ['Albireo', 19.512, 27.96, 3.05, '#ffcf9a'], ['Delta Cygni', 19.750, 45.13, 2.87, '#e8eeff'], ['Rasalhague', 17.582, 12.56, 2.08, '#ffffff'],
  ['Eltanin', 17.943, 51.49, 2.24, '#ffbf88'], ['Kochab', 14.845, 74.16, 2.08, '#ffbf88'], ['Alderamin', 21.310, 62.59, 2.45, '#ffffff'], ['Sadalsuud', 21.526, -5.57, 2.87, '#fff2d8'],
  ['Sadalmelik', 22.096, -0.32, 2.95, '#fff0d0'], ['Tarazed', 19.771, 10.61, 2.72, '#ffc890'], ['Menkar', 3.038, 4.09, 2.54, '#ffb88a'], ['Elnath', 5.438, 28.61, 1.65, '#e8eeff'],
  ['Menkalinan', 5.992, 44.95, 1.90, '#f4f6ff'], ['Alcyone', 3.791, 24.10, 2.87, '#dfe8ff'], ['Kornephoros', 16.504, 21.49, 2.77, '#ffd8a8'], ['Izar', 14.750, 27.07, 2.37, '#ffc890'],
  ['Alphecca', 15.578, 26.71, 2.23, '#f4f6ff'], ['Unukalhai', 15.738, 6.43, 2.63, '#ffc890'], ['Sabik', 17.173, -15.72, 2.43, '#ffffff'], ['Nunki', 18.921, -26.30, 2.05, '#d8e2ff'],
  ['Kaus Australis', 18.403, -34.38, 1.85, '#dfe8ff'], ['Thuban', 14.073, 64.38, 3.65, '#f4f6ff'], ['Rastaban', 17.507, 52.30, 2.79, '#ffe0b0'], ['Seginus', 14.535, 38.31, 3.03, '#f4f6ff'],
  ['Gamma Aql', 19.771, 10.61, 2.72, '#ffc890'], ['Zeta Aql', 19.090, 13.86, 2.99, '#ffffff'], ['Gamma Lyr', 18.982, 32.69, 3.24, '#f4f6ff'], ['Sheliak', 18.835, 33.36, 3.52, '#f4f6ff'],
];

function nbBuildSky(scene, o = {}) {
  const R = o.r || 9000, D = (ra, dec) => new THREE.Vector3(...nbSkyDir(ra, dec));
  const sunDir = D(...NB_BODIES.sun), moonDir = D(...NB_BODIES.moon), satDir = D(...NB_BODIES.saturn);
  // ---- the dome: daylight (Rayleigh overhead, gold round the low Sun, a pale pink band opposite), and the dusk of 4:42
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sd: { value: sunDir.clone() }, k: { value: 1 }, dusk: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 sd; uniform float k, dusk; varying vec3 vD;
      void main(){
        float h = vD.y, hc = max(h, 0.0), g = max(dot(vD, sd), 0.0);
        vec2 az = normalize(vD.xz + 1e-5), saz = normalize(sd.xz);
        float side = dot(az, saz) * 0.5 + 0.5;                                      // 1 toward the Sun's azimuth
        // the day: deep blue overhead, paler and warmer at the horizon, gold round the Sun, a pink band in the east
        vec3 zen = vec3(0.16, 0.32, 0.68), hor = mix(vec3(0.62, 0.66, 0.70), vec3(1.05, 0.72, 0.42), pow(side, 3.0));
        vec3 day = mix(hor, zen, pow(smoothstep(0.0, 0.75, hc), 0.55));
        day += vec3(1.3, 0.75, 0.32) * (pow(g, 6.0) * 0.55 + pow(g, 40.0) * 1.2) * (1.0 - smoothstep(0.0, 0.4, hc) * 0.5);
        day += vec3(0.32, 0.18, 0.22) * (1.0 - side) * exp(-hc * 14.0) * 0.6;       // the anti-twilight in the east
        // dusk (4:42 PM, the Sun 8° down): a deep blue dome, a red-orange band in the south-west, dark in the east
        vec3 dzen = vec3(0.015, 0.03, 0.075), dhor = mix(vec3(0.04, 0.05, 0.09), vec3(0.62, 0.24, 0.08), pow(side, 4.0));
        vec3 duskC = mix(dhor, dzen, pow(smoothstep(0.0, 0.5, hc), 0.6)) + vec3(0.25, 0.09, 0.03) * pow(side, 8.0) * exp(-hc * 10.0);
        vec3 col = mix(day, duskC, dusk);
        col = h > 0.0 ? col : mix(col, col * 0.35, smoothstep(0.0, -0.08, h));
        gl_FragColor = vec4(col * k, 1.0);
      }`,
  }));
  dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);

  // ---- the stars (and Saturn, the last entry): point sprites; each shows when it is brighter than lim
  const all = NB_STARS.map((x) => [x[1], x[2], x[3], x[4]]);
  { const r = new RNG(4401); for (let i = 0; i < 1600; i++) { const ra = r.range(0, 24), dec = Math.asin(r.range(-0.45, 1)) * 180 / Math.PI, m = 3.0 + 2.5 * Math.pow(r.next(), 0.55); all.push([ra, dec, m, r.next() < 0.3 ? '#ffd8b0' : r.next() < 0.5 ? '#dfe8ff' : '#fff8ee']); } }
  all.push([NB_BODIES.saturn[0], NB_BODIES.saturn[1], 0.7, '#ffe6b4']);
  const n = all.length, P = new Float32Array(n * 3), M = new Float32Array(n), Cc = new Float32Array(n * 3), tmp = new THREE.Color();
  all.forEach((x, i) => { const d = nbSkyDir(x[0], x[1]); P.set([d[0] * R * 0.97, d[1] * R * 0.97, d[2] * R * 0.97], i * 3); M[i] = x[2]; tmp.set(x[3]); Cc.set([tmp.r, tmp.g, tmp.b], i * 3); });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(P, 3)); sg.setAttribute('mag', new THREE.BufferAttribute(M, 1)); sg.setAttribute('col', new THREE.BufferAttribute(Cc, 3));
  const SAT = n - 1;
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { lim: { value: -9 }, px: { value: 1 }, gain: { value: 1 }, satOn: { value: 1 }, satIdx: { value: SAT }, satK: { value: 1 } },
    vertexShader: `attribute float mag; attribute vec3 col; uniform float lim, px, gain, satOn, satIdx, satK; varying float vA; varying vec3 vC;
      void main(){ float b = pow(10.0, -0.4 * (mag - lim)); float vis = smoothstep(0.0, 0.9, lim - mag + 0.35);
        float isSat = abs(float(gl_VertexID) - satIdx) < 0.5 ? 1.0 : 0.0; vis *= mix(1.0, satOn, isSat);
        vA = vis * min(1.0, 0.35 + 0.25 * b) * gain; vC = col * (1.0 + 0.6 * min(b, 6.0));
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww;
        gl_PointSize = px * clamp(1.6 + 1.25 * log(1.0 + b), 1.6, 7.5) * mix(1.0, satK, isSat); }`,
    fragmentShader: `varying float vA; varying vec3 vC; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard;
        float a = vA * (exp(-r * 3.2) + 0.25 * exp(-r * 0.8)); gl_FragColor = vec4(vC * 2.2, a); }`,
  });
  const stars = new THREE.Points(sg, starMat); stars.frustumCulled = false; stars.renderOrder = -9;
  const cel = new THREE.Group(); scene.add(cel); cel.add(stars);                // (turned with the Earth for a later hour: o2.lstAdd)

  // ---- the Sun: a disc (HDR), and its glare (in the air when it scatters; in your own eye always, smaller)
  const sunG = new THREE.Group(); scene.add(sunG);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(R * 0.0047, 48), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false, depthWrite: false }));
  sunG.add(sunDisc);
  const glareTex = nbDotTex(0.18), glare = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glareTex, color: '#ffd8a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sunG.add(glare);
  sunG.position.copy(sunDir).multiplyScalar(R * 0.95); sunG.lookAt(0, 0, 0); sunDisc.renderOrder = -8; glare.renderOrder = -7;
  // ---- the Moon: a lit sphere (its own shader: sunlight on its face, whatever the scene's lights are doing)
  const moonR = R * 0.95 * Math.tan(MathX.deg(0.26)), sunFromMoon = sunDir.clone();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(moonR, 48, 32), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { ld: { value: sunFromMoon }, k: { value: 1 }, day: { value: 1 } },
    vertexShader: 'varying vec3 vN, vP; void main(){ vN = normalize(mat3(modelMatrix) * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 ld; uniform float k, day; varying vec3 vN, vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9, 78.2, 37.7))) * 43758.5); }
      float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y), mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){ vec3 q = normalize(vP); float maria = smoothstep(0.45, 0.62, n3(q * 2.3 + 1.7)) * 0.38 + 0.12 * n3(q * 9.0);
        float lit = smoothstep(-0.03, 0.12, dot(normalize(vN), normalize(ld)));
        vec3 c = vec3(0.93, 0.92, 0.88) * (1.0 - maria) * lit;
        // in daylight the Moon is a pale disc on the blue: its light only adds to the sky's
        gl_FragColor = vec4(c * mix(1.6, 0.55, day) * k, 1.0); }`,
  }));
  moon.position.copy(moonDir).multiplyScalar(R * 0.95); moon.renderOrder = -8; cel.add(moon);
  // the sky turns about the celestial pole (north, 51.5° up): find the sense of the turn once, from a test star
  const pole = new THREE.Vector3(0, Math.sin(MathX.deg(NB_SKY.lat)), -Math.cos(MathX.deg(NB_SKY.lat))), qq = new THREE.Quaternion();
  const turnSign = (() => { const a = D(5, 20), lst0 = NB_SKY.lst; NB_SKY.lst = lst0 + 1; Object.assign(NB_SKYF, nbSkyFrame()); const b = D(5, 20); NB_SKY.lst = lst0; Object.assign(NB_SKYF, nbSkyFrame());
    qq.setFromAxisAngle(pole, Math.PI / 12); return a.clone().applyQuaternion(qq).distanceTo(b) < 1e-3 ? 1 : -1; })();

  const S = {
    dome, stars, starMat, sunG, sunDisc, glare, moon, sunDir, moonDir, satDir, R, cel, pole,
    dirOf: (ra, dec) => D(ra, dec),
    // a direction as it is lstAdd hours later
    turned: (v, lstAdd) => v.clone().applyQuaternion(qq.setFromAxisAngle(pole, turnSign * lstAdd * Math.PI / 12)),
    // b: how much light bounces (1, 0); dusk 0…1 (4:42 PM); lim: the faintest magnitude your eyes take in now;
    // gain: the stars' brightness on screen (your pupils); px: render pixel scale (1 at 1080)
    update(s, o2 = {}) {
      const b = o2.bounce ?? NBP.bounce(s), dusk = o2.dusk || 0, la = o2.lstAdd || 0;
      cel.quaternion.setFromAxisAngle(pole, turnSign * la * Math.PI / 12);
      dome.material.uniforms.sd.value.copy(sunDir).applyQuaternion(cel.quaternion);
      dome.material.uniforms.k.value = b * (o2.domeK ?? 1); dome.material.uniforms.dusk.value = dusk;
      starMat.uniforms.lim.value = o2.lim ?? -9; starMat.uniforms.px.value = o2.px || 1; starMat.uniforms.gain.value = o2.gain ?? 1;
      starMat.uniforms.satOn.value = NBP.saturnOn(s) ? 1 : 0; starMat.uniforms.satK.value = o2.satK ?? 1;   // (satK: Saturn's dot bigger in a long lens)
      // the Sun: white and 3× brighter when nothing scatters its light away on the way to you
      const white = 1 - b, sun = sunDisc.material.color;
      sun.setRGB(1.0, 0.62 + 0.38 * white, 0.30 + 0.70 * white).multiplyScalar((dusk > 0.5 ? 0 : 1) * (o2.sunK ?? 1) * 40 * (1 + 2 * white));
      sunG.visible = dusk < 0.5;
      const gs = R * (0.11 * b + 0.035 * white) * (o2.glareK ?? 1);
      glare.scale.set(gs, gs, 1); glare.material.color.setRGB(1.0, 0.78 + 0.2 * white, 0.5 + 0.45 * white).multiplyScalar((0.9 * b + 0.5 * white) * (o2.glareI ?? 1));
      // the Moon: its light is 1.28 s old
      moon.visible = NBP.moonOn(s);
      moon.material.uniforms.day.value = b * (1 - dusk); moon.material.uniforms.k.value = o2.moonK ?? 1;
    },
  };
  return S;
}
